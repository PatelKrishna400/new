'use strict';

const admin = require('firebase-admin');

/* ── Firestore shorthand ── */
const db  = () => admin.firestore();
const now = () => admin.firestore.FieldValue.serverTimestamp();
const inc = (n) => admin.firestore.FieldValue.increment(n);

/* ── Collection reference helpers ── */
const refs = {
  user:          (uid)  => db().collection('users').doc(String(uid)),
  leaderboard:   (uid)  => db().collection('leaderboard').doc(String(uid)),
  transactions:  ()     => db().collection('transactions'),
  withdrawals:   ()     => db().collection('withdrawals'),
  config:        ()     => db().collection('gameConfig').doc('economy'),
  starsRevenue:  ()     => db().collection('gameConfig').doc('starsRevenue'),
  starsPurchases:()     => db().collection('starsPurchases'),
  adSessions:    ()     => db().collection('adSessions'),
  referrals:     ()     => db().collection('referrals'),
  adminLogs:     ()     => db().collection('adminLogs'),
};

/* ── Load economy config (with defaults) ── */
const DEFAULT_ECONOMY = {
  coinsPerTap:                  1,
  criticalChanceBase:           0.05,
  criticalMultiplier:           10,
  energyMax:                    500,
  rewardAdCooldownSeconds:      60,
  maximumRewardAdsPerDay:       10,
  maximumRewardAdsPerSession:   5,
  adRewardCoins:                500,
  offlineRewardCoinsPerHour:    100,
  chestBaseReward:              500,
  dailyBonusCoins:              1000,
  minimumWithdrawalCoins:       100000,
  minimumWithdrawalStars:       10,
  minimumWithdrawalLevel:       10,
  minimumWithdrawalAdViews:     20,
  coinsPerStar:                 10000,
  maximumDailyWithdrawalCoins:  500000,
  payoutRatio:                  0.30,
  revenueReserve:               0.30,
  globalPayoutPaused:           false,
  referralRewardCoins:          2000,
  referralNewUserCoins:         500,
  estimatedCPM:                 2.0,
  adFillRate:                   1.0,
  monthlyRevenueTarget:         1000,
};

async function loadEconomy() {
  try {
    const snap = await refs.config().get();
    if (snap.exists) return { ...DEFAULT_ECONOMY, ...snap.data() };
  } catch (e) {
    console.warn('[helpers] loadEconomy failed, using defaults:', e.message);
  }
  return { ...DEFAULT_ECONOMY };
}

/* ── Write a transaction record ── */
async function writeTxn(t, userId, type, delta, desc) {
  const ref = refs.transactions().doc();
  const doc = {
    userId: String(userId),
    type,
    delta,
    desc,
    createdAt: now(),
  };
  if (t) {
    t.set(ref, doc);
  } else {
    await ref.set(doc);
  }
}

/* ── Log an admin action ── */
async function logAdminAction(adminId, action, data) {
  try {
    await refs.adminLogs().add({
      adminId: String(adminId),
      action,
      data,
      createdAt: now(),
    });
  } catch (_) {}
}

/* ── Validate that a string is a safe Firestore document ID ── */
function isSafeId(str) {
  if (typeof str !== 'string') return false;
  if (str.length === 0 || str.length > 128) return false;
  // Disallow path traversal characters
  return !/[\/\0]/.test(str);
}

/* ── Clamp a number between min and max ── */
function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

/* ── Consistent error factory ── */
function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  err.expose  = true;
  return err;
}

module.exports = {
  db, now, inc, refs,
  DEFAULT_ECONOMY, loadEconomy,
  writeTxn, logAdminAction,
  isSafeId, clamp, httpError,
};
