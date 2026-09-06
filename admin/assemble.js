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

  <!-- Permanent Left Vertical Menu Bar (Never Hides) -->
  <aside class="sidebar">
    <div class="sidebar-brand">
      <div class="brand-icon">⚡</div>
      <div>
        <div class="brand-title">ENERGY TAP</div>
        <div class="brand-subtitle">ADMIN DASHBOARD</div>
      </div>
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

      <div class="nav-section-label" style="margin-top: 12px;">Management & System</div>

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

  <!-- Main Content Workspace (Always beside the permanent menu bar) -->
  <main class="main-content">
    <header class="top-header">
      <div class="header-left">
        <h1 class="page-title" id="activeHeaderTitle">Dashboard Overview</h1>
      </div>
      <div class="header-right">
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
        <div class="form-group" style="grid-column: 1 / -1;">
          <label class="form-label">Tickets 🎟️</label>
          <input type="number" id="editModalTickets" class="form-input" style="color: #f59e0b; font-weight: 800;">
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 6px;">
        <div style="display: flex; gap: 10px;">
          <button onclick="savePlayerEditToFirebase()" class="btn-primary" style="flex: 1;">Save Changes</button>
          <button onclick="closeUserEditModal()" class="btn-secondary">Cancel</button>
        </div>
        <div style="display: flex; gap: 10px;">
          <button onclick="restartPlayerInFirebase()" class="btn-secondary" style="flex: 1; color: #fbbf24; border-color: rgba(245, 158, 11, 0.4); text-align: center; justify-content: center; display: flex; align-items: center; gap: 6px;">
            🔄 Restart to 0 (Clean Data)
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

  <!-- Firebase Cloud SDKs -->
  <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js"></script>

  <!-- Shared Firebase Service -->
  <script src="shared/firebase.js"></script>

  <!-- Global Router Logic -->
  <script>
    function switchAdminPage(pageKey, pageTitle) {
      if (window.adminState) window.adminState.activePage = pageKey;

      document.querySelectorAll('.nav-item').forEach(item => {
        if (item.getAttribute('data-page') === pageKey) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });

      const titleEl = document.getElementById('activeHeaderTitle');
      if (titleEl) titleEl.textContent = pageTitle;

      document.querySelectorAll('.page-panel').forEach(panel => {
        if (panel.id === \`page-\${pageKey}\`) {
          panel.classList.add('active');
        } else {
          panel.classList.remove('active');
        }
      });

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.switchAdminPage = switchAdminPage;
  </script>

  <!-- Modular Page-Wise Scripts -->
${PAGE_KEYS.map(k => `  <script src="pages/${k}/${k}.js"></script>`).join('\n')}

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
