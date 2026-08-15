/* ═══════════════════════════════════
   TAP EMPIRE — Home Screen (v3)
   Visual centre: animated TAP CORE
   • XP strip (level + progress)
   • Combo badge + RAF timer
   • Three quick-action cards
   • Featured Daily Bonus card
   • Energy bar with inline warning
   • Collection reward cards
═══════════════════════════════════ */

'use strict';

function renderHomeScreen() {
  const el = document.getElementById('screen-home');
  if (!el) return;

  const xpNeeded = xpForLevel(STATE.level);
  const xpPct = Math.min(100, (STATE.xp / xpNeeded) * 100).toFixed(1);
  const engPct = Math.min(100, Math.max(0, (STATE.energy / STATE.maxEnergy) * 100)).toFixed(1);

  const boostActive = STATE.boostExpiry > Date.now();
  const boostMinsLeft = boostActive ? Math.ceil((STATE.boostExpiry - Date.now()) / 60000) : 0;
  const coinsPerTap = (STATE.tapPower || 1) * (STATE.economy?.coinsPerTap || 10);

  /* Daily reward state for featured card */
  const ds = typeof getDailyState === 'function' ? getDailyState() : {};
  const canClaim = typeof canClaimDaily === 'function' ? canClaimDaily() : false;
  const nextIdx = ((ds.dayIndex !== undefined ? ds.dayIndex : -1) + 1) %
    (typeof DAILY_REWARDS !== 'undefined' ? DAILY_REWARDS.length : 7);
  const dailyReward = (typeof DAILY_REWARDS !== 'undefined' && DAILY_REWARDS[nextIdx])
    ? DAILY_REWARDS[nextIdx] : { amount: 500, icon: '💰' };
  const canWatchAd = typeof canShowAd === 'function' ? canShowAd() : false;

  /* Time until next daily */
  const msLeft = Math.max(0, 86400000 - (Date.now() - (ds.lastClaim || 0)));
  const hLeft = Math.floor(msLeft / 3600000);
  const mLeft = Math.floor((msLeft % 3600000) / 60000);
  const nextStr = canClaim ? '' : `Next in ${hLeft}h ${mLeft}m`;

  el.innerHTML = `
    <div class="home-container">

      <!-- ── XP / Level strip ── -->
      <div class="xp-strip">
        <span class="xp-label" id="xp-label">LVL ${STATE.level}</span>
        <div class="xp-bar-track">
          <div class="xp-bar-fill" id="xp-fill" style="width:${xpPct}%"></div>
        </div>
        <span class="xp-text" id="xp-text">${fmt(STATE.xp)} / ${fmt(xpNeeded)}</span>
      </div>

      <!-- ── Combo area ── -->
      <div class="combo-area" id="combo-area"></div>

      <!-- ── Tap core ── -->
      <div class="tap-core-section">
        <div class="ambient-glow"></div>

        <div class="tap-area" id="tap-area">
          <div class="ambient-orbit-particles">
            <span class="orbit-p p-1">✨</span>
            <span class="orbit-p p-2">💰</span>
            <span class="orbit-p p-3">⚡</span>
            <span class="orbit-p p-4">⭐</span>
            <span class="orbit-p p-5">🔥</span>
          </div>

          <div class="core-wrapper" id="core-wrapper">
            <div class="core-glow"></div>
            <div class="core-ring-outer"></div>
            <div class="core-ring-inner"></div>

            <div class="core-body" id="core-body">
              <div class="core-top-icon">🔥</div>
              <div class="core-title">TAP CORE</div>
              <div class="core-tap-power-badge">+${fmt(coinsPerTap)} COINS/TAP</div>
            </div>

            <div class="perfect-ring" id="perfect-ring"></div>
          </div>
        </div>

        ${boostActive ? `
          <div class="boost-active-pill">
            🚀 ${STATE.boostMultiplier}× BOOST ACTIVE · ${boostMinsLeft}m
          </div>` : ''}
      </div>

      <!-- ── Three quick-action cards ── -->
      <div class="action-cards-grid">
        <button class="action-card" onclick="switchScreen('boost')" aria-label="Boost">
          <div class="action-card-icon">⚡</div>
          <div class="action-card-title">BOOST</div>
          <div class="action-card-sub">Power Up</div>
        </button>
        <button class="action-card" onclick="switchScreen('tasks')" aria-label="Collect">
          <div class="action-card-icon">🎁</div>
          <div class="action-card-title">COLLECT</div>
          <div class="action-card-sub">Free Items</div>
        </button>
        <button class="action-card" onclick="switchScreen('tasks')" aria-label="Tasks">
          <div class="action-card-icon">🎯</div>
          <div class="action-card-title">TASKS</div>
          <div class="action-card-sub">Earn More</div>
        </button>
      </div>

      <!-- ── Featured Daily Bonus card ── -->
      <div class="featured-card">
        <div class="featured-card-header">
          <div class="featured-badge">${canClaim ? '✨ READY' : 'DAILY BONUS'}</div>
          <div class="featured-title">🎁 DAILY BONUS</div>
        </div>
        <div class="featured-card-body">
          <div>
            <div class="featured-reward-val">${dailyReward.icon} +${fmt(dailyReward.amount)}</div>
            ${!canClaim && nextStr ? `<div style="font-size:10px;color:var(--muted);margin-top:2px">${nextStr}</div>` : ''}
          </div>
          <div class="featured-card-actions">
            <button class="btn btn-gold featured-collect-btn"
              ${canClaim ? '' : 'disabled'}
              onclick="handleHomeDailyCollect(false)">
              ${canClaim ? '🎁 Collect' : '✅ Claimed'}
            </button>
            ${canClaim && canWatchAd ? `
              <button class="btn btn-outline featured-bonus-btn"
                onclick="handleHomeDailyCollect(true)">
                ✨ 2× Bonus
              </button>` : ''}
          </div>
        </div>
      </div>

      <!-- ── Energy bar ── -->
      <div class="energy-section">
        <div class="energy-row">
          <span class="energy-label">⚡ Energy</span>
          <span class="energy-val" id="energy-text">${Math.floor(STATE.energy)} / ${STATE.maxEnergy}</span>
        </div>
        <div class="energy-track" id="energy-track">
          <div class="energy-fill" id="energy-fill" style="width:${engPct}%"></div>
        </div>
        <!-- Inline hint — shown by tap.js _shakeEnergyBar(), never a toast popup -->
        <div id="energy-empty-hint"></div>
      </div>

      <!-- ── Collection reward cards ── -->
      <div class="collection-strip" id="collection-strip"></div>

    </div>`;

  attachTapEvents();
  renderCollectionCards(document.getElementById('collection-strip'));
  updateXpUI();
  updateEnergyUI();
  updateComboUI();
}

/* Called by the featured daily bonus card buttons */
function handleHomeDailyCollect(with2x) {
  if (with2x && typeof doCollect === 'function') {
    doCollect('daily');
  } else if (typeof claimDailyReward === 'function') {
    claimDailyReward().then(() => {
      renderHomeScreen();
      updateStreakBadge();
    });
  }
}
