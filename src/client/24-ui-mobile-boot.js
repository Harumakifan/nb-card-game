// ============================================================================
// 手机端完美适配引擎：响应式视口比例计算 (--ui-scale) + 触屏手势转鼠标事件桥接
// ============================================================================
function updateResponsiveViewportScale() {
  const vv = window.visualViewport;
  const vw = vv ? vv.width : window.innerWidth;
  const vh = vv ? vv.height : window.innerHeight;
  const isCompactLandscape = vw > vh && (vh < 560 || vw < 1024);
  let scale = isCompactLandscape
    ? Math.min(1, vw / 1240, vh / 760)
    : Math.min(1, vw / 1340, vh / 840);
  scale = Math.max(0.32, Math.min(1, scale));
  document.documentElement.style.setProperty('--ui-scale', scale.toFixed(4));
  const isPortraitMul = vw < vh && vw <= 760;
  const mulScale = isPortraitMul
    ? Math.max(0.36, Math.min(1.06, (vw - 12) / 764, (vh - 16) / 690))
    : Math.max(0.36, Math.min(1.06, (vw - 12) / 948, (vh - 10) / 568));
  document.documentElement.style.setProperty('--mulligan-scale', mulScale.toFixed(4));
  const aspect = vw / Math.max(1, vh);
  let sideHudScale = 1.0;
  if (isCompactLandscape) {
    sideHudScale = aspect >= 1.95 ? 1.24 : 1.06;
  } else {
    sideHudScale = vw >= 1760 ? 1.34 : (vw >= 1440 ? 1.24 : 1.14);
  }
  document.documentElement.style.setProperty('--side-hud-scale', sideHudScale.toFixed(3));
  const portOv = document.getElementById('mobilePortraitOverlay');
  if (portOv) portOv.classList.add('hidden');
}
updateResponsiveViewportScale();
window.addEventListener('resize', updateResponsiveViewportScale);
if (window.visualViewport) window.visualViewport.addEventListener('resize', updateResponsiveViewportScale);
document.addEventListener('fullscreenchange', () => setTimeout(updateResponsiveViewportScale, 120));
window.addEventListener('orientationchange', () => setTimeout(updateResponsiveViewportScale, 150));

// 移动端 Touch 拖拽无缝桥接（仅在手指滑动拖拽时派发合成拖拽事件，普通轻触点击直接交由浏览器原生 click/mouse 处理，彻底杜绝移动端双击抵消！）
(function initMobileTouchBridge() {
  let activeTouchId = null;
  let startX = 0, startY = 0;
  let touchDragging = false;
  let touchTarget = null;

  window.addEventListener('touchstart', (e) => {
    if (!e.changedTouches || e.changedTouches.length === 0) return;
    const t = e.changedTouches[0];
    activeTouchId = t.identifier;
    startX = t.clientX;
    startY = t.clientY;
    touchDragging = false;
    const rawEl = document.elementFromPoint(t.clientX, t.clientY) || e.target;
    if (rawEl && rawEl.closest && rawEl.closest('.sv-hand-card, #onlineRoomList, #onlinePlayerList, #svDetailPanel, #battleRecordPanel, #deckGalleryGrid, #deckEditorList, #tutorialModal, #mainMenuOverlay, #versusRoomModal, #leaderAvatarModal, .ol-body')) { activeTouchId = null; touchTarget = null; return; }
    touchTarget = rawEl;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!e.changedTouches || e.changedTouches.length === 0) return;
    let t = e.changedTouches[0];
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouchId) {
        t = e.changedTouches[i];
        break;
      }
    }
    const dist = Math.hypot(t.clientX - startX, t.clientY - startY);
    if (!touchDragging && dist > 6 && touchTarget) {
      const cardTarget = touchTarget.closest ? (touchTarget.closest('.sv-hand-card') || touchTarget) : touchTarget;
      touchTarget = cardTarget;
      touchDragging = true;
      const mouseDownEv = new MouseEvent('mousedown', {
        bubbles: true, cancelable: true, view: window,
        button: 0, buttons: 1, clientX: startX, clientY: startY
      });
      touchTarget.dispatchEvent(mouseDownEv);
    }
    if (touchDragging) {
      if (e.cancelable) e.preventDefault();
      const mouseMoveEv = new MouseEvent('mousemove', {
        bubbles: true, cancelable: true, view: window,
        button: 0, buttons: 1, clientX: t.clientX, clientY: t.clientY
      });
      window.dispatchEvent(mouseMoveEv);
    }
  }, { passive: false });

  const onTouchEndOrCancel = (e) => {
    if (!e.changedTouches || e.changedTouches.length === 0) return;
    const t = e.changedTouches[0];
    if (touchDragging) {
      touchDragging = false;
      const dropTarget = document.elementFromPoint(t.clientX, t.clientY) || window;
      const mouseUpEv = new MouseEvent('mouseup', {
        bubbles: true, cancelable: true, view: window,
        button: 0, buttons: 0, clientX: t.clientX, clientY: t.clientY
      });
      dropTarget.dispatchEvent(mouseUpEv);
    }
    activeTouchId = null;
    touchTarget = null;
  };

  window.addEventListener('touchend', onTouchEndOrCancel, { passive: true });
  window.addEventListener('touchcancel', onTouchEndOrCancel, { passive: true });
})();

let __gameBooted = false;
function bootGameNow() {
  if (__gameBooted) return;
  __gameBooted = true;
  try {
    updateResponsiveViewportScale();
    syncAllDeckSelects();
    if (typeof applyUserAvatarToUI === 'function') applyUserAvatarToUI();
    if (typeof startMainMenuBgAnim === 'function') startMainMenuBgAnim();
    if (typeof connectOnlineNetwork === 'function' && !OnlineState.connected) connectOnlineNetwork();
    initNewBattle();
  } catch (err) {
    console.error('Boot error:', err);
  }
}

// === 手机端自动全屏 / 全屏提醒逻辑 ===
;(function setupMobileFullscreen() {
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth <= 1024;
  function isFullscreen() {
    return Boolean(document.fullscreenElement || document.webkitFullscreenElement);
  }
  async function requestAppFullscreen() {
    const el = document.documentElement;
    try {
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      if (screen.orientation && screen.orientation.lock) { screen.orientation.lock('landscape').catch(() => {}); }
    } catch (e) {}
    updateFsUI();
  }
  function updateFsUI() {
    const btn = document.getElementById('btnMobileFullscreen');
    const banner = document.getElementById('mobileFullscreenBanner');
    const fs = isFullscreen();
    if (btn) btn.textContent = fs ? '🗗 退出全屏' : '⛶ 全屏';
    if (banner) banner.style.display = (isMobile && !fs) ? 'flex' : 'none';
  }
  document.getElementById('btnMobileFullscreen')?.addEventListener('click', () => {
    if (isFullscreen()) {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    } else {
      requestAppFullscreen();
    }
  });
  if (isMobile && !document.getElementById('mobileFullscreenBanner')) {
    const b = document.createElement('div');
    b.id = 'mobileFullscreenBanner';
    b.innerHTML = '<span style="font-size:15px;">📱 建议全屏横屏游玩</span><button id="btnBannerGoFs" style="background:linear-gradient(90deg,#0284c7,#2563eb);color:#fff;padding:9px 18px;border-radius:12px;font-size:15px;font-weight:900;border:1.5px solid #7dd3fc;">⛶ 开启全屏横屏</button><button id="btnBannerCloseFs" style="background:#1e293b;color:#cbd5e1;padding:8px 12px;border-radius:10px;border:1px solid #475569;font-size:14px;font-weight:900;">✕</button>';
    document.body.appendChild(b);
    document.getElementById('btnBannerGoFs')?.addEventListener('click', () => requestAppFullscreen());
    document.getElementById('btnBannerCloseFs')?.addEventListener('click', () => { b.style.display = 'none'; });
  }
  document.addEventListener('fullscreenchange', updateFsUI);
  document.addEventListener('webkitfullscreenchange', updateFsUI);
  window.enterBattleFullscreenLandscape = () => {
    if (isMobile && !isFullscreen()) requestAppFullscreen();
  };
  if (isMobile) {
    window.addEventListener('touchend', () => {
      if (!isFullscreen()) requestAppFullscreen();
    }, { once: true, passive: true });
    window.addEventListener('click', () => {
      if (!isFullscreen()) requestAppFullscreen();
    }, { once: true });
  }
  updateFsUI();
})();


