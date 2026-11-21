// ============================================================================
// v1.30 商业化体验增强模块：
//   1) 直觉化曲线瞄准箭头（拖拽出牌 / 选择目标 / 献祭 / 启动）
//   2) 回合结束「战局预览 & 斩杀预警」实时推演
//   3) 顶部倍速控制胶囊 (1x/1.5x/2x) + 观战切换 + 键盘快捷键 (Space/Esc/V)
//   4) 治疗/强化直觉扩散光环 VFX
//   5) 卡组编辑器实时费用曲线柱状图与构成统计
// ============================================================================
;(function initCommercialUXPack() {
  if (typeof document === 'undefined') return;

  // ---------- 1. 曲线瞄准箭头 SVG ----------
  let arrowSvg = document.getElementById('cfTargetArrowSvg');
  if (!arrowSvg) {
    arrowSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    arrowSvg.id = 'cfTargetArrowSvg';
    arrowSvg.style.display = 'none';
    arrowSvg.innerHTML = `
      <defs>
        <marker id="cfArrowHead" markerWidth="10" markerHeight="10" refX="7" refY="3.5" orient="auto">
          <polygon points="0 0, 9 3.5, 0 7" fill="currentColor" />
        </marker>
      </defs>
      <path id="cfTargetArrowPath" d="" marker-end="url(#cfArrowHead)" />
    `;
    document.body.appendChild(arrowSvg);
  }
  const arrowPath = document.getElementById('cfTargetArrowPath');
  let arrowOrigin = null;

  function updateTargetArrow(clientX, clientY, color = '#38bdf8') {
    if (!arrowOrigin || !arrowSvg || !arrowPath) return;
    const x1 = arrowOrigin.x, y1 = arrowOrigin.y;
    const x2 = clientX, y2 = clientY;
    const dx = x2 - x1, dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    if (dist < 28) { arrowSvg.style.display = 'none'; return; }
    const cx = (x1 + x2) * 0.5;
    const cy = Math.min(y1, y2) - Math.min(110, dist * 0.28);
    arrowSvg.style.display = 'block';
    arrowSvg.style.color = color;
    arrowPath.setAttribute('stroke', color);
    arrowPath.setAttribute('d', `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`);
  }
  function hideTargetArrow() {
    if (arrowSvg) arrowSvg.style.display = 'none';
    arrowOrigin = null;
  }

  document.addEventListener('pointerdown', (e) => {
    const cardEl = e.target && e.target.closest ? e.target.closest('#playerHandZone .hand-card, #playerHandZone [data-hand-idx], #playerHandZone > *') : null;
    if (cardEl && typeof battle !== 'undefined' && battle && !battle.gameOver && battle.turnSide === 0) {
      const r = cardEl.getBoundingClientRect();
      arrowOrigin = { x: r.left + r.width / 2, y: r.top + r.height * 0.35 };
    }
  }, true);

  document.addEventListener('pointermove', (e) => {
    if (typeof battle === 'undefined' || !battle || battle.gameOver || battle.animating) { hideTargetArrow(); return; }
    // 情况 A：处于【启动】选目标等待状态
    if (battle.pendingActivate && battle.pendingActivate.lane != null) {
      const srcEl = typeof getLaneDOM === 'function' ? getLaneDOM(battle.pendingActivate.side, battle.pendingActivate.lane) : null;
      if (srcEl) {
        const r = srcEl.getBoundingClientRect();
        arrowOrigin = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        updateTargetArrow(e.clientX, e.clientY, '#f43f5e');
        return;
      }
    }
    // 情况 B：仅在明确等待【指定目标 (TARGET)】时显示指向箭头；献祭 (SACRIFICE) 或已选完目标一律不显示箭头！
    if (battle.pendingPlay) {
      const step = String(battle.pendingPlay.step || '').toUpperCase();
      if (step === 'TARGET') {
        const handWrap = document.getElementById('playerHandZone');
        if (handWrap && !arrowOrigin) {
          const r = handWrap.getBoundingClientRect();
          arrowOrigin = { x: r.left + r.width / 2, y: r.top + 12 };
        }
        if (arrowOrigin) { updateTargetArrow(e.clientX, e.clientY, '#f43f5e'); return; }
      }
      hideTargetArrow();
      return;
    }
    // 情况 C：非目标锁定状态下，仅按住拖拽手牌时显示引导线
    if (arrowOrigin && (e.buttons & 1)) {
      updateTargetArrow(e.clientX, e.clientY, '#38bdf8');
    } else {
      hideTargetArrow();
    }
  }, { passive: true });
  // 点击任意棋盘格位后立即隐藏箭头，避免已指定目标后残留
  document.addEventListener('click', () => {
    if (typeof battle === 'undefined' || !battle || battle.animating) { hideTargetArrow(); return; }
    const step = battle.pendingPlay ? String(battle.pendingPlay.step || '').toUpperCase() : '';
    if (step !== 'TARGET' && !battle.pendingActivate) hideTargetArrow();
  }, true);

  document.addEventListener('pointerup', () => {
    if (typeof battle === 'undefined' || (!battle?.pendingPlay && !battle?.pendingActivate)) {
      hideTargetArrow();
    }
  }, true);

  // ---------- 2. 顶部倍速控制胶囊 & 观战切换 ----------
  let hudBar = document.getElementById('cfProHudBar');
  if (!hudBar) {
    hudBar = document.createElement('div');
    hudBar.id = 'cfProHudBar';
    window.CF_BATTLE_SPEED = 1;
    hudBar.innerHTML = `
      <button id="cfSpectateBadge" class="cf-hud-pill spectate-on hidden" title="点击退出 AI 观战并切回手动操作">🤖 AI 观战中 · 点击接管</button>
    `;
    document.body.appendChild(hudBar);
  }
  const speedBtn = document.getElementById('cfSpeedToggleBtn');
  const spectateBtn = document.getElementById('cfSpectateBadge');

  function syncHudVisibility() {
    const menu = document.getElementById('mainMenuOverlay');
    const battleScreen = document.getElementById('screenBattle');
    const inMenu = (menu && !menu.classList.contains('hidden')) || (battleScreen && battleScreen.classList.contains('hidden'));
    const isOver = typeof battle !== 'undefined' && battle && battle.gameOver;
    if (inMenu || isOver) {
      if (window.CF_SPECTATE_ACTIVE && typeof window.setCfSpectateActive === 'function') {
        window.setCfSpectateActive(false);
      }
    }
    if (hudBar) hudBar.style.display = (inMenu || !window.CF_SPECTATE_ACTIVE) ? 'none' : 'flex';
    if (speedBtn) {
      const sp = window.CF_BATTLE_SPEED || 1;
      speedBtn.textContent = `⚡ ${sp}x`;
      speedBtn.classList.toggle('speed-fast', sp > 1);
    }
    if (spectateBtn) {
      spectateBtn.classList.toggle('hidden', !window.CF_SPECTATE_ACTIVE || inMenu || isOver);
    }
  }
  function cycleBattleSpeed() {
    const cur = window.CF_BATTLE_SPEED || 1;
    const next = cur === 1 ? 1.5 : (cur === 1.5 ? 2 : 1);
    window.CF_BATTLE_SPEED = next;
    try { localStorage.setItem('cf_battle_speed', String(next)); } catch (e) {}
    syncHudVisibility();
  }
  speedBtn?.addEventListener('click', cycleBattleSpeed);
  spectateBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (typeof window.setCfSpectateActive === 'function') window.setCfSpectateActive(false);
    else window.CF_SPECTATE_ACTIVE = false;
    syncHudVisibility();
    if (typeof battle !== 'undefined' && battle && !battle.gameOver) {
      if (battle.activeSide === 0) {
        battle.animating = false;
        if (typeof renderAllBattleUI === 'function') renderAllBattleUI();
        if (typeof showToast === 'function') showToast('🎮 已接管战场！现在由你手动操作', 'success');
      } else {
        if (typeof showToast === 'function') showToast('🎮 已接管战场！敌方回合结束后将由你手动操作', 'info');
      }
    }
  });
  setInterval(syncHudVisibility, 450);

  // ---------- 3. 键盘快捷键 (Space 结束回合 / Esc 取消 / V 切倍速) ----------
  document.addEventListener('keydown', (e) => {
    const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    if (e.code === 'Escape') {
      hideTargetArrow();
      if (typeof battle !== 'undefined' && battle) {
        if (battle.pendingActivate) {
          battle.pendingActivate = null;
          if (typeof showSacrificeGuideBanner === 'function') showSacrificeGuideBanner('', '');
          if (typeof renderAllBattleUI === 'function') renderAllBattleUI();
        } else if (battle.pendingPlay && typeof cancelPendingPlayToHand === 'function') {
          cancelPendingPlayToHand();
        }
      }
      const dlg = document.getElementById('gameCustomDialogModal');
      if (dlg && !dlg.classList.contains('hidden')) {
        dlg.style.display = 'none';
        dlg.classList.add('hidden');
      }
    } else if (false && e.code === 'KeyV') {
    } else if (e.code === 'Space' && !e.repeat) {
      const menu = document.getElementById('mainMenuOverlay');
      const mull = document.getElementById('mulliganModal');
      const dlg = document.getElementById('gameCustomDialogModal');
      if ((menu && !menu.classList.contains('hidden')) || (mull && !mull.classList.contains('hidden')) || (dlg && !dlg.classList.contains('hidden'))) return;
      if (typeof battle !== 'undefined' && battle && !battle.gameOver && !battle.animating && battle.turnSide === 0 && !battle.pendingPlay && !battle.pendingActivate) {
        const endBtn = document.getElementById('btnTurnOrb');
        if (endBtn && !endBtn.disabled) {
          e.preventDefault();
          endBtn.click();
        }
      }
    }
  });

  // ---------- 4. 回合结束悬停：战局伤害预览 & 斩杀预警 ----------
  let previewTip = document.getElementById('cfCombatPreviewTip');
  if (!previewTip) {
    previewTip = document.createElement('div');
    previewTip.id = 'cfCombatPreviewTip';
    document.body.appendChild(previewTip);
  }
  let lanePreviewBadges = [];

  function clearCombatPreview() {
    if (previewTip) previewTip.classList.remove('show', 'lethal');
    lanePreviewBadges.forEach(b => b.remove());
    lanePreviewBadges = [];
  }

  function showCombatPreview() {
    clearCombatPreview();
    if (typeof battle === 'undefined' || !battle || battle.gameOver || battle.turnSide !== 0 || battle.animating) return;
    let totalFaceDmg = 0;
    let kills = 0;
    let attackers = 0;
    for (let l = 0; l < 5; l++) {
      const m = battle.board[0][l];
      if (!m || m.data.type !== 'minion') continue;
      const atk = Math.max(0, m.currentAtk || 0);
      if (atk <= 0) continue;
      if (m.activeKw && m.activeKw['无法攻击']) continue;
      const isJustSummoned = m.summonedTurn === battle.turn;
      const canAct = !isJustSummoned || (m.activeKw && (m.activeKw['疾驰'] || m.activeKw['突进']));
      if (!canAct) continue;
      attackers++;
      const opp = battle.board[1][l];
      const strikes = (m.activeKw && m.activeKw['二连击']) ? 2 : 1;
      const laneEl = typeof getLaneDOM === 'function' ? getLaneDOM(1, l) : null;
      if (opp && opp.data.type === 'minion') {
        const hasBarrier = opp.activeKw && opp.activeKw['屏障'];
        const dmg = hasBarrier ? (strikes > 1 ? atk : 0) : atk * strikes;
        const willKill = (opp.currentHp - dmg) <= 0 || (m.activeKw && m.activeKw['必杀'] && dmg > 0);
        if (willKill) kills++;
        if (laneEl) {
          const badge = document.createElement('div');
          badge.className = 'cf-lane-preview-badge';
          badge.textContent = willKill ? `💀 击破 (-${dmg})` : `⚔️ -${dmg}`;
          laneEl.style.position = 'relative';
          laneEl.appendChild(badge);
          lanePreviewBadges.push(badge);
        }
      } else {
        const canFace = !isJustSummoned || (m.activeKw && m.activeKw['疾驰']);
        if (canFace) {
          const faceHit = atk * strikes;
          totalFaceDmg += faceHit;
          if (laneEl) {
            const badge = document.createElement('div');
            badge.className = 'cf-lane-preview-badge face';
            badge.textContent = `🎯 直击 -${faceHit}`;
            laneEl.style.position = 'relative';
            laneEl.appendChild(badge);
            lanePreviewBadges.push(badge);
          }
        }
      }
    }
    const enemyHp = battle.leaders[1] ? battle.leaders[1].hp : 20;
    const isLethal = totalFaceDmg >= enemyHp && totalFaceDmg > 0;
    previewTip.classList.toggle('lethal', isLethal);
    previewTip.innerHTML = `
      <div style="font-weight:900;font-size:13px;margin-bottom:4px;color:${isLethal ? '#fde047' : '#7dd3fc'}">
        ${isLethal ? '⚡ 斩杀预警！本回合结算即可获胜' : '⚔️ 本回合结算战局预览'}
      </div>
      <div style="color:#cbd5e1;line-height:1.5;">
        可进攻随从：<b>${attackers}</b> 个 · 预计击破：<b>${kills}</b> 个<br/>
        预计直击主战者：<b style="color:${totalFaceDmg > 0 ? '#fb923c' : '#94a3b8'}">${totalFaceDmg} 点</b>（敌方当前 ${enemyHp} HP）
      </div>
      <div style="font-size:10px;color:#64748b;margin-top:4px;">快捷键：Space 结束回合 · Esc 取消</div>
    `;
    previewTip.classList.add('show');
  }

  function bindEndTurnPreview() {
    const orb = document.getElementById('btnTurnOrb');
    if (orb && !orb.dataset.cfPreviewBound) {
      orb.dataset.cfPreviewBound = '1';
      orb.addEventListener('mouseenter', showCombatPreview);
      orb.addEventListener('mouseleave', clearCombatPreview);
      orb.addEventListener('click', clearCombatPreview);
    }
  }
  setInterval(bindEndTurnPreview, 800);

  // ---------- 5. 治疗/强化扩散光环 VFX 挂钩 ----------
  window.spawnCommercialRingVFX = function (el, color) {
    if (!el || !el.getBoundingClientRect) return;
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) return;
    const ring = document.createElement('div');
    ring.className = 'cf-vfx-ring';
    ring.style.left = (r.left + r.width / 2) + 'px';
    ring.style.top = (r.top + r.height / 2) + 'px';
    ring.style.border = `3px solid ${color}`;
    ring.style.boxShadow = `0 0 18px ${color}`;
    document.body.appendChild(ring);
    setTimeout(() => ring.remove(), 580);
  };

  if (typeof window.spawnFloatNumber === 'function') {
    const _origFloat = window.spawnFloatNumber;
    window.spawnFloatNumber = function (side, lane, text, color) {
      try {
        const s = String(text || '');
        const dom = lane === -1
          ? document.getElementById(side === 0 ? 'playerLeaderNode' : 'enemyLeaderNode')
          : (typeof getLaneDOM === 'function' ? getLaneDOM(side, lane) : null);
        if (dom) {
          if (s.includes('回复') || s.includes('+') && (color === '#4ade80' || color === '#34d399' || color === '#10b981')) {
            window.spawnCommercialRingVFX(dom, '#34d399');
          } else if (s.includes('屏障') || s.includes('护盾')) {
            window.spawnCommercialRingVFX(dom, '#38bdf8');
          }
        }
      } catch (e) {}
      return _origFloat.apply(this, arguments);
    };
  }

  // 卡组编辑器费用曲线已按需移除
  const _oldCurve = document.getElementById('cfDeckCurveWidget'); if (_oldCurve) _oldCurve.remove();
})();


