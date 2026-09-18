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

/**
 * Filter users table
 */
function filterUsersTable() {
  const searchInput = document.getElementById('userSearchInput');
  const filterSelect = document.getElementById('userStatusFilter');

  usersSearchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';
  userStatusFilter = filterSelect ? filterSelect.value : 'all';

  renderUsersTable();
}
window.filterUsersTable = filterUsersTable;

function clearUserSearch() {
  const input = document.getElementById('userSearchInput');
  if (input) input.value = '';
  usersSearchQuery = '';
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
  const inpBlueCoins = document.getElementById('editModalBlueCoins');
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
  if (inpBlueCoins) inpBlueCoins.value = player.blueCoins || 0;
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
    blueCoins: Number(document.getElementById('editModalBlueCoins')?.value) || 0,
    diamonds: Number(document.getElementById('editModalDiamonds')?.value) || 0,
    chestKeys: Number(document.getElementById('editModalKeys')?.value) || 0,
    scratchCards: Number(document.getElementById('editModalCards')?.value) || 0,
    chestTickets: Number(document.getElementById('editModalTickets')?.value) || 0,
    eggs: Number(document.getElementById('editModalEggs')?.value) || 0
  };

  const xpVal = document.getElementById('editModalXp')?.value;
  if (xpVal !== undefined && xpVal !== '') updates.xp = Number(xpVal) || 0;

  const energyVal = document.getElementById('editModalEnergy')?.value;
  if (energyVal !== undefined && energyVal !== '') updates.currentEnergy = Number(energyVal) || 1000;

  const statusVal = document.getElementById('editModalStatus')?.value;
  if (statusVal) updates.status = statusVal;

  const goalLevel = Number(document.getElementById('editModalGoalLevel')?.value) || 0;

  if (typeof window.saveUserToFirebase === 'function') {
    window.saveUserToFirebase(uid, updates)
      .then(() => {
        const db = window.getDb ? window.getDb() : null;
        if (db) {
          db.ref(`/players/${uid}/goal/level`).set(goalLevel);
          db.ref(`/players/${uid}/goalState/currentLevel`).set(goalLevel);
        }
        alert('✅ Player data successfully updated in Firebase!');
        closeUserEditModal();
        renderUsersTable();
      })
      .catch(err => {
        alert('Error saving player: ' + err.message);
      });
  } else {
    const db = window.getDb ? window.getDb() : null;
    if (!db) { alert('Firebase is not connected!'); return; }
    Promise.all([
      db.ref(`/players/${uid}/player`).update(updates),
      db.ref(`/players/${uid}/goal/level`).set(goalLevel),
      db.ref(`/players/${uid}/goalState/currentLevel`).set(goalLevel)
    ]).then(() => {
      alert('✅ Player data successfully updated in Firebase!');
      closeUserEditModal();
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
  const player = users.find(u => u.uid === uid);
  const name = player ? (player.name || player.username) : uid;

  if (!confirm(`⚠️ PERMANENT ACTION:\nAre you sure you want to permanently DELETE user "${name}" (${uid}) from Firebase?\nAll coins, progress, and inventory will be removed. This cannot be undone.`)) {
    return;
  }

  if (typeof window.deleteUserFromFirebase === 'function') {
    window.deleteUserFromFirebase(uid)
      .then(() => {
        alert(`✅ Player "${name}" deleted from Firebase.`);
        closeUserDetailsModal();
        closeUserEditModal();
        renderUsersTable();
      })
      .catch(err => alert('Error deleting player: ' + err.message));
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
 * Remove Player from modal
 */
function removeUserFromModal() {
  const uid = editingPlayerUid || window.currentEditingUserUid;
  if (!uid) return;
  confirmDeleteUser(uid);
}
window.removeUserFromModal = removeUserFromModal;

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

function openAddPlayerModal() {
  const modal = document.getElementById('addUserModal');
  if (modal) {
    modal.classList.add('active');
    modal.classList.add('open');
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
      blueCoins: diamonds,
      chestKeys: keys,
      scratchCards: cards,
      chestTickets: tickets,
      eggs: eggs,
      currentEnergy: 1000,
      maxEnergy: 1000,
      tapPower: 1,
      energyTaps: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      joinedAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
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

      // Open details modal automatically for the new user
      setTimeout(() => {
        viewUserDetails(newUid);
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

