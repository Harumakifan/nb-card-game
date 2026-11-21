// 商业级全流派高智商战术 AI 引擎（严格执行 v2.1 卡牌费用价值公式：能量×1 + 祭品×1.5 + 骨头×0.5）
// 规则：
// 1. 献祭、破坏自己随从等效果绝不以高价值随从为目标，祭品的价值不能大于等于当前打出的献祭类随从的价值！
// 2. 当要献祭时，若场上低价值随从不足，先检查手中是否有低价值随从可以打出，先打出低价值随从再献祭！
// 3. 价值同等的情况下，优先选择当前生命值和攻击力较低的随从献祭！
// ============================================================================
function analyzeMinionKillValueForAI(m, isBanish = false) {
  if (!m || m.data.type === 'amulet') return 0;
  const c = m.data;
  const kw = m.activeKw || {};
  const ast = c.ast || parseCardEffectAST(c);
  const aiHp = battle.leaders[1] ? battle.leaders[1].hp : 30;
  const playerBoardAtk = battle.board[0].reduce((sum, x) => sum + (x && x.data.type === 'minion' ? x.currentAtk * Math.max(1, (x.activeKw && x.activeKw['多重攻击']) || 1) : 0), 0);
  const dangerMultiplier = 1.0 + Math.max(0, (30 - aiHp) / 22) + (playerBoardAtk >= aiHp * 0.5 ? 0.5 : 0);

  const swings = Math.max(1, kw['多重攻击'] || 1);
  let score = (m.currentAtk * swings * 18 * dangerMultiplier) + (m.currentHp * 7) + getCardCostValue(c) * 4;

  const isEvolvingCountdown = m.countdown !== null && m.countdown > 0 && (String(c.timerEffect || '').includes('变身为') || String(c.fullText || '').includes('变身为'));
  if (isEvolvingCountdown) {
    // 通用机制：具有倒计时进化/变身成长的随从（如雏龙/喷火龙/飞龙/远古巨龙等）留场越久滚雪球越猛，倒计时越临近解场优先级越高
    score += (m.countdown === 1 ? 195 : 145) + m.currentAtk * 12;
  } else if (m.countdown !== null) {
    score += hasRace(c, '龙族') ? 95 : 48;
  }
  if (['cmwbxu7u3tpyo','cmwdw2v21c73r','cmwgyfgvst9r1','cmwgccmsj2ypl','cmwgd56lg867w'].includes(c.id)) score += (c.id === 'cmwbxu7u3tpyo' ? 160 : 95);
  if (isMechCard(c)) {
    const oppMechCnt = battle.board[0].filter(x => x && x.data.type === 'minion' && isMechCard(x.data)).length;
    if (oppMechCnt >= 3) score += 220;
    else if (oppMechCnt === 2) score += 95;
  }
  if ((ast.onEnter && ast.onEnter.length > 0) || String(c.fullText || '').includes('每当')) score += 65;
  if ((ast.turnEnd && ast.turnEnd.length > 0) || String(c.fullText || '').includes('回合结束')) score += 48;
  if (ast.activate || (c.keywords || []).some(k => k.k === '启动')) score += 45;
  if ((ast.onAttack && ast.onAttack.length > 0) || m.grantedOnAttackAoe4) score += 95;

  if (kw['全体攻击']) score += 55;
  if (kw['三侧攻击']) score += 45;
  if (kw['两侧攻击']) score += 32;
  if (kw['毁灭']) score += 38;
  if (kw['虹吸']) score += 28;
  if (kw['飞行']) {
    // 通用机制：AI 缺乏防空随从阻挡时，飞行单位每回合都能稳定直击主战者，威胁度大幅上调
    const aiHasAntiAir = battle.board[1].some(am => am && am.data.type === 'minion' && am.activeKw && am.activeKw['防空']);
    score += (aiHasAntiAir ? 36 : 82) + m.currentAtk * 12;
  }
  if ((isEvolvingCountdown || kw['飞行'] || (ast.onAttack && ast.onAttack.length > 0)) && m.currentHp <= 4 && !kw['屏障']) {
    score += 35; // 脆皮高威胁成长/飞行/攻击特效引擎优先点杀止损
  }
  if (kw['守护']) score += 24;
  if (kw['屏障']) score += 18;
  if (kw['防空']) score += 12;

  if (hasAnyLastWords(m)) {
    if (isBanish) score += 75;
    else score -= 18;
  }
  return score;
}

function cloneVirtualMinionForAI(m) {
  if (!m) return null;
  return {
    data: m.data,
    currentAtk: m.currentAtk !== undefined ? m.currentAtk : (m.data ? (m.data.atk || 0) : 0),
    currentHp: m.currentHp !== undefined ? m.currentHp : (m.data ? (m.data.hp || 1) : 1),
    activeKw: Object.assign({}, m.activeKw || {}),
    countdown: m.countdown !== undefined ? m.countdown : null,
    grantedOnAttackAoe4: Boolean(m.grantedOnAttackAoe4),
    shiftDir: m.shiftDir || 1
  };
}

// 精确模拟 summonByNameAnimated 的连环放置落点（以起始位为基准，优先向右连续，碰壁或阻挡则回起始位向左连续，再从左往右检视空位）
function simulateAISummonLanes(boardArr, sourceLane, count, includeSourceIfEmpty = false) {
  const simB = [...boardArr];
  const lanes = [];
  const hasOrigin = (sourceLane >= 0 && sourceLane < 5);
  let anchorLane = sourceLane;
  let cursor = sourceLane;
  let dir = (hasOrigin && (sourceLane + 1 >= 5 || simB[sourceLane + 1] !== null)) ? -1 : 1;

  for (let i = 0; i < count; i++) {
    let emptyL = -1;
    if (!hasOrigin) {
      emptyL = simB.findIndex(x => x === null);
    } else if (i === 0 && includeSourceIfEmpty && simB[sourceLane] === null) {
      emptyL = sourceLane;
      anchorLane = sourceLane;
      cursor = sourceLane;
      dir = (sourceLane + 1 >= 5 || simB[sourceLane + 1] !== null) ? -1 : 1;
    } else if (dir === 1) {
      if (cursor + 1 < 5 && simB[cursor + 1] === null) {
        emptyL = cursor + 1;
        cursor = emptyL;
      } else {
        dir = -1;
        for (let l = anchorLane - 1; l >= 0; l--) {
          if (simB[l] === null) { emptyL = l; break; }
        }
        if (emptyL !== -1) {
          cursor = emptyL;
        } else {
          for (let l = 0; l < 5; l++) {
            if (simB[l] === null) { emptyL = l; break; }
          }
          if (emptyL !== -1) { dir = 1; cursor = emptyL; }
        }
      }
    } else {
      if (cursor - 1 >= 0 && simB[cursor - 1] === null) {
        emptyL = cursor - 1;
        cursor = emptyL;
      } else {
        for (let l = 0; l < 5; l++) {
          if (simB[l] === null) { emptyL = l; break; }
        }
        if (emptyL !== -1) { dir = 1; cursor = emptyL; }
      }
    }
    if (emptyL === -1) break;
    simB[emptyL] = { virtualToken: true };
    lanes.push(emptyL);
  }
  return lanes;
}

// 判定敌方随从是否具有持续/触发类特殊威胁效果（毁灭、虹吸、攻击时、回合开始/结束、随从进场/离场、每当xx等）
function hasSpecialThreatEffectForAI(m) {
  if (!m || !m.data || m.data.type === 'amulet') return false;
  const kw = m.activeKw || {};
  if (kw['毁灭'] || kw['虹吸'] || kw['多重攻击'] || kw['全体攻击'] || kw['三侧攻击'] || kw['两侧攻击'] || kw['飞行'] || kw['荆棘'] || kw['守护']) return true;
  if (m.grantedOnAttackAoe4 || m.countdown !== null) return true;
  const c = m.data;
  const ast = c.ast || parseCardEffectAST(c);
  if ((ast.onAttack && ast.onAttack.length > 0) ||
      (ast.turnStart && ast.turnStart.length > 0) ||
      (ast.turnEnd && ast.turnEnd.length > 0) ||
      (ast.onEnter && ast.onEnter.length > 0) ||
      ast.activate) return true;
  const ft = String(c.fullText || c.text || '');
  return /每当|攻击时|回合开始|回合结束|随从进场|随从离场|在自己回合|受到伤害时|使自己的主战者无敌|伤害转移|倒计时|变身|启动/.test(ft);
}

// 判断卡牌是否具备「谢幕曲召唤随从」或「回合开始召唤随从」（即使被解也能为下回合献祭留场）
function isStickyTributeSummonerForAI(cData) {
  if (!cData) return false;
  const ft = String(cData.fullText || cData.text || '');
  const hasLwSummon = ft.includes('谢幕曲') && /召唤|招募|亡者召还/.test(ft);
  const hasTurnStartSummon = ft.includes('回合开始') && /召唤/.test(ft);
  return hasLwSummon || hasTurnStartSummon;
}

// 评估场面身材与综合价值（用于对比瞬念召唤/清场前后的敌我场面净差值）
function getBoardStatValueForAI(m) {
  if (!m || !m.data || m.data.type === 'amulet') return 0;
  const swings = Math.max(1, (m.activeKw && m.activeKw['多重攻击']) || 1);
  return (m.currentAtk || 0) * swings * 1.3 + (m.currentHp || 0) * 1.0 + getCardCostValue(m.data) * 0.85;
}

function getBoardStatNetDiffForAI(myBoard, oppBoard) {
  let myV = 0, oppV = 0;
  for (let l = 0; l < 5; l++) {
    if (myBoard[l] && myBoard[l].data && myBoard[l].data.type === 'minion') myV += getBoardStatValueForAI(myBoard[l]);
    if (oppBoard[l] && oppBoard[l].data && oppBoard[l].data.type === 'minion') oppV += getBoardStatValueForAI(oppBoard[l]);
  }
  return myV - oppV;
}

function simulateProjectedFaceDamage(virtualEnemyBoard = null, virtualPlayerBoard = null) {
  const eBoard = (virtualEnemyBoard || battle.board[1]).map(cloneVirtualMinionForAI);
  const pBoard = (virtualPlayerBoard || battle.board[0]).map(cloneVirtualMinionForAI);
  let faceDmg = 0;
  const order = [4, 3, 2, 1, 0];
  for (const l of order) {
    const atkM = eBoard[l];
    if (!atkM || (atkM.data && atkM.data.type === 'amulet') || atkM.currentAtk <= 0) continue;
    const swings = Math.max(1, (atkM.activeKw && atkM.activeKw['多重攻击']) || 1);
    for (let s = 0; s < swings; s++) {
      if (atkM.grantedOnAttackAoe4) {
        for (let al = 0; al < 5; al++) {
          const pm = pBoard[al];
          if (pm && pm.data && pm.data.type === 'minion') {
            if (pm.activeKw['屏障']) delete pm.activeKw['屏障'];
            else {
              pm.currentHp -= 4;
              if (pm.currentHp <= 0) pBoard[al] = null;
            }
          }
        }
      }
      if (atkM.data && atkM.data.id === 'cmwge5kmkgr5o' && pBoard[l] && pBoard[l].data.type === 'minion') {
        pBoard[l] = null; // 失控的战甲犀牛：攻击时破坏面前随从
      }
      let targetLanes = [l];
      if (atkM.activeKw && atkM.activeKw['全体攻击']) targetLanes = [0, 1, 2, 3, 4];
      else if (atkM.activeKw && atkM.activeKw['三侧攻击']) targetLanes = [l - 1, l, l + 1].filter(x => x >= 0 && x < 5);
      else if (atkM.activeKw && atkM.activeKw['两侧攻击']) targetLanes = [l - 1, l + 1].filter(x => x >= 0 && x < 5);

      for (const tl of targetLanes) {
        let def = pBoard[tl];
        if (def && def.data && def.data.type === 'amulet') def = null;
        if (!def) {
          // 寻找距离最近的【守护】随从横移拦截
          let bestG = -1, bestDist = 99;
          for (let gl = 0; gl < 5; gl++) {
            const gm = pBoard[gl];
            if (gm && (!gm.data || gm.data.type === 'minion') && gm.activeKw && gm.activeKw['守护'] && !gm.activeKw['潜行']) {
              const d = Math.abs(gl - tl);
              if (d < bestDist) { bestDist = d; bestG = gl; }
            }
          }
          if (bestG !== -1) {
            def = pBoard[bestG];
            pBoard[bestG] = null;
            pBoard[tl] = def;
          }
        }
        const hitFace = (!def) || (atkM.activeKw && atkM.activeKw['飞行'] && !(def.activeKw && def.activeKw['防空']));
        if (hitFace) {
          faceDmg += atkM.currentAtk;
        } else if (def) {
          if (def.activeKw && def.activeKw['屏障']) {
            delete def.activeKw['屏障'];
          } else {
            def.currentHp -= atkM.currentAtk;
            if (def.currentHp <= 0 || (atkM.activeKw && atkM.activeKw['毁灭'])) {
              pBoard[tl] = null;
            }
          }
        }
      }
    }
    // 模拟攻击后【位移】
    if (atkM.activeKw && atkM.activeKw['位移']) {
      let nextL = l + (atkM.shiftDir || 1);
      if (nextL < 0 || nextL >= 5 || eBoard[nextL] !== null) {
        atkM.shiftDir = -(atkM.shiftDir || 1);
        nextL = l + atkM.shiftDir;
      }
      if (nextL >= 0 && nextL < 5 && eBoard[nextL] === null) {
        eBoard[l] = null;
        eBoard[nextL] = atkM;
      }
    }
  }
  return faceDmg;
}

// 比较两个己方随从作为祭品的优先级：
// 1. 先按卡牌费用价值 (energy*1 + bones*0.5 + sacrifice*2) 升序排列（价值越低越优先献祭）
// 2. 价值同等的情况下，严格优先选择当前生命值和攻击力较低的随从献祭！
function getBoardMinionEffectiveValueForAI(m) {
  if (!m || !m.data) return 0;
  const baseVal = getCardCostValue(m.data);
  const extraAtk = Math.max(0, (m.currentAtk || 0) - (m.data.atk || 0));
  const extraHp = Math.max(0, (m.currentHp || 0) - (m.data.hp || 0));
  let cdBonus = 0;
  if (m.countdown !== null && m.countdown > 0 && String(m.data.timerEffect || "").includes("变身为")) {
    cdBonus = m.countdown === 1 ? 3.5 : 2.5;
  }
  if (['cmwdtq4q7c8pe', 'cmwdui6uam6xe', 'cmwdukf0l090w', 'cmwdv3usmmzyp'].includes(m.data.id)) {
    cdBonus += 8.0; // 绝不轻易献祭已孵化的高阶飞龙
  }
  return Number((baseVal + (extraAtk + extraHp) * 0.5 + cdBonus).toFixed(1));
}

function getBoardNetValueDiffForAI(myBoard, oppBoard) {
  let myV = 0, oppV = 0;
  for (let l = 0; l < 5; l++) {
    if (myBoard[l] && myBoard[l].data.type === 'minion') myV += getBoardMinionEffectiveValueForAI(myBoard[l]);
    if (oppBoard[l] && oppBoard[l].data.type === 'minion') oppV += getBoardMinionEffectiveValueForAI(oppBoard[l]);
  }
  return myV - oppV;
}

function compareTributeCandidatesForAI(instA, instB) {
  const aiHpNow = battle.leaders[1] ? battle.leaders[1].hp : 30;
  const guardKeepA = (aiHpNow <= 16 && instA.activeKw && instA.activeKw['守护']) ? 1.5 : 0;
  const guardKeepB = (aiHpNow <= 16 && instB.activeKw && instB.activeKw['守护']) ? 1.5 : 0;
  const nunA = (instA.data && instA.data.id === 'cmwe1w8cztclb') ? -1.0 : 0;
  const nunB = (instB.data && instB.data.id === 'cmwe1w8cztclb') ? -1.0 : 0;
  const sacFodderBonus = (inst) => {
    const id = inst && inst.data ? inst.data.id : '';
    if (id === 'cmwata95yc8j5') return -3.0; // 被献祭的松鼠：绝对第一祭品
    if (id === 'cmwc0auyporsj') return -2.2; // 骸骨兽：献祭即爆2个骷髅，极佳祭品
    if (id === 'cmwgd14oa2890' || id === 'cmwfdqzl799uk' || id === 'cmwc9mbry93dx') return -1.2;
    return 0;
  };
  const valA = getBoardMinionEffectiveValueForAI(instA) + guardKeepA + nunA + sacFodderBonus(instA);
  const valB = getBoardMinionEffectiveValueForAI(instB) + guardKeepB + nunB + sacFodderBonus(instB);
  if (Math.abs(valA - valB) > 0.001) return valA - valB;
  const statA = (instA.currentHp || 0) + (instA.currentAtk || 0);
  const statB = (instB.currentHp || 0) + (instB.currentAtk || 0);
  if (statA !== statB) return statA - statB;
  if ((instA.currentHp || 0) !== (instB.currentHp || 0)) return (instA.currentHp || 0) - (instB.currentHp || 0);
  return (instA.currentAtk || 0) - (instB.currentAtk || 0);
}

function estimateAIExtraSummons(c, isEnh, choiceIdx) {
  if (!c || !c.data) return 0;
  const id = c.data.id;
  if (id === 'cmwbyp6f419ju') return 4; // 摇滚骷髅吉他手
  if (id === 'cmwghmf9xj9dv') return 3; // 摇滚骷髅乐团主唱（亡者召还价值1/2/3）
  if (id === 'cmwgdqawegvy3') return 2; // 地狱三头犬
  if (id === 'cmwgdeqcq4vyl') return 3; // 骸骨和少女
  if (id === 'cmwgeg2eggz9t') return 3; // 骸骨恋人
  if (id === 'cmwdz3reuida0') return choiceIdx === 0 ? 4 : (choiceIdx === 2 ? 1 : 0); // 孵化万物的龙女
  if (id === 'cmwgrn65g40ql') return choiceIdx === 2 ? 3 : 0; // 拯救世界的大天使
  if (id === 'cmwdvmwjm0301') return 2; // 丢失的龙蛋
  if (id === 'cmwgrgw6jyd8p') return 1; // 亡灵骑士
  if (id === 'cmwgxtqho266t') return 3; // 鬼火将军
  if (id === 'cmwgyyghnbr4n') return 2; // 蝙蝠女王
  if (id === 'cmwhhzt6ezp08') return 1; // 蔷薇近卫
  const ast = c.data.ast || parseCardEffectAST(c.data);
  const acts = [...(ast.fanfare || []), ...(ast.spellMain || []), ...(isEnh && ast.enhance ? ast.enhance.actions : [])];
  let sum = 0;
  for (const act of acts) {
    if (act.op === 'summon') sum += (act.count || 1);
    else if (act.op === 'reanimate' || act.op === 'recruit') sum += (act.times || 1);
  }
  return sum;
}

function initOpponentIntelForSide(side) {
  const st = battle && battle.leaders ? battle.leaders[side] : null;
  const oppSt = battle && battle.leaders ? battle.leaders[1 - side] : null;
  if (!st || !oppSt) return null;
  if (st.oppIntel) return st.oppIntel;
  // 仅在开局读取一次对手公开卡组构成（绝不窥探对手隐藏手牌）
  const pool = [
    ...(oppSt.deck || []).map(c => c && c.data).filter(Boolean),
    ...(oppSt.hand || []).map(c => c && c.data).filter(Boolean),
    ...(oppSt.graveyard || []).filter(Boolean)
  ];
  let mechCnt = 0, wardCnt = 0, selfDmgCnt = 0, lwCnt = 0, dragonCnt = 0;
  let antiAirCount = 0, healCount = 0, burstCount = 0, sacCount = 0;
  const aoeThreats = {
    mechEmperor: false,      // 超载机皇 (7费 3目标AOE)
    mechGirl: false,         // 魔导机兵少女 (5+回合 5机械4伤AOE)
    dragonHero: false,       // 流淌龙血的侠客 (8费 全体AOE)
    brawler: false,          // 狂暴女拳师 (血<10 4费4伤AOE)
    tear: false,             // 撕裂 (3费 全场2伤)
    drummer: false,          // 摇滚骷髅乐团鼓手 (5费+4骨 AOE)
    rottingMist: false,      // 腐烂雾气 (3费 非亡灵2伤)
    cataclysm: false,        // 大灾变 (6费 全清)
    holyLight: false         // 圣光照耀 (8费 5伤)
  };
  for (const cd of pool) {
    const txt = String(cd.fullText || cd.text || '');
    if (isMechCard(cd)) mechCnt++;
    if (hasRace(cd, '龙族') || cd.id === 'cmwdvrwfcy5gg' || cd.id === 'cmwdw2v21c73r') dragonCnt++;
    if ((cd.keywords || []).some(k => k.k === '守护')) wardCnt++;
    if (txt.includes('自己的主战者造成') || txt.includes('自己主战者造成')) selfDmgCnt++;
    if ((cd.keywords || []).some(k => k.k === '谢幕曲')) lwCnt++;
    if ((cd.keywords || []).some(k => k.k === '防空')) antiAirCount++;
    if (txt.includes('回复') || (cd.keywords || []).some(k => k.k === '虹吸')) healCount++;
    if (['cmwgyx2fz9jks', 'cmwgyxdbows5c', 'cmwm86ka6xbwr', 'cmwlo5i3bcgg1', 'cmwkgzkuuxaoz'].includes(cd.id)) burstCount++;
    if ((cd.sacrifice || 0) >= 2) sacCount++;
    if (cd.id === 'cmwc3gozg0rat') aoeThreats.mechEmperor = true;
    if (cd.id === 'cmwbx0mq8qz7f') aoeThreats.mechGirl = true;
    if (cd.id === 'cmwdwtfm8xm5c') aoeThreats.dragonHero = true;
    if (cd.id === 'cmwkgxi000fpl') aoeThreats.brawler = true;
    if (cd.id === 'cmwgyks2fu1p5') aoeThreats.tear = true;
    if (cd.id === 'cmwhilw8iwvet') aoeThreats.drummer = true;
    if (cd.id === 'cmwke2qdplbkf') aoeThreats.rottingMist = true;
    if (cd.id === 'cmwe0hk86d0a2') aoeThreats.cataclysm = true;
    if (cd.id === 'cmwhmdc2wy39w') aoeThreats.holyLight = true;
  }
  let archetype = 'other';
  const scores = [
    ['mech', mechCnt],
    ['dragon', dragonCnt],
    ['selfdmg', selfDmgCnt * 1.4],
    ['shield', wardCnt * 1.1],
    ['lastwords', lwCnt * 1.1]
  ].sort((a, b) => b[1] - a[1]);
  if (scores[0][1] >= 6) archetype = scores[0][0];
  st.oppIntel = {
    archetype, mechCnt, wardCnt, selfDmgCnt, lwCnt, dragonCnt,
    antiAirCount, healCount, burstCount, sacCount, aoeThreats
  };
  return st.oppIntel;
}

function evaluateBattleContextForAI(side) {
  const st = battle.leaders[side];
  const opp = 1 - side;
  const oppSt = battle.leaders[opp];
  const intel = initOpponentIntelForSide(side) || { archetype: 'other', aoeThreats: {}, antiAirCount: 0, healCount: 0, burstCount: 0 };
  const turn = battle.turn || 1;
  const oppNextE = Math.min(RULES.energyMax, (oppSt.maxEnergy || 1) + 1);
  const myBoard = battle.board[side];
  const oppBoard = battle.board[opp];

  let myBoardAtk = 0, myBoardCount = 0, oppBoardAtk = 0, oppBoardCount = 0, oppMechBoard = 0;
  for (let l = 0; l < 5; l++) {
    const mm = myBoard[l];
    if (mm) { myBoardCount++; if (mm.data.type === 'minion') myBoardAtk += (mm.currentAtk || 0); }
    const om = oppBoard[l];
    if (om) {
      oppBoardCount++;
      if (om.data.type === 'minion') oppBoardAtk += (om.currentAtk || 0);
      if (isMechCard(om.data)) oppMechBoard++;
    }
  }

  // 统计对手公开可见手牌中的直伤与衍生物（仅公开信息，不作弊）
  const pubHand = (oppSt.publicHandIds || []).filter(p => (oppSt.hand || []).some(h => h && h.uid === p.uid));
  const oppPublicBurn = pubHand.filter(p => p.id === 'cmwgyx2fz9jks' || p.id === 'cmwgyxdbows5c').length * 3;
  const oppPublicSheep = pubHand.filter(p => p.id === 'cmwby0dy7g2pc').length;

  // 计算潜在斩杀威胁（含公开直伤 + 场上攻击力）
  const effectiveSafetyHp = st.hp - oppPublicBurn;
  const inDanger = effectiveSafetyHp <= 13 || oppBoardAtk >= effectiveSafetyHp * 0.55;

  // 节奏角色判定：面对龙族/圣盾等后期发育卡组，且自身血量安全时主动竞速抢血
  let tempoRole = 'balanced';
  if (oppSt.hp <= 12 || (myBoardAtk >= oppSt.hp * 0.6 && !inDanger)) {
    tempoRole = 'race';
  } else if ((intel.archetype === 'dragon' || intel.archetype === 'shield') && !inDanger && turn <= 10) {
    tempoRole = 'race';
  } else if (inDanger) {
    tempoRole = 'control';
  }

  // 预判下回合对手 AOE 威胁
  let oppAoeRisk = 0;
  const aoe = intel.aoeThreats || {};
  if (aoe.mechEmperor && oppNextE >= 7 && (oppSt.hand || []).length >= 3) oppAoeRisk++;
  if (aoe.mechGirl && turn >= 4 && (oppMechBoard + oppPublicSheep) >= 4) oppAoeRisk++;
  if (aoe.dragonHero && oppNextE >= 8) oppAoeRisk++;
  if (aoe.brawler && oppSt.hp <= 12 && oppNextE >= 4) oppAoeRisk++;
  if (aoe.tear && oppNextE >= 3) oppAoeRisk++;
  if (aoe.drummer && oppNextE >= 5 && (oppSt.bones || 0) >= 4) oppAoeRisk++;

  // 预判对手【狂暴女拳师】压血阈值 (血量 < 10 触发4伤AOE)
  const avoidTriggerBrawler = Boolean(aoe.brawler && oppSt.hp >= 10 && oppSt.hp <= 13);

  const oppDeadBigDragon = (oppSt.graveyard || []).some(g => g && g.type === 'minion' && getInitialCountdown(g) > 0 && g.atk >= 5);
  const oppLwNear10 = (oppSt.destroyedLastWordsCount || 0) >= 8;
  const oppGuardNearThreshold = (oppSt.destroyedGuardCount || 0) === 4 || (oppSt.destroyedGuardCount || 0) === 9;

  return {
    intel, tempoRole, inDanger, oppAoeRisk, avoidTriggerBrawler,
    oppDeadBigDragon, oppLwNear10, oppGuardNearThreshold,
    oppPublicBurn, oppPublicSheep, oppMechBoard, myBoardCount, oppBoardCount,
    myBoardAtk, oppBoardAtk, oppNextE
  };
}

