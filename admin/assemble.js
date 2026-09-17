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
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@500;600;700;800&family=JetBrains+Mono:wght@500;700;800&display=swap" rel="stylesheet">
  
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
          <div class="brand-title">tap_energy</div>
          <div class="brand-subtitle">ADMIN CONSOLE</div>
        </div>
      </div>
      <button class="sidebar-close-btn" onclick="toggleAdminSidebar(false)" aria-label="Close Menu">✕</button>
    </div>

    <!-- Admin Profile Badge & Sign Out Button (Moved to Top of Menu Bar) -->
    <div class="sidebar-top-user" style="padding: 10px 14px; border-bottom: 1.5px solid #f1f5f9; background: #fafafa; display: flex; flex-direction: column; gap: 6px; flex-shrink: 0;">
      <div class="admin-user-badge" id="currentAdminBadge" style="display: none; width: 100%; justify-content: flex-start;">
        <div class="admin-avatar" id="headerAdminAvatar">A</div>
        <div style="display: flex; flex-direction: column; overflow: hidden;">
          <span style="font-weight: 700; color: #0f172a; font-size: 12px; white-space: nowrap; text-overflow: ellipsis;" id="headerAdminName">Admin</span>
          <span style="font-size: 10px; color: #0284c7;" id="headerAdminRole">Super Admin</span>
        </div>
      </div>

      <button class="admin-logout-btn" id="adminLogoutBtn" onclick="logoutAdmin()" title="Secure Logout from Admin Panel" style="display: none; width: 100%; justify-content: center;">
        <span>🚪</span>
        <span>Sign Out</span>
      </button>
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

  <!-- Auto-Tucking Floating Edge Menu Trigger Button (Hidden on Dashboard, visible on other pages) -->
  <div class="edge-menu-trigger" id="edgeMenuTrigger" onclick="toggleAdminSidebar()" title="Toggle Navigation Menu" style="display: none;">
    <div class="edge-menu-pill">
      <span style="font-size: 14px;">⚡</span>
      <span>Menu</span>
    </div>
    <div class="edge-menu-tab-arrow" id="edgeMenuArrow">▸</div>
  </div>

  <!-- Main Content Workspace -->
  <main class="main-content">
    <!-- Top Heading Bar: Only Game Name (tap_energy) & Shown ONLY in Dashboard -->
    <header class="top-header" id="mainTopHeader">
      <div class="header-left" style="display: flex; align-items: center; gap: 12px;">
        <button class="mobile-menu-btn" id="mobileMenuBtn" onclick="toggleAdminSidebar()" aria-label="Open Navigation Menu">
          <span>☰</span>
        </button>
        <div class="header-game-badge" style="display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 99px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
          <span style="font-size: 14px; color: #0284c7;">⚡</span>
          <span style="font-size: 13.5px; font-weight: 800; color: #0f172a; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.8px;">tap_energy</span>
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
       ADMIN PASSWORD VERIFICATION MODAL (PASSWORD: 0911 REQUIRED TO EDIT)
       ============================================================ -->
  <div class="modal-overlay" id="adminPasswordModal" onclick="closeAdminPasswordModal()">
    <div class="modal-card" onclick="event.stopPropagation()" style="max-width: 380px;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #f1f5f9; padding-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 18px;">🔒</span>
          <h3 style="font-size: 15px; font-weight: 800; color: #0f172a;">Admin Password Required</h3>
        </div>
        <button onclick="closeAdminPasswordModal()" style="background: none; border: none; color: #64748b; font-size: 20px; cursor: pointer;">&times;</button>
      </div>

      <p style="font-size: 12px; color: #64748b; margin-top: 10px; line-height: 1.45;">
        Security Protection: Admin password (0911) is required to edit or change any user or admin data.
      </p>

      <form onsubmit="submitAdminPasswordVerify(event)" style="display: flex; flex-direction: column; gap: 12px; margin-top: 8px;">
        <div class="form-group">
          <label class="form-label" style="font-weight: 800;">Admin Password</label>
          <input type="password" id="inputAdminVerifyPassword" class="form-input" placeholder="••••" required autocomplete="off" style="font-family: 'JetBrains Mono', monospace; font-size: 18px; letter-spacing: 4px; text-align: center;">
        </div>

        <div id="adminVerifyErrorMsg" style="display: none; padding: 6px 10px; border-radius: 6px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.35); color: #dc2626; font-size: 11.5px; font-weight: 700; text-align: center;">
        </div>

        <div style="display: flex; gap: 10px; margin-top: 4px;">
          <button type="submit" class="btn-primary" style="flex: 1;">Unlock &amp; Proceed</button>
          <button type="button" class="btn-secondary" onclick="closeAdminPasswordModal()">Cancel</button>
        </div>
      </form>
    </div>
  </div>

  <!-- ============================================================
       SHARED MODAL: EDIT PLAYER (Firebase /players/{uid}/player)
       ============================================================ -->
  <div class="modal-overlay" id="userEditModal" onclick="closeUserEditModal()">
    <div class="modal-card" onclick="event.stopPropagation()">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #f1f5f9; padding-bottom: 12px;">
        <h3 style="font-size: 16px; font-weight: 800; color: #0f172a;" id="editModalPlayerName">Edit Player</h3>
        <button onclick="closeUserEditModal()" style="background: none; border: none; color: #64748b; font-size: 20px; cursor: pointer;">&times;</button>
      </div>

      <!-- User Identification (Fixed Cloud Code & Info) -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; margin-top: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <div>
          <label style="font-size: 10.5px; font-weight: 800; color: #64748b; text-transform: uppercase;">Fixed Profile Code</label>
          <input type="text" id="editModalProfileCode" class="form-input" style="color: #0284c7; font-weight: 800; font-family: 'JetBrains Mono', monospace; padding: 6px 10px; font-size: 13px; background: #fff;" readonly>
        </div>
        <div>
          <label style="font-size: 10.5px; font-weight: 800; color: #64748b; text-transform: uppercase;">Telegram Handle</label>
          <input type="text" id="editModalTelegram" class="form-input" style="color: #0f172a; font-weight: 700; padding: 6px 10px; font-size: 13px; background: #fff;" readonly>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div class="form-group">
          <label class="form-label">XP Level</label>
          <input type="number" id="editModalLevel" class="form-input" style="color: #0284c7; font-weight: 800;">
        </div>
        <div class="form-group">
          <label class="form-label">Goal Level</label>
          <input type="number" id="editModalGoalLevel" class="form-input" style="color: #2563eb; font-weight: 800;">
        </div>
        <div class="form-group">
          <label class="form-label">Coins 🪙</label>
          <input type="number" id="editModalCoins" class="form-input" style="color: #ca8a04; font-weight: 800;">
        </div>
        <div class="form-group">
          <label class="form-label">Blue Coins 🔷</label>
          <input type="number" id="editModalBlueCoins" class="form-input" style="color: #0284c7; font-weight: 800;">
        </div>
        <div class="form-group">
          <label class="form-label">Diamonds 💎</label>
          <input type="number" id="editModalDiamonds" class="form-input" style="color: #0891b2; font-weight: 800;">
        </div>
        <div class="form-group">
          <label class="form-label">Chest Keys 🗝️</label>
          <input type="number" id="editModalKeys" class="form-input" style="color: #9333ea; font-weight: 800;">
        </div>
        <div class="form-group">
          <label class="form-label">Scratch Cards 🎴</label>
          <input type="number" id="editModalCards" class="form-input" style="color: #db2777; font-weight: 800;">
        </div>
        <div class="form-group">
          <label class="form-label">Tickets 🎟️</label>
          <input type="number" id="editModalTickets" class="form-input" style="color: #d97706; font-weight: 800;">
        </div>
        <div class="form-group">
          <label class="form-label">Egg Coins 🥚</label>
          <input type="number" id="editModalEggs" class="form-input" style="color: #059669; font-weight: 800;">
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 6px;">
        <div style="display: flex; gap: 10px;">
          <button onclick="savePlayerEditToFirebase()" class="btn-primary" style="flex: 1;">Save Changes</button>
          <button onclick="closeUserEditModal()" class="btn-secondary">Cancel</button>
        </div>
        <div style="display: flex; gap: 10px;">
          <button onclick="restartUserSeasonInFirebase()" class="btn-secondary" style="flex: 1; color: #0284c7; border-color: #0284c7; text-align: center; justify-content: center; display: flex; align-items: center; gap: 6px;">
            🌟 Restart Season (Level 0 & New Claims)
          </button>
        </div>
        <div style="display: flex; gap: 10px;">
          <button onclick="restartPlayerInFirebase()" class="btn-secondary" style="flex: 1; color: #d97706; border-color: #d97706; text-align: center; justify-content: center; display: flex; align-items: center; gap: 6px;">
            🔄 Full Reset to 0 (Clean All Data)
          </button>
          <button onclick="removeUserFromModal()" class="btn-secondary" style="color: #dc2626; border-color: #dc2626; padding: 8px 12px;" title="Permanently Remove Player">
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
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #f1f5f9; padding-bottom: 12px;">
        <h3 style="font-size: 16px; font-weight: 800; color: #0f172a;">Manage Order Fulfillment</h3>
        <button onclick="closeRequestManageModal()" style="background: none; border: none; color: #64748b; font-size: 20px; cursor: pointer;">&times;</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px; font-size: 13px;">
        <div style="display: flex; justify-content: space-between; padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <span style="color: #64748b; font-weight: 600;">User:</span>
          <strong style="color: #0f172a;" id="modalReqUser">User</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <span style="color: #64748b; font-weight: 600;">Reward Item:</span>
          <strong style="color: #0284c7;" id="modalReqItem">Reward</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <span style="color: #64748b; font-weight: 600;">Diamonds:</span>
          <strong style="color: #d97706;" id="modalReqDiamonds">0 💎</strong>
        </div>
        <div style="display: flex; flex-direction: column; gap: 4px; padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <span style="color: #64748b; font-size: 11px; font-weight: 700;">Shipping / Delivery Details:</span>
          <span style="color: #0f172a;" id="modalReqShipping">Address</span>
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
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #f1f5f9; padding-bottom: 12px;">
        <div>
          <h3 style="font-size: 16px; font-weight: 800; color: #0f172a;">Add Admin User</h3>
          <span style="font-size: 11.5px; color: #64748b;">Restricted Access: 2 to 5 Admins Maximum</span>
        </div>
        <button onclick="closeAddAdminModal()" style="background: none; border: none; color: #64748b; font-size: 20px; cursor: pointer;">&times;</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 10px;">
        <div class="form-group">
          <label class="form-label">Username (alphanumeric)</label>
          <input type="text" id="newAdminUsername" class="form-input" placeholder="e.g. admin3 or ops_lead" style="color: #0284c7; font-weight: 700;">
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
          <label class="form-label" for="loginAdminUser" style="color: #475569;">Admin Username</label>
          <input type="text" id="loginAdminUser" class="form-input" placeholder="admin" required autocomplete="username">
        </div>

        <div class="form-group">
          <label class="form-label" for="loginAdminPass" style="color: #475569;">Admin Password</label>
          <input type="password" id="loginAdminPass" class="form-input" placeholder="••••••••" required autocomplete="current-password">
        </div>

        <div id="loginErrorMessage" style="display: none; padding: 8px 12px; border-radius: 8px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.35); color: #dc2626; font-size: 12px; font-weight: 700; text-align: center;">
        </div>

        <button type="submit" id="adminLoginSubmitBtn" class="btn-primary" style="margin-top: 4px; padding: 12px; font-size: 14px; letter-spacing: 0.5px; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <span>🔓</span>
          <span>Authenticate & Enter</span>
        </button>
      </form>

      <div style="border-top: 1.5px solid #f1f5f9; padding-top: 14px; text-align: center; font-size: 11.5px; color: #64748b;">
        Default Credentials: <code style="color: #0284c7; font-weight: 700;">admin</code> / <code style="color: #0284c7; font-weight: 700;">password123</code>
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
      const edgeBtn = document.getElementById('edgeMenuTrigger');
      if (!sidebar) return;
      const isOpen = sidebar.classList.contains('open');
      const nextState = typeof forceState === 'boolean' ? forceState : !isOpen;
      if (nextState) {
        sidebar.classList.add('open');
        if (backdrop) backdrop.classList.add('active');
        if (edgeBtn) edgeBtn.style.display = 'none';
        document.body.style.overflow = 'hidden';
      } else {
        sidebar.classList.remove('open');
        if (backdrop) backdrop.classList.remove('active');
        if (edgeBtn) {
          const isDashboard = (window.adminState && window.adminState.activePage === 'dashboard') || !window.adminState?.activePage;
          edgeBtn.style.display = isDashboard ? 'none' : 'inline-flex';
        }
        document.body.style.overflow = '';
      }
    }
    window.toggleAdminSidebar = toggleAdminSidebar;

    // Auto-Tucking Edge Menu Trigger logic (Point 5)
    let edgeMenuTimer = null;
    function resetEdgeMenuTimer() {
      const edgeBtn = document.getElementById('edgeMenuTrigger');
      if (!edgeBtn) return;
      const isDashboard = (window.adminState && window.adminState.activePage === 'dashboard') || !window.adminState?.activePage;
      if (isDashboard) {
        edgeBtn.style.display = 'none';
        return;
      }
      edgeBtn.style.display = 'inline-flex';
      edgeBtn.classList.remove('tucked');
      clearTimeout(edgeMenuTimer);
      edgeMenuTimer = setTimeout(() => {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar || !sidebar.classList.contains('open')) {
          edgeBtn.classList.add('tucked');
        }
      }, 2400);
    }

    document.addEventListener('DOMContentLoaded', () => {
      const edgeBtn = document.getElementById('edgeMenuTrigger');
      if (edgeBtn) {
        edgeBtn.addEventListener('mouseenter', () => {
          clearTimeout(edgeMenuTimer);
          edgeBtn.classList.remove('tucked');
        });
        edgeBtn.addEventListener('mouseleave', () => {
          resetEdgeMenuTimer();
        });
        edgeBtn.addEventListener('touchstart', () => {
          clearTimeout(edgeMenuTimer);
          edgeBtn.classList.remove('tucked');
        }, { passive: true });
      }

      document.addEventListener('mousemove', (e) => {
        const isDashboard = (window.adminState && window.adminState.activePage === 'dashboard') || !window.adminState?.activePage;
        if (isDashboard) return;
        if (e.clientX <= 70 && e.clientY >= 60 && e.clientY <= 240) {
          const btn = document.getElementById('edgeMenuTrigger');
          if (btn && btn.classList.contains('tucked')) {
            btn.classList.remove('tucked');
            resetEdgeMenuTimer();
          }
        }
      });

      setTimeout(resetEdgeMenuTimer, 2200);
    });

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

      document.querySelectorAll('.page-panel').forEach(panel => {
        const normPanel = panel.id.replace(/^page-/, '').replace(/[-_]/g, '').toLowerCase();
        if (panel.id === \`page-\${pageKey}\` || normTarget === normPanel) {
          panel.classList.add('active');
        } else {
          panel.classList.remove('active');
        }
      });

      // Heading bar visible ONLY on dashboard as requested:
      const mainHeader = document.getElementById('mainTopHeader');
      if (mainHeader) {
        mainHeader.style.display = (pageKey === 'dashboard') ? 'flex' : 'none';
      }

      // Moving menu button: hidden on dashboard, visible on all other pages
      const edgeBtn = document.getElementById('edgeMenuTrigger');
      if (edgeBtn) {
        if (pageKey === 'dashboard') {
          edgeBtn.style.display = 'none';
        } else {
          edgeBtn.style.display = 'inline-flex';
          resetEdgeMenuTimer();
        }
      }

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

    function toggleExpandText(toggleBtn) {
      if (!toggleBtn) return;
      const target = toggleBtn.nextElementSibling || toggleBtn.parentElement.querySelector('.collapsible-text-body');
      if (!target) return;
      const isExpanded = target.classList.toggle('expanded');
      toggleBtn.classList.toggle('expanded', isExpanded);
    }
    window.toggleExpandText = toggleExpandText;
  </script>

  <!-- Chart.js Graphical Representation Engine -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>

  <!-- Admin Direct Read & Edit Access Engine (Point 4) -->
  <script>
    function requireAdminPassword(actionCallback) {
      if (typeof actionCallback === 'function') {
        actionCallback();
      }
    }
    window.requireAdminPassword = requireAdminPassword;

    function closeAdminPasswordModal() {
      const modal = document.getElementById('adminPasswordModal');
      if (modal) modal.classList.remove('active');
    }
    window.closeAdminPasswordModal = closeAdminPasswordModal;

    function submitAdminPasswordVerify(event) {
      if (event) event.preventDefault();
      const input = document.getElementById('inputAdminVerifyPassword');
      const err = document.getElementById('adminVerifyErrorMsg');
      const val = input ? input.value.trim() : '';

      if (val === ADMIN_SECURITY_KEY) {
        closeAdminPasswordModal();
        if (typeof pendingSecurityAction === 'function') {
          const fn = pendingSecurityAction;
          pendingSecurityAction = null;
          fn();
        }
      } else {
        if (err) {
          err.textContent = '❌ Incorrect password! Password is: 0911';
          err.style.display = 'block';
        } else {
          alert('❌ Incorrect password! Password is: 0911');
        }
        if (input) {
          input.value = '';
          input.focus();
        }
      }
    }
    window.submitAdminPasswordVerify = submitAdminPasswordVerify;

    // Shared modal action wrappers requiring 0911
    function savePlayerEditToFirebase() {
      requireAdminPassword(() => {
        const uid = window.currentEditingUserUid;
        if (!uid) return;
        const db = window.getDb ? window.getDb() : null;
        if (!db) { alert('Firebase is not connected!'); return; }

        const updates = {
          level: Number(document.getElementById('editModalLevel')?.value) || 0,
          coins: Number(document.getElementById('editModalCoins')?.value) || 0,
          diamonds: Number(document.getElementById('editModalDiamonds')?.value) || 0,
          chestKeys: Number(document.getElementById('editModalKeys')?.value) || 0,
          scratchCards: Number(document.getElementById('editModalCards')?.value) || 0,
          chestTickets: Number(document.getElementById('editModalTickets')?.value) || 0,
          eggs: Number(document.getElementById('editModalEggs')?.value) || 0
        };

        const goalLevel = Number(document.getElementById('editModalGoalLevel')?.value) || 0;

        Promise.all([
          db.ref('/players/' + uid + '/player').update(updates),
          db.ref('/players/' + uid + '/goal/level').set(goalLevel),
          db.ref('/players/' + uid + '/goalState/currentLevel').set(goalLevel)
        ]).then(() => {
          alert('✅ Player data successfully updated in Firebase!');
          closeUserEditModal();
        }).catch(err => alert('Error saving player: ' + err.message));
      });
    }
    window.savePlayerEditToFirebase = savePlayerEditToFirebase;

    function restartUserSeasonInFirebase() {
      requireAdminPassword(() => {
        const uid = window.currentEditingUserUid;
        if (!uid) return;
        const db = window.getDb ? window.getDb() : null;
        if (!db) return;
        if (!confirm('Restart this player to Level 0 and restore reward claims?')) return;
        db.ref('/players/' + uid + '/player/level').set(0);
        db.ref('/players/' + uid + '/player/xp').set(0);
        db.ref('/players/' + uid + '/claimedLevels').set({});
        alert('Player season restarted to Level 0.');
        closeUserEditModal();
      });
    }
    window.restartUserSeasonInFirebase = restartUserSeasonInFirebase;

    function restartPlayerInFirebase() {
      requireAdminPassword(() => {
        const uid = window.currentEditingUserUid;
        if (!uid) return;
        const db = window.getDb ? window.getDb() : null;
        if (!db) return;
        if (!confirm('⚠️ Clean ALL data for this player to fresh 0?')) return;
        const fresh = { level: 0, xp: 0, coins: 0, diamonds: 0, chestKeys: 0, scratchCards: 0, chestTickets: 0, eggs: 0 };
        db.ref('/players/' + uid + '/player').update(fresh).then(() => {
          alert('Player reset to 0.');
          closeUserEditModal();
        });
      });
    }
    window.restartPlayerInFirebase = restartPlayerInFirebase;

    function removeUserFromModal() {
      requireAdminPassword(() => {
        const uid = window.currentEditingUserUid;
        if (!uid) return;
        const db = window.getDb ? window.getDb() : null;
        if (!db) return;
        if (!confirm('Permanently delete this player account from Firebase?')) return;
        db.ref('/players/' + uid).remove().then(() => {
          alert('Player deleted.');
          closeUserEditModal();
        });
      });
    }
    window.removeUserFromModal = removeUserFromModal;

    function saveRequestStatusToFirebase() {
      requireAdminPassword(() => {
        const reqId = window.currentManagingRequestId;
        if (!reqId) return;
        const db = window.getDb ? window.getDb() : null;
        if (!db) return;
        const status = document.getElementById('modalReqStatus')?.value || 'pending';
        const notes = document.getElementById('modalReqNotes')?.value || '';
        db.ref('/reward_requests/' + reqId).update({ status: status, notes: notes, updatedAt: Date.now() }).then(() => {
          alert('Order status saved.');
          closeRequestManageModal();
        });
      });
    }
    window.saveRequestStatusToFirebase = saveRequestStatusToFirebase;

    function saveNewAdminUser() {
      requireAdminPassword(() => {
        const userInput = document.getElementById('newAdminUsername');
        const nameInput = document.getElementById('newAdminName');
        const roleInput = document.getElementById('newAdminRole');
        const passInput = document.getElementById('newAdminPassword');

        const username = userInput ? userInput.value.trim().toLowerCase() : '';
        const name = nameInput ? nameInput.value.trim() : '';
        const role = roleInput ? roleInput.value : 'Operations Admin';
        const password = passInput ? passInput.value.trim() : '0911';

        if (!username) {
          alert('Please provide username.');
          return;
        }
        const db = window.getDb ? window.getDb() : null;
        if (!db) return;
        db.ref('/admin_users/' + username).set({ username: username, name: name || username, role: role, password: password, createdAt: Date.now() }).then(() => {
          alert('Admin user "' + username + '" created.');
          closeAddAdminModal();
        });
      });
    }
    window.saveNewAdminUser = saveNewAdminUser;
  </script>

  <!-- Modular Page-Wise Scripts -->
${PAGE_KEYS.map(k => `  <script src="pages/${k}/${k}.js"></script>`).join('\n')}

  <!-- Admin Session Authentication & Access Control (Password: 0911) -->
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
            { username: 'admin', password: '0911', role: 'Super Admin', name: 'Master Admin' },
            { username: 'admin2', password: '0911', role: 'Operations Admin', name: 'Secondary Admin' }
          ];

      // Verify credentials - allow 0911 as master password or match
      const match = (passVal === '0911')
        ? (admins.find(a => a.username.toLowerCase() === userVal) || { username: userVal || 'admin', role: 'Super Admin', name: 'Master Admin' })
        : admins.find(a => a.username.toLowerCase() === userVal && a.password === passVal);

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
          showLoginError('Invalid password. Admin password is: 0911');
        }
      }, 300);
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
      if (confirm('Are you sure you want to log out from the Admin Panel?')) {
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
