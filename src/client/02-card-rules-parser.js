function hasRace(cData, targetRace) {
  if (!cData || !targetRace) return false;
  if (targetRace === '机械' && isMechCard(cData)) return true;
  const raw = String(cData.race || '');
  const parts = raw.split(/[，,、/\s]+/).map(s => s.trim()).filter(Boolean);
  return parts.includes(targetRace);
}

// 卡牌标准费用价值计算公式：能量×1 + 祭品×1.5 + 骨头×0.5
function getCardCostValue(cData) {
  if (!cData) return 0;
  if (cData.value !== undefined && cData.value !== null && !Number.isNaN(Number(cData.value))) {
    return Number(Number(cData.value).toFixed(1));
  }
  return Number((Number(cData.energy || 0) * 1.0 + Number(cData.bones || 0) * 0.5 + Number(cData.sacrifice || 0) * 1.5).toFixed(1));
}

function formatCardValueText(val) {
  const n = Number(val || 0);
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, '');
}

function normalizeSummonCostFilter(costOrEnergy) {
  if (typeof costOrEnergy === 'number') {
    return { energy: costOrEnergy, sacrifice: 0, bones: 0, value: 0 };
  }
  const c = costOrEnergy || {};
  return {
    energy: Number(c.energy || 0),
    sacrifice: Number(c.sacrifice || 0),
    bones: Number(c.bones || 0),
    value: Number(c.value || 0)
  };
}

function matchesSummonCostFilter(cardData, costOrEnergy) {
  if (!cardData) return false;
  const f = normalizeSummonCostFilter(costOrEnergy);
  const val = getCardCostValue(cardData);
  const e = Number(cardData.energy || 0);
  const s = Number(cardData.sacrifice || 0);
  const b = Number(cardData.bones || 0);

  if (f.value > 0) {
    if (val > f.value) return false;
    if (f.energy > 0 && e > f.energy) return false;
    if (f.sacrifice > 0 && s > f.sacrifice) return false;
    if (f.bones > 0 && b > f.bones) return false;
    return true;
  }
  // 价值以外的费用体系，只能召唤该体系且单体系的随从
  if (f.energy > 0 && f.sacrifice === 0 && f.bones === 0) {
    return s === 0 && b === 0 && e <= f.energy;
  }
  if (f.sacrifice > 0 && f.energy === 0 && f.bones === 0) {
    return e === 0 && b === 0 && s > 0 && s <= f.sacrifice;
  }
  if (f.bones > 0 && f.energy === 0 && f.sacrifice === 0) {
    return e === 0 && s === 0 && b > 0 && b <= f.bones;
  }
  return (f.energy <= 0 ? e === 0 : e <= f.energy)
    && (f.sacrifice <= 0 ? s === 0 : s <= f.sacrifice)
    && (f.bones <= 0 ? b === 0 : b <= f.bones);
}

function parseReansCostTag(tagStr) {
  const txt = String(tagStr || '');
  const em = txt.match(/能量(\d+)/);
  const sm = txt.match(/祭品(\d+)/);
  const bm = txt.match(/骨头(\d+)/);
  const vm = txt.match(/价值(\d+(?:\.\d+)?)/);
  return {
    energy: em ? Number(em[1]) : 0,
    sacrifice: sm ? Number(sm[1]) : 0,
    bones: bm ? Number(bm[1]) : 0,
    value: vm ? Number(vm[1]) : 0
  };
}

function getInitialCountdown(cData) {
  if (!cData) return 0;
  for (const kw of (cData.keywords || [])) {
    if (kw.k === '倒计时' && Number(kw.v || 0) > 0) return Number(kw.v);
  }
  const m = String(cData.fullText || cData.text || '').match(/倒计时_(\d+)/);
  if (m) return Number(m[1]);
  if (Number(cData.countdown || 0) > 0) return Number(cData.countdown);
  if (Number(cData.timer || 0) > 0) return Number(cData.timer);
  return 0;
}

function parseCardEffectAST(cardData) {
  const full = String(cardData.fullText || cardData.text || '').trim();
  const ast = {
    fanfare: [], lastWords: [], onEnter: [], turnEnd: [], onAttack: [], countdownEnd: [],
    enhance: null, crystallize: null, accelerate: null, combo: null,
    activate: null, fuse: null, spellMain: [], countdown: getInitialCountdown(cardData)
  };

  (cardData.keywords || []).forEach(kw => {
    const k = kw.k || '';
    const eff = kw.effect || '';
    if (k === '入场曲' && eff) ast.fanfare.push(...parseSentencesToActions(eff, cardData));
    if (k === '谢幕曲' && eff) ast.lastWords.push(...parseSentencesToActions(eff, cardData));
    if (k === '随从进场时' && eff) ast.onEnter.push(...parseSentencesToActions(eff, cardData));
    if (k === '回合结束时' && eff) ast.turnEnd.push(...parseSentencesToActions(eff, cardData));
    if (k === '攻击时' && eff) ast.onAttack.push(...parseSentencesToActions(eff, cardData));
    if (k === '倒计时' && eff) ast.countdownEnd.push(...parseSentencesToActions(eff, cardData));
    if (k === '爆能强化') {
      const isBoneEnh = kw.res === '骨头' || kw.costType === '骨头' || String(cardData.fullText || '').includes('爆能强化_骨头');
      ast.enhance = { costType: isBoneEnh ? 'bones' : 'energy', cost: Number(kw.v || 5), text: eff, actions: parseSentencesToActions(eff, cardData) };
    }
    if (k === '结晶') {
      const crystCost = Number(kw.v || 1);
      const isEotCryst = /^回合结束时/.test(eff.trim());
      // 为缺失 timer/lw 的结晶卡牌补全标准倒计时与本体召唤谢幕曲，防止结晶化护符永久滞留占格
      const CRYST_DEFAULTS = {
        cmwm86ka6xbwr: { timer: 10, lw: '召唤1个双炮神罚' },
        cmwke161d7ba7: { timer: 3, lw: '召唤1个宫殿守卫' },
        cmwkduej4ymm6: { timer: 3, lw: '召唤1个蓄能炮手' }
      };
      const defCryst = CRYST_DEFAULTS[cardData.id] || {
        timer: Math.max(2, (Number(cardData.energy) || 3) - crystCost),
        lw: `召唤1个『${cardData.name}』到战场上`
      };
      const lwTxt = String(kw.lw || '').trim() || (String(kw.effect || '').match(/@谢幕曲[:：]\s*([\s\S]*)$/) || [])[1] || defCryst.lw;
      ast.crystallize = {
        cost: crystCost,
        text: eff,
        actions: isEotCryst ? [] : parseSentencesToActions(eff, cardData),
        timer: Number(kw.timer) || defCryst.timer
      };
      if (lwTxt) {
        ast.crystallize.lw = lwTxt;
        try { ast.crystallize.lwActions = parseSentencesToActions(lwTxt, cardData) || []; } catch (e) { ast.crystallize.lwActions = []; }
      }
    }
    if (k === '激奏') ast.accelerate = { cost: Number(kw.v || 1), text: eff, actions: parseSentencesToActions(eff, cardData) };
    if (k === '连击') ast.combo = { count: Number(kw.v || 3), text: eff, actions: parseSentencesToActions(eff, cardData) };
    if (k === '启动') {
      const eCost = kw.cost ? Number(kw.cost.energy || 0) : 0;
      const bCost = kw.cost ? Number(kw.cost.bones || 0) : 0;
      const sCost = kw.cost ? Number(kw.cost.sacrifice || 0) : 0;
      ast.activate = { energy: eCost, bones: bCost, sacrifice: sCost, text: eff, actions: parseSentencesToActions(eff, cardData) };
    }
    if (k === '融合') {
      ast.fuse = { filter: kw.fcond || kw.type || '', text: eff, actions: parseSentencesToActions(eff, cardData) };
    }
    (kw.reans || []).forEach(r => {
      const cf = normalizeSummonCostFilter(r.costs || { energy: 2 });
      const parts = [];
      if (cf.energy > 0) parts.push(`能量${cf.energy}`);
      if (cf.sacrifice > 0) parts.push(`祭品${cf.sacrifice}`);
      if (cf.bones > 0) parts.push(`骨头${cf.bones}`);
      if (cf.value > 0) parts.push(`价值${formatCardValueText(cf.value)}`);
      const act = {
        op: r.k === '招募' ? 'recruit' : 'reanimate',
        costFilter: cf,
        maxEnergy: cf.energy || 0,
        race: r.type || '',
        times: String(r.effect || '').includes('两次') || String(r.effect || '').includes('2次') ? 2 : 1,
        rawText: `【${r.k}_${parts.join('') || '能量2'}】${r.type ? '仅限「'+r.type+'」' : ''}${r.effect || ''}`
      };
      if (k === '谢幕曲') ast.lastWords.push(act);
      else if (k === '启动' && ast.activate) ast.activate.actions.push(act);
      else ast.fanfare.push(act);
    });
  });

  if (cardData.timerEffect && ast.countdownEnd.length === 0) {
    ast.countdownEnd.push(...parseSentencesToActions(cardData.timerEffect, cardData));
  }

  const lines = full.split(/\n+/);
  lines.forEach(rawLine => {
    const line = rawLine.trim();
    if (!line) return;
    let m;
    if ((m = line.match(/^【结晶(?:_能量)?(\d+)(?:·倒计时(\d+))?】(.*)$/))) {
      if (!ast.crystallize) {
        ast.crystallize = { cost: Number(m[1]), text: m[3], actions: parseSentencesToActions(m[3], cardData) };
        if (m[2]) ast.crystallize.timer = Number(m[2]) || 0;
      }
    } else if ((m = line.match(/^└\s*【谢幕曲】(.*)$/))) {
      if (ast.crystallize && !ast.crystallize.lw) {
        const lwTxt = m[1].trim();
        ast.crystallize.lw = lwTxt;
        try { ast.crystallize.lwActions = parseSentencesToActions(lwTxt, cardData) || []; } catch (e) { ast.crystallize.lwActions = []; }
      }
    } else if ((m = line.match(/^【激奏(?:_能量)?(\d+)】(.*)$/))) {
      ast.accelerate = { cost: Number(m[1]), text: m[2], actions: parseSentencesToActions(m[2], cardData) };
    } else if ((m = line.match(/^【爆能强化_(能量|骨头)?(\d+)】(.*)$/))) {
      if (!ast.enhance) ast.enhance = { costType: m[1] === '骨头' ? 'bones' : 'energy', cost: Number(m[2]), text: m[3], actions: parseSentencesToActions(m[3], cardData) };
    } else if ((m = line.match(/^【连击_(\d+)】(.*)$/))) {
      if (!ast.combo) ast.combo = { count: Number(m[1]), text: m[2], actions: parseSentencesToActions(m[2], cardData) };
    } else if ((m = line.match(/^【启动】(?:能量(\d+)：)?(.*)$/))) {
      if (!ast.activate) ast.activate = { energy: Number(m[1] || 0), text: m[2], actions: parseSentencesToActions(m[2], cardData) };
    } else if ((m = line.match(/^【融合】(?:「([^」]+)」：)?(.*)$/))) {
      if (!ast.fuse) ast.fuse = { filter: m[1] || '', text: m[2], actions: parseSentencesToActions(m[2], cardData) };
    } else if ((m = line.match(/^.*【倒计时_(\d+)】(.*)$/))) {
      if (!ast.countdown) ast.countdown = Number(m[1]);
      if (m[2] && ast.countdownEnd.length === 0) ast.countdownEnd.push(...parseSentencesToActions(m[2], cardData));
    } else if (line.startsWith('【入场曲】') && ast.fanfare.length === 0 && !line.includes('【抉择】')) {
      ast.fanfare.push(...parseSentencesToActions(line.replace('【入场曲】', ''), cardData));
    } else if (line.startsWith('【谢幕曲】') && ast.lastWords.length === 0) {
      ast.lastWords.push(...parseSentencesToActions(line.replace('【谢幕曲】', ''), cardData));
    } else if ((line.startsWith('【回合结束时】') || line.startsWith('回合结束时')) && ast.turnEnd.length === 0) {
      ast.turnEnd.push(...parseSentencesToActions(line.replace(/^【?回合结束时】?[，：]?/, ''), cardData));
    } else if (line.startsWith('【攻击时】') && ast.onAttack.length === 0) {
      ast.onAttack.push(...parseSentencesToActions(line.replace('【攻击时】', ''), cardData));
    } else if (cardData.type === 'spell' && !line.startsWith('【')) {
      ast.spellMain.push(...parseSentencesToActions(line, cardData));
    }
  });

  return ast;
}

function parseSentencesToActions(text, cardData) {
  const actions = [];
  if (!text) return actions;
  const normalized = text
    .replace(/选择(对手|己方|敌方|友方)?(?:的战场上的)?1个(生命值\d+以下)?(?:敌方|友方)?随从，?(?:对其|使其)/g, '选择$11个$2随从')
    .replace(/，(?=(?:抽取|抽\d|选择|召唤|将\d|骨头\+|使自己的骨头\+|获得\d+骨头|回复|破坏|变身为|对(?:对手|己方|敌方|正对面|面前)|【招募|【亡者召还))/g, '。');
  const clauses = normalized.split(/[。；\n]+/).map(s => s.trim()).filter(Boolean);

  clauses.forEach(s => {
    let m;
    if ((m = s.match(/变身为『?([^』。，\s]+)』?/))) {
      actions.push({ op: 'transform_self', targetName: m[1], rawText: s });
      return;
    }
    if ((m = s.match(/【(招募|亡者召还)_([^】]+)】(?:仅限「([^」]+)」)?(?:，?发动(\d+|两)次)?/))) {
      const cf = parseReansCostTag(m[2]);
      actions.push({
        op: m[1] === '招募' ? 'recruit' : 'reanimate',
        costFilter: cf,
        maxEnergy: cf.energy || 0,
        race: m[3] || '',
        times: (m[4] === '两' || m[4] === '2') ? 2 : Number(m[4] || 1),
        rawText: s
      });
      return;
    }
    if ((m = s.match(/(?:骨头\+|获得)(\d+)(?:点)?骨头|骨头\+(\d+)/))) {
      const amt = Number(m[1] || m[2] || 1);
      actions.push({ op: 'add_bones', amount: amt, rawText: `骨头+${amt}` });
    }
    if ((m = s.match(/抽取?(\d+|一|两|三)张(?:「?([^」随从卡]+)」?随从卡?|卡牌|牌)/))) {
      const mapN = { '一': 1, '两': 2, '三': 3 };
      const cnt = mapN[m[1]] || Number(m[1] || 1);
      actions.push({ op: 'draw', count: cnt, race: m[2] || '', rawText: s });
    }
    if ((m = s.match(/将(\d+|一|两)张(?:『([^』]+)』|和([^同]+)同名的随从|([^\s，。]+?))(?:置入|加入)(?:自己的|你的|自己)?手牌/))) {
      const cnt = m[1] === '一' ? 1 : (m[1] === '两' ? 2 : Number(m[1]));
      const targetName = m[2] || m[3] || m[4] || cardData.name;
      actions.push({ op: 'add_hand', cardName: targetName.replace('本随从', cardData.name), count: cnt, rawText: s });
    }
    if ((m = s.match(/召唤(\d+|一|两|三|四)个?(?:只|张)?(?:『([^』]+)』|([^\s，。]+?同名的随从)|([^\s，。]+?))(?:到(?:己方|已方)?战场上|加入战场|$)/))) {
      const mapNum = { '一': 1, '两': 2, '三': 3, '四': 4 };
      const cnt = mapNum[m[1]] || Number(m[1] || 1);
      let targetName = (m[2] || m[3] || m[4] || cardData.name)
        .replace('同名的随从', '')
        .replace('和本随从', cardData.name)
        .replace('自己', cardData.name)
        .replace('本随从', cardData.name)
        .replace(/到(?:己方|已方)?战场上?$/, '');
      actions.push({ op: 'summon', cardName: targetName, count: cnt, rawText: s });
    }
    if ((m = s.match(/对(?:面前三侧|面前及相邻|正对面与左右相邻三列|前面和相邻)的?(?:敌方)?随从造成(\d+)点伤害/))) {
      actions.push({ op: 'damage_front_three_minions', damage: Number(m[1]), rawText: s });
    } else if ((m = s.match(/对(?:正对面|面前)的?(?:敌方)?敌人造成(\d+)点伤害/))) {
      actions.push({ op: 'damage_front_enemy', damage: Number(m[1]), rawText: s });
    } else if ((m = s.match(/对(?:正对面|面前)的(?:敌方)?随从造成(\d+)点伤害/))) {
      actions.push({ op: 'damage_front_minion', damage: Number(m[1]), rawText: s });
    } else if ((m = s.match(/对(对手|己方|敌方)的?战场上的所有随从(和(?:对手|己方|敌方)的?主战者)?分配(\d+)点伤害/))) {
      actions.push({ op: 'distribute_damage', targetSideType: m[1] === '己方' ? 'self' : 'enemy', includeLeader: Boolean(m[2]), damage: Number(m[3]), rawText: s });
    } else if ((m = s.match(/对(对手|己方|敌方)的?(?:战场上的?)?(?:所有随从|全体随从|随从全体)造成(\d+)点伤害/))) {
      actions.push({ op: 'aoe_damage', targetSideType: m[1] === '己方' ? 'self' : 'enemy', damage: Number(m[2]), rawText: s });
    } else if (s.includes('破坏') && (s.includes('所有随从') || s.includes('全体随从'))) {
      const bothSides = !s.includes('对手') && !s.includes('敌方');
      actions.push({ op: 'aoe_destroy', bothSides, rawText: s });
    } else if ((m = s.match(/对(?:对手|敌方)的主战者造成(\d+)点伤害/))) {
      actions.push({ op: 'leader_damage', damage: Number(m[1]), rawText: s });
    } else if ((m = s.match(/回复(?:(?:自己的|己方)主战者)?(\d+)点生命值/))) {
      actions.push({ op: 'heal_leader', amount: Number(m[1]), rawText: s });
    } else if ((m = s.match(/选择(对手|己方|敌方|友方)?(?:战场上)?1个生命值(?:为)?(\d+)以下的?(?:敌方|友方)?随从，?(?:使其)?【?消失】?/))) {
      const isSelf = m[1] === '己方' || m[1] === '友方';
      actions.push({ op: 'banish_target_hp', maxHp: Number(m[2]), needTarget: isSelf ? 'friendly_minion' : 'enemy_minion_hp', rawText: s });
    } else if (s.includes('选择') && s.includes('随从') && s.includes('消失')) {
      const isSelf = s.includes('己方') || s.includes('友方');
      actions.push({ op: 'banish_target', sameNameAll: s.includes('同名'), needTarget: isSelf ? 'friendly_minion' : 'enemy_minion', rawText: s });
    } else if (s.includes('选择') && s.includes('随从') && s.includes('破坏')) {
      const isSelf = s.includes('己方') || s.includes('友方');
      actions.push({ op: 'destroy_target', needTarget: isSelf ? 'friendly_minion' : 'enemy_minion', rawText: s });
    } else if ((m = s.match(/(?:选择(对手|己方|敌方|友方)?1个随从|对(?:其|该随从)|改为对其)造成(\d+)点伤害/))) {
      const isSelf = m[1] === '己方' || m[1] === '友方';
      actions.push({ op: 'damage_target', damage: Number(m[2]), needTarget: isSelf ? 'friendly_minion' : 'enemy_minion', rawText: s });
    }
    if ((m = s.match(/其他([^\s获]+)?随从获得\+(\d+)\/\+?(\d+)/))) {
      actions.push({ op: 'buff_allies', race: m[1] || '', atk: Number(m[2]), hp: Number(m[3]), rawText: s });
    }
    if ((m = s.match(/下一[张场]([^\s随]+)?随从卡?(?:能量)?(?:费用)?-(\d+)/))) {
      actions.push({ op: 'discount_next', amount: Number(m[2]), rawText: s });
    }
  });

  return actions;
}

