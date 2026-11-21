function addBones(side, amount) {
  if (amount <= 0) return;
  battle.leaders[side].bones += amount;
  spawnFloatNumber(side, -1, `🦴+${amount}`, '#fde047');
}

async function placeMinionOnBoardAnimated(side, inst, lane, deferEnterPassives = false) {
  if (inst.data.rarity === '传说') {
    inst.justEnteredLegendVfx = true;
    sfx.play('legend');
  } else {
    sfx.play('play');
  }
  globalEnterSeq += 1;
  inst.enterOrder = globalEnterSeq;
  inst.attackedThisTurn = false;
  battle.board[side][lane] = inst;
  renderAllBattleUI();
  {
    const pCell = getLaneDOM(side, lane);
    if (pCell && pCell.firstElementChild) {
      pCell.firstElementChild.classList.add('sv-card-place-vfx');
      setTimeout(() => pCell.firstElementChild?.classList.remove('sv-card-place-vfx'), 450);
    }
  }
  if (inst.data.type === 'minion') {
    playMinionEnterVfx(side, lane, inst);            /* v1.3：所有随从统一进场特效 */
    spawnFloatNumber(side, lane, inst.data.rarity === '传说' ? '🌟传说降临' : '✨登场', '#fde047');
  } else {
    playCardEnterVFX(side, lane, inst.data.rarity, inst.data.type);
    spawnFloatNumber(side, lane, inst.data.type === 'amulet' ? '⛩️护符展开' : '✨登场', '#fde047');
  }
  const _enterFullTxt = String(inst.data.fullText || inst.data.text || '').trim();
  const _hasExplicitEnter = _enterFullTxt.includes('【入场曲】') || _enterFullTxt.includes('【随从进场时】');
  if (_enterFullTxt && !_hasExplicitEnter && (inst.countdown > 0 || inst.data.type === 'amulet' || _enterFullTxt.includes('【倒计时') || _enterFullTxt.includes('每当') || _enterFullTxt.includes('回合结束时') || _enterFullTxt.includes('伤害转移') || _enterFullTxt.includes('无敌'))) {
    const _shortTxt = _enterFullTxt.length > 56 ? (_enterFullTxt.slice(0, 56) + '…') : _enterFullTxt;
    showTriggeredEffectToast(inst.data, _shortTxt, 0);
  }
  await sleep(inst.data.rarity === '传说' ? 460 : 240);
  inst.justEnteredLegendVfx = false;

  if (deferEnterPassives) return;
  await runBoardContinuousEnterPassives(side, inst, lane);
}

async function runBoardContinuousEnterPassives(side, inst, lane) {
  if (!inst || battle.board[side][lane] !== inst || battle.gameOver) return;
  await triggerBoardEnterPassivesAnimated(side, inst, lane, 0);
  // 招魂的术士 / 灵魂雕塑家：亡灵或怨灵进入己方战场时获得毁灭
  if (inst.data.type === 'minion' && hasRace(inst.data, '亡灵')) {
    for (let l = 0; l < 5; l++) {
      const nec = battle.board[side][l];
      if (!nec || nec === inst) continue;
      if (nec.data.id === 'cmwgccmsj2ypl' || (nec.data.id === 'cmwgchn8wmoi5' && inst.data.id === 'cmwfdja9sjiuf')) {
        if (!inst.activeKw['毁灭']) {
          inst.activeKw['毁灭'] = 1;
          addGrantedEffect(inst, `来源：【${nec.data.name}】 → 获得【毁灭】`);
          spawnFloatNumber(side, lane, '☠️毁灭', '#a855f7');
          renderAllBattleUI();
        }
      }
    }
  }

  // 蝙蝠女王：每当蝙蝠进入自己战场时，使其获得【毁灭】
  if (inst.data.type === 'minion' && inst.data.name === '蝙蝠') {
    for (let l = 0; l < 5; l++) {
      const q = battle.board[side][l];
      if (q && q !== inst && q.data.id === 'cmwgyyghnbr4n') {
        if (!inst.activeKw['毁灭']) {
          inst.activeKw['毁灭'] = 1;
          addGrantedEffect(inst, '来源：【蝙蝠女王】 → 获得【毁灭】');
          spawnFloatNumber(side, lane, '☠️毁灭', '#a855f7');
          renderAllBattleUI();
        }
        break;
      }
    }
  }

  // 猎魄师：每当亡灵随从进入己方战场时，使其破坏，并使本随从获得+2/+2
  if (inst.data.type === 'minion' && hasRace(inst.data, '亡灵')) {
    for (let l = 0; l < 5; l++) {
      const hunter = battle.board[side][l];
      if (hunter && hunter !== inst && hunter.data.id === 'cmwfgsh29e6k1') {
        await showTriggeredEffectToast(hunter.data, `亡灵随从『${inst.data.name}』进场，使其破坏并自身获得+2/+2！`, 240);
        await destroyMinionAnimated(side, lane, false);
        if (battle.board[side][l] === hunter) {
          hunter.currentAtk += 2;
          hunter.maxHp += 2;
          hunter.currentHp += 2;
          addGrantedEffect(hunter, `来源：【猎魄师】 → 获得 +2/+2`);
          spawnFloatNumber(side, l, '+2/+2', '#fde047');
          renderAllBattleUI();
        }
        if (battle.board[side][lane] !== inst) return;
      }
    }
  }

  // 摇滚骷髅乐团主唱：当具有谢幕曲的随从进入自己战场时，将其破坏，并使自己所有随从获得+1/+1
  if (inst.data.type === 'minion' && hasAnyLastWords(inst)) {
    for (let l = 0; l < 5; l++) {
      const singer = battle.board[side][l];
      if (singer && singer !== inst && singer.data.id === 'cmwghmf9xj9dv' && battle.board[side][lane] === inst) {
        await showTriggeredEffectToast(singer.data, `谢幕曲随从『${inst.data.name}』进场，将其破坏并使己方全体随从+1/+1！`, 240);
        await playSynergyBeam(getLaneDOM(side, l), getLaneDOM(side, lane), '#f43f5e', 220);
        await destroyMinionAnimated(side, lane, false);
        for (let fl = 0; fl < 5; fl++) {
          const fm = battle.board[side][fl];
          if (fm && fm.data.type === 'minion') {
            fm.currentAtk += 1; fm.currentHp += 1; fm.maxHp += 1;
            addGrantedEffect(fm, '来源：【摇滚骷髅乐团主唱】 → 谢幕曲随从进场 +1/+1');
            await playSynergyBeam(getLaneDOM(side, l), getLaneDOM(side, fl), '#4ade80', 140);
            spawnFloatNumber(side, fl, '+1/+1', '#4ade80');
          }
        }
        renderAllBattleUI();
        return;
      }
    }
  }

  // 地狱三头犬：随从进场时召唤2个同名随从；若本局破坏谢幕曲>10，依次赋予毁灭、虹吸、荆棘5
  if (inst.data.id === 'cmwgdqawegvy3' && !inst._cerberusSpawned && battle.board[side][lane] === inst) {
    inst._cerberusSpawned = true;
    const spawned = [inst];
    for (let k = 0; k < 2; k++) {
      const el = findNextSummonLane(side, lane, false);
      if (el === -1) break;
      const copy = createCardInstance('cmwgdqawegvy3', side);
      copy._cerberusSpawned = true;
      await placeMinionOnBoardAnimated(side, copy, el);
      spawned.push(copy);
    }
    if (hasReachedLastWordsThreshold(side, 10)) {
      const kws = [['毁灭', 1], ['虹吸', 1], ['荆棘', 5]];
      spawned.forEach((dog, idx) => {
        if (idx < kws.length) {
          dog.activeKw[kws[idx][0]] = kws[idx][1];
          addGrantedEffect(dog, `来源：【地狱三头犬】 → 获得【${kws[idx][0]}${kws[idx][1] > 1 ? '_' + kws[idx][1] : ''}】`);
        }
      });
      await showTriggeredEffectToast(inst.data, '已破坏10个以上谢幕曲随从：3只『地狱三头犬』分别获得【毁灭】【虹吸】【荆棘_5】！', 280);
      renderAllBattleUI();
    }
  }

  // 狼少女：随从进场时对双方主战者造成1点伤害
  if (inst.data.id === 'cmwgepbm7hzy9' && battle.board[side][lane] === inst) {
    await showTriggeredEffectToast(inst.data, '【随从进场时】对双方主战者造成1点伤害！', 220);
    await dealDamageToLeaderAnimated(0, 1, inst);
    if (!battle.gameOver) await dealDamageToLeaderAnimated(1, 1, inst);
  }

  // 怨灵（新版）：随从进场时立刻攻击并消失
  if (inst.data.id === 'cmwfdja9sjiuf' && battle.board[side][lane] === inst && !battle.gameOver) {
    await showTriggeredEffectToast(inst.data, '【随从进场时】『怨灵』立刻发起攻击并【消失】！', 220);
    await performMinionCombatAnimated(side, lane);
    const curL = battle.board[side].indexOf(inst);
    if (!battle.gameOver && curL !== -1) {
      await banishMinionAnimated(side, curL);
    }
  }
}

function findNextSummonLane(side, sourceLane = -1, preferExact = false) {
  if (sourceLane >= 0 && sourceLane < 5) {
    if (battle.board[side][sourceLane] === null) return sourceLane;
    // 右侧紧邻格为空时优先向右生成；若右侧有阻挡或已到右边界，优先尝试反方向（左侧），再从左到右找空位
    if (sourceLane + 1 < 5 && battle.board[side][sourceLane + 1] === null) {
      return sourceLane + 1;
    }
    for (let l = sourceLane - 1; l >= 0; l--) {
      if (battle.board[side][l] === null) return l;
    }
    for (let l = 0; l < 5; l++) {
      if (battle.board[side][l] === null) return l;
    }
    return -1;
  }
  return findFirstEmptyLane(side);
}

function playBanishVoidSVG(targetEl) {
  if (!targetEl) return;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 120 120');
  svg.className = 'absolute inset-0 w-full h-full pointer-events-none z-40';
  svg.innerHTML = `
    <defs>
      <radialGradient id="voidGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#f5d0fe" stop-opacity="0.95"/>
        <stop offset="45%" stop-color="#a855f7" stop-opacity="0.75"/>
        <stop offset="100%" stop-color="#3b0764" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <circle cx="60" cy="60" r="46" fill="url(#voidGrad)">
      <animate attributeName="r" values="48;10;2" dur="0.42s" fill="freeze"/>
      <animate attributeName="opacity" values="0.95;1;0" dur="0.42s" fill="freeze"/>
    </circle>
    <circle cx="60" cy="60" r="38" fill="none" stroke="#e879f9" stroke-width="3" stroke-dasharray="14 8">
      <animateTransform attributeName="transform" type="rotate" from="0 60 60" to="160 60 60" dur="0.42s" fill="freeze"/>
      <animate attributeName="r" values="42;6" dur="0.42s" fill="freeze"/>
      <animate attributeName="opacity" values="1;0" dur="0.42s" fill="freeze"/>
    </circle>
    <path d="M22 60 Q60 36 98 60 Q60 84 22 60 Z" fill="none" stroke="#fde047" stroke-width="2" opacity="0.85">
      <animate attributeName="opacity" values="0.9;0" dur="0.38s" fill="freeze"/>
    </path>
  `;
  targetEl.appendChild(svg);
  setTimeout(() => svg.remove(), 460);
}

function hasGuardianKeyword(cd) {
  if (!cd) return false;
  return (cd.keywords || []).some(k => k.k === '守护') || String(cd.fullText || '').includes('守护');
}

async function triggerMinionLeftBoardPassives(side, inst) {
  if (!inst || !inst.data || battle.gameOver) return;
  if (inst.data.id === 'cmwhpxeundtos') {
    await showTriggeredEffectToast(inst.data, '【随从离场时】『胜利天使』获得【纹章：胜利天使】(倒计时2)！', 240);
    await grantLeaderCrest(side, {
      id: 'crest_victory_angel',
      name: '纹章：胜利天使',
      countdown: 2,
      desc: '纹章破坏时，召唤1个『胜利天使』到自己战场上，并使其获得【飞行】。',
      cardData: inst.data
    });
  }
}

async function triggerFriendlyMinionBanishedPassives(side, banishedInst, isOverflow = false) {
  if (!banishedInst || !banishedInst.data || banishedInst.data.type !== 'minion' || battle.gameOver) return;
  if (banishedInst.data.id !== 'cmwgcjgs4885x') {
    for (let l = 0; l < 5; l++) {
      const sc = battle.board[side][l];
      if (sc && sc.data.id === 'cmwgchn8wmoi5') {
        await showTriggeredEffectToast(sc.data, '己方随从消失：召唤1个『持盾的骷髅士兵』！', 240);
        await summonByNameAnimated(side, '持盾的骷髅士兵', 1, l, false, sc.data.name);
        break;
      }
    }
  }
  for (let l = 0; l < 5; l++) {
    const gen = battle.board[side][l];
    if (gen && gen.data.id === 'cmwgxtqho266t') {
      await showTriggeredEffectToast(gen.data, `${isOverflow ? '满场溢出' : '己方'}随从消失：『鬼火将军』使己方全体随从获得 +1/+1！`, 220);
      await playRowWideVFX(side, 'buff_wave', 240);
      for (let fl = 0; fl < 5; fl++) {
        const fm = battle.board[side][fl];
        if (fm && fm.data.type === 'minion') {
          fm.currentAtk += 1; fm.currentHp += 1; fm.maxHp += 1;
          addGrantedEffect(fm, '来源：【鬼火将军】 → 己方随从消失 +1/+1');
          spawnFloatNumber(side, fl, '+1/+1', '#4ade80');
        }
      }
      renderAllBattleUI();
    }
  }
  for (let l = 0; l < 5; l++) {
    const pGen = battle.board[side][l];
    if (pGen && pGen.data.id === 'cmwhq3vyptao6') {
      const otherLanes = [0,1,2,3,4].filter(fl => fl !== l && battle.board[side][fl] && battle.board[side][fl].data.type === 'minion');
      if (otherLanes.length > 0) {
        await showTriggeredEffectToast(pGen.data, '己方随从消失：『圣骑将军』使除自己外所有己方随从变身为价值+1的随从并获得【守护】！', 240);
        for (const fl of otherLanes) {
          const fm = battle.board[side][fl];
          if (!fm) continue;
          const tVal = Math.round(getCardCostValue(fm.data) + 1);
          let cands = allCards.filter(cd => cd.type === 'minion' && Math.round(getCardCostValue(cd)) === tVal);
          if (cands.length === 0) cands = allCards.filter(cd => cd.type === 'minion' && getCardCostValue(cd) >= tVal);
          if (cands.length > 0) {
            const pick = cands[Math.floor(Math.random() * cands.length)];
            await transformBoardCardAnimated(side, fl, pick.id, pGen.data.name, 0);
            const newM = battle.board[side][fl];
            if (newM && newM.data.type === 'minion') {
              newM.activeKw['守护'] = 1;
              addGrantedEffect(newM, '来源：【圣骑将军】 → 获得【守护】');
              spawnFloatNumber(side, fl, '🛡️守护', '#38bdf8');
            }
          }
        }
        renderAllBattleUI();
      }
    }
  }
}


/* ===== 随从进场特效（v1.3）：每个随从入场都会播一次，按稀有度/种族分层 ===== */
function cfEnterColor(inst) {
  const race = String((inst && inst.data && inst.data.race) || '');
  const map = [['机械', '#38bdf8'], ['龙族', '#fbbf24'], ['亡灵', '#a855f7'], ['神圣', '#fde68a'],
               ['恶魔', '#f43f5e'], ['兽人', '#a3e635'], ['精灵', '#34d399'], ['不死', '#c084fc']];
  for (const [k, v] of map) { if (race.includes(k)) return v; }
  return '#34d399';
}
function playMinionEnterVfx(side, lane, inst) {
  try {
    const cell = getLaneDOM(side, lane);
    const svg = document.getElementById('fxSvgOverlay');
    if (!cell || !svg || !inst || !inst.data) return;
    const card = cell.firstElementChild;
    if (card) {
      card.classList.remove('cf-enter-pop');
      void card.offsetWidth;                 /* 强制重排，保证重复入场也能重播 */
      card.classList.add('cf-enter-pop');
      setTimeout(() => card.classList.remove('cf-enter-pop'), 560);
    }
    const r = cell.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const col = cfEnterColor(inst);
    const rar = inst.data.rarity || '普通';
    let extra = '';
    if (rar === '传说') {
      extra += `<circle class="cf-e-pillar" cx="${cx}" cy="${cy}" r="${r.width * 0.66}" fill="${col}" fill-opacity="0.12"/>`;
    }
    if (rar === '史诗' || rar === '传说') {
      extra += `<circle class="cf-e-rune" cx="${cx}" cy="${cy}" r="${r.width * 0.46}" fill="none" stroke="${col}" stroke-width="2" stroke-dasharray="7 9" opacity="0.9"/>`;
    }
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.innerHTML = `
      <circle class="cf-e-ring" cx="${cx}" cy="${cy}" r="${r.width * 0.24}" fill="${col}" fill-opacity="0.20" stroke="${col}" stroke-width="3"/>
      <circle class="cf-e-ring2" cx="${cx}" cy="${cy}" r="${r.width * 0.32}" fill="none" stroke="#ffffff" stroke-width="1.6" opacity="0.8"/>
      ${extra}`;
    svg.appendChild(g);
    setTimeout(() => g.remove(), 700);
    /* 粒子：稀有度越高越多 */
    const n = rar === '传说' ? 9 : (rar === '史诗' ? 7 : 5);
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n + Math.random() * 0.4;
      const dist = 26 + Math.random() * 22;
      const d = document.createElement('div');
      d.className = 'cf-e-spark';
      d.style.left = (cx - 2.5) + 'px';
      d.style.top = (cy - 2.5) + 'px';
      d.style.background = i % 2 ? col : '#ffffff';
      d.style.setProperty('--dx', (Math.cos(a) * dist).toFixed(1) + 'px');
      d.style.setProperty('--dy', (Math.sin(a) * dist).toFixed(1) + 'px');
      document.body.appendChild(d);
      setTimeout(() => d.remove(), 620);
    }
  } catch (e) { /* 特效失败不影响结算 */ }
}

function playCardEnterVFX(side, lane, rarity = '普通', cardType = 'minion') {
  const cell = getLaneDOM(side, lane);
  const svg = document.getElementById('fxSvgOverlay');
  if (!cell || !svg) return;
  const r = cell.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const col = rarity === '传说' ? '#fbbf24' : (rarity === '史诗' ? '#c084fc' : (cardType === 'amulet' ? '#38bdf8' : '#34d399'));
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.innerHTML = `
    <circle cx="${cx}" cy="${cy}" r="54" fill="${col}" fill-opacity="0.18" stroke="${col}" stroke-width="3.5" stroke-dasharray="10 6"/>
    <circle cx="${cx}" cy="${cy}" r="34" fill="none" stroke="#ffffff" stroke-width="2" stroke-opacity="0.75"/>
  `;
  svg.appendChild(g);
  setTimeout(() => g.remove(), 420);
}

function playHandCardVFX(side, cardUid, kind = 'modify', label = '') {
  if (side !== 0) return;
  const el = document.querySelector(`#playerHandZone .sv-hand-card[data-card-uid="${cardUid}"]`);
  if (!el) return;
  const cls = kind === 'transform' ? 'sv-hand-vfx-transform' : (kind === 'discard' ? 'sv-hand-vfx-discard' : 'sv-hand-vfx-modify');
  el.classList.remove('sv-hand-vfx-transform', 'sv-hand-vfx-modify', 'sv-hand-vfx-discard');
  void el.offsetWidth;
  el.classList.add(cls);
  if (label) {
    const r = el.getBoundingClientRect();
    const tag = document.createElement('div');
    tag.className = 'fixed z-[150] px-2 py-0.5 rounded-full bg-slate-950/95 border border-cyan-400 text-[11px] font-black text-cyan-200 pointer-events-none shadow-lg';
    tag.style.left = `${r.left + r.width / 2}px`;
    tag.style.top = `${r.top - 12}px`;
    tag.style.transform = 'translateX(-50%)';
    tag.textContent = label;
    document.body.appendChild(tag);
    setTimeout(() => tag.remove(), 650);
  }
  setTimeout(() => el.classList.remove(cls), 580);
}

async function applyAoeDamageSimultaneousAnimated(targets, dmg, sourceMinion = null, banishUndead = false) {
  const valid = targets.filter(t => battle.board[t.side][t.lane] && battle.board[t.side][t.lane].data.type === 'minion');
  if (valid.length === 0) return;
  const toDestroy = [];
  const toBanish = [];
  sfx.play('hit');
  for (const t of valid) {
    const m = battle.board[t.side][t.lane];
    if (!m) continue;
    if (banishUndead && hasRace(m.data, '亡灵')) {
      toBanish.push(t);
      spawnFloatNumber(t.side, t.lane, '✨消失', '#e879f9');
      continue;
    }
    if (dmg <= 0) continue;
    if (m.activeKw['屏障']) {
      delete m.activeKw['屏障'];
      addGrantedEffect(m, `来源：【${sourceMinion && sourceMinion.data ? sourceMinion.data.name : '伤害'}】 → 【屏障】已抵挡消耗`);
      spawnFloatNumber(t.side, t.lane, '屏障抵挡!', '#38bdf8');
      continue;
    }
    m.currentHp = Math.max(0, m.currentHp - dmg);
    spawnFloatNumber(t.side, t.lane, `-${dmg}`, '#fb7185');
    if (sourceMinion && sourceMinion.activeKw['虹吸']) {
      const st = battle.leaders[sourceMinion.owner];
      st.hp = Math.min(st.maxHp, st.hp + dmg);
      spawnFloatNumber(sourceMinion.owner, -1, `+${dmg}`, '#4ade80');
    }
    if (m.currentHp <= 0 || (sourceMinion && sourceMinion.activeKw['毁灭'])) {
      toDestroy.push(t);
    }
  }
  renderAllBattleUI();
  await sleep(300);
  for (const t of toBanish) {
    if (battle.gameOver) break;
    if (battle.board[t.side][t.lane]) await banishMinionAnimated(t.side, t.lane);
  }
  for (const t of toDestroy) {
    if (battle.gameOver) break;
    if (battle.board[t.side][t.lane]) await destroyMinionAnimated(t.side, t.lane);
  }
}

async function playOverflowBanishAnim(side, inst) {
  if (!inst) return;
  const zone = document.getElementById('overflowBanishZone');
  if (zone) {
    sfx.play('synergy');
    const wrap = document.createElement('div');
    wrap.className = 'relative flex flex-col items-center';
    const tokenEl = buildFollowerTokenDOM(inst, side, -1);
    const tag = document.createElement('div');
    tag.className = 'absolute -top-3 px-2 py-0.5 rounded-full bg-purple-950 border border-fuchsia-400 text-[10px] font-black text-fuchsia-200 shadow-lg z-30';
    tag.textContent = '✨ 满场溢出·消失';
    wrap.appendChild(tokenEl);
    wrap.appendChild(tag);
    zone.appendChild(wrap);
    await sleep(140);
    playBanishVoidSVG(wrap);
    tokenEl.classList.add('banish-void-anim');
    await sleep(420);
    wrap.remove();
  }
  await triggerFriendlyMinionBanishedPassives(side, inst, true);
}

async function summonByNameAnimated(side, nameOrId, count = 1, sourceLane = -1, preferExact = false, sourceCardName = '') {
  const summonedList = [];
  const hasOrigin = (sourceLane >= 0 && sourceLane < 5);
  let anchorLane = sourceLane;
  let cursor = sourceLane;
  // 若起始位右侧已有卡牌或碰壁，则方向全程向左；否则优先向右连续生成
  let dir = (hasOrigin && (sourceLane + 1 >= 5 || battle.board[side][sourceLane + 1] !== null)) ? -1 : 1;

  for (let i = 0; i < count; i++) {
    const inst = createCardInstance(nameOrId, side);
    if (!inst) continue;
    if (sourceCardName) {
      addGrantedEffect(inst, `来源：【${sourceCardName}】 → 召唤入场`);
    }

    let emptyL = -1;
    if (!hasOrigin) {
      emptyL = findFirstEmptyLane(side);
    } else if (i === 0 && battle.board[side][sourceLane] === null) {
      emptyL = sourceLane;
      anchorLane = sourceLane;
      cursor = sourceLane;
      dir = (sourceLane + 1 >= 5 || battle.board[side][sourceLane + 1] !== null) ? -1 : 1;
    } else if (dir === 1) {
      if (cursor + 1 < 5 && battle.board[side][cursor + 1] === null) {
        emptyL = cursor + 1;
        cursor = emptyL;
      } else {
        // 向右途中被阻挡或碰壁：回到起始基准位向反方向（向左）连续放置
        dir = -1;
        for (let l = anchorLane - 1; l >= 0; l--) {
          if (battle.board[side][l] === null) { emptyL = l; break; }
        }
        if (emptyL !== -1) {
          cursor = emptyL;
        } else {
          // 左侧也满，从左往右检视空位并继续向右放置
          for (let l = 0; l < 5; l++) {
            if (battle.board[side][l] === null) { emptyL = l; break; }
          }
          if (emptyL !== -1) { dir = 1; cursor = emptyL; }
        }
      }
    } else {
      if (cursor - 1 >= 0 && battle.board[side][cursor - 1] === null) {
        emptyL = cursor - 1;
        cursor = emptyL;
      } else {
        // 向左被阻挡或已满：从左往右检视空位并继续向右放置
        for (let l = 0; l < 5; l++) {
          if (battle.board[side][l] === null) { emptyL = l; break; }
        }
        if (emptyL !== -1) { dir = 1; cursor = emptyL; }
      }
    }

    if (emptyL === -1) {
      await playOverflowBanishAnim(side, inst);
      continue;
    }
    await placeMinionOnBoardAnimated(side, inst, emptyL);
    const finalAtSlot = battle.board[side][emptyL];
    if (finalAtSlot) summonedList.push({ inst: finalAtSlot, lane: emptyL });
  }
  return summonedList;
}

async function recruitMinionAnimated(side, costFilter, raceFilter = '', sourceLane = -1, preferExact = false, sourceCardName = '') {
  const st = battle.leaders[side];
  const candidates = st.deck
    .map((c, idx) => ({ c, idx }))
    .filter(item => item.c.data.type === 'minion' && matchesSummonCostFilter(item.c.data, costFilter) && (!raceFilter || hasRace(item.c.data, raceFilter)))
    .sort((a, b) => (getCardCostValue(b.c.data) - getCardCostValue(a.c.data)) || (b.c.data.energy - a.c.data.energy));
  if (candidates.length === 0) return null;
  const chosen = candidates[0];
  st.deck.splice(chosen.idx, 1);
  if (sourceCardName) {
    addGrantedEffect(chosen.c, `来源：【${sourceCardName}】 → 招募入场`);
  }
  const emptyL = findNextSummonLane(side, sourceLane, preferExact);
  if (emptyL === -1) {
    await playOverflowBanishAnim(side, chosen.c);
    return null;
  }
  if (sourceLane >= 0) await playSynergyBeam(getLaneDOM(side, sourceLane), getLaneDOM(side, emptyL), '#38bdf8', 260);
  await placeMinionOnBoardAnimated(side, chosen.c, emptyL);
  return battle.board[side][emptyL];
}

async function reanimateMinionAnimated(side, costFilter, raceFilter = '', sourceLane = -1, preferExact = false, sourceCardName = '') {
  const st = battle.leaders[side];
  const candidates = st.graveyard
    .filter(cd => cd.type === 'minion' && matchesSummonCostFilter(cd, costFilter) && (!raceFilter || (raceFilter === '守护随从' ? hasGuardianKeyword(cd) : hasRace(cd, raceFilter))))
    .sort((a, b) => (getCardCostValue(b) - getCardCostValue(a)) || (b.energy - a.energy));
  if (candidates.length === 0) return null;
  const inst = createCardInstance(candidates[0].id, side);
  if (sourceCardName) {
    addGrantedEffect(inst, `来源：【${sourceCardName}】 → 亡者召还入场`);
  }
  const emptyL = findNextSummonLane(side, sourceLane, preferExact);
  if (emptyL === -1) {
    await playOverflowBanishAnim(side, inst);
    return null;
  }
  if (sourceLane >= 0) await playSynergyBeam(getLaneDOM(side, sourceLane), getLaneDOM(side, emptyL), '#c084fc', 260);
  await placeMinionOnBoardAnimated(side, inst, emptyL);
  return battle.board[side][emptyL];
}

async function playSacrificeBloodRitualSVG(cell) {
  if (!cell) return;
  const svg = document.getElementById('fxSvgOverlay');
  if (!svg) return;
  const r = cell.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.innerHTML = `
    <circle cx="${cx}" cy="${cy}" r="58" fill="rgba(225,29,72,0.22)" stroke="#f43f5e" stroke-width="3.5" stroke-dasharray="10 6"/>
    <circle cx="${cx}" cy="${cy}" r="42" fill="none" stroke="#fda4af" stroke-width="2"/>
    <line x1="${cx - 46}" y1="${cy - 46}" x2="${cx + 46}" y2="${cy + 46}" stroke="#fb7185" stroke-width="5" stroke-linecap="round"/>
    <line x1="${cx + 46}" y1="${cy - 46}" x2="${cx - 46}" y2="${cy + 46}" stroke="#fb7185" stroke-width="5" stroke-linecap="round"/>
  `;
  svg.appendChild(g);
  setTimeout(() => g.remove(), 420);
}

// 谢幕曲触发专属亡魂骷髅与幽紫冥火爆发特效
async function playLastWordsTriggerVFX(side, lane, cardName = '') {
  if (typeof recordLocalVfx === 'function') recordLocalVfx({ kind: 'lw_vfx', side, lane, name: cardName });
  const cell = getLaneDOM(side, lane);
  const svg = document.getElementById('fxSvgOverlay');
  sfx.play('lastwords');
  spawnFloatNumber(side, lane, `💀谢幕曲!`, '#e879f9');
  if (!cell || !svg) return;
  const r = cell.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.innerHTML = `
    <circle cx="${cx}" cy="${cy}" r="66" fill="rgba(168,85,247,0.28)" stroke="#e879f9" stroke-width="4"/>
    <circle cx="${cx}" cy="${cy}" r="48" fill="rgba(15,23,42,0.82)" stroke="#38bdf8" stroke-width="2.5" stroke-dasharray="8 5"/>
    <path d="M${cx-22},${cy-6} C${cx-22},${cy-26} ${cx+22},${cy-26} ${cx+22},${cy-6} C${cx+22},${cy+6} ${cx+14},${cy+14} ${cx+12},${cy+22} L${cx-12},${cy+22} C${cx-14},${cy+14} ${cx-22},${cy+6} ${cx-22},${cy-6} Z" fill="#f3e8ff" stroke="#a855f7" stroke-width="2.5"/>
    <circle cx="${cx-8}" cy="${cy-4}" r="4.5" fill="#090d16"/>
    <circle cx="${cx+8}" cy="${cy-4}" r="4.5" fill="#090d16"/>
    <circle cx="${cx-8}" cy="${cy-4}" r="2" fill="#38bdf8"/>
    <circle cx="${cx+8}" cy="${cy-4}" r="2" fill="#38bdf8"/>
    <line x1="${cx-6}" y1="${cy+14}" x2="${cx-6}" y2="${cy+22}" stroke="#090d16" stroke-width="2"/>
    <line x1="${cx}" y1="${cy+14}" x2="${cx}" y2="${cy+22}" stroke="#090d16" stroke-width="2"/>
    <line x1="${cx+6}" y1="${cy+14}" x2="${cx+6}" y2="${cy+22}" stroke="#090d16" stroke-width="2"/>
  `;
  svg.appendChild(g);
  await sleep(320);
  g.remove();
}


async function triggerFriendlyMinionDestroyedPassives(side, destroyedInst) {
  if (!destroyedInst || !destroyedInst.data || destroyedInst.data.type !== 'minion') return;
  for (let l = 0; l < 5; l++) {
    const fm = battle.board[side][l];
    if (!fm || fm === destroyedInst || fm.data.id !== 'cmwgquj0a4mpo') continue;
    fm.currentAtk += 1;
    fm.currentHp += 1;
    fm.maxHp += 1;
    addGrantedEffect(fm, '来源：【胆小鬼】 → 友方随从被破坏 +1/+1');
    spawnFloatNumber(side, l, '+1/+1', '#fbbf24');
    await showTriggeredEffectToast(fm.data, `友方『${destroyedInst.data.name}』被破坏，『胆小鬼』获得 +1/+1！`, 220);
    renderAllBattleUI();
  }
}

async function destroyMinionAnimated(side, lane, isSacrifice = false, skipLastWordsNow = false, isCountdownExpire = false) {
  const m = battle.board[side][lane];
  if (!m) return null;
  if (m.data.id === 'cmwfdja9sjiuf') {
    await showTriggeredEffectToast(m.data, '『怨灵』被破坏时改为【消失】。', 200);
    await banishMinionAnimated(side, lane);
    return null;
  }
  // 龙心秘宝 (cmwdzvs1woa53)：无法被破坏（倒计时除外）
  if (m.data.id === 'cmwdzvs1woa53' && !isCountdownExpire) {
    spawnFloatNumber(side, lane, '🛡️无法被破坏!', '#fde047');
    return null;
  }
  sfx.play(isSacrifice ? 'sacrifice' : 'hit');
  const cell = getLaneDOM(side, lane);
  if (isSacrifice) {
    playSacrificeBloodRitualSVG(cell);
    spawnFloatNumber(side, lane, '🩸献祭', '#fb7185');
    if (cell && cell.firstElementChild) {
      cell.firstElementChild.classList.add('sacrifice-crimson-anim');
    }
    await sleep(340);
  } else {
    if (cell && cell.firstElementChild) {
      cell.firstElementChild.classList.add('shatter-White-anim');
    }
    await playDestroyShatterVFX(side, lane, false);
    await sleep(220);
  }
  battle.board[side][lane] = null;
  const st = battle.leaders[side];
  st.graveyard.push(m.data);
  if (typeof renderBattleRecordPanel === 'function') renderBattleRecordPanel();
  recordDestroyedMinionCounters(st, m);
  addBones(side, 1);
  renderAllBattleUI();
  await triggerFriendlyMinionDestroyedPassives(side, m);
  await triggerMinionLeftBoardPassives(side, m);
  if (!skipLastWordsNow) {
    await resolveLastWordsAnimated(side, lane, m);
  }
  return m;
}

async function destroyMultipleMinionsSimultaneously(targets) {
  const valid = [];
  for (const t of targets) {
    const m = battle.board[t.side][t.lane];
    if (!m || m.data.type !== 'minion') continue;
    if (m.data.id === 'cmwdzvs1woa53') continue;
    if (m.data.id === 'cmwfdja9sjiuf') {
      await showTriggeredEffectToast(m.data, '『怨灵』被破坏时改为【消失】。', 180);
      await banishMinionAnimated(t.side, t.lane);
      continue;
    }
    valid.push(t);
  }
  if (valid.length === 0) return [];

  sfx.play('hit');
  valid.forEach(t => {
    const cell = getLaneDOM(t.side, t.lane);
    if (cell && cell.firstElementChild) {
      cell.firstElementChild.classList.add('shatter-White-anim');
    }
  });
  await sleep(300);

  const removedList = [];
  valid.forEach(t => {
    const m = battle.board[t.side][t.lane];
    if (!m) return;
    battle.board[t.side][t.lane] = null;
    const st = battle.leaders[t.side];
    st.graveyard.push(m.data);
    recordDestroyedMinionCounters(st, m);
    addBones(t.side, 1);
    removedList.push({ side: t.side, lane: t.lane, inst: m });
  });
  if (typeof renderBattleRecordPanel === 'function') renderBattleRecordPanel();
  renderAllBattleUI();

  for (const item of removedList) {
    if (battle.gameOver) break;
    await triggerFriendlyMinionDestroyedPassives(item.side, item.inst);
    await triggerMinionLeftBoardPassives(item.side, item.inst);
    await resolveLastWordsAnimated(item.side, item.lane, item.inst);
  }
  return removedList;
}

async function banishMinionAnimated(side, lane) {
  const m = battle.board[side][lane];
  if (!m) return;
  sfx.play('synergy');
  const cell = getLaneDOM(side, lane);
  if (cell) {
    playBanishVoidSVG(cell);
    if (cell.firstElementChild) {
      cell.firstElementChild.classList.add('banish-void-anim');
    }
  }
  spawnFloatNumber(side, lane, '✨消失', '#e879f9');
  await sleep(400);
  battle.board[side][lane] = null;
  renderAllBattleUI();
  await triggerMinionLeftBoardPassives(side, m);
  await triggerFriendlyMinionBanishedPassives(side, m, false);
}

async function executeASTActionList(side, sourceCardInst, sourceLane, actions, effectTargetLane = -1, preferExactSummonLane = false) {
  const st = battle.leaders[side];
  const opp = 1 - side;
  const cData = sourceCardInst.data;

  for (const act of actions) {
    if (battle.gameOver) break;
    if (act.rawText) {
      await showTriggeredEffectToast(cData, act.rawText, 240);
    }
    switch (act.op) {
      case 'transform_self':
        if (sourceLane >= 0 && battle.board[side][sourceLane] === sourceCardInst) {
          await transformBoardCardAnimated(side, sourceLane, act.targetName, cData.name, 0);
        }
        break;
      case 'recruit':
        for (let i = 0; i < (act.times || 1); i++) {
          await recruitMinionAnimated(side, act.costFilter || act.maxEnergy, act.race || '', sourceLane, preferExactSummonLane, cData.name);
        }
        break;
      case 'reanimate':
        for (let i = 0; i < (act.times || 1); i++) {
          await reanimateMinionAnimated(side, act.costFilter || act.maxEnergy, act.race || '', sourceLane, preferExactSummonLane, cData.name);
        }
        break;
      case 'add_bones':
        addBones(side, act.amount || 1);
        renderAllBattleUI();
        break;
      case 'draw':
        for (let i = 0; i < (act.count || 1); i++) {
          if (act.race) {
            const rIdx = st.deck.findIndex(c => c.data.type === 'minion' && hasRace(c.data, act.race));
            if (rIdx !== -1) {
              const [rc] = st.deck.splice(rIdx, 1);
              addGrantedEffect(rc, `来源：【${cData.name}】 → 定向检索抽上手牌`);
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
          } else {
            await drawCardAnimated(side);
          }
        }
        renderAllBattleUI();
        break;
      case 'add_hand':
        await addCardToHandAnimated(side, act.cardName || '电子羊', act.count || 1, sourceLane, cData.name);
        renderAllBattleUI();
        break;
      case 'summon':
        await summonByNameAnimated(side, act.cardName || '电子羊', act.count || 1, sourceLane, preferExactSummonLane, cData.name);
        break;
      case 'damage_front_three_minions': {
        if (sourceLane >= 0) {
          const lanes3 = [sourceLane - 1, sourceLane, sourceLane + 1].filter(l => l >= 0 && l < 5);
          for (const tl of lanes3) {
            if (battle.board[opp][tl] && battle.board[opp][tl].data.type === 'minion') {
              await playSynergyBeam(getLaneDOM(side, sourceLane), getLaneDOM(opp, tl), '#f97316', 200);
              await dealDamageToMinionAnimated(opp, tl, act.damage || 5, sourceCardInst);
            }
          }
        }
        break;
      }
      case 'damage_front_enemy': {
        /* 只打「正对面的敌人」= 正对面的随从；对面这一列是空的就不触发（不再打脸） */
        if (sourceLane >= 0 && battle.board[opp][sourceLane] && battle.board[opp][sourceLane].data.type === 'minion') {
          await playSynergyBeam(getLaneDOM(side, sourceLane), getLaneDOM(opp, sourceLane), '#f97316', 220);
          await dealDamageToMinionAnimated(opp, sourceLane, act.damage || 1, sourceCardInst);
        }
        break;
      }
      case 'damage_front_minion': {
        if (sourceLane >= 0 && battle.board[opp][sourceLane] && battle.board[opp][sourceLane].data.type === 'minion') {
          const fm = battle.board[opp][sourceLane];
          await showTriggeredEffectToast(cData, `【攻击时】对正前方的『${fm.data.name}』造成 ${act.damage || 3} 点伤害！`, 200);
          await playSynergyBeam(getLaneDOM(side, sourceLane), getLaneDOM(opp, sourceLane), '#f97316', 220);
          await dealDamageToMinionAnimated(opp, sourceLane, act.damage || 3, sourceCardInst);
        }
        break;
      }
      case 'distribute_damage': {
        const tSide = act.targetSideType === 'self' ? side : opp;
        await distributeDamageAnimated(tSide, act.damage || 2, act.includeLeader !== false, sourceCardInst, side, sourceLane);
        break;
      }
      case 'aoe_damage': {
        const tSide = act.targetSideType === 'self' ? side : opp;
        await playRowWideVFX(tSide, 'fire_aoe', 400);
        for (let l = 0; l < 5; l++) {
          if (battle.board[tSide][l] && battle.board[tSide][l].data.type === 'minion') {
            await dealDamageToMinionAnimated(tSide, l, act.damage || 3, sourceCardInst);
          }
        }
        break;
      }
      case 'aoe_destroy': {
        if (act.bothSides) {
          await playRowWideVFX(opp, 'destroy_wave', 280);
          await playRowWideVFX(side, 'destroy_wave', 280);
          const targets = [];
          for (let l = 0; l < 5; l++) {
            if (battle.board[opp][l] && battle.board[opp][l].data.type === 'minion') targets.push({ side: opp, lane: l });
            if (battle.board[side][l] && battle.board[side][l].data.type === 'minion') targets.push({ side: side, lane: l });
          }
          await destroyMultipleMinionsSimultaneously(targets);
        } else {
          await playRowWideVFX(opp, 'destroy_wave', 380);
          const targets = [];
          for (let l = 0; l < 5; l++) {
            if (battle.board[opp][l] && battle.board[opp][l].data.type === 'minion') targets.push({ side: opp, lane: l });
          }
          await destroyMultipleMinionsSimultaneously(targets);
        }
        break;
      }
      case 'leader_damage':
        await playSynergyBeam(getLaneDOM(side, sourceLane), getLaneDOM(opp, -1), '#f43f5e', 260);
        await dealDamageToLeaderAnimated(opp, act.damage || 3, sourceCardInst);
        break;
      case 'heal_leader':
        st.hp = Math.min(st.maxHp, st.hp + (act.amount || 3));
        spawnFloatNumber(side, -1, `+${act.amount || 3}`, '#4ade80');
        renderAllBattleUI();
        break;
      case 'banish_target_hp':
      case 'banish_target': {
        const tSide = act.needTarget === 'friendly_minion' ? side : opp;
        if (effectTargetLane >= 0 && battle.board[tSide][effectTargetLane]) {
          const tName = battle.board[tSide][effectTargetLane].data.name;
          await playSynergyBeam(getLaneDOM(side, sourceLane), getLaneDOM(tSide, effectTargetLane), '#c084fc', 260);
          await banishMinionAnimated(tSide, effectTargetLane);
          if (act.sameNameAll) {
            for (let l = 0; l < 5; l++) {
              if (battle.board[tSide][l] && battle.board[tSide][l].data.name === tName) {
                await banishMinionAnimated(tSide, l);
              }
            }
          }
        }
        break;
      }
      case 'destroy_target': {
        const tSide = act.needTarget === 'friendly_minion' ? side : opp;
        if (effectTargetLane >= 0 && battle.board[tSide][effectTargetLane]) {
          await playSynergyBeam(getLaneDOM(side, sourceLane), getLaneDOM(tSide, effectTargetLane), '#f43f5e', 260);
          await destroyMinionAnimated(tSide, effectTargetLane);
        }
        break;
      }
      case 'damage_target': {
        const tSide = act.needTarget === 'friendly_minion' ? side : opp;
        if (effectTargetLane >= 0 && battle.board[tSide][effectTargetLane]) {
          await playSynergyBeam(getLaneDOM(side, sourceLane), getLaneDOM(tSide, effectTargetLane), '#f43f5e', 260);
          await dealDamageToMinionAnimated(tSide, effectTargetLane, act.damage || 3, sourceCardInst);
        }
        break;
      }
      case 'buff_allies':
        await playRowWideVFX(side, 'buff_wave', 340);
        for (let l = 0; l < 5; l++) {
          const ally = battle.board[side][l];
          if (ally && ally.data.type === 'minion' && ally !== sourceCardInst && (!act.race || hasRace(ally.data, act.race))) {
            ally.currentAtk += (act.atk || 1);
            ally.maxHp += (act.hp || 1);
            ally.currentHp += (act.hp || 1);
            addGrantedEffect(ally, `来源：【${cData.name}】 → 获得 +${act.atk || 1}/+${act.hp || 1}`);
            spawnFloatNumber(side, l, `+${act.atk}/${act.hp}`, '#fde047');
          }
        }
        renderAllBattleUI();
        break;
      case 'discount_next':
        st.nextMechDiscount += (act.amount || 1);
        renderAllBattleUI();
        break;
    }
  }
}

async function resolveLastWordsAnimated(side, lane, m) {
  if (!hasAnyLastWords(m)) return;
  const st = battle.leaders[side];
  const opp = 1 - side;

  // 规则：「谢幕曲触发时需要播放特效」
  await playLastWordsTriggerVFX(side, lane, m.data.name);

  if (m.data.id === 'cmwbwg3kwqfkq') {
    st.delayedMechDraws += 1;
    await showTriggeredEffectToast(m.data, '下个回合开始时，从自己的牌库中抽取1张机械随从卡。', 280);
  } else if (m.data.id === 'cmwdzojlzzf98') {
    await showTriggeredEffectToast(m.data, '【谢幕曲】召唤1个『雏龙的蛋』到己方战场上。', 260);
    await summonByNameAnimated(side, '雏龙的蛋', 1, lane, true, m.data.name);
  } else if (m.data.id === 'cmwe0x250te3k') {
    await showTriggeredEffectToast(m.data, '【谢幕曲】召唤1个『沉睡的恐龙化石』到己方战场上。', 260);
    await summonByNameAnimated(side, '沉睡的恐龙化石', 1, lane, true, m.data.name);
  } else if (m.data.id === 'cmwe1281dd6j0') {
    await showTriggeredEffectToast(m.data, '【谢幕曲】召唤1个『灾变中幸存的恐龙』到己方战场上。', 260);
    await summonByNameAnimated(side, '灾变中幸存的恐龙', 1, lane, true, m.data.name);
  } else if (m.data.id === 'cmwdzvs1woa53') {
    addBones(side, 10);
    spawnFloatNumber(side, lane, '+10骨头', '#fde047');
    await showTriggeredEffectToast(m.data, '【谢幕曲】使自己的骨头+10，并将1张『金色的龙心』加入自己的手牌！', 280, side, lane);
    await addCardToHandAnimated(side, '金色的龙心', 1, lane, m.data.name);
    renderAllBattleUI();
  } else if (m.data.id === 'cmwe1jmj1j5oo') {
    await showTriggeredEffectToast(m.data, '【谢幕曲】使自己的骨头+5！', 240);
    addBones(side, 5);
    renderAllBattleUI();
  } else if (m.data.id === 'cmwc9ua0fd6of') {
    await showTriggeredEffectToast(m.data, '【谢幕曲】使自己的骨头+5，并将1张『骨龙』加入手牌！', 260);
    addBones(side, 5);
    await addCardToHandAnimated(side, '骨龙', 1, lane, m.data.name);
    renderAllBattleUI();
  } else if (m.data.id === 'cmwfdqzl799uk') {
    await showTriggeredEffectToast(m.data, '【谢幕曲】将1张『蝙蝠』加入自己的手牌！', 240);
    await addCardToHandAnimated(side, '蝙蝠', 1, lane, m.data.name);
  } else if (m.data.id === 'cmwfdsjjxuhrh') {
    await showTriggeredEffectToast(m.data, '【谢幕曲】将1张『怨灵』加入自己的手牌！', 240);
    await addCardToHandAnimated(side, '怨灵', 1, lane, m.data.name);
  } else if (m.data.id === 'cmwffityz44sn') {
    await showTriggeredEffectToast(m.data, '【谢幕曲】召唤4个『骷髅』到己方战场上！', 260);
    await summonByNameAnimated(side, '骷髅', 4, lane, false, m.data.name);
  } else if (m.data.id === 'cmwfg3ouofrw4') {
    await showTriggeredEffectToast(m.data, '【谢幕曲】对己方主战者造成1点伤害，并抽取1张卡牌！', 260);
    await dealDamageToLeaderAnimated(side, 1, m);
    if (!battle.gameOver) await drawCardAnimated(side);
  } else if (m.data.id === 'cmwgczzbob0ta' || m.data.id === 'cmwgd14oa2890') {
    await showTriggeredEffectToast(m.data, '【谢幕曲】召唤1个『骷髅』到己方战场上！', 240);
    await summonByNameAnimated(side, '骷髅', 1, lane, false, m.data.name);
  } else if (m.data.id === 'cmwgdmja7m7g7') {
    await showTriggeredEffectToast(m.data, '【谢幕曲】召唤2个『骷髅』到己方战场上！', 240);
    await summonByNameAnimated(side, '骷髅', 2, lane, false, m.data.name);
  } else if (m.data.id === 'cmwgdeqcq4vyl') {
    await showTriggeredEffectToast(m.data, '【谢幕曲】召唤2个『骷髅』到己方战场上！', 260);
    await summonByNameAnimated(side, '骷髅', 2, lane, false, m.data.name);
  } else if (m.data.id === 'cmwgey13x86vt') {
    await showTriggeredEffectToast(m.data, '【谢幕曲】对双方主战者造成1点伤害！', 240);
    await dealDamageToLeaderAnimated(0, 1, m);
    if (!battle.gameOver) await dealDamageToLeaderAnimated(1, 1, m);
  } else if (m.data.id === 'cmwgg0hlxpor5') {
    await showTriggeredEffectToast(m.data, '【谢幕曲】依次发动【亡者召还_价值7】【能量2价值5】【能量2价值3】！', 280);
    await reanimateMinionAnimated(side, { value: 7 }, '', lane, false, m.data.name);
    await reanimateMinionAnimated(side, { energy: 2, value: 5 }, '', lane, false, m.data.name);
    await reanimateMinionAnimated(side, { energy: 2, value: 3 }, '', lane, false, m.data.name);
  } else if (m.data.id === 'cmwggjooddagz') {
    st.delayedLastWordsDraws = (st.delayedLastWordsDraws || 0) + 1;
    await showTriggeredEffectToast(m.data, '【谢幕曲】预约下回合开始时抽取1张具有【谢幕曲】的卡牌！', 240);
  } else if (m.data.id === 'cmwghh2r742ie') {
    await showTriggeredEffectToast(m.data, '【谢幕曲】召唤2个『蝙蝠』到己方战场上！', 240);
    await summonByNameAnimated(side, '蝙蝠', 2, lane, false, m.data.name);
      } else if (m.data.id === 'cmwkdqize7mxq') {
        const oppLanes = [0,1,2,3,4].filter(el => battle.board[opp][el] && battle.board[opp][el].data.type === 'minion');
        if (oppLanes.length > 0) {
          const pickEl = oppLanes[Math.floor(Math.random() * oppLanes.length)];
          await showTriggeredEffectToast(m.data, '【谢幕曲】随机破坏 1 个敌方随从！', 240);
          await destroyMinionAnimated(opp, pickEl);
        }
  } else if (m.data.id === 'cmwhho71pxh5v') {
    st.delayedSelfDmgDraws = (st.delayedSelfDmgDraws || 0) + 1;
    await showTriggeredEffectToast(m.data, '【谢幕曲】预约下回合开始时对己方主战者造成1点伤害并抽1张牌！', 240);
  } else if (m.data.id === 'cmwhhzt6ezp08') {
    st.delayedSelfDmgBats = (st.delayedSelfDmgBats || 0) + 1;
    await showTriggeredEffectToast(m.data, '【谢幕曲】预约下回合开始时对己方主战者造成1点伤害并召唤1个『蝙蝠』！', 240);
  } else if (m.data.id === 'cmwhlefn11ybd') {
    await showTriggeredEffectToast(m.data, '【谢幕曲】回复己方主战者 2 点生命值！', 220);
    await healLeaderAnimated(side, 2, m.data.name);
  } else if (m.data.id === 'cmwhnqd6sxcdq') {
    await showTriggeredEffectToast(m.data, '【谢幕曲】获得【纹章：归来的剑圣】(倒计时2)！', 240);
    await grantLeaderCrest(side, {
      id: 'crest_returning_blademaster',
      name: '纹章：归来的剑圣',
      countdown: 2,
      desc: '纹章破坏时，召唤1个『归来的剑圣』到己方战场上。',
      cardData: m.data
    });
  } else if (m.data.id === 'cmwhov3uiapqd') {
    await showTriggeredEffectToast(m.data, '【谢幕曲】召唤 2 个『圣骑兵』！', 240);
    await summonByNameAnimated(side, 'cmwhoxkqvs8bv', 2, lane, true, m.data.name);
  } else if (m.data.id === 'cmwhpb43k6m14') {
    await showTriggeredEffectToast(m.data, '【谢幕曲】依次发动【亡者召还_价值6/4/2】（仅限守护随从）！', 260);
    await reanimateMinionAnimated(side, { value: 6 }, '守护随从', lane, true, m.data.name);
    await reanimateMinionAnimated(side, { value: 4 }, '守护随从', lane, true, m.data.name);
    await reanimateMinionAnimated(side, { value: 2 }, '守护随从', lane, true, m.data.name);
  } else if (m.data.id === 'cmwgrbfvac13x') {
    await showTriggeredEffectToast(m.data, '【谢幕曲】对双方全场随从和双方主战者造成 3 点伤害！', 280);
    await playRowWideVFX(0, 'damage_wave', 200);
    await playRowWideVFX(1, 'damage_wave', 200);
    for (let l = 0; l < 5; l++) {
      if (battle.board[0][l] && battle.board[0][l].data.type === 'minion') await dealDamageToMinionAnimated(0, l, 3, m);
      if (battle.board[1][l] && battle.board[1][l].data.type === 'minion') await dealDamageToMinionAnimated(1, l, 3, m);
    }
    if (!battle.gameOver) await dealDamageToLeaderAnimated(0, 3, m);
    if (!battle.gameOver) await dealDamageToLeaderAnimated(1, 3, m);
  } else if (m.data.ast && m.data.ast.lastWords.length > 0) {
    await executeASTActionList(side, m, lane, m.data.ast.lastWords, -1, true);
  }

  for (const ex of (m.extraLastWords || [])) {
    if (ex.type === 'boom_sheep') {
      await showTriggeredEffectToast(m.data, '对敌方战场上的所有随从和敌方主战者分配2点伤害。', 280);
      await distributeDamageAnimated(opp, 2, true, m, side, lane);
    } else if (ex.type === 'rebirth_self') {
      await showTriggeredEffectToast(m.data, `召唤1个『${m.data.name}』到己方战场上。`, 280);
      await summonByNameAnimated(side, ex.cardId, 1, lane, true, '转生苹果');
    } else if (ex.type === 'ast_actions') {
      await showTriggeredEffectToast(m.data, `【谢幕曲】${ex.desc}`, 260, side, lane);
      let acts = Array.isArray(ex.actions) ? ex.actions : [];
      if (!acts.length && ex.desc) {
        try { acts = parseSentencesToActions(String(ex.desc), m.data) || []; } catch (e) { acts = []; }
      }
      try {
        if (acts.length) await executeASTActionList(side, m, lane, acts, -1, true);
        else console.warn('[谢幕曲] 文本无法解析为动作：', ex.desc);
      } catch (e) { console.error('[谢幕曲] 执行异常:', e); }
    }
  }
}

async function dealDamageToMinionAnimated(targetSide, lane, amount, sourceMinion = null) {
  if (amount <= 0) return 0;
  const target = battle.board[targetSide][lane];
  if (!target || target.data.type === 'amulet') return 0;
  if (target.activeKw['屏障']) {
    delete target.activeKw['屏障'];
    await showTriggeredEffectToast(target.data, '【屏障】抵挡了本次伤害！', 200);
    addGrantedEffect(target, `来源：【${sourceMinion && sourceMinion.data ? sourceMinion.data.name : '伤害'}】 → 【屏障】已抵挡消耗`);
    spawnFloatNumber(targetSide, lane, '屏障抵挡!', '#38bdf8');
    renderAllBattleUI();
    await sleep(260);
    return 0;
  }
  sfx.play('hit');
  target.currentHp -= amount;
  spawnFloatNumber(targetSide, lane, `-${amount}`, '#fb7185');
  renderAllBattleUI();
  await sleep(260);

  if (sourceMinion && sourceMinion.activeKw['虹吸']) {
    await healLeaderAnimated(sourceMinion.owner, amount, sourceMinion.data ? sourceMinion.data.name : '');
  }
  if (target.currentHp <= 0 || (sourceMinion && sourceMinion.activeKw['毁灭'])) {
    if (sourceMinion && sourceMinion.activeKw['毁灭'] && target.currentHp > 0) {
      await showTriggeredEffectToast(sourceMinion.data, `【毁灭】消灭受到伤害的『${target.data.name}』。`, 240);
    }
    await destroyMinionAnimated(targetSide, lane);
  }
  return amount;
}

async function triggerLeaderHpChangedPassivesAnimated(side, depth = 0) {
  if (battle.gameOver || depth > 6 || battle.activeSide !== side) return;
  const opp = 1 - side;
  for (let l = 0; l < 5; l++) {
    if (battle.gameOver) break;
    const m = battle.board[side][l];
    if (m && m.data.id === 'cmwgyfgvst9r1') {
      await showTriggeredEffectToast(m.data, '主战者生命值变化：『燃血术士』召唤 1 个『蝙蝠』！', 200);
      await summonByNameAnimated(side, '蝙蝠', 1, l, false, m.data.name);
    }
  }
}

async function healLeaderAnimated(side, amount, sourceName = '', depth = 0) {
  if (amount > 0 && typeof recordLocalVfx === 'function') recordLocalVfx({ kind: 'heal_leader', side, amount });
  if (amount <= 0 || battle.gameOver) return 0;
  const st = battle.leaders[side];
  const oldHp = st.hp;
  st.hp = Math.min(st.maxHp, st.hp + amount);
  const actualHeal = st.hp - oldHp;
  spawnFloatNumber(side, -1, `+${amount}`, '#4ade80');
  renderAllBattleUI();
  if (actualHeal > 0) {
    await triggerLeaderHpChangedPassivesAnimated(side, depth + 1);
  }
  return actualHeal;
}

async function dealDamageToLeaderAnimated(targetSide, amount, sourceMinion = null, fromCrest = false, isTransferred = false, depth = 0, skipSlowmo = false) {
  if (amount > 0 && !sourceMinion && typeof recordLocalVfx === 'function') recordLocalVfx({ kind: 'dmg_leader', side: targetSide, dmg: amount });
  if (amount < 0 || battle.gameOver) return;
  const st = battle.leaders[targetSide];
  const prevHp = st.hp;            // FIX(v38-hotfix): 被漏掉的声明，缺它每次主战者受伤都会抛 ReferenceError

  // 1) 坚固的狮子石像 (cmwgyue0p59ih)：使自己的主战者无敌
  const hasLionInvincible = battle.board[targetSide].some(m => m && m.data.id === 'cmwgyue0p59ih');
  if (hasLionInvincible) {
    spawnFloatNumber(targetSide, -1, '🦁主战者无敌!', '#fde047');
    await sleep(180);
    return;
  }

  // 2) 反击的蔷薇剑士 (cmwgyp9vt1dta)：在自己的回合中，自己主战者受到的所有伤害转移给敌方主战者
  if (!isTransferred && battle.activeSide === targetSide) {
    const hasReflectSword = battle.board[targetSide].some(m => m && m.data.id === 'cmwgyp9vt1dta');
    if (hasReflectSword) {
      spawnFloatNumber(targetSide, -1, '⚔️伤害转移!', '#f43f5e');
      await sleep(180);
      await dealDamageToLeaderAnimated(1 - targetSide, amount, sourceMinion, fromCrest, true, depth + 1);
      return;
    }
  }

  // 3) 纹章：傲慢的大小姐 (crest_arrogant_rose)：受到伤害-2（减伤至0仍算受到0点伤害并触发受伤计数）
  if (st.crests && st.crests.some(cr => cr.id === 'crest_arrogant_rose')) {
    const reduced = Math.max(0, amount - 2);
    if (reduced !== amount) {
      spawnFloatNumber(targetSide, -1, `🛡️减伤-${amount - reduced}`, '#c084fc');
    }
    amount = reduced;
  }

  const isLethalHit = !skipSlowmo && (st.hp - amount) <= 0;
  if (isLethalHit) {
    battle.gameOver = true;
    await playLethalSlowMotion(targetSide, amount, () => {
      sfx.play('hit');
      st.hp -= amount;
      spawnFloatNumber(targetSide, -1, `-${amount}`, '#f43f5e');
      renderAllBattleUI();
    });
  } else {
    sfx.play('hit');
    st.hp -= amount;
    await playLeaderDamageTypeVFX(targetSide, sourceMinion ? 'combat' : (fromCrest ? 'crest' : 'effect'));
    spawnFloatNumber(targetSide, -1, `-${amount}`, sourceMinion ? '#f43f5e' : (fromCrest ? '#fbbf24' : '#c084fc'));
    renderAllBattleUI();
    await sleep(240);
  }

  if (sourceMinion && sourceMinion.activeKw['虹吸'] && amount > 0) {
    await healLeaderAnimated(sourceMinion.owner, amount, sourceMinion.data ? sourceMinion.data.name : '', depth + 1);
  }
  if (st.hp <= 0) {
    battle.gameOver = true;
    if (battleMode === 'pvp_online' && typeof showOnlineVictoryDefeatModal === 'function') {
      const iWon = targetSide === 1;
      showOnlineVictoryDefeatModal(iWon, iWon ? '你成功击败了联机对手！点击下方按钮回到对战房间。' : '己方主战者生命值归零，点击下方按钮回到对战房间。');
      return;
    }
    const vModal = document.getElementById('victoryDefeatModal');
    if (vModal) {
      document.getElementById('vicBadgeIcon').textContent = targetSide === 1 ? '🏆' : '💀';
      if (typeof clearPveBattleProgress === 'function') clearPveBattleProgress();
      document.getElementById('vicTitleTxt').textContent = targetSide === 1 ? 'VICTORY · 对战胜利' : 'DEFEAT · 对战落败';
      document.getElementById('vicTitleTxt').className = targetSide === 1 ? 'text-3xl font-black tracking-widest text-amber-300' : 'text-3xl font-black tracking-widest text-rose-400';
      document.getElementById('vicSubTxt').textContent = targetSide === 1 ? '你成功将敌方主战者生命值降至 0 点！' : '我方主战者生命值归零，可随时点击下方按钮再战一局或调整卡组。';
      if (typeof cfRecordMatch === 'function') cfRecordMatch(targetSide === 1);
      if (typeof cfSaveBattleLog === 'function') cfSaveBattleLog(targetSide === 1);
      vModal.classList.remove('hidden');
    }
    return;
  }
  if (!battle.gameOver && battle.activeSide === targetSide) {
    st.selfTurnDamageCount = (st.selfTurnDamageCount || 0) + 1;
    st.totalSelfTurnDamageCount = (st.totalSelfTurnDamageCount || 0) + 1;

    for (const cr of [...(st.crests || [])]) {
      if (battle.gameOver) break;
      if (cr.id === 'crest_blood_mage' && depth < 6) {
        const opp = 1 - targetSide;
        await playCrestTriggerVFX(targetSide, cr.id);
        await playRowWideVFX(opp, 'damage_wave', 220);
        await showTriggeredEffectToast(cr.cardData, '【纹章：血法师】己方回合受伤，对敌方随从全体与主战者造成1点伤害！', 240);
        await applyAoeDamageSimultaneousAnimated([0,1,2,3,4].map(el => ({ side: opp, lane: el })), 1, null);
        if (!battle.gameOver) await dealDamageToLeaderAnimated(opp, 1, null, true, false, depth + 1);
      } else if (cr.id === 'crest_blood_rose' && !fromCrest) {
        await playCrestTriggerVFX(targetSide, cr.id);
        await showTriggeredEffectToast(cr.cardData, '【纹章：血玫瑰】自己回合受到伤害，回复 1 点生命值！', 180);
        await healLeaderAnimated(targetSide, 1, cr.name, depth + 1);
      }
    }

    for (let l = 0; l < 5; l++) {
      const gm = battle.board[targetSide][l];
      if (gm && gm.data.id === 'cmwgyd3y5eyqg') {
        await showTriggeredEffectToast(gm.data, '【鲜血宝石】己方回合受伤：召唤 1 个『蝙蝠』！', 200);
        await summonByNameAnimated(targetSide, '蝙蝠', 1, l, false, gm.data.name);
      } else if (gm && gm.data.id === 'cmwhm4gd57wh3' && !battle.gameOver && depth < 6) {
        await playSynergyBeam(getLaneDOM(targetSide, l), getLaneDOM(targetSide, -1), '#34d399', 180);
        await showTriggeredEffectToast(gm.data, '【疼痛疗愈者】己方回合受伤：回复 1 点生命值！', 180);
        await healLeaderAnimated(targetSide, 1, gm.data.name, depth + 1);
      }
    }
  }

  // 生命值变化联动：燃血术士
  if (!battle.gameOver && st.hp !== prevHp && depth < 6) {
    await triggerLeaderHpChangedPassivesAnimated(targetSide, depth + 1);
  }
}

async function distributeDamageAnimated(targetSide, totalDmg, includeLeader = true, sourceMinion = null, sourceSide = 0, sourceLane = -1) {
  let rem = Number(totalDmg || 0);
  while (rem > 0 && !battle.gameOver) {
    const alive = [];
    for (let l = 0; l < 5; l++) {
      const m = battle.board[targetSide][l];
      if (m !== null && m.data.type === 'minion') {
        alive.push({ lane: l, inst: m });
      }
    }
    if (alive.length === 0) {
      if (includeLeader) {
        await playSynergyBeam(getLaneDOM(sourceSide, sourceLane), getLaneDOM(targetSide, -1), '#f43f5e', 240);
        await dealDamageToLeaderAnimated(targetSide, rem, sourceMinion);
      }
      break;
    }
    // 统一按战道 1→5 依次分配（我方 lane 0→4，敌方对位反转 lane 4→0 即敌方战道1→5）
    alive.sort((a, b) => targetSide === 1 ? (b.lane - a.lane) : (a.lane - b.lane));
    const first = alive[0];
    await playSynergyBeam(getLaneDOM(sourceSide, sourceLane), getLaneDOM(targetSide, first.lane), '#f97316', 220);
    if (first.inst.activeKw['屏障']) {
      await dealDamageToMinionAnimated(targetSide, first.lane, 1, sourceMinion);
      rem -= 1;
    } else {
      const neededToKill = Math.max(1, first.inst.currentHp);
      const dmgNow = Math.min(rem, neededToKill);
      await dealDamageToMinionAnimated(targetSide, first.lane, dmgNow, sourceMinion);
      rem -= dmgNow;
    }
  }
}

