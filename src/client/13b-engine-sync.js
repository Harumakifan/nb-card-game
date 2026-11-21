// ============================================================================
// v1.88 对局状态视图：服务器 → 客户端的序列化 / 反序列化（同一份代码在服务器与浏览器运行）
//   - 'owner'     ：自己的主战者，手牌完整；牌库只给内容、按 uid 排序（不暴露顺序）
//   - 'public'    ：对手 / 观战视角，手牌与牌库只给张数（已公开的手牌除外）
//   - 'local'     ：本地存档，双方完整信息（仅单机使用，从不发到网络）
// 序列化采用"通用字段拷贝"而不是白名单，避免新增字段（如额外能量）在同步时被悄悄丢掉。
// ============================================================================
const CF_HIDDEN_CARD = Object.freeze({
  id: '__hidden__', name: '未公开的卡牌', type: 'spell', rarity: '普通', race: '',
  energy: 0, bones: 0, sacrifice: 0, atk: 0, hp: 1, text: '', fullText: '', keywords: [],
  isToken: true, isHidden: true,
});
const CF_LEADER_SPECIAL_KEYS = new Set(['deck', 'hand', 'graveyard', 'crests', 'playedCardsLog', 'publicHandIds']);
const CF_VIEW_TURNLOG_LIMIT = 40;
let cfHiddenUidSeq = 0;

function cfJsonSafe(v, depth = 0) {
  if (v === null || typeof v === 'string' || typeof v === 'boolean') return v;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'object' || depth > 8) return undefined;
  if (Array.isArray(v)) return v.map(x => { const y = cfJsonSafe(x, depth + 1); return y === undefined ? null : y; });
  if (v instanceof Set) return [...v].map(x => cfJsonSafe(x, depth + 1));
  if (v.data && v.uid !== undefined) return { ref: v.uid }; // 卡牌实例引用：只记 uid，避免循环
  const out = {};
  for (const k of Object.keys(v)) {
    const y = cfJsonSafe(v[k], depth + 1);
    if (y !== undefined) out[k] = y;
  }
  return out;
}

function cfCardDataPayload(data) {
  if (!data) return null;
  if (typeof cardsById !== 'undefined' && cardsById[data.id] === data) return null;
  const { ast, ...rest } = data;
  return cfJsonSafe(rest);
}

function cfSerializeCard(inst) {
  if (!inst || !inst.data) return null;
  const out = { c: inst.data.id };
  const d = cfCardDataPayload(inst.data);
  if (d) out.d = d;
  for (const k of Object.keys(inst)) {
    if (k === 'data' || k.charCodeAt(0) === 95 /* 以 _ 开头的本地表现层标记 */) continue;
    const y = cfJsonSafe(inst[k]);
    if (y !== undefined) out[k] = y;
  }
  return out;
}

function cfMakeHiddenInst(owner) {
  return {
    uid: -(++cfHiddenUidSeq), data: CF_HIDDEN_CARD, owner, hidden: true,
    currentAtk: 0, maxHp: 1, currentHp: 1, countdown: null, activeKw: {}, fusedCount: 0, costReduction: 0,
    grantedEffects: [], extraLastWords: [], shiftDir: 1, activatedThisTurn: false, attackedThisTurn: false,
    fusedThisTurn: false, enterOrder: 0,
  };
}

function cfDeserializeCard(raw, owner) {
  if (!raw) return null;
  if (raw.c === CF_HIDDEN_CARD.id) return cfMakeHiddenInst(owner);
  let inst = createCardInstance(raw.c, owner);
  if (!inst && raw.d && raw.d.id) {
    const data = Object.assign({ keywords: [] }, raw.d);
    inst = { uid: 0, data, owner, currentAtk: data.atk || 0, maxHp: data.hp || 1, currentHp: data.hp || 1, activeKw: {}, grantedEffects: [], extraLastWords: [] };
  }
  if (!inst) return null;
  for (const k of Object.keys(raw)) {
    if (k === 'c' || k === 'd') continue;
    const v = raw[k];
    inst[k] = (v && typeof v === 'object') ? JSON.parse(JSON.stringify(v)) : v;
  }
  inst.owner = owner;
  return inst;
}

function cfCardIdOrPayload(d) {
  if (!d) return null;
  const p = cfCardDataPayload(d);
  return p ? { c: d.id, d: p } : d.id;
}

function cfResolveCardData(x) {
  if (!x) return null;
  if (typeof x === 'string') return (typeof cardsById !== 'undefined' && cardsById[x]) || null;
  if (x.c && typeof cardsById !== 'undefined' && cardsById[x.c]) return cardsById[x.c];
  return x.d ? Object.assign({ keywords: [] }, x.d) : null;
}

function cfSerializeLeader(st, mode) {
  if (!st) return null;
  const out = {};
  for (const k of Object.keys(st)) {
    if (CF_LEADER_SPECIAL_KEYS.has(k)) continue;
    const y = cfJsonSafe(st[k]);
    if (y !== undefined) out[k] = y;
  }
  const full = mode === 'owner' || mode === 'local';
  const publicUids = new Set((st.publicHandIds || []).map(p => String(p.uid)));
  out.hand = (st.hand || []).map(h => (full || publicUids.has(String(h.uid))) ? cfSerializeCard(h) : { c: CF_HIDDEN_CARD.id });
  if (mode === 'local') out.deck = (st.deck || []).map(cfSerializeCard);
  else if (mode === 'owner') out.deck = (st.deck || []).map(cfSerializeCard).filter(Boolean).sort((a, b) => a.uid - b.uid);
  else out.deck = { hidden: (st.deck || []).length };
  out.publicHandIds = cfJsonSafe((st.publicHandIds || []).filter(p => (st.hand || []).some(h => h && String(h.uid) === String(p.uid))));
  out.graveyard = (st.graveyard || []).map(cfCardIdOrPayload).filter(Boolean);
  out.playedCardsLog = (st.playedCardsLog || []).map(d => (d && d.id ? cfCardIdOrPayload(d) : d)).filter(Boolean);
  out.crests = (st.crests || []).map(cr => {
    const o = {};
    for (const k of Object.keys(cr)) {
      if (k === 'cardData') continue;
      const y = cfJsonSafe(cr[k]);
      if (y !== undefined) o[k] = y;
    }
    o.card = cr.cardData ? cfCardIdOrPayload(cr.cardData) : null;
    return o;
  });
  return out;
}

function cfDeserializeLeader(raw, side) {
  if (!raw) return null;
  const st = {};
  for (const k of Object.keys(raw)) {
    if (CF_LEADER_SPECIAL_KEYS.has(k)) continue;
    const v = raw[k];
    st[k] = (v && typeof v === 'object') ? JSON.parse(JSON.stringify(v)) : v;
  }
  st.hand = (raw.hand || []).map(c => cfDeserializeCard(c, side)).filter(Boolean);
  st.deck = Array.isArray(raw.deck)
    ? raw.deck.map(c => cfDeserializeCard(c, side)).filter(Boolean)
    : Array.from({ length: Math.max(0, Math.min(200, (raw.deck && raw.deck.hidden) || 0)) }, () => cfMakeHiddenInst(side));
  st.publicHandIds = Array.isArray(raw.publicHandIds) ? raw.publicHandIds : [];
  st.graveyard = (raw.graveyard || []).map(cfResolveCardData).filter(Boolean);
  st.playedCardsLog = (raw.playedCardsLog || []).map(cfResolveCardData).filter(Boolean);
  st.crests = (raw.crests || []).map(cr => {
    const o = Object.assign({}, cr);
    delete o.card;
    o.cardData = cfResolveCardData(cr.card) || { id: 'sys_notice', name: '战局提示', type: 'spell', rarity: '传说', energy: 0, bones: 0, sacrifice: 0 };
    return o;
  });
  return st;
}

function cfFilterTurnLogs(logs, viewerSide) {
  return (logs || []).slice(-CF_VIEW_TURNLOG_LIMIT).map(g => ({
    turn: g.turn,
    side: g.side,
    events: (g.events || []).map(ev => {
      if (ev.priv && g.side !== viewerSide) return { kind: ev.kind, text: ev.pub || '对手发动了一个不公开的效果', cardId: '', cardName: '' };
      const { priv, pub, ...rest } = ev;
      return rest;
    }),
  }));
}

/** perspective: 'owner'（side 0 为接收者）| 'spectator' | 'local' */
function cfBuildBattleView(perspective = 'owner') {
  const viewerSide = perspective === 'spectator' ? -1 : 0;
  const m0 = perspective === 'local' ? 'local' : (perspective === 'owner' ? 'owner' : 'public');
  const m1 = perspective === 'local' ? 'local' : 'public';
  return {
    v: 2,
    turn: battle.turn,
    firstPlayerSide: battle.firstPlayerSide,
    activeSide: battle.activeSide,
    gameOver: Boolean(battle.gameOver),
    turnLogs: perspective === 'local' ? cfJsonSafe(battle.turnLogs || []) : cfFilterTurnLogs(battle.turnLogs, viewerSide),
    leaders: [cfSerializeLeader(battle.leaders[0], m0), cfSerializeLeader(battle.leaders[1], m1)],
    board: [0, 1].map(s => (battle.board[s] || []).map(c => (c ? cfSerializeCard(c) : null))),
  };
}

function cfApplyBattleView(view) {
  if (!view || view.v !== 2) return false;
  battle.turn = view.turn || 1;
  battle.firstPlayerSide = view.firstPlayerSide === 1 ? 1 : 0;
  battle.activeSide = view.activeSide === 1 ? 1 : 0;
  battle.gameOver = Boolean(view.gameOver);
  battle.turnLogs = Array.isArray(view.turnLogs) ? view.turnLogs : [];
  battle.leaders[0] = cfDeserializeLeader(view.leaders[0], 0);
  battle.leaders[1] = cfDeserializeLeader(view.leaders[1], 1);
  battle.board = [0, 1].map(s => {
    const row = (view.board && view.board[s]) || [];
    return [0, 1, 2, 3, 4].map(l => (row[l] ? cfDeserializeCard(row[l], s) : null));
  });
  return true;
}

/** 把双方交换（行动方 ↔ side 0）。服务器在结算某一方的动作前调用，使引擎始终以"当前行动方 = side 0"运行。 */
function cfSwapBattleSides() {
  battle.leaders = [battle.leaders[1], battle.leaders[0]];
  battle.board = [battle.board[1], battle.board[0]];
  for (let s = 0; s < 2; s++) {
    const st = battle.leaders[s];
    if (st) {
      (st.hand || []).forEach(c => { if (c) c.owner = s; });
      (st.deck || []).forEach(c => { if (c) c.owner = s; });
    }
    (battle.board[s] || []).forEach(c => { if (c) c.owner = s; });
  }
  battle.firstPlayerSide = 1 - battle.firstPlayerSide;
  battle.activeSide = 1 - battle.activeSide;
  (battle.turnLogs || []).forEach(g => { if (g && (g.side === 0 || g.side === 1)) g.side = 1 - g.side; });
}

// 单机存档沿用旧函数名（28-save-reconnect.js 调用）
function serializeBattleSnapshot() {
  return cfBuildBattleView('local');
}
