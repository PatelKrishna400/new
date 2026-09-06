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

  const elP = document.getElementById('fbPlayersCount');
  const elR = document.getElementById('fbRewardsCount');
  const elReq = document.getElementById('fbRequestsCount');
  const elT = document.getElementById('fbTasksCount');

  if (elP) elP.textContent = `${users.length} users`;
  if (elR) elR.textContent = `${rewards.length} items`;
  if (elReq) elReq.textContent = `${requests.length} orders`;
  if (elT) elT.textContent = `${tasks.length} quests`;
}

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
