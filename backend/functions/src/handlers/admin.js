'use strict';

/**
 * Admin API handlers
 * All routes require verifyInitData + requireAdmin middleware
 * (applied in index.js).
 *
 * POST /admin/stats          → platform overview
 * POST /admin/economy        → update economy config
 * POST /admin/stars-revenue  → Stars revenue summary
 */

const admin = require('firebase-admin');
const { requireAdmin }          = require('../middleware/auth');
const { refs, now, loadEconomy, logAdminAction, httpError } = require('../utils/helpers');

/* ── POST /admin/stats ── */
async function getStats(req, res, next) {
  try {
    requireAdmin(req, res, async () => {
      const db = admin.firestore();

      const [
        usersSnap,
        pendingWdSnap,
        revSnap,
        ecoSnap,
      ] = await Promise.all([
        db.collection('users').count().get(),
        db.collection('withdrawals').where('status', '==', 'pending').count().get(),
        refs.starsRevenue().get(),
        refs.config().get(),
      ]);

      const eco           = ecoSnap.exists ? ecoSnap.data() : {};
      const rev           = revSnap.exists ? revSnap.data() : {};
      const totalUsers    = usersSnap.data().count;
      const pendingWd     = pendingWdSnap.data().count;

      const estMonthlyAd  = (eco.estimatedCPM || 2.0) *
        (eco.adFillRate || 1.0) / 1000 * totalUsers * 30;

      return res.json({
        ok: true,
        stats: {
          totalUsers,
          pendingWithdrawals: pendingWd,
          starsRevenue: {
            totalStars: rev.totalStars || 0,
            totalUSD:   (rev.totalUSD  || 0).toFixed(2),
            updatedAt:  rev.updatedAt  || null,
          },
          estimates: {
            monthlyAdRevenue: estMonthlyAd.toFixed(2),
            revenueTarget:    eco.monthlyRevenueTarget || 1000,
          },
          payoutPaused: eco.globalPayoutPaused || false,
        },
      });
    });
  } catch (err) {
    return next(err);
  }
}

/* ── POST /admin/economy ── */
async function updateEconomy(req, res, next) {
  try {
    requireAdmin(req, res, async () => {
      const ALLOWED_KEYS = new Set([
        'coinsPerTap', 'tapRateLimit', 'energyMax',
        'rewardAdCooldownSeconds', 'maximumRewardAdsPerDay',
        'minimumWithdrawalCoins', 'minimumWithdrawalLevel',
        'minimumWithdrawalAdViews', 'coinsPerStar',
        'payoutRatio', 'revenueReserve',
        'referralRewardCoins', 'referralNewUserCoins',
        'monthlyRevenueTarget', 'globalPayoutPaused',
        'estimatedCPM', 'adFillRate',
      ]);

      const patch = {};
      for (const [k, v] of Object.entries(req.body || {})) {
        if (k === 'initData') continue;            // skip auth field
        if (!ALLOWED_KEYS.has(k)) continue;        // whitelist only
        if (typeof v !== 'number' && typeof v !== 'boolean') continue;
        patch[k] = v;
      }

      if (Object.keys(patch).length === 0) {
        throw httpError(400, 'No valid economy fields provided');
      }

      await refs.config().set({ ...patch, updatedAt: now() }, { merge: true });
      await logAdminAction(req.tgUser.id, 'economy_updated', patch);

      return res.json({ ok: true, updated: patch });
    });
  } catch (err) {
    return next(err);
  }
}

/* ── POST /admin/stars-revenue ── */
async function getStarsRevenue(req, res, next) {
  try {
    requireAdmin(req, res, async () => {
      const [revSnap, purchasesSnap] = await Promise.all([
        refs.starsRevenue().get(),
        refs.starsPurchases()
          .orderBy('createdAt', 'desc')
          .limit(50)
          .get(),
      ]);

      const rev       = revSnap.exists ? revSnap.data() : {};
      const purchases = purchasesSnap.docs.map(d => ({
        id: d.id, ...d.data(),
      }));

      return res.json({
        ok: true,
        revenue: {
          totalStars: rev.totalStars || 0,
          totalUSD:   (rev.totalUSD  || 0).toFixed(2),
          updatedAt:  rev.updatedAt  || null,
        },
        recentPurchases: purchases,
      });
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getStats, updateEconomy, getStarsRevenue };
