/* ═══════════════════════════════════════════════════════════
   TAP GAME — Production Firebase Integration (js/firebase.js)
   • Exact Web App Firebase Config
   • Firebase Realtime Database & Analytics Initialized
   • Automatic Sync for Player Stats (Coins, Energy, Level, XP, Keys, Tickets)
   • Atomic Incrementing Support & LocalStorage Fallback
 ═══════════════════════════════════════════════════════════ */

'use strict';

const firebaseConfig = {
  apiKey: "AIzaSyDnujl5_iBlSzwDfjCLA7sFQ7zW1DxROic",
  authDomain: "tap-game-80070.firebaseapp.com",
  databaseURL: "https://tap-game-80070-default-rtdb.firebaseio.com",
  projectId: "tap-game-80070",
  storageBucket: "tap-game-80070.firebasestorage.app",
  messagingSenderId: "1028935905694",
  appId: "1:1028935905694:web:1fc8bb35a959d99bbbe68f",
  measurementId: "G-EBXQ2KY1HL"
};

let _firebaseApp = null;
let _rtdb = null;
let _analytics = null;
let _userId = localStorage.getItem('tg_user_id') || ('user_' + Math.random().toString(36).substr(2, 9));
localStorage.setItem('tg_user_id', _userId);

// Initialize Firebase App, Database & Analytics
if (window.firebase) {
  try {
    if (!firebase.apps.length) {
      _firebaseApp = firebase.initializeApp(firebaseConfig);
    } else {
      _firebaseApp = firebase.app();
    }
    if (firebase.database) {
      _rtdb = firebase.database();
    }
    if (firebase.analytics) {
      _analytics = firebase.analytics();
    }
    console.log('[Firebase] App, Realtime Database & Analytics initialized for user:', _userId);
  } catch (e) {
    console.warn('[Firebase Init Warning]:', e);
  }
}

/* ── PERSISTENCE ENGINE ── */
async function saveUserDataToFirebase(stateData) {
  try {
    const payload = {
      coins: stateData.coins || 0,
      energy: Math.floor(stateData.energy || 500),
      maxEnergy: stateData.maxEnergy || 500,
      level: stateData.level || 1,
      xp: Number((stateData.xp || 0).toFixed(1)),
      goals: stateData.goals || {},
      tasksProgress: stateData.tasksProgress || {},
      claimedTasks: stateData.claimedTasks || {},
      claimedXPLevels: stateData.claimedXPLevels || {},
      unclaimedXPLevels: stateData.unclaimedXPLevels || [],
      lastSaved: Date.now()
    };

    // 1. Save to LocalStorage immediately
    localStorage.setItem('tg_game_state', JSON.stringify(payload));

    // 2. Sync to Firebase Realtime Database
    if (_rtdb) {
      await _rtdb.ref('players/' + _userId).update(payload);
    }
  } catch (err) {
    console.warn('[Firebase Save] Fallback mode active:', err);
  }
}

async function loadUserDataFromFirebase() {
  try {
    let stateData = null;

    // 1. Try Firebase Realtime Database first
    if (_rtdb) {
      const snapshot = await _rtdb.ref('players/' + _userId).once('value');
      if (snapshot.exists()) {
        stateData = snapshot.val();
      }
    }

    // 2. Fallback to LocalStorage if Firebase data not found
    if (!stateData) {
      const local = localStorage.getItem('tg_game_state');
      if (local) stateData = JSON.parse(local);
    }

    return stateData;
  } catch (err) {
    console.warn('[Firebase Load] Fallback mode active:', err);
    const local = localStorage.getItem('tg_game_state');
    return local ? JSON.parse(local) : null;
  }
}

/* ── ATOMIC INCREMENTER ENGINE ── */
function incrementFirebaseStat(statPath, amount = 1) {
  try {
    if (_rtdb) {
      const ref = _rtdb.ref('players/' + _userId + '/' + statPath);
      ref.transaction(current => (current || 0) + amount);
    }
  } catch (e) {
    console.warn('[Firebase Increment] Exception:', e);
  }
}
