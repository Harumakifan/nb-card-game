// 一局对战的会话层：串行处理双方指令、计时（换牌 / 回合）、断线宽限、按接收者转换视角下发状态。
import { MatchEngine, orientEvents } from './engine/matchEngine.js';
import { coinFlip } from './security.js';

export class Match {
  /**
   * @param {object} o
   * @param {import('./gameServer.js').Room} o.room
   * @param {[string[], string[]]} o.decks [房主卡组, 挑战者卡组]
   * @param {(sessionId: string, msg: object) => void} o.send
   * @param {object} o.config
   * @param {(match: Match) => void} o.onEnd
   * @param {object} [o.log]
   */
  constructor({ room, decks, send, config, onEnd, log, random }) {
    this.room = room;
    this.send = send;
    this.config = config;
    this.onEnd = onEnd;
    this.log = log || console;
    this.seq = 0;
    this.queue = Promise.resolve();
    this.timer = null;
    this.awayTimers = [null, null];
    this.away = [false, false];
    this.deadline = 0;
    this.ended = false;
    this.lastStep = null;
    this.engine = new MatchEngine({
      decks,
      firstSeat: coinFlip(),
      random,
      onLog: (level, args) => { if (level === 'error') this.log.warn(`[match ${room.id}] engine:`, ...args.map(String)); },
    });
  }

  seatSession(seat) { return seat === 0 ? this.room.hostId : this.room.guestId; }
  seatOf(sessionId) { return sessionId === this.room.hostId ? 0 : (sessionId === this.room.guestId ? 1 : -1); }

  _publicPlayers() {
    const r = this.room;
    return [
      { name: r.hostName(), avatar: r.hostAvatar() },
      { name: r.guestName(), avatar: r.guestAvatar() },
    ];
  }

  start() {
    const players = this._publicPlayers();
    this.deadline = Date.now() + this.config.mulliganSeconds * 1000;
    for (const seat of [0, 1]) {
      this.send(this.seatSession(seat), {
        type: 'MATCH_START',
        seat,
        role: seat === 0 ? 'host' : 'guest',
        firstSeat: this.engine.firstSeat,
        isFirst: this.engine.firstSeat === seat,
        opponent: players[1 - seat],
        view: JSON.parse(this.engine.viewFor(seat)),
        phase: 'mulligan',
        deadline: this.deadline,
        serverTime: Date.now(),
      });
    }
    for (const sid of this.room.spectators) this.sendSpectatorStart(sid);
    this._setTimer(this.config.mulliganSeconds * 1000 + 1500, () => this._autoMulligan());
  }

  sendSpectatorStart(sid) {
    const players = this._publicPlayers();
    this.send(sid, {
      type: 'SPECTATE_START',
      roomId: this.room.id,
      host: players[0], guest: players[1],
      phase: this.engine.phase,
      activeSeat: this.engine.activeSeat,
      view: JSON.parse(this.engine.viewFor(null)),
      deadline: this.deadline,
      serverTime: Date.now(),
    });
  }

  /** 断线重连后补发完整局面 */
  resume(seat) {
    const sid = this.seatSession(seat);
    const players = this._publicPlayers();
    this.send(sid, {
      type: 'MATCH_RESUME',
      seat,
      role: seat === 0 ? 'host' : 'guest',
      firstSeat: this.engine.firstSeat,
      opponent: players[1 - seat],
      view: JSON.parse(this.engine.viewFor(seat)),
      phase: this.engine.phase,
      mulliganPending: this.engine.isMulliganPending(seat),
      activeSeat: this.engine.activeSeat,
      deadline: this.deadline,
      serverTime: Date.now(),
      seq: this.seq,
    });
  }

  _enqueue(fn) {
    const run = this.queue.then(fn).catch(err => {
      this.log.error(`[match ${this.room.id}] handler error:`, err && err.stack || err);
    });
    this.queue = run;
    return run;
  }

  _setTimer(ms, fn) {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => { this.timer = null; this._enqueue(fn); }, ms);
    this.timer.unref?.();
  }

  _startTurnTimer() {
    this.deadline = Date.now() + this.config.turnSeconds * 1000;
    this._setTimer(this.config.turnSeconds * 1000 + 800, async () => {
      if (this.ended || this.engine.phase !== 'playing') return;
      const seat = this.engine.activeSeat;
      const r = await this.engine.endTurn(seat);
      if (r.ok) this._emit(r.steps, { timeout: true });
    });
  }

  async _autoMulligan() {
    if (this.ended || this.engine.phase !== 'mulligan') return;
    for (const seat of [0, 1]) {
      if (this.engine.isMulliganPending(seat)) {
        const r = await this.engine.mulligan(seat, []);
        if (r.ok) this._emit(r.steps, { timeout: true });
      }
    }
  }

  /** 玩家指令入口（已通过 protocol 层清洗） */
  handle(sessionId, msg) {
    const seat = this.seatOf(sessionId);
    if (seat === -1) return;
    return this._enqueue(async () => {
      if (this.ended) return this.send(sessionId, { type: 'ACTION_REJECTED', reqId: msg.reqId, reason: '对局已结束' });
      let r;
      switch (msg.type) {
        case 'MULLIGAN':
          r = await this.engine.mulligan(seat, msg.swapIdx);
          break;
        case 'ACTION': {
          const a = msg.action;
          if (a.type === 'PLAY') r = await this.engine.play(seat, a.params);
          else if (a.type === 'ACTIVATE') r = await this.engine.activate(seat, a.params);
          else if (a.type === 'FUSE') r = await this.engine.fuse(seat, a.params);
          else if (a.type === 'END_TURN') r = await this.engine.endTurn(seat);
          break;
        }
        case 'SURRENDER':
          r = this.engine.surrender(seat);
          break;
        case 'SYNC':
          this.resume(seat);
          return;
        default:
          return;
      }
      if (!r || !r.ok) {
        this.send(sessionId, { type: 'ACTION_REJECTED', reqId: msg.reqId, reason: (r && r.reason) || '操作无效' });
        // 让客户端回到服务器的权威局面（例如本地乐观地关掉了某个面板）
        this.resume(seat);
        return;
      }
      this._emit(r.steps, { reqId: msg.reqId, by: seat });
    });
  }

  _emit(steps, meta = {}) {
    for (const step of steps) {
      this.seq++;
      const { cause, events, views, activeSeat, phase } = step;
      const actor = cause.actorSeat;
      if (cause.kind === 'TURN_START') this._startTurnTimer();
      for (const seat of [0, 1]) {
        this.send(this.seatSession(seat), {
          type: 'STATE',
          seq: this.seq,
          cause: { ...cause, actor: actor === seat ? 'me' : 'opp', actorSeat: undefined },
          events: orientEvents(events, actor, seat),
          view: JSON.parse(views[seat]),
          activeSeat,
          myTurn: phase === 'playing' && activeSeat === seat,
          phase,
          deadline: this.deadline,
          serverTime: Date.now(),
          reqId: meta.by === seat ? meta.reqId : undefined,
          timeout: meta.timeout || undefined,
        });
      }
      const specMsg = {
        type: 'STATE',
        seq: this.seq,
        spectator: true,
        cause: { ...cause, actor: actor === 0 ? 'host' : 'guest', actorSeat: undefined },
        events: orientEvents(events, actor, 0, { spectator: true }),
        view: JSON.parse(views[2]),
        activeSeat,
        phase,
        deadline: this.deadline,
        serverTime: Date.now(),
      };
      for (const sid of this.room.spectators) this.send(sid, specMsg);
      this.lastStep = cause.kind;
    }
    if (this.engine.phase === 'over') this._finish();
  }

  playerDisconnected(seat) {
    if (this.ended || this.away[seat]) return;
    this.away[seat] = true;
    const other = this.seatSession(1 - seat);
    this.send(other, { type: 'OPP_AWAY', graceSec: this.config.awayGraceSeconds });
    if (this.awayTimers[seat]) clearTimeout(this.awayTimers[seat]);
    this.awayTimers[seat] = setTimeout(() => {
      this._enqueue(() => {
        if (this.ended || !this.away[seat]) return;
        const r = this.engine.forfeit(seat, 'disconnect');
        if (r.ok) this._emit(r.steps);
      });
    }, this.config.awayGraceSeconds * 1000);
    this.awayTimers[seat].unref?.();
  }

  playerReconnected(seat) {
    if (this.ended) return;
    if (this.awayTimers[seat]) { clearTimeout(this.awayTimers[seat]); this.awayTimers[seat] = null; }
    const wasAway = this.away[seat];
    this.away[seat] = false;
    this.resume(seat);
    if (wasAway) this.send(this.seatSession(1 - seat), { type: 'OPP_BACK' });
  }

  /** 玩家主动离开房间：视为认输 */
  playerLeft(seat) {
    return this._enqueue(() => {
      if (this.ended) return;
      const r = this.engine.forfeit(seat, 'left');
      if (r.ok) this._emit(r.steps);
    });
  }

  _finish() {
    if (this.ended) return;
    this.ended = true;
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    this.awayTimers.forEach(t => t && clearTimeout(t));
    const res = this.engine.result || { winnerSeat: null, reason: 'unknown' };
    const wins = this.room.wins;
    if (res.winnerSeat === 0) wins.host++;
    else if (res.winnerSeat === 1) wins.guest++;
    for (const seat of [0, 1]) {
      this.send(this.seatSession(seat), {
        type: 'MATCH_END',
        result: res.winnerSeat === null ? 'draw' : (res.winnerSeat === seat ? 'win' : 'lose'),
        reason: res.reason,
        wins: { ...wins },
      });
    }
    const specEnd = { type: 'MATCH_END', spectator: true, winner: res.winnerSeat === null ? null : (res.winnerSeat === 0 ? 'host' : 'guest'), reason: res.reason, wins: { ...wins } };
    for (const sid of this.room.spectators) this.send(sid, specEnd);
    if (this.engine.errors.length) this.log.warn(`[match ${this.room.id}] finished with ${this.engine.errors.length} engine errors`);
    // 稍后释放沙箱（让排队中的消息先处理完）
    setTimeout(() => this.engine.dispose(), 2000).unref?.();
    this.onEnd(this);
  }

  /** 服务器关闭 / 房间解散时强制清理 */
  destroy() {
    if (this.timer) clearTimeout(this.timer);
    this.awayTimers.forEach(t => t && clearTimeout(t));
    this.ended = true;
    this.engine.dispose();
  }

  publicInfo() {
    if (this.ended) return { turn: 0, hostHp: 0, guestHp: 0 };
    return this.engine.publicHp();
  }
}
