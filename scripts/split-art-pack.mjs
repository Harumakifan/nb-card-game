// 迁移脚本：把旧版单文件卡图包 cards_art_pack.js（84MB，WebP 再 base64 内嵌在 JS 里）
// 拆成 web/art/full/<内容哈希>.webp + web/art/manifest.json。
// 拆分后的 webp 是卡图"原件"（不重新压缩，字节与原包完全一致）；缩略图由 build.mjs 生成。
//
// 用法：node scripts/split-art-pack.mjs [cards_art_pack.js]
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const src = process.argv[2] || 'cards_art_pack.js';
const outDir = join('web', 'art');
const fullDir = join(outDir, 'full');
mkdirSync(fullDir, { recursive: true });

const raw = readFileSync(src, 'utf8');
// 文件格式：window.CF_SVG_ART_PACK = Object.assign(window.CF_SVG_ART_PACK || {}, {"卡名":"data:image/webp;base64,..."});
const start = raw.indexOf('{"');
const end = raw.lastIndexOf('}');
if (start === -1 || end <= start) throw new Error('无法识别的卡图包格式');
const pack = JSON.parse(raw.slice(start, end + 1));

const manifest = { version: 1, cards: {} };
let bytes = 0, written = 0;
for (const [name, uri] of Object.entries(pack)) {
  const m = /^data:image\/(webp|png|jpeg);base64,(.+)$/s.exec(String(uri));
  if (!m) { console.warn(`  [跳过] ${name}: 不是 base64 图片`); continue; }
  const buf = Buffer.from(m[2], 'base64');
  const ext = m[1] === 'jpeg' ? 'jpg' : m[1];
  const hash = createHash('sha256').update(buf).digest('hex').slice(0, 16);
  const file = `${hash}.${ext}`;
  const path = join(fullDir, file);
  if (!existsSync(path)) { writeFileSync(path, buf); written++; }
  manifest.cards[name] = { full: `art/full/${file}` };
  bytes += buf.length;
}
writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 1) + '\n');
console.log(`完成：${Object.keys(manifest.cards).length} 张卡图，新写入 ${written} 个文件，合计 ${(bytes / 1048576).toFixed(1)} MB（原包 ${(raw.length / 1048576).toFixed(1)} MB）`);
