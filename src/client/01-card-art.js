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

// 为全部 38 张卡牌按各自【卡牌名字】单独定制构图、造型与特效（彻底告别千篇一律的重复模板脸！）
const artLayerCache = {};
function getShatterGlintsHTML(cardData) {
  if (!cardData) return '';
  const r = cardData.rarity || '普通';
  const seed = hashStr((cardData.id || '') + (cardData.name || ''));
  const delay = -((seed % 46) / 10).toFixed(1);
  const bgCol = r === '传说'
    ? 'linear-gradient(180deg, transparent 0%, rgba(254,240,138,0.98) 42%, rgba(125,211,252,0.94) 58%, transparent 100%)'
    : r === '史诗'
    ? 'linear-gradient(180deg, transparent 0%, rgba(253,224,71,0.95) 45%, rgba(232,121,249,0.90) 60%, transparent 100%)'
    : r === '稀有'
    ? 'linear-gradient(180deg, transparent 0%, rgba(226,232,240,0.88) 46%, rgba(125,211,252,0.82) 58%, transparent 100%)'
    : 'linear-gradient(180deg, transparent 0%, rgba(255,236,210,0.68) 50%, transparent 100%)';
  return `<div class="sv-glint-sweep-layer"><div class="sv-glint-sweep-beam" style="background:${bgCol};animation-delay:${delay}s;"></div></div>`;
}

function getCardArtAnimOverlayHTML(c) {
  return '';
}

function getCardMaterialType(cardData) {
  if (!cardData) return 'holy';
  if (cardData.type === 'spell') return 'spell';
  if (cardData.type === 'amulet') return 'amulet';
  const r = String(cardData.race || '');
  if (r.includes('龙')) return 'dragon';
  if (isMechCard(cardData)) return 'mech';
  if (r.includes('亡灵') || r.includes('恶魔') || r.includes('吸血')) return 'undead';
  return 'holy';
}

function getCustomSvgCardArtURI(cardData) {
  if (!cardData || typeof window === 'undefined' || !window.CF_SVG_ART_PACK) return null;
  const pack = window.CF_SVG_ART_PACK;
  const rawName = String(cardData.name || '').trim();
  const strippedName = rawName
    .replace(/^(?:结晶[：:]|【结晶】)/, '')
    .replace(/(?:·结晶|（结晶）|\(结晶\))$/, '')
    .trim();
  return (
    pack[rawName] ||
    (cardData.artCardName && pack[cardData.artCardName]) ||
    (cardData.sourceCardName && pack[cardData.sourceCardName]) ||
    (strippedName && pack[strippedName]) ||
    pack[cardData.id] ||
    (cardData.sourceCardId && pack[cardData.sourceCardId]) ||
    null
  );
}

function getAnimeIllustrationLayers(cardData) {
  const key = cardData.id + '_' + cardData.name;
  const svgArt = getCustomSvgCardArtURI(cardData);
  if (svgArt) return { bgUri: svgArt, fgUri: svgArt };
  if (artLayerCache[key]) return artLayerCache[key];
  if (typeof window !== 'undefined' && typeof window.renderCustomCardArtLayers === 'function') {
    const bgCvs = document.createElement('canvas'); bgCvs.width = 280; bgCvs.height = 220;
    const fgCvs = document.createElement('canvas'); fgCvs.width = 280; fgCvs.height = 220;
    const ok = window.renderCustomCardArtLayers(bgCvs.getContext('2d'), fgCvs.getContext('2d'), cardData);
    if (ok) {
      const res = { bgUri: bgCvs.toDataURL('image/png'), fgUri: fgCvs.toDataURL('image/png') };
      artLayerCache[key] = res;
      return res;
    }
  }
  const full = getAnimeIllustrationDataURI(cardData);
  const res = { bgUri: full, fgUri: full };
  artLayerCache[key] = res;
  return res;
}

function getAnimeIllustrationDataURI(cardData) {
  const key = cardData.id + '_' + cardData.name;
  const svgArt = getCustomSvgCardArtURI(cardData);
  if (svgArt) return svgArt;
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
  else if (name === '幸运币' || id === 'token_lucky_coin') {
  /* 幸运币：纯 canvas 绘制（原来只写了个没人读的 svgBody，等于没画） */
  (function drawLuckyCoin() {
    const cx = 140, cy = 108, R = 66;

    /* 背景：深棕金晕 */
    const bg = ctx.createRadialGradient(cx, cy, 8, cx, cy, 190);
    bg.addColorStop(0, '#4a3410'); bg.addColorStop(0.55, '#231a0c'); bg.addColorStop(1, '#07090f');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, 280, 220);

    /* 放射光 */
    ctx.save(); ctx.translate(cx, cy); ctx.globalAlpha = 0.20;
    for (let k = 0; k < 12; k++) {
      ctx.rotate(Math.PI / 6);
      const g = ctx.createLinearGradient(0, 0, 0, -R * 2.05);
      g.addColorStop(0, 'rgba(253,224,71,0.95)'); g.addColorStop(1, 'rgba(253,224,71,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(5, 0); ctx.lineTo(0, -R * 2.05); ctx.closePath(); ctx.fill();
    }
    ctx.restore();

    /* 地面投影 */
    ctx.save(); ctx.globalAlpha = 0.45; ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(cx, cy + R + 16, R * 0.86, 13, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();

    /* 金币本体：厚边 + 正面 */
    ctx.save();
    ctx.translate(0, 6);
    const edge = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
    edge.addColorStop(0, '#8a4a06'); edge.addColorStop(0.5, '#c87a10'); edge.addColorStop(1, '#6b3703');
    ctx.fillStyle = edge;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    const face = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.42, R * 0.15, cx, cy, R * 1.05);
    face.addColorStop(0, '#fffbdc'); face.addColorStop(0.32, '#fce97a');
    face.addColorStop(0.62, '#f6c035'); face.addColorStop(0.86, '#d1861b'); face.addColorStop(1, '#9a5606');
    ctx.fillStyle = face;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(255,246,196,0.92)';
    ctx.beginPath(); ctx.arc(cx, cy, R - 1.6, 0, Math.PI * 2); ctx.stroke();

    /* 边齿 */
    ctx.save(); ctx.translate(cx, cy); ctx.fillStyle = 'rgba(120,60,6,0.55)';
    for (let k = 0; k < 28; k++) {
      ctx.rotate((Math.PI * 2) / 28);
      ctx.beginPath(); ctx.arc(0, -(R - 6.5), 1.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    /* 内圈 */
    ctx.strokeStyle = 'rgba(140,74,8,0.62)'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.arc(cx, cy, R - 17, 0, Math.PI * 2); ctx.stroke();

    /* 中央星徽（四角星 + 小星） */
    function star(px, py, r1, r2, n, rot) {
      ctx.beginPath();
      for (let k = 0; k < n * 2; k++) {
        const rr = k % 2 ? r2 : r1;
        const a = rot + (Math.PI * k) / n;
        const x = px + Math.cos(a) * rr, y = py + Math.sin(a) * rr;
        k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.closePath();
    }
    ctx.save();
    ctx.shadowColor = 'rgba(255,236,150,0.85)'; ctx.shadowBlur = 12;
    ctx.fillStyle = '#fffbe0';
    star(cx, cy - 2, 33, 13, 4, -Math.PI / 2); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(150,80,8,0.55)'; ctx.stroke();
    ctx.restore();

    /* ＋1 能量标记 */
    ctx.save();
    ctx.font = '900 15px system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(120,60,6,0.9)';
    ctx.fillText('1', cx + 0.6, cy + 34.6);
    ctx.fillStyle = '#fff8d8';
    ctx.fillText('1', cx, cy + 34);
    ctx.font = '900 11px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,248,216,0.95)';
    ctx.fillText('⚡', cx - 15, cy + 34);
    ctx.restore();

    /* 高光弧 */
    ctx.save(); ctx.globalAlpha = 0.55; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx, cy, R - 11, Math.PI * 1.08, Math.PI * 1.42); ctx.stroke();
    ctx.globalAlpha = 0.3; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.arc(cx, cy, R - 21, Math.PI * 1.12, Math.PI * 1.30); ctx.stroke();
    ctx.restore();

    /* 漂浮光点 */
    const dots = [[52, 44, 2.6], [222, 58, 2.1], [206, 164, 2.8], [64, 150, 2.2], [178, 30, 1.8], [96, 190, 1.9]];
    dots.forEach(([x, y, r], idx) => {
      ctx.save();
      ctx.globalAlpha = 0.55 + (idx % 3) * 0.15;
      ctx.fillStyle = idx % 2 ? '#fef9c3' : '#fbbf24';
      ctx.shadowColor = '#fde047'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
  })();
} else if (name === '龙心秘宝') {
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

