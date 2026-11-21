// 浸泡测试：随机卡组的机器人对局 N 局，统计异常 / 卡死 / 隐藏信息泄露 / 服务器拒绝。用法：npm run test:soak -- 200
import { MatchEngine } from '../src/engine/matchEngine.js';
import { EngineHost, seededRandom } from '../src/engine/engineHost.js';
import { Bot } from './helpers/bot.js';
const ref = new EngineHost();
const P = JSON.parse(ref.eval('JSON.stringify([...PRESET_DECKS.map(d => expandDeck(d)), expandDeck(AI_DRAGON_EVO_DECK)])'));
const N = Number(process.argv[2] || 60);
const agg = { done: 0, stuck: 0, errors: new Map(), rejected: new Map(), leaks: 0, turns: [], ms: [] };
for (let g = 0; g < N; g++) {
  const r0 = seededRandom(9000 + g);
  const a = Math.floor(r0() * P.length), b = Math.floor(r0() * P.length);
  const t0 = performance.now();
  const e = new MatchEngine({ decks: [P[a], P[b]], firstSeat: g % 2, random: r0 });
  const bots = [new Bot(g * 3 + 1), new Bot(g * 3 + 2)];
  await e.mulligan(0, r0() < .5 ? [1] : []); await e.mulligan(1, r0() < .5 ? [0, 3] : []);
  let i = 0;
  while (e.phase === 'playing' && i++ < 1500) {
    const s = e.activeSeat;
    bots[s].applyView(e.viewFor(s)); bots[1 - s].applyView(e.viewFor(1 - s));
    agg.leaks += bots[0].leakCount() + bots[1].leakCount();
    const acts = bots[s].legalActions();
    let r;
    if (acts.length && bots[s].rand() < 0.8) {
      const x = bots[s].pick(acts);
      r = await e[x.type === 'PLAY' ? 'play' : x.type === 'FUSE' ? 'fuse' : 'activate'](s, x.params);
      if (!r.ok) { const k = x.type + ':' + r.reason; agg.rejected.set(k, (agg.rejected.get(k) || 0) + 1); await e.endTurn(s); }
    } else await e.endTurn(s);
  }
  if (e.result) agg.done++; else agg.stuck++;
  agg.turns.push(e.stat().turn); agg.ms.push(performance.now() - t0);
  for (const er of e.errors) { const k = er.split('\n')[0].slice(0, 160); agg.errors.set(k, (agg.errors.get(k) || 0) + 1); }
  e.dispose(); bots.forEach(x => x.dispose());
}
const avg = a => (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1);
console.log(`games=${N} finished=${agg.done} stuck=${agg.stuck} leaks=${agg.leaks} avgTurn=${avg(agg.turns)} maxTurn=${Math.max(...agg.turns)} avgMs=${avg(agg.ms)}`);
console.log('rejected:', [...agg.rejected]);
console.log('errors:', [...agg.errors]);
