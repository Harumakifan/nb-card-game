// 参数顺序与 _innerCommitCardPlayWithAnimations 一致（旧版形参名与实际含义错位，已更正）
async function commitCardPlayWithAnimations(side, card, playEval, targetLane, sacLanes = [], effectTargetLane = -1, choiceIdx = -1, handTargetUid = -1, effectTargetSide = -1, effectTargetLane2 = -1) {
  if (cfIsOnlineClient() && side === 0) {
    // 联机：把玩家的选择交给服务器结算，结果（含特效事件）通过 STATE 消息返回
    return cfNetPlayCard(card, targetLane, Array.isArray(sacLanes) ? sacLanes : [], effectTargetLane, choiceIdx, handTargetUid, effectTargetSide, effectTargetLane2);
  }
  return _innerCommitCardPlayWithAnimations(side, card, playEval, targetLane, sacLanes, effectTargetLane, choiceIdx, handTargetUid, effectTargetSide, effectTargetLane2);
}
async function playHandCardWaveAndVanishVFX(side, card) {
  if (!card) return;
  // 标记即将入场（用于后续战场落位入场动画）
  card._cfPlayEnterAnim = true;
  if (side === 0) {
    const handEl = document.querySelector(`#playerHandZone .sv-hand-card[data-card-uid="${card.uid}"], #playerHandZone .sv-hand-card[data-uid="${card.uid}"]`);
    const dropPos = window._cfLastDragDropPos;
    const useDrop = dropPos && dropPos.uid === String(card.uid) && (Date.now() - dropPos.ts < 2500);
    if (useDrop) {
      window._cfLastDragDropPos = null;
      if (handEl) handEl.style.visibility = 'hidden';
      const r = (card.data && card.data.rarity) || '普通';
      const glowCol = r === '传说' ? '#fde047' : (r === '史诗' ? '#c084fc' : (r === '稀有' ? '#38bdf8' : '#f59e0b'));
      const stage = document.createElement('div');
      stage.className = 'cf-dissolve-stage';
      stage.style.left = dropPos.x + 'px';
      stage.style.top = dropPos.y + 'px';
      stage.style.setProperty('--dissolve-col', glowCol);

      const ghostCard = buildHandCardDOM(card.data, card);
      ghostCard.classList.add('cf-dissolve-card-body');
      stage.appendChild(ghostCard);

      // 双层卡框形状「方框瞬间向外扩散消散」
      const rect1 = document.createElement('div');
      rect1.className = 'cf-dissolve-rect cf-dissolve-rect-1';
      stage.appendChild(rect1);
      const rect2 = document.createElement('div');
      rect2.className = 'cf-dissolve-rect cf-dissolve-rect-2';
      stage.appendChild(rect2);

      document.body.appendChild(stage);
      try { sfx.play('play'); } catch (e) {}
      // 消散开始的瞬间（仅 80ms）即刻放行战场放置与入场动画，消散残影在后台播完自毁，零卡顿等待！
      setTimeout(() => stage.remove(), 280);
      await sleep(80);
      return;
    }
    if (handEl) {
      handEl.classList.add('sv-card-border-wave');
      await sleep(200);
      handEl.classList.add('sv-card-vanish-vfx');
      await sleep(160);
    }
  } else {
    const eZone = document.getElementById('enemyHandBacks');
    const cardEl = (eZone && eZone.children.length > 0) ? eZone.children[0] : null;
    if (cardEl) {
      cardEl.classList.add('sv-card-border-wave');
      await sleep(180);
      cardEl.classList.add('sv-card-vanish-vfx');
      await sleep(140);
    }
  }
}

async function _innerCommitCardPlayWithAnimations(side, card, playEval, targetLane, sacLanes, effectTargetLane, choiceIdx, handTargetUid, effectTargetSide = -1, effectTargetLane2 = -1) {
  battle.animating = true;
  try {
  showSacrificeGuideBanner('', '');
  await playHandCardWaveAndVanishVFX(side, card);
  const st = battle.leaders[side];
  if (card && card.data && card.data.id === 'token_lucky_coin' && st) st.usedLuckyCoinThisTurn = true;
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
        recordDestroyedMinionCounters(st, sacM);
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

  const spentE = (playEval.costE !== undefined ? playEval.costE : getEffectiveEnergy(card, st));
  spendLeaderEnergy(side, spentE);
  st.energySpentTotal = (st.energySpentTotal || 0) + spentE + (playEval.boneSubE || 0);
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
  const _pv = getCardCostValue(card.data);
  if (Number.isInteger(_pv) && _pv >= 1 && _pv <= 8) { st.playedValues1to8 = st.playedValues1to8 || {}; st.playedValues1to8[_pv] = true; }
  recordBattleTurnEvent(side, 'play', `使用卡牌『${card.data.name}』`, card.data);
  if (typeof window.cfTraceEvent === 'function') window.cfTraceEvent({ kind: 'play', card: card.data.name, cost: card.data.energy || 0, lane: targetLane, hp: [battle.leaders[0].hp, battle.leaders[1].hp] });
  const combo = st.cardsPlayedThisTurn;
  renderAllBattleUI();
  if (typeof renderBattleRecordPanel === 'function') renderBattleRecordPanel();

  if (playEval.mode === 'accelerate' && ast.accelerate) {
    if (card.data.id === 'cmwlp6mctrvla') {
      let keptCard = st.hand.find(h => h.uid === handTargetUid) || null;
      if (!keptCard && st.hand.length > 0) {
        const sorted = [...st.hand].sort((a, b) => getCardCostValue(b.data) - getCardCostValue(a.data));
        keptCard = sorted[0];
      }
      const discardedCount = keptCard ? Math.max(0, st.hand.length - 1) : st.hand.length;
      st.hand = keptCard ? [keptCard] : [];
      if (discardedCount > 0) {
        addBones(side, discardedCount);
        spawnFloatNumber(side, -1, `🦴弃牌 骨头+${discardedCount}`, '#fde047');
      }
      await showTriggeredEffectToast(card.data, `【激奏_能量1】${keptCard ? `保留『${keptCard.data.name}』，弃置 ${discardedCount} 张手牌并重抽 ${discardedCount} 张！` : '手牌为空。'}${battle.turn === 1 ? '（第1回合额外抽1张！）' : ''}`, 280);
      for (let di = 0; di < discardedCount; di++) {
        if (!battle.gameOver) await drawCardAnimated(side);
      }
      if (battle.turn === 1 && !battle.gameOver) {
        await drawCardAnimated(side);
      }
    } else {
      await executeASTActionList(side, card, -1, ast.accelerate.actions, effectTargetLane, false);
    }
    addBones(side, 1);
    if (!battle.gameOver && typeof checkAndTriggerDeusExMachinaInvocation === 'function') {
      await checkAndTriggerDeusExMachinaInvocation(side);
    }
    battle.animating = false;
    renderAllBattleUI();
    return;
  }

  if (playEval.mode === 'crystallize' && ast.crystallize) {
    const origName = card.data.name;
    const origId = card.data.id;
    const crystCostE = playEval.costE !== undefined ? playEval.costE : ast.crystallize.cost;
    const lwLinked = ast.crystallize.lw ? String(ast.crystallize.lw).replace(new RegExp(`(?<!『)${origName}(?!』)`, 'g'), `『${origName}』`) : '';
    card.data = Object.assign({}, card.data, {
      type: 'amulet',
      name: `结晶：${origName}`,
      artCardName: origName,
      sourceCardId: origId,
      sourceCardName: origName,
      energy: crystCostE,
      bones: 0,
      sacrifice: 0,
      fullText: `【结晶】由『${origName}』结晶化为护符。${ast.crystallize.timer > 0 ? `\n【倒计时_${ast.crystallize.timer}】` : ''}${lwLinked ? `\n【谢幕曲】${lwLinked}` : ''}`
    });
    card.activeKw = {};
    if (ast.crystallize.timer > 0) card.countdown = ast.crystallize.timer;
    if (ast.crystallize.lw) {
      card.extraLastWords = card.extraLastWords || [];
      if (!card.extraLastWords.some(x => x && x.type === 'ast_actions' && x.desc === ast.crystallize.lw)) {
        card.extraLastWords.push({ type: 'ast_actions', actions: ast.crystallize.lwActions || [], desc: ast.crystallize.lw });
      }
      addGrantedEffect(card, `来源：【结晶】 → 由『${origName}』结晶化（谢幕曲：${ast.crystallize.lw}）`);
    }
    if (battle.board[side][targetLane] !== null) targetLane = findFirstEmptyLane(side);
    if (targetLane !== -1) {
      await placeMinionOnBoardAnimated(side, card, targetLane, true);
    }
    if (ast.crystallize.actions && ast.crystallize.actions.length > 0) {
      await executeASTActionList(side, card, targetLane, ast.crystallize.actions, effectTargetLane, false);
    }
    battle.animating = false;
    renderAllBattleUI();
    return;
  }

  if (card.data.type === 'minion' || card.data.type === 'amulet') {
    if (battle.board[side][targetLane] !== null) targetLane = findFirstEmptyLane(side);
    if (targetLane === -1) { battle.animating = false; return; }

    await placeMinionOnBoardAnimated(side, card, targetLane, true);
    for (const sacItem of deferredSacLastWords) {
      if (battle.gameOver) break;
      await triggerFriendlyMinionDestroyedPassives(side, sacItem.m);
      await triggerMinionLeftBoardPassives(side, sacItem.m);
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
        if (choiceIdx === 1) {
          await showTriggeredEffectToast(card.data, '【抉择(2)】使己方战场上的其他龙族随从获得屏障！', 280);
          for (let l = 0; l < 5; l++) {
            const ally = battle.board[side][l];
            if (ally && ally !== card && ally.data.type === 'minion' && hasRace(ally.data, '龙族')) {
              ally.activeKw['屏障'] = 1;
              addGrantedEffect(ally, '来源：【慈爱的龙母】 → 获得屏障');
              spawnFloatNumber(side, l, '🛡️屏障', '#38bdf8');
            }
          }
          renderAllBattleUI();
        } else {
          await showTriggeredEffectToast(card.data, '【抉择(1)】使己方战场上的所有龙族卡牌倒计时-1！', 280);
          for (let l = 0; l < 5; l++) {
            const ally = battle.board[side][l];
            if (ally && hasRace(ally.data, '龙族') && ally.countdown !== null) {
              await reduceCardCountdown(side, l, 1, card, 0);
            }
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
          await showTriggeredEffectToast(card.data, '【入场曲·抉择(1)】获得【纹章：孵化万物的龙女】(永久)！', 280);
          await grantLeaderCrest(side, {
            id: 'crest_dragon_girl',
            name: '纹章：孵化万物的龙女',
            countdown: null,
            desc: '每当龙族随从进入己方战场时，使其倒计时-1且获得【屏障】；【飞龙、远古巨龙】进入己方战场时，使其获得【谢幕曲】召唤1个雏龙的蛋。',
            cardData: card.data,
            sourceUid: card.uid
          });
        } else if (choiceIdx === 1) {
          await showTriggeredEffectToast(card.data, '【入场曲·抉择(2)】发动3次【亡者召还_价值4（仅限龙族）】！', 280);
          for (let r = 0; r < 3; r++) {
            if (battle.gameOver) break;
            await reanimateMinionAnimated(side, { value: 4 }, '龙族', targetLane, false, card.data.name);
          }
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
      case 'cmwfdhecfc856': // 龙蛋收藏家：将1张具有屏障的『雏龙的蛋』加入手牌
        await showTriggeredEffectToast(card.data, '【入场曲】将1张具有屏障的『雏龙的蛋』加入自己的手牌！', 280);
        await addCardToHandAnimated(side, '雏龙的蛋', 1, targetLane, card.data.name, '屏障');
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
        await showTriggeredEffectToast(card.data, '获得【纹章：血法师】(倒计时3)！', 280);
        await grantLeaderCrest(side, {
          id: 'crest_blood_mage',
          name: '纹章：血法师',
          countdown: 3,
          desc: '己方主战者在自己回合受到伤害时，对敌方随从全体和敌方主战者造成1点伤害。',
          cardData: card.data
        });
        break;
      case 'cmwgdalzmzj83':
        await showTriggeredEffectToast(card.data, '获得【纹章：残暴的尸兽】(倒计时3)！', 280);
        await grantLeaderCrest(side, {
          id: 'crest_brutal_beast',
          name: '纹章：残暴的尸兽',
          countdown: 3,
          desc: '倒计时3：回合开始时，对己方主战者造成1点伤害，抽1张牌。',
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
      case 'cmwgxtqho266t': // 鬼火将军
        if (choiceIdx === 0) {
          await showTriggeredEffectToast(card.data, '【入场曲】【亡者召还_价值2】×3！', 280);
          for (let k = 0; k < 3; k++) {
            if (battle.gameOver) break;
            await reanimateMinionAnimated(side, { value: 2 }, '', targetLane, false, card.data.name);
          }
        } else {
          await showTriggeredEffectToast(card.data, '【入场曲】召唤 3 个『怨灵』！', 260);
          await summonByNameAnimated(side, '怨灵', 3, targetLane, false, card.data.name);
        }
        break;
      case 'cmwgysie8srmh': // 傲慢的蔷薇大小姐
        await showTriggeredEffectToast(card.data, '【入场曲】获得【纹章：傲慢的大小姐】（主战者受伤-2，倒计时1）！', 260);
        await grantLeaderCrest(side, {
          id: 'crest_arrogant_rose',
          name: '纹章：傲慢的大小姐',
          countdown: 1,
          desc: '自己的主战者受到的伤害-2。',
          cardData: card.data
        });
        break;
      case 'cmwgyyghnbr4n': // 蝙蝠女王
        await showTriggeredEffectToast(card.data, '【入场曲】召唤 2 个『蝙蝠』，使己方场上所有『蝙蝠』获得【毁灭】！', 280);
        await summonByNameAnimated(side, '蝙蝠', 2, targetLane, false, card.data.name);
        for (let l = 0; l < 5; l++) {
          const bm = battle.board[side][l];
          if (bm && bm.data.name === '蝙蝠' && !bm.activeKw['毁灭']) {
            bm.activeKw['毁灭'] = 1;
            addGrantedEffect(bm, '来源：【蝙蝠女王】 → 获得【毁灭】');
            spawnFloatNumber(side, l, '☠️毁灭', '#a855f7');
          }
        }
        renderAllBattleUI();
        break;
      case 'cmwgz33kwr8uh': { // 利刃蔷薇剑士
        const xCnt = st.selfTurnDamageCount || 0;
        const xDmg = xCnt + 1;
        await showTriggeredEffectToast(card.data, `【入场曲】本回合已受伤 ${xCnt} 次，对敌方目标随从与主战者造成 ${xDmg} 点伤害！`, 260);
        if (xDmg > 0) {
          if (effectTargetLane >= 0 && battle.board[opp][effectTargetLane]) {
            await playSynergyBeam(getLaneDOM(side, targetLane), getLaneDOM(opp, effectTargetLane), '#f43f5e', 240);
            await dealDamageToMinionAnimated(opp, effectTargetLane, xDmg, card);
          }
          if (!battle.gameOver) await dealDamageToLeaderAnimated(opp, xDmg, card);
        }
        break;
      }
      case 'cmwhhqrb9fi71': { // 被束缚的蔷薇公主
        let transCnt = 0;
        for (let hi = 0; hi < st.hand.length; hi++) {
          const hc = st.hand[hi];
          if (getCardCostValue(hc.data) <= 3) {
            const targetName = Math.random() < 0.5 ? '刺骨' : '鲜血爆发';
            const rep = createCardInstance(targetName, side);
            if (rep) {
              addGrantedEffect(rep, `来源：【被束缚的蔷薇公主】 → 由『${hc.data.name}』转化`);
              st.hand[hi] = rep;
              transCnt++;
            }
          }
        }
        await showTriggeredEffectToast(card.data, `【入场曲】将手牌中 ${transCnt} 张价值3以下卡牌转化为『刺骨』或『鲜血爆发』！`, 280);
        renderAllBattleUI();
        break;
      }
      case 'cmwhhzt6ezp08': // 蔷薇近卫
        await showTriggeredEffectToast(card.data, '【入场曲】对己方主战者造成 1 点伤害，召唤 1 个『蝙蝠』！', 240);
        await dealDamageToLeaderAnimated(side, 1, card);
        if (!battle.gameOver) await summonByNameAnimated(side, '蝙蝠', 1, targetLane, false, card.data.name);
        break;
      case 'cmwhi7h552gc8': // 玩闹的恶魔
        await showTriggeredEffectToast(card.data, '【入场曲】对己方主战者造成 1 点伤害！', 220);
        await dealDamageToLeaderAnimated(side, 1, card);
        break;
      case 'cmwhie9u1p4ey': // 蔷薇猛虎
        await showTriggeredEffectToast(card.data, '【入场曲】对己方主战者造成 1 点伤害！', 220);
        await dealDamageToLeaderAnimated(side, 1, card);
        break;
      case 'cmwhilw8iwvet': { // 摇滚骷髅乐团鼓手
        const xCnt = st.totalSelfTurnDamageCount || 0;
        const aoeDmg = xCnt >= 6 ? (xCnt - 5) : 0;
        if (xCnt >= 10 && !card.activeKw['虹吸']) {
          card.activeKw['虹吸'] = 1;
          addGrantedEffect(card, '来源：【摇滚骷髅乐团鼓手】 → 自残≥10获得【虹吸】');
        }
        await showTriggeredEffectToast(card.data, `【入场曲】本局己方回合受伤 ${xCnt} 次${xCnt >= 10 ? '（≥10获得【虹吸】）' : ''}，${aoeDmg > 0 ? `对敌方全体随从造成 ${aoeDmg} 点伤害！` : '未达6次，未触发群体伤害。'}`, 280);
        if (aoeDmg > 0) {
          await playRowWideVFX(opp, 'damage_wave', 220);
          for (let l = 0; l < 5; l++) {
            if (battle.board[opp][l] && battle.board[opp][l].data.type === 'minion') {
              await dealDamageToMinionAnimated(opp, l, aoeDmg, card);
            }
          }
        }
        renderAllBattleUI();
        break;
      }
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
        await showTriggeredEffectToast(card.data, '【入场曲】对敌方全体随从造成 2 点伤害，获得【纹章：骸骨和少女】并连续发动3次【亡者召还_价值2】！', 280);
      await applyAoeDamageSimultaneousAnimated([0,1,2,3,4].map(x => ({ side: 1 - side, lane: x })), 2, card);
        await grantLeaderCrest(side, {
          id: 'crest_skeleton_lovers',
          name: '纹章：骸骨和少女',
          countdown: null,
          desc: '回合结束时，若敌方战场上有随从，则破坏己方战场上1个具有谢幕曲的随从，并随机破坏敌方战场上的1个随从。',
          cardData: card.data
        });
        for (let k = 0; k < 3; k++) await reanimateMinionAnimated(side, { value: 2 }, '', targetLane, false, card.data.name);
        break;
      case 'cmwget8v364ar': {
        const lostHp = Math.max(0, (st.maxHp || 30) - st.hp);
        const tiers = [3, 6, 9, 15, 21, 27].filter(t => lostHp >= t).length;
        if (tiers > 0) {
          card.currentAtk += tiers; card.currentHp += tiers; card.maxHp += tiers;
          addGrantedEffect(card, `来源：【大剑少女】 → 损血达标获得 +${tiers}/+${tiers}`);
          spawnFloatNumber(side, targetLane, `+${tiers}/+${tiers}`, '#fbbf24');
          await showTriggeredEffectToast(card.data, `主战者已损失 ${lostHp} 点生命，获得 +${tiers}/+${tiers}！`, 260);
          renderAllBattleUI();
        }
        break;
      }
      case 'cmwkgxi000fpl': { // 狂暴女拳师
        if (st.hp <= 10) {
          await showTriggeredEffectToast(card.data, `【入场曲】己方生命值 ${st.hp}（≤10）：对所有敌方随从和敌方主战者造成 4 点伤害！`, 280);
          await playRowWideVFX(opp, 'damage_wave', 240);
          await applyAoeDamageSimultaneousAnimated([0,1,2,3,4].map(el => ({ side: opp, lane: el })), 4, card);
          if (!battle.gameOver) await dealDamageToLeaderAnimated(opp, 4, card);
        }
        break;
      }
      case 'cmwkgzkuuxaoz': { // 疾驰魔将
        if (st.hp <= 15) {
          card.activeKw['飞行'] = 1;
          addGrantedEffect(card, '来源：【疾驰魔将】 → 生命值≤15获得【飞行】');
          spawnFloatNumber(side, targetLane, '🕊️飞行', '#38bdf8');
          await showTriggeredEffectToast(card.data, `【入场曲】己方生命值 ${st.hp}（≤15）：获得【飞行】！`, 240);
          renderAllBattleUI();
        }
        break;
      }
      case 'cmwkiou55bdcb': { // 苦痛监牢
        await showTriggeredEffectToast(card.data, '【入场曲】对己方主战者造成 1 点伤害，并抽取 1 张卡牌！', 240);
        await dealDamageToLeaderAnimated(side, 1, card);
        if (!battle.gameOver) await drawCardAnimated(side);
        break;
      }
      case 'cmwke7t3w6xig': {
        if ((st.destroyedLastWordsCount || 0) >= 7) {
          await showTriggeredEffectToast(card.data, `【入场曲】本局已破坏谢幕曲随从 ${st.destroyedLastWordsCount} 个（≥7）：发动【亡者召还_价值3】与【亡者召还_价值2】，并使自身与召唤随从获得【守护】与+1/+1！`, 300);
          const r3 = await reanimateMinionAnimated(side, { value: 3 }, '', targetLane, false, card.data.name);
          const r2 = await reanimateMinionAnimated(side, { value: 2 }, '', targetLane, false, card.data.name);
          const targets = [{ inst: card, lane: targetLane }];
          if (r3 && r3.inst) targets.push(r3);
          if (r2 && r2.inst) targets.push(r2);
          for (const t of targets) {
            if (!t || !t.inst || battle.board[side][t.lane] !== t.inst) continue;
            t.inst.activeKw['守护'] = 1;
            t.inst.currentAtk += 1; t.inst.currentHp += 1; t.inst.maxHp += 1;
            addGrantedEffect(t.inst, '来源：【派对南瓜头】 → 获得【守护】与 +1/+1');
            spawnFloatNumber(side, t.lane, '+1/+1 守护', '#fde047');
          }
          renderAllBattleUI();
        }
        break;
      }
      case 'cmwhlefn11ybd': {
        if ((st.totalSelfTurnDamageCount || 0) >= 7) {
          await showTriggeredEffectToast(card.data, `【入场曲】本局己方回合受伤 ${st.totalSelfTurnDamageCount} 次（≥7）：召唤 2 个『蔷薇的妖精』！`, 260);
          await summonByNameAnimated(side, 'cmwhlefn11ybd', 2, targetLane, false, card.data.name);
        }
        break;
      }
      case 'cmwhlmtv5rqx4': {
        if ((st.totalSelfTurnDamageCount || 0) >= 12) {
          await showTriggeredEffectToast(card.data, `【入场曲】本局己方回合受伤 ${st.totalSelfTurnDamageCount} 次（≥12）：召唤 2 个『地狱归来的凶魔』！`, 260);
          await summonByNameAnimated(side, 'cmwhlmtv5rqx4', 2, targetLane, false, card.data.name);
        }
        break;
      }
      case 'cmwhlsrjr4v9k': {
        const empowered = (st.totalSelfTurnDamageCount || 0) >= 7;
        const rVal = empowered ? 4 : 2;
        await showTriggeredEffectToast(card.data, `【入场曲】${empowered ? '受伤≥7强化：发动2次【亡者召还_价值4】并使全体友方随从+1/+1！' : '发动2次【亡者召还_价值2】并使全体友方随从+1/+1！'}`, 260);
        await reanimateMinionAnimated(side, { value: rVal }, '', targetLane, false, card.data.name);
        await reanimateMinionAnimated(side, { value: rVal }, '', targetLane, false, card.data.name);
        await playRowWideVFX(side, 'buff_wave', 240);
        for (let fl = 0; fl < 5; fl++) {
          const fm = battle.board[side][fl];
          if (fm && fm.data.type === 'minion') {
            fm.currentAtk += 1; fm.currentHp += 1; fm.maxHp += 1;
            addGrantedEffect(fm, '来源：【嗜血的亡灵】 → 全体友方 +1/+1');
            spawnFloatNumber(side, fl, '+1/+1', '#4ade80');
          }
        }
        renderAllBattleUI();
        break;
      }
      case 'cmwhm4gd57wh3':
        await showTriggeredEffectToast(card.data, '【入场曲】对己方主战者造成 1 点伤害！', 220);
        await dealDamageToLeaderAnimated(side, 1, card);
        break;
      case 'cmwhmittxj66h': {
        if (targetLane === 2) {
          const baseKwList = ['守护', '飞行', '防空', '毁灭', '荆棘', '屏障', '位移', '灵气', '潜行', '虹吸', '多重攻击', '两侧攻击', '三侧攻击', '全体攻击'];
          const copied = [];
          [targetLane - 1, targetLane + 1].forEach(nl => {
            const nm = battle.board[side][nl];
            if (nm && nm.data.type === 'minion') {
              baseKwList.forEach(k => {
                if (nm.activeKw[k] && !card.activeKw[k]) {
                  card.activeKw[k] = nm.activeKw[k];
                  copied.push(k);
                }
              });
            }
          });
          if (copied.length > 0) {
            addGrantedEffect(card, `来源：【折光镜像师·中央】 → 复制关键词【${copied.join('】【')}】`);
            spawnFloatNumber(side, targetLane, `✨${copied.slice(0,2).join('/')}`, '#38bdf8');
            await showTriggeredEffectToast(card.data, `【入场曲】位于中央战道，复制了相邻友方随从关键词：【${copied.join('】【')}】！`, 260);
            renderAllBattleUI();
          }
        } else if (targetLane === 0 || targetLane === 4) {
          card.activeKw['飞行'] = 1;
          addGrantedEffect(card, '来源：【折光镜像师·边缘】 → 获得【飞行】');
          spawnFloatNumber(side, targetLane, '🪽飞行', '#38bdf8');
          await showTriggeredEffectToast(card.data, '【入场曲】位于边缘战道，获得【飞行】！', 240);
          renderAllBattleUI();
        }
        break;
      }
      case 'cmwhmldky1fgg': {
        if (battle.board[opp][targetLane] === null) {
          const adjOpp = [targetLane - 1, targetLane + 1].filter(nl => nl >= 0 && nl < 5 && battle.board[opp][nl] && battle.board[opp][nl].data.type === 'minion');
          if (adjOpp.length > 0) {
            const pickL = adjOpp[Math.floor(Math.random() * adjOpp.length)];
            const em = battle.board[opp][pickL];
            await playSynergyBeam(getLaneDOM(opp, pickL), getLaneDOM(opp, targetLane), '#38bdf8', 220);
            battle.board[opp][pickL] = null;
            battle.board[opp][targetLane] = em;
            await showTriggeredEffectToast(card.data, `【入场曲】将敌方『${em.data.name}』移动至面前战道！`, 240);
            renderAllBattleUI();
          }
        }
        break;
      }
      case 'cmwhmorgymp4r': {
        const myVal = getCardCostValue(card.data);
        let maxOtherVal = -1;
        const others = [];
        for (const s of [0, 1]) {
          for (let l = 0; l < 5; l++) {
            const bm = battle.board[s][l];
            if (bm && bm !== card && bm.data.type === 'minion') {
              others.push({ side: s, lane: l });
              maxOtherVal = Math.max(maxOtherVal, getCardCostValue(bm.data));
            }
          }
        }
        if (others.length > 0 && myVal >= maxOtherVal) {
          await showTriggeredEffectToast(card.data, '【入场曲】价值全场最高：破坏战场上所有其他随从！', 280);
          await playRowWideVFX(0, 'destroy_wave', 220);
          await playRowWideVFX(1, 'destroy_wave', 220);
          await destroyMultipleMinionsSimultaneously(others);
        }
        break;
      }
      case 'cmwhmw9g21g6n': {
        const beforeLen = st.deck.length;
        st.deck = st.deck.filter(dc => getCardCostValue(dc.data) >= 6);
        const removedCnt = beforeLen - st.deck.length;
        await showTriggeredEffectToast(card.data, `【入场曲】牌库中 ${removedCnt} 张价值低于6的卡牌消失！`, 260);
        renderAllBattleUI();
        break;
      }
      case 'cmwhn1a7tbjha': {
        const adj = [targetLane - 1, targetLane + 1].filter(nl => nl >= 0 && nl < 5 && battle.board[side][nl] && battle.board[side][nl].data.type === 'minion');
        if (adj.length > 0) {
          await showTriggeredEffectToast(card.data, '【入场曲】使相邻友方随从获得 +1/+1 和【守护】！', 240);
          for (const nl of adj) {
            const fm = battle.board[side][nl];
            fm.currentAtk += 1; fm.currentHp += 1; fm.maxHp += 1;
            fm.activeKw['守护'] = 1;
            addGrantedEffect(fm, '来源：【团结的守卫】 → 获得 +1/+1 与【守护】');
            spawnFloatNumber(side, nl, '+1/+1 守护', '#38bdf8');
          }
          renderAllBattleUI();
        }
        break;
      }
      case 'cmwhnbpbm2mgp': {
        const emptyAdj = [targetLane - 1, targetLane + 1].filter(nl => nl >= 0 && nl < 5 && battle.board[side][nl] === null).length;
        if (emptyAdj > 0) {
          card.currentAtk += emptyAdj;
          card.currentHp += emptyAdj * 2;
          card.maxHp += emptyAdj * 2;
          addGrantedEffect(card, `来源：【孤傲的浪人】 → 相邻 ${emptyAdj} 空位获得 +${emptyAdj}/+${emptyAdj * 2}`);
          spawnFloatNumber(side, targetLane, `+${emptyAdj}/+${emptyAdj * 2}`, '#fbbf24');
          await showTriggeredEffectToast(card.data, `【入场曲】相邻有 ${emptyAdj} 个空位，获得 +${emptyAdj}/+${emptyAdj * 2}！`, 240);
          renderAllBattleUI();
        }
        break;
      }
      case 'cmwhngje1igj1': {
        const adj = [targetLane - 1, targetLane + 1].filter(nl => nl >= 0 && nl < 5 && battle.board[side][nl] && battle.board[side][nl].data.type === 'minion');
        let totalDmg = 0;
        if (adj.length > 0) {
          await showTriggeredEffectToast(card.data, '【入场曲】破坏相邻随从，对敌方全场分配等额于其价值的伤害！', 260);
          for (const nl of adj) {
            const fm = battle.board[side][nl];
            if (fm) {
              totalDmg += Math.round(getCardCostValue(fm.data));
              await destroyMinionAnimated(side, nl);
            }
          }
          if (totalDmg > 0 && !battle.gameOver) {
            await distributeDamageAnimated(opp, totalDmg, true, card, side, targetLane);
          }
        }
        break;
      }
      case 'cmwho2om9pm9p':
        await showTriggeredEffectToast(card.data, '【入场曲】获得【纹章：宁静的治愈师】(倒计时4)！', 260);
        await grantLeaderCrest(side, {
          id: 'crest_tranquil_healer',
          name: '纹章：宁静的治愈师',
          countdown: 4,
          desc: '回合结束时，若剩余至少1点能量，消耗1能量回复己方主战者3点生命值。',
          cardData: card.data
        });
        break;
      case 'cmwho72hssbxy':
        await showTriggeredEffectToast(card.data, '【入场曲】获得【纹章：慷慨的天使】(倒计时4)！', 260);
        await grantLeaderCrest(side, {
          id: 'crest_generous_angel',
          name: '纹章：慷慨的天使',
          countdown: 4,
          desc: '回合结束时，若剩余至少1点能量，消耗1能量抽取1张卡牌。',
          cardData: card.data
        });
        break;
      case 'cmwhoaa82dm9r':
        await showTriggeredEffectToast(card.data, '【入场曲】获得【纹章：守护祷告者】(倒计时4)！', 260);
        await grantLeaderCrest(side, {
          id: 'crest_guardian_prayer',
          name: '纹章：守护祷告者',
          countdown: 4,
          desc: '回合结束时，使随机1个未获得【守护】的己方随从获得【守护】。',
          cardData: card.data
        });
        break;
      case 'cmwhodkla27ju':
        await showTriggeredEffectToast(card.data, '【入场曲】召唤1个『圣甲猛虎』，并获得【纹章：猛虎训练师】(倒计时4)！', 260);
        await summonByNameAnimated(side, 'cmwhoi7m64375', 1, targetLane, false, card.data.name);
        await grantLeaderCrest(side, {
          id: 'crest_tiger_trainer',
          name: '纹章：猛虎训练师',
          countdown: 4,
          desc: '回合结束时，若剩余至少3点能量，消耗3能量召唤1个『圣甲猛虎』。',
          cardData: card.data
        });
        break;
      case 'cmwhom0t7kh3l':
        await showTriggeredEffectToast(card.data, '【入场曲】获得【纹章：开辟的传教士】(永久)！', 260);
        await grantLeaderCrest(side, {
          id: 'crest_pioneer_preacher',
          name: '纹章：开辟的传教士',
          countdown: 4,
          desc: '回合结束时，对敌方随从和敌方主战者分配等同于己方纹章数量的伤害。',
          cardData: card.data
        });
        break;
      case 'cmwhosp359tmt': {
        const gCnt = battle.board[side].filter(bm => bm && bm.data.type === 'minion' && bm.activeKw['守护']).length;
        await showTriggeredEffectToast(card.data, `【入场曲】己方战场共有 ${gCnt} 个守护随从，抽取 ${gCnt} 张卡牌！`, 260);
        for (let di = 0; di < gCnt && !battle.gameOver; di++) await drawCardAnimated(side);
        break;
      }
      case 'cmwhov3uiapqd':
        await showTriggeredEffectToast(card.data, '【入场曲】获得【纹章：圣骑士士官长】(永久)！', 260);
        await grantLeaderCrest(side, {
          id: 'crest_paladin_sergeant',
          name: '纹章：圣骑士士官长',
          countdown: null,
          desc: '若本次对战中被破坏的具有守护的随从大于10，则守护随从进入自己战场时，使其获得 +1/+2。',
          cardData: card.data,
          sourceUid: card.uid
        });
        break;
      case 'cmwhp8oncpwrz':
        await showTriggeredEffectToast(card.data, '【入场曲】召唤 1 个『圣骑兵』！', 240);
        await summonByNameAnimated(side, 'cmwhoxkqvs8bv', 1, targetLane, false, card.data.name);
        break;
      case 'cmwhpkzxube6f': {
        const fullCount = battle.board[side].filter(bm => bm !== null).length;
        if (fullCount >= 5) {
          card.currentAtk += 2; card.currentHp += 2; card.maxHp += 2;
          card.activeKw['毁灭'] = 1;
          addGrantedEffect(card, '来源：【阴险的猎手】 → 满场获得 +2/+2 与【毁灭】');
          spawnFloatNumber(side, targetLane, '+2/+2 毁灭', '#a855f7');
          await showTriggeredEffectToast(card.data, '【入场曲】己方战场有5张卡牌，获得 +2/+2 和【毁灭】！', 260);
          renderAllBattleUI();
        }
        break;
      }
      case 'cmwhpp5k2fltf':
        await showTriggeredEffectToast(card.data, '【入场曲】获得【纹章：神圣宫廷祷告师】(倒计时4)！', 260);
        await grantLeaderCrest(side, {
          id: 'crest_court_prayer',
          name: '纹章：神圣宫廷祷告师',
          countdown: 4,
          desc: '回合结束时，若剩余至少2点能量，消耗2点能量使自己战场上所有守护随从获得 +1/+1。',
          cardData: card.data
        });
        break;
      case 'cmwhq2imeai8a': {
        const cCnt = (st.crests || []).length;
        await showTriggeredEffectToast(card.data, `【入场曲】己方共有 ${cCnt} 个纹章：对敌方全场造成 ${cCnt} 点伤害！`, 260);
        if (cCnt > 0) {
          await playRowWideVFX(opp, 'damage_wave', 240);
          await applyAoeDamageSimultaneousAnimated([0,1,2,3,4].map(el => ({ side: opp, lane: el })), cCnt, card);
          if (!battle.gameOver) await dealDamageToLeaderAnimated(opp, cCnt, card);
        }
        break;
      }
      case 'cmwhq3vyptao6':
        await showTriggeredEffectToast(card.data, '【入场曲】召唤 2 个『圣骑兵』！', 240);
        await summonByNameAnimated(side, 'cmwhoxkqvs8bv', 2, targetLane, false, card.data.name);
        break;
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
      case 'cmwlnaq43tdtd': { // 刺枪白骑
        const gCnt = st.destroyedGuardCount || 0;
        if (gCnt >= 5) {
          await showTriggeredEffectToast(card.data, `【入场曲】已破坏守护随从 ${gCnt} 个（≥5）：召唤1个『圣骑兵』！`, 240);
          await summonByNameAnimated(side, 'cmwhoxkqvs8bv', 1, targetLane, false, card.data.name);
        }
        if (gCnt >= 10 && effectTargetLane >= 0 && battle.board[opp][effectTargetLane]) {
          await playSynergyBeam(getLaneDOM(side, targetLane), getLaneDOM(opp, effectTargetLane), '#f43f5e', 240);
          await showTriggeredEffectToast(card.data, `【入场曲】已破坏守护随从 ${gCnt} 个（≥10）：破坏『${battle.board[opp][effectTargetLane].data.name}』！`, 260);
          await destroyMinionAnimated(opp, effectTargetLane);
        }
        break;
      }
      case 'cmwllves0lgmy': { // 派对天使
        const boardCards = battle.board[side].filter(Boolean).length;
        if (boardCards >= 3) {
          await showTriggeredEffectToast(card.data, `【入场曲】己方场上卡牌 ${boardCards} 个（≥3）：抽取1张卡牌！`, 220);
          await drawCardAnimated(side);
        }
        if (boardCards >= 5) {
          card.currentAtk += 2; card.currentHp += 2; card.maxHp += 2;
          addGrantedEffect(card, '来源：【派对天使】 → 满场获得 +2/+2');
          spawnFloatNumber(side, targetLane, '+2/+2', '#4ade80');
          await showTriggeredEffectToast(card.data, '【入场曲】己方场上卡牌5个以上：获得 +2/+2！', 220);
          renderAllBattleUI();
        }
        break;
      }
      case 'cmwlnnxokbgmu': { // 战车：爆能强化_能量7 变身为 战车：觉醒
        if (playEval.mode === 'enhance') {
          await showTriggeredEffectToast(card.data, '【爆能强化_能量7】变身为『战车：觉醒』！', 280);
          await transformBoardCardAnimated(side, targetLane, 'cmwlnwai0lb1h', card.data.name, 0);
        }
        break;
      }
      case 'cmwlo5i3bcgg1': // 圣枪重凯
        await showTriggeredEffectToast(card.data, '【入场曲】获得【纹章：圣枪重凯】(永久)！', 260);
        await grantLeaderCrest(side, {
          id: 'crest_holy_spear_armor',
          name: '纹章：圣枪重凯',
          countdown: null,
          desc: '你的回合结束时，对敌方主战者造成（当前回合数-5）点伤害。',
          cardData: card.data
        });
        break;
      case 'cmwlomedyjchl': { // 杂耍戏命师
        if (effectTargetLane >= 0 && battle.board[opp][effectTargetLane]) {
          await playSynergyBeam(getLaneDOM(side, targetLane), getLaneDOM(opp, effectTargetLane), '#f43f5e', 240);
          await showTriggeredEffectToast(card.data, `【入场曲】对『${battle.board[opp][effectTargetLane].data.name}』造成3点伤害，召唤1个『骷髅』！`, 240);
          await dealDamageToMinionAnimated(opp, effectTargetLane, 3, card);
        } else {
          await showTriggeredEffectToast(card.data, '【入场曲】召唤1个『骷髅』！', 220);
        }
        await summonByNameAnimated(side, '骷髅', 1, targetLane, false, card.data.name);
        break;
      }
      case 'cmwlouqy7xrnl': { // 律法具现者
        const oppCnt = battle.board[opp].filter(Boolean).length;
        const myCnt = battle.board[side].filter(Boolean).length;
        const diff = oppCnt - myCnt;
        if (diff > 0) {
          await showTriggeredEffectToast(card.data, `【入场曲】敌方场上卡牌多出 ${diff} 张，随机破坏敌方 ${diff} 个随从！`, 260);
          for (let di = 0; di < diff; di++) {
            const oppM = [0,1,2,3,4].filter(el => battle.board[opp][el] && battle.board[opp][el].data.type === 'minion');
            if (oppM.length === 0) break;
            const pickEl = oppM[Math.floor(Math.random() * oppM.length)];
            await destroyMinionAnimated(opp, pickEl);
          }
        }
        break;
      }
      case 'cmwlp6mctrvla': { // 机械降神 【抉择】
        if (choiceIdx === 0) {
          await showTriggeredEffectToast(card.data, '【入场曲·抉择(1)】获得【纹章：机械降神】(永久)：能量不足时可用2骨头抵1能量！', 280);
          await grantLeaderCrest(side, {
            id: 'crest_deus_ex_machina',
            name: '纹章：机械降神',
            countdown: null,
            desc: '本次对战中，你可以在能量不足时消耗骨头代替，2点骨头换算为1能量。',
            cardData: card.data
          });
        } else {
          const seenNames = new Set();
          const distinctDead = [];
          for (const cd of (st.graveyard || [])) {
            if (cd && cd.type === 'minion' && !seenNames.has(cd.name)) {
              seenNames.add(cd.name);
              distinctDead.push(cd);
              if (distinctDead.length >= 4) break;
            }
          }
          await showTriggeredEffectToast(card.data, `【入场曲·抉择(2)】召唤本次对战中被破坏的 ${distinctDead.length} 个不同名随从！`, 280);
          for (const cd of distinctDead) {
            await summonByNameAnimated(side, cd.id, 1, targetLane, false, card.data.name);
          }
        }
        break;
      }
      case 'cmwgftipxm3ux': {
        const tSide = (effectTargetSide === 0 || effectTargetSide === 1) ? effectTargetSide : (battle.board[opp][effectTargetLane] ? opp : side);
        const refM = effectTargetLane >= 0 ? battle.board[tSide][effectTargetLane] : null;
        if (refM) {
          const refVal = getCardCostValue(refM.data);
          await showTriggeredEffectToast(card.data, `破坏所有价值小于『${refM.data.name}』(${formatCardValueText(refVal)})的随从！`, 280);
          for (const s of [0, 1]) {
            for (let l = 0; l < 5; l++) {
              const bm = battle.board[s][l];
              if (bm && bm.data.type === 'minion' && getCardCostValue(bm.data) <= refVal) {
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
    if (!battle.gameOver && battle.board[side][targetLane] === card) {
      await runBoardContinuousEnterPassives(side, card, targetLane);
    }
  } else if (card.data.type === 'spell') {
    if (card.data.id === 'token_lucky_coin') {
      st.energy = (st.energy || 0) + 1;
      spawnFloatNumber(side, -1, '+1⚡能量', '#34d399');
      await showTriggeredEffectToast(card.data, '【幸运币】使自己本回合的能量+1！', 240, side, -1);
      renderAllBattleUI();
    } else if (card.data.id === 'cmwcaqbzuvvcx') {
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
      const hasOtherDragon = battle.board[side].some(m => m && hasRace(m.data, '龙族'));
      await showTriggeredEffectToast(card.data, hasOtherDragon ? '召唤2个『雏龙的蛋』，回复2点生命并抽1张牌！' : '召唤2个『雏龙的蛋』到己方战场上。', 280);
      await summonByNameAnimated(side, '雏龙的蛋', 2, -1, false, card.data.name);
      if (hasOtherDragon && !battle.gameOver) {
        await healLeaderAnimated(side, 2, card.data.name);
        await drawCardAnimated(side);
      }
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
    } else if (card.data.id === 'cmwgy8xtye8o7') { // 扭曲虚空
      await showTriggeredEffectToast(card.data, '【扭曲虚空】使战场上所有随从【消失】！', 300);
      const toBanish = [];
      for (let l = 0; l < 5; l++) {
        if (battle.board[opp][l] && battle.board[opp][l].data.type === 'minion') toBanish.push({ side: opp, lane: l });
        if (battle.board[side][l] && battle.board[side][l].data.type === 'minion') toBanish.push({ side: side, lane: l });
      }
      for (const t of toBanish) {
        if (battle.board[t.side][t.lane]) await banishMinionAnimated(t.side, t.lane);
      }
    } else if (card.data.id === 'cmwgyks2fu1p5') { // 撕裂
      await showTriggeredEffectToast(card.data, '【撕裂】对全场随从和双方主战者造成 1 点伤害 2 次！', 280);
      for (let round = 0; round < 2; round++) {
        if (battle.gameOver) break;
        await playRowWideVFX(opp, 'damage_wave', 150);
        await playRowWideVFX(side, 'damage_wave', 150);
        for (let l = 0; l < 5; l++) {
          if (battle.board[opp][l] && battle.board[opp][l].data.type === 'minion') await dealDamageToMinionAnimated(opp, l, 1, card);
          if (battle.board[side][l] && battle.board[side][l].data.type === 'minion') await dealDamageToMinionAnimated(side, l, 1, card);
        }
        if (!battle.gameOver) await dealDamageToLeaderAnimated(opp, 1, card);
        if (!battle.gameOver) await dealDamageToLeaderAnimated(side, 1, card);
      }
    } else if (card.data.id === 'cmwgyx2fz9jks') { // 刺骨
      await showTriggeredEffectToast(card.data, '【刺骨】对目标敌方随从和敌方主战者造成 3 点伤害！', 240);
      if (effectTargetLane >= 0 && battle.board[opp][effectTargetLane]) {
        await dealDamageToMinionAnimated(opp, effectTargetLane, 3, card);
      }
      if (!battle.gameOver) await dealDamageToLeaderAnimated(opp, 3, card);
    } else if (card.data.id === 'cmwgyxdbows5c') { // 鲜血爆发
      await showTriggeredEffectToast(card.data, '【鲜血爆发】对己方主战者造成 3 点伤害，对敌方全场分配 5 点伤害！', 260);
      await dealDamageToLeaderAnimated(side, 3, card);
      if (!battle.gameOver) await distributeDamageAnimated(opp, 5, true, card, side, -1);
    } else if (card.data.id === 'cmwgyxlefz8yz') { // 血玫瑰
      await showTriggeredEffectToast(card.data, '【血玫瑰】获得【纹章：血玫瑰】（倒计时3）！', 260);
      await grantLeaderCrest(side, {
        id: 'crest_blood_rose',
        name: '纹章：血玫瑰',
        countdown: 3,
        desc: '回合结束时对己方主战者造成1点伤害；己方主战者每次在自己回合受伤时回复1点生命值。',
        cardData: card.data
      });
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
      const effVal = undeadCnt + 1;
      if (effectTargetLane >= 0 && battle.board[opp][effectTargetLane]) {
        await showTriggeredEffectToast(card.data, `手牌共有 ${undeadCnt} 张亡灵卡（X+1=${effVal}）：对目标造成 ${effVal} 点伤害并召唤 ${effVal} 个『骷髅』！`, 280);
        await dealDamageToMinionAnimated(opp, effectTargetLane, effVal, card);
      }
      await summonByNameAnimated(side, '骷髅', effVal, -1, false, card.data.name);
    } else if (card.data.id === 'cmwgh9izhopu9') {
      await showTriggeredEffectToast(card.data, '召唤1个『怨灵』、1个『骷髅』、1个『尸兵』！', 280);
      await summonByNameAnimated(side, '怨灵', 1, -1, false, card.data.name);
      await summonByNameAnimated(side, '骷髅', 1, -1, false, card.data.name);
      await summonByNameAnimated(side, '尸兵', 1, -1, false, card.data.name);
    } else if (card.data.id === 'cmwhmdc2wy39w') {
      await showTriggeredEffectToast(card.data, '【圣光照耀】对敌方全体随从造成5点伤害（亡灵改为消失），回复己方主战者5点生命！', 280);
      await playRowWideVFX(opp, 'fire_aoe', 260);
      await applyAoeDamageSimultaneousAnimated([0,1,2,3,4].map(el => ({ side: opp, lane: el })), 5, card, true);
      if (!battle.gameOver) await healLeaderAnimated(side, 5, card.data.name);
    } else if (card.data.id === 'cmwhmgdfsy8y7') {
      if (findFirstEmptyLane(side) !== -1) {
        await showTriggeredEffectToast(card.data, '【碎骨火种】召唤 1 个『骷髅』！', 240);
        await summonByNameAnimated(side, '骷髅', 1, -1, false, card.data.name);
      } else {
        await showTriggeredEffectToast(card.data, '【碎骨火种】战场已满：使己方全体随从获得 +1/+1！', 240);
        await playRowWideVFX(side, 'buff_wave', 240);
        for (let fl = 0; fl < 5; fl++) {
          const fm = battle.board[side][fl];
          if (fm && fm.data.type === 'minion') {
            fm.currentAtk += 1; fm.currentHp += 1; fm.maxHp += 1;
            addGrantedEffect(fm, '来源：【碎骨火种】 → 满场全体 +1/+1');
            spawnFloatNumber(side, fl, '+1/+1', '#4ade80');
          }
        }
        renderAllBattleUI();
      }
    } else if (card.data.id === 'cmwhmtkk4cjaq') {
      const drawn = await drawCardAnimated(side);
      const xDmg = drawn ? Math.round(getCardCostValue(drawn.data)) : 0;
      await showTriggeredEffectToast(card.data, `【元气弹】抽到了『${drawn ? drawn.data.name : '无'}』(价值 ${xDmg})，造成 ${xDmg} 点伤害！`, 260);
      if (xDmg > 0 && !battle.gameOver) {
        if (effectTargetLane === -2) {
          await playSynergyBeam(getLaneDOM(side, -1), getLaneDOM(opp, -1), '#38bdf8', 240);
          await dealDamageToLeaderAnimated(opp, xDmg, card);
        } else if (effectTargetLane >= 0 && battle.board[opp][effectTargetLane]) {
          await playSynergyBeam(getLaneDOM(side, -1), getLaneDOM(opp, effectTargetLane), '#38bdf8', 240);
          await dealDamageToMinionAnimated(opp, effectTargetLane, xDmg, card);
        } else {
          await playSynergyBeam(getLaneDOM(side, -1), getLaneDOM(opp, -1), '#38bdf8', 240);
          await dealDamageToLeaderAnimated(opp, xDmg, card);
        }
      }
    } else if (card.data.id === 'cmwhn3zw7yggm') {
      const m1 = effectTargetLane >= 0 ? battle.board[side][effectTargetLane] : null;
      const m2 = effectTargetLane2 >= 0 ? battle.board[side][effectTargetLane2] : null;
      if (m1 && m2 && m1 !== m2) {
        await playSynergyBeam(getLaneDOM(side, effectTargetLane), getLaneDOM(side, effectTargetLane2), '#c084fc', 240);
        const a1 = m1.currentAtk, h1 = m1.currentHp, mh1 = m1.maxHp;
        m1.currentAtk = m2.currentAtk; m1.currentHp = m2.currentHp; m1.maxHp = m2.maxHp;
        m2.currentAtk = a1; m2.currentHp = h1; m2.maxHp = mh1;
        addGrantedEffect(m1, `来源：【换帅】 → 与『${m2.data.name}』交换攻血`);
        addGrantedEffect(m2, `来源：【换帅】 → 与『${m1.data.name}』交换攻血`);
        spawnFloatNumber(side, effectTargetLane, `${m1.currentAtk}/${m1.currentHp}`, '#c084fc');
        spawnFloatNumber(side, effectTargetLane2, `${m2.currentAtk}/${m2.currentHp}`, '#c084fc');
        await showTriggeredEffectToast(card.data, `【换帅】交换了『${m1.data.name}』与『${m2.data.name}』的攻击力和生命值！`, 260);
        renderAllBattleUI();
      }
    } else if (card.data.id === 'cmwhn69mc1bcc') {
      const srcM = effectTargetLane >= 0 ? battle.board[side][effectTargetLane] : null;
      if (srcM) {
        const giveAtk = Math.max(0, srcM.currentAtk);
        const giveHp = Math.max(0, srcM.currentHp);
        const others = [0,1,2,3,4]
          .filter(fl => fl !== effectTargetLane && battle.board[side][fl] && battle.board[side][fl].data.type === 'minion')
          .map(fl => ({ lane: fl, inst: battle.board[side][fl] }))
          .sort((a, b) => (a.inst.currentAtk + a.inst.currentHp) - (b.inst.currentAtk + b.inst.currentHp))
          .slice(0, 3);
        if (others.length > 0) {
          for (let a = 0; a < giveAtk; a++) {
            const pick = others[Math.floor(Math.random() * others.length)];
            pick.inst.currentAtk += 1;
          }
          for (let h = 0; h < giveHp; h++) {
            const pick = others[Math.floor(Math.random() * others.length)];
            pick.inst.currentHp += 1;
            pick.inst.maxHp += 1;
          }
          srcM.currentAtk = Math.max(1, 1);
          srcM.currentHp = Math.max(1, 1);
          srcM.maxHp = Math.max(1, srcM.maxHp);
          others.forEach(o => {
            addGrantedEffect(o.inst, `来源：【传承】 → 继承『${srcM.data.name}』之力`);
            spawnFloatNumber(side, o.lane, '+传承!', '#34d399');
          });
          addGrantedEffect(srcM, '来源：【传承】 → 传承后变为 1/1');
          await showTriggeredEffectToast(card.data, `【传承】将『${srcM.data.name}』的 ${giveAtk}/${giveHp} 随机分配给了己方最低攻血的随从！`, 260);
          renderAllBattleUI();
        }
      }
    } else if (card.data.id === 'cmwke2qdplbkf') {
      await showTriggeredEffectToast(card.data, '【腐烂雾气】对所有非亡灵随从造成 2 点伤害！', 280);
      await playRowWideVFX(0, 'damage_wave', 180);
      await playRowWideVFX(1, 'damage_wave', 180);
      const targets = [];
      const myNonUndeadBefore = [];
      for (const s of [0, 1]) {
        for (let l = 0; l < 5; l++) {
          const bm = battle.board[s][l];
          if (bm && bm.data.type === 'minion' && !hasRace(bm.data, '亡灵')) {
            targets.push({ side: s, lane: l });
            if (s === side) myNonUndeadBefore.push({ inst: bm, lane: l });
          }
        }
      }
      if (targets.length > 0) {
        await applyAoeDamageSimultaneousAnimated(targets, 2, card);
      }
      const destroyedMyCnt = myNonUndeadBefore.filter(item => battle.board[side][item.lane] !== item.inst).length;
      if (destroyedMyCnt > 0 && !battle.gameOver) {
        await showTriggeredEffectToast(card.data, `己方有 ${destroyedMyCnt} 个随从因腐烂雾气被破坏，召唤 ${destroyedMyCnt} 个『骷髅』！`, 260);
        await summonByNameAnimated(side, '骷髅', destroyedMyCnt, -1, false, card.data.name);
      }
    } else if (card.data.id === 'cmwhphf6y7cew') {
      const xCnt = battle.board[side].filter(bm => bm && bm.data.type === 'minion' && bm.activeKw['守护']).length;
      await showTriggeredEffectToast(card.data, `【守护之光芒】己方有 ${xCnt} 个守护随从：对敌方造成 ${xCnt} 点伤害并回复己方全体 ${xCnt} 点生命！`, 260);
      if (xCnt > 0) {
        await playRowWideVFX(opp, 'damage_wave', 220);
        await applyAoeDamageSimultaneousAnimated([0,1,2,3,4].map(el => ({ side: opp, lane: el })), xCnt, card);
        for (let fl = 0; fl < 5; fl++) {
          const fm = battle.board[side][fl];
          if (fm && fm.data.type === 'minion' && fm.currentHp < fm.maxHp) {
            const healAmt = Math.min(xCnt, fm.maxHp - fm.currentHp);
            fm.currentHp += healAmt;
            spawnFloatNumber(side, fl, `+${healAmt}`, '#4ade80');
          }
        }
        if (!battle.gameOver) await healLeaderAnimated(side, xCnt, card.data.name);
      }
    } else if (card.data.id === 'cmwllvy75f6bz') { // 圣骑兵招募
      const gCnt = st.destroyedGuardCount || 0;
      await showTriggeredEffectToast(card.data, `召唤2个『圣骑兵』并使其获得+0/1${gCnt >= 10 ? `（已破坏守护 ${gCnt}≥10，额外抽2张牌！）` : ''}`, 260);
      const beforeLanes = new Set(battle.board[side].map((m, idx) => m ? m.uid : null).filter(Boolean));
      await summonByNameAnimated(side, 'cmwhoxkqvs8bv', 2, -1, false, card.data.name);
      for (let sl = 0; sl < 5; sl++) {
        const sm = battle.board[side][sl];
        if (sm && sm.data.id === 'cmwhoxkqvs8bv' && !beforeLanes.has(sm.uid)) {
          sm.maxHp += 1; sm.currentHp += 1;
          addGrantedEffect(sm, '来源：【圣骑兵招募】 → 获得 +0/+1');
          spawnFloatNumber(side, sl, '+0/+1', '#34d399');
        }
      }
      renderAllBattleUI();
      if (gCnt >= 10) {
        await drawCardAnimated(side);
        if (!battle.gameOver) await drawCardAnimated(side);
      }
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
  } catch (err) {
    console.error('出牌结算异常:', err);
    if (!battle.gameOver && typeof checkAndTriggerDeusExMachinaInvocation === 'function') {
      await checkAndTriggerDeusExMachinaInvocation(side);
    }
  } finally {
    battle.animating = false;
  }
}

