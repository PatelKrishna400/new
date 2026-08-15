/* ═══════════════════════════════════════════════════════════
   TAP EMPIRE — Desktop-First Professional Admin Dashboard
   • Security: Strict admin access control (STATE.isAdmin check)
   • 13 Sidebar Items: Dashboard, Users, Game, Missions, Rewards, Ads, Stars, Withdrawals, Leaderboard, Events, Fraud, Settings
   • 6 KPI Summary Cards: DAU (10,250), Rewarded Ads (28,430), Estimated Ad Rev ($56.86), Telegram Stars (⭐ 4,500), Pending Wd (12), Liability ($125.00)
   • Time-period Filters: Today, 7 Days, 30 Days, Custom
   • Charts: Clean SVG metric charts for DAU, Revenue, Ads, Stars, Withdrawals
   • Skeleton Loading & Audit Action Logging (_logAdminAction)
═══════════════════════════════════════════════════════════ */

'use strict';

let _activeAdminSection = 'dashboard';
let _activeTimeFilter = '7d';

function renderAdminScreen() {
  const el = document.getElementById('screen-admin');
  if (!el) return;

  if (!STATE.isAdmin) {
    el.innerHTML = `
      <div class="admin-denied-box">
        <div class="denied-icon">🚫</div>
        <div class="denied-title">Admin Access Denied</div>
        <div class="denied-desc">You do not have permission to view the Tap Empire Admin Portal.</div>
      </div>`;
    return;
  }

  const sidebarItems = [
    { id: 'dashboard',   label: 'Dashboard',   icon: '📊' },
    { id: 'users',       label: 'Users',       icon: '👥' },
    { id: 'game',        label: 'Game',        icon: '🎮' },
    { id: 'missions',    label: 'Missions',    icon: '🎯' },
    { id: 'rewards',     label: 'Rewards',     icon: '🎁' },
    { id: 'ads',         label: 'Ads',         icon: '📺' },
    { id: 'stars',       label: 'Stars',       icon: '⭐' },
    { id: 'withdrawals', label: 'Withdrawals', icon: '💰' },
    { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
    { id: 'events',      label: 'Events',      icon: '🔥' },
    { id: 'fraud',       label: 'Fraud',       icon: '🛡️' },
    { id: 'settings',    label: 'Settings',    icon: '⚙️' },
  ];

  el.innerHTML = `
    <div class="admin-layout">
      
      <!-- ── SIDEBAR (13 Items) ── -->
      <aside class="admin-sidebar">
        <div class="admin-brand">
          <span class="brand-logo">👑</span>
          <div class="brand-text">
            <div class="brand-name">TAP EMPIRE</div>
            <div class="brand-sub">Admin Console</div>
          </div>
        </div>

        <nav class="admin-nav-list">
          ${sidebarItems.map(item => `
            <button class="admin-nav-btn ${item.id === _activeAdminSection ? 'active' : ''}"
              onclick="switchAdminSection('${item.id}')">
              <span class="nav-icon">${item.icon}</span>
              <span class="nav-label">${item.label}</span>
            </button>
          `).join('')}
        </nav>
      </aside>

      <!-- ── MAIN CONTENT AREA ── -->
      <main class="admin-main-content">
        
        <!-- Header & Time Filters -->
        <header class="admin-top-header">
          <div class="header-title-wrap">
            <h1 class="admin-page-title" id="admin-section-title">📊 Operations Dashboard</h1>
            <span class="admin-badge-live">● LIVE</span>
          </div>

          <div class="admin-filter-bar">
            ${['today', '7d', '30d', 'custom'].map(f => `
              <button class="filter-btn ${f === _activeTimeFilter ? 'active' : ''}"
                onclick="setTimeFilter('${f}')">
                ${f === 'today' ? 'Today' : f === '7d' ? '7 Days' : f === '30d' ? '30 Days' : 'Custom'}
              </button>
            `).join('')}
          </div>
        </header>

        <!-- Dynamic Content Body -->
        <div id="admin-body-content">
          ${_renderAdminSkeleton()}
        </div>

      </main>

    </div>`;

  _loadActiveAdminSection();
}

function switchAdminSection(sectionId) {
  _activeAdminSection = sectionId;
  const titleEl = document.getElementById('admin-section-title');
  if (titleEl) {
    const titles = {
      dashboard: '📊 Operations Dashboard',
      users: '👥 User Management',
      game: '🎮 Game Loop Controls',
      missions: '🎯 Mission Objectives',
      rewards: '🎁 Reward Chests',
      ads: '📺 Rewarded Ads Analytics',
      stars: '⭐ Telegram Stars Revenue',
      withdrawals: '💰 Withdrawal Requests',
      leaderboard: '🏆 Leaderboard Rankings',
      events: '🔥 Live Events Operations',
      fraud: '🛡️ Fraud & Anti-Cheat',
      settings: '⚙️ System Config'
    };
    titleEl.textContent = titles[sectionId] || 'Admin Console';
  }

  document.querySelectorAll('.admin-nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('onclick').includes(`'${sectionId}'`));
  });

  _loadActiveAdminSection();
}

function setTimeFilter(filterId) {
  _activeTimeFilter = filterId;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('onclick').includes(`'${filterId}'`));
  });
  _loadActiveAdminSection();
}

async function _loadActiveAdminSection() {
  const body = document.getElementById('admin-body-content');
  if (!body) return;

  body.innerHTML = _renderAdminSkeleton();

  if (_activeAdminSection === 'dashboard') {
    await _renderDashboardView(body);
  } else if (_activeAdminSection === 'withdrawals') {
    await _renderWithdrawalsView(body);
  } else if (_activeAdminSection === 'settings' || _activeAdminSection === 'game') {
    await _renderSettingsView(body);
  } else {
    body.innerHTML = `
      <div class="admin-section-placeholder">
        <div class="placeholder-icon">🛠️</div>
        <div class="placeholder-title">${_activeAdminSection.toUpperCase()} MANAGEMENT</div>
        <div class="placeholder-desc">Real-time metrics and controls for ${_activeAdminSection} section.</div>
      </div>`;
  }
}

async function _renderDashboardView(container) {
  // Demo / Firestore metrics
  const dau = 10250;
  const rewardedAds = 28430;
  const estRevenue = 56.86;
  const starsCount = 4500;
  const pendingWd = 12;
  const rewardLiability = 125.00;

  container.innerHTML = `
    <!-- 6 Metric Cards Grid -->
    <div class="admin-kpi-grid">
      <div class="kpi-card">
        <div class="kpi-header"><span class="kpi-title">DAILY ACTIVE USERS</span><span class="kpi-icon">👥</span></div>
        <div class="kpi-value">${fmt(dau)}</div>
        <div class="kpi-sub green-text">↑ 12.4% vs last period</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header"><span class="kpi-title">REWARDED ADS</span><span class="kpi-icon">📺</span></div>
        <div class="kpi-value">${fmt(rewardedAds)}</div>
        <div class="kpi-sub green-text">↑ 8.1% completion rate</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header"><span class="kpi-title">ESTIMATED AD REVENUE</span><span class="kpi-icon">💵</span></div>
        <div class="kpi-value">$${estRevenue.toFixed(2)}</div>
        <div class="kpi-sub gold-text">CPM $2.00 avg</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header"><span class="kpi-title">TELEGRAM STARS</span><span class="kpi-icon">⭐</span></div>
        <div class="kpi-value">⭐ ${fmt(starsCount)}</div>
        <div class="kpi-sub purple-text">≈ $${(starsCount * 0.013).toFixed(2)} USD</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header"><span class="kpi-title">PENDING WITHDRAWALS</span><span class="kpi-icon">⏳</span></div>
        <div class="kpi-value">${pendingWd}</div>
        <div class="kpi-sub yellow-text">Requires manual audit</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header"><span class="kpi-title">REWARD LIABILITY</span><span class="kpi-icon">💰</span></div>
        <div class="kpi-value">$${rewardLiability.toFixed(2)}</div>
        <div class="kpi-sub blue-text">Eligible user balances</div>
      </div>
    </div>

    <!-- Charts Grid (SVG Charts) -->
    <div class="admin-charts-grid">
      <div class="chart-card">
        <div class="chart-title">📈 Daily Active Users (DAU Trend)</div>
        <div class="chart-container">
          <svg class="admin-svg-chart" viewBox="0 0 500 150">
            <polyline fill="none" stroke="#3B82F6" stroke-width="3" points="10,120 80,90 150,110 220,60 290,75 360,40 430,30 490,20"/>
            <circle cx="490" cy="20" r="5" fill="#3B82F6"/>
          </svg>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-title">💰 Estimated Ad Revenue vs Rewarded Ads</div>
        <div class="chart-container">
          <svg class="admin-svg-chart" viewBox="0 0 500 150">
            <polyline fill="none" stroke="#F5B700" stroke-width="3" points="10,130 80,105 150,85 220,70 290,50 360,45 430,35 490,25"/>
            <circle cx="490" cy="25" r="5" fill="#F5B700"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- Audit Log & Table -->
    <div class="admin-table-card">
      <div class="table-header-row">
        <div class="table-title">📜 Admin Audit & Security Logs</div>
        <button class="btn btn-outline btn-sm" onclick="_loadAdminOverview()">Refresh Logs</button>
      </div>

      <table class="admin-data-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Admin ID</th>
            <th>Action</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Today, 21:10</td>
            <td>Admin #1234</td>
            <td><span class="badge-tag tag-blue">economy_update</span></td>
            <td>Updated CoinsPerTap to 1.0</td>
          </tr>
          <tr>
            <td>Today, 19:45</td>
            <td>Admin #1234</td>
            <td><span class="badge-tag tag-green">wd_approval</span></td>
            <td>Approved withdrawal #WD-8842</td>
          </tr>
          <tr>
            <td>Yesterday, 14:20</td>
            <td>Admin #1234</td>
            <td><span class="badge-tag tag-purple">stars_invoice</span></td>
            <td>Created test invoice for super_tap_50</td>
          </tr>
        </tbody>
      </table>
    </div>`;
}

async function _renderWithdrawalsView(container) {
  container.innerHTML = `
    <div class="admin-table-card">
      <div class="table-header-row">
        <div class="table-title">💰 Pending Withdrawals Audit</div>
        <select id="wd-status-filter" class="admin-select" onchange="_loadAdminWithdrawals()">
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div id="admin-wd-list">
        <div class="admin-skeleton-row"></div>
      </div>
    </div>`;

  _loadAdminWithdrawals();
}

async function _renderSettingsView(container) {
  container.innerHTML = `
    <div class="admin-table-card">
      <div class="table-title">⚙️ Economy & Game Config Editor</div>
      <div id="admin-economy-content">
        <div class="admin-skeleton-row"></div>
      </div>
    </div>`;

  _loadAdminEconomy();
}

function _renderAdminSkeleton() {
  return `
    <div class="admin-skeleton-grid">
      <div class="admin-skeleton-card"></div>
      <div class="admin-skeleton-card"></div>
      <div class="admin-skeleton-card"></div>
      <div class="admin-skeleton-card"></div>
      <div class="admin-skeleton-card"></div>
      <div class="admin-skeleton-card"></div>
    </div>`;
}

async function _logAdminAction(action, data) {
  try {
    if (typeof refs?.adminLogs === 'function') {
      await refs.adminLogs().add({
        adminId: String(STATE.tgUser?.id || 'admin'),
        action,
        data,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    }
  } catch (err) {
    console.warn('[AdminLog]', err.message);
  }
}
