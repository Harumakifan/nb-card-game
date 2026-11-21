// ============================================================================
// v20 单机存档继续询问 + 联机切屏15秒等待重连机制 + 幽灵清理
// ============================================================================
const PVE_SAVE_KEY = 'CF_SAVED_PVE_BATTLE_V1';
const PVP_SESSION_KEY = 'CF_ACTIVE_PVP_SESSION_V1';

function savePveBattleProgress() {
  if (battleMode !== 'pve' || battle.gameOver || !battle.leaders[0] || !battle.leaders[1]) return;
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
    if (!saved || !saved.snap || saved.snap.gameOver || Date.now() - (saved.ts || 0) > 86400000) {
      clearPveBattleProgress();
      return;
    }
    const modal = document.getElementById('resumePveModal');
    const desc = document.getElementById('resumePveDesc');
    if (desc) desc.textContent = `上次单人挑战进行到第 ${saved.snap.turn || 1} 回合（我方 ${saved.snap.leaders[0]?.hp ?? 30} 血 / 敌方 ${saved.snap.leaders[1]?.hp ?? 30} 血），是否继续上次的战斗？`;
    if (modal) { modal.classList.remove('hidden'); modal.style.display = 'flex'; }

    document.getElementById('btnResumePveYes').onclick = () => {
      modal.classList.add('hidden');
      document.getElementById('mainMenuOverlay')?.classList.add('hidden');
      battleMode = 'pve';
      aiDeckArchetype = saved.aiDeckArchetype || 'dragon';
      aiDifficulty = saved.aiDifficulty || 'normal';
      battle.turn = saved.snap.turn || 1;
      battle.activeSide = 0;
      battle.gameOver = false;
      battle.leaders[0] = deserializeLeaderFromRemote(saved.snap.leaders[0], 0);
      battle.leaders[1] = deserializeLeaderFromRemote(saved.snap.leaders[1], 1);
      battle.board[0] = (saved.snap.board[0] || []).map(c => deserializeCardInst(c, 0));
      battle.board[1] = (saved.snap.board[1] || []).map(c => deserializeCardInst(c, 1));
      document.getElementById('mulliganModal')?.classList.add('hidden');
      syncOnlineAvatarsAndHud();
      renderAllBattleUI();
    };
    document.getElementById('btnResumePveNo').onclick = () => {
      clearPveBattleProgress();
      modal.classList.add('hidden');
    };
  } catch (e) {}
}

// 联机：对手离开检测与 15 秒重连倒计时
OnlineState.lastOppActiveTs = Date.now();
OnlineState.oppAwayTimer = null;
OnlineState.oppAwayRemain = 45;
OnlineState._localAwayDelayTimer = null;
OnlineState._localAwaySent = false;

function resetOppDisconnectMonitor() {
  OnlineState.lastOppActiveTs = Date.now();
  if (OnlineState.oppAwayTimer) { clearInterval(OnlineState.oppAwayTimer); OnlineState.oppAwayTimer = null; }
  document.getElementById('oppDisconnectBanner')?.classList.add('hidden');
}

function startOppDisconnectCountdown(whoName) {
  if (OnlineState.oppAwayTimer || !OnlineState.inMatch || battle.gameOver) return;
  OnlineState.oppAwayRemain = 45;
  const banner = document.getElementById('oppDisconnectBanner');
  const txt = document.getElementById('oppDisconnectText');
  if (banner) banner.classList.remove('hidden');
  if (txt) txt.textContent = `⚠️ 对手【${whoName || '对方'}】暂时离开，等待重连 (${OnlineState.oppAwayRemain}s)...`;

  OnlineState.oppAwayTimer = setInterval(() => {
    if (!OnlineState.inMatch || battle.gameOver) {
      resetOppDisconnectMonitor();
      return;
    }
    OnlineState.oppAwayRemain -= 1;
    if (txt) txt.textContent = `⚠️ 对手【${whoName || '对方'}】暂时离开，等待重连 (${Math.max(0, OnlineState.oppAwayRemain)}s)...`;
    if (OnlineState.oppAwayRemain <= 0) {
      resetOppDisconnectMonitor();
      showOnlineVictoryDefeatModal(true, `对手离开超过 45 秒未重连，系统判定对方放弃战斗，你获得胜利！`);
    }
  }, 1000);
}

// 切屏 / 切后台时：不直接退出游戏，而是通知对手“我暂时离开，正在等待重连”
document.addEventListener('visibilitychange', () => {
  if (battleMode === 'pvp_online' && OnlineState.inMatch && !battle.gameOver && OnlineState.roomId) {
    if (document.hidden) {
      if (OnlineState._localAwayDelayTimer) clearTimeout(OnlineState._localAwayDelayTimer);
      OnlineState._localAwaySent = false;
      // 切屏 8 秒宽限期：短暂切出回消息不误报“对方离开”
      OnlineState._localAwayDelayTimer = setTimeout(() => {
        if (document.hidden && battleMode === 'pvp_online' && OnlineState.inMatch && !battle.gameOver && OnlineState.roomId) {
          OnlineState._localAwaySent = true;
          sendRoomPacket({ type: 'PLAYER_AWAY', who: OnlineState.nickname });
        }
      }, 8000);
      try {
        localStorage.setItem(PVP_SESSION_KEY, JSON.stringify({
          ts: Date.now(),
          roomId: OnlineState.roomId,
          role: OnlineState.role,
          roomName: OnlineState.roomName,
          hostName: OnlineState.hostName,
          guestName: OnlineState.guestName
        }));
      } catch (e) {}
    } else {
      if (!OnlineState.connected && typeof connectOnlineNetwork === 'function') connectOnlineNetwork();
      setTimeout(() => {
        sendRoomPacket({ type: 'PLAYER_BACK', who: OnlineState.nickname });
      }, 300);
    }
  } else if (battleMode === 'pve' && document.hidden) {
    savePveBattleProgress();
  }
  if (typeof publishOnlinePresence === 'function') publishOnlinePresence(false);
});

window.addEventListener('beforeunload', () => {
  publishOnlinePresence(true);
  if (OnlineState.role === 'host' && OnlineState.roomId && !OnlineState.inMatch) {
    publishLobbyRoomMeta(true);
  }
  if (battleMode === 'pve') savePveBattleProgress();
});

// 每 3 秒监测联机心跳，超过 7 秒无回应或收到 PLAYER_AWAY 则启动 15 秒等待重连横幅
setInterval(() => {
  if (battleMode !== 'pvp_online' || !OnlineState.inMatch || battle.gameOver) return;
  sendRoomPacket({ type: 'PRESENCE_PING' });
  if (OnlineState.connected && Date.now() - OnlineState.lastOppActiveTs > 45000 && !OnlineState.oppAwayTimer) {
    const oppName = OnlineState.role === 'host' ? OnlineState.guestName : OnlineState.hostName;
    startOppDisconnectCountdown(oppName);
  }
}, 3000);


function performLeaveDeckOrDesigner() {
  document.getElementById('screenDeck')?.classList.add('hidden');
  document.getElementById('screenDesigner')?.classList.add('hidden');
  document.getElementById('screenCode')?.classList.add('hidden');
  const backBtn = document.getElementById('btnTopBackMenu');
  if (backBtn) backBtn.textContent = '🏠 返回主菜单';
  if (OnlineState.returnToVersusAfterDeck && OnlineState.roomId && !OnlineState.inMatch) {
    OnlineState.returnToVersusAfterDeck = false;
    sendReliableRoomPacket({ type: 'PLAYER_EDITING_DECK', editing: false });
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


