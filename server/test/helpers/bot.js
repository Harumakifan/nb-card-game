// 测试用机器人：像真实浏览器一样，只根据服务器下发的视图（隐藏信息已裁剪）决策，
// 用同一份规则代码（cfValidatePlay 等）在本地枚举合法动作，再交给服务器裁决。
import vm from 'node:vm';
import { EngineHost, seededRandom } from '../../src/engine/engineHost.js';

const BOT_HELPERS = new vm.Script(`
var __cfBot = {
  apply(json) { cfApplyBattleView(JSON.parse(json)); },
  enumerate() {
    const out = [];
    const st = battle.leaders[0];
    if (!st) return '[]';
    for (const card of st.hand) {
      if (!card || card.hidden) continue;
      const pe = evaluateCardPlayState(0, card);
      if (!pe || !pe.ok) continue;
      const needSac = (card.data.sacrifice || 0) > 0 && pe.mode !== 'accelerate' ? card.data.sacrifice : 0;
      const validSac = getValidSacrificeLanes(0, card.data.sacrificeCond || '');
      const sacSets = needSac > 0 ? [validSac.slice(0, needSac), validSac.slice(-needSac)] : [[]];
      const choices = getCardChoices(card);
      const choiceIdxs = choices.length ? choices.map((_, i) => i) : [0];
      const others = st.hand.filter(h => h !== card);
      for (const sacLanes of sacSets) {
        if (sacLanes.length !== needSac) continue;
        for (const choiceIdx of choiceIdxs) {
          const base = { uid: card.uid, sacLanes, choiceIdx, handTargetUid: others.length ? others[0].uid : -1 };
          const tgts = [{ effectTargetLane: -1, effectTargetSide: -1 }];
          for (const s of [0, 1]) for (const l of [-2, 0, 1, 2, 3, 4]) tgts.push({ effectTargetLane: l, effectTargetSide: s });
          tgts.push({ effectTargetLane: 0, effectTargetLane2: 1, effectTargetSide: 0 });
          for (const t of tgts) {
            for (const lane of [0, 1, 2, 3, 4]) {
              const p = Object.assign({}, base, t, { lane });
              if (cfValidatePlay(0, p).ok) { out.push({ type: 'PLAY', params: p }); break; }
            }
          }
        }
      }
      const fi = cfGetFusionInfo(0, card.uid);
      if (fi.ok) out.push({ type: 'FUSE', params: { uid: card.uid, materialUids: [fi.validMaterials[0].uid] } });
    }
    for (let l = 0; l < 5; l++) {
      const info = cfGetActivateInfo(0, l);
      if (!info.ok) continue;
      const p = { lane: l };
      if (info.need === 'hand_card') { const h = st.hand.find(x => !x.hidden); if (!h) continue; p.handTargetUid = h.uid; }
      if (info.need === 'enemy_minion') { const ts = cfActivateEnemyTargetLanes(0); if (!ts.length) continue; p.targetLane = ts[0]; }
      out.push({ type: 'ACTIVATE', params: p });
    }
    return JSON.stringify(out);
  },
  hiddenLeak() {
    // 断言：对手的手牌与牌库在本地视图中必须全部是占位牌
    const opp = battle.leaders[1];
    const pub = new Set((opp.publicHandIds || []).map(p => String(p.uid)));
    const leakedHand = opp.hand.filter(h => !h.hidden && !pub.has(String(h.uid))).length;
    const leakedDeck = opp.deck.filter(d => !d.hidden).length;
    return leakedHand + leakedDeck;
  },
};
`, { filename: 'bot-helpers.js' });

export class Bot {
  constructor(seed = 1) {
    this.host = new EngineHost({ random: seededRandom(seed) });
    BOT_HELPERS.runInContext(this.host.context);
    this.b = this.host.get('__cfBot');
    this.rand = seededRandom(seed * 7919 + 13);
  }
  applyView(viewJson) { this.b.apply(viewJson); }
  legalActions() { return JSON.parse(this.b.enumerate()); }
  leakCount() { return this.b.hiddenLeak(); }
  pick(list) { return list[Math.floor(this.rand() * list.length)]; }
  dispose() { this.host.dispose(); }
}
