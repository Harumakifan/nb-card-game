let _battleSessionSeq = 0;
function initNewBattle(opts = {}) {
  const _curSession = ++_battleSessionSeq;
  if (!opts || !opts.spectate) {
    window.CF_SPECTATE_ACTIVE = false;
  }
  battle.__cfWasSpectate = Boolean((opts && opts.spectate) || window.CF_SPECTATE_ACTIVE);
  const _specBadgeInit = document.getElementById('cfSpectateBadge');
  if (_specBadgeInit) _specBadgeInit.classList.toggle('hidden', !window.CF_SPECTATE_ACTIVE);
  battle.mulliganLocked = false;
  if (typeof _mulliganCardCache !== 'undefined' && _mulliganCardCache && _mulliganCardCache.clear) _mulliganCardCache.clear();
  try { if (typeof cfTraceReset === 'function') cfTraceReset(); } catch (e) {}
  if (typeof syncOnlineAvatarsAndHud === 'function') syncOnlineAvatarsAndHud();
  const btnAgain = document.getElementById('btnVicPlayAgain'); if (btnAgain) btnAgain.textContent = '🔄 再战一局';
  const btnDeck = document.getElementById('btnVicGoDeck'); if (btnDeck) btnDeck.textContent = '🏠 返回主界面';
  battle.turn = 1;
  battle.turnLogs = [];
  battle.firstPlayerSide = (battleMode === 'pve' && Math.random() < 0.5) ? 1 : 0;
  battle.activeSide = battle.firstPlayerSide;
  battle.gameOver = false;
  battle.animating = false;
  battle.board = [[null, null, null, null, null], [null, null, null, null, null]];
  battle.inspectedCard = null;
  battle.pendingPlay = null;

  document.getElementById('svDetailPanel').classList.add('hidden'); document.querySelectorAll('#playerHandZone .sv-hand-card.is-inspected').forEach(el => el.classList.remove('is-inspected')); if (typeof syncDetailSelectionHighlight === 'function') syncDetailSelectionHighlight();
  document.getElementById('pendingLeftTopContainer').classList.add('hidden');
  document.getElementById('modeChoiceCenterPanel').classList.add('hidden');
  document.getElementById('handPickModal').classList.add('hidden');
  showSacrificeGuideBanner('', '');
  const vm = document.getElementById('victoryDefeatModal'); if (vm) vm.classList.add('hidden');
  const pm = document.getElementById('pvpHandoverModal'); if (pm) pm.classList.add('hidden');
  document.getElementById('svEffectFeed').innerHTML = '';

  document.getElementById('playerLeaderImg').src = renderLeaderPortraitDataURI(userAvatarConfig);
  const enemyAvatarId = aiDeckArchetype === 'dragon' ? 'cmwdv3usmmzyp' : (aiDeckArchetype === 'undead' ? 'cmwbyp6f419ju' : (aiDeckArchetype === 'lastwords' ? 'cmwghmf9xj9dv' : (aiDeckArchetype === 'selfdamage' ? 'cmwgyyghnbr4n' : (aiDeckArchetype === 'guardian' ? 'cmwhpb43k6m14' : 'cmwc0t61ade7b'))));
  document.getElementById('enemyLeaderImg').src = getAnimeIllustrationDataURI((typeof cardsById !== 'undefined' && cardsById[enemyAvatarId]) || { id: enemyAvatarId, name: '敌方主战者', type: 'minion', rarity: '传说' });

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
      if (hasFuse && cd.id !== 'cmwdi4pwz3c0k') return false;
    }
    return true;
  });
  while (eDeckIds.length < RULES.deckSize) {
    eDeckIds.push(aiDeckArchetype === 'dragon' ? 'cmwe1tj7fh3ot' : 'cmwbyhrbei4w8');
  }

  const diffCfg = AI_DIFFICULTY_CONFIG[aiDifficulty] || AI_DIFFICULTY_CONFIG.normal;
  const archName = aiDeckArchetype === 'dragon' ? '苍穹龙族主战者' : (aiDeckArchetype === 'undead' ? '亡灵骨海主战者' : (aiDeckArchetype === 'lastwords' ? '谢幕曲协奏主战者' : (aiDeckArchetype === 'selfdamage' ? '狂乱血蔷薇主战者' : (aiDeckArchetype === 'guardian' ? '圣盾守护军团主战者' : '机械军团主战者'))));

  battle.leaders[0] = createLeaderState(0, pDeckIds);
  battle.leaders[0].hp = 30;
  battle.leaders[0].maxHp = 30;

  battle.leaders[1] = createLeaderState(1, eDeckIds);
  battle.leaders[1].hp = battleMode === 'pve' ? diffCfg.hp : 30;
  battle.leaders[1].maxHp = battleMode === 'pve' ? diffCfg.hp : 30;
  battle.leaders[1].handLimit = RULES.handLimit;

  const titleEl = document.getElementById('uiEnemyLeaderTitle');
  if (titleEl) {
    titleEl.textContent = battleMode === 'pve' ? `${diffCfg.label}·${archName}` : `👥 玩家 2 (后手)`;
  }

  const orderBadge = document.getElementById('uiTurnOrderBadge');
  if (orderBadge) {
    orderBadge.textContent = battle.firstPlayerSide === 0 ? '🎲 我方先手' : '🎲 我方后手';
  }
  const mulOrder = document.getElementById('mulliganOrderLabel');
  if (mulOrder) {
    mulOrder.textContent = battle.firstPlayerSide === 0 ? '先手 · FIRST' : '后手 · SECOND';
  }

  prepareOpeningHand(0);
  prepareOpeningHand(1);
  if (battleMode === 'pve' && diffCfg.drawCrestTurns > 0) {
    battle.leaders[1].crests.push({
      id: 'crest_ai_difficulty_draw',
      name: aiDifficulty === 'inferno' ? '纹章：炼狱补给' : '纹章：困难补给',
      countdown: diffCfg.drawCrestTurns,
      desc: '回合开始时，抽取1张卡牌。',
      cardData: {
        id: 'sys_ai_crest',
        name: `${diffCfg.label}补给纹章`,
        type: 'spell',
        rarity: '传说',
        energy: 0, bones: 0, sacrifice: 0,
        fullText: '回合开始时，抽取1张卡牌。'
      }
    });
  }

  openMulliganDualBox();
  renderAllBattleUI();
}

async function playExtraEnergyVFX(side, kind = 'use') {
  const orbEl = side === 0
    ? (document.getElementById('playerExtraPinkOrb') || document.getElementById('playerEnergyOrbs'))
    : (document.getElementById('enemyExtraPinkOrb') || document.getElementById('enemyEnergyOrbs'));
  if (orbEl) {
    orbEl.classList.remove('sv-single-pink-orb-pulse');
    void orbEl.offsetWidth;
    orbEl.classList.add('sv-single-pink-orb-pulse');
    setTimeout(() => orbEl.classList?.remove('sv-single-pink-orb-pulse'), 580);
  }
}

async function syncSecondPlayerExtraEnergyOnTurnStart(side) {
  if (!battle || !battle.leaders || !battle.leaders[side]) return;
  const st = battle.leaders[side];
  if (!st.extraEnergyGrantedTurns) st.extraEnergyGrantedTurns = {};
  // 1. 先检查旧的未使用额外能量是否到期（下一次额外能量到来时旧的消失不叠加，或能量上限已满10时消失）
  const EXTRA_ENERGY_TURNS = [1, 4, 7];
  if ((st.extraEnergy || 0) > 0 && (battle.turn >= (st.extraEnergyExpiresAtTurn || 0) || st.maxEnergy >= RULES.energyMax)) {
    st.extraEnergy = 0;
    st.extraEnergyExpiresAtTurn = 0;
  }
  // 2. 后手在第 1、4、7 回合各获得 1 点粉色额外能量，持续到下一次额外能量到来前（4/7/10回合）有效
  if (side !== (battle.firstPlayerSide ?? 0) && EXTRA_ENERGY_TURNS.includes(battle.turn) && !st.extraEnergyGrantedTurns[battle.turn]) {
    st.extraEnergyGrantedTurns[battle.turn] = true;
    if (st.maxEnergy < RULES.energyMax) {
      const nextGrantTurn = EXTRA_ENERGY_TURNS.find(t => t > battle.turn) || RULES.energyMax;
      st.extraEnergy = 1;
      st.extraEnergyExpiresAtTurn = nextGrantTurn;
      sfx.play('buff');
      renderAllBattleUI();
      await playExtraEnergyVFX(side, 'grant');
      await showTriggeredEffectToast({ id: 'sys_extra_energy', name: '额外能量', type: 'spell', rarity: '传说', energy: 0, bones: 0, sacrifice: 0 }, `💖【额外能量】${side === 0 ? '我方' : '敌方'}第 ${battle.turn} 回合获得 1 点粉色额外能量（第 ${nextGrantTurn} 回合前有效）！`, 220, side, -1);
    }
  }
}

function getTotalAvailableEnergy(st) {
  return (st ? (st.energy || 0) + (st.extraEnergy || 0) : 0);
}

function spendLeaderEnergy(side, amount) {
  const st = battle.leaders[side];
  if (!st || amount <= 0) return { spentGreen: 0, spentExtra: 0 };
  const spentGreen = Math.min(st.energy || 0, amount);
  st.energy = Math.max(0, (st.energy || 0) - spentGreen);
  const rem = amount - spentGreen;
  let spentExtra = 0;
  if (rem > 0 && (st.extraEnergy || 0) > 0) {
    spentExtra = Math.min(st.extraEnergy, rem);
    st.extraEnergy = Math.max(0, st.extraEnergy - spentExtra);
    if (st.extraEnergy === 0) st.extraEnergyExpiresAtTurn = 0;
  }
  if (spentExtra > 0) {
    sfx.play('legend');
    playExtraEnergyVFX(side, 'use');
    showTriggeredEffectToast({ id: 'sys_extra_energy', name: '额外能量', type: 'spell', rarity: '传说', energy: 0, bones: 0, sacrifice: 0 }, `💖【额外能量】${side === 0 ? '我方' : '敌方'}消耗了 1 点粉色额外能量！`, 220, side, -1);
  }
  return { spentGreen, spentExtra };
}

async function activateExtraEnergyAnimated(side) {
  if (!battle || battle.gameOver || battle.activeSide !== side) return false;
  const st = battle.leaders && battle.leaders[side];
  if (!st || (st.extraEnergy || 0) <= 0) return false;
  st.extraEnergy = 0;
  st.extraEnergyExpiresAtTurn = 0;
  st.energy += 1;
  sfx.play('legend');
  recordBattleTurnEvent(side, 'effect', '激活【额外能量】：本回合当前能量 +1', { id: 'sys_extra_energy', name: '额外能量', type: 'spell', rarity: '传说' });
  renderAllBattleUI();
  await playExtraEnergyVFX(side, 'use');
  await showTriggeredEffectToast({ id: 'sys_extra_energy', name: '额外能量', type: 'spell', rarity: '传说', energy: 0, bones: 0, sacrifice: 0 }, `💖【额外能量】${side === 0 ? '我方' : '敌方'}使用了粉色额外能量：本回合当前能量 +1！`, 260, side, -1);
  return true;
}

function openMulliganDualBox() {
  battle.luckyCoinGranted = false;
  battle.luckyCoinT3Granted = false;
  battle.luckyCoinT5Granted = false;
  battle.luckyCoinT7Granted = false;
  const _sg = document.getElementById('mulliganSwapSlots');
  const _kg = document.getElementById('mulliganKeepSlots');
  if (_sg) _sg.innerHTML = '';
  if (_kg) _kg.innerHTML = '';
  if (typeof _mulliganCardCache !== 'undefined') _mulliganCardCache.clear();
  battle.mulliganLocked = false;
  battle.mulliganSwapped = [false, false, false, false];
  const mModal = document.getElementById('mulliganModal');
  if (mModal) mModal.style.pointerEvents = 'auto';
  if (typeof startMulliganCountdownTimer === 'function') startMulliganCountdownTimer();
  document.getElementById('mulliganModal').classList.remove('hidden');
  renderMulliganDualBox();
}

let mulliganDrag = { active: false, idx: -1, startX: 0, startY: 0, moved: false };

const _mulliganCardCache = new Map();
function renderMulliganDualBox() {
  const swapGrid = document.getElementById('mulliganSwapSlots');
  const keepGrid = document.getElementById('mulliganKeepSlots');
  const hand = battle.leaders[0].hand;

  if (swapGrid.children.length !== 4 || keepGrid.children.length !== 4) {
    swapGrid.innerHTML = '';
    keepGrid.innerHTML = '';
    _mulliganCardCache.clear();
    for (let i = 0; i < 4; i++) {
      const topSlot = document.createElement('div');
      topSlot.className = 'cf-mulligan-slot w-[154px] h-[216px] rounded-xl border border-slate-700/80 bg-slate-950/55 flex items-center justify-center relative shrink-0';
      topSlot.innerHTML = `
        <svg viewBox="0 0 64 64" class="w-16 h-16 text-slate-600/50 absolute pointer-events-none">
          <path fill="currentColor" d="M32 10 A22 22 0 0 1 52 23 L57 18 L55 32 L41 30 L47 25 A16 16 0 0 0 17 28 L11 28 A22 22 0 0 1 32 10 Z M32 54 A22 22 0 0 1 12 41 L7 46 L9 32 L23 34 L17 39 A16 16 0 0 0 47 36 L53 36 A22 22 0 0 1 32 54 Z"/>
        </svg>
      `;
      const botSlot = document.createElement('div');
      botSlot.className = 'cf-mulligan-slot w-[154px] h-[216px] rounded-xl border border-slate-700/80 bg-slate-950/55 flex items-center justify-center relative shrink-0';
      swapGrid.appendChild(topSlot);
      keepGrid.appendChild(botSlot);
    }
  }

  for (let i = 0; i < 4; i++) {
    const inst = hand[i];
    const isSwapped = battle.mulliganSwapped[i];
    const topSlot = swapGrid.children[i];
    const botSlot = keepGrid.children[i];
    if (!inst) continue;

    let cardEl = _mulliganCardCache.get(String(inst.uid));
    if (!cardEl) {
      cardEl = buildHandCardDOM(inst.data, inst);
      cardEl.style.cursor = 'grab';
      cardEl.style.touchAction = 'none';
      const blueCycle = document.createElement('div');
      blueCycle.className = 'mulligan-swap-ring hidden absolute inset-0 flex items-center justify-center pointer-events-none z-20';
      blueCycle.innerHTML = `
        <div class="w-20 h-20 rounded-full border-4 border-sky-400/90 bg-sky-500/20 shadow-[0_0_16px_#38bdf8] flex items-center justify-center">
          <span class="text-2xl text-sky-300 font-black">↻</span>
        </div>
      `;
      cardEl.appendChild(blueCycle);
      cardEl.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        mulliganDrag = { active: true, idx: i, inst: inst, startX: e.clientX, startY: e.clientY, moved: false };
      });
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
      _mulliganCardCache.set(String(inst.uid), cardEl);
    }

    const ring = cardEl.querySelector('.mulligan-swap-ring');
    if (ring) ring.classList.toggle('hidden', !isSwapped);
    if (!topSlot || !botSlot) continue;
    const isDraggingThis = Boolean(mulliganDrag.active && mulliganDrag.moved && mulliganDrag.idx === i);
    topSlot.classList.toggle('cf-mulligan-has-card', Boolean(isSwapped) && !isDraggingThis);
    botSlot.classList.toggle('cf-mulligan-has-card', !isSwapped && !isDraggingThis);
    topSlot.classList.toggle('cf-mulligan-slot-pending', Boolean(isSwapped) && isDraggingThis);
    botSlot.classList.toggle('cf-mulligan-slot-pending', !isSwapped && isDraggingThis);
    cardEl.style.opacity = isDraggingThis ? '0' : '1';
    const targetParent = isSwapped ? topSlot : botSlot;
    const otherParent = isSwapped ? botSlot : topSlot;
    otherParent.querySelectorAll('.sv-hand-card').forEach(x => { if (x !== cardEl) x.remove(); });
    targetParent.querySelectorAll('.sv-hand-card').forEach(x => { if (x !== cardEl) x.remove(); });
    if (cardEl.parentElement !== targetParent) {
      targetParent.appendChild(cardEl);
    }
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
  const _sid = _battleSessionSeq;
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
      if (slotEl) { slotEl.querySelectorAll('.sv-hand-card').forEach(x => x.remove()); slotEl.classList.remove('cf-mulligan-has-card'); }
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
      if (kSlot) {
        kSlot.classList.add('cf-mulligan-slot-pending');
        if (kSlot.firstElementChild) {
          kSlot.firstElementChild.style.opacity = '0';
          kSlot.firstElementChild.style.transition = 'none';
          kSlot.firstElementChild.style.transform = 'translateY(-24px)';
        }
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
      if (kSlot) {
        kSlot.classList.remove('cf-mulligan-slot-pending');
        if (kSlot.firstElementChild) {
          kSlot.firstElementChild.style.opacity = '1';
          kSlot.firstElementChild.classList.add('sv-glow-green');
        }
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
  if (_sid !== _battleSessionSeq) return;
  if (battleMode === 'pve' && battle.firstPlayerSide === 1) {
    await beginTurnSequence(1);
    if (_sid !== _battleSessionSeq || battle.gameOver) return;
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

