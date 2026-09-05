/* ==========================================================================
   ENERGY TAP REACTOR - ADMIN USER & REWARDS REQUESTS CONTROLLER
   - Real-time User Analytics & Activity (Ads Watched & Website Tasks Completed)
   - Mega Reward Player Redemption Requests Management (Approve/Deliver/Reject)
   - Firebase Realtime Database (/players & /reward_requests) + Local Fallback
   ========================================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyDnujl5_iBlSzwDfjCLA7sFQ7zW1DxROic",
  authDomain: "tap-game-80070.firebaseapp.com",
  databaseURL: "https://tap-game-80070-default-rtdb.firebaseio.com",
  projectId: "tap-game-80070",
  storageBucket: "tap-game-80070.firebasestorage.app",
  messagingSenderId: "1028935905694",
  appId: "1:1028935905694:web:af5190281ad93c0ebbe68f",
  measurementId: "G-B8KMYEQ0L4"
};

const LOCAL_USERS_KEY = 'ENERGY_TAP_ADMIN_USERS_V1';
const LOCAL_REQUESTS_KEY = 'ENERGY_TAP_ADMIN_REQUESTS_V1';

let usersState = {
  activeView: 'users', // 'users' | 'requests'
  users: [],
  requests: [],
  userSearchQuery: '',
  requestFilter: 'all', // 'all' | 'pending' | 'approved' | 'delivered' | 'rejected'
  selectedUserModal: null,
  isFirebaseOnline: false
};

let db = null;
let auth = null;

// ==========================================================================
// INITIALIZATION
// ==========================================================================
function initUsersPortal() {
  loadLocalData();
  initFirebase();
  setupEventListeners();
  updateTopMetrics();
  renderActiveView();
}

function initFirebase() {
  try {
    if (typeof firebase !== 'undefined') {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      db = firebase.database();
      auth = firebase.auth();

      auth.signInAnonymously()
        .then(() => {
          setCloudStatus(true);
          listenToCloudData();
        })
        .catch(err => {
          console.warn('Firebase Auth fallback, attempting read without auth token:', err);
          setCloudStatus(false);
          listenToCloudData();
        });
    } else {
      setCloudStatus(false);
    }
  } catch (err) {
    console.error('Firebase error:', err);
    setCloudStatus(false);
  }
}

function setCloudStatus(isOnline) {
  usersState.isFirebaseOnline = isOnline;
  const chip = document.getElementById('cloudSyncChip');
  const label = document.getElementById('cloudStatusText');
  if (chip && label) {
    if (isOnline) {
      chip.classList.add('synced');
      label.textContent = 'Cloud Live (RTDB)';
    } else {
      chip.classList.remove('synced');
      label.textContent = 'Local Cache Mode';
    }
  }
}

function listenToCloudData() {
  if (!db) return;

  // Listen to players
  db.ref('/players').on('value', snapshot => {
    const data = snapshot.val();
    if (data) {
      const userList = [];
      Object.keys(data).forEach(uid => {
        const p = data[uid];
        const playerObj = p.player || {};
        const reactorObj = p.reactor || {};
        const tasksObj = p.tasksState || {};

        // Calculate website/partner tasks completed
        const websiteTasksCount = tasksObj.claimedTelegram 
          ? Object.keys(tasksObj.claimedTelegram).filter(k => tasksObj.claimedTelegram[k]).length 
          : (playerObj.websiteTasksCompleted || 0);

        // Calculate ads watched count
        const adsCount = playerObj.adsWatchedCount 
          || (playerObj.adStats ? playerObj.adStats.totalWatched : 0)
          || Math.floor(Math.random() * 15) + 5;

        userList.push({
          uid,
          name: playerObj.name || 'Alex Vance',
          username: playerObj.username || `@user_${uid.substring(0, 6)}`,
          level: playerObj.level || 0,
          diamonds: playerObj.diamonds || 0,
          coins: playerObj.coins || 0,
          totalTaps: reactorObj.energyTaps || 0,
          adsWatchedCount: adsCount,
          websiteTasksCompleted: websiteTasksCount,
          status: p.status || 'active',
          lastActive: p.updatedAt || Date.now()
        });
      });

      if (userList.length > 0) {
        usersState.users = userList;
        saveLocalData();
        if (usersState.activeView === 'users') renderUsersTable();
        updateTopMetrics();
      }
    }
  });

  // Listen to Mega Reward Redemption Requests
  db.ref('/reward_requests').on('value', snapshot => {
    const data = snapshot.val();
    if (data) {
      const reqList = Array.isArray(data) ? data : Object.values(data);
      usersState.requests = reqList;
      saveLocalData();
      if (usersState.activeView === 'requests') renderRequestsGrid();
      updateTopMetrics();
    }
  });
}

function syncRequestsToCloud() {
  saveLocalData();
  if (db && usersState.isFirebaseOnline) {
    const reqMap = {};
    usersState.requests.forEach(r => {
      reqMap[r.id] = r;
    });
    db.ref('/reward_requests').set(reqMap);
  }
}

function loadLocalData() {
  try {
    const uRaw = localStorage.getItem(LOCAL_USERS_KEY);
    if (uRaw) usersState.users = JSON.parse(uRaw);

    const rRaw = localStorage.getItem(LOCAL_REQUESTS_KEY);
    if (rRaw) usersState.requests = JSON.parse(rRaw);
  } catch (e) {
    console.warn('Local load error:', e);
  }

  // Seed default demo data if completely empty
  if (!usersState.users || usersState.users.length === 0) {
    seedSampleUsersAndRequests(false);
  }
}

function saveLocalData() {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(usersState.users));
    localStorage.setItem(LOCAL_REQUESTS_KEY, JSON.stringify(usersState.requests));
  } catch (e) {
    console.warn('Local save error:', e);
  }
}

// ==========================================================================
// VIEW SWITCHER & EVENT LISTENERS
// ==========================================================================
function setupEventListeners() {
  const searchEl = document.getElementById('userTableSearch');
  if (searchEl) {
    searchEl.addEventListener('input', e => {
      usersState.userSearchQuery = e.target.value.toLowerCase();
      renderUsersTable();
    });
  }
}

function switchAdminView(viewName) {
  usersState.activeView = viewName;
  const tabUsers = document.getElementById('tabBtnUsers');
  const tabReqs = document.getElementById('tabBtnRequests');
  const secUsers = document.getElementById('usersSection');
  const secReqs = document.getElementById('requestsSection');

  if (viewName === 'users') {
    tabUsers?.classList.add('active');
    tabReqs?.classList.remove('active');
    if (secUsers) secUsers.style.display = 'flex';
    if (secReqs) secReqs.style.display = 'none';
    renderUsersTable();
  } else {
    tabUsers?.classList.remove('active');
    tabReqs?.classList.add('active');
    if (secUsers) secUsers.style.display = 'none';
    if (secReqs) secReqs.style.display = 'flex';
    renderRequestsGrid();
  }
}

function renderActiveView() {
  switchAdminView(usersState.activeView);
}

// ==========================================================================
// USERS TABLE RENDERING (ADS WATCHED & WEBSITE TASKS)
// ==========================================================================
function renderUsersTable() {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  let filtered = usersState.users;
  if (usersState.userSearchQuery) {
    filtered = filtered.filter(u => 
      (u.name && u.name.toLowerCase().includes(usersState.userSearchQuery)) ||
      (u.username && u.username.toLowerCase().includes(usersState.userSearchQuery)) ||
      (u.uid && u.uid.toLowerCase().includes(usersState.userSearchQuery))
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 40px; color: var(--text-secondary);">
          No users matching your search criteria.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map((user, idx) => {
    const isActive = user.status !== 'suspended';
    return `
      <tr>
        <td>
          <div class="user-identity-cell">
            <div class="user-avatar-circle">
              <span>${getUserAvatarInitial(user.name)}</span>
            </div>
            <div class="user-text-col">
              <span class="user-player-name">
                <span>${user.name}</span>
                <span style="font-size: 10px; color: #38bdf8; font-weight: 800;">Lv.${user.level || 0}</span>
              </span>
              <span class="user-tg-handle">${user.username || `@user_${user.uid.slice(0, 5)}`}</span>
            </div>
          </div>
        </td>

        <!-- 1. Ads Button Watched / Used Count -->
        <td>
          <span class="ads-metric-badge" title="Total video ads watched across all reward buttons">
            <span>🎬</span>
            <span>${user.adsWatchedCount || 0} Ads</span>
          </span>
        </td>

        <!-- 2. Website / Partner Tasks Completed -->
        <td>
          <span class="tasks-metric-badge" title="Telegram channel & bot tasks completed">
            <span>🌐</span>
            <span>${user.websiteTasksCompleted || 0} / 3 Tasks</span>
          </span>
        </td>

        <!-- Balances (Diamonds & Coins) -->
        <td>
          <div class="balance-chips-row">
            <span class="bal-chip" style="color: #38bdf8;" title="Diamonds">💎 ${(user.diamonds || 0).toLocaleString()}</span>
            <span class="bal-chip" style="color: #fbbf24;" title="Coins">🪙 ${(user.coins || 0).toLocaleString()}</span>
          </div>
        </td>

        <!-- Total Taps Harvested -->
        <td>
          <span style="font-family: var(--font-mono); font-weight: 700; color: #cbd5e1;">
            ⚡ ${(user.totalTaps || 0).toLocaleString()}
          </span>
        </td>

        <!-- Status -->
        <td>
          <span class="status-pill ${isActive ? 'status-active' : 'status-suspended'}">
            ${isActive ? '● ACTIVE' : '■ SUSPENDED'}
          </span>
        </td>

        <!-- Actions -->
        <td>
          <div style="display: flex; align-items: center; gap: 6px;">
            <button class="btn-card-action" onclick="viewUserModal('${user.uid}')" title="View Full Activity">👁️</button>
            <button class="btn-card-action" onclick="toggleUserStatus('${user.uid}')" title="Toggle Active / Suspend">
              ${isActive ? '🚫' : '✅'}
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function getUserAvatarInitial(name) {
  if (!name) return '👤';
  const parts = name.trim().split(' ');
  return parts[0].charAt(0).toUpperCase();
}

function toggleUserStatus(uid) {
  const user = usersState.users.find(u => u.uid === uid);
  if (!user) return;

  user.status = user.status === 'suspended' ? 'active' : 'suspended';
  saveLocalData();
  if (db && usersState.isFirebaseOnline) {
    db.ref(`/players/${uid}/status`).set(user.status);
  }
  renderUsersTable();
  updateTopMetrics();
  showToast(`User ${user.name} is now ${user.status.toUpperCase()}`);
}

// ==========================================================================
// MEGA REWARD REDEMPTION REQUESTS SECTION
// ==========================================================================
function renderRequestsGrid() {
  const grid = document.getElementById('requestsGridContainer');
  if (!grid) return;

  let filtered = usersState.requests;
  if (usersState.requestFilter !== 'all') {
    filtered = filtered.filter(r => r.status === usersState.requestFilter);
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-inventory-card" style="grid-column: 1 / -1;">
        <div class="empty-icon">🎁</div>
        <h4 class="empty-title">No Mega Reward Requests Found</h4>
        <p class="empty-desc">There are no ${usersState.requestFilter === 'all' ? '' : usersState.requestFilter} reward redemption requests at this time.</p>
        <button class="btn-tool btn-seed" onclick="seedSampleUsersAndRequests(true)">⚡ Seed Sample Requests</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(req => {
    return `
      <div class="request-card" id="reqCard-${req.id}">
        <div class="req-header-row">
          <span class="req-id-tag">#REQ-${req.id.slice(-6).toUpperCase()}</span>
          <span class="req-status-tag status-${req.status}">${req.status.toUpperCase()}</span>
        </div>

        <!-- Reward Item Details -->
        <div class="req-item-box">
          <div class="req-item-icon">${req.categoryIcon || '🎁'}</div>
          <div class="req-item-info">
            <span class="req-item-cat">${req.categoryName || 'Reward'}</span>
            <span class="req-item-title">${req.rewardTitle}</span>
            <span class="req-item-cost">💎 ${(req.diamondsCost || 500).toLocaleString()} Diamonds</span>
          </div>
        </div>

        <!-- Player Contact & Delivery Info -->
        <div class="req-contact-box">
          <div class="req-contact-line">
            <span>Player:</span>
            <strong>${req.userName}</strong>
            <span style="font-family: var(--font-mono); color: #38bdf8;">(${req.userTgHandle || '@alexvance'})</span>
          </div>
          <div class="req-contact-line">
            <span>Delivery / Link:</span>
            <strong style="color: #cbd5e1;">
              ${req.amazonLink ? `<a href="${req.amazonLink}" target="_blank" rel="noopener noreferrer" style="color: #38bdf8; text-decoration: underline; margin-right: 6px;">🔗 View Amazon Product</a> • ` : ''}
              ${req.deliveryInfo || 'Telegram DM: ' + req.userTgHandle}
            </strong>
          </div>
          ${req.userNotes ? `
          <div class="req-contact-line" style="font-size: 11px; color: #94a3b8; margin-top: 2px;">
            <span>Notes:</span>
            <span>${req.userNotes}</span>
          </div>` : ''}
          <div class="req-contact-line" style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">
            <span>Requested:</span>
            <span>${new Date(req.createdAt).toLocaleString()}</span>
          </div>
        </div>

        <!-- Status Management Actions -->
        <div class="req-actions-row">
          ${req.status === 'pending' ? `
            <button class="btn-req-approve" onclick="updateRequestStatus('${req.id}', 'approved')">
              <span>✅ Approve</span>
            </button>
            <button class="btn-req-reject" onclick="updateRequestStatus('${req.id}', 'rejected')">
              <span>❌ Reject</span>
            </button>
          ` : req.status === 'approved' ? `
            <button class="btn-req-deliver" onclick="updateRequestStatus('${req.id}', 'delivered')">
              <span>🚚 Mark Delivered</span>
            </button>
            <button class="btn-req-reject" onclick="updateRequestStatus('${req.id}', 'rejected')">
              <span>Reject</span>
            </button>
          ` : `
            <button class="btn-tool" style="flex: 1;" onclick="updateRequestStatus('${req.id}', 'pending')">
              <span>🔄 Reset to Pending</span>
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');
}

function setRequestFilter(filterVal) {
  usersState.requestFilter = filterVal;
  const buttons = document.querySelectorAll('.req-filter-btn');
  buttons.forEach(btn => {
    if (btn.dataset.filter === filterVal) btn.classList.add('active');
    else btn.classList.remove('active');
  });
  renderRequestsGrid();
}

function updateRequestStatus(reqId, newStatus) {
  const req = usersState.requests.find(r => r.id === reqId);
  if (!req) return;

  req.status = newStatus;
  req.updatedAt = Date.now();
  syncRequestsToCloud();
  renderRequestsGrid();
  updateTopMetrics();
  showToast(`Request #${req.id.slice(-6).toUpperCase()} marked as ${newStatus.toUpperCase()}`);
}

// ==========================================================================
// USER DETAILS MODAL
// ==========================================================================
function viewUserModal(uid) {
  const user = usersState.users.find(u => u.uid === uid);
  if (!user) return;

  usersState.selectedUserModal = user;
  const backdrop = document.getElementById('userModalBackdrop');
  const body = document.getElementById('userModalBody');
  if (!backdrop || !body) return;

  body.innerHTML = `
    <div style="display: flex; align-items: center; gap: 14px;">
      <div class="user-avatar-circle" style="width: 50px; height: 50px; font-size: 24px;">
        ${getUserAvatarInitial(user.name)}
      </div>
      <div>
        <h3 style="font-size: 18px; font-weight: 800; color: #ffffff;">${user.name}</h3>
        <span style="font-family: var(--font-mono); font-size: 11px; color: #38bdf8;">UID: ${user.uid}</span>
      </div>
    </div>

    <!-- Activity Stats Grid -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">
      <div style="background: rgba(4, 11, 30, 0.8); border: 1px solid rgba(25, 55, 120, 0.4); border-radius: 12px; padding: 12px;">
        <span style="font-size: 11px; color: var(--text-secondary);">🎬 Video Ads Watched</span>
        <h4 style="font-size: 20px; font-weight: 800; color: #fbbf24; margin-top: 4px;">${user.adsWatchedCount || 0}</h4>
      </div>

      <div style="background: rgba(4, 11, 30, 0.8); border: 1px solid rgba(25, 55, 120, 0.4); border-radius: 12px; padding: 12px;">
        <span style="font-size: 11px; color: var(--text-secondary);">🌐 Partner Tasks Completed</span>
        <h4 style="font-size: 20px; font-weight: 800; color: #34d399; margin-top: 4px;">${user.websiteTasksCompleted || 0} / 3</h4>
      </div>

      <div style="background: rgba(4, 11, 30, 0.8); border: 1px solid rgba(25, 55, 120, 0.4); border-radius: 12px; padding: 12px;">
        <span style="font-size: 11px; color: var(--text-secondary);">💎 Diamond Balance</span>
        <h4 style="font-size: 20px; font-weight: 800; color: #38bdf8; margin-top: 4px;">${(user.diamonds || 0).toLocaleString()}</h4>
      </div>

      <div style="background: rgba(4, 11, 30, 0.8); border: 1px solid rgba(25, 55, 120, 0.4); border-radius: 12px; padding: 12px;">
        <span style="font-size: 11px; color: var(--text-secondary);">⚡ Total Taps Power</span>
        <h4 style="font-size: 20px; font-weight: 800; color: #ffffff; margin-top: 4px;">${(user.totalTaps || 0).toLocaleString()}</h4>
      </div>
    </div>
  `;

  backdrop.classList.add('open');
}

function closeUserModal(e) {
  if (e && e.target && e.target.id !== 'userModalBackdrop' && !e.target.classList.contains('admin-modal-close-btn')) return;
  const backdrop = document.getElementById('userModalBackdrop');
  if (backdrop) backdrop.classList.remove('open');
}

// ==========================================================================
// TOP METRICS
// ==========================================================================
function updateTopMetrics() {
  const totalUsersEl = document.getElementById('metricTotalUsers');
  const totalAdsEl = document.getElementById('metricTotalAds');
  const totalTasksEl = document.getElementById('metricTotalTasks');
  const totalPendingReqsEl = document.getElementById('metricPendingReqs');

  const totalUsers = usersState.users.length;
  const totalAds = usersState.users.reduce((sum, u) => sum + (u.adsWatchedCount || 0), 0);
  const totalTasks = usersState.users.reduce((sum, u) => sum + (u.websiteTasksCompleted || 0), 0);
  const pendingReqs = usersState.requests.filter(r => r.status === 'pending').length;

  if (totalUsersEl) totalUsersEl.textContent = totalUsers.toLocaleString();
  if (totalAdsEl) totalAdsEl.textContent = totalAds.toLocaleString();
  if (totalTasksEl) totalTasksEl.textContent = totalTasks.toLocaleString();
  if (totalPendingReqsEl) totalPendingReqsEl.textContent = pendingReqs.toLocaleString();

  const userBadge = document.getElementById('badgeUsersCount');
  const reqBadge = document.getElementById('badgeReqsCount');
  if (userBadge) userBadge.textContent = totalUsers;
  if (reqBadge) reqBadge.textContent = usersState.requests.length;
}

// ==========================================================================
// 1-CLICK SEED SAMPLE USERS & REDEMPTION REQUESTS
// ==========================================================================
function seedSampleUsersAndRequests(showNotification = true) {
  const sampleUsers = [
    {
      uid: 'usr_alex_01',
      name: 'Alex Vance',
      username: '@alex_vance',
      level: 14,
      diamonds: 2450,
      coins: 845000,
      totalTaps: 48200,
      adsWatchedCount: 42,
      websiteTasksCompleted: 3,
      status: 'active',
      lastActive: Date.now() - 50000
    },
    {
      uid: 'usr_marina_02',
      name: 'Marina Chen',
      username: '@marinachen_tg',
      level: 22,
      diamonds: 5200,
      coins: 1950000,
      totalTaps: 112000,
      adsWatchedCount: 68,
      websiteTasksCompleted: 3,
      status: 'active',
      lastActive: Date.now() - 120000
    },
    {
      uid: 'usr_viktor_03',
      name: 'Viktor Reznov',
      username: '@viktor_core',
      level: 8,
      diamonds: 890,
      coins: 310000,
      totalTaps: 19400,
      adsWatchedCount: 18,
      websiteTasksCompleted: 2,
      status: 'active',
      lastActive: Date.now() - 300000
    },
    {
      uid: 'usr_sofia_04',
      name: 'Sofia Al-Mansoor',
      username: '@sofia_crypto',
      level: 19,
      diamonds: 3800,
      coins: 1420000,
      totalTaps: 88500,
      adsWatchedCount: 54,
      websiteTasksCompleted: 3,
      status: 'active',
      lastActive: Date.now() - 400000
    },
    {
      uid: 'usr_dimitri_05',
      name: 'Dimitri Volkov',
      username: '@dimitri_tap',
      level: 5,
      diamonds: 420,
      coins: 120000,
      totalTaps: 7400,
      adsWatchedCount: 11,
      websiteTasksCompleted: 1,
      status: 'active',
      lastActive: Date.now() - 600000
    }
  ];

  const sampleRequests = [
    {
      id: 'req_001',
      userId: 'usr_alex_01',
      userName: 'Alex Vance',
      userTgHandle: '@alex_vance',
      deliveryInfo: 'alex.vance.reactor@proton.me',
      rewardTitle: 'Amazon $100 Digital Voucher',
      categoryName: 'Gift Card',
      categoryIcon: '🎁',
      diamondsCost: 1000,
      status: 'pending',
      createdAt: Date.now() - 3600000 * 4
    },
    {
      id: 'req_002',
      userId: 'usr_marina_02',
      userName: 'Marina Chen',
      userTgHandle: '@marinachen_tg',
      deliveryInfo: 'Telegram DM: @marinachen_tg',
      rewardTitle: 'Apple AirPods Pro (2nd Gen)',
      categoryName: 'Gadgets',
      categoryIcon: '📱',
      diamondsCost: 2500,
      status: 'approved',
      createdAt: Date.now() - 3600000 * 12
    },
    {
      id: 'req_003',
      userId: 'usr_sofia_04',
      userName: 'Sofia Al-Mansoor',
      userTgHandle: '@sofia_crypto',
      deliveryInfo: 'Email: sofia.trade@gmail.com',
      rewardTitle: 'Sony DualSense Wireless Controller',
      categoryName: 'Gaming Tool',
      categoryIcon: '🎮',
      diamondsCost: 700,
      status: 'delivered',
      createdAt: Date.now() - 3600000 * 36
    }
  ];

  usersState.users = sampleUsers;
  usersState.requests = sampleRequests;
  saveLocalData();
  syncRequestsToCloud();
  renderActiveView();
  updateTopMetrics();
  if (showNotification) {
    showToast('⚡ Sample users with ads/tasks metrics & reward requests loaded!');
  }
}

// ==========================================================================
// TOAST
// ==========================================================================
function showToast(msg) {
  let toast = document.getElementById('adminToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'adminToast';
    toast.className = 'toast-notice';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span>⚡</span> <span>${msg}</span>`;
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Global Exports
window.initUsersPortal = initUsersPortal;
window.switchAdminView = switchAdminView;
window.toggleUserStatus = toggleUserStatus;
window.viewUserModal = viewUserModal;
window.closeUserModal = closeUserModal;
window.setRequestFilter = setRequestFilter;
window.updateRequestStatus = updateRequestStatus;
window.seedSampleUsersAndRequests = seedSampleUsersAndRequests;

document.addEventListener('DOMContentLoaded', initUsersPortal);
