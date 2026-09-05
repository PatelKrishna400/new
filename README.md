# Energy Tap Reactor (Tap Empire) ⚡

A high-performance, modular Telegram Web Mini-App game with real-time Firebase Cloud synchronization, interactive mini-games, administrative portal, and Monetag rewarded ads.

---

## 🎮 Features

- **Energy Reactor & Generator**:
  - Tapping energy reactor core with multi-touch support.
  - Automatic background energy generation with live fractional EP accumulation (`0.00 EP`).
  - Dual boost overdrive multipliers (`Pink Boost` & `Purple Boost`).
  - Fuel cell charging system (`Green` & `Yellow` fuel cells).

- **Mini-Games & Rewarded Activities**:
  - **🎡 Lucky Spinner**: 8-wedge vector SVG wheel with exact 12 o'clock needle pointer alignment, jackpot odds, and smooth deceleration physics.
  - **🧰 Mystery Chest**: 3-chest selection system where the chosen chest awards its prize immediately and the other two reveal their loot, claimable with rewarded ads or resettable for the next round.
  - **🎫 Scratch & Win**: Cyber card scratching with particle confetti.
  - **🥚 Cyber Hatchery**: Incubate and hatch cyber eggs for high-tier loot.
  - **🔥 Daily Streak**: Consecutive daily check-ins with cascading bonus drops.
  - **🎯 Quest Progression & XP Levels**: Milestone rewards, level ranking, and mega goal tracks.

- **🛍️ Storefront & Custom Orders**:
  - **Mega Rewards**: 9 categorized reward showcases (`gift-card`, `gadgets`, `accessories`, `gaming-tool`, `kitchen`, `stationery`, `fitness`, `home-decorate`, `custom`).
  - **Amazon Custom Order Form**: Direct Amazon product requests with URL validation and administrator status tracking.
  - **💡 Suggestion Box**: In-app feedback system saving user suggestions directly to cloud database.

- **☁️ Firebase Realtime Cloud Synchronization**:
  - Live persistence of player progress, coins, inventory, reactor energy, and level.
  - Secure validation rules (`database.rules.json`).
  - Real-time catalog and order synchronization with the Admin Portal.

- **👑 Admin Portal (`admin/`)**:
  - Full-featured administrator dashboard for tracking users, approving/rejecting reward requests, and managing inventory.

---

## 🏗️ Project Architecture

```
tap-empire/
├── admin/                     # Administrative web portal
│   ├── css/
│   ├── js/
│   ├── index.html
│   └── users.html
├── frontend/                  # Telegram Web Mini-App
│   ├── pages/                 # 24 Modular page components (HTML + CSS + JS)
│   │   ├── home/
│   │   ├── energy/
│   │   ├── tasks/
│   │   ├── profile/
│   │   ├── xp/
│   │   ├── reward/
│   │   ├── goal/
│   │   ├── streak/
│   │   ├── mega-reward/
│   │   ├── spin/
│   │   ├── chest/
│   │   ├── scratch/
│   │   ├── egg/
│   │   ├── custom/
│   │   ├── suggest-box/
│   │   └── ...
│   ├── shared/                # Shared stylesheets, state, audio, ads & Firebase service
│   ├── assemble.js            # Modular page compiler & integrity validator
│   ├── index.html             # Compiled master web app
│   └── style.css              # Master style aggregator
├── database.rules.json        # Firebase Realtime Database security rules
├── FIREBASE_SETUP.md          # Cloud setup instructions
└── package.json
```

---

## 🚀 Getting Started

### 1. Build / Assemble Pages
Compile all modular pages into `index.html` and `style.css`:
```bash
node frontend/assemble.js
```

### 2. Local Preview
Serve the `frontend/` directory using any HTTP server:
```bash
npx serve frontend
# or
python -m http.server 8080 --directory frontend
```

---

## 📄 License
ISC
