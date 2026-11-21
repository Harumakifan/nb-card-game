#!/usr/bin/env node
// CardForge 前端构建：src/client/*.js（按 manifest 顺序拼接，语义与旧版单文件 game.js 完全一致）
//   → 压缩 + sourcemap → 内容哈希文件名 → 改写 index.html / designer.html 引用
//   → 卡图：复制原图 + 生成缩略图 + 带哈希的清单 → gzip / brotli 预压缩
//
// 用法：node scripts/build.mjs [--dev] [--out dist]
//   --dev  不压缩、不预压缩（便于调试）；仍然生成哈希文件名，与生产环境行为一致
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, copyFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync, brotliCompressSync, constants as zc } from 'node:zlib';
import { transformSync } from 'esbuild';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const DEV = args.includes('--dev');
const OUT = join(ROOT, args.includes('--out') ? args[args.indexOf('--out') + 1] : 'dist');
const WEB = join(ROOT, 'web');
const CLIENT = join(ROOT, 'src', 'client');
const THUMB_CACHE = join(ROOT, 'node_modules', '.cache', 'cf-art-thumbs');
const THUMB_MAX = 480;
const THUMB_QUALITY = 80;

const t0 = Date.now();
const hash = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 12);
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const report = [];

function emit(relPath, content) {
  const p = join(OUT, relPath);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content);
  return p;
}

/** 写入带内容哈希的文件，返回发布路径（相对 dist） */
function emitHashed(name, content, { map } = {}) {
  const ext = extname(name);
  const base = basename(name, ext);
  const dir = dirname(name) === '.' ? '' : dirname(name) + '/';
  const rel = `${dir}${base}.${hash(content)}${ext}`;
  let body = content;
  if (map) {
    emit(`${rel}.map`, map);
    body = Buffer.concat([Buffer.from(content), Buffer.from(`\n//# sourceMappingURL=${basename(rel)}.map\n`)]);
  }
  emit(rel, body);
  report.push([rel, Buffer.byteLength(body)]);
  return rel;
}

function jsAsset(name, code, sourcefile) {
  if (DEV) return emitHashed(name, Buffer.from(code));
  const r = transformSync(code, {
    loader: 'js', minify: true, sourcemap: 'external', sourcefile, legalComments: 'none', charset: 'utf8', target: 'es2020',
  });
  return emitHashed(name, Buffer.from(r.code), { map: r.map });
}

// ---------------------------------------------------------------- 1. 客户端脚本
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const parts = JSON.parse(readFileSync(join(CLIENT, 'manifest.json'), 'utf8'));
for (const f of parts) {
  try { transformSync(readFileSync(join(CLIENT, f), 'utf8'), { loader: 'js' }); }
  catch (e) { console.error(`✖ ${f} 无法独立解析（拆分边界必须落在顶层语句之间）:`, e.errors?.[0]?.text); process.exit(1); }
}
const bundle = parts.map(f => readFileSync(join(CLIENT, f), 'utf8')).join('');
const gameJs = jsAsset('game.js', bundle, 'game.js');
const artEngineJs = jsAsset('artEngine.js', readFileSync(join(WEB, 'artEngine.js'), 'utf8'), 'artEngine.js');
const designerJs = jsAsset('designer.js', readFileSync(join(WEB, 'designer.js'), 'utf8'), 'designer.js');

let css = readFileSync(join(WEB, 'styles.css'), 'utf8');
if (!DEV) css = transformSync(css, { loader: 'css', minify: true, legalComments: 'none', charset: 'utf8' }).code;
const stylesCss = emitHashed('styles.css', Buffer.from(css));

// ---------------------------------------------------------------- 2. 卡图
async function buildArt() {
  const srcManifestPath = join(WEB, 'art', 'manifest.json');
  if (!existsSync(srcManifestPath)) { console.warn('⚠ 未找到 web/art/manifest.json，跳过卡图（游戏将使用程序绘制的默认卡面）'); return null; }
  let sharp = null;
  try { sharp = (await import('sharp')).default; } catch { console.warn('⚠ 未安装 sharp，缩略图将直接使用原图'); }
  const src = JSON.parse(readFileSync(srcManifestPath, 'utf8'));
  mkdirSync(THUMB_CACHE, { recursive: true });
  const out = { version: 1, cards: {} };
  let fullBytes = 0, thumbBytes = 0, made = 0;
  const entries = Object.entries(src.cards || {});
  const doneByFile = new Map();
  for (const [name, e] of entries) {
    if (!e || !e.full) continue;
    if (doneByFile.has(e.full)) { out.cards[name] = doneByFile.get(e.full); continue; }
    const fullSrc = join(WEB, e.full);
    const buf = readFileSync(fullSrc);
    const full = `art/full/${basename(e.full)}`;
    mkdirSync(join(OUT, 'art', 'full'), { recursive: true });
    copyFileSync(fullSrc, join(OUT, full));
    fullBytes += buf.length;
    let thumbBuf = buf;
    if (sharp) {
      const cacheFile = join(THUMB_CACHE, `${hash(buf)}-${THUMB_MAX}-${THUMB_QUALITY}.webp`);
      if (existsSync(cacheFile)) thumbBuf = readFileSync(cacheFile);
      else {
        thumbBuf = await sharp(buf).resize({ width: THUMB_MAX, height: THUMB_MAX, fit: 'inside', withoutEnlargement: true }).webp({ quality: THUMB_QUALITY, effort: 5 }).toBuffer();
        writeFileSync(cacheFile, thumbBuf);
        made++;
      }
    }
    const thumb = `art/thumb/${hash(thumbBuf)}.webp`;
    emit(thumb, thumbBuf);
    thumbBytes += thumbBuf.length;
    const rec = { thumb, full };
    doneByFile.set(e.full, rec);
    out.cards[name] = rec;
  }
  const manifestRel = emitHashed('art/manifest.json', Buffer.from(JSON.stringify(out)));
  console.log(`卡图：${entries.length} 张，原图 ${(fullBytes / 1048576).toFixed(1)} MB，缩略图 ${(thumbBytes / 1048576).toFixed(1)} MB（新生成 ${made} 张）`);
  return manifestRel;
}
const artManifest = await buildArt();

// ---------------------------------------------------------------- 3. HTML
function rewriteHtml(file, replacements) {
  let html = readFileSync(join(WEB, file), 'utf8');
  for (const [re, to] of replacements) {
    const before = html;
    html = html.replace(re, to);
    if (html === before) { console.error(`✖ ${file}: 未找到需要改写的引用 ${re}`); process.exit(1); }
  }
  return html;
}

const indexHtml = rewriteHtml('index.html', [
  [/<meta http-equiv="Cache-Control"[^>]*>\s*<meta http-equiv="Pragma"[^>]*>\s*<meta http-equiv="Expires"[^>]*>\s*/, ''],
  [/href="styles\.css(\?[^"]*)?"/, `href="${stylesCss}"`],
  [/src="artEngine\.js(\?[^"]*)?"/, `src="${artEngineJs}"`],
  [/src="game\.js(\?[^"]*)?"/, `src="${gameJs}"`],
  [/<meta charset="UTF-8">/, `<meta charset="UTF-8">\n${artManifest ? `<meta name="cf-art-manifest" content="${artManifest}">\n` : ''}<meta name="cf-build" content="${new Date().toISOString()}">`],
]);
emit('index.html', indexHtml);
emit('designer.html', rewriteHtml('designer.html', [[/src="designer\.js"/, `src="${designerJs}"`]]));
copyFileSync(join(WEB, 'gd-sources.json'), join(OUT, 'gd-sources.json'));

// ---------------------------------------------------------------- 4. 预压缩（nginx gzip_static / Node 静态服务均会优先使用）
function walk(dir) {
  return readdirSync(dir).flatMap(n => { const p = join(dir, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
}
if (!DEV) {
  for (const p of walk(OUT)) {
    if (!/\.(js|css|html|json|map|svg)$/.test(p)) continue;
    const buf = readFileSync(p);
    if (buf.length < 1024) continue;
    writeFileSync(p + '.gz', gzipSync(buf, { level: 9 }));
    writeFileSync(p + '.br', brotliCompressSync(buf, { params: { [zc.BROTLI_PARAM_QUALITY]: 11, [zc.BROTLI_PARAM_SIZE_HINT]: buf.length } }));
  }
}

for (const [rel, size] of report.filter(([r]) => !r.startsWith('art/'))) {
  const gz = existsSync(join(OUT, rel + '.gz')) ? ` (gzip ${kb(statSync(join(OUT, rel + '.gz')).size)})` : '';
  console.log(`  ${rel.padEnd(34)} ${kb(size)}${gz}`);
}
console.log(`✔ 构建完成 → ${OUT}（${DEV ? '开发模式' : '生产模式'}，${((Date.now() - t0) / 1000).toFixed(1)}s）`);
