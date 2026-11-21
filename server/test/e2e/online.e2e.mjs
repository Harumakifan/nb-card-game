// 浏览器端到端测试：两名玩家 + 一名观战者，在真实 Chromium 中通过 UI 完成
// 大厅建房 → 加入 → 准备 → 换牌 → 拖拽出牌 → 结束回合 → 观战 → 投降 → 结算 → 回到房间。
// 运行：npm run build && npm run test:e2e   （需要 playwright-core 与 chromium-headless-shell）
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startApp, launch, openPage } from './harness.mjs';

const SHOT = process.env.SHOT_DIR || '';
let app, browser;
const pages = [];

before(async () => { app = await startApp({ turnSeconds: 120 }); browser = await launch(); });
after(async () => {
  for (const p of pages) {
    const errs = p.cfErrors.filter(e => !/favicon/.test(e));
    if (errs.length) console.log(`[${p.cfName}] console errors:\n  ` + errs.join('\n  '));
    if (p.cfFailed.length) console.log(`[${p.cfName}] failed requests:\n  ` + p.cfFailed.join('\n  '));
  }
  await browser?.close();
  await app?.close();
});

const shot = async (page, name) => { if (SHOT) await page.screenshot({ path: `${SHOT}/${name}.png` }); };
const visible = (page, id) => page.evaluate((i) => { const el = document.getElementById(i); return Boolean(el && !el.classList.contains('hidden') && el.style.display !== 'none' && el.offsetParent !== null); }, id);
async function waitVisible(page, id, timeout = 10000) {
  await page.waitForFunction((i) => { const el = document.getElementById(i); return el && !el.classList.contains('hidden') && el.style.display !== 'none'; }, id, { timeout });
}

async function newPlayer(name) {
  const p = await openPage(browser, app.base, name);
  await p.evaluate((n) => { localStorage.setItem('cf_online_nick', n); }, name);
  await p.reload({ waitUntil: 'load' });
  pages.push(p);
  await p.waitForFunction(() => typeof openOnlineLobbyModal === 'function' && window.CF_ART_MANIFEST);
  return p;
}

async function openLobby(p) {
  await p.click('#btnMenuStartOnline');
  await waitVisible(p, 'onlineLobbyModal');
  await p.waitForFunction(() => OnlineState.connected, null, { timeout: 10000 });
}

/** 找一张"直接拖到空战道即可打出"的随从（无祭品 / 抉择 / 目标），返回 uid 与空战道 */
function pickSimplePlay(page) {
  return page.evaluate(() => {
    const st = battle.leaders[0];
    const lane = battle.board[0].findIndex(x => x === null);
    if (lane === -1 || !onlineIsMyTurn()) return null;
    for (const c of st.hand) {
      const pe = evaluateCardPlayState(0, c);
      if (!pe.ok || c.data.type !== 'minion' || (c.data.sacrifice || 0) > 0 || pe.mode === 'accelerate' || pe.mode === 'crystallize') continue;
      if (getCardChoices(c).length) continue;
      if (getCardTargetRequirement(c, pe.mode === 'enhance', -1, pe.mode)) continue;
      return { uid: c.uid, lane, name: c.data.name };
    }
    return null;
  });
}

async function dragCardToLane(page, uid, lane) {
  const card = page.locator(`#playerHandZone [data-card-uid="${uid}"]`);
  const cell = page.locator('#playerLanesRow > *').nth(lane);
  const a = await card.boundingBox();
  const b = await cell.boundingBox();
  // 手牌下半部分在视口之外：按在卡片上部可见区域
  const grabY = a.y + Math.min(50, a.height / 4);
  await page.mouse.move(a.x + a.width / 2, grabY);
  await page.mouse.down();
  await page.mouse.move(a.x + a.width / 2, grabY - 60, { steps: 4 });
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 10 });
  await page.mouse.up();
}

test('两名玩家 + 观战者：完整联机流程（真实浏览器、真实 UI、严格 CSP）', { timeout: 180_000 }, async () => {
  const A = await newPlayer('房主小A');
  const B = await newPlayer('挑战者小B');

  // 1) A 建房
  await openLobby(A);
  await A.fill('#createRoomNameInput', '端到端测试房');
  await A.fill('#createRoomPwdInput', 'pw123');
  await A.click('#btnCreateOnlineRoom');
  await waitVisible(A, 'versusRoomModal');
  const roomId = await A.evaluate(() => OnlineState.roomId);
  assert.match(roomId, /^[A-Z0-9]{6}$/);
  await shot(A, '10-versus-room');

  // 2) B 在大厅看到房间 → 加入 → 先输错密码再输对
  await openLobby(B);
  await B.waitForSelector('#onlineRoomList .arcade-btn-join', { timeout: 10000 });
  await shot(B, '11-lobby');
  await B.click('#onlineRoomList .arcade-btn-join');
  await waitVisible(B, 'onlinePwdModal');
  await B.fill('#onlinePwdInput', 'wrong');
  await B.click('#btnConfirmJoinPwd');
  await B.waitForFunction(() => !document.getElementById('onlinePwdError').classList.contains('hidden'));
  await B.fill('#onlinePwdInput', 'pw123');
  await B.click('#btnConfirmJoinPwd');
  await waitVisible(B, 'versusRoomModal');
  await A.waitForFunction(() => Boolean(OnlineState.guestId));

  // 3) 双方准备 → 服务器开局 → 换牌
  await A.click('#btnVrToggleReady');
  await B.click('#btnVrToggleReady');
  await waitVisible(A, 'mulliganModal', 15000);
  await waitVisible(B, 'mulliganModal', 15000);
  await shot(A, '12-mulligan');
  for (const P of [A, B]) {
    const leak = await P.evaluate(() => ({
      oppHandHidden: battle.leaders[1].hand.every(h => h.hidden),
      oppDeckHidden: battle.leaders[1].deck.every(h => h.hidden),
      ownHand: battle.leaders[0].hand.length,
    }));
    assert.deepEqual(leak, { oppHandHidden: true, oppDeckHidden: true, ownHand: leak.ownHand });
    assert.ok(leak.ownHand >= 4);
  }
  await A.click('#btnConfirmMulligan');
  await B.click('#btnConfirmMulligan');
  await A.waitForFunction(() => battle.turn >= 1 && document.getElementById('mulliganModal').classList.contains('hidden') && !OnlineState.awaitingServer, null, { timeout: 15000 });
  await B.waitForFunction(() => document.getElementById('mulliganModal').classList.contains('hidden'), null, { timeout: 15000 });

  // 4) 观战者加入
  const C = await newPlayer('观众小C');
  await openLobby(C);
  await C.waitForSelector('#onlineRoomList .arcade-btn-spec');
  await C.click('#onlineRoomList .arcade-btn-spec');
  await C.waitForFunction(() => OnlineState.isSpectator && battle.leaders[0] && battle.leaders[0].hand.length > 0, null, { timeout: 10000 });
  assert.equal(await visible(C, 'mulliganModal'), false, 'spectator should not see a mulligan dialog');
  const specView = await C.evaluate(() => ({
    allHidden: battle.leaders.every(l => l.hand.every(h => h.hidden || (l.publicHandIds || []).some(p => p.uid === h.uid))),
    backs: document.querySelectorAll('#playerHandZone .sv-hand-card-back').length,
    hand0: battle.leaders[0].hand.length,
  }));
  assert.equal(specView.allHidden, true);
  assert.equal(specView.backs, specView.hand0);

  // 5) 轮流行动：能直接打出的随从就拖拽打出，然后点回合球结束回合
  let plays = 0;
  for (let turn = 0; turn < 6; turn++) {
    const P = (await A.evaluate(() => onlineIsMyTurn())) ? A : B;
    const O = P === A ? B : A;
    await P.waitForFunction(() => onlineIsMyTurn() && !battle.animating, null, { timeout: 15000 });
    for (let k = 0; k < 2; k++) {
      const pick = await pickSimplePlay(P);
      if (!pick) break;
      const oppBefore = await O.evaluate(() => battle.board[1].filter(Boolean).length);
      await dragCardToLane(P, pick.uid, pick.lane);
      await P.waitForFunction(({ uid, lane }) => battle.board[0][lane] && battle.board[0][lane].uid === uid && !OnlineState.awaitingServer, pick, { timeout: 10000 });
      await O.waitForFunction((n) => battle.board[1].filter(Boolean).length > n || battle.gameOver, oppBefore, { timeout: 10000 });
      plays++;
      if (plays === 1) { await shot(P, '13-after-play'); await shot(O, '14-opponent-view'); await shot(C, '15-spectator'); }
    }
    if (await P.evaluate(() => battle.gameOver)) break;
    await P.click('#btnTurnOrb');
    await O.waitForFunction(() => onlineIsMyTurn() || battle.gameOver, null, { timeout: 15000 });
  }
  assert.ok(plays > 0, 'no card was played through the UI');

  // 5b) 对局中刷新页面：凭本标签页的会话令牌自动重连，回到同一局（对手看到断线横幅后恢复）
  if (!(await A.evaluate(() => battle.gameOver))) {
    const handBefore = await B.evaluate(() => battle.leaders[0].hand.map(h => h.uid).sort().join(','));
    await B.reload({ waitUntil: 'load' });
    await B.waitForFunction(() => OnlineState.inMatch && battle.leaders[0] && battle.leaders[0].hand.length > 0, null, { timeout: 15000 });
    const handAfter = await B.evaluate(() => battle.leaders[0].hand.map(h => h.uid).sort().join(','));
    assert.equal(handAfter, handBefore, 'hand changed across reconnect');
    await A.waitForFunction(() => document.getElementById('oppDisconnectBanner').classList.contains('hidden'), null, { timeout: 10000 });
    await shot(B, '18-after-reload');
  }

  // 6) 聊天（XSS 载荷必须原样显示为文本）
  await A.evaluate(() => sendRoomPacket({ type: 'CHAT_MSG', text: '<img src=x onerror=alert(1)>你好' }));
  await B.waitForFunction(() => document.body.textContent.includes('<img src=x onerror=alert(1)>你好'), null, { timeout: 5000 });
  assert.equal(await B.evaluate(() => document.querySelectorAll('img[src="x"]').length), 0);

  // 7) B 投降 → 双方结算 → 回到对战房间
  if (!(await A.evaluate(() => battle.gameOver))) {
    await B.click('#btnTopSurrenderExit');
    await waitVisible(B, 'gameCustomDialogModal');
    await B.click('#btnGameDialogYes');
  }
  await A.waitForFunction(() => /VICTORY|DEFEAT|DRAW/.test(document.getElementById('vicTitleTxt')?.textContent || ''), null, { timeout: 10000 });
  await shot(A, '16-result');
  await waitVisible(A, 'versusRoomModal', 8000);
  await waitVisible(B, 'versusRoomModal', 8000);
  const score = await A.evaluate(() => OnlineState.hostWins + OnlineState.guestWins);
  assert.equal(score, 1);
  await shot(A, '17-back-to-room');

  // 8) 卡牌设计器 iframe 在严格 CSP 下可以加载并执行脚本
  const frameOk = await A.evaluate(() => new Promise((res) => {
    const f = document.getElementById('designerV23Frame');
    const check = () => { try { const d = f.contentDocument; res(Boolean(d && d.readyState === 'complete' && d.body && d.body.innerHTML.length > 1000 && d.querySelectorAll('script').length === 1)); } catch (e) { res(false); } };
    if (f.contentDocument && f.contentDocument.readyState === 'complete') check(); else f.addEventListener('load', check, { once: true });
    setTimeout(() => res(false), 5000);
  }));
  assert.equal(frameOk, true, 'designer iframe failed to load');

  // 9) 卡图：缩略图按需加载成功
  const art = await A.evaluate(() => [...document.images].filter(i => i.src.includes('/art/thumb/')).map(i => i.naturalWidth));
  assert.ok(art.length > 0 && art.every(w => w > 0), `art thumbnails not loaded: ${JSON.stringify(art.slice(0, 5))}`);

  // 10) 全程无 CSP 违规、无未捕获异常
  for (const p of pages) {
    const bad = p.cfErrors.filter(e => /CSP_VIOLATION|PAGEERROR|Content Security Policy/.test(e));
    assert.deepEqual(bad, [], `${p.cfName}: ${bad.join('\n')}`);
  }
});
