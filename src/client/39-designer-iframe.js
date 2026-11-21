// v1.88：设计器改为独立页面 designer.html（原 base64 srcdoc 内联脚本会被严格 CSP 拦截）
(function initDesignerV23Iframe() {
  const frame = document.getElementById('designerV23Frame');
  if (!frame || frame.dataset.loaded) return;
  frame.dataset.loaded = '1';
  frame.src = 'designer.html';
})();
