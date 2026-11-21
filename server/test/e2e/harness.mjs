// 浏览器端到端测试的公共设施：启动带静态托管的服务器 + 收集页面错误 / CSP 违规
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { createServer } from 'node:net';
import { startServer } from '../../src/index.js';
import { loadConfig } from '../../src/config.js';

const freePort = () => new Promise((res) => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });

/** CF_NGINX_BIN 指向 nginx 可执行文件时：用 deploy/nginx 的生产配置在前面挡一层（只替换上游地址与路径） */
async function startNginx(serverPort) {
  const bin = process.env.CF_NGINX_BIN;
  const prefix = mkdtempSync(join(tmpdir(), 'cf-nginx-'));
  const port = await freePort();
  const repo = resolve(dirname(new URL(import.meta.url).pathname), '../../..');
  const snippets = join(repo, 'deploy/nginx/snippets');
  let site = readFileSync(join(repo, 'deploy/nginx/default.conf'), 'utf8')
    .replace('server server:8787;', `server 127.0.0.1:${serverPort};`)
    .replace('listen 80;', `listen 127.0.0.1:${port};`)
    .replace('root /usr/share/nginx/html;', `root ${join(repo, 'dist')};`)
    .replaceAll('/etc/nginx/snippets/', `${snippets}/`);
  mkdirSync(join(prefix, 'logs'), { recursive: true });
  writeFileSync(join(prefix, 'site.conf'), site);
  const mime = process.env.CF_NGINX_MIME || '/etc/nginx/mime.types';
  writeFileSync(join(prefix, 'nginx.conf'), `daemon off; worker_processes 1; pid ${prefix}/nginx.pid; error_log ${prefix}/logs/error.log warn;
events { worker_connections 256; }
http { include ${mime}; default_type application/octet-stream; access_log off;
  client_body_temp_path ${prefix}/cb; proxy_temp_path ${prefix}/px; fastcgi_temp_path ${prefix}/fc; uwsgi_temp_path ${prefix}/uw; scgi_temp_path ${prefix}/sc;
  include ${prefix}/site.conf; }`);
  const proc = spawn(bin, ['-p', prefix, '-c', join(prefix, 'nginx.conf')], { stdio: ['ignore', 'inherit', 'inherit'] });
  for (let i = 0; i < 50; i++) {
    try { const r = await fetch(`http://127.0.0.1:${port}/health`); if (r.ok) break; } catch {}
    await new Promise(r => setTimeout(r, 100));
  }
  return { port, close: () => new Promise(r => { proc.once('exit', r); proc.kill('SIGQUIT'); }) };
}

export async function startApp(overrides = {}) {
  const quiet = { debug() {}, info() {}, warn() {}, error: (...a) => console.error('[server]', ...a) };
  const viaNginx = Boolean(process.env.CF_NGINX_BIN);
  const cfg = { ...loadConfig([]), host: '127.0.0.1', port: 0, staticDir: viaNginx ? '' : 'dist', maxConnectionsPerIp: 100, trustProxy: viaNginx, ...overrides };
  const app = startServer(cfg, quiet);
  await new Promise(r => (app.server.listening ? r() : app.server.once('listening', r)));
  app.base = `http://127.0.0.1:${app.server.address().port}`;
  if (viaNginx) {
    const ng = await startNginx(app.server.address().port);
    app.base = `http://127.0.0.1:${ng.port}`;
    const close = app.close;
    app.close = async () => { await ng.close(); await close(); };
  }
  return app;
}

export async function launch() {
  return chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
}

export async function openPage(browser, base, name, { width = 1600, height = 900 } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.cfName = name;
  page.cfErrors = [];
  page.cfFailed = [];
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) => {
      console.error(`CSP_VIOLATION ${e.violatedDirective} ${e.blockedURI} ${e.sourceFile}:${e.lineNumber}`);
    });
  });
  page.on('console', (m) => { if (m.type() === 'error') page.cfErrors.push(m.text()); });
  page.on('pageerror', (e) => page.cfErrors.push(`PAGEERROR ${e.message}\n${(e.stack || '').split('\n').slice(0, 4).join('\n')}`));
  page.on('requestfailed', (r) => page.cfFailed.push(`${r.url()} ${r.failure()?.errorText}`));
  page.on('response', (r) => { if (r.status() >= 400) page.cfFailed.push(`${r.status()} ${r.url()}`); });
  await page.goto(base + '/', { waitUntil: 'load' });
  return page;
}
