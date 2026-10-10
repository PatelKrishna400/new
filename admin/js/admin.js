/**
 * ADMIN SPA ROUTER & UI CONTROLLER (admin/js/admin.js)
 * View switching, Sidebar navigation, Edge menu drawer, and Shared Admin UI handlers.
 */

// Edge Menu & Sidebar Drawer Controls
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
window.resetEdgeMenuTimer = resetEdgeMenuTimer;

function toggleAdminSidebar(forceState) {
  const sidebar = document.querySelector('.sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (!sidebar) return;

  const isOpen = (typeof forceState === 'boolean') ? forceState : !sidebar.classList.contains('open');
  sidebar.classList.toggle('open', isOpen);
  if (backdrop) backdrop.classList.toggle('open', isOpen);

  const edgeBtn = document.getElementById('edgeMenuTrigger');
  const arrow = document.getElementById('edgeMenuArrow');
  if (edgeBtn) {
    edgeBtn.classList.toggle('active', isOpen);
    if (arrow) arrow.textContent = isOpen ? '◂' : '▸';
    if (!isOpen) {
      resetEdgeMenuTimer();
    } else {
      clearTimeout(edgeMenuTimer);
      edgeBtn.classList.remove('tucked');
    }
  }
}
window.toggleAdminSidebar = toggleAdminSidebar;

// SPA View Switcher
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
    if (panel.id === `page-${pageKey}` || normTarget === normPanel) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });

  // Top header visibility
  const mainHeader = document.getElementById('mainTopHeader');
  if (mainHeader) {
    mainHeader.style.display = (pageKey === 'dashboard') ? 'flex' : 'none';
  }

  // Edge menu button visibility
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
    if (typeof window.renderMonthlyTasksUI === 'function') {
      window.renderMonthlyTasksUI();
    }
  } else if (normTarget === 'users') {
    if (typeof window.renderUsersTable === 'function') window.renderUsersTable();
    if (typeof window.updateDuplicateCountBadge === 'function') window.updateDuplicateCountBadge();
  } else if (normTarget === 'accountrequests') {
    if (typeof window.renderAccountRequestsTable === 'function') window.renderAccountRequestsTable();
  } else if (normTarget === 'megaadd') {
    if (typeof window.renderRewardsCatalog === 'function') window.renderRewardsCatalog();
    if (typeof window.renderCustomRequestsTable === 'function') window.renderCustomRequestsTable();
  } else if (normTarget === 'megarequest') {
    if (typeof window.renderRequestsTable === 'function') window.renderRequestsTable();
  } else if (normTarget === 'adsmanage') {
    if (typeof window.initAdsManagePage === 'function') window.initAdsManagePage();
  } else if (normTarget === 'firebasemanage') {
    if (typeof window.initFirebaseManagePage === 'function') window.initFirebaseManagePage();
  } else if (normTarget === 'dashboard') {
    if (typeof window.updateDashboardMetrics === 'function') window.updateDashboardMetrics();
    if (typeof window.refreshDashboardAnalytics === 'function') window.refreshDashboardAnalytics();
  }

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

// Password Protected Operations (Master PIN: 0911)
const ADMIN_SECURITY_KEY = '0911';
let pendingSecurityAction = null;

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

// Shared Modal Operations
function savePlayerEditToFirebase() {
  requireAdminPassword(async () => {
    const uid = window.currentEditingUserUid;
    if (!uid) return;
    const db = window.getDb ? window.getDb() : null;
    if (!db) { alert('Firebase is not connected!'); return; }

    const updates = {
      level: Number(document.getElementById('editModalLevel')?.value) || 0,
      xp: Number(document.getElementById('editModalXp')?.value) || 0,
      energy: Number(document.getElementById('editModalEnergy')?.value) || 0,
      currentEnergy: Number(document.getElementById('editModalEnergy')?.value) || 0,
      coins: Number(document.getElementById('editModalCoins')?.value) || 0,
      diamonds: Number(document.getElementById('editModalDiamonds')?.value) || 0,
      chestKeys: Number(document.getElementById('editModalKeys')?.value) || 0,
      scratchCards: Number(document.getElementById('editModalCards')?.value) || 0,
      chestTickets: Number(document.getElementById('editModalTickets')?.value) || 0,
      eggs: Number(document.getElementById('editModalEggs')?.value) || 0
    };

    const goalLevel = Number(document.getElementById('editModalGoalLevel')?.value) || 0;
    const status = document.getElementById('editModalStatus')?.value || 'active';

    try {
      if (typeof window.saveUserToFirebase === 'function') {
        await window.saveUserToFirebase(uid, updates, goalLevel, status);
      } else {
        await Promise.all([
          db.ref('/players/' + uid + '/player').update(updates),
          db.ref('/players/' + uid + '/reactor/currentEnergy').set(updates.energy),
          db.ref('/players/' + uid + '/goal/level').set(goalLevel),
          db.ref('/players/' + uid + '/goalState/currentLevel').set(goalLevel),
          db.ref('/players/' + uid + '/progression/activeLevel').set(updates.level || 1),
          db.ref('/players/' + uid + '/status').set(status),
          db.ref('/players/' + uid + '/player/status').set(status),
          db.ref('/players/' + uid + '/resetVersion').set(8),
          db.ref('/players/' + uid + '/updatedAt').set(Date.now())
        ]);
        if (typeof window.logActivity === 'function') {
          window.logActivity('Player Updated', 'Admin updated user data for ' + uid, '👤');
        }
      }
      alert('✅ Player data successfully updated in Firebase!');
      closeUserEditModal();
      if (typeof renderUsersTable === 'function') renderUsersTable();
    } catch (err) {
      alert('Error saving player: ' + err.message);
    }
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

function deleteUserFromModal() {
  const uid = window.currentEditingUserUid || window.editingPlayerUid;
  if (!uid) return;
  if (typeof window.confirmDeleteUser === 'function') {
    window.confirmDeleteUser(uid);
  } else if (typeof window.deleteUserFromFirebase === 'function') {
    requireAdminPassword(() => {
      if (!confirm('⚠️ Permanently delete this player account and activity from Firebase?')) return;
      window.deleteUserFromFirebase(uid).then(() => {
        alert('✅ Player account and activity deleted from Firebase.');
        closeUserEditModal();
        if (typeof renderUsersTable === 'function') renderUsersTable();
      }).catch(err => alert('Error: ' + err.message));
    });
  }
}
window.deleteUserFromModal = deleteUserFromModal;
window.removeUserFromModal = deleteUserFromModal;

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
    db.ref('/admin_users/' + username).set({ username, name: name || username, role, password, createdAt: Date.now() }).then(() => {
      alert('Admin user "' + username + '" created.');
      closeAddAdminModal();
    });
  });
}
window.saveNewAdminUser = saveNewAdminUser;

function showAdminToast(msg, type = 'info') {
  let toastContainer = document.getElementById('adminToastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'adminToastContainer';
    toastContainer.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 99999; display: flex; flex-direction: column; gap: 8px; pointer-events: none;';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const bg = type === 'success' ? '#10b981' : (type === 'error' ? '#ef4444' : '#0284c7');
  toast.style.cssText = `pointer-events: auto; background: #0f172a; border-left: 4px solid ${bg}; color: #ffffff; padding: 10px 16px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.25); font-size: 13px; font-weight: 600;`;
  toast.textContent = msg;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 350);
  }, 3500);
}
window.showAdminToast = showAdminToast;

// Lifecycle Initializer
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

  if (typeof initFirebase === 'function') {
    initFirebase();
  }
});
