// ============================================================================
// 原版 v1.9 卡牌设计器完整逻辑（动态 keywords 数组、抉择 opts、招募/亡者召还 reans、费用评估、JSON导入导出）
// ============================================================================
let v19CurrentCardId = cardsById['cmwas0lke5oiw'] ? 'cmwas0lke5oiw' : (allCards[0] ? allCards[0].id : null);
let v19DraftKeywords = [];
let v19DraftArt = '';

function assembleV19FullText(draft) {
  const lines = [];
  (draft.keywords || []).forEach(kw => {
    const k = kw.k || '';
    if (!k) return;
    if (kw.choice && kw.choice.on && Array.isArray(kw.choice.opts)) {
      lines.push(`【${k}】【抉择】选择1个能力发动。`);
      kw.choice.opts.forEach((opt, idx) => {
        let optStr = opt.t || '';
        if (!optStr && Array.isArray(opt.reans) && opt.reans.length > 0) {
          optStr = opt.reans.map(r => {
            const eVal = r.costs ? (r.costs.energy || 0) : 0;
            return `【${r.k}_能量${eVal}】${r.type ? '仅限「' + r.type + '」' : ''}${r.effect || ''}`;
          }).join(' ');
        }
        lines.push(`（${idx + 1}）${optStr}`);
      });
      return;
    }
    if (Array.isArray(kw.reans) && kw.reans.length > 0 && !kw.effect) {
      const reanStrs = kw.reans.map(r => {
        const eVal = r.costs ? (r.costs.energy || 0) : 0;
        return `【${r.k}_能量${eVal}】${r.type ? '仅限「' + r.type + '」' : ''}${r.effect || ''}`;
      });
      lines.push(`【${k}】${reanStrs.join('\n')}`);
      return;
    }
    if (k === '启动') {
      const cE = kw.cost ? (kw.cost.energy || 0) : 1;
      lines.push(`【启动】能量${cE}：${kw.effect || ''}`);
    } else if (k === '瞬念召唤') {
      const whenTxt = kw.when === 'start' ? '回合开始时，' : '回合结束后，';
      lines.push(`【瞬念召唤】${whenTxt}${kw.effect || ''}`);
    } else if (['连击', '爆能强化', '结晶', '激奏'].includes(k)) {
      const vNum = kw.v || 1;
      const prefix = k === '爆能强化' ? `【爆能强化_能量${vNum}】` : (k === '连击' ? `【连击_${vNum}】` : `【${k}_能量${vNum}】`);
      lines.push(`${prefix}${kw.effect || ''}`);
    } else if (k === '荆棘') {
      lines.push(`荆棘_${kw.v || 1}`);
    } else if (['守护', '飞行', '防空', '屏障', '灵气', '潜行', '毁灭', '虹吸', '位移', '多重攻击', '两侧攻击', '三侧攻击', '全体攻击'].includes(k) && !kw.effect) {
      // 基础常驻词条
    } else {
      lines.push(`【${k}】${kw.effect || ''}`);
    }
  });
  if (draft.text && String(draft.text).trim()) {
    lines.push(String(draft.text).trim());
  }
  return lines.join('\n');
}

function renderV19CardList() {
  const box = document.getElementById('v19CardListContainer');
  const cntEl = document.getElementById('v19CardCountTxt');
  if (!box) return;
  if (cntEl) cntEl.textContent = String(allCards.length);
  const q = (document.getElementById('inputV19Search')?.value || '').trim();
  box.innerHTML = '';

  allCards.forEach(c => {
    if (q && !(`${c.name}${c.race}${c.rarity}${getCardDisplayText(c)}`).includes(q)) return;
    const row = document.createElement('div');
    const active = c.id === v19CurrentCardId;
    row.className = `flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition ${active ? 'bg-fuchsia-950/80 border-fuchsia-400 text-white' : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-200'}`;
    row.innerHTML = `
      <div class="flex items-center gap-2 min-w-0 flex-1">
        <span class="w-5 h-5 rounded-full bg-emerald-700 text-white font-black flex items-center justify-center text-[10px] shrink-0">${c.energy}</span>
        <span class="font-bold truncate">${c.name}</span>
      </div>
      <span class="text-[10px] text-amber-300 shrink-0">${c.race || (c.type === 'spell' ? '法术' : '随从')}</span>
    `;
    row.addEventListener('click', () => {
      sfx.play('click');
      loadCardIntoDesigner(c);
    });
    box.appendChild(row);
  });
}

function renderV19KeywordsEditor() {
  const box = document.getElementById('v19KeywordsListBox');
  if (!box) return;
  box.innerHTML = '';

  if (v19DraftKeywords.length === 0) {
    box.innerHTML = `<div class="text-xs text-slate-500 text-center py-3">当前无词条（可在上方选择词条后点击「＋ 添加该词条」）</div>`;
    return;
  }

  v19DraftKeywords.forEach((kw, kIdx) => {
    const card = document.createElement('div');
    card.className = 'bg-slate-900 border border-slate-700 rounded-xl p-2.5 flex flex-col gap-2 text-xs';

    const hasVal = ['倒计时', '荆棘', '连击', '爆能强化', '结晶', '激奏', '多重攻击'].includes(kw.k);
    const isEnhanceKw = kw.k === '爆能强化';
    const isActivate = kw.k === '启动';
    const isInvoke = kw.k === '瞬念召唤';
    const canHaveChoiceOrRean = ['入场曲', '谢幕曲', '随从进场时', '回合开始时', '回合结束时', '攻击时'].includes(kw.k);

    let headerControls = '';
    if (hasVal) {
      headerControls += `
        <label class="flex items-center gap-1 text-amber-300">
          <span>数值(v):</span>
          <input type="number" min="0" max="20" value="${kw.v || 1}" data-kw-field="v" class="w-14 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-white font-black" />
        </label>`;
    }
    if (isEnhanceKw) {
      const curRes = kw.res || '能量';
      headerControls += `
        <label class="flex items-center gap-1 text-amber-200">
          <span>消耗资源:</span>
          <select data-kw-field="res" class="bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-amber-300 font-bold">
            <option value="能量" ${curRes === '能量' ? 'selected' : ''}>能量</option>
            <option value="骨头" ${curRes === '骨头' ? 'selected' : ''}>骨头</option>
            <option value="祭品" ${curRes === '祭品' ? 'selected' : ''}>祭品</option>
          </select>
        </label>`;
    }
    if (isActivate) {
      const actE = kw.cost ? (kw.cost.energy || 0) : 0;
      headerControls += `
        <label class="flex items-center gap-1 text-emerald-300">
          <span>启动能量:</span>
          <input type="number" min="0" max="10" value="${actE}" data-kw-field="costE" class="w-14 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-white font-black" />
        </label>`;
    }
    if (isInvoke) {
      headerControls += `
        <select data-kw-field="when" class="bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-amber-200">
          <option value="end" ${kw.when !== 'start' ? 'selected' : ''}>回合结束触发 (end)</option>
          <option value="start" ${kw.when === 'start' ? 'selected' : ''}>回合开始触发 (start)</option>
        </select>`;
    }
    if (canHaveChoiceOrRean) {
      const choiceOn = Boolean(kw.choice && kw.choice.on);
      headerControls += `
        <label class="flex items-center gap-1 text-sky-300 cursor-pointer">
          <input type="checkbox" data-kw-field="choiceOn" ${choiceOn ? 'checked' : ''} class="rounded" />
          <span>启用【抉择】</span>
        </label>
        <button type="button" data-kw-act="addRean" class="px-2 py-0.5 rounded bg-indigo-700 hover:bg-indigo-600 text-white text-[11px] font-bold">＋招募/亡者召还</button>`;
    }

    card.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-amber-300 font-black">【${kw.k}】</span>
          ${headerControls}
        </div>
        <button type="button" data-kw-act="removeKw" class="px-2 py-0.5 rounded bg-rose-900/80 hover:bg-rose-700 text-rose-200 text-[11px] font-bold">✕ 删除词条</button>
      </div>
      <div>
        <input type="text" data-kw-field="effect" value="${(kw.effect || '').replace(/"/g, '&quot;')}" placeholder="填写该词条效果描述（如：抽取1张卡牌，或融合条件：原始费用3以下·卡牌）..." class="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white" />
      </div>
      <div class="kw-sub-containers space-y-2"></div>
    `;

    const subBox = card.querySelector('.kw-sub-containers');

    // 渲染抉择选项列表 (choice.opts)
    if (kw.choice && kw.choice.on) {
      if (!Array.isArray(kw.choice.opts) || kw.choice.opts.length === 0) {
        kw.choice.opts = [{ t: '选项1效果', reans: [] }, { t: '选项2效果', reans: [] }];
      }
      const cWrap = document.createElement('div');
      cWrap.className = 'bg-slate-950 border border-sky-500/40 rounded-lg p-2 space-y-1.5';
      cWrap.innerHTML = `
        <div class="flex items-center justify-between text-[11px] font-bold text-sky-300">
          <span>⚖️ 抉择分支选项 (${kw.choice.opts.length} 项)</span>
          <button type="button" class="btn-add-choice-opt px-2 py-0.5 rounded bg-sky-700 hover:bg-sky-600 text-white">＋ 添加抉择项</button>
        </div>
      `;
      kw.choice.opts.forEach((opt, oIdx) => {
        const oRow = document.createElement('div');
        oRow.className = 'flex items-center gap-1.5';
        let displayOptVal = opt.t || '';
        if (!displayOptVal && Array.isArray(opt.reans) && opt.reans.length > 0) {
          const r = opt.reans[0];
          displayOptVal = `【${r.k}_能量${r.costs ? r.costs.energy : 0}】${r.type ? '仅限「'+r.type+'」' : ''}${r.effect || ''}`;
        }
        oRow.innerHTML = `
          <span class="text-amber-300 font-bold shrink-0">（${oIdx + 1}）</span>
          <input type="text" value="${displayOptVal.replace(/"/g, '&quot;')}" class="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs" />
          <button type="button" class="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-rose-700 text-slate-300 text-[10px]">✕</button>
        `;
        const inp = oRow.querySelector('input');
        inp.addEventListener('input', () => {
          opt.t = inp.value;
          updateDesignerLivePreview();
        });
        oRow.querySelector('button').addEventListener('click', () => {
          kw.choice.opts.splice(oIdx, 1);
          renderV19KeywordsEditor();
          updateDesignerLivePreview();
        });
        cWrap.appendChild(oRow);
      });
      cWrap.querySelector('.btn-add-choice-opt').addEventListener('click', () => {
        kw.choice.opts.push({ t: '新抉择分支效果', reans: [] });
        renderV19KeywordsEditor();
        updateDesignerLivePreview();
      });
      subBox.appendChild(cWrap);
    }

    // 渲染招募 / 亡者召还子列表 (kw.reans)
    if (Array.isArray(kw.reans) && kw.reans.length > 0) {
      const rWrap = document.createElement('div');
      rWrap.className = 'bg-slate-950 border border-indigo-500/40 rounded-lg p-2 space-y-1.5';
      kw.reans.forEach((r, rIdx) => {
        const rRow = document.createElement('div');
        rRow.className = 'flex flex-wrap items-center gap-1.5 text-[11px]';
        const rE = r.costs ? (r.costs.energy || 0) : 2;
        rRow.innerHTML = `
          <select class="rean-k bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-indigo-300 font-bold">
            <option value="招募" ${r.k === '招募' ? 'selected' : ''}>招募</option>
            <option value="亡者召还" ${r.k === '亡者召还' ? 'selected' : ''}>亡者召还</option>
          </select>
          <span>能量≤</span>
          <input type="number" min="0" max="15" value="${rE}" class="rean-e w-12 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-white font-black" />
          <span>限定种族:</span>
          <input type="text" value="${r.type || ''}" placeholder="如：机械" class="rean-t w-20 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-sky-300" />
          <input type="text" value="${r.effect || ''}" placeholder="附加：如 ，发动两次。" class="rean-eff flex-1 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-white" />
          <button type="button" class="rean-del px-1.5 py-0.5 rounded bg-slate-800 hover:bg-rose-700 text-slate-300">✕</button>
        `;
        rRow.querySelector('.rean-k').addEventListener('change', (ev) => { r.k = ev.target.value; updateDesignerLivePreview(); });
        rRow.querySelector('.rean-e').addEventListener('input', (ev) => {
          if (!r.costs) r.costs = { energy: 0, sacrifice: 0, bones: 0 };
          r.costs.energy = Number(ev.target.value || 0);
          updateDesignerLivePreview();
        });
        rRow.querySelector('.rean-t').addEventListener('input', (ev) => { r.type = ev.target.value; updateDesignerLivePreview(); });
        rRow.querySelector('.rean-eff').addEventListener('input', (ev) => { r.effect = ev.target.value; updateDesignerLivePreview(); });
        rRow.querySelector('.rean-del').addEventListener('click', () => {
          kw.reans.splice(rIdx, 1);
          renderV19KeywordsEditor();
          updateDesignerLivePreview();
        });
        rWrap.appendChild(rRow);
      });
      subBox.appendChild(rWrap);
    }

    // 绑定顶层字段事件
    card.querySelectorAll('[data-kw-field]').forEach(el => {
      const f = el.dataset.kwField;
      el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', () => {
        if (f === 'v') kw.v = Number(el.value || 0);
        else if (f === 'costE') {
          if (!kw.cost) kw.cost = { energy: 1, sacrifice: 0, bones: 0 };
          kw.cost.energy = Number(el.value || 0);
        } else if (f === 'when') kw.when = el.value;
        else if (f === 'res') kw.res = el.value;
        else if (f === 'choiceOn') {
          if (!kw.choice) kw.choice = { on: false, opts: [] };
          kw.choice.on = el.checked;
          renderV19KeywordsEditor();
        } else if (f === 'effect') kw.effect = el.value;
        updateDesignerLivePreview();
      });
    });

    card.querySelectorAll('[data-kw-act]').forEach(btn => {
      btn.addEventListener('click', () => {
        const act = btn.dataset.kwAct;
        if (act === 'removeKw') {
          v19DraftKeywords.splice(kIdx, 1);
          renderV19KeywordsEditor();
          updateDesignerLivePreview();
        } else if (act === 'addRean') {
          if (!Array.isArray(kw.reans)) kw.reans = [];
          kw.reans.push({ k: '招募', costs: { energy: 2, sacrifice: 0, bones: 0 }, type: '机械', effect: '' });
          renderV19KeywordsEditor();
          updateDesignerLivePreview();
        }
      });
    });

    box.appendChild(card);
  });
}

function populateDesignerCardSelector() {
  renderV19CardList();
}

function loadCardIntoDesigner(c) {
  if (!c || !document.getElementById('desName')) return;
  v19CurrentCardId = c.id;
  v19DraftArt = c.art || '';
  v19DraftKeywords = JSON.parse(JSON.stringify(c.keywords || []));

  const badge = document.getElementById('v19EditingIdBadge');
  if (badge) badge.textContent = `ID: ${c.id}`;
  document.getElementById('desName').value = c.name || '';
  document.getElementById('desEn').value = c.en || '';
  document.getElementById('desType').value = c.type || 'minion';
  document.getElementById('desRarity').value = c.rarity || '普通';
  document.getElementById('desRace').value = c.race || '';
  document.getElementById('desSacCond').value = c.sacrificeCond || '';
  document.getElementById('desEnergy').value = c.energy || 0;
  document.getElementById('desSacrifice').value = c.sacrifice || 0;
  document.getElementById('desBones').value = c.bones || 0;
  document.getElementById('desAtk').value = c.atk || 0;
  document.getElementById('desHp').value = c.hp || 1;
  document.getElementById('desTimer').value = c.timer || 0;
  document.getElementById('desFaith').value = c.faith || 0;
  document.getElementById('desCounter').value = c.counter || 0;
  document.getElementById('desText').value = c.text || '';
  document.getElementById('desNotes').value = c.notes || '';

  renderV19KeywordsEditor();
  renderV19CardList();
  updateDesignerLivePreview();
}

function buildDraftCardFromDesignerForm() {
  const cid = v19CurrentCardId || ('cmw' + Math.random().toString(36).slice(2, 12));
  const draft = {
    id: cid,
    name: document.getElementById('desName').value.trim() || '未命名卡牌',
    en: document.getElementById('desEn').value.trim(),
    type: document.getElementById('desType').value,
    rarity: document.getElementById('desRarity').value,
    race: document.getElementById('desRace').value.trim(),
    sacrificeCond: document.getElementById('desSacCond').value.trim(),
    faith: Number(document.getElementById('desFaith').value || 0),
    counter: Number(document.getElementById('desCounter').value || 0),
    energy: Number(document.getElementById('desEnergy').value || 0),
    sacrifice: Number(document.getElementById('desSacrifice').value || 0),
    bones: Number(document.getElementById('desBones').value || 0),
    atk: Number(document.getElementById('desAtk').value || 0),
    hp: Number(document.getElementById('desHp').value || 1),
    timer: Number(document.getElementById('desTimer').value || 0),
    keywords: JSON.parse(JSON.stringify(v19DraftKeywords)),
    text: document.getElementById('desText').value.trim(),
    flavor: '',
    notes: document.getElementById('desNotes').value.trim(),
    art: v19DraftArt || '',
    fullText: ''
  };
  draft.fullText = assembleV19FullText(draft);
  draft.ast = parseCardEffectAST(draft);
  return draft;
}

function updateValueCalculator(draft) {
  // 严格执行 v2.1 卡牌费用价值公式：能量×1 + 祭品×1.5 + 骨头×0.5
  const costVal = getCardCostValue(draft);
  const statVal = draft.type === 'minion' ? ((draft.atk || 0) * 0.5 + (draft.hp || 0) * 0.5) : 0;
  let effVal = 0;
  (draft.keywords || []).forEach(kw => {
    if (['入场曲', '谢幕曲', '瞬念召唤', '启动'].includes(kw.k)) effVal += 1.5;
    else if (['守护', '飞行', '屏障', '毁灭', '虹吸', '多重攻击', '全体攻击'].includes(kw.k)) effVal += 1.0;
    else effVal += 0.6;
  });
  if (draft.text) effVal += 1.2;
  const totalVal = statVal + effVal;

  document.getElementById('calcCostVal').textContent = costVal.toFixed(1);
  document.getElementById('calcStatVal').textContent = statVal.toFixed(1);
  document.getElementById('calcEffectVal').textContent = effVal.toFixed(1);
  document.getElementById('calcTotalVal').textContent = totalVal.toFixed(1);

  const badge = document.getElementById('calcVerdictBadge');
  const diff = totalVal - costVal;
  if (diff > 2.2) {
    badge.className = 'px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-400 text-rose-300 font-black';
    badge.textContent = '🔥 超模强卡';
  } else if (diff < -1.5) {
    badge.className = 'px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 font-black';
    badge.textContent = '⚠️ 略亏节奏';
  } else {
    badge.className = 'px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-black';
    badge.textContent = '✅ 模型平衡';
  }
}

function updateDesignerLivePreview() {
  const draft = buildDraftCardFromDesignerForm();
  updateValueCalculator(draft);

  const slot = document.getElementById('desLiveCardPreview');
  if (slot) {
    slot.innerHTML = '';
    const cardEl = buildHandCardDOM(draft);
    cardEl.style.cursor = 'default';
    slot.appendChild(cardEl);
  }
  const ftBox = document.getElementById('v19FullTextPreview');
  if (ftBox) ftBox.textContent = getCardDisplayText(draft);

  const exportNode = Object.assign({}, draft);
  delete exportNode.ast;
  delete exportNode.isToken;
  const pre = document.getElementById('desParsedAstBox');
  if (pre) pre.textContent = JSON.stringify(exportNode, null, 2);
}

['desName','desEn','desType','desRarity','desRace','desSacCond','desEnergy','desSacrifice','desBones','desAtk','desHp','desTimer','desFaith','desCounter','desText','desNotes'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', updateDesignerLivePreview);
});

document.getElementById('btnV19AddKeyword')?.addEventListener('click', () => {
  sfx.play('click');
  const k = document.getElementById('selV19AddKeywordType').value;
  const newKw = { k: k, v: ['荆棘','连击','爆能强化','结晶','激奏'].includes(k) ? 2 : 0, effect: '' };
  if (k === '启动') newKw.cost = { energy: 1, sacrifice: 0, bones: 0 };
  if (k === '瞬念召唤') newKw.when = 'end';
  if (['入场曲', '谢幕曲'].includes(k)) {
    newKw.choice = { on: false, opts: [{ t: '', reans: [] }, { t: '', reans: [] }] };
    newKw.reans = [];
  }
  v19DraftKeywords.push(newKw);
  renderV19KeywordsEditor();
  updateDesignerLivePreview();
});

document.getElementById('btnV19NewCard')?.addEventListener('click', () => {
  sfx.play('synergy');
  const newId = 'cmw' + Math.random().toString(36).slice(2, 12);
  const blank = {
    id: newId, name: '新设计卡牌', en: '', type: 'minion', rarity: '稀有', race: '机械', sacrificeCond: '',
    faith: 0, counter: 0, energy: 3, sacrifice: 0, bones: 0, atk: 3, hp: 3, timer: 0,
    keywords: [{ k: '入场曲', v: 0, effect: '抽取1张卡牌。', choice: { on: false, opts: [] }, reans: [] }],
    text: '', flavor: '', notes: '', art: '', fullText: '【入场曲】抽取1张卡牌。'
  };
  registerCardsFromDesigner([blank]);
  loadCardIntoDesigner(cardsById[newId]);
});

document.getElementById('btnV19DuplicateCard')?.addEventListener('click', () => {
  sfx.play('click');
  const draft = buildDraftCardFromDesignerForm();
  draft.id = 'cmw' + Math.random().toString(36).slice(2, 12);
  draft.name = draft.name + '·改';
  registerCardsFromDesigner([draft]);
  loadCardIntoDesigner(cardsById[draft.id]);
});

document.getElementById('btnV19DeleteCard')?.addEventListener('click', () => {
  if (allCards.length <= 1 || !v19CurrentCardId) return;
  sfx.play('sacrifice');
  const delName = cardsById[v19CurrentCardId]?.name || '';
  delete cardsById[v19CurrentCardId];
  delete cardsByName[delName];
  allCards = Object.values(cardsById);
  loadCardIntoDesigner(allCards[0]);
});

document.getElementById('inputV19Search')?.addEventListener('input', renderV19CardList);

document.getElementById('inputV19ArtFile')?.addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    v19DraftArt = String(ev.target.result || '');
    artCache[v19CurrentCardId] = v19DraftArt;
    updateDesignerLivePreview();
  };
  reader.readAsDataURL(file);
});

document.getElementById('btnV19ClearArt')?.addEventListener('click', () => {
  sfx.play('click');
  v19DraftArt = '';
  if (v19CurrentCardId) delete artCache[v19CurrentCardId];
  updateDesignerLivePreview();
});

document.getElementById('btnCreateCardToGame')?.addEventListener('click', () => {
  sfx.play('legend');
  const draft = buildDraftCardFromDesignerForm();
  delete artCache[draft.id];
  delete artCache[draft.name];
  const exIdx = v19DesignerCards.findIndex(x => x.id === draft.id);
  if (exIdx >= 0) v19DesignerCards[exIdx] = draft;
  else v19DesignerCards.unshift(draft);
  saveDesignerSandboxCards();
  renderV19CardList();
  const fb = document.getElementById('desFeedbackTxt');
  fb.textContent = `✅「${draft.name}」已保存至设计草稿箱（仅支持导出，不影响对战卡池）！`;
  setTimeout(() => { fb.textContent = ''; }, 3500);
});

document.getElementById('btnV19ImportJson')?.addEventListener('click', triggerLocalJsonFileDialog);

document.getElementById('btnExportAllJson')?.addEventListener('click', () => {
  sfx.play('play');
  const draft = buildDraftCardFromDesignerForm();
  const exIdx = v19DesignerCards.findIndex(x => x.id === draft.id);
  if (exIdx >= 0) v19DesignerCards[exIdx] = draft; else v19DesignerCards.unshift(draft);
  saveDesignerSandboxCards();
  const cleanCards = v19DesignerCards.map(c => {
    const copy = Object.assign({}, c);
    delete copy.ast;
    delete copy.isToken;
    return copy;
  });
  const exportPayload = {
    meta: { game: "卡牌构筑对战", version: "2.1", exportedAt: new Date().toISOString(), count: cleanCards.length },
    rules: RULES,
    cards: cleanCards
  };
  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ccg-cards-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

