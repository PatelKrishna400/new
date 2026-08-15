'use strict';

/**
 * Telegram Stars (XTR) payment handlers
 *
 * POST /stars/create-invoice
 *   Body: { itemId }  (+ initData)
 *   Calls Telegram Bot API createInvoiceLink.
 *   Returns { invoiceLink }.
 *
 * The actual grant of the purchased item happens in the bot webhook
 * handler (botWebhook.js) upon receiving a successful_payment update,
 * which is the only trusted source of truth for completed payments.
 */

const https  = require('https');
const admin  = require('firebase-admin');
const {
  refs, now, inc,
  writeTxn, isSafeId, httpError,
} = require('../utils/helpers');

/* ── Shop item definitions (must match frontend SHOP_ITEMS) ── */
const SHOP_ITEMS = {
  boost2x:     { name: '2× Tap Boost',         description: 'Double tap reward for 30 minutes', price: 50  },
  fullenergy:  { name: 'Full Energy',           description: 'Instantly restore all energy',     price: 100 },
  vip:         { name: 'VIP Boost',             description: '3× tap + full energy for 1 hour',  price: 500 },
  starter:     { name: 'Starter Pack',          description: '10,000 coins + full energy',        price: 1000 },
  skin_gold:   { name: 'Gold Core Skin',        description: 'Premium animated core skin',        price: 1500 },
};

/* ── POST /stars/create-invoice ── */
async function createInvoice(req, res, next) {
  try {
    const uid    = req.tgUser.id;
    const { itemId } = req.body;

    if (!isSafeId(itemId) || !SHOP_ITEMS[itemId]) {
      throw httpError(400, 'Unknown item');
    }

    const item     = SHOP_ITEMS[itemId];
    const botToken = process.env.BOT_TOKEN;
    if (!botToken) throw httpError(500, 'Bot not configured');

    // Build Telegram createInvoiceLink request
    // Telegram Stars invoices use currency "XTR" and price in the smallest
    // unit (1 XTR = 1 star — no sub-units). prices is an array of
    // LabeledPrice objects.
    const invoicePayload = JSON.stringify({
      title:          item.name,
      description:    item.description,
      payload:        JSON.stringify({ itemId, userId: uid }),
      currency:       'XTR',
      prices:         [{ label: item.name, amount: item.price }],
    });

    const invoiceLink = await _callTelegramAPI(botToken, 'createInvoiceLink', invoicePayload);

    // Persist a pending purchase record for audit
    await refs.starsPurchases().add({
      telegramId:  uid,
      itemId,
      itemName:    item.name,
      price:       item.price,
      currency:    'XTR',
      status:      'pending',
      invoiceLink: invoiceLink,
      createdAt:   now(),
    });

    return res.json({ invoiceLink });
  } catch (err) {
    return next(err);
  }
}

/**
 * grantStarsItem(userId, itemId)
 * Called from botWebhook.js after successful_payment is verified.
 * This is the authoritative grant — never call from client-side code.
 */
async function grantStarsItem(userId, itemId, paymentInfo) {
  const item = SHOP_ITEMS[itemId];
  if (!item) throw new Error(`Unknown itemId: ${itemId}`);

  const db      = admin.firestore();
  const userRef = refs.user(userId);

  await db.runTransaction(async (t) => {
    const snap = await t.get(userRef);
    if (!snap.exists) throw new Error('User not found');

    let patch = { updatedAt: now() };

    switch (itemId) {
      case 'boost2x':
        patch.boostMultiplier = 2;
        patch.boostExpiry     = Date.now() + 30 * 60 * 1000;
        break;
      case 'fullenergy': {
        const maxEnergy = snap.data().maxEnergy || 500;
        patch.energy = maxEnergy;
        break;
      }
      case 'vip':
        patch.boostMultiplier = 3;
        patch.boostExpiry     = Date.now() + 60 * 60 * 1000;
        patch.energy          = snap.data().maxEnergy || 500;
        break;
      case 'starter':
        patch.coins  = inc(10000);
        patch.energy = snap.data().maxEnergy || 500;
        break;
      case 'skin_gold':
        patch.activeSkin = 'gold';
        break;
    }

    t.update(userRef, patch);

    // Record the completed purchase
    const purchaseRef = refs.starsPurchases().doc();
    t.set(purchaseRef, {
      telegramId:  String(userId),
      itemId,
      itemName:    item.name,
      price:       item.price,
      currency:    'XTR',
      status:      'completed',
      chargeId:    paymentInfo?.telegram_payment_charge_id || null,
      createdAt:   now(),
    });

    // Update Stars revenue totals
    const starUsdRate = 0.013; // approximate USD value per Star
    t.set(refs.starsRevenue(), {
      totalStars: inc(item.price),
      totalUSD:   inc(item.price * starUsdRate),
      updatedAt:  now(),
    }, { merge: true });

    // Transaction record
    writeTxn(t, userId, 'stars_purchase', 0, `Purchased: ${item.name} (⭐ ${item.price})`);
  });
}

/* ── Internal: call Telegram Bot API via HTTPS ── */
function _callTelegramAPI(token, method, jsonBody) {
  return new Promise((resolve, reject) => {
    const data = Buffer.from(jsonBody, 'utf8');
    const options = {
      hostname: 'api.telegram.org',
      path:     `/bot${token}/${method}`,
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': data.length,
      },
    };

    const req = https.request(options, (resp) => {
      let body = '';
      resp.on('data', chunk => { body += chunk; });
      resp.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (!parsed.ok) {
            reject(new Error(`Telegram API error: ${parsed.description || 'unknown'}`));
          } else {
            resolve(parsed.result);
          }
        } catch (e) {
          reject(new Error('Invalid Telegram API response'));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

module.exports = { createInvoice, grantStarsItem, SHOP_ITEMS };
