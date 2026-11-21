// ============================================================================
// v1.84 安全加固：原 index.html 内联事件与引导脚本迁入外部 JS，支持严格 CSP
// ============================================================================
document.body?.addEventListener('contextmenu', (e) => e.preventDefault());
document.getElementById('btnDesignerBackToMenu')?.addEventListener('click', () => {
  document.getElementById('screenDesigner')?.classList.add('hidden');
  const topBack = document.getElementById('btnTopBackMenu');
  if (topBack) topBack.click();
  else document.getElementById('mainMenuOverlay')?.classList.remove('hidden');
});

(function loadCardArtPackWithProgress() {
  const ART_PACK_URL = 'cards_art_pack.js?art=1';
  const PACK_DB_NAME = 'CardForgeArtPackBlobCache_v1';
  const PACK_STORE = 'packs';
  const overlay = document.getElementById('cfArtLoadingOverlay');
  const pill = document.getElementById('cfArtLoadingPill');
  const bar = document.getElementById('cfArtProgressBar');
  const txt = document.getElementById('cfArtProgressText');
  const pctEl = document.getElementById('cfArtProgressPct');
  const pillPct = document.getElementById('cfArtPillPct');
  const errNote = document.getElementById('cfArtErrorNote');
  const btnRetry = document.getElementById('btnCfArtRetry');
  const btnBg = document.getElementById('btnCfArtBgLoad');
  let minimized = false;
  let finished = false;
  let showTimer = null;

  function openPackCacheDB() {
    return new Promise((resolve, reject) => {
      try {
        const req = indexedDB.open(PACK_DB_NAME, 1);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(PACK_STORE)) db.createObjectStore(PACK_STORE);
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      } catch (e) { reject(e); }
    });
  }

  async function readCachedPackBlob(key) {
    try {
      const db = await openPackCacheDB();
      return await new Promise((resolve) => {
        const tx = db.transaction(PACK_STORE, 'readonly');
        const req = tx.objectStore(PACK_STORE).get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch (e) { return null; }
  }

  async function saveCachedPackBlob(key, blob) {
    try {
      const db = await openPackCacheDB();
      await new Promise((resolve) => {
        const tx = db.transaction(PACK_STORE, 'readwrite');
        const store = tx.objectStore(PACK_STORE);
        store.clear(); // 清理旧版本卡图包，避免重复占用手机存储空间
        store.put(blob, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch (e) {}
  }

  function hideAll() {
    if (showTimer) { clearTimeout(showTimer); showTimer = null; }
    if (overlay) { overlay.classList.add('hidden'); overlay.style.display = 'none'; }
    if (pill) { pill.classList.add('hidden'); pill.style.display = 'none'; }
  }
  function showOverlay() {
    if (finished) return;
    minimized = false;
    if (pill) { pill.classList.add('hidden'); pill.style.display = 'none'; }
    if (overlay) { overlay.classList.remove('hidden'); overlay.style.display = 'flex'; }
  }
  function showPill() {
    if (finished) return;
    minimized = true;
    if (overlay) { overlay.classList.add('hidden'); overlay.style.display = 'none'; }
    if (pill) { pill.classList.remove('hidden'); pill.style.display = 'flex'; }
  }
  function setProgress(pct, label) {
    const p = Math.max(0, Math.min(100, Math.round(pct)));
    if (bar) bar.style.width = Math.max(3, p) + '%';
    if (pctEl) pctEl.textContent = p + '%';
    if (pillPct) pillPct.textContent = p + '%';
    if (txt && label) txt.textContent = label;
  }

  btnBg?.addEventListener('click', () => {
    if ((errNote && !errNote.classList.contains('hidden')) || (btnRetry && !btnRetry.classList.contains('hidden'))) {
      finished = true;
      hideAll();
    } else {
      showPill();
    }
  });
  pill?.addEventListener('click', showOverlay);
  btnRetry?.addEventListener('click', () => startLoad(true));

  function finishWithRefresh() {
    finished = true;
    setProgress(100, '卡图加载完成！');
    if (typeof window.refreshAllCardArtUI === 'function') {
      try { window.refreshAllCardArtUI(); } catch (e) {}
    }
    setTimeout(hideAll, 120);
  }

  async function parseAndApplyArtPackBlob(blob) {
    // 直接提取 JSON 对象并 JSON.parse，彻底避免 blob: 脚本执行，100% 兼容最严格 CSP (script-src 'self')
    const rawTxt = await blob.text();
    // 注意 cards_art_pack.js 头部为 Object.assign(window.CF_SVG_ART_PACK || {}, {"卡名":...})，必须跳过前面的 "{}"
    let sIdx = rawTxt.indexOf('{"');
    if (sIdx === -1) {
      const assignComma = rawTxt.indexOf('{},');
      sIdx = assignComma !== -1 ? rawTxt.indexOf('{', assignComma + 3) : rawTxt.indexOf('{');
    }
    const eIdx = rawTxt.lastIndexOf('}');
    if (sIdx === -1 || eIdx <= sIdx) {
      throw new Error('卡图包格式异常');
    }
    const parsed = JSON.parse(rawTxt.slice(sIdx, eIdx + 1));
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('卡图包内容为空');
    }
    window.CF_SVG_ART_PACK = Object.assign(window.CF_SVG_ART_PACK || {}, parsed);
  }

  function injectScriptFallback(url) {
    const s = document.createElement('script');
    s.src = url;
    s.async = true;
    s.onload = () => finishWithRefresh();
    s.onerror = () => hideAll();
    document.body.appendChild(s);
  }

  async function startLoad(forceNetwork) {
    finished = false;
    if (errNote) errNote.classList.add('hidden');
    if (btnRetry) btnRetry.classList.add('hidden');
    if (btnBg) btnBg.textContent = '先进入游戏（后台加载）';
    setProgress(2, '正在检查本地卡图缓存...');

    // 本地双击 file:// 协议直接走原生 script，避免 CORS
    if (location.protocol === 'file:') {
      injectScriptFallback(ART_PACK_URL);
      return;
    }

    // 1. 优先从 IndexedDB 本地持久化缓存读取（刷新/重启/断网均秒开，0流量！）
    if (!forceNetwork) {
      const cachedBlob = await readCachedPackBlob(ART_PACK_URL);
      if (cachedBlob && cachedBlob.size > 100000) {
        try {
          await parseAndApplyArtPackBlob(cachedBlob);
          finishWithRefresh();
          return;
        } catch (e) {}
      }
      // 若用户通过 Shift+I 本地导入过全套卡图，直接跳过网络下载
      if (window.CF_SVG_ART_PACK && Object.keys(window.CF_SVG_ART_PACK).length >= 180) {
        finishWithRefresh();
        return;
      }
    }

    // 2. 首次进入或卡图版本号变更时，通过网络流式下载并写入 IndexedDB 持久缓存
    if (showTimer) clearTimeout(showTimer);
    if (forceNetwork) showOverlay();
    else showTimer = setTimeout(() => { if (!finished && !minimized) showOverlay(); }, 200);

    try {
      const resp = await fetch(ART_PACK_URL, { cache: 'force-cache' });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);

      const contentEnc = String(resp.headers.get('content-encoding') || '').toLowerCase();
      const isCompressed = /gzip|br|deflate/.test(contentEnc);
      const rawContentLen = parseInt(resp.headers.get('content-length') || '0', 10);
      // 服务端开启 gzip_static 时 content-length 是压缩后体积(~60MB)，而流读取的是解压后体积(~80MB)
      const estTotal = (!isCompressed && rawContentLen > 0) ? rawContentLen : Math.max(rawContentLen, 84500000);
      const chunks = [];
      let loaded = 0;

      if (resp.body && resp.body.getReader) {
        const reader = resp.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            loaded += value.byteLength;
            const mb = (loaded / 1048576).toFixed(1);
            if (!isCompressed && rawContentLen > 0 && loaded <= rawContentLen) {
              const totalMb = (rawContentLen / 1048576).toFixed(1);
              setProgress(Math.min(94, (loaded / rawContentLen) * 94), `已下载 ${mb} MB / ${totalMb} MB`);
            } else {
              const dynTotal = Math.max(estTotal, loaded * 1.04);
              const pct = Math.min(94, (loaded / dynTotal) * 94);
              setProgress(pct, `已下载 ${mb} MB...`);
            }
          }
        }
      } else {
        const buf = await resp.arrayBuffer();
        chunks.push(new Uint8Array(buf));
        loaded = buf.byteLength;
      }

      setProgress(96, '正在写入本地持久化缓存...');
      const blob = new Blob(chunks, { type: 'application/javascript' });
      // 异步写入 IndexedDB，同时立即解析卡图让玩家进游戏
      saveCachedPackBlob(ART_PACK_URL, blob);

      setProgress(98, '正在解析卡图资源...');
      await new Promise(r => setTimeout(r, 30));
      await parseAndApplyArtPackBlob(blob);
      finishWithRefresh();
    } catch (e) {
      if (showTimer) { clearTimeout(showTimer); showTimer = null; }
      if (window.CF_SVG_ART_PACK && Object.keys(window.CF_SVG_ART_PACK).length > 30) {
        hideAll();
        return;
      }
      showOverlay();
      if (errNote) errNote.classList.remove('hidden');
      if (btnRetry) btnRetry.classList.remove('hidden');
      if (btnBg) btnBg.textContent = '暂用默认画风进入';
      setProgress(0, '加载失败，请检查网络后重试');
    }
  }

  setTimeout(() => startLoad(false), 50);})();
