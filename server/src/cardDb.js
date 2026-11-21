// 服务器侧卡牌数据库：只认内置卡池（INITIAL_CCG_DATA）。玩家本地设计器里的自定义卡不能带进联机。
import { EngineHost } from './engine/engineHost.js';

let ref = null;
let knownIds = null;
let rules = null;

function ensure() {
  if (ref) return;
  ref = new EngineHost();
  knownIds = new Set(JSON.parse(ref.eval('JSON.stringify(Object.keys(cardsById))')));
  rules = JSON.parse(ref.eval('JSON.stringify(RULES)'));
  ref.eval(`var __cfDeckCheck = (json) => {
    const ids = JSON.parse(json);
    const cards = {};
    for (const id of ids) cards[id] = (cards[id] || 0) + 1;
    return JSON.stringify(validateDeckLegality({ cards }));
  };`);
}

export function cardExists(id) {
  ensure();
  return typeof id === 'string' && knownIds.has(id);
}

export function getRules() {
  ensure();
  return rules;
}

/** 校验联机卡组：必须恰好 RULES.deckSize 张、单卡不超过上限、不含衍生物与未知卡 */
export function validateDeck(ids) {
  ensure();
  if (!Array.isArray(ids)) return { ok: false, reason: '卡组数据无效' };
  if (ids.some(id => !knownIds.has(id))) return { ok: false, reason: '卡组包含联机卡池之外的卡牌（自定义设计卡不能用于联机）' };
  const r = JSON.parse(ref.get('__cfDeckCheck')(JSON.stringify(ids)));
  return r.ok ? { ok: true } : { ok: false, reason: r.reason || '卡组不合法' };
}

export function presetDecks() {
  ensure();
  return JSON.parse(ref.eval('JSON.stringify(PRESET_DECKS.map(d => ({ name: d.name, ids: expandDeck(d) })))'));
}
