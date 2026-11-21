// ============================================================================
// 新增模块 A：左侧战局统计面板（查看敌我双方已使用卡牌[按费用从上到下排序+张数]与被破坏卡牌）
// ============================================================================
let activeBattleLogSide = 0; // 0 = 我方, 1 = 敌方

function aggregateCardsByEnergyAsc(cardDataArray) {
  const map = new Map();
  (cardDataArray || []).forEach(cd => {
    if (!cd) return;
    const prev = map.get(cd.id);
    if (prev) prev.count += 1;
    else map.set(cd.id, { card: cd, count: 1 });
  });
  return Array.from(map.values()).sort((a, b) => {
    if ((a.card.energy || 0) !== (b.card.energy || 0)) return (a.card.energy || 0) - (b.card.energy || 0);
    return String(a.card.name).localeCompare(String(b.card.name));
  });
}

function getHandCardLiveCounterBadge(cardData, inst) {
  if (!inst || !battle || !battle.leaders || !battle.leaders[inst.owner]) return '';
  const st = battle.leaders[inst.owner];
  const txt = String(cardData.fullText || cardData.text || '');
  if (cardData.id === 'cmwget8v364ar') {
    const lostHp = Math.max(0, (st.maxHp || 30) - st.hp);
    const tiers = [3, 6, 9, 15, 21, 27].filter(t => lostHp >= t).length;
    return `⚔️+${tiers}/+${tiers} (损血${lostHp})`;
  }
  if (cardData.id === 'cmwdibvlbqmxv') {
    const fCnt = inst.fusedCount || 0;
    return `🧬融合${fCnt} (+${fCnt}/+${fCnt * 2})`;
  }
  if (cardData.id === 'cmwdi4pwz3c0k') {
    return (inst.fusedCount || 0) > 0 ? '🧬已融合(赠2羊)' : '🧬未融合';
  }
  if (cardData.id === 'cmwc2n4p68ewm' || cardData.id === 'cmwc8tup5d1xt') {
    const remMech = (st.hand || []).filter(h => h !== inst && isMechCard(h.data)).length;
    return `⚙️手牌机械 ${remMech}/6`;
  }
  if (cardData.id === 'cmwdyxl33lchi') {
    const rem7 = (st.hand || []).filter(h => h !== inst && h.data.type === 'minion' && (h.data.energy || 0) >= 7).length;
    return `🔥7费+随从 ${rem7}/3`;
  }
  if (cardData.id === 'cmwhosp359tmt') {
    const gCnt = (battle.board && battle.board[inst.owner]) ? battle.board[inst.owner].filter(bm => bm && bm.data.type === 'minion' && bm.activeKw['守护']).length : 0;
    return `🛡️抽${gCnt}张`;
  }
  if (cardData.id === 'cmwhp4fb0ip93') {
    const gCnt = (battle.board && battle.board[inst.owner]) ? battle.board[inst.owner].filter(bm => bm && bm.data.type === 'minion' && bm.activeKw['守护']).length : 0;
    return `🛡️攻+${gCnt + 1}`;
  }
  if (txt.includes('自己回合受伤次数大于12')) return `🩸自残 ${st.totalSelfTurnDamageCount || 0}/12`;
  if (txt.includes('自己回合受伤次数大于7')) return `🩸自残 ${st.totalSelfTurnDamageCount || 0}/7`;
  if (cardData.id === 'cmwhie9u1p4ey') return `🩸本回合 ${st.selfTurnDamageCount || 0}/3`;
  if (cardData.id === 'cmwkgxi000fpl') return `🩸血量 ${st.hp}/10`;
  if (cardData.id === 'cmwkgzkuuxaoz') return `🩸血量 ${st.hp}/15`;
  if (cardData.id === 'cmwke7t3w6xig') return `💀谢幕 ${st.destroyedLastWordsCount || 0}/7`;
  if (txt.includes('已破坏') && txt.includes('谢幕曲')) return `💀谢幕 ${st.destroyedLastWordsCount || 0}`;
  if (cardData.id === 'cmwllvy75f6bz' || txt.includes('被破坏的守护随从')) {
    const gm = txt.match(/被破坏的守护随从(?:为)?(\d+)/);
    return `🛡️守护破坏 ${st.destroyedGuardCount || 0}/${gm ? gm[1] : 10}`;
  }
  if (cardData.id === 'cmwlp6mctrvla' || txt.includes('消耗能量35以上') || txt.includes('消耗能量30以上')) {
    return `⚡耗能 ${st.energySpentTotal || 0}/35`;
  }
  if (txt.includes('连击_')) {
    const m = txt.match(/连击_(\d+)/);
    return `⚡连击 ${st.cardsPlayedThisTurn || 0}/${m ? m[1] : 2}`;
  }
  if (txt.includes('纹章数量') || txt.includes('纹章的数量')) return `💠纹章 ${(st.crests || []).length}`;
  return '';
}

function getCardBodyValueWithSummons(cData, includeConditional = false, depth = 0) {
  if (!cData || depth > 2) return 0;
  let body = cData.type === 'minion' ? ((Number(cData.atk || 0) + Number(cData.hp || 0)) / 2) : 0;
  const rawTxt = String(cData.fullText || cData.text || '');
  let txt = rawTxt.split(/纹章：|【启动】|【回合结束时】|【回合开始时】|【谢幕曲】/)[0];
  if (!includeConditional) {
    // 计算原始身材价值时，剔除需要指定目标或满足特定条件才能触发的召唤/加攻子句
    txt = txt
      .replace(/(?:若|如果|连击_\d+|指定|每有)[^【\n]*/g, '');
  }
  const summonRe = /召唤(\d+)个[『「]?([^』」，。\s]+)[』」]?/g;
  let sm;
  while ((sm = summonRe.exec(txt)) !== null) {
    const cnt = Number(sm[1] || 1);
    const sName = sm[2];
    const sCard = cardsByName[sName] || allCards.find(x => x.name === sName);
    if (sCard && sCard.id !== cData.id) {
      body += cnt * ((Number(sCard.atk || 0) + Number(sCard.hp || 0)) / 2);
    }
  }
  return body;
}

function classifyCardEffectRole(inst, side, playEval = null) {
  const st = battle && battle.leaders ? battle.leaders[side] : null;
  const c = inst.data;
  const isEnh = playEval && playEval.mode === 'enhance';
  const req = getCardTargetRequirement(inst, isEnh, -1);
  const hasTarget = Boolean(req && req !== 'hand_card');
  let targetValid = false;
  if (hasTarget) {
    const locs = getValidTargetLocations(side, req, c.type === 'spell', []);
    targetValid = req === 'friendly_minion_pair' ? locs.length >= 2 : locs.length > 0;
  }

  const txt = String(c.fullText || c.text || '');
  // 底层防误判：仅对“未满足条件则几乎无收益”的硬门槛卡启用 hasCondition（白名单机制），
  // 绝不因为文本里出现“若/如果”（如额外过牌/回血/被动触发护符）而锁死整张牌的 AI 出牌。
  const hardGateIds = new Set([
    'cmwhpkzxube6f', // 阴险的猎手：需满5格才+2/+2和毁灭
    'cmwhmldky1fgg', // 伺机待发的猎鹰骑士：面前需有空位抓人
    'cmwhmorgymp4r', // 傲慢的将军：需价值最高才清场
    'cmwkgxi000fpl', // 狂暴女拳师：需主战者生命<=10
    'cmwkgzkuuxaoz', // 疾驰魔将：需主战者生命<=15
    'cmwke7t3w6xig', // 派对南瓜头：需7谢幕曲
    'cmwgdqawegvy3', // 地狱三头犬：需10谢幕曲
    'cmwhmgdfsy8y7', // 碎骨火种：满场才全体+1/+1
    'cmwhmittxj66h'  // 折光镜像师：需中路相邻有随从
  ]);
  const isPureComboGate = txt.includes('连击_') && c.type === 'spell' && !txt.includes('造成');
  const isSelfDmgGate = txt.includes('自己回合受伤次数大于');
  const isMech6Gate = txt.includes('机械卡牌') && txt.includes('6') && c.id === 'cmwc8tup5d1xt';
  const hasCondition = Boolean(
    hardGateIds.has(c.id) || isPureComboGate || isSelfDmgGate || isMech6Gate
  );
  let condMet = true;
  if (hasCondition && st) {
    condMet = false;
    if (txt.includes('自己回合受伤次数大于12')) condMet = (st.totalSelfTurnDamageCount || 0) >= 12;
    else if (txt.includes('自己回合受伤次数大于7')) condMet = (st.totalSelfTurnDamageCount || 0) >= 7;
    else if (c.id === 'cmwhpkzxube6f') condMet = battle.board[side].filter(x => x !== null).length >= 5;
    else if (c.id === 'cmwhmldky1fgg') condMet = [0,1,2,3,4].some(l => battle.board[side][l] === null && battle.board[1 - side][l] === null);
    else if (c.id === 'cmwhmorgymp4r') {
      const myV = getCardCostValue(c);
      let maxV = -1;
      for (const s of [0,1]) for (let l = 0; l < 5; l++) {
        const bm = battle.board[s][l];
        if (bm && bm.data.type === 'minion') maxV = Math.max(maxV, getCardCostValue(bm.data));
      }
      condMet = maxV >= 0 && myV >= maxV;
    }
    else if (txt.includes('连击_')) {
      const m = txt.match(/连击_(\d+)/);
      condMet = Boolean(m && (st.cardsPlayedThisTurn || 0) >= Number(m[1]));
    }
    else if (c.id === 'cmwkgxi000fpl') condMet = st.hp <= 10;
    else if (c.id === 'cmwkgzkuuxaoz') condMet = st.hp <= 15;
    else if (c.id === 'cmwke7t3w6xig') condMet = hasReachedLastWordsThreshold(side, 7);
    else if (c.id === 'cmwgdqawegvy3') condMet = hasReachedLastWordsThreshold(side, 10);
    else if (isMech6Gate) condMet = st.hand.filter(h => h !== inst && isMechCard(h.data)).length >= 6;
    else if (c.id === 'cmwhmgdfsy8y7') condMet = findFirstEmptyLane(side) === -1;
    else if (c.id === 'cmwhmittxj66h') condMet = battle.board[side].some((m, idx) => m && (idx === 1 || idx === 3));
  }

  const cardVal = getCardCostValue(c);
  const bodyVal = getCardBodyValueWithSummons(c, false);
  const isEffectCard = (c.type === 'spell') || (cardVal > 0 && bodyVal <= cardVal * 0.5);
  return { hasTarget, targetValid, hasCondition, condMet, isEffectCard, bodyVal, cardVal };
}

function evaluateHandCardConditionReady(inst, side, playEval) {
  if (!inst || !battle || !battle.leaders[side]) return false;
  const st = battle.leaders[side];
  const c = inst.data;
  const isEnh = playEval && playEval.mode === 'enhance';
  const role = classifyCardEffectRole(inst, side, playEval);
  if ((role.hasTarget && role.targetValid) || (role.hasCondition && role.condMet)) return true;
  const txt = String(c.fullText || c.text || '');
  if (txt.includes('自己回合受伤次数大于12') && (st.totalSelfTurnDamageCount || 0) >= 12) return true;
  if (txt.includes('自己回合受伤次数大于7') && (st.totalSelfTurnDamageCount || 0) >= 7) return true;
  if (c.id === 'cmwkgxi000fpl' && st.hp <= 10) return true;
  if (c.id === 'cmwkgzkuuxaoz' && st.hp <= 15) return true;
  if (c.id === 'cmwhpkzxube6f' && battle.board[side].filter(x => x !== null).length >= 5) return true;
  if (c.id === 'cmwhmldky1fgg') {
    const opp = 1 - side;
    if ([0,1,2,3,4].some(l => battle.board[side][l] === null && battle.board[opp][l] === null)) return true;
  }
  if (txt.includes('连击_')) {
    const m = txt.match(/连击_(\d+)/);
    if (m && (st.cardsPlayedThisTurn || 0) >= Number(m[1])) return true;
  }
  if (txt.includes('机械卡牌') && txt.includes('6') && st.hand.filter(h => h !== inst && isMechCard(h.data)).length >= 6) return true;
  return false;
}

function deckHasOwnTurnSelfDamage(side = 0) {
  const st = battle && battle.leaders ? battle.leaders[side] : null;
  if (!st) return false;
  const all = [...(st.deck || []).map(x=>x.data), ...(st.hand || []).map(x=>x.data), ...(st.graveyard || []), ...battle.board[side].filter(Boolean).map(x=>x.data)];
  return all.some(cd => {
    if (!cd) return false;
    const t = String(cd.fullText || cd.text || '');
    return t.includes('自己的主战者造成') || t.includes('自己主战者造成') || t.includes('己方主战者造成') || ['cmwhm4gd57wh3','cmwhlefn11ybd','cmwgyxdbows5c','cmwgyxlefz8yz','cmwgdalzmzj83','cmwgyks2fu1p5'].includes(cd.id);
  });
}

function isSelfDamageCardData(cd) {
  if (!cd) return false;
  const t = String(cd.fullText || cd.text || '');
  return t.includes('自己的主战者造成') || t.includes('自己主战者造成') || t.includes('己方主战者造成')
    || ['cmwhm4gd57wh3','cmwhlefn11ybd','cmwgyxdbows5c','cmwgyxlefz8yz','cmwgdalzmzj83','cmwgyks2fu1p5'].includes(cd.id);
}

function hasPlayedSelfDamageCard(side = 0) {
  const st = battle && battle.leaders ? battle.leaders[side] : null;
  if (!st) return false;
  if ((st.totalSelfTurnDamageCount || 0) > 0 || (st.selfTurnDamageCount || 0) > 0) return true;
  return (st.playedCardsLog || []).some(isSelfDamageCardData);
}

function sideCarriesCounterCard(side, pred) {
  const st = battle && battle.leaders ? battle.leaders[side] : null;
  if (!st) return false;
  const all = [
    ...(st.deck || []).map(x => x && x.data),
    ...(st.hand || []).map(x => x && x.data),
    ...(st.graveyard || []),
    ...(battle.board && battle.board[side] ? battle.board[side].filter(Boolean).map(x => x.data) : [])
  ];
  return all.some(cd => cd && pred(cd, String(cd.fullText || cd.text || '')));
}

function collectDynamicCountersForSide(side) {
  const st = battle && battle.leaders ? battle.leaders[side] : null;
  if (!st) return [];
  const who = side === 0 ? '我方' : '敌方';
  const items = [];
  const carriesSelfDmg = sideCarriesCounterCard(side, (cd, t) => t.includes('受伤次数') || isSelfDamageCardData(cd));
  const carriesLastWords = sideCarriesCounterCard(side, (cd, t) => (t.includes('已破坏') && t.includes('谢幕曲')) || cd.id === 'cmwke7t3w6xig' || cd.id === 'cmwbyp6f419ju');
  const carriesGuardCnt = sideCarriesCounterCard(side, (cd, t) => t.includes('被破坏的守护随从') || cd.id === 'cmwllvy75f6bz');
  const carriesEnergySpent = sideCarriesCounterCard(side, (cd, t) => t.includes('消耗能量35以上') || t.includes('消耗能量30以上') || cd.id === 'cmwlp6mctrvla');

  if (carriesSelfDmg || hasPlayedSelfDamageCard(side)) {
    const tCnt = st.selfTurnDamageCount || 0;
    const totCnt = st.totalSelfTurnDamageCount || 0;
    items.push({
      key: 'selfDmg',
      icon: '🩸',
      label: `自残 本回${tCnt}·总${totCnt}`,
      tone: 'is-danger',
      title: `${who}自残次数`,
      value: `本回合 ${tCnt} 次 · 本局累计 ${totCnt} 次`,
      desc: '记录在自己回合内因自残效果受到伤害的次数。部分鲜血/自残流派卡牌会在本回合或本局自残达到指定次数后触发强化效果（如狂乱、额外召唤或直伤）。'
    });
  }
  if ((st.cardsPlayedThisTurn || 0) > 0) {
    items.push({
      key: 'combo',
      icon: '🔥',
      label: `连击 ${st.cardsPlayedThisTurn}`,
      tone: 'is-gold',
      title: `${who}本回合连击`,
      value: `本回合已使用 ${st.cardsPlayedThisTurn} 张卡牌`,
      desc: '统计当前回合已打出的卡牌总数。具有【连击_X】词条的卡牌在打出时若连击数达标，将自动触发额外强化效果。'
    });
  }
  if (carriesLastWords || (st.destroyedLastWordsCount || 0) > 0) {
    items.push({
      key: 'lastWords',
      icon: '💀',
      label: `谢幕 ${st.destroyedLastWordsCount}`,
      tone: '',
      title: `${who}已破坏谢幕曲`,
      value: `累计破坏 ${st.destroyedLastWordsCount} 个谢幕曲随从`,
      desc: '记录本局对战中被破坏且带有【谢幕曲】的随从数量。部分亡灵/谢幕曲体系核心牌会以此计数作为瞬念召唤或效果加成的条件。'
    });
  }
  if (carriesGuardCnt || (st.destroyedGuardCount || 0) > 0) {
    const gCnt = st.destroyedGuardCount || 0;
    items.push({
      key: 'guardDestroyed',
      icon: '🛡️',
      label: `破坏守护 ${gCnt}`,
      tone: gCnt >= 10 ? 'is-gold' : '',
      title: `${who}已破坏守护随从`,
      value: `本局累计破坏 ${gCnt} 个守护随从`,
      desc: '记录本局对战中己方被破坏且带有【守护】词条的随从总数（如【圣骑兵招募】达 10 以上可额外抽 2 张牌）。'
    });
  }
  if (carriesEnergySpent) {
    const eTot = st.energySpentTotal || 0;
    items.push({
      key: 'energySpent',
      icon: '⚡',
      label: `耗能 ${eTot}/35`,
      tone: eTot >= 35 ? 'is-gold' : '',
      title: `${who}累计消耗能量`,
      value: `本局已消耗 ${eTot} 点能量`,
      desc: '记录本局对战累计消耗的能量点数（用于触发【机械降神】的瞬念召唤条件：35 以上）。'
    });
  }
  if ((st.nextMechDiscount || 0) > 0) {
    items.push({
      key: 'mechDiscount',
      icon: '🐞',
      label: `机械-${st.nextMechDiscount}费`,
      tone: 'is-gold',
      title: `${who}机械减费`,
      value: `下张机械卡能量消耗 -${st.nextMechDiscount}`,
      desc: '由铜壳瓢虫等卡牌提供的临时减费效果，打出下一张机械牌时会自动抵扣对应能量点数。'
    });
  }
  if ((st.werewolfPlayedCount || 0) > 0) {
    items.push({
      key: 'werewolf',
      icon: '🐺',
      label: `狼人 ${st.werewolfPlayedCount}`,
      tone: '',
      title: `${who}狼人使用次数`,
      value: `本局累计使用 ${st.werewolfPlayedCount} 次`,
      desc: '记录本局对战中打出的狼人卡牌次数，用于触发狼人体系的协同成长与终结技。'
    });
  }
  if ((st.delayedSelfDmgBats || 0) > 0 || (st.delayedSelfDmgDraws || 0) > 0 || (st.delayedMechDraws || 0) > 0) {
    const parts = [];
    if (st.delayedSelfDmgBats) parts.push(`蝙蝠×${st.delayedSelfDmgBats}`);
    if (st.delayedSelfDmgDraws) parts.push(`自残抽牌×${st.delayedSelfDmgDraws}`);
    if (st.delayedMechDraws) parts.push(`机械检索×${st.delayedMechDraws}`);
    items.push({
      key: 'delayed',
      icon: '⏳',
      label: `预约 ${parts.join(' ')}`,
      tone: '',
      title: `${who}下回合延迟预约`,
      value: parts.join(' · '),
      desc: '已触发并在下回合开始时自动兑现的延迟效果（如预约召唤蝙蝠或下回合检索机械随从）。'
    });
  }
  if ((st.fatigueCount || 0) > 0) {
    items.push({
      key: 'fatigue',
      icon: '⚠️',
      label: `疲劳 ${st.fatigueCount}`,
      tone: 'is-danger',
      title: `${who}牌库枯竭疲劳`,
      value: `已触发 ${st.fatigueCount} 层疲劳伤害`,
      desc: '牌库为空时每次抽牌都会叠加 1 层疲劳，并对主战者造成等同于当前疲劳层数的伤害。'
    });
  }
  return items;
}

function showCounterInfoPopover(anchorEl, item) {
  const pop = document.getElementById('counterInfoPopover');
  if (!pop || !anchorEl || !item) return;
  document.getElementById('counterInfoTitle').textContent = `${item.icon} ${item.title}`;
  document.getElementById('counterInfoValue').textContent = item.value;
  document.getElementById('counterInfoDesc').textContent = item.desc;
  pop.classList.remove('hidden');
  const r = anchorEl.getBoundingClientRect();
  const pw = Math.min(270, window.innerWidth * 0.85);
  const left = Math.max(10, Math.min(window.innerWidth - pw - 10, r.left));
  const top = r.top > window.innerHeight * 0.5 ? Math.max(12, r.top - 135) : Math.min(window.innerHeight - 150, r.bottom + 8);
  pop.style.left = `${left}px`;
  pop.style.top = `${top}px`;
}

document.getElementById('btnCloseCounterInfo')?.addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('counterInfoPopover')?.classList.add('hidden');
});
window.addEventListener('mousedown', (e) => {
  if (!e.target.closest('#counterInfoPopover') && !e.target.closest('.sv-dyn-counter-chip')) {
    document.getElementById('counterInfoPopover')?.classList.add('hidden');
  }
});

function renderDynamicCounterRow(rowId, side) {
  const row = document.getElementById(rowId);
  if (!row) return;
  const items = collectDynamicCountersForSide(side);
  const sig = items.map(it => `${it.key}:${it.label}`).join('|');
  if (row.dataset.counterSig === sig) return;
  row.dataset.counterSig = sig;
  row.innerHTML = '';
  items.forEach(it => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `sv-dyn-counter-chip ${side === 1 ? 'is-enemy' : ''} ${it.tone}`.trim();
    chip.textContent = `${it.icon} ${it.label}`;
    chip.title = `点击查看【${it.title}】说明`;
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      sfx.play('click');
      showCounterInfoPopover(chip, it);
    });
    row.appendChild(chip);
  });
}

function updateSelfDmgHudBadge() {
  renderDynamicCounterRow('playerDynamicCountersRow', 0);
  renderDynamicCounterRow('enemyDynamicCountersRow', 1);
}

let activeBattleRecordTab = 'cards';
let activeBattleRecordSort = 'value'; // 'value' (默认价值↑) | 'energy' (能量↑)

function aggregateCardsForRecord(cardDataArray, sortMode = 'value') {
  const map = new Map();
  (cardDataArray || []).forEach(cd => {
    if (!cd) return;
    const prev = map.get(cd.id);
    if (prev) prev.count += 1;
    else map.set(cd.id, { card: cd, count: 1 });
  });
  return Array.from(map.values()).sort((a, b) => {
    const va = typeof getCardCostValue === 'function' ? getCardCostValue(a.card) : (a.card.energy || 0);
    const vb = typeof getCardCostValue === 'function' ? getCardCostValue(b.card) : (b.card.energy || 0);
    const ea = a.card.energy || 0;
    const eb = b.card.energy || 0;
    if (sortMode === 'energy') {
      if (ea !== eb) return ea - eb;
      if (va !== vb) return va - vb;
    } else {
      if (va !== vb) return va - vb;
      if (ea !== eb) return ea - eb;
    }
    return String(a.card.name || '').localeCompare(String(b.card.name || ''));
  });
}

function renderBattleRecordPanel() {
  const panel = document.getElementById('battleRecordPanel');
  if (!panel || !battle.leaders[0] || !battle.leaders[1]) return;
  const st = battle.leaders[activeBattleLogSide];

  const playedGroups = aggregateCardsForRecord(st.playedCardsLog, activeBattleRecordSort);
  const destroyedGroups = aggregateCardsForRecord(st.graveyard, activeBattleRecordSort);

  const sortLbl = activeBattleRecordSort === 'energy' ? '能量↑' : '价值↑';
  const sortTitleEl = document.getElementById('logPlayedSortTitle');
  if (sortTitleEl) sortTitleEl.textContent = `✨ 已使用 (${sortLbl})`;
  document.getElementById('logPlayedTotalBadge').textContent = `共 ${(st.playedCardsLog || []).length} 张`;
  document.getElementById('logDestroyedTotalBadge').textContent = `共 ${(st.graveyard || []).length} 张`;

  const pSt = battle.leaders[0];
  const eSt = battle.leaders[1];
  const statsView = document.getElementById('battleRecordStatsView');
  if (statsView) {
    const rows = [
      ['❤️ 主战者生命值', `${pSt.hp} / ${pSt.maxHp}`, `${eSt.hp} / ${eSt.maxHp}`],
      ['⚡ 当前 / 最大能量', `${pSt.energy} / ${pSt.maxEnergy}`, `${eSt.energy} / ${eSt.maxEnergy}`],
      ['🦴 当前骨头储备', pSt.bones || 0, eSt.bones || 0],
      ['🔥 本回合连击数', pSt.cardsPlayedThisTurn || 0, eSt.cardsPlayedThisTurn || 0],
      ['💀 已破坏谢幕曲数', pSt.destroyedLastWordsCount || 0, eSt.destroyedLastWordsCount || 0],
      ['🛡️ 已破坏守护随从', pSt.destroyedGuardCount || 0, eSt.destroyedGuardCount || 0],
      ['🩸 本回合 / 本局自残', `${pSt.selfTurnDamageCount || 0} / ${pSt.totalSelfTurnDamageCount || 0}`, `${eSt.selfTurnDamageCount || 0} / ${eSt.totalSelfTurnDamageCount || 0}`],
      ['💠 当前拥有纹章数', (pSt.crests || []).length, (eSt.crests || []).length],
      ['🃏 手牌 / 剩余牌库', `${(pSt.hand||[]).length} / ${(pSt.deck||[]).length}`, `${(eSt.hand||[]).length} / ${(eSt.deck||[]).length}`],
      ['🪦 墓场 / 疲劳层数', `${(pSt.graveyard||[]).length} / ${pSt.fatigueCount||0}`, `${(eSt.graveyard||[]).length} / ${eSt.fatigueCount||0}`]
    ];
    statsView.innerHTML = `
      <div class="grid grid-cols-3 gap-1.5 text-[11px] font-black text-slate-400 px-2.5 pb-1.5 border-b border-slate-800">
        <span>统计项目</span><span class="text-center text-cyan-300">🛡️ 我方</span><span class="text-center text-rose-300">⚔️ 敌方</span>
      </div>
      ${rows.map(([lbl, pv, ev]) => `
        <div class="grid grid-cols-3 gap-1.5 items-center bg-slate-900/95 border border-slate-800/90 rounded-xl px-2.5 py-2 text-xs shadow-sm">
          <span class="font-bold text-slate-200 truncate" title="${lbl}">${lbl}</span>
          <span class="text-center font-black text-cyan-200 text-sm">${pv}</span>
          <span class="text-center font-black text-rose-200 text-sm">${ev}</span>
        </div>
      `).join('')}
    `;
  }

  const turnsView = document.getElementById('battleRecordTurnsView');
  if (turnsView) {
    const logs = battle.turnLogs || [];
    if (logs.length === 0) {
      turnsView.innerHTML = `<div class="text-xs text-slate-500 text-center py-10">暂无回合战报记录，开始出牌后将在此记录每回合详情</div>`;
    } else {
      turnsView.innerHTML = '';
      turnsView.style.display = 'flex';
      turnsView.style.flexDirection = 'column';
      turnsView.style.gap = '8px';
      turnsView.style.overflow = 'hidden';

      const lastGrp = logs[logs.length - 1];
      const sliderBar = document.createElement('div');
      sliderBar.className = 'shrink-0 bg-slate-900/95 border border-cyan-500/40 rounded-xl px-3 py-2 flex items-center gap-2.5';
      sliderBar.innerHTML = `
        <span class="text-[11px] font-black text-cyan-300 shrink-0">⏩ 回合跳转</span>
        <input id="turnLogSlider" type="range" min="0" max="${logs.length - 1}" value="${logs.length - 1}" class="flex-1 accent-amber-400 cursor-pointer">
        <span id="turnLogSliderLabel" class="text-[11px] font-black text-amber-300 shrink-0 min-w-[82px] text-right">${lastGrp.side === 0 ? '我方' : '敌方'}·R${lastGrp.turn} (最新)</span>
      `;
      turnsView.appendChild(sliderBar);

      const scrollArea = document.createElement('div');
      scrollArea.id = 'turnLogScrollArea';
      scrollArea.className = 'flex-1 overflow-y-auto space-y-2.5 pr-1';

      logs.forEach((grp, idx) => {
        const isP = grp.side === 0;
        const box = document.createElement('div');
        box.id = `turnLogGroup_${idx}`;
        box.className = `rounded-xl border ${isP ? 'border-cyan-500/45 bg-cyan-950/20' : 'border-rose-500/45 bg-rose-950/20'} p-2.5 space-y-1.5`;
        box.innerHTML = `
          <div class="flex items-center justify-between border-b border-slate-800/80 pb-1">
            <span class="text-xs font-black ${isP ? 'text-cyan-300' : 'text-rose-300'}">${isP ? '🛡️ 我方回合' : '⚔️ 敌方回合'} · 第 ${grp.turn} 回合</span>
            <span class="text-[10px] text-slate-400">${grp.events.length} 条记录</span>
          </div>
        `;
        const evWrap = document.createElement('div');
        evWrap.className = 'space-y-1';
        grp.events.forEach(ev => {
          const item = document.createElement('div');
          const tagCol = ev.kind === 'play' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            : (ev.kind === 'attack' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            : (ev.kind === 'turn' ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-indigo-500/20 text-indigo-200 border-indigo-500/40'));
          const tagTxt = ev.kind === 'play' ? '出牌' : (ev.kind === 'attack' ? '攻击' : (ev.kind === 'turn' ? '回合' : '效果'));
          item.className = 'flex items-start gap-1.5 text-[11px] leading-snug bg-slate-950/75 rounded-lg px-2 py-1 border border-slate-800/70';
          item.innerHTML = `
            <span class="px-1.5 py-0.5 rounded border text-[9px] font-black shrink-0 ${tagCol}">${tagTxt}</span>
            <div class="min-w-0 flex-1 text-slate-200">
              ${ev.cardName ? `<b class="text-amber-300 cursor-pointer hover:underline mr-1">${ev.cardName}</b>` : ''}
              <span>${ev.text}</span>
            </div>
          `;
          if (ev.cardId && cardsById[ev.cardId]) {
            const bEl = item.querySelector('b');
            if (bEl) {
              bEl.onclick = (e) => {
                e.stopPropagation();
                const cd = cardsById[ev.cardId];
                openCardDetailPanel({ data: cd, currentAtk: cd.atk, currentHp: cd.hp, maxHp: cd.hp, owner: grp.side, activeKw: {}, grantedEffects: [], extraLastWords: [] }, 'log', grp.side, -1, item);
              };
            }
          }
          evWrap.appendChild(item);
        });
        box.appendChild(evWrap);
        scrollArea.appendChild(box);
      });

      turnsView.appendChild(scrollArea);
      const sliderEl = sliderBar.querySelector('#turnLogSlider');
      const lblEl = sliderBar.querySelector('#turnLogSliderLabel');
      if (sliderEl) {
        sliderEl.addEventListener('input', (e) => {
          e.stopPropagation();
          const idx = parseInt(sliderEl.value, 10) || 0;
          const g = logs[idx];
          if (g && lblEl) {
            lblEl.textContent = `${g.side === 0 ? '我方' : '敌方'}·R${g.turn}${idx === logs.length - 1 ? ' (最新)' : ''}`;
          }
          const targetBox = document.getElementById(`turnLogGroup_${idx}`);
          if (targetBox && targetBox.scrollIntoView) {
            targetBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      }
      setTimeout(() => {
        scrollArea.scrollTop = scrollArea.scrollHeight;
      }, 0);
    }
  }

  const pBox = document.getElementById('logPlayedList');
  const dBox = document.getElementById('logDestroyedList');
  pBox.innerHTML = '';
  dBox.innerHTML = '';

  const renderCardRow = (card, count, isGrave) => {
    const val = typeof getCardCostValue === 'function' ? getCardCostValue(card) : (card.energy || 0);
    const hasLW = (card.keywords || []).some(k => k.k === '谢幕曲') || String(card.fullText || '').includes('谢幕曲');
    const row = document.createElement('div');
    row.className = 'flex items-center justify-between gap-1 bg-slate-950/90 hover:bg-slate-800 border border-slate-800 rounded-lg px-2 py-1.5 text-xs cursor-pointer transition';
    row.innerHTML = `
      <div class="flex items-center gap-1.5 min-w-0 flex-1">
        <span class="w-5 h-5 rounded-full ${isGrave ? 'bg-rose-800' : 'bg-emerald-600'} text-white font-black flex items-center justify-center text-[10px] shrink-0" title="能量费用">${card.energy}</span>
        <span class="font-bold text-slate-100 truncate">${card.name}</span>
        ${isGrave && hasLW ? `<span class="text-[10px]" title="含有谢幕曲">💀</span>` : ''}
      </div>
      <div class="flex items-center gap-1 shrink-0">
        <span class="px-1 py-0.5 rounded bg-slate-800 text-amber-300 font-bold text-[9px]" title="综合价值">💎${val}</span>
        <span class="px-1.5 py-0.5 rounded ${isGrave ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'} font-black text-[10px]">×${count}</span>
      </div>
    `;
    row.addEventListener('click', (e) => {
      e.stopPropagation();
      sfx.play('click');
      openCardDetailPanel({ data: card, currentAtk: card.atk, currentHp: card.hp, maxHp: card.hp, owner: activeBattleLogSide, activeKw: {}, grantedEffects: [], extraLastWords: [] }, 'log', activeBattleLogSide, -1, row);
    });
    return row;
  };

  if (playedGroups.length === 0) {
    pBox.innerHTML = `<div class="text-[11px] text-slate-500 text-center py-6">本局尚未使用卡牌</div>`;
  } else {
    playedGroups.forEach(({ card, count }) => pBox.appendChild(renderCardRow(card, count, false)));
  }

  if (destroyedGroups.length === 0) {
    dBox.innerHTML = `<div class="text-[11px] text-slate-500 text-center py-6">尚无被破坏的随从</div>`;
  } else {
    destroyedGroups.forEach(({ card, count }) => dBox.appendChild(renderCardRow(card, count, true)));
  }
}

document.getElementById('btnToggleBattleLog')?.addEventListener('click', (e) => {
  e.stopPropagation();
  sfx.play('click');
  const p = document.getElementById('battleRecordPanel');
  p.classList.toggle('hidden');
  // 规则：「卡牌详细面板打开时如果打开了战局记录，将详细面板关闭」
  battle.inspectedCard = null;
  document.getElementById('svDetailPanel').classList.add('hidden'); document.querySelectorAll('#playerHandZone .sv-hand-card.is-inspected').forEach(el => el.classList.remove('is-inspected')); if (typeof syncDetailSelectionHighlight === 'function') syncDetailSelectionHighlight();
  if (!p.classList.contains('hidden')) renderBattleRecordPanel();
});

document.getElementById('btnCloseBattleLog')?.addEventListener('click', (e) => {
  e.stopPropagation();
  sfx.play('click');
  document.getElementById('battleRecordPanel').classList.add('hidden');
});

function switchBattleRecordTab(tab) {
  activeBattleRecordTab = tab;
  document.getElementById('battleRecordCardsView')?.classList.toggle('hidden', tab !== 'cards');
  document.getElementById('battleRecordStatsView')?.classList.toggle('hidden', tab !== 'stats');
  document.getElementById('battleRecordTurnsView')?.classList.toggle('hidden', tab !== 'turns');
  const activeCls = 'flex-1 py-1.5 rounded-lg text-xs font-black bg-amber-400 text-slate-950 transition';
  const idleCls = 'flex-1 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 hover:text-white transition';
  if (document.getElementById('tabLogViewCards')) document.getElementById('tabLogViewCards').className = tab === 'cards' ? activeCls : idleCls;
  if (document.getElementById('tabLogViewStats')) document.getElementById('tabLogViewStats').className = tab === 'stats' ? activeCls : idleCls;
  if (document.getElementById('tabLogViewTurns')) document.getElementById('tabLogViewTurns').className = tab === 'turns' ? activeCls : idleCls;
  renderBattleRecordPanel();
}

document.getElementById('tabLogViewCards')?.addEventListener('click', (e) => { e.stopPropagation(); sfx.play('click'); switchBattleRecordTab('cards'); });
document.getElementById('tabLogViewStats')?.addEventListener('click', (e) => { e.stopPropagation(); sfx.play('click'); switchBattleRecordTab('stats'); });
document.getElementById('tabLogViewTurns')?.addEventListener('click', (e) => { e.stopPropagation(); sfx.play('click'); switchBattleRecordTab('turns'); });

document.getElementById('btnLogSortValue')?.addEventListener('click', (e) => {
  e.stopPropagation();
  sfx.play('click');
  activeBattleRecordSort = 'value';
  document.getElementById('btnLogSortValue').className = 'px-2 py-1 rounded-lg text-[11px] font-black bg-emerald-500 text-slate-950 transition';
  document.getElementById('btnLogSortEnergy').className = 'px-2 py-1 rounded-lg text-[11px] font-bold bg-slate-800 text-slate-300 hover:text-white transition';
  renderBattleRecordPanel();
});
document.getElementById('btnLogSortEnergy')?.addEventListener('click', (e) => {
  e.stopPropagation();
  sfx.play('click');
  activeBattleRecordSort = 'energy';
  document.getElementById('btnLogSortEnergy').className = 'px-2 py-1 rounded-lg text-[11px] font-black bg-emerald-500 text-slate-950 transition';
  document.getElementById('btnLogSortValue').className = 'px-2 py-1 rounded-lg text-[11px] font-bold bg-slate-800 text-slate-300 hover:text-white transition';
  renderBattleRecordPanel();
});

document.getElementById('tabLogPlayer')?.addEventListener('click', (e) => {
  e.stopPropagation();
  sfx.play('click');
  activeBattleLogSide = 0;
  document.getElementById('tabLogPlayer').className = 'flex-1 py-1.5 rounded-lg text-xs font-black bg-cyan-500 text-slate-950 transition';
  document.getElementById('tabLogEnemy').className = 'flex-1 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 hover:text-white transition';
  renderBattleRecordPanel();
});

document.getElementById('tabLogEnemy')?.addEventListener('click', (e) => {
  e.stopPropagation();
  sfx.play('click');
  activeBattleLogSide = 1;
  document.getElementById('tabLogEnemy').className = 'flex-1 py-1.5 rounded-lg text-xs font-black bg-rose-500 text-white transition';
  document.getElementById('tabLogPlayer').className = 'flex-1 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 hover:text-white transition';
  renderBattleRecordPanel();
});

