const RULES = Object.assign({
  hp: 30, columns: 5, openingHand: 4, handLimit: 10, energyStart: 1, energyMax: 10, deckSize: 40, deckEditMax: 50, copiesPerCard: 3
}, INITIAL_CCG_DATA.rules || {}, { hp: 30, handLimit: 10 });

function isMechCard(cData) {
  if (!cData) return false;
  const r = String(cData.race || '');
  return r.includes('机械') || cData.id === 'cmwbx0mq8qz7f' || cData.id === 'cmwbwne297mmg' || String(cData.name || '').includes('机兵') || String(cData.name || '').includes('机甲') || String(cData.name || '').includes('机械') || String(cData.name || '').includes('发条');
}

const cardsById = {};
const cardsByName = {};
let allCards = [];

// v1.88 安全：导入的卡牌（含他人分享的 JSON）会出现在大量 innerHTML 模板中，
// 统一在入口把 HTML 敏感字符换成全角字符，并限制 id 只能是安全标识符。
const CF_CARD_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
function cfSanitizeCardStrings(v, depth = 0) {
  if (typeof v === 'string') return v.replace(/</g, '＜').replace(/>/g, '＞').replace(/"/g, '＂').replace(/`/g, '｀');
  if (!v || typeof v !== 'object' || depth > 6) return v;
  if (Array.isArray(v)) return v.map(x => cfSanitizeCardStrings(x, depth + 1));
  const out = {};
  for (const k of Object.keys(v)) {
    if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
    out[k] = cfSanitizeCardStrings(v[k], depth + 1);
  }
  return out;
}

function registerCardsFromDesigner(cardArray) {
  let importedCount = 0;
  cardArray.forEach(rawIn => {
    if (!rawIn || typeof rawIn !== 'object' || !CF_CARD_ID_RE.test(String(rawIn.id || '')) || !rawIn.name) return;
    const raw = cfSanitizeCardStrings(rawIn);
    const c = Object.assign({
      en: "", type: "minion", rarity: "普通", race: "", sacrificeCond: "",
      faith: 0, counter: 0, energy: 0, sacrifice: 0, bones: 0,
      atk: 0, hp: 1, timer: 0, countdown: 0, timerEffect: "", fusion: null, choice: null,
      keywords: [], text: "", flavor: "", notes: "", art: "", fullText: ""
    }, raw);
    c.energy = Number(c.energy || 0);
    c.sacrifice = Number(c.sacrifice || 0);
    c.bones = Number(c.bones || 0);
    c.atk = Number(c.atk || 0);
    c.hp = Number(c.hp || 1);
    c.countdown = getInitialCountdown(c);
    c.isToken = String(c.notes || '').includes('衍生物');
    c.ast = parseCardEffectAST(c);
    cardsById[c.id] = c;
    cardsByName[c.name] = c;
    importedCount++;
  });
  if (cardsById['cmwbx0mq8qz7f']) cardsById['cmwbx0mq8qz7f'].race = '机械';
  if (cardsById['cmwbwne297mmg']) cardsById['cmwbwne297mmg'].race = '机械';
  if (cardsByName['魔导机兵少女']) {
    cardsByName['魔导机兵少女'].race = '机械';
    cardsByName['魔导机械少女'] = cardsByName['魔导机兵少女'];
  }
  if (!cardsById['token_lucky_coin']) {
    const luckyCoin = {
      id: 'token_lucky_coin',
      name: '幸运币',
      en: 'Lucky Coin',
      type: 'spell',
      rarity: '普通',
      race: '无种族',
      sacrificeCond: '',
      faith: 0,
      counter: 0,
      energy: 0,
      sacrifice: 0,
      bones: 0,
      atk: 0,
      hp: 0,
      timer: 0,
      countdown: null,
      timerEffect: '',
      fusion: null,
      choice: null,
      keywords: [],
      text: '',
      flavor: '后手决斗者的逆转微光。',
      notes: '后手开局专属衍生物',
      art: '',
      value: 0,
      isToken: true,
      fullText: '使自己本回合的能量+1。'
    };
    luckyCoin.ast = parseCardEffectAST(luckyCoin);
    cardsById[luckyCoin.id] = luckyCoin;
    cardsByName[luckyCoin.name] = luckyCoin;
  }
  allCards = Object.values(cardsById).sort((a, b) => {
    if (a.isToken !== b.isToken) return a.isToken ? 1 : -1;
    if (a.energy !== b.energy) return a.energy - b.energy;
    if (a.bones !== b.bones) return a.bones - b.bones;
    return a.id.localeCompare(b.id);
  });
  return importedCount;
}
registerCardsFromDesigner(INITIAL_CCG_DATA.cards || []);

const AI_PURE_MECH_DECK = {
  name: "赛博机械狂潮 (40张)",
  cards: {
    "cmwbz163tt1ma": 3, "cmwbxdn7tcvde": 3, "cmwc2wbcgbqvl": 3, "cmwc2zlhaxdtj": 3,
    "cmwbwg3kwqfkq": 3, "cmwbwne297mmg": 3, "cmwbxu7u3tpyo": 3, "cmwby8v9c918f": 3,
    "cmwbyhrbei4w8": 3, "cmwbvfqe5en3l": 2, "cmwbvnpfgwo7a": 2, "cmwas0lke5oiw": 2,
    "cmwc2n4p68ewm": 2, "cmwbx0mq8qz7f": 1, "cmwc33vo8ohrw": 1, "cmwc8tup5d1xt": 1,
    "cmwc3gozg0rat": 1, "cmwc3or2zf7ft": 1
  }
};

// 40张【苍穹龙族进化】预设与AI卡组（含 v2.1 新增的 1费雏龙的蛋 与 龙蛋收藏家）
const AI_DRAGON_EVO_DECK = {
  name: "苍穹龙族进化 (40张)",
  cards: {
    "cmwdtm73fwg1u": 3, // 雏龙的蛋 (1费0祭品)
    "cmwe1w8cztclb": 3, // 静听倾诉的修女 (1费)
    "cmwdzvs1woa53": 2, // 龙心秘宝 (1费护符)
    "cmwdvbzosilgg": 2, // 祷告的圣女 (2费守护/倒计时-1)
    "cmwdvhcrr8g9v": 3, // 快速孵化 (2费法术)
    "cmwdw2v21c73r": 3, // 驯龙师 (2费龙族+1/+1光环)
    "cmwdzojlzzf98": 2, // 窃蛋龙 (2费祭1谢幕曲召龙蛋)
    "cmwe1tj7fh3ot": 3, // 雏龙搭档 (2费召雏龙)
    "cmwfdhecfc856": 3, // 龙蛋收藏家 (3费入场曲+启动拿龙蛋)
    "cmwdvmwjm0301": 3, // 丢失的龙蛋 (3费召2龙蛋)
    "cmwdvop6hshsy": 2, // 龙骑士 (3费)
    "cmwdvrwfcy5gg": 2, // 孵化装置 (3费护符)
    "cmwdwpfyd4xpp": 2, // 慈爱的龙母 (3费骨4全体龙族倒计时-1)
    "cmwdw5qt6cbqb": 2, // 无畏的飞龙骑手 (4费纹章传说)
    "cmwdx7vx7izcu": 2, // 龙鳞锻造师 (4费骨3龙族+2/+2)
    "cmwdwtfm8xm5c": 2, // 流淌龙血的侠客 (5费最大能量+1/爆能8全体伤害)
    "cmwdz3reuida0": 1  // 孵化万物的龙女 (8费传说)
  }
};

const AI_UNDEAD_BONE_DECK = {
  "name": "冥刻亡灵骨海 (40张)",
  "cards": {
    "cmwfdsjjxuhrh": 3,
    "cmwbz163tt1ma": 2,
    "cmwgd14oa2890": 3,
    "cmwc97xb64vc6": 3,
    "cmwggjooddagz": 3,
    "cmwghctx4ixrj": 2,
    "cmwfdugclc9w9": 2,
    "cmwgccmsj2ypl": 2,
    "cmwggx4ykcgy1": 2,
    "cmwgh9izhopu9": 2,
    "cmwffsync2y12": 2,
    "cmwe0tjwqf5lp": 2,
    "cmwfhe6xv5el7": 2,
    "cmwgczzbob0ta": 2,
    "cmwgh0uggjyno": 2,
    "cmwgcjgs4885x": 1,
    "cmwgdeqcq4vyl": 1,
    "cmwgdqawegvy3": 1,
    "cmwgg0hlxpor5": 1,
    "cmwbyp6f419ju": 1,
    "cmwffityz44sn": 1
  }
};

// 用户实测验证的【谢幕曲】AI 挑战卡组（40张，严格保留）
const AI_LASTWORDS_DECK = {
  "name": "🎸 终幕协奏 (40张)",
  "cards": {
    "cmwc0auyporsj": 3,
    "cmwc0t61ade7b": 3,
    "cmwc9mbry93dx": 3,
    "cmwdxt4vgtk9g": 1,
    "cmwfdqzl799uk": 3,
    "cmwffityz44sn": 2,
    "cmwgczzbob0ta": 3,
    "cmwgd14oa2890": 3,
    "cmwgdqawegvy3": 2,
    "cmwgeg2eggz9t": 1,
    "cmwggjooddagz": 3,
    "cmwgh0uggjyno": 2,
    "cmwghmf9xj9dv": 3,
    "cmwgqgw3e4h7s": 3,
    "cmwgxtqho266t": 1,
    "cmwke2qdplbkf": 2,
    "cmwlomedyjchl": 2
  }
};

const AI_SELFDAMAGE_DECK = {
  "name": "鲜血自残狂潮 (40张)",
  "cards": {
    "cmwhm4gd57wh3": 3, // 疼痛疗愈者
    "cmwgyd3y5eyqg": 3, // 鲜血宝石
    "cmwgyxlefz8yz": 3, // 血玫瑰
    "cmwgyfgvst9r1": 3, // 燃血术士
    "cmwgd56lg867w": 3, // 血法师
    "cmwgyks2fu1p5": 3, // 撕裂
    "cmwgdalzmzj83": 3, // 残暴的尸兽
    "cmwget8v364ar": 3, // 大剑少女
    "cmwgyxdbows5c": 3, // 鲜血爆发
    "cmwhie9u1p4ey": 3, // 蔷薇猛虎
    "cmwhlefn11ybd": 3, // 蔷薇的妖精
    "cmwhlsrjr4v9k": 3, // 嗜血的亡灵
    "cmwhlmtv5rqx4": 2, // 地狱归来的凶魔
    "cmwhq2imeai8a": 2  // 邪恶骨巫
  }
};

const AI_GUARDIAN_DECK = {
  "name": "圣盾守护铁壁 (40张)",
  "cards": {
    "cmwhoxkqvs8bv": 3, // 圣骑兵
    "cmwhoaa82dm9r": 3, // 守护祷告者
    "cmwho2om9pm9p": 3, // 宁静的治愈师
    "cmwhp8oncpwrz": 3, // 神圣宫殿
    "cmwho72hssbxy": 3, // 慷慨的天使
    "cmwhn1a7tbjha": 3, // 团结的守卫
    "cmwhosp359tmt": 3, // 祝福的圣骑士
    "cmwhodkla27ju": 2, // 猛虎训练师
    "cmwhom0t7kh3l": 2, // 开辟的传教士
    "cmwhphf6y7cew": 3, // 守护之光芒
    "cmwhpp5k2fltf": 3, // 神圣宫廷祷告师
    "cmwhov3uiapqd": 3, // 圣骑士士官长
    "cmwhp4fb0ip93": 2, // 神圣翼甲战士
    "cmwhq3vyptao6": 2, // 圣骑将军
    "cmwhpb43k6m14": 2  // 神圣重盾圣铠
  }
};


/* 机械·作者卡组（用户 CF1 牌组码）—— 替换原「豪情机械狂潮」作为机械 AI */
const AI_MECH_PRO_DECK = {
  "name": "⚙️ 齿轮洪流 (40张)",
  "cards": {
    "cmwas0lke5oiw": 3,
    "cmwbvfqe5en3l": 2,
    "cmwbvnpfgwo7a": 2,
    "cmwbwg3kwqfkq": 3,
    "cmwbwne297mmg": 3,
    "cmwbx0mq8qz7f": 3,
    "cmwbxu7u3tpyo": 3,
    "cmwbyhrbei4w8": 3,
    "cmwc2n4p68ewm": 3,
    "cmwc2wbcgbqvl": 3,
    "cmwc2zlhaxdtj": 3,
    "cmwc33vo8ohrw": 1,
    "cmwc3gozg0rat": 3,
    "cmwc3or2zf7ft": 1,
    "cmwdi4pwz3c0k": 3,
    "cmwlp6mctrvla": 1
  }
};

const AI_DRAGON_PRO_DECK = {
  name: "🐉 苍穹龙血 (40张)",
  cards: {
    "cmwdtm73fwg1u": 3,
    "cmwdvmwjm0301": 3,
    "cmwdvrwfcy5gg": 3,
    "cmwdw2v21c73r": 3,
    "cmwdw5qt6cbqb": 3,
    "cmwdwpfyd4xpp": 3,
    "cmwdwtfm8xm5c": 3,
    "cmwdxmxskfby0": 1,
    "cmwdz3reuida0": 3,
    "cmwdzojlzzf98": 3,
    "cmwe1tj7fh3ot": 3,
    "cmwe1w8cztclb": 3,
    "cmwfdhecfc856": 3,
    "cmwho72hssbxy": 3
  }
};

const AI_SELFDAMAGE_PRO_DECK = {
  "name": "🩸 血债回响 (40张)",
  "cards": {
    "cmwgd56lg867w": 3,
    "cmwgdmja7m7g7": 1,
    "cmwget8v364ar": 3,
    "cmwgyks2fu1p5": 3,
    "cmwgysie8srmh": 3,
    "cmwgyxdbows5c": 3,
    "cmwgz1zd1u6au": 3,
    "cmwhhqrb9fi71": 1,
    "cmwhhzt6ezp08": 3,
    "cmwhi7h552gc8": 3,
    "cmwhilw8iwvet": 3,
    "cmwhlefn11ybd": 3,
    "cmwhm4gd57wh3": 3,
    "cmwkgxi000fpl": 3,
    "cmwkiou55bdcb": 1,
    "cmwlnnxokbgmu": 1
  }
};

const AI_CREST_GUARD_PRO_DECK = {
  "name": "🛡️ 纹章圣盾 (40张)",
  "cards": {
    "cmwm86ka6xbwr": 3,
    "cmwgxtqho266t": 1,
    "cmwho2om9pm9p": 3,
    "cmwho72hssbxy": 3,
    "cmwhom0t7kh3l": 3,
    "cmwhosp359tmt": 1,
    "cmwhov3uiapqd": 3,
    "cmwhp4fb0ip93": 1,
    "cmwhp8oncpwrz": 3,
    "cmwhpp5k2fltf": 3,
    "cmwhq3vyptao6": 1,
    "cmwke161d7ba7": 2,
    "cmwllves0lgmy": 3,
    "cmwllvy75f6bz": 3,
    "cmwlnaq43tdtd": 3,
    "cmwlnnxokbgmu": 2,
    "cmwlo5i3bcgg1": 1,
    "cmwlp6mctrvla": 1
  }
};

const DEFAULT_PRESET_DECKS = [
  {
    "name": "⚙️ 齿轮洪流",
    "cards": Object.assign({}, AI_MECH_PRO_DECK.cards)
  },
  {
    "name": "🐉 苍穹龙血",
    "cards": Object.assign({}, AI_DRAGON_PRO_DECK.cards)
  },
  {
    "name": "🩸 血债回响",
    "cards": Object.assign({}, AI_SELFDAMAGE_PRO_DECK.cards)
  },
  {
    "name": "🎸 终幕协奏",
    "cards": Object.assign({}, AI_LASTWORDS_DECK.cards)
  },
  {
    "name": "🛡️ 纹章圣盾",
    "cards": Object.assign({}, AI_CREST_GUARD_PRO_DECK.cards)
  }
];
const DECK_STORAGE_KEY = 'CARDFORGE_SAVED_DECKS_V1_v14';
const DECK_IDX_STORAGE_KEY = 'CARDFORGE_SELECTED_DECK_IDX_V1';

function loadSavedDecksFromStorage() {
  try {
    let raw = null; try { raw = localStorage.getItem(DECK_STORAGE_KEY); } catch (e) {}
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const LEGACY_CARD_ID_MAP = { 'cmwdualcannon1': 'cmwm86ka6xbwr' };
        parsed.forEach(d => {
          if (!d || !d.cards || typeof d.cards !== 'object') return;
          for (const [oldId, newId] of Object.entries(LEGACY_CARD_ID_MAP)) {
            if (Object.prototype.hasOwnProperty.call(d.cards, oldId)) {
              const oldCnt = Number(d.cards[oldId]) || 0;
              delete d.cards[oldId];
              if (oldCnt > 0) d.cards[newId] = Math.min(3, (Number(d.cards[newId]) || 0) + oldCnt);
            }
          }
        });
        DEFAULT_PRESET_DECKS.forEach(defDeck => {
          const baseName = defDeck.name.replace(/\s*\(\d+张\)/, '');
          const exist = parsed.find(d => d && !d.isUserCustom && String(d.name || '').includes(baseName));
          if (exist) {
            exist.name = defDeck.name;
            exist.cards = Object.assign({}, defDeck.cards);
          } else if (!parsed.some(d => d && String(d.name || '').includes(baseName))) {
            parsed.push({ name: defDeck.name, cards: Object.assign({}, defDeck.cards) });
          }
        });
        return parsed;
      }
    }
  } catch (e) {}
  const initDecks = JSON.parse(JSON.stringify(DEFAULT_PRESET_DECKS));
  /* 只保留四套作者卡组；自定义卡组由玩家自己在编辑器里新建 */
  return initDecks;
}

function saveDecksToStorage() {
  try {
    try { localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(PRESET_DECKS)); } catch (e) {}
    try { localStorage.setItem(DECK_IDX_STORAGE_KEY, String(currentDeckIndex)); } catch (e) {}
  } catch (e) {}
}

const PRESET_DECKS = loadSavedDecksFromStorage();
let currentDeckIndex = (() => {
  try {
    const savedIdx = parseInt((function(){ try { return localStorage.getItem(DECK_IDX_STORAGE_KEY) || '0'; } catch(e){ return '0'; } })(), 10);
    if (savedIdx >= 0 && savedIdx < PRESET_DECKS.length) return savedIdx;
  } catch (e) {}
  return 0;
})();

const PASSIVE_DISPLAY_KEYWORDS = new Set([
  '守护', '飞行', '防空', '灵气', '屏障', '毁灭', '虹吸',
  '潜行', '潜伏', '位移', '两侧攻击', '三侧攻击', '全体攻击',
  '疾驰', '突进', '荆棘', '多重攻击'
]);

function getCardDisplayText(cardData, inst = null) {
  let base = (cardData.fullText || '').trim();
  if (!base) {
    const parts = [];
    (cardData.keywords || []).forEach(kw => {
      if (kw.v > 0 && !kw.effect) parts.push(`【${kw.k}_${kw.v}】`);
      else if (kw.effect) parts.push(`【${kw.k}】${kw.effect}`);
      else parts.push(`【${kw.k}】`);
    });
    if (cardData.text) parts.push(cardData.text);
    base = parts.join('\n');
  } else {
    // 补全设计器仅保存在 keywords[] 中、未写入 fullText 的被动/战斗词条（如守护、飞行、防空等）
    const missingTags = [];
    (cardData.keywords || []).forEach(kw => {
      const k = String((kw && kw.k) || '').trim();
      if (!k) return;
      const isPassive = PASSIVE_DISPLAY_KEYWORDS.has(k) || (
        !kw.effect && !(kw.reans && kw.reans.length) && !(kw.choice && kw.choice.on) &&
        !['倒计时', '结晶', '激奏', '爆能强化', '连击', '启动', '融合', '入场曲', '谢幕曲', '随从进场时', '随从离场时', '回合开始时', '回合结束时', '攻击时', '瞬念召唤'].includes(k)
      );
      if (!isPassive) return;
      const v = Number(kw.v || 0);
      const tag = v > 0 ? `【${k}_${v}】` : `【${k}】`;
      const escK = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const alreadyTagged = new RegExp(`(?:【${escK}(?:_${v}|】)|(?:^|\n)\s*${escK}(?:_${v})?\s*(?:$|\n))`).test(base);
      if (!alreadyTagged && !missingTags.includes(tag)) {
        missingTags.push(tag);
      }
    });
    if (missingTags.length > 0) {
      base = `${missingTags.join(' ')}\n${base}`;
    }
  }
  return base || '无特殊能力';
}

