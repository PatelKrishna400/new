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

  if (elCoins) {
    const c = Number(metrics.totalCoins || 0);
    elCoins.textContent = c >= 1000000 ? (c / 1000000).toFixed(2) + 'M' : c.toLocaleString();
    elCoins.title = `${c.toLocaleString()} Coins`;
  }
  if (elXP) {
    const xp = Number(metrics.totalXP || 0);
    elXP.textContent = xp >= 1000000 ? (xp / 1000000).toFixed(2) + 'M' : xp.toLocaleString();
    elXP.title = `${xp.toLocaleString()} XP`;
  }
  if (elKeys) elKeys.textContent = Number(metrics.totalKeys || 0).toLocaleString();
  if (elTickets) elTickets.textContent = Number(metrics.totalTickets || 0).toLocaleString();
  if (elEggs) elEggs.textContent = Number(metrics.totalEggs || 0).toLocaleString();
  if (elLevels) elLevels.textContent = Number(metrics.totalLevels || 100).toLocaleString();

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

  // If activity_log is empty in Firebase, synthesize from real active users and real requests
  if (activities.length === 0) {
    const users = (window.adminState && window.adminState.users) ? window.adminState.users : [];
    const requests = (window.adminState && window.adminState.rewardRequests) ? window.adminState.rewardRequests : [];

    users.slice(0, 10).forEach(u => {
      if (u.lastActive) {
        activities.push({
          type: 'active',
          title: `Player ${u.name || u.username || (u.id ? u.id.slice(0, 8) : 'User')} Active`,
          details: `Level ${u.level || 1} • ${(u.coins || 0).toLocaleString()} Coins • ${(u.xp || 0).toLocaleString()} XP`,
          timestamp: new Date(u.lastActive).getTime() || Date.now()
        });
      }
    });

    requests.slice(0, 10).forEach(r => {
      activities.push({
        type: 'withdrawal',
        title: `Withdrawal Request: ${r.amount || 0} ${r.type || 'Coins'}`,
        details: `Player: ${r.userName || r.userId || 'User'} • Status: ${(r.status || 'pending').toUpperCase()}`,
        timestamp: new Date(r.createdAt || r.date || Date.now()).getTime()
      });
    });

    activities.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }

  if (activities.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: #64748b; padding: 24px; font-size: 13px;">
        Listening for live events from Firebase...
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
        <div style="text-align: right; flex-shrink: 0; color: #64748b; font-size: 11px; font-family: monospace;">
          <div>${timeStr}</div>
          <div style="font-size: 10px; color: #475569;">${dateStr}</div>
        </div>
      </div>
    `;
  }).join('');
}
window.renderRealtimeActivityFeed = renderRealtimeActivityFeed;

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
    elSubEconomy.textContent = `${(data.economy.coins || 0).toLocaleString()} Coins • ${(data.economy.diamonds || 0).toLocaleString()} Gems`;
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
