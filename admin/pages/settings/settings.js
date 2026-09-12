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
}

function triggerMonthlyCompetitionReset() {
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
              <strong style="color: #fff; font-size: 13px;">${escapeHtmlSettings(adm.name || adm.username)}</strong>
              ${isSelf ? `<span style="margin-left: 6px; font-size: 10px; background: rgba(56, 189, 248, 0.2); color: #38bdf8; padding: 2px 6px; border-radius: 10px;">You</span>` : ''}
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
}

function changeAdminPassword(username) {
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
}

function deleteAdminUser(username) {
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
}

window.renderAdminTeamUI = renderAdminTeamUI;
window.openAddAdminModal = openAddAdminModal;
window.closeAddAdminModal = closeAddAdminModal;
window.saveNewAdminUser = saveNewAdminUser;
window.changeAdminPassword = changeAdminPassword;
window.deleteAdminUser = deleteAdminUser;

window.addEventListener('adminUsersUpdated', renderAdminTeamUI);


