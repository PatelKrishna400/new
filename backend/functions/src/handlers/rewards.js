'use strict';

/**
 * Reward handlers
 *
 * POST /rewards/referral
 *   Body: { referrerId, newUserId }   (+ initData — verified by middleware)
 *   Grants referral coins to referrer and welcome bonus to new user.
 *   Idempotent: duplicate calls for the same pair are ignored.
 *
 * POST /rewards/ad-complete
 *   Body: { sessionId, type, baseReward }  (+ initData)
 *   Validates ad session document (written by client before showing ad),
 *   grants reward, marks session as used. Prevents replay.
 */

const admin = require('firebase-admin');
const {
  refs, now, inc,
  loadEconomy, writeTxn,
  isSafeId, httpError,
} = require('../utils/helpers');

/* ══════════════════════════════════════
   POST /rewards/referral
══════════════════════════════════════ */
async function handleReferral(req, res, next) {
  try {
    const callerId   = req.tgUser.id;              // verified by middleware
    const { referrerId, newUserId } = req.body;

    if (!isSafeId(referrerId) || !isSafeId(newUserId)) {
      throw httpError(400, 'Invalid referrerId or newUserId');
    }
    if (referrerId === newUserId) {
      throw httpError(400, 'Cannot refer yourself');
    }
    // The caller must be the new user
    if (callerId !== String(newUserId)) {
      throw httpError(403, 'Caller must be the new user');
    }

    const eco    = await loadEconomy();
    const reward = eco.referralRewardCoins   || 2000;
    const welcome= eco.referralNewUserCoins  || 500;

    const db = admin.firestore();

    // Idempotency: one referral record per (referrerId, newUserId) pair
    const refDocId  = `${referrerId}_${newUserId}`;
    const refDocRef = refs.referrals().doc(refDocId);

    await db.runTransaction(async (t) => {
      const refSnap = await t.get(refDocRef);
      if (refSnap.exists) {
        // Already processed — silently succeed (idempotent)
        return;
      }

      const referrerRef = refs.user(referrerId);
      const newUserRef  = refs.user(newUserId);
      const [referrerSnap, newUserSnap] = await Promise.all([
        t.get(referrerRef),
        t.get(newUserRef),
      ]);

      if (!referrerSnap.exists) throw httpError(404, 'Referrer not found');
      if (!newUserSnap.exists)  throw httpError(404, 'New user not found');

      // Grant referrer reward
      t.update(referrerRef, {
        coins:     inc(reward),
        updatedAt: now(),
      });

      // Grant new user welcome bonus
      t.update(newUserRef, {
        coins:     inc(welcome),
        updatedAt: now(),
      });

      // Write referral record
      t.set(refDocRef, {
        referrerId: String(referrerId),
        newUserId:  String(newUserId),
        reward,
        welcome,
        createdAt:  now(),
      });

      // Transaction records
      writeTxn(t, referrerId, 'referral_reward',  reward,  `Referral bonus — new user ${newUserId}`);
      writeTxn(t, newUserId,  'welcome_bonus',     welcome, `Welcome bonus from referral`);
    });

    return res.json({ ok: true, reward, welcome });
  } catch (err) {
    return next(err);
  }
}

/* ══════════════════════════════════════
   POST /rewards/ad-complete
══════════════════════════════════════ */
async function handleAdComplete(req, res, next) {
  try {
    const uid = req.tgUser.id;
    const { sessionId, type, baseReward } = req.body;

    if (!isSafeId(sessionId)) {
      throw httpError(400, 'Invalid sessionId');
    }
    if (typeof baseReward !== 'number' || baseReward < 0 || baseReward > 1_000_000) {
      throw httpError(400, 'Invalid baseReward');
    }

    const eco          = await loadEconomy();
    const cooldownMs   = (eco.rewardAdCooldownSeconds || 60) * 1000;
    const maxPerDay    = eco.maximumRewardAdsPerDay   || 10;
    const adMultiplier = 2; // 2× reward for watching ad

    const db         = admin.firestore();
    const sessionRef = refs.adSessions().doc(sessionId);
    const userRef    = refs.user(uid);

    let finalReward = 0;

    await db.runTransaction(async (t) => {
      const [sessionSnap, userSnap] = await Promise.all([
        t.get(sessionRef),
        t.get(userRef),
      ]);

      if (!sessionSnap.exists) {
        throw httpError(404, 'Ad session not found — must be created by client before showing ad');
      }

      const session = sessionSnap.data();

      // Verify session belongs to this user
      const sessionUser = session.telegramId || session.userId;
      if (sessionUser !== uid) {
        throw httpError(403, 'Session does not belong to caller');
      }

      // Prevent replay
      if (session.status === 'rewarded') {
        throw httpError(409, 'Ad session already rewarded');
      }
      if (session.status === 'expired') {
        throw httpError(410, 'Ad session expired');
      }

      if (!userSnap.exists) throw httpError(404, 'User not found');
      const user = userSnap.data();

      // Daily limit check (server-authoritative)
      const today       = new Date().toDateString();
      const dailyDate   = user.adDailyDate || '';
      const dailyCount  = dailyDate === today ? (user.adDailyCount || 0) : 0;
      if (dailyCount >= maxPerDay) {
        throw httpError(429, `Daily ad limit reached (${maxPerDay}/day)`);
      }

      // Cooldown check (server-authoritative)
      const lastAdTs = user.lastAdTs || 0;
      if (Date.now() - lastAdTs < cooldownMs) {
        const remaining = Math.ceil((lastAdTs + cooldownMs - Date.now()) / 1000);
        throw httpError(429, `Ad cooldown — wait ${remaining}s`);
      }

      // Calculate reward
      finalReward = Math.ceil(baseReward * adMultiplier);

      // Estimate revenue contribution (display only — not real money)
      const cpm       = eco.estimatedCPM  || 2.0;
      const fillRate  = eco.adFillRate    || 1.0;
      const estRevContribution = (cpm * fillRate) / 1000;

      // Update user
      t.update(userRef, {
        coins:            inc(finalReward),
        totalAdViews:     inc(1),
        adDailyCount:     dailyDate === today ? inc(1) : 1,
        adDailyDate:      today,
        lastAdTs:         Date.now(),
        estimatedAdRevenue: inc(estRevContribution),
        updatedAt:        now(),
      });

      // Mark session rewarded
      t.update(sessionRef, {
        status:      'rewarded',
        reward:      finalReward,
        rewardedAt:  now(),
      });

      // Transaction record
      writeTxn(t, uid, 'ad_reward', finalReward, `Ad reward — ${type || 'collection'}`);
    });

    return res.json({ ok: true, reward: finalReward });
  } catch (err) {
    return next(err);
  }
}

module.exports = { handleReferral, handleAdComplete };
