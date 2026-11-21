# CardForge · 冥刻之诗

浏览器卡牌对战游戏：单机人机对战 / AI 观战 / 热座 / **联网 PvP（Node 权威服务器）** / 卡组编辑 / 卡牌设计器。

## 架构

```
浏览器 ──HTTPS──▶ nginx（dist/ 静态资源）
   │
   └──WSS /ws──▶ nginx ──▶ Node 对战服务器（server/）
                              ├─ 大厅 / 房间 / 邀请 / 观战 / 聊天
                              └─ 每局一个 vm 沙箱，运行与浏览器完全相同的规则代码（src/client）
```

- **服务器是唯一裁判**：双方牌库只存在于服务器；洗牌、先后手使用 CSPRNG；客户端只发送"意图"（打出哪张牌、目标是谁），
  服务器在无头规则引擎中结算并校验合法性，再按接收者裁剪隐藏信息后下发（对手手牌 / 牌库只有张数，卡牌 uid 随机化）。
- **同一份规则代码**：`server/src/engine/engineHost.js` 把 `src/client/*.js` 原样装进 Node `vm` 沙箱，
  用"假 DOM"吸收所有渲染与特效调用（`fakeDom.js`），因此单机与联机不会出现两套规则分叉。
  会修改状态的特效函数不能被置空，`server/test/engine.test.js` 有静态检查守护这一点。
- 每个动作产生的特效事件（攻击、光束、伤害数字、效果提示……）由服务器录制，按接收者翻转视角后下发，客户端重放后再渲染新局面。

## 目录

| 路径 | 说明 |
| --- | --- |
| `src/client/*.js` | 前端源码（原 2 万行 `game.js` 按功能拆分，`manifest.json` 定义拼接顺序，经典脚本共享全局作用域） |
| `src/client/13a-engine-actions.js` | 玩家动作层：出牌校验、启动、融合、换牌（单机与服务器共用） |
| `src/client/13b-engine-sync.js` | 对局视图序列化 / 隐藏信息裁剪 / 视角翻转 |
| `src/client/15-online-net.js` | 联机客户端（WebSocket，断线自动重连并凭令牌恢复身份） |
| `web/` | `index.html`、`styles.css`、`artEngine.js`、独立卡牌设计器 `designer.html/js`、卡图原件 `art/full/` |
| `server/src/` | Node 对战服务器（`gameServer.js` 大厅与房间、`match.js` 对局与计时、`engine/` 无头规则引擎） |
| `scripts/build.mjs` | 构建：拼接 → 压缩 → 内容哈希 → 卡图缩略图 → gzip/brotli 预压缩，输出 `dist/` |
| `deploy/nginx/` | 生产 nginx 配置（严格 CSP、哈希资源永久缓存、`/ws` 反向代理、按真实 IP 限流） |

## 开发

需要 Node.js ≥ 22。

```bash
npm install
npm run dev          # 开发构建 + 启动服务器（同时托管静态文件）→ http://localhost:8787
npm run build        # 生产构建 → dist/
npm test             # 规则引擎 + 服务器协议测试（含机器人完整对局、断线重连、限流、Origin 校验等）
npm run test:e2e     # 浏览器端到端测试（需先 npm run build；需要 playwright-core 的 chromium-headless-shell）
```

- 前端代码改动后重新 `npm run build:dev` 即可（约 1 秒）；服务器直接读取 `src/client/`，重启生效。
- 新增客户端源文件：放到 `src/client/` 并登记到 `manifest.json` 的合适位置（顶层语句按顺序执行，函数声明在整包内提升）。
- `npm run test:e2e` 设置 `CF_NGINX_BIN=/path/to/nginx` 时，会用 `deploy/nginx` 的生产配置在前面加一层 nginx 一起测试。

### 卡图

- `web/art/full/<内容哈希>.webp` 是卡图原件，`web/art/manifest.json` 记录"卡名 → 文件"。
- 构建时自动生成 480px 缩略图（手牌 / 战场 / 详情使用），原图仅在"原画鉴赏"时加载；所有文件名带内容哈希，可永久缓存。
- 从 SVG 原稿重新打包：`python3 pack_cards_svg.py ./cards_svg`（直接更新 `web/art/`）。
- 旧版单文件包 `cards_art_pack.js` 可用 `npm run art:split -- cards_art_pack.js` 转换。
- 玩家用 Shift+I 本地导入的卡图（IndexedDB）优先级高于内置卡图，行为与旧版一致。

## 部署（Docker）

```bash
docker compose up -d --build                     # web（nginx）绑定 127.0.0.1:8080，server 只在内网
ALLOWED_ORIGINS=https://cards.example.com docker compose up -d --build
```

| 环境变量 | 默认 | 说明 |
| --- | --- | --- |
| `BIND` / `PORT` | `127.0.0.1` / `8080` | nginx 对宿主机暴露的地址与端口 |
| `ALLOWED_ORIGINS` | 空 | 允许建立 WebSocket 的站点（逗号分隔）。留空时要求 Origin 与 Host 一致；隧道改写 Host 导致联机 403 时请显式填写 |
| `TURN_SECONDS` / `MULLIGAN_SECONDS` / `AWAY_GRACE_SECONDS` | 60 / 30 / 45 | 回合时限、换牌时限、断线判负宽限 |
| `MAX_CONNECTIONS_PER_IP` / `MAX_ROOMS` / `MAX_MATCHES` | 12 / 500 / 200 | 资源上限（见 `server/src/config.js`） |

注意：nginx 信任来自 Docker 内网段的 `CF-Connecting-IP`（cloudflared 在宿主机经端口映射进入容器时，来源是网桥网关而非 127.0.0.1）。
**这只在宿主机端口仅绑定 127.0.0.1 时安全**；若改为 `BIND=0.0.0.0` 直接对外，请删除 `deploy/nginx/default.conf` 中的内网 `set_real_ip_from`。

## 联机协议（摘要）

客户端 → 服务器：`HELLO{nickname,avatar,token?}`、`CREATE_ROOM`、`JOIN_ROOM{roomId,password}`、`READY{ready,deckIds}`、
`INVITE / INVITE_ACCEPT / INVITE_DECLINE`、`SPECTATE / SPECTATE_LEAVE`、`MULLIGAN{swapIdx}`、
`ACTION{action: PLAY|ACTIVATE|FUSE|END_TURN, params, reqId}`、`SURRENDER`、`SYNC`、`CHAT`、`EMOTE`。

服务器 → 客户端：`WELCOME{peerId,token}`、`LOBBY`、`ROOM`、`MATCH_START / MATCH_RESUME`、
`STATE{seq,cause,events,view,myTurn,deadline}`、`ACTION_REJECTED`、`OPP_AWAY / OPP_BACK`、`MATCH_END`、`SPECTATE_START`……

所有字符串由服务器清洗（去控制字符 / 双向文本覆盖符、限长），房间密码使用加盐 scrypt 仅存于服务器内存，
每条连接有令牌桶限流，加入房间尝试有独立限流（防密码爆破）。
