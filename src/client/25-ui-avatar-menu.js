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
function renderLeaderPortraitDataURI(cfg) {
  const src = cfg || userAvatarConfig || {};
  if (src.leaderCardId && typeof cardsById !== 'undefined' && cardsById[src.leaderCardId]) {
    return getAnimeIllustrationDataURI(cardsById[src.leaderCardId]);
  }
  return renderDefaultCustomAvatarDataURI(src);
}

function renderCustomAvatarDataURI(cfg) {
  const src = cfg || userAvatarConfig || {};
  if (src.avatarCardId && typeof cardsById !== 'undefined' && cardsById[src.avatarCardId]) {
    return getAnimeIllustrationDataURI(cardsById[src.avatarCardId]);
  }
  return renderDefaultCustomAvatarDataURI(src);
}

function renderDefaultCustomAvatarDataURI(cfg) {
  const src = cfg || userAvatarConfig || {};
  const c = Object.assign({ backdrop: 'star', hairStyle: 'twintail', hairColor: 'emerald', eyeStyle: 'sharp', outfit: 'knight', armorColor: 'obsidian', wings: 'light', weapon: 'lance', headgear: 'horns' }, src);
  const cacheKey = `${c.backdrop}_${c.hairStyle}_${c.hairColor}_${c.eyeStyle}_${c.outfit}_${c.armorColor}_${c.wings}_${c.weapon}_${c.headgear}`;
  if (_customAvatarCache[cacheKey]) return _customAvatarCache[cacheKey];
  // 头像配置可能来自大厅里的其他玩家：缓存设上限，避免无限增长
  const _cacheKeys = Object.keys(_customAvatarCache);
  if (_cacheKeys.length > 200) _cacheKeys.forEach(k => delete _customAvatarCache[k]);

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
  const leaderUri = renderLeaderPortraitDataURI(userAvatarConfig);
  const pImg = document.getElementById('playerLeaderImg');
  if (pImg) pImg.src = leaderUri;
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
  modal.style.display = 'flex';
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
document.getElementById('btnAvatarGoDeckEditor')?.addEventListener('click', () => {
  const avModal = document.getElementById('leaderAvatarModal');
  if (avModal) avModal.classList.add('hidden');
  const mm = document.getElementById('mainMenuOverlay');
  if (mm) mm.classList.add('hidden');
  document.getElementById('btnNavDeck')?.click();
  if (typeof showToast === 'function') {
    showToast('🎨 点击任意卡牌查看详情，即可设为「游戏头像」或「主战者形象」', 'info');
  }
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


