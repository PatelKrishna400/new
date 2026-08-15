/* ═══════════════════════════════════
   TAP EMPIRE — Home Dashboard (Section 39 Layout)
   • 👑 TAP EMPIRE Header
   • TAP CORE Central Interactive Button
   • 🎁 BONUS COLLECTION (Claim available bonuses)
   • 🎡 WHEEL MASTER (3 Spins available)
   • 🎁 MYSTERY CHEST (3 Visible Chests, select 1 -> Watch Ad -> Open)
   • 🔥 CURRENT BOOST (2x Eligible Reward)
   • 🎯 TODAY'S TASKS Summary (View Tasks)
   • 🏆 WEEKLY PROGRESS
═══════════════════════════════════ */

'use strict';

let _selectedChestIdx = null;

function renderHomeScreen() {
  const el = document.getElementById('screen-home');
  if (!el) return;

  const xpNeeded = xpForLevel(STATE.level);
  const xpPct = Math.min(100, (STATE.xp / xpNeeded) * 100).toFixed(1);
  const engPct = Math.min(100, Math.max(0, (STATE.energy / STATE.maxEnergy) * 100)).toFixed(1);

  const boostActive = STATE.boostExpiry > Date.now();
  const msLeft = Math.max(0, STATE.boostExpiry - Date.now());
  const boostMinsLeft = Math.floor(msLeft / 60000);
  const boostSecsLeft = Math.floor((msLeft % 60000) / 1000);
  const boostTimeStr = `${String(boostMinsLeft).padStart(2, '0')}:${String(boostSecsLeft).padStart(2, '0')}`;
  const coinsPerTap = (STATE.tapPower || 1) * (STATE.economy?.coinsPerTap || 10);

  const canClaimDaily = typeof canClaimDaily === 'function' ? canClaimDaily() : false;
  const spinsLeft = (typeof getSpinCooldownRemaining === 'function' && getSpinCooldownRemaining() <= 0) ? 1 : 0;

  el.innerHTML = `
    <div class="home-container">

      <!-- ── XP / LEVEL STRIP ── -->
      <div class="xp-strip">
        <span class="xp-label" id="xp-label">LVL ${STATE.level}</span>
        <div class="xp-bar-track">
          <div class="xp-bar-fill" id="xp-fill" style="width:${xpPct}%"></div>
        </div>
        <span class="xp-text" id="xp-text">${fmt(STATE.xp)} / ${fmt(xpNeeded)}</span>
      </div>

      <!-- ── COMBO DISPLAY AREA ── -->
      <div class="combo-area" id="combo-area"></div>

      <!-- ── MAIN TAP AREA (CENTRAL BUTTON) ── -->
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
              <div class="core-top-icon">👑</div>
              <div class="core-title">TAP HERE</div>
              <div class="core-tap-power-badge">+${fmt(coinsPerTap)} COINS/TAP</div>
            </div>

            <div class="perfect-ring" id="perfect-ring"></div>
          </div>
        </div>
      </div>

      <!-- ── ENERGY BAR & LOW WARNING ── -->
      <div class="energy-section">
        <div class="energy-row">
          <span class="energy-label">⚡ ENERGY</span>
          <span class="energy-val" id="energy-text">${Math.floor(STATE.energy)} / ${STATE.maxEnergy}</span>
        </div>
        <div class="energy-track" id="energy-track">
          <div class="energy-fill" id="energy-fill" style="width:${engPct}%"></div>
        </div>
        ${STATE.energy <= 10 ? `
          <div style="font-size:11px;font-weight:800;color:var(--danger);margin-top:4px;text-align:center">
            ⚡ ENERGY LOW — Complete a task or open a chest!
          </div>` : ''}
        <div id="energy-empty-hint"></div>
      </div>

      <!-- ── 🎁 BONUS COLLECTION CARD ── -->
      <div class="home-widget-card">
        <div class="widget-header-row">
          <div class="widget-title">🎁 BONUS COLLECTION</div>
          <div class="widget-badge">${canClaimDaily ? 'AVAILABLE' : 'CHECKED IN'}</div>
        </div>
        <div class="widget-desc">Daily Bonus, Streak Bonus & Task Rewards</div>
        <button class="btn btn-gold btn-block" style="margin-top:8px" onclick="switchScreen('tasks')">
          ${canClaimDaily ? '🎁 CLAIM AVAILABLE BONUS' : '✓ ALL BONUSES CLAIMED'}
        </button>
      </div>

      <!-- ── 🎡 WHEEL MASTER CARD ── -->
      <div class="home-widget-card">
        <div class="widget-header-row">
          <div class="widget-title">🎡 WHEEL MASTER</div>
          <div class="widget-badge">🎟️ ${spinsLeft} SPINS</div>
        </div>
        <div class="widget-desc">Spin the prize wheel to discover rewards!</div>
        <button class="btn btn-gold btn-block" style="margin-top:8px" onclick="typeof openDailySpinModal === 'function' && openDailySpinModal()">
          🎡 SPIN NOW
        </button>
      </div>

      <!-- ── 🎁 MYSTERY CHEST CARD (3 VISIBLE CHESTS) ── -->
      <div class="home-widget-card">
        <div class="widget-header-row">
          <div class="widget-title">🎁 MYSTERY CHEST</div>
          <div class="widget-badge">3 AVAILABLE</div>
        </div>
        <div class="widget-desc">Select ONE chest to unlock your reward:</div>
        
        <div class="three-chests-row" style="display:flex;gap:10px;margin:10px 0;">
          <div class="home-chest-box ${_selectedChestIdx === 1 ? 'selected' : ''}" onclick="_handleSelectChest(1)">
            <div style="font-size:24px">🟫</div>
            <div style="font-size:10px;font-weight:800;margin-top:2px">CHEST 1</div>
          </div>
          <div class="home-chest-box ${_selectedChestIdx === 2 ? 'selected' : ''}" onclick="_handleSelectChest(2)">
            <div style="font-size:24px">🟫</div>
            <div style="font-size:10px;font-weight:800;margin-top:2px">CHEST 2</div>
          </div>
          <div class="home-chest-box ${_selectedChestIdx === 3 ? 'selected' : ''}" onclick="_handleSelectChest(3)">
            <div style="font-size:24px">🟫</div>
            <div style="font-size:10px;font-weight:800;margin-top:2px">CHEST 3</div>
          </div>
        </div>

        ${_selectedChestIdx !== null ? `
          <button class="btn btn-gold btn-block" onclick="_handleOpenSelectedChest()">
            📺 WATCH AD & OPEN CHEST ${_selectedChestIdx}
          </button>` : `
          <div style="font-size:11px;color:var(--muted);text-align:center;padding:4px">
            Tap a chest above to select it
          </div>`
        }
      </div>

      <!-- ── 🔥 CURRENT BOOST CARD ── -->
      <div class="home-widget-card">
        <div class="widget-header-row">
          <div class="widget-title">🔥 CURRENT BOOST</div>
          <div class="widget-badge">${boostActive ? 'ACTIVE' : 'READY'}</div>
        </div>
        <div class="widget-desc">
          ${boostActive ? `🚀 2× Tap Boost Active · ${boostTimeStr} remaining` : 'No boost active. Activate 2× Tap Power on Boost screen!'}
        </div>
        <button class="btn btn-outline btn-block" style="margin-top:8px" onclick="switchScreen('boost')">
          ⚡ GO TO BOOST CENTER
        </button>
      </div>

      <!-- ── 🎯 TODAY'S TASKS SUMMARY CARD ── -->
      <div class="home-widget-card">
        <div class="widget-header-row">
          <div class="widget-title">🎯 TODAY'S TASKS</div>
          <div class="widget-badge">52 TASKS</div>
        </div>
        <div class="widget-desc">Complete Daily, Weekly & Monthly tasks for Coins and Energy.</div>
        <button class="btn btn-gold btn-block" style="margin-top:8px" onclick="switchScreen('tasks')">
          🎯 VIEW TASKS
        </button>
      </div>

      <!-- ── 🏆 WEEKLY PROGRESS CARD ── -->
      <div class="home-widget-card">
        <div class="widget-header-row">
          <div class="widget-title">🏆 WEEKLY PROGRESS</div>
          <div class="widget-badge">SEASON 1</div>
        </div>
        <div class="widget-desc">Level up your Tap Empire power to climb the global leaderboard!</div>
      </div>

    </div>`;

  attachTapEvents();
  updateXpUI();
  updateEnergyUI();
  updateComboUI();
}

function _handleSelectChest(idx) {
  _selectedChestIdx = idx;
  renderHomeScreen();
  if (typeof SFX !== 'undefined' && SFX.click) SFX.click();
}

async function _handleOpenSelectedChest() {
  if (_selectedChestIdx === null) return;
  if (typeof openChestModal === 'function') {
    openChestModal('epic');
    _selectedChestIdx = null;
  }
}
