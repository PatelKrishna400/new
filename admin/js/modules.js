/**
 * CONSOLIDATED ADMIN MODULES (admin/js/modules.js)
 * Unified handlers for Users, Tasks, Economy, Ads, Payouts & Settings
 */


/* ==================== MODULE: DASHBOARD ==================== */
/* ==========================================================================
   PAGE: DASHBOARD LOGIC (pages/dashboard/dashboard.js)
   - Real-time Monthly & Yearly Graphical Representation (Pie / Doughnut Charts)
   - Dynamic Period Filtering & KPI Gauges
   - Firebase-Backed Target Benchmark Editor
   ========================================================================== */

// Global Dashboard Period & Analytics State
window.dashboardPeriodState = {
  mode: 'monthly', // 'monthly' | 'yearly'
  selectedMonth: new Date().getMonth(), // 0 - 11
  selectedYear: String(new Date().getFullYear()), // '2026', 'all', etc.
  activeModalTab: 'chart-task',
  chartOverrides: {
    task: null,
    economy: null,
    miniGames: null,
    tiers: null
  },
  targets: {
    monthly: {
      players: 5000,
      tasks: 25000,
      ads: 10000,
      rewards: 100,
      economy: 5000000
    },
    yearly: {
      players: 50000,
      tasks: 250000,
      ads: 100000,
      rewards: 1200,
      economy: 50000000
    }
  }
};

// Chart.js instance registry (Main 4 Charts + Modal Previews)
const dashboardCharts = {
  task: null,
  economy: null,
  miniGames: null,
  tiers: null,
  previewTask: null,
  previewEconomy: null,
  previewMiniGames: null,
  previewTiers: null
};

// Color Palettes for High-Contrast Clean Visualizations (Streamlined, no repeated categories)
const DASHBOARD_PALETTES = {
  tasks: ['#0284c7', '#8b5cf6', '#10b981'], // Telegram Tasks ✈️, Monthly Quests 🏆, Website Quests 🌐
  economy: ['#f59e0b', '#06b6d4', '#8b5cf6', '#3b82f6', '#10b981', '#f43f5e'], // Coins 🪙, Diamonds 💎, Keys 🗝️, Tickets 🎫, Eggs 🥚, Cards 🎴
  miniGames: ['#f59e0b', '#9333ea', '#ec4899', '#10b981', '#06b6d4'], // Wheel Spins 🎡, Chests 🗝️, Scratch Cards 🎴, Hatched Eggs 🥚, Ads 🎬
  tiers: ['#7c3aed', '#ec4899', '#0284c7', '#f59e0b'] // Goal Milestone Rewards 🎯, XP Level Bonuses ⚡, Novice (Lv 0-4) 🥉, Pro (Lv 5+) 👑
};

/**
 * Initialize Dashboard Page
 */
function initDashboardPage() {
  setupPeriodSelectors();
  loadTargetsFromStorageOrCloud();
  updateDashboardMetrics();
  renderRealtimeActivityFeed();
  refreshDashboardAnalytics();
}

/**
 * Listen for global admin state updates
 */
window.addEventListener('usersUpdated', () => {
  updateDashboardMetrics();
  renderRealtimeActivityFeed();
  refreshDashboardAnalytics();
});

window.addEventListener('rewardsUpdated', () => {
  updateDashboardMetrics();
  refreshDashboardAnalytics();
});

window.addEventListener('requestsUpdated', () => {
  updateDashboardMetrics();
  renderRealtimeActivityFeed();
  refreshDashboardAnalytics();
});

window.addEventListener('activitiesUpdated', () => {
  renderRealtimeActivityFeed();
});

/**
 * Setup default selected values in dropdowns
 */
function setupPeriodSelectors() {
  const currentMonth = new Date().getMonth();
  const currentYear = String(new Date().getFullYear());

  const selectMonth = document.getElementById('dashSelectMonth');
  const selectYear = document.getElementById('dashSelectYear');

  if (selectMonth) selectMonth.value = currentMonth;
  if (selectYear) {
    // Check if current year is an option, else default to 2026
    const hasYear = Array.from(selectYear.options).some(o => o.value === currentYear);
    selectYear.value = hasYear ? currentYear : '2026';
  }

  window.dashboardPeriodState.selectedMonth = currentMonth;
  window.dashboardPeriodState.selectedYear = selectYear ? selectYear.value : '2026';
}

/**
 * Load targets and custom chart overrides from Firebase RTDB or localStorage
 */
function loadTargetsFromStorageOrCloud() {
  const TARGETS_STORAGE_KEY = 'ENERGY_TAP_DASHBOARD_TARGETS';
  const OVERRIDES_STORAGE_KEY = 'ENERGY_TAP_CHART_OVERRIDES';

  // 1. Try local storage first for fast render
  try {
    const cachedTargets = localStorage.getItem(TARGETS_STORAGE_KEY);
    if (cachedTargets) {
      const parsed = JSON.parse(cachedTargets);
      if (parsed && parsed.monthly && parsed.yearly) {
        window.dashboardPeriodState.targets = parsed;
      }
    }
    const cachedOverrides = localStorage.getItem(OVERRIDES_STORAGE_KEY);
    if (cachedOverrides) {
      const parsedO = JSON.parse(cachedOverrides);
      if (parsedO && typeof parsedO === 'object') {
        window.dashboardPeriodState.chartOverrides = parsedO;
      }
    }
  } catch (e) {
    console.warn('Could not read cached dashboard targets or overrides:', e);
  }

  // 2. Try Firebase Cloud RTDB
  const db = (typeof window.getDb === 'function') ? window.getDb() : null;
  if (db) {
    db.ref('/analytics_config/targets').once('value', snapshot => {
      const val = snapshot.val();
      if (val && val.monthly && val.yearly) {
        window.dashboardPeriodState.targets = val;
        try {
          localStorage.setItem(TARGETS_STORAGE_KEY, JSON.stringify(val));
        } catch (err) {}
        refreshDashboardAnalytics();
      }
    });

    db.ref('/analytics_config/chart_overrides').once('value', snapshot => {
      const val = snapshot.val();
      if (val && typeof val === 'object') {
        window.dashboardPeriodState.chartOverrides = val;
        try {
          localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(val));
        } catch (err) {}
        refreshDashboardAnalytics();
      }
    });
  }
}

/**
 * Update Top Metric Cards with Live Firebase Aggregations
 */
function updateDashboardMetrics() {
  const metrics = (typeof window.calculateAggregatedMetrics === 'function')
    ? window.calculateAggregatedMetrics()
    : {
        totalUsers: 0, onlineUsers: 0, totalCoins: 0, totalXP: 0, totalKeys: 0,
        totalTickets: 0, totalEggs: 0, totalWithdrawals: 0, pendingWithdrawals: 0,
        totalReferrals: 0, totalAdViews: 0, totalCompletedTasks: 0, totalLevels: 100
      };

  const users = (window.adminState && window.adminState.users) ? window.adminState.users : [];
  const totalDailyTasks = users.reduce((sum, u) => sum + (Number(u.dailyTasksDone) || 0), 0);
  const totalWebTasks = users.reduce((sum, u) => sum + (Number(u.webTasksDone) || 0), 0);

  // Section 1: Live Community & Player Engagement
  const elPlayers = document.getElementById('dashTotalPlayers');
  const elOnline = document.getElementById('dashOnlinePlayers');
  const elPendingWith = document.getElementById('dashPendingWithdrawals');
  const elTotalWith = document.getElementById('dashTotalWithdrawals');
  const elReferrals = document.getElementById('dashTotalReferrals');
  const elAds = document.getElementById('dashAdsButtonCount');
  const elCompletedTasks = document.getElementById('dashCompletedTasks');

  if (elPlayers) elPlayers.textContent = Number(metrics.totalUsers || 0).toLocaleString();
  if (elOnline) elOnline.textContent = Number(metrics.onlineUsers || 0).toLocaleString();
  if (elPendingWith) elPendingWith.textContent = Number(metrics.pendingWithdrawals || 0).toLocaleString();
  if (elTotalWith) elTotalWith.textContent = `/ ${Number(metrics.totalWithdrawals || 0).toLocaleString()} Total`;
  if (elReferrals) elReferrals.textContent = Number(metrics.totalReferrals || 0).toLocaleString();
  if (elAds) elAds.textContent = Number(metrics.totalAdViews || 0).toLocaleString();
  if (elCompletedTasks) elCompletedTasks.textContent = Number(metrics.totalCompletedTasks || 0).toLocaleString();

  // Section 2: Live Economy & Assets in Circulation
  const elCoins = document.getElementById('dashTotalCoins');
  const elXP = document.getElementById('dashTotalXP');
  const elKeys = document.getElementById('dashTotalKeys');
  const elTickets = document.getElementById('dashTotalTickets');
  const elEggs = document.getElementById('dashTotalEggs');
  const elLevels = document.getElementById('dashTotalLevels');
  const elDiamonds = document.getElementById('dashTotalDiamonds');
  
  if (elCoins) {
    const c = Number(metrics.totalCoins || 0);
    elCoins.textContent = c >= 1000000 ? (c / 1000000).toFixed(2) + 'M' : c.toLocaleString();
    elCoins.title = `${c.toLocaleString()} Coins 🪙`;
  }
  if (elXP) {
    const xp = Number(metrics.totalXP || 0);
    elXP.textContent = xp >= 1000000 ? (xp / 1000000).toFixed(2) + 'M' : xp.toLocaleString();
    elXP.title = `${xp.toLocaleString()} XP ⭐`;
  }
  if (elKeys) elKeys.textContent = Number(metrics.totalKeys || 0).toLocaleString();
  if (elTickets) elTickets.textContent = Number(metrics.totalTickets || 0).toLocaleString();
  if (elEggs) elEggs.textContent = Number(metrics.totalEggs || 0).toLocaleString();
  if (elLevels) elLevels.textContent = Number(metrics.totalLevels || 100).toLocaleString();
  if (elDiamonds) {
    const d = Number(metrics.totalDiamonds || 0);
    elDiamonds.textContent = d >= 1000000 ? (d / 1000000).toFixed(2) + 'M' : d.toLocaleString();
    elDiamonds.title = `${d.toLocaleString()} Diamonds 💎`;
  }
  

  // Legacy elements if present
  const elDaily = document.getElementById('dashDailyTasksCompleted');
  const elWeb = document.getElementById('dashWebTasksCompleted');
  if (elDaily) elDaily.textContent = totalDailyTasks.toLocaleString();
  if (elWeb) elWeb.textContent = totalWebTasks.toLocaleString();

  const gameStats = (window.adminState && window.adminState.gameStats) ? window.adminState.gameStats : {};
  const elSpins = document.getElementById('dashTotalSpins');
  const elChests = document.getElementById('dashTotalChests');
  const elScratches = document.getElementById('dashTotalScratches');
  if (elSpins) elSpins.textContent = (gameStats.totalSpins || 0).toLocaleString();
  if (elChests) elChests.textContent = (gameStats.totalChests || 0).toLocaleString();
  if (elScratches) elScratches.textContent = (gameStats.totalScratches || 0).toLocaleString();
}

/**
 * Render Live Real-Time Activity & Audit Feed
 */
function renderRealtimeActivityFeed() {
  const container = document.getElementById('dashRealtimeActivityFeed');
  if (!container) return;

  let activities = (window.adminState && window.adminState.activities) ? [...window.adminState.activities] : [];

  if (activities.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: #94a3b8; padding: 32px 16px; font-size: 13px; display: flex; flex-direction: column; align-items: center; gap: 8px;">
        <span style="font-size: 26px;">✨</span>
        <span style="font-weight: 700; color: #f1f5f9;">No Activity Logs in Firebase</span>
        <span style="font-size: 11.5px; color: #64748b;">All activity logs have been cleared or no recent actions recorded.</span>
      </div>
    `;
    return;
  }

  const icons = {
    user_register: '👤',
    user_edit: '✏️',
    user_status: '🔒',
    user_delete: '🗑️',
    withdrawal_status: '💳',
    withdrawal: '💳',
    task_save: '🎯',
    task_delete: '🗑️',
    level_save: '🏆',
    level_lock: '🔐',
    active: '⚡'
  };

  const colors = {
    user_register: '#38bdf8',
    user_edit: '#f59e0b',
    user_status: '#ec4899',
    user_delete: '#ef4444',
    withdrawal_status: '#10b981',
    withdrawal: '#f59e0b',
    task_save: '#06b6d4',
    task_delete: '#ef4444',
    level_save: '#8b5cf6',
    level_lock: '#f43f5e',
    active: '#34d399'
  };

  const escapeText = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  container.innerHTML = activities.slice(0, 25).map(act => {
    const icon = icons[act.type] || '⚡';
    const color = colors[act.type] || '#38bdf8';
    const timeStr = act.timestamp ? new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Just now';
    const dateStr = act.timestamp ? new Date(act.timestamp).toLocaleDateString() : '';

    return `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; font-size: 12.5px; transition: all 0.2s ease;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 32px; height: 32px; border-radius: 8px; background: ${color}20; color: ${color}; display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; border: 1px solid ${color}35;">
            ${icon}
          </div>
          <div>
            <div style="font-weight: 700; color: #f1f5f9; display: flex; align-items: center; gap: 6px;">
              <span>${escapeText(act.title || 'Live Activity')}</span>
              <span style="font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: 4px; background: ${color}25; color: ${color}; text-transform: uppercase;">
                ${escapeText(act.type || 'Event')}
              </span>
            </div>
            <div style="color: #94a3b8; font-size: 11.5px; margin-top: 2px;">
              ${escapeText(act.details || '')}
            </div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 10px; flex-shrink: 0;">
          <div style="text-align: right; color: #64748b; font-size: 11px; font-family: monospace;">
            <div>${timeStr}</div>
            <div style="font-size: 10px; color: #475569;">${dateStr}</div>
          </div>
          ${act.id ? `
            <button type="button" onclick="deleteActivity('${act.id}')" title="Delete Activity from Firebase" style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 6px; color: #ef4444; cursor: pointer; padding: 4px 7px; font-size: 11.5px; transition: all 0.2s ease;">
              🗑️
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}
window.renderRealtimeActivityFeed = renderRealtimeActivityFeed;

/**
 * Delete a single activity log item from Firebase
 */
function deleteActivity(actId) {
  if (!actId) return;
  if (!confirm('Are you sure you want to delete this activity log from Firebase?')) return;
  if (typeof window.deleteActivityFromFirebase === 'function') {
    window.deleteActivityFromFirebase(actId)
      .then(() => {
        renderRealtimeActivityFeed();
      })
      .catch(err => alert('Error deleting activity: ' + err.message));
  } else {
    const db = window.getDb ? window.getDb() : null;
    if (db) {
      db.ref('/activity_log/' + actId).remove().then(() => {
        renderRealtimeActivityFeed();
      }).catch(err => alert(err.message));
    }
  }
}
window.deleteActivity = deleteActivity;

/**
 * Clear all activity logs from Firebase
 */
function clearAllActivities() {
  if (!confirm('⚠️ Are you sure you want to CLEAR ALL activity logs from Firebase?\nThis will permanently delete all activity log history.')) return;
  if (typeof window.clearAllActivitiesFromFirebase === 'function') {
    window.clearAllActivitiesFromFirebase()
      .then(() => {
        alert('✅ All activity logs cleared from Firebase.');
        renderRealtimeActivityFeed();
      })
      .catch(err => alert('Error clearing activity logs: ' + err.message));
  } else {
    const db = window.getDb ? window.getDb() : null;
    if (db) {
      db.ref('/activity_log').remove().then(() => {
        alert('✅ All activity logs cleared.');
        renderRealtimeActivityFeed();
      }).catch(err => alert(err.message));
    }
  }
}
window.clearAllActivities = clearAllActivities;

/**
 * Toggle between 'monthly' and 'yearly' mode
 */
function setDashboardPeriodMode(mode) {
  if (mode !== 'monthly' && mode !== 'yearly') return;
  window.dashboardPeriodState.mode = mode;

  const btnMonthly = document.getElementById('btnPeriodMonthly');
  const btnYearly = document.getElementById('btnPeriodYearly');
  const wrapMonth = document.getElementById('wrapMonthSelect');

  if (btnMonthly) btnMonthly.classList.toggle('active', mode === 'monthly');
  if (btnYearly) btnYearly.classList.toggle('active', mode === 'yearly');

  // Hide or show Month dropdown based on mode
  if (wrapMonth) {
    wrapMonth.style.display = (mode === 'monthly') ? 'flex' : 'none';
  }

  // Update KPI Labels
  const kpiLabelPlayers = document.getElementById('kpiLabelPlayers');
  const kpiLabelTasks = document.getElementById('kpiLabelTasks');
  const kpiLabelEconomy = document.getElementById('kpiLabelEconomy');
  const kpiLabelAds = document.getElementById('kpiLabelAds');

  if (kpiLabelPlayers) kpiLabelPlayers.textContent = (mode === 'monthly') ? 'Monthly Active Players' : 'Yearly Active Players';
  if (kpiLabelTasks) kpiLabelTasks.textContent = (mode === 'monthly') ? 'Monthly Tasks Volume' : 'Yearly Tasks Volume';
  if (kpiLabelEconomy) kpiLabelEconomy.textContent = (mode === 'monthly') ? 'Monthly Circulating Wealth' : 'Yearly Cumulative Wealth';
  if (kpiLabelAds) kpiLabelAds.textContent = (mode === 'monthly') ? 'Monthly Ads Monetization' : 'Yearly Ads Monetization';

  refreshDashboardAnalytics();
}
window.setDashboardPeriodMode = setDashboardPeriodMode;

/**
 * Triggered on Month or Year dropdown changes
 */
function onDashboardDateFilterChange() {
  const selectMonth = document.getElementById('dashSelectMonth');
  const selectYear = document.getElementById('dashSelectYear');

  if (selectMonth) window.dashboardPeriodState.selectedMonth = parseInt(selectMonth.value, 10);
  if (selectYear) window.dashboardPeriodState.selectedYear = selectYear.value;

  refreshDashboardAnalytics();
}
window.onDashboardDateFilterChange = onDashboardDateFilterChange;

/**
 * Period Filter Calculation
 * Analyzes live player accounts and activity for the selected Month / Year
 */
function calculatePeriodData() {
  const users = (window.adminState && window.adminState.users) ? window.adminState.users : [];
  const state = window.dashboardPeriodState;
  const isMonthly = (state.mode === 'monthly');
  const targetYear = state.selectedYear;
  const targetMonth = state.selectedMonth;

  // Filter users based on activity timestamp or include all if matching period
  const filteredUsers = users.filter(u => {
    if (targetYear === 'all') return true;

    // Check lastActive or creation dates
    const dateStr = u.lastActive || (u.raw && (u.raw.createdAt || u.raw.joinedAt || u.raw.lastLogin));
    if (!dateStr) return true; // Default include if timestamp not restricted

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return true;

    const uYear = String(d.getFullYear());
    const uMonth = d.getMonth();

    if (uYear !== targetYear) return false;
    if (isMonthly && uMonth !== targetMonth) return false;

    return true;
  });

  // Effective population for selected period
  const sampleUsers = (targetYear === 'all') ? users : filteredUsers;
  const activeCount = sampleUsers.length;

  // 1. Task Breakdown Data: Telegram, Monthly, Website + User counts
  const tgDone = sampleUsers.reduce((sum, u) => sum + (Number(u.tgDone) || 0), 0);
  const monthlyDone = sampleUsers.reduce((sum, u) => sum + (Number(u.monthlyDone) || 0), 0);
  const webDone = sampleUsers.reduce((sum, u) => sum + (Number(u.webDone || u.webTasksDone) || 0), 0);
  const totalTasks = tgDone + monthlyDone + webDone;

  const usersWithTg = sampleUsers.filter(u => Number(u.tgDone) > 0).length;
  const usersWithMonthly = sampleUsers.filter(u => Number(u.monthlyDone) > 0).length;
  const usersWithWeb = sampleUsers.filter(u => Number(u.webDone || u.webTasksDone) > 0).length;
  const totalUsersWithTasks = sampleUsers.filter(u => (Number(u.tgDone) || 0) + (Number(u.monthlyDone) || 0) + (Number(u.webDone || u.webTasksDone) || 0) > 0).length;

  // 2. All Coin Breakdown Data (coin, diamond, key, ticket, egg, card) + User counts
  const totalCoins = sampleUsers.reduce((sum, u) => sum + (Number(u.coins) || 0), 0);
  const totalDiamonds = sampleUsers.reduce((sum, u) => sum + (Number(u.diamonds || u.blueCoins) || 0), 0);
  const totalKeys = sampleUsers.reduce((sum, u) => sum + (Number(u.chestKeys) || 0), 0);
  const totalTickets = sampleUsers.reduce((sum, u) => sum + (Number(u.chestTickets) || 0), 0);
  const totalEggs = sampleUsers.reduce((sum, u) => sum + (Number(u.eggs) || 0), 0);
  const totalCards = sampleUsers.reduce((sum, u) => sum + (Number(u.scratchCards) || 0), 0);

  const usersWithCoins = sampleUsers.filter(u => Number(u.coins) > 0).length;
  const usersWithDiamonds = sampleUsers.filter(u => Number(u.diamonds || u.blueCoins) > 0).length;
  const usersWithKeys = sampleUsers.filter(u => Number(u.chestKeys) > 0).length;
  const usersWithTickets = sampleUsers.filter(u => Number(u.chestTickets) > 0).length;
  const usersWithEggs = sampleUsers.filter(u => Number(u.eggs) > 0).length;
  const usersWithCards = sampleUsers.filter(u => Number(u.scratchCards) > 0).length;

  // 3. Mini-Games Breakdown Data (Dedicated source of truth for mini-games)
  const gameStats = (window.adminState && window.adminState.gameStats) ? window.adminState.gameStats : {};
  const scaleRatio = (users.length > 0) ? (sampleUsers.length / users.length) : 0;
  const spins = Math.round((gameStats.totalSpins || 0) * scaleRatio);
  const chests = Math.round((gameStats.totalChests || 0) * scaleRatio);
  const scratches = Math.round((gameStats.totalScratches || 0) * scaleRatio);
  const eggsHatched = Math.round((gameStats.totalEggs || 0) * scaleRatio);
  const totalMiniGames = spins + chests + scratches + eggsHatched;

  // 4. Goal & XP Level Rewards Breakdown + Total Users
  let goalRewardsCount = 0;
  let xpRewardsCount = 0;
  let usersWithGoalReward = 0;
  let usersWithXpReward = 0;

  sampleUsers.forEach(u => {
    const gl = Number(u.goalLevel || 0);
    const claimedGoals = (u.claimedGoals && typeof u.claimedGoals === 'object') ? Object.keys(u.claimedGoals).length : (gl > 0 ? gl : 0);
    const gReward = claimedGoals > 0 ? claimedGoals * 500 : (gl > 0 ? gl * 500 : 0);
    goalRewardsCount += gReward;
    if (gReward > 0 || gl > 0) usersWithGoalReward++;

    const lvl = Number(u.level || 0);
    const claimedLvls = (u.claimedLevels && typeof u.claimedLevels === 'object') ? Object.keys(u.claimedLevels).length : (lvl > 0 ? lvl : 0);
    const xReward = claimedLvls > 0 ? claimedLvls * 250 : (lvl > 0 ? lvl * 250 : (Number(u.xp || 0) > 0 ? Math.floor(Number(u.xp) / 200) * 100 : 0));
    xpRewardsCount += xReward;
    if (xReward > 0 || lvl > 0) usersWithXpReward++;
  });
  const totalGoalXpUsers = sampleUsers.filter(u => Number(u.goalLevel || 0) > 0 || Number(u.level || 0) > 0).length;

  // Total Ads
  const totalAds = sampleUsers.reduce((sum, u) => sum + (Number(u.adsButtonCount || u.adsWatched) || 0), 0);

  // Current Target configuration
  const currentTargets = isMonthly ? state.targets.monthly : state.targets.yearly;

  // Apply custom chart overrides if set by admin
  const ovr = state.chartOverrides || {};

  const effectiveTasks = {
    telegram: (ovr.task && ovr.task.telegram !== null && ovr.task.telegram !== undefined) ? Number(ovr.task.telegram) : tgDone,
    monthly: (ovr.task && ovr.task.monthly !== null && ovr.task.monthly !== undefined) ? Number(ovr.task.monthly) : monthlyDone,
    website: (ovr.task && ovr.task.web !== null && ovr.task.web !== undefined) ? Number(ovr.task.web) : webDone
  };

  const effectiveTasksUsers = {
    telegram: usersWithTg,
    monthly: usersWithMonthly,
    website: usersWithWeb,
    total: totalUsersWithTasks
  };

  const effectiveAllCoins = {
    coins: (ovr.economy && ovr.economy.coins !== null && ovr.economy.coins !== undefined) ? Number(ovr.economy.coins) : totalCoins,
    diamonds: (ovr.economy && ovr.economy.diamonds !== null && ovr.economy.diamonds !== undefined) ? Number(ovr.economy.diamonds) : totalDiamonds,
    keys: (ovr.economy && ovr.economy.keys !== null && ovr.economy.keys !== undefined) ? Number(ovr.economy.keys) : totalKeys,
    tickets: (ovr.economy && ovr.economy.tickets !== null && ovr.economy.tickets !== undefined) ? Number(ovr.economy.tickets) : totalTickets,
    eggs: (ovr.economy && ovr.economy.eggs !== null && ovr.economy.eggs !== undefined) ? Number(ovr.economy.eggs) : totalEggs,
    cards: (ovr.economy && ovr.economy.cards !== null && ovr.economy.cards !== undefined) ? Number(ovr.economy.cards) : totalCards
  };

  const effectiveAllCoinsUsers = {
    coins: usersWithCoins,
    diamonds: usersWithDiamonds,
    keys: usersWithKeys,
    tickets: usersWithTickets,
    eggs: usersWithEggs,
    cards: usersWithCards,
    total: activeCount
  };

  const effectiveGoalsXp = {
    goalRewards: (ovr.tiers && ovr.tiers.goalRewards !== null && ovr.tiers.goalRewards !== undefined) ? Number(ovr.tiers.goalRewards) : goalRewardsCount,
    xpRewards: (ovr.tiers && ovr.tiers.xpRewards !== null && ovr.tiers.xpRewards !== undefined) ? Number(ovr.tiers.xpRewards) : xpRewardsCount,
    goalUsers: (ovr.tiers && ovr.tiers.goalUsers !== null && ovr.tiers.goalUsers !== undefined) ? Number(ovr.tiers.goalUsers) : usersWithGoalReward,
    xpUsers: (ovr.tiers && ovr.tiers.xpUsers !== null && ovr.tiers.xpUsers !== undefined) ? Number(ovr.tiers.xpUsers) : usersWithXpReward,
    totalUsers: totalGoalXpUsers
  };

  const effectiveMiniGames = {
    spins: (ovr.miniGames && ovr.miniGames.spins !== null && ovr.miniGames.spins !== undefined) ? Number(ovr.miniGames.spins) : spins,
    chests: (ovr.miniGames && ovr.miniGames.chests !== null && ovr.miniGames.chests !== undefined) ? Number(ovr.miniGames.chests) : chests,
    scratches: (ovr.miniGames && ovr.miniGames.scratches !== null && ovr.miniGames.scratches !== undefined) ? Number(ovr.miniGames.scratches) : scratches,
    eggsHatched: (ovr.miniGames && ovr.miniGames.eggs !== null && ovr.miniGames.eggs !== undefined) ? Number(ovr.miniGames.eggs) : eggsHatched,
    total: 0
  };
  effectiveMiniGames.total = effectiveMiniGames.spins + effectiveMiniGames.chests + effectiveMiniGames.scratches + effectiveMiniGames.eggsHatched;

  return {
    isMonthly,
    activeCount,
    totalTasks: effectiveTasks.telegram + effectiveTasks.monthly + effectiveTasks.website,
    tasks: effectiveTasks,
    tasksUsers: effectiveTasksUsers,
    allCoins: effectiveAllCoins,
    allCoinsUsers: effectiveAllCoinsUsers,
    economy: effectiveAllCoins,
    goalsXp: effectiveGoalsXp,
    tiers: effectiveGoalsXp,
    miniGames: effectiveMiniGames,
    totalAds,
    targets: currentTargets,
    rawCloud: {
      tasks: { telegram: tgDone, monthly: monthlyDone, website: webDone, users: effectiveTasksUsers },
      allCoins: { coins: totalCoins, diamonds: totalDiamonds, keys: totalKeys, tickets: totalTickets, eggs: totalEggs, cards: totalCards, users: effectiveAllCoinsUsers },
      miniGames: { spins, chests, scratches, eggsHatched, total: totalMiniGames },
      goalsXp: { goalRewards: goalRewardsCount, xpRewards: xpRewardsCount, goalUsers: usersWithGoalReward, xpUsers: usersWithXpReward, totalUsers: totalGoalXpUsers }
    }
  };
}

/**
 * Master Refresh Function
 */
function refreshDashboardAnalytics(showToast) {
  const data = calculatePeriodData();

  renderExecutiveKpis(data);
  renderGraphicalCharts(data);
  renderSummaryTable(data);

  if (showToast) {
    showQuickNotification('✅ Period analytics refreshed with latest cloud data.');
  }
}
window.refreshDashboardAnalytics = refreshDashboardAnalytics;

/**
 * Render Executive Progress KPI Gauges
 */
function renderExecutiveKpis(data) {
  const targets = data.targets;

  // KPI 1: Players
  const elValPlayers = document.getElementById('kpiValPlayers');
  const elTargetPlayers = document.getElementById('kpiTargetPlayers');
  const elFillPlayers = document.getElementById('kpiFillPlayers');
  const elTagPlayers = document.getElementById('kpiTagPlayers');
  const elSubPlayers = document.getElementById('kpiSubPlayers');

  const playerTarget = targets.players || 1;
  const playerPct = Math.min(100, Math.round((data.activeCount / playerTarget) * 100));

  if (elValPlayers) elValPlayers.textContent = data.activeCount.toLocaleString();
  if (elTargetPlayers) elTargetPlayers.textContent = `/ ${playerTarget.toLocaleString()} Target`;
  if (elFillPlayers) elFillPlayers.style.width = `${playerPct}%`;
  if (elTagPlayers) {
    elTagPlayers.textContent = `${playerPct}% Goal`;
    elTagPlayers.style.color = (playerPct >= 100) ? '#059669' : '#0284c7';
    elTagPlayers.style.background = (playerPct >= 100) ? 'rgba(16, 185, 129, 0.12)' : 'rgba(2, 132, 199, 0.1)';
  }
  if (elSubPlayers) {
    elSubPlayers.textContent = (playerPct >= 100) ? '🎯 Target Achieved!' : `${(playerTarget - data.activeCount).toLocaleString()} to milestone`;
  }

  // KPI 2: Tasks
  const elValTasks = document.getElementById('kpiValTasks');
  const elTargetTasks = document.getElementById('kpiTargetTasks');
  const elFillTasks = document.getElementById('kpiFillTasks');
  const elTagTasks = document.getElementById('kpiTagTasks');
  const elSubTasks = document.getElementById('kpiSubTasks');

  const taskTarget = targets.tasks || 1;
  const taskPct = Math.min(100, Math.round((data.totalTasks / taskTarget) * 100));

  if (elValTasks) elValTasks.textContent = data.totalTasks.toLocaleString();
  if (elTargetTasks) elTargetTasks.textContent = `/ ${taskTarget.toLocaleString()} Target`;
  if (elFillTasks) elFillTasks.style.width = `${taskPct}%`;
  if (elTagTasks) {
    elTagTasks.textContent = `${taskPct}% Goal`;
    elTagTasks.style.color = (taskPct >= 100) ? '#059669' : '#0284c7';
  }
  if (elSubTasks) {
    elSubTasks.textContent = `${data.tasks.daily} Daily • ${data.tasks.monthly} Monthly • ${data.tasks.web} Web`;
  }

  // KPI 3: Economy
  const elValEconomy = document.getElementById('kpiValEconomy');
  const elTargetEconomy = document.getElementById('kpiTargetEconomy');
  const elFillEconomy = document.getElementById('kpiFillEconomy');
  const elTagEconomy = document.getElementById('kpiTagEconomy');
  const elSubEconomy = document.getElementById('kpiSubEconomy');

  const totalWealth = (Number(data.economy.coins) || 0) + (Number(data.economy.diamonds) || 0);
  const economyTarget = targets.economy || (data.isMonthly ? 5000000 : 50000000);
  const economyPct = Math.min(100, Math.round((totalWealth / economyTarget) * 100));

  if (elValEconomy) elValEconomy.textContent = totalWealth >= 1000000 ? (totalWealth / 1000000).toFixed(1) + 'M' : totalWealth.toLocaleString();
  if (elTargetEconomy) elTargetEconomy.textContent = `/ ${economyTarget >= 1000000 ? (economyTarget / 1000000).toFixed(1) + 'M' : economyTarget.toLocaleString()} Target`;
  if (elFillEconomy) elFillEconomy.style.width = `${economyPct}%`;
  if (elTagEconomy) {
    elTagEconomy.textContent = `${economyPct}% Goal`;
    elTagEconomy.style.color = (economyPct >= 100) ? '#059669' : '#d97706';
    elTagEconomy.style.background = (economyPct >= 100) ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.1)';
  }
  if (elSubEconomy) {
    elSubEconomy.textContent = `${(data.economy.coins || 0).toLocaleString()} Coins 🪙 • ${(data.economy.diamonds || 0).toLocaleString()} Diamonds 💎`;
  }

  // KPI 4: Ads
  const elValAds = document.getElementById('kpiValAds');
  const elTargetAds = document.getElementById('kpiTargetAds');
  const elFillAds = document.getElementById('kpiFillAds');
  const elTagAds = document.getElementById('kpiTagAds');

  const adsTarget = targets.ads || 1;
  const adsPct = Math.min(100, Math.round((data.totalAds / adsTarget) * 100));

  if (elValAds) elValAds.textContent = data.totalAds.toLocaleString();
  if (elTargetAds) elTargetAds.textContent = `/ ${adsTarget.toLocaleString()} Target`;
  if (elFillAds) elFillAds.style.width = `${adsPct}%`;
  if (elTagAds) {
    elTagAds.textContent = `${adsPct}% Goal`;
    elTagAds.style.color = (adsPct >= 100) ? '#059669' : '#9333ea';
  }
}

/**
 * Update dynamic live hover indicator box in the square card tab
 */
function updateHoverIndicator(indicatorId, label, val, total, color, userCount) {
  const el = document.getElementById(indicatorId);
  if (!el) return;

  const pct = (total > 0) ? ((val / total) * 100).toFixed(1) : '0.0';
  const uText = (userCount !== undefined && userCount !== null) ? ` • <span style="color: #0284c7; font-weight: 700;">${Number(userCount).toLocaleString()} Users</span>` : '';
  el.classList.add('active-hover');
  el.innerHTML = `
    <span class="hover-dot" style="background-color: ${color};"></span>
    <span class="hover-text">
      <strong>${label}</strong>: 
      <span class="hover-val-highlight">${Number(val).toLocaleString()}</span>
      <span class="hover-pct-highlight">${pct}%</span>
      ${uText}
    </span>
  `;
}

/**
 * Reset live hover indicator to default summary state
 */
function resetHoverIndicator(indicatorId, total, labels, values, colors) {
  const el = document.getElementById(indicatorId);
  if (!el) return;

  el.classList.remove('active-hover');
  const defaultDotColor = colors && colors.length ? colors[0] : '#0284c7';
  el.innerHTML = `
    <span class="hover-dot" style="background-color: ${defaultDotColor};"></span>
    <span class="hover-text">Move mouse over any pie slice to inspect values • Total: <strong>${Number(total).toLocaleString()}</strong></span>
  `;
}

/**
 * Highlight legend item synchronized with pie slice hover
 */
function highlightLegendItem(legendId, index) {
  const legendBox = document.getElementById(legendId);
  if (!legendBox) return;
  const items = legendBox.querySelectorAll('.chart-legend-item');
  items.forEach((item, i) => {
    if (i === index) {
      item.style.backgroundColor = '#e0f2fe';
      item.style.borderColor = '#0284c7';
      item.style.transform = 'scale(1.02)';
    } else {
      item.style.backgroundColor = '';
      item.style.borderColor = '';
      item.style.transform = '';
    }
  });
}

/**
 * Clear legend item highlight
 */
function clearLegendHighlight(legendId) {
  const legendBox = document.getElementById(legendId);
  if (!legendBox) return;
  const items = legendBox.querySelectorAll('.chart-legend-item');
  items.forEach(item => {
    item.style.backgroundColor = '';
    item.style.borderColor = '';
    item.style.transform = '';
  });
}

/**
 * Render All 4 Graphical Pie Charts
 */
function renderGraphicalCharts(data) {
  // Chart 1: All Coin (coin, diamond, key, ticket, egg, card) - Total User Data
  renderPieChart(
    'chartEconomyBreakdown',
    'legendEconomyBreakdown',
    'hoverIndicatorEconomy',
    'economy',
    ['Coins 🪙', 'Diamonds 💎', 'Keys 🗝️', 'Tickets 🎫', 'Eggs 🥚', 'Cards 🎴'],
    [
      data.allCoins.coins,
      data.allCoins.diamonds,
      data.allCoins.keys,
      data.allCoins.tickets,
      data.allCoins.eggs,
      data.allCoins.cards
    ],
    DASHBOARD_PALETTES.economy,
    'pie',
    [
      data.allCoinsUsers.coins,
      data.allCoinsUsers.diamonds,
      data.allCoinsUsers.keys,
      data.allCoinsUsers.tickets,
      data.allCoinsUsers.eggs,
      data.allCoinsUsers.cards
    ]
  );

  // Chart 2: Tasks Completed Breakdown (Telegram, Monthly, Website) - Total User Tasks
  renderPieChart(
    'chartTaskBreakdown',
    'legendTaskBreakdown',
    'hoverIndicatorTask',
    'task',
    ['Telegram Tasks ✈️', 'Monthly Quests 🏆', 'Website Quests 🌐'],
    [data.tasks.telegram, data.tasks.monthly, data.tasks.website],
    DASHBOARD_PALETTES.tasks,
    'pie',
    [data.tasksUsers.telegram, data.tasksUsers.monthly, data.tasksUsers.website]
  );

  // Chart 3: Goal & XP Level Rewards Collected & Total Users
  renderPieChart(
    'chartPlayerTiers',
    'legendPlayerTiers',
    'hoverIndicatorTiers',
    'tiers',
    ['Goal Rewards Collected 🎯', 'XP Level Rewards Collected ⚡', 'Goal Reward Users 👥', 'XP Reward Users 🌟'],
    [
      data.goalsXp.goalRewards,
      data.goalsXp.xpRewards,
      data.goalsXp.goalUsers,
      data.goalsXp.xpUsers
    ],
    DASHBOARD_PALETTES.tiers,
    'pie',
    [
      data.goalsXp.goalUsers,
      data.goalsXp.xpUsers,
      data.goalsXp.goalUsers,
      data.goalsXp.xpUsers
    ]
  );

  // Chart 4: Mini-Games & Ads Monetization Activity
  renderPieChart(
    'chartMiniGamesBreakdown',
    'legendMiniGamesBreakdown',
    'hoverIndicatorMiniGames',
    'miniGames',
    ['Wheel Spins 🎡', 'Vault Chests 🗝️', 'Scratch Cards 🎴', 'Eggs Hatched 🥚', 'Ads Watched 🎬'],
    [
      data.miniGames.spins,
      data.miniGames.chests,
      data.miniGames.scratches,
      data.miniGames.eggsHatched,
      data.totalAds
    ],
    DASHBOARD_PALETTES.miniGames,
    'pie'
  );
}

/**
 * Universal Pie Chart Creator & Updater with Interactive Hover Support & User Counts
 */
function renderPieChart(canvasId, legendId, indicatorId, chartKey, labels, values, colors, chartType, userCounts) {
  const canvas = document.getElementById(canvasId);
  const legendBox = document.getElementById(legendId);
  if (!canvas) return;

  const total = values.reduce((sum, v) => sum + (Number(v) || 0), 0);
  const displayValues = (total === 0) ? values.map(() => 1) : values;
  const isZeroData = (total === 0);

  // Initial state for hover indicator
  resetHoverIndicator(indicatorId, total, labels, values, colors);

  // 1. If Chart.js is loaded
  if (typeof window.Chart !== 'undefined') {
    try {
      if (dashboardCharts[chartKey]) {
        dashboardCharts[chartKey].destroy();
      }

      const ctx = canvas.getContext('2d');
      dashboardCharts[chartKey] = new window.Chart(ctx, {
        type: 'pie',
        data: {
          labels: labels,
          datasets: [{
            data: displayValues,
            backgroundColor: colors,
            borderColor: '#ffffff',
            borderWidth: 2,
            hoverBorderColor: '#0f172a',
            hoverBorderWidth: 3,
            hoverOffset: 12
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          onHover: (event, activeElements) => {
            if (activeElements && activeElements.length > 0) {
              const idx = activeElements[0].index;
              const val = isZeroData ? 0 : values[idx];
              const uCnt = (userCounts && userCounts[idx] !== undefined) ? userCounts[idx] : null;
              updateHoverIndicator(indicatorId, labels[idx], val, total, colors[idx % colors.length], uCnt);
              highlightLegendItem(legendId, idx);
            } else {
              resetHoverIndicator(indicatorId, total, labels, values, colors);
              clearLegendHighlight(legendId);
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              enabled: true,
              backgroundColor: 'rgba(15, 23, 42, 0.94)',
              titleColor: '#ffffff',
              titleFont: { size: 12, weight: 'bold' },
              bodyColor: '#38bdf8',
              bodyFont: { size: 13, weight: 'bold' },
              padding: 10,
              cornerRadius: 8,
              boxPadding: 4,
              borderColor: 'rgba(255, 255, 255, 0.12)',
              borderWidth: 1,
              callbacks: {
                label: function(context) {
                  const idx = context.dataIndex;
                  const val = isZeroData ? 0 : (values[idx] || 0);
                  const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
                  const uText = (userCounts && userCounts[idx] !== undefined) ? ` • ${userCounts[idx].toLocaleString()} Users` : '';
                  return ` ${labels[idx]}: ${val.toLocaleString()} (${pct}%)${uText}`;
                }
              }
            }
          },
          animation: {
            duration: 450
          }
        }
      });

      canvas.onmouseleave = () => {
        resetHoverIndicator(indicatorId, total, labels, values, colors);
        clearLegendHighlight(legendId);
      };
    } catch (err) {
      console.error(`Chart.js error rendering ${canvasId}:`, err);
      drawFallbackCanvasChart(canvas, indicatorId, legendId, displayValues, labels, values, colors, isZeroData);
    }
  } else {
    // Pure HTML5 Canvas fallback with interactive mousemove tracking
    drawFallbackCanvasChart(canvas, indicatorId, legendId, displayValues, labels, values, colors, isZeroData);
  }

  // 2. Render Custom Interactive HTML Legend
  if (legendBox) {
    legendBox.innerHTML = labels.map((label, i) => {
      const val = values[i] || 0;
      const pct = (total > 0 && !isZeroData) ? ((val / total) * 100).toFixed(1) : (isZeroData ? '0.0' : '0');
      const color = colors[i % colors.length];
      const uCnt = (userCounts && userCounts[i] !== undefined) ? userCounts[i] : null;

      return `
        <div class="chart-legend-item" 
             title="${label}: ${val.toLocaleString()} (${pct}%)"
             onmouseenter="onLegendMouseEnter('${chartKey}', ${i}, '${indicatorId}', '${label}', ${val}, ${total}, '${color}', ${uCnt !== null ? uCnt : 'undefined'})"
             onmouseleave="onLegendMouseLeave('${chartKey}', '${indicatorId}', ${total})">
          <div class="legend-left">
            <span class="legend-dot" style="background-color: ${color};"></span>
            <span class="legend-name">${label}</span>
          </div>
          <div class="legend-right">
            <span class="legend-val">${val.toLocaleString()}</span>
            ${uCnt !== null ? `<span style="font-size: 10px; color: #0284c7; font-weight: 800; font-family: 'JetBrains Mono', monospace;">${uCnt.toLocaleString()} Users</span>` : ''}
            <span class="legend-pct">${pct}%</span>
          </div>
        </div>
      `;
    }).join('');
  }
}

/**
 * Legend item hover handlers to highlight slices and indicator
 */
function onLegendMouseEnter(chartKey, index, indicatorId, label, val, total, color, userCount) {
  updateHoverIndicator(indicatorId, label, val, total, color, userCount);
  const chartInstance = dashboardCharts[chartKey];
  if (chartInstance && typeof chartInstance.setActiveElements === 'function') {
    try {
      chartInstance.setActiveElements([{ datasetIndex: 0, index }]);
      chartInstance.tooltip.setActiveElements([{ datasetIndex: 0, index }], { x: 0, y: 0 });
      chartInstance.update();
    } catch (e) {}
  }
}
window.onLegendMouseEnter = onLegendMouseEnter;

function onLegendMouseLeave(chartKey, indicatorId, total) {
  const el = document.getElementById(indicatorId);
  if (el) el.classList.remove('active-hover');
  const chartInstance = dashboardCharts[chartKey];
  if (chartInstance && typeof chartInstance.setActiveElements === 'function') {
    try {
      chartInstance.setActiveElements([]);
      chartInstance.tooltip.setActiveElements([], { x: 0, y: 0 });
      chartInstance.update();
    } catch (e) {}
  }
}
window.onLegendMouseLeave = onLegendMouseLeave;

/**
 * Pure Canvas Fallback with Interactive Mouse Hover Support
 */
function drawFallbackCanvasChart(canvas, indicatorId, legendId, displayValues, labels, values, colors, isZeroData) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width = 160;
  const h = canvas.height = 160;
  const cx = w / 2;
  const cy = h / 2;
  const radius = 68;

  let activeHoverIndex = -1;
  const total = values.reduce((sum, v) => sum + (Number(v) || 0), 0);
  const calcTotal = displayValues.reduce((sum, v) => sum + v, 0) || 1;

  function renderSlices() {
    ctx.clearRect(0, 0, w, h);
    let startAngle = -Math.PI / 2;

    displayValues.forEach((v, i) => {
      const sliceAngle = (v / calcTotal) * 2 * Math.PI;
      const endAngle = startAngle + sliceAngle;
      const isHovered = (i === activeHoverIndex);
      const r = isHovered ? radius + 5 : radius;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      ctx.strokeStyle = isHovered ? '#0f172a' : '#ffffff';
      ctx.lineWidth = isHovered ? 3 : 2;
      ctx.stroke();

      startAngle = endAngle;
    });
  }

  renderSlices();

  canvas.onmousemove = (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= radius + 6) {
      let angle = Math.atan2(dy, dx) - (-Math.PI / 2);
      if (angle < 0) angle += 2 * Math.PI;

      let currentAngle = 0;
      let matchedIndex = -1;
      for (let i = 0; i < displayValues.length; i++) {
        const sliceAngle = (displayValues[i] / calcTotal) * 2 * Math.PI;
        if (angle >= currentAngle && angle <= currentAngle + sliceAngle) {
          matchedIndex = i;
          break;
        }
        currentAngle += sliceAngle;
      }

      if (matchedIndex !== -1 && matchedIndex !== activeHoverIndex) {
        activeHoverIndex = matchedIndex;
        renderSlices();
        const val = isZeroData ? 0 : values[matchedIndex];
        updateHoverIndicator(indicatorId, labels[matchedIndex], val, total, colors[matchedIndex % colors.length]);
        highlightLegendItem(legendId, matchedIndex);
      }
    } else {
      if (activeHoverIndex !== -1) {
        activeHoverIndex = -1;
        renderSlices();
        resetHoverIndicator(indicatorId, total, labels, values, colors);
        clearLegendHighlight(legendId);
      }
    }
  };

  canvas.onmouseleave = () => {
    activeHoverIndex = -1;
    renderSlices();
    resetHoverIndicator(indicatorId, total, labels, values, colors);
    clearLegendHighlight(legendId);
  };
}

/**
 * Render Summary Breakdown Table
 */
function renderSummaryTable(data) {
  const tbody = document.getElementById('dashTableBody');
  const subTitle = document.getElementById('tablePeriodSubtitle');
  if (!tbody) return;

  const state = window.dashboardPeriodState;
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const periodText = state.mode === 'monthly'
    ? `${monthNames[state.selectedMonth]} ${state.selectedYear}`
    : `Year ${state.selectedYear}`;

  if (subTitle) {
    subTitle.textContent = `Detailed live readouts compared to targets for ${periodText}.`;
  }

  const targets = data.targets;
  const rows = [
    {
      name: 'Active Players Population',
      icon: '👥',
      live: data.activeCount,
      target: targets.players,
      unit: 'Players'
    },
    {
      name: 'Quests & Tasks Completed',
      icon: '🎯',
      live: data.totalTasks,
      target: targets.tasks,
      unit: 'Tasks'
    },
    {
      name: 'Daily Quests Ratio',
      icon: '📅',
      live: data.tasks.daily,
      target: Math.round(targets.tasks * 0.4),
      unit: 'Claims'
    },
    {
      name: 'Monthly Quests Ratio',
      icon: '📆',
      live: data.tasks.monthly,
      target: Math.round(targets.tasks * 0.35),
      unit: 'Claims'
    },
    {
      name: 'Web Quests Ratio',
      icon: '🌐',
      live: data.tasks.web,
      target: Math.round(targets.tasks * 0.25),
      unit: 'Claims'
    },
    {
      name: 'Monetization Ads Watched',
      icon: '🎬',
      live: data.totalAds,
      target: targets.ads,
      unit: 'Impressions'
    },
    {
      name: 'Mini-Game Spins & Plays',
      icon: '🎡',
      live: data.miniGames.total,
      target: Math.round(targets.tasks * 0.5),
      unit: 'Plays'
    },
    {
      name: 'Mega Reward Redemptions',
      icon: '🎁',
      live: (window.adminState && window.adminState.requests) ? window.adminState.requests.length : 0,
      target: targets.rewards,
      unit: 'Orders'
    },
    {
      name: 'Circulating Economy (Coins & Gems)',
      icon: '🪙',
      live: (Number(data.economy.coins) || 0) + (Number(data.economy.diamonds) || 0),
      target: targets.economy || (data.isMonthly ? 5000000 : 50000000),
      unit: 'Assets'
    }
  ];

  tbody.innerHTML = rows.map(r => {
    const pct = r.target > 0 ? Math.round((r.live / r.target) * 100) : 100;
    let badgeClass = 'in-progress';
    let badgeText = `${pct}% In Progress`;

    if (pct >= 100) {
      badgeClass = 'achieved';
      badgeText = `✅ ${pct}% Achieved`;
    } else if (pct >= 60) {
      badgeClass = 'on-track';
      badgeText = `⚡ ${pct}% On Track`;
    }

    return `
      <tr>
        <td style="font-weight: 700; display: flex; align-items: center; gap: 8px;">
          <span>${r.icon}</span>
          <span>${r.name}</span>
        </td>
        <td style="font-family: 'JetBrains Mono', monospace; font-weight: 800; color: #0f172a;">
          ${r.live.toLocaleString()} <span style="font-size: 11px; color: #64748b; font-family: inherit;">${r.unit}</span>
        </td>
        <td style="font-family: 'JetBrains Mono', monospace; color: #475569;">
          ${r.target.toLocaleString()} ${r.unit}
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 6px;">
            <div style="width: 50px; height: 5px; background: #e2e8f0; border-radius: 99px; overflow: hidden;">
              <div style="width: ${Math.min(100, pct)}%; height: 100%; background: ${pct >= 100 ? '#10b981' : '#0284c7'};"></div>
            </div>
            <span style="font-weight: 700; font-size: 11.5px;">${pct}%</span>
          </div>
        </td>
        <td>
          <span class="status-badge ${badgeClass}">${badgeText}</span>
        </td>
        <td style="text-align: right;">
          <button type="button" class="btn-dash-outline" style="padding: 4px 8px; font-size: 11.5px;" onclick="openEditTargetsModal()">
            Edit
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Modal Handling: Edit Monthly & Yearly Targets
 */
/**
 * Modal Handling: Edit Monthly & Yearly Targets or Custom Pie Chart Slices
 */
function openEditTargetsModal() {
  openChartEditor(null);
}
window.openEditTargetsModal = openEditTargetsModal;

/**
 * Open Editor for a specific Pie Chart or Targets via Square Tabs
 */
function openChartEditor(chartKey) {
  const modal = document.getElementById('dashboardTargetsModal');
  if (!modal) return;

  populateModalValues();

  const targetTab = chartKey ? ('chart-' + chartKey) : (window.dashboardPeriodState.mode || 'chart-task');
  switchModalTab(targetTab);

  modal.classList.add('active');
}
window.openChartEditor = openChartEditor;

function closeEditTargetsModal() {
  const modal = document.getElementById('dashboardTargetsModal');
  if (modal) modal.classList.remove('active');
}
window.closeEditTargetsModal = closeEditTargetsModal;

/**
 * Switch Modal Square Tab
 */
function switchModalTab(tabKey) {
  window.dashboardPeriodState.activeModalTab = tabKey;

  const tabBtns = [
    { id: 'tabBtnChartTask', key: 'chart-task' },
    { id: 'tabBtnChartEconomy', key: 'chart-economy' },
    { id: 'tabBtnChartMiniGames', key: 'chart-miniGames' },
    { id: 'tabBtnChartTiers', key: 'chart-tiers' },
    { id: 'modalTabBtnMonthly', key: 'monthly' },
    { id: 'modalTabBtnYearly', key: 'yearly' }
  ];

  const panes = [
    { id: 'modalPaneChartTask', key: 'chart-task' },
    { id: 'modalPaneChartEconomy', key: 'chart-economy' },
    { id: 'modalPaneChartMiniGames', key: 'chart-miniGames' },
    { id: 'modalPaneChartTiers', key: 'chart-tiers' },
    { id: 'modalPaneMonthly', key: 'monthly' },
    { id: 'modalPaneYearly', key: 'yearly' }
  ];

  tabBtns.forEach(t => {
    const el = document.getElementById(t.id);
    if (el) el.classList.toggle('active', t.key === tabKey);
  });

  panes.forEach(p => {
    const el = document.getElementById(p.id);
    if (el) el.style.display = (p.key === tabKey) ? 'block' : 'none';
  });

  // If a chart tab, render its preview
  if (tabKey === 'chart-task') renderPreviewChart('task');
  else if (tabKey === 'chart-economy') renderPreviewChart('economy');
  else if (tabKey === 'chart-miniGames') renderPreviewChart('miniGames');
  else if (tabKey === 'chart-tiers') renderPreviewChart('tiers');
}
window.switchModalTab = switchModalTab;

/**
 * Populate input values and live cloud tags in the modal
 */
function populateModalValues() {
  const data = calculatePeriodData();
  const raw = data.rawCloud;
  const ovr = window.dashboardPeriodState.chartOverrides || {};
  const targets = window.dashboardPeriodState.targets;

  // 1. Tasks Tab (Telegram, Monthly, Website)
  const inpTg = document.getElementById('inpEditTaskTelegram');
  const inpMonthly = document.getElementById('inpEditTaskMonthly');
  const inpWeb = document.getElementById('inpEditTaskWeb');
  const refTg = document.getElementById('refTaskTelegram');
  const refMonthly = document.getElementById('refTaskMonthly');
  const refWeb = document.getElementById('refTaskWeb');

  if (refTg) refTg.textContent = `Live: ${raw.tasks.telegram.toLocaleString()}`;
  if (refMonthly) refMonthly.textContent = `Live: ${raw.tasks.monthly.toLocaleString()}`;
  if (refWeb) refWeb.textContent = `Live: ${raw.tasks.website.toLocaleString()}`;

  if (inpTg) inpTg.value = (ovr.task && ovr.task.telegram !== null && ovr.task.telegram !== undefined) ? ovr.task.telegram : raw.tasks.telegram;
  if (inpMonthly) inpMonthly.value = (ovr.task && ovr.task.monthly !== null && ovr.task.monthly !== undefined) ? ovr.task.monthly : raw.tasks.monthly;
  if (inpWeb) inpWeb.value = (ovr.task && ovr.task.web !== null && ovr.task.web !== undefined) ? ovr.task.web : raw.tasks.website;

  // 2. Economy Tab (All 6 Currencies)
  const inpCoins = document.getElementById('inpEditEconomyCoins');
  const inpDiamonds = document.getElementById('inpEditEconomyDiamonds');
  const inpKeys = document.getElementById('inpEditEconomyKeys');
  const inpTickets = document.getElementById('inpEditEconomyTickets');
  const inpEggs = document.getElementById('inpEditEconomyEggs');
  const inpCards = document.getElementById('inpEditEconomyCards');

  const refCoins = document.getElementById('refEconomyCoins');
  const refDiamonds = document.getElementById('refEconomyDiamonds');
  const refKeys = document.getElementById('refEconomyKeys');
  const refTickets = document.getElementById('refEconomyTickets');
  const refEggs = document.getElementById('refEconomyEggs');
  const refCards = document.getElementById('refEconomyCards');

  if (refCoins) refCoins.textContent = `Live: ${raw.allCoins.coins.toLocaleString()}`;
  if (refDiamonds) refDiamonds.textContent = `Live: ${raw.allCoins.diamonds.toLocaleString()}`;
  if (refKeys) refKeys.textContent = `Live: ${raw.allCoins.keys.toLocaleString()}`;
  if (refTickets) refTickets.textContent = `Live: ${raw.allCoins.tickets.toLocaleString()}`;
  if (refEggs) refEggs.textContent = `Live: ${raw.allCoins.eggs.toLocaleString()}`;
  if (refCards) refCards.textContent = `Live: ${raw.allCoins.cards.toLocaleString()}`;

  if (inpCoins) inpCoins.value = (ovr.economy && ovr.economy.coins !== null && ovr.economy.coins !== undefined) ? ovr.economy.coins : raw.allCoins.coins;
  if (inpDiamonds) inpDiamonds.value = (ovr.economy && ovr.economy.diamonds !== null && ovr.economy.diamonds !== undefined) ? ovr.economy.diamonds : raw.allCoins.diamonds;
  if (inpKeys) inpKeys.value = (ovr.economy && ovr.economy.keys !== null && ovr.economy.keys !== undefined) ? ovr.economy.keys : raw.allCoins.keys;
  if (inpTickets) inpTickets.value = (ovr.economy && ovr.economy.tickets !== null && ovr.economy.tickets !== undefined) ? ovr.economy.tickets : raw.allCoins.tickets;
  if (inpEggs) inpEggs.value = (ovr.economy && ovr.economy.eggs !== null && ovr.economy.eggs !== undefined) ? ovr.economy.eggs : raw.allCoins.eggs;
  if (inpCards) inpCards.value = (ovr.economy && ovr.economy.cards !== null && ovr.economy.cards !== undefined) ? ovr.economy.cards : raw.allCoins.cards;

  // 3. Goal & XP Rewards Tab
  const inpGoalRewards = document.getElementById('inpEditGoalRewardsCount');
  const inpXpRewards = document.getElementById('inpEditXpRewardsCount');
  const inpGoalUsers = document.getElementById('inpEditGoalUsersCount');
  const inpXpUsers = document.getElementById('inpEditXpUsersCount');

  const refGoalRewards = document.getElementById('refGoalRewardsCount');
  const refXpRewards = document.getElementById('refXpRewardsCount');
  const refGoalUsers = document.getElementById('refGoalUsersCount');
  const refXpUsers = document.getElementById('refXpUsersCount');

  if (refGoalRewards) refGoalRewards.textContent = `Live: ${raw.goalsXp.goalRewards.toLocaleString()}`;
  if (refXpRewards) refXpRewards.textContent = `Live: ${raw.goalsXp.xpRewards.toLocaleString()}`;
  if (refGoalUsers) refGoalUsers.textContent = `Live: ${raw.goalsXp.goalUsers.toLocaleString()}`;
  if (refXpUsers) refXpUsers.textContent = `Live: ${raw.goalsXp.xpUsers.toLocaleString()}`;

  if (inpGoalRewards) inpGoalRewards.value = (ovr.tiers && ovr.tiers.goalRewards !== null && ovr.tiers.goalRewards !== undefined) ? ovr.tiers.goalRewards : raw.goalsXp.goalRewards;
  if (inpXpRewards) inpXpRewards.value = (ovr.tiers && ovr.tiers.xpRewards !== null && ovr.tiers.xpRewards !== undefined) ? ovr.tiers.xpRewards : raw.goalsXp.xpRewards;
  if (inpGoalUsers) inpGoalUsers.value = (ovr.tiers && ovr.tiers.goalUsers !== null && ovr.tiers.goalUsers !== undefined) ? ovr.tiers.goalUsers : raw.goalsXp.goalUsers;
  if (inpXpUsers) inpXpUsers.value = (ovr.tiers && ovr.tiers.xpUsers !== null && ovr.tiers.xpUsers !== undefined) ? ovr.tiers.xpUsers : raw.goalsXp.xpUsers;

  // 4. Mini-Games & Ads Tab
  const inpSpins = document.getElementById('inpEditMiniSpins');
  const inpChests = document.getElementById('inpEditMiniChests');
  const inpScratches = document.getElementById('inpEditMiniScratches');
  const inpEggsM = document.getElementById('inpEditMiniEggs');
  const refSpins = document.getElementById('refMiniSpins');
  const refChests = document.getElementById('refMiniChests');
  const refScratches = document.getElementById('refMiniScratches');
  const refEggsM = document.getElementById('refMiniEggs');

  if (refSpins) refSpins.textContent = `Live: ${raw.miniGames.spins.toLocaleString()}`;
  if (refChests) refChests.textContent = `Live: ${raw.miniGames.chests.toLocaleString()}`;
  if (refScratches) refScratches.textContent = `Live: ${raw.miniGames.scratches.toLocaleString()}`;
  if (refEggsM) refEggsM.textContent = `Live: ${raw.miniGames.eggsHatched.toLocaleString()}`;

  if (inpSpins) inpSpins.value = (ovr.miniGames && ovr.miniGames.spins !== null && ovr.miniGames.spins !== undefined) ? ovr.miniGames.spins : raw.miniGames.spins;
  if (inpChests) inpChests.value = (ovr.miniGames && ovr.miniGames.chests !== null && ovr.miniGames.chests !== undefined) ? ovr.miniGames.chests : raw.miniGames.chests;
  if (inpScratches) inpScratches.value = (ovr.miniGames && ovr.miniGames.scratches !== null && ovr.miniGames.scratches !== undefined) ? ovr.miniGames.scratches : raw.miniGames.scratches;
  if (inpEggsM) inpEggsM.value = (ovr.miniGames && ovr.miniGames.eggs !== null && ovr.miniGames.eggs !== undefined) ? ovr.miniGames.eggs : raw.miniGames.eggsHatched;

  // 5. Targets (Monthly & Yearly)
  const inpMPlayers = document.getElementById('inpTargetMonthlyPlayers');
  const inpMTasks = document.getElementById('inpTargetMonthlyTasks');
  const inpMAds = document.getElementById('inpTargetMonthlyAds');
  const inpMRewards = document.getElementById('inpTargetMonthlyRewards');
  const inpMEconomy = document.getElementById('inpTargetMonthlyEconomy');

  if (inpMPlayers) inpMPlayers.value = targets.monthly.players;
  if (inpMTasks) inpMTasks.value = targets.monthly.tasks;
  if (inpMAds) inpMAds.value = targets.monthly.ads;
  if (inpMRewards) inpMRewards.value = targets.monthly.rewards;
  if (inpMEconomy) inpMEconomy.value = targets.monthly.economy || 5000000;

  const inpYPlayers = document.getElementById('inpTargetYearlyPlayers');
  const inpYTasks = document.getElementById('inpTargetYearlyTasks');
  const inpYAds = document.getElementById('inpTargetYearlyAds');
  const inpYRewards = document.getElementById('inpTargetYearlyRewards');
  const inpYEconomy = document.getElementById('inpTargetYearlyEconomy');

  if (inpYPlayers) inpYPlayers.value = targets.yearly.players;
  if (inpYTasks) inpYTasks.value = targets.yearly.tasks;
  if (inpYAds) inpYAds.value = targets.yearly.ads;
  if (inpYRewards) inpYRewards.value = targets.yearly.rewards;
  if (inpYEconomy) inpYEconomy.value = targets.yearly.economy || 50000000;
}

/**
 * Handle real-time input change in the modal to update preview chart
 */
function onChartEditInput(chartKey) {
  renderPreviewChart(chartKey);
}
window.onChartEditInput = onChartEditInput;

/**
 * Render Live Preview Chart inside Modal Tab
 */
function renderPreviewChart(chartKey) {
  let canvasId = '';
  let labels = [];
  let values = [];
  let colors = [];

  if (chartKey === 'task') {
    canvasId = 'chartPreviewTask';
    labels = ['Telegram Tasks ✈️', 'Monthly Quests 🏆', 'Website Quests 🌐'];
    colors = DASHBOARD_PALETTES.tasks;
    const tg = Number(document.getElementById('inpEditTaskTelegram')?.value) || 0;
    const m = Number(document.getElementById('inpEditTaskMonthly')?.value) || 0;
    const w = Number(document.getElementById('inpEditTaskWeb')?.value) || 0;
    values = [tg, m, w];
  } else if (chartKey === 'economy') {
    canvasId = 'chartPreviewEconomy';
    labels = ['Coins 🪙', 'Diamonds 💎', 'Keys 🗝️', 'Tickets 🎫', 'Eggs 🥚', 'Cards 🎴'];
    colors = DASHBOARD_PALETTES.economy;
    const c = Number(document.getElementById('inpEditEconomyCoins')?.value) || 0;
    const dm = Number(document.getElementById('inpEditEconomyDiamonds')?.value) || 0;
    const k = Number(document.getElementById('inpEditEconomyKeys')?.value) || 0;
    const tk = Number(document.getElementById('inpEditEconomyTickets')?.value) || 0;
    const eg = Number(document.getElementById('inpEditEconomyEggs')?.value) || 0;
    const cd = Number(document.getElementById('inpEditEconomyCards')?.value) || 0;
    values = [c, dm, k, tk, eg, cd];
  } else if (chartKey === 'tiers') {
    canvasId = 'chartPreviewTiers';
    labels = ['Goal Rewards 🎯', 'XP Rewards ⚡', 'Goal Users 👥', 'XP Users 🌟'];
    colors = DASHBOARD_PALETTES.tiers;
    const gr = Number(document.getElementById('inpEditGoalRewardsCount')?.value) || 0;
    const xr = Number(document.getElementById('inpEditXpRewardsCount')?.value) || 0;
    const gu = Number(document.getElementById('inpEditGoalUsersCount')?.value) || 0;
    const xu = Number(document.getElementById('inpEditXpUsersCount')?.value) || 0;
    values = [gr, xr, gu, xu];
  } else if (chartKey === 'miniGames') {
    canvasId = 'chartPreviewMiniGames';
    labels = ['Spins 🎡', 'Chests 🗝️', 'Cards 🎴', 'Eggs 🥚'];
    colors = DASHBOARD_PALETTES.miniGames;
    const sp = Number(document.getElementById('inpEditMiniSpins')?.value) || 0;
    const ch = Number(document.getElementById('inpEditMiniChests')?.value) || 0;
    const sc = Number(document.getElementById('inpEditMiniScratches')?.value) || 0;
    const eg = Number(document.getElementById('inpEditMiniEggs')?.value) || 0;
    values = [sp, ch, sc, eg];
  }

  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const total = values.reduce((sum, v) => sum + v, 0);
  const displayValues = total === 0 ? values.map(() => 1) : values;
  const previewKey = 'preview' + chartKey.charAt(0).toUpperCase() + chartKey.slice(1);

  if (typeof window.Chart !== 'undefined') {
    try {
      if (dashboardCharts[previewKey]) {
        dashboardCharts[previewKey].destroy();
      }
      const ctx = canvas.getContext('2d');
      dashboardCharts[previewKey] = new window.Chart(ctx, {
        type: 'pie',
        data: {
          labels: labels,
          datasets: [{
            data: displayValues,
            backgroundColor: colors,
            borderWidth: 1.5,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              enabled: true,
              callbacks: {
                label: function(context) {
                  const val = total === 0 ? 0 : (values[context.dataIndex] || 0);
                  const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
                  return ` ${labels[context.dataIndex]}: ${val.toLocaleString()} (${pct}%)`;
                }
              }
            }
          },
          animation: { duration: 250 }
        }
      });
    } catch (e) {
      drawSimpleCanvasPie(canvas, displayValues, colors);
    }
  } else {
    drawSimpleCanvasPie(canvas, displayValues, colors);
  }
}

function drawSimpleCanvasPie(canvas, values, colors) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width = 120;
  const h = canvas.height = 120;
  const cx = w / 2;
  const cy = h / 2;
  const radius = 52;
  const total = values.reduce((sum, v) => sum + v, 0) || 1;
  let startAngle = -Math.PI / 2;

  ctx.clearRect(0, 0, w, h);
  values.forEach((v, i) => {
    const sliceAngle = (v / total) * 2 * Math.PI;
    const endAngle = startAngle + sliceAngle;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    startAngle = endAngle;
  });
}

/**
 * Save Active Modal Changes (Target Benchmarks OR Custom Pie Chart Slices)
 */
function saveActiveModalChanges() {
  const activeTab = window.dashboardPeriodState.activeModalTab || 'monthly';

  if (activeTab === 'monthly' || activeTab === 'yearly') {
    saveTargetsToFirebase();
  } else if (activeTab === 'chart-task') {
    saveChartOverridesToFirebase('task');
  } else if (activeTab === 'chart-economy') {
    saveChartOverridesToFirebase('economy');
  } else if (activeTab === 'chart-miniGames') {
    saveChartOverridesToFirebase('miniGames');
  } else if (activeTab === 'chart-tiers') {
    saveChartOverridesToFirebase('tiers');
  }
}
window.saveActiveModalChanges = saveActiveModalChanges;

/**
 * Save custom chart slice overrides
 */
function saveChartOverridesToFirebase(chartKey) {
  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(() => performSaveChartOverrides(chartKey));
  } else {
    performSaveChartOverrides(chartKey);
  }
}

function performSaveChartOverrides(chartKey) {
  if (!window.dashboardPeriodState.chartOverrides) {
    window.dashboardPeriodState.chartOverrides = {};
  }

  let chartName = 'Pie Chart';
  if (chartKey === 'task') {
    chartName = 'Tasks';
    window.dashboardPeriodState.chartOverrides.task = {
      telegram: Math.max(0, Number(document.getElementById('inpEditTaskTelegram')?.value) || 0),
      monthly: Math.max(0, Number(document.getElementById('inpEditTaskMonthly')?.value) || 0),
      web: Math.max(0, Number(document.getElementById('inpEditTaskWeb')?.value) || 0)
    };
  } else if (chartKey === 'economy') {
    chartName = 'All Coin';
    window.dashboardPeriodState.chartOverrides.economy = {
      coins: Math.max(0, Number(document.getElementById('inpEditEconomyCoins')?.value) || 0),
      diamonds: Math.max(0, Number(document.getElementById('inpEditEconomyDiamonds')?.value) || 0),
      keys: Math.max(0, Number(document.getElementById('inpEditEconomyKeys')?.value) || 0),
      tickets: Math.max(0, Number(document.getElementById('inpEditEconomyTickets')?.value) || 0),
      eggs: Math.max(0, Number(document.getElementById('inpEditEconomyEggs')?.value) || 0),
      cards: Math.max(0, Number(document.getElementById('inpEditEconomyCards')?.value) || 0)
    };
  } else if (chartKey === 'tiers') {
    chartName = 'Goal & XP Rewards';
    window.dashboardPeriodState.chartOverrides.tiers = {
      goalRewards: Math.max(0, Number(document.getElementById('inpEditGoalRewardsCount')?.value) || 0),
      xpRewards: Math.max(0, Number(document.getElementById('inpEditXpRewardsCount')?.value) || 0),
      goalUsers: Math.max(0, Number(document.getElementById('inpEditGoalUsersCount')?.value) || 0),
      xpUsers: Math.max(0, Number(document.getElementById('inpEditXpUsersCount')?.value) || 0)
    };
  } else if (chartKey === 'miniGames') {
    chartName = 'Mini-Games & Ads';
    window.dashboardPeriodState.chartOverrides.miniGames = {
      spins: Math.max(0, Number(document.getElementById('inpEditMiniSpins')?.value) || 0),
      chests: Math.max(0, Number(document.getElementById('inpEditMiniChests')?.value) || 0),
      scratches: Math.max(0, Number(document.getElementById('inpEditMiniScratches')?.value) || 0),
      eggs: Math.max(0, Number(document.getElementById('inpEditMiniEggs')?.value) || 0)
    };
  }

  const allOverrides = window.dashboardPeriodState.chartOverrides;

  // Persist locally
  try {
    localStorage.setItem('ENERGY_TAP_CHART_OVERRIDES', JSON.stringify(allOverrides));
  } catch (e) {}

  // Persist to Firebase RTDB
  const db = (typeof window.getDb === 'function') ? window.getDb() : null;
  if (db) {
    db.ref('/analytics_config/chart_overrides').set(allOverrides)
      .then(() => {
        closeEditTargetsModal();
        refreshDashboardAnalytics();
        showQuickNotification(`💾 ${chartName} Pie Chart customized and saved to cloud!`);
      })
      .catch(err => {
        console.warn('Firebase error saving chart overrides, stored in local session:', err);
        closeEditTargetsModal();
        refreshDashboardAnalytics();
        showQuickNotification(`💾 ${chartName} Pie Chart applied in local session!`);
      });
  } else {
    closeEditTargetsModal();
    refreshDashboardAnalytics();
    showQuickNotification(`💾 ${chartName} Pie Chart applied!`);
  }
}

/**
 * Reset specific chart overrides and restore live cloud data
 */
function resetChartOverrides(chartKey) {
  if (confirm(`Reset ${chartKey} Pie Chart values back to live cloud database readouts?`)) {
    if (window.dashboardPeriodState.chartOverrides) {
      delete window.dashboardPeriodState.chartOverrides[chartKey];
    }

    try {
      localStorage.setItem('ENERGY_TAP_CHART_OVERRIDES', JSON.stringify(window.dashboardPeriodState.chartOverrides));
    } catch (e) {}

    const db = (typeof window.getDb === 'function') ? window.getDb() : null;
    if (db) {
      db.ref(`/analytics_config/chart_overrides/${chartKey}`).remove().catch(() => {});
    }

    populateModalValues();
    renderPreviewChart(chartKey);
    refreshDashboardAnalytics();
    showQuickNotification(`↺ ${chartKey} Pie Chart restored to live cloud readouts!`);
  }
}
window.resetChartOverrides = resetChartOverrides;

/**
 * Reset current tab default values
 */
function resetCurrentTabDefaults() {
  const activeTab = window.dashboardPeriodState.activeModalTab || 'monthly';
  if (activeTab === 'monthly' || activeTab === 'yearly') {
    resetTargetsToDefault();
  } else if (activeTab === 'chart-task') {
    resetChartOverrides('task');
  } else if (activeTab === 'chart-economy') {
    resetChartOverrides('economy');
  } else if (activeTab === 'chart-miniGames') {
    resetChartOverrides('miniGames');
  } else if (activeTab === 'chart-tiers') {
    resetChartOverrides('tiers');
  }
}
window.resetCurrentTabDefaults = resetCurrentTabDefaults;

/**
 * Save targets to Firebase RTDB (/analytics_config/targets) and localStorage
 */
function saveTargetsToFirebase() {
  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(performSaveTargetsToFirebase);
  } else {
    performSaveTargetsToFirebase();
  }
}
window.saveTargetsToFirebase = saveTargetsToFirebase;

function performSaveTargetsToFirebase() {
  const inpMPlayers = Number(document.getElementById('inpTargetMonthlyPlayers')?.value) || 5000;
  const inpMTasks = Number(document.getElementById('inpTargetMonthlyTasks')?.value) || 25000;
  const inpMAds = Number(document.getElementById('inpTargetMonthlyAds')?.value) || 10000;
  const inpMRewards = Number(document.getElementById('inpTargetMonthlyRewards')?.value) || 100;
  const inpMEconomy = Number(document.getElementById('inpTargetMonthlyEconomy')?.value) || 5000000;

  const inpYPlayers = Number(document.getElementById('inpTargetYearlyPlayers')?.value) || 50000;
  const inpYTasks = Number(document.getElementById('inpTargetYearlyTasks')?.value) || 250000;
  const inpYAds = Number(document.getElementById('inpTargetYearlyAds')?.value) || 100000;
  const inpYRewards = Number(document.getElementById('inpTargetYearlyRewards')?.value) || 1200;
  const inpYEconomy = Number(document.getElementById('inpTargetYearlyEconomy')?.value) || 50000000;

  const newTargets = {
    monthly: {
      players: Math.max(1, inpMPlayers),
      tasks: Math.max(1, inpMTasks),
      ads: Math.max(1, inpMAds),
      rewards: Math.max(1, inpMRewards),
      economy: Math.max(1000, inpMEconomy)
    },
    yearly: {
      players: Math.max(1, inpYPlayers),
      tasks: Math.max(1, inpYTasks),
      ads: Math.max(1, inpYAds),
      rewards: Math.max(1, inpYRewards),
      economy: Math.max(10000, inpYEconomy)
    },
    updatedAt: Date.now()
  };

  window.dashboardPeriodState.targets = newTargets;

  // Persist to localStorage
  try {
    localStorage.setItem('ENERGY_TAP_DASHBOARD_TARGETS', JSON.stringify(newTargets));
  } catch (e) {}

  // Persist to Firebase
  const db = (typeof window.getDb === 'function') ? window.getDb() : null;
  if (db) {
    db.ref('/analytics_config/targets').set(newTargets)
      .then(() => {
        closeEditTargetsModal();
        refreshDashboardAnalytics();
        showQuickNotification('💾 Monthly & Yearly targets successfully updated in Firebase cloud!');
      })
      .catch(err => {
        console.warn('Firebase error saving targets, kept in local session:', err);
        closeEditTargetsModal();
        refreshDashboardAnalytics();
        showQuickNotification('💾 Targets updated and applied in local session!');
      });
  } else {
    closeEditTargetsModal();
    refreshDashboardAnalytics();
    showQuickNotification('💾 Targets updated and applied!');
  }
}

/**
 * Reset default baseline targets
 */
function resetTargetsToDefault() {
  if (confirm('Reset Monthly and Yearly target benchmarks to factory defaults?')) {
    const inpMPlayers = document.getElementById('inpTargetMonthlyPlayers');
    const inpMTasks = document.getElementById('inpTargetMonthlyTasks');
    const inpMAds = document.getElementById('inpTargetMonthlyAds');
    const inpMRewards = document.getElementById('inpTargetMonthlyRewards');
    const inpMEconomy = document.getElementById('inpTargetMonthlyEconomy');

    if (inpMPlayers) inpMPlayers.value = 5000;
    if (inpMTasks) inpMTasks.value = 25000;
    if (inpMAds) inpMAds.value = 10000;
    if (inpMRewards) inpMRewards.value = 100;
    if (inpMEconomy) inpMEconomy.value = 5000000;

    const inpYPlayers = document.getElementById('inpTargetYearlyPlayers');
    const inpYTasks = document.getElementById('inpTargetYearlyTasks');
    const inpYAds = document.getElementById('inpTargetYearlyAds');
    const inpYRewards = document.getElementById('inpTargetYearlyRewards');
    const inpYEconomy = document.getElementById('inpTargetYearlyEconomy');

    if (inpYPlayers) inpYPlayers.value = 50000;
    if (inpYTasks) inpYTasks.value = 250000;
    if (inpYAds) inpYAds.value = 100000;
    if (inpYRewards) inpYRewards.value = 1200;
    if (inpYEconomy) inpYEconomy.value = 50000000;
  }
}
window.resetTargetsToDefault = resetTargetsToDefault;

/**
 * Handle Admin Broadcast Notification Form Submission
 */
async function handleAdminBroadcastNotification(event) {
  if (event && event.preventDefault) event.preventDefault();

  const type = document.getElementById('adminNotifType')?.value || 'global';
  const title = document.getElementById('adminNotifTitle')?.value?.trim();
  const target = document.getElementById('adminNotifTarget')?.value || 'home';
  const message = document.getElementById('adminNotifMessage')?.value?.trim();

  if (!title || !message) {
    alert('Please fill out both Title and Message.');
    return;
  }

  const targetLabels = {
    home: 'Go to Reactor',
    reward: 'Open Rewards',
    energy: 'View Cells',
    tasks: 'Quests',
    streak: 'Streak',
    leaderboard: 'Rankings',
    xp: 'Season XP'
  };

  const payload = {
    type,
    title,
    message,
    actionTarget: target,
    actionText: targetLabels[target] || 'Open View'
  };

  try {
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data && data.ok) {
      showQuickNotification('🚀 Notification broadcasted to all player inboxes!');
      document.getElementById('adminBroadcastForm')?.reset();
    } else {
      showQuickNotification('⚠️ ' + ((data && data.error) || 'Failed to broadcast notification'));
    }
  } catch (err) {
    console.warn('API broadcast error, attempting Firebase fallback:', err);
    // Firebase fallback
    const db = (typeof window.getDb === 'function') ? window.getDb() : null;
    if (db) {
      try {
        const notifRef = db.ref('/notifications').push();
        await notifRef.set({
          ...payload,
          id: notifRef.key,
          timestamp: Date.now(),
          read: false
        });
        showQuickNotification('🚀 Notification broadcasted via Firebase cloud!');
        document.getElementById('adminBroadcastForm')?.reset();
        return;
      } catch (fbErr) {
        console.error('Firebase broadcast error:', fbErr);
      }
    }
    showQuickNotification('⚠️ Broadcast submitted in local session.');
  }
}
window.handleAdminBroadcastNotification = handleAdminBroadcastNotification;

/**
 * Toast / Alert Helper
 */
function showQuickNotification(msg) {
  const existing = document.getElementById('dashQuickToast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'dashQuickToast';
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: #0f172a;
    color: #ffffff;
    font-size: 13px;
    font-weight: 700;
    padding: 12px 20px;
    border-radius: 10px;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 8px;
    border-left: 4px solid #0284c7;
    animation: fadeInToast 0.3s ease;
  `;
  toast.textContent = msg;
  document.body.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 3200);
}

// Auto-run on DOM ready
document.addEventListener('DOMContentLoaded', initDashboardPage);


/* ==================== MODULE: USERS ==================== */
/* ==========================================================================
   PAGE: USERS LOGIC (pages/users/users.js)
   - Real-time User Management directly connected to Firebase RTDB
   - Live Search (Username, Name, UID, Telegram, Referral Code)
   - Status & Wealth Filtering
   - Detailed Player Inspector & Direct Balance / Account Editing
   - Account Enable / Disable Toggle & Safe Account Deletion
   ========================================================================== */

let usersSearchQuery = '';
let userStatusFilter = 'all';
let editingPlayerUid = null;
let currentUsersView = 'all'; // 'all' | 'duplicates'

function maskPhoneNumber(phone) {
  if (!phone) return '-';
  const s = String(phone).trim();
  if (s.length <= 6) return '••••••';
  return `${s.slice(0, 3)} •••• ${s.slice(-3)}`;
}

function maskEmail(email) {
  if (!email || !email.includes('@')) return '-';
  const [user, domain] = email.split('@');
  const maskedUser = user.length <= 2 ? `${user[0]}*` : `${user[0]}***${user[user.length - 1]}`;
  return `${maskedUser}@${domain}`;
}

function switchUsersView(view) {
  currentUsersView = view;
  const allWrap = document.getElementById('allUsersTableWrap');
  const dupWrap = document.getElementById('duplicatesViewWrap');
  const btnAll = document.getElementById('btnViewAllUsers');
  const btnDup = document.getElementById('btnViewDuplicates');

  if (view === 'duplicates') {
    if (allWrap) allWrap.style.display = 'none';
    if (dupWrap) dupWrap.style.display = 'block';
    if (btnAll) { btnAll.style.background = 'transparent'; btnAll.style.color = '#64748b'; }
    if (btnDup) { btnDup.style.background = '#dc2626'; btnDup.style.color = '#fff'; }
    runDuplicateScan();
  } else {
    if (allWrap) allWrap.style.display = 'block';
    if (dupWrap) dupWrap.style.display = 'none';
    if (btnAll) { btnAll.style.background = '#0284c7'; btnAll.style.color = '#fff'; }
    if (btnDup) { btnDup.style.background = 'transparent'; btnDup.style.color = '#64748b'; }
  }
}
window.switchUsersView = switchUsersView;

function initUsersPage() {
  renderUsersTable();
  updateDuplicateCountBadge();
}

async function updateDuplicateCountBadge() {
  const badge = document.getElementById('dupBadgeCount');
  if (!badge) return;
  try {
    const res = await fetch('/api/auth/duplicates');
    if (res.ok) {
      const data = await res.json();
      const count = data.duplicates?.length || 0;
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-block' : 'none';
    }
  } catch (e) {}
}

window.addEventListener('usersUpdated', () => {
  renderUsersTable();
  updateDuplicateCountBadge();
  if (window.activeDetailsUid) {
    viewUserDetails(window.activeDetailsUid);
  }
  if (currentUsersView === 'duplicates') {
    runDuplicateScan();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  renderUsersTable();
  updateDuplicateCountBadge();
});

let _userSearchDebounceTimer = null;

/**
 * Filter users table (debounced for smooth search input)
 */
function filterUsersTable(immediate = false) {
  const searchInput = document.getElementById('userSearchInput');
  const filterSelect = document.getElementById('userStatusFilter');

  usersSearchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';
  userStatusFilter = filterSelect ? filterSelect.value : 'all';

  if (immediate) {
    if (_userSearchDebounceTimer) {
      clearTimeout(_userSearchDebounceTimer);
      _userSearchDebounceTimer = null;
    }
    renderUsersTable();
    return;
  }

  if (_userSearchDebounceTimer) {
    clearTimeout(_userSearchDebounceTimer);
  }
  _userSearchDebounceTimer = setTimeout(() => {
    _userSearchDebounceTimer = null;
    renderUsersTable();
  }, 180);
}
window.filterUsersTable = filterUsersTable;

function clearUserSearch() {
  const input = document.getElementById('userSearchInput');
  if (input) input.value = '';
  usersSearchQuery = '';
  if (_userSearchDebounceTimer) {
    clearTimeout(_userSearchDebounceTimer);
    _userSearchDebounceTimer = null;
  }
  renderUsersTable();
}
window.clearUserSearch = clearUserSearch;

/**
 * Render users table with Firebase data
 */
function renderUsersTable() {
  const tbody = document.getElementById('usersTableBody');
  const countPill = document.getElementById('plainTotalUsersCount');
  if (!tbody) return;

  const users = (window.adminState && window.adminState.users) ? window.adminState.users : [];

  if (countPill) {
    countPill.textContent = `${users.length} Players`;
  }

  // Filter users based on query and status filter
  const filtered = users.filter(u => {
    // Status / Wealth filter
    if (userStatusFilter === 'active' && u.status === 'disabled') return false;
    if (userStatusFilter === 'disabled' && u.status !== 'disabled') return false;
    if (userStatusFilter === 'highWealth' && Number(u.coins || 0) < 100000) return false;

    // Search query filter
    if (!usersSearchQuery) return true;
    const name = (u.name || '').toLowerCase();
    const displayName = (u.username || '').toLowerCase();
    const code = (u.profileCode || u.referralCode || '').toLowerCase();
    const tg = (u.telegram || u.telegramId || '').toLowerCase();
    const uid = (u.uid || u.id || '').toLowerCase();
    const mobile = (u.mobile || u.phone || '').toLowerCase();
    const email = (u.email || '').toLowerCase();

    return name.includes(usersSearchQuery) ||
           displayName.includes(usersSearchQuery) ||
           code.includes(usersSearchQuery) ||
           tg.includes(usersSearchQuery) ||
           uid.includes(usersSearchQuery) ||
           mobile.includes(usersSearchQuery) ||
           email.includes(usersSearchQuery);
  });

  // Sort users: newly added users appear at the top
  filtered.sort((a, b) => {
    const aNew = window.recentlyAddedUids && window.recentlyAddedUids.has(a.uid);
    const bNew = window.recentlyAddedUids && window.recentlyAddedUids.has(b.uid);
    if (aNew && !bNew) return -1;
    if (!aNew && bNew) return 1;
    return 0;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; color: #64748b; padding: 36px;">
          ${users.length === 0 ? 'No registered players found in Firebase.' : 'No players match your search / filter.'}
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map((u, i) => {
    const coins = Number(u.coins || 0).toLocaleString();
    const level = Number(u.level || 0);
    const xp = Number(u.xp || 0).toLocaleString();
    const isDisabled = u.status === 'disabled';
    const isRecentlyAdded = window.recentlyAddedUids && window.recentlyAddedUids.has(u.uid);
    const uidDisplay = u.uid ? (u.uid.length > 14 ? u.uid.slice(0, 12) + '...' : u.uid) : '-';

    return `
      <tr style="${isDisabled ? 'opacity: 0.65; background: rgba(239, 68, 68, 0.04);' : (isRecentlyAdded ? 'background: rgba(16, 185, 129, 0.05);' : '')}">
        <td style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #94a3b8;">${i + 1}</td>
        <td>
          <div style="display: flex; flex-direction: column;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-weight: 700; color: #0f172a;">${escapeHtmlText(u.name || u.username || 'User')}</span>
              ${isRecentlyAdded ? '<span style="background: #10b981; color: #ffffff; font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 4px;">NEW</span>' : ''}
            </div>
            <span style="font-size: 11px; color: #64748b;">@${escapeHtmlText(u.username || 'unknown')}</span>
          </div>
        </td>
        <td>
          <div style="display: flex; flex-direction: column;">
            <code style="background: #f1f5f9; padding: 2px 5px; border-radius: 4px; font-weight: 700; color: #0284c7; font-size: 10.5px;" title="${u.uid}">
              ${escapeHtmlText(uidDisplay)}
            </code>
            <span style="font-size: 11px; color: #64748b; margin-top: 2px;">TG ID: ${escapeHtmlText(u.telegramId || '-')}</span>
          </div>
        </td>
        <td>
          <div style="display: flex; flex-direction: column; font-size: 11px;">
            <span style="color: #334155; font-family: 'JetBrains Mono', monospace;">📱 ${maskPhoneNumber(u.mobile || u.phone)}</span>
            <span style="color: #64748b; font-family: 'JetBrains Mono', monospace; margin-top: 2px;">✉️ ${maskEmail(u.email)}</span>
          </div>
        </td>
        <td>
          <div style="display: flex; flex-direction: column;">
            <span style="display: inline-block; padding: 1px 7px; border-radius: 5px; background: rgba(2, 132, 199, 0.1); color: #0284c7; font-weight: 800; font-size: 11px; width: fit-content;">
              Lv.${level}
            </span>
            <span style="font-size: 10.5px; color: #a855f7; font-weight: 600; margin-top: 2px;">${xp} XP</span>
          </div>
        </td>
        <td style="font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #ca8a04;">
          ${coins}
        </td>
        <td>
          <span style="display: inline-block; font-size: 10.5px; font-weight: 800; padding: 2px 8px; border-radius: 99px; ${isDisabled ? 'background: #fee2e2; color: #dc2626;' : 'background: #dcfce7; color: #16a34a;'}">
            ${isDisabled ? 'Disabled' : 'Active'}
          </span>
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <button type="button" onclick="viewUserDetails('${u.uid}')" style="margin-right: 4px; padding: 4px 8px; font-size: 11px; border-radius: 6px; background: rgba(2, 132, 199, 0.1); color: #0284c7; border: 1px solid rgba(2, 132, 199, 0.25); font-weight: 700; cursor: pointer;">
            Details
          </button>
          <button type="button" class="btn-plain-edit" onclick="handleEditPlayerClick('${u.uid}')" style="margin-right: 4px; padding: 4px 8px; font-size: 11px;">
            Edit
          </button>
          <button type="button" onclick="toggleUserAccountStatus('${u.uid}')" title="${isDisabled ? 'Enable Account' : 'Disable Account'}" style="padding: 4px 6px; font-size: 11px; border-radius: 6px; border: 1px solid ${isDisabled ? '#10b981' : '#fca5a5'}; background: ${isDisabled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.08)'}; color: ${isDisabled ? '#059669' : '#dc2626'}; font-weight: 700; cursor: pointer;">
            ${isDisabled ? '✓' : '🔒'}
          </button>
          <button type="button" onclick="confirmDeleteUser('${u.uid}')" title="Delete User" style="margin-left: 4px; padding: 4px 6px; font-size: 11px; border-radius: 6px; border: 1px solid #fca5a5; background: rgba(239, 68, 68, 0.1); color: #dc2626; cursor: pointer;">
            🗑️
          </button>
        </td>
      </tr>
    `;
  }).join('');
}
window.renderUsersTable = renderUsersTable;

/**
 * View Detailed User Information Modal
 */
function viewUserDetails(uid) {
  window.activeDetailsUid = uid;
  const users = (window.adminState && window.adminState.users) ? window.adminState.users : [];
  const u = users.find(user => user.uid === uid);
  if (!u) return;

  const modal = document.getElementById('userDetailsModal');
  if (!modal) return;

  // Header
  const nameEl = document.getElementById('detailUsername');
  const uidEl = document.getElementById('detailUid');
  const avatarEl = document.getElementById('detailAvatar');
  const statusBadge = document.getElementById('detailStatusBadge');

  const isDisabled = u.status === 'disabled';
  if (nameEl) nameEl.textContent = `${u.name || u.username || 'Player'} (@${u.username || 'unknown'})`;
  if (uidEl) uidEl.textContent = `UID: ${u.uid}`;
  if (avatarEl) avatarEl.textContent = (u.username || u.name || 'U').charAt(0).toUpperCase();

  if (statusBadge) {
    statusBadge.textContent = isDisabled ? 'DISABLED' : 'ACTIVE';
    statusBadge.style.background = isDisabled ? '#fee2e2' : '#dcfce7';
    statusBadge.style.color = isDisabled ? '#dc2626' : '#15803d';
  }

  // Account Authorization & Linked Identifiers Card
  const tgIdEl = document.getElementById('detailAuthTgId');
  const tgUserEl = document.getElementById('detailAuthTgUsername');
  const phoneEl = document.getElementById('detailAuthPhone');
  const emailEl = document.getElementById('detailAuthEmail');
  const authStatusTag = document.getElementById('detailAuthStatusTag');
  const methodsWrap = document.getElementById('detailLinkedMethodsBadges');

  if (tgIdEl) tgIdEl.textContent = u.telegramId || '-';
  if (tgUserEl) tgUserEl.textContent = u.telegram || (u.username ? `@${u.username}` : '-');
  if (phoneEl) phoneEl.textContent = maskPhoneNumber(u.mobile || u.phone);
  if (emailEl) emailEl.textContent = maskEmail(u.email);

  if (authStatusTag) {
    if (u.telegramId || u.phoneVerified || u.emailVerified) {
      authStatusTag.textContent = 'Verified Identity';
      authStatusTag.style.background = '#dcfce7';
      authStatusTag.style.color = '#15803d';
    } else {
      authStatusTag.textContent = 'Guest / Unlinked';
      authStatusTag.style.background = '#fef3c7';
      authStatusTag.style.color = '#b45309';
    }
  }

  if (methodsWrap) {
    const badges = [];
    if (u.telegramId) {
      badges.push('<span style="font-size: 10.5px; font-weight: 700; color: #0284c7; background: rgba(2, 132, 199, 0.12); padding: 2px 7px; border-radius: 6px;">✈️ Telegram (Primary)</span>');
    }
    if (u.mobile || u.phone) {
      badges.push(`<span style="font-size: 10.5px; font-weight: 700; color: ${u.phoneVerified ? '#15803d' : '#b45309'}; background: ${u.phoneVerified ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)'}; padding: 2px 7px; border-radius: 6px;">📱 Phone ${u.phoneVerified ? 'Verified ✓' : 'Unverified'}</span>`);
    }
    if (u.email) {
      badges.push(`<span style="font-size: 10.5px; font-weight: 700; color: ${u.emailVerified ? '#15803d' : '#b45309'}; background: ${u.emailVerified ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)'}; padding: 2px 7px; border-radius: 6px;">✉️ Email ${u.emailVerified ? 'Verified ✓' : 'Unverified'}</span>`);
    }
    if (badges.length === 0) {
      badges.push('<span style="font-size: 10.5px; color: #94a3b8;">No methods linked</span>');
    }
    methodsWrap.innerHTML = badges.join('');
  }

  // Summary pills
  const codeEl = document.getElementById('detailProfileCode');
  const lvlEl = document.getElementById('detailLevel');
  const refCountEl = document.getElementById('detailReferralCount');
  const tgEl = document.getElementById('detailTelegram');

  if (codeEl) codeEl.textContent = u.referralCode || u.profileCode || '-';
  if (lvlEl) lvlEl.textContent = `Lv.${u.level || 0} (${Number(u.xp || 0).toLocaleString()} XP)`;
  if (refCountEl) refCountEl.textContent = `${Number(u.referralCount || 0).toLocaleString()} Users`;
  if (tgEl) tgEl.textContent = u.telegramId ? `ID: ${u.telegramId}` : (u.telegram || '-');

  // Currency Balances
  if (document.getElementById('detailCoins')) document.getElementById('detailCoins').textContent = Number(u.coins || 0).toLocaleString();
    if (document.getElementById('detailDiamonds')) document.getElementById('detailDiamonds').textContent = Number(u.diamonds || 0).toLocaleString();
  if (document.getElementById('detailXp')) document.getElementById('detailXp').textContent = Number(u.xp || 0).toLocaleString();
  if (document.getElementById('detailKeys')) document.getElementById('detailKeys').textContent = Number(u.chestKeys || 0).toLocaleString();
  if (document.getElementById('detailCards')) document.getElementById('detailCards').textContent = Number(u.scratchCards || 0).toLocaleString();
  if (document.getElementById('detailTickets')) document.getElementById('detailTickets').textContent = Number(u.chestTickets || 0).toLocaleString();
  if (document.getElementById('detailEggs')) document.getElementById('detailEggs').textContent = Number(u.eggs || 0).toLocaleString();

  // Tasks Quests
  if (document.getElementById('detailWebTasks')) document.getElementById('detailWebTasks').textContent = `${u.webDone || u.webTasksDone || 0} Done`;
  if (document.getElementById('detailTgTasks')) document.getElementById('detailTgTasks').textContent = `${u.tgDone || 0} Done`;
  if (document.getElementById('detailMonthlyTasks')) document.getElementById('detailMonthlyTasks').textContent = `${u.monthlyDone || 0} Done`;

  // Energy & Timestamps
  if (document.getElementById('detailEnergy')) document.getElementById('detailEnergy').textContent = `Energy: ${Number(u.currentEnergy || 1000).toLocaleString()} / ${Number(u.maxEnergy || 1000).toLocaleString()}`;
  if (document.getElementById('detailTapPower')) document.getElementById('detailTapPower').textContent = `Tap Power: ${u.tapPower || 1} | Total Taps: ${Number(u.countTaps || 0).toLocaleString()}`;
  if (document.getElementById('detailRegistrationDate')) document.getElementById('detailRegistrationDate').textContent = `Registered: ${u.joinedAt ? new Date(u.joinedAt).toLocaleString() : (u.createdAt ? new Date(u.createdAt).toLocaleString() : 'N/A')}`;
  if (document.getElementById('detailLastActive')) document.getElementById('detailLastActive').textContent = `Last Active: ${u.lastActive ? new Date(u.lastActive).toLocaleString() : 'Recent'}`;

  // Toggle status button in modal
  const btnToggle = document.getElementById('btnToggleStatusFromDetails');
  if (btnToggle) {
    btnToggle.textContent = isDisabled ? '✓ Enable Account' : '🔒 Disable Account';
    btnToggle.style.color = isDisabled ? '#059669' : '#dc2626';
    btnToggle.style.borderColor = isDisabled ? '#86efac' : '#fca5a5';
    btnToggle.onclick = () => {
      toggleUserAccountStatus(uid);
    };
  }

  // Edit button hook
  const editBtn = document.getElementById('btnEditFromDetails');
  if (editBtn) {
    editBtn.onclick = () => {
      closeUserDetailsModal();
      handleEditPlayerClick(uid);
    };
  }

  // Delete button hook
  const deleteBtn = document.getElementById('btnDeleteUserFromDetails');
  if (deleteBtn) {
    deleteBtn.onclick = () => {
      confirmDeleteUser(uid);
    };
  }

  modal.classList.add('active');
  modal.classList.add('open');
}
window.viewUserDetails = viewUserDetails;

function closeUserDetailsModal() {
  window.activeDetailsUid = null;
  const modal = document.getElementById('userDetailsModal');
  if (modal) {
    modal.classList.remove('active');
    modal.classList.remove('open');
  }
}
window.closeUserDetailsModal = closeUserDetailsModal;

/**
 * Handle Edit Player Click
 */
function handleEditPlayerClick(uid) {
  openUserEditModal(uid);
}
window.handleEditPlayerClick = handleEditPlayerClick;

/**
 * Open User Edit Modal
 */
function openUserEditModal(uid) {
  const users = (window.adminState && window.adminState.users) ? window.adminState.users : [];
  const player = users.find(u => u.uid === uid);
  if (!player) return;

  editingPlayerUid = uid;
  window.currentEditingUserUid = uid;

  const modal = document.getElementById('userEditModal');
  const nameEl = document.getElementById('editModalPlayerName');

  const inpLevel = document.getElementById('editModalLevel');
  const inpXp = document.getElementById('editModalXp');
  const inpGoalLevel = document.getElementById('editModalGoalLevel');
  const inpCoins = document.getElementById('editModalCoins');
    const inpDiamonds = document.getElementById('editModalDiamonds');
  const inpKeys = document.getElementById('editModalKeys');
  const inpCards = document.getElementById('editModalCards');
  const inpTickets = document.getElementById('editModalTickets');
  const inpEggs = document.getElementById('editModalEggs');
  const inpEnergy = document.getElementById('editModalEnergy');
  const inpStatus = document.getElementById('editModalStatus');
  const inpProfileCode = document.getElementById('editModalProfileCode');
  const inpTelegram = document.getElementById('editModalTelegram');

  if (nameEl) nameEl.textContent = `Edit Player: ${player.name || player.username} (${player.profileCode || uid.substring(0, 8)})`;
  if (inpProfileCode) inpProfileCode.value = player.profileCode || player.referralCode || '-';
  if (inpTelegram) inpTelegram.value = player.telegram || player.telegramId || player.handle || '-';

  if (inpLevel) inpLevel.value = player.level || 0;
  if (inpXp) inpXp.value = player.xp || 0;
  if (inpGoalLevel) inpGoalLevel.value = player.goalLevel || 0;
  if (inpCoins) inpCoins.value = player.coins || 0;
    if (inpDiamonds) inpDiamonds.value = player.diamonds || 0;
  if (inpKeys) inpKeys.value = player.chestKeys || 0;
  if (inpCards) inpCards.value = player.scratchCards || 0;
  if (inpTickets) inpTickets.value = player.chestTickets || 0;
  if (inpEggs) inpEggs.value = player.eggs || 0;
  if (inpEnergy) inpEnergy.value = player.currentEnergy || 1000;
  if (inpStatus) inpStatus.value = player.status || 'active';

  if (modal) modal.classList.add('active');
}
window.openUserEditModal = openUserEditModal;

function closeUserEditModal() {
  const modal = document.getElementById('userEditModal');
  if (modal) modal.classList.remove('active');
  editingPlayerUid = null;
  window.currentEditingUserUid = null;
}
window.closeUserEditModal = closeUserEditModal;

/**
 * Save Player Changes to Firebase RTDB
 */
function savePlayerEditToFirebase() {
  const uid = editingPlayerUid || window.currentEditingUserUid;
  if (!uid) return;

  const updates = {
    level: Number(document.getElementById('editModalLevel')?.value) || 0,
    coins: Number(document.getElementById('editModalCoins')?.value) || 0,
        diamonds: Number(document.getElementById('editModalDiamonds')?.value) || 0,
    chestKeys: Number(document.getElementById('editModalKeys')?.value) || 0,
    scratchCards: Number(document.getElementById('editModalCards')?.value) || 0,
    chestTickets: Number(document.getElementById('editModalTickets')?.value) || 0,
    eggs: Number(document.getElementById('editModalEggs')?.value) || 0
  };

  const xpVal = document.getElementById('editModalXp')?.value;
  if (xpVal !== undefined && xpVal !== '') updates.xp = Number(xpVal) || 0;

  const energyVal = document.getElementById('editModalEnergy')?.value;
  if (energyVal !== undefined && energyVal !== '') {
    updates.currentEnergy = Number(energyVal) || 0;
    updates.energy = Number(energyVal) || 0;
  }

  const statusVal = document.getElementById('editModalStatus')?.value || 'active';
  if (statusVal) updates.status = statusVal;

  const goalLevel = Number(document.getElementById('editModalGoalLevel')?.value) || 0;

  if (typeof window.saveUserToFirebase === 'function') {
    window.saveUserToFirebase(uid, updates, goalLevel, statusVal)
      .then(() => {
        alert('✅ Player data successfully updated in Firebase!');
        closeUserEditModal();
        if (typeof renderUsersTable === 'function') renderUsersTable();
      })
      .catch(err => {
        alert('Error saving player: ' + err.message);
      });
  } else {
    const db = window.getDb ? window.getDb() : null;
    if (!db) { alert('Firebase is not connected!'); return; }
    const batch = {
      [`/players/${uid}/player`]: updates,
      [`/players/${uid}/reactor/currentEnergy`]: updates.currentEnergy !== undefined ? updates.currentEnergy : 0,
      [`/players/${uid}/goal/level`]: goalLevel,
      [`/players/${uid}/goalState/currentLevel`]: goalLevel,
      [`/players/${uid}/progression/activeLevel`]: updates.level || 1,
      [`/players/${uid}/status`]: statusVal,
      [`/players/${uid}/player/status`]: statusVal,
      [`/players/${uid}/resetVersion`]: 8,
      [`/players/${uid}/updatedAt`]: Date.now()
    };
    db.ref().update(batch).then(() => {
      alert('✅ Player data successfully updated in Firebase!');
      closeUserEditModal();
      if (typeof renderUsersTable === 'function') renderUsersTable();
    }).catch(err => alert('Error saving player: ' + err.message));
  }
}
window.savePlayerEditToFirebase = savePlayerEditToFirebase;

/**
 * Quick Toggle User Account Status (Active <=> Disabled)
 */
function toggleUserAccountStatus(uid) {
  const users = (window.adminState && window.adminState.users) ? window.adminState.users : [];
  const player = users.find(u => u.uid === uid);
  if (!player) return;

  const currentStatus = player.status || 'active';
  const newStatus = currentStatus === 'disabled' ? 'active' : 'disabled';
  const confirmMsg = newStatus === 'disabled'
    ? `Are you sure you want to DISABLE account for "${player.name || player.username}"? The player will not be able to interact with the game.`
    : `Enable account for "${player.name || player.username}"?`;

  if (!confirm(confirmMsg)) return;

  if (typeof window.toggleUserStatus === 'function') {
    window.toggleUserStatus(uid, newStatus)
      .then(() => {
        player.status = newStatus;
        renderUsersTable();
        if (window.activeDetailsUid === uid) {
          viewUserDetails(uid);
        }
      })
      .catch(err => alert('Error toggling status: ' + err.message));
  }
}
window.toggleUserAccountStatus = toggleUserAccountStatus;

/**
 * Confirm and Delete User from Firebase
 */
function confirmDeleteUser(uid) {
  const users = (window.adminState && window.adminState.users) ? window.adminState.users : [];
  const player = users.find(u => u.uid === uid || u.id === uid);
  const name = player ? (player.name || player.username) : uid;

  const executeDelete = () => {
    if (!confirm(`⚠️ PERMANENT ACTION:\nAre you sure you want to permanently DELETE user "${name}" (${uid}) from Firebase?\n\n• Player data will be completely wiped from Firebase\n• User panel will be immediately locked & secured\n• All associated activity logs will be deleted through Firebase\n• This action cannot be undone.`)) {
      return;
    }

    const deleteFn = window.deleteUserFromFirebase;
    if (typeof deleteFn === 'function') {
      deleteFn(uid)
        .then(() => {
          alert(`✅ Player "${name}" and all associated data/activity have been permanently deleted through Firebase.\nUser panel has been secured.`);
          closeUserDetailsModal();
          closeUserEditModal();
          if (typeof renderUsersTable === 'function') renderUsersTable();
          if (typeof window.renderRealtimeActivityFeed === 'function') {
            window.renderRealtimeActivityFeed();
          }
        })
        .catch(err => alert('Error deleting player: ' + err.message));
    } else {
      const db = window.getDb ? window.getDb() : null;
      if (db) {
        db.ref('/players/' + uid).remove().then(() => {
          alert(`✅ Player "${name}" deleted from Firebase.`);
          closeUserDetailsModal();
          closeUserEditModal();
          if (typeof renderUsersTable === 'function') renderUsersTable();
        }).catch(err => alert('Error: ' + err.message));
      }
    }
  };

  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(executeDelete);
  } else {
    executeDelete();
  }
}
window.confirmDeleteUser = confirmDeleteUser;

/**
 * Restart Player Season (Level 0)
 */
function restartUserSeasonInFirebase() {
  const uid = editingPlayerUid || window.currentEditingUserUid;
  if (!uid) return;

  if (!confirm('Restart this player to Level 0 and restore reward claims?')) return;

  const db = window.getDb ? window.getDb() : null;
  if (!db) return;

  Promise.all([
    db.ref(`/players/${uid}/player/level`).set(0),
    db.ref(`/players/${uid}/player/xp`).set(0),
    db.ref(`/players/${uid}/claimedLevels`).set({})
  ]).then(() => {
    alert('Player season restarted to Level 0.');
    closeUserEditModal();
  }).catch(err => alert('Error: ' + err.message));
}
window.restartUserSeasonInFirebase = restartUserSeasonInFirebase;

/**
 * Full Reset Player
 */
function restartPlayerInFirebase() {
  const uid = editingPlayerUid || window.currentEditingUserUid;
  if (!uid) return;

  if (!confirm('⚠️ Clean ALL data for this player to fresh 0?')) return;

  const fresh = {
    level: 0,
    xp: 0,
    coins: 0,
    blueCoins: 0,
    diamonds: 0,
    chestKeys: 0,
    scratchCards: 0,
    chestTickets: 0,
    eggs: 0
  };

  const db = window.getDb ? window.getDb() : null;
  if (!db) return;

  db.ref(`/players/${uid}/player`).update(fresh)
    .then(() => {
      alert('Player reset to 0.');
      closeUserEditModal();
    })
    .catch(err => alert('Error: ' + err.message));
}
window.restartPlayerInFirebase = restartPlayerInFirebase;

/**
 * Remove / Delete Player from Edit modal
 */
function deleteUserFromModal() {
  const uid = editingPlayerUid || window.currentEditingUserUid;
  if (!uid) return;
  confirmDeleteUser(uid);
}
window.deleteUserFromModal = deleteUserFromModal;
window.removeUserFromModal = deleteUserFromModal;

function escapeHtmlText(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ==========================================================================
// POTENTIAL DUPLICATE ACCOUNTS DETECTION TOOL
// ==========================================================================
async function runDuplicateScan() {
  const container = document.getElementById('duplicateGroupsContainer');
  const badge = document.getElementById('dupBadgeCount');
  if (!container) return;

  container.innerHTML = '<div style="text-align: center; color: #64748b; padding: 24px;">🔍 Scanning accounts for duplicate Telegram IDs, phones, and emails...</div>';

  try {
    let duplicateGroups = [];
    const res = await fetch('/api/auth/duplicates');
    if (res.ok) {
      const data = await res.json();
      duplicateGroups = data.duplicates || [];
    }

    if (badge) {
      badge.textContent = duplicateGroups.length;
      badge.style.display = duplicateGroups.length > 0 ? 'inline-block' : 'none';
    }

    if (duplicateGroups.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 36px 20px; background: rgba(16, 185, 129, 0.05); border: 1.5px dashed rgba(16, 185, 129, 0.3); border-radius: 12px;">
          <div style="font-size: 28px; margin-bottom: 8px;">✨</div>
          <h4 style="font-size: 15px; font-weight: 800; color: #15803d; margin: 0 0 4px 0;">No Duplicate Accounts Found</h4>
          <p style="font-size: 12px; color: #64748b; margin: 0;">
            All registered player accounts strictly maintain unique Telegram IDs, unique mobile phone numbers, and unique email addresses!
          </p>
        </div>
      `;
      return;
    }

    const users = (window.adminState && window.adminState.users) ? window.adminState.users : [];

    container.innerHTML = duplicateGroups.map((group, gIdx) => {
      const typeLabel = group.type.toUpperCase();
      const maskedVal = group.type === 'phone' ? maskPhoneNumber(group.value) : (group.type === 'email' ? maskEmail(group.value) : group.value);

      return `
        <div style="background: #fff; border: 1.5px solid #fed7aa; border-radius: 12px; padding: 14px; margin-bottom: 14px; box-shadow: 0 2px 6px rgba(0,0,0,0.03);">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ffedd5; padding-bottom: 10px; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="background: #fee2e2; color: #dc2626; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 99px;">
                CONFLICT #${gIdx + 1}
              </span>
              <span style="font-size: 13px; font-weight: 800; color: #9a3412;">
                Shared ${typeLabel}: <code style="background: #fff7ed; padding: 2px 6px; border-radius: 4px; color: #c2410c;">${escapeHtmlText(maskedVal)}</code>
              </span>
            </div>
            <span style="font-size: 11px; font-weight: 700; color: #c2410c;">${group.count} Conflicting Accounts</span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px;">
            ${group.accounts.map(acc => {
              const u = users.find(x => x.uid === acc.uid) || acc;
              const isDisabled = u.status === 'disabled' || acc.status === 'disabled';
              return `
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; display: flex; flex-direction: column; justify-content: space-between; gap: 8px;">
                  <div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <span style="font-weight: 800; font-size: 13px; color: #0f172a;">${escapeHtmlText(acc.username || acc.name || 'Player')}</span>
                      <span style="font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 99px; ${isDisabled ? 'background: #fee2e2; color: #dc2626;' : 'background: #dcfce7; color: #16a34a;'}">
                        ${isDisabled ? 'Disabled' : 'Active'}
                      </span>
                    </div>
                    <div style="font-size: 11px; color: #64748b; font-family: 'JetBrains Mono', monospace; margin-top: 2px;">
                      UID: ${acc.uid}
                    </div>
                    <div style="display: flex; gap: 12px; font-size: 11px; color: #334155; margin-top: 6px;">
                      <span>🪙 <strong>${Number(u.coins || 0).toLocaleString()}</strong></span>
                      <span>⭐ <strong>${Number(u.xp || 0).toLocaleString()} XP</strong></span>
                      <span>Lv.<strong>${u.level || 0}</strong></span>
                    </div>
                  </div>

                  <div style="display: flex; gap: 6px; border-top: 1px dashed #cbd5e1; padding-top: 8px; margin-top: 4px; flex-wrap: wrap;">
                    <button type="button" onclick="viewUserDetails('${acc.uid}')" style="padding: 4px 8px; font-size: 11px; border-radius: 6px; background: #0284c7; color: #fff; border: none; font-weight: 700; cursor: pointer;">
                      View Details
                    </button>
                    <button type="button" onclick="toggleUserAccountStatus('${acc.uid}')" style="padding: 4px 8px; font-size: 11px; border-radius: 6px; background: ${isDisabled ? '#10b981' : '#dc2626'}; color: #fff; border: none; font-weight: 700; cursor: pointer;">
                      ${isDisabled ? 'Enable' : 'Disable'}
                    </button>
                    <button type="button" onclick="unlinkDuplicateCredential('${group.type}', '${group.value}', '${acc.uid}')" style="padding: 4px 8px; font-size: 11px; border-radius: 6px; background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; font-weight: 700; cursor: pointer;">
                      Unlink ${typeLabel}
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<div style="text-align: center; color: #dc2626; padding: 24px;">Failed to scan duplicates: ${err.message}</div>`;
  }
}

async function unlinkDuplicateCredential(type, value, uid) {
  if (!confirm(`Unlink shared ${type.toUpperCase()} from account (${uid})?\n\nThis removes the shared identifier from this account so both accounts no longer conflict. Balances and progress remain unaffected.`)) {
    return;
  }

  try {
    const res = await fetch('/api/auth/resolve-duplicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'unlink',
        targetUid: uid,
        identifierType: type,
        identifierValue: value
      })
    });
    const data = await res.json();
    if (data.ok) {
      alert(`✅ Shared ${type} successfully unlinked from account ${uid}.`);
      runDuplicateScan();
      if (typeof renderUsersTable === 'function') renderUsersTable();
    } else {
      alert('Error unlinking credential: ' + (data.error || 'Failed'));
    }
  } catch (err) {
    alert('Network error: ' + err.message);
  }
}

window.runDuplicateScan = runDuplicateScan;
window.unlinkDuplicateCredential = unlinkDuplicateCredential;

/* ==========================================================================
   ADD NEW PLAYER (REAL-TIME FIREBASE WRITE)
   ========================================================================== */

function openAddPlayerModal(prefillData = null) {
  const modal = document.getElementById('addUserModal');
  if (modal) {
    modal.classList.add('active');
    modal.classList.add('open');

    if (prefillData) {
      if (document.getElementById('inpAddUsername')) {
        document.getElementById('inpAddUsername').value = prefillData.name || prefillData.username || '';
      }
      if (document.getElementById('inpAddTelegram')) {
        document.getElementById('inpAddTelegram').value = prefillData.telegram || '';
      }
      window.currentProcessingRequestId = prefillData.requestId || null;
      window.currentProcessingOldUserId = prefillData.oldUserId || null;
    } else {
      window.currentProcessingRequestId = null;
      window.currentProcessingOldUserId = null;
    }

    const input = document.getElementById('inpAddUsername');
    if (input) input.focus();
  }
}
window.openAddPlayerModal = openAddPlayerModal;

function closeAddPlayerModal() {
  const modal = document.getElementById('addUserModal');
  if (modal) {
    modal.classList.remove('active');
    modal.classList.remove('open');
  }
  window.currentProcessingRequestId = null;
  window.currentProcessingOldUserId = null;
}
window.closeAddPlayerModal = closeAddPlayerModal;

function saveNewPlayerToFirebase(event) {
  if (event) event.preventDefault();

  const username = (document.getElementById('inpAddUsername')?.value || '').trim();
  const telegram = (document.getElementById('inpAddTelegram')?.value || '').trim();
  const level = Number(document.getElementById('inpAddLevel')?.value) || 1;
  const coins = Number(document.getElementById('inpAddCoins')?.value) || 2500;
    const diamonds = Number(document.getElementById('inpAddDiamonds')?.value) || 150;
  const keys = Number(document.getElementById('inpAddKeys')?.value) || 3;
  const tickets = Number(document.getElementById('inpAddTickets')?.value) || 2;
  const cards = Number(document.getElementById('inpAddCards')?.value) || 2;
  const eggs = Number(document.getElementById('inpAddEggs')?.value) || 1;

  if (!username) {
    alert('Please provide a Player Name / Username');
    return;
  }

  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    alert('Firebase is not connected!');
    return;
  }

  const newUid = 'user_' + Date.now();
  const profileCode = 'ET-' + String(Date.now()).slice(-6);

  const newPlayerPayload = {
    player: {
      name: username,
      username: username,
      handle: telegram.replace(/^@/, ''),
      telegram: telegram,
      profileCode: profileCode,
      referralCode: profileCode,
      level: level,
      xp: 0,
      coins: coins,
            diamonds: diamonds,
      chestKeys: keys,
      scratchCards: cards,
      chestTickets: tickets,
      eggs: eggs,
      currentEnergy: 0,
      maxEnergy: 1000,
      tapPower: 1,
      energyTaps: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      joinedAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    },
    reactor: {
      currentEnergy: 0,
      maxEnergy: 1000,
      tapPower: 1,
      energyTaps: 0
    },
    goal: {
      level: 0
    },
    updatedAt: Date.now()
  };

  const btn = document.getElementById('btnSubmitAddPlayer');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Saving to Cloud...';
  }

  db.ref('/players/' + newUid).set(newPlayerPayload)
    .then(() => {
      closeAddPlayerModal();
      if (btn) {
        btn.disabled = false;
        btn.textContent = '💾 Create & Save Player';
      }
      // Record as recently added
      window.recentlyAddedUids = window.recentlyAddedUids || new Set();
      window.recentlyAddedUids.add(newUid);

      alert(`✅ Player "${username}" successfully created in Firebase with UID: ${newUid}!`);

      // Open details modal automatically for the new user
      setTimeout(() => {
        if (typeof viewUserDetails === 'function') {
          viewUserDetails(newUid);
        }
      }, 300);
    })
    .catch(err => {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '💾 Create & Save Player';
      }
      alert('Firebase write error: ' + err.message);
    });
}
window.saveNewPlayerToFirebase = saveNewPlayerToFirebase;

/* ==========================================================================
   EDIT PLAYER MODAL & ALL BALANCES / EVENT RESOURCES FIREBASE CONTROLLER
   ========================================================================== */
function openEditPlayerModal(uid) {
  if (!uid) return;
  const users = (window.adminState && window.adminState.users) ? window.adminState.users : [];
  const u = users.find(user => user.uid === uid);
  if (!u) {
    alert('Player not found in local cache: ' + uid);
    return;
  }

  const raw = u.raw || {};
  const pl = raw.player || raw || {};
  const reactor = raw.reactor || {};
  const sf = raw.sunflowerState || pl.sunflowerState || {};
  const bee = raw.beeState || pl.beeState || {};
  const mining = raw.miningState || pl.miningState || {};

  // Populate title & UID
  const titleEl = document.getElementById('editModalPlayerTitle');
  const uidSubEl = document.getElementById('editModalPlayerUid');
  const uidInp = document.getElementById('editInpUid');

  if (titleEl) titleEl.textContent = `Edit Player: ${u.username || u.name || 'Player'}`;
  if (uidSubEl) uidSubEl.textContent = `UID: ${u.uid}`;
  if (uidInp) uidInp.value = u.uid;

  // Helpers
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = (val !== undefined && val !== null) ? val : 0;
  };

  const usernameInp = document.getElementById('editInpUsername');
  const statusInp = document.getElementById('editInpStatus');
  if (usernameInp) usernameInp.value = u.username || u.name || '';
  if (statusInp) statusInp.value = (u.status || 'active').toLowerCase();

  setVal('editInpLevel', u.level || pl.level || 1);
  setVal('editInpXp', u.xp || pl.xp || 0);

  // Section 2: Currencies
  setVal('editInpCoins', u.coins !== undefined ? u.coins : (pl.coins || 0));
  setVal('editInpDiamonds', u.diamonds !== undefined ? u.diamonds : (pl.diamonds || 0));
  setVal('editInpEnergy', reactor.currentEnergy !== undefined ? reactor.currentEnergy : (u.currentEnergy || 0));
  setVal('editInpTapPower', reactor.tapPower !== undefined ? reactor.tapPower : (u.tapPower || 1));

  // Section 3: Chests & items
  setVal('editInpKeys', u.chestKeys !== undefined ? u.chestKeys : (pl.chestKeys || 0));
  setVal('editInpTickets', u.chestTickets !== undefined ? u.chestTickets : (pl.chestTickets || 0));
  setVal('editInpCards', u.scratchCards !== undefined ? u.scratchCards : (pl.scratchCards || 0));
  setVal('editInpEggs', u.eggs !== undefined ? u.eggs : (pl.eggs || 0));
  setVal('editInpBoom', pl.boomCoins !== undefined ? pl.boomCoins : (pl.boom || 0));
  setVal('editInpBrain', pl.brainCoins !== undefined ? pl.brainCoins : (pl.brain || 0));

  // Section 4: Sunflower Valley
  setVal('editInpSfCoins', sf.coins !== undefined ? sf.coins : 0);
  setVal('editInpSfSeeds', sf.seeds !== undefined ? sf.seeds : 3);
  setVal('editInpSfBuckets', sf.baskets !== undefined ? sf.baskets : (sf.buckets || 2));
  setVal('editInpSfShovels', sf.shovels !== undefined ? sf.shovels : 1);
  setVal('editInpSfPrestige', sf.prestigeLevel !== undefined ? sf.prestigeLevel : 1);

  // Section 5: Bee & Mining
  setVal('editInpHoney', bee.honey !== undefined ? bee.honey : (pl.honey || 0));
  setVal('editInpLarvae', bee.larvae !== undefined ? bee.larvae : (pl.larvae || 0));
  setVal('editInpPollen', bee.pollen !== undefined ? bee.pollen : (pl.pollen || 0));

  setVal('editInpMiningShards', mining.shards !== undefined ? mining.shards : (pl.miningShards || 0));
  setVal('editInpMiningPlasma', mining.plasma !== undefined ? mining.plasma : (pl.miningPlasma || 0));
  setVal('editInpMiningCoolant', mining.coolant !== undefined ? mining.coolant : (pl.miningCoolant || 0));
  setVal('editInpMiningPickaxes', mining.pickaxes !== undefined ? mining.pickaxes : (pl.pickaxes || 0));

  const modal = document.getElementById('editPlayerModal');
  if (modal) {
    modal.style.display = 'flex';
    modal.classList.add('open');
  }
}
window.openEditPlayerModal = openEditPlayerModal;
window.handleEditPlayerClick = openEditPlayerModal;

function closeEditPlayerModal() {
  const modal = document.getElementById('editPlayerModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('open');
  }
}
window.closeEditPlayerModal = closeEditPlayerModal;

function saveEditedPlayerToFirebase(event) {
  if (event) event.preventDefault();

  const uid = document.getElementById('editInpUid')?.value;
  if (!uid) {
    alert('Missing user UID');
    return;
  }

  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    alert('Firebase is not connected. Please check configuration.');
    return;
  }

  const getNum = (id, def = 0) => {
    const el = document.getElementById(id);
    return el ? (Number(el.value) || def) : def;
  };
  const getStr = (id, def = '') => {
    const el = document.getElementById(id);
    return el ? (el.value.trim() || def) : def;
  };

  const username = getStr('editInpUsername', 'Player');
  const status = getStr('editInpStatus', 'active');
  const level = getNum('editInpLevel', 1);
  const xp = getNum('editInpXp', 0);

  const coins = getNum('editInpCoins', 0);
  const diamonds = getNum('editInpDiamonds', 0);
  const energy = getNum('editInpEnergy', 0);
  const tapPower = getNum('editInpTapPower', 1);

  const keys = getNum('editInpKeys', 0);
  const tickets = getNum('editInpTickets', 0);
  const cards = getNum('editInpCards', 0);
  const eggs = getNum('editInpEggs', 0);
  const boom = getNum('editInpBoom', 0);
  const brain = getNum('editInpBrain', 0);

  const sfCoins = getNum('editInpSfCoins', 0);
  const sfSeeds = getNum('editInpSfSeeds', 0);
  const sfBuckets = getNum('editInpSfBuckets', 0);
  const sfShovels = getNum('editInpSfShovels', 0);
  const sfPrestige = getNum('editInpSfPrestige', 1);

  const honey = getNum('editInpHoney', 0);
  const larvae = getNum('editInpLarvae', 0);
  const pollen = getNum('editInpPollen', 0);

  const miningShards = getNum('editInpMiningShards', 0);
  const miningPlasma = getNum('editInpMiningPlasma', 0);
  const miningCoolant = getNum('editInpMiningCoolant', 0);
  const miningPickaxes = getNum('editInpMiningPickaxes', 0);

  const updates = {
    'player/username': username,
    'player/name': username,
    'player/status': status,
    'player/level': level,
    'player/xp': xp,
    'player/coins': coins,
    'player/diamonds': diamonds,
    'player/chestKeys': keys,
    'player/chestTickets': tickets,
    'player/scratchCards': cards,
    'player/eggs': eggs,
    'player/boomCoins': boom,
    'player/brainCoins': brain,
    'player/currentEnergy': energy,
    'player/tapPower': tapPower,

    'reactor/currentEnergy': energy,
    'reactor/tapPower': tapPower,

    'sunflowerState/coins': sfCoins,
    'sunflowerState/seeds': sfSeeds,
    'sunflowerState/baskets': sfBuckets,
    'sunflowerState/shovels': sfShovels,
    'sunflowerState/prestigeLevel': sfPrestige,

    'beeState/honey': honey,
    'beeState/larvae': larvae,
    'beeState/pollen': pollen,

    'miningState/shards': miningShards,
    'miningState/plasma': miningPlasma,
    'miningState/coolant': miningCoolant,
    'miningState/pickaxes': miningPickaxes,

    'coins': coins,
    'diamonds': diamonds,
    'level': level,
    'status': status,
    'updatedAt': Date.now()
  };

  const btn = document.getElementById('btnSubmitEditPlayer');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Saving to Firebase...';
  }

  db.ref('/players/' + uid).update(updates)
    .then(() => {
      // Also update /users node if exists
      db.ref('/users/' + uid).update({
        username,
        status,
        coins,
        diamonds,
        level,
        updatedAt: Date.now()
      }).catch(() => {});

      closeEditPlayerModal();
      if (btn) {
        btn.disabled = false;
        btn.textContent = '💾 Save All Changes to Firebase';
      }

      // Update local state immediately
      const users = (window.adminState && window.adminState.users) ? window.adminState.users : [];
      const userIdx = users.findIndex(u => u.uid === uid);
      if (userIdx !== -1) {
        users[userIdx].username = username;
        users[userIdx].status = status;
        users[userIdx].level = level;
        users[userIdx].xp = xp;
        users[userIdx].coins = coins;
        users[userIdx].diamonds = diamonds;
        users[userIdx].chestKeys = keys;
        users[userIdx].chestTickets = tickets;
        users[userIdx].scratchCards = cards;
        users[userIdx].eggs = eggs;
        renderUsersTable();
      }

      if (typeof showAdminToast === 'function') {
        showAdminToast(`Player ${username} updated successfully in Firebase!`, 'success');
      } else {
        alert(`✅ Player "${username}" updated successfully in Firebase!`);
      }

      if (window.activeDetailsUid === uid && typeof viewUserDetails === 'function') {
        viewUserDetails(uid);
      }
    })
    .catch(err => {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '💾 Save All Changes to Firebase';
      }
      alert('Firebase update error: ' + err.message);
    });
}
window.saveEditedPlayerToFirebase = saveEditedPlayerToFirebase;

// Wire up the button in the details modal
document.addEventListener('DOMContentLoaded', () => {
  const btnEdit = document.getElementById('btnEditFromDetails');
  if (btnEdit) {
    btnEdit.addEventListener('click', () => {
      if (window.activeDetailsUid) {
        openEditPlayerModal(window.activeDetailsUid);
      }
    });
  }
});



/* ==================== MODULE: ACCOUNT-REQUESTS ==================== */
/* ==========================================================================
   PAGE: ACCOUNT CREATION REQUESTS (pages/account-requests/account-requests.js)
   - Real-time Account Request Management connected to Firebase RTDB
   - Allows admin to review requests from users whose accounts were deleted
   - 1-click review & user creation into Firebase /players
   ========================================================================== */

let accountRequestsFilter = 'all';

function filterAccountRequests(status) {
  accountRequestsFilter = status;
  const buttons = document.querySelectorAll('.acc-req-filter-btn');
  buttons.forEach(btn => {
    btn.classList.remove('active');
  });

  const activeBtnMap = {
    all: document.getElementById('btnAccReqAll'),
    pending: document.getElementById('btnAccReqPending'),
    approved: document.getElementById('btnAccReqApproved'),
    rejected: document.getElementById('btnAccReqRejected')
  };
  if (activeBtnMap[status]) activeBtnMap[status].classList.add('active');

  renderAccountRequestsTable();
}
window.filterAccountRequests = filterAccountRequests;

window.addEventListener('accountRequestsUpdated', () => {
  renderAccountRequestsTable();
});

document.addEventListener('DOMContentLoaded', () => {
  renderAccountRequestsTable();
});

function renderAccountRequestsTable() {
  const tbody = document.getElementById('accountRequestsTableBody');
  if (!tbody) return;

  const requests = (window.adminState && window.adminState.accountRequests)
    ? window.adminState.accountRequests
    : [];

  const countPill = document.getElementById('accountRequestsCountPill');
  if (countPill) countPill.textContent = `${requests.length} Requests`;

  const pendingCount = requests.filter(r => (r.status || 'pending').toLowerCase() === 'pending').length;
  const subPendingBadge = document.getElementById('subBadgeReqPending');
  if (subPendingBadge) {
    subPendingBadge.textContent = pendingCount;
    subPendingBadge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
  }

  const filtered = requests.filter(r => {
    const s = (r.status || 'pending').toLowerCase();
    if (accountRequestsFilter === 'all') return true;
    return s === accountRequestsFilter.toLowerCase();
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; color: #64748b; padding: 36px;">
          No account creation requests found in "${accountRequestsFilter}" status.
        </td>
      </tr>
    `;
    return;
  }

  let html = '';
  filtered.forEach(r => {
    const status = (r.status || 'pending').toLowerCase();
    let statusPill = `<span class="badge-amber" style="padding: 2px 8px; border-radius: 99px; font-size: 11px;">⏳ Pending</span>`;

    if (status === 'approved') {
      statusPill = `<span style="background: rgba(16, 185, 129, 0.15); color: #059669; border: 1px solid rgba(16, 185, 129, 0.3); padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 700;">✅ Approved</span>`;
    } else if (status === 'rejected') {
      statusPill = `<span style="background: rgba(239, 68, 68, 0.15); color: #dc2626; border: 1px solid rgba(239, 68, 68, 0.3); padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 700;">❌ Rejected</span>`;
    }

    const dateStr = r.dateStr || (r.requestedAt ? new Date(r.requestedAt).toLocaleString() : 'Recent');
    const oldUid = r.oldUserId || '-';
    const reasonText = r.reason || 'Requested account creation';

    html += `
      <tr>
        <!-- Req ID -->
        <td>
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 11.5px; color: #0284c7; font-weight: 700;">
            #${escapeReqHtml((r.id || 'REQ').substring(0, 10))}
          </div>
        </td>

        <!-- Date -->
        <td>
          <span style="font-size: 11.5px; color: #64748b;">${escapeReqHtml(dateStr)}</span>
        </td>

        <!-- Player Name -->
        <td>
          <strong style="font-size: 13px; color: #0f172a;">${escapeReqHtml(r.name || 'Player')}</strong>
        </td>

        <!-- Telegram / Contact -->
        <td>
          <code style="font-size: 11.5px; color: #0284c7; background: rgba(2, 132, 199, 0.08); padding: 1px 6px; border-radius: 4px;">
            ${escapeReqHtml(r.telegram || r.username || '-')}
          </code>
          ${r.phone ? `<div style="font-size: 10.5px; color: #64748b; margin-top: 2px;">📞 ${escapeReqHtml(r.phone)}</div>` : ''}
        </td>

        <!-- Old UID -->
        <td>
          <code style="font-size: 10px; color: #64748b; background: #f1f5f9; padding: 1px 4px; border-radius: 3px;" title="${oldUid}">
            ${escapeReqHtml(oldUid.length > 12 ? oldUid.slice(0, 10) + '...' : oldUid)}
          </code>
        </td>

        <!-- Reason -->
        <td>
          <div style="font-size: 11.5px; color: #334155; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeReqHtml(reasonText)}">
            ${escapeReqHtml(reasonText)}
          </div>
        </td>

        <!-- Status -->
        <td>
          ${statusPill}
        </td>

        <!-- Actions -->
        <td style="text-align: right;">
          <div style="display: flex; gap: 6px; justify-content: flex-end;">
            ${status === 'pending' ? `
              <button type="button" class="acc-req-action-btn acc-req-btn-approve" onclick="reviewAndCreateUserFromRequest('${r.id}')" title="Review details and create account directly in Firebase">
                <span>➕</span> <span>Create User</span>
              </button>
              <button type="button" class="acc-req-action-btn acc-req-btn-reject" onclick="rejectAccountRequest('${r.id}')" title="Reject request">
                <span>✕</span> <span>Reject</span>
              </button>
            ` : `
              <button type="button" class="acc-req-action-btn" style="background: #f1f5f9; color: #475569;" onclick="reviewAndCreateUserFromRequest('${r.id}')" title="View details">
                <span>👁️</span> <span>View / Re-add</span>
              </button>
            `}
            <button type="button" class="acc-req-action-btn acc-req-btn-delete" onclick="deleteAccountRequest('${r.id}')" title="Permanently delete request">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}
window.renderAccountRequestsTable = renderAccountRequestsTable;

function escapeReqHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function reviewAndCreateUserFromRequest(reqId) {
  const requests = (window.adminState && window.adminState.accountRequests) || [];
  const req = requests.find(r => r.id === reqId);
  if (!req) return;

  // Switch to users view and open prefilled Add User modal
  if (typeof switchAdminPage === 'function') {
    switchAdminPage('users', 'User Analytics & Players');
  }

  setTimeout(() => {
    if (typeof openAddPlayerModal === 'function') {
      openAddPlayerModal({
        name: req.name || '',
        username: req.username || req.name || '',
        telegram: req.telegram || '',
        requestId: req.id,
        oldUserId: req.oldUserId
      });
    }
  }, 150);
}
window.reviewAndCreateUserFromRequest = reviewAndCreateUserFromRequest;

function rejectAccountRequest(reqId) {
  if (!confirm(`Are you sure you want to REJECT account request #${reqId}?`)) return;

  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    alert('Firebase is not connected!');
    return;
  }

  db.ref(`account_requests/${reqId}`).update({
    status: 'rejected',
    rejectedAt: Date.now()
  }).then(() => {
    alert('Request marked as rejected.');
    renderAccountRequestsTable();
  }).catch(err => alert('Error: ' + err.message));
}
window.rejectAccountRequest = rejectAccountRequest;

function deleteAccountRequest(reqId) {
  if (!confirm(`Permanently remove account request #${reqId}?`)) return;

  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    alert('Firebase is not connected!');
    return;
  }

  db.ref(`account_requests/${reqId}`).remove().then(() => {
    renderAccountRequestsTable();
  }).catch(err => alert('Error: ' + err.message));
}
window.deleteAccountRequest = deleteAccountRequest;


/* ==================== MODULE: MEGA-ADD ==================== */
/* ==========================================================================
   PAGE: MEGA REWARDS & CUSTOM REQUESTS LOGIC (pages/mega-add/mega-add.js)
   ========================================================================== */

// 8 Standard Categories (Custom is a separate tab, NOT a standard category)
const MEGA_CATEGORIES = [
  { id: 'gift-card', name: 'Gift Card', icon: '🎁', tag: 'VOUCHER' },
  { id: 'gadgets', name: 'Gadgets', icon: '📱', tag: 'SMART TECH' },
  { id: 'accessories', name: 'Accessories', icon: '🎒', tag: 'EDC GEAR' },
  { id: 'gaming-tool', name: 'Gaming Tool', icon: '🎮', tag: 'PRO GAMING' },
  { id: 'kitchen', name: 'Kitchen', icon: '☕', tag: 'GOURMET' },
  { id: 'stationery', name: 'Stationery', icon: '✒️', tag: 'STUDIO' },
  { id: 'fitness', name: 'Fitness', icon: '🏋️', tag: 'ATHLETICS' },
  { id: 'home-decorate', name: 'Home Decorate', icon: '🏠', tag: 'INTERIOR' }
];

let selectedCategory = 'gift-card';
let editingRewardId = null;
let activeMegaTab = 'standard';
let customRequestsFilter = 'all';

// Real-time Event Listeners
window.addEventListener('rewardsUpdated', () => {
  renderRewardsCatalog();
});

window.addEventListener('customRequestsUpdated', () => {
  updateCustomReqBadge();
  if (activeMegaTab === 'custom') {
    renderCustomRequestsTable();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  initCategoryDropdown();
  renderRewardsCatalog();
  renderCustomRequestsTable();
  // Attach live input listeners to clear error styling on compulsory fields
  ['inpRewardTitle', 'inpRewardBuyerStar', 'inpRewardDiamonds', 'inpRewardRealVal', 'inpRewardOfferVal', 'inpRewardLink', 'inpRewardImage'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        el.style.borderColor = '';
        el.style.boxShadow = '';
      });
    }
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    const wrap = document.getElementById('categoryDropdownWrap');
    if (wrap && !wrap.contains(e.target)) {
      const menu = document.getElementById('categoryDropdownMenu');
      const arrow = document.getElementById('catSelectArrow');
      if (menu) menu.classList.remove('show');
      if (arrow) arrow.classList.remove('open');
    }
  });
});

/* ==========================================================================
   CATEGORY DROPDOWN LOGIC
   ========================================================================== */

function initCategoryDropdown() {
  const menu = document.getElementById('categoryDropdownMenu');
  if (!menu) return;

  menu.innerHTML = MEGA_CATEGORIES.map(cat => `
    <div class="category-dropdown-item ${cat.id === selectedCategory ? 'active' : ''}" onclick="selectCategory('${cat.id}')">
      <div class="cat-item-left">
        <span class="cat-item-icon">${cat.icon}</span>
        <span class="cat-item-name">${cat.name}</span>
      </div>
      <span class="cat-item-tag">${cat.tag}</span>
    </div>
  `).join('');

  updateCategoryDropdownButton();
}

function toggleCategoryDropdown() {
  const menu = document.getElementById('categoryDropdownMenu');
  const arrow = document.getElementById('catSelectArrow');
  if (!menu) return;

  const isOpen = menu.classList.toggle('show');
  if (arrow) arrow.classList.toggle('open', isOpen);
}

function selectCategory(catId) {
  selectedCategory = catId;
  const menu = document.getElementById('categoryDropdownMenu');
  const arrow = document.getElementById('catSelectArrow');
  if (menu) menu.classList.remove('show');
  if (arrow) arrow.classList.remove('open');

  updateCategoryDropdownButton();
  initCategoryDropdown();

  // If user is on custom tab, switch to standard edit form
  if (activeMegaTab !== 'standard') {
    switchMegaAddTab('standard');
  }

  const catObj = MEGA_CATEGORIES.find(c => c.id === catId);
  const tagInp = document.getElementById('inpRewardTag');
  if (tagInp && !tagInp.value) {
    tagInp.value = catObj ? catObj.tag : 'SPECIAL';
  }
}

function updateCategoryDropdownButton() {
  const catObj = MEGA_CATEGORIES.find(c => c.id === selectedCategory) || MEGA_CATEGORIES[0];
  const iconEl = document.getElementById('selectedCatIcon');
  const nameEl = document.getElementById('selectedCatName');
  if (iconEl) iconEl.textContent = catObj.icon;
  if (nameEl) nameEl.textContent = catObj.name;
}

/* ==========================================================================
   TAB SWITCHER: STANDARD VS CUSTOM REQUESTS
   ========================================================================== */

function switchMegaAddTab(tab) {
  activeMegaTab = tab;
  const btnStandard = document.getElementById('tabBtnMegaStandard');
  const btnCustom = document.getElementById('tabBtnMegaCustom');
  const secStandard = document.getElementById('megaStandardSection');
  const secCustom = document.getElementById('megaCustomSection');

  if (tab === 'standard') {
    if (btnStandard) btnStandard.classList.add('active');
    if (btnCustom) btnCustom.classList.remove('active');
    if (secStandard) secStandard.style.display = 'block';
    if (secCustom) secCustom.style.display = 'none';
  } else {
    if (btnStandard) btnStandard.classList.remove('active');
    if (btnCustom) btnCustom.classList.add('active');
    if (secStandard) secStandard.style.display = 'none';
    if (secCustom) secCustom.style.display = 'block';
    renderCustomRequestsTable();
  }
}

function updateCustomReqBadge() {
  const badge = document.getElementById('customReqBadge');
  const requests = window.adminState.customRequests || [];
  const pending = requests.filter(r => (r.status || 'pending').toLowerCase() === 'pending').length;
  if (badge) {
    badge.textContent = pending > 0 ? pending : requests.length;
  }
}

/* ==========================================================================
   STANDARD REWARD FORM: SAVE WITH 7 COMPULSORY FIELDS
   1. Product Name
   2. Buyer Star
   3. Diamond Cost
   4. Real Value
   5. Offer Value
   6. Product Link
   7. Image URL
   ========================================================================== */

function saveRewardToFirebase() {
  const executeSave = () => {
    const db = window.getDb ? window.getDb() : null;
    if (!db) {
      alert('Firebase is not connected!');
      return;
    }

    const elTitle = document.getElementById('inpRewardTitle');
    const elBuyerStar = document.getElementById('inpRewardBuyerStar');
    const elDiamonds = document.getElementById('inpRewardDiamonds');
    const elRealVal = document.getElementById('inpRewardRealVal');
    const elOfferVal = document.getElementById('inpRewardOfferVal');
    const elLink = document.getElementById('inpRewardLink');
    const elImg = document.getElementById('inpRewardImage');

    const title = (elTitle?.value || '').trim();
    const buyerStar = Number(elBuyerStar?.value) || 0;
    const diamonds = Number(elDiamonds?.value) || 0;
    const realVal = (elRealVal?.value || '').trim();
    const offerVal = (elOfferVal?.value || '').trim();
    const link = (elLink?.value || '').trim();
    const img = (elImg?.value || '').trim();

    const stock = Number(document.getElementById('inpRewardStock')?.value) || 15;
    const tag = (document.getElementById('inpRewardTag')?.value || '').trim();
    const desc = (document.getElementById('inpRewardDesc')?.value || '').trim();

    // Reset validation error styles
    [elTitle, elBuyerStar, elDiamonds, elRealVal, elOfferVal, elLink, elImg].forEach(el => {
      if (el) {
        el.style.borderColor = '';
        el.style.boxShadow = '';
      }
    });

    // STRICT COMPULSORY VALIDATION (All 7 Fields Required)
    const missing = [];
    let firstInvalidEl = null;

    if (!title) {
      missing.push('Product Name');
      if (elTitle) { elTitle.style.borderColor = '#ef4444'; elTitle.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.15)'; }
      if (!firstInvalidEl) firstInvalidEl = elTitle;
    }
    if (!buyerStar || buyerStar < 1 || buyerStar > 5) {
      missing.push('Buyer Star (1.0 to 5.0 ⭐)');
      if (elBuyerStar) { elBuyerStar.style.borderColor = '#ef4444'; elBuyerStar.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.15)'; }
      if (!firstInvalidEl) firstInvalidEl = elBuyerStar;
    }
    if (!diamonds || diamonds <= 0) {
      missing.push('Diamond Cost (💎)');
      if (elDiamonds) { elDiamonds.style.borderColor = '#ef4444'; elDiamonds.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.15)'; }
      if (!firstInvalidEl) firstInvalidEl = elDiamonds;
    }
    if (!realVal) {
      missing.push('Real Value (e.g. $249)');
      if (elRealVal) { elRealVal.style.borderColor = '#ef4444'; elRealVal.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.15)'; }
      if (!firstInvalidEl) firstInvalidEl = elRealVal;
    }
    if (!offerVal) {
      missing.push('Offer Value (e.g. $199)');
      if (elOfferVal) { elOfferVal.style.borderColor = '#ef4444'; elOfferVal.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.15)'; }
      if (!firstInvalidEl) firstInvalidEl = elOfferVal;
    }
    if (!link) {
      missing.push('Product Link (🔗 URL)');
      if (elLink) { elLink.style.borderColor = '#ef4444'; elLink.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.15)'; }
      if (!firstInvalidEl) firstInvalidEl = elLink;
    }
    if (!img) {
      missing.push('Image URL (🖼️)');
      if (elImg) { elImg.style.borderColor = '#ef4444'; elImg.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.15)'; }
      if (!firstInvalidEl) firstInvalidEl = elImg;
    }

    if (missing.length > 0) {
      if (firstInvalidEl) {
        firstInvalidEl.focus();
        firstInvalidEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      alert(`⚠️ All 7 Compulsory Fields Required to Save Reward:\n\n` + missing.map(m => `• ${m}`).join('\n') + `\n\nPlease fill in every required field before submitting to Firebase.`);
      return;
    }

    const catObj = MEGA_CATEGORIES.find(c => c.id === selectedCategory) || MEGA_CATEGORIES[0];
    let rewards = [...(window.adminState.rewards || [])];

    const tasksNeeded = Number(document.getElementById('inpRewardTasksNeeded')?.value) || 0;

    const rewardPayload = {
      title,
      name: title,
      productName: title,
      buyerStar: Number(buyerStar),
      stars: Number(buyerStar),
      rating: Number(buyerStar),
      category: selectedCategory,
      categoryName: catObj.name,
      categoryIcon: catObj.icon,
      diamonds: Number(diamonds),
      diamondCost: Number(diamonds),
      tasksNeeded: Number(tasksNeeded),
      requiredWebTasks: Number(tasksNeeded),
      realValue: realVal,
      originalPrice: realVal,
      mrp: realVal,
      offerValue: offerVal,
      cashValue: offerVal,
      discountPrice: offerVal,
      link: link,
      productLink: link,
      url: link,
      imageUrl: img,
      image: img,
      img: img,
      stock: stock >= 0 ? stock : 15,
      description: desc || `${title} - rated ${buyerStar} stars by verified buyers.`,
      tag: tag || catObj.tag,
      active: true,
      updatedAt: new Date().toISOString()
    };

    if (editingRewardId) {
      const idx = rewards.findIndex(r => r.id === editingRewardId);
      if (idx !== -1) {
        rewards[idx] = {
          ...rewards[idx],
          ...rewardPayload
        };
      }
      editingRewardId = null;
      document.getElementById('rewardFormTitle').textContent = 'Add New Mega Reward';
      document.getElementById('btnSaveReward').textContent = 'Save Reward to Firebase';
    } else {
      const newReward = {
        id: 'reward_' + Date.now(),
        ...rewardPayload,
        createdAt: new Date().toISOString()
      };
      rewards.unshift(newReward);
    }

    db.ref('/mega_rewards').set(rewards)
      .then(() => {
        window.adminState.rewards = rewards;
        clearRewardForm();
        renderRewardsCatalog();
        alert('✅ Reward successfully saved to Firebase (/mega_rewards) with all 7 compulsory fields!');
      })
      .catch(err => alert('Firebase error: ' + err.message));
  };

  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(executeSave);
  } else {
    executeSave();
  }
}

function clearRewardForm() {
  editingRewardId = null;
  ['inpRewardTitle', 'inpRewardBuyerStar', 'inpRewardDiamonds', 'inpRewardRealVal', 'inpRewardOfferVal', 'inpRewardLink', 'inpRewardImage'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.borderColor = '';
      el.style.boxShadow = '';
    }
  });

  if (document.getElementById('inpRewardTitle')) document.getElementById('inpRewardTitle').value = '';
  if (document.getElementById('inpRewardBuyerStar')) document.getElementById('inpRewardBuyerStar').value = '';
  if (document.getElementById('inpRewardDiamonds')) document.getElementById('inpRewardDiamonds').value = '';
  if (document.getElementById('inpRewardRealVal')) document.getElementById('inpRewardRealVal').value = '';
  if (document.getElementById('inpRewardOfferVal')) document.getElementById('inpRewardOfferVal').value = '';
  if (document.getElementById('inpRewardTasksNeeded')) document.getElementById('inpRewardTasksNeeded').value = '0';
  if (document.getElementById('inpRewardStock')) document.getElementById('inpRewardStock').value = '15';
  if (document.getElementById('inpRewardDesc')) document.getElementById('inpRewardDesc').value = '';
  if (document.getElementById('inpRewardTag')) document.getElementById('inpRewardTag').value = '';
  if (document.getElementById('inpRewardLink')) document.getElementById('inpRewardLink').value = '';
  if (document.getElementById('inpRewardImage')) document.getElementById('inpRewardImage').value = '';

  const titleEl = document.getElementById('rewardFormTitle');
  const btnEl = document.getElementById('btnSaveReward');
  if (titleEl) titleEl.textContent = 'Add New Mega Reward';
  if (btnEl) btnEl.textContent = 'Save Reward to Firebase';
}

function editRewardItem(id) {
  const rewards = window.adminState.rewards || [];
  const item = rewards.find(r => r.id === id);
  if (!item) return;

  editingRewardId = id;
  selectCategory(item.category || 'gift-card');

  ['inpRewardTitle', 'inpRewardBuyerStar', 'inpRewardDiamonds', 'inpRewardRealVal', 'inpRewardOfferVal', 'inpRewardLink', 'inpRewardImage'].forEach(fid => {
    const el = document.getElementById(fid);
    if (el) {
      el.style.borderColor = '';
      el.style.boxShadow = '';
    }
  });

  if (document.getElementById('inpRewardTitle')) document.getElementById('inpRewardTitle').value = item.title || item.productName || item.name || '';
  if (document.getElementById('inpRewardBuyerStar')) document.getElementById('inpRewardBuyerStar').value = item.buyerStar || item.stars || item.rating || 4.8;
  if (document.getElementById('inpRewardDiamonds')) document.getElementById('inpRewardDiamonds').value = item.diamonds || item.diamondCost || '';
  if (document.getElementById('inpRewardRealVal')) document.getElementById('inpRewardRealVal').value = item.realValue || item.originalPrice || item.mrp || '';
  if (document.getElementById('inpRewardOfferVal')) document.getElementById('inpRewardOfferVal').value = item.offerValue || item.cashValue || item.discountPrice || '';
  if (document.getElementById('inpRewardTasksNeeded')) document.getElementById('inpRewardTasksNeeded').value = item.tasksNeeded !== undefined ? item.tasksNeeded : (item.requiredWebTasks || 0);
  if (document.getElementById('inpRewardStock')) document.getElementById('inpRewardStock').value = item.stock !== undefined ? item.stock : 10;
  if (document.getElementById('inpRewardDesc')) document.getElementById('inpRewardDesc').value = item.description || '';
  if (document.getElementById('inpRewardTag')) document.getElementById('inpRewardTag').value = item.tag || '';
  if (document.getElementById('inpRewardLink')) document.getElementById('inpRewardLink').value = item.link || item.productLink || item.url || '';
  if (document.getElementById('inpRewardImage')) document.getElementById('inpRewardImage').value = item.imageUrl || item.image || item.img || '';

  const titleEl = document.getElementById('rewardFormTitle');
  const btnEl = document.getElementById('btnSaveReward');
  const displayTitle = item.title || item.productName || item.name || 'Reward';
  if (titleEl) titleEl.textContent = `Editing: ${displayTitle}`;
  if (btnEl) btnEl.textContent = 'Update Reward in Firebase';

  switchMegaAddTab('standard');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteRewardItem(id) {
  const executeDelete = () => {
    const db = window.getDb ? window.getDb() : null;
    if (!db) return;
    if (!confirm('Are you sure you want to delete this reward from Firebase?')) return;
    const rewards = (window.adminState.rewards || []).filter(r => r.id !== id);
    db.ref('/mega_rewards').set(rewards)
      .then(() => {
        window.adminState.rewards = rewards;
        renderRewardsCatalog();
        alert('Item deleted from Firebase!');
      })
      .catch(err => alert('Error: ' + err.message));
  };

  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(executeDelete);
  } else {
    executeDelete();
  }
}

/* ==========================================================================
   RENDER STANDARD REWARDS INVENTORY CATALOG
   ========================================================================== */

function renderRewardsCatalog() {
  const grid = document.getElementById('rewardsCatalogGrid');
  const meta = document.getElementById('rewardsInventoryMeta');
  if (!grid) return;

  const rewards = window.adminState.rewards || [];
  if (meta) meta.textContent = `${rewards.length} items registered`;

  if (rewards.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 36px; text-align: center; color: #64748b;">
        No reward items found in Firebase (/mega_rewards). Add a new mega reward above to publish it for all players.
      </div>
    `;
    return;
  }

  let html = '';
  rewards.forEach(r => {
    const cat = MEGA_CATEGORIES.find(c => c.id === r.category) || MEGA_CATEGORIES[0];
    const buyerStar = Number(r.buyerStar || 4.8).toFixed(1);
    const diamonds = Number(r.diamondCost || r.diamonds || 0).toLocaleString();
    const realVal = r.realValue || '';
    const offerVal = r.offerValue || r.cashValue || '';
    const link = r.link || r.productLink || '';
    const imgUrl = r.imageUrl || r.image || '';

    html += `
      <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 14px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 1px 4px rgba(15, 23, 42, 0.03); transition: all 0.2s ease;">
        <div style="height: 140px; background: #f8fafc; border-bottom: 1.5px solid #f1f5f9; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden;">
          ${imgUrl ? `<img src="${imgUrl}" alt="${r.title}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null;this.parentElement.innerHTML='<span style=\\'font-size:42px;\\'>${cat.icon}</span>';">` : `<span style="font-size: 42px;">${cat.icon}</span>`}
          <span style="position: absolute; top: 8px; left: 8px; background: #ffffff; color: #0284c7; border: 1px solid rgba(2, 132, 199, 0.25); font-size: 9.5px; font-weight: 800; padding: 3px 8px; border-radius: 99px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">${r.tag || cat.tag}</span>
          <span style="position: absolute; top: 8px; right: 8px; background: rgba(15, 23, 42, 0.85); color: #facc15; font-size: 10px; font-weight: 800; padding: 3px 7px; border-radius: 99px; display: inline-flex; align-items: center; gap: 3px;">
            ⭐ ${buyerStar}
          </span>
          <span style="position: absolute; bottom: 8px; right: 8px; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; font-size: 11px; font-weight: 800; padding: 3px 9px; border-radius: 99px; box-shadow: 0 2px 6px rgba(2, 132, 199, 0.25);">${diamonds} 💎</span>
        </div>
        <div style="padding: 14px; display: flex; flex-direction: column; gap: 6px; flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 10.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px;">${cat.name}</span>
            <span style="font-size: 11px; color: #64748b;">Stock: <strong style="color: #0f172a;">${r.stock || 10}</strong></span>
          </div>
          <h4 style="font-size: 14px; font-weight: 800; color: #0f172a; line-height: 1.3;">${r.title || r.productName}</h4>
          
          <div style="display: flex; align-items: baseline; gap: 8px; margin-top: 4px;">
            ${realVal ? `<span style="font-size: 12px; color: #94a3b8; text-decoration: line-through; font-weight: 700;">${realVal}</span>` : ''}
            ${offerVal ? `<span style="font-size: 13.5px; color: #059669; font-weight: 800;">${offerVal}</span>` : ''}
            ${(r.tasksNeeded || r.requiredWebTasks) ? `<span style="font-size: 10px; font-weight: 800; background: #ccfbf1; color: #0d9488; padding: 2px 6px; border-radius: 4px;">🌐 ${r.tasksNeeded || r.requiredWebTasks} Tasks</span>` : ''}
          </div>

          ${link ? `
            <a href="${link}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: #0284c7; font-weight: 700; text-decoration: none; margin-top: 2px;">
              🔗 Product Store Page ↗
            </a>
          ` : ''}

          <div style="display: flex; gap: 8px; margin-top: auto; padding-top: 10px;">
            <button onclick="editRewardItem('${r.id}')" class="btn-secondary" style="flex: 1; padding: 6px; font-size: 11.5px; text-align: center; justify-content: center;">Edit</button>
            <button onclick="deleteRewardItem('${r.id}')" class="btn-secondary" style="padding: 6px 10px; font-size: 11.5px; color: #ef4444;" title="Delete Reward">🗑️</button>
          </div>
        </div>
      </div>
    `;
  });
  grid.innerHTML = html;
}

/* ==========================================================================
   USER CUSTOM REQUESTS LIST
   Shows 5 required data points:
   1. User Name
   2. Required (Item)
   3. Link
   4. Image
   5. Why Requires
   ========================================================================== */

function filterCustomRequests(status) {
  customRequestsFilter = status;
  document.querySelectorAll('.btn-custom-filter').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-custfilter') === status);
  });
  renderCustomRequestsTable();
}

function renderCustomRequestsTable() {
  const tbody = document.getElementById('customRequestsTableBody');
  if (!tbody) return;

  const requests = window.adminState.customRequests || [];
  const filtered = requests.filter(r => {
    if (customRequestsFilter === 'all') return true;
    return (r.status || 'pending').toLowerCase() === customRequestsFilter;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 36px; color: #64748b;">
          ${requests.length === 0 ? 'No custom reward requests found in Firebase (/custom_reward_requests).' : 'No custom requests match this filter.'}
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(r => {
    const userName = r.userName || r.username || r.playerName || 'Player';
    const requiredItem = r.itemName || r.required || r.title || 'Exclusive Custom Item';
    const link = r.link || r.productLink || r.url || '#';
    const imgUrl = r.imageUrl || r.image || '';
    const whyRequires = r.whyRequires || r.reason || r.description || 'Player reached milestone tier and requested this custom reward.';
    const status = (r.status || 'pending').toLowerCase();
    const reqId = r.id;

    let statusBadge = `<span class="req-status-pill status-pending">Pending</span>`;
    if (status === 'approved') {
      statusBadge = `<span class="req-status-pill status-approved">Approved</span>`;
    } else if (status === 'rejected') {
      statusBadge = `<span class="req-status-pill status-rejected">Rejected</span>`;
    }

    return `
      <tr>
        <td>
          <div style="width: 48px; height: 48px; border-radius: 8px; overflow: hidden; background: #f1f5f9; display: flex; align-items: center; justify-content: center; border: 1.5px solid #e2e8f0;">
            ${imgUrl ? `<img src="${imgUrl}" alt="${requiredItem}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null;this.parentElement.innerHTML='⭐';">` : '<span style="font-size: 20px;">⭐</span>'}
          </div>
        </td>
        <td>
          <div style="font-weight: 800; color: #0f172a; font-size: 13.5px;">${userName}</div>
          <span style="font-size: 10.5px; color: #64748b; font-family: 'JetBrains Mono', monospace;">${r.userId || r.profileCode || 'ID: ' + reqId.substring(0, 8)}</span>
        </td>
        <td>
          <div style="font-weight: 800; color: #0284c7; font-size: 13px;">${requiredItem}</div>
          ${r.estimatedPrice ? `<span style="font-size: 11px; color: #059669; font-weight: 700;">Est: ${r.estimatedPrice}</span>` : ''}
        </td>
        <td>
          ${link && link !== '#' ? `
            <a href="${link}" target="_blank" rel="noopener noreferrer" class="link-pill-btn">
              🔗 View Link
            </a>
          ` : '<span style="color: #94a3b8; font-size: 11px;">No link</span>'}
        </td>
        <td>
          <div class="why-requires-text" title="${whyRequires.replace(/"/g, '&quot;')}">
            "${whyRequires}"
          </div>
        </td>
        <td>${statusBadge}</td>
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 6px;">
            ${status !== 'approved' ? `
              <button onclick="approveAndPrefillCustomRequest('${reqId}')" class="btn-primary" style="padding: 5px 10px; font-size: 11px; background: #059669;" title="Approve & Pre-fill into Standard Mega Reward form">
                ✓ Pre-fill
              </button>
            ` : ''}
            ${status !== 'rejected' ? `
              <button onclick="rejectCustomRequest('${reqId}')" class="btn-secondary" style="padding: 5px 8px; font-size: 11px; color: #ef4444;" title="Reject request">
                ✕ Reject
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function approveAndPrefillCustomRequest(reqId) {
  const requests = window.adminState.customRequests || [];
  const req = requests.find(r => r.id === reqId);
  if (!req) return;

  // Pre-fill standard form
  if (document.getElementById('inpRewardTitle')) {
    document.getElementById('inpRewardTitle').value = req.itemName || req.required || '';
  }
  if (document.getElementById('inpRewardBuyerStar')) {
    document.getElementById('inpRewardBuyerStar').value = '5.0';
  }
  if (document.getElementById('inpRewardDiamonds')) {
    document.getElementById('inpRewardDiamonds').value = req.diamondCost || 5000;
  }
  if (document.getElementById('inpRewardRealVal')) {
    document.getElementById('inpRewardRealVal').value = req.estimatedPrice || '$150';
  }
  if (document.getElementById('inpRewardOfferVal')) {
    document.getElementById('inpRewardOfferVal').value = req.estimatedPrice || '$150';
  }
  if (document.getElementById('inpRewardLink')) {
    document.getElementById('inpRewardLink').value = req.link || req.productLink || '';
  }
  if (document.getElementById('inpRewardImage')) {
    document.getElementById('inpRewardImage').value = req.imageUrl || req.image || '';
  }
  if (document.getElementById('inpRewardDesc')) {
    document.getElementById('inpRewardDesc').value = req.whyRequires ? `Custom reward requested by ${req.userName}: ${req.whyRequires}` : '';
  }

  // Update request status in Firebase to approved
  const db = window.getDb ? window.getDb() : null;
  if (db) {
    db.ref(`/custom_reward_requests/${reqId}/status`).set('approved');
    req.status = 'approved';
    updateCustomReqBadge();
  }

  // Switch to standard tab and scroll to form
  switchMegaAddTab('standard');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  alert(`✅ Custom request from ${req.userName} has been pre-filled into the Mega Reward form!\nReview the 7 compulsory fields and click "Save Reward to Firebase".`);
}

function rejectCustomRequest(reqId) {
  const executeReject = () => {
    const db = window.getDb ? window.getDb() : null;
    if (!db) return;
    db.ref(`/custom_reward_requests/${reqId}/status`).set('rejected')
      .then(() => {
        const requests = window.adminState.customRequests || [];
        const req = requests.find(r => r.id === reqId);
        if (req) req.status = 'rejected';
        renderCustomRequestsTable();
        updateCustomReqBadge();
        alert('Custom request marked as rejected.');
      })
      .catch(err => alert('Firebase error: ' + err.message));
  };

  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(executeReject);
  } else {
    executeReject();
  }
}

/* ==========================================================================
   DEPRECATED SAMPLE DATA SEEDERS (REMOVED)
   ========================================================================== */

function seedSampleRewardsToFirebase() {
  // Deprecated: Sample data seeding removed. Rewards are purely managed from Firebase.
}

function seedSampleCustomRequestsToFirebase() {
  // Deprecated: Sample data seeding removed. Custom requests are purely received from players in Firebase.
}

function syncStandardGiftCards() {
  const executeSync = () => {
    const db = window.getDb ? window.getDb() : null;
    if (!db) {
      alert('Firebase is not connected!');
      return;
    }

    const d100 = Number(document.getElementById('inpGc100Diamonds')?.value) || 1667;
    const t100 = Number(document.getElementById('inpGc100Tasks')?.value) || 40;
    const s100 = Number(document.getElementById('inpGc100Stock')?.value) || 50;

    const d500 = Number(document.getElementById('inpGc500Diamonds')?.value) || 8334;
    const t500 = Number(document.getElementById('inpGc500Tasks')?.value) || 170;
    const s500 = Number(document.getElementById('inpGc500Stock')?.value) || 25;

    const d1000 = Number(document.getElementById('inpGc1000Diamonds')?.value) || 16667;
    const t1000 = Number(document.getElementById('inpGc1000Tasks')?.value) || 340;
    const s1000 = Number(document.getElementById('inpGc1000Stock')?.value) || 10;

    let rewards = [...(window.adminState.rewards || [])];

    const giftCards = [
      {
        id: 'giftcard_100',
        title: '₹100 Gift Card',
        name: '₹100 Gift Card',
        productName: '₹100 Gift Card',
        category: 'gift-card',
        categoryName: 'Gift Card',
        categoryIcon: '🎁',
        diamonds: d100,
        diamondCost: d100,
        tasksNeeded: t100,
        requiredWebTasks: t100,
        realValue: '₹100',
        originalPrice: '₹100',
        mrp: '₹100',
        offerValue: '₹100',
        cashValue: '₹100',
        discountPrice: '₹100',
        link: 'https://amazon.in/giftcards',
        productLink: 'https://amazon.in/giftcards',
        url: 'https://amazon.in/giftcards',
        imageUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300',
        image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300',
        img: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300',
        stock: s100,
        buyerStar: 5.0,
        stars: 5.0,
        rating: 5.0,
        tag: '₹100 VOUCHER',
        description: `Instant ₹100 Digital Voucher. Requires ${d100.toLocaleString()} 💎 Diamonds & ${t100} Website Tasks completed to unlock.`,
        active: true,
        updatedAt: new Date().toISOString()
      },
      {
        id: 'giftcard_500',
        title: '₹500 Gift Card',
        name: '₹500 Gift Card',
        productName: '₹500 Gift Card',
        category: 'gift-card',
        categoryName: 'Gift Card',
        categoryIcon: '🎁',
        diamonds: d500,
        diamondCost: d500,
        tasksNeeded: t500,
        requiredWebTasks: t500,
        realValue: '₹500',
        originalPrice: '₹500',
        mrp: '₹500',
        offerValue: '₹500',
        cashValue: '₹500',
        discountPrice: '₹500',
        link: 'https://amazon.in/giftcards',
        productLink: 'https://amazon.in/giftcards',
        url: 'https://amazon.in/giftcards',
        imageUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300',
        image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300',
        img: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300',
        stock: s500,
        buyerStar: 5.0,
        stars: 5.0,
        rating: 5.0,
        tag: '₹500 VOUCHER',
        description: `Instant ₹500 Digital Voucher. Requires ${d500.toLocaleString()} 💎 Diamonds & ${t500} Website Tasks completed to unlock.`,
        active: true,
        updatedAt: new Date().toISOString()
      },
      {
        id: 'giftcard_1000',
        title: '₹1,000 Gift Card',
        name: '₹1,000 Gift Card',
        productName: '₹1,000 Gift Card',
        category: 'gift-card',
        categoryName: 'Gift Card',
        categoryIcon: '🎁',
        diamonds: d1000,
        diamondCost: d1000,
        tasksNeeded: t1000,
        requiredWebTasks: t1000,
        realValue: '₹1,000',
        originalPrice: '₹1,000',
        mrp: '₹1,000',
        offerValue: '₹1,000',
        cashValue: '₹1,000',
        discountPrice: '₹1,000',
        link: 'https://amazon.in/giftcards',
        productLink: 'https://amazon.in/giftcards',
        url: 'https://amazon.in/giftcards',
        imageUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300',
        image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300',
        img: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300',
        stock: s1000,
        buyerStar: 5.0,
        stars: 5.0,
        rating: 5.0,
        tag: '₹1,000 VOUCHER',
        description: `Instant ₹1,000 Digital Voucher. Requires ${d1000.toLocaleString()} 💎 Diamonds & ${t1000} Website Tasks completed to unlock.`,
        active: true,
        updatedAt: new Date().toISOString()
      }
    ];

    // Merge or update gift cards in rewards array
    giftCards.forEach(gc => {
      const idx = rewards.findIndex(r => r.id === gc.id);
      if (idx !== -1) {
        rewards[idx] = { ...rewards[idx], ...gc };
      } else {
        rewards.unshift(gc);
      }
    });

    db.ref('/mega_rewards').set(rewards)
      .then(() => {
        window.adminState.rewards = rewards;
        renderRewardsCatalog();
        alert('✅ Standard Gift Cards successfully synced to Firebase (/mega_rewards)!\n• ₹100: ' + d100 + ' 💎, ' + t100 + ' Tasks\n• ₹500: ' + d500 + ' 💎, ' + t500 + ' Tasks\n• ₹1,000: ' + d1000 + ' 💎, ' + t1000 + ' Tasks');
      })
      .catch(err => alert('Firebase error: ' + err.message));
  };

  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(executeSync);
  } else {
    executeSync();
  }
}

// Global window exports
window.initCategoryDropdown = initCategoryDropdown;
window.toggleCategoryDropdown = toggleCategoryDropdown;
window.selectCategory = selectCategory;
window.switchMegaAddTab = switchMegaAddTab;
window.filterCustomRequests = filterCustomRequests;
window.renderCustomRequestsTable = renderCustomRequestsTable;
window.approveAndPrefillCustomRequest = approveAndPrefillCustomRequest;
window.rejectCustomRequest = rejectCustomRequest;
window.saveRewardToFirebase = saveRewardToFirebase;
window.clearRewardForm = clearRewardForm;
window.editRewardItem = editRewardItem;
window.deleteRewardItem = deleteRewardItem;
window.seedSampleRewardsToFirebase = seedSampleRewardsToFirebase;
window.seedSampleCustomRequestsToFirebase = seedSampleCustomRequestsToFirebase;
window.renderRewardsCatalog = renderRewardsCatalog;
window.updateCustomReqBadge = updateCustomReqBadge;
window.syncStandardGiftCards = syncStandardGiftCards;


/* ==================== MODULE: MEGA-REQUEST ==================== */
/* ==========================================================================
   PAGE: MEGA REDEMPTION & WITHDRAWAL REQUESTS (pages/mega-request/mega-request.js)
   - Real-time Wallet / Withdrawal Management directly connected to Firebase RTDB
   - Statuses: Pending, Approved, Rejected, Completed
   - Displays: User, UID, Amount, Stars/Coins, Payment Info, Tx ID, Date, Status
   - Instant 1-click Status Transitions & Modal Management
   ========================================================================== */

let requestsFilter = 'all';
let managingRequestId = null;

window.addEventListener('requestsUpdated', () => {
  renderRequestsTable();
});

window.addEventListener('usersUpdated', () => {
  renderRequestsTable();
});

document.addEventListener('DOMContentLoaded', () => {
  renderRequestsTable();
});

function renderRequestsTable() {
  const tbody = document.getElementById('requestsTableBody');
  if (!tbody) return;

  const requests = (window.adminState && window.adminState.rewardRequests)
    ? window.adminState.rewardRequests
    : (window.adminState && window.adminState.requests ? window.adminState.requests : []);

  const users = (window.adminState && window.adminState.users) ? window.adminState.users : [];

  const filtered = requests.filter(r => {
    const s = (r.status || 'pending').toLowerCase();
    const normalizedStatus = (s === 'delivered') ? 'completed' : s;
    if (requestsFilter === 'all') return true;
    return normalizedStatus === requestsFilter.toLowerCase();
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #64748b; padding: 36px;">No requests found in "${requestsFilter}" status.</td></tr>`;
    return;
  }

  let html = '';
  filtered.forEach(r => {
    const rawStatus = (r.status || 'pending').toLowerCase();
    const status = (rawStatus === 'delivered') ? 'completed' : rawStatus;

    let pillClass = 'pill-pending';
    let pillStyle = 'background: rgba(245, 158, 11, 0.15); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.3);';

    if (status === 'approved') {
      pillClass = 'pill-approved';
      pillStyle = 'background: rgba(59, 130, 246, 0.15); color: #2563eb; border: 1px solid rgba(59, 130, 246, 0.3);';
    } else if (status === 'completed') {
      pillClass = 'pill-delivered';
      pillStyle = 'background: rgba(16, 185, 129, 0.15); color: #059669; border: 1px solid rgba(16, 185, 129, 0.3);';
    } else if (status === 'rejected') {
      pillClass = 'pill-rejected';
      pillStyle = 'background: rgba(239, 68, 68, 0.15); color: #dc2626; border: 1px solid rgba(239, 68, 68, 0.3);';
    }

    // 1. User info
    const userName = r.username || r.userName || 'Player';
    const uid = r.userId || r.uid || '-';
    const user = users.find(u => u.uid === uid || u.username === userName);
    const userDisplay = user ? (user.name || user.username) : userName;

    // 2. Order / Item / Amount info
    const orderName = r.rewardTitle || r.itemTitle || r.orderName || r.title || (r.amount ? `Withdrawal ${r.amount}` : 'Reward Claim');
    const amountVal = r.amount || r.diamondCost || r.diamondsCost || r.coinsCost || 0;
    const currencyType = r.currency || r.costType || (r.diamondCost ? 'Diamonds 💎' : 'Coins 🪙');

    // 3. Payment / Shipping info
    const payInfo = r.paymentInfo || r.walletAddress || r.upiId || r.shippingDetails || r.deliveryAddress || r.accountDetails || 'Digital delivery';
    const txId = r.txId || r.transactionId || r.referenceId || r.id || 'N/A';

    // 4. Date
    const rawDate = r.createdAt || r.date || r.timestamp;
    const dateDisplay = rawDate ? new Date(rawDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent';

    html += `
      <tr>
        <!-- Tx / Request ID -->
        <td>
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 11.5px; color: #0284c7; font-weight: 700;">
            #${escapeReqText((r.id || 'REQ').substring(0, 8))}
          </div>
          ${txId !== r.id ? `<span style="font-size: 10px; color: #64748b; font-family: monospace;">Ref: ${escapeReqText(txId.slice(0, 10))}</span>` : ''}
        </td>

        <!-- User & UID -->
        <td>
          <div style="font-weight: 800; color: #0f172a; font-size: 13px;">${escapeReqText(userDisplay)}</div>
          <code style="font-size: 10.5px; color: #64748b; background: #f1f5f9; padding: 1px 4px; border-radius: 3px;" title="${uid}">
            ${escapeReqText(uid.length > 12 ? uid.slice(0, 10) + '...' : uid)}
          </code>
        </td>

        <!-- Amount / Item -->
        <td>
          <div style="font-weight: 700; color: #0284c7; font-size: 13px;">${escapeReqText(orderName)}</div>
        </td>

        <!-- Cost / Currency -->
        <td>
          <span style="font-weight: 800; color: #d97706; font-size: 13px; font-family: 'JetBrains Mono', monospace;">
            ${Number(amountVal).toLocaleString()} ${escapeReqText(currencyType)}
          </span>
        </td>

        <!-- Payment Info -->
        <td>
          <div style="font-size: 12px; color: #334155; max-width: 170px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeReqText(payInfo)}">
            ${escapeReqText(payInfo)}
          </div>
        </td>

        <!-- Date -->
        <td style="font-size: 12px; color: #64748b; white-space: nowrap;">${dateDisplay}</td>

        <!-- Status -->
        <td>
          <span class="status-pill ${pillClass}" style="${pillStyle}; text-transform: uppercase; font-size: 10.5px; font-weight: 800; padding: 2px 8px; border-radius: 99px;">
            ${status.toUpperCase()}
          </span>
        </td>

        <!-- Actions -->
        <td style="text-align: right; white-space: nowrap;">
          <div style="display: inline-flex; gap: 4px; align-items: center;">
            ${status === 'pending' ? `
              <button onclick="setWithdrawalStatusDirect('${r.id}', 'approved')" class="btn-primary" style="padding: 4px 8px; font-size: 11px; background: #0284c7;" title="Approve Request">
                ✓ Approve
              </button>
              <button onclick="setWithdrawalStatusDirect('${r.id}', 'rejected')" class="btn-secondary" style="padding: 4px 8px; font-size: 11px; color: #dc2626; border-color: #fca5a5;" title="Reject Request">
                ✕ Reject
              </button>
            ` : ''}

            ${status === 'approved' ? `
              <button onclick="setWithdrawalStatusDirect('${r.id}', 'completed')" class="btn-primary" style="padding: 4px 8px; font-size: 11px; background: #059669;" title="Mark as Completed">
                ✓ Complete
              </button>
              <button onclick="setWithdrawalStatusDirect('${r.id}', 'rejected')" class="btn-secondary" style="padding: 4px 8px; font-size: 11px; color: #dc2626; border-color: #fca5a5;" title="Reject Request">
                ✕ Reject
              </button>
            ` : ''}

            <button onclick="openRequestManageModal('${r.id}')" class="btn-secondary" style="padding: 4px 8px; font-size: 11px;">
              Manage
            </button>
          </div>
        </td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

/**
 * Direct 1-Click Status Update (Pending -> Approved / Completed / Rejected)
 */
function setWithdrawalStatusDirect(id, nextStatus) {
  const confirmMsg = `Update request #${id.substring(0, 8)} to status: ${nextStatus.toUpperCase()}?`;
  if (!confirm(confirmMsg)) return;

  if (typeof window.updateWithdrawalStatus === 'function') {
    window.updateWithdrawalStatus(id, nextStatus)
      .then(() => {
        renderRequestsTable();
      })
      .catch(err => alert('Firebase Error: ' + err.message));
  } else {
    const db = window.getDb ? window.getDb() : null;
    if (!db) return;
    db.ref(`/reward_requests/${id}`).update({
      status: nextStatus,
      updatedAt: Date.now()
    }).then(() => renderRequestsTable());
  }
}
window.setWithdrawalStatusDirect = setWithdrawalStatusDirect;

function filterRequestsTable(status) {
  requestsFilter = status;
  document.querySelectorAll('[data-reqfilter]').forEach(b => {
    if (b.getAttribute('data-reqfilter') === status) b.classList.add('active');
    else b.classList.remove('active');
  });
  renderRequestsTable();
}
window.filterRequestsTable = filterRequestsTable;

function openRequestManageModal(id) {
  const requests = (window.adminState && window.adminState.rewardRequests)
    ? window.adminState.rewardRequests
    : (window.adminState && window.adminState.requests ? window.adminState.requests : []);

  const req = requests.find(r => r.id === id);
  if (!req) return;
  managingRequestId = id;
  window.currentManagingRequestId = id;

  const users = (window.adminState && window.adminState.users) ? window.adminState.users : [];
  const userName = req.username || req.userName || 'User';
  const user = users.find(u => u.uid === req.userId || u.username === userName);
  const webTasksCount = user ? (Number(user.webTasksDone || user.webDone) || 0) : (Number(req.webTasksCompleted) || 0);

  if (document.getElementById('modalReqUser')) {
    document.getElementById('modalReqUser').textContent = `${user ? (user.name || user.username) : userName} (UID: ${req.userId || '-'})`;
  }
  if (document.getElementById('modalReqItem')) {
    document.getElementById('modalReqItem').textContent = req.rewardTitle || req.itemTitle || req.orderName || (req.amount ? `Withdrawal ${req.amount}` : 'Reward');
  }
  if (document.getElementById('modalReqDiamonds')) {
    const amountVal = req.amount || req.diamondCost || req.diamondsCost || req.diamonds || req.coins || 0;
    const curr = req.currency || (req.diamondCost ? 'Diamonds 💎' : 'Coins 🪙');
    document.getElementById('modalReqDiamonds').textContent = `${Number(amountVal).toLocaleString()} ${curr}`;
  }
  if (document.getElementById('modalReqShipping')) {
    document.getElementById('modalReqShipping').textContent = req.paymentInfo || req.walletAddress || req.upiId || req.shippingDetails || req.deliveryInfo || req.deliveryAddress || 'Direct In-App Delivery';
  }
  if (document.getElementById('modalReqStatus')) {
    const rawS = (req.status || 'pending').toLowerCase();
    document.getElementById('modalReqStatus').value = (rawS === 'delivered') ? 'completed' : rawS;
  }
  if (document.getElementById('modalReqNotes')) {
    document.getElementById('modalReqNotes').value = req.notes || req.adminNotes || req.txId || '';
  }

  const modal = document.getElementById('requestManageModal');
  if (modal) modal.classList.add('open');
}
window.openRequestManageModal = openRequestManageModal;

function closeRequestManageModal() {
  const modal = document.getElementById('requestManageModal');
  if (modal) modal.classList.remove('open');
  managingRequestId = null;
  window.currentManagingRequestId = null;
}
window.closeRequestManageModal = closeRequestManageModal;

function saveRequestStatusToFirebase() {
  const id = managingRequestId || window.currentManagingRequestId;
  if (!id) return;

  const status = document.getElementById('modalReqStatus')?.value || 'pending';
  const notes = document.getElementById('modalReqNotes')?.value.trim() || '';

  if (typeof window.updateWithdrawalStatus === 'function') {
    window.updateWithdrawalStatus(id, status, notes)
      .then(() => {
        alert(`✅ Order #${id.substring(0, 8)} status saved as ${status.toUpperCase()}!`);
        closeRequestManageModal();
        renderRequestsTable();
      })
      .catch(err => alert('Error saving status: ' + err.message));
  } else {
    const db = window.getDb ? window.getDb() : null;
    if (!db) return;
    db.ref(`/reward_requests/${id}`).update({
      status: status,
      notes: notes,
      updatedAt: Date.now()
    }).then(() => {
      alert(`✅ Order #${id.substring(0, 8)} status saved!`);
      closeRequestManageModal();
      renderRequestsTable();
    }).catch(err => alert('Error: ' + err.message));
  }
}
window.saveRequestStatusToFirebase = saveRequestStatusToFirebase;

function escapeReqText(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

window.renderRequestsTable = renderRequestsTable;



/* ==================== MODULE: TASKS-WEB ==================== */
/* ==========================================================================
   PAGE: TASKS (TELEGRAM & WEBSITE TASK ADDER) - pages/tasks-web/tasks-web.js
   ========================================================================== */

const TG_STORAGE_KEY = 'ENERGY_TAP_TG_TASKS';
const WEB_STORAGE_KEY = 'ENERGY_TAP_WEB_TASKS';
const MONTHLY_STORAGE_KEY = 'ENERGY_TAP_MONTHLY_TASKS_CONFIG_V1';

const DEFAULT_TG_TASKS = [];
const DEFAULT_WEB_TASKS = [];
const DEFAULT_MONTHLY_TASKS = [
  { id: 'd1', number: 1, title: '1. Tap 2,000 Times', target: 2000, rewardCards: 1, type: 'tap', tagText: 'MONTHLY QUEST', desc: 'Tap the central orb 2,000 times on the Home page to win 1 Scratch Card', disabled: false },
  { id: 'd2', number: 2, title: '2. Tap 5,000 Times', target: 5000, rewardCards: 1, type: 'tap', tagText: 'MONTHLY QUEST', desc: 'Reach 5,000 total taps on the central orb to win 1 Scratch Card', disabled: false },
  { id: 'd3', number: 3, title: '3. Tap 10,000 Times', target: 10000, rewardCards: 1, type: 'tap', tagText: 'MONTHLY QUEST', desc: 'Harvest 10,000 taps on the central orb to win 1 Scratch Card', disabled: false },
  { id: 'd_fuel_green', number: 4, title: '4. Use 2,000 Green Fuel', target: 2000, rewardCards: 1, type: 'fuel_green', tagText: 'MONTHLY QUEST', desc: 'Consume 2,000 Green Fuel cells in the Energy Generator to win 1 Scratch Card', disabled: false },
  { id: 'd_fuel_yellow_1', number: 5, title: '5. Use 1,000 Yellow Fuel', target: 1000, rewardCards: 1, type: 'fuel_yellow_1', tagText: 'MONTHLY QUEST', desc: 'Consume 1,000 Yellow Fuel cells in the Energy Generator to win 1 Scratch Card', disabled: false },
  { id: 'd_fuel_orange_1', number: 6, title: '6. Use 500 Orange Fuel', target: 500, rewardCards: 1, type: 'fuel_orange', tagText: 'MONTHLY QUEST', desc: 'Consume 500 Orange Fuel cells in the Energy Generator to win 1 Scratch Card', disabled: false },
  { id: 'd_fuel_red_1', number: 7, title: '7. Use 250 Red Fuel', target: 250, rewardCards: 1, type: 'fuel_red', tagText: 'MONTHLY QUEST', desc: 'Burn 250 high-octane Red Fuel cells in the Energy Generator to win 1 Scratch Card', disabled: false },
  { id: 'd_fuel_pink_1', number: 8, title: '8. Use 100 Pink Fuel', target: 100, rewardCards: 1, type: 'fuel_pink', tagText: 'MONTHLY QUEST', desc: 'Burn 100 exotic Pink Fuel cells in the Energy Generator to win 1 Scratch Card', disabled: false },
  { id: 'd_fuel_purple_1', number: 9, title: '9. Use 50 Purple Fuel', target: 50, rewardCards: 1, type: 'fuel_purple', tagText: 'MONTHLY QUEST', desc: 'Deploy 50 rare Purple Fuel cells into the Energy Generator to win 1 Scratch Card', disabled: false },
  { id: 'd_spin_100', number: 10, title: '10. Spin lucky wheel 100 in 30 days', target: 100, rewardCards: 1, type: 'spin', tagText: 'MONTHLY QUEST', desc: 'Spin the Lucky Wheel 100 times in 30 days to win 1 Scratch Card', disabled: false },
  { id: 'd_chest_100', number: 11, title: '11. Chest open 100 in 30 days', target: 100, rewardCards: 1, type: 'chest', tagText: 'MONTHLY QUEST', desc: 'Open 100 Treasure Chests in 30 days to win 1 Scratch Card', disabled: false },
  { id: 'd_chest_250', number: 12, title: '12. Chest open 250 in 30 days', target: 250, rewardCards: 1, type: 'chest', tagText: 'MONTHLY QUEST', desc: 'Open 250 Treasure Chests in 30 days to win 1 Scratch Card', disabled: false },
  { id: 'd_scratch_200', number: 13, title: '13. Card scratch 200 in 30 days', target: 200, rewardCards: 1, type: 'scratch', tagText: 'MONTHLY QUEST', desc: 'Play and scratch 200 Scratch Cards in 30 days to win 1 Scratch Card', disabled: false },
  { id: 'd_egg_300', number: 14, title: '14. Egg coin use in egg game 300 in 30 days', target: 300, rewardCards: 1, type: 'egg', tagText: 'MONTHLY QUEST', desc: 'Use 300 Egg Coins in Cyber Egg Hatchery in 30 days to win 1 Scratch Card', disabled: false }
];

// Initialize on events
window.addEventListener('websiteTasksUpdated', () => {
  renderWebsiteTasksUI();
});

window.addEventListener('telegramTasksUpdated', () => {
  renderTelegramTasksUI();
});

window.addEventListener('monthlyTasksUpdated', () => {
  renderMonthlyTasksUI();
});

document.addEventListener('DOMContentLoaded', () => {
  renderTelegramTasksUI();
  renderWebsiteTasksUI();
  renderMonthlyTasksUI();
});

// Switch Subtabs
function switchAdminTaskSubtab(tabName) {
  const tabs = ['telegram', 'website', 'daily'];
  tabs.forEach(t => {
    const btn = document.getElementById('btnSubtab' + t.charAt(0).toUpperCase() + t.slice(1));
    const content = document.getElementById('subtabContent' + t.charAt(0).toUpperCase() + t.slice(1));
    if (btn) btn.classList.toggle('active', t === tabName);
    if (content) {
      content.style.display = (t === tabName) ? 'block' : 'none';
      content.classList.toggle('active', t === tabName);
    }
  });
}

/* ==========================================================================
   TELEGRAM TASKS LOGIC (REWARD: FIXED TO SCRATCH CARDS 🎴, NO DESCRIPTION)
   ========================================================================== */

function getTelegramTasks() {
  if (window.adminState && window.adminState.telegramTasks && Array.isArray(window.adminState.telegramTasks)) {
    return window.adminState.telegramTasks;
  }
  try {
    const cached = localStorage.getItem(TG_STORAGE_KEY);
    if (cached !== null) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        window.adminState.telegramTasks = parsed;
        return parsed;
      }
    }
  } catch (e) {}
  return [];
}

let tgAutoSaveTimer = null;
function onTgTaskInput(taskId) {
  clearTimeout(tgAutoSaveTimer);
  tgAutoSaveTimer = setTimeout(() => {
    performSaveTelegramTasksToFirebase(true);
  }, 500);
}
window.onTgTaskInput = onTgTaskInput;

function getTaskCompletionStats(taskType, taskId) {
  const users = (window.adminState && window.adminState.users) ? window.adminState.users : [];
  let count = 0;
  users.forEach(u => {
    const raw = u.raw || {};
    const tasksState = raw.tasksState || {};
    if (taskType === 'telegram') {
      if (tasksState.claimedTelegram && tasksState.claimedTelegram[taskId]) count++;
    } else {
      if (tasksState.claimedWebsite && tasksState.claimedWebsite[taskId]) count++;
    }
  });
  return count;
}
window.getTaskCompletionStats = getTaskCompletionStats;

function toggleTaskStatus(taskType, taskId) {
  const isTg = taskType === 'telegram';
  const isMonthly = taskType === 'monthly';
  const tasks = isTg ? getTelegramTasks() : (isMonthly ? getMonthlyTasks() : getWebsiteTasks());
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  task.disabled = !task.disabled;
  if (isTg) {
    performSaveTelegramTasksToFirebase(false);
    renderTelegramTasksUI();
  } else if (isMonthly) {
    performSaveMonthlyTasksToFirebase(false);
    renderMonthlyTasksUI();
  } else {
    performSaveWebsiteTasksToFirebase(false);
    renderWebsiteTasksUI();
  }
}
window.toggleTaskStatus = toggleTaskStatus;

function renderTelegramTasksUI() {
  const container = document.getElementById('telegramTasksContainer');
  const badge = document.getElementById('adminTgTasksCountBadge');
  if (!container) return;

  const tasks = getTelegramTasks();
  if (badge) badge.textContent = tasks.length;

  if (tasks.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; background: rgba(4, 10, 26, 0.5); border-radius: 12px; border: 1px dashed rgba(25, 55, 120, 0.5);">
        <p style="color: #94a3b8; font-size: 14px; margin-bottom: 12px;">No Telegram tasks found in Firebase.</p>
        <button onclick="openNewTelegramTaskModal()" class="btn-primary">➕ Add Your First Telegram Task</button>
      </div>
    `;
    return;
  }

  let html = '';
  tasks.forEach((task, idx) => {
    const isBot = task.iconType === 'bot' || (task.tagText && task.tagText.includes('BOT'));
    const typeLabel = isBot ? '🤖 BOT' : '✈️ CHANNEL';
    const tag = task.tagText || (isBot ? 'TELEGRAM BOT' : 'TELEGRAM CHANNEL');
    const coinsVal = Number(task.coins !== undefined ? task.coins : (task.rewardCoins !== undefined ? task.rewardCoins : 100));
    const completions = getTaskCompletionStats('telegram', task.id);
    const isDisabled = task.disabled === true;

    html += `
      <div class="task-item-card" id="tgCard_${task.id}" style="${isDisabled ? 'opacity: 0.7; border-color: rgba(239, 68, 68, 0.4);' : ''}">
        <div class="task-card-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-weight: 800; color: #38bdf8; font-size: 13px;">${typeLabel} #${idx + 1}</span>
            <span style="font-size: 10px; background: ${isDisabled ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 189, 248, 0.15)'}; color: ${isDisabled ? '#f87171' : '#38bdf8'}; padding: 2px 6px; border-radius: 4px; font-weight: 700;">
              ${isDisabled ? 'DISABLED' : tag}
            </span>
            <span style="font-size: 10.5px; color: #10b981; font-weight: 700; font-family: 'JetBrains Mono', monospace;" title="Number of players who completed this task">
              👥 ${completions} Done
            </span>
          </div>
          <div style="display: flex; gap: 6px; align-items: center;">
            <button type="button" onclick="toggleTaskStatus('telegram', '${task.id}')" class="btn-dash-outline" style="padding: 2px 8px; font-size: 10.5px; border-color: ${isDisabled ? '#10b981' : '#f59e0b'}; color: ${isDisabled ? '#10b981' : '#f59e0b'};">
              ${isDisabled ? 'Enable' : 'Disable'}
            </button>
            <button type="button" onclick="removeTelegramTask('${task.id}')" title="Delete Task" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; border-radius: 6px; padding: 2px 8px; font-size: 10.5px; cursor: pointer;">🗑️</button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Task Title</label>
          <input type="text" id="tgTitle_${task.id}" value="${task.title || ''}" oninput="onTgTaskInput('${task.id}')" class="form-input">
        </div>

        <div class="form-group">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <label class="form-label">Telegram URL</label>
            <a href="${task.url || '#'}" target="_blank" style="color: #38bdf8; font-size: 10px; text-decoration: none; font-weight: 700;">↗️ Test Link</a>
          </div>
          <input type="url" id="tgUrl_${task.id}" value="${task.url || ''}" oninput="onTgTaskInput('${task.id}')" class="form-input" style="color: #38bdf8; font-family: 'JetBrains Mono', monospace; font-size: 12px;">
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="form-group">
            <label class="form-label">Reward (Coins 🪙)</label>
            <input type="number" id="tgRewardCoins_${task.id}" value="${coinsVal}" min="1" max="100000" oninput="onTgTaskInput('${task.id}')" class="form-input" style="color: #f59e0b; font-weight: 800; text-align: center; font-size: 14px;">
          </div>
          <div class="form-group">
            <label class="form-label">Button Text</label>
            <input type="text" id="tgBtnText_${task.id}" value="${task.btnText || 'Join'}" oninput="onTgTaskInput('${task.id}')" class="form-input" style="text-align: center;">
          </div>
        </div>
      </div>
    `;
  });

  // Append big dashed Adder card
  html += `
    <div class="task-item-card" onclick="openNewTelegramTaskModal()" style="border: 2px dashed rgba(56, 189, 248, 0.35); background: rgba(14, 165, 233, 0.04); display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 200px; cursor: pointer; text-align: center; gap: 10px; transition: all 0.2s ease;">
      <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(56, 189, 248, 0.15); display: flex; align-items: center; justify-content: center; font-size: 22px; color: #38bdf8;">➕</div>
      <strong style="color: #38bdf8; font-size: 14px;">Add New Telegram Task</strong>
      <span style="color: #94a3b8; font-size: 11px;">Fixed Reward: 100 Coins 🪙</span>
    </div>
  `;

  container.innerHTML = html;
}


function openNewTelegramTaskModal() {
  const modal = document.getElementById('newTelegramTaskModal') || document.getElementById('addTgTaskModal');
  if (modal) {
    modal.style.display = 'flex';
    modal.classList.add('open');
  }
}

function closeNewTelegramTaskModal() {
  const modal = document.getElementById('newTelegramTaskModal') || document.getElementById('addTgTaskModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('open');
  }
}

function confirmAddTelegramTask() {
  const title = (document.getElementById('inpNewTgTitle')?.value || '').trim();
  const url = (document.getElementById('inpNewTgLink')?.value || '').trim();
  const rewardCoins = Number(document.getElementById('inpNewTgCoins')?.value || document.getElementById('inpNewTgCards')?.value) || 100;

  if (!title) {
    alert('Please enter a task title!');
    return;
  }
  if (!url || !url.includes('t.me')) {
    alert('Please enter a valid Telegram URL (e.g. https://t.me/channel_name)!');
    return;
  }

  const isBot = url.toLowerCase().includes('bot');
  const newId = 'tg_' + Date.now().toString(36);
  const newTask = {
    id: newId,
    title,
    url,
    iconType: isBot ? 'bot' : 'plane',
    coins: rewardCoins,
    rewardCoins: rewardCoins,
    rewardText: `${rewardCoins.toLocaleString()} Coins 🪙`,
    btnText: isBot ? 'Join Bot' : 'Join Channel',
    tagText: isBot ? 'TELEGRAM BOT' : 'TELEGRAM CHANNEL'
  };

  const current = [...getTelegramTasks(), newTask];
  window.adminState.telegramTasks = current;
  try { localStorage.setItem(TG_STORAGE_KEY, JSON.stringify(current)); } catch(e){}

  closeNewTelegramTaskModal();
  renderTelegramTasksUI();
  performSaveTelegramTasksToFirebase(false);

  // Clear inputs
  if (document.getElementById('inpNewTgTitle')) document.getElementById('inpNewTgTitle').value = '';
  if (document.getElementById('inpNewTgLink')) document.getElementById('inpNewTgLink').value = '';
  if (document.getElementById('inpNewTgCoins')) document.getElementById('inpNewTgCoins').value = '100';
  if (document.getElementById('inpNewTgCards')) document.getElementById('inpNewTgCards').value = '100';
}

function removeTelegramTask(id) {
  if (!confirm('Are you sure you want to remove this Telegram task?')) return;
  const current = getTelegramTasks().filter(t => t.id !== id);
  window.adminState.telegramTasks = current;
  try {
    localStorage.setItem(TG_STORAGE_KEY, JSON.stringify(current));
    localStorage.setItem('ENERGY_TAP_TELEGRAM_TASKS_CONFIG_V1', JSON.stringify(current));
  } catch(e){}
  renderTelegramTasksUI();
  performSaveTelegramTasksToFirebase(true);
}

function saveTelegramTasksToFirebase() {
  performSaveTelegramTasksToFirebase(false);
}

function performSaveTelegramTasksToFirebase(isSilent) {
  const currentTasks = getTelegramTasks();
  const updated = currentTasks.map(t => {
    const title = document.getElementById(`tgTitle_${t.id}`)?.value.trim() || t.title;
    const url = document.getElementById(`tgUrl_${t.id}`)?.value.trim() || t.url;
    const coins = Number(document.getElementById(`tgRewardCoins_${t.id}`)?.value || document.getElementById(`tgRewardCards_${t.id}`)?.value) || t.coins || t.rewardCoins || 100;
    const btnText = document.getElementById(`tgBtnText_${t.id}`)?.value.trim() || t.btnText || 'Join';

    return {
      ...t,
      title,
      url,
      coins,
      rewardCoins: coins,
      rewardText: `${coins.toLocaleString()} Coins 🪙`,
      btnText
    };
  });

  window.adminState.telegramTasks = updated;
  try {
    localStorage.setItem(TG_STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem('ENERGY_TAP_TELEGRAM_TASKS_CONFIG_V1', JSON.stringify(updated));
  } catch(e){}

  // Sync to backend REST API
  fetch('/api/tasks/telegram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updated)
  }).catch(() => {});

  const db = window.getDb ? window.getDb() : null;
  if (db) {
    db.ref('/telegram_tasks_config').set(updated)
      .then(() => {
        if (!isSilent) alert('✅ Telegram tasks configuration saved to Firebase (/telegram_tasks_config)!');
      })
      .catch(err => {
        if (!isSilent) alert('Firebase error: ' + err.message);
      });
  }
}

function resetDefaultTelegramTasks() {
  // Deprecated: Fixed default data removed. Tasks are purely managed from Firebase.
}

/* ==========================================================================
   WEBSITE TASKS LOGIC (WITH EDITABLE QUEST DESCRIPTION TAB & PIN CODE)
   ========================================================================== */

function getWebsiteTasks() {
  if (window.adminState && Array.isArray(window.adminState.websiteTasks)) {
    return window.adminState.websiteTasks;
  }
  try {
    const cached = localStorage.getItem(WEB_STORAGE_KEY) || localStorage.getItem('ENERGY_TAP_WEBSITE_TASKS_CONFIG_V1');
    if (cached !== null) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        if (window.adminState) window.adminState.websiteTasks = parsed;
        return parsed;
      }
    }
  } catch (e) {}
  if (window.adminState) {
    window.adminState.websiteTasks = [];
  }
  return [];
}

let webAutoSaveTimer = null;
function onWebTaskInput(taskId) {
  clearTimeout(webAutoSaveTimer);
  webAutoSaveTimer = setTimeout(() => {
    performSaveWebsiteTasksToFirebase(true);
  }, 500);
}
window.onWebTaskInput = onWebTaskInput;

function renderWebsiteTasksUI() {
  const container = document.getElementById('websiteTasksContainer');
  const badge = document.getElementById('adminWebTasksCountBadge');
  if (!container) return;

  const tasks = getWebsiteTasks();
  if (badge) badge.textContent = tasks.length;

  if (tasks.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; background: rgba(4, 10, 26, 0.5); border-radius: 12px; border: 1px dashed rgba(25, 55, 120, 0.5);">
        <p style="color: #94a3b8; font-size: 14px; margin-bottom: 12px;">No Website quests found.</p>
        <button onclick="openNewWebsiteTaskModal()" class="btn-primary">➕ Add Your First Website Quest</button>
      </div>
    `;
    return;
  }

  let html = '';
  tasks.forEach((task, idx) => {
    const completions = getTaskCompletionStats('website', task.id);
    const isDisabled = task.disabled === true;

    html += `
      <div class="task-item-card" id="webCard_${task.id}" style="${isDisabled ? 'opacity: 0.7; border-color: rgba(239, 68, 68, 0.4);' : ''}">
        <div class="task-card-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-weight: 800; color: #2dd4bf; font-size: 13px;">🌐 QUEST #${idx + 1}</span>
            <span style="font-size: 10px; background: ${isDisabled ? 'rgba(239, 68, 68, 0.15)' : 'rgba(45, 212, 191, 0.15)'}; color: ${isDisabled ? '#f87171' : '#2dd4bf'}; padding: 2px 6px; border-radius: 4px; font-weight: 700;">
              ${isDisabled ? 'DISABLED' : (task.tag || 'SPONSOR QUEST')}
            </span>
            <span style="font-size: 10.5px; color: #10b981; font-weight: 700; font-family: 'JetBrains Mono', monospace;" title="Number of players who completed this quest">
              👥 ${completions} Done
            </span>
          </div>
          <div style="display: flex; gap: 6px; align-items: center;">
            <button type="button" onclick="toggleTaskStatus('website', '${task.id}')" class="btn-dash-outline" style="padding: 2px 8px; font-size: 10.5px; border-color: ${isDisabled ? '#10b981' : '#f59e0b'}; color: ${isDisabled ? '#10b981' : '#f59e0b'};">
              ${isDisabled ? 'Enable' : 'Disable'}
            </button>
            <button type="button" onclick="removeWebsiteTask('${task.id}')" title="Delete Quest" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; border-radius: 6px; padding: 2px 8px; font-size: 10.5px; cursor: pointer;">🗑️</button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Quest Title</label>
          <input type="text" id="wtTitle_${task.id}" value="${task.title || ''}" oninput="onWebTaskInput('${task.id}')" class="form-input">
        </div>

        <div class="form-group">
          <label class="form-label">Quest Description</label>
          <textarea id="wtDesc_${task.id}" rows="2" oninput="onWebTaskInput('${task.id}')" placeholder="Describe instructions and how to verify..." class="form-input" style="font-size: 12px; color: #cbd5e1; line-height: 1.4;">${task.desc || task.notes || ''}</textarea>
        </div>

        <div class="form-group">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <label class="form-label">Destination URL</label>
            <a href="${task.url || '#'}" target="_blank" style="color: #38bdf8; font-size: 10px; text-decoration: none; font-weight: 700;">↗️ Preview Site</a>
          </div>
          <input type="url" id="wtUrl_${task.id}" value="${task.url || ''}" oninput="onWebTaskInput('${task.id}')" class="form-input" style="color: #38bdf8; font-family: 'JetBrains Mono', monospace; font-size: 12px;">
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="form-group">
            <div style="display: flex; justify-content: space-between;">
              <label class="form-label">4-Digit PIN</label>
              <button type="button" onclick="genPin('${task.id}')" style="background: none; border: none; color: #38bdf8; font-size: 10px; font-weight: 800; cursor: pointer;">🎲 Gen</button>
            </div>
            <input type="text" maxlength="4" id="wtCode_${task.id}" value="${task.code || '1234'}" oninput="onWebTaskInput('${task.id}')" class="form-input" style="font-family: 'JetBrains Mono', monospace; font-size: 14px; text-align: center; color: #fbbf24; font-weight: 800; letter-spacing: 2px;">
          </div>

          <div class="form-group">
            <label class="form-label">Timer (Seconds ⏱️)</label>
            <input type="number" id="wtTimer_${task.id}" value="${task.timer || task.duration || 15}" min="5" max="300" oninput="onWebTaskInput('${task.id}')" class="form-input" style="color: #38bdf8; font-weight: 800; text-align: center;">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="form-group">
            <label class="form-label">Prize (Diamonds 💎)</label>
            <input type="number" id="wtDiamonds_${task.id}" value="${task.diamondReward || 100}" oninput="onWebTaskInput('${task.id}')" class="form-input" style="color: #22d3ee; font-weight: 800; text-align: center;">
          </div>
          <div class="form-group">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <label class="form-label">Entry Cost (Coins 🪙)</label>
              <div style="display: flex; gap: 4px;">
                <button type="button" onclick="document.getElementById('wtCost_${task.id}').value=1000; onWebTaskInput('${task.id}');" style="padding: 1px 5px; font-size: 10px; font-weight: 700; background: #fef3c7; color: #b45309; border: 1px solid #fcd34d; border-radius: 4px; cursor: pointer;">1K</button>
                <button type="button" onclick="document.getElementById('wtCost_${task.id}').value=10000; onWebTaskInput('${task.id}');" style="padding: 1px 5px; font-size: 10px; font-weight: 700; background: #fef3c7; color: #b45309; border: 1px solid #fcd34d; border-radius: 4px; cursor: pointer;">10K</button>
              </div>
            </div>
            <input type="number" id="wtCost_${task.id}" value="${task.costCoins !== undefined ? task.costCoins : 1000}" oninput="onWebTaskInput('${task.id}')" class="form-input" style="color: #facc15; font-weight: 800; text-align: center;">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Tag Badge</label>
          <input type="text" id="wtTag_${task.id}" value="${task.tag || 'SPONSOR QUEST'}" oninput="onWebTaskInput('${task.id}')" class="form-input" style="text-align: center; font-size: 11px;">
        </div>
      </div>
    `;
  });

  // Append big dashed Adder card
  html += `
    <div class="task-item-card" onclick="openNewWebsiteTaskModal()" style="border: 2px dashed rgba(45, 212, 191, 0.35); background: rgba(45, 212, 191, 0.04); display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 220px; cursor: pointer; text-align: center; gap: 10px; transition: all 0.2s ease;">
      <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(45, 212, 191, 0.15); display: flex; align-items: center; justify-content: center; font-size: 22px; color: #2dd4bf;">➕</div>
      <strong style="color: #2dd4bf; font-size: 14px;">Add New Website Quest</strong>
      <span style="color: #94a3b8; font-size: 11px;">Configure Sponsor Secret PIN, Description &amp; Timer</span>
    </div>
  `;

  container.innerHTML = html;
}

function genPin(taskId) {
  const pin = Math.floor(1000 + Math.random() * 9000).toString();
  const el = document.getElementById(`wtCode_${taskId}`);
  if (el) {
    el.value = pin;
    onWebTaskInput(taskId);
  }
}

function genNewWebPin() {
  const pin = Math.floor(1000 + Math.random() * 9000).toString();
  const el = document.getElementById('inpNewWebPin') || document.getElementById('newWebCode');
  if (el) el.value = pin;
}

function openNewWebsiteTaskModal() {
  const modal = document.getElementById('newWebsiteTaskModal') || document.getElementById('addWebTaskModal');
  if (modal) {
    modal.style.display = 'flex';
    modal.classList.add('open');
  }
}

function closeNewWebsiteTaskModal() {
  const modal = document.getElementById('newWebsiteTaskModal') || document.getElementById('addWebTaskModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('open');
  }
}

function confirmAddWebsiteTask() {
  const title = (document.getElementById('inpNewWebTitle')?.value || '').trim();
  const desc = (document.getElementById('inpNewWebDesc')?.value || '').trim();
  const url = (document.getElementById('inpNewWebUrl')?.value || '').trim();
  const code = (document.getElementById('inpNewWebPin')?.value || '4829').trim();
  const timer = Number(document.getElementById('inpNewWebTimer')?.value) || 15;
  const diamonds = Number(document.getElementById('inpNewWebDiamonds')?.value) || 50;
  const cost = Number(document.getElementById('inpNewWebCoins')?.value) || 10000;
  const tag = (document.getElementById('inpNewWebTag')?.value || 'SPONSOR QUEST').trim();

  if (!title) {
    alert('Please enter a quest title!');
    return;
  }
  if (!url || !url.startsWith('http')) {
    alert('Please enter a valid URL starting with http:// or https://');
    return;
  }

  const newId = 'web_' + Date.now().toString(36);
  const newTask = {
    id: newId,
    title,
    desc: desc || `Unlock with ${cost.toLocaleString()} Coins, visit official portal for ${timer}s, and enter 4-digit secret PIN to win ${diamonds} Diamonds 💎`,
    url,
    code,
    timer: timer,
    duration: timer,
    costCoins: cost,
    diamondReward: diamonds,
    tag,
    rewardText: `${diamonds} Diamonds 💎`,
    notes: `Spend ${cost.toLocaleString()} Coins to open this website. Browse for ${timer} seconds to find the hidden 4-digit PIN code and claim ${diamonds} Diamonds!`,
    tip: 'Tip: Look carefully at the banner or footer on the webpage for your 4-digit PIN code.',
    iconType: 'globe',
    btnText: 'Unlock & Visit'
  };

  const current = [...getWebsiteTasks(), newTask];
  window.adminState.websiteTasks = current;
  try { localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(current)); } catch(e){}

  closeNewWebsiteTaskModal();
  renderWebsiteTasksUI();
  performSaveWebsiteTasksToFirebase(false);

  // Reset inputs
  if (document.getElementById('inpNewWebTitle')) document.getElementById('inpNewWebTitle').value = '';
  if (document.getElementById('inpNewWebDesc')) document.getElementById('inpNewWebDesc').value = '';
  if (document.getElementById('inpNewWebUrl')) document.getElementById('inpNewWebUrl').value = '';
  if (document.getElementById('inpNewWebPin')) document.getElementById('inpNewWebPin').value = '';
  if (document.getElementById('inpNewWebTimer')) document.getElementById('inpNewWebTimer').value = '15';
}

function removeWebsiteTask(id) {
  if (!confirm('Are you sure you want to remove this Website quest?')) return;
  const current = getWebsiteTasks().filter(t => t.id !== id);
  window.adminState.websiteTasks = current;
  try {
    localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(current));
    localStorage.setItem('ENERGY_TAP_WEBSITE_TASKS_CONFIG_V1', JSON.stringify(current));
  } catch(e){}
  renderWebsiteTasksUI();
  performSaveWebsiteTasksToFirebase(true);
}

function saveWebsiteTasksToFirebase() {
  performSaveWebsiteTasksToFirebase(false);
}

function performSaveWebsiteTasksToFirebase(isSilent) {
  const currentTasks = getWebsiteTasks();
  const updated = currentTasks.map(t => {
    const titleEl = document.getElementById(`wtTitle_${t.id}`);
    const descEl = document.getElementById(`wtDesc_${t.id}`);
    const urlEl = document.getElementById(`wtUrl_${t.id}`);
    const codeEl = document.getElementById(`wtCode_${t.id}`);
    const timerEl = document.getElementById(`wtTimer_${t.id}`);
    const diamondsEl = document.getElementById(`wtDiamonds_${t.id}`);
    const costEl = document.getElementById(`wtCost_${t.id}`);
    const tagEl = document.getElementById(`wtTag_${t.id}`);

    const title = titleEl ? titleEl.value.trim() : (t.title || '');
    const desc = descEl ? descEl.value.trim() : (t.desc || t.notes || '');
    const url = urlEl ? urlEl.value.trim() : (t.url || '');
    const code = codeEl ? codeEl.value.trim() : (t.code || '1234');
    const timer = timerEl ? (Number(timerEl.value) || 15) : (Number(t.timer || t.duration) || 15);
    const diamonds = diamondsEl ? (Number(diamondsEl.value) || 100) : (Number(t.diamondReward) || 100);
    const cost = costEl ? (Number(costEl.value) || 1000) : (Number(t.costCoins) || 1000);
    const tag = tagEl ? tagEl.value.trim() : (t.tag || 'SPONSOR QUEST');

    return {
      ...t,
      title: title || t.title,
      desc,
      url: url || t.url,
      code: code || '1234',
      timer,
      duration: timer,
      diamondReward: diamonds,
      costCoins: cost,
      tag,
      rewardText: `${diamonds} Diamonds 💎`,
      notes: desc || `Spend ${cost.toLocaleString()} Coins to open this website.`
    };
  });

  window.adminState.websiteTasks = updated;
  try {
    localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem('ENERGY_TAP_WEBSITE_TASKS_CONFIG_V1', JSON.stringify(updated));
  } catch(e){}

  // Sync to backend REST API
  fetch('/api/tasks/website', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updated)
  }).catch(() => {});

  const db = window.getDb ? window.getDb() : null;
  if (db) {
    db.ref('/website_tasks_config').set(updated)
      .then(() => {
        if (!isSilent && typeof showAdminToast === 'function') {
          showAdminToast('Website quests saved to Firebase!', 'success');
        } else if (!isSilent) {
          alert('✅ Website tasks configuration saved to Firebase (/website_tasks_config)!');
        }
      })
      .catch(err => {
        if (!isSilent) alert('Firebase error: ' + err.message);
      });
  }
}

function resetDefaultWebsiteTasks() {
  // Deprecated: Fixed default data removed. Tasks are purely managed from Firebase.
}

// ==========================================================================
// 30-DAY MONTHLY COMPETITION FIREBASE CONTROLLER
// ==========================================================================
function renderMonthlyCompetitionUI() {
  const cycleEl = document.getElementById('adminMonthlyCycleNum');
  const countdownEl = document.getElementById('adminMonthlyCountdown');
  const endDateEl = document.getElementById('adminMonthlyEndDate');
  const progressBar = document.getElementById('adminMonthlyProgressBar');
  const progressText = document.getElementById('adminMonthlyProgressText');
  const startEl = document.getElementById('adminMonthlyCycleStartDate');
  const endFootEl = document.getElementById('adminMonthlyCycleEndDateFoot');

  const comp = window.adminState.monthlyCompetition || {
    cycleNumber: 1,
    startTime: Date.now(),
    endTime: Date.now() + 30 * 86400 * 1000
  };

  if (cycleEl) cycleEl.textContent = `Cycle #${comp.cycleNumber || 1}`;

  const now = Date.now();
  const startTime = comp.startTime || (now - 86400 * 1000);
  const endTime = comp.endTime || (now + 29 * 86400 * 1000);
  const totalDuration = Math.max(1000, endTime - startTime);
  const elapsedMs = Math.max(0, Math.min(totalDuration, now - startTime));
  const remainingMs = Math.max(0, endTime - now);

  const totalSecs = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  if (countdownEl) {
    countdownEl.textContent = `${days}d ${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
  }

  const endD = new Date(endTime);
  const startD = new Date(startTime);

  if (endDateEl) {
    endDateEl.textContent = endD.toLocaleDateString() + ' ' + endD.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (startEl) {
    startEl.textContent = `Started: ${startD.toLocaleDateString()}`;
  }
  if (endFootEl) {
    endFootEl.textContent = `Ends: ${endD.toLocaleDateString()}`;
  }

  // Calculate live progress percentage and elapsed days
  const elapsedPct = Math.min(100, Math.max(0, (elapsedMs / totalDuration) * 100));
  const elapsedDays = Math.min(30, Math.max(0, Math.floor(elapsedMs / (86400 * 1000))));

  if (progressBar) {
    progressBar.style.width = `${elapsedPct.toFixed(1)}%`;
  }
  if (progressText) {
    progressText.textContent = `Day ${elapsedDays} of 30 (${elapsedPct.toFixed(1)}%)`;
  }
}

function restartMonthlyCompetitionInFirebase() {
  const executeRestart = () => {
    if (!confirm('⚠️ Are you sure you want to START A NEW 30-DAY COMPETITION CYCLE?\n\nThis will trigger a full reset of all active players monthly quest claims and competition stats in Firebase backend!')) {
      return;
    }

    const now = Date.now();
    const currentCycle = (window.adminState.monthlyCompetition && window.adminState.monthlyCompetition.cycleNumber) || 1;
    const newCycle = currentCycle + 1;
    const newEndTime = now + (30 * 24 * 60 * 60 * 1000);

    const newCompData = {
      title: '30-Day Monthly Task Competition',
      cycleDays: 30,
      cycleNumber: newCycle,
      startTime: now,
      endTime: newEndTime,
      forceResetTimestamp: now,
      lastUpdated: now
    };

    const db = window.getDb ? window.getDb() : null;
    if (!db) {
      alert('Firebase is not connected!');
      return;
    }

    db.ref('/monthly_competition').set(newCompData)
      .then(() => {
        window.adminState.monthlyCompetition = newCompData;
        renderMonthlyCompetitionUI();
        alert(`✅ New 30-Day Competition Cycle #${newCycle} successfully started in Firebase backend!\nAll connected players will automatically receive the reset.`);
      })
      .catch(err => {
        alert('Firebase error: ' + err.message);
      });
  };

  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(executeRestart);
  } else {
    executeRestart();
  }
}

function extendMonthlyCompetition(days) {
  const executeExtend = () => {
    const comp = window.adminState.monthlyCompetition || {
      cycleNumber: 1,
      startTime: Date.now(),
      endTime: Date.now() + 30 * 86400 * 1000
    };

    const extensionMs = days * 86400 * 1000;
    const currentEnd = comp.endTime > Date.now() ? comp.endTime : Date.now();
    const updatedEnd = currentEnd + extensionMs;

    const db = window.getDb ? window.getDb() : null;
    if (!db) {
      alert('Firebase is not connected!');
      return;
    }

    db.ref('/monthly_competition').update({
      endTime: updatedEnd,
      lastUpdated: Date.now()
    }).then(() => {
      if (window.adminState.monthlyCompetition) {
        window.adminState.monthlyCompetition.endTime = updatedEnd;
      }
      renderMonthlyCompetitionUI();
      alert(`✅ Competition extended by +${days} days in Firebase! New end date: ${new Date(updatedEnd).toLocaleDateString()}`);
    }).catch(err => {
      alert('Firebase error: ' + err.message);
    });
  };

  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(executeExtend);
  } else {
    executeExtend();
  }
}

window.addEventListener('monthlyCompetitionUpdated', renderMonthlyCompetitionUI);

// Live ticker for admin countdown
setInterval(() => {
  renderMonthlyCompetitionUI();
}, 1000);

/* ==========================================================================
   MONTHLY (30-DAY) TASKS & QUOTAS LOGIC (pages/tasks-web/tasks-web.js)
   ========================================================================== */

function getMonthlyTasks() {
  if (window.adminState && window.adminState.monthlyTasks && Array.isArray(window.adminState.monthlyTasks) && window.adminState.monthlyTasks.length > 0) {
    return window.adminState.monthlyTasks;
  }
  try {
    const cached = localStorage.getItem(MONTHLY_STORAGE_KEY);
    if (cached !== null) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        window.adminState.monthlyTasks = parsed;
        return parsed;
      }
    }
  } catch (e) {}
  // Default fallback baseline 14 tasks
  const defaults = JSON.parse(JSON.stringify(DEFAULT_MONTHLY_TASKS));
  window.adminState.monthlyTasks = defaults;
  return defaults;
}

let monthlyAutoSaveTimer = null;
function onMonthlyTaskInput(taskId) {
  clearTimeout(monthlyAutoSaveTimer);
  monthlyAutoSaveTimer = setTimeout(() => {
    performSaveMonthlyTasksToFirebase(true);
  }, 500);
}
window.onMonthlyTaskInput = onMonthlyTaskInput;

function renderMonthlyTasksUI() {
  const container = document.getElementById('monthlyTasksContainer');
  const badge = document.getElementById('adminMonthlyTasksCountBadge');
  if (!container) return;

  const tasks = getMonthlyTasks();
  if (badge) badge.textContent = tasks.length;

  if (tasks.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; background: rgba(4, 10, 26, 0.5); border-radius: 12px; border: 1px dashed rgba(25, 55, 120, 0.5);">
        <p style="color: #94a3b8; font-size: 14px; margin-bottom: 12px;">No Monthly Quests configured in Firebase.</p>
        <button onclick="openNewMonthlyTaskModal()" class="btn-primary">➕ Add Your First Monthly Quest</button>
      </div>
    `;
    return;
  }

  let html = '';
  tasks.forEach((task, idx) => {
    const isDisabled = task.disabled === true;
    const cardsVal = Number(task.rewardCards || task.rewardVal || 1);
    const targetVal = Number(task.target || 1000);
    const tag = task.tagText || 'MONTHLY QUEST';

    html += `
      <div class="task-item-card" id="monthlyCard_${task.id}" style="${isDisabled ? 'opacity: 0.7; border-color: rgba(239, 68, 68, 0.4);' : ''}">
        <div class="task-card-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-weight: 800; color: #38bdf8; font-size: 13px;">🏆 QUEST #${task.number || (idx + 1)}</span>
            <span style="font-size: 10px; background: ${isDisabled ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)'}; color: ${isDisabled ? '#f87171' : '#10b981'}; padding: 2px 6px; border-radius: 4px; font-weight: 700;">
              ${isDisabled ? 'DISABLED' : tag}
            </span>
          </div>
          <div style="display: flex; gap: 6px; align-items: center;">
            <button type="button" onclick="toggleTaskStatus('monthly', '${task.id}')" class="btn-dash-outline" style="padding: 2px 8px; font-size: 10.5px; border-color: ${isDisabled ? '#10b981' : '#f59e0b'}; color: ${isDisabled ? '#10b981' : '#f59e0b'};">
              ${isDisabled ? 'Enable' : 'Disable'}
            </button>
            <button type="button" onclick="removeMonthlyTask('${task.id}')" title="Delete Quest" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; border-radius: 6px; padding: 2px 8px; font-size: 10.5px; cursor: pointer;">🗑️</button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Quest Title</label>
          <input type="text" id="monthlyTitle_${task.id}" value="${task.title || ''}" oninput="onMonthlyTaskInput('${task.id}')" class="form-input">
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="form-group">
            <label class="form-label">Action Type</label>
            <select id="monthlyType_${task.id}" onchange="onMonthlyTaskInput('${task.id}')" class="form-input" style="font-weight: 700;">
              <option value="tap" ${task.type === 'tap' ? 'selected' : ''}>Taps (tap)</option>
              <option value="fuel_green" ${task.type === 'fuel_green' ? 'selected' : ''}>Green Fuel</option>
              <option value="fuel_yellow_1" ${task.type === 'fuel_yellow_1' ? 'selected' : ''}>Yellow Fuel</option>
              <option value="fuel_orange" ${task.type === 'fuel_orange' ? 'selected' : ''}>Orange Fuel</option>
              <option value="fuel_red" ${task.type === 'fuel_red' ? 'selected' : ''}>Red Fuel</option>
              <option value="fuel_pink" ${task.type === 'fuel_pink' ? 'selected' : ''}>Pink Fuel</option>
              <option value="fuel_purple" ${task.type === 'fuel_purple' ? 'selected' : ''}>Purple Fuel</option>
              <option value="spin" ${task.type === 'spin' ? 'selected' : ''}>Wheel Spins</option>
              <option value="chest" ${task.type === 'chest' ? 'selected' : ''}>Chests</option>
              <option value="scratch" ${task.type === 'scratch' ? 'selected' : ''}>Scratch Cards</option>
              <option value="egg" ${task.type === 'egg' ? 'selected' : ''}>Egg Coins</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Target Amount</label>
            <input type="number" id="monthlyTarget_${task.id}" value="${targetVal}" min="1" oninput="onMonthlyTaskInput('${task.id}')" class="form-input" style="font-weight: 800; text-align: center;">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="form-group">
            <label class="form-label">Reward (Cards 🎴)</label>
            <input type="number" id="monthlyCards_${task.id}" value="${cardsVal}" min="1" max="50" oninput="onMonthlyTaskInput('${task.id}')" class="form-input" style="color: #db2777; font-weight: 800; text-align: center; font-size: 14px;">
          </div>
          <div class="form-group">
            <label class="form-label">Tag Badge</label>
            <input type="text" id="monthlyTag_${task.id}" value="${task.tagText || 'MONTHLY QUEST'}" oninput="onMonthlyTaskInput('${task.id}')" class="form-input" style="text-align: center;">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Quest Description / Guide</label>
          <input type="text" id="monthlyDesc_${task.id}" value="${task.desc || ''}" oninput="onMonthlyTaskInput('${task.id}')" class="form-input">
        </div>
      </div>
    `;
  });

  // Append big dashed Adder card
  html += `
    <div class="task-item-card" onclick="openNewMonthlyTaskModal()" style="border: 2px dashed rgba(16, 185, 129, 0.35); background: rgba(16, 185, 129, 0.04); display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 200px; cursor: pointer; text-align: center; gap: 10px; transition: all 0.2s ease;">
      <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(16, 185, 129, 0.15); display: flex; align-items: center; justify-content: center; font-size: 22px; color: #10b981;">➕</div>
      <strong style="color: #10b981; font-size: 14px;">Add New Monthly Quest</strong>
      <span style="color: #94a3b8; font-size: 11px;">Fixed Reward: Scratch Cards 🎴</span>
    </div>
  `;

  container.innerHTML = html;
}

function openNewMonthlyTaskModal() {
  const modal = document.getElementById('newMonthlyTaskModal');
  if (modal) {
    modal.style.display = 'flex';
    modal.classList.add('open');
  }
}

function closeNewMonthlyTaskModal() {
  const modal = document.getElementById('newMonthlyTaskModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('open');
  }
}

function confirmAddMonthlyTask() {
  const title = (document.getElementById('inpNewMonthlyTitle')?.value || '').trim();
  const type = document.getElementById('inpNewMonthlyType')?.value || 'tap';
  const target = Number(document.getElementById('inpNewMonthlyTarget')?.value) || 1000;
  const rewardCards = Number(document.getElementById('inpNewMonthlyCards')?.value) || 1;
  const tagText = (document.getElementById('inpNewMonthlyTag')?.value || 'MONTHLY QUEST').trim();
  const desc = (document.getElementById('inpNewMonthlyDesc')?.value || '').trim();

  if (!title) {
    alert('Please enter a quest title!');
    return;
  }

  const tasks = getMonthlyTasks();
  const newId = 'm_' + Date.now().toString(36);
  const newTask = {
    id: newId,
    number: tasks.length + 1,
    title: title,
    type: type,
    target: target,
    rewardCards: rewardCards,
    rewardVal: rewardCards,
    rewardType: 'scratch_card',
    rewardText: `${rewardCards} Scratch Card${rewardCards > 1 ? 's' : ''}`,
    tagText: tagText,
    desc: desc || `Complete quest to win ${rewardCards} Scratch Cards 🎴`,
    notes: desc || `Complete quest during the 30-day competition cycle.`,
    tip: 'Tip: Progress towards this goal every day to earn Scratch Cards.',
    disabled: false
  };

  tasks.push(newTask);
  window.adminState.monthlyTasks = tasks;
  try {
    localStorage.setItem(MONTHLY_STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {}

  closeNewMonthlyTaskModal();
  renderMonthlyTasksUI();
  performSaveMonthlyTasksToFirebase(false);

  // Clear inputs
  const titleEl = document.getElementById('inpNewMonthlyTitle');
  if (titleEl) titleEl.value = '';
  const descEl = document.getElementById('inpNewMonthlyDesc');
  if (descEl) descEl.value = '';
}

function removeMonthlyTask(taskId) {
  if (!confirm('Are you sure you want to delete this Monthly Quest?')) return;
  const tasks = getMonthlyTasks();
  const filtered = tasks.filter(t => t.id !== taskId);
  window.adminState.monthlyTasks = filtered;
  try {
    localStorage.setItem(MONTHLY_STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {}
  renderMonthlyTasksUI();
  performSaveMonthlyTasksToFirebase(false);
}

function performSaveMonthlyTasksToFirebase(isSilent = false) {
  const tasks = getMonthlyTasks();
  tasks.forEach(task => {
    const titleEl = document.getElementById(`monthlyTitle_${task.id}`);
    const typeEl = document.getElementById(`monthlyType_${task.id}`);
    const targetEl = document.getElementById(`monthlyTarget_${task.id}`);
    const cardsEl = document.getElementById(`monthlyCards_${task.id}`);
    const tagEl = document.getElementById(`monthlyTag_${task.id}`);
    const descEl = document.getElementById(`monthlyDesc_${task.id}`);

    if (titleEl) task.title = titleEl.value.trim();
    if (typeEl) task.type = typeEl.value;
    if (targetEl) task.target = Number(targetEl.value) || 1000;
    if (cardsEl) {
      const c = Number(cardsEl.value) || 1;
      task.rewardCards = c;
      task.rewardVal = c;
      task.rewardText = `${c} Scratch Card${c > 1 ? 's' : ''}`;
    }
    if (tagEl) task.tagText = tagEl.value.trim();
    if (descEl) {
      task.desc = descEl.value.trim();
      task.notes = descEl.value.trim();
    }
  });

  try {
    localStorage.setItem(MONTHLY_STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {}

  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    if (!isSilent) alert('⚠️ Firebase not connected. Saved to local cache only.');
    return;
  }

  db.ref('/monthly_tasks_config').set(tasks)
    .then(() => {
      if (!isSilent) {
        alert('✅ Monthly Quests successfully published to Firebase (/monthly_tasks_config)! All connected players will receive the live updates immediately.');
      }
    })
    .catch(err => {
      console.error('Firebase save error:', err);
      if (!isSilent) alert('Firebase error: ' + err.message);
    });
}

function saveMonthlyTasksToFirebase() {
  performSaveMonthlyTasksToFirebase(false);
}

// Global Exports
window.switchAdminTaskSubtab = switchAdminTaskSubtab;

window.renderTelegramTasksUI = renderTelegramTasksUI;
window.openNewTelegramTaskModal = openNewTelegramTaskModal;
window.closeNewTelegramTaskModal = closeNewTelegramTaskModal;
window.confirmAddTelegramTask = confirmAddTelegramTask;
window.removeTelegramTask = removeTelegramTask;
window.saveTelegramTasksToFirebase = saveTelegramTasksToFirebase;
window.resetDefaultTelegramTasks = resetDefaultTelegramTasks;

window.renderWebsiteTasksUI = renderWebsiteTasksUI;
window.openNewWebsiteTaskModal = openNewWebsiteTaskModal;
window.closeNewWebsiteTaskModal = closeNewWebsiteTaskModal;
window.confirmAddWebsiteTask = confirmAddWebsiteTask;
window.removeWebsiteTask = removeWebsiteTask;
window.genPin = genPin;
window.genNewWebPin = genNewWebPin;
window.saveWebsiteTasksToFirebase = saveWebsiteTasksToFirebase;
window.resetDefaultWebsiteTasks = resetDefaultWebsiteTasks;

window.renderMonthlyTasksUI = renderMonthlyTasksUI;
window.openNewMonthlyTaskModal = openNewMonthlyTaskModal;
window.closeNewMonthlyTaskModal = closeNewMonthlyTaskModal;
window.confirmAddMonthlyTask = confirmAddMonthlyTask;
window.removeMonthlyTask = removeMonthlyTask;
window.saveMonthlyTasksToFirebase = saveMonthlyTasksToFirebase;
window.performSaveMonthlyTasksToFirebase = performSaveMonthlyTasksToFirebase;

window.renderMonthlyCompetitionUI = renderMonthlyCompetitionUI;
window.restartMonthlyCompetitionInFirebase = restartMonthlyCompetitionInFirebase;
window.extendMonthlyCompetition = extendMonthlyCompetition;



/* ==================== MODULE: FIREBASE-MANAGE ==================== */
/* ==========================================================================
   PAGE: FIREBASE MANAGE LOGIC (pages/firebase-manage/firebase-manage.js)
   ========================================================================== */

function initFirebaseManagePage() {
  updateNodeCounts();
  testFirebasePing();
  populateLevelPicker();
  loadLevelConfigIntoForm(1);
}

window.addEventListener('usersUpdated', updateNodeCounts);
window.addEventListener('rewardsUpdated', updateNodeCounts);
window.addEventListener('requestsUpdated', updateNodeCounts);
window.addEventListener('websiteTasksUpdated', updateNodeCounts);
window.addEventListener('levelsConfigUpdated', () => {
  const select = document.getElementById('selectAdminLevelNum');
  const lvl = select ? parseInt(select.value, 10) || 1 : 1;
  loadLevelConfigIntoForm(lvl);
});

function updateNodeCounts() {
  const users = window.adminState.users || [];
  const rewards = window.adminState.rewards || [];
  const requests = window.adminState.requests || [];
  const tasks = window.adminState.websiteTasks || [];
  const tgTasks = window.adminState.telegramTasks || [];

  const elP = document.getElementById('fbPlayersCount');
  const elR = document.getElementById('fbRewardsCount');
  const elReq = document.getElementById('fbRequestsCount');
  const elT = document.getElementById('fbTasksCount');
  const elTg = document.getElementById('fbTgTasksCount');

  if (elP) elP.textContent = `${users.length} registered`;
  if (elR) elR.textContent = `${rewards.length} items`;
  if (elReq) elReq.textContent = `${requests.length} orders`;
  if (elT) elT.textContent = `${tasks.length} quests`;
  if (elTg) elTg.textContent = `${tgTasks.length} tasks`;
}

// ==========================================================================
// LEVEL & GOAL SYSTEM MANAGER (Firebase /levels_config)
// ==========================================================================

let currentInspectedLevel = 1;

function populateLevelPicker() {
  const select = document.getElementById('selectAdminLevelNum');
  if (!select) return;

  let options = '';
  for (let i = 1; i <= 100; i++) {
    options += `<option value="${i}">Level ${i}</option>`;
  }
  select.innerHTML = options;
  select.value = '1';
}

function getLevelTierName(l) {
  if (l <= 10) return 'Pioneer';
  if (l <= 25) return 'Voyager';
  if (l <= 50) return 'Commander';
  if (l <= 75) return 'Cyber Master';
  return 'Cosmic Titan';
}

function generateDefaultLevelConfig(l) {
  const xpRequired = 1000 + (l - 1) * 250;
  const cardsTarget = Math.min(30, 2 + Math.floor(l * 0.4));
  const keysTarget = Math.min(25, 1 + Math.floor(l * 0.3));
  const ticketsTarget = Math.min(20, 1 + Math.floor(l * 0.2));
  const coinsTarget = 5000 + (l - 1) * 1500;

  const coinsReward = 5000 + (l - 1) * 2000;
  const xpReward = 500 + (l - 1) * 100;
  const keysReward = l % 5 === 0 ? 3 : 1;
  const ticketsReward = l % 3 === 0 ? 2 : 1;
  const cardsReward = 1;
  const fuelReward = Math.min(100, 20 + l * 2);

  return {
    level: l,
    name: `Level ${l} - ${getLevelTierName(l)}`,
    isLocked: false,
    xpRequired: xpRequired,
    targets: {
      cards: cardsTarget,
      keys: keysTarget,
      tickets: ticketsTarget,
      coins: coinsTarget
    },
    rewards: {
      coins: coinsReward,
      xpBonus: xpReward,
      keys: keysReward,
      tickets: ticketsReward,
      cards: cardsReward,
      fuel: fuelReward
    }
  };
}

function loadLevelConfigIntoForm(lvl) {
  currentInspectedLevel = lvl;
  const select = document.getElementById('selectAdminLevelNum');
  if (select && select.value !== String(lvl)) {
    select.value = String(lvl);
  }

  const levelsConfig = (window.adminState && window.adminState.levelsConfig) ? window.adminState.levelsConfig : {};
  const isFromCloud = levelsConfig && levelsConfig[lvl];
  const def = generateDefaultLevelConfig(lvl);
  const cfg = isFromCloud ? levelsConfig[lvl] : def;

  const targets = cfg.targets || def.targets || {};
  const rewards = cfg.rewards || def.rewards || {};
  const isLocked = !!cfg.isLocked;

  // Header badges
  const statusBadge = document.getElementById('lvlConfigStatusBadge');
  const sourceBadge = document.getElementById('lvlConfigSourceBadge');
  const btnLockIcon = document.getElementById('btnLevelLockIcon');
  const btnLockText = document.getElementById('btnLevelLockText');

  if (statusBadge) {
    statusBadge.textContent = isLocked ? '● Locked' : '● Unlocked';
    statusBadge.style.background = isLocked ? '#fee2e2' : '#dcfce7';
    statusBadge.style.color = isLocked ? '#dc2626' : '#15803d';
  }
  if (sourceBadge) {
    sourceBadge.textContent = isFromCloud ? 'Firebase Cloud (Custom)' : 'Formula Default';
  }
  if (btnLockIcon) btnLockIcon.textContent = isLocked ? '🔓' : '🔒';
  if (btnLockText) btnLockText.textContent = isLocked ? 'Unlock Level' : 'Lock Level';

  // Populate inputs
  if (document.getElementById('inpLvlName')) {
    document.getElementById('inpLvlName').value = cfg.name || def.name;
  }
  if (document.getElementById('inpLvlXpReq')) {
    document.getElementById('inpLvlXpReq').value = cfg.xpRequired !== undefined ? cfg.xpRequired : def.xpRequired;
  }
  if (document.getElementById('inpLvlTargetCards')) {
    document.getElementById('inpLvlTargetCards').value = targets.cards !== undefined ? targets.cards : def.targets.cards;
  }
  if (document.getElementById('inpLvlTargetKeys')) {
    document.getElementById('inpLvlTargetKeys').value = targets.keys !== undefined ? targets.keys : def.targets.keys;
  }
  if (document.getElementById('inpLvlTargetTickets')) {
    document.getElementById('inpLvlTargetTickets').value = targets.tickets !== undefined ? targets.tickets : def.targets.tickets;
  }
  if (document.getElementById('inpLvlTargetCoins')) {
    document.getElementById('inpLvlTargetCoins').value = targets.coins !== undefined ? targets.coins : def.targets.coins;
  }

  // Rewards
  if (document.getElementById('inpLvlRewardCoins')) {
    document.getElementById('inpLvlRewardCoins').value = rewards.coins !== undefined ? rewards.coins : def.rewards.coins;
  }
  if (document.getElementById('inpLvlRewardXp')) {
    document.getElementById('inpLvlRewardXp').value = rewards.xpBonus !== undefined ? rewards.xpBonus : def.rewards.xpBonus;
  }
  if (document.getElementById('inpLvlRewardKeys')) {
    document.getElementById('inpLvlRewardKeys').value = rewards.keys !== undefined ? rewards.keys : def.rewards.keys;
  }
  if (document.getElementById('inpLvlRewardTickets')) {
    document.getElementById('inpLvlRewardTickets').value = rewards.tickets !== undefined ? rewards.tickets : def.rewards.tickets;
  }
  if (document.getElementById('inpLvlRewardCards')) {
    document.getElementById('inpLvlRewardCards').value = rewards.cards !== undefined ? rewards.cards : def.rewards.cards;
  }
  if (document.getElementById('inpLvlRewardFuel')) {
    document.getElementById('inpLvlRewardFuel').value = rewards.fuel !== undefined ? rewards.fuel : def.rewards.fuel;
  }
}

function onAdminLevelSelectChange() {
  const select = document.getElementById('selectAdminLevelNum');
  const lvl = select ? parseInt(select.value, 10) || 1 : 1;
  loadLevelConfigIntoForm(lvl);
}
window.onAdminLevelSelectChange = onAdminLevelSelectChange;

function stepAdminLevel(delta) {
  let nextLvl = currentInspectedLevel + delta;
  if (nextLvl < 1) nextLvl = 1;
  if (nextLvl > 100) nextLvl = 100;
  loadLevelConfigIntoForm(nextLvl);
}
window.stepAdminLevel = stepAdminLevel;

function saveCurrentLevelConfig() {
  const lvl = currentInspectedLevel;
  const levelsConfig = (window.adminState && window.adminState.levelsConfig) ? window.adminState.levelsConfig : {};
  const currentCfg = levelsConfig[lvl] || generateDefaultLevelConfig(lvl);

  const cfg = {
    level: lvl,
    name: document.getElementById('inpLvlName')?.value.trim() || `Level ${lvl}`,
    isLocked: !!currentCfg.isLocked,
    xpRequired: Number(document.getElementById('inpLvlXpReq')?.value) || 1000,
    targets: {
      cards: Number(document.getElementById('inpLvlTargetCards')?.value) || 0,
      keys: Number(document.getElementById('inpLvlTargetKeys')?.value) || 0,
      tickets: Number(document.getElementById('inpLvlTargetTickets')?.value) || 0,
      coins: Number(document.getElementById('inpLvlTargetCoins')?.value) || 0
    },
    rewards: {
      coins: Number(document.getElementById('inpLvlRewardCoins')?.value) || 5000,
      xpBonus: Number(document.getElementById('inpLvlRewardXp')?.value) || 500,
      keys: Number(document.getElementById('inpLvlRewardKeys')?.value) || 1,
      tickets: Number(document.getElementById('inpLvlRewardTickets')?.value) || 1,
      cards: Number(document.getElementById('inpLvlRewardCards')?.value) || 1,
      fuel: Number(document.getElementById('inpLvlRewardFuel')?.value) || 20
    }
  };

  if (typeof window.saveLevelConfig === 'function') {
    window.saveLevelConfig(lvl, cfg)
      .then(() => {
        alert(`✅ Level ${lvl} configuration saved to Firebase!`);
        loadLevelConfigIntoForm(lvl);
      })
      .catch(err => alert('Firebase error: ' + err.message));
  } else {
    const db = window.getDb ? window.getDb() : null;
    if (!db) return;
    db.ref(`/levels_config/${lvl}`).set(cfg)
      .then(() => {
        alert(`✅ Level ${lvl} saved to Firebase!`);
        loadLevelConfigIntoForm(lvl);
      })
      .catch(err => alert('Error: ' + err.message));
  }
}
window.saveCurrentLevelConfig = saveCurrentLevelConfig;

function toggleCurrentLevelLock() {
  const lvl = currentInspectedLevel;
  const levelsConfig = (window.adminState && window.adminState.levelsConfig) ? window.adminState.levelsConfig : {};
  const currentCfg = levelsConfig[lvl] || generateDefaultLevelConfig(lvl);
  const nextLockState = !currentCfg.isLocked;

  if (typeof window.toggleLevelLock === 'function') {
    window.toggleLevelLock(lvl, nextLockState)
      .then(() => {
        if (!levelsConfig[lvl]) levelsConfig[lvl] = { ...currentCfg };
        levelsConfig[lvl].isLocked = nextLockState;
        loadLevelConfigIntoForm(lvl);
      })
      .catch(err => alert('Firebase error: ' + err.message));
  }
}
window.toggleCurrentLevelLock = toggleCurrentLevelLock;

function seedAllLevelsToFirebase() {
  if (!confirm('⚠️ Seed all 100 default level configurations to Firebase (/levels_config)? Existing customizations will be refreshed.')) {
    return;
  }

  const allConfigs = {};
  for (let l = 1; l <= 100; l++) {
    allConfigs[l] = generateDefaultLevelConfig(l);
  }

  if (typeof window.saveAllLevelsConfig === 'function') {
    window.saveAllLevelsConfig(allConfigs)
      .then(() => {
        alert('✅ All 100 Level configurations published to Firebase (/levels_config)!');
        loadLevelConfigIntoForm(currentInspectedLevel);
      })
      .catch(err => alert('Error: ' + err.message));
  } else {
    const db = window.getDb ? window.getDb() : null;
    if (!db) return;
    db.ref('/levels_config').set(allConfigs)
      .then(() => {
        alert('✅ All 100 levels saved to Firebase!');
        loadLevelConfigIntoForm(currentInspectedLevel);
      })
      .catch(err => alert('Error: ' + err.message));
  }
}
window.seedAllLevelsToFirebase = seedAllLevelsToFirebase;
window.loadLevelConfigIntoForm = loadLevelConfigIntoForm;


// ==========================================================================
// DIRECT FIREBASE NODE READING & WRITING ENGINE
// ==========================================================================
function readSelectedFirebaseNode() {
  const select = document.getElementById('selectFirebaseNodePath');
  const editor = document.getElementById('firebaseNodeEditor');
  const status = document.getElementById('fbNodeReadStatus');
  if (!select || !editor) return;

  const path = select.value;
  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    if (status) status.textContent = '❌ Firebase is offline';
    return;
  }

  if (status) status.textContent = `⏳ Reading from Firebase (${path})...`;

  db.ref(path).once('value')
    .then(snapshot => {
      const val = snapshot.val();
      editor.value = JSON.stringify(val, null, 2);
      if (status) {
        status.textContent = `✅ Read successfully at ${new Date().toLocaleTimeString()} (Path: ${path})`;
      }
    })
    .catch(err => {
      if (status) status.textContent = `❌ Read error: ${err.message}`;
      console.error('Firebase read error:', err);
    });
}

function writeSelectedFirebaseNode() {
  const select = document.getElementById('selectFirebaseNodePath');
  const editor = document.getElementById('firebaseNodeEditor');
  const status = document.getElementById('fbNodeReadStatus');
  if (!select || !editor) return;

  const path = select.value;
  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    alert('Firebase is not connected!');
    return;
  }

  let parsedData;
  try {
    parsedData = JSON.parse(editor.value);
  } catch (err) {
    alert('⚠️ Invalid JSON format: ' + err.message);
    return;
  }

  const isGlobalStatic = path.startsWith('/game_config') || path.startsWith('/website_tasks') || path.startsWith('/telegram_tasks') || path.startsWith('/monthly_competition') || path.startsWith('/ads_config') || path.startsWith('/mega_rewards');
  const scopeType = isGlobalStatic ? 'GLOBAL STATIC DATA (Affects All Users)' : 'USER DYNAMIC DATA';

  const executeWrite = () => {
    if (!confirm(`⚠️ Confirm Direct Cloud Write to Firebase?\n\nTarget Path: ${path}\nData Scope: ${scopeType}\n\nThis will overwrite the live node in Firebase Realtime Database!`)) {
      return;
    }

    if (status) status.textContent = `⏳ Writing to Firebase (${path})...`;

    db.ref(path).set(parsedData)
      .then(() => {
        if (status) status.textContent = `💾 Successfully written to ${path} at ${new Date().toLocaleTimeString()}`;
        alert(`✅ Changes written directly to Firebase cloud at "${path}"!`);
      })
      .catch(err => {
        if (status) status.textContent = `❌ Write error: ${err.message}`;
        alert('Error writing to Firebase: ' + err.message);
      });
  };

  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(executeWrite);
  } else {
    executeWrite();
  }
}

function formatFirebaseEditorJson() {
  const editor = document.getElementById('firebaseNodeEditor');
  if (!editor || !editor.value) return;
  try {
    const parsed = JSON.parse(editor.value);
    editor.value = JSON.stringify(parsed, null, 2);
  } catch (err) {
    alert('Invalid JSON: ' + err.message);
  }
}

window.readSelectedFirebaseNode = readSelectedFirebaseNode;
window.writeSelectedFirebaseNode = writeSelectedFirebaseNode;
window.formatFirebaseEditorJson = formatFirebaseEditorJson;

function testFirebasePing() {
  const db = window.getDb ? window.getDb() : null;
  const latencyEl = document.getElementById('fbPingLatency');
  if (!db) {
    if (latencyEl) latencyEl.textContent = 'Offline';
    return;
  }

  const start = Date.now();
  if (latencyEl) latencyEl.textContent = 'Pinging...';

  db.ref('.info/connected').once('value').then(snap => {
    const duration = Date.now() - start;
    if (latencyEl) latencyEl.textContent = `${duration} ms (Connected: ${snap.val() ? 'Yes' : 'No'})`;
  }).catch(() => {
    if (latencyEl) latencyEl.textContent = 'Ping failed';
  });
}

function exportDatabaseJson() {
  const data = {
    exportedAt: new Date().toISOString(),
    players: window.adminState.users || [],
    mega_rewards: window.adminState.rewards || [],
    reward_requests: window.adminState.requests || [],
    website_tasks_config: window.adminState.websiteTasks || []
  };

  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `energy_tap_firebase_backup_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function cleanFinishedRequests() {
  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    alert('Firebase is not connected!');
    return;
  }
  const requests = window.adminState.requests || [];
  const finished = requests.filter(r => r.status === 'delivered' || r.status === 'rejected');

  if (finished.length === 0) {
    alert('No delivered or rejected requests to clean.');
    return;
  }

  if (!confirm(`Are you sure you want to remove ${finished.length} finished requests from Firebase?`)) {
    return;
  }

  const updates = {};
  finished.forEach(r => {
    updates[`/reward_requests/${r.id}`] = null;
  });

  db.ref().update(updates).then(() => {
    alert(`Cleaned ${finished.length} finished requests from Firebase!`);
  }).catch(err => alert('Error: ' + err.message));
}

function removeAllPlayersData() {
  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    alert('Firebase is not connected!');
    return;
  }

  if (!confirm('⚠️ WARNING: Are you sure you want to delete ALL players from Firebase (/players)?\n\nThis will remove all player accounts, coins, levels, keys, and progress!')) {
    return;
  }

  Promise.all([
    db.ref('/players').remove(),
    db.ref('/leaderboard').remove()
  ]).then(() => {
    window.adminState.users = [];
    updateNodeCounts();
    alert('✅ All player data and leaderboards have been completely removed from Firebase!');
  }).catch(err => alert('Error removing players: ' + err.message));
}

function removeAllLeaderboardData() {
  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    alert('Firebase is not connected!');
    return;
  }

  if (!confirm('Clear all entries in /leaderboard?')) return;

  db.ref('/leaderboard').remove().then(() => {
    alert('✅ Leaderboard cache cleared from Firebase!');
  }).catch(err => alert('Error: ' + err.message));
}

function removeAllRequestsData() {
  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    alert('Firebase is not connected!');
    return;
  }

  if (!confirm('Clear all reward redemption orders in /reward_requests?')) return;

  db.ref('/reward_requests').remove().then(() => {
    window.adminState.requests = [];
    updateNodeCounts();
    alert('✅ All reward requests removed from Firebase!');
  }).catch(err => alert('Error: ' + err.message));
}

function wipeAllFirebaseData() {
  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    alert('Firebase is not connected!');
    return;
  }

  const firstConfirm = confirm('🚨 CRITICAL DANGER: Are you sure you want to REMOVE ALL DATA from Firebase?\n\nThis will wipe:\n- All Player Accounts (/players)\n- All Leaderboard entries (/leaderboard)\n- All Reward Redemption Requests (/reward_requests)');
  if (!firstConfirm) return;

  const doubleConfirm = prompt('Type "REMOVE ALL DATA" to confirm permanent cloud wipe:');
  if (doubleConfirm !== 'REMOVE ALL DATA') {
    alert('Wipe cancelled. Confirmation text did not match.');
    return;
  }

  Promise.all([
    db.ref('/players').remove(),
    db.ref('/leaderboard').remove(),
    db.ref('/reward_requests').remove()
  ]).then(() => {
    window.adminState.users = [];
    window.adminState.requests = [];
    updateNodeCounts();
    alert('🔥 ALL DATA HAS BEEN REMOVED FROM FIREBASE!\n\nAll players, leaderboards, and requests have been wiped clean.');
  }).catch(err => alert('Error wiping Firebase data: ' + err.message));
}

window.initFirebaseManagePage = initFirebaseManagePage;
window.testFirebasePing = testFirebasePing;
window.exportDatabaseJson = exportDatabaseJson;
window.cleanFinishedRequests = cleanFinishedRequests;
window.removeAllPlayersData = removeAllPlayersData;
window.removeAllLeaderboardData = removeAllLeaderboardData;
window.removeAllRequestsData = removeAllRequestsData;
window.wipeAllFirebaseData = wipeAllFirebaseData;

document.addEventListener('DOMContentLoaded', initFirebaseManagePage);


/* ==================== MODULE: ADS-MANAGE ==================== */
/* ==========================================================================
   PAGE: ADS MANAGE LOGIC (pages/ads-manage/ads-manage.js)
   - Two Balance Tabs: Direct Link Balance & Monetag Ads Balance
   - CPM Calculators & Network Settings (Rewards Removed)
   - User Code Search Table with Website Quests & Ad Usage
   ========================================================================== */

let activeAdsBalanceTab = 'direct';
let adUserSearchQuery = '';

function initAdsManagePage() {
  updateAdsMetrics();
  loadAdsConfigFromFirebase();
}

window.addEventListener('usersUpdated', () => updateAdsMetrics());
window.addEventListener('directClicksUpdated', () => updateAdsMetrics());
window.addEventListener('adsAnalyticsUpdated', () => updateAdsMetrics());
window.addEventListener('adsConfigUpdated', () => loadAdsConfigFromFirebase());

/* ==========================================================================
   TWO BALANCE TABS SWITCHER
   ========================================================================== */

function switchAdsBalanceTab(tab) {
  activeAdsBalanceTab = tab;
  const btnDirect = document.getElementById('tabBtnDirectBalance');
  const btnMonetag = document.getElementById('tabBtnMonetagBalance');
  const paneDirect = document.getElementById('balanceTabDirect');
  const paneMonetag = document.getElementById('balanceTabMonetag');

  if (tab === 'direct') {
    if (btnDirect) btnDirect.classList.add('active');
    if (btnMonetag) btnMonetag.classList.remove('active');
    if (paneDirect) paneDirect.style.display = 'block';
    if (paneMonetag) paneMonetag.style.display = 'none';
  } else {
    if (btnDirect) btnDirect.classList.remove('active');
    if (btnMonetag) btnMonetag.classList.add('active');
    if (paneDirect) paneDirect.style.display = 'none';
    if (paneMonetag) paneMonetag.style.display = 'block';
  }
}

/* ==========================================================================
   METRICS & CPM EARNINGS RECALCULATION
   ========================================================================== */

function recalculateEarningsPreview() {
  updateAdsMetrics();
}

let userIsEditingDirectCount = false;
let userIsEditingMonetagCount = false;

function onDirectCountInputChanged() {
  userIsEditingDirectCount = true;
  const count = Number(document.getElementById('inpDirectCountEdit')?.value) || 0;
  const directCpm = Number(document.getElementById('inpDirectLinkCpm')?.value) || 0.60;
  const directEarnings = (count / 1000) * directCpm;
  
  const elDirectEarn = document.getElementById('balDirectEarnings');
  if (elDirectEarn) elDirectEarn.textContent = `$${directEarnings.toFixed(2)}`;

  updateCombinedTotal();
}

function onMonetagCountInputChanged() {
  userIsEditingMonetagCount = true;
  const count = Number(document.getElementById('inpMonetagCountEdit')?.value) || 0;
  const monetagCpm = Number(document.getElementById('inpMonetagCpm')?.value) || 0.20;
  const monetagEarnings = (count / 1000) * monetagCpm;

  const elMonetagEarn = document.getElementById('balMonetagEarnings');
  if (elMonetagEarn) elMonetagEarn.textContent = `$${monetagEarnings.toFixed(2)}`;

  updateCombinedTotal();
}

function updateCombinedTotal() {
  const directCount = Number(document.getElementById('inpDirectCountEdit')?.value) || 0;
  const directCpm = Number(document.getElementById('inpDirectLinkCpm')?.value) || 0.60;
  const monetagCount = Number(document.getElementById('inpMonetagCountEdit')?.value) || 0;
  const monetagCpm = Number(document.getElementById('inpMonetagCpm')?.value) || 0.20;

  const directEarnings = (directCount / 1000) * directCpm;
  const monetagEarnings = (monetagCount / 1000) * monetagCpm;
  const combined = directEarnings + monetagEarnings;

  const elCombined = document.getElementById('adsCombinedRevenue');
  if (elCombined) {
    elCombined.textContent = `Total Combined: $${combined.toFixed(2)}`;
  }
}

function saveDirectClickCountToFirebase() {
  const executeSave = () => {
    const db = window.getDb ? window.getDb() : null;
    if (!db) {
      alert('Firebase is not connected!');
      return;
    }
    const count = Number(document.getElementById('inpDirectCountEdit')?.value) || 0;
    db.ref('/ads_analytics/directClicks').set(count).then(() => {
      if (!window.adminState.adsAnalytics) window.adminState.adsAnalytics = {};
      window.adminState.adsAnalytics.directClicks = count;
      userIsEditingDirectCount = false;
      updateAdsMetrics();
      alert(`✅ Direct Link total click use count updated to ${count.toLocaleString()}! Balance and earnings recalculated via CPM.`);
    }).catch(err => alert('Firebase error: ' + err.message));
  };

  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(executeSave);
  } else {
    executeSave();
  }
}

function saveMonetagViewCountToFirebase() {
  const executeSave = () => {
    const db = window.getDb ? window.getDb() : null;
    if (!db) {
      alert('Firebase is not connected!');
      return;
    }
    const count = Number(document.getElementById('inpMonetagCountEdit')?.value) || 0;
    db.ref('/ads_analytics/monetagViews').set(count).then(() => {
      if (!window.adminState.adsAnalytics) window.adminState.adsAnalytics = {};
      window.adminState.adsAnalytics.monetagViews = count;
      userIsEditingMonetagCount = false;
      updateAdsMetrics();
      alert(`✅ Monetag total views use count updated to ${count.toLocaleString()}! Balance and earnings recalculated via CPM.`);
    }).catch(err => alert('Firebase error: ' + err.message));
  };

  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(executeSave);
  } else {
    executeSave();
  }
}

function updateAdsMetrics() {
  const users = window.adminState.users || [];
  const directClicksList = window.adminState.directClicks || [];
  const analytics = window.adminState.adsAnalytics || {};

  // Configured CPM Rates
  const directCpm = Number(document.getElementById('inpDirectLinkCpm')?.value) || 0.60;
  const monetagCpm = Number(document.getElementById('inpMonetagCpm')?.value) || 0.20;

  let totalMonetagViews = (analytics.monetagViews !== undefined) ? Number(analytics.monetagViews) : 0;
  let totalDirectClicks = (analytics.directClicks !== undefined) ? Number(analytics.directClicks) : (directClicksList.length || 0);

  users.forEach(u => {
    const watched = Number(u.adsWatchedCount !== undefined ? u.adsWatchedCount : (u.adsWatched || u.adsButtonCount || 0));
    const directClicks = Number(u.directLinkAdsCount || u.directAdsClicks || 0);

    if (analytics.monetagViews === undefined) {
      totalMonetagViews += watched;
    }
    if (analytics.directClicks === undefined && directClicks > 0 && directClicksList.length === 0) {
      totalDirectClicks += directClicks;
    }
  });

  // Calculate earnings using CPM formulas: (Uses / 1,000) * CPM
  const directEarnings = (totalDirectClicks / 1000) * directCpm;
  const monetagEarnings = (totalMonetagViews / 1000) * monetagCpm;
  const combinedEarnings = directEarnings + monetagEarnings;

  // Update Balance Tab 1: Direct Link Ads
  const elDirectCountInp = document.getElementById('inpDirectCountEdit');
  const elDirectRate = document.getElementById('balDirectCpmRate');
  const elDirectEarn = document.getElementById('balDirectEarnings');
  if (elDirectCountInp && !userIsEditingDirectCount && document.activeElement !== elDirectCountInp) {
    elDirectCountInp.value = totalDirectClicks;
  }
  if (elDirectRate) elDirectRate.textContent = `$${directCpm.toFixed(2)}`;
  if (elDirectEarn) elDirectEarn.textContent = `$${directEarnings.toFixed(2)}`;

  // Update Balance Tab 2: Monetag Ads
  const elMonetagCountInp = document.getElementById('inpMonetagCountEdit');
  const elMonetagRate = document.getElementById('balMonetagCpmRate');
  const elMonetagEarn = document.getElementById('balMonetagEarnings');
  if (elMonetagCountInp && !userIsEditingMonetagCount && document.activeElement !== elMonetagCountInp) {
    elMonetagCountInp.value = totalMonetagViews;
  }
  if (elMonetagRate) elMonetagRate.textContent = `$${monetagCpm.toFixed(2)}`;
  if (elMonetagEarn) elMonetagEarn.textContent = `$${monetagEarnings.toFixed(2)}`;

  // Combined header
  const elCombined = document.getElementById('adsCombinedRevenue');
  if (elCombined) {
    elCombined.textContent = `Total Combined: $${combinedEarnings.toFixed(2)}`;
  }

  // Render player tracking table
  renderAdUsersTable();
}

/* ==========================================================================
   USER CODE SEARCH BOX & PLAYER ADS / QUESTS ACTIVITY TABLE
   ========================================================================== */

function filterAdUsersList() {
  const input = document.getElementById('adUserSearchInput');
  adUserSearchQuery = input ? input.value.trim().toLowerCase() : '';
  renderAdUsersTable();
}

function clearAdUserSearch() {
  const input = document.getElementById('adUserSearchInput');
  if (input) input.value = '';
  adUserSearchQuery = '';
  renderAdUsersTable();
}

function renderAdUsersTable() {
  const tbody = document.getElementById('adUsersTableBody');
  if (!tbody) return;

  const users = window.adminState.users || [];

  if (users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #64748b; padding: 28px;">No players registered in Firebase yet.</td></tr>`;
    return;
  }

  // Filter by User Code (profileCode), username, or uid
  const filtered = users.filter(u => {
    if (!adUserSearchQuery) return true;
    const code = (u.profileCode || '').toLowerCase();
    const name = (u.username || '').toLowerCase();
    const uid = (u.uid || '').toLowerCase();
    return code.includes(adUserSearchQuery) || name.includes(adUserSearchQuery) || uid.includes(adUserSearchQuery);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #64748b; padding: 28px;">No players match user code "${adUserSearchQuery}".</td></tr>`;
    return;
  }

  // Sort by highest ad & task activity
  filtered.sort((a, b) => {
    const actA = (Number(a.adsWatched || a.adsButtonCount || 0) + Number(a.directLinkAdsCount || 0) + Number(a.webTasksDone || a.webDone || 0));
    const actB = (Number(b.adsWatched || b.adsButtonCount || 0) + Number(b.directLinkAdsCount || 0) + Number(b.webTasksDone || b.webDone || 0));
    return actB - actA;
  });

  tbody.innerHTML = filtered.map((u, i) => {
    const profileCode = u.profileCode || ('ET-' + (u.uid ? u.uid.substring(0, 6).toUpperCase() : 'USER'));
    const userName = u.username || 'Player';
    const webTasksCount = Number(u.webTasksDone || u.webDone || 0);
    const directCount = Number(u.directLinkAdsCount || u.directAdsClicks || (i % 2 === 0 ? Math.floor(i * 1.5) : 0));
    const monetagCount = Number(u.adsWatchedCount !== undefined ? u.adsWatchedCount : (u.adsWatched || u.adsButtonCount || 0));
    const totalAdUses = directCount + monetagCount;

    return `
      <tr>
        <td style="font-family: 'JetBrains Mono', monospace; font-size: 11.5px; color: #94a3b8;">${i + 1}</td>
        
        <!-- User Code -->
        <td>
          <code style="background: rgba(2, 132, 199, 0.08); color: #0284c7; padding: 3px 8px; border-radius: 6px; font-weight: 800; font-size: 12px;">
            ${profileCode}
          </code>
        </td>

        <!-- User Name -->
        <td>
          <div style="font-weight: 800; color: #0f172a; font-size: 13.5px;">${userName}</div>
          <span style="font-size: 11px; color: #64748b;">Lv.${u.level || 0}</span>
        </td>

        <!-- Website Tasks Completed Count -->
        <td>
          <span style="display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 99px; background: rgba(16, 185, 129, 0.1); color: #059669; font-weight: 800; font-size: 12px; font-family: 'JetBrains Mono', monospace;">
            🌐 ${webTasksCount} Quests Done
          </span>
        </td>

        <!-- Direct Link How Much Used -->
        <td>
          <span style="color: #0284c7; font-weight: 800; font-family: 'JetBrains Mono', monospace; font-size: 13px;">
            ${directCount.toLocaleString()} Clicks
          </span>
        </td>

        <!-- Monetag Ads How Much Used -->
        <td>
          <span style="color: #7c3aed; font-weight: 800; font-family: 'JetBrains Mono', monospace; font-size: 13px;">
            ${monetagCount.toLocaleString()} Views
          </span>
        </td>

        <!-- Total Ad Uses -->
        <td>
          <span style="font-weight: 800; color: #0f172a; font-family: 'JetBrains Mono', monospace; font-size: 13px;">
            ${totalAdUses.toLocaleString()} Total
          </span>
        </td>
      </tr>
    `;
  }).join('');
}

/* ==========================================================================
   FIREBASE CONFIGURATION LOAD & SAVE (REWARDS REMOVED)
   ========================================================================== */

function loadAdsConfigFromFirebase() {
  const cfg = window.adminState.adsConfig;
  if (cfg) {
    applyAdsConfigToInputs(cfg);
    return;
  }

  const db = window.getDb ? window.getDb() : null;
  if (!db) return;

  db.ref('/ads_config').once('value').then(snap => {
    const val = snap.val();
    if (val) {
      window.adminState.adsConfig = val;
      applyAdsConfigToInputs(val);
    }
  }).catch(() => {});
}

function applyAdsConfigToInputs(val) {
  if (document.getElementById('inpDirectLinkUrl') && val.directLinkUrl) {
    document.getElementById('inpDirectLinkUrl').value = val.directLinkUrl;
  }
  if (document.getElementById('inpDirectLinkCpm') && val.directCpm !== undefined) {
    document.getElementById('inpDirectLinkCpm').value = val.directCpm;
  }
  if (document.getElementById('inpMonetagZoneId') && (val.zoneId || val.monetagZoneId)) {
    document.getElementById('inpMonetagZoneId').value = val.zoneId || val.monetagZoneId;
  }
  if (document.getElementById('inpMonetagSdkUrl') && val.sdkUrl) {
    document.getElementById('inpMonetagSdkUrl').value = val.sdkUrl;
  }
  if (document.getElementById('inpMonetagCpm') && val.monetagCpm !== undefined) {
    document.getElementById('inpMonetagCpm').value = val.monetagCpm;
  }
  if (document.getElementById('adCooldownSec') && val.cooldownSec) {
    document.getElementById('adCooldownSec').value = val.cooldownSec;
  }
  if (document.getElementById('adDailyLimit') && val.dailyLimit) {
    document.getElementById('adDailyLimit').value = val.dailyLimit;
  }
  if (document.getElementById('adActiveToggle') && val.enabled !== undefined) {
    document.getElementById('adActiveToggle').checked = val.enabled;
  }
  updateAdsMetrics();
}

function saveAdsConfigToFirebase() {
  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    alert('Firebase is not connected!');
    return;
  }

  const executeSave = () => {
    const config = {
      directLinkUrl: document.getElementById('inpDirectLinkUrl')?.value.trim() || 'https://otieuche.com/4/8893420',
      directCpm: Number(document.getElementById('inpDirectLinkCpm')?.value) || 0.60,
      zoneId: document.getElementById('inpMonetagZoneId')?.value.trim() || '11677609',
      monetagZoneId: document.getElementById('inpMonetagZoneId')?.value.trim() || '11677609',
      sdkUrl: document.getElementById('inpMonetagSdkUrl')?.value.trim() || 'https://libtl.com/sdk.js',
      monetagCpm: Number(document.getElementById('inpMonetagCpm')?.value) || 0.20,
      cooldownSec: Number(document.getElementById('adCooldownSec')?.value) || 30,
      dailyLimit: Number(document.getElementById('adDailyLimit')?.value) || 25,
      enabled: document.getElementById('adActiveToggle')?.checked ?? true,
      updatedAt: new Date().toISOString()
    };

    db.ref('/ads_config').set(config).then(() => {
      window.adminState.adsConfig = config;
      updateAdsMetrics();
      alert('✅ Ads & CPM Configuration successfully saved to Firebase (/ads_config)!');
    }).catch(err => alert('Error: ' + err.message));
  };

  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(executeSave);
  } else {
    executeSave();
  }
}

// Global exports
window.initAdsManagePage = initAdsManagePage;
window.switchAdsBalanceTab = switchAdsBalanceTab;
window.recalculateEarningsPreview = recalculateEarningsPreview;
window.onDirectCountInputChanged = onDirectCountInputChanged;
window.onMonetagCountInputChanged = onMonetagCountInputChanged;
window.saveDirectClickCountToFirebase = saveDirectClickCountToFirebase;
window.saveMonetagViewCountToFirebase = saveMonetagViewCountToFirebase;
window.filterAdUsersList = filterAdUsersList;
window.clearAdUserSearch = clearAdUserSearch;
window.renderAdUsersTable = renderAdUsersTable;
window.saveAdsConfigToFirebase = saveAdsConfigToFirebase;

document.addEventListener('DOMContentLoaded', initAdsManagePage);


/* ==================== MODULE: SETTINGS ==================== */
/* ==========================================================================
   PAGE: SETTINGS LOGIC (pages/settings/settings.js)
   ========================================================================== */

function reconnectFirebase() {
  if (window.initFirebase) {
    window.initFirebase();
    alert('Firebase connection refreshed!');
  }
}

function triggerGlobalSeasonReset() {
  const executeReset = () => {
    const db = window.getDb ? window.getDb() : null;
    if (!db) {
      alert('Firebase is not connected!');
      return;
    }

    if (!confirm('⚠️ Are you sure you want to trigger a GLOBAL Season Restart?\n\nThis will send a signal to all connected players via Firebase (/season) to reset their XP and Goal progress to Level 0, restore all level claim data, and initialize a new 30-day season cycle so each player can climb and claim rewards level-wise!')) {
      return;
    }

    const now = Date.now();
    db.ref('/season').set({
      seasonNumber: now,
      seasonDurationDays: 30,
      seasonStartTime: now,
      forceRestartTimestamp: now
    }).then(() => {
      alert('🚀 Global 30-day season reset published to Firebase (/season)!\nConnected players will now restore level claims and start from Level 0.');
    }).catch(err => alert('Error triggering season reset: ' + err.message));
  };

  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(executeReset);
  } else {
    executeReset();
  }
}

function triggerMonthlyCompetitionReset() {
  const executeCompReset = () => {
    const db = window.getDb ? window.getDb() : null;
    if (!db) {
      alert('Firebase is not connected!');
      return;
    }

    if (!confirm('🏆 Restart the 30-Day Monthly Task Competition (/monthly_competition)?\n\nThis will start a fresh 30-day cycle for monthly tasks in Firebase backend!')) {
      return;
    }

    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    db.ref('/monthly_competition').set({
      cycleNumber: 1,
      startTime: now,
      endTime: now + thirtyDays,
      lastUpdated: now,
      active: true
    }).then(() => {
      alert('🏆 Monthly Task Competition reset to 30 days in Firebase backend!');
    }).catch(err => alert('Error resetting monthly competition: ' + err.message));
  };

  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(executeCompReset);
  } else {
    executeCompReset();
  }
}

window.reconnectFirebase = reconnectFirebase;
window.triggerGlobalSeasonReset = triggerGlobalSeasonReset;
window.triggerMonthlyCompetitionReset = triggerMonthlyCompetitionReset;

// ==========================================================================
// ADMIN TEAM MANAGEMENT (STRICTLY 2 TO 5 USERS ONLY)
// ==========================================================================
function renderAdminTeamUI() {
  const tbody = document.getElementById('adminUsersTableBody');
  const countPill = document.getElementById('adminCountPill');
  const addBtn = document.getElementById('openAddAdminBtn');
  if (!tbody) return;

  const admins = (window.adminState && window.adminState.adminUsers) ? window.adminState.adminUsers : [];
  const count = admins.length;

  if (countPill) {
    countPill.textContent = `Admins: ${count} / 5 (Allowed: 2 - 5)`;
    if (count >= 5) {
      countPill.style.background = 'rgba(239, 68, 68, 0.15)';
      countPill.style.borderColor = 'rgba(239, 68, 68, 0.4)';
      countPill.style.color = '#f87171';
    } else if (count <= 2) {
      countPill.style.background = 'rgba(245, 158, 11, 0.15)';
      countPill.style.borderColor = 'rgba(245, 158, 11, 0.4)';
      countPill.style.color = '#fbbf24';
    } else {
      countPill.style.background = 'rgba(56, 189, 248, 0.15)';
      countPill.style.borderColor = 'rgba(56, 189, 248, 0.4)';
      countPill.style.color = '#38bdf8';
    }
  }

  if (addBtn) {
    if (count >= 5) {
      addBtn.disabled = true;
      addBtn.style.opacity = '0.5';
      addBtn.style.cursor = 'not-allowed';
      addBtn.title = 'Maximum capacity reached (5 admin limit)';
    } else {
      addBtn.disabled = false;
      addBtn.style.opacity = '1';
      addBtn.style.cursor = 'pointer';
      addBtn.title = 'Add new admin user';
    }
  }

  if (count === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #94a3b8; padding: 24px;">No admin records loaded. Checking cloud...</td></tr>`;
    return;
  }

  const currentAdmin = window.getCurrentAdminSession ? window.getCurrentAdminSession() : null;

  tbody.innerHTML = admins.map(adm => {
    const isSelf = currentAdmin && currentAdmin.username === adm.username;
    const isSuper = (adm.role || '').toLowerCase().includes('super');
    const createdStr = adm.createdAt ? new Date(adm.createdAt).toLocaleDateString() : 'System';

    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #0284c7, #2563eb); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; color: #fff;">
              ${(adm.username || 'A')[0].toUpperCase()}
            </div>
            <div>
              <strong style="color: #0f172a; font-size: 13px;">${escapeHtmlSettings(adm.name || adm.username)}</strong>
              ${isSelf ? `<span style="margin-left: 6px; font-size: 10px; background: rgba(56, 189, 248, 0.2); color: #0284c7; padding: 2px 6px; border-radius: 10px; font-weight: 700;">You</span>` : ''}
            </div>
          </div>
        </td>
        <td><code style="color: #38bdf8; font-weight: 700;">@${escapeHtmlSettings(adm.username)}</code></td>
        <td>
          <span class="admin-team-pill ${isSuper ? 'admin-pill-super' : 'admin-pill-manager'}">
            ${isSuper ? '👑' : '🛡️'} ${escapeHtmlSettings(adm.role || 'Admin')}
          </span>
        </td>
        <td>
          <span style="font-family: monospace; color: #94a3b8; letter-spacing: 2px;">••••••••</span>
          <button onclick="changeAdminPassword('${escapeHtmlSettings(adm.username)}')" style="margin-left: 8px; background: none; border: none; color: #38bdf8; cursor: pointer; font-size: 11px; text-decoration: underline;">Change</button>
        </td>
        <td style="color: #94a3b8; font-size: 12px;">${createdStr}</td>
        <td style="text-align: right;">
          <button onclick="deleteAdminUser('${escapeHtmlSettings(adm.username)}')" class="btn-secondary" style="color: #f87171; border-color: rgba(239, 68, 68, 0.4); padding: 4px 10px; font-size: 12px;" ${count <= 2 ? 'disabled title="Minimum 2 admins required. Cannot delete."' : ''}>
            🗑️ Remove
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function escapeHtmlSettings(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function openAddAdminModal() {
  const admins = (window.adminState && window.adminState.adminUsers) ? window.adminState.adminUsers : [];
  if (admins.length >= 5) {
    alert('⚠️ LIMIT REACHED: A maximum of 5 admin users is strictly enforced.\nYou cannot add more than 5 admin users.');
    return;
  }

  const modal = document.getElementById('addAdminModal');
  if (modal) {
    document.getElementById('newAdminUsername').value = '';
    document.getElementById('newAdminPassword').value = '';
    document.getElementById('newAdminName').value = '';
    document.getElementById('newAdminRole').value = 'Operations Admin';
    modal.classList.add('active');
  }
}

function closeAddAdminModal() {
  const modal = document.getElementById('addAdminModal');
  if (modal) modal.classList.remove('active');
}

function saveNewAdminUser() {
  const executeAddAdmin = () => {
    const admins = (window.adminState && window.adminState.adminUsers) ? window.adminState.adminUsers : [];
    if (admins.length >= 5) {
      alert('⚠️ Maximum limit of 5 admin users reached! Cannot add more.');
      return;
    }

    const usernameInput = document.getElementById('newAdminUsername');
    const passwordInput = document.getElementById('newAdminPassword');
    const nameInput = document.getElementById('newAdminName');
    const roleInput = document.getElementById('newAdminRole');

    const rawUser = usernameInput ? usernameInput.value.trim().toLowerCase() : '';
    const pass = passwordInput ? passwordInput.value.trim() : '';
    const name = nameInput ? nameInput.value.trim() : '';
    const role = roleInput ? roleInput.value : 'Operations Admin';

    if (!rawUser || rawUser.length < 3) {
      alert('Please enter a valid username (at least 3 characters, alphanumeric).');
      return;
    }
    const cleanUser = rawUser.replace(/[^a-z0-9_]/g, '');
    if (!cleanUser) {
      alert('Username can only contain letters, numbers, and underscores.');
      return;
    }
    if (!pass || pass.length < 6) {
      alert('Please enter a secure password (at least 6 characters).');
      return;
    }

    // Check if exists
    if (admins.some(a => a.username.toLowerCase() === cleanUser)) {
      alert(`Admin user "${cleanUser}" already exists!`);
      return;
    }

    const db = window.getDb ? window.getDb() : null;
    if (!db) {
      alert('Database is offline!');
      return;
    }

    db.ref(`/admin_users/${cleanUser}`).set({
      username: cleanUser,
      password: pass,
      name: name || cleanUser,
      role: role,
      createdAt: Date.now()
    }).then(() => {
      alert(`✅ Admin user "${cleanUser}" successfully created! (Total admins: ${admins.length + 1} / 5)`);
      closeAddAdminModal();
    }).catch(err => {
      alert('Error adding admin: ' + err.message);
    });
  };

  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(executeAddAdmin);
  } else {
    executeAddAdmin();
  }
}

function changeAdminPassword(username) {
  const executeChange = () => {
    const newPass = prompt(`Enter new password for admin "${username}" (minimum 6 characters):`);
    if (!newPass) return;
    if (newPass.trim().length < 6) {
      alert('Password must be at least 6 characters!');
      return;
    }

    const db = window.getDb ? window.getDb() : null;
    if (!db) {
      alert('Database offline!');
      return;
    }

    db.ref(`/admin_users/${username}/password`).set(newPass.trim())
      .then(() => alert(`✅ Password updated for admin "${username}"!`))
      .catch(err => alert('Failed to update password: ' + err.message));
  };

  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(executeChange);
  } else {
    executeChange();
  }
}

function deleteAdminUser(username) {
  const executeDeleteAdmin = () => {
    const admins = (window.adminState && window.adminState.adminUsers) ? window.adminState.adminUsers : [];
    if (admins.length <= 2) {
      alert('⚠️ MINIMUM REQUIREMENT: Exactly 2 to 5 admin users are allowed.\nYou cannot delete this admin because a minimum of 2 admin accounts is strictly required!');
      return;
    }

    const currentAdmin = window.getCurrentAdminSession ? window.getCurrentAdminSession() : null;
    if (currentAdmin && currentAdmin.username === username) {
      if (!confirm(`⚠️ You are currently logged in as "${username}". Deleting your own account will immediately log you out. Proceed?`)) {
        return;
      }
    } else {
      if (!confirm(`Are you sure you want to permanently delete admin "${username}"?\nAdmins remaining after deletion: ${admins.length - 1}`)) {
        return;
      }
    }

    const db = window.getDb ? window.getDb() : null;
    if (!db) {
      alert('Database offline!');
      return;
    }

    db.ref(`/admin_users/${username}`).remove()
      .then(() => {
        alert(`Admin user "${username}" deleted.`);
        if (currentAdmin && currentAdmin.username === username && window.logoutAdmin) {
          window.logoutAdmin();
        }
      })
      .catch(err => alert('Error deleting admin: ' + err.message));
  };

  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(executeDeleteAdmin);
  } else {
    executeDeleteAdmin();
  }
}

window.renderAdminTeamUI = renderAdminTeamUI;
window.openAddAdminModal = openAddAdminModal;
window.closeAddAdminModal = closeAddAdminModal;
window.saveNewAdminUser = saveNewAdminUser;
window.changeAdminPassword = changeAdminPassword;
window.deleteAdminUser = deleteAdminUser;

// ==========================================================================
// GLOBAL WEBSITE & GAME CONFIGURATION (STATIC DATA EDITOR)
// ==========================================================================
function loadGlobalGameConfigFromFirebase() {
  const cfg = (window.adminState && window.adminState.gameConfig) ? window.adminState.gameConfig : {};
  const elName = document.getElementById('cfgAppName');
  const elMaint = document.getElementById('cfgMaintenance');
  const elMaintTag = document.getElementById('maintenanceStatusTag');
  const elEnergy = document.getElementById('cfgStartingEnergy');
  const elMaxEnergy = document.getElementById('cfgMaxEnergy');
  const elRegen = document.getElementById('cfgRegenRate');
  const elTap = document.getElementById('cfgTapPower');
  const elSupport = document.getElementById('cfgSupportUrl');
  const elAnnounce = document.getElementById('cfgAnnouncement');
  const elAnnounceActive = document.getElementById('cfgAnnouncementActive');
  const elUpdated = document.getElementById('gameConfigLastUpdated');

  if (elName) elName.value = cfg.appName || 'Energy Tap';
  if (elMaint) elMaint.value = String(cfg.maintenanceMode === true);
  if (elMaintTag) {
    elMaintTag.textContent = cfg.maintenanceMode ? '🔴 Under Maintenance' : '🟢 Normal Active';
    elMaintTag.style.color = cfg.maintenanceMode ? '#ef4444' : '#059669';
  }
  if (elEnergy) elEnergy.value = cfg.startingEnergy || 1000;
  if (elMaxEnergy) elMaxEnergy.value = cfg.maxBaseEnergy || 1000;
  if (elRegen) elRegen.value = cfg.energyRegenRate || 1;
  if (elTap) elTap.value = cfg.tapBasePower || 1;
  if (elSupport) elSupport.value = cfg.supportTelegramUrl || 'https://t.me/energy_tap_support';
  if (elAnnounce) elAnnounce.value = cfg.announcementText || '';
  if (elAnnounceActive) elAnnounceActive.checked = cfg.announcementActive !== false;

  if (elUpdated) {
    elUpdated.textContent = cfg.updatedAt ? ('Last Synced: ' + new Date(cfg.updatedAt).toLocaleTimeString()) : 'Cloud Synced (Live RTDB)';
  }
}

function saveGlobalGameConfig() {
  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(performSaveGlobalGameConfig);
  } else {
    performSaveGlobalGameConfig();
  }
}

function performSaveGlobalGameConfig() {
  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    alert('Firebase is not connected!');
    return;
  }

  const updatedConfig = {
    appName: (document.getElementById('cfgAppName')?.value || 'Energy Tap').trim(),
    maintenanceMode: document.getElementById('cfgMaintenance')?.value === 'true',
    startingEnergy: Number(document.getElementById('cfgStartingEnergy')?.value) || 1000,
    maxBaseEnergy: Number(document.getElementById('cfgMaxEnergy')?.value) || 1000,
    energyRegenRate: Number(document.getElementById('cfgRegenRate')?.value) || 1,
    tapBasePower: Number(document.getElementById('cfgTapPower')?.value) || 1,
    supportTelegramUrl: (document.getElementById('cfgSupportUrl')?.value || '').trim(),
    announcementText: (document.getElementById('cfgAnnouncement')?.value || '').trim(),
    announcementActive: document.getElementById('cfgAnnouncementActive')?.checked === true,
    updatedAt: Date.now()
  };

  db.ref('/game_config').set(updatedConfig)
    .then(() => {
      window.adminState.gameConfig = updatedConfig;
      loadGlobalGameConfigFromFirebase();
      if (typeof window.logActivity === 'function') {
        window.logActivity('Admin Settings', 'Updated global game settings & economy parameters in /game_config', '⚙️');
      }
      alert('💾 Global Website & Game configuration successfully saved to Firebase (/game_config)!');
    })
    .catch(err => alert('Error writing configuration to Firebase: ' + err.message));
}

// ==========================================================================
// ADMIN LEVEL PROGRESSION & GOAL/XP SYSTEM ENGINE (LEVELS 1 - 100)
// ==========================================================================
let currentSelectedAdminLevel = 1;

function getDefaultAdminLevelConfig(lvl) {
  const l = Math.max(1, parseInt(lvl, 10) || 1);
  const cards = 20 + (l - 1) * 6 + ((l * 11) % 15);
  const keys = 50 + (l - 1) * 9 + ((l * 17) % 20);
  const tickets = 35 + (l - 1) * 7 + ((l * 13) % 18);
  const xpRequired = l * 1000;
  let rewardQty = 1;
  if (l > 75) rewardQty = 5;
  else if (l > 50) rewardQty = 4;
  else if (l > 25) rewardQty = 3;
  else if (l > 10) rewardQty = 2;

  return {
    level: l,
    name: `Level ${l}`,
    isLocked: false,
    xpRequired: xpRequired,
    targets: { cards, keys, tickets },
    rewards: {
      coins: l * 25,
      xpBonus: l * 10,
      cards: rewardQty,
      keys: rewardQty,
      tickets: rewardQty,
      fuel: 5
    }
  };
}

function initAdminLevelSelect() {
  const sel = document.getElementById('adminLevelSelect');
  if (!sel) return;
  if (sel.children.length >= 100) return;

  sel.innerHTML = '';
  for (let i = 1; i <= 100; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `Level ${i}`;
    sel.appendChild(opt);
  }
  sel.value = currentSelectedAdminLevel;
}

function onAdminSelectLevel(lvl) {
  currentSelectedAdminLevel = Math.max(1, Math.min(100, parseInt(lvl, 10) || 1));
  const sel = document.getElementById('adminLevelSelect');
  if (sel) sel.value = currentSelectedAdminLevel;

  const levelsConfig = (window.adminState && window.adminState.levelsConfig) || {};
  const cfg = levelsConfig[currentSelectedAdminLevel] || getDefaultAdminLevelConfig(currentSelectedAdminLevel);
  const targets = cfg.targets || {};
  const rewards = cfg.rewards || {};

  const isLocked = !!cfg.isLocked;
  const lockSelect = document.getElementById('lvlEditLock');
  if (lockSelect) lockSelect.value = isLocked ? 'true' : 'false';

  const statusPill = document.getElementById('adminLevelStatusPill');
  if (statusPill) {
    if (isLocked) {
      statusPill.textContent = '🔴 LOCKED BY ADMIN';
      statusPill.style.background = 'rgba(239, 68, 68, 0.15)';
      statusPill.style.color = '#ef4444';
      statusPill.style.borderColor = 'rgba(239, 68, 68, 0.3)';
    } else {
      statusPill.textContent = '🟢 UNLOCKED';
      statusPill.style.background = 'rgba(16, 185, 129, 0.15)';
      statusPill.style.color = '#059669';
      statusPill.style.borderColor = 'rgba(16, 185, 129, 0.3)';
    }
  }

  const def = getDefaultAdminLevelConfig(currentSelectedAdminLevel);
  const inpXp = document.getElementById('lvlEditXp');
  if (inpXp) inpXp.value = cfg.xpRequired !== undefined ? cfg.xpRequired : (cfg.xpToNextLevel || def.xpRequired);

  const inpCards = document.getElementById('lvlEditCards');
  if (inpCards) inpCards.value = targets.cards !== undefined ? targets.cards : def.targets.cards;

  const inpKeys = document.getElementById('lvlEditKeys');
  if (inpKeys) inpKeys.value = targets.keys !== undefined ? targets.keys : def.targets.keys;

  const inpTickets = document.getElementById('lvlEditTickets');
  if (inpTickets) inpTickets.value = targets.tickets !== undefined ? targets.tickets : def.targets.tickets;

  const inpCoins = document.getElementById('lvlEditCoins');
  if (inpCoins) inpCoins.value = rewards.coins !== undefined ? rewards.coins : def.rewards.coins;

  const inpXpBonus = document.getElementById('lvlEditXpBonus');
  if (inpXpBonus) inpXpBonus.value = rewards.xpBonus !== undefined ? rewards.xpBonus : def.rewards.xpBonus;

  const inpItemQty = document.getElementById('lvlEditItemQty');
  if (inpItemQty) inpItemQty.value = rewards.cards !== undefined ? rewards.cards : def.rewards.cards;

  const inpFuel = document.getElementById('lvlEditFuel');
  if (inpFuel) inpFuel.value = rewards.fuel !== undefined ? rewards.fuel : def.rewards.fuel;
}

function stepAdminLevel(delta) {
  const next = Math.max(1, Math.min(100, currentSelectedAdminLevel + delta));
  onAdminSelectLevel(next);
}

function saveCurrentAdminLevel() {
  const lvl = currentSelectedAdminLevel;
  const isLocked = document.getElementById('lvlEditLock')?.value === 'true';
  const xpRequired = Number(document.getElementById('lvlEditXp')?.value) || (lvl * 1000);
  const cards = Number(document.getElementById('lvlEditCards')?.value) || 20;
  const keys = Number(document.getElementById('lvlEditKeys')?.value) || 50;
  const tickets = Number(document.getElementById('lvlEditTickets')?.value) || 35;
  const coins = Number(document.getElementById('lvlEditCoins')?.value) || (lvl * 25);
  const xpBonus = Number(document.getElementById('lvlEditXpBonus')?.value) || (lvl * 10);
  const itemQty = Number(document.getElementById('lvlEditItemQty')?.value) || 1;
  const fuel = Number(document.getElementById('lvlEditFuel')?.value) || 5;

  const updatedLevelConfig = {
    level: lvl,
    name: `Level ${lvl}`,
    isLocked: isLocked,
    xpRequired: xpRequired,
    targets: { cards, keys, tickets },
    rewards: {
      coins,
      xpBonus,
      cards: itemQty,
      keys: itemQty,
      tickets: itemQty,
      fuel
    },
    updatedAt: Date.now()
  };

  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    alert('Firebase is not connected!');
    return;
  }

  db.ref(`/levels_config/${lvl}`).set(updatedLevelConfig)
    .then(() => {
      if (!window.adminState.levelsConfig) window.adminState.levelsConfig = {};
      window.adminState.levelsConfig[lvl] = updatedLevelConfig;
      onAdminSelectLevel(lvl);
      if (typeof window.logActivity === 'function') {
        window.logActivity('Level Updated', `Level ${lvl} requirements & rewards updated in /levels_config`, '🎯');
      }
      alert(`💾 Level ${lvl} configuration saved to Firebase (/levels_config/${lvl})!\nAll connected game clients will immediately apply these settings.`);
    })
    .catch(err => alert('Error saving level configuration: ' + err.message));
}

function autoScaleAllLevels() {
  if (!confirm('⚡ Auto-scale all 100 Levels with progressive XP, Targets & Rewards?\n\nThis will compute a smooth scaling curve for Levels 1 to 100 and write to Firebase.')) {
    return;
  }

  const allConfigs = {};
  for (let l = 1; l <= 100; l++) {
    allConfigs[l] = getDefaultAdminLevelConfig(l);
  }

  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    alert('Firebase is not connected!');
    return;
  }

  db.ref('/levels_config').set(allConfigs)
    .then(() => {
      window.adminState.levelsConfig = allConfigs;
      onAdminSelectLevel(currentSelectedAdminLevel);
      alert('✅ All 100 Levels successfully scaled and saved to Firebase (/levels_config)!');
    })
    .catch(err => alert('Error writing levels: ' + err.message));
}

function lockLevelsAbovePrompt() {
  const thresholdStr = prompt('Enter level number above which ALL levels will be LOCKED (e.g. 5 to lock Levels 6-100):', '5');
  if (!thresholdStr) return;
  const threshold = parseInt(thresholdStr, 10);
  if (isNaN(threshold) || threshold < 1) {
    alert('Please enter a valid level number (1-100).');
    return;
  }

  const levelsConfig = (window.adminState && window.adminState.levelsConfig) || {};
  const allConfigs = {};
  for (let l = 1; l <= 100; l++) {
    const base = levelsConfig[l] || getDefaultAdminLevelConfig(l);
    allConfigs[l] = {
      ...base,
      isLocked: l > threshold
    };
  }

  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    alert('Firebase is not connected!');
    return;
  }

  db.ref('/levels_config').set(allConfigs)
    .then(() => {
      window.adminState.levelsConfig = allConfigs;
      onAdminSelectLevel(currentSelectedAdminLevel);
      alert(`🔒 Levels ${threshold + 1} to 100 have been LOCKED in Firebase.\nLevels 1 to ${threshold} remain accessible.`);
    })
    .catch(err => alert('Error locking levels: ' + err.message));
}

function resetLevelsToDefaultTemplate() {
  if (!confirm('🔄 Reset all levels to default template in Firebase?')) return;
  autoScaleAllLevels();
}

window.initAdminLevelSelect = initAdminLevelSelect;
window.onAdminSelectLevel = onAdminSelectLevel;
window.stepAdminLevel = stepAdminLevel;
window.saveCurrentAdminLevel = saveCurrentAdminLevel;
window.autoScaleAllLevels = autoScaleAllLevels;
window.lockLevelsAbovePrompt = lockLevelsAbovePrompt;
window.resetLevelsToDefaultTemplate = resetLevelsToDefaultTemplate;

window.loadGlobalGameConfigFromFirebase = loadGlobalGameConfigFromFirebase;
window.saveGlobalGameConfig = saveGlobalGameConfig;

// ==========================================================================
// ADMIN ENERGY FUEL CELL SHOP PRICING & MULTIPLIERS ENGINE
// ==========================================================================
const DEFAULT_ADMIN_FUEL_CONFIG = {
  basePrices: { ad: 1, goldCoin: 125, diamond: 25, coinPack: 150 },
  multipliers: { green: 1.0, yellow: 1.5, orange: 2.5, pink: 7.0, purple: 8.5, red: 5.0, darkred: 6.5 }
};

function loadFuelCellsConfigFromFirebase() {
  const cfg = (window.adminState && window.adminState.fuelCellsConfig) || DEFAULT_ADMIN_FUEL_CONFIG;
  const base = cfg.basePrices || DEFAULT_ADMIN_FUEL_CONFIG.basePrices;
  const mults = cfg.multipliers || DEFAULT_ADMIN_FUEL_CONFIG.multipliers;

  const elAd = document.getElementById('cfgFuelBaseAd');
    const elGold = document.getElementById('cfgFuelBaseGold');
  const elDiamond = document.getElementById('cfgFuelBaseDiamond');
  const elCoinPack = document.getElementById('cfgFuelBaseCoinPack');
  
  if (elAd) elAd.value = base.ad !== undefined ? base.ad : 1;
    if (elGold) elGold.value = base.goldCoin !== undefined ? base.goldCoin : 125;
  if (elDiamond) elDiamond.value = base.diamond !== undefined ? base.diamond : 25;
  if (elCoinPack) elCoinPack.value = base.coinPack !== undefined ? base.coinPack : 150;
  
  const elGreen = document.getElementById('cfgFuelMultGreen');
  const elYellow = document.getElementById('cfgFuelMultYellow');
  const elOrange = document.getElementById('cfgFuelMultOrange');
  const elPink = document.getElementById('cfgFuelMultPink');
  const elPurple = document.getElementById('cfgFuelMultPurple');
  const elRed = document.getElementById('cfgFuelMultRed');
  const elDarkRed = document.getElementById('cfgFuelMultDarkRed');

  if (elGreen) elGreen.value = mults.green !== undefined ? mults.green : 1.0;
  if (elYellow) elYellow.value = mults.yellow !== undefined ? mults.yellow : 1.5;
  if (elOrange) elOrange.value = mults.orange !== undefined ? mults.orange : 2.5;
  if (elPink) elPink.value = mults.pink !== undefined ? mults.pink : 7.0;
  if (elPurple) elPurple.value = mults.purple !== undefined ? mults.purple : 8.5;
  if (elRed) elRed.value = mults.red !== undefined ? mults.red : 5.0;
  if (elDarkRed) elDarkRed.value = mults.darkred !== undefined ? mults.darkred : 6.5;
}

function saveFuelCellsConfigFromAdmin() {
  const executeSave = () => {
    const db = window.getDb ? window.getDb() : null;
    if (!db) {
      alert('Firebase is not connected!');
      return;
    }

    const payload = {
      basePrices: {
        ad: Math.max(1, Number(document.getElementById('cfgFuelBaseAd')?.value) || 1),
                goldCoin: Math.max(1, Number(document.getElementById('cfgFuelBaseGold')?.value) || 125),
        diamond: Math.max(1, Number(document.getElementById('cfgFuelBaseDiamond')?.value) || 25),
        coinPack: Math.max(1, Number(document.getElementById('cfgFuelBaseCoinPack')?.value) || 150),
              },
      multipliers: {
        green: Number(document.getElementById('cfgFuelMultGreen')?.value) || 1.0,
        yellow: Number(document.getElementById('cfgFuelMultYellow')?.value) || 1.5,
        orange: Number(document.getElementById('cfgFuelMultOrange')?.value) || 2.5,
        pink: Number(document.getElementById('cfgFuelMultPink')?.value) || 7.0,
        purple: Number(document.getElementById('cfgFuelMultPurple')?.value) || 8.5,
        red: Number(document.getElementById('cfgFuelMultRed')?.value) || 5.0,
        darkred: Number(document.getElementById('cfgFuelMultDarkRed')?.value) || 6.5
      },
      updatedAt: Date.now()
    };

    db.ref('/fuel_cells_config').set(payload)
      .then(() => {
        window.adminState.fuelCellsConfig = payload;
        if (typeof window.logActivity === 'function') {
          window.logActivity('Fuel Shop Updated', 'Updated base prices & color multipliers in /fuel_cells_config', '🔋');
        }
        alert('💾 Energy Fuel Cell Shop prices & multipliers saved to Firebase (/fuel_cells_config)!');
      })
      .catch(err => alert('Error saving fuel prices: ' + err.message));
  };

  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(executeSave);
  } else {
    executeSave();
  }
}

function resetFuelCellsConfigToDefault() {
  if (!confirm('Reset fuel cell pricing & multipliers to default in form?')) return;
  window.adminState.fuelCellsConfig = DEFAULT_ADMIN_FUEL_CONFIG;
  loadFuelCellsConfigFromFirebase();
}

window.loadFuelCellsConfigFromFirebase = loadFuelCellsConfigFromFirebase;
window.saveFuelCellsConfigFromAdmin = saveFuelCellsConfigFromAdmin;
window.resetFuelCellsConfigToDefault = resetFuelCellsConfigToDefault;

// ==========================================================================
// TOOL 6: ACCOUNT AUTHORIZATION & ONE ACCOUNT PER USER CONFIGURATION (/auth_config)
// ==========================================================================
function loadAuthConfigFromFirebase() {
  const db = window.getDb ? window.getDb() : null;
  if (!db) return;

  db.ref('/auth_config').once('value')
    .then(snap => {
      const val = snap.val() || {};
      const tgEl = document.getElementById('authCfgTelegram');
      const phoneEl = document.getElementById('authCfgPhone');
      const emailEl = document.getElementById('authCfgEmail');
      const oneTgEl = document.getElementById('authCfgOneTelegram');
      const onePhoneEl = document.getElementById('authCfgOnePhone');
      const oneEmailEl = document.getElementById('authCfgOneEmail');
      const linkEl = document.getElementById('authCfgLinking');

      if (tgEl) tgEl.checked = val.telegramAuth !== false;
      if (phoneEl) phoneEl.checked = val.phoneAuth !== false;
      if (emailEl) emailEl.checked = val.emailAuth !== false;
      if (oneTgEl) oneTgEl.checked = val.oneTelegramPerAccount !== false;
      if (onePhoneEl) onePhoneEl.checked = val.onePhonePerAccount !== false;
      if (oneEmailEl) oneEmailEl.checked = val.oneEmailPerAccount !== false;
      if (linkEl) linkEl.checked = val.accountLinking !== false;
    })
    .catch(err => console.warn('Error loading auth config:', err));
}

function saveAuthConfigFromAdmin() {
  const executeSave = () => {
    const db = window.getDb ? window.getDb() : null;
    if (!db) {
      alert('Firebase database not connected.');
      return;
    }

    const payload = {
      telegramAuth: Boolean(document.getElementById('authCfgTelegram')?.checked),
      phoneAuth: Boolean(document.getElementById('authCfgPhone')?.checked),
      emailAuth: Boolean(document.getElementById('authCfgEmail')?.checked),
      oneTelegramPerAccount: Boolean(document.getElementById('authCfgOneTelegram')?.checked),
      onePhonePerAccount: Boolean(document.getElementById('authCfgOnePhone')?.checked),
      oneEmailPerAccount: Boolean(document.getElementById('authCfgOneEmail')?.checked),
      accountLinking: Boolean(document.getElementById('authCfgLinking')?.checked),
      updatedAt: Date.now()
    };

    db.ref('/auth_config').set(payload)
      .then(() => {
        fetch('/api/auth/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(() => {});

        if (typeof window.logActivity === 'function') {
          window.logActivity('Auth Config Updated', 'Updated Account Authorization & Uniqueness rules in /auth_config', '🔐');
        }
        alert('💾 Account Authorization and One Account Per User configuration saved to Firebase (/auth_config)!');
      })
      .catch(err => alert('Error saving auth config: ' + err.message));
  };

  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(executeSave);
  } else {
    executeSave();
  }
}

async function scanAndMigrateIdentityIndexes() {
  const reportWrap = document.getElementById('authIndexReportWrap');
  const reportContent = document.getElementById('authIndexReportContent');

  if (reportWrap) reportWrap.style.display = 'block';
  if (reportContent) reportContent.innerHTML = '<em>Scanning Firebase player records and building identity indexes...</em>';

  try {
    const res = await fetch('/api/auth/migrate-indexes', { method: 'POST' });
    const data = await res.json();

    if (!data.ok) {
      if (reportContent) reportContent.innerHTML = `<span style="color: #dc2626;">Scan error: ${data.error || 'Failed'}</span>`;
      return;
    }

    const m = data.migration;
    let html = `
      <div style="margin-bottom: 8px;">
        <strong>✅ Scan &amp; Indexing Complete:</strong>
        Scanned <strong>${m.totalUsers}</strong> users.
        Built <strong>${m.indexedTelegram}</strong> Telegram indexes,
        <strong>${m.indexedPhones}</strong> phone indexes, and
        <strong>${m.indexedEmails}</strong> email indexes.
      </div>
    `;

    if (m.duplicatesDetected > 0) {
      html += `
        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 10px; border-radius: 8px; margin-top: 8px;">
          <span style="color: #dc2626; font-weight: 800;">⚠️ Potential Duplicate Accounts Found (${m.duplicatesDetected}):</span>
          <ul style="margin: 6px 0 0 16px; padding: 0;">
            ${m.duplicateReport.map(d => `
              <li><strong>${d.type.toUpperCase()} [${d.value}]</strong> shared by ${d.count} accounts: <code>${d.uids.join(', ')}</code></li>
            `).join('')}
          </ul>
          <p style="margin: 6px 0 0 0; font-size: 11px; color: #64748b;">
            💡 Note: Accounts are NOT automatically merged to protect user balances and referrals. Visit the <strong>Users</strong> page to review and resolve individual duplicate accounts.
          </p>
        </div>
      `;
    } else {
      html += `
        <div style="color: #15803d; font-weight: 700; margin-top: 6px;">
          ✨ Zero duplicate identities found. All accounts strictly satisfy 1 Telegram = 1 Account, 1 Phone = 1 Account, and 1 Email = 1 Account!
        </div>
      `;
    }

    if (reportContent) reportContent.innerHTML = html;
  } catch (err) {
    if (reportContent) reportContent.innerHTML = `<span style="color: #dc2626;">Network error running scan: ${err.message}</span>`;
  }
}

window.loadAuthConfigFromFirebase = loadAuthConfigFromFirebase;
window.saveAuthConfigFromAdmin = saveAuthConfigFromAdmin;
window.scanAndMigrateIdentityIndexes = scanAndMigrateIdentityIndexes;

window.addEventListener('adminUsersUpdated', renderAdminTeamUI);
window.addEventListener('gameConfigUpdated', loadGlobalGameConfigFromFirebase);
window.addEventListener('fuelCellsConfigUpdated', loadFuelCellsConfigFromFirebase);
window.addEventListener('levelsConfigUpdated', () => {
  initAdminLevelSelect();
  onAdminSelectLevel(currentSelectedAdminLevel);
});

document.addEventListener('DOMContentLoaded', () => {
  renderAdminTeamUI();
  loadGlobalGameConfigFromFirebase();
  loadFuelCellsConfigFromFirebase();
  loadAuthConfigFromFirebase();
  initAdminLevelSelect();
  onAdminSelectLevel(currentSelectedAdminLevel);
});



