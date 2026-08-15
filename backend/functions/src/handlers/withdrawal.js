'use strict';

/**
 * Withdrawal handler
 *
 * POST /withdrawal/request
 *   Body: { initData }  (user + amount derived server-side from Firestore)
 *
 * All validation is server-authoritative:
 *   - Minimum coins, level, ad views from Firestore economy config
 *   - Risk status check
 *   - Global payout pause flag
 *   - No pending withdrawal already in flight
 *   - Atomic transaction: zero coins + create withdrawal record
 */

const admin = require('firebase-admin');
const {
  refs, now,
  loadEconomy, writeTxn, httpError,
} = require('../utils/helpers');

async function requestWithdrawal(req, res, next) {
  try {
    const uid = req.tgUser.id;
    const eco = await loadEconomy();

    // ── Global pause check ──
    if (eco.globalPayoutPaused) {
      throw httpError(503, 'Withdrawals are temporarily paused');
    }

    const db      = admin.firestore();
    const userRef = refs.user(uid);

    let payoutStars = 0;
    let coinsSpent  = 0;

    await db.runTransaction(async (t) => {
      const snap = await t.get(userRef);
      if (!snap.exists) throw httpError(404, 'User not found');

      const user = snap.data();

      // ── Server-side requirement checks ──
      if (user.riskStatus === 'suspended') {
        throw httpError(403, 'Account suspended — contact support');
      }
      if (user.riskStatus === 'review') {
        throw httpError(403, 'Account under review — contact support');
      }
      if (user.pendingWithdrawal) {
        throw httpError(409, 'You already have a pending withdrawal');
      }

      const coins    = user.coins    || 0;
      const level    = user.level    || 1;
      const adViews  = user.totalAdViews || 0;

      const minCoins = eco.minimumWithdrawalCoins    || 100000;
      const minLevel = eco.minimumWithdrawalLevel    || 10;
      const minAds   = eco.minimumWithdrawalAdViews  || 20;
      const minStars = eco.minimumWithdrawalStars    || 10;
      const cps      = eco.coinsPerStar              || 10000;

      if (coins < minCoins) {
        throw httpError(400, `Minimum ${minCoins.toLocaleString()} coins required (you have ${coins.toLocaleString()})`);
      }
      if (level < minLevel) {
        throw httpError(400, `Minimum level ${minLevel} required (you are level ${level})`);
      }
      if (adViews < minAds) {
        throw httpError(400, `Minimum ${minAds} bonus rewards required (you have ${adViews})`);
      }

      const stars = Math.floor(coins / cps);
      if (stars < minStars) {
        throw httpError(400, `Minimum ⭐ ${minStars} required (you would receive ⭐ ${stars})`);
      }

      payoutStars = stars;
      coinsSpent  = coins;

      // Compute estimated eligible USD (display only — not a guarantee)
      const payoutRatio   = eco.payoutRatio            || 0.30;
      const estAdRevenue  = user.estimatedAdRevenue    || 0;
      const eligibleUSD   = estAdRevenue * payoutRatio;

      // ── Atomic write ──
      t.update(userRef, {
        coins:             0,
        pendingWithdrawal: true,
        updatedAt:         now(),
      });

      t.set(refs.withdrawals().doc(), {
        telegramId:      uid,
        username:        user.username    || '',
        firstName:       user.firstName   || '',
        requestedCoins:  coinsSpent,
        payoutAmount:    payoutStars,
        payoutCurrency:  'XTR',
        eligibleUSD:     eligibleUSD,
        status:          'pending',
        riskStatus:      user.riskStatus  || 'ok',
        riskScore:       user.riskScore   || 0,
        createdAt:       now(),
        reviewedAt:      null,
        completedAt:     null,
        adminNote:       null,
      });

      writeTxn(
        t, uid, 'withdrawal',
        -coinsSpent,
        `Withdrawal request — ⭐ ${payoutStars} Stars`
      );
    });

    return res.json({
      ok:         true,
      stars:      payoutStars,
      coinsSpent,
      message:    `Withdrawal requested: ⭐ ${payoutStars} Stars. Processing: 1–3 business days.`,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { requestWithdrawal };
