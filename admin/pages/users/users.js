/* ==========================================================================
   PAGE: USERS LOGIC (pages/users/users.js)
   - Plain Minimal Users Table
   - Search & Realtime Counts
   - Admin Password Verification (0911) Protected Editing
   ========================================================================== */

let usersSearchQuery = '';
let editingPlayerUid = null;

function initUsersPage() {
  renderUsersTable();
}

window.addEventListener('usersUpdated', () => {
  renderUsersTable();
});

document.addEventListener('DOMContentLoaded', () => {
  renderUsersTable();
});

/**
 * Filter users table
 */
function filterUsersTable() {
  const input = document.getElementById('userSearchInput');
  usersSearchQuery = input ? input.value.trim().toLowerCase() : '';
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
 * Render plain users table
 */
function renderUsersTable() {
  const tbody = document.getElementById('usersTableBody');
  const countPill = document.getElementById('plainTotalUsersCount');
  if (!tbody) return;

  const users = (window.adminState && window.adminState.users) ? window.adminState.users : [];

  if (countPill) {
    countPill.textContent = `${users.length} Players`;
  }

  // Filter users
  const filtered = users.filter(u => {
    if (!usersSearchQuery) return true;
    const name = (u.username || '').toLowerCase();
    const code = (u.profileCode || '').toLowerCase();
    const tg = (u.telegram || '').toLowerCase();
    const uid = (u.uid || '').toLowerCase();
    return name.includes(usersSearchQuery) || code.includes(usersSearchQuery) || tg.includes(usersSearchQuery) || uid.includes(usersSearchQuery);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; color: #64748b; padding: 36px;">
          ${users.length === 0 ? 'No registered players found in Firebase.' : 'No players match your search.'}
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map((u, i) => {
    const coins = Number(u.coins || 0).toLocaleString();
    const diamonds = Number(u.diamonds || 0).toLocaleString();
    const level = Number(u.level || 0);
    const isRecentlyAdded = window.recentlyAddedUids && window.recentlyAddedUids.has(u.uid);

    return `
      <tr style="${isRecentlyAdded ? 'background: rgba(16, 185, 129, 0.05);' : ''}">
        <td style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #94a3b8;">${i + 1}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-weight: 700; color: #0f172a;">${u.username || 'User'}</span>
            ${isRecentlyAdded ? '<span style="background: #10b981; color: #ffffff; font-size: 9.5px; font-weight: 800; padding: 1.5px 6px; border-radius: 4px; letter-spacing: 0.5px;">NEW</span>' : ''}
          </div>
        </td>
        <td>
          <code style="background: #f1f5f9; padding: 2px 6px; border-radius: 5px; font-weight: 700; color: #0284c7; font-size: 11px;">
            ${u.profileCode || '-'}
          </code>
        </td>
        <td style="color: #64748b;">${u.telegram || '-'}</td>
        <td>
          <span style="display: inline-block; padding: 2px 8px; border-radius: 6px; background: rgba(2, 132, 199, 0.08); color: #0284c7; font-weight: 800; font-size: 11px;">
            Lv.${level}
          </span>
        </td>
        <td style="font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #ca8a04;">${coins}</td>
        <td style="font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #0891b2;">${diamonds}</td>
        <td style="text-align: right; white-space: nowrap;">
          <button type="button" onclick="viewUserDetails('${u.uid}')" style="margin-right: 6px; padding: 4px 10px; font-size: 11.5px; border-radius: 6px; background: rgba(2, 132, 199, 0.1); color: #0284c7; border: 1px solid rgba(2, 132, 199, 0.25); font-weight: 700; cursor: pointer;">
            Details
          </button>
          <button type="button" class="btn-plain-edit" onclick="handleEditPlayerClick('${u.uid}')">
            Edit
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
  if (nameEl) nameEl.textContent = u.username || 'Player';
  if (uidEl) uidEl.textContent = `UID: ${u.uid}`;
  if (avatarEl) avatarEl.textContent = (u.username || 'U').charAt(0).toUpperCase();

  // Summary pills
  const codeEl = document.getElementById('detailProfileCode');
  const lvlEl = document.getElementById('detailLevel');
  const goalEl = document.getElementById('detailGoalTier');
  const tgEl = document.getElementById('detailTelegram');
  if (codeEl) codeEl.textContent = u.profileCode || '-';
  if (lvlEl) lvlEl.textContent = `Lv.${u.level || 0} (${Number(u.xp || 0).toLocaleString()} XP)`;
  if (goalEl) goalEl.textContent = `Tier ${u.goalLevel || 0}`;
  if (tgEl) tgEl.textContent = u.telegram || u.handle || '-';

  // 6 Currencies
  if (document.getElementById('detailCoins')) document.getElementById('detailCoins').textContent = Number(u.coins || 0).toLocaleString();
  if (document.getElementById('detailDiamonds')) document.getElementById('detailDiamonds').textContent = Number(u.diamonds || 0).toLocaleString();
  if (document.getElementById('detailKeys')) document.getElementById('detailKeys').textContent = Number(u.chestKeys || 0).toLocaleString();
  if (document.getElementById('detailCards')) document.getElementById('detailCards').textContent = Number(u.scratchCards || 0).toLocaleString();
  if (document.getElementById('detailTickets')) document.getElementById('detailTickets').textContent = Number(u.chestTickets || 0).toLocaleString();
  if (document.getElementById('detailEggs')) document.getElementById('detailEggs').textContent = Number(u.eggs || 0).toLocaleString();

  // Tasks Quests
  if (document.getElementById('detailWebTasks')) document.getElementById('detailWebTasks').textContent = `${u.webDone || u.webTasksDone || 0} Done`;
  if (document.getElementById('detailTgTasks')) document.getElementById('detailTgTasks').textContent = `${u.tgDone || 0} Done`;
  if (document.getElementById('detailMonthlyTasks')) document.getElementById('detailMonthlyTasks').textContent = `${u.monthlyDone || 0} Done`;

  // Energy & Ads
  if (document.getElementById('detailEnergy')) document.getElementById('detailEnergy').textContent = `Energy: ${Number(u.currentEnergy || 1000).toLocaleString()} / ${Number(u.maxEnergy || 1000).toLocaleString()}`;
  if (document.getElementById('detailTapPower')) document.getElementById('detailTapPower').textContent = `Tap Power: ${u.tapPower || 1} | Total Taps: ${Number(u.countTaps || 0).toLocaleString()}`;
  if (document.getElementById('detailAdsWatched')) document.getElementById('detailAdsWatched').textContent = `${Number(u.adsWatched || u.adsButtonCount || 0).toLocaleString()} Ads Watched`;
  if (document.getElementById('detailLastActive')) document.getElementById('detailLastActive').textContent = `Last Active: ${u.lastActive ? new Date(u.lastActive).toLocaleString() : 'Recent'}`;

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
 * Handle Edit Player Click (Direct access given)
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
  const inpGoalLevel = document.getElementById('editModalGoalLevel');
  const inpCoins = document.getElementById('editModalCoins');
  const inpBlueCoins = document.getElementById('editModalBlueCoins');
  const inpDiamonds = document.getElementById('editModalDiamonds');
  const inpKeys = document.getElementById('editModalKeys');
  const inpCards = document.getElementById('editModalCards');
  const inpTickets = document.getElementById('editModalTickets');
  const inpEggs = document.getElementById('editModalEggs');
  const inpProfileCode = document.getElementById('editModalProfileCode');
  const inpTelegram = document.getElementById('editModalTelegram');

  if (nameEl) nameEl.textContent = `Edit Player: ${player.username} (${player.profileCode || uid.substring(0, 6)})`;
  if (inpProfileCode) inpProfileCode.value = player.profileCode || '-';
  if (inpTelegram) inpTelegram.value = player.telegram || player.handle || '-';

  if (inpLevel) inpLevel.value = player.level || 0;
  if (inpGoalLevel) inpGoalLevel.value = player.goalLevel || 0;
  if (inpCoins) inpCoins.value = player.coins || 0;
  if (inpBlueCoins) inpBlueCoins.value = player.blueCoins || 0;
  if (inpDiamonds) inpDiamonds.value = player.diamonds || 0;
  if (inpKeys) inpKeys.value = player.chestKeys || 0;
  if (inpCards) inpCards.value = player.scratchCards || 0;
  if (inpTickets) inpTickets.value = player.chestTickets || 0;
  if (inpEggs) inpEggs.value = player.eggs || 0;

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
 * Save Player Changes to Firebase (Requires Password 0911)
 */
function savePlayerEditToFirebase() {
  const uid = editingPlayerUid || window.currentEditingUserUid;
  if (!uid) return;

  const users = (window.adminState && window.adminState.users) ? window.adminState.users : [];
  const player = users.find(u => u.uid === uid);

  const executeSave = () => {
    const db = window.getDb ? window.getDb() : null;
    if (!db) {
      alert('Firebase is not connected!');
      return;
    }

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

    if (player && player.profileCode) {
      updates.profileCode = player.profileCode;
    }

    const goalLevel = Number(document.getElementById('editModalGoalLevel')?.value) || 0;

    Promise.all([
      db.ref(`/players/${uid}/player`).update(updates),
      db.ref(`/players/${uid}/goal/level`).set(goalLevel),
      db.ref(`/players/${uid}/goalState/currentLevel`).set(goalLevel)
    ])
    .then(() => {
      alert('✅ Player data successfully updated in Firebase!');
      closeUserEditModal();
    })
    .catch(err => {
      alert('Error saving player: ' + err.message);
    });
  };

  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(executeSave);
  } else {
    executeSave();
  }
}
window.savePlayerEditToFirebase = savePlayerEditToFirebase;

/**
 * Restart Player Season (Level 0)
 */
function restartUserSeasonInFirebase() {
  const uid = editingPlayerUid || window.currentEditingUserUid;
  if (!uid) return;

  const executeResetSeason = () => {
    const db = window.getDb ? window.getDb() : null;
    if (!db) return;

    if (!confirm('Restart this player to Level 0 and restore reward claims?')) return;

    db.ref(`/players/${uid}/player/level`).set(0);
    db.ref(`/players/${uid}/player/xp`).set(0);
    db.ref(`/players/${uid}/claimedLevels`).set({});
    alert('Player season restarted to Level 0.');
    closeUserEditModal();
  };

  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(executeResetSeason);
  } else {
    executeResetSeason();
  }
}
window.restartUserSeasonInFirebase = restartUserSeasonInFirebase;

/**
 * Full Reset Player
 */
function restartPlayerInFirebase() {
  const uid = editingPlayerUid || window.currentEditingUserUid;
  if (!uid) return;

  const executeFullReset = () => {
    const db = window.getDb ? window.getDb() : null;
    if (!db) return;

    if (!confirm('⚠️ Clean ALL data for this player to fresh 0?')) return;

    const fresh = {
      level: 0,
      xp: 0,
      coins: 0,
      diamonds: 0,
      chestKeys: 0,
      scratchCards: 0,
      chestTickets: 0,
      eggs: 0
    };

    db.ref(`/players/${uid}/player`).update(fresh)
      .then(() => {
        alert('Player reset to 0.');
        closeUserEditModal();
      });
  };

  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(executeFullReset);
  } else {
    executeFullReset();
  }
}
window.restartPlayerInFirebase = restartPlayerInFirebase;

/**
 * Remove Player
 */
function removeUserFromModal() {
  const uid = editingPlayerUid || window.currentEditingUserUid;
  if (!uid) return;

  const executeRemove = () => {
    const db = window.getDb ? window.getDb() : null;
    if (!db) return;

    if (!confirm('Permanently delete this player account from Firebase?')) return;

    db.ref(`/players/${uid}`).remove()
      .then(() => {
        alert('Player deleted.');
        closeUserEditModal();
      });
  };

  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(executeRemove);
  } else {
    executeRemove();
  }
}
window.removeUserFromModal = removeUserFromModal;
