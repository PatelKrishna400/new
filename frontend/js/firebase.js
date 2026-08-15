/* ═══════════════════════════════════════════════════════════
   TAP EMPIRE — Firebase Client
   Project: tap-game-80070

   Authentication methods:
     • Email / Password
     • Google Sign-In
     • Phone (SMS OTP)

   Firestore: all reads + limited non-financial writes.
   Financial writes (ad rewards, withdrawals, Stars) go
   through Cloud Functions only.
═══════════════════════════════════════════════════════════ */

'use strict';

let db;
let auth;
let analytics;

/* ════════════════════════════════════════════════════════
   INIT
════════════════════════════════════════════════════════ */
function initFirebase() {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }

    auth = firebase.auth();
    db = firebase.firestore();
    analytics = firebase.analytics?.() ?? null;

    /* Offline persistence — non-fatal if tab already open */
    db.enablePersistence({ synchronizeTabs: false }).catch(err => {
      if (err.code !== 'failed-precondition' && err.code !== 'unimplemented') {
        console.warn('[Firestore persistence]', err.code);
      }
    });

    /* Persist auth state across page loads */
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(() => { });

    return true;
  } catch (e) {
    console.error('[Firebase init]', e);
    return false;
  }
}

/* ════════════════════════════════════════════════════════
   AUTHENTICATION — Email / Password
════════════════════════════════════════════════════════ */

/**
 * Sign up with email + password.
 * Returns the Firebase User on success.
 */
async function signUpEmail(email, password, displayName) {
  const cred = await auth.createUserWithEmailAndPassword(email, password);
  if (displayName) {
    await cred.user.updateProfile({ displayName });
  }
  await cred.user.sendEmailVerification();
  return cred.user;
}

/**
 * Sign in with email + password.
 */
async function signInEmail(email, password) {
  const cred = await auth.signInWithEmailAndPassword(email, password);
  return cred.user;
}

/**
 * Send a password reset email.
 */
async function sendPasswordReset(email) {
  await auth.sendPasswordResetEmail(email);
}

/* ════════════════════════════════════════════════════════
   AUTHENTICATION — Google Sign-In
════════════════════════════════════════════════════════ */

/**
 * Sign in with Google popup.
 * Returns the Firebase User on success.
 */
async function signInGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');
  const result = await auth.signInWithPopup(provider);
  return result.user;
}

/* ════════════════════════════════════════════════════════
   AUTHENTICATION — Phone (SMS OTP)
════════════════════════════════════════════════════════ */

let _recaptchaVerifier = null;
let _confirmationResult = null;

/**
 * Set up the invisible reCAPTCHA verifier.
 * Call once before sendPhoneOTP — pass the id of an empty <div>.
 *
 * @param {string} containerId  id of a div to render reCAPTCHA into
 */
function initRecaptcha(containerId) {
  if (_recaptchaVerifier) {
    _recaptchaVerifier.clear();
    _recaptchaVerifier = null;
  }
  _recaptchaVerifier = new firebase.auth.RecaptchaVerifier(containerId, {
    size: 'invisible',
    callback: () => { /* reCAPTCHA solved — proceed */ },
    'expired-callback': () => {
      console.warn('[reCAPTCHA] expired — reset verifier');
      _recaptchaVerifier = null;
    },
  });
  return _recaptchaVerifier;
}

/**
 * Send an SMS OTP to the given phone number.
 * Phone number must be in E.164 format: +1234567890
 *
 * @param {string} phoneNumber  E.164 phone number
 * @param {string} recaptchaContainerId  id of the reCAPTCHA container div
 */
async function sendPhoneOTP(phoneNumber, recaptchaContainerId = 'recaptcha-container') {
  const verifier = _recaptchaVerifier || initRecaptcha(recaptchaContainerId);
  _confirmationResult = await auth.signInWithPhoneNumber(phoneNumber, verifier);
  return _confirmationResult;
}

/**
 * Confirm the OTP code received via SMS.
 *
 * @param {string} code  6-digit OTP code
 */
async function confirmPhoneOTP(code) {
  if (!_confirmationResult) throw new Error('No pending phone verification. Call sendPhoneOTP first.');
  const cred = await _confirmationResult.confirm(code);
  _confirmationResult = null;
  return cred.user;
}

/* ════════════════════════════════════════════════════════
   AUTH STATE OBSERVER
   Call this once at boot. Resolves with the current user
   (or null if signed out) and sets up ongoing listener.
════════════════════════════════════════════════════════ */

/**
 * waitForAuthReady()
 * Resolves with the current Firebase user (or null) once
 * the auth state has been loaded from persistence.
 */
function waitForAuthReady() {
  return new Promise(resolve => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      unsubscribe();
      resolve(user);
    });
  });
}

/**
 * onAuthChange(callback)
 * Subscribes to ongoing auth state changes.
 * Returns the unsubscribe function.
 *
 * @param {(user: firebase.User|null) => void} callback
 */
function onAuthChange(callback) {
  return auth.onAuthStateChanged(callback);
}

/**
 * signOut — sign out the current user.
 */
async function signOutUser() {
  await auth.signOut();
}

/**
 * getCurrentUser — returns the currently signed-in Firebase User or null.
 */
function getCurrentUser() {
  return auth.currentUser;
}

/* ════════════════════════════════════════════════════════
   TELEGRAM ↔ FIREBASE AUTH BRIDGE
   In a Telegram Mini App the user is identified by their
   Telegram ID. We create a Firebase Anonymous session on
   first load and link it to the Telegram ID in Firestore.
   All Firestore rules use request.auth.uid == telegramId.
════════════════════════════════════════════════════════ */

/**
 * signInAnonymouslyIfNeeded()
 * Signs in anonymously so Firestore security rules can
 * validate request.auth.uid. The uid is set to the
 * Telegram user ID via a custom token from the backend
 * when available, otherwise falls back to anonymous.
 */
async function signInAnonymouslyIfNeeded() {
  if (auth.currentUser) return auth.currentUser;
  try {
    /* Preferred: get a custom token from backend that sets uid = telegramId */
    const tgId = String(STATE.tgUser?.id || '');
    if (tgId && tgId !== '0') {
      try {
        const { token } = await callAPI('/auth/custom-token', { telegramId: tgId });
        const cred = await auth.signInWithCustomToken(token);
        return cred.user;
      } catch (_) {
        /* Backend not yet deployed — fall through to anonymous */
      }
    }
    /* Fallback: anonymous auth (uid won't match telegramId) */
    const cred = await auth.signInAnonymously();
    return cred.user;
  } catch (e) {
    console.warn('[Firebase auth]', e.message);
    return null;
  }
}

/* ════════════════════════════════════════════════════════
   COLLECTION REFS
════════════════════════════════════════════════════════ */
const refs = {
  user: uid => db.collection('users').doc(String(uid)),
  txn: () => db.collection('transactions'),
  withdraw: () => db.collection('withdrawals'),
  config: () => db.collection('gameConfig').doc('economy'),
  leaderboard: () => db.collection('leaderboard').orderBy('coins', 'desc').limit(100),
  leaderUser: uid => db.collection('leaderboard').doc(String(uid)),
  adminLogs: () => db.collection('adminLogs'),
  starsRevenue: () => db.collection('gameConfig').doc('starsRevenue'),
  starsPurchases: () => db.collection('starsPurchases'),
  adSessions: () => db.collection('adSessions'),
  referrals: () => db.collection('referrals'),
};

/* ════════════════════════════════════════════════════════
   PLAYER LOAD / CREATE
════════════════════════════════════════════════════════ */
async function loadOrCreatePlayer() {
  const uid = String(STATE.tgUser?.id || 'demo_0');
  const ref = refs.user(uid);
  const snap = await ref.get();
  const now = firebase.firestore.FieldValue.serverTimestamp();

  if (!snap.exists) {
    const refParam = getReferralParam();
    const doc = {
      telegramId: uid,
      username: STATE.tgUser?.username || '',
      firstName: STATE.tgUser?.first_name || 'Player',
      photoUrl: STATE.tgUser?.photo_url || '',
      coins: 0,
      energy: DEFAULT_ECONOMY.energyMax,
      maxEnergy: DEFAULT_ECONOMY.energyMax,
      level: 1,
      xp: 0,
      tapPower: 1,
      criticalChance: DEFAULT_ECONOMY.criticalChanceBase,
      totalTaps: 0,
      totalAdViews: 0,
      adDailyCount: 0,
      adDailyDate: '',
      lastAdTs: 0,
      lastEnergyUpdate: Date.now(),
      boostMultiplier: 1,
      boostExpiry: 0,
      pendingWithdrawal: false,
      riskScore: 0,
      riskStatus: 'ok',
      lastSuspiciousEvent: null,
      bestCombo: 0,
      lastActiveTs: Date.now(),
      estimatedAdRevenue: 0,
      rewardLiability: 0,
      eligibleWithdrawal: 0,
      referredBy: refParam || '',
      createdAt: now,
      updatedAt: now,
    };
    await ref.set(doc);
    if (refParam && refParam !== uid) {
      callAPI('/rewards/referral', { referrerId: refParam, newUserId: uid }).catch(() => { });
    }
    return doc;
  }
  return snap.data();
}

/* ════════════════════════════════════════════════════════
   PERSIST USER — debounced, non-financial fields only
════════════════════════════════════════════════════════ */
let _persistTimer;
let _pendingPatch = {};

function persistUser(patch, immediate) {
  Object.assign(_pendingPatch, patch);
  clearTimeout(_persistTimer);

  const flush = async () => {
    if (!Object.keys(_pendingPatch).length) return;
    const uid = String(STATE.tgUser?.id || 'demo_0');
    const batch = {
      ..._pendingPatch,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };
    _pendingPatch = {};
    try {
      await refs.user(uid).update(batch);
    } catch (e) {
      Object.assign(_pendingPatch, batch); // re-queue
      console.warn('[persistUser]', e);
    }
  };

  if (immediate) return flush();
  _persistTimer = setTimeout(flush, 2000);
  return Promise.resolve();
}

/* ════════════════════════════════════════════════════════
   ECONOMY CONFIG
════════════════════════════════════════════════════════ */
async function loadEconomy() {
  try {
    const snap = await refs.config().get();
    if (snap.exists) Object.assign(STATE.economy, snap.data());
  } catch (_) { /* use DEFAULT_ECONOMY */ }
}

/* ════════════════════════════════════════════════════════
   LEADERBOARD
════════════════════════════════════════════════════════ */
async function loadLeaderboard() {
  try {
    const snap = await refs.leaderboard().get();
    STATE.leaderboard = snap.docs.map((d, i) => ({ rank: i + 1, id: d.id, ...d.data() }));
  } catch (_) { STATE.leaderboard = []; }
}

async function updateLeaderboard() {
  const uid = String(STATE.tgUser?.id || 'demo_0');
  try {
    await refs.leaderUser(uid).set({
      username: STATE.tgUser?.username || STATE.tgUser?.first_name || 'Player',
      firstName: STATE.tgUser?.first_name || 'Player',
      photoUrl: STATE.tgUser?.photo_url || '',
      coins: STATE.coins,
      level: STATE.level,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  } catch (_) { }
}

/* ════════════════════════════════════════════════════════
   TRANSACTIONS
════════════════════════════════════════════════════════ */
async function loadTransactions() {
  try {
    const uid = String(STATE.tgUser?.id || 'demo_0');
    const snap = await refs.txn()
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(40)
      .get();
    STATE.transactions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (_) { STATE.transactions = []; }
}

/* ════════════════════════════════════════════════════════
   RELOAD PLAYER
════════════════════════════════════════════════════════ */
async function reloadPlayer() {
  try {
    const uid = String(STATE.tgUser?.id || 'demo_0');
    const snap = await refs.user(uid).get();
    if (snap.exists) syncState(snap.data());
  } catch (e) { console.warn('[reloadPlayer]', e); }
}

/* ════════════════════════════════════════════════════════
   ADMIN HELPERS
════════════════════════════════════════════════════════ */
async function loadWithdrawalsByStatus(status) {
  try {
    const snap = await refs.withdraw()
      .where('status', '==', status)
      .orderBy('createdAt', 'desc')
      .limit(30)
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (_) { return []; }
}

/* ════════════════════════════════════════════════════════
   ANALYTICS HELPERS
════════════════════════════════════════════════════════ */
function logEvent(eventName, params = {}) {
  try { analytics?.logEvent(eventName, params); } catch (_) { }
}
