/* ═══════════════════════════════════════════════════════════
   TAP EMPIRE — Tap Engine v2 (fixed)
   Fixes applied:
   • touchstart+click double-fire: use _touchHandled flag
   • coins per tap: base = tapPower * coinsPerTap (both correct)
   • energy-empty feedback: inline shake only, NO toast popup
   • _rafPending guard: captures coords before RAF to avoid stale values
═══════════════════════════════════════════════════════════ */

'use strict';

let _batchTimer = null;
let _batchTaps = 0;
let _batchCoins = 0;
let _batchXp = 0;
let _perfectTimer = null;
let _lastTapTime = 0;
let _rafPending = false;

/* ── Prevent touchstart + click double-fire ── */
let _touchHandled = false;
let _touchHandledTimer = null;

/* ─────────────────────────────────────────────────────────
   PERFECT TAP SYSTEM
───────────────────────────────────────────────────────── */
function startPerfectTapSystem() {
  function scheduleNext() {
    const delay = 9000 + Math.random() * 10000;
    _perfectTimer = setTimeout(() => {
      if (!STATE.initialized) { scheduleNext(); return; }
      STATE.perfectTapActive = true;
      STATE.perfectTapTs = Date.now();

      const ring = document.getElementById('perfect-ring');
      if (ring) {
        ring.style.animation = 'none';
        void ring.offsetWidth;
        ring.style.opacity = '1';
        ring.style.animation = 'perfectPulse 0.8s ease forwards';
      }
      setTimeout(() => {
        STATE.perfectTapActive = false;
        const r = document.getElementById('perfect-ring');
        if (r) r.style.opacity = '0';
      }, STATE.economy.perfectTapWindowMs || 800);

      scheduleNext();
    }, delay);
  }
  scheduleNext();
}

/* ─────────────────────────────────────────────────────────
   MAIN TAP HANDLER
───────────────────────────────────────────────────────── */
function handleTap(e) {
  /* ── Prevent touchstart + click double-fire ──────────────
     On mobile, touchstart fires first. We mark _touchHandled
     so the subsequent click event (fired ~300ms later) is
     dropped. On desktop only click fires, so _touchHandled
     is always false and clicks work normally.
  ──────────────────────────────────────────────────────── */
  if (e.type === 'touchstart') {
    _touchHandled = true;
    clearTimeout(_touchHandledTimer);
    _touchHandledTimer = setTimeout(() => { _touchHandled = false; }, 500);
  } else if (e.type === 'click') {
    if (_touchHandled) return; // drop — already handled by touchstart
  }

  e.preventDefault();

  if (STATE.riskStatus === 'suspended') {
    showToast('🚨 Account under review');
    return;
  }

  const now = Date.now();

  /* ── Client-side rate limiting (Combo expands allowed taps/sec limit) ── */
  STATE.tapTimestamps = STATE.tapTimestamps.filter(t => now - t < 1000);
  STATE.tapTimestamps.push(now);
  const comboLimitBonus = typeof getComboTapLimitBonus === 'function' ? getComboTapLimitBonus() : 0;
  const effectiveTapRateLimit = (STATE.economy.tapRateLimit || 20) + comboLimitBonus;

  if (STATE.tapTimestamps.length > effectiveTapRateLimit) {
    STATE.riskScore = Math.min(100, STATE.riskScore + 3);
    if (STATE.riskScore >= 30 && STATE.riskStatus === 'ok') {
      STATE.riskStatus = 'watch';
      STATE.lastSuspiciousEvent = 'tap_rate_abuse';
      persistUser({ riskScore: Math.floor(STATE.riskScore), riskStatus: STATE.riskStatus, lastSuspiciousEvent: STATE.lastSuspiciousEvent }, true);
    }
    return;
  }
  if (STATE.riskScore > 0) STATE.riskScore = Math.max(0, STATE.riskScore - 0.05);

  /* ── Energy check — inline feedback only, NO toast ── */
  if (!consumeEnergy(1)) {
    SFX.error();
    haptic('error');
    _shakeEnergyBar();   // visual shake + small inline label — no toast popup
    return;
  }

  /* ── Calculate reward ── */
  const isCritical = Math.random() < (STATE.criticalChance || 0.05);
  const isPerfect = STATE.perfectTapActive &&
    (now - STATE.perfectTapTs) < (STATE.economy.perfectTapWindowMs || 800);

  if (isPerfect) {
    STATE.perfectTapActive = false;
    const ring = document.getElementById('perfect-ring');
    if (ring) ring.style.opacity = '0';
  }

  const comboMult = getComboMultiplier();
  const boostMult = (STATE.boostExpiry > now) ? STATE.boostMultiplier : 1;
  const critMult = isCritical ? (STATE.economy.criticalMultiplier || 10) : 1;
  const perfMult = isPerfect ? (STATE.economy.perfectTapMultiplier || 3) : 1;

  /* base coins = tapPower × coinsPerTap
     tapPower   : upgraded value (default 1, increases with upgrades)
     coinsPerTap: economy multiplier (default 10)
  */
  const base = STATE.tapPower * (STATE.economy.coinsPerTap || 10);
  const earned = Math.ceil(base * comboMult * boostMult * critMult * perfMult);
  const xpEarned = Math.ceil((STATE.economy.xpPerTap || 1) * comboMult);
  const tapType = isPerfect ? 'perfect' : isCritical ? 'critical' : 'normal';

  /* ── Optimistic UI update ── */
  STATE.coins += earned;
  STATE.totalTaps += 1;
  STATE.sessionTaps += 1;
  STATE.tapStreak += 1;
  STATE.xp += xpEarned;

  _batchTaps += 1;
  _batchCoins += earned;
  _batchXp += xpEarned;

  /* ── Capture touch coords BEFORE RAF ── */
  const touchX = e.touches ? e.touches[0].clientX : e.clientX;
  const touchY = e.touches ? e.touches[0].clientY : e.clientY;

  /* ── One RAF per display frame ── */
  if (!_rafPending) {
    _rafPending = true;
    requestAnimationFrame(() => {
      _rafPending = false;
      _doTapVisuals(touchX, touchY, earned, tapType, isPerfect, isCritical);
    });
  }

  incrementCombo();
  checkLevelUp();
  updateMissionProgress('tap', 1);

  if (isPerfect) { SFX.perfect(); haptic('heavy'); }
  else if (isCritical) { SFX.critical(); haptic('heavy'); }
  else { SFX.tap(); haptic('light'); }

  _scheduleBatchFlush();
  _lastTapTime = now;
}

/* ── All visual work inside RAF ── */
function _doTapVisuals(cx, cy, earned, tapType, isPerfect, isCritical) {
  const core = document.getElementById('core-body');
  if (core) {
    core.classList.remove('anim-tap-press');
    void core.offsetWidth;
    core.classList.add('anim-tap-press');
  }

  _spawnFloatText(cx, cy, earned, tapType);
  _spawnRippleDom(cx, cy, tapType);

  if (core) {
    const r = core.getBoundingClientRect();
    spawnTapParticles(r.left + r.width / 2, r.top + r.height / 2, tapType);
  }

  updateCoinUI();
  updateXpUI();
  updateEnergyUI();

  const app = document.getElementById('app');
  if (app) {
    app.classList.remove('anim-tap-shake', 'anim-micro-feedback');
    void app.offsetWidth;
    if (isCritical || isPerfect) {
      app.classList.add('anim-tap-shake');
    } else {
      app.classList.add('anim-micro-feedback');
    }
  }
}

/* ── Floating +coins text ── */
function _spawnFloatText(cx, cy, amount, tapType) {
  const container = document.getElementById('tap-area');
  if (!container) return;
  const rect = container.getBoundingClientRect();
  const x = cx - rect.left + (Math.random() - 0.5) * 28;
  const y = cy - rect.top - 8;

  const el = document.createElement('div');
  el.className = 'float-text' +
    (tapType === 'perfect' ? ' float-perfect' :
      tapType === 'critical' ? ' float-critical' : '');
  el.style.cssText = `left:${x}px;top:${y}px;font-size:${tapType === 'normal' ? 17 : 22}px`;
  el.textContent =
    tapType === 'perfect' ? `✨ PERFECT! +${fmt(amount)}` :
      tapType === 'critical' ? `💥 CRIT! +${fmt(amount)}` :
        `+${fmt(amount)}`;
  container.appendChild(el);
  el.addEventListener('animationend', () => el.remove(), { once: true });
}

/* ── DOM ripple ── */
function _spawnRippleDom(cx, cy, tapType) {
  const size = 80;
  const el = document.createElement('div');
  el.className = 'tap-ripple' +
    (tapType === 'perfect' ? ' perfect' :
      tapType === 'critical' ? ' critical' : '');
  el.style.cssText =
    `width:${size}px;height:${size}px;` +
    `left:${cx - size / 2}px;top:${cy - size / 2}px;position:fixed;`;
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove(), { once: true });
}

/* ── Energy bar shake (NO toast — avoids popup on every tap) ── */
function _shakeEnergyBar() {
  const sec = document.querySelector('.energy-section');
  if (!sec) return;
  sec.classList.remove('anim-tap-shake');
  void sec.offsetWidth;
  sec.classList.add('anim-tap-shake');
  setTimeout(() => sec.classList.remove('anim-tap-shake'), 220);

  /* Show inline "No energy" label for 1.5s — NOT a modal/toast */
  const lbl = document.getElementById('energy-empty-hint');
  if (lbl) {
    lbl.textContent = '⚡ No energy — regenerating…';
    lbl.style.opacity = '1';
    clearTimeout(lbl._t);
    lbl._t = setTimeout(() => { lbl.style.opacity = '0'; }, 1500);
  }
}

/* ─────────────────────────────────────────────────────────
   TAP BATCH FLUSH  (zero per-tap Firestore writes)
───────────────────────────────────────────────────────── */
function _scheduleBatchFlush() {
  if (_batchTaps >= TAP_BATCH_MAX_TAPS) {
    clearTimeout(_batchTimer);
    _flushTapBatch();
    return;
  }
  clearTimeout(_batchTimer);
  _batchTimer = setTimeout(_flushTapBatch, TAP_BATCH_INTERVAL);
}

async function _flushTapBatch() {
  if (_batchTaps === 0) return;
  _batchTaps = 0; _batchCoins = 0; _batchXp = 0;

  persistUser({
    coins: STATE.coins,
    energy: STATE.energy,
    totalTaps: STATE.totalTaps,
    level: STATE.level,
    xp: STATE.xp,
    maxEnergy: STATE.maxEnergy,
    lastEnergyUpdate: STATE.lastEnergyUpdate,
    riskScore: Math.floor(STATE.riskScore),
    riskStatus: STATE.riskStatus,
    bestCombo: STATE.bestCombo,
    lastActiveTs: Date.now(),
  });

  if (Math.random() < LEADERBOARD_UPDATE_PROB) updateLeaderboard();
}

/* ── Level up ── */
function checkLevelUp() {
  const needed = xpForLevel(STATE.level);
  if (STATE.xp < needed) return;
  STATE.level++;
  STATE.xp -= needed;
  STATE.maxEnergy = (STATE.economy.energyMax || 500) + STATE.level * 10;
  updateLevelUI();
  updateMissionProgress('level', STATE.level);
  checkAchievements();
  SFX.levelUp();
  requestAnimationFrame(() => { haptic('heavy'); showLevelUpModal(); });
}

/* ── Attach events — removes old listeners first to prevent doubles ── */
function attachTapEvents() {
  const core = document.getElementById('core-body');
  if (!core) return;
  core.removeEventListener('touchstart', handleTap);
  core.removeEventListener('click', handleTap);
  core.addEventListener('touchstart', handleTap, { passive: false });
  core.addEventListener('click', handleTap, { passive: false });
}

/* ── Flush on page hide ── */
document.addEventListener('visibilitychange', () => {
  if (document.hidden && _batchTaps > 0) _flushTapBatch();
});
