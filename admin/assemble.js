/**
 * Admin Assembly Script for Modular Pages
 * Assembles all 6 page-wise HTML, CSS, and JS files into admin/index.html
 */
const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const PAGES_DIR = path.join(ROOT_DIR, 'pages');
const SHARED_DIR = path.join(ROOT_DIR, 'shared');

const PAGE_KEYS = [
  'dashboard',
  'users',
  'mega-add',
  'mega-request',
  'tasks-web',
  'firebase-manage',
  'ads-manage',
  'settings'
];

console.log('--- Verifying Admin Modular Page Structure ---');
let allValid = true;

PAGE_KEYS.forEach(key => {
  const htmlPath = path.join(PAGES_DIR, key, `${key}.html`);
  const cssPath = path.join(PAGES_DIR, key, `${key}.css`);
  const jsPath = path.join(PAGES_DIR, key, `${key}.js`);

  if (!fs.existsSync(htmlPath)) {
    console.error(`Missing HTML: ${htmlPath}`);
    allValid = false;
  }
  if (!fs.existsSync(cssPath)) {
    console.error(`Missing CSS: ${cssPath}`);
    allValid = false;
  }
  if (!fs.existsSync(jsPath)) {
    console.error(`Missing JS: ${jsPath}`);
    allValid = false;
  }
});

if (!allValid) {
  console.error('Assembly aborted due to missing files.');
  process.exit(1);
}

console.log(`All ${PAGE_KEYS.length} admin pages verified with HTML, CSS, and JS!`);

// Header template
const headerContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Energy Tap - Admin Portal</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700;800&display=swap" rel="stylesheet">
  
  <!-- Shared Global Styles -->
  <link rel="stylesheet" href="shared/common.css">

  <!-- Modular Page-Wise Styles -->
${PAGE_KEYS.map(k => `  <link rel="stylesheet" href="pages/${k}/${k}.css">`).join('\n')}
</head>
<body>

  <!-- Mobile Backdrop Overlay -->
  <div class="sidebar-backdrop" id="sidebarBackdrop" onclick="toggleAdminSidebar(false)"></div>

  <!-- Left Vertical Menu Bar (Sleek, Responsive & Styled Scrollbar) -->
  <aside class="sidebar">
    <div class="sidebar-brand">
      <div class="sidebar-brand-left">
        <div class="brand-icon">⚡</div>
        <div>
          <div class="brand-title">ENERGY TAP</div>
          <div class="brand-subtitle">ADMIN DASHBOARD</div>
        </div>
      </div>
      <button class="sidebar-close-btn" onclick="toggleAdminSidebar(false)" aria-label="Close Menu">✕</button>
    </div>

    <nav class="sidebar-nav">
      <div class="nav-section-label">Main Menu</div>

      <button class="nav-item active" data-page="dashboard" onclick="switchAdminPage('dashboard', 'Dashboard Overview')">
        <span class="nav-icon">📊</span>
        <span>Dashboard</span>
      </button>

      <button class="nav-item" data-page="users" onclick="switchAdminPage('users', 'User Analytics & Players')">
        <span class="nav-icon">👥</span>
        <span>User</span>
        <span class="nav-badge" id="badgeUsersCount">0</span>
      </button>

      <button class="nav-item" data-page="mega-add" onclick="switchAdminPage('mega-add', 'Mega Add & Item Catalog')">
        <span class="nav-icon">🎁</span>
        <span>Mega Add</span>
        <span class="nav-badge" id="badgeRewardsCount">0</span>
      </button>

      <button class="nav-item" data-page="mega-request" onclick="switchAdminPage('mega-request', 'Mega Redemption Requests')">
        <span class="nav-icon">📨</span>
        <span>Mega Request</span>
        <span class="nav-badge badge-amber" id="badgeRequestsCount">0</span>
      </button>

      <button class="nav-item" data-page="tasks-web" onclick="switchAdminPage('tasks-web', 'Task Manager (Telegram & Web)')">
        <span class="nav-icon">🎯</span>
        <span>Task Manage</span>
      </button>

      <div class="nav-section-label" style="margin-top: 8px;">Management & System</div>

      <button class="nav-item" data-page="firebase-manage" onclick="switchAdminPage('firebase-manage', 'Firebase Database Manager')">
        <span class="nav-icon">🔥</span>
        <span>Firebase Manage</span>
      </button>

      <button class="nav-item" data-page="ads-manage" onclick="switchAdminPage('ads-manage', 'Ads Network & Rewards')">
        <span class="nav-icon">🎬</span>
        <span>Ads Manage</span>
      </button>

      <button class="nav-item" data-page="settings" onclick="switchAdminPage('settings', 'Cloud & Database Settings')">
        <span class="nav-icon">⚙️</span>
        <span>Settings</span>
      </button>
    </nav>

    <!-- Sidebar Footer with Realtime Cloud Status -->
    <div class="sidebar-footer">
      <div class="cloud-status-box">
        <div class="status-dot" id="firebaseStatusDot"></div>
        <div class="status-info">
          <span class="status-title">Firebase Realtime DB</span>
          <span class="status-sub" id="firebaseStatusText">Connecting...</span>
        </div>
      </div>
    </div>
  </aside>

  <!-- Main Content Workspace -->
  <main class="main-content">
    <header class="top-header">
      <div class="header-left">
        <button class="mobile-menu-btn" id="mobileMenuBtn" onclick="toggleAdminSidebar()" aria-label="Open Navigation Menu">
          <span>☰</span>
        </button>
        <h1 class="page-title" id="activeHeaderTitle">Dashboard Overview</h1>
      </div>
      <div class="header-right">
        <div class="header-actions">
          <!-- Live DB Pill -->
          <div class="header-cloud-pill">
            <span class="pulse-dot"></span>
            <span>Live DB Connected</span>
          </div>

          <!-- Logged In Admin Profile Badge (2-5 Admin Access) -->
          <div class="admin-user-badge" id="currentAdminBadge" style="display: none;">
            <div class="admin-avatar" id="headerAdminAvatar">A</div>
            <div style="display: flex; flex-direction: column;">
              <span style="font-weight: 700; color: #fff;" id="headerAdminName">Admin</span>
              <span style="font-size: 10px; color: #38bdf8;" id="headerAdminRole">Super Admin</span>
            </div>
          </div>

          <!-- Admin Sign Out Button -->
          <button class="admin-logout-btn" id="adminLogoutBtn" onclick="logoutAdmin()" title="Secure Logout from Admin Panel" style="display: none;">
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </header>

    <div class="content-body">
`;

// Body: Read all page HTMLs
const pagesContent = PAGE_KEYS.map(k => {
  const html = fs.readFileSync(path.join(PAGES_DIR, k, `${k}.html`), 'utf8');
  return `      <!-- ================= PAGE: ${k.toUpperCase()} ================= -->\n${html.split('\n').map(l => '      ' + l).join('\n')}`;
}).join('\n\n');

// Footer template with Modals, Shared Firebase SDKs & Modular Page JS
const footerContent = `
    </div>
  </main>

  <!-- ============================================================
       SHARED MODAL: EDIT PLAYER (Firebase /players/{uid}/player)
       ============================================================ -->
  <div class="modal-overlay" id="userEditModal" onclick="closeUserEditModal()">
    <div class="modal-card" onclick="event.stopPropagation()">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(25, 55, 120, 0.4); padding-bottom: 12px;">
        <h3 style="font-size: 15px; font-weight: 800; color: #38bdf8;" id="editModalPlayerName">Edit Player</h3>
        <button onclick="closeUserEditModal()" style="background: none; border: none; color: #94a3b8; font-size: 20px; cursor: pointer;">&times;</button>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div class="form-group">
          <label class="form-label">XP Level</label>
          <input type="number" id="editModalLevel" class="form-input" style="color: #38bdf8; font-weight: 800;">
        </div>
        <div class="form-group">
          <label class="form-label">Goal Level</label>
          <input type="number" id="editModalGoalLevel" class="form-input" style="color: #60a5fa; font-weight: 800;">
        </div>
        <div class="form-group">
          <label class="form-label">Coins 🪙</label>
          <input type="number" id="editModalCoins" class="form-input" style="color: #fbbf24; font-weight: 800;">
        </div>
        <div class="form-group">
          <label class="form-label">Diamonds 💎</label>
          <input type="number" id="editModalDiamonds" class="form-input" style="color: #22d3ee; font-weight: 800;">
        </div>
        <div class="form-group">
          <label class="form-label">Chest Keys 🗝️</label>
          <input type="number" id="editModalKeys" class="form-input" style="color: #a855f7; font-weight: 800;">
        </div>
        <div class="form-group">
          <label class="form-label">Scratch Cards 🎴</label>
          <input type="number" id="editModalCards" class="form-input" style="color: #ec4899; font-weight: 800;">
        </div>
        <div class="form-group">
          <label class="form-label">Tickets 🎟️</label>
          <input type="number" id="editModalTickets" class="form-input" style="color: #f59e0b; font-weight: 800;">
        </div>
        <div class="form-group">
          <label class="form-label">Egg Coins 🥚</label>
          <input type="number" id="editModalEggs" class="form-input" style="color: #10b981; font-weight: 800;">
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 6px;">
        <div style="display: flex; gap: 10px;">
          <button onclick="savePlayerEditToFirebase()" class="btn-primary" style="flex: 1;">Save Changes</button>
          <button onclick="closeUserEditModal()" class="btn-secondary">Cancel</button>
        </div>
        <div style="display: flex; gap: 10px;">
          <button onclick="restartUserSeasonInFirebase()" class="btn-secondary" style="flex: 1; color: #38bdf8; border-color: rgba(56, 189, 248, 0.4); text-align: center; justify-content: center; display: flex; align-items: center; gap: 6px;">
            🌟 Restart Season (Level 0 & New Claims)
          </button>
        </div>
        <div style="display: flex; gap: 10px;">
          <button onclick="restartPlayerInFirebase()" class="btn-secondary" style="flex: 1; color: #fbbf24; border-color: rgba(245, 158, 11, 0.4); text-align: center; justify-content: center; display: flex; align-items: center; gap: 6px;">
            🔄 Full Reset to 0 (Clean All Data)
          </button>
          <button onclick="removeUserFromModal()" class="btn-secondary" style="color: #f87171; border-color: rgba(239, 68, 68, 0.4); padding: 8px 12px;" title="Permanently Remove Player">
            🗑️ Remove
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- ============================================================
       SHARED MODAL: MANAGE REQUEST (Firebase /reward_requests/{id})
       ============================================================ -->
  <div class="modal-overlay" id="requestManageModal" onclick="closeRequestManageModal()">
    <div class="modal-card" onclick="event.stopPropagation()">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(25, 55, 120, 0.4); padding-bottom: 12px;">
        <h3 style="font-size: 15px; font-weight: 800; color: #22d3ee;">Manage Order Fulfillment</h3>
        <button onclick="closeRequestManageModal()" style="background: none; border: none; color: #94a3b8; font-size: 20px; cursor: pointer;">&times;</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px; font-size: 13px;">
        <div style="display: flex; justify-content: space-between; padding: 8px 12px; background: rgba(4, 10, 26, 0.6); border-radius: 8px;">
          <span style="color: #94a3b8;">User:</span>
          <strong style="color: #fff;" id="modalReqUser">User</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 12px; background: rgba(4, 10, 26, 0.6); border-radius: 8px;">
          <span style="color: #94a3b8;">Reward Item:</span>
          <strong style="color: #22d3ee;" id="modalReqItem">Reward</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 12px; background: rgba(4, 10, 26, 0.6); border-radius: 8px;">
          <span style="color: #94a3b8;">Diamonds:</span>
          <strong style="color: #fbbf24;" id="modalReqDiamonds">0 💎</strong>
        </div>
        <div style="display: flex; flex-direction: column; gap: 4px; padding: 8px 12px; background: rgba(4, 10, 26, 0.6); border-radius: 8px;">
          <span style="color: #94a3b8; font-size: 11px;">Shipping / Delivery Details:</span>
          <span style="color: #fff;" id="modalReqShipping">Address</span>
        </div>

        <div class="form-group" style="margin-top: 6px;">
          <label class="form-label">Update Order Status</label>
          <select id="modalReqStatus" class="form-input">
            <option value="pending">PENDING (Reviewing)</option>
            <option value="approved">APPROVED (Processing)</option>
            <option value="delivered">DELIVERED (Fulfilled)</option>
            <option value="rejected">REJECTED (Refunded)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Tracking / Delivery Note</label>
          <textarea id="modalReqNotes" rows="3" placeholder="e.g. Voucher code: AMZ-9842 or Tracking #..." class="form-input"></textarea>
        </div>
      </div>

      <div style="display: flex; gap: 10px; margin-top: 8px;">
        <button onclick="saveRequestStatusToFirebase()" class="btn-primary" style="flex: 1;">Save Status</button>
        <button onclick="closeRequestManageModal()" class="btn-secondary">Cancel</button>
      </div>
    </div>
  </div>

  <!-- ============================================================
       MODAL: ADD NEW ADMIN USER (STRICT LIMIT: MAX 5 ADMINS)
       ============================================================ -->
  <div class="modal-overlay" id="addAdminModal" onclick="closeAddAdminModal()">
    <div class="modal-card" onclick="event.stopPropagation()" style="max-width: 420px;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(25, 55, 120, 0.4); padding-bottom: 12px;">
        <div>
          <h3 style="font-size: 16px; font-weight: 800; color: #38bdf8;">Add Admin User</h3>
          <span style="font-size: 11.5px; color: #94a3b8;">Restricted Access: 2 to 5 Admins Maximum</span>
        </div>
        <button onclick="closeAddAdminModal()" style="background: none; border: none; color: #94a3b8; font-size: 20px; cursor: pointer;">&times;</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 10px;">
        <div class="form-group">
          <label class="form-label">Username (alphanumeric)</label>
          <input type="text" id="newAdminUsername" class="form-input" placeholder="e.g. admin3 or ops_lead" style="color: #38bdf8;">
        </div>

        <div class="form-group">
          <label class="form-label">Full Name / Display Tag</label>
          <input type="text" id="newAdminName" class="form-input" placeholder="e.g. Security Officer">
        </div>

        <div class="form-group">
          <label class="form-label">Role</label>
          <select id="newAdminRole" class="form-input">
            <option value="Operations Admin">Operations Admin</option>
            <option value="Community Moderator">Community Moderator</option>
            <option value="Finance & Rewards Admin">Finance & Rewards Admin</option>
            <option value="Super Admin">Super Admin</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Password (min 6 chars)</label>
          <input type="password" id="newAdminPassword" class="form-input" placeholder="••••••••">
        </div>
      </div>

      <div style="display: flex; gap: 10px; margin-top: 16px;">
        <button onclick="saveNewAdminUser()" class="btn-primary" style="flex: 1;">Create Admin</button>
        <button onclick="closeAddAdminModal()" class="btn-secondary">Cancel</button>
      </div>
    </div>
  </div>

  <!-- ============================================================
       ADMIN LOGIN GATEWAY (STRICT AUTH FOR 2 - 5 ADMIN USERS)
       ============================================================ -->
  <div class="admin-login-gate" id="adminLoginGate" style="display: flex;">
    <div class="admin-login-card">
      <div class="admin-gate-header">
        <div class="admin-gate-icon">⚡</div>
        <h2 class="admin-gate-title">Admin Portal Access</h2>
        <p class="admin-gate-subtitle">Authorized Game Master & Operations Console</p>
        <div class="admin-gate-badge">
          <span>🔒 Strictly Restricted to 2 – 5 Admin Users</span>
        </div>
      </div>

      <form id="adminLoginForm" onsubmit="handleAdminLogin(event)" style="display: flex; flex-direction: column; gap: 14px; margin-top: 6px;">
        <div class="form-group">
          <label class="form-label" for="loginAdminUser" style="color: #cbd5e1;">Admin Username</label>
          <input type="text" id="loginAdminUser" class="form-input" placeholder="admin" required autocomplete="username" style="background: rgba(4, 10, 26, 0.85); border-color: rgba(56, 189, 248, 0.35);">
        </div>

        <div class="form-group">
          <label class="form-label" for="loginAdminPass" style="color: #cbd5e1;">Admin Password</label>
          <input type="password" id="loginAdminPass" class="form-input" placeholder="••••••••" required autocomplete="current-password" style="background: rgba(4, 10, 26, 0.85); border-color: rgba(56, 189, 248, 0.35);">
        </div>

        <div id="loginErrorMessage" style="display: none; padding: 8px 12px; border-radius: 8px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #f87171; font-size: 12px; text-align: center;">
        </div>

        <button type="submit" id="adminLoginSubmitBtn" class="btn-primary" style="margin-top: 4px; padding: 12px; font-size: 14px; letter-spacing: 0.5px; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <span>🔓</span>
          <span>Authenticate & Enter</span>
        </button>
      </form>

      <div style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 12px; text-align: center; font-size: 11.5px; color: #64748b;">
        Default Credentials: <code style="color: #38bdf8;">admin</code> / <code style="color: #38bdf8;">password123</code>
      </div>
    </div>
  </div>

  <!-- Firebase Cloud SDKs -->
  <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js"></script>

  <!-- Shared Firebase Service -->
  <script src="shared/firebase.js"></script>

  <!-- Global Router Logic -->
  <script>
    function toggleAdminSidebar(forceState) {
      const sidebar = document.querySelector('.sidebar');
      const backdrop = document.getElementById('sidebarBackdrop');
      if (!sidebar) return;
      const isOpen = sidebar.classList.contains('open');
      const nextState = typeof forceState === 'boolean' ? forceState : !isOpen;
      if (nextState) {
        sidebar.classList.add('open');
        if (backdrop) backdrop.classList.add('active');
        document.body.style.overflow = 'hidden';
      } else {
        sidebar.classList.remove('open');
        if (backdrop) backdrop.classList.remove('active');
        document.body.style.overflow = '';
      }
    }
    window.toggleAdminSidebar = toggleAdminSidebar;

    function switchAdminPage(pageKey, pageTitle) {
      if (window.adminState) window.adminState.activePage = pageKey;

      const normTarget = pageKey.replace(/[-_]/g, '').toLowerCase();

      document.querySelectorAll('.nav-item').forEach(item => {
        const itemPage = item.getAttribute('data-page');
        if (itemPage === pageKey || (itemPage && itemPage.replace(/[-_]/g, '').toLowerCase() === normTarget)) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });

      const titleEl = document.getElementById('activeHeaderTitle');
      if (titleEl && pageTitle) titleEl.textContent = pageTitle;

      document.querySelectorAll('.page-panel').forEach(panel => {
        const normPanel = panel.id.replace(/^page-/, '').replace(/[-_]/g, '').toLowerCase();
        if (panel.id === \`page-\${pageKey}\` || normTarget === normPanel) {
          panel.classList.add('active');
        } else {
          panel.classList.remove('active');
        }
      });

      // Auto-trigger page renders
      if (normTarget === 'tasksweb') {
        if (typeof window.switchAdminTaskSubtab === 'function') {
          window.switchAdminTaskSubtab('telegram');
        }
        if (typeof window.renderTelegramTasksUI === 'function') {
          window.renderTelegramTasksUI();
        }
        if (typeof window.renderWebsiteTasksUI === 'function') {
          window.renderWebsiteTasksUI();
        }
      }

      // Auto close sidebar drawer on mobile
      if (window.innerWidth <= 992) {
        toggleAdminSidebar(false);
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.switchAdminPage = switchAdminPage;
  </script>

  <!-- Modular Page-Wise Scripts -->
${PAGE_KEYS.map(k => `  <script src="pages/${k}/${k}.js"></script>`).join('\n')}

  <!-- Admin Session Authentication & Access Control (2 - 5 Users Only) -->
  <script>
    const ADMIN_SESSION_KEY = 'ENERGY_TAP_ADMIN_AUTH_USER';

    function getCurrentAdminSession() {
      try {
        const raw = sessionStorage.getItem(ADMIN_SESSION_KEY) || localStorage.getItem(ADMIN_SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    }
    window.getCurrentAdminSession = getCurrentAdminSession;

    function checkAdminAuthGate() {
      const session = getCurrentAdminSession();
      const gate = document.getElementById('adminLoginGate');
      const badge = document.getElementById('currentAdminBadge');
      const logoutBtn = document.getElementById('adminLogoutBtn');
      const nameEl = document.getElementById('headerAdminName');
      const roleEl = document.getElementById('headerAdminRole');
      const avatarEl = document.getElementById('headerAdminAvatar');

      if (session && session.username) {
        // Authenticated
        if (gate) gate.style.display = 'none';
        if (badge) badge.style.display = 'flex';
        if (logoutBtn) logoutBtn.style.display = 'flex';

        if (nameEl) nameEl.textContent = session.name || session.username;
        if (roleEl) roleEl.textContent = session.role || 'Admin';
        if (avatarEl) avatarEl.textContent = (session.username || 'A')[0].toUpperCase();
      } else {
        // Unauthenticated -> Lock interface behind gate
        if (gate) gate.style.display = 'flex';
        if (badge) badge.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
      }
    }
    window.checkAdminAuthGate = checkAdminAuthGate;

    function handleAdminLogin(event) {
      if (event) event.preventDefault();
      const userInput = document.getElementById('loginAdminUser');
      const passInput = document.getElementById('loginAdminPass');
      const errBox = document.getElementById('loginErrorMessage');
      const submitBtn = document.getElementById('adminLoginSubmitBtn');

      const userVal = userInput ? userInput.value.trim().toLowerCase() : '';
      const passVal = passInput ? passInput.value.trim() : '';

      if (!userVal || !passVal) {
        showLoginError('Please enter both username and password.');
        return;
      }

      if (errBox) errBox.style.display = 'none';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>⏳</span><span>Verifying Access...</span>';
      }

      const admins = (window.adminState && window.adminState.adminUsers && window.adminState.adminUsers.length > 0)
        ? window.adminState.adminUsers
        : [
            { username: 'admin', password: 'password123', role: 'Super Admin', name: 'Master Admin' },
            { username: 'admin2', password: 'password123', role: 'Operations Admin', name: 'Secondary Admin' }
          ];

      // Verify credentials against the allowed 2-5 admin accounts
      const match = admins.find(a => a.username.toLowerCase() === userVal && a.password === passVal);

      setTimeout(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>🔓</span><span>Authenticate & Enter</span>';
        }

        if (match) {
          const authObj = {
            username: match.username,
            name: match.name || match.username,
            role: match.role || 'Admin',
            loginTime: Date.now()
          };
          sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(authObj));
          localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(authObj));
          checkAdminAuthGate();
        } else {
          showLoginError('Invalid admin credentials. Access is restricted to 2 - 5 authorized admins only.');
        }
      }, 350);
    }
    window.handleAdminLogin = handleAdminLogin;

    function showLoginError(msg) {
      const errBox = document.getElementById('loginErrorMessage');
      if (errBox) {
        errBox.textContent = msg;
        errBox.style.display = 'block';
      } else {
        alert(msg);
      }
    }

    function logoutAdmin() {
      if (confirm('Are you sure you want to log out from the Admin Portal?')) {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
        localStorage.removeItem(ADMIN_SESSION_KEY);
        checkAdminAuthGate();
        const userInput = document.getElementById('loginAdminUser');
        const passInput = document.getElementById('loginAdminPass');
        if (userInput) userInput.value = '';
        if (passInput) passInput.value = '';
      }
    }
    window.logoutAdmin = logoutAdmin;

    // Listen for admin changes in Firebase and re-verify session
    window.addEventListener('adminUsersUpdated', () => {
      const session = getCurrentAdminSession();
      if (session && window.adminState && window.adminState.adminUsers) {
        const stillExists = window.adminState.adminUsers.some(a => a.username.toLowerCase() === session.username.toLowerCase());
        if (!stillExists) {
          alert('Your admin account has been removed. You will now be signed out.');
          sessionStorage.removeItem(ADMIN_SESSION_KEY);
          localStorage.removeItem(ADMIN_SESSION_KEY);
          checkAdminAuthGate();
        }
      }
    });

    document.addEventListener('DOMContentLoaded', () => {
      checkAdminAuthGate();
    });
  </script>

  <!-- Auto-Init Firebase -->
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      if (typeof initFirebase === 'function') {
        initFirebase();
      }
    });
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(ROOT_DIR, 'index.html'), headerContent + pagesContent + footerContent, 'utf8');
console.log('Successfully assembled modular admin/index.html!');
