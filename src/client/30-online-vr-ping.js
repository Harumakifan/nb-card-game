// ============================================================================
// v25 房间内胜场统计 + 房间在线检测 VR_PING + 网络状态指示与自动重连恢复
// ============================================================================
OnlineState.hostWins = 0;
OnlineState.guestWins = 0;
OnlineState.lastVrOppPing = Date.now();

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

setInterval(() => {
  updateBattleNetIndicator();
  const vrModal = document.getElementById('versusRoomModal');
  if (OnlineState.roomId && !OnlineState.inMatch && vrModal && !vrModal.classList.contains('hidden')) {
    sendRoomPacket({
      type: 'VR_PING',
      ready: OnlineState.myReady,
      editing: Boolean(OnlineState.returnToVersusAfterDeck),
      hostWins: OnlineState.hostWins,
      guestWins: OnlineState.guestWins,
      deckIds: getActiveDeckIdsForOnline()
    });
    // 检测对手是否仍在房间内（超过 12s 无心跳则标记离线/离开）
    const oppTag = document.getElementById(OnlineState.role === 'host' ? 'vrGuestOnlineTag' : 'vrHostOnlineTag');
    if (OnlineState.guestId && oppTag) {
      const alive = (Date.now() - OnlineState.lastVrOppPing) < 12000;
      oppTag.textContent = alive ? '🟢 在线' : '🔴 离线/已离开';
      oppTag.style.color = alive ? '#34d399' : '#fb7185';
      if (!alive && OnlineState.role === 'host' && (Date.now() - OnlineState.lastVrOppPing) > 16000) {
        OnlineState.guestId = '';
        OnlineState.guestName = '';
        OnlineState.oppReady = false;
        publishLobbyRoomMeta(false);
        updateVersusRoomUI();
      }
    }
  }
}, 3000);


