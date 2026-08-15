/* ═══════════════════════════════════════════════════════════
   TAP EMPIRE — Canvas Particle System
═══════════════════════════════════════════════════════════ */

'use strict';

const _BG_COUNT = 35;   // ambient background particles
const _TAP_COUNT = 12;   // normal tap particles

const pCvs = document.getElementById('particle-canvas');
const pCtx = pCvs ? pCvs.getContext('2d') : null;
let particles = [];
let bgParticles = [];
let _raf;

/* ── Resize canvas ── */
function resizeParticleCanvas() {
  if (!pCvs) return;
  pCvs.width = Math.min(window.innerWidth, 480);
  pCvs.height = window.innerHeight;
}

/* ── Background ambient particles ── */
function initBgParticles() {
  bgParticles = [];
  for (let i = 0; i < _BG_COUNT; i++) {
    bgParticles.push({
      x: Math.random() * (pCvs?.width || 320),
      y: Math.random() * (pCvs?.height || 600),
      r: Math.random() * 1.5 + 0.4,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      alpha: Math.random() * 0.25 + 0.05,
      color: Math.random() > 0.5 ? '#F5B700' : '#60A5FA',
    });
  }
}

/* ── Tap burst particles ── */
function spawnTapParticles(x, y, type) {
  if (!pCtx) return;
  const isCrit = type === 'critical';
  const isPerfect = type === 'perfect';
  const count = isPerfect ? _TAP_COUNT * 2 : isCrit ? Math.floor(_TAP_COUNT * 1.5) : _TAP_COUNT;
  const cols = isPerfect
    ? ['#34D399', '#60A5FA', '#ffffff']
    : isCrit
      ? ['#F87171', '#F97316', '#FBBF24']
      : ['#F5B700', '#FFCC4D', 'rgba(255,255,255,0.5)'];

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.5;
    const speed = (isCrit || isPerfect) ? Math.random() * 4.5 + 3 : Math.random() * 3 + 1.5;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.2,
      r: Math.random() * 4 + 2,
      alpha: 1,
      color: cols[Math.floor(Math.random() * cols.length)],
      isCoin: Math.random() > 0.75,
      gravity: 0.12,
    });
  }
}

/* ── Ripple ring ── */
function spawnRipple(x, y, color) {
  if (!pCtx) return;
  particles.push({ type: 'ripple', x, y, r: 8, alpha: 0.7, vr: 3.8, color: color || '#F5B700' });
}

/* ── Collect burst ── */
function spawnCollectBurst(x, y) {
  if (!pCtx) return;
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 / 8) * i;
    particles.push({
      x, y,
      vx: Math.cos(angle) * 3,
      vy: Math.sin(angle) * 3 - 0.5,
      r: 3, alpha: 1, color: '#F5B700',
      isCoin: true, gravity: 0.09,
    });
  }
  spawnRipple(x, y, '#34D399');
}

/* ── Main RAF loop ── */
function animateParticles() {
  if (!pCtx) return;
  pCtx.clearRect(0, 0, pCvs.width, pCvs.height);

  const w = pCvs.width, h = pCvs.height;

  // Background
  for (let i = 0; i < bgParticles.length; i++) {
    const p = bgParticles[i];
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
    if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
    pCtx.globalAlpha = p.alpha;
    pCtx.fillStyle = p.color;
    pCtx.beginPath();
    pCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    pCtx.fill();
  }

  // Tap / collect particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    if (p.type === 'ripple') {
      p.r += p.vr;
      p.alpha -= 0.038;
      if (p.alpha <= 0) { particles.splice(i, 1); continue; }
      pCtx.globalAlpha = p.alpha;
      pCtx.strokeStyle = p.color;
      pCtx.lineWidth = 1.8;
      pCtx.beginPath();
      pCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      pCtx.stroke();
    } else {
      p.x += p.vx; p.y += p.vy; p.vy += p.gravity;
      p.alpha -= 0.025;
      if (p.alpha <= 0) { particles.splice(i, 1); continue; }
      pCtx.globalAlpha = p.alpha;
      if (p.isCoin) {
        pCtx.font = `${Math.floor(p.r * 2)}px serif`;
        pCtx.fillText('💰', p.x - p.r, p.y + p.r);
      } else {
        pCtx.fillStyle = p.color;
        pCtx.beginPath();
        pCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        pCtx.fill();
      }
    }
  }

  pCtx.globalAlpha = 1;
  _raf = requestAnimationFrame(animateParticles);
}

/* Pause when tab hidden */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cancelAnimationFrame(_raf);
  } else {
    animateParticles();
  }
});
