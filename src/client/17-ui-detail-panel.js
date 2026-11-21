function getFuseRuleInfo(cData) {
  const kw = (cData.keywords || []).find(k => k.k === '融合');
  const full = String(cData.fullText || '') + ' ' + String(kw ? (kw.effect || kw.fcond || kw.type || '') : '');
  let label = '任意手牌';
  let matchFn = (hc) => true;

  let mCost;
  if ((mCost = full.match(/原始(?:能量)?费用(?:为)?(\d+)以下/))) {
    const maxE = Number(mCost[1]);
    label = `原始费用${maxE}以下卡牌`;
    matchFn = (hc) => (hc.data.energy || 0) <= maxE;
  } else if (full.includes('机械')) {
    label = '机械卡牌';
    matchFn = (hc) => isMechCard(hc.data);
  } else if (full.includes('亡灵')) {
    label = '亡灵卡牌';
    matchFn = (hc) => hasRace(hc.data, '亡灵');
  } else if (full.includes('龙族')) {
    label = '龙族卡牌';
    matchFn = (hc) => hasRace(hc.data, '龙族');
  }
  const reduceMatch = full.match(/能量(?:费用)?-(\d+)/);
  const costReducePerCard = reduceMatch ? Number(reduceMatch[1]) : 0;
  return { label, matchFn, costReducePerCard };
}

function getCardGrantedEffectsList(inst, location) {
  const list = [];
  if (!inst) return list;
  const c = inst.data;
  const st = battle.leaders[inst.owner];

  if (inst.grantedEffects && inst.grantedEffects.length > 0) {
    inst.grantedEffects.forEach(txt => list.push(txt));
  }
  if (location === 'hand' && c.type === 'minion') {
    const baseAtk = c.atk || 0;
    const baseHp = c.hp || 1;
    const dAtk = (inst.currentAtk ?? baseAtk) - baseAtk;
    const dHp = (inst.currentHp ?? baseHp) - baseHp;
    if ((dAtk !== 0 || dHp !== 0) && !list.some(t => t.includes('身材') || t.includes('攻击') || t.includes('+'))) {
      const sAtk = dAtk >= 0 ? `+${dAtk}` : `${dAtk}`;
      const sHp = dHp >= 0 ? `+${dHp}` : `${dHp}`;
      list.push(`身材变化：当前 ${inst.currentAtk}/${inst.currentHp}（较原始 ${sAtk}/${sHp}）`);
    }
    const baseKws = new Set((c.keywords || []).map(k => k.k));
    const extraKws = Object.keys(inst.activeKw || {}).filter(k => !baseKws.has(k));
    if (extraKws.length > 0 && !list.some(t => extraKws.every(k => t.includes(k)))) {
      list.push(`获得额外词条：【${extraKws.join('】【')}】`);
    }
  }

  if ((inst.fusedCount || 0) > 0) {
    if (c.id === 'cmwd6zdfog6ux') {
      list.push(`来源：【${c.name}·融合】 → 已融合 ${inst.fusedCount} 张卡牌（能量费用 -${inst.costReduction || inst.fusedCount}）`);
    } else if (c.id === 'cmwdi4pwz3c0k') {
      list.push(`来源：【${c.name}·融合】 → 已融合 ${inst.fusedCount} 张机械卡牌（打出时额外召唤2个『电子羊』）`);
    } else if (c.id === 'cmwdibvlbqmxv') {
      list.push(`来源：【${c.name}·融合】 → 已融合 ${inst.fusedCount} 张原始费用3以下卡牌`);
    } else {
      list.push(`来源：【${c.name}·融合】 → 已融合 ${inst.fusedCount} 张手牌`);
    }
  }

  if (location === 'hand' && c.type === 'minion' && isMechCard(c) && st && st.nextMechDiscount > 0) {
    list.push(`来源：【铜壳瓢虫】 → 本回合下一张机械随从卡能量费用 -${st.nextMechDiscount}`);
  }

  const baseKws = new Set((c.keywords || []).map(k => k.k));
  Object.keys(inst.activeKw || {}).forEach(k => {
    if (!baseKws.has(k)) {
      const alreadyMentioned = list.some(item => item.includes(`【${k}`));
      if (!alreadyMentioned) {
        list.push(`来源：【战场效果赋予】 → 获得词条【${k}${k === '荆棘' || k === '多重攻击' ? '_' + inst.activeKw[k] : ''}】`);
      }
    }
  });

  return list;
}


const KEYWORD_GLOSSARY = {
  '入场曲': '从手牌打出进入战场时触发的能力（由【招募】、【亡者召还】或衍生物召唤进场时不触发）。',
  '谢幕曲': '随从或护符在战场上被破坏送入墓地时触发的能力；被【消失】时不触发。',
  '守护': '敌方随从直接攻击己方主战者时，若该战道为空位，己方具有【守护】的随从会自动横移至该战道拦截攻击。',
  '飞行': '攻击时可以越过不具有【防空】的敌方随从，直接攻击敌方主战者。',
  '防空': '可以阻挡具有【飞行】的敌方随从越过自己直接攻击主战者。',
  '灵气': '无法被敌方的法术卡指定为目标。',
  '潜行': '直到自身进行攻击前，无法被敌方随从或法术指定为目标。',
  '毁灭': '受到本随从攻击伤害的敌方随从会被直接破坏（即使生命值未归零，【屏障】抵挡除外）。',
  '荆棘': '【荆棘_X】受到敌方随从的战斗伤害时，对攻击者造成 X 点反伤。',
  '虹吸': '对敌方随从或主战者造成战斗伤害时，为己方主战者回复等量生命值。',
  '屏障': '抵挡该随从下一次受到的伤害（抵挡后【屏障】消失）。',
  '位移': '每次攻击结束后自动向右侧空位移动一格；若触底或被阻挡则转向左侧移动。',
  '多重攻击': '【多重攻击_X】每回合自动攻击结算时，可连续进行 X 次攻击。',
  '两侧攻击': '攻击时改为同时打击正前方左右相邻的两列敌方单位。',
  '三侧攻击': '攻击时改为同时打击正前方与左右相邻共三列敌方单位。',
  '全体攻击': '攻击时打击敌方场上所有随从（若具备【飞行】且前方无【防空】，则同时直击主战者）。',
  '倒计时': '【倒计时_X】每当己方回合开始时倒计时 -1；归零时护符破坏触发效果，随从则触发【变身】进化。',
  '启动': '在己方回合内，点击场上该卡牌的详细面板即可支付对应费用主动发动（每回合限 1 次）。',
  '融合': '在己方回合内，点击手牌中该卡牌的详细面板即可将手牌中的指定素材与之融合（每回合限 1 次）。',
  '抉择': '打出时从多个分支能力中选择 1 项发动。',
  '连击': '【连击_X】若这是本回合己方使用的第 X 张以上卡牌，则触发强化效果。',
  '爆能强化': '【爆能强化_资源X】若当前拥有 X 以上对应资源，打出时自动支付 X 费用并发动强化效果。',
  '瞬念召唤': '满足特定条件时，在回合结束阶段自动从牌库直接召唤到战场上。',
  '招募': '从己方牌库中随机召唤 1 张满足条件的随从（优先最高价值）。按【价值X】判定时不限费用体系；按【能量X/祭品X/骨头X】等单一费用判定时，仅限召唤该单一费用体系的随从。',
  '亡者召还': '从己方墓地中复活 1 张满足条件的随从（优先最高价值）。按【价值X】判定时不限费用体系；按【能量X/祭品X/骨头X】等单一费用判定时，仅限复活该单一费用体系的随从。',
  '消失': '直接移出本局对战，不进入墓地、不增加骨头且不触发【谢幕曲】。',
  '随从进场时': '无论从手牌打出还是被效果召唤进入战场，都会立即触发。',
  '随从离场时': '每当该随从离开战场（破坏、献祭或消失）时触发的效果。',
  '回合开始时': '己方回合开始、抽牌前/后按阶段自动触发的效果。',
  '回合结束时': '在己方回合结束结算阶段触发。',
  '攻击时': '该随从每次发起攻击前触发。',
  '纹章': '附着在主战者身上的持久或倒计时徽记，上限 5 个，同名不叠加。多个消耗剩余能量的纹章按获得先后顺序依次扣费触发，能量不足则跳过该纹章。',
  '分配': '分配伤害时按目标战道 1→5 顺序依次造成伤害，前一个目标生命归零后剩余伤害继续转移给下一个目标，溢出伤害打击敌方主战者；属性分配效果则将数值随机分配给指定目标。',
  '献祭': '打出时需选择并破坏己方战场上指定数量的随从作为祭品；被破坏的祭品会正常进入墓地、+1 骨头并触发【谢幕曲】。',
  '变身': '使卡牌直接变为另一张指定卡牌，视为新随从进入战场，不触发【谢幕曲】也不会进入墓地或增加骨头。',
  '弃置': '将手牌直接移出，不进入墓地也不触发【谢幕曲】。',
  '无敌': '主战者处于无敌状态时，受到的所有伤害均降为 0。',
  '伤害转移': '己方主战者即将受到的所有伤害改为由敌方主战者承受。',
  '价值': '卡牌的综合费用评估值（计算公式：能量×1 + 祭品×1.5 + 骨头×0.5）。',
  '结晶': '【结晶_资源X】若当前能量不足以支付本体费用但满足结晶费用且战场有空位，可支付结晶费用作为护符打出并触发结晶效果。',
  '激奏': '【激奏_资源X】若当前能量不足以支付本体费用但满足激奏费用，可支付激奏费用直接作为法术打出并触发激奏效果。',
  '疾驰': '入场当回合即可直接发起攻击（包含攻击敌方随从与敌方主战者）。',
  '突进': '入场当回合即可攻击敌方随从，但不能直接攻击敌方主战者。',
  '潜伏': '直到自身进行攻击前，无法被敌方随从或法术指定为目标。',
  '自残': '在自己回合内通过自身卡牌效果对己方主战者造成伤害，可累计本回合与本局自残次数以触发强化效果。',
  '狂乱': '本局对战中己方在自己回合内累计自残达到指定次数后激活的强化状态。'
};

let detailNavStack = [];

function formatInteractiveDetailHTML(rawText, currentCardName = '') {
  let safe = String(rawText || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const placeholders = [];
  const stash = (html) => {
    const tok = `@@CFTOK_${placeholders.length}@@`;
    placeholders.push(html);
    return tok;
  };
  const aliasMap = { '骷髅士兵': '骷髅', '狼人': '咆哮的狼人', '魔导机械少女': '魔导机兵少女' };

  // 1. 关键词或卡牌名 pill: 【xxx】
  const glossaryKeysSorted = Object.keys(KEYWORD_GLOSSARY).sort((a, b) => b.length - a.length);
  safe = safe.replace(/【([^】]+)】/g, (full, inner) => {
    const baseKw = inner.split('_')[0].split('：')[0].replace(/\s*\d+$/, '').trim();
    const matchedKey = glossaryKeysSorted.find(k => baseKw === k || baseKw.startsWith(k));
    if (matchedKey) {
      return stash(`<button type="button" class="cf-kw-link" data-kw="${matchedKey}" title="点击查看【${matchedKey}】词条说明">【${inner}】</button>`);
    }
    const realCardName = aliasMap[inner] || inner;
    if (allCards.some(x => x.name === realCardName) && realCardName !== currentCardName) {
      return stash(`<button type="button" class="cf-card-link" data-card-name="${realCardName}" title="点击查看『${realCardName}』卡牌详情">『${inner}』</button>`);
    }
    return stash(`<span class="px-1 rounded bg-amber-950/70 border border-amber-500/40 text-amber-200 font-bold">【${inner}】</span>`);
  });

  // 2. 显式卡牌名 pill: 『xxx』
  safe = safe.replace(/『([^』]+)』/g, (full, cName) => {
    const realName = aliasMap[cName] || cName;
    const targetCard = allCards.find(x => x.name === realName);
    if (targetCard && realName !== currentCardName) {
      return stash(`<button type="button" class="cf-card-link" data-card-name="${realName}" title="点击查看『${realName}』卡牌详情">『${cName}』</button>`);
    }
    return stash(`<span class="text-cyan-300 font-black">『${cName}』</span>`);
  });

  // 3. 自动识别未加『』的关联卡牌名（按长度降序，避免短名误截断长名）
  const refNames = allCards
    .map(x => x.name)
    .filter(n => n && n.length >= 2 && n !== currentCardName);
  const allMatchKeys = Array.from(new Set([...refNames, ...Object.keys(aliasMap)]))
    .filter(n => n !== currentCardName)
    .sort((a, b) => b.length - a.length);
  if (allMatchKeys.length > 0) {
    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const nameRe = new RegExp('(' + allMatchKeys.map(esc).join('|') + ')', 'g');
    safe = safe.replace(/@@CFTOK_\d+@@|[^@]+/g, (seg) => {
      if (seg.startsWith('@@CFTOK_')) return seg;
      return seg.replace(nameRe, (m) => {
        const realName = aliasMap[m] || m;
        if (!allCards.some(x => x.name === realName) || realName === currentCardName) return m;
        return stash(`<button type="button" class="cf-card-link" data-card-name="${realName}" title="点击查看『${realName}』卡牌详情">『${m}』</button>`);
      });
    });
  }

  // 4. 自动识别未加【】的关键词与游戏用语（支持倒计时、结晶、激奏、自残、狂乱及带/不带数字后缀的所有词条）
  safe = safe.replace(/@@CFTOK_\d+@@|[^@]+/g, (seg) => {
    if (seg.startsWith('@@CFTOK_')) return seg;
    return seg.replace(/(荆棘(?:_\d+)?|亡者召还(?:_[^，。；\s\n（）()]+)?|招募(?:_[^，。；\s\n（）()]+)?|倒计时(?:_\d+)?|连击(?:_\d+)?|爆能强化(?:_[^，。；\s\n（）()]+)?|结晶(?:_[^，。；\s\n（）()]+)?|激奏(?:_[^，。；\s\n（）()]+)?|多重攻击(?:_\d+)?|防空|毁灭|疾驰|突进|守护|飞行|灵气|屏障|虹吸|潜行|潜伏|位移|两侧攻击|三侧攻击|全体攻击|消失|入场曲|谢幕曲|启动|抉择|融合|瞬念召唤|随从进场时|随从离场时|回合开始时|回合结束时|攻击时|纹章|分配|献祭|变身|弃置|无敌|伤害转移|自残|狂乱|价值)/g, (kwText) => {
      const baseKw = kwText.split('_')[0].trim();
      const matchedKey = glossaryKeysSorted.find(k => baseKw === k || baseKw.startsWith(k));
      if (!matchedKey) return kwText;
      return stash(`<button type="button" class="cf-kw-link" data-kw="${matchedKey}" title="点击查看【${matchedKey}】词条说明">【${kwText}】</button>`);
    });
  });

  // 5. 数值高亮 (+X/+Y, X点伤害, 倒计时-X, 骨头+X)
  safe = safe.replace(/@@CFTOK_\d+@@|[^@]+/g, (seg) => {
    if (seg.startsWith('@@CFTOK_')) return seg;
    return seg.replace(/([+-]\d+\/[+-]?\d+|倒计时[+-]\d+|骨头[+-]\d+|\d+点(?:伤害|生命值))/g, '<b class="text-emerald-300 font-black">$1</b>');
  });

  // 还原占位符
  for (let i = 0; i < placeholders.length; i++) {
    safe = safe.replace(`@@CFTOK_${i}@@`, placeholders[i]);
  }
  return safe;
}

function bindDetailInteractiveLinks(container) {
  if (!container) return;
  container.querySelectorAll('.cf-kw-link').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const kw = btn.getAttribute('data-kw');
      if (!kw || !KEYWORD_GLOSSARY[kw]) return;
      if (battle.inspectedCard) {
        if (detailNavStack.length < 8) detailNavStack.push({ type: 'card', state: battle.inspectedCard });
      }
      renderDetailKeywordGlossaryView(kw);
    };
  });
  container.querySelectorAll('.cf-card-link').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const cName = btn.getAttribute('data-card-name');
      const targetDef = allCards.find(x => x.name === cName);
      if (!targetDef) return;
      if (battle.inspectedCard && battle.inspectedCard.inst && battle.inspectedCard.inst.data.name === cName) return;
      if (battle.inspectedCard) {
        if (detailNavStack.length < 8) detailNavStack.push({ type: 'card', state: battle.inspectedCard });
      }
      const refInst = createCardInstance(targetDef.id, 0);
      openCardDetailPanel(refInst, 'ref', 0, -1, null, true);
    };
  });
}

function renderDetailKeywordGlossaryView(kw) {
  const panel = document.getElementById('svDetailPanel');
  if (!panel) return;
  document.getElementById('detEnergyBadge').textContent = '📖';
  document.getElementById('detCardName').textContent = `关键词 · 【${kw}】`;
  document.getElementById('detCardSub').textContent = '词条机制说明（随时点击右上角 ✕ 关闭回到对战）';
  document.getElementById('detCostsRow').innerHTML = `<button type="button" id="btnDetNavBack" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-amber-400/60 text-amber-200 font-black text-xs cursor-pointer">◀ 返回上一张卡牌</button>`;
  document.getElementById('detStatsRow').innerHTML = '';
  const segBox = document.getElementById('detSegmentedEffects');
  segBox.innerHTML = `<div class="p-3 rounded-xl bg-amber-950/40 border border-amber-400/60 text-amber-100 text-sm leading-relaxed font-bold">${KEYWORD_GLOSSARY[kw]}</div>`;
  document.getElementById('detGrantedEffectsWrap')?.classList.add('hidden');
  document.getElementById('detActionBox')?.classList.add('hidden');
  document.getElementById('btnDetNavBack')?.addEventListener('click', (e) => {
    e.stopPropagation();
    popDetailNavStack();
  });
  panel.classList.remove('hidden');
}

function popDetailNavStack() {
  const prev = detailNavStack.pop();
  if (!prev) {
    battle.inspectedCard = null;
    document.getElementById('svDetailPanel')?.classList.add('hidden'); if (typeof syncDetailSelectionHighlight === 'function') syncDetailSelectionHighlight();
    return;
  }
  if (prev.type === 'card' && prev.state) {
    const s = prev.state;
    openCardDetailPanel(s.inst, s.location, s.side, s.lane, null, true);
  }
}


function syncDetailSelectionHighlight() {
  document.querySelectorAll('.cf-detail-selected').forEach(el => el.classList.remove('cf-detail-selected'));
  document.querySelectorAll('.cf-inspect-reticle').forEach(el => el.remove());
  const panel = document.getElementById('svDetailPanel');
  if (!panel || panel.classList.contains('hidden')) return;
  const info = battle && battle.inspectedCard;
  if (!info || !info.inst) return;
  let targetEl = null;
  if (info.location === 'hand' && info.inst.uid) {
    targetEl = document.querySelector(`#playerHandZone .sv-hand-card[data-card-uid="${info.inst.uid}"]`);
  } else if (info.location === 'board' && info.lane >= 0) {
    const cell = getLaneDOM(info.side, info.lane);
    if (cell && cell.firstElementChild && battle.board[info.side] && battle.board[info.side][info.lane] === info.inst) {
      targetEl = cell.firstElementChild;
    }
  }
  if (targetEl) {
    targetEl.classList.add('cf-detail-selected');
    const ret = document.createElement('div');
    ret.className = 'cf-inspect-reticle';
    ret.innerHTML = `
      <svg class="cf-reticle-svg" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
        <g class="cf-reticle-outer-spin">
          <circle cx="60" cy="60" r="50" fill="none" stroke="#fde047" stroke-width="2.8" stroke-dasharray="12 6 4 6" opacity="1"/>
          <circle cx="60" cy="60" r="44" fill="none" stroke="#fef08a" stroke-width="1.5" opacity="0.85"/>
          <polygon points="60,4 65,16 60,22 55,16" fill="#fde047" opacity="1"/>
          <polygon points="60,116 65,104 60,98 55,104" fill="#fde047" opacity="1"/>
          <polygon points="4,60 16,55 22,60 16,65" fill="#fde047" opacity="1"/>
          <polygon points="116,60 104,55 98,60 104,65" fill="#fde047" opacity="1"/>
        </g>
        <g class="cf-reticle-inner-spin">
          <circle cx="60" cy="60" r="32" fill="none" stroke="#38bdf8" stroke-width="2.4" stroke-dasharray="7 5" opacity="0.98"/>
          <polygon points="60,22 68,52 98,60 68,68 60,98 52,68 22,60 52,52" fill="none" stroke="#e0f2fe" stroke-width="2.0" stroke-linejoin="round" opacity="0.96"/>
          <polygon points="60,33 87,60 60,87 33,60" fill="none" stroke="#fde047" stroke-width="1.8" opacity="0.92"/>
        </g>
        <circle class="cf-reticle-core-glow" cx="60" cy="60" r="8" fill="#fef9c3" opacity="0.95"/>
      </svg>`;
    targetEl.appendChild(ret);
  }
}

function openCardDetailPanel(inst, location, side, lane, anchorEl = null, keepStack = false) {
  document.querySelectorAll('.sv-hand-card.is-inspected').forEach(el => el.classList.remove('is-inspected'));
  if (inst && inst.uid) {
    const hEl = document.querySelector(`#playerHandZone .sv-hand-card[data-card-uid="${inst.uid}"]`);
    if (hEl) hEl.classList.add('is-inspected');
  }
  if (!keepStack) detailNavStack = [];
  battle.inspectedCard = { inst, location, side, lane };
  const panel = document.getElementById('svDetailPanel');
  const c = inst.data;
  const pst = battle.leaders[inst.owner] || battle.leaders[0];
  const playEval = location === 'hand' ? evaluateCardPlayState(inst.owner, inst) : { mode: 'normal', activeSection: '' };

  const logPanel = document.getElementById('battleRecordPanel');
  const isLogOpen = logPanel && !logPanel.classList.contains('hidden');
  if (location === 'log' || isLogOpen) {
    const logRect = logPanel ? logPanel.getBoundingClientRect() : null;
    const refRect = anchorEl ? anchorEl.getBoundingClientRect() : logRect;
    const baseRight = logRect ? logRect.right : 520;
    const leftPos = Math.max(12, Math.min(window.innerWidth - 410, baseRight + 14));
    const topPos = refRect ? Math.min(window.innerHeight - 420, Math.max(56, refRect.top - 16)) : 72;
    panel.style.setProperty('left', `${leftPos}px`, 'important');
    panel.style.setProperty('top', `${topPos}px`, 'important');
  } else {
    panel.style.removeProperty('left');
    panel.style.removeProperty('top');
  }

  const effEnergy = playEval.costE !== undefined ? playEval.costE : getEffectiveEnergy(inst, pst);
  const typeLabel = c.type === 'minion' ? '随从' : (c.type === 'amulet' ? '护符' : '法术');
  document.getElementById('detEnergyBadge').textContent = effEnergy;
  document.getElementById('detCardName').textContent = c.name;
  document.getElementById('detCardSub').textContent = `${typeLabel}${c.race ? ' · ' + c.race : ''} · ${c.rarity} (价值:${getCardCostValue(c)})`;

  const costsHtml = [`<span class="${effEnergy < c.energy ? 'text-emerald-300' : 'text-sky-300'}">⚡能量 ${effEnergy}${effEnergy < c.energy ? ` (原${c.energy})` : ''}</span>`];
  if (c.sacrifice > 0) costsHtml.push(`<span class="text-rose-300">🩸祭品 ${c.sacrifice}${c.sacrificeCond ? '('+c.sacrificeCond+')' : ''}</span>`);
  if (c.bones > 0) costsHtml.push(`<span class="text-amber-300">🦴骨头 ${c.bones}</span>`);
  if (inst.countdown !== null && inst.countdown !== undefined) {
    costsHtml.push(`<span class="text-cyan-300">⏳倒计时 ${inst.countdown}</span>`);
  }
  document.getElementById('detCostsRow').innerHTML = costsHtml.join(' ');

  if (c.type === 'minion') {
    const atkBuffed = inst.currentAtk > (c.atk || 0);
    const hpBuffed = inst.currentHp > (c.hp || 1);
    const hpDamaged = inst.currentHp < inst.maxHp;
    document.getElementById('detStatsRow').innerHTML = `<span class="${atkBuffed ? 'text-emerald-300' : 'text-sky-300'}">⚔️ ${inst.currentAtk}</span> <span class="${hpDamaged ? 'text-rose-400' : (hpBuffed ? 'text-emerald-300' : 'text-rose-300')}">❤️ ${inst.currentHp}/${inst.maxHp}</span>`;
  } else if (c.type === 'amulet') {
    document.getElementById('detStatsRow').innerHTML = `<span class="text-emerald-300">⛩️ 护符${inst.countdown !== null ? ` · ⏳${inst.countdown}` : ''}</span>`;
  } else {
    document.getElementById('detStatsRow').innerHTML = `<span class="text-amber-300">✨ 法术</span>`;
  }

  const segBox = document.getElementById('detSegmentedEffects');
  segBox.innerHTML = '';
  if (detailNavStack.length > 0) {
    const navBar = document.createElement('div');
    navBar.className = 'flex items-center justify-between gap-2 pb-1';
    navBar.innerHTML = `<button type="button" id="btnDetCardBack" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-amber-400/60 text-amber-200 font-black text-xs cursor-pointer">◀ 返回上一页</button><span class="text-[11px] text-cyan-300 font-bold">关联卡牌查看中</span>`;
    segBox.appendChild(navBar);
    navBar.querySelector('#btnDetCardBack')?.addEventListener('click', (e) => { e.stopPropagation(); popDetailNavStack(); });
    if (location === 'ref') {
      const refFaceWrap = document.createElement('div');
      refFaceWrap.className = 'flex justify-center py-1';
      const refFace = buildHandCardDOM(c, null, 0);
      refFace.style.cursor = 'default';
      refFace.style.transform = 'scale(0.92)';
      refFace.style.transformOrigin = 'top center';
      refFaceWrap.appendChild(refFace);
      segBox.appendChild(refFaceWrap);
    }
  }
  if (c.sacrifice > 0 || c.sacrificeCond) {
    const sacBox = document.createElement('div');
    sacBox.className = 'p-2.5 rounded-xl bg-rose-950/75 border-2 border-rose-400/75 text-rose-100 text-xs font-black shadow';
    sacBox.innerHTML = `🩸 祭品条件：打出时需破坏己方场上 <span class="text-amber-300">${c.sacrifice || 1}</span> 个${c.sacrificeCond ? `「<span class="text-amber-200">${c.sacrificeCond}</span>」` : '任意'}随从`;
    segBox.appendChild(sacBox);
  }
  const curX = inst ? getDynamicCardXValue(c, inst) : null;
  const rawLines = getCardDisplayText(c, inst).split('\n').filter(Boolean);
  if (curX !== null) rawLines.push(`💡 当前 X = ${curX}`);
  if (inst && c.id === 'cmwget8v364ar' && location === 'hand' && battle && battle.leaders && battle.leaders[inst.owner]) {
    const dSt = battle.leaders[inst.owner];
    const lostHp = Math.max(0, (dSt.maxHp || 30) - dSt.hp);
    const tiers = [3, 6, 9, 15, 21, 27].filter(t => lostHp >= t).length;
    rawLines.push(`💡 当前已损失 ${lostHp} 点生命：入场曲将获得 +${tiers}/+${tiers}（预计身材 ${inst.currentAtk + tiers}/${inst.currentHp + tiers}）`);
  }
  rawLines.forEach(line => {
    const block = document.createElement('div');
    const isCrystalLine = line.includes('【结晶') || line.includes('【激奏');
    const isEnhanceLine = line.includes('【爆能强化') || line.includes('【连击') || line.includes('【融合】') || line.includes('若己方战场上有') || line.includes('若打出后');
    const richLine = formatInteractiveDetailHTML(line, c.name);

    if (location === 'hand' && ((playEval.activeSection === 'crystallize' || playEval.activeSection === 'accelerate') && isCrystalLine)) {
      block.className = 'p-2.5 rounded-xl bg-sky-950/90 border-2 border-cyan-300 shadow-[0_0_16px_rgba(56,189,248,0.6)] text-cyan-100 font-bold leading-relaxed';
      block.innerHTML = `<div class="text-[11px] text-cyan-300 font-black mb-1">✦ 当前打出生效分支</div><div>${richLine}</div>`;
    } else if (location === 'hand' && (playEval.glow === 'sv-glow-yellow' && (isEnhanceLine || rawLines.length === 1))) {
      block.className = 'p-2.5 rounded-xl bg-amber-950/85 border-2 border-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.55)] text-amber-100 font-bold leading-relaxed';
      block.innerHTML = `<div class="text-[11px] text-amber-300 font-black mb-1">✦ 条件已满足 · 强化生效</div><div>${richLine}</div>`;
    } else {
      block.className = 'p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-100 leading-relaxed';
      block.innerHTML = richLine;
    }
    segBox.appendChild(block);
  });
  bindDetailInteractiveLinks(segBox);

  const grantedWrap = document.getElementById('detGrantedEffectsWrap');
  const grantedListEl = document.getElementById('detGrantedEffectsList');
  grantedListEl.innerHTML = '';
  const grantedItems = getCardGrantedEffectsList(inst, location);
  if (grantedItems.length > 0) {
    grantedWrap.classList.remove('hidden');
    grantedItems.forEach((gTxt, idx) => {
      const row = document.createElement('div');
      row.className = 'px-3 py-2 rounded-lg bg-gradient-to-r from-amber-950/90 via-slate-900/95 to-slate-900/90 border-l-4 border-amber-400 border border-amber-500/35 text-amber-100 font-bold flex items-center gap-2 shadow';
      row.innerHTML = `<span class="w-4 h-4 rounded-full bg-amber-500/25 border border-amber-300 text-[10px] text-amber-200 flex items-center justify-center shrink-0">${idx + 1}</span><span>${gTxt}</span>`;
      grantedListEl.appendChild(row);
    });
  } else {
    grantedWrap.classList.add('hidden');
  }

  const actBox = document.getElementById('detActionBox');
  const actBtn = document.getElementById('btnDetailAction');
  actBox.classList.add('hidden');

  const ast = c.ast || parseCardEffectAST(c);
  const hasFuseKw = Boolean(ast.fuse || (c.keywords || []).some(kw => kw.k === '融合') || String(c.fullText || '').includes('【融合】'));
  const canControlThisSide = (side === 0 && battle.activeSide === 0) || (battleMode === 'pvp_pass' && side === battle.activeSide);

  if (canControlThisSide && !battle.gameOver && !battle.animating) {
    const actInfo = location === 'board' ? cfGetActivateInfo(side, lane) : null;
    if (actInfo && actInfo.available) {
      actBox.classList.remove('hidden');
      const { eCost, bCost, sCost, extraCondReason } = actInfo;
      const canAct = actInfo.ok && (battleMode !== 'pvp_online' || onlineIsMyTurn());
      actBtn.disabled = !canAct;
      const costLbl = [eCost > 0 ? `能量${eCost}` : '', sCost > 0 ? `祭品${sCost}` : '', bCost > 0 ? `骨头${bCost}` : ''].filter(Boolean).join(' ') || '能量0';
      actBtn.textContent = inst.activatedThisTurn ? '本回合已发动【启动】' : `⚡ 启动 (消耗${costLbl})${extraCondReason}`;
      actBtn.onclick = async () => {
        if (!canAct) return;
        if (actInfo.need === 'hand_card') {
          openSingleHandPickModal(inst, [...pst.hand], '【龙心秘宝·启动】请选择 1 张手牌将其弃置，并获得 1 张『雏龙的蛋』', async (discardedCard) => {
            await cfRequestActivate(side, lane, { handTargetUid: discardedCard.uid });
            if (battle.board[side][lane] === inst) openCardDetailPanel(inst, 'board', side, lane);
          });
          return;
        }
        if (actInfo.need === 'enemy_minion') {
          // 进入选目标模式：由 onBoardLaneClicked 收集目标后调用 cfRequestActivate
          battle.pendingActivate = { side, lane, inst, eCost, bCost };
          document.getElementById('svDetailPanel').classList.add('hidden');
          showSacrificeGuideBanner(`🎯 ${c.name}·启动`, c.id === 'cmwlomedyjchl' ? '请点击 1 个敌方随从，对其造成 3 点伤害并召唤 1 个『骷髅』' : `请点击 1 个敌方随从，对其造成 ${inst.currentAtk} 点伤害`);
          renderAllBattleUI();
          return;
        }
        await cfRequestActivate(side, lane, {});
        if (battle.board[side][lane] === inst) openCardDetailPanel(inst, 'board', side, lane);
      };
    } else if (location === 'hand' && hasFuseKw) {
      actBox.classList.remove('hidden');
      const fuseInfo = getFuseRuleInfo(c);
      const validMaterials = pst.hand.filter(h => h !== inst && fuseInfo.matchFn(h));
      const canFuse = !inst.fusedThisTurn && validMaterials.length > 0;
      actBtn.disabled = !canFuse;
      actBtn.textContent = inst.fusedThisTurn
        ? `本回合已【融合】(累计融合 ${inst.fusedCount || 0} 张)`
        : (validMaterials.length === 0 ? `🧬 融合 (手牌无符合条件的${fuseInfo.label})` : `🧬 融合 (${fuseInfo.label} · 可选${validMaterials.length}张)`);
      actBtn.onclick = () => {
        if (!canFuse) return;
        sfx.play('click');
        openMultiFuseModal(inst, validMaterials, fuseInfo);
      };
    }
  }

  panel.classList.remove('hidden');
  syncDetailSelectionHighlight();
}

function executeCardFusionLogic(side, sourceInst, fusedHandCards) {
  if (!sourceInst || !fusedHandCards || fusedHandCards.length === 0) return;
  const st = battle.leaders[side];
  const count = fusedHandCards.length;
  const uidSet = new Set(fusedHandCards.map(h => h.uid));
  const fusedNames = fusedHandCards.map(h => h.data.name).join('、');
  st.hand = st.hand.filter(h => !uidSet.has(h.uid));
  sourceInst.fusedThisTurn = true;
  sourceInst.fusedCount = (sourceInst.fusedCount || 0) + count;
  addGrantedEffect(sourceInst, `来源：【融合素材：${fusedNames}】 → 融合张数 +${count}`);

  const fuseInfo = getFuseRuleInfo(sourceInst.data);
  if (fuseInfo.costReducePerCard > 0) {
    const red = fuseInfo.costReducePerCard * count;
    sourceInst.costReduction = (sourceInst.costReduction || 0) + red;
  }
  const fuseCardIcon = { id: 'sys_fusion', name: '敌方融合', type: 'spell', rarity: '史诗', energy: 0, bones: 0, sacrifice: 0 };
  const fuseEffectDesc = `敌方发动【融合】（消耗 ${count} 张手牌素材${fuseInfo.costReducePerCard > 0 ? '，目标卡牌能量费用减少' : ''}）`;
  if (side === 1 && battleMode !== 'pvp_online') {
    showTriggeredEffectToast(fuseCardIcon, fuseEffectDesc, 260);
  }
}

function openMultiFuseModal(sourceInst, validMaterials, fuseInfo = null) {
  battle.multiFuseUids.clear();
  const info = fuseInfo || getFuseRuleInfo(sourceInst.data);
  const modal = document.getElementById('handPickModal');
  document.getElementById('handPickSourceTitle').textContent = `【融合】${sourceInst.data.name}`;
  document.getElementById('handPickSourceDesc').textContent = `素材要求：${info.label}
选择1张或多张手牌进行融合，被融合的手牌将直接消失并触发融合强化效果（每张卡每回合限融合1次）。`;
  const confirmBtn = document.getElementById('btnConfirmMultiFuse');
  confirmBtn.classList.remove('hidden');

  const renderGrid = () => {
    document.getElementById('handPickPromptTitle').textContent = `🧬 请点击勾选要融合的「${info.label}」（已选 ${battle.multiFuseUids.size} 张）`;
    const grid = document.getElementById('handPickCardsGrid');
    grid.innerHTML = '';
    validMaterials.forEach(hc => {
      const cardEl = buildHandCardDOM(hc.data, hc);
      cardEl.classList.add('hand-pick-card-item', 'interactive-zone', 'pointer-events-auto');
      cardEl.style.cursor = 'pointer';
      if (battle.multiFuseUids.has(hc.uid)) {
        cardEl.classList.add('sv-glow-yellow');
      }
      cardEl.addEventListener('click', (e) => {
        e.stopPropagation();
        sfx.play('click');
        if (battle.multiFuseUids.has(hc.uid)) battle.multiFuseUids.delete(hc.uid);
        else battle.multiFuseUids.add(hc.uid);
        renderGrid();
      });
      grid.appendChild(cardEl);
    });
  };
  renderGrid();

  confirmBtn.onclick = async (e) => {
    e.stopPropagation();
    if (battle.multiFuseUids.size === 0) return;
    modal.classList.add('hidden');
    modal.style.display = 'none';
    const side = sourceInst.owner || 0;
    const r = await cfRequestFusion(side, sourceInst.uid, [...battle.multiFuseUids]);
    const still = battle.leaders[side].hand.find(h => h.uid === sourceInst.uid);
    if (r.ok && still) openCardDetailPanel(still, 'hand', side, -1);
    renderAllBattleUI();
  };

  modal.classList.remove('hidden');
  modal.style.display = 'flex';
}

document.getElementById('btnCloseDetail').addEventListener('click', () => {
  sfx.play('click');
  battle.inspectedCard = null;
  document.getElementById('svDetailPanel').classList.add('hidden'); document.querySelectorAll('#playerHandZone .sv-hand-card.is-inspected').forEach(el => el.classList.remove('is-inspected')); if (typeof syncDetailSelectionHighlight === 'function') syncDetailSelectionHighlight();
});

