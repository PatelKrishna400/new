/* ═══════════════════════════════════
   TAP EMPIRE — Boost Center (Redesigned Shop)
   • Header: ⚡ BOOST CENTER
   • Active Boost card with smooth 10:00 local countdown timer
   • Hero Card (🔥 TAP POWER) with animated lightning icon ⚡
   • 5 Boost Cards (Free vs Premium hierarchy)
   • Sequential slide-in animations
═══════════════════════════════════ */

'use strict';

let _boostTimerInterval = null;

function renderBoostScreen() {
  const el = document.getElementById('screen-boost');
  if (!el) return;

  const now = Date.now();
  const boostActive = STATE.boostExpiry > now;
  const msLeft = Math.max(0, STATE.boostExpiry - now);
  const minsLeft = Math.floor(msLeft / 60000);
  const secsLeft = Math.floor((msLeft % 60000) / 1000);
  const timerStr = `${String(minsLeft).padStart(2, '0')}:${String(secsLeft).padStart(2, '0')}`;
  const totalBoostMs = 10 * 60 * 1000;
  const boostPct = Math.min(100, Math.max(0, (msLeft / totalBoostMs) * 100)).toFixed(1);

  /* Tap Power calculations for Hero Card */
  const tapPowerUpg = UPGRADES_DEF.find(u => u.id === 'tapPower') || { baseCost: 500, costMult: 1.8, perLevel: 1 };
  const tapPowerLvl = getUpgradeLevel('tapPower');
  const tapPowerCost = upgradeCost(tapPowerUpg);
  const currentCoinsPerTap = (STATE.tapPower || 1) * (STATE.economy?.coinsPerTap || 10);
  const nextCoinsPerTap = ((STATE.tapPower || 1) + tapPowerUpg.perLevel) * (STATE.economy?.coinsPerTap || 10);
  const canBuyTapPower = STATE.coins >= tapPowerCost;

  el.innerHTML = `
    <div class="screen-scroll boost-page-container">
      
      <!-- ── HEADER ── -->
      <div class="boost-header">
        <div class="boost-title">⚡ BOOST CENTER</div>
        <div class="boost-subtitle">Power up your tapping.</div>
      </div>

      <!-- ── ACTIVE BOOST CARD (IF ACTIVE) ── -->
      ${boostActive ? `
        <div class="active-boost-card">
          <div class="active-boost-header">
            <div class="active-boost-title">🔥 2× TAP POWER</div>
            <div class="active-boost-timer" id="active-boost-timer-txt">${timerStr} remaining</div>
          </div>
          <div class="active-boost-track">
            <div class="active-boost-fill" id="active-boost-fill" style="width:${boostPct}%"></div>
          </div>
        </div>` : ''}

      <!-- ── MAIN HERO CARD (TAP POWER) ── -->
      <div class="hero-boost-card">
        <div class="hero-lightning-wrap">
          <div class="hero-lightning-glow"></div>
          <div class="hero-lightning-icon">⚡</div>
        </div>

        <div class="hero-card-title">🔥 TAP POWER</div>

        <div class="hero-stats-row">
          <div class="hero-stat-col">
            <div class="hero-stat-lbl">Current</div>
            <div class="hero-stat-val">+${fmt(currentCoinsPerTap)} / TAP</div>
          </div>
          <div class="hero-stat-arrow">➔</div>
          <div class="hero-stat-col">
            <div class="hero-stat-lbl">Next</div>
            <div class="hero-stat-val highlight">+${fmt(nextCoinsPerTap)} / TAP</div>
          </div>
        </div>

        <div class="hero-progress-wrap">
          <div class="hero-progress-label">Level ${tapPowerLvl} Progress</div>
          <div class="hero-progress-track">
            <div class="hero-progress-fill" style="width:${Math.min(100, (tapPowerLvl / 20) * 100)}%"></div>
          </div>
        </div>

        <button class="btn btn-gold hero-upgrade-btn ${canBuyTapPower ? '' : 'disabled'}"
                onclick="buyUpgrade('tapPower');renderBoostScreen()" ${canBuyTapPower ? '' : 'disabled'}>
          UPGRADE · 💰 ${fmt(tapPowerCost)}
        </button>
      </div>

      <!-- ── 5 SPECIFIED BOOST CARDS ── -->
      <div class="boost-cards-list">

        <!-- 1. 2x Tap Power -->
        <div class="boost-card ${boostActive ? 'active-border' : ''}">
          <div class="boost-card-icon">🔥</div>
          <div class="boost-card-info">
            <div class="boost-card-name">2× TAP POWER</div>
            <div class="boost-card-sub">10 minutes duration</div>
          </div>
          <button class="boost-card-btn btn-gold" onclick="activateBoostAction('tap2x')">
            ${boostActive ? 'EXTEND' : 'ACTIVATE'}
          </button>
        </div>

        <!-- 2. Energy Refill -->
        <div class="boost-card">
          <div class="boost-card-icon">⚡</div>
          <div class="boost-card-info">
            <div class="boost-card-name">ENERGY REFILL</div>
            <div class="boost-card-sub">+100 Energy pool</div>
          </div>
          <button class="boost-card-btn btn-gold" onclick="activateBoostAction('energy')">
            ACTIVATE
          </button>
        </div>

        <!-- 3. Lucky Boost -->
        <div class="boost-card">
          <div class="boost-card-icon">🍀</div>
          <div class="boost-card-info">
            <div class="boost-card-name">LUCKY BOOST</div>
            <div class="boost-card-sub">Higher bonus chance</div>
          </div>
          <button class="boost-card-btn btn-gold" onclick="activateBoostAction('lucky')">
            ACTIVATE
          </button>
        </div>

        <!-- 4. Chest Boost -->
        <div class="boost-card">
          <div class="boost-card-icon">🎁</div>
          <div class="boost-card-info">
            <div class="boost-card-name">CHEST BOOST</div>
            <div class="boost-card-sub">2× Chest reward</div>
          </div>
          <button class="boost-card-btn btn-gold" onclick="activateBoostAction('chest')">
            ACTIVATE
          </button>
        </div>

        <!-- 5. Premium Boost (Distinct Shop Hierarchy) -->
        <div class="boost-card premium-card">
          <div class="boost-card-icon">💎</div>
          <div class="boost-card-info">
            <div class="boost-card-name">PREMIUM BOOST</div>
            <div class="boost-card-sub">⭐ 50 Telegram Stars</div>
          </div>
          <button class="boost-card-btn btn-stars" onclick="activateBoostAction('premium')">
            BUY ⭐
          </button>
        </div>

      </div>

    </div>`;

  if (boostActive) {
    _startBoostLocalTimer();
  } else if (_boostTimerInterval) {
    clearInterval(_boostTimerInterval);
    _boostTimerInterval = null;
  }
}

function _startBoostLocalTimer() {
  if (_boostTimerInterval) clearInterval(_boostTimerInterval);
  _boostTimerInterval = setInterval(() => {
    const elTxt = document.getElementById('active-boost-timer-txt');
    const elFill = document.getElementById('active-boost-fill');
    if (!elTxt && !elFill) {
      clearInterval(_boostTimerInterval);
      _boostTimerInterval = null;
      return;
    }
    const msLeft = Math.max(0, STATE.boostExpiry - Date.now());
    if (msLeft <= 0) {
      clearInterval(_boostTimerInterval);
      _boostTimerInterval = null;
      if (typeof renderBoostScreen === 'function') renderBoostScreen();
      return;
    }
    const mins = Math.floor(msLeft / 60000);
    const secs = Math.floor((msLeft % 60000) / 1000);
    const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    if (elTxt) elTxt.textContent = `${timeFormatted} remaining`;
    if (elFill) {
      const totalMs = 10 * 60 * 1000;
      const pct = Math.min(100, Math.max(0, (msLeft / totalMs) * 100));
      elFill.style.width = pct.toFixed(1) + '%';
    }
  }, 1000);
}

