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
    cardData: crestDef.cardData || null,
    sourceUid: crestDef.sourceUid || null
  });
  sfx.play('legend');
  renderAllBattleUI();
  await playCrestTriggerVFX(side, crestDef.id);
  return true;
}

async function playCrestTriggerVFX(side, crestId) {
  if (typeof recordLocalVfx === 'function') recordLocalVfx({ kind: 'crest_vfx', side, crestId });
  const row = document.getElementById(side === 0 ? 'playerCrestsRow' : 'enemyCrestsRow');
  const el = row ? row.querySelector(`[data-crest-id="${crestId}"]`) : null;
  if (el) {
    el.classList.remove('crest-trigger-anim');
    void el.offsetWidth;
    el.classList.add('crest-trigger-anim');
  }
  const anchor = el || getLaneDOM(side, -1);
  if (anchor && typeof anchor.getBoundingClientRect === 'function') {
    const r = anchor.getBoundingClientRect();
    if (r && r.width > 0) {
      const pop = document.createElement('div');
      pop.className = 'sv-crest-icon-vfx px-2.5 py-1 rounded-full bg-amber-950/95 border-2 border-amber-300 text-amber-200 text-xs font-black shadow-[0_0_20px_rgba(251,191,36,0.85)]';
      pop.style.left = `${r.left + r.width / 2}px`;
      pop.style.top = `${r.top + r.height / 2}px`;
      pop.textContent = '🛡️ 纹章触发';
      document.body.appendChild(pop);
      setTimeout(() => pop.remove(), 840);
    }
  }
  await sleep(260);
}

// 统一触发「进入战场时」的被动光环效果（随从召唤/打出进场，以及【变身】视为新随从进场均调用此函数！）
function isGuardMinionInst(m) {
  if (!m || !m.data || m.data.type !== 'minion') return false;
  return Boolean((m.activeKw && m.activeKw['守护']) || hasGuardianKeyword(m.data));
}

function recordDestroyedMinionCounters(st, m) {
  if (!st || !m) return;
  if (hasAnyLastWords(m)) st.destroyedLastWordsCount = (st.destroyedLastWordsCount || 0) + 1;
  if (isGuardMinionInst(m)) st.destroyedGuardCount = (st.destroyedGuardCount || 0) + 1;
}

function hasReachedLastWordsThreshold(side, threshold = 10) {
  const st = battle && battle.leaders ? battle.leaders[side] : null;
  return Boolean(st && (st.destroyedLastWordsCount || 0) >= threshold);
}

async function triggerBoardEnterPassivesAnimated(side, inst, lane, depth = 0) {
  if (!inst || depth > 10 || battle.board[side][lane] !== inst) return;

  // 1) 机械进场联动：赛博牧羊人 (cmwbxu7u3tpyo)：机械 +0/+1，电子羊额外 +1/+0
  if (inst.data.type === 'minion' && isMechCard(inst.data)) {
    const isSheep = inst.data.id === 'cmwby0dy7g2pc' || inst.data.name === '电子羊';
    const addAtk = isSheep ? 1 : 0;
    const addHp = 1;
    for (let l = 0; l < 5; l++) {
      const ally = battle.board[side][l];
      if (ally && ally !== inst && ally.data.id === 'cmwbxu7u3tpyo' && battle.board[side][lane] === inst) {
        await playSynergyBeam(getLaneDOM(side, l), getLaneDOM(side, lane), '#34d399', 240);
        inst.currentAtk += addAtk; inst.maxHp += addHp; inst.currentHp += addHp;
        const buffTxt = `+${addAtk}/+${addHp}`;
        addGrantedEffect(inst, `来源：【赛博牧羊人】 → 获得 ${buffTxt}`);
        spawnFloatNumber(side, lane, buffTxt, '#4ade80');
        renderAllBattleUI();
        await showTriggeredEffectToast(ally.data, `使进入战场的『${inst.data.name}』获得 ${buffTxt}。`, 220);
      }
    }
  }

  // 1b-00) 蔷薇的妖精 (cmwhlefn11ybd) 【随从进场时】：对自己主战者造成1点伤害
  if (inst.data.id === 'cmwhlefn11ybd' && battle.board[side][lane] === inst) {
    await showTriggeredEffectToast(inst.data, '【随从进场时】『蔷薇的妖精』对己方主战者造成1点伤害！', 220);
    await dealDamageToLeaderAnimated(side, 1, inst);
  }
  // 1b-0) 双炮神罚 (cmwm86ka6xbwr) 【随从进场时】：对所有敌方随从造成4点伤害，对敌方主战者造成2点伤害
  if (inst.data.id === 'cmwm86ka6xbwr' && battle.board[side][lane] === inst) {
    const opp = 1 - side;
    await showTriggeredEffectToast(inst.data, '【双炮神罚·进场】对所有敌方随从造成2点伤害，对敌方主战者造成2点伤害！', 280);
    await playRowWideVFX(opp, 'fire_aoe', 340);
    for (let el = 0; el < 5; el++) {
      if (battle.board[opp][el] && battle.board[opp][el].data.type === 'minion') {
        await dealDamageToMinionAnimated(opp, el, 2, inst);
      }
    }
    if (!battle.gameOver) await dealDamageToLeaderAnimated(opp, 2, inst);
  }
  // 1b) 机械降神 (cmwlp6mctrvla) 【随从进场时】（仅瞬念召唤或进场触发）
  if (inst.data.id === 'cmwlp6mctrvla' && inst._isInvocation && battle.board[side][lane] === inst) {
    const opp = 1 - side;
    await showTriggeredEffectToast(inst.data, '【随从进场时】对所有敌方随从造成6点伤害，回复所有友方随从与己方主战者6点生命值！', 280);
    await playRowWideVFX(opp, 'damage_wave', 240);
    await applyAoeDamageSimultaneousAnimated([0,1,2,3,4].map(el => ({ side: opp, lane: el })), 6, inst);
    for (let fl = 0; fl < 5; fl++) {
      const fm = battle.board[side][fl];
      if (fm && fm.data.type === 'minion' && fm.currentHp < fm.maxHp) {
        const healAmt = Math.min(6, fm.maxHp - fm.currentHp);
        fm.currentHp += healAmt;
        spawnFloatNumber(side, fl, `+${healAmt}`, '#4ade80');
      }
    }
    await healLeaderAnimated(side, 6, inst.data.name);
    renderAllBattleUI();
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
        await showTriggeredEffectToast(ally.data, `己方龙族随从进场，『龙心秘宝』倒计时-1！`, 200, side, l);
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

  // 5) 纹章：圣骑士士官长 (crest_paladin_sergeant)：被破坏守护随从 > 10 时，守护随从进场 +1/+2
  const stEnter = battle.leaders[side];
  if (!battle.gameOver && inst.data.type === 'minion' && (inst.activeKw['守护'] || hasGuardianKeyword(inst.data)) && stEnter && (stEnter.destroyedGuardCount || 0) > 10 && stEnter.crests && stEnter.crests.some(cr => cr.id === 'crest_paladin_sergeant' && cr.sourceUid !== inst.uid)) {
    const cr = stEnter.crests.find(x => x.id === 'crest_paladin_sergeant' && x.sourceUid !== inst.uid);
    if (battle.board[side][lane] === inst) {
      await playCrestTriggerVFX(side, cr.id);
      inst.currentAtk += 1;
      inst.currentHp += 2;
      inst.maxHp += 2;
      addGrantedEffect(inst, '来源：【纹章：圣骑士士官长】 → 守护随从进场 +1/+2');
      spawnFloatNumber(side, lane, '+1/+2', '#38bdf8');
      await showTriggeredEffectToast(cr.cardData || inst.data, `【${cr.name}】已破坏守护>10，『${inst.data.name}』进场获得 +1/+2！`, 220);
      renderAllBattleUI();
    }
  }

  // 5b) 纹章：孵化万物的龙女 (crest_dragon_girl)：每当龙族随从进入战场时，使其倒计时-1且获得【屏障】
  if (!battle.gameOver && inst.data.type === 'minion' && hasRace(inst.data, '龙族') && battle.board[side][lane] === inst && stEnter && stEnter.crests && stEnter.crests.some(cr => cr.id === 'crest_dragon_girl' && cr.sourceUid !== inst.uid)) {
    const cr = stEnter.crests.find(x => x.id === 'crest_dragon_girl' && x.sourceUid !== inst.uid);
    await playCrestTriggerVFX(side, cr.id);
    inst.activeKw['屏障'] = 1;
    addGrantedEffect(inst, '来源：【纹章：孵化万物的龙女】 → 获得【屏障】');
    if (inst.data.id === 'cmwdui6uam6xe' || inst.data.id === 'cmwdukf0l090w') {
      inst.extraLastWords = inst.extraLastWords || [];
      inst.extraLastWords.push({ op: 'summon', target: '雏龙的蛋', count: 1 });
      addGrantedEffect(inst, '来源：【纹章：孵化万物的龙女】 → 获得【谢幕曲】召唤1个雏龙的蛋');
    }
    spawnFloatNumber(side, lane, '🛡️屏障', '#38bdf8');
    if (inst.countdown !== null && inst.countdown !== undefined && inst.countdown > 0) {
      await showTriggeredEffectToast(cr.cardData || inst.data, `【${cr.name}】『${inst.data.name}』获得【屏障】且倒计时-1！`, 220);
      await reduceCardCountdown(side, lane, 1, cr.cardData || inst, depth + 1);
    } else {
      await showTriggeredEffectToast(cr.cardData || inst.data, `【${cr.name}】『${inst.data.name}』获得【屏障】！`, 220);
    }
    renderAllBattleUI();
  }

}

// 变身机制：「将卡牌变成另一张卡牌，失去原本的所有效果，生命值和攻击力变成新卡牌的数值，变身不触发谢幕曲也不触发入场曲；但变身视为新随从进场，能触发进场效果（孵化装置、驯龙师、龙心秘宝等）！」

async function transformMinionAnimated(side, lane, targetCardId) {
  const cur = battle.board[side][lane];
  const newData = cardsById[targetCardId] || cardsByName[targetCardId];
  if (!cur || !newData) return null;
  const newInst = createCardInstance(newData, side);
  if (!newInst) return null;
  newInst.enterOrder = cur.enterOrder || (++globalEnterSeq);
  battle.board[side][lane] = newInst;
  spawnFloatNumber(side, lane, `✨变身『${newData.name}』`, '#fbbf24');
  renderAllBattleUI();
  await sleep(180);
  await triggerBoardEnterPassivesAnimated(side, newInst, lane, 1);
  return newInst;
}

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
  const _sid = _battleSessionSeq;
  try { if (typeof cfTraceSnapshot === 'function') cfTraceSnapshot('turn_start'); } catch (e) {}
  if (battle.gameOver) return;
  /* 额外能量由下方 maxEnergy 更新后统一结算 */
  recordBattleTurnEvent(side, 'turn', `第 ${battle.turn} 回合开始`, null);
  if (battleMode === 'pve' && side === 0 && typeof savePveBattleProgress === 'function') savePveBattleProgress();
  if (typeof startTurnCountdownTimer === 'function') startTurnCountdownTimer();
  battle.activeSide = side;
  battle.animating = true;
  const st = battle.leaders[side];
  st.cardsPlayedThisTurn = 0;
  st.usedLuckyCoinThisTurn = false;
  st.prevSelfTurnDamageCount = st.selfTurnDamageCount || 0;
  st.selfTurnDamageCount = 0;
  if (battle.turn > 1) {
    st.maxEnergy = Math.min(RULES.energyMax, st.maxEnergy + 1);
  }
  st.energy = st.maxEnergy;
  await syncSecondPlayerExtraEnergyOnTurnStart(side);

  for (let l = 0; l < 5; l++) {
    if (battle.board[side][l]) {
      battle.board[side][l].activatedThisTurn = false;
      battle.board[side][l].attackedThisTurn = false;
    }
  }
  st.hand.forEach(c => c.fusedThisTurn = false);

  renderAllBattleUI();
  await playTurnStartBanner(side);

  // 1) 回合开始时：主战者纹章按获得顺序从早到晚倒计时 -1，倒计时归零的纹章直接消失
  if (st.crests && st.crests.length > 0) {
    const crestSnapshot = [...st.crests];
    for (const cr of crestSnapshot) {
      if (cr.countdown === null || cr.countdown === undefined) continue;
      if (cr.id === 'crest_ai_difficulty_draw') {
        await playCrestTriggerVFX(side, cr.id);
        await showTriggeredEffectToast(cr.cardData, `【${cr.name}】回合开始时：抽取 1 张卡牌！`, 240);
        await drawCardAnimated(side);
      }
      cr.countdown -= 1;
      await playCrestTriggerVFX(side, cr.id);
      if (cr.countdown <= 0) {
        const curIdx = st.crests.indexOf(cr);
        if (curIdx !== -1) st.crests.splice(curIdx, 1);
        await showTriggeredEffectToast(cr.cardData || { id: 'sys_notice', name: '战局提示', type: 'spell', rarity: '传说', energy: 0, bones: 0, sacrifice: 0 }, `【${cr.name}】倒计时结束，纹章破坏。`, 240);
        if (cr.id === 'crest_returning_blademaster') {
          await showTriggeredEffectToast(cr.cardData, '【纹章：归来的剑圣】纹章破坏时：召唤 1 个『归来的剑圣』！', 240);
          await summonByNameAnimated(side, 'cmwhnqd6sxcdq', 1, -1, false, cr.name);
        } else if (cr.id === 'crest_victory_angel') {
          await showTriggeredEffectToast(cr.cardData, '【纹章：胜利天使】纹章破坏时：召唤 1 个『胜利天使』并使其获得【飞行】！', 240);
          const sum = await summonByNameAnimated(side, 'cmwhpxeundtos', 1, -1, false, cr.name);
          if (sum && sum.length > 0 && sum[0].inst) {
            sum[0].inst.activeKw['飞行'] = 1;
            addGrantedEffect(sum[0].inst, '来源：【纹章：胜利天使】 → 获得【飞行】');
            spawnFloatNumber(side, sum[0].lane, '🪽飞行', '#38bdf8');
            renderAllBattleUI();
          }
        }
      }
    }
    renderAllBattleUI();
  }

  // 1.5) 纹章【回合开始时】效果（残暴的尸兽）
  if (st.crests && st.crests.some(cr => cr.id === 'crest_brutal_beast')) {
    const cr = st.crests.find(x => x.id === 'crest_brutal_beast');
    await playCrestTriggerVFX(side, cr.id);
    await showTriggeredEffectToast(cr.cardData, '【纹章：残暴的尸兽】回合开始时：对己方主战者造成1点伤害并抽1张牌！', 260);
    await dealDamageToLeaderAnimated(side, 1, null, true);
    if (!battle.gameOver) await drawCardAnimated(side);
  }

  // 2) 回合开始时：己方战场上所有具有【倒计时】的随从与护符倒计时 -1，并触发【回合开始时】随从能力
  for (let l = 0; l < 5; l++) {
    const m = battle.board[side][l];
    if (m && m.countdown !== null && m.countdown !== undefined) {
      await reduceCardCountdown(side, l, 1, null, 0);
    }
  }
  const turnStartSnapshot = [0, 1, 2, 3, 4].map(l => ({ l, m: battle.board[side][l] })).filter(x => x.m);
  for (const { l, m } of turnStartSnapshot) {
    if (battle.gameOver) break;
    if (battle.board[side][l] !== m) continue;
    if (m && m.data.id === 'cmwhoq7cxx2wg') {
      await showTriggeredEffectToast(m.data, '【猛虎神殿】回合开始时：召唤 1 个『圣甲猛虎』！', 240);
      await summonByNameAnimated(side, 'cmwhoi7m64375', 1, l, false, m.data.name);
    } else if (m && m.data.id === 'cmwkiou55bdcb') {
      await showTriggeredEffectToast(m.data, '【苦痛监牢】回合开始时：对己方主战者造成 1 点伤害并抽 1 张牌！', 240);
      await dealDamageToLeaderAnimated(side, 1, m);
      if (!battle.gameOver) await drawCardAnimated(side);
    } else if (m && m.data.id === 'cmwgbxcd6nei4') {
      await showTriggeredEffectToast(m.data, '【回合开始时】回复所有友方随从和己方主战者2点生命值，对所有敌方随从造成2点伤害！', 280);
      await healLeaderAnimated(side, 2, m.data.name);
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

  while ((st.delayedSelfDmgDraws || 0) > 0) {
    st.delayedSelfDmgDraws--;
    await showTriggeredEffectToast({ id: 'cmwhho71pxh5v', name: '蔷薇园丁', type: 'minion', rarity: '普通', energy: 2, bones: 0, sacrifice: 0 }, '【蔷薇园丁】回合开始时：对己方主战者造成1点伤害并抽1张牌！', 240);
    await dealDamageToLeaderAnimated(side, 1, null, true);
    if (!battle.gameOver) await drawCardAnimated(side);
  }
  while ((st.delayedSelfDmgBats || 0) > 0) {
    st.delayedSelfDmgBats--;
    await showTriggeredEffectToast({ id: 'cmwhhzt6ezp08', name: '蔷薇近卫', type: 'minion', rarity: '稀有', energy: 2, bones: 0, sacrifice: 0 }, '【蔷薇近卫】回合开始时：对己方主战者造成1点伤害并召唤1个『蝙蝠』！', 240);
    await dealDamageToLeaderAnimated(side, 1, null, true);
    if (!battle.gameOver) await summonByNameAnimated(side, '蝙蝠', 1, -1, false, '蔷薇近卫');
  }
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
      } else {
        await playOverdrawBurnAnim(side, lwc.data);
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
      } else {
        await playOverdrawBurnAnim(side, mc.data);
      }
    }
  }

  if (_sid !== _battleSessionSeq) return;
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

function getCardTargetRequirement(inst, isEnhanced = false, choiceIdx = -1, mode = 'normal') {
  if (mode === 'accelerate') {
    if (inst.data.id === 'cmwlp6mctrvla') return 'hand_card';
    return '';
  }
  if (mode === 'crystallize') return '';
  switch (inst.data.id) {
    case 'cmwbxdn7tcvde': return 'hand_card';
    case 'cmwlnaq43tdtd': {
      const gCnt = battle && battle.leaders && battle.leaders[inst.owner] ? (battle.leaders[inst.owner].destroyedGuardCount || 0) : 0;
      return gCnt >= 10 ? 'enemy_minion' : '';
    }
    case 'cmwlomedyjchl': return 'enemy_minion';
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
    case 'cmwgh0uggjyno':
    case 'cmwgyx2fz9jks':
    case 'cmwgz33kwr8uh': return 'enemy_minion';
    case 'cmwhmtkk4cjaq': return 'enemy_minion_or_leader';
    case 'cmwhn3zw7yggm': return 'friendly_minion_pair';
    case 'cmwhn69mc1bcc': return 'friendly_minion';
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
  if (reqType === 'enemy_minion_or_leader') {
    for (let l = 0; l < 5; l++) {
      const m = battle.board[opp][l];
      if (!m || m.data.type !== 'minion') continue;
      if (m.activeKw['潜行']) continue;
      if (isSpell && m.activeKw['灵气']) continue;
      res.push({ side: opp, lane: l });
    }
    res.push({ side: opp, lane: -2, isLeader: true });
    return res;
  }
  if (reqType === 'friendly_minion_pair') {
    for (let l = 0; l < 5; l++) {
      const m = battle.board[casterSide][l];
      if (m && m.data.type === 'minion' && !excludeSacLanes.includes(l)) res.push({ side: casterSide, lane: l });
    }
    return res;
  }
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

