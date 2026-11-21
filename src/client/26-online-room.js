// ============================================================================
// v17 联机对战房间 (#versusRoomModal) + 在线玩家10秒邀请 + 可靠同步引擎
// ============================================================================

function getPresenceStatus() {
  if (typeof document !== 'undefined' && document.hidden) return 'away';
  if (OnlineState.isSpectator) return 'spectating';
  if (OnlineState.inMatch && battleMode === 'pvp_online') return 'playing_pvp';
  if (OnlineState.roomId) return 'in_room';
  const vis = (id) => { const el = document.getElementById(id); return el && !el.classList.contains('hidden'); };
  if (vis('onlineLobbyModal')) return 'in_lobby';
  if (vis('leaderAvatarModal')) return 'customizing';
  if (vis('screenDeck')) return 'editing_deck';
  if (vis('screenDesigner')) return 'designing';
  if (vis('mainMenuOverlay')) return 'idle';
  if (vis('screenBattle') && !battle.gameOver) return 'playing_ai';
  return 'idle';
}

/** 上报在线状态；profileChanged=true 时同时同步昵称与头像（由服务器清洗后广播） */
function publishOnlinePresence(profileChanged = false) {
  if (!OnlineState.connected) return;
  if (profileChanged) cfNet.send({ type: 'SET_PROFILE', nickname: OnlineState.nickname, avatar: userAvatarConfig });
  cfSendPresence();
}

function renderOnlinePlayerList() {
  const listEl = document.getElementById('onlinePlayerList');
  const cntEl = document.getElementById('onlinePlayerCountText');
  if (!listEl) return;
  const now = Date.now();
  const others = [];
  for (const [pid, p] of OnlineState.onlinePlayers.entries()) {
    if (!p || !p.peerId || pid === OnlineState.peerId) continue;
    others.push(p);
  }
  if (cntEl) cntEl.textContent = `(${others.length} 人在线)`;
  if (others.length === 0) {
    listEl.innerHTML = `<div style="font-size:11px;color:#64748b;text-align:center;padding:8px;">暂无其他在线玩家（可先创建房间或让好友打开网页）</div>`;
    return;
  }
  listEl.innerHTML = '';
  others.forEach(p => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;background:#0f172a;border:1px solid #334155;border-radius:10px;padding:6px 10px;';
    const avUri = p.avatar ? renderCustomAvatarDataURI(p.avatar) : renderCustomAvatarDataURI(userAvatarConfig);
    const statusMap = {
      idle: { txt: '🟢 主界面在线 (可邀请)', col: '#34d399', invitable: true },
      away: { txt: '🟡 离开', col: '#94a3b8', invitable: false },
      in_lobby: { txt: '🌐 浏览联机大厅 (可邀请)', col: '#38bdf8', invitable: true },
      spectating: { txt: '👁️ 正在观战对局', col: '#67e8f9', invitable: false },
      playing_pvp: { txt: '⚔️ 与玩家联机对战中', col: '#fb7185', invitable: false },
      playing_ai: { txt: '🤖 正在挑战 AI', col: '#fbbf24', invitable: false },
      in_room: { txt: '🏠 在对战房间中', col: '#fbbf24', invitable: false },
      editing_deck: { txt: '🛠️ 正在编辑卡组', col: '#a78bfa', invitable: false },
      designing: { txt: '🃏 正在设计卡牌', col: '#e879f9', invitable: false },
      customizing: { txt: '🎭 正在定制主战者', col: '#818cf8', invitable: false }
    };
    const stInfo = statusMap[p.status] || statusMap.idle;
    const busy = !stInfo.invitable;
    row.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;min-width:0;">
        <img src="${avUri}" style="width:30px;height:30px;border-radius:8px;border:1px solid #fbbf24;object-fit:cover;">
        <div style="min-width:0;">
          <div style="font-size:12px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(p.nickname || '决斗者')}</div>
          <div style="font-size:11px;font-weight:700;color:${stInfo.col};">${stInfo.txt}</div>
        </div>
      </div>
      <button ${busy || OnlineState.roomId ? 'disabled' : ''} class="ol-btn-cyan" style="padding:4px 10px;font-size:11px;">⚔️ 邀请对战</button>
    `;
    const btn = row.querySelector('button');
    if (btn && !busy && !OnlineState.roomId) {
      btn.onclick = () => inviteOnlinePlayer(p);
    }
    listEl.appendChild(row);
  });
}

function inviteOnlinePlayer(targetPlayer) {
  if (!OnlineState.connected) { showGameAlert('尚未连接对战服务器，请稍候再试！'); return; }
  if (!targetPlayer || !targetPlayer.peerId) return;
  cfReadNickInput();
  // 服务器会在需要时自动创建一间专属对战房，并把限时邀请码只发给被邀请人
  cfNet.send({ type: 'INVITE', targetId: targetPlayer.peerId });
}

function showBattleInviteToast(inv) {
  if (OnlineState.roomId || OnlineState.inMatch) return;
  const toast = document.getElementById('battleInviteToast');
  if (!toast) return;
  OnlineState.pendingInvite = inv;
  document.getElementById('inviterAvatarImg').src = inv.fromAvatar ? renderCustomAvatarDataURI(inv.fromAvatar) : renderCustomAvatarDataURI(userAvatarConfig);
  document.getElementById('inviterNameText').textContent = `${inv.fromName || '玩家'} 邀请你进入对战房间`;
  toast.classList.remove('hidden');

  let remain = Math.max(1, Math.min(60, Number(inv.expiresInSec) || 10));
  const total = remain;
  const numEl = document.getElementById('inviteCountdownNum');
  const barEl = document.getElementById('inviteProgressBar');
  if (numEl) numEl.textContent = `${remain}s`;
  if (barEl) barEl.style.width = '100%';

  if (OnlineState.inviteTimer) clearInterval(OnlineState.inviteTimer);
  OnlineState.inviteTimer = setInterval(() => {
    remain -= 1;
    if (numEl) numEl.textContent = `${Math.max(0, remain)}s`;
    if (barEl) barEl.style.width = `${Math.max(0, (remain / total) * 100)}%`;
    if (remain <= 0) {
      clearInterval(OnlineState.inviteTimer);
      OnlineState.inviteTimer = null;
      toast.classList.add('hidden');
      OnlineState.pendingInvite = null;
    }
  }, 1000);
}

function syncVersusDeckSelect(selectEl) {
  if (!selectEl || typeof PRESET_DECKS === 'undefined') return;
  selectEl.innerHTML = '';
  PRESET_DECKS.forEach((d, idx) => {
    const opt = document.createElement('option');
    opt.value = String(idx);
    const cnt = typeof expandDeck === 'function' ? expandDeck(d).length : 40;
    opt.textContent = `${d.name} (${cnt}张)`;
    if (idx === currentDeckIndex) opt.selected = true;
    selectEl.appendChild(opt);
  });
}

function openVersusRoomModal() {
  document.getElementById('onlineLobbyModal')?.classList.add('hidden');
  document.getElementById('mainMenuOverlay')?.classList.add('hidden');
  const modal = document.getElementById('versusRoomModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.style.display = 'flex';
  updateVersusRoomUI();
}

function updateVersusRoomUI() {
  const modal = document.getElementById('versusRoomModal');
  if (!modal || modal.classList.contains('hidden')) return;

  document.getElementById('vrRoomTitle').textContent = OnlineState.roomName || `房间 ${OnlineState.roomId}`;
  document.getElementById('vrRoomCode').textContent = OnlineState.roomId || '--';
  const sb = document.getElementById('vrRoomScoreBoard');
  if (sb) sb.textContent = `🏆 本房战绩：${OnlineState.hostWins || 0} 胜 : ${OnlineState.guestWins || 0} 胜`;
  const hOn = document.getElementById('vrHostOnlineTag');
  const gOn = document.getElementById('vrGuestOnlineTag');
  const hostOnline = OnlineState.role === 'host' ? true : OnlineState.oppOnline !== false;
  const guestOnline = OnlineState.role === 'guest' ? true : OnlineState.oppOnline !== false;
  if (hOn) { hOn.textContent = hostOnline ? '🟢 在线' : '🔴 离线/重连中'; hOn.style.color = hostOnline ? '#34d399' : '#fb7185'; }
  if (gOn) {
    gOn.textContent = OnlineState.guestId ? (guestOnline ? '🟢 在线' : '🔴 离线/重连中') : '⚪ 等待加入';
    gOn.style.color = OnlineState.guestId ? (guestOnline ? '#34d399' : '#fb7185') : '#64748b';
  }

  const isHost = OnlineState.role === 'host';
  const hostReady = isHost ? OnlineState.myReady : OnlineState.oppReady;
  const guestReady = isHost ? OnlineState.oppReady : OnlineState.myReady;
  const hostAv = isHost ? userAvatarConfig : OnlineState.hostAvatar;
  const guestAv = isHost ? OnlineState.guestAvatar : userAvatarConfig;

  document.getElementById('vrHostAvatar').src = renderCustomAvatarDataURI(hostAv || userAvatarConfig);
  document.getElementById('vrHostName').textContent = OnlineState.hostName || '房主';
  const hBadge = document.getElementById('vrHostReadyBadge');
  hBadge.textContent = (!isHost && OnlineState.oppEditingDeck) ? '🛠️ 正在编辑卡组...' : (hostReady ? '✅ 已准备' : '⏳ 准备中');
  hBadge.style.color = hostReady ? '#6ee7b7' : '#fbbf24';
  hBadge.style.borderColor = hostReady ? '#10b981' : '#f59e0b';

  const gNameEl = document.getElementById('vrGuestName');
  const gBadge = document.getElementById('vrGuestReadyBadge');
  const gAvEl = document.getElementById('vrGuestAvatar');
  if (OnlineState.guestId) {
    gNameEl.textContent = OnlineState.guestName || '挑战者';
    gNameEl.style.color = '#fff';
    gAvEl.src = renderCustomAvatarDataURI(guestAv || userAvatarConfig);
    gBadge.textContent = OnlineState.oppEditingDeck ? '🛠️ 正在编辑卡组...' : (guestReady ? '✅ 已准备' : '⏳ 准备中');
    gBadge.style.color = guestReady ? '#6ee7b7' : '#fbbf24';
    gBadge.style.borderColor = guestReady ? '#10b981' : '#f59e0b';
  } else {
    gNameEl.textContent = '等待挑战者加入...';
    gNameEl.style.color = '#94a3b8';
    gAvEl.src = renderCustomAvatarDataURI({ backdrop: 'cyber', hairStyle: 'hood', hairColor: 'silver', eyeStyle: 'visor', outfit: 'mech', headgear: 'none' });
    gBadge.textContent = '空位';
    gBadge.style.color = '#64748b';
    gBadge.style.borderColor = '#334155';
  }

  // 私有卡组仅对本人可见
  const hDeckArea = document.getElementById('vrHostDeckArea');
  const gDeckArea = document.getElementById('vrGuestDeckArea');
  hDeckArea.classList.toggle('hidden', !isHost);
  gDeckArea.classList.toggle('hidden', isHost);
  syncVersusDeckSelect(document.getElementById(isHost ? 'vrHostDeckSelect' : 'vrGuestDeckSelect'));

  const readyBtn = document.getElementById('btnVrToggleReady');
  readyBtn.textContent = OnlineState.myReady ? '🔄 取消准备' : '✅ 点击准备';
  readyBtn.style.opacity = OnlineState.guestId ? '1' : '0.6';

  const startBtn = document.getElementById('btnVrStartMatch');
  const hintEl = document.getElementById('vrStatusHint');
  if (!OnlineState.guestId) {
    startBtn.classList.add('hidden');
    hintEl.textContent = '等待挑战者加入房间（可点击大厅中的在线玩家直接邀请）...';
  } else if (hostReady && guestReady) {
    startBtn.classList.add('hidden');
    hintEl.textContent = '🎉 双方已就绪，服务器正在开局...';
  } else {
    startBtn.classList.add('hidden');
    hintEl.textContent = (hostReady && guestReady) ? '✅ 双方已准备，正在等待房主开启对战...' : '请双方调整各自卡组并点击「准备」按钮';
  }
}

// 绑定对战房间与邀请浮窗事件
document.getElementById('vrHostDeckSelect')?.addEventListener('change', (e) => {
  currentDeckIndex = parseInt(e.target.value, 10) || 0;
  syncAllDeckSelects();
});
document.getElementById('vrGuestDeckSelect')?.addEventListener('change', (e) => {
  currentDeckIndex = parseInt(e.target.value, 10) || 0;
  syncAllDeckSelects();
});
const enterDeckFromVersus = () => {
  OnlineState.returnToVersusAfterDeck = true;
  OnlineState.myReady = false;
  cfNet.send({ type: 'EDITING_DECK', editing: true });
  document.getElementById('versusRoomModal').classList.add('hidden');
  document.getElementById('btnNavDeck')?.click();
  const backBtn = document.getElementById('btnTopBackMenu');
  if (backBtn) backBtn.textContent = '🏠 回到对战房间';
};
document.getElementById('btnVrHostEditDeck')?.addEventListener('click', enterDeckFromVersus);
document.getElementById('btnVrGuestEditDeck')?.addEventListener('click', enterDeckFromVersus);
document.getElementById('btnVrCopyCode')?.addEventListener('click', () => {
  if (OnlineState.roomId && navigator.clipboard) {
    navigator.clipboard.writeText(OnlineState.roomId).then(() => showGameAlert(`已复制房号：${OnlineState.roomId}`)).catch(() => {});
  }
});
document.getElementById('btnVrLeaveRoom')?.addEventListener('click', () => {
  document.getElementById('versusRoomModal').classList.add('hidden');
  document.getElementById('victoryDefeatModal')?.classList.add('hidden');
  document.getElementById('mulliganModal')?.classList.add('hidden');
  document.getElementById('mainMenuOverlay')?.classList.remove('hidden');
  if (typeof startMainMenuBgAnim === 'function') startMainMenuBgAnim();
  leaveOnlineRoom(true);
  openOnlineLobbyModal();
});
document.getElementById('btnVrToggleReady')?.addEventListener('click', () => {
  if (!OnlineState.roomId) return;
  const wantReady = !OnlineState.myReady;
  if (wantReady) {
    const ids = getActiveDeckIdsForOnline();
    if (ids.length !== RULES.deckSize) {
      showGameAlert(`联机卡组必须恰好 ${RULES.deckSize} 张（当前 ${ids.length} 张），请先编辑卡组。`);
      return;
    }
  }
  // 以服务器回传的 ROOM 状态为准（卡组校验失败会收到 ERROR deck_invalid）
  cfNet.send({ type: 'READY', ready: wantReady, deckIds: wantReady ? getActiveDeckIdsForOnline() : undefined });
});
document.getElementById('btnVrStartMatch')?.addEventListener('click', () => {
  showGameAlert('双方都点击「准备」后，服务器会自动开局。');
});

document.getElementById('btnAcceptInvite')?.addEventListener('click', () => {
  const inv = OnlineState.pendingInvite;
  if (OnlineState.inviteTimer) { clearInterval(OnlineState.inviteTimer); OnlineState.inviteTimer = null; }
  document.getElementById('battleInviteToast').classList.add('hidden');
  OnlineState.pendingInvite = null;
  if (!inv) return;
  cfReadNickInput();
  cfNet.send({ type: 'INVITE_ACCEPT', roomId: inv.roomId, inviteId: inv.inviteId });
});
document.getElementById('btnDeclineInvite')?.addEventListener('click', () => {
  if (OnlineState.inviteTimer) { clearInterval(OnlineState.inviteTimer); OnlineState.inviteTimer = null; }
  const inv = OnlineState.pendingInvite;
  if (inv) cfNet.send({ type: 'INVITE_DECLINE', roomId: inv.roomId, inviteId: inv.inviteId });
  document.getElementById('battleInviteToast').classList.add('hidden');
  OnlineState.pendingInvite = null;
});
document.getElementById('btnMenuImportJson')?.addEventListener('click', () => {
  document.getElementById('btnOpenFileImport')?.click();
});


