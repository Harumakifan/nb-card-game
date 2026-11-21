// ============================================================================
// v1.88 联机对战：自建 Node 权威服务器（同源 WebSocket /ws）
//   - 服务器持有双方牌库、负责洗牌与先后手、在无头规则引擎中结算每一个动作，
//     并且只把"这一方应当看到的信息"下发给这一方（对手手牌 / 牌库只有张数）。
//   - 客户端只负责：收集玩家选择 → 发送意图 → 重放服务器返回的特效事件 → 渲染视图。
//   - 取代旧版"公共 MQTT 代理 + 双方互相信任快照"的实现（可伪造、可偷看手牌）。
// ============================================================================
const CF_NET_SESSION_KEY = 'cf_net_session_v1';
const CF_SYS_NOTICE_CARD = { id: 'sys_notice', name: '战局提示', type: 'spell', rarity: '传说', energy: 0, bones: 0, sacrifice: 0 };
const CF_DEFAULT_OPP_AVATAR = { backdrop: 'flame', hairStyle: 'long', hairColor: 'gold', eyeStyle: 'crimson', outfit: 'paladin', headgear: 'crown' };

const OnlineState = {
  connected: false,
  connecting: false,
  peerId: '',
  nickname: (() => { try { return localStorage.getItem('cf_online_nick'); } catch (e) { return null; } })() || ('决斗者_' + Math.floor(100 + Math.random() * 899)),
  rooms: new Map(),
  onlinePlayers: new Map(),
  // 房间
  roomId: null,
  role: null, // 'host' | 'guest'
  roomName: '',
  hasPassword: false,
  hostId: '', hostName: '', hostAvatar: null,
  guestId: '', guestName: '', guestAvatar: null,
  myReady: false, oppReady: false, oppEditingDeck: false,
  hostWins: 0, guestWins: 0,
  pendingJoinRoom: null,
  pendingInvite: null,
  inviteTimer: null,
  returnToVersusAfterDeck: false,
  returnToLobbyAfterDeck: false,
  // 对局
  inMatch: false,
  seat: -1,
  firstRole: 'host',
  activeRole: 'host',
  myMulliganDone: false,
  oppMulliganDone: false,
  awaitingServer: false,
  reqSeq: 0,
  pending: new Map(),
  lastSeq: 0,
  turnDeadline: 0,
  mulliganDeadline: 0,
  serverOffset: 0,
  timers: { turnSeconds: 60, mulliganSeconds: 30, awayGraceSeconds: 45, inviteSeconds: 10 },
  // 观战
  isSpectator: false,
  spectatingRoomId: null,
  spectatingRoomMeta: null,
  spectators: new Map(),
  _selectedArcadeRoom: null,
  recordedVfx: [],
};

function onlineIsMyTurn() {
  if (OnlineState.isSpectator || !OnlineState.inMatch || OnlineState.awaitingServer) return false;
  return OnlineState.activeRole === OnlineState.role;
}

function cfServerNow() { return Date.now() + (OnlineState.serverOffset || 0); }

function getActiveDeckIdsForOnline() {
  const deckObj = PRESET_DECKS[currentDeckIndex] || PRESET_DECKS[0];
  return expandDeck(deckObj).filter(cid => Boolean(cardsById[cid]));
}

function setOnlineConnBadge(status, text) {
  const el = document.getElementById('onlineConnBadge');
  if (!el) return;
  el.textContent = text;
  if (status === 'ok') {
    el.className = 'px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/50';
  } else if (status === 'connecting') {
    el.className = 'px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-400/50';
  } else {
    el.className = 'px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-500/20 text-rose-300 border border-rose-400/50';
  }
}

// ---------------------------------------------------------------- 传输层
const cfNet = {
  ws: null,
  wantOpen: false,
  retry: 0,
  retryTimer: null,

  url() {
    const meta = document.querySelector && document.querySelector('meta[name="cf-server"]');
    const custom = (window.CF_SERVER_URL || (meta && meta.content) || '').trim();
    if (custom) return custom;
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${location.host}/ws`;
  },

  token() { try { return sessionStorage.getItem(CF_NET_SESSION_KEY) || ''; } catch (e) { return ''; } },
  saveToken(t) { try { sessionStorage.setItem(CF_NET_SESSION_KEY, t); } catch (e) {} },

  connect() {
    if (location.protocol === 'file:') {
      setOnlineConnBadge('err', '🔴 本地文件模式无法联机（请通过服务器地址访问）');
      return;
    }
    this.wantOpen = true;
    if (this.ws && (this.ws.readyState === 0 || this.ws.readyState === 1)) return;
    clearTimeout(this.retryTimer);
    OnlineState.connecting = true;
    setOnlineConnBadge('connecting', '🟡 正在连接对战服务器...');
    let ws;
    try { ws = new WebSocket(this.url()); } catch (e) { this._scheduleRetry(); return; }
    this.ws = ws;
    ws.onopen = () => {
      this.retry = 0;
      ws.send(JSON.stringify({ type: 'HELLO', nickname: OnlineState.nickname, avatar: userAvatarConfig, token: this.token(), status: getPresenceStatus() }));
    };
    ws.onmessage = (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch (e) { return; }
      try { cfHandleServerMessage(msg); } catch (err) { console.error('[net] handler error', msg && msg.type, err); }
    };
    ws.onclose = (ev) => {
      if (this.ws !== ws) return;
      this.ws = null;
      OnlineState.connected = false;
      OnlineState.connecting = false;
      if (ev.code === 4001) { setOnlineConnBadge('err', '🔴 已在其他标签页登录'); this.wantOpen = false; return; }
      setOnlineConnBadge('err', '🔴 连接已断开，正在重连...');
      if (typeof updateBattleNetIndicator === 'function') updateBattleNetIndicator();
      this._scheduleRetry();
    };
    ws.onerror = () => {};
  },

  _scheduleRetry() {
    if (!this.wantOpen) return;
    const delay = Math.min(15000, 600 * Math.pow(1.8, this.retry++)) + Math.random() * 400;
    clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => this.connect(), delay);
  },

  send(msg) {
    if (!this.ws || this.ws.readyState !== 1 || !OnlineState.connected) return false;
    this.ws.send(JSON.stringify(msg));
    return true;
  },

  close() {
    this.wantOpen = false;
    clearTimeout(this.retryTimer);
    if (this.ws) { try { this.ws.close(1000); } catch (e) {} }
  },
};

function connectOnlineNetwork() { cfNet.connect(); }

/** 旧代码（表情 / 聊天）沿用的发送入口 */
function sendRoomPacket(pkt) {
  if (!pkt) return;
  if (pkt.type === 'LEADER_EMOTE') cfNet.send({ type: 'EMOTE', text: pkt.text });
  else if (pkt.type === 'CHAT_MSG') cfNet.send({ type: 'CHAT', text: pkt.text });
}

function cfSendPresence() {
  if (typeof getPresenceStatus === 'function') cfNet.send({ type: 'SET_STATUS', status: getPresenceStatus() });
}

// ---------------------------------------------------------------- 对局动作（意图）
/** 向服务器提交一个动作，返回 Promise<{ok, reason}>；结算结果通过 STATE 消息到达 */
function cfNetAction(action, params = {}) {
  if (!OnlineState.inMatch || OnlineState.isSpectator) return Promise.resolve({ ok: false, reason: '当前不在联机对局中' });
  if (OnlineState.activeRole !== OnlineState.role) return Promise.resolve({ ok: false, reason: '现在不是你的回合' });
  if (OnlineState.awaitingServer) return Promise.resolve({ ok: false, reason: '正在等待服务器结算上一个操作' });
  const reqId = ++OnlineState.reqSeq;
  OnlineState.awaitingServer = true;
  battle.animating = true;
  return new Promise((resolve) => {
    const done = (r) => {
      if (!OnlineState.pending.has(reqId)) return;
      OnlineState.pending.delete(reqId);
      OnlineState.awaitingServer = false;
      battle.animating = false;
      renderAllBattleUI();
      resolve(r);
    };
    OnlineState.pending.set(reqId, done);
    if (!cfNet.send({ type: 'ACTION', action, params, reqId })) {
      done({ ok: false, reason: '网络未连接，请稍候重试' });
      return;
    }
    setTimeout(() => {
      if (OnlineState.pending.has(reqId)) {
        done({ ok: false, reason: '服务器响应超时' });
        cfNet.send({ type: 'SYNC' });
      }
    }, 15000);
  });
}

async function cfNetPlayCard(card, lane, sacLanes, effectTargetLane, choiceIdx, handTargetUid, effectTargetSide, effectTargetLane2) {
  hiddenCardUids.add(card.uid);
  renderAllBattleUI();
  const r = await cfNetAction('PLAY', { uid: card.uid, lane, sacLanes, effectTargetLane, choiceIdx, handTargetUid, effectTargetSide, effectTargetLane2 });
  hiddenCardUids.delete(card.uid);
  if (!r.ok) cfShowRejectToast(r.reason);
  renderAllBattleUI();
  return r;
}

function cfShowRejectToast(reason) {
  sfx.play('hit');
  showTriggeredEffectToast(CF_SYS_NOTICE_CARD, `⚠️ 操作未生效：${reason || '服务器拒绝了该操作'}`, 0);
}

// ---------------------------------------------------------------- 服务器消息
const cfStateQueue = [];
let cfStateBusy = false;

function cfHandleServerMessage(m) {
  switch (m.type) {
    case 'WELCOME': return cfOnWelcome(m);
    case 'LOBBY': return cfOnLobby(m);
    case 'ROOM': return cfOnRoom(m);
    case 'ROOM_LEFT': return cfOnRoomLeft(m);
    case 'ROOM_CLOSED':
      cfResetRoomState();
      document.getElementById('versusRoomModal')?.classList.add('hidden');
      showGameAlert(m.reason || '房间已解散');
      openOnlineLobbyModal();
      return;
    case 'JOIN_REJECTED': return cfOnJoinRejected(m);
    case 'NOTICE':
      showTriggeredEffectToast(CF_SYS_NOTICE_CARD, m.message || '', 0);
      return;
    case 'ERROR': return cfOnError(m);
    case 'INVITED': return showBattleInviteToast(m);
    case 'SPECTATORS':
      OnlineState.spectators = new Map((m.list || []).map(s => [s.id, { ...s, ts: Date.now() }]));
      updateSpectatorHudWidget();
      if (m.joined) showSpectatorJoinNotice(m.joined.name);
      return;
    case 'MATCH_START': return cfOnMatchStart(m, false);
    case 'MATCH_RESUME': return cfOnMatchStart(m, true);
    case 'STATE':
    case 'MATCH_END':
      cfStateQueue.push(m);
      cfDrainStateQueue();
      return;
    case 'ACTION_REJECTED': {
      const done = OnlineState.pending.get(m.reqId);
      if (done) done({ ok: false, reason: m.reason });
      else cfShowRejectToast(m.reason);
      return;
    }
    case 'OPP_AWAY': {
      const oppName = OnlineState.role === 'host' ? OnlineState.guestName : OnlineState.hostName;
      startOppDisconnectCountdown(oppName, m.graceSec);
      return;
    }
    case 'OPP_BACK':
      resetOppDisconnectMonitor();
      showTriggeredEffectToast(CF_SYS_NOTICE_CARD, '🌐 对手已重新连接回到战局！', 0);
      return;
    case 'SPECTATE_WAIT': return cfOnSpectateWait(m);
    case 'SPECTATE_START': return cfOnSpectateStart(m);
    case 'SPECTATE_END':
      if (OnlineState.isSpectator) {
        stopSpectatingRoom(false);
        if (m.reason && m.reason !== 'left') showGameAlert(`观战结束：${m.reason}`);
      }
      return;
    case 'CHAT':
      if (typeof window.appendInGameChatMessage === 'function') window.appendInGameChatMessage(m.from || '对手', m.text, false);
      if (typeof showLeaderChatBubble === 'function') showLeaderChatBubble(1, m.from || '对手', m.text);
      return;
    case 'EMOTE':
      if (typeof showLeaderEmoteBubble === 'function') showLeaderEmoteBubble(m.who ? (m.who === 'host' ? 0 : 1) : 1, m.text);
      return;
    default:
      return;
  }
}

function cfOnWelcome(m) {
  OnlineState.connected = true;
  OnlineState.connecting = false;
  OnlineState.peerId = m.peerId;
  OnlineState.nickname = m.nickname || OnlineState.nickname;
  OnlineState.serverOffset = (m.serverTime || Date.now()) - Date.now();
  if (m.timers) OnlineState.timers = Object.assign({}, OnlineState.timers, m.timers);
  cfNet.saveToken(m.token);
  setOnlineConnBadge('ok', '🟢 已连接对战服务器');
  if (!m.resumed && (OnlineState.roomId || OnlineState.inMatch || OnlineState.isSpectator)) {
    // 服务器已不记得我们（例如服务器重启或宽限期已过）：清理本地残留状态
    const wasInMatch = OnlineState.inMatch;
    cfResetRoomState();
    if (OnlineState.isSpectator) stopSpectatingRoom(false);
    if (wasInMatch) {
      battle.gameOver = true;
      showGameAlert('与服务器的连接已重置，本局联机对战已结束。');
    }
  }
  cfSendPresence();
  if (typeof updateBattleNetIndicator === 'function') updateBattleNetIndicator();
}

function cfOnLobby(m) {
  OnlineState.rooms = new Map((m.rooms || []).map(r => [r.roomId, r]));
  OnlineState.onlinePlayers = new Map((m.players || []).map(p => [p.peerId, p]));
  renderOnlineRoomList();
  renderOnlinePlayerList();
}

function cfOnRoom(m) {
  const isNewRoom = OnlineState.roomId !== m.roomId;
  OnlineState.roomId = m.roomId;
  OnlineState.role = m.role;
  OnlineState.roomName = m.roomName;
  OnlineState.hasPassword = Boolean(m.hasPassword);
  OnlineState.hostId = m.hostId; OnlineState.hostName = m.hostName; OnlineState.hostAvatar = m.hostAvatar;
  OnlineState.guestId = m.guestId; OnlineState.guestName = m.guestName; OnlineState.guestAvatar = m.guestAvatar;
  const mine = m.role, other = m.role === 'host' ? 'guest' : 'host';
  OnlineState.myReady = Boolean(m.ready && m.ready[mine]);
  OnlineState.oppReady = Boolean(m.ready && m.ready[other]);
  OnlineState.oppEditingDeck = Boolean(m.editing && m.editing[other]);
  OnlineState.oppOnline = other === 'host' ? m.hostOnline : m.guestOnline;
  if (m.wins) { OnlineState.hostWins = m.wins.host || 0; OnlineState.guestWins = m.wins.guest || 0; }
  OnlineState.spectators = new Map((m.spectators || []).map(s => [s.id, { ...s, ts: Date.now() }]));
  document.getElementById('onlinePwdModal')?.classList.add('hidden');
  updateOnlineRoomWaitUI();
  // 刚创建 / 加入房间时打开对战房间面板（对局中或正在编辑卡组时不打扰）
  if (isNewRoom && !OnlineState.inMatch && m.status !== 'playing' && !OnlineState.returnToVersusAfterDeck) openVersusRoomModal();
  updateVersusRoomUI();
  updateSpectatorHudWidget();
  cfSendPresence();
}

function cfResetRoomState() {
  OnlineState.roomId = null;
  OnlineState.role = null;
  OnlineState.guestId = ''; OnlineState.guestName = ''; OnlineState.guestAvatar = null;
  OnlineState.hostId = ''; OnlineState.hostName = ''; OnlineState.hostAvatar = null;
  OnlineState.inMatch = false;
  OnlineState.seat = -1;
  OnlineState.myReady = false; OnlineState.oppReady = false;
  OnlineState.myMulliganDone = false; OnlineState.oppMulliganDone = false;
  OnlineState.awaitingServer = false;
  OnlineState.pending.forEach(done => done({ ok: false, reason: '已离开房间' }));
  OnlineState.pending.clear();
  stopTurnCountdownTimer();
  stopMulliganCountdownTimer();
  resetOppDisconnectMonitor();
  document.getElementById('onlineWaitOverlay')?.classList.add('hidden');
  updateOnlineRoomWaitUI();
  renderOnlineRoomList();
}

function cfOnRoomLeft() {
  cfResetRoomState();
  document.getElementById('versusRoomModal')?.classList.add('hidden');
  cfSendPresence();
}

function cfOnJoinRejected(m) {
  if (OnlineState.roomId) return;
  const errEl = document.getElementById('onlinePwdError');
  if (m.needPassword) {
    const meta = OnlineState.pendingJoinRoom || { roomId: m.roomId, roomName: `房间 #${m.roomId}`, hasPassword: true };
    OnlineState.pendingJoinRoom = meta;
    document.getElementById('onlinePwdRoomDesc').textContent = `房间「${meta.roomName || meta.roomId}」(#${meta.roomId}) 需要密码`;
    document.getElementById('onlinePwdModal').classList.remove('hidden');
    if (errEl) { errEl.textContent = m.reason || '密码错误'; errEl.classList.remove('hidden'); }
  } else {
    showGameAlert(m.reason || '无法加入该房间');
  }
}

function cfOnError(m) {
  if (m.code === 'deck_invalid') {
    OnlineState.myReady = false;
    updateVersusRoomUI();
    showGameAlert(m.message || '卡组不合法');
    return;
  }
  if (['create_failed', 'invite_failed', 'spectate_failed', 'in_room', 'rate_limited', 'busy'].includes(m.code)) {
    showGameAlert(m.message || '操作失败');
    return;
  }
  console.warn('[net] server error', m.code, m.message);
}

// ---------------------------------------------------------------- 开局 / 重连
function cfSetupOpponentInfo(m) {
  if (m.opponent) {
    if (OnlineState.role === 'host') { OnlineState.guestName = m.opponent.name; OnlineState.guestAvatar = m.opponent.avatar; }
    else { OnlineState.hostName = m.opponent.name; OnlineState.hostAvatar = m.opponent.avatar; }
  }
}

function cfOnMatchStart(m, isResume) {
  OnlineState.role = m.role;
  OnlineState.seat = m.seat;
  OnlineState.firstRole = m.firstSeat === 0 ? 'host' : 'guest';
  OnlineState.serverOffset = (m.serverTime || Date.now()) - Date.now();
  cfSetupOpponentInfo(m);
  OnlineState.inMatch = true;
  OnlineState.isSpectator = false;
  OnlineState.awaitingServer = false;
  OnlineState.lastSeq = isResume ? (m.seq || 0) : 0;
  cfStateQueue.length = 0;
  battleMode = 'pvp_online';
  const selMode = document.getElementById('selectBattleMode');
  if (selMode) selMode.value = 'pvp_online';
  document.getElementById('onlineLobbyModal')?.classList.add('hidden');
  document.getElementById('versusRoomModal')?.classList.add('hidden');
  document.getElementById('victoryDefeatModal')?.classList.add('hidden');
  document.getElementById('mainMenuOverlay')?.classList.add('hidden');
  if (typeof window.enterBattleFullscreenLandscape === 'function') window.enterBattleFullscreenLandscape();

  if (!isResume) initBattleUiShellForOnline();
  _battleSessionSeq++;
  cfApplyBattleView(m.view);
  battle.animating = false;
  const phase = m.phase || 'mulligan';
  const activeSeat = typeof m.activeSeat === 'number' ? m.activeSeat : m.firstSeat;
  OnlineState.activeRole = activeSeat === 0 ? 'host' : (activeSeat === 1 ? 'guest' : '');
  syncOnlineAvatarsAndHud();
  const mulOrder = document.getElementById('mulliganOrderLabel');
  if (mulOrder) mulOrder.textContent = battle.firstPlayerSide === 0 ? '先手 · FIRST' : '后手 · SECOND';
  const orderBadge = document.getElementById('uiTurnOrderBadge');
  if (orderBadge) orderBadge.textContent = battle.firstPlayerSide === 0 ? '🎲 我方先手' : '🎲 我方后手';
  renderAllBattleUI();
  if (phase === 'mulligan') {
    OnlineState.mulliganDeadline = m.deadline || 0;
    if (!isResume || m.mulliganPending) {
      OnlineState.myMulliganDone = false;
      openMulliganDualBox();
    } else {
      document.getElementById('mulliganModal')?.classList.add('hidden');
      document.getElementById('onlineWaitOverlay')?.classList.remove('hidden');
    }
  } else {
    document.getElementById('mulliganModal')?.classList.add('hidden');
    document.getElementById('onlineWaitOverlay')?.classList.add('hidden');
    OnlineState.turnDeadline = m.deadline || 0;
    startTurnCountdownTimer();
  }
  cfSendPresence();
  if (typeof updateBattleNetIndicator === 'function') updateBattleNetIndicator();
}

// ---------------------------------------------------------------- 状态更新（串行处理，保证特效按顺序播放）
async function cfDrainStateQueue() {
  if (cfStateBusy) return;
  cfStateBusy = true;
  try {
    while (cfStateQueue.length) {
      const m = cfStateQueue.shift();
      try {
        if (m.type === 'MATCH_END') await cfOnMatchEnd(m);
        else if (m.spectator) await cfApplySpectatorState(m);
        else await cfApplyState(m);
      } catch (err) {
        console.error('[net] apply state failed', err);
        cfNet.send({ type: 'SYNC' });
      }
    }
  } finally {
    cfStateBusy = false;
  }
}

async function cfReplayServerEvents(m, mySideActor) {
  const cause = m.cause || {};
  const events = Array.isArray(m.events) ? m.events : [];
  if (cause.kind === 'PLAY' && !mySideActor) {
    await replayOpponentActionsOnClient({ cid: cause.cid, cardType: cause.cardType, lane: cause.lane, sacCount: cause.sacCount, vfxList: events });
    const played = cause.cid ? cardsById[cause.cid] : null;
    if (played && played.type === 'spell') { sfx.play('synergy'); showOppSpellShowcase(played); }
    return;
  }
  if (events.length) await replayRecordedVfxList(events);
}

async function cfApplyState(m) {
  if (!OnlineState.inMatch) return;
  if (m.seq && m.seq <= OnlineState.lastSeq) return;
  OnlineState.lastSeq = m.seq || OnlineState.lastSeq;
  const cause = m.cause || {};
  const mine = cause.actor === 'me';
  battle.animating = true;
  await cfReplayServerEvents(m, mine);
  cfApplyBattleView(m.view);
  OnlineState.activeRole = m.activeSeat === 0 ? 'host' : (m.activeSeat === 1 ? 'guest' : '');
  if (m.reqId && OnlineState.pending.has(m.reqId)) {
    OnlineState.pending.get(m.reqId)({ ok: true });
  }
  battle.animating = Boolean(OnlineState.awaitingServer);
  syncOnlineAvatarsAndHud();
  renderAllBattleUI();
  if (typeof renderBattleRecordPanel === 'function') renderBattleRecordPanel();

  if (cause.kind === 'PLAY' && mine && typeof cause.lane === 'number' && cause.cardType !== 'spell') {
    const placed = battle.board[0][cause.lane];
    if (placed && typeof playCardEnterVFX === 'function') playCardEnterVFX(0, cause.lane, placed.data.rarity, placed.data.type);
  }
  if (cause.kind === 'MULLIGAN') {
    if (mine) {
      OnlineState.myMulliganDone = true;
      battle.mulliganSwapped = [false, false, false, false];
      renderMulliganDualBox();
      await sleep(650);
      document.getElementById('mulliganModal')?.classList.add('hidden');
      stopMulliganCountdownTimer();
      if (m.phase === 'mulligan') document.getElementById('onlineWaitOverlay')?.classList.remove('hidden');
    } else {
      OnlineState.oppMulliganDone = true;
    }
  }
  if (m.phase === 'playing') {
    document.getElementById('onlineWaitOverlay')?.classList.add('hidden');
    document.getElementById('mulliganModal')?.classList.add('hidden');
  }
  if (cause.kind === 'END_TURN') {
    stopTurnCountdownTimer();
    if (mine && m.timeout) showTriggeredEffectToast(CF_SYS_NOTICE_CARD, '⌛ 思考时间到，系统已自动结束回合！', 0);
  }
  if (cause.kind === 'TURN_START') {
    OnlineState.turnDeadline = m.deadline || 0;
    startTurnCountdownTimer();
    await playTurnStartBanner(m.myTurn ? 0 : 1);
  }
  if (cause.kind === 'SURRENDER' && !mine) {
    showTriggeredEffectToast(CF_SYS_NOTICE_CARD, '🏳️ 对手已投降认输！', 0);
  }
}

async function cfOnMatchEnd(m) {
  if (m.spectator) {
    if (!OnlineState.isSpectator) return;
    const winnerName = m.winner === 'host' ? (OnlineState.hostName || '1P') : (m.winner === 'guest' ? (OnlineState.guestName || '2P') : '');
    battle.gameOver = true;
    renderAllBattleUI();
    showGameAlert(winnerName ? `对局结束：【${winnerName}】获胜！` : '对局结束：平局', '🏁');
    return;
  }
  if (!OnlineState.inMatch) return;
  if (m.wins) { OnlineState.hostWins = m.wins.host || 0; OnlineState.guestWins = m.wins.guest || 0; }
  const reasonText = {
    hp: { win: '你成功击败了联机对手！', lose: '己方主战者生命值归零。', draw: '双方主战者同时倒下，本局平局。' },
    surrender: { win: '对手选择了投降认输，你获得胜利！', lose: '你选择了投降认输。' },
    disconnect: { win: '对手断线超过宽限时间未重连，系统判定你获得胜利！', lose: '你断线超过宽限时间，本局判负。' },
    left: { win: '对手已离开房间，你获得胜利！', lose: '你离开了对局，本局判负。' },
  };
  const txt = (reasonText[m.reason] && reasonText[m.reason][m.result]) || (m.result === 'win' ? '你获得了胜利！' : (m.result === 'draw' ? '本局平局。' : '本局落败。'));
  showOnlineVictoryDefeatModal(m.result === 'win', txt, m.result === 'draw');
}

// ---------------------------------------------------------------- 大厅 / 房间 UI
function renderOnlineRoomList() {
  const listEl = document.getElementById('onlineRoomList');
  const cntEl = document.getElementById('onlineRoomCountText');
  if (!listEl) return;
  // 房间列表由服务器维护（服务器时间），不再用本机时钟过滤，避免设备时间不准时房间"消失"
  const validRooms = [...OnlineState.rooms.values()].filter(info => info && info.roomId);
  validRooms.sort((a, b) => (b.ts || 0) - (a.ts || 0));
  if (cntEl) cntEl.textContent = `(${validRooms.length} 台街机活跃中)`;

  if (validRooms.length === 0) {
    listEl.className = 'space-y-2 pr-1';
    listEl.innerHTML = `<div class="text-center text-slate-500 text-xs py-12">${OnlineState.connected ? '🕹️ 当前暂无街机对战房间，快在右侧创建一间吧！' : '正在连接对战服务器...'}</div>`;
    return;
  }

  listEl.className = 'arcade-room-grid pr-1';
  listEl.innerHTML = '';
  const defaultAv = { backdrop: 'cyber', hairStyle: 'short', hairColor: 'silver', eyeStyle: 'visor', outfit: 'mech', headgear: 'none' };
  validRooms.forEach(r => {
    const isPlaying = r.status === 'playing';
    const hasGuest = Boolean(r.guestId || (r.playerCount || 1) >= 2);
    const hostAvUri = renderCustomAvatarDataURI(r.hostAvatar || defaultAv);
    const guestAvUri = hasGuest ? renderCustomAvatarDataURI(r.guestAvatar || CF_DEFAULT_OPP_AVATAR) : '';
    const specs = Array.isArray(r.spectators) ? r.spectators : [];
    const specCount = Math.max(specs.length, Number(r.spectatorCount) || 0);
    const maxInlineSpecs = 9;
    const shownSpecs = specs.slice(0, maxInlineSpecs);
    const extraSpecCnt = Math.max(0, specCount - maxInlineSpecs);

    const card = document.createElement('div');
    card.className = `arcade-cabinet ${isPlaying ? 'is-playing' : 'is-waiting'}`;
    card.innerHTML = `
      <div class="arcade-marquee">
        <div class="flex items-center gap-1.5 min-w-0">
          <span class="text-xs">${r.hasPassword ? '🔒' : '🕹️'}</span>
          <span class="text-xs font-black text-white truncate">${escapeHtml(r.roomName || ('街机房 ' + r.roomId))}</span>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <span class="px-1.5 py-0.5 rounded text-[10px] font-black ${isPlaying ? 'bg-rose-500/25 text-rose-300 border border-rose-500/50' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}">${isPlaying ? `⚔️ R${Number(r.turn) || 1}` : '⏳ 准备中'}</span>
          <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-cyan-300 border border-slate-700">#${escapeHtml(r.roomId)}</span>
        </div>
      </div>
      <div class="arcade-screen">
        <div class="arcade-player-slot">
          <img src="${hostAvUri}" class="arcade-avatar" alt="1P"/>
          <span class="text-[11px] font-black text-amber-200 truncate max-w-full">${escapeHtml(r.hostName || '1P 玩家')}</span>
        </div>
        <div class="arcade-vs-badge flex flex-col items-center justify-center px-1">
          <span class="text-base font-black ${isPlaying ? 'text-rose-400' : 'text-amber-300'} tracking-wider">VS</span>
          <span class="text-[9px] font-bold text-slate-400">${isPlaying ? '激战' : (hasGuest ? '备战' : '1/2')}</span>
        </div>
        <div class="arcade-player-slot">
          ${hasGuest ? `<img src="${guestAvUri}" class="arcade-avatar" style="border-color:#22d3ee;" alt="2P"/>` : `<div class="arcade-avatar-empty">?</div>`}
          <span class="text-[11px] font-black ${hasGuest ? 'text-cyan-200' : 'text-slate-400'} truncate max-w-full">${hasGuest ? escapeHtml(r.guestName || '2P 挑战者') : '等待挑战'}</span>
        </div>
      </div>
      <div class="arcade-spectator-row" title="点击街机查看对局详情">
        ${specCount === 0
          ? `<span class="text-[10px] text-slate-500 font-bold">👁️ 暂无观战 · 点击机台看详情</span>`
          : shownSpecs.map(sp => `<img src="${renderCustomAvatarDataURI(sp.avatar || defaultAv)}" class="arcade-spectator-chip" title="${escapeHtml(sp.name || '观战者')}"/>`).join('')
            + (extraSpecCnt > 0 ? `<span class="text-[10px] font-black text-cyan-300 ml-1">+${extraSpecCnt}</span>` : `<span class="text-[10px] text-cyan-300 font-bold ml-auto">${specCount}人观战</span>`)
        }
      </div>
      <div class="arcade-actions-row">
        ${(!isPlaying && !hasGuest)
          ? `<button type="button" class="arcade-btn-join">⚔️ 加入房间</button>`
          : `<button type="button" class="arcade-btn-join" style="opacity:0.45;cursor:not-allowed;" disabled>${isPlaying ? '激战中' : '已满员'}</button>`
        }
        <button type="button" class="arcade-btn-spec">👁️ 观战</button>
      </div>
    `;
    card.onclick = () => openArcadeRoomDetailModal(r);
    const joinDirectBtn = card.querySelector('.arcade-btn-join');
    if (joinDirectBtn && !joinDirectBtn.disabled) {
      joinDirectBtn.onclick = (e) => { e.stopPropagation(); attemptJoinRoom(r); };
    }
    const specDirectBtn = card.querySelector('.arcade-btn-spec');
    if (specDirectBtn) specDirectBtn.onclick = (e) => { e.stopPropagation(); startSpectatingRoom(r); };
    listEl.appendChild(card);
  });
}

function openArcadeRoomDetailModal(r) {
  if (!r) return;
  OnlineState._selectedArcadeRoom = r;
  const modal = document.getElementById('arcadeRoomDetailModal');
  if (!modal) return;
  const defaultAv = { backdrop: 'cyber', hairStyle: 'short', hairColor: 'silver', eyeStyle: 'visor', outfit: 'mech', headgear: 'none' };
  const hasGuest = Boolean(r.guestId || (r.playerCount || 1) >= 2);
  const isPlaying = r.status === 'playing';
  document.getElementById('ardRoomTitle').textContent = `🕹️ ${r.roomName || ('房间 ' + r.roomId)}`;
  document.getElementById('ardRoomSub').textContent = `#${r.roomId} · ${r.hasPassword ? '🔒 密码房' : '🔓 公开房'} · ${isPlaying ? '正在对战中' : '房间准备中'}`;
  document.getElementById('ardHostAvatar').src = renderCustomAvatarDataURI(r.hostAvatar || defaultAv);
  document.getElementById('ardHostName').textContent = r.hostName || '1P 房主';
  document.getElementById('ardHostHp').textContent = isPlaying ? `❤️ HP ${r.hostHp ?? 30}` : '⏳ 备战中';
  document.getElementById('ardGuestAvatar').src = renderCustomAvatarDataURI(hasGuest ? (r.guestAvatar || defaultAv) : defaultAv);
  document.getElementById('ardGuestName').textContent = hasGuest ? (r.guestName || '2P 挑战者') : '等待加入...';
  document.getElementById('ardGuestHp').textContent = isPlaying ? `❤️ HP ${r.guestHp ?? 30}` : (hasGuest ? '⏳ 备战中' : '空位');
  document.getElementById('ardTurnBadge').textContent = isPlaying ? `第 ${r.turn || 1} 回合` : '尚未开局';
  const specs = Array.isArray(r.spectators) ? r.spectators : [];
  document.getElementById('ardSpecCount').textContent = `👁️ ${Math.max(specs.length, Number(r.spectatorCount) || 0)} 人观战`;
  const specWrap = document.getElementById('ardSpecRowWrap');
  const specList = document.getElementById('ardSpecList');
  if (specs.length > 0 && specWrap && specList) {
    specWrap.classList.remove('hidden');
    specList.innerHTML = specs.map(sp => `
      <div class="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-full px-2 py-0.5">
        <img src="${renderCustomAvatarDataURI(sp.avatar || defaultAv)}" class="w-5 h-5 rounded-full object-cover border border-cyan-400"/>
        <span class="text-[11px] font-bold text-slate-200">${escapeHtml(sp.name || '观战者')}</span>
      </div>
    `).join('');
  } else if (specWrap) {
    specWrap.classList.add('hidden');
  }
  const joinBtn = document.getElementById('btnArcadeJoin');
  if (joinBtn) {
    const canJoin = !isPlaying && !hasGuest && !OnlineState.roomId && !OnlineState.isSpectator;
    joinBtn.disabled = !canJoin;
    joinBtn.style.opacity = canJoin ? '1' : '0.45';
    joinBtn.textContent = OnlineState.roomId === r.roomId ? '已在房内' : (isPlaying || hasGuest ? '房间已满/对战中' : '⚔️ 加入对战');
  }
  modal.classList.remove('hidden');
  modal.style.display = 'flex';
}

function showSpectatorJoinNotice(name) {
  const el = document.getElementById('spectatorJoinToast');
  if (!el) return;
  el.textContent = `👁️ ${name || '有玩家'} 正在观战！`;
  el.classList.remove('hidden');
  clearTimeout(OnlineState._specToastTimer);
  OnlineState._specToastTimer = setTimeout(() => el.classList.add('hidden'), 3600);
}

function updateSpectatorHudWidget() {
  const widget = document.getElementById('spectatorHudWidget');
  const cntEl = document.getElementById('spectatorHudCount');
  const itemsEl = document.getElementById('spectatorListItems');
  if (!widget || !cntEl || !itemsEl) return;
  const activeSpecs = [...OnlineState.spectators.values()].filter(Boolean);
  const inOnlineOrSpec = (battleMode === 'pvp_online' && OnlineState.inMatch) || OnlineState.isSpectator;
  widget.classList.toggle('hidden', !inOnlineOrSpec);
  cntEl.textContent = String(activeSpecs.length);
  if (activeSpecs.length === 0) {
    itemsEl.innerHTML = `<div class="text-[11px] text-slate-500 text-center py-2">暂无观战者</div>`;
  } else {
    const defaultAv = { backdrop: 'cyber', hairStyle: 'short', hairColor: 'silver', eyeStyle: 'visor', outfit: 'mech', headgear: 'none' };
    itemsEl.innerHTML = activeSpecs.map(sp => `
      <div class="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-2 py-1.5">
        <img src="${renderCustomAvatarDataURI(sp.avatar || defaultAv)}" class="w-7 h-7 rounded-lg border border-cyan-400 object-cover shrink-0"/>
        <span class="text-xs font-bold text-slate-100 truncate">${escapeHtml(sp.name || '观战者')}</span>
      </div>
    `).join('');
  }
}

// ---------------------------------------------------------------- 观战
function startSpectatingRoom(roomMeta) {
  if (!roomMeta || !roomMeta.roomId) return;
  if (!OnlineState.connected) { showGameAlert('尚未连接对战服务器，请稍候再试！'); return; }
  if (OnlineState.roomId) { showGameAlert('请先离开当前房间再观战。'); return; }
  OnlineState.spectatingRoomMeta = roomMeta;
  cfNet.send({ type: 'SPECTATE', roomId: roomMeta.roomId });
}

function cfEnterSpectatorShell(roomId, host, guest) {
  document.getElementById('arcadeRoomDetailModal')?.classList.add('hidden');
  document.getElementById('onlineLobbyModal')?.classList.add('hidden');
  document.getElementById('mainMenuOverlay')?.classList.add('hidden');
  if (typeof window.enterBattleFullscreenLandscape === 'function') window.enterBattleFullscreenLandscape();
  OnlineState.isSpectator = true;
  OnlineState.spectatingRoomId = roomId;
  OnlineState.inMatch = false;
  OnlineState.lastSeq = 0;
  cfStateQueue.length = 0;
  battleMode = 'pvp_online';
  initBattleUiShellForOnline();
  if (host) { OnlineState.hostName = host.name; OnlineState.hostAvatar = host.avatar; }
  if (guest) { OnlineState.guestName = guest.name; OnlineState.guestAvatar = guest.avatar; }
  document.getElementById('spectatorModeBanner')?.classList.remove('hidden');
  const btnOrb = document.getElementById('btnTurnOrb');
  if (btnOrb) btnOrb.classList.add('opacity-50', 'pointer-events-none');
  cfSyncSpectatorHeads();
  updateSpectatorHudWidget();
  cfSendPresence();
}

function cfSyncSpectatorHeads() {
  const pImg = document.getElementById('playerLeaderImg');
  if (pImg) pImg.src = renderLeaderPortraitDataURI(OnlineState.hostAvatar || {});
  const eImg = document.getElementById('enemyLeaderImg');
  if (eImg) eImg.src = renderLeaderPortraitDataURI(OnlineState.guestAvatar || CF_DEFAULT_OPP_AVATAR);
  const pTitle = document.getElementById('uiPlayerLeaderTitle');
  if (pTitle) pTitle.textContent = `👁️ ${OnlineState.hostName || '1P 房主'}`;
  const eTitle = document.getElementById('uiEnemyLeaderTitle');
  if (eTitle) eTitle.textContent = `👁️ ${OnlineState.guestName || '2P 挑战者'}`;
  const bannerTxt = document.getElementById('spectatorBannerText');
  if (bannerTxt) bannerTxt.textContent = `${OnlineState.hostName || '1P'} VS ${OnlineState.guestName || '2P'}${battle.turn ? ` · 第 ${battle.turn} 回合` : ''}`;
}

function cfOnSpectateWait(m) {
  cfEnterSpectatorShell(m.roomId, m.host, m.guest);
  battle.turn = 0;
  battle.board = [[null, null, null, null, null], [null, null, null, null, null]];
  battle.leaders[0] = createLeaderState(0, []);
  battle.leaders[1] = createLeaderState(1, []);
  battle.turnLogs = [];
  const bannerTxt = document.getElementById('spectatorBannerText');
  if (bannerTxt) bannerTxt.textContent = `${OnlineState.hostName || '1P'} VS ${OnlineState.guestName || '等待挑战者'} · 等待开局...`;
  renderAllBattleUI();
}

function cfOnSpectateStart(m) {
  cfEnterSpectatorShell(m.roomId, m.host, m.guest);
  cfApplyBattleView(m.view);
  battle.animating = false;
  cfSyncSpectatorHeads();
  renderAllBattleUI();
}

async function cfApplySpectatorState(m) {
  if (!OnlineState.isSpectator) return;
  if (m.seq && m.seq <= OnlineState.lastSeq) return;
  OnlineState.lastSeq = m.seq || OnlineState.lastSeq;
  battle.animating = true;
  if (Array.isArray(m.events) && m.events.length) await replayRecordedVfxList(m.events);
  cfApplyBattleView(m.view);
  battle.animating = false;
  cfSyncSpectatorHeads();
  renderAllBattleUI();
  if (typeof renderBattleRecordPanel === 'function') renderBattleRecordPanel();
  if (m.cause && m.cause.kind === 'TURN_START') await playTurnStartBanner(m.activeSeat === 0 ? 0 : 1);
}

function stopSpectatingRoom(notifyServer = true) {
  if (notifyServer) cfNet.send({ type: 'SPECTATE_LEAVE' });
  OnlineState.isSpectator = false;
  OnlineState.spectatingRoomId = null;
  OnlineState.spectatingRoomMeta = null;
  OnlineState.spectators.clear();
  cfStateQueue.length = 0;
  battleMode = 'pve';
  battle.gameOver = true;
  document.getElementById('spectatorModeBanner')?.classList.add('hidden');
  document.getElementById('spectatorHudWidget')?.classList.add('hidden');
  const btnOrb = document.getElementById('btnTurnOrb');
  if (btnOrb) btnOrb.classList.remove('opacity-50', 'pointer-events-none');
  document.getElementById('mainMenuOverlay')?.classList.remove('hidden');
  if (typeof startMainMenuBgAnim === 'function') startMainMenuBgAnim();
  openOnlineLobbyModal();
}

// ---------------------------------------------------------------- 建房 / 加入 / 离开
function cfReadNickInput() {
  const nick = (document.getElementById('onlineNickInput')?.value || '').trim().slice(0, 14) || OnlineState.nickname;
  if (nick !== OnlineState.nickname) {
    OnlineState.nickname = nick;
    try { localStorage.setItem('cf_online_nick', nick); } catch (e) {}
    cfNet.send({ type: 'SET_PROFILE', nickname: nick, avatar: userAvatarConfig });
  }
  return nick;
}

function updateOnlineRoomWaitUI() {
  const createPanel = document.getElementById('onlineCreatePanel');
  const waitPanel = document.getElementById('onlineRoomWaitPanel');
  if (!createPanel || !waitPanel) return;
  if (!OnlineState.roomId) {
    createPanel.classList.remove('hidden');
    waitPanel.classList.add('hidden');
    waitPanel.classList.remove('flex');
    return;
  }
  createPanel.classList.add('hidden');
  waitPanel.classList.remove('hidden');
  waitPanel.classList.add('flex');
  document.getElementById('waitRoomTitle').textContent = OnlineState.roomName || `房间 ${OnlineState.roomId}`;
  document.getElementById('waitRoomIdCode').textContent = OnlineState.roomId;
  document.getElementById('waitRoomLockTag').textContent = OnlineState.hasPassword ? '🔒 密码保护' : '🔓 公开房间';
  document.getElementById('waitHostName').textContent = OnlineState.hostName || '--';
  const gNameEl = document.getElementById('waitGuestName');
  const gStatEl = document.getElementById('waitGuestStatus');
  const startBtn = document.getElementById('btnStartOnlineMatch');
  const hintEl = document.getElementById('waitHintText');
  if (startBtn) startBtn.classList.add('hidden'); // 双方准备后由服务器自动开局
  if (OnlineState.guestId) {
    gNameEl.textContent = OnlineState.guestName || '挑战者';
    gNameEl.className = 'text-xs font-black text-white mt-0.5';
    gStatEl.textContent = '已加入';
    gStatEl.className = 'px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
    hintEl.textContent = '✅ 双方已在房间内，请在对战房间中选择卡组并点击「准备」。';
  } else {
    gNameEl.textContent = '等待对手加入...';
    gNameEl.className = 'text-xs font-black text-slate-400 mt-0.5';
    gStatEl.textContent = '空位';
    gStatEl.className = 'px-2 py-0.5 rounded-full text-[11px] font-black bg-slate-800 text-slate-400 border border-slate-600';
    hintEl.textContent = '请将房间号（和密码）分享给好友，或等待大厅玩家加入...';
  }
}

function createOnlineRoom() {
  if (!OnlineState.connected) { cfNet.connect(); showGameAlert('正在连接对战服务器，请稍候再试。'); return; }
  const nick = cfReadNickInput();
  const name = (document.getElementById('createRoomNameInput')?.value || '').trim() || `${nick}的对战房`;
  const password = (document.getElementById('createRoomPwdInput')?.value || '').trim();
  OnlineState.hostWins = 0;
  OnlineState.guestWins = 0;
  cfNet.send({ type: 'CREATE_ROOM', name, password });
}

function attemptJoinRoom(roomMeta) {
  if (!OnlineState.connected) { showGameAlert('尚未连接对战服务器，请稍候再试！'); return; }
  OnlineState.pendingJoinRoom = roomMeta;
  if (roomMeta.hasPassword) {
    document.getElementById('onlinePwdRoomDesc').textContent = `房间「${roomMeta.roomName}」(#${roomMeta.roomId}) 需要密码`;
    document.getElementById('onlinePwdInput').value = '';
    document.getElementById('onlinePwdError').classList.add('hidden');
    document.getElementById('onlinePwdModal').classList.remove('hidden');
    setTimeout(() => document.getElementById('onlinePwdInput').focus(), 50);
  } else {
    sendJoinRoomRequest(roomMeta, '');
  }
}

function sendJoinRoomRequest(roomMeta, rawPwd) {
  cfReadNickInput();
  OnlineState.pendingJoinRoom = roomMeta;
  cfNet.send({ type: 'JOIN_ROOM', roomId: roomMeta.roomId, password: rawPwd || '' });
}

function leaveOnlineRoom(notifyRemote = true) {
  if (notifyRemote && OnlineState.roomId) cfNet.send({ type: 'LEAVE_ROOM' });
  cfResetRoomState();
  const pill = document.getElementById('onlineTurnPill');
  if (pill) pill.classList.add('hidden');
}

// ---------------------------------------------------------------- 局内 HUD
function syncOnlineAvatarsAndHud() {
  if (typeof window.syncChatWidgetVisibility === 'function') window.syncChatWidgetVisibility();
  if (OnlineState.isSpectator) { cfSyncSpectatorHeads(); return; }
  const pImg = document.getElementById('playerLeaderImg');
  if (pImg) pImg.src = renderLeaderPortraitDataURI(userAvatarConfig);
  const pTitle = document.getElementById('uiPlayerLeaderTitle');
  if (pTitle) pTitle.textContent = battleMode === 'pvp_online' ? (OnlineState.nickname || '我方主战者') : '我方主战者';

  const restartBtn = document.getElementById('btnRestartMatch');
  const quickDeck = document.getElementById('quickDeckSelect');
  const surrenderBtn = document.getElementById('btnPvpSurrender');
  if (battleMode === 'pvp_online') {
    if (restartBtn) restartBtn.classList.add('hidden');
    if (quickDeck) quickDeck.classList.add('hidden');
    if (surrenderBtn) surrenderBtn.classList.toggle('hidden', !OnlineState.inMatch || battle.gameOver);
    const oppAvatar = OnlineState.role === 'host' ? OnlineState.guestAvatar : OnlineState.hostAvatar;
    const oppName = OnlineState.role === 'host' ? OnlineState.guestName : OnlineState.hostName;
    const eImg = document.getElementById('enemyLeaderImg');
    if (eImg) eImg.src = renderCustomAvatarDataURI(oppAvatar || CF_DEFAULT_OPP_AVATAR);
    const eTitle = document.getElementById('uiEnemyLeaderTitle');
    if (eTitle) eTitle.textContent = `🌐 ${oppName || '联机对手'}`;
  } else {
    if (restartBtn) restartBtn.classList.remove('hidden');
    if (quickDeck) quickDeck.classList.remove('hidden');
    if (surrenderBtn) surrenderBtn.classList.add('hidden');
  }
}

function updateOnlineHudPill() {
  syncOnlineAvatarsAndHud();
}

// 服务器侧由 engineHost 覆盖为记录特效事件；浏览器侧无需记录（结算发生在服务器）
function broadcastOnlineSync() {}

function showOnlineVictoryDefeatModal(iWon, subText, isDraw = false) {
  battle.gameOver = true;
  stopTurnCountdownTimer();
  stopMulliganCountdownTimer();
  document.getElementById('mulliganModal')?.classList.add('hidden');
  document.getElementById('onlineWaitOverlay')?.classList.add('hidden');
  resetOppDisconnectMonitor();
  syncOnlineAvatarsAndHud();
  const modal = document.getElementById('victoryDefeatModal');
  if (!modal) return;
  const iconEl = document.getElementById('vicBadgeIcon');
  const titleEl = document.getElementById('vicTitleTxt');
  const subEl = document.getElementById('vicSubTxt');
  const btnAgain = document.getElementById('btnVicPlayAgain');
  const btnDeck = document.getElementById('btnVicGoDeck');
  if (iconEl) iconEl.textContent = isDraw ? '🤝' : (iWon ? '🏆' : '💀');
  if (titleEl) {
    titleEl.textContent = isDraw ? 'DRAW · 联机平局' : (iWon ? 'VICTORY · 联机胜利' : 'DEFEAT · 联机落败');
    titleEl.className = iWon ? 'text-3xl font-black tracking-widest text-amber-300' : 'text-3xl font-black tracking-widest text-rose-400';
  }
  if (btnAgain) btnAgain.classList.add('hidden');
  if (btnDeck) btnDeck.classList.add('hidden');
  if (subEl) subEl.textContent = `${subText || ''}（2秒后自动返回对战房间...）`;
  modal.classList.remove('hidden');
  modal.style.display = 'flex';
  setTimeout(() => {
    if (btnAgain) btnAgain.classList.remove('hidden');
    if (btnDeck) btnDeck.classList.remove('hidden');
    if (battleMode === 'pvp_online' && OnlineState.roomId) returnToVersusRoomAfterMatch();
  }, 2200);
}

function returnToVersusRoomAfterMatch() {
  stopTurnCountdownTimer();
  stopMulliganCountdownTimer();
  OnlineState.inMatch = false;
  OnlineState.seat = -1;
  OnlineState.myReady = false;
  OnlineState.oppReady = false;
  OnlineState.myMulliganDone = false;
  OnlineState.oppMulliganDone = false;
  document.getElementById('victoryDefeatModal')?.classList.add('hidden');
  document.getElementById('mulliganModal')?.classList.add('hidden');
  document.getElementById('onlineWaitOverlay')?.classList.add('hidden');
  cfSendPresence();
  openVersusRoomModal();
}

function initBattleUiShellForOnline() {
  // 主菜单背后可能有一局预加载的单机对战（含换牌弹窗 / AI 回合循环）：全部作废并收起
  _battleSessionSeq++;
  window.CF_SPECTATE_ACTIVE = false;
  stopTurnCountdownTimer();
  stopMulliganCountdownTimer();
  document.getElementById('mulliganModal')?.classList.add('hidden');
  document.getElementById('onlineWaitOverlay')?.classList.add('hidden');
  document.getElementById('resumePveModal')?.classList.add('hidden');
  battle.gameOver = false;
  battle.luckyCoinGranted = false;
  battle.animating = false;
  battle.inspectedCard = null;
  battle.pendingPlay = null;
  battle.pendingActivate = null;
  document.getElementById('svDetailPanel').classList.add('hidden'); document.querySelectorAll('#playerHandZone .sv-hand-card.is-inspected').forEach(el => el.classList.remove('is-inspected')); if (typeof syncDetailSelectionHighlight === 'function') syncDetailSelectionHighlight();
  document.getElementById('pendingLeftTopContainer').classList.add('hidden');
  document.getElementById('modeChoiceCenterPanel').classList.add('hidden');
  document.getElementById('handPickModal').classList.add('hidden');
  showSacrificeGuideBanner('', '');
  const vm = document.getElementById('victoryDefeatModal'); if (vm) vm.classList.add('hidden');
  const pm = document.getElementById('pvpHandoverModal'); if (pm) pm.classList.add('hidden');
  document.getElementById('svEffectFeed').innerHTML = '';
  document.getElementById('mainMenuOverlay')?.classList.add('hidden');
  syncOnlineAvatarsAndHud();
  if (typeof switchScreen === 'function') switchScreen('battle');
}

function refreshOnlineLobbyDeckUI() {
  const sel = document.getElementById('onlineLobbyDeckSelect');
  if (sel && typeof syncVersusDeckSelect === 'function') syncVersusDeckSelect(sel);
  const deckObj = PRESET_DECKS[currentDeckIndex] || PRESET_DECKS[0];
  const deckLen = expandDeck(deckObj).length;
  const prevEl = document.getElementById('onlineMyDeckPreview');
  if (prevEl) {
    const need = RULES.deckSize;
    prevEl.textContent = `${deckObj.name} (${deckLen} 张${deckLen !== need ? ` · 联机需恰好 ${need} 张` : ' · 就绪'})`;
  }
}

function openOnlineLobbyModal() {
  const modal = document.getElementById('onlineLobbyModal');
  if (!modal) return;
  const nickInput = document.getElementById('onlineNickInput');
  if (nickInput) nickInput.value = OnlineState.nickname;
  refreshOnlineLobbyDeckUI();
  modal.classList.remove('hidden');
  modal.style.display = 'flex';
  updateOnlineRoomWaitUI();
  if (!OnlineState.connected) cfNet.connect();
  else { renderOnlineRoomList(); cfNet.send({ type: 'LOBBY_REFRESH' }); }
  cfSendPresence();
}

// ---------------------------------------------------------------- 绑定大厅 DOM 事件
document.getElementById('btnNavOnlineLobby')?.addEventListener('click', () => {
  sfx.play('click');
  openOnlineLobbyModal();
});
document.getElementById('btnCloseOnlineLobby')?.addEventListener('click', () => {
  const m = document.getElementById('onlineLobbyModal');
  if (m) { m.classList.add('hidden'); m.style.display = 'none'; }
  cfSendPresence();
});
document.getElementById('onlineLobbyDeckSelect')?.addEventListener('change', (e) => {
  currentDeckIndex = parseInt(e.target.value, 10) || 0;
  if (typeof syncAllDeckSelects === 'function') syncAllDeckSelects();
  refreshOnlineLobbyDeckUI();
});
document.getElementById('btnOnlineLobbyEditDeck')?.addEventListener('click', () => {
  OnlineState.returnToLobbyAfterDeck = true;
  OnlineState.returnToVersusAfterDeck = false;
  document.getElementById('onlineLobbyModal')?.classList.add('hidden');
  document.getElementById('mainMenuOverlay')?.classList.add('hidden');
  switchScreen('deck');
  const backBtn = document.getElementById('btnTopBackMenu');
  if (backBtn) backBtn.textContent = '🌐 返回联机大厅';
});
document.getElementById('btnCloseArcadeDetail')?.addEventListener('click', () => {
  document.getElementById('arcadeRoomDetailModal')?.classList.add('hidden');
});
document.getElementById('btnArcadeJoin')?.addEventListener('click', () => {
  const r = OnlineState._selectedArcadeRoom;
  document.getElementById('arcadeRoomDetailModal')?.classList.add('hidden');
  if (r) attemptJoinRoom(r);
});
document.getElementById('btnArcadeSpectate')?.addEventListener('click', () => {
  const r = OnlineState._selectedArcadeRoom;
  if (r) startSpectatingRoom(r);
});
document.getElementById('btnExitSpectate')?.addEventListener('click', () => stopSpectatingRoom(true));
document.getElementById('btnToggleSpectatorList')?.addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('spectatorListPopover')?.classList.toggle('hidden');
  updateSpectatorHudWidget();
});
document.getElementById('btnCloseSpectatorPopover')?.addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('spectatorListPopover')?.classList.add('hidden');
});
document.getElementById('btnOnlineReconnect')?.addEventListener('click', () => { cfNet.retry = 0; cfNet.connect(); });
document.getElementById('btnRefreshLobbyRooms')?.addEventListener('click', () => cfNet.send({ type: 'LOBBY_REFRESH' }));
document.getElementById('btnCreateOnlineRoom')?.addEventListener('click', () => createOnlineRoom());
document.getElementById('btnLeaveOnlineRoom')?.addEventListener('click', () => leaveOnlineRoom(true));
document.getElementById('btnOnlineLeaveBattle')?.addEventListener('click', () => {
  showGameConfirm('确定要认输并退出当前联机对战吗？', () => {
    leaveOnlineRoom(true);
    battleMode = 'pve';
    const sel = document.getElementById('selectBattleMode');
    if (sel) sel.value = 'pve';
    renderAllBattleUI();
    if (typeof checkAndPromptSavedPveBattle === 'function') setTimeout(checkAndPromptSavedPveBattle, 200);
  }, '🏳️');
});
document.getElementById('btnCopyRoomCode')?.addEventListener('click', () => {
  if (OnlineState.roomId && navigator.clipboard) {
    navigator.clipboard.writeText(OnlineState.roomId).then(() => showGameAlert(`已复制房间号：${OnlineState.roomId}`)).catch(() => {});
  }
});
document.getElementById('btnQuickJoinRoom')?.addEventListener('click', () => {
  const code = (document.getElementById('onlineQuickRoomCode')?.value || '').trim().toUpperCase();
  if (!code) return;
  const meta = OnlineState.rooms.get(code) || { roomId: code, roomName: `房间 #${code}`, hasPassword: false };
  attemptJoinRoom(meta);
});
document.getElementById('btnCancelJoinPwd')?.addEventListener('click', () => {
  document.getElementById('onlinePwdModal').classList.add('hidden');
});
document.getElementById('btnConfirmJoinPwd')?.addEventListener('click', () => {
  const pwd = document.getElementById('onlinePwdInput')?.value || '';
  if (!OnlineState.pendingJoinRoom) return;
  document.getElementById('onlinePwdError')?.classList.add('hidden');
  sendJoinRoomRequest(OnlineState.pendingJoinRoom, pwd);
});

// 刷新页面 / 浏览器恢复标签页后：若本标签页持有会话令牌，自动重连服务器并回到原房间或对局
// （服务器会保留断线玩家的座位 AWAY_GRACE_SECONDS 秒）
if (typeof location !== 'undefined' && location.protocol !== 'file:' && !(typeof window !== 'undefined' && window.CF_SERVER_MODE) && cfNet.token()) {
  setTimeout(() => cfNet.connect(), 300);
}
