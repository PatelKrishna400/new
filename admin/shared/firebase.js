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

  // 1. Players
  db.ref('/players').on('value', snapshot => {
    const val = snapshot.val();
    const list = [];
    let totalSpins = 0;
    let totalChests = 0;
    let totalScratches = 0;
    let totalEggs = 0;
    if (val) {
      Object.keys(val).forEach(uid => {
        const data = val[uid] || {};
        const pl = data.player || {};
        const goalObj = data.goal || {};
        const goalStateObj = data.goalState || {};
        const tasksObj = data.tasksState || {};
        const xpStateObj = data.xpState || {};
        const reactorObj = data.reactor || {};
        const genObj = data.energyGenerator || {};
        const dailyStats = data.dailyStats || {};

        const dailyDone = tasksObj.claimedDaily ? Object.keys(tasksObj.claimedDaily).filter(k => tasksObj.claimedDaily[k]).length : 0;
        const monthlyDone = tasksObj.claimedMonthly ? Object.keys(tasksObj.claimedMonthly).filter(k => tasksObj.claimedMonthly[k]).length : (
          tasksObj.claimedDaily ? Object.keys(tasksObj.claimedDaily).filter(k => tasksObj.claimedDaily[k]).length : 0
        );
        const webDone = tasksObj.claimedWebsite ? Object.keys(tasksObj.claimedWebsite).filter(k => tasksObj.claimedWebsite[k]).length : (Number(pl.websiteTasksCompleted) || 0);
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

        // Deterministic profile code if not explicitly saved
        const cleanUid = uid.replace(/[^a-zA-Z0-9]/g, '');
        const profileCode = pl.profileCode || ('ET-' + (cleanUid.length >= 6 ? cleanUid.slice(-6).toUpperCase() : uid.toUpperCase()));

        const adsCount = (pl.adsWatchedCount !== undefined) ? Number(pl.adsWatchedCount) : (
          (Number(pl.watchedAds) || 0) +
          (Number(pl.adsButtonCount) || 0) +
          (xpStateObj ? (Number(xpStateObj.watchedAds) || 0) : 0) +
          (goalStateObj ? ((Number(goalStateObj.levelAdsWatched) || 0) + (Number(goalStateObj.megaWatchedAds) || 0)) : 0) +
          (dailyStats ? (Number(dailyStats.adsWatched) || 0) : 0)
        );

        totalSpins += (Number(dailyStats.spins) || Number(dailyStats.wheelSpins) || 0);
        totalChests += (Number(dailyStats.chests) || Number(dailyStats.chestsOpened) || 0);
        totalScratches += (Number(dailyStats.scratches) || Number(dailyStats.scratchCards) || 0);
        totalEggs += (Number(dailyStats.eggs) || Number(dailyStats.eggCoins) || 0);

        list.push({
          uid,
          profileCode,
          username: pl.username || pl.name || 'User_' + uid.substring(0, 6),
          handle: pl.handle || 'user_' + uid.substring(0, 6),
          telegram: pl.telegram || (pl.handle ? ('@' + pl.handle.replace(/^@/, '')) : ''),
          mobile: pl.mobile || pl.phone || '',
          level: pl.level || 0,
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
          lastActive: pl.lastActive || new Date().toISOString(),
          tasksState: tasksObj,
          goal: goalObj,
          goalState: goalStateObj,
          xpState: xpStateObj,
          reactor: reactorObj,
          energyGenerator: genObj,
          raw: data
        });
      });
    }
    window.adminState.users = list;
    window.adminState.gameStats = {
      totalSpins,
      totalChests,
      totalScratches,
      totalEggs
    };
    dispatchAdminEvent('usersUpdated');
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
    if (val && Array.isArray(val) && val.length > 0) {
      window.adminState.websiteTasks = val;
      dispatchAdminEvent('websiteTasksUpdated');
    }
  });

  // 5. Telegram Tasks Config
  db.ref('/telegram_tasks_config').on('value', snapshot => {
    const val = snapshot.val();
    if (val && Array.isArray(val) && val.length > 0) {
      window.adminState.telegramTasks = val;
      dispatchAdminEvent('telegramTasksUpdated');
    }
  });

  // 6. Monthly Competition Config (/monthly_competition)
  db.ref('/monthly_competition').on('value', snapshot => {
    const val = snapshot.val();
    if (val) {
      window.adminState.monthlyCompetition = val;
      dispatchAdminEvent('monthlyCompetitionUpdated');
    }
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

window.getDb = () => db;
window.initFirebase = initFirebase;
