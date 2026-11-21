// 开发 / 单机部署用的静态文件服务（生产环境推荐 nginx，见 deploy/nginx.conf）
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { join, normalize, extname, sep, resolve, basename } from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

export const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data: blob:; media-src 'self' blob: data:; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; frame-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
};

export function createStaticHandler(rootDir) {
  const root = resolve(rootDir);
  return async function serveStatic(req, res) {
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405).end(); return true; }
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.writeHead(400).end(); return true; }
    if (pathname.includes('\0')) { res.writeHead(400).end(); return true; }
    if (pathname.endsWith('/')) pathname += 'index.html';
    const file = normalize(join(root, pathname));
    if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403).end(); return true; }
    let st;
    try { st = await stat(file); } catch { return false; }
    if (!st.isFile()) return false;

    const ext = extname(file);
    const headers = { ...SECURITY_HEADERS, 'Content-Type': TYPES[ext] || 'application/octet-stream' };
    // 卡牌设计器以同源 iframe 嵌入主页面，只对它放宽为 frame-ancestors 'self'
    if (basename(file) === 'designer.html') headers['Content-Security-Policy'] = SECURITY_HEADERS['Content-Security-Policy'].replace("frame-ancestors 'none'", "frame-ancestors 'self'");
    // 带内容哈希的文件（xxx.<8位以上十六进制>.ext）可永久缓存；index.html 每次校验
    headers['Cache-Control'] = /\.[0-9a-f]{8,}\.[a-z0-9]+$/.test(file) ? 'public, max-age=31536000, immutable' : 'no-cache';

    let body = file;
    const accept = String(req.headers['accept-encoding'] || '');
    for (const [enc, suffix] of [['br', '.br'], ['gzip', '.gz']]) {
      if (!accept.includes(enc)) continue;
      try {
        const cst = await stat(file + suffix);
        if (cst.isFile()) { body = file + suffix; headers['Content-Encoding'] = enc; headers.Vary = 'Accept-Encoding'; st = cst; break; }
      } catch {}
    }
    headers['Content-Length'] = st.size;
    res.writeHead(200, headers);
    if (req.method === 'HEAD') { res.end(); return true; }
    createReadStream(body).on('error', () => res.destroy()).pipe(res);
    return true;
  };
}
