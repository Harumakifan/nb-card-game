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
  document.getElementById('svDetailPanel').classList.add('hidden'); document.querySelectorAll('#playerHandZone .sv-hand-card.is-inspected').forEach(el => el.classList.remove('is-inspected')); if (typeof syncDetailSelectionHighlight === 'function') syncDetailSelectionHighlight();

  if (!choices.length && !needSac && !needTarget) {
    window._cfLastDragDropPos = { x: e.clientX, y: e.clientY, uid: String(inst.uid), ts: Date.now() };
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
      document.getElementById('svDetailPanel').classList.add('hidden'); document.querySelectorAll('#playerHandZone .sv-hand-card.is-inspected').forEach(el => el.classList.remove('is-inspected')); if (typeof syncDetailSelectionHighlight === 'function') syncDetailSelectionHighlight();
    } else if (battle.inspectedCard && !target.closest('#svDetailPanel')) {
      battle.inspectedCard = null;
      document.getElementById('svDetailPanel').classList.add('hidden');
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
    document.getElementById('svDetailPanel').classList.add('hidden'); document.querySelectorAll('#playerHandZone .sv-hand-card.is-inspected').forEach(el => el.classList.remove('is-inspected')); if (typeof syncDetailSelectionHighlight === 'function') syncDetailSelectionHighlight();
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
  if (choices.length > 0 && playEval.mode !== 'accelerate' && playEval.mode !== 'crystallize' && pp.choiceIdx === -1) {
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
  const req = getCardTargetRequirement(card, isEnh, pp.choiceIdx, playEval.mode);
  const otherHand = battle.leaders[actSide].hand.filter(h => h !== card);
  if (req === 'hand_card' && pp.handTargetUid === -1 && otherHand.length > 0) {
    pp.step = 'HAND_SELECT';
    const isDeusAccel = (card.data.id === 'cmwlp6mctrvla' && playEval.mode === 'accelerate');
    updatePendingLeftTopView(isDeusAccel ? '🃏 请选择 1 张要保留的手牌' : '🃏 请在中央选择 1 张手牌洗入牌库');
    showSacrificeGuideBanner('🃏 选择手牌目标', isDeusAccel ? '请选择 1 张保留的手牌（其余手牌将弃置并重抽等量卡牌）' : '请点击选择 1 张手牌洗回牌库');
    openSingleHandPickModal(card, otherHand, isDeusAccel ? '【机械降神·激奏】请选择 1 张要保留的手牌（其余手牌弃置并抽等量牌）' : '请选择 1 张手牌洗入牌库并抽取 1 张卡牌');
    renderAllBattleUI();
    return;
  }

  if (req === 'friendly_minion_pair') {
    const validLocs = getValidTargetLocations(actSide, 'friendly_minion', card.data.type === 'spell', pp.sacLanes);
    if (validLocs.length < 2) {
      if (card.data.type === 'spell') { cancelPendingPlayToHand(); return; }
    } else if (pp.effectTargetLane === -1 || pp.effectTargetLane2 === -1 || pp.effectTargetLane2 === undefined) {
      pp.step = 'TARGET';
      const picked = pp.effectTargetLane >= 0 ? 1 : 0;
      updatePendingLeftTopView(`🎯 请选择第 ${picked + 1}/2 个友方随从 (${picked}/2)`);
      showSacrificeGuideBanner(`🎯 选择交换目标 (${picked}/2)`, `请点击第 ${picked + 1} 个要交换攻击力和生命值的友方随从`);
      renderAllBattleUI();
      return;
    }
  } else if (req && req !== 'hand_card' && pp.effectTargetLane === -1) {
    const validLocs = getValidTargetLocations(actSide, req, card.data.type === 'spell', pp.sacLanes);
    if (validLocs.length > 0) {
      pp.step = 'TARGET';
      const msgTarget = req === 'enemy_minion_or_leader' ? '请点击敌方随从或敌方主战者作为目标' : '请点击战场上高亮的目标卡牌';
      updatePendingLeftTopView(`🎯 ${msgTarget}`);
      showSacrificeGuideBanner('🎯 选择效果目标', `${msgTarget}以发动『${card.data.name}』的效果`);
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
    await commitCardPlayWithAnimations(actSide, finalPP.card, finalPP.playEval, 0, finalPP.sacLanes, finalPP.effectTargetLane, Math.max(0, finalPP.choiceIdx), finalPP.handTargetUid, finalPP.effectTargetSide, finalPP.effectTargetLane2 ?? -1);
    return;
  }

  // 非献祭卡若起手直接拖到了空战道上，自动落位；献祭卡 (initialDropLane === -1) 则必须进入 PLACE_LANE 让玩家选择要放置的空位！
  if (pp.initialDropLane >= 0 && needSac === 0 && battle.board[actSide][pp.initialDropLane] === null) {
    const finalPP = Object.assign({}, pp);
    cancelPendingPlayToHand();
    await commitCardPlayWithAnimations(actSide, finalPP.card, finalPP.playEval, finalPP.initialDropLane, finalPP.sacLanes, finalPP.effectTargetLane, Math.max(0, finalPP.choiceIdx), finalPP.handTargetUid, finalPP.effectTargetSide, finalPP.effectTargetLane2 ?? -1);
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
      modal.style.display = 'none';
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
  modal.style.display = 'flex';
}

