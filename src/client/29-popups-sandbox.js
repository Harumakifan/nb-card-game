// ============================================================================
// v24 游戏内弹窗、独立设计器沙盒(0张起步)、卡组手机拖拽、联机敌方动作重放
// ============================================================================
function showGameAlert(msg, icon = '💬') {
  const modal = document.getElementById('gameCustomDialogModal');
  if (!modal) return;
  document.getElementById('gameDialogIcon').textContent = icon;
  document.getElementById('gameDialogMsg').textContent = msg;
  const yes = document.getElementById('btnGameDialogYes');
  const no = document.getElementById('btnGameDialogNo');
  yes.textContent = '知道了';
  no.classList.add('hidden');
  modal.classList.remove('hidden');
  modal.style.display = 'flex';
  yes.onclick = () => { modal.style.display = 'none'; modal.classList.add('hidden'); };
}

function showGameConfirm(msg, onConfirm, icon = '⚠️') {
  const modal = document.getElementById('gameCustomDialogModal');
  if (!modal) { if (onConfirm) onConfirm(); return; }
  document.getElementById('gameDialogIcon').textContent = icon;
  document.getElementById('gameDialogMsg').textContent = msg;
  const yes = document.getElementById('btnGameDialogYes');
  const no = document.getElementById('btnGameDialogNo');
  yes.textContent = '确定';
  no.textContent = '取消';
  no.classList.remove('hidden');
  modal.classList.remove('hidden');
  modal.style.display = 'flex';
  yes.onclick = () => { modal.style.display = 'none'; modal.classList.add('hidden'); if (onConfirm) onConfirm(); };
  no.onclick = () => { modal.style.display = 'none'; modal.classList.add('hidden'); };
}

// 1) 设计器独立沙盒卡库（初始 0 张，绝不混入游戏内卡牌，也不导入游戏）
const DESIGNER_SANDBOX_KEY = 'CF_DESIGNER_SANDBOX_CARDS_V1';
let v19DesignerCards = (() => {
  try {
    const raw = localStorage.getItem(DESIGNER_SANDBOX_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr;
    }
  } catch (e) {}
  return [];
})();
function saveDesignerSandboxCards() {
  try { localStorage.setItem(DESIGNER_SANDBOX_KEY, JSON.stringify(v19DesignerCards)); } catch (e) {}
}

// 覆盖 renderV19CardList 仅展示玩家自己设计的卡牌（初始为 0）
renderV19CardList = function() {
  const box = document.getElementById('v19CardListContainer');
  const cntEl = document.getElementById('v19CardCountTxt');
  if (!box) return;
  if (cntEl) cntEl.textContent = String(v19DesignerCards.length);
  const q = (document.getElementById('inputV19Search')?.value || '').trim();
  box.innerHTML = '';
  if (v19DesignerCards.length === 0) {
    box.innerHTML = '<div class="text-center text-slate-500 text-xs py-10">当前还没有设计的卡牌<br>点击上方「➕ 新建卡牌」开始创作（仅支持导出，不会影响游戏内卡池）</div>';
    return;
  }
  v19DesignerCards.forEach(c => {
    if (q && !(`${c.name}${c.race}${c.rarity}`).includes(q)) return;
    const row = document.createElement('div');
    const active = c.id === v19CurrentCardId;
    row.className = `flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition ${active ? 'bg-fuchsia-950/80 border-fuchsia-400 text-white' : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-200'}`;
    row.innerHTML = `<div class="flex items-center gap-2 min-w-0 flex-1"><span class="w-5 h-5 rounded-full bg-emerald-700 text-white font-black flex items-center justify-center text-[10px] shrink-0">${c.energy || 0}</span><span class="font-bold truncate">${c.name}</span></div><span class="text-[10px] text-amber-300 shrink-0">${c.race || (c.type === 'spell' ? '法术' : '随从')}</span>`;
    row.onclick = () => { loadCardIntoDesigner(c); renderV19CardList(); };
    box.appendChild(row);
  });
};

// 2) 联机对手动画重放助手
async function replayOpponentActionsOnClient(actionMeta) {
  if (!actionMeta) return;
  if (Array.isArray(actionMeta.vfxList)) await replayRecordedVfxList(actionMeta.vfxList);
  if (actionMeta.cardType === 'minion' && typeof actionMeta.lane === 'number' && actionMeta.cid) {
    const cd = cardsById[actionMeta.cid];
    const fromRect = document.getElementById('enemyHandBacks')?.getBoundingClientRect();
    const toLaneEl = getLaneDOM(1, actionMeta.lane);
    const toRect = toLaneEl ? toLaneEl.getBoundingClientRect() : null;
    if (cd && fromRect && toRect) {
      await animateCardTrajectory({ fromRect, toRect, cardData: cd, showFront: true, duration: 340, arcHeight: 36, startScale: 0.48, endScale: 0.92 });
    }
  }
  const _hasRichAttackVfx = Array.isArray(actionMeta.vfxList) && actionMeta.vfxList.some(v => v && v.kind === 'attack_strike');
  if (!_hasRichAttackVfx && Array.isArray(actionMeta.combatEvents)) {
    for (const ev of actionMeta.combatEvents) {
      const fromEl = getLaneDOM(1, ev.fromLane);
      const atkToken = fromEl ? (fromEl.querySelector('.sv-follower-token') || fromEl.firstElementChild) : null;
      const hitLeader = !battle.board[0][ev.toLane];
      const toEl = hitLeader ? document.getElementById('playerLeaderNode') : getLaneDOM(0, ev.toLane);
      if (atkToken && toEl) {
        const ar = atkToken.getBoundingClientRect();
        const tr = toEl.getBoundingClientRect();
        const dx = (tr.left + tr.width / 2) - (ar.left + ar.width / 2);
        const dy = (tr.top + tr.height / 2) - (ar.top + ar.height / 2);
        atkToken.style.zIndex = '60';
        atkToken.animate([
          { transform: 'translate3d(0, 0, 0) scale(1)', offset: 0 },
          { transform: `translate3d(${(-dx * 0.08).toFixed(1)}px, ${(-dy * 0.08).toFixed(1)}px, 0) scale(1.06)`, offset: 0.28 },
          { transform: `translate3d(${(dx * 0.48).toFixed(1)}px, ${(dy * 0.48).toFixed(1)}px, 0) scale(1.14)`, offset: 0.65 },
          { transform: 'translate3d(0, 0, 0) scale(1)', offset: 1 }
        ], { duration: 340, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
        await sleep(175);
        atkToken.style.zIndex = '';
        sfx.play('hit');
        if (!hitLeader && typeof playMeleeImpactVFX === 'function') await playMeleeImpactVFX(toEl, '#fbbf24');
        if (ev.dmg > 0) spawnFloatNumber(0, hitLeader ? -1 : ev.toLane, `-${ev.dmg}`, '#fb7185');
        await sleep(110);
      }
    }
  }
}

// 3) 手机端卡组编辑器：复用电脑端完全相同的 deckEditorDrag 拖拽与真实卡牌 Ghost 逻辑
(function initUnifiedMobileDeckDrag() {
  let tState = null;
  let holdTimer = null;

  function clearTimer() {
    if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
  }

  function startDesktopDragBridge(targetEl, x, y) {
    targetEl.dispatchEvent(new MouseEvent('mousedown', {
      bubbles: true, cancelable: true, view: window, button: 0, buttons: 1, clientX: x, clientY: y
    }));
    window.dispatchEvent(new MouseEvent('mousemove', {
      bubbles: true, cancelable: true, view: window, button: 0, buttons: 1, clientX: x, clientY: y
    }));
  }

  function attachTouchToDeckZone(zoneId, selector) {
    const zone = document.getElementById(zoneId);
    if (!zone) return;
    zone.style.touchAction = 'pan-y';

    zone.addEventListener('touchstart', (e) => {
      clearTimer();
      if (!e.changedTouches || !e.changedTouches.length) return;
      const itemEl = e.target.closest ? e.target.closest(selector) : null;
      if (!itemEl) return;
      const t = e.changedTouches[0];
      tState = {
        el: itemEl,
        sx: t.clientX, sy: t.clientY,
        lx: t.clientX, ly: t.clientY,
        dragStarted: false,
        scrolling: false
      };
      holdTimer = setTimeout(() => {
        if (!tState || tState.scrolling) return;
        tState.dragStarted = true;
        startDesktopDragBridge(tState.el, tState.lx, tState.ly);
      }, 200);
    }, { passive: true });

    zone.addEventListener('touchmove', (e) => {
      if (!tState || tState.scrolling || !e.changedTouches || !e.changedTouches.length) return;
      const t = e.changedTouches[0];
      tState.lx = t.clientX;
      tState.ly = t.clientY;
      const dx = t.clientX - tState.sx;
      const dy = t.clientY - tState.sy;

      if (!tState.dragStarted) {
        if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
          // 竖向滑动 -> 顺滑滚动列表
          tState.scrolling = true;
          clearTimer();
          return;
        }
        if (Math.abs(dx) > 12 && Math.abs(dx) >= Math.abs(dy)) {
          // 横向拖出 -> 立即进入与电脑端相同的拖拽模式
          clearTimer();
          tState.dragStarted = true;
          startDesktopDragBridge(tState.el, tState.sx, tState.sy);
        }
      }

      if (tState.dragStarted) {
        if (e.cancelable) e.preventDefault();
        window.dispatchEvent(new MouseEvent('mousemove', {
          bubbles: true, cancelable: true, view: window, button: 0, buttons: 1, clientX: t.clientX, clientY: t.clientY
        }));
      }
    }, { passive: false });

    const endHandler = (e) => {
      clearTimer();
      if (!tState) return;
      const t = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0] : { clientX: tState.lx, clientY: tState.ly };
      if (tState.dragStarted) {
        window.dispatchEvent(new MouseEvent('mouseup', {
          bubbles: true, cancelable: true, view: window, button: 0, buttons: 0, clientX: t.clientX, clientY: t.clientY
        }));
      } else if (!tState.scrolling && Math.hypot(t.clientX - tState.sx, t.clientY - tState.sy) < 10) {
        // 轻点 -> 查看卡牌详情
        tState.el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window, button: 0, buttons: 1, clientX: t.clientX, clientY: t.clientY }));
        window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window, button: 0, buttons: 0, clientX: t.clientX, clientY: t.clientY }));
      }
      tState = null;
    };

    zone.addEventListener('touchend', endHandler, { passive: true });
    zone.addEventListener('touchcancel', () => { clearTimer(); tState = null; }, { passive: true });
  }

  attachTouchToDeckZone('deckGalleryGrid', '.sv-hand-card');
  attachTouchToDeckZone('deckEditorList', '[data-deck-cid]');

  // 电脑端卡组编辑器：点击空白处或容器上下拖动直接滚动列表
  function attachDesktopDragScroll(zoneId) {
    const zone = document.getElementById(zoneId);
    if (!zone) return;
    let ds = null;
    zone.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      if (e.target.closest('button, input, select, a')) return;
      ds = { startY: e.clientY, startScroll: zone.scrollTop, dragged: false };
    });
    window.addEventListener('mousemove', (e) => {
      if (!ds) return;
      const dy = e.clientY - ds.startY;
      if (!ds.dragged && Math.abs(dy) > 6) {
        ds.dragged = true;
        zone.style.cursor = 'grabbing';
      }
      if (ds.dragged) {
        zone.scrollTop = ds.startScroll - dy;
      }
    });
    window.addEventListener('mouseup', () => {
      if (ds && ds.dragged) {
        setTimeout(() => { if (zone) zone.style.cursor = ''; }, 40);
      }
      ds = null;
    });
  }
  attachDesktopDragScroll('deckGalleryGrid');
  attachDesktopDragScroll('deckEditorList');

  // 敌方主战者点击支持「元气弹」等指定敌方主战者的法术
  document.getElementById('enemyLeaderNode')?.addEventListener('click', async (e) => {
    const pp = battle.pendingPlay;
    if (!pp || pp.step !== 'TARGET' || battle.animating) return;
    const isEnh = pp.playEval.mode === 'enhance';
    const req = getCardTargetRequirement(pp.card, isEnh, pp.choiceIdx);
    if (req === 'enemy_minion_or_leader') {
      e.stopPropagation();
      sfx.play('click');
      pp.effectTargetSide = 1;
      pp.effectTargetLane = -2;
      await advancePendingLeftTopPipeline();
    }
  });
})();

// 4) 单机结算弹窗增加「🏠 返回主界面」按钮逻辑
document.getElementById('btnVicGoDeck')?.addEventListener('click', (e) => {
  if (battleMode !== 'pvp_online') {
    e.stopImmediatePropagation();
    document.getElementById('victoryDefeatModal')?.classList.add('hidden');
    document.getElementById('mainMenuOverlay')?.classList.remove('hidden');
    if (typeof startMainMenuBgAnim === 'function') startMainMenuBgAnim();
  }
}, true);


