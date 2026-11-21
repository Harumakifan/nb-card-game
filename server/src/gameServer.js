// 大厅 / 房间 / 会话管理 + 消息分发。所有身份（peerId、房间号、邀请）均由服务器生成，
// 客户端只能用服务器下发的标识引用对象，无法冒充他人或伪造对局状态。
import { randomInt } from 'node:crypto';
import {
  cleanText, cleanAvatar, cleanDeckIds, cleanRoomId, cleanAction, isToken, isId, intList, int,
  LIMITS, PRESENCE_STATUSES,
} from './protocol.js';
import { hashPassword, verifyPassword, randomCode, newPeerId, newToken, TokenBucket } from './security.js';
import { cardExists, validateDeck, getRules } from './cardDb.js';
import { Match } from './match.js';

const OPEN = 1;
const MAX_SPECTATORS = 30;
const LOBBY_LIST_CAP = 120;

class Session {
  constructor(id, token) {
    this.id = id;
    this.token = token;
    this.nickname = '';
    this.avatar = {};
    this.status = 'idle';
    this.ws = null;
    this.ip = '';
    this.roomId = null;
    this.spectating = null;
    this.goneTimer = null;
    this.busy = false;
    this.chatBucket = new TokenBucket(6, 1);
    this.joinBucket = new TokenBucket(6, 0.1);   // 每 10 秒恢复 1 次加入尝试（防密码爆破）
    this.inviteBucket = new TokenBucket(3, 0.3);
    this.lastSeen = Date.now();
  }
}

export class Room {
  constructor(server, { id, name, hostId, pwd }) {
    this.server = server;
    this.id = id;
    this.name = name;
    this.hostId = hostId;
    this.guestId = null;
    this.pwd = pwd;
    this.createdAt = Date.now();
    this.ready = { host: false, guest: false };
    this.editing = { host: false, guest: false };
    this.decks = { host: null, guest: null };
    this.wins = { host: 0, guest: 0 };
    this.spectators = new Set();
    this.invites = new Map();
    this.match = null;
  }
  _s(id) { return id ? this.server.sessions.get(id) : null; }
  hostName() { return this._s(this.hostId)?.nickname || '房主'; }
  guestName() { return this._s(this.guestId)?.nickname || '挑战者'; }
  hostAvatar() { return this._s(this.hostId)?.avatar || null; }
  guestAvatar() { return this._s(this.guestId)?.avatar || null; }
  roleOf(sid) { return sid === this.hostId ? 'host' : (sid === this.guestId ? 'guest' : null); }
  members() { return [this.hostId, this.guestId].filter(Boolean); }
  get playing() { return Boolean(this.match && !this.match.ended); }

  spectatorList() {
    return [...this.spectators].map(id => this._s(id)).filter(Boolean).map(s => ({ id: s.id, name: s.nickname, avatar: s.avatar }));
  }

  publicMeta() {
    const info = this.playing ? this.match.publicInfo() : { turn: 0, hostHp: 30, guestHp: 30 };
    return {
      roomId: this.id,
      roomName: this.name,
      hostId: this.hostId,
      hostName: this.hostName(),
      hostAvatar: this.hostAvatar(),
      guestId: this.guestId || '',
      guestName: this.guestId ? this.guestName() : '',
      guestAvatar: this.guestId ? this.guestAvatar() : null,
      hasPassword: Boolean(this.pwd),
      playerCount: this.guestId ? 2 : 1,
      status: this.playing ? 'playing' : 'waiting',
      turn: info.turn, hostHp: info.hostHp, guestHp: info.guestHp,
      spectators: this.spectatorList().slice(0, 20),
      spectatorCount: this.spectators.size,
      ts: Date.now(),
    };
  }

  memberState(sid) {
    const host = this._s(this.hostId);
    const guest = this._s(this.guestId);
    return {
      type: 'ROOM',
      roomId: this.id,
      roomName: this.name,
      role: this.roleOf(sid),
      hasPassword: Boolean(this.pwd),
      hostId: this.hostId, hostName: this.hostName(), hostAvatar: this.hostAvatar(), hostOnline: Boolean(host && host.ws),
      guestId: this.guestId || '', guestName: this.guestId ? this.guestName() : '', guestAvatar: this.guestId ? this.guestAvatar() : null,
      guestOnline: Boolean(guest && guest.ws),
      ready: { ...this.ready },
      editing: { ...this.editing },
      wins: { ...this.wins },
      status: this.playing ? 'playing' : 'waiting',
      spectators: this.spectatorList(),
    };
  }
}

export class GameServer {
  constructor(config, log = console) {
    this.config = config;
    this.log = log;
    this.sessions = new Map();
    this.tokens = new Map();
    this.rooms = new Map();
    this.lobbyTimer = null;
    this.stats = { connections: 0, messages: 0, rejected: 0 };
  }

  // ------------------------------------------------------------------ 传输层
  attach(ws, { ip = '' } = {}) {
    const conn = { ws, ip, session: null, bucket: new TokenBucket(80, 40), strikes: 0, lastRateWarn: 0, alive: true };
    this.stats.connections++;
    ws.on('message', (data, isBinary) => this._onMessage(conn, data, isBinary));
    ws.on('close', () => this._onClose(conn));
    ws.on('pong', () => { conn.alive = true; });
    ws.on('error', () => {});
    conn.helloTimer = setTimeout(() => { if (!conn.session) ws.close(4000, 'hello timeout'); }, 10_000);
    conn.helloTimer.unref?.();
    return conn;
  }

  send(sid, msg) {
    const s = this.sessions.get(sid);
    if (!s || !s.ws || s.ws.readyState !== OPEN) return false;
    if (s.ws.bufferedAmount > 4 * 1024 * 1024) { s.ws.close(4009, 'slow consumer'); return false; }
    s.ws.send(JSON.stringify(msg));
    return true;
  }

  _sendConn(conn, msg) {
    if (conn.ws.readyState === OPEN) conn.ws.send(JSON.stringify(msg));
  }

  _error(conn, code, message, extra = {}) {
    this._sendConn(conn, { type: 'ERROR', code, message, ...extra });
  }

  _onMessage(conn, data, isBinary) {
    if (isBinary) { conn.ws.close(1003, 'binary not supported'); return; }
    if (!conn.bucket.take()) {
      this.stats.rejected++;
      if (++conn.strikes > 200) { conn.ws.close(4008, 'rate limited'); return; }
      const now = Date.now();
      if (now - conn.lastRateWarn > 2000) { conn.lastRateWarn = now; this._error(conn, 'rate_limited', '操作过于频繁，请稍后再试'); }
      return;
    }
    let msg;
    try { msg = JSON.parse(data.toString('utf8')); } catch { this._error(conn, 'bad_json', '消息格式错误'); return; }
    if (!msg || typeof msg !== 'object' || Array.isArray(msg) || typeof msg.type !== 'string') { this._error(conn, 'bad_message', '消息格式错误'); return; }
    this.stats.messages++;
    try {
      if (!conn.session) {
        if (msg.type === 'HELLO') this._hello(conn, msg);
        else this._error(conn, 'not_ready', '请先完成握手');
        return;
      }
      conn.session.lastSeen = Date.now();
      const h = this.handlers[msg.type];
      if (!h) { this._error(conn, 'unknown_type', `未知的消息类型`); return; }
      const r = h.call(this, conn.session, msg, conn);
      if (r && typeof r.catch === 'function') r.catch(err => this.log.error('handler error', msg.type, err && err.stack || err));
    } catch (err) {
      this.log.error('handler error', msg.type, err && err.stack || err);
      this._error(conn, 'internal', '服务器处理出错');
    }
  }

  _onClose(conn) {
    clearTimeout(conn.helloTimer);
    const s = conn.session;
    if (!s || s.ws !== conn.ws) return; // 已被新连接接管
    s.ws = null;
    const room = s.roomId ? this.rooms.get(s.roomId) : null;
    if (room) {
      if (room.playing) room.match.playerDisconnected(room.match.seatOf(s.id));
      this._broadcastRoom(room);
    }
    const graceSec = room && room.playing
      ? Math.max(this.config.sessionGraceSeconds, this.config.awayGraceSeconds + 10)
      : this.config.sessionGraceSeconds;
    clearTimeout(s.goneTimer);
    s.goneTimer = setTimeout(() => this._expireSession(s), graceSec * 1000);
    s.goneTimer.unref?.();
    this._scheduleLobby();
  }

  /** 心跳：由入口每 20 秒调用一次 */
  heartbeat(wss) {
    for (const ws of wss.clients) {
      const conn = ws.__cfConn;
      if (!conn) continue;
      if (!conn.alive) { ws.terminate(); continue; }
      conn.alive = false;
      try { ws.ping(); } catch {}
    }
  }

  _expireSession(s) {
    if (s.ws) return;
    if (s.spectating) this._stopSpectating(s, false);
    if (s.roomId) this._leaveRoom(s, 'expired');
    this.sessions.delete(s.id);
    this.tokens.delete(s.token);
    this._scheduleLobby();
  }

  // ------------------------------------------------------------------ 握手
  _hello(conn, msg) {
    const nickname = cleanText(msg.nickname, LIMITS.nickname) || `决斗者_${randomInt(100, 1000)}`;
    const avatar = cleanAvatar(msg.avatar, cardExists);
    let s = null;
    if (isToken(msg.token)) {
      const sid = this.tokens.get(msg.token);
      s = sid ? this.sessions.get(sid) : null;
    }
    if (s) {
      clearTimeout(s.goneTimer);
      if (s.ws && s.ws !== conn.ws) {
        const old = s.ws;
        s.ws = null;
        try { old.close(4001, 'replaced by a new connection'); } catch {}
      }
    } else {
      if (this.sessions.size >= this.config.maxConnections) { conn.ws.close(4003, 'server full'); return; }
      let id;
      do { id = newPeerId(); } while (this.sessions.has(id));
      s = new Session(id, newToken());
      this.sessions.set(s.id, s);
      this.tokens.set(s.token, s.id);
    }
    clearTimeout(conn.helloTimer);
    conn.session = s;
    s.ws = conn.ws;
    s.ip = conn.ip;
    s.nickname = nickname;
    s.avatar = avatar;
    if (PRESENCE_STATUSES.has(msg.status)) s.status = msg.status;
    this._sendConn(conn, {
      type: 'WELCOME',
      peerId: s.id,
      token: s.token,
      nickname: s.nickname,
      rules: getRules(),
      timers: {
        turnSeconds: this.config.turnSeconds,
        mulliganSeconds: this.config.mulliganSeconds,
        awayGraceSeconds: this.config.awayGraceSeconds,
        inviteSeconds: this.config.inviteSeconds,
      },
      serverTime: Date.now(),
      resumed: Boolean(s.roomId || s.spectating),
    });
    const room = s.roomId ? this.rooms.get(s.roomId) : null;
    if (room) {
      this._broadcastRoom(room);
      if (room.playing) room.match.playerReconnected(room.match.seatOf(s.id));
    } else if (s.roomId) {
      s.roomId = null;
    }
    if (s.spectating) {
      const sr = this.rooms.get(s.spectating);
      if (sr && sr.playing) sr.match.sendSpectatorStart(s.id);
      else if (!sr) s.spectating = null;
    }
    this.send(s.id, this._lobbyPayload());
    this._scheduleLobby();
  }

  // ------------------------------------------------------------------ 大厅
  _lobbyPayload() {
    const rooms = [...this.rooms.values()].sort((a, b) => b.createdAt - a.createdAt).slice(0, LOBBY_LIST_CAP).map(r => r.publicMeta());
    const players = [...this.sessions.values()]
      .sort((a, b) => b.lastSeen - a.lastSeen)
      .slice(0, LOBBY_LIST_CAP)
      .map(s => ({ peerId: s.id, nickname: s.nickname, avatar: s.avatar, status: s.ws ? s.status : 'away', ts: Date.now() }));
    return { type: 'LOBBY', rooms, players, serverTime: Date.now() };
  }

  _scheduleLobby() {
    if (this.lobbyTimer) return;
    this.lobbyTimer = setTimeout(() => {
      this.lobbyTimer = null;
      const payload = JSON.stringify(this._lobbyPayload());
      for (const s of this.sessions.values()) {
        // 只推给正在看大厅的玩家，避免对局中的玩家被大厅流量打扰
        if (s.ws && s.ws.readyState === OPEN && s.status === 'in_lobby' && !s.roomId) s.ws.send(payload);
      }
    }, 300);
    this.lobbyTimer.unref?.();
  }

  _broadcastRoom(room) {
    for (const sid of room.members()) this.send(sid, room.memberState(sid));
  }

  // ------------------------------------------------------------------ 房间
  async _createRoom(s, { name, password, viaInvite = false }) {
    if (this.rooms.size >= this.config.maxRooms) return { ok: false, reason: '服务器房间已满，请稍后再试' };
    if (s.spectating) this._stopSpectating(s, false);
    let id;
    do { id = randomCode(6); } while (this.rooms.has(id));
    const pwd = password ? await hashPassword(password) : null;
    const room = new Room(this, { id, name: name || `${s.nickname}的对战房`, hostId: s.id, pwd });
    this.rooms.set(id, room);
    s.roomId = id;
    s.status = 'in_room';
    this.send(s.id, room.memberState(s.id));
    this._scheduleLobby();
    return { ok: true, room, viaInvite };
  }

  _leaveRoom(s, reason = 'left') {
    const room = s.roomId ? this.rooms.get(s.roomId) : null;
    s.roomId = null;
    if (!room) return;
    const role = room.roleOf(s.id);
    if (room.playing) room.match.playerLeft(room.match.seatOf(s.id));
    if (role === 'host') {
      if (room.guestId) {
        const g = this.sessions.get(room.guestId);
        if (g) g.roomId = null;
        this.send(room.guestId, { type: 'ROOM_CLOSED', roomId: room.id, reason: '房主已解散对战房间' });
      }
      for (const sid of room.spectators) {
        const sp = this.sessions.get(sid);
        if (sp) sp.spectating = null;
        this.send(sid, { type: 'SPECTATE_END', reason: '房间已解散' });
      }
      if (room.match) room.match.destroy();
      this.rooms.delete(room.id);
    } else if (role === 'guest') {
      room.guestId = null;
      room.ready = { host: false, guest: false };
      room.editing.guest = false;
      room.decks.guest = null;
      this.send(room.hostId, { type: 'NOTICE', code: 'guest_left', message: `挑战者【${s.nickname}】已离开房间` });
      this._broadcastRoom(room);
    }
    this.send(s.id, { type: 'ROOM_LEFT', roomId: room.id, reason });
    this._scheduleLobby();
  }

  async _joinRoom(s, roomId, { password = '', inviteId = '' } = {}) {
    const room = this.rooms.get(roomId);
    const reject = (reason, extra = {}) => { this.send(s.id, { type: 'JOIN_REJECTED', roomId, reason, ...extra }); };
    if (!room) return reject('房间不存在或已解散');
    if (s.roomId === roomId) { this.send(s.id, room.memberState(s.id)); return; }
    if (s.roomId) return reject('请先离开当前房间');
    if (room.guestId || room.playing) return reject('房间已满或正在对战中！');
    let invited = false;
    if (inviteId && room.invites.has(inviteId)) {
      const inv = room.invites.get(inviteId);
      invited = inv.targetId === s.id && inv.expires > Date.now();
      room.invites.delete(inviteId);
    }
    if (!invited && room.pwd) {
      if (!s.joinBucket.take()) return reject('尝试次数过多，请稍后再试', { needPassword: true });
      const ok = await verifyPassword(password, room.pwd);
      if (!ok) return reject('密码错误，请核对后重试！', { needPassword: true });
    }
    // await 之后重新检查（期间可能有人抢先加入或房间已解散）
    if (!this.rooms.has(roomId) || room.guestId || room.playing || s.roomId) return reject('房间已满或正在对战中！');
    if (s.spectating) this._stopSpectating(s, false);
    room.guestId = s.id;
    room.ready = { host: false, guest: false };
    room.editing.guest = false;
    s.roomId = roomId;
    s.status = 'in_room';
    this._broadcastRoom(room);
    this._scheduleLobby();
  }

  _startMatch(room) {
    const active = [...this.rooms.values()].filter(r => r.playing).length;
    if (active >= this.config.maxMatches) {
      for (const sid of room.members()) this.send(sid, { type: 'NOTICE', code: 'busy', message: '服务器对局已满，请稍后再试' });
      room.ready = { host: false, guest: false };
      this._broadcastRoom(room);
      return;
    }
    room.match = new Match({
      room,
      decks: [room.decks.host, room.decks.guest],
      send: (sid, msg) => this.send(sid, msg),
      config: this.config,
      log: this.log,
      onEnd: () => {
        room.match = null;
        room.ready = { host: false, guest: false };
        room.editing = { host: false, guest: false };
        this._broadcastRoom(room);
        this._scheduleLobby();
      },
    });
    for (const sid of room.members()) {
      const m = this.sessions.get(sid);
      if (m) m.status = 'playing_pvp';
    }
    room.match.start();
    this._broadcastRoom(room);
    this._scheduleLobby();
  }

  _stopSpectating(s, notify = true) {
    const room = s.spectating ? this.rooms.get(s.spectating) : null;
    s.spectating = null;
    if (room) {
      room.spectators.delete(s.id);
      for (const sid of room.members()) this.send(sid, { type: 'SPECTATORS', list: room.spectatorList() });
    }
    if (notify) this.send(s.id, { type: 'SPECTATE_END', reason: 'left' });
    this._scheduleLobby();
  }

  _opponentOf(s) {
    const room = s.roomId ? this.rooms.get(s.roomId) : null;
    if (!room) return { room: null, opp: null };
    return { room, opp: s.id === room.hostId ? room.guestId : room.hostId };
  }

  // ------------------------------------------------------------------ 消息处理
  handlers = {
    PING(s) { this.send(s.id, { type: 'PONG', serverTime: Date.now() }); },

    SET_PROFILE(s, msg) {
      const nick = cleanText(msg.nickname, LIMITS.nickname);
      if (nick) s.nickname = nick;
      if (msg.avatar !== undefined) s.avatar = cleanAvatar(msg.avatar, cardExists);
      const room = s.roomId ? this.rooms.get(s.roomId) : null;
      if (room) this._broadcastRoom(room);
      this._scheduleLobby();
    },

    SET_STATUS(s, msg) {
      if (!PRESENCE_STATUSES.has(msg.status)) return;
      const wasLobby = s.status === 'in_lobby';
      s.status = msg.status;
      if (s.status === 'in_lobby' && !wasLobby) this.send(s.id, this._lobbyPayload());
      this._scheduleLobby();
    },

    LOBBY_REFRESH(s) { this.send(s.id, this._lobbyPayload()); },

    async CREATE_ROOM(s, msg, conn) {
      if (s.busy) return;
      if (s.roomId) { this._error(conn, 'in_room', '你已经在一个房间里了'); return; }
      const name = cleanText(msg.name, LIMITS.roomName);
      const password = typeof msg.password === 'string' ? msg.password.slice(0, LIMITS.password) : '';
      s.busy = true;
      try {
        const r = await this._createRoom(s, { name, password });
        if (!r.ok) this._error(conn, 'create_failed', r.reason);
      } finally { s.busy = false; }
    },

    async JOIN_ROOM(s, msg) {
      if (s.busy) return;
      const roomId = cleanRoomId(msg.roomId);
      if (!roomId) { this.send(s.id, { type: 'JOIN_REJECTED', roomId: '', reason: '房间号格式不正确' }); return; }
      s.busy = true;
      try {
        await this._joinRoom(s, roomId, {
          password: typeof msg.password === 'string' ? msg.password.slice(0, LIMITS.password) : '',
          inviteId: isId(msg.inviteId) ? msg.inviteId : '',
        });
      } finally { s.busy = false; }
    },

    LEAVE_ROOM(s) {
      if (s.roomId) this._leaveRoom(s, 'left');
      else this.send(s.id, { type: 'ROOM_LEFT', roomId: '', reason: 'left' });
    },

    READY(s, msg, conn) {
      const room = s.roomId ? this.rooms.get(s.roomId) : null;
      if (!room || room.playing) return;
      const role = room.roleOf(s.id);
      const ready = Boolean(msg.ready);
      if (ready) {
        const deck = cleanDeckIds(msg.deckIds);
        const v = deck ? validateDeck(deck) : { ok: false, reason: '卡组数据无效' };
        if (!v.ok) {
          room.ready[role] = false;
          this._error(conn, 'deck_invalid', `卡组无法用于联机：${v.reason}`);
          this._broadcastRoom(room);
          return;
        }
        room.decks[role] = deck;
      }
      room.ready[role] = ready;
      room.editing[role] = false;
      this._broadcastRoom(room);
      if (room.guestId && room.ready.host && room.ready.guest && room.decks.host && room.decks.guest) this._startMatch(room);
    },

    EDITING_DECK(s, msg) {
      const room = s.roomId ? this.rooms.get(s.roomId) : null;
      if (!room || room.playing) return;
      const role = room.roleOf(s.id);
      room.editing[role] = Boolean(msg.editing);
      if (room.editing[role]) room.ready[role] = false;
      this._broadcastRoom(room);
    },

    async INVITE(s, msg, conn) {
      const target = isId(msg.targetId) ? this.sessions.get(msg.targetId) : null;
      if (!target || target.id === s.id || !target.ws) { this._error(conn, 'invite_failed', '该玩家已离线'); return; }
      if (target.roomId || target.spectating) { this._error(conn, 'invite_failed', '该玩家正在房间或对局中'); return; }
      if (!s.inviteBucket.take()) { this._error(conn, 'rate_limited', '邀请过于频繁，请稍后再试'); return; }
      let room = s.roomId ? this.rooms.get(s.roomId) : null;
      if (room && (room.roleOf(s.id) !== 'host' || room.guestId || room.playing)) { this._error(conn, 'invite_failed', '只有空房间的房主可以邀请玩家'); return; }
      if (!room) {
        if (s.busy) return;
        s.busy = true;
        try {
          const r = await this._createRoom(s, { name: `${s.nickname} 的邀请对战房`, password: '' });
          if (!r.ok) { this._error(conn, 'create_failed', r.reason); return; }
          room = r.room;
        } finally { s.busy = false; }
      }
      const inviteId = randomCode(10);
      const ttl = this.config.inviteSeconds * 1000;
      room.invites.set(inviteId, { targetId: target.id, expires: Date.now() + ttl });
      setTimeout(() => room.invites.delete(inviteId), ttl + 1000).unref?.();
      this.send(target.id, {
        type: 'INVITED', inviteId, roomId: room.id, roomName: room.name,
        fromId: s.id, fromName: s.nickname, fromAvatar: s.avatar, expiresInSec: this.config.inviteSeconds,
      });
      this.send(s.id, { type: 'NOTICE', code: 'invite_sent', message: `📩 已向【${target.nickname}】发送对战邀请（等待对方 ${this.config.inviteSeconds} 秒内响应）` });
    },

    INVITE_ACCEPT(s, msg) {
      return this.handlers.JOIN_ROOM.call(this, s, { roomId: msg.roomId, inviteId: msg.inviteId });
    },

    INVITE_DECLINE(s, msg) {
      const room = this.rooms.get(cleanRoomId(msg.roomId));
      if (!room || !isId(msg.inviteId)) return;
      const inv = room.invites.get(msg.inviteId);
      if (!inv || inv.targetId !== s.id) return;
      room.invites.delete(msg.inviteId);
      this.send(room.hostId, { type: 'NOTICE', code: 'invite_declined', message: `【${s.nickname}】婉拒了你的对战邀请` });
    },

    SPECTATE(s, msg, conn) {
      const room = this.rooms.get(cleanRoomId(msg.roomId));
      if (!room) { this._error(conn, 'spectate_failed', '房间不存在或已解散'); return; }
      if (s.roomId) { this._error(conn, 'spectate_failed', '请先离开当前房间再观战'); return; }
      if (room.spectators.size >= MAX_SPECTATORS && !room.spectators.has(s.id)) { this._error(conn, 'spectate_failed', '该房间观战人数已满'); return; }
      if (s.spectating && s.spectating !== room.id) this._stopSpectating(s, false);
      s.spectating = room.id;
      s.status = 'spectating';
      const isNew = !room.spectators.has(s.id);
      room.spectators.add(s.id);
      if (room.playing) room.match.sendSpectatorStart(s.id);
      else this.send(s.id, { type: 'SPECTATE_WAIT', roomId: room.id, host: { name: room.hostName(), avatar: room.hostAvatar() }, guest: room.guestId ? { name: room.guestName(), avatar: room.guestAvatar() } : null });
      for (const sid of room.members()) {
        this.send(sid, { type: 'SPECTATORS', list: room.spectatorList(), joined: isNew ? { id: s.id, name: s.nickname } : undefined });
      }
      this._scheduleLobby();
    },

    SPECTATE_LEAVE(s) { if (s.spectating) this._stopSpectating(s, true); },

    CHAT(s, msg) {
      const { opp } = this._opponentOf(s);
      const text = cleanText(msg.text, LIMITS.chat);
      if (!opp || !text || !s.chatBucket.take()) return;
      this.send(opp, { type: 'CHAT', from: s.nickname, text });
    },

    EMOTE(s, msg) {
      const { room, opp } = this._opponentOf(s);
      const text = cleanText(msg.text, LIMITS.emote);
      if (!room || !text || !s.chatBucket.take()) return;
      if (opp) this.send(opp, { type: 'EMOTE', text });
      const who = room.roleOf(s.id);
      for (const sid of room.spectators) this.send(sid, { type: 'EMOTE', text, who });
    },

    MULLIGAN(s, msg) {
      const room = s.roomId ? this.rooms.get(s.roomId) : null;
      if (!room || !room.playing) return;
      return room.match.handle(s.id, { type: 'MULLIGAN', swapIdx: intList(msg.swapIdx ?? [], 4, { min: 0, max: 3 }) || [] });
    },

    ACTION(s, msg) {
      const room = s.roomId ? this.rooms.get(s.roomId) : null;
      const reqId = int(msg.reqId, { min: 0, max: 2 ** 31 - 1, def: 0 });
      if (!room || !room.playing) { this.send(s.id, { type: 'ACTION_REJECTED', reqId, reason: '当前没有进行中的对局' }); return; }
      const action = cleanAction(msg);
      if (!action) { this.send(s.id, { type: 'ACTION_REJECTED', reqId, reason: '操作参数无效' }); return; }
      return room.match.handle(s.id, { type: 'ACTION', action, reqId });
    },

    SURRENDER(s) {
      const room = s.roomId ? this.rooms.get(s.roomId) : null;
      if (!room || !room.playing) return;
      return room.match.handle(s.id, { type: 'SURRENDER' });
    },

    SYNC(s) {
      const room = s.roomId ? this.rooms.get(s.roomId) : null;
      if (room && room.playing) return room.match.handle(s.id, { type: 'SYNC' });
      const sr = s.spectating ? this.rooms.get(s.spectating) : null;
      if (sr && sr.playing) sr.match.sendSpectatorStart(s.id);
    },
  };

  shutdown() {
    for (const room of this.rooms.values()) if (room.match) room.match.destroy();
    for (const s of this.sessions.values()) {
      if (s.ws) { try { s.ws.close(1001, 'server shutting down'); } catch {} }
      clearTimeout(s.goneTimer);
    }
    clearTimeout(this.lobbyTimer);
  }
}
