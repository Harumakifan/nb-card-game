import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MatchEngine, orientEvents } from '../src/engine/matchEngine.js';
import { EngineHost, seededRandom } from '../src/engine/engineHost.js';
import { Bot } from './helpers/bot.js';

const ref = new EngineHost();
const PRESETS = JSON.parse(ref.eval('JSON.stringify(PRESET_DECKS.map(d => expandDeck(d)))'));

async function playFullGame(seed, deckA, deckB, { maxSteps = 900 } = {}) {
  const rand = seededRandom(seed);
  const engine = new MatchEngine({ decks: [deckA, deckB], firstSeat: seed % 2, random: rand });
  const bots = [new Bot(seed * 2 + 1), new Bot(seed * 2 + 2)];
  const stats = { actions: 0, rejectedByServer: [], leaks: 0, events: 0, turns: 0 };
  const sync = () => { for (const s of [0, 1]) bots[s].applyView(engine.viewFor(s)); };
  try {
    sync();
    for (const s of [0, 1]) {
      const r = await engine.mulligan(s, rand() < 0.5 ? [0, 2] : []);
      assert.equal(r.ok, true);
      r.steps.forEach(st => { stats.events += st.events.length; });
    }
    let guard = 0;
    while (engine.phase === 'playing' && guard++ < maxSteps) {
      const seat = engine.activeSeat;
      sync();
      for (const s of [0, 1]) stats.leaks += bots[s].leakCount();
      const acts = bots[seat].legalActions();
      let r;
      if (acts.length && bots[seat].rand() < 0.85) {
        const a = bots[seat].pick(acts);
        r = a.type === 'PLAY' ? await engine.play(seat, a.params)
          : a.type === 'FUSE' ? await engine.fuse(seat, a.params)
          : await engine.activate(seat, a.params);
        stats.actions++;
        if (!r.ok) {
          stats.rejectedByServer.push({ type: a.type, reason: r.reason });
          r = await engine.endTurn(seat);
          stats.turns++;
        }
      } else {
        r = await engine.endTurn(seat);
        stats.turns++;
      }
      assert.equal(r.ok, true, `action failed: ${r.reason}`);
      r.steps.forEach(st => { stats.events += st.events.length; });
    }
    return { engine, stats, result: engine.result, errors: [...engine.errors], missing: [...engine.host.missing] };
  } finally {
    bots.forEach(b => b.dispose());
  }
}

test('无头引擎：机器人完整对局可以打完、无异常、无隐藏信息泄露、客户端与服务器合法性判断一致', async () => {
  const pairs = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [2, 2]];
  let finished = 0;
  for (let i = 0; i < pairs.length; i++) {
    const [a, b] = pairs[i];
    const { result, stats, errors, engine, missing } = await playFullGame(100 + i, PRESETS[a], PRESETS[b]);
    const st = engine.stat();
    console.log(`  game ${i}: decks ${a}v${b} result=${JSON.stringify(result)} turn=${st.turn} actions=${stats.actions} turns=${stats.turns} events=${stats.events} rejected=${stats.rejectedByServer.length}`);
    assert.deepEqual(errors, [], `engine errors: ${errors.join('\n')}`);
    assert.equal(stats.leaks, 0, 'opponent hidden cards leaked into a view');
    assert.deepEqual(stats.rejectedByServer, [], 'server rejected an action the client considered legal');
    if (missing.length) console.log('  missing DOM APIs:', missing.join(', '));
    if (result) finished++;
    engine.dispose();
  }
  assert.ok(finished >= pairs.length - 1, `only ${finished}/${pairs.length} games finished`);
});

test('非法动作一律被拒绝，且不改变局面', async () => {
  const engine = new MatchEngine({ decks: [PRESETS[0], PRESETS[1]], firstSeat: 0, random: seededRandom(7) });
  await engine.mulligan(0, []);
  await engine.mulligan(1, []);
  const before = engine.viewFor(0);
  const bad = [
    () => engine.play(1, { uid: 1, lane: 0 }),                         // 不是自己的回合
    () => engine.play(0, { uid: 123, lane: 0 }),                       // 不存在的手牌
    () => engine.play(0, { uid: '__proto__', lane: 0 }),
    () => engine.play(0, null),
    () => engine.activate(0, { lane: 9 }),
    () => engine.fuse(0, { uid: -1, materialUids: ['x'] }),
    () => engine.endTurn(1),
    () => engine.mulligan(0, [0]),                                    // 已过换牌阶段
  ];
  for (const f of bad) {
    const r = await f();
    assert.equal(r.ok, false);
  }
  // 手牌中的牌放到越界战道 / 已占用战道
  const view = JSON.parse(engine.viewFor(0));
  for (const c of view.leaders[0].hand) {
    for (const lane of [-1, 5, 99, 'x']) {
      const r = await engine.play(0, { uid: c.uid, lane });
      assert.equal(r.ok, false);
    }
  }
  assert.equal(engine.viewFor(0), before);
  engine.dispose();
});

test('视图裁剪：对手手牌与牌库只给张数，uid 不可预测', async () => {
  const engine = new MatchEngine({ decks: [PRESETS[0], PRESETS[0]], firstSeat: 0, random: seededRandom(3) });
  const v0 = JSON.parse(engine.viewFor(0));
  const v1 = JSON.parse(engine.viewFor(1));
  assert.ok(v0.leaders[1].hand.every(h => h.c === '__hidden__' && h.uid === undefined));
  assert.deepEqual(Object.keys(v0.leaders[1].deck), ['hidden']);
  assert.equal(v0.leaders[1].deck.hidden, 36);
  assert.equal(v0.leaders[0].deck.length, 36);
  // 自己的牌库按 uid 排序，不暴露抽牌顺序
  const uids = v0.leaders[0].deck.map(c => c.uid);
  assert.deepEqual(uids, [...uids].sort((a, b) => a - b));
  assert.ok(uids.every(u => u >= 1000000));
  // 观战视角：双方手牌都隐藏
  const sp = JSON.parse(engine.viewFor(null));
  assert.ok(sp.leaders.every(l => l.hand.every(h => h.c === '__hidden__')));
  assert.equal(v1.leaders[0].hand.length, 4);
  engine.dispose();
});

test('特效事件按接收者翻转视角，私密提示对对手隐藏', () => {
  const evs = [
    { kind: 'attack_strike', side: 0, fromLane: 1, toLane: 1 },
    { kind: 'beam', fromSide: 0, toSide: 1 },
    { kind: 'toast', side: 0, cid: 'x', msg: '从牌库抽取1张机械随从卡。', priv: true, pub: '对手从牌库检索了 1 张机械随从卡' },
  ];
  const mine = orientEvents(evs, 0, 0);
  const theirs = orientEvents(evs, 0, 1);
  assert.equal(mine[0].side, 0);
  assert.equal(theirs[0].side, 1);
  assert.equal(theirs[1].fromSide, 1);
  assert.equal(theirs[1].toSide, 0);
  assert.equal(mine[2].msg, '从牌库抽取1张机械随从卡。');
  assert.equal(mine[2].priv, undefined);
  assert.equal(theirs[2].cid, 'sys_notice');
  assert.equal(theirs[2].msg, '对手从牌库检索了 1 张机械随从卡');
});

test('静态检查：服务器置空的表现层函数不得修改对局状态或接受回调', async () => {
  const { UI_STUBS } = await import('../src/engine/engineHost.js');
  const { readFileSync } = await import('node:fs');
  const dir = new URL('../../src/client/', import.meta.url);
  const files = JSON.parse(readFileSync(new URL('manifest.json', dir), 'utf8'));
  const src = files.map(f => readFileSync(new URL(f, dir), 'utf8')).join('');
  const ALLOW = new Set(['openCardDetailPanel', 'setHandCollapsed']); // 仅写 UI 字段（inspectedCard / handCollapsed）或已抽离到 cfPerform*
  const offenders = [];
  for (const n of UI_STUBS) {
    const m = src.match(new RegExp('(?:async )?function ' + n + '\\s*\\(([^)]*)\\)'));
    assert.ok(m, `stubbed function ${n} not found`);
    if (ALLOW.has(n)) continue;
    const start = src.indexOf('{', src.indexOf(m[0]));
    let depth = 0, end = start;
    for (; end < src.length; end++) { if (src[end] === '{') depth++; else if (src[end] === '}' && --depth === 0) break; }
    const body = src.slice(start, end);
    if (/onImpact|callback|\bcb\b|onDone/.test(m[1])) offenders.push(`${n}: takes a callback`);
    const w = body.match(/battle\.(?!inspectedCard|handCollapsed)[a-zA-Z_]+(?:\[[^\]]*\]|\.[a-zA-Z_]+)*\s*(?:=(?!=)|\+=|-=)|\.(?:hp|currentHp|bones|energy|maxEnergy)\s*(?:=(?!=)|\+=|-=)/);
    if (w) offenders.push(`${n}: writes ${w[0].slice(0, 40)}`);
  }
  assert.deepEqual(offenders, []);
});
