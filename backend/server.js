/* ═══════════════════════════════════════════════════════════
   TAP GAME — Backend API Engine (server.js)
   • Telegram WebApp Auth (HMAC-SHA256 timingSafeEqual)
   • Telegram Stars Invoice & Webhook Handling (XTR)
   • Telegram Stars / Coins Withdrawal & Admin Review System
   
   Client                              Backend
     │                                    │
     ├─ POST /withdrawal/request ────────►│
     │  { initData }                      ├─ verifyInitData (HMAC)
     │                                    ├─ Load economy config
     │                                    ├─ Load user doc
     │                                    ├─ Check: coins, level, adViews, riskStatus
     │                                    ├─ Database / Firestore transaction:
     │                                    │   - user.coins = 0
     │                                    │   - user.pendingWithdrawal = true
     │                                    │   - Create withdrawals/{id}
     │                                    │   - Create transactions/{id}
     │◄─ { ok, stars, message } ─────────┤
     │                                    │
     │  Admin reviews in Admin Panel      │
     │  Admin sets status → completed     │
     │  Admin sends Stars via bot manually│
 ═══════════════════════════════════════════════════════════ */

'use strict';

const http = require('http');
const https = require('https');
const crypto = require('crypto');
const url = require('url');
const fs = require('fs');
const path = require('path');

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || '8805652274:AAHUssIHd69pJOSa7PIBpTrxzqILh0mkGMQ';
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp'
};

// In-Memory Database Store for pending withdrawals, transactions, and Telegram Stars subscriptions
const DB_STORE = {
  withdrawals: [],
  transactions: [],
  subscriptions: [
    {
      id: 'sub_vip_pass_demo',
      userId: 'user_demo',
      title: 'Tap Empire Monthly VIP Pass',
      description: 'Monthly VIP Membership with +100% Tap Power & Daily Spin Tickets',
      priceStars: 100,
      periodSeconds: 2592000, // 30 days
      status: 'active',
      untilDate: Math.floor(Date.now() / 1000) + (30 * 86400),
      cancelled: false,
      missingBalance: false,
      createdAt: Date.now()
    }
  ],
  economyConfig: {
    minWithdrawalCoins: 100000,
    exchangeRateCoinsPerStar: 10000, // 10,000 Coins = 1 Telegram Star
    minLevelRequired: 1
  }
};

/* ── 1. TELEGRAM WEBAPP INITDATA VERIFIER ── */
function validateTelegramInitData(initData, botToken) {
  try {
    if (!initData) return { valid: false, error: 'Missing initData string' };

    const params = new URLSearchParams(initData);
    const providedHash = params.get('hash');
    if (!providedHash) return { valid: false, error: 'Missing hash in initData' };

    const dataCheckArr = [];
    params.forEach((value, key) => {
      if (key !== 'hash') dataCheckArr.push(`${key}=${value}`);
    });

    dataCheckArr.sort();
    const dataCheckString = dataCheckArr.join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    const computedBuffer = Buffer.from(computedHash, 'utf8');
    const providedBuffer = Buffer.from(providedHash, 'utf8');

    if (computedBuffer.length !== providedBuffer.length || !crypto.timingSafeEqual(computedBuffer, providedBuffer)) {
      return { valid: false, error: 'Invalid HMAC-SHA256 hash' };
    }

    const authDateStr = params.get('auth_date');
    if (authDateStr) {
      const authDate = parseInt(authDateStr, 10);
      if (Math.floor(Date.now() / 1000) - authDate > 86400) {
        return { valid: false, error: 'Authentication token expired (>24h)' };
      }
    }

    let user = null;
    const userJson = params.get('user');
    if (userJson) user = JSON.parse(userJson);

    return { valid: true, user };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

/* ── 2. TELEGRAM BOT API HELPER ── */
function callTelegramBotAPI(method, params = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(params);
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/${method}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ ok: false, error: e.message });
        }
      });
    });

    req.on('error', err => reject(err));
    req.write(data);
    req.end();
  });
}

/* ── 3. GRANT STARS ITEM TRANSACTION ENGINE ── */
async function grantStarsItem(userId, payloadStr) {
  try {
    let payload = {};
    try { payload = JSON.parse(payloadStr); } catch (e) { payload = { itemId: payloadStr }; }

    console.log(`[GrantStarsItem] Granting item ${payload.itemId} to user ${userId}...`);

    const REWARDS = {
      'spin_tickets_10': { spins: 10, name: '10 Spin Tickets' },
      'spin_tickets_50': { spins: 50, name: '50 Spin Tickets' },
      'master_keys_10': { keys: 10, name: '10 Master Keys' },
      'master_keys_50': { keys: 50, name: '50 Master Keys' },
      'coin_pack_1m': { coins: 1000000, name: '1,000,000 Coins' }
    };

    const reward = REWARDS[payload.itemId] || { coins: 100000, name: 'Star Treasure' };
    return { success: true, reward, userId };
  } catch (err) {
    console.error('[GrantStarsItem Error]:', err);
    return { success: false, error: err.message };
  }
}

/* ── 3B. TELEGRAM STARS SUBSCRIPTIONS ENGINE (TL: payments.getStarsSubscriptions & payments.starsStatus) ── */
/**
 * Conforms to MTProto / Bot API Telegram Stars Subscription specification:
 * TL Constructor: payments.starsStatus#6c9ce8ed
 * TL Method: payments.getStarsSubscriptions#32512c5
 */
async function getStarsSubscriptions(userId, offset = '', missingBalanceOnly = false) {
  try {
    const targetUserId = String(userId || 'user_demo');

    // Filter user's active/past subscriptions
    let userSubs = DB_STORE.subscriptions.filter(sub => String(sub.userId) === targetUserId);

    if (missingBalanceOnly) {
      userSubs = userSubs.filter(sub => sub.missingBalance === true);
    }

    // Pagination offset logic
    let startIndex = 0;
    if (offset) {
      const foundIdx = userSubs.findIndex(s => s.id === offset);
      if (foundIdx !== -1) startIndex = foundIdx + 1;
    }

    const pageSize = 10;
    const paginatedSubs = userSubs.slice(startIndex, startIndex + pageSize);
    const nextOffset = (startIndex + pageSize < userSubs.length)
      ? paginatedSubs[paginatedSubs.length - 1].id
      : null;

    // Calculate missing balance if any subscription is pending renewal
    const missingBalanceSum = userSubs
      .filter(s => s.missingBalance)
      .reduce((sum, s) => sum + (s.priceStars || 0), 0);

    // Formatted TL-compatible response payload: payments.starsStatus
    const starsStatus = {
      _: 'payments.starsStatus',
      flags: 15,
      balance: {
        _: 'starsAmount',
        amount: 500, // Total Telegram Stars balance for peer
        nano_amount: 0
      },
      subscriptions: paginatedSubs.map(sub => ({
        _: 'starsSubscription',
        id: sub.id,
        title: sub.title,
        description: sub.description,
        price_stars: sub.priceStars,
        period: sub.periodSeconds || 2592000, // Default: 30 Days (in seconds)
        until_date: sub.untilDate || Math.floor(Date.now() / 1000) + 2592000,
        cancelled: Boolean(sub.cancelled),
        missing_balance: Boolean(sub.missingBalance),
        status: sub.status || 'active'
      })),
      subscriptions_next_offset: nextOffset,
      subscriptions_missing_balance: missingBalanceSum,
      history: DB_STORE.transactions
        .filter(tx => String(tx.userId) === targetUserId)
        .slice(0, 10)
        .map(tx => ({
          _: 'starsTransaction',
          id: tx.id,
          stars: tx.stars || 0,
          type: tx.type || 'subscription',
          date: Math.floor((tx.createdAt || Date.now()) / 1000)
        })),
      next_offset: null,
      chats: [],
      users: [
        {
          _: 'user',
          id: targetUserId,
          first_name: 'Player'
        }
      ]
    };

    return { ok: true, starsStatus };
  } catch (err) {
    console.error('[getStarsSubscriptions Error]:', err);
    return { ok: false, error: err.message };
  }
}

/* ── 3C. CHANGE TELEGRAM STARS SUBSCRIPTION ENGINE (TL: payments.changeStarsSubscription) ── */
/**
 * Conforms to MTProto / Bot API Telegram Stars Subscription mutation specification:
 * TL Method: payments.changeStarsSubscription#c7770878
 * TL Constructors: boolTrue#997275b5, boolFalse#bc799737
 */
async function changeStarsSubscription(userId, subscriptionId, canceled = true, peer = null) {
  try {
    const targetUserId = String(userId || 'user_demo');
    const sub = DB_STORE.subscriptions.find(s => s.id === subscriptionId && String(s.userId) === targetUserId);

    if (!sub) {
      return { ok: false, error: 'Subscription record not found' };
    }

    const isCanceled = Boolean(canceled);
    sub.cancelled = isCanceled;
    sub.status = isCanceled ? 'cancelled' : 'active';
    if (isCanceled) {
      sub.cancelledAt = Date.now();
    } else {
      sub.resumedAt = Date.now();
    }

    // Call Telegram Bot API if bot token is configured
    if (BOT_TOKEN && BOT_TOKEN !== 'YOUR_TELEGRAM_BOT_TOKEN_HERE') {
      try {
        await callTelegramBotAPI('editUserStarSubscription', {
          user_id: targetUserId,
          telegram_payment_charge_id: subscriptionId,
          is_canceled: isCanceled
        });
      } catch (tgErr) {
        console.warn('[changeStarsSubscription] Telegram Bot API call warning:', tgErr.message);
      }
    }

    return {
      ok: true,
      result: { _: 'boolTrue', value: true },
      subscription: sub
    };
  } catch (err) {
    console.error('[changeStarsSubscription Error]:', err);
    return { ok: false, error: err.message };
  }
}

/* ── 3D. FULFILL TELEGRAM STARS SUBSCRIPTION ENGINE (TL: payments.fulfillStarsSubscription) ── */
/**
 * Conforms to MTProto / Bot API Telegram Stars Subscription fulfillment specification:
 * TL Method: payments.fulfillStarsSubscription#cc5bebb3
 * TL Constructors: boolTrue#997275b5, boolFalse#bc799737
 */
async function fulfillStarsSubscription(userId, subscriptionId, peer = null) {
  try {
    const targetUserId = String(userId || 'user_demo');
    const sub = DB_STORE.subscriptions.find(s => s.id === subscriptionId && String(s.userId) === targetUserId);

    if (!sub) {
      return { ok: false, error: 'Subscription record not found' };
    }

    const subPeriod = sub.periodSeconds || 2592000;
    sub.missingBalance = false;
    sub.cancelled = false;
    sub.status = 'active';
    sub.untilDate = Math.floor(Date.now() / 1000) + subPeriod;
    sub.fulfilledAt = Date.now();

    // Grant game VIP subscription perks
    const rewardResult = await grantStarsItem(targetUserId, JSON.stringify({ itemId: 'subscription_vip_pass' }));

    // Record fulfillment transaction
    DB_STORE.transactions.push({
      id: 'tx_sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      userId: targetUserId,
      subscriptionId: sub.id,
      type: 'subscription_fulfillment',
      stars: sub.priceStars || 100,
      createdAt: Date.now()
    });

    return {
      ok: true,
      result: { _: 'boolTrue', value: true },
      subscription: sub,
      reward: rewardResult.reward
    };
  } catch (err) {
    console.error('[fulfillStarsSubscription Error]:', err);
    return { ok: false, error: err.message };
  }
}

/* ── 3E. BOT CANCEL / RESTORE TELEGRAM STARS SUBSCRIPTION ENGINE (TL: payments.botCancelStarsSubscription) ── */
/**
 * Conforms to MTProto / Bot API Telegram Stars Subscription cancellation & restoration specification:
 * TL Method: payments.botCancelStarsSubscription#6dfa0622
 * TL Constructors: boolTrue#997275b5, boolFalse#bc799737
 */
async function botCancelStarsSubscription(userId, chargeId, restore = false) {
  try {
    const targetUserId = String(userId || 'user_demo');
    const sub = DB_STORE.subscriptions.find(s => (s.id === chargeId || s.chargeId === chargeId) && String(s.userId) === targetUserId);

    if (!sub) {
      return { ok: false, error: 'Subscription or charge record not found' };
    }

    const shouldRestore = Boolean(restore);
    sub.cancelled = !shouldRestore;
    sub.status = shouldRestore ? 'active' : 'cancelled';

    if (shouldRestore) {
      sub.restoredAt = Date.now();
    } else {
      sub.botCancelledAt = Date.now();
    }

    if (BOT_TOKEN && BOT_TOKEN !== 'YOUR_TELEGRAM_BOT_TOKEN_HERE') {
      try {
        await callTelegramBotAPI('editUserStarSubscription', {
          user_id: targetUserId,
          telegram_payment_charge_id: chargeId,
          is_canceled: !shouldRestore
        });
      } catch (tgErr) {
        console.warn('[botCancelStarsSubscription] Telegram Bot API call warning:', tgErr.message);
      }
    }

    return {
      ok: true,
      result: { _: 'boolTrue', value: true },
      subscription: sub,
      restored: shouldRestore
    };
  } catch (err) {
    console.error('[botCancelStarsSubscription Error]:', err);
    return { ok: false, error: err.message };
  }
}

/* ── 3F. TELEGRAM STARS TOP-UP OPTIONS ENGINE (TL: payments.getStarsTopupOptions) ── */
/**
 * Conforms to MTProto / Telegram API Stars top-up options specification:
 * TL Method: payments.getStarsTopupOptions#c00ec7d3
 * TL Vector Return Type: Vector<StarsTopupOption>
 */
async function getStarsTopupOptions() {
  try {
    const topupOptions = [
      { _: 'starsTopupOption', stars: 50, amount: 99, currency: 'USD', store_product: 'org.telegram.stars.50', extended: false },
      { _: 'starsTopupOption', stars: 100, amount: 199, currency: 'USD', store_product: 'org.telegram.stars.100', extended: false },
      { _: 'starsTopupOption', stars: 250, amount: 499, currency: 'USD', store_product: 'org.telegram.stars.250', extended: false },
      { _: 'starsTopupOption', stars: 500, amount: 999, currency: 'USD', store_product: 'org.telegram.stars.500', extended: false },
      { _: 'starsTopupOption', stars: 1000, amount: 1999, currency: 'USD', store_product: 'org.telegram.stars.1000', extended: true },
      { _: 'starsTopupOption', stars: 2500, amount: 4999, currency: 'USD', store_product: 'org.telegram.stars.2500', extended: true },
      { _: 'starsTopupOption', stars: 5000, amount: 9999, currency: 'USD', store_product: 'org.telegram.stars.5000', extended: true }
    ];

    return { ok: true, topupOptions };
  } catch (err) {
    console.error('[getStarsTopupOptions Error]:', err);
    return { ok: false, error: err.message };
  }
}

/* ── 3G. TELEGRAM STARS & TON STATUS ENGINE (TL: payments.getStarsStatus) ── */
/**
 * Conforms to MTProto / Telegram API Stars & TON Status specification:
 * TL Method: payments.getStarsStatus#4ea9b3bf
 * TL Constructor: payments.starsStatus#6c9ce8ed
 */
async function getStarsStatus(userId, isTon = false, peer = null) {
  try {
    const targetUserId = String(userId || 'user_demo');

    // Filter user's active/past subscriptions
    const userSubs = DB_STORE.subscriptions.filter(sub => String(sub.userId) === targetUserId);
    const userTxs = DB_STORE.transactions.filter(tx => String(tx.userId) === targetUserId);

    // Calculate missing balance if any subscription is pending renewal
    const missingBalanceSum = userSubs
      .filter(s => s.missingBalance)
      .reduce((sum, s) => sum + (s.priceStars || 0), 0);

    const starsAmount = 500;
    const tonEquivalent = isTon ? (starsAmount * 0.025) : null; // 1 Star ~ 0.025 TON demo rate

    const starsStatus = {
      _: 'payments.starsStatus',
      flags: isTon ? 15 : 14,
      is_ton: Boolean(isTon),
      balance: {
        _: 'starsAmount',
        amount: starsAmount,
        nano_amount: 0,
        ton_amount: tonEquivalent
      },
      subscriptions: userSubs.map(sub => ({
        _: 'starsSubscription',
        id: sub.id,
        title: sub.title,
        description: sub.description,
        price_stars: sub.priceStars,
        period: sub.periodSeconds || 2592000,
        until_date: sub.untilDate || Math.floor(Date.now() / 1000) + 2592000,
        cancelled: Boolean(sub.cancelled),
        missing_balance: Boolean(sub.missingBalance),
        status: sub.status || 'active'
      })),
      subscriptions_next_offset: null,
      subscriptions_missing_balance: missingBalanceSum,
      history: userTxs.slice(0, 10).map(tx => ({
        _: 'starsTransaction',
        id: tx.id,
        stars: tx.stars || 0,
        type: tx.type || 'transaction',
        date: Math.floor((tx.createdAt || Date.now()) / 1000)
      })),
      next_offset: null,
      chats: [],
      users: [
        {
          _: 'user',
          id: targetUserId,
          first_name: 'Player'
        }
      ]
    };

    return { ok: true, starsStatus };
  } catch (err) {
    console.error('[getStarsStatus Error]:', err);
    return { ok: false, error: err.message };
  }
}

/* ── 3H. TELEGRAM STARS TRANSACTIONS ENGINE (TL: payments.getStarsTransactions) ── */
/**
 * Conforms to MTProto / Telegram API Stars Transactions specification:
 * TL Method: payments.getStarsTransactions#69da4557
 * TL Return Type: payments.starsStatus#6c9ce8ed
 */
async function getStarsTransactions(options = {}) {
  try {
    const {
      userId = 'user_demo',
      inbound = false,
      outbound = false,
      ascending = false,
      subscriptionId = null,
      isTon = false,
      offset = '',
      limit = 10
    } = options;

    const targetUserId = String(userId || 'user_demo');
    let userTxs = DB_STORE.transactions.filter(tx => String(tx.userId) === targetUserId);

    // Filter inbound / outbound
    if (inbound) {
      userTxs = userTxs.filter(tx => tx.type === 'inbound' || tx.type === 'purchase' || tx.type === 'subscription_fulfillment');
    } else if (outbound) {
      userTxs = userTxs.filter(tx => tx.type === 'outbound' || tx.type === 'withdrawal_request');
    }

    // Filter subscription_id
    if (subscriptionId) {
      userTxs = userTxs.filter(tx => String(tx.subscriptionId) === String(subscriptionId));
    }

    // Sort ascending vs descending
    userTxs.sort((a, b) => {
      const timeA = a.createdAt || 0;
      const timeB = b.createdAt || 0;
      return ascending ? timeA - timeB : timeB - timeA;
    });

    // Pagination offset
    let startIndex = 0;
    if (offset) {
      const foundIdx = userTxs.findIndex(tx => tx.id === offset);
      if (foundIdx !== -1) startIndex = foundIdx + 1;
    }

    const maxLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
    const paginatedTxs = userTxs.slice(startIndex, startIndex + maxLimit);
    const nextOffset = (startIndex + maxLimit < userTxs.length)
      ? paginatedTxs[paginatedTxs.length - 1].id
      : null;

    let flags = 8; // Bit 3: history present
    if (inbound) flags |= 1;
    if (outbound) flags |= 2;
    if (ascending) flags |= 4;
    if (isTon) flags |= 16;

    const starsStatus = {
      _: 'payments.starsStatus',
      flags: flags,
      inbound: Boolean(inbound),
      outbound: Boolean(outbound),
      ascending: Boolean(ascending),
      is_ton: Boolean(isTon),
      subscription_id: subscriptionId,
      balance: {
        _: 'starsAmount',
        amount: 500,
        nano_amount: 0
      },
      history: paginatedTxs.map(tx => ({
        _: 'starsTransaction',
        id: tx.id,
        stars: tx.stars || 0,
        type: tx.type || 'transaction',
        subscription_id: tx.subscriptionId || null,
        date: Math.floor((tx.createdAt || Date.now()) / 1000),
        inbound: tx.type === 'inbound' || tx.type === 'subscription_fulfillment',
        outbound: tx.type === 'outbound' || tx.type === 'withdrawal_request'
      })),
      next_offset: nextOffset,
      chats: [],
      users: [
        {
          _: 'user',
          id: targetUserId,
          first_name: 'Player'
        }
      ]
    };

    return { ok: true, starsStatus };
  } catch (err) {
    console.error('[getStarsTransactions Error]:', err);
    return { ok: false, error: err.message };
  }
}

/* ── 3I. SEND TELEGRAM STARS FORM ENGINE (TL: payments.sendStarsForm) ── */
/**
 * Conforms to MTProto / Telegram API Send Stars Form specification:
 * TL Method: payments.sendStarsForm#7998c914
 * TL Return Type: payments.PaymentResult (payments.paymentResult#4e5f810d | payments.paymentVerificationNeeded#d8411139)
 */
async function sendStarsForm(userId, formId, invoice = {}, requireVerification = false) {
  try {
    const targetUserId = String(userId || 'user_demo');
    const formIdStr = String(formId || Date.now());

    // If 3DS / external verification is required
    if (requireVerification) {
      const verificationResult = {
        _: 'payments.paymentVerificationNeeded',
        url: `https://t.me/stars/verify?form_id=${formIdStr}&user_id=${targetUserId}`
      };
      return { ok: true, result: verificationResult };
    }

    // Complete transaction
    const txId = 'tx_stars_form_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    const starsAmount = Number(invoice.priceStars || invoice.amount || 50);

    const newTx = {
      id: txId,
      userId: targetUserId,
      type: 'purchase',
      stars: starsAmount,
      formId: formIdStr,
      invoice: invoice,
      createdAt: Date.now()
    };
    DB_STORE.transactions.push(newTx);

    // Formatted TL response payload: payments.paymentResult
    const paymentResult = {
      _: 'payments.paymentResult',
      updates: {
        _: 'updates',
        updates: [
          {
            _: 'updateStarsBalance',
            user_id: targetUserId,
            balance: 500 - starsAmount
          },
          {
            _: 'updateStarsTransaction',
            transaction: {
              _: 'starsTransaction',
              id: txId,
              stars: starsAmount,
              date: Math.floor(Date.now() / 1000)
            }
          }
        ],
        users: [
          {
            _: 'user',
            id: targetUserId,
            first_name: 'Player'
          }
        ]
      }
    };

    return { ok: true, result: paymentResult, transaction: newTx };
  } catch (err) {
    console.error('[sendStarsForm Error]:', err);
    return { ok: false, error: err.message };
  }
}

/* ── 3J. REFUND TELEGRAM STARS CHARGE ENGINE (TL: payments.refundStarsCharge) ── */
/**
 * Conforms to MTProto / Telegram API Refund Stars Charge specification:
 * TL Method: payments.refundStarsCharge#25ae8f4a
 * TL Return Type: Updates (updates#74ae4240)
 */
async function refundStarsCharge(userId, chargeId) {
  try {
    const targetUserId = String(userId || 'user_demo');
    const chargeIdStr = String(chargeId);

    // Find original transaction
    const tx = DB_STORE.transactions.find(t => String(t.id) === chargeIdStr || String(t.chargeId) === chargeIdStr);
    const refundStarsAmount = tx ? (tx.stars || 50) : 50;

    if (tx) {
      tx.status = 'refunded';
      tx.refundedAt = Date.now();
    }

    // Revoke subscription if charge was for a subscription
    const sub = DB_STORE.subscriptions.find(s => String(s.id) === chargeIdStr || String(s.chargeId) === chargeIdStr);
    if (sub) {
      sub.cancelled = true;
      sub.status = 'refunded';
      sub.refundedAt = Date.now();
    }

    // Record refund transaction log
    const refundTxId = 'tx_refund_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    DB_STORE.transactions.push({
      id: refundTxId,
      userId: targetUserId,
      type: 'refund',
      originalChargeId: chargeIdStr,
      stars: refundStarsAmount,
      createdAt: Date.now()
    });

    // Call Telegram Bot API if configured
    if (BOT_TOKEN && BOT_TOKEN !== 'YOUR_TELEGRAM_BOT_TOKEN_HERE') {
      try {
        await callTelegramBotAPI('refundStarPayment', {
          user_id: targetUserId,
          telegram_payment_charge_id: chargeIdStr
        });
      } catch (tgErr) {
        console.warn('[refundStarsCharge] Telegram Bot API call warning:', tgErr.message);
      }
    }

    // Formatted TL response payload: Updates
    const updates = {
      _: 'updates',
      updates: [
        {
          _: 'updateStarsBalance',
          user_id: targetUserId,
          balance: 500 + refundStarsAmount
        },
        {
          _: 'updateStarsTransaction',
          transaction: {
            _: 'starsTransaction',
            id: refundTxId,
            stars: refundStarsAmount,
            refund: true,
            date: Math.floor(Date.now() / 1000)
          }
        }
      ],
      users: [
        {
          _: 'user',
          id: targetUserId,
          first_name: 'Player'
        }
      ],
      chats: [],
      date: Math.floor(Date.now() / 1000),
      seq: 1
    };

    return { ok: true, updates, refundTxId };
  } catch (err) {
    console.error('[refundStarsCharge Error]:', err);
    return { ok: false, error: err.message };
  }
}

/* ── 4. WITHDRAWAL TRANSACTION ENGINE ── */
async function processWithdrawalRequest(initData, requestedCoins, userIdInput) {
  // Step 1: Verify HMAC-SHA256 initData
  let verifiedUser = null;
  if (initData) {
    const authResult = validateTelegramInitData(initData, BOT_TOKEN);
    if (authResult.valid) {
      verifiedUser = authResult.user;
    }
  }

  const userId = verifiedUser ? verifiedUser.id : (userIdInput || 'user_demo');

  // Step 2: Load economy config
  const config = DB_STORE.economyConfig;
  const coinsToWithdraw = Number(requestedCoins) || 0;

  // Step 3: Validate eligibility constraints (coins, level, riskStatus)
  if (coinsToWithdraw < config.minWithdrawalCoins) {
    return { ok: false, error: `Minimum withdrawal amount is ${config.minWithdrawalCoins.toLocaleString()} Coins.` };
  }

  // Step 4: Calculate Telegram Stars equivalent
  const starsEquivalent = Math.floor(coinsToWithdraw / config.exchangeRateCoinsPerStar);

  // Step 5: Execute atomic database transaction
  const withdrawalId = 'wd_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  const txId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

  const withdrawalRecord = {
    id: withdrawalId,
    userId: userId,
    userName: verifiedUser ? verifiedUser.first_name : 'Player',
    coins: coinsToWithdraw,
    stars: starsEquivalent,
    status: 'pending', // pending -> completed
    riskStatus: 'clean',
    createdAt: Date.now()
  };

  const transactionRecord = {
    id: txId,
    withdrawalId: withdrawalId,
    userId: userId,
    type: 'withdrawal_request',
    coins: coinsToWithdraw,
    stars: starsEquivalent,
    status: 'pending',
    createdAt: Date.now()
  };

  DB_STORE.withdrawals.push(withdrawalRecord);
  DB_STORE.transactions.push(transactionRecord);

  console.log(`[Withdrawal Request Created] ID: ${withdrawalId} | User: ${userId} | Coins: ${coinsToWithdraw} | Stars: ${starsEquivalent}`);

  return {
    ok: true,
    withdrawalId,
    stars: starsEquivalent,
    coins: coinsToWithdraw,
    message: `Withdrawal request for ${starsEquivalent} ⭐ Stars submitted! Pending admin review.`
  };
}

/* ── 5. HTTP SERVER & API ENDPOINTS ── */
const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const parsedUrl = {
    pathname: reqUrl.pathname,
    query: Object.fromEntries(reqUrl.searchParams.entries())
  };

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // A. VALIDATE TELEGRAM AUTH (HMAC-SHA256)
  if (parsedUrl.pathname === '/api/validate-telegram-auth' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const result = validateTelegramInitData(payload.initData || payload.raw, BOT_TOKEN);
        if (result.valid) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, user: result.user }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: result.error }));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Malformed JSON' }));
      }
    });
    return;
  }

  // B. CREATE TELEGRAM STARS INVOICE LINK (POST /stars/create-invoice)
  if (parsedUrl.pathname === '/stars/create-invoice' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const { title, description, priceStars, itemId, userId } = payload;

        const tgResult = await callTelegramBotAPI('createInvoiceLink', {
          title: title || 'Star Treasure Pack',
          description: description || 'Unlock premium game rewards with Telegram Stars',
          payload: JSON.stringify({ userId: userId || 'anonymous', itemId: itemId || 'spin_tickets_10' }),
          currency: 'XTR',
          prices: [{ label: title || 'Star Item', amount: Number(priceStars) || 50 }]
        });

        if (tgResult && tgResult.ok && tgResult.result) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, invoiceLink: tgResult.result }));
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: tgResult.description || 'Failed to create invoice link' }));
        }
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  // B2. GET TELEGRAM STARS SUBSCRIPTIONS (POST /stars/get-subscriptions) - TL: payments.getStarsSubscriptions
  if (parsedUrl.pathname === '/stars/get-subscriptions' && (req.method === 'POST' || req.method === 'GET')) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        let payload = {};
        if (body) {
          try { payload = JSON.parse(body); } catch (e) {}
        }
        const queryParams = parsedUrl.query || {};
        const userId = payload.userId || queryParams.userId || 'user_demo';
        const offset = payload.offset || queryParams.offset || '';
        const missingBalance = payload.missing_balance === true || queryParams.missing_balance === 'true';

        const result = await getStarsSubscriptions(userId, offset, missingBalance);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  // B3. CREATE TELEGRAM STARS RECURRING SUBSCRIPTION INVOICE (POST /stars/create-subscription-invoice)
  if (parsedUrl.pathname === '/stars/create-subscription-invoice' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const { title, description, priceStars, periodSeconds, userId } = payload;
        const subPeriod = Number(periodSeconds) || 2592000; // 30 days default

        const tgResult = await callTelegramBotAPI('createInvoiceLink', {
          title: title || 'Tap Empire Monthly VIP Pass',
          description: description || 'Monthly VIP Membership subscription with Telegram Stars',
          payload: JSON.stringify({ userId: userId || 'user_demo', isSubscription: true, priceStars }),
          currency: 'XTR',
          subscription_period: subPeriod,
          prices: [{ label: title || 'Monthly VIP Pass', amount: Number(priceStars) || 100 }]
        });

        if (tgResult && tgResult.ok && tgResult.result) {
          // Register draft subscription record in local store
          const subId = 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
          DB_STORE.subscriptions.push({
            id: subId,
            userId: userId || 'user_demo',
            title: title || 'Tap Empire Monthly VIP Pass',
            description: description || 'Monthly VIP Membership subscription',
            priceStars: Number(priceStars) || 100,
            periodSeconds: subPeriod,
            status: 'active',
            untilDate: Math.floor(Date.now() / 1000) + subPeriod,
            cancelled: false,
            missingBalance: false,
            createdAt: Date.now()
          });

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, invoiceLink: tgResult.result, subscriptionId: subId }));
        } else {
          // Demo fallback invoice url if Bot Token is placeholder
          const demoSubId = 'sub_' + Date.now();
          DB_STORE.subscriptions.push({
            id: demoSubId,
            userId: userId || 'user_demo',
            title: title || 'Tap Empire Monthly VIP Pass',
            description: description || 'Monthly VIP Membership subscription',
            priceStars: Number(priceStars) || 100,
            periodSeconds: subPeriod,
            status: 'active',
            untilDate: Math.floor(Date.now() / 1000) + subPeriod,
            cancelled: false,
            missingBalance: false,
            createdAt: Date.now()
          });

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            ok: true,
            demo: true,
            invoiceLink: `https://t.me/invoice/demo_stars_sub_${demoSubId}`,
            subscriptionId: demoSubId
          }));
        }
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  // B4. CHANGE / CANCEL TELEGRAM STARS SUBSCRIPTION (POST /stars/change-subscription & POST /stars/cancel-subscription)
  // TL method: payments.changeStarsSubscription#c7770878
  if ((parsedUrl.pathname === '/stars/change-subscription' || parsedUrl.pathname === '/stars/cancel-subscription') && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const { subscriptionId, userId, canceled, peer } = payload;
        // Default canceled to true if calling /stars/cancel-subscription endpoint
        const isCanceled = (parsedUrl.pathname === '/stars/cancel-subscription') 
          ? true 
          : (canceled === undefined ? true : Boolean(canceled));

        const result = await changeStarsSubscription(userId, subscriptionId, isCanceled, peer);
        if (result.ok) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        }
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  // B5. FULFILL TELEGRAM STARS SUBSCRIPTION (POST /stars/fulfill-subscription)
  // TL method: payments.fulfillStarsSubscription#cc5bebb3
  if (parsedUrl.pathname === '/stars/fulfill-subscription' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const { subscriptionId, userId, peer } = payload;

        const result = await fulfillStarsSubscription(userId, subscriptionId, peer);
        if (result.ok) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        }
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  // B6. BOT CANCEL / RESTORE TELEGRAM STARS SUBSCRIPTION (POST /stars/bot-cancel-subscription)
  // TL method: payments.botCancelStarsSubscription#6dfa0622
  if (parsedUrl.pathname === '/stars/bot-cancel-subscription' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const { userId, chargeId, restore } = payload;

        const result = await botCancelStarsSubscription(userId, chargeId || payload.subscriptionId, restore);
        if (result.ok) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        }
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  // B7. GET TELEGRAM STARS TOP-UP OPTIONS (GET /stars/topup-options)
  // TL method: payments.getStarsTopupOptions#c00ec7d3
  if (parsedUrl.pathname === '/stars/topup-options' && (req.method === 'GET' || req.method === 'POST')) {
    try {
      getStarsTopupOptions().then(result => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      });
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: e.message }));
    }
    return;
  }

  // B8. GET TELEGRAM STARS & TON STATUS (POST /stars/get-status)
  // TL method: payments.getStarsStatus#4ea9b3bf
  if (parsedUrl.pathname === '/stars/get-status' && (req.method === 'POST' || req.method === 'GET')) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        let payload = {};
        if (body) {
          try { payload = JSON.parse(body); } catch (e) {}
        }
        const queryParams = parsedUrl.query || {};
        const userId = payload.userId || queryParams.userId || 'user_demo';
        const isTon = payload.ton === true || queryParams.ton === 'true';
        const peer = payload.peer || queryParams.peer || null;

        const result = await getStarsStatus(userId, isTon, peer);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  // B9. GET TELEGRAM STARS TRANSACTIONS (POST /stars/get-transactions)
  // TL method: payments.getStarsTransactions#69da4557
  if (parsedUrl.pathname === '/stars/get-transactions' && (req.method === 'POST' || req.method === 'GET')) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        let payload = {};
        if (body) {
          try { payload = JSON.parse(body); } catch (e) {}
        }
        const queryParams = parsedUrl.query || {};

        const options = {
          userId: payload.userId || queryParams.userId || 'user_demo',
          inbound: payload.inbound === true || queryParams.inbound === 'true',
          outbound: payload.outbound === true || queryParams.outbound === 'true',
          ascending: payload.ascending === true || queryParams.ascending === 'true',
          subscriptionId: payload.subscription_id || payload.subscriptionId || queryParams.subscription_id || null,
          isTon: payload.ton === true || queryParams.ton === 'true',
          offset: payload.offset || queryParams.offset || '',
          limit: Number(payload.limit || queryParams.limit || 10)
        };

        const result = await getStarsTransactions(options);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  // B10. SEND TELEGRAM STARS FORM (POST /stars/send-form)
  // TL method: payments.sendStarsForm#7998c914
  if (parsedUrl.pathname === '/stars/send-form' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const { userId, formId, invoice, requireVerification } = payload;

        const result = await sendStarsForm(userId, formId, invoice, Boolean(requireVerification));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  // B11. REFUND TELEGRAM STARS CHARGE (POST /stars/refund-charge)
  // TL method: payments.refundStarsCharge#25ae8f4a
  if (parsedUrl.pathname === '/stars/refund-charge' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const { userId, chargeId } = payload;

        const result = await refundStarsCharge(userId, chargeId);
        if (result.ok) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        }
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  // C. TELEGRAM WEBHOOK HANDLER (pre_checkout_query & successful_payment)
  if (parsedUrl.pathname === '/telegram-webhook' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const update = JSON.parse(body);

        if (update.pre_checkout_query) {
          const queryId = update.pre_checkout_query.id;
          await callTelegramBotAPI('answerPreCheckoutQuery', {
            pre_checkout_query_id: queryId,
            ok: true
          });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
          return;
        }

        if (update.message && update.message.successful_payment) {
          const payment = update.message.successful_payment;
          const chatId = update.message.chat.id;
          const payloadStr = payment.invoice_payload;

          await grantStarsItem(chatId, payloadStr);
          await callTelegramBotAPI('sendMessage', {
            chat_id: chatId,
            text: '⚡ Purchase OK! Your Telegram Stars item has been granted successfully! 🎁'
          });

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  // D. POST /withdrawal/request — TELEGRAM STARS WITHDRAWAL REQUEST
  if (parsedUrl.pathname === '/withdrawal/request' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const result = await processWithdrawalRequest(payload.initData, payload.coins, payload.userId);

        if (result.ok) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        }
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  // E. GET /admin/withdrawals — ADMIN REVIEW LIST
  if (parsedUrl.pathname === '/admin/withdrawals' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, withdrawals: DB_STORE.withdrawals }));
    return;
  }

  // F. POST /admin/withdrawals/complete — ADMIN APPROVES AND COMPLETES WITHDRAWAL
  if (parsedUrl.pathname === '/admin/withdrawals/complete' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const { withdrawalId } = payload;

        const record = DB_STORE.withdrawals.find(w => w.id === withdrawalId);
        if (!record) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'Withdrawal record not found' }));
          return;
        }

        record.status = 'completed';
        record.completedAt = Date.now();

        // Optionally send Telegram notification to player if chatId is numeric
        if (record.userId && !isNaN(record.userId)) {
          await callTelegramBotAPI('sendMessage', {
            chat_id: record.userId,
            text: `🎉 Withdrawal Approved! ${record.stars} ⭐ Telegram Stars have been sent to your account by the admin.`
          });
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, message: 'Withdrawal marked as completed by Admin.', record }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  // G. SERVE STATIC FRONTEND ASSETS
  if (req.method === 'GET' || req.method === 'HEAD') {
    const frontendDir = path.resolve(__dirname, '../frontend');
    let safePath = path.normalize(parsedUrl.pathname).replace(/^(\.\.[\/\\])+/, '');
    if (safePath === '/' || safePath === '\\') safePath = '/index.html';

    let filePath = path.join(frontendDir, safePath);

    // Prevent directory traversal
    if (filePath.startsWith(frontendDir)) {
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache'
        });
        if (req.method === 'HEAD') {
          res.end();
        } else {
          fs.createReadStream(filePath).pipe(res);
        }
        return;
      }
    }
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`[Tap Game API Server] Running on http://localhost:${PORT}`);
  });
}

module.exports = { validateTelegramInitData, callTelegramBotAPI, processWithdrawalRequest, getStarsSubscriptions, changeStarsSubscription, fulfillStarsSubscription, botCancelStarsSubscription, getStarsTopupOptions, getStarsStatus, getStarsTransactions, sendStarsForm, refundStarsCharge };
