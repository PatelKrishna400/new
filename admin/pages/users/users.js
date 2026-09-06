/* ==========================================================================
   PAGE: USERS LOGIC (pages/users/users.js)
   - Edit: XP Level, Goal Level, Coin, Diamond, Keys, Card, Ticket
   - Restart Player Button (Reset to 0 in Firebase)
   - Remove / Delete User Button for each user row
   ========================================================================== */

let editingUserUid = null;

window.addEventListener('usersUpdated', () => {
  renderUsersTable();
});

document.addEventListener('DOMContentLoaded', () => {
  renderUsersTable();
});

function renderUsersTable() {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  const users = window.adminState.users || [];
  const q = (document.getElementById('userSearchInput')?.value || '').toLowerCase().trim();
  const filtered = users.filter(u => {
    return (u.username || '').toLowerCase().includes(q) || (u.uid || '').toLowerCase().includes(q);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: #64748b; padding: 24px;">No players found in Firebase.</td></tr>`;
    return;
  }

  let html = '';
  filtered.forEach((u, i) => {
    html += `
      <tr>
        <td style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #64748b;">#${i + 1}</td>
        <td>
          <div style="font-weight: 800; color: #f8fafc;">${u.username}</div>
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #64748b;">${u.uid ? u.uid.substring(0, 12) + '...' : ''}</div>
        </td>
        <td><span style="color: #38bdf8; font-weight: 800; font-family: 'JetBrains Mono', monospace;">Lv.${u.level || 0}</span></td>
        <td><span style="color: #60a5fa; font-weight: 800; font-family: 'JetBrains Mono', monospace;">G-Lv.${u.goalLevel || 0}</span></td>
        <td style="color: #fbbf24; font-weight: 800; font-family: 'JetBrains Mono', monospace;">${Number(u.coins || 0).toLocaleString()} 🪙</td>
        <td style="color: #22d3ee; font-weight: 800; font-family: 'JetBrains Mono', monospace;">${Number(u.diamonds || 0).toLocaleString()} 💎</td>
        <td style="color: #a855f7; font-weight: 800; font-family: 'JetBrains Mono', monospace;">${Number(u.chestKeys || 0)} 🗝️</td>
        <td style="color: #ec4899; font-weight: 800; font-family: 'JetBrains Mono', monospace;">${Number(u.scratchCards || 0)} 🎴</td>
        <td style="color: #f59e0b; font-weight: 800; font-family: 'JetBrains Mono', monospace;">${Number(u.chestTickets || 0)} 🎟️</td>
        <td style="text-align: center; white-space: nowrap;">
          <div style="display: inline-flex; gap: 6px;">
            <button onclick="openUserEditModal('${u.uid}')" class="btn-primary" style="padding: 4px 10px; font-size: 11px;">✏️ Edit</button>
            <button onclick="removeUserFromFirebase('${u.uid}', '${u.username}')" class="btn-secondary" style="padding: 4px 8px; font-size: 11px; color: #f87171; border-color: rgba(239, 68, 68, 0.4);" title="Remove Player">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

function filterUsersTable() {
  renderUsersTable();
}

function openUserEditModal(uid) {
  const users = window.adminState.users || [];
  const u = users.find(x => x.uid === uid);
  if (!u) return;
  editingUserUid = uid;

  document.getElementById('editModalPlayerName').textContent = `Edit Player: ${u.username}`;
  document.getElementById('editModalLevel').value = u.level || 0;
  document.getElementById('editModalGoalLevel').value = u.goalLevel || 0;
  document.getElementById('editModalCoins').value = u.coins || 0;
  document.getElementById('editModalDiamonds').value = u.diamonds || 0;
  document.getElementById('editModalKeys').value = u.chestKeys || 0;
  document.getElementById('editModalCards').value = u.scratchCards || 0;
  document.getElementById('editModalTickets').value = u.chestTickets || 0;

  document.getElementById('userEditModal').classList.add('open');
}

function closeUserEditModal() {
  document.getElementById('userEditModal').classList.remove('open');
  editingUserUid = null;
}

function savePlayerEditToFirebase() {
  const db = window.getDb ? window.getDb() : null;
  if (!editingUserUid || !db) return;
  const uid = editingUserUid;

  const xpLevel = Number(document.getElementById('editModalLevel').value) || 0;
  const goalLevel = Number(document.getElementById('editModalGoalLevel').value) || 0;
  const coins = Number(document.getElementById('editModalCoins').value) || 0;
  const diamonds = Number(document.getElementById('editModalDiamonds').value) || 0;
  const keys = Number(document.getElementById('editModalKeys').value) || 0;
  const cards = Number(document.getElementById('editModalCards').value) || 0;
  const tickets = Number(document.getElementById('editModalTickets').value) || 0;

  const updates = {};
  updates[`/players/${uid}/player/level`] = xpLevel;
  updates[`/players/${uid}/player/coins`] = coins;
  updates[`/players/${uid}/player/diamonds`] = diamonds;
  updates[`/players/${uid}/player/chestKeys`] = keys;
  updates[`/players/${uid}/player/scratchCards`] = cards;
  updates[`/players/${uid}/player/chestTickets`] = tickets;
  updates[`/players/${uid}/goal/level`] = goalLevel;
  updates[`/players/${uid}/goalState/currentLevel`] = goalLevel;

  db.ref().update(updates).then(() => {
    closeUserEditModal();
    alert('Player stats updated successfully in Firebase!');
  }).catch(err => alert('Error saving to Firebase: ' + err.message));
}

function restartPlayerInFirebase(uid) {
  const db = window.getDb ? window.getDb() : null;
  const targetUid = uid || editingUserUid;
  if (!targetUid || !db) return;

  const user = (window.adminState.users || []).find(u => u.uid === targetUid);
  const username = user ? user.username : 'this player';

  if (!confirm(`⚠️ Are you sure you want to RESTART ${username}?\nAll Coins, Diamonds, Keys, Cards, Tickets, XP, and Goal levels will be reset to 0 in Firebase!`)) {
    return;
  }

  const resetUpdates = {};
  resetUpdates[`/players/${targetUid}/player/level`] = 0;
  resetUpdates[`/players/${targetUid}/player/xp`] = 0;
  resetUpdates[`/players/${targetUid}/player/coins`] = 0;
  resetUpdates[`/players/${targetUid}/player/diamonds`] = 0;
  resetUpdates[`/players/${targetUid}/player/chestKeys`] = 0;
  resetUpdates[`/players/${targetUid}/player/scratchCards`] = 0;
  resetUpdates[`/players/${targetUid}/player/chestTickets`] = 0;
  resetUpdates[`/players/${targetUid}/player/streakDays`] = 0;
  resetUpdates[`/players/${targetUid}/goal/level`] = 0;
  resetUpdates[`/players/${targetUid}/goal/currentCoins`] = 0;
  resetUpdates[`/players/${targetUid}/goal/currentKeys`] = 0;
  resetUpdates[`/players/${targetUid}/goal/currentTickets`] = 0;
  resetUpdates[`/players/${targetUid}/goalState/currentLevel`] = 0;
  resetUpdates[`/players/${targetUid}/goalState/claimedGoals`] = {};
  resetUpdates[`/players/${targetUid}/tasksState/claimedDaily`] = {};
  resetUpdates[`/players/${targetUid}/tasksState/claimedWebsite`] = {};
  resetUpdates[`/players/${targetUid}/reactor/currentEnergy`] = 0;
  resetUpdates[`/players/${targetUid}/reactor/energyTaps`] = 0;

  db.ref().update(resetUpdates).then(() => {
    closeUserEditModal();
    alert(`🔄 Player ${username} has been successfully restarted to 0!`);
  }).catch(err => alert('Error restarting player in Firebase: ' + err.message));
}

function removeUserFromFirebase(uid, username) {
  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    alert('Firebase is not connected!');
    return;
  }

  if (!confirm(`🗑️ Are you sure you want to permanently REMOVE player "${username || uid}" from Firebase?`)) {
    return;
  }

  db.ref(`/players/${uid}`).remove().then(() => {
    alert(`Player "${username || uid}" removed from Firebase!`);
  }).catch(err => alert('Error removing player: ' + err.message));
}

window.renderUsersTable = renderUsersTable;
window.filterUsersTable = filterUsersTable;
window.openUserEditModal = openUserEditModal;
window.closeUserEditModal = closeUserEditModal;
window.savePlayerEditToFirebase = savePlayerEditToFirebase;
window.restartPlayerInFirebase = restartPlayerInFirebase;
window.removeUserFromFirebase = removeUserFromFirebase;
