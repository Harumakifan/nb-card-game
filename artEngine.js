// CardForge · 冥刻之诗 高精度卡面绘制引擎 (v52)
// 为全部卡牌提供与名称、种族、效果高度契合的多层次手绘级矢量Canvas插画

(function (global) {
  'use strict';
  global.__ART_ENGINE_BUILD = 'v60 · Commercial Edition (216/216 Full Art + Cinematic PostFX)';
  try { console.log('[artEngine] build', global.__ART_ENGINE_BUILD); } catch (e) {}
  let _artLayerMode = 'all';
  let _inBgHelper = false;

  function hashStr(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h;
  }

  function seededRand(seed) {
    let s = seed >>> 0;
    return function () {
      s = (Math.imul(1664525, s) + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function fillRadialBg(ctx, c1, c2, c3 = '#050811', cx = 140, cy = 100) {
    if (_artLayerMode === 'fg') return;
    const _prevBg = _inBgHelper; _inBgHelper = true;
    try {
    const g = ctx.createRadialGradient(cx, cy, 10, 140, 110, 165);
    g.addColorStop(0, c1);
    g.addColorStop(0.55, c2);
    g.addColorStop(1, c3);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 280, 220);
      } finally { _inBgHelper = _prevBg; }
  }

  function fillSkyBg(ctx, cTop, cMid, cBot) {
    if (_artLayerMode === 'fg') return;
    const _prevBg = _inBgHelper; _inBgHelper = true;
    try {
    const g = ctx.createLinearGradient(0, 0, 0, 220);
    g.addColorStop(0, cTop);
    g.addColorStop(0.55, cMid);
    g.addColorStop(1, cBot);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 280, 220);
      } finally { _inBgHelper = _prevBg; }
  }

  function drawParticles(ctx, seed, col, count = 18, mode = 'sparks') {
    if (_artLayerMode === 'fg') return;
    const _prevBg = _inBgHelper; _inBgHelper = true;
    try {
    const rng = seededRand(seed);
    ctx.save();
    for (let i = 0; i < count; i++) {
      const x = rng() * 280;
      const y = rng() * 220;
      const r = 1.2 + rng() * 3.2;
      ctx.globalAlpha = 0.25 + rng() * 0.65;
      ctx.fillStyle = col;
      if (mode === 'data') {
        ctx.fillRect(x, y, r * 2.2, r * 0.8);
      } else if (mode === 'wisps') {
        ctx.beginPath();
        ctx.arc(x, y, r * 1.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x - r, y);
        ctx.quadraticCurveTo(x, y - r * 3.5, x + r * 0.4, y - r * 4.5);
        ctx.quadraticCurveTo(x + r * 0.8, y - r * 1.5, x + r, y);
        ctx.fill();
      } else if (mode === 'slashes') {
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 14, y - 10);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
      } finally { _inBgHelper = _prevBg; }
  }

  function drawMagicCircle(ctx, cx, cy, r, col, alpha = 0.45) {
    if (_artLayerMode === 'fg') return;
    const _prevBg = _inBgHelper; _inBgHelper = true;
    try {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(0, 0, r * 0.84, 0, Math.PI * 2); ctx.stroke();
    // 六芒星
    for (let k = 0; k < 2; k++) {
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = (i * 2 * Math.PI) / 3 + k * Math.PI;
        const x = Math.cos(a) * r * 0.84, y = Math.sin(a) * r * 0.84;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath(); ctx.stroke();
    }
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.86, Math.sin(a) * r * 0.86);
      ctx.lineTo(Math.cos(a) * r * 0.98, Math.sin(a) * r * 0.98);
      ctx.stroke();
    }
    ctx.restore();
      } finally { _inBgHelper = _prevBg; }
  }

  function drawMoon(ctx, cx, cy, r, col = '#fef08a', crescent = false) {
    if (_artLayerMode === 'fg') return;
    const _prevBg = _inBgHelper; _inBgHelper = true;
    try {
    ctx.save();
    const g = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.8);
    g.addColorStop(0, col);
    g.addColorStop(0.55, col + '55');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, r * 1.8, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    if (crescent) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath(); ctx.arc(cx + r * 0.42, cy - r * 0.18, r * 0.88, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
      } finally { _inBgHelper = _prevBg; }
  }

  function drawWingPair(ctx, cx, cy, span, col, edgeCol, style = 'dragon') {
    ctx.save();
    [-1, 1].forEach(dir => {
      if (style === 'angel') {
        for (let f = 0; f < 5; f++) {
          ctx.fillStyle = f % 2 === 0 ? col : '#ffffff';
          ctx.strokeStyle = edgeCol;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(cx + dir * 14, cy + f * 6);
          ctx.quadraticCurveTo(
            cx + dir * (span * (0.95 - f * 0.11)), cy - 58 + f * 18,
            cx + dir * (span * (1.02 - f * 0.12)), cy - 26 + f * 20
          );
          ctx.quadraticCurveTo(cx + dir * (span * 0.45), cy + 6 + f * 10, cx + dir * 14, cy + 12 + f * 6);
          ctx.closePath(); ctx.fill(); ctx.stroke();
        }
      } else if (style === 'mecha') {
        for (let k = 0; k < 3; k++) {
          ctx.fillStyle = col;
          ctx.strokeStyle = edgeCol;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cx + dir * 16, cy + 8);
          ctx.lineTo(cx + dir * (span - k * 14), cy - 58 + k * 26);
          ctx.lineTo(cx + dir * (span - 18 - k * 12), cy - 18 + k * 26);
          ctx.closePath(); ctx.fill(); ctx.stroke();
        }
      } else if (style === 'bone') {
        ctx.strokeStyle = col;
        ctx.lineWidth = 4;
        for (let b = 0; b < 4; b++) {
          const ex = cx + dir * (span - b * 12);
          const ey = cy - 54 + b * 24;
          ctx.beginPath();
          ctx.moveTo(cx + dir * 14, cy + 4);
          ctx.quadraticCurveTo(cx + dir * span * 0.55, cy - 62 + b * 14, ex, ey);
          ctx.stroke();
        }
        ctx.fillStyle = edgeCol;
        ctx.globalAlpha = 0.28;
        ctx.beginPath();
        ctx.moveTo(cx + dir * 14, cy + 4);
        ctx.lineTo(cx + dir * span, cy - 54);
        ctx.lineTo(cx + dir * (span - 24), cy + 22);
        ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1;
      } else {
        // dragon / bat / demon
        ctx.fillStyle = col;
        ctx.strokeStyle = edgeCol;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx + dir * 14, cy + 4);
        ctx.quadraticCurveTo(cx + dir * span * 0.55, cy - 68, cx + dir * span, cy - 46);
        ctx.lineTo(cx + dir * (span * 0.82), cy + 12);
        ctx.quadraticCurveTo(cx + dir * span * 0.52, cy + 2, cx + dir * (span * 0.42), cy + 28);
        ctx.quadraticCurveTo(cx + dir * span * 0.25, cy + 10, cx + dir * 14, cy + 24);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        // 翼骨脉络
        ctx.strokeStyle = edgeCol;
        ctx.lineWidth = 1.6;
        [0.82, 0.42].forEach(f => {
          ctx.beginPath();
          ctx.moveTo(cx + dir * span * 0.45, cy - 28);
          ctx.lineTo(cx + dir * span * f, cy + (f > 0.5 ? 12 : 28));
          ctx.stroke();
        });
      }
    });
    ctx.restore();
  }

  function drawSkull(ctx, cx, cy, scale = 1, opts = {}) {
    const {
      boneCol = '#e2e8f0',
      shadowCol = '#64748b',
      eyeCol = '#38bdf8',
      crown = false,
      horns = false,
      mohawk = false,
      flame = false
    } = opts;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    if (flame) {
      const fg = ctx.createRadialGradient(0, -16, 4, 0, -18, 48);
      fg.addColorStop(0, '#ffffff');
      fg.addColorStop(0.35, eyeCol);
      fg.addColorStop(1, 'transparent');
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.moveTo(-30, 8);
      ctx.quadraticCurveTo(-36, -38, 0, -56);
      ctx.quadraticCurveTo(36, -38, 30, 8);
      ctx.closePath(); ctx.fill();
    }

    if (horns) {
      ctx.fillStyle = '#475569'; ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2;
      [-1, 1].forEach(d => {
        ctx.beginPath();
        ctx.moveTo(d * 18, -16);
        ctx.quadraticCurveTo(d * 48, -32, d * 40, -56);
        ctx.quadraticCurveTo(d * 30, -34, d * 12, -26);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      });
    }

    if (mohawk) {
      ctx.fillStyle = '#f43f5e'; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 1.6;
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 6 - 4, -22);
        ctx.lineTo(i * 9, -52 + Math.abs(i) * 4);
        ctx.lineTo(i * 6 + 4, -22);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
    }

    // 头骨主体
    const sg = ctx.createLinearGradient(0, -30, 0, 32);
    sg.addColorStop(0, boneCol);
    sg.addColorStop(1, shadowCol);
    ctx.fillStyle = sg;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, -8, 26, Math.PI, 0, false);
    ctx.lineTo(26, 4);
    ctx.lineTo(18, 16);
    ctx.lineTo(16, 30);
    ctx.lineTo(-16, 30);
    ctx.lineTo(-18, 16);
    ctx.lineTo(-26, 4);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // 眼窝与魂火
    [-10, 10].forEach(ex => {
      ctx.fillStyle = '#090d16';
      ctx.beginPath(); ctx.ellipse(ex, 0, 7.5, 6.5, ex < 0 ? 0.2 : -0.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = eyeCol;
      ctx.beginPath(); ctx.arc(ex, 0, 3.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(ex - 1, -1, 1.4, 0, Math.PI * 2); ctx.fill();
    });

    // 鼻腔
    ctx.fillStyle = '#090d16';
    ctx.beginPath(); ctx.moveTo(0, 5); ctx.lineTo(-4, 14); ctx.lineTo(4, 14); ctx.closePath(); ctx.fill();

    // 牙齿
    ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-14, 21); ctx.lineTo(14, 21); ctx.stroke();
    for (let tx = -10; tx <= 10; tx += 5) {
      ctx.beginPath(); ctx.moveTo(tx, 17); ctx.lineTo(tx, 29); ctx.stroke();
    }

    if (crown) {
      ctx.fillStyle = '#fbbf24'; ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-22, -24); ctx.lineTo(-26, -46); ctx.lineTo(-11, -34);
      ctx.lineTo(0, -52); ctx.lineTo(11, -34); ctx.lineTo(26, -46);
      ctx.lineTo(22, -24); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(0, -32, 3.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawDragonHead(ctx, cx, cy, scale = 1, opts = {}) {
    const {
      scaleCol = '#ea580c',
      bellyCol = '#fde047',
      hornCol = '#fef08a',
      eyeCol = '#ef4444',
      breathCol = null,
      boneMode = false
    } = opts;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    if (breathCol) {
      const bg = ctx.createLinearGradient(0, 12, 0, 115);
      bg.addColorStop(0, '#ffffff');
      bg.addColorStop(0.3, breathCol);
      bg.addColorStop(1, 'transparent');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.moveTo(-10, 16); ctx.lineTo(-55, 115); ctx.lineTo(55, 115); ctx.lineTo(10, 16);
      ctx.closePath(); ctx.fill();
    }

    // 脖颈
    ctx.fillStyle = scaleCol; ctx.strokeStyle = '#090d16'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-26, 20); ctx.quadraticCurveTo(-36, 60, -44, 100);
    ctx.lineTo(44, 100); ctx.quadraticCurveTo(36, 60, 26, 20);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // 龙角
    ctx.fillStyle = hornCol;
    [-1, 1].forEach(d => {
      ctx.beginPath();
      ctx.moveTo(d * 16, -24);
      ctx.quadraticCurveTo(d * 48, -56, d * 56, -72);
      ctx.quadraticCurveTo(d * 34, -44, d * 26, -16);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    });

    // 龙头主体轮廓
    const hg = ctx.createLinearGradient(0, -38, 0, 32);
    hg.addColorStop(0, scaleCol);
    hg.addColorStop(1, boneMode ? '#94a3b8' : '#1e1b4b');
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.moveTo(-34, -10);
    ctx.lineTo(-22, -36); ctx.lineTo(0, -42); ctx.lineTo(22, -36);
    ctx.lineTo(34, -10);
    ctx.lineTo(22, 24); ctx.lineTo(0, 34); ctx.lineTo(-22, 24);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // 吻部与獠牙
    ctx.fillStyle = bellyCol;
    ctx.beginPath();
    ctx.moveTo(-18, 12); ctx.lineTo(0, 32); ctx.lineTo(18, 12); ctx.lineTo(10, 26); ctx.lineTo(-10, 26);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffffff';
    [-12, -5, 5, 12].forEach(fx => {
      ctx.beginPath(); ctx.moveTo(fx - 3, 18); ctx.lineTo(fx, 29); ctx.lineTo(fx + 3, 18); ctx.fill();
    });

    // 龙眼
    [-14, 14].forEach(ex => {
      ctx.fillStyle = '#090d16';
      ctx.beginPath(); ctx.ellipse(ex, -6, 8, 5, ex < 0 ? 0.3 : -0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = eyeCol;
      ctx.beginPath(); ctx.ellipse(ex, -6, 5, 3.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath(); ctx.ellipse(ex, -6, 1.5, 3.2, 0, 0, Math.PI * 2); ctx.fill();
    });

    ctx.restore();
  }


  /* 少女骑士轻甲战裙（与其余服饰统一：简洁二次元矢量轮廓 + 纯色填充 + 细金边） */
  function drawGirlArmor(ctx, o = {}) {
    const cx = o.cx ?? 140, top = o.top ?? 92, bot = o.bot ?? 178;
    const sh = o.shoulders ?? 23;
    const wa = o.waist ?? 15;
    const hi = o.hips ?? 30;
    const fill = o.fill || '#475569', trim = o.trim || '#fde047';
    const waistY = top + (bot - top) * 0.44;
    ctx.save();
    ctx.fillStyle = fill;
    ctx.strokeStyle = trim;
    ctx.lineWidth = 2.2;

    // 统一连身骑士战裙轮廓（柔和肩线 + 自然束腰 + A字战裙）
    ctx.beginPath();
    ctx.moveTo(cx - sh * 0.72, top);
    ctx.lineTo(cx + sh * 0.72, top);
    ctx.quadraticCurveTo(cx + sh + 2, top + 14, cx + wa, waistY);
    ctx.lineTo(cx + hi + 12, bot - 4);
    ctx.lineTo(cx - hi - 12, bot - 4);
    ctx.lineTo(cx - wa, waistY);
    ctx.quadraticCurveTo(cx - sh - 2, top + 14, cx - sh * 0.72, top);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // 简洁骑士腰带线 + 领口V线（与其它体型保持同等线条密度）
    ctx.beginPath();
    ctx.moveTo(cx - wa, waistY);
    ctx.lineTo(cx + wa, waistY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - 8, top + 2);
    ctx.lineTo(cx, top + 14);
    ctx.lineTo(cx + 8, top + 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawAnimeHeroine(ctx, opts = {}) {
    const {
      cx = 140, cy = 96,
      hairCol = '#f472b6', eyeCol = '#22d3ee', suitCol = '#1e3a8a',
      trimCol = '#fde047', skinCol = '#fff1e6',
      wingType = 'none', propType = 'none', headgear = 'none',
      hairStyle = 'long', bangStyle = 'classic',
      faceShape = 'classic', eyeStyle = 'classic', bodyStyle = 'classic_armor',
      hairOrnament = 'none', bodyOrnament = 'none',
      auraCol = null, ahoge = false, blush = false
    } = opts;
    ctx.save();

    if (auraCol) {
      drawMagicCircle(ctx, cx, cy + 4, 72, auraCol, 0.38);
    }

    if (wingType !== 'none') {
      const wMap = {
        mecha_wings: ['#38bdf8', '#e0f2fe', 'mecha'],
        angel_feather: ['#f8fafc', '#fde047', 'angel'],
        demon_wings: ['#581c87', '#f43f5e', 'dragon'],
        dragon_wings: ['#b91c1c', '#fde047', 'dragon'],
        bone_wings: ['#cbd5e1', '#a855f7', 'bone']
      };
      if (wingType === 'thorn_vines') {
        ctx.strokeStyle = '#15803d'; ctx.lineWidth = 5;
        for (let k = 0; k < 5; k++) {
          ctx.beginPath();
          ctx.arc(cx, cy + 15, 55 + k * 10, 0.2 * k, Math.PI - 0.2 * k);
          ctx.stroke();
        }
      } else if (wMap[wingType]) {
        drawWingPair(ctx, cx, cy, 108, wMap[wingType][0], wMap[wingType][1], wMap[wingType][2]);
      }
    }

    // 披风后层
    if (bodyOrnament === 'cape' || bodyStyle === 'cape_cloak') {
      ctx.fillStyle = suitCol;
      ctx.strokeStyle = trimCol; ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(cx - 20, cy + 32);
      ctx.quadraticCurveTo(cx - 56, cy + 72, cx - 64, cy + 124);
      ctx.lineTo(cx + 64, cy + 124);
      ctx.quadraticCurveTo(cx + 56, cy + 72, cx + 20, cy + 32);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }

    // ==================== 后发层（23种截然不同的真实二次元发型） ====================
    ctx.fillStyle = hairCol;
    ctx.strokeStyle = 'rgba(15,23,42,0.42)';
    ctx.lineWidth = 1.6;
    if (hairStyle === 'pixie') {
      // 1. 超短精灵短发（紧贴头型、完全露耳、绝无长发）
      ctx.beginPath();
      ctx.arc(cx, cy - 16, 28.5, Math.PI * 0.92, Math.PI * 2.08);
      ctx.lineTo(cx + 26, cy + 6); ctx.lineTo(cx - 26, cy + 6); ctx.closePath();
      ctx.fill(); ctx.stroke();
    } else if (hairStyle === 'flipped_bob') {
      // 2. 外翻翘尾短发（发尾明显向左右外翘）
      ctx.beginPath();
      ctx.arc(cx, cy - 15, 30, Math.PI * 0.88, Math.PI * 2.12);
      ctx.quadraticCurveTo(cx + 32, cy + 12, cx + 44, cy + 20);
      ctx.quadraticCurveTo(cx + 26, cy + 24, cx + 18, cy + 18);
      ctx.lineTo(cx - 18, cy + 18);
      ctx.quadraticCurveTo(cx - 26, cy + 24, cx - 44, cy + 20);
      ctx.quadraticCurveTo(cx - 32, cy + 12, cx - 30, cy - 12);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (hairStyle === 'wolf_cut') {
      // 3. 层次鲻鱼头/狼尾长发（头顶蓬松短碎 + 颈后细长层次狼尾）
      ctx.beginPath();
      ctx.moveTo(cx - 22, cy + 14);
      ctx.lineTo(cx - 34, cy + 86); ctx.lineTo(cx - 16, cy + 72);
      ctx.lineTo(cx, cy + 94); ctx.lineTo(cx + 16, cy + 72);
      ctx.lineTo(cx + 34, cy + 86); ctx.lineTo(cx + 22, cy + 14);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy - 15, 30, Math.PI * 0.9, Math.PI * 2.1);
      ctx.lineTo(cx + 40, cy + 6); ctx.lineTo(cx + 26, cy + 12);
      ctx.lineTo(cx - 26, cy + 12); ctx.lineTo(cx - 40, cy + 6);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (hairStyle === 'fluffy_curl') {
      // 4. 蓬松羊毛卷/泡面卷（朵朵卷曲发团环绕）
      for (let i = 0; i < 9; i++) {
        const ang = Math.PI * 0.8 + (i / 8) * Math.PI * 1.4;
        const bx = cx + Math.cos(ang) * 34, by = cy - 6 + Math.sin(ang) * 30;
        ctx.beginPath(); ctx.arc(bx, by, 14, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
      [-1, 1].forEach(d => {
        [24, 48, 72].forEach((dy, idx) => {
          ctx.beginPath(); ctx.arc(cx + d * (36 + idx * 3), cy + dy, 13 - idx, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        });
      });
    } else if (hairStyle === 'loop_braids') {
      // 5. 双环羊角盘辫（左右两个大圆环编发）
      [-1, 1].forEach(d => {
        ctx.lineWidth = 9; ctx.strokeStyle = hairCol;
        ctx.beginPath(); ctx.ellipse(cx + d * 38, cy + 4, 15, 24, d * 0.2, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(15,23,42,0.45)';
        ctx.beginPath(); ctx.ellipse(cx + d * 38, cy + 4, 19, 28, d * 0.2, 0, Math.PI * 2); ctx.stroke();
      });
      ctx.beginPath(); ctx.arc(cx, cy - 15, 28, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else if (hairStyle === 'messy_updo') {
      // 6. 慵懒高盘发 + 双侧垂落卷鬓发
      ctx.beginPath(); ctx.arc(cx + 8, cy - 44, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx - 10, cy - 40, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy - 15, 29, Math.PI * 0.88, Math.PI * 2.12); ctx.lineTo(cx + 22, cy + 16); ctx.lineTo(cx - 22, cy + 16); ctx.closePath(); ctx.fill(); ctx.stroke();
      [-1, 1].forEach(d => {
        ctx.beginPath();
        ctx.moveTo(cx + d * 24, cy + 6);
        ctx.quadraticCurveTo(cx + d * 34, cy + 28, cx + d * 24, cy + 48);
        ctx.quadraticCurveTo(cx + d * 20, cy + 28, cx + d * 19, cy + 8);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      });
    } else if (hairStyle === 'crown_braid') {
      // 7. 编发花冠盘发（额顶一圈编发环）
      ctx.beginPath(); ctx.arc(cx, cy - 15, 29, Math.PI * 0.88, Math.PI * 2.12); ctx.lineTo(cx + 22, cy + 18); ctx.lineTo(cx - 22, cy + 18); ctx.closePath(); ctx.fill(); ctx.stroke();
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath(); ctx.arc(cx + i * 8, cy - 39 + Math.abs(i) * 2, 6.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
    } else if (hairStyle === 'asym_sweep') {
      // 8. 单边露耳偏分长发（右侧完全短发露耳，左侧大束长发垂落）
      ctx.beginPath();
      ctx.arc(cx, cy - 15, 29, Math.PI * 0.88, Math.PI * 2.12);
      ctx.lineTo(cx + 22, cy + 12);
      ctx.lineTo(cx - 24, cy + 12);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 26, cy - 14);
      ctx.bezierCurveTo(cx - 64, cy + 14, cx - 58, cy + 68, cx - 34, cy + 106);
      ctx.quadraticCurveTo(cx - 24, cy + 68, cx - 18, cy + 16);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (hairStyle === 'drill_single') {
      // 9. 单边大螺旋公主卷 + 另一侧利落短发
      ctx.beginPath(); ctx.arc(cx, cy - 15, 29, Math.PI * 0.88, Math.PI * 2.12); ctx.lineTo(cx + 22, cy + 14); ctx.lineTo(cx - 22, cy + 14); ctx.closePath(); ctx.fill(); ctx.stroke();
      for (let k = 0; k < 4; k++) {
        ctx.beginPath();
        ctx.ellipse(cx + 38 + k * 2, cy + 14 + k * 20, 14 - k * 1.5, 16, 0.2, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
      }
    } else if (hairStyle === 'twintails') {
      [-1, 1].forEach(d => {
        ctx.beginPath();
        ctx.moveTo(cx + d * 24, cy - 24);
        ctx.bezierCurveTo(cx + d * 82, cy - 34, cx + d * 86, cy + 28, cx + d * 64, cy + 90);
        ctx.quadraticCurveTo(cx + d * 52, cy + 62, cx + d * 44, cy + 80);
        ctx.bezierCurveTo(cx + d * 50, cy + 26, cx + d * 42, cy - 6, cx + d * 22, cy - 10);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = trimCol;
        ctx.beginPath(); ctx.arc(cx + d * 26, cy - 18, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = hairCol;
      });
      ctx.beginPath(); ctx.arc(cx, cy - 16, 28, 0, Math.PI * 2); ctx.fill();
    } else if (hairStyle === 'low_twintails') {
      [-1, 1].forEach(d => {
        for (let k = 0; k < 3; k++) {
          ctx.beginPath();
          ctx.ellipse(cx + d * (40 + k * 3), cy + 16 + k * 24, 13 - k * 1.5, 17, d * 0.2, 0, Math.PI * 2);
          ctx.fill(); ctx.stroke();
        }
      });
      ctx.beginPath(); ctx.arc(cx, cy - 16, 28, 0, Math.PI * 2); ctx.fill();
    } else if (hairStyle === 'ponytail' || hairStyle === 'side_ponytail') {
      // 飘逸流畅二次元单马尾（无球形装饰，自然S形垂落收尖）
      const dir = hairStyle === 'side_ponytail' ? -1 : 1;
      ctx.beginPath();
      ctx.moveTo(cx + dir * 14, cy - 30);
      ctx.bezierCurveTo(cx + dir * 56, cy - 44, cx + dir * 68, cy + 2, cx + dir * 50, cy + 64);
      ctx.quadraticCurveTo(cx + dir * 42, cy + 78, cx + dir * 34, cy + 84);
      ctx.bezierCurveTo(cx + dir * 42, cy + 46, cx + dir * 40, cy + 4, cx + dir * 12, cy - 18);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // 柔和内侧发束分缕线
      ctx.strokeStyle = 'rgba(15,23,42,0.28)'; ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(cx + dir * 24, cy - 22);
      ctx.quadraticCurveTo(cx + dir * 52, cy + 4, cx + dir * 40, cy + 62);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(15,23,42,0.45)'; ctx.lineWidth = 1.6;
      // 细窄发带（非圆球）
      ctx.fillStyle = trimCol;
      ctx.save();
      ctx.translate(cx + dir * 16, cy - 26);
      ctx.rotate(dir * 0.45);
      ctx.fillRect(-3.5, -5.5, 7, 11);
      ctx.restore();
      ctx.fillStyle = hairCol;
      ctx.beginPath(); ctx.arc(cx, cy - 16, 28, 0, Math.PI * 2); ctx.fill();
    } else if (hairStyle === 'bob') {
      ctx.beginPath();
      ctx.arc(cx, cy - 15, 31, Math.PI * 0.88, Math.PI * 2.12);
      ctx.quadraticCurveTo(cx + 34, cy + 16, cx + 17, cy + 20);
      ctx.lineTo(cx - 17, cy + 20);
      ctx.quadraticCurveTo(cx - 34, cy + 16, cx - 31, cy - 12);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (hairStyle === 'short_spiky') {
      ctx.beginPath();
      ctx.arc(cx, cy - 15, 29, Math.PI * 0.9, Math.PI * 2.1);
      ctx.lineTo(cx + 42, cy + 4); ctx.lineTo(cx + 27, cy + 10);
      ctx.lineTo(cx + 35, cy + 23); ctx.lineTo(cx + 16, cy + 18);
      ctx.lineTo(cx - 16, cy + 18); ctx.lineTo(cx - 35, cy + 23);
      ctx.lineTo(cx - 27, cy + 10); ctx.lineTo(cx - 42, cy + 4);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (hairStyle === 'braids' || hairStyle === 'side_braid') {
      ctx.beginPath();
      ctx.arc(cx, cy - 15, 29, Math.PI * 0.88, Math.PI * 2.12);
      ctx.lineTo(cx + 22, cy + 18); ctx.lineTo(cx - 22, cy + 18); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (hairStyle === 'bun' || hairStyle === 'high_bun') {
      if (hairStyle === 'bun') {
        [-1, 1].forEach(d => {
          ctx.beginPath(); ctx.arc(cx + d * 26, cy - 36, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        });
      } else {
        ctx.beginPath(); ctx.arc(cx, cy - 46, 14, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = trimCol; ctx.fillRect(cx - 14, cy - 40, 28, 3.5);
        ctx.fillStyle = hairCol;
      }
      ctx.beginPath();
      ctx.arc(cx, cy - 15, 28, Math.PI * 0.88, Math.PI * 2.12);
      ctx.lineTo(cx + 22, cy + 18); ctx.lineTo(cx - 22, cy + 18); ctx.closePath(); ctx.fill();
    } else if (hairStyle === 'wavy') {
      ctx.beginPath();
      ctx.moveTo(cx - 30, cy - 18);
      ctx.bezierCurveTo(cx - 64, cy + 10, cx - 28, cy + 42, cx - 58, cy + 78);
      ctx.quadraticCurveTo(cx - 44, cy + 104, cx - 28, cy + 108);
      ctx.lineTo(cx + 28, cy + 108);
      ctx.quadraticCurveTo(cx + 44, cy + 104, cx + 58, cy + 78);
      ctx.bezierCurveTo(cx + 28, cy + 42, cx + 64, cy + 10, cx + 30, cy - 18);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (hairStyle === 'half_up') {
      ctx.beginPath(); ctx.arc(cx, cy - 38, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 28, cy - 16);
      ctx.quadraticCurveTo(cx - 48, cy + 30, cx - 36, cy + 88);
      ctx.lineTo(cx + 36, cy + 88);
      ctx.quadraticCurveTo(cx + 48, cy + 30, cx + 28, cy - 16);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(cx - 30, cy - 18);
      ctx.quadraticCurveTo(cx - 56, cy + 38, cx - 46, cy + 106);
      ctx.lineTo(cx + 46, cy + 106);
      ctx.quadraticCurveTo(cx + 56, cy + 38, cx + 30, cy - 18);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }

    // 头饰后层（光环/猫耳/狼耳/龙角/皇冠）
    if (headgear === 'halo') {
      ctx.strokeStyle = '#fde047'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(cx, cy - 46, 26, 6.5, 0, 0, Math.PI * 2); ctx.stroke();
    } else if (headgear === 'cat_ears' || headgear === 'wolf_ears') {
      ctx.fillStyle = hairCol; ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.8;
      [-1, 1].forEach(d => {
        ctx.beginPath();
        ctx.moveTo(cx + d * 10, cy - 34);
        ctx.lineTo(cx + d * 26, cy - 60);
        ctx.lineTo(cx + d * 28, cy - 26);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = headgear === 'cat_ears' ? '#fda4af' : '#cbd5e1';
        ctx.beginPath();
        ctx.moveTo(cx + d * 14, cy - 34);
        ctx.lineTo(cx + d * 23, cy - 51);
        ctx.lineTo(cx + d * 24, cy - 30);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = hairCol;
      });
    } else if (headgear === 'horns') {
      ctx.fillStyle = '#dc2626'; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 1.8;
      [-1, 1].forEach(d => {
        ctx.beginPath();
        ctx.moveTo(cx + d * 15, cy - 34);
        ctx.quadraticCurveTo(cx + d * 38, cy - 58, cx + d * 30, cy - 68);
        ctx.quadraticCurveTo(cx + d * 24, cy - 46, cx + d * 20, cy - 28);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      });
    } else if (headgear === 'crown') {
      ctx.fillStyle = '#fbbf24'; ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(cx - 17, cy - 36); ctx.lineTo(cx - 21, cy - 53); ctx.lineTo(cx - 8, cy - 45);
      ctx.lineTo(cx, cy - 57); ctx.lineTo(cx + 8, cy - 45); ctx.lineTo(cx + 21, cy - 53);
      ctx.lineTo(cx + 17, cy - 36); ctx.closePath(); ctx.fill(); ctx.stroke();
    }

    // 纤细脖颈
    ctx.fillStyle = skinCol;
    ctx.fillRect(cx - 6.5, cy + 16, 13, 15);
    ctx.fillStyle = 'rgba(180,110,90,0.22)';
    ctx.beginPath(); ctx.ellipse(cx, cy + 22, 7.5, 3.5, 0, 0, Math.PI * 2); ctx.fill();

    // ==================== 8种绝对不方正的沙漏型少女服饰轮廓 ====================
    // 统一采用：斜肩(cx±26) -> 明显收腰(cx±15, cy+58) -> 优雅裙摆(cx±44~56, cy+122)
    ctx.fillStyle = suitCol;
    ctx.strokeStyle = trimCol;
    ctx.lineWidth = 2;
    if (bodyStyle === 'ballgown') {
      // 束腰大礼服裙摆
      ctx.beginPath();
      ctx.moveTo(cx - 11, cy + 28); ctx.lineTo(cx + 11, cy + 28);
      ctx.quadraticCurveTo(cx + 25, cy + 33, cx + 15, cy + 58);
      ctx.quadraticCurveTo(cx + 48, cy + 82, cx + 56, cy + 122);
      ctx.lineTo(cx - 56, cy + 122);
      ctx.quadraticCurveTo(cx - 48, cy + 82, cx - 15, cy + 58);
      ctx.quadraticCurveTo(cx - 25, cy + 33, cx - 11, cy + 28);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(cx - 15, cy + 58); ctx.lineTo(cx + 15, cy + 58); ctx.stroke();
    } else if (bodyStyle === 'maid_idol') {
      // 收腰偶像蓬裙 + 白色围裙
      ctx.beginPath();
      ctx.moveTo(cx - 11, cy + 28); ctx.lineTo(cx + 11, cy + 28);
      ctx.quadraticCurveTo(cx + 25, cy + 33, cx + 16, cy + 56);
      ctx.quadraticCurveTo(cx + 42, cy + 86, cx + 50, cy + 122);
      ctx.lineTo(cx - 50, cy + 122);
      ctx.quadraticCurveTo(cx - 42, cy + 86, cx - 16, cy + 56);
      ctx.quadraticCurveTo(cx - 25, cy + 33, cx - 11, cy + 28);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(cx - 14, cy + 60); ctx.lineTo(cx + 14, cy + 60);
      ctx.lineTo(cx + 32, cy + 122); ctx.lineTo(cx - 32, cy + 122);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (bodyStyle === 'off_shoulder') {
      // 先画露出的肉色肩颈与锁骨（避免露出后方发色）
      ctx.save();
      ctx.fillStyle = skinCol;
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy + 24);
      ctx.lineTo(cx + 8, cy + 24);
      ctx.quadraticCurveTo(cx + 25, cy + 29, cx + 26, cy + 44);
      ctx.lineTo(cx - 26, cy + 44);
      ctx.quadraticCurveTo(cx - 25, cy + 29, cx - 8, cy + 24);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(180, 120, 100, 0.35)'; ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(cx - 14, cy + 35); ctx.quadraticCurveTo(cx - 5, cy + 37, cx - 1, cy + 35);
      ctx.moveTo(cx + 14, cy + 35); ctx.quadraticCurveTo(cx + 5, cy + 37, cx + 1, cy + 35);
      ctx.stroke();
      ctx.restore();
      // 优雅露肩修身礼服（收腰 + 柔美A字裙）
      ctx.fillStyle = suitCol; ctx.strokeStyle = trimCol; ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(cx - 24, cy + 40); ctx.quadraticCurveTo(cx, cy + 47, cx + 24, cy + 40);
      ctx.lineTo(cx + 15, cy + 62);
      ctx.quadraticCurveTo(cx + 38, cy + 88, cx + 48, cy + 122);
      ctx.lineTo(cx - 48, cy + 122);
      ctx.quadraticCurveTo(cx - 38, cy + 88, cx - 15, cy + 62);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (bodyStyle === 'slit_qipao') {
      // 东方修身立领长衫
      ctx.beginPath();
      ctx.moveTo(cx - 11, cy + 27); ctx.lineTo(cx + 11, cy + 27);
      ctx.quadraticCurveTo(cx + 26, cy + 33, cx + 16, cy + 58);
      ctx.quadraticCurveTo(cx + 28, cy + 88, cx + 36, cy + 122);
      ctx.lineTo(cx - 36, cy + 122);
      ctx.quadraticCurveTo(cx - 28, cy + 88, cx - 16, cy + 58);
      ctx.quadraticCurveTo(cx - 26, cy + 33, cx - 11, cy + 27);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = trimCol; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(cx, cy + 29); ctx.lineTo(cx + 10, cy + 44); ctx.lineTo(cx + 10, cy + 78); ctx.stroke();
    } else if (bodyStyle === 'slim_robe') {
      // 圣女柔美长袍
      ctx.beginPath();
      ctx.moveTo(cx - 11, cy + 28); ctx.lineTo(cx + 11, cy + 28);
      ctx.quadraticCurveTo(cx + 25, cy + 33, cx + 16, cy + 58);
      ctx.quadraticCurveTo(cx + 32, cy + 90, cx + 40, cy + 122);
      ctx.lineTo(cx - 40, cy + 122);
      ctx.quadraticCurveTo(cx - 32, cy + 90, cx - 16, cy + 58);
      ctx.quadraticCurveTo(cx - 25, cy + 33, cx - 11, cy + 28);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = trimCol;
      ctx.fillRect(cx - 3, cy + 34, 6, 86);
    } else {
      // 经典/机甲收腰少女战裙
      ctx.beginPath();
      ctx.moveTo(cx - 11, cy + 28); ctx.lineTo(cx + 11, cy + 28);
      ctx.quadraticCurveTo(cx + 26, cy + 33, cx + 16, cy + 58);
      ctx.lineTo(cx + 44, cy + 122); ctx.lineTo(cx - 44, cy + 122);
      ctx.lineTo(cx - 16, cy + 58);
      ctx.quadraticCurveTo(cx - 26, cy + 33, cx - 11, cy + 28);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      if (bodyStyle === 'cyber_suit') {
        ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(cx - 16, cy + 58); ctx.lineTo(cx + 16, cy + 58); ctx.stroke();
      }
    }

    // ==================== 12种贴合身形的精致身体装饰 ====================
    if (bodyOrnament === 'pauldrons') {
      ctx.fillStyle = '#e2e8f0'; ctx.strokeStyle = trimCol; ctx.lineWidth = 1.8;
      [-1, 1].forEach(d => {
        ctx.beginPath();
        ctx.moveTo(cx + d * 13, cy + 29);
        ctx.quadraticCurveTo(cx + d * 30, cy + 29, cx + d * 29, cy + 45);
        ctx.quadraticCurveTo(cx + d * 19, cy + 44, cx + d * 12, cy + 37);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      });
      ctx.fillStyle = trimCol;
      ctx.beginPath(); ctx.moveTo(cx, cy + 35); ctx.lineTo(cx + 6, cy + 45); ctx.lineTo(cx, cy + 55); ctx.lineTo(cx - 6, cy + 45); ctx.closePath(); ctx.fill();
    } else if (bodyOrnament === 'choker') {
      ctx.fillStyle = '#0f172a'; ctx.fillRect(cx - 8, cy + 22, 16, 4.5);
      ctx.fillStyle = eyeCol; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.arc(cx, cy + 27, 3.8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = trimCol; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(cx - 15, cy + 32); ctx.quadraticCurveTo(cx, cy + 46, cx + 15, cy + 32); ctx.stroke();
    } else if (bodyOrnament === 'cape') {
      ctx.fillStyle = trimCol;
      ctx.beginPath(); ctx.arc(cx - 15, cy + 34, 4.2, 0, Math.PI * 2); ctx.arc(cx + 15, cy + 34, 4.2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = trimCol; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(cx - 15, cy + 34); ctx.quadraticCurveTo(cx, cy + 44, cx + 15, cy + 34); ctx.stroke();
    } else if (bodyOrnament === 'rose_brooch') {
      ctx.fillStyle = '#fff1f2'; ctx.strokeStyle = '#fda4af'; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(cx - 18, cy + 29); ctx.quadraticCurveTo(cx, cy + 46, cx + 18, cy + 29); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#22c55e';
      ctx.beginPath(); ctx.ellipse(cx - 8, cy + 42, 5.5, 2.8, -0.4, 0, Math.PI * 2); ctx.ellipse(cx + 8, cy + 42, 5.5, 2.8, 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e11d48'; ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.arc(cx, cy + 40, 6.8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else if (bodyOrnament === 'cross_necklace') {
      ctx.strokeStyle = '#fde047'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(cx - 10, cy + 28); ctx.lineTo(cx, cy + 40); ctx.lineTo(cx + 10, cy + 28); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy + 40); ctx.lineTo(cx, cy + 58); ctx.moveTo(cx - 6, cy + 47); ctx.lineTo(cx + 6, cy + 47); ctx.stroke();
    } else if (bodyOrnament === 'cyber_core') {
      ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(cx - 18, cy + 31); ctx.lineTo(cx, cy + 48); ctx.lineTo(cx + 18, cy + 31); ctx.stroke();
      ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.arc(cx, cy + 48, 6.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fde047'; ctx.stroke();
    } else if (bodyOrnament === 'fur_collar') {
      ctx.fillStyle = '#e2e8f0'; ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.4;
      [-16, -8, 0, 8, 16].forEach((dx, idx) => {
        ctx.beginPath(); ctx.arc(cx + dx, cy + 30 + (idx % 2) * 2, 6.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      });
      ctx.fillStyle = '#fde047';
      ctx.beginPath(); ctx.moveTo(cx - 2.5, cy + 37); ctx.lineTo(cx + 2.5, cy + 37); ctx.lineTo(cx, cy + 47); ctx.closePath(); ctx.fill();
    } else if (bodyOrnament === 'ribbons_bow') {
      ctx.fillStyle = trimCol; ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(cx, cy + 38); ctx.lineTo(cx - 14, cy + 31); ctx.lineTo(cx - 12, cy + 45); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy + 38); ctx.lineTo(cx + 14, cy + 31); ctx.lineTo(cx + 12, cy + 45); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy + 38, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else if (bodyOrnament === 'bone_necklace') {
      ctx.strokeStyle = '#c084fc'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(cx - 14, cy + 29); ctx.quadraticCurveTo(cx, cy + 44, cx + 14, cy + 29); ctx.stroke();
      ctx.fillStyle = '#f8fafc'; ctx.strokeStyle = '#7e22ce'; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.arc(cx, cy + 42, 5.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#a855f7'; ctx.beginPath(); ctx.arc(cx - 1.8, cy + 42, 1.1, 0, Math.PI * 2); ctx.arc(cx + 1.8, cy + 42, 1.1, 0, Math.PI * 2); ctx.fill();
    } else if (bodyOrnament === 'gem_sash') {
      ctx.strokeStyle = trimCol; ctx.lineWidth = 4.2;
      ctx.beginPath(); ctx.moveTo(cx - 16, cy + 32); ctx.lineTo(cx + 24, cy + 92); ctx.stroke();
      ctx.fillStyle = eyeCol; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(cx + 4, cy + 62, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else if (bodyOrnament === 'angel_stole') {
      ctx.fillStyle = '#fef9c3'; ctx.strokeStyle = '#facc15'; ctx.lineWidth = 1.4;
      ctx.fillRect(cx - 16, cy + 29, 6.5, 62); ctx.strokeRect(cx - 16, cy + 29, 6.5, 62);
      ctx.fillRect(cx + 9.5, cy + 29, 6.5, 62); ctx.strokeRect(cx + 9.5, cy + 29, 6.5, 62);
    }

    // ==================== 前置麻花辫（编织股纹理+柔顺收尖，无球形堆叠） ====================
    if (hairStyle === 'braids' || hairStyle === 'side_braid') {
      ctx.fillStyle = hairCol;
      ctx.strokeStyle = 'rgba(15,23,42,0.42)';
      ctx.lineWidth = 1.4;
      const sides = hairStyle === 'side_braid' ? [-1] : [-1, 1];
      sides.forEach(d => {
        const bx = cx + d * 19;
        ctx.beginPath();
        ctx.moveTo(bx - d * 4, cy + 16);
        ctx.quadraticCurveTo(bx + d * 9, cy + 45, bx + d * 5, cy + 78);
        ctx.quadraticCurveTo(bx - d * 1, cy + 62, bx - d * 3, cy + 40);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        for (let k = 0; k < 4; k++) {
          const py = cy + 25 + k * 11;
          const px = bx + d * (k * 0.9);
          ctx.beginPath();
          ctx.moveTo(px - 4.5, py); ctx.quadraticCurveTo(px, py + 4.5, px + 4.5, py + 1.5);
          ctx.stroke();
        }
        ctx.fillStyle = trimCol;
        ctx.fillRect(bx + d * 3 - 3.5, cy + 76, 7, 3);
        ctx.fillStyle = hairCol;
      });
    }

    // ==================== 4种协调精致的少女脸型 ====================
    ctx.fillStyle = skinCol;
    ctx.beginPath();
    if (faceShape === 'gentle_round' || faceShape === 'round' || faceShape === 'chibi') {
      ctx.moveTo(cx - 25, cy - 14);
      ctx.quadraticCurveTo(cx - 26, cy + 13, cx, cy + 22);
      ctx.quadraticCurveTo(cx + 26, cy + 13, cx + 25, cy - 14);
      ctx.arc(cx, cy - 14, 25, 0, Math.PI, true);
    } else if (faceShape === 'slender' || faceShape === 'sharp') {
      // 柔和下颌线：去掉尖锥下巴，改成圆润小鹅蛋
      ctx.moveTo(cx - 23.5, cy - 15);
      ctx.quadraticCurveTo(cx - 24, cy + 7, cx - 9, cy + 17.5);
      ctx.quadraticCurveTo(cx - 4, cy + 21, cx, cy + 21);
      ctx.quadraticCurveTo(cx + 4, cy + 21, cx + 9, cy + 17.5);
      ctx.quadraticCurveTo(cx + 24, cy + 7, cx + 23.5, cy - 15);
      ctx.arc(cx, cy - 15, 23.5, 0, Math.PI, true);
    } else if (faceShape === 'heart') {
      ctx.moveTo(cx - 25, cy - 15);
      ctx.bezierCurveTo(cx - 25, cy + 10, cx - 13, cy + 21, cx, cy + 21);
      ctx.bezierCurveTo(cx + 13, cy + 21, cx + 25, cy + 10, cx + 25, cy - 15);
      ctx.arc(cx, cy - 15, 25, 0, Math.PI, true);
    } else {
      ctx.moveTo(cx - 24.5, cy - 15);
      ctx.quadraticCurveTo(cx - 24.5, cy + 13, cx, cy + 23.5);
      ctx.quadraticCurveTo(cx + 24.5, cy + 13, cx + 24.5, cy - 15);
      ctx.arc(cx, cy - 15, 24.5, 0, Math.PI, true);
    }
    ctx.closePath(); ctx.fill();

    // 仅部分可爱/元气/害羞角色添加淡雅腮红（不画嘴）
    if (blush) {
      ctx.fillStyle = 'rgba(244,114,182,0.26)';
      ctx.beginPath();
      ctx.ellipse(cx - 14, cy + 8, 4.5, 2.1, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 14, cy + 8, 4.5, 2.1, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // ==================== 眼型与神态（无wink、无异色瞳） ====================
    [-12, 12].forEach((dx) => {
      const ex = cx + dx, ey = cy;
      ctx.fillStyle = '#ffffff';
      const ry = eyeStyle === 'sharp' ? 4.8 : (eyeStyle === 'droopy' ? 6.4 : 6);
      ctx.beginPath(); ctx.ellipse(ex, ey, 7, ry, eyeStyle === 'sharp' ? (dx < 0 ? 0.15 : -0.15) : 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = eyeCol;
      ctx.beginPath(); ctx.ellipse(ex, ey + 0.5, 5, ry - 0.8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#090d16';
      ctx.beginPath(); ctx.arc(ex, ey + 1, 2.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      if (eyeStyle === 'starry') {
        ctx.beginPath(); ctx.arc(ex, ey - 1, 2.2, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.beginPath(); ctx.arc(ex - 2, ey - 2, 2, 0, Math.PI * 2); ctx.fill();
      }
    });

    // ==================== 刘海层（不遮住双眼，仅 one_eye_cover 轻遮单眼） ====================
    ctx.fillStyle = hairCol;
    if (bangStyle === 'one_eye_cover') {
      // 单遮眼斜刘海：仅斜遮右眼，左眼完全清晰露出
      ctx.beginPath();
      ctx.arc(cx, cy - 15, 30, Math.PI, Math.PI * 2);
      ctx.lineTo(cx + 30, cy + 9);
      ctx.quadraticCurveTo(cx + 12, cy + 12, cx - 2, cy - 3);
      ctx.quadraticCurveTo(cx - 16, cy - 8, cx - 29, cy - 3);
      ctx.closePath(); ctx.fill();
    } else if (bangStyle === 'side_swept') {
      // 斜分刘海（下缘停在眉眼上方，不遮双眼）
      ctx.beginPath();
      ctx.arc(cx, cy - 15, 30, Math.PI, Math.PI * 2);
      ctx.lineTo(cx + 30, cy - 3);
      ctx.quadraticCurveTo(cx + 4, cy - 9, cx - 28, cy - 4);
      ctx.closePath(); ctx.fill();
    } else if (bangStyle === 'hime_cut') {
      ctx.beginPath();
      ctx.arc(cx, cy - 15, 30, Math.PI, Math.PI * 2);
      ctx.lineTo(cx + 30, cy - 5); ctx.lineTo(cx - 30, cy - 5);
      ctx.closePath(); ctx.fill();
      [-1, 1].forEach(d => {
        ctx.fillRect(cx + d * 24 - 4, cy - 12, 8, 42);
      });
    } else if (bangStyle === 'parted') {
      // 八字中分刘海（两侧轻垂耳旁，双眼完全露出）
      ctx.beginPath();
      ctx.arc(cx, cy - 15, 30, Math.PI, Math.PI * 2);
      ctx.lineTo(cx + 30, cy + 4); ctx.quadraticCurveTo(cx + 18, cy - 6, cx, cy - 18);
      ctx.quadraticCurveTo(cx - 18, cy - 6, cx - 30, cy + 4);
      ctx.closePath(); ctx.fill();
    } else {
      // 齐眉碎刘海（露眼不遮瞳）
      ctx.beginPath();
      ctx.arc(cx, cy - 15, 30, Math.PI, Math.PI * 2);
      ctx.lineTo(cx + 30, cy - 4); ctx.lineTo(cx + 18, cy - 10);
      ctx.lineTo(cx + 6, cy - 4); ctx.lineTo(cx - 6, cy - 11);
      ctx.lineTo(cx - 18, cy - 4); ctx.lineTo(cx - 30, cy - 4);
      ctx.closePath(); ctx.fill();
    }

    // 多样化呆毛（6种：classic/heart/lightning/double/curl/sprout）
    if (ahoge) {
      const aType = typeof ahoge === 'string' ? ahoge : 'classic';
      ctx.strokeStyle = hairCol; ctx.fillStyle = hairCol;
      ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      if (aType === 'heart') {
        // 爱心呆毛
        ctx.beginPath();
        ctx.moveTo(cx, cy - 42);
        ctx.bezierCurveTo(cx - 12, cy - 56, cx - 2, cy - 66, cx + 2, cy - 55);
        ctx.bezierCurveTo(cx + 6, cy - 66, cx + 16, cy - 56, cx + 4, cy - 42);
        ctx.stroke();
      } else if (aType === 'lightning') {
        // 闪电锯齿呆毛
        ctx.beginPath();
        ctx.moveTo(cx - 2, cy - 42);
        ctx.lineTo(cx + 8, cy - 53);
        ctx.lineTo(cx + 1, cy - 56);
        ctx.lineTo(cx + 13, cy - 67);
        ctx.stroke();
      } else if (aType === 'double') {
        // 一长一短双呆毛
        ctx.beginPath();
        ctx.moveTo(cx - 3, cy - 42);
        ctx.quadraticCurveTo(cx - 14, cy - 60, cx - 20, cy - 50);
        ctx.moveTo(cx + 3, cy - 42);
        ctx.quadraticCurveTo(cx + 12, cy - 64, cx + 22, cy - 56);
        ctx.stroke();
      } else if (aType === 'curl') {
        // 弹簧螺旋卷呆毛
        ctx.beginPath();
        ctx.moveTo(cx, cy - 42);
        ctx.bezierCurveTo(cx - 10, cy - 56, cx + 14, cy - 66, cx + 8, cy - 54);
        ctx.bezierCurveTo(cx + 3, cy - 46, cx + 18, cy - 52, cx + 14, cy - 62);
        ctx.stroke();
      } else if (aType === 'sprout') {
        // 嫩芽双叶呆毛
        ctx.beginPath();
        ctx.moveTo(cx, cy - 42); ctx.lineTo(cx, cy - 54); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(cx - 6, cy - 56, 6, 3, -0.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + 6, cy - 56, 6, 3, 0.5, 0, Math.PI * 2); ctx.fill();
      } else {
        // 经典单弯呆毛
        ctx.beginPath();
        ctx.moveTo(cx, cy - 42);
        ctx.quadraticCurveTo(cx + 10, cy - 60, cx + 22, cy - 52);
        ctx.quadraticCurveTo(cx + 14, cy - 54, cx + 6, cy - 43);
        ctx.stroke();
      }
      ctx.lineCap = 'butt'; ctx.lineJoin = 'miter';
    }

    // ==================== 12种醒目发饰 ====================
    if (hairOrnament === 'ribbon') {
      // 小巧单侧蝴蝶结发饰（不再使用双侧大三角）
      const rx = cx + 23, ry = cy - 28;
      ctx.fillStyle = trimCol; ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.ellipse(rx - 5, ry, 5.5, 3.2, -0.35, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(rx + 5, ry, 5.5, 3.2, 0.35, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(rx, ry, 2.5, 0, Math.PI * 2); ctx.fill();
    } else if (hairOrnament === 'star_clips') {
      ctx.fillStyle = '#fde047'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.2;
      [[-22, -24], [-13, -30]].forEach(([dx, dy]) => {
        ctx.beginPath(); ctx.arc(cx + dx, cy + dy, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      });
    } else if (hairOrnament === 'rose') {
      ctx.fillStyle = '#22c55e'; ctx.beginPath(); ctx.ellipse(cx + 32, cy - 22, 6, 3, 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e11d48'; ctx.strokeStyle = '#fecdd3'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(cx + 24, cy - 26, 9.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else if (hairOrnament === 'cyber_clips') {
      ctx.fillStyle = '#22d3ee'; ctx.strokeStyle = '#e0f2fe'; ctx.lineWidth = 1.6;
      [-1, 1].forEach(d => {
        ctx.fillRect(cx + d * 24 - 4, cy - 32, 8, 12); ctx.strokeRect(cx + d * 24 - 4, cy - 32, 8, 12);
        ctx.beginPath(); ctx.moveTo(cx + d * 24, cy - 32); ctx.lineTo(cx + d * 32, cy - 52); ctx.stroke();
      });
    } else if (hairOrnament === 'feather') {
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 1.6;
      [-1, 1].forEach(d => {
        ctx.beginPath(); ctx.ellipse(cx + d * 30, cy - 24, 13, 5.5, d * -0.45, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      });
    } else if (hairOrnament === 'gold_pins') {
      ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(cx - 40, cy - 28); ctx.lineTo(cx + 40, cy - 28); ctx.stroke();
      ctx.fillStyle = eyeCol; ctx.beginPath(); ctx.arc(cx, cy - 24, 4.5, 0, Math.PI * 2); ctx.fill();
    } else if (hairOrnament === 'bell_ribbons') {
      [-1, 1].forEach(d => {
        ctx.fillStyle = '#facc15'; ctx.strokeStyle = '#b45309'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(cx + d * 28, cy - 18, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      });
    } else if (hairOrnament === 'skull_clip') {
      ctx.fillStyle = '#f8fafc'; ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx - 23, cy - 24, 6.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#a855f7'; ctx.beginPath(); ctx.arc(cx - 25, cy - 24, 1.4, 0, Math.PI * 2); ctx.arc(cx - 21, cy - 24, 1.4, 0, Math.PI * 2); ctx.fill();
    } else if (hairOrnament === 'crescent_pin') {
      ctx.fillStyle = '#fde047';
      ctx.beginPath(); ctx.arc(cx + 22, cy - 26, 7, 0.4, Math.PI * 1.7); ctx.fill();
    } else if (hairOrnament === 'butterfly') {
      ctx.fillStyle = eyeCol; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(cx - 24, cy - 26, 6, 4, -0.4, 0, Math.PI * 2); ctx.ellipse(cx - 18, cy - 22, 5, 3, 0.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else if (hairOrnament === 'flower_wreath') {
      [-20, -7, 7, 20].forEach((dx, i) => {
        ctx.fillStyle = i % 2 === 0 ? '#f472b6' : '#fde047';
        ctx.beginPath(); ctx.arc(cx + dx, cy - 30, 5.5, 0, Math.PI * 2); ctx.fill();
      });
    }

    if (headgear === 'nun_veil') {
      ctx.fillStyle = '#1e293b'; ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy - 16, 33, Math.PI * 0.92, Math.PI * 2.08);
      ctx.lineTo(cx + 42, cy + 44); ctx.lineTo(cx + 26, cy + 32);
      ctx.lineTo(cx + 26, cy - 12); ctx.arc(cx, cy - 12, 26, 0, Math.PI, true);
      ctx.lineTo(cx - 26, cy + 32); ctx.lineTo(cx - 42, cy + 44);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (headgear === 'visor') {
      ctx.fillStyle = 'rgba(34, 211, 238, 0.55)'; ctx.strokeStyle = '#e0f2fe'; ctx.lineWidth = 2;
      ctx.fillRect(cx - 25, cy - 8, 50, 14); ctx.strokeRect(cx - 25, cy - 8, 50, 14);
    }

    // 专属道具
    if (propType === 'greatsword') {
      ctx.save();
      ctx.translate(cx + 46, cy + 20);
      ctx.rotate(-0.35);
      const sg = ctx.createLinearGradient(0, -90, 0, 40);
      sg.addColorStop(0, '#e0f2fe'); sg.addColorStop(1, '#38bdf8');
      ctx.fillStyle = sg; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -95); ctx.lineTo(12, -72); ctx.lineTo(10, 26); ctx.lineTo(-10, 26); ctx.lineTo(-12, -72);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fbbf24'; ctx.fillRect(-20, 24, 40, 8);
      ctx.fillRect(-4, 32, 8, 22);
      ctx.restore();
    } else if (propType === 'scythe') {
      ctx.save();
      ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(cx + 50, cy + 100); ctx.lineTo(cx + 38, cy - 62); ctx.stroke();
      ctx.fillStyle = '#c084fc'; ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + 38, cy - 62);
      ctx.quadraticCurveTo(cx - 34, cy - 72, cx - 54, cy - 22);
      ctx.quadraticCurveTo(cx - 12, cy - 42, cx + 38, cy - 44);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    } else if (propType === 'necromancer_staff' || propType === 'shepherd_staff') {
      const staffX = cx - 48;
      ctx.strokeStyle = propType === 'necromancer_staff' ? '#581c87' : '#d97706';
      ctx.lineWidth = 4.5;
      ctx.beginPath(); ctx.moveTo(staffX, cy + 95); ctx.lineTo(staffX, cy - 45); ctx.stroke();
      ctx.fillStyle = propType === 'necromancer_staff' ? '#c084fc' : '#38bdf8';
      ctx.beginPath(); ctx.arc(staffX, cy - 52, 12, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(staffX, cy - 52, 17, 0, Math.PI * 2); ctx.stroke();
    } else if (propType === 'thorn_shield') {
      ctx.fillStyle = '#1e293b'; ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(cx + 34, cy + 10); ctx.lineTo(cx + 76, cy + 10);
      ctx.lineTo(cx + 70, cy + 56); ctx.lineTo(cx + 55, cy + 78); ctx.lineTo(cx + 40, cy + 56);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (propType === 'dragon_lance') {
      ctx.strokeStyle = '#fde047'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(cx + 46, cy + 100); ctx.lineTo(cx + 58, cy - 76); ctx.stroke();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath(); ctx.moveTo(cx + 58, cy - 86); ctx.lineTo(cx + 48, cy - 54); ctx.lineTo(cx + 68, cy - 54); ctx.closePath(); ctx.fill();
    } else if (propType === 'wrench' || propType === 'hammer') {
      ctx.fillStyle = '#94a3b8'; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2;
      ctx.fillRect(cx + 42, cy - 25, 10, 88);
      ctx.fillRect(cx + 30, cy - 36, 34, 18); ctx.strokeRect(cx + 30, cy - 36, 34, 18);
    } else if (propType === 'katana_dual') {
      ctx.strokeStyle = '#e0f2fe'; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(cx - 56, cy + 50); ctx.lineTo(cx - 18, cy - 55); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 56, cy + 50); ctx.lineTo(cx + 18, cy - 55); ctx.stroke();
    } else if (propType === 'mic') {
      ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx + 36, cy + 50); ctx.lineTo(cx + 28, cy + 10); ctx.stroke();
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath(); ctx.arc(cx + 28, cy + 6, 8, 0, Math.PI * 2); ctx.fill();
    } else if (propType === 'flask') {
      ctx.fillStyle = 'rgba(74,222,128,0.85)'; ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx - 44, cy + 34, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillRect(cx - 48, cy + 12, 8, 12);
    } else if (propType === 'grimoire') {
      ctx.fillStyle = '#312e81'; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2;
      ctx.fillRect(cx - 58, cy + 16, 26, 34); ctx.strokeRect(cx - 58, cy + 16, 26, 34);
    } else if (propType === 'express_flag') {
      ctx.strokeStyle = '#fde047'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx + 48, cy + 95); ctx.lineTo(cx + 48, cy - 65); ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.moveTo(cx + 48, cy - 65); ctx.lineTo(cx + 92, cy - 45); ctx.lineTo(cx + 48, cy - 25); ctx.closePath(); ctx.fill();
    } else if (propType === 'hover_board') {
      ctx.fillStyle = '#06b6d4'; ctx.strokeStyle = '#e0f2fe'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(cx, cy + 88, 62, 12, -0.1, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else if (propType === 'bomber') {
      ctx.fillStyle = '#f97316'; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(cx + 46, cy + 38, 16, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else if (propType === 'fan_strategist') {
      ctx.fillStyle = '#fef3c7'; ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx + 26, cy + 44); ctx.arc(cx + 26, cy + 44, 28, -1.9, -0.3); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }

  // 主入口：返回 true 表示命中了高精度重绘或新卡绘制；返回 false 可交给原逻辑兜底
  global.renderCustomCardArt = function (ctx, cardData) {
    const name = cardData.artCardName || cardData.sourceCardName || cardData.name || '';
    const id = cardData.id || '';
    const h = hashStr(id + '_' + name);

    // ================= 3. 角色类卡牌高精度定制（含所有新人物与原有重复模板人物） =================
    const charPresets = {
      '大剑少女': { bg: ['#38bdf8', '#1e1b4b'], hair: '#e2e8f0', eye: '#38bdf8', suit: '#1e3a8a', prop: 'greatsword', aura: '#38bdf8', hs: 'ponytail', bs: 'side_swept', ho: 'ribbon', bo: 'pauldrons', bds: 'classic_armor', ahoge: 'sprout'},
      '狼少女': { bg: ['#312e81', '#090d16'], hair: '#cbd5e1', eye: '#fde047', suit: '#1e293b', headgear: 'wolf_ears', prop: 'katana_dual', hs: 'short_spiky', bs: 'side_swept', ho: 'bell_ribbons', bo: 'fur_collar', bds: 'cape_cloak'},
      '猫耳播报员': { bg: ['#f472b6', '#31102f'], hair: '#fbcfe8', eye: '#38bdf8', suit: '#be185d', headgear: 'cat_ears', prop: 'mic', hs: 'bun', bs: 'classic', ho: 'star_clips', bo: 'ribbons_bow', bds: 'maid_idol', ahoge: 'heart', blush: true},
      '骸骨和少女': { bg: ['#a855f7', '#0f172a'], hair: '#e9d5ff', eye: '#f43f5e', suit: '#3b0764', prop: 'necromancer_staff', aura: '#c084fc', hs: 'low_twintails', bs: 'hime_cut', ho: 'skull_clip', bo: 'bone_necklace', bds: 'slim_robe'},
      '玩耍的唤灵术士': { bg: ['#a855f7', '#1e1b4b'], hair: '#c4b5fd', eye: '#fde047', suit: '#4c1d95', prop: 'necromancer_staff', aura: '#a855f7', hs: 'twintails', bs: 'classic', ho: 'skull_clip', bo: 'ribbons_bow', bds: 'slim_robe', ahoge: 'curl', blush: true},
      '招魂的术士': { bg: ['#7e22ce', '#090d16'], hair: '#ddd6fe', eye: '#4ade80', suit: '#3b0764', prop: 'necromancer_staff', aura: '#4ade80', hs: 'braids', bs: 'parted', ho: 'skull_clip', bo: 'bone_necklace', bds: 'slim_robe'},
      '灵魂雕塑家': { bg: ['#06b6d4', '#1e1b4b'], hair: '#a5f3fc', eye: '#fde047', suit: '#164e63', prop: 'grimoire', aura: '#22d3ee', hs: 'jellyfish_cut', bs: 'side_swept', ho: 'star_clips', bo: 'choker', bds: 'off_shoulder'},
      '死神代行人': { bg: ['#581c87', '#050811'], hair: '#e2e8f0', eye: '#f43f5e', suit: '#0f172a', wing: 'bone_wings', prop: 'scythe', hs: 'hime', bs: 'one_eye_cover', ho: 'skull_clip', bo: 'cape', bds: 'slim_robe'},
      '冥河引渡人': { bg: ['#0284c7', '#090d16'], hair: '#bae6fd', eye: '#38bdf8', suit: '#0c4a6e', prop: 'necromancer_staff', aura: '#38bdf8', hs: 'long', bs: 'parted', ho: 'gold_pins', bo: 'cape', bds: 'slim_robe'},
      '送葬人': { bg: ['#475569', '#090d16'], hair: '#94a3b8', eye: '#c084fc', suit: '#1e293b', prop: 'scythe', hs: 'bob', bs: 'side_swept', ho: 'none', bo: 'cross_necklace', bds: 'slim_robe'},
      '哀乐奏响者': { bg: ['#6366f1', '#1e1b4b'], hair: '#c7d2fe', eye: '#fde047', suit: '#312e81', prop: 'mic', aura: '#818cf8', hs: 'wavy', bs: 'parted', ho: 'ribbon', bo: 'choker', bds: 'off_shoulder'},
      '猎魄师': { bg: ['#c084fc', '#090d16'], hair: '#f3e8ff', eye: '#22d3ee', suit: '#3b0764', prop: 'katana_dual', aura: '#c084fc', hs: 'ponytail', bs: 'one_eye_cover', ho: 'skull_clip', bo: 'cape', bds: 'cape_cloak'},
      '戏谑的吸血鬼': { bg: ['#be123c', '#090d16'], hair: '#fda4af', eye: '#ef4444', suit: '#4c0519', wing: 'demon_wings', hs: 'loop_braids', bs: 'classic', ho: 'ribbon', bo: 'choker', bds: 'off_shoulder'},
      '吸血鬼贵族': { bg: ['#9f1239', '#1e1b4b'], hair: '#f8fafc', eye: '#ef4444', suit: '#4c0519', wing: 'demon_wings', headgear: 'crown', hs: 'wavy', bs: 'parted', ho: 'rose', bo: 'cape', bds: 'ballgown'},
      '热情的魅魔': { bg: ['#ec4899', '#3b0764'], hair: '#f472b6', eye: '#fde047', suit: '#831843', wing: 'demon_wings', headgear: 'horns', hs: 'messy_updo', bs: 'side_swept', ho: 'rose', bo: 'choker', bds: 'off_shoulder'},
      '恶魔的仆从': { bg: ['#7f1d1d', '#090d16'], hair: '#fca5a5', eye: '#f97316', suit: '#450a0a', wing: 'demon_wings', headgear: 'horns', hs: 'short_spiky', bs: 'classic', ho: 'none', bo: 'choker', bds: 'cape_cloak'},
      '血法师': { bg: ['#dc2626', '#1e1b4b'], hair: '#fecaca', eye: '#ef4444', suit: '#450a0a', prop: 'grimoire', aura: '#ef4444', hs: 'hime', bs: 'hime_cut', ho: 'gold_pins', bo: 'cape', bds: 'slim_robe'},
      '浴血的刀客': { bg: ['#b91c1c', '#090d16'], hair: '#e2e8f0', eye: '#ef4444', suit: '#1e293b', prop: 'katana_dual', hs: 'short_spiky', bs: 'side_swept', ho: 'ribbon', bo: 'pauldrons', bds: 'classic_armor'},
      '咆哮的狼人': { bg: ['#475569', '#090d16'], hair: '#94a3b8', eye: '#fde047', suit: '#334155', headgear: 'wolf_ears', prop: 'katana_dual', hs: 'short_spiky', bs: 'parted', ho: 'none', bo: 'fur_collar', bds: 'cape_cloak'},
      '叹息之墙盾': { bg: ['#fbbf24', '#1e293b'], hair: '#fef08a', eye: '#38bdf8', suit: '#334155', prop: 'thorn_shield', aura: '#fde047', hs: 'bob', bs: 'classic', ho: 'feather', bo: 'pauldrons', bds: 'classic_armor'},
      '守卫城堡的指挥官': { bg: ['#f59e0b', '#1e3a8a'], hair: '#fde047', eye: '#38bdf8', suit: '#1e3a8a', headgear: 'crown', prop: 'greatsword', hs: 'ponytail', bs: 'side_swept', ho: 'feather', bo: 'pauldrons', bds: 'classic_armor'},
      '精灵女王': { bg: ['#22c55e', '#064e3b'], hair: '#bbf7d0', eye: '#fde047', suit: '#047857', headgear: 'crown', prop: 'shepherd_staff', aura: '#4ade80', hs: 'crown_braid', bs: 'parted', ho: 'rose', bo: 'cape', bds: 'ballgown'},
      '辅佐帝王的谋士': { bg: ['#ca8a04', '#1e1b4b'], hair: '#fde68a', eye: '#38bdf8', suit: '#312e81', prop: 'fan_strategist', hs: 'bun', bs: 'hime_cut', ho: 'gold_pins', bo: 'cape', bds: 'slit_qipao'},
      '屠龙勇士': { bg: ['#ef4444', '#1e293b'], hair: '#fed7aa', eye: '#fde047', suit: '#7f1d1d', prop: 'dragon_lance', wing: 'dragon_wings', hs: 'high_bun', bs: 'side_swept', ho: 'gold_pins', bo: 'pauldrons', bds: 'classic_armor'},
      '探寻巨龙者': { bg: ['#d97706', '#1e293b'], hair: '#fde68a', eye: '#4ade80', suit: '#78350f', prop: 'dragon_lance', hs: 'braids', bs: 'classic', ho: 'feather', bo: 'fur_collar', bds: 'cape_cloak'},
      '疯狂科学家': { bg: ['#22c55e', '#1e1b4b'], hair: '#a7f3d0', eye: '#fde047', suit: '#f8fafc', headgear: 'visor', prop: 'flask', aura: '#4ade80', hs: 'bob', bs: 'parted', ho: 'cyber_clips', bo: 'cyber_core', bds: 'cyber_suit'},
      '痛恨快攻卡组的玩家': { bg: ['#38bdf8', '#090d16'], hair: '#93c5fd', eye: '#ef4444', suit: '#1e293b', headgear: 'visor', prop: 'thorn_shield', aura: '#38bdf8', hs: 'short_spiky', bs: 'classic', ho: 'cyber_clips', bo: 'cyber_core', bds: 'cyber_suit'},
      '苦难预言者': { bg: ['#64748b', '#090d16'], hair: '#cbd5e1', eye: '#c084fc', suit: '#1e1b4b', headgear: 'nun_veil', prop: 'grimoire', hs: 'long', bs: 'parted', ho: 'none', bo: 'cross_necklace', bds: 'slim_robe'},
      '灾难预言者': { bg: ['#ef4444', '#3b0764'], hair: '#fca5a5', eye: '#fde047', suit: '#450a0a', headgear: 'nun_veil', prop: 'grimoire', aura: '#ef4444', hs: 'wavy', bs: 'hime_cut', ho: 'gold_pins', bo: 'cape', bds: 'slim_robe'},
      '寻觅的亡灵': { bg: ['#6366f1', '#090d16'], hair: '#c7d2fe', eye: '#38bdf8', suit: '#1e1b4b', prop: 'necromancer_staff', hs: 'braids', bs: 'classic', ho: 'skull_clip', bo: 'bone_necklace', bds: 'slim_robe'},
      '祷告的圣女': { bg: ['#fde047', '#1e3a8a'], hair: '#fef9c3', eye: '#38bdf8', suit: '#eff6ff', wing: 'angel_feather', headgear: 'halo', aura: '#fde047', hs: 'wavy', bs: 'parted', ho: 'feather', bo: 'cross_necklace', bds: 'slim_robe'},
      '堕天使': { bg: ['#a855f7', '#090d16'], hair: '#e9d5ff', eye: '#f43f5e', suit: '#3b0764', wing: 'demon_wings', headgear: 'halo', hs: 'hime', bs: 'parted', ho: 'feather', bo: 'choker', bds: 'off_shoulder'},
      '慈爱的龙母': { bg: ['#f472b6', '#4c0519'], hair: '#fbcfe8', eye: '#fde047', suit: '#831843', wing: 'dragon_wings', headgear: 'crown', hs: 'wavy', bs: 'parted', ho: 'gold_pins', bo: 'cape', bds: 'ballgown'},
      '龙骑士': { bg: ['#0284c7', '#172554'], hair: '#60a5fa', eye: '#fde047', suit: '#1e3a8a', wing: 'dragon_wings', prop: 'dragon_lance', hs: 'half_up', bs: 'side_swept', ho: 'feather', bo: 'pauldrons', bds: 'classic_armor'},
      '静听倾诉的修女': { bg: ['#38bdf8', '#0f172a'], hair: '#e2e8f0', eye: '#38bdf8', suit: '#1e293b', headgear: 'nun_veil', aura: '#bae6fd', hs: 'braids', bs: 'classic', ho: 'none', bo: 'cross_necklace', bds: 'slim_robe'},
      '小小唤灵术士': { bg: ['#7c3aed', '#090d16'], hair: '#e9d5ff', eye: '#c084fc', suit: '#3b0764', headgear: 'witch_hat', prop: 'necromancer_staff', aura: '#a855f7', hs: 'twintails', bs: 'classic', ho: 'skull_clip', bo: 'ribbons_bow', bds: 'maid_idol', ahoge: 'double', blush: true},
      '胆小鬼': { bg: ['#334155', '#090d16'], hair: '#cbd5e1', eye: '#fde047', suit: '#1e293b', headgear: 'hood', aura: '#94a3b8', hs: 'bob', bs: 'classic', ho: 'ribbon', bo: 'fur_collar', bds: 'cape_cloak', ahoge: 'curl', blush: true},
      '亡灵骑士': { bg: ['#1e1b4b', '#050811'], hair: '#94a3b8', eye: '#38bdf8', suit: '#0f172a', headgear: 'horns', prop: 'greatsword', aura: '#6366f1', hs: 'wolf_cut', bs: 'side_swept', fs: 'classic', ho: 'none', bo: 'pauldrons', bds: 'classic_armor'},
      '拯救世界的大天使': { bg: ['#fef08a', '#1e3a8a'], hair: '#fef9c3', eye: '#38bdf8', suit: '#f8fafc', wing: 'angel_feather', headgear: 'halo', prop: 'greatsword', aura: '#fde047', hs: 'long', bs: 'parted', ho: 'feather', bo: 'pauldrons', bds: 'classic_armor'},
      '毁灭世界的魔王': { bg: ['#dc2626', '#050811'], hair: '#fecaca', eye: '#ef4444', suit: '#450a0a', wing: 'demon_wings', headgear: 'crown', prop: 'greatsword', aura: '#ef4444', hs: 'wavy', bs: 'hime_cut', ho: 'gold_pins', bo: 'cape', bds: 'ballgown'},
      '鬼火将军': { bg: ['#0ea5e9', '#090d16'], hair: '#bae6fd', eye: '#38bdf8', suit: '#1e1b4b', headgear: 'horns', prop: 'greatsword', aura: '#38bdf8', hs: 'wolf_cut', bs: 'side_swept', ho: 'gold_pins', bo: 'pauldrons', bds: 'classic_armor'},
      '燃血术士': { bg: ['#be123c', '#090d16'], hair: '#fda4af', eye: '#f43f5e', suit: '#4c0519', prop: 'necromancer_staff', aura: '#fb7185', hs: 'hime', bs: 'hime_cut', ho: 'rose', bo: 'choker', bds: 'slim_robe'},
      '反击的蔷薇剑士': { bg: ['#e11d48', '#1e1b4b'], hair: '#fecdd3', eye: '#fb7185', suit: '#881337', prop: 'katana_dual', aura: '#f43f5e', hs: 'princess_cut', bs: 'side_swept', ho: 'rose', bo: 'cape', bds: 'cape_cloak'},
      '傲慢的蔷薇大小姐': { bg: ['#db2777', '#2e1065'], hair: '#f472b6', eye: '#fde047', suit: '#831843', headgear: 'crown', prop: 'fan_strategist', aura: '#f472b6', hs: 'twin_drills', bs: 'hime_cut', ho: 'rose', bo: 'rose_brooch', bds: 'ballgown', ahoge: 'heart'},
      '蝙蝠女王': { bg: ['#7e22ce', '#090d16'], hair: '#e9d5ff', eye: '#f43f5e', suit: '#3b0764', wing: 'demon_wings', headgear: 'crown', aura: '#c084fc', hs: 'wavy', bs: 'parted', ho: 'skull_clip', bo: 'choker', bds: 'off_shoulder'},
      '利刃蔷薇剑士': { bg: ['#f43f5e', '#0f172a'], hair: '#fecaca', eye: '#fde047', suit: '#9f1239', prop: 'greatsword', aura: '#fb7185', hs: 'bob', bs: 'side_swept', ho: 'rose', bo: 'pauldrons', bds: 'classic_armor'},
      '蔷薇园丁': { bg: ['#10b981', '#4c0519'], hair: '#bbf7d0', eye: '#f43f5e', suit: '#064e3b', prop: 'shepherd_staff', aura: '#34d399', hs: 'braids', bs: 'classic', ho: 'rose', bo: 'ribbons_bow', bds: 'maid_idol'},
      '被束缚的蔷薇公主': { bg: ['#9f1239', '#090d16'], hair: '#fbcfe8', eye: '#ef4444', suit: '#4c0519', headgear: 'crown', wing: 'demon_wings', aura: '#f43f5e', hs: 'princess_cut', bs: 'hime_cut', ho: 'rose', bo: 'rose_brooch', bds: 'ballgown'},
      '蔷薇近卫': { bg: ['#e11d48', '#0f172a'], hair: '#e2e8f0', eye: '#fb7185', suit: '#881337', prop: 'thorn_shield', aura: '#fda4af', hs: 'short_spiky', bs: 'classic', ho: 'rose', bo: 'pauldrons', bds: 'classic_armor'},
      '玩闹的恶魔': { bg: ['#9333ea', '#090d16'], hair: '#f0abfc', eye: '#fde047', suit: '#4c1d95', wing: 'demon_wings', headgear: 'horns', aura: '#e879f9', hs: 'fluffy_curl', bs: 'classic', ho: 'star_clips', bo: 'ribbons_bow', bds: 'maid_idol', ahoge: 'lightning', blush: true},
      '慷慨的天使': { bg: ['#f59e0b', '#1e3a8a'], hair: '#fef08a', eye: '#38bdf8', suit: '#eff6ff', wing: 'angel_feather', headgear: 'halo', hs: 'wavy', bs: 'parted', fs: 'soft_oval', es: 'droopy', bds: 'slim_robe', ho: 'feather', bo: 'angel_stole', aura: '#fde047' },
      '胜利天使': { bg: ['#fef08a', '#d97706'], hair: '#fffbeb', eye: '#fbbf24', suit: '#f8fafc', wing: 'angel_feather', headgear: 'halo', prop: 'greatsword', hs: 'ponytail', bs: 'side_swept', fs: 'classic', es: 'starry', bds: 'classic_armor', ho: 'feather', bo: 'pauldrons', aura: '#ffffff' },
      '沐浴龙血的天使': { bg: ['#dc2626', '#1e1b4b'], hair: '#fecdd3', eye: '#ef4444', suit: '#7f1d1d', wing: 'angel_feather', headgear: 'halo', prop: 'dragon_lance', hs: 'hime', bs: 'hime_cut', fs: 'slender', es: 'sharp', bds: 'cape_cloak', ho: 'rose', bo: 'gem_sash', aura: '#f43f5e' },
      '守护祷告者': { bg: ['#2563eb', '#1e1b4b'], hair: '#bfdbfe', eye: '#fde047', suit: '#1e3a8a', prop: 'shepherd_staff', hs: 'braids', bs: 'classic', fs: 'soft_oval', es: 'droopy', bds: 'slim_robe', ho: 'crescent_pin', bo: 'cross_necklace', aura: '#93c5fd' },
      '宁静的治愈师': { bg: ['#10b981', '#0f172a'], hair: '#a7f3d0', eye: '#34d399', suit: '#ecfdf5', prop: 'shepherd_staff', hs: 'side_braid', bs: 'parted', fs: 'soft_oval', es: 'droopy', bds: 'slim_robe', ho: 'flower_wreath', bo: 'angel_stole', aura: '#34d399' },
      '开辟的传教士': { bg: ['#f59e0b', '#0f172a'], hair: '#fde68a', eye: '#38bdf8', suit: '#fef3c7', prop: 'grimoire', hs: 'half_up', bs: 'parted', fs: 'classic', es: 'classic', bds: 'slim_robe', ho: 'gold_pins', bo: 'cross_necklace', aura: '#fbbf24' },
      '祝福的圣骑士': { bg: ['#38bdf8', '#1e3a8a'], hair: '#fef08a', eye: '#38bdf8', suit: '#e2e8f0', prop: 'greatsword', hs: 'wavy', bs: 'side_swept', fs: 'classic', es: 'classic', bds: 'classic_armor', ho: 'feather', bo: 'pauldrons', aura: '#fde047' },
      '圣骑士士官长': { bg: ['#eab308', '#1e293b'], hair: '#f8fafc', eye: '#fbbf24', suit: '#1e3a8a', headgear: 'crown', prop: 'greatsword', hs: 'high_bun', bs: 'side_swept', fs: 'classic', es: 'sharp', bds: 'classic_armor', ho: 'gold_pins', bo: 'cape', aura: '#facc15' },
      '圣骑兵': { bg: ['#1d4ed8', '#0f172a'], hair: '#cbd5e1', eye: '#38bdf8', suit: '#334155', prop: 'dragon_lance', hs: 'pixie', bs: 'classic', fs: 'classic', es: 'classic', bds: 'classic_armor', ho: 'ribbon', bo: 'pauldrons' },
      '神圣翼甲战士': { bg: ['#0ea5e9', '#1e1b4b'], hair: '#e0f2fe', eye: '#fde047', suit: '#f8fafc', wing: 'angel_feather', prop: 'greatsword', hs: 'twintails', bs: 'side_swept', fs: 'classic', es: 'starry', bds: 'classic_armor', ho: 'feather', bo: 'gem_sash', aura: '#38bdf8' },
      '阴险的猎手': { bg: ['#4c1d95', '#090d16'], hair: '#c084fc', eye: '#f43f5e', suit: '#1e1b4b', prop: 'katana_dual', hs: 'side_ponytail', bs: 'one_eye_cover', fs: 'soft_oval', es: 'sharp', bds: 'cape_cloak', ho: 'crescent_pin', bo: 'choker', aura: '#a855f7' },
      '神圣宫廷祷告师': { bg: ['#db2777', '#1e1b4b'], hair: '#fbcfe8', eye: '#fde047', suit: '#fef9c3', headgear: 'crown', prop: 'shepherd_staff', hs: 'low_twintails', bs: 'hime_cut', fs: 'heart', es: 'droopy', bds: 'ballgown', ho: 'flower_wreath', bo: 'angel_stole', aura: '#f472b6', blush: true},
      '邪恶骨巫': { bg: ['#6b21a8', '#04020a'], hair: '#d8b4fe', eye: '#4ade80', suit: '#3b0764', headgear: 'witch_hat', prop: 'necromancer_staff', hs: 'wavy', bs: 'parted', fs: 'slender', es: 'sharp', bds: 'slim_robe', ho: 'skull_clip', bo: 'bone_necklace', aura: '#a855f7' },
      '圣骑将军': { bg: ['#ca8a04', '#1e3a8a'], hair: '#fde047', eye: '#ef4444', suit: '#f8fafc', headgear: 'crown', prop: 'greatsword', hs: 'half_up', bs: 'side_swept', fs: 'classic', es: 'sharp', bds: 'classic_armor', ho: 'gold_pins', bo: 'cape', aura: '#fde047' },
      '蓄能炮手': { bg: ['#0284c7', '#090d16'], hair: '#67e8f9', eye: '#fde047', suit: '#1e293b', headgear: 'visor', prop: 'bomber', hs: 'bun', bs: 'classic', fs: 'chibi', es: 'starry', bds: 'cyber_suit', ho: 'cyber_clips', bo: 'cyber_core', aura: '#22d3ee' },
      '宫殿守卫': { bg: ['#475569', '#1e293b'], hair: '#e2e8f0', eye: '#38bdf8', suit: '#334155', prop: 'thorn_shield', hs: 'flipped_bob', bs: 'classic', fs: 'classic', es: 'classic', bds: 'classic_armor', ho: 'ribbon', bo: 'pauldrons' },
      '狂暴女拳师': { bg: ['#dc2626', '#1e1b4b'], hair: '#fb7185', eye: '#fde047', suit: '#7f1d1d', hs: 'wolf_cut', bs: 'side_swept', fs: 'soft_oval', es: 'sharp', bds: 'slit_qipao', ho: 'bell_ribbons', bo: 'gem_sash', aura: '#f97316' , ahoge: 'lightning'},
      '疼痛疗愈者': { bg: ['#10b981', '#4c0519'], hair: '#fda4af', eye: '#34d399', suit: '#881337', prop: 'shepherd_staff', hs: 'side_braid', bs: 'parted', fs: 'soft_oval', es: 'droopy', bds: 'maid_idol', ho: 'rose', bo: 'cross_necklace', aura: '#34d399', blush: true},
      '折光镜像师': { bg: ['#06b6d4', '#3b0764'], hair: '#a5f3fc', eye: '#f472b6', suit: '#312e81', prop: 'grimoire', hs: 'drill_single', bs: 'hime_cut', fs: 'heart', es: 'classic', bds: 'ballgown', ho: 'star_clips', bo: 'choker', aura: '#22d3ee' },
      '伺机待发的猎鹰骑士': { bg: ['#0369a1', '#0f172a'], hair: '#bae6fd', eye: '#fde047', suit: '#1e3a8a', prop: 'dragon_lance', hs: 'flipped_bob', bs: 'side_swept', fs: 'classic', es: 'sharp', bds: 'classic_armor', ho: 'feather', bo: 'pauldrons', aura: '#38bdf8' },
      '傲慢的将军': { bg: ['#991b1b', '#090d16'], hair: '#fde047', eye: '#ef4444', suit: '#450a0a', headgear: 'crown', prop: 'greatsword', hs: 'high_bun', bs: 'hime_cut', fs: 'heart', es: 'sharp', bds: 'classic_armor', ho: 'gold_pins', bo: 'cape', aura: '#ef4444' },
      '团结的守卫': { bg: ['#2563eb', '#0f172a'], hair: '#93c5fd', eye: '#fde047', suit: '#1e3a8a', prop: 'thorn_shield', hs: 'braids', bs: 'classic', fs: 'round', es: 'classic', bds: 'classic_armor', ho: 'ribbon', bo: 'pauldrons' },
      '孤傲的浪人': { bg: ['#334155', '#090d16'], hair: '#cbd5e1', eye: '#38bdf8', suit: '#0f172a', prop: 'katana_dual', hs: 'side_ponytail', bs: 'one_eye_cover', fs: 'soft_oval', es: 'sharp', bds: 'slit_qipao', ho: 'none', bo: 'cape' },
      '违规操作的炸弹兵': { bg: ['#ea580c', '#1e1b4b'], hair: '#fdba74', eye: '#ef4444', suit: '#431407', prop: 'bomber', hs: 'bun', bs: 'classic', fs: 'chibi', es: 'starry', bds: 'cyber_suit', ho: 'star_clips', bo: 'ribbons_bow', aura: '#f97316' , ahoge: 'lightning'},
      '归来的剑圣': { bg: ['#f59e0b', '#0f172a'], hair: '#f8fafc', eye: '#fde047', suit: '#1e293b', prop: 'katana_dual', hs: 'hime', bs: 'parted', fs: 'classic', es: 'sharp', bds: 'slit_qipao', ho: 'gold_pins', bo: 'gem_sash', aura: '#fde047' },
      '猛虎训练师': { bg: ['#d97706', '#1e293b'], hair: '#fde047', eye: '#4ade80', suit: '#78350f', prop: 'shepherd_staff', hs: 'side_ponytail', bs: 'classic', fs: 'round', es: 'starry', bds: 'cape_cloak', ho: 'bell_ribbons', bo: 'fur_collar', aura: '#fbbf24', blush: true},
      '士兵': { bg: ['#334155', '#0f172a'], hair: '#94a3b8', eye: '#38bdf8', suit: '#475569', prop: 'greatsword', hs: 'bob', bs: 'classic', fs: 'round', es: 'classic', bds: 'classic_armor', ho: 'ribbon', bo: 'pauldrons' },
      '圣枪重凯': { bg: ['#1e1b4b', '#0f172a'], hair: '#fef08a', eye: '#38bdf8', suit: '#ca8a04', prop: 'dragon_lance', hs: 'half_up', bs: 'parted', fs: 'classic', es: 'classic', bds: 'classic_armor', ho: 'feather', bo: 'pauldrons', aura: '#facc15' },
      '杂耍戏命师': { bg: ['#4c1d95', '#090d16'], hair: '#e879f9', eye: '#fde047', suit: '#1e1b4b', hs: 'bun', bs: 'classic', fs: 'soft_oval', es: 'starry', bds: 'maid_idol', ho: 'skull_clip', bo: 'ribbons_bow', aura: '#c084fc' },
      '律法具现者': { bg: ['#1e3a8a', '#020617'], hair: '#e2e8f0', eye: '#facc15', suit: '#0f172a', headgear: 'halo', prop: 'grimoire', hs: 'hime', bs: 'hime_cut', fs: 'soft_oval', es: 'classic', bds: 'slim_robe', ho: 'gold_pins', bo: 'angel_stole', aura: '#fde047' },
      '迅捷的侠盗': { bg: ['#1e293b', '#090d16'], hair: '#38bdf8', eye: '#fde047', suit: '#0f172a', prop: 'katana_dual', hs: 'side_ponytail', bs: 'side_swept', fs: 'heart', es: 'starry', bds: 'cape_cloak', ho: 'crescent_pin', bo: 'choker' },
      '引导胜利的指挥官': { bg: ['#1e3a8a', '#0f172a'], hair: '#fde047', eye: '#38bdf8', suit: '#1d4ed8', headgear: 'crown', prop: 'greatsword', hs: 'high_bun', bs: 'side_swept', fs: 'classic', es: 'starry', bds: 'classic_armor', ho: 'feather', bo: 'gem_sash', aura: '#facc15' },
      '驯龙师': { bg: ['#9a3412', '#1e293b'], hair: '#fb923c', eye: '#4ade80', suit: '#7c2d12', prop: 'shepherd_staff', hs: 'braids', bs: 'classic', fs: 'round', es: 'classic', bds: 'cape_cloak', ho: 'feather', bo: 'fur_collar' },
      '无畏的飞龙骑手': { bg: ['#0284c7', '#0f172a'], hair: '#7dd3fc', eye: '#fde047', suit: '#1e3a8a', wing: 'dragon_wings', prop: 'dragon_lance', hs: 'side_braid', bs: 'side_swept', fs: 'classic', es: 'starry', bds: 'classic_armor', ho: 'feather', bo: 'pauldrons' },
      '流淌龙血的侠客': { bg: ['#991b1b', '#090d16'], hair: '#fca5a5', eye: '#fde047', suit: '#450a0a', prop: 'katana_dual', hs: 'side_ponytail', bs: 'side_swept', fs: 'soft_oval', es: 'sharp', bds: 'slit_qipao', ho: 'gold_pins', bo: 'gem_sash', aura: '#ef4444' },
      '龙鳞锻造师': { bg: ['#b45309', '#1e293b'], hair: '#fed7aa', eye: '#f97316', suit: '#431407', prop: 'hammer', hs: 'short_spiky', bs: 'classic', fs: 'round', es: 'classic', bds: 'classic_armor', ho: 'ribbon', bo: 'fur_collar' },
      '翱翔天际的龙骑手': { bg: ['#0ea5e9', '#1e1b4b'], hair: '#bae6fd', eye: '#fde047', suit: '#0c4a6e', wing: 'dragon_wings', prop: 'dragon_lance', hs: 'twintails', bs: 'side_swept', fs: 'classic', es: 'starry', bds: 'cyber_suit', ho: 'feather', bo: 'gem_sash' },
      '满腔热血的霸者': { bg: ['#dc2626', '#1e293b'], hair: '#f97316', eye: '#fde047', suit: '#7f1d1d', prop: 'greatsword', hs: 'short_spiky', bs: 'parted', fs: 'classic', es: 'sharp', bds: 'classic_armor', ho: 'none', bo: 'cape', aura: '#f97316' },
      '考古学家': { bg: ['#92400e', '#1e293b'], hair: '#fde68a', eye: '#38bdf8', suit: '#78350f', prop: 'grimoire', hs: 'bob', bs: 'parted', fs: 'soft_oval', es: 'classic', bds: 'cape_cloak', ho: 'butterfly', bo: 'gem_sash' },
      '龙蛋收藏家': { bg: ['#7c2d12', '#1e1b4b'], hair: '#fbcfe8', eye: '#fde047', suit: '#831843', prop: 'flask', hs: 'low_twintails', bs: 'hime_cut', fs: 'heart', es: 'starry', bds: 'ballgown', ho: 'flower_wreath', bo: 'rose_brooch', blush: true},
      '坚定守护者': { bg: ['#1e3a8a', '#0f172a'], hair: '#cbd5e1', eye: '#38bdf8', suit: '#334155', prop: 'thorn_shield', hs: 'half_up', bs: 'classic', fs: 'classic', es: 'classic', bds: 'classic_armor', ho: 'ribbon', bo: 'pauldrons' },
      '掘墓者': { bg: ['#3b0764', '#090d16'], hair: '#a78bfa', eye: '#34d399', suit: '#1e1b4b', prop: 'necromancer_staff', hs: 'side_braid', bs: 'parted', fs: 'soft_oval', es: 'droopy', bds: 'cape_cloak', ho: 'skull_clip', bo: 'bone_necklace' },
      '使命必达小子': { bg: ['#0284c7', '#0f172a'], hair: '#fde047', eye: '#38bdf8', suit: '#1e3a8a', prop: 'express_flag', hs: 'short_spiky', bs: 'classic', fs: 'chibi', es: 'starry', bds: 'cape_cloak', ho: 'star_clips', bo: 'ribbons_bow' , ahoge: 'sprout'},
      '爆炸羊狂热者': { bg: ['#7f1d1d', '#090d16'], hair: '#fb923c', eye: '#fde047', suit: '#1e293b', headgear: 'visor', prop: 'bomber', hs: 'bun', bs: 'classic', fs: 'chibi', es: 'starry', bds: 'cyber_suit', ho: 'cyber_clips', bo: 'cyber_core' },
      '赛博牧羊人': { bg: ['#065f46', '#0f172a'], hair: '#34d399', eye: '#22d3ee', suit: '#1e293b', headgear: 'visor', prop: 'shepherd_staff', hs: 'half_up', bs: 'side_swept', fs: 'classic', es: 'classic', bds: 'cyber_suit', ho: 'cyber_clips', bo: 'cyber_core' },
      '摇滚骷髅乐团鼓手': { bg: ['#dc2626', '#0f172a'], hair: '#cbd5e1', eye: '#f43f5e', suit: '#1e293b', headgear: 'horns', aura: '#ef4444', hs: 'short_spiky', bs: 'side_swept', ho: 'skull_clip', bo: 'choker', bds: 'cyber_suit'},
      '摇滚骷髅乐团主唱': { bg: ['#f43f5e', '#3b0764'], hair: '#fda4af', eye: '#fde047', suit: '#1e1b4b', wing: 'demon_wings', prop: 'express_flag', hs: 'twintails', bs: 'side_swept', fs: 'heart', es: 'starry', bds: 'maid_idol', ho: 'skull_clip', bo: 'choker', aura: '#f43f5e', blush: true },
      '重盾圣铠': { bg: ['#1e3a8a', '#020617'], hair: '#fef08a', eye: '#38bdf8', suit: '#eab308', headgear: 'crown', prop: 'thorn_shield', hs: 'hime', bs: 'side_swept', fs: 'classic', es: 'sharp', bds: 'classic_armor', ho: 'gold_pins', bo: 'pauldrons', aura: '#facc15' },
      '齿轮学徒': { bg: ['#0284c7', '#0f172a'], hair: '#bae6fd', eye: '#fde047', suit: '#1e293b', headgear: 'visor', prop: 'wrench', hs: 'bun', bs: 'classic', fs: 'chibi', es: 'starry', bds: 'cyber_suit', ho: 'cyber_clips', bo: 'cyber_core', aura: '#38bdf8', blush: true },
      '滑板跃迁手': { bg: ['#06b6d4', '#1e1b4b'], hair: '#67e8f9', eye: '#f472b6', suit: '#0f172a', headgear: 'visor', prop: 'hover_board', hs: 'ponytail', bs: 'side_swept', fs: 'heart', es: 'starry', bds: 'cyber_suit', ho: 'star_clips', bo: 'cyber_core', aura: '#22d3ee', ahoge: 'lightning' },
      '发条侍从': { bg: ['#475569', '#0f172a'], hair: '#fde68a', eye: '#38bdf8', suit: '#1e293b', prop: 'wrench', hs: 'flipped_bob', bs: 'parted', fs: 'soft_oval', es: 'classic', bds: 'maid_idol', ho: 'ribbon', bo: 'cyber_core', aura: '#fbbf24' }
    };

    if (charPresets[name]) {
      const p = charPresets[name];
      fillRadialBg(ctx, p.bg[0], p.bg[1], '#050811');
      drawParticles(ctx, h, p.aura || p.eye, 16, 'sparks');
      const facePool = ['classic', 'gentle_round', 'slender', 'heart'];
      const eyePool = ['classic', 'sharp', 'droopy', 'starry'];
      const bodyPool = ['ballgown', 'slim_robe', 'cape_cloak', 'maid_idol', 'off_shoulder', 'slit_qipao', 'cyber_suit'];
      drawAnimeHeroine(ctx, {
        cx: 140, cy: 96,
        hairCol: p.hair, eyeCol: p.eye, suitCol: p.suit,
        trimCol: p.trim || '#fde047',
        wingType: p.wing || 'none',
        propType: p.prop || 'none',
        headgear: p.headgear || 'none',
        hairStyle: p.hs || 'long',
        bangStyle: p.bs || 'classic',
        faceShape: p.fs || facePool[h % facePool.length],
        eyeStyle: p.es || eyePool[(h >>> 4) % eyePool.length],
        bodyStyle: p.bds || bodyPool[(h >>> 8) % bodyPool.length],
        hairOrnament: p.ho || 'none',
        bodyOrnament: p.bo || 'none',
        auraCol: p.aura || null,
        ahoge: p.ahoge || false,
        blush: Boolean(p.blush)
      });
      if (name === '骸骨和少女') {
        drawSkull(ctx, 206, 98, 0.78, { eyeCol: '#c084fc', horns: true });
      } else if (name === '狂暴女拳师') {
        // 燃爆斗气拳风冲击波
        ctx.save();
        ctx.strokeStyle = 'rgba(251,146,60,0.75)'; ctx.lineWidth = 2.6;
        for (let k = 0; k < 4; k++) {
          const ang = -0.6 + k * 0.4;
          ctx.beginPath(); ctx.arc(54, 128, 16 + k * 7, ang, ang + 0.9); ctx.stroke();
          ctx.beginPath(); ctx.arc(226, 128, 16 + k * 7, Math.PI - ang - 0.9, Math.PI - ang); ctx.stroke();
        }
        ctx.restore();
      } else if (name === '猛虎训练师') {
        // 身旁蹲坐的威风小金虎剪影
        ctx.save();
        ctx.fillStyle = '#f59e0b'; ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.ellipse(212, 162, 18, 22, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(210, 134, 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(200, 124); ctx.lineTo(197, 115); ctx.lineTo(206, 122); ctx.fill();
        ctx.beginPath(); ctx.moveTo(220, 124); ctx.lineTo(223, 115); ctx.lineTo(214, 122); ctx.fill();
        ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.arc(206, 133, 2, 0, Math.PI * 2); ctx.arc(214, 133, 2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      } else if (name === '蝙蝠女王' || name === '吸血鬼贵族' || name === '戏谑的吸血鬼') {
        // 飞舞的小蝙蝠剪影群
        ctx.save();
        ctx.fillStyle = '#1e1b4b'; ctx.strokeStyle = '#fb7185'; ctx.lineWidth = 1.1;
        [[46, 48], [230, 56], [62, 148]].forEach(([bx, by]) => {
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.quadraticCurveTo(bx - 12, by - 10, bx - 18, by + 2);
          ctx.quadraticCurveTo(bx - 8, by + 2, bx, by + 6);
          ctx.quadraticCurveTo(bx + 8, by + 2, bx + 18, by + 2);
          ctx.quadraticCurveTo(bx + 12, by - 10, bx, by);
          ctx.fill(); ctx.stroke();
        });
        ctx.restore();
      } else if (name === '疯狂科学家' || name === '爆炸羊狂热者') {
        // 漂浮发光实验气泡/电弧
        ctx.save();
        ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 1.6;
        [[48, 66, 9], [228, 82, 11], [216, 152, 7]].forEach(([bx, by, r]) => {
          ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.stroke();
        });
        ctx.restore();
      } else if (name === '哀乐奏响者' || name === '猫耳播报员') {
        // 飘浮音符
        ctx.save();
        ctx.fillStyle = p.aura || '#f472b6'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.3;
        [[48, 72], [226, 62]].forEach(([nx, ny]) => {
          ctx.beginPath(); ctx.ellipse(nx, ny, 5, 3.8, -0.3, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.moveTo(nx + 4, ny); ctx.lineTo(nx + 4, ny - 18); ctx.lineTo(nx + 12, ny - 14); ctx.stroke();
        });
        ctx.restore();
      } else if (name === '浴血的刀客' || name === '归来的剑圣' || name === '流淌龙血的侠客') {
        // 凌厉剑气斩击弧光
        ctx.save();
        ctx.strokeStyle = p.aura || '#ef4444'; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.arc(140, 110, 96, -0.45, 0.35); ctx.stroke();
        ctx.beginPath(); ctx.arc(140, 110, 96, Math.PI - 0.35, Math.PI + 0.45); ctx.stroke();
        ctx.restore();
      } else if (name === '玩耍的唤灵术士' || name === '小小唤灵术士' || name === '招魂的术士' || name === '灵魂雕塑家') {
        // 漂浮可爱小幽灵/鬼火
        ctx.save();
        ctx.fillStyle = 'rgba(192,132,252,0.55)'; ctx.strokeStyle = '#e9d5ff'; ctx.lineWidth = 1.4;
        [[48, 128], [232, 74]].forEach(([gx, gy]) => {
          ctx.beginPath(); ctx.arc(gx, gy, 10, Math.PI, 0);
          ctx.lineTo(gx + 10, gy + 12); ctx.lineTo(gx + 3, gy + 8); ctx.lineTo(gx - 3, gy + 12); ctx.lineTo(gx - 10, gy + 8);
          ctx.closePath(); ctx.fill(); ctx.stroke();
        });
        ctx.restore();
      } else if (name === '精灵女王' || name === '蔷薇园丁' || name === '傲慢的蔷薇大小姐' || name === '被束缚的蔷薇公主') {
        // 飘落发光花瓣
        ctx.save();
        ctx.fillStyle = name === '精灵女王' ? '#86efac' : '#fda4af';
        [[46, 62, 0.5], [228, 76, -0.4], [58, 144, 0.8], [218, 148, -0.7]].forEach(([px, py, rot]) => {
          ctx.beginPath(); ctx.ellipse(px, py, 6, 3, rot, 0, Math.PI * 2); ctx.fill();
        });
        ctx.restore();
      }
      return true;
    }



    // ================= 1. 重绘原本过于敷衍的龙族/恐龙/野兽/亡灵/法术/护符 =================
    if (name === '肉山魔') {
      fillRadialBg(ctx, '#991b1b', '#270909', '#050811');
      drawParticles(ctx, h, '#f43f5e', 24, 'sparks');
      // 巨型缝合肉山轮廓
      const bodyG = ctx.createRadialGradient(140, 128, 14, 140, 132, 92);
      bodyG.addColorStop(0, '#dc2626'); bodyG.addColorStop(0.55, '#7f1d1d'); bodyG.addColorStop(1, '#1c0a0a');
      ctx.fillStyle = bodyG; ctx.strokeStyle = '#fca5a5'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(46, 218); ctx.quadraticCurveTo(38, 120, 86, 86);
      ctx.quadraticCurveTo(140, 56, 194, 86);
      ctx.quadraticCurveTo(242, 120, 234, 218);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // 缝合线与嵌入白骨
      ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(96, 108); ctx.lineTo(184, 154); ctx.stroke();
      for (let i = 0; i < 5; i++) {
        const sx = 104 + i * 18, sy = 112 + i * 9;
        ctx.beginPath(); ctx.moveTo(sx - 4, sy + 7); ctx.lineTo(sx + 4, sy - 7); ctx.stroke();
      }
      drawSkull(ctx, 140, 74, 0.88, { eyeCol: '#ef4444', horns: true, boneCol: '#fecaca', shadowCol: '#7f1d1d' });
      drawSkull(ctx, 84, 136, 0.54, { eyeCol: '#fde047', boneCol: '#e2e8f0' });
      drawSkull(ctx, 196, 138, 0.54, { eyeCol: '#fde047', boneCol: '#e2e8f0' });
      return true;
    }

    if (name === '巨型秃鹫') {
      fillSkyBg(ctx, '#1e1b4b', '#4c1d95', '#090d16');
      drawMoon(ctx, 214, 48, 28, '#fde047');
      drawParticles(ctx, h, '#c084fc', 14, 'slashes');
      drawWingPair(ctx, 140, 96, 122, '#3b0764', '#a855f7', 'bat');
      // 秃鹫躯干与利爪
      ctx.fillStyle = '#1e1b4b'; ctx.strokeStyle = '#c084fc'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(140, 126, 26, 42, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      // 颈部羽毛领圈
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath(); ctx.ellipse(140, 92, 22, 10, 0, 0, Math.PI * 2); ctx.fill();
      // 秃鹫头部与钩喙
      ctx.fillStyle = '#fda4af';
      ctx.beginPath(); ctx.arc(140, 72, 15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fbbf24'; ctx.strokeStyle = '#78350f'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(148, 68); ctx.quadraticCurveTo(176, 68, 172, 86); ctx.lineTo(152, 78); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(146, 69, 3, 0, Math.PI * 2); ctx.fill();
      return true;
    }

    if (name === '骨龙') {
      fillRadialBg(ctx, '#38bdf8', '#1e1b4b', '#050811');
      drawMagicCircle(ctx, 140, 110, 86, '#38bdf8', 0.28);
      drawParticles(ctx, h, '#7dd3fc', 20, 'wisps');
      drawWingPair(ctx, 140, 98, 124, '#e2e8f0', '#38bdf8', 'bone');
      drawDragonHead(ctx, 140, 96, 1.05, { scaleCol: '#e2e8f0', bellyCol: '#64748b', hornCol: '#cbd5e1', eyeCol: '#38bdf8', boneMode: true });
      return true;
    }

    if (name === '远古巨龙') {
      fillRadialBg(ctx, '#f59e0b', '#451a03', '#090d16');
      drawParticles(ctx, h, '#fbbf24', 22, 'sparks');
      drawWingPair(ctx, 140, 105, 130, '#7c2d12', '#fde047', 'dragon');
      drawDragonHead(ctx, 140, 96, 1.18, { scaleCol: '#b45309', bellyCol: '#f59e0b', hornCol: '#fde047', eyeCol: '#ef4444', breathCol: '#f97316' });
      return true;
    }

    if (name === '喷火龙') {
      fillRadialBg(ctx, '#ef4444', '#450a0a', '#090d16');
      drawParticles(ctx, h, '#fde047', 24, 'sparks');
      drawWingPair(ctx, 140, 96, 122, '#991b1b', '#fbbf24', 'dragon');
      drawDragonHead(ctx, 140, 86, 1.05, { scaleCol: '#dc2626', bellyCol: '#fde047', hornCol: '#fbbf24', eyeCol: '#fde047', breathCol: '#f97316' });
      return true;
    }

    if (name === '飞龙') {
      fillSkyBg(ctx, '#0284c7', '#0c4a6e', '#090d16');
      drawParticles(ctx, h, '#7dd3fc', 18, 'slashes');
      drawWingPair(ctx, 140, 96, 126, '#0369a1', '#7dd3fc', 'dragon');
      drawDragonHead(ctx, 140, 96, 0.96, { scaleCol: '#0284c7', bellyCol: '#bae6fd', hornCol: '#38bdf8', eyeCol: '#fde047', breathCol: '#38bdf8' });
      return true;
    }

    if (name === '终焉之龙') {
      fillRadialBg(ctx, '#a855f7', '#1e1b4b', '#020617');
      drawMagicCircle(ctx, 140, 110, 94, '#fde047', 0.52);
      drawParticles(ctx, h, '#f43f5e', 24, 'sparks');
      drawWingPair(ctx, 140, 102, 132, '#3b0764', '#e879f9', 'dragon');
      drawDragonHead(ctx, 140, 88, 1.15, { scaleCol: '#4c1d95', bellyCol: '#c084fc', hornCol: '#fde047', eyeCol: '#f43f5e', breathCol: '#e879f9' });
      return true;
    }

    if (name === '恐龙妈妈') {
      fillRadialBg(ctx, '#fb923c', '#431407', '#090d16');
      drawParticles(ctx, h, '#fde047', 14, 'sparks');
      drawDragonHead(ctx, 140, 80, 0.92, { scaleCol: '#ea580c', bellyCol: '#fed7aa', hornCol: '#fbbf24', eyeCol: '#fde047' });
      [76, 140, 204].forEach((ex, idx) => {
        ctx.fillStyle = idx === 1 ? '#fde047' : '#fb923c';
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(ex, 174, 20, 24, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#090d16';
        ctx.beginPath(); ctx.arc(ex - 6, 168, 3, 0, Math.PI * 2); ctx.arc(ex + 6, 168, 3, 0, Math.PI * 2); ctx.fill();
      });
      return true;
    }

    if (name === '窃蛋龙') {
      fillSkyBg(ctx, '#1a2e05', '#365314', '#090d16');
      drawParticles(ctx, h, '#bef264', 14, 'slashes');
      drawDragonHead(ctx, 108, 92, 0.78, { scaleCol: '#65a30d', bellyCol: '#bef264', hornCol: '#a3e635', eyeCol: '#fde047' });
      // 怀抱的金蛋
      ctx.fillStyle = '#fef08a'; ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(180, 134, 28, 38, 0.25, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fb923c';
      ctx.beginPath(); ctx.arc(172, 126, 7, 0, Math.PI * 2); ctx.arc(188, 142, 9, 0, Math.PI * 2); ctx.fill();
      return true;
    }

    if (name === '骷髅墓碑') {
      fillSkyBg(ctx, '#1e1b4b', '#312e81', '#090d16');
      drawMoon(ctx, 210, 48, 24, '#e9d5ff');
      drawParticles(ctx, h, '#c084fc', 18, 'wisps');
      ctx.fillStyle = '#334155'; ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(140, 88, 48, Math.PI, 0, false);
      ctx.lineTo(188, 198); ctx.lineTo(92, 198); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#c084fc'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(140, 56); ctx.lineTo(140, 114); ctx.moveTo(116, 78); ctx.lineTo(164, 78); ctx.stroke();
      drawSkull(ctx, 140, 148, 0.65, { eyeCol: '#c084fc', flame: true });
      return true;
    }

    if (name === '沉睡的恐龙化石' || name === '待研究的骨架') {
      fillRadialBg(ctx, '#d97706', '#292524', '#0c0a09');
      drawParticles(ctx, h, '#fde68a', 14, 'sparks');
      ctx.fillStyle = '#44403c'; ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(140, 112, 86, 68, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      drawDragonHead(ctx, 118, 96, 0.72, { scaleCol: '#e7e5e4', bellyCol: '#a8a29e', hornCol: '#fef3c7', eyeCol: '#f59e0b', boneMode: true });
      ctx.strokeStyle = '#f5f5f4'; ctx.lineWidth = 5;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(166 + i * 12, 126, 22 - i * 2, -0.8, 1.4);
        ctx.stroke();
      }
      return true;
    }

    if (name === '大灾变') {
      fillSkyBg(ctx, '#450a0a', '#7f1d1d', '#090d16');
      drawParticles(ctx, h, '#fde047', 28, 'sparks');
      [62, 142, 218].forEach((mx, i) => {
        const my = 72 + i * 22;
        ctx.strokeStyle = '#fb923c'; ctx.lineWidth = 10;
        ctx.beginPath(); ctx.moveTo(mx + 42, 0); ctx.lineTo(mx, my); ctx.stroke();
        const mg = ctx.createRadialGradient(mx, my, 4, mx, my, 28);
        mg.addColorStop(0, '#fef08a'); mg.addColorStop(0.5, '#ef4444'); mg.addColorStop(1, '#450a0a');
        ctx.fillStyle = mg;
        ctx.beginPath(); ctx.arc(mx, my, 26, 0, Math.PI * 2); ctx.fill();
      });
      return true;
    }

    if (name === '骸骨犬') {
      fillRadialBg(ctx, '#a855f7', '#1e1b4b', '#090d16');
      drawParticles(ctx, h, '#c084fc', 16, 'wisps');
      drawSkull(ctx, 140, 102, 1.15, { eyeCol: '#f43f5e', horns: true, flame: true });
      return true;
    }

    if (name === '发条龙') {
      fillRadialBg(ctx, '#f59e0b', '#0f172a', '#020617');
      drawMagicCircle(ctx, 140, 110, 82, '#fbbf24', 0.35);
      drawWingPair(ctx, 140, 98, 118, '#64748b', '#fde047', 'mecha');
      drawDragonHead(ctx, 140, 96, 0.96, { scaleCol: '#d97706', bellyCol: '#e2e8f0', hornCol: '#fde047', eyeCol: '#38bdf8' });
      return true;
    }

    if (name === '磁力拼装机械') {
      fillRadialBg(ctx, '#38bdf8', '#0f172a', '#020617');
      drawParticles(ctx, h, '#38bdf8', 18, 'data');
      drawMagicCircle(ctx, 140, 110, 74, '#38bdf8', 0.45);
      ctx.fillStyle = '#1e293b'; ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 3;
      ctx.fillRect(94, 62, 92, 96); ctx.strokeRect(94, 62, 92, 96);
      ctx.fillStyle = '#ef4444'; ctx.fillRect(72, 86, 20, 48);
      ctx.fillStyle = '#3b82f6'; ctx.fillRect(188, 86, 20, 48);
      ctx.fillStyle = '#fde047';
      ctx.beginPath(); ctx.arc(120, 98, 8, 0, Math.PI * 2); ctx.arc(160, 98, 8, 0, Math.PI * 2); ctx.fill();
      return true;
    }

    // ================= 2. 全部 51 张原本未定制而走通用模板的新卡 =================
    if (name === '怨灵') {
      fillRadialBg(ctx, '#a855f7', '#1e1b4b', '#050811');
      drawParticles(ctx, h, '#e879f9', 22, 'wisps');
      const gg = ctx.createRadialGradient(140, 102, 8, 140, 112, 68);
      gg.addColorStop(0, '#f5d0fe'); gg.addColorStop(0.5, '#9333ea'); gg.addColorStop(1, 'transparent');
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.moveTo(140, 42);
      ctx.quadraticCurveTo(192, 74, 178, 148);
      ctx.quadraticCurveTo(162, 195, 140, 178);
      ctx.quadraticCurveTo(118, 195, 102, 148);
      ctx.quadraticCurveTo(88, 74, 140, 42);
      ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.beginPath(); ctx.ellipse(124, 96, 7, 4, 0.25, 0, Math.PI * 2); ctx.ellipse(156, 96, 7, 4, -0.25, 0, Math.PI * 2); ctx.fill();
      return true;
    }

    if (name === '蝙蝠') {
      fillSkyBg(ctx, '#3b0764', '#1e1b4b', '#050811');
      drawMoon(ctx, 140, 82, 46, '#fca5a5');
      drawWingPair(ctx, 140, 102, 108, '#1e1b4b', '#f43f5e', 'dragon');
      ctx.fillStyle = '#0f172a'; ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(140, 114, 18, 28, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(133, 98, 3.5, 0, Math.PI * 2); ctx.arc(147, 98, 3.5, 0, Math.PI * 2); ctx.fill();
      return true;
    }

    if (name === '骸骨王') {
      fillRadialBg(ctx, '#a855f7', '#3b0764', '#020617');
      drawMagicCircle(ctx, 140, 105, 88, '#fde047', 0.45);
      drawParticles(ctx, h, '#c084fc', 24, 'wisps');
      drawWingPair(ctx, 140, 108, 122, '#cbd5e1', '#c084fc', 'bone');
      // 王座披风
      ctx.fillStyle = '#4c1d95'; ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(74, 218); ctx.lineTo(96, 118); ctx.lineTo(184, 118); ctx.lineTo(206, 218); ctx.closePath(); ctx.fill(); ctx.stroke();
      drawSkull(ctx, 140, 92, 1.25, { eyeCol: '#fde047', crown: true, flame: true });
      return true;
    }

    if (name === '骷髅将军') {
      fillRadialBg(ctx, '#6366f1', '#1e1b4b', '#050811');
      drawParticles(ctx, h, '#38bdf8', 18, 'slashes');
      ctx.fillStyle = '#1e293b'; ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(74, 218); ctx.lineTo(92, 122); ctx.lineTo(188, 122); ctx.lineTo(206, 218); ctx.closePath(); ctx.fill(); ctx.stroke();
      drawSkull(ctx, 140, 88, 1.15, { eyeCol: '#38bdf8', horns: true });
      // 双刃战戟
      ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(214, 210); ctx.lineTo(202, 34); ctx.stroke();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath(); ctx.moveTo(202, 26); ctx.lineTo(234, 58); ctx.lineTo(198, 72); ctx.closePath(); ctx.fill();
      return true;
    }

    if (name === '持盾的骷髅士兵') {
      fillRadialBg(ctx, '#475569', '#0f172a', '#020617');
      drawSkull(ctx, 112, 92, 0.98, { eyeCol: '#4ade80' });
      ctx.fillStyle = '#1e293b'; ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(148, 76); ctx.lineTo(222, 76); ctx.lineTo(212, 162); ctx.lineTo(185, 198); ctx.lineTo(158, 162); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(185, 96); ctx.lineTo(185, 170); ctx.moveTo(164, 122); ctx.lineTo(206, 122); ctx.stroke();
      return true;
    }

    if (name === '摇滚骷髅乐团主唱') {
      fillRadialBg(ctx, '#f43f5e', '#3b0764', '#090d16');
      drawParticles(ctx, h, '#fde047', 22, 'sparks');
      // 舞台聚光灯束
      ctx.fillStyle = 'rgba(250, 204, 21, 0.14)';
      ctx.beginPath(); ctx.moveTo(40, 0); ctx.lineTo(140, 220); ctx.lineTo(240, 0); ctx.closePath(); ctx.fill();
      drawSkull(ctx, 126, 86, 1.05, { eyeCol: '#f43f5e', mohawk: true });
      // 电吉他
      ctx.save();
      ctx.translate(168, 144); ctx.rotate(-0.45);
      ctx.fillStyle = '#ef4444'; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(-22, -16); ctx.lineTo(24, -24); ctx.lineTo(18, 22); ctx.lineTo(-26, 16); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e2e8f0'; ctx.fillRect(-4, -84, 8, 68);
      ctx.restore();
      return true;
    }

    if (name === '地狱三头犬') {
      fillRadialBg(ctx, '#ef4444', '#450a0a', '#050811');
      drawParticles(ctx, h, '#fb923c', 26, 'sparks');
      drawDragonHead(ctx, 74, 114, 0.68, { scaleCol: '#450a0a', bellyCol: '#ef4444', hornCol: '#fb923c', eyeCol: '#fde047', breathCol: '#f97316' });
      drawDragonHead(ctx, 206, 114, 0.68, { scaleCol: '#450a0a', bellyCol: '#ef4444', hornCol: '#fb923c', eyeCol: '#fde047', breathCol: '#f97316' });
      drawDragonHead(ctx, 140, 88, 0.88, { scaleCol: '#7f1d1d', bellyCol: '#f97316', hornCol: '#fde047', eyeCol: '#fde047', breathCol: '#ef4444' });
      return true;
    }

    if (name === '吞噬万物的恶魔') {
      fillRadialBg(ctx, '#7e22ce', '#1e1b4b', '#020617');
      drawMagicCircle(ctx, 140, 110, 92, '#f43f5e', 0.48);
      drawWingPair(ctx, 140, 102, 126, '#3b0764', '#f43f5e', 'dragon');
      // 虚空巨口与利齿
      ctx.fillStyle = '#020617'; ctx.strokeStyle = '#e879f9'; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.arc(140, 110, 48, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f8fafc';
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(140 + Math.cos(a) * 46, 110 + Math.sin(a) * 46);
        ctx.lineTo(140 + Math.cos(a + 0.14) * 26, 110 + Math.sin(a + 0.14) * 26);
        ctx.lineTo(140 + Math.cos(a + 0.28) * 46, 110 + Math.sin(a + 0.28) * 46);
        ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath(); ctx.arc(118, 76, 7, 0, Math.PI * 2); ctx.arc(162, 76, 7, 0, Math.PI * 2); ctx.fill();
      return true;
    }

    if (name === '南瓜捣蛋鬼') {
      fillSkyBg(ctx, '#3b0764', '#1e1b4b', '#090d16');
      drawMoon(ctx, 214, 48, 24, '#fde047');
      drawParticles(ctx, h, '#fb923c', 18, 'sparks');
      // 南瓜灯本体
      ctx.fillStyle = '#ea580c'; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(140, 124, 58, 46, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#15803d'; ctx.fillRect(134, 64, 12, 18);
      // 邪魅发光笑脸
      ctx.fillStyle = '#fef08a';
      ctx.beginPath(); ctx.moveTo(106, 114); ctx.lineTo(124, 102); ctx.lineTo(126, 120); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(174, 114); ctx.lineTo(156, 102); ctx.lineTo(154, 120); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(140, 134, 28, 0.1, Math.PI - 0.1); ctx.fill();
      return true;
    }

    if (name === '百鬼夜行') {
      fillSkyBg(ctx, '#31102f', '#1e1b4b', '#050811');
      drawMoon(ctx, 140, 56, 36, '#fca5a5');
      drawParticles(ctx, h, '#e879f9', 24, 'wisps');
      [58, 112, 168, 222].forEach((gx, idx) => {
        const gy = 132 + (idx % 2) * 16;
        ctx.fillStyle = idx % 2 === 0 ? 'rgba(192,132,252,0.8)' : 'rgba(56,189,248,0.8)';
        ctx.beginPath(); ctx.arc(gx, gy, 20, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath(); ctx.arc(gx - 6, gy - 3, 3, 0, Math.PI * 2); ctx.arc(gx + 6, gy - 3, 3, 0, Math.PI * 2); ctx.fill();
      });
      return true;
    }

    if (name === '骸骨爆发') {
      fillRadialBg(ctx, '#c084fc', '#3b0764', '#020617');
      drawParticles(ctx, h, '#e879f9', 26, 'sparks');
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(140 + Math.cos(a) * 24, 110 + Math.sin(a) * 24);
        ctx.lineTo(140 + Math.cos(a) * 96, 110 + Math.sin(a) * 96);
        ctx.stroke();
      }
      drawSkull(ctx, 140, 110, 0.95, { eyeCol: '#e879f9', flame: true });
      return true;
    }

    if (name === '亡灵总动员' || name === '亡灵大礼包') {
      fillRadialBg(ctx, '#4ade80', '#1e1b4b', '#050811');
      drawParticles(ctx, h, '#4ade80', 18, 'wisps');
      drawSkull(ctx, 82, 128, 0.72, { eyeCol: '#4ade80' });
      drawSkull(ctx, 198, 128, 0.72, { eyeCol: '#4ade80' });
      drawSkull(ctx, 140, 102, 0.96, { eyeCol: '#fde047', crown: name === '亡灵大礼包', flame: true });
      return true;
    }

    if (name === '骸骨战机') {
      fillSkyBg(ctx, '#0f172a', '#1e293b', '#020617');
      drawParticles(ctx, h, '#38bdf8', 20, 'slashes');
      drawWingPair(ctx, 140, 106, 124, '#e2e8f0', '#38bdf8', 'mecha');
      ctx.fillStyle = '#334155'; ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(140, 28); ctx.lineTo(166, 140); ctx.lineTo(140, 186); ctx.lineTo(114, 140); ctx.closePath(); ctx.fill(); ctx.stroke();
      drawSkull(ctx, 140, 114, 0.62, { eyeCol: '#38bdf8' });
      return true;
    }

    if (name === '骨球') {
      fillRadialBg(ctx, '#94a3b8', '#1e293b', '#020617');
      drawParticles(ctx, h, '#e2e8f0', 16, 'slashes');
      ctx.fillStyle = '#cbd5e1'; ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(140, 110, 58, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      drawSkull(ctx, 118, 96, 0.55, { eyeCol: '#ef4444' });
      drawSkull(ctx, 162, 124, 0.55, { eyeCol: '#ef4444' });
      return true;
    }

    if (name === '失控的战甲犀牛') {
      fillRadialBg(ctx, '#ef4444', '#1e293b', '#020617');
      drawParticles(ctx, h, '#f97316', 22, 'slashes');
      ctx.fillStyle = '#334155'; ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.ellipse(134, 122, 68, 48, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      // 巨大合金犀牛角
      ctx.fillStyle = '#fde047'; ctx.strokeStyle = '#f97316'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(188, 108); ctx.quadraticCurveTo(234, 84, 246, 46); ctx.quadraticCurveTo(212, 92, 198, 126); ctx.closePath(); ctx.fill(); ctx.stroke();
      // 暴走红眼护目镜
      ctx.fillStyle = '#ef4444'; ctx.fillRect(166, 98, 28, 12);
      return true;
    }

    if (name === '乱刃机甲') {
      fillRadialBg(ctx, '#38bdf8', '#0f172a', '#020617');
      drawParticles(ctx, h, '#38bdf8', 22, 'slashes');
      drawWingPair(ctx, 140, 102, 120, '#0ea5e9', '#e0f2fe', 'mecha');
      ctx.fillStyle = '#1e293b'; ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(140, 48); ctx.lineTo(182, 92); ctx.lineTo(166, 178); ctx.lineTo(114, 178); ctx.lineTo(98, 92); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ef4444'; ctx.fillRect(120, 82, 40, 10);
      return true;
    }

    if (name === '残暴的尸兽' || name === '巨型骸骨兽') {
      fillRadialBg(ctx, '#7f1d1d', '#1c1917', '#020617');
      drawParticles(ctx, h, '#ef4444', 18, 'wisps');
      drawDragonHead(ctx, 140, 104, 1.08, {
        scaleCol: name === '巨型骸骨兽' ? '#cbd5e1' : '#7f1d1d',
        bellyCol: '#991b1b',
        hornCol: '#e2e8f0',
        eyeCol: '#ef4444',
        boneMode: name === '巨型骸骨兽'
      });
      return true;
    }

    if (name === '烈焰漩涡') {
      fillRadialBg(ctx, '#f97316', '#7f1d1d', '#090d16');
      drawParticles(ctx, h, '#fde047', 26, 'sparks');
      for (let r = 82; r >= 22; r -= 20) {
        ctx.strokeStyle = r > 50 ? '#ef4444' : '#fde047';
        ctx.lineWidth = 8;
        ctx.beginPath(); ctx.arc(140, 110, r, 0.3, Math.PI * 1.75); ctx.stroke();
      }
      return true;
    }

    if (name === '变形计') {
      fillRadialBg(ctx, '#38bdf8', '#3b0764', '#050811');
      drawMagicCircle(ctx, 140, 110, 84, '#fde047', 0.58);
      drawParticles(ctx, h, '#f472b6', 20, 'sparks');
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath(); ctx.arc(92, 112, 22, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fde047'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(122, 110); ctx.lineTo(156, 110); ctx.lineTo(146, 100); ctx.moveTo(156, 110); ctx.lineTo(146, 120); ctx.stroke();
      drawDragonHead(ctx, 198, 108, 0.54, { scaleCol: '#a855f7', bellyCol: '#fde047', hornCol: '#fde047', eyeCol: '#38bdf8' });
      return true;
    }

    if (name === '百变怪') {
      fillRadialBg(ctx, '#c084fc', '#4c1d95', '#090d16');
      drawParticles(ctx, h, '#e879f9', 18, 'sparks');
      ctx.save();
      const grad = ctx.createRadialGradient(132, 92, 12, 140, 108, 66);
      grad.addColorStop(0, '#f0abfc');
      grad.addColorStop(0.6, '#c084fc');
      grad.addColorStop(1, '#7e22ce');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(86, 134);
      ctx.bezierCurveTo(72, 104, 88, 60, 118, 56);
      ctx.bezierCurveTo(132, 42, 154, 46, 166, 62);
      ctx.bezierCurveTo(198, 68, 208, 106, 192, 136);
      ctx.bezierCurveTo(176, 152, 102, 152, 86, 134);
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#f5d0fe';
      ctx.stroke();
      // 可爱豆豆眼与微笑
      ctx.fillStyle = '#0f172a';
      ctx.beginPath(); ctx.arc(124, 96, 4.2, 0, Math.PI * 2); ctx.arc(156, 96, 4.2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(126, 110); ctx.quadraticCurveTo(140, 120, 154, 110); ctx.stroke();
      ctx.restore();
      return true;
    }

    if (name === '插满刀的血块怪') {
      fillRadialBg(ctx, '#991b1b', '#2d0606', '#050811');
      drawParticles(ctx, h, '#ef4444', 18, 'sparks');
      ctx.save();
      // 插满利刃
      const blades = [[-48, -32, -0.5], [46, -34, 0.55], [-56, 8, -1.1], [56, 10, 1.1], [0, -56, 0]];
      blades.forEach(([dx, dy, ang]) => {
        ctx.save();
        ctx.translate(140 + dx, 104 + dy);
        ctx.rotate(ang);
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(0, -34); ctx.lineTo(4, 0); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#475569';
        ctx.fillRect(-7, 0, 14, 4);
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(-2.5, 4, 5, 10);
        ctx.restore();
      });
      // 血肉躯体
      const bg = ctx.createRadialGradient(132, 96, 10, 140, 106, 56);
      bg.addColorStop(0, '#ef4444');
      bg.addColorStop(0.65, '#991b1b');
      bg.addColorStop(1, '#450a0a');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.ellipse(140, 108, 48, 38, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fca5a5'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#fde047';
      ctx.beginPath(); ctx.arc(124, 102, 4.5, 0, Math.PI * 2); ctx.arc(156, 102, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      return true;
    }

    if (name === '冒绿火的无头战士' || name === '冲锋的无头骑士') {
      const isKnight = name === '冲锋的无头骑士';
      fillRadialBg(ctx, isKnight ? '#0f766e' : '#15803d', '#090d16', '#050811');
      drawParticles(ctx, h, isKnight ? '#2dd4bf' : '#4ade80', 22, 'sparks');
      ctx.save();
      // 铠甲躯干（无头）
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = isKnight ? '#5eead4' : '#4ade80';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(100, 154); ctx.lineTo(108, 92); ctx.lineTo(172, 92); ctx.lineTo(180, 154); ctx.closePath();
      ctx.fill(); ctx.stroke();
      // 颈部冒出的绿火
      const flameGrad = ctx.createRadialGradient(140, 74, 4, 140, 74, 34);
      flameGrad.addColorStop(0, '#bbf7d0');
      flameGrad.addColorStop(0.5, isKnight ? '#14b8a6' : '#22c55e');
      flameGrad.addColorStop(1, 'rgba(34,197,94,0)');
      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(122, 92);
      ctx.quadraticCurveTo(114, 58, 140, 38);
      ctx.quadraticCurveTo(166, 58, 158, 92);
      ctx.closePath();
      ctx.fill();
      // 长剑/战斧
      ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(176, 136); ctx.lineTo(212, 60); ctx.stroke();
      ctx.restore();
      return true;
    }


    if (name === '扭曲虚空') {
      fillRadialBg(ctx, '#7e22ce', '#1e1b4b', '#050811');
      drawParticles(ctx, h, '#e879f9', 26, 'sparks');
      ctx.save();
      for (let r = 64; r >= 16; r -= 12) {
        ctx.strokeStyle = r % 24 === 0 ? '#f0abfc' : '#a855f7';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(140, 102, r, r * 0.58, 0.25, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = '#050811';
      ctx.beginPath(); ctx.ellipse(140, 102, 16, 10, 0.25, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      return true;
    }

    if (name === '鲜血宝石' || name === '血玫瑰') {
      const isGem = name === '鲜血宝石';
      fillRadialBg(ctx, '#e11d48', '#4c0519', '#050811');
      drawParticles(ctx, h, '#fda4af', 18, 'sparks');
      ctx.save();
      if (isGem) {
        ctx.fillStyle = '#f43f5e';
        ctx.strokeStyle = '#fecdd3';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(140, 38); ctx.lineTo(182, 86); ctx.lineTo(162, 152); ctx.lineTo(118, 152); ctx.lineTo(98, 86); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.28)';
        ctx.beginPath(); ctx.moveTo(140, 44); ctx.lineTo(164, 86); ctx.lineTo(140, 106); ctx.lineTo(116, 86); ctx.closePath(); ctx.fill();
      } else {
        ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(140, 158); ctx.lineTo(140, 102); ctx.stroke();
        [0, 0.8, 1.6, 2.4, 3.2].forEach((a, i) => {
          ctx.fillStyle = i % 2 === 0 ? '#e11d48' : '#fb7185';
          ctx.beginPath();
          ctx.ellipse(140 + Math.cos(a) * 14, 84 + Math.sin(a) * 10, 22, 14, a, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.fillStyle = '#9f1239';
        ctx.beginPath(); ctx.arc(140, 84, 12, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      return true;
    }

    if (name === '撕裂' || name === '刺骨' || name === '鲜血爆发') {
      fillRadialBg(ctx, '#dc2626', '#450a0a', '#050811');
      drawParticles(ctx, h, '#fb7185', 22, 'sparks');
      ctx.save();
      ctx.strokeStyle = '#fecdd3';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      if (name === '撕裂') {
        [-22, 0, 22].forEach(dx => {
          ctx.beginPath(); ctx.moveTo(100 + dx, 44); ctx.lineTo(176 + dx, 150); ctx.stroke();
        });
      } else if (name === '刺骨') {
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath(); ctx.moveTo(92, 140); ctx.lineTo(188, 52); ctx.lineTo(154, 114); ctx.closePath(); ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillStyle = '#f43f5e';
        for (let i = 0; i < 8; i++) {
          const ang = (i * Math.PI) / 4;
          ctx.beginPath(); ctx.moveTo(140, 100);
          ctx.lineTo(140 + Math.cos(ang) * 56, 100 + Math.sin(ang) * 56);
          ctx.lineTo(140 + Math.cos(ang + 0.25) * 28, 100 + Math.sin(ang + 0.25) * 28);
          ctx.closePath(); ctx.fill();
        }
      }
      ctx.restore();
      return true;
    }

    if (name === '坚固的狮子石像') {
      fillRadialBg(ctx, '#f59e0b', '#334155', '#090d16');
      drawParticles(ctx, h, '#fde047', 16, 'sparks');
      ctx.save();
      ctx.fillStyle = '#64748b'; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(140, 96, 42, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath(); ctx.arc(140, 96, 28, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.beginPath(); ctx.arc(129, 90, 4, 0, Math.PI * 2); ctx.arc(151, 90, 4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      return true;
    }

    if (name === '阴深的城堡') {
      fillRadialBg(ctx, '#312e81', '#0f172a', '#050811');
      drawParticles(ctx, h, '#c084fc', 16, 'sparks');
      ctx.save();
      ctx.fillStyle = '#1e293b'; ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
      ctx.fillRect(94, 72, 92, 86); ctx.strokeRect(94, 72, 92, 86);
      ctx.fillRect(84, 50, 24, 108); ctx.strokeRect(84, 50, 24, 108);
      ctx.fillRect(172, 50, 24, 108); ctx.strokeRect(172, 50, 24, 108);
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath(); ctx.arc(140, 128, 12, Math.PI, 0); ctx.lineTo(152, 158); ctx.lineTo(128, 158); ctx.closePath(); ctx.fill();
      ctx.restore();
      return true;
    }

    if (name === '蔷薇猛虎') {
      fillRadialBg(ctx, '#f97316', '#4c0519', '#050811');
      drawParticles(ctx, h, '#fb7185', 20, 'sparks');
      ctx.save();
      ctx.fillStyle = '#ea580c'; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(140, 100, 38, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(136, 66, 8, 18); ctx.fillRect(108, 96, 16, 6); ctx.fillRect(156, 96, 16, 6);
      ctx.fillStyle = '#fef08a';
      ctx.beginPath(); ctx.arc(126, 92, 4, 0, Math.PI * 2); ctx.arc(154, 92, 4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      return true;
    }


    // === v79 高精度重绘 36 张新卡牌专属插画 ===
    if (name === '蔷薇的妖精') {
      fillRadialBg(ctx, '#be123c', '#3b0764', '#07030d');
      drawMagicCircle(ctx, 140, 108, 66, '#fb7185', 0.35);
      drawParticles(ctx, h, '#fda4af', 28, 'sparks');
      ctx.save();
      // 透明蝶翼（双层带脉络）
      [-1, 1].forEach(dir => {
        ctx.save(); ctx.translate(140, 104); ctx.scale(dir, 1);
        const wg = ctx.createLinearGradient(0, -45, 76, 30);
        wg.addColorStop(0, 'rgba(253,164,175,0.75)'); wg.addColorStop(1, 'rgba(225,29,72,0.18)');
        ctx.fillStyle = wg; ctx.strokeStyle = '#fecdd3'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(8, -8); ctx.bezierCurveTo(46, -64, 88, -32, 66, 6); ctx.bezierCurveTo(46, 18, 22, 10, 8, 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(8, 4); ctx.bezierCurveTo(44, 10, 62, 42, 34, 52); ctx.bezierCurveTo(18, 44, 10, 22, 8, 8); ctx.fill(); ctx.stroke();
        ctx.restore();
      });
      // 荆棘藤蔓与玫瑰花苞
      ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(64, 198); ctx.quadraticCurveTo(106, 142, 140, 146); ctx.quadraticCurveTo(176, 148, 218, 194); ctx.stroke();
      // 妖精礼服与轮廓
      const dressG = ctx.createLinearGradient(140, 96, 140, 182);
      dressG.addColorStop(0, '#fb7185'); dressG.addColorStop(1, '#881337');
      ctx.fillStyle = dressG; ctx.strokeStyle = '#ffe4e6'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(128, 104); ctx.lineTo(152, 104); ctx.lineTo(172, 178); ctx.quadraticCurveTo(140, 190, 108, 178); ctx.closePath(); ctx.fill(); ctx.stroke();
      // 头部、玫瑰发饰与双眸
      ctx.fillStyle = '#fff1f2'; ctx.beginPath(); ctx.arc(140, 80, 18, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#9f1239';
      ctx.beginPath(); ctx.arc(140, 74, 20, Math.PI * 0.92, Math.PI * 2.08); ctx.fill();
      ctx.fillStyle = '#e11d48'; ctx.beginPath(); ctx.arc(124, 66, 7, 0, Math.PI * 2); ctx.arc(156, 66, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fb7185'; ctx.beginPath(); ctx.arc(134, 82, 2.5, 0, Math.PI * 2); ctx.arc(146, 82, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      return true;
    }

    if (name === '地狱归来的凶魔') {
      fillRadialBg(ctx, '#b91c1c', '#3b0712', '#040206');
      drawParticles(ctx, h, '#f97316', 30, 'sparks');
      drawParticles(ctx, h + 7, '#ef4444', 14, 'wisps');
      ctx.save();
      // 背后蝠翼
      [-1, 1].forEach(dir => {
        ctx.save(); ctx.translate(140, 98); ctx.scale(dir, 1);
        ctx.fillStyle = '#450a0a'; ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(16, -6); ctx.lineTo(96, -54); ctx.lineTo(82, 14); ctx.lineTo(54, 4); ctx.lineTo(36, 26); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      });
      // 熔岩胸甲与肩甲
      const bodyG = ctx.createLinearGradient(140, 96, 140, 198);
      bodyG.addColorStop(0, '#7f1d1d'); bodyG.addColorStop(1, '#180507');
      ctx.fillStyle = bodyG; ctx.strokeStyle = '#f87171'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(92, 114); ctx.lineTo(140, 98); ctx.lineTo(188, 114); ctx.lineTo(176, 198); ctx.lineTo(104, 198); ctx.closePath(); ctx.fill(); ctx.stroke();
      // 胸口炼狱核心
      ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.moveTo(140, 122); ctx.lineTo(154, 142); ctx.lineTo(140, 162); ctx.lineTo(126, 142); ctx.closePath(); ctx.fill();
      // 恶魔角与面甲
      ctx.fillStyle = '#27090d'; ctx.strokeStyle = '#fca5a5'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(140, 82, 24, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fbbf24';
      [-1, 1].forEach(dir => {
        ctx.beginPath(); ctx.moveTo(140 + dir * 16, 66); ctx.quadraticCurveTo(140 + dir * 48, 36, 140 + dir * 34, 18); ctx.quadraticCurveTo(140 + dir * 24, 42, 140 + dir * 8, 60); ctx.closePath(); ctx.fill();
      });
      ctx.fillStyle = '#fef08a';
      ctx.beginPath(); ctx.moveTo(124, 78); ctx.lineTo(136, 82); ctx.lineTo(126, 86); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(156, 78); ctx.lineTo(144, 82); ctx.lineTo(154, 86); ctx.closePath(); ctx.fill();
      ctx.restore();
      return true;
    }

    if (name === '嗜血的亡灵') {
      fillRadialBg(ctx, '#881337', '#1e1b4b', '#05030a');
      drawParticles(ctx, h, '#fb7185', 24, 'wisps');
      ctx.save();
      // 血色月轮
      drawMoon(ctx, 140, 74, 42, '#f43f5e', false);
      // 破败披风
      ctx.fillStyle = '#1e1b4b'; ctx.strokeStyle = '#be123c'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(106, 108); ctx.lineTo(174, 108); ctx.lineTo(194, 198); ctx.lineTo(86, 198); ctx.closePath(); ctx.fill(); ctx.stroke();
      // 骨肋与血晶
      ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 3;
      for (let ry = 124; ry <= 156; ry += 10) {
        ctx.beginPath(); ctx.moveTo(122, ry); ctx.quadraticCurveTo(140, ry + 5, 158, ry); ctx.stroke();
      }
      // 骷髅头与血瞳
      ctx.fillStyle = '#f1f5f9'; ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(140, 84, 24, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#090d16'; ctx.beginPath(); ctx.arc(131, 82, 5.5, 0, Math.PI * 2); ctx.arc(149, 82, 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f43f5e'; ctx.beginPath(); ctx.arc(131, 82, 2.5, 0, Math.PI * 2); ctx.arc(149, 82, 2.5, 0, Math.PI * 2); ctx.fill();
      // 血镰
      ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(184, 192); ctx.lineTo(198, 44); ctx.stroke();
      ctx.fillStyle = '#e11d48';
      ctx.beginPath(); ctx.moveTo(198, 44); ctx.quadraticCurveTo(146, 36, 128, 66); ctx.quadraticCurveTo(164, 56, 196, 58); ctx.closePath(); ctx.fill();
      ctx.restore();
      return true;
    }

    if (name === '疼痛疗愈者') {
      fillRadialBg(ctx, '#db2777', '#312e81', '#060714');
      drawMagicCircle(ctx, 140, 108, 62, '#34d399', 0.42);
      drawParticles(ctx, h, '#f9a8d4', 22, 'sparks');
      ctx.save();
      // 圣女白袍与翡翠披肩
      const robeG = ctx.createLinearGradient(140, 96, 140, 194);
      robeG.addColorStop(0, '#fdf2f8'); robeG.addColorStop(1, '#9d174d');
      ctx.fillStyle = robeG; ctx.strokeStyle = '#f472b6'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(114, 104); ctx.lineTo(166, 104); ctx.lineTo(182, 194); ctx.lineTo(98, 194); ctx.closePath(); ctx.fill(); ctx.stroke();
      // 祈祷光轮与十字圣徽
      ctx.fillStyle = '#10b981'; ctx.strokeStyle = '#a7f3d0'; ctx.lineWidth = 1.5;
      ctx.fillRect(135, 118, 10, 34); ctx.fillRect(123, 130, 34, 10);
      ctx.strokeRect(135, 118, 10, 34);
      // 面容与头纱
      ctx.fillStyle = '#fce7f3'; ctx.beginPath(); ctx.arc(140, 78, 17, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath(); ctx.moveTo(140, 52); ctx.quadraticCurveTo(106, 68, 106, 124); ctx.lineTo(124, 110); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(140, 52); ctx.quadraticCurveTo(174, 68, 174, 124); ctx.lineTo(156, 110); ctx.closePath(); ctx.fill();
      ctx.restore();
      return true;
    }

    if (name === '圣光照耀') {
      fillSkyBg(ctx, '#fef08a', '#d97706', '#1e1b4b');
      drawParticles(ctx, h, '#ffffff', 34, 'sparks');
      ctx.save();
      // 贯穿天际的圣光柱
      const beamG = ctx.createLinearGradient(100, 0, 180, 0);
      beamG.addColorStop(0, 'rgba(255,255,255,0)'); beamG.addColorStop(0.5, 'rgba(255,251,235,0.92)'); beamG.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = beamG; ctx.fillRect(88, 0, 104, 220);
      drawMagicCircle(ctx, 140, 102, 56, '#ffffff', 0.85);
      // 十字星芒
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.moveTo(140, 20); ctx.lineTo(148, 94); ctx.lineTo(220, 102); ctx.lineTo(148, 110); ctx.lineTo(140, 184); ctx.lineTo(132, 110); ctx.lineTo(60, 102); ctx.lineTo(132, 94); ctx.closePath(); ctx.fill();
      ctx.restore();
      return true;
    }

    if (name === '碎骨火种') {
      fillRadialBg(ctx, '#ea580c', '#431407', '#050304');
      drawParticles(ctx, h, '#fb923c', 30, 'sparks');
      ctx.save();
      // 交叉白骨底座
      ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(86, 162); ctx.lineTo(194, 122); ctx.moveTo(86, 122); ctx.lineTo(194, 162); ctx.stroke();
      // 烈焰火种核心
      const fG = ctx.createRadialGradient(140, 104, 4, 140, 104, 46);
      fG.addColorStop(0, '#fef08a'); fG.addColorStop(0.5, '#f97316'); fG.addColorStop(1, 'rgba(239,68,68,0)');
      ctx.fillStyle = fG;
      ctx.beginPath(); ctx.moveTo(140, 38); ctx.bezierCurveTo(186, 82, 178, 142, 140, 148); ctx.bezierCurveTo(102, 142, 94, 82, 140, 38); ctx.fill();
      ctx.fillStyle = '#fffbeb'; ctx.beginPath(); ctx.arc(140, 110, 10, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      return true;
    }

    if (name === '折光镜像师') {
      fillRadialBg(ctx, '#0284c7', '#312e81', '#040714');
      drawParticles(ctx, h, '#bae6fd', 26, 'sparks');
      ctx.save();
      // 悬浮棱镜阵列
      [[-58, -16, 0.7], [58, -16, 0.7]].forEach(([dx, dy, sc]) => {
        ctx.save(); ctx.translate(140 + dx, 104 + dy); ctx.scale(sc, sc);
        ctx.fillStyle = 'rgba(56,189,248,0.28)'; ctx.strokeStyle = '#7dd3fc'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, -34); ctx.lineTo(24, 0); ctx.lineTo(0, 34); ctx.lineTo(-24, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      });
      // 中央法师与折光主镜
      ctx.fillStyle = 'rgba(186,230,253,0.32)'; ctx.strokeStyle = '#e0f2fe'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(140, 36); ctx.lineTo(182, 102); ctx.lineTo(140, 174); ctx.lineTo(98, 102); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.moveTo(124, 114); ctx.lineTo(156, 114); ctx.lineTo(166, 178); ctx.lineTo(114, 178); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e0f2fe'; ctx.beginPath(); ctx.arc(140, 88, 15, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      return true;
    }

    if (name === '伺机待发的猎鹰骑士') {
      fillSkyBg(ctx, '#0284c7', '#0f172a', '#03060e');
      drawParticles(ctx, h, '#e0f2fe', 20, 'slashes');
      ctx.save();
      // 展翼巨鹰
      const wingG = ctx.createLinearGradient(50, 50, 230, 140);
      wingG.addColorStop(0, '#38bdf8'); wingG.addColorStop(0.5, '#f8fafc'); wingG.addColorStop(1, '#0369a1');
      ctx.fillStyle = wingG; ctx.strokeStyle = '#bae6fd'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(140, 92); ctx.lineTo(44, 46); ctx.lineTo(74, 104); ctx.lineTo(112, 120); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(140, 92); ctx.lineTo(236, 46); ctx.lineTo(206, 104); ctx.lineTo(168, 120); ctx.closePath(); ctx.fill(); ctx.stroke();
      // 骑士盔甲与长枪
      ctx.fillStyle = '#1e293b'; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(122, 92); ctx.lineTo(158, 92); ctx.lineTo(164, 174); ctx.lineTo(116, 174); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.arc(140, 74, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(92, 174); ctx.lineTo(206, 48); ctx.stroke();
      ctx.restore();
      return true;
    }

    if (name === '傲慢的将军') {
      fillRadialBg(ctx, '#d97706', '#451a03', '#070504');
      drawParticles(ctx, h, '#fde047', 24, 'sparks');
      ctx.save();
      // 黄金披风
      ctx.fillStyle = '#7f1d1d'; ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(86, 98); ctx.lineTo(194, 98); ctx.lineTo(214, 198); ctx.lineTo(66, 198); ctx.closePath(); ctx.fill(); ctx.stroke();
      // 华丽重甲
      const armG = ctx.createLinearGradient(100, 86, 180, 186);
      armG.addColorStop(0, '#fcd34d'); armG.addColorStop(0.5, '#b45309'); armG.addColorStop(1, '#334155');
      drawGirlArmor(ctx, { cx: 140, top: 96, bot: 180, shoulders: 30, waist: 14, hips: 26,
        fill: armG, trim: '#fef08a', cloth: '#7f1d1d', plate: '#b45309' });
      // 皇冠与威严头盔
      ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.arc(140, 72, 19, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.moveTo(114, 58); ctx.lineTo(120, 34); ctx.lineTo(132, 50); ctx.lineTo(140, 28); ctx.lineTo(148, 50); ctx.lineTo(160, 34); ctx.lineTo(166, 58); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(194, 188); ctx.lineTo(194, 48); ctx.stroke();
      ctx.restore();
      return true;
    }

    if (name === '元气弹') {
      fillRadialBg(ctx, '#0ea5e9', '#1e3a8a', '#020617');
      drawParticles(ctx, h, '#e0f2fe', 36, 'sparks');
      ctx.save();
      // 汇集能量波纹
      for (let r = 74; r >= 26; r -= 16) {
        ctx.strokeStyle = 'rgba(186,230,253,0.45)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(140, 98, r, 0, Math.PI * 2); ctx.stroke();
      }
      const orbG = ctx.createRadialGradient(132, 90, 6, 140, 98, 52);
      orbG.addColorStop(0, '#ffffff'); orbG.addColorStop(0.45, '#7dd3fc'); orbG.addColorStop(0.85, '#0284c7'); orbG.addColorStop(1, 'rgba(2,132,199,0)');
      ctx.fillStyle = orbG; ctx.beginPath(); ctx.arc(140, 98, 52, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      return true;
    }

    if (name === '沐浴龙血的天使') {
      fillRadialBg(ctx, '#dc2626', '#78350f', '#070304');
      drawParticles(ctx, h, '#fca5a5', 28, 'sparks');
      ctx.save();
      // 染血炽翼
      [-1, 1].forEach(dir => {
        ctx.save(); ctx.translate(140, 96); ctx.scale(dir, 1);
        const wg = ctx.createLinearGradient(0, -40, 96, 40);
        wg.addColorStop(0, '#fee2e2'); wg.addColorStop(0.6, '#ef4444'); wg.addColorStop(1, '#7f1d1d');
        ctx.fillStyle = wg; ctx.strokeStyle = '#fecaca'; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.moveTo(10, -8); ctx.quadraticCurveTo(64, -62, 96, -24); ctx.quadraticCurveTo(72, 22, 16, 14); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      });
      // 龙血光环与圣铠
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(140, 52, 24, 7, 0, 0, Math.PI * 2); ctx.stroke();
      drawGirlArmor(ctx, { cx: 140, top: 96, bot: 178, shoulders: 26, waist: 12, hips: 23,
        fill: '#991b1b', trim: '#fde047', cloth: '#450a0a', plate: '#7f1d1d' });
      ctx.fillStyle = '#fef2f2'; ctx.beginPath(); ctx.arc(140, 76, 16, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      return true;
    }

    if (name === '团结的守卫') {
      fillRadialBg(ctx, '#1d4ed8', '#1e293b', '#050814');
      drawParticles(ctx, h, '#93c5fd', 18, 'sparks');
      ctx.save();
      // 左右并排巨盾墙
      [-48, 48].forEach(dx => {
        ctx.fillStyle = '#334155'; ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(140+dx-22, 82); ctx.lineTo(140+dx+22, 82); ctx.lineTo(140+dx+18, 148); ctx.lineTo(140+dx, 168); ctx.lineTo(140+dx-18, 148); ctx.closePath(); ctx.fill(); ctx.stroke();
      });
      // 中央金蓝圣盾
      const shG = ctx.createLinearGradient(140, 62, 140, 172);
      shG.addColorStop(0, '#60a5fa'); shG.addColorStop(1, '#1e3a8a');
      ctx.fillStyle = shG; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(106, 66); ctx.lineTo(174, 66); ctx.lineTo(168, 142); ctx.lineTo(140, 172); ctx.lineTo(112, 142); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fef08a'; ctx.fillRect(136, 86, 8, 52); ctx.fillRect(120, 106, 40, 8);
      ctx.restore();
      return true;
    }

    if (name === '换帅') {
      fillRadialBg(ctx, '#7e22ce', '#1e1b4b', '#060412');
      drawMagicCircle(ctx, 140, 102, 58, '#fde047', 0.5);
      drawParticles(ctx, h, '#d8b4fe', 20, 'sparks');
      ctx.save();
      // 两枚互换棋子
      [[94, 118, '#38bdf8'], [186, 86, '#fbbf24']].forEach(([cx, cy, col]) => {
        ctx.fillStyle = col; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy - 20, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx - 14, cy + 16); ctx.lineTo(cx + 14, cy + 16); ctx.lineTo(cx + 8, cy - 8); ctx.lineTo(cx - 8, cy - 8); ctx.closePath(); ctx.fill(); ctx.stroke();
      });
      ctx.strokeStyle = '#fde047'; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(108, 76); ctx.quadraticCurveTo(140, 44, 170, 66); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(172, 128); ctx.quadraticCurveTo(140, 160, 110, 138); ctx.stroke();
      ctx.restore();
      return true;
    }

    if (name === '传承') {
      fillRadialBg(ctx, '#059669', '#064e3b', '#030d08');
      drawParticles(ctx, h, '#6ee7b7', 26, 'sparks');
      ctx.save();
      // 传承圣火交递
      ctx.strokeStyle = '#34d399'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(140, 56); ctx.lineTo(84, 152); ctx.moveTo(140, 56); ctx.lineTo(140, 156); ctx.moveTo(140, 56); ctx.lineTo(196, 152); ctx.stroke();
      [[140, 56, 20, '#fef08a'], [84, 152, 12, '#6ee7b7'], [140, 156, 12, '#6ee7b7'], [196, 152, 12, '#6ee7b7']].forEach(([x, y, r, c]) => {
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      });
      ctx.restore();
      return true;
    }

    if (name === '孤傲的浪人') {
      fillSkyBg(ctx, '#475569', '#1e293b', '#04060c');
      drawMoon(ctx, 204, 54, 24, '#e2e8f0', true);
      drawParticles(ctx, h, '#cbd5e1', 18, 'slashes');
      ctx.save();
      // 披风与斗笠
      ctx.fillStyle = '#0f172a'; ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(106, 98); ctx.lineTo(174, 98); ctx.lineTo(192, 192); ctx.lineTo(88, 192); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#334155'; ctx.strokeStyle = '#cbd5e1';
      ctx.beginPath(); ctx.moveTo(84, 82); ctx.lineTo(196, 82); ctx.lineTo(140, 52); ctx.closePath(); ctx.fill(); ctx.stroke();
      // 拔刀寒光
      ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(74, 156); ctx.lineTo(208, 86); ctx.stroke();
      ctx.restore();
      return true;
    }

    if (name === '违规操作的炸弹兵') {
      fillRadialBg(ctx, '#ea580c', '#7f1d1d', '#090404');
      drawParticles(ctx, h, '#fde047', 30, 'sparks');
      ctx.save();
      // 哥布林工程帽与炸弹群
      ctx.fillStyle = '#1e293b'; ctx.strokeStyle = '#fb923c'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(140, 126, 36, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#334155'; ctx.beginPath(); ctx.arc(92, 148, 20, 0, Math.PI * 2); ctx.arc(188, 148, 20, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      // 引信火花
      ctx.strokeStyle = '#fde047'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(140, 90); ctx.quadraticCurveTo(154, 62, 174, 58); ctx.stroke();
      ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(174, 58, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fef08a'; ctx.beginPath(); ctx.arc(174, 58, 5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      return true;
    }

    if (name === '归来的剑圣') {
      fillRadialBg(ctx, '#0284c7', '#0f172a', '#040710');
      drawMagicCircle(ctx, 140, 100, 62, '#38bdf8', 0.45);
      drawParticles(ctx, h, '#bae6fd', 26, 'slashes');
      ctx.save();
      // 双剑交叉破空
      ctx.strokeStyle = '#e0f2fe'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(86, 166); ctx.lineTo(194, 46); ctx.moveTo(194, 166); ctx.lineTo(86, 46); ctx.stroke();
      // 剑圣披风与甲胄
      ctx.fillStyle = '#1e3a8a'; ctx.strokeStyle = '#7dd3fc'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(116, 94); ctx.lineTo(164, 94); ctx.lineTo(174, 182); ctx.lineTo(106, 182); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.arc(140, 74, 16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#38bdf8'; ctx.fillRect(126, 70, 28, 5);
      ctx.restore();
      return true;
    }

    if (name === '宁静的治愈师') {
      fillRadialBg(ctx, '#10b981', '#065f46', '#03120c');
      drawMagicCircle(ctx, 140, 104, 58, '#a7f3d0', 0.4);
      drawParticles(ctx, h, '#6ee7b7', 24, 'sparks');
      ctx.save();
      ctx.fillStyle = '#ecfdf5'; ctx.strokeStyle = '#34d399'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(114, 98); ctx.lineTo(166, 98); ctx.lineTo(176, 184); ctx.lineTo(104, 184); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fef2f2'; ctx.beginPath(); ctx.arc(140, 76, 16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#34d399'; ctx.beginPath(); ctx.arc(140, 128, 16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(137, 118, 6, 20); ctx.fillRect(130, 125, 20, 6);
      ctx.restore();
      return true;
    }

    if (name === '慷慨的天使') {
      fillSkyBg(ctx, '#f59e0b', '#1e3a8a', '#060916');
      drawParticles(ctx, h, '#fef08a', 26, 'sparks');
      ctx.save();
      [-1, 1].forEach(dir => {
        ctx.save(); ctx.translate(140, 96); ctx.scale(dir, 1);
        ctx.fillStyle = '#fef9c3'; ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.moveTo(10, -6); ctx.quadraticCurveTo(64, -56, 94, -18); ctx.quadraticCurveTo(68, 24, 14, 12); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      });
      ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(140, 50, 22, 6, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#eff6ff'; ctx.beginPath(); ctx.moveTo(122, 94); ctx.lineTo(158, 94); ctx.lineTo(168, 180); ctx.lineTo(112, 180); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fffbeb'; ctx.beginPath(); ctx.arc(140, 76, 15, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      return true;
    }

    if (name === '守护祷告者') {
      fillRadialBg(ctx, '#2563eb', '#1e1b4b', '#050814');
      drawMagicCircle(ctx, 140, 102, 62, '#93c5fd', 0.58);
      drawParticles(ctx, h, '#bfdbfe', 24, 'sparks');
      ctx.save();
      // 蓝金神官袍与披肩
      const rG = ctx.createLinearGradient(140, 92, 140, 188);
      rG.addColorStop(0, '#1e40af'); rG.addColorStop(1, '#0f172a');
      ctx.fillStyle = rG; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(112, 96); ctx.lineTo(168, 96); ctx.lineTo(182, 188); ctx.lineTo(98, 188); ctx.closePath(); ctx.fill(); ctx.stroke();
      // 祈祷合十双手与浮空圣盾徽记
      ctx.fillStyle = '#eff6ff'; ctx.beginPath(); ctx.arc(140, 72, 16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#60a5fa'; ctx.beginPath(); ctx.arc(140, 66, 18, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2.8;
      ctx.beginPath(); ctx.moveTo(118, 114); ctx.lineTo(162, 114); ctx.lineTo(156, 148); ctx.lineTo(140, 162); ctx.lineTo(124, 148); ctx.closePath(); ctx.stroke();
      ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(140, 134, 6, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      return true;
    }

    if (name === '猛虎训练师') {
      fillRadialBg(ctx, '#d97706', '#7c2d12', '#090503');
      drawParticles(ctx, h, '#fdba74', 22, 'sparks');
      ctx.save();
      // 驯兽师披风与长鞭
      ctx.fillStyle = '#9a3412'; ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(114, 96); ctx.lineTo(166, 96); ctx.lineTo(178, 186); ctx.lineTo(102, 186); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffedd5'; ctx.beginPath(); ctx.arc(140, 74, 16, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fde047'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(168, 126); ctx.bezierCurveTo(212, 102, 220, 60, 188, 46); ctx.stroke();
      ctx.restore();
      return true;
    }

    if (name === '圣甲猛虎') {
      fillRadialBg(ctx, '#f59e0b', '#451a03', '#070503');
      drawParticles(ctx, h, '#fef08a', 24, 'sparks');
      ctx.save();
      // 圣甲虎首与金铠肩甲
      ctx.fillStyle = '#78350f'; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(86, 128); ctx.lineTo(194, 128); ctx.lineTo(206, 188); ctx.lineTo(74, 188); ctx.closePath(); ctx.fill(); ctx.stroke();
      const tG = ctx.createRadialGradient(140, 88, 6, 140, 92, 42);
      tG.addColorStop(0, '#fb923c'); tG.addColorStop(1, '#b45309');
      ctx.fillStyle = tG; ctx.beginPath(); ctx.arc(140, 92, 36, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      // 虎耳与王字纹
      ctx.beginPath(); ctx.moveTo(108, 68); ctx.lineTo(98, 44); ctx.lineTo(124, 58); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(172, 68); ctx.lineTo(182, 44); ctx.lineTo(156, 58); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fef08a'; ctx.beginPath(); ctx.arc(126, 88, 4.5, 0, Math.PI * 2); ctx.arc(154, 88, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1c1917'; ctx.fillRect(136, 62, 8, 14); ctx.fillRect(128, 68, 24, 4);
      ctx.restore();
      return true;
    }

    if (name === '开辟的传教士') {
      fillRadialBg(ctx, '#7c3aed', '#1e1b4b', '#050410');
      drawMagicCircle(ctx, 140, 92, 58, '#fbbf24', 0.55);
      drawParticles(ctx, h, '#ddd6fe', 24, 'sparks');
      ctx.save();
      ctx.fillStyle = '#312e81'; ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(116, 96); ctx.lineTo(164, 96); ctx.lineTo(176, 186); ctx.lineTo(104, 186); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ede9fe'; ctx.beginPath(); ctx.arc(140, 74, 16, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fde047'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(188, 182); ctx.lineTo(188, 42); ctx.moveTo(170, 62); ctx.lineTo(206, 62); ctx.stroke();
      ctx.restore();
      return true;
    }

    if (name === '猛虎神殿') {
      fillSkyBg(ctx, '#d97706', '#78350f', '#1c1917');
      drawParticles(ctx, h, '#fde047', 20, 'sparks');
      ctx.save();
      ctx.fillStyle = '#451a03'; ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(70, 88); ctx.lineTo(140, 42); ctx.lineTo(210, 88); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillRect(88, 88, 104, 86); ctx.strokeRect(88, 88, 104, 86);
      [104, 134, 164].forEach(px => { ctx.fillStyle = '#b45309'; ctx.fillRect(px, 94, 12, 76); });
      ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(140, 68, 10, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      return true;
    }

    if (name === '祝福的圣骑士') {
      fillRadialBg(ctx, '#0284c7', '#1e3a8a', '#050914');
      drawMagicCircle(ctx, 140, 96, 56, '#fde047', 0.45);
      drawParticles(ctx, h, '#fef08a', 22, 'sparks');
      ctx.save();
      ctx.fillStyle = '#e0f2fe'; ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(116, 94); ctx.lineTo(164, 94); ctx.lineTo(172, 180); ctx.lineTo(108, 180); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fffbeb'; ctx.beginPath(); ctx.arc(140, 74, 16, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.moveTo(96, 112); ctx.lineTo(132, 112); ctx.lineTo(128, 158); ctx.lineTo(114, 174); ctx.lineTo(100, 158); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
      return true;
    }

    if (name === '圣骑士士官长') {
      fillRadialBg(ctx, '#ca8a04', '#1e293b', '#050811');
      drawParticles(ctx, h, '#fde047', 22, 'sparks');
      ctx.save();
      ctx.fillStyle = '#334155'; ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(102, 92); ctx.lineTo(178, 92); ctx.lineTo(186, 186); ctx.lineTo(94, 186); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#94a3b8'; ctx.beginPath(); ctx.arc(140, 70, 18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.moveTo(140, 52); ctx.quadraticCurveTo(156, 30, 168, 44); ctx.lineTo(144, 54); ctx.fill();
      ctx.restore();
      return true;
    }

    if (name === '圣骑兵') {
      fillSkyBg(ctx, '#334155', '#1e293b', '#050811');
      drawParticles(ctx, h, '#93c5fd', 18, 'sparks');
      ctx.save();
      // 披风与枪戟
      ctx.fillStyle = '#1e3a8a'; ctx.beginPath(); ctx.moveTo(106, 98); ctx.lineTo(174, 98); ctx.lineTo(186, 186); ctx.lineTo(94, 186); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(188, 186); ctx.lineTo(196, 36); ctx.stroke();
      ctx.fillStyle = '#bae6fd'; ctx.beginPath(); ctx.moveTo(196, 22); ctx.lineTo(204, 46); ctx.lineTo(188, 46); ctx.closePath(); ctx.fill();
      // 银甲：少女体格胸铠（收腰 + 裙甲，不再是方盒子）
      const armG = ctx.createLinearGradient(112, 92, 168, 180);
      armG.addColorStop(0, '#cbd5e1'); armG.addColorStop(1, '#475569');
      drawGirlArmor(ctx, { cx: 140, top: 94, bot: 178, shoulders: 30, waist: 11, hips: 20,
        fill: armG, trim: '#38bdf8', cloth: '#1e3a8a', plate: '#cbd5e1' });
      // 腰际金色扣带
      ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(126, 130); ctx.quadraticCurveTo(140, 136, 154, 130); ctx.stroke();
      // 骑士全盔与面甲缝
      ctx.fillStyle = '#94a3b8'; ctx.beginPath(); ctx.arc(140, 72, 18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#0f172a'; ctx.fillRect(128, 70, 24, 5);
      ctx.fillStyle = '#38bdf8'; ctx.fillRect(133, 71, 5, 3); ctx.fillRect(142, 71, 5, 3);
      // 塔盾
      ctx.fillStyle = '#1d4ed8'; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(88, 108); ctx.lineTo(126, 108); ctx.lineTo(122, 158); ctx.lineTo(107, 174); ctx.lineTo(92, 158); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
      return true;
    }

    if (name === '神圣翼甲战士') {
      fillSkyBg(ctx, '#facc15', '#1e3a8a', '#050814');
      drawParticles(ctx, h, '#fef9c3', 28, 'sparks');
      ctx.save();
      [-1, 1].forEach(dir => {
        ctx.save(); ctx.translate(140, 94); ctx.scale(dir, 1);
        ctx.fillStyle = '#fef08a'; ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(14, -10); ctx.lineTo(96, -54); ctx.lineTo(84, 12); ctx.lineTo(22, 18); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      });
      drawGirlArmor(ctx, { cx: 140, top: 92, bot: 182, shoulders: 28, waist: 13, hips: 24,
        fill: '#0284c7', trim: '#fde047', cloth: '#1e3a8a', plate: '#075985' });
      ctx.fillStyle = '#fef08a'; ctx.beginPath(); ctx.arc(140, 68, 17, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
      return true;
    }

    if (name === '神圣宫殿') {
      fillSkyBg(ctx, '#fde047', '#312e81', '#060814');
      drawParticles(ctx, h, '#fef08a', 24, 'sparks');
      ctx.save();
      ctx.fillStyle = '#f8fafc'; ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2.2;
      ctx.fillRect(82, 92, 116, 86); ctx.strokeRect(82, 92, 116, 86);
      ctx.beginPath(); ctx.moveTo(72, 92); ctx.lineTo(140, 42); ctx.lineTo(208, 92); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(140, 146, 18, Math.PI, 0); ctx.lineTo(158, 178); ctx.lineTo(122, 178); ctx.closePath(); ctx.fill();
      ctx.restore();
      return true;
    }

    if (name === '神圣重盾圣铠') {
      fillRadialBg(ctx, '#d97706', '#0f172a', '#04060c');
      drawMagicCircle(ctx, 140, 106, 62, '#fde047', 0.48);
      drawParticles(ctx, h, '#fef08a', 26, 'sparks');
      ctx.save();
      const sG = ctx.createLinearGradient(140, 48, 140, 174);
      sG.addColorStop(0, '#fde047'); sG.addColorStop(0.5, '#d97706'); sG.addColorStop(1, '#334155');
      ctx.fillStyle = sG; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(92, 54); ctx.lineTo(188, 54); ctx.lineTo(178, 140); ctx.lineTo(140, 176); ctx.lineTo(102, 140); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.arc(140, 108, 16, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
      return true;
    }

    if (name === '守护之光芒') {
      fillRadialBg(ctx, '#0284c7', '#1e3a8a', '#030816');
      drawMagicCircle(ctx, 140, 102, 68, '#fef08a', 0.72);
      drawParticles(ctx, h, '#ffffff', 34, 'sparks');
      ctx.save();
      // 四散圣光射线
      ctx.strokeStyle = 'rgba(254,240,138,0.55)'; ctx.lineWidth = 3;
      for (let a = 0; a < 8; a++) {
        const ang = (a * Math.PI) / 4;
        ctx.beginPath(); ctx.moveTo(140 + Math.cos(ang)*24, 104 + Math.sin(ang)*24);
        ctx.lineTo(140 + Math.cos(ang)*78, 104 + Math.sin(ang)*78); ctx.stroke();
      }
      // 晶体圣盾虚影
      const sg = ctx.createLinearGradient(140, 56, 140, 168);
      sg.addColorStop(0, 'rgba(186,230,253,0.75)'); sg.addColorStop(1, 'rgba(56,189,248,0.22)');
      ctx.fillStyle = sg; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 3.2;
      ctx.beginPath(); ctx.moveTo(100, 64); ctx.lineTo(180, 64); ctx.lineTo(172, 134); ctx.lineTo(140, 166); ctx.lineTo(108, 134); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(136, 82, 8, 52); ctx.fillRect(118, 104, 44, 8);
      ctx.restore();
      return true;
    }

    if (name === '阴险的猎手') {
      fillSkyBg(ctx, '#3b0764', '#0f172a', '#030208');
      drawMoon(ctx, 206, 52, 22, '#e879f9', true);
      drawParticles(ctx, h, '#c084fc', 24, 'slashes');
      ctx.save();
      // 暗影斗篷与兜帽
      ctx.fillStyle = '#1e1b4b'; ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(140, 44); ctx.lineTo(192, 186); ctx.lineTo(88, 186); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#090d16'; ctx.beginPath(); ctx.arc(140, 86, 19, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      // 猩红夜视双眸与面巾
      ctx.fillStyle = '#f43f5e'; ctx.beginPath(); ctx.arc(133, 84, 3.5, 0, Math.PI * 2); ctx.arc(147, 84, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#312e81'; ctx.fillRect(124, 92, 32, 14);
      // 淬毒双匕首
      ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(82, 152); ctx.lineTo(124, 114); ctx.moveTo(198, 152); ctx.lineTo(156, 114); ctx.stroke();
      ctx.strokeStyle = '#34d399'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(82, 152); ctx.lineTo(98, 138); ctx.moveTo(198, 152); ctx.lineTo(182, 138); ctx.stroke();
      ctx.restore();
      return true;
    }

    if (name === '神圣宫廷祷告师') {
      fillRadialBg(ctx, '#eab308', '#1e1b4b', '#060712');
      drawMagicCircle(ctx, 140, 96, 60, '#fde047', 0.55);
      drawParticles(ctx, h, '#fef08a', 24, 'sparks');
      ctx.save();
      ctx.fillStyle = '#fef9c3'; ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(114, 96); ctx.lineTo(166, 96); ctx.lineTo(176, 184); ctx.lineTo(104, 184); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fffbeb'; ctx.beginPath(); ctx.arc(140, 72, 16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.moveTo(124, 58); ctx.lineTo(140, 36); ctx.lineTo(156, 58); ctx.closePath(); ctx.fill();
      ctx.restore();
      return true;
    }

    if (name === '胜利天使') {
      fillSkyBg(ctx, '#fef08a', '#d97706', '#1e1b4b');
      drawMagicCircle(ctx, 140, 96, 66, '#ffffff', 0.5);
      drawParticles(ctx, h, '#ffffff', 32, 'sparks');
      ctx.save();
      [-1, 1].forEach(dir => {
        ctx.save(); ctx.translate(140, 92); ctx.scale(dir, 1);
        ctx.fillStyle = '#fffbeb'; ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(12, -10); ctx.quadraticCurveTo(72, -66, 102, -22); ctx.quadraticCurveTo(74, 24, 18, 14); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      });
      ctx.fillStyle = '#fbbf24'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(120, 90); ctx.lineTo(160, 90); ctx.lineTo(168, 182); ctx.lineTo(112, 182); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(140, 70, 16, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(194, 182); ctx.lineTo(194, 34); ctx.stroke();
      ctx.restore();
      return true;
    }

    if (name === '邪恶骨巫') {
      fillRadialBg(ctx, '#6b21a8', '#1e1b4b', '#04020a');
      drawMagicCircle(ctx, 140, 110, 64, '#e879f9', 0.56);
      drawParticles(ctx, h, '#f0abfc', 28, 'wisps');
      ctx.save();
      // 骨巫黑袍与骨肩饰
      ctx.fillStyle = '#1e1b4b'; ctx.strokeStyle = '#c084fc'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(104, 94); ctx.lineTo(176, 94); ctx.lineTo(192, 190); ctx.lineTo(88, 190); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath(); ctx.moveTo(96, 98); ctx.lineTo(74, 82); ctx.lineTo(106, 114); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(184, 98); ctx.lineTo(206, 82); ctx.lineTo(174, 114); ctx.closePath(); ctx.fill();
      // 骨面具与冥火双瞳
      ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.arc(140, 74, 20, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#a855f7'; ctx.beginPath(); ctx.arc(132, 74, 4.5, 0, Math.PI * 2); ctx.arc(148, 74, 4.5, 0, Math.PI * 2); ctx.fill();
      // 聚魂法杖
      ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(82, 186); ctx.lineTo(82, 52); ctx.stroke();
      ctx.fillStyle = '#e879f9'; ctx.beginPath(); ctx.arc(82, 46, 11, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      return true;
    }

    if (name === '圣骑将军') {
      fillRadialBg(ctx, '#d97706', '#1e3a8a', '#040712');
      drawMagicCircle(ctx, 140, 96, 66, '#fde047', 0.52);
      drawParticles(ctx, h, '#fde047', 28, 'sparks');
      ctx.save();
      // 皇室披风
      ctx.fillStyle = '#1e3a8a'; ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(82, 94); ctx.lineTo(198, 94); ctx.lineTo(212, 192); ctx.lineTo(68, 192); ctx.closePath(); ctx.fill(); ctx.stroke();
      // 黄金重铠与肩甲
      const gArm = ctx.createLinearGradient(110, 92, 170, 184);
      gArm.addColorStop(0, '#fef08a'); gArm.addColorStop(0.5, '#eab308'); gArm.addColorStop(1, '#78350f');
      ctx.fillStyle = gArm; ctx.fillRect(112, 94, 56, 88); ctx.strokeRect(112, 94, 56, 88);
      // 翼盔与巨剑
      ctx.fillStyle = '#e0f2fe'; ctx.beginPath(); ctx.arc(140, 70, 18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fde047';
      ctx.beginPath(); ctx.moveTo(122, 66); ctx.lineTo(100, 44); ctx.lineTo(126, 56); ctx.fill();
      ctx.beginPath(); ctx.moveTo(158, 66); ctx.lineTo(180, 44); ctx.lineTo(154, 56); ctx.fill();
      ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(200, 188); ctx.lineTo(200, 36); ctx.stroke();
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(186, 152); ctx.lineTo(214, 152); ctx.stroke();
      ctx.restore();
      return true;
    }

    if (name === '废弃邪殿') {
      fillSkyBg(ctx, '#4c1d95', '#1e1b4b', '#050811');
      drawMoon(ctx, 214, 46, 24, '#f43f5e', true);
      drawParticles(ctx, h, '#c084fc', 22, 'wisps');
      ctx.save();
      // 残破尖顶邪殿剪影
      ctx.fillStyle = '#1e1b4b'; ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(64, 184); ctx.lineTo(74, 92); ctx.lineTo(96, 98); ctx.lineTo(106, 62);
      ctx.lineTo(140, 38); ctx.lineTo(174, 62); ctx.lineTo(186, 102); ctx.lineTo(208, 90);
      ctx.lineTo(216, 184); ctx.closePath(); ctx.fill(); ctx.stroke();
      // 断裂石柱与裂纹
      ctx.fillStyle = '#312e81';
      ctx.fillRect(82, 108, 16, 76); ctx.strokeRect(82, 108, 16, 76);
      ctx.fillRect(182, 114, 16, 70); ctx.strokeRect(182, 114, 16, 70);
      // 猩红邪眼殿门
      const eG = ctx.createRadialGradient(140, 140, 4, 140, 140, 32);
      eG.addColorStop(0, '#fda4af'); eG.addColorStop(0.45, '#e11d48'); eG.addColorStop(1, '#4c0519');
      ctx.fillStyle = eG;
      ctx.beginPath(); ctx.arc(140, 144, 22, Math.PI, 0); ctx.lineTo(162, 184); ctx.lineTo(118, 184); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath(); ctx.ellipse(140, 138, 10, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#090d16';
      ctx.beginPath(); ctx.ellipse(140, 138, 2.5, 5, 0, 0, Math.PI * 2); ctx.fill();
      // 紫色诅咒锁链
      ctx.strokeStyle = '#d8b4fe'; ctx.lineWidth = 2.2; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(60, 74); ctx.quadraticCurveTo(140, 116, 220, 72); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      return true;
    }

    if (name === '蓄能炮手') {
      fillRadialBg(ctx, '#0284c7', '#1e1b4b', '#040814');
      drawMagicCircle(ctx, 140, 108, 66, '#38bdf8', 0.45);
      drawParticles(ctx, h, '#7dd3fc', 26, 'sparks');
      drawWingPair(ctx, 140, 102, 88, '#0ea5e9', '#bae6fd', 'mech');
      ctx.save();
      // 轻甲炮手躯干与披风
      ctx.fillStyle = '#0f172a'; ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(114, 102); ctx.lineTo(166, 102); ctx.lineTo(176, 182); ctx.lineTo(104, 182); ctx.closePath(); ctx.fill(); ctx.stroke();
      // 头部与战术护目镜
      ctx.fillStyle = '#fde68a'; ctx.beginPath(); ctx.arc(140, 76, 16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0284c7';
      ctx.beginPath(); ctx.arc(140, 71, 17, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#38bdf8'; ctx.strokeStyle = '#e0f2fe'; ctx.lineWidth = 1.8;
      ctx.fillRect(126, 71, 28, 8); ctx.strokeRect(126, 71, 28, 8);
      // 手持蓄能结晶重炮
      const gunG = ctx.createLinearGradient(132, 118, 224, 118);
      gunG.addColorStop(0, '#334155'); gunG.addColorStop(0.6, '#0284c7'); gunG.addColorStop(1, '#7dd3fc');
      ctx.fillStyle = gunG; ctx.strokeStyle = '#e0f2fe'; ctx.lineWidth = 2;
      ctx.fillRect(136, 112, 74, 18); ctx.strokeRect(136, 112, 74, 18);
      // 炮口蓄能结晶光球
      const orbG = ctx.createRadialGradient(218, 121, 2, 218, 121, 24);
      orbG.addColorStop(0, '#ffffff'); orbG.addColorStop(0.4, '#38bdf8'); orbG.addColorStop(1, 'rgba(56,189,248,0)');
      ctx.fillStyle = orbG; ctx.beginPath(); ctx.arc(218, 121, 24, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath(); ctx.moveTo(218, 105); ctx.lineTo(226, 121); ctx.lineTo(218, 137); ctx.lineTo(210, 121); ctx.closePath(); ctx.fill();
      ctx.restore();
      return true;
    }

    if (name === '宫殿守卫') {
      fillSkyBg(ctx, '#0284c7', '#1e3a8a', '#070b18');
      drawParticles(ctx, h, '#4ade80', 22, 'sparks');
      ctx.save();
      // 远景圣殿拱门剪影
      ctx.fillStyle = 'rgba(248,250,252,0.16)'; ctx.strokeStyle = 'rgba(251,191,36,0.45)'; ctx.lineWidth = 1.8;
      ctx.fillRect(68, 66, 144, 116); ctx.strokeRect(68, 66, 144, 116);
      // 白银重甲守卫
      const armG = ctx.createLinearGradient(112, 92, 168, 184);
      armG.addColorStop(0, '#f8fafc'); armG.addColorStop(0.55, '#94a3b8'); armG.addColorStop(1, '#334155');
      ctx.fillStyle = armG; ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2.2;
      ctx.fillRect(114, 94, 52, 88); ctx.strokeRect(114, 94, 52, 88);
      // 头盔与绿宝石羽饰
      ctx.fillStyle = '#e2e8f0'; ctx.beginPath(); ctx.arc(140, 72, 17, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#1e293b'; ctx.fillRect(130, 70, 20, 5);
      ctx.fillStyle = '#4ade80';
      ctx.beginPath(); ctx.moveTo(140, 55); ctx.quadraticCurveTo(156, 36, 166, 50); ctx.quadraticCurveTo(148, 56, 140, 55); ctx.fill();
      // 翡翠圣愈大盾
      ctx.fillStyle = '#1e293b'; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2.8;
      ctx.beginPath(); ctx.moveTo(86, 102); ctx.lineTo(132, 102); ctx.lineTo(128, 152); ctx.lineTo(109, 174); ctx.lineTo(90, 152); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(105, 116, 8, 32); ctx.fillRect(95, 128, 28, 8);
      // 右手银枪
      ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(188, 186); ctx.lineTo(188, 42); ctx.stroke();
      ctx.fillStyle = '#fde047';
      ctx.beginPath(); ctx.moveTo(188, 26); ctx.lineTo(196, 46); ctx.lineTo(180, 46); ctx.closePath(); ctx.fill();
      ctx.restore();
      return true;
    }

    if (name === '腐烂雾气') {
      fillRadialBg(ctx, '#15803d', '#064e3b', '#020617');
      drawParticles(ctx, h, '#4ade80', 32, 'wisps');
      ctx.save();
      // 翻涌的剧毒墨绿瘴气云团
      const fogs = [[82, 134, 44], [140, 122, 54], [198, 136, 42], [110, 156, 40], [172, 154, 42]];
      fogs.forEach(([fx, fy, fr], idx) => {
        const fg = ctx.createRadialGradient(fx, fy, 4, fx, fy, fr);
        fg.addColorStop(0, idx % 2 === 0 ? 'rgba(74,222,128,0.68)' : 'rgba(163,230,53,0.52)');
        fg.addColorStop(1, 'rgba(6,78,59,0)');
        ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(fx, fy, fr, 0, Math.PI * 2); ctx.fill();
      });
      // 毒雾中苏生的骷髅
      drawSkull(ctx, 108, 116, 0.62, { eyeCol: '#4ade80', flame: false });
      drawSkull(ctx, 174, 122, 0.56, { eyeCol: '#a3e635', flame: false });
      // 伸出毒雾的骨手
      ctx.strokeStyle = '#f1f5f9'; ctx.lineWidth = 4.2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(140, 178); ctx.lineTo(140, 134); ctx.stroke();
      [-12, -4, 4, 12].forEach(dx => {
        ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.moveTo(140, 136); ctx.lineTo(140 + dx, 116 - Math.abs(dx) * 0.4); ctx.stroke();
      });
      ctx.restore();
      return true;
    }

    if (name === '派对南瓜头') {
      fillSkyBg(ctx, '#581c87', '#31102f', '#070913');
      drawMoon(ctx, 62, 48, 24, '#fde047');
      drawParticles(ctx, h, '#f472b6', 24, 'sparks');
      drawMagicCircle(ctx, 140, 120, 68, '#fbbf24', 0.38);
      ctx.save();
      // 紫金派对礼服斗篷
      ctx.fillStyle = '#4c1d95'; ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(96, 126); ctx.lineTo(184, 126); ctx.lineTo(202, 188); ctx.lineTo(78, 188); ctx.closePath(); ctx.fill(); ctx.stroke();
      // 金色领结
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath(); ctx.moveTo(140, 136); ctx.lineTo(124, 128); ctx.lineTo(124, 144); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(140, 136); ctx.lineTo(156, 128); ctx.lineTo(156, 144); ctx.closePath(); ctx.fill();
      // 巨型南瓜头
      ctx.fillStyle = '#ea580c'; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.ellipse(140, 96, 38, 30, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath(); ctx.moveTo(118, 90); ctx.lineTo(130, 82); ctx.lineTo(131, 94); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(162, 90); ctx.lineTo(150, 82); ctx.lineTo(149, 94); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(140, 102, 18, 0.1, Math.PI - 0.1); ctx.fill();
      // 华丽派对高帽
      ctx.fillStyle = '#1e1b4b'; ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(140, 68, 42, 7, -0.1, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillRect(120, 34, 40, 32); ctx.strokeRect(120, 34, 40, 32);
      ctx.fillStyle = '#fbbf24'; ctx.fillRect(120, 56, 40, 6);
      // 两侧迷你伴舞骷髅小弟
      drawSkull(ctx, 68, 146, 0.42, { eyeCol: '#f472b6', flame: false });
      drawSkull(ctx, 212, 146, 0.42, { eyeCol: '#38bdf8', flame: false });
      ctx.restore();
      return true;
    }

    if (name === '狂暴女拳师') {
      fillRadialBg(ctx, '#e11d48', '#7f1d1d', '#09050c');
      drawMagicCircle(ctx, 140, 108, 66, '#fbbf24', 0.42);
      drawParticles(ctx, h, '#fb923c', 28, 'sparks');
      ctx.save();
      // 狂暴斗气冲击波
      ctx.strokeStyle = 'rgba(253,224,71,0.55)'; ctx.lineWidth = 3;
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        ctx.beginPath(); ctx.moveTo(140 + Math.cos(a)*26, 108 + Math.sin(a)*26);
        ctx.lineTo(140 + Math.cos(a)*82, 108 + Math.sin(a)*82); ctx.stroke();
      }
      // 劲装女拳师身姿与披肩
      ctx.fillStyle = '#9f1239'; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(116, 100); ctx.lineTo(164, 100); ctx.lineTo(172, 184); ctx.lineTo(108, 184); ctx.closePath(); ctx.fill(); ctx.stroke();
      // 头部与飘逸赤发
      ctx.fillStyle = '#fef3c7'; ctx.beginPath(); ctx.arc(140, 74, 15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath(); ctx.arc(140, 68, 17, Math.PI, 0); ctx.lineTo(164, 96); ctx.lineTo(116, 96); ctx.closePath(); ctx.fill();
      // 双手发光重型铁拳套
      const fistG = ctx.createRadialGradient(88, 118, 3, 88, 118, 22);
      fistG.addColorStop(0, '#fef08a'); fistG.addColorStop(0.5, '#f97316'); fistG.addColorStop(1, '#9f1239');
      ctx.fillStyle = fistG; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(88, 118, 18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(192, 118, 18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
      return true;
    }

    if (name === '疾驰魔将') {
      // 疾驰魔将 · 暗夜极速魔翼少女卡图
      fillSkyBg(ctx, '#4c1d95', '#1e1b4b', '#050811');
      drawParticles(ctx, h, '#38bdf8', 26, 'sparks');
      ctx.save();
      // 疾驰残影流光线条
      ctx.strokeStyle = 'rgba(56,189,248,0.48)'; ctx.lineWidth = 2.2;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath(); ctx.moveTo(24, 68 + i * 26); ctx.lineTo(92, 78 + i * 22); ctx.stroke();
      }
      ctx.restore();
      drawAnimeHeroine(ctx, {
        cx: 144, cy: 98,
        hairCol: '#cbd5e1', eyeCol: '#f43f5e', suitCol: '#1e1b4b', trimCol: '#fb7185',
        wingType: 'demon_wings', propType: 'dragon_lance', headgear: 'horns',
        hairStyle: 'wolf_cut', bangStyle: 'side_swept', faceShape: 'soft_oval', eyeStyle: 'sharp',
        bodyStyle: 'classic_armor', hairOrnament: 'crescent_pin', bodyOrnament: 'cape',
        auraCol: '#38bdf8', ahoge: 'lightning'
      });
      return true;
    }

    if (name === '苦痛监牢') {
      fillSkyBg(ctx, '#334155', '#1e1b4b', '#04060c');
      drawParticles(ctx, h, '#f43f5e', 20, 'wisps');
      ctx.save();
      // 铁牢栅栏
      ctx.strokeStyle = '#64748b'; ctx.lineWidth = 5;
      [76, 108, 172, 204].forEach(bx => {
        ctx.beginPath(); ctx.moveTo(bx, 34); ctx.lineTo(bx, 186); ctx.stroke();
      });
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(58, 56); ctx.lineTo(222, 56); ctx.moveTo(58, 166); ctx.lineTo(222, 166); ctx.stroke();
      // 中央悬浮滴血荆棘之心
      const hG = ctx.createRadialGradient(140, 108, 4, 140, 108, 34);
      hG.addColorStop(0, '#fda4af'); hG.addColorStop(0.5, '#e11d48'); hG.addColorStop(1, '#4c0519');
      ctx.fillStyle = hG; ctx.strokeStyle = '#fecdd3'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(140, 110, 24, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      // 锁链与卡牌剪影
      ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2.4; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(76, 82); ctx.lineTo(204, 138); ctx.moveTo(204, 82); ctx.lineTo(76, 138); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      return true;
    }

    if (name === '圣骑兵招募') {
      fillSkyBg(ctx, '#1e3a8a', '#0369a1', '#082f49');
      drawMagicCircle(ctx, 140, 110, 74, '#fde047', 0.52);
      drawParticles(ctx, h, '#fef08a', 26, 'stars');
      ctx.save();
      // 圣殿号角与金蓝战旗
      ctx.fillStyle = '#1d4ed8'; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(116, 40); ctx.lineTo(164, 40); ctx.lineTo(164, 152); ctx.lineTo(140, 172); ctx.lineTo(116, 152); ctx.closePath(); ctx.fill(); ctx.stroke();
      // 双重圣骑兵剪影
      [-46, 46].forEach(dx => {
        ctx.fillStyle = '#cbd5e1'; ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.arc(140 + dx, 108, 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(124 + dx, 122); ctx.lineTo(156 + dx, 122); ctx.lineTo(160 + dx, 182); ctx.lineTo(120 + dx, 182); ctx.closePath(); ctx.fill(); ctx.stroke();
      });
      // 中央金色圣盾徽章
      ctx.fillStyle = '#facc15'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(140, 68); ctx.lineTo(160, 82); ctx.lineTo(154, 120); ctx.lineTo(140, 134); ctx.lineTo(126, 120); ctx.lineTo(120, 82); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
      return true;
    }

    if (name === '刺枪白骑') {
      fillSkyBg(ctx, '#0f172a', '#1e3a8a', '#082f49');
      drawMagicCircle(ctx, 140, 108, 72, '#bae6fd', 0.42);
      drawParticles(ctx, h, '#e0f2fe', 22, 'sparks');
      drawAnimeHeroine(ctx, { hairCol: '#f8fafc', eyeCol: '#38bdf8', suitCol: '#e2e8f0', trimCol: '#facc15', propType: 'dragon_lance', headgear: 'halo', hairStyle: 'ponytail', bangStyle: 'side_swept', hairOrnament: 'feather', bodyOrnament: 'pauldrons' });
      ctx.save();
      // 右侧白银守护盾牌
      ctx.fillStyle = '#f1f5f9'; ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(188, 106); ctx.lineTo(214, 118); ctx.lineTo(208, 158); ctx.lineTo(188, 174); ctx.lineTo(168, 158); ctx.lineTo(162, 118); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
      return true;
    }

    if (name === '派对天使') {
      fillSkyBg(ctx, '#701a75', '#db2777', '#1e1b4b');
      drawParticles(ctx, h, '#fde047', 28, 'stars');
      drawParticles(ctx, h + 77, '#38bdf8', 20, 'sparks');
      drawWingPair(ctx, 140, 108, 92, '#ffffff', '#f9a8d4', 'angel');
      drawAnimeHeroine(ctx, { hairCol: '#fde047', eyeCol: '#ec4899', suitCol: '#f472b6', trimCol: '#fef08a', propType: 'mic', headgear: 'halo', hairStyle: 'twintails', bangStyle: 'parted', bodyStyle: 'maid_idol', hairOrnament: 'star_clips', bodyOrnament: 'choker', ahoge: 'heart', blush: true });
      ctx.save();
      // 飘落彩色派对彩带
      const cols = ['#fde047', '#38bdf8', '#4ade80', '#fb7185'];
      for (let i = 0; i < 8; i++) {
        ctx.strokeStyle = cols[i % cols.length]; ctx.lineWidth = 2.5;
        const sx = 38 + i * 28, sy = 36 + (i % 3) * 18;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(sx + 10, sy + 14, sx - 4, sy + 28); ctx.stroke();
      }
      ctx.restore();
      return true;
    }

    if (name === '战车') {
      // 塔罗牌 VII · 战车（星穹华盖 + 双轮 + 黑白双生守护兽 + 星冠少女御者）
      fillSkyBg(ctx, '#0f172a', '#1e3a8a', '#020617');
      drawMagicCircle(ctx, 140, 108, 84, '#facc15', 0.38);
      drawParticles(ctx, h, '#fde047', 24, 'stars');
      ctx.save();
      // 塔罗战车星幕华盖与双侧金色车轮
      ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2;
      ctx.strokeRect(56, 20, 168, 174);
      [62, 218].forEach(wx => {
        ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(wx, 150, 22, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(wx, 150, 7, 0, Math.PI * 2); ctx.stroke();
      });
      // 黑白双生狮首剪影（塔罗战车经典黑白双兽意象）
      [{ x: 64, fill: '#0f172a', stroke: '#94a3b8' }, { x: 216, fill: '#f8fafc', stroke: '#facc15' }].forEach(l => {
        ctx.fillStyle = l.fill; ctx.strokeStyle = l.stroke; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.arc(l.x, 168, 16, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      });
      ctx.restore();
      drawAnimeHeroine(ctx, {
        cx: 140, cy: 96,
        hairCol: '#bae6fd', eyeCol: '#facc15', suitCol: '#1e3a8a', trimCol: '#facc15',
        headgear: 'crown', propType: 'dragon_lance',
        hairStyle: 'half_up', bangStyle: 'parted', faceShape: 'classic', eyeStyle: 'starry',
        bodyStyle: 'classic_armor', hairOrnament: 'gold_pins', bodyOrnament: 'cape',
        auraCol: '#38bdf8'
      });
      return true;
    }

    if (name === '战车：觉醒') {
      // 塔罗牌 VII · 战车觉醒（炽金神威羽翼 + 燃烧星轮 + 觉醒少女御者）
      fillSkyBg(ctx, '#7f1d1d', '#b91c1c', '#090d16');
      drawMagicCircle(ctx, 140, 108, 88, '#fbbf24', 0.56);
      drawParticles(ctx, h, '#fde047', 30, 'stars');
      ctx.save();
      ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2.4;
      ctx.strokeRect(52, 18, 176, 178);
      [58, 222].forEach(wx => {
        ctx.beginPath(); ctx.arc(wx, 150, 24, 0, Math.PI * 2); ctx.stroke();
      });
      ctx.restore();
      drawAnimeHeroine(ctx, {
        cx: 140, cy: 96,
        hairCol: '#fef08a', eyeCol: '#ef4444', suitCol: '#991b1b', trimCol: '#fde047',
        wingType: 'angel_feather', headgear: 'crown', propType: 'greatsword',
        hairStyle: 'wavy', bangStyle: 'side_swept', faceShape: 'classic', eyeStyle: 'sharp',
        bodyStyle: 'classic_armor', hairOrnament: 'feather', bodyOrnament: 'gem_sash',
        auraCol: '#fbbf24', ahoge: 'lightning'
      });
      return true;
    }

    if (name === '士兵') {
      fillSkyBg(ctx, '#1e293b', '#334155', '#0f172a');
      drawParticles(ctx, h, '#94a3b8', 14, 'sparks');
      ctx.save();
      // 铁盔与胸甲
      ctx.fillStyle = '#64748b'; ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(114, 108); ctx.lineTo(166, 108); ctx.lineTo(174, 186); ctx.lineTo(106, 186); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(140, 78, 18, Math.PI, 0); ctx.lineTo(158, 98); ctx.lineTo(122, 98); ctx.closePath(); ctx.fill(); ctx.stroke();
      // 左手圆盾、右手长剑
      ctx.fillStyle = '#94a3b8'; ctx.beginPath(); ctx.arc(102, 140, 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(174, 154); ctx.lineTo(206, 62); ctx.stroke();
      ctx.restore();
      return true;
    }

    if (name === '圣枪重凯') {
      fillSkyBg(ctx, '#1e1b4b', '#0f172a', '#020617');
      drawMagicCircle(ctx, 140, 104, 78, '#facc15', 0.55);
      drawParticles(ctx, h, '#fde047', 24, 'stars');
      ctx.save();
      // 厚重黄金圣铠甲
      ctx.fillStyle = '#ca8a04'; ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 2.8;
      ctx.beginPath(); ctx.moveTo(96, 98); ctx.lineTo(184, 98); ctx.lineTo(196, 188); ctx.lineTo(84, 188); ctx.closePath(); ctx.fill(); ctx.stroke();
      // 巨型肩甲
      ctx.fillStyle = '#eab308';
      ctx.beginPath(); ctx.arc(96, 106, 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(184, 106, 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      // 圣骑士头盔与羽饰
      ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.arc(140, 70, 18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      // 贯通画面的黄金圣枪
      const lg = ctx.createLinearGradient(140, 18, 140, 198);
      lg.addColorStop(0, '#ffffff'); lg.addColorStop(0.4, '#fde047'); lg.addColorStop(1, '#b45309');
      ctx.fillStyle = lg;
      ctx.beginPath(); ctx.moveTo(208, 22); ctx.lineTo(216, 56); ctx.lineTo(202, 188); ctx.lineTo(196, 188); ctx.lineTo(200, 56); ctx.closePath(); ctx.fill();
      ctx.restore();
      return true;
    }

    if (name === '杂耍戏命师') {
      fillSkyBg(ctx, '#2e1065', '#4c1d95', '#090d16');
      drawParticles(ctx, h, '#c084fc', 22, 'wisps');
      ctx.save();
      // 诡谲礼帽与燕尾斗篷
      ctx.fillStyle = '#1e1b4b'; ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(106, 114); ctx.lineTo(174, 114); ctx.lineTo(192, 190); ctx.lineTo(88, 190); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.arc(140, 90, 16, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillRect(124, 52, 32, 26); ctx.strokeRect(124, 52, 32, 26);
      ctx.beginPath(); ctx.moveTo(114, 78); ctx.lineTo(166, 78); ctx.stroke();
      // 抛接中的三颗燃烧骷髅球
      ctx.strokeStyle = 'rgba(192,132,252,0.55)'; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.arc(140, 92, 64, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      drawSkull(ctx, 82, 74, 0.36, { glow: '#e879f9' });
      drawSkull(ctx, 140, 38, 0.38, { glow: '#38bdf8' });
      drawSkull(ctx, 198, 74, 0.36, { glow: '#f43f5e' });
      return true;
    }

    if (name === '律法具现者') {
      fillSkyBg(ctx, '#0f172a', '#1e3a8a', '#020617');
      drawMagicCircle(ctx, 140, 110, 82, '#fde047', 0.62);
      drawParticles(ctx, h, '#38bdf8', 26, 'stars');
      ctx.save();
      // 1-8 八枚环绕律法符文球
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const rx = 140 + Math.cos(ang) * 76;
        const ry = 110 + Math.sin(ang) * 66;
        ctx.fillStyle = i % 2 === 0 ? '#38bdf8' : '#facc15';
        ctx.beginPath(); ctx.arc(rx, ry, 5.5, 0, Math.PI * 2); ctx.fill();
      }
      // 律法圣体与黄金天平
      ctx.fillStyle = '#e2e8f0'; ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(118, 92); ctx.lineTo(162, 92); ctx.lineTo(176, 184); ctx.lineTo(104, 184); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fef08a'; ctx.beginPath(); ctx.arc(140, 68, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      // 横梁天平
      ctx.strokeStyle = '#fde047'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(86, 102); ctx.lineTo(194, 102); ctx.stroke();
      ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(86, 102); ctx.lineTo(74, 130); ctx.lineTo(98, 130); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(194, 102); ctx.lineTo(182, 130); ctx.lineTo(206, 130); ctx.closePath(); ctx.stroke();
      ctx.restore();
      return true;
    }

    if (name === '双炮神罚' || name === '结晶：双炮神罚') {
      fillRadialBg(ctx, '#0284c7', '#1e1b4b', '#020617', 140, 96);
      drawMagicCircle(ctx, 140, 98, 86, '#38bdf8', 0.52);
      drawParticles(ctx, h, '#fde047', 26, 'stars');
      if (name === '结晶：双炮神罚') {
        // 结晶形态：悬浮神圣蓝金双炮晶体护符
        ctx.save();
        ctx.fillStyle = 'rgba(56,189,248,0.28)'; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(140, 32); ctx.lineTo(186, 98); ctx.lineTo(140, 178); ctx.lineTo(94, 98);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(140, 48); ctx.lineTo(170, 98); ctx.lineTo(140, 160); ctx.lineTo(110, 98); ctx.closePath(); ctx.stroke();
        ctx.restore();
        return true;
      }
      // 随从形态：双侧悬浮神罚重炮 + 神圣武装少女
      ctx.save();
      [-1, 1].forEach(dir => {
        const px = 140 + dir * 74, py = 104;
        ctx.fillStyle = '#1e293b'; ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(px - 14, py - 26, 28, 52, 6) : ctx.rect(px - 14, py - 26, 28, 52);
        ctx.fill(); ctx.stroke();
        // 炮口充能光束
        const beamG = ctx.createRadialGradient(px, py - 26, 2, px, py - 26, 22);
        beamG.addColorStop(0, '#ffffff'); beamG.addColorStop(0.45, '#38bdf8'); beamG.addColorStop(1, 'rgba(56,189,248,0)');
        ctx.fillStyle = beamG;
        ctx.beginPath(); ctx.arc(px, py - 26, 22, 0, Math.PI * 2); ctx.fill();
      });
      ctx.restore();
      drawAnimeHeroine(ctx, {
        cx: 140, cy: 98,
        hairCol: '#bae6fd', eyeCol: '#fde047', suitCol: '#1e3a8a', trimCol: '#facc15',
        wingType: 'mecha_wings', propType: 'thorn_shield', headgear: 'halo',
        hairStyle: 'high_bun', bangStyle: 'parted', faceShape: 'classic', eyeStyle: 'sharp',
        bodyStyle: 'classic_armor', hairOrnament: 'gold_pins', bodyOrnament: 'pauldrons',
        auraCol: '#38bdf8'
      });
      return true;
    }

    if (name === '机械降神') {
      // 机械降神 · 神谕星盘机神少女卡图
      fillRadialBg(ctx, '#1e1b4b', '#0f172a', '#020617', 140, 96);
      drawMagicCircle(ctx, 140, 98, 92, '#facc15', 0.58);
      drawMagicCircle(ctx, 140, 98, 66, '#38bdf8', 0.48);
      drawParticles(ctx, h, '#fde047', 30, 'stars');
      drawAnimeHeroine(ctx, {
        cx: 140, cy: 98,
        hairCol: '#e0f2fe', eyeCol: '#facc15', suitCol: '#1e3a8a', trimCol: '#facc15',
        wingType: 'mecha_wings', propType: 'shepherd_staff', headgear: 'halo',
        hairStyle: 'wavy', bangStyle: 'parted', faceShape: 'soft_oval', eyeStyle: 'starry',
        bodyStyle: 'ballgown', hairOrnament: 'gold_pins', bodyOrnament: 'cyber_core',
        auraCol: '#38bdf8'
      });
      return true;
    }


    if (name === '重盾圣铠') {
      // 圣殿重甲巨盾，谢幕曲连续亡召 6/4/2 守护魂盾
      fillSkyBg(ctx, '#1e3a8a', '#0f172a', '#020617');
      drawMagicCircle(ctx, 140, 108, 78, '#facc15', 0.52);
      drawParticles(ctx, h, '#fde047', 26, 'stars');
      ctx.save();
      // 三道升腾的守护英灵虚影（对应亡召 6/4/2）
      [-58, 0, 58].forEach((dx, idx) => {
        ctx.fillStyle = 'rgba(186,230,253,0.22)'; ctx.strokeStyle = '#7dd3fc'; ctx.lineWidth = 1.6;
        const sy = 52 + (idx === 1 ? -10 : 8);
        ctx.beginPath(); ctx.moveTo(140 + dx, sy); ctx.lineTo(156 + dx, sy + 12); ctx.lineTo(150 + dx, sy + 38); ctx.lineTo(140 + dx, sy + 46); ctx.lineTo(130 + dx, sy + 38); ctx.lineTo(124 + dx, sy + 12); ctx.closePath(); ctx.fill(); ctx.stroke();
      });
      // 厚重黄金圣铠与双翼塔盾
      ctx.fillStyle = '#ca8a04'; ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(96, 98); ctx.lineTo(184, 98); ctx.lineTo(194, 192); ctx.lineTo(86, 192); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#eab308';
      ctx.beginPath(); ctx.arc(98, 104, 20, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(182, 104, 20, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.arc(140, 74, 16, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      // 前方巨型黄金守护塔盾
      const sg = ctx.createLinearGradient(104, 96, 176, 186);
      sg.addColorStop(0, '#fef08a'); sg.addColorStop(0.5, '#eab308'); sg.addColorStop(1, '#854d0e');
      ctx.fillStyle = sg; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.8;
      ctx.beginPath(); ctx.moveTo(140, 92); ctx.lineTo(176, 108); ctx.lineTo(168, 166); ctx.lineTo(140, 188); ctx.lineTo(112, 166); ctx.lineTo(104, 108); ctx.closePath(); ctx.fill(); ctx.stroke();
      // 盾心十字圣徽
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(140, 110); ctx.lineTo(140, 164); ctx.moveTo(120, 134); ctx.lineTo(160, 134); ctx.stroke();
      ctx.restore();
      return true;
    }

    if (name === '魔导机兵少女') {
      // 绯红双马尾魔导战姬 + 5枚浮游机械符文炮（5机械清场打4）
      fillSkyBg(ctx, '#4c0519', '#881337', '#090d16');
      drawMagicCircle(ctx, 140, 110, 74, '#fb7185', 0.55);
      drawParticles(ctx, h, '#fda4af', 28, 'sparks');
      drawAnimeHeroine(ctx, { hairCol: '#fb7185', eyeCol: '#fde047', suitCol: '#1e293b', trimCol: '#f43f5e', wingType: 'mecha_wings', propType: 'none', hairStyle: 'twintails', bangStyle: 'side_swept', hairOrnament: 'cyber_clips', bodyOrnament: 'cyber_core' });
      ctx.save();
      // 5枚环绕浮游魔导机兵炮台
      for (let i = 0; i < 5; i++) {
        const ang = -Math.PI * 0.85 + (i / 4) * Math.PI * 0.7;
        const fx = 140 + Math.cos(ang) * 86, fy = 112 + Math.sin(ang) * 68;
        ctx.fillStyle = '#334155'; ctx.strokeStyle = '#fb7185'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(fx - 10, fy - 7, 20, 14, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(fx, fy, 3.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      return true;
    }

    if (name === '刺盾少女' || name === '守护世界的女神官') {
      fillSkyBg(ctx, '#1e3a8a', '#0f172a', '#020617');
      drawMagicCircle(ctx, 140, 108, 76, '#fde047', 0.45);
      drawParticles(ctx, h, '#bae6fd', 22, 'stars');
      drawAnimeHeroine(ctx, name === '守护世界的女神官' ? {
        hairCol: '#fef08a', eyeCol: '#38bdf8', suitCol: '#f8fafc', trimCol: '#facc15',
        propType: 'shepherd_staff', headgear: 'halo', wingType: 'angel_feather',
        hairStyle: 'braids', bangStyle: 'parted', bodyStyle: 'slim_robe', hairOrnament: 'feather', bodyOrnament: 'cross_necklace'
      } : {
        hairCol: '#f472b6', eyeCol: '#4ade80', suitCol: '#334155', trimCol: '#4ade80',
        propType: 'thorn_shield', hairStyle: 'bob', bangStyle: 'classic', bodyStyle: 'classic_armor',
        hairOrnament: 'rose', bodyOrnament: 'pauldrons'
      });
      return true;
    }

    if (name === '孵化万物的龙女') {
      fillSkyBg(ctx, '#451a03', '#7c2d12', '#090d16');
      drawParticles(ctx, h, '#fbbf24', 24, 'stars');
      drawAnimeHeroine(ctx, {
        hairCol: '#fb923c', eyeCol: '#fde047', suitCol: '#fef3c7', trimCol: '#f59e0b',
        headgear: 'horns', hairStyle: 'wavy', bangStyle: 'hime_cut', bodyStyle: 'ballgown',
        hairOrnament: 'gold_pins', bodyOrnament: 'cape'
      });
      ctx.save();
      [-64, -22, 22, 64].forEach((dx) => {
        const ey = 162, rx = 16, ry = 22;
        const eg = ctx.createRadialGradient(140 + dx - 4, ey - 6, 3, 140 + dx, ey, ry);
        eg.addColorStop(0, '#fef08a'); eg.addColorStop(0.55, '#ea580c'); eg.addColorStop(1, '#7c2d12');
        ctx.fillStyle = eg; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(140 + dx, ey, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      });
      ctx.restore();
      return true;
    }

    if (name === '雏龙搭档') {
      fillSkyBg(ctx, '#7c2d12', '#1e293b', '#050811');
      drawParticles(ctx, h, '#fbbf24', 22, 'stars');
      drawAnimeHeroine(ctx, {
        cx: 126, cy: 96,
        hairCol: '#fde047', eyeCol: '#38bdf8', suitCol: '#ea580c', trimCol: '#fef08a',
        hairStyle: 'ponytail', bangStyle: 'side_swept', bodyStyle: 'cape_cloak',
        hairOrnament: 'feather', bodyOrnament: 'fur_collar', ahoge: 'double', blush: true
      });
      ctx.save();
      // 肩旁乖巧小红雏龙
      ctx.fillStyle = '#dc2626'; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(196, 108, 18, 22, 0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(194, 82, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(198, 80, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      return true;
    }

    // ========================================================================
    // v60 商业化补全：33 张早期经典卡牌高精度手绘级矢量插画（全卡池 216/216 100% 覆盖）
    // ========================================================================
    const _cid = cardData.id || '';
    const _nm = cardData.name || '';

    // 辅助：机械能量核心与装甲板
    function _drawMechCore(x, y, r, col1, col2) {
      ctx.save();
      const g = ctx.createRadialGradient(x, y, 1, x, y, r);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, col1); g.addColorStop(1, col2);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x, y, r * 0.72, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    function _drawGear(x, y, r, teeth, col, rot = 0) {
      ctx.save();
      ctx.translate(x, y); ctx.rotate(rot);
      ctx.fillStyle = col; ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let i = 0; i < teeth * 2; i++) {
        const ang = (i * Math.PI) / teeth;
        const rad = i % 2 === 0 ? r : r * 0.76;
        const px = Math.cos(ang) * rad, py = Math.sin(ang) * rad;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#0b1120'; ctx.beginPath(); ctx.arc(0, 0, r * 0.34, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    function _drawDragonEgg(x, y, rx, ry, shell1, shell2, crackCol) {
      ctx.save();
      const g = ctx.createRadialGradient(x - rx * 0.3, y - ry * 0.3, 4, x, y, ry * 1.15);
      g.addColorStop(0, shell1); g.addColorStop(0.7, shell2); g.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = g; ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      // 龙鳞斑纹
      ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1.4;
      for (let row = -1; row <= 1; row++) {
        ctx.beginPath();
        ctx.arc(x - rx * 0.25, y + row * 18, 12, 0.2, Math.PI - 0.2);
        ctx.arc(x + rx * 0.22, y + row * 18 + 6, 11, 0.2, Math.PI - 0.2);
        ctx.stroke();
      }
      // 发光裂纹
      if (crackCol) {
        ctx.strokeStyle = crackCol; ctx.lineWidth = 2.4; ctx.shadowColor = crackCol; ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(x - 16, y - 14); ctx.lineTo(x - 2, y - 2); ctx.lineTo(x + 12, y - 10); ctx.lineTo(x + 22, y + 4);
        ctx.moveTo(x - 2, y - 2); ctx.lineTo(x - 8, y + 14);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 1. 高性能引擎机甲
    if (_cid === 'cmwas0lke5oiw' || _nm === '高性能引擎机甲') {
      fillRadialBg(ctx, '#0284c7', '#1e3a8a', '#020617', 140, 95);
      _drawGear(52, 62, 30, 10, '#1e293b', 0.2); _drawGear(232, 152, 34, 12, '#1e293b', 0.5);
      ctx.save();
      // 涡轮双翼推进器
      ctx.fillStyle = '#38bdf8'; ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.moveTo(42, 74); ctx.lineTo(92, 92); ctx.lineTo(66, 124); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(238, 74); ctx.lineTo(188, 92); ctx.lineTo(214, 124); ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0;
      // 机甲厚重躯干与肩甲
      ctx.fillStyle = '#475569'; ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.roundRect(92, 78, 96, 98, 12); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.roundRect(66, 68, 38, 46, 8); ctx.roundRect(176, 68, 38, 46, 8); ctx.fill(); ctx.stroke();
      // 头部护目镜
      ctx.fillStyle = '#334155'; ctx.beginPath(); ctx.roundRect(114, 42, 52, 38, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#22d3ee'; ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 12;
      ctx.fillRect(122, 54, 36, 10);
      ctx.restore();
      _drawMechCore(140, 122, 22, '#38bdf8', '#0369a1');
      return true;
    }

    // 2. 被献祭的松鼠
    if (_cid === 'cmwata95yc8j5' || _nm === '被献祭的松鼠') {
      fillRadialBg(ctx, '#451a03', '#292524', '#0c0a09', 140, 105);
      ctx.save();
      // 祭坛微光法阵
      ctx.strokeStyle = 'rgba(244,63,94,0.45)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(140, 178, 86, 20, 0, 0, Math.PI * 2); ctx.stroke();
      // 蓬松大尾巴
      ctx.fillStyle = '#b45309'; ctx.strokeStyle = '#451a03'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(154, 154); ctx.bezierCurveTo(222, 146, 226, 62, 168, 56); ctx.bezierCurveTo(148, 54, 144, 86, 164, 98); ctx.bezierCurveTo(182, 110, 166, 134, 148, 142); ctx.closePath(); ctx.fill(); ctx.stroke();
      // 身体与肚皮
      ctx.fillStyle = '#d97706'; ctx.beginPath(); ctx.ellipse(128, 142, 30, 36, -0.15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fef3c7'; ctx.beginPath(); ctx.ellipse(118, 146, 16, 24, -0.1, 0, Math.PI * 2); ctx.fill();
      // 头部与尖耳
      ctx.fillStyle = '#d97706'; ctx.beginPath(); ctx.arc(120, 96, 24, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(106, 78); ctx.lineTo(102, 56); ctx.lineTo(118, 72); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(126, 74); ctx.lineTo(136, 54); ctx.lineTo(140, 78); ctx.closePath(); ctx.fill(); ctx.stroke();
      // 水灵大眼（略带惶恐）
      ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.arc(110, 94, 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(108, 92, 2, 0, Math.PI * 2); ctx.fill();
      // 怀抱橡果
      ctx.fillStyle = '#92400e'; ctx.beginPath(); ctx.ellipse(98, 136, 10, 12, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#451a03'; ctx.beginPath(); ctx.arc(100, 127, 10, Math.PI, Math.PI * 2); ctx.fill();
      ctx.restore();
      return true;
    }

    // 3. 通用载人机甲
    if (_cid === 'cmwbvfqe5en3l' || _nm === '通用载人机甲') {
      fillRadialBg(ctx, '#334155', '#1e293b', '#020617', 140, 95);
      ctx.save();
      // 工业黄灰机体
      ctx.fillStyle = '#64748b'; ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.roundRect(86, 62, 108, 92, 16); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#eab308'; ctx.fillRect(86, 132, 108, 14);
      // 透明驾驶舱与驾驶员剪影
      const g = ctx.createLinearGradient(104, 72, 176, 126);
      g.addColorStop(0, '#7dd3fc'); g.addColorStop(1, '#0284c7');
      ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(102, 74, 76, 48, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(15,23,42,0.75)';
      ctx.beginPath(); ctx.arc(140, 95, 11, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.roundRect(126, 106, 28, 16, 6); ctx.fill();
      // 双机械臂
      ctx.fillStyle = '#475569'; ctx.beginPath(); ctx.roundRect(52, 82, 30, 68, 8); ctx.roundRect(198, 82, 30, 68, 8); ctx.fill(); ctx.stroke();
      ctx.restore();
      return true;
    }

    // 4. 铁皮打手
    if (_cid === 'cmwbvnpfgwo7a' || _nm === '铁皮打手') {
      fillRadialBg(ctx, '#7c2d12', '#1c1917', '#09090b', 140, 100);
      ctx.save();
      // 粗壮铁拳机体
      ctx.fillStyle = '#57534e'; ctx.strokeStyle = '#1c1917'; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.roundRect(96, 68, 88, 100, 12); ctx.fill(); ctx.stroke();
      // 铆钉与红眼
      ctx.fillStyle = '#292524'; ctx.beginPath(); ctx.roundRect(114, 42, 52, 32, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ef4444'; ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(130, 58, 5, 0, Math.PI * 2); ctx.arc(150, 58, 5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      // 巨型液压重拳
      ctx.fillStyle = '#78716c';
      ctx.beginPath(); ctx.roundRect(38, 96, 52, 60, 12); ctx.roundRect(190, 96, 52, 60, 12); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f59e0b'; ctx.fillRect(42, 134, 44, 10); ctx.fillRect(194, 134, 44, 10);
      ctx.restore();
      return true;
    }

    // 5. 碎甲刃机
    if (_cid === 'cmwbwda72g49w' || _nm === '碎甲刃机') {
      fillRadialBg(ctx, '#0f766e', '#0f172a', '#020617', 140, 100);
      ctx.save();
      // 交叉高周波光刃
      ctx.fillStyle = '#2dd4bf'; ctx.shadowColor = '#2dd4bf'; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.moveTo(28, 44); ctx.lineTo(132, 136); ctx.lineTo(116, 148); ctx.lineTo(20, 62); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(252, 44); ctx.lineTo(148, 136); ctx.lineTo(164, 148); ctx.lineTo(260, 62); ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0;
      // 疾速流线机身
      ctx.fillStyle = '#1e293b'; ctx.strokeStyle = '#5eead4'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(140, 46); ctx.lineTo(176, 112); ctx.lineTo(140, 174); ctx.lineTo(104, 112); ctx.closePath(); ctx.fill(); ctx.stroke();
      _drawMechCore(140, 106, 14, '#5eead4', '#0f766e');
      ctx.restore();
      return true;
    }

    // 6. 飞轮信使
    if (_cid === 'cmwbwg3kwqfkq' || _nm === '飞轮信使') {
      fillRadialBg(ctx, '#0369a1', '#0f172a', '#020617', 140, 100);
      ctx.save();
      // 高速旋转单轮与速度线
      ctx.strokeStyle = 'rgba(56,189,248,0.45)'; ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(18, 56 + i * 24); ctx.lineTo(86, 56 + i * 24); ctx.stroke(); }
      _drawGear(140, 142, 42, 12, '#38bdf8', 0.4);
      ctx.fillStyle = '#e2e8f0'; ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.roundRect(114, 58, 52, 56, 14); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#38bdf8'; ctx.fillRect(124, 72, 32, 12);
      ctx.restore();
      return true;
    }

    // 7. 电子羊
    if (_cid === 'cmwby0dy7g2pc' || _nm === '电子羊') {
      fillRadialBg(ctx, '#1e3a8a', '#0f172a', '#020617', 140, 105);
      ctx.save();
      // 电路光环羊毛团
      ctx.fillStyle = '#e0f2fe'; ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2.2;
      const puffs = [[116,114,24],[144,104,28],[170,116,24],[130,136,24],[158,136,24]];
      puffs.forEach(([x,y,r]) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); });
      // 机械羊头与发光屏眼
      ctx.fillStyle = '#1e293b'; ctx.strokeStyle = '#7dd3fc'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(92, 114, 24, 20, -0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#22d3ee'; ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 10;
      ctx.fillRect(78, 108, 18, 6);
      ctx.shadowBlur = 0;
      // 机械四腿
      ctx.fillStyle = '#475569'; ctx.fillRect(114, 154, 10, 28); ctx.fillRect(156, 154, 10, 28);
      ctx.restore();
      return true;
    }

    // 8. 增殖机甲
    if (_cid === 'cmwbyhrbei4w8' || _nm === '增殖机甲') {
      fillRadialBg(ctx, '#065f46', '#0f172a', '#020617', 140, 105);
      ctx.save();
      // 三个错落复制体
      [[78, 124, 0.72, 0.65], [202, 124, 0.72, 0.65], [140, 112, 1, 1]].forEach(([cx, cy, sc, al]) => {
        ctx.save(); ctx.globalAlpha = al; ctx.translate(cx, cy); ctx.scale(sc, sc);
        ctx.fillStyle = '#334155'; ctx.strokeStyle = '#34d399'; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.roundRect(-28, -32, 56, 66, 10); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#10b981'; ctx.beginPath(); ctx.arc(0, -10, 11, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });
      ctx.restore();
      return true;
    }

    // 9. 摇滚骷髅吉他手
    if (_cid === 'cmwbyp6f419ju' || _nm === '摇滚骷髅吉他手') {
      fillRadialBg(ctx, '#7e22ce', '#3b0764', '#09090b', 140, 95);
      ctx.save();
      // 舞台闪电光束
      ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 3; ctx.shadowColor = '#f43f5e'; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.moveTo(46, 26); ctx.lineTo(74, 72); ctx.lineTo(58, 76); ctx.lineTo(86, 120); ctx.stroke();
      ctx.shadowBlur = 0;
      // 骷髅头与莫西干紫发
      ctx.fillStyle = '#c084fc';
      ctx.beginPath(); ctx.moveTo(126, 48); ctx.lineTo(140, 22); ctx.lineTo(154, 48); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f8fafc'; ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.arc(140, 68, 24, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.arc(131, 66, 6, 0, Math.PI * 2); ctx.arc(149, 66, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f43f5e'; ctx.beginPath(); ctx.arc(131, 66, 2.5, 0, Math.PI * 2); ctx.arc(149, 66, 2.5, 0, Math.PI * 2); ctx.fill();
      // 飞V电吉他
      ctx.fillStyle = '#e11d48'; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(64, 152); ctx.lineTo(188, 96); ctx.lineTo(212, 128); ctx.lineTo(126, 174); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(160, 118); ctx.lineTo(228, 72); ctx.stroke();
      ctx.restore();
      return true;
    }

    // 10. 骸骨巨人
    if (_cid === 'cmwbz08a6fv59' || _nm === '骸骨巨人') {
      fillRadialBg(ctx, '#4c1d95', '#1e1b4b', '#020617', 140, 95);
      ctx.save();
      // 巨型肋骨胸腔与冥火核心
      ctx.fillStyle = '#e2e8f0'; ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.roundRect(72, 74, 136, 108, 22); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#312e81'; ctx.beginPath(); ctx.roundRect(96, 94, 88, 68, 12); ctx.fill();
      ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 6;
      for (let y = 104; y <= 152; y += 16) { ctx.beginPath(); ctx.moveTo(92, y); ctx.lineTo(188, y); ctx.stroke(); }
      _drawMechCore(140, 128, 18, '#a855f7', '#4c1d95');
      // 骷髅巨首
      ctx.fillStyle = '#f1f5f9'; ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.arc(140, 56, 28, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#a855f7'; ctx.shadowColor = '#a855f7'; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(128, 54, 6, 0, Math.PI * 2); ctx.arc(152, 54, 6, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      return true;
    }

    // 11. 血偿者
    if (_cid === 'cmwc0t61ade7b' || _nm === '血偿者') {
      fillRadialBg(ctx, '#881337', '#2e1065', '#09090b', 140, 100);
      ctx.save();
      // 血月与猩红斗篷剪影
      ctx.fillStyle = '#e11d48'; ctx.shadowColor = '#e11d48'; ctx.shadowBlur = 22;
      ctx.beginPath(); ctx.arc(140, 74, 42, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = '#0f172a'; ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(140, 52); ctx.lineTo(192, 184); ctx.lineTo(88, 184); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fda4af'; ctx.beginPath(); ctx.arc(132, 86, 3.5, 0, Math.PI * 2); ctx.arc(148, 86, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      return true;
    }

    // 12. 装甲堡垒
    if (_cid === 'cmwc2n4p68ewm' || _nm === '装甲堡垒') {
      fillRadialBg(ctx, '#1e40af', '#0f172a', '#020617', 140, 105);
      ctx.save();
      // 钢铁盾墙要塞
      ctx.fillStyle = '#475569'; ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(56, 56); ctx.lineTo(224, 56); ctx.lineTo(212, 166); ctx.lineTo(140, 192); ctx.lineTo(68, 166); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.moveTo(76, 74); ctx.lineTo(204, 74); ctx.lineTo(194, 154); ctx.lineTo(140, 174); ctx.lineTo(86, 154); ctx.closePath(); ctx.fill();
      _drawMechCore(140, 118, 22, '#60a5fa', '#1d4ed8');
      ctx.restore();
      return true;
    }

    // 13. 铜壳瓢虫
    if (_cid === 'cmwc2wbcgbqvl' || _nm === '铜壳瓢虫') {
      fillRadialBg(ctx, '#92400e', '#451a03', '#0c0a09', 140, 105);
      ctx.save();
      // 黄铜机械甲壳
      const g = ctx.createRadialGradient(126, 98, 10, 140, 120, 62);
      g.addColorStop(0, '#fcd34d'); g.addColorStop(0.6, '#b45309'); g.addColorStop(1, '#451a03');
      ctx.fillStyle = g; ctx.strokeStyle = '#1c1917'; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.ellipse(140, 124, 56, 48, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(140, 76); ctx.lineTo(140, 172); ctx.stroke();
      ctx.fillStyle = '#1c1917';
      [[114,108],[166,108],[108,136],[172,136]].forEach(([x,y]) => { ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill(); });
      ctx.beginPath(); ctx.arc(140, 72, 20, Math.PI, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#22d3ee'; ctx.beginPath(); ctx.arc(132, 68, 3.5, 0, Math.PI * 2); ctx.arc(148, 68, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      return true;
    }

    // 14. 超载机皇
    if (_cid === 'cmwc3gozg0rat' || _nm === '超载机皇') {
      fillRadialBg(ctx, '#b91c1c', '#1e1b4b', '#020617', 140, 90);
      ctx.save();
      // 过载闪电与皇冠天线
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3; ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.moveTo(108, 46); ctx.lineTo(122, 18); ctx.lineTo(140, 40); ctx.lineTo(158, 18); ctx.lineTo(172, 46); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#334155'; ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.roundRect(74, 70, 132, 108, 16); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.roundRect(108, 44, 64, 34, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ef4444'; ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 14; ctx.fillRect(118, 56, 44, 10); ctx.shadowBlur = 0;
      _drawMechCore(140, 126, 26, '#fbbf24', '#dc2626');
      ctx.restore();
      return true;
    }

    // 15. 万齿战车
    if (_cid === 'cmwc3or2zf7ft' || _nm === '万齿战车') {
      fillRadialBg(ctx, '#b45309', '#1e293b', '#020617', 140, 110);
      _drawGear(86, 148, 36, 12, '#94a3b8', 0.2);
      _drawGear(146, 148, 36, 12, '#94a3b8', 0.5);
      _drawGear(202, 148, 32, 10, '#94a3b8', 0.8);
      ctx.save();
      ctx.fillStyle = '#475569'; ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(46, 136); ctx.lineTo(74, 68); ctx.lineTo(212, 68); ctx.lineTo(244, 136); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f59e0b'; ctx.fillRect(190, 82, 56, 16);
      _drawMechCore(134, 102, 18, '#fbbf24', '#b45309');
      ctx.restore();
      return true;
    }

    // 16. 尸兵
    if (_cid === 'cmwc97xb64vc6' || _nm === '尸兵') {
      fillRadialBg(ctx, '#14532d', '#1e1b4b', '#020617', 140, 100);
      ctx.save();
      ctx.fillStyle = '#4d7c0f'; ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.roundRect(102, 92, 76, 86, 14); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(140, 68, 24, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      // 破旧铁盔与长矛
      ctx.fillStyle = '#475569'; ctx.beginPath(); ctx.arc(140, 62, 26, Math.PI, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#a3e635'; ctx.beginPath(); ctx.arc(131, 70, 4, 0, Math.PI * 2); ctx.arc(149, 70, 4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(202, 34); ctx.lineTo(186, 182); ctx.stroke();
      ctx.restore();
      return true;
    }

    // 17. 神圣法典
    if (_cid === 'cmwcah8st1lar' || _nm === '神圣法典') {
      fillRadialBg(ctx, '#f59e0b', '#78350f', '#0c0a09', 140, 100);
      ctx.save();
      ctx.fillStyle = '#fef3c7'; ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 3;
      ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.roundRect(82, 46, 116, 134, 10); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#d97706'; ctx.fillRect(134, 72, 12, 82); ctx.fillRect(106, 98, 68, 12);
      ctx.restore();
      return true;
    }

    // 18. 烟消云散
    if (_cid === 'cmwcalky6itcu' || _nm === '烟消云散') {
      fillRadialBg(ctx, '#4338ca', '#1e1b4b', '#020617', 140, 100);
      ctx.save();
      for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = `rgba(196,181,253,${0.7 - i * 0.12})`; ctx.lineWidth = 5 - i * 0.7;
        ctx.beginPath(); ctx.arc(140, 110, 18 + i * 16, i * 0.6, i * 0.6 + Math.PI * 1.35); ctx.stroke();
      }
      _drawMechCore(140, 110, 14, '#e0e7ff', '#6366f1');
      ctx.restore();
      return true;
    }

    // 19. 转生苹果
    if (_cid === 'cmwcaqbzuvvcx' || _nm === '转生苹果') {
      fillRadialBg(ctx, '#065f46', '#1e1b4b', '#020617', 140, 105);
      ctx.save();
      const g = ctx.createRadialGradient(124, 96, 8, 140, 118, 52);
      g.addColorStop(0, '#fca5a5'); g.addColorStop(0.55, '#dc2626'); g.addColorStop(1, '#7f1d1d');
      ctx.fillStyle = g; ctx.shadowColor = '#34d399'; ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.arc(124, 122, 34, 0, Math.PI * 2); ctx.arc(156, 122, 34, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#78350f'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(140, 92); ctx.quadraticCurveTo(146, 68, 158, 60); ctx.stroke();
      ctx.fillStyle = '#34d399'; ctx.beginPath(); ctx.ellipse(164, 74, 18, 9, -0.4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      return true;
    }

    // 20. 连锁飞刃
    if (_cid === 'cmwcb1izpxl7e' || _nm === '连锁飞刃') {
      fillRadialBg(ctx, '#0e7490', '#0f172a', '#020617', 140, 100);
      ctx.save();
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2.5; ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 10;
      [[64, 72, 0.3], [140, 108, -0.2], [214, 142, 0.4]].forEach(([x, y, a]) => {
        ctx.save(); ctx.translate(x, y); ctx.rotate(a);
        ctx.fillStyle = '#e0f2fe';
        ctx.beginPath(); ctx.moveTo(-36, 0); ctx.lineTo(0, -10); ctx.lineTo(38, 0); ctx.lineTo(0, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      });
      ctx.restore();
      return true;
    }

    // 21. 炽炎之术
    if (_cid === 'cmwcba1blx523' || _nm === '炽炎之术') {
      fillRadialBg(ctx, '#ea580c', '#7c2d12', '#09090b', 140, 105);
      ctx.save();
      const g = ctx.createRadialGradient(140, 124, 6, 140, 114, 64);
      g.addColorStop(0, '#fef08a'); g.addColorStop(0.5, '#f97316'); g.addColorStop(1, '#dc2626');
      ctx.fillStyle = g; ctx.shadowColor = '#f97316'; ctx.shadowBlur = 22;
      ctx.beginPath(); ctx.moveTo(140, 34); ctx.bezierCurveTo(204, 92, 198, 174, 140, 178); ctx.bezierCurveTo(82, 174, 76, 92, 140, 34); ctx.fill();
      ctx.restore();
      return true;
    }

    // 22. 随机应变
    if (_cid === 'cmwd6zdfog6ux' || _nm === '随机应变') {
      fillRadialBg(ctx, '#4f46e5', '#0f172a', '#020617', 140, 100);
      ctx.save();
      // 命运双骰与流光轨迹
      ctx.fillStyle = '#f8fafc'; ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.roundRect(74, 66, 56, 56, 10); ctx.roundRect(148, 102, 56, 56, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#4f46e5';
      [[90,82],[114,106],[102,94],[164,118],[188,118],[164,142],[188,142]].forEach(([x,y]) => { ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill(); });
      ctx.restore();
      return true;
    }

    // 23. 废物利用
    if (_cid === 'cmwdi4pwz3c0k' || _nm === '废物利用') {
      fillRadialBg(ctx, '#0f766e', '#1e293b', '#020617', 140, 105);
      _drawGear(96, 134, 28, 10, '#64748b', 0.3);
      _drawGear(184, 134, 26, 9, '#64748b', 0.7);
      ctx.save();
      ctx.strokeStyle = '#34d399'; ctx.lineWidth = 5; ctx.shadowColor = '#34d399'; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(140, 106, 46, 0.2, Math.PI * 1.75); ctx.stroke();
      _drawMechCore(140, 106, 18, '#6ee7b7', '#059669');
      ctx.restore();
      return true;
    }

    // 24. 雏龙的蛋
    if (_cid === 'cmwdtm73fwg1u' || _nm === '雏龙的蛋') {
      fillRadialBg(ctx, '#9a3412', '#292524', '#0c0a09', 140, 105);
      _drawDragonEgg(140, 118, 44, 56, '#fde68a', '#d97706', '#fbbf24');
      return true;
    }

    // 25. 快速孵化
    if (_cid === 'cmwdvhcrr8g9v' || _nm === '快速孵化') {
      fillRadialBg(ctx, '#ea580c', '#431407', '#09090b', 140, 100);
      _drawDragonEgg(140, 122, 42, 52, '#fef08a', '#ea580c', '#ffffff');
      ctx.save();
      ctx.strokeStyle = '#fde047'; ctx.lineWidth = 3; ctx.shadowColor = '#fde047'; ctx.shadowBlur = 14;
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        ctx.beginPath(); ctx.moveTo(140 + Math.cos(a) * 54, 118 + Math.sin(a) * 54);
        ctx.lineTo(140 + Math.cos(a) * 76, 118 + Math.sin(a) * 76); ctx.stroke();
      }
      ctx.restore();
      return true;
    }

    // 26. 丢失的龙蛋
    if (_cid === 'cmwdvmwjm0301' || _nm === '丢失的龙蛋') {
      fillRadialBg(ctx, '#1e3a8a', '#0f172a', '#020617', 140, 105);
      _drawDragonEgg(140, 124, 42, 54, '#bae6fd', '#0284c7', '#38bdf8');
      ctx.save();
      ctx.strokeStyle = 'rgba(148,163,184,0.45)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(64, 174); ctx.quadraticCurveTo(140, 192, 216, 174); ctx.stroke();
      ctx.restore();
      return true;
    }

    // 27. 孵化装置
    if (_cid === 'cmwdvrwfcy5gg' || _nm === '孵化装置') {
      fillRadialBg(ctx, '#0369a1', '#1e293b', '#020617', 140, 105);
      ctx.save();
      ctx.fillStyle = 'rgba(56,189,248,0.18)'; ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(78, 42, 124, 134, 18); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#334155'; ctx.fillRect(68, 34, 144, 18); ctx.fillRect(68, 166, 144, 20);
      ctx.restore();
      _drawDragonEgg(140, 112, 32, 42, '#fde68a', '#f59e0b', '#38bdf8');
      return true;
    }

    // 28. 鞭策
    if (_cid === 'cmwdw1gnfmjtt' || _nm === '鞭策') {
      fillRadialBg(ctx, '#991b1b', '#27272a', '#09090b', 140, 100);
      ctx.save();
      ctx.strokeStyle = '#f97316'; ctx.lineWidth = 6; ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.moveTo(44, 164); ctx.bezierCurveTo(96, 48, 192, 168, 236, 48); ctx.stroke();
      ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(44, 164); ctx.bezierCurveTo(96, 48, 192, 168, 236, 48); ctx.stroke();
      ctx.restore();
      return true;
    }

    // 29. 飞龙峡谷
    if (_cid === 'cmwdxmxskfby0' || _nm === '飞龙峡谷') {
      fillRadialBg(ctx, '#f59e0b', '#7c2d12', '#1c1917', 140, 82);
      ctx.save();
      // 左右赤岩绝壁
      ctx.fillStyle = '#451a03';
      ctx.beginPath(); ctx.moveTo(0, 62); ctx.lineTo(94, 96); ctx.lineTo(66, 200); ctx.lineTo(0, 200); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(280, 56); ctx.lineTo(184, 96); ctx.lineTo(212, 200); ctx.lineTo(280, 200); ctx.closePath(); ctx.fill();
      // 翱翔飞龙剪影
      ctx.fillStyle = '#0f172a';
      ctx.beginPath(); ctx.moveTo(140, 74); ctx.lineTo(92, 54); ctx.lineTo(122, 86); ctx.lineTo(140, 102); ctx.lineTo(158, 86); ctx.lineTo(188, 54); ctx.closePath(); ctx.fill();
      ctx.restore();
      return true;
    }

    // 30. 八岐大蛇
    if (_cid === 'cmwdxt4vgtk9g' || _nm === '八岐大蛇') {
      fillRadialBg(ctx, '#581c87', '#1e1b4b', '#020617', 140, 95);
      ctx.save();
      const heads = [[54,84],[82,58],[114,44],[140,38],[166,44],[198,58],[226,84],[140,94]];
      heads.forEach(([hx, hy], idx) => {
        ctx.strokeStyle = idx % 2 === 0 ? '#7c3aed' : '#4c1d95'; ctx.lineWidth = 10;
        ctx.beginPath(); ctx.moveTo(140, 192); ctx.quadraticCurveTo((140 + hx) / 2, 130, hx, hy); ctx.stroke();
        ctx.fillStyle = '#a855f7'; ctx.beginPath(); ctx.ellipse(hx, hy, 12, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f43f5e'; ctx.beginPath(); ctx.arc(hx - 3, hy - 1, 2.2, 0, Math.PI * 2); ctx.arc(hx + 3, hy - 1, 2.2, 0, Math.PI * 2); ctx.fill();
      });
      ctx.restore();
      return true;
    }

    // 31. 龙心秘宝
    if (_cid === 'cmwdzvs1woa53' || _nm === '龙心秘宝') {
      fillRadialBg(ctx, '#b91c1c', '#450a0a', '#09090b', 140, 105);
      ctx.save();
      const g = ctx.createRadialGradient(140, 104, 6, 140, 112, 54);
      g.addColorStop(0, '#fef08a'); g.addColorStop(0.45, '#ef4444'); g.addColorStop(1, '#7f1d1d');
      ctx.fillStyle = g; ctx.shadowColor = '#f59e0b'; ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.moveTo(140, 48); ctx.lineTo(186, 102); ctx.lineTo(140, 168); ctx.lineTo(94, 102); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#fde047'; ctx.lineWidth = 3; ctx.stroke();
      ctx.restore();
      return true;
    }

    // 32. 金色的龙心
    if (_cid === 'cmwe071ws115o' || _nm === '金色的龙心') {
      fillRadialBg(ctx, '#f59e0b', '#78350f', '#0c0a09', 140, 100);
      ctx.save();
      const g = ctx.createRadialGradient(140, 102, 4, 140, 108, 58);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, '#fde047'); g.addColorStop(1, '#b45309');
      ctx.fillStyle = g; ctx.shadowColor = '#fde047'; ctx.shadowBlur = 24;
      ctx.beginPath(); ctx.moveTo(140, 44); ctx.lineTo(192, 104); ctx.lineTo(140, 170); ctx.lineTo(88, 104); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#fffbeb'; ctx.lineWidth = 2.6; ctx.stroke();
      ctx.restore();
      return true;
    }

    // 33. 灾变中幸存的恐龙
    if (_cid === 'cmwe0x250te3k' || _nm === '灾变中幸存的恐龙') {
      fillRadialBg(ctx, '#dc2626', '#431407', '#09090b', 140, 95);
      ctx.save();
      // 流星火雨背景
      ctx.strokeStyle = '#fb923c'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(32, 24); ctx.lineTo(78, 66); ctx.moveTo(212, 20); ctx.lineTo(256, 62); ctx.stroke();
      // 坚毅霸王龙侧首剪影与伤疤
      ctx.fillStyle = '#15803d'; ctx.strokeStyle = '#052e16'; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(74, 178); ctx.lineTo(94, 88); ctx.lineTo(186, 72); ctx.lineTo(212, 98); ctx.lineTo(156, 114); ctx.lineTo(184, 132); ctx.lineTo(138, 138); ctx.lineTo(134, 178); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(138, 92, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.arc(139, 92, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      return true;
    }

    // 34. 骷髅
    if (_nm === '骷髅') {
      fillRadialBg(ctx, '#475569', '#1e1b4b', '#020617', 140, 95);
      ctx.save();
      ctx.fillStyle = '#e2e8f0'; ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.arc(140, 82, 32, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.roundRect(120, 104, 40, 22, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath(); ctx.arc(127, 80, 8, 0, Math.PI * 2); ctx.arc(153, 80, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#38bdf8'; ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(127, 80, 3, 0, Math.PI * 2); ctx.arc(153, 80, 3, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      // 交叉白骨与短剑
      ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(86, 152); ctx.lineTo(194, 174); ctx.moveTo(194, 152); ctx.lineTo(86, 174); ctx.stroke();
      ctx.restore();
      return true;
    }

    // 35. 骸骨兽
    if (_nm === '骸骨兽') {
      fillRadialBg(ctx, '#581c87', '#1e1b4b', '#020617', 140, 105);
      ctx.save();
      // 苍白骨狼伏击姿态
      ctx.fillStyle = '#e2e8f0'; ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.ellipse(150, 134, 54, 28, -0.1, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(72, 114); ctx.lineTo(116, 86); ctx.lineTo(126, 124); ctx.lineTo(82, 132); ctx.closePath(); ctx.fill(); ctx.stroke();
      // 脊骨尖刺与紫火眼
      ctx.fillStyle = '#a855f7'; ctx.shadowColor = '#a855f7'; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(98, 108, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 3;
      for (let x = 126; x <= 178; x += 13) { ctx.beginPath(); ctx.moveTo(x, 114); ctx.lineTo(x, 154); ctx.stroke(); }
      ctx.restore();
      return true;
    }

    // 36. 雏龙
    if (_nm === '雏龙') {
      fillRadialBg(ctx, '#ea580c', '#7c2d12', '#09090b', 140, 100);
      ctx.save();
      // 展翼小火龙
      ctx.fillStyle = '#f97316'; ctx.strokeStyle = '#431407'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(116, 112); ctx.lineTo(44, 62); ctx.lineTo(66, 122); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(164, 112); ctx.lineTo(236, 62); ctx.lineTo(214, 122); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#dc2626';
      ctx.beginPath(); ctx.ellipse(140, 134, 30, 36, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(140, 86, 24, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fef08a'; ctx.beginPath(); ctx.arc(131, 84, 4.5, 0, Math.PI * 2); ctx.arc(149, 84, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.arc(131, 84, 2, 0, Math.PI * 2); ctx.arc(149, 84, 2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      return true;
    }

    // 37. 堕天
    if (_nm === '堕天') {
      fillRadialBg(ctx, '#4c1d95', '#1e1b4b', '#020617', 140, 90);
      ctx.save();
      // 破碎黑翼与暗紫陨落光柱
      const g = ctx.createLinearGradient(140, 10, 140, 195);
      g.addColorStop(0, 'rgba(192,132,252,0.85)'); g.addColorStop(1, 'rgba(15,23,42,0)');
      ctx.fillStyle = g; ctx.fillRect(118, 10, 44, 185);
      ctx.fillStyle = '#0f172a'; ctx.strokeStyle = '#c084fc'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(132, 98); ctx.bezierCurveTo(72, 42, 34, 84, 62, 146); ctx.bezierCurveTo(94, 122, 114, 124, 132, 118); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(148, 98); ctx.bezierCurveTo(208, 42, 246, 84, 218, 146); ctx.bezierCurveTo(186, 122, 166, 124, 148, 118); ctx.closePath(); ctx.fill(); ctx.stroke();
      // 碎裂金色光环
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3; ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.ellipse(140, 56, 32, 9, -0.18, 0.2, Math.PI * 1.65); ctx.stroke();
      ctx.restore();
      return true;
    }

    return false;
  };

  // v60 全局商业级电影光影后处理（柔和暗角 + 稀有度顶光 + 氛围微光粒子）
  const _origRenderCustomCardArt = global.renderCustomCardArt;
  global.renderCustomCardArt = function (ctx, cardData) {
    const ok = _origRenderCustomCardArt(ctx, cardData);
    if (ok && _artLayerMode !== 'bg' && ctx && typeof ctx.createRadialGradient === 'function') {
      try {
        ctx.save();
        // 1) 柔和电影感四角暗角，突出卡面视觉中心
        const vig = ctx.createRadialGradient(140, 100, 62, 140, 100, 178);
        vig.addColorStop(0, 'rgba(0,0,0,0)');
        vig.addColorStop(0.75, 'rgba(2,6,23,0.12)');
        vig.addColorStop(1, 'rgba(2,6,23,0.44)');
        ctx.fillStyle = vig;
        ctx.fillRect(0, 0, 280, 200);

        // 2) 稀有度专属顶角轮缘光（仅在前景/合成模式轻柔叠加）
        const r = (cardData && cardData.rarity) || '';
        const rimCol = r === '虹' ? 'rgba(244,114,182,0.22)'
          : r === '金' ? 'rgba(251,191,36,0.20)'
          : r === '银' ? 'rgba(148,163,184,0.16)'
          : 'rgba(180,83,9,0.12)';
        const rim = ctx.createLinearGradient(0, 0, 280, 140);
        rim.addColorStop(0, rimCol);
        rim.addColorStop(0.42, 'rgba(255,255,255,0)');
        ctx.fillStyle = rim;
        ctx.fillRect(0, 0, 280, 200);
        ctx.restore();
      } catch (e) {}
    }
    return ok;
  };

  global.renderCustomCardArtLayers = function (bgCtx, fgCtx, cardData) {
    let okBg = false;
    let okFg = false;
    try {
      _artLayerMode = 'bg';
      _inBgHelper = false;
      const bgProxy = new Proxy(bgCtx, {
        get(target, prop) {
          const val = target[prop];
          if (typeof val === 'function') {
            if (['fill', 'stroke', 'fillRect', 'strokeRect', 'fillText', 'strokeText', 'drawImage'].includes(prop)) {
              return function (...args) {
                if (!_inBgHelper) return;
                return val.apply(target, args);
              };
            }
            return val.bind(target);
          }
          return val;
        },
        set(target, prop, value) {
          target[prop] = value;
          return true;
        }
      });
      okBg = global.renderCustomCardArt(bgProxy, cardData);
    } finally {
      _artLayerMode = 'all';
      _inBgHelper = false;
    }
    try {
      _artLayerMode = 'fg';
      _inBgHelper = false;
      okFg = global.renderCustomCardArt(fgCtx, cardData);
    } finally {
      _artLayerMode = 'all';
      _inBgHelper = false;
    }
    return Boolean(okBg && okFg);
  };

})(typeof window !== 'undefined' ? window : globalThis);