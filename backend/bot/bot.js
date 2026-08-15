#!/usr/bin/env node
'use strict';

/**
 * Tap Empire — Telegram Bot utility script
 *
 * This file is NOT the live webhook handler (that lives in
 * functions/src/handlers/botWebhook.js as a Cloud Function).
 *
 * This script is a CLI tool for one-time setup tasks:
 *   node bot.js --register-webhook   Register the Cloud Function URL as the bot webhook
 *   node bot.js --delete-webhook     Remove the webhook (switch to polling for testing)
 *   node bot.js --set-commands       Set the bot command menu
 *   node bot.js --get-info           Print bot info and current webhook status
 *
 * Run with no flags to verify environment variables are set correctly.
 *
 * Required environment variables (put in backend/bot/.env):
 *   BOT_TOKEN          Telegram bot token from @BotFather
 *   WEBHOOK_URL        Full URL of your deployed Cloud Function webhook
 *                      e.g. https://us-central1-YOUR_PROJECT.cloudfunctions.net/webhook
 *   WEBHOOK_SECRET     Random secret string (set same value as Cloud Function env)
 *   MINI_APP_URL       Full URL of your Mini App
 *                      e.g. https://t.me/YOUR_BOT_USERNAME/app
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const TelegramBot = require('node-telegram-bot-api');
const https       = require('https');

const BOT_TOKEN     = process.env.BOT_TOKEN;
const WEBHOOK_URL   = process.env.WEBHOOK_URL;
const WEBHOOK_SECRET= process.env.WEBHOOK_SECRET;
const MINI_APP_URL  = process.env.MINI_APP_URL;

/* ── Validation ── */
if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN is not set. Add it to backend/bot/.env');
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN);

/* ══════════════════════════════════════
   CLI DISPATCH
══════════════════════════════════════ */
const arg = process.argv[2];

(async () => {
  try {
    if (arg === '--register-webhook') {
      await registerWebhook();
    } else if (arg === '--delete-webhook') {
      await deleteWebhook();
    } else if (arg === '--set-commands') {
      await setCommands();
    } else if (arg === '--get-info') {
      await getInfo();
    } else {
      await verifyEnv();
    }
  } catch (err) {
    console.error('❌ Error:', err.message || err);
    process.exit(1);
  }
})();

/* ── Register webhook ── */
async function registerWebhook() {
  if (!WEBHOOK_URL) {
    throw new Error('WEBHOOK_URL is not set in .env');
  }

  console.log(`📡 Registering webhook: ${WEBHOOK_URL}`);

  const opts = {
    allowed_updates: [
      'message',
      'pre_checkout_query',
      'callback_query',
    ],
  };

  if (WEBHOOK_SECRET) {
    opts.secret_token = WEBHOOK_SECRET;
    console.log('🔐 Using webhook secret token');
  } else {
    console.warn('⚠️  WEBHOOK_SECRET not set — webhook is unprotected');
  }

  const result = await bot.setWebHook(WEBHOOK_URL, opts);
  if (result) {
    console.log('✅ Webhook registered successfully');
  } else {
    throw new Error('setWebHook returned false');
  }

  // Confirm
  const info = await bot.getWebHookInfo();
  console.log('Webhook info:', JSON.stringify(info, null, 2));
}

/* ── Delete webhook ── */
async function deleteWebhook() {
  console.log('🗑️  Deleting webhook...');
  await bot.deleteWebHook();
  console.log('✅ Webhook deleted');
}

/* ── Set bot commands ── */
async function setCommands() {
  const commands = [
    { command: 'start', description: '🎮 Launch Tap Empire' },
  ];

  await bot.setMyCommands(commands);
  console.log('✅ Bot commands set:', commands.map(c => `/${c.command}`).join(', '));

  // Set the Mini App button in the menu if URL is configured
  if (MINI_APP_URL) {
    try {
      await _tgPost('setChatMenuButton', {
        menu_button: {
          type:    'web_app',
          text:    '🎮 Play',
          web_app: { url: MINI_APP_URL },
        },
      });
      console.log(`✅ Menu button set → ${MINI_APP_URL}`);
    } catch (e) {
      console.warn('⚠️  Could not set menu button (may need to be done per-chat):', e.message);
    }
  } else {
    console.warn('⚠️  MINI_APP_URL not set — skipping menu button');
  }
}

/* ── Get bot info + webhook status ── */
async function getInfo() {
  const [me, webhookInfo] = await Promise.all([
    bot.getMe(),
    bot.getWebHookInfo(),
  ]);

  console.log('\n── Bot Info ─────────────────────────');
  console.log(`  ID:       ${me.id}`);
  console.log(`  Name:     ${me.first_name}`);
  console.log(`  Username: @${me.username}`);

  console.log('\n── Webhook ──────────────────────────');
  console.log(`  URL:             ${webhookInfo.url || '(none)'}`);
  console.log(`  Pending updates: ${webhookInfo.pending_update_count}`);
  console.log(`  Has secret:      ${!!webhookInfo.has_custom_certificate}`);
  if (webhookInfo.last_error_message) {
    console.warn(`  Last error:      ${webhookInfo.last_error_message}`);
    console.warn(`  Last error date: ${new Date(webhookInfo.last_error_date * 1000).toISOString()}`);
  } else {
    console.log(`  Status:          OK`);
  }

  console.log('\n── Environment ──────────────────────');
  console.log(`  WEBHOOK_URL:    ${WEBHOOK_URL   || '(not set)'}`);
  console.log(`  WEBHOOK_SECRET: ${WEBHOOK_SECRET ? '(set)' : '(not set)'}`);
  console.log(`  MINI_APP_URL:   ${MINI_APP_URL  || '(not set)'}`);
  console.log('');
}

/* ── Verify env without making API calls ── */
async function verifyEnv() {
  console.log('🔍 Verifying environment...');
  const me = await bot.getMe();
  console.log(`✅ Bot token valid — @${me.username} (ID: ${me.id})`);
  console.log('Run with --get-info for full webhook status.');
}

/* ── Low-level Telegram HTTPS POST ── */
function _tgPost(method, body) {
  return new Promise((resolve, reject) => {
    const data = Buffer.from(JSON.stringify(body), 'utf8');
    const req  = https.request({
      hostname: 'api.telegram.org',
      path:     `/bot${BOT_TOKEN}/${method}`,
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': data.length,
      },
    }, (res) => {
      let raw = '';
      res.on('data', c => { raw += c; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          if (!parsed.ok) reject(new Error(parsed.description || 'Telegram API error'));
          else resolve(parsed.result);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}
