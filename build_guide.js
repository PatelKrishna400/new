const fs = require('fs');
const path = require('path');

const guidePath = path.join(__dirname, 'guide.txt');

const content = `================================================================================
          ENERGY TAP REACTOR & REWARDS PLATFORM - COMPLETE TECHNICAL GUIDE
================================================================================
Generated for: Comprehensive Codebase Documentation & Reference
Scope: Every Page, Every Module, Every Function, and Line-by-Line Architecture
File Format: Pure Text (.txt)
================================================================================

TABLE OF CONTENTS
--------------------------------------------------------------------------------
1. EXECUTIVE ARCHITECTURE & REPOSITORY BLUEPRINT
   1.1 Technical Stack & Ecosystem
   1.2 Directory Structure & Organization
   1.3 Modular Component Lifecycle & The Assemble Engine (assemble.js)

2. BACKEND SERVER ARCHITECTURE (server.js)
   2.1 Server Dependencies & Global State Stores
   2.2 HTTP Listener & Routing Engine
   2.3 Authentication & Multi-Identity Management Engine
   2.4 Level Progression & Game Configuration Endpoints
   2.5 Tasks & User Administration Endpoints
   2.6 Security, CORS & Request Validation

3. FRONTEND CORE & SHARED CLIENT SERVICES (frontend/shared/)
   3.1 Reactive Game State & Storage Engine (state.js)
   3.2 Application Controller, Audio Synthesizer & Router (app.js)
   3.3 Cloud Database & Realtime Synchronization (firebase-service.js)
   3.4 Ad Network Integration & Simulation System (ad-service.js)
   3.5 Global Design System & Cyber Theme Tokens (common.css)

4. DEEP-DIVE INTO ALL 25 FRONTEND PAGES (frontend/pages/)
   4.1  Home Page (home) - Quantum Reactor Core
   4.2  Energy Page (energy) - 7-Tier Fuel Injector & Booster
   4.3  Tasks Page (tasks) - Social Missions & Verification Timers
   4.4  Profile Page (profile) - Player Identity & Referral Network
   4.5  XP Page (xp) - 1 to 1000 Level Roadmaps & Mega Cash Prize
   4.6  Reward Page (reward) - Cyber Arcade & Mini-Game Hub
   4.7  Goal Page (goal) - 1 to 1000 Milestones & Mega Goal Prize
   4.8  Streak Page (streak) - Consecutive Login Matrix
   4.9  Mega Reward Page (mega-reward) - High-Roller Challenges
   4.10 Gift Card Page (gift-card) - Store Voucher Redemption
   4.11 Gadgets Page (gadgets) - Tech Hardware Marketplace
   4.12 Accessories Page (accessories) - Visual Skins & Custom Rings
   4.13 Gaming Tool Page (gaming-tool) - CPS Speed Analyzer & Utilities
   4.14 Kitchen Page (kitchen) - Lifestyle Goods Catalog
   4.15 Stationery Page (stationery) - Office & Creative Supplies
   4.16 Fitness Page (fitness) - Health & Athletic Equipment
   4.17 Home Decorate Page (home-decorate) - Ambient Living Products
   4.18 Custom Page (custom) - Bespoke Orders & Exclusive Perks
   4.19 Suggest Box Page (suggest-box) - Feedback & Polling Engine
   4.20 Ad Rewards Page (ad-rewards) - Direct Monetag Ad Booster
   4.21 Spin Page (spin) - Lucky Rotary Wheel
   4.22 Chest Page (chest) - Multi-Tier Mystery Vaults
   4.23 Scratch Page (scratch) - Quantum Scratch Ticket
   4.24 Egg Page (egg) - 12-Egg Cyber Hatchery
   4.25 Leaderboard Page (leaderboard) - Global Realtime Rankings

5. ADMIN PORTAL MODULES & CONTROL CENTER (admin/)
   5.1 Admin Architecture & Modular Pipeline
   5.2 Dashboard Module (dashboard)
   5.3 User Management Module (users)
   5.4 Account Verification Module (account-requests)
   5.5 Ad Network Configuration Module (ads-manage)
   5.6 Firebase Control Module (firebase-manage)
   5.7 Mega Reward Creation Module (mega-add)
   5.8 Mega Payout Processing Module (mega-request)
   5.9 Global System Settings Module (settings)
   5.10 Web & Social Tasks Control Module (tasks-web)
   5.11 Admin Firebase SDK Bridge (admin/shared/firebase.js)

6. SECURITY RULES & CONFIGURATIONS
   6.1 Firebase Realtime Database Security (database.rules.json)
   6.2 Cloud Firestore Security (firestore.rules)
   6.3 Cloud Hosting & Rewrites (firebase.json & vercel.json)

7. END-TO-END EXECUTION FLOWS & USER LIFECYCLE
   7.1 Tap Execution & Power Consumption
   7.2 XP Level Advance & Dark Green Fuel Payout (Levels 1 - 1000)
   7.3 Goal Milestone Progression (Goals 1 - 1000)
   7.4 Scratch Card Unlock, Rubbing, & Probabilistic Payout
   7.5 12-Egg Hatchery 10-Item Randomization & 11th Hatch Victory
================================================================================

================================================================================
SECTION 1: EXECUTIVE ARCHITECTURE & REPOSITORY BLUEPRINT
================================================================================

1.1 TECHNICAL STACK & ECOSYSTEM
- Runtime Environment: Node.js (v18+ recommended) with native HTTP and FileSystem.
- Client Technology: Pure Vanilla HTML5, CSS3, and Modern ES6+ JavaScript. No bulky
  client-side frameworks (React/Vue/Angular) are used, ensuring instantaneous load
  times under 500ms on mobile devices.
- Graphics & Canvas: HTML5 2D Canvas rendering context used for the Quantum Scratch
  Ticket realistic metallic film erasing, scratch particle physics, and rotary lucky wheel.
- Audio Synthesis: Web Audio API (AudioContext) generates procedural sound waves
  (square, sine, sawtooth) dynamically without relying on external MP3/WAV assets.
- Platform Integration: Telegram WebApp SDK (telegram-web-app.js) enables automatic
  user credential retrieval, theme color synchronization, and native mobile haptics.
- Ad Monetization: Monetag Rewarded Interstitial SDK (Zone 11677609) integrated with
  in-house client-side fraud prevention and fallback simulation mechanics.
- Database & Realtime Sync: Dual backend architecture supporting both Google Firebase
  (Realtime Database & Firestore) and an internal Node.js in-memory sync engine.

1.2 DIRECTORY STRUCTURE & ORGANIZATION
- d:\\project\\tap gmae\\new\\
  |-- server.js                 : Master Node.js HTTP server and REST API handler.
  |-- assemble.js               : Top-level build script triggering frontend assembly.
  |-- package.json              : Project metadata and script aliases.
  |-- database.rules.json       : Realtime Database security rules.
  |-- firestore.rules           : Cloud Firestore role-based security rules.
  |-- firebase.json             : Firebase CLI hosting and emulator configuration.
  |-- vercel.json               : Serverless routing and proxy rules for Vercel deployment.
  |
  |-- frontend/
  |   |-- index.html            : Master compiled Single Page Application (SPA).
  |   |-- style.css             : Master stylesheet with modular imports.
  |   |-- assemble.js           : Compilation engine assembling 25 modular pages.
  |   |-- shared/
  |   |   |-- state.js          : Central reactive gameState object and persistence.
  |   |   |-- app.js            : Application bootstrapper, router, audio, and toast engine.
  |   |   |-- firebase-service.js: Firebase sync queue and real-time listeners.
  |   |   |-- ad-service.js     : Monetag SDK integration and simulator.
  |   |   |-- common.css        : Design tokens, color palettes, animations, typography.
  |   |-- pages/                : 25 individual, self-contained game pages.
  |   |   |-- home/             : Reactor Orb, energy display, click floater animations.
  |   |   |-- energy/           : Fuel injector, energy upgrades, turbo timers.
  |   |   |-- tasks/            : Social tasks, channel links, countdown verifiers.
  |   |   |-- profile/          : Account summary, referral links, user badges.
  |   |   |-- xp/               : Levels 1 to 1000 list and 10K Cash Mega Prize.
  |   |   |-- reward/           : Mini-game arcade selector.
  |   |   |-- goal/             : Goals 1 to 1000 list and Level 1000 Mega Goal Prize.
  |   |   |-- streak/           : Consecutive daily check-in calendar.
  |   |   |-- mega-reward/      : Progressive community jackpot challenges.
  |   |   |-- gift-card/        : Google Play, Amazon, Steam card redemption store.
  |   |   |-- gadgets/          : Tech gadgets and mobile phones redemption.
  |   |   |-- accessories/      : Custom reactor ring skins and cosmetic glows.
  |   |   |-- gaming-tool/      : Click speed CPS analyzer and haptic switches.
  |   |   |-- kitchen/          : Household & kitchenware rewards.
  |   |   |-- stationery/       : Office and academic stationery rewards.
  |   |   |-- fitness/          : Health and workout gear rewards.
  |   |   |-- home-decorate/    : Ambient lighting and room decor rewards.
  |   |   |-- custom/           : Bespoke customer reward orders.
  |   |   |-- suggest-box/      : Player suggestion box and feedback submitter.
  |   |   |-- ad-rewards/       : Direct rewarded ad watcher for fuel cells.
  |   |   |-- spin/             : Wheel of fortune lucky spinner.
  |   |   |-- chest/            : Mystery chests (Bronze, Silver, Gold, Cyber).
  |   |   |-- scratch/          : Quantum Scratch Card (Foil Canvas + 5 Prize Odds).
  |   |   |-- egg/              : 12-Egg Cyber Hatchery (10 Random + 11th Hatch Win).
  |   |   |-- leaderboard/      : Global top tappers and level rankings.
  |
  |-- admin/
  |   |-- index.html            : Master compiled Admin Dashboard.
  |   |-- assemble.js           : Admin compilation script assembling 9 admin modules.
  |   |-- shared/
  |   |   |-- firebase.js       : Admin Firebase SDK initializer.
  |   |   |-- common.css        : Admin portal styling and layout tokens.
  |   |-- pages/                : 9 admin management modules.
  |       |-- dashboard/        : Live metrics, active sessions, coin circulation.
  |       |-- users/            : User search, balance editor, ban/unban toggles.
  |       |-- account-requests/ : Multi-account conflict resolver.
  |       |-- ads-manage/       : Monetag zone IDs, cooldowns, and page caps.
  |       |-- firebase-manage/  : Data exporter, importer, and collection resetter.
  |       |-- mega-add/         : Custom mega reward creator.
  |       |-- mega-request/     : Payout review for Level 1000 cash prizes (UPI/Paytm).
  |       |-- settings/         : Maintenance mode, announcements, 1000 level editor.
  |       |-- tasks-web/        : Partner website and social tasks manager.

1.3 THE ASSEMBLE ENGINE (frontend/assemble.js & assemble.js)
The assemble script solves the problem of file sprawl versus clean modular code.
Each page is developed in 3 separate files:
1. <page>.html : Contains only the inner <div class="page-view" id="page<Name>">.
2. <page>.css  : Contains only the styling scoped to that page view.
3. <page>.js   : Contains only the logic and event bindings for that page view.

How the compilation algorithm works:
Step 1: The script scans the array PAGE_KEYS containing all 25 page names.
Step 2: It checks fs.existsSync() for all 3 files in every directory. If any file is
        missing, it logs an error and halts with process.exit(1).
Step 3: It constructs the <head> block, automatically injecting:
        - Meta viewport with viewport-fit=cover for mobile devices.
        - Telegram WebApp SDK script tag.
        - Monetag Rewarded Interstitial SDK (data-zone="11677609").
        - Google Fonts: 'Plus Jakarta Sans' and 'JetBrains Mono'.
        - Shared global stylesheet (shared/common.css).
        - Links to all 25 page-specific stylesheets.
Step 4: It reads the HTML file of every page and concatenates them into the <main>
        container of index.html.
Step 5: It injects global navigation elements (the top header pill bar and bottom
        floating cyber navigation bar).
Step 6: It embeds script tags for the shared core (state.js, firebase-service.js,
        ad-service.js, app.js), followed by all 25 page-specific JavaScript files.
Step 7: Writes the output atomically to frontend/index.html.
Result: Developers can work on independent, clean files without messy merge conflicts,
while the browser loads a single unified index.html.


================================================================================
SECTION 2: BACKEND SERVER ARCHITECTURE (server.js)
================================================================================

2.1 SERVER DEPENDENCIES & GLOBAL STATE STORES
server.js is built using Node.js standard modules (http, fs, path) without requiring
heavy third-party frameworks.
- Port Binding: Defaults to process.env.PORT or 3000.
- MIME Types Dictionary (MIME_TYPES):
  Maps file extensions (.html, .css, .js, .json, .png, .jpg, .svg, .webp) to standard
  Content-Type headers with utf-8 charset for text resources.
- In-Memory Fallback Cache (memoryStore):
  Serves as high-speed cache and resilience layer when Firebase is unreachable:
  - memoryStore.rewards: Array of system rewards.
  - memoryStore.requests: User cashout and prize requests.
  - memoryStore.accountRequests: Identity verification requests.
  - memoryStore.users: Dictionary of user objects indexed by UID.
  - memoryStore.websiteTasks & telegramTasks: Active engagement missions.
  - memoryStore.gameConfig: App title, maintenanceMode boolean, announcement banner.
  - memoryStore.levelsConfig: Custom overrides for Levels 1 to 1000.
  - memoryStore.identityIndex: Hash maps ensuring uniqueness:
    * telegram: tgId -> uid
    * phone: normalizedPhone -> uid
    * email: normalizedEmail -> uid
  - memoryStore.authConfig: Toggles for allowed authentication methods and one-account
    enforcement rules.

2.2 HTTP LISTENER & ROUTING ENGINE
- http.createServer(async (req, res)):
  The main request processor that handles CORS pre-flight, API routes, and static file delivery.
- Helper parseRequestBody(req):
  Returns a Promise that buffers incoming data streams and parses JSON payloads safely,
  returning an empty object on malformed input to avoid crashing the server process.
- Helper sendJson(res, statusCode, data):
  Standardizes API responses with HTTP status code, application/json header, and CORS headers
  allowing cross-origin requests from Telegram Mini App webviews.

2.3 AUTHENTICATION & MULTI-IDENTITY MANAGEMENT
- Identity Normalization:
  * normalizeTelegramId(id): Trims whitespace and casts to string.
  * normalizePhone(phone): Strips all non-digit characters (+, -, spaces, parentheses).
  * normalizeEmail(email): Trims whitespace and casts to lowercase.
- Route /api/auth/verify-unique (POST):
  Verifies if a Telegram ID, phone number, or email is already registered to another player.
  Returns { allowed: true } or { allowed: false, conflict: 'telegram'|'phone'|'email' }.
- Route /api/auth/register-identities (POST):
  Registers a new user and binds their unique identities into memoryStore.identityIndex.
- Route /api/auth/link-account (POST):
  Links a secondary credential (e.g. binding phone or email to an existing Telegram account).
- Route /api/auth/config (GET):
  Provides public auth feature flags to the client.
- Route /api/admin/auth-config (GET & POST):
  Allows administrators to toggle authentication rules dynamically.

2.4 LEVEL PROGRESSION & GAME CONFIGURATION ENDPOINTS
- Route /api/levels/config (GET):
  Returns custom configurations for Levels 1 to 1000. If no admin override exists,
  returns an empty object, causing the frontend to use deterministic mathematical formulas.
- Route /api/levels/update (POST):
  Admin endpoint to lock, unlock, or modify XP and reward quantities for any level between 1 and 1000.
- Route /api/game-config (GET & POST):
  Retrieves or updates global settings like maintenance mode and announcement alerts.

2.5 TASKS & USER ADMINISTRATION ENDPOINTS
- Route /api/users (GET & POST):
  Allows admin to search, list, ban, unban, or update player balances.
- Route /api/website-tasks & /api/telegram-tasks:
  CRUD endpoints for adding, modifying, or deleting engagement tasks with reward values.
- Route /api/requests & /api/account-requests:
  Manages withdrawal requests for Level 1000 Cash Prizes and identity resolutions.

2.6 STATIC ASSET DELIVERY
- If the incoming request path does not match /api/*, the server acts as a static file server.
- Sanitizes file paths using path.normalize to prevent directory traversal attacks.
- Maps "/" to "frontend/index.html" and "/admin" to "admin/index.html".
- Reads the file using fs.createReadStream() with efficient chunked piping and sets appropriate
  MIME Content-Type headers. Returns 404 with a clean fallback if the file does not exist.


================================================================================
SECTION 3: FRONTEND CORE & SHARED CLIENT SERVICES (frontend/shared/)
================================================================================

3.1 REACTIVE GAME STATE & STORAGE ENGINE (frontend/shared/state.js)
The file state.js acts as the single source of truth for the entire client application.
- Global Object window.gameState:
  * player:
    - uid: Unique user identifier (UUID or Telegram ID).
    - name: Player display name.
    - level: Current player progression level (1 to 1000).
    - xp: Current accumulated XP.
    - coins: Standard gold coins for upgrades and rewards.
    - blueCoins: Rare premium currency.
    - diamonds: Premium gemstone currency.
    - chestKeys: Keys used to unlock mystery chests (Bronze, Silver, Gold, Cyber).
    - chestTickets: Spin tickets used in the Lucky Wheel.
    - scratchCards: Cards required to unlock and play Quantum Scratch Tickets.
    - eggs: Egg coins required to hatch eggs in the Cyber Hatchery.
  * reactor:
    - currentEnergy: Energy currently available in the core (e.g. 1000/1000).
    - maxEnergy: Maximum energy capacity.
    - clickPower: Amount of energy converted and coins awarded per tap.
    - regenRate: Energy regenerated per second.
  * energyGenerator:
    - level: Generator tier level.
    - remainingSeconds: Countdown for active turbo fuel acceleration.
    - fuelCells: Inventory of colored fuel cells:
      { green, darkgreen, yellow, orange, red, pink, purple }.
  * progression:
    - activeLevel: Active progression milestone (1 to 1000).
    - completedLevels: Hash map of claimed level reward flags { [lvl]: true }.
    - levelXp: Current XP within the current level.
  * goalState:
    - currentLevel: Current goal level milestone (1 to 1000).
    - currentSubtab: 'goals' | 'mega'.
    - levelProgress: Collected items for the active level: { cards: 0, keys: 0, tickets: 0 }.
    - claimedGoals: Hash map of completed goals { [lvl]: true }.
    - megaWatchedAds: Ads watched toward Goal Level 1000 Mega Reward (0 to 1000).
    - megaRewardClaimed: Boolean flag indicating if Level 1000 Mega Prize was claimed.
  * xpState:
    - currentSubtab: 'levels' | 'mega'.
    - claimedLevels: Hash map of claimed XP level rewards { [lvl]: true }.
    - watchedAds: Ads watched toward Level 1000 Cash Prize (0 to 1000).
    - megaRewardClaimed: Boolean flag for Level 1000 Cash Prize claim.
    - seasonEndMs: Timestamp for current seasonal cycle expiration.
  * eggHatchState:
    - eggs: Array of 12 egg objects for the active round.
    - collected: Item collection tally: { key, ticket, card, coin, blueCoin }.
    - hatchedCount: Number of eggs hatched in the current round (0 to 11).
    - targetWinner: Pre-selected winning category for hatch #11.
    - first10Items: Shuffled list of 10 items (2 of each category) ensuring no 3-match before hatch 11.
    - gameCompleted: Boolean indicating the current 12-egg round has finished.
  * singleCardState:
    - hasActiveTicket: Strict boolean flag. When false, canvas cannot be scratched.
    - currentReward: Secret reward object revealed upon scratching.
    - isRevealed: True when >= 48% foil is cleared.
- Function saveGame():
  Serializes gameState into JSON and stores it in localStorage under key 'energyTapSaveData'.
  Includes try-catch guard to prevent exceptions if storage quotas are exceeded.
- Function loadGame():
  Reads 'energyTapSaveData' from localStorage. If found, deeply merges saved properties
  into default state, ensuring newly added fields in updates are never undefined.

3.2 APPLICATION CONTROLLER, AUDIO SYNTHESIZER & ROUTER (frontend/shared/app.js)
app.js manages application bootstrap, page routing, audio synthesis, modal dialogs,
and the periodic synchronization loop.
- DOM Cache Object (DOM):
  Caches frequently accessed DOM nodes (page containers, header pills, balance counters)
  at boot to avoid slow document.getElementById calls during 60fps animations.
- Function switchPage(pageId):
  1. Hides all elements with class .page-view by removing the 'active' class.
  2. Selects the target container #page<CapitalizedId> and adds 'active'.
  3. Updates the active indicator icon on the floating bottom navigation bar.
  4. Triggers page-specific initialization if available (e.g. initScratchPage, renderGoalsList).
  5. Plays subtle navigation audio tap.
- Audio Synthesizer (window.sfx):
  Uses standard AudioContext without any external sound audio files:
  * playTapSound(pitch): Creates OscillatorNode with short 0.05s burst and linear gain fadeout.
  * playLevelUpSound(): Plays an arpeggiated celebratory chord sequence (C5, E5, G5, C6).
  * playCoinSound(): High-pitch 987Hz sine wave tone simulating metallic coin pickup.
  * playErrorSound(): Low-pitch 140Hz sawtooth wave indicating invalid action.
- Native Telegram Haptics (window.triggerTelegramHaptic(type)):
  Detects if window.Telegram.WebApp.HapticFeedback is available and invokes:
  * 'light', 'medium', 'heavy' impact feedback.
  * 'success', 'warning', 'error' notification feedback.
- Toast & Modal Helpers:
  * showFloatingToast(message): Spawns floating neon capsule that slides in from top,
    persists for 2.8 seconds, and smoothly fades out.
  * openTabModal(title, htmlContent): Displays centered glassmorphic dialog with backdrop blur.
  * closeTabModal(): Closes active modal.
- Master Update Loop (updateUI()):
  Runs periodically and on state changes to update coin counters, reactor energy fill bars,
  pill values, and trigger active page synchronization.

3.3 CLOUD DATABASE & REALTIME SYNCHRONIZATION (frontend/shared/firebase-service.js)
Handles synchronization between local gameState and Google Firebase cloud stores.
- Initialization:
  Initializes Firebase App with apiKey, authDomain, databaseURL, and projectId.
  Connects to Firebase Realtime Database (rtdb) and Cloud Firestore (db).
- Function saveToCloudImmediate():
  Debounced cloud saving function that pushes user progress to /users/{uid} in Realtime Database.
  Includes offline fallback queue: if internet disconnects, changes are saved locally and
  automatically flushed when window 'online' event fires.
- Function fetchCloudData(uid):
  Pulls player profile from the cloud upon launch, performs timestamp comparison to resolve
  conflicts, and updates local state if cloud data is newer.
- Function syncLeaderboard():
  Pushes player's lifetime coins, level, and tap count to /leaderboard for global ranking.

3.4 AD NETWORK INTEGRATION & SIMULATOR (frontend/shared/ad-service.js)
Integrates Monetag Rewarded Interstitial video advertising with anti-cheat protection.
- Function showRewardedAd(onSuccess, onFail):
  1. Calls window.show_11677609() provided by Monetag SDK.
  2. If the ad successfully completes, invokes onSuccess callback.
  3. If Monetag is blocked by an adblocker or fails to load, automatically routes the user
     to startAdSimulation() so the player is never prevented from progressing.
- Function startAdSimulation(zoneId, title, desc, onComplete):
  Renders an in-app simulated ad player modal with a high-tech progress countdown (typically 5s),
  ensuring full gameplay continuity even in offline or ad-restricted test environments.

3.5 GLOBAL DESIGN SYSTEM & CYBER THEME TOKENS (frontend/shared/common.css)
Defines the visual identity of the entire platform:
- Color Tokens: Deep space obsidian backgrounds (#040919, #0a0f24), emerald energy (#10b981,
  #34d399), cyan highlights (#06b6d4, #38bdf8), royal purples (#8b5cf6), and gold (#fbbf24).
- Glassmorphism: Semi-transparent surfaces using background: rgba(...) with backdrop-filter:
  blur(16px) and subtle neon border strokes.
- Typography: 'Plus Jakarta Sans' for primary UI headings and 'JetBrains Mono' for numbers,
  timers, and crypto-themed labels.
- Micro-Animations: Pulse rings, floating sparkles, shaking wobbles on hatch, and glowing auras.


================================================================================
SECTION 4: DEEP-DIVE INTO ALL 25 FRONTEND PAGES (frontend/pages/)
================================================================================

--------------------------------------------------------------------------------
4.1 HOME PAGE (frontend/pages/home/)
--------------------------------------------------------------------------------
- Purpose: The core clicker engine. Players tap the Central Quantum Reactor to extract
  energy, earn coins, and gain XP.
- HTML Elements:
  * #reactorCoreWrapper: Container holding the animated reactor rings and orb.
  * #reactorOrb: Main interactive button.
  * #energyFillBar: Visual gauge representing remaining energy.
  * #energyValText: Numeric energy indicator (e.g. 1000 / 1000).
- CSS Highlights:
  * .splash-reactor-core: Multi-layered rotating SVG rings with CSS keyframe spin animations.
  * .tap-floater: Dynamically created text that floats upward (+5 Coins) and fades out.
- JavaScript Logic (home.js):
  * handleReactorTap(event):
    1. Checks if gameState.reactor.currentEnergy >= clickPower.
    2. If depleted, plays error sound and displays "Core Depleted - Recharge or Insert Fuel!".
    3. Deducts clickPower from currentEnergy.
    4. Adds coins and XP to player state.
    5. Spawns floating number particle at tap coordinates.
    6. Plays procedural tap audio via sfx.playTapSound().
    7. Triggers Telegram light haptic impact.
    8. Updates energy progress bar and UI counters.

--------------------------------------------------------------------------------
4.2 ENERGY PAGE (frontend/pages/energy/)
--------------------------------------------------------------------------------
- Purpose: Management hub for the Reactor Generator. Players insert fuel cells to recharge
  energy or boost regeneration speed.
- HTML Elements:
  * #fuelCellsGrid: Grid displaying counts of 7 fuel types: Green, Dark Green, Yellow,
    Orange, Red, Pink, and Purple.
  * #generatorLevelBadge: Displays current generator upgrade tier.
  * #btnUpgradeGenerator: Button to upgrade generator with coins.
  * #btnTurboBooster: Button to watch a rewarded ad for 2x speed boost.
- JavaScript Logic (energy.js):
  * insertFuelCell(color):
    Checks if gameState.energyGenerator.fuelCells[color] > 0. If available, decrements
    cell count, restores reactor energy, adds temporary regen speed multiplier, and saves state.
  * upgradeGenerator():
    Checks coin cost for next generator level. If affordable, deducts coins, increases maxEnergy
    and regenRate permanently.
  * activateTurboBoost():
    Calls showRewardedAd(). On success, adds 1800 seconds (30 mins) to remainingSeconds.

--------------------------------------------------------------------------------
4.3 TASKS PAGE (frontend/pages/tasks/)
--------------------------------------------------------------------------------
- Purpose: Engagement center where players perform social tasks (joining Telegram groups,
  watching YouTube videos, visiting partner websites) to earn bonus keys, tickets, and coins.
- HTML Elements:
  * #tasksScrollList: Dynamic container holding task cards.
  * .task-item-card: Card containing task title, reward badge, and action button.
- JavaScript Logic (tasks.js):
  * renderTasksList(): Iterates over active tasks list and generates cards with state
    (Claimable, In Progress with timer, or Completed).
  * startTask(taskId): Opens external link and starts verification countdown timer.
  * verifyAndClaimTask(taskId): Confirms countdown completion, marks task as claimed,
    and credits reward to player balance.

--------------------------------------------------------------------------------
4.4 PROFILE PAGE (frontend/pages/profile/)
--------------------------------------------------------------------------------
- Purpose: Player account dashboard, lifetime achievement summary, and referral system.
- HTML Elements:
  * #profileAvatar: Player avatar with level frame.
  * #referralLinkInput: Readonly input displaying user's personal Telegram referral invite link.
  * #btnCopyRefLink: Button to copy referral URL to clipboard.
  * #lifetimeStatsGrid: Grid displaying total taps, total coins earned, and days active.
- JavaScript Logic (profile.js):
  * copyReferralLink():
    Copies referral URL to system clipboard and displays success toast.
  * syncProfileCloud():
    Forces immediate cloud synchronization with Firebase.

--------------------------------------------------------------------------------
4.5 XP PAGE (frontend/pages/xp/)
--------------------------------------------------------------------------------
- Purpose: Full progression roadmap for Levels 1 to 1000 and Level 1000 Mega Cash Prize.
- HTML Elements:
  * #btnToggleLevels: Navigation button showing "LV. 1 - 1000".
  * #subtabLevelsList: Subtab button showing "Levels 1 - 1000".
  * #subtabMegaReward: Subtab button showing "10,000 Mega Reward".
  * #levelsScrollList: Virtualized scroll container rendering rows for Levels 1 through 1000.
  * #megaStep1Badge & #megaStep1SubText: Status of Step 1 (Reach Level 1000).
  * #megaStep2Card & #megaAdsCounterHeader: Status of Step 2 (Watch 1,000 Ads).
  * #megaActionBtn: Master action button to watch ads or claim 10,000 coins cashout.
- JavaScript Logic (xp.js):
  * switchXpSubtab(subtab): Toggles between 'levels' and 'mega' subviews.
  * calculateLevelDarkGreenFuel(lvl):
    Formula: Math.max(1, Math.min(200, Math.ceil(lvl / 5))).
    Scales smoothly from 1 Dark Green Fuel at Level 1 up to 200 at Level 1000.
  * renderLevelsList():
    Iterates lvl from 1 to 1000:
    - Calculates required XP (lvl * 1000, or admin override from getLevelConfig(lvl)).
    - Checks if level is unlocked, reached, or already claimed.
    - Renders level badge, XP requirement, fuel reward pill, and "Claim" button.
  * claimLevelReward(lvl):
    Verifies user has reached required XP. Calls showRewardedAd() (1 compulsory ad per claim).
    Awards Dark Green Fuel cells into gameState.energyGenerator.fuelCells.darkgreen, marks level
    as claimed, advances player to next level (clamped to Math.min(1000, lvl + 1)), and displays
    modal celebration.
  * handleMegaRewardAction():
    Requires gameState.player.level >= 1000. Tracks watching 1,000 ads. When 1,000/1,000 ads
    are watched, claims the 10,000 Coins grand prize.
  * testSetLevel1000(): Developer helper to jump to Level 1000 with 1,000,000 XP.

--------------------------------------------------------------------------------
4.6 REWARD PAGE (frontend/pages/reward/)
--------------------------------------------------------------------------------
- Purpose: Cyber arcade navigation hub linking players to mini-games.
- HTML Elements:
  * .mini-game-card: Large interactive portal cards for:
    - Quantum Scratch Ticket (Costs 1 Card)
    - 12-Egg Cyber Hatchery (Costs 1 Egg Coin)
    - Lucky Spin Wheel (Costs 1 Spin Ticket)
    - Mystery Chest Vault (Costs Keys)
- JavaScript Logic (reward.js):
  * Navigates to selected mini-game page via switchPage(targetPage).
  * Refreshes resource counter badges on entry.

--------------------------------------------------------------------------------
4.7 GOAL PAGE (frontend/pages/goal/)
--------------------------------------------------------------------------------
- Purpose: 3-Emoji Progression Roadmap for Goals 1 to 1000 requiring Cards 🃏,
  Dandiyas/Keys 🥢, and Flowers/Tickets 🌸, plus Level 1000 Mega Goal Prize.
- HTML Elements:
  * #subtabGoalsList: Subtab button showing "Goals 1 - 1000".
  * #subtabGoalMegaReward: Subtab button showing "Mega Reward".
  * #goalsScrollList: Scroll list displaying Goals 1 through 1000.
  * #goalMegaStep1Card: Status card for Step 1 (Complete Goal Level 1000).
  * #goalMegaStep2Card: Status card for Step 2 (Watch 1,000 Ads).
  * #goalMegaActionBtn: Action button to watch ads or claim 100 Keys, 75 Cards, 150 Tickets, 1,000 Coins.
- JavaScript Logic (goal.js):
  * getGoalLevelRequirements(lvl):
    Calculates 3-emoji requirements for any level from 1 to 1000:
    - Level 1: Cards = 20, Keys = 50, Tickets = 35.
    - Level 1000: Cards = 200,000, Keys = 500,000, Tickets = 350,000.
    - Intermediate levels: Exponential formula using progress = (lvl - 1) / 999.
  * getGoalLevelRewards(lvl):
    Returns item payout scaling by level tiers.
  * renderGoalsList():
    Iterates g from 1 to 1000. Compares player collected cards, keys, and tickets with requirements.
    Renders status badge and claim button with 1 ad watch requirement.
  * handleGoalMegaRewardAction():
    Unlocks after Goal Level 1000 is completed. Tracks 1,000 rewarded ads watched.
    Awards Grand Bundle: +100 Dandiyas/Keys, +75 Cards, +150 Flowers/Tickets, +1,000 Coins.

--------------------------------------------------------------------------------
4.8 STREAK PAGE (frontend/pages/streak/)
--------------------------------------------------------------------------------
- Purpose: Calendar tracking daily active logins.
- JavaScript Logic (streak.js):
  * checkDailyStreak(): Compares current date with last login date. If consecutive, increments
    streak counter. If broken (>48 hours), resets streak unless streak freeze was active.
  * claimStreakReward(): Awards daily login bonuses with increasing multipliers.

--------------------------------------------------------------------------------
4.9 MEGA REWARD PAGE (frontend/pages/mega-reward/)
--------------------------------------------------------------------------------
- Purpose: Global community lottery and milestone pool.
- JavaScript Logic (mega-reward.js):
  * Displays total accumulated prize pool and lets players enter lottery draws.

--------------------------------------------------------------------------------
4.10 GIFT CARD PAGE (frontend/pages/gift-card/)
--------------------------------------------------------------------------------
- Purpose: Virtual storefront converting game coins into gift cards (Google Play, Amazon, etc.).
- JavaScript Logic (gift-card.js):
  * selectGiftCard(cardId): Validates player coin balance and creates pending redemption request.

--------------------------------------------------------------------------------
4.11 GADGETS PAGE (frontend/pages/gadgets/)
--------------------------------------------------------------------------------
- Purpose: Electronics and gadgets redemption store.
- JavaScript Logic (gadgets.js):
  * Renders gadget catalog and manages redemption inquiries.

--------------------------------------------------------------------------------
4.12 ACCESSORIES PAGE (frontend/pages/accessories/)
--------------------------------------------------------------------------------
- Purpose: Cosmetic customization for the Reactor Orb.
- JavaScript Logic (accessories.js):
  * Equips custom neon particle rings and glow themes.

--------------------------------------------------------------------------------
4.13 GAMING TOOL PAGE (frontend/pages/gaming-tool/)
--------------------------------------------------------------------------------
- Purpose: Tapper performance diagnostics and CPS (Clicks Per Second) tester.
- JavaScript Logic (gaming-tool.js):
  * startCpsTest(): Tracks click count over a 5-second interval and calculates player CPS score.

--------------------------------------------------------------------------------
4.14 KITCHEN PAGE (frontend/pages/kitchen/)
--------------------------------------------------------------------------------
- Purpose: Lifestyle and home kitchenware prize catalog.

--------------------------------------------------------------------------------
4.15 STATIONERY PAGE (frontend/pages/stationery/)
--------------------------------------------------------------------------------
- Purpose: School and office supplies prize catalog.

--------------------------------------------------------------------------------
4.16 FITNESS PAGE (frontend/pages/fitness/)
--------------------------------------------------------------------------------
- Purpose: Athletic, workout, and wellness prize catalog.

--------------------------------------------------------------------------------
4.17 HOME DECORATE PAGE (frontend/pages/home-decorate/)
--------------------------------------------------------------------------------
- Purpose: Smart lighting and interior ambient decor catalog.

--------------------------------------------------------------------------------
4.18 CUSTOM PAGE (frontend/pages/custom/)
--------------------------------------------------------------------------------
- Purpose: Customized prize requests and VIP player perks.

--------------------------------------------------------------------------------
4.19 SUGGEST BOX PAGE (frontend/pages/suggest-box/)
--------------------------------------------------------------------------------
- Purpose: Player suggestion and feedback form.
- JavaScript Logic (suggest-box.js):
  * submitFeedback(): Submits user comments to Firebase feedback collection.

--------------------------------------------------------------------------------
4.20 AD REWARDS PAGE (frontend/pages/ad-rewards/)
--------------------------------------------------------------------------------
- Purpose: Direct rewarded ad watching portal for immediate energy refill and fuel drops.
- JavaScript Logic (ad-rewards.js):
  * watchAdForFuel(type): Plays video ad via showRewardedAd() and credits chosen fuel cell.

--------------------------------------------------------------------------------
4.21 SPIN PAGE (frontend/pages/spin/)
--------------------------------------------------------------------------------
- Purpose: Rotary lucky wheel mini-game.
- HTML Elements:
  * #spinWheelCanvas: HTML5 Canvas rendering wheel segments and prize icons.
  * #btnSpinWheel: Button to consume 1 Spin Ticket and start rotation.
- JavaScript Logic (spin.js):
  * spinLuckyWheel():
    1. Checks if player has at least 1 Spin Ticket (gameState.player.chestTickets >= 1).
    2. Deducts 1 ticket.
    3. Calculates physics-based rotational velocity and deceleration.
    4. Animates wheel rotation over 4 seconds.
    5. Calculates final segment index and awards the winning item.

--------------------------------------------------------------------------------
4.22 CHEST PAGE (frontend/pages/chest/)
--------------------------------------------------------------------------------
- Purpose: Mystery chest vault with 4 rarity tiers (Bronze, Silver, Gold, Cyber).
- JavaScript Logic (chest.js):
  * openChest(tier):
    1. Checks if player has required Keys (gameState.player.chestKeys).
    2. Deducts keys, triggers chest opening animation, and draws loot from probability table.

--------------------------------------------------------------------------------
4.23 SCRATCH PAGE (frontend/pages/scratch/)
--------------------------------------------------------------------------------
- Purpose: Quantum Scratch Ticket mini-game with realistic metallic foil canvas erasing.
- Strict Card Rule:
  A card is NEVER free. The player MUST spend 1 Scratch Card to unlock and scratch a ticket.
  Without using a card, scratching is completely disabled.
- Probabilistic Prize Distribution:
  * 1-2 Keys: 20% probability
  * 10-20 Eggs: 50% probability
  * 1-2 Tickets: 20% probability
  * 10 Coins: 2% probability
  * 50-75 Blue Coins: 8% probability
  * Total: Exactly 100%
- Quick Reveal Button:
  Removed entirely per specification to ensure authentic scratch gameplay.
- HTML Elements:
  * #scratchSingleCardArea: Ticket arena container.
  * #scratchCanvas: HTML5 Canvas overlay covering secret reward with gray metallic foil.
  * #singleRewardContent: Underneath DOM layer holding secret prize icon, amount, and badge.
  * #btnSingleNewCard: Action button to consume 1 card and deal a new ticket.
  * #scratchProgressBar & #scratchProgressText: Live scratch percentage indicator.
  * #scratchDustLayer: Particle emitter container for flying foil shavings.
- JavaScript Logic (scratch.js):
  * dealNewSingleCard(consumeCard):
    1. Checks gameState.player.scratchCards >= 1. If 0, blocks action and displays toast.
    2. If consumeCard is true, deducts 1 card from player inventory.
    3. Sets singleCardState.hasActiveTicket = true.
    4. Calls generateScratchReward() to select prize based on strict 20/50/20/2/8 probabilities.
    5. Calls renderSingleRewardCard() to populate the secret layer under the canvas.
    6. Calls initSingleScratchCanvas() to paint fresh metallic gray film.
  * renderLockedCardPlaceholder():
    Drawn on canvas when player enters page without an active card. Paints foil with padlock
    emblem and text "TAP 'NEW TICKET' TO UNLOCK • Costs 1 Card".
  * bindScratchEvents(canvas):
    Attaches pointerdown, pointermove, pointerup, and touch events.
    - If singleCardState.hasActiveTicket is false: blocks scratching and prompts user to spend a card.
    - If active: tracks coordinates and calls scratchLine().
  * scratchAt(x, y) & scratchLine(x1, y1, x2, y2):
    Sets canvas 2D context globalCompositeOperation = 'destination-out'.
    Stamps circles of radius 24px along the vector to erase foil cleanly.
    Spawns metallic silver/gold particles into #scratchDustLayer and plays rubbing sound.
  * checkScratchCompletion():
    Reads canvas pixel data using ctx.getImageData. Sub-samples alpha channel every 16th pixel.
    If transparent pixels reach >= 48%, triggers completeSingleCardReveal().
  * completeSingleCardReveal():
    Fades canvas foil, stamps "REVEALED", credits the won prize (Keys, Eggs, Tickets, Coins,
    or Blue Coins) to gameState.player, plays level up sound, and sets:
    singleCardState.hasActiveTicket = false; (Preventing further scratching until next card purchase).

--------------------------------------------------------------------------------
4.24 EGG PAGE (frontend/pages/egg/)
--------------------------------------------------------------------------------
- Purpose: 12-Egg Cyber Hatchery Match-3 mini-game.
- Specification & Rules:
  * Total Eggs on Grid: 12 eggs (4 columns x 3 rows).
  * Cost: 1 Egg Coin per hatch.
  * 5 Collection Categories (Collect 3 of any item to win):
    1. Keys (🔑): 3 Keys -> Win 1 Key
    2. Tickets (🎟️): 3 Tickets -> Win 1 Ticket
    3. Cards (🎴): 3 Cards -> Win 1 Card
    4. Coins (🪙): 3 Coins -> Win 10 Coins
    5. Blue Coins (💙): 3 Blue Coins -> Win 100 Blue Coins!
  * 10-Item Randomization Rule:
    The first 10 hatches randomly reveal items such that NO CATEGORY EVER COMPLETES 3 MATCHES.
    Specifically: exactly 2 of each of the 5 categories (2 keys, 2 tickets, 2 cards, 2 coins,
    2 blue coins = 10 items) are shuffled. By hatch #10, all 5 meters are at 2/3 collected.
  * 11th Hatch Win Guarantee:
    On the 11th egg hatched, the 3rd matching item for the pre-selected winning category is
    revealed, completing the match-3 and triggering the victory celebration modal.
- HTML Elements:
  * #eggGrid16 (with class .egg-grid-12): 12 egg cards.
  * Collection meters: #eggMeterKey, #eggMeterTicket, #eggMeterCard, #eggMeterCoin, #eggMeterBlueCoin.
  * Pip indicators: #eggPipsKey, #eggPipsTicket, #eggPipsCard, #eggPipsCoin, #eggPipsBlueCoin.
  * #eggWinResultModal: Celebration overlay displaying winning icon, title, description, and collect button.
- JavaScript Logic (egg.js):
  * shuffleEggs12(manual):
    1. Selects target winning prize category via weighted probability.
    2. Generates array of 10 items (2 of each category) and shuffles with Fisher-Yates.
    3. Populates 12 egg slots on grid with revealed: false.
    4. Resets collection counters to 0, hatchedCount to 0, and gameCompleted to false.
  * hatchEggCell(index):
    1. Validates gameState.player.eggs >= 1. If 0, prompts user.
    2. Deducts 1 Egg Coin.
    3. Increments hatchedCount.
    4. If hatchedCount <= 10: draws item from shuffled 10-item list. Updates meter pips (max 2/3).
    5. If hatchedCount === 11: reveals 3rd matching item of targetWinner, reaching 3/3!
    6. Calls triggerEggWinCelebration() to award prize and display #eggWinResultModal.
  * triggerEggWinCelebration(itemType, rewardDef):
    Credits won prize (e.g. 100 Blue Coins for Blue Coin, 10 Coins, 1 Key, 1 Ticket, 1 Card).
    Plays victory audio, opens celebration modal with glowing aura, and sets gameCompleted = true.
  * closeEggWinModal():
    Closes celebration modal and automatically reshuffles a fresh 12-egg round.

--------------------------------------------------------------------------------
4.25 LEADERBOARD PAGE (frontend/pages/leaderboard/)
--------------------------------------------------------------------------------
- Purpose: Global rankings tracking Top Tappers and Highest Levels.
- JavaScript Logic (leaderboard.js):
  * loadLeaderboard(category): Fetches top 100 ranking entries from Firebase /api/leaderboard.
  * Renders podium for 1st, 2nd, and 3rd place, followed by scrollable ranked player rows.


================================================================================
SECTION 5: ADMIN PORTAL MODULES & CONTROL CENTER (admin/)
================================================================================

5.1 ADMIN ARCHITECTURE & MODULAR PIPELINE
The admin portal located at admin/index.html is built with the same modular philosophy:
- admin/assemble.js compiles 9 modular admin pages into admin/index.html.
- Scoped under /admin route in server.js.
- Uses shared Firebase bridge (admin/shared/firebase.js) for cloud administrative commands.

5.2 DASHBOARD MODULE (admin/pages/dashboard/)
- Purpose: Real-time analytics view.
- Displays total registered players, active sessions, coins currently in circulation,
  pending withdrawal requests, and server uptime.

5.3 USER MANAGEMENT MODULE (admin/pages/users/)
- Purpose: User lookup and moderation tool.
- Functions: Search users by Telegram ID, name, or UID. View balances. Manually edit
  coins, blue coins, diamonds, keys, tickets, cards, and eggs. Toggle account ban/unban.

5.4 ACCOUNT VERIFICATION MODULE (admin/pages/account-requests/)
- Purpose: Identity conflict resolution and manual account linking approval.
- Functions: Review multi-device binding requests, resolve duplicate credentials, and approve claims.

5.5 AD NETWORK CONFIGURATION MODULE (admin/pages/ads-manage/)
- Purpose: Monetag advertising control panel.
- Functions: Modify Monetag zone IDs, toggle ads on/off per page, set cooldown intervals,
  and enforce daily ad watch limits.

5.6 FIREBASE CONTROL MODULE (admin/pages/firebase-manage/)
- Purpose: Cloud database maintenance dashboard.
- Functions: View connection health, trigger full JSON backup export, import data snapshots,
  and wipe test databases safely.

5.7 MEGA REWARD CREATION MODULE (admin/pages/mega-add/)
- Purpose: Create and configure community jackpot pools and seasonal lotteries.
- Functions: Define prize pools, entry ticket costs, draw dates, and winning odds.

5.8 MEGA PAYOUT PROCESSING MODULE (admin/pages/mega-request/)
- Purpose: Financial cashout validation dashboard.
- Functions: Review claims for the Level 1000 Mega Cash Prize (10,000 Coins) and Goal Level 1000
  Mega Reward. Validates player UPI IDs and Paytm details, and marks payouts as Processed.

5.9 GLOBAL SYSTEM SETTINGS MODULE (admin/pages/settings/)
- Purpose: Platform-wide configuration.
- Functions:
  * Toggle Maintenance Mode on/off.
  * Broadcast emergency announcement banner to all active players.
  * Level 1-1000 Configuration Editor: Allows admin to override XP requirements and rewards
    for any individual level from 1 to 1000.

5.10 WEB & SOCIAL TASKS CONTROL MODULE (admin/pages/tasks-web/)
- Purpose: Mission management interface.
- Functions: Add, edit, or remove Telegram channel join tasks, YouTube watch tasks, and partner
  website visit links with custom reward quantities.

5.11 ADMIN FIREBASE SDK BRIDGE (admin/shared/firebase.js)
- Initializes administrative Firebase client with elevated privileges for database reads/writes.


================================================================================
SECTION 6: SECURITY RULES & CONFIGURATIONS
================================================================================

6.1 FIREBASE REALTIME DATABASE SECURITY (database.rules.json)
- /users/$uid: Users can read and write only their own state where auth.uid === $uid.
- /leaderboard: Publicly readable by all authenticated clients; write operations restricted
  to server/admin or verified user stat updates.
- Rate limiting and payload size validation enforced at rule level.

6.2 CLOUD FIRESTORE SECURITY (firestore.rules)
- Implements match /databases/{database}/documents.
- Collection 'users': Read/write restricted to request.auth.uid == resource.id.
- Collection 'settings': Read-only for players; write restricted to admin UID role.

6.3 CLOUD HOSTING & REWRITES (firebase.json & vercel.json)
- Configures static asset caching headers (Cache-Control: max-age=31536000 for images/fonts).
- Configures URL rewrites directing API requests to serverless endpoints while routing all
  client view requests to index.html for smooth SPA history navigation.


================================================================================
SECTION 7: END-TO-END EXECUTION FLOWS & USER LIFECYCLE
================================================================================

7.1 TAP EXECUTION & POWER CONSUMPTION
1. User taps the Quantum Reactor Orb (#reactorOrb).
2. Pointer event triggers handleReactorTap(e) in home.js.
3. Checks gameState.reactor.currentEnergy >= clickPower.
4. Decrements currentEnergy, increments player.coins and player.xp.
5. Emits visual floating text particle (+5 Coins) at tap coordinates.
6. Calls sfx.playTapSound() and triggerTelegramHaptic('light').
7. Invokes saveGame() and updates energy gauge.

7.2 XP LEVEL ADVANCE & DARK GREEN FUEL PAYOUT (LEVELS 1 - 1000)
1. Player taps reactor and accumulates XP.
2. XP page (xp.js) compares player.xp against required XP (lvl * 1000).
3. When ready, player clicks "Claim" on their active level card.
4. Invokes claimLevelReward(lvl), which prompts 1 rewarded ad.
5. Upon ad completion:
   - Calculates Dark Green Fuel: Math.max(1, Math.min(200, Math.ceil(lvl / 5))).
   - Credits fuel cells to gameState.energyGenerator.fuelCells.darkgreen.
   - Advances activeLevel to Math.min(1000, lvl + 1).
   - Displays Level Up celebration modal.
   - Saves state locally and syncs to cloud.

7.3 GOAL MILESTONE PROGRESSION (GOALS 1 - 1000)
1. Player earns Cards 🃏, Keys 🥢, and Tickets 🌸 across the platform.
2. Goal page (goal.js) calculates 3-emoji requirements for active goal level.
3. When requirements are fulfilled, "Claim" button becomes active.
4. Player watches 1 rewarded ad to claim milestone rewards.
5. Advances goal level up to 1000 and resets progress counters for next level.

7.4 SCRATCH CARD UNLOCK, RUBBING, & PROBABILISTIC PAYOUT
1. Player opens Quantum Scratch Ticket page (#pageScratch).
2. Canvas renders locked metallic foil ("TAP 'NEW TICKET' TO UNLOCK").
3. Player clicks "NEW TICKET (1 CARD)":
   - Deducts 1 Scratch Card from gameState.player.scratchCards.
   - Sets singleCardState.hasActiveTicket = true.
   - Calls generateScratchReward() selecting from:
     * 1-2 Keys (20%)
     * 10-20 Eggs (50%)
     * 1-2 Tickets (20%)
     * 10 Coins (2%)
     * 50-75 Blue Coins (8%)
   - Paints fresh metallic gray film canvas.
4. Player rubs the canvas:
   - Coordinates erase foil using destination-out 24px circular brush.
   - Emits dust particles and rubbing sounds.
5. When >= 48% foil is cleared:
   - completeSingleCardReveal() clears remaining foil.
   - Credits won prize (Keys, Eggs, Tickets, Coins, or Blue Coins).
   - Sets singleCardState.hasActiveTicket = false (Card completed).
   - Player must spend another card to play again.

7.5 12-EGG HATCHERY 10-ITEM RANDOMIZATION & 11TH HATCH VICTORY
1. Player opens 12-Egg Cyber Hatchery page (#pageEgg).
2. Grid displays 12 unhatched eggs (4 columns x 3 rows).
3. shuffleEggs12() selects a random winning prize (Keys, Tickets, Cards, Coins, or Blue Coins)
   and creates a randomized list of 10 items (2 of each category).
4. Player taps an egg (costs 1 Egg Coin):
   - Deducts 1 egg coin from gameState.player.eggs.
   - Hatches 1 to 10: reveals an item from the 10-item list.
   - All 5 category meters advance toward 2/3. None reaches 3/3.
5. Player taps 11th egg:
   - Reveals the 3rd matching item of the winning category!
   - Category reaches 3/3 match-3 victory.
   - Credits prize (e.g. 100 Blue Coins for 3 Blue Coins).
   - Opens glowing #eggWinResultModal celebration dialog.
   - Tapping "Collect & Hatch Again" closes modal and reshuffles 12 fresh eggs.
================================================================================
                           END OF TECHNICAL GUIDE
================================================================================
`;

fs.writeFileSync(guidePath, content, 'utf8');
console.log('guide.txt successfully written to:', guidePath);
console.log('File size:', fs.statSync(guidePath).size, 'bytes');
