// ============================================================================
// v32 联机全量特效队列重放 + 斩杀慢动作 + 主战者表情 + 局内聊天
// ============================================================================
OnlineState.recordedVfx = [];

function recordLocalVfx(ev) {
  if (battleMode === 'pvp_online' && OnlineState.inMatch && onlineIsMyTurn() && !OnlineState._replayingVfx) {
    OnlineState.recordedVfx.push(ev);
  }
}

async function replayRecordedVfxList(vfxList) {
  if (!Array.isArray(vfxList) || vfxList.length === 0) return;
  OnlineState._replayingVfx = true;
  try {
    for (const ev of vfxList) {
      const mSide = ev.side === 0 ? 1 : 0;
      if (ev.kind === 'attack_strike') {
        const mToSide = 1 - mSide;
        const atkCell = getLaneDOM(mSide, ev.fromLane);
        const atkToken = atkCell ? (atkCell.querySelector('.sv-follower-token') || atkCell.firstElementChild) : null;
        const targetEl = ev.hitLeader
          ? document.getElementById(mToSide === 0 ? 'playerLeaderNode' : 'enemyLeaderNode')
          : getLaneDOM(mToSide, ev.toLane);

        const doLunge = async () => {
          sfx.play('attack');
          if (atkToken && targetEl) {
            const ar = atkToken.getBoundingClientRect();
            const tr = targetEl.getBoundingClientRect();
            const dx = (tr.left + tr.width / 2) - (ar.left + ar.width / 2);
            const dy = (tr.top + tr.height / 2) - (ar.top + ar.height / 2);
            const pullX = -dx * (ev.lethal ? 0.12 : 0.08);
            const pullY = -dy * (ev.lethal ? 0.12 : 0.08);
            const strikeX = dx * (ev.lethal ? 0.54 : 0.46);
            const strikeY = dy * (ev.lethal ? 0.54 : 0.46);
            const animDur = ev.lethal ? 680 : 340;
            atkToken.style.zIndex = '60';
            atkToken.animate([
              { transform: 'translate3d(0, 0, 0) scale(1)', offset: 0 },
              { transform: `translate3d(${pullX.toFixed(1)}px, ${pullY.toFixed(1)}px, 0) scale(${ev.lethal ? 1.12 : 1.06})`, offset: 0.28 },
              { transform: `translate3d(${strikeX.toFixed(1)}px, ${strikeY.toFixed(1)}px, 0) scale(${ev.lethal ? 1.24 : 1.14})`, offset: 0.65 },
              { transform: 'translate3d(0, 0, 0) scale(1)', offset: 1 }
            ], { duration: animDur, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
            await sleep(ev.lethal ? 360 : 175);
            atkToken.style.zIndex = '';
          } else if (atkToken) {
            atkToken.style.transform = mSide === 1 ? 'translateY(32px) scale(1.12)' : 'translateY(-32px) scale(1.12)';
            await sleep(170);
            atkToken.style.transform = '';
          }
          sfx.play('hit');
          if (ev.hitLeader) {
            if (targetEl) {
              targetEl.animate([
                { transform: 'translateX(-50%) scale(1)' },
                { transform: 'translateX(calc(-50% + 7px)) scale(0.95)' },
                { transform: 'translateX(calc(-50% - 7px)) scale(0.96)' },
                { transform: 'translateX(-50%) scale(1)' }
              ], { duration: 240 });
            }
            if (ev.dmg > 0) spawnFloatNumber(mToSide, -1, `-${ev.dmg}`, '#fb7185');
          } else if (ev.toLane >= 0) {
            if (typeof playMeleeImpactVFX === 'function') await playMeleeImpactVFX(targetEl, '#fbbf24');
            if (ev.dmg > 0) spawnFloatNumber(mToSide, ev.toLane, `-${ev.dmg}`, '#fb7185');
          }
        };

        if (ev.lethal && typeof playLethalSlowMotion === 'function') {
          await playLethalSlowMotion(mToSide, ev.dmg, doLunge);
        } else {
          await doLunge();
        }
        await sleep(110);
      } else if (ev.kind === 'beam') {
        const mfSide = ev.fromSide === 0 ? 1 : 0;
        const mtSide = ev.toSide === 0 ? 1 : 0;
        const fEl = ev.fromLane >= 0 ? getLaneDOM(mfSide, ev.fromLane) : document.getElementById(mfSide === 0 ? 'playerLeaderNode' : 'enemyLeaderNode');
        const tEl = ev.toLane >= 0 ? getLaneDOM(mtSide, ev.toLane) : document.getElementById(mtSide === 0 ? 'playerLeaderNode' : 'enemyLeaderNode');
        if (fEl && tEl) await playSynergyBeam(fEl, tEl, ev.color || '#38bdf8', 300);
      } else if (ev.kind === 'dmg_leader') {
        sfx.play('hit');
        if (ev.dmg > 0) spawnFloatNumber(mSide, -1, `-${ev.dmg}`, '#fb7185');
      } else if (ev.kind === 'heal_leader') {
        sfx.play('heal');
        if (ev.amount > 0) spawnFloatNumber(mSide, -1, `+${ev.amount}`, '#4ade80');
      } else if (ev.kind === 'row_vfx') {
        await playRowWideVFX(mSide, ev.vfxKind, 280);
      } else if (ev.kind === 'sac_vfx') {
        if (typeof playSacrificeBloodRitualSVG === 'function') await playSacrificeBloodRitualSVG(mSide, ev.lane);
      } else if (ev.kind === 'lw_vfx') {
        if (typeof playLastWordsTriggerVFX === 'function') await playLastWordsTriggerVFX(mSide, ev.lane, ev.name || '');
      } else if (ev.kind === 'crest_vfx') {
        if (typeof playCrestTriggerVFX === 'function') await playCrestTriggerVFX(mSide, ev.crestId);
      } else if (ev.kind === 'toast' && ev.cid) {
        const cd = cardsById[ev.cid] || ev.cardData;
        if (cd) await showTriggeredEffectToast(cd, ev.msg || '', 260);
      }
    }
  } finally {
    OnlineState._replayingVfx = false;
  }
}

// 斩杀最后一击慢动作特写（命中瞬间触发，先定格特写再结算致命伤害）
async function playLethalSlowMotion(targetSide, dmg = 0, onImpact = null) {
  const ov = document.getElementById('lethalSlowmoOverlay');
  const sideCls = targetSide === 1 ? 'lethal-slowmo-top' : 'lethal-slowmo-bot';
  document.body.classList.add('lethal-slowmo', sideCls);
  if (ov) ov.classList.remove('hidden');
  sfx.play('legend');
  await sleep(780);
  if (typeof onImpact === 'function') await onImpact();
  await sleep(1450);
  if (ov) ov.classList.add('hidden');
  document.body.classList.remove('lethal-slowmo', 'lethal-slowmo-top', 'lethal-slowmo-bot');
}

// 主战者表情系统
const LEADER_EMOTES = [
  '👋 哈喽家人们，开打！',
  '🤯 6，这波操作有点东西',
  '🤔 别急，大脑过载思考中...',
  '💦 汗流浃背了吧老弟',
  '🔥 优势在我！这把稳了',
  '😂 绷不住了，笑死我了',
  '🫠 好好好，这么玩是吧',
  '💢 我直接红温，接招吧！'
];

function showLeaderEmoteBubble(side, text) {
  const anchor = document.getElementById(side === 0 ? 'playerLeaderNode' : 'enemyLeaderNode');
  if (!anchor || !text) return;
  const old = anchor.querySelector('.sv-emote-bubble');
  if (old) old.remove();
  const b = document.createElement('div');
  b.className = 'sv-emote-bubble';
  b.style.cssText = side === 0
    ? 'bottom:164px;left:50%;transform:translateX(-50%);'
    : 'top:164px;left:50%;transform:translateX(-50%);border-color:#f43f5e;';
  b.textContent = text;
  anchor.appendChild(b);
  setTimeout(() => b.remove(), 3000);
}

(function initEmoteAndChatUI() {
  const picker = document.getElementById('leaderEmotePicker');
  if (picker) {
    picker.innerHTML = '';
    LEADER_EMOTES.forEach(txt => {
      const btn = document.createElement('button');
      btn.textContent = txt;
      btn.style.cssText = 'padding:7px 10px;border-radius:10px;background:#1e293b;color:#f8fafc;border:1px solid #475569;font-size:12px;font-weight:800;text-align:left;cursor:pointer;';
      btn.onclick = (e) => {
        e.stopPropagation();
        picker.classList.add('hidden');
        sfx.play('click');
        showLeaderEmoteBubble(0, txt);
        if (battleMode === 'pvp_online' && OnlineState.roomId) {
          sendRoomPacket({ type: 'LEADER_EMOTE', text: txt });
        }
      };
      picker.appendChild(btn);
    });
  }
  const leaderEl = document.getElementById('playerLeaderNode');
  leaderEl?.addEventListener('mousedown', (e) => { e.stopPropagation(); });
  leaderEl?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!picker) return;
    picker.classList.toggle('hidden');
  });
  picker?.addEventListener('mousedown', (e) => { e.stopPropagation(); });
  window.addEventListener('click', () => picker?.classList.add('hidden'));

  const chatWidget = document.getElementById('inGameChatWidget');
  const chatPanel = document.getElementById('inGameChatPanel');
  const chatMsgs = document.getElementById('inGameChatMessages');
  const chatInput = document.getElementById('inGameChatInput');
  const unreadDot = document.getElementById('chatUnreadDot');

  window.appendInGameChatMessage = (sender, text, isMe) => {
    if (!chatMsgs) return;
    const row = document.createElement('div');
    row.style.cssText = `padding:5px 8px;border-radius:8px;background:${isMe ? 'rgba(14,116,144,0.45)' : 'rgba(30,41,59,0.85)'};color:#f1f5f9;align-self:${isMe ? 'flex-end' : 'flex-start'};max-width:88%;word-break:break-word;`;
    row.innerHTML = `<b style="color:${isMe ? '#67e8f9' : '#fde047'};">${escapeHtml(sender)}：</b>${escapeHtml(text)}`;
    chatMsgs.appendChild(row);
    chatMsgs.scrollTop = chatMsgs.scrollHeight;
    if (!isMe && chatPanel && chatPanel.classList.contains('hidden')) {
      unreadDot?.classList.remove('hidden');
    }
  };

  document.getElementById('btnToggleInGameChat')?.addEventListener('click', (e) => {
    e.stopPropagation();
    chatPanel?.classList.toggle('hidden');
    unreadDot?.classList.add('hidden');
  });
  document.getElementById('btnCloseInGameChat')?.addEventListener('click', () => chatPanel?.classList.add('hidden'));

  window.showLeaderChatBubble = (side, sender, text) => {
    const anchor = document.getElementById(side === 0 ? 'playerLeaderNode' : 'enemyLeaderNode');
    if (!anchor || !text) return;
    const old = anchor.querySelector('.sv-chat-bubble');
    if (old) old.remove();
    const b = document.createElement('div');
    b.className = 'sv-chat-bubble';
    b.style.cssText = side === 0
      ? 'bottom:168px;left:50%;transform:translateX(-50%);border-color:#38bdf8;'
      : 'top:168px;left:50%;transform:translateX(-50%);border-color:#f43f5e;';
    b.innerHTML = `<span style="color:${side === 0 ? '#7dd3fc' : '#fda4af'};">${escapeHtml(sender)}：</span>${escapeHtml(text)}`;
    anchor.appendChild(b);
    setTimeout(() => b.remove(), 3800);
  };

  const sendChat = () => {
    const val = (chatInput?.value || '').trim();
    if (!val) return;
    chatInput.value = '';
    const myName = OnlineState.nickname || '我';
    window.appendInGameChatMessage(myName, val, true);
    window.showLeaderChatBubble(0, myName, val);
    if (battleMode === 'pvp_online' && OnlineState.roomId) {
      sendRoomPacket({ type: 'CHAT_MSG', sender: OnlineState.nickname || '对手', text: val });
    }
  };
  document.getElementById('btnSendInGameChat')?.addEventListener('click', sendChat);
  chatInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendChat(); });

  window.syncChatWidgetVisibility = () => {
    if (chatWidget) chatWidget.classList.toggle('hidden', battleMode !== 'pvp_online' || !OnlineState.inMatch);
  };
})();


