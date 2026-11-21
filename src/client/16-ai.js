// v1.80 通用 AI 效果+攻击联合伤害评估：综合入场曲/抉择/AOE/攻击时效果伤害与本体攻防，精准识别「效果+平A」联合斩杀与破盾
function estimateCardEffectDmgToLaneForAI(c, st, oppBoard, laneIdx, choiceIdx, isEnh, effTarget, effTargetSide, oppSide) {
  if (!c || !c.data || !oppBoard || !oppBoard[laneIdx]) return 0;
  const fullTxt = String(c.data.fullText || '');
  let dmg = 0;

  // 1) 超载机皇 (cmwc3gozg0rat) 抉择2：对最多3个敌方随从造成「剩余手牌机械卡数」点伤害
  if (c.data.id === 'cmwc3gozg0rat' && choiceIdx === 1) {
    const remHandMechs = (st && st.hand ? st.hand : []).filter(h => h !== c && isMechCard(h.data)).length;
    if (remHandMechs > 0) {
      const oppMinionLanes = [0, 1, 2, 3, 4].filter(il => oppBoard[il] && oppBoard[il].data.type === 'minion');
      // 最多命中3个敌方随从（当前目标列若在前3个或全场<=3个必然命中）
      if (oppMinionLanes.length <= 3 || oppMinionLanes.slice(0, 3).includes(laneIdx)) {
        dmg += remHandMechs;
      }
    }
  }

  // 2) 指定单体入场曲伤害（当入场曲目标正好落在当前对位列时叠加）
  if (effTarget === laneIdx && effTargetSide === oppSide) {
    const mSingle = fullTxt.match(/造成(\d+)点伤害/);
    if (mSingle) dmg += Number(mSingle[1]);
  }

  // 3) 全体/敌方所有随从入场曲 AOE 伤害（通用正则，不写死卡名）
  if (c.data.type === 'minion') {
    const mAoe = fullTxt.match(/对(?:对手的战场上的所有随从|所有敌方随从|敌方所有随从|敌方全体随从|战场上所有随从)造成(\d+)点伤害/);
    if (mAoe && !(fullTxt.includes('攻击时') && fullTxt.indexOf(mAoe[0]) > fullTxt.indexOf('攻击时'))) {
      dmg += Number(mAoe[1]);
    }
  }

  // 4) 攻击时对面前/相邻/全体造成 X 点伤害（通用正则解析，兼容龙族及任意自制卡）
  const multiAtk = Math.max(1, Number((c.activeKw && c.activeKw['多重攻击']) || 1));
  const onAtkMatch = fullTxt.match(/攻击时[^。；\n]*?造成(\d+)点伤害/);
  if (onAtkMatch) {
    dmg += Number(onAtkMatch[1]) * multiAtk;
  } else {
    const legacyOnAtk = c.data.id === 'cmwdts32am05i' ? 1 : (c.data.id === 'cmwdtq4q7c8pe' ? 3 : (c.data.id === 'cmwdui6uam6xe' || c.data.id === 'cmwdukf0l090w' ? 5 : 0));
    dmg += legacyOnAtk * multiAtk;
  }
  return dmg;
}

function evaluateCombinedKillForAI(pm, effAtk, effectDmg, hasBane, multiAtk = 1) {
  if (!pm || pm.data.type !== 'minion') return { canKill: false, totalDeal: 0 };
  const hasBarrier = Boolean(pm.activeKw && pm.activeKw['屏障']);
  const hits = Math.max(1, Number(multiAtk || 1));
  let hpLeft = pm.currentHp;
  let barrierLeft = hasBarrier;

  // 先结算入场曲/攻击前效果伤害（若对手有屏障，效果伤害先破盾）
  if (effectDmg > 0) {
    if (barrierLeft) {
      barrierLeft = false;
    } else {
      hpLeft -= effectDmg;
    }
  }
  if (hpLeft <= 0) return { canKill: true, totalDeal: effectDmg };

  // 再结算本体攻击（支持破盾后多重攻击与毁灭）
  let atkHits = hits;
  if (barrierLeft && effAtk > 0) {
    barrierLeft = false;
    atkHits -= 1;
  }
  if (atkHits > 0 && effAtk > 0) {
    if (hasBane) return { canKill: true, totalDeal: effectDmg + effAtk * atkHits };
    hpLeft -= effAtk * atkHits;
  }
  return { canKill: hpLeft <= 0, totalDeal: effectDmg + Math.max(0, atkHits) * effAtk };
}

async function runEnemyAITurnAnimated() {
  const _sid = _battleSessionSeq;
  if (battle.gameOver) return;
  battle.animating = true;
  try {
  const st = battle.leaders[1];
  const pst = battle.leaders[0];
  await sleep(340);

  let stepGuard = 0;
  // 机械AI：若手牌有未融合的【废物利用】(cmwdi4pwz3c0k)，只融合1张低价值多余机械牌以触发双羊召唤
  if (!battle.gameOver && st.hand) {
    const scrapCard = st.hand.find(h => h && h.data && h.data.id === 'cmwdi4pwz3c0k' && (h.fusedCount || 0) === 0);
    if (scrapCard) {
      const candidates = st.hand.filter(h => h && h !== scrapCard && isMechCard(h.data) && !['cmwc3gozg0rat', 'cmwc2n4p68ewm', 'cmwlp6mctrvla'].includes(h.data.id));
      if (candidates.length > 0) {
        candidates.sort((a, b) => getCardCostValue(a.data) - getCardCostValue(b.data));
        const fodder = candidates[0];
        const fIdx = st.hand.indexOf(fodder);
        if (fIdx !== -1) {
          st.hand.splice(fIdx, 1);
          scrapCard.fusedCount = 1;
          scrapCard.costReduction = Math.min(scrapCard.data.energy || 0, (scrapCard.costReduction || 0) + 1);
          addGrantedEffect(scrapCard, `来源：【AI融合】 → 融合『${fodder.data.name}』，获得双羊召唤`);
        }
      }
    }
  }

  while (_sid === _battleSessionSeq && !battle.gameOver && stepGuard < 22) {
    stepGuard++;

    let bestAction = null;
    let bestScore = -9999;

    const myMinions = battle.board[1].filter(m => m && m.data.type === 'minion');
    const myMechCount = myMinions.filter(m => isMechCard(m.data)).length;
    const emptyLanes = [0,1,2,3,4].filter(l => battle.board[1][l] === null);
    const baseFaceDmg = simulateProjectedFaceDamage();
    const playerBoardTotalAtk = battle.board[0].reduce((s, m) => s + (m && m.data.type === 'minion' ? m.currentAtk : 0), 0);
    const aiCtx = evaluateBattleContextForAI(1);

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
      return ft.includes('电子羊') || ft.includes('机械卡牌为6张') || h.data.id === 'cmwc3gozg0rat';
    });

    // 审视本回合是否需要打出使用2个以上祭品的卡牌；若不需要，则检查下回合是否可以打出2+祭品卡以决定是否铺满祭品
    const willPlayBigSacThisTurn = st.hand.some(h => {
      const needS = h.data.sacrifice || 0;
      if (needS < 2) return false;
      const ev = evaluateCardPlayState(1, h);
      if (!ev || !ev.ok) return false;
      const validS = getValidSacrificeLanes(1, h.data.sacrificeCond || '');
      if (validS.length < needS) return false;
      validS.sort((la, lb) => compareTributeCandidatesForAI(battle.board[1][la], battle.board[1][lb]));
      let tVal = 0;
      for (let i = 0; i < needS; i++) tVal += getBoardMinionEffectiveValueForAI(battle.board[1][validS[i]]);
      const expectedNew = getCardCostValue(h.data) + estimateAIExtraSummons(h, ev.mode === 'enhance', 0) * 1.5;
      return expectedNew > tVal;
    });
    const nextTurnMaxEnergy = Math.min(RULES.maxEnergy, st.maxEnergy + 1);
    const prepNextTurnBigSacCard = !willPlayBigSacThisTurn ? st.hand.find(h => {
      const needS = h.data.sacrifice || 0;
      if (needS < 2) return false;
      if (getEffectiveEnergy(h, st) > nextTurnMaxEnergy || (h.data.bones || 0) > st.bones) return false;
      const curTributes = getValidSacrificeLanes(1, h.data.sacrificeCond || '').length;
      return curTributes < needS && curTributes >= Math.max(0, needS - 2);
    }) : null;

    // 扫描手牌中等待任务计数或 X 数值最大化的收益卡
    const hasUnmetSelfDmgQuestInHand = st.hand.some(h =>
      (h.data.id === 'cmwhlefn11ybd' && (st.totalSelfTurnDamageCount || 0) < 7) ||
      (h.data.id === 'cmwhlsrjr4v9k' && (st.totalSelfTurnDamageCount || 0) < 7) ||
      (h.data.id === 'cmwhlmtv5rqx4' && (st.totalSelfTurnDamageCount || 0) < 12) ||
      (h.data.id === 'cmwhie9u1p4ey' && (st.selfTurnDamageCount || 0) < 3)
    );
    const hasSelfDmgScalingInHand = st.hand.some(h => ['cmwgz33kwr8uh', 'cmwhilw8iwvet'].includes(h.data.id));
    const hasUnmetLwQuestInHand = st.hand.some(h =>
      (h.data.id === 'cmwke7t3w6xig' && (st.destroyedLastWordsCount || 0) < 7) ||
      (h.data.id === 'cmwgdqawegvy3' && (st.destroyedLastWordsCount || 0) < 10) ||
      (h.data.id === 'cmwbyp6f419ju' && (st.destroyedLastWordsCount || 0) < 10)
    );
    const hasCrestScalingInHand = st.hand.some(h => ['cmwhq2imeai8a', 'cmwhom0t7kh3l'].includes(h.data.id));
    const hasGuardScalingInHand = st.hand.some(h => ['cmwhosp359tmt', 'cmwhphf6y7cew'].includes(h.data.id));

    // A. 评估场上随从与护符的【启动】技能（赛博牧羊人、龙蛋收藏家、无畏的飞龙骑手纹章续期、龙心秘宝弃牌拿龙蛋）
    for (let l = 0; l < 5; l++) {
      const m = battle.board[1][l];
      if (!m || m.activatedThisTurn) continue;
      const ast = m.data.ast || parseCardEffectAST(m.data);
      if (m.data.id === 'cmwdw5qt6cbqb') {
        const wyvCrest = (st.crests || []).find(cr => cr.id === 'crest_wyvern_rider');
        if (wyvCrest && st.energy >= 1 && wyvCrest.countdown <= 1) {
          const score = 85;
          if (score > bestScore) {
            bestScore = score;
            bestAction = { type: 'activate_minion', lane: l, minion: m, eCost: 1 };
          }
        }
      } else if (m.data.id === 'cmwfdhecfc856') { // 龙蛋收藏家：能量1将1张雏龙的蛋置入手牌
        if (st.energy >= 1 && st.hand.length <= (st.handLimit || RULES.handLimit) - 1) {
          const score = 85;
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
      } else if (m.data.id === 'cmwgysie8srmh') {
        const rc = (st.crests || []).find(cr => cr.id === 'crest_arrogant_rose');
        if (rc && st.bones >= 8 && rc.countdown <= 1) {
          if (185 > bestScore) { bestScore = 185; bestAction = { type: 'activate_minion', lane: l, minion: m, eCost: 0, bCost: 8 }; }
        }
      } else if (m.data.id === 'cmwgyyghnbr4n') {
        if (st.bones >= 6 && st.hand.length <= (st.handLimit || RULES.handLimit) - 2) {
          if (220 > bestScore) { bestScore = 220; bestAction = { type: 'activate_minion', lane: l, minion: m, eCost: 0, bCost: 6 }; }
        }
      } else if (m.data.id === 'cmwgz1zd1u6au') {
        // 已移除启动能力
      } else if (m.data.id === 'cmwlomedyjchl') {
        const oppM = [0,1,2,3,4].filter(el => battle.board[0][el] && battle.board[0][el].data.type === 'minion' && !battle.board[0][el].activeKw['潜行']);
        if (st.bones >= 4 && oppM.length > 0) {
          if (195 > bestScore) { bestScore = 195; bestAction = { type: 'activate_minion', lane: l, minion: m, eCost: 0, bCost: 4 }; }
        }
      } else if (m.data.id === 'cmwget8v364ar') {
        const oppM = [0,1,2,3,4].filter(el => battle.board[0][el] && battle.board[0][el].data.type === 'minion' && !battle.board[0][el].activeKw['潜行']);
        if (st.energy >= 5 && oppM.length > 0 && m.currentAtk >= 3) {
          if (190 > bestScore) { bestScore = 190; bestAction = { type: 'activate_minion', lane: l, minion: m, eCost: 5 }; }
        }
      } else if (m.data.id === 'cmwhnqd6sxcdq') {
        if (st.energy >= 3 && !m.grantedOnAttackThreeSide3) {
          if (185 > bestScore) { bestScore = 185; bestAction = { type: 'activate_minion', lane: l, minion: m, eCost: 3 }; }
        }
      } else if (m.data.id === 'cmwhq3vyptao6') {
        if (st.bones >= 6 && emptyLanes.length >= 1) {
          if (195 > bestScore) { bestScore = 195; bestAction = { type: 'activate_minion', lane: l, minion: m, eCost: 0, bCost: 6 }; }
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
      } else if (ast && ast.activate && st.energy >= (ast.activate.energy || 0) && st.bones >= (ast.activate.bones || 0) && st.hand.length <= (st.handLimit || RULES.handLimit) - 2) {
        let actScore = 110;
        if (hasHandConsumer || pendingSacCardsInHand.length > 0) actScore += 220;
        if (emptyLanes.length >= 1 && st.energy >= 2) actScore += 90;
        if (actScore > bestScore) {
          bestScore = actScore;
          bestAction = { type: 'activate_minion', lane: l, minion: m, eCost: ast.activate.energy ?? 0, bCost: ast.activate.bones || 0, astAct: ast.activate };
        }
      }
    }

    // B. 遍历手牌，计算每张牌的最优打法
    const getAISelfDamageCost = (cardData) => {
      if (!cardData) return 0;
      const hasLion = battle.board[1].some(m => m && m.data.id === 'cmwgyue0p59ih');
      const hasReflect = battle.board[1].some(m => m && m.data.id === 'cmwgyp9vt1dta');
      if (hasLion || hasReflect) return 0;
      const reduce = (st.crests && st.crests.some(cr => cr.id === 'crest_arrogant_rose')) ? 2 : 0;
      const hit = (dmg) => Math.max(0, dmg - reduce);
      switch (cardData.id) {
        case 'cmwgyxdbows5c': return hit(3); // 鲜血爆发
        case 'cmwgbg6hku29o': return hit(3); // 烈焰漩涡
        case 'cmwgyks2fu1p5': return hit(1) * 2; // 撕裂
        case 'cmwhi7h552gc8':
        case 'cmwhhzt6ezp08':
        case 'cmwhie9u1p4ey':
        case 'cmwhlefn11ybd':
        case 'cmwhm4gd57wh3':
        case 'cmwkiou55bdcb':
        case 'cmwgr7z9krj92':
        case 'cmwgepbm7hzy9':
          return hit(1);
        default: return 0;
      }
    };
    for (const c of [...st.hand]) {
      const playEval = evaluateCardPlayState(1, c);
      if (!playEval.ok) continue;
      if (getAISelfDamageCost(c.data) >= st.hp) continue; // AI禁止自伤导致自杀

      const ast = c.data.ast || parseCardEffectAST(c.data);
      const fullTxt = String(c.data.fullText || c.data.text || '');
      const isEnh = playEval.mode === 'enhance';
      const selfValue = getCardCostValue(c.data);

      let choiceIdx = 0;
      const choices = getCardChoices(c);
      if (choices.length >= 2 && playEval.mode !== 'accelerate' && playEval.mode !== 'crystallize') {
        if (c.data.id === 'cmwas0lke5oiw') {
          const graveMechs4 = st.graveyard.filter(cd => cd.type === 'minion' && isMechCard(cd) && cd.energy >= 3 && cd.energy <= 4).length;
          choiceIdx = graveMechs4 >= 2 ? 1 : 0;
        } else if (c.data.id === 'cmwc3gozg0rat') {
          const remHandMechs = st.hand.filter(h => h !== c && isMechCard(h.data)).length;
          const selfAtkEst = (c.currentAtk !== undefined ? c.currentAtk : (c.data.atk || 5));
          const killableEnemies = battle.board[0].filter(pm => pm && pm.data.type === 'minion' && !pm.activeKw['屏障'] && pm.currentHp <= remHandMechs && analyzeMinionKillValueForAI(pm) > 20).length;
          const comboKillHighThreat = [0, 1, 2, 3, 4].some(il => {
            const pm = battle.board[0][il];
            if (!pm || pm.data.type !== 'minion') return false;
            const canPlaceFront = !battle.board[1][il] || (c.data.sacrifice > 0);
            if (!canPlaceFront) return false;
            const soloKill = !pm.activeKw['屏障'] && selfAtkEst >= pm.currentHp;
            const comboRes = evaluateCombinedKillForAI(pm, selfAtkEst, remHandMechs, Boolean(c.activeKw && c.activeKw['毁灭']), 1);
            return !soloKill && comboRes.canKill && (hasSpecialThreatEffectForAI(pm) || analyzeMinionKillValueForAI(pm) >= 55);
          });
          if (comboKillHighThreat || (killableEnemies >= 1 && (myMechCount <= 1 || playerBoardTotalAtk >= 4))) choiceIdx = 1;
          else choiceIdx = 0;
        } else if (c.data.id === 'cmwdwpfyd4xpp') {
          const cdDragons = battle.board[1].filter(m => m && hasRace(m.data, '龙族') && m.countdown !== null && m.countdown > 0).length;
          const hasHighCd1Dragon = battle.board[1].some(m => m && ['cmwdtq4q7c8pe', 'cmwdui6uam6xe', 'cmwdukf0l090w'].includes(m.data.id) && m.countdown === 1);
          const vulnerableDragons = battle.board[1].filter((m, ml) => {
            if (!m || m.data.type !== 'minion' || (m.activeKw && m.activeKw['屏障'])) return false;
            const isEggOrWyvern = ['cmwdtm73fwg1u', 'cmwdts32am05i', 'cmwdtq4q7c8pe', 'cmwdui6uam6xe'].includes(m.data.id) || hasRace(m.data, '龙族');
            if (!isEggOrWyvern) return false;
            const oppFront = battle.board[0][ml];
            return (oppFront && oppFront.data.type === 'minion' && oppFront.currentAtk >= m.currentHp) || playerBoardTotalAtk >= m.currentHp;
          }).length;
          const noBarrierDragons = battle.board[1].filter(m => m && m.data.type === 'minion' && hasRace(m.data, '龙族') && !(m.activeKw && m.activeKw['屏障'])).length;
          if (vulnerableDragons >= 1) choiceIdx = 1;
          else if (cdDragons >= 2 || hasHighCd1Dragon) choiceIdx = 0;
          else if (noBarrierDragons >= 1) choiceIdx = 1;
          else choiceIdx = 0;
        } else if (c.data.id === 'cmwdz3reuida0') {
          const hasDgCrest = (st.crests || []).some(cr => cr.id === 'crest_dragon_girl');
          const deadBigDragon = st.graveyard.some(cd => cd.type === 'minion' && getInitialCountdown(cd) > 0 && cd.atk >= 3);
          const deadDragons4 = st.graveyard.filter(cd => cd.type === 'minion' && hasRace(cd, '龙族') && getCardCostValue(cd) <= 4).length;
          const underHeavyPressure = st.hp <= 16 || playerBoardTotalAtk >= 6 || battle.turn >= 8;
          if (underHeavyPressure && deadBigDragon) choiceIdx = 2;
          else if (underHeavyPressure && deadDragons4 >= 2 && emptyLanes.length >= 2) choiceIdx = 1;
          else if (!hasDgCrest) choiceIdx = 0;
          else if (deadBigDragon) choiceIdx = 2;
          else if (deadDragons4 >= 2) choiceIdx = 1;
          else choiceIdx = 2;
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
        } else if (c.data.id === 'cmwgxtqho266t') {
          const deadVal2 = st.graveyard.filter(cd => cd.type === 'minion' && getCardCostValue(cd) <= 2).length;
          const rockerOnBoard = battle.board[1].some(m => m && m.data.id === 'cmwghmf9xj9dv');
          choiceIdx = (rockerOnBoard && deadVal2 >= 2) ? 0 : 1;
        } else if (c.data.id === 'cmwgru11nfnj0') {
          const oppMinionCnt = battle.board[0].filter(pm => pm && pm.data.type === 'minion').length;
          if (battle.leaders[0].hp <= 10 || oppMinionCnt >= 1) choiceIdx = 0;
          else choiceIdx = 2;
        }
      }

      const aiRole = classifyCardEffectRole(c, 1, playEval);
      if (aiRole.isEffectCard && (aiRole.hasTarget || aiRole.hasCondition)) {
        if (!aiRole.targetValid && !aiRole.condMet) {
          continue; // 效果类卡牌无合法目标且未满足条件时，绝不白打
        }
      }
      const aiUnmetCondOrTarget = (aiRole.hasTarget && !aiRole.targetValid) || (aiRole.hasCondition && !aiRole.condMet);
      const req = getCardTargetRequirement(c, isEnh, choiceIdx, playEval.mode);
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
      } else if (req === 'enemy_minion_or_leader') {
        const vt = getValidTargetLocations(1, req, c.data.type === 'spell');
        const minionLocs = vt.filter(x => !x.isLeader);
        if (minionLocs.length > 0) {
          minionLocs.sort((a, b) => analyzeMinionKillValueForAI(battle.board[0][b.lane], false) - analyzeMinionKillValueForAI(battle.board[0][a.lane], false));
          effTarget = minionLocs[0].lane;
          effTargetSide = 0;
          targetValueScore = 320 + analyzeMinionKillValueForAI(battle.board[0][effTarget], false) * 1.5;
        } else {
          effTarget = -2;
          effTargetSide = 0;
          targetValueScore = 260;
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
          const selfMinionAtk = c.data.type === 'minion' ? (c.currentAtk !== undefined ? c.currentAtk : (c.data.atk || 0)) : 0;
          vt.sort((a, b) => {
            const ma = battle.board[0][a.lane], mb = battle.board[0][b.lane];
            const killA = isBanish || isDestroy || (!ma.activeKw['屏障'] && ma.currentHp <= dmgVal);
            const killB = isBanish || isDestroy || (!mb.activeKw['屏障'] && mb.currentHp <= dmgVal);
            const comboKillA = !killA && c.data.type === 'minion' && !battle.board[1][a.lane] && evaluateCombinedKillForAI(ma, selfMinionAtk, dmgVal, Boolean(c.activeKw && c.activeKw['毁灭']), 1).canKill;
            const comboKillB = !killB && c.data.type === 'minion' && !battle.board[1][b.lane] && evaluateCombinedKillForAI(mb, selfMinionAtk, dmgVal, Boolean(c.activeKw && c.activeKw['毁灭']), 1).canKill;
            const anyKillA = killA || comboKillA;
            const anyKillB = killB || comboKillB;
            if (anyKillA !== anyKillB) return anyKillB ? 1 : -1;
            const effA = (!isBanish && !isDestroy) ? Math.min(dmgVal, ma.currentHp) * 18 : 0;
            const effB = (!isBanish && !isDestroy) ? Math.min(dmgVal, mb.currentHp) * 18 : 0;
            return (analyzeMinionKillValueForAI(mb, isBanish) + effB) - (analyzeMinionKillValueForAI(ma, isBanish) + effA);
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
          targetValueScore -= 420;
        } else {
          vcd.sort((a, b) => {
            const ma = battle.board[1][a.lane], mb = battle.board[1][b.lane];
            const tierA = ma.data.id === 'cmwdui6uam6xe' ? 180 : (ma.data.id === 'cmwdtq4q7c8pe' ? 140 : (ma.data.id === 'cmwdts32am05i' ? 90 : 0));
            const tierB = mb.data.id === 'cmwdui6uam6xe' ? 180 : (mb.data.id === 'cmwdtq4q7c8pe' ? 140 : (mb.data.id === 'cmwdts32am05i' ? 90 : 0));
            const scoreA = (ma.countdown === 1 ? 150 : 30) + tierA + (hasRace(ma.data, '龙族') ? 50 : 0) + (ma.currentAtk * 10);
            const scoreB = (mb.countdown === 1 ? 150 : 30) + tierB + (hasRace(mb.data, '龙族') ? 50 : 0) + (mb.currentAtk * 10);
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

      // 若同时具备指定与条件：双满足大幅加分，仅满足其一且下回合有费用打时尽量留到下回合
      if (aiRole.hasTarget && aiRole.hasCondition) {
        if (aiRole.targetValid && aiRole.condMet) targetValueScore += 360;
        else {
          targetValueScore -= 220;
          const nextTurnE = Math.min(RULES.maxEnergy, st.maxEnergy + 1);
          if (nextTurnE >= (playEval.costE || 0)) targetValueScore -= 160;
        }
      }

      // 下回合预判：高献祭/高骨头卡牌留场与攒骨头策略
      const nextTurnEnergy = Math.min(RULES.maxEnergy, st.maxEnergy + 1);
      const nextTurnBigSacOrBone = st.hand.some(h => h !== c && getEffectiveEnergy(h, st) <= nextTurnEnergy && ((h.data.sacrifice || 0) >= 2 || (h.data.bones || 0) >= 6));
      if (nextTurnBigSacOrBone) {
        if (c.data.type === 'minion' && (c.data.sacrifice || 0) === 0) targetValueScore += 180;
        if ((c.data.sacrifice || 0) > 0 && emptyLanes.length >= 2) targetValueScore -= 140;
      }

      // 自残体系 / 守护体系 / 纹章留费 / 动态X与任务计数优先排序
      const aiHasSelfDmgPayoff = battle.board[1].some(m => m && ['cmwgyfgvst9r1','cmwgyd3y5eyqg','cmwhm4gd57wh3'].includes(m.data.id))
        || (st.crests || []).some(cr => ['crest_blood_mage','crest_blood_rose'].includes(cr.id));
      const aiGuardianCnt = battle.board[1].filter(m => m && m.data.type === 'minion' && m.activeKw['守护']).length;
      const aiHasGuardCrest = (st.crests || []).some(cr => cr.id === 'crest_paladin_sergeant');

      // 条件未满足时仅作轻微排序微调
      if (aiRole.hasCondition && !aiRole.condMet) targetValueScore -= 25;

      // 通用「先过牌再打牌」策略：检查手牌中本回合需要打出的核心高价值卡费用，若先过牌会导致该卡费用不足则不提前过牌
      const isDrawOrSearchCard = /抽取\d+张|抽\d+张|置入.*手牌|加入.*手牌/.test(fullTxt) && !fullTxt.includes('谢幕曲');
      if (isDrawOrSearchCard && st.hand.length <= (st.handLimit || RULES.handLimit) - 1) {
        const remEAfterDraw = st.energy - (playEval.costE || 0);
        const remBAfterDraw = st.bones - (playEval.costB || 0);
        const blocksKeyCardThisTurn = st.hand.some(h => {
          if (h === c) return false;
          const hev = evaluateCardPlayState(1, h);
          if (!hev || !hev.ok) return false;
          const isKey = getCardCostValue(h.data) >= 3 || (h.data.type === 'minion' && ((h.data.atk || 0) + (h.data.hp || 0)) >= 5);
          return isKey && ((hev.costE || 0) > remEAfterDraw || (hev.costB || 0) > remBAfterDraw);
        });
        if (!blocksKeyCardThisTurn && (remEAfterDraw >= 2 || st.hand.length <= 2)) {
          targetValueScore += 115;
        }
      }

      // 通用「留牌协同」策略：若本回合费用不足以同时打出「需要本回合计数」的爆发卡，则不白白挥霍低费触发器（如1费自残/0费连击组件）
      const isPureComboOrSelfDmgSpark = (c.data.energy <= 1 && (c.data.atk || 0) <= 1 && (c.data.hp || 0) <= 2 && fullTxt.includes('自己主战者造成'));
      if (isPureComboOrSelfDmgSpark && !aiHasSelfDmgPayoff) {
        const hasTurnSelfDmgPayoffCard = st.hand.some(h => h !== c && ['cmwgz33kwr8uh','cmwhie9u1p4ey','cmwhilw8iwvet'].includes(h.data.id));
        const canAffordPayoffThisTurn = st.hand.some(h => h !== c && ['cmwgz33kwr8uh','cmwhie9u1p4ey','cmwhilw8iwvet'].includes(h.data.id) && (getEffectiveEnergy(h, st) + (playEval.costE || 0)) <= st.energy);
        if (hasTurnSelfDmgPayoffCard && !canAffordPayoffThisTurn && emptyLanes.length >= 2) {
          targetValueScore -= 190; // 留牌待下回合配合爆发卡一起打
        }
      }

      // 自残收益前置牌优先打出（先铺血法师/血玫瑰/疼痛疗愈者/鲜血宝石/燃血术士，再打自残牌）
      if (['cmwgd56lg867w','cmwgyxlefz8yz','cmwhm4gd57wh3','cmwgyd3y5eyqg','cmwgyfgvst9r1'].includes(c.data.id)) {
        const hasSelfDmgInHand = st.hand.some(h => h !== c && ['cmwgyxdbows5c','cmwgyks2fu1p5','cmwhm4gd57wh3','cmwgyxlefz8yz','cmwhi7h552gc8','cmwhhzt6ezp08','cmwkiou55bdcb'].includes(h.data.id));
        if (hasSelfDmgInHand) targetValueScore += 240;
        if (c.data.id === 'cmwgd56lg867w' && !(st.crests || []).some(cr => cr.id === 'crest_blood_mage')) targetValueScore += 260;
      }
      // 若手牌有等待自残任务或X加成的收益卡，优先打出本回合可增加自残次数的牌
      const isSelfDmgEnabler = ['cmwgyxdbows5c','cmwgyks2fu1p5','cmwgdalzmzj83','cmwhi7h552gc8','cmwhhzt6ezp08','cmwhm4gd57wh3','cmwkiou55bdcb','cmwgepbm7hzy9'].includes(c.data.id);
      if (isSelfDmgEnabler) {
        if (aiHasSelfDmgPayoff) targetValueScore += 210;
        if (hasUnmetSelfDmgQuestInHand || hasSelfDmgScalingInHand) targetValueScore += 280;
        const hasHealerOnBoard = battle.board[1].some(m => m && m.data.id === 'cmwhm4gd57wh3');
        if (st.hp <= 7 && !hasHealerOnBoard && baseFaceDmg < pst.hp) {
          targetValueScore -= 320; // 血量危急时避免无谓自残送掉自己
        }
      }
      // 自残阈值/X收益牌：未达标且手牌还有可打出的自残源时，降低相对优先级让任务卡先走，但保留正分以免卡手空过
      const hasPlayableSelfDmgEnabler = st.hand.some(h => h !== c && ['cmwgyxdbows5c','cmwgyks2fu1p5','cmwhi7h552gc8','cmwhhzt6ezp08','cmwhm4gd57wh3','cmwkiou55bdcb'].includes(h.data.id) && evaluateCardPlayState(1, h).ok);
      if (st.hp <= 13 && (fullTxt.includes('回复') || (c.activeKw && c.activeKw['虹吸']))) {
        targetValueScore += 240;
      } else if (st.hp >= 15 && isSelfDmgEnabler && (hasUnmetSelfDmgQuestInHand || hasSelfDmgScalingInHand)) {
        targetValueScore += 130; // 血量充裕时积极卖血刷自残爆发
      }
      if (c.data.id === 'cmwhlefn11ybd') targetValueScore += (st.totalSelfTurnDamageCount || 0) >= 7 ? 420 : (hasPlayableSelfDmgEnabler ? -140 : -40);
      if (c.data.id === 'cmwhlmtv5rqx4') targetValueScore += (st.totalSelfTurnDamageCount || 0) >= 12 ? 480 : (hasPlayableSelfDmgEnabler ? -180 : -60);
      if (c.data.id === 'cmwhlsrjr4v9k') targetValueScore += (st.totalSelfTurnDamageCount || 0) >= 7 ? 360 : (hasPlayableSelfDmgEnabler ? -110 : 60);
      if (c.data.id === 'cmwhie9u1p4ey') targetValueScore += (st.selfTurnDamageCount || 0) >= 3 ? 280 : (hasPlayableSelfDmgEnabler ? -120 : 20);
      const hasAffordableComboEnabler = st.hand.some(h => h !== c && ['cmwgyxdbows5c','cmwgyks2fu1p5','cmwhi7h552gc8','cmwhhzt6ezp08','cmwhm4gd57wh3','cmwkiou55bdcb'].includes(h.data.id) && evaluateCardPlayState(1, h).ok && (getEffectiveEnergy(h, st) + getEffectiveEnergy(c, st) <= st.energy) && ((h.data.bones || 0) + (c.data.bones || 0) <= st.bones));
      if (['cmwgz33kwr8uh', 'cmwhilw8iwvet'].includes(c.data.id) && hasAffordableComboEnabler) targetValueScore -= 140;

      // 谢幕曲破坏任务优先完成再打收益卡（派对南瓜头 / 地狱三头犬）
      if (hasUnmetLwQuestInHand && hasAnyLastWords(c)) {
        targetValueScore += 190;
      }
      if (c.data.id === 'cmwke7t3w6xig') targetValueScore += (st.destroyedLastWordsCount || 0) >= 7 ? 380 : -90;
      if (c.data.id === 'cmwgdqawegvy3') targetValueScore += (st.destroyedLastWordsCount || 0) >= 10 ? 440 : -110;

      // 手牌数量 X 卡牌先补手牌再打收益卡（如超载机皇/装甲堡垒/骸骨爆发）
      if (hasHandConsumer && ['cmwdi4pwz3c0k','cmwghctx4ixrj','cmwbvnpfgwo7a','cmwbwne297mmg','cmwc2zlhaxdtj'].includes(c.data.id)) {
        targetValueScore += 210;
      }
      if (['cmwc2n4p68ewm','cmwc8tup5d1xt'].includes(c.data.id)) {
        const mechHandCnt = st.hand.filter(h => h !== c && isMechCard(h.data)).length;
        if (mechHandCnt < 6 && st.hand.some(h => h !== c && ['cmwdi4pwz3c0k'].includes(h.data.id) && evaluateCardPlayState(1, h).ok)) {
          targetValueScore -= 240;
        }
      }

      // 纹章计数 X（邪恶骨巫 / 开辟的传教士）先铺纹章再打 X 伤害卡
      if (hasCrestScalingInHand && (fullTxt.includes('纹章') && !['cmwhq2imeai8a','cmwhom0t7kh3l'].includes(c.data.id))) {
        targetValueScore += 190;
      }
      if (c.data.id === 'cmwhq2imeai8a' && st.hand.some(h => h !== c && String(h.data.fullText || '').includes('获得【纹章') && evaluateCardPlayState(1, h).ok)) {
        targetValueScore -= 210;
      }

      // 守护体系协同：先铺守护随从再打「祝福的圣骑士」「守护之光芒」
      if (c.data.id === 'cmwhov3uiapqd' && !aiHasGuardCrest) targetValueScore += 260;
      if (c.data.id === 'cmwhp8oncpwrz') targetValueScore += 160;
      if (hasGuardianKeyword(c.data)) {
        if (aiHasGuardCrest) targetValueScore += 140;
        if (hasGuardScalingInHand) targetValueScore += 180;
      }
      if (c.data.id === 'cmwhosp359tmt') {
        targetValueScore += aiGuardianCnt * 95 - (aiGuardianCnt === 0 ? 180 : 0);
        if (st.hand.some(h => h !== c && hasGuardianKeyword(h.data) && evaluateCardPlayState(1, h).ok)) targetValueScore -= 160;
      }
      if (c.data.id === 'cmwhphf6y7cew') {
        targetValueScore += aiGuardianCnt * 110 + (battle.board[0].filter(Boolean).length * 40) - (aiGuardianCnt === 0 ? 220 : 0);
        if (st.hand.some(h => h !== c && hasGuardianKeyword(h.data) && evaluateCardPlayState(1, h).ok)) targetValueScore -= 160;
      }
      if (c.data.id === 'cmwhpp5k2fltf' && !(st.crests || []).some(cr => cr.id === 'crest_court_prayer')) targetValueScore += 220;

      // 能量纹章留费意识（避免把最后1~3点能量浪费在低收益牌上）
      const remEnergyAfter = st.energy - (playEval.costE || 0);
      if ((st.crests || []).some(cr => cr.id === 'crest_tiger_trainer') && emptyLanes.length >= 2 && remEnergyAfter < 3 && selfValue < 3.5) {
        targetValueScore -= 240;
      } else if ((st.crests || []).some(cr => cr.id === 'crest_court_prayer') && aiGuardianCnt >= 2 && remEnergyAfter < 2 && selfValue < 2.5) {
        targetValueScore -= 180;
      }

      // 严格执行 v2.1 祭品价值规则：
      // 1) 祭品的价值不能大于等于当前打出的献祭类随从的价值 (getCardCostValue(tribute) < selfValue 且 sum(tributes) < selfValue)
      // 2) 当场上低价值祭品不足，但手牌中还有可先打出的低价值随从时，暂缓打出本献祭卡，先打低价值随从上场！
      // 3) 价值同等的情况下，优先选择当前生命值和攻击力较低的随从献祭 (compareTributeCandidatesForAI)
      const sacLanes = [];
      let sacPenalty = 0;
      if (c.data.sacrifice > 0 && playEval.mode !== 'accelerate') {
        const allValidSac = getValidSacrificeLanes(1, c.data.sacrificeCond || '');
        if (allValidSac.length < c.data.sacrifice) continue;

        // 按场上有效价值（基础价值 + 额外身材每2点算1价值）从低到高排序，绝不优先破坏高价值随从
        allValidSac.sort((la, lb) => compareTributeCandidatesForAI(battle.board[1][la], battle.board[1][lb]));

        const expectedExtraVal = estimateAIExtraSummons(c, isEnh, choiceIdx) * 1.5;
        const totalExpectedNewVal = selfValue + expectedExtraVal;

        let totalTributeVal = 0;
        for (let i = 0; i < c.data.sacrifice; i++) {
          const sl = allValidSac[i];
          const tm = battle.board[1][sl];
          const tmLwRefund = tm.data.id === 'cmwc0auyporsj' ? 1.8 : (['cmwgd14oa2890', 'cmwgczzbob0ta', 'cmwc9mbry93dx', 'cmwfdqzl799uk'].includes(tm.data.id) ? 1.0 : 0);
          totalTributeVal += Math.max(0, getBoardMinionEffectiveValueForAI(tm) - tmLwRefund);
          sacLanes.push(sl);
          sacPenalty += Math.max(0, getBoardMinionEffectiveValueForAI(tm) - tmLwRefund) * 22 + (tm.currentAtk + tm.currentHp) * 4 - (hasAnyLastWords(tm) ? 38 : 0);
        }

        // 检查是否能通过打出后续手牌，使最终「己方场面价值 - 敌方场面价值」净提升
        let hasProfitableFollowUpCombo = false;
        const remEAfterC = st.energy - (playEval.costE || 0);
        const remBAfterC = st.bones - (playEval.costB || 0);
        const netFreedSlots = sacLanes.length - ((c.data.type === 'minion' || c.data.type === 'amulet') ? 1 : 0) - estimateAIExtraSummons(c, isEnh, choiceIdx);
        const futureEmptySlots = Math.max(0, emptyLanes.length + netFreedSlots);
        if (futureEmptySlots > 0) {
          const curDiff = getBoardNetValueDiffForAI(battle.board[1], battle.board[0]);
          for (const fh of st.hand) {
            if (fh === c) continue;
            const fhE = getEffectiveEnergy(fh, st);
            const fhB = fh.data.bones || 0;
            if (remEAfterC < fhE || remBAfterC < fhB || (fh.data.sacrifice || 0) > 0) continue;
            const fhVal = getCardCostValue(fh.data) + estimateAIExtraSummons(fh, false, 0) * 1.5;
            if ((totalExpectedNewVal + fhVal - totalTributeVal) > 0.5 && (curDiff + totalExpectedNewVal + fhVal - totalTributeVal) > curDiff) {
              hasProfitableFollowUpCombo = true;
              break;
            }
          }
        }

        if (!hasProfitableFollowUpCombo && totalTributeVal >= totalExpectedNewVal && totalExpectedNewVal > 0) {
          continue;
        }

        const worstChosenLane = sacLanes[sacLanes.length - 1];
        const worstChosenVal = getBoardMinionEffectiveValueForAI(battle.board[1][worstChosenLane]);
        const canPlayCheaperFodderFirst = !hasProfitableFollowUpCombo && emptyLanes.length >= 2 && st.hand.some(h => {
          if (h === c) return false;
          if (h.data.type !== 'minion' || (h.data.sacrifice || 0) > 0) return false;
          if (c.data.sacrificeCond && !hasRace(h.data, c.data.sacrificeCond)) return false;
          const hVal = getCardCostValue(h.data);
          const hE = getEffectiveEnergy(h, st);
          const hB = h.data.bones || 0;
          return hVal < worstChosenVal && (st.energy >= (playEval.costE || 0) + hE) && (st.bones >= (playEval.costB || 0) + hB);
        });
        if (canPlayCheaperFodderFirst) {
          continue;
        }
        if (myMechCount >= 4 && isMechCard(c.data) && (myMechCount - c.data.sacrifice + 1) < 5) {
          sacPenalty += 260;
        }
      }

      let placeLane = 0;
      let bestLaneTradeScore = -9999;
      const extraSummons = estimateAIExtraSummons(c, isEnh, choiceIdx);
      const isBoardCard = c.data.type === 'minion' || c.data.type === 'amulet';

      // 若需要献祭，允许通过调整同价/低价祭品格子来腾出最佳放置战道（手动位移效应）
      let bestSacLanesFinal = [...sacLanes];
      let sacLanePoolSets = [sacLanes];
      if (isBoardCard && c.data.sacrifice > 0 && sacLanes.length > 0) {
        const allValidSac = getValidSacrificeLanes(1, c.data.sacrificeCond || '')
          .sort((la, lb) => compareTributeCandidatesForAI(battle.board[1][la], battle.board[1][lb]));
        const worstBaseVal = getBoardMinionEffectiveValueForAI(battle.board[1][sacLanes[sacLanes.length - 1]]);
        const nearTieLanes = allValidSac.filter(sl => !sacLanes.includes(sl) && getBoardMinionEffectiveValueForAI(battle.board[1][sl]) <= worstBaseVal + 0.6);
        for (const altSl of nearTieLanes) {
          const altSet = [...sacLanes.slice(0, sacLanes.length - 1), altSl];
          sacLanePoolSets.push(altSet);
        }
      }

      const evalBoardCardAtLane = (l, curSacLanes) => {
        if (c.data.type === 'amulet') {
          let aScore = 280;
          // 若护符具有连环召唤（如骷髅墓碑/神圣宫殿/阴深的城堡），根据连环落点与空位给予评分
          if (extraSummons > 0) {
            const simB = [...battle.board[1]];
            curSacLanes.forEach(sl => simB[sl] = null);
            simB[l] = { data: c.data };
            const sLanes = simulateAISummonLanes(simB, l, extraSummons, false);
            aScore += sLanes.length * 95;
            if (sLanes.length < extraSummons) aScore -= (extraSummons - sLanes.length) * 140;
          }
          // 护符优先避开我方重要攻击位，放在边缘或对位有敌方高攻时需权衡
          const pmA = battle.board[0][l];
          if (pmA && pmA.data.type === 'minion') aScore -= pmA.currentAtk * 35;
          if (l === 0 || l === 4) aScore += 20;
          return aScore;
        }

        const activeShepherds = battle.board[1].filter((m, idx) => m && !curSacLanes.includes(idx) && m.data.id === 'cmwbxu7u3tpyo').length;
        const activeTamers = battle.board[1].filter((m, idx) => m && !curSacLanes.includes(idx) && m.data.id === 'cmwdw2v21c73r').length;
        const baseAtk = (c.currentAtk !== undefined ? c.currentAtk : (c.data.atk || 0));
        const baseHp = (c.currentHp !== undefined ? c.currentHp : (c.data.hp || 1));
        const bonusBuff = (isMechCard(c.data) ? activeShepherds : 0) + (hasRace(c.data, '龙族') ? activeTamers : 0);
        const effAtk = baseAtk + bonusBuff;
        const effHp = baseHp + bonusBuff;
        const hasBane = Boolean(c.activeKw && c.activeKw['毁灭']);
        const hasFly = Boolean(c.activeKw && c.activeKw['飞行']);
        const hasShift = Boolean(c.activeKw && c.activeKw['位移']);
        const isCheapFodder = selfValue <= 2.0 && effAtk <= 2 && effHp <= 3;

        let lScore = 0;
        const pm = battle.board[0][l];

        // 构造虚拟双方场面，精确推演连环召唤落点 + 攻击顺序[4..0] + 守护拦截 + 位移
        const simEBoard = battle.board[1].map(cloneVirtualMinionForAI);
        curSacLanes.forEach(sl => simEBoard[sl] = null);
        simEBoard[l] = {
          data: c.data,
          currentAtk: effAtk,
          currentHp: effHp,
          activeKw: Object.assign({}, c.activeKw || {}),
          shiftDir: 1
        };

        let summonedTokenLanes = [];
        if (extraSummons > 0) {
          summonedTokenLanes = simulateAISummonLanes(simEBoard, l, extraSummons, false);
          for (let ti = 0; ti < summonedTokenLanes.length; ti++) {
            const tl = summonedTokenLanes[ti];
            let tAtk = 1, tHp = 1, tKw = {};
            if (c.data.id === 'cmwgdqawegvy3') {
              tAtk = 5; tHp = 3;
              if ((st.destroyedLastWordsCount || 0) >= 10) {
                if (ti === 0) tKw['虹吸'] = 1;
                if (ti === 1) tKw['荆棘'] = 5;
              }
            } else if (c.data.id === 'cmwhlefn11ybd') {
              tAtk = 2; tHp = 2; tKw['守护'] = 1;
            } else if (c.data.id === 'cmwhlmtv5rqx4') {
              tAtk = 8; tHp = 5; tKw['潜行'] = 1; tKw['虹吸'] = 1;
            } else if (c.data.id === 'cmwbyhrbei4w8') {
              tAtk = 2; tHp = 2;
            } else if (c.data.id === 'cmwhodkla27ju') {
              tAtk = 4; tHp = 5; tKw['守护'] = 1; tKw['灵气'] = 1;
            } else if (c.data.id === 'cmwgb6nzkjlc7') {
              tAtk = 0; tHp = 5; tKw['荆棘'] = 2; tKw['防空'] = 1;
            } else if (c.data.id === 'cmwgyyghnbr4n') {
              tAtk = 1; tHp = 1; tKw['虹吸'] = 1; tKw['毁灭'] = 1;
            } else if (c.data.id === 'cmwhq3vyptao6' || c.data.id === 'cmwhov3uiapqd') {
              tAtk = 1; tHp = 2; tKw['守护'] = 1;
            } else if (c.data.id === 'cmwc2n4p68ewm') {
              tAtk = 1; tHp = 1; tKw['守护'] = 1;
            } else if (c.data.id === 'cmwdz3reuida0' && choiceIdx === 0) {
              tAtk = 0; tHp = 3; tKw['屏障'] = 1;
            } else if (c.data.id === 'cmwgdeqcq4vyl') {
              if (ti === 0) { tAtk = 3; tHp = 5; tKw['守护'] = 1; }
              else if (ti === 1) { tAtk = 2; tHp = 2; }
            }
            simEBoard[tl] = { data: { type: 'minion', name: 'token', energy: 1, bones: 0, sacrifice: 0 }, currentAtk: tAtk, currentHp: tHp, activeKw: tKw, shiftDir: 1 };
            // 评估连环落点本身的战道收益
            const oppAtTl = battle.board[0][tl];
            if (oppAtTl && oppAtTl.data.type === 'minion') {
              if ((tKw['毁灭'] || tAtk >= oppAtTl.currentHp) && !oppAtTl.activeKw['屏障']) {
                lScore += 180 + analyzeMinionKillValueForAI(oppAtTl, false) * 1.4;
              } else if (tKw['守护']) {
                lScore += 75 + oppAtTl.currentAtk * 12;
              }
            } else {
              lScore += tAtk * 16;
            }
          }
          if (summonedTokenLanes.length < extraSummons) {
            lScore -= (extraSummons - summonedTokenLanes.length) * 45;
          }
        }

        const simPBoard = battle.board[0].map(cloneVirtualMinionForAI);
        if (effTarget >= 0 && effTargetSide === 0 && simPBoard[effTarget] && targetValueScore >= 400) {
          simPBoard[effTarget] = null;
        }
        const projDmg = simulateProjectedFaceDamage(simEBoard, simPBoard);
        if (projDmg >= pst.hp) {
          lScore += 50000 + projDmg * 50;
        } else {
          lScore += (projDmg - baseFaceDmg) * 14;
        }

        // 攻击顺序感知：AI 按 [4, 3, 2, 1, 0] 从右往左攻击，具备攻击扫场/破坏前排能力的随从放在右侧可先手开路
        const hasPreClearAttack = Boolean(c.activeKw && (c.activeKw['全体攻击'] || c.activeKw['三侧攻击'] || c.activeKw['两侧攻击'])) || ['cmwge5kmkgr5o','cmwhnqd6sxcdq','cmwdts32am05i','cmwdtq4q7c8pe','cmwdui6uam6xe','cmwdukf0l090w'].includes(c.data.id);
        if (hasPreClearAttack) {
          const hasAlliesToLeft = [0,1,2,3,4].some(al => al < l && battle.board[1][al] && battle.board[1][al].data.type === 'minion' && !curSacLanes.includes(al));
          if (hasAlliesToLeft) lScore += l * 38;
        } else if (effAtk >= 4 && !hasFly) {
          // 高攻随从微调靠右站位，利用[4..0]攻击顺序先手破盾或触发守护横移
          lScore += l * 9;
        }

        // 站位演算：位置专属机制与邻格协同
        if (c.data.id === 'cmwhmittxj66h') {
          const adjKw = [l - 1, l + 1].some(nl => nl >= 0 && nl < 5 && battle.board[1][nl] && !curSacLanes.includes(nl) && Object.keys(battle.board[1][nl].activeKw || {}).length > 0);
          if (l === 2 && adjKw) lScore += 420;
          else if (l === 0 || l === 4) lScore += 280;
        } else if (c.data.id === 'cmwhnbpbm2mgp') {
          const empN = [l - 1, l + 1].filter(nl => nl >= 0 && nl < 5 && (!battle.board[1][nl] || curSacLanes.includes(nl))).length;
          lScore += empN * 190;
        } else if (c.data.id === 'cmwhn1a7tbjha') {
          const allyN = [l - 1, l + 1].filter(nl => nl >= 0 && nl < 5 && battle.board[1][nl] && !curSacLanes.includes(nl) && battle.board[1][nl].data.type === 'minion').length;
          lScore += allyN * 165;
        } else if (c.data.id === 'cmwhngje1igj1') {
          [l - 1, l + 1].forEach(nl => {
            const nm = (nl >= 0 && nl < 5 && !curSacLanes.includes(nl)) ? battle.board[1][nl] : null;
            if (nm && nm.data.type === 'minion') lScore += getCardCostValue(nm.data) <= 2 ? 150 : -260;
          });
        } else if (c.data.id === 'cmwhmldky1fgg') {
          const oppHasAdj = [l - 1, l + 1].some(nl => nl >= 0 && nl < 5 && battle.board[0][nl] && battle.board[0][nl].data.type === 'minion');
          if (!pm && oppHasAdj) lScore += 240;
        }

        // 守护位置感知：放在敌方高攻非飞行随从面前或居中战道以最大化拦截范围
        if (c.activeKw && c.activeKw['守护']) {
          if (pm && pm.data.type === 'minion') {
            const canBlock = !pm.activeKw['飞行'] || Boolean(c.activeKw['防空']);
            if (canBlock) lScore += 120 + pm.currentAtk * 20;
          } else {
            lScore += (2 - Math.abs(l - 2)) * 28; // 居中更易横移拦截
          }
        }

        // 位移位置感知：骨球需有相邻空位；位移随从评估移动后落点的安全性
        if (hasShift) {
          let shiftDest = (l + 1 < 5 && (!battle.board[1][l + 1] || curSacLanes.includes(l + 1))) ? (l + 1)
            : ((l - 1 >= 0 && (!battle.board[1][l - 1] || curSacLanes.includes(l - 1))) ? (l - 1) : -1);
          if (c.data.id === 'cmwgee7uk9ipt') {
            lScore += (shiftDest !== -1) ? 260 : -320;
          } else if (shiftDest !== -1) {
            const destOpp = battle.board[0][shiftDest];
            if (!destOpp || destOpp.data.type === 'amulet') lScore += 75;
            else if (destOpp.currentAtk >= effHp || destOpp.activeKw['毁灭']) lScore -= 110;
          }
        }

        // 若正在为下回合 2+ 祭品做铺垫，优先放置在敌人不好解的战道（护符面前/空位/低攻打不死的随从面前）
        if (prepNextTurnBigSacCard && (c.data.sacrifice || 0) === 0) {
          if (!pm || pm.data.type === 'amulet') {
            lScore += 140;
          } else if (pm.data.type === 'minion' && pm.currentAtk < effHp && !pm.activeKw['毁灭']) {
            lScore += 110;
          } else if (pm.data.type === 'minion' && (pm.currentAtk >= effHp || pm.activeKw['毁灭']) && effAtk < pm.currentHp) {
            lScore -= 120; // 仅在打不死对面且会被白吃时避开
          }
        }

        // 对位交换 vs 积极抢血走脸：
        // 1) 当敌方血量偏低或我方攻势占优时，提高空位走脸权重，避免把高攻大哥浪费在解 1/1 杂毛或帮对面触发资源型谢幕曲
        // 2) 若敌方随从无持续/特殊效果且己方攻击力 > 对方2倍以上，选择性无视直接放空位走脸（血量低时降低无视权重）
        const faceUrgency = (pst.hp <= 16 ? 1.55 : 1.0) + (baseFaceDmg >= pst.hp * 0.4 ? 0.35 : 0);
        const faceIgnoreScale = (st.hp <= 10 || playerBoardTotalAtk >= st.hp * 0.5) ? 0.25 : (st.hp <= 16 ? 0.65 : 1.0);
        const hasVanillaSmallEnemyElsewhere = [0,1,2,3,4].some(el => {
          const em = battle.board[0][el];
          return em && em.data.type === 'minion' && !em.activeKw['守护'] && !isMechCard(em.data) && !hasSpecialThreatEffectForAI(em) && effAtk > (em.currentAtk * 2);
        });

        if (['cmwdtm73fwg1u', 'cmwdts32am05i', 'cmwdtq4q7c8pe', 'cmwdui6uam6xe'].includes(c.data.id) && pm && pm.data.type === 'minion') {
          if (pm.currentAtk >= effHp || pm.activeKw['毁灭']) lScore -= 520;
          else lScore += 280 + (effHp - pm.currentAtk) * 25;
        }
        if (hasFly && (!pm || pm.data.type === 'amulet' || !pm.activeKw['防空'])) {
          // 飞行随从专属放置逻辑：
          // 1) 对面是低攻击力且无【防空】、无法一次性打死飞行随从的单位 -> 放在其面前，安全越过走脸同时护脸
          // 2) 若对面随从可一次性打死飞行随从（攻击力 >= 我方生命 或 具有【毁灭】）-> 避开该列，优先放在空位
          if (!pm || pm.data.type === 'amulet') {
            lScore += Math.round((190 + effAtk * 22) * faceUrgency);
          } else if (pm.currentAtk >= effHp || pm.activeKw['毁灭']) {
            lScore -= (380 + selfValue * 45);
          } else {
            const blockFaceGain = pm.currentAtk > 0 ? (75 + pm.currentAtk * 36) : 15;
            const safetyMargin = (effHp - pm.currentAtk) * 20;
            lScore += Math.round((250 + effAtk * 22) * faceUrgency) + blockFaceGain + safetyMargin;
          }
        } else if (!pm || pm.data.type === 'amulet') {
          let emptyBonus = Math.round((95 + effAtk * (hasFly ? 22 : 18)) * faceUrgency);
          if (['cmwdtm73fwg1u', 'cmwdts32am05i', 'cmwdtq4q7c8pe', 'cmwdui6uam6xe'].includes(c.data.id)) {
            emptyBonus += 240;
          }
          if (hasVanillaSmallEnemyElsewhere) {
            emptyBonus += Math.round((160 + effAtk * 16) * faceIgnoreScale);
          }
          lScore += emptyBonus;
        } else {
          const pmKillVal = analyzeMinionKillValueForAI(pm, false);
          const thornDmg = Number((pm.activeKw && pm.activeKw['荆棘']) || 0);
          const effectDmgToPm = estimateCardEffectDmgToLaneForAI(c, st, battle.board[0], l, choiceIdx, isEnh, effTarget, effTargetSide, 0);
          const multiAtkCnt = Math.max(1, Number((c.activeKw && c.activeKw['多重攻击']) || 1));
          const killEval = evaluateCombinedKillForAI(pm, effAtk, effectDmgToPm, hasBane, multiAtkCnt);
          const totalDealToPm = killEval.totalDeal;
          const canKillPm = killEval.canKill;
          const survivesThorns = effHp > thornDmg;
          const isIgnorableVanilla = !hasSpecialThreatEffectForAI(pm) && !pm.activeKw['守护'] && effAtk > (pm.currentAtk * 2);
          const isResourceLwFodder = hasAnyLastWords(pm) && !hasSpecialThreatEffectForAI(pm) && !isMechCard(pm.data) && pm.currentAtk <= 2;

          if (canKillPm && survivesThorns) {
            if (pmKillVal <= 0 && pm.currentAtk <= 1) {
              lScore += 15;
            } else if (isIgnorableVanilla && st.hp >= 16 && pm.currentAtk <= 2 && !isMechCard(pm.data)) {
              // 对方无特殊持续效果且我方攻击力大于对方2倍以上，在血量安全时选择性无视走脸
              lScore += Math.round((150 + pmKillVal * 1.4) * (1.2 - faceIgnoreScale * 0.6));
            } else {
              const exactKillBonus = (totalDealToPm === pm.currentHp || hasBane) ? 90 : 40;
              const threatBonus = hasSpecialThreatEffectForAI(pm) ? 120 : 0;
              const survivesTrade = (effHp - thornDmg) > pm.currentAtk;
              const tradeQualityBonus = survivesTrade
                ? (150 + (effHp - thornDmg - pm.currentAtk) * 18)
                : 0;
              lScore += 520 + pmKillVal * 4.5 + exactKillBonus + threatBonus + tradeQualityBonus;
            }
          } else if (canKillPm && !survivesThorns) {
            const myVal = effAtk * 16 + effHp * 10;
            lScore += (pmKillVal >= myVal) ? (240 + (pmKillVal - myVal) * 2) : -80;
          } else if (pm.activeKw['屏障'] && effAtk > 0 && isCheapFodder) {
            lScore += 260 + pm.currentAtk * 24;
          } else {
            const canBlockEnemy = (!pm.activeKw['飞行']) || Boolean(c.activeKw && c.activeKw['防空']);
            const diesNextTurn = pm.currentAtk >= (effHp - thornDmg);

            const isEvolvingCd = getInitialCountdown(c.data) > 0 && String(c.data.timerEffect || '').includes('变身为');
            if (c.data.name === '雏龙的蛋' || isEvolvingCd) {
              if (pm.currentAtk >= effHp || pm.activeKw['毁灭']) {
                lScore -= 650;
              } else if (pm.currentAtk >= 1 && (effHp - pm.currentAtk >= 2) && getInitialCountdown(c.data) === 1) {
                lScore += 110 + pm.currentAtk * 25; // 变化重置血量：留足2血防补刀，白嫖抗伤护脸
              } else if (pm.currentAtk >= 1 && (effHp - pm.currentAtk === 1)) {
                lScore -= 40;
              }
            } else if (canBlockEnemy && pm.currentAtk >= 3 && (isCheapFodder || hasAnyLastWords(c) || (c.activeKw && (c.activeKw['守护'] || c.activeKw['屏障'])))) {
              const hpUrgency = st.hp <= 15 ? 2.0 : 1.2;
              lScore += 300 + (pm.currentAtk * 30 * hpUrgency) + (hasAnyLastWords(c) ? 85 : 0);
            } else if (diesNextTurn) {
              lScore -= (260 + selfValue * 45);
            } else {
              lScore += 160 + effAtk * 14 + pm.currentAtk * 12;
            }
          }
        }
        return lScore;
      };

      if (isBoardCard) {
        let anyCandidate = false;
        for (const sacSet of sacLanePoolSets) {
          const candLanes = [0,1,2,3,4].filter(l => battle.board[1][l] === null || sacSet.includes(l));
          if (candLanes.length === 0) continue;
          anyCandidate = true;
          for (const l of candLanes) {
            const sc = evalBoardCardAtLane(l, sacSet);
            if (sc > bestLaneTradeScore) {
              bestLaneTradeScore = sc;
              placeLane = l;
              bestSacLanesFinal = sacSet;
            }
          }
        }
        if (!anyCandidate) continue;
      }
      // 更新最终选定的献祭格子（若通过献祭占用格获得更优落点，同步更新 sacPenalty）
      if (bestSacLanesFinal.length > 0 && bestSacLanesFinal.some((sl, idx) => sl !== sacLanes[idx])) {
        sacLanes.length = 0;
        sacPenalty = 0;
        bestSacLanesFinal.forEach(sl => {
          const tm = battle.board[1][sl];
          sacLanes.push(sl);
          sacPenalty += getBoardMinionEffectiveValueForAI(tm) * 22 + (tm.currentAtk + tm.currentHp) * 4 - (hasAnyLastWords(tm) ? 30 : 0);
        });
      }

      let totalScore = (isBoardCard ? bestLaneTradeScore : targetValueScore) - sacPenalty + targetValueScore * (isBoardCard && effTarget >= 0 ? 0.85 : 0);

      // 若本回合不打2+祭品卡，且下回合可打2+祭品卡，尽量铺满随从数量（优先谢幕曲召唤/回合开始召唤随从）
      if (prepNextTurnBigSacCard && (c.data.sacrifice || 0) === 0 && emptyLanes.length > 0) {
        const cond = prepNextTurnBigSacCard.data.sacrificeCond || '';
        const matchesCond = !cond || hasRace(c.data, cond);
        if ((c.data.type === 'minion' && matchesCond) || extraSummons > 0) {
          totalScore += 240 + (isStickyTributeSummonerForAI(c.data) ? 210 : 0) + extraSummons * 95;
        }
      }

      // 魔导机兵少女（5机械瞬念召唤）场面净价值保护：
      // 避免铺满第5个机械导致己方高身材大场面被自己破坏，而敌方几乎无随从可扫场，致使敌我场面价值大幅下降
      const summonedMechDelta = (isMechCard(c.data) && c.data.type === 'minion' ? 1 : 0)
        + ((['cmwbyhrbei4w8','cmwc2n4p68ewm','cmwdi4pwz3c0k','cmwas0lke5oiw'].includes(c.data.id) || fullTxt.includes('电子羊')) ? extraSummons : 0);
      const sacMechCnt = sacLanes.filter(sl => battle.board[1][sl] && isMechCard(battle.board[1][sl].data)).length;
      if (summonedMechDelta > 0 && (myMechCount - sacMechCnt + summonedMechDelta) >= 5) {
        const simBeforeMy = battle.board[1].map(cloneVirtualMinionForAI);
        const simBeforeOpp = battle.board[0].map(cloneVirtualMinionForAI);
        const diffBefore = getBoardStatNetDiffForAI(simBeforeMy, simBeforeOpp);

        // 模拟瞬念召唤后：己方场上只剩魔导机兵少女(4/6 飞行 + 4点AOE) + 机械谢幕曲遗留衍生物 + 5骨头收益
        let afterMyVal = 4 * 1.3 + 6 + 6 * 0.85 + 4.5; // 魔导机兵少女 4/6 飞行 + 直伤/AOE价值
        for (let ml = 0; ml < 5; ml++) {
          const m = battle.board[1][ml];
          if (m && m.data.type === 'minion' && isStickyTributeSummonerForAI(m.data)) {
            afterMyVal += 4.5; // 谢幕曲留场衍生物估值
          }
        }
        let afterOppVal = 0;
        for (let ol = 0; ol < 5; ol++) {
          const om = simBeforeOpp[ol];
          if (!om || om.data.type === 'amulet') continue;
          if (om.activeKw['屏障']) {
            afterOppVal += getBoardStatValueForAI(om) * 0.85;
          } else if (om.currentHp > 4) {
            const remHp = om.currentHp - 4;
            afterOppVal += om.currentAtk * 1.3 + remHp + getCardCostValue(om.data) * 0.85;
          }
        }
        const diffAfter = afterMyVal - afterOppVal;
        if (diffAfter < diffBefore - 4.0 && baseFaceDmg < pst.hp) {
          totalScore -= 750; // 仅在己方大场面净亏损明显时抑制触发5机械瞬念召唤
        }
      }

      // 傲慢的将军（若己方价值最高则破坏所有其他随从）：比较破坏前后的敌我场面净价值
      if (c.data.id === 'cmwhmorgymp4r') {
        const highestBoardVal = Math.max(0, ...battle.board[1].concat(battle.board[0]).filter(m => m && m.data.type === 'minion').map(m => getCardCostValue(m.data)));
        if (selfValue > highestBoardVal) {
          const diffBefore = getBoardStatNetDiffForAI(battle.board[1], battle.board[0]);
          const diffAfter = getBoardStatValueForAI({ data: c.data, currentAtk: 4, currentHp: 6, activeKw: c.activeKw });
          if (diffAfter < diffBefore - 2.0) totalScore -= 950;
        }
      }

      // 腐烂雾气 / 烈焰漩涡 / 撕裂 全场伤自损检测
      if (c.data.id === 'cmwke2qdplbkf' || c.data.id === 'cmwgbg6hku29o' || c.data.id === 'cmwgyks2fu1p5') {
        const aoeD = c.data.id === 'cmwgbg6hku29o' ? 3 : 2;
        const onlyNonUndead = (c.data.id === 'cmwke2qdplbkf');
        let myLoss = 0, oppLoss = 0;
        battle.board[1].forEach(m => {
          if (!m || m.data.type !== 'minion') return;
          if (onlyNonUndead && hasRace(m.data, '亡灵')) return;
          if (!m.activeKw['屏障'] && m.currentHp <= aoeD) myLoss += getBoardStatValueForAI(m) - (onlyNonUndead ? 2.5 : 0);
        });
        battle.board[0].forEach(m => {
          if (!m || m.data.type !== 'minion') return;
          if (onlyNonUndead && hasRace(m.data, '亡灵')) return;
          if (!m.activeKw['屏障'] && m.currentHp <= aoeD) oppLoss += getBoardStatValueForAI(m);
        });
        if (myLoss > oppLoss + 2.5 && baseFaceDmg < pst.hp) totalScore -= 650;
      }

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

      if ((c.data.id === 'cmwbxu7u3tpyo' || c.data.id === 'cmwc2wbcgbqvl') && st.hand.some(h => h !== c && h.data.type === 'minion' && isMechCard(h.data) && getEffectiveEnergy(h, st) <= (st.energy - (playEval.costE || 0)))) {
        totalScore += 260;
      }
      // === [1] 自残·血债回响 AI（优化女拳师压血联动、鲜血爆发时机与鼓手x-4清场） ===
      if (c.data.id === 'cmwkgxi000fpl') {
        if (st.hp > 10 && baseFaceDmg < pst.hp) totalScore -= 9000;
        else if (st.hp <= 10) totalScore += 820;
      } else if (c.data.id === 'cmwgyxdbows5c') {
        const hasBrawlerInHand = st.hand.some(h => h !== c && h.data.id === 'cmwkgxi000fpl');
        const canTriggerBrawler = hasBrawlerInHand && st.hp > 10 && st.hp <= 13 && (st.energy >= 5 || battle.turn >= 4);
        const oppBoardCnt = battle.board[0].filter(m => m && m.data.type === 'minion').length;
        if (st.hp <= 4 && baseFaceDmg + 5 < pst.hp) {
          totalScore -= 1400; // 防自杀
        } else if (canTriggerBrawler) {
          totalScore += 620; // 1费自残3正好把血线压进<=10，立刻激活狂暴女拳师！
        } else if (oppBoardCnt >= 2 || pst.hp <= 12 || (st.totalSelfTurnDamageCount || 0) < 6) {
          totalScore += 420;
        }
      } else if (c.data.id === 'cmwhilw8iwvet') {
        const xCnt = st.totalSelfTurnDamageCount || 0;
        const aoeDmg = xCnt >= 6 ? (xCnt - 5) : 0;
        const oppMinCnt = battle.board[0].filter(m => m && m.data.type === 'minion').length;
        if (aoeDmg >= 1 && oppMinCnt >= 2) totalScore += 380 + Math.min(5, aoeDmg) * 90 + (xCnt >= 10 ? 280 : 0);
        else if (xCnt >= 10) totalScore += 420;
        else if (xCnt < 6 && st.hand.some(h => h !== c && ['cmwhi7h552gc8','cmwhhzt6ezp08','cmwhm4gd57wh3','cmwgyxdbows5c','cmwgyks2fu1p5'].includes(h.data.id) && evaluateCardPlayState(1, h).ok)) {
          totalScore -= 280; // 未达6次自残时先打低费自残牌再拍鼓手
        }
      }

      // === [2] 守护·纹章圣盾 AI ===
      if (c.data.id === 'cmwhom0t7kh3l') {
        const hasPioneerCrest = (st.crests || []).some(cr => cr.id === 'crest_pioneer_preacher');
        totalScore += hasPioneerCrest ? -320 : 620;
      } else if (c.data.id === 'cmwhov3uiapqd') {
        const hasSgtCrest = (st.crests || []).some(cr => cr.id === 'crest_paladin_sergeant');
        totalScore += hasSgtCrest ? -320 : 620;
      } else if (c.data.id === 'cmwlnaq43tdtd') {
        const gCnt = st.destroyedGuardCount || 0;
        if (gCnt >= 10) totalScore += 520;
        else if (gCnt >= 5) totalScore += 260;
      } else if (c.data.id === 'cmwhosp359tmt') {
        const guardCnt = battle.board[1].filter(m => m && m.data.type === 'minion' && m.activeKw && m.activeKw['守护']).length;
        if (guardCnt >= 2 && st.hand.length <= 7) totalScore += guardCnt * 180;
      } else if (c.data.id === 'cmwllvy75f6bz') {
        const gCnt = st.destroyedGuardCount || 0;
        totalScore += (emptyLanes.length >= 2 ? 240 : 80) + (gCnt >= 10 ? 420 : 0);
      }

      // === [3] 机械·齿轮洪流 AI ===
      if (c.data.id === 'cmwdi4pwz3c0k') {
        totalScore += (c.fusedCount || 0) > 0 ? 480 : 120;
      }

      // === [3B] 机械·齿轮洪流 协同强化 ===
      if (c.data.id === 'cmwc3gozg0rat') {
        const mechCount = battle.board[1].filter(m => m && isMechCard(m.data)).length;
        totalScore += mechCount >= 2 ? 520 : 220;
      } else if (c.data.id === 'cmwc2n4p68ewm') {
        const mechHand = st.hand.filter(h => h !== c && isMechCard(h.data)).length;
        if (mechHand >= 6) totalScore += 680;
        else totalScore -= 320; // 手牌机械不足6张时不盲目空拍装甲堡垒
      } else if (c.data.id === 'cmwbyhrbei4w8' || c.data.id === 'cmwbwg3kwqfkq') {
        totalScore += 280; // 优先铺电子羊/铜壳瓢虫触发机械检索与减费
      } else if (c.data.id === 'cmwc3or2zf7ft') {
        const graveMechCnt = (st.graveyard || []).filter(g => g && g.type === 'minion' && isMechCard(g) && g.energy >= 2).length;
        if (sacLanes.length === 3 && graveMechCnt >= 2) totalScore += 480;
      }

      // === [4] 亡灵·终幕协奏 AI（松鼠+骸骨兽精准喂给骸骨王/主唱、骸骨少女返场与三头犬爆发） ===
      const hasRockerInHand = st.hand.some(h => h !== c && h.data.id === 'cmwghmf9xj9dv');
      const hasBoneKingInHand = st.hand.some(h => h !== c && h.data.id === 'cmwffityz44sn');
      const hasCerberusInHand = st.hand.some(h => h !== c && h.data.id === 'cmwgdqawegvy3');
      const hasBloodPayerInHand = st.hand.some(h => h !== c && h.data.id === 'cmwc0t61ade7b');
      const boardFodderCnt = battle.board[1].filter(m => m && m.data.type === 'minion').length;
      const squirrelHandCnt = st.hand.filter(h => h.data.id === 'cmwata95yc8j5').length;
      const countAffordableFodder = (availE, availB) => {
        const cands = st.hand
          .filter(h => h.data.type === 'minion' && (h.data.sacrifice || 0) === 0 && ['cmwata95yc8j5', 'cmwc0auyporsj', 'cmwgd14oa2890', 'cmwfdqzl799uk', 'cmwc9mbry93dx', 'cmwggjooddagz', 'cmwgczzbob0ta'].includes(h.data.id))
          .sort((a, b) => (getEffectiveEnergy(a, st) + (a.data.bones || 0) * 0.3) - (getEffectiveEnergy(b, st) + (b.data.bones || 0) * 0.3));
        let e = availE, b = availB, cnt = 0;
        for (const h of cands) {
          const he = getEffectiveEnergy(h, st), hb = h.data.bones || 0;
          if (e >= he && b >= hb) { e -= he; b -= hb; cnt++; }
        }
        return cnt;
      };
      const canSummonBoneKingThisTurn = hasBoneKingInHand && st.bones >= 3 && (boardFodderCnt + countAffordableFodder(st.energy, st.bones - 3)) >= 3;
      const canSummonRockerThisTurn = hasRockerInHand && st.energy >= 6 && (boardFodderCnt + countAffordableFodder(st.energy - 6, st.bones)) >= 3;
      const canSummonCerberusThisTurn = hasCerberusInHand && st.energy >= 7 && (st.destroyedLastWordsCount || 0) > 10 && (boardFodderCnt + squirrelHandCnt) >= 3;
      const canSummonBloodPayerThisTurn = hasBloodPayerInHand && st.energy >= 2 && st.bones >= 2 && boardFodderCnt < 1 && battle.board[0].some(m => m && m.data.type === 'minion');

      if (c.data.id === 'cmwata95yc8j5') {
        // 被献祭的松鼠：严格捏在手里当祭品组件，只在当回合能立刻喂给骸骨王/主唱/三头犬/血偿者时才拍上场！
        if ((canSummonBoneKingThisTurn || canSummonRockerThisTurn || canSummonCerberusThisTurn) && boardFodderCnt < 3) {
          totalScore += 1550;
        } else if (canSummonBloodPayerThisTurn) {
          totalScore += 620;
        } else {
          totalScore -= 1800; // 不白送松鼠上场，避免死后污染主唱亡者召还_价值1墓地池
        }
      } else if (c.data.id === 'cmwc0auyporsj') {
        // 骸骨兽：核心祭品引擎（死后爆2骷髅），3费起积极下场，手握骸骨王/主唱时优先级拉满
        if (hasBoneKingInHand && st.bones >= 3 && boardFodderCnt === 2) {
          totalScore += 1200; // 拍下骸骨兽凑满3祭品，当回合立刻接骸骨王并爆2骷髅
        } else if ((hasBoneKingInHand || hasRockerInHand) && boardFodderCnt < 3) {
          totalScore += 580;
        } else if (battle.turn <= 5) {
          totalScore += 360;
        }
      }
      if ((hasRockerInHand && st.energy >= 5 || hasBoneKingInHand && st.bones >= 3) && boardFodderCnt < 3 && ['cmwgd14oa2890', 'cmwgczzbob0ta', 'cmwfdqzl799uk', 'cmwc9mbry93dx'].includes(c.data.id)) {
        totalScore += 420;
      }
      if (c.data.id === 'cmwggjooddagz' || c.data.id === 'cmwgd14oa2890') {
        if (battle.turn <= 4) totalScore += 240; // 2费过牌/招骷髅谢幕曲前期积极下场叠任务
      } else if (c.data.id === 'cmwc9mbry93dx' || c.data.id === 'cmwfdqzl799uk') {
        if ((hasRockerInHand && st.energy < 5) && !canSummonBoneKingThisTurn && boardFodderCnt < 3) {
          totalScore -= 240; // 为6费主唱预留0/1费廉价祭品
        }
      } else if (c.data.id === 'cmwghmf9xj9dv') {
        const deadLwCnt = (st.graveyard || []).filter(g => g && g.type === 'minion' && getCardCostValue(g) <= 3).length;
        const sacComboFodder = sacLanes.filter(sl => battle.board[1][sl] && ['cmwata95yc8j5', 'cmwc0auyporsj', 'cmwc0a6dn4bel'].includes(battle.board[1][sl].data.id)).length;
        totalScore += (deadLwCnt >= 2 ? 1420 : 860) + sacComboFodder * 260;
      } else if (c.data.id === 'cmwgeg2eggz9t') {
        const oppCnt = battle.board[0].filter(m => m && m.data.type === 'minion').length;
        const deadVal2 = (st.graveyard || []).filter(g => g && g.type === 'minion' && getCardCostValue(g) <= 2).length;
        const hasLoverCrest = (st.crests || []).some(cr => cr.id === 'crest_skeleton_lovers');
        totalScore += (hasLoverCrest ? 240 : 620) + oppCnt * 140 + Math.min(3, deadVal2) * 120;
      } else if (c.data.id === 'cmwgxtqho266t') {
        const rockerOnBoard = battle.board[1].some(m => m && m.data.id === 'cmwghmf9xj9dv');
        if (rockerOnBoard) totalScore += 680;
        else if (choiceIdx === 1) totalScore += 460 + boardFodderCnt * 170;
      } else if (c.data.id === 'cmwgh0uggjyno') {
        const undeadHandCnt = st.hand.filter(h => h !== c && hasRace(h.data, '亡灵')).length;
        const hasBoneKing = st.hand.some(h => h !== c && h.data.id === 'cmwffityz44sn');
        if (undeadHandCnt >= 1 && emptyLanes.length >= 2) totalScore += 320 + (undeadHandCnt + 1) * 85 + (hasBoneKing ? 280 : 0);
      } else if (c.data.id === 'cmwke2qdplbkf') {
        const nonUndeadOpp = battle.board[0].filter(m => m && m.data.type === 'minion' && !hasRace(m.data, '亡灵'));
        const killableNonUndead = nonUndeadOpp.filter(m => !m.activeKw['屏障'] && m.currentHp <= 2).length;
        if (killableNonUndead >= 2 || nonUndeadOpp.length >= 2) totalScore += 540 + killableNonUndead * 200;
      } else if (c.data.id === 'cmwdxt4vgtk9g') {
        if (st.bones < 10) totalScore -= 1600;
        else if (sacLanes.length === 4) totalScore += st.bones >= 20 ? 1500 : 1050;
      } else if (c.data.id === 'cmwgdqawegvy3') {
        if ((st.destroyedLastWordsCount || 0) > 10) totalScore += 1350; // 满10谢幕曲获得毁灭+虹吸+荆棘5，最强翻盘点
        else if (st.hp <= 10 && sacLanes.length === 3) totalScore += 180;
        else totalScore -= 460;
      } else if (c.data.id === 'cmwffityz44sn') {
        const bigSac = sacLanes.some(sl => battle.board[1][sl] && !['cmwata95yc8j5', 'cmwc0auyporsj', 'cmwc0a6dn4bel'].includes(battle.board[1][sl].data.id) && (battle.board[1][sl].currentAtk >= 4 || getBoardMinionEffectiveValueForAI(battle.board[1][sl]) >= 5.5));
        const sacComboFodder = sacLanes.filter(sl => battle.board[1][sl] && ['cmwata95yc8j5', 'cmwc0auyporsj', 'cmwc0a6dn4bel'].includes(battle.board[1][sl].data.id)).length;
        if (bigSac && baseFaceDmg < pst.hp) totalScore -= 3500;
        else if (sacLanes.length === 3) totalScore += 980 + sacComboFodder * 320;
      }

      // === [5] 龙族·苍穹龙血 AI（增强抗压节奏与进化协同） ===
      const hasIncOnBoard = battle.board[1].some(m => m && m.data.id === 'cmwdvrwfcy5gg');
      const dragonUnderPressure = (playerBoardTotalAtk >= 5 && myMinions.length <= 1) || st.hp <= 15;
      if (c.data.id === 'cmwho72hssbxy') {
        if (st.hand.length <= 4) totalScore += 420;
        if (dragonUnderPressure) totalScore += 320; // 高压下 2/4 守护+防空优先护脸
      }
      if (c.data.id === 'cmwdvrwfcy5gg' || c.data.id === 'cmwdw2v21c73r') {
        totalScore += dragonUnderPressure && c.data.id === 'cmwdvrwfcy5gg' ? 120 : 420;
        if (c.data.id === 'cmwdvrwfcy5gg') {
          if (!hasIncOnBoard && emptyLanes.length >= 2 && !dragonUnderPressure) totalScore += 520;
          else if (!hasIncOnBoard && emptyLanes.length >= 2 && dragonUnderPressure) totalScore += 140;
          else if (hasIncOnBoard) totalScore -= 420;
          if (st.hand.some(h => h !== c && ['cmwdtm73fwg1u', 'cmwdvmwjm0301'].includes(h.data.id))) totalScore += 240;
        }
        if (c.data.id === 'cmwdw2v21c73r' && st.hand.some(h => h !== c && ['cmwdtm73fwg1u', 'cmwdvmwjm0301', 'cmwe1tj7fh3ot', 'cmwdzojlzzf98'].includes(h.data.id) && getEffectiveEnergy(h, st) + getEffectiveEnergy(c, st) <= st.energy)) {
          totalScore += 580;
        }
      } else if (c.data.id === 'cmwdxmxskfby0') {
        totalScore += emptyLanes.length >= 2 ? 620 : 240;
      } else if (c.data.id === 'cmwe1w8cztclb') {
        const hasCd1EggOrDragon = battle.board[1].some(m => m && ['cmwdtm73fwg1u', 'cmwdts32am05i', 'cmwdtq4q7c8pe', 'cmwdui6uam6xe', 'cmwdukf0l090w'].includes(m.data.id) && m.countdown === 1);
        const hasHighCd2Dragon = battle.board[1].some(m => m && ['cmwdtq4q7c8pe', 'cmwdui6uam6xe', 'cmwdukf0l090w'].includes(m.data.id) && m.countdown === 2);
        const needCheapSac = st.hand.some(h => h !== c && ['cmwdzojlzzf98', 'cmwdz3reuida0'].includes(h.data.id));
        if (hasCd1EggOrDragon) totalScore += 560;
        else if (hasHighCd2Dragon) totalScore += 260;
        else if (needCheapSac && emptyLanes.length >= 2 && battle.board[1].some(m => m && m.countdown > 0)) totalScore += 140;
        else totalScore -= 1200;
      } else if (c.data.id === 'cmwdw5qt6cbqb' || c.data.id === 'cmwfdhecfc856') {
        totalScore += dragonUnderPressure && c.data.id === 'cmwdw5qt6cbqb' ? 540 : 380;
      } else if (c.data.id === 'cmwdwpfyd4xpp') {
        const cdDragons = battle.board[1].filter(m => m && hasRace(m.data, '龙族') && m.countdown !== null && m.countdown > 0).length;
        const hasHighCd1Dragon = battle.board[1].some(m => m && ['cmwdtq4q7c8pe', 'cmwdui6uam6xe', 'cmwdukf0l090w'].includes(m.data.id) && m.countdown === 1);
        const noBarrierDragons = battle.board[1].filter(m => m && m.data.type === 'minion' && hasRace(m.data, '龙族') && !(m.activeKw && m.activeKw['屏障'])).length;
        if (cdDragons >= 2) totalScore += cdDragons * 260;
        else if (hasHighCd1Dragon) totalScore += 360;
        else if (noBarrierDragons >= 2) totalScore += noBarrierDragons * 180;
        else if (cdDragons === 1 || noBarrierDragons === 1) totalScore += 180;
        else if (dragonUnderPressure) totalScore += 180; // 高压下 3/3 守护直接拍下去挡伤害
        else totalScore -= 240;
      } else if (c.data.id === 'cmwdwtfm8xm5c') {
        const hasFriendlyDragon = battle.board[1].some(m => m && m.data.type === 'minion' && hasRace(m.data, '龙族'));
        const canDropDragonFirst = st.hand.some(h => h !== c && hasRace(h.data, '龙族') && (h.data.sacrifice || 0) === 0 && getEffectiveEnergy(h, st) + getEffectiveEnergy(c, st) <= getTotalAvailableEnergy(st));
        if (playEval.mode === 'enhance') totalScore += 620;
        else if (hasFriendlyDragon) totalScore += 520;
        else if (canDropDragonFirst) totalScore -= 260; // 先下低费龙再拍侠客跳费
        else if (dragonUnderPressure || st.energy >= 5) totalScore += 120; // 无龙垫子时 5/5 直接站场，不再白白空过
        else totalScore -= 180;
      } else if (c.data.id === 'cmwdz3reuida0') {
        const hasDgCrest = (st.crests || []).some(cr => cr.id === 'crest_dragon_girl');
        const hasDeadBigDragon = (st.graveyard || []).some(g => g && ['cmwdui6uam6xe', 'cmwdtq4q7c8pe', 'cmwdukf0l090w'].includes(g.id));
        if (st.hp <= 16 || playerBoardTotalAtk >= 6) totalScore += 760;
        else if (!hasDgCrest) totalScore += 620;
        else if (hasDeadBigDragon) totalScore += 580;
      } else if (c.data.id === 'cmwdzojlzzf98') {
        const sacWeakSupport = sacLanes.some(sl => battle.board[1][sl] && ['cmwe1w8cztclb', 'cmwdvbzosilgg'].includes(battle.board[1][sl].data.id));
        if (sacWeakSupport) totalScore += 280;
      } else if (c.data.id === 'cmwdvmwjm0301' || c.data.id === 'cmwe1tj7fh3ot') {
        const dragonBonus = (c.data.id === 'cmwdvmwjm0301' && battle.board[1].some(m => m && hasRace(m.data, '龙族'))) ? 220 : 0;
        totalScore += (hasIncOnBoard ? 220 : 0) + (emptyLanes.length >= 2 ? 280 : 120) + dragonBonus;
      } else if (c.data.id === 'cmwdtm73fwg1u' || c.data.id === 'cmwdts32am05i' || c.data.id === 'cmwdtq4q7c8pe' || c.data.id === 'cmwdui6uam6xe' || c.data.id === 'cmwdukf0l090w' || c.data.id === 'cmwdv3usmmzyp') {
        const barrierBonus = (c.activeKw && c.activeKw['屏障']) ? 160 : 0;
        totalScore += (c.data.id === 'cmwdtm73fwg1u' && hasIncOnBoard ? 420 : 280) + (c.data.atk || 1) * 35 + barrierBonus;
      }

      // === [6] 对手卡组情报与公开信息博弈 ===
      // (a) 公开手牌直伤防线：对手公开手牌有直伤(刺骨/鲜血爆发)且我方血线危险时，优先护脸/回复
      if (st.hp <= 10 + aiCtx.oppPublicBurn && c.data.type === 'minion' && ((c.data.keywords || []).some(k => k.k === '守护') || (c.data.keywords || []).some(k => k.k === '虹吸'))) {
        totalScore += 220;
      }
      // (b) 机械铺场 AOE/解场优先级：对手场上已有3+机械时，优先解场与AOE防魔导机兵少女/超载机皇联动
      if (aiCtx.intel.archetype === 'mech' && aiCtx.oppMechBoard >= 3) {
        if (targetValueScore > 0 || ['cmwgyks2fu1p5', 'cmwhilw8iwvet', 'cmwkgxi000fpl', 'cmwm86ka6xbwr', 'cmwcba1blx523'].includes(c.data.id)) {
          totalScore += 240;
        }
      }
      // (c) 对阵龙族：防空随从价值提升，且硬解绝不浪费在0/3雏龙的蛋上
      if (aiCtx.intel.archetype === 'dragon') {
        if (c.data.type === 'minion' && (c.data.keywords || []).some(k => k.k === '防空')) {
          totalScore += 120;
        }
        if (['cmwfd8opa9wwf', 'cmwffsync2y12', 'cmwlnaq43tdtd'].includes(c.data.id) && effTarget >= 0) {
          const tm = battle.board[0][effTarget];
          if (tm && tm.data.id === 'cmwdtm73fwg1u' && baseFaceDmg < pst.hp) {
            totalScore -= 420;
          }
        }
      }
      // (d) 规避狂暴女拳师(hp < 10 触发4伤AOE)压血阈值
      if (aiCtx.avoidTriggerBrawler && baseFaceDmg < pst.hp && ['cmwgyx2fz9jks', 'cmwgyxdbows5c'].includes(c.data.id) && effTarget < 0) {
        totalScore -= 280;
      }

      // 评估铺场溢出与腾格子策略：
      // 1) 若打出后预计净新增随从 > 当前空位，会对溢出随从扣分（降低优先级但不一刀切禁止）
      // 2) 若当前空位紧张 (<= 2) 且手牌中有其他想打出的铺场卡，优先打出能净腾出格子的献祭/自毁卡！

      // 积极献祭奖励：如果破坏场上随从作为祭品后，新卡及衍生物让场上最终价值净提升，给予积极加分
      if (sacLanes.length > 0) {
        const sacrificedVal = sacLanes.reduce((sum, sl) => sum + (battle.board[1][sl] ? getBoardMinionEffectiveValueForAI(battle.board[1][sl]) : 0), 0);
        const sacrificedAtk = sacLanes.reduce((sum, sl) => sum + (battle.board[1][sl] ? (battle.board[1][sl].currentAtk || 0) : 0), 0);
        const realSelfVal = Math.max(0, selfValue - sacLanes.length * 1.5);
        const newTotalVal = realSelfVal + extraSummons * 1.5;
        const netValGain = newTotalVal - sacrificedVal;
        if (netValGain > 0) {
          totalScore += netValGain * 48;
          if (emptyLanes.length <= 1) totalScore += 260; // 满场或格子紧张时积极用献祭升级场面
        }
        if (c.data.id === 'cmwdz3reuida0' && sacrificedAtk >= 7 && (choiceIdx === 0 || (choiceIdx === 1 && battle.board[1].filter((m, idx) => m && !sacLanes.includes(idx)).length < 2))) {
          totalScore -= 900; // 不要献祭高攻场面去换低攻孵化
        }
        if (c.data.id === 'cmwdzojlzzf98' && emptyLanes.length >= 1) {
          const sacEvolving = sacLanes.some(sl => {
            const sm = battle.board[1][sl];
            return sm && sm.countdown !== null && sm.countdown > 0 && String(sm.data.timerEffect || '').includes('变身为');
          });
          if (sacEvolving) totalScore -= 2500; // 严禁用窃蛋龙吃正在倒计时变身的龙蛋/雏龙
        }
      }
      const selfBoardOccupy = isBoardCard ? 1 : 0;
      const selfDestroySlot = (req === 'friendly_minion' && fullTxt.includes('破坏')) ? 1 : 0;
      const netBoardDelta = selfBoardOccupy + extraSummons - sacLanes.length - selfDestroySlot;
      if (netBoardDelta > emptyLanes.length) {
        const overflowCnt = netBoardDelta - emptyLanes.length;
        totalScore -= Math.min(180, overflowCnt * 55);
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

      // 未来骨头资源分配：手牌有高价值耗骨卡时，避免用低价值耗骨卡把骨头花光
      if ((playEval.costB || 0) > 0 && selfValue <= 2.5) {
        const hasBigBonePayoff = st.hand.some(h => h !== c && (h.data.bones || 0) >= 4 && getCardCostValue(h.data) >= 5.0 && (st.bones - (playEval.costB || 0)) < (h.data.bones || 0));
        if (hasBigBonePayoff) totalScore -= 240;
      }
      // 费用节奏利用率加权（仅对有效身材/节奏牌给予正激励；对需留牌配合的1费纯组件不强行逼出）
      const usedRes = (playEval.costE || 0) + (playEval.costB || 0) * 0.45;
      if (c.data.type === 'minion') {
        totalScore += usedRes * 22 + ((c.data.atk || 0) + (c.data.hp || 0)) * 8;
      } else {
        totalScore += usedRes * 14;
      }
      // 纹章守护：若场上已有需剩余能量触发的纹章，避免用低价值牌把触发所需能量花光
      const remAfterPlay = st.energy - (playEval.costE || 0);
      const hasCourtCrest = (st.crests || []).some(cr => cr.id === 'crest_court_prayer' && (cr.countdown || 0) > 0);
      const hasAngelCrest = (st.crests || []).some(cr => cr.id === 'crest_generous_angel' && (cr.countdown || 0) > 0);
      const hasHealCrest = (st.crests || []).some(cr => cr.id === 'crest_tranquil_healer' && (cr.countdown || 0) > 0);
      const guardCntNow = battle.board[1].filter(m => m && m.activeKw && m.activeKw['守护']).length;
      if (hasCourtCrest && st.energy >= 2 && remAfterPlay < 2 && guardCntNow >= 2 && baseFaceDmg < pst.hp && selfValue <= 3) {
        totalScore -= 380; // 留2费触发神圣宫廷祷告师全守护+1/+1+AOE
      } else if (hasAngelCrest && st.energy >= 1 && remAfterPlay < 1 && st.hand.length <= 6 && baseFaceDmg < pst.hp && selfValue <= 2) {
        totalScore -= 240; // 留1费触发慷慨的天使抽1
      } else if (hasHealCrest && st.energy >= 1 && remAfterPlay < 1 && st.hp <= 16 && baseFaceDmg < pst.hp && selfValue <= 2) {
        totalScore -= 240; // 留1费触发宁静的治愈师回3
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
      spendLeaderEnergy(1, bestAction.eCost || 0);
      st.energySpentTotal = (st.energySpentTotal || 0) + (bestAction.eCost || 0);
      st.bones -= (bestAction.bCost || 0);
      bestAction.minion.activatedThisTurn = true;
      sfx.play('synergy');
      if (bestAction.minion.data.id === 'cmwgysie8srmh') {
        const rc = (st.crests || []).find(cr => cr.id === 'crest_arrogant_rose');
        if (rc) {
          rc.countdown += 1;
          await playCrestTriggerVFX(1, rc.id);
          await showTriggeredEffectToast(bestAction.minion.data, `【启动】使【${rc.name}】倒计时+1（当前 ${rc.countdown}）！`, 240);
          renderAllBattleUI();
        }
      } else if (bestAction.minion.data.id === 'cmwgyyghnbr4n') {
        await showTriggeredEffectToast(bestAction.minion.data, '【启动】消耗 6 骨头，将 2 张『鲜血爆发』加入手牌！', 240);
        await addCardToHandAnimated(1, '鲜血爆发', 2, bestAction.lane, bestAction.minion.data.name);
      } else if (bestAction.minion.data.id === 'cmwgz1zd1u6au') {
        bestAction.minion.countdown = (bestAction.minion.countdown || 0) + 1;
        spawnFloatNumber(1, bestAction.lane, '⏳+1', '#38bdf8');
        await showTriggeredEffectToast(bestAction.minion.data, `【启动】使『阴深的城堡』倒计时+1（当前 ${bestAction.minion.countdown}）！`, 240);
        renderAllBattleUI();
      } else if (bestAction.minion.data.id === 'cmwgrgw6jyd8p') {
        await showTriggeredEffectToast(bestAction.minion.data, '【启动】消耗 6 骨头，发动【亡者召还_价值3】！', 240);
        await reanimateMinionAnimated(1, { value: 3 }, '', bestAction.lane, false, bestAction.minion.data.name);
      } else if (bestAction.minion.data.id === 'cmwbxu7u3tpyo') {
        await showTriggeredEffectToast(bestAction.minion.data, '【启动】将2张『电子羊』加入手牌。', 240);
        await addCardToHandAnimated(1, '电子羊', 2, bestAction.lane, bestAction.minion.data.name);
      } else if (bestAction.minion.data.id === 'cmwfdhecfc856') {
        await showTriggeredEffectToast(bestAction.minion.data, '【启动】将1张具有屏障的『雏龙的蛋』加入手牌。', 240);
        await addCardToHandAnimated(1, '雏龙的蛋', 1, bestAction.lane, bestAction.minion.data.name, '屏障');
      } else if (bestAction.minion.data.id === 'cmwdw5qt6cbqb') {
        const wyvCrest = (st.crests || []).find(cr => cr.id === 'crest_wyvern_rider');
        if (wyvCrest) {
          wyvCrest.countdown += 1;
          await playCrestTriggerVFX(1, wyvCrest.id);
          await showTriggeredEffectToast(bestAction.minion.data, `【启动】使【${wyvCrest.name}】倒计时+1（当前倒计时 ${wyvCrest.countdown}）！`, 240);
          renderAllBattleUI();
        }
      } else if (bestAction.minion.data.id === 'cmwlomedyjchl') {
        const oppM = [0,1,2,3,4].filter(el => battle.board[0][el] && battle.board[0][el].data.type === 'minion' && !battle.board[0][el].activeKw['潜行']);
        if (oppM.length > 0) {
          oppM.sort((a, b) => analyzeMinionKillValueForAI(battle.board[0][b]) - analyzeMinionKillValueForAI(battle.board[0][a]));
          const tl = oppM[0];
          await showTriggeredEffectToast(bestAction.minion.data, `【启动】对『${battle.board[0][tl].data.name}』造成3点伤害并召唤1个『骷髅』！`, 240);
          await dealDamageToMinionAnimated(0, tl, 3, bestAction.minion);
          await summonByNameAnimated(1, '骷髅', 1, bestAction.lane, false, bestAction.minion.data.name);
        }
      } else if (bestAction.minion.data.id === 'cmwdzvs1woa53') {
        if (st.hand.length > 0) {
          st.hand.sort((a, b) => getCardCostValue(a.data) - getCardCostValue(b.data));
          const discarded = st.hand.shift();
          addBones(1, 1);
          spawnFloatNumber(1, -1, '🦴弃牌 骨头+1', '#fde047');
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
  if (_sid === _battleSessionSeq && !battle.gameOver) {
    await executeEndTurnSequence(1);
  }
}

