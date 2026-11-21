// CardForge 独立卡牌设计器（原内嵌于 game.js 的 base64 srcdoc，v1.88 拆分为独立文件）
/* =========================================================
   词条定义
   p: none 固定标签 | num 数字 | fx 效果 | numfx 数字+效果 |
      act 启动(费用+效果) | reanimate 亡者召还
   res: true 表示该词条的数值是“费用”，必须标明 能量 / 祭品 / 骨头
   ========================================================= */
const KW = [
  /* --- 时点 --- */
  {k:'入场曲', g:'时点', p:'fx', fxHint:'例：选择对手的战场上的1个随从，对其造成3点伤害。', d:'从手牌打出时发动。'},
  {k:'谢幕曲', g:'时点', p:'fx', fxHint:'例：召唤1个「骷髅士兵」到战场上。', d:'被破坏时发动。被「消失」或变身前不发动。'},
  {k:'攻击时', g:'时点', p:'fx', fxHint:'例：抽取1张卡牌。', d:'该随从攻击时发动。'},
  {k:'回合开始时', g:'时点', p:'fx', fxHint:'例：回复自己的主战者2点生命值。', d:'己方回合开始时发动。'},
  {k:'回合结束时', g:'时点', p:'fx', fxHint:'例：对对手的主战者造成2点伤害。', d:'己方回合结束时发动。'},
  {k:'随从进场时', g:'时点', p:'fx', fxHint:'例：使该随从获得「守护」。', d:'任意随从入场时发动。'},
  {k:'随从离场时', g:'时点', p:'fx', fxHint:'例：获得1点骨头。', d:'任意随从离场时发动。'},
  /* --- 战斗 --- */
  {k:'守护', g:'战斗', p:'none', d:'对手的随从直接攻击主战者时，自动移动至该列进行交战。'},
  {k:'飞行', g:'战斗', p:'none', d:'可直接越过未拥有「防空」的随从攻击主战者。'},
  {k:'防空', g:'战斗', p:'none', d:'可以拦截拥有「飞行」的随从。'},
  {k:'多重攻击', g:'战斗', p:'num', def:2, unit:'次', d:'每回合可攻击的次数为该数值。'},
  {k:'潜行', g:'战斗', p:'none', d:'攻击后进入潜行状态：无法被指定为目标，也无法被攻击。'},
  {k:'灵气', g:'战斗', p:'none', d:'无法被对手的法术指定为目标。'},
  {k:'荆棘', g:'战斗', p:'num', def:1, unit:'点', d:'受到伤害时，对伤害来源造成该数值的伤害。'},
  {k:'虹吸', g:'战斗', p:'none', d:'该随从造成伤害时，回复自己的主战者等量的生命值。'},
  {k:'毁灭', g:'战斗', p:'none', d:'该随从对随从造成伤害时，破坏该随从。'},
  {k:'两侧攻击', g:'战斗', p:'none', d:'攻击时改为攻击左右两侧的随从。'},
  {k:'三侧攻击', g:'战斗', p:'none', d:'攻击时改为攻击左中右三侧的随从。'},
  {k:'全体攻击', g:'战斗', p:'none', d:'攻击时改为攻击对手的全体随从。'},
  {k:'位移', g:'战斗', p:'none', d:'攻击结束后向右移动1列；若无法移动则改为向左，重复此过程。'},
  /* --- 防御 --- */
  {k:'屏障', g:'防御', p:'none', d:'抵挡受到的第一次伤害；至少受到1点伤害时屏障消失。'},
  /* --- 计时 --- */
  {k:'倒计时', g:'计时', p:'num', def:2, unit:'回合', fxHint:'倒计时的效果（例：召唤1个3/3的「白骨巨像」到战场上）', d:'己方回合开始时倒计时-1，为0时发动该效果并破坏这张护符。效果写在这条词条的效果框里，不要写进下面的效果文本。'},
  {k:'瞬念召唤', g:'计时', p:'fx', fxHint:'条件与动作，例：若自己的随从被破坏，从牌库召唤1个「骸骨」到战场上。', d:'满足条件时立刻从牌库直接入场；也可以规定只在回合结束后才发动（编辑器里选「回合结束后」）。'},
  /* --- 费用类（必须标明资源） --- */
  {k:'爆能强化', g:'费用', p:'numfx', res:true, def:6, resDef:'能量', fxHint:'强化后的能力', d:'能量为该数值以上时，可支付额外费用发动强化能力。费用可以是能量/祭品/骨头，必须标明。'},
  {k:'激奏', g:'费用', p:'numfx', res:true, def:2, resDef:'能量', fxHint:'例：选择对手的战场上的1个随从，对其造成2点伤害。', d:'能量低于原始费用时，可支付该费用作为法术卡使用。费用必须标明资源。'},
  {k:'结晶', g:'费用', p:'numfx', res:true, def:2, resDef:'能量', fxHint:'作为护符使用时的能力', d:'能量低于原始费用时，可支付该费用作为护符卡使用。费用必须标明资源。'},
  /* --- 特殊 --- */
  {k:'启动', g:'特殊', p:'act', d:'该卡牌在场上时，支付指定费用发动。能量、祭品、骨头皆可作为费用。可切换为【抉择】。'},
  {k:'连击', g:'特殊', p:'numfx', def:3, multi:true, fxHint:'例：对对手的主战者造成3点伤害。', d:'本回合已使用的卡牌张数（含此卡）达到该数值时发动。可以有多条。'},
  {k:'亡者召还', g:'特殊', p:'reanimate', def:5, res:true, resDef:'能量', solo:true,
   d:'从自己的墓地召唤1个满足费用条件的卡牌。费用可以是能量/祭品/骨头的任意组合。不能单独存在，要挂在宿主（含抉择）上；法术例外。'},
  {k:'招募', g:'特殊', p:'reanimate', def:5, res:true, resDef:'能量', solo:true,
   d:'从自己的牌库召唤1个满足费用条件的随从，取其中费用数字最大者，同名并列时随机。不能单独存在，要挂在宿主（含抉择）上；法术例外。'},
  /* --- 手牌 --- */
  {k:'融合', g:'手牌', p:'fusion', ftypeDef:'卡牌', fxHint:'融合产生的结果（例：获得+1/+1并抽取1张卡牌）', d:'写法：【融合】条件·类型　结果。条件可以留空（留空=不限），也可以自己填（例：机械、不死）；类型可选 卡牌 / 随从 / 护符 / 法术，「卡牌」代表任意类型；后面写融合的结果。1张卡牌每回合仅可融合1次。'},
];
const KW_MAP = Object.fromEntries(KW.map(x=>[x.k,x]));
const RES = ['能量','祭品','骨头'];

const GROUPS = [
  {p:'none',      title:'不需要额外填写（普通标签）'},
  {p:'num',       title:'需要填写数字'},
  {p:'fx',        title:'需要填写效果（入场曲可切换为抉择）'},
  {p:'numfx',     title:'数字与效果都要填写'},
  {p:'act',       title:'启动（费用 + 效果，可切换为抉择）'},
  {p:'reanimate', title:'亡者召还 / 招募（多费用 + 可选类型）'},
  {p:'fusion',    title:'融合（条件 · 类型 + 结果）'},
];
const KW_UNIT = {'多重攻击':'次','荆棘':'点','倒计时':'回合'};

/* 词条显示名：一律 词条_数值；费用类再加资源前缀 */
/* 费用拼写：能量5祭品2骨头1（只写非零项） */
function costLabel(costs){
  if(!costs) return '';
  const p=[];
  if(Number(costs.energy)) p.push(`能量${Number(costs.energy)}`);
  if(Number(costs.sacrifice)) p.push(`祭品${Number(costs.sacrifice)}`);
  if(Number(costs.bones)) p.push(`骨头${Number(costs.bones)}`);
  return p.join('');
}
function kwLabel(e){
  const m = KW_MAP[e.k]; if(!m) return e.k;
  if(m.p==='none' || m.p==='act') return m.k;
  if(m.p==='reanimate') return `${m.k}_${costLabel(e.costs)||''}`;
  if(/num/.test(m.p)){
    const pre = m.res ? (e.res||'能量') : '';
    return `${m.k}_${pre}${e.v||''}`;
  }
  return m.k;
}
const DEFAULT_RULES = { hp:20, columns:5, openingHand:4, handLimit:8,
  energyStart:1, energyMax:10, deckSize:40 };
const TYPE_NAME = { minion:'随从', spell:'法术', amulet:'护符', crest:'纹章' };
const RARITY_MARK = { '普通':'◇', '稀有':'◆', '史诗':'✦', '传说':'★' };
const RARITY_COLOR = { '普通':'#cfc7b6', '稀有':'#7fb3e6', '史诗':'#b79aec', '传说':'#f0c15c' };

function blankCard(){
  return {
    id:'c'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),
    name:'', en:'', type:'minion', rarity:'普通',
    race:'', sacrificeCond:'', faith:0, counter:0,
    energy:1, sacrifice:0, bones:0,
    atk:2, hp:3, timer:0,
    keywords:[], text:'', flavor:'', notes:'', art:''
  };
}
const state = { cards:[], rules:{...DEFAULT_RULES}, cur:blankCard(), selId:null };

const $ = id => document.getElementById(id);
const esc = s => String(s??'').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let toastTimer;
function toast(m){ const t=$('toast'); t.textContent=m; t.classList.add('on');
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove('on'),1800); }
let saveTimer;
function scheduleSave(){ clearTimeout(saveTimer); saveTimer=setTimeout(persist,300); }
const KEY='ccg-designer-v19', OLD_KEY='ccg-designer-v18';
function persist(){ try{ localStorage.setItem(KEY, JSON.stringify({cards:state.cards, rules:state.rules})); }catch(e){} }

/* 召还 / 招募 条目规整：{k, costs, type, effect} */
function normRean(r){
  const costs = r.costs ? {energy:Number(r.costs.energy)||0, sacrifice:Number(r.costs.sacrifice)||0, bones:Number(r.costs.bones)||0} : null;
  if(costs) return {k:(r.k==='招募'?'招募':'亡者召还'), costs, type:r.type||'', effect:r.effect||''};
  /* 旧结构：{res, v} */
  const n = Number(r.v)||0;
  const c0 = {energy:0, sacrifice:0, bones:0};
  if(r.res==='祭品') c0.sacrifice = n;
  else if(r.res==='骨头') c0.bones = n;
  else c0.energy = n;
  return {k:(r.k==='招募'?'招募':'亡者召还'), costs:c0, type:r.type||'', effect:r.effect||''};
}
function normalize(c){
  const out = {...blankCard(), ...c};  ['energy','sacrifice','bones','atk','hp','timer'].forEach(k=>out[k]=Number(out[k])||0);
  if(!out.type) out.type='minion';
  if(!RARITY_MARK[out.rarity]) out.rarity='普通';
  if(!out.race && out.faction) out.race = out.faction;
  out.sacrificeCond = out.sacrificeCond || out.sacCond || '';
  out.faith = Number(out.faith)||0;
  out.counter = Number(out.counter)||0;
  delete out.role; delete out.sacCondLevel; delete out.effectValue;
  const arr = Array.isArray(out.keywords) ? out.keywords : [];
  out.keywords = arr.map(x=>{
    if(typeof x==='string'){ const m=KW_MAP[x]; return newKwEntry(m||{k:x,p:'none'}); }
    const m = KW_MAP[x.k];
    const e = {k:x.k, v:Number(x.v)||0, effect:x.effect||''};
    if(m && m.res) e.res = RES.includes(x.res) ? x.res : (m.resDef||'能量');
    if(m && m.p==='act') e.cost = {energy:0, sacrifice:0, bones:0, ...(x.cost||{})};
    if(m && m.p==='reanimate'){
      e.type = x.type||''; e.after = x.after||'';
      e.costs = x.costs ? {energy:Number(x.costs.energy)||0, sacrifice:Number(x.costs.sacrifice)||0, bones:Number(x.costs.bones)||0}
                        : {energy:Number(x.v)||0, sacrifice:0, bones: RES.includes(x.res)&&x.res==='祭品'?Number(x.v)||0:0};
      if(x.res==='骨头' && !x.costs) e.costs = {energy:0,sacrifice:0,bones:Number(x.v)||0};
      delete e.v; delete e.res;
    }
    if(x.choice) e.choice = {on:!!x.choice.on, opts:(x.choice.opts||['','']).slice(0,4)};
    if(x.k==='瞬念召唤') e.when = (x.when==='end') ? 'end' : 'now';
    if(m && m.p==='fusion'){ e.fcond = (x.fcond==null? '' : String(x.fcond)); e.ftype = ['卡牌','随从','护符','法术'].includes(x.ftype)? x.ftype : (m.ftypeDef||'卡牌'); }
    if(Array.isArray(x.reans)) e.reans = x.reans.map(normRean);
    return e;
  }).filter(x=>KW_MAP[x.k]);
  /* 法术的抉择（卡片级） */
  if(out.choice && typeof out.choice==='object'){
    const op=(out.choice.opts||[]).slice(0,4).map(o=>({
      t:String((o&&o.t)||''), reans:Array.isArray(o&&o.reans)? o.reans.map(normRean):[]
    }));
    while(op.length<2) op.push({t:'',reans:[]});
    out.choice={on:!!out.choice.on, opts:op};
  }else{
    delete out.choice;
  }
  /* 按种类白名单裁剪词条 */
  out.keywords = out.keywords.filter(x=>kwAllowed(x.k, out.type));
  /* 旧版：亡者召还带 after 字段 → 移入宿主的内嵌列表 */
  const legacyReans = out.keywords.filter(x=>x.k==='亡者召还' && x.after);
  legacyReans.forEach(r=>{
    let hostKey = r.after;
    if(hostKey==='抉择'){
      hostKey = ['入场曲','启动'].find(k=>out.keywords.some(x=>x.k===k)) || '';
    }
    if(!hostKey || !HOST_TAGS.has(hostKey)) return;
    let h = out.keywords.find(x=>x.k===hostKey);
    if(!h){ h = newKwEntry(KW_MAP[hostKey]); out.keywords.push(h); }
    h.reans = Array.isArray(h.reans) ? h.reans : [];
    h.reans.push({res:r.res||'能量', v:r.v||0, type:r.type||'', effect:r.effect||''});
  });
  if(legacyReans.length) out.keywords = out.keywords.filter(x=>x.k!=='亡者召还' || !x.after);

  /* 旧数据迁移：倒计时的效果原本写在正文里 → 搬进词条效果框 */
  const cd0 = out.keywords.find(x=>x.k==='倒计时');
  if(cd0 && !String(cd0.effect||'').trim() && typeof out.text==='string' && out.text.trim()){
    const ls = out.text.split('\n');
    const i0 = ls.findIndex(l=>/^\s*【倒计时[^】]*】/.test(l));
    if(i0>=0){
      const mm = ls[i0].match(/^\s*【倒计时[^】]*】\s*([\s\S]*)$/);
      if(mm && mm[1].trim()){
        cd0.effect = mm[1].trim();
        ls.splice(i0,1);
        out.text = ls.join('\n').replace(/^\n+/, '');
      }
    }
  }

  /* 旧版独立「抉择」词条迁移到入场曲 / 启动 */
  const ci = out.keywords.findIndex(x=>x.k==='抉择');
  if(ci>=0){
    const old = out.keywords.splice(ci,1)[0];
    const opts=(old.effect||'').split('\n').map(s=>s.trim()).filter(Boolean);
    const host = out.keywords.find(x=>x.k==='入场曲') || out.keywords.find(x=>x.k==='启动');
    if(opts.length){
      if(host){ host.choice={on:true, opts: opts.map(t=>({t, reans:[]}))}; host.effect=''; }
      else out.text = ['【抉择】选择1个能力发动。', ...opts.map((o,i)=>`（${i+1}）${o}`), out.text].filter(Boolean).join('\n');
    }
  }
  out.keywords.forEach(x=>{
    if(HOST_TAGS.has(x.k)){
      const rawOpts = (x.choice&&Array.isArray(x.choice.opts)&&x.choice.opts.length) ? x.choice.opts : [{t:'',reans:[]},{t:'',reans:[]}];
      x.choice = {on:!!(x.choice&&x.choice.on), opts: rawOpts.map(o=>
        typeof o==='string'
          ? {t:o, reans:[]}
           : {t:o.t||'', reans:(Array.isArray(o.reans)?o.reans:[]).map(normRean)}
      )};
      x.reans = (Array.isArray(x.reans)?x.reans:[]).map(normRean);
    }
    if(x.k==='亡者召还'){ delete x.after; }
  });
  return out;
}
function restore(){
  for(const key of [KEY, OLD_KEY]){
    try{
      const raw = localStorage.getItem(key); if(!raw) continue;
      const d = JSON.parse(raw);
      if(Array.isArray(d.cards)) state.cards = d.cards.map(normalize);
      if(d.rules) state.rules = {...DEFAULT_RULES, ...d.rules};
      return true;
    }catch(e){}
  }
  return false;
}

/* =========================================================
   表单
   ========================================================= */
const FIELDS = [
  ['f-name','name',0],['f-en','en',0],['f-race','race',0],['f-saccond','sacrificeCond',0],
  ['f-energy','energy',1],['f-sacrifice','sacrifice',1],['f-bones','bones',1],
  ['f-atk','atk',1],['f-hp','hp',1],['f-timer','timer',1],['f-counter','counter',1],
  ['f-text','text',0],['f-flavor','flavor',0],['f-notes','notes',0],
];
FIELDS.forEach(([id,k,num])=>{
  const el=$(id); if(!el) return;
  el.addEventListener('input', ()=>{
    state.cur[k] = num ? (parseInt(el.value,10)||0) : el.value;
    renderPreview(); scheduleSave();
  });
});
$('f-faith').addEventListener('change', e=>{
  state.cur.faith = parseInt(e.target.value,10)||0;
  renderPreview(); scheduleSave();
});
$('raritybar').addEventListener('click', e=>{
  const b=e.target.closest('button[data-r]'); if(!b) return;
  state.cur.rarity=b.dataset.r;
  [...$('raritybar').children].forEach(x=>x.classList.toggle('on', x===b));
  renderPreview(); renderLibrary(); scheduleSave();
});
[...$('typebar').children].forEach(b=>b.addEventListener('click', ()=>{
  const prev = state.cur.type;
  state.cur.type = b.dataset.t;
  [...$('typebar').children].forEach(x=>x.classList.toggle('on', x===b));
  /* 切换种类时，移除该种类不允许的词条 */
  const removed = [];
  state.cur.keywords = state.cur.keywords.filter(e=>{
    if(kwAllowed(e.k, state.cur.type)) return true;
    removed.push(e.k); return false;
  });
  if(removed.length) toast('已移除该种类不允许的词条：' + [...new Set(removed)].join('、'));
  syncTypeRows(); buildKwGroups(); syncKwUI(); renderPreview(); scheduleSave();
}));
function syncTypeRows(){
  const t=state.cur.type;
  const isMinion = t==='minion';
  $('f-atk').closest('label').style.opacity = isMinion?1:.35;
  $('f-hp').closest('label').style.opacity = isMinion?1:.35;
  $('f-timer').closest('label').style.opacity = (t==='amulet'||t==='crest')?1:.35;
  $('crestrow').style.display = (t==='crest') ? '' : 'none';
  renderSpellChoice();
}

/* ---- 法术的【抉择】：主效果二选一（选项内可再挂亡者召还 / 招募） ---- */
const TEXT_CAPTION_NORMAL = '效果文本（主能力 / 持续能力；时点能力填在下方词条里）';
const TEXT_CAPTION_CHOICE = '效果文本（已切换为【抉择】：卡面改用下方选项，这里的内容保留但不显示）';
function renderSpellChoice(){
  const c = state.cur;
  const wrap = $('spellChoiceWrap'); if(!wrap) return;
  const isSpell = c.type === 'spell';
  wrap.style.display = isSpell ? '' : 'none';
  if(!isSpell){ $('f-text').style.display=''; $('f-text-caption').textContent = TEXT_CAPTION_NORMAL; return; }

  if(!c.choice || typeof c.choice!=='object') c.choice = {on:false, opts:[{t:'',reans:[]},{t:'',reans:[]}]};
  c.choice.opts = (c.choice.opts||[]).slice(0,4);
  while(c.choice.opts.length < 2) c.choice.opts.push({t:'',reans:[]});
  c.choice.opts.forEach(o=>{ o.t = o.t||''; if(!Array.isArray(o.reans)) o.reans = []; });

  [...wrap.querySelectorAll('.modebtn')].forEach(b=>{
    b.classList.toggle('on', (b.dataset.smode==='choice') === !!c.choice.on);
  });

  const on = !!c.choice.on;
  $('f-text').style.display = on ? 'none' : '';
  $('f-text-caption').textContent = on ? TEXT_CAPTION_CHOICE : TEXT_CAPTION_NORMAL;
  const box = $('spellChoiceBox'), hint = $('spellChoiceHint');
  box.style.display = on ? '' : 'none';
  hint.style.display = on ? '' : 'none';
  if(!on){ box.innerHTML=''; hint.textContent=''; return; }

  box.innerHTML = c.choice.opts.map((o,i)=>`
    <div class="optline">
      <span class="optno">（${i+1}）</span>
      <input type="text" class="kwopt" data-i="${i}" placeholder="第${i+1}个选项的效果" value="${esc(o.t||'')}">
      <button class="optaddrean" data-i="${i}" title="在该选项内追加亡者召还">＋召还</button>
      <button class="optdel" data-i="${i}" title="删除该选项">✕</button>
    </div>
    ${(o.reans&&o.reans.length)? `<div class="optreans">${o.reans.map((r,ri)=>reanRowHTML(r,-1,i,ri)).join('')}</div>`:''}`
  ).join('') + `<div class="optline"><button class="optadd">＋ 选项</button></div>`;
  hint.textContent = '写法：【抉择】选择1个能力发动。下面每个（n）是一条选项，选项里还可以再挂亡者召还 / 招募。';

  /* 选项文字 */
  box.querySelectorAll('.kwopt').forEach(inp=>inp.addEventListener('input', ()=>{
    c.choice.opts[+inp.dataset.i].t = inp.value; renderPreview(); scheduleSave();
  }));
  /* 增删选项 */
  box.querySelectorAll('.optdel').forEach(b=>b.addEventListener('click', ()=>{
    c.choice.opts.splice(+b.dataset.i,1);
    if(c.choice.opts.length<2) c.choice.opts.push({t:'',reans:[]});
    renderSpellChoice(); renderPreview(); scheduleSave();
  }));
  const add=box.querySelector('.optadd');
  if(add) add.addEventListener('click', ()=>{
    if(c.choice.opts.length>=4){ toast('最多 4 个选项'); return; }
    c.choice.opts.push({t:'',reans:[]});
    renderSpellChoice(); renderPreview(); scheduleSave();
  });
  /* 选项里加召还 */
  box.querySelectorAll('.optaddrean').forEach(b=>b.addEventListener('click', ()=>{
    const op = c.choice.opts[+b.dataset.i];
    op.reans = op.reans || [];
    if(op.reans.length>=3){ toast('每个选项最多 3 条亡者召还'); return; }
    op.reans.push({k:'亡者召还', costs:{energy:2,sacrifice:0,bones:0}, type:'', effect:''});
    renderSpellChoice(); renderPreview(); scheduleSave();
  }));
  /* 绑定召还行（卡片级：data-h=-1） */
  box.querySelectorAll('.reanrow').forEach(rr=>{
    const oIdx=+rr.dataset.o, rIdx=+rr.dataset.r;
    const list = c.choice.opts[oIdx] && c.choice.opts[oIdx].reans;
    const r = list && list[rIdx]; if(!r) return;
    r.costs = r.costs || {energy:0,sacrifice:0,bones:0};
    const kd=rr.querySelector('.rkind'), ce=rr.querySelector('.rc-e'), cs=rr.querySelector('.rc-s'),
          cb=rr.querySelector('.rc-b'), tp=rr.querySelector('.rtype'), fx=rr.querySelector('.rfx'),
          dl=rr.querySelector('.rdel'), pv=rr.querySelector('.rpv');
    const paint=()=>{ if(pv) pv.textContent = reanHead(r)+reanBody(r); };
    paint(); r.k = r.k==='招募' ? '招募' : '亡者召还';
    if(kd) kd.addEventListener('change', ()=>{ r.k=kd.value; paint(); renderPreview(); scheduleSave(); });
    if(ce) ce.addEventListener('input', ()=>{ r.costs.energy=parseInt(ce.value,10)||0; paint(); renderPreview(); scheduleSave(); });
    if(cs) cs.addEventListener('input', ()=>{ r.costs.sacrifice=parseInt(cs.value,10)||0; paint(); renderPreview(); scheduleSave(); });
    if(cb) cb.addEventListener('input', ()=>{ r.costs.bones=parseInt(cb.value,10)||0; paint(); renderPreview(); scheduleSave(); });
    if(tp) tp.addEventListener('input', ()=>{ r.type=tp.value; paint(); renderPreview(); scheduleSave(); });
    if(fx) fx.addEventListener('input', ()=>{ r.effect=fx.value; paint(); renderPreview(); scheduleSave(); });
    if(dl) dl.addEventListener('click', ()=>{ list.splice(rIdx,1); renderSpellChoice(); renderPreview(); scheduleSave(); });
  });
}
[...$('spellChoiceWrap').querySelectorAll('.modebtn')].forEach(b=>b.addEventListener('click', ()=>{
  state.cur.choice = state.cur.choice || {on:false, opts:[{t:'',reans:[]},{t:'',reans:[]}]};
  state.cur.choice.on = (b.dataset.smode==='choice');
  renderSpellChoice(); renderPreview(); scheduleSave();
}));

/* ---- 种类可用的词条（按你的规则白名单） ---- */
const TYPE_KW = {
  minion: null,  // null = 全部
  spell: ['融合','爆能强化','激奏','结晶','连击','亡者召还','招募'],
  crest: ['倒计时','回合开始时','回合结束时','启动','连击'],
  amulet: ['潜行','灵气','位移','倒计时','入场曲','谢幕曲','回合开始时','回合结束时',
           '瞬念召唤','融合','爆能强化','激奏','结晶','连击','启动','亡者召还','招募'],
};
function kwAllowed(k, type){
  const list = TYPE_KW[type];
  return !list || list.includes(k);
}

/* =========================================================
   词条 UI
   ========================================================= */
function buildKwGroups(){
  const box=$('kwGroups'); box.innerHTML='';
  const type = state.cur.type;
  GROUPS.forEach(g=>{
    const list=KW.filter(x=>x.p===g.p && kwAllowed(x.k, type) &&
      /* 亡者召还：随从/护符通过宿主的「＋追加亡者召还」使用，只有法术直接添加 */
      !((x.k==='亡者召还'||x.k==='招募') && type!=='spell')); if(!list.length) return;
    const wrap=document.createElement('div'); wrap.className='kwgroup';
    wrap.innerHTML=`<h4>${g.title}　<span style="color:#5f574a">${list.length}</span></h4>`;
    const chips=document.createElement('div'); chips.className='chips';
    list.forEach(m=>{
      const b=document.createElement('button');
      b.className='chip'; b.dataset.k=m.k; b.title=m.d;
      b.innerHTML = esc(m.k) + (m.p==='none' ? '' : '<span class="dot">·</span>') + '<span class="cnt"></span>';
      b.addEventListener('click', ()=>{
        if(m.multi){
          if(state.cur.keywords.filter(x=>x.k===m.k).length>=3){ toast('最多 3 条'); return; }
          state.cur.keywords.push(newKwEntry(m));
        }else{
          const i=state.cur.keywords.findIndex(x=>x.k===m.k);
          if(i>=0) state.cur.keywords.splice(i,1);
          else state.cur.keywords.push(newKwEntry(m));
        }
        syncKwUI(); renderPreview(); scheduleSave();
      });
      chips.appendChild(b);
    });
    wrap.appendChild(chips); box.appendChild(wrap);
  });
}
function syncKwUI(){
  document.querySelectorAll('#kwGroups .chip').forEach(ch=>{
    const n = state.cur.keywords.filter(x=>x.k===ch.dataset.k).length;
    ch.classList.toggle('on', n>0);
    const c=ch.querySelector('.cnt');
    if(c) c.textContent = n>1 ? `×${n}` : '';
  });
  renderKwEditor();
}
function newKwEntry(m){
  const e = {k:m.k, v:/num/.test(m.p)?(m.def||0):0, effect:''};
  if(m.res) e.res = m.resDef || '能量';
  if(m.p==='act'){ e.cost = {energy:1, sacrifice:0, bones:0}; }
  if(m.p==='reanimate'){ e.costs = {energy:m.def||5, sacrifice:0, bones:0}; e.type=''; }
  if(m.p==='fusion'){ e.fcond = ''; e.ftype = m.ftypeDef || '卡牌'; }
  if(m.p==='act' || HOST_TAGS.has(m.k)){ e.choice = {on:false, opts:['','']}; e.reans = []; }
  return e;
}
/* 所有能挂「效果 / 抉择 / 亡者召还」的宿主词条 */
const HOST_TAGS = new Set(['入场曲','谢幕曲','攻击时','回合开始时','回合结束时','随从进场时','随从离场时','启动','爆能强化','激奏','结晶','连击']);
const HOSTS = HOST_TAGS;  /* 兼容旧引用 */
/* =========================================================
   词条编辑区（v1.3）
   宿主 = 入场曲/谢幕曲/攻击时/回合开始/回合结束/随从进场/随从离场/启动/
          爆能强化/激奏/结晶/连击
   宿主内可放：普通效果 / 抉择（每个选项内还能再挂亡者召还）/ 亡者召还
   ========================================================= */
function reanRowHTML(r, hIdx, oIdx, rIdx){
  const c=r.costs||{energy:0,sacrifice:0,bones:0};
  return `<div class="reanrow" data-h="${hIdx}" data-o="${oIdx}" data-r="${rIdx}">
    <select class="rkind">
      <option ${r.k!=='招募'?'selected':''}>亡者召还</option>
      <option ${r.k==='招募'?'selected':''}>招募</option>
    </select>
    <span class="unit">能量</span><input type="number" class="rc-e" min="0" max="20" value="${c.energy||0}">
    <span class="unit">祭品</span><input type="number" class="rc-s" min="0" max="5" value="${c.sacrifice||0}">
    <span class="unit">骨头</span><input type="number" class="rc-b" min="0" max="20" value="${c.bones||0}">
    <input type="text" class="rtype" placeholder="仅限「」内（可空）" value="${esc(r.type||'')}">
    <input type="text" class="rfx" placeholder="紧接其后补充（可空）" value="${esc(r.effect||'')}">
    <button class="rdel" title="删除">✕</button>
    <div class="rpreview"><span class="rpv"></span></div>
  </div>`;
}
function renderKwEditor(){
  const box=$('kwEditor'); box.innerHTML='';
  state.cur.keywords.forEach((e,idx)=>{
    const m=KW_MAP[e.k]; if(!m || m.p==='none') return;
    const isHost = HOST_TAGS.has(e.k);
    if(isHost){
      e.choice = e.choice || {on:false, opts:[{t:'',reans:[]},{t:'',reans:[]}]};
      e.choice.opts = (e.choice.opts||[]).map(o=> typeof o==='string' ? {t:o, reans:[]} : {t:o.t||'', reans:Array.isArray(o.reans)?o.reans:[]});
      if(!e.choice.opts.length) e.choice.opts=[{t:'',reans:[]},{t:'',reans:[]}];
      e.reans = Array.isArray(e.reans) ? e.reans : [];
    }
    const choiceOn = isHost && e.choice.on;

    const row=document.createElement('div');
    row.className='kwrow' + (isHost?' host':'');
    const del = (m.multi || isHost)
      ? `<button class="kwdel" data-idx="${idx}" title="删除这条">✕</button>` : '';

    let html=`<span class="kwtag">${esc(e.k)}</span>${del}`;

    /* 启动：三格费用 */
    if(m.p==='act'){
      e.cost = e.cost || {energy:1,sacrifice:0,bones:0};
      html += `<span class="unit">能量</span><input type="number" min="0" max="20" class="kwe" value="${e.cost.energy||0}">`;
      html += `<span class="unit">祭品</span><input type="number" min="0" max="5" class="kws" value="${e.cost.sacrifice||0}">`;
      html += `<span class="unit">骨头</span><input type="number" min="0" max="20" class="kwb" value="${e.cost.bones||0}">`;
    }
    /* 独立的亡者召还 / 招募（法术） */
    else if(m.p==='reanimate'){
      e.costs = e.costs || {energy:5,sacrifice:0,bones:0};
      html += `<span class="unit">能量</span><input type="number" class="kwe" min="0" max="20" value="${e.costs.energy||0}">`;
      html += `<span class="unit">祭品</span><input type="number" class="kws" min="0" max="5" value="${e.costs.sacrifice||0}">`;
      html += `<span class="unit">骨头</span><input type="number" class="kwb" min="0" max="20" value="${e.costs.bones||0}">`;
      html += `<input type="text" class="kwtype" placeholder="仅限类型（可空）" value="${esc(e.type||'')}">`;
      html += `<input type="text" class="kwfx" placeholder="补充说明（可空）" value="${esc(e.effect||'')}">`;
    }
    /* 融合：条件 · 类型 + 结果 */
    else if(m.p==='fusion'){
      e.fcond = (e.fcond==null ? '' : String(e.fcond));
      e.ftype = e.ftype || '卡牌';
      html += `<input type="text" class="kwfcond" placeholder="条件（可空=不限，例：机械）" value="${esc(e.fcond)}">`;
      html += `<span class="unit">·</span><select class="kwftype">${
        ['卡牌','随从','护符','法术'].map(t=>`<option ${e.ftype===t?'selected':''}>${t}</option>`).join('')
      }</select>`;
      html += `<input type="text" class="kwfx" placeholder="${esc(m.fxHint||'融合的结果')}" value="${esc(e.effect||'')}">`;
      html += `<span class="unit">→ 【融合】${e.fcond ? esc(e.fcond)+'·' : ''}${esc(e.ftype)}</span>`;
    }
    /* 其它 / 费用类宿主的数值部分 */
    else{
      if(m.res) html += `<select class="kwres">${RES.map(r=>`<option ${e.res===r?'selected':''}>${r}</option>`).join('')}</select>`;
      if(/num/.test(m.p)) html += `<input type="number" min="0" max="30" value="${e.v||m.def||1}" class="kwnum"><span class="unit">${esc(m.unit||'')}</span>`;
      if(e.k==='倒计时') html += `<input type="text" class="kwfx" placeholder="${esc(m.fxHint||'倒计时的效果')}" value="${esc(e.effect||'')}">`;
      /* 瞬念召唤：发动时机 */
      if(e.k==='瞬念召唤'){
        html += `<span class="unit">时机</span><select class="kwwhen">
          <option value="now" ${e.when!=='end'?'selected':''}>满足条件即刻</option>
          <option value="end" ${e.when==='end'?'selected':''}>回合结束后</option>
        </select>`;
      }
      /* 非宿主的 fx 词条（瞬念召唤 / 融合）：必须要有效果输入框 */
      if(/fx/.test(m.p) && !isHost){
        html += `<input type="text" class="kwfx" placeholder="${esc(m.fxHint||'效果 / 发动条件')}" value="${esc(e.effect||'')}">`;
      }
    }

    /* 宿主：形态 + 本体 + 亡者召还 */
    if(isHost){
      html += `<div class="hostbar">
        <button class="modebtn ${choiceOn?'':'on'}" data-mode="text">普通效果</button>
        <button class="modebtn ${choiceOn?'on':''}" data-mode="choice">抉择</button>
        <button class="addrean" title="在这个能力之后追加亡者召还">＋ 亡者召还</button>
      </div>`;
      if(choiceOn){
        html += `<div class="optbox">` + e.choice.opts.map((o,i)=>
          `<div class="optline">
             <span class="optno">（${i+1}）</span>
             <input type="text" class="kwopt" data-i="${i}" placeholder="第${i+1}个选项的效果" value="${esc(o.t||'')}">
             <button class="optaddrean" data-i="${i}" title="在该选项内追加亡者召还">＋召还</button>
             <button class="optdel" data-i="${i}" title="删除该选项">✕</button>
           </div>
           ${(o.reans&&o.reans.length)? `<div class="optreans">${o.reans.map((r,ri)=>reanRowHTML(r,idx,i,ri)).join('')}</div>`:''}`
        ).join('') + `<div class="optline"><button class="optadd">＋ 选项</button></div></div>`;
      }else{
        html += `<input type="text" class="kwfx" placeholder="${esc(m.fxHint||'该能力的效果')}" value="${esc(e.effect||'')}">`;
      }
      if(e.reans.length){
        html += `<div class="reanbox">${e.reans.map((r,ri)=>reanRowHTML(r,idx,-1,ri)).join('')}</div>`;
      }
    }

    row.innerHTML=html;

    /* --- 事件 --- */
    const n=row.querySelector('.kwnum'), f=row.querySelector('.kwfx');
    if(n) n.addEventListener('input', ()=>{ e.v=parseInt(n.value,10)||0; renderPreview(); scheduleSave(); });
    if(f) f.addEventListener('input', ()=>{ e.effect=f.value; renderPreview(); scheduleSave(); });

    const rs=row.querySelector('.kwres');
    if(rs) rs.addEventListener('change', ()=>{ e.res=rs.value; renderKwEditor(); renderPreview(); scheduleSave(); });
    const fc=row.querySelector('.kwfcond');
    if(fc) fc.addEventListener('input', ()=>{ e.fcond=fc.value; renderPreview(); scheduleSave(); });
    const ft=row.querySelector('.kwftype');
    if(ft) ft.addEventListener('change', ()=>{ e.ftype=ft.value; renderKwEditor(); renderPreview(); scheduleSave(); });
    const ty=row.querySelector('.kwtype');
    if(ty) ty.addEventListener('input', ()=>{ e.type=ty.value; renderPreview(); scheduleSave(); });
    const wh=row.querySelector('.kwwhen');
    if(wh) wh.addEventListener('change', ()=>{ e.when=wh.value; renderPreview(); scheduleSave(); });

    [...row.querySelectorAll('.kwopt')].forEach(inp=>inp.addEventListener('input', ()=>{
      e.choice.opts[+inp.dataset.i].t = inp.value;
      renderPreview(); scheduleSave();
    }));
    row.querySelectorAll('.optdel').forEach(b=>b.addEventListener('click', ()=>{
      e.choice.opts.splice(+b.dataset.i,1);
      if(e.choice.opts.length<2) e.choice.opts.push({t:'',reans:[]});
      renderKwEditor(); renderPreview(); scheduleSave();
    }));
    row.querySelectorAll('.optaddrean').forEach(b=>b.addEventListener('click', ()=>{
      const o = e.choice.opts[+b.dataset.i];
      o.reans = o.reans || [];
      if(o.reans.length>=3){ toast('每个选项最多 3 条亡者召还'); return; }
      o.reans.push({k:'亡者召还', costs:{energy:2,sacrifice:0,bones:0}, type:'', effect:''});
      renderKwEditor(); renderPreview(); scheduleSave();
    }));
    const add=row.querySelector('.optadd');
    if(add) add.addEventListener('click', ()=>{
      if(e.choice.opts.length>=4){ toast('最多 4 个选项'); return; }
      e.choice.opts.push({t:'',reans:[]});
      renderKwEditor(); renderPreview(); scheduleSave();
    });
    row.querySelectorAll('.modebtn').forEach(b=>b.addEventListener('click', ()=>{
      e.choice.on = b.dataset.mode==='choice';
      renderKwEditor(); renderPreview(); scheduleSave();
    }));
    const addRean=row.querySelector('.addrean');
    if(addRean) addRean.addEventListener('click', ()=>{
      if(e.reans.length>=3){ toast('每个能力最多 3 条亡者召还'); return; }
      e.reans.push({k:'亡者召还', costs:{energy:2,sacrifice:0,bones:0}, type:'', effect:''});
      renderKwEditor(); renderPreview(); scheduleSave();
    });

    const dlTop=row.querySelector('.kwdel');
    if(dlTop) dlTop.addEventListener('click', ()=>{
      const i=state.cur.keywords.indexOf(e);
      if(i>=0) state.cur.keywords.splice(i,1);
      syncKwUI(); renderPreview(); scheduleSave();
    });

    const ce=row.querySelector('.kwe'), cs=row.querySelector('.kws'), cb=row.querySelector('.kwb');
    if(ce) ce.addEventListener('input', ()=>{ const t=(m.p==='reanimate'? e.costs : e.cost); t.energy=parseInt(ce.value,10)||0; renderPreview(); scheduleSave(); });
    if(cs) cs.addEventListener('input', ()=>{ const t=(m.p==='reanimate'? e.costs : e.cost); t.sacrifice=parseInt(cs.value,10)||0; renderPreview(); scheduleSave(); });
    if(cb) cb.addEventListener('input', ()=>{ const t=(m.p==='reanimate'? e.costs : e.cost); t.bones=parseInt(cb.value,10)||0; renderPreview(); scheduleSave(); });

    box.appendChild(row);
  });

  /* 绑定所有内嵌召还/招募行（含选项内部） */
  box.querySelectorAll('.reanrow').forEach(rr=>{
    const hIdx=+rr.dataset.h, oIdx=+rr.dataset.o, rIdx=+rr.dataset.r;
    const entry = state.cur.keywords[hIdx]; if(!entry) return;
    const list = oIdx>=0 ? entry.choice.opts[oIdx].reans : entry.reans;
    const r = list && list[rIdx]; if(!r) return;
    r.costs = r.costs || {energy:0,sacrifice:0,bones:0};
    const kd=rr.querySelector('.rkind'),
          ce=rr.querySelector('.rc-e'), cs=rr.querySelector('.rc-s'), cb=rr.querySelector('.rc-b'),
          tp=rr.querySelector('.rtype'), fx=rr.querySelector('.rfx'), dl=rr.querySelector('.rdel');
    const pv = rr.querySelector('.rpv');
    const paint = ()=>{ if(pv) pv.textContent = reanHead(r) + reanBody(r); };
    paint();
    if(kd) kd.addEventListener('change', ()=>{ r.k=kd.value; paint(); renderPreview(); scheduleSave(); });
    if(ce) ce.addEventListener('input', ()=>{ r.costs.energy=parseInt(ce.value,10)||0; paint(); renderPreview(); scheduleSave(); });
    if(cs) cs.addEventListener('input', ()=>{ r.costs.sacrifice=parseInt(cs.value,10)||0; paint(); renderPreview(); scheduleSave(); });
    if(cb) cb.addEventListener('input', ()=>{ r.costs.bones=parseInt(cb.value,10)||0; paint(); renderPreview(); scheduleSave(); });
    if(tp) tp.addEventListener('input', ()=>{ r.type=tp.value; paint(); renderPreview(); scheduleSave(); });
    if(fx) fx.addEventListener('input', ()=>{ r.effect=fx.value; paint(); renderPreview(); scheduleSave(); });
    if(dl) dl.addEventListener('click', ()=>{ list.splice(rIdx,1); renderKwEditor(); renderPreview(); scheduleSave(); });
  });
}

/* =========================================================
   卡面文本组装
   ========================================================= */
function costText(cost){
  if(!cost) return '';
  const p=[];
  if(cost.energy) p.push(`能量${cost.energy}`);
  if(cost.sacrifice) p.push(`祭品${cost.sacrifice}`);
  if(cost.bones) p.push(`骨头${cost.bones}`);
  return p.join('，');
}
/* 亡者召还 / 招募：词条本身已完整表达；类型/补充文本都可空 */
function reanHead(r){ return `【${r.k||'亡者召还'}_${costLabel(r.costs)}】`; }
/* 类型与补充说明是「拼接」而不是「覆盖」：
   type  → 仅限「type」
   effect→ 直接接在后面（标点由作者自己控制）
   例：type=机械 + effect=种族的随从，发动2次。 → 仅限「机械」种族的随从，发动2次。 */
function reanTypePart(r){ const t=(r.type||'').trim(); return t ? `仅限「${t}」` : ''; }
function reanBody(r){
  const tp = reanTypePart(r);
  const eff = (r.effect||'').trim();
  if(tp && eff) return tp + eff;
  if(tp) return tp + '。';
  return eff;
}
/* 单个宿主块：普通效果 / 抉择（选项内可嵌亡者召还）/ 亡者召还 */
function hostBlock(c, k, entry){
  const out=[];
  const e = entry || c.keywords.find(x=>x.k===k);
  if(!e) return out;

  const pre = (k==='启动') ? (costText(e.cost) ? costText(e.cost)+'：' : '') : '';
  const head = (k==='启动') ? '【启动】' : `【${kwLabel(e)}】`;

  let hostHasText=false;
  if(e.choice && e.choice.on){
    const opts=(e.choice.opts||[]);
    if(opts.length){
      out.push({cls:'fxline', head:`${head}${pre}`, mid:'【抉择】', body:'选择1个能力发动。'});
      opts.forEach((o,i)=>{
        const t=(o.t||'').trim(), rs=(o.reans||[]);
        if(t || !rs.length){
          out.push({cls:'optline', head:'', body:`（${i+1}）${t}`});
          rs.forEach(r=>out.push({cls:'optrean', head:'', body:`　${reanHead(r)}${reanBody(r)}`}));
        }else{
          /* 选项没有文字时，编号直接并到第一条召还/招募上，避免出现空的（1） */
          rs.forEach((r,j)=>{
            out.push({cls: j===0?'optline':'optrean', head:'',
              body:`${j===0?`（${i+1}）`:'　'}${reanHead(r)}${reanBody(r)}`});
          });
        }
      });
      hostHasText=true;
    }
  }else if((e.effect||'').trim()){
    out.push({cls:'fxline', head:`${head}${k==='启动'?'' : ''}`, body: pre + e.effect.trim()});
    hostHasText=true;
  }

  (e.reans||[]).forEach((r,i)=>{
    if(!hostHasText && i===0) out.push({cls:'fxline', head:`${head}${pre}`, mid:reanHead(r), body:reanBody(r)});
    else out.push({cls:'fxline', head:reanHead(r), body:reanBody(r)});
  });
  return out;
}
function buildLines(c){
  const L=[];
  ['多重攻击','荆棘','倒计时'].forEach(k=>{
    const e=c.keywords.find(x=>x.k===k);
    if(!e) return;
    if(k==='倒计时' && (e.effect||'').trim()){
      L.push({cls:'fxline', head:'【'+kwLabel(e)+'】', body:e.effect.trim()});
    }else{
      L.push({cls:'kwline', head:'', body:kwLabel(e)});
    }
  });
  L.push(...hostBlock(c,'入场曲'));
  ['谢幕曲','攻击时','回合开始时','回合结束时','随从进场时','随从离场时'].forEach(k=>L.push(...hostBlock(c,k)));

  /* 连击（可多条，逐条渲染） */
  c.keywords.filter(x=>x.k==='连击').forEach(x=>{ L.push(...hostBlock(c,'连击',x)); });

  if(c.type==='spell' && c.choice && c.choice.on){
    const sm=(c.choice.opts||[]);
    L.push({cls:'fxline', head:'【抉择】', body:'选择1个能力发动。'});
    sm.forEach((o,i)=>{
      const t=(o.t||'').trim(), rs=(o.reans||[]);
      if(t || !rs.length){
        L.push({cls:'optline', head:'', body:`（${i+1}）${t}`});
        rs.forEach(r=>L.push({cls:'optrean', head:'', body:`　${reanHead(r)}${reanBody(r)}`}));
      }else{
        rs.forEach((r,j)=>{
          L.push({cls: j===0?'optline':'optrean', head:'',
            body:`${j===0?`（${i+1}）`:'　'}${reanHead(r)}${reanBody(r)}`});
        });
      }
    });
  }else if((c.text||'').trim()){
    L.push({cls:'main', head:'', body:c.text.trim()});
  }

  L.push(...hostBlock(c,'启动'));

  /* 法术的独立亡者召还 */
  c.keywords.filter(x=>x.k==='亡者召还' || x.k==='招募').forEach(r=>{
    L.push({cls:'fxline', head:reanHead(r), body:reanBody(r)});
  });

  ['激奏','结晶','爆能强化'].forEach(k=>L.push(...hostBlock(c,k)));

  const sn=c.keywords.find(x=>x.k==='瞬念召唤');
  if(sn && (sn.effect||'').trim()){
    const pre = (sn.when==='end') ? '回合结束后，' : '';
    L.push({cls:'fxline', head:'【瞬念召唤】', body:pre + sn.effect.trim()});
  }
  const fu=c.keywords.find(x=>x.k==='融合');
  if(fu){
    const cond=(fu.fcond||'').trim(), ty=(fu.ftype||'卡牌');
    const head = `【融合】${cond ? cond+'·' : ''}${ty}　`;
    if((fu.effect||'').trim()) L.push({cls:'fxline', head, body:fu.effect.trim()});
    else L.push({cls:'kwline', head:'', body:head});
  }

  return L;
}function composeText(c){
  return buildLines(c).map(l=>(l.head||'')+(l.mid||'')+(l.body||'')).join('\n');
}

/* =========================================================
   预览 / 卡库
   ========================================================= */
const PLAIN_ORDER = ['守护','飞行','防空','潜行','灵气','虹吸','毁灭','两侧攻击','三侧攻击','全体攻击','位移','屏障'];

function renderPreview(){
  const c=state.cur;
  $('face').className='face t-'+c.type;
  $('face').style.setProperty('--rarc', RARITY_COLOR[c.rarity] || '#cfc7b6');
  $('faceName').textContent = c.name || '未命名卡牌';
  $('faceRar').textContent = RARITY_MARK[c.rarity] || '◇';
  $('faceRar').style.color = RARITY_COLOR[c.rarity] || '#cfc7b6';
  $('faceType').textContent = TYPE_NAME[c.type] + (c.race ? ' · '+c.race : '');

  const pe=$('pipEnergy'), pb=$('pipBlood'), po=$('pipBone');
  pe.textContent=c.energy; pe.classList.toggle('off', !c.energy);
  pb.textContent=c.sacrifice; pb.classList.toggle('off', !c.sacrifice);
  po.textContent=c.bones; po.classList.toggle('off', !c.bones);

  /* 费用价值（仅设计参考，不进入卡面） */
  const cv = (Number(c.energy)||0)*1 + (Number(c.sacrifice)||0)*1.5 + (Number(c.bones)||0)*0.5;
  const cvEl = $('costval');
  if(cvEl){
    cvEl.innerHTML = `费用价值 <b>${(Math.round(cv*10)/10).toFixed(1)}</b>　（能量×1 ＋ 祭品×1.5 ＋ 骨头×0.5，仅供设计参考）`;
  }

  /* 纹章 / 信仰 */
  const faith = $('faceFaith');
  if(c.type==='crest'){
    faith.classList.remove('off');
    faith.innerHTML = c.faith
      ? `<b>信仰</b> ${Number(c.counter)||0}　（不可消除）`
      : `<b>纹章</b>　不占格子`;
  }else{
    faith.classList.add('off'); faith.innerHTML='';
  }

  const cond=$('faceCond');
  const condText=(c.sacrificeCond||'').trim();
  if(c.sacrifice && condText){
    cond.classList.remove('off');
    cond.innerHTML = `<b>祭品${c.sacrifice}　条件：</b>${esc(condText)}`;
  }else if(condText){
    cond.classList.remove('off');
    cond.innerHTML = `<b>条件：</b>${esc(condText)}`;
  }else{
    cond.classList.add('off'); cond.innerHTML='';
  }

  const plains = c.keywords.filter(e=>{
    const m=KW_MAP[e.k]; return m && m.p==='none';
  }).sort((a,b)=>PLAIN_ORDER.indexOf(a.k)-PLAIN_ORDER.indexOf(b.k));
  $('faceKw').innerHTML = plains.map(e=>`<i title="${esc((KW_MAP[e.k]||{}).d||'')}">${esc(e.k)}</i>`).join('');

  $('faceBody').innerHTML = buildLines(c).map(l=>{
    const head = l.head ? `<span class="b">${esc(l.head)}</span>` : '';
    const mid = l.mid ? `<span class="b">${esc(l.mid)}</span>` : '';
    return `<div class="${l.cls}">${head}${mid}${esc(l.body)}</div>`;
  }).join('');

  $('faceFlavor').textContent = c.flavor ? '「'+c.flavor.replace(/^「|」$/g,'')+'」' : '';

  const isM=c.type==='minion';
  $('faceAtk').classList.toggle('off', !isM); $('faceHp').classList.toggle('off', !isM);
  $('faceAtk').textContent=c.atk; $('faceHp').textContent=c.hp;
  const cd=c.keywords.find(x=>x.k==='倒计时');
  const timerVal = (cd&&cd.v) || c.timer || 0;
  $('faceTimer').classList.toggle('off', !timerVal);
  $('faceTimer').textContent = timerVal;

  $('faceFooter').textContent = c.rarity || '卡牌构筑对战';
}
function renderLibrary(){
  const q=$('search').value.trim().toLowerCase();
  const ft=$('filterType').value;
  const list=state.cards.filter(c=>{
    if(ft && c.type!==ft) return false;
    if(!q) return true;
    return (c.name+c.text+c.race+c.sacrificeCond+c.keywords.map(x=>x.k).join('')).toLowerCase().includes(q);
  });
  $('libCount').textContent=`（${state.cards.length} 张，显示 ${list.length}）`;
  const box=$('libList');
  if(!list.length){
    box.innerHTML='<div class="empty">卡库是空的。<br>点右上「载入示例」看示范卡，或直接开始设计。</div>';
  }else{
    box.innerHTML=list.map(c=>{
      const cost=[c.energy?`${c.energy}能`:'',c.sacrifice?`祭品${c.sacrifice}`:'',c.bones?`骨${c.bones}`:'']
        .filter(Boolean).join('+')||'0';
      const st=c.type==='minion'?`${c.atk}/${c.hp}`:(c.type==='amulet'?`计时${c.timer}`:(c.type==='crest'?(c.faith?`信仰${c.counter||0}`:`计时${c.timer}`):'—'));
      const kws=c.keywords.map(e=>esc(kwLabel(e))).join(' / ');
      const badge=c.energy||c.bones||c.sacrifice||0;
      const rc=RARITY_COLOR[c.rarity]||'#9b8f7c';
      return `<div class="card-row ${c.id===state.selId?'sel':''}" data-id="${c.id}" style="border-left:3px solid ${rc}">
        <div class="cr-badge" style="border-color:${rc};color:${rc}">${esc(badge)}</div>
        <div class="cr-main">
          <div class="cr-name">${esc(c.name||'未命名')}
            <span style="color:#7d7361;font-size:11px">${TYPE_NAME[c.type]} ${st}${c.race?' · '+esc(c.race):''}</span></div>
          <div class="cr-meta"><span style="color:${rc}">${esc(c.rarity)}</span> · ${cost}${c.sacrificeCond&&c.sacrifice?'（'+esc(c.sacrificeCond)+'）':''}${kws?' · '+kws:''}</div>
          <div class="cr-text">${esc(composeText(c).replace(/\n/g,' '))}</div>
        </div>
        <div class="cr-ops">
          <button data-op="dup" title="复制">⧉</button>
          <button data-op="del" title="删除" style="color:#a55">✕</button>
        </div>
      </div>`;
    }).join('');
  }
  box.querySelectorAll('.card-row').forEach(row=>{
    row.addEventListener('click', e=>{ if(!e.target.dataset.op) loadCard(row.dataset.id); });
    row.querySelectorAll('button[data-op]').forEach(b=>{
      b.addEventListener('click', e=>{
        e.stopPropagation();
        const card=state.cards.find(x=>x.id===row.dataset.id); if(!card) return;
        if(b.dataset.op==='del'){
          state.cards=state.cards.filter(x=>x.id!==card.id);
          if(state.selId===card.id) state.selId=null;
          renderLibrary(); persist(); toast('已删除');
        }else{
          state.cards.push({...card, id:blankCard().id, name:card.name+'（副本）',
            keywords:card.keywords.map(x=>({...x}))});
          renderLibrary(); persist(); toast('已复制');
        }
      });
    });
  });
  renderCurve();
}
function renderCurve(){
  const b={};
  state.cards.forEach(c=>{ const k=Math.min(c.energy,10); b[k]=(b[k]||0)+1; });
  const max=Math.max(1,...Object.values(b));
  let html='';
  for(let i=0;i<=10;i++){
    const n=b[i]||0, w=Math.round(n/max*100);
    html+=`<div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--dim);margin:2px 0">
      <span style="width:16px;text-align:right">${i}</span>
      <div style="flex:1;height:9px;background:#0d0b09;border-radius:2px;overflow:hidden">
        <div style="width:${w}%;height:100%;background:linear-gradient(90deg,#4d93c4,#8a6a24)"></div></div>
      <span style="width:20px">${n||''}</span></div>`;
  }
  $('curve').innerHTML=html;
}
function fillForm(){
  const c=state.cur;
  FIELDS.forEach(([id,k,num])=>{ const el=$(id); if(el) el.value = num ? (c[k]??0) : (c[k]??''); });
  [...$('raritybar').children].forEach(b=>b.classList.toggle('on', b.dataset.r===c.rarity));
  [...$('typebar').children].forEach(b=>b.classList.toggle('on', b.dataset.t===c.type));
  syncTypeRows();
  const art=$('faceArt');
  art.style.backgroundImage=c.art?`url(${c.art})`:'';
  art.classList.toggle('has', !!c.art);
  art.querySelector('span').style.display=c.art?'none':'';
  buildKwGroups(); syncKwUI(); renderPreview();
}
/* 当前编辑内容是否与卡库不一致 */
function cardSig(c){
  return JSON.stringify({
    n:c.name, e:c.en, t:c.type, r:c.rarity, rc:c.race, sc:c.sacrificeCond,
    en:c.energy, sa:c.sacrifice, bo:c.bones, a:c.atk, h:c.hp, ti:c.timer,
    k:c.keywords, x:c.text, sc2:c.choice, f:c.flavor, no:c.notes, art:c.art ? '#' : ''
  });
}
function isDirty(){
  const c = state.cur;
  const saved = state.cards.find(x=>x.id===c.id);
  if(!saved){
    return !!(c.name.trim() || c.text.trim() || c.flavor.trim() || c.notes.trim() ||
              (c.keywords && c.keywords.length) || c.art);
  }
  return cardSig(saved) !== cardSig(c);
}
/* 就地保存当前卡（不新建） */
function upsertCurrent(){
  if(!state.cur.name.trim()) return null;
  const idx = state.cards.findIndex(c=>c.id===state.cur.id);
  const rec = {...state.cur, keywords: state.cur.keywords.map(x=>({...x}))};
  if(idx>=0) state.cards[idx] = rec; else state.cards.push(rec);
  state.cur = {...rec, keywords: rec.keywords.map(x=>({...x}))};
  state.selId = rec.id;
  persist();
  return rec;
}
/* 切卡前：有改动就自动保存 */
function autoSaveIfDirty(){
  if(!isDirty()) return false;
  if(!state.cur.name.trim()){ toast('当前卡没有名字，未保存'); return false; }
  const name = state.cur.name;
  upsertCurrent();
  toast('已自动保存「' + name + '」');
  return true;
}

function loadCard(id){
  if(id === state.cur.id) return;
  autoSaveIfDirty();
  const c=state.cards.find(x=>x.id===id); if(!c) return;
  state.cur={...c, keywords:c.keywords.map(x=>({...x}))};
  state.selId=id; fillForm(); renderLibrary();
}

/* =========================================================
   按钮
   ========================================================= */
$('btnNew').addEventListener('click', ()=>{
  autoSaveIfDirty();
  state.cur=blankCard(); state.selId=null; $('artInput').value=''; fillForm(); renderLibrary();
});
function doSave(nextNew){
  if(!state.cur.name.trim()){ toast('先给卡牌起个名字'); return; }
  const wasNew = state.cards.findIndex(c=>c.id===state.cur.id) < 0;
  const rec = upsertCurrent();
  if(!rec) return;
  if(nextNew){
    /* 保存后自动新建，避免把下一张卡写进上一张 */
    state.cur = blankCard();
    state.selId = null;
    fillForm(); renderLibrary();
    toast(wasNew ? '已保存，已新建下一张' : '已更新，已新建下一张');
  }else{
    state.selId = rec.id;
    state.cur = {...rec, keywords:rec.keywords.map(x=>({...x}))};
    renderLibrary();
    toast(wasNew ? '已加入卡库' : '已更新');
  }
}
$('btnSave').addEventListener('click', ()=> doSave(true));

/* 回车保存：单行输入框内按 Enter 只保存当前卡（不新建）；按钮才是「保存并新建」 */
document.addEventListener('keydown', e=>{
  if(e.key !== 'Enter') return;
  if(e.ctrlKey || e.metaKey) return;          /* 交给全局快捷键，避免重复保存 */
  const tag = (e.target && e.target.tagName) ? e.target.tagName.toUpperCase() : '';
  if(tag !== 'INPUT') return;                  /* textarea 里回车照常换行 */
  e.preventDefault();
  doSave(false);                               /* 回车只保存，不新建 */
  e.target.blur();                             /* 取消输入框高亮 */
});
$('btnDup').addEventListener('click', ()=>{
  state.cur={...state.cur, id:blankCard().id, keywords:state.cur.keywords.map(x=>({...x}))};
  fillForm(); toast('已复制为一张新卡，记得保存');
});
$('btnClear')?.addEventListener('click', ()=>{
  if(!confirm('清空整个卡库？建议先导出 JSON 备份。')) return;
  state.cards=[]; state.selId=null; persist(); renderLibrary(); toast('已清空');
});
$('search').addEventListener('input', renderLibrary);
$('filterType').addEventListener('change', renderLibrary);

$('faceArt').addEventListener('click', ()=> $('artInput').click());
$('artInput').addEventListener('change', e=>{
  const file=e.target.files[0]; if(!file) return;
  const img=new Image();
  img.onload=()=>{
    const max=420, s=Math.min(1,max/Math.max(img.width,img.height));
    const cv=document.createElement('canvas');
    cv.width=Math.round(img.width*s); cv.height=Math.round(img.height*s);
    cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);
    state.cur.art=cv.toDataURL('image/jpeg',.82);
    $('faceArt').style.backgroundImage=`url(${state.cur.art})`;
    $('faceArt').classList.add('has');
    $('faceArt').querySelector('span').style.display='none';
    scheduleSave(); toast('插画已载入');
  };
  img.src=URL.createObjectURL(file); e.target.value='';
});
$('btnClearArt').addEventListener('click', ()=>{
  state.cur.art='';
  $('faceArt').style.backgroundImage='';
  $('faceArt').classList.remove('has');
  $('faceArt').querySelector('span').style.display='';
  scheduleSave();
});

const RULE_MAP={'r-hp':'hp','r-col':'columns','r-hand':'openingHand','r-hanlim':'handLimit',
  'r-estart':'energyStart','r-emax':'energyMax','r-deck':'deckSize'};
Object.entries(RULE_MAP).forEach(([id,k])=>{
  $(id).addEventListener('input', e=>{ state.rules[k]=parseInt(e.target.value,10)||0; scheduleSave(); });
});

/* =========================================================
   文本规范检查
   ========================================================= */
const LINT_RULES = [
  {re:/献祭/g, to:'祭品', why:'资源统一称「祭品」'},
  {re:/嘲讽/g, to:'守护', why:'外来术语 → 守护'},
  {re:/亡语/g, to:'谢幕曲', why:'外来术语 → 谢幕曲'},
  {re:/战吼/g, to:'入场曲', why:'外来术语 → 入场曲'},
  {re:/圣盾|护盾/g, to:'屏障', why:'统一为 屏障'},
  {re:/剧毒/g, to:'毁灭', why:'统一为 毁灭'},
  {re:/消灭|摧毁|秒杀|杀掉|打死/g, to:'破坏', why:'统一为 破坏（不进墓地则用 消失）'},
  {re:/放逐|除外|移除/g, to:'消失', why:'统一为 消失'},
  {re:/敌方/g, to:'对手', why:'WB 写法使用「对手的」'},
  {re:/己方/g, to:'自己', why:'WB 写法使用「自己的」'},
  {re:/给与([^，。]*?)(\d+)点伤害/g, to:(m,a,n)=>`对${a}造成${n}点伤害`, why:'WB 写法为「造成X点伤害」'},
  {re:/抽(?:取)?\s*(?:一|1)?\s*张?\s*卡(?:牌)?/g, to:'抽取1张卡牌', why:'统一为「抽取X张卡牌」'},
  {re:/回血|恢复(?!为)/g, to:'回复', why:'统一为「回复」'},
  {re:/法力|水晶|费用|pp/gi, to:'能量', why:'本作资源统一称「能量」'},
];
const FLAG_ONLY = [
  {re:/疾驰|突进|冲锋/, why:'本作随从入场当回合即可攻击，不需要「疾驰 / 突进 / 冲锋」'},
  {re:/【(爆能强化|激奏|结晶|亡者召还)_?\d/, why:'费用类词条必须写明是能量 / 祭品 / 骨头，例：激奏_能量1'},
  {re:/一回合攻击两次/, why:'请改用「多重攻击_2」'},
];
$('btnLint')?.addEventListener('click', ()=>{
  const src=state.cur.text||'';
  if(!src.trim()){ toast('先写效果文本'); return; }
  let out=src; const notes=[];
  LINT_RULES.forEach(r=>{
    const hits=out.match(r.re);
    if(hits && hits.length){
      out=out.replace(r.re, typeof r.to==='function'? r.to : r.to);
      notes.push({bad:hits[0], why:r.why});
    }
  });
  FLAG_ONLY.forEach(r=>{ if(r.re.test(src)) notes.push({bad:src.match(r.re)[0], why:r.why}); });
  const notesHtml = notes.length
    ? notes.map(n=>`<div class="note"><b>${esc(n.bad)}</b><span>${esc(n.why)}</span></div>`).join('')
    : '<div class="note"><b>通过</b><span>未发现不规范术语。</span></div>';
  openDlg('文本规范检查', out, notesHtml, (v)=>{
    state.cur.text=v; $('f-text').value=v; renderPreview(); scheduleSave();
    toast(notes.length?'已应用规范化文本':'文本已确认');
  });
});

/* =========================================================
   导入导出
   ========================================================= */
function payload(){
  return {
    meta:{game:'卡牌构筑对战', version:'2.3', exportedAt:new Date().toISOString(), count:state.cards.length},
    rules:{...state.rules, copiesPerCard:3},
    cards:state.cards.map(c=>{
      const kd = c.keywords.find(x=>x.k==='倒计时');
      const fu = c.keywords.find(x=>x.k==='融合');
      const ch = (c.type==='spell' && c.choice && (c.choice.on ||
        (c.choice.opts||[]).some(o=>((o&&o.t)||'').trim() || ((o&&o.reans)||[]).length))) ? c.choice : null;
      const base = {...c, art:c.art?'(省略插画数据)':''};
      if(!ch) delete base.choice; else base.choice = ch;
      return {...base,
        timerEffect: (kd && kd.effect) || '',
        fusion: fu ? {cond:(fu.fcond||''), type:(fu.ftype||'卡牌'), effect:(fu.effect||'')} : null,
        fullText:composeText(c)};
    })
  };
}
function download(name, text, mime='application/json'){
  const blob=new Blob([text],{type:mime+';charset=utf-8'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),3000);
}
$('btnExport').addEventListener('click', ()=>{
  download(`ccg-cards-${new Date().toISOString().slice(0,10)}.json`, JSON.stringify(payload(),null,2));
  toast('已导出 JSON');
});
$('btnCopy').addEventListener('click', async ()=>{
  const txt=JSON.stringify(payload(),null,2);
  try{ await navigator.clipboard.writeText(txt); toast('JSON 已复制'); }
  catch(e){ openDlg('导出 JSON', txt, '<div class="note"><b>提示</b><span>手动全选复制</span></div>', null); }
});
$('btnMd').addEventListener('click', ()=>{
  const r=state.rules;
  const lines=[
    `# 卡牌构筑对战 · 卡表（${state.cards.length} 张）`, ``,
    `> 生命 ${r.hp} / 场地 ${r.columns} 列 / 起手 ${r.openingHand} / 手牌上限 ${r.handLimit} / 能量 ${r.energyStart}→${r.energyMax} / 牌库 ${r.deckSize} / 每卡 3 张`, ``,
    `| # | 名称 | 种类 | 种族 | 费用 | 祭品条件 | 攻/血 | 稀有度 | 词条 | 效果 |`,
    `|---|---|---|---|---|---|---|---|---|---|`
  ];
  state.cards.forEach((c,i)=>{
    const cost=[c.energy?`${c.energy}能`:'',c.sacrifice?`祭品${c.sacrifice}`:'',c.bones?`骨${c.bones}`:''].filter(Boolean).join('+')||'0';
    const st=c.type==='minion'?`${c.atk}/${c.hp}`:(c.type==='amulet'?`计时${c.timer}`:(c.type==='crest'?(c.faith?`信仰${c.counter||0}`:`计时${c.timer}`):'—'));
    lines.push(`| ${i+1} | ${c.name||'未命名'} | ${TYPE_NAME[c.type]} | ${c.race||'—'} | ${cost} | ${(c.sacrifice&&c.sacrificeCond)?c.sacrificeCond:'—'} | ${st} | ${c.rarity} | ${c.keywords.map(e=>kwLabel(e)).join('、')||'—'} | ${composeText(c).replace(/\n/g,'<br>')||'—'} |`);
  });
  download(`ccg-cards-${new Date().toISOString().slice(0,10)}.md`, lines.join('\n'), 'text/markdown');
  toast('已导出 Markdown');
});
$('btnImport')?.addEventListener('click', ()=>{
  const inp=document.createElement('input'); inp.type='file'; inp.accept='.json,application/json';
  inp.onchange=()=>{
    const f=inp.files[0]; if(!f) return;
    const rd=new FileReader();
    rd.onload=()=>{
      try{
        const d=JSON.parse(rd.result);
        const arr=Array.isArray(d)?d:(d.cards||[]);
        const clean=arr.map(normalize);
        state.cards=state.cards.concat(clean);
        renderLibrary(); persist(); toast(`导入 ${clean.length} 张`);
      }catch(e){ toast('JSON 解析失败'); }
    };
    rd.readAsText(f);
  };
  inp.click();
});

/* 批量粘贴：名称|种类|能量|祭品|骨头|攻击|生命|种族|词条|效果 */
function parseKwToken(tok){
  if(tok.startsWith('入场曲*')){
    const eff=tok.slice(4).replace(/^[:：]\s*/,'');
    const opts=eff.split(/[;；]/).map(s=>s.trim()).filter(Boolean);
    return {k:'入场曲', v:0, effect:'', choice:{on:true, opts: opts.length?opts:['','']}};
  }
  const name=KW.map(x=>x.k).sort((a,b)=>b.length-a.length).find(n=>tok.startsWith(n));
  if(!name) return null;
  let rest=tok.slice(name.length).trim().replace(/^_/,'');
  let v=0, effect='', res=null;
  const rm=rest.match(/^(能量|祭品|骨头)/);
  if(rm){ res=rm[1]; rest=rest.slice(rm[1].length); }
  const m=rest.match(/^(\d+)\s*[:：]?\s*([\s\S]*)$/);
  if(m){ v=+m[1]; effect=(m[2]||'').trim(); }
  else { const m2=rest.match(/^[:：]\s*([\s\S]*)$/); if(m2) effect=m2[1].trim(); }

  if(name==='启动') return {k:name, v:0, cost:{energy:v||0,sacrifice:0,bones:0}, effect};
  if(name==='亡者召还'){
    const afterM=effect.match(/@(\S+)$/);
    const typeM=effect.match(/^([^:：@]*)/);
    return {k:name, v:v||5, res:res||'能量', type:(typeM?typeM[1]:'').trim(),
            after:afterM?afterM[1]:'入场曲', effect: afterM?effect.replace(/@\S+$/,'').trim():''};
  }
  const e={k:name, v: v || (KW_MAP[name].def||0), effect};
  if(KW_MAP[name].res) e.res = res || '能量';
  return e;
}
$('btnBatch')?.addEventListener('click', ()=>{
  openDlg('批量粘贴导入','',
    '<div class="note"><b>格式</b><span>名称 | 种类 | 能量 | 祭品 | 骨头 | 攻击 | 生命 | 种族 | 词条,词条 | 效果</span></div>'+
    '<div class="note"><b>带费用的词条</b><span>爆能强化_骨头6 / 激奏_能量1:效果 / 亡者召还_能量2:卡牌类型@谢幕曲</span></div>'+
    '<div class="note"><b>普通词条</b><span>多重攻击_2 / 连击_3:效果 / 入场曲:效果</span></div>',
    (text)=>{
      const rows=text.split('\n').map(s=>s.trim()).filter(s=>s && !s.startsWith('名称') && !s.startsWith('|'));
      let n=0;
      rows.forEach(line=>{
        const p=line.split('|').map(s=>s.trim());
        if(p.length<2) return;
        const c=blankCard(); c.name=p[0];
        c.type=/法术|spell/i.test(p[1])?'spell':(/护符|amulet/i.test(p[1])?'amulet':(/纹章|crest/i.test(p[1])?'crest':'minion'));
        if(p.length<=4){
          c.energy=parseInt(p[2],10)||0; c.text=p[3]||'';
        }else{
          c.energy=parseInt(p[2],10)||0; c.sacrifice=parseInt(p[3],10)||0;
          c.bones=parseInt(p[4],10)||0; c.atk=parseInt(p[5],10)||0; c.hp=parseInt(p[6],10)||0;
          c.race=(p[7]||'');
          c.keywords=(p[8]||'').split(/[,，、\/]/).map(s=>s.trim()).filter(Boolean).map(parseKwToken).filter(Boolean);
          c.text=p[9]||'';
        }
        state.cards.push(normalize(c)); n++;
      });
      renderLibrary(); persist(); toast(`导入 ${n} 张`);
    });
});

/* 示例 */
const DEMO = [
  { name:'血偿者·卡尔', en:'Kar, the Blood Debt', type:'minion', rarity:'史诗', race:'不死',
    energy:2, sacrifice:1, atk:3, hp:2,
    sacrificeCond:'破坏1个被破坏过的自己的随从',
    keywords:[{k:'入场曲', v:0, effect:'破坏自己的1个随从。抽取1张卡牌。'},{k:'谢幕曲', v:0, effect:'获得2点骨头。'}],
    text:'', flavor:'债务，总是要用血来还。', notes:'血祭核心，检查祭品1的节奏是否过强。' },
  { name:'骨堆守卫', type:'minion', rarity:'稀有', race:'不死',
    energy:0, bones:2, atk:1, hp:4,
    keywords:[{k:'守护'},{k:'随从进场时', v:0, effect:'回复自己的主战者1点生命值。'}],
    text:'', flavor:'骨头堆得够高，就能挡住刀。', notes:'纯骨头防守。' },
  { name:'羽刃斥候', type:'minion', rarity:'普通', race:'兽',
    energy:2, atk:2, hp:1, keywords:[{k:'飞行'}],
    text:'', flavor:'它从不排队。', notes:'飞行基准线：2费2/1。' },
  { name:'白骨裁决者', type:'minion', rarity:'史诗', race:'不死',
    energy:4, atk:2, hp:4,
    keywords:[{k:'毁灭'},{k:'攻击时', v:0, effect:'若该随从的攻击力为2以上，抽取1张卡牌。'}],
    text:'', flavor:'一击之后，只剩下骨头。', notes:'毁灭是最高价值的解场词条，4费以下禁配。' },
  { name:'白骨铁卫', type:'minion', rarity:'稀有', race:'不死',
    energy:3, atk:1, hp:5, keywords:[{k:'荆棘', v:2},{k:'屏障'}],
    text:'', flavor:'它不需要还手，碎的是你的手。', notes:'荆棘_2 + 屏障。' },
  { name:'骸骨献祭官', type:'minion', rarity:'史诗', race:'不死',
    energy:5, sacrifice:2, atk:5, hp:5,
    sacrificeCond:'破坏生命值为3以上的自己的随从',
    keywords:[{k:'多重攻击', v:2},{k:'谢幕曲', v:0, effect:'召唤2个1/1的「骸骨」到战场上。'}],
    text:'', flavor:'两颗心脏，换一次判决。', notes:'多重攻击_2 与高门槛祭品的组合。' },
  { name:'静默回响', type:'spell', rarity:'稀有', race:'',
    energy:3, keywords:[], text:'使对手的1个随从消失。',
    flavor:'没有留下尸体，也就没有留下仇恨。',
    notes:'「消失」不触发【谢幕曲】、不产生骨头。' },
  { name:'献祭之环', type:'amulet', rarity:'史诗', race:'',
    energy:2, timer:2,
    keywords:[{k:'倒计时', v:2, effect:'召唤1个3/3的「白骨巨像」到战场上。'},
              {k:'回合开始时', v:0, effect:'若本回合有自己随从被破坏，获得1点骨头。'}],
    text:'',
    flavor:'环上的每一道刻痕，都是一次供奉。', notes:'倒计时_2 的收益上限偏高。' },
  { name:'骨刺', type:'spell', rarity:'普通', race:'',
    energy:3, bones:1,
    keywords:[{k:'激奏', v:1, res:'能量', effect:'选择对手的战场上的1个随从，对其造成1点伤害。'}],
    text:'选择对手的战场上的1个随从，对其造成3点伤害。',
    flavor:'便宜，但疼。', notes:'激奏_能量1：用能量支付。' },
  { name:'血契抉择者', type:'minion', rarity:'传说', race:'不死',
    energy:6, atk:4, hp:4,
    keywords:[{k:'入场曲', v:0, effect:'', choice:{on:true, opts:[
      '对对手的主战者造成4点伤害。回复自己的主战者4点生命值。',
      '对对手的战场上的所有随从造成5点伤害。回复自己1点进化点。'
    ]}}],
    text:'', flavor:'两条路，都通向同一片白骨。', notes:'抉择挂在【入场曲】后面。' },
  { name:'献躯仪式', type:'amulet', rarity:'史诗', race:'',
    energy:3,
    keywords:[{k:'启动', v:0, cost:{energy:2,sacrifice:1,bones:0}, effect:'召唤1个3/3的「白骨巨像」到战场上。'}],
    text:'', flavor:'每一次供给，都需要一点活的东西。', notes:'启动费用 = 能量2 + 祭品1。' },
  { name:'白骨仪式台', type:'amulet', rarity:'史诗', race:'',
    energy:3,
    keywords:[{k:'启动', v:0, cost:{energy:2,sacrifice:0,bones:0}, effect:'', choice:{on:true, opts:[
      '召唤1个3/3的「白骨巨像」到战场上。',
      '获得2点骨头。抽取1张卡牌。'
    ]}}],
    text:'', flavor:'供奉什么，就长成什么。', notes:'启动 + 抉择。' },
  { name:'白骨召还者', type:'minion', rarity:'史诗', race:'不死',
    energy:3, atk:2, hp:3,
    keywords:[
      {k:'入场曲', v:0, effect:'', reans:[
        {res:'能量', v:2, type:'不死随从', effect:'召唤自己墓地里能量费为2以下的1个「不死随从」到战场上。'}
      ]}
    ],
    text:'', flavor:'它带回来的，往往不完整。', notes:'亡者召还_能量2，只召能量单一计费的不死随从。' },
  { name:'双葬祭司', type:'minion', rarity:'传说', race:'不死',
    energy:5, atk:3, hp:4,
    keywords:[
      {k:'入场曲', v:0, effect:'', reans:[
        {res:'能量', v:2, type:'骷髅', effect:'召唤自己墓地里能量费为2以下的1个「骷髅」到战场上。'}
      ]},
      {k:'谢幕曲', v:0, effect:'', reans:[
        {res:'骨头', v:4, type:'护符', effect:'召唤自己墓地里骨头费为4以下的1个「护符」到战场上。'}
      ]}
    ],
    text:'', flavor:'一次埋葬，两次归还。', notes:'两条亡者召还，分别用能量与骨头计费，挂在入场曲与谢幕曲。' },
  { name:'骨塔守望者', type:'minion', rarity:'史诗', race:'不死',
    energy:4, atk:3, hp:4,
    keywords:[{k:'连击', v:3, effect:'使该随从获得+2/+2。'}],
    text:'', flavor:'第三张牌之后，塔才开始呼吸。', notes:'连击_3。' },
  { name:'高性能引擎机甲', type:'minion', rarity:'史诗', race:'机械',
    energy:5, sacrifice:2, atk:5, hp:5,
    sacrificeCond:'破坏2个「机械」随从',
    keywords:[
      {k:'入场曲', v:0, effect:'', choice:{on:true, opts:[
        {t:'', reans:[
          {k:'亡者召还', costs:{energy:5,sacrifice:0,bones:0}, type:'机械', effect:'种族的随从，发动2次。'}
        ]},
        {t:'从自己的牌库中召唤2个不同名、能量费为5以下的「机械」随从到战场上。', reans:[]}
      ]}}
    ],
    text:'', flavor:'引擎一旦点火，整座工厂都会跟着震动。',
    notes:'召还侧用一条召还 + 说明“发动2次”，避免两行重复。' },
  { name:'孤骨归魂', type:'minion', rarity:'传说', race:'不死',
    energy:4, atk:3, hp:3,
    keywords:[
      {k:'瞬念召唤', v:0, when:'now', effect:'若自己的随从被破坏，从牌库召唤1个「骸骨」到战场上。'},
      {k:'融合', v:0, fcond:'不死', ftype:'随从', effect:'获得+1/+1并抽取1张卡牌。'}
    ],
    text:'', flavor:'骨头记得回家的路。', notes:'瞬念召唤=满足条件即刻；融合在手牌中发动。' },
  { name:'机械回收单', type:'spell', rarity:'稀有', race:'',
    energy:3,
    keywords:[{k:'招募', costs:{energy:4,sacrifice:1,bones:0}, type:'机械', effect:''}],
    text:'', flavor:'名单上永远有下一个。', notes:'招募_能量4祭品1：从牌库取满足条件的最高费机械。' },
  { name:'骨爆仪式', type:'spell', rarity:'稀有', race:'',
    energy:2, bones:2,
    keywords:[{k:'爆能强化', v:6, res:'骨头', effect:'召唤1个4/4的「骨爆巨像」到战场上。'}],
    text:'对对手的主战者造成2点伤害。',
    flavor:'骨头不够，仪式就只是噪音。', notes:'能量卡却用骨头强化：爆能强化_骨头6。' },
  { name:'抉择的亡骨', type:'minion', rarity:'传说', race:'不死',
    energy:5, atk:4, hp:4,
    keywords:[
      {k:'入场曲', v:0, effect:'', choice:{on:true, opts:[
        {t:'对对手的主战者造成3点伤害。', reans:[{res:'能量', v:2, type:'', effect:''}]},
        {t:'抽取1张卡牌。', reans:[{res:'能量', v:3, type:'不死随从', effect:''}]}
      ]}}
    ],
    text:'', flavor:'选完再还债。', notes:'亡者召还接在【抉择】之后：先选选项，再召还。' },
];
$('btnDemo')?.addEventListener('click', ()=>{
  DEMO.forEach(d=> state.cards.push(normalize({...blankCard(), ...d})));
  renderLibrary(); persist(); toast('已载入 20 张示例');
});

/* 对话框 */
let dlgOk=null;
function openDlg(title, text, notesHtml, ok){
  $('dlgTitle').textContent=title;
  $('dlgNotes').innerHTML=notesHtml||'';
  $('dlgText').value=text||'';
  $('dlgText').readOnly=!ok;
  $('dlgUse').style.display=ok?'none':'';
  $('dlgHint').textContent=ok?'确认后写回效果文本。':'';
  dlgOk=ok; $('dlg').showModal();
}
$('dlgClose').addEventListener('click', ()=> $('dlg').close());
$('dlgOk').addEventListener('click', ()=>{ if(dlgOk) dlgOk($('dlgText').value); $('dlg').close(); });
$('dlgUse').addEventListener('click', ()=>{
  try{
    const d=JSON.parse($('dlgText').value);
    const c=normalize(d.cards?d.cards[0]:d);
    state.cur=c; state.selId=null; fillForm(); $('dlg').close(); toast('已载入编辑区');
  }catch(e){ toast('解析失败'); }
});

document.addEventListener('keydown', e=>{
  if(!(e.ctrlKey||e.metaKey)) return;
  if(e.key==='Enter'){ e.preventDefault(); $('btnSave').click(); }
  if(e.key.toLowerCase()==='n'){ e.preventDefault(); $('btnNew').click(); }
  if(e.key.toLowerCase()==='k'){ e.preventDefault(); $('search').focus(); }
});

(function init(){
  restore();
  Object.entries(RULE_MAP).forEach(([id,k])=>{ if($(id)) $(id).value=state.rules[k]; });
  buildKwGroups(); fillForm(); renderLibrary();
})();
