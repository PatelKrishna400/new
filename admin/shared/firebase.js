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

// Global Admin Shared State
window.adminState = {
  activePage: 'dashboard',
  users: [],
  rewards: [],
  requests: [],
  customRequests: [],
  websiteTasks: [],
  telegramTasks: [],
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

function setFirebaseOnline(isOnline) {
  window.adminState.isFirebaseConnected = isOnline;
  const dot = document.getElementById('firebaseStatusDot');
  const text = document.getElementById('firebaseStatusText');
  if (dot && text) {
    if (isOnline) {
      dot.className = 'status-dot online';
      text.textContent = 'Cloud Live (RTDB)';
    } else {
      dot.className = 'status-dot';
      text.textContent = 'Disconnected / Offline';
    }
  }
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
      lastActive: pl.lastActive || data.lastActive || new Date().toISOString(),
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
  });

  // Real-time listener for /users (legacy or secondary node)
  db.ref('/users').on('value', snapshot => {
    const val = snapshot.val() || {};
    Object.keys(legacyUsersCache).forEach(k => delete legacyUsersCache[k]);
    Object.assign(legacyUsersCache, val);
    syncAllUsersFromCaches();
    isInitialUsersLoaded = true;
  });

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
  });

  db.ref('/players').on('child_changed', snapshot => {
    const uid = snapshot.key;
    const val = snapshot.val();
    if (uid && val) {
      playersCache[uid] = val;
      syncAllUsersFromCaches();
    }
  });

  db.ref('/players').on('child_removed', snapshot => {
    const uid = snapshot.key;
    if (uid && playersCache[uid]) {
      delete playersCache[uid];
      knownUserUids.delete(uid);
      syncAllUsersFromCaches();
    }
  });

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
    dispatchAdminEvent('rewardsUpdated');
  });

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
    dispatchAdminEvent('requestsUpdated');
  });

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
    dispatchAdminEvent('websiteTasksUpdated');
  });

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
    dispatchAdminEvent('telegramTasksUpdated');
  });

  // 6. Monthly Competition Config (/monthly_competition)
  db.ref('/monthly_competition').on('value', snapshot => {
    const val = snapshot.val();
    if (val) {
      window.adminState.monthlyCompetition = val;
      dispatchAdminEvent('monthlyCompetitionUpdated');
    }
  });

  // 7. Ads Configuration (/ads_config)
  db.ref('/ads_config').on('value', snapshot => {
    const val = snapshot.val();
    if (val) {
      window.adminState.adsConfig = val;
      dispatchAdminEvent('adsConfigUpdated');
    }
  });

  // 8. Direct Link Ads Clicks (/ads_direct_clicks)
  db.ref('/ads_direct_clicks').on('value', snapshot => {
    const val = snapshot.val();
    const list = [];
    if (val) {
      Object.keys(val).forEach(k => list.push({ id: k, ...val[k] }));
    }
    window.adminState.directClicks = list;
    dispatchAdminEvent('directClicksUpdated');
  });

  // 9. Ads Analytics (/ads_analytics)
  db.ref('/ads_analytics').on('value', snapshot => {
    const val = snapshot.val();
    if (val) {
      window.adminState.adsAnalytics = val;
      dispatchAdminEvent('adsAnalyticsUpdated');
    }
  });
  // 10. Admin Users (/admin_users) - Strictly authorized admins (No auto-seeding)
  db.ref('/admin_users').on('value', snapshot => {
    const val = snapshot.val();
    let list = [];
    if (val && typeof val === 'object') {
      list = Object.keys(val).map(k => ({ username: k, ...val[k] }));
    }
    window.adminState.adminUsers = list;
    dispatchAdminEvent('adminUsersUpdated');
  });

  // 11. Global Website & Game Config (/game_config) - Pure editable Firebase connection (No auto-seeding)
  db.ref('/game_config').on('value', snapshot => {
    const val = snapshot.val();
    if (val && typeof val === 'object') {
      window.adminState.gameConfig = val;
    } else {
      window.adminState.gameConfig = {};
    }
    dispatchAdminEvent('gameConfigUpdated');
  });
}

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

