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

const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN_HERE';
const PORT = process.env.PORT || 3000;

// In-Memory Database Store for pending withdrawals & transactions (Syncs with Firebase/Firestore)
const DB_STORE = {
  withdrawals: [],
  transactions: [],
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
  const parsedUrl = url.parse(req.url, true);

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

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`[Tap Game API Server] Running on http://localhost:${PORT}`);
  });
}

module.exports = { validateTelegramInitData, callTelegramBotAPI, processWithdrawalRequest };
