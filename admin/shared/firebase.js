/* ==========================================================================
   ENERGY TAP ADMIN - SHARED FIREBASE SERVICE (shared/firebase.js)
   - Real-time Listeners: /players, /mega_rewards, /reward_requests, /website_tasks_config
   ========================================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyDnujl5_iBlSzwDfjCLA7sFQ7zW1DxROic",
  authDomain: "tap-game-80070.firebaseapp.com",
  databaseURL: "https://tap-game-80070-default-rtdb.firebaseio.com",
  projectId: "tap-game-80070",
  storageBucket: "tap-game-80070.firebasestorage.app",
  messagingSenderId: "1028935905694",
  appId: "1:1028935905694:web:af5190281ad93c0ebbe68f",
  measurementId: "G-B8KMYEQ0L4"
};
window.firebaseConfig = firebaseConfig;

// Global Admin Shared State
window.adminState = {
  activePage: 'dashboard',
  users: [],
  rewards: [],
  requests: [],
  customRequests: [],
  websiteTasks: [],
  telegramTasks: [],
  levelsConfig: {},
  isFirebaseConnected: false
};

let db = null;
let auth = null;

function initFirebase() {
  try {
    if (typeof firebase !== 'undefined') {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      db = firebase.database();
      auth = firebase.auth();

      auth.signInAnonymously()
        .then(() => {
          setFirebaseOnline(true);
          listenToFirebase();
        })
        .catch(err => {
          console.warn('Anonymous Auth fallback, attempting direct DB access:', err);
          setFirebaseOnline(true);
          listenToFirebase();
        });
    } else {
      setFirebaseOnline(false);
    }
  } catch (err) {
    console.error('Firebase error:', err);
    setFirebaseOnline(false);
  }
}

function setFirebaseOnline(isOnline, statusText) {
  window.adminState.isFirebaseConnected = isOnline;
  const dot = document.getElementById('firebaseStatusDot');
  const text = document.getElementById('firebaseStatusText');
  if (dot && text) {
    if (isOnline) {
      dot.className = 'status-dot online';
      text.textContent = statusText || 'Cloud Live (RTDB)';
    } else {
      dot.className = 'status-dot';
      text.textContent = statusText || 'Disconnected / Offline';
    }
  }
}

let hasShownRulesWarning = false;
function onFirebasePermissionError(error, nodePath) {
  console.warn(`[Firebase RTDB] Read error on ${nodePath}:`, error ? error.message : '');
  setFirebaseOnline(false, '⚠️ Rules Denied (Check Console)');
  if (!hasShownRulesWarning) {
    hasShownRulesWarning = true;
    showFirebaseRulesWarningBanner();
  }
  loadFallbackDataSources();
}

function clearFirebaseRulesWarningBanner() {
  const banner = document.getElementById('firebaseRulesWarningBanner');
  if (banner) banner.remove();
  setFirebaseOnline(true, 'Cloud Live (RTDB)');
}

function showFirebaseRulesWarningBanner() {
  if (document.getElementById('firebaseRulesWarningBanner')) return;
  const banner = document.createElement('div');
  banner.id = 'firebaseRulesWarningBanner';
  banner.style.cssText = 'background: #fffbeb; border-bottom: 2px solid #f59e0b; color: #92400e; padding: 10px 18px; font-size: 13px; display: flex; align-items: center; justify-content: space-between; gap: 12px; z-index: 99999; position: sticky; top: 0; box-shadow: 0 2px 10px rgba(0,0,0,0.08);';
  banner.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
      <span style="font-size: 20px; flex-shrink: 0;">⚠️</span>
      <div>
        <strong>Firebase Security Rules Locked:</strong> 
        Firebase RTDB returned <em>Permission Denied</em>. Please publish the contents of <code>database.rules.json</code> in your <strong>Firebase Console → Realtime Database → Rules</strong> tab.
      </div>
    </div>
    <div style="display: flex; gap: 8px; flex-shrink: 0;">
      <button type="button" onclick="copyFirebaseRulesToClipboard()" style="background: #f59e0b; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 700; font-size: 12px; cursor: pointer;">
        📋 Copy Rules JSON
      </button>
      <a href="https://console.firebase.google.com/project/tap-game-80070/database/tap-game-80070-default-rtdb/rules" target="_blank" rel="noopener noreferrer" style="background: #0284c7; color: #fff; text-decoration: none; padding: 6px 12px; border-radius: 6px; font-weight: 700; font-size: 12px; display: flex; align-items: center; gap: 4px;">
        Open Firebase Console ↗
      </a>
      <button type="button" onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 18px; color: #92400e; cursor: pointer; padding: 0 4px;" title="Dismiss">&times;</button>
    </div>
  `;
  document.body.prepend(banner);
}

function copyFirebaseRulesToClipboard() {
  const rules = {
    "rules": {
      "players": {
        ".read": true,
        "$uid": {
          ".read": true,
          ".write": "auth != null && (auth.uid === $uid || root.child('admin_users').child(auth.uid).exists() || auth.token.admin === true || root.child('whitelist').child(auth.uid).exists())",
          ".validate": "newData.hasChildren(['player']) || newData.hasChildren(['updatedAt'])"
        }
      },
      "users": {
        ".read": true,
        "$uid": {
          ".read": true,
          ".write": "auth != null && (auth.uid === $uid || root.child('admin_users').child(auth.uid).exists() || auth.token.admin === true)"
        }
      },
      "leaderboard": {
        ".read": true,
        "$uid": {
          ".write": "auth != null"
        }
      },
      "mega_rewards": {
        ".read": true,
        ".write": "auth != null"
      },
      "reward_requests": {
        ".read": true,
        ".write": "auth != null",
        "$reqId": {
          ".read": true,
          ".write": "auth != null"
        }
      },
      "ads_direct_clicks": {
        ".read": true,
        ".write": "auth != null",
        "$clickId": {
          ".read": true,
          ".write": "auth != null"
        }
      },
      "suggestions": {
        ".read": true,
        ".write": "auth != null",
        "$sugId": {
          ".read": true,
          ".write": "auth != null"
        }
      },
      "website_tasks_config": {
        ".read": true,
        ".write": "auth != null"
      },
      "telegram_tasks_config": {
        ".read": true,
        ".write": "auth != null"
      },
      "monthly_competition": {
        ".read": true,
        ".write": "auth != null"
      },
      "season": {
        ".read": true,
        ".write": "auth != null"
      },
      "ads_config": {
        ".read": true,
        ".write": "auth != null"
      },
      "whitelist": {
        ".read": true,
        "$uid": {
          ".write": "auth != null"
        }
      },
      "admin_users": {
        ".read": true,
        ".write": "auth != null"
      },
      "game_config": {
        ".read": true,
        ".write": "auth != null"
      },
      "levels_config": {
        ".read": true,
        ".write": "auth != null"
      },
      "fuel_cells_config": {
        ".read": true,
        ".write": "auth != null"
      },
      "activity_log": {
        ".read": true,
        ".write": "auth != null",
        ".indexOn": ["timestamp"]
      },
      ".info": {
        ".read": true
      }
    }
  };
  const jsonStr = JSON.stringify(rules, null, 2);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(jsonStr).then(() => {
      alert('📋 Firebase Security Rules copied to clipboard!\n\nOpen Firebase Console → Realtime Database → Rules, paste this JSON and click "Publish".');
    }).catch(() => {
      prompt('Copy these rules and paste into Firebase Console → Realtime Database → Rules:', jsonStr);
    });
  } else {
    prompt('Copy these rules and paste into Firebase Console → Realtime Database → Rules:', jsonStr);
  }
}
window.copyFirebaseRulesToClipboard = copyFirebaseRulesToClipboard;

async function loadFallbackDataSources() {
  // 1. Try local storage user state
  try {
    const localSave = localStorage.getItem('ENERGY_TAP_SAVE_STATE_V5');
    if (localSave && (!window.adminState.users || window.adminState.users.length === 0)) {
      const parsed = JSON.parse(localSave);
      const uid = localStorage.getItem('ENERGY_TAP_FIREBASE_LOCAL_UID_V5') || 'local_player';
      if (typeof parsePlayerRecord === 'function') {
        const u = parsePlayerRecord(uid, parsed);
        window.adminState.users = [u];
        dispatchAdminEvent('usersUpdated');
      }
    }
  } catch (e) {}

  // 2. Try backend API (/api/users, /api/requests, /api/rewards)
  try {
    const res = await fetch('/api/users');
    if (res.ok) {
      const data = await res.json();
      if (data && data.users && data.users.length > 0) {
        if (typeof parsePlayerRecord === 'function') {
          window.adminState.users = data.users.map(u => parsePlayerRecord(u.uid, u));
        } else {
          window.adminState.users = data.users;
        }
        dispatchAdminEvent('usersUpdated');
      }
    }
  } catch (e) {}

  try {
    const res = await fetch('/api/requests');
    if (res.ok) {
      const data = await res.json();
      if (data && data.requests && data.requests.length > 0) {
        window.adminState.requests = data.requests;
        dispatchAdminEvent('requestsUpdated');
      }
    }
  } catch (e) {}

  try {
    const res = await fetch('/api/rewards');
    if (res.ok) {
      const data = await res.json();
      if (data && data.rewards && data.rewards.length > 0) {
        window.adminState.rewards = data.rewards;
        dispatchAdminEvent('rewardsUpdated');
      }
    }
  } catch (e) {}
}

function listenToFirebase() {
  if (!db) return;

  // 1. Players & Users Real-time Dual Cache Listeners
  const playersCache = {};
  const legacyUsersCache = {};
  let isInitialUsersLoaded = false;
  const knownUserUids = new Set();
  window.recentlyAddedUids = window.recentlyAddedUids || new Set();

  const parsePlayerRecord = (uid, data) => {
    const pl = data.player || data || {};
    const goalObj = data.goal || {};
    const goalStateObj = data.goalState || {};
    const tasksObj = data.tasksState || {};
    const xpStateObj = data.xpState || {};
    const reactorObj = data.reactor || {};
    const genObj = data.energyGenerator || {};
    const dailyStats = data.dailyStats || {};

    const dailyDone = tasksObj.claimedDaily ? Object.keys(tasksObj.claimedDaily).filter(k => tasksObj.claimedDaily[k]).length : 0;
    const monthlyDone = tasksObj.claimedMonthly ? Object.keys(tasksObj.claimedMonthly).filter(k => tasksObj.claimedMonthly[k]).length : 0;
    const webDone = tasksObj.claimedWebsite ? Object.keys(tasksObj.claimedWebsite).filter(k => tasksObj.claimedWebsite[k]).length : (Number(pl.websiteTasksCompleted || pl.webTasksDone || pl.webDone) || 0);
    const tgDone = tasksObj.claimedTelegram ? Object.keys(tasksObj.claimedTelegram).filter(k => tasksObj.claimedTelegram[k]).length : 0;

    const goalLevel = goalObj.level !== undefined ? goalObj.level : (goalStateObj.currentLevel || 0);

    const currentEnergy = reactorObj.currentEnergy !== undefined ? Number(reactorObj.currentEnergy) : (Number(pl.currentEnergy) || 0);
    const maxEnergy = reactorObj.maxEnergy !== undefined ? Number(reactorObj.maxEnergy) : (Number(pl.maxEnergy) || 1000);
    const tapPower = reactorObj.tapPower !== undefined ? Number(reactorObj.tapPower) : (Number(pl.tapPower) || 1);
    const countTaps = reactorObj.energyTaps !== undefined ? Number(reactorObj.energyTaps) : (Number(pl.energyTaps) || (Number(dailyStats.taps) || 0));

    const xp = pl.xp !== undefined ? Number(pl.xp) : (Number(xpStateObj.currentXP) || 0);
    const xpToNextLevel = pl.xpToNextLevel !== undefined ? Number(pl.xpToNextLevel) : ((Number(pl.level || 0) + 1) * 1000);

    const coins = Number(pl.coins || 0);
    const diamonds = Number(pl.diamonds || 0);
    const blueCoins = (pl.blueCoins !== undefined) ? Number(pl.blueCoins) : diamonds;
    const blueTapsLeft = Number(pl.blueTapsLeft || 0);
    const chestKeys = Number(pl.chestKeys || 0);
    const scratchCards = Number(pl.scratchCards || 0);
    const chestTickets = Number(pl.chestTickets || 0);
    const eggs = Number(pl.eggs || 0);

    const cleanUid = String(uid).replace(/[^a-zA-Z0-9]/g, '');
    const profileCode = pl.profileCode || ('ET-' + (cleanUid.length >= 6 ? cleanUid.slice(-6).toUpperCase() : String(uid).toUpperCase()));

    const adsCount = (pl.adsWatchedCount !== undefined) ? Number(pl.adsWatchedCount) : (
      (Number(pl.watchedAds) || 0) +
      (Number(pl.adsButtonCount) || 0) +
      (xpStateObj ? (Number(xpStateObj.watchedAds) || 0) : 0) +
      (goalStateObj ? ((Number(goalStateObj.levelAdsWatched) || 0) + (Number(goalStateObj.megaWatchedAds) || 0)) : 0) +
      (dailyStats ? (Number(dailyStats.adsWatched) || 0) : 0)
    );

    return {
      uid: String(uid),
      profileCode,
      username: pl.username || pl.name || 'User_' + String(uid).substring(0, 6),
      handle: pl.handle || 'user_' + String(uid).substring(0, 6),
      telegram: pl.telegram || (pl.handle ? ('@' + pl.handle.replace(/^@/, '')) : ''),
      mobile: pl.mobile || pl.phone || '',
      level: Number(pl.level || 0),
      xp: xp,
      xpToNextLevel: xpToNextLevel,
      goalLevel: goalLevel,
      currentEnergy: currentEnergy,
      maxEnergy: maxEnergy,
      tapPower: tapPower,
      countTaps: countTaps,
      dailyTaps: Number(dailyStats.taps || 0),
      monthlyDone: monthlyDone,
      tgDone: tgDone,
      webDone: webDone,
      coins: coins,
      diamonds: diamonds,
      blueCoins: blueCoins,
      blueTapsLeft: blueTapsLeft,
      chestKeys: chestKeys,
      scratchCards: scratchCards,
      chestTickets: chestTickets,
      eggs: eggs,
      dailyTasksDone: dailyDone,
      webTasksDone: webDone,
      adsButtonCount: adsCount,
      adsWatched: adsCount,
      tasksCount: monthlyDone + webDone + tgDone,
      referralCount: Number(pl.referralCount || pl.referralsCount || (pl.referrals ? Object.keys(pl.referrals).length : 0)),
      status: (pl.status || pl.accountStatus || 'active').toLowerCase(),
      joinedAt: pl.createdAt || pl.joinedAt || pl.registrationDate || data.createdAt || (data.updatedAt ? new Date(data.updatedAt).toISOString() : new Date().toISOString()),
      lastActive: pl.lastActive || data.lastActive || (data.updatedAt ? new Date(data.updatedAt).toISOString() : new Date().toISOString()),
      tasksState: tasksObj,
      goal: goalObj,
      goalState: goalStateObj,
      xpState: xpStateObj,
      reactor: reactorObj,
      energyGenerator: genObj,
      dailyStats: dailyStats,
      raw: data
    };
  };

  const syncAllUsersFromCaches = () => {
    const merged = { ...legacyUsersCache, ...playersCache };
    const userList = [];
    let totalSpins = 0;
    let totalChests = 0;
    let totalScratches = 0;
    let totalEggs = 0;

    let newlyAddedPlayer = null;

    Object.keys(merged).forEach(uid => {
      const u = parsePlayerRecord(uid, merged[uid]);
      userList.push(u);

      const ds = u.dailyStats || {};
      totalSpins += (Number(ds.spins) || Number(ds.wheelSpins) || 0);
      totalChests += (Number(ds.chests) || Number(ds.chestsOpened) || 0);
      totalScratches += (Number(ds.scratches) || Number(ds.scratchCards) || 0);
      totalEggs += (Number(ds.eggs) || Number(ds.eggCoins) || 0);

      // Detect newly added user in real time
      if (isInitialUsersLoaded && !knownUserUids.has(uid)) {
        window.recentlyAddedUids.add(uid);
        newlyAddedPlayer = u;
      }
      knownUserUids.add(uid);
    });

    window.adminState.users = userList;
    window.adminState.gameStats = {
      totalSpins,
      totalChests,
      totalScratches,
      totalEggs
    };

    dispatchAdminEvent('usersUpdated');

    // If a new user just registered or was added in real time, notify and highlight
    if (newlyAddedPlayer) {
      showRealtimeUserToast(newlyAddedPlayer);
    }

    // If details modal is open for any user, update it live in real time!
    if (window.activeDetailsUid && typeof window.viewUserDetails === 'function') {
      window.viewUserDetails(window.activeDetailsUid, true);
    }

    // Also update dashboard metric cards
    if (typeof updateDashboardMetrics === 'function') {
      updateDashboardMetrics();
    }
  };

  // Real-time listener for /players
  db.ref('/players').on('value', snapshot => {
    const val = snapshot.val() || {};
    // Replace cache with fresh snapshot
    Object.keys(playersCache).forEach(k => delete playersCache[k]);
    Object.assign(playersCache, val);
    syncAllUsersFromCaches();
    isInitialUsersLoaded = true;
    clearFirebaseRulesWarningBanner();
  }, err => onFirebasePermissionError(err, '/players'));

  // Real-time listener for /users (legacy or secondary node)
  db.ref('/users').on('value', snapshot => {
    const val = snapshot.val() || {};
    Object.keys(legacyUsersCache).forEach(k => delete legacyUsersCache[k]);
    Object.assign(legacyUsersCache, val);
    syncAllUsersFromCaches();
    isInitialUsersLoaded = true;
    clearFirebaseRulesWarningBanner();
  }, err => onFirebasePermissionError(err, '/users'));

  // Child listeners to ensure instantaneous feedback on additions & updates
  db.ref('/players').on('child_added', snapshot => {
    const uid = snapshot.key;
    const val = snapshot.val();
    if (uid && val) {
      playersCache[uid] = val;
      if (isInitialUsersLoaded && !knownUserUids.has(uid)) {
        window.recentlyAddedUids.add(uid);
        const player = parsePlayerRecord(uid, val);
        showRealtimeUserToast(player);
        syncAllUsersFromCaches();
      }
    }
  }, err => onFirebasePermissionError(err, '/players child_added'));

  db.ref('/players').on('child_changed', snapshot => {
    const uid = snapshot.key;
    const val = snapshot.val();
    if (uid && val) {
      playersCache[uid] = val;
      syncAllUsersFromCaches();
    }
  }, err => onFirebasePermissionError(err, '/players child_changed'));

  db.ref('/players').on('child_removed', snapshot => {
    const uid = snapshot.key;
    if (uid && playersCache[uid]) {
      delete playersCache[uid];
      knownUserUids.delete(uid);
      syncAllUsersFromCaches();
    }
  }, err => onFirebasePermissionError(err, '/players child_removed'));

  // 2. Mega Rewards
  db.ref('/mega_rewards').on('value', snapshot => {
    const val = snapshot.val();
    let list = [];
    if (val && Array.isArray(val)) {
      list = val;
    } else if (val && typeof val === 'object') {
      list = Object.keys(val).map(k => ({ id: k, ...val[k] }));
    }
    window.adminState.rewards = list;
    clearFirebaseRulesWarningBanner();
    dispatchAdminEvent('rewardsUpdated');
  }, err => onFirebasePermissionError(err, '/mega_rewards'));

  // 3. Reward Requests
  db.ref('/reward_requests').on('value', snapshot => {
    const val = snapshot.val();
    const list = [];
    if (val) {
      Object.keys(val).forEach(id => {
        list.push({ id, ...val[id] });
      });
    }
    window.adminState.requests = list.reverse();
    clearFirebaseRulesWarningBanner();
    dispatchAdminEvent('requestsUpdated');
  }, err => onFirebasePermissionError(err, '/reward_requests'));

  // 4. Website Tasks Config
  db.ref('/website_tasks_config').on('value', snapshot => {
    const val = snapshot.val();
    let list = [];
    if (val && Array.isArray(val)) {
      list = val.filter(Boolean);
    } else if (val && typeof val === 'object') {
      list = Object.keys(val).map(k => ({ id: k, ...val[k] }));
    }
    window.adminState.websiteTasks = list;
    try { localStorage.setItem('ENERGY_TAP_WEB_TASKS', JSON.stringify(list)); } catch(e){}
    clearFirebaseRulesWarningBanner();
    dispatchAdminEvent('websiteTasksUpdated');
  }, err => onFirebasePermissionError(err, '/website_tasks_config'));

  // 5. Telegram Tasks Config
  db.ref('/telegram_tasks_config').on('value', snapshot => {
    const val = snapshot.val();
    let list = [];
    if (val && Array.isArray(val)) {
      list = val.filter(Boolean);
    } else if (val && typeof val === 'object') {
      list = Object.keys(val).map(k => ({ id: k, ...val[k] }));
    }
    window.adminState.telegramTasks = list;
    try { localStorage.setItem('ENERGY_TAP_TG_TASKS', JSON.stringify(list)); } catch(e){}
    clearFirebaseRulesWarningBanner();
    dispatchAdminEvent('telegramTasksUpdated');
  }, err => onFirebasePermissionError(err, '/telegram_tasks_config'));

  // 6. Monthly Competition Config (/monthly_competition)
  db.ref('/monthly_competition').on('value', snapshot => {
    const val = snapshot.val();
    if (val) {
      window.adminState.monthlyCompetition = val;
      clearFirebaseRulesWarningBanner();
      dispatchAdminEvent('monthlyCompetitionUpdated');
    }
  }, err => onFirebasePermissionError(err, '/monthly_competition'));

  // 7. Ads Configuration (/ads_config)
  db.ref('/ads_config').on('value', snapshot => {
    const val = snapshot.val();
    if (val) {
      window.adminState.adsConfig = val;
      clearFirebaseRulesWarningBanner();
      dispatchAdminEvent('adsConfigUpdated');
    }
  }, err => onFirebasePermissionError(err, '/ads_config'));

  // 8. Direct Link Ads Clicks (/ads_direct_clicks)
  db.ref('/ads_direct_clicks').on('value', snapshot => {
    const val = snapshot.val();
    const list = [];
    if (val) {
      Object.keys(val).forEach(k => list.push({ id: k, ...val[k] }));
    }
    window.adminState.directClicks = list;
    clearFirebaseRulesWarningBanner();
    dispatchAdminEvent('directClicksUpdated');
  }, err => onFirebasePermissionError(err, '/ads_direct_clicks'));

  // 9. Ads Analytics (/ads_analytics)
  db.ref('/ads_analytics').on('value', snapshot => {
    const val = snapshot.val();
    if (val) {
      window.adminState.adsAnalytics = val;
      clearFirebaseRulesWarningBanner();
      dispatchAdminEvent('adsAnalyticsUpdated');
    }
  }, err => onFirebasePermissionError(err, '/ads_analytics'));

  // 10. Admin Users (/admin_users) - Strictly authorized admins (No auto-seeding)
  db.ref('/admin_users').on('value', snapshot => {
    const val = snapshot.val();
    let list = [];
    if (val && typeof val === 'object') {
      list = Object.keys(val).map(k => ({ username: k, ...val[k] }));
    }
    window.adminState.adminUsers = list;
    clearFirebaseRulesWarningBanner();
    dispatchAdminEvent('adminUsersUpdated');
  }, err => onFirebasePermissionError(err, '/admin_users'));

  // 11. Global Website & Game Config (/game_config) - Pure editable Firebase connection (No auto-seeding)
  db.ref('/game_config').on('value', snapshot => {
    const val = snapshot.val();
    if (val && typeof val === 'object') {
      window.adminState.gameConfig = val;
    } else {
      window.adminState.gameConfig = {};
    }
    clearFirebaseRulesWarningBanner();
    dispatchAdminEvent('gameConfigUpdated');
  }, err => onFirebasePermissionError(err, '/game_config'));

  // 12. Level Progression Configuration (/levels_config)
  db.ref('/levels_config').on('value', snapshot => {
    const val = snapshot.val();
    if (val && typeof val === 'object') {
      window.adminState.levelsConfig = val;
    } else {
      window.adminState.levelsConfig = {};
    }
    clearFirebaseRulesWarningBanner();
    dispatchAdminEvent('levelsConfigUpdated');
  }, err => onFirebasePermissionError(err, '/levels_config'));

  // 13. Live Activity & Audit Log (/activity_log)
  db.ref('/activity_log').limitToLast(60).on('value', snapshot => {
    const val = snapshot.val();
    const list = [];
    if (val) {
      Object.keys(val).forEach(k => list.push({ id: k, ...val[k] }));
    }
    window.adminState.activities = list.reverse();
    clearFirebaseRulesWarningBanner();
    dispatchAdminEvent('activitiesUpdated');
  }, err => onFirebasePermissionError(err, '/activity_log'));

  // 14. Energy Fuel Cells Configuration (/fuel_cells_config)
  db.ref('/fuel_cells_config').on('value', snapshot => {
    const val = snapshot.val();
    if (val && typeof val === 'object') {
      window.adminState.fuelCellsConfig = val;
    } else {
      window.adminState.fuelCellsConfig = null;
    }
    clearFirebaseRulesWarningBanner();
    dispatchAdminEvent('fuelCellsConfigUpdated');
  }, err => onFirebasePermissionError(err, '/fuel_cells_config'));
}

function saveFuelCellsConfig(configObj) {
  if (!db) return Promise.reject(new Error('Firebase not connected'));
  return db.ref('/fuel_cells_config').set(configObj).then(() => {
    window.adminState.fuelCellsConfig = configObj;
    if (typeof logActivity === 'function') {
      logActivity('Fuel Shop Updated', 'Admin updated energy fuel cell pricing & multipliers', '🔋');
    }
  });
}
window.saveFuelCellsConfig = saveFuelCellsConfig;

// Activity Logger
function logActivity(type, title, details = '') {
  if (!db) return;
  const item = {
    type: type || 'admin_action',
    title: title || 'Admin Action',
    details: typeof details === 'object' ? JSON.stringify(details) : String(details || ''),
    timestamp: Date.now()
  };
  db.ref('/activity_log').push(item).catch(() => {});
}
window.logActivity = logActivity;

// Aggregated Real-time Metric Engine
function calculateAggregatedMetrics() {
  const users = window.adminState.users || [];
  const requests = window.adminState.requests || [];
  const levels = window.adminState.levelsConfig || {};
  const webTasks = window.adminState.websiteTasks || [];
  const tgTasks = window.adminState.telegramTasks || [];

  const now = Date.now();
  const ACTIVE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes window for online

  let totalCoins = 0;
  let totalXP = 0;
  let totalKeys = 0;
  let totalTickets = 0;
  let totalEggs = 0;
  let totalEnergy = 0;
  let totalAdViews = 0;
  let totalCompletedTasks = 0;
  let totalReferrals = 0;
  let onlineUsers = 0;

  users.forEach(u => {
    totalCoins += Number(u.coins || 0);
    totalXP += Number(u.xp || 0);
    totalKeys += Number(u.chestKeys || 0);
    totalTickets += Number(u.chestTickets || 0);
    totalEggs += Number(u.eggs || 0);
    totalEnergy += Number(u.currentEnergy || 0);
    totalAdViews += Number(u.adsWatched || u.adsButtonCount || 0);
    totalCompletedTasks += (Number(u.dailyTasksDone || 0) + Number(u.webTasksDone || 0) + Number(u.tgDone || 0));
    totalReferrals += Number(u.referralCount || u.referrals || 0);

    const lastActiveTs = u.lastActive ? new Date(u.lastActive).getTime() : 0;
    if (lastActiveTs && (now - lastActiveTs) <= ACTIVE_WINDOW_MS) {
      onlineUsers++;
    }
  });

  const pendingWithdrawals = requests.filter(r => (r.status || 'pending').toLowerCase() === 'pending').length;
  const completedWithdrawals = requests.filter(r => {
    const s = (r.status || '').toLowerCase();
    return s === 'delivered' || s === 'completed' || s === 'approved';
  }).length;
  const rejectedWithdrawals = requests.filter(r => (r.status || '').toLowerCase() === 'rejected').length;

  return {
    totalUsers: users.length,
    onlineUsers: onlineUsers,
    totalCoins: totalCoins,
    totalXP: totalXP,
    totalKeys: totalKeys,
    totalTickets: totalTickets,
    totalEggs: totalEggs,
    totalEnergy: totalEnergy,
    totalWithdrawals: requests.length,
    pendingWithdrawals: pendingWithdrawals,
    completedWithdrawals: completedWithdrawals,
    rejectedWithdrawals: rejectedWithdrawals,
    totalReferrals: totalReferrals,
    totalAdViews: totalAdViews,
    totalTasks: webTasks.length + tgTasks.length,
    totalCompletedTasks: totalCompletedTasks,
    totalLevels: Object.keys(levels).length || 100
  };
}
window.calculateAggregatedMetrics = calculateAggregatedMetrics;

// --- USER CRUD OPERATIONS ---
function saveUserToFirebase(uid, updateFields) {
  if (!db || !uid) return Promise.reject(new Error('Invalid parameters'));
  const updates = {};
  Object.keys(updateFields).forEach(k => {
    updates[`/players/${uid}/player/${k}`] = updateFields[k];
  });
  updates[`/players/${uid}/updatedAt`] = Date.now();
  return db.ref().update(updates).then(() => {
    logActivity('user_edit', `Updated player: ${updateFields.username || updateFields.name || uid}`, updateFields);
    dispatchAdminEvent('userSaved');
  });
}
window.saveUserToFirebase = saveUserToFirebase;

function toggleUserStatus(uid, newStatus) {
  if (!db || !uid) return Promise.reject(new Error('Invalid parameters'));
  return db.ref(`/players/${uid}/player/status`).set(newStatus).then(() => {
    logActivity('user_status', `Player ${uid} status set to ${newStatus.toUpperCase()}`);
    dispatchAdminEvent('userStatusChanged');
  });
}
window.toggleUserStatus = toggleUserStatus;

function deleteUserFromFirebase(uid) {
  if (!db || !uid) return Promise.reject(new Error('Invalid parameters'));
  const updates = {};
  updates[`/players/${uid}`] = null;
  updates[`/leaderboard/${uid}`] = null;
  return db.ref().update(updates).then(() => {
    logActivity('user_delete', `Deleted player: ${uid}`);
    dispatchAdminEvent('userDeleted');
  });
}
window.deleteUserFromFirebase = deleteUserFromFirebase;

// --- WITHDRAWAL & ORDER OPERATIONS ---
function updateWithdrawalStatus(reqId, newStatus, adminNotes = '') {
  if (!db || !reqId) return Promise.reject(new Error('Invalid parameters'));
  const updates = {
    status: newStatus,
    updatedAt: Date.now()
  };
  if (adminNotes) updates.adminNotes = adminNotes;
  return db.ref(`/reward_requests/${reqId}`).update(updates).then(() => {
    logActivity('withdrawal', `Withdrawal order #${reqId.substring(0, 8)} set to ${newStatus.toUpperCase()}`);
    dispatchAdminEvent('requestStatusChanged');
  });
}
window.updateWithdrawalStatus = updateWithdrawalStatus;

// --- TASKS OPERATIONS ---
function saveTaskToFirebase(taskType, taskObj) {
  if (!db || !taskObj) return Promise.reject(new Error('Invalid parameters'));
  const node = taskType === 'telegram' ? '/telegram_tasks_config' : '/website_tasks_config';
  const taskId = taskObj.id || ('task_' + Date.now().toString(36));
  taskObj.id = taskId;
  taskObj.updatedAt = Date.now();
  return db.ref(`${node}/${taskId}`).set(taskObj).then(() => {
    logActivity('task_save', `Saved ${taskType} task: ${taskObj.title || taskId}`);
    dispatchAdminEvent('tasksConfigSaved');
  });
}
window.saveTaskToFirebase = saveTaskToFirebase;

function deleteTaskFromFirebase(taskType, taskId) {
  if (!db || !taskId) return Promise.reject(new Error('Invalid parameters'));
  const node = taskType === 'telegram' ? '/telegram_tasks_config' : '/website_tasks_config';
  return db.ref(`${node}/${taskId}`).remove().then(() => {
    logActivity('task_delete', `Deleted ${taskType} task: ${taskId}`);
    dispatchAdminEvent('tasksConfigSaved');
  });
}
window.deleteTaskFromFirebase = deleteTaskFromFirebase;

// --- LEVELS OPERATIONS ---
function saveLevelConfig(lvl, cfg) {
  if (!db) return Promise.reject(new Error('Firebase DB not connected'));
  const levelNum = Math.max(1, parseInt(lvl, 10) || 1);
  return db.ref(`/levels_config/${levelNum}`).set({
    ...cfg,
    level: levelNum,
    updatedAt: Date.now()
  }).then(() => {
    logActivity('level_save', `Saved Level ${levelNum} configuration`);
    dispatchAdminEvent('levelsConfigUpdated');
  });
}

function toggleLevelLock(lvl, isLocked) {
  if (!db) return Promise.reject(new Error('Firebase DB not connected'));
  const levelNum = Math.max(1, parseInt(lvl, 10) || 1);
  return db.ref(`/levels_config/${levelNum}/isLocked`).set(!!isLocked).then(() => {
    logActivity('level_lock', `Level ${levelNum} is now ${isLocked ? 'LOCKED 🔒' : 'UNLOCKED 🔓'}`);
    dispatchAdminEvent('levelsConfigUpdated');
  });
}

function saveAllLevelsConfig(allConfigs) {
  if (!db) return Promise.reject(new Error('Firebase DB not connected'));
  return db.ref('/levels_config').set(allConfigs).then(() => {
    logActivity('level_save_all', 'Saved batch level configurations');
    dispatchAdminEvent('levelsConfigUpdated');
  });
}

window.saveLevelConfig = saveLevelConfig;
window.toggleLevelLock = toggleLevelLock;
window.saveAllLevelsConfig = saveAllLevelsConfig;

// --- GLOBAL GAME CONFIG OPERATIONS ---
function saveGlobalGameConfig(cfg) {
  if (!db) return Promise.reject(new Error('Firebase DB not connected'));
  return db.ref('/game_config').set({
    ...cfg,
    updatedAt: Date.now()
  }).then(() => {
    logActivity('game_config', 'Updated global game settings in Firebase');
    dispatchAdminEvent('gameConfigUpdated');
  });
}
window.saveGlobalGameConfig = saveGlobalGameConfig;

function firebaseAuthSignIn(email, password) {
  if (!auth) return Promise.reject(new Error('Firebase Auth not initialized'));
  return auth.signInWithEmailAndPassword(email, password);
}
window.firebaseAuthSignIn = firebaseAuthSignIn;

function dispatchAdminEvent(eventName) {
  window.dispatchEvent(new CustomEvent(eventName, { detail: window.adminState }));
  updateGlobalMetrics();
}

function updateGlobalMetrics() {
  const uCount = window.adminState.users.length;
  const rCount = window.adminState.rewards.length;
  const pendingCount = window.adminState.requests.filter(r => (r.status || 'pending').toLowerCase() === 'pending').length;

  const bUsers = document.getElementById('badgeUsersCount');
  const bRewards = document.getElementById('badgeRewardsCount');
  const bRequests = document.getElementById('badgeRequestsCount');

  if (bUsers) bUsers.textContent = uCount;
  if (bRewards) bRewards.textContent = rCount;
  if (bRequests) bRequests.textContent = pendingCount;
}

function showRealtimeUserToast(player) {
  if (!player) return;
  let container = document.getElementById('adminRealtimeToastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'adminRealtimeToastContainer';
    container.style.cssText = 'position: fixed; bottom: 24px; right: 24px; z-index: 99999; display: flex; flex-direction: column; gap: 10px; pointer-events: none;';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.style.cssText = 'pointer-events: auto; background: #0f172a; color: #ffffff; border: 1.5px solid #10b981; border-radius: 12px; padding: 12px 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.35), 0 0 12px rgba(16, 185, 129, 0.3); display: flex; align-items: center; gap: 12px; animation: slideInUp 0.3s ease; max-width: 380px;';

  const avatarChar = (player.username || 'U').charAt(0).toUpperCase();
  toast.innerHTML = `
    <div style="width: 36px; height: 36px; border-radius: 50%; background: #10b981; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px; flex-shrink: 0;">
      ${avatarChar}
    </div>
    <div style="flex: 1; min-width: 0;">
      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #10b981; box-shadow: 0 0 6px #10b981;"></span>
        <span style="font-size: 11px; font-weight: 800; color: #34d399; text-transform: uppercase;">Real-Time New Player</span>
      </div>
      <div style="font-size: 13.5px; font-weight: 800; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
        ${player.username || 'Player'}
      </div>
      <div style="font-size: 11px; color: #94a3b8;">
        Code: <strong style="color: #38bdf8;">${player.profileCode || '-'}</strong> • ${player.telegram || 'Telegram'}
      </div>
    </div>
    <button type="button" style="background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid #10b981; border-radius: 8px; padding: 6px 10px; font-size: 11px; font-weight: 800; cursor: pointer; flex-shrink: 0; transition: all 0.2s;" onmouseover="this.style.background='#10b981'; this.style.color='#fff';" onmouseout="this.style.background='rgba(16, 185, 129, 0.2)'; this.style.color='#34d399';">
      View Details
    </button>
  `;

  const btn = toast.querySelector('button');
  if (btn) {
    btn.onclick = () => {
      if (typeof window.switchAdminPage === 'function') {
        window.switchAdminPage('users', 'User Analytics & Players');
      }
      if (typeof window.viewUserDetails === 'function') {
        window.viewUserDetails(player.uid);
      }
      toast.remove();
    };
  }

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.4s ease';
    setTimeout(() => toast.remove(), 450);
  }, 6500);
}
window.showRealtimeUserToast = showRealtimeUserToast;

window.getDb = () => db;
window.initFirebase = initFirebase;

