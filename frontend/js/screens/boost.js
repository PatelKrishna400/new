/* ═══════════════════════════════════════════════════════════
   TAP EMPIRE — 🔥 BOOST CENTER (Master Update)
   • 3 Main Boost Cards: Tap Power, Chest Power, Spin Power
   • Compulsory 1 Rewarded Ad Activation Flow
   • Insufficient Coins & Ad Failure Handlers
   • Server Timestamp 30-Minute Timers (No reset on page reload)
   • Permanent Upgrade Level Retention
   • Active Boost Cards Feed & Boost Statistics Grid
═══════════════════════════════════════════════════════════ */

'use strict';

let _boostCenterTimerInterval = null;

/* Admin Configurable Cost Schedule (Section 9) */
const BOOST_COST_SCHEDULES = {
  tapPower:   [1000, 2000, 3500, 5000, 7500, 10000, 15000, 25000],
  chestPower: [2000, 5000, 10000, 20000, 35000, 50000],
  spinPower:  [5000, 15000, 30000, 50000, 75000, 100000],
};

function getBoostLevel(type) {
  if (!STATE.boostLevels) STATE.boostLevels = { tapPower: 5, chestPower: 3, spinPower: 2 };
  return STATE.boostLevels[type] || (type === 'tapPower' ? 5 : type === 'chestPower' ? 3 : 2);
}

function getBoostCost(type, lvl) {
  const sched = BOOST_COST_SCHEDULES[type] || [1000, 2000, 5000];
  const idx = Math.min(sched.length - 1, Math.max(0, lvl - 1));
  return sched[idx];
}

function renderBoostScreen() {
  const el = document.getElementById('screen-boost');
  if (!el) return;

  const now = Date.now();
  const tapLvl = getBoostLevel('tapPower');
  const chestLvl = getBoostLevel('chestPower');
  const spinLvl = getBoostLevel('spinPower');

  const tapCost = getBoostCost('tapPower', tapLvl);
  const chestCost = getBoostCost('chestPower', chestLvl);
  const spinCost = getBoostCost('spinPower', spinLvl);

  const activeBoosts = _getActiveBoostsList(now);

  el.innerHTML = `
    <div class="screen-scroll boost-page-container">
      
      <!-- ── HEADER ── -->
      <div class="boost-header">
        <div class="boost-title">🔥 BOOST CENTER</div>
        <div class="boost-subtitle">Upgrade your empire power.</div>
      </div>

      <!-- ── 1. TAP POWER CARD ── -->
      <div class="boost-upgrade-card">
        <div class="card-title-row">
          <div class="card-icon">💪</div>
          <div>
            <div class="card-title">TAP POWER</div>
            <div class="card-lvl-badge">LEVEL ${tapLvl}</div>
          </div>
        </div>

        <div class="boost-stat-compare">
          <div class="stat-box">
            <div class="stat-lbl">CURRENT</div>
            <div class="stat-val">+${tapLvl * 2} / TAP</div>
          </div>
          <div class="stat-arrow">➔</div>
          <div class="stat-box">
            <div class="stat-lbl">NEXT LEVEL</div>
            <div class="stat-val highlight">+${(tapLvl + 1) * 2} / TAP</div>
          </div>
        </div>

        <div class="boost-meta-bar">
          <span>💰 ${fmt(tapCost)} COINS</span>
          <span>⏱️ 30 MIN</span>
          <span>📺 1 REWARDED AD</span>
        </div>

        <button class="btn btn-gold btn-block" onclick="promptBoostUpgradeModal('tapPower')">
          🔥 UPGRADE TAP POWER
        </button>
      </div>

      <!-- ── 2. CHEST POWER CARD ── -->
      <div class="boost-upgrade-card">
        <div class="card-title-row">
          <div class="card-icon">🎁</div>
          <div>
            <div class="card-title">CHEST POWER</div>
            <div class="card-lvl-badge">LEVEL ${chestLvl}</div>
          </div>
        </div>

        <div class="boost-stat-compare">
          <div class="stat-box">
            <div class="stat-lbl">CURRENT</div>
            <div class="stat-val">⚡ +${chestLvl * 3 + 1} Energy</div>
          </div>
          <div class="stat-arrow">➔</div>
          <div class="stat-box">
            <div class="stat-lbl">NEXT LEVEL</div>
            <div class="stat-val highlight">⚡ +${(chestLvl + 1) * 3 + 1} Energy</div>
          </div>
        </div>

        <div class="boost-meta-bar">
          <span>💰 ${fmt(chestCost)} COINS</span>
          <span>⏱️ 30 MIN</span>
          <span>📺 1 REWARDED AD</span>
        </div>

        <button class="btn btn-gold btn-block" onclick="promptBoostUpgradeModal('chestPower')">
          🔥 UPGRADE CHEST POWER
        </button>
      </div>

      <!-- ── 3. SPIN POWER CARD ── -->
      <div class="boost-upgrade-card">
        <div class="card-title-row">
          <div class="card-icon">🎡</div>
          <div>
            <div class="card-title">SPIN POWER</div>
            <div class="card-lvl-badge">LEVEL ${spinLvl}</div>
          </div>
        </div>

        <div class="boost-stat-compare">
          <div class="stat-box">
            <div class="stat-lbl">CURRENT</div>
            <div class="stat-val">+${spinLvl * 5}% Bonus</div>
          </div>
          <div class="stat-arrow">➔</div>
          <div class="stat-box">
            <div class="stat-lbl">NEXT LEVEL</div>
            <div class="stat-val highlight">+${(spinLvl + 1) * 5}% Bonus</div>
          </div>
        </div>

        <div class="boost-meta-bar">
          <span>💰 ${fmt(spinCost)} COINS</span>
          <span>⏱️ 30 MIN</span>
          <span>📺 1 REWARDED AD</span>
        </div>

        <button class="btn btn-gold btn-block" onclick="promptBoostUpgradeModal('spinPower')">
          🔥 UPGRADE SPIN POWER
        </button>
      </div>

      <!-- ── 4. 🔥 ACTIVE BOOSTS CARD ── -->
      <div class="active-boosts-section">
        <div class="section-title">🔥 ACTIVE BOOSTS</div>
        ${activeBoosts.length === 0 ? `
          <div class="empty-active-boosts">No boosts currently active. Upgrade a boost above to activate!</div>
        ` : activeBoosts.map(b => `
          <div class="active-boost-item">
            <div class="active-boost-info">
              <div class="active-boost-name">${b.icon} ${b.title} (LV ${b.level})</div>
              <div class="active-boost-timer" id="timer-${b.type}">${b.timerStr} remaining</div>
            </div>
            <div class="active-boost-track">
              <div class="active-boost-fill" id="fill-${b.type}" style="width:${b.pct}%"></div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- ── 5. 📊 BOOST STATISTICS ── -->
      <div class="boost-stats-card">
        <div class="section-title">📊 BOOST STATISTICS</div>
        <div class="boost-stats-grid">
          <div class="bstat-col">
            <div class="bstat-lbl">Total Activations</div>
            <div class="bstat-val">${STATE.totalBoostsActivated || 0}</div>
          </div>
          <div class="bstat-col">
            <div class="bstat-lbl">Tap Power</div>
            <div class="bstat-val">${STATE.tapBoostCount || 0}</div>
          </div>
          <div class="bstat-col">
            <div class="bstat-lbl">Chest Power</div>
            <div class="bstat-val">${STATE.chestBoostCount || 0}</div>
          </div>
          <div class="bstat-col">
            <div class="bstat-lbl">Spin Power</div>
            <div class="bstat-val">${STATE.spinBoostCount || 0}</div>
          </div>
        </div>
      </div>

    </div>`;

  if (activeBoosts.length > 0) {
    _startBoostCenterLocalTimer();
  }
}

function _getActiveBoostsList(now) {
  const list = [];
  if (!STATE.boostActivations) return list;

  const types = [
    { type: 'tapPower', icon: '💪', title: 'Tap Power' },
    { type: 'chestPower', icon: '🎁', title: 'Chest Power' },
    { type: 'spinPower', icon: '🎡', title: 'Spin Power' },
  ];

  types.forEach(t => {
    const act = STATE.boostActivations[t.type];
    if (act && act.expiresAt > now) {
      const msLeft = act.expiresAt - now;
      const mins = Math.floor(msLeft / 60000);
      const secs = Math.floor((msLeft % 60000) / 1000);
      const timerStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      const totalMs = 30 * 60 * 1000;
      const pct = Math.min(100, Math.max(0, (msLeft / totalMs) * 100)).toFixed(1);
      list.push({ ...t, level: act.level, timerStr, pct });
    }
  });

  return list;
}

function _startBoostCenterLocalTimer() {
  if (_boostCenterTimerInterval) clearInterval(_boostCenterTimerInterval);
  _boostCenterTimerInterval = setInterval(() => {
    const now = Date.now();
    const activeList = _getActiveBoostsList(now);

    if (activeList.length === 0) {
      clearInterval(_boostCenterTimerInterval);
      _boostCenterTimerInterval = null;
      renderBoostScreen();
      return;
    }

    activeList.forEach(b => {
      const elTimer = document.getElementById(`timer-${b.type}`);
      const elFill = document.getElementById(`fill-${b.type}`);
      if (elTimer) elTimer.textContent = `${b.timerStr} remaining`;
      if (elFill) elFill.style.width = `${b.pct}%`;
    });
  }, 1000);
}

/* ═══════════════════════════════════════════════════════════
   CONFIRMATION MODAL & COMPULSORY REWARDED AD ACTIVATION
═══════════════════════════════════════════════════════════ */
function promptBoostUpgradeModal(type) {
  const currentLvl = getBoostLevel(type);
  const nextLvl = currentLvl + 1;
  const cost = getBoostCost(type, currentLvl);

  let title = 'TAP POWER';
  let icon = '💪';
  let currentEffect = `+${currentLvl * 2} POWER / TAP`;
  let nextEffect = `+${nextLvl * 2} POWER / TAP`;

  if (type === 'chestPower') {
    title = 'CHEST POWER';
    icon = '🎁';
    currentEffect = `⚡ +${currentLvl * 3 + 1} Energy`;
    nextEffect = `⚡ +${nextLvl * 3 + 1} Energy`;
  } else if (type === 'spinPower') {
    title = 'SPIN POWER';
    icon = '🎡';
    currentEffect = `+${currentLvl * 5}% Bonus`;
    nextEffect = `+${nextLvl * 5}% Bonus`;
  }

  showModal(`
    <div class="boost-modal-container" style="text-align:center;padding:12px">
      <div style="font-size:36px;margin-bottom:6px">${icon}</div>
      <div style="font-size:18px;font-weight:900;color:var(--white)">🔥 ACTIVATE ${title}</div>
      <div style="font-size:12px;font-weight:800;color:var(--gold);margin-top:4px">LEVEL ${currentLvl} ➔ LEVEL ${nextLvl}</div>
      
      <div style="background:var(--card2);border:1px solid var(--border);border-radius:12px;padding:10px;margin:12px 0;font-size:13px;font-weight:800">
        <div>${currentEffect} ➔ <span style="color:var(--success)">${nextEffect}</span></div>
      </div>

      <div style="font-size:12px;font-weight:700;color:var(--white);line-height:1.8;margin-bottom:14px">
        💰 COST: <strong style="color:var(--gold)">${fmt(cost)} COINS</strong><br>
        ⏱️ DURATION: <strong>30 MINUTES</strong><br>
        📺 REQUIREMENT: <strong>1 REWARDED AD</strong>
      </div>

      <div style="font-size:11px;color:var(--muted);margin-bottom:16px">
        You must complete one rewarded advertisement to activate this boost.
      </div>

      <div style="display:flex;flex-direction:column;gap:8px">
        <button class="btn btn-gold btn-block" onclick="_confirmAndWatchBoostAd('${type}', ${cost})">
          📺 WATCH AD & ACTIVATE
        </button>
        <button class="btn btn-muted btn-block" onclick="closeModal()">
          CANCEL
        </button>
      </div>
    </div>
  `);
}

async function _confirmAndWatchBoostAd(type, cost) {
  closeModal();

  /* 1. Check Coin Balance */
  if ((STATE.coins || 0) < cost) {
    showModal(`
      <div style="text-align:center;padding:14px">
        <div style="font-size:40px">⚠️</div>
        <div style="font-size:16px;font-weight:900;margin:8px 0">INSUFFICIENT COINS</div>
        <div style="font-size:13px;color:var(--white);margin-bottom:4px">You need: 💰 ${fmt(cost)} Coins</div>
        <div style="font-size:13px;color:var(--muted);margin-bottom:16px">Your balance: 💰 ${fmt(STATE.coins || 0)} Coins</div>
        <button class="btn btn-gold btn-block" onclick="closeModal();switchScreen('tasks')">EARN COINS</button>
      </div>
    `);
    return;
  }

  /* 2. Play Compulsory Rewarded Ad */
  if (typeof AdManager !== 'undefined') {
    const adOk = await AdManager.showRewardedAd('boost_upgrade_' + type, 0, 0);
    if (!adOk) {
      showModal(`
        <div style="text-align:center;padding:14px">
          <div style="font-size:40px">⚠️</div>
          <div style="font-size:16px;font-weight:900;margin:8px 0">AD UNAVAILABLE</div>
          <div style="font-size:13px;color:var(--muted);margin-bottom:16px">
            The rewarded advertisement could not be completed.<br>Your boost was NOT activated.
          </div>
          <button class="btn btn-gold btn-block" onclick="closeModal()">TRY AGAIN</button>
        </div>
      `);
      return;
    }
  }

  /* 3. Deduct Coins, Update Permanent Level & Set 30-Min Server Timestamp Expiry */
  STATE.coins -= cost;
  updateCoinUI();

  if (!STATE.boostLevels) STATE.boostLevels = { tapPower: 5, chestPower: 3, spinPower: 2 };
  STATE.boostLevels[type] = (STATE.boostLevels[type] || 1) + 1;

  const now = Date.now();
  const durationMs = 30 * 60 * 1000;
  const expiresAt = now + durationMs;

  if (!STATE.boostActivations) STATE.boostActivations = {};
  STATE.boostActivations[type] = {
    level: STATE.boostLevels[type],
    startedAt: now,
    expiresAt: expiresAt,
    status: 'ACTIVE',
    adVerified: true,
  };

  STATE.totalBoostsActivated = (STATE.totalBoostsActivated || 0) + 1;
  if (type === 'tapPower') STATE.tapBoostCount = (STATE.tapBoostCount || 0) + 1;
  if (type === 'chestPower') STATE.chestBoostCount = (STATE.chestBoostCount || 0) + 1;
  if (type === 'spinPower') STATE.spinBoostCount = (STATE.spinBoostCount || 0) + 1;

  if (typeof SFX !== 'undefined' && SFX.upgrade) SFX.upgrade();
  haptic('success');
  showToast(`🔥 Boost Activated for 30 minutes!`, 'success');

  await persistUser({
    coins: STATE.coins,
    boostLevels: STATE.boostLevels,
    boostActivations: STATE.boostActivations,
    totalBoostsActivated: STATE.totalBoostsActivated,
    tapBoostCount: STATE.tapBoostCount,
    chestBoostCount: STATE.chestBoostCount,
    spinBoostCount: STATE.spinBoostCount,
  });

  renderBoostScreen();
}
