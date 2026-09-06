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
    if (val) {
      Object.keys(val).forEach(uid => {
        const data = val[uid] || {};
        const pl = data.player || {};
        const goalObj = data.goal || {};
        const goalStateObj = data.goalState || {};
        const tasksObj = data.tasksState || {};

        const dailyDone = tasksObj.claimedDaily ? Object.keys(tasksObj.claimedDaily).filter(k => tasksObj.claimedDaily[k]).length : 0;
        const webDone = tasksObj.claimedWebsite ? Object.keys(tasksObj.claimedWebsite).filter(k => tasksObj.claimedWebsite[k]).length : (pl.websiteTasksCompleted || 0);
        const tgDone = tasksObj.claimedTelegram ? Object.keys(tasksObj.claimedTelegram).filter(k => tasksObj.claimedTelegram[k]).length : 0;

        const goalLevel = goalObj.level !== undefined ? goalObj.level : (goalStateObj.currentLevel || 0);

        list.push({
          uid,
          username: pl.username || pl.name || 'User_' + uid.substring(0, 6),
          level: pl.level || 0,
          goalLevel: goalLevel,
          coins: pl.coins || 0,
          diamonds: pl.diamonds || 0,
          chestKeys: pl.chestKeys || 0,
          scratchCards: pl.scratchCards || 0,
          chestTickets: pl.chestTickets || 0,
          dailyTasksDone: dailyDone,
          webTasksDone: webDone,
          tasksCount: dailyDone + webDone + tgDone,
          lastActive: pl.lastActive || new Date().toISOString()
        });
      });
    }
    window.adminState.users = list;
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
