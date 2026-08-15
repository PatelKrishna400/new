# Tap Empire

A production-ready tap-to-earn Telegram Mini App. Players tap a golden sphere to earn coins, level up, complete missions, watch rewarded ads for bonuses, buy items with Telegram Stars, and withdraw earnings as Stars.

---

## Project Structure

```
tap-empire/
├── frontend/                   Telegram Mini App (HTML5 + Vanilla JS)
│   ├── index.html              App shell — loads all modules
│   ├── css/
│   │   ├── style.css           Design system, component styles
│   │   └── animations.css      Keyframe animations
│   └── js/
│       ├── config.js           Firebase config, API URL, economy defaults
│       ├── state.js            Global STATE object + syncState()
│       ├── telegram.js         Telegram WebApp SDK wrapper
│       ├── firebase.js         Firestore client — reads only
│       ├── audio.js            Web Audio API sound effects
│       ├── particles.js        Canvas particle system
│       ├── ui.js               Toast, modal, DOM update helpers
│       ├── energy.js           Energy regen system
│       ├── combo.js            Combo multiplier system
│       ├── tap.js              Core tap engine + anti-cheat
│       ├── collection.js       Rewarded ad collection actions
│       ├── missions.js         Missions + achievement definitions
│       ├── achievements.js     Achievement rendering
│       ├── daily.js            7-day daily reward cycle
│       ├── upgrades.js         Coin upgrades + Stars shop
│       ├── withdrawal.js       Coin-to-Stars withdrawal flow
│       ├── nav.js              Screen navigation + callAPI()
│       ├── app.js              Boot sequence (entry point)
│       └── screens/
│           ├── home.js         Tap core, energy, collection cards
│           ├── boost.js        Upgrades + Stars shop
│           ├── tasks.js        Daily reward, missions, achievements
│           ├── rank.js         Leaderboard + referral
│           ├── wallet.js       Balance, withdrawal, transaction history
│           ├── profile.js      Stats, settings, account info
│           └── admin.js        Admin panel (admin-only)
│
└── backend/
    ├── firebase.json           Firebase project config
    ├── firestore.rules         Security rules (all writes backend-only)
    ├── firestore.indexes.json  Composite indexes
    ├── functions/              Firebase Cloud Functions
    │   ├── index.js            Express app + Cloud Function exports
    │   ├── package.json
    │   ├── .env.example        Required environment variables
    │   └── src/
    │       ├── middleware/
    │       │   └── auth.js     Telegram initData HMAC-SHA256 verification
    │       ├── utils/
    │       │   └── helpers.js  Shared Firestore refs, economy loader, txn writer
    │       └── handlers/
    │           ├── rewards.js      Referral rewards + ad-complete
    │           ├── stars.js        Telegram Stars invoice creation + item grant
    │           ├── withdrawal.js   Withdrawal request (server-authoritative)
    │           ├── admin.js        Platform stats, economy config, Stars revenue
    │           └── botWebhook.js   Bot update handler (Stars payments, /start)
    └── bot/
        ├── bot.js              CLI utility — webhook registration, bot setup
        ├── package.json
        └── .env.example        Required environment variables
```

---

## Quick Start

### 1. Create a Telegram Bot

1. Open [@BotFather](https://t.me/BotFather) and send `/newbot`
2. Note the **bot token** — you'll need it in multiple places
3. Send `/newapp` to create a Mini App attached to the bot
4. Set the Mini App URL to your deployed frontend URL

### 2. Create a Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → New project
2. Enable **Firestore Database** (production mode)
3. Enable **Anonymous Authentication** (Auth → Sign-in method)
4. Go to Project Settings → Your apps → Add web app
5. Copy the Firebase config object

### 3. Configure the Frontend

Edit `frontend/js/config.js` — replace every placeholder:

```js
const FIREBASE_CONFIG = {
  apiKey:            'YOUR_API_KEY',
  authDomain:        'YOUR_PROJECT.firebaseapp.com',
  projectId:         'YOUR_PROJECT_ID',
  storageBucket:     'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId:             'YOUR_APP_ID',
};

const MONETAG_ZONE_ID   = 'YOUR_MONETAG_ZONE_ID';   // from monetag.com
const ADMIN_TELEGRAM_ID = 123456789;                 // your Telegram numeric ID
const API_BASE = 'https://us-central1-YOUR_PROJECT.cloudfunctions.net/api';
```

Also replace `YOUR_BOT_USERNAME` in:
- `frontend/js/screens/rank.js` (two occurrences in `_renderReferralPanel` and `_shareRefLink`)
- `frontend/js/screens/profile.js` (support link)

### 4. Set Up the Backend

```powershell
# Install Firebase CLI globally (once)
npm install -g firebase-tools

# Log in
firebase login

# Install Cloud Functions dependencies
cd backend/functions
npm install

# Install bot dependencies
cd ../bot
npm install
```

Edit `backend/.firebaserc`:
```json
{ "projects": { "default": "YOUR_FIREBASE_PROJECT_ID" } }
```

### 5. Set Secret Environment Variables

Firebase Cloud Functions use Secret Manager for sensitive values.
Run these from the `backend/` directory:

```powershell
firebase functions:secrets:set BOT_TOKEN
firebase functions:secrets:set WEBHOOK_SECRET
firebase functions:secrets:set ADMIN_TELEGRAM_ID
```

For local emulator development, copy `functions/.env.example` to `functions/.env` and fill in values.

### 6. Deploy

```powershell
# From backend/
firebase deploy --only firestore:rules,firestore:indexes
firebase deploy --only functions
```

Note the deployed function URLs from the output:
```
Function URL (api):     https://us-central1-YOUR_PROJECT.cloudfunctions.net/api
Function URL (webhook): https://us-central1-YOUR_PROJECT.cloudfunctions.net/webhook
```

### 7. Register the Bot Webhook

Copy `backend/bot/.env.example` to `backend/bot/.env` and fill in:

```env
BOT_TOKEN=YOUR_BOT_TOKEN
WEBHOOK_URL=https://us-central1-YOUR_PROJECT.cloudfunctions.net/webhook
WEBHOOK_SECRET=YOUR_RANDOM_SECRET_STRING
MINI_APP_URL=https://t.me/YOUR_BOT_USERNAME/app
```

Then run:

```powershell
cd backend/bot

# Register webhook
node bot.js --register-webhook

# Set /start command + menu button
node bot.js --set-commands

# Verify everything is correct
node bot.js --get-info
```

### 8. Set Up Monetag Rewarded Ads

1. Sign up at [monetag.com](https://monetag.com)
2. Create a zone: Monetization → Create Zone → **Rewarded Interstitial**
3. Copy the zone ID into `frontend/js/config.js` → `MONETAG_ZONE_ID`
4. Uncomment the Monetag `<script>` tag in `frontend/index.html`

### 9. Deploy the Frontend

The frontend is a static site — serve `frontend/` from any host:

- **Firebase Hosting**: `firebase deploy --only hosting` (add `hosting` section to `firebase.json`)
- **Cloudflare Pages**: connect your repo, set build output to `frontend/`
- **Netlify / Vercel**: drag-and-drop the `frontend/` folder

The Mini App URL you register with BotFather must be HTTPS.

---

## Environment Variables Reference

### Cloud Functions (`backend/functions/.env` / Firebase Secrets)

| Variable | Required | Description |
|---|---|---|
| `BOT_TOKEN` | ✅ | Telegram bot token from @BotFather |
| `WEBHOOK_SECRET` | ✅ | Random string for webhook validation |
| `ADMIN_TELEGRAM_ID` | ✅ | Numeric Telegram ID of the admin user |
| `MINI_APP_URL` | — | Mini App URL used in bot welcome message |
| `NODE_ENV` | — | Set to `development` to skip initData check in emulator |

### Bot CLI (`backend/bot/.env`)

| Variable | Required | Description |
|---|---|---|
| `BOT_TOKEN` | ✅ | Telegram bot token |
| `WEBHOOK_URL` | ✅ | Full Cloud Function webhook URL |
| `WEBHOOK_SECRET` | ✅ | Same value as Cloud Function secret |
| `MINI_APP_URL` | — | Used when setting the menu button |

---

## Architecture

### Security Model

All **financial operations** are server-authoritative:

| Operation | Client role | Server role |
|---|---|---|
| Tap coins | Optimistic update + batch save | Not validated (low risk, anti-cheat on client) |
| Ad reward | Creates ad session doc, shows ad | Validates session, cooldown, daily limit; grants reward atomically |
| Referral | Calls `/rewards/referral` | HMAC-verifies initData, idempotency check, atomic grant |
| Stars purchase | Opens invoice link | Creates invoice via Bot API; grants item on `successful_payment` webhook only |
| Withdrawal | UI input | HMAC-verifies initData, re-reads all values from Firestore, atomic zero + record |

### Authentication Flow

```
Client                              Backend
  │                                    │
  ├─ Telegram.initData (raw string) ──►│
  │                                    ├─ Parse URLSearchParams
  │                                    ├─ HMAC-SHA256("WebAppData", BOT_TOKEN) → secret_key
  │                                    ├─ HMAC-SHA256(secret_key, data_check_string) → hash
  │                                    ├─ timingSafeEqual(computed, provided)
  │                                    ├─ Check auth_date within 24h
  │◄─ 200 { ok } or 401 ─────────────┤
```

### Stars Payment Flow

```
Client                     Backend (Cloud Function)       Telegram
  │                               │                           │
  ├─ POST /stars/create-invoice ─►│                           │
  │                               ├─ createInvoiceLink ──────►│
  │◄─ { invoiceLink } ────────────┤◄─ invoice URL ────────────┤
  │                               │                           │
  ├─ TG.openInvoice(invoiceLink) ─────────────────────────────►
  │                               │                           │
  │◄─ pre_checkout_query ─────────────────────────────────────┤
  │                               │◄─ pre_checkout_query ─────┤
  │                               ├─ answerPreCheckoutQuery ──►│
  │                               │                           │
  │                               │◄─ successful_payment ─────┤
  │                               ├─ grantStarsItem() (Firestore transaction)
  │◄─ Bot message: "Purchase OK" ─┤
```

### Withdrawal Flow

```
Client                              Backend
  │                                    │
  ├─ POST /withdrawal/request ────────►│
  │  { initData }                      ├─ verifyInitData (HMAC)
  │                                    ├─ Load economy config from Firestore
  │                                    ├─ Load user doc from Firestore
  │                                    ├─ Check: coins, level, adViews, riskStatus
  │                                    ├─ Firestore transaction:
  │                                    │   - user.coins = 0
  │                                    │   - user.pendingWithdrawal = true
  │                                    │   - Create withdrawals/{id}
  │                                    │   - Create transactions/{id}
  │◄─ { ok, stars, message } ─────────┤
  │                                    │
  │  Admin reviews in Admin Panel      │
  │  Admin sets status → completed     │
  │  Admin sends Stars via bot manually│
```

### Firestore Collections

| Collection | Purpose | Writes |
|---|---|---|
| `users/{telegramId}` | Player profile, balance, energy, risk | Backend + limited client (non-financial) |
| `leaderboard/{telegramId}` | Public rankings | Backend only |
| `transactions` | Full audit log | Backend only |
| `withdrawals` | Withdrawal lifecycle | Backend only |
| `gameConfig/economy` | Admin-configurable balance params | Admin Cloud Function only |
| `gameConfig/starsRevenue` | Cumulative Stars revenue totals | Backend only |
| `adSessions/{sessionId}` | Per-ad replay prevention | Client creates, backend completes |
| `starsPurchases` | Stars purchase records | Backend only |
| `referrals` | Referral relationships | Backend only |
| `adminLogs` | Admin action audit trail | Backend only |

---

## Local Development

```powershell
# Start Firebase emulators (Firestore + Functions)
cd backend
firebase emulators:start --only functions,firestore

# The API will be available at:
# http://localhost:5001/YOUR_PROJECT_ID/us-central1/api

# Update API_BASE in frontend/js/config.js for local dev:
# const API_BASE = 'http://localhost:5001/YOUR_PROJECT_ID/us-central1/api';

# Open the frontend directly in a browser:
# frontend/index.html (via a local HTTP server, not file://)
# e.g. with: npx serve frontend
```

When `NODE_ENV=development` and `BOT_TOKEN` is unset in the emulator, `verifyInitData` middleware bypasses HMAC checking and sets `req.tgUser = { id: 'demo_0', ... }`. This lets you test all API endpoints locally without a real Telegram context.

---

## Deployment Checklist

Before going live, verify every item:

- [ ] `FIREBASE_CONFIG` in `frontend/js/config.js` — all placeholder strings replaced
- [ ] `MONETAG_ZONE_ID` in `frontend/js/config.js` — real zone ID from Monetag dashboard
- [ ] Monetag `<script>` tag uncommented in `frontend/index.html`
- [ ] `ADMIN_TELEGRAM_ID` in `frontend/js/config.js` — your real Telegram numeric ID
- [ ] `API_BASE` in `frontend/js/config.js` — deployed Cloud Functions URL
- [ ] `YOUR_BOT_USERNAME` replaced in `frontend/js/screens/rank.js` (×2) and `profile.js`
- [ ] Support channel URL updated in `frontend/js/screens/profile.js`
- [ ] `backend/.firebaserc` — real Firebase project ID
- [ ] `BOT_TOKEN` secret set: `firebase functions:secrets:set BOT_TOKEN`
- [ ] `WEBHOOK_SECRET` secret set: `firebase functions:secrets:set WEBHOOK_SECRET`
- [ ] `ADMIN_TELEGRAM_ID` secret set: `firebase functions:secrets:set ADMIN_TELEGRAM_ID`
- [ ] `firebase deploy --only firestore:rules,firestore:indexes` deployed
- [ ] `firebase deploy --only functions` deployed
- [ ] Webhook registered: `node backend/bot/bot.js --register-webhook`
- [ ] Bot commands set: `node backend/bot/bot.js --set-commands`
- [ ] Webhook verified: `node backend/bot/bot.js --get-info` (no errors)
- [ ] Frontend deployed to HTTPS host
- [ ] Mini App URL registered with @BotFather

---

## Monetization Summary

| Channel | Mechanism | Revenue |
|---|---|---|
| Rewarded ads | Monetag Rewarded Interstitial — triggered by collection actions (offline reward, chest, energy, daily, mission) | CPM-based, ~$2/1000 views |
| Telegram Stars | In-app shop (5 items: 50–1500⭐) | Direct Stars revenue |
| Referrals | Viral growth → more ad views | Indirect ad revenue |

Stars are worth approximately $0.013 each at current Telegram rates. Players can convert in-game coins to Stars via the withdrawal system (minimum 100,000 coins = 10 Stars at the default rate of 10,000 coins/Star). Payout ratio is 30% of estimated ad revenue by default — configurable in the Admin Panel.

---

## Legal Notes

- Game coins are not real money and have no monetary value outside the game.
- Telegram Stars purchases are digital goods and are final and non-refundable unless required by applicable law.
- Estimated payout values displayed to users are not guaranteed income.
- Ensure your bot's privacy policy and terms of service comply with Telegram's [Bot Platform rules](https://core.telegram.org/bots/payments) and applicable laws in your jurisdiction.
