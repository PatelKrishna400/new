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
      boostLevels: stateData.boostLevels || {},
      boostExpiries: stateData.boostExpiries || {},
      tasksProgress: stateData.tasksProgress || {},
      claimedTasks: stateData.claimedTasks || {},
      claimedXPLevels: stateData.claimedXPLevels || {},
      unclaimedXPLevels: stateData.unclaimedXPLevels || [],
      referrals: stateData.referrals || { invitedCount: 0, claimed: {} },
      userId: _userId,
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

async function fetchFirebaseLeaderboard() {
  try {
    if (_rtdb) {
      const snapshot = await _rtdb.ref('players').orderByChild('xp').limitToLast(10).once('value');
      if (snapshot.exists()) {
        const players = [];
        snapshot.forEach(child => {
          const val = child.val();
          players.push({
            id: child.key,
            name: val.userId ? `Player_${val.userId.slice(-4)}` : 'CryptoTapper',
            xp: val.xp || 0,
            level: val.level || 1
          });
        });
        return players.sort((a, b) => b.xp - a.xp);
      }
    }
  } catch (e) {
    console.warn('[Firebase Leaderboard Error]:', e);
  }
  return null;
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

/* ── FIREBASE RESTART DATA ENGINE ── */
async function restartFirebaseUserData() {
  try {
    const defaultData = {
      coins: 0,
      energy: 500,
      maxEnergy: 500,
      level: 1,
      xp: 0,
      goals: {
        level: 1,
        coinsTarget: 30,
        coinsProgress: 0,
        coinsReward: 5,
        keysTarget: 50,
        keysProgress: 0,
        keysReward: 1,
        spinsTarget: 20,
        spinsProgress: 0,
        spinsReward: 1,
        keysBalance: 0,
        ticketsBalance: 0,
        claimed: { coins: false, keys: false, spins: false }
      },
      tasksProgress: {},
      claimedTasks: {},
      claimedXPLevels: {},
      unclaimedXPLevels: [],
      lastSaved: Date.now()
    };

    localStorage.removeItem('tg_game_state');
    localStorage.removeItem('te_game_state');
    localStorage.setItem('tg_game_state', JSON.stringify(defaultData));

    if (_rtdb) {
      await _rtdb.ref('players/' + _userId).set(defaultData);
      console.log('[Firebase Restart] Data cleared in Firebase Realtime Database for user:', _userId);
    }
    return true;
  } catch (err) {
    console.warn('[Firebase Restart Warning]:', err);
    return false;
  }
}

/* ── 👥 FIREBASE REFERRAL CODE CONNECT & 100 COINS ENGINE ── */
function getUserReferralCode() {
  const cleanId = String(_userId).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const suffix = cleanId.length > 5 ? cleanId.slice(-5) : (cleanId + '88888').slice(0, 5);
  return 'REF-' + suffix;
}

async function registerUserReferralCodeInFirebase() {
  try {
    const myCode = getUserReferralCode();
    if (_rtdb) {
      await _rtdb.ref('referral_codes/' + myCode).set({
        userId: _userId,
        createdAt: Date.now()
      });
    }
    return myCode;
  } catch (e) {
    console.warn('[Register Referral Code Error]:', e);
    return getUserReferralCode();
  }
}

/**
 * Connects current player to another player via Firebase Referral Code
 * Grants +100 Coins per connected friend to claim after watching an ad
 */
async function connectPlayerReferralCodeInFirebase(enteredCodeInput) {
  try {
    if (!enteredCodeInput) return { success: false, error: 'Please enter a valid Referral Code!' };
    const codeClean = String(enteredCodeInput).trim().toUpperCase();
    const myCode = getUserReferralCode();

    if (codeClean === myCode) {
      return { success: false, error: 'You cannot connect to your own Referral Code!' };
    }

    // 1. Verify code in Firebase Realtime Database
    let referrerId = null;
    if (_rtdb) {
      const snap = await _rtdb.ref('referral_codes/' + codeClean).once('value');
      if (snap.exists()) {
        referrerId = snap.val().userId;
      } else {
        // Search by userId matching suffix
        const playersSnap = await _rtdb.ref('players').once('value');
        playersSnap.forEach(child => {
          const val = child.val();
          if (val.userId && getUserReferralCodeFor(val.userId) === codeClean) {
            referrerId = child.key;
          }
        });
      }
    }

    if (!referrerId && codeClean.startsWith('REF-')) {
      // Demo/fallback referrer connection
      referrerId = 'player_' + codeClean.slice(4).toLowerCase();
    }

    if (!referrerId) {
      return { success: false, error: 'Referral Code not found! Double check code and try again.' };
    }

    // 2. Connect accounts & update referrer & player in Firebase
    if (_rtdb) {
      // Update referrer: +1 friend connected, +100 unclaimed Coins
      const refRef = _rtdb.ref('players/' + referrerId + '/referrals');
      await refRef.child('connectedFriends/' + _userId).set({ connectedAt: Date.now() });
      await refRef.child('invitedCount').transaction(c => (c || 0) + 1);
      await refRef.child('unclaimedFriendCoins').transaction(c => (c || 0) + 100);
    }

    return {
      success: true,
      referrerId,
      code: codeClean,
      message: `🎉 Successfully connected to Player (${codeClean})! 💰 +100 Coins added per friend reward!`
    };
  } catch (err) {
    console.error('[connectPlayerReferralCode Exception]:', err);
    return { success: false, error: err.message };
  }
}

function getUserReferralCodeFor(userIdStr) {
  const cleanId = String(userIdStr).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const suffix = cleanId.length > 5 ? cleanId.slice(-5) : (cleanId + '88888').slice(0, 5);
  return 'REF-' + suffix;
}

