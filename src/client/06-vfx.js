let sleep = (ms) => new Promise(res => setTimeout(res, ms <= 0 ? 0 : Math.max(16, Math.round(ms / (window.CF_BATTLE_SPEED || 1)))));

function isLeftSideUiConflictActive() {
  const pendingBox = document.getElementById('pendingLeftTopContainer');
  if (pendingBox && !pendingBox.classList.contains('hidden')) return true;
  return false;
}

function closeCardDetailIfConflict() {
  if (battle.inspectedCard) {
    battle.inspectedCard = null;
    const panel = document.getElementById('svDetailPanel');
    if (panel) panel.classList.add('hidden');
  }
}

// 私密提示：只应让行动方本人看到具体卡面（例如从牌库检索到的卡）。服务器会对另一方隐藏卡名与卡图。
let cfToastPrivacyDepth = 0;
let cfToastPublicText = '';
async function cfPrivateToast(cardData, text, waitMs, publicText = '对手发动了一个不公开的效果') {
  cfToastPrivacyDepth++;
  const prevPub = cfToastPublicText;
  cfToastPublicText = publicText;
  try { return await showTriggeredEffectToast(cardData, text, waitMs); } finally { cfToastPrivacyDepth--; cfToastPublicText = prevPub; }
}

function recordBattleTurnEvent(side, kind, text, cardData = null, isPrivate = false) {
  if (typeof battle === 'undefined' || !battle) return;
  if (!Array.isArray(battle.turnLogs)) battle.turnLogs = [];
  const tNum = battle.turn || 1;
  const s = (side === 0 || side === 1) ? side : (battle.activeSide || 0);
  let grp = battle.turnLogs[battle.turnLogs.length - 1];
  if (!grp || grp.turn !== tNum || grp.side !== s) {
    grp = { turn: tNum, side: s, events: [] };
    battle.turnLogs.push(grp);
    if (battle.turnLogs.length > 80) battle.turnLogs.shift();
  }
  const cleanText = String(text || '').trim();
  if (!cleanText) return;
  const last = grp.events[grp.events.length - 1];
  if (last && last.kind === kind && last.text === cleanText && last.cardName === (cardData?.name || '')) return;
  grp.events.push({
    kind,
    priv: isPrivate ? 1 : undefined,
    pub: isPrivate ? String(isPrivate === true ? '对手发动了一个不公开的效果' : isPrivate) : undefined,
    text: cleanText,
    cardId: (cardData && cardData.id && typeof cardsById !== 'undefined' && cardsById[cardData.id]) ? cardData.id : '',
    cardName: (cardData && cardData.name) ? cardData.name : ''
  });
  if (typeof renderBattleRecordPanel === 'function') {
    const p = document.getElementById('battleRecordPanel');
    if (p && !p.classList.contains('hidden')) renderBattleRecordPanel();
  }
}

async function showTriggeredEffectToast(cardData, triggeredClauseText, waitMs = 380, sourceSide = -1, sourceLane = -1) {
  const activeOrSourceSide = (sourceSide === 0 || sourceSide === 1)
    ? sourceSide
    : ((typeof battle !== 'undefined' && battle) ? (battle.activeSide ?? 0) : 0);
  const _isPrivateToast = cfToastPrivacyDepth > 0;
  if (cardData && cardData.id !== 'sys_notice') {
    recordBattleTurnEvent(activeOrSourceSide, 'effect', triggeredClauseText, cardData, _isPrivateToast ? cfToastPublicText : false);
  }
  if (typeof recordLocalVfx === 'function') {
    const cid = (cardData && cardData.id) ? cardData.id : 'sys_notice';
    if (cid !== 'sys_fusion') {
      recordLocalVfx({ kind: 'toast', side: activeOrSourceSide, cid, cardData: (cid && typeof cardsById !== 'undefined' && cardsById[cid]) ? null : cardData, msg: triggeredClauseText, priv: _isPrivateToast || undefined, pub: _isPrivateToast ? cfToastPublicText : undefined });
    }
  }
  // 精确锁定单张触发效果的卡牌播放脉冲动画，绝不让己方或敌方同名卡一起闪
  if (cardData && cardData.id && typeof battle !== 'undefined' && battle.board) {
    const triggerPulse = (s, l) => {
      const cell = getLaneDOM(s, l);
      if (cell && cell.firstElementChild) {
        cell.firstElementChild.classList.remove('sv-effect-source-pulse');
        void cell.firstElementChild.offsetWidth;
        cell.firstElementChild.classList.add('sv-effect-source-pulse');
        setTimeout(() => cell.firstElementChild?.classList.remove('sv-effect-source-pulse'), 950);
      }
    };
    if (sourceLane >= 0 && sourceLane < 5 && battle.board[activeOrSourceSide]?.[sourceLane]) {
      triggerPulse(activeOrSourceSide, sourceLane);
    } else if (battle._activeSourceRef && battle._activeSourceRef.cardId === cardData.id && battle._activeSourceRef.lane >= 0 && battle._activeSourceRef.lane < 5) {
      const ref = battle._activeSourceRef;
      const bm = battle.board[ref.side]?.[ref.lane];
      if (bm && bm.data && bm.data.id === cardData.id) {
        triggerPulse(ref.side, ref.lane);
      }
    } else {
      for (let l = 0; l < 5; l++) {
        const bm = battle.board[activeOrSourceSide]?.[l];
        if (bm && bm.data && bm.data.id === cardData.id) {
          triggerPulse(activeOrSourceSide, l);
          break;
        }
      }
    }
  }
  const feed = document.getElementById('svEffectFeed');
  if (!feed) return;
  const item = document.createElement('div');
  item.className = 'sv-effect-toast rounded-r-xl px-4 py-3 lg:px-6 lg:py-4 flex items-center gap-3 lg:gap-4 w-[320px] lg:w-[500px] text-xs lg:text-base';
  const imgUri = getAnimeIllustrationDataURI(cardData);
  item.innerHTML = `
    <div class="w-12 h-12 lg:w-20 lg:h-20 rounded-xl overflow-hidden border-2 border-amber-400 shrink-0 shadow-lg">
      <img src="${escapeHtml(imgUri)}" class="w-full h-full object-cover" alt="${escapeHtml(cardData.name)}"/>
    </div>
    <div class="flex flex-col min-w-0 flex-1">
      <div class="text-sm lg:text-lg font-black text-amber-300 truncate">${escapeHtml(cardData.name)}</div>
      <div class="text-xs lg:text-base text-slate-100 leading-snug sv-toast-desc-clamp">${escapeHtml(triggeredClauseText)}</div>
    </div>
  `;
  feed.appendChild(item);
  while (feed.children.length > 3) {
    feed.removeChild(feed.firstElementChild);
  }
  setTimeout(() => {
    item.style.opacity = '0';
    item.style.transition = 'opacity 0.25s ease';
    setTimeout(() => item.remove(), 260);
  }, 4200);
  if (waitMs > 0) await sleep(waitMs);
}

async function playRowWideVFX(targetSide, vfxType = 'fire_aoe', duration = 460) {
  if (typeof recordLocalVfx === 'function') recordLocalVfx({ kind: 'row_vfx', side: targetSide, vfxKind: vfxType });
  const rowEl = document.getElementById(targetSide === 0 ? 'playerLanesRow' : 'enemyLanesRow');
  if (!rowEl) return;
  const r = rowEl.getBoundingClientRect();
  const svg = document.getElementById('fxSvgOverlay');
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;

  let color = '#f97316';
  let stroke = '#fde047';
  if (vfxType === 'destroy_wave') { color = '#a855f7'; stroke = '#f43f5e'; }
  else if (vfxType === 'buff_wave') { color = '#10b981'; stroke = '#fde047'; }

  g.innerHTML = `
    <ellipse cx="${cx}" cy="${cy}" rx="${r.width * 0.52}" ry="${r.height * 0.45}" fill="${color}" fill-opacity="0.28" stroke="${stroke}" stroke-width="4"/>
    <line x1="${r.left}" y1="${cy}" x2="${r.right}" y2="${cy}" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
  `;
  svg.appendChild(g);
  sfx.play(vfxType === 'buff_wave' ? 'synergy' : 'hit');
  await sleep(duration);
  g.remove();
}

function spawnImpactRing(x, y, color = '#fde047') {
  const ring = document.createElement('div');
  ring.className = 'sv-impact-ring';
  ring.style.left = `${x}px`;
  ring.style.top = `${y}px`;
  ring.style.borderColor = color;
  document.body.appendChild(ring);
  setTimeout(() => ring.remove(), 440);
}

async function playMeleeImpactVFX(targetEl, color = '#f43f5e') {
  if (!targetEl || typeof targetEl.getBoundingClientRect !== 'function') { await sleep(120); return; }
  const r = targetEl.getBoundingClientRect();
  if (!r || r.width === 0) { await sleep(120); return; }
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const slash = document.createElement('div');
  slash.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;width:96px;height:14px;background:linear-gradient(90deg,transparent,${color},#fff,transparent);border-radius:999px;pointer-events:none;z-index:120;box-shadow:0 0 18px ${color};`;
  document.body.appendChild(slash);
  if (slash.animate) {
    slash.animate([
      { transform: 'translate(-50%,-50%) rotate(-38deg) scaleX(0.2)', opacity: 1 },
      { transform: 'translate(-50%,-50%) rotate(-38deg) scaleX(1.35)', opacity: 0.95, offset: 0.45 },
      { transform: 'translate(-50%,-50%) rotate(-38deg) scaleX(1.6)', opacity: 0 }
    ], { duration: 240, easing: 'ease-out' });
  }
  setTimeout(() => slash.remove(), 260);
  await sleep(110);
}

async function playAoeShockwaveVFX(targetSide, color = '#f97316', label = '') {
  const rowEl = document.getElementById(targetSide === 0 ? 'playerLanesRow' : 'enemyLanesRow');
  if (!rowEl || typeof rowEl.getBoundingClientRect !== 'function') { await sleep(260); return; }
  const r = rowEl.getBoundingClientRect();
  if (!r || r.width === 0) { await sleep(260); return; }
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const flash = document.createElement('div');
  flash.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;border-radius:16px;background:${color}33;border:2px solid ${color};box-shadow:inset 0 0 36px ${color};pointer-events:none;z-index:114;`;
  document.body.appendChild(flash);
  if (flash.animate) flash.animate([{ opacity: 0.95 }, { opacity: 0 }], { duration: 760, easing: 'ease-out' });
  setTimeout(() => flash.remove(), 780);
  [0, 140].forEach(delay => {
    setTimeout(() => {
      const wave = document.createElement('div');
      wave.className = 'sv-aoe-shockwave';
      wave.style.cssText = `left:${cx}px;top:${cy}px;width:220px;height:110px;border:6px solid ${color};box-shadow:0 0 34px ${color}, inset 0 0 26px ${color};`;
      document.body.appendChild(wave);
      setTimeout(() => wave.remove(), 860);
    }, delay);
  });
  if (label) {
    const badge = document.createElement('div');
    badge.textContent = label;
    badge.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;transform:translate(-50%,-50%);color:#fff;font-weight:900;font-size:18px;padding:4px 12px;border-radius:999px;background:rgba(15,23,42,0.82);border:1px solid ${color};text-shadow:0 2px 12px ${color};pointer-events:none;z-index:122;`;
    document.body.appendChild(badge);
    if (badge.animate) badge.animate([{ opacity: 1, transform: 'translate(-50%,-50%) scale(0.92)' }, { opacity: 1, transform: 'translate(-50%,-65%) scale(1.08)', offset: 0.6 }, { opacity: 0, transform: 'translate(-50%,-90%) scale(1.12)' }], { duration: 820 });
    setTimeout(() => badge.remove(), 840);
  }
  await sleep(520);
}

async function playLeaderDamageTypeVFX(targetSide, kind = 'effect') {
  const box = getLeaderHpBoxDOM(targetSide);
  if (!box || typeof box.getBoundingClientRect !== 'function') return;
  const r = box.getBoundingClientRect();
  if (!r || r.width === 0) return;
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  if (kind === 'combat') {
    await playMeleeImpactVFX(box, '#f43f5e');
  } else {
    const col = kind === 'crest' ? '#fbbf24' : '#a855f7';
    const ring = document.createElement('div');
    ring.className = 'sv-aoe-shockwave';
    ring.style.cssText = `left:${cx}px;top:${cy}px;width:88px;height:88px;border:4px solid ${col};box-shadow:0 0 26px ${col}, inset 0 0 18px ${col};`;
    document.body.appendChild(ring);
    const sig = document.createElement('div');
    sig.textContent = kind === 'crest' ? '🛡️纹章效果伤' : '✨效果伤害';
    sig.style.cssText = `position:fixed;left:${cx}px;top:${cy - 28}px;transform:translate(-50%,-50%);color:${col};font-weight:900;font-size:12px;text-shadow:0 2px 8px #000;pointer-events:none;z-index:122;`;
    document.body.appendChild(sig);
    if (sig.animate) sig.animate([{ opacity: 1, transform: 'translate(-50%,-50%) scale(0.9)' }, { opacity: 0, transform: 'translate(-50%,-90%) scale(1.1)' }], { duration: 520 });
    setTimeout(() => { ring.remove(); sig.remove(); }, 580);
  }
}

async function playDestroyShatterVFX(side, lane, isSacrifice = false) {
  const cell = getLaneDOM(side, lane);
  if (!cell || typeof cell.getBoundingClientRect !== 'function') return;
  const r = cell.getBoundingClientRect();
  if (!r || r.width === 0) return;
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const burst = document.createElement('div');
  burst.className = 'sv-destroy-vfx';
  const col = isSacrifice ? '#fb7185' : '#f97316';
  burst.textContent = isSacrifice ? '🩸' : '💥';
  burst.style.cssText = `left:${cx}px;top:${cy}px;font-size:38px;filter:drop-shadow(0 0 14px ${col});`;
  document.body.appendChild(burst);
  setTimeout(() => burst.remove(), 540);
}

async function playDeckToBoardInvocationVFX(side, targetLane, cardData) {
  const deckEl = document.getElementById(side === 0 ? 'playerDeckSlot' : 'enemyDeckSlot') || getLaneDOM(side, -1);
  const targetCell = getLaneDOM(side, targetLane);
  if (deckEl && targetCell && typeof deckEl.getBoundingClientRect === 'function' && typeof targetCell.getBoundingClientRect === 'function') {
    const dr = deckEl.getBoundingClientRect();
    const tr = targetCell.getBoundingClientRect();
    if (dr.width > 0 && tr.width > 0) {
      const sx = dr.left + dr.width / 2, sy = dr.top + dr.height / 2;
      const tx = tr.left + tr.width / 2, ty = tr.top + tr.height / 2;
      const deckRing = document.createElement('div');
      deckRing.className = 'sv-aoe-shockwave';
      deckRing.style.cssText = `left:${sx}px;top:${sy}px;width:82px;height:110px;border:5px solid #38bdf8;box-shadow:0 0 28px #38bdf8, inset 0 0 20px #38bdf8;`;
      document.body.appendChild(deckRing);
      const deckTag = document.createElement('div');
      deckTag.textContent = '📖 牌库瞬念!';
      deckTag.style.cssText = `position:fixed;left:${sx}px;top:${sy - 38}px;transform:translate(-50%,-50%);color:#7dd3fc;font-weight:900;font-size:13px;background:rgba(15,23,42,0.88);padding:2px 8px;border-radius:999px;border:1px solid #38bdf8;pointer-events:none;z-index:126;`;
      document.body.appendChild(deckTag);
      setTimeout(() => { deckRing.remove(); deckTag.remove(); }, 850);
      await sleep(260);

      const flyer = document.createElement('div');
      flyer.style.cssText = `position:fixed;left:${sx}px;top:${sy}px;width:88px;height:120px;border-radius:12px;border:2px solid #7dd3fc;background:linear-gradient(135deg,#0284c7,#312e81);box-shadow:0 0 32px #38bdf8;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:12px;text-align:center;padding:6px;pointer-events:none;z-index:125;transform:translate(-50%,-50%);`;
      flyer.innerHTML = `<div style="color:#fde047;font-size:11px;margin-bottom:4px;">🌟 瞬念召唤</div><div>${cardData ? cardData.name : ''}</div>`;
      document.body.appendChild(flyer);
      const dx = tx - sx, dy = ty - sy;
      if (flyer.animate) {
        flyer.animate([
          { transform: 'translate(-50%,-50%) scale(0.55)', opacity: 0.8 },
          { transform: `translate(calc(-50% + ${dx*0.5}px), calc(-50% + ${dy*0.5}px)) scale(1.22)`, opacity: 1, offset: 0.5 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1.0)`, opacity: 1 }
        ], { duration: 640, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
      }
      await sleep(650);
      flyer.remove();

      const landRing = document.createElement('div');
      landRing.className = 'sv-aoe-shockwave';
      landRing.style.cssText = `left:${tx}px;top:${ty}px;width:96px;height:128px;border:5px solid #fde047;box-shadow:0 0 32px #fde047, inset 0 0 22px #38bdf8;`;
      document.body.appendChild(landRing);
      setTimeout(() => landRing.remove(), 860);
      await sleep(340);
      return;
    }
  }
  await sleep(300);
}

async function playBoardToHandBounceVFX(side, fromLane, cardData) {
  const fromCell = getLaneDOM(side, fromLane);
  const handEl = document.getElementById(side === 0 ? 'playerHandZone' : 'enemyHandBacks') || getLaneDOM(side, -1);
  if (fromCell && handEl && typeof fromCell.getBoundingClientRect === 'function' && typeof handEl.getBoundingClientRect === 'function') {
    const fr = fromCell.getBoundingClientRect();
    const hr = handEl.getBoundingClientRect();
    if (fr.width > 0 && hr.width > 0) {
      const flyer = document.createElement('div');
      flyer.style.cssText = `position:fixed;left:${fr.left + fr.width/2}px;top:${fr.top + fr.height/2}px;width:72px;height:98px;border-radius:10px;border:2px solid #fbbf24;background:linear-gradient(135deg,#0284c7,#1e293b);box-shadow:0 0 24px #fbbf24;display:flex;align-items:center;justify-content:center;color:#fef08a;font-weight:900;font-size:11px;text-align:center;padding:4px;pointer-events:none;z-index:125;transform:translate(-50%,-50%);`;
      flyer.textContent = `↩️回手
${cardData ? cardData.name : ''}`;
      document.body.appendChild(flyer);
      const dx = (hr.left + hr.width/2) - (fr.left + fr.width/2);
      const dy = (hr.top + hr.height/2) - (fr.top + fr.height/2);
      if (flyer.animate) {
        flyer.animate([
          { transform: 'translate(-50%,-50%) scale(1.05)', opacity: 1 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.55)`, opacity: 0.75 }
        ], { duration: 400, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
      }
      await sleep(410);
      flyer.remove();
      return;
    }
  }
  await sleep(180);
}

async function playSynergyBeam(fromEl, toEl, color = '#38bdf8', duration = 340) {
  if (typeof recordLocalVfx === 'function' && fromEl && toEl) {
    const _resolveNode = (el) => {
      if (!el) return null;
      if (el.id === 'playerLeaderNode') return { side: 0, lane: -1 };
      if (el.id === 'enemyLeaderNode' || el.id === 'enemyAvatarCanvasWrap') return { side: 1, lane: -1 };
      const laneEl = el.closest ? el.closest('[data-side][data-lane]') : null;
      if (laneEl) return { side: parseInt(laneEl.dataset.side, 10), lane: parseInt(laneEl.dataset.lane, 10) };
      return null;
    };
    const _f = _resolveNode(fromEl);
    const _t = _resolveNode(toEl);
    if (_f && _t) recordLocalVfx({ kind: 'beam', fromSide: _f.side, fromLane: _f.lane, toSide: _t.side, toLane: _t.lane, color });
  }
  if (!fromEl || !toEl) return;
  const r1 = fromEl.getBoundingClientRect();
  const r2 = toEl.getBoundingClientRect();
  const x1 = r1.left + r1.width / 2, y1 = r1.top + r1.height / 2;
  const x2 = r2.left + r2.width / 2, y2 = r2.top + r2.height / 2;
  const dist = Math.max(10, Math.hypot(x2 - x1, y2 - y1));

  const svg = document.getElementById('fxSvgOverlay');
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.innerHTML = `
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="8" stroke-linecap="round" opacity="0.52" stroke-dasharray="${dist}" stroke-dashoffset="${dist}"/>
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="${dist}" stroke-dashoffset="${dist}"/>
  `;
  svg.appendChild(g);
  const lines = g.querySelectorAll('line');
  const travelMs = Math.max(110, Math.min(200, Math.floor(duration * 0.55)));
  lines.forEach(ln => {
    if (ln.animate) {
      ln.animate([
        { strokeDashoffset: dist, opacity: 0.9 },
        { strokeDashoffset: 0, opacity: 1 }
      ], { duration: travelMs, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' });
    }
  });
  sfx.play('synergy');
  await sleep(travelMs);
  spawnImpactRing(x2, y2, color);
  const targetToken = toEl.firstElementChild || toEl;
  if (targetToken && targetToken.classList) {
    targetToken.classList.remove('sv-hit-flash');
    void targetToken.offsetWidth;
    targetToken.classList.add('sv-hit-flash');
    setTimeout(() => targetToken.classList?.remove('sv-hit-flash'), 360);
  }
  await sleep(Math.max(60, duration - travelMs));
  g.remove();
}

function getLaneDOM(side, lane) {
  if (lane === -1) {
    return document.getElementById(side === 0 ? 'playerLeaderNode' : 'enemyLeaderNode');
  }
  const row = document.getElementById(side === 0 ? 'playerLanesRow' : 'enemyLanesRow');
  return row ? row.children[lane] : null;
}

function getLeaderHpBoxDOM(side) {
  const hpEl = document.getElementById(side === 0 ? 'uiPlayerHp' : 'uiEnemyHp');
  return (hpEl && hpEl.closest) ? hpEl.closest('.sv-leader-hp-box') : getLaneDOM(side, -1);
}

function spawnFloatNumber(side, lane, text, color = '#fde047') {
  const target = lane === -1 ? getLeaderHpBoxDOM(side) : getLaneDOM(side, lane);
  if (!target) return;
  const r = target.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'sv-float-num sv-float-dmg-pop text-2xl';
  el.style.color = color;
  el.style.left = `${r.left + r.width / 2}px`;
  el.style.top = `${r.top + r.height / 3}px`;
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 920);
}

