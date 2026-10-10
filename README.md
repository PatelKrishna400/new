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
energy-tap-platform/
│
├── server.js                      # Core Node.js HTTP backend (REST endpoints, anti-fraud, MIME & static streaming)
├── package.json                   # Dependencies and npm build/start scripts
├── assemble.js                    # Root orchestrator executing frontend and admin compilation
├── test.js                        # Master automated verification test suite
├── reset-firebase-data.js         # Firebase database initialization & reset utility
│
├── database.rules.json            # Firebase Realtime Database rules
├── firestore.rules                # Google Cloud Firestore security rules
├── firebase.json                  # Firebase hosting configuration
├── vercel.json                    # Vercel serverless deployment & routing configuration
│
├── admin/                         # Admin Management Portal
│   ├── index.html                 # Compiled master admin dashboard
│   ├── style.css                  # Compiled admin stylesheet
│   ├── assemble.js                # Admin compiler script
│   ├── shared/                    # Shared admin scripts & CSS
│   │   ├── firebase.js            # Admin Firebase SDK bridge
│   │   └── common.css             # Admin design tokens & table styles
│   └── pages/                     # 9 Modular administrative control pages
│       ├── dashboard/             # Platform analytics & overview
│       ├── users/                 # Player search, balance modifier, bans
│       ├── account-requests/      # Multi-identity resolution
│       ├── ads-manage/            # Monetag ad zones & settings
│       ├── firebase-manage/       # Cloud backup export & restore
│       ├── mega-add/              # Custom jackpot / reward creator
│       ├── mega-request/          # Cashout & payout approval review
│       ├── settings/              # Maintenance mode & global settings
│       └── tasks-web/             # Partner web & Telegram tasks manager
│
└── frontend/                      # Player Client Single Page Application (SPA)
    ├── index.html                 # Compiled client SPA containing all 31 page views
    ├── style.css                  # Compiled master stylesheet
    ├── assemble.js                # Frontend compiler script
    ├── shared/                    # Core client engines & services
    │   ├── state.js               # Reactive gameState store & local persistence
    │   ├── app.js                 # App bootstrapper, router, audio & notifications
    │   ├── firebase-service.js    # Firebase Realtime Database & Firestore sync
    │   ├── ad-service.js          # Monetag SDK & fallback ad player
    │   └── common.css             # Cyber theme variables & animations
    └── pages/                     # 31 Modular self-contained game pages
        ├── home/                  # Central Quantum Reactor core & tap engine
        ├── energy/                # 7-tier fuel injector & upgrades
        ├── diamond-generator/     # Infinite diamond miner & piggy bank vault
        ├── sunflower/             # Sunflower Valley 20 lands farm & water wells
        ├── bee-farm/              # Honey apiary 20 meadows farm & honey hives
        ├── mining/                # Cryo-bore drill 20 mines & geothermal extractors
        ├── tasks/                 # Daily, Telegram, and Website sponsor quests
        ├── profile/               # Player statistics, hourly coins & vault passes
        ├── xp/                    # Levels 1-1000 roadmap & 10,000 Coin cash prize
        ├── reward/                # Cyber arcade mini-game directory
        ├── goal/                  # Goals 1-1000 roadmap & mega goal reward
        ├── streak/                # 30-Day login streak matrix
        ├── mega-reward/           # Community progressive jackpots
        ├── gift-card/             # Gift cards redemption marketplace
        ├── gadgets/               # Tech gadgets & hardware rewards
        ├── accessories/           # Reactor ring cosmetic skins
        ├── gaming-tool/           # CPS speed analyzer & diagnostic tools
        ├── kitchen/               # Lifestyle goods catalog
        ├── stationery/            # Creative office supplies catalog
        ├── fitness/               # Athletic equipment catalog
        ├── home-decorate/         # Interior ambient lighting catalog
        ├── custom/                # Bespoke custom prize requests
        ├── suggest-box/           # Community voting & suggestion box
        ├── ad-rewards/            # Direct rewarded video ad refill station
        ├── spin/                  # Lucky rotary wheel mini-game (HTML5 Canvas)
        ├── chest/                 # 4-tier mystery vault mini-game
        ├── scratch/               # Quantum scratch card (Foil erase & prize tiers)
        ├── egg/                   # 12-Egg cyber hatchery mini-game
        ├── leaderboard/           # Global live player rankings
        ├── memory-match/          # 4x4 Memory Match card game & balloon pursuit
        └── coin-catcher/          # Falling coins & bomb dodge arcade game
```

---

## 🚀 Getting Started

### 1. Build & Compile All Modules
Compile both frontend and admin modular pages into their production targets:
```bash
node assemble.js
```

### 2. Run Master Verification Test Suite
Validate element IDs, inline handlers, page triplets, and Firebase connectivity:
```bash
node test.js
```

### 3. Start the Local Server
Launch the HTTP server and backend API:
```bash
node server.js
```
- **Game Client**: `http://localhost:3000/`
- **Admin Portal**: `http://localhost:3000/admin/`
- **API Health**: `http://localhost:3000/api/health`

---

## 📄 License
ISC
