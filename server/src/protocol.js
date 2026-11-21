// 客户端消息的类型校验与清洗。原则：服务器只接受白名单字段，所有字符串限长并去除控制字符，
// 所有数字必须是安全整数；语义校验（能不能出这张牌）交给规则引擎。

// C0/C1 控制字符、零宽字符、双向文本覆盖符（可用于伪装昵称）
const BAD_CHARS = /[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁠-⁩﻿]/g;

export function cleanText(v, max) {
  if (typeof v !== 'string') return '';
  const s = v.replace(BAD_CHARS, '').replace(/\s+/g, ' ').trim();
  return Array.from(s).slice(0, max).join('');
}

export const LIMITS = Object.freeze({
  nickname: 14,
  roomName: 20,
  password: 16,
  chat: 120,
  emote: 24,
  deckCards: 60,
  idLen: 40,
});

const ID_RE = /^[A-Za-z0-9_-]{1,40}$/;
const TOKEN_RE = /^[A-Za-z0-9_-]{16,64}$/;
const ROOM_RE = /^[A-Z0-9]{4,10}$/;

export const isId = (v) => typeof v === 'string' && ID_RE.test(v);
export const isToken = (v) => typeof v === 'string' && TOKEN_RE.test(v);
export const cleanRoomId = (v) => (typeof v === 'string' && ROOM_RE.test(v.trim().toUpperCase()) ? v.trim().toUpperCase() : '');

export function int(v, { min = -(2 ** 31), max = 2 ** 31 - 1, def = undefined } = {}) {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return Number.isSafeInteger(n) && n >= min && n <= max ? n : def;
}

export function intList(v, maxLen, opts) {
  if (!Array.isArray(v) || v.length > maxLen) return undefined;
  const out = [];
  for (const x of v) {
    const n = int(x, opts);
    if (n === undefined) return undefined;
    out.push(n);
  }
  return out;
}

const AVATAR_KEYS = ['backdrop', 'hairStyle', 'hairColor', 'eyeStyle', 'outfit', 'armorColor', 'wings', 'weapon', 'headgear'];
const AVATAR_CARD_KEYS = ['avatarCardId', 'leaderCardId'];

/** 头像配置：只保留白名单键，值必须是短标识符；卡牌头像必须是真实存在的卡 */
export function cleanAvatar(v, cardExists = () => false) {
  const out = {};
  if (!v || typeof v !== 'object' || Array.isArray(v)) return out;
  for (const k of AVATAR_KEYS) if (isId(v[k]) && v[k].length <= 24) out[k] = v[k];
  for (const k of AVATAR_CARD_KEYS) if (isId(v[k]) && cardExists(v[k])) out[k] = v[k];
  return out;
}

export function cleanDeckIds(v) {
  if (!Array.isArray(v) || v.length === 0 || v.length > LIMITS.deckCards) return undefined;
  return v.every(isId) ? v.slice() : undefined;
}

export const PRESENCE_STATUSES = new Set([
  'idle', 'away', 'in_lobby', 'spectating', 'playing_pvp', 'playing_ai', 'in_room', 'editing_deck', 'designing', 'customizing',
]);

const LANE = { min: -2, max: 4 };
const SIDE = { min: -1, max: 1 };
const UID = { min: -(2 ** 31), max: 2 ** 31 - 1 };

/** ACTION 消息参数清洗：返回 { type, params } 或 null */
export function cleanAction(msg) {
  const type = msg && msg.action;
  const p = (msg && msg.params && typeof msg.params === 'object' && !Array.isArray(msg.params)) ? msg.params : {};
  switch (type) {
    case 'PLAY': {
      const out = {
        uid: int(p.uid, UID),
        lane: int(p.lane, { min: -1, max: 4, def: -1 }),
        sacLanes: intList(p.sacLanes ?? [], 5, { min: 0, max: 4 }),
        effectTargetLane: int(p.effectTargetLane, { ...LANE, def: -1 }),
        effectTargetSide: int(p.effectTargetSide, { ...SIDE, def: -1 }),
        effectTargetLane2: int(p.effectTargetLane2, { ...LANE, def: -1 }),
        choiceIdx: int(p.choiceIdx, { min: -1, max: 8, def: -1 }),
        handTargetUid: int(p.handTargetUid, { ...UID, def: -1 }),
      };
      if (out.uid === undefined || out.sacLanes === undefined) return null;
      return { type, params: out };
    }
    case 'ACTIVATE': {
      const out = {
        lane: int(p.lane, { min: 0, max: 4 }),
        targetLane: int(p.targetLane, { min: -1, max: 4, def: -1 }),
        handTargetUid: int(p.handTargetUid, { ...UID, def: -1 }),
      };
      if (out.lane === undefined) return null;
      return { type, params: out };
    }
    case 'FUSE': {
      const out = { uid: int(p.uid, UID), materialUids: intList(p.materialUids, 10, UID) };
      if (out.uid === undefined || !out.materialUids || out.materialUids.length === 0) return null;
      return { type, params: out };
    }
    case 'END_TURN':
      return { type, params: {} };
    default:
      return null;
  }
}
