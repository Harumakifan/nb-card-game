// CardForge · 冥刻之诗 高精度卡面绘制引擎 (v52)
// 为全部卡牌提供与名称、种族、效果高度契合的多层次手绘级矢量Canvas插画

(function (global) {
  'use strict';

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
    const g = ctx.createRadialGradient(cx, cy, 10, 140, 110, 165);
    g.addColorStop(0, c1);
    g.addColorStop(0.55, c2);
    g.addColorStop(1, c3);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 280, 220);
  }

  function fillSkyBg(ctx, cTop, cMid, cBot) {
    const g = ctx.createLinearGradient(0, 0, 0, 220);
    g.addColorStop(0, cTop);
    g.addColorStop(0.55, cMid);
    g.addColorStop(1, cBot);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 280, 220);
  }

  function drawParticles(ctx, seed, col, count = 18, mode = 'sparks') {
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
  }

  function drawMagicCircle(ctx, cx, cy, r, col, alpha = 0.45) {
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
  }

  function drawMoon(ctx, cx, cy, r, col = '#fef08a', crescent = false) {
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

  function drawAnimeHeroine(ctx, opts = {}) {
    const {
      cx = 140, cy = 96,
      hairCol = '#f472b6', eyeCol = '#22d3ee', suitCol = '#1e3a8a',
      trimCol = '#fde047', skinCol = '#fff1e6',
      wingType = 'none', propType = 'none', headgear = 'none',
      auraCol = null
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

    // 飘逸长发后层
    ctx.fillStyle = hairCol;
    ctx.beginPath();
    ctx.moveTo(cx - 40, cy - 22);
    ctx.quadraticCurveTo(cx - 82, cy + 45, cx - 64, cy + 118);
    ctx.lineTo(cx + 64, cy + 118);
    ctx.quadraticCurveTo(cx + 82, cy + 45, cx + 40, cy - 22);
    ctx.closePath(); ctx.fill();

    // 头饰后层（光环/猫耳/狼耳/龙角/魔女帽）
    if (headgear === 'halo') {
      ctx.strokeStyle = '#fde047'; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.ellipse(cx, cy - 48, 28, 7, 0, 0, Math.PI * 2); ctx.stroke();
    } else if (headgear === 'cat_ears' || headgear === 'wolf_ears') {
      ctx.fillStyle = hairCol; ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2;
      [-1, 1].forEach(d => {
        ctx.beginPath();
        ctx.moveTo(cx + d * 10, cy - 36);
        ctx.lineTo(cx + d * 28, cy - 64);
        ctx.lineTo(cx + d * 30, cy - 28);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = headgear === 'cat_ears' ? '#fda4af' : '#cbd5e1';
        ctx.beginPath();
        ctx.moveTo(cx + d * 14, cy - 36);
        ctx.lineTo(cx + d * 25, cy - 55);
        ctx.lineTo(cx + d * 26, cy - 32);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = hairCol;
      });
    } else if (headgear === 'horns') {
      ctx.fillStyle = '#dc2626'; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 1.8;
      [-1, 1].forEach(d => {
        ctx.beginPath();
        ctx.moveTo(cx + d * 16, cy - 36);
        ctx.quadraticCurveTo(cx + d * 42, cy - 62, cx + d * 32, cy - 72);
        ctx.quadraticCurveTo(cx + d * 26, cy - 48, cx + d * 22, cy - 30);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      });
    } else if (headgear === 'crown') {
      ctx.fillStyle = '#fbbf24'; ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 20, cy - 38); ctx.lineTo(cx - 24, cy - 58); ctx.lineTo(cx - 10, cy - 48);
      ctx.lineTo(cx, cy - 62); ctx.lineTo(cx + 10, cy - 48); ctx.lineTo(cx + 24, cy - 58);
      ctx.lineTo(cx + 20, cy - 38); ctx.closePath(); ctx.fill(); ctx.stroke();
    }

    // 服饰/胸甲
    ctx.fillStyle = suitCol;
    ctx.strokeStyle = trimCol;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(cx - 52, cy + 120);
    ctx.quadraticCurveTo(cx - 42, cy + 36, cx - 18, cy + 28);
    ctx.lineTo(cx + 18, cy + 28);
    ctx.quadraticCurveTo(cx + 42, cy + 36, cx + 52, cy + 120);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // 脸部
    ctx.fillStyle = skinCol;
    ctx.beginPath();
    ctx.moveTo(cx - 27, cy - 15);
    ctx.quadraticCurveTo(cx - 27, cy + 15, cx, cy + 25);
    ctx.quadraticCurveTo(cx + 27, cy + 15, cx + 27, cy - 15);
    ctx.arc(cx, cy - 15, 27, 0, Math.PI, true);
    ctx.closePath(); ctx.fill();

    // 双眼
    [-12, 12].forEach(dx => {
      const ex = cx + dx, ey = cy;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.ellipse(ex, ey, 7, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = eyeCol;
      ctx.beginPath(); ctx.ellipse(ex, ey + 0.5, 5, 5.2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#090d16';
      ctx.beginPath(); ctx.arc(ex, ey + 1, 2.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(ex - 2, ey - 2, 2, 0, Math.PI * 2); ctx.fill();
    });

    // 刘海
    ctx.fillStyle = hairCol;
    ctx.beginPath();
    ctx.arc(cx, cy - 15, 30, Math.PI, Math.PI * 2);
    ctx.lineTo(cx + 30, cy + 2); ctx.lineTo(cx + 18, cy - 10);
    ctx.lineTo(cx + 6, cy + 2); ctx.lineTo(cx - 6, cy - 11);
    ctx.lineTo(cx - 18, cy + 2); ctx.lineTo(cx - 30, cy + 2);
    ctx.closePath(); ctx.fill();

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
      ctx.fillStyle = '#4ade80'; ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.arc(cx + 46, cy + 44, 16, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillRect(cx + 41, cy + 16, 10, 14);
    } else if (propType === 'fan_strategist') {
      ctx.fillStyle = '#fef3c7'; ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx + 36, cy + 42, 26, -Math.PI * 0.9, -Math.PI * 0.1); ctx.lineTo(cx + 36, cy + 42); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (propType === 'grimoire') {
      ctx.fillStyle = '#581c87'; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2.5;
      ctx.fillRect(cx + 26, cy + 20, 36, 44); ctx.strokeRect(cx + 26, cy + 20, 36, 44);
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
    }
    ctx.restore();
  }

  // 主入口：返回 true 表示命中了高精度重绘或新卡绘制；返回 false 可交给原逻辑兜底
  global.renderCustomCardArt = function (ctx, cardData) {
    const name = cardData.name || '';
    const id = cardData.id || '';
    const h = hashStr(id + '_' + name);

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

    // ================= 3. 角色类卡牌高精度定制（含所有新人物与原有重复模板人物） =================
    const charPresets = {
      '大剑少女': { bg: ['#38bdf8', '#1e1b4b'], hair: '#e2e8f0', eye: '#38bdf8', suit: '#1e3a8a', prop: 'greatsword', aura: '#38bdf8' },
      '狼少女': { bg: ['#312e81', '#090d16'], hair: '#cbd5e1', eye: '#fde047', suit: '#1e293b', headgear: 'wolf_ears', prop: 'katana_dual' },
      '猫耳播报员': { bg: ['#f472b6', '#31102f'], hair: '#fbcfe8', eye: '#38bdf8', suit: '#be185d', headgear: 'cat_ears', prop: 'mic' },
      '骸骨和少女': { bg: ['#a855f7', '#0f172a'], hair: '#e9d5ff', eye: '#f43f5e', suit: '#3b0764', prop: 'necromancer_staff', aura: '#c084fc' },
      '玩耍的唤灵术士': { bg: ['#a855f7', '#1e1b4b'], hair: '#c4b5fd', eye: '#fde047', suit: '#4c1d95', prop: 'necromancer_staff', aura: '#a855f7' },
      '招魂的术士': { bg: ['#7e22ce', '#090d16'], hair: '#ddd6fe', eye: '#4ade80', suit: '#3b0764', prop: 'necromancer_staff', aura: '#4ade80' },
      '灵魂雕塑家': { bg: ['#06b6d4', '#1e1b4b'], hair: '#a5f3fc', eye: '#fde047', suit: '#164e63', prop: 'grimoire', aura: '#22d3ee' },
      '死神代行人': { bg: ['#581c87', '#050811'], hair: '#e2e8f0', eye: '#f43f5e', suit: '#0f172a', wing: 'bone_wings', prop: 'scythe' },
      '冥河引渡人': { bg: ['#0284c7', '#090d16'], hair: '#bae6fd', eye: '#38bdf8', suit: '#0c4a6e', prop: 'necromancer_staff', aura: '#38bdf8' },
      '送葬人': { bg: ['#475569', '#090d16'], hair: '#94a3b8', eye: '#c084fc', suit: '#1e293b', prop: 'scythe' },
      '哀乐奏响者': { bg: ['#6366f1', '#1e1b4b'], hair: '#c7d2fe', eye: '#fde047', suit: '#312e81', prop: 'mic', aura: '#818cf8' },
      '猎魄师': { bg: ['#c084fc', '#090d16'], hair: '#f3e8ff', eye: '#22d3ee', suit: '#3b0764', prop: 'katana_dual', aura: '#c084fc' },
      '戏谑的吸血鬼': { bg: ['#be123c', '#090d16'], hair: '#fda4af', eye: '#ef4444', suit: '#4c0519', wing: 'demon_wings' },
      '吸血鬼贵族': { bg: ['#9f1239', '#1e1b4b'], hair: '#f8fafc', eye: '#ef4444', suit: '#4c0519', wing: 'demon_wings', headgear: 'crown' },
      '热情的魅魔': { bg: ['#ec4899', '#3b0764'], hair: '#f472b6', eye: '#fde047', suit: '#831843', wing: 'demon_wings', headgear: 'horns' },
      '恶魔的仆从': { bg: ['#7f1d1d', '#090d16'], hair: '#fca5a5', eye: '#f97316', suit: '#450a0a', wing: 'demon_wings', headgear: 'horns' },
      '血法师': { bg: ['#dc2626', '#1e1b4b'], hair: '#fecaca', eye: '#ef4444', suit: '#450a0a', prop: 'grimoire', aura: '#ef4444' },
      '浴血的刀客': { bg: ['#b91c1c', '#090d16'], hair: '#e2e8f0', eye: '#ef4444', suit: '#1e293b', prop: 'katana_dual' },
      '咆哮的狼人': { bg: ['#475569', '#090d16'], hair: '#94a3b8', eye: '#fde047', suit: '#334155', headgear: 'wolf_ears', prop: 'katana_dual' },
      '叹息之墙盾': { bg: ['#fbbf24', '#1e293b'], hair: '#fef08a', eye: '#38bdf8', suit: '#334155', prop: 'thorn_shield', aura: '#fde047' },
      '守卫城堡的指挥官': { bg: ['#f59e0b', '#1e3a8a'], hair: '#fde047', eye: '#38bdf8', suit: '#1e3a8a', headgear: 'crown', prop: 'greatsword' },
      '精灵女王': { bg: ['#22c55e', '#064e3b'], hair: '#bbf7d0', eye: '#fde047', suit: '#047857', headgear: 'crown', prop: 'shepherd_staff', aura: '#4ade80' },
      '辅佐帝王的谋士': { bg: ['#ca8a04', '#1e1b4b'], hair: '#fde68a', eye: '#38bdf8', suit: '#312e81', prop: 'fan_strategist' },
      '屠龙勇士': { bg: ['#ef4444', '#1e293b'], hair: '#fed7aa', eye: '#fde047', suit: '#7f1d1d', prop: 'dragon_lance', wing: 'dragon_wings' },
      '探寻巨龙者': { bg: ['#d97706', '#1e293b'], hair: '#fde68a', eye: '#4ade80', suit: '#78350f', prop: 'dragon_lance' },
      '疯狂科学家': { bg: ['#22c55e', '#1e1b4b'], hair: '#a7f3d0', eye: '#fde047', suit: '#f8fafc', headgear: 'visor', prop: 'flask', aura: '#4ade80' },
      '痛恨快攻卡组的玩家': { bg: ['#38bdf8', '#090d16'], hair: '#93c5fd', eye: '#ef4444', suit: '#1e293b', headgear: 'visor', prop: 'thorn_shield', aura: '#38bdf8' },
      '苦难预言者': { bg: ['#64748b', '#090d16'], hair: '#cbd5e1', eye: '#c084fc', suit: '#1e1b4b', headgear: 'nun_veil', prop: 'grimoire' },
      '灾难预言者': { bg: ['#ef4444', '#3b0764'], hair: '#fca5a5', eye: '#fde047', suit: '#450a0a', headgear: 'nun_veil', prop: 'grimoire', aura: '#ef4444' },
      '寻觅的亡灵': { bg: ['#6366f1', '#090d16'], hair: '#c7d2fe', eye: '#38bdf8', suit: '#1e1b4b', prop: 'necromancer_staff' },
      '祷告的圣女': { bg: ['#fde047', '#1e3a8a'], hair: '#fef9c3', eye: '#38bdf8', suit: '#eff6ff', wing: 'angel_feather', headgear: 'halo', aura: '#fde047' },
      '堕天使': { bg: ['#a855f7', '#090d16'], hair: '#e9d5ff', eye: '#f43f5e', suit: '#3b0764', wing: 'demon_wings', headgear: 'halo' },
      '慈爱的龙母': { bg: ['#f472b6', '#4c0519'], hair: '#fbcfe8', eye: '#fde047', suit: '#831843', wing: 'dragon_wings', headgear: 'crown' },
      '龙骑士': { bg: ['#0284c7', '#172554'], hair: '#60a5fa', eye: '#fde047', suit: '#1e3a8a', wing: 'dragon_wings', prop: 'dragon_lance' },
      '静听倾诉的修女': { bg: ['#38bdf8', '#0f172a'], hair: '#e2e8f0', eye: '#38bdf8', suit: '#1e293b', headgear: 'nun_veil', aura: '#bae6fd' },
      '小小唤灵术士': { bg: ['#7c3aed', '#090d16'], hair: '#e9d5ff', eye: '#c084fc', suit: '#3b0764', headgear: 'witch_hat', prop: 'necromancer_staff', aura: '#a855f7' },
      '胆小鬼': { bg: ['#334155', '#090d16'], hair: '#cbd5e1', eye: '#fde047', suit: '#1e293b', headgear: 'hood', aura: '#94a3b8' },
      '亡灵骑士': { bg: ['#1e1b4b', '#050811'], hair: '#94a3b8', eye: '#38bdf8', suit: '#0f172a', headgear: 'horns', prop: 'greatsword', aura: '#6366f1' },
      '拯救世界的大天使': { bg: ['#fef08a', '#1e3a8a'], hair: '#fef9c3', eye: '#38bdf8', suit: '#f8fafc', wing: 'angel_feather', headgear: 'halo', prop: 'greatsword', aura: '#fde047' },
      '毁灭世界的魔王': { bg: ['#dc2626', '#050811'], hair: '#fecaca', eye: '#ef4444', suit: '#450a0a', wing: 'demon_wings', headgear: 'crown', prop: 'greatsword', aura: '#ef4444' }
    };

    if (charPresets[name]) {
      const p = charPresets[name];
      fillRadialBg(ctx, p.bg[0], p.bg[1], '#050811');
      drawParticles(ctx, h, p.aura || p.eye, 16, 'sparks');
      drawAnimeHeroine(ctx, {
        cx: 140, cy: 96,
        hairCol: p.hair, eyeCol: p.eye, suitCol: p.suit,
        wingType: p.wing || 'none',
        propType: p.prop || 'none',
        headgear: p.headgear || 'none',
        auraCol: p.aura || null
      });
      if (name === '骸骨和少女') {
        drawSkull(ctx, 206, 98, 0.78, { eyeCol: '#c084fc', horns: true });
      }
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

    return false;
  };
})(typeof window !== 'undefined' ? window : globalThis);
