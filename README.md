# 👑 TAP EMPIRE — TELEGRAM MINI APP

An immersive, high-performance Telegram Mini App with tap economy, 100-level XP progression, Monetag/Teleads ad rewards, Telegram Stars payment & subscriptions engine, and Firebase Realtime Database sync.

---

## 📁 Repository Directory Structure

```
tap-empire/
├── 🎨 frontend/                  # Client-Side Application (HTML, CSS, JS)
│   ├── index.html               # Main Gameplay & Dashboard HTML
│   ├── css/
│   │   └── style.css            # Custom Styling & Glassmorphism Theme
│   └── js/
│       ├── app.js               # Core Tap Gameplay, XP System & State Machine
│       ├── audio.js             # Web Audio API Sound & Haptics Engine
│       ├── firebase.js          # Realtime Database Sync & Referral Engine
│       ├── telegram-auth.js     # HMAC-SHA256 Auth Verifier Helper
│       ├── telegram-stars.js    # Telegram Stars Invoices, Subscriptions & Top-Up
│       └── telegram-withdrawal.js# Telegram Stars & Coins Withdrawal System
│
├── ⚡ backend/                   # Node.js Backend API & Payment Engine
│   ├── server.js                # API Endpoints & Telegram MTProto/Bot API Handlers
│   ├── database.rules.json      # Firebase Realtime Database Security Rules
│   └── package.json             # Backend Dependencies & Scripts
│
├── index.html                   # Root Mini App Entrance Point
├── css/                         # Root CSS Assets
├── js/                          # Root JS Assets
├── database.rules.json          # Root Firebase Rules Reference
└── package.json                 # Project Root Configuration
```

---

## 🚀 Quick Start

### Running the Backend API Server
```bash
# Run backend server (Node.js)
npm start
# or
node backend/server.js
```

The API server runs on `http://localhost:3000` with endpoints for Telegram Stars, Subscriptions, Withdrawals, and HMAC authentication.
