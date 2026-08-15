'use strict';

/**
 * Tap Empire — Cloud Functions entry point
 *
 * Exports two Cloud Functions:
 *   api     → Express REST API (all Mini App calls)
 *   webhook → Telegram Bot webhook (Stars payments, /start, etc.)
 *
 * Environment variables (set via `firebase functions:secrets` or .env):
 *   BOT_TOKEN          — Telegram bot token
 *   ADMIN_TELEGRAM_ID  — Numeric Telegram ID of the admin
 *   WEBHOOK_SECRET     — Random string used to protect the webhook URL
 */

const functions  = require('firebase-functions');
const admin      = require('firebase-admin');
const express    = require('express');
const cors       = require('cors');

// ── Firebase Admin init (runs once per cold start) ──
admin.initializeApp();
const db = admin.firestore();

// ── Share db + admin with all handlers ──
// We attach them to the module so handler files can require them.
module.exports._db    = db;
module.exports._admin = admin;

// ── Import route handlers ──
const authHandler       = require('./src/handlers/auth');
const rewardsHandler    = require('./src/handlers/rewards');
const starsHandler      = require('./src/handlers/stars');
const withdrawalHandler = require('./src/handlers/withdrawal');
const adminHandler      = require('./src/handlers/admin');
const botWebhook        = require('./src/handlers/botWebhook');

// ── Import middleware ──
const { verifyInitData } = require('./src/middleware/auth');

// ════════════════════════════════════════
// EXPRESS APP — REST API
// ════════════════════════════════════════
const app = express();

// Trust Cloud Run / Firebase proxy
app.set('trust proxy', 1);

// CORS: allow Telegram Mini App origins
app.use(cors({
  origin: [
    'https://web.telegram.org',
    'https://webk.telegram.org',
    'https://webz.telegram.org',
    /\.telegram\.org$/,
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
}));

// JSON body parser (10 kb limit — no large payloads expected)
app.use(express.json({ limit: '10kb' }));

// ── Health check (no auth) ──
app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// ── All routes below require valid Telegram initData ──
app.use(verifyInitData);

// ── Auth ──
app.post('/auth/custom-token',   authHandler.createCustomToken);

// ── Rewards ──
app.post('/rewards/referral',    rewardsHandler.handleReferral);
app.post('/rewards/ad-complete', rewardsHandler.handleAdComplete);

// ── Stars (Telegram payments) ──
app.post('/stars/create-invoice', starsHandler.createInvoice);

// ── Withdrawals ──
app.post('/withdrawal/request',   withdrawalHandler.requestWithdrawal);

// ── Admin (extra admin-only guard inside handler) ──
app.post('/admin/stats',          adminHandler.getStats);
app.post('/admin/economy',        adminHandler.updateEconomy);
app.post('/admin/stars-revenue',  adminHandler.getStarsRevenue);

// ── 404 catch-all ──
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// ── Error handler ──
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[API error]', err);
  const status  = err.status || 500;
  const message = err.expose ? err.message : 'Internal server error';
  res.status(status).json({ error: message });
});

// ════════════════════════════════════════
// CLOUD FUNCTION: api
// ════════════════════════════════════════
exports.api = functions
  .runWith({ secrets: ['BOT_TOKEN', 'WEBHOOK_SECRET'] })
  .https
  .onRequest(app);

// ════════════════════════════════════════
// CLOUD FUNCTION: webhook
// Receives all Telegram bot updates
// (messages, pre_checkout_query, successful_payment, etc.)
// ════════════════════════════════════════
exports.webhook = functions
  .runWith({ secrets: ['BOT_TOKEN', 'WEBHOOK_SECRET'] })
  .https
  .onRequest(botWebhook.handler);
