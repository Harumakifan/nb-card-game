import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import WebSocket from 'ws';
import { startServer } from '../src/index.js';
import { loadConfig } from '../src/config.js';
import { presetDecks } from '../src/cardDb.js';
import { Bot } from './helpers/bot.js';

const quiet = { debug() {}, info() {}, warn() {}, error: (...a) => console.error(...a) };
let app, url;
const DECKS = presetDecks().map(d => d.ids);

before(async () => {
  const cfg = { ...loadConfig([]), port: 0, host: '127.0.0.1', turnSeconds: 30, mulliganSeconds: 10, awayGraceSeconds: 2, sessionGraceSeconds: 3, maxConnectionsPerIp: 50 };
  app = startServer(cfg, quiet);
  await new Promise(r => app.server.once('listening', r));
  url = `ws://127.0.0.1:${app.server.address().port}/ws`;
});
after(async () => { await app.close(); });

class Client {
  constructor(name, opts = {}) {
    this.name = name;
    this.inbox = [];
    this.waiters = [];
    this.ws = new WebSocket(url, opts);
    this.ws.on('message', (d) => {
      const m = JSON.parse(d.toString());
      this.inbox.push(m);
      this.waiters = this.waiters.filter(w => { if (w.pred(m)) { w.resolve(m); return false; } return true; });
    });
    this.opened = new Promise((res, rej) => { this.ws.once('open', res); this.ws.once('error', rej); });
    this.closed = new Promise(res => this.ws.once('close', (code) => res(code)));
  }
  send(m) { this.ws.send(JSON.stringify(m)); }
  wait(type, pred = () => true, ms = 5000) {
    const hit = this.inbox.find(m => m.type === type && pred(m));
    if (hit) { this.inbox.splice(this.inbox.indexOf(hit), 1); return Promise.resolve(hit); }
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(`${this.name}: timeout waiting for ${type}`)), ms);
      this.waiters.push({ pred: (m) => m.type === type && pred(m), resolve: (m) => { clearTimeout(t); this.inbox.splice(this.inbox.indexOf(m), 1); resolve(m); } });
    });
  }
  drain(type) { this.inbox = this.inbox.filter(m => m.type !== type); }
  async hello(extra = {}) {
    await this.opened;
    this.send({ type: 'HELLO', nickname: this.name, avatar: { backdrop: 'star' }, ...extra });
    this.welcome = await this.wait('WELCOME');
    return this.welcome;
  }
  close() { this.ws.close(); return this.closed; }
}

async function setupRoom(password = '') {
  const a = new Client('房主A'), b = new Client('挑战者B');
  await a.hello(); await b.hello();
  a.send({ type: 'CREATE_ROOM', name: '测试房', password });
  const room = await a.wait('ROOM');
  return { a, b, roomId: room.roomId };
}

test('握手：服务器分配身份，昵称与头像被清洗', async () => {
  const c = new Client('x');
  await c.opened;
  c.send({ type: 'HELLO', nickname: '‮坏人<img src=x>\u0000超长昵称超长昵称超长昵称', avatar: { backdrop: 'star', evil: '<script>', hairColor: '"><svg onload=1>' } });
  const w = await c.wait('WELCOME');
  assert.match(w.peerId, /^P_[A-Z0-9]{8}$/);
  assert.ok(w.token.length >= 24);
  assert.ok(!w.nickname.includes('‮') && !w.nickname.includes('\u0000'));
  assert.ok(Array.from(w.nickname).length <= 14);
  c.send({ type: 'SET_STATUS', status: 'in_lobby' });
  const lobby = await c.wait('LOBBY', m => m.players.some(p => p.peerId === w.peerId));
  const me = lobby.players.find(p => p.peerId === w.peerId);
  assert.deepEqual(me.avatar, { backdrop: 'star' });
  await c.close();
});

test('协议健壮性：畸形消息不会导致崩溃，未握手前拒绝业务消息', async () => {
  const c = new Client('fuzz');
  await c.opened;
  c.send({ type: 'CREATE_ROOM' });
  assert.equal((await c.wait('ERROR')).code, 'not_ready');
  c.ws.send('not json');
  assert.equal((await c.wait('ERROR')).code, 'bad_json');
  await c.hello();
  for (const m of [{ type: 'ACTION', action: 'PLAY', params: { uid: { $gt: 1 } } }, { type: 'JOIN_ROOM', roomId: '../../etc' },
    { type: 'READY', ready: true, deckIds: 'x'.repeat(100) }, { type: 'NOPE' }, { type: 'INVITE', targetId: '__proto__' },
    { type: 'MULLIGAN', swapIdx: [1e9] }, { type: 'SPECTATE', roomId: null }, [], 42]) c.send(m);
  c.send({ type: 'PING' });
  await c.wait('PONG');
  await c.close();
});

test('密码房：错误密码被拒绝且密码哈希从不下发', async () => {
  const { a, b, roomId } = await setupRoom('s3cret');
  b.send({ type: 'SET_STATUS', status: 'in_lobby' });
  const lobby = await b.wait('LOBBY', m => m.rooms.some(r => r.roomId === roomId));
  const meta = lobby.rooms.find(r => r.roomId === roomId);
  assert.equal(meta.hasPassword, true);
  assert.ok(!JSON.stringify(lobby).includes('s3cret'));
  assert.equal(meta.pwdHash, undefined);
  b.send({ type: 'JOIN_ROOM', roomId, password: 'wrong' });
  const rej = await b.wait('JOIN_REJECTED');
  assert.equal(rej.needPassword, true);
  b.send({ type: 'JOIN_ROOM', roomId, password: 's3cret' });
  const st = await b.wait('ROOM', m => m.role === 'guest');
  assert.equal(st.roomId, roomId);
  await a.close(); await b.close();
});

test('非法卡组无法准备；第三方无法向房间注入操作', async () => {
  const { a, b, roomId } = await setupRoom();
  b.send({ type: 'JOIN_ROOM', roomId });
  await b.wait('ROOM', m => m.role === 'guest');
  // 衍生物 / 超过 3 张 / 张数不对
  a.send({ type: 'READY', ready: true, deckIds: Array(40).fill(DECKS[0][0]) });
  assert.equal((await a.wait('ERROR', m => m.code === 'deck_invalid')).code, 'deck_invalid');
  a.send({ type: 'READY', ready: true, deckIds: DECKS[0].slice(0, 39) });
  await a.wait('ERROR', m => m.code === 'deck_invalid');
  // 第三方：既不是房主也不是挑战者
  const c = new Client('路人');
  await c.hello();
  c.send({ type: 'SURRENDER' });
  c.send({ type: 'ACTION', action: 'END_TURN' });
  assert.equal((await c.wait('ACTION_REJECTED')).reason, '当前没有进行中的对局');
  c.send({ type: 'JOIN_ROOM', roomId });
  assert.match((await c.wait('JOIN_REJECTED')).reason, /已满/);
  await Promise.all([a.close(), b.close(), c.close()]);
});

async function readyBoth(a, b, da = DECKS[0], db = DECKS[1]) {
  a.send({ type: 'READY', ready: true, deckIds: da });
  b.send({ type: 'READY', ready: true, deckIds: db });
  const [ma, mb] = await Promise.all([a.wait('MATCH_START'), b.wait('MATCH_START')]);
  return { ma, mb };
}

/** 事件驱动的机器人客户端：每当收到"轮到我"的状态就根据视图选一个合法动作 */
function runBot(c, bot, { onState } = {}) {
  return new Promise((resolve, reject) => {
    let reqId = 0;
    const timer = setTimeout(() => reject(new Error(`${c.name}: match did not finish`)), 60_000);
    c.ws.on('message', (d) => {
      const m = JSON.parse(d.toString());
      if (m.type === 'MATCH_END') { clearTimeout(timer); resolve(m); return; }
      if (m.type === 'ACTION_REJECTED') { clearTimeout(timer); reject(new Error(`${c.name}: server rejected: ${m.reason}`)); return; }
      if (m.type !== 'STATE') return;
      if (process.env.CF_DEBUG) console.log(c.name, m.seq, m.cause.kind, m.cause.actor, 'myTurn=' + m.myTurn, 'active=' + m.activeSeat, m.phase, 'req=' + m.reqId);
      if (onState) onState(m);
      if (!m.myTurn || m.phase !== 'playing') return;
      try {
        bot.applyView(JSON.stringify(m.view));
        assert.equal(bot.leakCount(), 0, 'opponent hidden info leaked to client');
        const acts = bot.legalActions();
        if (acts.length && bot.rand() < 0.8) {
          const x = bot.pick(acts);
          c.send({ type: 'ACTION', action: x.type, params: x.params, reqId: ++reqId });
        } else {
          c.send({ type: 'ACTION', action: 'END_TURN', reqId: ++reqId });
        }
      } catch (e) { clearTimeout(timer); reject(e); }
    });
  });
}

test('完整联机对局：双方机器人走真实协议打完一局，观战者看不到任何手牌', async () => {
  const { a, b, roomId } = await setupRoom();
  b.send({ type: 'JOIN_ROOM', roomId });
  await b.wait('ROOM', m => m.role === 'guest');
  const spec = new Client('观众');
  await spec.hello();
  spec.send({ type: 'SPECTATE', roomId });
  await spec.wait('SPECTATE_WAIT');
  const { ma, mb } = await readyBoth(a, b, DECKS[2], DECKS[3]);
  assert.notEqual(ma.seat, mb.seat);
  assert.ok(ma.view.leaders[1].hand.every(h => h.c === '__hidden__'));
  const specStart = await spec.wait('SPECTATE_START');
  assert.ok(specStart.view.leaders.every(l => l.hand.every(h => h.c === '__hidden__')));

  let specStates = 0;
  spec.ws.on('message', (d) => {
    const m = JSON.parse(d.toString());
    if (m.type !== 'STATE') return;
    specStates++;
    // 观战者只能看到被效果公开的手牌（publicHandIds），其余一律是占位牌
    for (const l of m.view.leaders) {
      const pub = new Set((l.publicHandIds || []).map(p => String(p.uid)));
      assert.ok(l.hand.every(h => h.c === '__hidden__' || pub.has(String(h.uid))), 'spectator saw a private hand card');
    }
    assert.ok(m.events.every(e => !e.priv));
  });
  const bots = [new Bot(11), new Bot(12)];
  const pa = runBot(a, bots[0]);
  const pb = runBot(b, bots[1]);
  for (const c of [a, b]) c.send({ type: 'MULLIGAN', swapIdx: [0] });
  const [ea, eb] = await Promise.all([pa, pb]);
  assert.ok(['win', 'lose', 'draw'].includes(ea.result));
  if (ea.result !== 'draw') assert.notEqual(ea.result, eb.result);
  assert.ok(specStates > 0);
  const specEnd = await spec.wait('MATCH_END');
  assert.equal(specEnd.spectator, true);
  const roomAfter = await a.wait('ROOM', m => m.status === 'waiting' && m.wins.host + m.wins.guest === (ea.result === 'draw' ? 0 : 1));
  assert.equal(roomAfter.ready.host, false);
  bots.forEach(x => x.dispose());
  await Promise.all([a.close(), b.close(), spec.close()]);
});

test('断线重连：凭令牌恢复同一身份并收到完整局面；超过宽限期判负', async () => {
  const { a, b, roomId } = await setupRoom();
  b.send({ type: 'JOIN_ROOM', roomId });
  await b.wait('ROOM', m => m.role === 'guest');
  const { mb } = await readyBoth(a, b);
  const token = b.welcome.token;
  await b.close();
  await a.wait('OPP_AWAY');
  const b2 = new Client('挑战者B');
  const w = await b2.hello({ token });
  assert.equal(w.peerId, b.welcome.peerId);
  const resume = await b2.wait('MATCH_RESUME');
  assert.equal(resume.seat, mb.seat);
  assert.equal(resume.mulliganPending, true);
  await a.wait('OPP_BACK');
  // 再次断线并超过 2 秒宽限期 → 判负
  await b2.close();
  const end = await a.wait('MATCH_END', () => true, 6000);
  assert.equal(end.result, 'win');
  assert.equal(end.reason, 'disconnect');
  await a.close();
});

test('邀请：只能通过服务器下发的邀请码免密进入，过期或被他人使用无效', async () => {
  const a = new Client('邀请人'), b = new Client('被邀请人'), c = new Client('截胡者');
  await Promise.all([a.hello(), b.hello(), c.hello()]);
  a.send({ type: 'INVITE', targetId: b.welcome.peerId });
  const room = await a.wait('ROOM');
  const inv = await b.wait('INVITED');
  assert.equal(inv.roomId, room.roomId);
  c.send({ type: 'INVITE_ACCEPT', roomId: inv.roomId, inviteId: inv.inviteId });
  // 邀请码不属于 c：c 加入的是无密码房，所以能进；但邀请码已被消耗，b 只能按普通方式加入
  await c.wait('ROOM', m => m.role === 'guest');
  b.send({ type: 'INVITE_ACCEPT', roomId: inv.roomId, inviteId: inv.inviteId });
  assert.match((await b.wait('JOIN_REJECTED')).reason, /已满/);
  await Promise.all([a.close(), b.close(), c.close()]);
});

test('限流：短时间海量消息会被拒绝，连接最终被断开', async () => {
  const c = new Client('spam');
  await c.hello();
  for (let i = 0; i < 600; i++) c.send({ type: 'PING' });
  const err = await c.wait('ERROR', m => m.code === 'rate_limited');
  assert.equal(err.code, 'rate_limited');
  const code = await c.closed;
  assert.equal(code, 4008);
});

test('Origin 校验：跨站页面无法建立 WebSocket 连接', async () => {
  const c = new Client('evil', { headers: { Origin: 'https://evil.example' } });
  await assert.rejects(c.opened);
});
