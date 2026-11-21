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

// v1.88：卡图改为按卡拆分的 webp（构建时带内容哈希 + 缩略图），启动时只下载一份几十 KB 的清单，
// 图片由浏览器在真正显示时按需加载并长期缓存。取代旧版"启动即下载 84MB 卡图包再整包解析进内存"的做法。
(function loadCardArtManifest() {
  const overlay = document.getElementById('cfArtLoadingOverlay');
  const pill = document.getElementById('cfArtLoadingPill');
  const hide = () => {
    if (overlay) { overlay.classList.add('hidden'); overlay.style.display = 'none'; }
    if (pill) { pill.classList.add('hidden'); pill.style.display = 'none'; }
  };
  hide();
  // 清理旧版本缓存在 IndexedDB 里的 84MB 整包卡图（已不再使用），为玩家释放存储空间
  try { if (window.indexedDB) indexedDB.deleteDatabase('CardForgeArtPackBlobCache_v1'); } catch (e) {}
  const meta = document.querySelector('meta[name="cf-art-manifest"]');
  const url = (meta && meta.content) || 'art/manifest.json';
  if (location.protocol === 'file:') return; // 本地双击打开：没有清单可取，使用程序绘制的默认卡面
  fetch(url, { credentials: 'same-origin' })
    .then(r => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
    .then((m) => {
      const cards = (m && m.cards) || {};
      const safe = Object.create(null);
      for (const [name, e] of Object.entries(cards)) {
        if (!e || typeof e !== 'object') continue;
        const ok = (u) => typeof u === 'string' && /^art\/[a-z]+\/[0-9a-f]{8,}\.(webp|png|jpg)$/.test(u);
        if (ok(e.full) || ok(e.thumb)) safe[name] = { full: ok(e.full) ? e.full : undefined, thumb: ok(e.thumb) ? e.thumb : undefined };
      }
      window.CF_ART_MANIFEST = safe;
      try {
        if (typeof window.refreshAllCardArtUI === 'function') {
          window.refreshAllCardArtUI();
        } else {
          if (typeof renderAllBattleUI === 'function') renderAllBattleUI();
          if (typeof renderDeckEditor === 'function') renderDeckEditor();
          if (typeof window.refreshMainMenuCards === 'function') window.refreshMainMenuCards();
          if (typeof applyUserAvatarToUI === 'function') applyUserAvatarToUI();
        }
      } catch (e) {}
    })
    .catch((e) => { console.warn('[art] 卡图清单加载失败，使用默认卡面', e && e.message); });
})();
