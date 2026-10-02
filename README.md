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
│
├── admin/                              # Admin dashboard
│   ├── index.html                      # Admin login/dashboard
│   ├── users.html                      # User management
│   ├── tasks.html                      # Task management
│   ├── rewards.html                    # Reward management
│   ├── economy.html                    # Coins, energy, XP, etc.
│   ├── ads.html                        # Ad configuration
│   ├── withdrawals.html                # Withdrawal management
│   ├── referrals.html                  # Referral management
│   ├── leaderboard.html                # Leaderboard management
│   ├── settings.html                   # Global settings
│   │
│   ├── css/
│   │   ├── admin.css
│   │   ├── dashboard.css
│   │   └── responsive.css
│   │
│   └── js/
│       ├── admin.js
│       ├── auth.js
│       ├── users.js
│       ├── tasks.js
│       ├── rewards.js
│       ├── economy.js
│       ├── ads.js
│       ├── withdrawals.js
│       ├── referrals.js
│       ├── leaderboard.js
│       └── settings.js
│
├── frontend/                           # Telegram Mini App
│   │
│   ├── index.html                      # Main application entry
│   ├── style.css                       # Global/master styles
│   │
│   ├── pages/                          # Game pages/modules
│   │   ├── home/
│   │   │   ├── home.html
│   │   │   ├── home.css
│   │   │   └── home.js
│   │   │
│   │   ├── energy/
│   │   │   ├── energy.html
│   │   │   ├── energy.css
│   │   │   └── energy.js
│   │   │
│   │   ├── tasks/
│   │   │   ├── tasks.html
│   │   │   ├── tasks.css
│   │   │   └── tasks.js
│   │   │
│   │   ├── profile/
│   │   │   ├── profile.html
│   │   │   ├── profile.css
│   │   │   └── profile.js
│   │   │
│   │   ├── xp/
│   │   │   ├── xp.html
│   │   │   ├── xp.css
│   │   │   └── xp.js
│   │   │
│   │   ├── reward/
│   │   │   ├── reward.html
│   │   │   ├── reward.css
│   │   │   └── reward.js
│   │   │
│   │   ├── goal/
│   │   │   ├── goal.html
│   │   │   ├── goal.css
│   │   │   └── goal.js
│   │   │
│   │   ├── streak/
│   │   │   ├── streak.html
│   │   │   ├── streak.css
│   │   │   └── streak.js
│   │   │
│   │   ├── mega-reward/
│   │   │   ├── mega-reward.html
│   │   │   ├── mega-reward.css
│   │   │   └── mega-reward.js
│   │   │
│   │   ├── spin/
│   │   │   ├── spin.html
│   │   │   ├── spin.css
│   │   │   └── spin.js
│   │   │
│   │   ├── chest/
│   │   │   ├── chest.html
│   │   │   ├── chest.css
│   │   │   └── chest.js
│   │   │
│   │   ├── scratch/
│   │   │   ├── scratch.html
│   │   │   ├── scratch.css
│   │   │   └── scratch.js
│   │   │
│   │   ├── egg/
│   │   │   ├── egg.html
│   │   │   ├── egg.css
│   │   │   └── egg.js
│   │   │
│   │   ├── custom/
│   │   │   ├── custom.html
│   │   │   ├── custom.css
│   │   │   └── custom.js
│   │   │
│   │   └── suggest-box/
│   │       ├── suggest-box.html
│   │       ├── suggest-box.css
│   │       └── suggest-box.js
│   │
│   ├── components/                     # Reusable UI components
│   │   ├── header/
│   │   ├── bottom-nav/
│   │   ├── modal/
│   │   ├── popup/
│   │   ├── toast/
│   │   ├── loader/
│   │   ├── progress-bar/
│   │   ├── reward-card/
│   │   ├── coin-animation/
│   │   └── ad-button/
│   │
│   ├── shared/                         # Shared application logic
│   │   ├── firebase/
│   │   │   ├── config.js
│   │   │   ├── auth.js
│   │   │   ├── database.js
│   │   │   ├── users.js
│   │   │   ├── tasks.js
│   │   │   ├── rewards.js
│   │   │   ├── leaderboard.js
│   │   │   └── settings.js
│   │   │
│   │   ├── telegram/
│   │   │   ├── telegram.js
│   │   │   └── user.js
│   │   │
│   │   ├── ads/
│   │   │   ├── ads.js
│   │   │   └── ad-config.js
│   │   │
│   │   ├── state/
│   │   │   ├── app-state.js
│   │   │   ├── user-state.js
│   │   │   └── game-state.js
│   │   │
│   │   ├── audio/
│   │   │   └── audio.js
│   │   │
│   │   ├── utils/
│   │   │   ├── format.js
│   │   │   ├── validation.js
│   │   │   ├── storage.js
│   │   │   ├── time.js
│   │   │   └── security.js
│   │   │
│   │   └── constants/
│   │       ├── economy.js
│   │       ├── rewards.js
│   │       └── game-config.js
│   │
│   ├── assets/
│   │   ├── images/
│   │   ├── icons/
│   │   ├── backgrounds/
│   │   ├── rewards/
│   │   ├── skins/
│   │   └── sounds/
│   │
│   └── animations/
│       ├── coin.css
│       ├── energy.css
│       ├── reward.css
│       ├── popup.css
│       └── transitions.css
│
├── backend/                            # Server-side operations
│   ├── api/
│   │   ├── users.js
│   │   ├── rewards.js
│   │   ├── tasks.js
│   │   ├── ads.js
│   │   └── withdrawals.js
│   │
│   ├── services/
│   │   ├── firebase.js
│   │   ├── telegram.js
│   │   └── validation.js
│   │
│   └── index.js
│
├── scripts/
│   ├── assemble.js                     # Page compiler
│   ├── validate.js                     # Integrity checker
│   ├── optimize.js                     # Production optimization
│   └── build.js                        # Production build
│
├── database.rules.json                  # Firebase security rules
├── firebase.json                        # Firebase configuration
├── FIREBASE_SETUP.md
├── README.md
├── package.json
├── .env.example
├── .gitignore
└── vercel.json
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
