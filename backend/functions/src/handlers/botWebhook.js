'use strict';

/**
 * Telegram Bot webhook handler (Cloud Function: webhook)
 *
 * Handles:
 *   message /start             → welcome message + Mini App button
 *   pre_checkout_query         → must be answered within 10s
 *   message.successful_payment → grant Stars purchase item
 *
 * Security: validates X-Telegram-Bot-Api-Secret-Token header
 * (set when registering the webhook via setWebhook).
 */

const https  = require('https');
const { grantStarsItem } = require('./stars');
const { logAdminAction }  = require('../utils/helpers');

/* ── Telegram API call ── */
function tgCall(token, method, body) {
  return new Promise((resolve, reject) => {
    const data = Buffer.from(JSON.stringify(body), 'utf8');
    const req  = https.request({
      hostname: 'api.telegram.org',
      path:     `/bot${token}/${method}`,
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': data.length,
      },
    }, (res) => {
      let raw = '';
      res.on('data', c => { raw += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/* ── Main webhook handler ── */
async function handler(req, res) {
  // Immediately acknowledge to Telegram (must respond < 10s for pre_checkout_query)
  res.status(200).send('ok');

  const token         = process.env.BOT_TOKEN;
  const webhookSecret = process.env.WEBHOOK_SECRET;

  if (!token) {
    console.error('[webhook] BOT_TOKEN not set');
    return;
  }

  // Validate secret token header
  if (webhookSecret) {
    const header = req.headers['x-telegram-bot-api-secret-token'];
    if (header !== webhookSecret) {
      console.warn('[webhook] Invalid secret token — ignoring update');
      return;
    }
  }

  const update = req.body;
  if (!update) return;

  try {
    // ── /start command ──
    if (update.message?.text?.startsWith('/start')) {
      await _handleStart(token, update.message);
      return;
    }

    // ── Pre-checkout query — must answer within 10s ──
    if (update.pre_checkout_query) {
      await _handlePreCheckout(token, update.pre_checkout_query);
      return;
    }

    // ── Successful payment ──
    if (update.message?.successful_payment) {
      await _handleSuccessfulPayment(token, update.message);
      return;
    }

  } catch (err) {
    console.error('[webhook] Unhandled error:', err);
  }
}

/* ── /start ── */
async function _handleStart(token, message) {
  const chatId    = message.chat.id;
  const firstName = message.from?.first_name || 'there';
  const param     = (message.text || '').split(' ')[1] || '';

  // Referral tracking is handled server-side when the Mini App boots
  // and calls POST /rewards/referral. Bot just sends welcome message.

  const miniAppUrl = process.env.MINI_APP_URL || 'https://t.me/YOUR_BOT_USERNAME/app';

  await tgCall(token, 'sendMessage', {
    chat_id:    chatId,
    parse_mode: 'HTML',
    text: `👋 <b>Welcome to Tap Empire, ${firstName}!</b>\n\n` +
          `🌟 Tap to earn coins\n` +
          `⚡ Collect energy bonuses\n` +
          `🏆 Climb the leaderboard\n` +
          `💸 Withdraw as Telegram Stars\n\n` +
          `Tap the button below to start playing! 🎮`,
    reply_markup: {
      inline_keyboard: [[
        {
          text:    '🎮 Play Tap Empire',
          web_app: { url: miniAppUrl + (param ? `?startapp=${param}` : '') },
        },
      ]],
    },
  });
}

/* ── pre_checkout_query ── */
async function _handlePreCheckout(token, query) {
  // Validate payload
  let valid   = true;
  let errMsg  = '';

  try {
    const payload = JSON.parse(query.invoice_payload || '{}');
    if (!payload.itemId || !payload.userId) {
      valid  = false;
      errMsg = 'Invalid purchase payload';
    }
  } catch {
    valid  = false;
    errMsg = 'Malformed payload';
  }

  if (valid) {
    await tgCall(token, 'answerPreCheckoutQuery', {
      pre_checkout_query_id: query.id,
      ok: true,
    });
  } else {
    await tgCall(token, 'answerPreCheckoutQuery', {
      pre_checkout_query_id: query.id,
      ok:           false,
      error_message: errMsg,
    });
  }
}

/* ── successful_payment ── */
async function _handleSuccessfulPayment(token, message) {
  const payment = message.successful_payment;
  const userId  = String(message.from?.id || '');
  const chatId  = message.chat.id;

  let payload;
  try {
    payload = JSON.parse(payment.invoice_payload || '{}');
  } catch {
    console.error('[webhook] Could not parse payment payload:', payment.invoice_payload);
    return;
  }

  const { itemId } = payload;
  if (!itemId || !userId) {
    console.error('[webhook] Missing itemId or userId in payment payload');
    return;
  }

  try {
    await grantStarsItem(userId, itemId, payment);

    // Confirm to user
    await tgCall(token, 'sendMessage', {
      chat_id:    chatId,
      parse_mode: 'HTML',
      text: `✅ <b>Purchase complete!</b>\n` +
            `Your item has been activated. Open the app to see it! 🎮`,
    });

    await logAdminAction('system', 'stars_purchase_completed', {
      userId, itemId,
      stars: payment.total_amount,
      chargeId: payment.telegram_payment_charge_id,
    });
  } catch (err) {
    console.error('[webhook] grantStarsItem failed:', err);
    // Notify user of failure so they can contact support
    await tgCall(token, 'sendMessage', {
      chat_id:    chatId,
      parse_mode: 'HTML',
      text: `⚠️ <b>Purchase error</b>\n` +
            `Your Stars were charged but we couldn't activate the item. ` +
            `Please contact support with charge ID: <code>${payment.telegram_payment_charge_id}</code>`,
    }).catch(() => {});
  }
}

module.exports = { handler };
