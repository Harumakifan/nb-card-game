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

function attachBalatroTiltHandlers(el) {
  if (!el || el._balatroBound) return;
  el._balatroBound = true;
  // v1.68: 已取消触碰3D倾斜效果，保持纯2D高清渲染
}

function buildFollowerTokenDOM(inst, side, lane) {
  const c = inst.data;
  const el = document.createElement('div');
  const rarityCls = getRarityClass(c.rarity);
  const rarityBadgeCls = getRarityBadgeClass(c.rarity);
  const classes = ['interactive-zone', 'sv-follower-token', rarityCls, 'overflow-hidden', 'flex', 'flex-col', 'justify-between'];
  if (!inst._cfBoardEnterPlayed) {
    inst._cfBoardEnterPlayed = true;
    classes.push('cf-board-enter-drop');
  }

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
  el.dataset.material = getCardMaterialType(c);
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
    <div class="sv-board-card-clip">
      <div class="sv-art-bg-layer sv-board-ambient-blur" style="background-image:url('${imgUri}');"></div>
      <img src="${imgUri}" class="sv-art-fg-layer sv-board-full-art absolute inset-0 w-full h-full" alt="${c.name}" decoding="async"/>
      ${getCardArtAnimOverlayHTML(c)}
      ${typeof c !== 'undefined' ? getShatterGlintsHTML(c) : ''}
    </div>
    ${surroundVfxHtml}
    ${inst.justEnteredLegendVfx ? `<div class="legend-oncard-vfx"></div>` : ''}
    ${classes.includes('cf-board-enter-drop') ? `<div class="cf-board-enter-flash"></div>` : ''}
    ${countdownBadgeHtml}
    ${grantedBadgeHtml}
    ${sacSelectedOverlayHtml}
    <div class="sv-board-name-top-tag">
      <span>${c.name}</span>
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
  const side = (inst && typeof inst.owner === 'number') ? inst.owner : ((inst && typeof inst.side === 'number') ? inst.side : 0);
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
    const inHand = Boolean(inst && hand.includes(inst));
    return (st.werewolfPlayedCount || 0) + (inHand ? 1 : 0);
  }
  if (name === '利刃蔷薇剑士') {
    return st.selfTurnDamageCount || 0;
  }
  if (name === '摇滚骷髅乐团鼓手') {
    return st.totalSelfTurnDamageCount || 0;
  }
  if (name === '邪恶骨巫') {
    return (st.crests || []).length;
  }
  if (name === '守护之光芒') {
    return (battle.board && battle.board[side]) ? battle.board[side].filter(bm => bm && bm.data.type === 'minion' && bm.activeKw['守护']).length : 0;
  }
  return null;
}


let _cfSvgFrameUidCounter = 0;
const _CF_V2_FRAME_TEMPLATES = {"minion": {"artClip": "<path d=\"M 134 166 L 466 166 C 474 185, 488 196, 508 202 L 508 654 C 442 637, 368 632, 300 632 C 232 632, 158 637, 92 654 L 92 202 C 112 196, 126 185, 134 166 Z\"/>", "outerD": "M 74 92 L 130 92 C 178 56, 238 38, 300 38 C 362 38, 422 56, 470 92 L 516 92 C 523 92, 526 96, 526 103 L 526 686 L 74 686 L 74 103 C 74 96, 77 92, 74 92 Z", "body": "<g id=\"card-frame\">\n<path id=\"outer-frame-shape\" d=\"M 74 92 L 130 92 C 178 56, 238 38, 300 38 C 362 38, 422 56, 470 92 L 516 92 C 523 92, 526 96, 526 103 L 526 686 L 74 686 L 74 103 C 74 96, 77 92, 74 92 Z\" fill=\"url(#frameGrad___UID__)\" stroke=\"__STROKE_DARK__\" stroke-width=\"3.6\" stroke-linejoin=\"round\"/>\n<path d=\"M 74 92 L 130 92 C 178 56, 238 38, 300 38 C 362 38, 422 56, 470 92 L 516 92 C 523 92, 526 96, 526 103 L 526 686 L 74 686 L 74 103 C 74 96, 77 92, 74 92 Z\" fill=\"url(#frameSheen___UID__)\"/>\n<path d=\"M 74 92 L 130 92 C 178 56, 238 38, 300 38 C 362 38, 422 56, 470 92 L 516 92 C 523 92, 526 96, 526 103 L 526 686 L 74 686 L 74 103 C 74 96, 77 92, 74 92 Z\" fill=\"url(#prismOverlay___UID__)\" opacity=\"__PRISM_OP__\"/>\n<path d=\"M 80 98 L 133 98 C 181 63, 240 45, 300 45 C 360 45, 419 63, 467 98 L 513 98 C 518 98, 520 101, 520 106 L 520 680 L 80 680 Z\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"1.8\" opacity=\"0.78\" stroke-linejoin=\"round\"/>\n<g id=\"side-rails\">\n<rect x=\"76\" y=\"170\" width=\"14\" height=\"488\" fill=\"url(#minionRailGrad___UID__)\" opacity=\"0.62\"/>\n<rect x=\"510\" y=\"170\" width=\"14\" height=\"488\" fill=\"url(#minionRailGrad___UID__)\" opacity=\"0.62\"/>\n<line x1=\"80\" y1=\"176\" x2=\"80\" y2=\"652\" stroke=\"#ffffff\" stroke-width=\"1.6\" opacity=\"0.85\"/>\n<line x1=\"85\" y1=\"176\" x2=\"85\" y2=\"652\" stroke=\"__STROKE_DARK__\" stroke-width=\"2.0\" opacity=\"0.62\"/>\n<line x1=\"89\" y1=\"176\" x2=\"89\" y2=\"652\" stroke=\"#ffffff\" stroke-width=\"1.1\" opacity=\"0.72\"/>\n<line x1=\"520\" y1=\"176\" x2=\"520\" y2=\"652\" stroke=\"#ffffff\" stroke-width=\"1.6\" opacity=\"0.85\"/>\n<line x1=\"515\" y1=\"176\" x2=\"515\" y2=\"652\" stroke=\"__STROKE_DARK__\" stroke-width=\"2.0\" opacity=\"0.62\"/>\n<line x1=\"511\" y1=\"176\" x2=\"511\" y2=\"652\" stroke=\"#ffffff\" stroke-width=\"1.1\" opacity=\"0.72\"/>\n</g>\n<g id=\"right-shoulder-bracket\">\n<path d=\"M 470 92 L 516 92 C 523 92, 526 96, 526 103 L 526 164 L 512 164 L 512 108 C 512 103, 508 100, 502 100 L 474 100 Z\"\nfill=\"url(#minionSculptGrad___UID__)\" stroke=\"__STROKE_DARK__\" stroke-width=\"1.35\" stroke-linejoin=\"round\"/>\n<path d=\"M 476 95 L 514 95 C 519 95, 522 98, 522 103 L 522 158\"\nfill=\"none\" stroke=\"#ffffff\" stroke-width=\"1.6\" opacity=\"0.88\"/>\n<path d=\"M 501 97 L 514 97 L 514 108 L 507 108 L 507 103 L 501 103 Z\"\nfill=\"#ffffff\" stroke=\"__STROKE_DARK__\" stroke-width=\"0.9\" opacity=\"0.90\"/>\n</g>\n<g id=\"top-crown-ornament\" opacity=\"1.0\">\n<path d=\"M 132 96 C 180 59, 240 41, 300 41 C 360 41, 420 59, 468 96 L 456 98 C 412 65, 356 50, 300 50 C 244 50, 188 65, 144 98 Z\" fill=\"url(#minionSculptGrad___UID__)\" stroke=\"__STROKE_DARK__\" stroke-width=\"1.4\" stroke-linejoin=\"round\"/>\n<path d=\"M 146 98 C 188 66, 244 51, 300 51 C 356 51, 412 66, 454 98 Z\" fill=\"url(#minionLunetteGrad___UID__)\" stroke=\"__STROKE_DARK__\" stroke-width=\"1.3\"/>\n<path d=\"M 132 96 C 180 59, 240 41, 300 41 C 360 41, 420 59, 468 96 L 456 98 C 412 65, 356 50, 300 50 C 244 50, 188 65, 144 98 Z\" fill=\"url(#prismOverlay___UID__)\" opacity=\"__PRISM_OP__\"/>\n<path d=\"M 146 98 C 188 66, 244 51, 300 51 C 356 51, 412 66, 454 98 Z\" fill=\"url(#prismOverlay___UID__)\" opacity=\"__PRISM_OP__\"/>\n<path d=\"M 138 94 C 184 59, 241 43, 300 43 C 359 43, 416 59, 462 94\"\nfill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.2\" opacity=\"0.94\"/>\n<g>\n<g transform=\"translate(0, 2.0)\" fill=\"__STROKE_DARK__\" opacity=\"0.52\">\n<path d=\"M 300 84 C 293 69, 282 57, 267 57 C 254 57, 247 68, 251 79 C 255 89, 269 90, 276 82 C 280 77, 278 68, 270 68 C 264 68, 263 75, 267 77 C 265 80, 259 77, 259 72 C 259 65, 267 62, 273 65 C 283 69, 287 80, 292 90 Z\"/>\n<path d=\"M 258 54 C 235 53, 211 62, 196 78 C 188 86, 181 93, 171 97 L 196 97 C 206 90, 215 80, 224 76 C 232 73, 238 76, 237 82 C 236 86, 229 86, 227 81 C 223 86, 229 93, 239 91 C 250 88, 254 75, 246 67 C 241 62, 231 63, 224 67 C 234 60, 246 58, 258 60 Z\"/>\n<path d=\"M 239 98 C 255 83, 277 77, 300 77 L 300 89 C 282 89, 266 92, 254 98 Z\"/>\n<path d=\"M 208 69 C 188 71, 166 81, 146 97 L 170 97 C 181 87, 193 79, 208 75 Z\"/>\n<path d=\"M 214 66 C 226 55, 244 50, 266 50 C 253 54, 238 59, 224 67 Z\"/>\n</g>\n<g fill=\"url(#minionSculptGrad___UID__)\" stroke=\"__STROKE_DARK__\" stroke-width=\"1.2\" stroke-linejoin=\"round\">\n<path d=\"M 208 69 C 188 71, 166 81, 146 97 L 170 97 C 181 87, 193 79, 208 75 Z\"/>\n<path d=\"M 214 66 C 226 55, 244 50, 266 50 C 253 54, 238 59, 224 67 Z\"/>\n<path d=\"M 258 54 C 235 53, 211 62, 196 78 C 188 86, 181 93, 171 97 L 196 97 C 206 90, 215 80, 224 76 C 232 73, 238 76, 237 82 C 236 86, 229 86, 227 81 C 223 86, 229 93, 239 91 C 250 88, 254 75, 246 67 C 241 62, 231 63, 224 67 C 234 60, 246 58, 258 60 Z\"/>\n<path d=\"M 239 98 C 255 83, 277 77, 300 77 L 300 89 C 282 89, 266 92, 254 98 Z\"/>\n<path d=\"M 300 84 C 293 69, 282 57, 267 57 C 254 57, 247 68, 251 79 C 255 89, 269 90, 276 82 C 280 77, 278 68, 270 68 C 264 68, 263 75, 267 77 C 265 80, 259 77, 259 72 C 259 65, 267 62, 273 65 C 283 69, 287 80, 292 90 Z\"/>\n</g>\n<path d=\"M 300 84 C 293 69, 282 57, 267 57 C 254 57, 247 68, 251 79 C 255 89, 269 90, 276 82 C 280 77, 278 68, 270 68 C 264 68, 263 75, 267 77 C 265 80, 259 77, 259 72 C 259 65, 267 62, 273 65 C 283 69, 287 80, 292 90 Z\" fill=\"url(#prismOverlay___UID__)\" opacity=\"__PRISM_OP__\"/>\n<path d=\"M 258 54 C 235 53, 211 62, 196 78 C 188 86, 181 93, 171 97 L 196 97 C 206 90, 215 80, 224 76 C 232 73, 238 76, 237 82 C 236 86, 229 86, 227 81 C 223 86, 229 93, 239 91 C 250 88, 254 75, 246 67 C 241 62, 231 63, 224 67 C 234 60, 246 58, 258 60 Z\" fill=\"url(#prismOverlay___UID__)\" opacity=\"__PRISM_OP__\"/>\n<path d=\"M 239 98 C 255 83, 277 77, 300 77 L 300 89 C 282 89, 266 92, 254 98 Z\" fill=\"url(#prismOverlay___UID__)\" opacity=\"__PRISM_OP__\"/>\n<path d=\"M 208 69 C 188 71, 166 81, 146 97 L 170 97 C 181 87, 193 79, 208 75 Z\" fill=\"url(#prismOverlay___UID__)\" opacity=\"__PRISM_OP__\"/>\n<g fill=\"#ffffff\" opacity=\"0.86\">\n<path d=\"M 205 70 C 188 73, 169 82, 152 96 L 160 96 C 174 84, 188 77, 205 73 Z\"/>\n<path d=\"M 254 56 C 234 56, 213 64, 199 79 C 192 86, 186 91, 178 96 L 187 96 C 197 87, 209 74, 224 66 C 235 61, 245 59, 254 59 Z\"/>\n<path d=\"M 244 97 C 258 85, 278 79, 300 79 L 300 83 C 281 83, 264 88, 250 97 Z\"/>\n<path d=\"M 297 80 C 290 67, 280 59, 268 59 C 258 59, 252 66, 253 75 C 255 67, 262 63, 270 63 C 279 63, 287 71, 293 82 Z\"/>\n</g>\n<circle cx=\"269\" cy=\"74\" r=\"2.8\" fill=\"#ffffff\" stroke=\"__STROKE_DARK__\" stroke-width=\"0.85\"/>\n<circle cx=\"231\" cy=\"79\" r=\"3.2\" fill=\"#ffffff\" stroke=\"__STROKE_DARK__\" stroke-width=\"0.85\"/>\n</g>\n<g transform=\"translate(600, 0) scale(-1, 1)\">\n<g transform=\"translate(0, 2.0)\" fill=\"__STROKE_DARK__\" opacity=\"0.52\">\n<path d=\"M 300 84 C 293 69, 282 57, 267 57 C 254 57, 247 68, 251 79 C 255 89, 269 90, 276 82 C 280 77, 278 68, 270 68 C 264 68, 263 75, 267 77 C 265 80, 259 77, 259 72 C 259 65, 267 62, 273 65 C 283 69, 287 80, 292 90 Z\"/>\n<path d=\"M 258 54 C 235 53, 211 62, 196 78 C 188 86, 181 93, 171 97 L 196 97 C 206 90, 215 80, 224 76 C 232 73, 238 76, 237 82 C 236 86, 229 86, 227 81 C 223 86, 229 93, 239 91 C 250 88, 254 75, 246 67 C 241 62, 231 63, 224 67 C 234 60, 246 58, 258 60 Z\"/>\n<path d=\"M 239 98 C 255 83, 277 77, 300 77 L 300 89 C 282 89, 266 92, 254 98 Z\"/>\n<path d=\"M 208 69 C 188 71, 166 81, 146 97 L 170 97 C 181 87, 193 79, 208 75 Z\"/>\n<path d=\"M 214 66 C 226 55, 244 50, 266 50 C 253 54, 238 59, 224 67 Z\"/>\n</g>\n<g fill=\"url(#minionSculptGrad___UID__)\" stroke=\"__STROKE_DARK__\" stroke-width=\"1.2\" stroke-linejoin=\"round\">\n<path d=\"M 208 69 C 188 71, 166 81, 146 97 L 170 97 C 181 87, 193 79, 208 75 Z\"/>\n<path d=\"M 214 66 C 226 55, 244 50, 266 50 C 253 54, 238 59, 224 67 Z\"/>\n<path d=\"M 258 54 C 235 53, 211 62, 196 78 C 188 86, 181 93, 171 97 L 196 97 C 206 90, 215 80, 224 76 C 232 73, 238 76, 237 82 C 236 86, 229 86, 227 81 C 223 86, 229 93, 239 91 C 250 88, 254 75, 246 67 C 241 62, 231 63, 224 67 C 234 60, 246 58, 258 60 Z\"/>\n<path d=\"M 239 98 C 255 83, 277 77, 300 77 L 300 89 C 282 89, 266 92, 254 98 Z\"/>\n<path d=\"M 300 84 C 293 69, 282 57, 267 57 C 254 57, 247 68, 251 79 C 255 89, 269 90, 276 82 C 280 77, 278 68, 270 68 C 264 68, 263 75, 267 77 C 265 80, 259 77, 259 72 C 259 65, 267 62, 273 65 C 283 69, 287 80, 292 90 Z\"/>\n</g>\n<path d=\"M 300 84 C 293 69, 282 57, 267 57 C 254 57, 247 68, 251 79 C 255 89, 269 90, 276 82 C 280 77, 278 68, 270 68 C 264 68, 263 75, 267 77 C 265 80, 259 77, 259 72 C 259 65, 267 62, 273 65 C 283 69, 287 80, 292 90 Z\" fill=\"url(#prismOverlay___UID__)\" opacity=\"__PRISM_OP__\"/>\n<path d=\"M 258 54 C 235 53, 211 62, 196 78 C 188 86, 181 93, 171 97 L 196 97 C 206 90, 215 80, 224 76 C 232 73, 238 76, 237 82 C 236 86, 229 86, 227 81 C 223 86, 229 93, 239 91 C 250 88, 254 75, 246 67 C 241 62, 231 63, 224 67 C 234 60, 246 58, 258 60 Z\" fill=\"url(#prismOverlay___UID__)\" opacity=\"__PRISM_OP__\"/>\n<path d=\"M 239 98 C 255 83, 277 77, 300 77 L 300 89 C 282 89, 266 92, 254 98 Z\" fill=\"url(#prismOverlay___UID__)\" opacity=\"__PRISM_OP__\"/>\n<path d=\"M 208 69 C 188 71, 166 81, 146 97 L 170 97 C 181 87, 193 79, 208 75 Z\" fill=\"url(#prismOverlay___UID__)\" opacity=\"__PRISM_OP__\"/>\n<g fill=\"#ffffff\" opacity=\"0.86\">\n<path d=\"M 205 70 C 188 73, 169 82, 152 96 L 160 96 C 174 84, 188 77, 205 73 Z\"/>\n<path d=\"M 254 56 C 234 56, 213 64, 199 79 C 192 86, 186 91, 178 96 L 187 96 C 197 87, 209 74, 224 66 C 235 61, 245 59, 254 59 Z\"/>\n<path d=\"M 244 97 C 258 85, 278 79, 300 79 L 300 83 C 281 83, 264 88, 250 97 Z\"/>\n<path d=\"M 297 80 C 290 67, 280 59, 268 59 C 258 59, 252 66, 253 75 C 255 67, 262 63, 270 63 C 279 63, 287 71, 293 82 Z\"/>\n</g>\n<circle cx=\"269\" cy=\"74\" r=\"2.8\" fill=\"#ffffff\" stroke=\"__STROKE_DARK__\" stroke-width=\"0.85\"/>\n<circle cx=\"231\" cy=\"79\" r=\"3.2\" fill=\"#ffffff\" stroke=\"__STROKE_DARK__\" stroke-width=\"0.85\"/>\n</g>\n<g id=\"crown-center-crest\">\n<polygon points=\"300,48 313,63 300,82 287,63\" fill=\"__STROKE_DARK__\" transform=\"translate(0, 1.8)\" opacity=\"0.52\"/>\n<polygon points=\"300,48 313,63 300,82 287,63\" fill=\"url(#minionSculptGrad___UID__)\" stroke=\"__STROKE_DARK__\" stroke-width=\"1.3\" stroke-linejoin=\"round\"/>\n<polygon points=\"300,51 290,63 300,77\" fill=\"#ffffff\" opacity=\"0.78\"/>\n<polygon points=\"300,51 310,63 300,77\" fill=\"__TRIM_MID__\" opacity=\"0.48\"/>\n<polygon points=\"300,54 306,63 300,73 294,63\" fill=\"#ffffff\" stroke=\"__STROKE_DARK__\" stroke-width=\"0.85\" opacity=\"0.92\"/>\n</g>\n</g>\n</g>\n<g id=\"artwork-section\">\n<path d=\"M 134 166 L 466 166 C 474 185, 488 196, 508 202 L 508 654 C 442 637, 368 632, 300 632 C 232 632, 158 637, 92 654 L 92 202 C 112 196, 126 185, 134 166 Z\" fill=\"#12101a\" stroke=\"__STROKE_DARK__\" stroke-width=\"4\"/>\n<g clip-path=\"url(#artClip___UID__)\">\n<image id=\"card-art\" href=\"__ART_URI__\" x=\"80\" y=\"156\" width=\"440\" height=\"568\"\npreserveAspectRatio=\"xMidYMid slice\"/></g>\n<path d=\"M 134 166 L 466 166 C 474 185, 488 196, 508 202 L 508 654 C 442 637, 368 632, 300 632 C 232 632, 158 637, 92 654 L 92 202 C 112 196, 126 185, 134 166 Z\" fill=\"none\" stroke=\"__STROKE_DARK__\" stroke-width=\"3.6\"/>\n<path d=\"M 134 166 L 466 166 C 474 185, 488 196, 508 202 L 508 654 C 442 637, 368 632, 300 632 C 232 632, 158 637, 92 654 L 92 202 C 112 196, 126 185, 134 166 Z\" fill=\"none\" stroke=\"__TRIM_LIGHT__\" stroke-width=\"1.5\"/>\n<g id=\"art-corner-clasps\">\n<g transform=\"translate(600, 0) scale(-1, 1)\">\n<path d=\"M 464 164 L 510 164 L 510 205 C 492 197, 474 185, 464 164 Z\"\nfill=\"url(#frameGrad___UID__)\" stroke=\"__STROKE_DARK__\" stroke-width=\"1.5\" stroke-linejoin=\"round\"/>\n<path d=\"M 474 167 C 480 180, 492 189, 505 193 C 495 191, 488 184, 490 176 C 492 170, 500 170, 503 176 C 501 173, 496 174, 496 178 C 496 182, 503 185, 507 183 L 507 167 Z\"\nfill=\"url(#minionSculptGrad___UID__)\" stroke=\"__STROKE_DARK__\" stroke-width=\"1.15\" stroke-linejoin=\"round\"/>\n<path d=\"M 476 168 C 482 179, 492 187, 504 191\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"1.6\" opacity=\"0.88\"/>\n</g>\n<path d=\"M 464 164 L 510 164 L 510 205 C 492 197, 474 185, 464 164 Z\"\nfill=\"url(#frameGrad___UID__)\" stroke=\"__STROKE_DARK__\" stroke-width=\"1.5\" stroke-linejoin=\"round\"/>\n<path d=\"M 474 167 C 480 180, 492 189, 505 193 C 495 191, 488 184, 490 176 C 492 170, 500 170, 503 176 C 501 173, 496 174, 496 178 C 496 182, 503 185, 507 183 L 507 167 Z\"\nfill=\"url(#minionSculptGrad___UID__)\" stroke=\"__STROKE_DARK__\" stroke-width=\"1.15\" stroke-linejoin=\"round\"/>\n<path d=\"M 476 168 C 482 179, 492 187, 504 191\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"1.6\" opacity=\"0.88\"/>\n</g>\n<g fill=\"none\" stroke=\"__TRIM_LIGHT__\" stroke-linecap=\"round\" opacity=\"0.95\">\n<path d=\"M 98 238 C 98 212, 112 192, 138 180\" stroke-width=\"1.5\"/>\n<path d=\"M 502 238 C 502 212, 488 192, 462 180\" stroke-width=\"1.5\"/>\n</g>\n</g>\n<g id=\"nameplate-section\">\n<path d=\"M 136 102 L 488 102 C 494 102, 498 98, 500 94 L 506 108 L 518 118 L 518 148 L 504 164 L 136 164 Z\" fill=\"url(#frameGrad___UID__)\" stroke=\"__STROKE_DARK__\" stroke-width=\"2.3\" stroke-linejoin=\"round\"/>\n<path d=\"M 136 102 L 488 102 C 494 102, 498 98, 500 94 L 506 108 L 518 118 L 518 148 L 504 164 L 136 164 Z\" fill=\"url(#frameSheen___UID__)\"/>\n<path d=\"M 136 102 L 488 102 C 494 102, 498 98, 500 94 L 506 108 L 518 118 L 518 148 L 504 164 L 136 164 Z\" fill=\"url(#prismOverlay___UID__)\" opacity=\"__PRISM_OP__\"/>\n<path d=\"M 140 105 L 489 105 C 494 105, 497 102, 499 98\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"1.5\" opacity=\"0.90\"/>\n<line x1=\"140\" y1=\"160\" x2=\"502\" y2=\"160\" stroke=\"#ffffff\" stroke-width=\"1.4\" opacity=\"0.80\"/>\n<path d=\"M 140 110 L 493 110 C 496 116, 502 120, 510 122 L 510 144 C 502 146, 496 150, 493 156 L 140 156 Z\" fill=\"url(#nameBgGrad___UID__)\" stroke=\"__STROKE_DARK__\" stroke-width=\"2.1\" stroke-linejoin=\"round\"/>\n<path d=\"M 142 113 L 491 113 C 495 119, 500 123, 507 125 L 507 141 C 500 143, 495 147, 491 153 L 142 153 Z\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"1.2\" opacity=\"0.74\" stroke-linejoin=\"round\"/>\n<line x1=\"148\" y1=\"115\" x2=\"488\" y2=\"115\" stroke=\"#ffffff\" stroke-width=\"0.9\" opacity=\"0.26\"/>\n<text id=\"card-name\" x=\"300\" y=\"143\" text-anchor=\"middle\"\nfont-family=\"'Source Han Serif SC', 'Noto Serif SC', 'STSong', 'SimSun', 'Microsoft YaHei', serif\"\nfont-weight=\"700\" font-size=\"__NAME_FS__\" letter-spacing=\"1.6\"\nfill=\"#fbf7ee\" stroke=\"#120a14\" stroke-width=\"3.0\" paint-order=\"stroke\">__CARD_NAME__</text>\n</g>\n<g id=\"bottom-gem-section\">\n<path d=\"M 118 656 C 184 638, 242 633, 300 633 C 358 633, 416 638, 482 656 L 482 686 L 118 686 Z\"\nfill=\"url(#frameGrad___UID__)\" stroke=\"__STROKE_DARK__\" stroke-width=\"2.5\" stroke-linejoin=\"round\"/>\n<path d=\"M 118 656 C 184 638, 242 633, 300 633 C 358 633, 416 638, 482 656 L 482 686 L 118 686 Z\"\nfill=\"url(#frameSheen___UID__)\"/>\n<path d=\"M 118 656 C 184 638, 242 633, 300 633 C 358 633, 416 638, 482 656 L 482 686 L 118 686 Z\"\nfill=\"url(#prismOverlay___UID__)\" opacity=\"__PRISM_OP__\"/>\n<path d=\"M 132 677 L 132 661 C 191 644, 246 639, 300 639 C 354 639, 409 644, 468 661 L 468 677 Z\" fill=\"url(#minionLunetteGrad___UID__)\" stroke=\"__STROKE_DARK__\" stroke-width=\"1.2\"/>\n<path d=\"M 132 677 L 132 661 C 191 644, 246 639, 300 639 C 354 639, 409 644, 468 661 L 468 677 Z\" fill=\"url(#prismOverlay___UID__)\" opacity=\"__PRISM_OP__\"/>\n<g>\n<g transform=\"translate(0, 1.8)\" fill=\"__STROKE_DARK__\" opacity=\"0.50\">\n<path d=\"M 207 646 C 184 651, 160 661, 138 676 L 168 676 C 181 666, 194 656, 209 651 Z\"/>\n<path d=\"M 280 657 C 267 669, 250 676, 230 674 C 213 672, 206 659, 213 649 C 220 640, 239 639, 248 647 C 254 653, 252 663, 244 664 C 238 665, 234 659, 237 655 C 231 657, 232 666, 241 668 C 254 670, 262 657, 257 646 C 251 637, 234 636, 219 642 C 201 649, 190 665, 175 676 L 204 677 C 214 672, 223 678, 241 679 C 259 679, 272 671, 282 662 Z\"/>\n<path d=\"M 279 647 C 271 641, 261 638, 250 639 C 261 644, 269 650, 276 655 Z\"/>\n</g>\n<g fill=\"url(#minionSculptGrad___UID__)\" stroke=\"__STROKE_DARK__\" stroke-width=\"1.15\" stroke-linejoin=\"round\">\n<path d=\"M 207 646 C 184 651, 160 661, 138 676 L 168 676 C 181 666, 194 656, 209 651 Z\"/>\n<path d=\"M 279 647 C 271 641, 261 638, 250 639 C 261 644, 269 650, 276 655 Z\"/>\n<path d=\"M 280 657 C 267 669, 250 676, 230 674 C 213 672, 206 659, 213 649 C 220 640, 239 639, 248 647 C 254 653, 252 663, 244 664 C 238 665, 234 659, 237 655 C 231 657, 232 666, 241 668 C 254 670, 262 657, 257 646 C 251 637, 234 636, 219 642 C 201 649, 190 665, 175 676 L 204 677 C 214 672, 223 678, 241 679 C 259 679, 272 671, 282 662 Z\"/>\n</g>\n<path d=\"M 280 657 C 267 669, 250 676, 230 674 C 213 672, 206 659, 213 649 C 220 640, 239 639, 248 647 C 254 653, 252 663, 244 664 C 238 665, 234 659, 237 655 C 231 657, 232 666, 241 668 C 254 670, 262 657, 257 646 C 251 637, 234 636, 219 642 C 201 649, 190 665, 175 676 L 204 677 C 214 672, 223 678, 241 679 C 259 679, 272 671, 282 662 Z\" fill=\"url(#prismOverlay___UID__)\" opacity=\"__PRISM_OP__\"/>\n<path d=\"M 207 646 C 184 651, 160 661, 138 676 L 168 676 C 181 666, 194 656, 209 651 Z\" fill=\"url(#prismOverlay___UID__)\" opacity=\"__PRISM_OP__\"/>\n<g fill=\"#ffffff\" opacity=\"0.86\">\n<path d=\"M 205 647 C 184 652, 163 662, 145 674 L 154 674 C 169 663, 185 654, 205 649 Z\"/>\n<path d=\"M 278 659 C 265 671, 248 677, 231 675 C 220 674, 214 668, 214 660 C 217 668, 227 672, 240 672 C 256 672, 268 665, 278 657 Z\"/>\n<path d=\"M 215 651 C 221 642, 238 640, 247 647 C 242 643, 225 644, 218 653 Z\"/>\n</g>\n<circle cx=\"241\" cy=\"656\" r=\"2.9\" fill=\"#ffffff\" stroke=\"__STROKE_DARK__\" stroke-width=\"0.85\"/>\n</g>\n<g transform=\"translate(600, 0) scale(-1, 1)\">\n<g transform=\"translate(0, 1.8)\" fill=\"__STROKE_DARK__\" opacity=\"0.50\">\n<path d=\"M 207 646 C 184 651, 160 661, 138 676 L 168 676 C 181 666, 194 656, 209 651 Z\"/>\n<path d=\"M 280 657 C 267 669, 250 676, 230 674 C 213 672, 206 659, 213 649 C 220 640, 239 639, 248 647 C 254 653, 252 663, 244 664 C 238 665, 234 659, 237 655 C 231 657, 232 666, 241 668 C 254 670, 262 657, 257 646 C 251 637, 234 636, 219 642 C 201 649, 190 665, 175 676 L 204 677 C 214 672, 223 678, 241 679 C 259 679, 272 671, 282 662 Z\"/>\n<path d=\"M 279 647 C 271 641, 261 638, 250 639 C 261 644, 269 650, 276 655 Z\"/>\n</g>\n<g fill=\"url(#minionSculptGrad___UID__)\" stroke=\"__STROKE_DARK__\" stroke-width=\"1.15\" stroke-linejoin=\"round\">\n<path d=\"M 207 646 C 184 651, 160 661, 138 676 L 168 676 C 181 666, 194 656, 209 651 Z\"/>\n<path d=\"M 279 647 C 271 641, 261 638, 250 639 C 261 644, 269 650, 276 655 Z\"/>\n<path d=\"M 280 657 C 267 669, 250 676, 230 674 C 213 672, 206 659, 213 649 C 220 640, 239 639, 248 647 C 254 653, 252 663, 244 664 C 238 665, 234 659, 237 655 C 231 657, 232 666, 241 668 C 254 670, 262 657, 257 646 C 251 637, 234 636, 219 642 C 201 649, 190 665, 175 676 L 204 677 C 214 672, 223 678, 241 679 C 259 679, 272 671, 282 662 Z\"/>\n</g>\n<path d=\"M 280 657 C 267 669, 250 676, 230 674 C 213 672, 206 659, 213 649 C 220 640, 239 639, 248 647 C 254 653, 252 663, 244 664 C 238 665, 234 659, 237 655 C 231 657, 232 666, 241 668 C 254 670, 262 657, 257 646 C 251 637, 234 636, 219 642 C 201 649, 190 665, 175 676 L 204 677 C 214 672, 223 678, 241 679 C 259 679, 272 671, 282 662 Z\" fill=\"url(#prismOverlay___UID__)\" opacity=\"__PRISM_OP__\"/>\n<path d=\"M 207 646 C 184 651, 160 661, 138 676 L 168 676 C 181 666, 194 656, 209 651 Z\" fill=\"url(#prismOverlay___UID__)\" opacity=\"__PRISM_OP__\"/>\n<g fill=\"#ffffff\" opacity=\"0.86\">\n<path d=\"M 205 647 C 184 652, 163 662, 145 674 L 154 674 C 169 663, 185 654, 205 649 Z\"/>\n<path d=\"M 278 659 C 265 671, 248 677, 231 675 C 220 674, 214 668, 214 660 C 217 668, 227 672, 240 672 C 256 672, 268 665, 278 657 Z\"/>\n<path d=\"M 215 651 C 221 642, 238 640, 247 647 C 242 643, 225 644, 218 653 Z\"/>\n</g>\n<circle cx=\"241\" cy=\"656\" r=\"2.9\" fill=\"#ffffff\" stroke=\"__STROKE_DARK__\" stroke-width=\"0.85\"/>\n</g>\n<path d=\"M 122 658 C 186 641, 243 636, 300 636 C 357 636, 414 641, 478 658\"\nfill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.1\" opacity=\"0.94\"/>\n<rect x=\"122\" y=\"678\" width=\"356\" height=\"5.5\" fill=\"url(#minionSculptGrad___UID__)\" opacity=\"0.90\"/>\n<line x1=\"122\" y1=\"680\" x2=\"478\" y2=\"680\" stroke=\"#ffffff\" stroke-width=\"1.5\" opacity=\"0.88\"/>\n<polygon points=\"300,632.5 323.0,660 300,687.5 277.0,660\"\nfill=\"__STROKE_DARK__\" stroke=\"__STROKE_DARK__\" stroke-width=\"1.3\" stroke-linejoin=\"round\"/>\n<polygon points=\"300,634.0 321.5,660 300,686.0 278.5,660\"\nfill=\"url(#minionSculptGrad___UID__)\" stroke=\"#ffffff\" stroke-width=\"1.2\" stroke-linejoin=\"round\"/>\n<polygon points=\"300,637.5 318.5,660 300,682.5 281.5,660\"\nfill=\"__STROKE_DARK__\"/>\n<polygon points=\"300,643.0 314.0,660 300,677.0 286.0,660\" fill=\"url(#centerGemGrad___UID__)\"/>\n<polygon points=\"300,643.0 286.0,660 300,659\" fill=\"#ffffff\" opacity=\"0.60\"/>\n<polygon points=\"300,643.0 314.0,660 300,659\" fill=\"#ffffff\" opacity=\"0.26\"/>\n<polygon points=\"300,677.0 286.0,660 300,659\" fill=\"#000000\" opacity=\"0.14\"/>\n<polygon points=\"300,677.0 314.0,660 300,659\" fill=\"#000000\" opacity=\"0.40\"/>\n<polygon points=\"300,652.86 305.88,660 300,667.14 294.12,660\"\nfill=\"#ffffff\" opacity=\"0.24\" stroke=\"#ffffff\" stroke-width=\"0.7\" stroke-opacity=\"0.55\"/>\n<polygon points=\"300,643.0 314.0,660 300,677.0 286.0,660\"\nfill=\"none\" stroke=\"#ffffff\" stroke-width=\"0.9\" opacity=\"0.65\"/>\n</g>"}, "spell": {"artClip": "<path d=\"M 120 158 L 494 158 C 498 168, 507 175, 518 179 L 518 678 L 96 678 L 96 179 C 107 175, 116 168, 120 158 Z\"/>", "outerD": "M 84 84 L 530 84 L 538 92 L 538 700 L 532 706 L 82 706 L 76 700 L 76 92 Z", "body": "<g id=\"card-frame\">\n<path id=\"outer-frame-shape\" d=\"M 84 84 L 530 84 L 538 92 L 538 700 L 532 706 L 82 706 L 76 700 L 76 92 Z\" fill=\"url(#frameGrad___UID__)\" stroke=\"__STROKE_DARK__\" stroke-width=\"3.6\" stroke-linejoin=\"round\"/>\n<path d=\"M 84 84 L 530 84 L 538 92 L 538 700 L 532 706 L 82 706 L 76 700 L 76 92 Z\" fill=\"url(#frameSheen___UID__)\"/>\n<path d=\"M 84 84 L 530 84 L 538 92 L 538 700 L 532 706 L 82 706 L 76 700 L 76 92 Z\" fill=\"url(#prismOverlay___UID__)\" opacity=\"__PRISM_OP__\"/>\n<path d=\"M 87 89 L 527 89 L 533 95 L 533 696 L 528 701 L 86 701 L 81 696 L 81 95 Z\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"1.8\" opacity=\"0.78\" stroke-linejoin=\"round\"/>\n<polygon points=\"136,84 530,84 525,90 136,90\" fill=\"#ffffff\" opacity=\"0.48\"/>\n<polygon points=\"136,96 516,96 512,101 136,101\" fill=\"__STROKE_DARK__\" opacity=\"0.34\"/>\n<line x1=\"142\" y1=\"88.5\" x2=\"522\" y2=\"88.5\" stroke=\"#ffffff\" stroke-width=\"1.3\" opacity=\"0.84\"/>\n<polygon points=\"76,176 81,176 81,696 76,700\" fill=\"#ffffff\" opacity=\"0.40\"/>\n<rect x=\"84.5\" y=\"176\" width=\"3.0\" height=\"512\" fill=\"__STROKE_DARK__\" opacity=\"0.62\"/>\n<line x1=\"88.2\" y1=\"176\" x2=\"88.2\" y2=\"688\" stroke=\"#ffffff\" stroke-width=\"1.25\" opacity=\"0.84\"/>\n<line x1=\"92.8\" y1=\"180\" x2=\"92.8\" y2=\"682\" stroke=\"__STROKE_DARK__\" stroke-width=\"1.3\" opacity=\"0.55\"/>\n<polygon points=\"538,92 533,95 533,696 538,700\" fill=\"__STROKE_DARK__\" opacity=\"0.32\"/>\n<polygon points=\"533,95 529.5,98 529.5,692 533,696\" fill=\"#ffffff\" opacity=\"0.42\"/>\n<rect x=\"526.5\" y=\"168\" width=\"3.0\" height=\"520\" fill=\"__STROKE_DARK__\" opacity=\"0.62\"/>\n<line x1=\"525.8\" y1=\"168\" x2=\"525.8\" y2=\"688\" stroke=\"#ffffff\" stroke-width=\"1.25\" opacity=\"0.84\"/>\n<line x1=\"521.2\" y1=\"180\" x2=\"521.2\" y2=\"682\" stroke=\"__STROKE_DARK__\" stroke-width=\"1.3\" opacity=\"0.55\"/>\n<polygon points=\"82,706 532,706 527,700 87,700\" fill=\"__STROKE_DARK__\" opacity=\"0.42\"/>\n<line x1=\"90\" y1=\"699.5\" x2=\"524\" y2=\"699.5\" stroke=\"#ffffff\" stroke-width=\"1.25\" opacity=\"0.80\"/>\n<g id=\"corner-clasps\" opacity=\"0.80\">\n<path d=\"M 502 84 L 530 84 L 538 92 L 538 122 L 531 117 L 531 96 L 525 90 L 507 90 Z\"\nfill=\"url(#frameGrad___UID__)\" stroke=\"__STROKE_DARK__\" stroke-width=\"1.3\" stroke-linejoin=\"round\"/>\n<path d=\"M 506 86 L 529 86 L 535.5 92.5 L 531 95.5 L 525 89.5 L 509 89.5 Z\"\nfill=\"#ffffff\" opacity=\"0.72\"/>\n<path d=\"M 507 101 C 515 101, 523 108, 525 117 L 533 117 L 533 96 L 525 89 L 507 89 Z\"\nfill=\"url(#frameGrad___UID__)\" stroke=\"__STROKE_DARK__\" stroke-width=\"1.25\" stroke-linejoin=\"round\"/>\n<path d=\"M 510 91.5 L 524 91.5 L 530.5 98 L 525 105 C 521 100.5, 515.5 98, 510 98 Z\"\nfill=\"#ffffff\" opacity=\"0.58\"/>\n<line x1=\"520\" y1=\"104\" x2=\"531\" y2=\"93\" stroke=\"__STROKE_DARK__\" stroke-width=\"1.25\" opacity=\"0.75\"/>\n<line x1=\"521.5\" y1=\"105\" x2=\"532.5\" y2=\"94\" stroke=\"#ffffff\" stroke-width=\"0.9\" opacity=\"0.84\"/>\n<path d=\"M 76 680 L 84 688 L 84 698 L 94 698 L 102 706 L 82 706 L 76 700 Z\"\nfill=\"url(#frameGrad___UID__)\" stroke=\"__STROKE_DARK__\" stroke-width=\"1.15\" stroke-linejoin=\"round\"/>\n<path d=\"M 78 684 L 82.5 688.5 L 82.5 698 L 78 698 Z\" fill=\"#ffffff\" opacity=\"0.62\"/>\n<line x1=\"78\" y1=\"699\" x2=\"88\" y2=\"689\" stroke=\"__STROKE_DARK__\" stroke-width=\"1.15\" opacity=\"0.70\"/>\n<path d=\"M 538 680 L 530 688 L 530 698 L 520 698 L 512 706 L 532 706 L 538 700 Z\"\nfill=\"url(#frameGrad___UID__)\" stroke=\"__STROKE_DARK__\" stroke-width=\"1.15\" stroke-linejoin=\"round\"/>\n<path d=\"M 536 684 L 531.5 688.5 L 531.5 698 L 536 698 Z\" fill=\"#ffffff\" opacity=\"0.46\"/>\n<line x1=\"536\" y1=\"699\" x2=\"526\" y2=\"689\" stroke=\"__STROKE_DARK__\" stroke-width=\"1.15\" opacity=\"0.70\"/>\n</g>\n</g>\n<g id=\"artwork-section\">\n<path d=\"M 120 158 L 494 158 C 498 168, 507 175, 518 179 L 518 678 L 96 678 L 96 179 C 107 175, 116 168, 120 158 Z\" fill=\"#130f20\" stroke=\"__STROKE_DARK__\" stroke-width=\"3.6\"/>\n<g clip-path=\"url(#artClip___UID__)\">\n<image id=\"card-art\" href=\"__ART_URI__\" x=\"80\" y=\"156\" width=\"440\" height=\"568\"\npreserveAspectRatio=\"xMidYMid slice\"/></g>\n<path d=\"M 120 158 L 494 158 C 498 168, 507 175, 518 179 L 518 678 L 96 678 L 96 179 C 107 175, 116 168, 120 158 Z\" fill=\"none\" stroke=\"__STROKE_DARK__\" stroke-width=\"3.4\"/>\n<path d=\"M 120 158 L 494 158 C 498 168, 507 175, 518 179 L 518 678 L 96 678 L 96 179 C 107 175, 116 168, 120 158 Z\" fill=\"none\" stroke=\"__TRIM_LIGHT__\" stroke-width=\"1.5\" opacity=\"0.92\"/>\n<path d=\"M 120 158 L 494 158 C 498 168, 507 175, 518 179 L 518 678 L 96 678 L 96 179 C 107 175, 116 168, 120 158 Z\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"0.7\" opacity=\"0.55\"/>\n<path d=\"M 94 156 L 122 156 C 117 167, 108 175, 94 180 Z\"\nfill=\"url(#frameGrad___UID__)\" stroke=\"__STROKE_DARK__\" stroke-width=\"1.45\" stroke-linejoin=\"round\"/>\n<path d=\"M 97 158 L 117 158 C 113 166, 106 172, 97 176 Z\"\nfill=\"#ffffff\" opacity=\"0.36\"/>\n<path d=\"M 116 159.5 C 112 167, 105 173, 97 176.5\"\nfill=\"none\" stroke=\"#ffffff\" stroke-width=\"1.35\" stroke-linecap=\"round\" opacity=\"0.86\"/>\n<path d=\"M 520 156 L 492 156 C 497 167, 506 175, 520 180 Z\"\nfill=\"url(#frameGrad___UID__)\" stroke=\"__STROKE_DARK__\" stroke-width=\"1.45\" stroke-linejoin=\"round\"/>\n<path d=\"M 517 158 L 497 158 C 501 166, 508 172, 517 176 Z\"\nfill=\"#b3c2d4\" opacity=\"0.36\"/>\n<path d=\"M 498 159.5 C 502 167, 509 173, 517 176.5\"\nfill=\"none\" stroke=\"#ffffff\" stroke-width=\"1.35\" stroke-linecap=\"round\" opacity=\"0.86\"/>\n</g>\n<g id=\"nameplate-section\">\n<path d=\"M 136 99 L 508 99 C 512 108, 519 113, 528 115 L 528 144 C 521 146, 516 151, 513 158 L 136 158 Z\" fill=\"url(#frameGrad___UID__)\" stroke=\"__STROKE_DARK__\" stroke-width=\"2.0\" stroke-linejoin=\"round\"/>\n<path d=\"M 136 99 L 508 99 C 512 108, 519 113, 528 115 L 528 144 C 521 146, 516 151, 513 158 L 136 158 Z\" fill=\"url(#frameSheen___UID__)\"/>\n<path d=\"M 136 99 L 508 99 C 512 108, 519 113, 528 115 L 528 144 C 521 146, 516 151, 513 158 L 136 158 Z\" fill=\"url(#prismOverlay___UID__)\" opacity=\"__PRISM_OP__\"/>\n<line x1=\"142\" y1=\"101.5\" x2=\"505\" y2=\"101.5\" stroke=\"#ffffff\" stroke-width=\"1.2\" opacity=\"0.84\"/>\n<line x1=\"142\" y1=\"155\" x2=\"510\" y2=\"155\" stroke=\"#ffffff\" stroke-width=\"1.3\" opacity=\"0.86\"/>\n<path d=\"M 140 104 L 505 104 C 509 111, 515 116, 522 118 L 522 141 C 516 143, 512 147, 510 151 L 140 151 Z\" fill=\"url(#nameBgGrad___UID__)\" stroke=\"#ffffff\" stroke-width=\"1.3\" stroke-linejoin=\"round\"/>\n<path d=\"M 142 105.5 L 503 105.5 L 505 109 L 142 109 Z\" fill=\"#ffffff\" opacity=\"0.16\"/>\n<path d=\"M 142 146 L 509 146 L 507 150 L 142 150 Z\" fill=\"#090414\" opacity=\"0.34\"/>\n<g id=\"spell-drop-finial\">\n<path d=\"M 225 157 C 241 165, 255 167, 269 162\nC 277 166, 289 169, 307 181\nC 325 169, 337 166, 345 162\nC 359 167, 373 165, 389 157 Z\"\nfill=\"url(#frameGrad___UID__)\" stroke=\"__STROKE_DARK__\" stroke-width=\"1.5\" stroke-linejoin=\"round\"/>\n<path d=\"M 225 157 C 241 165, 255 167, 269 162\nC 277 166, 289 169, 307 181\nC 325 169, 337 166, 345 162\nC 359 167, 373 165, 389 157 Z\"\nfill=\"url(#prismOverlay___UID__)\" opacity=\"__PRISM_OP__\"/>\n<path d=\"M 235 158 C 249 163.5, 259 163, 270 159.5\nC 261 160.5, 249 161, 235 158 Z\"\nfill=\"#ffffff\" opacity=\"0.80\"/>\n<path d=\"M 379 158 C 365 163.5, 355 163, 344 159.5\nC 353 160.5, 365 161, 379 158 Z\"\nfill=\"#ffffff\" opacity=\"0.64\"/>\n<path d=\"M 271 158 C 277 163.5, 287 165.5, 294 161 L 290 158 Z\"\nfill=\"__STROKE_DARK__\" opacity=\"0.34\"/>\n<path d=\"M 343 158 C 337 163.5, 327 165.5, 320 161 L 324 158 Z\"\nfill=\"__STROKE_DARK__\" opacity=\"0.34\"/>\n<polygon points=\"307,157 290,165 307,178\" fill=\"#ffffff\" opacity=\"0.82\"/>\n<polygon points=\"307,157 324,165 307,178\" fill=\"#b3c2d4\" opacity=\"0.58\"/>\n<polygon points=\"307,160 316,166 307,173 298,166\"\nfill=\"url(#frameGrad___UID__)\" stroke=\"__STROKE_DARK__\" stroke-width=\"0.9\"/>\n<polygon points=\"307,161.5 301.5,166 307,170.5\" fill=\"#ffffff\" opacity=\"0.72\"/>\n<path d=\"M 283 166 L 307 181 L 331 166\"\nfill=\"none\" stroke=\"__STROKE_DARK__\" stroke-width=\"1.1\" stroke-linejoin=\"round\" opacity=\"0.85\"/>\n</g>\n<text id=\"card-name\" x=\"307\" y=\"138\" text-anchor=\"middle\"\nfont-family=\"'Source Han Serif SC', 'Noto Serif SC', 'STSong', 'SimSun', 'Microsoft YaHei', serif\"\nfont-weight=\"700\" font-size=\"__NAME_FS__\" letter-spacing=\"1.6\"\nfill=\"#fbf7ee\" stroke=\"#120a14\" stroke-width=\"3.0\" paint-order=\"stroke\">__CARD_NAME__</text>\n</g>\n<g id=\"bottom-gem-section\">\n<rect x=\"94\" y=\"681\" width=\"426\" height=\"17\" fill=\"__STROKE_DARK__\" opacity=\"0.32\"/>\n<line x1=\"94\" y1=\"680.5\" x2=\"520\" y2=\"680.5\" stroke=\"#ffffff\" stroke-width=\"1.2\" opacity=\"0.78\"/>\n<line x1=\"94\" y1=\"698.5\" x2=\"520\" y2=\"698.5\" stroke=\"#ffffff\" stroke-width=\"1.1\" opacity=\"0.65\"/>\n<g id=\"bottom-rail-filigree\" opacity=\"0.78\">\n<path d=\"M 281 684 C 259 681, 235 683, 211 688\nC 189 693, 167 695, 142 692\nC 169 698, 197 698, 223 694\nC 245 691, 263 694, 281 696 Z\"\nfill=\"url(#frameGrad___UID__)\" stroke=\"__STROKE_DARK__\" stroke-width=\"1.1\" stroke-linejoin=\"round\"/>\n<path d=\"M 277 685.5 C 251 683.5, 227 686, 199 690.5\nC 225 689, 251 688, 277 689 Z\"\nfill=\"#ffffff\" opacity=\"0.74\"/>\n<path d=\"M 275 692 C 265 684, 253 684, 245 690\nC 253 695, 265 695, 275 687\"\nfill=\"none\" stroke=\"#ffffff\" stroke-width=\"1.2\" stroke-linecap=\"round\" opacity=\"0.76\"/>\n<path d=\"M 275 692 C 265 684, 253 684, 245 690\"\nfill=\"none\" stroke=\"__STROKE_DARK__\" stroke-width=\"0.8\" opacity=\"0.48\"/>\n<path d=\"M 333 684 C 355 681, 379 683, 403 688\nC 425 693, 447 695, 472 692\nC 445 698, 417 698, 391 694\nC 369 691, 351 694, 333 696 Z\"\nfill=\"url(#frameGrad___UID__)\" stroke=\"__STROKE_DARK__\" stroke-width=\"1.1\" stroke-linejoin=\"round\"/>\n<path d=\"M 337 685.5 C 363 683.5, 387 686, 415 690.5\nC 389 689, 363 688, 337 689 Z\"\nfill=\"#ffffff\" opacity=\"0.66\"/>\n<path d=\"M 339 692 C 349 684, 361 684, 369 690\nC 361 695, 349 695, 339 687\"\nfill=\"none\" stroke=\"#ffffff\" stroke-width=\"1.2\" stroke-linecap=\"round\" opacity=\"0.72\"/>\n<path d=\"M 339 692 C 349 684, 361 684, 369 690\"\nfill=\"none\" stroke=\"__STROKE_DARK__\" stroke-width=\"0.8\" opacity=\"0.48\"/>\n</g>\n<polygon points=\"307,652 333,682 307,706 281,682\"\nfill=\"url(#frameGrad___UID__)\" stroke=\"__STROKE_DARK__\" stroke-width=\"2.0\" stroke-linejoin=\"round\"/>\n<polygon points=\"307,652 333,682 307,706 281,682\"\nfill=\"url(#frameSheen___UID__)\"/>\n<polygon points=\"307,652 333,682 307,706 281,682\"\nfill=\"url(#prismOverlay___UID__)\" opacity=\"__PRISM_OP__\"/>\n<polygon points=\"307,652 281,682 289,682 307,661\" fill=\"#ffffff\" opacity=\"0.74\"/>\n<polygon points=\"307,652 333,682 325,682 307,661\" fill=\"#ffffff\" opacity=\"0.34\"/>\n<polygon points=\"307,706 281,682 289,682 307,699\" fill=\"__STROKE_DARK__\" opacity=\"0.28\"/>\n<polygon points=\"307,706 333,682 325,682 307,699\" fill=\"__STROKE_DARK__\" opacity=\"0.48\"/>\n<polygon points=\"307,656 329,682 307,702 285,682\"\nfill=\"none\" stroke=\"#ffffff\" stroke-width=\"1.1\" opacity=\"0.84\" stroke-linejoin=\"round\"/>\n<polygon points=\"307,662 324,682 307,702 290,682\"\nfill=\"__STROKE_DARK__\" opacity=\"0.92\"/>\n<polygon points=\"307,664 322,682 307,700 292,682\"\nfill=\"__STROKE_DARK__\" stroke=\"#ffffff\" stroke-width=\"1.8\" stroke-linejoin=\"round\"/>\n<polygon points=\"307,669 318,682 307,695 296,682\" fill=\"url(#centerGemGrad___UID__)\"/>\n<polygon points=\"307,669 296,682 307,681\" fill=\"#ffffff\" opacity=\"0.56\"/>\n<polygon points=\"307,669 318,682 307,681\" fill=\"#ffffff\" opacity=\"0.22\"/>\n<polygon points=\"307,695 296,682 307,681\" fill=\"#000000\" opacity=\"0.18\"/>\n<polygon points=\"307,695 318,682 307,681\" fill=\"#000000\" opacity=\"0.38\"/>\n<polygon points=\"307,673 314,682 307,691 300,682\"\nfill=\"none\" stroke=\"#ffffff\" stroke-width=\"0.9\" opacity=\"0.62\"/>\n<circle cx=\"304\" cy=\"677\" r=\"1.8\" fill=\"#ffffff\" opacity=\"0.82\"/>\n</g>"}, "amulet": {"artClip": "<path d=\"M 186 172 L 423 172 L 423 193 L 445 193 L 445 211 L 505 211 L 505 566 C 482 588, 442 626, 399 655 L 210 655 C 167 626, 127 588, 104 566 L 104 211 L 164 211 L 164 193 L 186 193 Z\"/>", "outerD": "M 75 93 Q 75 85 83 85 L 146 85 C 198 79, 242 66, 274 52 C 284 46, 290 40, 295 38 L 314 38 C 319 40, 325 46, 335 52 C 367 66, 411 79, 463 85 L 526 85 Q 534 85 534 93 L 534 694 Q 534 700 528 700 L 81 700 Q 75 700 75 694 Z", "body": "<g id=\"card-frame\">\n<path id=\"outer-frame-shape\" d=\"M 75 93 Q 75 85 83 85 L 146 85 C 198 79, 242 66, 274 52 C 284 46, 290 40, 295 38 L 314 38 C 319 40, 325 46, 335 52 C 367 66, 411 79, 463 85 L 526 85 Q 534 85 534 93 L 534 694 Q 534 700 528 700 L 81 700 Q 75 700 75 694 Z\" fill=\"url(#frameGrad___UID__)\" stroke=\"__STROKE_DARK__\" stroke-width=\"3.6\" stroke-linejoin=\"round\"/>\n<path d=\"M 75 93 Q 75 85 83 85 L 146 85 C 198 79, 242 66, 274 52 C 284 46, 290 40, 295 38 L 314 38 C 319 40, 325 46, 335 52 C 367 66, 411 79, 463 85 L 526 85 Q 534 85 534 93 L 534 694 Q 534 700 528 700 L 81 700 Q 75 700 75 694 Z\" fill=\"url(#frameSheen___UID__)\"/>\n<path d=\"M 75 93 Q 75 85 83 85 L 146 85 C 198 79, 242 66, 274 52 C 284 46, 290 40, 295 38 L 314 38 C 319 40, 325 46, 335 52 C 367 66, 411 79, 463 85 L 526 85 Q 534 85 534 93 L 534 694 Q 534 700 528 700 L 81 700 Q 75 700 75 694 Z\" fill=\"url(#prismOverlay___UID__)\" opacity=\"__PRISM_OP__\"/>\n<path d=\"M 80 96 Q 80 90 86 90 L 148 90 C 200 84, 244 71, 277 56 C 287 50, 293 45, 297 43 L 312 43 C 316 45, 322 50, 332 56 C 365 71, 409 84, 461 90 L 523 90 Q 529 90 529 96 L 529 691 Q 529 695 525 695 L 84 695 Q 80 695 80 691 Z\" fill=\"none\" stroke=\"__TRIM_LIGHT__\" stroke-width=\"1.8\" opacity=\"0.78\" stroke-linejoin=\"round\"/>\n<rect x=\"78\" y=\"160\" width=\"14\" height=\"534\" fill=\"url(#frameGrad___UID__)\" opacity=\"0.88\"/>\n<rect x=\"517\" y=\"160\" width=\"14\" height=\"534\" fill=\"url(#frameGrad___UID__)\" opacity=\"0.88\"/>\n<line x1=\"81\" y1=\"164\" x2=\"81\" y2=\"690\" stroke=\"__TRIM_LIGHT__\" stroke-width=\"1.3\" opacity=\"0.78\"/>\n<line x1=\"89\" y1=\"164\" x2=\"89\" y2=\"690\" stroke=\"__STROKE_DARK__\" stroke-width=\"2.2\" opacity=\"0.76\"/>\n<line x1=\"93\" y1=\"162\" x2=\"93\" y2=\"690\" stroke=\"__TRIM_LIGHT__\" stroke-width=\"1.2\" opacity=\"0.72\"/>\n<line x1=\"528\" y1=\"164\" x2=\"528\" y2=\"690\" stroke=\"__TRIM_LIGHT__\" stroke-width=\"1.3\" opacity=\"0.78\"/>\n<line x1=\"520\" y1=\"164\" x2=\"520\" y2=\"690\" stroke=\"__STROKE_DARK__\" stroke-width=\"2.2\" opacity=\"0.76\"/>\n<line x1=\"516\" y1=\"162\" x2=\"516\" y2=\"690\" stroke=\"__TRIM_LIGHT__\" stroke-width=\"1.2\" opacity=\"0.72\"/>\n<path d=\"M 510 88 L 526 88 L 526 105 L 520 105 L 520 94 L 510 94 Z\"\nfill=\"__STROKE_DARK__\" opacity=\"0.62\"/>\n<g id=\"top-crown-ornament\">\n<path d=\"M 152 95 C 204 88, 250 72, 304.5 46 C 359 72, 405 88, 457 95 Z\"\nfill=\"url(#amuletRecessGrad___UID__)\"/>\n<path d=\"M 295 39 L 314 39 C 321 44, 329 51, 342 57 C 324 59, 314 55, 304.5 48\nC 295 55, 285 59, 267 57 C 280 51, 288 44, 295 39 Z\"\nfill=\"url(#amuletCrownLight___UID__)\" stroke=\"__STROKE_DARK__\" stroke-width=\"1.15\" stroke-linejoin=\"round\"/>\n<path d=\"M 148 94 C 194 86, 236 74, 274 56 C 284 56, 295 52, 304.5 46\nC 288 60, 268 68, 236 78 C 208 86, 178 92, 148 94 Z\"\nfill=\"url(#amuletCrownLight___UID__)\" stroke=\"__STROKE_DARK__\" stroke-width=\"1.1\" stroke-linejoin=\"round\"/>\n<path d=\"M 461 94 C 415 86, 373 74, 335 56 C 325 56, 314 52, 304.5 46\nC 321 60, 341 68, 373 78 C 401 86, 431 92, 461 94 Z\"\nfill=\"url(#amuletCrownLight___UID__)\" stroke=\"__STROKE_DARK__\" stroke-width=\"1.1\" stroke-linejoin=\"round\"/>\n<path d=\"M 304.5 52 L 321 66 L 304.5 79 L 288 66 Z\"\nfill=\"__STROKE_DARK__\" stroke=\"__STROKE_DARK__\" stroke-width=\"1.1\" stroke-linejoin=\"round\"/>\n<path d=\"M 304.5 56 L 316 66 L 304.5 76 L 293 66 Z\"\nfill=\"url(#amuletCrownLight___UID__)\"/>\n<polygon points=\"304.5,56 293,66 304.5,66\" fill=\"__TRIM_LIGHT__\" opacity=\"0.90\"/>\n<polygon points=\"304.5,56 316,66 304.5,66\" fill=\"__TRIM_MID__\" opacity=\"0.65\"/>\n<path d=\"M 224 94 C 238 76, 266 70, 287 86 L 278 95 Z\" fill=\"__STROKE_DARK__\" opacity=\"0.68\"/>\n<path d=\"M 385 94 C 371 76, 343 70, 322 86 L 331 95 Z\" fill=\"__STROKE_DARK__\" opacity=\"0.68\"/>\n<path d=\"M 232 94 C 246 82, 262 79, 279 88 C 269 91, 256 93, 232 94 Z\"\nfill=\"url(#amuletCrownLight___UID__)\" stroke=\"__STROKE_DARK__\" stroke-width=\"1.0\"/>\n<path d=\"M 377 94 C 363 82, 347 79, 330 88 C 340 91, 353 93, 377 94 Z\"\nfill=\"url(#amuletCrownLight___UID__)\" stroke=\"__STROKE_DARK__\" stroke-width=\"1.0\"/>\n<path d=\"M 164 95 C 204 84, 240 66, 274 66 C 292 66, 304 75, 319 95 L 305 95\nC 295 81, 285 74, 272 74 C 246 74, 214 88, 184 95 Z\"\nfill=\"url(#amuletCrownLight___UID__)\" stroke=\"__STROKE_DARK__\" stroke-width=\"1.15\" stroke-linejoin=\"round\"/>\n<path d=\"M 445 95 C 405 84, 369 66, 335 66 C 317 66, 305 75, 290 95 L 304 95\nC 314 81, 324 74, 337 74 C 363 74, 395 88, 425 95 Z\"\nfill=\"url(#amuletCrownLight___UID__)\" stroke=\"__STROKE_DARK__\" stroke-width=\"1.15\" stroke-linejoin=\"round\"/>\n<path d=\"M 192 91 C 224 81, 250 69, 274 69 C 287 69, 297 75, 306 86\"\nfill=\"none\" stroke=\"__TRIM_LIGHT__\" stroke-width=\"1.4\" stroke-linecap=\"round\" opacity=\"0.88\"/>\n<path d=\"M 417 91 C 385 81, 359 69, 335 69 C 322 69, 312 75, 303 86\"\nfill=\"none\" stroke=\"__TRIM_LIGHT__\" stroke-width=\"1.4\" stroke-linecap=\"round\" opacity=\"0.88\"/>\n<path d=\"M 304.5 81 L 323 95 L 286 95 Z\"\nfill=\"url(#amuletCrownLight___UID__)\" stroke=\"__STROKE_DARK__\" stroke-width=\"1.15\" stroke-linejoin=\"round\"/>\n<polygon points=\"304.5,84 316,94 293,94\" fill=\"__TRIM_LIGHT__\" opacity=\"0.72\"/>\n</g>\n</g>\n<g id=\"artwork-section\">\n<rect x=\"95\" y=\"160\" width=\"419\" height=\"508\" fill=\"url(#amuletEnamelGrad___UID__)\"\nstroke=\"__STROKE_DARK__\" stroke-width=\"2.2\"/>\n<rect x=\"95\" y=\"160\" width=\"419\" height=\"508\" fill=\"url(#amuletEnamelVignette___UID__)\"/>\n<rect x=\"97.5\" y=\"162.5\" width=\"414\" height=\"503\" fill=\"none\"\nstroke=\"__TRIM_MID__\" stroke-width=\"1.0\" opacity=\"0.45\"/>\n<path d=\"M 458 160 L 514 160 L 514 195 C 503 184, 490 177, 474 175 C 469 169, 464 164, 458 160 Z\"\nfill=\"url(#amuletCrownLight___UID__)\" stroke=\"__STROKE_DARK__\" stroke-width=\"1.35\" stroke-linejoin=\"round\"/>\n<path d=\"M 476 162 L 512 162 L 512 184 C 503 175, 491 170, 476 168 Z\"\nfill=\"__STROKE_DARK__\" opacity=\"0.28\"/>\n<path d=\"M 465 162 L 511 162 L 511 176 C 502 169, 490 165, 465 162 Z\"\nfill=\"__TRIM_LIGHT__\" opacity=\"0.52\"/>\n<g clip-path=\"url(#artClip___UID__)\">\n<image id=\"card-art\" href=\"__ART_URI__\" x=\"80\" y=\"156\" width=\"440\" height=\"568\"\npreserveAspectRatio=\"xMidYMid slice\"/></g>\n<path d=\"M 186 172 L 423 172 L 423 193 L 445 193 L 445 211 L 505 211 L 505 566 C 482 588, 442 626, 399 655 L 210 655 C 167 626, 127 588, 104 566 L 104 211 L 164 211 L 164 193 L 186 193 Z\" fill=\"none\" stroke=\"#0c0608\" stroke-width=\"5.2\" stroke-linejoin=\"miter\"/>\n<path d=\"M 186 172 L 423 172 L 423 193 L 445 193 L 445 211 L 505 211 L 505 566 C 482 588, 442 626, 399 655 L 210 655 C 167 626, 127 588, 104 566 L 104 211 L 164 211 L 164 193 L 186 193 Z\" fill=\"none\" stroke=\"__TRIM_MID__\" stroke-width=\"1.5\" stroke-linejoin=\"miter\"/>\n<g id=\"amulet-top-rosette\">\n<path d=\"M 260.5 171 C 266.5 200, 342.5 200, 348.5 171 Z\"\nfill=\"#14090b\" stroke=\"__TRIM_MID__\" stroke-width=\"1.45\" stroke-linejoin=\"round\"/>\n<path d=\"M 265.5 171 C 271.5 195, 337.5 195, 343.5 171\"\nfill=\"none\" stroke=\"__TRIM_LIGHT__\" stroke-width=\"0.85\" opacity=\"0.72\"/>\n<path d=\"M 281.5 171 C 285.5 184, 323.5 184, 327.5 171\"\nfill=\"none\" stroke=\"__TRIM_MID__\" stroke-width=\"0.95\" opacity=\"0.9\"/>\n<line x1=\"317.7\" y1=\"173.6\" x2=\"341.1\" y2=\"178.0\" stroke=\"__TRIM_MID__\" stroke-width=\"0.85\" opacity=\"0.88\"/>\n<line x1=\"315.5\" y1=\"175.6\" x2=\"335.2\" y2=\"183.6\" stroke=\"__TRIM_MID__\" stroke-width=\"0.85\" opacity=\"0.88\"/>\n<line x1=\"312.3\" y1=\"177.2\" x2=\"326.3\" y2=\"188.0\" stroke=\"__TRIM_MID__\" stroke-width=\"0.85\" opacity=\"0.88\"/>\n<line x1=\"308.4\" y1=\"178.2\" x2=\"315.2\" y2=\"190.7\" stroke=\"__TRIM_MID__\" stroke-width=\"0.85\" opacity=\"0.88\"/>\n<line x1=\"304.5\" y1=\"178.5\" x2=\"304.5\" y2=\"191.5\" stroke=\"__TRIM_MID__\" stroke-width=\"0.85\" opacity=\"0.88\"/>\n<line x1=\"300.6\" y1=\"178.2\" x2=\"293.8\" y2=\"190.7\" stroke=\"__TRIM_MID__\" stroke-width=\"0.85\" opacity=\"0.88\"/>\n<line x1=\"296.7\" y1=\"177.2\" x2=\"282.7\" y2=\"188.0\" stroke=\"__TRIM_MID__\" stroke-width=\"0.85\" opacity=\"0.88\"/>\n<line x1=\"293.5\" y1=\"175.6\" x2=\"273.8\" y2=\"183.6\" stroke=\"__TRIM_MID__\" stroke-width=\"0.85\" opacity=\"0.88\"/>\n<line x1=\"291.3\" y1=\"173.6\" x2=\"267.9\" y2=\"178.0\" stroke=\"__TRIM_MID__\" stroke-width=\"0.85\" opacity=\"0.88\"/>\n<circle cx=\"331.2\" cy=\"178.8\" r=\"3.0\" fill=\"none\" stroke=\"__TRIM_MID__\" stroke-width=\"0.85\" opacity=\"0.86\"/>\n<circle cx=\"325.3\" cy=\"182.7\" r=\"3.0\" fill=\"none\" stroke=\"__TRIM_MID__\" stroke-width=\"0.85\" opacity=\"0.86\"/>\n<circle cx=\"317.4\" cy=\"185.5\" r=\"3.0\" fill=\"none\" stroke=\"__TRIM_MID__\" stroke-width=\"0.85\" opacity=\"0.86\"/>\n<circle cx=\"308.7\" cy=\"186.8\" r=\"3.0\" fill=\"none\" stroke=\"__TRIM_MID__\" stroke-width=\"0.85\" opacity=\"0.86\"/>\n<circle cx=\"300.3\" cy=\"186.8\" r=\"3.0\" fill=\"none\" stroke=\"__TRIM_MID__\" stroke-width=\"0.85\" opacity=\"0.86\"/>\n<circle cx=\"291.6\" cy=\"185.5\" r=\"3.0\" fill=\"none\" stroke=\"__TRIM_MID__\" stroke-width=\"0.85\" opacity=\"0.86\"/>\n<circle cx=\"283.7\" cy=\"182.7\" r=\"3.0\" fill=\"none\" stroke=\"__TRIM_MID__\" stroke-width=\"0.85\" opacity=\"0.86\"/>\n<circle cx=\"277.8\" cy=\"178.8\" r=\"3.0\" fill=\"none\" stroke=\"__TRIM_MID__\" stroke-width=\"0.85\" opacity=\"0.86\"/>\n<path d=\"M 289.5 171 C 293.5 180, 315.5 180, 319.5 171 Z\"\nfill=\"#0d0608\" stroke=\"__TRIM_MID__\" stroke-width=\"0.95\"/>\n<circle cx=\"304.5\" cy=\"175\" r=\"2.8\" fill=\"__TRIM_LIGHT__\" stroke=\"__STROKE_DARK__\" stroke-width=\"0.6\"/>\n<path d=\"M 238.5 171 C 252.5 169, 264.5 162, 283.5 164 L 293.5 169 L 260.5 171 Z\"\nfill=\"#14090b\" stroke=\"__TRIM_MID__\" stroke-width=\"0.95\" stroke-linejoin=\"round\"/>\n<path d=\"M 370.5 171 C 356.5 169, 344.5 162, 325.5 164 L 315.5 169 L 348.5 171 Z\"\nfill=\"#14090b\" stroke=\"__TRIM_MID__\" stroke-width=\"0.95\" stroke-linejoin=\"round\"/>\n<path d=\"M 293.5 170 C 295.5 162, 299.5 160, 304.5 159 C 309.5 160, 313.5 162, 315.5 170 Z\"\nfill=\"#14090b\" stroke=\"__TRIM_MID__\" stroke-width=\"0.95\"/>\n<path d=\"M 304.5 169 L 297.0 164 M 304.5 169 L 300.7 161 M 304.5 169 L 304.5 160 M 304.5 169 L 308.3 161 M 304.5 169 L 312.0 164\"\nstroke=\"__TRIM_LIGHT__\" stroke-width=\"1.05\" stroke-linecap=\"round\"/>\n</g>\n<g id=\"amulet-greek-key-corners\">\n<g>\n<path d=\"M 186 172 L 164 172 L 164 193 C 176 192, 184 184, 186 172 Z\"\nfill=\"#14090b\" stroke=\"__TRIM_MID__\" stroke-width=\"1.05\"/>\n<path d=\"M 165 173 L 184 175 M 165 173 L 181 181 M 165 173 L 176 187 M 165 173 L 170 191\"\nstroke=\"__TRIM_MID__\" stroke-width=\"0.9\" opacity=\"0.88\"/>\n<path d=\"M 165 183 C 171 183, 175 179, 175 173\" fill=\"none\" stroke=\"__TRIM_LIGHT__\" stroke-width=\"0.8\" opacity=\"0.78\"/>\n<path d=\"M 186 172 L 164 172 L 164 193 L 136 193 L 136 211 L 104 211\"\nfill=\"none\" stroke=\"#0c0608\" stroke-width=\"5.8\" stroke-linejoin=\"miter\"/>\n<path d=\"M 186 172 L 164 172 L 164 193 L 136 193 L 136 211 L 104 211\"\nfill=\"none\" stroke=\"__TRIM_MID__\" stroke-width=\"1.35\" stroke-linejoin=\"miter\"/>\n<rect x=\"116\" y=\"191\" width=\"48\" height=\"27\" fill=\"none\" stroke=\"#0c0608\" stroke-width=\"5.0\"/>\n<rect x=\"116\" y=\"191\" width=\"48\" height=\"27\" fill=\"none\" stroke=\"__TRIM_MID__\" stroke-width=\"1.15\"/>\n<path d=\"M 104 200 L 128 200 L 128 218\" fill=\"none\" stroke=\"#0c0608\" stroke-width=\"4.2\"/>\n<path d=\"M 104 200 L 128 200 L 128 218\" fill=\"none\" stroke=\"__TRIM_MID__\" stroke-width=\"1.0\"/>\n<line x1=\"150\" y1=\"191\" x2=\"150\" y2=\"218\" stroke=\"#0c0608\" stroke-width=\"4.0\"/>\n<line x1=\"150\" y1=\"191\" x2=\"150\" y2=\"218\" stroke=\"__TRIM_MID__\" stroke-width=\"1.0\"/>\n</g>\n<g transform=\"translate(609, 0) scale(-1, 1)\">\n<path d=\"M 186 172 L 164 172 L 164 193 C 176 192, 184 184, 186 172 Z\"\nfill=\"#14090b\" stroke=\"__TRIM_MID__\" stroke-width=\"1.05\"/>\n<path d=\"M 165 173 L 184 175 M 165 173 L 181 181 M 165 173 L 176 187 M 165 173 L 170 191\"\nstroke=\"__TRIM_MID__\" stroke-width=\"0.9\" opacity=\"0.88\"/>\n<path d=\"M 165 183 C 171 183, 175 179, 175 173\" fill=\"none\" stroke=\"__TRIM_LIGHT__\" stroke-width=\"0.8\" opacity=\"0.78\"/>\n<path d=\"M 186 172 L 164 172 L 164 193 L 136 193 L 136 211 L 104 211\"\nfill=\"none\" stroke=\"#0c0608\" stroke-width=\"5.8\" stroke-linejoin=\"miter\"/>\n<path d=\"M 186 172 L 164 172 L 164 193 L 136 193 L 136 211 L 104 211\"\nfill=\"none\" stroke=\"__TRIM_MID__\" stroke-width=\"1.35\" stroke-linejoin=\"miter\"/>\n<rect x=\"116\" y=\"191\" width=\"48\" height=\"27\" fill=\"none\" stroke=\"#0c0608\" stroke-width=\"5.0\"/>\n<rect x=\"116\" y=\"191\" width=\"48\" height=\"27\" fill=\"none\" stroke=\"__TRIM_MID__\" stroke-width=\"1.15\"/>\n<path d=\"M 104 200 L 128 200 L 128 218\" fill=\"none\" stroke=\"#0c0608\" stroke-width=\"4.2\"/>\n<path d=\"M 104 200 L 128 200 L 128 218\" fill=\"none\" stroke=\"__TRIM_MID__\" stroke-width=\"1.0\"/>\n<line x1=\"150\" y1=\"191\" x2=\"150\" y2=\"218\" stroke=\"#0c0608\" stroke-width=\"4.0\"/>\n<line x1=\"150\" y1=\"191\" x2=\"150\" y2=\"218\" stroke=\"__TRIM_MID__\" stroke-width=\"1.0\"/>\n</g>\n</g>\n<g id=\"amulet-bottom-filigree\">\n<g>\n<path d=\"M 104 566 C 127 572, 146 592, 155 615 C 134 619, 114 611, 104 600 Z\"\nfill=\"#11080a\" stroke=\"#090405\" stroke-width=\"2.6\" stroke-linejoin=\"round\"/>\n<path d=\"M 106 568 C 127 574, 144 593, 153 614 C 134 617, 115 609, 106 599 Z\"\nfill=\"none\" stroke=\"__TRIM_MID__\" stroke-width=\"1.35\" stroke-linejoin=\"round\"/>\n<path d=\"M 155 615 C 181 618, 200 634, 210 655 L 175 655 C 161 644, 153 632, 155 615 Z\"\nfill=\"#11080a\" stroke=\"#090405\" stroke-width=\"2.6\" stroke-linejoin=\"round\"/>\n<path d=\"M 157 617 C 180 620, 198 635, 207 653 L 176 653 C 163 643, 155 632, 157 617 Z\"\nfill=\"none\" stroke=\"__TRIM_MID__\" stroke-width=\"1.35\" stroke-linejoin=\"round\"/>\n<path d=\"M 134 615 C 145 609, 156 610, 164 621 C 156 629, 144 631, 134 625 C 141 620, 141 618, 134 615 Z\"\nfill=\"url(#amuletCrownLight___UID__)\" stroke=\"#0c0608\" stroke-width=\"1.6\" stroke-linejoin=\"round\"/>\n<path d=\"M 141 617 C 148 614, 154 615, 159 621 C 153 625, 147 626, 141 622 Z\"\nfill=\"__TRIM_LIGHT__\" opacity=\"0.78\"/>\n<g fill=\"none\" stroke=\"__TRIM_MID__\" stroke-linecap=\"round\" opacity=\"0.92\">\n<circle cx=\"125\" cy=\"594\" r=\"6.8\" stroke-width=\"0.95\"/>\n<circle cx=\"125\" cy=\"594\" r=\"2.4\" fill=\"__TRIM_LIGHT__\" stroke=\"none\"/>\n<path d=\"M 125 587 C 122 579, 129 579, 127 587\" stroke-width=\"0.9\"/>\n<path d=\"M 131 591 C 138 588, 140 595, 132 595\" stroke-width=\"0.9\"/>\n<path d=\"M 129 600 C 133 607, 126 609, 126 601\" stroke-width=\"0.9\"/>\n<path d=\"M 121 599 C 115 604, 111 598, 119 596\" stroke-width=\"0.9\"/>\n<path d=\"M 119 592 C 111 591, 112 584, 120 589\" stroke-width=\"0.9\"/>\n<path d=\"M 108 573 C 115 574, 119 580, 115 584 C 112 586, 108 583, 110 579\" stroke-width=\"1.0\"/>\n<path d=\"M 108 594 C 111 601, 119 607, 129 610\" stroke-width=\"0.9\"/>\n<path d=\"M 133 598 C 139 598, 145 603, 148 610 C 142 612, 137 609, 137 604\" stroke-width=\"1.0\"/>\n<path d=\"M 118 576 C 126 579, 135 586, 142 596\" stroke-width=\"0.85\" opacity=\"0.82\"/>\n</g>\n<g fill=\"none\" stroke=\"__TRIM_MID__\" stroke-linecap=\"round\" opacity=\"0.92\">\n<circle cx=\"180\" cy=\"636\" r=\"7.0\" stroke-width=\"0.95\"/>\n<circle cx=\"180\" cy=\"636\" r=\"2.5\" fill=\"__TRIM_LIGHT__\" stroke=\"none\"/>\n<path d=\"M 180 629 C 177 621, 184 621, 182 629\" stroke-width=\"0.9\"/>\n<path d=\"M 186 633 C 194 631, 195 639, 187 638\" stroke-width=\"0.9\"/>\n<path d=\"M 184 642 C 188 649, 181 651, 180 643\" stroke-width=\"0.9\"/>\n<path d=\"M 176 641 C 169 646, 165 640, 174 638\" stroke-width=\"0.9\"/>\n<path d=\"M 174 634 C 166 633, 167 626, 175 631\" stroke-width=\"0.9\"/>\n<path d=\"M 161 621 C 167 621, 172 625, 170 630 C 166 632, 162 628, 164 624\" stroke-width=\"1.0\"/>\n<path d=\"M 189 640 C 195 641, 200 646, 203 651 C 196 651, 191 649, 190 644\" stroke-width=\"1.0\"/>\n<path d=\"M 163 635 C 169 642, 177 648, 188 651\" stroke-width=\"0.9\"/>\n<path d=\"M 172 621 C 182 624, 192 631, 199 642\" stroke-width=\"0.85\" opacity=\"0.82\"/>\n</g>\n<path d=\"M 104 603 C 122 619, 144 636, 174 657 L 210 657\"\nfill=\"none\" stroke=\"__TRIM_DARK__\" stroke-width=\"1.05\" opacity=\"0.65\"/>\n</g>\n<g transform=\"translate(609, 0) scale(-1, 1)\">\n<path d=\"M 104 566 C 127 572, 146 592, 155 615 C 134 619, 114 611, 104 600 Z\"\nfill=\"#11080a\" stroke=\"#090405\" stroke-width=\"2.6\" stroke-linejoin=\"round\"/>\n<path d=\"M 106 568 C 127 574, 144 593, 153 614 C 134 617, 115 609, 106 599 Z\"\nfill=\"none\" stroke=\"__TRIM_MID__\" stroke-width=\"1.35\" stroke-linejoin=\"round\"/>\n<path d=\"M 155 615 C 181 618, 200 634, 210 655 L 175 655 C 161 644, 153 632, 155 615 Z\"\nfill=\"#11080a\" stroke=\"#090405\" stroke-width=\"2.6\" stroke-linejoin=\"round\"/>\n<path d=\"M 157 617 C 180 620, 198 635, 207 653 L 176 653 C 163 643, 155 632, 157 617 Z\"\nfill=\"none\" stroke=\"__TRIM_MID__\" stroke-width=\"1.35\" stroke-linejoin=\"round\"/>\n<path d=\"M 134 615 C 145 609, 156 610, 164 621 C 156 629, 144 631, 134 625 C 141 620, 141 618, 134 615 Z\"\nfill=\"url(#amuletCrownLight___UID__)\" stroke=\"#0c0608\" stroke-width=\"1.6\" stroke-linejoin=\"round\"/>\n<path d=\"M 141 617 C 148 614, 154 615, 159 621 C 153 625, 147 626, 141 622 Z\"\nfill=\"__TRIM_LIGHT__\" opacity=\"0.78\"/>\n<g fill=\"none\" stroke=\"__TRIM_MID__\" stroke-linecap=\"round\" opacity=\"0.92\">\n<circle cx=\"125\" cy=\"594\" r=\"6.8\" stroke-width=\"0.95\"/>\n<circle cx=\"125\" cy=\"594\" r=\"2.4\" fill=\"__TRIM_LIGHT__\" stroke=\"none\"/>\n<path d=\"M 125 587 C 122 579, 129 579, 127 587\" stroke-width=\"0.9\"/>\n<path d=\"M 131 591 C 138 588, 140 595, 132 595\" stroke-width=\"0.9\"/>\n<path d=\"M 129 600 C 133 607, 126 609, 126 601\" stroke-width=\"0.9\"/>\n<path d=\"M 121 599 C 115 604, 111 598, 119 596\" stroke-width=\"0.9\"/>\n<path d=\"M 119 592 C 111 591, 112 584, 120 589\" stroke-width=\"0.9\"/>\n<path d=\"M 108 573 C 115 574, 119 580, 115 584 C 112 586, 108 583, 110 579\" stroke-width=\"1.0\"/>\n<path d=\"M 108 594 C 111 601, 119 607, 129 610\" stroke-width=\"0.9\"/>\n<path d=\"M 133 598 C 139 598, 145 603, 148 610 C 142 612, 137 609, 137 604\" stroke-width=\"1.0\"/>\n<path d=\"M 118 576 C 126 579, 135 586, 142 596\" stroke-width=\"0.85\" opacity=\"0.82\"/>\n</g>\n<g fill=\"none\" stroke=\"__TRIM_MID__\" stroke-linecap=\"round\" opacity=\"0.92\">\n<circle cx=\"180\" cy=\"636\" r=\"7.0\" stroke-width=\"0.95\"/>\n<circle cx=\"180\" cy=\"636\" r=\"2.5\" fill=\"__TRIM_LIGHT__\" stroke=\"none\"/>\n<path d=\"M 180 629 C 177 621, 184 621, 182 629\" stroke-width=\"0.9\"/>\n<path d=\"M 186 633 C 194 631, 195 639, 187 638\" stroke-width=\"0.9\"/>\n<path d=\"M 184 642 C 188 649, 181 651, 180 643\" stroke-width=\"0.9\"/>\n<path d=\"M 176 641 C 169 646, 165 640, 174 638\" stroke-width=\"0.9\"/>\n<path d=\"M 174 634 C 166 633, 167 626, 175 631\" stroke-width=\"0.9\"/>\n<path d=\"M 161 621 C 167 621, 172 625, 170 630 C 166 632, 162 628, 164 624\" stroke-width=\"1.0\"/>\n<path d=\"M 189 640 C 195 641, 200 646, 203 651 C 196 651, 191 649, 190 644\" stroke-width=\"1.0\"/>\n<path d=\"M 163 635 C 169 642, 177 648, 188 651\" stroke-width=\"0.9\"/>\n<path d=\"M 172 621 C 182 624, 192 631, 199 642\" stroke-width=\"0.85\" opacity=\"0.82\"/>\n</g>\n<path d=\"M 104 603 C 122 619, 144 636, 174 657 L 210 657\"\nfill=\"none\" stroke=\"__TRIM_DARK__\" stroke-width=\"1.05\" opacity=\"0.65\"/>\n</g>\n</g>\n<g id=\"amulet-mid-studs\">\n<polygon points=\"104,385 114,404 104,423 94,404\"\nfill=\"#12080a\" stroke=\"__TRIM_MID__\" stroke-width=\"1.35\" stroke-linejoin=\"round\"/>\n<polygon points=\"104,392 110,404 104,416 98,404\" fill=\"url(#amuletCrownLight___UID__)\"/>\n<polygon points=\"104,392 98,404 104,404\" fill=\"__TRIM_LIGHT__\" opacity=\"0.85\"/>\n<circle cx=\"104\" cy=\"381\" r=\"1.8\" fill=\"__TRIM_MID__\"/>\n<circle cx=\"104\" cy=\"427\" r=\"1.8\" fill=\"__TRIM_MID__\"/>\n<polygon points=\"505,385 515,404 505,423 495,404\"\nfill=\"#12080a\" stroke=\"__TRIM_MID__\" stroke-width=\"1.35\" stroke-linejoin=\"round\"/>\n<polygon points=\"505,392 511,404 505,416 499,404\" fill=\"url(#amuletCrownLight___UID__)\"/>\n<polygon points=\"505,392 499,404 505,404\" fill=\"__TRIM_LIGHT__\" opacity=\"0.85\"/>\n<circle cx=\"505\" cy=\"381\" r=\"1.8\" fill=\"__TRIM_MID__\"/>\n<circle cx=\"505\" cy=\"427\" r=\"1.8\" fill=\"__TRIM_MID__\"/>\n</g>\n</g>\n<g id=\"nameplate-section\">\n<path d=\"M 134 95 L 502 95 C 506 95, 509 93, 511 90 C 513 102, 518 109, 526 113\nL 526 143 C 518 147, 513 153, 510 160 L 134 160 Z\"\nfill=\"url(#frameGrad___UID__)\" stroke=\"__STROKE_DARK__\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/>\n<path d=\"M 138 103 L 504 103 C 506 110, 512 115, 519 117\nL 519 139 C 512 141, 506 146, 504 153 L 138 153 Z\"\nfill=\"url(#nameBgGrad___UID__)\" stroke=\"__TRIM_LIGHT__\" stroke-width=\"1.5\" stroke-linejoin=\"round\"/>\n<line x1=\"146\" y1=\"106.5\" x2=\"500\" y2=\"106.5\" stroke=\"#ffffff\" stroke-width=\"0.9\" opacity=\"0.32\"/>\n<line x1=\"146\" y1=\"150\" x2=\"500\" y2=\"150\" stroke=\"#000000\" stroke-width=\"1.0\" opacity=\"0.35\"/>\n<text id=\"card-name\" x=\"304.5\" y=\"141\" text-anchor=\"middle\"\nfont-family=\"'Source Han Serif SC', 'Noto Serif SC', 'STSong', 'SimSun', 'Microsoft YaHei', serif\"\nfont-weight=\"700\" font-size=\"__NAME_FS__\" letter-spacing=\"1.6\"\nfill=\"#fbf7ee\" stroke=\"#120a14\" stroke-width=\"3.0\" paint-order=\"stroke\">__CARD_NAME__</text>\n</g>\n<g id=\"bottom-gem-section\">\n<path d=\"M 94 655 C 110 658, 124 654, 136 646 C 158 660, 188 670, 228 674\nL 381 674 C 421 670, 451 660, 473 646 C 485 654, 499 658, 515 655\nL 515 699 L 94 699 Z\"\nfill=\"url(#frameGrad___UID__)\" stroke=\"__STROKE_DARK__\" stroke-width=\"2.0\" stroke-linejoin=\"round\"/>\n<path d=\"M 94 655 C 110 658, 124 654, 136 646 C 158 660, 188 670, 228 674\nL 381 674 C 421 670, 451 660, 473 646 C 485 654, 499 658, 515 655\nL 515 699 L 94 699 Z\"\nfill=\"url(#frameSheen___UID__)\"/>\n<path d=\"M 94 655 C 110 658, 124 654, 136 646 C 158 660, 188 670, 228 674\nL 381 674 C 421 670, 451 660, 473 646 C 485 654, 499 658, 515 655\nL 515 699 L 94 699 Z\"\nfill=\"url(#prismOverlay___UID__)\" opacity=\"__PRISM_OP__\"/>\n<path d=\"M 96 657 C 111 660, 125 656, 136 649 L 136 666 C 122 670, 108 672, 96 670 Z\"\nfill=\"__TRIM_LIGHT__\" opacity=\"0.56\"/>\n<path d=\"M 136 649 C 158 662, 188 672, 228 676 L 136 676 Z\"\nfill=\"url(#amuletCrownLight___UID__)\" opacity=\"0.52\"/>\n<path d=\"M 513 657 C 498 660, 484 656, 473 649 L 473 666 C 487 670, 501 672, 513 670 Z\"\nfill=\"__TRIM_LIGHT__\" opacity=\"0.56\"/>\n<path d=\"M 473 649 C 451 662, 421 672, 381 676 L 473 676 Z\"\nfill=\"url(#amuletCrownLight___UID__)\" opacity=\"0.52\"/>\n<line x1=\"98\" y1=\"695\" x2=\"511\" y2=\"695\" stroke=\"__TRIM_LIGHT__\" stroke-width=\"1.3\" opacity=\"0.72\"/>\n<path d=\"M 248 675 C 268 671, 286 658, 304.5 644 C 323 658, 341 671, 361 675\nL 348 699 L 261 699 Z\"\nfill=\"url(#amuletCrownLight___UID__)\" stroke=\"__STROKE_DARK__\" stroke-width=\"1.9\" stroke-linejoin=\"round\"/>\n<polygon points=\"274,674 291,659 286,675\" fill=\"__STROKE_DARK__\" opacity=\"0.78\"/>\n<polygon points=\"335,674 318,659 323,675\" fill=\"__STROKE_DARK__\" opacity=\"0.78\"/>\n<path d=\"M 260 673 C 276 668, 290 658, 304.5 647 C 319 658, 333 668, 349 673\"\nfill=\"none\" stroke=\"__TRIM_LIGHT__\" stroke-width=\"1.4\" opacity=\"0.88\"/>\n<polygon points=\"304.5,655.0 320.5,674.0 304.5,693.0 288.5,674.0\"\nfill=\"__STROKE_DARK__\" stroke=\"__TRIM_LIGHT__\" stroke-width=\"1.8\" stroke-linejoin=\"round\"/>\n<polygon points=\"304.5,659.5 316.5,674.0 304.5,688.5 292.5,674.0\" fill=\"url(#centerGemGrad___UID__)\"/>\n<polygon points=\"304.5,659.5 292.5,674.0 304.5,673.2\" fill=\"#ffffff\" opacity=\"0.60\"/>\n<polygon points=\"304.5,659.5 316.5,674.0 304.5,673.2\" fill=\"#ffffff\" opacity=\"0.25\"/>\n<polygon points=\"304.5,688.5 316.5,674.0 304.5,673.2\" fill=\"#000000\" opacity=\"0.34\"/>\n<polygon points=\"304.5,659.5 316.5,674.0 304.5,688.5 292.5,674.0\"\nfill=\"none\" stroke=\"#ffffff\" stroke-width=\"0.9\" opacity=\"0.55\"/>\n</g>"}};
function buildTempleSvgCardFrameHTML(cardData, inst, opts) {
  const uid = 'cf' + (++_cfSvgFrameUidCounter);
  const type = cardData.type === 'amulet' ? 'amulet' : (cardData.type === 'spell' ? 'spell' : 'minion');
  const rarity = cardData.rarity || '普通';
  const artUri = opts.artUri || '';
  const rawName = String(cardData.name || '');
  const name = rawName.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const nameFs = rawName.length <= 5 ? 32 : (rawName.length <= 7 ? 27 : (rawName.length <= 9 ? 23 : 20));
  const dispE = opts.dispE;
  const dispB = opts.dispB;
  const sac = cardData.sacrifice || 0;
  const atkVal = opts.atkVal;
  const hpVal = opts.hpVal;
  const maxHpVal = opts.maxHpVal;
  const initCd = opts.initCd || 0;
  const isEnhE = opts.enhCostChangedE;
  const isCryst = opts.isCrystReady;

  // 严格按稀有度配色：普通=铜、稀有=银、史诗=金、传说=虹
  const pal = rarity === '传说' ? {
    frameStops: `<stop offset="0%" stop-color="#8264cc"/><stop offset="15%" stop-color="#e092db"/><stop offset="30%" stop-color="#f5f8ff"/><stop offset="46%" stop-color="#78dff2"/><stop offset="62%" stop-color="#a291f5"/><stop offset="78%" stop-color="#fce8a6"/><stop offset="90%" stop-color="#86bbf8"/><stop offset="100%" stop-color="#6649b5"/>`,
    badgeRimStops: `<stop offset="0%" stop-color="#fff7d1"/><stop offset="30%" stop-color="#e092db"/><stop offset="55%" stop-color="#78dff2"/><stop offset="80%" stop-color="#fce8a6"/><stop offset="100%" stop-color="#a291f5"/>`,
    gemDef: `<linearGradient id="centerGemGrad_${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ff5e9c"/><stop offset="22%" stop-color="#ffd93d"/><stop offset="45%" stop-color="#4ade80"/><stop offset="68%" stop-color="#38bdf8"/><stop offset="88%" stop-color="#a855f7"/><stop offset="100%" stop-color="#ff5e9c"/></linearGradient>`,
    strokeDark: '#2c1b54', trimLight: '#f5f0ff', trimMid: '#c4b5fd', trimDark: '#7c65c9', prismOp: '0.46',
    sculptStops: `<stop offset="0%" stop-color="#ffffff"/><stop offset="28%" stop-color="#f5d0fe"/><stop offset="58%" stop-color="#a5f3fc"/><stop offset="82%" stop-color="#fde68a"/><stop offset="100%" stop-color="#c4b5fd"/>`,
    lunetteStops: `<stop offset="0%" stop-color="#7e70ba"/><stop offset="100%" stop-color="#4c3d82"/>`,
    railStops: `<stop offset="0%" stop-color="#2c1b54"/><stop offset="22%" stop-color="#ffffff"/><stop offset="50%" stop-color="#a5f3fc"/><stop offset="78%" stop-color="#e092db"/><stop offset="100%" stop-color="#ffffff"/>`,
    amEnamelStops: `<stop offset="0%" stop-color="#4c2c7a"/><stop offset="52%" stop-color="#2b194d"/><stop offset="100%" stop-color="#170c2e"/>`,
    amLightStops: `<stop offset="0%" stop-color="#ffffff"/><stop offset="45%" stop-color="#e092db"/><stop offset="78%" stop-color="#78dff2"/><stop offset="100%" stop-color="#a291f5"/>`,
    amShadeStops: `<stop offset="0%" stop-color="#9b88d9"/><stop offset="100%" stop-color="#2c1b54"/>`,
    amRecessStops: `<stop offset="0%" stop-color="#2c1b54" stop-opacity="0.68"/><stop offset="100%" stop-color="#a291f5" stop-opacity="0.22"/>`
  } : rarity === '史诗' ? {
    frameStops: `<stop offset="0%" stop-color="#7a4a08"/><stop offset="18%" stop-color="#d69922"/><stop offset="42%" stop-color="#fff4a8"/><stop offset="62%" stop-color="#b57712"/><stop offset="82%" stop-color="#f5cc5c"/><stop offset="100%" stop-color="#593204"/>`,
    badgeRimStops: `<stop offset="0%" stop-color="#fff8cc"/><stop offset="38%" stop-color="#d69a29"/><stop offset="72%" stop-color="#693c06"/><stop offset="100%" stop-color="#f0c456"/>`,
    gemDef: `<radialGradient id="centerGemGrad_${uid}" cx="35%" cy="30%" r="68%"><stop offset="0%" stop-color="#fffde7"/><stop offset="38%" stop-color="#facc15"/><stop offset="76%" stop-color="#ca8a04"/><stop offset="100%" stop-color="#713f12"/></radialGradient>`,
    strokeDark: '#3d2002', trimLight: '#fff4b8', trimMid: '#f2ca63', trimDark: '#b87a14', prismOp: '0',
    sculptStops: `<stop offset="0%" stop-color="#fff9cf"/><stop offset="35%" stop-color="#f7d463"/><stop offset="78%" stop-color="#b87a14"/><stop offset="100%" stop-color="#e8b63a"/>`,
    lunetteStops: `<stop offset="0%" stop-color="#a86e10"/><stop offset="100%" stop-color="#693e05"/>`,
    railStops: `<stop offset="0%" stop-color="#3d2002"/><stop offset="22%" stop-color="#fff9cf"/><stop offset="52%" stop-color="#d99d28"/><stop offset="82%" stop-color="#b87a14"/><stop offset="100%" stop-color="#fff9cf"/>`,
    amEnamelStops: `<stop offset="0%" stop-color="#6b4408"/><stop offset="52%" stop-color="#422804"/><stop offset="100%" stop-color="#241402"/>`,
    amLightStops: `<stop offset="0%" stop-color="#fff9cf"/><stop offset="52%" stop-color="#f2ca63"/><stop offset="100%" stop-color="#b87a14"/>`,
    amShadeStops: `<stop offset="0%" stop-color="#b87a14"/><stop offset="100%" stop-color="#3d2002"/>`,
    amRecessStops: `<stop offset="0%" stop-color="#3d2002" stop-opacity="0.68"/><stop offset="100%" stop-color="#d69922" stop-opacity="0.22"/>`
  } : rarity === '稀有' ? {
    frameStops: `<stop offset="0%" stop-color="#556475"/><stop offset="18%" stop-color="#b0c0d1"/><stop offset="42%" stop-color="#f6faff"/><stop offset="64%" stop-color="#7c8ea3"/><stop offset="84%" stop-color="#d4e0ed"/><stop offset="100%" stop-color="#3d4a59"/>`,
    badgeRimStops: `<stop offset="0%" stop-color="#ffffff"/><stop offset="38%" stop-color="#a8b9cc"/><stop offset="72%" stop-color="#4b5a6b"/><stop offset="100%" stop-color="#dce7f2"/>`,
    gemDef: `<radialGradient id="centerGemGrad_${uid}" cx="35%" cy="30%" r="68%"><stop offset="0%" stop-color="#ffffff"/><stop offset="42%" stop-color="#dbe4ee"/><stop offset="76%" stop-color="#8a9bb0"/><stop offset="100%" stop-color="#334155"/></radialGradient>`,
    strokeDark: '#25303d', trimLight: '#f1f5f9', trimMid: '#cbd5e1', trimDark: '#7c8ea3', prismOp: '0',
    sculptStops: `<stop offset="0%" stop-color="#ffffff"/><stop offset="35%" stop-color="#dde6f0"/><stop offset="78%" stop-color="#7f92a8"/><stop offset="100%" stop-color="#c4d3e3"/>`,
    lunetteStops: `<stop offset="0%" stop-color="#64748b"/><stop offset="100%" stop-color="#334155"/>`,
    railStops: `<stop offset="0%" stop-color="#25303d"/><stop offset="22%" stop-color="#ffffff"/><stop offset="52%" stop-color="#cbd5e1"/><stop offset="82%" stop-color="#7c8ea3"/><stop offset="100%" stop-color="#ffffff"/>`,
    amEnamelStops: `<stop offset="0%" stop-color="#334155"/><stop offset="52%" stop-color="#1e293b"/><stop offset="100%" stop-color="#0f172a"/>`,
    amLightStops: `<stop offset="0%" stop-color="#ffffff"/><stop offset="52%" stop-color="#cbd5e1"/><stop offset="100%" stop-color="#7c8ea3"/>`,
    amShadeStops: `<stop offset="0%" stop-color="#7c8ea3"/><stop offset="100%" stop-color="#25303d"/>`,
    amRecessStops: `<stop offset="0%" stop-color="#25303d" stop-opacity="0.68"/><stop offset="100%" stop-color="#94a3b8" stop-opacity="0.22"/>`
  } : {
    frameStops: `<stop offset="0%" stop-color="#5c3318"/><stop offset="22%" stop-color="#b57242"/><stop offset="46%" stop-color="#e8b382"/><stop offset="68%" stop-color="#8a4d24"/><stop offset="88%" stop-color="#c98956"/><stop offset="100%" stop-color="#47230d"/>`,
    badgeRimStops: `<stop offset="0%" stop-color="#ffe2c2"/><stop offset="38%" stop-color="#b8733d"/><stop offset="72%" stop-color="#5c2e0f"/><stop offset="100%" stop-color="#d9965e"/>`,
    gemDef: `<radialGradient id="centerGemGrad_${uid}" cx="35%" cy="30%" r="68%"><stop offset="0%" stop-color="#ffe6cc"/><stop offset="38%" stop-color="#d98a4e"/><stop offset="76%" stop-color="#9a4e1c"/><stop offset="100%" stop-color="#4a1f08"/></radialGradient>`,
    strokeDark: '#2e1507', trimLight: '#f7d4b2', trimMid: '#d49b68', trimDark: '#b87645', prismOp: '0',
    sculptStops: `<stop offset="0%" stop-color="#ffe5cc"/><stop offset="35%" stop-color="#d9965e"/><stop offset="78%" stop-color="#8f4e1f"/><stop offset="100%" stop-color="#c47d45"/>`,
    lunetteStops: `<stop offset="0%" stop-color="#7d431b"/><stop offset="100%" stop-color="#47230d"/>`,
    railStops: `<stop offset="0%" stop-color="#2e1507"/><stop offset="22%" stop-color="#ffe5cc"/><stop offset="52%" stop-color="#c98956"/><stop offset="82%" stop-color="#8a4d24"/><stop offset="100%" stop-color="#ffe5cc"/>`,
    amEnamelStops: `<stop offset="0%" stop-color="#70281d"/><stop offset="52%" stop-color="#4d1710"/><stop offset="100%" stop-color="#2b0b07"/>`,
    amLightStops: `<stop offset="0%" stop-color="#f7d4b2"/><stop offset="52%" stop-color="#d49b68"/><stop offset="100%" stop-color="#b87645"/>`,
    amShadeStops: `<stop offset="0%" stop-color="#b87645"/><stop offset="100%" stop-color="#2e1507"/>`,
    amRecessStops: `<stop offset="0%" stop-color="#2e1507" stop-opacity="0.68"/><stop offset="100%" stop-color="#b87645" stop-opacity="0.20"/>`
  };

  const nameBgStops = type === 'amulet'
    ? `<stop offset="0%" stop-color="#1a5f73"/><stop offset="55%" stop-color="#0e3c4a"/><stop offset="100%" stop-color="#07222b"/>`
    : type === 'spell'
    ? `<stop offset="0%" stop-color="#5c318a"/><stop offset="55%" stop-color="#371b5c"/><stop offset="100%" stop-color="#1e0d36"/>`
    : `<stop offset="0%" stop-color="#4a4c54"/><stop offset="55%" stop-color="#2b2d36"/><stop offset="100%" stop-color="#181920"/>`;

  const orbStops = (isCryst && isEnhE)
    ? `<stop offset="0%" stop-color="#e0f2fe"/><stop offset="35%" stop-color="#38bdf8"/><stop offset="75%" stop-color="#0284c7"/><stop offset="100%" stop-color="#082f49"/>`
    : isEnhE
    ? `<stop offset="0%" stop-color="#fef08a"/><stop offset="35%" stop-color="#f59e0b"/><stop offset="75%" stop-color="#b45309"/><stop offset="100%" stop-color="#451a03"/>`
    : `<stop offset="0%" stop-color="#d5ff78"/><stop offset="30%" stop-color="#6ad41c"/><stop offset="72%" stop-color="#298a0b"/><stop offset="100%" stop-color="#114504"/>`;

  const typeDefs = type === 'minion'
    ? `<linearGradient id="minionSculptGrad_${uid}" x1="0%" y1="0%" x2="0%" y2="100%">${pal.sculptStops}</linearGradient>
       <linearGradient id="minionLunetteGrad_${uid}" x1="0%" y1="0%" x2="0%" y2="100%">${pal.lunetteStops}</linearGradient>
       <linearGradient id="minionRailGrad_${uid}" x1="0%" y1="0%" x2="100%" y2="0%">${pal.railStops}</linearGradient>`
    : type === 'amulet'
    ? `<linearGradient id="amuletEnamelGrad_${uid}" x1="0%" y1="0%" x2="0%" y2="100%">${pal.amEnamelStops}</linearGradient>
       <radialGradient id="amuletEnamelVignette_${uid}" cx="50%" cy="48%" r="64%"><stop offset="58%" stop-color="#000000" stop-opacity="0"/><stop offset="100%" stop-color="#1a0204" stop-opacity="0.42"/></radialGradient>
       <linearGradient id="amuletCrownLight_${uid}" x1="0%" y1="0%" x2="0%" y2="100%">${pal.amLightStops}</linearGradient>
       <linearGradient id="amuletCrownShade_${uid}" x1="0%" y1="0%" x2="0%" y2="100%">${pal.amShadeStops}</linearGradient>
       <linearGradient id="amuletRecessGrad_${uid}" x1="0%" y1="0%" x2="0%" y2="100%">${pal.amRecessStops}</linearGradient>`
    : '';

  const tpl = _CF_V2_FRAME_TEMPLATES[type];
  const bodySvg = tpl.body
    .replace(/__UID__/g, uid)
    .replace(/__ART_URI__/g, artUri)
    .replace(/__STROKE_DARK__/g, pal.strokeDark)
    .replace(/__TRIM_LIGHT__/g, pal.trimLight)
    .replace(/__TRIM_MID__/g, pal.trimMid)
    .replace(/__TRIM_DARK__/g, pal.trimDark)
    .replace(/__PRISM_OP__/g, pal.prismOp)
    .replace(/__NAME_FS__/g, String(nameFs))
    .replace(/__CARD_NAME__/g, name);

  // 贴合当前卡框轮廓（随从圆穹 / 法术八角方框 / 护符阶梯圣殿）的 SVG 打出提示发光层
  const playableGlowSvg = `
    <g class="sv-playable-svg-group" pointer-events="none">
      <path class="sv-playable-svg-outer" d="${tpl.outerD}" fill="none" stroke-width="26" stroke-linejoin="round" stroke-linecap="round"/>
      <path class="sv-playable-svg-mid" d="${tpl.outerD}" fill="none" stroke-width="14" stroke-linejoin="round" stroke-linecap="round"/>
      <path class="sv-playable-svg-inner" d="${tpl.outerD}" fill="none" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>
    </g>`;

  // 动态费用上移队列：按「能量 -> 献祭 -> 骨头」顺序排列；无能量时由献祭（或仅骨头时由骨头）大图标顶替主位
  const costQueue = [];
  if (dispE > 0 || (sac === 0 && dispB === 0)) costQueue.push({ kind: 'energy', val: dispE });
  if (sac > 0) costQueue.push({ kind: 'sac', val: sac });
  if (dispB > 0) costQueue.push({ kind: 'bones', val: dispB });

  const energyStroke = (isCryst && isEnhE) ? '#082f49' : (isEnhE ? '#451a03' : '#113804');
  let costsSvg = '';
  costQueue.forEach((item, idx) => {
    const isPrimary = idx === 0;
    const subY = 224 + (idx - 1) * 62;
    if (item.kind === 'energy') {
      const energyFs = String(item.val).length >= 2 ? 96 : 116;
      costsSvg += `
    <g id="cost-energy" transform="translate(92, 128)" filter="url(#badgeShadow_${uid})">
      <circle cx="0" cy="0" r="62" fill="url(#badgeRimGrad_${uid})" stroke="#1b1409" stroke-width="2.6"/>
      <circle cx="0" cy="0" r="57.5" fill="none" stroke="#fff8db" stroke-width="1.4" opacity="0.85"/>
      <circle cx="0" cy="0" r="54.5" fill="#133d05"/>
      <circle cx="0" cy="0" r="53" fill="url(#energyOrbGrad_${uid})"/>
      <path d="M -39 -16 C -28 -44, 28 -44, 39 -16 C 22 -28, -22 -28, -39 -16 Z" fill="#ffffff" opacity="0.40"/>
      <ellipse cx="-16" cy="-25" rx="14" ry="7.5" transform="rotate(-22 -16 -25)" fill="#ffffff" opacity="0.42"/>
      <path d="M -29 33 C -12 45, 12 45, 29 33" fill="none" stroke="#b8ff6b" stroke-width="2.6" stroke-linecap="round" opacity="0.46"/>
      <text x="0" y="34" text-anchor="middle" transform="scale(0.96, 1.05)" font-family="'Times New Roman', Georgia, serif" font-weight="700" font-size="${energyFs}" fill="#ffffff" stroke="${energyStroke}" stroke-width="3.6" paint-order="stroke">${item.val}</text>
    </g>`;
    } else if (item.kind === 'sac') {
      if (isPrimary) {
        const sacFs = String(item.val).length >= 2 ? 78 : 96;
        costsSvg += `
    <g id="cost-sacrifice" transform="translate(92, 126)" filter="url(#badgeShadow_${uid})">
      <path d="M 0 -64 C 34 -22, 50 4, 50 24 C 50 51, 28 68, 0 68 C -28 68, -50 51, -50 24 C -50 4, -34 -22, 0 -64 Z" fill="url(#sacGrad_${uid})" stroke="url(#badgeRimGrad_${uid})" stroke-width="6.2" stroke-linejoin="round"/>
      <path d="M 0 -52 C 26 -17, 39 4, 39 22 C 39 43, 22 57, 0 57 C -22 57, -39 43, -39 22 C -39 4, -26 -17, 0 -52 Z" fill="none" stroke="#ffadb5" stroke-width="2.0" opacity="0.70"/>
      <ellipse cx="-14" cy="4" rx="10" ry="18" transform="rotate(-18 -14 4)" fill="#ffffff" opacity="0.36"/>
      <text x="0" y="47" text-anchor="middle" font-family="'Times New Roman', Georgia, serif" font-weight="700" font-size="${sacFs}" fill="#ffffff" stroke="#3b050b" stroke-width="4.2" paint-order="stroke">${item.val}</text>
    </g>`;
      } else {
        costsSvg += `
    <g id="cost-sacrifice" transform="translate(80, ${subY})" filter="url(#badgeShadow_${uid})">
      <path d="M 0 -27 C 15 -9, 22 2, 22 11 C 22 23, 12 31, 0 31 C -12 31, -22 23, -22 11 C -22 2, -15 -9, 0 -27 Z" fill="url(#sacGrad_${uid})" stroke="url(#badgeRimGrad_${uid})" stroke-width="3.2"/>
      <path d="M 0 -21 C 11 -7, 16 2, 16 10 C 16 19, 9 25, 0 25 C -9 25, -16 19, -16 10 C -16 2, -11 -7, 0 -21 Z" fill="none" stroke="#ffadb5" stroke-width="1.1" opacity="0.65"/>
      <ellipse cx="-6" cy="2" rx="4.5" ry="8" transform="rotate(-18 -6 2)" fill="#ffffff" opacity="0.36"/>
      <text x="0" y="21" text-anchor="middle" font-family="'Times New Roman', Georgia, serif" font-weight="700" font-size="36" fill="#ffffff" stroke="#3b050b" stroke-width="2.8" paint-order="stroke">${item.val}</text>
    </g>`;
      }
    } else if (item.kind === 'bones') {
      if (isPrimary) {
        const boneFs = String(item.val).length >= 2 ? 70 : 94;
        costsSvg += `
    <g id="cost-bones" transform="translate(92, 128)" filter="url(#badgeShadow_${uid})">
      <polygon points="0,-60 52,-30 52,30 0,60 -52,30 -52,-30" fill="url(#boneGrad_${uid})" stroke="url(#badgeRimGrad_${uid})" stroke-width="6.2" stroke-linejoin="round"/>
      <polygon points="0,-48 41,-24 41,24 0,48 -41,24 -41,-24" fill="none" stroke="#ffffff" stroke-width="2.0" opacity="0.65"/>
      <polygon points="0,-48 -41,-24 0,-2" fill="#ffffff" opacity="0.22"/>
      <text x="0" y="30" text-anchor="middle" font-family="'Times New Roman', Georgia, serif" font-weight="700" font-size="${boneFs}" fill="#ffffff" stroke="#24201c" stroke-width="4.2" paint-order="stroke">${item.val}</text>
    </g>`;
      } else {
        const boneFs = String(item.val).length >= 2 ? 30 : 35;
        costsSvg += `
    <g id="cost-bones" transform="translate(80, ${subY})" filter="url(#badgeShadow_${uid})">
      <polygon points="0,-25 22,-12 22,12 0,25 -22,12 -22,-12" fill="url(#boneGrad_${uid})" stroke="url(#badgeRimGrad_${uid})" stroke-width="3.2" stroke-linejoin="round"/>
      <polygon points="0,-19 16,-9 16,9 0,19 -16,9 -16,-9" fill="none" stroke="#ffffff" stroke-width="1.0" opacity="0.58"/>
      <text x="0" y="11" text-anchor="middle" font-family="'Times New Roman', Georgia, serif" font-weight="700" font-size="${boneFs}" fill="#ffffff" stroke="#24201c" stroke-width="2.8" paint-order="stroke">${item.val}</text>
    </g>`;
      }
    }
  });

  const atkColor = atkVal > (cardData.atk || 0) ? '#86efac' : (atkVal < (cardData.atk || 0) ? '#fda4af' : '#ffffff');
  const hpColor = (inst && (hpVal < maxHpVal || hpVal < (cardData.hp || 1))) ? '#fca5a5' : (hpVal > (cardData.hp || 1) ? '#86efac' : '#ffffff');
  const atkFs = String(atkVal).length >= 2 ? 86 : 108;
  const hpFs = String(hpVal).length >= 2 ? 86 : 108;
  let statsSvg = '';
  if (type === 'minion') {
    statsSvg = `
    <g id="stat-atk" transform="translate(90, 668)" filter="url(#badgeShadow_${uid})">
      <path d="M 0 -68 L 49 -12 L 33 23 L 54 23 L 46 40 L 22 40 L 22 57 L -22 57 L -22 40 L -46 40 L -54 23 L -33 23 L -49 -12 Z" fill="url(#badgeRimGrad_${uid})" stroke="#1b140d" stroke-width="2.3" stroke-linejoin="round"/>
      <path d="M 0 -68 L 49 -12 L 33 23 L 54 23 L 46 40 L 22 40 L 22 57 L -22 57 L -22 40 L -46 40 L -54 23 L -33 23 L -49 -12 Z" fill="none" stroke="#fff7d6" stroke-width="1.0" opacity="0.68" stroke-linejoin="round"/>
      <path d="M 0 -58 L 41 -10 L 26 26 L 45 28 L 39 35 L 16 35 L 16 50 L -16 50 L -16 35 L -39 35 L -45 28 L -26 26 L -41 -10 Z" fill="url(#atkGemGrad_${uid})"/>
      <polygon points="0,-58 -41,-10 0,-3" fill="#d9f7ff" opacity="0.34"/>
      <polygon points="0,-58 41,-10 0,-3" fill="#071e63" opacity="0.24"/>
      <path d="M 0 -58 L 41 -10 L 26 26 L 45 28 L 39 35 L 16 35 L 16 50 L -16 50 L -16 35 L -39 35 L -45 28 L -26 26 L -41 -10 Z" fill="none" stroke="#a6ebff" stroke-width="1.2" opacity="0.72" stroke-linejoin="round"/>
      <text x="0" y="34" text-anchor="middle" transform="scale(0.96, 1.04)" font-family="'Times New Roman', Georgia, serif" font-weight="700" font-size="${atkFs}" fill="${atkColor}" stroke="#081a4a" stroke-width="3.4" paint-order="stroke">${atkVal}</text>
    </g>
    <g id="stat-hp" transform="translate(511, 670)" filter="url(#badgeShadow_${uid})">
      <path d="M 0 -63 L 49 -42 L 51 6 C 48 33, 25 50, 0 62 C -25 50, -48 33, -51 6 L -49 -42 Z" fill="url(#badgeRimGrad_${uid})" stroke="#1b100b" stroke-width="2.3" stroke-linejoin="round"/>
      <path d="M 0 -63 L 49 -42 L 51 6 C 48 33, 25 50, 0 62 C -25 50, -48 33, -51 6 L -49 -42 Z" fill="none" stroke="#fff7d6" stroke-width="1.0" opacity="0.68" stroke-linejoin="round"/>
      <path d="M 0 -54 L 41 -36 L 43 4 C 40 27, 20 42, 0 53 C -20 42, -40 27, -43 4 L -41 -36 Z" fill="url(#hpGemGrad_${uid})"/>
      <path d="M 0 -54 L -41 -36 L -43 4 C -40 27, -20 42, 0 53 Z" fill="#ff9494" opacity="0.20"/>
      <path d="M 0 -54 L 41 -36 L 43 4 C 40 27, 20 42, 0 53 Z" fill="#470308" opacity="0.26"/>
      <path d="M -35 -31 L 0 -47 L 35 -31" fill="none" stroke="#ffc7c7" stroke-width="1.8" opacity="0.62"/>
      <path d="M 0 -54 L 41 -36 L 43 4 C 40 27, 20 42, 0 53 C -20 42, -40 27, -43 4 L -41 -36 Z" fill="none" stroke="#ffb3b3" stroke-width="1.2" opacity="0.68" stroke-linejoin="round"/>
      <text x="0" y="33" text-anchor="middle" transform="scale(0.96, 1.04)" font-family="'Times New Roman', Georgia, serif" font-weight="700" font-size="${hpFs}" fill="${hpColor}" stroke="#47050a" stroke-width="3.4" paint-order="stroke">${hpVal}</text>
    </g>`;
  } else if (initCd > 0) {
    const cdFs = String(initCd).length >= 2 ? 48 : 60;
    statsSvg = `
    <g id="stat-timer" transform="translate(516, 682) scale(0.88)" filter="url(#badgeShadow_${uid})">
      <polygon points="0,-56 44,0 0,56 -44,0" fill="url(#badgeRimGrad_${uid})" stroke="#241505" stroke-width="2.6" stroke-linejoin="round"/>
      <polygon points="0,-45 35,0 0,45 -35,0" fill="url(#timerGemGrad_${uid})"/>
      <path d="M -14 -21 L 14 -21 L 3 0 L 14 21 L -14 21 L -3 0 Z" fill="#fff7d1" opacity="0.24"/>
      <polygon points="0,-45 -35,0 0,0" fill="#fff4bd" opacity="0.34"/>
      <polygon points="0,-45 35,0 0,45 -35,0" fill="none" stroke="#fff3ba" stroke-width="1.5" opacity="0.75"/>
      <text x="0" y="20" text-anchor="middle" font-family="'Times New Roman', Georgia, serif" font-weight="700" font-size="${cdFs}" fill="#ffffff" stroke="#4a2704" stroke-width="3.6" paint-order="stroke">${initCd}</text>
    </g>`;
  }

  // 紧凑 viewBox="64 56 474 632"（精确3:4）让卡框主体撑满100%手牌/换牌格，角标自然立体凸出边缘
  const cssClipPoly = type === 'spell'
    ? 'polygon(2.5% 4.4%, 99.8% 4.4%, 99.8% 100%, 2.5% 100%)'
    : type === 'amulet'
    ? 'polygon(2.3% 4.6%, 20% 4.6%, 44% 0%, 56% 0%, 80% 4.6%, 99.2% 4.6%, 99.2% 100%, 2.3% 100%)'
    : 'polygon(2.1% 5.7%, 18% 5.7%, 35% 1%, 50% 0%, 65% 1%, 82% 5.7%, 97.5% 5.7%, 97.5% 99.7%, 2.1% 99.7%)';

  const svg = `<svg class="sv-temple-frame-svg" viewBox="64 56 474 632" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
    <defs>
      <linearGradient id="frameGrad_${uid}" x1="0%" y1="0%" x2="100%" y2="100%">${pal.frameStops}</linearGradient>
      <linearGradient id="frameSheen_${uid}" x1="12%" y1="0%" x2="88%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.35"/><stop offset="26%" stop-color="#ffffff" stop-opacity="0.03"/>
        <stop offset="50%" stop-color="#000000" stop-opacity="0.18"/><stop offset="76%" stop-color="#ffffff" stop-opacity="0.26"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.30"/>
      </linearGradient>
      <linearGradient id="prismOverlay_${uid}" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#e37dff" stop-opacity="0.52"/><stop offset="24%" stop-color="#69e5ff" stop-opacity="0.48"/>
        <stop offset="50%" stop-color="#fff099" stop-opacity="0.42"/><stop offset="76%" stop-color="#7ef2c8" stop-opacity="0.45"/>
        <stop offset="100%" stop-color="#b580ff" stop-opacity="0.52"/>
      </linearGradient>
      <linearGradient id="nameBgGrad_${uid}" x1="0%" y1="0%" x2="100%" y2="100%">${nameBgStops}</linearGradient>
      ${pal.gemDef}
      <linearGradient id="badgeRimGrad_${uid}" x1="0%" y1="0%" x2="100%" y2="100%">${pal.badgeRimStops}</linearGradient>
      <radialGradient id="energyOrbGrad_${uid}" cx="38%" cy="30%" r="66%">${orbStops}</radialGradient>
      <radialGradient id="sacGrad_${uid}" cx="35%" cy="32%" r="68%"><stop offset="0%" stop-color="#ff8593"/><stop offset="45%" stop-color="#d41e33"/><stop offset="100%" stop-color="#5e0510"/></radialGradient>
      <radialGradient id="boneGrad_${uid}" cx="35%" cy="30%" r="70%"><stop offset="0%" stop-color="#f7f2e6"/><stop offset="55%" stop-color="#b5aa98"/><stop offset="100%" stop-color="#544d43"/></radialGradient>
      <linearGradient id="atkGemGrad_${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#59d0ff"/><stop offset="45%" stop-color="#1562d6"/><stop offset="100%" stop-color="#081e6b"/></linearGradient>
      <linearGradient id="hpGemGrad_${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ff6666"/><stop offset="48%" stop-color="#bd1520"/><stop offset="100%" stop-color="#59060b"/></linearGradient>
      <linearGradient id="timerGemGrad_${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ffe680"/><stop offset="50%" stop-color="#d48817"/><stop offset="100%" stop-color="#6b3b04"/></linearGradient>
      <filter id="badgeShadow_${uid}" x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#05040a" flood-opacity="0.65"/></filter>
      <clipPath id="artClip_${uid}">${tpl.artClip}</clipPath>
      ${typeDefs}
    </defs>
    ${playableGlowSvg}
    ${bodySvg}
    ${costsSvg}
    ${statsSvg}
  </svg>`;
  return { svg, clipPoly: cssClipPoly };
}

function buildHandCardDOM(cardData, inst = null, deckBadgeCount = 0) {
  const el = document.createElement('div');
  const rarityCls = getRarityClass(cardData.rarity);
  const typeFrameCls = cardData.type === 'amulet' ? 'sv-card-type-amulet' : (cardData.type === 'spell' ? 'sv-card-type-spell' : 'sv-card-type-minion');

  el.className = `sv-hand-card ${rarityCls} ${typeFrameCls} flex flex-col justify-between p-1.5 gap-1`;
  if (inst && inst.uid) el.dataset.cardUid = String(inst.uid);
  const leaderSt = inst && battle.leaders[inst.owner] ? battle.leaders[inst.owner] : (battle.leaders ? battle.leaders[0] : null);
  const effE = inst ? getEffectiveEnergy(inst, leaderSt) : cardData.energy;
  const effB = cardData.bones || 0;
  let dispE = effE;
  let dispB = effB;
  let enhCostChangedE = false;
  let enhCostChangedB = false;
  let isEnhReady = false;
  let isCrystReady = false;
  if (inst && leaderSt && battle && !battle.gameOver && (battle.activeSide === inst.owner || battleMode === 'pvp_pass')) {
    const handEval = evaluateCardPlayState(inst.owner, inst);
    if (handEval.ok && (handEval.mode === 'enhance' || handEval.mode === 'crystallize' || handEval.mode === 'accelerate')) {
      isEnhReady = handEval.mode === 'enhance';
      isCrystReady = handEval.mode === 'crystallize' || handEval.mode === 'accelerate';
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
    const isAccelChip = isCrystReady && Boolean((cardData.ast || parseCardEffectAST(cardData)).accelerate);
    const costTitle = isCrystReady && enhCostChangedE
      ? `${isAccelChip ? '激奏' : '结晶'}能量费用 ${dispE}（原 ${effE}）`
      : (enhCostChangedE ? `爆能强化能量费用 ${dispE}（原 ${effE}）` : `能量费用 ${dispE}`);
    const costStyle = isCrystReady && enhCostChangedE ? 'style="background:linear-gradient(135deg,#0284c7,#22d3ee);color:#082f49;border-color:#bae6fd;box-shadow:0 0 10px rgba(34,211,238,0.85);"' : '';
    costCircles.push(`<span class="sv-cost-circle sv-cost-energy ${enhCostChangedE && !isCrystReady ? 'sv-cost-enhanced' : ''}" ${costStyle} title="${costTitle}">${dispE}</span>`);
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
  const artLayers = getAnimeIllustrationLayers(cardData);
  el.dataset.material = getCardMaterialType(cardData);

  const templeRes = buildTempleSvgCardFrameHTML(cardData, inst, {
    artUri: artLayers.fgUri || imgUri,
    dispE, dispB, atkVal, hpVal, maxHpVal, initCd,
    enhCostChangedE, isCrystReady
  });
  el.classList.add('sv-temple-card-shell');
  el.style.setProperty('--cf-frame-clip', templeRes.clipPoly);
  const finalArtUri = artLayers.fgUri || imgUri;
  el.innerHTML = `
    <div class="sv-playable-aura-ring"></div>
    ${templeRes.svg}
    <div class="sv-glint-clip-wrap" style="position:absolute;inset:0;z-index:19;pointer-events:none;clip-path:${templeRes.clipPoly};-webkit-clip-path:${templeRes.clipPoly};">${getShatterGlintsHTML(cardData)}</div>
    ${deckBadgeCount > 0 ? `<span class="sv-deck-qty-badge">×${deckBadgeCount}</span>` : ''}
    ${isEnhReady ? `<span class="sv-enhance-chip absolute z-30 px-1.5 py-0.5 rounded-full font-black text-[9px] shadow" style="top:8px;right:8px;transform:translateZ(4px);">⚡爆能</span>` : (isCrystReady ? `<span class="sv-enhance-chip absolute z-30 px-1.5 py-0.5 rounded-full font-black text-[9px] shadow" style="top:8px;right:8px;transform:translateZ(4px);background:linear-gradient(135deg,#0284c7,#22d3ee);color:#082f49;border-color:#bae6fd;">${(cardData.ast && cardData.ast.accelerate) ? '✨激奏' : '💎结晶'}</span>` : '')}
    ${(inst && getCardGrantedEffectsList(inst, 'hand').length > 0) ? `<span class="cf-hand-effect-bang" title="此手牌已获得附加效果，点击查看详情">!</span>` : ''}
    ${(inst && getDynamicCardXValue(cardData, inst) !== null) ? `<span style="top:50%;right:6px;transform:translateY(-50%);" class="absolute z-30 px-1.5 py-0.5 rounded-md bg-indigo-950/95 border border-cyan-300 text-[10px] font-black text-cyan-200 shadow" title="当前 X 数值">X=${getDynamicCardXValue(cardData, inst)}</span>` : ''}
    ${(inst && getHandCardLiveCounterBadge(cardData, inst)) ? `<span style="bottom:30px;left:50%;transform:translateX(-50%) translateZ(4px);white-space:nowrap;pointer-events:none;" class="absolute z-30 px-1.5 py-0.5 rounded-md bg-rose-950/95 border border-amber-300 text-[9px] font-black text-amber-200 shadow">${getHandCardLiveCounterBadge(cardData, inst)}</span>` : ''}
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

let _animPhasesInitialized = false;
function syncGlobalAnimPhases() {
  if (_animPhasesInitialized) return;
  _animPhasesInitialized = true;
  const t = performance.now() / 1000;
  document.documentElement.style.setProperty('--anim-sync-52', `-${(t % 5.2).toFixed(3)}s`);
  document.documentElement.style.setProperty('--anim-sync-46', `-${(t % 4.6).toFixed(3)}s`);
  document.documentElement.style.setProperty('--anim-sync-42', `-${(t % 4.2).toFixed(3)}s`);
  document.documentElement.style.setProperty('--anim-sync-38', `-${(t % 3.8).toFixed(3)}s`);
}
function renderAllBattleUI() {
  document.getElementById('playerLeaderNode')?.classList.toggle('hand-expanded-hp', !battle.handCollapsed);
  syncGlobalAnimPhases();
  const pst = battle.leaders[0];
  const est = battle.leaders[1];
  if (!pst || !est) return;
  if (typeof updateSelfDmgHudBadge === 'function') updateSelfDmgHudBadge();

  const animateLeaderHpChange = (el, newHp) => {
    if (!el) return;
    const prev = el.dataset.prevHp !== undefined ? Number(el.dataset.prevHp) : newHp;
    el.textContent = newHp;
    if (prev !== newHp) {
      const cls = newHp < prev ? 'sv-hp-change-dmg' : 'sv-hp-change-heal';
      el.classList.remove('sv-hp-change-dmg', 'sv-hp-change-heal');
      void el.offsetWidth;
      el.classList.add(cls);
      setTimeout(() => el.classList?.remove(cls), 680);
      const hpBox = el.closest ? el.closest('.sv-leader-hp-box') : null;
      if (hpBox) {
        const ring = document.createElement('div');
        ring.className = 'sv-hp-ripple-ring';
        const ringCol = newHp < prev ? '#f43f5e' : '#4ade80';
        ring.style.border = `3px solid ${ringCol}`;
        ring.style.boxShadow = `0 0 14px ${ringCol}`;
        hpBox.appendChild(ring);
        setTimeout(() => ring.remove(), 700);
      }
    }
    el.dataset.prevHp = String(newHp);
  };
  const eHpEl = document.getElementById('uiEnemyHp');
  animateLeaderHpChange(eHpEl, est.hp);
  eHpEl.style.color = est.hp < (est.maxHp || 30) ? '#ff4d6d' : '#ffffff';
  document.getElementById('uiEnemyBones').textContent = est.bones;
  document.getElementById('uiEnemyHandCnt').textContent = est.hand.length;
  document.getElementById('uiEnemyDeckCnt').textContent = est.deck.length;
  const edv = document.getElementById('uiEnemyDeckVisualCnt'); if (edv) edv.textContent = est.deck.length;
  document.getElementById('uiEnemyGraveCnt').textContent = est.graveyard.length;
  document.getElementById('uiEnemyLWCnt').textContent = est.destroyedLastWordsCount;
  const eEnergyEl = document.getElementById('uiEnemyEnergy');
  if (eEnergyEl) {
    eEnergyEl.textContent = est.energy + (est.extraEnergy || 0);
    eEnergyEl.style.color = (est.extraEnergy || 0) > 0 ? '#f472b6' : '#ffffff';
  }
  document.getElementById('uiEnemyMaxEnergy').textContent = est.maxEnergy;

  const pHpEl = document.getElementById('uiPlayerHp');
  animateLeaderHpChange(pHpEl, pst.hp);
  pHpEl.style.color = pst.hp < (pst.maxHp || 30) ? '#ff4d6d' : '#ffffff';
  document.getElementById('uiPlayerBones').textContent = pst.bones;
  document.getElementById('uiPlayerHandCnt').textContent = pst.hand.length;
  document.getElementById('uiPlayerDeckCnt').textContent = pst.deck.length;
  const pdv = document.getElementById('uiPlayerDeckVisualCnt'); if (pdv) pdv.textContent = pst.deck.length;
  document.getElementById('uiPlayerGraveCnt').textContent = pst.graveyard.length;
  document.getElementById('uiPlayerLWCnt').textContent = pst.destroyedLastWordsCount;
  const pTotalE = pst.energy + (pst.extraEnergy || 0);
  const pEnergyEl = document.getElementById('uiPlayerEnergy');
  if (pEnergyEl) {
    pEnergyEl.textContent = pTotalE;
    pEnergyEl.style.color = (pst.extraEnergy || 0) > 0 ? '#f472b6' : '#ffffff';
  }
  document.getElementById('uiPlayerMaxEnergy').textContent = pst.maxEnergy;
  document.getElementById('uiPlayerCombo').textContent = pst.cardsPlayedThisTurn;
  document.getElementById('uiTurnNum').textContent = `第${battle.turn}回合`;

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
    b.className = 'sv-enemy-hand-card rounded-lg bg-gradient-to-b from-slate-800 to-slate-950 border-2 border-amber-400/70 shadow-lg flex items-center justify-center transition-all duration-150';
    if (hiddenCardUids.has(est.hand[i].uid)) b.style.opacity = '0';
    b.innerHTML = `<div class="w-5 h-5 rounded-full border border-sky-400/50 bg-sky-900/40"></div>`;
    backsBox.appendChild(b);
  }

  const eOrbsBox = document.getElementById('enemyEnergyOrbs');
  if (eOrbsBox) {
    eOrbsBox.innerHTML = '';
    const eGreenCnt = Math.max(0, est.energy || 0);
    const ePinkCnt = Math.max(0, est.extraEnergy || 0);
    const eTotalOrbs = Math.max(10, eGreenCnt + ePinkCnt, est.maxEnergy || 1);
    for (let i = 1; i <= eTotalOrbs; i++) {
      const orb = document.createElement('div');
      if (i <= eGreenCnt) {
        orb.className = 'w-3 h-3 rounded-full bg-emerald-400 border border-emerald-200 shadow-[0_0_6px_#34d399]';
      } else if (i <= eGreenCnt + ePinkCnt) {
        orb.id = 'enemyExtraPinkOrb';
        orb.className = 'w-3 h-3 rounded-full border';
        orb.style.background = 'linear-gradient(135deg, #f472b6, #ec4899)';
        orb.style.borderColor = '#fbcfe8';
        orb.style.boxShadow = '0 0 9px #f472b6';
        orb.title = '敌方粉色额外能量';
      } else if (i <= est.maxEnergy) {
        orb.className = 'w-3 h-3 rounded-full bg-slate-800 border border-emerald-500/50';
      } else {
        orb.className = 'w-3 h-3 rounded-full bg-slate-950 border border-slate-700 opacity-50';
      }
      eOrbsBox.appendChild(orb);
    }
  }

  const orbsBox = document.getElementById('playerEnergyOrbs');
  orbsBox.innerHTML = '';
  const greenCnt = Math.max(0, pst.energy || 0);
  const pinkCnt = Math.max(0, pst.extraEnergy || 0);
  const totalOrbs = Math.max(10, greenCnt + pinkCnt, pst.maxEnergy || 1);
  for (let i = 1; i <= totalOrbs; i++) {
    const orb = document.createElement('div');
    if (i <= greenCnt) {
      orb.className = 'w-3 h-3 rounded-full bg-emerald-400 border border-emerald-200 shadow-[0_0_6px_#34d399]';
    } else if (i <= greenCnt + pinkCnt) {
      orb.id = 'playerExtraPinkOrb';
      orb.className = 'w-3 h-3 rounded-full border';
      orb.style.background = 'linear-gradient(135deg, #f472b6, #ec4899)';
      orb.style.borderColor = '#fbcfe8';
      orb.style.boxShadow = '0 0 9px #f472b6';
      orb.title = '粉色额外能量（下一次补充前有效，第1/4/7回合获得，打牌自动优先消耗绿色能量）';
    } else if (i <= pst.maxEnergy) {
      orb.className = 'w-3 h-3 rounded-full bg-slate-800 border border-emerald-500/50';
    } else {
      orb.className = 'w-3 h-3 rounded-full bg-slate-950 border border-slate-700 opacity-50';
    }
    orbsBox.appendChild(orb);
  }
  const enemyExtraBadge = document.getElementById('enemyExtraEnergyBadge');
  if (enemyExtraBadge) {
    const eHasExtra = (est.extraEnergy || 0) > 0;
    enemyExtraBadge.classList.toggle('hidden', !eHasExtra);
    enemyExtraBadge.classList.toggle('flex', eHasExtra);
  }

  const turnOrb = document.getElementById('btnTurnOrb');
  const mainTxt = document.getElementById('turnOrbMainTxt');
  if ((battle.activeSide === 0 || battleMode === 'pvp_pass') && !battle.gameOver) {
    const activePst = battle.leaders[battle.activeSide] || pst;
    const hasPlayableHand = (activePst.hand || []).some(hc => evaluateCardPlayState(battle.activeSide, hc).ok);
    const hasPlayableAct = [0,1,2,3,4].some(al => {
      const am = battle.board[battle.activeSide]?.[al];
      if (!am || am.activatedThisTurn || am.data.type !== 'minion') return false;
      const actAst = am.data.ast?.activate;
      if (!actAst) return false;
      return getTotalAvailableEnergy(activePst) >= (actAst.energy || 0) && (activePst.bones || 0) >= (actAst.bones || 0);
    });
    const noPlayWaveCls = (!hasPlayableHand && !hasPlayableAct && !battle.animating) ? ' sv-turn-orb-no-play-wave' : '';
    turnOrb.className = 'interactive-zone w-28 h-28 rounded-full border-4 border-amber-300 bg-gradient-to-b from-sky-400 via-blue-600 to-indigo-950 hover:from-sky-300 hover:to-blue-500 shadow-[0_0_32px_rgba(56,189,248,0.75)] flex flex-col items-center justify-center transition transform active:scale-95 cursor-pointer' + noPlayWaveCls;
    mainTxt.innerHTML = '结束<br>回合';
  } else {
    turnOrb.className = 'interactive-zone w-28 h-28 rounded-full border-4 border-amber-500/60 bg-gradient-to-b from-rose-800 via-rose-950 to-slate-950 shadow-inner flex flex-col items-center justify-center cursor-not-allowed';
    mainTxt.innerHTML = '对手<br>回合';
  }

  const eRow = document.getElementById('enemyLanesRow');
  const pRow = document.getElementById('playerLanesRow');
  const pp = battle.pendingPlay;

  if (eRow.children.length !== 5) {
    eRow.innerHTML = '';
    for (let l = 0; l < 5; l++) {
      const c = document.createElement('div');
      c.className = 'sv-lane-cell';
      c.addEventListener('click', (e) => { e.stopPropagation(); onBoardLaneClicked(1, l); });
      eRow.appendChild(c);
    }
  }
  if (pRow.children.length !== 5) {
    pRow.innerHTML = '';
    for (let l = 0; l < 5; l++) {
      const c = document.createElement('div');
      c.className = 'sv-lane-cell';
      c.addEventListener('click', (e) => { e.stopPropagation(); onBoardLaneClicked(0, l); });
      pRow.appendChild(c);
    }
  }

  const getLaneStructSig = (m) => {
    if (!m) return 'empty';
    const kwSig = Object.entries(m.activeKw || {}).map(([k, v]) => `${k}=${v}`).sort().join(',');
    return `${m.uid}:${m.data.id}:${kwSig}:${m.justEnteredLegendVfx ? 1 : 0}:${(m.countdown !== null && m.countdown !== undefined) ? 1 : 0}`;
  };

  const syncBoardLane = (cell, m, side, lane, isPlaceable) => {
    const structSig = getLaneStructSig(m);
    const desiredCellCls = isPlaceable ? 'sv-lane-cell interactive-zone placeable-slot' : 'sv-lane-cell';
    if (cell.className !== desiredCellCls) cell.className = desiredCellCls;

    if (!cell.dataset || cell.dataset.coreSig !== structSig) {
      if (cell.dataset) cell.dataset.coreSig = structSig;
      cell.innerHTML = '';
      if (m) {
        cell.appendChild(buildFollowerTokenDOM(m, side, lane));
      } else {
        cell.innerHTML = `<span class="text-[10px] ${side === 1 ? 'text-slate-600' : 'text-slate-500'} font-bold pointer-events-none">${side === 1 ? `敌方战道 ${5 - lane}` : `战道 ${lane + 1}`}</span>`;
      }
    } else if (m && cell.firstElementChild) {
      // 同一随从仅数值/倒计时变化（如受击扣血或增益）：原地无闪烁刷新数字，不重建 <img>
      const tok = cell.firstElementChild;
      const c = m.data;
      const atkEl = tok.querySelector('.sv-atk-badge .sv-stat-num');
      if (atkEl) {
        const atkTxt = String(m.currentAtk);
        if (atkEl.textContent !== atkTxt) atkEl.textContent = atkTxt;
        const atkCls = 'sv-stat-num ' + (m.currentAtk > (c.atk || 0) ? 'sv-stat-buff' : (m.currentAtk < (c.atk || 0) ? 'sv-stat-debuff' : 'sv-stat-normal'));
        if (atkEl.className !== atkCls) atkEl.className = atkCls;
      }
      const hpEl = tok.querySelector('.sv-hp-badge .sv-stat-num');
      if (hpEl) {
        const hpTxt = String(m.currentHp);
        if (hpEl.textContent !== hpTxt) hpEl.textContent = hpTxt;
        const hpCls = 'sv-stat-num ' + (m.currentHp < m.maxHp ? 'sv-stat-dmg' : (m.currentHp > (c.hp || 1) ? 'sv-stat-buff' : 'sv-stat-normal'));
        if (hpEl.className !== hpCls) hpEl.className = hpCls;
      }
      const cdEl = tok.querySelector('.sv-countdown-orb .sv-stat-num');
      if (cdEl && m.countdown !== null && m.countdown !== undefined) {
        const cdTxt = String(m.countdown);
        if (cdEl.textContent !== cdTxt) cdEl.textContent = cdTxt;
      }
    }

    if (m && cell.firstElementChild) {
      const tok = cell.firstElementChild;
      const actSide = pp && pp.side !== undefined ? pp.side : 0;
      const isSac = Boolean(pp && side === actSide && pp.sacLanes && pp.sacLanes.includes(lane));
      let isSacSel = false;
      if (pp && side === actSide && !isSac && pp.step === 'SACRIFICE') {
        const validS = getValidSacrificeLanes(actSide, pp.card.data.sacrificeCond || '');
        isSacSel = validS.includes(lane);
      }
      let isTgtSel = false;
      if (pp && pp.step === 'TARGET') {
        const isEnh = pp.playEval.mode === 'enhance';
        const req = getCardTargetRequirement(pp.card, isEnh, pp.choiceIdx);
        const queryReq = req === 'friendly_minion_pair' ? 'friendly_minion' : req;
        const validLocs = getValidTargetLocations(actSide, queryReq, pp.card.data.type === 'spell', pp.sacLanes);
        isTgtSel = validLocs.some(loc => loc.side === side && loc.lane === lane);
      }
      tok.classList.toggle('sacrificed-ghost', isSac);
      tok.classList.toggle('sacrifice-selectable', isSacSel);
      tok.classList.toggle('target-selectable', isTgtSel);
    }
  };

  for (let l = 0; l < 5; l++) {
    syncBoardLane(eRow.children[l], battle.board[1][l], 1, l, false);
    const pm = battle.board[0][l];
    const isPlaceable = Boolean(pp && pp.step === 'PLACE_LANE' && (pm === null || pp.sacLanes.includes(l)));
    syncBoardLane(pRow.children[l], pm, 0, l, isPlaceable);
  }

  const handZone = document.getElementById('playerHandZone');
  const totalHand = pst.hand.length;
  const isCompactHand = window.innerWidth > window.innerHeight && (window.innerHeight < 560 || window.innerWidth < 1024);
  const handOverlapMl = isCompactHand
    ? (totalHand <= 5 ? 2 : (totalHand === 6 ? -16 : (totalHand === 7 ? -28 : (totalHand === 8 ? -38 : (totalHand === 9 ? -48 : -58)))))
    : (totalHand <= 5 ? 8 : (totalHand === 6 ? -10 : (totalHand === 7 ? -24 : (totalHand === 8 ? -36 : (totalHand === 9 ? -48 : -60)))));
  const arcStepY = totalHand >= 8 ? 1.8 : 3.2;
  const arcStepDeg = totalHand >= 8 ? 1.1 : 1.9;

  const existingByUid = new Map();
  Array.from(handZone.children).forEach(ch => {
    if (ch && ch.dataset && ch.dataset.cardUid) existingByUid.set(String(ch.dataset.cardUid), ch);
  });

  const desiredNodes = [];
  pst.hand.forEach((inst, idx) => {
    if (pp && pp.card === inst) return;
    if (inst.hidden) {
      const back = document.createElement('div');
      back.dataset.cardUid = String(inst.uid);
      back.className = 'sv-hand-card sv-hand-card-back';
      back.innerHTML = '<div class="sv-hand-card-back-emblem"></div>';
      back.style.marginLeft = idx > 0 ? `${handOverlapMl}px` : '0px';
      const midB = (totalHand - 1) / 2;
      back.style.setProperty('--fan-y', `${(Math.abs(idx - midB) * arcStepY).toFixed(2)}px`);
      back.style.setProperty('--fan-rot', `${((idx - midB) * arcStepDeg).toFixed(2)}deg`);
      desiredNodes.push(back);
      return;
    }
    const playEval = evaluateCardPlayState(0, inst);
    const canPlayGlow = Boolean((battle.activeSide === 0 || battleMode === 'pvp_pass') && !battle.gameOver && !pp && playEval.ok);
    const condReady = canPlayGlow ? evaluateHandCardConditionReady(inst, 0, playEval) : false;
    const effE = getEffectiveEnergy(inst, pst);
    const dynX = getDynamicCardXValue(inst.data, inst);
    const liveBadge = getHandCardLiveCounterBadge(inst.data, inst);
    const kwHandSig = Object.keys(inst.activeKw || {}).sort().join(',');
    const grantHandCnt = getCardGrantedEffectsList(inst, 'hand').length;
    const costSig = `${inst.data.id}:${effE}:${inst.costReduction || 0}:${inst.fusedCount || 0}:${inst.currentAtk}:${inst.currentHp}:${inst.maxHp}:${inst.countdown || 0}:${kwHandSig}:${grantHandCnt}:${dynX === null ? '' : dynX}:${liveBadge}:${canPlayGlow ? playEval.mode + ':' + (playEval.costE ?? '') + '/' + (playEval.costB ?? '') : ''}`;

    let cardEl = existingByUid.get(String(inst.uid));
    if (!cardEl || !cardEl.dataset || cardEl.dataset.costSig !== costSig) {
      cardEl = buildHandCardDOM(inst.data, inst);
      if (cardEl.dataset) cardEl.dataset.costSig = costSig;
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
    }

    cardEl.classList.remove('sv-glow-green', 'sv-glow-blue', 'sv-glow-yellow', 'sv-glow-enhance', 'sv-hand-playable', 'sv-hand-playable-cond', 'sv-hand-playable-enhance', 'sv-hand-playable-enh');
    if (canPlayGlow) {
      cardEl.classList.add(playEval.glow);
      if (condReady) cardEl.classList.add('sv-hand-playable-cond');
      else if (playEval.mode === 'enhance') cardEl.classList.add('sv-hand-playable-enhance');
      else if (playEval.glow === 'sv-glow-yellow') cardEl.classList.add('sv-hand-playable-enh');
      else cardEl.classList.add('sv-hand-playable');
    }
    cardEl.classList.toggle('is-inspected', Boolean(battle.inspectedCard && battle.inspectedCard.inst === inst));
    cardEl.style.marginLeft = idx > 0 ? `${handOverlapMl}px` : '0px';
    const mid = (totalHand - 1) / 2;
    const offset = idx - mid;
    cardEl.style.setProperty('--fan-y', `${(Math.abs(offset) * arcStepY).toFixed(2)}px`);
    cardEl.style.setProperty('--fan-rot', `${(offset * arcStepDeg).toFixed(2)}deg`);
    if (hiddenCardUids.has(inst.uid) || (dragState.active && dragState.moved && dragState.inst === inst)) {
      cardEl.style.opacity = '0';
      cardEl.style.pointerEvents = 'none';
    } else {
      cardEl.style.opacity = '1';
      cardEl.style.pointerEvents = '';
    }
    desiredNodes.push(cardEl);
  });

  const sameOrder = handZone.children.length === desiredNodes.length && desiredNodes.every((n, i) => handZone.children[i] === n);
  if (!sameOrder) {
    handZone.innerHTML = '';
    desiredNodes.forEach(n => handZone.appendChild(n));
  }
}

async function onBoardLaneClicked(side, lane) {
  if (battle.gameOver) return;
  if (battle.pendingActivate && !battle.animating) {
    const pa = battle.pendingActivate;
    const opp = 1 - pa.side;
    const tm = battle.board[opp][lane];
    battle.pendingActivate = null;
    showSacrificeGuideBanner('', '');
    if (side === opp && tm && tm.data.type === 'minion' && !tm.activeKw['潜行']) {
      await cfRequestActivate(pa.side, pa.lane, { targetLane: lane });
    }
    renderAllBattleUI();
    return;
  }
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
      if (req === 'friendly_minion_pair') {
        const validLocs = getValidTargetLocations(actSide, 'friendly_minion', pp.card.data.type === 'spell', pp.sacLanes);
        if (validLocs.some(loc => loc.side === side && loc.lane === lane)) {
          sfx.play('click');
          if (pp.effectTargetLane === -1) {
            pp.effectTargetSide = side;
            pp.effectTargetLane = lane;
          } else if (pp.effectTargetLane === lane) {
            pp.effectTargetLane = -1;
          } else {
            pp.effectTargetLane2 = lane;
          }
          await advancePendingLeftTopPipeline();
          return;
        }
      } else {
        const validLocs = getValidTargetLocations(actSide, req, pp.card.data.type === 'spell', pp.sacLanes);
        if (validLocs.some(loc => loc.side === side && loc.lane === lane)) {
          sfx.play('click');
          pp.effectTargetSide = side;
          pp.effectTargetLane = lane;
          await advancePendingLeftTopPipeline();
          return;
        }
      }
    }
    if (pp.step === 'PLACE_LANE' && side === actSide && (battle.board[actSide][lane] === null || pp.sacLanes.includes(lane))) {
      sfx.play('play');
      const finalPP = Object.assign({}, pp);
      cancelPendingPlayToHand();
      await commitCardPlayWithAnimations(actSide, finalPP.card, finalPP.playEval, lane, finalPP.sacLanes, finalPP.effectTargetLane, Math.max(0, finalPP.choiceIdx), finalPP.handTargetUid, finalPP.effectTargetSide, finalPP.effectTargetLane2 ?? -1);
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

document.getElementById('playerEnergyPanel')?.addEventListener('click', (e) => {
  e.stopPropagation();
  showTriggeredEffectToast(
    { id: 'sys_extra_energy', name: '额外能量机制说明', type: 'spell', rarity: '传说', energy: 0, bones: 0, sacrifice: 0 },
    '💖【粉色额外能量】后手第1/4/7回合各获1点（无需点击，打牌自动优先消耗绿色能量）。每点在下一次额外能量到来前有效（第1→4回合、第4→7回合、第7→10回合），新能量到来或上限满10时旧的未用则失效。',
    420, 0, -1
  );
});
function getUnusedExtraEnergyEndTurnPrompt(side) {
  const st = battle && battle.leaders ? battle.leaders[side] : null;
  if (!st || (st.extraEnergy || 0) <= 0) return null;
  const expiresAt = st.extraEnergyExpiresAtTurn || RULES.energyMax;
  const expiringNext = ((battle.turn || 1) + 1) >= expiresAt || (st.maxEnergy || 1) >= (RULES.energyMax - 1);
  if (!expiringNext) return null;
  let maxSpendable = 0;
  for (const hc of (st.hand || [])) {
    const ev = evaluateCardPlayState(side, hc);
    if (ev.ok) maxSpendable += (ev.costE !== undefined ? ev.costE : getEffectiveEnergy(hc, st));
  }
  for (let l = 0; l < 5; l++) {
    const m = battle.board[side]?.[l];
    if (m && !m.activatedThisTurn && m.data.ast?.activate && (m.data.ast.activate.energy || 0) > 0) {
      if (getTotalAvailableEnergy(st) >= m.data.ast.activate.energy) maxSpendable += m.data.ast.activate.energy;
    }
  }
  const canSpendNow = maxSpendable > (st.energy || 0);
  if (!canSpendNow) return null;
  return {
    title: '粉色额外能量即将失效',
    body: '你当前还有未使用的 <b style="color:#f472b6;">粉色额外能量</b>，下回合开始时将会失效（被新能量替换或达到上限），且当前仍有可消耗该能量的出牌/启动选项。确定要直接结束回合吗？'
  };
}

document.addEventListener('click', (e) => {
  if (e.target && e.target.closest && e.target.closest('#btnCancelExtraEndTurn')) {
    const _eem = document.getElementById('extraEnergyEndTurnModal'); if (_eem) _eem.style.display = 'none';
  } else if (e.target && e.target.closest && e.target.closest('#btnConfirmExtraEndTurn')) {
    const _eem = document.getElementById('extraEnergyEndTurnModal'); if (_eem) _eem.style.display = 'none';
    const curSide = (battleMode === 'pvp_pass') ? battle.activeSide : 0;
    sfx.play('click');
    executeEndTurnSequence(curSide);
  }
});

document.getElementById('btnTurnOrb').addEventListener('click', () => {
  if ((battleMode === 'pvp_online' ? onlineIsMyTurn() : (battle.activeSide === 0 || battleMode === 'pvp_pass')) && !battle.gameOver && !battle.animating) {
    const curSide = (battleMode === 'pvp_pass') ? battle.activeSide : 0;
    const promptInfo = getUnusedExtraEnergyEndTurnPrompt(curSide);
    if (promptInfo) {
      const modal = document.getElementById('extraEnergyEndTurnModal');
      if (modal) {
        const titleEl = modal.querySelector('.cf-extra-title') || modal.querySelector('span:last-child');
        const bodyEl = modal.querySelector('p');
        if (titleEl) titleEl.textContent = promptInfo.title;
        if (bodyEl) bodyEl.innerHTML = promptInfo.body;
        sfx.play('click');
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        return;
      }
    }
    sfx.play('click');
    executeEndTurnSequence(curSide);
  }
});

document.getElementById('btnRestartMatch').addEventListener('click', () => {
  if (battleMode === 'pvp_online') return;
  sfx.play('play');
  initNewBattle();
});

