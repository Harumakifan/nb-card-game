



if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    const rad = typeof r === 'number' ? r : (Array.isArray(r) ? (r[0] || 0) : 6);
    const rr = Math.min(rad, w / 2, h / 2);
    this.moveTo(x + rr, y);
    this.arcTo(x + w, y, x + w, y + h, rr);
    this.arcTo(x + w, y + h, x, y + h, rr);
    this.arcTo(x, y + h, x, y, rr);
    this.arcTo(x, y, x + w, y, rr);
    this.closePath();
    return this;
  };
}

function hashStr(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

const CARD_ART_PROFILES = {
  "cmwas0lke5oiw": { style: "mecha_pilot", hair: "#38bdf8", eyes: "#facc15", armor: "#0284c7", bg1: "#091e3a", bg2: "#0ea5e9", halo: true },
  "cmwat3dbzstsr": { style: "monster_harpy", hair: "#c084fc", eyes: "#f43f5e", armor: "#4c1d95", bg1: "#1e1b4b", bg2: "#7e22ce", halo: false },
  "cmwata95yc8j5": { style: "spirit_beast", hair: "#fb923c", eyes: "#fef08a", armor: "#9a3412", bg1: "#271206", bg2: "#ea580c", halo: false },
  "cmwbvfqe5en3l": { style: "mecha_knight", hair: "#93c5fd", eyes: "#34d399", armor: "#1d4ed8", bg1: "#0f172a", bg2: "#2563eb", halo: false },
  "cmwbvnpfgwo7a": { style: "mecha_brawler", hair: "#f87171", eyes: "#fbbf24", armor: "#475569", bg1: "#1e293b", bg2: "#dc2626", halo: false },
  "cmwbwda72g49w": { style: "anime_assassin", hair: "#e2e8f0", eyes: "#ef4444", armor: "#0f172a", bg1: "#18181b", bg2: "#e11d48", halo: false },
  "cmwbwg3kwqfkq": { style: "anime_courier", hair: "#fde047", eyes: "#0ea5e9", armor: "#0369a1", bg1: "#082f49", bg2: "#38bdf8", halo: false },
  "cmwbwne297mmg": { style: "anime_maid", hair: "#f9a8d4", eyes: "#60a5fa", armor: "#312e81", bg1: "#1e1b4b", bg2: "#ec4899", halo: false },
  "cmwbx0mq8qz7f": { style: "valkyrie_girl", hair: "#f472b6", eyes: "#22d3ee", armor: "#f8fafc", bg1: "#3b0764", bg2: "#06b6d4", halo: true },
  "cmwbxdn7tcvde": { style: "cyber_skater", hair: "#4ade80", eyes: "#f43f5e", armor: "#065f46", bg1: "#022c22", bg2: "#10b981", halo: false },
  "cmwbxu7u3tpyo": { style: "cyber_shepherd", hair: "#a78bfa", eyes: "#34d399", armor: "#1e3a8a", bg1: "#0f172a", bg2: "#8b5cf6", halo: true },
  "cmwby0dy7g2pc": { style: "holo_sheep", hair: "#bae6fd", eyes: "#facc15", armor: "#0284c7", bg1: "#082f49", bg2: "#38bdf8", halo: false },
  "cmwby8v9c918f": { style: "bomber_alchemist", hair: "#fb7185", eyes: "#fde047", armor: "#881337", bg1: "#4c0519", bg2: "#f97316", halo: false },
  "cmwbyhrbei4w8": { style: "twin_android", hair: "#67e8f9", eyes: "#a855f7", armor: "#155e75", bg1: "#083344", bg2: "#06b6d4", halo: false },
  "cmwbyp6f419ju": { style: "skeleton_rockstar", hair: "#f43f5e", eyes: "#c084fc", armor: "#111827", bg1: "#2e1065", bg2: "#e11d48", halo: true },
  "cmwbz08a6fv59": { style: "bone_colossus", hair: "#cbd5e1", eyes: "#38bdf8", armor: "#334155", bg1: "#090d16", bg2: "#6366f1", halo: false },
  "cmwbz163tt1ma": { style: "anime_runner", hair: "#fbbf24", eyes: "#10b981", armor: "#b45309", bg1: "#1e293b", bg2: "#f59e0b", halo: false },
  "cmwc0a6dn4bel": { style: "undead_soldier", hair: "#94a3b8", eyes: "#a855f7", armor: "#1e1b4b", bg1: "#090d16", bg2: "#7e22ce", halo: false },
  "cmwc0auyporsj": { style: "necromancer_beast", hair: "#d8b4fe", eyes: "#ef4444", armor: "#581c87", bg1: "#2e1065", bg2: "#9333ea", halo: false },
  "cmwc0t61ade7b": { style: "vampire_lord", hair: "#f8fafc", eyes: "#e11d48", armor: "#7f1d1d", bg1: "#450a0a", bg2: "#dc2626", halo: true },
  "cmwc2n4p68ewm": { style: "shield_paladin", hair: "#fde047", eyes: "#38bdf8", armor: "#0369a1", bg1: "#0c4a6e", bg2: "#eab308", halo: true },
  "cmwc2wbcgbqvl": { style: "fairy_engineer", hair: "#fca5a5", eyes: "#fef08a", armor: "#b91c1c", bg1: "#450a0a", bg2: "#f59e0b", halo: false },
  "cmwc2zlhaxdtj": { style: "gear_apprentice", hair: "#fed7aa", eyes: "#38bdf8", armor: "#9a3412", bg1: "#271206", bg2: "#0284c7", halo: false },
  "cmwc33vo8ohrw": { style: "cyber_dragon", hair: "#7dd3fc", eyes: "#f59e0b", armor: "#075985", bg1: "#082f49", bg2: "#f97316", halo: true },
  "cmwc3gozg0rat": { style: "mecha_emperor", hair: "#fef08a", eyes: "#ef4444", armor: "#1e3a8a", bg1: "#172554", bg2: "#eab308", halo: true },
  "cmwc3or2zf7ft": { style: "dreadnought_queen", hair: "#c084fc", eyes: "#22d3ee", armor: "#312e81", bg1: "#1e1b4b", bg2: "#f59e0b", halo: true },
  "cmwc8tup5d1xt": { style: "prism_combiner", hair: "#6ee7b7", eyes: "#f472b6", armor: "#065f46", bg1: "#064e3b", bg2: "#ec4899", halo: true },
  "cmwc96kid9cw4": { style: "gothic_undertaker", hair: "#64748b", eyes: "#facc15", armor: "#1e293b", bg1: "#090d16", bg2: "#475569", halo: false },
  "cmwc97xb64vc6": { style: "cursed_samurai", hair: "#a1a1aa", eyes: "#22c55e", armor: "#3f3f46", bg1: "#18181b", bg2: "#16a34a", halo: false },
  "cmwc998a8rnwf": { style: "thorn_maiden", hair: "#bbf7d0", eyes: "#f43f5e", armor: "#166534", bg1: "#052e16", bg2: "#e11d48", halo: false },
  "cmwc9mbry93dx": { style: "hell_hound", hair: "#fda4af", eyes: "#fef08a", armor: "#881337", bg1: "#4c0519", bg2: "#9333ea", halo: false },
  "cmwc9ua0fd6of": { style: "bone_wyrm", hair: "#e9d5ff", eyes: "#06b6d4", armor: "#4c1d95", bg1: "#1e1b4b", bg2: "#22d3ee", halo: true },
  "cmwcae3tnsr81": { style: "holy_templar", hair: "#fef9c3", eyes: "#2563eb", armor: "#cbd5e1", bg1: "#1e293b", bg2: "#facc15", halo: false },
  "cmwcah8st1lar": { style: "spell_scripture", hair: "#fef08a", eyes: "#38bdf8", armor: "#ca8a04", bg1: "#1e3a8a", bg2: "#facc15", halo: true },
  "cmwcalky6itcu": { style: "spell_vortex", hair: "#c4b5fd", eyes: "#f472b6", armor: "#6d28d9", bg1: "#2e1065", bg2: "#38bdf8", halo: true },
  "cmwcaqbzuvvcx": { style: "spell_apple", hair: "#fda4af", eyes: "#4ade80", armor: "#be123c", bg1: "#4c0519", bg2: "#22c55e", halo: true },
  "cmwcb1izpxl7e": { style: "spell_daggers", hair: "#7dd3fc", eyes: "#f43f5e", armor: "#0369a1", bg1: "#082f49", bg2: "#ec4899", halo: false },
  "cmwcba1blx523": { style: "spell_inferno", hair: "#fde047", eyes: "#ef4444", armor: "#b91c1c", bg1: "#450a0a", bg2: "#f97316", halo: true }
};

const artCache = {};

function hashStr(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

// 为全部 38 张卡牌按各自【卡牌名字】单独定制构图、造型与特效（彻底告别千篇一律的重复模板脸！）
function getAnimeIllustrationDataURI(cardData) {
  const key = cardData.id + '_' + cardData.name;
  if (artCache[key]) return artCache[key];

  const name = cardData.name || '';
  const id = cardData.id || '';
  const h = hashStr(key);

  const cvs = document.createElement('canvas');
  cvs.width = 280;
  cvs.height = 220;
  const ctx = cvs.getContext('2d');
  if (typeof window !== 'undefined' && typeof window.renderCustomCardArt === 'function' && window.renderCustomCardArt(ctx, cardData)) {
    const dataUrl = cvs.toDataURL('image/png');
    artCache[key] = dataUrl;
    return dataUrl;
  }

  // 辅助绘制渐变底图與光效
  function fillRadialBg(c1, c2, c3 = '#050811') {
    const g = ctx.createRadialGradient(140, 100, 12, 140, 110, 155);
    g.addColorStop(0, c1);
    g.addColorStop(0.55, c2);
    g.addColorStop(1, c3);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 280, 220);
  }

  function drawGear(cx, cy, r, teeth, col, strokeCol = '#fde047') {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = col;
    ctx.strokeStyle = strokeCol;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < teeth * 2; i++) {
      const a = (i * Math.PI) / teeth;
      const rad = i % 2 === 0 ? r : r * 0.82;
      const x = Math.cos(a) * rad, y = Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r * 0.42, 0, Math.PI * 2);
    ctx.fillStyle = '#090d16'; ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  function drawAnimeHeroine({ cx = 140, cy = 96, hairCol = '#f472b6', eyeCol = '#22d3ee', suitCol = '#1e3a8a', wingType = 'none', propType = 'none' }) {
    ctx.save();
    // 翅膀或背部武装
    if (wingType === 'mecha_wings') {
      ctx.fillStyle = '#38bdf8';
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 2;
      [-1, 1].forEach(dir => {
        for (let k = 0; k < 3; k++) {
          ctx.beginPath();
          ctx.moveTo(cx + dir * 18, cy + 10);
          ctx.lineTo(cx + dir * (115 - k * 14), cy - 55 + k * 28);
          ctx.lineTo(cx + dir * (95 - k * 12), cy - 18 + k * 28);
          ctx.closePath(); ctx.fill(); ctx.stroke();
        }
      });
    } else if (wingType === 'thorn_vines') {
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 5;
      for (let k = 0; k < 5; k++) {
        ctx.beginPath();
        ctx.arc(cx, cy + 15, 55 + k * 10, 0.2 * k, Math.PI - 0.2 * k);
        ctx.stroke();
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

    // 服饰/胸甲
    ctx.fillStyle = suitCol;
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(cx - 52, cy + 120);
    ctx.quadraticCurveTo(cx - 42, cy + 36, cx - 18, cy + 28);
    ctx.lineTo(cx + 18, cy + 28);
    ctx.quadraticCurveTo(cx + 42, cy + 36, cx + 52, cy + 120);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // 脸部
    ctx.fillStyle = '#fff1e6';
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

    // 角色专属前景道具
    if (propType === 'thorn_shield') {
      ctx.fillStyle = '#166534';
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - 58, cy + 15); ctx.lineTo(cx + 58, cy + 15);
      ctx.lineTo(cx + 42, cy + 95); ctx.lineTo(cx, cy + 115); ctx.lineTo(cx - 42, cy + 95);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // 尖刺
      ctx.fillStyle = '#f43f5e';
      for (let sx = -36; sx <= 36; sx += 18) {
        ctx.beginPath(); ctx.moveTo(cx + sx - 6, cy + 55); ctx.lineTo(cx + sx, cy + 36); ctx.lineTo(cx + sx + 6, cy + 55); ctx.fill();
      }
    } else if (propType === 'hover_board') {
      ctx.fillStyle = '#10b981';
      ctx.strokeStyle = '#a7f3d0';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(cx, cy + 88, 72, 16, -0.15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else if (propType === 'shepherd_staff') {
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 4.5;
      ctx.beginPath(); ctx.moveTo(cx + 48, cy + 110); ctx.lineTo(cx + 48, cy - 25);
      ctx.arc(cx + 34, cy - 25, 14, 0, Math.PI * 1.65, true); ctx.stroke();
    } else if (propType === 'wrench') {
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(cx - 54, cy + 80); ctx.lineTo(cx - 28, cy + 10); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx - 26, cy + 4, 12, 0.4, Math.PI * 1.6); ctx.stroke();
    } else if (propType === 'bomber') {
      ctx.fillStyle = '#1e293b'; ctx.strokeStyle = '#f97316'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(cx + 48, cy + 45, 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fde047';
      ctx.beginPath(); ctx.arc(cx + 58, cy + 20, 8, 0, Math.PI * 2); ctx.fill();
    } else if (propType === 'express_flag') {
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(cx + 38, cy - 45, 52, 32);
      ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx + 38, cy + 95); ctx.lineTo(cx + 38, cy - 48); ctx.stroke();
    }
    ctx.restore();
  }

  // ==================== 按 38 张卡牌的具体名称逐一绘制专属画面 ====================
  if (name === '高性能引擎机甲') {
    fillRadialBg('#0ea5e9', '#0f172a');
    drawGear(70, 70, 44, 10, '#1e3a8a', '#38bdf8');
    drawGear(210, 70, 44, 10, '#1e3a8a', '#38bdf8');
    // 双涡轮核心重型机甲躯干与V字高达天线头
    ctx.fillStyle = '#0284c7'; ctx.strokeStyle = '#bae6fd'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(65, 195); ctx.lineTo(45, 95); ctx.lineTo(100, 65); ctx.lineTo(180, 65); ctx.lineTo(235, 95); ctx.lineTo(215, 195); ctx.closePath(); ctx.fill(); ctx.stroke();
    // 双发光炉心
    [102, 178].forEach(x => {
      ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(x, 128, 20, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fef08a'; ctx.beginPath(); ctx.arc(x, 128, 11, 0, Math.PI * 2); ctx.fill();
    });
    // 机甲头部与金色V字角
    ctx.fillStyle = '#1e293b'; ctx.fillRect(116, 36, 48, 36);
    ctx.fillStyle = '#34d399'; ctx.fillRect(122, 46, 36, 10);
    ctx.strokeStyle = '#fde047'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(92, 18); ctx.lineTo(140, 44); ctx.lineTo(188, 18); ctx.stroke();
  }
  else if (name === '巨型秃鹫') {
    fillRadialBg('#7e22ce', '#1e1b4b');
    ctx.fillStyle = '#fef08a'; ctx.beginPath(); ctx.arc(215, 45, 26, 0, Math.PI * 2); ctx.fill();
    // 展翅俯冲的巨型秃鹫与利爪骸骨
    ctx.fillStyle = '#3b0764'; ctx.strokeStyle = '#d8b4fe'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(12, 32); ctx.quadraticCurveTo(85, 15, 132, 95); ctx.quadraticCurveTo(190, 15, 268, 36);
    ctx.quadraticCurveTo(210, 108, 162, 130); ctx.lineTo(140, 185); ctx.lineTo(118, 130); ctx.quadraticCurveTo(70, 108, 12, 32);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fda4af'; ctx.beginPath(); ctx.arc(138, 86, 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.moveTo(132, 86); ctx.lineTo(102, 98); ctx.lineTo(134, 100); ctx.closePath(); ctx.fill();
  }
  else if (name === '被献祭的松鼠') {
    fillRadialBg('#9a3412', '#1c1917');
    // 红色献祭六芒星法阵与中间可怜的小松鼠
    ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(140, 165, 85, 24, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#d97706'; ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(155, 145); ctx.bezierCurveTo(235, 140, 240, 40, 175, 42); ctx.bezierCurveTo(148, 42, 152, 95, 155, 125); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(122, 132, 32, 26, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(102, 94, 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fef08a'; ctx.beginPath(); ctx.arc(94, 92, 5, 0, Math.PI * 2); ctx.fill();
  }
  else if (name === '通用载人机甲') {
    fillRadialBg('#2563eb', '#0f172a');
    // 透明球形驾驶舱双足步行机甲
    ctx.fillStyle = '#334155'; ctx.strokeStyle = '#93c5fd'; ctx.lineWidth = 3;
    ctx.fillRect(68, 72, 144, 96); ctx.strokeRect(68, 72, 144, 96);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.beginPath(); ctx.arc(140, 118, 38, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // 舱内驾驶员剪影
    ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(140, 108, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#475569'; ctx.fillRect(34, 86, 28, 75); ctx.fillRect(218, 86, 28, 75);
  }
  else if (name === '铁皮打手') {
    fillRadialBg('#dc2626', '#1e293b');
    // 巨型蒸汽铆钉重拳机器人
    ctx.fillStyle = '#64748b'; ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(140, 88, 48, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ef4444'; ctx.fillRect(112, 74, 56, 12);
    // 前景夸张的重型铁拳带冲击波
    ctx.fillStyle = '#b91c1c'; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.roundRect(42, 105, 86, 76, 16); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(162, 118, 72, 64, 14); ctx.fill(); ctx.stroke();
  }
  else if (name === '碎甲刃机') {
    fillRadialBg('#e11d48', '#090d16');
    // 高速旋转双十字等离子斩舰刀机甲
    ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(25, 185); ctx.lineTo(255, 35); ctx.stroke();
    ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(25, 35); ctx.lineTo(255, 185); ctx.stroke();
    drawGear(140, 110, 42, 12, '#1e293b', '#fde047');
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(140, 110, 14, 0, Math.PI * 2); ctx.fill();
  }
  else if (name === '飞轮信使') {
    fillRadialBg('#0284c7', '#082f49');
    // 独轮霓虹高速陀螺仪信使机器人
    drawGear(140, 148, 52, 16, '#0369a1', '#22d3ee');
    ctx.fillStyle = '#facc15'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.roundRect(102, 42, 76, 58, 14); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#090d16'; ctx.fillRect(114, 56, 52, 18);
    ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.arc(128, 65, 5, 0, Math.PI * 2); ctx.arc(152, 65, 5, 0, Math.PI * 2); ctx.fill();
  }
  else if (name === '发条侍从') {
    fillRadialBg('#db2777', '#1e1b4b');
    // 背后插着巨大黄金发条钥匙的哥特机巧人偶女仆
    ctx.strokeStyle = '#facc15'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(62, 78, 22, 0, Math.PI * 2); ctx.arc(218, 78, 22, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(84, 78); ctx.lineTo(196, 78); ctx.stroke();
    drawAnimeHeroine({ cx: 140, cy: 98, hairCol: '#f9a8d4', eyeCol: '#60a5fa', suitCol: '#1e1b4b', wingType: 'none', propType: 'none' });
  }
  else if (name === '魔导机兵少女') {
    fillRadialBg('#c026d3', '#1e1b4b');
    drawAnimeHeroine({ cx: 140, cy: 96, hairCol: '#f472b6', eyeCol: '#22d3ee', suitCol: '#f8fafc', wingType: 'mecha_wings', propType: 'none' });
    // 头顶金色天使光环与两侧浮游魔导炮
    ctx.strokeStyle = '#fde047'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.ellipse(140, 42, 44, 10, 0, 0, Math.PI * 2); ctx.stroke();
  }
  else if (name === '滑板跃迁手') {
    fillRadialBg('#059669', '#022c22');
    drawAnimeHeroine({ cx: 140, cy: 86, hairCol: '#4ade80', eyeCol: '#f43f5e', suitCol: '#065f46', wingType: 'none', propType: 'hover_board' });
  }
  else if (name === '赛博牧羊人') {
    fillRadialBg('#7c3aed', '#0f172a');
    drawAnimeHeroine({ cx: 128, cy: 96, hairCol: '#c4b5fd', eyeCol: '#34d399', suitCol: '#1e3a8a', wingType: 'none', propType: 'shepherd_staff' });
  }
  else if (name === '电子羊') {
    fillRadialBg('#0284c7', '#082f49');
    // 呆萌发光赛博全息绵羊（蓬松云朵羊毛+黄金弯角+闪电纹）
    ctx.fillStyle = '#e0f2fe'; ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 3;
    [[140, 112, 48], [96, 105, 34], [184, 105, 34], [116, 76, 32], [164, 76, 32]].forEach(([x, y, r]) => {
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    });
    // 羊脸与黄金螺旋角
    ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.ellipse(140, 110, 26, 22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#facc15'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(105, 92, 16, 0.5, Math.PI * 1.8); ctx.stroke();
    ctx.beginPath(); ctx.arc(175, 92, 16, Math.PI * 1.2, Math.PI * 0.5); ctx.stroke();
    ctx.fillStyle = '#22d3ee'; ctx.beginPath(); ctx.arc(128, 106, 5, 0, Math.PI * 2); ctx.arc(152, 106, 5, 0, Math.PI * 2); ctx.fill();
  }
  else if (name === '爆炸羊狂热者') {
    fillRadialBg('#ea580c', '#450a0a');
    drawAnimeHeroine({ cx: 124, cy: 96, hairCol: '#fb7185', eyeCol: '#fde047', suitCol: '#881337', wingType: 'none', propType: 'bomber' });
  }
  else if (name === '增殖机甲') {
    fillRadialBg('#0891b2', '#083344');
    // 左右镜像分裂的双子机甲（直观体现「召唤同名增殖机甲」）
    [88, 192].forEach((x, idx) => {
      ctx.fillStyle = idx === 0 ? '#06b6d4' : '#22d3ee';
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(x, 42); ctx.lineTo(x + 42, 88); ctx.lineTo(x + 28, 178); ctx.lineTo(x - 28, 178); ctx.lineTo(x - 42, 88); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(x, 98, 14, 0, Math.PI * 2); ctx.fill();
    });
    ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(88, 110); ctx.lineTo(192, 110); ctx.stroke();
  }
  else if (name === '摇滚骷髅吉他手') {
    fillRadialBg('#9333ea', '#1e1b4b');
    // 霓虹莫西干朋克骷髅手持电吉他飙音符闪电
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath(); ctx.moveTo(140, 12); ctx.lineTo(112, 58); ctx.lineTo(168, 58); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f8fafc'; ctx.strokeStyle = '#c084fc'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(140, 82, 34, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e11d48'; ctx.beginPath(); ctx.arc(126, 80, 9, 0, Math.PI * 2); ctx.arc(154, 80, 9, 0, Math.PI * 2); ctx.fill();
    // 炫酷V型电吉他
    ctx.fillStyle = '#e11d48'; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(65, 188); ctx.lineTo(135, 115); ctx.lineTo(165, 145); ctx.lineTo(115, 205); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(135, 130); ctx.lineTo(235, 55); ctx.stroke();
  }
  else if (name === '骸骨巨人') {
    fillRadialBg('#4f46e5', '#090d16');
    // 顶天立地的巨型白骨泰坦胸腔与巨颅
    ctx.fillStyle = '#e2e8f0'; ctx.strokeStyle = '#818cf8'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(140, 66, 38, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.arc(124, 64, 10, 0, Math.PI * 2); ctx.arc(156, 64, 10, 0, Math.PI * 2); ctx.fill();
    // 巨大肋骨排
    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 8;
    for (let ry = 118; ry <= 188; ry += 22) {
      ctx.beginPath(); ctx.arc(140, ry, 65, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    }
  }
  else if (name === '使命必达小子') {
    fillRadialBg('#d97706', '#1e293b');
    drawAnimeHeroine({ cx: 132, cy: 96, hairCol: '#fbbf24', eyeCol: '#10b981', suitCol: '#b45309', wingType: 'none', propType: 'express_flag' });
  }
  else if (name === '骷髅') {
    fillRadialBg('#4c1d95', '#090d16');
    // 手持残破铁剑与圆盾的基础骷髅兵
    ctx.fillStyle = '#e2e8f0'; ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(140, 88, 32, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillRect(122, 114, 36, 18);
    ctx.fillStyle = '#9333ea'; ctx.beginPath(); ctx.arc(128, 86, 8, 0, Math.PI * 2); ctx.arc(152, 86, 8, 0, Math.PI * 2); ctx.fill();
    // 铁剑
    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(64, 175); ctx.lineTo(105, 52); ctx.stroke();
  }
  else if (name === '骸骨兽') {
    fillRadialBg('#7e22ce', '#1e1b4b');
    // 双头冥界骨兽
    [95, 185].forEach(cx => {
      ctx.fillStyle = '#e9d5ff'; ctx.strokeStyle = '#c084fc'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(cx - 32, 70); ctx.lineTo(cx, 35); ctx.lineTo(cx + 32, 70); ctx.lineTo(cx + 18, 128); ctx.lineTo(cx - 18, 128); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(cx - 10, 82, 6, 0, Math.PI * 2); ctx.arc(cx + 10, 82, 6, 0, Math.PI * 2); ctx.fill();
    });
  }
  else if (name === '血偿者') {
    fillRadialBg('#be123c', '#27050a');
    drawAnimeHeroine({ cx: 140, cy: 96, hairCol: '#f8fafc', eyeCol: '#e11d48', suitCol: '#7f1d1d', wingType: 'none', propType: 'none' });
    // 猩红血月与鲜血圣杯
    ctx.fillStyle = '#f43f5e'; ctx.beginPath(); ctx.arc(215, 52, 24, 0, Math.PI * 2); ctx.fill();
  }
  else if (name === '装甲堡垒') {
    fillRadialBg('#0369a1', '#090d16');
    // 坚不可摧的黄金六边形巨盾移动要塞
    ctx.fillStyle = '#1e293b'; ctx.strokeStyle = '#facc15'; ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(140, 20); ctx.lineTo(235, 56); ctx.lineTo(215, 168); ctx.lineTo(140, 204); ctx.lineTo(65, 168); ctx.lineTo(45, 56);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.arc(140, 110, 32, 0, Math.PI * 2); ctx.fill();
  }
  else if (name === '铜壳瓢虫') {
    fillRadialBg('#b45309', '#1c1917');
    // 精致黄铜发条机械七星瓢虫
    drawGear(140, 110, 68, 14, '#78350f', '#f59e0b');
    ctx.fillStyle = '#dc2626'; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(140, 118, 52, 58, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(140, 60); ctx.lineTo(140, 176); ctx.stroke();
    ctx.fillStyle = '#fde047';
    [[-24, -18], [24, -18], [-28, 18], [28, 18], [0, 38]].forEach(([dx, dy]) => {
      ctx.beginPath(); ctx.arc(140 + dx, 118 + dy, 8, 0, Math.PI * 2); ctx.fill();
    });
  }
  else if (name === '齿轮学徒') {
    fillRadialBg('#0284c7', '#1e293b');
    drawGear(215, 62, 38, 10, '#ca8a04', '#fde047');
    drawAnimeHeroine({ cx: 140, cy: 96, hairCol: '#fed7aa', eyeCol: '#38bdf8', suitCol: '#9a3412', wingType: 'none', propType: 'wrench' });
  }
  else if (name === '发条龙') {
    fillRadialBg('#d97706', '#082f49');
    // 机械齿轮巨龙喷射烈焰
    drawGear(82, 138, 46, 12, '#b45309', '#fde047');
    ctx.fillStyle = '#0284c7'; ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(45, 165); ctx.quadraticCurveTo(95, 45, 185, 48); ctx.lineTo(245, 78); ctx.lineTo(192, 105); ctx.quadraticCurveTo(135, 115, 125, 185); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.moveTo(215, 86); ctx.lineTo(275, 62); ctx.lineTo(268, 128); ctx.closePath(); ctx.fill();
  }
  else if (name === '超载机皇') {
    fillRadialBg('#eab308', '#172554');
    // 黄金帝王冠冕与六翼防空导弹阵列机皇
    ctx.fillStyle = '#1e3a8a'; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(48, 195); ctx.lineTo(28, 78); ctx.lineTo(95, 58); ctx.lineTo(185, 58); ctx.lineTo(252, 78); ctx.lineTo(232, 195); ctx.closePath(); ctx.fill(); ctx.stroke();
    // 黄金帝皇冠
    ctx.fillStyle = '#facc15';
    ctx.beginPath(); ctx.moveTo(95, 58); ctx.lineTo(110, 14); ctx.lineTo(140, 42); ctx.lineTo(170, 14); ctx.lineTo(185, 58); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(140, 115, 26, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  else if (name === '万齿战车') {
    fillRadialBg('#f59e0b', '#1e1b4b');
    // 碾碎一切的三联巨型锯齿履带要塞战车
    drawGear(68, 152, 42, 14, '#334155', '#f59e0b');
    drawGear(140, 152, 48, 16, '#1e293b', '#fde047');
    drawGear(212, 152, 42, 14, '#334155', '#f59e0b');
    ctx.fillStyle = '#312e81'; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(35, 122); ctx.lineTo(68, 46); ctx.lineTo(212, 46); ctx.lineTo(245, 122); ctx.closePath(); ctx.fill(); ctx.stroke();
    // 巨型主炮
    ctx.fillStyle = '#0284c7'; ctx.fillRect(140, 22, 115, 22); ctx.strokeRect(140, 22, 115, 22);
  }
  else if (name === '磁力拼装机械') {
    fillRadialBg('#ec4899', '#064e3b');
    // 红蓝U型强磁铁极与悬浮拼装核心
    ctx.lineWidth = 18;
    ctx.strokeStyle = '#ef4444'; ctx.beginPath(); ctx.arc(95, 110, 45, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke();
    ctx.strokeStyle = '#3b82f6'; ctx.beginPath(); ctx.arc(185, 110, 45, Math.PI * 1.5, Math.PI * 0.5); ctx.stroke();
    ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(140, 110, 28, 0, Math.PI * 2); ctx.fill();
  }
  else if (name === '掘墓者') {
    fillRadialBg('#475569', '#090d16');
    // 提着幽冥提灯与铁锹的守墓人
    drawAnimeHeroine({ cx: 122, cy: 98, hairCol: '#94a3b8', eyeCol: '#facc15', suitCol: '#1e293b', wingType: 'none', propType: 'none' });
    // 幽冥绿火提灯
    ctx.fillStyle = '#fef08a'; ctx.beginPath(); ctx.arc(216, 86, 22, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 3; ctx.strokeRect(198, 64, 36, 46);
  }
  else if (name === '尸兵') {
    fillRadialBg('#16a34a', '#18181b');
    // 身披残破战甲手持长戈的亡灵尸兵
    ctx.fillStyle = '#86efac'; ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(140, 82, 30, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(128, 80, 6, 0, Math.PI * 2); ctx.arc(152, 80, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3f3f46'; ctx.fillRect(92, 114, 96, 82); ctx.strokeRect(92, 114, 96, 82);
  }
  else if (name === '刺盾少女') {
    fillRadialBg('#15803d', '#052e16');
    drawAnimeHeroine({ cx: 140, cy: 78, hairCol: '#bbf7d0', eyeCol: '#f43f5e', suitCol: '#166534', wingType: 'thorn_vines', propType: 'thorn_shield' });
  }
  else if (name === '骸骨犬') {
    fillRadialBg('#9333ea', '#4c0519');
    // 飞扑撕咬的冥界骨犬
    ctx.fillStyle = '#f1f5f9'; ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(45, 135); ctx.lineTo(115, 58); ctx.lineTo(225, 72); ctx.lineTo(185, 145); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(175, 88, 8, 0, Math.PI * 2); ctx.fill();
  }
  else if (name === '骨龙') {
    fillRadialBg('#06b6d4', '#1e1b4b');
    // 展开巨大骸骨双翼并喷吐冥火的骨龙
    ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 4;
    [-1, 1].forEach(dir => {
      ctx.beginPath(); ctx.moveTo(140, 105); ctx.lineTo(140 + dir * 115, 28); ctx.lineTo(140 + dir * 92, 138); ctx.closePath();
      ctx.fillStyle = 'rgba(168, 85, 247, 0.45)'; ctx.fill(); ctx.stroke();
    });
    ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.moveTo(140, 38); ctx.lineTo(168, 92); ctx.lineTo(140, 175); ctx.lineTo(112, 92); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#22d3ee'; ctx.beginPath(); ctx.arc(130, 78, 6, 0, Math.PI * 2); ctx.arc(150, 78, 6, 0, Math.PI * 2); ctx.fill();
  }
  else if (name === '坚定守护者') {
    fillRadialBg('#2563eb', '#0f172a');
    drawAnimeHeroine({ cx: 140, cy: 78, hairCol: '#fef08a', eyeCol: '#2563eb', suitCol: '#1e3a8a', wingType: 'none', propType: 'none' });
    // 占满前景的纯金圣堂大盾
    ctx.fillStyle = '#facc15'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(75, 92); ctx.lineTo(205, 92); ctx.lineTo(190, 185); ctx.lineTo(140, 212); ctx.lineTo(90, 185); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#0284c7'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(140, 106); ctx.lineTo(140, 192); ctx.moveTo(102, 142); ctx.lineTo(178, 142); ctx.stroke();
  }
  else if (name === '神圣法典') {
    fillRadialBg('#facc15', '#1e3a8a');
    // 展开的黄金神圣魔导书与十字圣光
    ctx.fillStyle = '#fef08a'; ctx.strokeStyle = '#ca8a04'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(42, 68); ctx.lineTo(140, 88); ctx.lineTo(238, 68); ctx.lineTo(226, 178); ctx.lineTo(140, 196); ctx.lineTo(54, 178); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(140, 18); ctx.lineTo(140, 142); ctx.moveTo(96, 58); ctx.lineTo(184, 58); ctx.stroke();
  }
  else if (name === '烟消云散') {
    fillRadialBg('#38bdf8', '#2e1065');
    // 多重紫色次元放逐漩涡
    for (let r = 82; r >= 16; r -= 16) {
      ctx.strokeStyle = r % 32 === 0 ? '#c084fc' : '#38bdf8';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(140, 110, r, 0, Math.PI * 1.75); ctx.stroke();
    }
  }
  else if (name === '转生苹果') {
    fillRadialBg('#22c55e', '#4c0519');
    // 闪耀翡翠生命双叶的黄金红宝石苹果
    ctx.fillStyle = '#e11d48'; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.arc(124, 122, 42, 0, Math.PI * 2); ctx.arc(156, 122, 42, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#4ade80';
    ctx.beginPath(); ctx.ellipse(158, 66, 26, 12, -0.4, 0, Math.PI * 2); ctx.fill();
  }
  else if (name === '连锁飞刃') {
    fillRadialBg('#ec4899', '#082f49');
    // 三把锁链相连的寒光飞刀
    [55, 110, 165].forEach((y, i) => {
      ctx.fillStyle = '#38bdf8'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(45 + i * 20, y); ctx.lineTo(225, y - 18); ctx.lineTo(185, y + 18); ctx.closePath(); ctx.fill(); ctx.stroke();
    });
  }
  else if (name === '炽炎之术') {
    fillRadialBg('#f97316', '#450a0a');
    // 烈焰红莲火球爆裂
    const fg = ctx.createRadialGradient(140, 110, 10, 140, 110, 88);
    fg.addColorStop(0, '#ffffff'); fg.addColorStop(0.35, '#fde047'); fg.addColorStop(0.7, '#ef4444'); fg.addColorStop(1, 'transparent');
    ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(140, 110, 88, 0, Math.PI * 2); ctx.fill();
  }
  else if (name === '守护世界的女神官') {
    fillRadialBg('#38bdf8', '#1e1b4b');
    // 圣洁天蓝色屏障穹顶 + 翠绿防空神环 + 黄金圣杖白袍女神官
    ctx.strokeStyle = 'rgba(125,211,252,0.85)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(140, 110, 82, Math.PI, 0, false); ctx.stroke();
    ctx.strokeStyle = '#34d399'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.arc(140, 95, 68, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    drawAnimeHeroine({ cx: 140, cy: 96, hairCol: '#fef08a', eyeCol: '#38bdf8', suitCol: '#f8fafc', wingType: 'angel_feather', propType: 'shepherd_staff' });
  }
  else if (name === '随机应变') {
    fillRadialBg('#c084fc', '#0f172a');
    // 交错旋转的双重奥术卡牌与六芒星命运骰阵
    ctx.save(); ctx.translate(108, 112); ctx.rotate(-0.28);
    ctx.fillStyle = '#1e1b4b'; ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 3.5;
    ctx.fillRect(-34, -48, 68, 96); ctx.strokeRect(-34, -48, 68, 96);
    ctx.restore();
    ctx.save(); ctx.translate(172, 112); ctx.rotate(0.28);
    ctx.fillStyle = '#3b0764'; ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3.5;
    ctx.fillRect(-34, -48, 68, 96); ctx.strokeRect(-34, -48, 68, 96);
    ctx.restore();
    ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(140, 112, 22, 0, Math.PI * 2); ctx.fill();
  }
  else if (name === '迅捷的侠盗') {
    fillRadialBg('#10b981', '#022c22');
    // 疾风双刃侠盗少女 + 左右两侧翠绿剑气弧光
    ctx.strokeStyle = '#6ee7b7'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(70, 110, 48, 0.6, 2.5); ctx.stroke();
    ctx.beginPath(); ctx.arc(210, 110, 48, -2.5, -0.6); ctx.stroke();
    drawAnimeHeroine({ cx: 140, cy: 98, hairCol: '#34d399', eyeCol: '#fde047', suitCol: '#064e3b', wingType: 'none', propType: 'hover_board' });
  }
  else if (name === '废物利用') {
    fillRadialBg('#f59e0b', '#090d16');
    // 机械炼金熔炉将废旧齿轮转化为两只发光电子羊
    ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(140, 112, 64, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath(); ctx.arc(96, 118, 24, 0, Math.PI * 2); ctx.arc(184, 118, 24, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath(); ctx.arc(96, 118, 10, 0, Math.PI * 2); ctx.arc(184, 118, 10, 0, Math.PI * 2); ctx.fill();
  }
  else if (name === '引导胜利的指挥官') {
    fillRadialBg('#fbbf24', '#31102f');
    ctx.fillStyle = '#ef4444'; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(195, 22); ctx.lineTo(258, 46); ctx.lineTo(205, 82); ctx.closePath(); ctx.fill(); ctx.stroke();
    drawAnimeHeroine({ cx: 136, cy: 96, hairCol: '#fde047', eyeCol: '#ef4444', suitCol: '#7c2d12', wingType: 'mecha_wings', propType: 'express_flag' });
  }
  else if (name === '雏龙的蛋') {
    fillRadialBg('#fde047', '#451a03');
    // 发光的龙纹金斑巨蛋与温暖巢穴
    ctx.fillStyle = '#78350f';
    ctx.beginPath(); ctx.ellipse(140, 172, 76, 22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fef3c7'; ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(140, 114, 48, 64, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fb923c';
    [[125, 92, 12], [158, 108, 15], [132, 138, 10]].forEach(([x, y, r]) => {
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    });
  }
  else if (name === '雏龙') {
    fillRadialBg('#fb923c', '#431407');
    // 破壳而出的赤橙色呆萌小幼龙
    ctx.fillStyle = '#f97316'; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(140, 102, 42, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath(); ctx.moveTo(112, 66); ctx.lineTo(98, 38); ctx.lineTo(126, 62); ctx.fill();
    ctx.beginPath(); ctx.moveTo(168, 66); ctx.lineTo(182, 38); ctx.lineTo(154, 62); ctx.fill();
    ctx.fillStyle = '#090d16';
    ctx.beginPath(); ctx.arc(124, 98, 7, 0, Math.PI * 2); ctx.arc(156, 98, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath(); ctx.moveTo(82, 142); ctx.lineTo(105, 125); ctx.lineTo(122, 148); ctx.lineTo(140, 124); ctx.lineTo(158, 148); ctx.lineTo(175, 125); ctx.lineTo(198, 142); ctx.lineTo(182, 192); ctx.lineTo(98, 192); ctx.closePath(); ctx.fill();
  }
  else if (name === '喷火龙') {
    fillRadialBg('#ef4444', '#450a0a');
    // 展翅喷吐炽热火柱的红莲火龙
    ctx.fillStyle = '#dc2626'; ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(140, 95); ctx.lineTo(28, 35); ctx.lineTo(52, 135); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(140, 95); ctx.lineTo(252, 35); ctx.lineTo(228, 135); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(140, 96, 38, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // 龙息烈焰
    const fg = ctx.createLinearGradient(140, 115, 140, 215);
    fg.addColorStop(0, '#ffffff'); fg.addColorStop(0.4, '#fde047'); fg.addColorStop(1, '#ef4444');
    ctx.fillStyle = fg;
    ctx.beginPath(); ctx.moveTo(128, 115); ctx.lineTo(75, 215); ctx.lineTo(205, 215); ctx.lineTo(152, 115); ctx.closePath(); ctx.fill();
  }
  else if (name === '飞龙') {
    fillRadialBg('#38bdf8', '#0c4a6e');
    // 苍穹雷霆双足飞龙（青蓝龙翼与闪电吐息）
    ctx.fillStyle = '#0284c7'; ctx.strokeStyle = '#7dd3fc'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(140, 100); ctx.lineTo(14, 24); ctx.lineTo(44, 148); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(140, 100); ctx.lineTo(266, 24); ctx.lineTo(236, 148); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#0369a1';
    ctx.beginPath(); ctx.moveTo(140, 38); ctx.lineTo(176, 108); ctx.lineTo(140, 182); ctx.lineTo(104, 108); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fde047';
    ctx.beginPath(); ctx.arc(126, 86, 6, 0, Math.PI * 2); ctx.arc(154, 86, 6, 0, Math.PI * 2); ctx.fill();
  }
  else if (name === '远古巨龙') {
    fillRadialBg('#f59e0b', '#1e1b4b');
    // 黄金龙角与熔岩龙鳞的遮天远古巨龙
    ctx.fillStyle = '#b45309'; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(140, 110); ctx.lineTo(8, 18); ctx.lineTo(28, 172); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(140, 110); ctx.lineTo(272, 18); ctx.lineTo(252, 172); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#78350f';
    ctx.beginPath(); ctx.arc(140, 105, 52, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // 黄金巨型龙角
    ctx.fillStyle = '#fde047';
    ctx.beginPath(); ctx.moveTo(105, 65); ctx.lineTo(55, 12); ctx.lineTo(125, 55); ctx.fill();
    ctx.beginPath(); ctx.moveTo(175, 65); ctx.lineTo(225, 12); ctx.lineTo(155, 55); ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.arc(120, 98, 9, 0, Math.PI * 2); ctx.arc(160, 98, 9, 0, Math.PI * 2); ctx.fill();
  }
  else if (name === '终焉之龙') {
    fillRadialBg('#c084fc', '#090d16');
    // 毁天灭地的紫金三首/星蚀终焉神龙与毁灭黑洞光环
    ctx.strokeStyle = '#fde047'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(140, 110, 88, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#581c87'; ctx.strokeStyle = '#e879f9'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(140, 110); ctx.lineTo(6, 10); ctx.lineTo(22, 195); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(140, 110); ctx.lineTo(274, 10); ctx.lineTo(258, 195); ctx.closePath(); ctx.fill(); ctx.stroke();
    // 三道毁灭吐息光束
    [75, 140, 205].forEach(x => {
      ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(140, 95); ctx.lineTo(x, 215); ctx.stroke();
    });
    ctx.fillStyle = '#1e1b4b'; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(140, 88, 46, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  else if (name === '祷告的圣女') {
    fillRadialBg('#fef08a', '#1e3a8a');
    drawAnimeHeroine({ cx: 140, cy: 96, hairCol: '#fef9c3', eyeCol: '#38bdf8', suitCol: '#eff6ff', wingType: 'angel_feather', propType: 'none' });
    ctx.strokeStyle = '#fde047'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(140, 52, 34, 0, Math.PI * 2); ctx.stroke();
  }
  else if (name === '快速孵化') {
    fillRadialBg('#4ade80', '#064e3b');
    // 裂开的发光龙蛋与加速沙漏魔法阵
    ctx.strokeStyle = '#34d399'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(140, 110, 74, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#fef3c7'; ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(140, 115, 44, 58, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(105, 110); ctx.lineTo(132, 95); ctx.lineTo(148, 122); ctx.lineTo(176, 104); ctx.stroke();
  }
  else if (name === '丢失的龙蛋') {
    fillRadialBg('#fbbf24', '#1e293b');
    // 森林草丛中并排闪耀的两枚龙蛋
    [98, 182].forEach(x => {
      ctx.fillStyle = '#fef3c7'; ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.ellipse(x, 120, 36, 48, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fb923c';
      ctx.beginPath(); ctx.arc(x - 8, 108, 9, 0, Math.PI * 2); ctx.arc(x + 12, 128, 11, 0, Math.PI * 2); ctx.fill();
    });
  }
  else if (name === '龙骑士') {
    fillRadialBg('#38bdf8', '#172554');
    drawAnimeHeroine({ cx: 140, cy: 98, hairCol: '#60a5fa', eyeCol: '#fde047', suitCol: '#1e3a8a', wingType: 'none', propType: 'thorn_shield' });
  }
  else if (name === '孵化装置') {
    fillRadialBg('#22d3ee', '#0f172a');
    // 赛博生物恒温龙蛋培养舱护符
    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)'; ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 4;
    ctx.fillRect(78, 34, 124, 152); ctx.strokeRect(78, 34, 124, 152);
    ctx.fillStyle = '#fde047';
    ctx.beginPath(); ctx.ellipse(140, 114, 34, 44, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#334155'; ctx.fillRect(64, 22, 152, 18); ctx.fillRect(64, 180, 152, 22);
  }
  else if (name === '鞭策') {
    fillRadialBg('#f43f5e', '#1f2937');
    // 闪电烈焰长鞭划破夜空
    ctx.strokeStyle = '#fb7185'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(35, 185); ctx.bezierCurveTo(95, 25, 185, 195, 248, 32); ctx.stroke();
    ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(35, 185); ctx.bezierCurveTo(95, 25, 185, 195, 248, 32); ctx.stroke();
  }
  else if (name === '驯龙师') {
    fillRadialBg('#fb923c', '#1e1b4b');
    drawAnimeHeroine({ cx: 140, cy: 98, hairCol: '#fb923c', eyeCol: '#4ade80', suitCol: '#7c2d12', wingType: 'none', propType: 'shepherd_staff' });
  }
  else if (name === '无畏的飞龙骑手') {
    fillRadialBg('#38bdf8', '#090d16');
    drawAnimeHeroine({ cx: 140, cy: 94, hairCol: '#38bdf8', eyeCol: '#fde047', suitCol: '#0284c7', wingType: 'mecha_wings', propType: 'express_flag' });
  }
  else if (name === '慈爱的龙母') {
    fillRadialBg('#f472b6', '#3b0764');
    drawAnimeHeroine({ cx: 140, cy: 96, hairCol: '#fbcfe8', eyeCol: '#fde047', suitCol: '#831843', wingType: 'angel_feather', propType: 'none' });
  }
  else if (name === '流淌龙血的侠客') {
    fillRadialBg('#ef4444', '#090d16');
    drawAnimeHeroine({ cx: 140, cy: 96, hairCol: '#dc2626', eyeCol: '#fde047', suitCol: '#450a0a', wingType: 'mecha_wings', propType: 'wrench' });
  }
  else if (name === '龙鳞锻造师') {
    fillRadialBg('#f97316', '#1e293b');
    drawAnimeHeroine({ cx: 140, cy: 98, hairCol: '#fdba74', eyeCol: '#38bdf8', suitCol: '#9a3412', wingType: 'none', propType: 'wrench' });
  }
  else if (name === '翱翔天际的龙骑手') {
    fillRadialBg('#60a5fa', '#0f172a');
    drawAnimeHeroine({ cx: 140, cy: 94, hairCol: '#93c5fd', eyeCol: '#fde047', suitCol: '#1d4ed8', wingType: 'mecha_wings', propType: 'hover_board' });
  }
  else if (name === '飞龙峡谷') {
    fillRadialBg('#f59e0b', '#1e1b4b');
    // 险峻赤岩大峡谷与盘旋天际的飞龙剪影
    ctx.fillStyle = '#78350f';
    ctx.beginPath(); ctx.moveTo(0, 220); ctx.lineTo(0, 65); ctx.lineTo(98, 135); ctx.lineTo(118, 220); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(280, 220); ctx.lineTo(280, 55); ctx.lineTo(182, 135); ctx.lineTo(162, 220); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fde047';
    ctx.beginPath(); ctx.arc(140, 72, 26, 0, Math.PI * 2); ctx.fill();
  }
  else if (name === '八岐大蛇') {
    fillRadialBg('#a855f7', '#090d16');
    // 八首暗紫魔龙盘踞血月之下
    ctx.fillStyle = '#dc2626';
    ctx.beginPath(); ctx.arc(140, 75, 48, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 8; i++) {
      const x = 28 + i * 32;
      const y = 52 + (i % 2) * 24;
      ctx.strokeStyle = '#581c87'; ctx.lineWidth = 12;
      ctx.beginPath(); ctx.moveTo(140, 215); ctx.quadraticCurveTo(x, 140, x, y); ctx.stroke();
      ctx.fillStyle = '#c084fc';
      ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.beginPath(); ctx.arc(x - 3, y - 2, 2.5, 0, Math.PI * 2); ctx.arc(x + 3, y - 2, 2.5, 0, Math.PI * 2); ctx.fill();
    }
  }
  else if (name === '满腔热血的霸者') {
    fillRadialBg('#ef4444', '#450a0a');
    drawAnimeHeroine({ cx: 140, cy: 96, hairCol: '#facc15', eyeCol: '#ef4444', suitCol: '#991b1b', wingType: 'mecha_wings', propType: 'bomber' });
  }
  else if (name === '孵化万物的龙女') {
    fillRadialBg('#34d399', '#064e3b');
    drawAnimeHeroine({ cx: 140, cy: 94, hairCol: '#a7f3d0', eyeCol: '#fde047', suitCol: '#047857', wingType: 'angel_feather', propType: 'shepherd_staff' });
  }
  else if (name === '窃蛋龙') {
    fillRadialBg('#a3e635', '#1a2e05');
    // 抱着发光金蛋疾跑的翠绿敏捷迅猛龙
    ctx.fillStyle = '#65a30d'; ctx.strokeStyle = '#bef264'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(118, 95, 34, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fef08a'; ctx.strokeStyle = '#f59e0b';
    ctx.beginPath(); ctx.ellipse(172, 128, 26, 34, 0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  else if (name === '考古学家') {
    fillRadialBg('#d97706', '#27272a');
    drawAnimeHeroine({ cx: 140, cy: 98, hairCol: '#fde68a', eyeCol: '#38bdf8', suitCol: '#78350f', wingType: 'none', propType: 'shepherd_staff' });
  }
  else if (name === '龙心秘宝') {
    fillRadialBg('#38bdf8', '#1e1b4b');
    // 镶嵌在黄金圣匣中的蔚蓝龙心水晶
    ctx.strokeStyle = '#fde047'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(140, 26); ctx.lineTo(208, 110); ctx.lineTo(140, 194); ctx.lineTo(72, 110); ctx.closePath();
    ctx.fillStyle = '#0284c7'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath(); ctx.arc(140, 110, 24, 0, Math.PI * 2); ctx.fill();
  }
  else if (name === '金色的龙心') {
    fillRadialBg('#fde047', '#7c2d12');
    // 绽放万丈金芒的传说黄金龙心结晶
    ctx.fillStyle = '#facc15'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(140, 18); ctx.lineTo(216, 110); ctx.lineTo(140, 202); ctx.lineTo(64, 110); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fef9c3';
    ctx.beginPath(); ctx.arc(140, 110, 32, 0, Math.PI * 2); ctx.fill();
  }
  else if (name === '大灾变') {
    fillRadialBg('#ef4444', '#090d16');
    // 陨石天降与大地崩裂的末日火雨
    [65, 140, 215].forEach((x, i) => {
      ctx.fillStyle = '#f97316'; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x, 85 + i * 25, 28, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    });
  }
  else if (name === '恐龙妈妈') {
    fillRadialBg('#fb923c', '#431407');
    // 温柔威严的巨型母龙与环绕身旁的三只小雏龙
    ctx.fillStyle = '#ea580c'; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(140, 88, 48, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    [72, 140, 208].forEach(x => {
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.arc(x, 168, 20, 0, Math.PI * 2); ctx.fill();
    });
  }
  else if (name === '骷髅墓碑') {
    fillRadialBg('#a855f7', '#0f172a');
    // 刻有亡灵十字的古老石碑与幽紫冥火
    ctx.fillStyle = '#475569'; ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.arc(140, 85, 46, Math.PI, 0, false); ctx.lineTo(186, 192); ctx.lineTo(94, 192); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath(); ctx.arc(140, 96, 18, 0, Math.PI * 2); ctx.fill();
  }
  else if (name === '灾变中幸存的恐龙') {
    fillRadialBg('#c084fc', '#3b0764');
    // 半身骸骨半身龙鳞的末日幸存翼龙
    ctx.fillStyle = '#9333ea'; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.arc(140, 104, 44, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath(); ctx.arc(140, 104, 44, -Math.PI / 2, Math.PI / 2); ctx.fill();
  }
  else if (name === '沉睡的恐龙化石') {
    fillRadialBg('#d97706', '#1c1917');
    // 封印在琥珀岩层中的发光盘蜷恐龙骨架化石
    ctx.fillStyle = '#44403c'; ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(140, 112, 68, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#fef3c7'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(140, 112, 42, 0.4, Math.PI * 1.75); ctx.stroke();
  }
  else if (name === '堕天') {
    fillRadialBg('#c084fc', '#090d16');
    // 洁白羽翼染上暗紫黑羽的坠落神罚之光
    ctx.strokeStyle = '#fde047'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(140, 10); ctx.lineTo(140, 210); ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath(); ctx.moveTo(140, 90); ctx.lineTo(35, 35); ctx.lineTo(65, 145); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#581c87';
    ctx.beginPath(); ctx.moveTo(140, 90); ctx.lineTo(245, 145); ctx.lineTo(215, 35); ctx.closePath(); ctx.fill();
  }
  else if (name === '堕天使') {
    fillRadialBg('#a855f7', '#1e1b4b');
    drawAnimeHeroine({ cx: 140, cy: 96, hairCol: '#e9d5ff', eyeCol: '#f43f5e', suitCol: '#3b0764', wingType: 'angel_feather', propType: 'none' });
  }
  else if (name === '待研究的骨架') {
    fillRadialBg('#94a3b8', '#0f172a');
    // 考古挖掘台上的巨型发光龙骨肋架
    ctx.strokeStyle = '#f1f5f9'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(52, 165); ctx.quadraticCurveTo(140, 55, 228, 165); ctx.stroke();
    for (let i = 0; i < 5; i++) {
      const x = 78 + i * 31;
      ctx.beginPath(); ctx.moveTo(x, 82); ctx.lineTo(x, 168); ctx.stroke();
    }
  }
  else if (name === '雏龙搭档') {
    fillRadialBg('#fb923c', '#1e293b');
    drawAnimeHeroine({ cx: 118, cy: 98, hairCol: '#fde047', eyeCol: '#38bdf8', suitCol: '#ea580c', wingType: 'none', propType: 'none' });
    ctx.fillStyle = '#f97316'; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(204, 112, 26, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  else if (id === 'cmwfdhecfc856' || name === '龙蛋收藏家') {
    fillRadialBg('#78350f', '#1e1b4b');
    drawAnimeHeroine({ cx: 138, cy: 96, hairCol: '#fbbf24', eyeCol: '#34d399', suitCol: '#7c2d12', wingType: 'none', propType: 'shepherd_staff' });
    const eggList = [[92, 162, '#fde047'], [140, 166, '#38bdf8'], [188, 162, '#f472b6']];
    eggList.forEach(([ex, ey, ecol]) => {
      ctx.fillStyle = ecol; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(ex, ey, 15, 20, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    });
  }
  else if (name === '静听倾诉的修女') {
    fillRadialBg('#38bdf8', '#0f172a');
    drawAnimeHeroine({ cx: 140, cy: 96, hairCol: '#e2e8f0', eyeCol: '#38bdf8', suitCol: '#1e293b', wingType: 'none', propType: 'none' });
  }
  else {
    // 自定义新设计卡牌：根据哈希自动组合不同色调与武器道具
    const cols = ['#f472b6', '#38bdf8', '#fde047', '#c084fc', '#4ade80', '#fb923c'];
    const props = ['thorn_shield', 'hover_board', 'shepherd_staff', 'wrench', 'bomber', 'express_flag'];
    fillRadialBg(cols[h % cols.length], '#0f172a');
    drawAnimeHeroine({
      cx: 140, cy: 96,
      hairCol: cols[h % cols.length],
      eyeCol: cols[(h + 2) % cols.length],
      suitCol: '#1e293b',
      wingType: cardData.rarity === '传说' ? 'mecha_wings' : 'none',
      propType: props[h % props.length]
    });
  }

  const dataUrl = cvs.toDataURL('image/png');
  artCache[key] = dataUrl;
  return dataUrl;
}

function hasRace(cData, targetRace) {
  if (!cData || !targetRace) return false;
  if (targetRace === '机械' && isMechCard(cData)) return true;
  const raw = String(cData.race || '');
  const parts = raw.split(/[，,、/\s]+/).map(s => s.trim()).filter(Boolean);
  return parts.includes(targetRace);
}

// 卡牌标准费用价值计算公式：能量×1 + 祭品×1.5 + 骨头×0.5
function getCardCostValue(cData) {
  if (!cData) return 0;
  if (cData.value !== undefined && cData.value !== null && !Number.isNaN(Number(cData.value))) {
    return Number(Number(cData.value).toFixed(1));
  }
  return Number((Number(cData.energy || 0) * 1.0 + Number(cData.bones || 0) * 0.5 + Number(cData.sacrifice || 0) * 1.5).toFixed(1));
}

function formatCardValueText(val) {
  const n = Number(val || 0);
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, '');
}

function normalizeSummonCostFilter(costOrEnergy) {
  if (typeof costOrEnergy === 'number') {
    return { energy: costOrEnergy, sacrifice: 0, bones: 0, value: 0 };
  }
  const c = costOrEnergy || {};
  return {
    energy: Number(c.energy || 0),
    sacrifice: Number(c.sacrifice || 0),
    bones: Number(c.bones || 0),
    value: Number(c.value || 0)
  };
}

function matchesSummonCostFilter(cardData, costOrEnergy) {
  if (!cardData) return false;
  const f = normalizeSummonCostFilter(costOrEnergy);
  const val = getCardCostValue(cardData);
  const e = Number(cardData.energy || 0);
  const s = Number(cardData.sacrifice || 0);
  const b = Number(cardData.bones || 0);

  if (f.value > 0) {
    if (val > f.value) return false;
    if (f.energy > 0 && e > f.energy) return false;
    if (f.sacrifice > 0 && s > f.sacrifice) return false;
    if (f.bones > 0 && b > f.bones) return false;
    return true;
  }
  // 价值以外的费用体系，只能召唤该体系且单体系的随从
  if (f.energy > 0 && f.sacrifice === 0 && f.bones === 0) {
    return s === 0 && b === 0 && e <= f.energy;
  }
  if (f.sacrifice > 0 && f.energy === 0 && f.bones === 0) {
    return e === 0 && b === 0 && s > 0 && s <= f.sacrifice;
  }
  if (f.bones > 0 && f.energy === 0 && f.sacrifice === 0) {
    return e === 0 && s === 0 && b > 0 && b <= f.bones;
  }
  return (f.energy <= 0 ? e === 0 : e <= f.energy)
    && (f.sacrifice <= 0 ? s === 0 : s <= f.sacrifice)
    && (f.bones <= 0 ? b === 0 : b <= f.bones);
}

function parseReansCostTag(tagStr) {
  const txt = String(tagStr || '');
  const em = txt.match(/能量(\d+)/);
  const sm = txt.match(/祭品(\d+)/);
  const bm = txt.match(/骨头(\d+)/);
  const vm = txt.match(/价值(\d+(?:\.\d+)?)/);
  return {
    energy: em ? Number(em[1]) : 0,
    sacrifice: sm ? Number(sm[1]) : 0,
    bones: bm ? Number(bm[1]) : 0,
    value: vm ? Number(vm[1]) : 0
  };
}

function getInitialCountdown(cData) {
  if (!cData) return 0;
  for (const kw of (cData.keywords || [])) {
    if (kw.k === '倒计时' && Number(kw.v || 0) > 0) return Number(kw.v);
  }
  const m = String(cData.fullText || cData.text || '').match(/倒计时_(\d+)/);
  if (m) return Number(m[1]);
  if (Number(cData.countdown || 0) > 0) return Number(cData.countdown);
  if (Number(cData.timer || 0) > 0) return Number(cData.timer);
  return 0;
}

function parseCardEffectAST(cardData) {
  const full = String(cardData.fullText || cardData.text || '').trim();
  const ast = {
    fanfare: [], lastWords: [], onEnter: [], turnEnd: [], onAttack: [], countdownEnd: [],
    enhance: null, crystallize: null, accelerate: null, combo: null,
    activate: null, fuse: null, spellMain: [], countdown: getInitialCountdown(cardData)
  };

  (cardData.keywords || []).forEach(kw => {
    const k = kw.k || '';
    const eff = kw.effect || '';
    if (k === '入场曲' && eff) ast.fanfare.push(...parseSentencesToActions(eff, cardData));
    if (k === '谢幕曲' && eff) ast.lastWords.push(...parseSentencesToActions(eff, cardData));
    if (k === '随从进场时' && eff) ast.onEnter.push(...parseSentencesToActions(eff, cardData));
    if (k === '回合结束时' && eff) ast.turnEnd.push(...parseSentencesToActions(eff, cardData));
    if (k === '攻击时' && eff) ast.onAttack.push(...parseSentencesToActions(eff, cardData));
    if (k === '倒计时' && eff) ast.countdownEnd.push(...parseSentencesToActions(eff, cardData));
    if (k === '爆能强化') {
      const isBoneEnh = kw.res === '骨头' || kw.costType === '骨头' || String(cardData.fullText || '').includes('爆能强化_骨头');
      ast.enhance = { costType: isBoneEnh ? 'bones' : 'energy', cost: Number(kw.v || 5), text: eff, actions: parseSentencesToActions(eff, cardData) };
    }
    if (k === '结晶') ast.crystallize = { cost: Number(kw.v || 1), text: eff, actions: parseSentencesToActions(eff, cardData) };
    if (k === '激奏') ast.accelerate = { cost: Number(kw.v || 1), text: eff, actions: parseSentencesToActions(eff, cardData) };
    if (k === '连击') ast.combo = { count: Number(kw.v || 3), text: eff, actions: parseSentencesToActions(eff, cardData) };
    if (k === '启动') {
      const eCost = kw.cost ? Number(kw.cost.energy || 0) : 0;
      const bCost = kw.cost ? Number(kw.cost.bones || 0) : 0;
      const sCost = kw.cost ? Number(kw.cost.sacrifice || 0) : 0;
      ast.activate = { energy: eCost, bones: bCost, sacrifice: sCost, text: eff, actions: parseSentencesToActions(eff, cardData) };
    }
    if (k === '融合') {
      ast.fuse = { filter: kw.fcond || kw.type || '', text: eff, actions: parseSentencesToActions(eff, cardData) };
    }
    (kw.reans || []).forEach(r => {
      const cf = normalizeSummonCostFilter(r.costs || { energy: 2 });
      const parts = [];
      if (cf.energy > 0) parts.push(`能量${cf.energy}`);
      if (cf.sacrifice > 0) parts.push(`祭品${cf.sacrifice}`);
      if (cf.bones > 0) parts.push(`骨头${cf.bones}`);
      if (cf.value > 0) parts.push(`价值${formatCardValueText(cf.value)}`);
      const act = {
        op: r.k === '招募' ? 'recruit' : 'reanimate',
        costFilter: cf,
        maxEnergy: cf.energy || 0,
        race: r.type || '',
        times: String(r.effect || '').includes('两次') || String(r.effect || '').includes('2次') ? 2 : 1,
        rawText: `【${r.k}_${parts.join('') || '能量2'}】${r.type ? '仅限「'+r.type+'」' : ''}${r.effect || ''}`
      };
      if (k === '谢幕曲') ast.lastWords.push(act);
      else if (k === '启动' && ast.activate) ast.activate.actions.push(act);
      else ast.fanfare.push(act);
    });
  });

  if (cardData.timerEffect && ast.countdownEnd.length === 0) {
    ast.countdownEnd.push(...parseSentencesToActions(cardData.timerEffect, cardData));
  }

  const lines = full.split(/\n+/);
  lines.forEach(rawLine => {
    const line = rawLine.trim();
    if (!line) return;
    let m;
    if ((m = line.match(/^【结晶(?:_能量)?(\d+)】(.*)$/))) {
      ast.crystallize = { cost: Number(m[1]), text: m[2], actions: parseSentencesToActions(m[2], cardData) };
    } else if ((m = line.match(/^【激奏(?:_能量)?(\d+)】(.*)$/))) {
      ast.accelerate = { cost: Number(m[1]), text: m[2], actions: parseSentencesToActions(m[2], cardData) };
    } else if ((m = line.match(/^【爆能强化_(能量|骨头)?(\d+)】(.*)$/))) {
      if (!ast.enhance) ast.enhance = { costType: m[1] === '骨头' ? 'bones' : 'energy', cost: Number(m[2]), text: m[3], actions: parseSentencesToActions(m[3], cardData) };
    } else if ((m = line.match(/^【连击_(\d+)】(.*)$/))) {
      if (!ast.combo) ast.combo = { count: Number(m[1]), text: m[2], actions: parseSentencesToActions(m[2], cardData) };
    } else if ((m = line.match(/^【启动】(?:能量(\d+)：)?(.*)$/))) {
      if (!ast.activate) ast.activate = { energy: Number(m[1] || 0), text: m[2], actions: parseSentencesToActions(m[2], cardData) };
    } else if ((m = line.match(/^【融合】(?:「([^」]+)」：)?(.*)$/))) {
      if (!ast.fuse) ast.fuse = { filter: m[1] || '', text: m[2], actions: parseSentencesToActions(m[2], cardData) };
    } else if ((m = line.match(/^.*【倒计时_(\d+)】(.*)$/))) {
      if (!ast.countdown) ast.countdown = Number(m[1]);
      if (m[2] && ast.countdownEnd.length === 0) ast.countdownEnd.push(...parseSentencesToActions(m[2], cardData));
    } else if (line.startsWith('【入场曲】') && ast.fanfare.length === 0 && !line.includes('【抉择】')) {
      ast.fanfare.push(...parseSentencesToActions(line.replace('【入场曲】', ''), cardData));
    } else if (line.startsWith('【谢幕曲】') && ast.lastWords.length === 0) {
      ast.lastWords.push(...parseSentencesToActions(line.replace('【谢幕曲】', ''), cardData));
    } else if ((line.startsWith('【回合结束时】') || line.startsWith('回合结束时')) && ast.turnEnd.length === 0) {
      ast.turnEnd.push(...parseSentencesToActions(line.replace(/^【?回合结束时】?[，：]?/, ''), cardData));
    } else if (line.startsWith('【攻击时】') && ast.onAttack.length === 0) {
      ast.onAttack.push(...parseSentencesToActions(line.replace('【攻击时】', ''), cardData));
    } else if (cardData.type === 'spell' && !line.startsWith('【')) {
      ast.spellMain.push(...parseSentencesToActions(line, cardData));
    }
  });

  return ast;
}

function parseSentencesToActions(text, cardData) {
  const actions = [];
  if (!text) return actions;
  const normalized = text
    .replace(/选择(对手|己方|敌方|友方)?(?:的战场上的)?1个(生命值\d+以下)?(?:敌方|友方)?随从，?(?:对其|使其)/g, '选择$11个$2随从')
    .replace(/，(?=(?:抽取|抽\d|选择|召唤|将\d|骨头\+|使自己的骨头\+|获得\d+骨头|回复|破坏|变身为|对(?:对手|己方|敌方|正对面|面前)|【招募|【亡者召还))/g, '。');
  const clauses = normalized.split(/[。；\n]+/).map(s => s.trim()).filter(Boolean);

  clauses.forEach(s => {
    let m;
    if ((m = s.match(/变身为『?([^』。，\s]+)』?/))) {
      actions.push({ op: 'transform_self', targetName: m[1], rawText: s });
      return;
    }
    if ((m = s.match(/【(招募|亡者召还)_([^】]+)】(?:仅限「([^」]+)」)?(?:，?发动(\d+|两)次)?/))) {
      const cf = parseReansCostTag(m[2]);
      actions.push({
        op: m[1] === '招募' ? 'recruit' : 'reanimate',
        costFilter: cf,
        maxEnergy: cf.energy || 0,
        race: m[3] || '',
        times: (m[4] === '两' || m[4] === '2') ? 2 : Number(m[4] || 1),
        rawText: s
      });
      return;
    }
    if ((m = s.match(/(?:骨头\+|获得)(\d+)(?:点)?骨头|骨头\+(\d+)/))) {
      const amt = Number(m[1] || m[2] || 1);
      actions.push({ op: 'add_bones', amount: amt, rawText: `骨头+${amt}` });
    }
    if ((m = s.match(/抽取?(\d+|一|两|三)张(?:「?([^」随从卡]+)」?随从卡?|卡牌|牌)/))) {
      const mapN = { '一': 1, '两': 2, '三': 3 };
      const cnt = mapN[m[1]] || Number(m[1] || 1);
      actions.push({ op: 'draw', count: cnt, race: m[2] || '', rawText: s });
    }
    if ((m = s.match(/将(\d+|一|两)张(?:『([^』]+)』|和([^同]+)同名的随从|([^\s，。]+?))(?:置入|加入)(?:自己的|你的|自己)?手牌/))) {
      const cnt = m[1] === '一' ? 1 : (m[1] === '两' ? 2 : Number(m[1]));
      const targetName = m[2] || m[3] || m[4] || cardData.name;
      actions.push({ op: 'add_hand', cardName: targetName.replace('本随从', cardData.name), count: cnt, rawText: s });
    }
    if ((m = s.match(/召唤(\d+|一|两|三|四)个?(?:只|张)?(?:『([^』]+)』|([^\s，。]+?同名的随从)|([^\s，。]+?))(?:到(?:己方|已方)?战场上|加入战场|$)/))) {
      const mapNum = { '一': 1, '两': 2, '三': 3, '四': 4 };
      const cnt = mapNum[m[1]] || Number(m[1] || 1);
      let targetName = (m[2] || m[3] || m[4] || cardData.name)
        .replace('同名的随从', '')
        .replace('和本随从', cardData.name)
        .replace('自己', cardData.name)
        .replace('本随从', cardData.name)
        .replace(/到(?:己方|已方)?战场上?$/, '');
      actions.push({ op: 'summon', cardName: targetName, count: cnt, rawText: s });
    }
    if ((m = s.match(/对(?:面前三侧|正对面与左右相邻三列)的?(?:敌方)?随从造成(\d+)点伤害/))) {
      actions.push({ op: 'damage_front_three_minions', damage: Number(m[1]), rawText: s });
    } else if ((m = s.match(/对(?:正对面|面前)的(?:敌方)?随从造成(\d+)点伤害/))) {
      actions.push({ op: 'damage_front_minion', damage: Number(m[1]), rawText: s });
    } else if ((m = s.match(/对(对手|己方|敌方)的?战场上的所有随从(和(?:对手|己方|敌方)的?主战者)?分配(\d+)点伤害/))) {
      actions.push({ op: 'distribute_damage', targetSideType: m[1] === '己方' ? 'self' : 'enemy', includeLeader: Boolean(m[2]), damage: Number(m[3]), rawText: s });
    } else if ((m = s.match(/对(对手|己方|敌方)的?(?:战场上的)?(?:所有随从|全体随从|随从全体)造成(\d+)点伤害/))) {
      actions.push({ op: 'aoe_damage', targetSideType: m[1] === '己方' ? 'self' : 'enemy', damage: Number(m[2]), rawText: s });
    } else if (s.includes('破坏') && (s.includes('所有随从') || s.includes('全体随从'))) {
      const bothSides = !s.includes('对手') && !s.includes('敌方');
      actions.push({ op: 'aoe_destroy', bothSides, rawText: s });
    } else if ((m = s.match(/对(?:对手|敌方)的主战者造成(\d+)点伤害/))) {
      actions.push({ op: 'leader_damage', damage: Number(m[1]), rawText: s });
    } else if ((m = s.match(/回复(?:(?:自己的|己方)主战者)?(\d+)点生命值/))) {
      actions.push({ op: 'heal_leader', amount: Number(m[1]), rawText: s });
    } else if ((m = s.match(/选择(对手|己方|敌方|友方)?(?:战场上)?1个生命值(?:为)?(\d+)以下的?(?:敌方|友方)?随从，?(?:使其)?【?消失】?/))) {
      const isSelf = m[1] === '己方' || m[1] === '友方';
      actions.push({ op: 'banish_target_hp', maxHp: Number(m[2]), needTarget: isSelf ? 'friendly_minion' : 'enemy_minion_hp', rawText: s });
    } else if (s.includes('选择') && s.includes('随从') && s.includes('消失')) {
      const isSelf = s.includes('己方') || s.includes('友方');
      actions.push({ op: 'banish_target', sameNameAll: s.includes('同名'), needTarget: isSelf ? 'friendly_minion' : 'enemy_minion', rawText: s });
    } else if (s.includes('选择') && s.includes('随从') && s.includes('破坏')) {
      const isSelf = s.includes('己方') || s.includes('友方');
      actions.push({ op: 'destroy_target', needTarget: isSelf ? 'friendly_minion' : 'enemy_minion', rawText: s });
    } else if ((m = s.match(/(?:选择(对手|己方|敌方|友方)?1个随从|对(?:其|该随从)|改为对其)造成(\d+)点伤害/))) {
      const isSelf = m[1] === '己方' || m[1] === '友方';
      actions.push({ op: 'damage_target', damage: Number(m[2]), needTarget: isSelf ? 'friendly_minion' : 'enemy_minion', rawText: s });
    }
    if ((m = s.match(/其他([^\s获]+)?随从获得\+(\d+)\/\+?(\d+)/))) {
      actions.push({ op: 'buff_allies', race: m[1] || '', atk: Number(m[2]), hp: Number(m[3]), rawText: s });
    }
    if ((m = s.match(/下一[张场]([^\s随]+)?随从卡?(?:能量)?(?:费用)?-(\d+)/))) {
      actions.push({ op: 'discount_next', amount: Number(m[2]), rawText: s });
    }
  });

  return actions;
}

const INITIAL_CCG_DATA = {"meta": {"game": "卡牌构筑对战", "version": "2.5", "exportedAt": "2026-11-14T14:22:28.733Z", "count": 141}, "rules": {"hp": 20, "columns": 5, "openingHand": 4, "handLimit": 10, "energyStart": 1, "energyMax": 10, "deckSize": 40, "copiesPerCard": 3}, "cards": [{"id": "cmwas0lke5oiw", "name": "高性能引擎机甲", "en": "", "type": "minion", "rarity": "史诗", "race": "机械", "sacrificeCond": "机械", "faith": 0, "counter": 0, "energy": 5, "sacrifice": 3, "bones": 0, "atk": 4, "hp": 4, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "", "choice": {"on": true, "opts": [{"t": "", "reans": [{"k": "招募", "costs": {"energy": 4, "sacrifice": 0, "bones": 0, "value": 0}, "type": "机械", "effect": "，发动两次。"}]}, {"t": "", "reans": [{"k": "亡者召还", "costs": {"energy": 4, "sacrifice": 0, "bones": 0, "value": 0}, "type": "机械", "effect": "，发动两次。"}]}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 9.5, "timerEffect": "", "fusion": null, "fullText": "【入场曲】【抉择】选择1个能力发动：\n（1）【招募_能量4】仅限「机械」，发动2次；\n（2）【亡者召还_能量4】仅限「机械」，发动2次。"}, {"id": "cmwat3dbzstsr", "name": "巨型秃鹫", "en": "", "type": "minion", "rarity": "普通", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 0, "sacrifice": 0, "bones": 6, "atk": 3, "hp": 3, "timer": 0, "keywords": [{"k": "飞行", "v": 0, "effect": ""}], "text": "", "flavor": "", "notes": "对于不怎么用骨头作为主要费用的卡组来说，带这个能用骨头抢血", "art": "", "value": 3, "timerEffect": "", "fusion": null, "fullText": "【飞行】"}, {"id": "cmwata95yc8j5", "name": "被献祭的松鼠", "en": "", "type": "minion", "rarity": "普通", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 0, "sacrifice": 0, "bones": 0, "atk": 0, "hp": 1, "timer": 0, "keywords": [], "text": "", "flavor": "", "notes": "纯粹的祭品，没有费用", "art": "", "value": 0, "timerEffect": "", "fusion": null, "fullText": ""}, {"id": "cmwbvfqe5en3l", "name": "通用载人机甲", "en": "", "type": "minion", "rarity": "稀有", "race": "机械", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 4, "sacrifice": 0, "bones": 0, "atk": 2, "hp": 2, "timer": 0, "keywords": [{"k": "谢幕曲", "v": 0, "effect": "", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": [{"k": "招募", "costs": {"energy": 2, "sacrifice": 0, "bones": 0, "value": 0}, "type": "", "effect": ""}]}], "text": "", "flavor": "", "notes": "多频率的随从适合用于祭品", "art": "", "value": 4, "timerEffect": "", "fusion": null, "fullText": "【谢幕曲】【招募_能量2】"}, {"id": "cmwbvnpfgwo7a", "name": "铁皮打手", "en": "", "type": "minion", "rarity": "普通", "race": "机械", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 4, "sacrifice": 0, "bones": 0, "atk": 4, "hp": 5, "timer": 0, "keywords": [{"k": "谢幕曲", "v": 0, "effect": "将一张『电子羊』加入手牌中", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "填补4费机械身材不足的空位", "art": "", "value": 4, "timerEffect": "", "fusion": null, "fullText": "【谢幕曲】将1张『电子羊』加入自己的手牌。"}, {"id": "cmwbwda72g49w", "name": "碎甲刃机", "en": "", "type": "minion", "rarity": "普通", "race": "机械", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 4, "sacrifice": 0, "bones": 0, "atk": 3, "hp": 2, "timer": 0, "keywords": [{"k": "毁灭", "v": 0, "effect": ""}], "text": "", "flavor": "", "notes": "数值可能需要调整", "art": "", "value": 4, "timerEffect": "", "fusion": null, "fullText": "【毁灭】"}, {"id": "cmwbwg3kwqfkq", "name": "飞轮信使", "en": "", "type": "minion", "rarity": "稀有", "race": "机械", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 2, "sacrifice": 0, "bones": 0, "atk": 2, "hp": 2, "timer": 0, "keywords": [{"k": "谢幕曲", "v": 0, "effect": "下个回合开始时，从牌库抽取一张机械随从", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 2, "timerEffect": "", "fusion": null, "fullText": "【谢幕曲】下个回合开始时，从自己的牌库中抽取1张机械随从卡。"}, {"id": "cmwbwne297mmg", "name": "发条侍从", "en": "", "type": "minion", "rarity": "普通", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 2, "sacrifice": 0, "bones": 0, "atk": 2, "hp": 2, "timer": 0, "keywords": [{"k": "谢幕曲", "v": 0, "effect": "将一张『电子羊』加入手牌中", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 2, "timerEffect": "", "fusion": null, "fullText": "【谢幕曲】将1张『电子羊』加入自己的手牌。"}, {"id": "cmwbx0mq8qz7f", "name": "魔导机兵少女", "en": "", "type": "minion", "rarity": "传说", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 6, "sacrifice": 0, "bones": 0, "atk": 4, "hp": 6, "timer": 0, "keywords": [{"k": "瞬念召唤", "v": 0, "effect": "如果己方场上拥有5个机械随从，破坏全部随从，将一张魔导机械少女召唤到场上，并获得【攻击时：对敌方随从全体造成4点伤害】", "when": "end"}, {"k": "飞行", "v": 0, "effect": ""}], "text": "", "flavor": "", "notes": "", "art": "", "value": 6, "timerEffect": "", "fusion": null, "fullText": "【飞行】\n【瞬念召唤】回合结束时，若己方战场上共有5个机械随从，则破坏己方战场上的全体随从，将1张『魔导机兵少女』召唤到战场上，使其获得「【攻击时】对敌方战场上的全体随从造成4点伤害」并立即发动攻击。"}, {"id": "cmwbxdn7tcvde", "name": "滑板跃迁手", "en": "", "type": "minion", "rarity": "普通", "race": "机械", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 1, "sacrifice": 0, "bones": 0, "atk": 1, "hp": 1, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "选择一张手牌，将其洗入牌库中，抽取一张卡牌", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 1, "timerEffect": "", "fusion": null, "fullText": "【入场曲】选择自己手牌中的1张其他卡牌洗入牌库，并抽取1张卡牌。"}, {"id": "cmwbxu7u3tpyo", "name": "赛博牧羊人", "en": "", "type": "minion", "rarity": "稀有", "race": "机械", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 2, "sacrifice": 0, "bones": 0, "atk": 2, "hp": 2, "timer": 0, "keywords": [{"k": "启动", "v": 0, "effect": "将2张『电子羊』加入手牌。", "cost": {"energy": 1, "sacrifice": 0, "bones": 0}, "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "每当机械随从进入战场时，使其获得1/1。", "flavor": "", "notes": "", "art": "", "value": 2, "timerEffect": "", "fusion": null, "fullText": "每当其他己方机械随从进入战场时，使其获得+1/+1。\n【启动】能量1：将2张『电子羊』加入自己的手牌。"}, {"id": "cmwby0dy7g2pc", "name": "电子羊", "en": "", "type": "minion", "rarity": "普通", "race": "机械", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 1, "sacrifice": 0, "bones": 0, "atk": 1, "hp": 1, "timer": 0, "keywords": [], "text": "", "flavor": "", "notes": "衍生物", "art": "", "value": 1, "timerEffect": "", "fusion": null, "fullText": ""}, {"id": "cmwby8v9c918f", "name": "爆炸羊狂热者", "en": "", "type": "minion", "rarity": "史诗", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 3, "sacrifice": 0, "bones": 0, "atk": 3, "hp": 3, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "给予手牌中所有『电子羊』谢幕曲【对对手的战场上的所有随从和对手的主战者分配2点伤害】", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 3, "timerEffect": "", "fusion": null, "fullText": "【入场曲】使自己手牌中的所有『电子羊』获得「【谢幕曲】对敌方战场上的所有随从和敌方主战者分配2点伤害」。"}, {"id": "cmwbyhrbei4w8", "name": "增殖机甲", "en": "", "type": "minion", "rarity": "普通", "race": "机械", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 3, "sacrifice": 0, "bones": 0, "atk": 2, "hp": 2, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "召唤一张和增殖机甲同名的卡牌加入战场", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 3, "timerEffect": "", "fusion": null, "fullText": "【入场曲】召唤1个『增殖机甲』到己方战场上。"}, {"id": "cmwbyp6f419ju", "name": "摇滚骷髅吉他手", "en": "", "type": "minion", "rarity": "传说", "race": "亡灵", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 0, "sacrifice": 0, "bones": 20, "atk": 4, "hp": 2, "timer": 0, "keywords": [{"k": "瞬念召唤", "v": 0, "effect": "若本次对战中自己被破坏的具有谢幕曲的随从大于10个，将本卡牌召唤到战场上。", "when": "end"}, {"k": "随从进场时", "v": 0, "effect": "召唤四个『骷髅』到战场上", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}, {"k": "谢幕曲", "v": 0, "effect": "召唤四个『骷髅』到战场上", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 10, "timerEffect": "", "fusion": null, "fullText": "【随从进场时】召唤4个『骷髅』到己方战场上。\n【谢幕曲】召唤4个『骷髅』到己方战场上。\n【瞬念召唤】回合结束时，若本局对战中己方已破坏的具有【谢幕曲】的随从为10个以上，则将本卡牌从牌库召唤到己方战场上。"}, {"id": "cmwbz08a6fv59", "name": "骸骨巨人", "en": "", "type": "minion", "rarity": "普通", "race": "亡灵", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 0, "sacrifice": 0, "bones": 8, "atk": 5, "hp": 5, "timer": 0, "keywords": [], "text": "", "flavor": "", "notes": "", "art": "", "value": 4, "timerEffect": "", "fusion": null, "fullText": ""}, {"id": "cmwbz163tt1ma", "name": "使命必达小子", "en": "", "type": "minion", "rarity": "普通", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 1, "sacrifice": 0, "bones": 0, "atk": 1, "hp": 1, "timer": 0, "keywords": [], "text": "该卡牌必定会出现在未洗牌前的起手手牌中", "flavor": "", "notes": "", "art": "", "value": 1, "timerEffect": "", "fusion": null, "fullText": "对战开始时，本卡牌必定出现在起手初始手牌中。"}, {"id": "cmwc0a6dn4bel", "name": "骷髅", "en": "", "type": "minion", "rarity": "普通", "race": "亡灵", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 0, "sacrifice": 0, "bones": 1, "atk": 1, "hp": 1, "timer": 0, "keywords": [], "text": "", "flavor": "", "notes": "衍生物", "art": "", "value": 0.5, "timerEffect": "", "fusion": null, "fullText": ""}, {"id": "cmwc0auyporsj", "name": "骸骨兽", "en": "", "type": "minion", "rarity": "普通", "race": "亡灵", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 3, "sacrifice": 0, "bones": 0, "atk": 1, "hp": 1, "timer": 0, "keywords": [{"k": "谢幕曲", "v": 0, "effect": "召唤两个『骷髅』到战场上", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 3, "timerEffect": "", "fusion": null, "fullText": "【谢幕曲】召唤2个『骷髅』到己方战场上。"}, {"id": "cmwc0t61ade7b", "name": "血偿者", "en": "", "type": "minion", "rarity": "传说", "race": "亡灵", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 2, "sacrifice": 1, "bones": 2, "atk": 1, "hp": 1, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "抽取1张卡牌，选择对手的战场上的1个随从，对其造成3点伤害。", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}, {"k": "谢幕曲", "v": 0, "effect": "抽取1张卡牌。", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 4.5, "timerEffect": "", "fusion": null, "fullText": "【入场曲】抽取1张卡牌；选择敌方战场上的1个随从，对其造成3点伤害。\n【谢幕曲】抽取1张卡牌。"}, {"id": "cmwc2n4p68ewm", "name": "装甲堡垒", "en": "", "type": "minion", "rarity": "稀有", "race": "机械", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 5, "sacrifice": 0, "bones": 0, "atk": 4, "hp": 5, "timer": 0, "keywords": [{"k": "守护", "v": 0, "effect": ""}, {"k": "入场曲", "v": 0, "effect": "若你手牌中的机械卡大于6张，召唤3个『电子羊』并使场上所有『电子羊』获得守护。", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 5, "timerEffect": "", "fusion": null, "fullText": "【守护】\n【入场曲】若打出后自己手牌中的机械卡牌为6张以上，则召唤3个『电子羊』到己方战场上，并使己方战场上的所有『电子羊』获得【守护】。"}, {"id": "cmwc2wbcgbqvl", "name": "铜壳瓢虫", "en": "", "type": "minion", "rarity": "普通", "race": "机械", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 1, "sacrifice": 0, "bones": 0, "atk": 1, "hp": 1, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "你使用的下一场机械随从卡能量-1。", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 1, "timerEffect": "", "fusion": null, "fullText": "【入场曲】使自己本回合下一张打出的机械随从卡能量费用-1。"}, {"id": "cmwc2zlhaxdtj", "name": "齿轮学徒", "en": "", "type": "minion", "rarity": "普通", "race": "机械", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 1, "sacrifice": 0, "bones": 0, "atk": 1, "hp": 1, "timer": 0, "keywords": [{"k": "谢幕曲", "v": 0, "effect": "将1张『电子羊』加入己方手牌", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 1, "timerEffect": "", "fusion": null, "fullText": "【谢幕曲】将1张『电子羊』加入自己的手牌。"}, {"id": "cmwc33vo8ohrw", "name": "发条龙", "en": "", "type": "minion", "rarity": "稀有", "race": "机械，龙族", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 6, "sacrifice": 0, "bones": 0, "atk": 6, "hp": 5, "timer": 0, "keywords": [{"k": "谢幕曲", "v": 0, "effect": "召唤2个『电子羊』到战场上", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 6, "timerEffect": "", "fusion": null, "fullText": "【谢幕曲】召唤2个『电子羊』到己方战场上。"}, {"id": "cmwc3gozg0rat", "name": "超载机皇", "en": "", "type": "minion", "rarity": "传说", "race": "机械", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 7, "sacrifice": 0, "bones": 0, "atk": 4, "hp": 7, "timer": 0, "keywords": [{"k": "防空", "v": 0, "effect": ""}, {"k": "入场曲", "v": 0, "effect": "", "choice": {"on": true, "opts": [{"t": "其他机械随从获得+2/+2", "reans": []}, {"t": "对随机3个敌方随从造成x点伤害，x等于手牌中机械卡的张数", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 7, "timerEffect": "", "fusion": null, "fullText": "【防空】\n【入场曲】【抉择】选择1个能力发动：\n（1）使己方战场上的所有其他机械随从获得+2/+2；\n（2）对敌方战场上的最多3个随从各造成X点伤害（X为自己手牌中的机械卡牌张数）。"}, {"id": "cmwc3or2zf7ft", "name": "万齿战车", "en": "", "type": "minion", "rarity": "传说", "race": "机械", "sacrificeCond": "机械", "faith": 0, "counter": 0, "energy": 8, "sacrifice": 3, "bones": 0, "atk": 8, "hp": 10, "timer": 0, "keywords": [{"k": "谢幕曲", "v": 0, "effect": "", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": [{"k": "亡者召还", "costs": {"energy": 6, "sacrifice": 0, "bones": 0, "value": 0}, "type": "机械", "effect": ""}, {"k": "亡者召还", "costs": {"energy": 4, "sacrifice": 0, "bones": 0, "value": 0}, "type": "机械", "effect": ""}, {"k": "亡者召还", "costs": {"energy": 2, "sacrifice": 0, "bones": 0, "value": 0}, "type": "机械", "effect": ""}]}], "text": "", "flavor": "", "notes": "", "art": "", "value": 12.5, "timerEffect": "", "fusion": null, "fullText": "【谢幕曲】【亡者召还_能量6】仅限「机械」；【亡者召还_能量4】仅限「机械」；【亡者召还_能量2】仅限「机械」。"}, {"id": "cmwc8tup5d1xt", "name": "磁力拼装机械", "en": "", "type": "minion", "rarity": "史诗", "race": "机械", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 6, "sacrifice": 0, "bones": 0, "atk": 6, "hp": 6, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "若你手牌中的机械卡大于6张，随机从守护、飞行、防空、灵气、【毁灭】、虹吸、位移、【屏障】中获得三个词条。", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 6, "timerEffect": "", "fusion": null, "fullText": "【入场曲】若打出后自己手牌中的机械卡牌为6张以上，则随机获得【守护】【飞行】【防空】【灵气】【毁灭】【虹吸】【位移】【屏障】中的3个词条。"}, {"id": "cmwc96kid9cw4", "name": "掘墓者", "en": "", "type": "minion", "rarity": "普通", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 1, "sacrifice": 0, "bones": 0, "atk": 1, "hp": 2, "timer": 0, "keywords": [{"k": "回合结束时", "v": 0, "effect": "骨头+1", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 1, "timerEffect": "", "fusion": null, "fullText": "【回合结束时】使自己的骨头+1。"}, {"id": "cmwc97xb64vc6", "name": "尸兵", "en": "", "type": "minion", "rarity": "普通", "race": "亡灵", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 2, "sacrifice": 0, "bones": 0, "atk": 2, "hp": 2, "timer": 0, "keywords": [{"k": "谢幕曲", "v": 0, "effect": "骨头+2", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 2, "timerEffect": "", "fusion": null, "fullText": "【谢幕曲】使自己的骨头+2。"}, {"id": "cmwc998a8rnwf", "name": "刺盾少女", "en": "", "type": "minion", "rarity": "普通", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 2, "sacrifice": 0, "bones": 0, "atk": 0, "hp": 5, "timer": 0, "keywords": [{"k": "荆棘", "v": 2, "effect": ""}, {"k": "防空", "v": 0, "effect": ""}], "text": "", "flavor": "", "notes": "", "art": "", "value": 2, "timerEffect": "", "fusion": null, "fullText": "荆棘_2"}, {"id": "cmwc9mbry93dx", "name": "骸骨犬", "en": "", "type": "minion", "rarity": "普通", "race": "亡灵", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 0, "sacrifice": 0, "bones": 4, "atk": 2, "hp": 1, "timer": 0, "keywords": [{"k": "谢幕曲", "v": 0, "effect": "骨头+2", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 2, "timerEffect": "", "fusion": null, "fullText": "【谢幕曲】使自己的骨头+2。"}, {"id": "cmwc9ua0fd6of", "name": "骨龙", "en": "", "type": "minion", "rarity": "稀有", "race": "亡灵，龙族", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 0, "sacrifice": 0, "bones": 10, "atk": 5, "hp": 3, "timer": 0, "keywords": [{"k": "谢幕曲", "v": 0, "effect": "骨头+5，将1张和骨龙同名的随从加入手牌", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 5, "timerEffect": "", "fusion": null, "fullText": "【谢幕曲】使自己的骨头+5，并将1张『骨龙』加入自己的手牌。"}, {"id": "cmwcae3tnsr81", "name": "坚定守护者", "en": "", "type": "minion", "rarity": "普通", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 2, "sacrifice": 0, "bones": 0, "atk": 0, "hp": 6, "timer": 0, "keywords": [{"k": "守护", "v": 0, "effect": ""}], "text": "", "flavor": "", "notes": "", "art": "", "value": 2, "timerEffect": "", "fusion": null, "fullText": "【守护】"}, {"id": "cmwcah8st1lar", "name": "神圣法典", "en": "", "type": "spell", "rarity": "普通", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 2, "sacrifice": 0, "bones": 0, "atk": 2, "hp": 3, "timer": 0, "keywords": [], "text": "选择1个生命值3以下敌方随从，使其消失", "flavor": "", "notes": "", "art": "", "value": 2, "timerEffect": "", "fusion": null, "fullText": "选择敌方战场上1个生命值为3以下的随从，使其【消失】。"}, {"id": "cmwcalky6itcu", "name": "烟消云散", "en": "", "type": "spell", "rarity": "普通", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 5, "sacrifice": 0, "bones": 0, "atk": 2, "hp": 3, "timer": 0, "keywords": [], "text": "选择1个敌方随从使其及其同名的敌方随从消失。", "flavor": "", "notes": "", "art": "", "value": 5, "timerEffect": "", "fusion": null, "fullText": "选择敌方战场上的1个随从，使其以及敌方战场上所有与其同名的随从全部【消失】。"}, {"id": "cmwcaqbzuvvcx", "name": "转生苹果", "en": "", "type": "spell", "rarity": "史诗", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 2, "sacrifice": 0, "bones": 0, "atk": 0, "hp": 0, "timer": 0, "keywords": [], "text": "选择1个友方随从，使其获得谢幕曲【召唤1个自己同名的随从到战场上】", "flavor": "", "notes": "", "art": "", "value": 2, "timerEffect": "", "fusion": null, "fullText": "选择己方战场上的1个随从，使其获得「【谢幕曲】召唤1个与本随从同名的随从到己方战场上」。"}, {"id": "cmwcb1izpxl7e", "name": "连锁飞刃", "en": "", "type": "spell", "rarity": "普通", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 2, "sacrifice": 0, "bones": 0, "atk": 2, "hp": 3, "timer": 0, "keywords": [{"k": "连击", "v": 3, "effect": "改为造成5点伤害", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "选择1个敌方随从，对其造成3点伤害。", "flavor": "", "notes": "", "art": "", "value": 2, "timerEffect": "", "fusion": null, "fullText": "选择敌方战场上的1个随从，对其造成3点伤害。\n【连击_3】改为对其造成5点伤害。"}, {"id": "cmwcba1blx523", "name": "炽炎之术", "en": "", "type": "spell", "rarity": "普通", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 2, "sacrifice": 0, "bones": 0, "atk": 2, "hp": 3, "timer": 0, "keywords": [{"k": "爆能强化", "v": 5, "effect": "改为对敌方随从全体造成3点伤害", "res": "能量", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "选择1个敌方随从，对其造成3点伤害。", "flavor": "", "notes": "", "art": "", "value": 2, "timerEffect": "", "fusion": null, "fullText": "选择敌方战场上的1个随从，对其造成3点伤害。\n【爆能强化_能量5】改为对敌方战场上的全体随从造成3点伤害。"}, {"id": "cmwd6senq6s04", "name": "守护世界的女神官", "en": "", "type": "minion", "rarity": "普通", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 6, "sacrifice": 0, "bones": 0, "atk": 3, "hp": 6, "timer": 0, "keywords": [{"k": "守护", "v": 0, "effect": ""}, {"k": "防空", "v": 0, "effect": ""}, {"k": "屏障", "v": 0, "effect": ""}, {"k": "虹吸", "v": 0, "effect": ""}], "text": "", "flavor": "", "notes": "", "art": "", "value": 6, "timerEffect": "", "fusion": null, "fullText": "【守护】【防空】【屏障】【虹吸】"}, {"id": "cmwd6zdfog6ux", "name": "随机应变", "en": "", "type": "spell", "rarity": "史诗", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 3, "sacrifice": 0, "bones": 0, "atk": 2, "hp": 3, "timer": 0, "keywords": [{"k": "融合", "v": 0, "effect": "融合时该卡牌能量-1。", "fcond": "", "ftype": "卡牌"}], "text": "抽取2张卡牌。", "flavor": "", "notes": "", "art": "", "value": 3, "timerEffect": "", "fusion": {"cond": "", "type": "卡牌", "effect": "融合时该卡牌能量-1。"}, "fullText": "【融合】「任意卡牌」：每融合1张卡牌，使本卡牌的能量费用-1。\n抽取2张卡牌。"}, {"id": "cmwdhxmybo4y2", "name": "迅捷的侠盗", "en": "", "type": "minion", "rarity": "普通", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 3, "sacrifice": 0, "bones": 0, "atk": 3, "hp": 2, "timer": 0, "keywords": [{"k": "连击", "v": 3, "effect": "获得两侧攻击", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 3, "timerEffect": "", "fusion": null, "fullText": "【连击_3】获得【两侧攻击】。"}, {"id": "cmwdi4pwz3c0k", "name": "废物利用", "en": "", "type": "spell", "rarity": "稀有", "race": "机械", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 3, "sacrifice": 0, "bones": 0, "atk": 2, "hp": 3, "timer": 0, "keywords": [{"k": "融合", "v": 0, "effect": "抽取2张机械卡牌。若已与本卡牌【融合】，则召唤两个『电子羊』到战场上。", "fcond": "机械", "ftype": "卡牌"}], "text": "", "flavor": "", "notes": "", "art": "", "value": 3, "timerEffect": "", "fusion": {"cond": "机械", "type": "卡牌", "effect": "抽取2张机械卡牌。若已与本卡牌【融合】，则召唤两个电子羊到战场上。"}, "fullText": "【融合】「机械卡牌」\n从牌库中抽取2张机械卡牌。若本卡牌已进行过【融合】，则额外召唤2个『电子羊』到己方战场上。"}, {"id": "cmwdibvlbqmxv", "name": "引导胜利的指挥官", "en": "", "type": "minion", "rarity": "传说", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 3, "sacrifice": 0, "bones": 0, "atk": 3, "hp": 3, "timer": 0, "keywords": [{"k": "融合", "v": 0, "effect": "原始费用3以下·卡牌。", "fcond": "机械", "ftype": "卡牌"}, {"k": "入场曲", "v": 0, "effect": "", "choice": {"on": true, "opts": [{"t": "抽取等同于融合张数的卡牌", "reans": []}, {"t": "获得守护，每融合一张卡牌，则获得+1/+2并回复主战者1点生命值", "reans": []}, {"t": "若融合张数大于3，获得多重攻击和【毁灭】", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 3, "timerEffect": "", "fusion": {"cond": "机械", "type": "卡牌", "effect": "原始费用3以下·卡牌。"}, "fullText": "【融合】「原始能量费用为3以下的卡牌」\n【入场曲】【抉择】选择1个能力发动：\n（1）抽取等同于本卡牌已融合张数的卡牌；\n（2）获得【守护】，每融合1张卡牌便额外获得+1/+2并回复己方主战者1点生命值；\n（3）若本卡牌已融合3张以上，则获得【多重攻击_2】与【毁灭】。"}, {"id": "cmwdtm73fwg1u", "name": "雏龙的蛋", "en": "", "type": "minion", "rarity": "普通", "race": "龙族", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 1, "sacrifice": 0, "bones": 0, "atk": 0, "hp": 3, "timer": 0, "keywords": [{"k": "倒计时", "v": 1, "effect": "变身为『雏龙』"}], "text": "", "flavor": "", "notes": "", "art": "", "value": 1, "timerEffect": "变身为雏龙", "fusion": null, "fullText": "【倒计时_1】倒计时结束时，使本随从变身为『雏龙』。"}, {"id": "cmwdts32am05i", "name": "雏龙", "en": "", "type": "minion", "rarity": "普通", "race": "龙族", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 0, "sacrifice": 1, "bones": 0, "atk": 1, "hp": 1, "timer": 0, "keywords": [{"k": "倒计时", "v": 1, "effect": "变身为喷火龙"}, {"k": "攻击时", "v": 0, "effect": "对面前敌人造成1点伤害", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 1.5, "timerEffect": "变身为喷火龙", "fusion": null, "fullText": "【倒计时_1】倒计时结束时，使本随从变身为『喷火龙』。\n【攻击时】对正对面的敌方随从造成1点伤害。"}, {"id": "cmwdtq4q7c8pe", "name": "喷火龙", "en": "", "type": "minion", "rarity": "普通", "race": "龙族", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 0, "sacrifice": 2, "bones": 2, "atk": 3, "hp": 2, "timer": 0, "keywords": [{"k": "飞行", "v": 0, "effect": ""}, {"k": "攻击时", "v": 0, "effect": "对面前的随从造成3点伤害", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}, {"k": "倒计时", "v": 2, "effect": "变身为飞龙"}], "text": "", "flavor": "", "notes": "", "art": "", "value": 4, "timerEffect": "变身为飞龙", "fusion": null, "fullText": "【飞行】【倒计时_2】倒计时结束时，使本随从变身为『飞龙』。\n【攻击时】对正对面的敌方随从造成3点伤害。"}, {"id": "cmwdui6uam6xe", "name": "飞龙", "en": "", "type": "minion", "rarity": "稀有", "race": "龙族", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 0, "sacrifice": 3, "bones": 7, "atk": 5, "hp": 5, "timer": 0, "keywords": [{"k": "飞行", "v": 0, "effect": ""}, {"k": "倒计时", "v": 2, "effect": "变身为远古巨龙"}, {"k": "攻击时", "v": 0, "effect": "对面前的随从造成5点伤害", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 8, "timerEffect": "变身为远古巨龙", "fusion": null, "fullText": "【飞行】【倒计时_2】倒计时结束时，使本随从变身为『远古巨龙』。\n【攻击时】对正对面的敌方随从造成5点伤害。"}, {"id": "cmwdukf0l090w", "name": "远古巨龙", "en": "", "type": "minion", "rarity": "史诗", "race": "龙族", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 0, "sacrifice": 4, "bones": 12, "atk": 7, "hp": 7, "timer": 0, "keywords": [{"k": "飞行", "v": 0, "effect": ""}, {"k": "攻击时", "v": 0, "effect": "对面前及相邻随从造成5点伤害", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}, {"k": "倒计时", "v": 3, "effect": "变身为终焉之龙"}], "text": "", "flavor": "", "notes": "", "art": "", "value": 12, "timerEffect": "变身为终焉之龙", "fusion": null, "fullText": "【飞行】【倒计时_3】倒计时结束时，使本随从变身为『终焉之龙』。\n【攻击时】对正对面与左右相邻三列的敌方随从造成5点伤害。"}, {"id": "cmwdv3usmmzyp", "name": "终焉之龙", "en": "", "type": "minion", "rarity": "传说", "race": "龙族", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 0, "sacrifice": 5, "bones": 30, "atk": 8, "hp": 10, "timer": 0, "keywords": [{"k": "飞行", "v": 0, "effect": ""}, {"k": "攻击时", "v": 0, "effect": "对敌方战场上所有随从造成8点伤害", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}, {"k": "多重攻击", "v": 2, "effect": ""}], "text": "", "flavor": "", "notes": "", "art": "", "value": 22.5, "timerEffect": "", "fusion": null, "fullText": "【飞行】【多重攻击_2】\n【攻击时】对敌方战场上的全体随从造成8点伤害。"}, {"id": "cmwdvbzosilgg", "name": "祷告的圣女", "en": "", "type": "minion", "rarity": "稀有", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 2, "sacrifice": 0, "bones": 0, "atk": 1, "hp": 2, "timer": 0, "keywords": [{"k": "守护", "v": 0, "effect": ""}, {"k": "入场曲", "v": 0, "effect": "选择战场上1张具有倒计时的己方卡牌，使其倒计时-1", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 2, "timerEffect": "", "fusion": null, "fullText": "【守护】\n【入场曲】选择己方战场上的1张具有倒计时的卡牌，使其倒计时-1。"}, {"id": "cmwdvhcrr8g9v", "name": "快速孵化", "en": "", "type": "spell", "rarity": "普通", "race": "龙族", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 2, "sacrifice": 0, "bones": 0, "atk": 2, "hp": 3, "timer": 0, "keywords": [], "text": "选择战场上1张具有倒计时的己方卡牌，使其倒计时-1，抽1张牌。", "flavor": "", "notes": "", "art": "", "value": 2, "timerEffect": "", "fusion": null, "fullText": "选择己方战场上的1张具有倒计时的卡牌，使其倒计时-1，并抽取1张卡牌。"}, {"id": "cmwdvmwjm0301", "name": "丢失的龙蛋", "en": "", "type": "spell", "rarity": "稀有", "race": "龙族", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 3, "sacrifice": 0, "bones": 0, "atk": 2, "hp": 3, "timer": 0, "keywords": [], "text": "召唤两个雏龙的蛋", "flavor": "", "notes": "", "art": "", "value": 3, "timerEffect": "", "fusion": null, "fullText": "召唤2个『雏龙的蛋』到己方战场上。"}, {"id": "cmwdvop6hshsy", "name": "龙骑士", "en": "", "type": "minion", "rarity": "普通", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 3, "sacrifice": 0, "bones": 0, "atk": 2, "hp": 3, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "若战场上有己方龙族随从，则获得+1/+2和守护", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 3, "timerEffect": "", "fusion": null, "fullText": "【入场曲】若己方战场上有其他龙族随从，则本随从获得+1/+2与【守护】。"}, {"id": "cmwdvrwfcy5gg", "name": "孵化装置", "en": "", "type": "amulet", "rarity": "稀有", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 3, "sacrifice": 0, "bones": 0, "atk": 2, "hp": 3, "timer": 6, "keywords": [], "text": "卡牌进入己方战场时，若其具有倒计时，使其倒计时-1且本卡牌倒计时-1", "flavor": "", "notes": "", "art": "", "value": 3, "timerEffect": "", "fusion": null, "fullText": "【倒计时_6】\n每当具有倒计时的己方卡牌进入战场时，使其倒计时-1，并使本护符的倒计时-1。"}, {"id": "cmwdw1gnfmjtt", "name": "鞭策", "en": "", "type": "spell", "rarity": "普通", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 2, "sacrifice": 0, "bones": 0, "atk": 2, "hp": 3, "timer": 0, "keywords": [], "text": "选择战场上的一个随从，使其获得+2/-2。", "flavor": "", "notes": "", "art": "", "value": 2, "timerEffect": "", "fusion": null, "fullText": "选择战场上的1个随从，使其获得+2/-2（无视【屏障】且直接扣减生命值上限）。"}, {"id": "cmwdw2v21c73r", "name": "驯龙师", "en": "", "type": "minion", "rarity": "稀有", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 2, "sacrifice": 0, "bones": 0, "atk": 1, "hp": 3, "timer": 0, "keywords": [], "text": "龙族随从进入战场时，使其获得+1/1", "flavor": "", "notes": "", "art": "", "value": 2, "timerEffect": "", "fusion": null, "fullText": "每当己方龙族随从进入战场时，使其获得+1/+1。"}, {"id": "cmwdw5qt6cbqb", "name": "无畏的飞龙骑手", "en": "", "type": "minion", "rarity": "传说", "race": "龙族", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 4, "sacrifice": 0, "bones": 0, "atk": 2, "hp": 3, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "使自己获得纹章【纹章：无畏的飞龙骑手】。纹章：倒计时2，回合结束时，召唤1个『雏龙的蛋』到己方战场上。", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}, {"k": "防空", "v": 0, "effect": ""}, {"k": "守护", "v": 0, "effect": ""}, {"k": "启动", "v": 0, "effect": "使【纹章：无畏的飞龙骑手】的倒计时+1.", "cost": {"energy": 1, "sacrifice": 0, "bones": 0}, "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 4, "timerEffect": "", "fusion": null, "fullText": "【守护】【防空】\n【入场曲】使己方主战者获得【纹章：无畏的飞龙骑手】（倒计时2：回合结束时，召唤1个『雏龙的蛋』到己方战场上）。\n【启动】能量1：使己方【纹章：无畏的飞龙骑手】的倒计时+1。"}, {"id": "cmwdwpfyd4xpp", "name": "慈爱的龙母", "en": "", "type": "minion", "rarity": "史诗", "race": "龙族", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 3, "sacrifice": 0, "bones": 4, "atk": 3, "hp": 3, "timer": 0, "keywords": [{"k": "守护", "v": 0, "effect": ""}, {"k": "入场曲", "v": 0, "effect": "战场上的所有己方龙族卡牌倒计时-1", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 5, "timerEffect": "", "fusion": null, "fullText": "【守护】\n【入场曲】使己方战场上的所有龙族卡牌倒计时-1。"}, {"id": "cmwdwtfm8xm5c", "name": "流淌龙血的侠客", "en": "", "type": "minion", "rarity": "传说", "race": "龙族", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 5, "sacrifice": 0, "bones": 0, "atk": 5, "hp": 5, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "若战场上有己方龙族随从，使自己的最大能量值+1。", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}, {"k": "爆能强化", "v": 8, "effect": "对敌方所有随从造成x点伤害，x为自己手牌中龙族卡牌张数。", "res": "能量", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 5, "timerEffect": "", "fusion": null, "fullText": "【入场曲】若己方战场上有其他龙族随从，则使自己的最大能量值+1（上限为10）。\n【爆能强化_能量8】对敌方战场上的全体随从造成X点伤害（X为自己手牌中的龙族卡牌张数）。"}, {"id": "cmwdx7vx7izcu", "name": "龙鳞锻造师", "en": "", "type": "minion", "rarity": "普通", "race": "龙族", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 4, "sacrifice": 0, "bones": 3, "atk": 3, "hp": 4, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "选择己方战场上的1个龙族随从，使其获得+2/+2", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 5.5, "timerEffect": "", "fusion": null, "fullText": "【入场曲】选择己方战场上的1个其他龙族随从，使其获得+2/+2。"}, {"id": "cmwdxic8z9f73", "name": "翱翔天际的龙骑手", "en": "", "type": "minion", "rarity": "普通", "race": "龙族", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 6, "sacrifice": 0, "bones": 0, "atk": 3, "hp": 6, "timer": 0, "keywords": [{"k": "飞行", "v": 0, "effect": ""}, {"k": "防空", "v": 0, "effect": ""}, {"k": "多重攻击", "v": 2, "effect": ""}], "text": "", "flavor": "", "notes": "", "art": "", "value": 6, "timerEffect": "", "fusion": null, "fullText": "【飞行】【防空】【多重攻击_2】"}, {"id": "cmwdxmxskfby0", "name": "飞龙峡谷", "en": "", "type": "amulet", "rarity": "史诗", "race": "龙族", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 7, "sacrifice": 0, "bones": 12, "atk": 2, "hp": 3, "timer": 0, "keywords": [{"k": "倒计时", "v": 3, "effect": ""}], "text": "回合结束时，召唤1个飞龙到己方战场上。", "flavor": "", "notes": "", "art": "", "value": 13, "timerEffect": "", "fusion": null, "fullText": "【倒计时_3】\n【回合结束时】召唤1个『飞龙』到己方战场上。"}, {"id": "cmwdxt4vgtk9g", "name": "八岐大蛇", "en": "", "type": "minion", "rarity": "传说", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 7, "sacrifice": 4, "bones": 0, "atk": 5, "hp": 5, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "获得双重攻击。消耗10骨头召唤1个八岐大蛇同名的随从到己方战场，重复此过程直到随从上限。进入战场的八岐大蛇依次获得以下效果【获得守护、防空、【屏障】|获得【毁灭】、灵气、荆棘5|获得虹吸|获得两侧攻击】", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 13, "timerEffect": "", "fusion": null, "fullText": "【入场曲】本随从获得【多重攻击_2】；消耗10点骨头召唤1个『八岐大蛇』到己方战场上，重复此过程直到随从上限。以此法进入战场的『八岐大蛇』依次获得：①【守护】【防空】【屏障】；②【毁灭】【灵气】【荆棘_5】；③【虹吸】；④【两侧攻击】。"}, {"id": "cmwdyxl33lchi", "name": "满腔热血的霸者", "en": "", "type": "minion", "rarity": "传说", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 7, "sacrifice": 2, "bones": 0, "atk": 8, "hp": 8, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "若你手牌中费用7以上的随从有3张以上，使你手牌中的所有随从获得+2/+2。", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 10, "timerEffect": "", "fusion": null, "fullText": "【入场曲】若打出后自己手牌中原始能量费用为7以上的随从卡有3张以上，则使自己手牌中的所有随从卡获得+2/+2。"}, {"id": "cmwdz3reuida0", "name": "孵化万物的龙女", "en": "", "type": "minion", "rarity": "传说", "race": "龙族", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 8, "sacrifice": 3, "bones": 0, "atk": 2, "hp": 6, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "", "choice": {"on": true, "opts": [{"t": "召唤4个『雏龙的蛋』到己方战场上，使所有『雏龙的蛋』获得【屏障】", "reans": []}, {"t": "使场上所有卡牌的倒计时-1，随后使所有随从获得+1/+2", "reans": []}, {"t": "召唤本次对战中被破坏的攻击力最高的具有倒计时的随从，使其倒计时-2", "reans": []}]}, "reans": []}, {"k": "守护", "v": 0, "effect": ""}, {"k": "防空", "v": 0, "effect": ""}, {"k": "虹吸", "v": 0, "effect": ""}], "text": "", "flavor": "", "notes": "", "art": "", "value": 12.5, "timerEffect": "", "fusion": null, "fullText": "【守护】【防空】【虹吸】\n【入场曲】【抉择】选择1个能力发动：\n（1）召唤4个『雏龙的蛋』到己方战场上，并使己方战场上的所有『雏龙的蛋』获得【屏障】；\n（2）使己方战场上所有卡牌的倒计时-1，随后使己方战场上的所有随从获得+1/+2；\n（3）召唤1个本局对战中己方被破坏的攻击力最高的具有倒计时的随从到战场上，并使其倒计时-2。"}, {"id": "cmwdzojlzzf98", "name": "窃蛋龙", "en": "", "type": "minion", "rarity": "普通", "race": "龙族", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 2, "sacrifice": 1, "bones": 0, "atk": 3, "hp": 2, "timer": 0, "keywords": [{"k": "谢幕曲", "v": 0, "effect": "召唤1个『雏龙的蛋』到己方战场上", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 3.5, "timerEffect": "", "fusion": null, "fullText": "【谢幕曲】召唤1个『雏龙的蛋』到己方战场上。"}, {"id": "cmwdzshgc6r55", "name": "考古学家", "en": "", "type": "minion", "rarity": "普通", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 4, "sacrifice": 0, "bones": 0, "atk": 4, "hp": 4, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "若战场上有己方龙族随从，抽取2张卡牌", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 4, "timerEffect": "", "fusion": null, "fullText": "【入场曲】若己方战场上有龙族随从，则抽取2张卡牌。"}, {"id": "cmwdzvs1woa53", "name": "龙心秘宝", "en": "", "type": "amulet", "rarity": "史诗", "race": "龙族", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 1, "sacrifice": 0, "bones": 0, "atk": 2, "hp": 3, "timer": 0, "keywords": [{"k": "灵气", "v": 0, "effect": ""}, {"k": "倒计时", "v": 20, "effect": "龙族随从进入战场时，该卡牌倒计时-1"}, {"k": "启动", "v": 0, "effect": "选择自己的1张手牌，使其弃置。获得1张『雏龙的蛋』。", "cost": {"energy": 0, "sacrifice": 0, "bones": 0}, "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}, {"k": "谢幕曲", "v": 0, "effect": "将1张金色的龙心置入己方手牌", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 1, "timerEffect": "龙族随从进入战场时，该卡牌倒计时-1", "fusion": null, "fullText": "【灵气】【倒计时_20】\n无法被破坏（倒计时除外）。每当己方龙族随从进入战场时，本护符的倒计时-1。\n【谢幕曲】将1张『金色的龙心』加入自己的手牌。\n【启动】能量0：选择自己手牌中的1张卡牌将其弃置，并将1张『雏龙的蛋』加入自己的手牌。"}, {"id": "cmwe071ws115o", "name": "金色的龙心", "en": "", "type": "spell", "rarity": "传说", "race": "龙族", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 3, "sacrifice": 0, "bones": 0, "atk": 2, "hp": 3, "timer": 0, "keywords": [], "text": "", "flavor": "", "notes": "", "art": "", "choice": {"on": true, "opts": [{"t": "使战场上所有己方卡牌倒计时-1，重复两次", "reans": []}, {"t": "选择1张战场上的己方卡牌，使其倒计时-3，抽取2张牌", "reans": []}, {"t": "抽取3张牌，回复6点生命值", "reans": []}]}, "value": 3, "timerEffect": "", "fusion": null, "fullText": "【抉择】选择1个能力发动：\n（1）使己方战场上所有卡牌的倒计时-1，重复此效果2次；\n（2）选择己方战场上的1张具有倒计时的卡牌，使其倒计时-3，并抽取2张卡牌；\n（3）抽取3张卡牌，并回复己方主战者6点生命值。"}, {"id": "cmwe0hk86d0a2", "name": "大灾变", "en": "", "type": "spell", "rarity": "史诗", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 6, "sacrifice": 0, "bones": 0, "atk": 0, "hp": 3, "timer": 0, "keywords": [], "text": "破坏战场上的所有随从\n", "flavor": "", "notes": "", "art": "", "value": 6, "timerEffect": "", "fusion": null, "fullText": "破坏双方战场上的所有随从。"}, {"id": "cmwe0jardzhku", "name": "恐龙妈妈", "en": "", "type": "minion", "rarity": "普通", "race": "龙族", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 9, "sacrifice": 0, "bones": 0, "atk": 6, "hp": 6, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "召唤『雏龙』到己方战场直到随从上限", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 9, "timerEffect": "", "fusion": null, "fullText": "【入场曲】召唤『雏龙』到己方战场上直到随从上限。"}, {"id": "cmwe0tjwqf5lp", "name": "骷髅墓碑", "en": "", "type": "amulet", "rarity": "普通", "race": "亡灵", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 3, "sacrifice": 0, "bones": 0, "atk": 2, "hp": 3, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "召唤2个『骷髅』到己方战场上", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}, {"k": "谢幕曲", "v": 0, "effect": "", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": [{"k": "亡者召还", "costs": {"energy": 0, "sacrifice": 0, "bones": 0, "value": 2}, "type": "", "effect": ""}]}, {"k": "倒计时", "v": 2, "effect": ""}], "text": "", "flavor": "", "notes": "", "art": "", "value": 3, "timerEffect": "", "fusion": null, "fullText": "【倒计时_2】\n【入场曲】召唤2个『骷髅』到己方战场上。\n【谢幕曲】【亡者召还_价值2】"}, {"id": "cmwe0x250te3k", "name": "灾变中幸存的恐龙", "en": "", "type": "minion", "rarity": "史诗", "race": "亡灵，龙族", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 2, "sacrifice": 1, "bones": 0, "atk": 3, "hp": 2, "timer": 0, "keywords": [{"k": "谢幕曲", "v": 0, "effect": "召唤1个沉睡的恐龙化石到战场上", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 3.5, "timerEffect": "", "fusion": null, "fullText": "【谢幕曲】召唤1个『沉睡的恐龙化石』到己方战场上。"}, {"id": "cmwe1281dd6j0", "name": "沉睡的恐龙化石", "en": "", "type": "amulet", "rarity": "史诗", "race": "龙族", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 1, "sacrifice": 0, "bones": 1, "atk": 2, "hp": 3, "timer": 0, "keywords": [{"k": "倒计时", "v": 2, "effect": ""}, {"k": "谢幕曲", "v": 0, "effect": "召唤1个灾变中幸存的恐龙到战场上", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 1.5, "timerEffect": "", "fusion": null, "fullText": "【倒计时_2】\n【谢幕曲】召唤1个『灾变中幸存的恐龙』到己方战场上。"}, {"id": "cmwe17fnvt7x0", "name": "堕天", "en": "", "type": "spell", "rarity": "史诗", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 3, "sacrifice": 0, "bones": 0, "atk": 2, "hp": 3, "timer": 0, "keywords": [], "text": "选择战场上的1张卡牌，使其变身为堕天使", "flavor": "", "notes": "", "art": "", "value": 3, "timerEffect": "", "fusion": null, "fullText": "选择战场上的1张卡牌，使其变身为『堕天使』。"}, {"id": "cmwe19fflg0v1", "name": "堕天使", "en": "", "type": "minion", "rarity": "史诗", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 1, "sacrifice": 0, "bones": 3, "atk": 2, "hp": 3, "timer": 0, "keywords": [{"k": "爆能强化", "v": 8, "effect": "召唤1个堕天使同名的随从到己方战场", "res": "骨头", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 2.5, "timerEffect": "", "fusion": null, "fullText": "【爆能强化_骨头8】召唤1个『堕天使』到己方战场上。"}, {"id": "cmwe1jmj1j5oo", "name": "待研究的骨架", "en": "", "type": "amulet", "rarity": "普通", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 1, "sacrifice": 0, "bones": 0, "atk": 2, "hp": 3, "timer": 0, "keywords": [{"k": "谢幕曲", "v": 0, "effect": "获得5骨头", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}, {"k": "倒计时", "v": 3, "effect": ""}], "text": "", "flavor": "", "notes": "", "art": "", "value": 1, "timerEffect": "", "fusion": null, "fullText": "【倒计时_3】\n【谢幕曲】使自己的骨头+5。"}, {"id": "cmwe1tj7fh3ot", "name": "雏龙搭档", "en": "", "type": "minion", "rarity": "普通", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 2, "sacrifice": 0, "bones": 0, "atk": 1, "hp": 1, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "召唤1只『雏龙』到己方战场", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 2, "timerEffect": "", "fusion": null, "fullText": "【入场曲】召唤1个『雏龙』到己方战场上。"}, {"id": "cmwe1w8cztclb", "name": "静听倾诉的修女", "en": "", "type": "minion", "rarity": "稀有", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 1, "sacrifice": 0, "bones": 0, "atk": 0, "hp": 1, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "选择战场的1张己方卡牌，使其倒计时-1，若因为此效果使倒计时结束则抽1张牌。", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 1, "timerEffect": "", "fusion": null, "fullText": "【入场曲】选择己方战场上的1张具有倒计时的卡牌，使其倒计时-1；若以此法使该卡牌的倒计时结束，则抽取1张卡牌。"}, {"id": "cmwfd8opa9wwf", "name": "屠龙勇士", "en": "", "type": "minion", "rarity": "稀有", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 4, "sacrifice": 0, "bones": 0, "atk": 2, "hp": 2, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "选择战场上的1个敌方随从，将其破坏", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 4, "timerEffect": "", "fusion": null, "fullText": "【入场曲】选择敌方战场上的1个随从，使其破坏。"}, {"id": "cmwfdhecfc856", "name": "龙蛋收藏家", "en": "", "type": "minion", "rarity": "普通", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 3, "sacrifice": 0, "bones": 0, "atk": 3, "hp": 3, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "将1张『雏龙的蛋』置入自己手牌", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}, {"k": "启动", "v": 0, "effect": "将1张『雏龙的蛋』置入自己手牌", "cost": {"energy": 1, "sacrifice": 0, "bones": 0}, "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 3, "timerEffect": "", "fusion": null, "fullText": "【入场曲】将1张雏龙的蛋置入己方手牌\n【启动】能量1：将1张雏龙的蛋置入己方手牌"}, {"id": "cmwfdja9sjiuf", "name": "怨灵", "en": "", "type": "minion", "rarity": "普通", "race": "亡灵", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 0, "sacrifice": 0, "bones": 0, "atk": 1, "hp": 1, "timer": 0, "keywords": [{"k": "随从进场时", "v": 0, "effect": "立刻攻击并消失", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "衍生物", "art": "", "value": 0, "timerEffect": "", "fusion": null, "fullText": "【随从进场时】立刻攻击并消失"}, {"id": "cmwfdq119iii0", "name": "蝙蝠", "en": "", "type": "minion", "rarity": "普通", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 1, "sacrifice": 0, "bones": 0, "atk": 1, "hp": 1, "timer": 0, "keywords": [{"k": "虹吸", "v": 0, "effect": ""}], "text": "", "flavor": "", "notes": "衍生物", "art": "", "value": 1, "timerEffect": "", "fusion": null, "fullText": "【虹吸】"}, {"id": "cmwfdqzl799uk", "name": "戏谑的吸血鬼", "en": "", "type": "minion", "rarity": "普通", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 1, "sacrifice": 0, "bones": 0, "atk": 1, "hp": 1, "timer": 0, "keywords": [{"k": "谢幕曲", "v": 0, "effect": "将1张『蝙蝠』置入自己手牌", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 1, "timerEffect": "", "fusion": null, "fullText": "【谢幕曲】将1张『蝙蝠』加入自己的手牌。"}, {"id": "cmwfdsjjxuhrh", "name": "玩耍的唤灵术士", "en": "", "type": "minion", "rarity": "普通", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 1, "sacrifice": 0, "bones": 0, "atk": 1, "hp": 1, "timer": 0, "keywords": [{"k": "谢幕曲", "v": 0, "effect": "将1张『怨灵』置入自己手牌", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 1, "timerEffect": "", "fusion": null, "fullText": "【谢幕曲】将1张『怨灵』加入自己的手牌。"}, {"id": "cmwfdugclc9w9", "name": "南瓜捣蛋鬼", "en": "", "type": "minion", "rarity": "普通", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 2, "sacrifice": 0, "bones": 0, "atk": 2, "hp": 2, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "若战场上有己方谢幕曲随从，召唤1个『怨灵』", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}, {"k": "启动", "v": 0, "effect": "召唤1个『怨灵』", "cost": {"energy": 1, "sacrifice": 0, "bones": 0}, "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 2, "timerEffect": "", "fusion": null, "fullText": "【入场曲】若己方战场上有具有【谢幕曲】的随从，则召唤1个『怨灵』到己方战场上。\n【启动】能量1：召唤1个『怨灵』到己方战场上。"}, {"id": "cmwffityz44sn", "name": "骸骨王", "en": "", "type": "minion", "rarity": "传说", "race": "亡灵", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 0, "sacrifice": 4, "bones": 2, "atk": 6, "hp": 6, "timer": 0, "keywords": [{"k": "谢幕曲", "v": 0, "effect": "召唤4个『骷髅』到自己战场上", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 7, "timerEffect": "", "fusion": null, "fullText": "【谢幕曲】召唤4个『骷髅』到己方战场上。"}, {"id": "cmwffsync2y12", "name": "死神代行人", "en": "", "type": "minion", "rarity": "稀有", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 3, "sacrifice": 1, "bones": 0, "atk": 3, "hp": 2, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "选择敌方战场上的1个随从，使其破坏", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 4.5, "timerEffect": "", "fusion": null, "fullText": "【入场曲】选择敌方战场上的1个随从，使其破坏。"}, {"id": "cmwfg3ouofrw4", "name": "浴血的刀客", "en": "", "type": "minion", "rarity": "普通", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 2, "sacrifice": 0, "bones": 0, "atk": 2, "hp": 2, "timer": 0, "keywords": [{"k": "谢幕曲", "v": 0, "effect": "对自己主战者造成1点伤害，抽1张牌", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 2, "timerEffect": "", "fusion": null, "fullText": "【谢幕曲】对己方主战者造成1点伤害，并抽取1张卡牌。"}, {"id": "cmwfg76dbmxry", "name": "咆哮的狼人", "en": "", "type": "minion", "rarity": "普通", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 0, "sacrifice": 2, "bones": 0, "atk": 3, "hp": 3, "timer": 0, "keywords": [{"k": "启动", "v": 0, "effect": "将2张『咆哮的狼人』置入己方牌库中", "cost": {"energy": 0, "sacrifice": 0, "bones": 2}, "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}, {"k": "入场曲", "v": 0, "effect": "对双方的主战者造成x点伤害，x为本次对战中自己打出咆哮的狼人的张数", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 3, "timerEffect": "", "fusion": null, "fullText": "【入场曲】对双方主战者各造成X点伤害（X为本局对战中己方已打出的『咆哮的狼人』张数）。\n【启动】骨头2：将2张『咆哮的狼人』洗入自己的牌库。"}, {"id": "cmwfgsh29e6k1", "name": "猎魄师", "en": "", "type": "minion", "rarity": "稀有", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 3, "sacrifice": 0, "bones": 0, "atk": 3, "hp": 3, "timer": 0, "keywords": [], "text": "亡灵随从进入己方战场时，使其破坏，本随从获得+2/2\n", "flavor": "", "notes": "", "art": "", "value": 3, "timerEffect": "", "fusion": null, "fullText": "每当亡灵随从进入己方战场时，使其破坏，并使本随从获得+2/+2。"}, {"id": "cmwfhe6xv5el7", "name": "冥河引渡人", "en": "", "type": "minion", "rarity": "普通", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 4, "sacrifice": 0, "bones": 0, "atk": 2, "hp": 2, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": [{"k": "亡者召还", "costs": {"energy": 0, "sacrifice": 0, "bones": 0, "value": 2}, "type": "", "effect": ""}]}, {"k": "启动", "v": 0, "effect": "", "cost": {"energy": 2, "sacrifice": 0, "bones": 0}, "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": [{"k": "亡者召还", "costs": {"energy": 0, "sacrifice": 0, "bones": 0, "value": 2}, "type": "", "effect": ""}]}], "text": "", "flavor": "", "notes": "", "art": "", "value": 4, "timerEffect": "", "fusion": null, "fullText": "【入场曲】【亡者召还_价值2】\n【启动】能量2：【亡者召还_价值2】"}, {"id": "cmwgb6nzkjlc7", "name": "叹息之墙盾", "en": "", "type": "minion", "rarity": "传说", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 5, "sacrifice": 2, "bones": 5, "atk": 2, "hp": 6, "timer": 0, "keywords": [{"k": "防空", "v": 0, "effect": ""}, {"k": "屏障", "v": 0, "effect": ""}, {"k": "荆棘", "v": 2, "effect": ""}, {"k": "入场曲", "v": 0, "effect": "召唤2个『刺盾少女』", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 10.5, "timerEffect": "", "fusion": null, "fullText": "荆棘_2\n【入场曲】召唤2个刺盾少女"}, {"id": "cmwgbegxlrn2s", "name": "哀乐奏响者", "en": "", "type": "minion", "rarity": "稀有", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 3, "sacrifice": 0, "bones": 0, "atk": 3, "hp": 3, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "使战场上所有具有倒计时的卡牌倒计时+1", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 3, "timerEffect": "", "fusion": null, "fullText": "【入场曲】使战场上所有具有倒计时的卡牌倒计时+1"}, {"id": "cmwgbg6hku29o", "name": "烈焰漩涡", "en": "", "type": "spell", "rarity": "普通", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 4, "sacrifice": 0, "bones": 0, "atk": 2, "hp": 3, "timer": 0, "keywords": [], "text": "对战场上所有随从和双方的主战者造成3点伤害", "flavor": "", "notes": "", "art": "", "value": 4, "timerEffect": "", "fusion": null, "fullText": "对战场上所有随从和双方的主战者造成3点伤害"}, {"id": "cmwgbhvec35kr", "name": "痛恨快攻卡组的玩家", "en": "", "type": "minion", "rarity": "传说", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 2, "sacrifice": 0, "bones": 0, "atk": 2, "hp": 2, "timer": 0, "keywords": [{"k": "防空", "v": 0, "effect": ""}, {"k": "守护", "v": 0, "effect": ""}, {"k": "入场曲", "v": 0, "effect": "自己获得【纹章：痛恨快攻卡组的玩家】纹章：敌方飞行随从攻击自己主战者时，使其攻击力-2，倒计时2", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 2, "timerEffect": "", "fusion": null, "fullText": "【入场曲】自己获得【纹章：痛恨快攻卡组的玩家】纹章：敌方飞行随从攻击自己主战者时，使其攻击力-2，倒计时2"}, {"id": "cmwgbo051ibcq", "name": "苦难预言者", "en": "", "type": "minion", "rarity": "稀有", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 3, "sacrifice": 0, "bones": 0, "atk": 3, "hp": 3, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "若战场上敌方卡牌有5个，随机破坏其中1个随从", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 3, "timerEffect": "", "fusion": null, "fullText": "【入场曲】若战场上敌方卡牌有5个，随机破坏其中1个随从"}, {"id": "cmwgbrcn9qytg", "name": "灾难预言者", "en": "", "type": "minion", "rarity": "史诗", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 2, "sacrifice": 0, "bones": 0, "atk": 0, "hp": 7, "timer": 0, "keywords": [{"k": "倒计时", "v": 3, "effect": "破坏战场上所有随从"}], "text": "", "flavor": "", "notes": "", "art": "", "value": 2, "timerEffect": "破坏战场上所有随从", "fusion": null, "fullText": "【倒计时_3】破坏战场上所有随从"}, {"id": "cmwgbxcd6nei4", "name": "守卫城堡的指挥官", "en": "", "type": "minion", "rarity": "史诗", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 4, "sacrifice": 0, "bones": 2, "atk": 2, "hp": 6, "timer": 0, "keywords": [{"k": "回合开始时", "v": 0, "effect": "回复所有友方随从和自己主战者2点生命值，对所有敌方随从造成2点伤害", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 5, "timerEffect": "", "fusion": null, "fullText": "【回合开始时】回复所有友方随从和自己主战者2点生命值，对所有敌方随从造成2点伤害"}, {"id": "cmwgc5ey3970v", "name": "精灵女王", "en": "", "type": "minion", "rarity": "传说", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 6, "sacrifice": 0, "bones": 0, "atk": 6, "hp": 6, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "回复自己主战者x点生命值，x为自己的骨头数量，消耗所有骨头", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}, {"k": "守护", "v": 0, "effect": ""}], "text": "", "flavor": "", "notes": "", "art": "", "value": 6, "timerEffect": "", "fusion": null, "fullText": "【入场曲】回复自己主战者x点生命值，x为自己的骨头数量，消耗所有骨头"}, {"id": "cmwgccmsj2ypl", "name": "招魂的术士", "en": "", "type": "minion", "rarity": "稀有", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 3, "sacrifice": 1, "bones": 0, "atk": 1, "hp": 2, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "召唤1个『怨灵』", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "每当有亡灵随从进入自己战场时，使其获得毁灭", "flavor": "", "notes": "", "art": "", "value": 4.5, "timerEffect": "", "fusion": null, "fullText": "【入场曲】召唤1个怨灵\n每当有亡灵随从进入己方战场时，使其获得毁灭"}, {"id": "cmwgchn8wmoi5", "name": "灵魂雕塑家", "en": "", "type": "minion", "rarity": "传说", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 6, "sacrifice": 2, "bones": 0, "atk": 3, "hp": 5, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "召唤1个『怨灵』", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}, {"k": "启动", "v": 0, "effect": "召唤1个『怨灵』", "cost": {"energy": 1, "sacrifice": 0, "bones": 0}, "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "怨灵进入己方战场时，使其获得毁灭。己方随从消失时，召唤1个持盾的骷髅士兵", "flavor": "", "notes": "", "art": "", "value": 9, "timerEffect": "", "fusion": null, "fullText": "【入场曲】召唤1个怨灵\n怨灵进入己方战场时，使其获得毁灭。己方随从消失时，召唤1个持盾的骷髅士兵\n【启动】能量1：召唤1个怨灵"}, {"id": "cmwgcjgs4885x", "name": "持盾的骷髅士兵", "en": "", "type": "minion", "rarity": "普通", "race": "亡灵", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 0, "sacrifice": 0, "bones": 7, "atk": 3, "hp": 5, "timer": 0, "keywords": [{"k": "守护", "v": 0, "effect": ""}], "text": "", "flavor": "", "notes": "", "art": "", "value": 3.5, "timerEffect": "", "fusion": null, "fullText": "【守护】"}, {"id": "cmwgczzbob0ta", "name": "骸骨战机", "en": "", "type": "minion", "rarity": "普通", "race": "亡灵、机械", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 4, "sacrifice": 0, "bones": 0, "atk": 3, "hp": 3, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "召唤1个『骷髅』", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}, {"k": "谢幕曲", "v": 0, "effect": "召唤1个『骷髅』", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 4, "timerEffect": "", "fusion": null, "fullText": "【入场曲】召唤1个骷髅\n【谢幕曲】召唤1个骷髅"}, {"id": "cmwgd14oa2890", "name": "送葬人", "en": "", "type": "minion", "rarity": "普通", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 2, "sacrifice": 0, "bones": 0, "atk": 1, "hp": 2, "timer": 0, "keywords": [{"k": "谢幕曲", "v": 0, "effect": "召唤1个『骷髅』", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 2, "timerEffect": "", "fusion": null, "fullText": "【谢幕曲】召唤1个骷髅"}, {"id": "cmwgd56lg867w", "name": "血法师", "en": "", "type": "minion", "rarity": "传说", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 4, "sacrifice": 0, "bones": 6, "atk": 2, "hp": 3, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "获得【纹章：血法师】，纹章：自己主战者在自己回合受到伤害时，对敌方随从全体和敌方主战者造成1点伤害，倒计时4", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}, {"k": "虹吸", "v": 0, "effect": ""}], "text": "", "flavor": "", "notes": "", "art": "", "value": 7, "timerEffect": "", "fusion": null, "fullText": "【入场曲】获得【纹章：血法师】，纹章：自己主战者在自己回合受到伤害时，对敌方随从全体和敌方主战者造成1点伤害，倒计时4"}, {"id": "cmwgdalzmzj83", "name": "残暴的尸兽", "en": "", "type": "minion", "rarity": "史诗", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 5, "sacrifice": 0, "bones": 4, "atk": 5, "hp": 5, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "使自己获得【纹章：残暴的尸兽】，纹章：回合开始时，对自己主战者造成1点伤害，抽1张牌", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 7, "timerEffect": "", "fusion": null, "fullText": "【入场曲】使自己获得【纹章：残暴的尸兽】，纹章：回合开始时，对自己主战者造成1点伤害，抽1张牌"}, {"id": "cmwgdeqcq4vyl", "name": "骷髅将军", "en": "", "type": "minion", "rarity": "传说", "race": "亡灵", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 6, "sacrifice": 0, "bones": 8, "atk": 5, "hp": 3, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "召唤1个『持盾的骷髅士兵』，1个『尸兵』，1个『骷髅』", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}, {"k": "谢幕曲", "v": 0, "effect": "召唤2个『骷髅』", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 10, "timerEffect": "", "fusion": null, "fullText": "【入场曲】召唤1个『持盾的骷髅士兵』，1个『尸兵』，1个『骷髅』\n【谢幕曲】召唤2个『骷髅』"}, {"id": "cmwgdmja7m7g7", "name": "巨型骸骨兽", "en": "", "type": "minion", "rarity": "普通", "race": "亡灵", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 5, "sacrifice": 0, "bones": 0, "atk": 5, "hp": 5, "timer": 0, "keywords": [{"k": "谢幕曲", "v": 0, "effect": "召唤2个『骷髅』", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 5, "timerEffect": "", "fusion": null, "fullText": "【谢幕曲】召唤2个骷髅"}, {"id": "cmwgdqawegvy3", "name": "地狱三头犬", "en": "", "type": "minion", "rarity": "传说", "race": "亡灵", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 7, "sacrifice": 3, "bones": 0, "atk": 5, "hp": 3, "timer": 0, "keywords": [{"k": "随从进场时", "v": 0, "effect": "召唤2个和地狱三头犬同名的随从，若本次对战中自己被破坏的具有谢幕曲的随从大于10个，使3个地狱三头犬分别获得【毁灭】、虹吸、荆棘5", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 11.5, "timerEffect": "", "fusion": null, "fullText": "【随从进场时】召唤2个和地狱三头犬同名的随从，若本次对战中自己被破坏的具有谢幕曲的随从大于10个，使3个地狱三头犬分别获得毁灭、虹吸、荆棘5"}, {"id": "cmwge5kmkgr5o", "name": "失控的战甲犀牛", "en": "", "type": "minion", "rarity": "史诗", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 6, "sacrifice": 0, "bones": 0, "atk": 4, "hp": 5, "timer": 0, "keywords": [{"k": "攻击时", "v": 0, "effect": "破坏面前的随从", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}, {"k": "位移", "v": 0, "effect": ""}], "text": "", "flavor": "", "notes": "", "art": "", "value": 6, "timerEffect": "", "fusion": null, "fullText": "【攻击时】破坏面前的随从"}, {"id": "cmwgee7uk9ipt", "name": "骨球", "en": "", "type": "minion", "rarity": "普通", "race": "亡灵", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 3, "sacrifice": 0, "bones": 0, "atk": 0, "hp": 4, "timer": 0, "keywords": [{"k": "位移", "v": 0, "effect": ""}], "text": "位移后在原地召唤1个骷髅", "flavor": "", "notes": "", "art": "", "value": 3, "timerEffect": "", "fusion": null, "fullText": "位移后在原地召唤1个骷髅"}, {"id": "cmwgeg2eggz9t", "name": "骸骨和少女", "en": "", "type": "minion", "rarity": "传说", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 7, "sacrifice": 0, "bones": 0, "atk": 2, "hp": 3, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "获得【纹章：骸骨恋人】，纹章：回合结束时，破坏自己战场上1个具有谢幕曲的随从，随机破坏敌方战场上的1个随从。", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": [{"k": "亡者召还", "costs": {"energy": 0, "sacrifice": 0, "bones": 0, "value": 2}, "type": "", "effect": ""}, {"k": "亡者召还", "costs": {"energy": 0, "sacrifice": 0, "bones": 0, "value": 2}, "type": "", "effect": ""}, {"k": "亡者召还", "costs": {"energy": 0, "sacrifice": 0, "bones": 0, "value": 2}, "type": "", "effect": ""}]}], "text": "", "flavor": "", "notes": "", "art": "", "value": 7, "timerEffect": "", "fusion": null, "fullText": "【入场曲】获得【纹章：骸骨恋人】，纹章：回合结束时，破坏己方战场上1个具有谢幕曲的随从，随机破坏敌方战场上的1个随从。\n【亡者召还_价值2】\n【亡者召还_价值2】\n【亡者召还_价值2】"}, {"id": "cmwgepbm7hzy9", "name": "狼少女", "en": "", "type": "minion", "rarity": "稀有", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 2, "sacrifice": 0, "bones": 0, "atk": 3, "hp": 2, "timer": 0, "keywords": [{"k": "启动", "v": 0, "effect": "召唤1个和狼少女同名的随从", "cost": {"energy": 0, "sacrifice": 1, "bones": 0}, "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}, {"k": "随从进场时", "v": 0, "effect": "对双方主战者造成1点伤害", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 2, "timerEffect": "", "fusion": null, "fullText": "【随从进场时】对双方主战者造成1点伤害\n【启动】祭品1：召唤1个和狼少女同名的随从"}, {"id": "cmwget8v364ar", "name": "大剑少女", "en": "", "type": "minion", "rarity": "传说", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 3, "sacrifice": 0, "bones": 0, "atk": 3, "hp": 3, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "你的主战者每损失【3|9|15|21|27】点血量时，该随从获得+1/+1", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 3, "timerEffect": "", "fusion": null, "fullText": "【入场曲】你的主战者每损失【3|9|15|21|27】点血量时，该随从获得+1/1"}, {"id": "cmwgey13x86vt", "name": "乱刃机甲", "en": "", "type": "minion", "rarity": "普通", "race": "机械", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 3, "sacrifice": 0, "bones": 0, "atk": 3, "hp": 3, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "对双方主战者造成1点伤害", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}, {"k": "谢幕曲", "v": 0, "effect": "对双方主战者造成1点伤害", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 3, "timerEffect": "", "fusion": null, "fullText": "【入场曲】对双方主战者造成1点伤害\n【谢幕曲】对双方主战者造成1点伤害"}, {"id": "cmwgf14i2fvra", "name": "热情的魅魔", "en": "", "type": "minion", "rarity": "普通", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 4, "sacrifice": 0, "bones": 4, "atk": 3, "hp": 4, "timer": 0, "keywords": [{"k": "虹吸", "v": 0, "effect": ""}, {"k": "入场曲", "v": 0, "effect": "", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": [{"k": "亡者召还", "costs": {"energy": 2, "sacrifice": 0, "bones": 0, "value": 0}, "type": "", "effect": ""}]}], "text": "", "flavor": "", "notes": "", "art": "", "value": 6, "timerEffect": "", "fusion": null, "fullText": "【入场曲】【亡者召还_能量2】"}, {"id": "cmwgf4861j5tn", "name": "恶魔的仆从", "en": "", "type": "minion", "rarity": "史诗", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 8, "sacrifice": 0, "bones": 6, "atk": 2, "hp": 2, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": [{"k": "亡者召还", "costs": {"energy": 0, "sacrifice": 0, "bones": 0, "value": 12}, "type": "", "effect": ""}]}], "text": "", "flavor": "", "notes": "", "art": "", "value": 11, "timerEffect": "", "fusion": null, "fullText": "【入场曲】【亡者召还_价值12】"}, {"id": "cmwgftipxm3ux", "name": "辅佐帝王的谋士", "en": "", "type": "minion", "rarity": "稀有", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 4, "sacrifice": 0, "bones": 0, "atk": 4, "hp": 4, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "选择战场上的1个随从，破坏所有价值小于该随从的随从", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 4, "timerEffect": "", "fusion": null, "fullText": "【入场曲】选择战场上的1个随从，破坏所有价值小于该随从的随从"}, {"id": "cmwgg0hlxpor5", "name": "吞噬万物的恶魔", "en": "", "type": "minion", "rarity": "传说", "race": "亡灵", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 9, "sacrifice": 2, "bones": 0, "atk": 3, "hp": 9, "timer": 0, "keywords": [{"k": "守护", "v": 0, "effect": ""}, {"k": "谢幕曲", "v": 0, "effect": "", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": [{"k": "亡者召还", "costs": {"energy": 0, "sacrifice": 0, "bones": 0, "value": 7}, "type": "", "effect": ""}, {"k": "亡者召还", "costs": {"energy": 2, "sacrifice": 0, "bones": 0, "value": 5}, "type": "", "effect": ""}, {"k": "亡者召还", "costs": {"energy": 2, "sacrifice": 0, "bones": 0, "value": 3}, "type": "", "effect": ""}]}], "text": "", "flavor": "", "notes": "", "art": "", "value": 12, "timerEffect": "", "fusion": null, "fullText": "【谢幕曲】【亡者召还_价值7】\n【亡者召还_能量2价值5】\n【亡者召还_能量2价值3】"}, {"id": "cmwgga8jc3z4g", "name": "探寻巨龙者", "en": "", "type": "minion", "rarity": "普通", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 2, "sacrifice": 0, "bones": 0, "atk": 1, "hp": 2, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "将1张牌库中价值最高的卡牌置入手牌中", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 2, "timerEffect": "", "fusion": null, "fullText": "【入场曲】将1张牌库中价值最高的卡牌置入手牌中"}, {"id": "cmwggewsi6c9n", "name": "变形计", "en": "", "type": "spell", "rarity": "稀有", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 1, "sacrifice": 0, "bones": 0, "atk": 2, "hp": 3, "timer": 0, "keywords": [], "text": "选择战场上的1张随从牌，使其变身为价值+1的随机卡牌", "flavor": "", "notes": "", "art": "", "value": 1, "timerEffect": "", "fusion": null, "fullText": "选择战场上的1张随从牌，使其变身为价值+1的随机卡牌"}, {"id": "cmwgggf7icriv", "name": "疯狂科学家", "en": "", "type": "minion", "rarity": "史诗", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 3, "sacrifice": 0, "bones": 3, "atk": 2, "hp": 2, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "使你的所有其他随从变身为价值+1的随机卡牌", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 4.5, "timerEffect": "", "fusion": null, "fullText": "【入场曲】使你的所有其他随从变身为价值+1的随机卡牌"}, {"id": "cmwggjooddagz", "name": "寻觅的亡灵", "en": "", "type": "minion", "rarity": "普通", "race": "亡灵", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 2, "sacrifice": 0, "bones": 0, "atk": 2, "hp": 2, "timer": 0, "keywords": [{"k": "谢幕曲", "v": 0, "effect": "下个回合开始时，抽取1张具有谢幕曲的卡牌", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 2, "timerEffect": "", "fusion": null, "fullText": "【谢幕曲】下个回合开始时，抽取1张具有谢幕曲的卡牌"}, {"id": "cmwggt486xgpb", "name": "猫耳播报员", "en": "", "type": "minion", "rarity": "普通", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 1, "sacrifice": 0, "bones": 0, "atk": 1, "hp": 1, "timer": 0, "keywords": [{"k": "连击", "v": 3, "effect": "抽取1张卡牌", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 1, "timerEffect": "", "fusion": null, "fullText": "【连击_3】抽取1张卡牌"}, {"id": "cmwggx4ykcgy1", "name": "百鬼夜行", "en": "", "type": "spell", "rarity": "稀有", "race": "亡灵", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 3, "sacrifice": 0, "bones": 0, "atk": 0, "hp": 3, "timer": 0, "keywords": [{"k": "爆能强化", "v": 6, "effect": "随机召唤3个价值3以下的亡灵随从", "res": "能量", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "召唤3个怨灵\n", "flavor": "", "notes": "", "art": "", "value": 3, "timerEffect": "", "fusion": null, "fullText": "召唤3个怨灵\n【爆能强化_能量6】随机召唤3个价值3以下的亡灵随从"}, {"id": "cmwgh0uggjyno", "name": "骸骨爆发", "en": "", "type": "spell", "rarity": "史诗", "race": "亡灵", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 5, "sacrifice": 0, "bones": 0, "atk": 2, "hp": 3, "timer": 0, "keywords": [], "text": "选择战场的1个敌方随从，对其造成x点伤害，召唤x个骷髅，x为自己手牌中亡灵卡牌的数量", "flavor": "", "notes": "", "art": "", "value": 5, "timerEffect": "", "fusion": null, "fullText": "选择战场的1个敌方随从，对其造成x点伤害，召唤x个骷髅，x为己方手牌中亡灵卡牌的数量"}, {"id": "cmwgh9izhopu9", "name": "亡灵总动员", "en": "", "type": "spell", "rarity": "普通", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 3, "sacrifice": 0, "bones": 0, "atk": 2, "hp": 3, "timer": 0, "keywords": [], "text": "召唤1个怨灵、1个骷髅、1个尸兵", "flavor": "", "notes": "", "art": "", "value": 3, "timerEffect": "", "fusion": null, "fullText": "召唤1个怨灵、1个骷髅、1个尸兵"}, {"id": "cmwghctx4ixrj", "name": "亡灵大礼包", "en": "", "type": "spell", "rarity": "普通", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 2, "sacrifice": 0, "bones": 0, "atk": 2, "hp": 3, "timer": 0, "keywords": [], "text": "将1个怨灵、1个骷髅、1个尸兵置入你的手牌", "flavor": "", "notes": "", "art": "", "value": 2, "timerEffect": "", "fusion": null, "fullText": "将1个怨灵、1个骷髅、1个尸兵置入你的手牌"}, {"id": "cmwghh2r742ie", "name": "吸血鬼贵族", "en": "", "type": "minion", "rarity": "普通", "race": "亡灵", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 0, "sacrifice": 2, "bones": 0, "atk": 2, "hp": 2, "timer": 0, "keywords": [{"k": "谢幕曲", "v": 0, "effect": "召唤2个『蝙蝠』到战场上", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 3, "timerEffect": "", "fusion": null, "fullText": "【谢幕曲】召唤2个蝙蝠到战场上"}, {"id": "cmwghmf9xj9dv", "name": "摇滚骷髅乐团主唱", "en": "", "type": "minion", "rarity": "传说", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 6, "sacrifice": 3, "bones": 0, "atk": 4, "hp": 5, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": [{"k": "亡者召还", "costs": {"energy": 0, "sacrifice": 0, "bones": 0, "value": 3}, "type": "", "effect": ""}, {"k": "亡者召还", "costs": {"energy": 0, "sacrifice": 0, "bones": 0, "value": 2}, "type": "", "effect": ""}, {"k": "亡者召还", "costs": {"energy": 0, "sacrifice": 0, "bones": 0, "value": 1}, "type": "", "effect": ""}]}], "text": "当具有谢幕曲的随从进入自己战场时，将其破坏，并使自己所有随从获得+1/1", "flavor": "", "notes": "主唱是人类少女", "art": "", "value": 10.5, "timerEffect": "", "fusion": null, "fullText": "【入场曲】【亡者召还_价值3】\n【亡者召还_价值2】\n【亡者召还_价值1】\n当具有谢幕曲的随从进入自己战场时，将其破坏，并使自己所有随从获得+1/1"}, {"id": "cmwglnat1hzy3", "name": "肉山魔", "en": "", "type": "minion", "rarity": "史诗", "race": "亡灵", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 0, "sacrifice": 3, "bones": 0, "atk": 3, "hp": 3, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "获得所选择祭品的攻击力和生命值", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 4.5, "timerEffect": "", "fusion": null, "fullText": "【入场曲】获得所选择祭品的攻击力和生命值"}, {"id": "cmwgqgw3e4h7s", "name": "小小唤灵术士", "en": "", "type": "minion", "rarity": "普通", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 2, "sacrifice": 1, "bones": 0, "atk": 1, "hp": 1, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "抽取2张卡牌", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 3.5, "timerEffect": "", "fusion": null, "fullText": "【入场曲】抽取2张卡牌"}, {"id": "cmwgqkrt4rcui", "name": "百变怪", "en": "", "type": "minion", "rarity": "史诗", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 0, "sacrifice": 2, "bones": 0, "atk": 3, "hp": 3, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "变身为所有祭品随从价值总和的随机同价值随从", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 3, "timerEffect": "", "fusion": null, "fullText": "【入场曲】变身为所有祭品随从价值总和的随机同价值随从"}, {"id": "cmwgqqxyzitkn", "name": "冒绿火的无头战士", "en": "", "type": "minion", "rarity": "稀有", "race": "亡灵", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 3, "sacrifice": 2, "bones": 0, "atk": 4, "hp": 2, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "对敌方所有随从造成3点伤害", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 6, "timerEffect": "", "fusion": null, "fullText": "【入场曲】对敌方所有随从造成3点伤害"}, {"id": "cmwgquj0a4mpo", "name": "胆小鬼", "en": "", "type": "minion", "rarity": "稀有", "race": "亡灵", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 2, "sacrifice": 1, "bones": 0, "atk": 1, "hp": 1, "timer": 0, "keywords": [], "text": "每有1个友方随从被破坏，获得+1/1", "flavor": "", "notes": "", "art": "", "value": 3.5, "timerEffect": "", "fusion": null, "fullText": "每有1个友方随从被破坏，获得+1/1"}, {"id": "cmwgr7z9krj92", "name": "冲锋的无头骑士", "en": "", "type": "minion", "rarity": "普通", "race": "亡灵", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 0, "sacrifice": 2, "bones": 0, "atk": 3, "hp": 4, "timer": 0, "keywords": [{"k": "飞行", "v": 0, "effect": ""}, {"k": "入场曲", "v": 0, "effect": "对自己主战者造成1点伤害", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 3, "timerEffect": "", "fusion": null, "fullText": "【入场曲】对自己主战者造成1点伤害"}, {"id": "cmwgrbfvac13x", "name": "插满刀的血块怪", "en": "", "type": "minion", "rarity": "稀有", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 2, "sacrifice": 3, "bones": 0, "atk": 4, "hp": 4, "timer": 0, "keywords": [{"k": "谢幕曲", "v": 0, "effect": "对战场上随从全体造成3点伤害，对双方主战者造成3点伤害", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": []}, {"k": "守护", "v": 0, "effect": ""}], "text": "", "flavor": "", "notes": "", "art": "", "value": 6.5, "timerEffect": "", "fusion": null, "fullText": "【谢幕曲】对战场上随从全体造成3点伤害，对双方主战者造成3点伤害"}, {"id": "cmwgrgw6jyd8p", "name": "亡灵骑士", "en": "", "type": "minion", "rarity": "稀有", "race": "亡灵", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 2, "sacrifice": 3, "bones": 0, "atk": 4, "hp": 6, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "", "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": [{"k": "亡者召还", "costs": {"energy": 0, "sacrifice": 0, "bones": 0, "value": 3}, "type": "", "effect": ""}]}, {"k": "启动", "v": 0, "effect": "", "cost": {"energy": 0, "sacrifice": 0, "bones": 6}, "choice": {"on": false, "opts": [{"t": "", "reans": []}, {"t": "", "reans": []}]}, "reans": [{"k": "亡者召还", "costs": {"energy": 0, "sacrifice": 0, "bones": 0, "value": 3}, "type": "", "effect": ""}]}, {"k": "守护", "v": 0, "effect": ""}], "text": "", "flavor": "", "notes": "", "art": "", "value": 6.5, "timerEffect": "", "fusion": null, "fullText": "【入场曲】【亡者召还_价值3】\n【启动】骨头6：【亡者召还_价值3】"}, {"id": "cmwgrn65g40ql", "name": "拯救世界的大天使", "en": "", "type": "minion", "rarity": "传说", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 10, "sacrifice": 0, "bones": 0, "atk": 5, "hp": 5, "timer": 0, "keywords": [{"k": "防空", "v": 0, "effect": ""}, {"k": "飞行", "v": 0, "effect": ""}, {"k": "守护", "v": 0, "effect": ""}, {"k": "入场曲", "v": 0, "effect": "", "choice": {"on": true, "opts": [{"t": "破坏敌方全体随从", "reans": []}, {"t": "回复自己主战者血量10点", "reans": []}, {"t": "【亡者召还_价值5】×3", "reans": [{"k": "亡者召还", "costs": {"energy": 0, "sacrifice": 0, "bones": 0, "value": 5}, "type": "", "effect": ""}, {"k": "亡者召还", "costs": {"energy": 0, "sacrifice": 0, "bones": 0, "value": 5}, "type": "", "effect": ""}, {"k": "亡者召还", "costs": {"energy": 0, "sacrifice": 0, "bones": 0, "value": 5}, "type": "", "effect": ""}]}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 10, "timerEffect": "", "fusion": null, "fullText": "【入场曲】【抉择】选择1个能力发动。\n（1）破坏敌方全体随从\n（2）回复自己主战者血量10点\n（3）【亡者召还_价值5】\n　【亡者召还_价值5】\n　【亡者召还_价值5】"}, {"id": "cmwgru11nfnj0", "name": "毁灭世界的魔王", "en": "", "type": "minion", "rarity": "传说", "race": "", "sacrificeCond": "", "faith": 0, "counter": 0, "energy": 10, "sacrifice": 5, "bones": 0, "atk": 10, "hp": 10, "timer": 0, "keywords": [{"k": "入场曲", "v": 0, "effect": "", "choice": {"on": true, "opts": [{"t": "对敌方随从和主战者分配x点伤害，x为祭品的总价值", "reans": []}, {"t": "对除自己外的战场上随从全体和双方主战者造成x点伤害，x为祭品的总价值/2", "reans": []}, {"t": "变身为价值x的随机随从，x为祭品的总价值+10", "reans": []}]}, "reans": []}], "text": "", "flavor": "", "notes": "", "art": "", "value": 17.5, "timerEffect": "", "fusion": null, "fullText": "【入场曲】【抉择】选择1个能力发动。\n（1）对敌方随从和主战者分配x点伤害，x为祭品的总价值\n（2）对除自己外的战场上随从全体和双方主战者造成x点伤害，x为祭品的总价值/2\n（3）变身为价值x的随机随从，x为祭品的总价值+10"}]};
const GD_SOURCES = {"BattleEngine.gd": "class_name BattleEngine\nextends Node\n## 核心对战规则与词条结算引擎 (BattleEngine)\n## 完整实现《影之诗》×《邪恶冥刻》5列战道、三维费用（能量/献祭/骨头）、26+词条与38张卡牌精确效果结算\n\n## 战场状态变更信号（通知 UI 刷新与播放 Tween 动画）\nsignal state_updated()\nsignal battle_log_added(msg: String)\nsignal floating_text_requested(side: int, lane: int, text: String, color: Color)\nsignal attack_anim_requested(attacker_side: int, attacker_lane: int, target_side: int, target_lane: int)\nsignal guard_move_requested(defender_side: int, from_lane: int, to_lane: int)\nsignal game_over_triggered(winner_side: int, reason: String)\n\n## 阵营常量定义\nconst PLAYER: int = 0\nconst ENEMY: int = 1\nconst LANES: int = 5\n\n## 双方主战者状态字典（索引 0 = 玩家，1 = 敌方 AI）\nvar leaders: Array[Dictionary] = [{}, {}]\n## 双方 5 列战道随从数组：board[side][lane] -> CardInstance 或 null\nvar board: Array = [[null, null, null, null, null], [null, null, null, null, null]]\n## 当前回合号（从 1 开始）\nvar turn_number: int = 1\n## 当前行动阵营（0 = 玩家，1 = 敌方）\nvar active_side: int = PLAYER\n## 对战是否已结束\nvar is_game_over: bool = false\nvar _enter_seq: int = 0\n\n## 初始化新对战\nfunc start_battle(player_deck_ids: Array[String], enemy_deck_ids: Array[String]) -> void:\n\tis_game_over = false\n\tturn_number = 1\n\tactive_side = PLAYER\n\tboard = [[null, null, null, null, null], [null, null, null, null, null]]\n\tleaders[PLAYER] = _create_leader_state(PLAYER, player_deck_ids)\n\tleaders[ENEMY] = _create_leader_state(ENEMY, enemy_deck_ids)\n\t_prepare_opening_hand(PLAYER)\n\t_prepare_opening_hand(ENEMY)\n\t_log(\"⚔️ 对战开始！双方主战者初始生命值 %d 点。\" % int(CardDatabase.rules.get(\"hp\", 20)))\n\nfunc _create_leader_state(side: int, deck_ids: Array[String]) -> Dictionary:\n\tvar deck_instances: Array[CardInstance] = []\n\tfor cid in deck_ids:\n\t\tvar inst: CardInstance = CardDatabase.create_instance(cid, side)\n\t\tif inst != null:\n\t\t\tdeck_instances.append(inst)\n\tdeck_instances.shuffle()\n\treturn {\n\t\t\"hp\": int(CardDatabase.rules.get(\"hp\", 20)),\n\t\t\"max_hp\": int(CardDatabase.rules.get(\"hp\", 20)),\n\t\t\"energy\": int(CardDatabase.rules.get(\"energyStart\", 1)),\n\t\t\"max_energy\": int(CardDatabase.rules.get(\"energyStart\", 1)),\n\t\t\"bones\": 0,\n\t\t\"deck\": deck_instances,\n\t\t\"hand\": [] as Array[CardInstance],\n\t\t\"graveyard\": [] as Array[CardData], # 墓地存储被破坏的随从静态数据\n\t\t\"destroyed_last_words_count\": 0,    # 本局被破坏的具有谢幕曲的随从计数\n\t\t\"cards_played_this_turn\": 0,        # 本回合已使用卡牌张数（用于「连击」词条）\n\t\t\"next_mech_discount\": 0,            # 下一张机械随从能量减免（如「铜壳瓢虫」）\n\t\t\"delayed_mech_draws\": 0             # 下回合开始时额外抽取机械随从次数（如「飞轮信使」）\n\t}\n\n## 处理起手 4 张抽牌，确保「使命必达小子」(cmwbz163tt1ma) 必定出现在未换牌前的起手手牌中\nfunc _prepare_opening_hand(side: int) -> void:\n\tvar st: Dictionary = leaders[side]\n\tvar deck: Array = st[\"deck\"]\n\tvar hand: Array = st[\"hand\"]\n\tvar opening_count: int = int(CardDatabase.rules.get(\"openingHand\", 4))\n\t# 检查牌库中是否有「使命必达小子」，若有则先移到牌库顶确保首抽必得\n\tfor i in range(deck.size()):\n\t\tvar inst: CardInstance = deck[i]\n\t\tif inst.data.id == \"cmwbz163tt1ma\" or inst.data.text.find(\"必定会出现在未洗牌前的起手手牌\") != -1:\n\t\t\tdeck.remove_at(i)\n\t\t\tdeck.push_front(inst)\n\t\t\tbreak\n\tfor i in range(opening_count):\n\t\tdraw_card(side, false)\n\n## 执行起手调度换牌（玩家可勾选任意张卡牌洗回牌库并重抽等量卡牌）\nfunc perform_mulligan(side: int, replace_indices: Array[int]) -> void:\n\tif replace_indices.is_empty():\n\t\treturn\n\tvar st: Dictionary = leaders[side]\n\tvar hand: Array = st[\"hand\"]\n\tvar deck: Array = st[\"deck\"]\n\treplace_indices.sort()\n\treplace_indices.reverse()\n\tvar returned: Array[CardInstance] = []\n\tfor idx in replace_indices:\n\t\tif idx >= 0 and idx < hand.size():\n\t\t\treturned.append(hand[idx])\n\t\t\thand.remove_at(idx)\n\tfor c in returned:\n\t\tdeck.append(c)\n\tdeck.shuffle()\n\tfor i in range(returned.size()):\n\t\tdraw_card(side, false)\n\t_log(\"🔄 玩家完成了起手换牌（替换了 %d 张手牌）。\" % returned.size())\n\tstate_updated.emit()\n\n## 开始指定阵营的回合\nfunc begin_turn(side: int) -> void:\n\tif is_game_over:\n\t\treturn\n\tactive_side = side\n\tvar st: Dictionary = leaders[side]\n\tst[\"cards_played_this_turn\"] = 0\n\t# 第 1 回合双方均为 1 点能量；从第 2 回合开始每回合能量上限+1（最高 10）并回满\n\tvar e_max: int = int(CardDatabase.rules.get(\"energyMax\", 10))\n\tif turn_number > 1:\n\t\tst[\"max_energy\"] = min(e_max, int(st[\"max_energy\"]) + 1)\n\tst[\"energy\"] = st[\"max_energy\"]\n\n\t# 重置场上随从本回合「启动」状态与倒计时\n\tfor lane in range(LANES):\n\t\tvar m: CardInstance = board[side][lane]\n\t\tif m != null:\n\t\t\tm.activated_this_turn = false\n\n\t_log(\"—— 【%s的第 %d 回合】 能量 %d/%d | 骨头 %d ——\" % [\n\t\t\"我方\" if side == PLAYER else \"敌方\",\n\t\tturn_number,\n\t\tint(st[\"energy\"]),\n\t\tint(st[\"max_energy\"]),\n\t\tint(st[\"bones\"])\n\t])\n\n\t# 回合开始常规抽 1 张牌（后手第一回合额外多抽 1 张牌）\n\tdraw_card(side)\n\tif side == ENEMY and turn_number == 1:\n\t\tdraw_card(side)\n\t\t_log(\"✨ 后手第一回合额外抽取 1 张卡牌。\")\n\n\t# 结算「飞轮信使」等延迟回合开始检索机械随从效果\n\twhile int(st[\"delayed_mech_draws\"]) > 0:\n\t\tst[\"delayed_mech_draws\"] = int(st[\"delayed_mech_draws\"]) - 1\n\t\tdraw_specific_race(side, \"机械\")\n\n\t# 结算场上从左到右（敌方从右到左）的【回合开始时】效果\n\tvar order: Array[int] = _get_lane_order(side)\n\tfor lane in order:\n\t\tvar m: CardInstance = board[side][lane]\n\t\tif m != null:\n\t\t\t_trigger_turn_start_effects(side, lane, m)\n\n\tstate_updated.emit()\n\n## 抽取 1 张卡牌\nfunc draw_card(side: int, emit_ui: bool = true) -> CardInstance:\n\tvar st: Dictionary = leaders[side]\n\tvar deck: Array = st[\"deck\"]\n\tvar hand: Array = st[\"hand\"]\n\tvar hand_limit: int = int(CardDatabase.rules.get(\"handLimit\", 8))\n\tif deck.is_empty():\n\t\treturn null\n\tvar card: CardInstance = deck.pop_front()\n\tif hand.size() >= hand_limit:\n\t\t_log(\"⚠️ %s手牌已满（%d张），抽到的【%s】爆牌消失！\" % [\"我方\" if side == PLAYER else \"敌方\", hand_limit, card.data.name])\n\t\treturn null\n\thand.append(card)\n\tAudioManager.play_sfx(\"draw\")\n\tif emit_ui:\n\t\tstate_updated.emit()\n\treturn card\n\n## 从牌库检索指定种族的随从加入手牌（如「飞轮信使」谢幕曲）\nfunc draw_specific_race(side: int, target_race: String) -> CardInstance:\n\tvar st: Dictionary = leaders[side]\n\tvar deck: Array = st[\"deck\"]\n\tfor i in range(deck.size()):\n\t\tvar c: CardInstance = deck[i]\n\t\tif c.data.type == \"minion\" and c.data.race == target_race:\n\t\t\tdeck.remove_at(i)\n\t\t\tvar hand: Array = st[\"hand\"]\n\t\t\tif hand.size() < int(CardDatabase.rules.get(\"handLimit\", 8)):\n\t\t\t\thand.append(c)\n\t\t\t\t_log(\"🔍 %s从牌库检索了机械随从【%s】加入手牌。\" % [\"我方\" if side == PLAYER else \"敌方\", c.data.name])\n\t\t\tstate_updated.emit()\n\t\t\treturn c\n\treturn null\n\n## 将指定卡牌名称的衍生物或卡牌加入手牌（如「电子羊」「骨龙」）\nfunc add_card_to_hand(side: int, card_name_or_id: String, count: int = 1) -> void:\n\tvar st: Dictionary = leaders[side]\n\tvar hand: Array = st[\"hand\"]\n\tvar hand_limit: int = int(CardDatabase.rules.get(\"handLimit\", 8))\n\tfor i in range(count):\n\t\tif hand.size() >= hand_limit:\n\t\t\t_log(\"⚠️ %s手牌已达上限 %d 张，无法继续加入【%s】。\" % [\"我方\" if side == PLAYER else \"敌方\", hand_limit, card_name_or_id])\n\t\t\tbreak\n\t\tvar inst: CardInstance = CardDatabase.create_instance(card_name_or_id, side)\n\t\tif inst != null:\n\t\t\thand.append(inst)\n\tstate_updated.emit()\n\n## 检查某张手牌当前是否满足费用与献祭条件可打出\nfunc can_play_card(side: int, card: CardInstance) -> Dictionary:\n\tvar st: Dictionary = leaders[side]\n\tvar need_energy: int = card.get_effective_energy(int(st[\"next_mech_discount\"]))\n\tvar need_bones: int = card.data.bones\n\tvar need_sac: int = card.data.sacrifice\n\tvar sac_cond: String = card.data.sacrifice_cond\n\n\tif int(st[\"energy\"]) < need_energy:\n\t\treturn {\"ok\": false, \"reason\": \"能量不足（需要 %d 点能量）\" % need_energy}\n\tif int(st[\"bones\"]) < need_bones:\n\t\treturn {\"ok\": false, \"reason\": \"骨头不足（需要 %d 根骨头）\" % need_bones}\n\n\t# 检查献祭条件\n\tvar valid_sac_lanes: Array[int] = get_valid_sacrifice_lanes(side, sac_cond)\n\tif valid_sac_lanes.size() < need_sac:\n\t\tvar cond_str: String = (\"「%s」\" % sac_cond) if sac_cond != \"\" else \"\"\n\t\treturn {\"ok\": false, \"reason\": \"献祭祭品不足（需要献祭 %d 个%s友方随从）\" % [need_sac, cond_str]}\n\n\t# 若是随从且无需献祭，则场上必须至少有 1 个空位（若需要献祭，根据规则“位置满时依然可以使用，献祭后会腾出位置”）\n\tif card.data.type == \"minion\" and need_sac == 0:\n\t\tvar has_empty: bool = false\n\t\tfor l in range(LANES):\n\t\t\tif board[side][l] == null:\n\t\t\t\thas_empty = true\n\t\t\t\tbreak\n\t\tif not has_empty:\n\t\t\treturn {\"ok\": false, \"reason\": \"战场上没有空余格子\"}\n\n\treturn {\"ok\": true, \"reason\": \"\"}\n\n## 获取场上满足指定献祭种族条件的友方随从所在列索引列表\nfunc get_valid_sacrifice_lanes(side: int, sac_cond: String) -> Array[int]:\n\tvar lanes: Array[int] = []\n\tfor l in range(LANES):\n\t\tvar m: CardInstance = board[side][l]\n\t\tif m != null:\n\t\t\tif sac_cond == \"\" or m.data.race == sac_cond:\n\t\t\t\tlanes.append(l)\n\treturn lanes\n\n## 判断某张卡牌在当前能量下是否会触发【爆能强化】\nfunc will_trigger_enhance(side: int, card: CardInstance) -> int:\n\tvar st: Dictionary = leaders[side]\n\tfor kw in card.data.keywords:\n\t\tif str(kw.get(\"k\", \"\")) == \"爆能强化\":\n\t\t\tvar enh_val: int = int(kw.get(\"v\", 0))\n\t\t\tif int(st[\"energy\"]) >= enh_val:\n\t\t\t\treturn enh_val\n\treturn 0\n\n## 获取卡牌的【抉择】选项列表（若无抉择则返回空数组）\nfunc get_card_choices(card: CardInstance) -> Array:\n\tfor kw in card.data.keywords:\n\t\tvar choice_dict: Dictionary = kw.get(\"choice\", {})\n\t\tif bool(choice_dict.get(\"on\", false)):\n\t\t\treturn choice_dict.get(\"opts\", [])\n\treturn []\n\n## 判断卡牌从手牌打出时是否需要指定敌方/友方目标，或是选择手牌\nfunc get_card_target_requirement(card: CardInstance, is_enhanced: bool = false) -> String:\n\t# 返回值：\"\"（无需目标）、\"enemy_minion\"（任意敌方随从）、\"enemy_minion_hp3\"（生命值3以下敌方随从）、\"friendly_minion\"（友方随从）、\"hand_card\"（手牌）\n\tmatch card.data.id:\n\t\t\"cmwbxdn7tcvde\": # 滑板跃迁手：选择一张手牌洗入牌库并抽1张\n\t\t\treturn \"hand_card\"\n\t\t\"cmwc0t61ade7b\": # 血偿者：选择对手战场上1个随从造成3点伤害\n\t\t\treturn \"enemy_minion\"\n\t\t\"cmwcah8st1lar\": # 神圣法典：选择1个生命值3以下敌方随从使其消失\n\t\t\treturn \"enemy_minion_hp3\"\n\t\t\"cmwcalky6itcu\": # 烟消云散：选择1个敌方随从使其和同名敌方随从消失\n\t\t\treturn \"enemy_minion\"\n\t\t\"cmwcaqbzuvvcx\": # 转生苹果：选择1个友方随从赋予同名复活谢幕曲\n\t\t\treturn \"friendly_minion\"\n\t\t\"cmwcb1izpxl7e\": # 连锁飞刃：选择1个敌方随从造成3点伤害（连击3造成5点）\n\t\t\treturn \"enemy_minion\"\n\t\t\"cmwcba1blx523\": # 炽炎之术：爆能强化5时改为全体3伤无需指定；否则选择1个敌方随从\n\t\t\treturn \"\" if is_enhanced else \"enemy_minion\"\n\treturn \"\"\n\n## 获取法术或入场曲的合法目标列索引列表（自动过滤具有【灵气】或【潜行】的敌方随从）\nfunc get_valid_target_lanes(caster_side: int, req_type: String, is_spell: bool) -> Array[int]:\n\tvar res: Array[int] = []\n\tvar opp_side: int = 1 - caster_side\n\tif req_type == \"enemy_minion\" or req_type == \"enemy_minion_hp3\":\n\t\tfor l in range(LANES):\n\t\t\tvar m: CardInstance = board[opp_side][l]\n\t\t\tif m != null:\n\t\t\t\t# 潜行随从无法被敌方选中；法术无法指定具有【灵气】的随从\n\t\t\t\tif m.has_kw(\"潜行\"):\n\t\t\t\t\tcontinue\n\t\t\t\tif is_spell and m.has_kw(\"灵气\"):\n\t\t\t\t\tcontinue\n\t\t\t\tif req_type == \"enemy_minion_hp3\" and m.current_hp > 3:\n\t\t\t\t\tcontinue\n\t\t\t\tres.append(l)\n\telif req_type == \"friendly_minion\":\n\t\tfor l in range(LANES):\n\t\t\tif board[caster_side][l] != null:\n\t\t\t\tres.append(l)\n\treturn res\n\n## 核心出牌执行函数：完成献祭破坏、费用扣除、随从入场、入场曲/法术效果结算与立即攻击\nfunc play_card_from_hand(\n\tside: int,\n\tcard: CardInstance,\n\ttarget_lane: int = 0,\n\tsacrifice_lanes: Array[int] = [],\n\teffect_target_lane: int = -1,\n\tchoice_index: int = 0,\n\thand_target_uid: int = -1\n) -> bool:\n\tvar check: Dictionary = can_play_card(side, card)\n\tif not bool(check.get(\"ok\", false)):\n\t\treturn false\n\n\tvar st: Dictionary = leaders[side]\n\tvar hand: Array = st[\"hand\"]\n\tvar need_energy: int = card.get_effective_energy(int(st[\"next_mech_discount\"]))\n\tvar enh_cost: int = will_trigger_enhance(side, card)\n\tvar is_enhanced: bool = (enh_cost > 0 and int(st[\"energy\"]) >= enh_cost)\n\tif is_enhanced:\n\t\tneed_energy = enh_cost\n\n\t# 1. 先执行献祭（破坏指定的友方随从，腾出格子并触发其谢幕曲与骨头+1）\n\tif card.data.sacrifice > 0:\n\t\tAudioManager.play_sfx(\"sacrifice\")\n\t\tfor sac_l in sacrifice_lanes:\n\t\t\tvar sac_m: CardInstance = board[side][sac_l]\n\t\t\tif sac_m != null:\n\t\t\t\t_log(\"🩸 %s献祭了随从【%s】！\" % [\"我方\" if side == PLAYER else \"敌方\", sac_m.data.name])\n\t\t\t\tdestroy_minion(side, sac_l)\n\t\t\t\tif is_game_over:\n\t\t\t\t\treturn true\n\t\t# 若目标放置列原本有非献祭随从且献祭腾出了其他空位，则自动选在空位上\n\t\tif card.data.type == \"minion\" and board[side][target_lane] != null:\n\t\t\tfor l in sacrifice_lanes:\n\t\t\t\tif board[side][l] == null:\n\t\t\t\t\ttarget_lane = l\n\t\t\t\t\tbreak\n\n\t# 2. 扣除能量与骨头，移除手牌，更新本回合连击计数\n\tst[\"energy\"] = int(st[\"energy\"]) - need_energy\n\tst[\"bones\"] = int(st[\"bones\"]) - card.data.bones\n\tif card.data.type == \"minion\" and card.data.race == \"机械\" and int(st[\"next_mech_discount\"]) > 0:\n\t\tst[\"next_mech_discount\"] = 0\n\thand.erase(card)\n\tst[\"cards_played_this_turn\"] = int(st[\"cards_played_this_turn\"]) + 1\n\tvar combo_count: int = int(st[\"cards_played_this_turn\"])\n\n\tAudioManager.play_sfx(\"play_card\")\n\t_log(\"🃏 %s打出了【%s】（当前连击数：%d）\" % [\"我方\" if side == PLAYER else \"敌方\", card.data.name, combo_count])\n\n\t# 3. 按随从或法术分支执行\n\tif card.data.type == \"minion\":\n\t\t# 若指定列仍有随从，自动寻找最左侧空列\n\t\tif board[side][target_lane] != null:\n\t\t\ttarget_lane = find_first_empty_lane(side)\n\t\tif target_lane == -1:\n\t\t\treturn false\n\t\t_place_minion_on_board(side, card, target_lane)\n\t\t# 触发【入场曲】（仅从手牌打出时触发）\n\t\t_resolve_fanfare(side, card, target_lane, effect_target_lane, choice_index, hand_target_uid)\n\t\t# 随从放置到战场后等待点击「回合结束」时再统一按序自动发起攻击\n\telif card.data.type == \"spell\":\n\t\t_resolve_spell(side, card, effect_target_lane, is_enhanced, combo_count)\n\t\t# 根据思维导图费用规则：「场上随从被破坏或者使用法术卡时骨头+1」\n\t\tadd_bones(side, 1, \"使用法术\")\n\n\tstate_updated.emit()\n\treturn true\n\n## 将随从放置或召唤到指定列，并触发【随从进场时】与赛博牧羊人光环\nfunc _place_minion_on_board(side: int, minion: CardInstance, lane: int) -> void:\n\tboard[side][lane] = minion\n\t_enter_seq += 1\n\tminion.lane_index = lane\n\tminion.enter_order = _enter_seq\n\tfloating_text_requested.emit(side, lane, \"入场\", Color(0.4, 0.85, 1.0))\n\n\t# 检查己方场上的「赛博牧羊人」光环：每当机械随从进入战场时，使其获得 +1/+1\n\tif minion.data.race == \"机械\":\n\t\tfor l in range(LANES):\n\t\t\tvar ally: CardInstance = board[side][l]\n\t\t\tif ally != null and ally != minion and ally.data.id == \"cmwbxu7u3tpyo\":\n\t\t\t\tminion.add_stats(1, 1)\n\t\t\t\t_log(\"⚡ 【赛博牧羊人】使新入场的机械随从【%s】获得 +1/+1！\" % minion.data.name)\n\t\t\t\tfloating_text_requested.emit(side, lane, \"+1/+1\", Color(0.3, 1.0, 0.5))\n\n\t# 检查该随从自身的【随从进场时】词条（如「摇滚骷髅吉他手」进场召唤4个骷髅，不论从手牌还是瞬念召唤均触发）\n\tif minion.data.id == \"cmwbyp6f419ju\":\n\t\t_log(\"🎸 【摇滚骷髅吉他手】随从进场时：召唤 4 个【骷髅】到战场上！\")\n\t\tsummon_by_name(side, \"骷髅\", 4)\n\n## 在首个空余列召唤指定卡牌名称/ID的随从（从别的途径入场，不触发入场曲，但入场后立刻攻击）\nfunc summon_by_name(side: int, card_name_or_id: String, count: int = 1, auto_attack: bool = false) -> Array[CardInstance]:\n\tvar summoned: Array[CardInstance] = []\n\tfor i in range(count):\n\t\tvar empty_l: int = find_first_empty_lane(side)\n\t\tif empty_l == -1:\n\t\t\tbreak\n\t\tvar inst: CardInstance = CardDatabase.create_instance(card_name_or_id, side)\n\t\tif inst != null:\n\t\t\t_place_minion_on_board(side, inst, empty_l)\n\t\t\tsummoned.append(inst)\n\t\t\tif auto_attack and not is_game_over and board[side][empty_l] == inst:\n\t\t\t\tperform_minion_combat(side, empty_l)\n\treturn summoned\n\n## 查找指定阵营最左侧的空列索引（若满场返回 -1）\nfunc find_first_empty_lane(side: int) -> int:\n\tfor l in range(LANES):\n\t\tif board[side][l] == null:\n\t\t\treturn l\n\treturn -1\n\n## 结算全部随从的【入场曲】效果（精确覆盖 JSON 中的全部入场曲卡牌）\nfunc _resolve_fanfare(\n\tside: int,\n\tcard: CardInstance,\n\tlane: int,\n\teffect_target_lane: int,\n\tchoice_index: int,\n\thand_target_uid: int\n) -> void:\n\tvar st: Dictionary = leaders[side]\n\tvar opp_side: int = 1 - side\n\tmatch card.data.id:\n\t\t\"cmwas0lke5oiw\": # 高性能引擎机甲：【抉择】(1) 招募_能量4 仅限机械 发动两次；(2) 亡者召还_能量4 仅限机械 发动两次\n\t\t\tif choice_index == 0:\n\t\t\t\t_log(\"⚙️ 【高性能引擎机甲】发动抉择（1）：连续两次【招募_能量4】机械随从！\")\n\t\t\t\trecruit_minion(side, 4, \"机械\")\n\t\t\t\trecruit_minion(side, 4, \"机械\")\n\t\t\telse:\n\t\t\t\t_log(\"⚙️ 【高性能引擎机甲】发动抉择（2）：连续两次【亡者召还_能量4】机械随从！\")\n\t\t\t\treanimate_minion(side, 4, \"机械\")\n\t\t\t\treanimate_minion(side, 4, \"机械\")\n\n\t\t\"cmwbxdn7tcvde\": # 滑板跃迁手：选择一张手牌洗入牌库，抽取一张卡牌\n\t\t\tvar hand: Array = st[\"hand\"]\n\t\t\tif not hand.is_empty():\n\t\t\t\tvar target_c: CardInstance = null\n\t\t\t\tfor hc in hand:\n\t\t\t\t\tif hc.uid == hand_target_uid:\n\t\t\t\t\t\ttarget_c = hc\n\t\t\t\t\t\tbreak\n\t\t\t\tif target_c == null:\n\t\t\t\t\ttarget_c = hand[0]\n\t\t\t\thand.erase(target_c)\n\t\t\t\tst[\"deck\"].append(target_c)\n\t\t\t\tst[\"deck\"].shuffle()\n\t\t\t\t_log(\"🛹 【滑板跃迁手】将手牌【%s】洗回牌库并抽取 1 张卡牌。\" % target_c.data.name)\n\t\t\t\tdraw_card(side, false)\n\n\t\t\"cmwby8v9c918f\": # 爆炸羊狂热者：给予手牌中所有电子羊谢幕曲【对对手战场所有随从和主战者分配2点伤害】\n\t\t\tvar buffed_cnt: int = 0\n\t\t\tfor hc in st[\"hand\"]:\n\t\t\t\tif hc.data.id == \"cmwby0dy7g2pc\" or hc.data.name == \"电子羊\":\n\t\t\t\t\thc.extra_last_words.append({\n\t\t\t\t\t\t\"type\": \"boom_sheep\",\n\t\t\t\t\t\t\"desc\": \"对敌方场上所有随从与主战者分配2点伤害\"\n\t\t\t\t\t})\n\t\t\t\t\tbuffed_cnt += 1\n\t\t\t_log(\"💣 【爆炸羊狂热者】为手牌中 %d 张【电子羊】附加了爆破谢幕曲！\" % buffed_cnt)\n\n\t\t\"cmwbyhrbei4w8\": # 增殖机甲：召唤一张和增殖机甲同名的卡牌加入战场\n\t\t\t_log(\"🤖 【增殖机甲】入场曲：召唤 1 张同名【增殖机甲】加入战场！\")\n\t\t\tsummon_by_name(side, \"cmwbyhrbei4w8\", 1)\n\n\t\t\"cmwc0t61ade7b\": # 血偿者：抽取1张卡牌，选择对手战场上1个随从对其造成3点伤害\n\t\t\tdraw_card(side, false)\n\t\t\tif effect_target_lane >= 0 and effect_target_lane < LANES and board[opp_side][effect_target_lane] != null:\n\t\t\t\t_log(\"🩸 【血偿者】入场曲：抽取 1 张牌并对【%s】造成 3 点伤害！\" % board[opp_side][effect_target_lane].data.name)\n\t\t\t\tdeal_damage_to_minion(opp_side, effect_target_lane, 3)\n\n\t\t\"cmwc2n4p68ewm\": # 装甲堡垒：若你手牌中的机械卡大于6张，召唤3个电子羊并使场上所有电子羊获得守护\n\t\t\tvar mech_in_hand: int = _count_mech_in_hand(side)\n\t\t\tif mech_in_hand >= 6:\n\t\t\t\t_log(\"🛡️ 【装甲堡垒】手牌机械卡达 %d 张！召唤 3 个【电子羊】并赋予全场友方电子羊【守护】！\" % mech_in_hand)\n\t\t\t\tsummon_by_name(side, \"电子羊\", 3)\n\t\t\t\tfor l in range(LANES):\n\t\t\t\t\tvar m: CardInstance = board[side][l]\n\t\t\t\t\tif m != null and (m.data.id == \"cmwby0dy7g2pc\" or m.data.name == \"电子羊\"):\n\t\t\t\t\t\tm.grant_kw(\"守护\", 1)\n\n\t\t\"cmwc2wbcgbqvl\": # 铜壳瓢虫：你使用的下一张机械随从卡能量-1\n\t\t\tst[\"next_mech_discount\"] = int(st[\"next_mech_discount\"]) + 1\n\t\t\t_log(\"🐞 【铜壳瓢虫】入场曲：下一张机械随从能量消耗 -1！\")\n\n\t\t\"cmwc3gozg0rat\": # 超载机皇：【抉择】(1) 其他机械随从获得+2/+2；(2) 对最多三个敌方随从造成x点伤害（x=手牌机械卡张数）\n\t\t\tif choice_index == 0:\n\t\t\t\t_log(\"👑 【超载机皇】发动抉择（1）：其他友方机械随从全部获得 +2/+2！\")\n\t\t\t\tfor l in range(LANES):\n\t\t\t\t\tvar ally: CardInstance = board[side][l]\n\t\t\t\t\tif ally != null and ally != card and ally.data.race == \"机械\":\n\t\t\t\t\t\tally.add_stats(2, 2)\n\t\t\t\t\t\tfloating_text_requested.emit(side, l, \"+2/+2\", Color(1.0, 0.85, 0.25))\n\t\t\telse:\n\t\t\t\tvar x_dmg: int = _count_mech_in_hand(side)\n\t\t\t\t_log(\"👑 【超载机皇】发动抉择（2）：手牌共有 %d 张机械卡，对最多 3 个敌方随从造成 %d 点伤害！\" % [x_dmg, x_dmg])\n\t\t\t\tif x_dmg > 0:\n\t\t\t\t\tvar hit_cnt: int = 0\n\t\t\t\t\tfor l in range(LANES):\n\t\t\t\t\t\tif board[opp_side][l] != null and hit_cnt < 3:\n\t\t\t\t\t\t\thit_cnt += 1\n\t\t\t\t\t\t\tdeal_damage_to_minion(opp_side, l, x_dmg)\n\n\t\t\"cmwc8tup5d1xt\": # 磁力拼装机械：若你手牌中的机械卡大于6张，随机从守护、飞行、防空、灵气、毁灭、虹吸、位移、屏障中获得三个词条\n\t\t\tvar mech_cnt: int = _count_mech_in_hand(side)\n\t\t\tif mech_cnt >= 6:\n\t\t\t\tvar pool: Array[String] = [\"守护\", \"飞行\", \"防空\", \"灵气\", \"毁灭\", \"虹吸\", \"位移\", \"屏障\"]\n\t\t\t\tpool.shuffle()\n\t\t\t\tvar gained: PackedStringArray = []\n\t\t\t\tfor i in range(3):\n\t\t\t\t\tcard.grant_kw(pool[i], 1)\n\t\t\t\t\tgained.append(pool[i])\n\t\t\t\t_log(\"🧲 【磁力拼装机械】获得随机 3 个词条：%s！\" % \"、\".join(gained))\n\n## 结算全部法术卡效果\nfunc _resolve_spell(side: int, card: CardInstance, target_lane: int, is_enhanced: bool, combo_count: int) -> void:\n\tvar opp_side: int = 1 - side\n\tmatch card.data.id:\n\t\t\"cmwcah8st1lar\": # 神圣法典：选择1个生命值3以下敌方随从，使其消失\n\t\t\tif target_lane >= 0 and target_lane < LANES and board[opp_side][target_lane] != null:\n\t\t\t\tvar m: CardInstance = board[opp_side][target_lane]\n\t\t\t\tif m.current_hp <= 3:\n\t\t\t\t\tbanish_minion(opp_side, target_lane)\n\n\t\t\"cmwcalky6itcu\": # 烟消云散：选择1个敌方随从使其和与其同名的所有敌方随从消失\n\t\t\tif target_lane >= 0 and target_lane < LANES and board[opp_side][target_lane] != null:\n\t\t\t\tvar target_name: String = board[opp_side][target_lane].data.name\n\t\t\t\tfor l in range(LANES):\n\t\t\t\t\tif board[opp_side][l] != null and board[opp_side][l].data.name == target_name:\n\t\t\t\t\t\tbanish_minion(opp_side, l)\n\n\t\t\"cmwcaqbzuvvcx\": # 转生苹果：选择1个友方随从，使其获得谢幕曲【召唤1个自己同名的随从到战场上】\n\t\t\tif target_lane >= 0 and target_lane < LANES and board[side][target_lane] != null:\n\t\t\t\tvar ally: CardInstance = board[side][target_lane]\n\t\t\t\tally.extra_last_words.append({\n\t\t\t\t\t\"type\": \"rebirth_self\",\n\t\t\t\t\t\"card_id\": ally.data.id,\n\t\t\t\t\t\"desc\": \"召唤1个【%s】到战场上\" % ally.data.name\n\t\t\t\t})\n\t\t\t\t_log(\"🍎 【转生苹果】赋予了【%s】同名复活谢幕曲！\" % ally.data.name)\n\t\t\t\tfloating_text_requested.emit(side, target_lane, \"+转生谢幕曲\", Color(0.4, 1.0, 0.5))\n\n\t\t\"cmwcb1izpxl7e\": # 连锁飞刃：【连击_3】改为造成5点伤害；选择1个敌方随从造成3点伤害\n\t\t\tvar dmg: int = 5 if combo_count >= 3 else 3\n\t\t\tif target_lane >= 0 and target_lane < LANES and board[opp_side][target_lane] != null:\n\t\t\t\t_log(\"🗡️ 【连锁飞刃】对【%s】造成 %d 点伤害！\" % [board[opp_side][target_lane].data.name, dmg])\n\t\t\t\tdeal_damage_to_minion(opp_side, target_lane, dmg)\n\n\t\t\"cmwcba1blx523\": # 炽炎之术：选择1个敌方随从造成3点伤害；【爆能强化_能量5】改为对敌方随从全体造成3点伤害\n\t\t\tif is_enhanced:\n\t\t\t\t_log(\"🔥 【炽炎之术（爆能强化5）】对敌方全体随从造成 3 点伤害！\")\n\t\t\t\tfor l in range(LANES):\n\t\t\t\t\tif board[opp_side][l] != null:\n\t\t\t\t\t\tdeal_damage_to_minion(opp_side, l, 3)\n\t\t\telif target_lane >= 0 and target_lane < LANES and board[opp_side][target_lane] != null:\n\t\t\t\t_log(\"🔥 【炽炎之术】对【%s】造成 3 点伤害！\" % board[opp_side][target_lane].data.name)\n\t\t\t\tdeal_damage_to_minion(opp_side, target_lane, 3)\n\n## 激活场上随从的【启动】能力（如「赛博牧羊人」消耗1点能量将2张电子羊加入手牌）\nfunc activate_minion_ability(side: int, lane: int) -> bool:\n\tvar m: CardInstance = board[side][lane]\n\tif m == null or m.activated_this_turn:\n\t\treturn false\n\tvar st: Dictionary = leaders[side]\n\tfor kw in m.data.keywords:\n\t\tif str(kw.get(\"k\", \"\")) == \"启动\":\n\t\t\tvar cost_dict: Dictionary = kw.get(\"cost\", {})\n\t\t\tvar e_cost: int = int(cost_dict.get(\"energy\", 0))\n\t\t\tvar b_cost: int = int(cost_dict.get(\"bones\", 0))\n\t\t\tif int(st[\"energy\"]) < e_cost or int(st[\"bones\"]) < b_cost:\n\t\t\t\treturn false\n\t\t\tst[\"energy\"] = int(st[\"energy\"]) - e_cost\n\t\t\tst[\"bones\"] = int(st[\"bones\"]) - b_cost\n\t\t\tm.activated_this_turn = true\n\t\t\tif m.data.id == \"cmwbxu7u3tpyo\": # 赛博牧羊人\n\t\t\t\t_log(\"⚡ 发动【赛博牧羊人】启动能力：消耗 1 点能量，将 2 张【电子羊】加入手牌！\")\n\t\t\t\tadd_card_to_hand(side, \"电子羊\", 2)\n\t\t\tAudioManager.play_sfx(\"buff\")\n\t\t\tstate_updated.emit()\n\t\t\treturn true\n\treturn false\n\n## 结算单个随从的战道交战（含多重攻击、两侧/三侧/全体攻击、飞行与防空、守护横移拦截、毁灭、荆棘、虹吸、位移）\nfunc perform_minion_combat(attacker_side: int, lane: int) -> void:\n\tvar attacker: CardInstance = board[attacker_side][lane]\n\tif attacker == null or is_game_over:\n\t\treturn\n\t# 思维导图规则：「攻击为0的随从不会进行攻击，具有攻击力后开始攻击」\n\tif attacker.current_atk <= 0:\n\t\treturn\n\n\tvar multi_times: int = max(1, attacker.get_kw_val(\"多重攻击\"))\n\tfor hit_idx in range(multi_times):\n\t\tif is_game_over or board[attacker_side][lane] != attacker or attacker.current_atk <= 0:\n\t\t\tbreak\n\t\t_execute_single_attack_swing(attacker_side, lane, attacker)\n\n\t# 攻击结束后若随从仍在场且具有【潜行】，解除潜行；若具有【位移】，执行左右横移\n\tif not is_game_over and board[attacker_side][lane] == attacker:\n\t\tif attacker.has_kw(\"潜行\"):\n\t\t\tattacker.remove_kw(\"潜行\")\n\t\tif attacker.has_kw(\"位移\"):\n\t\t\t_process_minion_shift(attacker_side, lane, attacker)\n\nfunc _execute_single_attack_swing(attacker_side: int, lane: int, attacker: CardInstance) -> void:\n\tvar opp_side: int = 1 - attacker_side\n\t# 1. 确定本次攻击的目标列集合（支持全体攻击、三侧攻击、两侧攻击、常规前方单列攻击）\n\tvar target_lanes: Array[int] = []\n\tvar also_fly_hit_leader: bool = false\n\tif attacker.has_kw(\"全体攻击\"):\n\t\tfor l in range(LANES):\n\t\t\tif board[opp_side][l] != null:\n\t\t\t\ttarget_lanes.append(l)\n\t\tvar front_def: CardInstance = board[opp_side][lane]\n\t\tif attacker.has_kw(\"飞行\") and (front_def == null or not front_def.has_kw(\"防空\")):\n\t\t\talso_fly_hit_leader = true\n\t\telif target_lanes.is_empty():\n\t\t\talso_fly_hit_leader = true\n\telif attacker.has_kw(\"三侧攻击\"):\n\t\tfor dl in [-1, 0, 1]:\n\t\t\tvar tl: int = lane + dl\n\t\t\tif tl >= 0 and tl < LANES:\n\t\t\t\ttarget_lanes.append(tl)\n\telif attacker.has_kw(\"两侧攻击\"):\n\t\tfor dl in [-1, 1]:\n\t\t\tvar tl: int = lane + dl\n\t\t\tif tl >= 0 and tl < LANES:\n\t\t\t\ttarget_lanes.append(tl)\n\telse:\n\t\ttarget_lanes.append(lane)\n\n\t# 2. 若是全体攻击，先对所有在场敌方随从造成伤害，若同时触发飞行直击或空场则对敌方主战者造成伤害\n\tif attacker.has_kw(\"全体攻击\"):\n\t\tfor tl in target_lanes:\n\t\t\tif is_game_over or board[attacker_side][lane] != attacker:\n\t\t\t\tbreak\n\t\t\tvar def_m: CardInstance = board[opp_side][tl]\n\t\t\tif def_m != null:\n\t\t\t\tattack_anim_requested.emit(attacker_side, lane, opp_side, tl)\n\t\t\t\tvar dealt: int = deal_damage_to_minion(opp_side, tl, attacker.current_atk, attacker)\n\t\t\t\tif def_m != null and def_m.has_kw(\"荆棘\") and dealt > 0:\n\t\t\t\t\tdeal_damage_to_minion(attacker_side, lane, def_m.get_kw_val(\"荆棘\"), def_m)\n\t\tif also_fly_hit_leader and not is_game_over and board[attacker_side][lane] == attacker:\n\t\t\tattack_anim_requested.emit(attacker_side, lane, opp_side, -1)\n\t\t\tdeal_damage_to_leader(opp_side, attacker.current_atk, attacker)\n\t\treturn\n\n\t# 2. 依次对每个目标列执行打击\n\tfor tl in target_lanes:\n\t\tif is_game_over or board[attacker_side][lane] != attacker:\n\t\t\tbreak\n\t\tvar defender: CardInstance = board[opp_side][tl]\n\n\t\t# 检查【守护】自动横移机制：「在对方随从直接攻击主战者时，如果场上有空位，则该随从自动移动到该位置进行交战」\n\t\tif defender == null:\n\t\t\tvar guard_lane: int = _find_movable_guard_lane(opp_side, tl)\n\t\t\tif guard_lane != -1:\n\t\t\t\tdefender = board[opp_side][guard_lane]\n\t\t\t\tboard[opp_side][guard_lane] = null\n\t\t\t\tboard[opp_side][tl] = defender\n\t\t\t\tdefender.lane_index = tl\n\t\t\t\t_log(\"🛡️ 敌方【%s】触发【守护】，自动横移至第 %d 列拦截攻击！\" % [defender.data.name, tl + 1])\n\t\t\t\tguard_move_requested.emit(opp_side, guard_lane, tl)\n\n\t\t# 判断是否越过随从直接攻击主战者（【飞行】能越过没有【防空】的随从）\n\t\tvar attack_leader_directly: bool = false\n\t\tif defender == null:\n\t\t\tattack_leader_directly = true\n\t\telif attacker.has_kw(\"飞行\") and not defender.has_kw(\"防空\"):\n\t\t\tattack_leader_directly = true\n\n\t\tAudioManager.play_sfx(\"hit\")\n\t\tif attack_leader_directly:\n\t\t\tattack_anim_requested.emit(attacker_side, lane, opp_side, -1)\n\t\t\tdeal_damage_to_leader(opp_side, attacker.current_atk, attacker)\n\t\telse:\n\t\t\tattack_anim_requested.emit(attacker_side, lane, opp_side, tl)\n\t\t\t# 思维导图规则：「随从入场可以立刻攻击，攻击敌方随从不会受到敌方攻击力伤害，生命值为0时消灭」\n\t\t\tvar dmg_dealt: int = deal_damage_to_minion(opp_side, tl, attacker.current_atk, attacker)\n\t\t\t# 若防守方具有【荆棘】，受到伤害时对攻击者进行反伤\n\t\t\tif defender != null and defender.has_kw(\"荆棘\") and dmg_dealt > 0:\n\t\t\t\tvar thorn_dmg: int = defender.get_kw_val(\"荆棘\")\n\t\t\t\t_log(\"🌵 【%s】的【荆棘_%d】对【%s】造成 %d 点反伤！\" % [defender.data.name, thorn_dmg, attacker.data.name, thorn_dmg])\n\t\t\t\tdeal_damage_to_minion(attacker_side, lane, thorn_dmg, defender)\n\n## 寻找可横移到空位拦截主战者直伤的【守护】随从所在列\nfunc _find_movable_guard_lane(defender_side: int, empty_target_lane: int) -> int:\n\tif board[defender_side][empty_target_lane] != null:\n\t\treturn -1\n\tvar best_lane: int = -1\n\tvar best_dist: int = 99\n\tfor l in range(LANES):\n\t\tvar m: CardInstance = board[defender_side][l]\n\t\tif m != null and m.has_kw(\"守护\") and not m.has_kw(\"潜行\"):\n\t\t\tvar d: int = absi(l - empty_target_lane)\n\t\t\tif d < best_dist:\n\t\t\t\tbest_dist = d\n\t\t\t\tbest_lane = l\n\treturn best_lane\n\n## 处理【位移】词条：攻击结束后往右移动一格，触底或被随从阻挡则改为向左\nfunc _process_minion_shift(side: int, lane: int, minion: CardInstance) -> void:\n\tvar next_lane: int = lane + minion.shift_dir\n\tif next_lane < 0 or next_lane >= LANES or board[side][next_lane] != null:\n\t\tminion.shift_dir = -minion.shift_dir\n\t\tnext_lane = lane + minion.shift_dir\n\tif next_lane >= 0 and next_lane < LANES and board[side][next_lane] == null:\n\t\tboard[side][lane] = null\n\t\tboard[side][next_lane] = minion\n\t\tminion.lane_index = next_lane\n\t\t_log(\"↔️ 【%s】触发【位移】移动至第 %d 列。\" % [minion.data.name, next_lane + 1])\n\n## 对指定随从造成伤害（含【屏障】抵挡、【毁灭】必杀与【虹吸】吸血）\nfunc deal_damage_to_minion(target_side: int, lane: int, amount: int, source_minion: CardInstance = null) -> int:\n\tif amount <= 0:\n\t\treturn 0\n\tvar target: CardInstance = board[target_side][lane]\n\tif target == null:\n\t\treturn 0\n\t# 检查【屏障】：抵挡受到的第一次伤害，至少受到1点伤害时屏障消失\n\tif target.has_kw(\"屏障\"):\n\t\ttarget.remove_kw(\"屏障\")\n\t\t_log(\"🫧 【%s】的【屏障】抵挡了本次 %d 点伤害！\" % [target.data.name, amount])\n\t\tfloating_text_requested.emit(target_side, lane, \"屏障抵挡\", Color(0.4, 0.9, 1.0))\n\t\treturn 0\n\n\ttarget.current_hp -= amount\n\tfloating_text_requested.emit(target_side, lane, \"-%d\" % amount, Color(1.0, 0.3, 0.35))\n\n\t# 检查攻击者是否具有【虹吸】\n\tif source_minion != null and source_minion.has_kw(\"虹吸\"):\n\t\theal_leader(source_minion.owner_id, amount)\n\n\t# 检查攻击者是否具有【毁灭】：「直接消灭受到该随从伤害的随从」\n\tif target.current_hp <= 0 or (source_minion != null and source_minion.has_kw(\"毁灭\")):\n\t\tif source_minion != null and source_minion.has_kw(\"毁灭\") and target.current_hp > 0:\n\t\t\t_log(\"☠️ 【%s】的【毁灭】词条直接消灭了受伤的【%s】！\" % [source_minion.data.name, target.data.name])\n\t\tdestroy_minion(target_side, lane)\n\treturn amount\n\n## 对指定主战者造成伤害\nfunc deal_damage_to_leader(target_side: int, amount: int, source_minion: CardInstance = null) -> void:\n\tif amount <= 0 or is_game_over:\n\t\treturn\n\tvar st: Dictionary = leaders[target_side]\n\tst[\"hp\"] = int(st[\"hp\"]) - amount\n\tfloating_text_requested.emit(target_side, -1, \"-%d\" % amount, Color(1.0, 0.25, 0.3))\n\t_log(\"💥 %s主战者受到 %d 点伤害（剩余生命：%d）\" % [\"我方\" if target_side == PLAYER else \"敌方\", amount, int(st[\"hp\"])])\n\tif source_minion != null and source_minion.has_kw(\"虹吸\"):\n\t\theal_leader(source_minion.owner_id, amount)\n\tif int(st[\"hp\"]) <= 0:\n\t\tis_game_over = true\n\t\tvar winner: int = 1 - target_side\n\t\tAudioManager.play_sfx(\"victory\")\n\t\t_log(\"🏆 对战结束！%s获胜！\" % (\"我方\" if winner == PLAYER else \"敌方\"))\n\t\tgame_over_triggered.emit(winner, \"%s主战者生命值归零\" % (\"敌方\" if winner == PLAYER else \"我方\"))\n\n## 为主战者恢复生命值\nfunc heal_leader(side: int, amount: int) -> void:\n\tvar st: Dictionary = leaders[side]\n\tvar old_hp: int = int(st[\"hp\"])\n\tst[\"hp\"] = min(int(st[\"max_hp\"]), old_hp + amount)\n\tif int(st[\"hp\"]) > old_hp:\n\t\tfloating_text_requested.emit(side, -1, \"+%d\" % (int(st[\"hp\"]) - old_hp), Color(0.3, 1.0, 0.5))\n\n## 增加骨头资源\nfunc add_bones(side: int, amount: int, reason: String = \"\") -> void:\n\tif amount <= 0:\n\t\treturn\n\tvar st: Dictionary = leaders[side]\n\tst[\"bones\"] = int(st[\"bones\"]) + amount\n\tif reason != \"\":\n\t\t_log(\"🦴 %s获得 +%d 骨头（%s，当前共 %d 骨头）\" % [\"我方\" if side == PLAYER else \"敌方\", amount, reason, int(st[\"bones\"])])\n\n## 破坏场上随从：送入墓地、骨头+1、触发【谢幕曲】与【随从离场时】\nfunc destroy_minion(side: int, lane: int) -> void:\n\tvar m: CardInstance = board[side][lane]\n\tif m == null:\n\t\treturn\n\tboard[side][lane] = null\n\tm.lane_index = -1\n\tvar st: Dictionary = leaders[side]\n\tst[\"graveyard\"].append(m.data)\n\tif m.has_any_last_words():\n\t\tst[\"destroyed_last_words_count\"] = int(st[\"destroyed_last_words_count\"]) + 1\n\t# 思维导图规则：「场上随从被破坏或者使用法术卡时骨头+1」\n\tadd_bones(side, 1, \"【%s】被破坏\" % m.data.name)\n\t_resolve_last_words(side, lane, m)\n\n## 消失场上随从：不进入墓地、不增加骨头、不触发谢幕曲\nfunc banish_minion(side: int, lane: int) -> void:\n\tvar m: CardInstance = board[side][lane]\n\tif m == null:\n\t\treturn\n\tboard[side][lane] = null\n\tm.lane_index = -1\n\t_log(\"✨ 【%s】被消失（不触发谢幕曲且不进入墓地）。\" % m.data.name)\n\tfloating_text_requested.emit(side, lane, \"消失\", Color(0.85, 0.7, 1.0))\n\n## 结算全部随从的【谢幕曲】效果\nfunc _resolve_last_words(side: int, lane: int, m: CardInstance) -> void:\n\tvar st: Dictionary = leaders[side]\n\tvar opp_side: int = 1 - side\n\tmatch m.data.id:\n\t\t\"cmwbvfqe5en3l\": # 通用载人机甲：【谢幕曲】【招募_能量2】\n\t\t\t_log(\"⚙️ 【通用载人机甲】谢幕曲：发动【招募_能量2】！\")\n\t\t\trecruit_minion(side, 2, \"\")\n\t\t\"cmwbvnpfgwo7a\", \"cmwbwne297mmg\", \"cmwc2zlhaxdtj\": # 铁皮打手 / 发条侍从 / 齿轮学徒：将1张电子羊加入手牌\n\t\t\t_log(\"🐑 【%s】谢幕曲：将 1 张【电子羊】加入手牌。\" % m.data.name)\n\t\t\tadd_card_to_hand(side, \"电子羊\", 1)\n\t\t\"cmwbwg3kwqfkq\": # 飞轮信使：下个回合开始时，从牌库抽取一张机械随从\n\t\t\tst[\"delayed_mech_draws\"] = int(st[\"delayed_mech_draws\"]) + 1\n\t\t\t_log(\"📨 【飞轮信使】谢幕曲：预约下回合开始时抽取 1 张机械随从。\")\n\t\t\"cmwbyp6f419ju\": # 摇滚骷髅吉他手：谢幕曲召唤四个骷髅到战场上\n\t\t\t_log(\"🎸 【摇滚骷髅吉他手】谢幕曲：召唤 4 个【骷髅】到战场上！\")\n\t\t\tsummon_by_name(side, \"骷髅\", 4)\n\t\t\"cmwc0auyporsj\": # 骸骨兽：召唤两个骷髅到战场上\n\t\t\t_log(\"💀 【骸骨兽】谢幕曲：召唤 2 个【骷髅】到战场上！\")\n\t\t\tsummon_by_name(side, \"骷髅\", 2)\n\t\t\"cmwc0t61ade7b\": # 血偿者：谢幕曲抽取1张卡牌\n\t\t\t_log(\"🩸 【血偿者】谢幕曲：抽取 1 张卡牌。\")\n\t\t\tdraw_card(side, false)\n\t\t\"cmwc33vo8ohrw\": # 发条龙：召唤2个电子羊到战场上\n\t\t\t_log(\"🐉 【发条龙】谢幕曲：召唤 2 个【电子羊】到战场上！\")\n\t\t\tsummon_by_name(side, \"电子羊\", 2)\n\t\t\"cmwc3or2zf7ft\": # 万齿战车：【谢幕曲】亡者召还_能量6/4/2（仅限机械）\n\t\t\t_log(\"🚜 【万齿战车】谢幕曲：依次发动能量 6 / 4 / 2 的机械【亡者召还】！\")\n\t\t\treanimate_minion(side, 6, \"机械\")\n\t\t\treanimate_minion(side, 4, \"机械\")\n\t\t\treanimate_minion(side, 2, \"机械\")\n\t\t\"cmwc97xb64vc6\", \"cmwc9mbry93dx\": # 尸兵 / 骸骨犬：谢幕曲骨头+2\n\t\t\tadd_bones(side, 2, \"【%s】谢幕曲\" % m.data.name)\n\t\t\"cmwc9ua0fd6of\": # 骨龙：谢幕曲骨头+3，将1张和骨龙同名的随从加入手牌\n\t\t\tadd_bones(side, 3, \"【骨龙】谢幕曲\")\n\t\t\tadd_card_to_hand(side, \"骨龙\", 1)\n\n\t# 结算动态附加的额外谢幕曲（如「爆炸羊狂热者」赋予的爆破2伤、「转生苹果」赋予的同名复活）\n\tfor extra in m.extra_last_words:\n\t\tvar etype: String = str(extra.get(\"type\", \"\"))\n\t\tif etype == \"boom_sheep\":\n\t\t\t_log(\"💥 【电子羊】触发附加谢幕曲：按入场先后顺序对敌方随从和主战者分配 2 点伤害！\")\n\t\t\tdistribute_damage(opp_side, 2, true)\n\t\telif etype == \"rebirth_self\":\n\t\t\tvar cid: String = str(extra.get(\"card_id\", m.data.id))\n\t\t\t_log(\"🍎 触发【转生苹果】谢幕曲：重新召唤【%s】！\" % m.data.name)\n\t\t\tsummon_by_name(side, cid, 1)\n\n## 【招募】机制：从己方牌库中随机召唤 1 张能量费用 <= max_energy 且符合 race_filter 的随从到战场上\nfunc recruit_minion(side: int, max_energy: int, race_filter: String = \"\") -> CardInstance:\n\tvar empty_l: int = find_first_empty_lane(side)\n\tif empty_l == -1:\n\t\treturn null\n\tvar st: Dictionary = leaders[side]\n\tvar deck: Array = st[\"deck\"]\n\tvar candidates: Array[int] = []\n\tfor i in range(deck.size()):\n\t\tvar c: CardInstance = deck[i]\n\t\tif c.data.type == \"minion\" and c.data.energy <= max_energy:\n\t\t\tif race_filter == \"\" or c.data.race == race_filter:\n\t\t\t\tcandidates.append(i)\n\tif candidates.is_empty():\n\t\treturn null\n\t# 优先招募费用最高者\n\tcandidates.sort_custom(func(ia: int, ib: int) -> bool:\n\t\treturn deck[ia].data.energy > deck[ib].data.energy\n\t)\n\tvar chosen_idx: int = candidates[0]\n\tvar inst: CardInstance = deck[chosen_idx]\n\tdeck.remove_at(chosen_idx)\n\t_log(\"📣 【招募】从牌库召唤了【%s】到第 %d 列！\" % [inst.data.name, empty_l + 1])\n\t_place_minion_on_board(side, inst, empty_l)\n\t# 招募/亡者召还入场的随从同样在回合结束时统一发起攻击\n\treturn inst\n\n## 【亡者召还】机制：从己方墓地中召唤 1 张能量费用 <= max_energy（优先最高费）且符合 race_filter 的随从到战场上\nfunc reanimate_minion(side: int, max_energy: int, race_filter: String = \"\") -> CardInstance:\n\tvar empty_l: int = find_first_empty_lane(side)\n\tif empty_l == -1:\n\t\treturn null\n\tvar st: Dictionary = leaders[side]\n\tvar grave: Array = st[\"graveyard\"]\n\tvar best_data: CardData = null\n\tfor cd in grave:\n\t\tif cd.type == \"minion\" and cd.energy <= max_energy:\n\t\t\tif race_filter == \"\" or cd.race == race_filter:\n\t\t\t\tif best_data == null or cd.energy > best_data.energy:\n\t\t\t\t\tbest_data = cd\n\tif best_data == null:\n\t\treturn null\n\tvar inst: CardInstance = CardDatabase.create_instance(best_data.id, side)\n\t_log(\"⚰️ 【亡者召还_%d】从墓地复活了【%s】到第 %d 列！\" % [max_energy, inst.data.name, empty_l + 1])\n\t_place_minion_on_board(side, inst, empty_l)\n\t# 招募/亡者召还入场的随从同样在回合结束时统一发起攻击\n\treturn inst\n\n## 结束当前阵营回合（严格遵循思维导图结算顺序：瞬念召唤先于回合结束时触发；己方从左到右，敌方从右到左）\nfunc end_turn(side: int) -> void:\n\tif is_game_over or active_side != side:\n\t\treturn\n\n\t# 0. 点击回合结束后，当前回合方场上随从按顺序（我方从左到右 0..4，敌方从右到左 4..0）自动攻击\n\tvar atk_order: Array[int] = _get_lane_order(side)\n\tfor lane in atk_order:\n\t\tif is_game_over:\n\t\t\treturn\n\t\tvar attacker: CardInstance = board[side][lane]\n\t\tif attacker != null:\n\t\t\tperform_minion_combat(side, lane)\n\n\t# 1. 结算【瞬念召唤】（思维导图规则：「瞬念召唤先于回合结束时触发」）\n\t_process_invocation_effects(side)\n\n\t# 2. 再按顺序（己方从左到右 0..4，敌方从右到左 4..0）结算场上随从的【回合结束时】效果\n\tvar order: Array[int] = _get_lane_order(side)\n\tfor lane in order:\n\t\tvar m: CardInstance = board[side][lane]\n\t\tif m != null:\n\t\t\t_trigger_turn_end_effects(side, lane, m)\n\n\t# 3. 切换到对手回合\n\tif not is_game_over:\n\t\tif side == PLAYER:\n\t\t\tbegin_turn(ENEMY)\n\t\t\t_run_enemy_ai_turn()\n\t\telse:\n\t\t\tturn_number += 1\n\t\t\tbegin_turn(PLAYER)\n\n## 检查并触发牌库中的【瞬念召唤】（如「魔导机兵少女」「摇滚骷髅吉他手」）\nfunc _process_invocation_effects(side: int) -> void:\n\tvar st: Dictionary = leaders[side]\n\tvar deck: Array = st[\"deck\"]\n\n\t# 检查 1：魔导机兵少女 (cmwbx0mq8qz7f) —— 如果己方场上拥有 5 个机械随从，破坏全部随从，从牌库召唤并获得全体攻击\n\tvar mech_board_count: int = 0\n\tfor l in range(LANES):\n\t\tif board[side][l] != null and board[side][l].data.race == \"机械\":\n\t\t\tmech_board_count += 1\n\tif mech_board_count == 5:\n\t\tfor i in range(deck.size()):\n\t\t\tvar c: CardInstance = deck[i]\n\t\t\tif c.data.id == \"cmwbx0mq8qz7f\":\n\t\t\t\tdeck.remove_at(i)\n\t\t\t\t_log(\"🌟 满足 5 机械条件！触发【魔导机兵少女】瞬念召唤：破坏己方全部随从并降临战场（获得全体攻击）！\")\n\t\t\t\tfor l in range(LANES):\n\t\t\t\t\tif board[side][l] != null:\n\t\t\t\t\t\tdestroy_minion(side, l)\n\t\t\t\tvar empty_l: int = find_first_empty_lane(side)\n\t\t\t\tif empty_l != -1:\n\t\t\t\t\tc.grant_kw(\"全体攻击\", 1)\n\t\t\t\t\t_place_minion_on_board(side, c, empty_l)\n\t\t\t\t\tif not is_game_over and board[side][empty_l] == c:\n\t\t\t\t\t\tperform_minion_combat(side, empty_l)\n\t\t\t\tbreak\n\n\t# 检查 2：摇滚骷髅吉他手 (cmwbyp6f419ju) —— 若本次对战中自己被破坏的具有谢幕曲的随从 >= 10 个，召唤到战场上\n\tif int(st[\"destroyed_last_words_count\"]) >= 10 and find_first_empty_lane(side) != -1:\n\t\tfor i in range(deck.size()):\n\t\t\tvar c: CardInstance = deck[i]\n\t\t\tif c.data.id == \"cmwbyp6f419ju\":\n\t\t\t\tdeck.remove_at(i)\n\t\t\t\tvar empty_l: int = find_first_empty_lane(side)\n\t\t\t\t_log(\"🎸 已破坏 %d 个谢幕曲随从！触发【摇滚骷髅吉他手】瞬念召唤！\" % int(st[\"destroyed_last_words_count\"]))\n\t\t\t\t_place_minion_on_board(side, c, empty_l)\n\t\t\t\tif not is_game_over and board[side][empty_l] == c:\n\t\t\t\t\tperform_minion_combat(side, empty_l)\n\t\t\t\tbreak\n\nfunc _trigger_turn_start_effects(_side: int, _lane: int, _m: CardInstance) -> void:\n\tpass\n\nfunc _trigger_turn_end_effects(side: int, lane: int, m: CardInstance) -> void:\n\tif m.data.id == \"cmwc96kid9cw4\": # 掘墓者：【回合结束时】骨头+1\n\t\tadd_bones(side, 1, \"【掘墓者】回合结束\")\n\t\tfloating_text_requested.emit(side, lane, \"骨头+1\", Color(0.95, 0.9, 0.75))\n\nfunc _get_lane_order(side: int) -> Array[int]:\n\tif side == PLAYER:\n\t\treturn [0, 1, 2, 3, 4]\n\treturn [4, 3, 2, 1, 0]\n\nfunc _count_mech_in_hand(side: int) -> int:\n\tvar cnt: int = 0\n\tfor c in leaders[side][\"hand\"]:\n\t\tif c.data.race == \"机械\":\n\t\t\tcnt += 1\n\treturn cnt\n\n## 智能 AI 对手出牌与决策逻辑\nfunc _run_enemy_ai_turn() -> void:\n\tif is_game_over:\n\t\treturn\n\tvar st: Dictionary = leaders[ENEMY]\n\tvar acted: bool = true\n\twhile acted and not is_game_over:\n\t\tacted = false\n\t\tvar hand: Array = st[\"hand\"]\n\t\tfor c in hand.duplicate():\n\t\t\tvar check: Dictionary = can_play_card(ENEMY, c)\n\t\t\tif not bool(check.get(\"ok\", false)):\n\t\t\t\tcontinue\n\t\t\tvar is_enh: bool = (will_trigger_enhance(ENEMY, c) > 0)\n\t\t\tvar req: String = get_card_target_requirement(c, is_enh)\n\t\t\tvar eff_target: int = -1\n\t\t\tif req == \"enemy_minion\" or req == \"enemy_minion_hp3\":\n\t\t\t\tvar valid_t: Array[int] = get_valid_target_lanes(ENEMY, req, c.data.type == \"spell\")\n\t\t\t\tif valid_t.is_empty():\n\t\t\t\t\tif c.data.type == \"spell\":\n\t\t\t\t\t\tcontinue\n\t\t\t\telse:\n\t\t\t\t\teff_target = valid_t[0]\n\t\t\telif req == \"friendly_minion\":\n\t\t\t\tvar valid_f: Array[int] = get_valid_target_lanes(ENEMY, req, true)\n\t\t\t\tif valid_f.is_empty():\n\t\t\t\t\tcontinue\n\t\t\t\teff_target = valid_f[0]\n\n\t\t\t# 选择献祭祭品（优先选择攻击力最低的随从如松鼠、电子羊、骷髅）\n\t\t\tvar sac_lanes: Array[int] = []\n\t\t\tif c.data.sacrifice > 0:\n\t\t\t\tvar valid_s: Array[int] = get_valid_sacrifice_lanes(ENEMY, c.data.sacrifice_cond)\n\t\t\t\tvalid_s.sort_custom(func(la: int, lb: int) -> bool:\n\t\t\t\t\treturn board[ENEMY][la].current_atk < board[ENEMY][lb].current_atk\n\t\t\t\t)\n\t\t\t\tfor i in range(c.data.sacrifice):\n\t\t\t\t\tsac_lanes.append(valid_s[i])\n\n\t\t\t# 选择放置列（优先对位阻挡我方高攻随从或空列）\n\t\t\tvar place_lane: int = find_first_empty_lane(ENEMY)\n\t\t\tif place_lane == -1 and not sac_lanes.is_empty():\n\t\t\t\tplace_lane = sac_lanes[0]\n\t\t\tfor l in range(LANES):\n\t\t\t\tif board[ENEMY][l] == null and board[PLAYER][l] != null:\n\t\t\t\t\tplace_lane = l\n\t\t\t\t\tbreak\n\n\t\t\tvar choice_idx: int = 0\n\t\t\tif c.data.id == \"cmwc3gozg0rat\" and _count_mech_in_hand(ENEMY) >= 3:\n\t\t\t\tchoice_idx = 1\n\t\t\tif play_card_from_hand(ENEMY, c, max(0, place_lane), sac_lanes, eff_target, choice_idx):\n\t\t\t\tacted = true\n\t\t\t\tbreak\n\n\t# 尝试激活场上随从的【启动】能力\n\tfor l in range(LANES):\n\t\tif board[ENEMY][l] != null:\n\t\t\tactivate_minion_ability(ENEMY, l)\n\n\t# 敌方场攻结算：回合内已在各随从入场时立即攻击，此处对在场老随从执行本回合例行战道攻击\n\tfor l in [4, 3, 2, 1, 0]:\n\t\tif is_game_over:\n\t\t\tbreak\n\t\tvar m: CardInstance = board[ENEMY][l]\n\t\tif m != null:\n\t\t\tperform_minion_combat(ENEMY, l)\n\n\tif not is_game_over:\n\t\tend_turn(ENEMY)\n\nfunc _log(msg: String) -> void:\n\tbattle_log_added.emit(msg)\n\n## 按随从最先进入战场的顺序（enter_order 升序）依次分配伤害；随从死亡后剩余伤害继续转移给下一个随从，若 include_leader 为真则溢出伤害打在主战者身上\nfunc distribute_damage(target_side: int, total_dmg: int, include_leader: bool = true, source_minion: CardInstance = null) -> void:\n\tvar rem: int = total_dmg\n\twhile rem > 0 and not is_game_over:\n\t\tvar alive_lanes: Array[int] = []\n\t\tfor l in range(LANES):\n\t\t\tif board[target_side][l] != null:\n\t\t\t\talive_lanes.append(l)\n\t\tif alive_lanes.is_empty():\n\t\t\tif include_leader:\n\t\t\t\tdeal_damage_to_leader(target_side, rem, source_minion)\n\t\t\tbreak\n\t\talive_lanes.sort_custom(func(la: int, lb: int) -> bool:\n\t\t\treturn board[target_side][la].enter_order < board[target_side][lb].enter_order\n\t\t)\n\t\tvar first_lane: int = alive_lanes[0]\n\t\tvar m: CardInstance = board[target_side][first_lane]\n\t\tif m.has_kw(\"屏障\"):\n\t\t\tdeal_damage_to_minion(target_side, first_lane, 1, source_minion)\n\t\t\trem -= 1\n\t\telse:\n\t\t\tvar needed: int = max(1, m.current_hp)\n\t\t\tvar dmg_now: int = min(rem, needed)\n\t\t\tdeal_damage_to_minion(target_side, first_lane, dmg_now, source_minion)\n\t\t\trem -= dmg_now\n", "EffectScriptParser.gd": "class_name EffectScriptParser\nextends RefCounted\n## 影之诗：超凡世界标准规范用语通用效果解析器 (EffectScriptParser)\n## 让用户在「卡牌设计器」中按规范用语编写的任何新卡牌 JSON 无需修改代码即可自动解析并执行效果！\n##\n## 支持的标准规范用语语法（可自由组合多句，以句号「。」或换行分隔）：\n## 1. 抽牌与检索：\n##    - \"抽取X张卡牌\" / \"从牌库抽取X张「种族」随从\"\n## 2. 衍生物与手牌生成：\n##    - \"将X张『卡名』加入手牌\" / \"将X张和本随从同名的随从加入手牌\"\n## 3. 战场召唤、招募与亡者召还：\n##    - \"召唤X个『卡名』到战场上\" / \"召唤1张和本随从同名的卡牌加入战场\"\n##    - \"【招募_能量X】仅限「种族」，发动Y次\"\n##    - \"【亡者召还_能量X】仅限「种族」，发动Y次\"\n## 4. 伤害、破坏、消失、变身与恢复：\n##    - \"选择对手的战场上的1个随从，对其造成X点伤害\"\n##    - \"对对手的战场上的所有随从造成X点伤害\"\n##    - \"对对手的主战者造成X点伤害\"\n##    - \"回复自己的主战者X点生命值\"\n##    - \"选择1个生命值X以下敌方随从，使其消失\"\n##    - \"选择1个敌方随从，使其破坏\"\n## 5. 属性强化与词条赋予：\n##    - \"使其他「种族」随从获得+X/+Y\" / \"选择1个友方随从，使其获得+X/+Y\"\n##    - \"使其获得【守护】\" / \"使场上所有『卡名』获得【守护】\"\n## 6. 资源操作：\n##    - \"骨头+X\" / \"能量+X\" / \"你使用的下一张「种族」随从卡能量-X\"\n\nstatic func parse_clauses(effect_text: String) -> Array[Dictionary]:\n\tvar actions: Array[Dictionary] = []\n\tvar cleaned: String = effect_text.replace(\"\\n\", \"。\").replace(\"；\", \"。\")\n\tvar sentences: PackedStringArray = cleaned.split(\"。\", false)\n\tfor raw_s in sentences:\n\t\tvar s: String = raw_s.strip_edges()\n\t\tif s == \"\":\n\t\t\tcontinue\n\t\t# 骨头+X\n\t\tif s.find(\"骨头+\") != -1:\n\t\t\tvar idx: int = s.find(\"骨头+\") + 3\n\t\t\tvar val: int = max(1, s.substr(idx).to_int())\n\t\t\tactions.append({\"op\": \"add_bones\", \"value\": val})\n\t\t# 抽取X张卡牌\n\t\tif s.find(\"抽取\") != -1 and s.find(\"张\") != -1:\n\t\t\tvar val: int = 1\n\t\t\tfor ch_i in range(s.length()):\n\t\t\t\tif s.substr(ch_i, 1).is_valid_int():\n\t\t\t\t\tval = s.substr(ch_i, 1).to_int()\n\t\t\t\t\tbreak\n\t\t\tactions.append({\"op\": \"draw\", \"count\": val})\n\t\t# 对对手的战场上的所有随从造成X点伤害\n\t\tif (s.find(\"所有随从\") != -1 or s.find(\"随从全体\") != -1) and s.find(\"伤害\") != -1:\n\t\t\tvar dmg: int = _extract_first_int(s, 3)\n\t\t\tactions.append({\"op\": \"aoe_enemy_minions\", \"damage\": dmg})\n\t\t# 选择1个敌方随从造成X点伤害\n\t\telif (s.find(\"1个随从\") != -1 or s.find(\"1个敌方随从\") != -1) and s.find(\"伤害\") != -1:\n\t\t\tvar dmg: int = _extract_first_int(s.substr(s.find(\"造成\")), 3)\n\t\t\tactions.append({\"op\": \"damage_target_minion\", \"damage\": dmg})\n\t\t# 回复自己的主战者X点生命值\n\t\tif s.find(\"回复\") != -1 and s.find(\"主战者\") != -1:\n\t\t\tvar heal: int = _extract_first_int(s, 3)\n\t\t\tactions.append({\"op\": \"heal_leader\", \"amount\": heal})\n\treturn actions\n\nstatic func _extract_first_int(txt: String, default_val: int = 1) -> int:\n\tvar num_str: String = \"\"\n\tfor i in range(txt.length()):\n\t\tvar c: String = txt.substr(i, 1)\n\t\tif c.is_valid_int():\n\t\t\tnum_str += c\n\t\telif num_str != \"\":\n\t\t\tbreak\n\treturn num_str.to_int() if num_str != \"\" else default_val\n", "CardView.gd": "class_name CardView\nextends Control\n## 影之诗风格华丽卡面组件 (CardView)\n## 采用 Godot _draw() 程序化矢量绘制卡框、稀有度宝石、三维费用角标（能量/献祭/骨头）、种族主题插画、词条徽章与攻防数值\n## 支持鼠标悬停放大发光、可打出绿色流光呼吸、选中献祭红框等丰富交互反馈\n\nsignal card_clicked(card_view: CardView)\nsignal card_right_clicked(card_view: CardView)\nsignal card_hovered(card_view: CardView, is_hovering: bool)\n\n## 关联的静态卡牌模板数据\nvar card_data: CardData\n## 关联的运行时实例（若在手牌或战场上则非空）\nvar card_instance: CardInstance\n## 展示模式：\"hand\"（手牌）、\"board\"（战场随从）、\"gallery\"（构筑图鉴）\nvar display_mode: String = \"gallery\"\n## 是否处于可打出高亮状态\nvar is_playable: bool = false\n## 是否被当前选中（出牌选中或献祭选中）\nvar is_selected: bool = false\n## 是否为待选祭品高亮\nvar is_sacrifice_candidate: bool = false\n## 构筑模式下显示的已投入数量角标（0 表示不显示）\nvar deck_count_badge: int = 0\n\nvar _is_hovered: bool = false\nvar _hover_tween: Tween\n\nfunc _init() -> void:\n\tcustom_minimum_size = Vector2(150, 210)\n\tmouse_filter = Control.MOUSE_FILTER_STOP\n\nfunc setup_from_data(data: CardData, mode: String = \"gallery\") -> void:\n\tcard_data = data\n\tcard_instance = null\n\tdisplay_mode = mode\n\t_update_size_for_mode()\n\tqueue_redraw()\n\nfunc setup_from_instance(inst: CardInstance, mode: String = \"hand\") -> void:\n\tcard_instance = inst\n\tcard_data = inst.data if inst != null else null\n\tdisplay_mode = mode\n\t_update_size_for_mode()\n\tqueue_redraw()\n\nfunc _update_size_for_mode() -> void:\n\tmatch display_mode:\n\t\t\"board\":\n\t\t\tcustom_minimum_size = Vector2(136, 168)\n\t\t\"hand\":\n\t\t\tcustom_minimum_size = Vector2(142, 198)\n\t\t_:\n\t\t\tcustom_minimum_size = Vector2(156, 218)\n\tsize = custom_minimum_size\n\tpivot_offset = size * 0.5\n\nfunc _ready() -> void:\n\tmouse_entered.connect(_on_mouse_entered)\n\tmouse_exited.connect(_on_mouse_exited)\n\nfunc _gui_input(event: InputEvent) -> void:\n\tif event is InputEventMouseButton and event.pressed:\n\t\tif event.button_index == MOUSE_BUTTON_LEFT:\n\t\t\tcard_clicked.emit(self)\n\t\telif event.button_index == MOUSE_BUTTON_RIGHT:\n\t\t\tcard_right_clicked.emit(self)\n\nfunc _on_mouse_entered() -> void:\n\t_is_hovered = true\n\tz_index = 20\n\tif _hover_tween and _hover_tween.is_running():\n\t\t_hover_tween.kill()\n\t_hover_tween = create_tween().set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_BACK)\n\tvar target_scale := Vector2(1.14, 1.14) if display_mode == \"hand\" else Vector2(1.06, 1.06)\n\t_hover_tween.tween_property(self, \"scale\", target_scale, 0.14)\n\tcard_hovered.emit(self, true)\n\tqueue_redraw()\n\nfunc _on_mouse_exited() -> void:\n\t_is_hovered = false\n\tz_index = 0\n\tif _hover_tween and _hover_tween.is_running():\n\t\t_hover_tween.kill()\n\t_hover_tween = create_tween().set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_QUAD)\n\t_hover_tween.tween_property(self, \"scale\", Vector2.ONE, 0.12)\n\tcard_hovered.emit(self, false)\n\tqueue_redraw()\n\nfunc _draw() -> void:\n\tif card_data == null:\n\t\treturn\n\tvar rect := Rect2(Vector2.ZERO, size)\n\tvar font: Font = ThemeDB.fallback_font\n\tvar rarity_col: Color = card_data.get_rarity_color()\n\n\t# 1. 绘制外发光（可打出/选中/悬停/献祭候选）\n\tif is_selected:\n\t\t_draw_rounded_box(rect.grow(5.0), Color(1.0, 0.84, 0.25, 0.85), Color.TRANSPARENT, 0.0)\n\telif is_sacrifice_candidate:\n\t\t_draw_rounded_box(rect.grow(4.0), Color(0.95, 0.22, 0.28, 0.85), Color.TRANSPARENT, 0.0)\n\telif is_playable:\n\t\t_draw_rounded_box(rect.grow(3.5), Color(0.22, 0.95, 0.55, 0.72), Color.TRANSPARENT, 0.0)\n\telif _is_hovered:\n\t\t_draw_rounded_box(rect.grow(3.0), Color(0.45, 0.75, 1.0, 0.55), Color.TRANSPARENT, 0.0)\n\n\t# 2. 绘制卡牌底板与金属边框\n\tvar bg_col := Color(0.10, 0.12, 0.18)\n\tif card_data.race == \"机械\":\n\t\tbg_col = Color(0.09, 0.15, 0.24)\n\telif card_data.race == \"亡灵\":\n\t\tbg_col = Color(0.15, 0.10, 0.20)\n\telif card_data.type == \"spell\":\n\t\tbg_col = Color(0.18, 0.11, 0.16)\n\t_draw_rounded_box(rect, bg_col, rarity_col, 2.5)\n\n\t# 3. 绘制卡面中心程序化主题插画区\n\tvar art_h: float = size.y * (0.46 if display_mode != \"board\" else 0.54)\n\tvar art_rect := Rect2(Vector2(8, 28), Vector2(size.x - 16, art_h))\n\t_draw_procedural_art(art_rect)\n\n\t# 4. 绘制顶部名称横幅\n\tvar title_rect := Rect2(Vector2(6, 5), Vector2(size.x - 12, 22))\n\tdraw_rect(title_rect, Color(0.05, 0.06, 0.10, 0.88), true)\n\tdraw_string(font, Vector2(30, 21), card_data.name, HORIZONTAL_ALIGNMENT_LEFT, size.x - 36, 13, Color(0.98, 0.96, 0.90))\n\n\t# 5. 绘制左上角三维费用徽章（能量 / 献祭 / 骨头）\n\tvar eff_energy: int = card_instance.get_effective_energy() if card_instance != null else card_data.energy\n\tvar badge_y: float = 16.0\n\tif eff_energy > 0 or (card_data.sacrifice == 0 and card_data.bones == 0):\n\t\tdraw_circle(Vector2(16, badge_y), 12.0, Color(0.12, 0.56, 0.98))\n\t\tdraw_arc(Vector2(16, badge_y), 12.0, 0, TAU, 24, Color(0.75, 0.92, 1.0), 2.0)\n\t\tdraw_string(font, Vector2(6, badge_y + 5), str(eff_energy), HORIZONTAL_ALIGNMENT_CENTER, 20, 14, Color.WHITE)\n\t\tbadge_y += 24.0\n\tif card_data.sacrifice > 0:\n\t\tdraw_circle(Vector2(16, badge_y), 11.5, Color(0.78, 0.12, 0.18))\n\t\tdraw_arc(Vector2(16, badge_y), 11.5, 0, TAU, 24, Color(1.0, 0.65, 0.65), 1.8)\n\t\tdraw_string(font, Vector2(4, badge_y + 4), \"祭\" + str(card_data.sacrifice), HORIZONTAL_ALIGNMENT_CENTER, 24, 11, Color(1.0, 0.92, 0.92))\n\t\tbadge_y += 23.0\n\tif card_data.bones > 0:\n\t\tdraw_circle(Vector2(16, badge_y), 11.5, Color(0.72, 0.66, 0.52))\n\t\tdraw_arc(Vector2(16, badge_y), 11.5, 0, TAU, 24, Color(0.96, 0.94, 0.86), 1.8)\n\t\tdraw_string(font, Vector2(4, badge_y + 4), \"骨\" + str(card_data.bones), HORIZONTAL_ALIGNMENT_CENTER, 24, 11, Color(0.12, 0.10, 0.08))\n\n\t# 6. 绘制种族与类型飘带\n\tvar type_y: float = art_rect.end.y + 14.0\n\tdraw_rect(Rect2(Vector2(8, art_rect.end.y + 1), Vector2(size.x - 16, 16)), Color(0.06, 0.08, 0.13, 0.92), true)\n\tdraw_string(font, Vector2(10, type_y), card_data.get_type_cn() + \" · \" + card_data.rarity, HORIZONTAL_ALIGNMENT_CENTER, size.x - 20, 11, rarity_col)\n\n\t# 7. 绘制效果描述或战场词条徽章\n\tif display_mode == \"board\" and card_instance != null:\n\t\tvar badges: Array[String] = card_instance.get_badge_list()\n\t\tvar bx: float = 10.0\n\t\tvar by: float = type_y + 16.0\n\t\tfor b_txt in badges:\n\t\t\tvar bw: float = min(size.x - 20.0, float(b_txt.length() * 11 + 10))\n\t\t\tif bx + bw > size.x - 8.0:\n\t\t\t\tbx = 10.0\n\t\t\t\tby += 18.0\n\t\t\tdraw_rect(Rect2(Vector2(bx, by - 12), Vector2(bw, 16)), Color(0.18, 0.26, 0.42, 0.95), true)\n\t\t\tdraw_string(font, Vector2(bx + 4, by), b_txt, HORIZONTAL_ALIGNMENT_LEFT, bw - 4, 10, Color(0.95, 0.92, 0.65))\n\t\t\tbx += bw + 4.0\n\telse:\n\t\tvar desc_rect := Rect2(Vector2(8, type_y + 4), Vector2(size.x - 16, size.y - type_y - 30))\n\t\tdraw_rect(desc_rect, Color(0.05, 0.06, 0.09, 0.85), true)\n\t\tvar desc_str: String = card_data.get_display_text()\n\t\tif card_instance != null and not card_instance.extra_last_words.is_empty():\n\t\t\tdesc_str += \"\\n【附加谢幕曲】\"\n\t\t_draw_wrapped_text(font, desc_str, Rect2(desc_rect.position + Vector2(4, 12), desc_rect.size - Vector2(8, 6)), 10, Color(0.88, 0.90, 0.95))\n\n\t# 8. 如果是随从，绘制左下角攻击力与右下角生命值（含守护盾牌外框）\n\tif card_data.type == \"minion\":\n\t\tvar show_atk: int = card_instance.current_atk if card_instance != null else card_data.atk\n\t\tvar show_hp: int = card_instance.current_hp if card_instance != null else card_data.hp\n\t\tvar has_guard: bool = card_instance.has_kw(\"守护\") if card_instance != null else card_data.has_keyword(\"守护\")\n\t\tif has_guard:\n\t\t\tdraw_rect(rect.grow(-2.0), Color(0.95, 0.82, 0.32, 0.9), false, 3.0)\n\n\t\t# 左下角攻击力剑标\n\t\tvar atk_pos := Vector2(18, size.y - 16)\n\t\tdraw_circle(atk_pos, 14.0, Color(0.16, 0.44, 0.88))\n\t\tdraw_arc(atk_pos, 14.0, 0, TAU, 24, Color(0.65, 0.86, 1.0), 2.0)\n\t\tdraw_string(font, atk_pos + Vector2(-12, 5), str(show_atk), HORIZONTAL_ALIGNMENT_CENTER, 24, 14, Color.WHITE)\n\n\t\t# 右下角生命值血滴标\n\t\tvar hp_pos := Vector2(size.x - 18, size.y - 16)\n\t\tvar hp_col := Color(0.82, 0.18, 0.24)\n\t\tdraw_circle(hp_pos, 14.0, hp_col)\n\t\tdraw_arc(hp_pos, 14.0, 0, TAU, 24, Color(1.0, 0.72, 0.75), 2.0)\n\t\tvar txt_col := Color(0.4, 1.0, 0.5) if (card_instance != null and show_hp > card_data.hp) else Color.WHITE\n\t\tdraw_string(font, hp_pos + Vector2(-12, 5), str(show_hp), HORIZONTAL_ALIGNMENT_CENTER, 24, 14, txt_col)\n\n\t# 9. 构筑模式下若已投入卡组，右上角显示 \"×N\" 徽章\n\tif deck_count_badge > 0:\n\t\tvar badge_rect := Rect2(Vector2(size.x - 36, 4), Vector2(32, 20))\n\t\tdraw_rect(badge_rect, Color(0.92, 0.65, 0.12), true)\n\t\tdraw_string(font, Vector2(size.x - 34, 18), \"x%d\" % deck_count_badge, HORIZONTAL_ALIGNMENT_CENTER, 28, 12, Color(0.08, 0.08, 0.1))\n\n## 根据卡牌种族与属性绘制独特的程序化几何奇幻插画\nfunc _draw_procedural_art(r: Rect2) -> void:\n\tvar c1 := Color(0.14, 0.24, 0.38)\n\tvar c2 := Color(0.28, 0.65, 0.95)\n\tif card_data.race == \"机械\":\n\t\tc1 = Color(0.08, 0.22, 0.34)\n\t\tc2 = Color(0.15, 0.85, 0.96)\n\telif card_data.race == \"亡灵\":\n\t\tc1 = Color(0.16, 0.08, 0.24)\n\t\tc2 = Color(0.68, 0.32, 0.92)\n\telif card_data.type == \"spell\":\n\t\tc1 = Color(0.26, 0.10, 0.18)\n\t\tc2 = Color(0.98, 0.45, 0.25)\n\tdraw_rect(r, c1, true)\n\tvar center: Vector2 = r.get_center()\n\tvar radius: float = min(r.size.x, r.size.y) * 0.34\n\t# 依据卡牌 ID 哈希生成稳定的几何纹章\n\tvar seed_val: int = absi(card_data.id.hash())\n\tvar points_cnt: int = 3 + (seed_val % 5)\n\tdraw_circle(center, radius * 1.05, Color(c2.r, c2.g, c2.b, 0.22))\n\tdraw_arc(center, radius * 0.88, 0, TAU, 32, c2, 2.0)\n\tvar poly: PackedVector2Array = []\n\tfor i in range(points_cnt):\n\t\tvar ang: float = float(i) * TAU / float(points_cnt) - PI * 0.5\n\t\tpoly.append(center + Vector2(cos(ang), sin(ang)) * radius * 0.72)\n\tif poly.size() >= 3:\n\t\tdraw_colored_polygon(poly, Color(c2.r, c2.g, c2.b, 0.45))\n\tdraw_rect(r, card_data.get_rarity_color(), false, 1.2)\n\nfunc _draw_rounded_box(r: Rect2, fill: Color, border: Color, border_w: float) -> void:\n\tdraw_rect(r, fill, true)\n\tif border_w > 0.0:\n\t\tdraw_rect(r, border, false, border_w)\n\nfunc _draw_wrapped_text(font: Font, txt: String, area: Rect2, fsize: int, col: Color) -> void:\n\tvar lines: PackedStringArray = txt.split(\"\\n\")\n\tvar y: float = area.position.y\n\tvar max_chars_per_line: int = max(8, int(area.size.x / (float(fsize) * 0.95)))\n\tfor raw_line in lines:\n\t\tvar pos: int = 0\n\t\twhile pos < raw_line.length():\n\t\t\tif y > area.end.y:\n\t\t\t\treturn\n\t\t\tvar sub: String = raw_line.substr(pos, max_chars_per_line)\n\t\t\tdraw_string(font, Vector2(area.position.x, y), sub, HORIZONTAL_ALIGNMENT_LEFT, area.size.x, fsize, col)\n\t\t\ty += float(fsize) + 3.0\n\t\t\tpos += max_chars_per_line\n", "DeckBuilderView.gd": "class_name DeckBuilderView\nextends Control\n## 卡组构筑界面控制器 (DeckBuilderView)\n## 支持按种族/费用/关键词筛选全部 38 张卡牌、查看卡牌完整大图详情、左键添加/右键移除卡组卡牌、\n## 切换三套预设卡组、一键智能补满 40 张、导入卡牌设计器 v1.9 JSON 数据并持久化保存\n\nsignal back_to_menu_requested()\nsignal start_battle_requested()\n\nvar _filter_race: String = \"全部\"\nvar _include_tokens: bool = false\nvar _search_keyword: String = \"\"\n\nvar _card_grid: GridContainer\nvar _deck_list_vbox: VBoxContainer\nvar _deck_selector: OptionButton\nvar _status_label: Label\nvar _detail_label: RichTextLabel\nvar _file_dialog: FileDialog\nvar _import_text_edit: TextEdit\n\nfunc _ready() -> void:\n\t_build_ui()\n\t_refresh_all()\n\nfunc _build_ui() -> void:\n\t# 背景底色\n\tvar bg := ColorRect.new()\n\tbg.color = Color(0.06, 0.08, 0.13)\n\tbg.set_anchors_preset(Control.PRESET_FULL_RECT)\n\tadd_child(bg)\n\n\tvar root_vbox := VBoxContainer.new()\n\troot_vbox.set_anchors_preset(Control.PRESET_FULL_RECT)\n\troot_vbox.add_theme_constant_override(\"separation\", 10)\n\tadd_child(root_vbox)\n\n\t# 顶部导航与筛选工具栏\n\tvar top_bar := HBoxContainer.new()\n\ttop_bar.custom_minimum_size = Vector2(0, 52)\n\ttop_bar.add_theme_constant_override(\"separation\", 12)\n\troot_vbox.add_child(top_bar)\n\n\tvar btn_back := Button.new()\n\tbtn_back.text = \"◀ 返回主菜单\"\n\tbtn_back.custom_minimum_size = Vector2(130, 40)\n\tbtn_back.pressed.connect(func() -> void:\n\t\tAudioManager.play_sfx(\"click\")\n\t\tDeckManager.save_decks()\n\t\tback_to_menu_requested.emit()\n\t)\n\ttop_bar.add_child(btn_back)\n\n\tvar title_lbl := Label.new()\n\ttitle_lbl.text = \"🛠️ 卡组构筑工坊（左键加入卡组 / 右键移出卡组）\"\n\ttitle_lbl.add_theme_font_size_override(\"font_size\", 18)\n\ttop_bar.add_child(title_lbl)\n\n\t# 种族筛选按钮组\n\tfor r_name in [\"全部\", \"机械\", \"亡灵\", \"法术\"]:\n\t\tvar fb := Button.new()\n\t\tfb.text = r_name\n\t\tfb.custom_minimum_size = Vector2(68, 36)\n\t\tfb.pressed.connect(func() -> void:\n\t\t\tAudioManager.play_sfx(\"click\")\n\t\t\t_filter_race = r_name\n\t\t\t_refresh_card_pool()\n\t\t)\n\t\ttop_bar.add_child(fb)\n\n\tvar token_chk := CheckButton.new()\n\ttoken_chk.text = \"显示衍生物(电子羊/骷髅)\"\n\ttoken_chk.toggled.connect(func(on: bool) -> void:\n\t\t_include_tokens = on\n\t\t_refresh_card_pool()\n\t)\n\ttop_bar.add_child(token_chk)\n\n\tvar search_box := LineEdit.new()\n\tsearch_box.placeholder_text = \"搜索卡名/词条(如 谢幕曲/招募)...\"\n\tsearch_box.custom_minimum_size = Vector2(210, 36)\n\tsearch_box.text_changed.connect(func(new_txt: String) -> void:\n\t\t_search_keyword = new_txt.strip_edges()\n\t\t_refresh_card_pool()\n\t)\n\ttop_bar.add_child(search_box)\n\n\tvar btn_import := Button.new()\n\tbtn_import.text = \"📥 导入设计器JSON\"\n\tbtn_import.pressed.connect(_show_import_dialog)\n\ttop_bar.add_child(btn_import)\n\n\t# 主体左右分栏：左侧卡牌收藏网格 + 中部选中卡牌详情 + 右侧当前卡组列表\n\tvar body_hbox := HBoxContainer.new()\n\tbody_hbox.size_flags_vertical = Control.SIZE_EXPAND_FILL\n\tbody_hbox.add_theme_constant_override(\"separation\", 14)\n\troot_vbox.add_child(body_hbox)\n\n\t# 左侧卡牌池滚动区\n\tvar pool_scroll := ScrollContainer.new()\n\tpool_scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL\n\tpool_scroll.size_flags_stretch_ratio = 2.7\n\tbody_hbox.add_child(pool_scroll)\n\n\t_card_grid = GridContainer.new()\n\t_card_grid.columns = 5\n\t_card_grid.add_theme_constant_override(\"h_separation\", 14)\n\t_card_grid.add_theme_constant_override(\"v_separation\", 14)\n\tpool_scroll.add_child(_card_grid)\n\n\t# 右侧卡组管理面板\n\tvar right_panel := PanelContainer.new()\n\tright_panel.custom_minimum_size = Vector2(440, 0)\n\tbody_hbox.add_child(right_panel)\n\n\tvar right_vbox := VBoxContainer.new()\n\tright_vbox.add_theme_constant_override(\"separation\", 8)\n\tright_panel.add_child(right_vbox)\n\n\t# 预设卡组切换下拉框\n\tvar deck_top := HBoxContainer.new()\n\tright_vbox.add_child(deck_top)\n\t_deck_selector = OptionButton.new()\n\t_deck_selector.size_flags_horizontal = Control.SIZE_EXPAND_FILL\n\tfor i in range(DeckManager.decks.size()):\n\t\t_deck_selector.add_item(str(DeckManager.decks[i].get(\"name\", \"卡组 %d\" % (i + 1))), i)\n\t_deck_selector.selected = DeckManager.current_deck_index\n\t_deck_selector.item_selected.connect(func(idx: int) -> void:\n\t\tDeckManager.current_deck_index = idx\n\t\t_refresh_all()\n\t)\n\tdeck_top.add_child(_deck_selector)\n\n\tvar btn_auto := Button.new()\n\tbtn_auto.text = \"✨ 自动补满40张\"\n\tbtn_auto.pressed.connect(func() -> void:\n\t\tAudioManager.play_sfx(\"buff\")\n\t\tDeckManager.auto_complete_deck(DeckManager.get_current_deck())\n\t\tDeckManager.save_decks()\n\t\t_refresh_all()\n\t)\n\tdeck_top.add_child(btn_auto)\n\n\tvar btn_clear := Button.new()\n\tbtn_clear.text = \"🗑️ 清空\"\n\tbtn_clear.pressed.connect(func() -> void:\n\t\tAudioManager.play_sfx(\"click\")\n\t\tDeckManager.get_current_deck()[\"cards\"] = {}\n\t\t_refresh_all()\n\t)\n\tdeck_top.add_child(btn_clear)\n\n\t_status_label = Label.new()\n\t_status_label.add_theme_font_size_override(\"font_size\", 15)\n\tright_vbox.add_child(_status_label)\n\n\tvar deck_scroll := ScrollContainer.new()\n\tdeck_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL\n\tright_vbox.add_child(deck_scroll)\n\n\t_deck_list_vbox = VBoxContainer.new()\n\t_deck_list_vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL\n\t_deck_list_vbox.add_theme_constant_override(\"separation\", 4)\n\tdeck_scroll.add_child(_deck_list_vbox)\n\n\t# 选中卡牌完整规则详情展示框\n\t_detail_label = RichTextLabel.new()\n\t_detail_label.bbcode_enabled = true\n\t_detail_label.custom_minimum_size = Vector2(0, 150)\n\t_detail_label.text = \"[b]💡 悬停或点击左侧任意卡牌查看完整词条与设计师备注[/b]\"\n\tright_vbox.add_child(_detail_label)\n\n\tvar btn_battle := Button.new()\n\tbtn_battle.text = \"⚔️ 使用当前卡组开始对战\"\n\tbtn_battle.custom_minimum_size = Vector2(0, 46)\n\tbtn_battle.pressed.connect(func() -> void:\n\t\tvar check: Dictionary = DeckManager.validate_deck(DeckManager.get_current_deck())\n\t\tif not bool(check.get(\"valid\", false)):\n\t\t\tDeckManager.auto_complete_deck(DeckManager.get_current_deck())\n\t\tDeckManager.save_decks()\n\t\tAudioManager.play_sfx(\"turn\")\n\t\tstart_battle_requested.emit()\n\t)\n\tright_vbox.add_child(btn_battle)\n\n\t# 初始化本地文件选择弹窗（支持直接选择电脑中的 .json 卡牌设计器导出文件）\n\t_file_dialog = FileDialog.new()\n\t_file_dialog.file_mode = FileDialog.FILE_MODE_OPEN_FILE\n\t_file_dialog.access = FileDialog.ACCESS_FILESYSTEM\n\t_file_dialog.filters = PackedStringArray([\"*.json ; 卡牌设计器 JSON 文件\"])\n\t_file_dialog.title = \"选择电脑中的「卡牌构筑对战 · 卡牌设计器」JSON 文件\"\n\t_file_dialog.min_size = Vector2(720, 480)\n\t_file_dialog.file_selected.connect(_on_file_selected)\n\tadd_child(_file_dialog)\n\nfunc _refresh_all() -> void:\n\t_refresh_card_pool()\n\t_refresh_deck_list()\n\nfunc _refresh_card_pool() -> void:\n\tfor child in _card_grid.get_children():\n\t\tchild.queue_free()\n\tvar cur_deck: Dictionary = DeckManager.get_current_deck()\n\tvar cards_map: Dictionary = cur_deck.get(\"cards\", {})\n\tfor c in CardDatabase.all_cards:\n\t\tif not _include_tokens and c.is_token:\n\t\t\tcontinue\n\t\tif _filter_race == \"机械\" and c.race != \"机械\":\n\t\t\tcontinue\n\t\tif _filter_race == \"亡灵\" and c.race != \"亡灵\":\n\t\t\tcontinue\n\t\tif _filter_race == \"法术\" and c.type != \"spell\":\n\t\t\tcontinue\n\t\tif _search_keyword != \"\":\n\t\t\tvar hay: String = c.name + c.race + c.get_display_text() + c.notes\n\t\t\tif hay.find(_search_keyword) == -1:\n\t\t\t\tcontinue\n\n\t\tvar cv := CardView.new()\n\t\tcv.setup_from_data(c, \"gallery\")\n\t\tcv.deck_count_badge = int(cards_map.get(c.id, 0))\n\t\tcv.card_clicked.connect(func(_v: CardView) -> void:\n\t\t\t_add_card_to_current_deck(c)\n\t\t)\n\t\tcv.card_right_clicked.connect(func(_v: CardView) -> void:\n\t\t\t_remove_card_from_current_deck(c.id)\n\t\t)\n\t\tcv.card_hovered.connect(func(_v: CardView, hovering: bool) -> void:\n\t\t\tif hovering:\n\t\t\t\t_show_card_detail(c)\n\t\t)\n\t\t_card_grid.add_child(cv)\n\nfunc _refresh_deck_list() -> void:\n\tfor child in _deck_list_vbox.get_children():\n\t\tchild.queue_free()\n\tvar cur_deck: Dictionary = DeckManager.get_current_deck()\n\tvar cards_map: Dictionary = cur_deck.get(\"cards\", {})\n\tvar check: Dictionary = DeckManager.validate_deck(cur_deck)\n\t_status_label.text = str(check.get(\"reason\", \"\"))\n\t_status_label.modulate = Color(0.35, 1.0, 0.55) if bool(check.get(\"valid\", false)) else Color(1.0, 0.72, 0.35)\n\n\tvar sorted_ids: Array = cards_map.keys()\n\tsorted_ids.sort_custom(func(a: String, b: String) -> bool:\n\t\tvar ca: CardData = CardDatabase.get_card(a)\n\t\tvar cb: CardData = CardDatabase.get_card(b)\n\t\tif ca == null or cb == null:\n\t\t\treturn a < b\n\t\tif ca.energy != cb.energy:\n\t\t\treturn ca.energy < cb.energy\n\t\treturn ca.bones < cb.bones\n\t)\n\n\tfor cid in sorted_ids:\n\t\tvar cnt: int = int(cards_map[cid])\n\t\tif cnt <= 0:\n\t\t\tcontinue\n\t\tvar c: CardData = CardDatabase.get_card(cid)\n\t\tif c == null:\n\t\t\tcontinue\n\t\tvar row := HBoxContainer.new()\n\t\tvar cost_lbl := Label.new()\n\t\tvar cost_parts: PackedStringArray = []\n\t\tif c.energy > 0 or (c.sacrifice == 0 and c.bones == 0):\n\t\t\tcost_parts.append(\"⚡%d\" % c.energy)\n\t\tif c.sacrifice > 0:\n\t\t\tcost_parts.append(\"🩸%d\" % c.sacrifice)\n\t\tif c.bones > 0:\n\t\t\tcost_parts.append(\"🦴%d\" % c.bones)\n\t\tcost_lbl.text = \"[\" + \"/\".join(cost_parts) + \"]\"\n\t\tcost_lbl.custom_minimum_size = Vector2(90, 28)\n\t\trow.add_child(cost_lbl)\n\n\t\tvar name_btn := Button.new()\n\t\tname_btn.text = \"%s  × %d\" % [c.name, cnt]\n\t\tname_btn.size_flags_horizontal = Control.SIZE_EXPAND_FILL\n\t\tname_btn.alignment = HORIZONTAL_ALIGNMENT_LEFT\n\t\tname_btn.pressed.connect(func() -> void:\n\t\t\t_show_card_detail(c)\n\t\t\t_remove_card_from_current_deck(c.id)\n\t\t)\n\t\trow.add_child(name_btn)\n\t\t_deck_list_vbox.add_child(row)\n\nfunc _add_card_to_current_deck(c: CardData) -> void:\n\tif c.is_token:\n\t\t_show_card_detail(c)\n\t\treturn\n\tvar cur_deck: Dictionary = DeckManager.get_current_deck()\n\tvar cards_map: Dictionary = cur_deck.get(\"cards\", {})\n\tvar max_copies: int = int(CardDatabase.rules.get(\"copiesPerCard\", 3))\n\tvar max_total: int = int(CardDatabase.rules.get(\"deckSize\", 40))\n\tvar cur_cnt: int = int(cards_map.get(c.id, 0))\n\tif cur_cnt >= max_copies or DeckManager.get_deck_total_count(cur_deck) >= max_total:\n\t\tAudioManager.play_sfx(\"hit\")\n\t\treturn\n\tcards_map[c.id] = cur_cnt + 1\n\tAudioManager.play_sfx(\"click\")\n\tDeckManager.save_decks()\n\t_refresh_all()\n\nfunc _remove_card_from_current_deck(cid: String) -> void:\n\tvar cur_deck: Dictionary = DeckManager.get_current_deck()\n\tvar cards_map: Dictionary = cur_deck.get(\"cards\", {})\n\tif not cards_map.has(cid):\n\t\treturn\n\tvar cur_cnt: int = int(cards_map[cid]) - 1\n\tif cur_cnt <= 0:\n\t\tcards_map.erase(cid)\n\telse:\n\t\tcards_map[cid] = cur_cnt\n\tAudioManager.play_sfx(\"click\")\n\tDeckManager.save_decks()\n\t_refresh_all()\n\nfunc _show_card_detail(c: CardData) -> void:\n\tvar cost_info: String = \"能量:%d | 献祭:%d%s | 骨头:%d\" % [\n\t\tc.energy,\n\t\tc.sacrifice,\n\t\t(\"(%s)\" % c.sacrifice_cond if c.sacrifice_cond != \"\" else \"\"),\n\t\tc.bones\n\t]\n\tvar stat_info: String = (\"攻击:%d / 生命:%d\" % [c.atk, c.hp]) if c.type == \"minion\" else \"法术卡\"\n\tvar note_str: String = (\"\\n[color=#99b8ff]设计备注：%s[/color]\" % c.notes) if c.notes != \"\" else \"\"\n\t_detail_label.text = \"[b]【%s】[/b] (%s · %s)\\n%s  |  %s\\n[color=#ffe89e]%s[/color]%s\" % [\n\t\tc.name,\n\t\tc.get_type_cn(),\n\t\tc.rarity,\n\t\tcost_info,\n\t\tstat_info,\n\t\tc.get_display_text(),\n\t\tnote_str\n\t]\n\nfunc _show_import_dialog() -> void:\n\t_file_dialog.popup_centered()\n\nfunc _on_file_selected(file_path: String) -> void:\n\tif not FileAccess.file_exists(file_path):\n\t\treturn\n\tvar rf := FileAccess.open(file_path, FileAccess.READ)\n\tif rf == null:\n\t\treturn\n\tvar raw: String = rf.get_as_text()\n\trf.close()\n\tif CardDatabase.parse_json_string(raw, true):\n\t\tvar wf := FileAccess.open(\"user://custom_cards.json\", FileAccess.WRITE)\n\t\tif wf != null:\n\t\t\twf.store_string(raw)\n\t\t\twf.close()\n\t\tAudioManager.play_sfx(\"victory\")\n\t\t_refresh_all()\n", "BattleView.gd": "class_name BattleView\nextends Control\n## 影之诗 × 邪恶冥刻风格核心对战界面控制器 (BattleView)\n## 完整实现：\n## 1. 起手 4 张换牌调度弹窗（Mulligan，确保「使命必达小子」起手必在）\n## 2. 5 列战道实时对位展示、点击空位或献祭后放置随从、点击场上随从发动【启动】能力\n## 3. 多阶段流畅出牌交互状态机：选择手牌 -> 选择【抉择】分支 -> 选择【献祭】友方随从 -> 选择【法术/入场曲目标】 -> 选择放置列\n## 4. 实时三维资源仪表盘（能量水晶、骨头计数器、墓地与已破坏谢幕曲计数、连击计数）与飘字打击 Tween 动画\n\nsignal exit_battle_requested()\n\nenum PlayStep {\n\tIDLE,\n\tSELECT_CHOICE,\n\tSELECT_SACRIFICE,\n\tSELECT_EFFECT_TARGET,\n\tSELECT_HAND_TARGET,\n\tSELECT_LANE\n}\n\nvar engine: BattleEngine\nvar _step: PlayStep = PlayStep.IDLE\nvar _pending_card: CardInstance = null\nvar _pending_choice_idx: int = 0\nvar _pending_sac_lanes: Array[int] = []\nvar _pending_effect_target_lane: int = -1\nvar _pending_hand_target_uid: int = -1\n\nvar _enemy_leader_lbl: Label\nvar _player_leader_lbl: Label\nvar _prompt_banner: Label\nvar _enemy_lanes_hbox: HBoxContainer\nvar _player_lanes_hbox: HBoxContainer\nvar _hand_hbox: HBoxContainer\nvar _log_box: RichTextLabel\nvar _card_inspector: RichTextLabel\nvar _choice_overlay: PanelContainer\nvar _choice_vbox: VBoxContainer\nvar _mulligan_overlay: PanelContainer\nvar _mulligan_hbox: HBoxContainer\nvar _mulligan_selected: Array[int] = []\nvar _end_turn_btn: Button\n\nfunc _ready() -> void:\n\tengine = BattleEngine.new()\n\tadd_child(engine)\n\tengine.state_updated.connect(_refresh_ui)\n\tengine.battle_log_added.connect(_on_battle_log)\n\tengine.floating_text_requested.connect(_on_floating_text)\n\tengine.game_over_triggered.connect(_on_game_over)\n\t_build_ui()\n\t_start_new_match()\n\nfunc _start_new_match() -> void:\n\tvar p_deck: Array[String] = DeckManager.expand_deck_to_id_list(DeckManager.get_current_deck())\n\t# 为敌方 AI 随机挑选一套预设主题卡组\n\tvar ai_idx: int = 0 # 敌方AI固定使用全套40张「赛博机械狂潮」机械卡组\n\tvar e_deck: Array[String] = DeckManager.expand_deck_to_id_list(DeckManager.decks[ai_idx])\n\tengine.start_battle(p_deck, e_deck)\n\t_show_mulligan_popup()\n\t_refresh_ui()\n\nfunc _build_ui() -> void:\n\tvar bg := ColorRect.new()\n\tbg.color = Color(0.05, 0.07, 0.12)\n\tbg.set_anchors_preset(Control.PRESET_FULL_RECT)\n\tadd_child(bg)\n\n\tvar main_hbox := HBoxContainer.new()\n\tmain_hbox.set_anchors_preset(Control.PRESET_FULL_RECT)\n\tmain_hbox.add_theme_constant_override(\"separation\", 10)\n\tadd_child(main_hbox)\n\n\t# 左侧战报与卡牌放大检视栏\n\tvar left_panel := PanelContainer.new()\n\tleft_panel.custom_minimum_size = Vector2(310, 0)\n\tmain_hbox.add_child(left_panel)\n\n\tvar left_vbox := VBoxContainer.new()\n\tleft_vbox.add_theme_constant_override(\"separation\", 8)\n\tleft_panel.add_child(left_vbox)\n\n\tvar top_btns := HBoxContainer.new()\n\tleft_vbox.add_child(top_btns)\n\n\tvar btn_exit := Button.new()\n\tbtn_exit.text = \"◀ 撤退返回\"\n\tbtn_exit.pressed.connect(func() -> void:\n\t\tAudioManager.play_sfx(\"click\")\n\t\texit_battle_requested.emit()\n\t)\n\ttop_btns.add_child(btn_exit)\n\n\tvar btn_rematch := Button.new()\n\tbtn_rematch.text = \"🔄 重新开局\"\n\tbtn_rematch.pressed.connect(func() -> void:\n\t\tAudioManager.play_sfx(\"turn\")\n\t\t_log_box.clear()\n\t\t_start_new_match()\n\t)\n\ttop_btns.add_child(btn_rematch)\n\n\t_card_inspector = RichTextLabel.new()\n\t_card_inspector.bbcode_enabled = true\n\t_card_inspector.custom_minimum_size = Vector2(0, 210)\n\t_card_inspector.text = \"[b]🔍 卡牌详情检视[/b]\\n将鼠标悬停在任意手牌或战场随从上查看完整效果。\"\n\tleft_vbox.add_child(_card_inspector)\n\n\tvar log_title := Label.new()\n\tlog_title.text = \"📜 实时战斗结算记录\"\n\tleft_vbox.add_child(log_title)\n\n\t_log_box = RichTextLabel.new()\n\t_log_box.bbcode_enabled = true\n\t_log_box.scroll_following = true\n\t_log_box.size_flags_vertical = Control.SIZE_EXPAND_FILL\n\tleft_vbox.add_child(_log_box)\n\n\t# 右侧主战场区（敌方信息栏 -> 敌方5列战道 -> 交互提示条 -> 我方5列战道 -> 我方资源与手牌栏）\n\tvar center_vbox := VBoxContainer.new()\n\tcenter_vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL\n\tcenter_vbox.add_theme_constant_override(\"separation\", 8)\n\tmain_hbox.add_child(center_vbox)\n\n\t# 敌方主战者状态栏\n\tvar enemy_bar := PanelContainer.new()\n\tenemy_bar.custom_minimum_size = Vector2(0, 44)\n\tcenter_vbox.add_child(enemy_bar)\n\t_enemy_leader_lbl = Label.new()\n\t_enemy_leader_lbl.add_theme_font_size_override(\"font_size\", 16)\n\tenemy_bar.add_child(_enemy_leader_lbl)\n\n\t# 敌方 5 列战道\n\t_enemy_lanes_hbox = HBoxContainer.new()\n\t_enemy_lanes_hbox.alignment = BoxContainer.ALIGNMENT_CENTER\n\t_enemy_lanes_hbox.add_theme_constant_override(\"separation\", 18)\n\t_enemy_lanes_hbox.custom_minimum_size = Vector2(0, 185)\n\tcenter_vbox.add_child(_enemy_lanes_hbox)\n\n\t# 中央交互操作提示横幅 + 结束回合按钮\n\tvar mid_bar := HBoxContainer.new()\n\tmid_bar.custom_minimum_size = Vector2(0, 42)\n\tcenter_vbox.add_child(mid_bar)\n\n\t_prompt_banner = Label.new()\n\t_prompt_banner.size_flags_horizontal = Control.SIZE_EXPAND_FILL\n\t_prompt_banner.add_theme_font_size_override(\"font_size\", 16)\n\t_prompt_banner.modulate = Color(1.0, 0.88, 0.38)\n\tmid_bar.add_child(_prompt_banner)\n\n\tvar btn_cancel := Button.new()\n\tbtn_cancel.text = \"取消选牌 (右键)\"\n\tbtn_cancel.pressed.connect(_cancel_pending_play)\n\tmid_bar.add_child(btn_cancel)\n\n\t_end_turn_btn = Button.new()\n\t_end_turn_btn.text = \"⏳ 结束回合\"\n\t_end_turn_btn.custom_minimum_size = Vector2(150, 40)\n\t_end_turn_btn.pressed.connect(func() -> void:\n\t\tif engine.active_side == BattleEngine.PLAYER and not engine.is_game_over:\n\t\t\t_cancel_pending_play()\n\t\t\tAudioManager.play_sfx(\"turn\")\n\t\t\tengine.end_turn(BattleEngine.PLAYER)\n\t)\n\tmid_bar.add_child(_end_turn_btn)\n\n\t# 我方 5 列战道\n\t_player_lanes_hbox = HBoxContainer.new()\n\t_player_lanes_hbox.alignment = BoxContainer.ALIGNMENT_CENTER\n\t_player_lanes_hbox.add_theme_constant_override(\"separation\", 18)\n\t_player_lanes_hbox.custom_minimum_size = Vector2(0, 185)\n\tcenter_vbox.add_child(_player_lanes_hbox)\n\n\t# 我方主战者三维资源状态栏\n\tvar player_bar := PanelContainer.new()\n\tplayer_bar.custom_minimum_size = Vector2(0, 46)\n\tcenter_vbox.add_child(player_bar)\n\t_player_leader_lbl = Label.new()\n\t_player_leader_lbl.add_theme_font_size_override(\"font_size\", 16)\n\tplayer_bar.add_child(_player_leader_lbl)\n\n\t# 我方底部手牌区\n\tvar hand_scroll := ScrollContainer.new()\n\thand_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL\n\tcenter_vbox.add_child(hand_scroll)\n\n\t_hand_hbox = HBoxContainer.new()\n\t_hand_hbox.alignment = BoxContainer.ALIGNMENT_CENTER\n\t_hand_hbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL\n\t_hand_hbox.add_theme_constant_override(\"separation\", 10)\n\thand_scroll.add_child(_hand_hbox)\n\n\t# 【抉择】弹窗浮层\n\t_choice_overlay = PanelContainer.new()\n\t_choice_overlay.visible = false\n\t_choice_overlay.custom_minimum_size = Vector2(520, 220)\n\t_choice_overlay.position = Vector2(540, 300)\n\tadd_child(_choice_overlay)\n\t_choice_vbox = VBoxContainer.new()\n\t_choice_vbox.add_theme_constant_override(\"separation\", 12)\n\t_choice_overlay.add_child(_choice_vbox)\n\n\t# 起手 4 张换牌调度弹窗浮层\n\t_mulligan_overlay = PanelContainer.new()\n\t_mulligan_overlay.visible = false\n\t_mulligan_overlay.custom_minimum_size = Vector2(760, 340)\n\t_mulligan_overlay.position = Vector2(420, 240)\n\tadd_child(_mulligan_overlay)\n\tvar mul_vbox := VBoxContainer.new()\n\tmul_vbox.add_theme_constant_override(\"separation\", 14)\n\t_mulligan_overlay.add_child(mul_vbox)\n\tvar mul_title := Label.new()\n\tmul_title.text = \"🎴 起手换牌调度：点击勾选想要替换回牌库的卡牌（【使命必达小子】必在起手中）\"\n\tmul_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER\n\tmul_vbox.add_child(mul_title)\n\t_mulligan_hbox = HBoxContainer.new()\n\t_mulligan_hbox.alignment = BoxContainer.ALIGNMENT_CENTER\n\t_mulligan_hbox.add_theme_constant_override(\"separation\", 16)\n\tmul_vbox.add_child(_mulligan_hbox)\n\tvar mul_confirm := Button.new()\n\tmul_confirm.text = \"✅ 确认起手手牌并开始第 1 回合\"\n\tmul_confirm.custom_minimum_size = Vector2(260, 42)\n\tmul_confirm.pressed.connect(_confirm_mulligan)\n\tmul_vbox.add_child(mul_confirm)\n\nfunc _show_mulligan_popup() -> void:\n\t_mulligan_selected.clear()\n\t_mulligan_overlay.visible = true\n\t_rebuild_mulligan_cards()\n\nfunc _rebuild_mulligan_cards() -> void:\n\tfor c in _mulligan_hbox.get_children():\n\t\tc.queue_free()\n\tvar hand: Array = engine.leaders[BattleEngine.PLAYER][\"hand\"]\n\tfor i in range(hand.size()):\n\t\tvar inst: CardInstance = hand[i]\n\t\tvar vbox := VBoxContainer.new()\n\t\tvar cv := CardView.new()\n\t\tcv.setup_from_instance(inst, \"hand\")\n\t\tcv.is_selected = _mulligan_selected.has(i)\n\t\tvar idx: int = i\n\t\tcv.card_clicked.connect(func(_v: CardView) -> void:\n\t\t\tif _mulligan_selected.has(idx):\n\t\t\t\t_mulligan_selected.erase(idx)\n\t\t\telse:\n\t\t\t\t_mulligan_selected.append(idx)\n\t\t\tAudioManager.play_sfx(\"click\")\n\t\t\t_rebuild_mulligan_cards()\n\t\t)\n\t\tvbox.add_child(cv)\n\t\tvar tag := Label.new()\n\t\ttag.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER\n\t\ttag.text = \"🔄 替换此牌\" if _mulligan_selected.has(i) else \"✔️ 保留\"\n\t\tvbox.add_child(tag)\n\t\t_mulligan_hbox.add_child(vbox)\n\nfunc _confirm_mulligan() -> void:\n\t_mulligan_overlay.visible = false\n\tengine.perform_mulligan(BattleEngine.PLAYER, _mulligan_selected)\n\tengine.begin_turn(BattleEngine.PLAYER)\n\nfunc _refresh_ui() -> void:\n\tvar pst: Dictionary = engine.leaders[BattleEngine.PLAYER]\n\tvar est: Dictionary = engine.leaders[BattleEngine.ENEMY]\n\n\t_enemy_leader_lbl.text = \"👹 敌方主战者  ❤️ 生命: %d/%d  |  ⚡ 能量: %d/%d  |  🦴 骨头: %d  |  🃏 手牌: %d  |  牌库: %d  |  墓地: %d\" % [\n\t\tint(est[\"hp\"]), int(est[\"max_hp\"]),\n\t\tint(est[\"energy\"]), int(est[\"max_energy\"]),\n\t\tint(est[\"bones\"]),\n\t\test[\"hand\"].size(), est[\"deck\"].size(), est[\"graveyard\"].size()\n\t]\n\t_player_leader_lbl.text = \"🛡️ 我方主战者  ❤️ 生命: %d/%d  |  ⚡ 能量: %d/%d  |  🦴 骨头: %d  |  🔥 本回合连击: %d  |  ⚰️ 已破坏谢幕曲: %d  |  牌库: %d\" % [\n\t\tint(pst[\"hp\"]), int(pst[\"max_hp\"]),\n\t\tint(pst[\"energy\"]), int(pst[\"max_energy\"]),\n\t\tint(pst[\"bones\"]),\n\t\tint(pst[\"cards_played_this_turn\"]),\n\t\tint(pst[\"destroyed_last_words_count\"]),\n\t\tpst[\"deck\"].size()\n\t]\n\n\t_update_prompt_banner()\n\t_rebuild_lanes()\n\t_rebuild_hand()\n\nfunc _update_prompt_banner() -> void:\n\tif engine.is_game_over:\n\t\treturn\n\tmatch _step:\n\t\tPlayStep.IDLE:\n\t\t\t_prompt_banner.text = \"💡 你的回合：点击下方绿色发光手牌出牌（随从放置后将立即对前方发起攻击），或点击场上【赛博牧羊人】发动【启动】能力。\"\n\t\tPlayStep.SELECT_CHOICE:\n\t\t\t_prompt_banner.text = \"⚖️ 请在弹窗中选择【%s】的【抉择】发动分支...\" % _pending_card.data.name\n\t\tPlayStep.SELECT_SACRIFICE:\n\t\t\tvar need: int = _pending_card.data.sacrifice\n\t\t\tvar cond: String = _pending_card.data.sacrifice_cond\n\t\t\t_prompt_banner.text = \"🩸 献祭阶段：请点击我方战场上 %d 个%s随从作为祭品（已选 %d/%d）\" % [\n\t\t\t\tneed, (\"「%s」\" % cond if cond != \"\" else \"\"), _pending_sac_lanes.size(), need\n\t\t\t]\n\t\tPlayStep.SELECT_EFFECT_TARGET:\n\t\t\t_prompt_banner.text = \"🎯 目标指定：请点击战场上高亮的目标随从以结算【%s】的效果\" % _pending_card.data.name\n\t\tPlayStep.SELECT_HAND_TARGET:\n\t\t\t_prompt_banner.text = \"🃏 手牌选择：请点击下方 1 张其他手牌洗回牌库（【%s】入场曲）\" % _pending_card.data.name\n\t\tPlayStep.SELECT_LANE:\n\t\t\t_prompt_banner.text = \"📍 战道部署：请点击我方 5 列战道中的任意空位（或刚才选定的祭品位置）放置【%s】\" % _pending_card.data.name\n\nfunc _rebuild_lanes() -> void:\n\tfor c in _enemy_lanes_hbox.get_children():\n\t\tc.queue_free()\n\tfor c in _player_lanes_hbox.get_children():\n\t\tc.queue_free()\n\n\tfor lane in range(BattleEngine.LANES):\n\t\t_enemy_lanes_hbox.add_child(_create_lane_slot(BattleEngine.ENEMY, lane))\n\t\t_player_lanes_hbox.add_child(_create_lane_slot(BattleEngine.PLAYER, lane))\n\nfunc _create_lane_slot(side: int, lane: int) -> Control:\n\tvar slot := PanelContainer.new()\n\tslot.custom_minimum_size = Vector2(150, 178)\n\tvar m: CardInstance = engine.board[side][lane]\n\tif m != null:\n\t\tvar cv := CardView.new()\n\t\tcv.setup_from_instance(m, \"board\")\n\t\tif side == BattleEngine.PLAYER and _step == PlayStep.SELECT_SACRIFICE:\n\t\t\tvar valid_s: Array[int] = engine.get_valid_sacrifice_lanes(BattleEngine.PLAYER, _pending_card.data.sacrifice_cond)\n\t\t\tcv.is_sacrifice_candidate = valid_s.has(lane)\n\t\t\tcv.is_selected = _pending_sac_lanes.has(lane)\n\t\tcv.card_clicked.connect(func(_v: CardView) -> void:\n\t\t\t_on_lane_clicked(side, lane)\n\t\t)\n\t\tcv.card_hovered.connect(func(_v: CardView, hov: bool) -> void:\n\t\t\tif hov:\n\t\t\t\t_inspect_instance(m)\n\t\t)\n\t\tslot.add_child(cv)\n\telse:\n\t\tvar empty_btn := Button.new()\n\t\tempty_btn.text = \"%s战道 %d\\n[空位]\" % [\"敌方\" if side == BattleEngine.ENEMY else \"我方\", lane + 1]\n\t\tempty_btn.size_flags_horizontal = Control.SIZE_EXPAND_FILL\n\t\tempty_btn.size_flags_vertical = Control.SIZE_EXPAND_FILL\n\t\tempty_btn.pressed.connect(func() -> void:\n\t\t\t_on_lane_clicked(side, lane)\n\t\t)\n\t\tslot.add_child(empty_btn)\n\treturn slot\n\nfunc _rebuild_hand() -> void:\n\tfor c in _hand_hbox.get_children():\n\t\tc.queue_free()\n\tvar hand: Array = engine.leaders[BattleEngine.PLAYER][\"hand\"]\n\tfor inst in hand:\n\t\tvar cv := CardView.new()\n\t\tcv.setup_from_instance(inst, \"hand\")\n\t\tvar check: Dictionary = engine.can_play_card(BattleEngine.PLAYER, inst)\n\t\tcv.is_playable = (engine.active_side == BattleEngine.PLAYER and bool(check.get(\"ok\", false)))\n\t\tcv.is_selected = (_pending_card == inst)\n\t\tcv.card_clicked.connect(func(_v: CardView) -> void:\n\t\t\t_on_hand_card_clicked(inst)\n\t\t)\n\t\tcv.card_right_clicked.connect(func(_v: CardView) -> void:\n\t\t\t_cancel_pending_play()\n\t\t)\n\t\tcv.card_hovered.connect(func(_v: CardView, hov: bool) -> void:\n\t\t\tif hov:\n\t\t\t\t_inspect_instance(inst)\n\t\t)\n\t\t_hand_hbox.add_child(cv)\n\n## 点击手牌时的多阶段状态流转\nfunc _on_hand_card_clicked(inst: CardInstance) -> void:\n\tif engine.active_side != BattleEngine.PLAYER or engine.is_game_over:\n\t\treturn\n\t# 若当前处于「滑板跃迁手」选择一张其他手牌洗入牌库的步骤\n\tif _step == PlayStep.SELECT_HAND_TARGET and inst != _pending_card:\n\t\t_pending_hand_target_uid = inst.uid\n\t\t_advance_play_pipeline()\n\t\treturn\n\n\tvar check: Dictionary = engine.can_play_card(BattleEngine.PLAYER, inst)\n\tif not bool(check.get(\"ok\", false)):\n\t\t_prompt_banner.text = \"⚠️ 无法打出【%s】：%s\" % [inst.data.name, str(check.get(\"reason\", \"\"))]\n\t\tAudioManager.play_sfx(\"hit\")\n\t\treturn\n\n\t_pending_card = inst\n\t_pending_choice_idx = 0\n\t_pending_sac_lanes.clear()\n\t_pending_effect_target_lane = -1\n\t_pending_hand_target_uid = -1\n\tAudioManager.play_sfx(\"click\")\n\n\t# 检查是否包含【抉择】\n\tvar choices: Array = engine.get_card_choices(inst)\n\tif not choices.is_empty():\n\t\t_step = PlayStep.SELECT_CHOICE\n\t\t_show_choice_popup(inst, choices)\n\t\t_refresh_ui()\n\t\treturn\n\n\t_advance_play_pipeline()\n\nfunc _show_choice_popup(inst: CardInstance, choices: Array) -> void:\n\tfor c in _choice_vbox.get_children():\n\t\tc.queue_free()\n\tvar title := Label.new()\n\ttitle.text = \"⚖️ 请选择【%s】要发动的【抉择】能力：\" % inst.data.name\n\t_choice_vbox.add_child(title)\n\tfor i in range(choices.size()):\n\t\tvar opt: Dictionary = choices[i]\n\t\tvar opt_txt: String = str(opt.get(\"t\", \"\"))\n\t\tif opt_txt == \"\":\n\t\t\tvar reans: Array = opt.get(\"reans\", [])\n\t\t\tif not reans.is_empty():\n\t\t\t\tvar r0: Dictionary = reans[0]\n\t\t\t\topt_txt = \"【%s_能量%d】仅限「%s」%s\" % [\n\t\t\t\t\tstr(r0.get(\"k\", \"\")),\n\t\t\t\t\tint(r0.get(\"costs\", {}).get(\"energy\", 0)),\n\t\t\t\t\tstr(r0.get(\"type\", \"\")),\n\t\t\t\t\tstr(r0.get(\"effect\", \"\"))\n\t\t\t\t]\n\t\tvar b := Button.new()\n\t\tb.text = \"选项 (%d)：%s\" % [i + 1, opt_txt]\n\t\tb.custom_minimum_size = Vector2(460, 44)\n\t\tvar pick_idx: int = i\n\t\tb.pressed.connect(func() -> void:\n\t\t\t_pending_choice_idx = pick_idx\n\t\t\t_choice_overlay.visible = false\n\t\t\tAudioManager.play_sfx(\"click\")\n\t\t\t_advance_play_pipeline()\n\t\t)\n\t\t_choice_vbox.add_child(b)\n\t_choice_overlay.visible = true\n\n## 自动推进出牌流水线：献祭 -> 手牌目标 -> 战场目标 -> 选择战道放置（或法术直接释放）\nfunc _advance_play_pipeline() -> void:\n\tif _pending_card == null:\n\t\treturn\n\n\t# 1. 是否还需要选择献祭随从\n\tif _pending_card.data.sacrifice > _pending_sac_lanes.size():\n\t\t_step = PlayStep.SELECT_SACRIFICE\n\t\t_refresh_ui()\n\t\treturn\n\n\t# 2. 是否需要选择另一张手牌（如「滑板跃迁手」）\n\tvar is_enh: bool = (engine.will_trigger_enhance(BattleEngine.PLAYER, _pending_card) > 0)\n\tvar req: String = engine.get_card_target_requirement(_pending_card, is_enh)\n\tvar hand: Array = engine.leaders[BattleEngine.PLAYER][\"hand\"]\n\tif req == \"hand_card\" and _pending_hand_target_uid == -1 and hand.size() > 1:\n\t\t_step = PlayStep.SELECT_HAND_TARGET\n\t\t_refresh_ui()\n\t\treturn\n\n\t# 3. 是否需要指定战场上的敌方/友方随从目标\n\tif req in [\"enemy_minion\", \"enemy_minion_hp3\", \"friendly_minion\"] and _pending_effect_target_lane == -1:\n\t\tvar valid_lanes: Array[int] = engine.get_valid_target_lanes(BattleEngine.PLAYER, req, _pending_card.data.type == \"spell\")\n\t\tif not valid_lanes.is_empty():\n\t\t\t_step = PlayStep.SELECT_EFFECT_TARGET\n\t\t\t_refresh_ui()\n\t\t\treturn\n\t\telif _pending_card.data.type == \"spell\":\n\t\t\t_prompt_banner.text = \"⚠️ 场上有合法目标时才能使用法术【%s】！\" % _pending_card.data.name\n\t\t\t_cancel_pending_play()\n\t\t\treturn\n\n\t# 4. 若是法术，无需选择放置列，立即结算\n\tif _pending_card.data.type == \"spell\":\n\t\tengine.play_card_from_hand(\n\t\t\tBattleEngine.PLAYER,\n\t\t\t_pending_card,\n\t\t\t0,\n\t\t\t_pending_sac_lanes,\n\t\t\t_pending_effect_target_lane,\n\t\t\t_pending_choice_idx,\n\t\t\t_pending_hand_target_uid\n\t\t)\n\t\t_cancel_pending_play()\n\t\treturn\n\n\t# 5. 若是随从，进入选择我方战道列步骤\n\t_step = PlayStep.SELECT_LANE\n\t_refresh_ui()\n\n## 点击我方或敌方战道列时的响应\nfunc _on_lane_clicked(side: int, lane: int) -> void:\n\tif engine.active_side != BattleEngine.PLAYER or engine.is_game_over:\n\t\treturn\n\n\tmatch _step:\n\t\tPlayStep.IDLE:\n\t\t\t# 空闲状态下点击我方随从可尝试触发其【启动】能力（如「赛博牧羊人」）\n\t\t\tif side == BattleEngine.PLAYER and engine.board[side][lane] != null:\n\t\t\t\tif not engine.activate_minion_ability(BattleEngine.PLAYER, lane):\n\t\t\t\t\t_inspect_instance(engine.board[side][lane])\n\n\t\tPlayStep.SELECT_SACRIFICE:\n\t\t\tif side == BattleEngine.PLAYER and engine.board[side][lane] != null:\n\t\t\t\tvar valid_s: Array[int] = engine.get_valid_sacrifice_lanes(BattleEngine.PLAYER, _pending_card.data.sacrifice_cond)\n\t\t\t\tif valid_s.has(lane):\n\t\t\t\t\tif _pending_sac_lanes.has(lane):\n\t\t\t\t\t\t_pending_sac_lanes.erase(lane)\n\t\t\t\t\telse:\n\t\t\t\t\t\t_pending_sac_lanes.append(lane)\n\t\t\t\t\tAudioManager.play_sfx(\"click\")\n\t\t\t\t\t_advance_play_pipeline()\n\n\t\tPlayStep.SELECT_EFFECT_TARGET:\n\t\t\tvar is_enh: bool = (engine.will_trigger_enhance(BattleEngine.PLAYER, _pending_card) > 0)\n\t\t\tvar req: String = engine.get_card_target_requirement(_pending_card, is_enh)\n\t\t\tvar expected_side: int = BattleEngine.PLAYER if req == \"friendly_minion\" else BattleEngine.ENEMY\n\t\t\tvar valid_t: Array[int] = engine.get_valid_target_lanes(BattleEngine.PLAYER, req, _pending_card.data.type == \"spell\")\n\t\t\tif side == expected_side and valid_t.has(lane):\n\t\t\t\t_pending_effect_target_lane = lane\n\t\t\t\tAudioManager.play_sfx(\"click\")\n\t\t\t\t_advance_play_pipeline()\n\n\t\tPlayStep.SELECT_LANE:\n\t\t\tif side == BattleEngine.PLAYER:\n\t\t\t\tif engine.board[side][lane] == null or _pending_sac_lanes.has(lane):\n\t\t\t\t\tengine.play_card_from_hand(\n\t\t\t\t\t\tBattleEngine.PLAYER,\n\t\t\t\t\t\t_pending_card,\n\t\t\t\t\t\tlane,\n\t\t\t\t\t\t_pending_sac_lanes,\n\t\t\t\t\t\t_pending_effect_target_lane,\n\t\t\t\t\t\t_pending_choice_idx,\n\t\t\t\t\t\t_pending_hand_target_uid\n\t\t\t\t\t)\n\t\t\t\t\t_cancel_pending_play()\n\nfunc _cancel_pending_play() -> void:\n\t_step = PlayStep.IDLE\n\t_pending_card = null\n\t_pending_sac_lanes.clear()\n\t_pending_effect_target_lane = -1\n\t_pending_hand_target_uid = -1\n\t_choice_overlay.visible = false\n\t_refresh_ui()\n\nfunc _inspect_instance(inst: CardInstance) -> void:\n\tif inst == null:\n\t\treturn\n\tvar c: CardData = inst.data\n\tvar badges: String = \"、\".join(inst.get_badge_list())\n\t_card_inspector.text = \"[b]【%s】[/b] (%s)\\n⚡能量:%d | 🩸献祭:%d | 🦴骨头:%d\\n⚔️当前攻击:%d  ❤️当前生命:%d/%d\\n🏷️词条状态:%s\\n[color=#ffe89e]%s[/color]\" % [\n\t\tc.name, c.get_type_cn(),\n\t\tinst.get_effective_energy(), c.sacrifice, c.bones,\n\t\tinst.current_atk, inst.current_hp, inst.max_hp,\n\t\t(badges if badges != \"\" else \"无\"),\n\t\tc.get_display_text()\n\t]\n\nfunc _on_battle_log(msg: String) -> void:\n\t_log_box.append_text(msg + \"\\n\")\n\nfunc _on_floating_text(side: int, lane: int, text: String, col: Color) -> void:\n\tvar floater := Label.new()\n\tfloater.text = text\n\tfloater.add_theme_font_size_override(\"font_size\", 22)\n\tfloater.modulate = col\n\tvar base_x: float = 520.0 + float(max(0, lane)) * 165.0\n\tvar base_y: float = 420.0 if side == BattleEngine.PLAYER else 170.0\n\tfloater.position = Vector2(base_x, base_y)\n\tadd_child(floater)\n\tvar tw: Tween = create_tween().set_parallel(true)\n\ttw.tween_property(floater, \"position:y\", base_y - 48.0, 0.75)\n\ttw.tween_property(floater, \"modulate:a\", 0.0, 0.75)\n\ttw.chain().tween_callback(floater.queue_free)\n\nfunc _on_game_over(winner_side: int, reason: String) -> void:\n\tvar title_str: String = \"🏆 胜利！你击败了对手！\" if winner_side == BattleEngine.PLAYER else \"💀 战败！请调整构筑再战！\"\n\t_prompt_banner.text = \"%s （%s）—— 点击左上角「重新开局」或「撤退返回」\" % [title_str, reason]\n"};

const RULES = Object.assign({
  hp: 30, columns: 5, openingHand: 4, handLimit: 10, energyStart: 1, energyMax: 10, deckSize: 40, deckEditMax: 50, copiesPerCard: 3
}, INITIAL_CCG_DATA.rules || {}, { hp: 30, handLimit: 10 });

function isMechCard(cData) {
  if (!cData) return false;
  const r = String(cData.race || '');
  return r.includes('机械') || cData.id === 'cmwbx0mq8qz7f' || cData.id === 'cmwbwne297mmg' || String(cData.name || '').includes('机兵') || String(cData.name || '').includes('机甲') || String(cData.name || '').includes('机械') || String(cData.name || '').includes('发条');
}

const cardsById = {};
const cardsByName = {};
let allCards = [];

function registerCardsFromDesigner(cardArray) {
  let importedCount = 0;
  cardArray.forEach(raw => {
    if (!raw || !raw.id || !raw.name) return;
    const c = Object.assign({
      en: "", type: "minion", rarity: "普通", race: "", sacrificeCond: "",
      faith: 0, counter: 0, energy: 0, sacrifice: 0, bones: 0,
      atk: 0, hp: 1, timer: 0, countdown: 0, timerEffect: "", fusion: null, choice: null,
      keywords: [], text: "", flavor: "", notes: "", art: "", fullText: ""
    }, raw);
    c.energy = Number(c.energy || 0);
    c.sacrifice = Number(c.sacrifice || 0);
    c.bones = Number(c.bones || 0);
    c.atk = Number(c.atk || 0);
    c.hp = Number(c.hp || 1);
    c.countdown = getInitialCountdown(c);
    c.isToken = String(c.notes || '').includes('衍生物');
    c.ast = parseCardEffectAST(c);
    cardsById[c.id] = c;
    cardsByName[c.name] = c;
    importedCount++;
  });
  if (cardsById['cmwbx0mq8qz7f']) cardsById['cmwbx0mq8qz7f'].race = '机械';
  if (cardsById['cmwbwne297mmg']) cardsById['cmwbwne297mmg'].race = '机械';
  if (cardsByName['魔导机兵少女']) {
    cardsByName['魔导机兵少女'].race = '机械';
    cardsByName['魔导机械少女'] = cardsByName['魔导机兵少女'];
  }
  allCards = Object.values(cardsById).sort((a, b) => {
    if (a.isToken !== b.isToken) return a.isToken ? 1 : -1;
    if (a.energy !== b.energy) return a.energy - b.energy;
    if (a.bones !== b.bones) return a.bones - b.bones;
    return a.id.localeCompare(b.id);
  });
  return importedCount;
}
registerCardsFromDesigner(INITIAL_CCG_DATA.cards || []);

const AI_PURE_MECH_DECK = {
  name: "赛博机械狂潮 (40张)",
  cards: {
    "cmwbz163tt1ma": 3, "cmwbxdn7tcvde": 3, "cmwc2wbcgbqvl": 3, "cmwc2zlhaxdtj": 3,
    "cmwbwg3kwqfkq": 3, "cmwbwne297mmg": 3, "cmwbxu7u3tpyo": 3, "cmwby8v9c918f": 3,
    "cmwbyhrbei4w8": 3, "cmwbvfqe5en3l": 2, "cmwbvnpfgwo7a": 2, "cmwas0lke5oiw": 2,
    "cmwc2n4p68ewm": 2, "cmwbx0mq8qz7f": 1, "cmwc33vo8ohrw": 1, "cmwc8tup5d1xt": 1,
    "cmwc3gozg0rat": 1, "cmwc3or2zf7ft": 1
  }
};

// 40张【苍穹龙族进化】预设与AI卡组（含 v2.1 新增的 1费雏龙的蛋 与 龙蛋收藏家）
const AI_DRAGON_EVO_DECK = {
  name: "苍穹龙族进化 (40张)",
  cards: {
    "cmwdtm73fwg1u": 3, // 雏龙的蛋 (1费0祭品)
    "cmwe1w8cztclb": 3, // 静听倾诉的修女 (1费)
    "cmwdzvs1woa53": 2, // 龙心秘宝 (1费护符)
    "cmwdvbzosilgg": 2, // 祷告的圣女 (2费守护/倒计时-1)
    "cmwdvhcrr8g9v": 3, // 快速孵化 (2费法术)
    "cmwdw2v21c73r": 3, // 驯龙师 (2费龙族+1/+1光环)
    "cmwdzojlzzf98": 2, // 窃蛋龙 (2费祭1谢幕曲召龙蛋)
    "cmwe1tj7fh3ot": 3, // 雏龙搭档 (2费召雏龙)
    "cmwfdhecfc856": 3, // 龙蛋收藏家 (3费入场曲+启动拿龙蛋)
    "cmwdvmwjm0301": 3, // 丢失的龙蛋 (3费召2龙蛋)
    "cmwdvop6hshsy": 2, // 龙骑士 (3费)
    "cmwdvrwfcy5gg": 2, // 孵化装置 (3费护符)
    "cmwdwpfyd4xpp": 2, // 慈爱的龙母 (3费骨4全体龙族倒计时-1)
    "cmwdw5qt6cbqb": 2, // 无畏的飞龙骑手 (4费纹章传说)
    "cmwdx7vx7izcu": 2, // 龙鳞锻造师 (4费骨3龙族+2/+2)
    "cmwdwtfm8xm5c": 2, // 流淌龙血的侠客 (5费最大能量+1/爆能8全体伤害)
    "cmwdz3reuida0": 1  // 孵化万物的龙女 (8费传说)
  }
};

const AI_UNDEAD_BONE_DECK = {
  "name": "冥刻亡灵骨海 (40张)",
  "cards": {
    "cmwfdsjjxuhrh": 3,
    "cmwbz163tt1ma": 2,
    "cmwgd14oa2890": 3,
    "cmwc97xb64vc6": 3,
    "cmwggjooddagz": 3,
    "cmwghctx4ixrj": 2,
    "cmwfdugclc9w9": 2,
    "cmwgccmsj2ypl": 2,
    "cmwggx4ykcgy1": 2,
    "cmwgh9izhopu9": 2,
    "cmwffsync2y12": 2,
    "cmwe0tjwqf5lp": 2,
    "cmwfhe6xv5el7": 2,
    "cmwgczzbob0ta": 2,
    "cmwgh0uggjyno": 2,
    "cmwgcjgs4885x": 1,
    "cmwgdeqcq4vyl": 1,
    "cmwgdqawegvy3": 1,
    "cmwgg0hlxpor5": 1,
    "cmwbyp6f419ju": 1,
    "cmwffityz44sn": 1
  }
};

const AI_LASTWORDS_DECK = {
  "name": "AI·谢幕曲协奏",
  "cards": {
    "cmwghh2r742ie": 3,
    "cmwffityz44sn": 3,
    "cmwc9mbry93dx": 3,
    "cmwc9ua0fd6of": 1,
    "cmwbyp6f419ju": 1,
    "cmwfdqzl799uk": 3,
    "cmwgd14oa2890": 3,
    "cmwggjooddagz": 3,
    "cmwgqgw3e4h7s": 3,
    "cmwc0t61ade7b": 3,
    "cmwc0auyporsj": 3,
    "cmwgczzbob0ta": 3,
    "cmwghmf9xj9dv": 2,
    "cmwgdqawegvy3": 3,
    "cmwgeg2eggz9t": 1,
    "cmwdxt4vgtk9g": 1,
    "cmwgf4861j5tn": 1
  }
};

const DEFAULT_PRESET_DECKS = [
  {
    "name": "苍穹龙族进化 (40张)",
    "cards": Object.assign({}, AI_DRAGON_EVO_DECK.cards)
  },
  {
    "name": "赛博机械狂潮 (40张)",
    "cards": Object.assign({}, AI_PURE_MECH_DECK.cards)
  },
  {
    "name": "冥刻亡灵骨海 (40张)",
    "cards": Object.assign({}, AI_UNDEAD_BONE_DECK.cards)
  },
  {
    "name": "幽灵谢幕快攻 (40张)",
    "cards": {
      "cmwfdsjjxuhrh": 3,
      "cmwfdqzl799uk": 3,
      "cmwggt486xgpb": 2,
      "cmwgd14oa2890": 3,
      "cmwfdugclc9w9": 3,
      "cmwghctx4ixrj": 3,
      "cmwggjooddagz": 2,
      "cmwgccmsj2ypl": 3,
      "cmwggx4ykcgy1": 3,
      "cmwgh9izhopu9": 3,
      "cmwgee7uk9ipt": 2,
      "cmwgchn8wmoi5": 2,
      "cmwghh2r742ie": 2,
      "cmwgeg2eggz9t": 2,
      "cmwghmf9xj9dv": 2,
      "cmwbyp6f419ju": 2
    }
  },
  {
    "name": "暗夜自残恶魔 (40张)",
    "cards": {
      "cmwata95yc8j5": 2,
      "cmwggewsi6c9n": 2,
      "cmwfg3ouofrw4": 3,
      "cmwgepbm7hzy9": 3,
      "cmwfdqzl799uk": 3,
      "cmwget8v364ar": 3,
      "cmwc97xb64vc6": 3,
      "cmwfg76dbmxry": 3,
      "cmwgggf7icriv": 2,
      "cmwgd56lg867w": 2,
      "cmwgf14i2fvra": 3,
      "cmwgdalzmzj83": 2,
      "cmwgc5ey3970v": 2,
      "cmwgf4861j5tn": 2,
      "cmwgg0hlxpor5": 2,
      "cmwgb6nzkjlc7": 1,
      "cmwgbg6hku29o": 2
    }
  },
  {
    "name": "双核法术控制 (40张)",
    "cards": {
      "cmwbz163tt1ma": 2,
      "cmwc2zlhaxdtj": 3,
      "cmwgbhvec35kr": 2,
      "cmwc998a8rnwf": 2,
      "cmwcah8st1lar": 3,
      "cmwcb1izpxl7e": 3,
      "cmwcba1blx523": 3,
      "cmwcaqbzuvvcx": 2,
      "cmwd6zdfog6ux": 2,
      "cmwgbg6hku29o": 3,
      "cmwgftipxm3ux": 2,
      "cmwfd8opa9wwf": 3,
      "cmwgbxcd6nei4": 2,
      "cmwcalky6itcu": 2,
      "cmwd6senq6s04": 2,
      "cmwgb6nzkjlc7": 2,
      "cmwe0hk86d0a2": 2
    }
  }
];
const DECK_STORAGE_KEY = 'CARDFORGE_SAVED_DECKS_V1';
const DECK_IDX_STORAGE_KEY = 'CARDFORGE_SELECTED_DECK_IDX_V1';

function loadSavedDecksFromStorage() {
  try {
    const raw = localStorage.getItem(DECK_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        DEFAULT_PRESET_DECKS.forEach(defDeck => {
          const baseName = defDeck.name.replace(/\s*\(\d+张\)/, '');
          const exist = parsed.find(d => d && !d.isUserCustom && String(d.name || '').includes(baseName));
          if (exist) {
            exist.name = defDeck.name;
            exist.cards = Object.assign({}, defDeck.cards);
          } else if (!parsed.some(d => d && String(d.name || '').includes(baseName))) {
            parsed.push({ name: defDeck.name, cards: Object.assign({}, defDeck.cards) });
          }
        });
        return parsed;
      }
    }
  } catch (e) {}
  const initDecks = JSON.parse(JSON.stringify(DEFAULT_PRESET_DECKS));
  initDecks.unshift({
    name: "★ 我的专属卡组",
    isUserCustom: true,
    cards: Object.assign({}, DEFAULT_PRESET_DECKS[0].cards)
  });
  return initDecks;
}

function saveDecksToStorage() {
  try {
    localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(PRESET_DECKS));
    localStorage.setItem(DECK_IDX_STORAGE_KEY, String(currentDeckIndex));
  } catch (e) {}
}

const PRESET_DECKS = loadSavedDecksFromStorage();
let currentDeckIndex = (() => {
  try {
    const savedIdx = parseInt(localStorage.getItem(DECK_IDX_STORAGE_KEY) || '0', 10);
    if (savedIdx >= 0 && savedIdx < PRESET_DECKS.length) return savedIdx;
  } catch (e) {}
  return 0;
})();

function getCardDisplayText(cardData, inst = null) {
  let base = (cardData.fullText || '').trim();
  if (!base) {
    const parts = [];
    (cardData.keywords || []).forEach(kw => {
      if (kw.v > 0 && !kw.effect) parts.push(`【${kw.k}_${kw.v}】`);
      else if (kw.effect) parts.push(`【${kw.k}】${kw.effect}`);
      else parts.push(`【${kw.k}】`);
    });
    if (cardData.text) parts.push(cardData.text);
    base = parts.join('\n');
  }
  return base || '无特殊能力';
}

class SoundSynth {
  constructor() { this.ctx = null; this.muted = false; }
  init() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }
  play(type) {
    if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
    const nowMs = Date.now();
    if (type === 'click') {
      if (nowMs - (this._lastClickMs || 0) < 80) return;
      this._lastClickMs = nowMs;
    }
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain); gain.connect(this.ctx.destination);
    if (type === 'click') {
      osc.frequency.setValueAtTime(640, now); osc.frequency.exponentialRampToValueAtTime(940, now + 0.045);
      gain.gain.setValueAtTime(0.11, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.045);
      osc.start(now); osc.stop(now + 0.045);
    } else if (type === 'draw') {
      osc.frequency.setValueAtTime(440, now); osc.frequency.exponentialRampToValueAtTime(780, now + 0.08);
      gain.gain.setValueAtTime(0.12, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
      osc.start(now); osc.stop(now + 0.08);
    } else if (type === 'play') {
      osc.frequency.setValueAtTime(310, now); osc.frequency.exponentialRampToValueAtTime(680, now + 0.14);
      gain.gain.setValueAtTime(0.17, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.14);
      osc.start(now); osc.stop(now + 0.14);
    } else if (type === 'legend') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now); osc.frequency.exponentialRampToValueAtTime(1180, now + 0.36);
      gain.gain.setValueAtTime(0.24, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.36);
      osc.start(now); osc.stop(now + 0.36);
    } else if (type === 'sacrifice') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(210, now); osc.frequency.exponentialRampToValueAtTime(80, now + 0.18);
      gain.gain.setValueAtTime(0.2, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.18);
      osc.start(now); osc.stop(now + 0.18);
    } else if (type === 'lastwords') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(580, now); osc.frequency.exponentialRampToValueAtTime(240, now + 0.26);
      gain.gain.setValueAtTime(0.22, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.26);
      osc.start(now); osc.stop(now + 0.26);
    } else if (type === 'hit') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(45, now + 0.15);
      gain.gain.setValueAtTime(0.28, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
      osc.start(now); osc.stop(now + 0.15);
    } else if (type === 'synergy') {
      osc.frequency.setValueAtTime(520, now); osc.frequency.exponentialRampToValueAtTime(1040, now + 0.2);
      gain.gain.setValueAtTime(0.15, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
      osc.start(now); osc.stop(now + 0.2);
    }
  }
}
const sfx = new SoundSynth();
let sleep = (ms) => new Promise(res => setTimeout(res, ms));

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

async function showTriggeredEffectToast(cardData, triggeredClauseText, waitMs = 380) {
  if (typeof battleMode !== 'undefined' && battleMode === 'pvp_online' && typeof OnlineState !== 'undefined' && OnlineState.inMatch && typeof onlineIsMyTurn === 'function' && onlineIsMyTurn() && !OnlineState._replayingVfx) {
    const cid = (cardData && cardData.id) ? cardData.id : 'sys_notice';
    if (cid !== 'sys_fusion') {
      recordLocalVfx({ kind: 'toast', cid, cardData: (cid && typeof cardsById !== 'undefined' && cardsById[cid]) ? null : cardData, msg: triggeredClauseText });
    }
  }
  closeCardDetailIfConflict();
  const feed = document.getElementById('svEffectFeed');
  if (!feed) return;
  const item = document.createElement('div');
  item.className = 'sv-effect-toast rounded-r-xl px-4 py-3 lg:px-6 lg:py-4 flex items-center gap-3 lg:gap-4 w-[320px] lg:w-[500px] text-xs lg:text-base';
  const imgUri = getAnimeIllustrationDataURI(cardData);
  item.innerHTML = `
    <div class="w-12 h-12 lg:w-20 lg:h-20 rounded-xl overflow-hidden border-2 border-amber-400 shrink-0 shadow-lg">
      <img src="${imgUri}" class="w-full h-full object-cover" alt="${cardData.name}"/>
    </div>
    <div class="flex flex-col min-w-0 flex-1">
      <div class="text-sm lg:text-lg font-black text-amber-300 truncate">${cardData.name}</div>
      <div class="text-xs lg:text-base text-slate-100 leading-snug line-clamp-3">${triggeredClauseText}</div>
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

async function playSynergyBeam(fromEl, toEl, color = '#38bdf8', duration = 340) {
  if (!fromEl || !toEl) return;
  const r1 = fromEl.getBoundingClientRect();
  const r2 = toEl.getBoundingClientRect();
  const x1 = r1.left + r1.width / 2, y1 = r1.top + r1.height / 2;
  const x2 = r2.left + r2.width / 2, y2 = r2.top + r2.height / 2;

  const svg = document.getElementById('fxSvgOverlay');
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.innerHTML = `
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="7" stroke-linecap="round" opacity="0.45"/>
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="${x2}" cy="${y2}" r="18" fill="none" stroke="${color}" stroke-width="4"/>
  `;
  svg.appendChild(g);
  sfx.play('synergy');
  await sleep(duration);
  g.remove();
}

function getLaneDOM(side, lane) {
  if (lane === -1) {
    return document.getElementById(side === 0 ? 'playerLeaderNode' : 'enemyLeaderNode');
  }
  const row = document.getElementById(side === 0 ? 'playerLanesRow' : 'enemyLanesRow');
  return row ? row.children[lane] : null;
}

function spawnFloatNumber(side, lane, text, color = '#fde047') {
  const target = getLaneDOM(side, lane);
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

let nextUid = 1000;
function createCardInstance(cardIdOrName, owner) {
  const data = cardsById[cardIdOrName] || cardsByName[cardIdOrName];
  if (!data) return null;
  const activeKw = {};
  (data.keywords || []).forEach(kw => {
    const passiveList = ["守护", "飞行", "防空", "毁灭", "荆棘", "屏障", "位移", "灵气", "潜行", "虹吸", "多重攻击", "两侧攻击", "三侧攻击", "全体攻击"];
    if (passiveList.includes(kw.k)) activeKw[kw.k] = Math.max(1, kw.v || 1);
  });
  const initCd = getInitialCountdown(data);
  return {
    uid: ++nextUid,
    data: data,
    owner: owner,
    currentAtk: data.atk || 0,
    maxHp: data.hp || 1,
    currentHp: data.hp || 1,
    countdown: initCd > 0 ? initCd : null,
    activeKw: activeKw,
    fusedCount: 0,
    costReduction: 0,
    grantedEffects: [],
    extraLastWords: [],
    grantedOnAttackAoe4: false,
    shiftDir: 1,
    activatedThisTurn: false,
    attackedThisTurn: false,
    fusedThisTurn: false,
    justEnteredLegendVfx: false,
    enterOrder: 0
  };
}

function hasAnyLastWords(inst) {
  if (!inst) return false;
  if (inst.extraLastWords && inst.extraLastWords.length > 0) return true;
  return (inst.data.keywords || []).some(kw => kw.k === '谢幕曲') || (inst.data.ast && inst.data.ast.lastWords.length > 0);
}

function addGrantedEffect(inst, text) {
  if (!inst || !text) return;
  if (!inst.grantedEffects) inst.grantedEffects = [];
  inst.grantedEffects.push(text);
}

function getEffectiveEnergy(inst, leaderState) {
  let e = (inst.data.energy || 0) - (inst.costReduction || 0);
  if (inst.data.type === 'minion' && isMechCard(inst.data) && leaderState && leaderState.nextMechDiscount > 0) {
    e -= leaderState.nextMechDiscount;
  }
  return Math.max(0, e);
}

function evaluateCardPlayState(side, inst) {
  const st = battle.leaders[side];
  const baseE = getEffectiveEnergy(inst, st);
  const needB = inst.data.bones || 0;
  const needS = inst.data.sacrifice || 0;
  const ast = inst.data.ast || parseCardEffectAST(inst.data);

  if (st.bones < needB) return { ok: false, mode: 'none', glow: '', reason: `骨头不足(需${needB})` };
  const validSac = getValidSacrificeLanes(side, inst.data.sacrificeCond || '');
  if (validSac.length < needS) return { ok: false, mode: 'none', glow: '', reason: `祭品不足(需${needS}个${inst.data.sacrificeCond || ''}随从，护符不可献祭)` };

  const hasEmptyLane = battle.board[side].some(slot => slot === null) || needS > 0;
  const isBoardCard = inst.data.type === 'minion' || inst.data.type === 'amulet';

  if (st.energy < baseE) {
    if (ast.crystallize && st.energy >= ast.crystallize.cost && hasEmptyLane) {
      return { ok: true, mode: 'crystallize', costE: ast.crystallize.cost, costB: 0, glow: 'sv-glow-blue', activeSection: 'crystallize' };
    }
    if (ast.accelerate && st.energy >= ast.accelerate.cost) {
      return { ok: true, mode: 'accelerate', costE: ast.accelerate.cost, costB: 0, glow: 'sv-glow-blue', activeSection: 'accelerate' };
    }
    return { ok: false, mode: 'none', glow: '', reason: `能量不足(需${baseE})` };
  }

  if (isBoardCard && !hasEmptyLane) {
    return { ok: false, mode: 'none', glow: '', reason: '战道已满' };
  }

  let isEnhanced = false;
  let enhCostE = baseE;
  let enhCostB = needB;
  if (ast.enhance) {
    if (ast.enhance.costType === 'bones') {
      if (st.bones >= ast.enhance.cost) {
        isEnhanced = true;
        enhCostB = ast.enhance.cost;
      }
    } else if (st.energy >= ast.enhance.cost) {
      isEnhanced = true;
      enhCostE = ast.enhance.cost;
    }
  }

  const req = getCardTargetRequirement(inst, isEnhanced, -1);
  if (inst.data.type === 'spell' && req) {
    if (getValidTargetLanes(side, req, true).length === 0) {
      return { ok: false, mode: 'none', glow: '', reason: '场上无合法目标' };
    }
  }

  const comboReady = ast.combo && (st.cardsPlayedThisTurn + 1) >= ast.combo.count;
  const mechHandCountAfterPlay = st.hand.filter(h => h !== inst && isMechCard(h.data)).length;
  const mechCondReady = (inst.data.id === 'cmwc2n4p68ewm' || inst.data.id === 'cmwc8tup5d1xt') && mechHandCountAfterPlay >= 6;
  const sheepCondReady = inst.data.id === 'cmwby8v9c918f' && st.hand.some(h => h.data.name === '电子羊');
  const fuseCondReady = (inst.fusedCount || 0) > 0 && (inst.data.id === 'cmwdi4pwz3c0k' || inst.data.id === 'cmwdibvlbqmxv');
  const dragonOnBoardReady = (inst.data.id === 'cmwdvop6hshsy' || inst.data.id === 'cmwdwtfm8xm5c' || inst.data.id === 'cmwdzshgc6r55') &&
    battle.board[side].some(m => m && m.data.type === 'minion' && hasRace(m.data, '龙族'));
  const cost7MinionsReady = inst.data.id === 'cmwdyxl33lchi' &&
    st.hand.filter(h => h !== inst && h.data.type === 'minion' && (h.data.energy || 0) >= 7).length >= 3;

  if (isEnhanced || comboReady || mechCondReady || sheepCondReady || fuseCondReady || dragonOnBoardReady || cost7MinionsReady) {
    return {
      ok: true,
      mode: isEnhanced ? 'enhance' : 'normal_boosted',
      costE: enhCostE,
      costB: enhCostB,
      glow: isEnhanced ? 'sv-glow-enhance' : 'sv-glow-yellow',
      activeSection: isEnhanced ? 'enhance' : (comboReady ? 'combo' : 'fanfare')
    };
  }

  return { ok: true, mode: 'normal', costE: baseE, costB: needB, glow: 'sv-glow-green', activeSection: 'main' };
}

let battleMode = 'pve';
let aiDeckArchetype = 'dragon';
let pvpRoomChannel = null;

const battle = {
  turn: 1, activeSide: 0, firstPlayerSide: 0, gameOver: false, animating: false,
  board: [[null, null, null, null, null], [null, null, null, null, null]],
  leaders: [null, null],
  inspectedCard: null,
  pendingPlay: null,
  mulliganSwapped: [false, false, false, false],
  multiFuseUids: new Set()
};

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function expandDeck(deckObj) {
  const ids = [];
  Object.entries(deckObj.cards).forEach(([cid, cnt]) => {
    for (let i = 0; i < cnt; i++) ids.push(cid);
  });
  return ids;
}

function createLeaderState(side, deckIds) {
  const deck = deckIds.map(cid => createCardInstance(cid, side)).filter(Boolean);
  shuffleArray(deck);
  return {
    hp: RULES.hp, maxHp: RULES.hp,
    energy: RULES.energyStart, maxEnergy: RULES.energyStart,
    bones: 0,
    deck: deck, hand: [], graveyard: [],
    crests: [],
    playedCardsLog: [],
    destroyedLastWordsCount: 0,
    cardsPlayedThisTurn: 0,
    nextMechDiscount: 0,
    delayedMechDraws: 0,
    werewolfPlayedCount: 0,
  };
}

let globalEnterSeq = 0;
const hiddenCardUids = new Set();

function getHandCardRect(side, uid) {
  const zoneId = side === 0 ? 'playerHandZone' : 'enemyHandBacks';
  const zone = document.getElementById(zoneId);
  if (zone && uid) {
    const cardEl = zone.querySelector(`[data-card-uid="${uid}"]`);
    if (cardEl) return cardEl.getBoundingClientRect();
  }
  return zone ? zone.getBoundingClientRect() : null;
}

async function animateCardTrajectory({ fromRect, toRect, cardData, showFront = true, duration = 380, arcHeight = -42, startScale = 0.58, endScale = 1.0 }) {
  if (!fromRect || !toRect) return;
  const _uiScale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ui-scale')) || 1;
  startScale = startScale * _uiScale;
  endScale = endScale * _uiScale;
  arcHeight = arcHeight * _uiScale;
  const flyer = document.createElement('div');
  flyer.style.position = 'fixed';
  flyer.style.zIndex = '215';
  flyer.style.pointerEvents = 'none';
  flyer.style.left = '0px';
  flyer.style.top = '0px';
  flyer.style.willChange = 'transform, opacity';

  if (showFront && cardData) {
    const dom = buildHandCardDOM(cardData, null, 0);
    dom.style.margin = '0';
    dom.style.boxShadow = '0 0 28px rgba(56, 189, 248, 0.9), 0 12px 28px rgba(0,0,0,0.9)';
    flyer.appendChild(dom);
  } else {
    flyer.style.width = '110px';
    flyer.style.height = '154px';
    flyer.style.borderRadius = '12px';
    flyer.style.background = 'linear-gradient(155deg, #1e293b 0%, #090d16 100%)';
    flyer.style.border = '2.5px solid #fbbf24';
    flyer.style.boxShadow = '0 0 25px rgba(251, 191, 36, 0.8), 0 10px 24px rgba(0,0,0,0.9)';
    flyer.innerHTML = `<div class="w-full h-full flex items-center justify-center"><div class="w-11 h-11 rounded-full border-2 border-sky-400/80 bg-sky-900/50 flex items-center justify-center text-sm text-amber-300 font-black">✦</div></div>`;
  }
  flyer.style.opacity = '0';
  document.body.appendChild(flyer);

  const fRect = flyer.getBoundingClientRect();
  const fw = fRect.width || 140;
  const fh = fRect.height || 196;

  const sx = fromRect.left + fromRect.width / 2 - fw / 2;
  const sy = fromRect.top + fromRect.height / 2 - fh / 2;
  const ex = toRect.left + toRect.width / 2 - fw / 2;
  const ey = toRect.top + toRect.height / 2 - fh / 2;
  flyer.style.transform = `translate3d(${sx}px, ${sy}px, 0) scale(${startScale})`;
  flyer.style.opacity = '1';

  const t0 = performance.now();
  await new Promise(resolve => {
    function step(now) {
      const p = Math.min(1, (now - t0) / duration);
      const ease = 1 - Math.pow(1 - p, 3);
      const cx = sx + (ex - sx) * ease;
      const cy = sy + (ey - sy) * ease + Math.sin(p * Math.PI) * arcHeight;
      const sc = startScale + (endScale - startScale) * ease;
      const rot = Math.sin(p * Math.PI) * (ex >= sx ? 6 : -6);
      flyer.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0) scale(${sc.toFixed(3)}) rotate(${rot.toFixed(1)}deg)`;
      if (p < 1) requestAnimationFrame(step);
      else resolve();
    }
    requestAnimationFrame(step);
  });
  flyer.remove();
}

async function drawCardAnimated(side) {
  const st = battle.leaders[side];
  if (st.deck.length === 0) return null;
  const card = st.deck.shift();
  const limit = st.handLimit || RULES.handLimit;

  if (st.hand.length >= limit) {
    spawnFloatNumber(side, -1, `手牌已满(${card.data.name}爆牌)`, '#f43f5e');
    return null;
  }

  sfx.play('draw');
  hiddenCardUids.add(card.uid);
  st.hand.push(card);
  renderAllBattleUI();

  const deckEl = document.getElementById(side === 0 ? 'playerDeckStackEl' : 'enemyDeckStackEl');
  const fromRect = deckEl ? deckEl.getBoundingClientRect() : null;
  const toRect = getHandCardRect(side, card.uid);

  await animateCardTrajectory({
    fromRect,
    toRect,
    cardData: card.data,
    showFront: side === 0 || battleMode === 'pvp_pass',
    duration: 380,
    arcHeight: side === 0 ? -48 : 36,
    startScale: 0.52,
    endScale: side === 0 ? 1.0 : 0.45
  });

  hiddenCardUids.delete(card.uid);
  renderAllBattleUI();
  return card;
}

function drawCardSync(side, playFlight = true) {
  const st = battle.leaders[side];
  if (st.deck.length === 0) return null;
  const card = st.deck.shift();
  const limit = st.handLimit || RULES.handLimit;
  if (st.hand.length >= limit) {
    spawnFloatNumber(side, -1, `手牌已满(${card.data.name}爆牌)`, '#f43f5e');
    return null;
  }
  if (playFlight) {
    sfx.play('draw');
    hiddenCardUids.add(card.uid);
    st.hand.push(card);
    renderAllBattleUI();
    const deckEl = document.getElementById(side === 0 ? 'playerDeckStackEl' : 'enemyDeckStackEl');
    const fromRect = deckEl ? deckEl.getBoundingClientRect() : null;
    const toRect = getHandCardRect(side, card.uid);
    animateCardTrajectory({
      fromRect, toRect, cardData: card.data, showFront: side === 0, duration: 360, arcHeight: -42, startScale: 0.52, endScale: side === 0 ? 1.0 : 0.45
    }).then(() => {
      hiddenCardUids.delete(card.uid);
      renderAllBattleUI();
    });
  } else {
    st.hand.push(card);
  }
  return card;
}

async function playShuffleIntoDeckAnim(side, fromRectOverride = null, cardData = null) {
  const deckEl = document.getElementById(side === 0 ? 'playerDeckStackEl' : 'enemyDeckStackEl');
  const handEl = document.getElementById(side === 0 ? 'playerHandZone' : 'enemyHandBacks');
  const fromRect = fromRectOverride || (handEl ? handEl.getBoundingClientRect() : null);
  const toRect = deckEl ? deckEl.getBoundingClientRect() : null;
  sfx.play('draw');
  await animateCardTrajectory({
    fromRect,
    toRect,
    cardData,
    showFront: Boolean(cardData && side === 0),
    duration: 360,
    arcHeight: -38,
    startScale: 0.92,
    endScale: 0.48
  });
  if (deckEl) {
    deckEl.classList.add('shuffle-shake');
    setTimeout(() => deckEl.classList.remove('shuffle-shake'), 440);
  }
}

async function addCardToHandAnimated(side, cardNameOrId, count = 1, sourceLane = -1, sourceCardName = '') {
  const st = battle.leaders[side];
  const limit = st.handLimit || RULES.handLimit;
  const fromEl = sourceLane >= 0 ? getLaneDOM(side, sourceLane) : getLaneDOM(side, -1);
  const fromRect = fromEl ? fromEl.getBoundingClientRect() : null;

  for (let i = 0; i < count; i++) {
    const inst = createCardInstance(cardNameOrId, side);
    if (!inst) continue;
    if (sourceCardName) {
      addGrantedEffect(inst, `来源：【${sourceCardName}】 → 衍生加入手牌`);
    }
    if (st.hand.length < limit) {
      sfx.play('draw');
      hiddenCardUids.add(inst.uid);
      st.hand.push(inst);
      renderAllBattleUI();
      const toRect = getHandCardRect(side, inst.uid);
      await animateCardTrajectory({
        fromRect,
        toRect,
        cardData: inst.data,
        showFront: side === 0,
        duration: 360,
        arcHeight: -36,
        startScale: 0.62,
        endScale: side === 0 ? 1.0 : 0.45
      });
      hiddenCardUids.delete(inst.uid);
      renderAllBattleUI();
    } else {
      spawnFloatNumber(side, -1, '手牌已满', '#f43f5e');
    }
  }
}

function addCardToHand(side, cardNameOrId, count = 1, sourceLane = -1) {
  return addCardToHandAnimated(side, cardNameOrId, count, sourceLane);
}

function prepareOpeningHand(side) {
  const st = battle.leaders[side];
  const idx = st.deck.findIndex(inst => inst.data.id === 'cmwbz163tt1ma' || (inst.data.text || '').includes('必定'));
  if (idx !== -1) {
    const [guaranteed] = st.deck.splice(idx, 1);
    st.deck.unshift(guaranteed);
  }
  for (let i = 0; i < RULES.openingHand; i++) drawCardSync(side, false);
}

let aiDifficulty = 'normal';
const AI_DIFFICULTY_CONFIG = {
  normal:  { label: '普通', hp: 30, extraOpeningCards: 0 },
  hard:    { label: '🔥困难', hp: 40, extraOpeningCards: 2 },
  inferno: { label: '💀炼狱', hp: 50, extraOpeningCards: 4 }
};

function getSelectedAiDeckObj() {
  if (aiDeckArchetype === 'dragon') return AI_DRAGON_EVO_DECK;
  if (aiDeckArchetype === 'undead') return AI_UNDEAD_BONE_DECK;
  if (aiDeckArchetype === 'lastwords') return AI_LASTWORDS_DECK;
  return AI_PURE_MECH_DECK;
}

function showSacrificeGuideBanner(stepBadgeText, mainText) {
  const banner = document.getElementById('sacrificeGuideBanner');
  if (!banner) return;
  if (!mainText) {
    banner.classList.add('hidden');
    return;
  }
  const bEl = document.getElementById('sacGuideStepBadge');
  const mEl = document.getElementById('sacGuideMainText');
  if (bEl) bEl.textContent = stepBadgeText || '出牌引导';
  if (mEl) mEl.textContent = mainText;
  banner.classList.remove('hidden');
}

function initNewBattle() {
  if (typeof syncOnlineAvatarsAndHud === 'function') syncOnlineAvatarsAndHud();
  const btnAgain = document.getElementById('btnVicPlayAgain'); if (btnAgain) btnAgain.textContent = '🔄 再战一局';
  const btnDeck = document.getElementById('btnVicGoDeck'); if (btnDeck) btnDeck.textContent = '🏠 返回主界面';
  battle.turn = 1;
  battle.firstPlayerSide = (battleMode === 'pve' && Math.random() < 0.5) ? 1 : 0;
  battle.activeSide = battle.firstPlayerSide;
  battle.gameOver = false;
  battle.animating = false;
  battle.board = [[null, null, null, null, null], [null, null, null, null, null]];
  battle.inspectedCard = null;
  battle.pendingPlay = null;

  document.getElementById('svDetailPanel').classList.add('hidden'); document.querySelectorAll('#playerHandZone .sv-hand-card.is-inspected').forEach(el => el.classList.remove('is-inspected'));
  document.getElementById('pendingLeftTopContainer').classList.add('hidden');
  document.getElementById('modeChoiceCenterPanel').classList.add('hidden');
  document.getElementById('handPickModal').classList.add('hidden');
  showSacrificeGuideBanner('', '');
  const vm = document.getElementById('victoryDefeatModal'); if (vm) vm.classList.add('hidden');
  const pm = document.getElementById('pvpHandoverModal'); if (pm) pm.classList.add('hidden');
  document.getElementById('svEffectFeed').innerHTML = '';

  document.getElementById('playerLeaderImg').src = renderCustomAvatarDataURI(userAvatarConfig);
  const enemyAvatarId = aiDeckArchetype === 'dragon' ? 'cmwdv3usmmzyp' : (aiDeckArchetype === 'undead' ? 'cmwbyp6f419ju' : (aiDeckArchetype === 'lastwords' ? 'cmwghmf9xj9dv' : 'cmwc0t61ade7b'));
  document.getElementById('enemyLeaderImg').src = getAnimeIllustrationDataURI({ id: enemyAvatarId, name: '敌方主战者', type: 'minion', rarity: '传说' });

  const pDeckObj = PRESET_DECKS[currentDeckIndex] || PRESET_DECKS[0];
  let pDeckIds = expandDeck(pDeckObj).filter(cid => Boolean(cardsById[cid]));
  if (pDeckIds.length < RULES.deckSize) {
    const fallbackIds = expandDeck(AI_DRAGON_EVO_DECK);
    while (pDeckIds.length < RULES.deckSize && fallbackIds.length > 0) {
      pDeckIds.push(fallbackIds[pDeckIds.length % fallbackIds.length]);
    }
  }

  const aiDeckSource = battleMode === 'pve' ? getSelectedAiDeckObj() : (PRESET_DECKS[(currentDeckIndex + 1) % PRESET_DECKS.length] || AI_DRAGON_EVO_DECK);
  const eDeckIds = expandDeck(aiDeckSource).filter(cid => {
    const cd = cardsById[cid];
    if (!cd) return false;
    if (battleMode === 'pve') {
      const hasFuse = (cd.keywords || []).some(k => k.k === '融合') || String(cd.fullText || '').includes('【融合】');
      return !hasFuse;
    }
    return true;
  });
  while (eDeckIds.length < RULES.deckSize) {
    eDeckIds.push(aiDeckArchetype === 'dragon' ? 'cmwe1tj7fh3ot' : 'cmwbyhrbei4w8');
  }

  const diffCfg = AI_DIFFICULTY_CONFIG[aiDifficulty] || AI_DIFFICULTY_CONFIG.normal;
  const archName = aiDeckArchetype === 'dragon' ? '苍穹龙族主战者' : (aiDeckArchetype === 'undead' ? '亡灵骨海主战者' : (aiDeckArchetype === 'lastwords' ? '谢幕曲协奏主战者' : '机械军团主战者'));

  battle.leaders[0] = createLeaderState(0, pDeckIds);
  battle.leaders[0].hp = 30;
  battle.leaders[0].maxHp = 30;

  battle.leaders[1] = createLeaderState(1, eDeckIds);
  battle.leaders[1].hp = battleMode === 'pve' ? diffCfg.hp : 30;
  battle.leaders[1].maxHp = battleMode === 'pve' ? diffCfg.hp : 30;
  battle.leaders[1].handLimit = RULES.handLimit + (battleMode === 'pve' ? diffCfg.extraOpeningCards : 0);

  const titleEl = document.getElementById('uiEnemyLeaderTitle');
  if (titleEl) {
    titleEl.textContent = battleMode === 'pve' ? `${diffCfg.label}·${archName}` : `👥 玩家 2 (后手)`;
  }

  const orderBadge = document.getElementById('uiTurnOrderBadge');
  if (orderBadge) {
    orderBadge.textContent = battle.firstPlayerSide === 0 ? '🎲 我方：先手' : '🎲 我方：后手';
  }
  const mulOrder = document.getElementById('mulliganOrderLabel');
  if (mulOrder) {
    mulOrder.textContent = battle.firstPlayerSide === 0 ? '先手 · FIRST' : '后手 · SECOND';
  }

  prepareOpeningHand(0);
  prepareOpeningHand(1);
  if (battleMode === 'pve') {
    for (let i = 0; i < diffCfg.extraOpeningCards; i++) {
      drawCardSync(1, false);
    }
  }

  openMulliganDualBox();
  renderAllBattleUI();
}

function openMulliganDualBox() {
  battle.mulliganLocked = false;
  battle.mulliganSwapped = [false, false, false, false];
  const mModal = document.getElementById('mulliganModal');
  if (mModal) mModal.style.pointerEvents = 'auto';
  if (typeof startMulliganCountdownTimer === 'function') startMulliganCountdownTimer();
  document.getElementById('mulliganModal').classList.remove('hidden');
  renderMulliganDualBox();
}

let mulliganDrag = { active: false, idx: -1, startX: 0, startY: 0, moved: false };

function renderMulliganDualBox() {
  const swapGrid = document.getElementById('mulliganSwapSlots');
  const keepGrid = document.getElementById('mulliganKeepSlots');
  swapGrid.innerHTML = '';
  keepGrid.innerHTML = '';

  const hand = battle.leaders[0].hand;
  for (let i = 0; i < 4; i++) {
    const inst = hand[i];
    const isSwapped = battle.mulliganSwapped[i];

    const topSlot = document.createElement('div');
    topSlot.className = 'w-[154px] h-[216px] rounded-xl border border-slate-700/80 bg-slate-950/55 flex items-center justify-center relative';
    topSlot.innerHTML = `
      <svg viewBox="0 0 64 64" class="w-16 h-16 text-slate-600/50 absolute pointer-events-none">
        <path fill="currentColor" d="M32 10 A22 22 0 0 1 52 23 L57 18 L55 32 L41 30 L47 25 A16 16 0 0 0 17 28 L11 28 A22 22 0 0 1 32 10 Z M32 54 A22 22 0 0 1 12 41 L7 46 L9 32 L23 34 L17 39 A16 16 0 0 0 47 36 L53 36 A22 22 0 0 1 32 54 Z"/>
      </svg>
    `;

    const botSlot = document.createElement('div');
    botSlot.className = 'w-[154px] h-[216px] rounded-xl border border-slate-700/80 bg-slate-950/55 flex items-center justify-center relative';

    if (inst) {
      const cardEl = buildHandCardDOM(inst.data, inst);
      cardEl.style.cursor = 'grab';
      if (isSwapped) {
        const blueCycle = document.createElement('div');
        blueCycle.className = 'absolute inset-0 flex items-center justify-center pointer-events-none z-20';
        blueCycle.innerHTML = `
          <div class="w-20 h-20 rounded-full border-4 border-sky-400/90 bg-sky-500/20 shadow-[0_0_16px_#38bdf8] flex items-center justify-center">
            <span class="text-2xl text-sky-300 font-black">↻</span>
          </div>
        `;
        cardEl.appendChild(blueCycle);
      }

      if (mulliganDrag.active && mulliganDrag.moved && mulliganDrag.idx === i) {
        cardEl.style.opacity = '0';
      }

      cardEl.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        mulliganDrag = { active: true, idx: i, inst: inst, startX: e.clientX, startY: e.clientY, moved: false };
      });
      cardEl.style.touchAction = 'none';
      cardEl.addEventListener('touchstart', (e) => {
        if (!e.changedTouches || !e.changedTouches.length) return;
        const t = e.changedTouches[0];
        e.stopPropagation();
        mulliganDrag = { active: true, idx: i, inst: inst, startX: t.clientX, startY: t.clientY, moved: false };
      }, { passive: false });
      cardEl.addEventListener('touchmove', (e) => {
        if (!mulliganDrag.active || mulliganDrag.idx !== i || !e.changedTouches.length) return;
        if (e.cancelable) e.preventDefault();
        const t = e.changedTouches[0];
        window.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true, view: window, button: 0, buttons: 1, clientX: t.clientX, clientY: t.clientY }));
      }, { passive: false });
      cardEl.addEventListener('touchend', (e) => {
        if (!mulliganDrag.active || mulliganDrag.idx !== i || !e.changedTouches.length) return;
        const t = e.changedTouches[0];
        window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window, button: 0, buttons: 0, clientX: t.clientX, clientY: t.clientY }));
      }, { passive: true });

      if (isSwapped) topSlot.appendChild(cardEl);
      else botSlot.appendChild(cardEl);
    }

    swapGrid.appendChild(topSlot);
    keepGrid.appendChild(botSlot);
  }
}

window.addEventListener('mousemove', (e) => {
  if (!mulliganDrag.active || !mulliganDrag.inst) return;
  const dist = Math.hypot(e.clientX - mulliganDrag.startX, e.clientY - mulliganDrag.startY);
  if (!mulliganDrag.moved && dist > 6) {
    mulliganDrag.moved = true;
    const ghost = document.getElementById('dragGhostBox');
    ghost.innerHTML = '';
    const node = buildHandCardDOM(mulliganDrag.inst.data, mulliganDrag.inst);
    node.style.transform = 'scale(1.04) rotate(-2deg)';
    ghost.appendChild(node);
    ghost.classList.remove('hidden');
    renderMulliganDualBox();
  }
  if (mulliganDrag.moved) {
    const ghost = document.getElementById('dragGhostBox');
    ghost.style.left = `${e.clientX}px`;
    ghost.style.top = `${e.clientY}px`;
  }
});

window.addEventListener('mouseup', (e) => {
  if (!mulliganDrag.active || battle.mulliganLocked) return;
  const { idx, inst, startX, startY, moved } = mulliganDrag;
  mulliganDrag = { active: false, idx: -1, inst: null, startX: 0, startY: 0, moved: false };
  document.getElementById('dragGhostBox').classList.add('hidden');

  if (!moved) {
    sfx.play('click');
    if (inst && typeof openCardDetailPanel === 'function') {
      openCardDetailPanel(inst, 'hand', 0, -1, null, true);
    }
    return;
  }

  const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
  if (dist < 36) {
    sfx.play('click');
    renderMulliganDualBox();
    return;
  }

  const topBox = document.getElementById('mulliganTopBox').getBoundingClientRect();
  const botBox = document.getElementById('mulliganBottomBox').getBoundingClientRect();
  if (e.clientX >= topBox.left && e.clientX <= topBox.right && e.clientY >= topBox.top && e.clientY <= topBox.bottom) {
    battle.mulliganSwapped[idx] = true;
    sfx.play('click');
  } else if (e.clientX >= botBox.left && e.clientX <= botBox.right && e.clientY >= botBox.top && e.clientY <= botBox.bottom) {
    battle.mulliganSwapped[idx] = false;
    sfx.play('click');
  }
  renderMulliganDualBox();
});

document.getElementById('btnConfirmMulligan').addEventListener('click', async () => {
  if (battle.mulliganLocked) return;
  battle.mulliganLocked = true;
  const mModal = document.getElementById('mulliganModal');
  if (mModal) mModal.style.pointerEvents = 'none';
  if (typeof stopMulliganCountdownTimer === 'function') stopMulliganCountdownTimer();
  sfx.play('play');
  const st = battle.leaders[0];
  const swappedIndices = [];
  battle.mulliganSwapped.forEach((swapped, idx) => {
    if (swapped) swappedIndices.push(idx);
  });

  if (swappedIndices.length > 0) {
    const swapSlots = document.getElementById('mulliganSwapSlots');
    const keepSlots = document.getElementById('mulliganKeepSlots');
    const deckEl = document.getElementById('playerDeckStackEl');
    const deckRect = deckEl ? deckEl.getBoundingClientRect() : null;

    for (const idx of swappedIndices) {
      const slotEl = swapSlots.children[idx];
      const cardData = st.hand[idx] ? st.hand[idx].data : null;
      const fromRect = slotEl ? slotEl.getBoundingClientRect() : null;
      if (slotEl) slotEl.innerHTML = '';
      await playShuffleIntoDeckAnim(0, fromRect, cardData);
    }

    const returned = [];
    swappedIndices.forEach(idx => {
      returned.push(st.hand[idx]);
      const replacement = st.deck.shift();
      if (replacement) st.hand[idx] = replacement;
    });
    returned.forEach(c => st.deck.push(c));
    shuffleArray(st.deck);

    battle.mulliganSwapped = [false, false, false, false];
    renderMulliganDualBox();
    swappedIndices.forEach(idx => {
      const kSlot = keepSlots.children[idx];
      if (kSlot && kSlot.firstElementChild) {
        kSlot.firstElementChild.style.opacity = '0';
        kSlot.firstElementChild.style.transition = 'none';
        kSlot.firstElementChild.style.transform = 'translateY(-24px) scale(1.04)';
      }
    });

    for (const idx of swappedIndices) {
      const kSlot = keepSlots.children[idx];
      const rawRect = kSlot ? kSlot.getBoundingClientRect() : null;
      const elevatedRect = rawRect ? {
        left: rawRect.left,
        top: rawRect.top - 24 * (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ui-scale')) || 1),
        width: rawRect.width,
        height: rawRect.height
      } : null;
      if (st.hand[idx] && deckRect && elevatedRect) {
        sfx.play('draw');
        await animateCardTrajectory({
          fromRect: deckRect,
          toRect: elevatedRect,
          cardData: st.hand[idx].data,
          showFront: true,
          duration: 340,
          arcHeight: -35,
          startScale: 0.55,
          endScale: 1.18
        });
      }
      if (kSlot && kSlot.firstElementChild) {
        kSlot.firstElementChild.style.opacity = '1';
        kSlot.firstElementChild.classList.add('sv-glow-green');
      }
    }

    await sleep(450);

    swappedIndices.forEach(idx => {
      const kSlot = keepSlots.children[idx];
      if (kSlot && kSlot.firstElementChild) {
        kSlot.firstElementChild.style.transition = 'transform 0.48s cubic-bezier(0.22, 1, 0.36, 1)';
        kSlot.firstElementChild.style.transform = 'translateY(0px) scale(1.0)';
      }
    });
    await sleep(560);
  }

  document.getElementById('mulliganModal').classList.add('hidden');
  if (battleMode === 'pvp_online') {
    OnlineState.myMulliganDone = true;
    sendReliableRoomPacket({
      type: 'MULLIGAN_DONE',
      hand: battle.leaders[0].hand.map(serializeCardInst),
      deck: battle.leaders[0].deck.map(serializeCardInst)
    });
    if (OnlineState.oppMulliganDone) {
      await startOnlineTurnOneIfFirst();
    } else {
      const waitOv = document.getElementById('onlineWaitOverlay');
      if (waitOv) waitOv.classList.remove('hidden');
    }
    return;
  }
  if (battleMode === 'pve' && battle.firstPlayerSide === 1) {
    await beginTurnSequence(1);
    await runEnemyAITurnAnimated();
  } else {
    await beginTurnSequence(0);
  }
});

async function playTurnStartBanner(side) {
  const overlay = document.getElementById('turnStartBannerOverlay');
  const titleEl = document.getElementById('turnStartMainTitle');
  const laserEl = document.getElementById('turnStartLaserLine');
  const subEl = document.getElementById('turnStartSubTitle');
  if (!overlay || !titleEl || !laserEl || !subEl) return;

  const st = battle.leaders[side];
  const orderStr = side === 0 ? '【先手】' : '【后手】';
  if (side === 0) {
    titleEl.textContent = battleMode === 'pvp_pass' ? '玩家 1 的回合' : '您的回合';
    titleEl.style.textShadow = '0 0 18px rgba(56, 189, 248, 0.95), 0 2px 6px #000';
    laserEl.className = 'sv-turn-laser-blue';
    subEl.innerHTML = `${orderStr} · 第 <b class="text-2xl italic font-black text-white mx-1">${battle.turn}</b> 回合 · 能量点 <b class="text-xl font-black text-emerald-300 mx-0.5">${st ? st.energy : 1}</b>`;
  } else {
    titleEl.textContent = battleMode === 'pvp_pass' ? '玩家 2 的回合' : '对手回合';
    titleEl.style.textShadow = '0 0 18px rgba(244, 63, 94, 0.95), 0 2px 6px #000';
    laserEl.className = 'sv-turn-laser-red';
    subEl.innerHTML = `${orderStr} · 第 <b class="text-2xl italic font-black text-white mx-1">${battle.turn}</b> 回合 · ${battleMode === 'pvp_pass' ? '玩家2行动阶段' : '敌方行动阶段'}`;
  }

  overlay.classList.remove('hidden');
  sfx.play('play');
  await sleep(1180);
  overlay.classList.add('hidden');
}

// ============================================================================
// 纹章 (Crest) 与 倒计时 (Countdown) & 变身 (Transform，视为新随从进场) 核心引擎
// ============================================================================
function grantLeaderCrest(side, crestDef) { return gainLeaderCrest(side, crestDef); }
async function gainLeaderCrest(side, crestDef) {
  const st = battle.leaders[side];
  if (!st) return false;
  if (!st.crests) st.crests = [];
  if (st.crests.some(c => c.id === crestDef.id || c.name === crestDef.name)) {
    await showTriggeredEffectToast(crestDef.cardData || { id: 'sys_notice', name: '战局提示', type: 'spell', rarity: '传说', energy: 0, bones: 0, sacrifice: 0 }, `已拥有同名纹章【${crestDef.name}】（同名纹章不叠加且不重置倒计时）。`, 260);
    return false;
  }
  if (st.crests.length >= 5) {
    await showTriggeredEffectToast(crestDef.cardData || { id: 'sys_notice', name: '战局提示', type: 'spell', rarity: '传说', energy: 0, bones: 0, sacrifice: 0 }, `纹章栏已满(上限5个)，无法获得【${crestDef.name}】。`, 260);
    return false;
  }
  st.crests.push({
    id: crestDef.id,
    name: crestDef.name,
    countdown: (crestDef.countdown === null || crestDef.countdown === undefined) ? null : Number(crestDef.countdown),
    desc: crestDef.desc || '',
    cardData: crestDef.cardData || null
  });
  sfx.play('legend');
  renderAllBattleUI();
  await playCrestTriggerVFX(side, crestDef.id);
  return true;
}

async function playCrestTriggerVFX(side, crestId) {
  const row = document.getElementById(side === 0 ? 'playerCrestsRow' : 'enemyCrestsRow');
  if (!row) return;
  const el = row.querySelector(`[data-crest-id="${crestId}"]`);
  if (el) {
    el.classList.remove('crest-trigger-anim');
    void el.offsetWidth;
    el.classList.add('crest-trigger-anim');
  }
  await sleep(260);
}

// 统一触发「进入战场时」的被动光环效果（随从召唤/打出进场，以及【变身】视为新随从进场均调用此函数！）
function hasReachedLastWordsThreshold(side, threshold = 10) {
  const st = battle && battle.leaders ? battle.leaders[side] : null;
  return Boolean(st && (st.destroyedLastWordsCount || 0) >= threshold);
}

async function triggerBoardEnterPassivesAnimated(side, inst, lane, depth = 0) {
  if (!inst || depth > 10 || battle.board[side][lane] !== inst) return;

  // 1) 机械进场联动：赛博牧羊人 (cmwbxu7u3tpyo)
  if (inst.data.type === 'minion' && isMechCard(inst.data)) {
    for (let l = 0; l < 5; l++) {
      const ally = battle.board[side][l];
      if (ally && ally !== inst && ally.data.id === 'cmwbxu7u3tpyo' && battle.board[side][lane] === inst) {
        await playSynergyBeam(getLaneDOM(side, l), getLaneDOM(side, lane), '#34d399', 240);
        inst.currentAtk += 1; inst.maxHp += 1; inst.currentHp += 1;
        addGrantedEffect(inst, '来源：【赛博牧羊人】 → 获得 +1/+1');
        spawnFloatNumber(side, lane, '+1/+1', '#4ade80');
        renderAllBattleUI();
        await showTriggeredEffectToast(ally.data, `使进入战场的『${inst.data.name}』获得+1/+1。`, 220);
      }
    }
  }

  // 2) 龙族随从进场联动：驯龙师 (cmwdw2v21c73r) +1/+1 与 龙心秘宝 (cmwdzvs1woa53) 倒计时-1
  if (inst.data.type === 'minion' && hasRace(inst.data, '龙族')) {
    for (let l = 0; l < 5; l++) {
      const ally = battle.board[side][l];
      if (!ally || ally === inst) continue;
      if (ally.data.id === 'cmwdw2v21c73r' && battle.board[side][lane] === inst) {
        await playSynergyBeam(getLaneDOM(side, l), getLaneDOM(side, lane), '#fbbf24', 240);
        inst.currentAtk += 1; inst.maxHp += 1; inst.currentHp += 1;
        addGrantedEffect(inst, '来源：【驯龙师】 → 获得 +1/+1');
        spawnFloatNumber(side, lane, '+1/+1', '#4ade80');
        renderAllBattleUI();
        await showTriggeredEffectToast(ally.data, `使进入战场的龙族随从『${inst.data.name}』获得+1/+1。`, 220);
      } else if (ally.data.id === 'cmwdzvs1woa53' && ally.countdown !== null) {
        await playSynergyBeam(getLaneDOM(side, lane), getLaneDOM(side, l), '#38bdf8', 220);
        await showTriggeredEffectToast(ally.data, `己方龙族随从进场，『龙心秘宝』倒计时-1！`, 200);
        await reduceCardCountdown(side, l, 1, inst, depth + 1);
      }
    }
  }

  // 3) 倒计时卡牌进场联动：孵化装置 (cmwdvrwfcy5gg)
  // v2.1 规则：「卡牌进入己方战场时，若其具有倒计时，使其倒计时-1，并使本卡牌倒计时-1」（且变身视为新随从进场，同样触发孵化装置！）
  if (battle.board[side][lane] === inst && inst.countdown !== null && inst.countdown !== undefined) {
    const deviceLanes = [];
    for (let l = 0; l < 5; l++) {
      const ally = battle.board[side][l];
      if (ally && ally !== inst && ally.data.id === 'cmwdvrwfcy5gg') deviceLanes.push(l);
    }
    for (const dl of deviceLanes) {
      const curCard = battle.board[side][lane];
      const dev = battle.board[side][dl];
      if (!curCard || curCard !== inst || curCard.countdown === null || !dev) break;
      await playSynergyBeam(getLaneDOM(side, dl), getLaneDOM(side, lane), '#34d399', 240);
      await showTriggeredEffectToast(dev.data, `【孵化装置】使进入战场的『${curCard.data.name}』倒计时-1，且自身倒计时-1！`, 220);
      // 先使孵化装置自身倒计时 -1
      await reduceCardCountdown(side, dl, 1, curCard, depth + 1);
      // 再使进场的倒计时卡牌倒计时 -1（若降为0则会触发变身，变身后的新随从继续触发进场效果！）
      if (battle.board[side][lane] === inst && inst.countdown !== null) {
        await reduceCardCountdown(side, lane, 1, dev, depth + 1);
      }
    }
  }

  // 4) 随从自身的【随从进场时】能力（如摇滚骷髅吉他手）
  if (battle.board[side][lane] === inst && inst.data.id === 'cmwbyp6f419ju') {
    await showTriggeredEffectToast(inst.data, '召唤4个『骷髅』到己方战场上。', 300);
    await summonByNameAnimated(side, '骷髅', 4, lane, false, '摇滚骷髅吉他手');
  } else if (battle.board[side][lane] === inst && inst.data.ast && inst.data.ast.onEnter.length > 0) {
    await executeASTActionList(side, inst, lane, inst.data.ast.onEnter, -1, false);
  }
}

// 变身机制：「将卡牌变成另一张卡牌，失去原本的所有效果，生命值和攻击力变成新卡牌的数值，变身不触发谢幕曲也不触发入场曲；但变身视为新随从进场，能触发进场效果（孵化装置、驯龙师、龙心秘宝等）！」

async function transformMinionToTargetValueAnimated(side, lane, targetVal, sourceName = '') {
  const m = battle.board[side][lane];
  if (!m || m.data.type !== 'minion') return;
  const minionCards = allCards.filter(c => c.type === 'minion');
  if (minionCards.length === 0) return;
  let pool = minionCards.filter(c => Math.abs(getCardCostValue(c) - targetVal) < 0.01);
  if (pool.length === 0) {
    // 找不到精确价值时，向下寻找价值最接近的随从（<= targetVal 中价值最高的）
    const lowerOrEq = minionCards.filter(c => getCardCostValue(c) <= targetVal + 0.01);
    if (lowerOrEq.length > 0) {
      const closestVal = Math.max(...lowerOrEq.map(c => getCardCostValue(c)));
      pool = lowerOrEq.filter(c => Math.abs(getCardCostValue(c) - closestVal) < 0.01);
    } else {
      // 若目标价值低于所有随从，则回退到价值最低的随从
      const minVal = Math.min(...minionCards.map(c => getCardCostValue(c)));
      pool = minionCards.filter(c => Math.abs(getCardCostValue(c) - minVal) < 0.01);
    }
  }
  const picked = pool[Math.floor(Math.random() * pool.length)];
  await transformBoardCardAnimated(side, lane, picked.name, sourceName, 0);
}

async function transformMinionToValuePlus1Animated(side, lane, sourceName = '') {
  const m = battle.board[side][lane];
  if (!m || m.data.type !== 'minion') return;
  await transformMinionToTargetValueAnimated(side, lane, getCardCostValue(m.data) + 1, sourceName);
}

async function transformBoardCardAnimated(side, lane, targetCardNameOrId, sourceName = '', depth = 0) {
  const oldInst = battle.board[side][lane];
  if (!oldInst) return null;
  const newInst = createCardInstance(targetCardNameOrId, side);
  if (!newInst) return null;

  sfx.play('synergy');
  globalEnterSeq += 1;
  newInst.enterOrder = globalEnterSeq;
  newInst.attackedThisTurn = false;
  if (sourceName) {
    addGrantedEffect(newInst, `来源：【${sourceName}】 → 由『${oldInst.data.name}』变身进场`);
  }
  battle.board[side][lane] = newInst;
  renderAllBattleUI();
  spawnFloatNumber(side, lane, `✨变身:${newInst.data.name}`, '#38bdf8');
  await showTriggeredEffectToast(newInst.data, `『${oldInst.data.name}』变身为『${newInst.data.name}』进入战场！`, 280);

  // 变身视为新随从进场，触发进场被动效果（孵化装置、驯龙师、龙心秘宝等）
  await triggerBoardEnterPassivesAnimated(side, newInst, lane, depth);
  return battle.board[side][lane];
}

async function reduceCardCountdown(side, lane, amount = 1, sourceCard = null, depth = 0) {
  const inst = battle.board[side][lane];
  if (!inst || inst.countdown === null || inst.countdown === undefined) return { triggeredZero: false };
  const prev = inst.countdown;
  inst.countdown = Math.max(0, inst.countdown - amount);
  if (sourceCard && sourceCard.data) {
    addGrantedEffect(inst, `来源：【${sourceCard.data.name}】 → 倒计时 -${amount} (${prev}→${inst.countdown})`);
  }
  spawnFloatNumber(side, lane, `⏳-${amount}`, '#38bdf8');
  renderAllBattleUI();
  await sleep(200);

  if (inst.countdown <= 0) {
    await triggerCountdownZeroAnimated(side, lane, depth);
    return { triggeredZero: true };
  }
  return { triggeredZero: false };
}

async function triggerCountdownZeroAnimated(side, lane, depth = 0) {
  const inst = battle.board[side][lane];
  if (!inst) return;
  // 1) 护符牌的倒计时结束时会破坏该护符（包括龙心秘宝在倒计时结束时也会正常破坏），触发谢幕曲
  if (inst.data.type === 'amulet') {
    await showTriggeredEffectToast(inst.data, `护符【${inst.data.name}】倒计时结束，破坏并触发效果！`, 260);
    await destroyMinionAnimated(side, lane, false, false, true);
    return;
  }
  // 2) 随从的倒计时结束时不会破坏随从，触发变身进化（变身后的新随从视为新随从进场！）
  inst.countdown = null;
  const cId = inst.data.id;
  const evoMap = {
    'cmwdtm73fwg1u': '雏龙',
    'cmwdts32am05i': '喷火龙',
    'cmwdtq4q7c8pe': '飞龙',
    'cmwdui6uam6xe': '远古巨龙',
    'cmwdukf0l090w': '终焉之龙'
  };
  if (evoMap[cId]) {
    await transformBoardCardAnimated(side, lane, evoMap[cId], `${inst.data.name}·倒计时结束`, depth);
    return;
  }
  if (cId === 'cmwgbrcn9qytg') {
    await showTriggeredEffectToast(inst.data, '【倒计时_3】倒计时归零，破坏战场上所有随从！', 300);
    for (const s of [0, 1]) {
      for (let l = 0; l < 5; l++) {
        const bm = battle.board[s][l];
        if (bm && bm.data.type === 'minion') await destroyMinionAnimated(s, l);
      }
    }
    return;
  }
  const ast = inst.data.ast || parseCardEffectAST(inst.data);
  if (ast.countdownEnd && ast.countdownEnd.length > 0) {
    for (const act of ast.countdownEnd) {
      if (act.op === 'transform_self' && act.targetName) {
        await transformBoardCardAnimated(side, lane, act.targetName, `${inst.data.name}·倒计时结束`, depth);
      } else {
        await executeASTActionList(side, inst, lane, [act], -1, false);
      }
    }
  }
  renderAllBattleUI();
}

async function beginTurnSequence(side) {
  if (battle.gameOver) return;
  if (battleMode === 'pve' && side === 0 && typeof savePveBattleProgress === 'function') savePveBattleProgress();
  if (typeof startTurnCountdownTimer === 'function') startTurnCountdownTimer();
  battle.activeSide = side;
  battle.animating = true;
  const st = battle.leaders[side];
  st.cardsPlayedThisTurn = 0;
  if (battle.turn > 1) {
    st.maxEnergy = Math.min(RULES.energyMax, st.maxEnergy + 1);
  }
  st.energy = st.maxEnergy;

  for (let l = 0; l < 5; l++) {
    if (battle.board[side][l]) {
      battle.board[side][l].activatedThisTurn = false;
      battle.board[side][l].attackedThisTurn = false;
    }
  }
  st.hand.forEach(c => c.fusedThisTurn = false);

  renderAllBattleUI();
  await playTurnStartBanner(side);

  // 1) 回合开始时：主战者纹章倒计时 -1，倒计时归零的纹章直接消失
  if (st.crests && st.crests.length > 0) {
    for (let i = st.crests.length - 1; i >= 0; i--) {
      const cr = st.crests[i];
      if (cr.countdown === null || cr.countdown === undefined) continue;
      cr.countdown -= 1;
      await playCrestTriggerVFX(side, cr.id);
      if (cr.countdown <= 0) {
        st.crests.splice(i, 1);
        await showTriggeredEffectToast(cr.cardData || { id: 'sys_notice', name: '战局提示', type: 'spell', rarity: '传说', energy: 0, bones: 0, sacrifice: 0 }, `【${cr.name}】倒计时结束，纹章消失。`, 240);
      }
    }
    renderAllBattleUI();
  }

  // 1.5) 纹章【回合开始时】效果（残暴的尸兽）
  if (st.crests && st.crests.some(cr => cr.id === 'crest_brutal_beast')) {
    const cr = st.crests.find(x => x.id === 'crest_brutal_beast');
    await playCrestTriggerVFX(side, cr.id);
    await showTriggeredEffectToast(cr.cardData, '【纹章：残暴的尸兽】回合开始时：对己方主战者造成1点伤害并抽1张牌！', 260);
    await dealDamageToLeaderAnimated(side, 1, null);
    if (!battle.gameOver) await drawCardAnimated(side);
  }

  // 2) 回合开始时：己方战场上所有具有【倒计时】的随从与护符倒计时 -1，并触发【回合开始时】随从能力
  for (let l = 0; l < 5; l++) {
    const m = battle.board[side][l];
    if (m && m.countdown !== null && m.countdown !== undefined) {
      await reduceCardCountdown(side, l, 1, null, 0);
    }
  }
  for (let l = 0; l < 5; l++) {
    if (battle.gameOver) break;
    const m = battle.board[side][l];
    if (m && m.data.id === 'cmwgbxcd6nei4') {
      await showTriggeredEffectToast(m.data, '【回合开始时】回复所有友方随从和己方主战者2点生命值，对所有敌方随从造成2点伤害！', 280);
      st.hp = Math.min(st.maxHp, st.hp + 2);
      spawnFloatNumber(side, -1, '+2', '#4ade80');
      for (let fl = 0; fl < 5; fl++) {
        const fm = battle.board[side][fl];
        if (fm && fm.data.type === 'minion') {
          fm.currentHp = Math.min(fm.maxHp, fm.currentHp + 2);
          spawnFloatNumber(side, fl, '+2', '#4ade80');
        }
      }
      const opp = 1 - side;
      for (let el = 0; el < 5; el++) {
        const em = battle.board[opp][el];
        if (em && em.data.type === 'minion') {
          await dealDamageToMinionAnimated(opp, el, 2, m);
        }
      }
      renderAllBattleUI();
    }
  }

  await drawCardAnimated(side);
  if (side !== battle.firstPlayerSide && battle.turn === 1) await drawCardAnimated(side);
  renderAllBattleUI();

  while ((st.delayedLastWordsDraws || 0) > 0) {
    st.delayedLastWordsDraws--;
    const lwIdx = st.deck.findIndex(c => hasAnyLastWords(c));
    if (lwIdx !== -1) {
      const [lwc] = st.deck.splice(lwIdx, 1);
      addGrantedEffect(lwc, '来源：【寻觅的亡灵】 → 谢幕曲检索抽上手牌');
      if (st.hand.length < (st.handLimit || RULES.handLimit)) {
        st.hand.push(lwc);
        renderAllBattleUI();
        await showTriggeredEffectToast(lwc.data, '【寻觅的亡灵】从牌库抽取1张具有【谢幕曲】的卡牌！', 280);
      }
    }
  }

  while (st.delayedMechDraws > 0) {
    st.delayedMechDraws--;
    const mIdx = st.deck.findIndex(c => c.data.type === 'minion' && isMechCard(c.data));
    if (mIdx !== -1) {
      const [mc] = st.deck.splice(mIdx, 1);
      addGrantedEffect(mc, '来源：【飞轮信使】 → 谢幕曲检索抽上手牌');
      if (st.hand.length < (st.handLimit || RULES.handLimit)) {
        hiddenCardUids.add(mc.uid);
        st.hand.push(mc);
        renderAllBattleUI();
        const deckEl = document.getElementById(side === 0 ? 'playerDeckStackEl' : 'enemyDeckStackEl');
        await animateCardTrajectory({
          fromRect: deckEl ? deckEl.getBoundingClientRect() : null,
          toRect: getHandCardRect(side, mc.uid),
          cardData: mc.data, showFront: side === 0, duration: 380, arcHeight: -45, startScale: 0.52, endScale: side === 0 ? 1.0 : 0.45
        });
        hiddenCardUids.delete(mc.uid);
        renderAllBattleUI();
        await showTriggeredEffectToast(mc.data, '从牌库抽取1张机械随从卡。', 320);
      }
    }
  }

  battle.animating = false;
  renderAllBattleUI();
}

function getValidSacrificeLanes(side, sacCond) {
  const res = [];
  for (let l = 0; l < 5; l++) {
    const m = battle.board[side][l];
    if (m && m.data.type === 'minion' && (!sacCond || hasRace(m.data, sacCond))) res.push(l);
  }
  return res;
}

// 兼容 v2.1 顶层 cardData.choice（如金色的龙心）与 keywords[].choice
function getCardChoices(inst) {
  if (!inst || !inst.data) return [];
  if (inst.data.choice && inst.data.choice.on && Array.isArray(inst.data.choice.opts)) {
    return inst.data.choice.opts;
  }
  for (const kw of (inst.data.keywords || [])) {
    if (kw.choice && kw.choice.on) return kw.choice.opts || [];
  }
  return [];
}

function getCardTargetRequirement(inst, isEnhanced = false, choiceIdx = -1) {
  switch (inst.data.id) {
    case 'cmwbxdn7tcvde': return 'hand_card';
    case 'cmwc0t61ade7b':
    case 'cmwfd8opa9wwf':
    case 'cmwffsync2y12': return 'enemy_minion';
    case 'cmwcah8st1lar': return 'enemy_minion_hp3';
    case 'cmwcalky6itcu': return 'enemy_minion';
    case 'cmwcaqbzuvvcx': return 'friendly_minion';
    case 'cmwcb1izpxl7e': return 'enemy_minion';
    case 'cmwcba1blx523': return isEnhanced ? '' : 'enemy_minion';
    case 'cmwdvbzosilgg': return 'friendly_countdown';
    case 'cmwdvhcrr8g9v': return 'friendly_countdown';
    case 'cmwe1w8cztclb': return 'friendly_countdown';
    case 'cmwdw1gnfmjtt': return 'any_minion';
    case 'cmwdx7vx7izcu': return 'friendly_dragon_minion';
    case 'cmwe17fnvt7x0': return 'any_board_card';
    case 'cmwe071ws115o': return choiceIdx === 1 ? 'friendly_countdown' : '';
    case 'cmwgftipxm3ux':
    case 'cmwggewsi6c9n': return 'any_minion';
    case 'cmwgh0uggjyno': return 'enemy_minion';
  }
  const ast = inst.data.ast || parseCardEffectAST(inst.data);
  const pool = [...ast.fanfare, ...ast.spellMain];
  for (const act of pool) {
    if (act.needTarget === 'enemy_minion_hp') return 'enemy_minion_hp3';
    if (act.needTarget === 'enemy_minion') return 'enemy_minion';
    if (act.needTarget === 'friendly_minion') return 'friendly_minion';
  }
  return '';
}

function getValidTargetLocations(casterSide, reqType, isSpell, excludeSacLanes = []) {
  const res = [];
  const opp = 1 - casterSide;
  if (reqType === 'enemy_minion' || reqType === 'enemy_minion_hp3') {
    for (let l = 0; l < 5; l++) {
      const m = battle.board[opp][l];
      if (!m || m.data.type !== 'minion') continue;
      if (m.activeKw['潜行']) continue;
      if (isSpell && m.activeKw['灵气']) continue;
      if (reqType === 'enemy_minion_hp3' && m.currentHp > 3) continue;
      res.push({ side: opp, lane: l });
    }
  } else if (reqType === 'friendly_minion') {
    for (let l = 0; l < 5; l++) {
      const m = battle.board[casterSide][l];
      if (m && m.data.type === 'minion' && !excludeSacLanes.includes(l)) res.push({ side: casterSide, lane: l });
    }
  } else if (reqType === 'friendly_dragon_minion') {
    for (let l = 0; l < 5; l++) {
      const m = battle.board[casterSide][l];
      if (m && m.data.type === 'minion' && hasRace(m.data, '龙族') && !excludeSacLanes.includes(l)) res.push({ side: casterSide, lane: l });
    }
  } else if (reqType === 'friendly_countdown') {
    for (let l = 0; l < 5; l++) {
      const m = battle.board[casterSide][l];
      if (m && m.countdown !== null && m.countdown !== undefined && !excludeSacLanes.includes(l)) res.push({ side: casterSide, lane: l });
    }
  } else if (reqType === 'any_minion') {
    for (const s of [opp, casterSide]) {
      for (let l = 0; l < 5; l++) {
        const m = battle.board[s][l];
        if (!m || m.data.type !== 'minion') continue;
        if (s === casterSide && excludeSacLanes.includes(l)) continue;
        if (s === opp && m.activeKw['潜行']) continue;
        if (s === opp && isSpell && m.activeKw['灵气']) continue;
        res.push({ side: s, lane: l });
      }
    }
  } else if (reqType === 'any_board_card') {
    for (const s of [opp, casterSide]) {
      for (let l = 0; l < 5; l++) {
        const m = battle.board[s][l];
        if (!m) continue;
        if (s === casterSide && excludeSacLanes.includes(l)) continue;
        if (s === opp && m.activeKw['潜行']) continue;
        if (s === opp && isSpell && m.activeKw['灵气']) continue;
        res.push({ side: s, lane: l });
      }
    }
  }
  return res;
}

function getValidTargetLanes(casterSide, reqType, isSpell, excludeSacLanes = []) {
  return getValidTargetLocations(casterSide, reqType, isSpell, excludeSacLanes).map(x => x.lane);
}

function findFirstEmptyLane(side) {
  return battle.board[side].findIndex(m => m === null);
}

let dragState = { active: false, inst: null, startX: 0, startY: 0, lastX: 0, lastY: 0, downTime: 0, holdTimer: null, moved: false, hoverLane: -1 };

function activateHandCardDragGhost() {
  if (!dragState.active || !dragState.inst || dragState.moved) return;
  dragState.moved = true;
  const ghost = document.getElementById('dragGhostBox');
  ghost.innerHTML = '';
  const cardNode = buildHandCardDOM(dragState.inst.data, dragState.inst);
  cardNode.style.transform = 'scale(0.96)';
  ghost.appendChild(cardNode);
  ghost.style.left = `${dragState.lastX}px`;
  ghost.style.top = `${dragState.lastY}px`;
  ghost.classList.remove('hidden');
  renderAllBattleUI();
}

function startCardDrag(e, inst) {
  if (e.button !== undefined && e.button !== 0) return;
  if (dragState.holdTimer) clearTimeout(dragState.holdTimer);
  const canPlayDrag = (!battle.gameOver && !battle.animating && !battle.pendingPlay && (battleMode === 'pvp_online' ? onlineIsMyTurn() : (battle.activeSide === 0 || battleMode === 'pvp_pass')));
  dragState = {
    active: true,
    inst: inst,
    startX: e.clientX,
    startY: e.clientY,
    lastX: e.clientX,
    lastY: e.clientY,
    downTime: performance.now(),
    holdTimer: canPlayDrag ? setTimeout(() => {
      activateHandCardDragGhost();
    }, 150) : null,
    moved: false,
    hoverLane: -1
  };
}

function detectHoveredPlayerLane(clientX, clientY) {
  const pRow = document.getElementById('playerLanesRow');
  if (!pRow) return -1;
  let bestIdx = -1;
  let bestDist = 9999;
  Array.from(pRow.children).forEach((cell, idx) => {
    const r = cell.getBoundingClientRect();
    const padX = 14, padY = 24;
    const inside = clientX >= (r.left - padX) && clientX <= (r.right + padX) && clientY >= (r.top - padY) && clientY <= (r.bottom + padY);
    if (inside) {
      const cx = (r.left + r.right) / 2;
      const cy = (r.top + r.bottom) / 2;
      const d = Math.hypot(clientX - cx, clientY - cy);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = idx;
      }
    }
  });
  return bestIdx;
}

window.addEventListener('mousemove', (e) => {
  if (!dragState.active || !dragState.inst) return;
  dragState.lastX = e.clientX;
  dragState.lastY = e.clientY;
  const dist = Math.hypot(e.clientX - dragState.startX, e.clientY - dragState.startY);
  const canPlayDrag = (!battle.gameOver && !battle.animating && !battle.pendingPlay && (battleMode === 'pvp_online' ? onlineIsMyTurn() : (battle.activeSide === 0 || battleMode === 'pvp_pass')));
  if (!dragState.moved && canPlayDrag && dist >= 8) {
    if (dragState.holdTimer) { clearTimeout(dragState.holdTimer); dragState.holdTimer = null; }
    activateHandCardDragGhost();
  }
  if (dragState.moved) {
    const ghost = document.getElementById('dragGhostBox');
    ghost.style.left = `${e.clientX}px`;
    ghost.style.top = `${e.clientY}px`;

    const actSide = battleMode === 'pvp_pass' ? battle.activeSide : 0;
    const playEval = evaluateCardPlayState(actSide, dragState.inst);
    const needSac = (dragState.inst.data.sacrifice || 0) > 0 && playEval.mode !== 'accelerate';

    const arenaBox = document.getElementById('boardArenaBox');
    const arenaRect = arenaBox ? arenaBox.getBoundingClientRect() : null;
    const inArena = arenaRect && e.clientX >= arenaRect.left - 36 && e.clientX <= arenaRect.right + 36 && e.clientY >= arenaRect.top - 36 && e.clientY <= arenaRect.bottom + 36;

    if (needSac) {
      // 规则：「正确应该把献祭类卡牌移动到战场任意位置（不放置）再选择要献祭的卡牌，选择完后再选择要放置的空位」
      dragState.hoverLane = -1;
      if (arenaBox) arenaBox.classList.toggle('arena-sacrifice-drop-ready', Boolean(inArena));
      const pRow = document.getElementById('playerLanesRow');
      if (pRow) Array.from(pRow.children).forEach(cell => cell.classList.remove('placeable-slot'));
      if (inArena) {
        showSacrificeGuideBanner('🩸 献祭召唤准备', `松开鼠标进入【${dragState.inst.data.name}】献祭流程：先选 ${dragState.inst.data.sacrifice} 个祭品 → 再选放置空位`);
      } else {
        showSacrificeGuideBanner('', '');
      }
    } else {
      if (arenaBox) arenaBox.classList.remove('arena-sacrifice-drop-ready');
      dragState.hoverLane = detectHoveredPlayerLane(e.clientX, e.clientY);
      const pRow = document.getElementById('playerLanesRow');
      if (pRow) {
        Array.from(pRow.children).forEach((cell, idx) => {
          cell.classList.toggle('placeable-slot', idx === dragState.hoverLane);
        });
      }
    }
  }
});

window.addEventListener('mouseup', async (e) => {
  if (!dragState.active) return;
  const inst = dragState.inst;
  const wasMoved = dragState.moved;
  const dropLane = detectHoveredPlayerLane(e.clientX, e.clientY);
  if (dragState.holdTimer) { clearTimeout(dragState.holdTimer); dragState.holdTimer = null; }
  dragState.active = false;
  dragState.inst = null;
  document.getElementById('dragGhostBox').classList.add('hidden');
  const arenaBox = document.getElementById('boardArenaBox');
  if (arenaBox) arenaBox.classList.remove('arena-sacrifice-drop-ready');
  showSacrificeGuideBanner('', '');

  const actSide = battleMode === 'pvp_pass' ? battle.activeSide : 0;

  if (!wasMoved) {
    if (!isLeftSideUiConflictActive()) {
      sfx.play('click');
      openCardDetailPanel(inst, 'hand', actSide, -1);
    }
    return;
  }

  const dragDist = Math.hypot(e.clientX - dragState.startX, e.clientY - dragState.startY);
  const arenaRect = arenaBox ? arenaBox.getBoundingClientRect() : null;
  const inArena = arenaRect && e.clientX >= arenaRect.left - 36 && e.clientX <= arenaRect.right + 36 && e.clientY >= arenaRect.top - 36 && e.clientY <= arenaRect.bottom + 36;

  if (dragDist < 26 || (dropLane < 0 && !inArena)) {
    sfx.play('click');
    renderAllBattleUI();
    return;
  }

  const playEval = evaluateCardPlayState(actSide, inst);
  const choices = getCardChoices(inst);
  const needSac = (inst.data.sacrifice || 0) > 0 && playEval.mode !== 'accelerate';
  const isEnh = playEval.mode === 'enhance';
  const req = getCardTargetRequirement(inst, isEnh, -1);
  const validTargets = req && req !== 'hand_card' ? getValidTargetLocations(actSide, req, inst.data.type === 'spell') : [];
  const needTarget = (req === 'hand_card' && battle.leaders[actSide].hand.length > 1) || (req && req !== 'hand_card' && validTargets.length > 0);
  const isBoardPlacement = ((inst.data.type === 'minion' || inst.data.type === 'amulet') && playEval.mode !== 'accelerate') || playEval.mode === 'crystallize';

  if (isBoardPlacement && !choices.length && !needSac && !needTarget) {
    if (dropLane < 0 || battle.board[actSide][dropLane] !== null) {
      sfx.play('click');
      renderAllBattleUI();
      return;
    }
  } else {
    // 献祭卡、抉择卡、目标卡或法术卡：只要拖入战场任意位置 (inArena || dropLane >= 0) 即可触发！
    if (!inArena && dropLane < 0) {
      sfx.play('click');
      renderAllBattleUI();
      return;
    }
  }

  if (!playEval.ok) {
    sfx.play('hit');
    await showTriggeredEffectToast(inst.data, `无法打出：${playEval.reason}`, 0);
    renderAllBattleUI();
    return;
  }

  battle.inspectedCard = null;
  document.getElementById('svDetailPanel').classList.add('hidden'); document.querySelectorAll('#playerHandZone .sv-hand-card.is-inspected').forEach(el => el.classList.remove('is-inspected'));

  if (!choices.length && !needSac && !needTarget) {
    if (!isBoardPlacement) {
      await commitCardPlayWithAnimations(actSide, inst, playEval, 0, [], -1, 0, -1, -1);
      return;
    }
    if (dropLane >= 0 && battle.board[actSide][dropLane] === null) {
      await commitCardPlayWithAnimations(actSide, inst, playEval, dropLane, [], -1, 0, -1, -1);
      return;
    }
  }

  // 规则：「把献祭类卡牌移动到战场任意位置（不放置）再选择要献祭的卡牌，选择完后再选择要放置的空位」
  // 因此对于 needSac 为 true 的卡牌，initialDropLane 强制设为 -1，确保选完祭品后一定让玩家再选要放置的空位！
  battle.pendingPlay = {
    side: actSide,
    card: inst,
    playEval: playEval,
    step: 'INIT',
    choiceIdx: -1,
    sacLanes: [],
    effectTargetSide: -1,
    effectTargetLane: -1,
    handTargetUid: -1,
    initialDropLane: (needSac || needTarget) ? -1 : dropLane
  };
  await advancePendingLeftTopPipeline();
});

function setHandCollapsed(collapsed) {
  battle.handCollapsed = Boolean(collapsed);
  const hz = document.getElementById('playerHandZone');
  const btn = document.getElementById('btnToggleHandCollapse');
  if (hz) hz.classList.toggle('hand-collapsed', battle.handCollapsed);
  document.getElementById('playerLeaderNode')?.classList.toggle('hand-expanded-hp', !battle.handCollapsed);
  if (btn) {
    btn.textContent = battle.handCollapsed ? '🔼 点击展开手牌' : '🔽 点击空地可收起手牌展示主战者';
  }
}

document.getElementById('btnToggleHandCollapse').addEventListener('click', (e) => {
  e.stopPropagation();
  sfx.play('click');
  setHandCollapsed(!battle.handCollapsed);
});

document.getElementById('playerHandZone').addEventListener('click', (e) => {
  if (battle.handCollapsed) {
    e.stopPropagation();
    sfx.play('click');
    setHandCollapsed(false);
  }
});

window.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  if (battle.animating) return;
  const screenBattle = document.getElementById('screenBattle');
  if (screenBattle && screenBattle.classList.contains('hidden')) return;
  const target = e.target;

  const logPanel = document.getElementById('battleRecordPanel');
  if (logPanel && !logPanel.classList.contains('hidden')) {
    if (!target.closest('#battleRecordPanel') && !target.closest('#btnToggleBattleLog') && !target.closest('#svDetailPanel')) {
      logPanel.classList.add('hidden');
      battle.inspectedCard = null;
      document.getElementById('svDetailPanel').classList.add('hidden'); document.querySelectorAll('#playerHandZone .sv-hand-card.is-inspected').forEach(el => el.classList.remove('is-inspected'));
    }
  }

  if (target.closest('.interactive-zone') || target.closest('#topNavBar') || target.closest('#mulliganModal') || target.closest('#tutorialModal') || target.closest('#victoryDefeatModal') || target.closest('#pvpHandoverModal') || target.closest('#mobilePortraitOverlay')) {
    return;
  }
  if (battle.pendingPlay) {
    sfx.play('click');
    cancelPendingPlayToHand();
    return;
  }
  if (battle.inspectedCard) {
    sfx.play('click');
    battle.inspectedCard = null;
    document.getElementById('svDetailPanel').classList.add('hidden'); document.querySelectorAll('#playerHandZone .sv-hand-card.is-inspected').forEach(el => el.classList.remove('is-inspected'));
    return;
  }
  if (!dragState.active) {
    sfx.play('click');
    setHandCollapsed(!battle.handCollapsed);
  }
});

function cancelPendingPlayToHand() {
  battle.pendingPlay = null;
  document.getElementById('pendingLeftTopContainer').classList.add('hidden');
  document.getElementById('modeChoiceCenterPanel').classList.add('hidden');
  document.getElementById('handPickModal').classList.add('hidden');
  showSacrificeGuideBanner('', '');
  renderAllBattleUI();
}

function updatePendingLeftTopView(hintText) {
  closeCardDetailIfConflict();
  const pp = battle.pendingPlay;
  if (!pp) return;
  const box = document.getElementById('pendingLeftTopContainer');
  const slot = document.getElementById('pendingCardPreviewSlot');
  slot.innerHTML = '';
  const cardEl = buildHandCardDOM(pp.card.data, pp.card);
  cardEl.classList.add(pp.playEval.glow || 'sv-glow-green');
  slot.appendChild(cardEl);

  document.getElementById('pendingPanelTitle').textContent = pp.card.data.name;
  document.getElementById('pendingPanelBody').textContent = getCardDisplayText(pp.card.data, pp.card);
  document.getElementById('pendingStepHint').textContent = hintText;
  box.classList.remove('hidden');
}

async function advancePendingLeftTopPipeline() {
  const pp = battle.pendingPlay;
  if (!pp) return;
  const actSide = pp.side !== undefined ? pp.side : 0;
  const card = pp.card;
  const playEval = pp.playEval;

  // 第一步：若为献祭类卡牌，必须先选择要献祭的随从（不先放置到格子里）！
  const needSac = (card.data.sacrifice || 0);
  if (needSac > 0 && playEval.mode !== 'accelerate' && pp.sacLanes.length < needSac) {
    pp.step = 'SACRIFICE';
    const condStr = card.data.sacrificeCond ? `「${card.data.sacrificeCond}」` : '';
    const msg = `请点击我方战场上的 ${needSac} 个${condStr}随从作为祭品 (已选 ${pp.sacLanes.length}/${needSac}，再次点击可取消选择)`;
    updatePendingLeftTopView(`🩸 【步骤 1/2：选择祭品】${msg}`);
    showSacrificeGuideBanner(`🩸 步骤 1/2 · 选择祭品 (${pp.sacLanes.length}/${needSac})`, `请点击己方战场上的 ${needSac} 个${condStr}随从作为『${card.data.name}』的祭品（选完后再选放置空位）`);
    renderAllBattleUI();
    return;
  }

  // 第二步：若有抉择分支，弹出抉择面板
  const choices = getCardChoices(card);
  if (choices.length > 0 && pp.choiceIdx === -1) {
    pp.step = 'CHOICE';
    updatePendingLeftTopView('⚖️ 请在中央选择 1 个能力模式（点击空白处取消）');
    showSacrificeGuideBanner('⚖️ 选择能力模式', `请为『${card.data.name}』选择 1 个要发动的【抉择】分支`);
    openModeChoiceBars(card, choices, actSide);
    renderAllBattleUI();
    return;
  }
  document.getElementById('modeChoiceCenterPanel').classList.add('hidden');

  // 第三步：若需要指定手牌或场上目标
  const isEnh = playEval.mode === 'enhance';
  const req = getCardTargetRequirement(card, isEnh, pp.choiceIdx);
  const otherHand = battle.leaders[actSide].hand.filter(h => h !== card);
  if (req === 'hand_card' && pp.handTargetUid === -1 && otherHand.length > 0) {
    pp.step = 'HAND_SELECT';
    updatePendingLeftTopView('🃏 请在中央选择 1 张手牌洗入牌库');
    showSacrificeGuideBanner('🃏 选择手牌目标', '请点击选择 1 张手牌洗回牌库');
    openSingleHandPickModal(card, otherHand, '请选择 1 张手牌洗入牌库并抽取 1 张卡牌');
    renderAllBattleUI();
    return;
  }

  if (req && req !== 'hand_card' && pp.effectTargetLane === -1) {
    const validLocs = getValidTargetLocations(actSide, req, card.data.type === 'spell', pp.sacLanes);
    if (validLocs.length > 0) {
      pp.step = 'TARGET';
      updatePendingLeftTopView(`🎯 请点击战场上高亮的目标卡牌`);
      showSacrificeGuideBanner('🎯 选择效果目标', `请点击战场上高亮的目标卡牌以发动『${card.data.name}』的效果`);
      renderAllBattleUI();
      return;
    } else if (card.data.type === 'spell') {
      cancelPendingPlayToHand();
      return;
    }
  }

  const isBoardPlacement = ((card.data.type === 'minion' || card.data.type === 'amulet') && playEval.mode !== 'accelerate') || playEval.mode === 'crystallize';
  if (!isBoardPlacement) {
    const finalPP = Object.assign({}, pp);
    cancelPendingPlayToHand();
    await commitCardPlayWithAnimations(actSide, finalPP.card, finalPP.playEval, 0, finalPP.sacLanes, finalPP.effectTargetLane, Math.max(0, finalPP.choiceIdx), finalPP.handTargetUid, finalPP.effectTargetSide);
    return;
  }

  // 非献祭卡若起手直接拖到了空战道上，自动落位；献祭卡 (initialDropLane === -1) 则必须进入 PLACE_LANE 让玩家选择要放置的空位！
  if (pp.initialDropLane >= 0 && needSac === 0 && battle.board[actSide][pp.initialDropLane] === null) {
    const finalPP = Object.assign({}, pp);
    cancelPendingPlayToHand();
    await commitCardPlayWithAnimations(actSide, finalPP.card, finalPP.playEval, finalPP.initialDropLane, finalPP.sacLanes, finalPP.effectTargetLane, Math.max(0, finalPP.choiceIdx), finalPP.handTargetUid, finalPP.effectTargetSide);
    return;
  }

  // 第四步：选择要放置的空位（包括被选作祭品即将腾出的位置）
  pp.step = 'PLACE_LANE';
  updatePendingLeftTopView('📍 【步骤 2/2：选择放置空位】请点击我方高亮的空战道（或已选祭品所在战道）将卡牌放入战场');
  showSacrificeGuideBanner('📍 步骤 2/2 · 选择放置空位', `祭品已选妥！请点击我方战场上任意绿色高亮的空位（含祭品所在位置）放置『${card.data.name}』`);
  renderAllBattleUI();
}

function isChoiceOptionLocked(card, opt, idx, side = 0) {
  if (!card) return { locked: false, reason: '' };
  const desc = String((opt && opt.t) || '');
  const mFuse = desc.match(/若(?:本卡牌已)?融合(?:张数)?(?:大于)?(\d+)/);
  if (mFuse) {
    const reqCnt = Number(mFuse[1]);
    const curCnt = card.fusedCount || 0;
    if (curCnt < reqCnt) {
      return { locked: true, reason: `🔒 需融合 ${reqCnt} 张以上才可选择（当前已融合 ${curCnt} 张）` };
    }
  }
  if (card.data && card.data.id === 'cmwdibvlbqmxv' && idx === 2 && (card.fusedCount || 0) < 3) {
    return { locked: true, reason: `🔒 需融合 3 张以上才可选择（当前已融合 ${card.fusedCount || 0} 张）` };
  }
  if (card.data && card.data.id === 'cmwe071ws115o' && idx === 1) {
    const hasCd = battle.board[side].some(m => m && m.countdown !== null && m.countdown !== undefined);
    if (!hasCd) {
      return { locked: true, reason: `🔒 己方战场上没有具有倒计时的卡牌` };
    }
  }
  return { locked: false, reason: '' };
}

function openModeChoiceBars(card, choices, side = 0) {
  const panel = document.getElementById('modeChoiceCenterPanel');
  const box = document.getElementById('modeChoiceBarsBox');
  box.innerHTML = '';

  choices.forEach((opt, idx) => {
    let desc = opt.t || '';
    if (!desc && opt.reans && opt.reans.length > 0) {
      const r = opt.reans[0];
      const cf = r.costs || {};
      const cParts = [];
      if (cf.value) cParts.push(`价值${formatCardValueText(cf.value)}`);
      if (cf.energy) cParts.push(`能量${cf.energy}`);
      if (cf.sacrifice) cParts.push(`祭品${cf.sacrifice}`);
      if (cf.bones) cParts.push(`骨头${cf.bones}`);
      const typePart = r.type ? `仅限「${r.type}」` : '';
      const timesPart = opt.reans.length > 1 ? `×${opt.reans.length}` : '';
      desc = `【${r.k}_${cParts.join('') || '能量0'}】${typePart}${r.effect || ''}${timesPart}`;
    }
    const lockCheck = isChoiceOptionLocked(card, opt, idx, side);
    const bar = document.createElement('div');
    if (lockCheck.locked) {
      bar.className = 'interactive-zone pointer-events-auto w-full bg-slate-900/75 border-2 border-slate-700 rounded-xl px-6 py-4 text-sm font-bold text-slate-500 shadow-inner cursor-not-allowed flex flex-col gap-1';
      bar.dataset.choiceLocked = 'true';
      bar.innerHTML = `<div>（${idx + 1}）${desc}</div><div class="text-xs text-rose-400 font-black">${lockCheck.reason}</div>`;
      bar.addEventListener('click', (e) => {
        e.stopPropagation();
        sfx.play('hit');
      });
    } else {
      bar.className = 'interactive-zone pointer-events-auto w-full bg-slate-950/92 hover:bg-sky-950/95 border-2 border-amber-400/75 hover:border-amber-300 rounded-xl px-6 py-5 text-sm font-bold text-white shadow-2xl cursor-pointer transition transform hover:scale-[1.02]';
      bar.dataset.choiceLocked = 'false';
      bar.textContent = `（${idx + 1}）${desc}`;
      bar.addEventListener('click', async (e) => {
        e.stopPropagation();
        sfx.play('click');
        if (!battle.pendingPlay) return;
        battle.pendingPlay.choiceIdx = idx;
        await advancePendingLeftTopPipeline();
      });
    }
    box.appendChild(bar);
  });
  panel.classList.remove('hidden');
}

function openSingleHandPickModal(sourceCard, candidateHandCards, promptText, onPickCallback = null) {
  const modal = document.getElementById('handPickModal');
  document.getElementById('handPickSourceTitle').textContent = sourceCard.data.name;
  document.getElementById('handPickSourceDesc').textContent = getCardDisplayText(sourceCard.data, sourceCard);
  document.getElementById('handPickPromptTitle').textContent = promptText;
  document.getElementById('btnConfirmMultiFuse').classList.add('hidden');
  const grid = document.getElementById('handPickCardsGrid');
  grid.innerHTML = '';

  candidateHandCards.forEach(hc => {
    const cardEl = buildHandCardDOM(hc.data, hc);
    cardEl.classList.add('sv-glow-yellow', 'hand-pick-card-item', 'interactive-zone', 'pointer-events-auto');
    cardEl.style.cursor = 'pointer';
    cardEl.addEventListener('click', async (e) => {
      e.stopPropagation();
      sfx.play('click');
      modal.classList.add('hidden');
      if (onPickCallback) {
        await onPickCallback(hc);
        return;
      }
      if (!battle.pendingPlay) return;
      battle.pendingPlay.handTargetUid = hc.uid;
      await advancePendingLeftTopPipeline();
    });
    grid.appendChild(cardEl);
  });
  modal.classList.remove('hidden');
}

function addBones(side, amount) {
  if (amount <= 0) return;
  battle.leaders[side].bones += amount;
  spawnFloatNumber(side, -1, `🦴+${amount}`, '#fde047');
}

async function placeMinionOnBoardAnimated(side, inst, lane) {
  if (inst.data.rarity === '传说') {
    inst.justEnteredLegendVfx = true;
    sfx.play('legend');
  } else {
    sfx.play('play');
  }
  globalEnterSeq += 1;
  inst.enterOrder = globalEnterSeq;
  inst.attackedThisTurn = false;
  battle.board[side][lane] = inst;
  renderAllBattleUI();
  spawnFloatNumber(side, lane, inst.data.rarity === '传说' ? '🌟传说降临' : (inst.data.type === 'amulet' ? '⛩️护符展开' : '登场'), '#fde047');
  await sleep(inst.data.rarity === '传说' ? 460 : 240);
  inst.justEnteredLegendVfx = false;

  await triggerBoardEnterPassivesAnimated(side, inst, lane, 0);
  // 招魂的术士 / 灵魂雕塑家：亡灵或怨灵进入己方战场时获得毁灭
  if (inst.data.type === 'minion' && hasRace(inst.data, '亡灵')) {
    for (let l = 0; l < 5; l++) {
      const nec = battle.board[side][l];
      if (!nec || nec === inst) continue;
      if (nec.data.id === 'cmwgccmsj2ypl' || (nec.data.id === 'cmwgchn8wmoi5' && inst.data.id === 'cmwfdja9sjiuf')) {
        if (!inst.activeKw['毁灭']) {
          inst.activeKw['毁灭'] = 1;
          addGrantedEffect(inst, `来源：【${nec.data.name}】 → 获得【毁灭】`);
          spawnFloatNumber(side, lane, '☠️毁灭', '#a855f7');
          renderAllBattleUI();
        }
      }
    }
  }

  // 猎魄师：每当亡灵随从进入己方战场时，使其破坏，并使本随从获得+2/+2
  if (inst.data.type === 'minion' && hasRace(inst.data, '亡灵')) {
    for (let l = 0; l < 5; l++) {
      const hunter = battle.board[side][l];
      if (hunter && hunter !== inst && hunter.data.id === 'cmwfgsh29e6k1') {
        await showTriggeredEffectToast(hunter.data, `亡灵随从『${inst.data.name}』进场，使其破坏并自身获得+2/+2！`, 240);
        await destroyMinionAnimated(side, lane, false);
        if (battle.board[side][l] === hunter) {
          hunter.currentAtk += 2;
          hunter.maxHp += 2;
          hunter.currentHp += 2;
          addGrantedEffect(hunter, `来源：【猎魄师】 → 获得 +2/+2`);
          spawnFloatNumber(side, l, '+2/+2', '#fde047');
          renderAllBattleUI();
        }
        if (battle.board[side][lane] !== inst) return;
      }
    }
  }

  // 摇滚骷髅乐团主唱：当具有谢幕曲的随从进入自己战场时，将其破坏，并使自己所有随从获得+1/+1
  if (inst.data.type === 'minion' && hasAnyLastWords(inst)) {
    for (let l = 0; l < 5; l++) {
      const singer = battle.board[side][l];
      if (singer && singer !== inst && singer.data.id === 'cmwghmf9xj9dv' && battle.board[side][lane] === inst) {
        await showTriggeredEffectToast(singer.data, `谢幕曲随从『${inst.data.name}』进场，将其破坏并使己方全体随从+1/+1！`, 240);
        await playSynergyBeam(getLaneDOM(side, l), getLaneDOM(side, lane), '#f43f5e', 220);
        await destroyMinionAnimated(side, lane, false);
        for (let fl = 0; fl < 5; fl++) {
          const fm = battle.board[side][fl];
          if (fm && fm.data.type === 'minion') {
            fm.currentAtk += 1; fm.currentHp += 1; fm.maxHp += 1;
            addGrantedEffect(fm, '来源：【摇滚骷髅乐团主唱】 → 谢幕曲随从进场 +1/+1');
            await playSynergyBeam(getLaneDOM(side, l), getLaneDOM(side, fl), '#4ade80', 140);
            spawnFloatNumber(side, fl, '+1/+1', '#4ade80');
          }
        }
        renderAllBattleUI();
        return;
      }
    }
  }

  // 地狱三头犬：随从进场时召唤2个同名随从；若本局破坏谢幕曲>10，依次赋予毁灭、虹吸、荆棘5
  if (inst.data.id === 'cmwgdqawegvy3' && !inst._cerberusSpawned && battle.board[side][lane] === inst) {
    inst._cerberusSpawned = true;
    const spawned = [inst];
    for (let k = 0; k < 2; k++) {
      const el = findNextSummonLane(side, lane, false);
      if (el === -1) break;
      const copy = createCardInstance('cmwgdqawegvy3', side);
      copy._cerberusSpawned = true;
      await placeMinionOnBoardAnimated(side, copy, el);
      spawned.push(copy);
    }
    if (hasReachedLastWordsThreshold(side, 10)) {
      const kws = [['毁灭', 1], ['虹吸', 1], ['荆棘', 5]];
      spawned.forEach((dog, idx) => {
        if (idx < kws.length) {
          dog.activeKw[kws[idx][0]] = kws[idx][1];
          addGrantedEffect(dog, `来源：【地狱三头犬】 → 获得【${kws[idx][0]}${kws[idx][1] > 1 ? '_' + kws[idx][1] : ''}】`);
        }
      });
      await showTriggeredEffectToast(inst.data, '已破坏10个以上谢幕曲随从：3只『地狱三头犬』分别获得【毁灭】【虹吸】【荆棘_5】！', 280);
      renderAllBattleUI();
    }
  }

  // 狼少女：随从进场时对双方主战者造成1点伤害
  if (inst.data.id === 'cmwgepbm7hzy9' && battle.board[side][lane] === inst) {
    await showTriggeredEffectToast(inst.data, '【随从进场时】对双方主战者造成1点伤害！', 220);
    await dealDamageToLeaderAnimated(0, 1, inst);
    if (!battle.gameOver) await dealDamageToLeaderAnimated(1, 1, inst);
  }

  // 怨灵（新版）：随从进场时立刻攻击并消失
  if (inst.data.id === 'cmwfdja9sjiuf' && battle.board[side][lane] === inst && !battle.gameOver) {
    await showTriggeredEffectToast(inst.data, '【随从进场时】『怨灵』立刻发起攻击并【消失】！', 220);
    await performMinionCombatAnimated(side, lane);
    const curL = battle.board[side].indexOf(inst);
    if (!battle.gameOver && curL !== -1) {
      await banishMinionAnimated(side, curL);
    }
  }
}

function findNextSummonLane(side, sourceLane = -1, preferExact = false) {
  if (preferExact && sourceLane >= 0 && sourceLane < 5) {
    if (battle.board[side][sourceLane] === null) return sourceLane;
    return findFirstEmptyLane(side);
  }
  if (sourceLane >= 0 && sourceLane < 5) {
    const rightBlocked = (sourceLane >= 4) || (battle.board[side][sourceLane + 1] !== null);
    if (rightBlocked) {
      for (let l = 4; l >= 0; l--) {
        if (battle.board[side][l] === null) return l;
      }
      return -1;
    }
    for (let l = sourceLane + 1; l < 5; l++) {
      if (battle.board[side][l] === null) return l;
    }
    for (let l = sourceLane - 1; l >= 0; l--) {
      if (battle.board[side][l] === null) return l;
    }
    if (battle.board[side][sourceLane] === null) return sourceLane;
    return -1;
  }
  return findFirstEmptyLane(side);
}

function playBanishVoidSVG(targetEl) {
  if (!targetEl) return;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 120 120');
  svg.className = 'absolute inset-0 w-full h-full pointer-events-none z-40';
  svg.innerHTML = `
    <defs>
      <radialGradient id="voidGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#f5d0fe" stop-opacity="0.95"/>
        <stop offset="45%" stop-color="#a855f7" stop-opacity="0.75"/>
        <stop offset="100%" stop-color="#3b0764" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <circle cx="60" cy="60" r="46" fill="url(#voidGrad)">
      <animate attributeName="r" values="48;10;2" dur="0.42s" fill="freeze"/>
      <animate attributeName="opacity" values="0.95;1;0" dur="0.42s" fill="freeze"/>
    </circle>
    <circle cx="60" cy="60" r="38" fill="none" stroke="#e879f9" stroke-width="3" stroke-dasharray="14 8">
      <animateTransform attributeName="transform" type="rotate" from="0 60 60" to="160 60 60" dur="0.42s" fill="freeze"/>
      <animate attributeName="r" values="42;6" dur="0.42s" fill="freeze"/>
      <animate attributeName="opacity" values="1;0" dur="0.42s" fill="freeze"/>
    </circle>
    <path d="M22 60 Q60 36 98 60 Q60 84 22 60 Z" fill="none" stroke="#fde047" stroke-width="2" opacity="0.85">
      <animate attributeName="opacity" values="0.9;0" dur="0.38s" fill="freeze"/>
    </path>
  `;
  targetEl.appendChild(svg);
  setTimeout(() => svg.remove(), 460);
}

async function playOverflowBanishAnim(side, inst) {
  if (!inst) return;
  const zone = document.getElementById('overflowBanishZone');
  if (!zone) return;
  sfx.play('synergy');
  const wrap = document.createElement('div');
  wrap.className = 'relative flex flex-col items-center';
  const tokenEl = buildFollowerTokenDOM(inst, side, -1);
  const tag = document.createElement('div');
  tag.className = 'absolute -top-3 px-2 py-0.5 rounded-full bg-purple-950 border border-fuchsia-400 text-[10px] font-black text-fuchsia-200 shadow-lg z-30';
  tag.textContent = '✨ 满场溢出·消失';
  wrap.appendChild(tokenEl);
  wrap.appendChild(tag);
  zone.appendChild(wrap);
  await sleep(140);
  playBanishVoidSVG(wrap);
  tokenEl.classList.add('banish-void-anim');
  await sleep(420);
  wrap.remove();
}

async function summonByNameAnimated(side, nameOrId, count = 1, sourceLane = -1, preferExact = false, sourceCardName = '') {
  const summonedList = [];
  for (let i = 0; i < count; i++) {
    const inst = createCardInstance(nameOrId, side);
    if (!inst) continue;
    if (sourceCardName) {
      addGrantedEffect(inst, `来源：【${sourceCardName}】 → 召唤入场`);
    }
    const emptyL = findNextSummonLane(side, sourceLane, preferExact);
    if (emptyL === -1) {
      await playOverflowBanishAnim(side, inst);
      continue;
    }
    await placeMinionOnBoardAnimated(side, inst, emptyL);
    const finalAtSlot = battle.board[side][emptyL];
    if (finalAtSlot) summonedList.push({ inst: finalAtSlot, lane: emptyL });
  }
  return summonedList;
}

async function recruitMinionAnimated(side, costFilter, raceFilter = '', sourceLane = -1, preferExact = false, sourceCardName = '') {
  const st = battle.leaders[side];
  const candidates = st.deck
    .map((c, idx) => ({ c, idx }))
    .filter(item => item.c.data.type === 'minion' && matchesSummonCostFilter(item.c.data, costFilter) && (!raceFilter || hasRace(item.c.data, raceFilter)))
    .sort((a, b) => (getCardCostValue(b.c.data) - getCardCostValue(a.c.data)) || (b.c.data.energy - a.c.data.energy));
  if (candidates.length === 0) return null;
  const chosen = candidates[0];
  st.deck.splice(chosen.idx, 1);
  if (sourceCardName) {
    addGrantedEffect(chosen.c, `来源：【${sourceCardName}】 → 招募入场`);
  }
  const emptyL = findNextSummonLane(side, sourceLane, preferExact);
  if (emptyL === -1) {
    await playOverflowBanishAnim(side, chosen.c);
    return null;
  }
  if (sourceLane >= 0) await playSynergyBeam(getLaneDOM(side, sourceLane), getLaneDOM(side, emptyL), '#38bdf8', 260);
  await placeMinionOnBoardAnimated(side, chosen.c, emptyL);
  return battle.board[side][emptyL];
}

async function reanimateMinionAnimated(side, costFilter, raceFilter = '', sourceLane = -1, preferExact = false, sourceCardName = '') {
  const st = battle.leaders[side];
  const candidates = st.graveyard
    .filter(cd => cd.type === 'minion' && matchesSummonCostFilter(cd, costFilter) && (!raceFilter || hasRace(cd, raceFilter)))
    .sort((a, b) => (getCardCostValue(b) - getCardCostValue(a)) || (b.energy - a.energy));
  if (candidates.length === 0) return null;
  const inst = createCardInstance(candidates[0].id, side);
  if (sourceCardName) {
    addGrantedEffect(inst, `来源：【${sourceCardName}】 → 亡者召还入场`);
  }
  const emptyL = findNextSummonLane(side, sourceLane, preferExact);
  if (emptyL === -1) {
    await playOverflowBanishAnim(side, inst);
    return null;
  }
  if (sourceLane >= 0) await playSynergyBeam(getLaneDOM(side, sourceLane), getLaneDOM(side, emptyL), '#c084fc', 260);
  await placeMinionOnBoardAnimated(side, inst, emptyL);
  return battle.board[side][emptyL];
}

async function playSacrificeBloodRitualSVG(cell) {
  if (!cell) return;
  const svg = document.getElementById('fxSvgOverlay');
  if (!svg) return;
  const r = cell.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.innerHTML = `
    <circle cx="${cx}" cy="${cy}" r="58" fill="rgba(225,29,72,0.22)" stroke="#f43f5e" stroke-width="3.5" stroke-dasharray="10 6"/>
    <circle cx="${cx}" cy="${cy}" r="42" fill="none" stroke="#fda4af" stroke-width="2"/>
    <line x1="${cx - 46}" y1="${cy - 46}" x2="${cx + 46}" y2="${cy + 46}" stroke="#fb7185" stroke-width="5" stroke-linecap="round"/>
    <line x1="${cx + 46}" y1="${cy - 46}" x2="${cx - 46}" y2="${cy + 46}" stroke="#fb7185" stroke-width="5" stroke-linecap="round"/>
  `;
  svg.appendChild(g);
  setTimeout(() => g.remove(), 420);
}

// 谢幕曲触发专属亡魂骷髅与幽紫冥火爆发特效
async function playLastWordsTriggerVFX(side, lane, cardName = '') {
  if (typeof recordLocalVfx === 'function') recordLocalVfx({ kind: 'lw_vfx', side, lane, name: cardName });
  const cell = getLaneDOM(side, lane);
  const svg = document.getElementById('fxSvgOverlay');
  sfx.play('lastwords');
  spawnFloatNumber(side, lane, `💀谢幕曲!`, '#e879f9');
  if (!cell || !svg) return;
  const r = cell.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.innerHTML = `
    <circle cx="${cx}" cy="${cy}" r="66" fill="rgba(168,85,247,0.28)" stroke="#e879f9" stroke-width="4"/>
    <circle cx="${cx}" cy="${cy}" r="48" fill="rgba(15,23,42,0.82)" stroke="#38bdf8" stroke-width="2.5" stroke-dasharray="8 5"/>
    <path d="M${cx-22},${cy-6} C${cx-22},${cy-26} ${cx+22},${cy-26} ${cx+22},${cy-6} C${cx+22},${cy+6} ${cx+14},${cy+14} ${cx+12},${cy+22} L${cx-12},${cy+22} C${cx-14},${cy+14} ${cx-22},${cy+6} ${cx-22},${cy-6} Z" fill="#f3e8ff" stroke="#a855f7" stroke-width="2.5"/>
    <circle cx="${cx-8}" cy="${cy-4}" r="4.5" fill="#090d16"/>
    <circle cx="${cx+8}" cy="${cy-4}" r="4.5" fill="#090d16"/>
    <circle cx="${cx-8}" cy="${cy-4}" r="2" fill="#38bdf8"/>
    <circle cx="${cx+8}" cy="${cy-4}" r="2" fill="#38bdf8"/>
    <line x1="${cx-6}" y1="${cy+14}" x2="${cx-6}" y2="${cy+22}" stroke="#090d16" stroke-width="2"/>
    <line x1="${cx}" y1="${cy+14}" x2="${cx}" y2="${cy+22}" stroke="#090d16" stroke-width="2"/>
    <line x1="${cx+6}" y1="${cy+14}" x2="${cx+6}" y2="${cy+22}" stroke="#090d16" stroke-width="2"/>
  `;
  svg.appendChild(g);
  await sleep(320);
  g.remove();
}


async function triggerFriendlyMinionDestroyedPassives(side, destroyedInst) {
  if (!destroyedInst || !destroyedInst.data || destroyedInst.data.type !== 'minion') return;
  for (let l = 0; l < 5; l++) {
    const fm = battle.board[side][l];
    if (!fm || fm === destroyedInst || fm.data.id !== 'cmwgquj0a4mpo') continue;
    fm.currentAtk += 1;
    fm.currentHp += 1;
    fm.maxHp += 1;
    addGrantedEffect(fm, '来源：【胆小鬼】 → 友方随从被破坏 +1/+1');
    spawnFloatNumber(side, l, '+1/+1', '#fbbf24');
    await showTriggeredEffectToast(fm.data, `友方『${destroyedInst.data.name}』被破坏，『胆小鬼』获得 +1/+1！`, 220);
    renderAllBattleUI();
  }
}

async function destroyMinionAnimated(side, lane, isSacrifice = false, skipLastWordsNow = false, isCountdownExpire = false) {
  const m = battle.board[side][lane];
  if (!m) return null;
  if (m.data.id === 'cmwfdja9sjiuf') {
    await showTriggeredEffectToast(m.data, '『怨灵』被破坏时改为【消失】。', 200);
    await banishMinionAnimated(side, lane);
    return null;
  }
  // 龙心秘宝 (cmwdzvs1woa53)：无法被破坏（倒计时除外）
  if (m.data.id === 'cmwdzvs1woa53' && !isCountdownExpire) {
    spawnFloatNumber(side, lane, '🛡️无法被破坏!', '#fde047');
    return null;
  }
  sfx.play(isSacrifice ? 'sacrifice' : 'hit');
  const cell = getLaneDOM(side, lane);
  if (isSacrifice) {
    playSacrificeBloodRitualSVG(cell);
    spawnFloatNumber(side, lane, '🩸献祭', '#fb7185');
    if (cell && cell.firstElementChild) {
      cell.firstElementChild.classList.add('sacrifice-crimson-anim');
    }
    await sleep(340);
  } else {
    if (cell && cell.firstElementChild) {
      cell.firstElementChild.classList.add('shatter-White-anim');
    }
    await sleep(280);
  }
  battle.board[side][lane] = null;
  const st = battle.leaders[side];
  st.graveyard.push(m.data);
  if (typeof renderBattleRecordPanel === 'function') renderBattleRecordPanel();
  if (hasAnyLastWords(m)) st.destroyedLastWordsCount += 1;
  addBones(side, 1);
  renderAllBattleUI();
  await triggerFriendlyMinionDestroyedPassives(side, m);
  if (!skipLastWordsNow) {
    await resolveLastWordsAnimated(side, lane, m);
  }
  return m;
}

async function destroyMultipleMinionsSimultaneously(targets) {
  const valid = targets.filter(t => {
    const m = battle.board[t.side][t.lane];
    if (!m || m.data.type !== 'minion') return false;
    if (m.data.id === 'cmwdzvs1woa53') return false;
    return true;
  });
  if (valid.length === 0) return [];

  sfx.play('hit');
  valid.forEach(t => {
    const cell = getLaneDOM(t.side, t.lane);
    if (cell && cell.firstElementChild) {
      cell.firstElementChild.classList.add('shatter-White-anim');
    }
  });
  await sleep(300);

  const removedList = [];
  valid.forEach(t => {
    const m = battle.board[t.side][t.lane];
    if (!m) return;
    battle.board[t.side][t.lane] = null;
    const st = battle.leaders[t.side];
    st.graveyard.push(m.data);
    if (hasAnyLastWords(m)) st.destroyedLastWordsCount += 1;
    addBones(t.side, 1);
    removedList.push({ side: t.side, lane: t.lane, inst: m });
  });
  if (typeof renderBattleRecordPanel === 'function') renderBattleRecordPanel();
  renderAllBattleUI();

  for (const item of removedList) {
    if (battle.gameOver) break;
    await triggerFriendlyMinionDestroyedPassives(item.side, item.inst);
    await resolveLastWordsAnimated(item.side, item.lane, item.inst);
  }
  return removedList;
}

async function banishMinionAnimated(side, lane) {
  const m = battle.board[side][lane];
  if (!m) return;
  sfx.play('synergy');
  const cell = getLaneDOM(side, lane);
  if (cell) {
    playBanishVoidSVG(cell);
    if (cell.firstElementChild) {
      cell.firstElementChild.classList.add('banish-void-anim');
    }
  }
  spawnFloatNumber(side, lane, '✨消失', '#e879f9');
  await sleep(400);
  battle.board[side][lane] = null;
  renderAllBattleUI();
  if (m && m.data.id !== 'cmwgcjgs4885x') {
    for (let l = 0; l < 5; l++) {
      const sc = battle.board[side][l];
      if (sc && sc.data.id === 'cmwgchn8wmoi5') {
        await showTriggeredEffectToast(sc.data, '己方随从消失：召唤1个『持盾的骷髅士兵』！', 240);
        await summonByNameAnimated(side, '持盾的骷髅士兵', 1, l, false, sc.data.name);
        break;
      }
    }
  }
}

async function executeASTActionList(side, sourceCardInst, sourceLane, actions, effectTargetLane = -1, preferExactSummonLane = false) {
  const st = battle.leaders[side];
  const opp = 1 - side;
  const cData = sourceCardInst.data;

  for (const act of actions) {
    if (battle.gameOver) break;
    if (act.rawText) {
      await showTriggeredEffectToast(cData, act.rawText, 240);
    }
    switch (act.op) {
      case 'transform_self':
        if (sourceLane >= 0 && battle.board[side][sourceLane] === sourceCardInst) {
          await transformBoardCardAnimated(side, sourceLane, act.targetName, cData.name, 0);
        }
        break;
      case 'recruit':
        for (let i = 0; i < (act.times || 1); i++) {
          await recruitMinionAnimated(side, act.costFilter || act.maxEnergy, act.race || '', sourceLane, preferExactSummonLane, cData.name);
        }
        break;
      case 'reanimate':
        for (let i = 0; i < (act.times || 1); i++) {
          await reanimateMinionAnimated(side, act.costFilter || act.maxEnergy, act.race || '', sourceLane, preferExactSummonLane, cData.name);
        }
        break;
      case 'add_bones':
        addBones(side, act.amount || 1);
        renderAllBattleUI();
        break;
      case 'draw':
        for (let i = 0; i < (act.count || 1); i++) {
          if (act.race) {
            const rIdx = st.deck.findIndex(c => c.data.type === 'minion' && hasRace(c.data, act.race));
            if (rIdx !== -1) {
              const [rc] = st.deck.splice(rIdx, 1);
              addGrantedEffect(rc, `来源：【${cData.name}】 → 定向检索抽上手牌`);
              if (st.hand.length < (st.handLimit || RULES.handLimit)) {
                hiddenCardUids.add(rc.uid);
                st.hand.push(rc);
                renderAllBattleUI();
                const deckEl = document.getElementById(side === 0 ? 'playerDeckStackEl' : 'enemyDeckStackEl');
                await animateCardTrajectory({
                  fromRect: deckEl ? deckEl.getBoundingClientRect() : null,
                  toRect: getHandCardRect(side, rc.uid),
                  cardData: rc.data, showFront: side === 0, duration: 360, arcHeight: -45, startScale: 0.52, endScale: side === 0 ? 1.0 : 0.45
                });
                hiddenCardUids.delete(rc.uid);
                renderAllBattleUI();
              }
            }
          } else {
            await drawCardAnimated(side);
          }
        }
        renderAllBattleUI();
        break;
      case 'add_hand':
        await addCardToHandAnimated(side, act.cardName || '电子羊', act.count || 1, sourceLane, cData.name);
        renderAllBattleUI();
        break;
      case 'summon':
        await summonByNameAnimated(side, act.cardName || '电子羊', act.count || 1, sourceLane, preferExactSummonLane, cData.name);
        break;
      case 'damage_front_three_minions': {
        if (sourceLane >= 0) {
          const lanes3 = [sourceLane - 1, sourceLane, sourceLane + 1].filter(l => l >= 0 && l < 5);
          for (const tl of lanes3) {
            if (battle.board[opp][tl] && battle.board[opp][tl].data.type === 'minion') {
              await playSynergyBeam(getLaneDOM(side, sourceLane), getLaneDOM(opp, tl), '#f97316', 200);
              await dealDamageToMinionAnimated(opp, tl, act.damage || 5, sourceCardInst);
            }
          }
        }
        break;
      }
      case 'damage_front_minion': {
        if (sourceLane >= 0 && battle.board[opp][sourceLane] && battle.board[opp][sourceLane].data.type === 'minion') {
          await playSynergyBeam(getLaneDOM(side, sourceLane), getLaneDOM(opp, sourceLane), '#f97316', 220);
          await dealDamageToMinionAnimated(opp, sourceLane, act.damage || 3, sourceCardInst);
        }
        break;
      }
      case 'distribute_damage': {
        const tSide = act.targetSideType === 'self' ? side : opp;
        await distributeDamageAnimated(tSide, act.damage || 2, act.includeLeader !== false, sourceCardInst, side, sourceLane);
        break;
      }
      case 'aoe_damage': {
        const tSide = act.targetSideType === 'self' ? side : opp;
        await playRowWideVFX(tSide, 'fire_aoe', 400);
        for (let l = 0; l < 5; l++) {
          if (battle.board[tSide][l] && battle.board[tSide][l].data.type === 'minion') {
            await dealDamageToMinionAnimated(tSide, l, act.damage || 3, sourceCardInst);
          }
        }
        break;
      }
      case 'aoe_destroy': {
        if (act.bothSides) {
          await playRowWideVFX(opp, 'destroy_wave', 280);
          await playRowWideVFX(side, 'destroy_wave', 280);
          const targets = [];
          for (let l = 0; l < 5; l++) {
            if (battle.board[opp][l] && battle.board[opp][l].data.type === 'minion') targets.push({ side: opp, lane: l });
            if (battle.board[side][l] && battle.board[side][l].data.type === 'minion') targets.push({ side: side, lane: l });
          }
          await destroyMultipleMinionsSimultaneously(targets);
        } else {
          await playRowWideVFX(opp, 'destroy_wave', 380);
          const targets = [];
          for (let l = 0; l < 5; l++) {
            if (battle.board[opp][l] && battle.board[opp][l].data.type === 'minion') targets.push({ side: opp, lane: l });
          }
          await destroyMultipleMinionsSimultaneously(targets);
        }
        break;
      }
      case 'leader_damage':
        await playSynergyBeam(getLaneDOM(side, sourceLane), getLaneDOM(opp, -1), '#f43f5e', 260);
        await dealDamageToLeaderAnimated(opp, act.damage || 3, sourceCardInst);
        break;
      case 'heal_leader':
        st.hp = Math.min(st.maxHp, st.hp + (act.amount || 3));
        spawnFloatNumber(side, -1, `+${act.amount || 3}`, '#4ade80');
        renderAllBattleUI();
        break;
      case 'banish_target_hp':
      case 'banish_target': {
        const tSide = act.needTarget === 'friendly_minion' ? side : opp;
        if (effectTargetLane >= 0 && battle.board[tSide][effectTargetLane]) {
          const tName = battle.board[tSide][effectTargetLane].data.name;
          await playSynergyBeam(getLaneDOM(side, sourceLane), getLaneDOM(tSide, effectTargetLane), '#c084fc', 260);
          await banishMinionAnimated(tSide, effectTargetLane);
          if (act.sameNameAll) {
            for (let l = 0; l < 5; l++) {
              if (battle.board[tSide][l] && battle.board[tSide][l].data.name === tName) {
                await banishMinionAnimated(tSide, l);
              }
            }
          }
        }
        break;
      }
      case 'destroy_target': {
        const tSide = act.needTarget === 'friendly_minion' ? side : opp;
        if (effectTargetLane >= 0 && battle.board[tSide][effectTargetLane]) {
          await playSynergyBeam(getLaneDOM(side, sourceLane), getLaneDOM(tSide, effectTargetLane), '#f43f5e', 260);
          await destroyMinionAnimated(tSide, effectTargetLane);
        }
        break;
      }
      case 'damage_target': {
        const tSide = act.needTarget === 'friendly_minion' ? side : opp;
        if (effectTargetLane >= 0 && battle.board[tSide][effectTargetLane]) {
          await playSynergyBeam(getLaneDOM(side, sourceLane), getLaneDOM(tSide, effectTargetLane), '#f43f5e', 260);
          await dealDamageToMinionAnimated(tSide, effectTargetLane, act.damage || 3, sourceCardInst);
        }
        break;
      }
      case 'buff_allies':
        await playRowWideVFX(side, 'buff_wave', 340);
        for (let l = 0; l < 5; l++) {
          const ally = battle.board[side][l];
          if (ally && ally.data.type === 'minion' && ally !== sourceCardInst && (!act.race || hasRace(ally.data, act.race))) {
            ally.currentAtk += (act.atk || 1);
            ally.maxHp += (act.hp || 1);
            ally.currentHp += (act.hp || 1);
            addGrantedEffect(ally, `来源：【${cData.name}】 → 获得 +${act.atk || 1}/+${act.hp || 1}`);
            spawnFloatNumber(side, l, `+${act.atk}/${act.hp}`, '#fde047');
          }
        }
        renderAllBattleUI();
        break;
      case 'discount_next':
        st.nextMechDiscount += (act.amount || 1);
        renderAllBattleUI();
        break;
    }
  }
}

async function resolveLastWordsAnimated(side, lane, m) {
  if (!hasAnyLastWords(m)) return;
  const st = battle.leaders[side];
  const opp = 1 - side;

  // 规则：「谢幕曲触发时需要播放特效」
  await playLastWordsTriggerVFX(side, lane, m.data.name);

  if (m.data.id === 'cmwbwg3kwqfkq') {
    st.delayedMechDraws += 1;
    await showTriggeredEffectToast(m.data, '下个回合开始时，从自己的牌库中抽取1张机械随从卡。', 280);
  } else if (m.data.id === 'cmwdzojlzzf98') {
    await showTriggeredEffectToast(m.data, '【谢幕曲】召唤1个『雏龙的蛋』到己方战场上。', 260);
    await summonByNameAnimated(side, '雏龙的蛋', 1, lane, true, m.data.name);
  } else if (m.data.id === 'cmwe0x250te3k') {
    await showTriggeredEffectToast(m.data, '【谢幕曲】召唤1个『沉睡的恐龙化石』到己方战场上。', 260);
    await summonByNameAnimated(side, '沉睡的恐龙化石', 1, lane, true, m.data.name);
  } else if (m.data.id === 'cmwe1281dd6j0') {
    await showTriggeredEffectToast(m.data, '【谢幕曲】召唤1个『灾变中幸存的恐龙』到己方战场上。', 260);
    await summonByNameAnimated(side, '灾变中幸存的恐龙', 1, lane, true, m.data.name);
  } else if (m.data.id === 'cmwdzvs1woa53') {
    await showTriggeredEffectToast(m.data, '【谢幕曲】将1张『金色的龙心』加入自己的手牌！', 280);
    await addCardToHandAnimated(side, '金色的龙心', 1, lane, m.data.name);
  } else if (m.data.id === 'cmwe1jmj1j5oo') {
    await showTriggeredEffectToast(m.data, '【谢幕曲】使自己的骨头+5！', 240);
    addBones(side, 5);
    renderAllBattleUI();
  } else if (m.data.id === 'cmwc9ua0fd6of') {
    await showTriggeredEffectToast(m.data, '【谢幕曲】使自己的骨头+5，并将1张『骨龙』加入手牌！', 260);
    addBones(side, 5);
    await addCardToHandAnimated(side, '骨龙', 1, lane, m.data.name);
    renderAllBattleUI();
  } else if (m.data.id === 'cmwfdqzl799uk') {
    await showTriggeredEffectToast(m.data, '【谢幕曲】将1张『蝙蝠』加入自己的手牌！', 240);
    await addCardToHandAnimated(side, '蝙蝠', 1, lane, m.data.name);
  } else if (m.data.id === 'cmwfdsjjxuhrh') {
    await showTriggeredEffectToast(m.data, '【谢幕曲】将1张『怨灵』加入自己的手牌！', 240);
    await addCardToHandAnimated(side, '怨灵', 1, lane, m.data.name);
  } else if (m.data.id === 'cmwffityz44sn') {
    await showTriggeredEffectToast(m.data, '【谢幕曲】召唤4个『骷髅』到己方战场上！', 260);
    await summonByNameAnimated(side, '骷髅', 4, lane, false, m.data.name);
  } else if (m.data.id === 'cmwfg3ouofrw4') {
    await showTriggeredEffectToast(m.data, '【谢幕曲】对己方主战者造成1点伤害，并抽取1张卡牌！', 260);
    await dealDamageToLeaderAnimated(side, 1, m);
    if (!battle.gameOver) await drawCardAnimated(side);
  } else if (m.data.id === 'cmwgczzbob0ta' || m.data.id === 'cmwgd14oa2890') {
    await showTriggeredEffectToast(m.data, '【谢幕曲】召唤1个『骷髅』到己方战场上！', 240);
    await summonByNameAnimated(side, '骷髅', 1, lane, false, m.data.name);
  } else if (m.data.id === 'cmwgdmja7m7g7') {
    await showTriggeredEffectToast(m.data, '【谢幕曲】召唤2个『骷髅』到己方战场上！', 240);
    await summonByNameAnimated(side, '骷髅', 2, lane, false, m.data.name);
  } else if (m.data.id === 'cmwgdeqcq4vyl') {
    await showTriggeredEffectToast(m.data, '【谢幕曲】召唤2个『骷髅』到己方战场上！', 260);
    await summonByNameAnimated(side, '骷髅', 2, lane, false, m.data.name);
  } else if (m.data.id === 'cmwgey13x86vt') {
    await showTriggeredEffectToast(m.data, '【谢幕曲】对双方主战者造成1点伤害！', 240);
    await dealDamageToLeaderAnimated(0, 1, m);
    if (!battle.gameOver) await dealDamageToLeaderAnimated(1, 1, m);
  } else if (m.data.id === 'cmwgg0hlxpor5') {
    await showTriggeredEffectToast(m.data, '【谢幕曲】依次发动【亡者召还_价值7】【能量2价值5】【能量2价值3】！', 280);
    await reanimateMinionAnimated(side, { value: 7 }, '', lane, false, m.data.name);
    await reanimateMinionAnimated(side, { energy: 2, value: 5 }, '', lane, false, m.data.name);
    await reanimateMinionAnimated(side, { energy: 2, value: 3 }, '', lane, false, m.data.name);
  } else if (m.data.id === 'cmwggjooddagz') {
    st.delayedLastWordsDraws = (st.delayedLastWordsDraws || 0) + 1;
    await showTriggeredEffectToast(m.data, '【谢幕曲】预约下回合开始时抽取1张具有【谢幕曲】的卡牌！', 240);
  } else if (m.data.id === 'cmwghh2r742ie') {
    await showTriggeredEffectToast(m.data, '【谢幕曲】召唤2个『蝙蝠』到己方战场上！', 240);
    await summonByNameAnimated(side, '蝙蝠', 2, lane, false, m.data.name);
  } else if (m.data.id === 'cmwgrbfvac13x') {
    await showTriggeredEffectToast(m.data, '【谢幕曲】对双方全场随从和双方主战者造成 3 点伤害！', 280);
    await playRowWideVFX(0, 'damage_wave', 200);
    await playRowWideVFX(1, 'damage_wave', 200);
    for (let l = 0; l < 5; l++) {
      if (battle.board[0][l] && battle.board[0][l].data.type === 'minion') await dealDamageToMinionAnimated(0, l, 3, m);
      if (battle.board[1][l] && battle.board[1][l].data.type === 'minion') await dealDamageToMinionAnimated(1, l, 3, m);
    }
    if (!battle.gameOver) await dealDamageToLeaderAnimated(0, 3, m);
    if (!battle.gameOver) await dealDamageToLeaderAnimated(1, 3, m);
  } else if (m.data.ast && m.data.ast.lastWords.length > 0) {
    await executeASTActionList(side, m, lane, m.data.ast.lastWords, -1, true);
  }

  for (const ex of (m.extraLastWords || [])) {
    if (ex.type === 'boom_sheep') {
      await showTriggeredEffectToast(m.data, '对敌方战场上的所有随从和敌方主战者分配2点伤害。', 280);
      await distributeDamageAnimated(opp, 2, true, m, side, lane);
    } else if (ex.type === 'rebirth_self') {
      await showTriggeredEffectToast(m.data, `召唤1个『${m.data.name}』到己方战场上。`, 280);
      await summonByNameAnimated(side, ex.cardId, 1, lane, true, '转生苹果');
    }
  }
}

async function dealDamageToMinionAnimated(targetSide, lane, amount, sourceMinion = null) {
  if (amount <= 0) return 0;
  const target = battle.board[targetSide][lane];
  if (!target || target.data.type === 'amulet') return 0;
  if (target.activeKw['屏障']) {
    delete target.activeKw['屏障'];
    await showTriggeredEffectToast(target.data, '【屏障】抵挡了本次伤害！', 200);
    addGrantedEffect(target, `来源：【${sourceMinion && sourceMinion.data ? sourceMinion.data.name : '伤害'}】 → 【屏障】已抵挡消耗`);
    spawnFloatNumber(targetSide, lane, '屏障抵挡!', '#38bdf8');
    renderAllBattleUI();
    await sleep(260);
    return 0;
  }
  sfx.play('hit');
  target.currentHp -= amount;
  spawnFloatNumber(targetSide, lane, `-${amount}`, '#fb7185');
  renderAllBattleUI();
  await sleep(260);

  if (sourceMinion && sourceMinion.activeKw['虹吸']) {
    const st = battle.leaders[sourceMinion.owner];
    st.hp = Math.min(st.maxHp, st.hp + amount);
    spawnFloatNumber(sourceMinion.owner, -1, `+${amount}`, '#4ade80');
    renderAllBattleUI();
  }
  if (target.currentHp <= 0 || (sourceMinion && sourceMinion.activeKw['毁灭'])) {
    if (sourceMinion && sourceMinion.activeKw['毁灭'] && target.currentHp > 0) {
      await showTriggeredEffectToast(sourceMinion.data, `【毁灭】消灭受到伤害的『${target.data.name}』。`, 240);
    }
    await destroyMinionAnimated(targetSide, lane);
  }
  return amount;
}

async function dealDamageToLeaderAnimated(targetSide, amount, sourceMinion = null, fromCrest = false) {
  if (amount <= 0 || battle.gameOver) return;
  sfx.play('hit');
  const st = battle.leaders[targetSide];
  st.hp -= amount;
  spawnFloatNumber(targetSide, -1, `-${amount}`, '#f43f5e');
  renderAllBattleUI();
  await sleep(260);

  if (sourceMinion && sourceMinion.activeKw['虹吸']) {
    const ast = battle.leaders[sourceMinion.owner];
    ast.hp = Math.min(ast.maxHp, ast.hp + amount);
    spawnFloatNumber(sourceMinion.owner, -1, `+${amount}`, '#4ade80');
  }
  if (st.hp <= 0) {
    battle.gameOver = true;
    sfx.play('legend');
    const vModal = document.getElementById('victoryDefeatModal');
    if (vModal) {
      document.getElementById('vicBadgeIcon').textContent = targetSide === 1 ? '🏆' : '💀';
      if (typeof clearPveBattleProgress === 'function') clearPveBattleProgress();
      document.getElementById('vicTitleTxt').textContent = targetSide === 1 ? 'VICTORY · 对战胜利' : 'DEFEAT · 对战落败';
      document.getElementById('vicTitleTxt').className = targetSide === 1 ? 'text-3xl font-black tracking-widest text-amber-300' : 'text-3xl font-black tracking-widest text-rose-400';
      document.getElementById('vicSubTxt').textContent = targetSide === 1 ? '你成功将敌方主战者生命值降至 0 点！' : '我方主战者生命值归零，可随时点击下方按钮再战一局或调整卡组。';
      vModal.classList.remove('hidden');
    }
    return;
  }
  if (!fromCrest && battle.activeSide === targetSide && st.crests && st.crests.some(cr => cr.id === 'crest_blood_mage')) {
    const cr = st.crests.find(x => x.id === 'crest_blood_mage');
    const opp = 1 - targetSide;
    await playCrestTriggerVFX(targetSide, cr.id);
    await showTriggeredEffectToast(cr.cardData, '【纹章：血法师】己方回合受伤，对敌方随从全体与主战者造成1点伤害！', 240);
    for (let el = 0; el < 5; el++) {
      if (battle.board[opp][el] && battle.board[opp][el].data.type === 'minion') {
        await dealDamageToMinionAnimated(opp, el, 1, null);
      }
    }
    if (!battle.gameOver) await dealDamageToLeaderAnimated(opp, 1, null, true);
  }
}

async function distributeDamageAnimated(targetSide, totalDmg, includeLeader = true, sourceMinion = null, sourceSide = 0, sourceLane = -1) {
  let rem = Number(totalDmg || 0);
  while (rem > 0 && !battle.gameOver) {
    const alive = [];
    for (let l = 0; l < 5; l++) {
      const m = battle.board[targetSide][l];
      if (m !== null && m.data.type === 'minion') {
        alive.push({ lane: l, inst: m });
      }
    }
    if (alive.length === 0) {
      if (includeLeader) {
        await playSynergyBeam(getLaneDOM(sourceSide, sourceLane), getLaneDOM(targetSide, -1), '#f43f5e', 240);
        await dealDamageToLeaderAnimated(targetSide, rem, sourceMinion);
      }
      break;
    }
    alive.sort((a, b) => (a.inst.enterOrder || 0) - (b.inst.enterOrder || 0));
    const first = alive[0];
    await playSynergyBeam(getLaneDOM(sourceSide, sourceLane), getLaneDOM(targetSide, first.lane), '#f97316', 220);
    if (first.inst.activeKw['屏障']) {
      await dealDamageToMinionAnimated(targetSide, first.lane, 1, sourceMinion);
      rem -= 1;
    } else {
      const neededToKill = Math.max(1, first.inst.currentHp);
      const dmgNow = Math.min(rem, neededToKill);
      await dealDamageToMinionAnimated(targetSide, first.lane, dmgNow, sourceMinion);
      rem -= dmgNow;
    }
  }
}

async function commitCardPlayWithAnimations(side, card, playEval, targetLane, sacrificeLanes = [], choiceIdx = -1, extraEnergyCost = 0, effectTargetLane = -1, swapLane = -1) {
  const _sacCount = Array.isArray(sacrificeLanes) ? sacrificeLanes.length : 0;
  const _res = await _innerCommitCardPlayWithAnimations(side, card, playEval, targetLane, sacrificeLanes, choiceIdx, extraEnergyCost, effectTargetLane, swapLane);
  if (battleMode === 'pvp_online' && side === 0 && onlineIsMyTurn()) {
    broadcastOnlineSync(battle.gameOver ? 'GAME_OVER' : 'ACTION', `使用了『${card.data.name}』`, {
      cid: card.data.id,
      cardType: card.data.type,
      lane: targetLane,
      sacCount: _sacCount
    });
  }
  return _res;
}
async function _innerCommitCardPlayWithAnimations(side, card, playEval, targetLane, sacLanes, effectTargetLane, choiceIdx, handTargetUid, effectTargetSide = -1) {
  battle.animating = true;
  showSacrificeGuideBanner('', '');
  const st = battle.leaders[side];
  const opp = 1 - side;
  const ast = card.data.ast || parseCardEffectAST(card.data);

  const hadFriendlyDragonMinionBeforePlay = battle.board[side].some((m, idx) => m && !sacLanes.includes(idx) && m.data.type === 'minion' && hasRace(m.data, '龙族'));

  let totalSacAtk = 0;
  let totalSacHp = 0;
  let totalSacValue = 0;
  const deferredSacLastWords = [];
  if (card.data.sacrifice > 0 && playEval.mode !== 'accelerate') {
    const validSacTargets = [];
    for (const sl of sacLanes) {
      const sacM = battle.board[side][sl];
      if (sacM) {
        totalSacAtk += (sacM.currentAtk || 0);
        totalSacHp += (sacM.currentHp || 0);
        totalSacValue += getCardCostValue(sacM.data);
        validSacTargets.push({ sl, sacM });
      }
    }
    if (validSacTargets.length > 0) {
      sfx.play('sacrifice');
      for (const { sl } of validSacTargets) {
        const sacCell = getLaneDOM(side, sl);
        if (sacCell) {
          playSacrificeBloodRitualSVG(sacCell);
          if (sacCell.firstElementChild) {
            sacCell.firstElementChild.classList.add('sacrifice-crimson-anim');
          }
        }
        spawnFloatNumber(side, sl, '🩸献祭', '#fb7185');
      }
      await sleep(360);
      for (const { sl, sacM } of validSacTargets) {
        battle.board[side][sl] = null;
        if (sacM.data.type === 'minion') st.graveyard.push(sacM.data);
        if (hasAnyLastWords(sacM)) st.destroyedLastWordsCount += 1;
        addBones(side, 1);
        deferredSacLastWords.push({ m: sacM, lane: sl });
      }
      renderAllBattleUI();
      await sleep(140);
    }
    if ((card.data.type === 'minion' || card.data.type === 'amulet') && battle.board[side][targetLane] !== null) {
      const freed = sacLanes.find(l => battle.board[side][l] === null);
      if (freed !== undefined) targetLane = freed;
    }
  }

  st.energy -= (playEval.costE !== undefined ? playEval.costE : getEffectiveEnergy(card, st));
  if (playEval.mode !== 'accelerate' && playEval.mode !== 'crystallize') {
    const boneCost = playEval.costB !== undefined ? playEval.costB : (card.data.bones || 0);
    st.bones -= boneCost;
  }
  if (card.data.type === 'minion' && isMechCard(card.data) && st.nextMechDiscount > 0 && (playEval.mode === 'normal' || playEval.mode === 'normal_boosted')) {
    addGrantedEffect(card, `来源：【铜壳瓢虫】 → 入场能量费用 -${st.nextMechDiscount}`);
    st.nextMechDiscount = 0;
  }

  const hIdx = st.hand.indexOf(card);
  if (hIdx !== -1) st.hand.splice(hIdx, 1);
  const effectiveMechHandCnt = st.hand.filter(h => isMechCard(h.data)).length;
  const effectiveCost7MinionCnt = st.hand.filter(h => h.data.type === 'minion' && (h.data.energy || 0) >= 7).length;

  st.cardsPlayedThisTurn += 1;
  st.playedCardsLog.push(card.data);
  const combo = st.cardsPlayedThisTurn;
  renderAllBattleUI();
  if (typeof renderBattleRecordPanel === 'function') renderBattleRecordPanel();

  if (playEval.mode === 'accelerate' && ast.accelerate) {
    await executeASTActionList(side, card, -1, ast.accelerate.actions, effectTargetLane, false);
    addBones(side, 1);
    battle.animating = false;
    renderAllBattleUI();
    return;
  }

  if (playEval.mode === 'crystallize' && ast.crystallize) {
    await executeASTActionList(side, card, targetLane, ast.crystallize.actions, effectTargetLane, false);
    battle.animating = false;
    renderAllBattleUI();
    return;
  }

  if (card.data.type === 'minion' || card.data.type === 'amulet') {
    if (battle.board[side][targetLane] !== null) targetLane = findFirstEmptyLane(side);
    if (targetLane === -1) { battle.animating = false; return; }

    await placeMinionOnBoardAnimated(side, card, targetLane);
    for (const sacItem of deferredSacLastWords) {
      if (battle.gameOver) break;
      await triggerFriendlyMinionDestroyedPassives(side, sacItem.m);
      await resolveLastWordsAnimated(side, sacItem.lane, sacItem.m);
      if (typeof checkInstantSoulSculptor === 'function') await checkInstantSoulSculptor(side);
    }
    const hasOtherFriendlyDragonNow = hadFriendlyDragonMinionBeforePlay || battle.board[side].some(m => m && m !== card && m.data.type === 'minion' && hasRace(m.data, '龙族'));

    switch (card.data.id) {
      case 'cmwbyhrbei4w8':
        await showTriggeredEffectToast(card.data, '【入场曲】召唤 1 个『增殖机甲』到己方战场上！', 260);
        await summonByNameAnimated(side, '增殖机甲', 1, targetLane, false, card.data.name);
        break;
      case 'cmwas0lke5oiw':
        if (choiceIdx === 0) {
          await showTriggeredEffectToast(card.data, '【招募_能量4】仅限「机械」，发动2次。', 300);
          await recruitMinionAnimated(side, 4, '机械', targetLane, false, card.data.name);
          await recruitMinionAnimated(side, 4, '机械', targetLane, false, card.data.name);
        } else {
          await showTriggeredEffectToast(card.data, '【亡者召还_能量4】仅限「机械」，发动2次。', 300);
          await reanimateMinionAnimated(side, 4, '机械', targetLane, false, card.data.name);
          await reanimateMinionAnimated(side, 4, '机械', targetLane, false, card.data.name);
        }
        break;
      case 'cmwbxdn7tcvde':
        if (st.hand.length > 0) {
          let tIdx = st.hand.findIndex(h => h.uid === handTargetUid);
          if (tIdx === -1) tIdx = 0;
          const retCard = st.hand[tIdx];
          const fromHandRect = getHandCardRect(side, retCard.uid);
          st.hand.splice(tIdx, 1);
          st.deck.push(retCard);
          shuffleArray(st.deck);
          renderAllBattleUI();
          await playShuffleIntoDeckAnim(side, fromHandRect, retCard.data);
          await showTriggeredEffectToast(card.data, `将『${retCard.data.name}』洗入牌库，并抽取1张卡牌。`, 260);
          await drawCardAnimated(side);
        }
        break;
      case 'cmwby8v9c918f':
        st.hand.forEach(hc => {
          if (hc.data.id === 'cmwby0dy7g2pc' || hc.data.name === '电子羊') {
            hc.extraLastWords.push({ type: 'boom_sheep', desc: '对敌方全场分配2点伤害' });
            addGrantedEffect(hc, '来源：【爆炸羊狂热者】 → 获得谢幕曲：对敌方全场分配2点伤害');
          }
        });
        await showTriggeredEffectToast(card.data, '使自己手牌中的所有『电子羊』获得【谢幕曲：分配2点伤害】。', 320);
        break;
      case 'cmwc2n4p68ewm':
        if (effectiveMechHandCnt >= 6) {
          await showTriggeredEffectToast(card.data, '召唤3个『电子羊』并使己方战场上的所有『电子羊』获得【守护】。', 320);
          await summonByNameAnimated(side, '电子羊', 3, targetLane, false, card.data.name);
          battle.board[side].forEach(m => {
            if (m && (m.data.id === 'cmwby0dy7g2pc' || m.data.name === '电子羊')) {
              m.activeKw['守护'] = 1;
              addGrantedEffect(m, '来源：【装甲堡垒】 → 获得【守护】');
            }
          });
          renderAllBattleUI();
        }
        break;
      case 'cmwc3gozg0rat':
        if (choiceIdx === 0) {
          await showTriggeredEffectToast(card.data, '使己方战场上的所有其他机械随从获得+2/+2。', 300);
          await playRowWideVFX(side, 'buff_wave', 340);
          for (let l = 0; l < 5; l++) {
            const ally = battle.board[side][l];
            if (ally && ally.data.type === 'minion' && ally !== card && isMechCard(ally.data)) {
              ally.currentAtk += 2; ally.maxHp += 2; ally.currentHp += 2;
              addGrantedEffect(ally, '来源：【超载机皇】 → 获得 +2/+2');
              spawnFloatNumber(side, l, '+2/+2', '#fde047');
            }
          }
          renderAllBattleUI();
        } else {
          const xDmg = st.hand.filter(h => isMechCard(h.data)).length;
          await showTriggeredEffectToast(card.data, `对敌方随从造成 ${xDmg} 点伤害。`, 300);
          if (xDmg > 0) {
            let hit = 0;
            for (let l = 0; l < 5; l++) {
              if (battle.board[opp][l] && battle.board[opp][l].data.type === 'minion' && hit < 3) {
                hit++;
                await playSynergyBeam(getLaneDOM(side, targetLane), getLaneDOM(opp, l), '#f43f5e', 220);
                await dealDamageToMinionAnimated(opp, l, xDmg, card);
              }
            }
          }
        }
        break;
      case 'cmwc8tup5d1xt':
        if (effectiveMechHandCnt >= 6) {
          const pool = ["守护", "飞行", "防空", "灵气", "毁灭", "虹吸", "位移", "屏障"];
          shuffleArray(pool);
          pool.slice(0, 3).forEach(k => {
            card.activeKw[k] = 1;
            addGrantedEffect(card, `来源：【磁力拼装机械】 → 获得【${k}】`);
          });
          await showTriggeredEffectToast(card.data, `随机获得【${pool.slice(0,3).join('】【')}】。`, 320);
          renderAllBattleUI();
        }
        break;
      case 'cmwdhxmybo4y2':
        if (combo >= 3) {
          card.activeKw['两侧攻击'] = 1;
          addGrantedEffect(card, '来源：【迅捷的侠盗·连击3】 → 获得【两侧攻击】');
          spawnFloatNumber(side, targetLane, '两侧攻击', '#34d399');
          await showTriggeredEffectToast(card.data, '【连击_3】获得【两侧攻击】！', 300);
          renderAllBattleUI();
        }
        break;
      case 'cmwdibvlbqmxv': {
        const fCnt = card.fusedCount || 0;
        if (choiceIdx === 0) {
          await showTriggeredEffectToast(card.data, `抽取等同于已融合张数（${fCnt}张）的卡牌。`, 300);
          for (let i = 0; i < fCnt; i++) await drawCardAnimated(side);
        } else if (choiceIdx === 1) {
          card.activeKw['守护'] = 1;
          addGrantedEffect(card, '来源：【引导胜利的指挥官】 → 获得【守护】');
          if (fCnt > 0) {
            const addAtk = 1 * fCnt, addHp = 2 * fCnt;
            card.currentAtk += addAtk;
            card.maxHp += addHp;
            card.currentHp += addHp;
            addGrantedEffect(card, `来源：【引导胜利的指挥官·融合×${fCnt}】 → 获得 +${addAtk}/+${addHp}`);
            st.hp = Math.min(st.maxHp, st.hp + fCnt);
            spawnFloatNumber(side, targetLane, `+${addAtk}/+${addHp}`, '#fde047');
            spawnFloatNumber(side, -1, `+${fCnt}`, '#4ade80');
          }
          await showTriggeredEffectToast(card.data, `获得【守护】${fCnt > 0 ? `、+${fCnt}/+${fCnt*2} 并回复主战者 ${fCnt} 点生命值` : ''}。`, 320);
          renderAllBattleUI();
        } else if (choiceIdx === 2) {
          if (fCnt >= 3) {
            card.activeKw['多重攻击'] = 2;
            card.activeKw['毁灭'] = 1;
            addGrantedEffect(card, '来源：【引导胜利的指挥官·融合≥3】 → 获得【多重攻击_2】【毁灭】');
            spawnFloatNumber(side, targetLane, '多重攻击+毁灭', '#f43f5e');
            await showTriggeredEffectToast(card.data, '融合张数≥3：获得【多重攻击_2】与【毁灭】！', 320);
          }
          renderAllBattleUI();
        }
        break;
      }
      case 'cmwdvbzosilgg':
        if (effectTargetLane >= 0 && battle.board[side][effectTargetLane] && battle.board[side][effectTargetLane].countdown !== null) {
          await playSynergyBeam(getLaneDOM(side, targetLane), getLaneDOM(side, effectTargetLane), '#38bdf8', 240);
          await showTriggeredEffectToast(card.data, `使『${battle.board[side][effectTargetLane].data.name}』的倒计时-1。`, 240);
          await reduceCardCountdown(side, effectTargetLane, 1, card, 0);
        }
        break;
      case 'cmwe1w8cztclb':
        if (effectTargetLane >= 0 && battle.board[side][effectTargetLane] && battle.board[side][effectTargetLane].countdown !== null) {
          await playSynergyBeam(getLaneDOM(side, targetLane), getLaneDOM(side, effectTargetLane), '#38bdf8', 240);
          const targetName = battle.board[side][effectTargetLane].data.name;
          const res = await reduceCardCountdown(side, effectTargetLane, 1, card, 0);
          if (res.triggeredZero) {
            await showTriggeredEffectToast(card.data, `『${targetName}』倒计时结束，触发抽1张牌！`, 260);
            await drawCardAnimated(side);
          }
        }
        break;
      case 'cmwdvop6hshsy':
        if (hasOtherFriendlyDragonNow) {
          card.currentAtk += 1; card.maxHp += 2; card.currentHp += 2;
          card.activeKw['守护'] = 1;
          addGrantedEffect(card, '来源：【龙骑士·入场曲】 → 获得 +1/+2 与【守护】');
          spawnFloatNumber(side, targetLane, '+1/+2 守护', '#4ade80');
          await showTriggeredEffectToast(card.data, '场上有龙族随从：获得 +1/+2 与【守护】！', 280);
          renderAllBattleUI();
        }
        break;
      case 'cmwdw5qt6cbqb':
        await showTriggeredEffectToast(card.data, '使己方主战者获得【纹章：无畏的飞龙骑手】(倒计时2)！', 300);
        await gainLeaderCrest(side, {
          id: 'crest_wyvern_rider',
          name: '纹章：无畏的飞龙骑手',
          countdown: 2,
          desc: '回合结束时，召唤1个『雏龙的蛋』到己方战场上。',
          cardData: card.data
        });
        break;
      case 'cmwdwpfyd4xpp':
        await showTriggeredEffectToast(card.data, '使己方战场上的所有龙族卡牌倒计时-1！', 280);
        for (let l = 0; l < 5; l++) {
          const ally = battle.board[side][l];
          if (ally && hasRace(ally.data, '龙族') && ally.countdown !== null) {
            await reduceCardCountdown(side, l, 1, card, 0);
          }
        }
        break;
      case 'cmwdwtfm8xm5c':
        if (hasOtherFriendlyDragonNow) {
          const oldMax = st.maxEnergy;
          st.maxEnergy = Math.min(RULES.energyMax, st.maxEnergy + 1);
          spawnFloatNumber(side, -1, `最大能量+1 (${st.maxEnergy})`, '#34d399');
          await showTriggeredEffectToast(card.data, `己方场上有龙族随从：最大能量值 +1（${oldMax} → ${st.maxEnergy}）！`, 280);
          renderAllBattleUI();
        }
        if (playEval.mode === 'enhance') {
          const xDragon = st.hand.filter(h => hasRace(h.data, '龙族')).length;
          await showTriggeredEffectToast(card.data, `【爆能强化_8】手牌中有 ${xDragon} 张龙族卡牌，对敌方全体随从造成 ${xDragon} 点伤害！`, 320);
          if (xDragon > 0) {
            await playRowWideVFX(opp, 'fire_aoe', 380);
            for (let l = 0; l < 5; l++) {
              if (battle.board[opp][l] && battle.board[opp][l].data.type === 'minion') {
                await dealDamageToMinionAnimated(opp, l, xDragon, card);
              }
            }
          }
        }
        break;
      case 'cmwdx7vx7izcu':
        if (effectTargetLane >= 0 && battle.board[side][effectTargetLane] && battle.board[side][effectTargetLane].data.type === 'minion') {
          const ally = battle.board[side][effectTargetLane];
          await playSynergyBeam(getLaneDOM(side, targetLane), getLaneDOM(side, effectTargetLane), '#fbbf24', 260);
          ally.currentAtk += 2; ally.maxHp += 2; ally.currentHp += 2;
          addGrantedEffect(ally, '来源：【龙鳞锻造师】 → 获得 +2/+2');
          spawnFloatNumber(side, effectTargetLane, '+2/+2', '#4ade80');
          await showTriggeredEffectToast(card.data, `使『${ally.data.name}』获得 +2/+2！`, 260);
          renderAllBattleUI();
        }
        break;
      case 'cmwdxt4vgtk9g': {
        card.activeKw['多重攻击'] = 2;
        addGrantedEffect(card, '来源：【八岐大蛇·入场曲】 → 获得【多重攻击_2】');
        spawnFloatNumber(side, targetLane, '多重攻击_2', '#fde047');
        renderAllBattleUI();
        const packs = [
          { kws: [['守护', 1], ['防空', 1], ['屏障', 1]], label: '【守护】【防空】【屏障】' },
          { kws: [['毁灭', 1], ['灵气', 1], ['荆棘', 5]], label: '【毁灭】【灵气】【荆棘_5】' },
          { kws: [['虹吸', 1]], label: '【虹吸】' },
          { kws: [['两侧攻击', 1]], label: '【两侧攻击】' }
        ];
        let cloneIdx = 0;
        while (st.bones >= 10 && findNextSummonLane(side, targetLane, false) !== -1 && cloneIdx < 4) {
          st.bones -= 10;
          const summoned = await summonByNameAnimated(side, '八岐大蛇', 1, targetLane, false, '八岐大蛇·骨海分身');
          if (summoned.length > 0) {
            const clone = summoned[0].inst;
            const pack = packs[cloneIdx % packs.length];
            pack.kws.forEach(([k, v]) => { clone.activeKw[k] = v; });
            addGrantedEffect(clone, `来源：【八岐大蛇·第${cloneIdx + 1}分身】 → 获得 ${pack.label}`);
            await showTriggeredEffectToast(card.data, `消耗10点骨头召唤『八岐大蛇』，获得 ${pack.label}！`, 260);
            renderAllBattleUI();
          }
          cloneIdx++;
        }
        break;
      }
      case 'cmwdyxl33lchi':
        if (effectiveCost7MinionCnt >= 3) {
          st.hand.forEach(hc => {
            if (hc.data.type === 'minion') {
              hc.currentAtk += 2;
              hc.maxHp += 2;
              hc.currentHp += 2;
              addGrantedEffect(hc, '来源：【满腔热血的霸者】 → 手牌中获得 +2/+2');
            }
          });
          await showTriggeredEffectToast(card.data, '手牌中7费以上随从≥3张：使手牌中所有随从获得 +2/+2！', 340);
          renderAllBattleUI();
        }
        break;
      case 'cmwdz3reuida0': {
        if (choiceIdx === 0) {
          await showTriggeredEffectToast(card.data, '召唤4个『雏龙的蛋』并使所有『雏龙的蛋』获得【屏障】！', 320);
          await summonByNameAnimated(side, '雏龙的蛋', 4, targetLane, false, card.data.name);
          for (let l = 0; l < 5; l++) {
            const m = battle.board[side][l];
            if (m && m.data.name === '雏龙的蛋') {
              m.activeKw['屏障'] = 1;
              addGrantedEffect(m, '来源：【孵化万物的龙女】 → 获得【屏障】');
            }
          }
          renderAllBattleUI();
        } else if (choiceIdx === 1) {
          await showTriggeredEffectToast(card.data, '使己方战场上所有卡牌的倒计时-1，随后使所有己方随从获得+1/+2！', 320);
          for (let l = 0; l < 5; l++) {
            if (battle.board[side][l] && battle.board[side][l].countdown !== null) {
              await reduceCardCountdown(side, l, 1, card, 0);
            }
          }
          await playRowWideVFX(side, 'buff_wave', 320);
          for (let l = 0; l < 5; l++) {
            const m = battle.board[side][l];
            if (m && m.data.type === 'minion') {
              m.currentAtk += 1; m.maxHp += 2; m.currentHp += 2;
              addGrantedEffect(m, '来源：【孵化万物的龙女】 → 获得 +1/+2');
              spawnFloatNumber(side, l, '+1/+2', '#4ade80');
            }
          }
          renderAllBattleUI();
        } else if (choiceIdx === 2) {
          const deadCdMinions = st.graveyard
            .filter(cd => cd.type === 'minion' && getInitialCountdown(cd) > 0)
            .sort((a, b) => (b.atk - a.atk) || ((b.energy + b.bones) - (a.energy + a.bones)));
          if (deadCdMinions.length > 0) {
            const bestDead = deadCdMinions[0];
            await showTriggeredEffectToast(card.data, `召唤本局被破坏的最高攻倒计时随从『${bestDead.name}』并使其倒计时-2！`, 320);
            const summoned = await summonByNameAnimated(side, bestDead.id, 1, targetLane, false, card.data.name);
            if (summoned.length > 0) {
              const sLane = summoned[0].lane;
              if (battle.board[side][sLane] && battle.board[side][sLane].countdown !== null) {
                await reduceCardCountdown(side, sLane, 2, card, 0);
              }
            }
          } else {
            await showTriggeredEffectToast(card.data, '本局对战尚无被破坏的具有倒计时的随从。', 260);
          }
        }
        break;
      }
      case 'cmwdzshgc6r55':
        if (hasOtherFriendlyDragonNow) {
          await showTriggeredEffectToast(card.data, '己方场上有龙族随从：抽取2张卡牌！', 280);
          await drawCardAnimated(side);
          await drawCardAnimated(side);
        }
        break;
      case 'cmwe0jardzhku': {
        const emptyCount = battle.board[side].filter(x => x === null).length;
        if (emptyCount > 0) {
          await showTriggeredEffectToast(card.data, `召唤 ${emptyCount} 个『雏龙』填满己方战场！`, 300);
          await summonByNameAnimated(side, '雏龙', emptyCount, targetLane, false, card.data.name);
        }
        break;
      }
      case 'cmwe0tjwqf5lp':
        await showTriggeredEffectToast(card.data, '【入场曲】召唤2个『骷髅』到己方战场上。', 280);
        await summonByNameAnimated(side, '骷髅', 2, targetLane, false, card.data.name);
        break;
      case 'cmwe19fflg0v1':
        if (playEval.mode === 'enhance') {
          await showTriggeredEffectToast(card.data, '【爆能强化_骨头8】额外召唤1个『堕天使』到己方战场上！', 300);
          await summonByNameAnimated(side, '堕天使', 1, targetLane, false, '堕天使·爆能强化');
        }
        break;
      case 'cmwe1tj7fh3ot':
        await showTriggeredEffectToast(card.data, '【入场曲】召唤1个『雏龙』到己方战场上。', 260);
        await summonByNameAnimated(side, '雏龙', 1, targetLane, false, card.data.name);
        break;
      case 'cmwfdhecfc856': // 龙蛋收藏家：将1张『雏龙的蛋』加入手牌
        await showTriggeredEffectToast(card.data, '【入场曲】将1张『雏龙的蛋』加入自己的手牌！', 280);
        await addCardToHandAnimated(side, '雏龙的蛋', 1, targetLane, card.data.name);
        break;
      case 'cmwfd8opa9wwf': // 屠龙勇士
      case 'cmwffsync2y12': // 死神代行人
        if (effectTargetLane >= 0 && battle.board[opp][effectTargetLane]) {
          const tName = battle.board[opp][effectTargetLane].data.name;
          await showTriggeredEffectToast(card.data, `【入场曲】破坏敌方随从『${tName}』！`, 260);
          await destroyMinionAnimated(opp, effectTargetLane, card.data.name);
        }
        break;
      case 'cmwfdugclc9w9': { // 南瓜捣蛋鬼
        const hasLw = battle.board[side].some(m => m && m !== card && hasAnyLastWords(m));
        if (hasLw) {
          await showTriggeredEffectToast(card.data, '【入场曲】己方场上有谢幕曲随从，召唤1个『怨灵』！', 260);
          await summonByNameAnimated(side, '怨灵', 1, targetLane, false, card.data.name);
        }
        break;
      }
      case 'cmwgb6nzkjlc7':
        await showTriggeredEffectToast(card.data, '【入场曲】召唤2个『刺盾少女』！', 260);
        await summonByNameAnimated(side, '刺盾少女', 2, targetLane, false, card.data.name);
        break;
      case 'cmwgbegxlrn2s':
        await showTriggeredEffectToast(card.data, '【入场曲】使战场上所有具有倒计时的卡牌倒计时+1！', 260);
        for (const s of [0, 1]) {
          for (let l = 0; l < 5; l++) {
            const bm = battle.board[s][l];
            if (bm && bm.countdown !== null && bm.countdown !== undefined) {
              bm.countdown += 1;
              spawnFloatNumber(s, l, '⏳+1', '#38bdf8');
            }
          }
        }
        renderAllBattleUI();
        break;
      case 'cmwgbhvec35kr':
        await showTriggeredEffectToast(card.data, '获得【纹章：痛恨快攻卡组的玩家】(倒计时2)！', 280);
        await grantLeaderCrest(side, {
          id: 'crest_anti_aggro',
          name: '纹章：痛恨快攻卡组的玩家',
          countdown: 2,
          desc: '敌方飞行随从攻击己方主战者时，使其攻击力-2。',
          cardData: card.data
        });
        break;
      case 'cmwgbo051ibcq': {
        const oppCards = [0,1,2,3,4].filter(l => battle.board[opp][l] !== null);
        if (oppCards.length >= 5) {
          const oppMinions = oppCards.filter(l => battle.board[opp][l].data.type === 'minion');
          if (oppMinions.length > 0) {
            const rl = oppMinions[Math.floor(Math.random() * oppMinions.length)];
            await showTriggeredEffectToast(card.data, `敌方场上已有5张卡牌，随机破坏『${battle.board[opp][rl].data.name}』！`, 260);
            await destroyMinionAnimated(opp, rl);
          }
        }
        break;
      }
      case 'cmwgc5ey3970v': {
        const bAmt = st.bones || 0;
        if (bAmt > 0) {
          st.bones = 0;
          st.hp = Math.min(st.maxHp, st.hp + bAmt);
          spawnFloatNumber(side, -1, `+${bAmt}`, '#4ade80');
          await showTriggeredEffectToast(card.data, `消耗全部 ${bAmt} 根骨头，为己方主战者回复 ${bAmt} 点生命值！`, 280);
          renderAllBattleUI();
        }
        break;
      }
      case 'cmwgccmsj2ypl':
      case 'cmwgchn8wmoi5':
        await showTriggeredEffectToast(card.data, '【入场曲】召唤1个『怨灵』到己方战场上！', 240);
        await summonByNameAnimated(side, '怨灵', 1, targetLane, false, card.data.name);
        break;
      case 'cmwgczzbob0ta':
        await showTriggeredEffectToast(card.data, '【入场曲】召唤1个『骷髅』到己方战场上！', 240);
        await summonByNameAnimated(side, '骷髅', 1, targetLane, false, card.data.name);
        break;
      case 'cmwgd56lg867w':
        await showTriggeredEffectToast(card.data, '获得【纹章：血法师】(倒计时4)！', 280);
        await grantLeaderCrest(side, {
          id: 'crest_blood_mage',
          name: '纹章：血法师',
          countdown: 4,
          desc: '己方主战者在自己回合受到伤害时，对敌方随从全体和敌方主战者造成1点伤害。',
          cardData: card.data
        });
        break;
      case 'cmwgdalzmzj83':
        await showTriggeredEffectToast(card.data, '获得【纹章：残暴的尸兽】(永久)！', 280);
        await grantLeaderCrest(side, {
          id: 'crest_brutal_beast',
          name: '纹章：残暴的尸兽',
          countdown: null,
          desc: '回合开始时，对己方主战者造成1点伤害，抽1张牌。',
          cardData: card.data
        });
        break;
      case 'cmwgdeqcq4vyl':
        await showTriggeredEffectToast(card.data, '【入场曲】召唤『持盾的骷髅士兵』『尸兵』『骷髅』各1个！', 280);
        await summonByNameAnimated(side, '持盾的骷髅士兵', 1, targetLane, false, card.data.name);
        await summonByNameAnimated(side, '尸兵', 1, targetLane, false, card.data.name);
        await summonByNameAnimated(side, '骷髅', 1, targetLane, false, card.data.name);
        break;
      case 'cmwglnat1hzy3':
      case 'cmwroushanmo1':
        if (totalSacAtk > 0 || totalSacHp > 0) {
          card.currentAtk += totalSacAtk;
          card.currentHp += totalSacHp;
          card.maxHp += totalSacHp;
          addGrantedEffect(card, `来源：【肉山魔】 → 吸收祭品获得 +${totalSacAtk}/+${totalSacHp}`);
          spawnFloatNumber(side, targetLane, `+${totalSacAtk}/+${totalSacHp}`, '#f43f5e');
          await showTriggeredEffectToast(card.data, `【入场曲】吸收祭品之力，获得 +${totalSacAtk}/+${totalSacHp}！`, 260);
          renderAllBattleUI();
        }
        break;
      case 'cmwgqgw3e4h7s':
        await showTriggeredEffectToast(card.data, '【入场曲】抽取 2 张卡牌！', 240);
        await drawCardAnimated(side);
        await drawCardAnimated(side);
        break;
      case 'cmwgqkrt4rcui':
        await showTriggeredEffectToast(card.data, `【入场曲】变身为价值 ${formatCardValueText(totalSacValue)} 的随机随从！`, 260);
        await transformMinionToTargetValueAnimated(side, targetLane, totalSacValue, card.data.name);
        break;
      case 'cmwgqqxyzitkn':
        await showTriggeredEffectToast(card.data, '【入场曲】对敌方所有随从造成 3 点伤害！', 260);
        await playRowWideVFX(opp, 'damage_wave', 220);
        for (let l = 0; l < 5; l++) {
          if (battle.board[opp][l] && battle.board[opp][l].data.type === 'minion') {
            await dealDamageToMinionAnimated(opp, l, 3, card);
          }
        }
        break;
      case 'cmwgr7z9krj92':
        await showTriggeredEffectToast(card.data, '【入场曲】对自己主战者造成 1 点伤害！', 220);
        await dealDamageToLeaderAnimated(side, 1, card);
        break;
      case 'cmwgrgw6jyd8p':
        await showTriggeredEffectToast(card.data, '【入场曲】【亡者召还_价值3】', 260);
        await reanimateMinionAnimated(side, { value: 3 }, '', targetLane, false, card.data.name);
        break;
      case 'cmwgrn65g40ql':
        if (choiceIdx === 0) {
          await showTriggeredEffectToast(card.data, '【入场曲】破坏敌方全体随从！', 300);
          await playRowWideVFX(opp, 'destroy_wave', 260);
          const oppTargets = [];
          for (let l = 0; l < 5; l++) {
            if (battle.board[opp][l] && battle.board[opp][l].data.type === 'minion') {
              oppTargets.push({ side: opp, lane: l });
            }
          }
          await destroyMultipleMinionsSimultaneously(oppTargets);
        } else if (choiceIdx === 1) {
          await showTriggeredEffectToast(card.data, '【入场曲】回复自己主战者生命值 10 点！', 280);
          st.hp = Math.min(st.maxHp, st.hp + 10);
          spawnFloatNumber(side, -1, '+10', '#4ade80');
          renderAllBattleUI();
        } else {
          await showTriggeredEffectToast(card.data, '【入场曲】【亡者召还_价值5】×3！', 300);
          for (let k = 0; k < 3; k++) {
            if (battle.gameOver) break;
            await reanimateMinionAnimated(side, { value: 5 }, '', targetLane, false, card.data.name);
          }
        }
        break;
      case 'cmwgru11nfnj0':
        if (choiceIdx === 0) {
          const dmgX = Math.max(0, Math.round(totalSacValue));
          await showTriggeredEffectToast(card.data, `【入场曲】对敌方随从和主战者分配 ${dmgX} 点伤害！`, 280);
          if (dmgX > 0) await distributeDamageAnimated(opp, dmgX, true, card, side, targetLane);
        } else if (choiceIdx === 1) {
          const dmgHalf = Math.max(0, Math.floor(totalSacValue / 2));
          await showTriggeredEffectToast(card.data, `【入场曲】对除自己外的全场随从和双方主战者造成 ${dmgHalf} 点伤害！`, 300);
          if (dmgHalf > 0) {
            await playRowWideVFX(opp, 'damage_wave', 200);
            await playRowWideVFX(side, 'damage_wave', 200);
            for (let l = 0; l < 5; l++) {
              if (battle.board[opp][l] && battle.board[opp][l].data.type === 'minion') {
                await dealDamageToMinionAnimated(opp, l, dmgHalf, card);
              }
              if (battle.board[side][l] && battle.board[side][l] !== card && battle.board[side][l].data.type === 'minion') {
                await dealDamageToMinionAnimated(side, l, dmgHalf, card);
              }
            }
            if (!battle.gameOver) await dealDamageToLeaderAnimated(opp, dmgHalf, card);
            if (!battle.gameOver) await dealDamageToLeaderAnimated(side, dmgHalf, card);
          }
        } else {
          const transVal = totalSacValue + 10;
          await showTriggeredEffectToast(card.data, `【入场曲】变身为价值 ${formatCardValueText(transVal)} 的随机随从！`, 280);
          await transformMinionToTargetValueAnimated(side, targetLane, transVal, card.data.name);
        }
        break;
      case 'cmwgeg2eggz9t':
        await showTriggeredEffectToast(card.data, '获得【纹章：骸骨恋人】并连续发动3次【亡者召还_价值2】！', 280);
        await grantLeaderCrest(side, {
          id: 'crest_skeleton_lovers',
          name: '纹章：骸骨恋人',
          countdown: null,
          desc: '回合结束时，破坏己方战场上1个具有谢幕曲的随从，随机破坏敌方战场上的1个随从。',
          cardData: card.data
        });
        for (let k = 0; k < 3; k++) await reanimateMinionAnimated(side, { value: 2 }, '', targetLane, false, card.data.name);
        break;
      case 'cmwget8v364ar': {
        const lostHp = Math.max(0, (st.maxHp || 30) - st.hp);
        const tiers = [3, 9, 15, 21, 27].filter(t => lostHp >= t).length;
        if (tiers > 0) {
          card.currentAtk += tiers; card.currentHp += tiers; card.maxHp += tiers;
          addGrantedEffect(card, `来源：【大剑少女】 → 损血达标获得 +${tiers}/+${tiers}`);
          spawnFloatNumber(side, targetLane, `+${tiers}/+${tiers}`, '#fbbf24');
          await showTriggeredEffectToast(card.data, `主战者已损失 ${lostHp} 点生命，获得 +${tiers}/+${tiers}！`, 260);
          renderAllBattleUI();
        }
        break;
      }
      case 'cmwgey13x86vt':
        await showTriggeredEffectToast(card.data, '【入场曲】对双方主战者造成1点伤害！', 220);
        await dealDamageToLeaderAnimated(0, 1, card);
        if (!battle.gameOver) await dealDamageToLeaderAnimated(1, 1, card);
        break;
      case 'cmwgf14i2fvra':
        await showTriggeredEffectToast(card.data, '【入场曲】发动【亡者召还_能量2】！', 240);
        await reanimateMinionAnimated(side, 2, '', targetLane, false, card.data.name);
        break;
      case 'cmwgf4861j5tn':
        await showTriggeredEffectToast(card.data, '【入场曲】发动【亡者召还_价值12】！', 260);
        await reanimateMinionAnimated(side, { value: 12 }, '', targetLane, false, card.data.name);
        break;
      case 'cmwgftipxm3ux': {
        const tSide = (effectTargetSide === 0 || effectTargetSide === 1) ? effectTargetSide : (battle.board[opp][effectTargetLane] ? opp : side);
        const refM = effectTargetLane >= 0 ? battle.board[tSide][effectTargetLane] : null;
        if (refM) {
          const refVal = getCardCostValue(refM.data);
          await showTriggeredEffectToast(card.data, `破坏所有价值小于『${refM.data.name}』(${formatCardValueText(refVal)})的随从！`, 280);
          for (const s of [0, 1]) {
            for (let l = 0; l < 5; l++) {
              const bm = battle.board[s][l];
              if (bm && bm.data.type === 'minion' && getCardCostValue(bm.data) < refVal) {
                await destroyMinionAnimated(s, l);
              }
            }
          }
        }
        break;
      }
      case 'cmwgga8jc3z4g': {
        if (st.deck.length > 0) {
          let bestIdx = 0;
          let bestVal = -1;
          st.deck.forEach((dc, idx) => {
            const v = getCardCostValue(dc.data);
            if (v > bestVal) { bestVal = v; bestIdx = idx; }
          });
          const [picked] = st.deck.splice(bestIdx, 1);
          if (st.hand.length < (st.handLimit || RULES.handLimit)) {
            st.hand.push(picked);
            await showTriggeredEffectToast(card.data, `将牌库中价值最高(${formatCardValueText(bestVal)})的『${picked.data.name}』置入手牌！`, 260);
            renderAllBattleUI();
          }
        }
        break;
      }
      case 'cmwgggf7icriv':
        await showTriggeredEffectToast(card.data, '使己方所有其他随从变身为价值+1的随机卡牌！', 280);
        for (let l = 0; l < 5; l++) {
          const bm = battle.board[side][l];
          if (bm && bm !== card && bm.data.type === 'minion') {
            await transformMinionToValuePlus1Animated(side, l, card.data.name);
          }
        }
        break;
      case 'cmwggt486xgpb':
        if (combo >= 3) {
          await showTriggeredEffectToast(card.data, '【连击_3】抽取1张卡牌！', 240);
          await drawCardAnimated(side);
        }
        break;
      case 'cmwghmf9xj9dv':
        await showTriggeredEffectToast(card.data, '【入场曲】依次发动【亡者召还_价值3】【亡者召还_价值2】【亡者召还_价值1】！', 280);
        await reanimateMinionAnimated(side, { value: 3 }, '', targetLane, false, card.data.name);
        await reanimateMinionAnimated(side, { value: 2 }, '', targetLane, false, card.data.name);
        await reanimateMinionAnimated(side, { value: 1 }, '', targetLane, false, card.data.name);
        break;
      case 'cmwfg76dbmxry': { // 咆哮的狼人
        st.werewolfPlayedCount = (st.werewolfPlayedCount || 0) + 1;
        const wx = st.werewolfPlayedCount;
        await showTriggeredEffectToast(card.data, `【入场曲】对双方主战者各造成 ${wx} 点伤害！`, 280);
        await dealDamageToLeaderAnimated(opp, wx, card);
        await dealDamageToLeaderAnimated(side, wx, card);
        break;
      }
      case 'cmwfhe6xv5el7': // 冥河引渡人
        await showTriggeredEffectToast(card.data, '【入场曲】【亡者召还_价值2】', 260);
        await reanimateMinionAnimated(side, { value: 2 }, '', typeof targetLane !== 'undefined' ? targetLane : (typeof lane !== 'undefined' ? lane : -1), false, (typeof card !== 'undefined' && card.data ? card.data.name : (typeof c !== 'undefined' ? c.name : '冥河引渡人')));
        break;
      default:
        if (playEval.mode === 'enhance' && ast.enhance && ast.enhance.actions.length > 0) {
          await executeASTActionList(side, card, targetLane, ast.enhance.actions, effectTargetLane, false);
        } else if (ast.combo && combo >= ast.combo.count && ast.combo.actions.length > 0) {
          await executeASTActionList(side, card, targetLane, ast.combo.actions, effectTargetLane, false);
        } else if (ast.fanfare.length > 0) {
          await executeASTActionList(side, card, targetLane, ast.fanfare, effectTargetLane, false);
        }
        break;
    }
  } else if (card.data.type === 'spell') {
    if (card.data.id === 'cmwcaqbzuvvcx') {
      if (effectTargetLane >= 0 && battle.board[side][effectTargetLane]) {
        const ally = battle.board[side][effectTargetLane];
        await showTriggeredEffectToast(card.data, `使『${ally.data.name}』获得谢幕曲【召唤1个同名随从】。`, 300);
        await playSynergyBeam(getLaneDOM(side, -1), getLaneDOM(side, effectTargetLane), '#4ade80', 260);
        ally.extraLastWords.push({ type: 'rebirth_self', cardId: ally.data.id, desc: `召唤1个『${ally.data.name}』` });
        addGrantedEffect(ally, `来源：【转生苹果】 → 获得谢幕曲：召唤1个『${ally.data.name}』`);
        spawnFloatNumber(side, effectTargetLane, '+转生谢幕', '#4ade80');
      }
    } else if (card.data.id === 'cmwdi4pwz3c0k') {
      await showTriggeredEffectToast(card.data, '抽取 2 张机械卡牌。', 280);
      for (let i = 0; i < 2; i++) {
        const rIdx = st.deck.findIndex(c => isMechCard(c.data));
        if (rIdx !== -1) {
          const [rc] = st.deck.splice(rIdx, 1);
          addGrantedEffect(rc, '来源：【废物利用】 → 检索抽上手牌');
          if (st.hand.length < (st.handLimit || RULES.handLimit)) {
            hiddenCardUids.add(rc.uid);
            st.hand.push(rc);
            renderAllBattleUI();
            const deckEl = document.getElementById(side === 0 ? 'playerDeckStackEl' : 'enemyDeckStackEl');
            await animateCardTrajectory({
              fromRect: deckEl ? deckEl.getBoundingClientRect() : null,
              toRect: getHandCardRect(side, rc.uid),
              cardData: rc.data, showFront: side === 0, duration: 360, arcHeight: -45, startScale: 0.52, endScale: side === 0 ? 1.0 : 0.45
            });
            hiddenCardUids.delete(rc.uid);
            renderAllBattleUI();
          }
        }
      }
      if ((card.fusedCount || 0) > 0) {
        await showTriggeredEffectToast(card.data, '已【融合】：额外召唤 2 个『电子羊』到己方战场上！', 300);
        await summonByNameAnimated(side, '电子羊', 2, -1, false, card.data.name);
      }
    } else if (card.data.id === 'cmwdvhcrr8g9v') {
      if (effectTargetLane >= 0 && battle.board[side][effectTargetLane] && battle.board[side][effectTargetLane].countdown !== null) {
        await playSynergyBeam(getLaneDOM(side, -1), getLaneDOM(side, effectTargetLane), '#38bdf8', 240);
        await showTriggeredEffectToast(card.data, `使『${battle.board[side][effectTargetLane].data.name}』倒计时-1，并抽取1张卡牌。`, 260);
        await reduceCardCountdown(side, effectTargetLane, 1, card, 0);
      }
      await drawCardAnimated(side);
    } else if (card.data.id === 'cmwdvmwjm0301') {
      await showTriggeredEffectToast(card.data, '召唤2个『雏龙的蛋』到己方战场上。', 280);
      await summonByNameAnimated(side, '雏龙的蛋', 2, -1, false, card.data.name);
    } else if (card.data.id === 'cmwdw1gnfmjtt') {
      const tSide = (effectTargetSide === 0 || effectTargetSide === 1) ? effectTargetSide : (battle.board[opp][effectTargetLane] ? opp : side);
      const targetM = effectTargetLane >= 0 ? battle.board[tSide][effectTargetLane] : null;
      if (targetM && targetM.data.type === 'minion') {
        await playSynergyBeam(getLaneDOM(side, -1), getLaneDOM(tSide, effectTargetLane), '#f43f5e', 260);
        targetM.currentAtk += 2;
        targetM.maxHp -= 2;
        targetM.currentHp -= 2;
        addGrantedEffect(targetM, '来源：【鞭策】 → 获得 +2/-2 (生命上限-2)');
        spawnFloatNumber(tSide, effectTargetLane, '+2/-2', '#fb7185');
        await showTriggeredEffectToast(card.data, `使『${targetM.data.name}』获得 +2/-2！`, 260);
        renderAllBattleUI();
        if (targetM.currentHp <= 0) {
          await destroyMinionAnimated(tSide, effectTargetLane, false);
        }
      }
    } else if (card.data.id === 'cmwe071ws115o') {
      if (choiceIdx === 0) {
        await showTriggeredEffectToast(card.data, '使己方战场上所有卡牌的倒计时-1，重复2次！', 300);
        for (let pass = 0; pass < 2; pass++) {
          for (let l = 0; l < 5; l++) {
            if (battle.board[side][l] && battle.board[side][l].countdown !== null) {
              await reduceCardCountdown(side, l, 1, card, 0);
            }
          }
        }
      } else if (choiceIdx === 1) {
        if (effectTargetLane >= 0 && battle.board[side][effectTargetLane] && battle.board[side][effectTargetLane].countdown !== null) {
          await playSynergyBeam(getLaneDOM(side, -1), getLaneDOM(side, effectTargetLane), '#fde047', 260);
          await showTriggeredEffectToast(card.data, `使『${battle.board[side][effectTargetLane].data.name}』倒计时-3，并抽取2张卡牌！`, 280);
          await reduceCardCountdown(side, effectTargetLane, 3, card, 0);
        }
        await drawCardAnimated(side);
        await drawCardAnimated(side);
      } else if (choiceIdx === 2) {
        await showTriggeredEffectToast(card.data, '抽取3张卡牌，并回复己方主战者6点生命值！', 300);
        for (let i = 0; i < 3; i++) await drawCardAnimated(side);
        st.hp = Math.min(st.maxHp, st.hp + 6);
        spawnFloatNumber(side, -1, '+6', '#4ade80');
        renderAllBattleUI();
      }
    } else if (card.data.id === 'cmwe0hk86d0a2') {
      await showTriggeredEffectToast(card.data, '【大灾变】破坏双方战场上的所有随从！', 320);
      await playRowWideVFX(opp, 'destroy_wave', 260);
      await playRowWideVFX(side, 'destroy_wave', 260);
      const targets = [];
      for (let l = 0; l < 5; l++) {
        if (battle.board[opp][l] && battle.board[opp][l].data.type === 'minion') targets.push({ side: opp, lane: l });
        if (battle.board[side][l] && battle.board[side][l].data.type === 'minion') targets.push({ side: side, lane: l });
      }
      await destroyMultipleMinionsSimultaneously(targets);
    } else if (card.data.id === 'cmwe17fnvt7x0') {
      const tSide = (effectTargetSide === 0 || effectTargetSide === 1) ? effectTargetSide : (battle.board[opp][effectTargetLane] ? opp : side);
      if (effectTargetLane >= 0 && battle.board[tSide][effectTargetLane]) {
        await playSynergyBeam(getLaneDOM(side, -1), getLaneDOM(tSide, effectTargetLane), '#c084fc', 260);
        await transformBoardCardAnimated(tSide, effectTargetLane, '堕天使', card.data.name, 0);
      }
    } else if (card.data.id === 'cmwgbg6hku29o') {
      await showTriggeredEffectToast(card.data, '对敌我全体随从与双方主战者造成3点伤害！', 280);
      for (const s of [0, 1]) {
        for (let l = 0; l < 5; l++) {
          if (battle.board[s][l] && battle.board[s][l].data.type === 'minion') {
            await dealDamageToMinionAnimated(s, l, 3, card);
          }
        }
        if (!battle.gameOver) await dealDamageToLeaderAnimated(s, 3, card);
      }
    } else if (card.data.id === 'cmwggewsi6c9n') {
      const tSide = (effectTargetSide === 0 || effectTargetSide === 1) ? effectTargetSide : (battle.board[opp][effectTargetLane] ? opp : side);
      if (effectTargetLane >= 0 && battle.board[tSide][effectTargetLane]) {
        await showTriggeredEffectToast(card.data, `使『${battle.board[tSide][effectTargetLane].data.name}』变身为价值+1的随机随从！`, 260);
        await transformMinionToValuePlus1Animated(tSide, effectTargetLane, card.data.name);
      }
    } else if (card.data.id === 'cmwggx4ykcgy1') {
      if (playEval.mode === 'enhance') {
        const pool = allCards.filter(c => c.type === 'minion' && hasRace(c, '亡灵') && getCardCostValue(c) <= 3);
        await showTriggeredEffectToast(card.data, '【爆能强化_能量6】随机召唤3个价值3以下的亡灵随从！', 280);
        for (let k = 0; k < 3 && pool.length > 0; k++) {
          const pick = pool[Math.floor(Math.random() * pool.length)];
          await summonByNameAnimated(side, pick.id, 1, -1, false, card.data.name);
        }
      } else {
        await showTriggeredEffectToast(card.data, '召唤3个『怨灵』到己方战场上！', 260);
        await summonByNameAnimated(side, '怨灵', 3, -1, false, card.data.name);
      }
    } else if (card.data.id === 'cmwgh0uggjyno') {
      const undeadCnt = st.hand.filter(h => hasRace(h.data, '亡灵')).length;
      if (effectTargetLane >= 0 && battle.board[opp][effectTargetLane]) {
        await showTriggeredEffectToast(card.data, `手牌共有 ${undeadCnt} 张亡灵卡：对目标造成 ${undeadCnt} 点伤害并召唤 ${undeadCnt} 个『骷髅』！`, 280);
        await dealDamageToMinionAnimated(opp, effectTargetLane, undeadCnt, card);
      }
      if (undeadCnt > 0) await summonByNameAnimated(side, '骷髅', undeadCnt, -1, false, card.data.name);
    } else if (card.data.id === 'cmwgh9izhopu9') {
      await showTriggeredEffectToast(card.data, '召唤1个『怨灵』、1个『骷髅』、1个『尸兵』！', 280);
      await summonByNameAnimated(side, '怨灵', 1, -1, false, card.data.name);
      await summonByNameAnimated(side, '骷髅', 1, -1, false, card.data.name);
      await summonByNameAnimated(side, '尸兵', 1, -1, false, card.data.name);
    } else if (card.data.id === 'cmwghctx4ixrj') {
      await showTriggeredEffectToast(card.data, '将1张『怨灵』、1张『骷髅』、1张『尸兵』置入手牌！', 260);
      await addCardToHandAnimated(side, '怨灵', 1, -1, card.data.name);
      await addCardToHandAnimated(side, '骷髅', 1, -1, card.data.name);
      await addCardToHandAnimated(side, '尸兵', 1, -1, card.data.name);
    } else if (playEval.mode === 'enhance' && ast.enhance && ast.enhance.actions.length > 0) {
      await executeASTActionList(side, card, -1, ast.enhance.actions, effectTargetLane, false);
    } else if (ast.combo && combo >= ast.combo.count && ast.combo.actions.length > 0) {
      await executeASTActionList(side, card, -1, ast.combo.actions, effectTargetLane, false);
    } else {
      await executeASTActionList(side, card, -1, ast.spellMain, effectTargetLane, false);
    }
    addBones(side, 1);
  }

  battle.animating = false;
  renderAllBattleUI();
}

async function performMinionCombatAnimated(attackerSide, lane) {
  const attacker = battle.board[attackerSide][lane];
  if (!attacker || attacker.data.type === 'amulet' || battle.gameOver || attacker.currentAtk <= 0) return;
  attacker.attackedThisTurn = true;
  const opp = 1 - attackerSide;
  const swings = Math.max(1, attacker.activeKw['多重攻击'] || 1);

  for (let s = 0; s < swings; s++) {
    if (battle.gameOver || battle.board[attackerSide][lane] !== attacker || attacker.currentAtk <= 0) break;

    if (attacker.grantedOnAttackAoe4) {
      await showTriggeredEffectToast(attacker.data, '【攻击时】对敌方战场上的全体随从造成4点伤害！', 260);
      await playRowWideVFX(opp, 'fire_aoe', 340);
      for (let tl = 0; tl < 5; tl++) {
        if (battle.board[opp][tl] && battle.board[opp][tl].data.type === 'minion') {
          await dealDamageToMinionAnimated(opp, tl, 4, attacker);
        }
      }
    }
    if (attacker.data.id === 'cmwge5kmkgr5o') {
      const frontDef = battle.board[opp][lane];
      if (frontDef && frontDef.data.type === 'minion') {
        await showTriggeredEffectToast(attacker.data, `【攻击时】破坏正对面的『${frontDef.data.name}』！`, 240);
        await destroyMinionAnimated(opp, lane);
      }
    } else if (attacker.data.ast && attacker.data.ast.onAttack.length > 0) {
      await executeASTActionList(attackerSide, attacker, lane, attacker.data.ast.onAttack, lane, false);
    }
    if (battle.gameOver || battle.board[attackerSide][lane] !== attacker) break;

    let targetLanes = [];
    if (attacker.activeKw['全体攻击']) {
      targetLanes = [0, 1, 2, 3, 4];
    } else if (attacker.activeKw['三侧攻击']) {
      targetLanes = [lane - 1, lane, lane + 1].filter(l => l >= 0 && l < 5);
    } else if (attacker.activeKw['两侧攻击']) {
      targetLanes = [lane - 1, lane + 1].filter(l => l >= 0 && l < 5);
    } else {
      targetLanes = [lane];
    }

    for (const tl of targetLanes) {
      if (battle.gameOver || battle.board[attackerSide][lane] !== attacker) break;
      let defender = battle.board[opp][tl];
      if (defender && defender.data.type === 'amulet') {
        defender = null;
      }

      if (!defender && battle.board[opp][tl] === null) {
        let guardLane = -1, bestDist = 99;
        for (let gl = 0; gl < 5; gl++) {
          const gm = battle.board[opp][gl];
          const canBlockFlying = !attacker.activeKw['飞行'] || Boolean(gm && gm.activeKw['防空']);
          if (gm && gm.data.type === 'minion' && gm.activeKw['守护'] && !gm.activeKw['潜行'] && canBlockFlying) {
            const d = Math.abs(gl - tl);
            if (d < bestDist) { bestDist = d; guardLane = gl; }
          }
        }
        if (guardLane !== -1) {
          defender = battle.board[opp][guardLane];
          if (battle.board[opp][tl] === null) {
            await playSynergyBeam(getLaneDOM(opp, guardLane), getLaneDOM(opp, tl), '#38bdf8', 220);
            battle.board[opp][guardLane] = null;
            battle.board[opp][tl] = defender;
            renderAllBattleUI();
            await showTriggeredEffectToast(defender.data, `【守护】移动至第 ${tl + 1} 战道进行护盾拦截。`, 240);
          }
        }
      }

      const defActualLane = defender ? battle.board[opp].indexOf(defender) : tl;
      const hitLeader = (!defender) || (attacker.activeKw['飞行'] && !defender.activeKw['防空']);
      const atkCell = getLaneDOM(attackerSide, lane);
      if (atkCell && atkCell.firstElementChild) {
        atkCell.firstElementChild.style.transform = attackerSide === 0 ? 'translateY(-36px) scale(1.12)' : 'translateY(36px) scale(1.12)';
      }
      await sleep(160);

      if (hitLeader) {
        const oppSt = battle.leaders[opp];
        if (attacker.activeKw['飞行'] && oppSt.crests && oppSt.crests.some(cr => cr.id === 'crest_anti_aggro')) {
          const cr = oppSt.crests.find(x => x.id === 'crest_anti_aggro');
          await playCrestTriggerVFX(opp, cr.id);
          attacker.currentAtk = Math.max(0, attacker.currentAtk - 2);
          spawnFloatNumber(attackerSide, lane, '-2攻', '#38bdf8');
          await showTriggeredEffectToast(cr.cardData, `【纹章：痛恨快攻卡组的玩家】使飞行随从『${attacker.data.name}』攻击力-2！`, 220);
          renderAllBattleUI();
        }
        if (attacker.currentAtk > 0) {
          await playSynergyBeam(getLaneDOM(attackerSide, lane), getLaneDOM(opp, -1), '#f43f5e', 180);
          await dealDamageToLeaderAnimated(opp, attacker.currentAtk, attacker);
        }
      } else if (defActualLane >= 0) {
        await playSynergyBeam(getLaneDOM(attackerSide, lane), getLaneDOM(opp, defActualLane), '#fbbf24', 170);
        const dealt = await dealDamageToMinionAnimated(opp, defActualLane, attacker.currentAtk, attacker);
        if (defender && defender.activeKw['荆棘'] && dealt > 0) {
          const thorn = defender.activeKw['荆棘'];
          await showTriggeredEffectToast(defender.data, `【荆棘_${thorn}】对攻击者造成 ${thorn} 点反伤。`, 220);
          await dealDamageToMinionAnimated(attackerSide, lane, thorn, defender);
        }
      }
      renderAllBattleUI();
      await sleep(130);
    }
  }

  if (!battle.gameOver && battle.board[attackerSide][lane] === attacker) {
    if (attacker.activeKw['潜行']) delete attacker.activeKw['潜行'];
    if (attacker.activeKw['位移']) {
      let nextL = lane + attacker.shiftDir;
      if (nextL < 0 || nextL >= 5 || battle.board[attackerSide][nextL] !== null) {
        attacker.shiftDir = -attacker.shiftDir;
        nextL = lane + attacker.shiftDir;
      }
      if (nextL >= 0 && nextL < 5 && battle.board[attackerSide][nextL] === null) {
        battle.board[attackerSide][lane] = null;
        battle.board[attackerSide][nextL] = attacker;
        await showTriggeredEffectToast(attacker.data, `【位移】移动至第 ${nextL + 1} 战道。`, 180);
        spawnFloatNumber(attackerSide, nextL, '↔位移', '#38bdf8');
        renderAllBattleUI();
        await sleep(200);
        if (attacker.data.id === 'cmwgee7uk9ipt' && battle.board[attackerSide][lane] === null) {
          await showTriggeredEffectToast(attacker.data, '『骨球』位移后在原地召唤1个『骷髅』！', 220);
          await summonByNameAnimated(attackerSide, '骷髅', 1, lane, true, attacker.data.name);
        }
      }
    }
  }
}

async function checkAndTriggerMechGirlInvocation(side) {
  if (battle.gameOver) return false;
  const st = battle.leaders[side];
  const mechsOnBoard = battle.board[side].filter(m => m && m.data.type === 'minion' && isMechCard(m.data));
  if (mechsOnBoard.length < 5) return false;
  if (mechsOnBoard.length === 1 && mechsOnBoard[0].data.id === 'cmwbx0mq8qz7f') return false;

  let girl = null;
  const idx = st.deck.findIndex(c => c.data.id === 'cmwbx0mq8qz7f');
  if (idx !== -1) {
    girl = st.deck.splice(idx, 1)[0];
  } else {
    girl = createCardInstance('cmwbx0mq8qz7f', side);
  }
  if (!girl) return false;

  await showTriggeredEffectToast(girl.data, '【瞬念召唤】满足5个机械随从！同时破坏己方全体随从，召唤『魔导机兵少女』并使其获得【攻击时：对敌方全体随从造成4点伤害】！', 380);
  await playRowWideVFX(side, 'destroy_wave', 340);

  const sacrificedMechs = [];
  for (let l = 0; l < 5; l++) {
    const m = battle.board[side][l];
    if (m && m.data.type === 'minion') {
      const cell = getLaneDOM(side, l);
      if (cell && cell.firstElementChild) cell.firstElementChild.classList.add('shatter-White-anim');
      sacrificedMechs.push({ lane: l, inst: m });
    }
  }
  await sleep(280);

  sacrificedMechs.forEach(({ lane, inst }) => {
    battle.board[side][lane] = null;
    st.graveyard.push(inst.data);
    if (hasAnyLastWords(inst)) st.destroyedLastWordsCount += 1;
    addBones(side, 1);
  });
  renderAllBattleUI();

  const girlLane = findFirstEmptyLane(side);
  if (girlLane !== -1) {
    girl.grantedOnAttackAoe4 = true;
    addGrantedEffect(girl, '来源：【魔导机兵少女·瞬念召唤】 → 获得「【攻击时】对敌方战场上的全体随从造成4点伤害」');
    await placeMinionOnBoardAnimated(side, girl, girlLane);
  }

  for (const item of sacrificedMechs) {
    if (battle.gameOver) break;
    await resolveLastWordsAnimated(side, item.lane, item.inst);
  }

  const curGirlLane = battle.board[side].indexOf(girl);
  if (!battle.gameOver && curGirlLane !== -1) {
    await performMinionCombatAnimated(side, curGirlLane);
  }
  return true;
}

// 规则：「回合结束时召唤的随从都可以立刻攻击（例如飞龙骑手召唤的龙蛋被孵化器孵化后可以立刻攻击）」
async function executeEndTurnSequence(side) {
  if (battle.gameOver || battle.activeSide !== side || battle.animating) return;
  if (typeof stopTurnCountdownTimer === 'function') stopTurnCountdownTimer();
  battle.animating = true;
  cancelPendingPlayToHand();
  battle.inspectedCard = null;
  document.getElementById('svDetailPanel').classList.add('hidden'); document.querySelectorAll('#playerHandZone .sv-hand-card.is-inspected').forEach(el => el.classList.remove('is-inspected'));
  renderAllBattleUI();

  const order = side === 0 ? [0,1,2,3,4] : [4,3,2,1,0];
  const st = battle.leaders[side];

  for (let l = 0; l < 5; l++) {
    if (battle.board[side][l]) battle.board[side][l].attackedThisTurn = false;
  }

  // 第一阶段：先触发场上随从与护符的【回合结束时】效果（如飞龙峡谷召唤飞龙、掘墓者骨头+1）以及主战者【纹章】的回合结束效果（如飞龙骑手纹章召唤雏龙的蛋 -> 被孵化装置破壳进化为雏龙/喷火龙/飞龙！）
  for (const l of order) {
    const m = battle.board[side][l];
    if (!m) continue;
    if (m.data.id === 'cmwfdja9sjiuf') {
      await showTriggeredEffectToast(m.data, '【回合结束时】『怨灵』【消失】！', 220);
      await banishMinionAnimated(side, l);
    } else if (m.data.id === 'cmwdxmxskfby0') {
      await showTriggeredEffectToast(m.data, '【回合结束时】召唤1个『飞龙』到己方战场上！', 280);
      await summonByNameAnimated(side, '飞龙', 1, l, false, m.data.name);
    } else if (m.data.ast && m.data.ast.turnEnd.length > 0) {
      await executeASTActionList(side, m, l, m.data.ast.turnEnd, -1, false);
    }
  }

  if (st.crests && st.crests.length > 0) {
    for (const cr of st.crests) {
      if (cr.id === 'crest_wyvern_rider') {
        await playCrestTriggerVFX(side, cr.id);
        await showTriggeredEffectToast(cr.cardData || { id: 'sys_notice', name: '战局提示', type: 'spell', rarity: '传说', energy: 0, bones: 0, sacrifice: 0 }, `【${cr.name}】回合结束时：召唤1个『雏龙的蛋』到己方战场上！`, 280);
        await summonByNameAnimated(side, '雏龙的蛋', 1, -1, false, cr.name);
      } else if (cr.id === 'crest_skeleton_lovers') {
        const lwLanes = [0,1,2,3,4].filter(l => {
          const m = battle.board[side][l];
          return m && m.data.type === 'minion' && hasAnyLastWords(m);
        });
        if (lwLanes.length > 0) {
          const pickL = lwLanes[0];
          const opp = 1 - side;
          await playCrestTriggerVFX(side, cr.id);
          await showTriggeredEffectToast(cr.cardData, '【纹章：骸骨恋人】破坏己方1个谢幕曲随从，随机破坏1个敌方随从！', 260);
          await destroyMinionAnimated(side, pickL);
          const oppLanes = [0,1,2,3,4].filter(l => battle.board[opp][l] && battle.board[opp][l].data.type === 'minion');
          if (oppLanes.length > 0) {
            const rl = oppLanes[Math.floor(Math.random() * oppLanes.length)];
            await destroyMinionAnimated(opp, rl);
          }
        }
      }
    }
  }

  // 第二阶段：检定【瞬念召唤】（如魔导机兵少女5机械瞬念召唤、摇滚骷髅吉他手10谢幕曲瞬念召唤）
  await checkAndTriggerMechGirlInvocation(side);
  if (!battle.gameOver && hasReachedLastWordsThreshold(side, 10) && findFirstEmptyLane(side) !== -1) {
    const idx = st.deck.findIndex(c => c.data.id === 'cmwbyp6f419ju');
    if (idx !== -1) {
      const [rocker] = st.deck.splice(idx, 1);
      addGrantedEffect(rocker, '来源：【摇滚骷髅吉他手·瞬念召唤】 → 已破坏10张以上谢幕曲直接登场');
      const el = findFirstEmptyLane(side);
      await showTriggeredEffectToast(rocker.data, '【瞬念召唤】将『摇滚骷髅吉他手』从牌库召唤到己方战场上！', 340);
      await placeMinionOnBoardAnimated(side, rocker, el);
    }
  }

  // 第三阶段：场上所有尚未在本回合攻击过的随从（包含回合结束时由纹章/护符/孵化装置破壳召唤出的随从！）按战道顺序依次发起攻击！
  const _eotCombatEvents = [];
  for (const l of order) {
    if (battle.gameOver) break;
    const m = battle.board[side][l];
    if (m && m.data.type === 'minion' && m.currentAtk > 0 && !m.attackedThisTurn) {
      _eotCombatEvents.push({ fromLane: l, toLane: l, dmg: m.currentAtk });
      await performMinionCombatAnimated(side, l);
    }
  }

  // 若攻击过程中因亡语/衍生又新登场了未攻击的随从，补齐攻击
  for (const l of order) {
    if (battle.gameOver) break;
    const m = battle.board[side][l];
    if (m && m.data.type === 'minion' && m.currentAtk > 0 && !m.attackedThisTurn) {
      await performMinionCombatAnimated(side, l);
    }
  }

  battle.animating = false;
  if (battleMode === 'pvp_online') {
    if (battle.gameOver) {
      broadcastOnlineSync('GAME_OVER', '决出胜负');
    } else {
      OnlineState.activeRole = OnlineState.role === 'host' ? 'guest' : 'host';
      battle.activeSide = 1;
      updateOnlineHudPill();
      broadcastOnlineSync('TURN_END', '结束了回合', { combatEvents: typeof _eotCombatEvents !== 'undefined' ? _eotCombatEvents : [] });
    }
    return;
  }
  if (!battle.gameOver) {
    if (battleMode === 'pvp_pass') {
      await triggerPvpPassAndPlayHandover();
    } else if (side === 0) {
      if (battle.firstPlayerSide === 1) battle.turn += 1;
      await beginTurnSequence(1);
      await runEnemyAITurnAnimated();
    } else {
      if (battle.firstPlayerSide === 0) battle.turn += 1;
      await beginTurnSequence(0);
    }
  }
}

let pvpCurrentPlayerNum = 1;
async function triggerPvpPassAndPlayHandover() {
  const nextPlayerNum = pvpCurrentPlayerNum === 1 ? 2 : 1;
  if (nextPlayerNum === 1) {
    battle.turn += 1;
  }
  pvpCurrentPlayerNum = nextPlayerNum;

  const tmpBoard = battle.board[0];
  battle.board[0] = battle.board[1];
  battle.board[1] = tmpBoard;

  const tmpLeader = battle.leaders[0];
  battle.leaders[0] = battle.leaders[1];
  battle.leaders[1] = tmpLeader;

  for (let s = 0; s < 2; s++) {
    battle.leaders[s].hand.forEach(c => { c.owner = s; });
    battle.leaders[s].deck.forEach(c => { c.owner = s; });
    battle.board[s].forEach(c => { if (c) c.owner = s; });
  }

  const modal = document.getElementById('pvpHandoverModal');
  const titleEl = document.getElementById('pvpHandoverTitle');
  const descEl = document.getElementById('pvpHandoverDesc');
  if (titleEl) titleEl.textContent = `👥 轮到【玩家 ${pvpCurrentPlayerNum}】行动`;
  if (descEl) descEl.textContent = `当前为第 ${battle.turn} 回合。为保护双方手牌隐私，已自动遮蔽牌面，请将设备交给【玩家 ${pvpCurrentPlayerNum}】后点击下方按钮开始回合。`;

  setHandCollapsed(true);
  renderAllBattleUI();
  if (modal) modal.classList.remove('hidden');
}

// ============================================================================

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
  const meta = clear ? '' : JSON.stringify({
    roomId: OnlineState.roomId,
    roomName: OnlineState.roomName,
    hostId: OnlineState.peerId,
    hostName: OnlineState.nickname,
    hasPassword: Boolean(OnlineState.roomPwdHash),
    playerCount: OnlineState.guestId ? 2 : 1,
    status: OnlineState.inMatch ? 'playing' : 'waiting',
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

function renderOnlineRoomList() {
  const listEl = document.getElementById('onlineRoomList');
  const cntEl = document.getElementById('onlineRoomCountText');
  if (!listEl) return;
  const now = Date.now();
  const validRooms = [];
  for (const [rid, info] of OnlineState.rooms.entries()) {
    if (!info || !info.roomId) continue;
    if (now - (info.ts || 0) > 15000) continue;
    validRooms.push(info);
  }
  validRooms.sort((a, b) => (b.ts || 0) - (a.ts || 0));
  if (cntEl) cntEl.textContent = `(${validRooms.length} 个活跃房间)`;

  if (validRooms.length === 0) {
    listEl.innerHTML = `<div class="text-center text-slate-500 text-xs py-12">${OnlineState.connected ? '当前暂无公开或在线房间，快在右侧创建一个房间吧！' : '正在连接联机大厅...'}</div>`;
    return;
  }

  listEl.innerHTML = '';
  validRooms.forEach(r => {
    const row = document.createElement('div');
    const isFullOrPlaying = r.playerCount >= 2 || r.status === 'playing';
    row.className = 'flex items-center justify-between gap-3 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 rounded-xl p-3 transition';
    row.innerHTML = `
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <span class="text-xs font-black text-white truncate">${r.roomName || ('房间 ' + r.roomId)}</span>
          <span class="px-1.5 py-0.5 rounded text-[10px] font-black ${r.hasPassword ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'}">${r.hasPassword ? '🔒 密码房' : '🔓 公开'}</span>
          <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-cyan-300">#${r.roomId}</span>
        </div>
        <div class="text-[11px] text-slate-400 mt-1">房主：<b class="text-slate-200">${r.hostName || '匿名决斗者'}</b> · 人数：<b>${r.playerCount || 1}/2</b> · 状态：<span class="${isFullOrPlaying ? 'text-rose-300' : 'text-emerald-300'}">${isFullOrPlaying ? '对战中/已满' : '等待加入'}</span></div>
      </div>
      <button ${isFullOrPlaying || OnlineState.roomId ? 'disabled' : ''} class="shrink-0 px-3 py-1.5 rounded-lg text-xs font-black ${isFullOrPlaying || OnlineState.roomId ? 'bg-slate-800 text-slate-500' : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow'} transition">${OnlineState.roomId === r.roomId ? '已在房内' : (isFullOrPlaying ? '已满' : '加入房间')}</button>
    `;
    const btn = row.querySelector('button');
    if (btn && !isFullOrPlaying && !OnlineState.roomId) {
      btn.onclick = () => attemptJoinRoom(r);
    }
    listEl.appendChild(row);
  });
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
  } else if (OnlineState.mode === 'custom' && OnlineState.customWs) {
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
  } else if (OnlineState.mode === 'custom' && OnlineState.customWs) {
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
    cardsPlayedThisTurn: st.cardsPlayedThisTurn || 0,
    nextMechDiscount: st.nextMechDiscount || 0,
    delayedMechDraws: st.delayedMechDraws || 0
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
    cardsPlayedThisTurn: raw.cardsPlayedThisTurn || 0,
    nextMechDiscount: raw.nextMechDiscount || 0,
    delayedMechDraws: raw.delayedMechDraws || 0
  };
}

function serializeBattleSnapshot() {
  return {
    turn: battle.turn,
    firstRole: OnlineState.firstRole,
    activeRole: OnlineState.activeRole,
    gameOver: battle.gameOver,
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
  if (pImg) pImg.src = renderCustomAvatarDataURI(userAvatarConfig);
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
    sendReliableRoomPacket({
      type: 'SYNC_STATE',
      kind: kind,
      desc: desc,
      actionMeta: Object.assign({}, actionMeta || {}, { vfxList: OnlineState.recordedVfx.splice(0) }),
      snap: serializeBattleSnapshot()
    });
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
    if (OnlineState.role === 'host' && OnlineState.guestId && OnlineState.myReady && OnlineState.oppReady && !OnlineState.inMatch) {
      startOnlineMatchAsHost();
    }
    return;
  }
  if (pkt.type === 'LEADER_EMOTE') {
    if (typeof showLeaderEmoteBubble === 'function') showLeaderEmoteBubble(1, pkt.text);
    return;
  }
  if (pkt.type === 'CHAT_MSG') {
    if (typeof window.appendInGameChatMessage === 'function') window.appendInGameChatMessage(pkt.sender || '对手', pkt.text, false);
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
    if (orderBadge) orderBadge.textContent = battle.firstPlayerSide === 0 ? '🎲 我方：先手' : '🎲 我方：后手';
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
  battle.animating = false;
  battle.inspectedCard = null;
  battle.pendingPlay = null;
  document.getElementById('svDetailPanel').classList.add('hidden'); document.querySelectorAll('#playerHandZone .sv-hand-card.is-inspected').forEach(el => el.classList.remove('is-inspected'));
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
  if (orderBadge) orderBadge.textContent = battle.firstPlayerSide === 0 ? '🎲 我方：先手' : '🎲 我方：后手';

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
  let retries = 0;
  const sendInitLoop = () => {
    if (OnlineState.matchAcked || !OnlineState.inMatch || retries >= 8) return;
    retries++;
    sendRoomPacket({ type: 'MATCH_START', init: compactInit });
    setTimeout(sendInitLoop, 1100);
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

function openOnlineLobbyModal() {
  const modal = document.getElementById('onlineLobbyModal');
  if (!modal) return;
  const nickInput = document.getElementById('onlineNickInput');
  if (nickInput) nickInput.value = OnlineState.nickname;
  const deckObj = PRESET_DECKS[currentDeckIndex] || PRESET_DECKS[0];
  const deckLen = expandDeck(deckObj).length;
  const prevEl = document.getElementById('onlineMyDeckPreview');
  if (prevEl) {
    prevEl.textContent = `${deckObj.name} (${deckLen} 张${deckLen < 40 ? ' · 不足40张将自动补齐' : ' · 就绪'})`;
  }
  modal.classList.remove('hidden');
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
  document.getElementById('onlineLobbyModal').classList.add('hidden');
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
  if (confirm('确定要认输并退出当前联机对战吗？')) {
    leaveOnlineRoom(true);
    battleMode = 'pve';
    const sel = document.getElementById('selectBattleMode');
    if (sel) sel.value = 'pve';
    renderAllBattleUI();
    if (typeof checkAndPromptSavedPveBattle === 'function') setTimeout(checkAndPromptSavedPveBattle, 200);
  }
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

  if (m.countdown !== null && hasRace(c, '龙族')) score += 48;
  if ((ast.onEnter && ast.onEnter.length > 0) || String(c.fullText || '').includes('每当')) score += 65;
  if ((ast.turnEnd && ast.turnEnd.length > 0) || String(c.fullText || '').includes('回合结束')) score += 48;
  if (ast.activate || (c.keywords || []).some(k => k.k === '启动')) score += 45;
  if ((ast.onAttack && ast.onAttack.length > 0) || m.grantedOnAttackAoe4) score += 50;

  if (kw['全体攻击']) score += 55;
  if (kw['三侧攻击']) score += 45;
  if (kw['两侧攻击']) score += 32;
  if (kw['毁灭']) score += 38;
  if (kw['虹吸']) score += 28;
  if (kw['飞行']) score += 26;
  if (kw['守护']) score += 24;
  if (kw['屏障']) score += 18;
  if (kw['防空']) score += 12;

  if (hasAnyLastWords(m)) {
    if (isBanish) score += 75;
    else score -= 55;
  }
  return score;
}

function simulateProjectedFaceDamage(virtualEnemyBoard = null, virtualPlayerBoard = null) {
  const eBoard = virtualEnemyBoard ? [...virtualEnemyBoard] : [...battle.board[1]];
  const pBoard = virtualPlayerBoard ? [...virtualPlayerBoard] : [...battle.board[0]];
  let faceDmg = 0;
  const order = [4, 3, 2, 1, 0];
  for (const l of order) {
    const atkM = eBoard[l];
    if (!atkM || (atkM.data && atkM.data.type === 'amulet') || atkM.currentAtk <= 0) continue;
    const swings = Math.max(1, (atkM.activeKw && atkM.activeKw['多重攻击']) || 1);
    for (let s = 0; s < swings; s++) {
      let targetLanes = [l];
      if (atkM.activeKw && atkM.activeKw['全体攻击']) targetLanes = [0, 1, 2, 3, 4];
      else if (atkM.activeKw && atkM.activeKw['三侧攻击']) targetLanes = [l - 1, l, l + 1].filter(x => x >= 0 && x < 5);
      else if (atkM.activeKw && atkM.activeKw['两侧攻击']) targetLanes = [l - 1, l + 1].filter(x => x >= 0 && x < 5);

      for (const tl of targetLanes) {
        let def = pBoard[tl];
        if (def && def.data && def.data.type === 'amulet') def = null;
        if (!def) {
          const guardIdx = pBoard.findIndex(gm => gm && (!gm.data || gm.data.type === 'minion') && gm.activeKw && gm.activeKw['守护'] && !gm.activeKw['潜行']);
          if (guardIdx !== -1) def = pBoard[guardIdx];
        }
        const hitFace = (!def) || (atkM.activeKw && atkM.activeKw['飞行'] && !(def.activeKw && def.activeKw['防空']));
        if (hitFace) faceDmg += atkM.currentAtk;
      }
    }
  }
  return faceDmg;
}

// 比较两个己方随从作为祭品的优先级：
// 1. 先按卡牌费用价值 (energy*1 + bones*0.5 + sacrifice*2) 升序排列（价值越低越优先献祭）
// 2. 价值同等的情况下，严格优先选择当前生命值和攻击力较低的随从献祭！
function compareTributeCandidatesForAI(instA, instB) {
  const valA = getCardCostValue(instA.data);
  const valB = getCardCostValue(instB.data);
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
  if (id === 'cmwgdqawegvy3') return 2; // 地狱三头犬
  if (id === 'cmwgdeqcq4vyl') return 3; // 骸骨和少女
  if (id === 'cmwgeg2eggz9t') return 3; // 骸骨恋人
  if (id === 'cmwgrn65g40ql') return choiceIdx === 2 ? 3 : 0; // 拯救世界的大天使
  if (id === 'cmwdvmwjm0301') return 2; // 丢失的龙蛋
  if (id === 'cmwgrgw6jyd8p') return 1; // 亡灵骑士
  const ast = c.data.ast || parseCardEffectAST(c.data);
  const acts = [...(ast.fanfare || []), ...(ast.spellMain || []), ...(isEnh && ast.enhance ? ast.enhance.actions : [])];
  let sum = 0;
  for (const act of acts) {
    if (act.op === 'summon') sum += (act.count || 1);
    else if (act.op === 'reanimate' || act.op === 'recruit') sum += (act.times || 1);
  }
  return sum;
}

async function runEnemyAITurnAnimated() {
  if (battle.gameOver) return;
  battle.animating = true;
  try {
  const st = battle.leaders[1];
  const pst = battle.leaders[0];
  await sleep(340);

  let stepGuard = 0;
  while (!battle.gameOver && stepGuard < 22) {
    stepGuard++;

    let bestAction = null;
    let bestScore = -9999;

    const myMinions = battle.board[1].filter(m => m && m.data.type === 'minion');
    const myMechCount = myMinions.filter(m => isMechCard(m.data)).length;
    const emptyLanes = [0,1,2,3,4].filter(l => battle.board[1][l] === null);
    const baseFaceDmg = simulateProjectedFaceDamage();
    const playerBoardTotalAtk = battle.board[0].reduce((s, m) => s + (m && m.data.type === 'minion' ? m.currentAtk : 0), 0);

    // 预检手牌中是否有等待低价值祭品的献祭类随从（若场上低价值随从不足，优先把手中低价值随从打出去当祭品！）
    const pendingSacCardsInHand = st.hand.filter(h => {
      const needS = h.data.sacrifice || 0;
      if (needS <= 0) return false;
      const effE = getEffectiveEnergy(h, st);
      const needB = h.data.bones || 0;
      if (st.energy < effE || st.bones < needB) return false;
      const sVal = getCardCostValue(h.data);
      const validLowValTributes = getValidSacrificeLanes(1, h.data.sacrificeCond || '')
        .filter(l => getCardCostValue(battle.board[1][l].data) < sVal);
      return validLowValTributes.length < needS;
    });

    const hasHandConsumer = st.hand.some(h => {
      const ft = String(h.data.fullText || '');
      return ft.includes('电子羊') || ft.includes('机械卡牌为6张');
    });

    // A. 评估场上随从与护符的【启动】技能（赛博牧羊人、龙蛋收藏家、无畏的飞龙骑手纹章续期、龙心秘宝弃牌拿龙蛋）
    for (let l = 0; l < 5; l++) {
      const m = battle.board[1][l];
      if (!m || m.activatedThisTurn) continue;
      const ast = m.data.ast || parseCardEffectAST(m.data);
      if (m.data.id === 'cmwdw5qt6cbqb') {
        const wyvCrest = (st.crests || []).find(cr => cr.id === 'crest_wyvern_rider');
        if (wyvCrest && st.energy >= 1 && wyvCrest.countdown <= 2) {
          const score = 195;
          if (score > bestScore) {
            bestScore = score;
            bestAction = { type: 'activate_minion', lane: l, minion: m, eCost: 1 };
          }
        }
      } else if (m.data.id === 'cmwfdhecfc856') { // 龙蛋收藏家：能量1将1张雏龙的蛋置入手牌
        if (st.energy >= 1 && st.hand.length <= (st.handLimit || RULES.handLimit) - 1) {
          const score = (emptyLanes.length >= 1 && st.energy >= 2) ? 240 : 120;
          if (score > bestScore) {
            bestScore = score;
            bestAction = { type: 'activate_minion', lane: l, minion: m, eCost: 1 };
          }
        }
      } else if (m.data.id === 'cmwdzvs1woa53') {
        if (st.hand.length >= 2 && emptyLanes.length >= 1) {
          const score = 135;
          if (score > bestScore) {
            bestScore = score;
            bestAction = { type: 'activate_minion', lane: l, minion: m, eCost: 0 };
          }
        }
      } else if (m.data.id === 'cmwgrgw6jyd8p') {
        const hasVal3Dead = st.graveyard.some(cd => cd.type === 'minion' && getCardCostValue(cd) <= 3);
        if (st.bones >= 6 && emptyLanes.length >= 1 && hasVal3Dead) {
          const score = 210;
          if (score > bestScore) {
            bestScore = score;
            bestAction = { type: 'activate_minion', lane: l, minion: m, eCost: 0, bCost: 6 };
          }
        }
      } else if (ast && ast.activate && st.energy >= (ast.activate.energy || 0) && st.bones >= (ast.activate.bones || 0) && st.hand.length <= (st.handLimit || RULES.handLimit) - 1) {
        let actScore = 110;
        if (hasHandConsumer || pendingSacCardsInHand.length > 0) actScore += 380;
        if (emptyLanes.length >= 1 && st.energy >= 2) actScore += 90;
        if (actScore > bestScore) {
          bestScore = actScore;
          bestAction = { type: 'activate_minion', lane: l, minion: m, eCost: ast.activate.energy || 1, astAct: ast.activate };
        }
      }
    }

    // B. 遍历手牌，计算每张牌的最优打法
    for (const c of [...st.hand]) {
      const playEval = evaluateCardPlayState(1, c);
      if (!playEval.ok) continue;

      const ast = c.data.ast || parseCardEffectAST(c.data);
      const fullTxt = String(c.data.fullText || c.data.text || '');
      const isEnh = playEval.mode === 'enhance';
      const selfValue = getCardCostValue(c.data);

      let choiceIdx = 0;
      const choices = getCardChoices(c);
      if (choices.length >= 2) {
        if (c.data.id === 'cmwas0lke5oiw') {
          const graveMechs4 = st.graveyard.filter(cd => cd.type === 'minion' && isMechCard(cd) && cd.energy >= 3 && cd.energy <= 4).length;
          choiceIdx = graveMechs4 >= 2 ? 1 : 0;
        } else if (c.data.id === 'cmwc3gozg0rat') {
          const remHandMechs = st.hand.filter(h => h !== c && isMechCard(h.data)).length;
          const killableEnemies = battle.board[0].filter(pm => pm && pm.data.type === 'minion' && !pm.activeKw['屏障'] && pm.currentHp <= remHandMechs && analyzeMinionKillValueForAI(pm) > 20).length;
          if (killableEnemies >= 1 && (myMechCount <= 1 || playerBoardTotalAtk >= 4)) choiceIdx = 1;
          else choiceIdx = 0;
        } else if (c.data.id === 'cmwdz3reuida0') {
          const myCdCnt = battle.board[1].filter(m => m && m.countdown !== null).length;
          const deadBigDragon = st.graveyard.some(cd => cd.type === 'minion' && getInitialCountdown(cd) > 0 && cd.atk >= 5);
          if (myCdCnt >= 2) choiceIdx = 1;
          else if (deadBigDragon) choiceIdx = 2;
          else choiceIdx = 0;
        } else if (c.data.id === 'cmwe071ws115o') {
          const myCdCnt = battle.board[1].filter(m => m && m.countdown !== null).length;
          if (myCdCnt >= 2) choiceIdx = 0;
          else if (myCdCnt === 1) choiceIdx = 1;
          else choiceIdx = 2;
        } else if (c.data.id === 'cmwgrn65g40ql') {
          const oppMinionCnt = battle.board[0].filter(pm => pm && pm.data.type === 'minion').length;
          const deadVal5 = st.graveyard.some(cd => cd.type === 'minion' && getCardCostValue(cd) >= 3 && getCardCostValue(cd) <= 5);
          if (oppMinionCnt >= 2 || playerBoardTotalAtk >= 6) choiceIdx = 0;
          else if (st.hp <= 18) choiceIdx = 1;
          else if (deadVal5 && emptyLanes.length >= 2) choiceIdx = 2;
          else choiceIdx = oppMinionCnt >= 1 ? 0 : 1;
        } else if (c.data.id === 'cmwgru11nfnj0') {
          const oppMinionCnt = battle.board[0].filter(pm => pm && pm.data.type === 'minion').length;
          if (battle.leaders[0].hp <= 10 || oppMinionCnt >= 1) choiceIdx = 0;
          else choiceIdx = 2;
        }
      }

      const req = getCardTargetRequirement(c, isEnh, choiceIdx);
      let effTarget = -1;
      let effTargetSide = -1;
      let targetValueScore = 0;
      let handTargetUid = -1;

      if (req === 'hand_card') {
        const others = st.hand.filter(h => h !== c);
        if (others.length > 0) {
          others.sort((a, b) => getCardCostValue(b.data) - getCardCostValue(a.data));
          handTargetUid = others[0].uid;
        }
      } else if (req === 'enemy_minion' || req === 'enemy_minion_hp3') {
        const vt = getValidTargetLocations(1, req, c.data.type === 'spell');
        if (vt.length === 0) {
          if (c.data.type === 'spell') continue;
        } else {
          const isBanish = fullTxt.includes('消失');
          const isDestroy = fullTxt.includes('破坏');
          let dmgVal = 3;
          const mDmg = fullTxt.match(/造成(\d+)点伤害/);
          if (mDmg) dmgVal = Number(mDmg[1]);
          if (ast.combo && (st.cardsPlayedThisTurn + 1) >= ast.combo.count) {
            const mComboDmg = String(ast.combo.text || '').match(/(\d+)点伤害/);
            if (mComboDmg) dmgVal = Number(mComboDmg[1]);
          }
          vt.sort((a, b) => {
            const ma = battle.board[0][a.lane], mb = battle.board[0][b.lane];
            const killA = isBanish || isDestroy || (!ma.activeKw['屏障'] && ma.currentHp <= dmgVal);
            const killB = isBanish || isDestroy || (!mb.activeKw['屏障'] && mb.currentHp <= dmgVal);
            if (killA !== killB) return killB ? 1 : -1;
            return analyzeMinionKillValueForAI(mb, isBanish) - analyzeMinionKillValueForAI(ma, isBanish);
          });
          effTarget = vt[0].lane;
          effTargetSide = 0;
          const targetM = battle.board[0][effTarget];
          const canKill = isBanish || isDestroy || (!targetM.activeKw['屏障'] && targetM.currentHp <= dmgVal);
          const killVal = analyzeMinionKillValueForAI(targetM, isBanish);
          targetValueScore = canKill ? (420 + killVal * 4.2) : (90 + killVal * 1.2);

          const simPBoard = [...battle.board[0]];
          if (canKill) simPBoard[effTarget] = null;
          if (simulateProjectedFaceDamage(null, simPBoard) >= pst.hp) targetValueScore += 50000;
        }
      } else if (req === 'friendly_minion' || req === 'friendly_dragon_minion') {
        const vf = getValidTargetLocations(1, req, c.data.type === 'spell');
        if (vf.length === 0) {
          if (c.data.type === 'spell') continue;
        } else {
          vf.sort((a, b) => (battle.board[1][b.lane].currentAtk + battle.board[1][b.lane].currentHp) - (battle.board[1][a.lane].currentAtk + battle.board[1][a.lane].currentHp));
          effTarget = vf[0].lane;
          effTargetSide = 1;
          targetValueScore = 240;
        }
      } else if (req === 'friendly_countdown') {
        const vcd = getValidTargetLocations(1, req, c.data.type === 'spell');
        if (vcd.length === 0) {
          if (c.data.type === 'spell') continue;
        } else {
          vcd.sort((a, b) => {
            const ma = battle.board[1][a.lane], mb = battle.board[1][b.lane];
            const scoreA = (ma.countdown === 1 ? 80 : 30) + (hasRace(ma.data, '龙族') ? 50 : 0) + (ma.currentAtk * 10);
            const scoreB = (mb.countdown === 1 ? 80 : 30) + (hasRace(mb.data, '龙族') ? 50 : 0) + (mb.currentAtk * 10);
            return scoreB - scoreA;
          });
          effTarget = vcd[0].lane;
          effTargetSide = 1;
          targetValueScore = 310;
        }
      } else if (req === 'any_minion') { // 鞭策 (+2/-2)
        const locs = getValidTargetLocations(1, req, true);
        if (locs.length === 0) continue;
        const enemyKillable = locs.filter(loc => loc.side === 0 && battle.board[0][loc.lane].currentHp <= 2);
        if (enemyKillable.length > 0) {
          enemyKillable.sort((a, b) => analyzeMinionKillValueForAI(battle.board[0][b.lane], false) - analyzeMinionKillValueForAI(battle.board[0][a.lane], false));
          effTarget = enemyKillable[0].lane;
          effTargetSide = 0;
          targetValueScore = 480 + analyzeMinionKillValueForAI(battle.board[0][effTarget], false) * 3.5;
        } else {
          // 绝不对己方生命值 <= 2 或高价值随从使用负面扣血！仅在己方随从生命 >= 5 时考虑加攻斩杀
          const myHealthy = locs.filter(loc => loc.side === 1 && battle.board[1][loc.lane].currentHp >= 5);
          if (myHealthy.length > 0 && baseFaceDmg + 2 >= pst.hp) {
            effTarget = myHealthy[0].lane;
            effTargetSide = 1;
            targetValueScore = 50000;
          } else {
            continue;
          }
        }
      } else if (req === 'enemy_minion' || req === 'enemy_minion_hp3' || req === 'friendly_minion' || req === 'friendly_countdown') {
        const locs = getValidTargetLocations(1, req, c.data.type === 'spell');
        if (locs.length === 0) {
          if (c.data.type === 'spell') continue;
          targetValueScore -= 9000; // 随从无合法目标时不作为优先打出卡牌
        } else {
          effTarget = locs[0].lane;
          effTargetSide = locs[0].side;
          targetValueScore += 180;
        }
      } else if (req === 'any_board_card') { // 堕天 (变身为 2/3 堕天使，价值 1+3*0.5 = 2.5)
        const locs = getValidTargetLocations(1, req, true);
        if (locs.length === 0) continue;
        // 绝不把己方高价值随从变身为堕天使！仅把玩家高价值随从 (> 2.5) 变身为堕天使
        const bigEnemies = locs.filter(loc => loc.side === 0 && (getCardCostValue(battle.board[0][loc.lane].data) >= 3.5 || battle.board[0][loc.lane].currentAtk >= 4 || battle.board[0][loc.lane].currentHp >= 5));
        if (bigEnemies.length > 0) {
          bigEnemies.sort((a, b) => analyzeMinionKillValueForAI(battle.board[0][b.lane], true) - analyzeMinionKillValueForAI(battle.board[0][a.lane], true));
          effTarget = bigEnemies[0].lane;
          effTargetSide = 0;
          targetValueScore = 520 + analyzeMinionKillValueForAI(battle.board[0][effTarget], true) * 3.8;
        } else {
          continue;
        }
      }

      // 严格执行 v2.1 祭品价值规则：
      // 1) 祭品的价值不能大于等于当前打出的献祭类随从的价值 (getCardCostValue(tribute) < selfValue 且 sum(tributes) < selfValue)
      // 2) 当场上低价值祭品不足，但手牌中还有可先打出的低价值随从时，暂缓打出本献祭卡，先打低价值随从上场！
      // 3) 价值同等的情况下，优先选择当前生命值和攻击力较低的随从献祭 (compareTributeCandidatesForAI)
      const sacLanes = [];
      let sacPenalty = 0;
      if (c.data.sacrifice > 0 && playEval.mode !== 'accelerate') {
        const allValidSac = getValidSacrificeLanes(1, c.data.sacrificeCond || '');
        // 过滤掉价值 >= 当前献祭随从价值的随从！
        const lowValueSac = allValidSac.filter(l => {
          const m = battle.board[1][l];
          return m && getCardCostValue(m.data) < selfValue;
        });

        if (lowValueSac.length < c.data.sacrifice) {
          // 场上低价值随从不足，绝不强行献祭高价值随从！
          continue;
        }

        lowValueSac.sort((la, lb) => compareTributeCandidatesForAI(battle.board[1][la], battle.board[1][lb]));

        // 检查如果手牌中还有更低价值的随从可以先下场当祭品（且能量够先下杂鱼再打本卡），则优先先下杂鱼！
        const worstChosenLane = lowValueSac[c.data.sacrifice - 1];
        const worstChosenVal = getCardCostValue(battle.board[1][worstChosenLane].data);
        const canPlayCheaperFodderFirst = emptyLanes.length >= 2 && st.hand.some(h => {
          if (h === c) return false;
          if (h.data.type !== 'minion' || (h.data.sacrifice || 0) > 0) return false;
          if (c.data.sacrificeCond && !hasRace(h.data, c.data.sacrificeCond)) return false;
          const hVal = getCardCostValue(h.data);
          const hE = getEffectiveEnergy(h, st);
          const hB = h.data.bones || 0;
          return hVal < worstChosenVal && (st.energy >= (playEval.costE || 0) + hE) && (st.bones >= (playEval.costB || 0) + hB);
        });
        if (canPlayCheaperFodderFirst) {
          continue; // 先让循环打出手中更低价值的随从，下一拍再献祭它！
        }

        let totalTributeVal = 0;
        for (let i = 0; i < c.data.sacrifice; i++) {
          const sl = lowValueSac[i];
          const tm = battle.board[1][sl];
          totalTributeVal += getCardCostValue(tm.data);
          sacLanes.push(sl);
          sacPenalty += getCardCostValue(tm.data) * 22 + (tm.currentAtk + tm.currentHp) * 6 - (hasAnyLastWords(tm) ? 35 : 0);
        }
        // 评估新卡自身价值 + 额外召唤价值，只要最终场上总价值更高即可献祭
        const expectedExtraVal = estimateAIExtraSummons(c, isEnh, choiceIdx) * 1.5;
        const totalExpectedNewVal = selfValue + expectedExtraVal;
        if (totalTributeVal >= totalExpectedNewVal && totalExpectedNewVal > 0) {
          continue;
        }
        if (myMechCount >= 4 && isMechCard(c.data) && (myMechCount - c.data.sacrifice + 1) < 5) {
          sacPenalty += 260;
        }
      }

      let placeLane = 0;
      let bestLaneTradeScore = -9999;
      const candidateLanes = [0,1,2,3,4].filter(l => battle.board[1][l] === null || sacLanes.includes(l));
      const isBoardCard = c.data.type === 'minion' || c.data.type === 'amulet';
      if (isBoardCard && candidateLanes.length === 0) continue;

      if (c.data.type === 'amulet' && candidateLanes.length > 0) {
        placeLane = candidateLanes[candidateLanes.length - 1];
        bestLaneTradeScore = 280;
      } else if (c.data.type === 'minion' && candidateLanes.length > 0) {
        const activeShepherds = battle.board[1].filter((m, idx) => m && !sacLanes.includes(idx) && m.data.id === 'cmwbxu7u3tpyo').length;
        const activeTamers = battle.board[1].filter((m, idx) => m && !sacLanes.includes(idx) && m.data.id === 'cmwdw2v21c73r').length;
        const baseAtk = (c.currentAtk !== undefined ? c.currentAtk : (c.data.atk || 0));
        const baseHp = (c.currentHp !== undefined ? c.currentHp : (c.data.hp || 1));
        const bonusBuff = (isMechCard(c.data) ? activeShepherds : 0) + (hasRace(c.data, '龙族') ? activeTamers : 0);
        const effAtk = baseAtk + bonusBuff;
        const effHp = baseHp + bonusBuff;
        const hasBane = Boolean(c.activeKw && c.activeKw['毁灭']);
        const hasFly = Boolean(c.activeKw && c.activeKw['飞行']);
        const isCheapFodder = selfValue <= 2.0 && effAtk <= 2 && effHp <= 3;

        candidateLanes.forEach(l => {
          let lScore = 0;
          const pm = battle.board[0][l];

          const simEBoard = [...battle.board[1]];
          sacLanes.forEach(sl => simEBoard[sl] = null);
          simEBoard[l] = {
            data: c.data,
            currentAtk: effAtk,
            currentHp: effHp,
            activeKw: Object.assign({}, c.activeKw)
          };
          const simPBoard = [...battle.board[0]];
          if (effTarget >= 0 && effTargetSide === 0 && simPBoard[effTarget] && targetValueScore >= 400) {
            simPBoard[effTarget] = null;
          }
          const projDmg = simulateProjectedFaceDamage(simEBoard, simPBoard);
          if (projDmg >= pst.hp) {
            lScore += 50000 + projDmg * 50;
          }

          if (!pm || pm.data.type === 'amulet') {
            lScore += 32 + effAtk * (hasFly ? 11 : 7);
          } else {
            const pmKillVal = analyzeMinionKillValueForAI(pm, false);
            const thornDmg = Number((pm.activeKw && pm.activeKw['荆棘']) || 0);
            const onAtkFrontDmg = c.data.id === 'cmwdts32am05i' ? 1 : (c.data.id === 'cmwdtq4q7c8pe' ? 3 : (c.data.id === 'cmwdui6uam6xe' || c.data.id === 'cmwdukf0l090w' ? 5 : 0));
            const totalDealToPm = effAtk + onAtkFrontDmg;
            const canKillPm = (!pm.activeKw['屏障']) && ((totalDealToPm >= pm.currentHp) || (hasBane && effAtk > 0));
            const survivesThorns = effHp > thornDmg;

            if (canKillPm && survivesThorns) {
              if (pmKillVal <= 0 && pm.currentAtk <= 1) {
                lScore += 15;
              } else {
                const exactKillBonus = (totalDealToPm === pm.currentHp || hasBane) ? 90 : 40;
                lScore += 560 + pmKillVal * 4.5 + exactKillBonus + (effHp - thornDmg) * 12;
              }
            } else if (canKillPm && !survivesThorns) {
              const myVal = effAtk * 16 + effHp * 10;
              lScore += (pmKillVal >= myVal) ? (260 + (pmKillVal - myVal) * 2) : -80;
            } else if (pm.activeKw['屏障'] && effAtk > 0 && isCheapFodder) {
              lScore += 280 + pm.currentAtk * 25;
            } else {
              const canBlockEnemy = (!pm.activeKw['飞行']) || Boolean(c.activeKw && c.activeKw['防空']);
              const diesNextTurn = pm.currentAtk >= (effHp - thornDmg);

              if (canBlockEnemy && pm.currentAtk >= 3 && (isCheapFodder || hasAnyLastWords(c) || c.data.name === '雏龙的蛋' || (c.activeKw && (c.activeKw['守护'] || c.activeKw['屏障'])))) {
                const hpUrgency = st.hp <= 15 ? 2.0 : 1.2;
                lScore += 320 + (pm.currentAtk * 32 * hpUrgency) + (hasAnyLastWords(c) ? 85 : 0);
              } else if (diesNextTurn) {
                lScore -= (280 + selfValue * 45);
              } else {
                lScore += 180 + effAtk * 15 + pm.currentAtk * 12;
              }
            }
          }

          if (lScore > bestLaneTradeScore) {
            bestLaneTradeScore = lScore;
            placeLane = l;
          }
        });
      }

      let totalScore = (isBoardCard ? bestLaneTradeScore : targetValueScore) - sacPenalty + targetValueScore * (isBoardCard && effTarget >= 0 ? 0.85 : 0);

      // 若手牌中有等待低价值祭品的献祭卡，且当前卡 c 是低价值铺场随从/召唤法术，赋予 +680 铺垫祭品最高优先加分！
      if (pendingSacCardsInHand.length > 0 && (c.data.sacrifice || 0) === 0 && emptyLanes.length > 0) {
        const canServeAsFodder = pendingSacCardsInHand.some(sacCard => {
          const sVal = getCardCostValue(sacCard.data);
          const remE = st.energy - (playEval.costE || 0);
          const remB = st.bones - (playEval.costB || 0);
          if (remE < getEffectiveEnergy(sacCard, st) || remB < (sacCard.data.bones || 0)) return false;
          if (c.data.type === 'minion' && selfValue < sVal && (!sacCard.data.sacrificeCond || hasRace(c.data, sacCard.data.sacrificeCond))) return true;
          if (c.data.id === 'cmwdvmwjm0301' && sVal > 1) return true; // 丢失的龙蛋召2个1费蛋
          return false;
        });
        if (canServeAsFodder) {
          totalScore += 680;
        }
      }

      if (c.data.id === 'cmwdvrwfcy5gg' || c.data.id === 'cmwdw2v21c73r') {
        totalScore += 340;
      } else if (c.data.id === 'cmwdw5qt6cbqb' || c.data.id === 'cmwfdhecfc856') {
        totalScore += 320;
      } else if (c.data.id === 'cmwdwpfyd4xpp') {
        const cdDragons = battle.board[1].filter(m => m && hasRace(m.data, '龙族') && m.countdown !== null).length;
        totalScore += cdDragons * 185;
      } else if (c.data.id === 'cmwdwtfm8xm5c') {
        if (battle.board[1].some(m => m && m.data.type === 'minion' && hasRace(m.data, '龙族'))) totalScore += 320;
      } else if (c.data.id === 'cmwdvmwjm0301' || c.data.id === 'cmwe1tj7fh3ot') {
        totalScore += emptyLanes.length >= 2 ? 260 : 110;
      } else if (c.data.id === 'cmwdtm73fwg1u' || c.data.id === 'cmwdts32am05i' || c.data.id === 'cmwdtq4q7c8pe' || c.data.id === 'cmwdui6uam6xe' || c.data.id === 'cmwdukf0l090w' || c.data.id === 'cmwdv3usmmzyp') {
        totalScore += 280 + (c.data.atk || 1) * 35;
      }

      // 评估铺场溢出与腾格子策略：
      // 1) 若打出后预计净新增随从 > 当前空位，会对溢出随从扣分（降低优先级但不一刀切禁止）
      // 2) 若当前空位紧张 (<= 2) 且手牌中有其他想打出的铺场卡，优先打出能净腾出格子的献祭/自毁卡！
      const extraSummons = estimateAIExtraSummons(c, isEnh, choiceIdx);
      // 积极献祭奖励：如果破坏场上随从作为祭品后，新卡及衍生物让场上最终价值净提升，给予积极加分
      if (sacLanes.length > 0) {
        const sacrificedVal = sacLanes.reduce((sum, sl) => sum + (battle.board[1][sl] ? getCardCostValue(battle.board[1][sl].data) : 0), 0);
        const newTotalVal = selfValue + extraSummons * 1.5;
        const netValGain = newTotalVal - sacrificedVal;
        if (netValGain > 0) {
          totalScore += netValGain * 48;
          if (emptyLanes.length <= 1) totalScore += 260; // 满场或格子紧张时积极用献祭升级场面
        }
      }
      const selfBoardOccupy = isBoardCard ? 1 : 0;
      const selfDestroySlot = (req === 'friendly_minion' && fullTxt.includes('破坏')) ? 1 : 0;
      const netBoardDelta = selfBoardOccupy + extraSummons - sacLanes.length - selfDestroySlot;
      if (netBoardDelta > emptyLanes.length) {
        const overflowCnt = netBoardDelta - emptyLanes.length;
        totalScore -= overflowCnt * 240;
      } else if (emptyLanes.length <= 2 && netBoardDelta < 0) {
        const hasWaitingBoardCard = st.hand.some(h => {
          if (h === c) return false;
          const hTypeOk = h.data.type === 'minion' || h.data.type === 'amulet';
          const remE = st.energy - (playEval.costE || 0);
          const remB = st.bones - (playEval.costB || 0);
          return hTypeOk && (h.data.sacrifice || 0) === 0 && remE >= getEffectiveEnergy(h, st) && remB >= (h.data.bones || 0);
        });
        if (hasWaitingBoardCard) {
          totalScore += 360 + (-netBoardDelta) * 160;
        }
      }

      const allActs = [...(ast.fanfare || []), ...(ast.spellMain || []), ...(isEnh && ast.enhance ? ast.enhance.actions : [])];
      for (const act of allActs) {
        if (act.op === 'aoe_damage' || act.op === 'distribute_damage') {
          let aoeVal = 0;
          battle.board[0].forEach(pm => {
            if (!pm || pm.data.type !== 'minion') return;
            const d = act.damage || 2;
            if (!pm.activeKw['屏障'] && pm.currentHp <= d) aoeVal += 340 + analyzeMinionKillValueForAI(pm);
            else aoeVal += 75;
          });
          totalScore += aoeVal;
        } else if (act.op === 'aoe_destroy') {
          let destroyVal = 0;
          battle.board[0].forEach(pm => { if (pm && pm.data.type === 'minion') destroyVal += 360 + analyzeMinionKillValueForAI(pm); });
          if (act.bothSides) {
            battle.board[1].forEach(am => { if (am && am.data.type === 'minion') destroyVal -= 280 + getCardCostValue(am.data) * 45 + (am.currentAtk * 20); });
          }
          totalScore += destroyVal;
        } else if (act.op === 'discount_next') {
          if (st.hand.some(h => h !== c && h.data.type === 'minion')) totalScore += 340;
        } else if (act.op === 'summon' || act.op === 'recruit' || act.op === 'reanimate') {
          totalScore += (emptyLanes.length >= 2 ? 220 : 80) * (act.count || act.times || 1);
        } else if (act.op === 'buff_allies') {
          const allyCnt = battle.board[1].filter(m => m && m.data.type === 'minion' && (!act.race || hasRace(m.data, act.race))).length;
          totalScore += allyCnt * 145;
        } else if (act.op === 'draw' || act.op === 'add_hand') {
          totalScore += (st.hand.length <= 5 ? 160 : 65);
        } else if (act.op === 'leader_damage') {
          if ((act.damage || 0) + baseFaceDmg >= pst.hp) totalScore += 50000;
          else totalScore += (act.damage || 0) * 18;
        }
      }

      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestAction = {
          type: 'play_card',
          card: c,
          playEval,
          placeLane: Math.max(0, placeLane),
          sacLanes,
          effTarget,
          effTargetSide,
          choiceIdx,
          handTargetUid
        };
      }
    }

    if (!bestAction || bestScore < 0) break;

    if (bestAction.type === 'activate_minion') {
      st.energy -= (bestAction.eCost || 0);
      st.bones -= (bestAction.bCost || 0);
      bestAction.minion.activatedThisTurn = true;
      sfx.play('synergy');
      if (bestAction.minion.data.id === 'cmwgrgw6jyd8p') {
        await showTriggeredEffectToast(bestAction.minion.data, '【启动】消耗 6 骨头，发动【亡者召还_价值3】！', 240);
        await reanimateMinionAnimated(1, { value: 3 }, '', bestAction.lane, false, bestAction.minion.data.name);
      } else if (bestAction.minion.data.id === 'cmwbxu7u3tpyo') {
        await showTriggeredEffectToast(bestAction.minion.data, '【启动】将2张『电子羊』加入手牌。', 240);
        await addCardToHandAnimated(1, '电子羊', 2, bestAction.lane, bestAction.minion.data.name);
      } else if (bestAction.minion.data.id === 'cmwfdhecfc856') {
        await showTriggeredEffectToast(bestAction.minion.data, '【启动】将1张『雏龙的蛋』加入手牌。', 240);
        await addCardToHandAnimated(1, '雏龙的蛋', 1, bestAction.lane, bestAction.minion.data.name);
      } else if (bestAction.minion.data.id === 'cmwdw5qt6cbqb') {
        const wyvCrest = (st.crests || []).find(cr => cr.id === 'crest_wyvern_rider');
        if (wyvCrest) {
          wyvCrest.countdown += 1;
          await playCrestTriggerVFX(1, wyvCrest.id);
          await showTriggeredEffectToast(bestAction.minion.data, `【启动】使【${wyvCrest.name}】倒计时+1（当前倒计时 ${wyvCrest.countdown}）！`, 240);
          renderAllBattleUI();
        }
      } else if (bestAction.minion.data.id === 'cmwdzvs1woa53') {
        if (st.hand.length > 0) {
          st.hand.sort((a, b) => getCardCostValue(a.data) - getCardCostValue(b.data));
          const discarded = st.hand.shift();
          await showTriggeredEffectToast(bestAction.minion.data, `【启动】弃置『${discarded.data.name}』，获得1张『雏龙的蛋』！`, 240);
          await addCardToHandAnimated(1, '雏龙的蛋', 1, bestAction.lane, bestAction.minion.data.name);
        }
      } else if (bestAction.astAct && bestAction.astAct.actions.length > 0) {
        await executeASTActionList(1, bestAction.minion, bestAction.lane, bestAction.astAct.actions, -1, false);
      }
      await sleep(200);
    } else if (bestAction.type === 'play_card') {
      await commitCardPlayWithAnimations(
        1,
        bestAction.card,
        bestAction.playEval,
        bestAction.placeLane,
        bestAction.sacLanes,
        bestAction.effTarget,
        bestAction.choiceIdx,
        bestAction.handTargetUid,
        bestAction.effTargetSide
      );
      await sleep(260);
    }
  }

  } catch (err) {
    console.error('AI回合执行异常:', err);
  } finally {
    battle.animating = false;
  }
  if (!battle.gameOver) {
    await executeEndTurnSequence(1);
  }
}

function getFuseRuleInfo(cData) {
  const kw = (cData.keywords || []).find(k => k.k === '融合');
  const full = String(cData.fullText || '') + ' ' + String(kw ? (kw.effect || kw.fcond || kw.type || '') : '');
  let label = '任意手牌';
  let matchFn = (hc) => true;

  let mCost;
  if ((mCost = full.match(/原始(?:能量)?费用(?:为)?(\d+)以下/))) {
    const maxE = Number(mCost[1]);
    label = `原始费用${maxE}以下卡牌`;
    matchFn = (hc) => (hc.data.energy || 0) <= maxE;
  } else if (full.includes('机械')) {
    label = '机械卡牌';
    matchFn = (hc) => isMechCard(hc.data);
  } else if (full.includes('亡灵')) {
    label = '亡灵卡牌';
    matchFn = (hc) => hasRace(hc.data, '亡灵');
  } else if (full.includes('龙族')) {
    label = '龙族卡牌';
    matchFn = (hc) => hasRace(hc.data, '龙族');
  }
  const reduceMatch = full.match(/能量(?:费用)?-(\d+)/);
  const costReducePerCard = reduceMatch ? Number(reduceMatch[1]) : 0;
  return { label, matchFn, costReducePerCard };
}

function getCardGrantedEffectsList(inst, location) {
  const list = [];
  if (!inst) return list;
  const c = inst.data;
  const st = battle.leaders[inst.owner];

  if (inst.grantedEffects && inst.grantedEffects.length > 0) {
    inst.grantedEffects.forEach(txt => list.push(txt));
  }

  if ((inst.fusedCount || 0) > 0) {
    if (c.id === 'cmwd6zdfog6ux') {
      list.push(`来源：【${c.name}·融合】 → 已融合 ${inst.fusedCount} 张卡牌（能量费用 -${inst.costReduction || inst.fusedCount}）`);
    } else if (c.id === 'cmwdi4pwz3c0k') {
      list.push(`来源：【${c.name}·融合】 → 已融合 ${inst.fusedCount} 张机械卡牌（打出时额外召唤2个『电子羊』）`);
    } else if (c.id === 'cmwdibvlbqmxv') {
      list.push(`来源：【${c.name}·融合】 → 已融合 ${inst.fusedCount} 张原始费用3以下卡牌`);
    } else {
      list.push(`来源：【${c.name}·融合】 → 已融合 ${inst.fusedCount} 张手牌`);
    }
  }

  if (location === 'hand' && c.type === 'minion' && isMechCard(c) && st && st.nextMechDiscount > 0) {
    list.push(`来源：【铜壳瓢虫】 → 本回合下一张机械随从卡能量费用 -${st.nextMechDiscount}`);
  }

  const baseKws = new Set((c.keywords || []).map(k => k.k));
  Object.keys(inst.activeKw || {}).forEach(k => {
    if (!baseKws.has(k)) {
      const alreadyMentioned = list.some(item => item.includes(`【${k}`));
      if (!alreadyMentioned) {
        list.push(`来源：【战场效果赋予】 → 获得词条【${k}${k === '荆棘' || k === '多重攻击' ? '_' + inst.activeKw[k] : ''}】`);
      }
    }
  });

  return list;
}


const KEYWORD_GLOSSARY = {
  '入场曲': '从手牌打出进入战场时触发的能力（由招募、亡者召还或衍生物召唤进场时不触发）。',
  '谢幕曲': '随从或护符在战场上被破坏送入墓地时触发的能力；被【消失】时不触发。',
  '守护': '敌方随从直接攻击我方主战者时，若该列为空位，我方具有【守护】的随从会自动横移至该列拦截攻击。',
  '飞行': '攻击时可以越过不具有【防空】的敌方随从，直接攻击敌方主战者。',
  '防空': '可以阻挡具有【飞行】的敌方随从越过自己直接攻击主战者。',
  '灵气': '无法被敌方的法术卡指定为目标。',
  '潜行': '直到自身进行攻击前，无法被敌方随从或法术指定为目标。',
  '毁灭': '受到本随从攻击伤害的敌方随从会被直接破坏（即使未降到0血，屏障抵挡除外）。',
  '荆棘': '【荆棘_X】受到敌方随从的战斗伤害时，对攻击者造成 X 点反伤。',
  '虹吸': '对敌方随从或主战者造成战斗伤害时，为己方主战者回复等量生命值。',
  '屏障': '抵挡该随从下一次受到的伤害（抵挡后【屏障】消失）。',
  '位移': '每次攻击结束后自动向右侧空位移动一格；若触底或被阻挡则转向左侧移动。',
  '多重攻击': '【多重攻击_X】每回合自动攻击结算时，可连续进行 X 次攻击。',
  '两侧攻击': '攻击时改为同时打击正前方左右相邻的两列敌方单位。',
  '三侧攻击': '攻击时改为同时打击正前方与左右相邻共三列敌方单位。',
  '全体攻击': '攻击时打击敌方场上所有随从（若具备飞行且前方无防空，则同时直击主战者）。',
  '倒计时': '【倒计时_X】每当自己的回合开始时倒计时 -1；归零时破坏（或触发变身）。',
  '启动': '在自己回合内，点击场上该卡牌的详细面板即可支付对应费用主动发动（每回合限1次）。',
  '融合': '在自己回合内，点击手牌中该卡牌的详细面板即可将手牌中的指定素材与之融合（每回合限1次）。',
  '抉择': '打出时从多个分支能力中选择 1 项发动。',
  '连击': '【连击_X】若这是本回合己方使用的第 X 张以上卡牌，则触发强化效果。',
  '爆能强化': '【爆能强化_资源X】若当前拥有 X 以上对应资源，打出时自动支付 X 费用并发动强化效果。',
  '瞬念召唤': '满足特定条件时，在回合结束阶段自动从牌库直接召唤到战场上。',
  '招募': '从己方牌库中随机召唤 1 张满足条件的随从（优先最高价值）。按【价值X】判定时不限费用体系；按【能量X/祭品X/骨头X】等价值以外费用体系判定时，仅限召唤该单一费用体系的随从。',
  '亡者召还': '从己方墓地中复活 1 张满足条件的随从（优先最高价值）。按【价值X】判定时不限费用体系；按【能量X/祭品X/骨头X】等价值以外费用体系判定时，仅限复活该单一费用体系的随从。',
  '消失': '直接移出本局对战，不进入墓地、不增加骨头且不触发【谢幕曲】。',
  '随从进场时': '无论从手牌打出还是被效果召唤进入战场，都会立即触发。',
  '回合开始时': '己方回合开始、抽牌后自动触发的效果。',
  '回合结束时': '在己方回合结束结算阶段触发。',
  '攻击时': '该随从每次发起攻击前触发。',
  '纹章': '附着在主战者身上的持久/倒计时效果徽记，上限5个，同名不叠加。'
};

let detailNavStack = [];

function formatInteractiveDetailHTML(rawText, currentCardName = '') {
  let safe = String(rawText || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const placeholders = [];
  const stash = (html) => {
    const tok = `@@CFTOK_${placeholders.length}@@`;
    placeholders.push(html);
    return tok;
  };

  // 1. 关键词 pill: 【xxx】
  safe = safe.replace(/【([^】]+)】/g, (full, inner) => {
    const baseKw = inner.split('_')[0].split('：')[0].trim();
    const matchedKey = Object.keys(KEYWORD_GLOSSARY).find(k => baseKw === k || baseKw.startsWith(k));
    if (matchedKey) {
      return stash(`<button type="button" class="cf-kw-link" data-kw="${matchedKey}" title="点击查看【${matchedKey}】词条说明">【${inner}】</button>`);
    }
    return stash(`<span class="px-1 rounded bg-amber-950/70 border border-amber-500/40 text-amber-200 font-bold">【${inner}】</span>`);
  });

  // 2. 显式卡牌名 pill: 『xxx』
  safe = safe.replace(/『([^』]+)』/g, (full, cName) => {
    const targetCard = allCards.find(x => x.name === cName);
    if (targetCard && cName !== currentCardName) {
      return stash(`<button type="button" class="cf-card-link" data-card-name="${cName}" title="点击查看『${cName}』卡牌详情">『${cName}』</button>`);
    }
    return stash(`<span class="text-cyan-300 font-black">『${cName}』</span>`);
  });

  // 3. 自动识别未加『』的关联卡牌名（按长度降序，避免短名误截断长名）
  const refNames = allCards
    .map(x => x.name)
    .filter(n => n && n.length >= 2 && n !== currentCardName);
  const aliasMap = { '骷髅士兵': '骷髅', '狼人': '咆哮的狼人' };
  const allMatchKeys = Array.from(new Set([...refNames, ...Object.keys(aliasMap)]))
    .filter(n => n !== currentCardName)
    .sort((a, b) => b.length - a.length);
  if (allMatchKeys.length > 0) {
    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const nameRe = new RegExp('(' + allMatchKeys.map(esc).join('|') + ')', 'g');
    safe = safe.replace(/@@CFTOK_\d+@@|[^@]+/g, (seg) => {
      if (seg.startsWith('@@CFTOK_')) return seg;
      return seg.replace(nameRe, (m) => {
        const realName = aliasMap[m] || m;
        if (!allCards.some(x => x.name === realName) || realName === currentCardName) return m;
        return stash(`<button type="button" class="cf-card-link" data-card-name="${realName}" title="点击查看『${realName}』卡牌详情">『${m}』</button>`);
      });
    });
  }

  // 4. 自动识别未加【】的常见关键词（如 荆棘_2、获得毁灭）
  safe = safe.replace(/@@CFTOK_\d+@@|[^@]+/g, (seg) => {
    if (seg.startsWith('@@CFTOK_')) return seg;
    return seg.replace(/(荆棘_\d+|防空|毁灭|疾驰|突进|守护|必杀|吸血|潜伏|爆能强化_[^，。\n]+)/g, (kwText) => {
      const baseKw = kwText.split('_')[0].trim();
      const matchedKey = Object.keys(KEYWORD_GLOSSARY).find(k => baseKw === k || baseKw.startsWith(k));
      if (!matchedKey) return kwText;
      return stash(`<button type="button" class="cf-kw-link" data-kw="${matchedKey}" title="点击查看【${matchedKey}】词条说明">【${kwText}】</button>`);
    });
  });

  // 5. 数值高亮 (+X/+Y, X点伤害, 倒计时-X, 骨头+X)
  safe = safe.replace(/@@CFTOK_\d+@@|[^@]+/g, (seg) => {
    if (seg.startsWith('@@CFTOK_')) return seg;
    return seg.replace(/([+-]\d+\/[+-]?\d+|倒计时[+-]\d+|骨头[+-]\d+|\d+点(?:伤害|生命值))/g, '<b class="text-emerald-300 font-black">$1</b>');
  });

  // 还原占位符
  for (let i = 0; i < placeholders.length; i++) {
    safe = safe.replace(`@@CFTOK_${i}@@`, placeholders[i]);
  }
  return safe;
}

function bindDetailInteractiveLinks(container) {
  if (!container) return;
  container.querySelectorAll('.cf-kw-link').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const kw = btn.getAttribute('data-kw');
      if (!kw || !KEYWORD_GLOSSARY[kw]) return;
      if (battle.inspectedCard) {
        if (detailNavStack.length < 8) detailNavStack.push({ type: 'card', state: battle.inspectedCard });
      }
      renderDetailKeywordGlossaryView(kw);
    };
  });
  container.querySelectorAll('.cf-card-link').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const cName = btn.getAttribute('data-card-name');
      const targetDef = allCards.find(x => x.name === cName);
      if (!targetDef) return;
      if (battle.inspectedCard && battle.inspectedCard.inst && battle.inspectedCard.inst.data.name === cName) return;
      if (battle.inspectedCard) {
        if (detailNavStack.length < 8) detailNavStack.push({ type: 'card', state: battle.inspectedCard });
      }
      const refInst = createCardInstance(targetDef.id, 0);
      openCardDetailPanel(refInst, 'ref', 0, -1, null, true);
    };
  });
}

function renderDetailKeywordGlossaryView(kw) {
  const panel = document.getElementById('svDetailPanel');
  if (!panel) return;
  document.getElementById('detEnergyBadge').textContent = '📖';
  document.getElementById('detCardName').textContent = `关键词 · 【${kw}】`;
  document.getElementById('detCardSub').textContent = '词条机制说明（随时点击右上角 ✕ 关闭回到对战）';
  document.getElementById('detCostsRow').innerHTML = `<button type="button" id="btnDetNavBack" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-amber-400/60 text-amber-200 font-black text-xs cursor-pointer">◀ 返回上一张卡牌</button>`;
  document.getElementById('detStatsRow').innerHTML = '';
  const segBox = document.getElementById('detSegmentedEffects');
  segBox.innerHTML = `<div class="p-3 rounded-xl bg-amber-950/40 border border-amber-400/60 text-amber-100 text-sm leading-relaxed font-bold">${KEYWORD_GLOSSARY[kw]}</div>`;
  document.getElementById('detGrantedEffectsWrap')?.classList.add('hidden');
  document.getElementById('detActionBox')?.classList.add('hidden');
  document.getElementById('btnDetNavBack')?.addEventListener('click', (e) => {
    e.stopPropagation();
    popDetailNavStack();
  });
  panel.classList.remove('hidden');
}

function popDetailNavStack() {
  const prev = detailNavStack.pop();
  if (!prev) {
    battle.inspectedCard = null;
    document.getElementById('svDetailPanel')?.classList.add('hidden');
    return;
  }
  if (prev.type === 'card' && prev.state) {
    const s = prev.state;
    openCardDetailPanel(s.inst, s.location, s.side, s.lane, null, true);
  }
}

function openCardDetailPanel(inst, location, side, lane, anchorEl = null, keepStack = false) {
  document.querySelectorAll('.sv-hand-card.is-inspected').forEach(el => el.classList.remove('is-inspected'));
  if (inst && inst.uid) {
    const hEl = document.querySelector(`#playerHandZone .sv-hand-card[data-card-uid="${inst.uid}"]`);
    if (hEl) hEl.classList.add('is-inspected');
  }
  if (!keepStack) detailNavStack = [];
  battle.inspectedCard = { inst, location, side, lane };
  const panel = document.getElementById('svDetailPanel');
  const c = inst.data;
  const pst = battle.leaders[inst.owner] || battle.leaders[0];
  const playEval = location === 'hand' ? evaluateCardPlayState(inst.owner, inst) : { mode: 'normal', activeSection: '' };

  const logPanel = document.getElementById('battleRecordPanel');
  const isLogOpen = logPanel && !logPanel.classList.contains('hidden');
  if (location === 'log' || isLogOpen) {
    const refRect = anchorEl ? anchorEl.getBoundingClientRect() : (logPanel ? logPanel.getBoundingClientRect() : null);
    const leftPos = refRect ? Math.min(window.innerWidth - 396, Math.max(478, refRect.right + 16)) : 484;
    const topPos = refRect ? Math.min(window.innerHeight - 440, Math.max(64, refRect.top - 12)) : 82;
    panel.style.left = `${leftPos}px`;
    panel.style.top = `${topPos}px`;
  } else {
    panel.style.left = '32px';
    panel.style.top = '82px';
  }

  const effEnergy = playEval.costE !== undefined ? playEval.costE : getEffectiveEnergy(inst, pst);
  const typeLabel = c.type === 'minion' ? '随从' : (c.type === 'amulet' ? '护符' : '法术');
  document.getElementById('detEnergyBadge').textContent = effEnergy;
  document.getElementById('detCardName').textContent = c.name;
  document.getElementById('detCardSub').textContent = `${typeLabel}${c.race ? ' · ' + c.race : ''} · ${c.rarity} (价值:${getCardCostValue(c)})`;

  const costsHtml = [`<span class="${effEnergy < c.energy ? 'text-emerald-300' : 'text-sky-300'}">⚡能量 ${effEnergy}${effEnergy < c.energy ? ` (原${c.energy})` : ''}</span>`];
  if (c.sacrifice > 0) costsHtml.push(`<span class="text-rose-300">🩸祭品 ${c.sacrifice}${c.sacrificeCond ? '('+c.sacrificeCond+')' : ''}</span>`);
  if (c.bones > 0) costsHtml.push(`<span class="text-amber-300">🦴骨头 ${c.bones}</span>`);
  if (inst.countdown !== null && inst.countdown !== undefined) {
    costsHtml.push(`<span class="text-cyan-300">⏳倒计时 ${inst.countdown}</span>`);
  }
  document.getElementById('detCostsRow').innerHTML = costsHtml.join(' ');

  if (c.type === 'minion') {
    const atkBuffed = inst.currentAtk > (c.atk || 0);
    const hpBuffed = inst.currentHp > (c.hp || 1);
    const hpDamaged = inst.currentHp < inst.maxHp;
    document.getElementById('detStatsRow').innerHTML = `<span class="${atkBuffed ? 'text-emerald-300' : 'text-sky-300'}">⚔️ ${inst.currentAtk}</span> <span class="${hpDamaged ? 'text-rose-400' : (hpBuffed ? 'text-emerald-300' : 'text-rose-300')}">❤️ ${inst.currentHp}/${inst.maxHp}</span>`;
  } else if (c.type === 'amulet') {
    document.getElementById('detStatsRow').innerHTML = `<span class="text-emerald-300">⛩️ 护符${inst.countdown !== null ? ` · ⏳${inst.countdown}` : ''}</span>`;
  } else {
    document.getElementById('detStatsRow').innerHTML = `<span class="text-amber-300">✨ 法术</span>`;
  }

  const segBox = document.getElementById('detSegmentedEffects');
  segBox.innerHTML = '';
  if (detailNavStack.length > 0) {
    const navBar = document.createElement('div');
    navBar.className = 'flex items-center justify-between gap-2 pb-1';
    navBar.innerHTML = `<button type="button" id="btnDetCardBack" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-amber-400/60 text-amber-200 font-black text-xs cursor-pointer">◀ 返回上一页</button><span class="text-[11px] text-cyan-300 font-bold">关联卡牌查看中</span>`;
    segBox.appendChild(navBar);
    navBar.querySelector('#btnDetCardBack')?.addEventListener('click', (e) => { e.stopPropagation(); popDetailNavStack(); });
    if (location === 'ref') {
      const refFaceWrap = document.createElement('div');
      refFaceWrap.className = 'flex justify-center py-1';
      const refFace = buildHandCardDOM(c, null, 0);
      refFace.style.cursor = 'default';
      refFace.style.transform = 'scale(0.92)';
      refFace.style.transformOrigin = 'top center';
      refFaceWrap.appendChild(refFace);
      segBox.appendChild(refFaceWrap);
    }
  }
  if (c.sacrifice > 0 || c.sacrificeCond) {
    const sacBox = document.createElement('div');
    sacBox.className = 'p-2.5 rounded-xl bg-rose-950/75 border-2 border-rose-400/75 text-rose-100 text-xs font-black shadow';
    sacBox.innerHTML = `🩸 祭品条件：打出时需破坏己方场上 <span class="text-amber-300">${c.sacrifice || 1}</span> 个${c.sacrificeCond ? `「<span class="text-amber-200">${c.sacrificeCond}</span>」` : '任意'}随从`;
    segBox.appendChild(sacBox);
  }
  const curX = inst ? getDynamicCardXValue(c, inst) : null;
  const rawLines = getCardDisplayText(c, inst).split('\n').filter(Boolean);
  if (curX !== null) rawLines.push(`💡 当前 X = ${curX}`);
  rawLines.forEach(line => {
    const block = document.createElement('div');
    const isCrystalLine = line.includes('【结晶') || line.includes('【激奏');
    const isEnhanceLine = line.includes('【爆能强化') || line.includes('【连击') || line.includes('【融合】') || line.includes('若己方战场上有') || line.includes('若打出后');
    const richLine = formatInteractiveDetailHTML(line, c.name);

    if (location === 'hand' && ((playEval.activeSection === 'crystallize' || playEval.activeSection === 'accelerate') && isCrystalLine)) {
      block.className = 'p-2.5 rounded-xl bg-sky-950/90 border-2 border-cyan-300 shadow-[0_0_16px_rgba(56,189,248,0.6)] text-cyan-100 font-bold leading-relaxed';
      block.innerHTML = `<div class="text-[11px] text-cyan-300 font-black mb-1">✦ 当前打出生效分支</div><div>${richLine}</div>`;
    } else if (location === 'hand' && (playEval.glow === 'sv-glow-yellow' && (isEnhanceLine || rawLines.length === 1))) {
      block.className = 'p-2.5 rounded-xl bg-amber-950/85 border-2 border-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.55)] text-amber-100 font-bold leading-relaxed';
      block.innerHTML = `<div class="text-[11px] text-amber-300 font-black mb-1">✦ 条件已满足 · 强化生效</div><div>${richLine}</div>`;
    } else {
      block.className = 'p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-100 leading-relaxed';
      block.innerHTML = richLine;
    }
    segBox.appendChild(block);
  });
  bindDetailInteractiveLinks(segBox);

  const grantedWrap = document.getElementById('detGrantedEffectsWrap');
  const grantedListEl = document.getElementById('detGrantedEffectsList');
  grantedListEl.innerHTML = '';
  const grantedItems = getCardGrantedEffectsList(inst, location);
  if (grantedItems.length > 0) {
    grantedWrap.classList.remove('hidden');
    grantedItems.forEach((gTxt, idx) => {
      const row = document.createElement('div');
      row.className = 'px-3 py-2 rounded-lg bg-gradient-to-r from-amber-950/90 via-slate-900/95 to-slate-900/90 border-l-4 border-amber-400 border border-amber-500/35 text-amber-100 font-bold flex items-center gap-2 shadow';
      row.innerHTML = `<span class="w-4 h-4 rounded-full bg-amber-500/25 border border-amber-300 text-[10px] text-amber-200 flex items-center justify-center shrink-0">${idx + 1}</span><span>${gTxt}</span>`;
      grantedListEl.appendChild(row);
    });
  } else {
    grantedWrap.classList.add('hidden');
  }

  const actBox = document.getElementById('detActionBox');
  const actBtn = document.getElementById('btnDetailAction');
  actBox.classList.add('hidden');

  const ast = c.ast || parseCardEffectAST(c);
  const hasFuseKw = Boolean(ast.fuse || (c.keywords || []).some(kw => kw.k === '融合') || String(c.fullText || '').includes('【融合】'));
  const canControlThisSide = (side === 0 && battle.activeSide === 0) || (battleMode === 'pvp_pass' && side === battle.activeSide);

  if (canControlThisSide && !battle.gameOver && !battle.animating) {
    if (location === 'board' && (ast.activate || c.id === 'cmwdw5qt6cbqb' || c.id === 'cmwdzvs1woa53' || c.id === 'cmwfdhecfc856')) {
      actBox.classList.remove('hidden');
      const eCost = c.id === 'cmwdzvs1woa53' ? 0 : (ast.activate ? (ast.activate.energy || 0) : 1);
      const actKwObj = (c.keywords || []).find(k => k.k === "启动");
      const bCost = Number((actKwObj && actKwObj.cost && actKwObj.cost.bones) || 0);
      const sCost = Number((actKwObj && actKwObj.cost && actKwObj.cost.sacrifice) || 0);
      let extraCondOk = true;
      let extraCondReason = '';
      if (c.id === 'cmwdw5qt6cbqb') {
        const hasCrest = (pst.crests || []).some(cr => cr.id === 'crest_wyvern_rider');
        if (!hasCrest) { extraCondOk = false; extraCondReason = ' (无飞龙骑手纹章)'; }
      } else if (c.id === 'cmwdzvs1woa53') {
        if (pst.hand.length === 0) { extraCondOk = false; extraCondReason = ' (无手牌可弃置)'; }
      } else if (sCost > 0) {
        const sacAvail = [0,1,2,3,4].filter(sl => battle.board[side][sl] && battle.board[side][sl].data.type === 'minion' && battle.board[side][sl] !== inst).length;
        if (sacAvail < sCost) { extraCondOk = false; extraCondReason = ' (场上祭品不足)'; }
      }
      const canAct = !inst.activatedThisTurn && pst.energy >= eCost && pst.bones >= bCost && extraCondOk && (battleMode !== 'pvp_online' || onlineIsMyTurn());
      actBtn.disabled = !canAct;
      const costLbl = [eCost > 0 ? `能量${eCost}` : '', sCost > 0 ? `祭品${sCost}` : '', bCost > 0 ? `骨头${bCost}` : ''].filter(Boolean).join(' ') || '能量0';
      actBtn.textContent = inst.activatedThisTurn ? '本回合已发动【启动】' : `⚡ 启动 (消耗${costLbl})${extraCondReason}`;
      actBtn.onclick = async () => {
        if (!canAct) return;
        if (c.id === 'cmwdzvs1woa53') {
          openSingleHandPickModal(inst, [...pst.hand], '【龙心秘宝·启动】请选择 1 张手牌将其弃置，并获得 1 张『雏龙的蛋』', async (discardedCard) => {
            sfx.play('synergy');
            inst.activatedThisTurn = true;
            const dIdx = pst.hand.indexOf(discardedCard);
            if (dIdx !== -1) pst.hand.splice(dIdx, 1);
            await showTriggeredEffectToast(c, `【启动】弃置『${discardedCard.data.name}』，将1张『雏龙的蛋』加入手牌！`, 260);
            await addCardToHandAnimated(side, '雏龙的蛋', 1, lane, c.name);
            openCardDetailPanel(inst, 'board', side, lane);
            renderAllBattleUI();
            if (battleMode === 'pvp_online' && onlineIsMyTurn()) {
              broadcastOnlineSync('ACTION', `发动了『${c.name}』的【启动】能力`, { cid: c.id, cardType: 'activate' });
            }
          });
          return;
        }
        sfx.play('synergy');
        pst.energy -= eCost;
        pst.bones -= bCost;
        inst.activatedThisTurn = true;
        if (c.id === 'cmwbxu7u3tpyo') {
          await showTriggeredEffectToast(c, '【启动】将2张『电子羊』加入手牌。', 240);
          await addCardToHandAnimated(side, '电子羊', 2, lane, c.name);
        } else if (c.id === 'cmwfdhecfc856') {
          await showTriggeredEffectToast(c, '【启动】将1张『雏龙的蛋』加入手牌。', 240);
          await addCardToHandAnimated(side, '雏龙的蛋', 1, lane, c.name);
        } else if (c.id === 'cmwfdugclc9w9') {
          await showTriggeredEffectToast(c, '【启动】召唤1个『怨灵』到己方战场上！', 240);
          await summonByNameAnimated(side, '怨灵', 1, lane, false, c.name);
        } else if (c.id === 'cmwfg76dbmxry') {
          await showTriggeredEffectToast(c, '【启动】消耗2骨头，将2张『咆哮的狼人』洗入牌库！', 240);
          for (let wi = 0; wi < 2; wi++) st.deck.push(createCardInstance(c, side));
          st.deck.sort(() => Math.random() - 0.5);
        } else if (c.id === 'cmwfhe6xv5el7') {
          await showTriggeredEffectToast(c, '【启动】【亡者召还_价值2】', 240);
          await reanimateMinionAnimated(side, { value: 2 }, '', typeof targetLane !== 'undefined' ? targetLane : (typeof lane !== 'undefined' ? lane : -1), false, (typeof card !== 'undefined' && card.data ? card.data.name : (typeof c !== 'undefined' ? c.name : '冥河引渡人')));
        } else if (c.id === 'cmwgrgw6jyd8p') {
          await showTriggeredEffectToast(c, '【启动】消耗 6 骨头，发动【亡者召还_价值3】！', 240);
          await reanimateMinionAnimated(side, { value: 3 }, '', lane, false, c.name);
        } else if (c.id === 'cmwgchn8wmoi5') {
          await showTriggeredEffectToast(c, '【启动】消耗1点能量，召唤1个『怨灵』！', 240);
          await summonByNameAnimated(side, '怨灵', 1, lane, false, c.name);
        } else if (c.id === 'cmwgepbm7hzy9') {
          const sacCands = [0,1,2,3,4].filter(sl => battle.board[side][sl] && battle.board[side][sl].data.type === 'minion' && battle.board[side][sl] !== inst);
          if (sacCands.length > 0) {
            sacCands.sort((a, b) => compareTributeCandidatesForAI(battle.board[side][a], battle.board[side][b]));
            await showTriggeredEffectToast(c, `【启动】献祭『${battle.board[side][sacCands[0]].data.name}』，召唤1个『狼少女』！`, 240);
            await destroyMinionAnimated(side, sacCands[0], true);
            await summonByNameAnimated(side, 'cmwgepbm7hzy9', 1, lane, false, c.name);
          }
        } else if (c.id === 'cmwdw5qt6cbqb') {
          const wyvCrest = (pst.crests || []).find(cr => cr.id === 'crest_wyvern_rider');
          if (wyvCrest) {
            wyvCrest.countdown += 1;
            await playCrestTriggerVFX(side, wyvCrest.id);
            await showTriggeredEffectToast(c, `【启动】使【${wyvCrest.name}】倒计时+1（当前倒计时 ${wyvCrest.countdown}）！`, 260);
          }
        } else if (ast.activate && ast.activate.actions.length > 0) {
          await executeASTActionList(side, inst, lane, ast.activate.actions, -1, false);
        }
        openCardDetailPanel(inst, 'board', side, lane);
        renderAllBattleUI();
        if (battleMode === 'pvp_online' && onlineIsMyTurn()) {
          broadcastOnlineSync('ACTION', `发动了『${c.name}』的【启动】能力`, { cid: c.id, cardType: 'activate' });
        }
      };
    } else if (location === 'hand' && hasFuseKw) {
      actBox.classList.remove('hidden');
      const fuseInfo = getFuseRuleInfo(c);
      const validMaterials = pst.hand.filter(h => h !== inst && fuseInfo.matchFn(h));
      const canFuse = !inst.fusedThisTurn && validMaterials.length > 0;
      actBtn.disabled = !canFuse;
      actBtn.textContent = inst.fusedThisTurn
        ? `本回合已【融合】(累计融合 ${inst.fusedCount || 0} 张)`
        : (validMaterials.length === 0 ? `🧬 融合 (手牌无符合条件的${fuseInfo.label})` : `🧬 融合 (${fuseInfo.label} · 可选${validMaterials.length}张)`);
      actBtn.onclick = () => {
        if (!canFuse) return;
        sfx.play('click');
        openMultiFuseModal(inst, validMaterials, fuseInfo);
      };
    }
  }

  panel.classList.remove('hidden');
}

function executeCardFusionLogic(side, sourceInst, fusedHandCards) {
  if (!sourceInst || !fusedHandCards || fusedHandCards.length === 0) return;
  const st = battle.leaders[side];
  const count = fusedHandCards.length;
  const uidSet = new Set(fusedHandCards.map(h => h.uid));
  const fusedNames = fusedHandCards.map(h => h.data.name).join('、');
  st.hand = st.hand.filter(h => !uidSet.has(h.uid));
  sourceInst.fusedThisTurn = true;
  sourceInst.fusedCount = (sourceInst.fusedCount || 0) + count;
  addGrantedEffect(sourceInst, `来源：【融合素材：${fusedNames}】 → 融合张数 +${count}`);

  const fuseInfo = getFuseRuleInfo(sourceInst.data);
  if (fuseInfo.costReducePerCard > 0) {
    const red = fuseInfo.costReducePerCard * count;
    sourceInst.costReduction = (sourceInst.costReduction || 0) + red;
  }
  const fuseCardIcon = { id: 'sys_fusion', name: '敌方融合', type: 'spell', rarity: '史诗', energy: 0, bones: 0, sacrifice: 0 };
  const fuseEffectDesc = `敌方发动【融合】（消耗 ${count} 张手牌素材${fuseInfo.costReducePerCard > 0 ? '，目标卡牌能量费用减少' : ''}）`;
  if (side === 1) {
    showTriggeredEffectToast(fuseCardIcon, fuseEffectDesc, 260);
  }
  if (battleMode === 'pvp_online' && onlineIsMyTurn()) {
    recordLocalVfx({ kind: 'toast', cid: 'sys_fusion', cardData: fuseCardIcon, msg: fuseEffectDesc });
    broadcastOnlineSync('ACTION', `对手发动了【融合】（消耗 ${count} 张手牌素材）`, { cid: 'sys_fusion', cardType: 'fuse' });
  }
}

function openMultiFuseModal(sourceInst, validMaterials, fuseInfo = null) {
  battle.multiFuseUids.clear();
  const info = fuseInfo || getFuseRuleInfo(sourceInst.data);
  const modal = document.getElementById('handPickModal');
  document.getElementById('handPickSourceTitle').textContent = `【融合】${sourceInst.data.name}`;
  document.getElementById('handPickSourceDesc').textContent = `素材要求：${info.label}
选择1张或多张手牌进行融合，被融合的手牌将直接消失并触发融合强化效果（每张卡每回合限融合1次）。`;
  const confirmBtn = document.getElementById('btnConfirmMultiFuse');
  confirmBtn.classList.remove('hidden');

  const renderGrid = () => {
    document.getElementById('handPickPromptTitle').textContent = `🧬 请点击勾选要融合的「${info.label}」（已选 ${battle.multiFuseUids.size} 张）`;
    const grid = document.getElementById('handPickCardsGrid');
    grid.innerHTML = '';
    validMaterials.forEach(hc => {
      const cardEl = buildHandCardDOM(hc.data, hc);
      cardEl.classList.add('hand-pick-card-item', 'interactive-zone', 'pointer-events-auto');
      cardEl.style.cursor = 'pointer';
      if (battle.multiFuseUids.has(hc.uid)) {
        cardEl.classList.add('sv-glow-yellow');
      }
      cardEl.addEventListener('click', (e) => {
        e.stopPropagation();
        sfx.play('click');
        if (battle.multiFuseUids.has(hc.uid)) battle.multiFuseUids.delete(hc.uid);
        else battle.multiFuseUids.add(hc.uid);
        renderGrid();
      });
      grid.appendChild(cardEl);
    });
  };
  renderGrid();

  confirmBtn.onclick = async (e) => {
    e.stopPropagation();
    if (battle.multiFuseUids.size === 0) return;
    modal.classList.add('hidden');
    const pst = battle.leaders[sourceInst.owner] || battle.leaders[0];
    const chosen = pst.hand.filter(h => battle.multiFuseUids.has(h.uid));
    const count = chosen.length;
    executeCardFusionLogic(sourceInst.owner, sourceInst, chosen);
    sfx.play('synergy');

    let toastMsg = `【融合】已融合 ${count} 张卡牌（累计融合 ${sourceInst.fusedCount} 张）！`;
    if (info.costReducePerCard > 0) {
      toastMsg = `【融合】已融合 ${count} 张卡牌，本卡能量费用 -${info.costReducePerCard * count}！`;
    }
    await showTriggeredEffectToast(sourceInst.data, toastMsg, 300);
    openCardDetailPanel(sourceInst, 'hand', sourceInst.owner, -1);
    renderAllBattleUI();
  };

  modal.classList.remove('hidden');
}

document.getElementById('btnCloseDetail').addEventListener('click', () => {
  sfx.play('click');
  battle.inspectedCard = null;
  document.getElementById('svDetailPanel').classList.add('hidden'); document.querySelectorAll('#playerHandZone .sv-hand-card.is-inspected').forEach(el => el.classList.remove('is-inspected'));
});

let statusIconCycleTick = 0;
setInterval(() => {
  statusIconCycleTick = (statusIconCycleTick + 1) % 120;
  document.querySelectorAll('.sv-bottom-status-badge[data-icon-count]').forEach(badge => {
    const cnt = parseInt(badge.dataset.iconCount || '1', 10);
    if (cnt <= 1) return;
    const activeIdx = statusIconCycleTick % cnt;
    Array.from(badge.children).forEach((child, idx) => {
      child.classList.toggle('active-icon', idx === activeIdx);
    });
  });
}, 1050);

function getRarityClass(rarity) {
  switch (rarity) {
    case '传说': return 'sv-rarity-legend';
    case '史诗': return 'sv-rarity-epic';
    case '稀有': return 'sv-rarity-rare';
    default:     return 'sv-rarity-common';
  }
}

function getRarityBadgeClass(rarity) {
  switch (rarity) {
    case '传说': return 'sv-rarity-badge-legend';
    case '史诗': return 'sv-rarity-badge-epic';
    case '稀有': return 'sv-rarity-badge-rare';
    default:     return 'sv-rarity-badge-common';
  }
}

function getFollowerBottomIcons(inst) {
  const c = inst.data;
  const full = String(c.fullText || c.text || '');
  const icons = [];
  if (hasAnyLastWords(inst)) icons.push({ icon: '💀', tip: '谢幕曲' });
  if (full.includes('回合开始时') || (c.keywords || []).some(k => k.k === '回合开始时')) {
    icons.push({ icon: '🌅', tip: '回合开始时' });
  }
  if ((c.ast && c.ast.turnEnd && c.ast.turnEnd.length > 0) || full.includes('回合结束时') || (c.keywords || []).some(k => k.k === '回合结束时')) {
    icons.push({ icon: '⏳', tip: '回合结束时' });
  }
  if (inst.grantedOnAttackAoe4 || (c.ast && c.ast.onAttack && c.ast.onAttack.length > 0) || full.includes('攻击时') || inst.activeKw['全体攻击'] || inst.activeKw['三侧攻击'] || inst.activeKw['两侧攻击'] || (inst.activeKw['多重攻击'] && inst.activeKw['多重攻击'] > 1)) {
    icons.push({ icon: '⚔️', tip: '攻击触发/特殊攻击' });
  }
  if (inst.activeKw['毁灭']) icons.push({ icon: '☠️', tip: '毁灭' });
  if (inst.activeKw['位移']) icons.push({ icon: '↔️', tip: '位移' });
  if (inst.activeKw['荆棘']) icons.push({ icon: '🌵', tip: `荆棘_${inst.activeKw['荆棘']}` });
  if (inst.activeKw['虹吸']) icons.push({ icon: '🩸', tip: '虹吸' });
  if ((c.ast && c.ast.onEnter && c.ast.onEnter.length > 0) || c.id === 'cmwbxu7u3tpyo' || c.id === 'cmwdw2v21c73r' || c.id === 'cmwdvrwfcy5gg' || c.id === 'cmwdzvs1woa53' || full.includes('每当') || full.includes('进入战场时') || full.includes('进入己方战场时')) {
    icons.push({ icon: '✨', tip: '持续光环/触发效果' });
  }
  if ((c.keywords || []).some(k => k.k === '启动') || (c.ast && c.ast.activate) || ['cmwbxu7u3tpyo','cmwdw5qt6cbqb','cmwdzvs1woa53','cmwfdhecfc856','cmwfdugclc9w9','cmwfg76dbmxry','cmwfhe6xv5el7','cmwgchn8wmoi5','cmwgepbm7hzy9'].includes(c.id)) {
    icons.push({ icon: '⚡', tip: '启动能力' });
  }
  return icons;
}

function buildFollowerTokenDOM(inst, side, lane) {
  const c = inst.data;
  const el = document.createElement('div');
  const rarityCls = getRarityClass(c.rarity);
  const rarityBadgeCls = getRarityBadgeClass(c.rarity);
  const classes = ['interactive-zone', 'sv-follower-token', rarityCls, 'overflow-hidden', 'flex', 'flex-col', 'justify-between'];

  classes.push(c.type === 'amulet' ? 'sv-board-amulet-token' : 'sv-board-minion-token');

  if (inst.activeKw['屏障']) classes.push('vfx-wrap-barrier');
  if (inst.activeKw['灵气']) classes.push('vfx-wrap-aura');
  if (inst.activeKw['潜行']) classes.push('vfx-wrap-stealth');
  if (inst.activeKw['飞行']) {
    classes.push('vfx-wrap-flying');
    const phaseMs = Math.floor(performance.now() % 2100);
    el.style.animationDelay = `-${phaseMs}ms`;
  }

  const pp = battle.pendingPlay;
  const actSide = pp && pp.side !== undefined ? pp.side : 0;
  let isSelectedSacrifice = false;

  if (pp && side === actSide && lane >= 0) {
    if (pp.sacLanes.includes(lane)) {
      isSelectedSacrifice = true;
      classes.push('sacrificed-ghost');
    } else if (pp.step === 'SACRIFICE') {
      const validS = getValidSacrificeLanes(actSide, pp.card.data.sacrificeCond || '');
      if (validS.includes(lane)) classes.push('sacrifice-selectable');
    }
  }

  if (pp && pp.step === 'TARGET' && lane >= 0) {
    const isEnh = pp.playEval.mode === 'enhance';
    const req = getCardTargetRequirement(pp.card, isEnh, pp.choiceIdx);
    const validLocs = getValidTargetLocations(actSide, req, pp.card.data.type === 'spell', pp.sacLanes);
    if (validLocs.some(loc => loc.side === side && loc.lane === lane)) {
      classes.push('target-selectable');
    }
  }

  el.className = classes.join(' ');
  const imgUri = getAnimeIllustrationDataURI(c);
  const bottomIcons = getFollowerBottomIcons(inst);
  const activeIdx = bottomIcons.length > 0 ? (statusIconCycleTick % bottomIcons.length) : 0;
  const grantedCnt = (inst.grantedEffects || []).length;

  let surroundVfxHtml = '';
  if (inst.activeKw['守护']) {
    surroundVfxHtml += `
      <div class="vfx-guard-shield-overlay">
        <svg viewBox="0 0 146 176" class="w-full h-full">
          <defs>
            <linearGradient id="guardShieldGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.48"/>
              <stop offset="50%" stop-color="#e0f2fe" stop-opacity="0.22"/>
              <stop offset="100%" stop-color="#fbbf24" stop-opacity="0.45"/>
            </linearGradient>
          </defs>
          <path d="M73,6 L136,28 L136,88 C136,130 106,158 73,171 C40,158 10,130 10,88 L10,28 Z" fill="url(#guardShieldGrad)" stroke="#7dd3fc" stroke-width="3"/>
          <path d="M73,14 L128,33 L128,86 C128,123 101,149 73,161 C45,149 18,123 18,86 L18,33 Z" fill="none" stroke="#fde047" stroke-width="1.5" stroke-dasharray="6 4"/>
          <path d="M73,22 L73,152 M26,82 L120,82" stroke="#bae6fd" stroke-width="1.2" stroke-opacity="0.55"/>
        </svg>
      </div>`;
  }
  if (inst.activeKw['灵气']) surroundVfxHtml += `<div class="vfx-aura-ring"></div>`;
  if (inst.activeKw['潜行']) surroundVfxHtml += `<div class="vfx-stealth-mist"></div>`;
  if (inst.activeKw['飞行']) {
    surroundVfxHtml += `
      <div class="vfx-flying-wings"></div>
      <svg viewBox="0 0 146 176" class="absolute inset-0 w-full h-full pointer-events-none z-[15] opacity-85">
        <path d="M4,86 Q16,52 34,36 Q20,66 22,94 Z" fill="#7dd3fc"/>
        <path d="M142,86 Q130,52 112,36 Q126,66 124,94 Z" fill="#7dd3fc"/>
      </svg>`;
  }
  if (inst.activeKw['防空']) {
    surroundVfxHtml += `
      <div class="vfx-antiair-radar"></div>
      <svg viewBox="0 0 146 176" class="absolute inset-0 w-full h-full pointer-events-none z-[15] opacity-85">
        <circle cx="73" cy="88" r="54" fill="none" stroke="#34d399" stroke-width="1.8" stroke-dasharray="6 5"/>
        <path d="M73,16 L67,28 L79,28 Z" fill="#34d399"/>
      </svg>`;
  }

  // 高对比度、100% 不透明、z-index: 45 绝不遮挡的【倒计时】圆球徽章
  const countdownBadgeHtml = (inst.countdown !== null && inst.countdown !== undefined)
    ? `<div class="sv-countdown-orb" title="倒计时：${inst.countdown}"><span class="text-xs">⏳</span><span class="sv-stat-num text-sm text-cyan-200">${inst.countdown}</span></div>`
    : '';
  const grantedBadgeHtml = '';
  const sacSelectedOverlayHtml = isSelectedSacrifice
    ? `<div class="absolute inset-0 z-30 bg-rose-950/55 flex items-center justify-center pointer-events-none"><span class="px-2.5 py-1 rounded-full bg-rose-600 border-2 border-amber-200 text-xs font-black text-white shadow-xl">🩸已选祭品</span></div>`
    : '';

  el.innerHTML = `
    <img src="${imgUri}" class="absolute inset-0 w-full h-full object-cover" alt="${c.name}"/>
    ${surroundVfxHtml}
    ${inst.justEnteredLegendVfx ? `<div class="legend-oncard-vfx"></div>` : ''}
    ${countdownBadgeHtml}
    ${grantedBadgeHtml}
    ${sacSelectedOverlayHtml}
    <div class="relative z-20 flex items-center justify-center pt-1.5 px-1.5">
      <span class="text-[10.5px] font-black text-white bg-slate-950/90 px-2.5 py-0.5 rounded-full border border-amber-300/45 truncate max-w-full text-center shadow">${c.name}</span>
    </div>
    <div class="flex-1"></div>
    ${c.type === 'amulet' ? `
      <div class="relative z-20 flex items-center justify-between px-2 pb-1.5">
        <span class="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-400 text-[10px] font-black text-emerald-200 shadow">⛩️ ${c.race || '护符'}</span>
        ${bottomIcons.length > 0 ? `
          <div class="sv-bottom-status-badge" data-icon-count="${bottomIcons.length}" title="${bottomIcons.map(x => x.tip).join(' / ')}">
            ${bottomIcons.map((item, idx) => `<span class="sv-status-icon-item ${idx === activeIdx ? 'active-icon' : ''}">${item.icon}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    ` : `
      <div class="relative z-20 flex items-center justify-between px-1.5 pb-1.5">
        <div class="w-9 h-10 rounded-xl sv-atk-badge flex items-center justify-center text-base">
          <span class="sv-stat-num ${inst.currentAtk > (c.atk || 0) ? 'sv-stat-buff' : (inst.currentAtk < (c.atk || 0) ? 'sv-stat-debuff' : 'sv-stat-normal')}">${inst.currentAtk}</span>
        </div>
        ${bottomIcons.length > 0 ? `
          <div class="sv-bottom-status-badge" data-icon-count="${bottomIcons.length}" title="${bottomIcons.map(x => x.tip).join(' / ')}">
            ${bottomIcons.map((item, idx) => `<span class="sv-status-icon-item ${idx === activeIdx ? 'active-icon' : ''}">${item.icon}</span>`).join('')}
          </div>
        ` : `<div class="w-4"></div>`}
        <div class="w-9 h-10 rounded-xl sv-hp-badge flex items-center justify-center text-base">
          <span class="sv-stat-num ${inst.currentHp < inst.maxHp ? 'sv-stat-dmg' : (inst.currentHp > (c.hp || 1) ? 'sv-stat-buff' : 'sv-stat-normal')}">${inst.currentHp}</span>
        </div>
      </div>
    `}
  `;
  return el;
}


function getDynamicCardXValue(cardData, inst = null) {
  if (!cardData || typeof battle === 'undefined' || !battle || !battle.leaders) return null;
  const side = (inst && typeof inst.side === 'number') ? inst.side : 0;
  const st = battle.leaders[side];
  if (!st) return null;
  const name = cardData.name || '';
  const hand = st.hand || [];
  if (name === '骸骨爆发') {
    return hand.filter(h => hasRace(h.data, '亡灵') && h !== inst).length;
  }
  if (name === '超载机皇') {
    return hand.filter(h => isMechCard(h.data) && h !== inst).length;
  }
  if (name === '流淌龙血的侠客') {
    return hand.filter(h => hasRace(h.data, '龙族') && h !== inst).length;
  }
  if (name === '精灵女王') {
    return st.bones || 0;
  }
  if (name === '咆哮的狼人') {
    return st.werewolfPlayedCount || 0;
  }
  return null;
}

function buildHandCardDOM(cardData, inst = null, deckBadgeCount = 0) {
  const el = document.createElement('div');
  const rarityCls = getRarityClass(cardData.rarity);
  const typeFrameCls = cardData.type === 'amulet' ? 'sv-card-type-amulet' : (cardData.type === 'spell' ? 'sv-card-type-spell' : 'sv-card-type-minion');

  el.className = `sv-hand-card ${rarityCls} ${typeFrameCls} overflow-hidden flex flex-col justify-between p-1.5 gap-1`;
  if (inst && inst.uid) el.dataset.cardUid = String(inst.uid);
  const leaderSt = inst && battle.leaders[inst.owner] ? battle.leaders[inst.owner] : (battle.leaders ? battle.leaders[0] : null);
  const effE = inst ? getEffectiveEnergy(inst, leaderSt) : cardData.energy;
  const effB = cardData.bones || 0;
  let dispE = effE;
  let dispB = effB;
  let enhCostChangedE = false;
  let enhCostChangedB = false;
  let isEnhReady = false;
  if (inst && leaderSt && battle && !battle.gameOver && (battle.activeSide === inst.owner || battleMode === 'pvp_pass')) {
    const handEval = evaluateCardPlayState(inst.owner, inst);
    if (handEval.ok && handEval.mode === 'enhance') {
      isEnhReady = true;
      if (handEval.costE !== undefined && handEval.costE !== effE) {
        dispE = handEval.costE;
        enhCostChangedE = true;
      }
      if (handEval.costB !== undefined && handEval.costB !== effB) {
        dispB = handEval.costB;
        enhCostChangedB = true;
      }
    }
  }

  const costCircles = [];
  if (dispE > 0 || (cardData.sacrifice === 0 && dispB === 0)) {
    costCircles.push(`<span class="sv-cost-circle sv-cost-energy ${enhCostChangedE ? 'sv-cost-enhanced' : ''}" title="${enhCostChangedE ? `爆能强化能量费用 ${dispE}（原 ${effE}）` : `能量费用 ${dispE}`}">${dispE}</span>`);
  }
  if (cardData.sacrifice > 0) {
    costCircles.push(`<span class="sv-cost-circle sv-cost-sac" title="献祭祭品 ${cardData.sacrifice}">${cardData.sacrifice}</span>`);
  }
  if (dispB > 0) {
    costCircles.push(`<span class="sv-cost-circle sv-cost-bones ${enhCostChangedB ? 'sv-cost-enhanced' : ''}" title="${enhCostChangedB ? `爆能强化骨头费用 ${dispB}（原 ${effB}）` : `骨头费用 ${dispB}`}">${dispB}</span>`);
  }

  const initCd = inst && inst.countdown !== null ? inst.countdown : getInitialCountdown(cardData);
  const rarityMap = {
    '普通': '<span class="sv-rarity-circle sv-rc-common" title="普通">◆</span>',
    '稀有': '<span class="sv-rarity-circle sv-rc-rare" title="稀有">★</span>',
    '史诗': '<span class="sv-rarity-circle sv-rc-epic" title="史诗">❖</span>',
    '传说': '<span class="sv-rarity-circle sv-rc-legend" title="传说">♛</span>'
  };
  const rarityCircle = rarityMap[cardData.rarity] || rarityMap['普通'];
  const typeBadgeTxt = cardData.type === 'minion' ? '⚔️ 随从' : (cardData.type === 'amulet' ? '⛩️ 护符' : '✨ 法术');
  const raceTxt = cardData.race ? cardData.race : '无种族';

  const atkVal = inst ? inst.currentAtk : cardData.atk;
  const hpVal = inst ? inst.currentHp : cardData.hp;
  const maxHpVal = inst ? inst.maxHp : cardData.hp;
  const cardVal = getCardCostValue(cardData);
  const valTxt = formatCardValueText(cardVal);
  const imgUri = getAnimeIllustrationDataURI(cardData);

  el.innerHTML = `
    <div class="relative z-10 flex items-center justify-between gap-1 flex-nowrap">
      <div class="flex items-center gap-1 flex-nowrap">${costCircles.join('')}</div>
      ${rarityCircle}
    </div>

    <div class="relative z-10 bg-slate-950/90 border border-amber-400/40 rounded-md px-1.5 py-0.5 text-[11px] font-black text-white leading-tight text-center line-clamp-2 min-h-[26px] flex items-center justify-center shadow">
      ${cardData.name}
    </div>

    <div class="sv-card-art-box relative rounded-lg overflow-hidden border-2 border-amber-300/40 flex-1 min-h-[84px]">
      <img src="${imgUri}" class="w-full h-full object-cover" alt="${cardData.name}"/>
      ${deckBadgeCount > 0 ? `<span class="absolute top-1 right-1 z-20 px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] shadow">×${deckBadgeCount}</span>` : ''}
      ${isEnhReady ? `<span class="sv-enhance-chip absolute top-1 right-1 z-20 px-1.5 py-0.5 rounded-full font-black text-[9px] shadow">⚡爆能</span>` : ''}
      ${(inst && getDynamicCardXValue(cardData, inst) !== null) ? `<span class="absolute top-1 left-1 z-20 px-1.5 py-0.5 rounded-md bg-indigo-950/95 border border-cyan-300 text-[10px] font-black text-cyan-200 shadow" title="当前 X 数值">X=${getDynamicCardXValue(cardData, inst)}</span>` : ''}
      ${initCd > 0 ? `<span class="absolute bottom-1 right-1 z-20 px-1.5 py-0.5 rounded-full bg-cyan-950/95 border border-cyan-300 text-[10px] font-black text-cyan-200 shadow">⏳${initCd}</span>` : ''}
    </div>

    <div class="relative z-10 sv-card-type-race-strip">
      <span>${typeBadgeTxt}</span>
      <span class="text-slate-500">·</span>
      <span class="text-amber-200/95 truncate">${raceTxt}</span>
    </div>

    ${cardData.type === 'minion' ? `
      <div class="relative z-10 flex items-center justify-between px-0.5 h-[28px]">
        <div class="w-7 h-7 rounded-lg sv-atk-badge flex items-center justify-center text-sm shrink-0">
          <span class="sv-stat-num ${atkVal > (cardData.atk || 0) ? 'sv-stat-buff' : (atkVal < (cardData.atk || 0) ? 'sv-stat-debuff' : 'sv-stat-normal')}">${atkVal}</span>
        </div>
        <div class="sv-value-badge shrink-0" title="卡牌价值 ${valTxt}（能量×1 + 祭品×1.5 + 骨头×0.5）">${valTxt}</div>
        <div class="w-7 h-7 rounded-lg sv-hp-badge flex items-center justify-center text-sm shrink-0">
          <span class="sv-stat-num ${inst && hpVal < maxHpVal ? 'sv-stat-dmg' : (hpVal > (cardData.hp || 1) ? 'sv-stat-buff' : 'sv-stat-normal')}">${hpVal}</span>
        </div>
      </div>
    ` : `
      <div class="relative z-10 flex items-center justify-center px-0.5 h-[28px]">
        <div class="sv-value-badge shrink-0" title="卡牌价值 ${valTxt}（能量×1 + 祭品×1.5 + 骨头×0.5）">${valTxt}</div>
      </div>
    `}
  `;
  return el;
}


function openCrestDetailPanel(cr, side) {
  const panel = document.getElementById('svDetailPanel');
  if (!panel || !cr) return;
  const hasCd = (cr.countdown !== null && cr.countdown !== undefined);
  document.getElementById('detEnergyBadge').textContent = hasCd ? String(cr.countdown) : '∞';
  document.getElementById('detCardName').textContent = cr.name || '主战者纹章';
  document.getElementById('detCardSub').textContent = `${side === 0 ? '我方' : '敌方'}主战者纹章 · ${hasCd ? `剩余倒计时 ${cr.countdown} 回合` : '永久生效'}`;
  document.getElementById('detCostsRow').innerHTML = hasCd
    ? `<span class="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-400 text-cyan-200 font-black text-xs">⏳ 倒计时 ${cr.countdown}</span>`
    : `<span class="px-2 py-0.5 rounded-full bg-amber-950 border border-amber-400 text-amber-200 font-black text-xs">♾️ 永久纹章</span>`;
  document.getElementById('detStatsRow').innerHTML = '';
  const segBox = document.getElementById('detSegmentedEffects');
  const srcName = cr.cardData ? cr.cardData.name : '';
  const descHtml = formatInteractiveDetailHTML(cr.desc || '（无效果说明）', '');
  const srcHtml = srcName ? `<div class="mt-2 pt-2 border-t border-slate-700/80 text-xs text-slate-300">来源卡牌：${formatInteractiveDetailHTML('『' + srcName + '』', '')}</div>` : '';
  segBox.innerHTML = `<div class="p-3 rounded-xl bg-indigo-950/65 border border-amber-400/70 text-amber-100 text-sm leading-relaxed font-bold">${descHtml}${srcHtml}</div>`;
  bindDetailInteractiveLinks(segBox);
  document.getElementById('detGrantedEffectsWrap')?.classList.add('hidden');
  document.getElementById('detActionBox')?.classList.add('hidden');
  panel.classList.remove('hidden');
}

function renderCrestsRowDOM(side) {
  const row = document.getElementById(side === 0 ? 'playerCrestsRow' : 'enemyCrestsRow');
  if (!row) return;
  row.innerHTML = '';
  const st = battle.leaders[side];
  const crests = (st && st.crests) ? st.crests : [];

  for (let idx = 0; idx < 5; idx++) {
    const slot = document.createElement('div');
    slot.className = 'sv-crest-slot';
    const cr = crests[idx];
    if (!cr) {
      slot.innerHTML = `<div class="sv-crest-empty"><span>◇</span><span>◇</span></div>`;
    } else {
      const badge = document.createElement('div');
      badge.className = 'sv-crest-badge interactive-zone pointer-events-auto';
      badge.dataset.crestId = cr.id;
      const hasCd = (cr.countdown !== null && cr.countdown !== undefined);
      badge.title = `【${cr.name}】${hasCd ? `(倒计时 ${cr.countdown})` : '(永久纹章)'}\n${cr.desc}`;
      const imgUri = cr.cardData ? getAnimeIllustrationDataURI(cr.cardData) : '';
      badge.innerHTML = `
        ${imgUri ? `<img src="${imgUri}" class="w-full h-full object-cover rounded-full opacity-95"/>` : `<span class="text-lg">🛡️</span>`}
        ${hasCd ? `<span class="sv-crest-num-gem">${cr.countdown}</span>` : ''}
      `;
      badge.addEventListener('click', (e) => {
        e.stopPropagation();
        sfx.play('click');
        openCrestDetailPanel(cr, side);
      });
      slot.appendChild(badge);
    }
    row.appendChild(slot);
  }
}

function syncGlobalAnimPhases() {
  const t = performance.now() / 1000;
  document.documentElement.style.setProperty('--anim-sync-52', `-${(t % 5.2).toFixed(3)}s`);
  document.documentElement.style.setProperty('--anim-sync-38', `-${(t % 3.8).toFixed(3)}s`);
}
function renderAllBattleUI() {
  document.getElementById('playerLeaderNode')?.classList.toggle('hand-expanded-hp', !battle.handCollapsed);
  syncGlobalAnimPhases();
  const pst = battle.leaders[0];
  const est = battle.leaders[1];
  if (!pst || !est) return;

  const eHpEl = document.getElementById('uiEnemyHp');
  eHpEl.textContent = est.hp;
  eHpEl.style.color = est.hp < (est.maxHp || 30) ? '#ff4d6d' : '#ffffff';
  document.getElementById('uiEnemyBones').textContent = est.bones;
  document.getElementById('uiEnemyHandCnt').textContent = est.hand.length;
  document.getElementById('uiEnemyDeckCnt').textContent = est.deck.length;
  const edv = document.getElementById('uiEnemyDeckVisualCnt'); if (edv) edv.textContent = est.deck.length;
  document.getElementById('uiEnemyGraveCnt').textContent = est.graveyard.length;
  document.getElementById('uiEnemyLWCnt').textContent = est.destroyedLastWordsCount;
  document.getElementById('uiEnemyEnergy').textContent = est.energy;
  document.getElementById('uiEnemyMaxEnergy').textContent = est.maxEnergy;

  const pHpEl = document.getElementById('uiPlayerHp');
  pHpEl.textContent = pst.hp;
  pHpEl.style.color = pst.hp < (pst.maxHp || 30) ? '#ff4d6d' : '#ffffff';
  document.getElementById('uiPlayerBones').textContent = pst.bones;
  document.getElementById('uiPlayerHandCnt').textContent = pst.hand.length;
  document.getElementById('uiPlayerDeckCnt').textContent = pst.deck.length;
  const pdv = document.getElementById('uiPlayerDeckVisualCnt'); if (pdv) pdv.textContent = pst.deck.length;
  document.getElementById('uiPlayerGraveCnt').textContent = pst.graveyard.length;
  document.getElementById('uiPlayerLWCnt').textContent = pst.destroyedLastWordsCount;
  document.getElementById('uiPlayerEnergy').textContent = pst.energy;
  document.getElementById('uiPlayerMaxEnergy').textContent = pst.maxEnergy;
  document.getElementById('uiPlayerCombo').textContent = pst.cardsPlayedThisTurn;
  document.getElementById('uiTurnNum').textContent = `T${battle.turn}`;

  renderCrestsRowDOM(0);
  renderCrestsRowDOM(1);

  const discTag = document.getElementById('uiMechDiscountTag');
  if (pst.nextMechDiscount > 0) discTag.classList.remove('hidden');
  else discTag.classList.add('hidden');

  const backsBox = document.getElementById('enemyHandBacks');
  backsBox.innerHTML = '';
  for (let i = 0; i < est.hand.length; i++) {
    const b = document.createElement('div');
    b.dataset.cardUid = String(est.hand[i].uid);
    b.className = 'w-10 h-14 rounded-md bg-gradient-to-b from-slate-800 to-slate-950 border border-amber-400/60 shadow flex items-center justify-center transition-all duration-150';
    if (hiddenCardUids.has(est.hand[i].uid)) b.style.opacity = '0';
    b.innerHTML = `<div class="w-5 h-5 rounded-full border border-sky-400/50 bg-sky-900/40"></div>`;
    backsBox.appendChild(b);
  }

  const orbsBox = document.getElementById('playerEnergyOrbs');
  orbsBox.innerHTML = '';
  for (let i = 1; i <= 10; i++) {
    const orb = document.createElement('div');
    if (i <= pst.energy) orb.className = 'w-3 h-3 rounded-full bg-emerald-400 border border-emerald-200 shadow-[0_0_6px_#34d399]';
    else if (i <= pst.maxEnergy) orb.className = 'w-3 h-3 rounded-full bg-slate-800 border border-emerald-500/50';
    else orb.className = 'w-3 h-3 rounded-full bg-slate-950 border border-slate-700 opacity-50';
    orbsBox.appendChild(orb);
  }

  const turnOrb = document.getElementById('btnTurnOrb');
  const mainTxt = document.getElementById('turnOrbMainTxt');
  if ((battle.activeSide === 0 || battleMode === 'pvp_pass') && !battle.gameOver) {
    turnOrb.className = 'interactive-zone w-28 h-28 rounded-full border-4 border-amber-300 bg-gradient-to-b from-sky-400 via-blue-600 to-indigo-950 hover:from-sky-300 hover:to-blue-500 shadow-[0_0_32px_rgba(56,189,248,0.75)] flex flex-col items-center justify-center transition transform active:scale-95 cursor-pointer';
    mainTxt.innerHTML = '结束<br>回合';
  } else {
    turnOrb.className = 'interactive-zone w-28 h-28 rounded-full border-4 border-amber-500/60 bg-gradient-to-b from-rose-800 via-rose-950 to-slate-950 shadow-inner flex flex-col items-center justify-center cursor-not-allowed';
    mainTxt.innerHTML = '对手<br>回合';
  }

  const eRow = document.getElementById('enemyLanesRow');
  const pRow = document.getElementById('playerLanesRow');
  eRow.innerHTML = '';
  pRow.innerHTML = '';

  const pp = battle.pendingPlay;

  for (let l = 0; l < 5; l++) {
    const eCell = document.createElement('div');
    eCell.className = 'sv-lane-cell';
    const em = battle.board[1][l];
    if (em) {
      eCell.appendChild(buildFollowerTokenDOM(em, 1, l));
    } else {
      eCell.innerHTML = `<span class="text-[10px] text-slate-600 font-bold pointer-events-none">敌方战道 ${l + 1}</span>`;
    }
    eCell.addEventListener('click', (e) => { e.stopPropagation(); onBoardLaneClicked(1, l); });
    eRow.appendChild(eCell);

    const pCell = document.createElement('div');
    pCell.className = 'sv-lane-cell';
    const pm = battle.board[0][l];
    if (pp && pp.step === 'PLACE_LANE' && (pm === null || pp.sacLanes.includes(l))) {
      pCell.classList.add('interactive-zone', 'placeable-slot');
    }
    if (pm) {
      pCell.appendChild(buildFollowerTokenDOM(pm, 0, l));
    } else {
      pCell.innerHTML = `<span class="text-[10px] text-slate-500 font-bold pointer-events-none">战道 ${l + 1}</span>`;
    }
    pCell.addEventListener('click', (e) => { e.stopPropagation(); onBoardLaneClicked(0, l); });
    pRow.appendChild(pCell);
  }

  const handZone = document.getElementById('playerHandZone');
  handZone.innerHTML = '';
  const totalHand = pst.hand.length;
  const isCompactHand = window.innerWidth > window.innerHeight && (window.innerHeight < 560 || window.innerWidth < 1024);
  const handOverlapMl = isCompactHand
    ? (totalHand <= 5 ? 2 : (totalHand === 6 ? -16 : (totalHand === 7 ? -28 : (totalHand === 8 ? -38 : (totalHand === 9 ? -48 : -58)))))
    : (totalHand <= 5 ? 8 : (totalHand === 6 ? -10 : (totalHand === 7 ? -24 : (totalHand === 8 ? -36 : (totalHand === 9 ? -48 : -60)))));
  const arcStepY = totalHand >= 8 ? 1.8 : 3.2;
  const arcStepDeg = totalHand >= 8 ? 1.1 : 1.9;
  pst.hand.forEach((inst, idx) => {
    if (pp && pp.card === inst) return;
    const cardEl = buildHandCardDOM(inst.data, inst);
    const playEval = evaluateCardPlayState(0, inst);
    if ((battle.activeSide === 0 || battleMode === 'pvp_pass') && !battle.gameOver && !pp && playEval.ok) {
      cardEl.classList.add(playEval.glow);
      if (playEval.mode === 'enhance') {
        cardEl.classList.add('sv-hand-playable-enhance');
      } else if (playEval.glow === 'sv-glow-yellow') {
        cardEl.classList.add('sv-hand-playable-enh');
      } else {
        cardEl.classList.add('sv-hand-playable');
      }
    }
    if (idx > 0) cardEl.style.marginLeft = `${handOverlapMl}px`;
    const mid = (totalHand - 1) / 2;
    const offset = idx - mid;
    cardEl.style.transform = `translateY(${Math.abs(offset) * arcStepY}px) rotate(${offset * arcStepDeg}deg)`;
    if (hiddenCardUids.has(inst.uid) || (dragState.active && dragState.moved && dragState.inst === inst)) {
      cardEl.style.opacity = '0';
      cardEl.style.pointerEvents = 'none';
    }
    cardEl.style.touchAction = 'none';
    cardEl.addEventListener('mousedown', (e) => startCardDrag(e, inst));
    cardEl.addEventListener('touchstart', (e) => {
      if (!e.changedTouches || e.changedTouches.length === 0) return;
      const t = e.changedTouches[0];
      e.stopPropagation();
      startCardDrag({ button: 0, clientX: t.clientX, clientY: t.clientY, isTouch: true }, inst);
    }, { passive: false });
    cardEl.addEventListener('touchmove', (e) => {
      if (!dragState.active || dragState.inst !== inst || !e.changedTouches || e.changedTouches.length === 0) return;
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
      const t = e.changedTouches[0];
      window.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true, view: window, button: 0, buttons: 1, clientX: t.clientX, clientY: t.clientY }));
    }, { passive: false });
    cardEl.addEventListener('touchend', (e) => {
      if (!dragState.active || dragState.inst !== inst || !e.changedTouches || e.changedTouches.length === 0) return;
      e.stopPropagation();
      const t = e.changedTouches[0];
      window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window, button: 0, buttons: 0, clientX: t.clientX, clientY: t.clientY }));
    }, { passive: true });
    handZone.appendChild(cardEl);
  });
}

async function onBoardLaneClicked(side, lane) {
  if (battle.gameOver) return;
  const pp = battle.pendingPlay;
  if (battle.animating || !pp) {
    if (!pp) {
      const m = battle.board[side][lane];
      if (m && !isLeftSideUiConflictActive()) {
        sfx.play('click');
        openCardDetailPanel(m, 'board', side, lane);
      }
      return;
    }
    if (battle.animating) return;
  }

  const actSide = pp.side !== undefined ? pp.side : 0;

  if (pp) {
    if (pp.step === 'SACRIFICE' && side === actSide) {
      const validS = getValidSacrificeLanes(actSide, pp.card.data.sacrificeCond || '');
      if (validS.includes(lane)) {
        sfx.play('click');
        const idx = pp.sacLanes.indexOf(lane);
        if (idx !== -1) pp.sacLanes.splice(idx, 1);
        else pp.sacLanes.push(lane);
        await advancePendingLeftTopPipeline();
        return;
      }
    }
    if (pp.step === 'TARGET') {
      const isEnh = pp.playEval.mode === 'enhance';
      const req = getCardTargetRequirement(pp.card, isEnh, pp.choiceIdx);
      const validLocs = getValidTargetLocations(actSide, req, pp.card.data.type === 'spell', pp.sacLanes);
      if (validLocs.some(loc => loc.side === side && loc.lane === lane)) {
        sfx.play('click');
        pp.effectTargetSide = side;
        pp.effectTargetLane = lane;
        await advancePendingLeftTopPipeline();
        return;
      }
    }
    if (pp.step === 'PLACE_LANE' && side === actSide && (battle.board[actSide][lane] === null || pp.sacLanes.includes(lane))) {
      sfx.play('play');
      const finalPP = Object.assign({}, pp);
      cancelPendingPlayToHand();
      await commitCardPlayWithAnimations(actSide, finalPP.card, finalPP.playEval, lane, finalPP.sacLanes, finalPP.effectTargetLane, Math.max(0, finalPP.choiceIdx), finalPP.handTargetUid, finalPP.effectTargetSide);
      return;
    }
    sfx.play('click');
    cancelPendingPlayToHand();
    return;
  }

  const m = battle.board[side][lane];
  if (m) {
    sfx.play('click');
    openCardDetailPanel(m, 'board', side, lane);
  }
}

document.getElementById('btnTurnOrb').addEventListener('click', () => {
  if ((battleMode === 'pvp_online' ? onlineIsMyTurn() : (battle.activeSide === 0 || battleMode === 'pvp_pass')) && !battle.gameOver && !battle.animating) {
    sfx.play('click');
    executeEndTurnSequence(0);
  }
});

document.getElementById('btnRestartMatch').addEventListener('click', () => {
  if (battleMode === 'pvp_online') return;
  sfx.play('play');
  initNewBattle();
});

let deckFilter = '全部';
let deckInspectedCardData = allCards[0] || null;

function syncAllDeckSelects() {
  const s1 = document.getElementById('quickDeckSelect');
  const s2 = document.getElementById('selectEditingDeck');
  if (!s1 || !s2) return;
  if (currentDeckIndex < 0 || currentDeckIndex >= PRESET_DECKS.length) currentDeckIndex = 0;
  s1.innerHTML = ''; s2.innerHTML = '';
  PRESET_DECKS.forEach((d, idx) => {
    const total = getDeckTotal(d);
    const label = `${d.name} (${total}张)`;
    const o1 = document.createElement('option'); o1.value = idx; o1.textContent = label; s1.appendChild(o1);
    const o2 = document.createElement('option'); o2.value = idx; o2.textContent = label; s2.appendChild(o2);
  });
  s1.value = currentDeckIndex;
  s2.value = currentDeckIndex;
  const nameInp = document.getElementById('inputDeckCustomName');
  if (nameInp && PRESET_DECKS[currentDeckIndex]) {
    nameInp.value = PRESET_DECKS[currentDeckIndex].name;
  }
}

document.getElementById('quickDeckSelect').addEventListener('change', (e) => {
  currentDeckIndex = parseInt(e.target.value, 10) || 0;
  saveDecksToStorage();
  initNewBattle();
});

document.getElementById('selectEditingDeck').addEventListener('change', (e) => {
  currentDeckIndex = parseInt(e.target.value, 10) || 0;
  renderDeckEditor();
});

function getDeckTotal(deckObj) {
  return Object.values(deckObj.cards).reduce((a, b) => a + b, 0);
}

let deckDetailNavStack = [];
function inspectCardInDeckEditor(cardData, keepStack = false) {
  document.querySelectorAll('#deckGalleryGrid .sv-hand-card').forEach(el => {
    el.classList.remove('is-inspected', 'sv-glow-yellow');
  });
  if (!cardData) return;
  document.querySelectorAll('#deckGalleryGrid .sv-hand-card').forEach(el => {
    if (el.dataset.cardId === cardData.id) {
      el.classList.add('is-inspected', 'sv-glow-yellow');
    }
  });
  document.querySelectorAll('#deckEditorList [data-deck-cid]').forEach(el => {
    const sel = el.dataset.deckCid === cardData.id;
    el.classList.toggle('bg-amber-950/70', sel);
    el.classList.toggle('border-amber-400', sel);
    el.classList.toggle('bg-slate-950', !sel);
    el.classList.toggle('hover:bg-slate-800', !sel);
    el.classList.toggle('border-slate-800', !sel);
  });
  if (!keepStack) deckDetailNavStack = [];
  deckInspectedCardData = cardData;
  const slot = document.getElementById('deckInspectedCardSlot');
  slot.innerHTML = '';
  const previewCard = buildHandCardDOM(cardData, null, PRESET_DECKS[currentDeckIndex].cards[cardData.id] || 0);
  previewCard.style.cursor = 'default';
  slot.appendChild(previewCard);

  document.getElementById('deckInspectedMeta').textContent =
    `【${cardData.name}】 ${cardData.rarity} · ${cardData.type === 'minion' ? '随从' : (cardData.type === 'amulet' ? '护符' : '法术')}${cardData.race ? '·'+cardData.race : ''} | ⚡${cardData.energy} 🩸${cardData.sacrifice} 🦴${cardData.bones} · ⚖️${formatCardValueText(getCardCostValue(cardData))}`;

  const effEl = document.getElementById('deckInspectedEffect');
  const navHtml = deckDetailNavStack.length > 0
    ? `<div class="mb-2 flex items-center justify-between"><button type="button" id="btnDeckNavBack" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-amber-400/60 text-amber-200 font-black text-xs cursor-pointer">◀ 返回上一张卡牌</button><span class="text-[11px] text-cyan-300 font-bold">关联查看中</span></div>`
    : '';
  const sacHtml = (cardData.sacrifice > 0 || cardData.sacrificeCond)
    ? `<div class="mb-2 p-2 rounded-lg bg-rose-950/80 border border-rose-400/70 text-rose-100 font-black text-xs">🩸 祭品条件：打出时需破坏己方场上 ${cardData.sacrifice || 1} 个${cardData.sacrificeCond ? `「${cardData.sacrificeCond}」` : '任意'}随从</div>`
    : '';
  const rawTxt = getCardDisplayText(cardData) + (cardData.notes ? `\n\n💡 设计备注：${cardData.notes}` : '');
  effEl.innerHTML = navHtml + sacHtml + (rawTxt ? formatInteractiveDetailHTML(rawTxt, cardData.name).replace(/\n/g, '<br>') : '（无特殊效果）');

  effEl.querySelector('#btnDeckNavBack')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const prevCard = deckDetailNavStack.pop();
    if (prevCard) inspectCardInDeckEditor(prevCard, true);
  });
  effEl.querySelectorAll('.cf-kw-link').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const kw = btn.getAttribute('data-kw');
      if (!kw || !KEYWORD_GLOSSARY[kw]) return;
      if (deckDetailNavStack.length < 8) deckDetailNavStack.push(cardData);
      effEl.innerHTML = `<div class="mb-2"><button type="button" id="btnDeckKwBack" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-amber-400/60 text-amber-200 font-black text-xs cursor-pointer">◀ 返回卡牌说明</button></div><div class="p-2.5 rounded-lg bg-amber-950/45 border border-amber-400/65 text-amber-100 font-bold leading-relaxed">【${kw}】${KEYWORD_GLOSSARY[kw]}</div>`;
      effEl.querySelector('#btnDeckKwBack')?.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const prevCard = deckDetailNavStack.pop() || cardData;
        inspectCardInDeckEditor(prevCard, true);
      });
    };
  });
  effEl.querySelectorAll('.cf-card-link').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const targetDef = allCards.find(x => x.name === btn.getAttribute('data-card-name'));
      if (!targetDef || targetDef.id === cardData.id) return;
      if (deckDetailNavStack.length < 8) deckDetailNavStack.push(cardData);
      inspectCardInDeckEditor(targetDef, true);
    };
  });
}

let deckEditorDrag = { active: false, source: '', cardData: null, startX: 0, startY: 0, moved: false };

function showDeckEditorToast(msg, isError = false) {
  const toast = document.getElementById('importStatusToast');
  if (!toast) return;
  toast.classList.remove('hidden');
  toast.className = `my-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold ${isError ? 'bg-rose-950/95 border-rose-400 text-rose-200' : 'bg-emerald-950/95 border-emerald-400 text-emerald-200'}`;
  toast.textContent = msg;
}

document.getElementById('btnDeckDetailAdd').addEventListener('click', () => {
  if (!deckInspectedCardData || deckInspectedCardData.isToken) return;
  const deckObj = PRESET_DECKS[currentDeckIndex];
  const cur = deckObj.cards[deckInspectedCardData.id] || 0;
  if (cur >= RULES.copiesPerCard || getDeckTotal(deckObj) >= RULES.deckEditMax) {
    sfx.play('hit');
    showDeckEditorToast(`⚠️ 单卡上限 ${RULES.copiesPerCard} 张，临时编辑上限 ${RULES.deckEditMax} 张！`, true);
    return;
  }
  sfx.play('click');
  deckObj.cards[deckInspectedCardData.id] = cur + 1;
  renderDeckEditor();
});

document.getElementById('btnDeckDetailRemove').addEventListener('click', () => {
  if (!deckInspectedCardData) return;
  const deckObj = PRESET_DECKS[currentDeckIndex];
  const cur = deckObj.cards[deckInspectedCardData.id] || 0;
  if (cur <= 0) return;
  sfx.play('click');
  if (cur <= 1) delete deckObj.cards[deckInspectedCardData.id];
  else deckObj.cards[deckInspectedCardData.id] = cur - 1;
  renderDeckEditor();
});


const _lastValidDeckSnapshots = new Map();
function snapshotValidDeckState(idx) {
  const d = PRESET_DECKS[idx];
  if (d && getDeckTotal(d) === RULES.deckSize) {
    _lastValidDeckSnapshots.set(idx, { name: d.name, cards: Object.assign({}, d.cards) });
  }
}

function renderDeckEditor() {
  syncGlobalAnimPhases();
  snapshotValidDeckState(currentDeckIndex);
  saveDecksToStorage();
  syncAllDeckSelects();
  if (deckInspectedCardData) inspectCardInDeckEditor(deckInspectedCardData);
  const deckObj = PRESET_DECKS[currentDeckIndex];
  const total = getDeckTotal(deckObj);
  const frac = document.getElementById('deckCountFraction');
  frac.textContent = `${total} / ${RULES.deckSize} (上限${RULES.deckEditMax})`;
  frac.className = `text-xs font-black px-2.5 py-0.5 rounded-full ${total === RULES.deckSize ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50' : 'bg-amber-500/20 text-amber-300 border border-amber-400/50'}`;

  const topDeckBtn = document.getElementById('btnNavDeck');
  if (topDeckBtn) topDeckBtn.textContent = `🛠️ 卡组编辑 (${total}/${RULES.deckSize}张)`;

  const showTokens = document.getElementById('chkDeckShowTokens').checked;
  const kw = document.getElementById('inputDeckSearch').value.trim();
  const grid = document.getElementById('deckGalleryGrid');
  grid.innerHTML = '';

  const sortVal = document.getElementById('selDeckSort')?.value || 'energy_asc';
  const rarityRank = { '普通': 1, '稀有': 2, '史诗': 3, '传说': 4 };
  const basePool = allCards.filter(c => showTokens || !c.isToken);
  const filteredCards = basePool.filter(c => {
    if (deckFilter === '随从' && c.type !== 'minion') return false;
    if (deckFilter === '龙族' && !hasRace(c, '龙族')) return false;
    if (deckFilter === '机械' && !isMechCard(c)) return false;
    if (deckFilter === '亡灵' && !hasRace(c, '亡灵')) return false;
    if (deckFilter === '无种族' && c.race && c.race.trim()) return false;
    if (deckFilter === '法术' && c.type !== 'spell') return false;
    if (deckFilter === '护符' && c.type !== 'amulet') return false;
    if (typeof deckAdvFilter !== 'undefined') {
      if (deckAdvFilter.cost !== 'all') {
        const cv = typeof getCardCostValue === 'function' ? getCardCostValue(c) : (c.energy || 0);
        if (deckAdvFilter.cost === '0-1') { if (cv > 1) return false; }
        else if (deckAdvFilter.cost === '7-8') { if (cv < 7 || cv > 8) return false; }
        else if (deckAdvFilter.cost === '9+') { if (cv < 9) return false; }
        else if (Math.round(cv) !== parseInt(deckAdvFilter.cost, 10)) return false;
      }
      if (deckAdvFilter.system && deckAdvFilter.system !== 'all') {
        const hasE = (c.energy || 0) > 0;
        const hasS = (c.sacrifice || 0) > 0;
        const hasB = (c.bones || 0) > 0;
        const cntSys = (hasE ? 1 : 0) + (hasS ? 1 : 0) + (hasB ? 1 : 0);
        if (deckAdvFilter.system === 'energy_only' && !(hasE && !hasS && !hasB)) return false;
        if (deckAdvFilter.system === 'sac_only' && !(!hasE && hasS && !hasB)) return false;
        if (deckAdvFilter.system === 'bones_only' && !(!hasE && !hasS && hasB)) return false;
        if (deckAdvFilter.system === 'multi' && cntSys < 2) return false;
        if (deckAdvFilter.system === 'free' && cntSys !== 0) return false;
      }
      if (deckAdvFilter.race !== 'all') {
        const races = (c.race || '').split(/[、,，/\s]+/).filter(Boolean);
        if (deckAdvFilter.race === '无种族') { if (races.length > 0) return false; }
        else if (deckAdvFilter.race === '多族') { if (races.length < 2) return false; }
        else if (deckAdvFilter.race === '机械') { if (!isMechCard(c)) return false; }
        else if (deckAdvFilter.race === '恶魔') { if (!hasRace(c, '恶魔') && !c.name.includes('恶魔') && !c.name.includes('吸血鬼') && !c.name.includes('魅魔')) return false; }
        else if (!hasRace(c, deckAdvFilter.race)) return false;
      }
      if (deckAdvFilter.type !== 'all' && c.type !== deckAdvFilter.type) return false;
      if (deckAdvFilter.rarity !== 'all' && c.rarity !== deckAdvFilter.rarity) return false;
      const specs = Array.isArray(deckAdvFilter.specs) ? deckAdvFilter.specs : [];
      const fullTxt = `${c.name} ${getCardDisplayText(c)}`;
      for (const sp of specs) {
        if (sp === 'sac' && !(c.sacrifice > 0)) return false;
        else if (sp === 'bones' && !(c.bones > 0)) return false;
        else if (sp === 'cd' && !(getInitialCountdown(c) > 0)) return false;
        else if (sp === 'fuse' && !(c.keywords || []).some(k => k.k === '融合') && !fullTxt.includes('【融合')) return false;
        else if (sp === 'self_dmg' && !fullTxt.includes('主战者造成') && !fullTxt.includes('献祭')) return false;
        else if (['入场曲','谢幕曲','启动','爆能强化','瞬念召唤','抉择','守护','疾驰','突进','飞行','防空','毁灭','吸血','必杀','潜伏','荆棘','招募','亡者召还','纹章'].includes(sp)) {
          const hasKw = (c.keywords || []).some(k => k.k === sp || String(k.k).startsWith(sp)) || fullTxt.includes(sp);
          if (!hasKw) return false;
        }
      }
    }
    if (kw && !(`${c.name}${c.race}${c.rarity}${getCardDisplayText(c)}`).toLowerCase().includes(kw.toLowerCase())) return false;
    return true;
  });

  filteredCards.sort((a, b) => {
    const ea = a.energy || 0, eb = b.energy || 0;
    const va = typeof getCardCostValue === 'function' ? getCardCostValue(a) : ea;
    const vb = typeof getCardCostValue === 'function' ? getCardCostValue(b) : eb;
    const eGroup = (x) => {
      const xe = x.energy || 0, xs = x.sacrifice || 0, xb = x.bones || 0;
      if (xe === 0 && xs === 0 && xb === 0) return 0; // 完全无费用排最前
      if (xe > 0) return 1;                            // 有能量费用按能量排
      return 2;                                        // 无能量的骨头/祭品排最后
    };
    if (sortVal === 'energy_asc') {
      const ga = eGroup(a), gb = eGroup(b);
      if (ga !== gb) return ga - gb;
      return ea - eb || va - vb || a.name.localeCompare(b.name, 'zh-CN');
    }
    if (sortVal === 'energy_desc') {
      const ga = eGroup(a), gb = eGroup(b);
      if (ga !== gb) return ga === 1 ? -1 : (gb === 1 ? 1 : ga - gb);
      return eb - ea || vb - va || a.name.localeCompare(b.name, 'zh-CN');
    }
    if (sortVal === 'value_asc') return va - vb || ea - eb || a.name.localeCompare(b.name, 'zh-CN');
    if (sortVal === 'value_desc') return vb - va || eb - ea || a.name.localeCompare(b.name, 'zh-CN');
    if (sortVal === 'atk_desc') return (b.atk || 0) - (a.atk || 0) || vb - va;
    if (sortVal === 'hp_desc') return (b.hp || 0) - (a.hp || 0) || vb - va;
    if (sortVal === 'rarity_desc') return (rarityRank[b.rarity] || 0) - (rarityRank[a.rarity] || 0) || ea - eb;
    if (sortVal === 'name_asc') return a.name.localeCompare(b.name, 'zh-CN');
    return ea - eb || va - vb;
  });

  const cntBadge = document.getElementById('deckGalleryCountBadge');
  if (cntBadge) cntBadge.textContent = `显示 ${filteredCards.length} / ${basePool.length} 张`;

  filteredCards.forEach(c => {
    const cnt = deckObj.cards[c.id] || 0;
    const wrap = document.createElement('div');
    wrap.className = 'flex flex-col items-center gap-1';
    const cardEl = buildHandCardDOM(c, null, cnt);
    cardEl.dataset.cardId = c.id;
    cardEl.style.cursor = 'grab';
    if (deckInspectedCardData && deckInspectedCardData.id === c.id) {
      cardEl.classList.add('sv-glow-yellow', 'is-inspected');
    }

    // 左键拖拽加入卡组；右键点击卡牌时快速加入1张到卡组中！
    cardEl.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      deckEditorDrag = { active: true, source: 'gallery', cardData: c, startX: e.clientX, startY: e.clientY, moved: false };
    });
    cardEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      inspectCardInDeckEditor(c);
      const cur = deckObj.cards[c.id] || 0;
      if (c.isToken || cur >= RULES.copiesPerCard || getDeckTotal(deckObj) >= RULES.deckEditMax) {
        sfx.play('hit');
        showDeckEditorToast(`⚠️ 无法加入：单卡上限 ${RULES.copiesPerCard} 张，临时编辑上限 ${RULES.deckEditMax} 张！`, true);
        return;
      }
      sfx.play('play');
      deckObj.cards[c.id] = cur + 1;
      showDeckEditorToast(`➕ 已右键快速加入 1 张「${c.name}」(${cur + 1}/${RULES.copiesPerCard})`);
      renderDeckEditor();
    });

    wrap.appendChild(cardEl);
    grid.appendChild(wrap);
  });

  const listEl = document.getElementById('deckEditorList');
  listEl.innerHTML = '';
  const entries = Object.entries(deckObj.cards)
    .filter(([_, cnt]) => cnt > 0)
    .map(([cid, cnt]) => ({ c: cardsById[cid], cnt }))
    .filter(x => x.c)
    .sort((a, b) => (a.c.energy - b.c.energy) || (a.c.bones - b.c.bones));

  entries.forEach(({ c, cnt }) => {
    const item = document.createElement('div');
    const isSelected = deckInspectedCardData && deckInspectedCardData.id === c.id;
    item.dataset.deckCid = c.id;
    item.className = `flex items-center justify-between ${isSelected ? 'bg-amber-950/70 border-amber-400' : 'bg-slate-950 hover:bg-slate-800 border-slate-800'} border rounded-lg px-2.5 py-2 text-xs cursor-grab transition select-none`;
    item.title = '右键快速移除1张 | 向右拖动增加1张同名卡 | 向左拖出移除1张';
    item.innerHTML = `
      <div class="flex items-center gap-2 min-w-0 flex-1 pointer-events-none">
        <span class="w-5 h-5 rounded-full bg-emerald-700 text-white font-black flex items-center justify-center text-[10px] shrink-0">${c.energy}</span>
        <span class="font-bold text-white truncate">${c.name}</span>
      </div>
      <div class="flex items-center gap-1.5 shrink-0 pointer-events-none">
        <span class="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-black">×${cnt}</span>
        <span class="text-[10px] text-slate-400">⬅移除 / ➡+1</span>
      </div>
    `;
    item.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      deckEditorDrag = { active: true, source: 'deckList', cardData: c, startX: e.clientX, startY: e.clientY, moved: false };
    });
    item.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const cur = deckObj.cards[c.id] || 0;
      if (cur <= 0) return;
      sfx.play('sacrifice');
      if (cur <= 1) delete deckObj.cards[c.id];
      else deckObj.cards[c.id] = cur - 1;
      inspectCardInDeckEditor(c);
      showDeckEditorToast(`➖ 已右键快速移除 1 张「${c.name}」`);
      renderDeckEditor();
    });
    listEl.appendChild(item);
  });
}

window.addEventListener('mousemove', (e) => {
  if (!deckEditorDrag.active || !deckEditorDrag.cardData) return;
  const dist = Math.hypot(e.clientX - deckEditorDrag.startX, e.clientY - deckEditorDrag.startY);
  if (!deckEditorDrag.moved && dist > 6) {
    deckEditorDrag.moved = true;
    const ghost = document.getElementById('dragGhostBox');
    ghost.innerHTML = '';
    const node = buildHandCardDOM(deckEditorDrag.cardData, null, 0);
    node.style.transform = 'scale(0.92) rotate(-2deg)';
    ghost.appendChild(node);
    ghost.classList.remove('hidden');
  }
  if (deckEditorDrag.moved) {
    const ghost = document.getElementById('dragGhostBox');
    ghost.style.left = `${e.clientX}px`;
    ghost.style.top = `${e.clientY}px`;
    const rightPanel = document.getElementById('deckRightPanel');
    if (rightPanel) {
      const r = rightPanel.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      rightPanel.classList.toggle('border-emerald-400', deckEditorDrag.source === 'gallery' && inside);
      rightPanel.classList.toggle('border-rose-400', deckEditorDrag.source === 'deckList' && !inside);
    }
  }
});

window.addEventListener('mouseup', (e) => {
  if (!deckEditorDrag.active) return;
  const { source, cardData, startX, startY, moved } = deckEditorDrag;
  deckEditorDrag = { active: false, source: '', cardData: null, startX: 0, startY: 0, moved: false };
  document.getElementById('dragGhostBox').classList.add('hidden');
  const rightPanel = document.getElementById('deckRightPanel');
  if (rightPanel) {
    rightPanel.classList.remove('border-emerald-400', 'border-rose-400');
  }

  if (!cardData) return;
  const deckObj = PRESET_DECKS[currentDeckIndex];

  // 未发生拖动（点击）：仅切换选中与检视动效，不重绘卡库以免重置特效
  if (!moved) {
    sfx.play('click');
    inspectCardInDeckEditor(cardData);
    return;
  }

  // 如果放开位置接近原位 (< 32px)，则放回原位不增删，也不重绘卡库
  const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
  if (dist < 32) {
    sfx.play('click');
    inspectCardInDeckEditor(cardData);
    return;
  }

  const r = rightPanel ? rightPanel.getBoundingClientRect() : null;
  const insideRight = r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;

  if (source === 'gallery') {
    // 从左侧卡牌库拖入右侧牌组框 -> 加入1张；放置在牌组以外 -> 回到牌组库里
    if (insideRight) {
      if (cardData.isToken) {
        sfx.play('hit');
        showDeckEditorToast('⚠️ 衍生物不能直接编入主牌组！', true);
      } else {
        const cur = deckObj.cards[cardData.id] || 0;
        if (cur >= RULES.copiesPerCard) {
          sfx.play('hit');
          showDeckEditorToast(`⚠️ 同名卡「${cardData.name}」最多投入 ${RULES.copiesPerCard} 张！`, true);
        } else if (getDeckTotal(deckObj) >= RULES.deckEditMax) {
          sfx.play('hit');
          showDeckEditorToast(`⚠️ 牌组临时编辑上限为 ${RULES.deckEditMax} 张！`, true);
        } else {
          sfx.play('play');
          deckObj.cards[cardData.id] = cur + 1;
          inspectCardInDeckEditor(cardData);
        }
      }
    } else {
      sfx.play('click');
    }
  } else if (source === 'deckList') {
    // 卡组中的卡牌向右拖动 (dx >= 36) 时添加1张同名的卡牌；向左拖出 (dx <= -36 或拖出牌组框左侧) 移除1张！
    const dx = e.clientX - startX;
    if (dx >= 36) {
      const cur = deckObj.cards[cardData.id] || 0;
      if (cardData.isToken || cur >= RULES.copiesPerCard || getDeckTotal(deckObj) >= RULES.deckEditMax) {
        sfx.play('hit');
        showDeckEditorToast(`⚠️ 无法继续添加「${cardData.name}」：单卡上限 ${RULES.copiesPerCard} 张，编辑上限 ${RULES.deckEditMax} 张！`, true);
      } else {
        sfx.play('play');
        deckObj.cards[cardData.id] = cur + 1;
        inspectCardInDeckEditor(cardData);
        showDeckEditorToast(`➕ 向右拖动：已增加 1 张同名卡「${cardData.name}」(${cur + 1}/${RULES.copiesPerCard})`);
      }
    } else if (dx <= -36 || !insideRight) {
      sfx.play('sacrifice');
      const cur = deckObj.cards[cardData.id] || 0;
      if (cur <= 1) delete deckObj.cards[cardData.id];
      else deckObj.cards[cardData.id] = cur - 1;
      inspectCardInDeckEditor(cardData);
      showDeckEditorToast(`➖ 已移除 1 张「${cardData.name}」`);
    } else {
      sfx.play('click');
    }
  }
  renderDeckEditor();
});

document.querySelectorAll('.deck-filter-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    sfx.play('click');
    deckFilter = btn.dataset.filter;
    document.querySelectorAll('.deck-filter-pill').forEach(b => {
      b.className = 'deck-filter-pill px-3 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-200';
    });
    btn.className = 'deck-filter-pill px-3 py-1 rounded-lg text-xs font-black bg-amber-500 text-slate-950';
    renderDeckEditor();
  });
});
document.getElementById('chkDeckShowTokens').addEventListener('change', renderDeckEditor);
document.getElementById('inputDeckSearch').addEventListener('input', renderDeckEditor);

document.getElementById('btnDeckAutoFill').addEventListener('click', () => {
  sfx.play('synergy');
  const deckObj = PRESET_DECKS[currentDeckIndex];
  for (const c of allCards) {
    if (c.isToken) continue;
    while ((deckObj.cards[c.id] || 0) < RULES.copiesPerCard && getDeckTotal(deckObj) < RULES.deckSize) {
      deckObj.cards[c.id] = (deckObj.cards[c.id] || 0) + 1;
    }
  }
  renderDeckEditor();
});


document.getElementById('btnNewCustomDeck').addEventListener('click', () => {
  sfx.play('synergy');
  const newNum = PRESET_DECKS.length + 1;
  const newDeck = {
    name: `★ 自定义卡组 #${newNum}`,
    isUserCustom: true,
    cards: {}
  };
  PRESET_DECKS.unshift(newDeck);
  currentDeckIndex = 0;
  saveDecksToStorage();
  renderDeckEditor();
  showDeckEditorToast(`✅ 已新建「${newDeck.name}」，可自由命名并拖入卡牌构建（默认将使用此卡组出战）！`);
});

document.getElementById('btnSaveDeckName').addEventListener('click', () => {
  const inp = document.getElementById('inputDeckCustomName');
  const newName = (inp ? inp.value.trim() : '');
  if (!newName) {
    sfx.play('hit');
    showDeckEditorToast('⚠️ 卡组名称不能为空！', true);
    return;
  }
  sfx.play('click');
  PRESET_DECKS[currentDeckIndex].name = newName;
  PRESET_DECKS[currentDeckIndex].isUserCustom = true;
  saveDecksToStorage();
  renderDeckEditor();
  showDeckEditorToast(`✅ 卡组已重命名为「${newName}」并自动永久保存！`);
});

document.getElementById('inputDeckCustomName').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('btnSaveDeckName').click();
});

document.getElementById('btnDeleteCustomDeck').addEventListener('click', () => {
  if (PRESET_DECKS.length <= 1) {
    sfx.play('hit');
    showDeckEditorToast('⚠️ 至少需要保留 1 套卡组！', true);
    return;
  }
  const removedName = PRESET_DECKS[currentDeckIndex].name;
  sfx.play('sacrifice');
  PRESET_DECKS.splice(currentDeckIndex, 1);
  currentDeckIndex = 0;
  saveDecksToStorage();
  renderDeckEditor();
  showDeckEditorToast(`🗑️ 已删除卡组「${removedName}」。`);
});

document.getElementById('btnDeckClear').addEventListener('click', () => {
  sfx.play('click');
  PRESET_DECKS[currentDeckIndex].cards = {};
  renderDeckEditor();
});

document.getElementById('btnDeckSaveOnly')?.addEventListener('click', () => {
  const deckObj = PRESET_DECKS[currentDeckIndex];
  if (deckObj) deckObj.isUserCustom = true;
  saveDecksToStorage();
  sfx.play('buff');
  const total = deckObj ? getDeckTotal(deckObj) : 0;
  showDeckEditorToast(`💾 已保存卡组「${deckObj ? deckObj.name : ''}」(${total}/${RULES.deckSize}张)`);
});
document.getElementById('btnDeckBackPrev')?.addEventListener('click', () => {
  sfx.play('click');
  saveDecksToStorage();
  document.getElementById('btnTopBackMenu')?.click();
});


let currentEditingCardId = null;

// ============================================================================
// 原版 v1.9 卡牌设计器完整逻辑（动态 keywords 数组、抉择 opts、招募/亡者召还 reans、费用评估、JSON导入导出）
// ============================================================================
let v19CurrentCardId = cardsById['cmwas0lke5oiw'] ? 'cmwas0lke5oiw' : (allCards[0] ? allCards[0].id : null);
let v19DraftKeywords = [];
let v19DraftArt = '';

function assembleV19FullText(draft) {
  const lines = [];
  (draft.keywords || []).forEach(kw => {
    const k = kw.k || '';
    if (!k) return;
    if (kw.choice && kw.choice.on && Array.isArray(kw.choice.opts)) {
      lines.push(`【${k}】【抉择】选择1个能力发动。`);
      kw.choice.opts.forEach((opt, idx) => {
        let optStr = opt.t || '';
        if (!optStr && Array.isArray(opt.reans) && opt.reans.length > 0) {
          optStr = opt.reans.map(r => {
            const eVal = r.costs ? (r.costs.energy || 0) : 0;
            return `【${r.k}_能量${eVal}】${r.type ? '仅限「' + r.type + '」' : ''}${r.effect || ''}`;
          }).join(' ');
        }
        lines.push(`（${idx + 1}）${optStr}`);
      });
      return;
    }
    if (Array.isArray(kw.reans) && kw.reans.length > 0 && !kw.effect) {
      const reanStrs = kw.reans.map(r => {
        const eVal = r.costs ? (r.costs.energy || 0) : 0;
        return `【${r.k}_能量${eVal}】${r.type ? '仅限「' + r.type + '」' : ''}${r.effect || ''}`;
      });
      lines.push(`【${k}】${reanStrs.join('\n')}`);
      return;
    }
    if (k === '启动') {
      const cE = kw.cost ? (kw.cost.energy || 0) : 1;
      lines.push(`【启动】能量${cE}：${kw.effect || ''}`);
    } else if (k === '瞬念召唤') {
      const whenTxt = kw.when === 'start' ? '回合开始时，' : '回合结束后，';
      lines.push(`【瞬念召唤】${whenTxt}${kw.effect || ''}`);
    } else if (['连击', '爆能强化', '结晶', '激奏'].includes(k)) {
      const vNum = kw.v || 1;
      const prefix = k === '爆能强化' ? `【爆能强化_能量${vNum}】` : (k === '连击' ? `【连击_${vNum}】` : `【${k}_能量${vNum}】`);
      lines.push(`${prefix}${kw.effect || ''}`);
    } else if (k === '荆棘') {
      lines.push(`荆棘_${kw.v || 1}`);
    } else if (['守护', '飞行', '防空', '屏障', '灵气', '潜行', '毁灭', '虹吸', '位移', '多重攻击', '两侧攻击', '三侧攻击', '全体攻击'].includes(k) && !kw.effect) {
      // 基础常驻词条
    } else {
      lines.push(`【${k}】${kw.effect || ''}`);
    }
  });
  if (draft.text && String(draft.text).trim()) {
    lines.push(String(draft.text).trim());
  }
  return lines.join('\n');
}

function renderV19CardList() {
  const box = document.getElementById('v19CardListContainer');
  const cntEl = document.getElementById('v19CardCountTxt');
  if (!box) return;
  if (cntEl) cntEl.textContent = String(allCards.length);
  const q = (document.getElementById('inputV19Search')?.value || '').trim();
  box.innerHTML = '';

  allCards.forEach(c => {
    if (q && !(`${c.name}${c.race}${c.rarity}${getCardDisplayText(c)}`).includes(q)) return;
    const row = document.createElement('div');
    const active = c.id === v19CurrentCardId;
    row.className = `flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition ${active ? 'bg-fuchsia-950/80 border-fuchsia-400 text-white' : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-200'}`;
    row.innerHTML = `
      <div class="flex items-center gap-2 min-w-0 flex-1">
        <span class="w-5 h-5 rounded-full bg-emerald-700 text-white font-black flex items-center justify-center text-[10px] shrink-0">${c.energy}</span>
        <span class="font-bold truncate">${c.name}</span>
      </div>
      <span class="text-[10px] text-amber-300 shrink-0">${c.race || (c.type === 'spell' ? '法术' : '随从')}</span>
    `;
    row.addEventListener('click', () => {
      sfx.play('click');
      loadCardIntoDesigner(c);
    });
    box.appendChild(row);
  });
}

function renderV19KeywordsEditor() {
  const box = document.getElementById('v19KeywordsListBox');
  if (!box) return;
  box.innerHTML = '';

  if (v19DraftKeywords.length === 0) {
    box.innerHTML = `<div class="text-xs text-slate-500 text-center py-3">当前无词条（可在上方选择词条后点击「＋ 添加该词条」）</div>`;
    return;
  }

  v19DraftKeywords.forEach((kw, kIdx) => {
    const card = document.createElement('div');
    card.className = 'bg-slate-900 border border-slate-700 rounded-xl p-2.5 flex flex-col gap-2 text-xs';

    const hasVal = ['倒计时', '荆棘', '连击', '爆能强化', '结晶', '激奏', '多重攻击'].includes(kw.k);
    const isEnhanceKw = kw.k === '爆能强化';
    const isActivate = kw.k === '启动';
    const isInvoke = kw.k === '瞬念召唤';
    const canHaveChoiceOrRean = ['入场曲', '谢幕曲', '随从进场时', '回合开始时', '回合结束时', '攻击时'].includes(kw.k);

    let headerControls = '';
    if (hasVal) {
      headerControls += `
        <label class="flex items-center gap-1 text-amber-300">
          <span>数值(v):</span>
          <input type="number" min="0" max="20" value="${kw.v || 1}" data-kw-field="v" class="w-14 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-white font-black" />
        </label>`;
    }
    if (isEnhanceKw) {
      const curRes = kw.res || '能量';
      headerControls += `
        <label class="flex items-center gap-1 text-amber-200">
          <span>消耗资源:</span>
          <select data-kw-field="res" class="bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-amber-300 font-bold">
            <option value="能量" ${curRes === '能量' ? 'selected' : ''}>能量</option>
            <option value="骨头" ${curRes === '骨头' ? 'selected' : ''}>骨头</option>
            <option value="祭品" ${curRes === '祭品' ? 'selected' : ''}>祭品</option>
          </select>
        </label>`;
    }
    if (isActivate) {
      const actE = kw.cost ? (kw.cost.energy || 0) : 0;
      headerControls += `
        <label class="flex items-center gap-1 text-emerald-300">
          <span>启动能量:</span>
          <input type="number" min="0" max="10" value="${actE}" data-kw-field="costE" class="w-14 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-white font-black" />
        </label>`;
    }
    if (isInvoke) {
      headerControls += `
        <select data-kw-field="when" class="bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-amber-200">
          <option value="end" ${kw.when !== 'start' ? 'selected' : ''}>回合结束触发 (end)</option>
          <option value="start" ${kw.when === 'start' ? 'selected' : ''}>回合开始触发 (start)</option>
        </select>`;
    }
    if (canHaveChoiceOrRean) {
      const choiceOn = Boolean(kw.choice && kw.choice.on);
      headerControls += `
        <label class="flex items-center gap-1 text-sky-300 cursor-pointer">
          <input type="checkbox" data-kw-field="choiceOn" ${choiceOn ? 'checked' : ''} class="rounded" />
          <span>启用【抉择】</span>
        </label>
        <button type="button" data-kw-act="addRean" class="px-2 py-0.5 rounded bg-indigo-700 hover:bg-indigo-600 text-white text-[11px] font-bold">＋招募/亡者召还</button>`;
    }

    card.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-amber-300 font-black">【${kw.k}】</span>
          ${headerControls}
        </div>
        <button type="button" data-kw-act="removeKw" class="px-2 py-0.5 rounded bg-rose-900/80 hover:bg-rose-700 text-rose-200 text-[11px] font-bold">✕ 删除词条</button>
      </div>
      <div>
        <input type="text" data-kw-field="effect" value="${(kw.effect || '').replace(/"/g, '&quot;')}" placeholder="填写该词条效果描述（如：抽取1张卡牌，或融合条件：原始费用3以下·卡牌）..." class="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white" />
      </div>
      <div class="kw-sub-containers space-y-2"></div>
    `;

    const subBox = card.querySelector('.kw-sub-containers');

    // 渲染抉择选项列表 (choice.opts)
    if (kw.choice && kw.choice.on) {
      if (!Array.isArray(kw.choice.opts) || kw.choice.opts.length === 0) {
        kw.choice.opts = [{ t: '选项1效果', reans: [] }, { t: '选项2效果', reans: [] }];
      }
      const cWrap = document.createElement('div');
      cWrap.className = 'bg-slate-950 border border-sky-500/40 rounded-lg p-2 space-y-1.5';
      cWrap.innerHTML = `
        <div class="flex items-center justify-between text-[11px] font-bold text-sky-300">
          <span>⚖️ 抉择分支选项 (${kw.choice.opts.length} 项)</span>
          <button type="button" class="btn-add-choice-opt px-2 py-0.5 rounded bg-sky-700 hover:bg-sky-600 text-white">＋ 添加抉择项</button>
        </div>
      `;
      kw.choice.opts.forEach((opt, oIdx) => {
        const oRow = document.createElement('div');
        oRow.className = 'flex items-center gap-1.5';
        let displayOptVal = opt.t || '';
        if (!displayOptVal && Array.isArray(opt.reans) && opt.reans.length > 0) {
          const r = opt.reans[0];
          displayOptVal = `【${r.k}_能量${r.costs ? r.costs.energy : 0}】${r.type ? '仅限「'+r.type+'」' : ''}${r.effect || ''}`;
        }
        oRow.innerHTML = `
          <span class="text-amber-300 font-bold shrink-0">（${oIdx + 1}）</span>
          <input type="text" value="${displayOptVal.replace(/"/g, '&quot;')}" class="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs" />
          <button type="button" class="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-rose-700 text-slate-300 text-[10px]">✕</button>
        `;
        const inp = oRow.querySelector('input');
        inp.addEventListener('input', () => {
          opt.t = inp.value;
          updateDesignerLivePreview();
        });
        oRow.querySelector('button').addEventListener('click', () => {
          kw.choice.opts.splice(oIdx, 1);
          renderV19KeywordsEditor();
          updateDesignerLivePreview();
        });
        cWrap.appendChild(oRow);
      });
      cWrap.querySelector('.btn-add-choice-opt').addEventListener('click', () => {
        kw.choice.opts.push({ t: '新抉择分支效果', reans: [] });
        renderV19KeywordsEditor();
        updateDesignerLivePreview();
      });
      subBox.appendChild(cWrap);
    }

    // 渲染招募 / 亡者召还子列表 (kw.reans)
    if (Array.isArray(kw.reans) && kw.reans.length > 0) {
      const rWrap = document.createElement('div');
      rWrap.className = 'bg-slate-950 border border-indigo-500/40 rounded-lg p-2 space-y-1.5';
      kw.reans.forEach((r, rIdx) => {
        const rRow = document.createElement('div');
        rRow.className = 'flex flex-wrap items-center gap-1.5 text-[11px]';
        const rE = r.costs ? (r.costs.energy || 0) : 2;
        rRow.innerHTML = `
          <select class="rean-k bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-indigo-300 font-bold">
            <option value="招募" ${r.k === '招募' ? 'selected' : ''}>招募</option>
            <option value="亡者召还" ${r.k === '亡者召还' ? 'selected' : ''}>亡者召还</option>
          </select>
          <span>能量≤</span>
          <input type="number" min="0" max="15" value="${rE}" class="rean-e w-12 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-white font-black" />
          <span>限定种族:</span>
          <input type="text" value="${r.type || ''}" placeholder="如：机械" class="rean-t w-20 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-sky-300" />
          <input type="text" value="${r.effect || ''}" placeholder="附加：如 ，发动两次。" class="rean-eff flex-1 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-white" />
          <button type="button" class="rean-del px-1.5 py-0.5 rounded bg-slate-800 hover:bg-rose-700 text-slate-300">✕</button>
        `;
        rRow.querySelector('.rean-k').addEventListener('change', (ev) => { r.k = ev.target.value; updateDesignerLivePreview(); });
        rRow.querySelector('.rean-e').addEventListener('input', (ev) => {
          if (!r.costs) r.costs = { energy: 0, sacrifice: 0, bones: 0 };
          r.costs.energy = Number(ev.target.value || 0);
          updateDesignerLivePreview();
        });
        rRow.querySelector('.rean-t').addEventListener('input', (ev) => { r.type = ev.target.value; updateDesignerLivePreview(); });
        rRow.querySelector('.rean-eff').addEventListener('input', (ev) => { r.effect = ev.target.value; updateDesignerLivePreview(); });
        rRow.querySelector('.rean-del').addEventListener('click', () => {
          kw.reans.splice(rIdx, 1);
          renderV19KeywordsEditor();
          updateDesignerLivePreview();
        });
        rWrap.appendChild(rRow);
      });
      subBox.appendChild(rWrap);
    }

    // 绑定顶层字段事件
    card.querySelectorAll('[data-kw-field]').forEach(el => {
      const f = el.dataset.kwField;
      el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', () => {
        if (f === 'v') kw.v = Number(el.value || 0);
        else if (f === 'costE') {
          if (!kw.cost) kw.cost = { energy: 1, sacrifice: 0, bones: 0 };
          kw.cost.energy = Number(el.value || 0);
        } else if (f === 'when') kw.when = el.value;
        else if (f === 'res') kw.res = el.value;
        else if (f === 'choiceOn') {
          if (!kw.choice) kw.choice = { on: false, opts: [] };
          kw.choice.on = el.checked;
          renderV19KeywordsEditor();
        } else if (f === 'effect') kw.effect = el.value;
        updateDesignerLivePreview();
      });
    });

    card.querySelectorAll('[data-kw-act]').forEach(btn => {
      btn.addEventListener('click', () => {
        const act = btn.dataset.kwAct;
        if (act === 'removeKw') {
          v19DraftKeywords.splice(kIdx, 1);
          renderV19KeywordsEditor();
          updateDesignerLivePreview();
        } else if (act === 'addRean') {
          if (!Array.isArray(kw.reans)) kw.reans = [];
          kw.reans.push({ k: '招募', costs: { energy: 2, sacrifice: 0, bones: 0 }, type: '机械', effect: '' });
          renderV19KeywordsEditor();
          updateDesignerLivePreview();
        }
      });
    });

    box.appendChild(card);
  });
}

function populateDesignerCardSelector() {
  renderV19CardList();
}

function loadCardIntoDesigner(c) {
  if (!c) return;
  v19CurrentCardId = c.id;
  v19DraftArt = c.art || '';
  v19DraftKeywords = JSON.parse(JSON.stringify(c.keywords || []));

  const badge = document.getElementById('v19EditingIdBadge');
  if (badge) badge.textContent = `ID: ${c.id}`;
  document.getElementById('desName').value = c.name || '';
  document.getElementById('desEn').value = c.en || '';
  document.getElementById('desType').value = c.type || 'minion';
  document.getElementById('desRarity').value = c.rarity || '普通';
  document.getElementById('desRace').value = c.race || '';
  document.getElementById('desSacCond').value = c.sacrificeCond || '';
  document.getElementById('desEnergy').value = c.energy || 0;
  document.getElementById('desSacrifice').value = c.sacrifice || 0;
  document.getElementById('desBones').value = c.bones || 0;
  document.getElementById('desAtk').value = c.atk || 0;
  document.getElementById('desHp').value = c.hp || 1;
  document.getElementById('desTimer').value = c.timer || 0;
  document.getElementById('desFaith').value = c.faith || 0;
  document.getElementById('desCounter').value = c.counter || 0;
  document.getElementById('desText').value = c.text || '';
  document.getElementById('desNotes').value = c.notes || '';

  renderV19KeywordsEditor();
  renderV19CardList();
  updateDesignerLivePreview();
}

function buildDraftCardFromDesignerForm() {
  const cid = v19CurrentCardId || ('cmw' + Math.random().toString(36).slice(2, 12));
  const draft = {
    id: cid,
    name: document.getElementById('desName').value.trim() || '未命名卡牌',
    en: document.getElementById('desEn').value.trim(),
    type: document.getElementById('desType').value,
    rarity: document.getElementById('desRarity').value,
    race: document.getElementById('desRace').value.trim(),
    sacrificeCond: document.getElementById('desSacCond').value.trim(),
    faith: Number(document.getElementById('desFaith').value || 0),
    counter: Number(document.getElementById('desCounter').value || 0),
    energy: Number(document.getElementById('desEnergy').value || 0),
    sacrifice: Number(document.getElementById('desSacrifice').value || 0),
    bones: Number(document.getElementById('desBones').value || 0),
    atk: Number(document.getElementById('desAtk').value || 0),
    hp: Number(document.getElementById('desHp').value || 1),
    timer: Number(document.getElementById('desTimer').value || 0),
    keywords: JSON.parse(JSON.stringify(v19DraftKeywords)),
    text: document.getElementById('desText').value.trim(),
    flavor: '',
    notes: document.getElementById('desNotes').value.trim(),
    art: v19DraftArt || '',
    fullText: ''
  };
  draft.fullText = assembleV19FullText(draft);
  draft.ast = parseCardEffectAST(draft);
  return draft;
}

function updateValueCalculator(draft) {
  // 严格执行 v2.1 卡牌费用价值公式：能量×1 + 祭品×1.5 + 骨头×0.5
  const costVal = getCardCostValue(draft);
  const statVal = draft.type === 'minion' ? ((draft.atk || 0) * 0.5 + (draft.hp || 0) * 0.5) : 0;
  let effVal = 0;
  (draft.keywords || []).forEach(kw => {
    if (['入场曲', '谢幕曲', '瞬念召唤', '启动'].includes(kw.k)) effVal += 1.5;
    else if (['守护', '飞行', '屏障', '毁灭', '虹吸', '多重攻击', '全体攻击'].includes(kw.k)) effVal += 1.0;
    else effVal += 0.6;
  });
  if (draft.text) effVal += 1.2;
  const totalVal = statVal + effVal;

  document.getElementById('calcCostVal').textContent = costVal.toFixed(1);
  document.getElementById('calcStatVal').textContent = statVal.toFixed(1);
  document.getElementById('calcEffectVal').textContent = effVal.toFixed(1);
  document.getElementById('calcTotalVal').textContent = totalVal.toFixed(1);

  const badge = document.getElementById('calcVerdictBadge');
  const diff = totalVal - costVal;
  if (diff > 2.2) {
    badge.className = 'px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-400 text-rose-300 font-black';
    badge.textContent = '🔥 超模强卡';
  } else if (diff < -1.5) {
    badge.className = 'px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 font-black';
    badge.textContent = '⚠️ 略亏节奏';
  } else {
    badge.className = 'px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-black';
    badge.textContent = '✅ 模型平衡';
  }
}

function updateDesignerLivePreview() {
  const draft = buildDraftCardFromDesignerForm();
  updateValueCalculator(draft);

  const slot = document.getElementById('desLiveCardPreview');
  if (slot) {
    slot.innerHTML = '';
    const cardEl = buildHandCardDOM(draft);
    cardEl.style.cursor = 'default';
    slot.appendChild(cardEl);
  }
  const ftBox = document.getElementById('v19FullTextPreview');
  if (ftBox) ftBox.textContent = getCardDisplayText(draft);

  const exportNode = Object.assign({}, draft);
  delete exportNode.ast;
  delete exportNode.isToken;
  const pre = document.getElementById('desParsedAstBox');
  if (pre) pre.textContent = JSON.stringify(exportNode, null, 2);
}

['desName','desEn','desType','desRarity','desRace','desSacCond','desEnergy','desSacrifice','desBones','desAtk','desHp','desTimer','desFaith','desCounter','desText','desNotes'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', updateDesignerLivePreview);
});

document.getElementById('btnV19AddKeyword')?.addEventListener('click', () => {
  sfx.play('click');
  const k = document.getElementById('selV19AddKeywordType').value;
  const newKw = { k: k, v: ['荆棘','连击','爆能强化','结晶','激奏'].includes(k) ? 2 : 0, effect: '' };
  if (k === '启动') newKw.cost = { energy: 1, sacrifice: 0, bones: 0 };
  if (k === '瞬念召唤') newKw.when = 'end';
  if (['入场曲', '谢幕曲'].includes(k)) {
    newKw.choice = { on: false, opts: [{ t: '', reans: [] }, { t: '', reans: [] }] };
    newKw.reans = [];
  }
  v19DraftKeywords.push(newKw);
  renderV19KeywordsEditor();
  updateDesignerLivePreview();
});

document.getElementById('btnV19NewCard')?.addEventListener('click', () => {
  sfx.play('synergy');
  const newId = 'cmw' + Math.random().toString(36).slice(2, 12);
  const blank = {
    id: newId, name: '新设计卡牌', en: '', type: 'minion', rarity: '稀有', race: '机械', sacrificeCond: '',
    faith: 0, counter: 0, energy: 3, sacrifice: 0, bones: 0, atk: 3, hp: 3, timer: 0,
    keywords: [{ k: '入场曲', v: 0, effect: '抽取1张卡牌。', choice: { on: false, opts: [] }, reans: [] }],
    text: '', flavor: '', notes: '', art: '', fullText: '【入场曲】抽取1张卡牌。'
  };
  registerCardsFromDesigner([blank]);
  loadCardIntoDesigner(cardsById[newId]);
});

document.getElementById('btnV19DuplicateCard')?.addEventListener('click', () => {
  sfx.play('click');
  const draft = buildDraftCardFromDesignerForm();
  draft.id = 'cmw' + Math.random().toString(36).slice(2, 12);
  draft.name = draft.name + '·改';
  registerCardsFromDesigner([draft]);
  loadCardIntoDesigner(cardsById[draft.id]);
});

document.getElementById('btnV19DeleteCard')?.addEventListener('click', () => {
  if (allCards.length <= 1 || !v19CurrentCardId) return;
  sfx.play('sacrifice');
  const delName = cardsById[v19CurrentCardId]?.name || '';
  delete cardsById[v19CurrentCardId];
  delete cardsByName[delName];
  allCards = Object.values(cardsById);
  loadCardIntoDesigner(allCards[0]);
});

document.getElementById('inputV19Search')?.addEventListener('input', renderV19CardList);

document.getElementById('inputV19ArtFile')?.addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    v19DraftArt = String(ev.target.result || '');
    artCache[v19CurrentCardId] = v19DraftArt;
    updateDesignerLivePreview();
  };
  reader.readAsDataURL(file);
});

document.getElementById('btnV19ClearArt')?.addEventListener('click', () => {
  sfx.play('click');
  v19DraftArt = '';
  if (v19CurrentCardId) delete artCache[v19CurrentCardId];
  updateDesignerLivePreview();
});

document.getElementById('btnCreateCardToGame')?.addEventListener('click', () => {
  sfx.play('legend');
  const draft = buildDraftCardFromDesignerForm();
  delete artCache[draft.id];
  delete artCache[draft.name];
  const exIdx = v19DesignerCards.findIndex(x => x.id === draft.id);
  if (exIdx >= 0) v19DesignerCards[exIdx] = draft;
  else v19DesignerCards.unshift(draft);
  saveDesignerSandboxCards();
  renderV19CardList();
  const fb = document.getElementById('desFeedbackTxt');
  fb.textContent = `✅「${draft.name}」已保存至设计草稿箱（仅支持导出，不影响对战卡池）！`;
  setTimeout(() => { fb.textContent = ''; }, 3500);
});

document.getElementById('btnV19ImportJson')?.addEventListener('click', triggerLocalJsonFileDialog);

document.getElementById('btnExportAllJson')?.addEventListener('click', () => {
  sfx.play('play');
  const draft = buildDraftCardFromDesignerForm();
  const exIdx = v19DesignerCards.findIndex(x => x.id === draft.id);
  if (exIdx >= 0) v19DesignerCards[exIdx] = draft; else v19DesignerCards.unshift(draft);
  saveDesignerSandboxCards();
  const cleanCards = v19DesignerCards.map(c => {
    const copy = Object.assign({}, c);
    delete copy.ast;
    delete copy.isToken;
    return copy;
  });
  const exportPayload = {
    meta: { game: "卡牌构筑对战", version: "2.1", exportedAt: new Date().toISOString(), count: cleanCards.length },
    rules: RULES,
    cards: cleanCards
  };
  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ccg-cards-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

// ============================================================================
// 二级菜单：📘 基础游戏教程弹窗控制
// ============================================================================
document.getElementById('btnOpenTutorial')?.addEventListener('click', (e) => {
  e.stopPropagation();
  sfx.play('click');
  document.getElementById('tutorialModal').classList.remove('hidden');
});

document.getElementById('btnCloseTutorial')?.addEventListener('click', (e) => {
  e.stopPropagation();
  sfx.play('click');
  document.getElementById('tutorialModal').classList.add('hidden');
});

document.querySelectorAll('.tut-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    sfx.play('click');
    const tab = btn.dataset.tutTab;
    document.querySelectorAll('.tut-tab-btn').forEach(b => {
      b.className = 'tut-tab-btn text-left px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-slate-300 hover:bg-slate-800';
    });
    btn.className = 'tut-tab-btn text-left px-3.5 py-2.5 rounded-xl text-xs font-black bg-amber-500 text-slate-950';
    document.querySelectorAll('.tut-pane').forEach(p => p.classList.add('hidden'));
    const targetPane = document.getElementById(`tutTab_${tab}`);
    if (targetPane) targetPane.classList.remove('hidden');
  });
});

function triggerLocalJsonFileDialog() {
  sfx.play('click');
  const inp = document.getElementById('fileImportInput');
  inp.value = '';
  inp.click();
}
document.getElementById('btnOpenFileImport')?.addEventListener('click', triggerLocalJsonFileDialog);
document.getElementById('btnDeckImportFile')?.addEventListener('click', triggerLocalJsonFileDialog);

document.getElementById('fileImportInput')?.addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const parsed = JSON.parse(String(ev.target.result || ''));
      const cardArr = Array.isArray(parsed) ? parsed : (parsed.cards || []);
      if (!Array.isArray(cardArr) || cardArr.length === 0) throw new Error('未找到有效的 cards 数组');
      const cnt = registerCardsFromDesigner(cardArr);
      sfx.play('legend');
      switchScreen('deck');
      const toast = document.getElementById('importStatusToast');
      toast.classList.remove('hidden');
      toast.textContent = `✅ 已从电脑文件「${file.name}」成功导入并解析 ${cnt} 张卡牌效果！`;
      renderDeckEditor();
    } catch (err) {
      sfx.play('hit');
      switchScreen('deck');
      const toast = document.getElementById('importStatusToast');
      toast.classList.remove('hidden');
      toast.textContent = `❌ 导入失败：${err.message}`;
    }
  };
  reader.readAsText(file, 'utf-8');
});

function switchScreen(name) {
  const surBtn = document.getElementById('btnTopSurrenderExit');
  const backBtn = document.getElementById('btnTopBackMenu');
  if (surBtn) surBtn.classList.toggle('hidden', name !== 'battle');
  if (backBtn) backBtn.classList.toggle('hidden', name === 'battle');
  if (name === 'battle') {
    const deckObj = PRESET_DECKS[currentDeckIndex];
    const total = getDeckTotal(deckObj);
    if (total !== RULES.deckSize) {
      sfx.play('hit');
      showDeckEditorToast(`⚠️ 牌组必须恰好为 ${RULES.deckSize} 张才能开始对战（当前 ${total} 张）！`, true);
      name = 'deck';
    }
  }
  sfx.play('click');
  document.getElementById('screenBattle').classList.toggle('hidden', name !== 'battle');
  document.getElementById('screenDeck').classList.toggle('hidden', name !== 'deck');
  document.getElementById('screenDesigner').classList.toggle('hidden', name !== 'designer');
  document.getElementById('screenCode').classList.toggle('hidden', name !== 'code');
  if (name !== 'battle') {
    document.getElementById('mulliganModal')?.classList.add('hidden');
    document.getElementById('victoryDefeatModal')?.classList.add('hidden');
    document.getElementById('handPickModal')?.classList.add('hidden');
    document.getElementById('svDetailPanel')?.classList.add('hidden');
    document.getElementById('battleRecordPanel')?.classList.add('hidden');
    document.getElementById('oppSpellShowcaseModal')?.classList.add('hidden');
  }
  if (name === 'deck') renderDeckEditor();
  if (typeof publishOnlinePresence === 'function') publishOnlinePresence(false);
  if (name === 'designer') { renderV19CardList(); if (v19DesignerCards.length > 0) loadCardIntoDesigner(v19DesignerCards[0]); else document.getElementById('btnV19NewCard')?.click(); }
  if (name === 'code' && !document.getElementById('gdSourcePre').textContent) {
    document.getElementById('gdSourcePre').textContent = GD_SOURCES['EffectScriptParser.gd'] || '';
  }
}

document.getElementById('btnNavBattle')?.addEventListener('click', () => switchScreen('battle'));
document.getElementById('btnNavDeck')?.addEventListener('click', () => switchScreen('deck'));
document.getElementById('btnNavDesigner')?.addEventListener('click', () => switchScreen('designer'));
document.getElementById('btnNavCode')?.addEventListener('click', () => switchScreen('code'));

document.querySelectorAll('.gd-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    sfx.play('click');
    document.getElementById('gdSourcePre').textContent = GD_SOURCES[btn.dataset.gd] || '';
    document.querySelectorAll('.gd-tab-btn').forEach(b => {
      b.className = 'gd-tab-btn px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-200';
    });
    btn.className = 'gd-tab-btn px-3 py-1.5 rounded-lg text-xs font-black bg-emerald-500 text-slate-950';
  });
});

document.getElementById('btnToggleMute')?.addEventListener('click', (e) => {
  sfx.muted = !sfx.muted;
  e.target.textContent = sfx.muted ? '🔇' : '🔊';
});

['mousedown', 'keydown', 'touchstart'].forEach(ev => window.addEventListener(ev, () => sfx.init(), { once: true }));

// ============================================================================
// 新增模块 A：左侧战局统计面板（查看敌我双方已使用卡牌[按费用从上到下排序+张数]与被破坏卡牌）
// ============================================================================
let activeBattleLogSide = 0; // 0 = 我方, 1 = 敌方

function aggregateCardsByEnergyAsc(cardDataArray) {
  const map = new Map();
  (cardDataArray || []).forEach(cd => {
    if (!cd) return;
    const prev = map.get(cd.id);
    if (prev) prev.count += 1;
    else map.set(cd.id, { card: cd, count: 1 });
  });
  return Array.from(map.values()).sort((a, b) => {
    if ((a.card.energy || 0) !== (b.card.energy || 0)) return (a.card.energy || 0) - (b.card.energy || 0);
    return String(a.card.name).localeCompare(String(b.card.name));
  });
}

function renderBattleRecordPanel() {
  const panel = document.getElementById('battleRecordPanel');
  if (!panel || !battle.leaders[0] || !battle.leaders[1]) return;
  const st = battle.leaders[activeBattleLogSide];

  const playedGroups = aggregateCardsByEnergyAsc(st.playedCardsLog);
  const destroyedGroups = aggregateCardsByEnergyAsc(st.graveyard);

  document.getElementById('logPlayedTotalBadge').textContent = `共 ${(st.playedCardsLog || []).length} 张`;
  document.getElementById('logDestroyedTotalBadge').textContent = `共 ${(st.graveyard || []).length} 张`;

  const pBox = document.getElementById('logPlayedList');
  const dBox = document.getElementById('logDestroyedList');
  pBox.innerHTML = '';
  dBox.innerHTML = '';

  if (playedGroups.length === 0) {
    pBox.innerHTML = `<div class="text-[11px] text-slate-500 text-center py-6">本局尚未使用卡牌</div>`;
  } else {
    playedGroups.forEach(({ card, count }) => {
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between bg-slate-950/90 hover:bg-slate-800 border border-slate-800 rounded-lg px-2 py-1.5 text-xs cursor-pointer transition';
      row.innerHTML = `
        <div class="flex items-center gap-1.5 min-w-0 flex-1">
          <span class="w-5 h-5 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-[10px] shrink-0">${card.energy}</span>
          <span class="font-bold text-slate-100 truncate">${card.name}</span>
        </div>
        <span class="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-black text-[10px] shrink-0">×${count}</span>
      `;
      row.addEventListener('click', (e) => {
        e.stopPropagation();
        sfx.play('click');
        openCardDetailPanel({ data: card, currentAtk: card.atk, currentHp: card.hp, maxHp: card.hp, owner: activeBattleLogSide, activeKw: {}, grantedEffects: [], extraLastWords: [] }, 'log', activeBattleLogSide, -1, row);
      });
      pBox.appendChild(row);
    });
  }

  if (destroyedGroups.length === 0) {
    dBox.innerHTML = `<div class="text-[11px] text-slate-500 text-center py-6">尚无被破坏的随从</div>`;
  } else {
    destroyedGroups.forEach(({ card, count }) => {
      const hasLW = (card.keywords || []).some(k => k.k === '谢幕曲') || String(card.fullText || '').includes('谢幕曲');
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between bg-slate-950/90 hover:bg-slate-800 border border-slate-800 rounded-lg px-2 py-1.5 text-xs cursor-pointer transition';
      row.innerHTML = `
        <div class="flex items-center gap-1.5 min-w-0 flex-1">
          <span class="w-5 h-5 rounded-full bg-rose-800 text-white font-black flex items-center justify-center text-[10px] shrink-0">${card.energy}</span>
          <span class="font-bold text-slate-100 truncate">${card.name}</span>
          ${hasLW ? `<span class="text-[10px]" title="含有谢幕曲">💀</span>` : ''}
        </div>
        <span class="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-black text-[10px] shrink-0">×${count}</span>
      `;
      row.addEventListener('click', (e) => {
        e.stopPropagation();
        sfx.play('click');
        openCardDetailPanel({ data: card, currentAtk: card.atk, currentHp: card.hp, maxHp: card.hp, owner: activeBattleLogSide, activeKw: {}, grantedEffects: [], extraLastWords: [] }, 'log', activeBattleLogSide, -1, row);
      });
      dBox.appendChild(row);
    });
  }
}

document.getElementById('btnToggleBattleLog')?.addEventListener('click', (e) => {
  e.stopPropagation();
  sfx.play('click');
  const p = document.getElementById('battleRecordPanel');
  p.classList.toggle('hidden');
  // 规则：「卡牌详细面板打开时如果打开了战局记录，将详细面板关闭」
  battle.inspectedCard = null;
  document.getElementById('svDetailPanel').classList.add('hidden'); document.querySelectorAll('#playerHandZone .sv-hand-card.is-inspected').forEach(el => el.classList.remove('is-inspected'));
  if (!p.classList.contains('hidden')) renderBattleRecordPanel();
});

document.getElementById('btnCloseBattleLog')?.addEventListener('click', (e) => {
  e.stopPropagation();
  sfx.play('click');
  document.getElementById('battleRecordPanel').classList.add('hidden');
});

document.getElementById('tabLogPlayer')?.addEventListener('click', (e) => {
  e.stopPropagation();
  sfx.play('click');
  activeBattleLogSide = 0;
  document.getElementById('tabLogPlayer').className = 'flex-1 py-1.5 rounded-lg text-xs font-black bg-cyan-500 text-slate-950 transition';
  document.getElementById('tabLogEnemy').className = 'flex-1 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 hover:text-white transition';
  renderBattleRecordPanel();
});

document.getElementById('tabLogEnemy')?.addEventListener('click', (e) => {
  e.stopPropagation();
  sfx.play('click');
  activeBattleLogSide = 1;
  document.getElementById('tabLogEnemy').className = 'flex-1 py-1.5 rounded-lg text-xs font-black bg-rose-500 text-white transition';
  document.getElementById('tabLogPlayer').className = 'flex-1 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 hover:text-white transition';
  renderBattleRecordPanel();
});

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
  const mulScale = Math.max(0.30, Math.min(1, (vw - 24) / 1120, (vh - 20) / 690));
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


// ============================================================================
// v15 自定义主战者形象生成器 + 主菜单 + 联机握手强化
// ============================================================================
const AVATAR_PRESETS = {
  backdrop: [
    { id: 'star', label: '苍穹星海', bg1: '#0f172a', bg2: '#1d4ed8', glow: '#38bdf8' },
    { id: 'flame', label: '炼狱赤焰', bg1: '#450a0a', bg2: '#c2410c', glow: '#fb923c' },
    { id: 'void', label: '幽冥紫雾', bg1: '#1e1b4b', bg2: '#6d28d9', glow: '#c084fc' },
    { id: 'cyber', label: '赛博霓虹', bg1: '#042f2e', bg2: '#0d9488', glow: '#2dd4bf' },
    { id: 'gold', label: '圣殿金辉', bg1: '#422006', bg2: '#a16207', glow: '#fde047' }
  ],
  hairStyle: [
    { id: 'twintail', label: '龙翼双马尾' },
    { id: 'long', label: '银辉长直发' },
    { id: 'short', label: '暗夜短发' },
    { id: 'ponytail', label: '炽焰高马尾' },
    { id: 'hood', label: '圣殿兜帽' },
    { id: 'cyberbob', label: '机械短发' }
  ],
  hairColor: [
    { id: 'emerald', label: '翠绿', c1: '#34d399', c2: '#065f46' },
    { id: 'gold', label: '金耀', c1: '#fde047', c2: '#b45309' },
    { id: 'azure', label: '苍蓝', c1: '#60a5fa', c2: '#1e3a8a' },
    { id: 'crimson', label: '绯红', c1: '#fb7185', c2: '#9f1239' },
    { id: 'silver', label: '银白', c1: '#f1f5f9', c2: '#64748b' },
    { id: 'violet', label: '紫魅', c1: '#c084fc', c2: '#581c87' }
  ],
  eyeStyle: [
    { id: 'sharp', label: '金瞳战意', color: '#fbbf24', visor: false },
    { id: 'crimson', label: '龙瞳赤芒', color: '#f43f5e', visor: false },
    { id: 'azure', label: '苍穹蓝瞳', color: '#38bdf8', visor: false },
    { id: 'hetero', label: '异色双瞳', color: '#fbbf24', color2: '#c084fc', visor: false },
    { id: 'visor', label: '赛博目镜', color: '#2dd4bf', visor: true }
  ],
  outfit: [
    { id: 'knight', label: '龙骑重甲' },
    { id: 'mage', label: '冥界法袍' },
    { id: 'mech', label: '赛博机甲' },
    { id: 'paladin', label: '圣殿战衣' },
    { id: 'assassin', label: '暗影刺客装' },
    { id: 'coat', label: '统帅风衣' }
  ],
  armorColor: [
    { id: 'obsidian', label: '曜石黑金', c1: '#1e293b', c2: '#fbbf24' },
    { id: 'royal', label: '皇家深蓝', c1: '#1e3a8a', c2: '#38bdf8' },
    { id: 'crimson', label: '血焰绯红', c1: '#7f1d1d', c2: '#fde047' },
    { id: 'amethyst', label: '幽冥暗紫', c1: '#3b0764', c2: '#c084fc' },
    { id: 'jade', label: '翡翠机甲', c1: '#064e3b', c2: '#2dd4bf' },
    { id: 'ivory', label: '圣白金边', c1: '#e2e8f0', c2: '#d97706' }
  ],
  wings: [
    { id: 'light', label: '苍穹光翼' },
    { id: 'dragon', label: '炎龙双翼' },
    { id: 'demon', label: '暗影恶魔翼' },
    { id: 'funnels', label: '机械浮游炮' },
    { id: 'cape', label: '王者披风' },
    { id: 'none', label: '无背饰' }
  ],
  weapon: [
    { id: 'lance', label: '苍穹龙枪' },
    { id: 'staff', label: '冥界法杖' },
    { id: 'blade', label: '赛博光刃' },
    { id: 'shield', label: '圣殿巨盾' },
    { id: 'none', label: '空手' }
  ],
  headgear: [
    { id: 'horns', label: '龙族双角' },
    { id: 'halo', label: '圣光光环' },
    { id: 'cat', label: '猫耳发箍' },
    { id: 'antenna', label: '机械天线' },
    { id: 'crown', label: '王者金冠' },
    { id: 'none', label: '无头饰' }
  ]
};

let userAvatarConfig = (() => {
  try {
    const raw = localStorage.getItem('cf_custom_avatar_v1');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { backdrop: 'star', hairStyle: 'twintail', hairColor: 'emerald', eyeStyle: 'sharp', outfit: 'knight', armorColor: 'obsidian', wings: 'light', weapon: 'lance', headgear: 'horns' };
})();

const _customAvatarCache = {};
function renderCustomAvatarDataURI(cfg) {
  const c = Object.assign({ backdrop: 'star', hairStyle: 'twintail', hairColor: 'emerald', eyeStyle: 'sharp', outfit: 'knight', armorColor: 'obsidian', wings: 'light', weapon: 'lance', headgear: 'horns' }, cfg || userAvatarConfig || {});
  const cacheKey = `${c.backdrop}_${c.hairStyle}_${c.hairColor}_${c.eyeStyle}_${c.outfit}_${c.armorColor}_${c.wings}_${c.weapon}_${c.headgear}`;
  if (_customAvatarCache[cacheKey]) return _customAvatarCache[cacheKey];

  const bd = AVATAR_PRESETS.backdrop.find(x => x.id === c.backdrop) || AVATAR_PRESETS.backdrop[0];
  const hc = AVATAR_PRESETS.hairColor.find(x => x.id === c.hairColor) || AVATAR_PRESETS.hairColor[0];
  const eye = AVATAR_PRESETS.eyeStyle.find(x => x.id === c.eyeStyle) || AVATAR_PRESETS.eyeStyle[0];
  const ac = AVATAR_PRESETS.armorColor.find(x => x.id === c.armorColor) || AVATAR_PRESETS.armorColor[0];
  const eye2Color = eye.color2 || eye.color;

  const cvs = document.createElement('canvas');
  cvs.width = 280;
  cvs.height = 220;
  const ctx = cvs.getContext('2d');
  const cx = 140, cy = 86;

  // 1) 径向深邃背景与魔法阵光晕
  const g = ctx.createRadialGradient(cx, cy, 12, cx, cy + 16, 155);
  g.addColorStop(0, bd.bg2);
  g.addColorStop(0.6, bd.bg1);
  g.addColorStop(1, '#040711');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 280, 220);

  ctx.save();
  ctx.strokeStyle = bd.glow;
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy + 10, 78, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy + 10, 58, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  // 2) 背部羽翼 / 披风 / 浮游炮
  ctx.save();
  if (c.wings === 'light' || c.wings === 'dragon' || c.wings === 'demon') {
    ctx.fillStyle = c.wings === 'dragon' ? '#f97316' : (c.wings === 'demon' ? '#7c3aed' : bd.glow);
    ctx.strokeStyle = c.wings === 'demon' ? '#e9d5ff' : '#e0f2fe';
    ctx.lineWidth = 2;
    [-1, 1].forEach(dir => {
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.moveTo(cx + dir * 20, cy + 18);
        ctx.lineTo(cx + dir * (116 - k * 14), cy - 44 + k * 26);
        ctx.lineTo(cx + dir * (92 - k * 12), cy - 10 + k * 26);
        ctx.closePath();
        ctx.globalAlpha = 0.8 - k * 0.15;
        ctx.fill();
        ctx.globalAlpha = 0.95;
        ctx.stroke();
      }
    });
  } else if (c.wings === 'funnels') {
    [-1, 1].forEach(dir => {
      [0, 1].forEach(k => {
        const fx = cx + dir * (78 + k * 18), fy = cy - 16 + k * 34;
        ctx.fillStyle = '#0f172a'; ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(fx - 10, fy - 16, 20, 32, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#22d3ee'; ctx.beginPath(); ctx.arc(fx, fy, 4, 0, Math.PI * 2); ctx.fill();
      });
    });
  } else if (c.wings === 'cape') {
    ctx.fillStyle = ac.c1; ctx.strokeStyle = ac.c2; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 42, cy + 28);
    ctx.lineTo(cx - 92, cy + 134);
    ctx.lineTo(cx + 92, cy + 134);
    ctx.lineTo(cx + 42, cy + 28);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.restore();

  // 3) 后发造型
  ctx.save();
  ctx.fillStyle = hc.c2;
  if (c.hairStyle === 'twintail') {
    [-1, 1].forEach(dir => {
      ctx.beginPath();
      ctx.moveTo(cx + dir * 32, cy - 22);
      ctx.quadraticCurveTo(cx + dir * 92, cy + 18, cx + dir * 78, cy + 108);
      ctx.quadraticCurveTo(cx + dir * 48, cy + 88, cx + dir * 36, cy + 18);
      ctx.closePath(); ctx.fill();
    });
  } else if (c.hairStyle === 'ponytail') {
    ctx.beginPath();
    ctx.moveTo(cx + 18, cy - 38);
    ctx.quadraticCurveTo(cx + 96, cy - 12, cx + 82, cy + 86);
    ctx.quadraticCurveTo(cx + 48, cy + 56, cx + 24, cy - 10);
    ctx.closePath(); ctx.fill();
  } else if (c.hairStyle === 'long') {
    ctx.beginPath();
    ctx.moveTo(cx - 42, cy - 24);
    ctx.quadraticCurveTo(cx - 84, cy + 48, cx - 66, cy + 120);
    ctx.lineTo(cx + 66, cy + 120);
    ctx.quadraticCurveTo(cx + 84, cy + 48, cx + 42, cy - 24);
    ctx.closePath(); ctx.fill();
  } else if (c.hairStyle === 'hood') {
    ctx.fillStyle = ac.c1; ctx.strokeStyle = ac.c2; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 56, cy + 40);
    ctx.quadraticCurveTo(cx - 52, cy - 52, cx, cy - 56);
    ctx.quadraticCurveTo(cx + 52, cy - 52, cx + 56, cy + 40);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.arc(cx, cy - 14, 38, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  // 4) 身体躯干、肩甲、服饰与手臂
  ctx.save();
  ctx.fillStyle = ac.c1; ctx.strokeStyle = ac.c2; ctx.lineWidth = 2.8;
  // 身体主体
  ctx.beginPath();
  ctx.moveTo(cx - 58, cy + 134);
  ctx.quadraticCurveTo(cx - 46, cy + 34, cx - 18, cy + 26);
  ctx.lineTo(cx + 18, cy + 26);
  ctx.quadraticCurveTo(cx + 46, cy + 34, cx + 58, cy + 134);
  ctx.closePath(); ctx.fill(); ctx.stroke();

  if (c.outfit === 'knight' || c.outfit === 'mech') {
    // 强化重装肩甲
    [-1, 1].forEach(dir => {
      ctx.beginPath();
      ctx.moveTo(cx + dir * 24, cy + 30);
      ctx.lineTo(cx + dir * 68, cy + 38);
      ctx.lineTo(cx + dir * 56, cy + 68);
      ctx.lineTo(cx + dir * 26, cy + 54);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    });
  } else if (c.outfit === 'mage' || c.outfit === 'paladin') {
    // 高领法袍/圣殿领饰
    ctx.beginPath();
    ctx.moveTo(cx - 32, cy + 22); ctx.lineTo(cx - 42, cy + 58);
    ctx.lineTo(cx, cy + 72); ctx.lineTo(cx + 42, cy + 58); ctx.lineTo(cx + 32, cy + 22);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (c.outfit === 'assassin' || c.outfit === 'coat') {
    // 交叉腰带与风衣翻领
    ctx.beginPath(); ctx.moveTo(cx - 26, cy + 36); ctx.lineTo(cx + 36, cy + 122); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 26, cy + 36); ctx.lineTo(cx - 36, cy + 122); ctx.stroke();
  }
  // 胸口核心纹章宝石
  ctx.fillStyle = bd.glow;
  ctx.beginPath(); ctx.arc(cx, cy + 58, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();

  // 5) 手持武器/盾牌
  ctx.save();
  if (c.weapon === 'lance') {
    ctx.strokeStyle = '#fde047'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(cx + 58, cy + 132); ctx.lineTo(cx + 88, cy - 38); ctx.stroke();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath(); ctx.moveTo(cx + 88, cy - 38); ctx.lineTo(cx + 76, cy - 12); ctx.lineTo(cx + 96, cy - 10); ctx.closePath(); ctx.fill();
  } else if (c.weapon === 'staff') {
    ctx.strokeStyle = '#c084fc'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(cx - 64, cy + 132); ctx.lineTo(cx - 76, cy - 22); ctx.stroke();
    ctx.fillStyle = '#fde047';
    ctx.beginPath(); ctx.arc(cx - 76, cy - 28, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else if (c.weapon === 'blade') {
    ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(cx + 52, cy + 102); ctx.lineTo(cx + 108, cy + 14); ctx.stroke();
  } else if (c.weapon === 'shield') {
    ctx.fillStyle = ac.c1; ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 96, cy + 44); ctx.lineTo(cx - 44, cy + 44);
    ctx.lineTo(cx - 48, cy + 112); ctx.lineTo(cx - 70, cy + 130); ctx.lineTo(cx - 92, cy + 112);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.restore();

  // 6) 脸部与双眼
  ctx.save();
  ctx.fillStyle = '#fff1e6';
  ctx.beginPath();
  ctx.moveTo(cx - 28, cy - 15);
  ctx.quadraticCurveTo(cx - 28, cy + 16, cx, cy + 26);
  ctx.quadraticCurveTo(cx + 28, cy + 16, cx + 28, cy - 15);
  ctx.arc(cx, cy - 15, 28, 0, Math.PI, true);
  ctx.closePath(); ctx.fill();

  if (eye.visor) {
    ctx.fillStyle = '#042f2e'; ctx.strokeStyle = '#2dd4bf'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.roundRect(cx - 24, cy - 7, 48, 13, 6); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#99f6e4';
    ctx.beginPath(); ctx.moveTo(cx - 16, cy - 0.5); ctx.lineTo(cx + 16, cy - 0.5); ctx.stroke();
  } else {
    [[-12, eye.color], [12, eye2Color]].forEach(([dx, col]) => {
      const ex = cx + dx, ey = cy;
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(ex, ey, 7, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(ex, ey + 0.5, 5, 5.2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#090d16'; ctx.beginPath(); ctx.arc(ex, ey + 1, 2.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(ex - 2, ey - 2, 2, 0, Math.PI * 2); ctx.fill();
    });
  }

  // 7) 前发刘海
  ctx.fillStyle = hc.c1;
  ctx.beginPath();
  ctx.arc(cx, cy - 15, 31, Math.PI, Math.PI * 2);
  ctx.lineTo(cx + 31, cy + 3); ctx.lineTo(cx + 18, cy - 10);
  ctx.lineTo(cx + 6, cy + 3); ctx.lineTo(cx - 6, cy - 11);
  ctx.lineTo(cx - 18, cy + 3); ctx.lineTo(cx - 31, cy + 3);
  ctx.closePath(); ctx.fill();

  // 8) 头饰
  if (c.headgear === 'horns') {
    ctx.fillStyle = '#fbbf24'; ctx.strokeStyle = '#78350f'; ctx.lineWidth = 2;
    [-1, 1].forEach(dir => {
      ctx.beginPath();
      ctx.moveTo(cx + dir * 18, cy - 38);
      ctx.quadraticCurveTo(cx + dir * 42, cy - 68, cx + dir * 28, cy - 82);
      ctx.quadraticCurveTo(cx + dir * 24, cy - 58, cx + dir * 8, cy - 42);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    });
  } else if (c.headgear === 'halo') {
    ctx.strokeStyle = '#fde047'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(cx, cy - 58, 34, 8, 0, 0, Math.PI * 2); ctx.stroke();
  } else if (c.headgear === 'cat') {
    ctx.fillStyle = hc.c1; ctx.strokeStyle = '#f472b6'; ctx.lineWidth = 2;
    [-1, 1].forEach(dir => {
      ctx.beginPath(); ctx.moveTo(cx + dir * 26, cy - 34); ctx.lineTo(cx + dir * 34, cy - 66); ctx.lineTo(cx + dir * 8, cy - 44); ctx.closePath(); ctx.fill(); ctx.stroke();
    });
  } else if (c.headgear === 'antenna') {
    ctx.strokeStyle = '#22d3ee'; ctx.fillStyle = '#22d3ee'; ctx.lineWidth = 3;
    [-1, 1].forEach(dir => {
      ctx.beginPath(); ctx.moveTo(cx + dir * 22, cy - 36); ctx.lineTo(cx + dir * 36, cy - 70); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx + dir * 36, cy - 70, 5, 0, Math.PI * 2); ctx.fill();
    });
  } else if (c.headgear === 'crown') {
    ctx.fillStyle = '#fbbf24'; ctx.strokeStyle = '#92400e'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 24, cy - 40); ctx.lineTo(cx - 18, cy - 66); ctx.lineTo(cx - 8, cy - 50);
    ctx.lineTo(cx, cy - 72); ctx.lineTo(cx + 8, cy - 50); ctx.lineTo(cx + 18, cy - 66); ctx.lineTo(cx + 24, cy - 40);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.restore();

  const uri = cvs.toDataURL('image/png');
  _customAvatarCache[cacheKey] = uri;
  return uri;
}

function applyUserAvatarToUI() {
  const uri = renderCustomAvatarDataURI(userAvatarConfig);
  const pImg = document.getElementById('playerLeaderImg');
  if (pImg) pImg.src = uri;
  const mImg = document.getElementById('menuAvatarImg');
  if (mImg) mImg.src = uri;
  const pvImg = document.getElementById('avatarPreviewImg');
  if (pvImg) pvImg.src = uri;
  const nickEl = document.getElementById('menuNickText');
  if (nickEl) nickEl.textContent = OnlineState.nickname || '决斗者';
  const deckBadge = document.getElementById('menuActiveDeckBadge');
  if (deckBadge && typeof PRESET_DECKS !== 'undefined') {
    const d = PRESET_DECKS[currentDeckIndex] || PRESET_DECKS[0];
    const cnt = typeof expandDeck === 'function' ? expandDeck(d).length : 40;
    deckBadge.textContent = `🃏 当前出战卡组：${d ? d.name : '默认卡组'} (${cnt}张)`;
  }
}

function openAvatarCustomizerModal() {
  const modal = document.getElementById('leaderAvatarModal');
  const grid = document.getElementById('avatarOptionsGrid');
  if (!modal || !grid) return;
  const sections = [
    { key: 'outfit', title: '🛡️ 身体服饰 / 战甲' },
    { key: 'armorColor', title: '🎨 战甲配色' },
    { key: 'wings', title: '🪽 背部光翼 / 披风 / 浮游炮' },
    { key: 'weapon', title: '⚔️ 手持武器 / 巨盾' },
    { key: 'hairStyle', title: '💇 发型' },
    { key: 'hairColor', title: '✨ 发色' },
    { key: 'eyeStyle', title: '👁️ 瞳色 / 目镜' },
    { key: 'headgear', title: '👑 头饰 / 龙角 / 光环' },
    { key: 'backdrop', title: '🌌 背景光效' }
  ];
  function renderGrid() {
    grid.innerHTML = '';
    sections.forEach(sec => {
      const box = document.createElement('div');
      box.innerHTML = `<div style="font-size:12px;font-weight:900;color:#cbd5e1;margin-bottom:5px;">${sec.title}</div>`;
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;';
      AVATAR_PRESETS[sec.key].forEach(opt => {
        const active = userAvatarConfig[sec.key] === opt.id;
        const b = document.createElement('button');
        b.textContent = opt.label;
        b.style.cssText = `padding:5px 9px;border-radius:8px;font-size:11px;font-weight:800;cursor:pointer;border:1.5px solid ${active ? '#fbbf24' : '#475569'};background:${active ? '#b45309' : '#1e293b'};color:${active ? '#fff' : '#cbd5e1'};`;
        b.onclick = () => {
          userAvatarConfig[sec.key] = opt.id;
          applyUserAvatarToUI();
          renderGrid();
        };
        row.appendChild(b);
      });
      box.appendChild(row);
      grid.appendChild(box);
    });
    applyUserAvatarToUI();
  }
  renderGrid();
  modal.classList.remove('hidden');
}

document.getElementById('btnOpenAvatarCustomizer')?.addEventListener('click', openAvatarCustomizerModal);
document.getElementById('btnCloseAvatarModal')?.addEventListener('click', () => document.getElementById('leaderAvatarModal').classList.add('hidden'));
document.getElementById('btnRandomAvatar')?.addEventListener('click', () => {
  Object.keys(AVATAR_PRESETS).forEach(k => {
    const arr = AVATAR_PRESETS[k];
    userAvatarConfig[k] = arr[Math.floor(Math.random() * arr.length)].id;
  });
  openAvatarCustomizerModal();
});
document.getElementById('btnSaveAvatar')?.addEventListener('click', () => {
  try { localStorage.setItem('cf_custom_avatar_v1', JSON.stringify(userAvatarConfig)); } catch (e) {}
  applyUserAvatarToUI();
  document.getElementById('leaderAvatarModal').classList.add('hidden');
});

// 主菜单事件绑定
document.getElementById('btnNavMainMenu')?.addEventListener('click', () => {
  applyUserAvatarToUI();
  document.getElementById('mainMenuOverlay').classList.remove('hidden'); startMainMenuBgAnim();
});
document.getElementById('btnMenuStartPve')?.addEventListener('click', () => {
  const arch = document.getElementById('menuAiArch')?.value || 'dragon';
  const diff = document.getElementById('menuAiDiff')?.value || 'normal';
  aiDeckArchetype = arch;
  aiDifficulty = diff;
  battleMode = 'pve';
  const selM = document.getElementById('selectBattleMode'); if (selM) selM.value = 'pve';
  const selA = document.getElementById('selectAiDeckArchetype'); if (selA) selA.value = arch;
  const selD = document.getElementById('selectAiDifficulty'); if (selD) selD.value = diff;
  document.getElementById('mainMenuOverlay').classList.add('hidden');
  if (typeof window.enterBattleFullscreenLandscape === 'function') window.enterBattleFullscreenLandscape();
  if (typeof switchScreen === 'function') switchScreen('battle');
  initNewBattle();
});
document.getElementById('btnMenuStartOnline')?.addEventListener('click', () => {
  openOnlineLobbyModal();
});
document.getElementById('btnMenuPassPlay')?.addEventListener('click', () => {
  battleMode = 'pvp_pass';
  const selM = document.getElementById('selectBattleMode'); if (selM) selM.value = 'pvp_pass';
  document.getElementById('mainMenuOverlay').classList.add('hidden');
  if (typeof window.enterBattleFullscreenLandscape === 'function') window.enterBattleFullscreenLandscape();
  if (typeof switchScreen === 'function') switchScreen('battle');
  initNewBattle();
});
document.getElementById('btnMenuDeckEditor')?.addEventListener('click', () => {
  document.getElementById('mainMenuOverlay').classList.add('hidden');
  document.getElementById('btnNavDeck')?.click();
});
document.getElementById('btnMenuDesigner')?.addEventListener('click', () => {
  document.getElementById('mainMenuOverlay').classList.add('hidden');
  document.getElementById('btnNavDesigner')?.click();
});
document.getElementById('btnMenuTutorial')?.addEventListener('click', () => {
  document.getElementById('btnOpenTutorial')?.click();
});


// ============================================================================
// v17 联机对战房间 (#versusRoomModal) + 在线玩家10秒邀请 + 可靠同步引擎
// ============================================================================
OnlineState.onlinePlayers = new Map();
OnlineState.myReady = false;
OnlineState.oppReady = false;
OnlineState.matchAcked = false;
OnlineState.pendingInvite = null;
OnlineState.inviteTimer = null;
OnlineState.returnToVersusAfterDeck = false;

function getPresenceStatus() {
  if (OnlineState.inMatch && battleMode === 'pvp_online') return 'playing_pvp';
  if (OnlineState.roomId) return 'in_room';
  const vis = (id) => { const el = document.getElementById(id); return el && !el.classList.contains('hidden'); };
  if (vis('onlineLobbyModal')) return 'in_lobby';
  if (vis('leaderAvatarModal')) return 'customizing';
  if (vis('mainMenuOverlay')) return 'idle';
  if (vis('screenDeck')) return 'editing_deck';
  if (vis('screenDesigner')) return 'designing';
  if (vis('leaderAvatarModal')) return 'customizing';
  if (vis('screenBattle') && !vis('mainMenuOverlay') && !battle.gameOver) return 'playing_ai';
  if (vis('onlineLobbyModal')) return 'in_lobby';
  return 'idle';
}

function publishOnlinePresence(offline = false) {
  if (!OnlineState.connected || OnlineState.mode !== 'cloud' || !OnlineState.client) return;
  const payload = offline ? '' : JSON.stringify({
    peerId: OnlineState.peerId,
    nickname: OnlineState.nickname,
    avatar: userAvatarConfig,
    status: getPresenceStatus(),
    ts: Date.now()
  });
  OnlineState.client.publish(`${ONLINE_LOBBY_PREFIX}/players/${OnlineState.peerId}`, payload, true);
}

function renderOnlinePlayerList() {
  const listEl = document.getElementById('onlinePlayerList');
  const cntEl = document.getElementById('onlinePlayerCountText');
  if (!listEl) return;
  const now = Date.now();
  const others = [];
  for (const [pid, p] of OnlineState.onlinePlayers.entries()) {
    if (!p || !p.peerId || pid === OnlineState.peerId) continue;
    if (now - (p.ts || 0) > 15000) continue;
    others.push(p);
  }
  if (cntEl) cntEl.textContent = `(${others.length} 人在线)`;
  if (others.length === 0) {
    listEl.innerHTML = `<div style="font-size:11px;color:#64748b;text-align:center;padding:8px;">暂无其他在线玩家（可先创建房间或让好友打开网页）</div>`;
    return;
  }
  listEl.innerHTML = '';
  others.forEach(p => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;background:#0f172a;border:1px solid #334155;border-radius:10px;padding:6px 10px;';
    const avUri = p.avatar ? renderCustomAvatarDataURI(p.avatar) : renderCustomAvatarDataURI(userAvatarConfig);
    const statusMap = {
      idle: { txt: '🟢 主界面空闲 (可邀请)', col: '#34d399', invitable: true },
      in_lobby: { txt: '🌐 浏览联机大厅 (可邀请)', col: '#38bdf8', invitable: true },
      playing_pvp: { txt: '⚔️ 与玩家联机对战中', col: '#fb7185', invitable: false },
      playing_ai: { txt: '🤖 正在挑战 AI', col: '#fbbf24', invitable: false },
      in_room: { txt: '🏠 在对战房间中', col: '#fbbf24', invitable: false },
      editing_deck: { txt: '🛠️ 正在编辑卡组', col: '#a78bfa', invitable: false },
      designing: { txt: '🃏 正在设计卡牌', col: '#e879f9', invitable: false },
      customizing: { txt: '🎭 正在定制主战者', col: '#818cf8', invitable: false }
    };
    const stInfo = statusMap[p.status] || statusMap.idle;
    const busy = !stInfo.invitable;
    row.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;min-width:0;">
        <img src="${avUri}" style="width:30px;height:30px;border-radius:8px;border:1px solid #fbbf24;object-fit:cover;">
        <div style="min-width:0;">
          <div style="font-size:12px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.nickname || '决斗者'}</div>
          <div style="font-size:11px;font-weight:700;color:${stInfo.col};">${stInfo.txt}</div>
        </div>
      </div>
      <button ${busy || OnlineState.roomId ? 'disabled' : ''} class="ol-btn-cyan" style="padding:4px 10px;font-size:11px;">⚔️ 邀请对战</button>
    `;
    const btn = row.querySelector('button');
    if (btn && !busy && !OnlineState.roomId) {
      btn.onclick = () => inviteOnlinePlayer(p);
    }
    listEl.appendChild(row);
  });
}

function inviteOnlinePlayer(targetPlayer) {
  if (!OnlineState.connected || OnlineState.mode !== 'cloud' || !OnlineState.client) {
    showGameAlert('当前仅公共云端大厅支持在线玩家直接邀请！');
    return;
  }
  // 先自动创建一间专属对战房并进入等待
  const nick = (document.getElementById('onlineNickInput')?.value || '').trim() || OnlineState.nickname;
  OnlineState.nickname = nick;
  const rid = Math.random().toString(36).slice(2, 8).toUpperCase();
  OnlineState.roomId = rid;
  OnlineState.role = 'host';
  OnlineState.roomName = `${nick} 的邀请对战房`;
  OnlineState.roomPwdHash = '';
  OnlineState.hostId = OnlineState.peerId;
  OnlineState.hostName = nick;
  OnlineState.guestId = '';
  OnlineState.guestName = '';
  OnlineState.myReady = false;
  OnlineState.oppReady = false;
  OnlineState.inMatch = false;

  OnlineState.client.subscribe(`${ONLINE_LOBBY_PREFIX}/room/${rid}/c2h`);
  publishLobbyRoomMeta(false);
  if (OnlineState.heartbeatTimer) clearInterval(OnlineState.heartbeatTimer);
  OnlineState.heartbeatTimer = setInterval(() => publishLobbyRoomMeta(false), 4000);

  OnlineState.client.publish(`${ONLINE_LOBBY_PREFIX}/invite/${targetPlayer.peerId}`, JSON.stringify({
    type: 'INVITE_REQ',
    fromId: OnlineState.peerId,
    fromName: nick,
    fromAvatar: userAvatarConfig,
    roomId: rid,
    roomName: OnlineState.roomName,
    ts: Date.now()
  }), false);

  openVersusRoomModal();
  showTriggeredEffectToast({ id: 'sys_notice', name: '战局提示', type: 'spell', rarity: '传说', energy: 0, bones: 0, sacrifice: 0 }, `📩 已向【${targetPlayer.nickname}】发送对战邀请（等待对方10秒内响应）`, 0);
}

function showBattleInviteToast(inv) {
  if (OnlineState.roomId || OnlineState.inMatch) return;
  const toast = document.getElementById('battleInviteToast');
  if (!toast) return;
  OnlineState.pendingInvite = inv;
  document.getElementById('inviterAvatarImg').src = inv.fromAvatar ? renderCustomAvatarDataURI(inv.fromAvatar) : renderCustomAvatarDataURI(userAvatarConfig);
  document.getElementById('inviterNameText').textContent = `${inv.fromName || '玩家'} 邀请你进入对战房间`;
  toast.classList.remove('hidden');

  let remain = 10;
  const numEl = document.getElementById('inviteCountdownNum');
  const barEl = document.getElementById('inviteProgressBar');
  if (numEl) numEl.textContent = `${remain}s`;
  if (barEl) barEl.style.width = '100%';

  if (OnlineState.inviteTimer) clearInterval(OnlineState.inviteTimer);
  OnlineState.inviteTimer = setInterval(() => {
    remain -= 1;
    if (numEl) numEl.textContent = `${Math.max(0, remain)}s`;
    if (barEl) barEl.style.width = `${Math.max(0, remain * 10)}%`;
    if (remain <= 0) {
      clearInterval(OnlineState.inviteTimer);
      OnlineState.inviteTimer = null;
      toast.classList.add('hidden');
      OnlineState.pendingInvite = null;
    }
  }, 1000);
}

function syncVersusDeckSelect(selectEl) {
  if (!selectEl || typeof PRESET_DECKS === 'undefined') return;
  selectEl.innerHTML = '';
  PRESET_DECKS.forEach((d, idx) => {
    const opt = document.createElement('option');
    opt.value = String(idx);
    const cnt = typeof expandDeck === 'function' ? expandDeck(d).length : 40;
    opt.textContent = `${d.name} (${cnt}张)`;
    if (idx === currentDeckIndex) opt.selected = true;
    selectEl.appendChild(opt);
  });
}

function openVersusRoomModal() {
  document.getElementById('onlineLobbyModal')?.classList.add('hidden');
  document.getElementById('mainMenuOverlay')?.classList.add('hidden');
  const modal = document.getElementById('versusRoomModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  updateVersusRoomUI();
}

function updateVersusRoomUI() {
  const modal = document.getElementById('versusRoomModal');
  if (!modal || modal.classList.contains('hidden')) return;

  document.getElementById('vrRoomTitle').textContent = OnlineState.roomName || `房间 ${OnlineState.roomId}`;
  document.getElementById('vrRoomCode').textContent = OnlineState.roomId || '--';
  const sb = document.getElementById('vrRoomScoreBoard');
  if (sb) sb.textContent = `🏆 本房战绩：${OnlineState.hostWins || 0} 胜 : ${OnlineState.guestWins || 0} 胜`;
  const hOn = document.getElementById('vrHostOnlineTag');
  const gOn = document.getElementById('vrGuestOnlineTag');
  if (hOn) { hOn.textContent = '🟢 在线'; hOn.style.color = '#34d399'; }
  if (gOn) {
    gOn.textContent = OnlineState.guestId ? '🟢 在线' : '⚪ 等待加入';
    gOn.style.color = OnlineState.guestId ? '#34d399' : '#64748b';
  }

  const isHost = OnlineState.role === 'host';
  const hostReady = isHost ? OnlineState.myReady : OnlineState.oppReady;
  const guestReady = isHost ? OnlineState.oppReady : OnlineState.myReady;
  const hostAv = isHost ? userAvatarConfig : OnlineState.hostAvatar;
  const guestAv = isHost ? OnlineState.guestAvatar : userAvatarConfig;

  document.getElementById('vrHostAvatar').src = renderCustomAvatarDataURI(hostAv || userAvatarConfig);
  document.getElementById('vrHostName').textContent = OnlineState.hostName || '房主';
  const hBadge = document.getElementById('vrHostReadyBadge');
  hBadge.textContent = (!isHost && OnlineState.oppEditingDeck) ? '🛠️ 正在编辑卡组...' : (hostReady ? '✅ 已准备' : '⏳ 准备中');
  hBadge.style.color = hostReady ? '#6ee7b7' : '#fbbf24';
  hBadge.style.borderColor = hostReady ? '#10b981' : '#f59e0b';

  const gNameEl = document.getElementById('vrGuestName');
  const gBadge = document.getElementById('vrGuestReadyBadge');
  const gAvEl = document.getElementById('vrGuestAvatar');
  if (OnlineState.guestId) {
    gNameEl.textContent = OnlineState.guestName || '挑战者';
    gNameEl.style.color = '#fff';
    gAvEl.src = renderCustomAvatarDataURI(guestAv || userAvatarConfig);
    gBadge.textContent = OnlineState.oppEditingDeck ? '🛠️ 正在编辑卡组...' : (guestReady ? '✅ 已准备' : '⏳ 准备中');
    gBadge.style.color = guestReady ? '#6ee7b7' : '#fbbf24';
    gBadge.style.borderColor = guestReady ? '#10b981' : '#f59e0b';
  } else {
    gNameEl.textContent = '等待挑战者加入...';
    gNameEl.style.color = '#94a3b8';
    gAvEl.src = renderCustomAvatarDataURI({ backdrop: 'cyber', hairStyle: 'hood', hairColor: 'silver', eyeStyle: 'visor', outfit: 'mech', headgear: 'none' });
    gBadge.textContent = '空位';
    gBadge.style.color = '#64748b';
    gBadge.style.borderColor = '#334155';
  }

  // 私有卡组仅对本人可见
  const hDeckArea = document.getElementById('vrHostDeckArea');
  const gDeckArea = document.getElementById('vrGuestDeckArea');
  hDeckArea.classList.toggle('hidden', !isHost);
  gDeckArea.classList.toggle('hidden', isHost);
  syncVersusDeckSelect(document.getElementById(isHost ? 'vrHostDeckSelect' : 'vrGuestDeckSelect'));

  const readyBtn = document.getElementById('btnVrToggleReady');
  readyBtn.textContent = OnlineState.myReady ? '🔄 取消准备' : '✅ 点击准备';
  readyBtn.style.opacity = OnlineState.guestId ? '1' : '0.6';

  const startBtn = document.getElementById('btnVrStartMatch');
  const hintEl = document.getElementById('vrStatusHint');
  if (!OnlineState.guestId) {
    startBtn.classList.add('hidden');
    hintEl.textContent = '等待挑战者加入房间（可点击大厅中的在线玩家直接邀请）...';
  } else if (hostReady && guestReady) {
    startBtn.classList.add('hidden');
    hintEl.textContent = '🎉 双方均已准备就绪，正在自动进入战场...';
  } else {
    startBtn.classList.add('hidden');
    hintEl.textContent = (hostReady && guestReady) ? '✅ 双方已准备，正在等待房主开启对战...' : '请双方调整各自卡组并点击「准备」按钮';
  }
}

// 绑定对战房间与邀请浮窗事件
document.getElementById('vrHostDeckSelect')?.addEventListener('change', (e) => {
  currentDeckIndex = parseInt(e.target.value, 10) || 0;
  syncAllDeckSelects();
});
document.getElementById('vrGuestDeckSelect')?.addEventListener('change', (e) => {
  currentDeckIndex = parseInt(e.target.value, 10) || 0;
  syncAllDeckSelects();
});
const enterDeckFromVersus = () => {
  OnlineState.returnToVersusAfterDeck = true;
  OnlineState.myReady = false;
  sendReliableRoomPacket({ type: 'PLAYER_EDITING_DECK', editing: true });
  document.getElementById('versusRoomModal').classList.add('hidden');
  document.getElementById('btnNavDeck')?.click();
  const backBtn = document.getElementById('btnTopBackMenu');
  if (backBtn) backBtn.textContent = '🏠 回到对战房间';
};
document.getElementById('btnVrHostEditDeck')?.addEventListener('click', enterDeckFromVersus);
document.getElementById('btnVrGuestEditDeck')?.addEventListener('click', enterDeckFromVersus);
document.getElementById('btnVrCopyCode')?.addEventListener('click', () => {
  if (OnlineState.roomId && navigator.clipboard) {
    navigator.clipboard.writeText(OnlineState.roomId).then(() => showGameAlert(`已复制房号：${OnlineState.roomId}`)).catch(() => {});
  }
});
document.getElementById('btnVrLeaveRoom')?.addEventListener('click', () => {
  document.getElementById('versusRoomModal').classList.add('hidden');
  document.getElementById('victoryDefeatModal')?.classList.add('hidden');
  document.getElementById('mulliganModal')?.classList.add('hidden');
  document.getElementById('mainMenuOverlay')?.classList.remove('hidden');
  if (typeof startMainMenuBgAnim === 'function') startMainMenuBgAnim();
  leaveOnlineRoom(true);
  openOnlineLobbyModal();
});
document.getElementById('btnVrToggleReady')?.addEventListener('click', () => {
  if (!OnlineState.roomId) return;
  OnlineState.myReady = !OnlineState.myReady;
  sendReliableRoomPacket({
    type: 'PLAYER_READY',
    ready: OnlineState.myReady,
    deckIds: getActiveDeckIdsForOnline(),
    avatar: userAvatarConfig
  });
  updateVersusRoomUI();
  if (OnlineState.role === 'host' && OnlineState.guestId && OnlineState.myReady && OnlineState.oppReady && !OnlineState.inMatch) {
    setTimeout(() => {
      if (OnlineState.myReady && OnlineState.oppReady && !OnlineState.inMatch) startOnlineMatchAsHost();
    }, 300);
  }
});
document.getElementById('btnVrStartMatch')?.addEventListener('click', () => startOnlineMatchAsHost());

document.getElementById('btnAcceptInvite')?.addEventListener('click', () => {
  const inv = OnlineState.pendingInvite;
  if (OnlineState.inviteTimer) { clearInterval(OnlineState.inviteTimer); OnlineState.inviteTimer = null; }
  document.getElementById('battleInviteToast').classList.add('hidden');
  OnlineState.pendingInvite = null;
  if (!inv) return;
  sendJoinRoomRequest({ roomId: inv.roomId, roomName: inv.roomName, hostId: inv.fromId, hostName: inv.fromName, hasPassword: false }, '');
});
document.getElementById('btnDeclineInvite')?.addEventListener('click', () => {
  if (OnlineState.inviteTimer) { clearInterval(OnlineState.inviteTimer); OnlineState.inviteTimer = null; }
  document.getElementById('battleInviteToast').classList.add('hidden');
  OnlineState.pendingInvite = null;
});
document.getElementById('btnMenuImportJson')?.addEventListener('click', () => {
  document.getElementById('btnOpenFileImport')?.click();
});


// ============================================================================
// v18 30秒开局换牌倒计时 & 60秒回合思考倒计时 & 联机认输与返回房间
// ============================================================================
let _mulliganTimer = null;
let _mulliganRemain = 30;
let _turnTimer = null;
let _turnRemain = 60;

function stopMulliganCountdownTimer() {
  if (_mulliganTimer) { clearInterval(_mulliganTimer); _mulliganTimer = null; }
}

function startMulliganCountdownTimer() {
  stopMulliganCountdownTimer();
  const badge0 = document.getElementById('mulliganTimerBadge');
  if (battleMode !== 'pvp_online') {
    if (badge0) badge0.style.display = 'none';
    return;
  }
  if (badge0) badge0.style.display = 'inline-block';
  _mulliganRemain = 30;
  const badge = document.getElementById('mulliganTimerBadge');
  if (badge) badge.textContent = `⏱️ 换牌倒计时：${_mulliganRemain}s`;
  _mulliganTimer = setInterval(() => {
    const modal = document.getElementById('mulliganModal');
    if (!modal || modal.classList.contains('hidden')) {
      stopMulliganCountdownTimer();
      return;
    }
    _mulliganRemain -= 1;
    if (badge) {
      badge.textContent = `⏱️ 换牌倒计时：${Math.max(0, _mulliganRemain)}s`;
      badge.style.color = _mulliganRemain <= 8 ? '#fb7185' : '#fde047';
    }
    if (_mulliganRemain <= 0) {
      stopMulliganCountdownTimer();
      document.getElementById('btnConfirmMulligan')?.click();
    }
  }, 1000);
}

function stopTurnCountdownTimer() {
  if (_turnTimer) { clearInterval(_turnTimer); _turnTimer = null; }
  document.getElementById('turnUrgentRing')?.classList.add('hidden');
}

function startTurnCountdownTimer() {
  stopTurnCountdownTimer();
  const badge0 = document.getElementById('turnTimerBadge');
  if (battleMode !== 'pvp_online') {
    if (badge0) badge0.style.display = 'none';
    return;
  }
  if (badge0) badge0.style.display = 'inline-block';
  _turnRemain = 60;
  const badge = document.getElementById('turnTimerBadge');
  if (badge) {
    badge.textContent = `⏱️ ${_turnRemain}s`;
    badge.style.color = '#7dd3fc';
    badge.style.borderColor = '#38bdf8';
  }
  _turnTimer = setInterval(() => {
    if (battle.gameOver) {
      stopTurnCountdownTimer();
      return;
    }
    const mulModal = document.getElementById('mulliganModal');
    const waitOv = document.getElementById('onlineWaitOverlay');
    const hoModal = document.getElementById('pvpHandoverModal');
    if ((mulModal && !mulModal.classList.contains('hidden')) ||
        (waitOv && !waitOv.classList.contains('hidden')) ||
        (hoModal && !hoModal.classList.contains('hidden'))) {
      return;
    }
    _turnRemain -= 1;
    if (badge) {
      badge.textContent = `⏱️ ${Math.max(0, _turnRemain)}s`;
      badge.style.color = _turnRemain <= 15 ? '#fb7185' : '#7dd3fc';
      badge.style.borderColor = _turnRemain <= 15 ? '#f43f5e' : '#38bdf8';
    }
    const urgentRing = document.getElementById('turnUrgentRing');
    if (urgentRing) {
      const showUrgent = (battleMode === 'pvp_online' && _turnRemain <= 15 && _turnRemain > 0 && onlineIsMyTurn());
      urgentRing.classList.toggle('hidden', !showUrgent);
    }
    if (_turnRemain <= 0) {
      stopTurnCountdownTimer();
      const isMyAction = battleMode === 'pvp_online' ? onlineIsMyTurn() : (battle.activeSide === 0 || battleMode === 'pvp_pass');
      if (isMyAction && !battle.gameOver && !battle.animating) {
        cancelPendingPlayToHand();
        document.getElementById('handPickModal')?.classList.add('hidden');
        document.getElementById('modeChoiceCenterPanel')?.classList.add('hidden');
        showTriggeredEffectToast({ id: 'sys_notice', name: '战局提示', type: 'spell', rarity: '传说', energy: 0, bones: 0, sacrifice: 0 }, '⌛ 60秒思考时间到，自动结束回合！', 0);
        executeEndTurnSequence(0);
      }
    }
  }, 1000);
}

// 绑定右下角联机「🏳️ 投降认输」按钮
document.getElementById('btnPvpSurrender')?.addEventListener('click', () => {
  if (battleMode !== 'pvp_online' || !OnlineState.inMatch || battle.gameOver) return;
  if (confirm('确定要向对手投降认输吗？（认输后将返回对战房间）')) {
    sendReliableRoomPacket({ type: 'PVP_SURRENDER', who: OnlineState.nickname });
    showOnlineVictoryDefeatModal(false, '你选择了投降认输，点击下方按钮回到对战房间。');
  }
});


// ============================================================================
// v19 顶部投降/退出绑定 + 联机断线自动重连 + 5秒反卡死回合心跳校验
// ============================================================================
document.getElementById('btnMenuMuteToggle')?.addEventListener('click', (e) => {
  sfx.muted = !sfx.muted;
  e.target.textContent = sfx.muted ? '🔇 静音' : '🔊 音效';
});

document.getElementById('btnTopSurrenderExit')?.addEventListener('click', () => {
  if (battleMode === 'pvp_online' && OnlineState.inMatch && !battle.gameOver) {
    showGameConfirm('确定要向对手投降认输并返回对战房间吗？', () => {
      sendReliableRoomPacket({ type: 'PVP_SURRENDER', who: OnlineState.nickname }, 12);
      showOnlineVictoryDefeatModal(false, '你选择了投降认输，即将自动回到对战房间。');
    }, '🏳️');
    return;
  }
  showGameConfirm('确定要放弃当前对局并返回主菜单吗？', () => {
    battle.gameOver = true;
    if (typeof clearPveBattleProgress === 'function') clearPveBattleProgress();
    stopTurnCountdownTimer();
    stopMulliganCountdownTimer();
    document.getElementById('mulliganModal')?.classList.add('hidden');
    document.getElementById('victoryDefeatModal')?.classList.add('hidden');
    document.getElementById('mainMenuOverlay')?.classList.remove('hidden');
    if (typeof startMainMenuBgAnim === 'function') startMainMenuBgAnim();
    if (typeof applyUserAvatarToUI === 'function') applyUserAvatarToUI();
  }, '🏳️');
});

// 覆盖 sendReliableRoomPacket：对关键回合交接包提高重传次数，并在连接断开时自动重连
sendReliableRoomPacket = function(pkt, maxRetries = 12) {
  if (!OnlineState.roomId) return;
  const pktId = `${OnlineState.peerId}_${++OnlineState.pktSeq}_${Date.now()}`;
  const fullPkt = { ...pkt, pktId, senderAvatar: userAvatarConfig, senderName: OnlineState.nickname };
  let tries = 0;
  const attempt = () => {
    if (OnlineState.ackedPkts.has(pktId) || !OnlineState.roomId || tries >= maxRetries) return;
    if (!OnlineState.connected && typeof connectOnlineNetwork === 'function') {
      connectOnlineNetwork();
    }
    tries++;
    sendRoomPacket(fullPkt);
    setTimeout(attempt, 1000);
  };
  attempt();
};

// 每 4 秒检查一次联机双方回合是否卡死（防丢包死锁）
setInterval(() => {
  if (battleMode !== 'pvp_online' || !OnlineState.inMatch || battle.gameOver) return;
  if (!OnlineState.connected && typeof connectOnlineNetwork === 'function') {
    connectOnlineNetwork();
    return;
  }
  if (!onlineIsMyTurn()) {
    // 我方正在等待对手：发送轻量回合核对心跳
    sendRoomPacket({
      type: 'PING_TURN',
      turn: battle.turn,
      activeRole: OnlineState.activeRole
    });
  }
}, 4000);


// ============================================================================
// v20 单机存档继续询问 + 联机切屏15秒等待重连机制 + 幽灵清理
// ============================================================================
const PVE_SAVE_KEY = 'CF_SAVED_PVE_BATTLE_V1';
const PVP_SESSION_KEY = 'CF_ACTIVE_PVP_SESSION_V1';

function savePveBattleProgress() {
  if (battleMode !== 'pve' || battle.gameOver || !battle.leaders[0] || !battle.leaders[1]) return;
  const menuOv = document.getElementById('mainMenuOverlay');
  if (menuOv && !menuOv.classList.contains('hidden')) return;
  try {
    localStorage.setItem(PVE_SAVE_KEY, JSON.stringify({
      ts: Date.now(),
      aiDeckArchetype,
      aiDifficulty,
      snap: serializeBattleSnapshot()
    }));
  } catch (e) {}
}

function clearPveBattleProgress() {
  try { localStorage.removeItem(PVE_SAVE_KEY); } catch (e) {}
}

function checkAndPromptSavedPveBattle() {
  try {
    const raw = localStorage.getItem(PVE_SAVE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (!saved || !saved.snap || saved.snap.gameOver || Date.now() - (saved.ts || 0) > 86400000) {
      clearPveBattleProgress();
      return;
    }
    const modal = document.getElementById('resumePveModal');
    const desc = document.getElementById('resumePveDesc');
    if (desc) desc.textContent = `上次单人挑战进行到第 ${saved.snap.turn || 1} 回合（我方 ${saved.snap.leaders[0]?.hp ?? 30} 血 / 敌方 ${saved.snap.leaders[1]?.hp ?? 30} 血），是否继续上次的战斗？`;
    if (modal) modal.classList.remove('hidden');

    document.getElementById('btnResumePveYes').onclick = () => {
      modal.classList.add('hidden');
      document.getElementById('mainMenuOverlay')?.classList.add('hidden');
      battleMode = 'pve';
      aiDeckArchetype = saved.aiDeckArchetype || 'dragon';
      aiDifficulty = saved.aiDifficulty || 'normal';
      battle.turn = saved.snap.turn || 1;
      battle.activeSide = 0;
      battle.gameOver = false;
      battle.leaders[0] = deserializeLeaderFromRemote(saved.snap.leaders[0], 0);
      battle.leaders[1] = deserializeLeaderFromRemote(saved.snap.leaders[1], 1);
      battle.board[0] = (saved.snap.board[0] || []).map(c => deserializeCardInst(c, 0));
      battle.board[1] = (saved.snap.board[1] || []).map(c => deserializeCardInst(c, 1));
      document.getElementById('mulliganModal')?.classList.add('hidden');
      syncOnlineAvatarsAndHud();
      renderAllBattleUI();
    };
    document.getElementById('btnResumePveNo').onclick = () => {
      clearPveBattleProgress();
      modal.classList.add('hidden');
    };
  } catch (e) {}
}

// 联机：对手离开检测与 15 秒重连倒计时
OnlineState.lastOppActiveTs = Date.now();
OnlineState.oppAwayTimer = null;
OnlineState.oppAwayRemain = 15;

function resetOppDisconnectMonitor() {
  OnlineState.lastOppActiveTs = Date.now();
  if (OnlineState.oppAwayTimer) { clearInterval(OnlineState.oppAwayTimer); OnlineState.oppAwayTimer = null; }
  document.getElementById('oppDisconnectBanner')?.classList.add('hidden');
}

function startOppDisconnectCountdown(whoName) {
  if (OnlineState.oppAwayTimer || !OnlineState.inMatch || battle.gameOver) return;
  OnlineState.oppAwayRemain = 15;
  const banner = document.getElementById('oppDisconnectBanner');
  const txt = document.getElementById('oppDisconnectText');
  if (banner) banner.classList.remove('hidden');
  if (txt) txt.textContent = `⚠️ 对手【${whoName || '对方'}】暂时离开，等待重连 (${OnlineState.oppAwayRemain}s)...`;

  OnlineState.oppAwayTimer = setInterval(() => {
    if (!OnlineState.inMatch || battle.gameOver) {
      resetOppDisconnectMonitor();
      return;
    }
    OnlineState.oppAwayRemain -= 1;
    if (txt) txt.textContent = `⚠️ 对手【${whoName || '对方'}】暂时离开，等待重连 (${Math.max(0, OnlineState.oppAwayRemain)}s)...`;
    if (OnlineState.oppAwayRemain <= 0) {
      resetOppDisconnectMonitor();
      showOnlineVictoryDefeatModal(true, `对手离开超过 15 秒未重连，系统判定对方放弃战斗，你获得胜利！`);
    }
  }, 1000);
}

// 切屏 / 切后台时：不直接退出游戏，而是通知对手“我暂时离开，正在等待重连”
document.addEventListener('visibilitychange', () => {
  if (battleMode === 'pvp_online' && OnlineState.inMatch && !battle.gameOver && OnlineState.roomId) {
    if (document.hidden) {
      sendRoomPacket({ type: 'PLAYER_AWAY', who: OnlineState.nickname });
      try {
        localStorage.setItem(PVP_SESSION_KEY, JSON.stringify({
          ts: Date.now(),
          roomId: OnlineState.roomId,
          role: OnlineState.role,
          roomName: OnlineState.roomName,
          hostName: OnlineState.hostName,
          guestName: OnlineState.guestName
        }));
      } catch (e) {}
    } else {
      if (!OnlineState.connected && typeof connectOnlineNetwork === 'function') connectOnlineNetwork();
      setTimeout(() => {
        sendRoomPacket({ type: 'PLAYER_BACK', who: OnlineState.nickname });
      }, 300);
    }
  } else if (battleMode === 'pve' && document.hidden) {
    savePveBattleProgress();
  }
});

window.addEventListener('beforeunload', () => {
  publishOnlinePresence(true);
  if (OnlineState.role === 'host' && OnlineState.roomId && !OnlineState.inMatch) {
    publishLobbyRoomMeta(true);
  }
  if (battleMode === 'pve') savePveBattleProgress();
});

// 每 3 秒监测联机心跳，超过 7 秒无回应或收到 PLAYER_AWAY 则启动 15 秒等待重连横幅
setInterval(() => {
  if (battleMode !== 'pvp_online' || !OnlineState.inMatch || battle.gameOver) return;
  sendRoomPacket({ type: 'PRESENCE_PING' });
  if (OnlineState.connected && Date.now() - OnlineState.lastOppActiveTs > 45000 && !OnlineState.oppAwayTimer) {
    const oppName = OnlineState.role === 'host' ? OnlineState.guestName : OnlineState.hostName;
    startOppDisconnectCountdown(oppName);
  }
}, 3000);


function performLeaveDeckOrDesigner() {
  document.getElementById('screenDeck')?.classList.add('hidden');
  document.getElementById('screenDesigner')?.classList.add('hidden');
  document.getElementById('screenCode')?.classList.add('hidden');
  const backBtn = document.getElementById('btnTopBackMenu');
  if (backBtn) backBtn.textContent = '🏠 返回主菜单';
  if (OnlineState.returnToVersusAfterDeck && OnlineState.roomId && !OnlineState.inMatch) {
    OnlineState.returnToVersusAfterDeck = false;
    sendReliableRoomPacket({ type: 'PLAYER_EDITING_DECK', editing: false });
    switchScreen('battle');
    openVersusRoomModal();
    return;
  }
  document.getElementById('mainMenuOverlay')?.classList.remove('hidden');
  if (typeof startMainMenuBgAnim === 'function') startMainMenuBgAnim();
  if (typeof applyUserAvatarToUI === 'function') applyUserAvatarToUI();
  if (typeof publishOnlinePresence === 'function') publishOnlinePresence(false);
}

document.getElementById('btnTopBackMenu')?.addEventListener('click', () => {
  const deckScreen = document.getElementById('screenDeck');
  if (deckScreen && !deckScreen.classList.contains('hidden')) {
    const d = PRESET_DECKS[currentDeckIndex];
    const total = d ? getDeckTotal(d) : 0;
    if (d && total !== RULES.deckSize) {
      const modal = document.getElementById('gameCustomDialogModal');
      document.getElementById('gameDialogIcon').textContent = '⚠️';
      document.getElementById('gameDialogMsg').textContent = `当前卡组「${d.name}」共 ${total} 张（需恰好 ${RULES.deckSize} 张才能出战）。请选择返回继续修改，或恢复到该卡组上一次合法的 40 张状态并离开：`;
      const yes = document.getElementById('btnGameDialogYes');
      const no = document.getElementById('btnGameDialogNo');
      yes.textContent = '✏️ 返回继续修改';
      no.textContent = '↩️ 恢复上次合法状态并离开';
      no.classList.remove('hidden');
      modal.classList.remove('hidden');
      yes.onclick = () => modal.classList.add('hidden');
      no.onclick = () => {
        modal.classList.add('hidden');
        const snap = _lastValidDeckSnapshots.get(currentDeckIndex);
        if (snap) {
          PRESET_DECKS[currentDeckIndex] = { name: snap.name, cards: Object.assign({}, snap.cards) };
        } else {
          PRESET_DECKS[currentDeckIndex] = { name: d.name, cards: Object.assign({}, DEFAULT_PRESET_DECKS[0].cards) };
        }
        saveDecksToStorage();
        syncAllDeckSelects();
        performLeaveDeckOrDesigner();
      };
      return;
    }
  }
  performLeaveDeckOrDesigner();
});


// ============================================================================
// v23 主界面改名保存 + 敌方法术详细展示 + 联机掉线自动重连 RESYNC
// ============================================================================
(function initMenuNickSync() {
  const inp = document.getElementById('menuNickInput');
  const tip = document.getElementById('menuNickSavedTip');
  if (!inp) return;
  inp.value = OnlineState.nickname || '决斗者';
  const saveNick = () => {
    const val = inp.value.trim() || '决斗者';
    OnlineState.nickname = val;
    try { localStorage.setItem('cf_online_nick', val); } catch (e) {}
    const nick2 = document.getElementById('onlineNickInput');
    if (nick2) nick2.value = val;
    const pTitle = document.getElementById('uiPlayerLeaderTitle');
    if (pTitle && battleMode === 'pvp_online') pTitle.textContent = val;
    if (tip) {
      tip.style.display = 'inline';
      setTimeout(() => { tip.style.display = 'none'; }, 1500);
    }
  };
  inp.addEventListener('change', saveNick);
  inp.addEventListener('blur', saveNick);
})();

let _oppSpellTimer = null;
function showOppSpellShowcase(cardData) {
  const modal = document.getElementById('oppSpellShowcaseModal');
  if (!modal || !cardData) return;
  document.getElementById('oppSpellImg').src = getAnimeIllustrationDataURI(cardData);
  document.getElementById('oppSpellName').textContent = cardData.name || '法术';
  const costParts = [];
  if (cardData.energy > 0) costParts.push(`⚡ 能量 ${cardData.energy}`);
  if (cardData.bones > 0) costParts.push(`🦴 骨头 ${cardData.bones}`);
  if (cardData.sacrifice > 0) costParts.push(`🩸 祭品 ${cardData.sacrifice}`);
  document.getElementById('oppSpellCost').textContent = costParts.join(' · ') || '⚡ 0费';
  document.getElementById('oppSpellDesc').textContent = cardData.fullText || cardData.description || '无描述';
  modal.classList.remove('hidden');
  if (_oppSpellTimer) clearTimeout(_oppSpellTimer);
  _oppSpellTimer = setTimeout(() => modal.classList.add('hidden'), 3200);
}
document.getElementById('oppSpellShowcaseModal')?.addEventListener('click', () => {
  if (_oppSpellTimer) clearTimeout(_oppSpellTimer);
  document.getElementById('oppSpellShowcaseModal')?.classList.add('hidden');
});


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
  yes.onclick = () => modal.classList.add('hidden');
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
  yes.onclick = () => { modal.classList.add('hidden'); if (onConfirm) onConfirm(); };
  no.onclick = () => { modal.classList.add('hidden'); };
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
  if (Array.isArray(actionMeta.combatEvents)) {
    for (const ev of actionMeta.combatEvents) {
      const fromEl = getLaneDOM(1, ev.fromLane);
      const toEl = getLaneDOM(0, ev.toLane);
      if (fromEl && toEl) {
        if (fromEl.firstElementChild) fromEl.firstElementChild.style.transform = 'translateY(28px) scale(1.1)';
        await playSynergyBeam(fromEl, toEl, '#f43f5e', 200);
        if (ev.dmg > 0) spawnFloatNumber(0, ev.toLane, `-${ev.dmg}`, '#fb7185');
        if (fromEl.firstElementChild) fromEl.firstElementChild.style.transform = '';
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


// ============================================================================
// v25 房间内胜场统计 + 房间在线检测 VR_PING + 网络状态指示与自动重连恢复
// ============================================================================
OnlineState.hostWins = 0;
OnlineState.guestWins = 0;
OnlineState.lastVrOppPing = Date.now();

function updateBattleNetIndicator() {
  const el = document.getElementById('battleNetIndicator');
  if (!el) return;
  if (battleMode !== 'pvp_online' || !OnlineState.inMatch) {
    el.classList.add('hidden');
    return;
  }
  el.classList.remove('hidden');
  if (!OnlineState.connected) {
    el.textContent = '🟡 己方断线重连中...';
    el.style.color = '#fbbf24';
    el.style.borderColor = '#f59e0b';
  } else if (OnlineState.oppAwayTimer) {
    el.textContent = `🔴 对手重连中 (${OnlineState.oppAwayRemain}s)`;
    el.style.color = '#fb7185';
    el.style.borderColor = '#f43f5e';
  } else {
    el.textContent = '🟢 联机连接正常';
    el.style.color = '#34d399';
    el.style.borderColor = '#10b981';
  }
}

setInterval(() => {
  updateBattleNetIndicator();
  const vrModal = document.getElementById('versusRoomModal');
  if (OnlineState.roomId && !OnlineState.inMatch && vrModal && !vrModal.classList.contains('hidden')) {
    sendRoomPacket({
      type: 'VR_PING',
      ready: OnlineState.myReady,
      editing: Boolean(OnlineState.returnToVersusAfterDeck),
      hostWins: OnlineState.hostWins,
      guestWins: OnlineState.guestWins,
      deckIds: getActiveDeckIdsForOnline()
    });
    // 检测对手是否仍在房间内（超过 12s 无心跳则标记离线/离开）
    const oppTag = document.getElementById(OnlineState.role === 'host' ? 'vrGuestOnlineTag' : 'vrHostOnlineTag');
    if (OnlineState.guestId && oppTag) {
      const alive = (Date.now() - OnlineState.lastVrOppPing) < 12000;
      oppTag.textContent = alive ? '🟢 在线' : '🔴 离线/已离开';
      oppTag.style.color = alive ? '#34d399' : '#fb7185';
      if (!alive && OnlineState.role === 'host' && (Date.now() - OnlineState.lastVrOppPing) > 16000) {
        OnlineState.guestId = '';
        OnlineState.guestName = '';
        OnlineState.oppReady = false;
        publishLobbyRoomMeta(false);
        updateVersusRoomUI();
      }
    }
  }
}, 3000);


// ============================================================================
// v53 卡组编辑器多维度精细筛选面板 + 排序联动
// ============================================================================
const deckAdvFilter = { cost: 'all', system: 'all', race: 'all', type: 'all', rarity: 'all', specs: [] };

function renderAdvFilterPills() {
  const specs = [
    { containerId: 'advFilterCostRow', key: 'cost', opts: [['all','全部'],['0-1','0-1费'],['2','2费'],['3','3费'],['4','4费'],['5','5费'],['6','6费'],['7-8','7-8费'],['9+','9+费']] },
    { containerId: 'advFilterSystemRow', key: 'system', opts: [['all','全部'],['energy_only','仅能量'],['sac_only','仅祭品'],['bones_only','仅骨头'],['multi','多体系混合'],['free','0费']] },
    { containerId: 'advFilterRaceRow', key: 'race', opts: [['all','全部'],['龙族','🐉 龙族'],['机械','⚙️ 机械'],['亡灵','💀 亡灵'],['恶魔','😈 恶魔/血族'],['多族','🔗 多种族'],['无种族','无种族']] },
    { containerId: 'advFilterTypeRow', key: 'type', opts: [['all','全部'],['minion','随从'],['spell','法术'],['amulet','护符']] },
    { containerId: 'advFilterRarityRow', key: 'rarity', opts: [['all','全部'],['普通','普通'],['稀有','稀有'],['史诗','史诗'],['传说','传说']] },
    { containerId: 'advFilterSpecRow', key: 'specs', multi: true, opts: [
      ['sac','需祭品'],['bones','需骨头'],['cd','倒计时'],['fuse','可融合'],
      ['入场曲','入场曲'],['谢幕曲','谢幕曲'],['启动','启动'],['爆能强化','爆能强化'],['瞬念召唤','瞬念召唤'],['抉择','抉择'],
      ['守护','守护'],['疾驰','疾驰'],['突进','突进'],['飞行','飞行'],['防空','防空'],['毁灭','毁灭'],['吸血','吸血'],['必杀','必杀'],['潜伏','潜伏'],['荆棘','荆棘'],
      ['招募','招募'],['亡者召还','亡者召还'],['纹章','纹章'],['self_dmg','自残/献祭']
    ] }
  ];
  let activeCount = 0;
  specs.forEach(s => {
    if (s.multi) activeCount += deckAdvFilter.specs.length;
    else if (deckAdvFilter[s.key] !== 'all') activeCount++;
    const box = document.getElementById(s.containerId);
    if (!box) return;
    box.innerHTML = '';
    s.opts.forEach(([val, label]) => {
      const btn = document.createElement('button');
      const isAct = s.multi ? deckAdvFilter.specs.includes(val) : (deckAdvFilter[s.key] === val);
      btn.textContent = label;
      btn.style.cssText = `padding:3px 9px;border-radius:8px;font-size:11px;font-weight:800;border:1px solid ${isAct ? '#fbbf24' : '#334155'};background:${isAct ? 'linear-gradient(90deg,#b45309,#d97706)' : '#0f172a'};color:${isAct ? '#fff' : '#cbd5e1'};cursor:pointer;transition:all 0.15s;`;
      btn.onclick = () => {
        if (s.multi) {
          const i = deckAdvFilter.specs.indexOf(val);
          if (i >= 0) deckAdvFilter.specs.splice(i, 1);
          else deckAdvFilter.specs.push(val);
        } else {
          deckAdvFilter[s.key] = val;
        }
        renderAdvFilterPills();
        renderDeckEditor();
      };
      box.appendChild(btn);
    });
  });
  const badge = document.getElementById('deckAdvFilterBadge');
  if (badge) {
    badge.textContent = String(activeCount);
    badge.classList.toggle('hidden', activeCount === 0);
  }
}

document.getElementById('selDeckSort')?.addEventListener('change', () => renderDeckEditor());
document.getElementById('btnToggleDeckFilterPanel')?.addEventListener('click', () => {
  const p = document.getElementById('deckAdvFilterPanel');
  if (!p) return;
  p.classList.toggle('hidden');
  renderAdvFilterPills();
});
document.getElementById('btnCloseAdvFilter')?.addEventListener('click', () => {
  document.getElementById('deckAdvFilterPanel')?.classList.add('hidden');
});
document.getElementById('btnResetAdvFilter')?.addEventListener('click', () => {
  deckAdvFilter.cost = 'all'; deckAdvFilter.system = 'all'; deckAdvFilter.race = 'all';
  deckAdvFilter.type = 'all'; deckAdvFilter.rarity = 'all'; deckAdvFilter.specs = [];
  renderAdvFilterPills();
  renderDeckEditor();
});
renderAdvFilterPills();

// ============================================================================
// v53 主界面空中漂浮卡牌背景动画引擎
// ============================================================================
let _menuBgRaf = null;
let _menuFloatingCards = [];
let _menuBgStars = [];

function startMainMenuBgAnim() {
  const cvs = document.getElementById('mainMenuBgCanvas');
  const streamEl = document.getElementById('mainMenuCardStream');
  const overlay = document.getElementById('mainMenuOverlay');
  if (!cvs || !overlay) return;
  if (_menuBgRaf) { cancelAnimationFrame(_menuBgRaf); _menuBgRaf = null; }

  const ctx = cvs.getContext('2d');
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cvs.width = Math.floor(window.innerWidth * dpr);
    cvs.height = Math.floor(window.innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  if (!cvs._boundResize) {
    window.addEventListener('resize', resize);
    cvs._boundResize = true;
  }

  // 生成 16 张高清真实卡牌 DOM，赋予全方位 360° 随机飞行方向与缓慢 3D 自转力矩
  if (_menuFloatingCards.length === 0 && streamEl && Array.isArray(allCards) && allCards.length > 0) {
    streamEl.innerHTML = '';
    const pool = allCards.filter(c => !c.isToken);
    const highRarity = pool.filter(c => c.rarity === '传说' || c.rarity === '史诗');
    const otherCards = pool.filter(c => c.rarity !== '传说' && c.rarity !== '史诗');
    const ordered = [];
    for (let i = 0; i < 16; i++) {
      if (i % 3 !== 2 && highRarity.length > 0) {
        ordered.push(highRarity[(i * 5) % highRarity.length]);
      } else if (otherCards.length > 0) {
        ordered.push(otherCards[(i * 7) % otherCards.length]);
      } else {
        ordered.push(pool[i % pool.length]);
      }
    }

    const W = window.innerWidth, H = window.innerHeight;
    const randSign = () => (Math.random() < 0.5 ? -1 : 1);
    ordered.forEach((c, i) => {
      const wrap = document.createElement('div');
      wrap.className = 'menu-float-card';
      const cardDom = buildHandCardDOM(c, null, 0);
      const backDom = document.createElement('div');
      backDom.className = 'menu-float-card-back';
      wrap.appendChild(cardDom);
      wrap.appendChild(backDom);
      streamEl.appendChild(wrap);

      const flyAngle = Math.random() * Math.PI * 2;
      const speed = 0.45 + Math.random() * 0.85;
      const scale = 0.72 + Math.random() * 0.26;
      wrap.style.opacity = String((0.78 + Math.random() * 0.18).toFixed(2));
      _menuFloatingCards.push({
        el: wrap,
        x: Math.random() * W,
        y: Math.random() * H,
        vx: Math.cos(flyAngle) * speed,
        vy: Math.sin(flyAngle) * speed,
        rx: (Math.random() - 0.5) * 40,
        ry: (Math.random() - 0.5) * 60,
        rz: Math.random() * 360,
        vrx: randSign() * (0.08 + Math.random() * 0.22),
        vry: randSign() * (0.12 + Math.random() * 0.28),
        vrz: randSign() * (0.08 + Math.random() * 0.24),
        scale
      });
    });

    if (_menuBgStars.length === 0) {
      for (let s = 0; s < 60; s++) {
        const sAng = Math.random() * Math.PI * 2;
        const sSpd = 0.15 + Math.random() * 0.35;
        _menuBgStars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: 0.9 + Math.random() * 2.2,
          vx: Math.cos(sAng) * sSpd,
          vy: Math.sin(sAng) * sSpd,
          alpha: 0.25 + Math.random() * 0.65,
          col: s % 3 === 0 ? '#fde047' : (s % 3 === 1 ? '#38bdf8' : '#c084fc')
        });
      }
    }
  }

  let t = 0;
  function frame() {
    if (overlay.classList.contains('hidden')) {
      _menuBgRaf = null;
      return;
    }
    t += 0.016;
    const W = window.innerWidth, H = window.innerHeight;
    ctx.clearRect(0, 0, W, H);

    // 极光氛围光晕
    const g1 = ctx.createRadialGradient(W * 0.22, H * 0.22, 20, W * 0.22, H * 0.22, W * 0.45);
    g1.addColorStop(0, 'rgba(56, 189, 248, 0.15)');
    g1.addColorStop(1, 'transparent');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, W, H);

    const g2 = ctx.createRadialGradient(W * 0.78, H * 0.76, 20, W * 0.78, H * 0.76, W * 0.48);
    g2.addColorStop(0, 'rgba(168, 85, 247, 0.15)');
    g2.addColorStop(1, 'transparent');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);

    // 星尘粒子
    for (const st of _menuBgStars) {
      st.x += st.vx;
      st.y += st.vy;
      if (st.x < -10) st.x = W + 10;
      if (st.x > W + 10) st.x = -10;
      if (st.y < -10) st.y = H + 10;
      if (st.y > H + 10) st.y = -10;
      ctx.save();
      ctx.globalAlpha = st.alpha * (0.65 + 0.35 * Math.sin(t * 2 + st.x));
      ctx.fillStyle = st.col;
      ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // 驱动全方位 360° 乱飞 + 缓慢随机方向 3D 自转的实体卡牌
    for (const fc of _menuFloatingCards) {
      fc.x += fc.vx;
      fc.y += fc.vy;
      fc.rx = (fc.rx + fc.vrx) % 360;
      fc.ry = (fc.ry + fc.vry) % 360;
      fc.rz = (fc.rz + fc.vrz) % 360;

      if (fc.x < -220) fc.x = W + 180;
      if (fc.x > W + 220) fc.x = -180;
      if (fc.y < -260) fc.y = H + 200;
      if (fc.y > H + 260) fc.y = -200;

      fc.el.style.transform = `translate3d(${fc.x.toFixed(1)}px, ${fc.y.toFixed(1)}px, 0) rotateX(${fc.rx.toFixed(1)}deg) rotateY(${fc.ry.toFixed(1)}deg) rotateZ(${fc.rz.toFixed(1)}deg) scale(${fc.scale.toFixed(3)})`;
    }

    _menuBgRaf = requestAnimationFrame(frame);
  }
  _menuBgRaf = requestAnimationFrame(frame);
}

// 页面首次加载时如果主界面可见，立即启动空中飘浮卡牌背景动画
if (document.getElementById('mainMenuOverlay') && !document.getElementById('mainMenuOverlay').classList.contains('hidden')) {
  setTimeout(startMainMenuBgAnim, 80);
}

// ============================================================================
// v32 联机全量特效队列重放 + 斩杀慢动作 + 主战者表情 + 局内聊天
// ============================================================================
OnlineState.recordedVfx = [];

function recordLocalVfx(ev) {
  if (battleMode === 'pvp_online' && OnlineState.inMatch && onlineIsMyTurn()) {
    OnlineState.recordedVfx.push(ev);
  }
}

async function replayRecordedVfxList(vfxList) {
  if (!Array.isArray(vfxList) || vfxList.length === 0) return;
  OnlineState._replayingVfx = true;
  try {
    for (const ev of vfxList) {
      const mSide = ev.side === 0 ? 1 : 0;
      if (ev.kind === 'row_vfx') {
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

// 斩杀最后一击慢动作特写
async function playLethalSlowMotion(targetSide) {
  const ov = document.getElementById('lethalSlowmoOverlay');
  document.body.classList.add('lethal-slowmo');
  if (ov) ov.classList.remove('hidden');
  sfx.play('legend');
  await sleep(1050);
  if (ov) ov.classList.add('hidden');
  document.body.classList.remove('lethal-slowmo');
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
    row.innerHTML = `<b style="color:${isMe ? '#67e8f9' : '#fde047'};">${sender}：</b>${text.replace(/</g, '&lt;')}`;
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

  const sendChat = () => {
    const val = (chatInput?.value || '').trim();
    if (!val) return;
    chatInput.value = '';
    window.appendInGameChatMessage(OnlineState.nickname || '我', val, true);
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


// ============================================================================
// v34 战场动态不规律魔方阵与雪花符文粒子引擎 (#battleDecorCanvas)
// ============================================================================
(function startBattleDecorAnim() {
  const cvs = document.getElementById('battleDecorCanvas');
  if (!cvs) return;
  const ctx = cvs.getContext('2d');
  const flakes = Array.from({ length: 34 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: 2 + Math.random() * 4.5,
    vy: 0.0003 + Math.random() * 0.0007,
    vx: (Math.random() - 0.5) * 0.0004,
    rot: Math.random() * Math.PI * 2,
    vrot: (Math.random() - 0.5) * 0.015,
    kind: Math.random() < 0.55 ? 'snow' : 'diamond',
    col: Math.random() < 0.5 ? '125,211,252' : '253,224,71',
    alpha: 0.14 + Math.random() * 0.24
  }));
  const cubes = [
    { rx: 0.13, ry: 0.36, size: 46, rot: 0.2, vr: 0.004, col: 'rgba(56,189,248,0.18)' },
    { rx: 0.84, ry: 0.62, size: 54, rot: 1.1, vr: -0.0035, col: 'rgba(251,191,36,0.16)' },
    { rx: 0.17, ry: 0.72, size: 32, rot: 0.7, vr: 0.006, col: 'rgba(192,132,252,0.16)' }
  ];

  function drawSnowflake(x, y, r, rot, col, a) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.strokeStyle = `rgba(${col},${a})`;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
      const ang = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(-Math.cos(ang) * r, -Math.sin(ang) * r);
      ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawMagicCube(x, y, s, rot, col) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-s * 0.5, -s * 0.5, s, s);
    ctx.rotate(Math.PI / 4);
    ctx.strokeRect(-s * 0.42, -s * 0.42, s * 0.84, s * 0.84);
    ctx.beginPath(); ctx.arc(0, 0, s * 0.68, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  function tick() {
    const sb = document.getElementById('screenBattle');
    if (sb && !sb.classList.contains('hidden')) {
      const w = cvs.width = window.innerWidth;
      const h = cvs.height = window.innerHeight;
      ctx.clearRect(0, 0, w, h);
      cubes.forEach(c => {
        c.rot += c.vr;
        drawMagicCube(c.rx * w, c.ry * h + Math.sin(c.rot * 2) * 8, c.size, c.rot, c.col);
      });
      flakes.forEach(f => {
        f.y += f.vy;
        f.x += f.vx + Math.sin(f.y * 12) * 0.00018;
        f.rot += f.vrot;
        if (f.y > 1.03) { f.y = -0.03; f.x = Math.random(); }
        if (f.kind === 'snow') {
          drawSnowflake(f.x * w, f.y * h, f.r, f.rot, f.col, f.alpha);
        } else {
          ctx.save();
          ctx.translate(f.x * w, f.y * h);
          ctx.rotate(f.rot);
          ctx.fillStyle = `rgba(${f.col},${f.alpha})`;
          ctx.fillRect(-f.r * 0.5, -f.r * 0.5, f.r, f.r);
          ctx.restore();
        }
      });
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

applyUserAvatarToUI();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootGameNow);
} else {
  bootGameNow();
}
window.onload = bootGameNow;
