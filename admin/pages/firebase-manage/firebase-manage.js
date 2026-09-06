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
  if (!db) return;
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

window.initFirebaseManagePage = initFirebaseManagePage;
window.testFirebasePing = testFirebasePing;
window.exportDatabaseJson = exportDatabaseJson;
window.cleanFinishedRequests = cleanFinishedRequests;

document.addEventListener('DOMContentLoaded', initFirebaseManagePage);
