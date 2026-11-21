// ============================================================================
// v20 单机存档继续询问 + 联机切屏15秒等待重连机制 + 幽灵清理
// ============================================================================
// v1.88：存档改为通用视图格式（13b-engine-sync.js），旧版 V1 存档不再读取
const PVE_SAVE_KEY = 'CF_SAVED_PVE_BATTLE_V2';
try { localStorage.removeItem('CF_SAVED_PVE_BATTLE_V1'); localStorage.removeItem('CF_ACTIVE_PVP_SESSION_V1'); } catch (e) {}

function savePveBattleProgress() {
  if (battleMode !== 'pve' || battle.gameOver || !battle.leaders[0] || !battle.leaders[1]) return;
  const mulOv = document.getElementById('mulliganModal');
  if (mulOv && !mulOv.classList.contains('hidden')) return;
  const menuOv = document.getElementById('mainMenuOverlay');
  if (menuOv && !menuOv.classList.contains('hidden')) return;
  try {
    localStorage.setItem(PVE_SAVE_KEY, JSON.stringify({
      ts: Date.now(),
      aiDeckArchetype,
      aiDifficulty,
      snap: serializeBattleSnapshot()
    }));
  } catch (e) {}
}

function clearPveBattleProgress() {
  try { localStorage.removeItem(PVE_SAVE_KEY); } catch (e) {}
}

function checkAndPromptSavedPveBattle() {
  try {
    const raw = localStorage.getItem(PVE_SAVE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (!saved || !saved.snap || saved.snap.v !== 2 || saved.snap.gameOver || Date.now() - (saved.ts || 0) > 86400000) {
      clearPveBattleProgress();
      return;
    }
    const modal = document.getElementById('resumePveModal');
    const desc = document.getElementById('resumePveDesc');
    const turnBadge = document.getElementById('resumePveTurnBadge');
    const hpBadge = document.getElementById('resumePveHpBadge');
    const tNum = saved.snap.turn || 1;
    const myHp = saved.snap.leaders?.[0]?.hp ?? 30;
    const aiHp = saved.snap.leaders?.[1]?.hp ?? 30;
    if (turnBadge) turnBadge.textContent = `第 ${tNum} 回合`;
    if (hpBadge) hpBadge.textContent = `我方 ${myHp} ❤️  VS  敌方 ${aiHp} ❤️`;
    if (desc) desc.textContent = '检测到一场尚未结束的单人对局进度，是否立刻恢复战场继续挑战？';
    if (modal) { modal.classList.remove('hidden'); modal.style.display = 'flex'; }

    document.getElementById('btnResumePveYes').onclick = () => {
      try {
        if (modal) { modal.classList.add('hidden'); modal.style.display = 'none'; }
        document.getElementById('mainMenuOverlay')?.classList.add('hidden');
        if (typeof _battleSessionSeq !== 'undefined') _battleSessionSeq++;
        window.CF_SPECTATE_ACTIVE = false;
        battleMode = 'pve';
        aiDeckArchetype = saved.aiDeckArchetype || 'dragon';
        aiDifficulty = saved.aiDifficulty || 'normal';
        const selM = document.getElementById('selectBattleMode'); if (selM) selM.value = 'pve';
        if (typeof switchScreen === 'function') switchScreen('battle');
        cfApplyBattleView(saved.snap);
        battle.activeSide = 0;
        battle.gameOver = false;
        battle.animating = false;
        battle.pendingPlay = null;
        battle.pendingActivate = null;
        // 若存档时处于起手未开打状态（双方能量均为0），自动补满第1回合能量防止无法操作
        if (battle.leaders[0] && (battle.leaders[0].maxEnergy || 0) <= 0) {
          battle.leaders[0].maxEnergy = 1;
          battle.leaders[0].energy = 1;
        }
        document.getElementById('mulliganModal')?.classList.add('hidden');
        document.getElementById('onlineWaitOverlay')?.classList.add('hidden');
        document.getElementById('victoryDefeatModal')?.classList.add('hidden');
        syncOnlineAvatarsAndHud();
        renderAllBattleUI();
      } catch (err) {
        console.error('[resumePve] 恢复存档失败，已清理损坏存档:', err);
        clearPveBattleProgress();
        if (typeof initNewBattle === 'function') initNewBattle();
      }
    };
    document.getElementById('btnResumePveNo').onclick = () => {
      clearPveBattleProgress();
      if (modal) { modal.classList.add('hidden'); modal.style.display = 'none'; }
    };
  } catch (e) {}
}

// 联机：对手断线横幅（由服务器的 OPP_AWAY / OPP_BACK 驱动；判负由服务器在宽限期结束时裁决）
OnlineState.oppAwayTimer = null;
OnlineState.oppAwayRemain = 45;

function resetOppDisconnectMonitor() {
  if (OnlineState.oppAwayTimer) { clearInterval(OnlineState.oppAwayTimer); OnlineState.oppAwayTimer = null; }
  document.getElementById('oppDisconnectBanner')?.classList.add('hidden');
}

function startOppDisconnectCountdown(whoName, graceSec) {
  if (!OnlineState.inMatch || battle.gameOver) return;
  if (OnlineState.oppAwayTimer) clearInterval(OnlineState.oppAwayTimer);
  OnlineState.oppAwayRemain = Math.max(1, Number(graceSec) || OnlineState.timers.awayGraceSeconds || 45);
  const banner = document.getElementById('oppDisconnectBanner');
  const txt = document.getElementById('oppDisconnectText');
  const render = () => {
    if (txt) txt.textContent = `⚠️ 对手【${whoName || '对方'}】连接中断，等待重连 (${Math.max(0, OnlineState.oppAwayRemain)}s)...`;
  };
  if (banner) banner.classList.remove('hidden');
  render();
  OnlineState.oppAwayTimer = setInterval(() => {
    if (!OnlineState.inMatch || battle.gameOver) { resetOppDisconnectMonitor(); return; }
    OnlineState.oppAwayRemain -= 1;
    render();
    if (OnlineState.oppAwayRemain <= 0) { clearInterval(OnlineState.oppAwayTimer); OnlineState.oppAwayTimer = null; }
  }, 1000);
}

// 切屏 / 切后台：只更新在线状态；连接保持则对局不受影响，连接被系统断开时服务器负责宽限与判负
document.addEventListener('visibilitychange', () => {
  if (battleMode === 'pve' && document.hidden) savePveBattleProgress();
  if (!document.hidden && cfNet.wantOpen && !OnlineState.connected) cfNet.connect();
  if (typeof publishOnlinePresence === 'function') publishOnlinePresence(false);
});

window.addEventListener('beforeunload', () => {
  if (battleMode === 'pve') savePveBattleProgress();
});


function performLeaveDeckOrDesigner() {
  document.getElementById('screenDeck')?.classList.add('hidden');
  document.getElementById('screenDesigner')?.classList.add('hidden');
  document.getElementById('screenCode')?.classList.add('hidden');
  const backBtn = document.getElementById('btnTopBackMenu');
  if (backBtn) backBtn.textContent = '🏠 返回主菜单';
  if (OnlineState.returnToVersusAfterDeck && OnlineState.roomId && !OnlineState.inMatch) {
    OnlineState.returnToVersusAfterDeck = false;
    cfNet.send({ type: 'EDITING_DECK', editing: false });
    switchScreen('battle');
    openVersusRoomModal();
    return;
  }
  if (OnlineState.returnToLobbyAfterDeck) {
    OnlineState.returnToLobbyAfterDeck = false;
    document.getElementById('mainMenuOverlay')?.classList.remove('hidden');
    if (typeof startMainMenuBgAnim === 'function') startMainMenuBgAnim();
    if (typeof applyUserAvatarToUI === 'function') applyUserAvatarToUI();
    openOnlineLobbyModal();
    return;
  }
  document.getElementById('mainMenuOverlay')?.classList.remove('hidden');
  if (typeof startMainMenuBgAnim === 'function') startMainMenuBgAnim();
  if (typeof applyUserAvatarToUI === 'function') applyUserAvatarToUI();
  if (typeof publishOnlinePresence === 'function') publishOnlinePresence(false);
}

['btnTopBackMenu','btnNavMainMenu','btnExitSpectate'].forEach(id => document.getElementById(id)?.addEventListener('click', () => { window.CF_SPECTATE_ACTIVE = false; }));
  document.getElementById('btnTopBackMenu')?.addEventListener('click', () => {
  const deckScreen = document.getElementById('screenDeck');
  if (deckScreen && !deckScreen.classList.contains('hidden')) {
    const d = PRESET_DECKS[currentDeckIndex];
    const total = d ? getDeckTotal(d) : 0;
    if (d && total !== RULES.deckSize) {
      const modal = document.getElementById('gameCustomDialogModal');
      document.getElementById('gameDialogIcon').textContent = '⚠️';
      document.getElementById('gameDialogMsg').textContent = `当前卡组「${d.name}」共 ${total} 张（需恰好 ${RULES.deckSize} 张才能出战）。请选择返回继续修改，或恢复到该卡组上一次合法的 40 张状态并离开：`;
      const yes = document.getElementById('btnGameDialogYes');
      const no = document.getElementById('btnGameDialogNo');
      yes.textContent = '✏️ 返回继续修改';
      no.textContent = '↩️ 恢复上次合法状态并离开';
      no.classList.remove('hidden');
      modal.classList.remove('hidden');
      modal.style.display = 'flex';
      yes.onclick = () => { modal.style.display = 'none'; modal.classList.add('hidden'); };
      no.onclick = () => {
        modal.classList.add('hidden');
        const snap = _lastValidDeckSnapshots.get(currentDeckIndex);
        if (snap) {
          PRESET_DECKS[currentDeckIndex] = { name: snap.name, cards: Object.assign({}, snap.cards) };
        } else {
          PRESET_DECKS[currentDeckIndex] = { name: d.name, cards: Object.assign({}, DEFAULT_PRESET_DECKS[0].cards) };
        }
        saveDecksToStorage();
        syncAllDeckSelects();
        performLeaveDeckOrDesigner();
      };
      return;
    }
  }
  performLeaveDeckOrDesigner();
});


// ============================================================================
// v23 主界面改名保存 + 敌方法术详细展示 + 联机掉线自动重连 RESYNC
// ============================================================================
(function initMenuNickSync() {
  const inp = document.getElementById('menuNickInput');
  const tip = document.getElementById('menuNickSavedTip');
  if (!inp) return;
  inp.value = OnlineState.nickname || '决斗者';
  const saveNick = () => {
    const val = inp.value.trim() || '决斗者';
    OnlineState.nickname = val;
    try { localStorage.setItem('cf_online_nick', val); } catch (e) {}
    const nick2 = document.getElementById('onlineNickInput');
    if (nick2) nick2.value = val;
    const pTitle = document.getElementById('uiPlayerLeaderTitle');
    if (pTitle && battleMode === 'pvp_online') pTitle.textContent = val;
    if (tip) {
      tip.style.display = 'inline';
      setTimeout(() => { tip.style.display = 'none'; }, 1500);
    }
  };
  inp.addEventListener('change', saveNick);
  inp.addEventListener('blur', saveNick);
})();

let _oppSpellTimer = null;
function showOppSpellShowcase(cardData) {
  const modal = document.getElementById('oppSpellShowcaseModal');
  if (!modal || !cardData) return;
  document.getElementById('oppSpellImg').src = getAnimeIllustrationDataURI(cardData);
  document.getElementById('oppSpellName').textContent = cardData.name || '法术';
  const costParts = [];
  if (cardData.energy > 0) costParts.push(`⚡ 能量 ${cardData.energy}`);
  if (cardData.bones > 0) costParts.push(`🦴 骨头 ${cardData.bones}`);
  if (cardData.sacrifice > 0) costParts.push(`🩸 祭品 ${cardData.sacrifice}`);
  document.getElementById('oppSpellCost').textContent = costParts.join(' · ') || '⚡ 0费';
  document.getElementById('oppSpellDesc').textContent = cardData.fullText || cardData.description || '无描述';
  modal.classList.remove('hidden');
  modal.style.display = 'flex';
  if (_oppSpellTimer) clearTimeout(_oppSpellTimer);
  _oppSpellTimer = setTimeout(() => modal.classList.add('hidden'), 3200);
}
document.getElementById('oppSpellShowcaseModal')?.addEventListener('click', () => {
  if (_oppSpellTimer) clearTimeout(_oppSpellTimer);
  document.getElementById('oppSpellShowcaseModal')?.classList.add('hidden');
});


