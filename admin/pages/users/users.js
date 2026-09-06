/* ==========================================================================
   PAGE: USERS LOGIC (pages/users/users.js)
   ========================================================================== */

let editingUserUid = null;

window.addEventListener('usersUpdated', () => {
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
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #64748b; padding: 24px;">No players found in Firebase.</td></tr>`;
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
        <td><span style="color: #38bdf8; font-weight: 800;">Lv.${u.level}</span></td>
        <td style="color: #fbbf24; font-weight: 800;">${Number(u.coins).toLocaleString()} 🪙</td>
        <td style="color: #22d3ee; font-weight: 800;">${Number(u.diamonds).toLocaleString()} 💎</td>
        <td style="color: #a855f7; font-weight: 800;">${Number(u.chestKeys)} 🗝️</td>
        <td style="color: #ec4899; font-weight: 800;">${Number(u.scratchCards)} 🎴</td>
        <td><span style="color: #34d399; font-weight: 700;">${u.tasksCount} done</span></td>
        <td>
          <button onclick="openUserEditModal('${u.uid}')" class="btn-primary" style="padding: 5px 12px; font-size: 11px;">Edit Profile</button>
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
  document.getElementById('editModalCoins').value = u.coins || 0;
  document.getElementById('editModalDiamonds').value = u.diamonds || 0;
  document.getElementById('editModalKeys').value = u.chestKeys || 0;
  document.getElementById('editModalCards').value = u.scratchCards || 0;
  document.getElementById('editModalLevel').value = u.level || 1;

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
  const coins = Number(document.getElementById('editModalCoins').value) || 0;
  const diamonds = Number(document.getElementById('editModalDiamonds').value) || 0;
  const keys = Number(document.getElementById('editModalKeys').value) || 0;
  const cards = Number(document.getElementById('editModalCards').value) || 0;
  const level = Number(document.getElementById('editModalLevel').value) || 1;

  db.ref(`/players/${uid}/player`).update({
    coins,
    diamonds,
    chestKeys: keys,
    scratchCards: cards,
    level
  }).then(() => {
    closeUserEditModal();
    alert('Player profile updated in Firebase!');
  }).catch(err => alert('Error saving to Firebase: ' + err.message));
}

window.renderUsersTable = renderUsersTable;
window.filterUsersTable = filterUsersTable;
window.openUserEditModal = openUserEditModal;
window.closeUserEditModal = closeUserEditModal;
window.savePlayerEditToFirebase = savePlayerEditToFirebase;
