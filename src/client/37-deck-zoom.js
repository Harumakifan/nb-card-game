// ============================================================================
// v1.43 卡牌编辑器详情弹窗：点击卡牌全屏放大查看完整卡面（含镀闪/折射特效）
// ============================================================================
;(function initDeckCardZoomLightbox() {
  if (typeof document === 'undefined') return;

  function openFullCardLightbox(cardEl) {
    if (!cardEl) return;
    const svgImg = cardEl.querySelector('image#card-art, .sv-temple-frame-svg image');
    const domImg = cardEl.querySelector('.sv-temple-art-img, .sv-art-fg-layer');
    const imgSrc = (svgImg && (svgImg.getAttribute('href') || svgImg.getAttribute('xlink:href')))
      || (domImg && domImg.getAttribute('src'))
      || (typeof deckInspectedCardData !== 'undefined' && deckInspectedCardData ? getAnimeIllustrationDataURI(deckInspectedCardData) : '');
    const cardTitle = (typeof deckInspectedCardData !== 'undefined' && deckInspectedCardData && deckInspectedCardData.name)
      || (domImg && domImg.getAttribute('alt'))
      || '卡面原画鉴赏';
    if (!imgSrc) return;
    let lb = document.getElementById('cfCardZoomLightbox');
    if (lb) lb.remove();
    lb = document.createElement('div');
    lb.id = 'cfCardZoomLightbox';
    lb.innerHTML = `
      <div class="cf-zoom-backdrop"></div>
      <div class="cf-zoom-stage">
        <img class="cf-zoom-pure-art" src="${imgSrc}" alt="${cardTitle}" />
        <div class="cf-zoom-hint">${cardTitle} · 点击任意位置或按 Esc 关闭原画鉴赏</div>
      </div>
    `;
    const close = () => lb.remove();
    lb.addEventListener('click', close);
    document.body.appendChild(lb);
  }

  document.addEventListener('click', (e) => {
    const slot = document.getElementById('deckInspectedCardSlot');
    if (!slot) return;
    const card = e.target && e.target.closest ? e.target.closest('#deckInspectedCardSlot .sv-hand-card') : null;
    if (card) {
      e.stopPropagation();
      openFullCardLightbox(card);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
      const lb = document.getElementById('cfCardZoomLightbox');
      if (lb) lb.remove();
    }
  });
})();


