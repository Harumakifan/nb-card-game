let deckFilter = '全部';
let deckInspectedCardData = allCards[0] || null;

function syncAllDeckSelects() {
  const s1 = document.getElementById('quickDeckSelect');
  const s2 = document.getElementById('selectEditingDeck');
  if (!s1 || !s2) return;
  if (currentDeckIndex < 0 || currentDeckIndex >= PRESET_DECKS.length) currentDeckIndex = 0;
  s1.innerHTML = ''; s2.innerHTML = '';
  PRESET_DECKS.forEach((d, idx) => {
    const total = getDeckTotal(d);
    const label = `${d.name} (${total}张)`;
    const o1 = document.createElement('option'); o1.value = idx; o1.textContent = label; s1.appendChild(o1);
    const o2 = document.createElement('option'); o2.value = idx; o2.textContent = label; s2.appendChild(o2);
  });
  s1.value = currentDeckIndex;
  s2.value = currentDeckIndex;
  const nameInp = document.getElementById('inputDeckCustomName');
  if (nameInp && PRESET_DECKS[currentDeckIndex]) {
    nameInp.value = PRESET_DECKS[currentDeckIndex].name;
  }
}

document.getElementById('quickDeckSelect').addEventListener('change', (e) => {
  currentDeckIndex = parseInt(e.target.value, 10) || 0;
  saveDecksToStorage();
  initNewBattle();
});

document.getElementById('selectEditingDeck').addEventListener('change', (e) => {
  currentDeckIndex = parseInt(e.target.value, 10) || 0;
  renderDeckEditor();
});

function getDeckTotal(deckObj) {
  return Object.values(deckObj.cards).reduce((a, b) => a + b, 0);
}

let deckDetailNavStack = [];
function closeDeckCardDetailModal() {
  document.getElementById('deckCardDetailModal')?.classList.add('hidden');
}
document.getElementById('btnCloseDeckCardModal')?.addEventListener('click', closeDeckCardDetailModal);
document.getElementById('deckCardDetailModal')?.addEventListener('click', (e) => {
  if (e.target && e.target.id === 'deckCardDetailModal') closeDeckCardDetailModal();
});

function inspectCardInDeckEditor(cardData, keepStack = false, openModal = true) {
  document.querySelectorAll('#deckGalleryGrid .sv-hand-card').forEach(el => {
    el.classList.remove('is-inspected', 'sv-glow-yellow');
  });
  if (!cardData) return;
  document.querySelectorAll('#deckGalleryGrid .sv-hand-card').forEach(el => {
    if (el.dataset.cardId === cardData.id) {
      el.classList.add('is-inspected');
    }
  });
  document.querySelectorAll('#deckEditorList [data-deck-cid]').forEach(el => {
    const sel = el.dataset.deckCid === cardData.id;
    el.classList.toggle('bg-amber-950/70', sel);
    el.classList.toggle('border-amber-400', sel);
    el.classList.toggle('bg-slate-950', !sel);
    el.classList.toggle('hover:bg-slate-800', !sel);
    el.classList.toggle('border-slate-800', !sel);
  });
  if (!keepStack) deckDetailNavStack = [];
  deckInspectedCardData = cardData;
  const slot = document.getElementById('deckInspectedCardSlot');
  slot.innerHTML = '';
  const previewCard = buildHandCardDOM(cardData, null, PRESET_DECKS[currentDeckIndex].cards[cardData.id] || 0);
  previewCard.style.cursor = 'zoom-in';
  const updatePreviewTiltAt = () => {};
  const resetPreviewTilt = () => {};
  previewCard.addEventListener('touchstart', (ev) => {
    if (!ev.changedTouches || !ev.changedTouches.length) return;
    if (ev.cancelable) ev.preventDefault();
    ev.stopPropagation();
    const t = ev.changedTouches[0];
    updatePreviewTiltAt(t.clientX, t.clientY);
  }, { passive: false });
  previewCard.addEventListener('touchmove', (ev) => {
    if (!ev.changedTouches || !ev.changedTouches.length) return;
    if (ev.cancelable) ev.preventDefault();
    ev.stopPropagation();
    const t = ev.changedTouches[0];
    updatePreviewTiltAt(t.clientX, t.clientY);
  }, { passive: false });
  previewCard.addEventListener('touchend', resetPreviewTilt, { passive: true });
  previewCard.addEventListener('touchcancel', resetPreviewTilt, { passive: true });
  slot.appendChild(previewCard);

  const titleEl = document.getElementById('deckInspectedTitle');
  if (titleEl) titleEl.textContent = `🔍 ${cardData.name}`;
  document.getElementById('deckInspectedMeta').textContent =
    `【${cardData.name}】 ${cardData.rarity} · ${cardData.type === 'minion' ? '随从' : (cardData.type === 'amulet' ? '护符' : '法术')}${cardData.race ? '·'+cardData.race : ''} | ⚡${cardData.energy} 🩸${cardData.sacrifice} 🦴${cardData.bones} · ⚖️${formatCardValueText(getCardCostValue(cardData))}`;
  const syncCardCosmeticBtns = () => {
    const btnAv = document.getElementById('btnDeckSetCardAvatar');
    const btnLd = document.getElementById('btnDeckSetCardLeader');
    const isAv = Boolean(userAvatarConfig && userAvatarConfig.avatarCardId === cardData.id);
    const isLd = Boolean(userAvatarConfig && userAvatarConfig.leaderCardId === cardData.id);
    if (btnAv) {
      btnAv.textContent = isAv ? '✅ 当前游戏头像（再点恢复默认）' : '🖼️ 设为游戏头像';
      btnAv.className = isAv
        ? 'flex-1 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 border border-emerald-300 text-xs font-black text-white shadow transition cursor-pointer'
        : 'flex-1 py-2 rounded-xl bg-sky-900/90 hover:bg-sky-800 border border-sky-400/70 text-xs font-black text-sky-100 shadow transition cursor-pointer';
      btnAv.onclick = (e) => {
        e.stopPropagation();
        sfx.play('synergy');
        if (userAvatarConfig.avatarCardId === cardData.id) delete userAvatarConfig.avatarCardId;
        else userAvatarConfig.avatarCardId = cardData.id;
        try { localStorage.setItem('cf_custom_avatar_v1', JSON.stringify(userAvatarConfig)); } catch (_) {}
        if (typeof applyUserAvatarToUI === 'function') applyUserAvatarToUI();
        syncCardCosmeticBtns();
        if (typeof showGameAlert === 'function') {
          showGameAlert(userAvatarConfig.avatarCardId ? `已将『${cardData.name}』卡面设为你的游戏头像（联机大厅与房间对双方可见）！` : '已恢复默认自定义游戏头像。', '🖼️');
        }
      };
    }
    if (btnLd) {
      btnLd.textContent = isLd ? '✅ 当前主战者形象（再点恢复默认）' : '👑 设为主战者形象';
      btnLd.className = isLd
        ? 'flex-1 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 border border-emerald-300 text-xs font-black text-white shadow transition cursor-pointer'
        : 'flex-1 py-2 rounded-xl bg-amber-900/90 hover:bg-amber-800 border border-amber-400/70 text-xs font-black text-amber-100 shadow transition cursor-pointer';
      btnLd.onclick = (e) => {
        e.stopPropagation();
        sfx.play('legend');
        if (userAvatarConfig.leaderCardId === cardData.id) delete userAvatarConfig.leaderCardId;
        else userAvatarConfig.leaderCardId = cardData.id;
        try { localStorage.setItem('cf_custom_avatar_v1', JSON.stringify(userAvatarConfig)); } catch (_) {}
        if (typeof applyUserAvatarToUI === 'function') applyUserAvatarToUI();
        syncCardCosmeticBtns();
        if (typeof showGameAlert === 'function') {
          showGameAlert(userAvatarConfig.leaderCardId ? `已将『${cardData.name}』卡面设为你的主战者形象（单机与联机对战双方均可见）！` : '已恢复默认主战者形象。', '👑');
        }
      };
    }
  };
  syncCardCosmeticBtns();

  if (openModal) {
    document.getElementById('deckCardDetailModal')?.classList.remove('hidden');
  }

  const effEl = document.getElementById('deckInspectedEffect');
  const navHtml = deckDetailNavStack.length > 0
    ? `<div class="mb-2 flex items-center justify-between"><button type="button" id="btnDeckNavBack" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-amber-400/60 text-amber-200 font-black text-xs cursor-pointer">◀ 返回上一张卡牌</button><span class="text-[11px] text-cyan-300 font-bold">关联查看中</span></div>`
    : '';
  const sacHtml = (cardData.sacrifice > 0 || cardData.sacrificeCond)
    ? `<div class="mb-2 p-2 rounded-lg bg-rose-950/80 border border-rose-400/70 text-rose-100 font-black text-xs">🩸 祭品条件：打出时需破坏己方场上 ${cardData.sacrifice || 1} 个${cardData.sacrificeCond ? `「${cardData.sacrificeCond}」` : '任意'}随从</div>`
    : '';
  const rawTxt = getCardDisplayText(cardData) + (cardData.notes ? `\n\n💡 设计备注：${cardData.notes}` : '');
  effEl.innerHTML = navHtml + sacHtml + (rawTxt ? formatInteractiveDetailHTML(rawTxt, cardData.name).replace(/\n/g, '<br>') : '（无特殊效果）');

  effEl.querySelector('#btnDeckNavBack')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const prevCard = deckDetailNavStack.pop();
    if (prevCard) inspectCardInDeckEditor(prevCard, true);
  });
  effEl.querySelectorAll('.cf-kw-link').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const kw = btn.getAttribute('data-kw');
      if (!kw || !KEYWORD_GLOSSARY[kw]) return;
      if (deckDetailNavStack.length < 8) deckDetailNavStack.push(cardData);
      effEl.innerHTML = `<div class="mb-2"><button type="button" id="btnDeckKwBack" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-amber-400/60 text-amber-200 font-black text-xs cursor-pointer">◀ 返回卡牌说明</button></div><div class="p-2.5 rounded-lg bg-amber-950/45 border border-amber-400/65 text-amber-100 font-bold leading-relaxed">【${kw}】${KEYWORD_GLOSSARY[kw]}</div>`;
      effEl.querySelector('#btnDeckKwBack')?.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const prevCard = deckDetailNavStack.pop() || cardData;
        inspectCardInDeckEditor(prevCard, true);
      });
    };
  });
  effEl.querySelectorAll('.cf-card-link').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const targetDef = allCards.find(x => x.name === btn.getAttribute('data-card-name'));
      if (!targetDef || targetDef.id === cardData.id) return;
      if (deckDetailNavStack.length < 8) deckDetailNavStack.push(cardData);
      inspectCardInDeckEditor(targetDef, true);
    };
  });
}

let deckEditorDrag = { active: false, source: '', cardData: null, startX: 0, startY: 0, moved: false };

function showDeckEditorToast(msg, isError = false) {
  const toast = document.getElementById('importStatusToast');
  if (!toast) return;
  toast.classList.remove('hidden');
  toast.className = `my-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold ${isError ? 'bg-rose-950/95 border-rose-400 text-rose-200' : 'bg-emerald-950/95 border-emerald-400 text-emerald-200'}`;
  toast.textContent = msg;
}

document.getElementById('btnDeckDetailAdd').addEventListener('click', () => {
  if (!deckInspectedCardData || deckInspectedCardData.isToken) return;
  const deckObj = PRESET_DECKS[currentDeckIndex];
  const cur = deckObj.cards[deckInspectedCardData.id] || 0;
  if (cur >= RULES.copiesPerCard || getDeckTotal(deckObj) >= RULES.deckEditMax) {
    sfx.play('hit');
    showDeckEditorToast(`⚠️ 单卡上限 ${RULES.copiesPerCard} 张，临时编辑上限 ${RULES.deckEditMax} 张！`, true);
    return;
  }
  sfx.play('click');
  deckObj.cards[deckInspectedCardData.id] = cur + 1;
  renderDeckEditor();
});

document.getElementById('btnDeckDetailRemove').addEventListener('click', () => {
  if (!deckInspectedCardData) return;
  const deckObj = PRESET_DECKS[currentDeckIndex];
  const cur = deckObj.cards[deckInspectedCardData.id] || 0;
  if (cur <= 0) return;
  sfx.play('click');
  if (cur <= 1) delete deckObj.cards[deckInspectedCardData.id];
  else deckObj.cards[deckInspectedCardData.id] = cur - 1;
  renderDeckEditor();
});


const _lastValidDeckSnapshots = new Map();
function snapshotValidDeckState(idx) {
  const d = PRESET_DECKS[idx];
  if (d && getDeckTotal(d) === RULES.deckSize) {
    _lastValidDeckSnapshots.set(idx, { name: d.name, cards: Object.assign({}, d.cards) });
  }
}

function renderDeckEditor() {
  syncGlobalAnimPhases();
  snapshotValidDeckState(currentDeckIndex);
  saveDecksToStorage();
  syncAllDeckSelects();
  if (deckInspectedCardData) inspectCardInDeckEditor(deckInspectedCardData, true, false);
  const deckObj = PRESET_DECKS[currentDeckIndex];
  const total = getDeckTotal(deckObj);
  const frac = document.getElementById('deckCountFraction');
  frac.textContent = `${total} / ${RULES.deckSize} (上限${RULES.deckEditMax})`;
  frac.className = `text-xs font-black px-2.5 py-0.5 rounded-full ${total === RULES.deckSize ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50' : 'bg-amber-500/20 text-amber-300 border border-amber-400/50'}`;

  const topDeckBtn = document.getElementById('btnNavDeck');
  if (topDeckBtn) topDeckBtn.textContent = `🛠️ 卡组编辑 (${total}/${RULES.deckSize}张)`;

  const showTokens = document.getElementById('chkDeckShowTokens').checked;
  const kw = document.getElementById('inputDeckSearch').value.trim();
  const grid = document.getElementById('deckGalleryGrid');
  grid.innerHTML = '';

  const sortVal = document.getElementById('selDeckSort')?.value || 'value_asc';
  const rarityRank = { '普通': 1, '稀有': 2, '史诗': 3, '传说': 4 };
  const basePool = allCards.filter(c => showTokens || !c.isToken);
  const filteredCards = basePool.filter(c => {
    if (deckFilter === '随从' && c.type !== 'minion') return false;
    if (deckFilter === '龙族' && !hasRace(c, '龙族')) return false;
    if (deckFilter === '机械' && !isMechCard(c)) return false;
    if (deckFilter === '亡灵' && !hasRace(c, '亡灵')) return false;
    if (deckFilter === '无种族' && c.race && c.race.trim()) return false;
    if (deckFilter === '法术' && c.type !== 'spell') return false;
    if (deckFilter === '护符' && c.type !== 'amulet') return false;
    if (typeof deckAdvFilter !== 'undefined') {
      if (deckAdvFilter.cost !== 'all') {
        const cv = typeof getCardCostValue === 'function' ? getCardCostValue(c) : (c.energy || 0);
        if (deckAdvFilter.cost === '0-1') { if (cv > 1) return false; }
        else if (deckAdvFilter.cost === '7-8') { if (cv < 7 || cv > 8) return false; }
        else if (deckAdvFilter.cost === '9+') { if (cv < 9) return false; }
        else if (Math.round(cv) !== parseInt(deckAdvFilter.cost, 10)) return false;
      }
      if (deckAdvFilter.system && deckAdvFilter.system !== 'all') {
        const hasE = (c.energy || 0) > 0;
        const hasS = (c.sacrifice || 0) > 0;
        const hasB = (c.bones || 0) > 0;
        const cntSys = (hasE ? 1 : 0) + (hasS ? 1 : 0) + (hasB ? 1 : 0);
        if (deckAdvFilter.system === 'energy_only' && !(hasE && !hasS && !hasB)) return false;
        if (deckAdvFilter.system === 'sac_only' && !(!hasE && hasS && !hasB)) return false;
        if (deckAdvFilter.system === 'bones_only' && !(!hasE && !hasS && hasB)) return false;
        if (deckAdvFilter.system === 'multi' && cntSys < 2) return false;
        if (deckAdvFilter.system === 'free' && cntSys !== 0) return false;
      }
      if (deckAdvFilter.race !== 'all') {
        const races = (c.race || '').split(/[、,，/\s]+/).filter(Boolean);
        if (deckAdvFilter.race === '无种族') { if (races.length > 0) return false; }
        else if (deckAdvFilter.race === '多族') { if (races.length < 2) return false; }
        else if (deckAdvFilter.race === '机械') { if (!isMechCard(c)) return false; }
        else if (deckAdvFilter.race === '恶魔') { if (!hasRace(c, '恶魔') && !c.name.includes('恶魔') && !c.name.includes('吸血鬼') && !c.name.includes('魅魔')) return false; }
        else if (!hasRace(c, deckAdvFilter.race)) return false;
      }
      if (deckAdvFilter.type !== 'all' && c.type !== deckAdvFilter.type) return false;
      if (deckAdvFilter.rarity !== 'all' && c.rarity !== deckAdvFilter.rarity) return false;
      const specs = Array.isArray(deckAdvFilter.specs) ? deckAdvFilter.specs : [];
      const fullTxt = `${c.name} ${getCardDisplayText(c)}`;
      for (const sp of specs) {
        if (sp === 'sac' && !(c.sacrifice > 0)) return false;
        else if (sp === 'bones' && !(c.bones > 0)) return false;
        else if (sp === 'cd' && !(getInitialCountdown(c) > 0)) return false;
        else if (sp === 'fuse' && !(c.keywords || []).some(k => k.k === '融合') && !fullTxt.includes('【融合')) return false;
        else if (sp === 'self_dmg' && !fullTxt.includes('主战者造成') && !fullTxt.includes('献祭')) return false;
        else if (['入场曲','谢幕曲','启动','爆能强化','瞬念召唤','抉择','守护','疾驰','突进','飞行','防空','毁灭','吸血','必杀','潜伏','荆棘','招募','亡者召还','纹章'].includes(sp)) {
          const hasKw = (c.keywords || []).some(k => k.k === sp || String(k.k).startsWith(sp)) || fullTxt.includes(sp);
          if (!hasKw) return false;
        }
      }
    }
    if (kw && !(`${c.name}${c.race}${c.rarity}${getCardDisplayText(c)}`).toLowerCase().includes(kw.toLowerCase())) return false;
    return true;
  });

  filteredCards.sort((a, b) => {
    const ea = a.energy || 0, eb = b.energy || 0;
    const va = typeof getCardCostValue === 'function' ? getCardCostValue(a) : ea;
    const vb = typeof getCardCostValue === 'function' ? getCardCostValue(b) : eb;
    const eGroup = (x) => {
      const xe = x.energy || 0, xs = x.sacrifice || 0, xb = x.bones || 0;
      if (xe === 0 && xs === 0 && xb === 0) return 0; // 完全无费用排最前
      if (xe > 0) return 1;                            // 有能量费用按能量排
      return 2;                                        // 无能量的骨头/祭品排最后
    };
    if (sortVal === 'energy_asc') {
      const ga = eGroup(a), gb = eGroup(b);
      if (ga !== gb) return ga - gb;
      return ea - eb || va - vb || a.name.localeCompare(b.name, 'zh-CN');
    }
    if (sortVal === 'energy_desc') {
      const ga = eGroup(a), gb = eGroup(b);
      if (ga !== gb) return ga === 1 ? -1 : (gb === 1 ? 1 : ga - gb);
      return eb - ea || vb - va || a.name.localeCompare(b.name, 'zh-CN');
    }
    if (sortVal === 'value_asc') return va - vb || ea - eb || a.name.localeCompare(b.name, 'zh-CN');
    if (sortVal === 'value_desc') return vb - va || eb - ea || a.name.localeCompare(b.name, 'zh-CN');
    if (sortVal === 'atk_desc') return (b.atk || 0) - (a.atk || 0) || vb - va;
    if (sortVal === 'hp_desc') return (b.hp || 0) - (a.hp || 0) || vb - va;
    if (sortVal === 'rarity_desc') return (rarityRank[b.rarity] || 0) - (rarityRank[a.rarity] || 0) || ea - eb;
    if (sortVal === 'name_asc') return a.name.localeCompare(b.name, 'zh-CN');
    return ea - eb || va - vb;
  });

  const cntBadge = document.getElementById('deckGalleryCountBadge');
  if (cntBadge) cntBadge.textContent = `显示 ${filteredCards.length} / ${basePool.length} 张`;

  filteredCards.forEach(c => {
    const cnt = deckObj.cards[c.id] || 0;
    const wrap = document.createElement('div');
    wrap.className = 'flex flex-col items-center gap-1';
    const cardEl = buildHandCardDOM(c, null, cnt);
    cardEl.dataset.cardId = c.id;
    cardEl.style.cursor = 'grab';
    if (deckInspectedCardData && deckInspectedCardData.id === c.id) {
      cardEl.classList.add('is-inspected');
    }

    // 左键拖拽加入卡组；右键点击卡牌时快速加入1张到卡组中！
    cardEl.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      deckEditorDrag = { active: true, source: 'gallery', cardData: c, startX: e.clientX, startY: e.clientY, moved: false };
    });
    cardEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      inspectCardInDeckEditor(c, false, false);
      const cur = deckObj.cards[c.id] || 0;
      if (c.isToken || cur >= RULES.copiesPerCard || getDeckTotal(deckObj) >= RULES.deckEditMax) {
        sfx.play('hit');
        showDeckEditorToast(`⚠️ 无法加入：单卡上限 ${RULES.copiesPerCard} 张，临时编辑上限 ${RULES.deckEditMax} 张！`, true);
        return;
      }
      sfx.play('play');
      deckObj.cards[c.id] = cur + 1;
      showDeckEditorToast(`➕ 已右键快速加入 1 张「${c.name}」(${cur + 1}/${RULES.copiesPerCard})`);
      renderDeckEditor();
    });

    wrap.appendChild(cardEl);
    grid.appendChild(wrap);
  });

  const listEl = document.getElementById('deckEditorList');
  listEl.innerHTML = '';
  const entries = Object.entries(deckObj.cards)
    .filter(([_, cnt]) => cnt > 0)
    .map(([cid, cnt]) => ({ c: cardsById[cid], cnt }))
    .filter(x => x.c)
    .sort((a, b) => (a.c.energy - b.c.energy) || (a.c.bones - b.c.bones));

  entries.forEach(({ c, cnt }) => {
    const item = document.createElement('div');
    const isSelected = deckInspectedCardData && deckInspectedCardData.id === c.id;
    item.dataset.deckCid = c.id;
    item.className = `flex items-center justify-between ${isSelected ? 'bg-amber-950/70 border-amber-400' : 'bg-slate-950 hover:bg-slate-800 border-slate-800'} border rounded-lg px-2.5 py-2 text-xs cursor-grab transition select-none`;
    item.title = '右键快速移除1张 | 向右拖动增加1张同名卡 | 向左拖出移除1张';
    item.innerHTML = `
      <div class="flex items-center gap-2 min-w-0 flex-1 pointer-events-none">
        <span class="w-5 h-5 rounded-full bg-emerald-700 text-white font-black flex items-center justify-center text-[10px] shrink-0">${c.energy}</span>
        <span class="font-bold text-white truncate">${c.name}</span>
      </div>
      <div class="flex items-center gap-1.5 shrink-0 pointer-events-none">
        <span class="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-black">×${cnt}</span>
        <span class="text-[10px] text-slate-400">⬅移除 / ➡+1</span>
      </div>
    `;
    item.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      deckEditorDrag = { active: true, source: 'deckList', cardData: c, startX: e.clientX, startY: e.clientY, moved: false };
    });
    item.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const cur = deckObj.cards[c.id] || 0;
      if (cur <= 0) return;
      sfx.play('sacrifice');
      if (cur <= 1) delete deckObj.cards[c.id];
      else deckObj.cards[c.id] = cur - 1;
      inspectCardInDeckEditor(c, false, false);
      showDeckEditorToast(`➖ 已右键快速移除 1 张「${c.name}」`);
      renderDeckEditor();
    });
    listEl.appendChild(item);
  });
}

function setDeckDragScrollLock(locked) {
  const g = document.getElementById('deckGalleryGrid');
  const l = document.getElementById('deckEditorList');
  if (g) g.classList.toggle('deck-dragging-lock', locked);
  if (l) l.classList.toggle('deck-dragging-lock', locked);
  document.body.style.userSelect = locked ? 'none' : '';
}

window.addEventListener('wheel', (e) => {
  if (deckEditorDrag.active && deckEditorDrag.cardData) e.preventDefault();
}, { passive: false });

window.addEventListener('touchmove', (e) => {
  if (deckEditorDrag.active && deckEditorDrag.cardData) e.preventDefault();
}, { passive: false });


/* FIX: 手势被取消时兜底复位拖拽状态，避免 touchmove 永久 preventDefault（整页滚不动） */
['pointercancel','touchcancel','blur'].forEach(function(ev){
  window.addEventListener(ev, function(){
    if (deckEditorDrag && deckEditorDrag.active) {
      deckEditorDrag = { active:false, source:'', cardData:null, startX:0, startY:0, moved:false };
      try { setDeckDragScrollLock(false); } catch(e) {}
      document.querySelectorAll('.deck-drag-ghost').forEach(function(n){ n.remove(); });
    }
  }, true);
});
window.addEventListener('dragstart', (e) => {
  if (deckEditorDrag.active && deckEditorDrag.cardData) e.preventDefault();
});

window.addEventListener('mousemove', (e) => {
  if (!deckEditorDrag.active || !deckEditorDrag.cardData) return;
  const dist = Math.hypot(e.clientX - deckEditorDrag.startX, e.clientY - deckEditorDrag.startY);
  if (!deckEditorDrag.moved && dist > 6) {
    deckEditorDrag.moved = true;
    setDeckDragScrollLock(true);
    const ghost = document.getElementById('dragGhostBox');
    ghost.innerHTML = '';
    const node = buildHandCardDOM(deckEditorDrag.cardData, null, 0);
    node.style.transform = 'scale(0.92) rotate(-2deg)';
    ghost.appendChild(node);
    ghost.classList.remove('hidden');
  }
  if (deckEditorDrag.moved) {
    const ghost = document.getElementById('dragGhostBox');
    ghost.style.left = `${e.clientX}px`;
    ghost.style.top = `${e.clientY}px`;
    const rightPanel = document.getElementById('deckRightPanel');
    if (rightPanel) {
      const r = rightPanel.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      rightPanel.classList.toggle('border-emerald-400', deckEditorDrag.source === 'gallery' && inside);
      rightPanel.classList.toggle('border-rose-400', deckEditorDrag.source === 'deckList' && !inside);
    }
  }
});

window.addEventListener('mouseup', (e) => {
  if (!deckEditorDrag.active) return;
  setDeckDragScrollLock(false);
  const { source, cardData, startX, startY, moved } = deckEditorDrag;
  deckEditorDrag = { active: false, source: '', cardData: null, startX: 0, startY: 0, moved: false };
  document.getElementById('dragGhostBox').classList.add('hidden');
  const rightPanel = document.getElementById('deckRightPanel');
  if (rightPanel) {
    rightPanel.classList.remove('border-emerald-400', 'border-rose-400');
  }

  if (!cardData) return;
  const deckObj = PRESET_DECKS[currentDeckIndex];

  // 未发生拖动（点击）：仅切换选中与检视动效，不重绘卡库以免重置特效
  if (!moved) {
    sfx.play('click');
    inspectCardInDeckEditor(cardData);
    return;
  }

  // 如果放开位置接近原位 (< 32px)，则放回原位不增删，也不重绘卡库
  const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
  if (dist < 32) {
    sfx.play('click');
    inspectCardInDeckEditor(cardData, false, false);
    return;
  }

  const r = rightPanel ? rightPanel.getBoundingClientRect() : null;
  const insideRight = r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;

  if (source === 'gallery') {
    // 从左侧卡牌库拖入右侧牌组框 -> 加入1张；放置在牌组以外 -> 回到牌组库里
    if (insideRight) {
      if (cardData.isToken) {
        sfx.play('hit');
        showDeckEditorToast('⚠️ 衍生物不能直接编入主牌组！', true);
      } else {
        const cur = deckObj.cards[cardData.id] || 0;
        if (cur >= RULES.copiesPerCard) {
          sfx.play('hit');
          showDeckEditorToast(`⚠️ 同名卡「${cardData.name}」最多投入 ${RULES.copiesPerCard} 张！`, true);
        } else if (getDeckTotal(deckObj) >= RULES.deckEditMax) {
          sfx.play('hit');
          showDeckEditorToast(`⚠️ 牌组临时编辑上限为 ${RULES.deckEditMax} 张！`, true);
        } else {
          sfx.play('play');
          deckObj.cards[cardData.id] = cur + 1;
          inspectCardInDeckEditor(cardData, false, false);
        }
      }
    } else {
      sfx.play('click');
    }
  } else if (source === 'deckList') {
    // 卡组中的卡牌向右拖动 (dx >= 36) 时添加1张同名的卡牌；向左拖出 (dx <= -36 或拖出牌组框左侧) 移除1张！
    const dx = e.clientX - startX;
    if (dx >= 36) {
      const cur = deckObj.cards[cardData.id] || 0;
      if (cardData.isToken || cur >= RULES.copiesPerCard || getDeckTotal(deckObj) >= RULES.deckEditMax) {
        sfx.play('hit');
        showDeckEditorToast(`⚠️ 无法继续添加「${cardData.name}」：单卡上限 ${RULES.copiesPerCard} 张，编辑上限 ${RULES.deckEditMax} 张！`, true);
      } else {
        sfx.play('play');
        deckObj.cards[cardData.id] = cur + 1;
        inspectCardInDeckEditor(cardData, false, false);
        showDeckEditorToast(`➕ 向右拖动：已增加 1 张同名卡「${cardData.name}」(${cur + 1}/${RULES.copiesPerCard})`);
      }
    } else if (dx <= -36 || !insideRight) {
      sfx.play('sacrifice');
      const cur = deckObj.cards[cardData.id] || 0;
      if (cur <= 1) delete deckObj.cards[cardData.id];
      else deckObj.cards[cardData.id] = cur - 1;
      inspectCardInDeckEditor(cardData, false, false);
      showDeckEditorToast(`➖ 已移除 1 张「${cardData.name}」`);
    } else {
      sfx.play('click');
    }
  }
  renderDeckEditor();
});

document.querySelectorAll('.deck-filter-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    sfx.play('click');
    deckFilter = btn.dataset.filter;
    document.querySelectorAll('.deck-filter-pill').forEach(b => {
      b.className = 'deck-filter-pill px-3 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-200';
    });
    btn.className = 'deck-filter-pill px-3 py-1 rounded-lg text-xs font-black bg-amber-500 text-slate-950';
    renderDeckEditor();
  });
});
document.getElementById('chkDeckShowTokens').addEventListener('change', renderDeckEditor);
document.getElementById('inputDeckSearch').addEventListener('input', renderDeckEditor);

document.getElementById('btnDeckAutoFill').addEventListener('click', () => {
  sfx.play('synergy');
  const deckObj = PRESET_DECKS[currentDeckIndex];
  for (const c of allCards) {
    if (c.isToken) continue;
    while ((deckObj.cards[c.id] || 0) < RULES.copiesPerCard && getDeckTotal(deckObj) < RULES.deckSize) {
      deckObj.cards[c.id] = (deckObj.cards[c.id] || 0) + 1;
    }
  }
  renderDeckEditor();
});


document.getElementById('btnNewCustomDeck').addEventListener('click', () => {
  sfx.play('synergy');
  const newNum = PRESET_DECKS.length + 1;
  const newDeck = {
    name: `★ 自定义卡组 #${newNum}`,
    isUserCustom: true,
    cards: {}
  };
  PRESET_DECKS.unshift(newDeck);
  currentDeckIndex = 0;
  saveDecksToStorage();
  renderDeckEditor();
  showDeckEditorToast(`✅ 已新建「${newDeck.name}」，可自由命名并拖入卡牌构建（默认将使用此卡组出战）！`);
});

document.getElementById('btnSaveDeckName').addEventListener('click', () => {
  const inp = document.getElementById('inputDeckCustomName');
  const newName = (inp ? inp.value.trim() : '');
  if (!newName) {
    sfx.play('hit');
    showDeckEditorToast('⚠️ 卡组名称不能为空！', true);
    return;
  }
  sfx.play('click');
  PRESET_DECKS[currentDeckIndex].name = newName;
  PRESET_DECKS[currentDeckIndex].isUserCustom = true;
  saveDecksToStorage();
  renderDeckEditor();
  showDeckEditorToast(`✅ 卡组已重命名为「${newName}」并自动永久保存！`);
});

document.getElementById('inputDeckCustomName').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('btnSaveDeckName').click();
});

document.getElementById('btnDeleteCustomDeck').addEventListener('click', () => {
  if (PRESET_DECKS.length <= 1) {
    sfx.play('hit');
    showDeckEditorToast('⚠️ 至少需要保留 1 套卡组！', true);
    return;
  }
  const removedName = PRESET_DECKS[currentDeckIndex].name;
  sfx.play('sacrifice');
  PRESET_DECKS.splice(currentDeckIndex, 1);
  currentDeckIndex = 0;
  saveDecksToStorage();
  renderDeckEditor();
  showDeckEditorToast(`🗑️ 已删除卡组「${removedName}」。`);
});

document.getElementById('btnDeckClear').addEventListener('click', () => {
  sfx.play('click');
  PRESET_DECKS[currentDeckIndex].cards = {};
  renderDeckEditor();
});

document.getElementById('btnDeckSaveOnly')?.addEventListener('click', () => {
  const deckObj = PRESET_DECKS[currentDeckIndex];
  if (deckObj) deckObj.isUserCustom = true;
  saveDecksToStorage();
  sfx.play('buff');
  const total = deckObj ? getDeckTotal(deckObj) : 0;
  showDeckEditorToast(`💾 已保存卡组「${deckObj ? deckObj.name : ''}」(${total}/${RULES.deckSize}张)`);
});
document.getElementById('btnDeckBackPrev')?.addEventListener('click', () => {
  sfx.play('click');
  saveDecksToStorage();
  document.getElementById('btnTopBackMenu')?.click();
});


let currentEditingCardId = null;

