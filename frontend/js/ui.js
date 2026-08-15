/* ═══════════════════════════════════════════════════════════
   TAP EMPIRE — UI Helpers v2 (updated)
   Syncs ALL visible displays: resource bar, top bar,
   XP strip, energy section, combo area, level badge.
═══════════════════════════════════════════════════════════ */

'use strict';

/* ═══════════════════════
   TOAST
═══════════════════════ */
let _toastTimer;
function showToast(msg, type = 'default', ms = 2600) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = '';
  if (type === 'error') el.classList.add('toast-error');
  if (type === 'success') el.classList.add('toast-success');
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

/* ═══════════════════════
   MODAL
═══════════════════════ */
function showModal(html, onClose) {
  const ov = document.getElementById('modal-overlay');
  const bx = document.getElementById('modal-box');
  if (!ov || !bx) return;
  bx.innerHTML = `<div class="modal-handle"></div>` + html;
  ov.style.display = 'flex';
  ov._onClose = onClose || null;
  ov.onclick = e => { if (e.target === ov) closeModal(); };
}

function closeModal() {
  const ov = document.getElementById('modal-overlay');
  if (!ov) return;
  ov.style.display = 'none';
  if (typeof ov._onClose === 'function') { ov._onClose(); ov._onClose = null; }
}

/* ═══════════════════════
   COIN COUNTER
   Updates both resource bar (#top-coins) and
   wallet screen if visible.
═══════════════════════ */
function updateCoinUI() {
  /* Resource bar */
  const rb = document.getElementById('top-coins');
  if (rb) {
    rb.textContent = fmt(STATE.coins);
    rb.classList.remove('anim-count-bump');
    void rb.offsetWidth;
    rb.classList.add('anim-count-bump');
  }
  /* Wallet screen (only if rendered) */
  const wallet = document.getElementById('wallet-coin-display');
  if (wallet) wallet.textContent = '💰 ' + fmt(STATE.coins);
}

/* ═══════════════════════
   ENERGY BAR
   Updates both the energy section on home
   and the resource bar display.
═══════════════════════ */
function updateEnergyUI() {
  const cur = Math.floor(STATE.energy);
  const max = STATE.maxEnergy;
  const pct = Math.min(100, (cur / max) * 100).toFixed(1);

  /* Home screen energy bar */
  const fill = document.getElementById('energy-fill');
  const txt = document.getElementById('energy-text');
  if (fill) {
    fill.style.width = pct + '%';
    fill.classList.remove('low', 'medium');
    if (pct < 20) fill.classList.add('low');
    else if (pct < 50) fill.classList.add('medium');
  }
  if (txt) txt.textContent = `${cur} / ${max}`;

  /* Energy track warning glow */
  const track = document.getElementById('energy-track');
  if (track) track.classList.toggle('low-warning', pct < 15);

  /* Resource bar */
  const rbEnergy = document.getElementById('top-energy');
  if (rbEnergy) rbEnergy.textContent = cur + '/' + max;
}

/* ═══════════════════════
   LEVEL & XP
═══════════════════════ */
function updateLevelUI() {
  /* Top bar level badge */
  const numEl = document.getElementById('user-level-num');
  const badgeEl = document.getElementById('user-level-badge');
  if (numEl) numEl.textContent = STATE.level;
  if (badgeEl) badgeEl.textContent = 'LV. ' + STATE.level;
  updateXpUI();
}

function updateXpUI() {
  const needed = xpForLevel(STATE.level);
  const pct = Math.min(100, (STATE.xp / needed) * 100).toFixed(1);

  const fill = document.getElementById('xp-fill');
  const txt = document.getElementById('xp-text');
  const lbl = document.getElementById('xp-label');

  if (fill) fill.style.width = pct + '%';
  if (txt) txt.textContent = `${fmt(STATE.xp)} / ${fmt(needed)}`;
  if (lbl) lbl.textContent = 'LVL ' + STATE.level;
}

/* ═══════════════════════
   TOP BAR
═══════════════════════ */
function updateTopBar() {
  const nameEl = document.getElementById('user-name');
  const avatarEl = document.getElementById('user-avatar');

  if (nameEl) nameEl.textContent = esc(STATE.tgUser?.first_name || 'Player');

  if (avatarEl) {
    if (STATE.tgUser?.photo_url) {
      avatarEl.innerHTML = `<img src="${esc(STATE.tgUser.photo_url)}" alt="avatar" loading="lazy"/>`;
    } else {
      avatarEl.textContent = (STATE.tgUser?.first_name || 'P')[0].toUpperCase();
    }
  }

  updateLevelUI();
  updateStreakBadge();
}

/* ── Streak badge in top bar ── */
function updateStreakBadge() {
  const streakEl = document.getElementById('top-streak-num');
  const badgeWrap = document.getElementById('top-streak-badge');
  if (!streakEl) return;
  try {
    const ds = typeof getDailyState === 'function' ? getDailyState() : {};
    const streak = ds.streak || 0;
    streakEl.textContent = streak;
    if (badgeWrap) badgeWrap.style.display = streak > 0 ? 'inline-flex' : 'none';
  } catch (_) {
    if (badgeWrap) badgeWrap.style.display = 'none';
  }
}

/* ═══════════════════════
   SETTINGS MODAL
   Referenced by ⚙️ button in index.html
═══════════════════════ */
function openSettingsModal() {
  const soundOn = typeof soundEnabled !== 'undefined' ? soundEnabled : true;
  showModal(`
    <div style="padding:4px 0 8px">
      <div style="font-size:18px;font-weight:900;margin-bottom:16px;text-align:center">⚙️ Settings</div>

      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-label">🔊 Sound Effects</div>
          <div class="setting-desc">Tap, combo and reward sounds</div>
        </div>
        <button class="toggle-btn ${soundOn ? 'on' : ''}" id="modal-sound-toggle"
          onclick="_toggleSoundInModal()">
          ${soundOn ? 'ON' : 'OFF'}
        </button>
      </div>

      <div class="setting-row" style="border-bottom:none">
        <div class="setting-info">
          <div class="setting-label">🎮 Graphics</div>
          <div class="setting-desc">Current: ${(STATE.perfMode || 'med').toUpperCase()}</div>
        </div>
        <div class="perf-row" style="min-width:150px">
          ${['low', 'med', 'high'].map(m => `
            <button class="perf-btn ${(STATE.perfMode || 'med') === m ? 'active' : ''}"
              onclick="_setQuality('${m}')">
              ${m === 'low' ? 'Low' : m === 'med' ? 'Med' : 'High'}
            </button>`).join('')}
        </div>
      </div>

      <button class="btn btn-muted" style="margin-top:16px" onclick="closeModal()">Close</button>
    </div>`);
}

function _toggleSoundInModal() {
  if (typeof toggleSound === 'function') toggleSound();
  openSettingsModal(); /* re-render */
}

function _setQuality(mode) {
  STATE.perfMode = mode;
  if (typeof applyPerfMode === 'function') applyPerfMode(mode);
  if (typeof onPerfModeChanged === 'function') onPerfModeChanged(mode);
  openSettingsModal();
}

/* ═══════════════════════
   LEVEL-UP MODAL
═══════════════════════ */
function showLevelUpModal() {
  haptic('heavy');
  showModal(`
    <div style="text-align:center;padding:10px 0">
      <div style="font-size:56px;margin-bottom:6px;animation:levelUpBurst 0.4s cubic-bezier(0.34,1.1,0.64,1)">⬆️</div>
      <div style="font-size:12px;color:var(--gold);font-weight:700;letter-spacing:2.5px;margin-bottom:4px">LEVEL UP!</div>
      <div style="font-size:40px;font-weight:900;margin-bottom:6px">Level ${STATE.level}</div>
      <div style="font-size:13px;color:var(--muted);line-height:1.7;margin-bottom:20px">
        Max Energy +${10 * STATE.level} &nbsp;·&nbsp; New rewards unlocked
      </div>
      <button class="btn btn-gold" onclick="closeModal()">Continue ▶</button>
    </div>`);
}

/* ═══════════════════════
   ACHIEVEMENT TOAST
═══════════════════════ */
function showAchievementModal(ach) {
  haptic('success');
  showToast(`🏆 ${ach.name} unlocked! +${fmt(ach.reward)} coins`, 'success', 3200);
}

/* ═══════════════════════
   SKELETON LOADERS
═══════════════════════ */
function skeletonRankList(count = 6) {
  return Array.from({ length: count }, () => `
    <div class="skeleton-row">
      <div class="skeleton skeleton-badge" style="width:26px"></div>
      <div class="skeleton skeleton-avatar"></div>
      <div class="skeleton-text">
        <div class="skeleton skeleton-line med"></div>
        <div class="skeleton skeleton-line short" style="margin-top:5px"></div>
      </div>
      <div class="skeleton skeleton-badge"></div>
    </div>`).join('');
}

function skeletonCards(count = 3) {
  return Array.from({ length: count }, () =>
    `<div class="skeleton" style="height:74px;margin-bottom:8px;border-radius:16px"></div>`
  ).join('');
}

/* ═══════════════════════
   NETWORK ERROR
═══════════════════════ */
function showNetworkError(containerId, onRetry) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `
    <div style="text-align:center;padding:40px 20px">
      <div style="font-size:40px;margin-bottom:12px">📡</div>
      <div style="font-size:15px;font-weight:700;margin-bottom:6px">Connection issue</div>
      <div style="font-size:13px;color:var(--muted);margin-bottom:20px">Something went wrong. Please try again.</div>
      <button class="btn btn-outline btn-sm" onclick="(${onRetry.toString()})()">Retry</button>
    </div>`;
}
