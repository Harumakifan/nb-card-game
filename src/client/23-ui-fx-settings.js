// ============================================================================
// 新增模块 B：动态赛博星界战场背景 (#bgDynamicCanvas) 与全局鼠标长按蓄力特效 (#longPressCanvas)
// ============================================================================
(function initDynamicBgAndLongPressFX() {
  const bgCanvas = document.getElementById('bgDynamicCanvas');
  const lpCanvas = document.getElementById('longPressCanvas');
  if (!bgCanvas || !lpCanvas) return;
  const bgCtx = bgCanvas.getContext('2d');
  const lpCtx = lpCanvas.getContext('2d');

  let w = window.innerWidth, h = window.innerHeight;
  const resize = () => {
    w = window.innerWidth; h = window.innerHeight;
    bgCanvas.width = w; bgCanvas.height = h;
    lpCanvas.width = w; lpCanvas.height = h;
  };
  resize();
  window.addEventListener('resize', resize);

  // 背景星尘能量粒子
  const motes = Array.from({ length: 46 }, (_, i) => ({
    x: (i * 97) % w,
    y: (i * 53) % h,
    r: 1.2 + (i % 3) * 0.9,
    vx: (i % 2 === 0 ? 1 : -1) * (0.18 + (i % 5) * 0.06),
    vy: -0.25 - (i % 4) * 0.12,
    hue: i % 3 === 0 ? 195 : (i % 3 === 1 ? 280 : 42)
  }));

  // 长按蓄力法阵与粒子状态
  let pressState = {
    down: false,
    x: 0,
    y: 0,
    downTime: 0,
    sparks: [],
    ripples: []
  };

  window.addEventListener('mousedown', (e) => {
    pressState.down = true;
    pressState.x = e.clientX;
    pressState.y = e.clientY;
    pressState.downTime = performance.now();
    pressState.ripples.push({ x: e.clientX, y: e.clientY, r: 6, alpha: 0.85, color: '#38bdf8' });
  }, true);

  window.addEventListener('mousemove', (e) => {
    if (pressState.down) {
      pressState.x = e.clientX;
      pressState.y = e.clientY;
    }
  }, true);

  window.addEventListener('mouseup', (e) => {
    if (pressState.down) {
      const heldMs = performance.now() - pressState.downTime;
      if (heldMs >= 180) {
        pressState.ripples.push({ x: e.clientX, y: e.clientY, r: 14, alpha: 1.0, color: '#fbbf24' });
        for (let i = 0; i < 14; i++) {
          const ang = (Math.PI * 2 * i) / 14;
          const spd = 2.2 + (i % 3) * 1.4;
          pressState.sparks.push({
            x: e.clientX, y: e.clientY,
            vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
            life: 1.0, hue: i % 2 === 0 ? 45 : 195
          });
        }
      }
      pressState.down = false;
    }
  }, true);

  let tick = 0;
  function renderLoop(now) {
    tick += 0.016;
    // 1. 绘制动态赛博圣堂背景
    bgCtx.clearRect(0, 0, w, h);
    const cx = w * 0.5, cy = h * 0.5;

    // 旋转全息星轨法阵
    bgCtx.save();
    bgCtx.translate(cx, cy);
    bgCtx.rotate(tick * 0.12);
    bgCtx.strokeStyle = 'rgba(56, 189, 248, 0.11)';
    bgCtx.lineWidth = 1.5;
    bgCtx.beginPath();
    bgCtx.arc(0, 0, Math.min(w, h) * 0.38, 0, Math.PI * 2);
    bgCtx.stroke();

    bgCtx.rotate(-tick * 0.24);
    bgCtx.strokeStyle = 'rgba(192, 132, 252, 0.09)';
    bgCtx.setLineDash([12, 10]);
    bgCtx.beginPath();
    bgCtx.arc(0, 0, Math.min(w, h) * 0.44, 0, Math.PI * 2);
    bgCtx.stroke();
    bgCtx.restore();

    // 透视能量网格脉动线
    const pulseAlpha = 0.06 + Math.sin(tick * 1.8) * 0.03;
    bgCtx.strokeStyle = `rgba(56, 189, 248, ${pulseAlpha.toFixed(3)})`;
    bgCtx.lineWidth = 1;
    for (let i = -4; i <= 4; i++) {
      bgCtx.beginPath();
      bgCtx.moveTo(cx + i * 110, 0);
      bgCtx.lineTo(cx + i * 240, h);
      bgCtx.stroke();
    }

    // 漂浮星尘粒子
    for (const m of motes) {
      m.x += m.vx;
      m.y += m.vy;
      if (m.y < -10) m.y = h + 10;
      if (m.x < -10) m.x = w + 10;
      if (m.x > w + 10) m.x = -10;
      bgCtx.fillStyle = `hsla(${m.hue}, 90%, 70%, 0.45)`;
      bgCtx.beginPath();
      bgCtx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      bgCtx.fill();
    }

    // 2. 绘制全局鼠标长按蓄力法阵与波纹特效
    lpCtx.clearRect(0, 0, w, h);
    if (pressState.down) {
      const held = now - pressState.downTime;
      if (held >= 140) {
        const charge = Math.min(1, (held - 140) / 500);
        const radius = 22 + charge * 24;
        lpCtx.save();
        lpCtx.translate(pressState.x, pressState.y);
        lpCtx.rotate(tick * 3.2);
        lpCtx.strokeStyle = `rgba(56, 189, 248, ${0.45 + charge * 0.45})`;
        lpCtx.lineWidth = 2.5;
        lpCtx.setLineDash([8, 6]);
        lpCtx.beginPath();
        lpCtx.arc(0, 0, radius, 0, Math.PI * 2);
        lpCtx.stroke();

        lpCtx.rotate(-tick * 5.5);
        lpCtx.strokeStyle = `rgba(251, 191, 36, ${0.4 + charge * 0.5})`;
        lpCtx.setLineDash([5, 5]);
        lpCtx.beginPath();
        lpCtx.arc(0, 0, radius * 0.68, 0, Math.PI * 2);
        lpCtx.stroke();
        lpCtx.restore();

        // 持续喷发蓄力微粒
        if (Math.random() < 0.65) {
          const ang = Math.random() * Math.PI * 2;
          pressState.sparks.push({
            x: pressState.x + Math.cos(ang) * radius,
            y: pressState.y + Math.sin(ang) * radius,
            vx: -Math.cos(ang) * 1.4,
            vy: -Math.sin(ang) * 1.4 - 0.8,
            life: 0.85,
            hue: Math.random() < 0.5 ? 195 : 45
          });
        }
      }
    }

    for (let i = pressState.ripples.length - 1; i >= 0; i--) {
      const rp = pressState.ripples[i];
      rp.r += 2.6;
      rp.alpha -= 0.035;
      if (rp.alpha <= 0) {
        pressState.ripples.splice(i, 1);
        continue;
      }
      lpCtx.strokeStyle = rp.color;
      lpCtx.globalAlpha = rp.alpha;
      lpCtx.lineWidth = 2;
      lpCtx.beginPath();
      lpCtx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
      lpCtx.stroke();
      lpCtx.globalAlpha = 1;
    }

    for (let i = pressState.sparks.length - 1; i >= 0; i--) {
      const sp = pressState.sparks[i];
      sp.x += sp.vx;
      sp.y += sp.vy;
      sp.life -= 0.04;
      if (sp.life <= 0) {
        pressState.sparks.splice(i, 1);
        continue;
      }
      lpCtx.fillStyle = `hsla(${sp.hue}, 95%, 68%, ${sp.life})`;
      lpCtx.beginPath();
      lpCtx.arc(sp.x, sp.y, 2.5 * sp.life + 1, 0, Math.PI * 2);
      lpCtx.fill();
    }

    requestAnimationFrame(renderLoop);
  }
  requestAnimationFrame(renderLoop);
})();


// ============================================================================
// 修复【融合】与手牌选择弹窗：左键点击可选卡牌或确认按钮以外的任何位置立即取消关闭！
// ============================================================================
function closeAndCancelHandPickModal() {
  const modal = document.getElementById('handPickModal');
  if (!modal || modal.classList.contains('hidden')) return;
  sfx.play('click');
  modal.classList.add('hidden');
  modal.style.display = 'none';
  battle.multiFuseUids.clear();
  if (battle.pendingPlay) {
    cancelPendingPlayToHand();
  } else {
    renderAllBattleUI();
  }
}

document.getElementById('handPickModal').addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  if (e.target.closest('.hand-pick-card-item') || e.target.closest('#btnConfirmMultiFuse')) {
    return;
  }
  e.stopPropagation();
  closeAndCancelHandPickModal();
});

document.getElementById('btnCancelHandPick').addEventListener('click', (e) => {
  e.stopPropagation();
  closeAndCancelHandPickModal();
});

// ============================================================================
// 敌方难度等级切换（普通30血 / 困难40血+开局多抽2张 / 炼狱50血+开局多抽4张）
// ============================================================================
document.getElementById('selectAiDifficulty').addEventListener('change', (e) => {
  sfx.play('play');
  aiDifficulty = e.target.value || 'normal';
  initNewBattle();
});

const selModeEl = document.getElementById('selectBattleMode');
if (selModeEl) {
  selModeEl.addEventListener('change', (e) => {
    sfx.play('play');
    battleMode = e.target.value || 'pve';
    pvpCurrentPlayerNum = 1;
    if (battleMode === 'pvp_online') {
      openOnlineLobbyModal();
      return;
    }
    initNewBattle();
  });
}

const selAiArchEl = document.getElementById('selectAiDeckArchetype');
if (selAiArchEl) {
  selAiArchEl.addEventListener('change', (e) => {
    sfx.play('play');
    aiDeckArchetype = e.target.value || 'dragon';
    initNewBattle();
  });
}

// 修复游戏结束后的【再战一局】与【调整卡组】按钮点击无响应 bug
const btnVicAgain = document.getElementById('btnVicPlayAgain');
if (btnVicAgain) {
  btnVicAgain.addEventListener('click', (e) => {
    e.stopPropagation();
    sfx.play('play');
    if (battleMode === 'pvp_online' && OnlineState.roomId) {
      returnToVersusRoomAfterMatch();
      return;
    }
    document.getElementById('victoryDefeatModal').classList.add('hidden');
    initNewBattle();
  });
}

const btnVicDeck = document.getElementById('btnVicGoDeck');
if (btnVicDeck) {
  btnVicDeck.addEventListener('click', (e) => {
    e.stopPropagation();
    sfx.play('click');
    document.getElementById('victoryDefeatModal').classList.add('hidden');
    switchScreen('deck');
  });
}

// 双人同屏热座对战交接确认按钮
const btnPvpHandover = document.getElementById('btnConfirmPvpHandover');
if (btnPvpHandover) {
  btnPvpHandover.addEventListener('click', async (e) => {
    e.stopPropagation();
    sfx.play('play');
    document.getElementById('pvpHandoverModal').classList.add('hidden');
    setHandCollapsed(false);
    await beginTurnSequence(0);
  });
}

// 手机端竖屏提示横屏游玩与一键全屏横屏锁定
let portraitDismissed = false;
function checkMobileOrientationPrompt() {
  const overlay = document.getElementById('mobilePortraitOverlay');
  if (!overlay || portraitDismissed) return;
  const isPortraitNarrow = window.innerHeight > window.innerWidth && window.innerWidth < 760;
  overlay.classList.toggle('hidden', !isPortraitNarrow);
}
window.addEventListener('resize', checkMobileOrientationPrompt);
window.addEventListener('orientationchange', () => setTimeout(checkMobileOrientationPrompt, 180));

const btnForceLand = document.getElementById('btnForceLandscapeFullscreen');
if (btnForceLand) {
  btnForceLand.addEventListener('click', async (e) => {
    e.stopPropagation();
    sfx.play('click');
    portraitDismissed = true;
    document.getElementById('mobilePortraitOverlay').classList.add('hidden');
    try {
      await document.documentElement.requestFullscreen?.();
      await screen.orientation?.lock?.('landscape');
    } catch (err) {}
    updateResponsiveViewportScale();
  });
}

const btnDismissPort = document.getElementById('btnDismissPortraitOverlay');
if (btnDismissPort) {
  btnDismissPort.addEventListener('click', (e) => {
    e.stopPropagation();
    sfx.play('click');
    portraitDismissed = true;
    document.getElementById('mobilePortraitOverlay').classList.add('hidden');
  });
}

document.getElementById('btnToggleFullscreen').addEventListener('click', async () => {
  sfx.play('click');
  if (!document.fullscreenElement) {
    try {
      await document.documentElement.requestFullscreen?.();
      await screen.orientation?.lock?.('landscape').catch(() => {});
    } catch (e) {}
  } else {
    document.exitFullscreen?.().catch(() => {});
  }
});

