// ============================================================================
// v34 战场动态不规律魔方阵与雪花符文粒子引擎 (#battleDecorCanvas)
// ============================================================================
(function startBattleDecorAnim() {
  const cvs = document.getElementById('battleDecorCanvas');
  if (!cvs) return;
  const ctx = cvs.getContext('2d');
  const flakes = Array.from({ length: 34 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: 2 + Math.random() * 4.5,
    vy: 0.0003 + Math.random() * 0.0007,
    vx: (Math.random() - 0.5) * 0.0004,
    rot: Math.random() * Math.PI * 2,
    vrot: (Math.random() - 0.5) * 0.015,
    kind: Math.random() < 0.55 ? 'snow' : 'diamond',
    col: Math.random() < 0.5 ? '125,211,252' : '253,224,71',
    alpha: 0.14 + Math.random() * 0.24
  }));
  const cubes = [
    { rx: 0.13, ry: 0.36, size: 46, rot: 0.2, vr: 0.004, col: 'rgba(56,189,248,0.18)' },
    { rx: 0.84, ry: 0.62, size: 54, rot: 1.1, vr: -0.0035, col: 'rgba(251,191,36,0.16)' },
    { rx: 0.17, ry: 0.72, size: 32, rot: 0.7, vr: 0.006, col: 'rgba(192,132,252,0.16)' }
  ];

  function drawSnowflake(x, y, r, rot, col, a) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.strokeStyle = `rgba(${col},${a})`;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
      const ang = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(-Math.cos(ang) * r, -Math.sin(ang) * r);
      ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawMagicCube(x, y, s, rot, col) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-s * 0.5, -s * 0.5, s, s);
    ctx.rotate(Math.PI / 4);
    ctx.strokeRect(-s * 0.42, -s * 0.42, s * 0.84, s * 0.84);
    ctx.beginPath(); ctx.arc(0, 0, s * 0.68, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  let lastDecorTs = 0;
  function tick(now) {
    requestAnimationFrame(tick);
    if (now - lastDecorTs < 32) return;
    lastDecorTs = now;
    const sb = document.getElementById('screenBattle');
    if (sb && !sb.classList.contains('hidden')) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (cvs.width !== w) cvs.width = w;
      if (cvs.height !== h) cvs.height = h;
      ctx.clearRect(0, 0, w, h);
      cubes.forEach(c => {
        c.rot += c.vr;
        drawMagicCube(c.rx * w, c.ry * h + Math.sin(c.rot * 2) * 8, c.size, c.rot, c.col);
      });
      flakes.forEach(f => {
        f.y += f.vy;
        f.x += f.vx + Math.sin(f.y * 12) * 0.00018;
        f.rot += f.vrot;
        if (f.y > 1.03) { f.y = -0.03; f.x = Math.random(); }
        if (f.kind === 'snow') {
          drawSnowflake(f.x * w, f.y * h, f.r, f.rot, f.col, f.alpha);
        } else {
          ctx.save();
          ctx.translate(f.x * w, f.y * h);
          ctx.rotate(f.rot);
          ctx.fillStyle = `rgba(${f.col},${f.alpha})`;
          ctx.fillRect(-f.r * 0.5, -f.r * 0.5, f.r, f.r);
          ctx.restore();
        }
      });
    }
  }
  requestAnimationFrame(tick);
})();

applyUserAvatarToUI();
setTimeout(() => {
  if (typeof connectOnlineNetwork === 'function' && !OnlineState.connected) connectOnlineNetwork();
}, 400);
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootGameNow);
} else {
  bootGameNow();
}
window.onload = bootGameNow;


const GAME_VERSION = '1.87';
window.GAME_VERSION = GAME_VERSION;



