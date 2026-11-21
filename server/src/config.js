// 运行配置：全部可用环境变量覆盖（见 README「部署」一节）
const env = process.env;
const num = (v, d) => (v !== undefined && v !== '' && Number.isFinite(Number(v)) ? Number(v) : d);

export function loadConfig(argv = process.argv.slice(2)) {
  const arg = (name) => {
    const i = argv.indexOf(`--${name}`);
    return i !== -1 ? argv[i + 1] : undefined;
  };
  return {
    host: arg('host') || env.HOST || '0.0.0.0',
    port: num(arg('port') || env.PORT, 8787),
    // 仅开发/单机部署时由 Node 直接托管静态文件；生产环境由 nginx 托管 dist/
    staticDir: arg('static') || env.STATIC_DIR || '',
    // 位于反向代理之后时，信任 X-Forwarded-For / X-Real-IP（仅当代理是可信的本机/内网 nginx 时开启）
    trustProxy: (arg('trust-proxy') || env.TRUST_PROXY) === '1',
    // 允许的浏览器 Origin（逗号分隔）。留空：要求 Origin 与请求 Host 一致（同源部署）
    allowedOrigins: String(env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean),
    turnSeconds: num(env.TURN_SECONDS, 60),
    mulliganSeconds: num(env.MULLIGAN_SECONDS, 30),
    awayGraceSeconds: num(env.AWAY_GRACE_SECONDS, 45),
    sessionGraceSeconds: num(env.SESSION_GRACE_SECONDS, 60),
    inviteSeconds: num(env.INVITE_SECONDS, 10),
    maxConnections: num(env.MAX_CONNECTIONS, 2000),
    maxConnectionsPerIp: num(env.MAX_CONNECTIONS_PER_IP, 12),
    maxRooms: num(env.MAX_ROOMS, 500),
    maxMatches: num(env.MAX_MATCHES, 200),
    maxPayloadBytes: num(env.MAX_PAYLOAD_BYTES, 32 * 1024),
    logLevel: env.LOG_LEVEL || 'info',
  };
}
