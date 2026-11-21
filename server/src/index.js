#!/usr/bin/env node
// CardForge 对战服务器入口：HTTP（健康检查 / 可选静态文件）+ WebSocket（/ws）
import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { WebSocketServer } from 'ws';
import { loadConfig } from './config.js';
import { GameServer } from './gameServer.js';
import { createStaticHandler } from './static.js';
import { getRules } from './cardDb.js';

function makeLogger(level) {
  const order = { debug: 0, info: 1, warn: 2, error: 3 };
  const min = order[level] ?? 1;
  const out = (lvl) => (...args) => { if (order[lvl] >= min) console[lvl === 'debug' ? 'log' : lvl](new Date().toISOString(), lvl.toUpperCase(), ...args); };
  return { debug: out('debug'), info: out('info'), warn: out('warn'), error: out('error') };
}

export function clientIp(req, trustProxy) {
  if (trustProxy) {
    const real = req.headers['x-real-ip'];
    if (typeof real === 'string' && real) return real.trim();
    const xff = req.headers['x-forwarded-for'];
    if (typeof xff === 'string' && xff) return xff.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '';
}

export function originAllowed(req, config) {
  const origin = req.headers.origin;
  if (!origin) return true; // 非浏览器客户端（无 Cookie 鉴权，不存在跨站劫持问题）
  if (config.allowedOrigins.length) return config.allowedOrigins.includes(origin);
  try {
    const o = new URL(origin);
    const host = (config.trustProxy && req.headers['x-forwarded-host']) || req.headers.host;
    return o.host === host;
  } catch { return false; }
}

export function startServer(config = loadConfig(), log = makeLogger(config.logLevel)) {
  getRules(); // 预热卡牌数据库（首次加载规则引擎）
  const game = new GameServer(config, log);
  const serveStatic = config.staticDir ? createStaticHandler(config.staticDir) : null;
  const ipCounts = new Map();

  const server = http.createServer(async (req, res) => {
    if (req.url === '/health' || req.url === '/ws/health') {
      res.writeHead(200, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' }).end('ok\n');
      return;
    }
    if (serveStatic && await serveStatic(req, res)) return;
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('not found\n');
  });
  server.headersTimeout = 15_000;
  server.requestTimeout = 30_000;

  const wss = new WebSocketServer({ noServer: true, maxPayload: config.maxPayloadBytes, perMessageDeflate: { threshold: 2048 } });

  server.on('upgrade', (req, socket, head) => {
    const path = new URL(req.url, 'http://x').pathname;
    if (path !== '/ws') { socket.destroy(); return; }
    if (!originAllowed(req, config)) {
      log.warn(`rejected WebSocket origin=${req.headers.origin} host=${req.headers.host} (set ALLOWED_ORIGINS if this is your site)`);
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
      socket.destroy();
      return;
    }
    const ip = clientIp(req, config.trustProxy);
    const n = ipCounts.get(ip) || 0;
    if (n >= config.maxConnectionsPerIp || wss.clients.size >= config.maxConnections) {
      socket.write('HTTP/1.1 429 Too Many Requests\r\n\r\n');
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      ipCounts.set(ip, (ipCounts.get(ip) || 0) + 1);
      ws.once('close', () => {
        const c = (ipCounts.get(ip) || 1) - 1;
        if (c <= 0) ipCounts.delete(ip); else ipCounts.set(ip, c);
      });
      ws.__cfConn = game.attach(ws, { ip });
    });
  });

  const hb = setInterval(() => game.heartbeat(wss), 20_000);
  hb.unref();

  server.listen(config.port, config.host, () => {
    const addr = server.address();
    log.info(`CardForge server listening on ${addr.address}:${addr.port}${config.staticDir ? ` (static: ${config.staticDir})` : ''}`);
  });

  const close = () => new Promise((resolve) => {
    clearInterval(hb);
    game.shutdown();
    wss.close();
    server.close(() => resolve());
    setTimeout(resolve, 3000).unref();
  });
  return { server, wss, game, close };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const app = startServer();
  for (const sig of ['SIGINT', 'SIGTERM']) {
    process.on(sig, async () => { await app.close(); process.exit(0); });
  }
}
