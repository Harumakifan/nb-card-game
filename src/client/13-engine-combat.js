async function performMinionCombatAnimated(attackerSide, lane) {
  const attacker = battle.board[attackerSide][lane];
  if (!attacker || attacker.data.type === 'amulet' || battle.gameOver || attacker.currentAtk <= 0) return;
  battle._activeSourceRef = { side: attackerSide, lane, cardId: attacker.data.id };
  attacker.attackedThisTurn = true;
  const opp = 1 - attackerSide;
  const swings = Math.max(1, attacker.activeKw['多重攻击'] || 1);

  for (let s = 0; s < swings; s++) {
    if (battle.gameOver || battle.board[attackerSide][lane] !== attacker || attacker.currentAtk <= 0) break;

    if (attacker.data.id === 'cmwhp4fb0ip93') {
      const gCnt = battle.board[attackerSide].filter(bm => bm && bm.data.type === 'minion' && bm.activeKw['守护']).length;
      if (gCnt > 0) {
        attacker.currentAtk += gCnt;
        attacker.tempTurnAtkBonus = (attacker.tempTurnAtkBonus || 0) + gCnt;
        addGrantedEffect(attacker, `来源：【神圣翼甲战士】 → 本回合攻击力 +${gCnt}`);
        spawnFloatNumber(attackerSide, lane, `+${gCnt}攻`, '#fde047');
        await showTriggeredEffectToast(attacker.data, `【攻击时】己方共有 ${gCnt} 个守护随从，本回合攻击力 +${gCnt}！`, 200);
        renderAllBattleUI();
      }
    }
    if (attacker.grantedOnAttackThreeSide3) {
      await showTriggeredEffectToast(attacker.data, '【攻击时】对前面和相邻敌方随从造成 3 点伤害！', 220);
      const splashLanes = [lane - 1, lane, lane + 1].filter(tl => tl >= 0 && tl < 5);
      for (const tl of splashLanes) {
        if (battle.board[opp][tl] && battle.board[opp][tl].data.type === 'minion') {
          await playSynergyBeam(getLaneDOM(attackerSide, lane), getLaneDOM(opp, tl), '#38bdf8', 180);
          await dealDamageToMinionAnimated(opp, tl, 3, attacker);
        }
      }
    }
    if (attacker.grantedOnAttackAoe4) {
      await showTriggeredEffectToast(attacker.data, '【攻击时】对敌方战场上的全体随从造成4点伤害！', 260);
      await playRowWideVFX(opp, 'fire_aoe', 340);
      await applyAoeDamageSimultaneousAnimated([0,1,2,3,4].map(el => ({ side: opp, lane: el })), 4, attacker);
    }
    if (attacker.data.id === 'cmwge5kmkgr5o') {
      const frontDef = battle.board[opp][lane];
      if (frontDef && frontDef.data.type === 'minion') {
        await showTriggeredEffectToast(attacker.data, `【攻击时】破坏正对面的『${frontDef.data.name}』！`, 240);
        await destroyMinionAnimated(opp, lane);
      }
    } else {
      const atkAst = attacker.data.ast || parseCardEffectAST(attacker.data);
      if (atkAst && atkAst.onAttack && atkAst.onAttack.length > 0) {
        await executeASTActionList(attackerSide, attacker, lane, atkAst.onAttack, lane, false);
      }
    }
    if (battle.gameOver || battle.board[attackerSide][lane] !== attacker) break;

    let targetLanes = [];
    if (attacker.activeKw['全体攻击']) {
      spawnFloatNumber(attackerSide, lane, '🌪️全体攻击!', '#fbbf24');
      await playRowWideVFX(opp, 'fire_aoe', 280);
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
            battle.board[opp][guardLane] = null;
            battle.board[opp][tl] = defender;
            renderAllBattleUI();
            const newCell = getLaneDOM(opp, tl);
            if (newCell && typeof newCell.getBoundingClientRect === 'function') {
              const nr = newCell.getBoundingClientRect();
              if (nr && nr.width > 0) {
                const ring = document.createElement('div');
                ring.className = 'sv-aoe-shockwave';
                ring.style.cssText = `left:${nr.left + nr.width/2}px;top:${nr.top + nr.height/2}px;width:64px;height:86px;border:4px solid #38bdf8;box-shadow:0 0 22px #38bdf8;`;
                document.body.appendChild(ring);
                setTimeout(() => ring.remove(), 600);
              }
            }
            showTriggeredEffectToast(defender.data, `【守护】移动至第 ${tl + 1} 战道进行护盾拦截。`, 0);
          }
        }
      }

      const defActualLane = defender ? battle.board[opp].indexOf(defender) : tl;
      const hitLeader = (!defender) || (attacker.activeKw['飞行'] && !defender.activeKw['防空']);
      const oppStCheck = battle.leaders[opp];
      const antiAggroPenalty = (hitLeader && attacker.activeKw['飞行'] && oppStCheck.crests && oppStCheck.crests.some(cr => cr.id === 'crest_anti_aggro')) ? 2 : 0;
      const estStrikeDmg = Math.max(0, attacker.currentAtk - antiAggroPenalty);
      const arrogantReduce = (hitLeader && oppStCheck.crests && oppStCheck.crests.some(cr => cr.id === 'crest_arrogant_rose')) ? 2 : 0;
      const realEstDmg = Math.max(0, estStrikeDmg - arrogantReduce);
      const willReflect = (battle.activeSide === opp) && battle.board[opp].some(m => m && m.data.id === 'cmwgyp9vt1dta');
      const isLethalStrike = Boolean(hitLeader && !willReflect && realEstDmg > 0 && (oppStCheck.hp - realEstDmg <= 0));
      const atkCell = getLaneDOM(attackerSide, lane);
      const atkToken = atkCell ? atkCell.firstElementChild : null;
      const targetEl = hitLeader ? getLaneDOM(opp, -1) : getLaneDOM(opp, defActualLane >= 0 ? defActualLane : tl);

      const playStrikeLunge = async () => {
        if (atkToken && targetEl && atkToken.animate) {
          const ar = atkToken.getBoundingClientRect();
          const tr = targetEl.getBoundingClientRect();
          const dx = (tr.left + tr.width / 2) - (ar.left + ar.width / 2);
          const dy = (tr.top + tr.height / 2) - (ar.top + ar.height / 2);
          const pullX = -dx * (isLethalStrike ? 0.12 : 0.08);
          const pullY = -dy * (isLethalStrike ? 0.12 : 0.08);
          const strikeX = dx * (isLethalStrike ? 0.54 : 0.46);
          const strikeY = dy * (isLethalStrike ? 0.54 : 0.46);
          const animDur = isLethalStrike ? 720 : 360;
          atkToken.style.zIndex = '60';
          atkToken.animate([
            { transform: 'translate3d(0, 0, 0) scale(1)', offset: 0 },
            { transform: `translate3d(${pullX.toFixed(1)}px, ${pullY.toFixed(1)}px, 0) scale(${isLethalStrike ? 1.12 : 1.06})`, offset: 0.28 },
            { transform: `translate3d(${strikeX.toFixed(1)}px, ${strikeY.toFixed(1)}px, 0) scale(${isLethalStrike ? 1.24 : 1.14})`, offset: 0.65 },
            { transform: 'translate3d(0, 0, 0) scale(1)', offset: 1 }
          ], { duration: animDur, easing: isLethalStrike ? 'cubic-bezier(0.16, 1, 0.3, 1)' : 'cubic-bezier(0.22, 1, 0.36, 1)' });
          await sleep(isLethalStrike ? 380 : 175);
        } else if (atkToken) {
          atkToken.style.transform = attackerSide === 0 ? 'translateY(-36px) scale(1.12)' : 'translateY(36px) scale(1.12)';
          await sleep(160);
        } else {
          await sleep(140);
        }
      };

      recordBattleTurnEvent(attackerSide, 'attack', `『${attacker.data.name}』(${attacker.currentAtk}攻) 发起攻击`, attacker.data);
      if (typeof recordLocalVfx === 'function') {
        recordLocalVfx({
          kind: 'attack_strike',
          side: attackerSide,
          fromLane: lane,
          toLane: hitLeader ? -1 : defActualLane,
          hitLeader: Boolean(hitLeader),
          dmg: attacker.currentAtk,
          lethal: Boolean(hitLeader && isLethalStrike)
        });
      }
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
        if (isLethalStrike) {
          // 先出现最后一击特写与文字，再执行攻击动画与伤害结算（不要提前置 gameOver，以免伤害结算被跳过）
          await playLethalSlowMotion(opp, realEstDmg, async () => {
            await playStrikeLunge();
            if (attacker.currentAtk > 0) {
              await dealDamageToLeaderAnimated(opp, attacker.currentAtk, attacker, false, false, 0, true);
            }
          });
        } else {
          await playStrikeLunge();
          if (attacker.currentAtk > 0) {
            await dealDamageToLeaderAnimated(opp, attacker.currentAtk, attacker);
          }
        }
      } else if (defActualLane >= 0) {
        await playStrikeLunge();
        await playMeleeImpactVFX(getLaneDOM(opp, defActualLane), '#fbbf24');
        const dealt = await dealDamageToMinionAnimated(opp, defActualLane, attacker.currentAtk, attacker);
        if (defender && defender.activeKw['荆棘'] && dealt > 0) {
          const thorn = defender.activeKw['荆棘'];
          await showTriggeredEffectToast(defender.data, `【荆棘_${thorn}】对攻击者造成 ${thorn} 点反伤。`, 220);
          await dealDamageToMinionAnimated(attackerSide, lane, thorn, defender);
        }
      }
      if (atkCell && atkCell.firstElementChild) {
        atkCell.firstElementChild.style.transform = '';
        atkCell.firstElementChild.style.zIndex = '';
      }
      renderAllBattleUI();
      await sleep(130);
    }
  }
  const _endAtkCell = getLaneDOM(attackerSide, lane);
  if (_endAtkCell && _endAtkCell.firstElementChild) {
    _endAtkCell.firstElementChild.style.transform = '';
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
  if ((battle.turn || 1) < 5) return false;
  const mechsOnBoard = battle.board[side].filter(m => m && m.data.type === 'minion' && isMechCard(m.data));
  if (mechsOnBoard.length < 5) return false;
  if (mechsOnBoard.length === 1 && mechsOnBoard[0].data.id === 'cmwbx0mq8qz7f') return false;

  const idx = st.deck.findIndex(c => c.data.id === 'cmwbx0mq8qz7f');
  if (idx === -1) return false;
  const girl = st.deck.splice(idx, 1)[0];
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
    recordDestroyedMinionCounters(st, inst);
    addBones(side, 1);
  });
  renderAllBattleUI();

  const girlLane = findFirstEmptyLane(side);
  if (girlLane !== -1) {
    await placeMinionOnBoardAnimated(side, girl, girlLane);
    const opp = 1 - side;
    await playRowWideVFX(opp, 'damage_wave', 240);
    await applyAoeDamageSimultaneousAnimated([0,1,2,3,4].map(el => ({ side: opp, lane: el })), 4, girl);
  }

  for (const item of sacrificedMechs) {
    if (battle.gameOver) break;
    await resolveLastWordsAnimated(side, item.lane, item.inst);
  }

  /* 规则：回合结束时召唤出来的随从可以立刻攻击，所以少女登场后要打 */
  const curGirlLane = battle.board[side].indexOf(girl);
  if (!battle.gameOver && curGirlLane !== -1) {
    try { await performMinionCombatAnimated(side, curGirlLane); }
    catch (e) { console.error('魔导机兵少女攻击异常:', e); }
  }
  return true;
}

async function checkAndTriggerDeusExMachinaInvocation(side) {
  if (battle.gameOver) return false;
  const st = battle.leaders[side];
  if (!st || (st.energySpentTotal || 0) < 35) return false;
  const idx = st.deck.findIndex(c => c.data.id === 'cmwlp6mctrvla');
  if (idx === -1) return false;
  const emptyL = findFirstEmptyLane(side);
  if (emptyL === -1) return false;
  const [deus] = st.deck.splice(idx, 1);
  await showTriggeredEffectToast(deus.data, `【瞬念召唤】本局消耗能量已达 ${st.energySpentTotal}（≥35）：召唤『机械降神』到场上并返回手牌！`, 340);
  deus._isInvocation = true;
  await playDeckToBoardInvocationVFX(side, emptyL, deus.data);
  await placeMinionOnBoardAnimated(side, deus, emptyL);
  deus._isInvocation = false;
  const curL = battle.board[side].indexOf(deus);
  if (!battle.gameOver && curL !== -1) {
    await playBoardToHandBounceVFX(side, curL, deus.data);
    battle.board[side][curL] = null;
    if (st.hand.length < (st.handLimit || RULES.handLimit)) {
      st.hand.push(deus);
      spawnFloatNumber(side, curL, '↩️回手', '#38bdf8');
    } else {
      await playOverflowBanishAnim(side, deus);
    }
    renderAllBattleUI();
  }
  return true;
}

async function checkAndTriggerLawManifestInvocation(side) {
  if (battle.gameOver) return false;
  const st = battle.leaders[side];
  if (!st) return false;
  const pv = st.playedValues1to8 || {};
  const allPlayed = [1, 2, 3, 4, 5, 6, 7, 8].every(v => Boolean(pv[v]));
  if (!allPlayed) return false;
  const idx = st.deck.findIndex(c => c.data.id === 'cmwlouqy7xrnl');
  if (idx === -1) return false;
  const emptyL = findFirstEmptyLane(side);
  if (emptyL === -1) return false;
  const [lawCard] = st.deck.splice(idx, 1);
  await showTriggeredEffectToast(lawCard.data, '【瞬念召唤】已打出价值 1~8 卡牌各 1 张以上：召唤『律法具现者』到己方战场上！', 340);
  await playDeckToBoardInvocationVFX(side, emptyL, lawCard.data);
  await placeMinionOnBoardAnimated(side, lawCard, emptyL);
  return true;
}

// 规则：「回合结束时召唤的随从都可以立刻攻击（例如飞龙骑手召唤的龙蛋被孵化器孵化后可以立刻攻击）」
async function executeEndTurnSequence(side) {
  if (cfIsOnlineClient()) {
    if (side !== 0 || !onlineIsMyTurn()) return;
    cancelPendingPlayToHand();
    stopTurnCountdownTimer();
    const r = await cfNetAction('END_TURN', {});
    if (!r.ok) { cfShowRejectToast(r.reason); startTurnCountdownTimer(); }
    return;
  }
  const _sid = _battleSessionSeq;
  const _eotCombatEvents = [];
  if (battle.gameOver || battle.activeSide !== side || battle.animating) return;
  if (typeof stopTurnCountdownTimer === 'function') stopTurnCountdownTimer();
  battle.animating = true;
  try {
  cancelPendingPlayToHand();
  battle.inspectedCard = null;
  document.getElementById('svDetailPanel').classList.add('hidden'); document.querySelectorAll('#playerHandZone .sv-hand-card.is-inspected').forEach(el => el.classList.remove('is-inspected')); if (typeof syncDetailSelectionHighlight === 'function') syncDetailSelectionHighlight();
  renderAllBattleUI();

  const order = side === 0 ? [0,1,2,3,4] : [4,3,2,1,0];
  const st = battle.leaders[side];

  for (let l = 0; l < 5; l++) {
    if (battle.board[side][l]) battle.board[side][l].attackedThisTurn = false;
  }

  // 第一阶段：先触发场上随从与护符的【回合结束时】效果（对回合结束时已在场的单位拍快照，避免同一回合结束阶段新召唤的同名随从重复触发）
  const turnEndSnapshot = order.map(l => ({ l, m: battle.board[side][l] })).filter(x => x.m);
  for (const { l, m } of turnEndSnapshot) {
    if (battle.board[side][l] !== m) continue;
    if (m.tempTurnAtkBonus) {
      m.currentAtk = Math.max(0, m.currentAtk - m.tempTurnAtkBonus);
      m.tempTurnAtkBonus = 0;
    }
    if (m.data.id === 'cmwfdja9sjiuf') {
      await showTriggeredEffectToast(m.data, '【回合结束时】『怨灵』【消失】！', 220);
      await banishMinionAnimated(side, l);
    } else if (m.data.id === 'cmwgz1zd1u6au') {
      await showTriggeredEffectToast(m.data, '【阴深的城堡】回合结束时：对己方主战者造成1点伤害，召唤1个『蝙蝠』，抽1张牌！', 260);
      await dealDamageToLeaderAnimated(side, 1, m);
      if (!battle.gameOver) await summonByNameAnimated(side, '蝙蝠', 1, l, false, m.data.name);
      if (!battle.gameOver) await drawCardAnimated(side);
    } else if (m.data.id === 'cmwhie9u1p4ey') {
      if ((st.selfTurnDamageCount || 0) >= 3) {
        await showTriggeredEffectToast(m.data, `【蔷薇猛虎】本回合已受伤 ${st.selfTurnDamageCount} 次（≥3）：召唤1个同名『蔷薇猛虎』！`, 260);
        await summonByNameAnimated(side, 'cmwhie9u1p4ey', 1, l, false, m.data.name);
      }
    } else if (m.data.id === 'cmwm86ka6xbwr' || m.data.name === '结晶：双炮神罚') {
      if (m.data.type === 'amulet' && (m.countdown || 0) > 0) {
        let guardTotal = 0;
        for (const s of [0, 1]) {
          for (let gl = 0; gl < 5; gl++) {
            const gm = battle.board[s][gl];
            if (gm && gm.data.type === 'minion' && gm.activeKw && gm.activeKw['守护']) guardTotal++;
          }
        }
        if (guardTotal > 0) {
          m.countdown = Math.max(0, (m.countdown || 0) - guardTotal);
          spawnFloatNumber(side, l, `⏳-${guardTotal}`, '#38bdf8');
          await showTriggeredEffectToast(m.data, `【结晶：双炮神罚】战场上共有 ${guardTotal} 个守护随从，倒计时 -${guardTotal}！`, 240);
          renderAllBattleUI();
          if (m.countdown <= 0) {
            await destroyMinionAnimated(side, l, false, false, true);
          }
        }
      }
    } else if (m.data.id === 'cmwdxmxskfby0') {
      await showTriggeredEffectToast(m.data, '【回合结束时】召唤1个『飞龙』到己方战场上！', 280);
      await summonByNameAnimated(side, '飞龙', 1, l, false, m.data.name);
    } else if (m.data.id === 'cmwlnnxokbgmu') {
      const opp = 1 - side;
      const pick = Math.floor(Math.random() * 3);
      if (pick === 0) {
        await showTriggeredEffectToast(m.data, '【战车·回合结束时】召唤1个『士兵』！', 220);
        await summonByNameAnimated(side, 'cmwlo0px2wz9l', 1, l, false, m.data.name);
      } else if (pick === 1) {
        await showTriggeredEffectToast(m.data, '【战车·回合结束时】对敌方主战者造成2点伤害！', 220);
        await dealDamageToLeaderAnimated(opp, 2, m);
      } else {
        await showTriggeredEffectToast(m.data, '【战车·回合结束时】分配给敌方随从2点伤害！', 220);
        await distributeDamageAnimated(opp, 2, false, m, side, l);
      }
    } else if (m.data.id === 'cmwlnwai0lb1h') {
      for (let ti = 0; ti < 2; ti++) {
        if (battle.gameOver) break;
        const pool = [
          { isLeader: true, side: 0 },
          { isLeader: true, side: 1 }
        ];
        for (let s = 0; s < 2; s++) {
          for (let ml = 0; ml < 5; ml++) {
            const bm = battle.board[s][ml];
            if (bm && bm !== m && bm.data.type === 'minion') pool.push({ isLeader: false, side: s, lane: ml });
          }
        }
        const chosen = pool[Math.floor(Math.random() * pool.length)];
        if (chosen.isLeader) {
          await showTriggeredEffectToast(m.data, `【战车：觉醒】第${ti+1}次轰击：对${chosen.side === 0 ? '我方' : '敌方'}主战者造成7点伤害！`, 220);
          await dealDamageToLeaderAnimated(chosen.side, 7, m);
        } else {
          await showTriggeredEffectToast(m.data, `【战车：觉醒】第${ti+1}次轰击：对『${battle.board[chosen.side][chosen.lane].data.name}』造成7点伤害！`, 220);
          await dealDamageToMinionAnimated(chosen.side, chosen.lane, 7, m);
        }
      }
    } else if (m.data.ast && m.data.ast.turnEnd.length > 0) {
      await executeASTActionList(side, m, l, m.data.ast.turnEnd, -1, false);
    }
  }
  if (st.crests && st.crests.length > 0) {
    for (const cr of [...st.crests]) {
      if (cr.id === 'crest_wyvern_rider') {
        await playCrestTriggerVFX(side, cr.id);
        await showTriggeredEffectToast(cr.cardData || { id: 'sys_notice', name: '战局提示', type: 'spell', rarity: '传说', energy: 0, bones: 0, sacrifice: 0 }, `【${cr.name}】回合结束时：召唤1个『雏龙的蛋』到己方战场上！`, 280);
        await summonByNameAnimated(side, '雏龙的蛋', 1, -1, false, cr.name);
      } else if (cr.id === 'crest_blood_rose') {
        await playCrestTriggerVFX(side, cr.id);
        await showTriggeredEffectToast(cr.cardData, '【纹章：血玫瑰】回合结束时对己方主战者造成 1 点伤害！', 220);
        await dealDamageToLeaderAnimated(side, 1, null, true);
      } else if (cr.id === 'crest_skeleton_lovers') {
        const opp = 1 - side;
        const oppLanes = [0,1,2,3,4].filter(l => battle.board[opp][l] && battle.board[opp][l].data.type === 'minion');
        const lwLanes = [0,1,2,3,4].filter(l => {
          const m = battle.board[side][l];
          return m && m.data.type === 'minion' && hasAnyLastWords(m);
        });
        if (oppLanes.length > 0 && lwLanes.length > 0) {
          const pickL = lwLanes[0];
          await playCrestTriggerVFX(side, cr.id);
          await showTriggeredEffectToast(cr.cardData, '【纹章：骸骨和少女】破坏己方1个谢幕曲随从，随机破坏1个敌方随从！', 260);
          await destroyMinionAnimated(side, pickL);
          const curOppLanes = [0,1,2,3,4].filter(l => battle.board[opp][l] && battle.board[opp][l].data.type === 'minion');
          if (curOppLanes.length > 0) {
            const rl = curOppLanes[Math.floor(Math.random() * curOppLanes.length)];
            await destroyMinionAnimated(opp, rl);
          }
        }
      } else if (cr.id === 'crest_tranquil_healer') {
        if (st.energy >= 1) {
          st.energy -= 1; st.energySpentTotal = (st.energySpentTotal || 0) + 1;
          renderAllBattleUI();
          await playCrestTriggerVFX(side, cr.id);
          await showTriggeredEffectToast(cr.cardData, '【纹章：宁静的治愈师】消耗1能量，回复己方主战者 3 点生命值！', 220);
          await healLeaderAnimated(side, 3, cr.name);
        }
      } else if (cr.id === 'crest_generous_angel') {
        if (st.energy >= 1) {
          st.energy -= 1; st.energySpentTotal = (st.energySpentTotal || 0) + 1;
          renderAllBattleUI();
          await playCrestTriggerVFX(side, cr.id);
          await showTriggeredEffectToast(cr.cardData, '【纹章：慷慨的天使】消耗1能量，抽取 1 张卡牌！', 220);
          await drawCardAnimated(side);
        }
      } else if (cr.id === 'crest_guardian_prayer') {
        const noGuard = [0,1,2,3,4].filter(l => battle.board[side][l] && battle.board[side][l].data.type === 'minion' && !battle.board[side][l].activeKw['守护']);
        if (noGuard.length > 0) {
          const pl = noGuard[Math.floor(Math.random() * noGuard.length)];
          const pm = battle.board[side][pl];
          pm.activeKw['守护'] = 1;
          addGrantedEffect(pm, '来源：【纹章：守护祷告者】 → 获得【守护】');
          await playCrestTriggerVFX(side, cr.id);
          spawnFloatNumber(side, pl, '🛡️守护', '#38bdf8');
          await showTriggeredEffectToast(cr.cardData, `【纹章：守护祷告者】使『${pm.data.name}』获得【守护】！`, 220);
          renderAllBattleUI();
        }
      } else if (cr.id === 'crest_tiger_trainer') {
        if (st.energy >= 3) {
          st.energy -= 3; st.energySpentTotal = (st.energySpentTotal || 0) + 3;
          renderAllBattleUI();
          await playCrestTriggerVFX(side, cr.id);
          await showTriggeredEffectToast(cr.cardData, '【纹章：猛虎训练师】消耗3能量，召唤 1 个『圣甲猛虎』！', 240);
          await summonByNameAnimated(side, 'cmwhoi7m64375', 1, -1, false, cr.name);
        }
      } else if (cr.id === 'crest_pioneer_preacher') {
        const xDmg = (st.crests || []).length;
        if (xDmg > 0) {
          await playCrestTriggerVFX(side, cr.id);
          await showTriggeredEffectToast(cr.cardData, `【纹章：开辟的传教士】分配 ${xDmg} 点伤害给敌方随从和主战者！`, 220);
          await distributeDamageAnimated(1 - side, xDmg, true, null, side, -1);
        }
      } else if (cr.id === 'crest_court_prayer') {
        if (st.energy >= 2) {
          st.energy -= 2; st.energySpentTotal = (st.energySpentTotal || 0) + 2;
          renderAllBattleUI();
          await playCrestTriggerVFX(side, cr.id);
          const guardLanes = [0,1,2,3,4].filter(l => battle.board[side][l] && battle.board[side][l].data.type === 'minion' && battle.board[side][l].activeKw['守护']);
          await showTriggeredEffectToast(cr.cardData, `【纹章：神圣宫廷祷告师】消耗2能量：己方全体守护随从获得 +1/+1！`, 240);
          guardLanes.forEach(gl => {
            const gm = battle.board[side][gl];
            gm.currentAtk += 1; gm.currentHp += 1; gm.maxHp += 1;
            addGrantedEffect(gm, '来源：【纹章：神圣宫廷祷告师】 → +1/+1');
            spawnFloatNumber(side, gl, '+1/+1', '#4ade80');
          });
          renderAllBattleUI();
        }
      } else if (cr.id === 'crest_holy_spear_armor') {
        const xDmg = Math.max(0, (battle.turn || 1) - 5);
        if (xDmg > 0) {
          await playCrestTriggerVFX(side, cr.id);
          await showTriggeredEffectToast(cr.cardData, `【纹章：圣枪重凯】对敌方主战者造成 ${xDmg} 点伤害！`, 220);
          await dealDamageToLeaderAnimated(1 - side, xDmg, null, true);
        }
      }
    }
  }

  // 第二阶段：检定【瞬念召唤】——机械降神、律法具现者、摇滚骷髅吉他手
  if (!battle.gameOver) {
    await checkAndTriggerDeusExMachinaInvocation(side);
  }
  if (!battle.gameOver) {
    await checkAndTriggerLawManifestInvocation(side);
  }
  // 摇滚骷髅吉他手（谢幕曲达 10）仍在此处结算
  if (!battle.gameOver && hasReachedLastWordsThreshold(side, 10) && findFirstEmptyLane(side) !== -1) {
    const idx = st.deck.findIndex(c => c.data.id === 'cmwbyp6f419ju');
    if (idx !== -1) {
      const [rocker] = st.deck.splice(idx, 1);
      addGrantedEffect(rocker, '来源：【摇滚骷髅吉他手·瞬念召唤】 → 已破坏10张以上谢幕曲直接登场');
      const el = findFirstEmptyLane(side);
      await showTriggeredEffectToast(rocker.data, '【瞬念召唤】将『摇滚骷髅吉他手』从牌库召唤到己方战场上！', 340);
      await playDeckToBoardInvocationVFX(side, el, rocker.data);
      await placeMinionOnBoardAnimated(side, rocker, el);
    }
  }

  // 第三阶段：场上所有尚未在本回合攻击过的随从（包含回合结束时由纹章/护符/孵化装置破壳召唤出的随从！）按战道顺序依次发起攻击！
  _eotCombatEvents.length = 0;
  for (const l of order) {
    if (battle.gameOver) break;
    const m = battle.board[side][l];
    if (m && m.data.type === 'minion' && m.currentAtk > 0 && !m.attackedThisTurn) {
      _eotCombatEvents.push({ fromLane: l, toLane: l, dmg: m.currentAtk });
      try {
        await performMinionCombatAnimated(side, l);
      } catch (combatErr) {
        console.error('随从战斗结算异常:', m.data.name, combatErr);
      }
    }
  }

  // 若攻击过程中因亡语/衍生又新登场了未攻击的随从，补齐攻击
  for (const l of order) {
    if (battle.gameOver) break;
    const m = battle.board[side][l];
    if (m && m.data.type === 'minion' && m.currentAtk > 0 && !m.attackedThisTurn) {
      try {
        await performMinionCombatAnimated(side, l);
      } catch (combatErr) {
        console.error('补齐攻击异常:', m.data.name, combatErr);
      }
    }
  }

  // 第四阶段：场上随从全部攻击结算完之后，才检定【魔导机兵少女】的 5 机械瞬念召唤
  if (!battle.gameOver) {
    await checkAndTriggerMechGirlInvocation(side);
  }
  } catch (err) {
    console.error('回合结束流程异常:', err);
  } finally {
    if (_sid === _battleSessionSeq) battle.animating = false;
  }
  if (_sid !== _battleSessionSeq) return;
  if (battleMode === 'pvp_online') {
    // 仅在服务器无头引擎中走到这里：交接回合由 MatchEngine 负责（翻转视角后开始对方回合）
    if (!battle.gameOver) battle.activeSide = 1;
    return;
  }
  if (!battle.gameOver) {
    if (battleMode === 'pvp_pass') {
      await triggerPvpPassAndPlayHandover();
    } else if (side === 0) {
      if (battle.firstPlayerSide === 1) battle.turn += 1;
      await beginTurnSequence(1);
      if (_sid !== _battleSessionSeq || battle.gameOver) return;
      await runEnemyAITurnAnimated();
    } else {
      if (battle.firstPlayerSide === 0) battle.turn += 1;
      await beginTurnSequence(0);
    }
  }
}

