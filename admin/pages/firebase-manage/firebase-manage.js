/* ==========================================================================
   PAGE: FIREBASE MANAGE LOGIC (pages/firebase-manage/firebase-manage.js)
   ========================================================================== */

function initFirebaseManagePage() {
  updateNodeCounts();
  testFirebasePing();
}

window.addEventListener('usersUpdated', updateNodeCounts);
window.addEventListener('rewardsUpdated', updateNodeCounts);
window.addEventListener('requestsUpdated', updateNodeCounts);
window.addEventListener('websiteTasksUpdated', updateNodeCounts);

function updateNodeCounts() {
  const users = window.adminState.users || [];
  const rewards = window.adminState.rewards || [];
  const requests = window.adminState.requests || [];
  const tasks = window.adminState.websiteTasks || [];
  const tgTasks = window.adminState.telegramTasks || [];

  const elP = document.getElementById('fbPlayersCount');
  const elR = document.getElementById('fbRewardsCount');
  const elReq = document.getElementById('fbRequestsCount');
  const elT = document.getElementById('fbTasksCount');
  const elTg = document.getElementById('fbTgTasksCount');

  if (elP) elP.textContent = `${users.length} registered`;
  if (elR) elR.textContent = `${rewards.length} items`;
  if (elReq) elReq.textContent = `${requests.length} orders`;
  if (elT) elT.textContent = `${tasks.length} quests`;
  if (elTg) elTg.textContent = `${tgTasks.length} tasks`;
}

// ==========================================================================
// DIRECT FIREBASE NODE READING & WRITING ENGINE
// ==========================================================================
function readSelectedFirebaseNode() {
  const select = document.getElementById('selectFirebaseNodePath');
  const editor = document.getElementById('firebaseNodeEditor');
  const status = document.getElementById('fbNodeReadStatus');
  if (!select || !editor) return;

  const path = select.value;
  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    if (status) status.textContent = '❌ Firebase is offline';
    return;
  }

  if (status) status.textContent = `⏳ Reading from Firebase (${path})...`;

  db.ref(path).once('value')
    .then(snapshot => {
      const val = snapshot.val();
      editor.value = JSON.stringify(val, null, 2);
      if (status) {
        status.textContent = `✅ Read successfully at ${new Date().toLocaleTimeString()} (Path: ${path})`;
      }
    })
    .catch(err => {
      if (status) status.textContent = `❌ Read error: ${err.message}`;
      console.error('Firebase read error:', err);
    });
}

function writeSelectedFirebaseNode() {
  const select = document.getElementById('selectFirebaseNodePath');
  const editor = document.getElementById('firebaseNodeEditor');
  const status = document.getElementById('fbNodeReadStatus');
  if (!select || !editor) return;

  const path = select.value;
  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    alert('Firebase is not connected!');
    return;
  }

  let parsedData;
  try {
    parsedData = JSON.parse(editor.value);
  } catch (err) {
    alert('⚠️ Invalid JSON format: ' + err.message);
    return;
  }

  const isGlobalStatic = path.startsWith('/game_config') || path.startsWith('/website_tasks') || path.startsWith('/telegram_tasks') || path.startsWith('/monthly_competition') || path.startsWith('/ads_config') || path.startsWith('/mega_rewards');
  const scopeType = isGlobalStatic ? 'GLOBAL STATIC DATA (Affects All Users)' : 'USER DYNAMIC DATA';

  const executeWrite = () => {
    if (!confirm(`⚠️ Confirm Direct Cloud Write to Firebase?\n\nTarget Path: ${path}\nData Scope: ${scopeType}\n\nThis will overwrite the live node in Firebase Realtime Database!`)) {
      return;
    }

    if (status) status.textContent = `⏳ Writing to Firebase (${path})...`;

    db.ref(path).set(parsedData)
      .then(() => {
        if (status) status.textContent = `💾 Successfully written to ${path} at ${new Date().toLocaleTimeString()}`;
        alert(`✅ Changes written directly to Firebase cloud at "${path}"!`);
      })
      .catch(err => {
        if (status) status.textContent = `❌ Write error: ${err.message}`;
        alert('Error writing to Firebase: ' + err.message);
      });
  };

  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(executeWrite);
  } else {
    executeWrite();
  }
}

function formatFirebaseEditorJson() {
  const editor = document.getElementById('firebaseNodeEditor');
  if (!editor || !editor.value) return;
  try {
    const parsed = JSON.parse(editor.value);
    editor.value = JSON.stringify(parsed, null, 2);
  } catch (err) {
    alert('Invalid JSON: ' + err.message);
  }
}

window.readSelectedFirebaseNode = readSelectedFirebaseNode;
window.writeSelectedFirebaseNode = writeSelectedFirebaseNode;
window.formatFirebaseEditorJson = formatFirebaseEditorJson;

function testFirebasePing() {
  const db = window.getDb ? window.getDb() : null;
  const latencyEl = document.getElementById('fbPingLatency');
  if (!db) {
    if (latencyEl) latencyEl.textContent = 'Offline';
    return;
  }

  const start = Date.now();
  if (latencyEl) latencyEl.textContent = 'Pinging...';

  db.ref('.info/connected').once('value').then(snap => {
    const duration = Date.now() - start;
    if (latencyEl) latencyEl.textContent = `${duration} ms (Connected: ${snap.val() ? 'Yes' : 'No'})`;
  }).catch(() => {
    if (latencyEl) latencyEl.textContent = 'Ping failed';
  });
}

function exportDatabaseJson() {
  const data = {
    exportedAt: new Date().toISOString(),
    players: window.adminState.users || [],
    mega_rewards: window.adminState.rewards || [],
    reward_requests: window.adminState.requests || [],
    website_tasks_config: window.adminState.websiteTasks || []
  };

  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `energy_tap_firebase_backup_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function cleanFinishedRequests() {
  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    alert('Firebase is not connected!');
    return;
  }
  const requests = window.adminState.requests || [];
  const finished = requests.filter(r => r.status === 'delivered' || r.status === 'rejected');

  if (finished.length === 0) {
    alert('No delivered or rejected requests to clean.');
    return;
  }

  if (!confirm(`Are you sure you want to remove ${finished.length} finished requests from Firebase?`)) {
    return;
  }

  const updates = {};
  finished.forEach(r => {
    updates[`/reward_requests/${r.id}`] = null;
  });

  db.ref().update(updates).then(() => {
    alert(`Cleaned ${finished.length} finished requests from Firebase!`);
  }).catch(err => alert('Error: ' + err.message));
}

function removeAllPlayersData() {
  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    alert('Firebase is not connected!');
    return;
  }

  if (!confirm('⚠️ WARNING: Are you sure you want to delete ALL players from Firebase (/players)?\n\nThis will remove all player accounts, coins, levels, keys, and progress!')) {
    return;
  }

  Promise.all([
    db.ref('/players').remove(),
    db.ref('/leaderboard').remove()
  ]).then(() => {
    window.adminState.users = [];
    updateNodeCounts();
    alert('✅ All player data and leaderboards have been completely removed from Firebase!');
  }).catch(err => alert('Error removing players: ' + err.message));
}

function removeAllLeaderboardData() {
  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    alert('Firebase is not connected!');
    return;
  }

  if (!confirm('Clear all entries in /leaderboard?')) return;

  db.ref('/leaderboard').remove().then(() => {
    alert('✅ Leaderboard cache cleared from Firebase!');
  }).catch(err => alert('Error: ' + err.message));
}

function removeAllRequestsData() {
  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    alert('Firebase is not connected!');
    return;
  }

  if (!confirm('Clear all reward redemption orders in /reward_requests?')) return;

  db.ref('/reward_requests').remove().then(() => {
    window.adminState.requests = [];
    updateNodeCounts();
    alert('✅ All reward requests removed from Firebase!');
  }).catch(err => alert('Error: ' + err.message));
}

function wipeAllFirebaseData() {
  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    alert('Firebase is not connected!');
    return;
  }

  const firstConfirm = confirm('🚨 CRITICAL DANGER: Are you sure you want to REMOVE ALL DATA from Firebase?\n\nThis will wipe:\n- All Player Accounts (/players)\n- All Leaderboard entries (/leaderboard)\n- All Reward Redemption Requests (/reward_requests)');
  if (!firstConfirm) return;

  const doubleConfirm = prompt('Type "REMOVE ALL DATA" to confirm permanent cloud wipe:');
  if (doubleConfirm !== 'REMOVE ALL DATA') {
    alert('Wipe cancelled. Confirmation text did not match.');
    return;
  }

  Promise.all([
    db.ref('/players').remove(),
    db.ref('/leaderboard').remove(),
    db.ref('/reward_requests').remove()
  ]).then(() => {
    window.adminState.users = [];
    window.adminState.requests = [];
    updateNodeCounts();
    alert('🔥 ALL DATA HAS BEEN REMOVED FROM FIREBASE!\n\nAll players, leaderboards, and requests have been wiped clean.');
  }).catch(err => alert('Error wiping Firebase data: ' + err.message));
}

window.initFirebaseManagePage = initFirebaseManagePage;
window.testFirebasePing = testFirebasePing;
window.exportDatabaseJson = exportDatabaseJson;
window.cleanFinishedRequests = cleanFinishedRequests;
window.removeAllPlayersData = removeAllPlayersData;
window.removeAllLeaderboardData = removeAllLeaderboardData;
window.removeAllRequestsData = removeAllRequestsData;
window.wipeAllFirebaseData = wipeAllFirebaseData;

document.addEventListener('DOMContentLoaded', initFirebaseManagePage);
