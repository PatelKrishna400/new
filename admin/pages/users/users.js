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
    tbody.innerHTML = `<tr><td colspan="11" style="text-align: center; color: #64748b; padding: 24px;">No players found in Firebase.</td></tr>`;
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
        <td style="color: #10b981; font-weight: 800; font-family: 'JetBrains Mono', monospace;">${Number(u.eggs || 0)} 🥚</td>
        <td style="text-align: center; white-space: nowrap;">
          <div style="display: inline-flex; gap: 6px;">
            <button onclick="openUserEditModal('${u.uid}')" class="btn-primary" style="padding: 4px 10px; font-size: 11px;">✏️ Edit</button>
            <button onclick="restartUserSeasonInFirebase('${u.uid}', '${u.username}')" class="btn-secondary" style="padding: 4px 8px; font-size: 11px; color: #38bdf8; border-color: rgba(56, 189, 248, 0.4);" title="Restart Season & Level Claims for this User">🌟</button>
            <button onclick="restartPlayerInFirebase('${u.uid}', '${u.username}')" class="btn-secondary" style="padding: 4px 8px; font-size: 11px; color: #fbbf24; border-color: rgba(245, 158, 11, 0.4);" title="Restart Player (Clean All Stats to 0)">🔄</button>
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
  if (document.getElementById('editModalEggs')) {
    document.getElementById('editModalEggs').value = u.eggs || 0;
  }

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
  const eggs = document.getElementById('editModalEggs') ? (Number(document.getElementById('editModalEggs').value) || 0) : 0;

  const updates = {};
  updates[`/players/${uid}/player/level`] = xpLevel;
  updates[`/players/${uid}/player/coins`] = coins;
  updates[`/players/${uid}/player/diamonds`] = diamonds;
  updates[`/players/${uid}/player/chestKeys`] = keys;
  updates[`/players/${uid}/player/scratchCards`] = cards;
  updates[`/players/${uid}/player/chestTickets`] = tickets;
  updates[`/players/${uid}/player/eggs`] = eggs;
  updates[`/players/${uid}/player/lastActive`] = new Date().toISOString();
  updates[`/players/${uid}/goal/level`] = goalLevel;
  updates[`/players/${uid}/goalState/currentLevel`] = goalLevel;
  updates[`/players/${uid}/xpState/currentLevel`] = xpLevel;

  db.ref().update(updates).then(() => {
    closeUserEditModal();
    alert('Player stats updated successfully in Firebase!');
  }).catch(err => alert('Error saving to Firebase: ' + err.message));
}

function restartPlayerInFirebase(uid, uname) {
  const db = window.getDb ? window.getDb() : null;
  const targetUid = uid || editingUserUid;
  if (!targetUid || !db) return;

  const user = (window.adminState.users || []).find(u => u.uid === targetUid);
  const username = uname || (user ? user.username : 'this player');

  if (!confirm(`⚠️ Are you sure you want to RESTART ${username} to 0?\n\nThis will keep the SAME user account in Firebase, but completely clean and reset all their stats (Level, Goal, Coins, Diamonds, Keys, Cards, Tickets, Tasks, and Energy) to fresh 0 starting values!`)) {
    return;
  }

  // Same user account in Firebase, but clean all data nodes to fresh starting 0 values
  const cleanPlayerData = {
    player: {
      uid: targetUid,
      username: username,
      name: username,
      level: 0,
      xp: 0,
      xpToNextLevel: 1000,
      coins: 0,
      diamonds: 0,
      chestKeys: 0,
      scratchCards: 0,
      chestTickets: 0,
      eggs: 0,
      streakDays: 0,
      adsWatchedCount: 0,
      websiteTasksCompleted: 0,
      lastActive: new Date().toISOString()
    },
    goal: {
      level: 0,
      currentCoins: 0,
      currentKeys: 0,
      currentTickets: 0
    },
    goalState: {
      currentLevel: 0,
      levelAdsWatched: 0,
      megaWatchedAds: 0,
      levelProgress: { cards: 0, keys: 0, tickets: 0 },
      megaRewardClaimed: false,
      grandChestClaimed: false,
      claimedGoals: {},
      seasonEndMs: Date.now() + 30 * 24 * 3600 * 1000
    },
    tasksState: {
      claimedDaily: {},
      claimedTelegram: {},
      claimedWebsite: {},
      failedWebsite: {},
      openedWebsite: {}
    },
    dailyStats: {
      taps: 0,
      adsWatched: 0,
      spins: 0,
      chests: 0,
      scratches: 0,
      eggs: 0,
      wheelSpins: 0,
      chestsOpened: 0,
      eggCoins: 0,
      greenTaps: 0,
      darkGreenTaps: 0,
      yellowTaps: 0,
      resetTimestamp: Date.now()
    },
    xpState: {
      currentLevel: 0,
      currentXP: 0,
      watchedAds: 0,
      megaRewardClaimed: false,
      claimedLevels: {},
      seasonEndMs: Date.now() + 30 * 24 * 3600 * 1000
    },
    reactor: {
      currentEnergy: 0,
      energyTaps: 0,
      maxEnergy: 1000
    },
    energyGenerator: {
      currentTankEnergy: 0,
      boosts: {
        pink: { activeRemainingSeconds: 0, cooldownRemainingSeconds: 0, adsWatched: 0, multiplier: 2 },
        purple: { activeRemainingSeconds: 0, cooldownRemainingSeconds: 0, adsWatched: 0, multiplier: 5 }
      }
    }
  };

  // .set() completely cleans all residual data under the same user UID
  db.ref(`/players/${targetUid}`).set(cleanPlayerData).then(() => {
    closeUserEditModal();
    alert(`🔄 Player "${username}" data successfully cleaned and restarted to 0!`);
  }).catch(err => alert('Error restarting player in Firebase: ' + err.message));
}

function restartUserSeasonInFirebase(uid, uname) {
  const targetUid = uid || editingUserUid;
  if (!targetUid) return;

  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    alert('Firebase is not connected!');
    return;
  }

  const user = (window.adminState.users || []).find(u => u.uid === targetUid);
  const username = uname || (user ? user.username : 'this player');

  if (!confirm(`🌟 Restart Season & Restore Level Rewards for "${username}"?\n\nThis will restore this user's XP & Goal level progression to Level 0, clear all claimed level rewards, and give them a fresh 30-day season cycle so they can climb and claim all rewards level-wise again.\n(Their coins, diamonds, and inventory will be kept safe!)`)) {
    return;
  }

  const now = Date.now();
  const seasonEnd = now + 30 * 24 * 3600 * 1000;

  const updates = {};
  updates[`/players/${targetUid}/player/level`] = 0;
  updates[`/players/${targetUid}/player/xp`] = 0;
  updates[`/players/${targetUid}/player/xpToNextLevel`] = 1000;
  updates[`/players/${targetUid}/xpState`] = {
    currentLevel: 0,
    currentXP: 0,
    watchedAds: 0,
    megaRewardClaimed: false,
    claimedLevels: {},
    seasonEndMs: seasonEnd
  };
  updates[`/players/${targetUid}/goalState`] = {
    currentLevel: 0,
    levelAdsWatched: 0,
    megaWatchedAds: 0,
    levelProgress: { cards: 0, keys: 0, tickets: 0 },
    megaRewardClaimed: false,
    grandChestClaimed: false,
    claimedGoals: {},
    seasonEndMs: seasonEnd
  };
  updates[`/players/${targetUid}/goal`] = {
    level: 0,
    currentCoins: 0,
    currentKeys: 0,
    currentTickets: 0
  };

  db.ref().update(updates).then(() => {
    if (editingUserUid === targetUid) {
      closeUserEditModal();
    }
    alert(`🌟 Season and level rewards successfully restored for "${username}"! They can now claim from Level 0 again.`);
  }).catch(err => alert('Error resetting user season: ' + err.message));
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
    if (editingUserUid === uid) {
      closeUserEditModal();
    }
    alert(`Player "${username || uid}" removed from Firebase!`);
  }).catch(err => alert('Error removing player: ' + err.message));
}

function removeUserFromModal() {
  if (!editingUserUid) return;
  const user = (window.adminState.users || []).find(u => u.uid === editingUserUid);
  removeUserFromFirebase(editingUserUid, user ? user.username : '');
}

window.renderUsersTable = renderUsersTable;
window.filterUsersTable = filterUsersTable;
window.openUserEditModal = openUserEditModal;
window.closeUserEditModal = closeUserEditModal;
window.savePlayerEditToFirebase = savePlayerEditToFirebase;
window.restartPlayerInFirebase = restartPlayerInFirebase;
window.restartUserSeasonInFirebase = restartUserSeasonInFirebase;
window.removeUserFromFirebase = removeUserFromFirebase;
window.removeUserFromModal = removeUserFromModal;

