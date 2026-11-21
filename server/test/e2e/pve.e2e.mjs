// 单机回归：联机改造动过了出牌 / 结束回合 / 换牌 / 启动 / 融合 / 存档的公共入口，确认人机对战与 AI 观战仍然正常
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startApp, launch, openPage } from './harness.mjs';

let app, browser;
before(async () => { app = await startApp(); browser = await launch(); });
after(async () => { await browser?.close(); await app?.close(); });

async function fastPage(name) {
  const p = await openPage(browser, app.base, name);
  await p.evaluate(() => localStorage.setItem('cf_battle_speed', '8'));
  await p.reload({ waitUntil: 'load' });
  await p.waitForFunction(() => typeof initNewBattle === 'function' && window.CF_ART_MANIFEST);
  return p;
}

const pageErrors = (p) => p.cfErrors.filter(e => /PAGEERROR|CSP_VIOLATION|Content Security Policy|ReferenceError|TypeError/.test(e));

test('人机对战：换牌 → 拖拽出牌 → 结束回合 → AI 行动，循环数回合无异常', { timeout: 180_000 }, async () => {
  const p = await fastPage('PvE');
  await p.click('#btnMenuStartPve');
  await p.waitForFunction(() => !document.getElementById('mulliganModal').classList.contains('hidden'), null, { timeout: 10000 });
  await p.click('#btnConfirmMulligan');
  let plays = 0;
  for (let t = 0; t < 4; t++) {
    await p.waitForFunction(() => battle.gameOver || (battle.activeSide === 0 && !battle.animating && document.getElementById('mulliganModal').classList.contains('hidden')), null, { timeout: 60000 });
    if (await p.evaluate(() => battle.gameOver)) break;
    const pick = await p.evaluate(() => {
      const lane = battle.board[0].findIndex(x => x === null);
      if (lane === -1) return null;
      for (const c of battle.leaders[0].hand) {
        const pe = evaluateCardPlayState(0, c);
        if (pe.ok && c.data.type === 'minion' && !(c.data.sacrifice || 0) && !getCardChoices(c).length && !getCardTargetRequirement(c, pe.mode === 'enhance', -1, pe.mode) && pe.mode !== 'accelerate' && pe.mode !== 'crystallize') return { uid: c.uid, lane };
      }
      return null;
    });
    if (pick) {
      const a = await p.locator(`#playerHandZone [data-card-uid="${pick.uid}"]`).boundingBox();
      const b = await p.locator('#playerLanesRow > *').nth(pick.lane).boundingBox();
      const gy = a.y + Math.min(50, a.height / 4);
      await p.mouse.move(a.x + a.width / 2, gy);
      await p.mouse.down();
      await p.mouse.move(a.x + a.width / 2, gy - 60, { steps: 4 });
      await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 10 });
      await p.mouse.up();
      await p.waitForFunction(({ uid, lane }) => battle.board[0][lane] && battle.board[0][lane].uid === uid, pick, { timeout: 15000 });
      plays++;
    }
    await p.waitForFunction(() => !battle.animating, null, { timeout: 30000 });
    await p.click('#btnTurnOrb');
  }
  assert.ok(plays > 0, 'no card played in PvE');
  assert.deepEqual(pageErrors(p), []);
  // 单机存档使用新的 V2 视图格式
  await p.evaluate(() => savePveBattleProgress());
  const saved = await p.evaluate(() => JSON.parse(localStorage.getItem('CF_SAVED_PVE_BATTLE_V2') || 'null'));
  if (saved) assert.equal(saved.snap.v, 2);
});

test('AI 观战模式（AI 对 AI，含 AI 的启动 / 融合 / 献祭等全部规则路径）跑若干回合无异常', { timeout: 240_000 }, async () => {
  const p = await fastPage('AIvsAI');
  await p.click('#btnMenuSpectate');
  await p.waitForFunction(() => battle.gameOver || battle.turn >= 6, null, { timeout: 200_000, polling: 1000 });
  const st = await p.evaluate(() => ({ turn: battle.turn, over: battle.gameOver, hp: battle.leaders.map(l => l.hp) }));
  console.log('  AI vs AI:', JSON.stringify(st));
  assert.deepEqual(pageErrors(p), []);
});
