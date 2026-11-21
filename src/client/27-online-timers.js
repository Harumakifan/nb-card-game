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
  // 以服务器下发的截止时间为准（服务器到点会自动按"不换牌"处理）
  const mulDeadline = OnlineState.mulliganDeadline || 0;
  _mulliganRemain = mulDeadline ? Math.max(0, Math.round((mulDeadline - cfServerNow()) / 1000)) : (OnlineState.timers.mulliganSeconds || 30);
  const badge = document.getElementById('mulliganTimerBadge');
  if (badge) badge.textContent = `⏱️ 换牌倒计时：${_mulliganRemain}s`;
  _mulliganTimer = setInterval(() => {
    const modal = document.getElementById('mulliganModal');
    if (!modal || modal.classList.contains('hidden')) {
      stopMulliganCountdownTimer();
      return;
    }
    _mulliganRemain = mulDeadline ? Math.max(0, Math.round((mulDeadline - cfServerNow()) / 1000)) : _mulliganRemain - 1;
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
  const turnDeadline = OnlineState.turnDeadline || 0;
  const calcRemain = () => (turnDeadline ? Math.max(0, Math.round((turnDeadline - cfServerNow()) / 1000)) : _turnRemain);
  _turnRemain = turnDeadline ? calcRemain() : (OnlineState.timers.turnSeconds || 60);
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
    _turnRemain = turnDeadline ? calcRemain() : _turnRemain - 1;
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
      // 联机：服务器到点会自动结束回合并推送新状态，这里只收起未完成的出牌面板
      stopTurnCountdownTimer();
      if (onlineIsMyTurn()) {
        cancelPendingPlayToHand();
        document.getElementById('handPickModal')?.classList.add('hidden');
        document.getElementById('modeChoiceCenterPanel')?.classList.add('hidden');
      }
    }
  }, 1000);
}

// 绑定右下角联机「🏳️ 投降认输」按钮
document.getElementById('btnPvpSurrender')?.addEventListener('click', () => {
  if (battleMode !== 'pvp_online' || !OnlineState.inMatch || battle.gameOver) return;
  showGameConfirm('确定要向对手投降认输吗？（认输后将返回对战房间）', () => {
    cfNet.send({ type: 'SURRENDER' });
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
      cfNet.send({ type: 'SURRENDER' });
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
