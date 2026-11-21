// ============================================================================
// v1.88 玩家动作层：把原先散落在 UI 点击回调里的结算逻辑抽成「传参即可调用」的纯动作函数。
//   - 单机 / 热座：UI 收集完玩家选择后直接调用 cfPerform*。
//   - 联机：UI 把同样的参数发给服务器，由服务器在无头引擎里调用 cfPerform*（见 server/src/engine）。
//   - 所有 cfValidate* / cfGet*Info 只读状态、不产生副作用，服务器用它们校验客户端请求。
// ============================================================================

function cfIsOnlineClient() {
  return battleMode === 'pvp_online' && !(typeof window !== 'undefined' && window.CF_SERVER_MODE);
}

function cfIsBoardPlacement(card, playEval) {
  return ((card.data.type === 'minion' || card.data.type === 'amulet') && playEval.mode !== 'accelerate') || playEval.mode === 'crystallize';
}

function cfIntArg(v, def = -1) {
  const n = Number(v);
  return Number.isInteger(n) ? n : def;
}

/**
 * 校验一次出牌请求。params：
 *   uid, lane, sacLanes[], effectTargetLane, effectTargetSide, effectTargetLane2, choiceIdx, handTargetUid
 * 返回 { ok, reason, card, playEval, args }，args 为 commitCardPlayWithAnimations 的完整实参。
 */
function cfValidatePlay(side, params) {
  const p = params || {};
  const st = battle.leaders[side];
  if (!st) return { ok: false, reason: '对局未开始' };
  const card = st.hand.find(h => h && String(h.uid) === String(p.uid));
  if (!card) return { ok: false, reason: '手牌中没有这张卡' };
  const playEval = evaluateCardPlayState(side, card);
  if (!playEval || !playEval.ok) return { ok: false, reason: (playEval && playEval.reason) || '当前无法打出' };

  // 1) 祭品
  const needSac = (card.data.sacrifice || 0) > 0 && playEval.mode !== 'accelerate' ? card.data.sacrifice : 0;
  const sacLanes = Array.isArray(p.sacLanes) ? [...new Set(p.sacLanes.map(x => cfIntArg(x)))] : [];
  if (needSac > 0) {
    const validSac = getValidSacrificeLanes(side, card.data.sacrificeCond || '');
    if (sacLanes.length !== needSac || !sacLanes.every(l => validSac.includes(l))) return { ok: false, reason: '祭品选择无效' };
  } else if (sacLanes.length > 0) {
    return { ok: false, reason: '该卡牌不需要祭品' };
  }

  // 2) 抉择
  const choices = getCardChoices(card);
  const needChoice = choices.length > 0 && playEval.mode !== 'accelerate' && playEval.mode !== 'crystallize';
  let choiceIdx = cfIntArg(p.choiceIdx, 0);
  if (needChoice) {
    if (choiceIdx < 0 || choiceIdx >= choices.length) return { ok: false, reason: '抉择选项无效' };
    const lock = isChoiceOptionLocked(card, choices[choiceIdx], choiceIdx, side);
    if (lock && lock.locked) return { ok: false, reason: lock.reason || '该抉择选项尚未解锁' };
  } else {
    choiceIdx = 0;
  }

  // 3) 目标
  const isEnh = playEval.mode === 'enhance';
  const isSpell = card.data.type === 'spell';
  const req = getCardTargetRequirement(card, isEnh, needChoice ? choiceIdx : -1, playEval.mode);
  let effectTargetLane = -1, effectTargetSide = -1, effectTargetLane2 = -1, handTargetUid = -1;
  if (req === 'hand_card') {
    const otherHand = st.hand.filter(h => h !== card);
    if (otherHand.length > 0) {
      const t = otherHand.find(h => String(h.uid) === String(p.handTargetUid));
      if (!t) return { ok: false, reason: '请选择 1 张手牌作为目标' };
      handTargetUid = t.uid;
    }
  } else if (req === 'friendly_minion_pair') {
    const locs = getValidTargetLocations(side, 'friendly_minion', isSpell, sacLanes).map(x => x.lane);
    if (locs.length >= 2) {
      const a = cfIntArg(p.effectTargetLane), b = cfIntArg(p.effectTargetLane2);
      if (a === b || !locs.includes(a) || !locs.includes(b)) return { ok: false, reason: '请选择 2 个不同的友方随从' };
      effectTargetLane = a; effectTargetLane2 = b; effectTargetSide = side;
    } else if (isSpell) {
      return { ok: false, reason: '需至少2个友方随从' };
    }
  } else if (req) {
    const locs = getValidTargetLocations(side, req, isSpell, sacLanes);
    if (locs.length > 0) {
      const tl = cfIntArg(p.effectTargetLane);
      const ts = cfIntArg(p.effectTargetSide, locs.length && locs.every(x => x.side === locs[0].side) ? locs[0].side : -1);
      const hit = locs.find(x => x.lane === tl && x.side === ts);
      if (!hit) return { ok: false, reason: '目标无效' };
      effectTargetLane = hit.lane; effectTargetSide = hit.side;
    } else if (isSpell) {
      return { ok: false, reason: '场上无合法目标' };
    }
  }

  // 4) 落位
  let lane = 0;
  if (cfIsBoardPlacement(card, playEval)) {
    lane = cfIntArg(p.lane);
    if (lane < 0 || lane > 4) return { ok: false, reason: '请选择放置的战道' };
    if (battle.board[side][lane] !== null && !sacLanes.includes(lane)) return { ok: false, reason: '该战道已被占用' };
  }

  return {
    ok: true, card, playEval,
    args: [side, card, playEval, lane, sacLanes, effectTargetLane, choiceIdx, handTargetUid, effectTargetSide, effectTargetLane2],
  };
}

async function cfPerformPlay(side, params) {
  const v = cfValidatePlay(side, params);
  if (!v.ok) return v;
  await _innerCommitCardPlayWithAnimations(...v.args);
  return { ok: true, cid: v.card.data.id, cardType: v.card.data.type, lane: v.args[3], sacCount: v.args[4].length };
}

// ---------------------------------------------------------------- 【启动】能力
const CF_ACTIVATE_SPECIAL_IDS = ['cmwdw5qt6cbqb', 'cmwdzvs1woa53', 'cmwfdhecfc856'];
const CF_ACTIVATE_TARGET_ENEMY_IDS = ['cmwget8v364ar', 'cmwlomedyjchl'];

function cfGetActivateInfo(side, lane) {
  const inst = battle.board[side] && battle.board[side][lane];
  if (!inst || !inst.data) return { ok: false, available: false, reason: '该位置没有卡牌' };
  const c = inst.data;
  const pst = battle.leaders[side];
  const ast = c.ast || parseCardEffectAST(c);
  if (!(ast.activate || CF_ACTIVATE_SPECIAL_IDS.includes(c.id))) return { ok: false, available: false, reason: '该卡牌没有【启动】能力' };
  const eCost = c.id === 'cmwdzvs1woa53' ? 0 : (ast.activate ? (ast.activate.energy || 0) : 1);
  const actKwObj = (c.keywords || []).find(k => k.k === '启动');
  const bCost = Number((actKwObj && actKwObj.cost && actKwObj.cost.bones) || 0);
  const sCost = Number((actKwObj && actKwObj.cost && actKwObj.cost.sacrifice) || 0);
  let extraCondOk = true;
  let extraCondReason = '';
  if (c.id === 'cmwdw5qt6cbqb') {
    if (!(pst.crests || []).some(cr => cr.id === 'crest_wyvern_rider')) { extraCondOk = false; extraCondReason = ' (无飞龙骑手纹章)'; }
  } else if (c.id === 'cmwgysie8srmh') {
    if (!(pst.crests || []).some(cr => cr.id === 'crest_arrogant_rose')) { extraCondOk = false; extraCondReason = ' (无傲慢的大小姐纹章)'; }
  } else if (c.id === 'cmwdzvs1woa53') {
    if (pst.hand.length === 0) { extraCondOk = false; extraCondReason = ' (无手牌可弃置)'; }
  } else if (CF_ACTIVATE_TARGET_ENEMY_IDS.includes(c.id)) {
    if (cfActivateEnemyTargetLanes(side).length === 0) { extraCondOk = false; extraCondReason = ' (无敌方随从目标)'; }
  } else if (sCost > 0) {
    const sacAvail = [0, 1, 2, 3, 4].filter(sl => battle.board[side][sl] && battle.board[side][sl].data.type === 'minion' && battle.board[side][sl] !== inst).length;
    if (sacAvail < sCost) { extraCondOk = false; extraCondReason = ' (场上祭品不足)'; }
  }
  const need = c.id === 'cmwdzvs1woa53' ? 'hand_card' : (CF_ACTIVATE_TARGET_ENEMY_IDS.includes(c.id) ? 'enemy_minion' : '');
  const ok = !inst.activatedThisTurn && getTotalAvailableEnergy(pst) >= eCost && pst.bones >= bCost && extraCondOk;
  let reason = '';
  if (inst.activatedThisTurn) reason = '本回合已发动【启动】';
  else if (!extraCondOk) reason = extraCondReason.trim().replace(/^\(|\)$/g, '');
  else if (!ok) reason = '能量或骨头不足';
  return { ok, available: true, inst, c, ast, eCost, bCost, sCost, extraCondOk, extraCondReason, need, reason };
}

function cfActivateEnemyTargetLanes(side) {
  const opp = 1 - side;
  return [0, 1, 2, 3, 4].filter(el => battle.board[opp][el] && battle.board[opp][el].data.type === 'minion' && !battle.board[opp][el].activeKw['潜行']);
}

/** opts: { handTargetUid }（龙心秘宝）或 { targetLane }（大剑少女 / 杂耍戏命师） */
async function cfPerformActivate(side, lane, opts = {}) {
  const info = cfGetActivateInfo(side, lane);
  if (!info.ok) return { ok: false, reason: info.reason || '当前无法发动【启动】' };
  const { inst, c, ast, eCost, bCost } = info;
  const pst = battle.leaders[side];

  if (c.id === 'cmwdzvs1woa53') {
    const discardedCard = pst.hand.find(h => String(h.uid) === String(opts.handTargetUid));
    if (!discardedCard) return { ok: false, reason: '请选择 1 张要弃置的手牌' };
    sfx.play('synergy');
    inst.activatedThisTurn = true;
    const dIdx = pst.hand.indexOf(discardedCard);
    if (dIdx !== -1) {
      pst.hand.splice(dIdx, 1);
      addBones(side, 1);
      spawnFloatNumber(side, -1, '🦴弃牌 骨头+1', '#fde047');
    }
    await showTriggeredEffectToast(c, `【启动】弃置『${discardedCard.data.name}』，将1张『雏龙的蛋』加入手牌！`, 260);
    await addCardToHandAnimated(side, '雏龙的蛋', 1, lane, c.name);
    return { ok: true, cid: c.id };
  }

  if (CF_ACTIVATE_TARGET_ENEMY_IDS.includes(c.id)) {
    const opp = 1 - side;
    const tl = cfIntArg(opts.targetLane);
    if (!cfActivateEnemyTargetLanes(side).includes(tl)) return { ok: false, reason: '请选择 1 个敌方随从作为目标' };
    const tm = battle.board[opp][tl];
    spendLeaderEnergy(side, eCost);
    pst.energySpentTotal = (pst.energySpentTotal || 0) + eCost;
    pst.bones = Math.max(0, pst.bones - bCost);
    inst.activatedThisTurn = true;
    sfx.play('synergy');
    await playSynergyBeam(getLaneDOM(side, lane), getLaneDOM(opp, tl), '#f43f5e', 240);
    if (c.id === 'cmwlomedyjchl') {
      await showTriggeredEffectToast(c, `【杂耍戏命师·启动】对『${tm.data.name}』造成 3 点伤害，召唤 1 个『骷髅』！`, 240);
      await dealDamageToMinionAnimated(opp, tl, 3, inst);
      await summonByNameAnimated(side, '骷髅', 1, lane, false, c.name);
    } else {
      await showTriggeredEffectToast(c, `【大剑少女·启动】对『${tm.data.name}』造成 ${inst.currentAtk} 点伤害！`, 240);
      await dealDamageToMinionAnimated(opp, tl, inst.currentAtk, inst);
    }
    if (!battle.gameOver && typeof checkAndTriggerDeusExMachinaInvocation === 'function') {
      await checkAndTriggerDeusExMachinaInvocation(side);
    }
    return { ok: true, cid: c.id };
  }

  sfx.play('synergy');
  spendLeaderEnergy(side, eCost);
  pst.energySpentTotal = (pst.energySpentTotal || 0) + eCost;
  pst.bones -= bCost;
  inst.activatedThisTurn = true;
  if (c.id === 'cmwbxu7u3tpyo') {
    await showTriggeredEffectToast(c, '【启动】将2张『电子羊』加入手牌。', 240);
    await addCardToHandAnimated(side, '电子羊', 2, lane, c.name);
  } else if (c.id === 'cmwfdhecfc856') {
    await showTriggeredEffectToast(c, '【启动】将1张具有屏障的『雏龙的蛋』加入手牌。', 240);
    await addCardToHandAnimated(side, '雏龙的蛋', 1, lane, c.name, '屏障');
  } else if (c.id === 'cmwfdugclc9w9') {
    await showTriggeredEffectToast(c, '【启动】召唤1个『怨灵』到己方战场上！', 240);
    await summonByNameAnimated(side, '怨灵', 1, lane, false, c.name);
  } else if (c.id === 'cmwfg76dbmxry') {
    await showTriggeredEffectToast(c, '【启动】消耗2骨头，将2张『咆哮的狼人』洗入牌库！', 240);
    // 修复：原实现引用了未定义的 st（触发即 ReferenceError），应为己方主战者状态
    for (let wi = 0; wi < 2; wi++) pst.deck.push(createCardInstance(c.id, side));
    shuffleArray(pst.deck);
  } else if (c.id === 'cmwfhe6xv5el7') {
    await showTriggeredEffectToast(c, '【启动】【亡者召还_价值2】', 240);
    await reanimateMinionAnimated(side, { value: 2 }, '', lane, false, c.name);
  } else if (c.id === 'cmwgrgw6jyd8p') {
    await showTriggeredEffectToast(c, '【启动】消耗 6 骨头，发动【亡者召还_价值3】！', 240);
    await reanimateMinionAnimated(side, { value: 3 }, '', lane, false, c.name);
  } else if (c.id === 'cmwgchn8wmoi5') {
    await showTriggeredEffectToast(c, '【启动】消耗1点能量，召唤1个『怨灵』！', 240);
    await summonByNameAnimated(side, '怨灵', 1, lane, false, c.name);
  } else if (c.id === 'cmwgepbm7hzy9') {
    const sacCands = [0, 1, 2, 3, 4].filter(sl => battle.board[side][sl] && battle.board[side][sl].data.type === 'minion' && battle.board[side][sl] !== inst);
    if (sacCands.length > 0) {
      sacCands.sort((a, b) => compareTributeCandidatesForAI(battle.board[side][a], battle.board[side][b]));
      await showTriggeredEffectToast(c, `【启动】献祭『${battle.board[side][sacCands[0]].data.name}』，召唤1个『狼少女』！`, 240);
      await destroyMinionAnimated(side, sacCands[0], true);
      await summonByNameAnimated(side, 'cmwgepbm7hzy9', 1, lane, false, c.name);
    }
  } else if (c.id === 'cmwgysie8srmh') {
    const roseCrest = (pst.crests || []).find(cr => cr.id === 'crest_arrogant_rose');
    if (roseCrest) {
      roseCrest.countdown += 1;
      await playCrestTriggerVFX(side, roseCrest.id);
      await showTriggeredEffectToast(c, `【启动】使【${roseCrest.name}】倒计时+1（当前倒计时 ${roseCrest.countdown}）！`, 260);
    }
  } else if (c.id === 'cmwgyyghnbr4n') {
    await showTriggeredEffectToast(c, '【启动】消耗 6 骨头，将 2 张『鲜血爆发』加入手牌！', 240);
    await addCardToHandAnimated(side, '鲜血爆发', 2, lane, c.name);
  } else if (c.id === 'cmwgz1zd1u6au') {
    inst.countdown = (inst.countdown || 0) + 1;
    spawnFloatNumber(side, lane, '⏳+1', '#38bdf8');
    await showTriggeredEffectToast(c, `【启动】消耗 3 骨头，使『阴深的城堡』倒计时+1（当前 ${inst.countdown}）！`, 240);
  } else if (c.id === 'cmwhnqd6sxcdq') {
    inst.grantedOnAttackThreeSide3 = true;
    addGrantedEffect(inst, '来源：【归来的剑圣·启动】 → 获得【攻击时】对前面和相邻敌方随从造成3点伤害');
    spawnFloatNumber(side, lane, '⚔️三线斩!', '#38bdf8');
    await showTriggeredEffectToast(c, '【启动】『归来的剑圣』获得攻击时三线3点伤害！', 240);
  } else if (c.id === 'cmwhq3vyptao6') {
    await showTriggeredEffectToast(c, '【启动】消耗 6 骨头，召唤 2 个『圣骑兵』！', 240);
    await summonByNameAnimated(side, 'cmwhoxkqvs8bv', 2, lane, false, c.name);
  } else if (c.id === 'cmwdw5qt6cbqb') {
    const wyvCrest = (pst.crests || []).find(cr => cr.id === 'crest_wyvern_rider');
    if (wyvCrest) {
      wyvCrest.countdown += 1;
      await playCrestTriggerVFX(side, wyvCrest.id);
      await showTriggeredEffectToast(c, `【启动】使【${wyvCrest.name}】倒计时+1（当前倒计时 ${wyvCrest.countdown}）！`, 260);
    }
  } else if (ast.activate && ast.activate.actions.length > 0) {
    await executeASTActionList(side, inst, lane, ast.activate.actions, -1, false);
  }
  return { ok: true, cid: c.id };
}

// ---------------------------------------------------------------- 【融合】
function cfGetFusionInfo(side, uid) {
  const pst = battle.leaders[side];
  const inst = pst && pst.hand.find(h => String(h.uid) === String(uid));
  if (!inst) return { ok: false, reason: '手牌中没有这张卡' };
  const c = inst.data;
  const ast = c.ast || parseCardEffectAST(c);
  const hasFuseKw = Boolean(ast.fuse || (c.keywords || []).some(kw => kw.k === '融合') || String(c.fullText || '').includes('【融合】'));
  if (!hasFuseKw) return { ok: false, reason: '该卡牌没有【融合】' };
  const fuseInfo = getFuseRuleInfo(c);
  const validMaterials = pst.hand.filter(h => h !== inst && fuseInfo.matchFn(h));
  if (inst.fusedThisTurn) return { ok: false, reason: '本回合已【融合】', inst, fuseInfo, validMaterials };
  if (validMaterials.length === 0) return { ok: false, reason: `手牌无符合条件的${fuseInfo.label}`, inst, fuseInfo, validMaterials };
  return { ok: true, inst, fuseInfo, validMaterials };
}

async function cfPerformFusion(side, uid, materialUids) {
  const info = cfGetFusionInfo(side, uid);
  if (!info.ok) return info;
  const wanted = new Set((Array.isArray(materialUids) ? materialUids : []).map(String));
  const chosen = info.validMaterials.filter(h => wanted.has(String(h.uid)));
  if (chosen.length === 0 || chosen.length !== wanted.size) return { ok: false, reason: '融合素材无效' };
  const sourceInst = info.inst;
  executeCardFusionLogic(side, sourceInst, chosen);
  sfx.play('synergy');
  const count = chosen.length;
  let toastMsg = `【融合】已融合 ${count} 张卡牌（累计融合 ${sourceInst.fusedCount} 张）！`;
  if (info.fuseInfo.costReducePerCard > 0) {
    toastMsg = `【融合】已融合 ${count} 张卡牌，本卡能量费用 -${info.fuseInfo.costReducePerCard * count}！`;
  }
  await cfPrivateToast(sourceInst.data, toastMsg, 300, `对手发动了【融合】（消耗 ${count} 张手牌素材）`);
  return { ok: true, cid: sourceInst.data.id };
}

// ---------------------------------------------------------------- 开局换牌
/** swapIdx：起手牌中要交换的下标（与 #mulliganSwapSlots 的槽位一致） */
function cfApplyMulligan(side, swapIdx) {
  const st = battle.leaders[side];
  const idxs = [...new Set((Array.isArray(swapIdx) ? swapIdx : []).map(x => cfIntArg(x)))]
    .filter(i => i >= 0 && i < Math.min(st.hand.length, RULES.openingHand || 4))
    .sort((a, b) => a - b);
  if (idxs.length === 0) return { ok: true, swapped: 0 };
  const returned = [];
  idxs.forEach(idx => {
    const replacement = st.deck.shift();
    if (!replacement) return; // 牌库为空：保留原牌，避免同一张牌既在手里又被洗回牌库
    returned.push(st.hand[idx]);
    st.hand[idx] = replacement;
  });
  returned.forEach(c => st.deck.push(c));
  shuffleArray(st.deck);
  return { ok: true, swapped: idxs.length };
}

// ---------------------------------------------------------------- UI 入口：单机直接结算，联机交给服务器
async function cfRequestActivate(side, lane, opts = {}) {
  let r;
  if (cfIsOnlineClient()) {
    r = await cfNetAction('ACTIVATE', Object.assign({ lane }, opts));
  } else {
    r = await cfPerformActivate(side, lane, opts);
    renderAllBattleUI();
  }
  if (!r.ok) {
    if (cfIsOnlineClient()) cfShowRejectToast(r.reason);
    else showSacrificeGuideBanner('⚠️ 无法发动', r.reason || '当前无法发动【启动】');
  }
  return r;
}

async function cfRequestFusion(side, uid, materialUids) {
  let r;
  if (cfIsOnlineClient()) {
    r = await cfNetAction('FUSE', { uid, materialUids });
    if (!r.ok) cfShowRejectToast(r.reason);
  } else {
    r = await cfPerformFusion(side, uid, materialUids);
  }
  return r;
}
