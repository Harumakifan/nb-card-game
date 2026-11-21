// ============================================================================
// 二级菜单：📘 基础游戏教程弹窗控制
// ============================================================================
document.getElementById('btnOpenTutorial')?.addEventListener('click', (e) => {
  e.stopPropagation();
  sfx.play('click');
  document.getElementById('tutorialModal').classList.remove('hidden');
});

document.getElementById('btnCloseTutorial')?.addEventListener('click', (e) => {
  e.stopPropagation();
  sfx.play('click');
  document.getElementById('tutorialModal').classList.add('hidden');
});

document.querySelectorAll('.tut-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    sfx.play('click');
    const tab = btn.dataset.tutTab;
    document.querySelectorAll('.tut-tab-btn').forEach(b => {
      b.className = 'tut-tab-btn text-left px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-slate-300 hover:bg-slate-800';
    });
    btn.className = 'tut-tab-btn text-left px-3.5 py-2.5 rounded-xl text-xs font-black bg-amber-500 text-slate-950';
    document.querySelectorAll('.tut-pane').forEach(p => p.classList.add('hidden'));
    const targetPane = document.getElementById(`tutTab_${tab}`);
    if (targetPane) targetPane.classList.remove('hidden');
  });
});

function triggerLocalJsonFileDialog() {
  sfx.play('click');
  const inp = document.getElementById('fileImportInput');
  inp.value = '';
  inp.click();
}
document.getElementById('btnOpenFileImport')?.addEventListener('click', triggerLocalJsonFileDialog);
document.getElementById('btnDeckImportFile')?.addEventListener('click', triggerLocalJsonFileDialog);

document.getElementById('fileImportInput')?.addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const parsed = JSON.parse(String(ev.target.result || ''));
      const cardArr = Array.isArray(parsed) ? parsed : (parsed.cards || []);
      if (!Array.isArray(cardArr) || cardArr.length === 0) throw new Error('未找到有效的 cards 数组');
      const cnt = registerCardsFromDesigner(cardArr);
      sfx.play('legend');
      switchScreen('deck');
      const toast = document.getElementById('importStatusToast');
      toast.classList.remove('hidden');
      toast.textContent = `✅ 已从电脑文件「${file.name}」成功导入并解析 ${cnt} 张卡牌效果！`;
      renderDeckEditor();
    } catch (err) {
      sfx.play('hit');
      switchScreen('deck');
      const toast = document.getElementById('importStatusToast');
      toast.classList.remove('hidden');
      toast.textContent = `❌ 导入失败：${err.message}`;
    }
  };
  reader.readAsText(file, 'utf-8');
});

function validateDeckLegality(deckObj) {
  if (!deckObj || !deckObj.cards || typeof deckObj.cards !== 'object') {
    return { ok: false, reason: '卡组数据无效' };
  }
  let total = 0;
  for (const [cid, rawCnt] of Object.entries(deckObj.cards)) {
    const cnt = Number(rawCnt);
    if (!Number.isInteger(cnt) || cnt <= 0) {
      if (cnt === 0) continue;
      return { ok: false, reason: `卡牌 ${cid} 张数无效` };
    }
    const cd = cardsById[cid];
    if (!cd) return { ok: false, reason: `包含未知卡牌 ID：${cid}` };
    if (cd.isToken) return { ok: false, reason: `衍生物「${cd.name}」不可加入构筑卡组` };
    if (cnt > RULES.copiesPerCard) return { ok: false, reason: `「${cd.name}」超过单卡上限 ${RULES.copiesPerCard} 张` };
    total += cnt;
  }
  if (total !== RULES.deckSize) {
    return { ok: false, reason: `卡组总张数必须恰好为 ${RULES.deckSize} 张（当前 ${total} 张）` };
  }
  return { ok: true, total };
}

function encodeDeckCode(deckObj) {
  const check = validateDeckLegality(deckObj);
  if (!check.ok) return { ok: false, reason: check.reason };
  const entries = Object.entries(deckObj.cards)
    .filter(([_, cnt]) => cnt > 0)
    .sort((a, b) => a[0].localeCompare(b[0]));
  const payload = JSON.stringify({ n: String(deckObj.name || '分享卡组').slice(0, 24), c: entries });
  const b64 = btoa(unescape(encodeURIComponent(payload)));
  return { ok: true, code: 'CF1:' + b64 };
}

function decodeAndValidateDeckCode(raw) {
  const rawStr = String(raw || '').trim();
  const match = rawStr.match(/CF1:[A-Za-z0-9+/=_-]+/);
  const s = match ? match[0] : rawStr;
  if (!s.startsWith('CF1:')) return { ok: false, reason: '牌组码格式错误：未找到有效的 CF1: 牌组码' };
  try {
    const jsonStr = decodeURIComponent(escape(atob(s.slice(4))));
    const parsed = JSON.parse(jsonStr);
    if (!parsed || !Array.isArray(parsed.c)) return { ok: false, reason: '牌组码内容损坏' };
    const cards = {};
    for (const item of parsed.c) {
      if (!Array.isArray(item) || item.length < 2) return { ok: false, reason: '牌组码条目格式错误' };
      const cid = String(item[0]);
      const cnt = Number(item[1]);
      cards[cid] = (cards[cid] || 0) + cnt;
    }
    const deckObj = { name: String(parsed.n || '导入卡组').trim().slice(0, 24) || '导入卡组', cards };
    const check = validateDeckLegality(deckObj);
    if (!check.ok) return { ok: false, reason: check.reason };
    return { ok: true, deck: deckObj };
  } catch (e) {
    return { ok: false, reason: '无法解析该牌组码，请检查是否复制完整' };
  }
}

function applyImportedDeckCode(rawCode) {
  const res = decodeAndValidateDeckCode(rawCode);
  if (!res.ok) return res;
  const newDeck = {
    name: `${res.deck.name} (导入)`,
    cards: res.deck.cards,
    isCustom: true
  };
  PRESET_DECKS.push(newDeck);
  currentDeckIndex = PRESET_DECKS.length - 1;
  if (typeof saveDecksToStorage === 'function') saveDecksToStorage();
  if (typeof syncAllDeckSelects === 'function') syncAllDeckSelects();
  if (typeof renderDeckEditor === 'function') renderDeckEditor();
  return { ok: true, deck: newDeck };
}

document.getElementById('btnCopyDeckCode')?.addEventListener('click', async () => {
  const d = PRESET_DECKS[currentDeckIndex];
  const res = encodeDeckCode(d);
  if (!res.ok) {
    sfx.play('hit');
    showDeckEditorToast(`⚠️ 无法生成牌组码：${res.reason}`, true);
    return;
  }
  const shareText = `【冥刻之诗】游戏卡组码（可在卡组编辑器中点击「导入牌组码」直接使用）\n卡组名称：${d.name}\n牌组码：${res.code}`;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(shareText);
      sfx.play('play');
      showDeckEditorToast(`📋 已复制「${d.name}」的牌组码及说明到剪贴板！`);
      return;
    }
  } catch (e) {}
  showGameAlert('请手动复制下方卡组码分享给其他玩家：\n\n' + shareText, '📋');
});

document.getElementById('btnPasteDeckCode')?.addEventListener('click', async () => {
  let clipText = '';
  try {
    if (navigator.clipboard && navigator.clipboard.readText) {
      clipText = await navigator.clipboard.readText();
    }
  } catch (e) {}
  if (clipText && /CF1:[A-Za-z0-9+/=_-]+/.test(clipText)) {
    const res = applyImportedDeckCode(clipText);
    if (res.ok) {
      sfx.play('legend');
      showDeckEditorToast(`✅ 已从剪贴板导入合法卡组「${res.deck.name}」（40张）！`);
      return;
    }
  }
  const modal = document.getElementById('deckCodeImportModal');
  const inp = document.getElementById('deckCodePasteInput');
  const err = document.getElementById('deckCodeImportError');
  if (modal && inp) {
    inp.value = clipText || '';
    if (err) err.classList.add('hidden');
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    setTimeout(() => inp.focus(), 50);
  }
});

document.getElementById('btnConfirmImportDeckCode')?.addEventListener('click', () => {
  const inp = document.getElementById('deckCodePasteInput');
  const err = document.getElementById('deckCodeImportError');
  const res = applyImportedDeckCode(inp ? inp.value : '');
  if (!res.ok) {
    sfx.play('hit');
    if (err) { err.textContent = `❌ ${res.reason}`; err.classList.remove('hidden'); }
    return;
  }
  document.getElementById('deckCodeImportModal')?.classList.add('hidden');
  sfx.play('legend');
  showDeckEditorToast(`✅ 已成功导入合法卡组「${res.deck.name}」（40张）！`);
});

['btnCloseDeckCodeModal', 'btnCancelImportDeckCode'].forEach(id => {
  document.getElementById(id)?.addEventListener('click', () => {
    document.getElementById('deckCodeImportModal')?.classList.add('hidden');
  });
});

function switchScreen(name) {
  const surBtn = document.getElementById('btnTopSurrenderExit');
  const backBtn = document.getElementById('btnTopBackMenu');
  if (surBtn) surBtn.classList.toggle('hidden', name !== 'battle');
  if (backBtn) backBtn.classList.toggle('hidden', name === 'battle');
  if (name === 'battle') {
    const deckObj = PRESET_DECKS[currentDeckIndex];
    const total = getDeckTotal(deckObj);
    if (total !== RULES.deckSize) {
      sfx.play('hit');
      showDeckEditorToast(`⚠️ 牌组必须恰好为 ${RULES.deckSize} 张才能开始对战（当前 ${total} 张）！`, true);
      name = 'deck';
    }
  }
  sfx.play('click');
  document.getElementById('screenBattle').classList.toggle('hidden', name !== 'battle');
  document.getElementById('screenDeck').classList.toggle('hidden', name !== 'deck');
  document.getElementById('screenDesigner').classList.toggle('hidden', name !== 'designer');
  document.getElementById('screenCode').classList.toggle('hidden', name !== 'code');
  if (name !== 'battle') {
    document.getElementById('mulliganModal')?.classList.add('hidden');
    document.getElementById('victoryDefeatModal')?.classList.add('hidden');
    document.getElementById('handPickModal')?.classList.add('hidden');
    document.getElementById('svDetailPanel')?.classList.add('hidden'); if (typeof syncDetailSelectionHighlight === 'function') syncDetailSelectionHighlight();
    document.getElementById('battleRecordPanel')?.classList.add('hidden');
    document.getElementById('oppSpellShowcaseModal')?.classList.add('hidden');
  }
  if (name === 'deck') renderDeckEditor();
  if (typeof publishOnlinePresence === 'function') publishOnlinePresence(false);
  if (name === 'designer' && document.getElementById('desName')) { renderV19CardList(); if (v19DesignerCards.length > 0) loadCardIntoDesigner(v19DesignerCards[0]); else document.getElementById('btnV19NewCard')?.click(); }
  if (name === 'code' && !document.getElementById('gdSourcePre').textContent) {
    document.getElementById('gdSourcePre').textContent = GD_SOURCES['EffectScriptParser.gd'] || '';
  }
}

document.getElementById('btnNavBattle')?.addEventListener('click', () => switchScreen('battle'));
document.getElementById('btnNavDeck')?.addEventListener('click', () => switchScreen('deck'));
document.getElementById('btnNavDesigner')?.addEventListener('click', () => switchScreen('designer'));
document.getElementById('btnNavCode')?.addEventListener('click', () => switchScreen('code'));

document.querySelectorAll('.gd-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    sfx.play('click');
    document.getElementById('gdSourcePre').textContent = GD_SOURCES[btn.dataset.gd] || '';
    document.querySelectorAll('.gd-tab-btn').forEach(b => {
      b.className = 'gd-tab-btn px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-200';
    });
    btn.className = 'gd-tab-btn px-3 py-1.5 rounded-lg text-xs font-black bg-emerald-500 text-slate-950';
  });
});

document.getElementById('btnToggleMute')?.addEventListener('click', (e) => {
  sfx.muted = !sfx.muted;
  e.target.textContent = sfx.muted ? '🔇' : '🔊';
});

['mousedown', 'keydown', 'touchstart'].forEach(ev => window.addEventListener(ev, () => sfx.init(), { once: true }));

