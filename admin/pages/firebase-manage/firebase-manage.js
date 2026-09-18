/* ==========================================================================
   PAGE: FIREBASE MANAGE LOGIC (pages/firebase-manage/firebase-manage.js)
   ========================================================================== */

function initFirebaseManagePage() {
  updateNodeCounts();
  testFirebasePing();
  populateLevelPicker();
  loadLevelConfigIntoForm(1);
}

window.addEventListener('usersUpdated', updateNodeCounts);
window.addEventListener('rewardsUpdated', updateNodeCounts);
window.addEventListener('requestsUpdated', updateNodeCounts);
window.addEventListener('websiteTasksUpdated', updateNodeCounts);
window.addEventListener('levelsConfigUpdated', () => {
  const select = document.getElementById('selectAdminLevelNum');
  const lvl = select ? parseInt(select.value, 10) || 1 : 1;
  loadLevelConfigIntoForm(lvl);
});

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
// LEVEL & GOAL SYSTEM MANAGER (Firebase /levels_config)
// ==========================================================================

let currentInspectedLevel = 1;

function populateLevelPicker() {
  const select = document.getElementById('selectAdminLevelNum');
  if (!select) return;

  let options = '';
  for (let i = 1; i <= 100; i++) {
    options += `<option value="${i}">Level ${i}</option>`;
  }
  select.innerHTML = options;
  select.value = '1';
}

function getLevelTierName(l) {
  if (l <= 10) return 'Pioneer';
  if (l <= 25) return 'Voyager';
  if (l <= 50) return 'Commander';
  if (l <= 75) return 'Cyber Master';
  return 'Cosmic Titan';
}

function generateDefaultLevelConfig(l) {
  const xpRequired = 1000 + (l - 1) * 250;
  const cardsTarget = Math.min(30, 2 + Math.floor(l * 0.4));
  const keysTarget = Math.min(25, 1 + Math.floor(l * 0.3));
  const ticketsTarget = Math.min(20, 1 + Math.floor(l * 0.2));
  const coinsTarget = 5000 + (l - 1) * 1500;

  const coinsReward = 5000 + (l - 1) * 2000;
  const xpReward = 500 + (l - 1) * 100;
  const keysReward = l % 5 === 0 ? 3 : 1;
  const ticketsReward = l % 3 === 0 ? 2 : 1;
  const cardsReward = 1;
  const fuelReward = Math.min(100, 20 + l * 2);

  return {
    level: l,
    name: `Level ${l} - ${getLevelTierName(l)}`,
    isLocked: false,
    xpRequired: xpRequired,
    targets: {
      cards: cardsTarget,
      keys: keysTarget,
      tickets: ticketsTarget,
      coins: coinsTarget
    },
    rewards: {
      coins: coinsReward,
      xpBonus: xpReward,
      keys: keysReward,
      tickets: ticketsReward,
      cards: cardsReward,
      fuel: fuelReward
    }
  };
}

function loadLevelConfigIntoForm(lvl) {
  currentInspectedLevel = lvl;
  const select = document.getElementById('selectAdminLevelNum');
  if (select && select.value !== String(lvl)) {
    select.value = String(lvl);
  }

  const levelsConfig = (window.adminState && window.adminState.levelsConfig) ? window.adminState.levelsConfig : {};
  const isFromCloud = levelsConfig && levelsConfig[lvl];
  const def = generateDefaultLevelConfig(lvl);
  const cfg = isFromCloud ? levelsConfig[lvl] : def;

  const targets = cfg.targets || def.targets || {};
  const rewards = cfg.rewards || def.rewards || {};
  const isLocked = !!cfg.isLocked;

  // Header badges
  const statusBadge = document.getElementById('lvlConfigStatusBadge');
  const sourceBadge = document.getElementById('lvlConfigSourceBadge');
  const btnLockIcon = document.getElementById('btnLevelLockIcon');
  const btnLockText = document.getElementById('btnLevelLockText');

  if (statusBadge) {
    statusBadge.textContent = isLocked ? '● Locked' : '● Unlocked';
    statusBadge.style.background = isLocked ? '#fee2e2' : '#dcfce7';
    statusBadge.style.color = isLocked ? '#dc2626' : '#15803d';
  }
  if (sourceBadge) {
    sourceBadge.textContent = isFromCloud ? 'Firebase Cloud (Custom)' : 'Formula Default';
  }
  if (btnLockIcon) btnLockIcon.textContent = isLocked ? '🔓' : '🔒';
  if (btnLockText) btnLockText.textContent = isLocked ? 'Unlock Level' : 'Lock Level';

  // Populate inputs
  if (document.getElementById('inpLvlName')) {
    document.getElementById('inpLvlName').value = cfg.name || def.name;
  }
  if (document.getElementById('inpLvlXpReq')) {
    document.getElementById('inpLvlXpReq').value = cfg.xpRequired !== undefined ? cfg.xpRequired : def.xpRequired;
  }
  if (document.getElementById('inpLvlTargetCards')) {
    document.getElementById('inpLvlTargetCards').value = targets.cards !== undefined ? targets.cards : def.targets.cards;
  }
  if (document.getElementById('inpLvlTargetKeys')) {
    document.getElementById('inpLvlTargetKeys').value = targets.keys !== undefined ? targets.keys : def.targets.keys;
  }
  if (document.getElementById('inpLvlTargetTickets')) {
    document.getElementById('inpLvlTargetTickets').value = targets.tickets !== undefined ? targets.tickets : def.targets.tickets;
  }
  if (document.getElementById('inpLvlTargetCoins')) {
    document.getElementById('inpLvlTargetCoins').value = targets.coins !== undefined ? targets.coins : def.targets.coins;
  }

  // Rewards
  if (document.getElementById('inpLvlRewardCoins')) {
    document.getElementById('inpLvlRewardCoins').value = rewards.coins !== undefined ? rewards.coins : def.rewards.coins;
  }
  if (document.getElementById('inpLvlRewardXp')) {
    document.getElementById('inpLvlRewardXp').value = rewards.xpBonus !== undefined ? rewards.xpBonus : def.rewards.xpBonus;
  }
  if (document.getElementById('inpLvlRewardKeys')) {
    document.getElementById('inpLvlRewardKeys').value = rewards.keys !== undefined ? rewards.keys : def.rewards.keys;
  }
  if (document.getElementById('inpLvlRewardTickets')) {
    document.getElementById('inpLvlRewardTickets').value = rewards.tickets !== undefined ? rewards.tickets : def.rewards.tickets;
  }
  if (document.getElementById('inpLvlRewardCards')) {
    document.getElementById('inpLvlRewardCards').value = rewards.cards !== undefined ? rewards.cards : def.rewards.cards;
  }
  if (document.getElementById('inpLvlRewardFuel')) {
    document.getElementById('inpLvlRewardFuel').value = rewards.fuel !== undefined ? rewards.fuel : def.rewards.fuel;
  }
}

function onAdminLevelSelectChange() {
  const select = document.getElementById('selectAdminLevelNum');
  const lvl = select ? parseInt(select.value, 10) || 1 : 1;
  loadLevelConfigIntoForm(lvl);
}
window.onAdminLevelSelectChange = onAdminLevelSelectChange;

function stepAdminLevel(delta) {
  let nextLvl = currentInspectedLevel + delta;
  if (nextLvl < 1) nextLvl = 1;
  if (nextLvl > 100) nextLvl = 100;
  loadLevelConfigIntoForm(nextLvl);
}
window.stepAdminLevel = stepAdminLevel;

function saveCurrentLevelConfig() {
  const lvl = currentInspectedLevel;
  const levelsConfig = (window.adminState && window.adminState.levelsConfig) ? window.adminState.levelsConfig : {};
  const currentCfg = levelsConfig[lvl] || generateDefaultLevelConfig(lvl);

  const cfg = {
    level: lvl,
    name: document.getElementById('inpLvlName')?.value.trim() || `Level ${lvl}`,
    isLocked: !!currentCfg.isLocked,
    xpRequired: Number(document.getElementById('inpLvlXpReq')?.value) || 1000,
    targets: {
      cards: Number(document.getElementById('inpLvlTargetCards')?.value) || 0,
      keys: Number(document.getElementById('inpLvlTargetKeys')?.value) || 0,
      tickets: Number(document.getElementById('inpLvlTargetTickets')?.value) || 0,
      coins: Number(document.getElementById('inpLvlTargetCoins')?.value) || 0
    },
    rewards: {
      coins: Number(document.getElementById('inpLvlRewardCoins')?.value) || 5000,
      xpBonus: Number(document.getElementById('inpLvlRewardXp')?.value) || 500,
      keys: Number(document.getElementById('inpLvlRewardKeys')?.value) || 1,
      tickets: Number(document.getElementById('inpLvlRewardTickets')?.value) || 1,
      cards: Number(document.getElementById('inpLvlRewardCards')?.value) || 1,
      fuel: Number(document.getElementById('inpLvlRewardFuel')?.value) || 20
    }
  };

  if (typeof window.saveLevelConfig === 'function') {
    window.saveLevelConfig(lvl, cfg)
      .then(() => {
        alert(`✅ Level ${lvl} configuration saved to Firebase!`);
        loadLevelConfigIntoForm(lvl);
      })
      .catch(err => alert('Firebase error: ' + err.message));
  } else {
    const db = window.getDb ? window.getDb() : null;
    if (!db) return;
    db.ref(`/levels_config/${lvl}`).set(cfg)
      .then(() => {
        alert(`✅ Level ${lvl} saved to Firebase!`);
        loadLevelConfigIntoForm(lvl);
      })
      .catch(err => alert('Error: ' + err.message));
  }
}
window.saveCurrentLevelConfig = saveCurrentLevelConfig;

function toggleCurrentLevelLock() {
  const lvl = currentInspectedLevel;
  const levelsConfig = (window.adminState && window.adminState.levelsConfig) ? window.adminState.levelsConfig : {};
  const currentCfg = levelsConfig[lvl] || generateDefaultLevelConfig(lvl);
  const nextLockState = !currentCfg.isLocked;

  if (typeof window.toggleLevelLock === 'function') {
    window.toggleLevelLock(lvl, nextLockState)
      .then(() => {
        if (!levelsConfig[lvl]) levelsConfig[lvl] = { ...currentCfg };
        levelsConfig[lvl].isLocked = nextLockState;
        loadLevelConfigIntoForm(lvl);
      })
      .catch(err => alert('Firebase error: ' + err.message));
  }
}
window.toggleCurrentLevelLock = toggleCurrentLevelLock;

function seedAllLevelsToFirebase() {
  if (!confirm('⚠️ Seed all 100 default level configurations to Firebase (/levels_config)? Existing customizations will be refreshed.')) {
    return;
  }

  const allConfigs = {};
  for (let l = 1; l <= 100; l++) {
    allConfigs[l] = generateDefaultLevelConfig(l);
  }

  if (typeof window.saveAllLevelsConfig === 'function') {
    window.saveAllLevelsConfig(allConfigs)
      .then(() => {
        alert('✅ All 100 Level configurations published to Firebase (/levels_config)!');
        loadLevelConfigIntoForm(currentInspectedLevel);
      })
      .catch(err => alert('Error: ' + err.message));
  } else {
    const db = window.getDb ? window.getDb() : null;
    if (!db) return;
    db.ref('/levels_config').set(allConfigs)
      .then(() => {
        alert('✅ All 100 levels saved to Firebase!');
        loadLevelConfigIntoForm(currentInspectedLevel);
      })
      .catch(err => alert('Error: ' + err.message));
  }
}
window.seedAllLevelsToFirebase = seedAllLevelsToFirebase;
window.loadLevelConfigIntoForm = loadLevelConfigIntoForm;


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
