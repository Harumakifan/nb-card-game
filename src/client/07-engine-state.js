let nextUid = 1000;
function createCardInstance(cardIdOrName, owner) {
  const data = cardsById[cardIdOrName] || cardsByName[cardIdOrName];
  if (!data) return null;
  const activeKw = {};
  (data.keywords || []).forEach(kw => {
    const passiveList = ["守护", "飞行", "防空", "毁灭", "荆棘", "屏障", "位移", "灵气", "潜行", "虹吸", "多重攻击", "两侧攻击", "三侧攻击", "全体攻击"];
    if (passiveList.includes(kw.k)) activeKw[kw.k] = Math.max(1, kw.v || 1);
  });
  const initCd = getInitialCountdown(data);
  return {
    uid: ++nextUid,
    data: data,
    owner: owner,
    currentAtk: data.atk || 0,
    maxHp: data.hp || 1,
    currentHp: data.hp || 1,
    countdown: initCd > 0 ? initCd : null,
    activeKw: activeKw,
    fusedCount: 0,
    costReduction: 0,
    grantedEffects: [],
    extraLastWords: [],
    grantedOnAttackAoe4: false,
    shiftDir: 1,
    activatedThisTurn: false,
    attackedThisTurn: false,
    fusedThisTurn: false,
    justEnteredLegendVfx: false,
    enterOrder: 0
  };
}

function hasAnyLastWords(inst) {
  if (!inst) return false;
  if (inst.extraLastWords && inst.extraLastWords.length > 0) return true;
  return (inst.data.keywords || []).some(kw => kw.k === '谢幕曲') || (inst.data.ast && inst.data.ast.lastWords.length > 0);
}

function addGrantedEffect(inst, text) {
  if (!inst || !text) return;
  if (!inst.grantedEffects) inst.grantedEffects = [];
  inst.grantedEffects.push(text);
  if (typeof playHandCardVFX === 'function' && inst.uid) {
    playHandCardVFX(inst.owner, inst.uid, 'modify', '⚡强化');
  }
}

function getEffectiveEnergy(inst, leaderState) {
  let e = (inst.data.energy || 0) - (inst.costReduction || 0);
  if (inst.data.type === 'minion' && isMechCard(inst.data) && leaderState && leaderState.nextMechDiscount > 0) {
    e -= leaderState.nextMechDiscount;
  }
  return Math.max(0, e);
}

function evaluateCardPlayState(side, inst) {
  const st = battle.leaders[side];
  if (inst && inst.data && inst.data.id === 'token_lucky_coin' && st && st.usedLuckyCoinThisTurn) {
    return { ok: false, mode: 'none', glow: '', reason: '每回合最多使用1张幸运币' };
  }
  const baseE = getEffectiveEnergy(inst, st);
  const needB = inst.data.bones || 0;
  const needS = inst.data.sacrifice || 0;
  const ast = inst.data.ast || parseCardEffectAST(inst.data);

  const validSac = getValidSacrificeLanes(side, inst.data.sacrificeCond || '');
  const hasEmptyLane = battle.board[side].some(slot => slot === null) || needS > 0;
  const isBoardCard = inst.data.type === 'minion' || inst.data.type === 'amulet';
  const hasDeusCrest = (st.crests || []).some(cr => cr.id === 'crest_deus_ex_machina');

  const availE = getTotalAvailableEnergy(st);
  if (availE < baseE) {
    if (ast.crystallize && availE >= ast.crystallize.cost && hasEmptyLane) {
      return { ok: true, mode: 'crystallize', costE: ast.crystallize.cost, costB: 0, glow: 'sv-glow-blue', activeSection: 'crystallize' };
    }
    if (ast.accelerate && availE >= ast.accelerate.cost) {
      return { ok: true, mode: 'accelerate', costE: ast.accelerate.cost, costB: 0, glow: 'sv-glow-blue', activeSection: 'accelerate' };
    }
    if (hasDeusCrest) {
      const shortage = baseE - availE;
      const totalBonesNeeded = needB + shortage * 2;
      if (st.bones >= totalBonesNeeded && validSac.length >= needS && (!isBoardCard || hasEmptyLane)) {
        return { ok: true, mode: 'normal', costE: availE, costB: totalBonesNeeded, boneSubE: shortage, glow: 'sv-glow-green', activeSection: 'normal' };
      }
    }
    return { ok: false, mode: 'none', glow: '', reason: `能量不足(需${baseE})` };
  }

  if (st.bones < needB) return { ok: false, mode: 'none', glow: '', reason: `骨头不足(需${needB})` };
  if (validSac.length < needS) return { ok: false, mode: 'none', glow: '', reason: `祭品不足(需${needS}个${inst.data.sacrificeCond || ''}随从，护符不可献祭)` };

  if (isBoardCard && !hasEmptyLane) {
    return { ok: false, mode: 'none', glow: '', reason: '战道已满' };
  }

  let isEnhanced = false;
  let enhCostE = baseE;
  let enhCostB = needB;
  if (ast.enhance) {
    if (ast.enhance.costType === 'bones') {
      if (st.bones >= ast.enhance.cost) {
        isEnhanced = true;
        enhCostB = ast.enhance.cost;
      }
    } else if (availE >= ast.enhance.cost) {
      isEnhanced = true;
      enhCostE = ast.enhance.cost;
    }
  }

  const req = getCardTargetRequirement(inst, isEnhanced, -1);
  if (inst.data.type === 'spell' && req) {
    const validTargets = getValidTargetLanes(side, req, true);
    if (req === 'friendly_minion_pair' ? validTargets.length < 2 : validTargets.length === 0) {
      return { ok: false, mode: 'none', glow: '', reason: req === 'friendly_minion_pair' ? '需至少2个友方随从' : '场上无合法目标' };
    }
  }

  const comboReady = ast.combo && (st.cardsPlayedThisTurn + 1) >= ast.combo.count;
  const mechHandCountAfterPlay = st.hand.filter(h => h !== inst && isMechCard(h.data)).length;
  const mechCondReady = (inst.data.id === 'cmwc2n4p68ewm' || inst.data.id === 'cmwc8tup5d1xt') && mechHandCountAfterPlay >= 6;
  const sheepCondReady = inst.data.id === 'cmwby8v9c918f' && st.hand.some(h => h.data.name === '电子羊');
  const fuseCondReady = (inst.fusedCount || 0) > 0 && (inst.data.id === 'cmwdi4pwz3c0k' || inst.data.id === 'cmwdibvlbqmxv');
  const dragonOnBoardReady = (inst.data.id === 'cmwdvop6hshsy' || inst.data.id === 'cmwdwtfm8xm5c' || inst.data.id === 'cmwdzshgc6r55') &&
    battle.board[side].some(m => m && m.data.type === 'minion' && hasRace(m.data, '龙族'));
  const cost7MinionsReady = inst.data.id === 'cmwdyxl33lchi' &&
    st.hand.filter(h => h !== inst && h.data.type === 'minion' && (h.data.energy || 0) >= 7).length >= 3;

  if (isEnhanced || comboReady || mechCondReady || sheepCondReady || fuseCondReady || dragonOnBoardReady || cost7MinionsReady) {
    return {
      ok: true,
      mode: isEnhanced ? 'enhance' : 'normal_boosted',
      costE: enhCostE,
      costB: enhCostB,
      glow: isEnhanced ? 'sv-glow-enhance' : 'sv-glow-yellow',
      activeSection: isEnhanced ? 'enhance' : (comboReady ? 'combo' : 'fanfare')
    };
  }

  return { ok: true, mode: 'normal', costE: baseE, costB: needB, glow: 'sv-glow-green', activeSection: 'main' };
}

let battleMode = 'pve';
let aiDeckArchetype = 'dragon';
let pvpRoomChannel = null;

const battle = {
  turn: 1, activeSide: 0, firstPlayerSide: 0, gameOver: false, animating: false,
  board: [[null, null, null, null, null], [null, null, null, null, null]],
  leaders: [null, null],
  inspectedCard: null,
  pendingPlay: null,
  pendingActivate: null,
  mulliganSwapped: [false, false, false, false],
  multiFuseUids: new Set()
};

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function expandDeck(deckObj) {
  const ids = [];
  Object.entries(deckObj.cards).forEach(([cid, cnt]) => {
    for (let i = 0; i < cnt; i++) ids.push(cid);
  });
  return ids;
}

function createLeaderState(side, deckIds) {
  const deck = deckIds.map(cid => createCardInstance(cid, side)).filter(Boolean);
  shuffleArray(deck);
  return {
    hp: RULES.hp, maxHp: RULES.hp,
    energy: RULES.energyStart, maxEnergy: RULES.energyStart,
    bones: 0,
    deck: deck, hand: [], graveyard: [],
    crests: [],
    playedCardsLog: [],
    publicHandIds: [],
    destroyedLastWordsCount: 0,
    destroyedGuardCount: 0,
    playedValues1to8: {},
    energySpentTotal: 0,
    fatigueCount: 0,
    selfTurnDamageCount: 0,
    totalSelfTurnDamageCount: 0,
    prevSelfTurnDamageCount: 0,
    delayedSelfDmgDraws: 0,
    delayedSelfDmgBats: 0,
    cardsPlayedThisTurn: 0,
    nextMechDiscount: 0,
    delayedMechDraws: 0,
    werewolfPlayedCount: 0,
    extraEnergy: 0,
    extraEnergyExpiresAtTurn: 0,
    extraEnergyGrantedTurns: {},
  };
}

let globalEnterSeq = 0;
const hiddenCardUids = new Set();

function getHandCardRect(side, uid) {
  const zoneId = side === 0 ? 'playerHandZone' : 'enemyHandBacks';
  const zone = document.getElementById(zoneId);
  if (zone && uid) {
    const cardEl = zone.querySelector(`[data-card-uid="${uid}"]`);
    if (cardEl) return cardEl.getBoundingClientRect();
  }
  return zone ? zone.getBoundingClientRect() : null;
}

async function animateCardTrajectory({ fromRect, toRect, cardData, showFront = true, duration = 380, arcHeight = -42, startScale = 0.58, endScale = 1.0 }) {
  if (!fromRect || !toRect) return;
  const _uiScale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ui-scale')) || 1;
  startScale = startScale * _uiScale;
  endScale = endScale * _uiScale;
  arcHeight = arcHeight * _uiScale;
  const flyer = document.createElement('div');
  flyer.style.position = 'fixed';
  flyer.style.zIndex = '215';
  flyer.style.pointerEvents = 'none';
  flyer.style.left = '0px';
  flyer.style.top = '0px';
  flyer.style.willChange = 'transform, opacity';

  if (showFront && cardData) {
    const dom = buildHandCardDOM(cardData, null, 0);
    dom.style.margin = '0';
    dom.style.boxShadow = '0 0 28px rgba(56, 189, 248, 0.9), 0 12px 28px rgba(0,0,0,0.9)';
    flyer.appendChild(dom);
  } else {
    flyer.style.width = '110px';
    flyer.style.height = '154px';
    flyer.style.borderRadius = '12px';
    flyer.style.background = 'linear-gradient(155deg, #1e293b 0%, #090d16 100%)';
    flyer.style.border = '2.5px solid #fbbf24';
    flyer.style.boxShadow = '0 0 25px rgba(251, 191, 36, 0.8), 0 10px 24px rgba(0,0,0,0.9)';
    flyer.innerHTML = `<div class="w-full h-full flex items-center justify-center"><div class="w-11 h-11 rounded-full border-2 border-sky-400/80 bg-sky-900/50 flex items-center justify-center text-sm text-amber-300 font-black">✦</div></div>`;
  }
  flyer.style.opacity = '0';
  document.body.appendChild(flyer);

  const fRect = flyer.getBoundingClientRect();
  const fw = fRect.width || 140;
  const fh = fRect.height || 196;

  const sx = fromRect.left + fromRect.width / 2 - fw / 2;
  const sy = fromRect.top + fromRect.height / 2 - fh / 2;
  const ex = toRect.left + toRect.width / 2 - fw / 2;
  const ey = toRect.top + toRect.height / 2 - fh / 2;
  flyer.style.transform = `translate3d(${sx}px, ${sy}px, 0) scale(${startScale})`;
  flyer.style.opacity = '1';

  const t0 = performance.now();
  /* FIX: rAF 在后台标签页/节流环境下会停止回调，原来的 await 永不 resolve，
     会把整个 AI 回合（battle.animating=true）永久卡死。这里加一条 setTimeout 兜底。 */
  await Promise.race([ new Promise(resolve => {
    function step(now) {
      const p = Math.min(1, (now - t0) / duration);
      const ease = 1 - Math.pow(1 - p, 3);
      const cx = sx + (ex - sx) * ease;
      const cy = sy + (ey - sy) * ease + Math.sin(p * Math.PI) * arcHeight;
      const sc = startScale + (endScale - startScale) * ease;
      const rot = Math.sin(p * Math.PI) * (ex >= sx ? 6 : -6);
      flyer.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0) scale(${sc.toFixed(3)}) rotate(${rot.toFixed(1)}deg)`;
      if (p < 1) requestAnimationFrame(step);
      else resolve();
    }
    requestAnimationFrame(step);
  }), new Promise(r => setTimeout(r, Math.max(60, duration) + 150)) ]);
  flyer.remove();
}

async function applyFatigueDamageAnimated(side) {
  const st = battle.leaders[side];
  if (!st || battle.gameOver) return;
  st.fatigueCount = (st.fatigueCount || 0) + 1;
  const dmg = st.fatigueCount;
  spawnFloatNumber(side, -1, `💀疲劳 -${dmg}`, '#f43f5e');
  await showTriggeredEffectToast(
    { id: 'sys_fatigue', name: '牌库枯竭 · 疲劳', type: 'spell', rarity: '传说', energy: 0, bones: 0, sacrifice: 0 },
    `${side === 0 ? '我方' : '敌方'}牌库已空，受到第 ${dmg} 次疲劳伤害（-${dmg} 点生命）！`,
    260
  );
  await dealDamageToLeaderAnimated(side, dmg, null, false);
}

async function playOverdrawBurnAnim(side, cardData) {
  addBones(side, 1);
  spawnFloatNumber(side, -1, '💥爆牌 骨头+1', '#f43f5e');
  const zone = document.getElementById('overflowBanishZone');
  const deckEl = document.getElementById(side === 0 ? 'playerDeckStackEl' : 'enemyDeckStackEl');
  if (zone && cardData) {
    const fromRect = deckEl ? deckEl.getBoundingClientRect() : null;
    const zRect = zone.getBoundingClientRect();
    const toRect = {
      left: zRect.left + Math.max(0, zRect.width / 2 - 58),
      top: zRect.top + Math.max(0, zRect.height / 2 - 80),
      width: 116,
      height: 162
    };
    if (fromRect && typeof animateCardTrajectory === 'function') {
      sfx.play('draw');
      await animateCardTrajectory({
        fromRect,
        toRect,
        cardData,
        showFront: true,
        duration: 460,
        arcHeight: side === 0 ? -52 : 42,
        startScale: 0.48,
        endScale: 0.92
      });
    }
    sfx.play('hit');
    const wrap = document.createElement('div');
    wrap.className = 'relative flex flex-col items-center';
    const cardEl = buildHandCardDOM(cardData, null);
    cardEl.style.transform = 'scale(0.92)';
    cardEl.style.transition = 'transform 0.55s cubic-bezier(0.22, 1, 0.36, 1), filter 0.55s ease, opacity 0.55s ease';
    const tag = document.createElement('div');
    tag.className = 'absolute -top-3 px-2.5 py-0.5 rounded-full bg-rose-950 border border-rose-400 text-[11px] font-black text-rose-200 shadow-lg z-30 whitespace-nowrap';
    tag.textContent = `💥 ${side === 0 ? '我方' : '敌方'}手牌已满·爆牌 (骨头+1)`;
    wrap.appendChild(cardEl);
    wrap.appendChild(tag);
    zone.appendChild(wrap);
    await sleep(340);
    if (typeof playBanishVoidSVG === 'function') playBanishVoidSVG(wrap);
    cardEl.classList.add('banish-void-anim');
    cardEl.style.filter = 'brightness(1.4) saturate(1.8) drop-shadow(0 0 18px #f43f5e)';
    cardEl.style.transform = 'scale(0.68) rotate(8deg)';
    cardEl.style.opacity = '0';
    await sleep(620);
    wrap.remove();
  }
  renderAllBattleUI();
}

async function drawCardAnimated(side) {
  const st = battle.leaders[side];
  if (st.deck.length === 0) {
    await applyFatigueDamageAnimated(side);
    return null;
  }
  const card = st.deck.shift();
  const limit = st.handLimit || RULES.handLimit;

  if (st.hand.length >= limit) {
    await playOverdrawBurnAnim(side, card.data);
    return null;
  }

  sfx.play('draw');
  hiddenCardUids.add(card.uid);
  st.hand.push(card);
  renderAllBattleUI();

  const deckEl = document.getElementById(side === 0 ? 'playerDeckStackEl' : 'enemyDeckStackEl');
  const fromRect = deckEl ? deckEl.getBoundingClientRect() : null;
  const toRect = getHandCardRect(side, card.uid);

  await animateCardTrajectory({
    fromRect,
    toRect,
    cardData: card.data,
    showFront: side === 0 || battleMode === 'pvp_pass',
    duration: 380,
    arcHeight: side === 0 ? -48 : 36,
    startScale: 0.52,
    endScale: side === 0 ? 1.0 : 0.45
  });

  hiddenCardUids.delete(card.uid);
  renderAllBattleUI();
  return card;
}

function checkGameOverState() {
  if (!battle || battle.gameOver) return;
  const pDead = battle.leaders[0].hp <= 0;
  const eDead = battle.leaders[1].hp <= 0;
  if (!pDead && !eDead) return;
  battle.gameOver = true;
  const playerWon = eDead && !pDead;
  if (battleMode === 'pvp_online' && typeof showOnlineVictoryDefeatModal === 'function') {
    showOnlineVictoryDefeatModal(playerWon, playerWon ? '你成功击败了联机对手！点击下方按钮回到对战房间。' : '己方主战者生命值归零，点击下方按钮回到对战房间。');
    return;
  }
  const vModal = document.getElementById('victoryDefeatModal');
  if (vModal) {
    const iconEl = document.getElementById('vicBadgeIcon');
    const titleEl = document.getElementById('vicTitleTxt');
    const subEl = document.getElementById('vicSubTxt');
    if (iconEl) iconEl.textContent = playerWon ? '🏆' : '💀';
    if (typeof clearPveBattleProgress === 'function') clearPveBattleProgress();
    if (titleEl) {
      titleEl.textContent = playerWon ? 'VICTORY · 对战胜利' : 'DEFEAT · 对战落败';
      titleEl.className = playerWon ? 'text-3xl font-black tracking-widest text-amber-300' : 'text-3xl font-black tracking-widest text-rose-400';
    }
    if (subEl) {
      subEl.textContent = playerWon ? '敌方主战者生命值已归零，你赢得了本场对局！' : '我方主战者生命值归零，可随时点击下方按钮再战一局或调整卡组。';
    }
    if (typeof cfRecordMatch === 'function') cfRecordMatch(playerWon);
    if (typeof cfSaveBattleLog === 'function') cfSaveBattleLog(playerWon);
    vModal.classList.remove('hidden');
  }
}

function drawCardSync(side, playFlight = true) {
  const st = battle.leaders[side];
  if (st.deck.length === 0) {
    st.fatigueCount = (st.fatigueCount || 0) + 1;
    const dmg = st.fatigueCount;
    st.hp -= dmg;
    spawnFloatNumber(side, -1, `💀疲劳 -${dmg}`, '#f43f5e');
    renderAllBattleUI();
    checkGameOverState();
    return null;
  }
  const card = st.deck.shift();
  const limit = st.handLimit || RULES.handLimit;
  if (st.hand.length >= limit) {
    addBones(side, 1);
    spawnFloatNumber(side, -1, `💥爆牌(${card.data.name}) 骨头+1`, '#f43f5e');
    renderAllBattleUI();
    return null;
  }
  if (playFlight) {
    sfx.play('draw');
    hiddenCardUids.add(card.uid);
    st.hand.push(card);
    renderAllBattleUI();
    const deckEl = document.getElementById(side === 0 ? 'playerDeckStackEl' : 'enemyDeckStackEl');
    const fromRect = deckEl ? deckEl.getBoundingClientRect() : null;
    const toRect = getHandCardRect(side, card.uid);
    animateCardTrajectory({
      fromRect, toRect, cardData: card.data, showFront: side === 0, duration: 360, arcHeight: -42, startScale: 0.52, endScale: side === 0 ? 1.0 : 0.45
    }).then(() => {
      hiddenCardUids.delete(card.uid);
      renderAllBattleUI();
    });
  } else {
    st.hand.push(card);
  }
  return card;
}

async function playShuffleIntoDeckAnim(side, fromRectOverride = null, cardData = null) {
  const deckEl = document.getElementById(side === 0 ? 'playerDeckStackEl' : 'enemyDeckStackEl');
  const handEl = document.getElementById(side === 0 ? 'playerHandZone' : 'enemyHandBacks');
  const fromRect = fromRectOverride || (handEl ? handEl.getBoundingClientRect() : null);
  const toRect = deckEl ? deckEl.getBoundingClientRect() : null;
  sfx.play('draw');
  await animateCardTrajectory({
    fromRect,
    toRect,
    cardData,
    showFront: Boolean(cardData && side === 0),
    duration: 360,
    arcHeight: -38,
    startScale: 0.92,
    endScale: 0.48
  });
  if (deckEl) {
    deckEl.classList.add('shuffle-shake');
    setTimeout(() => deckEl.classList.remove('shuffle-shake'), 440);
  }
}

async function addCardToHandAnimated(side, cardNameOrId, count = 1, sourceLane = -1, sourceCardName = '', grantKw = null) {
  const st = battle.leaders[side];
  const limit = st.handLimit || RULES.handLimit;
  const fromEl = sourceLane >= 0 ? getLaneDOM(side, sourceLane) : getLaneDOM(side, -1);
  const fromRect = fromEl ? fromEl.getBoundingClientRect() : null;

  for (let i = 0; i < count; i++) {
    const inst = createCardInstance(cardNameOrId, side);
    if (!inst) continue;
    if (grantKw) {
      inst.activeKw[grantKw] = Math.max(1, inst.activeKw[grantKw] || 1);
      addGrantedEffect(inst, `来源：【${sourceCardName || '效果'}】 → 获得${grantKw}`);
    } else if (sourceCardName) {
      addGrantedEffect(inst, `来源：【${sourceCardName}】 → 衍生加入手牌`);
    }
    if (st.hand.length < limit) {
      sfx.play('draw');
      hiddenCardUids.add(inst.uid);
      st.hand.push(inst);
      if (st.publicHandIds) st.publicHandIds.push({ uid: inst.uid, id: inst.data.id, name: inst.data.name });
      renderAllBattleUI();
      const toRect = getHandCardRect(side, inst.uid);
      await animateCardTrajectory({
        fromRect,
        toRect,
        cardData: inst.data,
        showFront: side === 0,
        duration: 360,
        arcHeight: -36,
        startScale: 0.62,
        endScale: side === 0 ? 1.0 : 0.45
      });
      hiddenCardUids.delete(inst.uid);
      renderAllBattleUI();
    } else {
      await playOverdrawBurnAnim(side, inst.data);
    }
  }
}

function addCardToHand(side, cardNameOrId, count = 1, sourceLane = -1) {
  return addCardToHandAnimated(side, cardNameOrId, count, sourceLane);
}

function performAiOpeningMulligan(side = 1) {
  const st = battle.leaders[side];
  if (!st || !Array.isArray(st.hand) || st.hand.length === 0) return [];
  const oppIntel = (typeof initOpponentIntelForSide === 'function') ? initOpponentIntelForSide(side) : null;
  const maxKeepCost = (oppIntel && (oppIntel.archetype === 'mech' || oppIntel.archetype === 'selfdmg')) ? 3 : 4;
  const swappedIndices = [];
  const usedBuckets = new Set();
  for (let i = 0; i < st.hand.length; i++) {
    const c = st.hand[i];
    if (!c || !c.data) continue;
    if (c.data.id === 'cmwbz163tt1ma' || String(c.data.text || '').includes('必定')) {
      usedBuckets.add(1);
      continue;
    }
    if (c.data.type === 'spell' && c.data.id !== 'cmwdvmwjm0301') {
      swappedIndices.push(i);
      continue;
    }
    if (c.data.id === 'cmwe1w8cztclb') {
      const hasEarlyCd = st.hand.some(h => h !== c && ['cmwdtm73fwg1u', 'cmwdvmwjm0301', 'cmwdvrwfcy5gg'].includes(h.data.id));
      if (!hasEarlyCd) { swappedIndices.push(i); continue; }
    }
    if ((c.data.sacrifice || 0) >= 1) {
      const hasCheapFodder = st.hand.some(h => h !== c && h.data.type === 'minion' && (h.data.sacrifice || 0) === 0 && (h.data.energy || 0) <= 2);
      if (!hasCheapFodder) { swappedIndices.push(i); continue; }
    }
    const crystKw = (c.data.keywords || []).find(k => k.k === '结晶');
    const v = crystKw ? Number(crystKw.v || 2) : getCardCostValue(c.data);
    const isDragonCoreKeep = ['cmwdtm73fwg1u', 'cmwdvrwfcy5gg', 'cmwdvmwjm0301'].includes(c.data.id);
    if (v > maxKeepCost && !isDragonCoreKeep) {
      swappedIndices.push(i);
      continue;
    }
    const isDragonCore = ['cmwdtm73fwg1u', 'cmwdvrwfcy5gg', 'cmwdvmwjm0301'].includes(c.data.id);
    const bucket = v <= 1 ? 1 : (v <= 2 ? 2 : (v <= 3 ? 3 : 4));
    if (usedBuckets.has(bucket) && !isDragonCore) {
      swappedIndices.push(i);
    } else {
      usedBuckets.add(bucket);
    }
  }
  if (swappedIndices.length === 0) return [];
  const returned = [];
  swappedIndices.forEach(idx => {
    returned.push(st.hand[idx]);
    const replacement = st.deck.shift();
    if (replacement) st.hand[idx] = replacement;
  });
  returned.forEach(c => st.deck.push(c));
  shuffleArray(st.deck);
  return swappedIndices;
}

function prepareOpeningHand(side) {
  const st = battle.leaders[side];
  const idx = st.deck.findIndex(inst => inst.data.id === 'cmwbz163tt1ma' || (inst.data.text || '').includes('必定'));
  if (idx !== -1) {
    const [guaranteed] = st.deck.splice(idx, 1);
    st.deck.unshift(guaranteed);
  }
  for (let i = 0; i < RULES.openingHand; i++) drawCardSync(side, false);
  if (side === 1 && battleMode === 'pve') {
    performAiOpeningMulligan(1);
  }
}



/* 龙族·作者卡组（用户 CF1 牌组码）—— 替换原「苍穹龙族进化」作为龙族 AI */





/* ============ 详细对战日志（给平衡分析用，玩家版+开发者版都有） ============
   记录粒度：每回合快照（双方血量/场面/手牌数/能量）+ 每次出牌 + 结算结果
   存储：localStorage['cf_battlelogs_v1']，最多保留 200 场
   导出：控制台 cfBattleLogExport()  或 历史面板里的「导出全部明细」
*/
const CF_BATTLELOGS_KEY = 'cf_battlelogs_v1';
const CF_BATTLELOG_MAX = 200;
function cfLoadBattleLogs() {
  try { return JSON.parse(localStorage.getItem(CF_BATTLELOGS_KEY) || '[]'); } catch (e) { return []; }
}
function cfSaveBattleLogs(list) {
  try { localStorage.setItem(CF_BATTLELOGS_KEY, JSON.stringify(list.slice(-CF_BATTLELOG_MAX))); }
  catch (e) { /* 配额满：只留最近 50 场 */ try { localStorage.setItem(CF_BATTLELOGS_KEY, JSON.stringify(list.slice(-50))); } catch (e2) {} }
}
function cfBoardSnapshot(side) {
  const arr = [];
  for (let l = 0; l < 5; l++) {
    const m = battle.board[side][l];
    arr.push(m && m.data ? (m.data.name + ' ' + (m.currentAtk || 0) + '/' + (m.currentHp || 0)) : '');
  }
  return arr;
}
let cfTrace = [];
function cfTraceReset() { cfTrace = []; }
function cfTracePush(ev) {
  if (cfTrace.length >= 160) return;
  try { cfTrace.push(Object.assign({ turn: battle.turn || 1, side: battle.activeSide }, ev)); } catch (e) {}
}
/* 每次出牌 / 攻击 / 结算都走这里 */
window.cfTraceEvent = cfTracePush;
function cfTraceSnapshot(tag) {
  try {
    cfTracePush({
      kind: 'snapshot', tag: tag,
      hp: [battle.leaders[0].hp, battle.leaders[1].hp],
      energy: [battle.leaders[0].energy, battle.leaders[1].energy],
      hand: [battle.leaders[0].hand.length, battle.leaders[1].hand.length],
      board0: cfBoardSnapshot(0), board1: cfBoardSnapshot(1)
    });
  } catch (e) {}
}
function cfSaveBattleLog(resultWin) {
  try {
    if (!battle || battle.__cfSurrendered || !battle.gameOver) return false;
    if (battleMode !== 'pve') return false;
    const me = battle.leaders[0], ai = battle.leaders[1];
    const rec = {
      t: Date.now(),
      ai: aiDeckArchetype || 'unknown',
      diff: aiDifficulty || 'normal',
      order: battle.firstPlayerSide === 0 ? 'first' : 'second',
      win: !!resultWin,
      turns: battle.turn,
      myHp: me.hp, aiHp: ai.hp,
      myDeck: (PRESET_DECKS[currentDeckIndex] && PRESET_DECKS[currentDeckIndex].name) || '',
      trace: cfTrace.slice()
    };
    const list = cfLoadBattleLogs();
    list.push(rec);
    cfSaveBattleLogs(list);
    return true;
  } catch (e) { return false; }
}
window.cfBattleLog = function () {
  const list = cfLoadBattleLogs();
  const n = list.length, w = list.filter(x => x.win).length;
  return {
    total: n, win: w, winRate: n ? +(w / n * 100).toFixed(1) : 0,
    bytes: (function(){ try { return (localStorage.getItem(CF_BATTLELOGS_KEY) || '').length; } catch(e){ return 0; } })(),
    byAi: list.reduce((a, x) => { a[x.ai] = a[x.ai] || { n: 0, w: 0 }; a[x.ai].n++; if (x.win) a[x.ai].w++; return a; }, {}),
    recent: list.slice(-5)
  };
};
window.cfBattleLogExport = function () {
  const list = cfLoadBattleLogs();
  const txt = JSON.stringify({ v: 1, exportedAt: new Date().toISOString(), battles: list }, null, 0);
  try {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([txt], { type: 'application/json' }));
    a.download = 'cf-battles-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); a.remove();
  } catch (e) {}
  return list.length + ' 场已导出（' + (txt.length / 1024).toFixed(0) + ' KB）';
};
window.cfBattleLogClear = function () { cfSaveBattleLogs([]); return '已清空明细日志'; };

/* ============ 历史对局记录 + 回放面板（正式功能） ============ */
const CF_MATCHLOG_KEY = 'cf_matchlog_v1';
const CF_DECK_AVATAR = {
  mech: 'cmwbx0mq8qz7f', dragon: 'cmwdtm73fwg1u', selfdamage: 'cmwfg3ouofrw4',
  selfdmgpro: 'cmwfg3ouofrw4', lastwords: 'cmwgeg2eggz9t', guardian: 'cmwgd56lg867w'
};
function cfLoadMatchLog() {
  try { return JSON.parse(localStorage.getItem(CF_MATCHLOG_KEY) || '[]'); } catch (e) { return []; }
}
function cfSaveMatchLog(list) {
  try { localStorage.setItem(CF_MATCHLOG_KEY, JSON.stringify(list.slice(-500))); } catch (e) {}
}
function cfPickDeckAvatar() {
  try {
    const d = PRESET_DECKS[currentDeckIndex];
    if (!d || !d.cards) return '';
    const ids = Object.keys(d.cards);
    let best = '', bestScore = -1;
    ids.forEach(id => {
      const c = cardsById[id]; if (!c) return;
      const sc = (c.rarity === '传说' ? 40 : c.rarity === '史诗' ? 30 : 20) + (c.energy || 0);
      if (sc > bestScore) { bestScore = sc; best = id; }
    });
    return best;
  } catch (e) { return ''; }
}
function cfRecordMatch(resultWin) {
  try {
    if (!battle || battle.__cfSurrendered || battle.__cfWasSpectate || window.CF_SPECTATE_ACTIVE) return false;
    if (!battle.gameOver) return false;
    if (battleMode !== 'pve') return false;
    const me = battle.leaders[0], ai = battle.leaders[1];
    const rec = {
      t: Date.now(),
      ai: aiDeckArchetype || 'unknown',
      aiAvatar: CF_DECK_AVATAR[aiDeckArchetype] || '',
      diff: aiDifficulty || 'normal',
      order: battle.firstPlayerSide === 0 ? 'first' : 'second',
      win: !!resultWin,
      turns: battle.turn,
      myHp: me.hp, aiHp: ai.hp,
      myDeck: (PRESET_DECKS[currentDeckIndex] && PRESET_DECKS[currentDeckIndex].name) || '',
      myAvatar: cfPickDeckAvatar()
    };
    const list = cfLoadMatchLog();
    list.push(rec);
    cfSaveMatchLog(list);
    return true;
  } catch (e) { return false; }
}
window.cfRecordMatch = cfRecordMatch;
window.cfMatchLog = function () {
  const list = cfLoadMatchLog();
  const n = list.length, w = list.filter(x => x.win).length;
  const byAi = {};
  list.forEach(x => {
    byAi[x.ai] = byAi[x.ai] || { n: 0, w: 0, first: 0, firstW: 0, second: 0, secondW: 0 };
    const b = byAi[x.ai]; b.n++; if (x.win) b.w++;
    if (x.order === 'first') { b.first++; if (x.win) b.firstW++; } else { b.second++; if (x.win) b.secondW++; }
  });
  Object.keys(byAi).forEach(k => {
    const b = byAi[k];
    b.winRate = +(b.w / b.n * 100).toFixed(1);
    b.firstRate = b.first ? +(b.firstW / b.first * 100).toFixed(1) : null;
    b.secondRate = b.second ? +(b.secondW / b.second * 100).toFixed(1) : null;
  });
  return { total: n, win: w, lose: n - w, winRate: n ? +(w / n * 100).toFixed(1) : 0,
    avgTurns: n ? +(list.reduce((a, x) => a + (x.turns || 0), 0) / n).toFixed(1) : 0, byAi, recent: list.slice(-20) };
};
window.cfArtBuild = function () { return (window.__ART_ENGINE_BUILD || '未标记') + ' | 新画风覆盖 ' + (function(){try{var cv=document.createElement('canvas');cv.width=280;cv.height=220;var ids=Object.keys(cardsById),hit=0;ids.forEach(function(id){try{if(window.renderCustomCardArt(cv.getContext('2d'),cardsById[id]))hit++;}catch(e){}});return hit+'/'+ids.length;}catch(e){return '?';}})(); };
window.cfMatchLogDump = function () { return JSON.stringify(cfLoadMatchLog()); };
window.cfMatchLogClear = function () { cfSaveMatchLog([]); return '已清空对战记录'; };

/* ---- 面板 ---- */
const CF_AI_LABEL = { mech: '⚙️ 齿轮洪流', dragon: '🐉 苍穹龙血', selfdamage: '🩸 血债回响', selfdmgpro: '🩸 血债回响', lastwords: '🎸 终幕协奏', guardian: '🛡️ 圣盾铁壁' };
function cfArtFor(id) {
  try {
    const c = cardsById[id];
    if (!c) return '';
    return getAnimeIllustrationDataURI(c);
  } catch (e) { return ''; }
}
function cfOpenMatchHistory() {
  const old = document.getElementById('cfHistoryModal');
  if (old) old.remove();
  const list = cfLoadMatchLog().slice().reverse();
  const n = list.length, w = list.filter(x => x.win).length;
  const rate = n ? (w / n * 100).toFixed(1) : '0.0';
  const wrap = document.createElement('div');
  wrap.id = 'cfHistoryModal';
  wrap.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(4,8,16,.86);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:16px';
  const rows = list.map(r => {
    const myArt = cfArtFor(r.myAvatar || cfPickDeckAvatar());
    const aiArt = cfArtFor(r.aiAvatar || CF_DECK_AVATAR[r.ai] || '');
    const d = new Date(r.t);
    const tm = (d.getMonth() + 1) + '-' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    const resColor = r.win ? '#4ade80' : '#f87171';
    return `<div style="display:flex;align-items:center;gap:10px;padding:8px;border-radius:10px;background:rgba(15,23,42,.75);border:1px solid rgba(148,163,184,.18)">
      <div style="width:44px;text-align:center;font:700 12px system-ui;color:${resColor}">${r.win ? '胜' : '负'}</div>
      <div style="display:flex;flex-direction:column;align-items:center;width:52px">
        <img src="${myArt}" style="width:44px;height:34px;object-fit:cover;border-radius:6px;border:1px solid #475569">
        <span style="font:600 9px system-ui;color:#cbd5e1;margin-top:2px;max-width:52px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${(r.myDeck || '我方').replace(/^[^\\s]*\\s/, '')}</span>
      </div>
      <div style="flex:1;font:600 11px system-ui;color:#94a3b8;text-align:center">VS</div>
      <div style="display:flex;flex-direction:column;align-items:center;width:52px">
        <img src="${aiArt}" style="width:44px;height:34px;object-fit:cover;border-radius:6px;border:1px solid #475569">
        <span style="font:600 9px system-ui;color:#fbbf24;margin-top:2px;max-width:52px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${(CF_AI_LABEL[r.ai] || r.ai).replace(/^[^\\s]*\\s/, '')}</span>
      </div>
      <div style="font:600 10.5px/1.45 system-ui;color:#cbd5e1;min-width:132px;text-align:right">
        ${r.order === 'first' ? '先手' : '后手'} · ${r.turns} 回合<br>
        我 ${r.myHp} ｜ 敌 ${r.aiHp}<br>
        <span style="color:#64748b">${tm}</span>
      </div>
    </div>`;
  }).join('');
  wrap.innerHTML = `
    <div style="width:min(560px,96vw);max-height:88vh;display:flex;flex-direction:column;background:linear-gradient(180deg,#111a2e,#0b1220);border:1px solid rgba(148,163,184,.3);border-radius:16px;overflow:hidden">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid rgba(148,163,184,.18)">
        <div style="font:800 15px system-ui;color:#fde047">📜 对局记录</div>
        <button id="cfHistClose" style="background:#1e293b;color:#cbd5e1;border:1px solid #475569;border-radius:8px;padding:5px 12px;font:700 12px system-ui;cursor:pointer">关闭</button>
      </div>
      <div style="padding:12px 16px;display:flex;gap:14px;align-items:center;border-bottom:1px solid rgba(148,163,184,.12)">
        <div style="font:800 26px system-ui;color:#f8fafc">${rate}<span style="font-size:13px">%</span></div>
        <div style="font:600 11.5px/1.6 system-ui;color:#94a3b8">
          共 ${n} 场 ｜ 胜 ${w} ｜ 负 ${n - w}<br>
          只统计打完的对局（投降/中途退出不记录）<br>
          <span style="color:#64748b">明细日志：${(function(){try{const l=cfLoadBattleLogs();return l.length+' 场 · '+((localStorage.getItem('cf_battlelogs_v1')||'').length/1024|0)+' KB';}catch(e){return '-';}})()}</span>
        </div>
        <div style="margin-left:auto;display:flex;gap:8px">
          <button id="cfHistDump" style="background:#0e7490;color:#e0f2fe;border:1px solid #22d3ee;border-radius:8px;padding:6px 10px;font:700 11px system-ui;cursor:pointer">导出明细</button>
          <button id="cfHistBrief" style="background:#334155;color:#e2e8f0;border:1px solid #64748b;border-radius:8px;padding:6px 10px;font:700 11px system-ui;cursor:pointer">只看胜负</button>
          <button id="cfHistClear" style="background:#7f1d1d;color:#fecaca;border:1px solid #ef4444;border-radius:8px;padding:6px 10px;font:700 11px system-ui;cursor:pointer">清空</button>
        </div>
      </div>
      <div style="overflow:auto;padding:12px 16px;display:flex;flex-direction:column;gap:8px">
        ${rows || '<div style="color:#64748b;font:600 12px system-ui;text-align:center;padding:24px">还没有对局记录，去打一局吧</div>'}
      </div>
    </div>`;
  document.body.appendChild(wrap);
  document.getElementById('cfHistClose').onclick = () => wrap.remove();
  document.getElementById('cfHistClear').onclick = () => { cfMatchLogClear(); wrap.remove(); cfOpenMatchHistory(); };
  document.getElementById('cfHistDump').onclick = () => {
    try {
      const msg = (typeof cfBattleLogExport === 'function') ? cfBattleLogExport() : '无明细记录';
      showGameAlert(msg + '\n已保存到下载文件夹（cf-battles-日期.json）', '📦');
    } catch (e) { showGameAlert('导出失败: ' + e.message, '⚠️'); }
  };
  document.getElementById('cfHistBrief').onclick = () => {
    const txt = cfMatchLogDump();
    const ta = document.createElement('textarea');
    ta.value = txt; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    ta.remove();
    showGameAlert('已复制 ' + (JSON.parse(txt).length) + ' 条摘要到剪贴板', '📋');
  };
}
window.cfOpenMatchHistory = cfOpenMatchHistory;

/* 主界面入口按钮 */
function cfInstallHistoryButton() {
  if (document.getElementById('cfHistBtn')) return;
  const btn = document.createElement('button');
  btn.id = 'cfHistBtn';
  btn.textContent = '📜 对局记录';
  btn.style.cssText = 'position:fixed;left:16px;bottom:16px;z-index:9000;padding:9px 14px;border-radius:12px;font:800 12.5px system-ui;color:#e0f2fe;background:linear-gradient(180deg,#0e7490,#155e75);border:1px solid #22d3ee;box-shadow:0 6px 18px rgba(0,0,0,.45);cursor:pointer';
  btn.onclick = cfOpenMatchHistory;
  document.body.appendChild(btn);
  const sync = () => {
    const menu = document.getElementById('mainMenuOverlay');
    const visible = menu && !menu.classList.contains('hidden');
    btn.style.display = visible ? 'block' : 'none';
  };
  sync();
  const menuEl = document.getElementById('mainMenuOverlay');
  if (menuEl && window.MutationObserver) new MutationObserver(sync).observe(menuEl, { attributes: true, attributeFilter: ['class'] });
  setInterval(sync, 1200);
}
if (document.readyState === 'complete' || document.readyState === 'interactive') setTimeout(cfInstallHistoryButton, 600);
else window.addEventListener('DOMContentLoaded', () => setTimeout(cfInstallHistoryButton, 600));



let aiDifficulty = 'normal';
const AI_DIFFICULTY_CONFIG = {
  normal:  { label: '普通', hp: 30, drawCrestTurns: 0 },
  hard:    { label: '🔥困难', hp: 40, drawCrestTurns: 2 },
  inferno: { label: '💀炼狱', hp: 50, drawCrestTurns: 4 }
};

function getSelectedAiDeckObj() {
  if (aiDeckArchetype === 'dragon') return AI_DRAGON_PRO_DECK;
  if (aiDeckArchetype === 'undead') return AI_UNDEAD_BONE_DECK;
  if (aiDeckArchetype === 'lastwords') return AI_LASTWORDS_DECK;
  if (aiDeckArchetype === 'selfdamage') return AI_SELFDAMAGE_PRO_DECK;
  if (aiDeckArchetype === 'guardian') return AI_CREST_GUARD_PRO_DECK;
  return AI_MECH_PRO_DECK;
}

function showSacrificeGuideBanner(stepBadgeText, mainText) {
  const banner = document.getElementById('sacrificeGuideBanner');
  if (!banner) return;
  if (!mainText) {
    banner.classList.add('hidden');
    return;
  }
  const bEl = document.getElementById('sacGuideStepBadge');
  const mEl = document.getElementById('sacGuideMainText');
  if (bEl) bEl.textContent = stepBadgeText || '出牌引导';
  if (mEl) mEl.textContent = mainText;
  banner.classList.remove('hidden');
}

