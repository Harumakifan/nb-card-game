// ============================================================================
// v1.31 cards_svg 高清卡图一键热导入器（IndexedDB 持久化，支持整个文件夹秒级升级）
// ============================================================================
;(function initSvgArtImporter() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  window.CF_SVG_ART_PACK = window.CF_SVG_ART_PACK || {};
  const DB_NAME = 'CardForgeSvgArtDB_v2_uhd';
  const STORE_NAME = 'arts';

  function openArtDB() {
    return new Promise((resolve, reject) => {
      try {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      } catch (e) { reject(e); }
    });
  }

  async function loadAllSavedSvgArts() {
    try {
      const db = await openArtDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.openCursor();
      let count = 0;
      await new Promise((resolve) => {
        req.onsuccess = (e) => {
          const cursor = e.target.result;
          if (cursor) {
            window.CF_SVG_ART_PACK[cursor.key] = cursor.value;
            count++;
            cursor.continue();
          } else {
            resolve();
          }
        };
        req.onerror = () => resolve();
      });
      window.refreshAllCardArtUI = function () {
        if (typeof artCache === 'object' && artCache) Object.keys(artCache).forEach(k => delete artCache[k]);
        if (typeof artLayerCache === 'object' && artLayerCache) Object.keys(artLayerCache).forEach(k => delete artLayerCache[k]);
        if (typeof renderAllBattleUI === 'function') renderAllBattleUI();
        if (typeof renderDeckEditor === 'function') renderDeckEditor();
        if (typeof window.refreshMainMenuCards === 'function') window.refreshMainMenuCards();
        if (typeof applyUserAvatarToUI === 'function') applyUserAvatarToUI();
        const mulModal = document.getElementById('mulliganModal');
        if (mulModal && !mulModal.classList.contains('hidden') && typeof renderMulliganDualBox === 'function') {
          if (typeof _mulliganCardCache !== 'undefined' && _mulliganCardCache && _mulliganCardCache.clear) _mulliganCardCache.clear();
          renderMulliganDualBox();
        }
        updateImportBtnBadge();
      };
      if (count > 0) {
        window.refreshAllCardArtUI();
      }
      updateImportBtnBadge();
    } catch (e) {}
  }

  function extractCardNameFromFile(filename) {
    const stem = String(filename || '').replace(/\.[^.]+$/, '').trim();
    const m = stem.match(/^\d+[_\-\s]+(.+)$/);
    return m ? m[1].trim() : stem;
  }

  function compressImageUrlToWebp(dataUrl, maxSide = 1080) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          // 零裁切：严格保留原图真实长宽比（完整展现全貌），按最长边 1080px 超清等比缩放
          const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
          const nw = Math.max(1, Math.round(img.width * scale));
          const nh = Math.max(1, Math.round(img.height * scale));
          const cvs = document.createElement('canvas');
          cvs.width = nw; cvs.height = nh;
          const ctx = cvs.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, nw, nh);
          let out = cvs.toDataURL('image/webp', 0.94);
          if (!out.startsWith('data:image/webp')) out = cvs.toDataURL('image/jpeg', 0.94);
          resolve(out);
        } catch (err) { reject(err); }
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  async function importSvgFiles(fileList) {
    const files = Array.from(fileList || []).filter(f => /\.(svg|png|jpe?g|webp)$/i.test(f.name));
    if (!files.length) return;
    let bar = document.getElementById('cfSvgImportProgress');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'cfSvgImportProgress';
      document.body.appendChild(bar);
    }
    bar.style.display = 'flex';
    let db = null;
    try { db = await openArtDB(); } catch (e) {}
    let okCount = 0;

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const cardName = extractCardNameFromFile(f.name);
      bar.textContent = `🖼️ 正在升级卡图 (${i + 1}/${files.length})：${cardName}`;
      try {
        let srcUrl = null;
        if (/\.svg$/i.test(f.name)) {
          const txt = await f.text();
          const m = txt.match(/data:image\/[a-zA-Z0-9+.-]+;base64,[A-Za-z0-9+/=]+/);
          if (m) srcUrl = m[0];
        } else {
          srcUrl = await new Promise((res, rej) => {
            const rd = new FileReader();
            rd.onload = () => res(rd.result);
            rd.onerror = rej;
            rd.readAsDataURL(f);
          });
        }
        if (srcUrl) {
          const webp = await compressImageUrlToWebp(srcUrl);
          window.CF_SVG_ART_PACK[cardName] = webp;
          if (db) {
            await new Promise((res) => {
              try {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                tx.objectStore(STORE_NAME).put(webp, cardName);
                tx.oncomplete = () => res();
                tx.onerror = () => res();
              } catch (e) { res(); }
            });
          }
          okCount++;
        }
      } catch (err) {
        console.warn('[SvgImport] skip', f.name, err);
      }
    }

    if (typeof artCache === 'object' && artCache) Object.keys(artCache).forEach(k => delete artCache[k]);
    if (typeof artLayerCache === 'object' && artLayerCache) Object.keys(artLayerCache).forEach(k => delete artLayerCache[k]);
    if (typeof renderAllBattleUI === 'function') renderAllBattleUI();
    if (typeof renderDeckEditor === 'function') renderDeckEditor();
    if (typeof window.refreshMainMenuCards === 'function') window.refreshMainMenuCards();
    updateImportBtnBadge();
    bar.textContent = `✅ 卡图升级完成！已导入 ${okCount} 张高清卡图（已持久化保存）`;
    setTimeout(() => { bar.style.display = 'none'; }, 3200);
  }

  // 创建隐藏文件夹选择器与主界面/卡组编辑器一键按钮
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.multiple = true;
  fileInput.setAttribute('webkitdirectory', '');
  fileInput.setAttribute('directory', '');
  fileInput.accept = '.svg,.png,.jpg,.jpeg,.webp';
  fileInput.style.display = 'none';
  fileInput.addEventListener('change', (e) => {
    importSvgFiles(e.target.files);
    e.target.value = '';
  });
  document.body.appendChild(fileInput);

  function updateImportBtnBadge() {
    const cnt = Object.keys(window.CF_SVG_ART_PACK || {}).length;
    const btn = document.getElementById('btnImportSvgArtFolder');
    if (btn) btn.textContent = `🖼️ 导入 cards_svg (${cnt}/216)`;
  }

  function exportCurrentArtPack() {
    const pack = window.CF_SVG_ART_PACK || {};
    const entries = Object.entries(pack);
    const totalCards = entries.length;
    if (totalCards === 0) {
      if (typeof showGameAlert === 'function') showGameAlert('当前尚未导入任何卡图，请先点击「导入本地 cards_svg 文件夹」。', '⚠️');
      return;
    }
    const packObj = Object.fromEntries(entries);
    const jsTxt = `// CardForge · 冥刻之诗 高清卡图资源包 (共 ${totalCards} 张)\nwindow.CF_SVG_ART_PACK = Object.assign(window.CF_SVG_ART_PACK || {}, ${JSON.stringify(packObj)});\n`;
    const blob = new Blob([jsTxt], { type: 'application/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cards_art_pack.js';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2500);
    if (typeof showGameAlert === 'function') {
      showGameAlert(
        `已导出单文件卡图包 cards_art_pack.js（共 ${totalCards} 张），直接放进 index.html 同级目录覆盖即可！`,
        '💾'
      );
    }
  }

  // 默认完全不展示在主界面；仅在需要时按 Shift+I（或控制台调用 openCardArtManager()）呼出
  window.openCardArtManager = function () {
    let modal = document.getElementById('cfArtMgrModal');
    if (modal) { modal.remove(); return; }
    const cnt = Object.keys(window.CF_SVG_ART_PACK || {}).length;
    modal = document.createElement('div');
    modal.id = 'cfArtMgrModal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:9995;display:flex;align-items:center;justify-content:center;background:rgba(2,6,23,0.78);backdrop-filter:blur(6px);';
    modal.innerHTML = `
      <div style="background:#0f172a;border:1.5px solid rgba(56,189,248,0.5);border-radius:16px;padding:20px 22px;width:min(360px,90vw);color:#f8fafc;box-shadow:0 20px 50px rgba(0,0,0,0.7);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <span style="font-weight:900;font-size:15px;">🖼️ 卡图资源管理（${cnt}/216）</span>
          <button id="cfArtMgrClose" style="background:none;border:none;color:#94a3b8;font-size:18px;cursor:pointer;">✕</button>
        </div>
        <button id="cfArtMgrImport" style="width:100%;padding:10px 14px;border-radius:10px;border:1px solid #38bdf8;background:linear-gradient(90deg,#0369a1,#1d4ed8);color:#fff;font-weight:900;font-size:13px;cursor:pointer;margin-bottom:10px;">📂 导入本地 cards_svg 文件夹</button>
        <button id="cfArtMgrExport" style="width:100%;padding:10px 14px;border-radius:10px;border:1px solid #f59e0b;background:#1e293b;color:#fde68a;font-weight:800;font-size:13px;cursor:pointer;">💾 导出单文件 cards_art_pack.js</button>
      </div>
    `;
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
    document.getElementById('cfArtMgrClose').onclick = () => modal.remove();
    document.getElementById('cfArtMgrImport').onclick = () => { modal.remove(); fileInput.click(); };
    document.getElementById('cfArtMgrExport').onclick = () => { modal.remove(); exportCurrentArtPack(); };
  };

  function injectImportButton() {
    // 按需呼出快捷键：Shift + I
    document.addEventListener('keydown', (e) => {
      if (e.shiftKey && (e.code === 'KeyI' || e.key === 'I')) {
        const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
        if (tag === 'input' || tag === 'textarea') return;
        e.preventDefault();
        window.openCardArtManager();
      }
    });
  }

  setTimeout(() => {
    injectImportButton();
    loadAllSavedSvgArts();
  }, 400);
})();


