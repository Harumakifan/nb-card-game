// ============================================================================
// v25 网络状态指示（v1.88 起房间心跳与胜场统计由服务器维护）
// ============================================================================

function updateBattleNetIndicator() {
  const el = document.getElementById('battleNetIndicator');
  if (!el) return;
  if (battleMode !== 'pvp_online' || !OnlineState.inMatch) {
    el.classList.add('hidden');
    return;
  }
  el.classList.remove('hidden');
  if (!OnlineState.connected) {
    el.textContent = '🟡 己方断线重连中...';
    el.style.color = '#fbbf24';
    el.style.borderColor = '#f59e0b';
  } else if (OnlineState.oppAwayTimer) {
    el.textContent = `🔴 对手重连中 (${OnlineState.oppAwayRemain}s)`;
    el.style.color = '#fb7185';
    el.style.borderColor = '#f43f5e';
  } else {
    el.textContent = '🟢 联机连接正常';
    el.style.color = '#34d399';
    el.style.borderColor = '#10b981';
  }
}

// 房间在线状态 / 心跳由服务器维护（ROOM 消息里的 hostOnline / guestOnline），这里只刷新局内网络指示
setInterval(updateBattleNetIndicator, 1000);
