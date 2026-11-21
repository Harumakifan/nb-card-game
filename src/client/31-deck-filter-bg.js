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

window.refreshMainMenuCards = function () {
  if (typeof _menuFloatingCards !== 'undefined' && Array.isArray(_menuFloatingCards)) {
    _menuFloatingCards.length = 0;
  }
  const streamEl = document.getElementById('mainMenuCardStream');
  if (streamEl) streamEl.innerHTML = '';
  const overlay = document.getElementById('mainMenuOverlay');
  if (overlay && !overlay.classList.contains('hidden')) {
    startMainMenuBgAnim();
  }
};

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

  // 生成 14 张极远微点卡牌 + 16 张远景缩略图卡牌 + 12 张中近景全特效卡牌：真 360 度随机方向从屏幕外飘入
  function spawnMenuCardFromOffscreen(W, H, tier) {
    const ang = Math.random() * Math.PI * 2;
    const passX = W * (0.04 + Math.random() * 0.92);
    const passY = H * (0.04 + Math.random() * 0.92);
    const dx = -Math.cos(ang), dy = -Math.sin(ang);
    let tExit = 99999;
    if (dx > 1e-4) tExit = Math.min(tExit, (W - passX) / dx);
    else if (dx < -1e-4) tExit = Math.min(tExit, -passX / dx);
    if (dy > 1e-4) tExit = Math.min(tExit, (H - passY) / dy);
    else if (dy < -1e-4) tExit = Math.min(tExit, -passY / dy);
    if (!isFinite(tExit) || tExit < 0) tExit = Math.max(W, H) * 0.5;
    const pad = tier === 'tiny' ? 100 : (tier === 'far' ? 180 : 320);
    const backDist = tExit + pad + Math.random() * 100;
    const x = passX + dx * backDist;
    const y = passY + dy * backDist;
    const speed = tier === 'tiny' ? (0.08 + Math.random() * 0.14) : (tier === 'far' ? (0.14 + Math.random() * 0.18) : (tier === 'mid' ? (0.24 + Math.random() * 0.24) : (0.30 + Math.random() * 0.28)));
    return { x, y, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed };
  }

  if (_menuFloatingCards.length === 0 && streamEl && Array.isArray(allCards) && allCards.length > 0) {
    streamEl.innerHTML = '';
    const pool = allCards.filter(c => !c.isToken);
    const highRarity = pool.filter(c => c.rarity === '传说' || c.rarity === '史诗');
    const otherCards = pool.filter(c => c.rarity !== '传说' && c.rarity !== '史诗');
    const ordered = [];
    for (let i = 0; i < 26; i++) {
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
      const depthTier = i < 8 ? 'tiny' : (i < 16 ? 'far' : (i < 22 ? 'mid' : 'near'));
      const wrap = document.createElement('div');
      wrap.className = 'menu-float-card';
      // 全部层次统一使用新版异形卡面（buildHandCardDOM），彻底告别旧版平框缩略卡
      const cardDom = buildHandCardDOM(c, null, 0);
      wrap.appendChild(cardDom);
      streamEl.appendChild(wrap);

      const sp = spawnMenuCardFromOffscreen(W, H, depthTier);
      const scale = depthTier === 'tiny' ? (0.34 + Math.random() * 0.16) : (depthTier === 'far' ? (0.48 + Math.random() * 0.18) : (depthTier === 'mid' ? (0.64 + Math.random() * 0.16) : (0.82 + Math.random() * 0.16)));
      const zInit = depthTier === 'tiny' ? (-950 + Math.random() * 380) : (depthTier === 'far' ? (-520 + Math.random() * 300) : (depthTier === 'mid' ? (-160 + Math.random() * 220) : (20 + Math.random() * 140)));
      const vz = randSign() * (depthTier === 'tiny' ? (0.04 + Math.random() * 0.08) : (depthTier === 'far' ? (0.07 + Math.random() * 0.12) : (0.10 + Math.random() * 0.22)));
      const baseOpacity = 1;
      wrap.style.opacity = '1';
      wrap.style.zIndex = '1';
      _menuFloatingCards.push({
        el: wrap,
        tier: depthTier,
        x: sp.x,
        y: sp.y,
        z: zInit,
        vz,
        vx: sp.vx,
        vy: sp.vy,
        rx: Math.random() * 360,
        ry: Math.random() * 360,
        rz: Math.random() * 360,
        vrx: randSign() * (0.10 + Math.random() * 0.18),
        vry: randSign() * (0.12 + Math.random() * 0.24),
        vrz: randSign() * (0.08 + Math.random() * 0.18),
        scale,
        baseOpacity
      });
    });

    if (_menuBgStars.length === 0) {
      for (let s = 0; s < 70; s++) {
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

    // 驱动全距随机飘动卡牌（极远微点 -> 远景缩略图 -> 中近景全特效，仅极近镜头时破损消散）
    for (const fc of _menuFloatingCards) {
      fc.x += fc.vx;
      fc.y += fc.vy;
      fc.z = (fc.z || 0) + (fc.vz || 0);
      fc.rx = (fc.rx + fc.vrx) % 360;
      fc.ry = (fc.ry + fc.vry) % 360;
      fc.rz = (fc.rz + fc.vrz) % 360;

      if ((fc.tier === 'tiny' || fc.tier === 'far') && (fc.z < -1100 || fc.z > -80)) {
        fc.vz = -fc.vz;
      }

      const respawnFromOffscreen = () => {
        const sp = spawnMenuCardFromOffscreen(W, H, fc.tier);
        fc.x = sp.x;
        fc.y = sp.y;
        fc.vx = sp.vx;
        fc.vy = sp.vy;
        fc.z = fc.tier === 'tiny' ? (-950 + Math.random() * 380) : (fc.tier === 'far' ? (-520 + Math.random() * 300) : (-140 + Math.random() * 240));
        fc.vz = (Math.random() < 0.5 ? -1 : 1) * Math.abs(fc.vz || 0.15);
      };

      if (fc.x < -640 || fc.x > W + 640 || fc.y < -640 || fc.y > H + 640 || fc.z > 415 || fc.z < -1250) {
        respawnFromOffscreen();
      }

      const zFactor = 440 / Math.max(45, 440 - fc.z);
      const visualScale = fc.scale * zFactor;
      const zIdx = Math.max(1, Math.round(visualScale * 1000));
      if (fc._lastZIdx !== zIdx) {
        fc.el.style.zIndex = String(zIdx);
        fc._lastZIdx = zIdx;
      }

      if (fc.z > 320) {
        const rawT = Math.min(1, (fc.z - 320) / 95);
        const smoothT = rawT * rawT * (3 - 2 * rawT);
        fc.el.style.opacity = (1 - smoothT).toFixed(3);
      } else if (fc.el.style.opacity !== '1') {
        fc.el.style.opacity = '1';
      }

      fc.el.style.transform = `translate3d(${fc.x.toFixed(1)}px, ${fc.y.toFixed(1)}px, 0) rotateX(${fc.rx.toFixed(1)}deg) rotateY(${fc.ry.toFixed(1)}deg) rotateZ(${fc.rz.toFixed(1)}deg) scale(${visualScale.toFixed(3)})`;
    }

    _menuBgRaf = requestAnimationFrame(frame);
  }
  _menuBgRaf = requestAnimationFrame(frame);
}

// 页面首次加载时如果主界面可见，立即启动空中飘浮卡牌背景动画
if (document.getElementById('mainMenuOverlay') && !document.getElementById('mainMenuOverlay').classList.contains('hidden')) {
  setTimeout(startMainMenuBgAnim, 80);
}

