// ============================================================================
// v13 网页实时联机大厅与跨设备 PvP 对战引擎（零外部依赖：内置 MQTT-over-WSS + 自定义 WS 支持）
// ============================================================================
const ONLINE_LOBBY_PREFIX = 'cf_v13_lobby_2026';
const ONLINE_BROKERS = [
  'wss://broker.emqx.io:8084/mqtt',
  'wss://broker.hivemq.com:8884/mqtt'
];

function simpleHashStr(str) {
  let h = 2166136261 >>> 0;
  const s = String(str || '');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

class SimpleMqttWssClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.connected = false;
    this.packetId = 1;
    this.pingTimer = null;
    this.rxBuf = new Uint8Array(0);
    this.onConnect = null;
    this.onMessage = null;
    this.onClose = null;
    this.onError = null;
  }

  _encStr(str) {
    const b = new TextEncoder().encode(str);
    const out = new Uint8Array(2 + b.length);
    out[0] = (b.length >> 8) & 0xff;
    out[1] = b.length & 0xff;
    out.set(b, 2);
    return out;
  }

  _encRemLen(len) {
    const out = [];
    let x = len;
    do {
      let digit = x % 128;
      x = Math.floor(x / 128);
      if (x > 0) digit |= 0x80;
      out.push(digit);
    } while (x > 0);
    return new Uint8Array(out);
  }

  _buildPacket(headerByte, payloadParts) {
    let total = 0;
    for (const p of payloadParts) total += p.length;
    const rl = this._encRemLen(total);
    const pkt = new Uint8Array(1 + rl.length + total);
    pkt[0] = headerByte;
    pkt.set(rl, 1);
    let off = 1 + rl.length;
    for (const p of payloadParts) {
      pkt.set(p, off);
      off += p.length;
    }
    return pkt;
  }

  connect(clientId) {
    try {
      this.ws = new WebSocket(this.url, 'mqtt');
    } catch (e) {
      if (this.onError) this.onError(e);
      return;
    }
    this.ws.binaryType = 'arraybuffer';
    this.ws.onopen = () => {
      const vh = new Uint8Array([0, 4, 77, 81, 84, 84, 4, 2, 0, 30]); // MQTT 3.1.1, CleanSession, KeepAlive 30s
      const cid = this._encStr(clientId);
      this.ws.send(this._buildPacket(0x10, [vh, cid]));
    };
    this.ws.onmessage = (ev) => {
      const chunk = new Uint8Array(ev.data);
      const merged = new Uint8Array(this.rxBuf.length + chunk.length);
      merged.set(this.rxBuf, 0);
      merged.set(chunk, this.rxBuf.length);
      this.rxBuf = merged;
      this._drainPackets();
    };
    this.ws.onerror = (err) => {
      if (this.onError) this.onError(err);
    };
    this.ws.onclose = () => {
      this.connected = false;
      if (this.pingTimer) clearInterval(this.pingTimer);
      if (this.onClose) this.onClose();
    };
  }

  _drainPackets() {
    while (this.rxBuf.length >= 2) {
      let mult = 1, val = 0, idx = 1, hasMore = false;
      do {
        if (idx >= this.rxBuf.length) return;
        const b = this.rxBuf[idx++];
        val += (b & 0x7f) * mult;
        mult *= 128;
        hasMore = (b & 0x80) !== 0;
      } while (hasMore);
      const pktLen = idx + val;
      if (this.rxBuf.length < pktLen) return;
      const pkt = this.rxBuf.slice(0, pktLen);
      this.rxBuf = this.rxBuf.slice(pktLen);
      const type = (pkt[0] >> 4) & 0x0f;
      if (type === 2) {
        this.connected = true;
        if (this.pingTimer) clearInterval(this.pingTimer);
        this.pingTimer = setInterval(() => {
          if (this.ws && this.ws.readyState === 1) {
            this.ws.send(new Uint8Array([0xc0, 0x00]));
          }
        }, 22000);
        if (this.onConnect) this.onConnect();
      } else if (type === 3) {
        const qos = (pkt[0] >> 1) & 0x03;
        let p = idx;
        const tLen = (pkt[p] << 8) | pkt[p + 1];
        p += 2;
        const topic = new TextDecoder().decode(pkt.slice(p, p + tLen));
        p += tLen;
        if (qos > 0) p += 2;
        const payload = new TextDecoder().decode(pkt.slice(p));
        if (this.onMessage) this.onMessage(topic, payload);
      }
    }
  }

  subscribe(topic) {
    if (!this.ws || this.ws.readyState !== 1) return;
    const pid = this.packetId++ & 0xffff || 1;
    const pidArr = new Uint8Array([(pid >> 8) & 0xff, pid & 0xff]);
    const tArr = this._encStr(topic);
    const qos = new Uint8Array([0]);
    this.ws.send(this._buildPacket(0x82, [pidArr, tArr, qos]));
  }

  publish(topic, messageStr, retain = false) {
    if (!this.ws || this.ws.readyState !== 1) return;
    const header = retain ? 0x31 : 0x30;
    const tArr = this._encStr(topic);
    const pArr = new TextEncoder().encode(messageStr);
    this.ws.send(this._buildPacket(header, [tArr, pArr]));
  }

  close() {
    if (this.pingTimer) clearInterval(this.pingTimer);
    if (this.ws) {
      try { this.ws.close(); } catch (e) {}
    }
    this.connected = false;
  }
}

const OnlineState = {
  mode: 'cloud', // 'cloud' | 'custom'
  brokerIdx: 0,
  client: null,
  customWs: null,
  connected: false,
  peerId: 'P_' + Math.random().toString(36).slice(2, 8).toUpperCase(),
  nickname: (() => { try { return localStorage.getItem('cf_online_nick'); } catch(e) { return null; } })() || ('决斗者_' + Math.floor(100 + Math.random() * 899)),
  rooms: new Map(),
  roomId: null,
  role: null, // 'host' | 'guest'
  roomName: '',
  roomPwdHash: '',
  hostId: '',
  hostName: '',
  guestId: '',
  guestName: '',
  guestDeckIds: null,
  heartbeatTimer: null,
  pendingJoinRoom: null,
  // 对战同步状态
  inMatch: false,
  firstRole: 'host',
  activeRole: 'host',
  myMulliganDone: false,
  oppMulliganDone: false
};

function onlineIsMyTurn() {
  if (OnlineState.isSpectator) return false;
  return OnlineState.inMatch && OnlineState.activeRole === OnlineState.role;
}

function getActiveDeckIdsForOnline() {
  const deckObj = PRESET_DECKS[currentDeckIndex] || PRESET_DECKS[0];
  let ids = expandDeck(deckObj).filter(cid => Boolean(cardsById[cid]));
  if (ids.length < RULES.deckSize) {
    const fallbackIds = expandDeck(AI_DRAGON_EVO_DECK);
    while (ids.length < RULES.deckSize && fallbackIds.length > 0) {
      ids.push(fallbackIds[ids.length % fallbackIds.length]);
    }
  }
  return ids;
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

function connectOnlineNetwork() {
  if (OnlineState.client) { OnlineState.client.close(); OnlineState.client = null; }
  if (OnlineState.customWs) { try { OnlineState.customWs.close(); } catch(e){} OnlineState.customWs = null; }
  OnlineState.connected = false;

  if (OnlineState.mode === 'custom') {
    const wsUrl = (document.getElementById('onlineCustomWsInput')?.value || 'ws://localhost:8080').trim();
    setOnlineConnBadge('connecting', '🟡 连接自定义服...');
    try {
      const ws = new WebSocket(wsUrl);
      OnlineState.customWs = ws;
      ws.onopen = () => {
        OnlineState.connected = true;
        setOnlineConnBadge('ok', '🟢 已连接私服');
        ws.send(JSON.stringify({ type: 'HELLO', peerId: OnlineState.peerId, nickname: OnlineState.nickname }));
      };
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          handleCustomWsMessage(msg);
        } catch (e) {}
      };
      ws.onerror = () => setOnlineConnBadge('err', '🔴 私服连接失败');
      ws.onclose = () => {
        OnlineState.connected = false;
        setOnlineConnBadge('err', '🔴 连接已断开');
      };
    } catch (e) {
      setOnlineConnBadge('err', '🔴 地址无效');
    }
    return;
  }

  const brokerUrl = ONLINE_BROKERS[OnlineState.brokerIdx % ONLINE_BROKERS.length];
  setOnlineConnBadge('connecting', '🟡 连接云端大厅...');
  const client = new SimpleMqttWssClient(brokerUrl);
  OnlineState.client = client;
  client.onConnect = () => {
    OnlineState.connected = true;
    setOnlineConnBadge('ok', '🟢 已连接云端大厅');
    client.subscribe(`${ONLINE_LOBBY_PREFIX}/rooms/+`);
    client.subscribe(`${ONLINE_LOBBY_PREFIX}/room/+/+`);
    client.subscribe(`${ONLINE_LOBBY_PREFIX}/players/+`);
    client.subscribe(`${ONLINE_LOBBY_PREFIX}/invite/${OnlineState.peerId}`);
    if (OnlineState.roomId) {
      const subCh = OnlineState.role === 'host' ? 'c2h' : 'h2c';
      client.subscribe(`${ONLINE_LOBBY_PREFIX}/room/${OnlineState.roomId}/${subCh}`);
      client.subscribe(`${ONLINE_LOBBY_PREFIX}/room/${OnlineState.roomId}/spectate_ctrl`);
    }
    if (OnlineState.isSpectator && OnlineState.spectatingRoomId) {
      client.subscribe(`${ONLINE_LOBBY_PREFIX}/room/${OnlineState.spectatingRoomId}/spectate`);
    }
    publishOnlinePresence(false);
    if (OnlineState.inMatch && OnlineState.roomId) { sendRoomPacket({ type: 'PLAYER_BACK', who: OnlineState.nickname }); sendRoomPacket({ type: 'SYNC_REQ' }); }
    if (OnlineState._presenceTimer) clearInterval(OnlineState._presenceTimer);
    OnlineState._presenceTimer = setInterval(() => publishOnlinePresence(false), 4000);
    renderOnlineRoomList();
    renderOnlinePlayerList();
  };
  client.onMessage = (topic, payload) => {
    if (topic.startsWith(`${ONLINE_LOBBY_PREFIX}/players/`)) {
      const pid = topic.split('/').pop();
      if (!payload) OnlineState.onlinePlayers.delete(pid);
      else { try { OnlineState.onlinePlayers.set(pid, JSON.parse(payload)); } catch (e) {} }
      renderOnlinePlayerList();
      return;
    }
    if (topic === `${ONLINE_LOBBY_PREFIX}/invite/${OnlineState.peerId}`) {
      try {
        const inv = JSON.parse(payload);
        if (inv && inv.type === 'INVITE_REQ') showBattleInviteToast(inv);
      } catch (e) {}
      return;
    }
    if (topic.startsWith(`${ONLINE_LOBBY_PREFIX}/rooms/`)) {
      const rid = topic.split('/').pop();
      if (!payload) {
        OnlineState.rooms.delete(rid);
      } else {
        try {
          const info = JSON.parse(payload);
          OnlineState.rooms.set(rid, info);
        } catch (e) {}
      }
      renderOnlineRoomList();
      return;
    }
    if (OnlineState.isSpectator && OnlineState.spectatingRoomId && topic === `${ONLINE_LOBBY_PREFIX}/room/${OnlineState.spectatingRoomId}/spectate`) {
      try {
        const pkt = JSON.parse(payload);
        if (typeof handleSpectatePacket === 'function') handleSpectatePacket(pkt);
      } catch (e) {}
      return;
    }
    if (OnlineState.roomId && topic === `${ONLINE_LOBBY_PREFIX}/room/${OnlineState.roomId}/spectate_ctrl`) {
      try {
        const pkt = JSON.parse(payload);
        if (typeof handleSpectateCtrlPacket === 'function') handleSpectateCtrlPacket(pkt);
      } catch (e) {}
      return;
    }
    if (OnlineState.roomId && topic.startsWith(`${ONLINE_LOBBY_PREFIX}/room/${OnlineState.roomId}/`)) {
      try {
        const pkt = JSON.parse(payload);
        handleRoomPacket(pkt);
      } catch (e) {}
    }
  };
  client.onError = () => {
    if (!OnlineState.connected && OnlineState.brokerIdx < ONLINE_BROKERS.length - 1) {
      OnlineState.brokerIdx += 1;
      connectOnlineNetwork();
    } else {
      setOnlineConnBadge('err', '🔴 云端连接异常');
    }
  };
  client.onClose = () => {
    OnlineState.connected = false;
    setOnlineConnBadge('err', '🔴 已断开，重连中...');
    if (OnlineState.inMatch || OnlineState.roomId) {
      setTimeout(() => {
        if (!OnlineState.connected && OnlineState.mode === 'cloud') connectOnlineNetwork();
      }, 1500);
    }
  };
  client.connect('cf_' + OnlineState.peerId + '_' + Math.floor(Math.random() * 9999));
}

function sendRoomPacket(pkt) {
  if (!OnlineState.roomId) return;
  const msg = { ...pkt, senderId: OnlineState.peerId, ts: Date.now() };
  if (OnlineState.mode === 'custom' && OnlineState.customWs && OnlineState.customWs.readyState === 1) {
    OnlineState.customWs.send(JSON.stringify({ type: 'ROOM_MSG', roomId: OnlineState.roomId, payload: msg }));
  } else if (OnlineState.client && OnlineState.connected) {
    const ch = OnlineState.role === 'host' ? 'h2c' : 'c2h';
    OnlineState.client.publish(`${ONLINE_LOBBY_PREFIX}/room/${OnlineState.roomId}/${ch}`, JSON.stringify(msg), false);
  }
}

function publishLobbyRoomMeta(clear = false) {
  if (!OnlineState.roomId || OnlineState.role !== 'host') return;
  const _specArr = OnlineState.spectators ? Array.from(OnlineState.spectators.values()).filter(s => (Date.now() - (s.ts || 0)) < 14000).map(s => ({ id: s.id, name: s.name, avatar: s.avatar })) : [];
  const meta = clear ? '' : JSON.stringify({
    roomId: OnlineState.roomId,
    roomName: OnlineState.roomName,
    hostId: OnlineState.peerId,
    hostName: OnlineState.nickname,
    hostAvatar: userAvatarConfig,
    guestId: OnlineState.guestId || '',
    guestName: OnlineState.guestName || '',
    guestAvatar: OnlineState.guestAvatar || null,
    hasPassword: Boolean(OnlineState.roomPwdHash),
    playerCount: OnlineState.guestId ? 2 : 1,
    status: OnlineState.inMatch ? 'playing' : 'waiting',
    turn: (OnlineState.inMatch && typeof battle !== 'undefined' && battle) ? (battle.turn || 1) : 0,
    hostHp: (OnlineState.inMatch && typeof battle !== 'undefined' && battle.leaders && battle.leaders[0]) ? battle.leaders[0].hp : 30,
    guestHp: (OnlineState.inMatch && typeof battle !== 'undefined' && battle.leaders && battle.leaders[1]) ? battle.leaders[1].hp : 30,
    spectators: _specArr,
    ts: Date.now()
  });
  if (OnlineState.mode === 'custom' && OnlineState.customWs && OnlineState.customWs.readyState === 1) {
    OnlineState.customWs.send(JSON.stringify({ type: clear ? 'DEL_ROOM' : 'UPSERT_ROOM', roomId: OnlineState.roomId, meta: clear ? null : JSON.parse(meta) }));
  } else if (OnlineState.client && OnlineState.connected) {
    OnlineState.client.publish(`${ONLINE_LOBBY_PREFIX}/rooms/${OnlineState.roomId}`, meta, true);
  }
}

function handleCustomWsMessage(msg) {
  if (msg.type === 'ROOM_LIST') {
    OnlineState.rooms.clear();
    (msg.rooms || []).forEach(r => OnlineState.rooms.set(r.roomId, r));
    renderOnlineRoomList();
  } else if (msg.type === 'ROOM_MSG' && msg.payload) {
    handleRoomPacket(msg.payload);
  }
}

OnlineState.spectators = new Map();
OnlineState.isSpectator = false;
OnlineState.spectatingRoomId = null;
OnlineState.spectatingRoomMeta = null;
OnlineState._selectedArcadeRoom = null;
OnlineState._spectatePingTimer = null;

function renderOnlineRoomList() {
  const listEl = document.getElementById('onlineRoomList');
  const cntEl = document.getElementById('onlineRoomCountText');
  if (!listEl) return;
  const now = Date.now();
  const validRooms = [];
  for (const [rid, info] of OnlineState.rooms.entries()) {
    if (!info || !info.roomId) continue;
    if (now - (info.ts || 0) > 16000) continue;
    validRooms.push(info);
  }
  validRooms.sort((a, b) => (b.ts || 0) - (a.ts || 0));
  if (cntEl) cntEl.textContent = `(${validRooms.length} 台街机活跃中)`;

  if (validRooms.length === 0) {
    listEl.className = 'space-y-2 pr-1';
    listEl.innerHTML = `<div class="text-center text-slate-500 text-xs py-12">${OnlineState.connected ? '🕹️ 当前暂无街机对战房间，快在右侧创建一间吧！' : '正在连接联机大厅...'}</div>`;
    return;
  }

  listEl.className = 'arcade-room-grid pr-1';
  listEl.innerHTML = '';
  const defaultAv = { backdrop: 'cyber', hairStyle: 'short', hairColor: 'silver', eyeStyle: 'visor', outfit: 'mech', headgear: 'none' };
  validRooms.forEach(r => {
    const isPlaying = r.status === 'playing';
    const hasGuest = Boolean(r.guestId || (r.playerCount || 1) >= 2);
    const hostAvUri = renderCustomAvatarDataURI(r.hostAvatar || defaultAv);
    const guestAvUri = hasGuest ? renderCustomAvatarDataURI(r.guestAvatar || { backdrop: 'flame', hairStyle: 'long', hairColor: 'gold', eyeStyle: 'crimson', outfit: 'paladin', headgear: 'crown' }) : '';
    const specs = Array.isArray(r.spectators) ? r.spectators : [];
    const maxInlineSpecs = 9;
    const shownSpecs = specs.slice(0, maxInlineSpecs);
    const extraSpecCnt = Math.max(0, specs.length - maxInlineSpecs);

    const card = document.createElement('div');
    card.className = `arcade-cabinet ${isPlaying ? 'is-playing' : 'is-waiting'}`;
    card.innerHTML = `
      <div class="arcade-marquee">
        <div class="flex items-center gap-1.5 min-w-0">
          <span class="text-xs">${r.hasPassword ? '🔒' : '🕹️'}</span>
          <span class="text-xs font-black text-white truncate">${escapeHtml(r.roomName || ('街机房 ' + r.roomId))}</span>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <span class="px-1.5 py-0.5 rounded text-[10px] font-black ${isPlaying ? 'bg-rose-500/25 text-rose-300 border border-rose-500/50' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}">${isPlaying ? `⚔️ R${r.turn || 1}` : '⏳ 准备中'}</span>
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
        ${specs.length === 0
          ? `<span class="text-[10px] text-slate-500 font-bold">👁️ 暂无观战 · 点击机台看详情</span>`
          : shownSpecs.map(sp => `<img src="${renderCustomAvatarDataURI(sp.avatar || defaultAv)}" class="arcade-spectator-chip" title="${escapeHtml(sp.name || '观战者')}"/>`).join('')
            + (extraSpecCnt > 0 ? `<span class="text-[10px] font-black text-cyan-300 ml-1">+${extraSpecCnt}</span>` : `<span class="text-[10px] text-cyan-300 font-bold ml-auto">${specs.length}人观战</span>`)
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
      joinDirectBtn.onclick = (e) => {
        e.stopPropagation();
        attemptJoinRoom(r);
      };
    }
    const specDirectBtn = card.querySelector('.arcade-btn-spec');
    if (specDirectBtn) {
      specDirectBtn.onclick = (e) => {
        e.stopPropagation();
        startSpectatingRoom(r);
      };
    }
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
  document.getElementById('ardSpecCount').textContent = `👁️ ${specs.length} 人观战`;
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
  OnlineState._specToastTimer = setTimeout(() => {
    el.classList.add('hidden');
  }, 3600);
}

function updateSpectatorHudWidget() {
  const widget = document.getElementById('spectatorHudWidget');
  const cntEl = document.getElementById('spectatorHudCount');
  const itemsEl = document.getElementById('spectatorListItems');
  if (!widget || !cntEl || !itemsEl) return;
  const now = Date.now();
  const activeSpecs = [];
  if (OnlineState.spectators) {
    for (const [sid, s] of OnlineState.spectators.entries()) {
      if (!s || (now - (s.ts || 0)) > 14000) {
        OnlineState.spectators.delete(sid);
        continue;
      }
      activeSpecs.push(s);
    }
  }
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

function broadcastSpectateSnapshot(snapArg = null) {
  if (!OnlineState.connected || OnlineState.mode !== 'cloud' || !OnlineState.client || !OnlineState.roomId || !OnlineState.inMatch) return;
  if (!OnlineState.spectators || OnlineState.spectators.size === 0) return;
  const rawSnap = snapArg || serializeBattleSnapshot();
  // 统一以房主为视角0、挑战者为视角1发送给观战者
  const normalizedSnap = OnlineState.role === 'host'
    ? rawSnap
    : {
        ...rawSnap,
        leaders: [rawSnap.leaders[1], rawSnap.leaders[0]],
        board: [rawSnap.board[1], rawSnap.board[0]],
        turnLogs: (rawSnap.turnLogs || []).map(g => ({ turn: g.turn, side: 1 - g.side, events: [...(g.events || [])] }))
      };
  OnlineState.client.publish(`${ONLINE_LOBBY_PREFIX}/room/${OnlineState.roomId}/spectate`, JSON.stringify({
    type: 'SPECTATE_SNAP',
    hostName: OnlineState.hostName,
    hostAvatar: OnlineState.role === 'host' ? userAvatarConfig : OnlineState.hostAvatar,
    guestName: OnlineState.guestName,
    guestAvatar: OnlineState.role === 'guest' ? userAvatarConfig : OnlineState.guestAvatar,
    spectators: Array.from(OnlineState.spectators.values()).map(s => ({ id: s.id, name: s.name, avatar: s.avatar, ts: s.ts })),
    snap: normalizedSnap,
    ts: Date.now()
  }), false);
}

function handleSpectateCtrlPacket(pkt) {
  if (!pkt || !pkt.spectator || !pkt.spectator.id) return;
  const sp = pkt.spectator;
  if (pkt.type === 'SPECTATE_LEAVE') {
    OnlineState.spectators.delete(sp.id);
    updateSpectatorHudWidget();
    if (OnlineState.role === 'host') publishLobbyRoomMeta(false);
    return;
  }
  const isNew = !OnlineState.spectators.has(sp.id);
  OnlineState.spectators.set(sp.id, { ...sp, ts: Date.now() });
  updateSpectatorHudWidget();
  if (isNew && pkt.type === 'SPECTATE_JOIN') {
    showSpectatorJoinNotice(sp.name);
    if (OnlineState.role === 'host') {
      publishLobbyRoomMeta(false);
      if (OnlineState.inMatch) broadcastSpectateSnapshot();
    }
  }
}

function handleSpectatePacket(pkt) {
  if (!OnlineState.isSpectator || !pkt || pkt.type !== 'SPECTATE_SNAP' || !pkt.snap) return;
  const snap = pkt.snap;
  if (Array.isArray(pkt.spectators)) {
    OnlineState.spectators.clear();
    pkt.spectators.forEach(s => { if (s && s.id) OnlineState.spectators.set(s.id, { ...s, ts: Date.now() }); });
  }
  OnlineState.spectators.set(OnlineState.peerId, { id: OnlineState.peerId, name: OnlineState.nickname, avatar: userAvatarConfig, ts: Date.now() });
  battle.turn = snap.turn || 1;
  OnlineState.firstRole = snap.firstRole || 'host';
  OnlineState.activeRole = snap.activeRole || 'host';
  battle.firstPlayerSide = OnlineState.firstRole === 'host' ? 0 : 1;
  battle.activeSide = OnlineState.activeRole === 'host' ? 0 : 1;
  battle.gameOver = Boolean(snap.gameOver);
  if (Array.isArray(snap.turnLogs)) battle.turnLogs = snap.turnLogs;
  battle.leaders[0] = deserializeLeaderFromRemote(snap.leaders[0], 0);
  battle.leaders[1] = deserializeLeaderFromRemote(snap.leaders[1], 1);
  battle.board[0] = (snap.board[0] || []).map(c => deserializeCardInst(c, 0));
  battle.board[1] = (snap.board[1] || []).map(c => deserializeCardInst(c, 1));

  const pImg = document.getElementById('playerLeaderImg');
  if (pImg && pkt.hostAvatar) pImg.src = renderLeaderPortraitDataURI(pkt.hostAvatar);
  const eImg = document.getElementById('enemyLeaderImg');
  if (eImg && pkt.guestAvatar) eImg.src = renderLeaderPortraitDataURI(pkt.guestAvatar);
  const pTitle = document.getElementById('uiPlayerLeaderTitle');
  if (pTitle) pTitle.textContent = `👁️ ${pkt.hostName || '1P 房主'}`;
  const eTitle = document.getElementById('uiEnemyLeaderTitle');
  if (eTitle) eTitle.textContent = `👁️ ${pkt.guestName || '2P 挑战者'}`;
  const bannerTxt = document.getElementById('spectatorBannerText');
  if (bannerTxt) bannerTxt.textContent = `${pkt.hostName || '1P'} VS ${pkt.guestName || '2P'} · 第 ${battle.turn} 回合`;
  renderAllBattleUI();
  updateSpectatorHudWidget();
  if (typeof renderBattleRecordPanel === 'function') renderBattleRecordPanel();
}

function startSpectatingRoom(roomMeta) {
  if (!roomMeta || !roomMeta.roomId) return;
  if (!OnlineState.connected || OnlineState.mode !== 'cloud' || !OnlineState.client) {
    showGameAlert('观战功能当前需要连接公共云端大厅！');
    return;
  }
  document.getElementById('arcadeRoomDetailModal')?.classList.add('hidden');
  document.getElementById('onlineLobbyModal')?.classList.add('hidden');
  document.getElementById('mainMenuOverlay')?.classList.add('hidden');
  if (typeof window.enterBattleFullscreenLandscape === 'function') window.enterBattleFullscreenLandscape();

  OnlineState.isSpectator = true;
  OnlineState.spectatingRoomId = roomMeta.roomId;
  OnlineState.spectatingRoomMeta = roomMeta;
  OnlineState.inMatch = false;
  battleMode = 'pvp_online';

  initBattleUiShellForOnline();
  battle.turn = roomMeta.turn || 1;
  battle.board = [[null, null, null, null, null], [null, null, null, null, null]];
  battle.leaders[0] = createLeaderState(0, []);
  battle.leaders[1] = createLeaderState(1, []);
  battle.turnLogs = [];

  document.getElementById('spectatorModeBanner')?.classList.remove('hidden');
  const bannerTxt = document.getElementById('spectatorBannerText');
  if (bannerTxt) bannerTxt.textContent = `${roomMeta.hostName || '1P'} VS ${roomMeta.guestName || '2P'} · 正在同步画面...`;
  const btnOrb = document.getElementById('btnTurnOrb');
  if (btnOrb) btnOrb.classList.add('opacity-50', 'pointer-events-none');

  const rid = roomMeta.roomId;
  OnlineState.client.subscribe(`${ONLINE_LOBBY_PREFIX}/room/${rid}/spectate`);
  const sendSpec = (type) => {
    if (!OnlineState.client || !OnlineState.connected) return;
    OnlineState.client.publish(`${ONLINE_LOBBY_PREFIX}/room/${rid}/spectate_ctrl`, JSON.stringify({
      type,
      spectator: { id: OnlineState.peerId, name: OnlineState.nickname, avatar: userAvatarConfig },
      ts: Date.now()
    }), false);
  };
  sendSpec('SPECTATE_JOIN');
  if (OnlineState._spectatePingTimer) clearInterval(OnlineState._spectatePingTimer);
  OnlineState._spectatePingTimer = setInterval(() => {
    if (!OnlineState.isSpectator || !OnlineState.spectatingRoomId) return;
    sendSpec('SPECTATE_PING');
  }, 4000);
  updateSpectatorHudWidget();
  publishOnlinePresence(false);
}

function stopSpectatingRoom() {
  if (OnlineState._spectatePingTimer) { clearInterval(OnlineState._spectatePingTimer); OnlineState._spectatePingTimer = null; }
  if (OnlineState.client && OnlineState.connected && OnlineState.spectatingRoomId) {
    OnlineState.client.publish(`${ONLINE_LOBBY_PREFIX}/room/${OnlineState.spectatingRoomId}/spectate_ctrl`, JSON.stringify({
      type: 'SPECTATE_LEAVE',
      spectator: { id: OnlineState.peerId, name: OnlineState.nickname },
      ts: Date.now()
    }), false);
  }
  OnlineState.isSpectator = false;
  OnlineState.spectatingRoomId = null;
  OnlineState.spectatingRoomMeta = null;
  OnlineState.spectators.clear();
  battleMode = 'pve';
  document.getElementById('spectatorModeBanner')?.classList.add('hidden');
  document.getElementById('spectatorHudWidget')?.classList.add('hidden');
  const btnOrb = document.getElementById('btnTurnOrb');
  if (btnOrb) btnOrb.classList.remove('opacity-50', 'pointer-events-none');
  document.getElementById('mainMenuOverlay')?.classList.remove('hidden');
  if (typeof startMainMenuBgAnim === 'function') startMainMenuBgAnim();
  openOnlineLobbyModal();
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
  document.getElementById('waitRoomLockTag').textContent = OnlineState.roomPwdHash ? '🔒 密码保护' : '🔓 公开房间';
  document.getElementById('waitHostName').textContent = OnlineState.hostName || '--';

  const gNameEl = document.getElementById('waitGuestName');
  const gStatEl = document.getElementById('waitGuestStatus');
  const startBtn = document.getElementById('btnStartOnlineMatch');
  const hintEl = document.getElementById('waitHintText');

  if (OnlineState.guestId) {
    gNameEl.textContent = OnlineState.guestName || '挑战者';
    gNameEl.className = 'text-xs font-black text-white mt-0.5';
    gStatEl.textContent = '已加入';
    gStatEl.className = 'px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
    if (OnlineState.role === 'host') {
      startBtn.classList.remove('hidden');
      hintEl.textContent = '🎉 对手已进入房间！点击下方「开始联机对战」立即开战。';
    } else {
      startBtn.classList.add('hidden');
      hintEl.textContent = '✅ 已成功加入房间，正在等待房主点击「开始联机对战」...';
    }
  } else {
    gNameEl.textContent = '等待对手加入...';
    gNameEl.className = 'text-xs font-black text-slate-400 mt-0.5';
    gStatEl.textContent = '空位';
    gStatEl.className = 'px-2 py-0.5 rounded-full text-[11px] font-black bg-slate-800 text-slate-400 border border-slate-600';
    startBtn.classList.add('hidden');
    hintEl.textContent = '请将房间号（和密码）分享给好友，或等待大厅玩家加入...';
  }
}

function createOnlineRoom() {
  if (!OnlineState.connected) {
    connectOnlineNetwork();
  }
  const nick = (document.getElementById('onlineNickInput')?.value || '').trim() || OnlineState.nickname;
  OnlineState.nickname = nick;
  try { localStorage.setItem('cf_online_nick', nick); } catch(e) {}

  const rName = (document.getElementById('createRoomNameInput')?.value || '').trim() || `${nick}的对战房`;
  const pwd = (document.getElementById('createRoomPwdInput')?.value || '').trim();
  const rid = Math.random().toString(36).slice(2, 8).toUpperCase();

  OnlineState.roomId = rid;
  OnlineState.role = 'host';
  OnlineState.roomName = rName;
  OnlineState.roomPwdHash = pwd ? simpleHashStr(pwd) : '';
  OnlineState.hostId = OnlineState.peerId;
  OnlineState.hostName = nick;
  OnlineState.guestId = '';
  OnlineState.guestName = '';
  OnlineState.guestDeckIds = null;
  OnlineState.inMatch = false;

  if (OnlineState.mode === 'cloud' && OnlineState.client) {
    OnlineState.client.subscribe(`${ONLINE_LOBBY_PREFIX}/room/${rid}/c2h`);
    OnlineState.client.subscribe(`${ONLINE_LOBBY_PREFIX}/room/${rid}/spectate_ctrl`);
  }
  if (OnlineState.spectators) OnlineState.spectators.clear(); else if (OnlineState.mode === 'custom' && OnlineState.customWs) {
    OnlineState.customWs.send(JSON.stringify({ type: 'JOIN_CHANNEL', roomId: rid }));
  }

  publishLobbyRoomMeta(false);
  if (OnlineState.heartbeatTimer) clearInterval(OnlineState.heartbeatTimer);
  OnlineState.heartbeatTimer = setInterval(() => publishLobbyRoomMeta(false), 4000);
  OnlineState.myReady = false;
  OnlineState.oppReady = false;
  OnlineState.oppEditingDeck = false;
  OnlineState.hostWins = 0;
  OnlineState.guestWins = 0;
  OnlineState.lastVrOppPing = Date.now();
  openVersusRoomModal();
  updateOnlineRoomWaitUI();
  renderOnlineRoomList();
}

function attemptJoinRoom(roomMeta) {
  if (!OnlineState.connected) {
    showGameAlert('联机大厅尚未连接，请稍候再试！');
    return;
  }
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
  const nick = (document.getElementById('onlineNickInput')?.value || '').trim() || OnlineState.nickname;
  OnlineState.nickname = nick;
  try { localStorage.setItem('cf_online_nick', nick); } catch(e) {}

  OnlineState.roomId = roomMeta.roomId;
  OnlineState.role = 'guest';
  OnlineState.roomName = roomMeta.roomName;
  OnlineState.roomPwdHash = roomMeta.hasPassword ? simpleHashStr(rawPwd) : '';
  OnlineState.hostId = roomMeta.hostId || '';
  OnlineState.hostName = roomMeta.hostName || '房主';
  OnlineState.guestId = '';
  OnlineState.guestName = '';
  OnlineState.inMatch = false;

  if (OnlineState.mode === 'cloud' && OnlineState.client) {
    OnlineState.client.subscribe(`${ONLINE_LOBBY_PREFIX}/room/${roomMeta.roomId}/h2c`);
    OnlineState.client.subscribe(`${ONLINE_LOBBY_PREFIX}/room/${roomMeta.roomId}/spectate_ctrl`);
  }
  if (OnlineState.spectators) OnlineState.spectators.clear(); else if (OnlineState.mode === 'custom' && OnlineState.customWs) {
    OnlineState.customWs.send(JSON.stringify({ type: 'JOIN_CHANNEL', roomId: roomMeta.roomId }));
  }

  OnlineState.joinAccepted = false;
  OnlineState.hostWins = 0;
  OnlineState.guestWins = 0;
  OnlineState.lastVrOppPing = Date.now();
  OnlineState.guestAvatar = null;
  OnlineState.hostAvatar = null;
  let retries = 0;
  const trySendJoin = () => {
    if (OnlineState.joinAccepted || OnlineState.roomId !== roomMeta.roomId || retries >= 6) return;
    retries++;
    sendRoomPacket({
      type: 'JOIN_REQ',
      guestId: OnlineState.peerId,
      guestName: nick,
      pwdHash: rawPwd ? simpleHashStr(rawPwd) : '',
      deckIds: getActiveDeckIdsForOnline(),
      avatar: userAvatarConfig
    });
    setTimeout(trySendJoin, 1100);
  };
  setTimeout(trySendJoin, 350);
}

function leaveOnlineRoom(notifyRemote = true) {
  if (notifyRemote && OnlineState.roomId) {
    sendRoomPacket({ type: 'LEAVE_ROOM', who: OnlineState.nickname });
  }
  if (OnlineState.role === 'host') {
    publishLobbyRoomMeta(true);
  }
  if (OnlineState.heartbeatTimer) { clearInterval(OnlineState.heartbeatTimer); OnlineState.heartbeatTimer = null; }
  OnlineState.roomId = null;
  OnlineState.role = null;
  OnlineState.guestId = '';
  OnlineState.guestName = '';
  OnlineState.inMatch = false;
  OnlineState.myMulliganDone = false;
  OnlineState.oppMulliganDone = false;
  const pill = document.getElementById('onlineTurnPill');
  if (pill) pill.classList.add('hidden');
  const waitOv = document.getElementById('onlineWaitOverlay');
  if (waitOv) waitOv.classList.add('hidden');
  OnlineState.myReady = false;
  OnlineState.oppReady = false;
  updateOnlineRoomWaitUI();
  renderOnlineRoomList();
}

// ============================================================================
// 联机战局快照序列化与双端镜像还原
// ============================================================================
function serializeCardInst(inst) {
  if (!inst) return null;
  if (!inst.data && inst.id) return inst.id;
  const d = inst.data;
  if (!d) return null;
  const initCd = getInitialCountdown(d);
  const curCd = inst.countdown !== undefined ? inst.countdown : null;
  const kwKeys = Object.keys(inst.activeKw || {});
  const isDefault = (
    inst.currentAtk === (d.atk || 0) &&
    inst.currentHp === (d.hp || 1) &&
    inst.maxHp === (d.hp || 1) &&
    curCd === (initCd > 0 ? initCd : null) &&
    !inst.fusedCount &&
    !inst.costReduction &&
    !(inst.grantedEffects && inst.grantedEffects.length) &&
    !(inst.extraLastWords && inst.extraLastWords.length) &&
    !inst.grantedOnAttackAoe4 &&
    !inst.grantedOnAttackThreeSide3 &&
    !inst.tempTurnAtkBonus &&
    !inst.activatedThisTurn &&
    !inst.attackedThisTurn
  );
  if (isDefault) return [inst.uid, d.id];
  return {
    u: inst.uid,
    c: d.id,
    a: inst.currentAtk,
    m: inst.maxHp,
    h: inst.currentHp,
    cd: curCd,
    kw: kwKeys.length ? inst.activeKw : undefined,
    fc: inst.fusedCount || 0,
    cr: inst.costReduction || 0,
    ge: (inst.grantedEffects && inst.grantedEffects.length) ? inst.grantedEffects : undefined,
    lw: (inst.extraLastWords && inst.extraLastWords.length) ? inst.extraLastWords : undefined,
    aoe: inst.grantedOnAttackAoe4 ? 1 : 0,
    ts3: inst.grantedOnAttackThreeSide3 ? 1 : 0,
    ttb: inst.tempTurnAtkBonus || 0,
    sd: inst.shiftDir || 1,
    act: inst.activatedThisTurn ? 1 : 0,
    atk: inst.attackedThisTurn ? 1 : 0,
    ft: inst.fusedThisTurn ? 1 : 0,
    eo: inst.enterOrder || 0
  };
}

function deserializeCardInst(raw, forcedOwner) {
  if (!raw) return null;
  if (typeof raw === 'string') {
    return createCardInstance(raw, forcedOwner);
  }
  if (Array.isArray(raw)) {
    const inst = createCardInstance(raw[1], forcedOwner);
    if (inst && raw[0]) inst.uid = raw[0];
    return inst;
  }
  const cid = raw.c || raw.cid;
  const inst = createCardInstance(cid, forcedOwner !== undefined ? forcedOwner : raw.owner);
  if (!inst) return null;
  inst.uid = raw.u || raw.uid || inst.uid;
  inst.currentAtk = raw.a !== undefined ? raw.a : raw.currentAtk;
  inst.maxHp = raw.m !== undefined ? raw.m : raw.maxHp;
  inst.currentHp = raw.h !== undefined ? raw.h : raw.currentHp;
  inst.countdown = raw.cd !== undefined ? raw.cd : raw.countdown;
  if (raw.kw || raw.activeKw) inst.activeKw = { ...(raw.kw || raw.activeKw) };
  inst.fusedCount = raw.fc || raw.fusedCount || 0;
  inst.costReduction = raw.cr || raw.costReduction || 0;
  inst.grantedEffects = [...(raw.ge || raw.grantedEffects || [])];
  inst.extraLastWords = [...(raw.lw || raw.extraLastWords || [])];
  inst.grantedOnAttackAoe4 = Boolean(raw.aoe || raw.grantedOnAttackAoe4);
  inst.grantedOnAttackThreeSide3 = Boolean(raw.ts3 || raw.grantedOnAttackThreeSide3);
  inst.tempTurnAtkBonus = raw.ttb || raw.tempTurnAtkBonus || 0;
  inst.shiftDir = raw.sd || raw.shiftDir || 1;
  inst.activatedThisTurn = Boolean(raw.act || raw.activatedThisTurn);
  inst.attackedThisTurn = Boolean(raw.atk || raw.attackedThisTurn);
  inst.fusedThisTurn = Boolean(raw.ft || raw.fusedThisTurn);
  inst.enterOrder = raw.eo || raw.enterOrder || 0;
  return inst;
}

function serializeLeaderForRemote(st) {
  return {
    hp: st.hp, maxHp: st.maxHp,
    energy: st.energy, maxEnergy: st.maxEnergy,
    bones: st.bones,
    deck: (st.deck || []).map(serializeCardInst),
    hand: (st.hand || []).map(serializeCardInst),
    graveyard: (st.graveyard || []).map(c => (c && c.data) ? c.data.id : (c && c.id ? c.id : c)).filter(Boolean),
    crests: (st.crests || []).map(cr => ({
      id: cr.id,
      name: cr.name,
      countdown: cr.countdown,
      desc: cr.desc,
      cid: cr.cardData ? cr.cardData.id : null
    })),
    playedCardsLog: (st.playedCardsLog || []).map(d => d && d.id ? d.id : d).filter(Boolean),
    destroyedLastWordsCount: st.destroyedLastWordsCount || 0,
    destroyedGuardCount: st.destroyedGuardCount || 0,
    playedValues1to8: Object.assign({}, st.playedValues1to8 || {}),
    energySpentTotal: st.energySpentTotal || 0,
    fatigueCount: st.fatigueCount || 0,
    selfTurnDamageCount: st.selfTurnDamageCount || 0,
    totalSelfTurnDamageCount: st.totalSelfTurnDamageCount || 0,
    prevSelfTurnDamageCount: st.prevSelfTurnDamageCount || 0,
    delayedSelfDmgDraws: st.delayedSelfDmgDraws || 0,
    delayedSelfDmgBats: st.delayedSelfDmgBats || 0,
    delayedLastWordsDraws: st.delayedLastWordsDraws || 0,
    cardsPlayedThisTurn: st.cardsPlayedThisTurn || 0,
    nextMechDiscount: st.nextMechDiscount || 0,
    delayedMechDraws: st.delayedMechDraws || 0,
    werewolfPlayedCount: st.werewolfPlayedCount || 0
  };
}

function deserializeLeaderFromRemote(raw, forcedOwner) {
  return {
    hp: raw.hp, maxHp: raw.maxHp,
    energy: raw.energy, maxEnergy: raw.maxEnergy,
    bones: raw.bones,
    deck: (raw.deck || []).map(c => deserializeCardInst(c, forcedOwner)).filter(Boolean),
    hand: (raw.hand || []).map(c => deserializeCardInst(c, forcedOwner)).filter(Boolean),
    graveyard: (raw.graveyard || []).map(cid => typeof cid === 'string' ? cardsById[cid] : (cid && cid.c ? cardsById[cid.c] : cardsById[cid?.cid])).filter(Boolean),
    crests: (raw.crests || []).map(cr => ({
      id: cr.id,
      name: cr.name,
      countdown: cr.countdown,
      desc: cr.desc,
      cardData: cr.cid ? cardsById[cr.cid] : (cr.cardData || { id: 'sys_notice', name: '战局提示', type: 'spell', rarity: '传说', energy: 0, bones: 0, sacrifice: 0 })
    })),
    playedCardsLog: (raw.playedCardsLog || []).map(cid => cardsById[cid]).filter(Boolean),
    destroyedLastWordsCount: raw.destroyedLastWordsCount || 0,
    destroyedGuardCount: raw.destroyedGuardCount || 0,
    playedValues1to8: Object.assign({}, raw.playedValues1to8 || {}),
    energySpentTotal: raw.energySpentTotal || 0,
    fatigueCount: raw.fatigueCount || 0,
    selfTurnDamageCount: raw.selfTurnDamageCount || 0,
    totalSelfTurnDamageCount: raw.totalSelfTurnDamageCount || 0,
    prevSelfTurnDamageCount: raw.prevSelfTurnDamageCount || 0,
    delayedSelfDmgDraws: raw.delayedSelfDmgDraws || 0,
    delayedSelfDmgBats: raw.delayedSelfDmgBats || 0,
    delayedLastWordsDraws: raw.delayedLastWordsDraws || 0,
    cardsPlayedThisTurn: raw.cardsPlayedThisTurn || 0,
    nextMechDiscount: raw.nextMechDiscount || 0,
    delayedMechDraws: raw.delayedMechDraws || 0,
    werewolfPlayedCount: raw.werewolfPlayedCount || 0
  };
}

function serializeBattleSnapshot() {
  return {
    turn: battle.turn,
    firstRole: OnlineState.firstRole,
    activeRole: OnlineState.activeRole,
    gameOver: battle.gameOver,
    turnLogs: (battle.turnLogs || []).slice(-40),
    leaders: [serializeLeaderForRemote(battle.leaders[0]), serializeLeaderForRemote(battle.leaders[1])],
    board: [
      battle.board[0].map(serializeCardInst),
      battle.board[1].map(serializeCardInst)
    ]
  };
}

function syncOnlineAvatarsAndHud() {
  if (typeof window.syncChatWidgetVisibility === 'function') window.syncChatWidgetVisibility();
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
    if (eImg) eImg.src = renderCustomAvatarDataURI(oppAvatar || { backdrop: 'flame', hairStyle: 'long', hairColor: 'gold', eyeStyle: 'crimson', outfit: 'paladin', headgear: 'crown' });
    const eTitle = document.getElementById('uiEnemyLeaderTitle');
    if (eTitle) eTitle.textContent = `🌐 ${oppName || '联机对手'}`;
  } else {
    if (restartBtn) restartBtn.classList.remove('hidden');
    if (quickDeck) quickDeck.classList.remove('hidden');
    if (surrenderBtn) surrenderBtn.classList.add('hidden');
  }
}

function applyMirroredBattleSnapshot(snap) {
  if (!snap) return;
  battle.turn = snap.turn;
  OnlineState.firstRole = snap.firstRole;
  OnlineState.activeRole = snap.activeRole;
  battle.firstPlayerSide = OnlineState.firstRole === OnlineState.role ? 0 : 1;
  battle.activeSide = OnlineState.activeRole === OnlineState.role ? 0 : 1;
  battle.gameOver = Boolean(snap.gameOver);
  if (Array.isArray(snap.turnLogs)) {
    battle.turnLogs = snap.turnLogs.map(g => ({ turn: g.turn, side: 1 - g.side, events: [...(g.events || [])] }));
  }
  battle.leaders[0] = deserializeLeaderFromRemote(snap.leaders[1], 0);
  battle.leaders[1] = deserializeLeaderFromRemote(snap.leaders[0], 1);
  battle.board[0] = (snap.board[1] || []).map(c => deserializeCardInst(c, 0));
  battle.board[1] = (snap.board[0] || []).map(c => deserializeCardInst(c, 1));
  syncOnlineAvatarsAndHud();
  renderAllBattleUI();
  if (typeof renderBattleRecordPanel === 'function') renderBattleRecordPanel();
}

function updateOnlineHudPill() {
  syncOnlineAvatarsAndHud();
}

OnlineState.pktSeq = 1;
OnlineState.ackedPkts = new Set();
OnlineState.seenRemotePkts = new Set();

function sendReliableRoomPacket(pkt, maxRetries = 5) {
  if (!OnlineState.roomId) return;
  const pktId = `${OnlineState.peerId}_${++OnlineState.pktSeq}_${Date.now()}`;
  const fullPkt = { ...pkt, pktId, senderAvatar: userAvatarConfig, senderName: OnlineState.nickname };
  let tries = 0;
  const attempt = () => {
    if (OnlineState.ackedPkts.has(pktId) || !OnlineState.roomId || tries >= maxRetries) return;
    tries++;
    sendRoomPacket(fullPkt);
    setTimeout(attempt, 850);
  };
  attempt();
}

function broadcastOnlineSync(kind, desc = '', actionMeta = null) {
  if (battleMode !== 'pvp_online' || !OnlineState.inMatch) return;
  try {
    const _snap = serializeBattleSnapshot();
    sendReliableRoomPacket({
      type: 'SYNC_STATE',
      kind: kind,
      desc: desc,
      actionMeta: Object.assign({}, actionMeta || {}, { vfxList: OnlineState.recordedVfx.splice(0) }),
      snap: _snap
    });
    if (typeof broadcastSpectateSnapshot === 'function') broadcastSpectateSnapshot(_snap);
  } catch (err) {
    console.error('broadcastOnlineSync error:', err);
  }
}

function showOnlineVictoryDefeatModal(iWon, subText) {
  if (!battle.gameOver) {
    if ((iWon && OnlineState.role === 'host') || (!iWon && OnlineState.role === 'guest')) {
      OnlineState.hostWins = (OnlineState.hostWins || 0) + 1;
    } else {
      OnlineState.guestWins = (OnlineState.guestWins || 0) + 1;
    }
  }
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
  if (iconEl) iconEl.textContent = iWon ? '🏆' : '💀';
  if (titleEl) {
    titleEl.textContent = iWon ? 'VICTORY · 联机胜利' : 'DEFEAT · 联机落败';
    titleEl.className = iWon ? 'text-3xl font-black tracking-widest text-amber-300' : 'text-3xl font-black tracking-widest text-rose-400';
  }
  if (subEl) subEl.textContent = subText || (iWon ? '你击败了联机对手！' : '己方主战者生命值归零。');
  if (btnAgain) btnAgain.classList.add('hidden');
  if (btnDeck) btnDeck.classList.add('hidden');
  if (subEl) subEl.textContent = `${subText || (iWon ? '你击败了联机对手！' : '己方主战者生命值归零。')}（2秒后自动返回对战房间...）`;
  modal.classList.remove('hidden');
  modal.style.display = 'flex';
  setTimeout(() => {
    if (btnAgain) btnAgain.classList.remove('hidden');
    if (btnDeck) btnDeck.classList.remove('hidden');
    if (battleMode === 'pvp_online' && OnlineState.roomId) {
      returnToVersusRoomAfterMatch();
    }
  }, 2200);
}

function returnToVersusRoomAfterMatch() {
  stopTurnCountdownTimer();
  stopMulliganCountdownTimer();
  OnlineState.inMatch = false;
  OnlineState.myReady = false;
  OnlineState.oppReady = false;
  OnlineState.myMulliganDone = false;
  OnlineState.oppMulliganDone = false;
  document.getElementById('victoryDefeatModal')?.classList.add('hidden');
  document.getElementById('mulliganModal')?.classList.add('hidden');
  document.getElementById('onlineWaitOverlay')?.classList.add('hidden');
  publishLobbyRoomMeta(false);
  publishOnlinePresence(false);
  openVersusRoomModal();
}

async function handleRoomPacket(pkt) {
  if (!pkt || pkt.senderId === OnlineState.peerId) return;
  if (typeof resetOppDisconnectMonitor === 'function') resetOppDisconnectMonitor();
  if (pkt.type === 'VR_PING') {
    OnlineState.lastVrOppPing = Date.now();
    if (typeof pkt.ready === 'boolean') OnlineState.oppReady = pkt.ready;
    if (typeof pkt.editing === 'boolean') OnlineState.oppEditingDeck = pkt.editing;
    if (OnlineState.role === 'host' && pkt.deckIds) OnlineState.guestDeckIds = pkt.deckIds;
    if (OnlineState.role === 'guest') {
      if (typeof pkt.hostWins === 'number') OnlineState.hostWins = pkt.hostWins;
      if (typeof pkt.guestWins === 'number') OnlineState.guestWins = pkt.guestWins;
    }
    updateVersusRoomUI();
    if (OnlineState.role === 'host' && OnlineState.guestId && OnlineState.myReady && OnlineState.oppReady) {
      if (!OnlineState.inMatch) {
        startOnlineMatchAsHost();
      } else if (!OnlineState.matchAcked && OnlineState._lastCompactInit) {
        sendRoomPacket({ type: 'MATCH_START', init: OnlineState._lastCompactInit });
      }
    }
    return;
  }
  if (pkt.type === 'LEADER_EMOTE') {
    if (typeof showLeaderEmoteBubble === 'function') showLeaderEmoteBubble(1, pkt.text);
    return;
  }
  if (pkt.type === 'CHAT_MSG') {
    if (typeof window.appendInGameChatMessage === 'function') window.appendInGameChatMessage(pkt.sender || '对手', pkt.text, false);
    if (typeof showLeaderChatBubble === 'function') showLeaderChatBubble(1, pkt.sender || '对手', pkt.text);
    return;
  }
  if (pkt.type === 'PRESENCE_PING') return;
  if (pkt.type === 'SYNC_REQ' && OnlineState.inMatch && !battle.gameOver) {
    sendRoomPacket({ type: 'SYNC_STATE', kind: 'RESYNC', desc: '', snap: serializeBattleSnapshot() });
    return;
  }
  if (pkt.type === 'PLAYER_AWAY') {
    startOppDisconnectCountdown(pkt.who || (OnlineState.role === 'host' ? OnlineState.guestName : OnlineState.hostName));
    return;
  }
  if (pkt.type === 'PLAYER_BACK') {
    resetOppDisconnectMonitor();
    showTriggeredEffectToast({ id: 'sys_notice', name: '战局提示', type: 'spell', rarity: '传说', energy: 0, bones: 0, sacrifice: 0 }, `🌐 对手【${pkt.who || '对方'}】已重新连接回到战局！`, 0);
    if (onlineIsMyTurn() || OnlineState.role === OnlineState.activeRole) {
      sendRoomPacket({ type: 'SYNC_STATE', kind: 'ACTION', desc: '', snap: serializeBattleSnapshot() });
    }
    return;
  }

  if (pkt.type === 'PING_TURN' && OnlineState.inMatch && !battle.gameOver) {
    // 若对方也在等待（即对方认为 activeRole 不是他，而我方也认为 activeRole 不是我），或者回合号落后，则由处于当前回合或刚结束回合的一方主动同步！
    if (pkt.activeRole !== OnlineState.role) {
      // 对方认为现在轮到我方？还是双方都认为轮到对方？
      if (!onlineIsMyTurn()) {
        // 双方都认为轮到对方 -> 死锁恢复！由 activeRole === OnlineState.role 的一侧或由 host 恢复，若我方刚结束回合则补发 TURN_END
        sendRoomPacket({
          type: 'SYNC_STATE',
          kind: 'TURN_END',
          desc: '恢复回合同步',
          snap: serializeBattleSnapshot()
        });
      }
    } else if ((pkt.turn || 1) < battle.turn) {
      sendRoomPacket({
        type: 'SYNC_STATE',
        kind: 'ACTION',
        desc: '',
        snap: serializeBattleSnapshot()
      });
    }
    return;
  }

  if (pkt.type === 'PKT_ACK' && pkt.pktId) {
    OnlineState.ackedPkts.add(pkt.pktId);
    return;
  }

  if (pkt.pktId) {
    sendRoomPacket({ type: 'PKT_ACK', pktId: pkt.pktId });
    if (OnlineState.seenRemotePkts.has(pkt.pktId)) return;
    OnlineState.seenRemotePkts.add(pkt.pktId);
  }

  if (pkt.senderAvatar) {
    if (OnlineState.role === 'host') OnlineState.guestAvatar = pkt.senderAvatar;
    else OnlineState.hostAvatar = pkt.senderAvatar;
  }
  if (pkt.senderName) {
    if (OnlineState.role === 'host') OnlineState.guestName = pkt.senderName;
    else OnlineState.hostName = pkt.senderName;
  }

  if (pkt.type === 'JOIN_REQ' && OnlineState.role === 'host') {
    // 幂等处理同一个挑战者的重试请求，绝不误发 JOIN_REJECT！
    if ((OnlineState.guestId && OnlineState.guestId !== pkt.guestId) || OnlineState.inMatch) {
      sendRoomPacket({ type: 'JOIN_REJECT', targetId: pkt.guestId, reason: '房间已满或正在对战中！' });
      return;
    }
    if (OnlineState.roomPwdHash && pkt.pwdHash !== OnlineState.roomPwdHash) {
      sendRoomPacket({ type: 'JOIN_REJECT', targetId: pkt.guestId, reason: '密码错误，请核对后重试！' });
      return;
    }
    OnlineState.guestId = pkt.guestId;
    OnlineState.guestName = pkt.guestName || '挑战者';
    OnlineState.guestDeckIds = pkt.deckIds || getActiveDeckIdsForOnline();
    if (pkt.avatar) OnlineState.guestAvatar = pkt.avatar;
    publishLobbyRoomMeta(false);
    updateOnlineRoomWaitUI();
    updateVersusRoomUI();
    sendRoomPacket({
      type: 'JOIN_ACCEPT',
      targetId: pkt.guestId,
      roomName: OnlineState.roomName,
      hostId: OnlineState.hostId,
      hostName: OnlineState.hostName,
      hostAvatar: userAvatarConfig
    });
    return;
  }

  if (pkt.type === 'JOIN_REJECT' && OnlineState.role === 'guest' && pkt.targetId === OnlineState.peerId) {
    if (OnlineState.joinAccepted || OnlineState.inMatch) return;
    leaveOnlineRoom(false);
    const errEl = document.getElementById('onlinePwdError');
    if (OnlineState.pendingJoinRoom && OnlineState.pendingJoinRoom.hasPassword) {
      document.getElementById('onlinePwdModal').classList.remove('hidden');
      if (errEl) { errEl.textContent = pkt.reason || '加入被拒绝'; errEl.classList.remove('hidden'); }
    } else {
      showGameAlert(pkt.reason || '无法加入该房间');
    }
    return;
  }

  if (pkt.type === 'JOIN_ACCEPT' && OnlineState.role === 'guest' && pkt.targetId === OnlineState.peerId) {
    if (OnlineState.joinAccepted) return;
    OnlineState.joinAccepted = true;
    document.getElementById('onlinePwdModal').classList.add('hidden');
    OnlineState.hostId = pkt.hostId;
    OnlineState.hostName = pkt.hostName;
    if (pkt.hostAvatar) OnlineState.hostAvatar = pkt.hostAvatar;
    OnlineState.guestId = OnlineState.peerId;
    OnlineState.guestName = OnlineState.nickname;
    OnlineState.myReady = false;
    OnlineState.oppReady = false;
    updateOnlineRoomWaitUI();
    openVersusRoomModal();
    return;
  }

  if (pkt.type === 'PLAYER_READY') {
    OnlineState.oppReady = Boolean(pkt.ready);
    if (OnlineState.role === 'host' && pkt.deckIds) OnlineState.guestDeckIds = pkt.deckIds;
    if (pkt.avatar) {
      if (OnlineState.role === 'host') OnlineState.guestAvatar = pkt.avatar;
      else OnlineState.hostAvatar = pkt.avatar;
    }
    updateVersusRoomUI();
    if (OnlineState.role === 'host' && OnlineState.guestId && OnlineState.myReady && OnlineState.oppReady && !OnlineState.inMatch) {
      setTimeout(() => {
        if (OnlineState.myReady && OnlineState.oppReady && !OnlineState.inMatch) startOnlineMatchAsHost();
      }, 300);
    }
    return;
  }

  if (pkt.type === 'MATCH_START_ACK' && OnlineState.role === 'host') {
    OnlineState.matchAcked = true;
    return;
  }

  if (pkt.type === 'PVP_SURRENDER') {
    if (OnlineState.inMatch && !battle.gameOver) {
      showTriggeredEffectToast({ id: 'sys_notice', name: '战局提示', type: 'spell', rarity: '传说', energy: 0, bones: 0, sacrifice: 0 }, `🏳️ 对手【${pkt.who || '对方'}】已投降认输，你获得胜利！`, 0);
      showOnlineVictoryDefeatModal(true, `对手【${pkt.who || '对方'}】选择了投降认输，点击下方按钮回到对战房间。`);
    }
    return;
  }

  if (pkt.type === 'LEAVE_ROOM') {
    if (OnlineState.inMatch && !battle.gameOver) {
      showTriggeredEffectToast({ id: 'sys_notice', name: '战局提示', type: 'spell', rarity: '传说', energy: 0, bones: 0, sacrifice: 0 }, `🏳️ 对手【${pkt.who || '对方'}】已离开房间，你获得胜利！`, 0);
      showOnlineVictoryDefeatModal(true, `对手【${pkt.who || '对方'}】已离开房间。`);
    }
    if (OnlineState.role === 'host') {
      OnlineState.guestId = '';
      OnlineState.guestName = '';
      OnlineState.guestDeckIds = null;
      OnlineState.oppReady = false;
      publishLobbyRoomMeta(false);
      updateOnlineRoomWaitUI();
      updateVersusRoomUI();
    } else {
      showGameAlert('房主已解散对战房间');
      document.getElementById('versusRoomModal')?.classList.add('hidden');
      leaveOnlineRoom(false);
      openOnlineLobbyModal();
    }
    return;
  }

  if (pkt.type === 'MATCH_START' && OnlineState.role === 'guest') {
    sendRoomPacket({ type: 'MATCH_START_ACK' });
    setTimeout(() => { if (OnlineState.inMatch) sendRoomPacket({ type: 'MATCH_START_ACK' }); }, 400);
    if (OnlineState.inMatch) return;
    const init = pkt.init || {};
    if (init.hostAvatar) OnlineState.hostAvatar = init.hostAvatar;
    if (init.hostName) OnlineState.hostName = init.hostName;
    document.getElementById('onlineLobbyModal')?.classList.add('hidden');
    document.getElementById('versusRoomModal')?.classList.add('hidden');
    document.getElementById('mainMenuOverlay')?.classList.add('hidden');
    if (typeof window.enterBattleFullscreenLandscape === 'function') window.enterBattleFullscreenLandscape();

    battleMode = 'pvp_online';
    const selMode = document.getElementById('selectBattleMode');
    if (selMode) selMode.value = 'pvp_online';
    OnlineState.inMatch = true;
    OnlineState.lastOppActiveTs = Date.now();
    resetOppDisconnectMonitor();
    OnlineState.myMulliganDone = false;
    OnlineState.oppMulliganDone = false;
    OnlineState.firstRole = init.firstRole || 'host';
    OnlineState.activeRole = OnlineState.firstRole;
    publishOnlinePresence(false);

    initBattleUiShellForOnline();
    battle.turn = 1;
    battle.firstPlayerSide = OnlineState.firstRole === 'guest' ? 0 : 1;
    battle.activeSide = battle.firstPlayerSide;
    battle.board = [[null, null, null, null, null], [null, null, null, null, null]];
    battle.leaders[0] = createLeaderState(0, []);
    battle.leaders[1] = createLeaderState(1, []);
    battle.leaders[0].deck = (init.gDeck || []).map(cid => createCardInstance(cid, 0)).filter(Boolean);
    battle.leaders[0].hand = (init.gHand || []).map(cid => createCardInstance(cid, 0)).filter(Boolean);
    battle.leaders[1].deck = (init.hDeck || []).map(cid => createCardInstance(cid, 1)).filter(Boolean);
    battle.leaders[1].hand = (init.hHand || []).map(cid => createCardInstance(cid, 1)).filter(Boolean);
    syncOnlineAvatarsAndHud();
    renderAllBattleUI();
    const mulOrder = document.getElementById('mulliganOrderLabel');
    if (mulOrder) mulOrder.textContent = battle.firstPlayerSide === 0 ? '先手 · FIRST' : '后手 · SECOND';
    const orderBadge = document.getElementById('uiTurnOrderBadge');
    if (orderBadge) orderBadge.textContent = battle.firstPlayerSide === 0 ? '🎲 我方先手' : '🎲 我方后手';
    openMulliganDualBox();
    return;
  }

  if (pkt.type === 'MULLIGAN_DONE') {
    OnlineState.oppMulliganDone = true;
    battle.leaders[1].hand = (pkt.hand || []).map(c => deserializeCardInst(c, 1)).filter(Boolean);
    battle.leaders[1].deck = (pkt.deck || []).map(c => deserializeCardInst(c, 1)).filter(Boolean);
    syncOnlineAvatarsAndHud();
    renderAllBattleUI();
    if (OnlineState.myMulliganDone && OnlineState.oppMulliganDone) {
      await startOnlineTurnOneIfFirst();
    }
    return;
  }

  if (pkt.type === 'PLAYER_EDITING_DECK') {
    OnlineState.oppEditingDeck = Boolean(pkt.editing);
    updateVersusRoomUI();
    return;
  }

  if (pkt.type === 'SYNC_STATE') {
    const meta = pkt.actionMeta || {};
    await replayOpponentActionsOnClient(meta);
    applyMirroredBattleSnapshot(pkt.snap);
    const playedCard = meta.cid ? cardsById[meta.cid] : null;
    if (meta.sacCount > 0) {
      sfx.play('sacrifice');
      const sacCell = getLaneDOM(1, 2);
      if (sacCell && typeof playSacrificeBloodRitualSVG === 'function') {
        playSacrificeBloodRitualSVG(sacCell);
      }
      spawnFloatNumber(1, 2, '🩸献祭', '#fb7185');
    }
    if (playedCard && (meta.cardType === 'spell' || playedCard.type === 'spell')) {
      sfx.play('synergy');
      showOppSpellShowcase(playedCard);
    } else if (pkt.desc && pkt.kind !== 'TURN_START') {
      sfx.play('synergy');
      if (playedCard) showTriggeredEffectToast(playedCard, `🌐 对手：${pkt.desc}`, 260);
    }
    if (pkt.kind === 'TURN_END' && !battle.gameOver) {
      OnlineState.activeRole = OnlineState.role;
      battle.activeSide = 0;
      if (OnlineState.role === OnlineState.firstRole) {
        battle.turn += 1;
      }
      syncOnlineAvatarsAndHud();
      await beginTurnSequence(0);
      broadcastOnlineSync('TURN_START', '进入新回合');
    } else if (pkt.kind === 'RESYNC' && !battle.gameOver) {
      battle.animating = false;
      if (onlineIsMyTurn()) startTurnCountdownTimer();
    } else if (pkt.kind === 'TURN_START' && !battle.gameOver) {
      startTurnCountdownTimer();
      await playTurnStartBanner(1);
    } else if (pkt.kind === 'GAME_OVER' || battle.gameOver) {
      const iWon = battle.leaders[1].hp <= 0 && battle.leaders[0].hp > 0;
      showOnlineVictoryDefeatModal(iWon, iWon ? '你成功击败了联机对手！点击下方按钮回到对战房间。' : '己方主战者生命值归零，点击下方按钮回到对战房间。');
    }
  }
}

function initBattleUiShellForOnline() {
  battle.gameOver = false;
  battle.luckyCoinGranted = false;
  battle.animating = false;
  battle.inspectedCard = null;
  battle.pendingPlay = null;
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

function startOnlineMatchAsHost() {
  if (OnlineState.role !== 'host' || !OnlineState.guestId || !OnlineState.myReady || !OnlineState.oppReady) return;
  const _olM = document.getElementById('onlineLobbyModal'); if (_olM) { _olM.classList.add('hidden'); _olM.style.display = 'none'; }
  const _vrM = document.getElementById('versusRoomModal'); if (_vrM) { _vrM.classList.add('hidden'); _vrM.style.display = 'none'; }
  const _mmO = document.getElementById('mainMenuOverlay'); if (_mmO) _mmO.classList.add('hidden');
  if (typeof window.enterBattleFullscreenLandscape === 'function') window.enterBattleFullscreenLandscape();

  battleMode = 'pvp_online';
  const selMode = document.getElementById('selectBattleMode');
  if (selMode) selMode.value = 'pvp_online';

  OnlineState.inMatch = true;
  OnlineState.lastOppActiveTs = Date.now();
  resetOppDisconnectMonitor();
  OnlineState.myMulliganDone = false;
  OnlineState.oppMulliganDone = false;
  OnlineState.matchAcked = false;
  OnlineState.firstRole = Math.random() < 0.5 ? 'host' : 'guest';
  OnlineState.activeRole = OnlineState.firstRole;
  publishLobbyRoomMeta(false);
  publishOnlinePresence(false);

  initBattleUiShellForOnline();
  battle.turn = 1;
  battle.firstPlayerSide = OnlineState.firstRole === 'host' ? 0 : 1;
  battle.activeSide = battle.firstPlayerSide;
  battle.board = [[null, null, null, null, null], [null, null, null, null, null]];

  const pDeckIds = getActiveDeckIdsForOnline();
  const gDeckIds = (OnlineState.guestDeckIds && OnlineState.guestDeckIds.length >= RULES.deckSize) ? OnlineState.guestDeckIds : getActiveDeckIdsForOnline();
  battle.leaders[0] = createLeaderState(0, pDeckIds);
  battle.leaders[1] = createLeaderState(1, gDeckIds);
  prepareOpeningHand(0);
  prepareOpeningHand(1);

  const mulOrder = document.getElementById('mulliganOrderLabel');
  if (mulOrder) mulOrder.textContent = battle.firstPlayerSide === 0 ? '先手 · FIRST' : '后手 · SECOND';
  const orderBadge = document.getElementById('uiTurnOrderBadge');
  if (orderBadge) orderBadge.textContent = battle.firstPlayerSide === 0 ? '🎲 我方先手' : '🎲 我方后手';

  renderAllBattleUI();
  updateOnlineHudPill();

  // 使用超轻量级初始指令 + ACK重传（避免大包丢失导致挑战者未进入游戏）
  const compactInit = {
    firstRole: OnlineState.firstRole,
    hostName: OnlineState.nickname,
    hostAvatar: userAvatarConfig,
    hDeck: battle.leaders[0].deck.map(c => c.data.id),
    hHand: battle.leaders[0].hand.map(c => c.data.id),
    gDeck: battle.leaders[1].deck.map(c => c.data.id),
    gHand: battle.leaders[1].hand.map(c => c.data.id)
  };
  OnlineState._lastCompactInit = compactInit;
  let retries = 0;
  const sendInitLoop = () => {
    if (OnlineState.matchAcked || !OnlineState.inMatch || retries >= 16) return;
    retries++;
    sendRoomPacket({ type: 'MATCH_START', init: compactInit });
    setTimeout(sendInitLoop, 900);
  };
  sendInitLoop();
  openMulliganDualBox();
}

async function startOnlineTurnOneIfFirst() {
  const waitOv = document.getElementById('onlineWaitOverlay');
  if (waitOv) waitOv.classList.add('hidden');
  updateOnlineHudPill();
  if (OnlineState.firstRole === OnlineState.role) {
    OnlineState.activeRole = OnlineState.role;
    battle.activeSide = 0;
    await beginTurnSequence(0);
    broadcastOnlineSync('TURN_START', '第 1 回合开始');
  } else {
    OnlineState.activeRole = OnlineState.firstRole;
    battle.activeSide = 1;
    showTriggeredEffectToast({ id: 'sys_notice', name: '战局提示', type: 'spell', rarity: '传说', energy: 0, bones: 0, sacrifice: 0 }, '⏳ 对手为先手，正在等待对手第 1 回合行动...', 0);
  }
}

function refreshOnlineLobbyDeckUI() {
  const sel = document.getElementById('onlineLobbyDeckSelect');
  if (sel && typeof syncVersusDeckSelect === 'function') syncVersusDeckSelect(sel);
  const deckObj = PRESET_DECKS[currentDeckIndex] || PRESET_DECKS[0];
  const deckLen = expandDeck(deckObj).length;
  const prevEl = document.getElementById('onlineMyDeckPreview');
  if (prevEl) {
    prevEl.textContent = `${deckObj.name} (${deckLen} 张${deckLen < 40 ? ' · 不足40张将自动补齐' : ' · 就绪'})`;
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
  if (!OnlineState.connected) connectOnlineNetwork();
  else renderOnlineRoomList();
  if (typeof publishOnlinePresence === 'function') publishOnlinePresence(false);
}

// 绑定联机大厅 DOM 事件
document.getElementById('btnNavOnlineLobby')?.addEventListener('click', () => {
  sfx.play('click');
  openOnlineLobbyModal();
});
document.getElementById('btnCloseOnlineLobby')?.addEventListener('click', () => {
  const m = document.getElementById('onlineLobbyModal');
  if (m) { m.classList.add('hidden'); m.style.display = 'none'; }
  if (typeof publishOnlinePresence === 'function') publishOnlinePresence(false);
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
document.getElementById('btnExitSpectate')?.addEventListener('click', () => stopSpectatingRoom());
document.getElementById('btnToggleSpectatorList')?.addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('spectatorListPopover')?.classList.toggle('hidden');
  updateSpectatorHudWidget();
});
document.getElementById('btnCloseSpectatorPopover')?.addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('spectatorListPopover')?.classList.add('hidden');
});
document.getElementById('onlineServerMode')?.addEventListener('change', (e) => {
  OnlineState.mode = e.target.value;
  const wsIn = document.getElementById('onlineCustomWsInput');
  if (wsIn) wsIn.classList.toggle('hidden', OnlineState.mode !== 'custom');
  connectOnlineNetwork();
});
document.getElementById('btnOnlineReconnect')?.addEventListener('click', () => connectOnlineNetwork());
document.getElementById('btnRefreshLobbyRooms')?.addEventListener('click', () => {
  const now = Date.now();
  for (const [k, v] of OnlineState.rooms.entries()) { if (!v || now - (v.ts || 0) > 15000) OnlineState.rooms.delete(k); }
  for (const [k, v] of OnlineState.onlinePlayers.entries()) { if (!v || now - (v.ts || 0) > 15000) OnlineState.onlinePlayers.delete(k); }
  renderOnlineRoomList();
  renderOnlinePlayerList();
});
document.getElementById('btnCreateOnlineRoom')?.addEventListener('click', () => createOnlineRoom());
document.getElementById('btnStartOnlineMatch')?.addEventListener('click', () => startOnlineMatchAsHost());
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
    navigator.clipboard.writeText(OnlineState.roomId).then(() => {
      showGameAlert(`已复制房间号：${OnlineState.roomId}`);
    }).catch(() => {});
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
  sendJoinRoomRequest(OnlineState.pendingJoinRoom, pwd);
});


// 商业级全流派高智商战术 AI 引擎（严格执行 v2.1 卡牌费用价值公式：能量×1 + 祭品×1.5 + 骨头×0.5）
// 规则：
// 1. 献祭、破坏自己随从等效果绝不以高价值随从为目标，祭品的价值不能大于等于当前打出的献祭类随从的价值！
// 2. 当要献祭时，若场上低价值随从不足，先检查手中是否有低价值随从可以打出，先打出低价值随从再献祭！
// 3. 价值同等的情况下，优先选择当前生命值和攻击力较低的随从献祭！
// ============================================================================
function analyzeMinionKillValueForAI(m, isBanish = false) {
  if (!m || m.data.type === 'amulet') return 0;
  const c = m.data;
  const kw = m.activeKw || {};
  const ast = c.ast || parseCardEffectAST(c);
  const aiHp = battle.leaders[1] ? battle.leaders[1].hp : 30;
  const playerBoardAtk = battle.board[0].reduce((sum, x) => sum + (x && x.data.type === 'minion' ? x.currentAtk * Math.max(1, (x.activeKw && x.activeKw['多重攻击']) || 1) : 0), 0);
  const dangerMultiplier = 1.0 + Math.max(0, (30 - aiHp) / 22) + (playerBoardAtk >= aiHp * 0.5 ? 0.5 : 0);

  const swings = Math.max(1, kw['多重攻击'] || 1);
  let score = (m.currentAtk * swings * 18 * dangerMultiplier) + (m.currentHp * 7) + getCardCostValue(c) * 4;

  const isEvolvingCountdown = m.countdown !== null && m.countdown > 0 && (String(c.timerEffect || '').includes('变身为') || String(c.fullText || '').includes('变身为'));
  if (isEvolvingCountdown) {
    // 通用机制：具有倒计时进化/变身成长的随从（如雏龙/喷火龙/飞龙/远古巨龙等）留场越久滚雪球越猛，倒计时越临近解场优先级越高
    score += (m.countdown === 1 ? 195 : 145) + m.currentAtk * 12;
  } else if (m.countdown !== null) {
    score += hasRace(c, '龙族') ? 95 : 48;
  }
  if (['cmwbxu7u3tpyo','cmwdw2v21c73r','cmwgyfgvst9r1','cmwgccmsj2ypl','cmwgd56lg867w'].includes(c.id)) score += (c.id === 'cmwbxu7u3tpyo' ? 160 : 95);
  if (isMechCard(c)) {
    const oppMechCnt = battle.board[0].filter(x => x && x.data.type === 'minion' && isMechCard(x.data)).length;
    if (oppMechCnt >= 3) score += 220;
    else if (oppMechCnt === 2) score += 95;
  }
  if ((ast.onEnter && ast.onEnter.length > 0) || String(c.fullText || '').includes('每当')) score += 65;
  if ((ast.turnEnd && ast.turnEnd.length > 0) || String(c.fullText || '').includes('回合结束')) score += 48;
  if (ast.activate || (c.keywords || []).some(k => k.k === '启动')) score += 45;
  if ((ast.onAttack && ast.onAttack.length > 0) || m.grantedOnAttackAoe4) score += 95;

  if (kw['全体攻击']) score += 55;
  if (kw['三侧攻击']) score += 45;
  if (kw['两侧攻击']) score += 32;
  if (kw['毁灭']) score += 38;
  if (kw['虹吸']) score += 28;
  if (kw['飞行']) {
    // 通用机制：AI 缺乏防空随从阻挡时，飞行单位每回合都能稳定直击主战者，威胁度大幅上调
    const aiHasAntiAir = battle.board[1].some(am => am && am.data.type === 'minion' && am.activeKw && am.activeKw['防空']);
    score += (aiHasAntiAir ? 36 : 82) + m.currentAtk * 12;
  }
  if ((isEvolvingCountdown || kw['飞行'] || (ast.onAttack && ast.onAttack.length > 0)) && m.currentHp <= 4 && !kw['屏障']) {
    score += 35; // 脆皮高威胁成长/飞行/攻击特效引擎优先点杀止损
  }
  if (kw['守护']) score += 24;
  if (kw['屏障']) score += 18;
  if (kw['防空']) score += 12;

  if (hasAnyLastWords(m)) {
    if (isBanish) score += 75;
    else score -= 18;
  }
  return score;
}

function cloneVirtualMinionForAI(m) {
  if (!m) return null;
  return {
    data: m.data,
    currentAtk: m.currentAtk !== undefined ? m.currentAtk : (m.data ? (m.data.atk || 0) : 0),
    currentHp: m.currentHp !== undefined ? m.currentHp : (m.data ? (m.data.hp || 1) : 1),
    activeKw: Object.assign({}, m.activeKw || {}),
    countdown: m.countdown !== undefined ? m.countdown : null,
    grantedOnAttackAoe4: Boolean(m.grantedOnAttackAoe4),
    shiftDir: m.shiftDir || 1
  };
}

// 精确模拟 summonByNameAnimated 的连环放置落点（以起始位为基准，优先向右连续，碰壁或阻挡则回起始位向左连续，再从左往右检视空位）
function simulateAISummonLanes(boardArr, sourceLane, count, includeSourceIfEmpty = false) {
  const simB = [...boardArr];
  const lanes = [];
  const hasOrigin = (sourceLane >= 0 && sourceLane < 5);
  let anchorLane = sourceLane;
  let cursor = sourceLane;
  let dir = (hasOrigin && (sourceLane + 1 >= 5 || simB[sourceLane + 1] !== null)) ? -1 : 1;

  for (let i = 0; i < count; i++) {
    let emptyL = -1;
    if (!hasOrigin) {
      emptyL = simB.findIndex(x => x === null);
    } else if (i === 0 && includeSourceIfEmpty && simB[sourceLane] === null) {
      emptyL = sourceLane;
      anchorLane = sourceLane;
      cursor = sourceLane;
      dir = (sourceLane + 1 >= 5 || simB[sourceLane + 1] !== null) ? -1 : 1;
    } else if (dir === 1) {
      if (cursor + 1 < 5 && simB[cursor + 1] === null) {
        emptyL = cursor + 1;
        cursor = emptyL;
      } else {
        dir = -1;
        for (let l = anchorLane - 1; l >= 0; l--) {
          if (simB[l] === null) { emptyL = l; break; }
        }
        if (emptyL !== -1) {
          cursor = emptyL;
        } else {
          for (let l = 0; l < 5; l++) {
            if (simB[l] === null) { emptyL = l; break; }
          }
          if (emptyL !== -1) { dir = 1; cursor = emptyL; }
        }
      }
    } else {
      if (cursor - 1 >= 0 && simB[cursor - 1] === null) {
        emptyL = cursor - 1;
        cursor = emptyL;
      } else {
        for (let l = 0; l < 5; l++) {
          if (simB[l] === null) { emptyL = l; break; }
        }
        if (emptyL !== -1) { dir = 1; cursor = emptyL; }
      }
    }
    if (emptyL === -1) break;
    simB[emptyL] = { virtualToken: true };
    lanes.push(emptyL);
  }
  return lanes;
}

// 判定敌方随从是否具有持续/触发类特殊威胁效果（毁灭、虹吸、攻击时、回合开始/结束、随从进场/离场、每当xx等）
function hasSpecialThreatEffectForAI(m) {
  if (!m || !m.data || m.data.type === 'amulet') return false;
  const kw = m.activeKw || {};
  if (kw['毁灭'] || kw['虹吸'] || kw['多重攻击'] || kw['全体攻击'] || kw['三侧攻击'] || kw['两侧攻击'] || kw['飞行'] || kw['荆棘'] || kw['守护']) return true;
  if (m.grantedOnAttackAoe4 || m.countdown !== null) return true;
  const c = m.data;
  const ast = c.ast || parseCardEffectAST(c);
  if ((ast.onAttack && ast.onAttack.length > 0) ||
      (ast.turnStart && ast.turnStart.length > 0) ||
      (ast.turnEnd && ast.turnEnd.length > 0) ||
      (ast.onEnter && ast.onEnter.length > 0) ||
      ast.activate) return true;
  const ft = String(c.fullText || c.text || '');
  return /每当|攻击时|回合开始|回合结束|随从进场|随从离场|在自己回合|受到伤害时|使自己的主战者无敌|伤害转移|倒计时|变身|启动/.test(ft);
}

// 判断卡牌是否具备「谢幕曲召唤随从」或「回合开始召唤随从」（即使被解也能为下回合献祭留场）
function isStickyTributeSummonerForAI(cData) {
  if (!cData) return false;
  const ft = String(cData.fullText || cData.text || '');
  const hasLwSummon = ft.includes('谢幕曲') && /召唤|招募|亡者召还/.test(ft);
  const hasTurnStartSummon = ft.includes('回合开始') && /召唤/.test(ft);
  return hasLwSummon || hasTurnStartSummon;
}

// 评估场面身材与综合价值（用于对比瞬念召唤/清场前后的敌我场面净差值）
function getBoardStatValueForAI(m) {
  if (!m || !m.data || m.data.type === 'amulet') return 0;
  const swings = Math.max(1, (m.activeKw && m.activeKw['多重攻击']) || 1);
  return (m.currentAtk || 0) * swings * 1.3 + (m.currentHp || 0) * 1.0 + getCardCostValue(m.data) * 0.85;
}

function getBoardStatNetDiffForAI(myBoard, oppBoard) {
  let myV = 0, oppV = 0;
  for (let l = 0; l < 5; l++) {
    if (myBoard[l] && myBoard[l].data && myBoard[l].data.type === 'minion') myV += getBoardStatValueForAI(myBoard[l]);
    if (oppBoard[l] && oppBoard[l].data && oppBoard[l].data.type === 'minion') oppV += getBoardStatValueForAI(oppBoard[l]);
  }
  return myV - oppV;
}

function simulateProjectedFaceDamage(virtualEnemyBoard = null, virtualPlayerBoard = null) {
  const eBoard = (virtualEnemyBoard || battle.board[1]).map(cloneVirtualMinionForAI);
  const pBoard = (virtualPlayerBoard || battle.board[0]).map(cloneVirtualMinionForAI);
  let faceDmg = 0;
  const order = [4, 3, 2, 1, 0];
  for (const l of order) {
    const atkM = eBoard[l];
    if (!atkM || (atkM.data && atkM.data.type === 'amulet') || atkM.currentAtk <= 0) continue;
    const swings = Math.max(1, (atkM.activeKw && atkM.activeKw['多重攻击']) || 1);
    for (let s = 0; s < swings; s++) {
      if (atkM.grantedOnAttackAoe4) {
        for (let al = 0; al < 5; al++) {
          const pm = pBoard[al];
          if (pm && pm.data && pm.data.type === 'minion') {
            if (pm.activeKw['屏障']) delete pm.activeKw['屏障'];
            else {
              pm.currentHp -= 4;
              if (pm.currentHp <= 0) pBoard[al] = null;
            }
          }
        }
      }
      if (atkM.data && atkM.data.id === 'cmwge5kmkgr5o' && pBoard[l] && pBoard[l].data.type === 'minion') {
        pBoard[l] = null; // 失控的战甲犀牛：攻击时破坏面前随从
      }
      let targetLanes = [l];
      if (atkM.activeKw && atkM.activeKw['全体攻击']) targetLanes = [0, 1, 2, 3, 4];
      else if (atkM.activeKw && atkM.activeKw['三侧攻击']) targetLanes = [l - 1, l, l + 1].filter(x => x >= 0 && x < 5);
      else if (atkM.activeKw && atkM.activeKw['两侧攻击']) targetLanes = [l - 1, l + 1].filter(x => x >= 0 && x < 5);

      for (const tl of targetLanes) {
        let def = pBoard[tl];
        if (def && def.data && def.data.type === 'amulet') def = null;
        if (!def) {
          // 寻找距离最近的【守护】随从横移拦截
          let bestG = -1, bestDist = 99;
          for (let gl = 0; gl < 5; gl++) {
            const gm = pBoard[gl];
            if (gm && (!gm.data || gm.data.type === 'minion') && gm.activeKw && gm.activeKw['守护'] && !gm.activeKw['潜行']) {
              const d = Math.abs(gl - tl);
              if (d < bestDist) { bestDist = d; bestG = gl; }
            }
          }
          if (bestG !== -1) {
            def = pBoard[bestG];
            pBoard[bestG] = null;
            pBoard[tl] = def;
          }
        }
        const hitFace = (!def) || (atkM.activeKw && atkM.activeKw['飞行'] && !(def.activeKw && def.activeKw['防空']));
        if (hitFace) {
          faceDmg += atkM.currentAtk;
        } else if (def) {
          if (def.activeKw && def.activeKw['屏障']) {
            delete def.activeKw['屏障'];
          } else {
            def.currentHp -= atkM.currentAtk;
            if (def.currentHp <= 0 || (atkM.activeKw && atkM.activeKw['毁灭'])) {
              pBoard[tl] = null;
            }
          }
        }
      }
    }
    // 模拟攻击后【位移】
    if (atkM.activeKw && atkM.activeKw['位移']) {
      let nextL = l + (atkM.shiftDir || 1);
      if (nextL < 0 || nextL >= 5 || eBoard[nextL] !== null) {
        atkM.shiftDir = -(atkM.shiftDir || 1);
        nextL = l + atkM.shiftDir;
      }
      if (nextL >= 0 && nextL < 5 && eBoard[nextL] === null) {
        eBoard[l] = null;
        eBoard[nextL] = atkM;
      }
    }
  }
  return faceDmg;
}

// 比较两个己方随从作为祭品的优先级：
// 1. 先按卡牌费用价值 (energy*1 + bones*0.5 + sacrifice*2) 升序排列（价值越低越优先献祭）
// 2. 价值同等的情况下，严格优先选择当前生命值和攻击力较低的随从献祭！
function getBoardMinionEffectiveValueForAI(m) {
  if (!m || !m.data) return 0;
  const baseVal = getCardCostValue(m.data);
  const extraAtk = Math.max(0, (m.currentAtk || 0) - (m.data.atk || 0));
  const extraHp = Math.max(0, (m.currentHp || 0) - (m.data.hp || 0));
  let cdBonus = 0;
  if (m.countdown !== null && m.countdown > 0 && String(m.data.timerEffect || "").includes("变身为")) {
    cdBonus = m.countdown === 1 ? 3.5 : 2.5;
  }
  if (['cmwdtq4q7c8pe', 'cmwdui6uam6xe', 'cmwdukf0l090w', 'cmwdv3usmmzyp'].includes(m.data.id)) {
    cdBonus += 8.0; // 绝不轻易献祭已孵化的高阶飞龙
  }
  return Number((baseVal + (extraAtk + extraHp) * 0.5 + cdBonus).toFixed(1));
}

function getBoardNetValueDiffForAI(myBoard, oppBoard) {
  let myV = 0, oppV = 0;
  for (let l = 0; l < 5; l++) {
    if (myBoard[l] && myBoard[l].data.type === 'minion') myV += getBoardMinionEffectiveValueForAI(myBoard[l]);
    if (oppBoard[l] && oppBoard[l].data.type === 'minion') oppV += getBoardMinionEffectiveValueForAI(oppBoard[l]);
  }
  return myV - oppV;
}

function compareTributeCandidatesForAI(instA, instB) {
  const aiHpNow = battle.leaders[1] ? battle.leaders[1].hp : 30;
  const guardKeepA = (aiHpNow <= 16 && instA.activeKw && instA.activeKw['守护']) ? 1.5 : 0;
  const guardKeepB = (aiHpNow <= 16 && instB.activeKw && instB.activeKw['守护']) ? 1.5 : 0;
  const nunA = (instA.data && instA.data.id === 'cmwe1w8cztclb') ? -1.0 : 0;
  const nunB = (instB.data && instB.data.id === 'cmwe1w8cztclb') ? -1.0 : 0;
  const sacFodderBonus = (inst) => {
    const id = inst && inst.data ? inst.data.id : '';
    if (id === 'cmwata95yc8j5') return -3.0; // 被献祭的松鼠：绝对第一祭品
    if (id === 'cmwc0auyporsj') return -2.2; // 骸骨兽：献祭即爆2个骷髅，极佳祭品
    if (id === 'cmwgd14oa2890' || id === 'cmwfdqzl799uk' || id === 'cmwc9mbry93dx') return -1.2;
    return 0;
  };
  const valA = getBoardMinionEffectiveValueForAI(instA) + guardKeepA + nunA + sacFodderBonus(instA);
  const valB = getBoardMinionEffectiveValueForAI(instB) + guardKeepB + nunB + sacFodderBonus(instB);
  if (Math.abs(valA - valB) > 0.001) return valA - valB;
  const statA = (instA.currentHp || 0) + (instA.currentAtk || 0);
  const statB = (instB.currentHp || 0) + (instB.currentAtk || 0);
  if (statA !== statB) return statA - statB;
  if ((instA.currentHp || 0) !== (instB.currentHp || 0)) return (instA.currentHp || 0) - (instB.currentHp || 0);
  return (instA.currentAtk || 0) - (instB.currentAtk || 0);
}

function estimateAIExtraSummons(c, isEnh, choiceIdx) {
  if (!c || !c.data) return 0;
  const id = c.data.id;
  if (id === 'cmwbyp6f419ju') return 4; // 摇滚骷髅吉他手
  if (id === 'cmwghmf9xj9dv') return 3; // 摇滚骷髅乐团主唱（亡者召还价值1/2/3）
  if (id === 'cmwgdqawegvy3') return 2; // 地狱三头犬
  if (id === 'cmwgdeqcq4vyl') return 3; // 骸骨和少女
  if (id === 'cmwgeg2eggz9t') return 3; // 骸骨恋人
  if (id === 'cmwdz3reuida0') return choiceIdx === 0 ? 4 : (choiceIdx === 2 ? 1 : 0); // 孵化万物的龙女
  if (id === 'cmwgrn65g40ql') return choiceIdx === 2 ? 3 : 0; // 拯救世界的大天使
  if (id === 'cmwdvmwjm0301') return 2; // 丢失的龙蛋
  if (id === 'cmwgrgw6jyd8p') return 1; // 亡灵骑士
  if (id === 'cmwgxtqho266t') return 3; // 鬼火将军
  if (id === 'cmwgyyghnbr4n') return 2; // 蝙蝠女王
  if (id === 'cmwhhzt6ezp08') return 1; // 蔷薇近卫
  const ast = c.data.ast || parseCardEffectAST(c.data);
  const acts = [...(ast.fanfare || []), ...(ast.spellMain || []), ...(isEnh && ast.enhance ? ast.enhance.actions : [])];
  let sum = 0;
  for (const act of acts) {
    if (act.op === 'summon') sum += (act.count || 1);
    else if (act.op === 'reanimate' || act.op === 'recruit') sum += (act.times || 1);
  }
  return sum;
}

function initOpponentIntelForSide(side) {
  const st = battle && battle.leaders ? battle.leaders[side] : null;
  const oppSt = battle && battle.leaders ? battle.leaders[1 - side] : null;
  if (!st || !oppSt) return null;
  if (st.oppIntel) return st.oppIntel;
  // 仅在开局读取一次对手公开卡组构成（绝不窥探对手隐藏手牌）
  const pool = [
    ...(oppSt.deck || []).map(c => c && c.data).filter(Boolean),
    ...(oppSt.hand || []).map(c => c && c.data).filter(Boolean),
    ...(oppSt.graveyard || []).filter(Boolean)
  ];
  let mechCnt = 0, wardCnt = 0, selfDmgCnt = 0, lwCnt = 0, dragonCnt = 0;
  let antiAirCount = 0, healCount = 0, burstCount = 0, sacCount = 0;
  const aoeThreats = {
    mechEmperor: false,      // 超载机皇 (7费 3目标AOE)
    mechGirl: false,         // 魔导机兵少女 (5+回合 5机械4伤AOE)
    dragonHero: false,       // 流淌龙血的侠客 (8费 全体AOE)
    brawler: false,          // 狂暴女拳师 (血<10 4费4伤AOE)
    tear: false,             // 撕裂 (3费 全场2伤)
    drummer: false,          // 摇滚骷髅乐团鼓手 (5费+4骨 AOE)
    rottingMist: false,      // 腐烂雾气 (3费 非亡灵2伤)
    cataclysm: false,        // 大灾变 (6费 全清)
    holyLight: false         // 圣光照耀 (8费 5伤)
  };
  for (const cd of pool) {
    const txt = String(cd.fullText || cd.text || '');
    if (isMechCard(cd)) mechCnt++;
    if (hasRace(cd, '龙族') || cd.id === 'cmwdvrwfcy5gg' || cd.id === 'cmwdw2v21c73r') dragonCnt++;
    if ((cd.keywords || []).some(k => k.k === '守护')) wardCnt++;
    if (txt.includes('自己的主战者造成') || txt.includes('自己主战者造成')) selfDmgCnt++;
    if ((cd.keywords || []).some(k => k.k === '谢幕曲')) lwCnt++;
    if ((cd.keywords || []).some(k => k.k === '防空')) antiAirCount++;
    if (txt.includes('回复') || (cd.keywords || []).some(k => k.k === '虹吸')) healCount++;
    if (['cmwgyx2fz9jks', 'cmwgyxdbows5c', 'cmwm86ka6xbwr', 'cmwlo5i3bcgg1', 'cmwkgzkuuxaoz'].includes(cd.id)) burstCount++;
    if ((cd.sacrifice || 0) >= 2) sacCount++;
    if (cd.id === 'cmwc3gozg0rat') aoeThreats.mechEmperor = true;
    if (cd.id === 'cmwbx0mq8qz7f') aoeThreats.mechGirl = true;
    if (cd.id === 'cmwdwtfm8xm5c') aoeThreats.dragonHero = true;
    if (cd.id === 'cmwkgxi000fpl') aoeThreats.brawler = true;
    if (cd.id === 'cmwgyks2fu1p5') aoeThreats.tear = true;
    if (cd.id === 'cmwhilw8iwvet') aoeThreats.drummer = true;
    if (cd.id === 'cmwke2qdplbkf') aoeThreats.rottingMist = true;
    if (cd.id === 'cmwe0hk86d0a2') aoeThreats.cataclysm = true;
    if (cd.id === 'cmwhmdc2wy39w') aoeThreats.holyLight = true;
  }
  let archetype = 'other';
  const scores = [
    ['mech', mechCnt],
    ['dragon', dragonCnt],
    ['selfdmg', selfDmgCnt * 1.4],
    ['shield', wardCnt * 1.1],
    ['lastwords', lwCnt * 1.1]
  ].sort((a, b) => b[1] - a[1]);
  if (scores[0][1] >= 6) archetype = scores[0][0];
  st.oppIntel = {
    archetype, mechCnt, wardCnt, selfDmgCnt, lwCnt, dragonCnt,
    antiAirCount, healCount, burstCount, sacCount, aoeThreats
  };
  return st.oppIntel;
}

function evaluateBattleContextForAI(side) {
  const st = battle.leaders[side];
  const opp = 1 - side;
  const oppSt = battle.leaders[opp];
  const intel = initOpponentIntelForSide(side) || { archetype: 'other', aoeThreats: {}, antiAirCount: 0, healCount: 0, burstCount: 0 };
  const turn = battle.turn || 1;
  const oppNextE = Math.min(RULES.energyMax, (oppSt.maxEnergy || 1) + 1);
  const myBoard = battle.board[side];
  const oppBoard = battle.board[opp];

  let myBoardAtk = 0, myBoardCount = 0, oppBoardAtk = 0, oppBoardCount = 0, oppMechBoard = 0;
  for (let l = 0; l < 5; l++) {
    const mm = myBoard[l];
    if (mm) { myBoardCount++; if (mm.data.type === 'minion') myBoardAtk += (mm.currentAtk || 0); }
    const om = oppBoard[l];
    if (om) {
      oppBoardCount++;
      if (om.data.type === 'minion') oppBoardAtk += (om.currentAtk || 0);
      if (isMechCard(om.data)) oppMechBoard++;
    }
  }

  // 统计对手公开可见手牌中的直伤与衍生物（仅公开信息，不作弊）
  const pubHand = (oppSt.publicHandIds || []).filter(p => (oppSt.hand || []).some(h => h && h.uid === p.uid));
  const oppPublicBurn = pubHand.filter(p => p.id === 'cmwgyx2fz9jks' || p.id === 'cmwgyxdbows5c').length * 3;
  const oppPublicSheep = pubHand.filter(p => p.id === 'cmwby0dy7g2pc').length;

  // 计算潜在斩杀威胁（含公开直伤 + 场上攻击力）
  const effectiveSafetyHp = st.hp - oppPublicBurn;
  const inDanger = effectiveSafetyHp <= 13 || oppBoardAtk >= effectiveSafetyHp * 0.55;

  // 节奏角色判定：面对龙族/圣盾等后期发育卡组，且自身血量安全时主动竞速抢血
  let tempoRole = 'balanced';
  if (oppSt.hp <= 12 || (myBoardAtk >= oppSt.hp * 0.6 && !inDanger)) {
    tempoRole = 'race';
  } else if ((intel.archetype === 'dragon' || intel.archetype === 'shield') && !inDanger && turn <= 10) {
    tempoRole = 'race';
  } else if (inDanger) {
    tempoRole = 'control';
  }

  // 预判下回合对手 AOE 威胁
  let oppAoeRisk = 0;
  const aoe = intel.aoeThreats || {};
  if (aoe.mechEmperor && oppNextE >= 7 && (oppSt.hand || []).length >= 3) oppAoeRisk++;
  if (aoe.mechGirl && turn >= 4 && (oppMechBoard + oppPublicSheep) >= 4) oppAoeRisk++;
  if (aoe.dragonHero && oppNextE >= 8) oppAoeRisk++;
  if (aoe.brawler && oppSt.hp <= 12 && oppNextE >= 4) oppAoeRisk++;
  if (aoe.tear && oppNextE >= 3) oppAoeRisk++;
  if (aoe.drummer && oppNextE >= 5 && (oppSt.bones || 0) >= 4) oppAoeRisk++;

  // 预判对手【狂暴女拳师】压血阈值 (血量 < 10 触发4伤AOE)
  const avoidTriggerBrawler = Boolean(aoe.brawler && oppSt.hp >= 10 && oppSt.hp <= 13);

  const oppDeadBigDragon = (oppSt.graveyard || []).some(g => g && g.type === 'minion' && getInitialCountdown(g) > 0 && g.atk >= 5);
  const oppLwNear10 = (oppSt.destroyedLastWordsCount || 0) >= 8;
  const oppGuardNearThreshold = (oppSt.destroyedGuardCount || 0) === 4 || (oppSt.destroyedGuardCount || 0) === 9;

  return {
    intel, tempoRole, inDanger, oppAoeRisk, avoidTriggerBrawler,
    oppDeadBigDragon, oppLwNear10, oppGuardNearThreshold,
    oppPublicBurn, oppPublicSheep, oppMechBoard, myBoardCount, oppBoardCount,
    myBoardAtk, oppBoardAtk, oppNextE
  };
}

