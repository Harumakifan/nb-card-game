// 一局 PvP 对战的权威状态机。座位 seat 0 = 房主，seat 1 = 挑战者。
//
// 引擎（客户端同一份规则代码）始终假定"当前行动方 = side 0"（旧版联机与热座模式也是如此），
// 因此每次结算某一方的动作前，先把局面翻转到该方视角（cfSwapBattleSides），结算完再按接收者分别生成视图。
//
// 所有对外方法都返回"步骤"数组：每一步包含导致变化的原因 cause、引擎记录的特效事件 events，
// 由 Match 层按接收者转换视角并下发。

import vm from 'node:vm';
import { EngineHost, secureRandom } from './engineHost.js';

const HELPERS = new vm.Script(`
var __cfMatch = {
  setup(json) {
    const o = JSON.parse(json);
    _battleSessionSeq++;
    battle.turn = 1;
    battle.turnLogs = [];
    battle.gameOver = false;
    battle.animating = false;
    battle.inspectedCard = null;
    battle.pendingPlay = null;
    battle.pendingActivate = null;
    battle.board = [[null, null, null, null, null], [null, null, null, null, null]];
    battle.firstPlayerSide = o.firstSide;
    battle.activeSide = o.firstSide;
    battle.leaders[0] = createLeaderState(0, o.deck0);
    battle.leaders[1] = createLeaderState(1, o.deck1);
    prepareOpeningHand(0);
    prepareOpeningHand(1);
    // 打乱 uid：原 uid 按卡组列表顺序递增，结合公开的预设卡组可反推出隐藏手牌，必须随机化
    const used = new Set();
    for (const st of battle.leaders) {
      for (const c of [...st.deck, ...st.hand]) {
        let u;
        do { u = 1000000 + Math.floor(Math.random() * 2000000000); } while (used.has(u));
        used.add(u);
        c.uid = u;
      }
    }
  },
  swap() { cfSwapBattleSides(); },
  view(perspective) { return JSON.stringify(cfBuildBattleView(perspective)); },
  hp() { return [battle.leaders[0].hp, battle.leaders[1].hp]; },
  stat() {
    return JSON.stringify({ turn: battle.turn, activeSide: battle.activeSide, gameOver: Boolean(battle.gameOver),
      hand: battle.leaders.map(l => l.hand.length), deck: battle.leaders.map(l => l.deck.length) });
  },
  mulligan(json) { return JSON.stringify(cfApplyMulligan(0, JSON.parse(json))); },
  async beginTurn() { battle.animating = false; await beginTurnSequence(0); battle.animating = false; },
  async endTurn() { battle.animating = false; await executeEndTurnSequence(0); battle.animating = false; },
  async play(json) { battle.animating = false; const r = await cfPerformPlay(0, JSON.parse(json)); battle.animating = false; return JSON.stringify(r); },
  async activate(json) { battle.animating = false; const p = JSON.parse(json); const r = await cfPerformActivate(0, p.lane, p); battle.animating = false; return JSON.stringify(r); },
  async fuse(json) { battle.animating = false; const p = JSON.parse(json); const r = await cfPerformFusion(0, p.uid, p.materialUids); battle.animating = false; return JSON.stringify(r); },
  checkPlay(json) { const v = cfValidatePlay(0, JSON.parse(json)); return JSON.stringify({ ok: v.ok, reason: v.reason || '' }); },
};
`, { filename: 'cardforge-match-helpers.js' });

const FLIP_KEYS = ['side', 'fromSide', 'toSide'];

/** 把特效事件从 fromSeat 视角转换到 toSeat 视角，并对非行动方隐藏私密内容 */
export function orientEvents(events, actorSeat, viewerSeat, { spectator = false } = {}) {
  const flip = actorSeat !== viewerSeat;
  const hidePrivate = spectator || viewerSeat !== actorSeat;
  return events.map(ev => {
    const out = { ...ev };
    if (flip) for (const k of FLIP_KEYS) if (out[k] === 0 || out[k] === 1) out[k] = 1 - out[k];
    if (out.priv) {
      if (hidePrivate) {
        return { kind: 'toast', side: out.side, cid: 'sys_notice', cardData: null, msg: out.pub || '对手发动了一个不公开的效果' };
      }
      delete out.priv; delete out.pub;
    }
    return out;
  });
}

export class MatchEngine {
  /**
   * @param {object} o
   * @param {[string[], string[]]} o.decks 双方（已校验的）卡组 id 列表
   * @param {0|1} o.firstSeat 先手座位
   * @param {() => number} [o.random]
   */
  constructor({ decks, firstSeat, random = secureRandom, onLog = null }) {
    this.host = new EngineHost({ random, onLog });
    HELPERS.runInContext(this.host.context);
    this.m = this.host.get('__cfMatch');
    this.firstSeat = firstSeat === 1 ? 1 : 0;
    this.activeSeat = this.firstSeat;
    this.oriented = 0;
    this.phase = 'mulligan'; // mulligan → playing → over
    this.mulliganDone = [false, false];
    this.result = null; // { winnerSeat: 0|1|null, reason }
    this.m.setup(JSON.stringify({ deck0: decks[0], deck1: decks[1], firstSide: this.firstSeat }));
    this.host.takeEvents();
  }

  _orient(seat) {
    if (this.oriented !== seat) { this.m.swap(); this.oriented = seat; }
  }

  _hpBySeat() {
    const [a, b] = this.m.hp();
    return this.oriented === 0 ? [a, b] : [b, a];
  }

  _checkOver() {
    if (this.result) return true;
    const [h0, h1] = this._hpBySeat();
    const flag = this.host.gameOverFlag;
    const engineOver = Boolean(this.host.eval('battle.gameOver'));
    if (h0 > 0 && h1 > 0 && !engineOver && !flag) return false;
    let winnerSeat;
    if (h0 <= 0 && h1 <= 0) winnerSeat = null;
    else if (h0 <= 0) winnerSeat = 1;
    else if (h1 <= 0) winnerSeat = 0;
    else if (flag) winnerSeat = flag.side0Won ? this.oriented : 1 - this.oriented;
    else winnerSeat = null;
    this.result = { winnerSeat, reason: 'hp' };
    this.phase = 'over';
    return true;
  }

  _step(kind, actorSeat, extra = {}) {
    const events = this.host.takeEvents();
    // 每一步结束时为双方与观战者各拍一份视图快照（END_TURN 与随后的 TURN_START 需要分别展示）
    const views = [this.viewFor(0), this.viewFor(1), this.viewFor(null)];
    // activeSeat / phase 取本步结束时的值；回合交接（END_TURN）这一刻任何一方都不能行动，记为 -1
    this._checkOver();
    const activeSeat = kind === 'END_TURN' ? -1 : this.activeSeat;
    return { cause: { kind, actorSeat, ...extra }, events, views, activeSeat, phase: this.phase };
  }

  /** 生成发给某个座位（或观战者 seat=null，统一以房主视角）的视图 JSON 字符串 */
  viewFor(seat) {
    if (seat === null || seat === undefined) {
      this._orient(0);
      return this.m.view('spectator');
    }
    this._orient(seat);
    return this.m.view('owner');
  }

  stat() {
    this._orient(0);
    return JSON.parse(this.m.stat());
  }

  /** 大厅展示用：[房主血量, 挑战者血量] 与回合数 */
  publicHp() {
    const [h0, h1] = this._hpBySeat();
    return { turn: Number(this.host.eval('battle.turn')) || 1, hostHp: h0, guestHp: h1 };
  }

  isMulliganPending(seat) { return this.phase === 'mulligan' && !this.mulliganDone[seat]; }

  /** 换牌；双方都完成后自动开始先手方第 1 回合 */
  async mulligan(seat, swapIdx) {
    if (!this.isMulliganPending(seat)) return { ok: false, reason: '当前不在换牌阶段' };
    this._orient(seat);
    const idx = Array.isArray(swapIdx) ? swapIdx.filter(n => Number.isInteger(n)).slice(0, 8) : [];
    this.m.mulligan(JSON.stringify(idx));
    this.mulliganDone[seat] = true;
    const steps = [this._step('MULLIGAN', seat)];
    if (this.mulliganDone[0] && this.mulliganDone[1]) {
      this.phase = 'playing';
      this._orient(this.firstSeat);
      this.activeSeat = this.firstSeat;
      await this.m.beginTurn();
      steps.push(this._step('TURN_START', this.firstSeat));
      this._checkOver();
    }
    return { ok: true, steps };
  }

  _guardTurn(seat) {
    if (this.phase !== 'playing') return { ok: false, reason: this.phase === 'over' ? '对局已结束' : '对局尚未开始' };
    if (seat !== this.activeSeat) return { ok: false, reason: '现在不是你的回合' };
    return null;
  }

  async play(seat, params) {
    const g = this._guardTurn(seat); if (g) return g;
    this._orient(seat);
    const r = JSON.parse(await this.m.play(JSON.stringify(params || {})));
    if (!r.ok) { this.host.takeEvents(); return r; }
    const steps = [this._step('PLAY', seat, { cid: r.cid, cardType: r.cardType, lane: r.lane, sacCount: r.sacCount })];
    this._checkOver();
    return { ok: true, steps };
  }

  async activate(seat, params) {
    const g = this._guardTurn(seat); if (g) return g;
    this._orient(seat);
    const r = JSON.parse(await this.m.activate(JSON.stringify(params || {})));
    if (!r.ok) { this.host.takeEvents(); return r; }
    const steps = [this._step('ACTIVATE', seat, { cid: r.cid, lane: params.lane })];
    this._checkOver();
    return { ok: true, steps };
  }

  async fuse(seat, params) {
    const g = this._guardTurn(seat); if (g) return g;
    this._orient(seat);
    const r = JSON.parse(await this.m.fuse(JSON.stringify(params || {})));
    if (!r.ok) { this.host.takeEvents(); return r; }
    const steps = [this._step('FUSE', seat, {})];
    this._checkOver();
    return { ok: true, steps };
  }

  /** 结束回合：结算回合结束 + 战斗，然后开始对方回合。返回两个步骤。 */
  async endTurn(seat) {
    const g = this._guardTurn(seat); if (g) return g;
    this._orient(seat);
    await this.m.endTurn();
    const steps = [this._step('END_TURN', seat)];
    if (this._checkOver()) return { ok: true, steps };
    const next = 1 - seat;
    this._orient(next);
    if (next === this.firstSeat) this.host.eval('battle.turn += 1');
    this.activeSeat = next;
    await this.m.beginTurn();
    steps.push(this._step('TURN_START', next));
    this._checkOver();
    return { ok: true, steps };
  }

  surrender(seat) {
    if (this.phase === 'over') return { ok: false, reason: '对局已结束' };
    this.result = { winnerSeat: 1 - seat, reason: 'surrender' };
    this.phase = 'over';
    this.host.eval('battle.gameOver = true');
    return { ok: true, steps: [this._step('SURRENDER', seat)] };
  }

  forfeit(seat, reason = 'disconnect') {
    if (this.phase === 'over') return { ok: false };
    this.result = { winnerSeat: 1 - seat, reason };
    this.phase = 'over';
    this.host.eval('battle.gameOver = true');
    return { ok: true, steps: [this._step('FORFEIT', seat, { reason })] };
  }

  get errors() { return this.host.errors; }

  dispose() { this.host.dispose(); }
}
