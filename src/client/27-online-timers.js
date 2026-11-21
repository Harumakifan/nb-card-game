// ============================================================================
// v18 30秒开局换牌倒计时 & 60秒回合思考倒计时 & 联机认输与返回房间
// ============================================================================
let _mulliganTimer = null;
let _mulliganRemain = 30;
let _turnTimer = null;
let _turnRemain = 60;

function stopMulliganCountdownTimer() {
  if (_mulliganTimer) { clearInterval(_mulliganTimer); _mulliganTimer = null; }
}

function startMulliganCountdownTimer() {
  stopMulliganCountdownTimer();
  const badge0 = document.getElementById('mulliganTimerBadge');
  if (battleMode !== 'pvp_online') {
    if (badge0) badge0.style.display = 'none';
    return;
  }
  if (badge0) badge0.style.display = 'inline-block';
  _mulliganRemain = 30;
  const badge = document.getElementById('mulliganTimerBadge');
  if (badge) badge.textContent = `⏱️ 换牌倒计时：${_mulliganRemain}s`;
  _mulliganTimer = setInterval(() => {
    const modal = document.getElementById('mulliganModal');
    if (!modal || modal.classList.contains('hidden')) {
      stopMulliganCountdownTimer();
      return;
    }
    _mulliganRemain -= 1;
    if (badge) {
      badge.textContent = `⏱️ 换牌倒计时：${Math.max(0, _mulliganRemain)}s`;
      badge.style.color = _mulliganRemain <= 8 ? '#fb7185' : '#fde047';
    }
    if (_mulliganRemain <= 0) {
      stopMulliganCountdownTimer();
      document.getElementById('btnConfirmMulligan')?.click();
    }
  }, 1000);
}

function stopTurnCountdownTimer() {
  if (_turnTimer) { clearInterval(_turnTimer); _turnTimer = null; }
  document.getElementById('turnUrgentRing')?.classList.add('hidden');
}

function startTurnCountdownTimer() {
  stopTurnCountdownTimer();
  const badge0 = document.getElementById('turnTimerBadge');
  if (battleMode !== 'pvp_online') {
    if (badge0) badge0.style.display = 'none';
    return;
  }
  if (badge0) badge0.style.display = 'inline-block';
  _turnRemain = 60;
  const badge = document.getElementById('turnTimerBadge');
  if (badge) {
    badge.textContent = `⏱️ ${_turnRemain}s`;
    badge.style.color = '#7dd3fc';
    badge.style.borderColor = '#38bdf8';
  }
  _turnTimer = setInterval(() => {
    if (battle.gameOver) {
      stopTurnCountdownTimer();
      return;
    }
    const mulModal = document.getElementById('mulliganModal');
    const waitOv = document.getElementById('onlineWaitOverlay');
    const hoModal = document.getElementById('pvpHandoverModal');
    if ((mulModal && !mulModal.classList.contains('hidden')) ||
        (waitOv && !waitOv.classList.contains('hidden')) ||
        (hoModal && !hoModal.classList.contains('hidden'))) {
      return;
    }
    _turnRemain -= 1;
    if (badge) {
      badge.textContent = `⏱️ ${Math.max(0, _turnRemain)}s`;
      badge.style.color = _turnRemain <= 15 ? '#fb7185' : '#7dd3fc';
      badge.style.borderColor = _turnRemain <= 15 ? '#f43f5e' : '#38bdf8';
    }
    const urgentRing = document.getElementById('turnUrgentRing');
    if (urgentRing) {
      const showUrgent = (battleMode === 'pvp_online' && _turnRemain <= 15 && _turnRemain > 0 && onlineIsMyTurn());
      urgentRing.classList.toggle('hidden', !showUrgent);
    }
    if (_turnRemain <= 0) {
      stopTurnCountdownTimer();
      const isMyAction = battleMode === 'pvp_online' ? onlineIsMyTurn() : (battle.activeSide === 0 || battleMode === 'pvp_pass');
      if (isMyAction && !battle.gameOver && !battle.animating) {
        cancelPendingPlayToHand();
        document.getElementById('handPickModal')?.classList.add('hidden');
        document.getElementById('modeChoiceCenterPanel')?.classList.add('hidden');
        showTriggeredEffectToast({ id: 'sys_notice', name: '战局提示', type: 'spell', rarity: '传说', energy: 0, bones: 0, sacrifice: 0 }, '⌛ 60秒思考时间到，自动结束回合！', 0);
        executeEndTurnSequence(0);
      }
    }
  }, 1000);
}

// 绑定右下角联机「🏳️ 投降认输」按钮
document.getElementById('btnPvpSurrender')?.addEventListener('click', () => {
  if (battleMode !== 'pvp_online' || !OnlineState.inMatch || battle.gameOver) return;
  showGameConfirm('确定要向对手投降认输吗？（认输后将返回对战房间）', () => {
    sendReliableRoomPacket({ type: 'PVP_SURRENDER', who: OnlineState.nickname });
    showOnlineVictoryDefeatModal(false, '你选择了投降认输，点击下方按钮回到对战房间。');
  }, '🏳️');
});


// ============================================================================
// v19 顶部投降/退出绑定 + 联机断线自动重连 + 5秒反卡死回合心跳校验
// ============================================================================
document.getElementById('btnMenuMuteToggle')?.addEventListener('click', (e) => {
  sfx.muted = !sfx.muted;
  e.target.textContent = sfx.muted ? '🔇 静音' : '🔊 音效';
});

document.getElementById('btnTopSurrenderExit')?.addEventListener('click', () => {
  if (battleMode === 'pvp_online' && OnlineState.inMatch && !battle.gameOver) {
    showGameConfirm('确定要向对手投降认输并返回对战房间吗？', () => {
      battle.__cfSurrendered = true;
      sendReliableRoomPacket({ type: 'PVP_SURRENDER', who: OnlineState.nickname }, 12);
      showOnlineVictoryDefeatModal(false, '你选择了投降认输，即将自动回到对战房间。');
    }, '🏳️');
    return;
  }
  showGameConfirm('确定要放弃当前对局并返回主菜单吗？', () => {
    battle.__cfSurrendered = true;          /* 投降/中途退出：不记录战绩 */
    battle.gameOver = true;
    if (typeof clearPveBattleProgress === 'function') clearPveBattleProgress();
    stopTurnCountdownTimer();
    stopMulliganCountdownTimer();
    document.getElementById('mulliganModal')?.classList.add('hidden');
    document.getElementById('victoryDefeatModal')?.classList.add('hidden');
    document.getElementById('mainMenuOverlay')?.classList.remove('hidden');
    if (typeof startMainMenuBgAnim === 'function') startMainMenuBgAnim();
    if (typeof applyUserAvatarToUI === 'function') applyUserAvatarToUI();
  }, '🏳️');
});

// 覆盖 sendReliableRoomPacket：对关键回合交接包提高重传次数，并在连接断开时自动重连
sendReliableRoomPacket = function(pkt, maxRetries = 12) {
  if (!OnlineState.roomId) return;
  const pktId = `${OnlineState.peerId}_${++OnlineState.pktSeq}_${Date.now()}`;
  const fullPkt = { ...pkt, pktId, senderAvatar: userAvatarConfig, senderName: OnlineState.nickname };
  let tries = 0;
  const attempt = () => {
    if (OnlineState.ackedPkts.has(pktId) || !OnlineState.roomId || tries >= maxRetries) return;
    if (!OnlineState.connected && typeof connectOnlineNetwork === 'function') {
      connectOnlineNetwork();
    }
    tries++;
    sendRoomPacket(fullPkt);
    setTimeout(attempt, 1000);
  };
  attempt();
};

// 每 4 秒检查一次联机双方回合是否卡死（防丢包死锁）
setInterval(() => {
  if (battleMode !== 'pvp_online' || !OnlineState.inMatch || battle.gameOver) return;
  if (!OnlineState.connected && typeof connectOnlineNetwork === 'function') {
    connectOnlineNetwork();
    return;
  }
  if (!onlineIsMyTurn()) {
    // 我方正在等待对手：发送轻量回合核对心跳
    sendRoomPacket({
      type: 'PING_TURN',
      turn: battle.turn,
      activeRole: OnlineState.activeRole
    });
  }
}, 4000);


