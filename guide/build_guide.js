// Self-contained Master Technical Guide Builder (guide/build_guide.js)
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;

// generate_guide.js





function getFileSize(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch (e) {
    return 0;
  }
}

function getLineCount(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8').split('\n').length;
  } catch (e) {
    return 0;
  }
}

function extractFunctionsDetails(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const funcs = [];
  
  // Regex to match functions
  const fnRegex = /(?:async\s+)?function\s+([a-zA-Z0-9_$]+)\s*\(([^)]*)\)|(?:const|let|var|window\.)\s*([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?(?:function\s*\(([^)]*)\)|\(([^)]*)\)\s*=>|([a-zA-Z0-9_$]+)\s*=>)/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const match = line.match(fnRegex);
    if (match) {
      const name = match[1] || match[3];
      const params = match[2] || match[4] || match[5] || match[6] || '';
      if (name && !['require', 'exports', 'module', 'if', 'for', 'while', 'switch', 'catch'].includes(name)) {
        // Collect comments above function
        let comments = [];
        let j = i - 1;
        while (j >= 0 && (lines[j].trim().startsWith('//') || lines[j].trim().startsWith('*') || lines[j].trim().startsWith('/*'))) {
          const c = lines[j].trim().replace(/^\/\/\s*|^\/\*\s*|\*\/$|^\*\s*/, '');
          if (c) comments.unshift(c);
          j--;
          if (comments.length > 5) break;
        }

        // Find function end by tracking braces if possible
        let bodyLines = [];
        let braceCount = 0;
        let started = false;
        for (let k = i; k < Math.min(lines.length, i + 120); k++) {
          const l = lines[k];
          bodyLines.push(l);
          for (let char of l) {
            if (char === '{') { braceCount++; started = true; }
            else if (char === '}') { braceCount--; }
          }
          if (started && braceCount <= 0) break;
        }

        funcs.push({
          name,
          params: params.trim(),
          startLine: i + 1,
          endLine: i + bodyLines.length,
          comment: comments.join(' '),
          body: bodyLines
        });
      }
    }
  }

  // Deduplicate
  const seen = new Set();
  return funcs.filter(f => {
    if (seen.has(f.name)) return false;
    seen.add(f.name);
    return true;
  });
}

function extractHtmlElements(filePath) {
  if (!fs.existsSync(filePath)) return { ids: [], classes: [] };
  const content = fs.readFileSync(filePath, 'utf8');
  const idMatches = content.match(/id=["']([^"']+)["']/g) || [];
  const classMatches = content.match(/class=["']([^"']+)["']/g) || [];
  
  const ids = [...new Set(idMatches.map(m => m.replace(/id=["']|["']/g, '')))];
  const classes = [...new Set(classMatches.map(m => m.replace(/class=["']|["']/g, '').split(/\s+/)).flat())].filter(c => c && c.length > 2);
  
  return { ids, classes };
}






// section2_server.js
// Generates in-depth text for server.js
function generateServerSection() {
  let s = [];
  s.push("================================================================================");
  s.push("SECTION 2: BACKEND SERVER ARCHITECTURE (server.js)");
  s.push("================================================================================");
  s.push("");
  s.push("2.1 ARCHITECTURE, DEPENDENCIES & PORT BINDING");
  s.push("The file server.js is the primary Node.js HTTP server. It is implemented without external");
  s.push("framework dependencies like Express or Fastify to minimize overhead, cold-start latency,");
  s.push("and memory usage in containerized or low-cost hosting environments.");
  s.push("- Native Dependencies: 'http', 'fs', 'path', 'url'.");
  s.push("- Port Resolution: Defaults to process.env.PORT or port 3000.");
  s.push("- Listener Creation: http.createServer(async (req, res)) processes all requests.");
  s.push("");
  s.push("2.2 MIME TYPES & STATIC ASSET DELIVERY PIPELINE");
  s.push("The server defines a strict MIME_TYPES dictionary mapping extensions to Content-Type headers:");
  s.push("  - .html : 'text/html; charset=utf-8'");
  s.push("  - .css  : 'text/css; charset=utf-8'");
  s.push("  - .js   : 'application/javascript; charset=utf-8'");
  s.push("  - .json : 'application/json; charset=utf-8'");
  s.push("  - .png  : 'image/png'");
  s.push("  - .jpg / .jpeg : 'image/jpeg'");
  s.push("  - .svg  : 'image/svg+xml'");
  s.push("  - .webp : 'image/webp'");
  s.push("  - .ico  : 'image/x-icon'");
  s.push("");
  s.push("Path Sanitization & Security against Directory Traversal:");
  s.push("  - Input URL pathname is decoded and normalized via path.normalize().");
  s.push("  - Traversal characters like '../' and '..\\' are blocked by resolving against ROOT.");
  s.push("  - Root path '/' is mapped to 'frontend/index.html'.");
  s.push("  - Admin path '/admin' or '/admin/' is mapped to 'admin/index.html'.");
  s.push("  - If file exists, fs.createReadStream(filePath).pipe(res) streams bytes directly to client.");
  s.push("  - If file does not exist, returns HTTP 404 with text/plain '404 Not Found'.");
  s.push("");
  s.push("2.3 IN-MEMORY DATA STORE (memoryStore) SCHEMA");
  s.push("To ensure uninterrupted operation even when Firebase connection is lost or during rapid development,");
  s.push("server.js maintains an internal memoryStore holding active application state:");
  s.push("  - memoryStore.rewards: Array of system rewards and prizes.");
  s.push("  - memoryStore.requests: Array of cashout and prize redemption claims from users.");
  s.push("  - memoryStore.users: Dictionary indexed by user UID containing player profile and balance objects.");
  s.push("  - memoryStore.websiteTasks: Array of partner website click and browse tasks.");
  s.push("  - memoryStore.telegramTasks: Array of Telegram channel and group subscription tasks.");
  s.push("  - memoryStore.gameConfig: Global system settings { maintenanceMode: false, announcement: '' }.");
  s.push("  - memoryStore.levelsConfig: Custom overrides for Levels 1 to 1000.");
  s.push("  - memoryStore.notifications: In-game inbox notifications array { id, type, title, message, timestamp, read, actionText, actionTarget }.");
  s.push("  - memoryStore.antiFraud: Real-time anti-fraud engine cache:");
  s.push("      * antiFraud.processedNonces: Map of cryptographic UUID nonces -> timestamps preventing duplicate claims.");
  s.push("      * antiFraud.userCooldowns: Map of UID -> { [action]: timestamp } enforcing rate limits per action.");
  s.push("      * antiFraud.auditLog: Sliding window log (latest 100 entries) capturing IP, user-agent, action, payout, and risk state.");
  s.push("      * antiFraud.tapRates: Velocity metrics recording tap bursts to detect bot patterns.");
  s.push("  - memoryStore.identityIndex: Critical uniqueness lookup tables preventing multi-accounting:");
  s.push("      * identityIndex.telegram: Map of normalized tgId -> UID.");
  s.push("      * identityIndex.phone: Map of normalized phone -> UID.");
  s.push("      * identityIndex.email: Map of normalized email -> UID.");
  s.push("  - memoryStore.authConfig: Toggles for account uniqueness rules and allowed registration methods.");
  s.push("  - memoryStore.accountRequests: Pending user account resolution and identity binding claims.");
  s.push("  - memoryStore.fuelCellsConfig: Reactor cell configurations and purchase rules.");
  s.push("");
  s.push("2.4 UTILITY & HELPER FUNCTIONS IN server.js");
  s.push("1. normalizeTelegramId(id):");
  s.push("   - Lines: ~35-42");
  s.push("   - Parameters: id (string|number)");
  s.push("   - Logic: Converts id to string, removes whitespace, strips leading '@' if present.");
  s.push("   - Return: Sanitized string ID or empty string.");
  s.push("");
  s.push("2. normalizePhone(phone):");
  s.push("   - Lines: ~44-52");
  s.push("   - Parameters: phone (string)");
  s.push("   - Logic: Strips all non-numeric characters (+, -, spaces, parentheses).");
  s.push("   - Return: Clean numeric string representation of phone number.");
  s.push("");
  s.push("3. normalizeEmail(email):");
  s.push("   - Lines: ~54-61");
  s.push("   - Parameters: email (string)");
  s.push("   - Logic: Trims whitespace, casts to lowercase.");
  s.push("   - Return: Lowercased sanitized email string.");
  s.push("");
  s.push("4. parseRequestBody(req):");
  s.push("   - Lines: ~65-80");
  s.push("   - Parameters: req (IncomingMessage)");
  s.push("   - Logic: Buffers chunks of incoming request data via 'data' events up to 10MB safety limit.");
  s.push("     On 'end' event, attempts JSON.parse(body). If JSON is invalid, returns empty object {}");
  s.push("     safely without throwing unhandled exceptions.");
  s.push("   - Return: Promise resolving to parsed payload object.");
  s.push("");
  s.push("5. sendJson(res, statusCode, data):");
  s.push("   - Lines: ~82-95");
  s.push("   - Parameters: res (ServerResponse), statusCode (number), data (object)");
  s.push("   - Logic: Sets HTTP status code, Content-Type: application/json; charset=utf-8,");
  s.push("     and CORS headers: Access-Control-Allow-Origin: *, Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE,");
  s.push("     and writes JSON.stringify(data).");
  s.push("");
  s.push("2.5 REST API ENDPOINTS DETAILED WALKTHROUGH");
  s.push("1. GET /api/health");
  s.push("   - Returns { status: 'ok', timestamp: Date.now(), uptime: process.uptime() }.");
  s.push("   - Used by load balancers, monitoring daemons, and client connection checks.");
  s.push("");
  s.push("2. GET & POST /api/rewards");
  s.push("   - GET: Returns memoryStore.rewards array.");
  s.push("   - POST: Admin adds or updates a reward item. Validates title, cost, and stock.");
  s.push("");
  s.push("3. GET & POST /api/requests");
  s.push("   - GET: Returns pending prize redemption and Level 1000 Cash Prize claims.");
  s.push("   - POST: Player submits a new payout request with user details, payout method (UPI/Paytm), and amount.");
  s.push("");
  s.push("4. GET & POST /api/users");
  s.push("   - GET: Lists users with pagination and search query filtering by name, UID, or Telegram ID.");
  s.push("   - POST: Admin modifies user balance or toggles isBanned status.");
  s.push("");
  s.push("5. GET & POST & DELETE /api/tasks/website & /api/tasks/telegram");
  s.push("   - GET: Returns active list of engagement tasks.");
  s.push("   - POST: Admin creates a new task with title, url, rewardCoins, rewardKeys, and timerSeconds.");
  s.push("   - DELETE: Removes task by ID.");
  s.push("");
  s.push("6. GET & POST /api/game-config");
  s.push("   - GET: Returns global configuration: { maintenanceMode, announcement, appTitle }.");
  s.push("   - POST: Admin updates maintenance mode or emergency broadcast banner.");
  s.push("");
  s.push("7. GET & POST /api/levels-config");
  s.push("   - GET: Returns custom configurations for Levels 1 to 1000.");
  s.push("   - POST: Admin overrides XP required and reward drops for any level between 1 and 1000.");
  s.push("");
  s.push("8. POST /api/auth/telegram");
  s.push("   - Authenticates Telegram Mini App launch data.");
  s.push("   - Checks memoryStore.identityIndex.telegram for existing binding.");
  s.push("   - If new user, creates user record and registers telegram ID into index.");
  s.push("   - Returns user profile and session token.");
  s.push("");
  s.push("9. GET & POST /api/auth/check-identifier");
  s.push("   - Checks if a phone number, email, or Telegram ID is already bound to another account.");
  s.push("   - Prevents duplicate account creation and multi-accounting exploitation.");
  s.push("");
  s.push("10. POST /api/auth/link-credential");
  s.push("   - Binds a secondary identifier (e.g. phone or email) to an existing authenticated user profile.");
  s.push("   - Enforces unique indexing to ensure an identifier cannot be linked twice.");
  s.push("");
  s.push("11. GET & POST /api/auth/config");
  s.push("   - Manages authorization policies (e.g. requirePhoneVerification, allowGuestMode).");
  s.push("");
  s.push("12. GET /api/auth/duplicates & POST /api/auth/resolve-duplicate");
  s.push("   - Scans user database for conflicting credentials and allows admin to merge or unlink accounts.");
  s.push("");
  s.push("13. GET & POST /api/account_requests");
  s.push("   - Handles appeals and identity claim tickets submitted by players.");
  s.push("");
  s.push("14. POST /api/auth/migrate-indexes");
  s.push("   - Diagnostic utility that scans existing user records and rebuilds identityIndex hash maps.");
  s.push("");
  s.push("15. GET & POST /api/notifications & /api/notifications/mark-read");
  s.push("   - GET: Fetches active notifications for player's in-game inbox.");
  s.push("   - POST /api/notifications: Admin broadcast dispatcher sending Global, Event, Maintenance, or Reward alerts.");
  s.push("   - POST /api/notifications/mark-read: Updates read status for single or all notifications.");
  s.push("");
  s.push("16. POST /api/reward/claim (CRITICAL SERVER-AUTHORITATIVE REWARD VALIDATION)");
  s.push("   - Validates user identity, nonces, action cooldowns, and mathematical score boundaries.");
  s.push("   - Rejects replay attacks (HTTP 409) if a nonce was previously processed.");
  s.push("   - Enforces minimum cooldowns: Memory Match (12s), Coin Catcher (15s), Ads (8s), Streak (1hr).");
  s.push("   - Validates score caps and calculates authoritative coins/diamonds on server, updating memoryStore.users[uid].");
  s.push("   - Returns authoritative player balance to client to overwrite local optimistic values.");
  s.push("");
  s.push("17. POST /api/anti-fraud/verify-tap-session (TAP VELOCITY & AUTOCLICKER DETECTION)");
  s.push("   - Evaluates tap frequency: ratePerSec = tapCount / durationSeconds.");
  s.push("   - Automatically blocks impossible bot frequencies (>40 taps/sec) with HTTP 400 and logs security audit.");
  s.push("");
  s.push("18. GET & POST /api/fuel-cells-config & /api/fuel/buy");
  s.push("   - Server-authoritative fuel cell configuration and purchasing engine.");
  s.push("");
  return s.join('\n');
}




// section3_shared.js
// Detailed technical breakdown of frontend/shared/ modules
function generateSharedSection() {
  let s = [];
  s.push("================================================================================");
  s.push("SECTION 3: FRONTEND CORE & SHARED CLIENT SERVICES (frontend/shared/)");
  s.push("================================================================================");
  s.push("");
  s.push("3.1 REACTIVE GAME STATE & STORAGE ENGINE (frontend/shared/state.js)");
  s.push("The file state.js is the central state management core of the client application. It maintains");
  s.push("window.gameState as the single source of truth and manages persistence with localStorage and cloud.");
  s.push("");
  s.push("A. DETAILED SCHEMA OF window.gameState:");
  s.push("1. player: Object containing core account and currency balances:");
  s.push("   - uid: String. Unique identifier (Telegram ID or generated UUID).");
  s.push("   - name: String. Display name of the user.");
  s.push("   - level: Number. Current player level from 1 to 1000.");
  s.push("   - xp: Number. Accumulated lifetime experience points.");
  s.push("   - coins: Number. Standard gold coins earned from tapping and mini-games.");
  s.push("   - blueCoins: Number. Rare premium currency used in the Cyber Hatchery and shop.");
  s.push("   - diamonds: Number. Gem currency for special store items.");
  s.push("   - chestKeys: Number. Keys consumed to open Bronze, Silver, Gold, and Cyber mystery chests.");
  s.push("   - chestTickets: Number. Spin tickets consumed to rotate the Lucky Wheel.");
  s.push("   - scratchCards: Number. Cards required to unlock and scratch Quantum Scratch Tickets.");
  s.push("   - eggs: Number. Egg coins required to hatch eggs in the 12-Egg Cyber Hatchery.");
  s.push("   - isBanned: Boolean. Ban status flag.");
  s.push("   - referralCode: String. Unique referral code.");
  s.push("   - referredBy: String. UID of referring player.");
  s.push("   - referralCount: Number. Total players invited.");
  s.push("");
  s.push("2. reactor: Object managing the central quantum tap mechanics:");
  s.push("   - currentEnergy: Number. Available reactor power (0 to maxEnergy).");
  s.push("   - maxEnergy: Number. Total energy capacity (scales with generator upgrades).");
  s.push("   - clickPower: Number. Energy consumed and coins awarded per tap.");
  s.push("   - regenRate: Number. Energy restored per second (e.g. 3/s).");
  s.push("   - lastEnergyTimestamp: Number. Unix timestamp of last energy state calculation.");
  s.push("");
  s.push("3. energyGenerator: Object managing the 7-tier fuel injector:");
  s.push("   - level: Number. Generator level.");
  s.push("   - remainingSeconds: Number. Turbo boost countdown timer.");
  s.push("   - boostMultiplier: Number. Multiplier applied to energy regen during turbo boost.");
  s.push("   - fuelCells: Object containing counts for 7 colored fuel cells:");
  s.push("     { green: 0, darkgreen: 0, yellow: 0, orange: 0, red: 0, pink: 0, purple: 0 }.");
  s.push("");
  s.push("4. progression: Object managing global level milestones:");
  s.push("   - activeLevel: Number. Active milestone level (1 to 1000).");
  s.push("   - completedLevels: Object. Hash map of claimed level rewards { [lvl]: true }.");
  s.push("   - levelXp: Number. Current XP accumulated toward the next level.");
  s.push("");
  s.push("5. goalState: Object managing 3-emoji milestone roadmap (Goals 1 to 1000):");
  s.push("   - currentLevel: Number. Current goal milestone (1 to 1000).");
  s.push("   - currentSubtab: String. Active subview ('goals' | 'mega').");
  s.push("   - levelProgress: Object. Collected items for active goal: { cards: 0, keys: 0, tickets: 0 }.");
  s.push("   - claimedGoals: Object. Hash map of completed goals { [lvl]: true }.");
  s.push("   - megaWatchedAds: Number. Rewarded ads watched toward Level 1000 Mega Goal Reward (0 to 1000).");
  s.push("   - megaRewardClaimed: Boolean. True if Level 1000 Mega Goal Reward was claimed.");
  s.push("");
  s.push("6. xpState: Object managing XP level rewards (Levels 1 to 1000):");
  s.push("   - currentSubtab: String. Active subview ('levels' | 'mega').");
  s.push("   - claimedLevels: Object. Hash map of claimed level rewards { [lvl]: true }.");
  s.push("   - watchedAds: Number. Rewarded ads watched toward Level 1000 Mega Cash Prize (0 to 1000).");
  s.push("   - megaRewardClaimed: Boolean. True if 10,000 Coins Level 1000 Cash Prize was claimed.");
  s.push("   - seasonEndMs: Number. Timestamp marking current seasonal leaderboard end.");
  s.push("");
  s.push("7. eggHatchState: Object managing the 12-Egg Cyber Hatchery:");
  s.push("   - eggs: Array. 12 egg objects with { id, revealed, itemType, rewardDef }.");
  s.push("   - collected: Object. Collection meter tallies: { key: 0, ticket: 0, card: 0, coin: 0, blueCoin: 0 }.");
  s.push("   - hatchedCount: Number. Number of eggs hatched in active round (0 to 11).");
  s.push("   - targetWinner: String. Category selected to win on the 11th hatch ('key'|'ticket'|'card'|'coin'|'blueCoin').");
  s.push("   - first10Items: Array. Shuffled pool of 10 items (2 of each category) ensuring no 3-match occurs early.");
  s.push("   - gameCompleted: Boolean. True when 11th hatch celebration modal is triggered.");
  s.push("");
  s.push("8. singleCardState: Object managing Quantum Scratch Ticket:");
  s.push("   - hasActiveTicket: Boolean. Strict card lock flag. When false, canvas cannot be scratched.");
  s.push("   - currentReward: Object. Secret prize object revealed underneath the foil.");
  s.push("   - isRevealed: Boolean. True when >= 48% foil is cleared.");
  s.push("");
  s.push("B. FUNCTIONS IN state.js:");
  s.push("1. getDefaultGameState():");
  s.push("   - Returns fresh state object populated with default baseline values.");
  s.push("2. saveGame():");
  s.push("   - Serializes window.gameState to JSON and writes to localStorage under key 'energyTapSaveData'.");
  s.push("   - Calls debounced cloud sync (saveToCloudDebounced()) to replicate state to Firebase.");
  s.push("3. loadGame():");
  s.push("   - Reads 'energyTapSaveData' from localStorage.");
  s.push("   - Performs deep recursive merge with getDefaultGameState() so newly added fields are never undefined.");
  s.push("   - Calls calculateOfflineEnergy() to restore energy accumulated while the user was away.");
  s.push("4. calculateOfflineEnergy():");
  s.push("   - Computes elapsedSeconds = (Date.now() - reactor.lastEnergyTimestamp) / 1000.");
  s.push("   - Calculates restoredEnergy = elapsedSeconds * reactor.regenRate.");
  s.push("   - Caps currentEnergy at maxEnergy and updates lastEnergyTimestamp.");
  s.push("5. resetGame():");
  s.push("   - Clears localStorage and reinitializes gameState to defaults.");
  s.push("6. claimServerAuthoritativeReward(action, payload):");
  s.push("   - Core security bridge enforcing server authority over game economy.");
  s.push("   - Generates unique UUID nonce (nonce_timestamp_random) preventing replay attacks.");
  s.push("   - Posts claim payload to /api/reward/claim for server validation (cooldowns & mathematical bounds).");
  s.push("   - Adopts verified server balances for player coins, diamonds, and keys directly into gameState.");
  s.push("   - If offline or network unavailable, queues claim and safely syncs upon reconnect.");
  s.push("");
  s.push("--------------------------------------------------------------------------------");
  s.push("3.2 APPLICATION CONTROLLER, ROUTER & IN-GAME NOTIFICATION CENTER (frontend/shared/app.js)");
  s.push("--------------------------------------------------------------------------------");
  s.push("The file app.js serves as the master orchestrator, router, audio synthesizer, and notification center.");
  s.push("");
  s.push("A. DOM NODE CACHING (DOM):");
  s.push("To prevent DOM query thrashing during 60 FPS tap animations, app.js caches frequently accessed");
  s.push("elements at initialization:");
  s.push("  - DOM.headerLevel, DOM.headerCoins, DOM.headerDiamonds, DOM.headerEnergy: Header pill counters.");
  s.push("  - DOM.headerInboxBtn, DOM.unreadBellDot: In-game inbox bell icon and pulsating red unread badge dot.");
  s.push("  - DOM.notificationModalOverlay, DOM.notificationItemsList: Notification sheet overlay and card feed.");
  s.push("  - DOM.appMain: Master viewport container holding all 27 page views.");
  s.push("  - DOM.bottomNav: Floating cyber navigation bar.");
  s.push("");
  s.push("B. PAGE NAVIGATION ENGINE (switchPage(pageId)):");
  s.push("  - Parameter: pageId (string). E.g. 'home', 'scratch', 'egg', 'memoryMatch', 'coinCatcher', 'xp', 'goal'.");
  s.push("  - Step 1: Removes 'active' class from all .page-view elements.");
  s.push("  - Step 2: Capitalizes pageId to find container #page<CapitalizedId> (e.g. #pageMemoryMatch, #pageCoinCatcher).");
  s.push("  - Step 3: Adds 'active' class to target container, triggering CSS opacity transition.");
  s.push("  - Step 4: Updates active state on bottom navigation bar icons.");
  s.push("  - Step 5: Triggers lifecycle entry hooks if defined by the target page (e.g. initMemoryMatch(),");
  s.push("            initCoinCatcher(), initScratchPage(), renderEggPageContent(), renderGoalsList(), renderLevelsList()).");
  s.push("  - Step 6: Plays subtle page transition audio via sfx.playTapSound(440).");
  s.push("");
  s.push("C. IN-GAME NOTIFICATION CENTER INBOX SUBSYSTEM:");
  s.push("  - fetchNotifications(): Queries GET /api/notifications; counts unread items; toggles #unreadBellDot pulse.");
  s.push("  - toggleNotificationInbox(show): Displays or dismisses sliding bottom-sheet modal (#notificationModalOverlay).");
  s.push("  - filterNotifications(category): Filters feed by 'all', 'reward', or 'system' with active filter pill styling.");
  s.push("  - renderNotifications(): Generates styled cards with title, relative timestamp, message, type badge, and CTA button.");
  s.push("  - markAllNotificationsRead(): Submits POST /api/notifications/mark-read { all: true } and clears unread indicators.");
  s.push("  - openNotificationTarget(target): Closes inbox modal and routes player directly to target page view.");
  s.push("");
  s.push("D. PROCEDURAL WEB AUDIO SYNTHESIZER (window.sfx):");
  s.push("Built using HTML5 Web Audio API (AudioContext). Eliminates network lag and external audio file requests.");
  s.push("  1. playTapSound(frequency = 520):");
  s.push("     - Creates OscillatorNode with 'triangle' waveform and GainNode.");
  s.push("     - Plays ultra-short 0.04s burst with exponential decay envelope.");
  s.push("  2. playLevelUpSound():");
  s.push("     - Plays an arpeggiated 4-tone victory chord (C5: 523Hz, E5: 659Hz, G5: 784Hz, C6: 1046Hz)");
  s.push("       staggered by 70ms intervals with smooth decay.");
  s.push("  3. playCoinSound():");
  s.push("     - Generates high-pitch 987Hz sine wave tone simulating metallic coin pickup.");
  s.push("  4. playErrorSound():");
  s.push("     - Generates low-pitch 140Hz sawtooth wave indicating insufficient energy, coins, or cards.");
  s.push("  5. playWhooshSound():");
  s.push("     - Simulates air whoosh for spinning wheels and modal transitions using filtered noise.");
  s.push("");
  s.push("E. TELEGRAM WEBAPP HAPTICS (window.triggerTelegramHaptic(type)):");
  s.push("Checks if window.Telegram?.WebApp?.HapticFeedback is available and invokes native device vibrations:");
  s.push("  - Impact feedback: 'light', 'medium', 'heavy', 'rigid', 'soft'.");
  s.push("  - Notification feedback: 'success', 'warning', 'error'.");
  s.push("");
  s.push("F. TOAST & MODAL ENGINES:");
  s.push("  - showFloatingToast(message, type = 'info'): Spawns floating neon pill at top of screen.");
  s.push("    Automatically animates slide-down, stays for 2.8s, and fades out.");
  s.push("  - openTabModal(title, contentHtml): Creates centered glassmorphic dialog with backdrop blur.");
  s.push("  - closeTabModal(): Smoothly dismisses modal dialog.");
  s.push("");
  s.push("G. MASTER UPDATE LOOP (updateUI()):");
  s.push("Runs on state modifications and periodic 1000ms ticker:");
  s.push("  - Refreshes header pill counters (Level, Coins, Diamonds, Energy).");
  s.push("  - Updates active page UI components.");
  s.push("  - Calls energy regeneration ticker.");
  s.push("");
  s.push("--------------------------------------------------------------------------------");
  s.push("3.3 CLOUD DATABASE & REALTIME SYNCHRONIZATION (frontend/shared/firebase-service.js)");
  s.push("--------------------------------------------------------------------------------");
  s.push("Manages bidirectional synchronization between local client state and Google Firebase cloud stores.");
  s.push("- Supported Backends: Dual support for Firebase Realtime Database (RTDB) and Cloud Firestore.");
  s.push("- saveToCloudDebounced(): Debounces save requests by 2500ms to avoid saturating write quotas during fast tapping.");
  s.push("- saveToCloudImmediate(): Flushes state immediately to /users/{uid} on critical events (level up, cashout claim).");
  s.push("- Offline Resilience: Attaches 'online' and 'offline' window listeners. If connection drops, mutations");
  s.push("  are held in a local sync queue and automatically pushed when connection recovers.");
  s.push("- fetchCloudData(uid): Reads player profile upon app boot. Compares cloud timestamp with local timestamp.");
  s.push("  If cloud data is newer, updates local state.");
  s.push("- syncLeaderboard(): Automatically pushes player's lifetime coin balance and level to /leaderboard collection.");
  s.push("");
  s.push("--------------------------------------------------------------------------------");
  s.push("3.4 AD NETWORK INTEGRATION & SIMULATOR (frontend/shared/ad-service.js)");
  s.push("--------------------------------------------------------------------------------");
  s.push("Integrates Monetag Rewarded Interstitial advertising with client-side fraud prevention.");
  s.push("- Official Monetag Zone ID: 11677609.");
  s.push("- showRewardedAd(onSuccess, onFail):");
  s.push("  Step 1: Checks if Monetag SDK function window.show_11677609 exists.");
  s.push("  Step 2: If available, triggers ad overlay. On successful view completion, triggers onSuccess().");
  s.push("  Step 3: If blocked by adblocker, network timeout, or SDK failure, automatically falls back");
  s.push("          to startAdSimulation() so the player is NEVER stuck or prevented from leveling up.");
  s.push("- startAdSimulation(zoneId, title, desc, onComplete):");
  s.push("  Displays an in-app simulated ad player modal with a high-tech progress countdown (typically 5s),");
  s.push("  ensuring game continuity in offline testing environments.");
  s.push("");
  s.push("--------------------------------------------------------------------------------");
  s.push("3.5 GLOBAL DESIGN SYSTEM & CYBER THEME TOKENS (frontend/shared/common.css)");
  s.push("--------------------------------------------------------------------------------");
  s.push("Defines the cyberpunk visual styling and layout tokens:");
  s.push("- Obsidian Space Backgrounds: --bg-primary: #040919, --bg-card: rgba(15, 23, 42, 0.75).");
  s.push("- Neon Energy Accents: --emerald: #10b981, --cyan: #06b6d4, --purple: #8b5cf6, --gold: #fbbf24.");
  s.push("- Glassmorphism: backdrop-filter: blur(16px), border: 1px solid rgba(255, 255, 255, 0.08).");
  s.push("- Typography: 'Plus Jakarta Sans' for primary UI headings, 'JetBrains Mono' for numbers and crypto counters.");
  s.push("- Animation Keyframes: @keyframes pulse-glow, @keyframes spin-slow, @keyframes float-up.");
  s.push("");
  return s.join('\n');
}




// section4_pages.js




const PAGES_DIR = path.join(__dirname, '..', 'frontend', 'pages');

const SPECIAL_PAGE_DESCRIPTIONS = {
  home: "The central Quantum Reactor clicker engine. Tapping the core extracts energy, earns coins, accumulates XP, and emits particle floaters.",
  energy: "Management center for the Reactor Generator. Players insert 7 colored fuel cells to recharge power and activate 2x turbo regeneration.",
  tasks: "Engagement mission hub with verification timers for Telegram subscriptions, YouTube views, and partner website browsing.",
  profile: "Player account identity hub, multi-device credential linking, comprehensive performance metrics (13 tracking parameters: Avatar, Username, Level, Reactor Level, Season Rank, Clan Tag, Total Taps, Total Coins Earned, Mini-games Played, Referrals, Current Streak, Longest Streak), and 5 unlockable achievement badges (⚡ Tap Master, 🏆 Champion, 🔥 Streak King, 💎 Diamond Player, 👑 Reactor Legend).",
  xp: "Complete 1 to 1000 Level Roadmap and Level 1000 Mega Cash Prize (10,000 Coins) with Dark Green Fuel rewards.",
  reward: "Cyber Arcade portal connecting players to all primary mini-games (Memory Match, Coin Catcher, Scratch, Egg, Spin, Chest).",
  goal: "1 to 1000 Goal Progression Roadmap with 3-Emoji Requirements (Cards, Keys, Tickets) and Level 1000 Mega Goal Prize.",
  streak: "Consecutive daily login tracker matrix with cumulative bonus multipliers and streak freeze protection.",
  "mega-reward": "Progressive community lottery jackpot challenges with entry tickets and communal prize pool.",
  "gift-card": "Virtual voucher store exchanging gold coins for Google Play, Amazon, and Steam digital gift cards.",
  gadgets: "Hardware tech rewards catalog featuring smartphones, gaming accessories, and electronics.",
  accessories: "Visual customization shop for the Quantum Reactor Orb, particle ring skins, and aesthetic aura glows.",
  "gaming-tool": "Player diagnostic speed testing tool measuring CPS (Clicks Per Second) with high-frequency timers.",
  kitchen: "Lifestyle and modern kitchenware reward redemption catalog.",
  stationery: "Academic, school, and creative office supplies reward catalog.",
  fitness: "Athletic equipment, gym gear, and health wellness prize catalog.",
  "home-decorate": "Ambient interior decor, smart LED lighting, and room aesthetic goods catalog.",
  custom: "Bespoke reward order portal for exclusive player requests and VIP concierge items.",
  "suggest-box": "Community feedback, game feature voting, and player suggestion submitter.",
  "ad-rewards": "Direct rewarded video ad station for instant energy replenishment and free fuel cell drops.",
  spin: "Rotary lucky wheel mini-game rendered on HTML5 Canvas with physics-based deceleration.",
  chest: "Multi-tier mystery vault mini-game featuring Bronze, Silver, Gold, and Cyber chests unlocked with Keys.",
  scratch: "Quantum Scratch Ticket mini-game featuring metallic foil canvas erasing, 5 prize tiers, and strict card-lock enforcement.",
  egg: "12-Egg Cyber Hatchery Match-3 mini-game featuring 10 random non-winning hatches and guaranteed 11th hatch victory.",
  "memory-match": "4x4 Memory Match card game featuring 16 neon cards (8 emoji pairs), 60s countdown timer, mistake tracking, 3-star rating, completion speed bonus, and server-authoritative reward validation.",
  "coin-catcher": "Dynamic falling objects mini-game where players catch falling Gold and Blue energy coins while avoiding bomb hazards, featuring a 3-heart life gauge, progressive combo multiplier up to 2.5x, and server-side velocity bounds.",
  leaderboard: "Global player rankings displaying podium winners and top 100 leaderboard across total coins and levels."
};

function generatePagesSection() {
  let s = [];
  s.push("================================================================================");
  s.push("SECTION 4: DEEP-DIVE INTO ALL 27 FRONTEND PAGES (frontend/pages/)");
  s.push("================================================================================");
  s.push("");

  const pageDirs = fs.readdirSync(PAGES_DIR).filter(d => fs.statSync(path.join(PAGES_DIR, d)).isDirectory());

  pageDirs.forEach((pageName, idx) => {
    const pageIndex = idx + 1;
    const pagePath = path.join(PAGES_DIR, pageName);
    const htmlFile = path.join(pagePath, `${pageName}.html`);
    const cssFile = path.join(pagePath, `${pageName}.css`);
    const jsFile = path.join(pagePath, `${pageName}.js`);

    const htmlSize = getFileSize(htmlFile);
    const cssSize = getFileSize(cssFile);
    const jsSize = getFileSize(jsFile);
    const jsLines = getLineCount(jsFile);

    const { ids, classes } = extractHtmlElements(htmlFile);
    const funcs = extractFunctionsDetails(jsFile);
    const desc = SPECIAL_PAGE_DESCRIPTIONS[pageName] || "Interactive game module.";

    s.push("--------------------------------------------------------------------------------");
    s.push(`4.${pageIndex} ${pageName.toUpperCase()} PAGE (frontend/pages/${pageName}/)`);
    s.push("--------------------------------------------------------------------------------");
    s.push(`Summary: ${desc}`);
    s.push(`Files:`);
    s.push(`  - HTML: frontend/pages/${pageName}/${pageName}.html (${htmlSize} bytes)`);
    s.push(`  - CSS : frontend/pages/${pageName}/${pageName}.css (${cssSize} bytes)`);
    s.push(`  - JS  : frontend/pages/${pageName}/${pageName}.js (${jsSize} bytes, ${jsLines} lines)`);
    s.push("");
    s.push(`A. HTML STRUCTURE & DOM ELEMENT IDS:`);
    if (ids.length > 0) {
      s.push(`  Element IDs: ${ids.join(', ')}`);
    } else {
      s.push(`  Element IDs: Standard scoped page-view container.`);
    }
    s.push("");
    s.push(`B. CSS VISUAL SYSTEM & LAYOUT:`);
    s.push(`  - Scoped Container: #page${pageName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}`);
    s.push(`  - Visual Styling: High-tech glassmorphism, responsive grid layouts, cyber button glows, and micro-animations.`);
    s.push("");
    s.push(`C. JAVASCRIPT FUNCTIONS & IMPLEMENTATION LOGIC (${funcs.length} functions):`);

    if (funcs.length === 0) {
      s.push(`  - No custom functions defined; page relies on global declarative navigation and shared styling.`);
    } else {
      funcs.forEach((fn, fIdx) => {
        s.push(`  ${fIdx + 1}. Function: ${fn.name}(${fn.params})`);
        s.push(`     - Line Range: Lines ${fn.startLine} to ${fn.endLine}`);
        if (fn.comment) {
          s.push(`     - Description: ${fn.comment}`);
        }
        s.push(`     - Execution Logic & Code Breakdown:`);
        
        // Analyze function body for key actions
        const bodyText = fn.body.join('\n');
        if (bodyText.includes('showRewardedAd')) {
          s.push(`       * Rewarded Ads: Invokes showRewardedAd() to require a video view before proceeding.`);
        }
        if (bodyText.includes('gameState.player.')) {
          s.push(`       * State Mutation: Modifies gameState.player properties (currency/inventory/progress).`);
        }
        if (bodyText.includes('saveGame()')) {
          s.push(`       * Persistence: Calls saveGame() to write changes to localStorage and queue cloud sync.`);
        }
        if (bodyText.includes('sfx.') || bodyText.includes('playTapSound') || bodyText.includes('playCoinSound')) {
          s.push(`       * Audio Feedback: Synthesizes procedural Web Audio waveforms for auditory feedback.`);
        }
        if (bodyText.includes('triggerTelegramHaptic')) {
          s.push(`       * Haptics: Triggers native Telegram WebApp physical vibration impulse.`);
        }
        if (bodyText.includes('showFloatingToast')) {
          s.push(`       * User Feedback: Displays floating neon toast notification on screen.`);
        }
        if (bodyText.includes('document.getElementById') || bodyText.includes('querySelector')) {
          s.push(`       * DOM Manipulation: Updates page elements, innerHTML, or visual classes dynamically.`);
        }
        if (bodyText.includes('ctx.') || bodyText.includes('getContext')) {
          s.push(`       * Canvas Engine: Renders graphics or clears pixels on HTML5 2D Canvas context.`);
        }

        // Add line-by-line summary of first few lines
        s.push(`     - Line-by-Line Code Overview:`);
        fn.body.slice(0, 6).forEach((bl, blIdx) => {
          const trimmed = bl.trim();
          if (trimmed) {
            s.push(`         Line ${fn.startLine + blIdx}: ${trimmed}`);
          }
        });
        if (fn.body.length > 6) {
          s.push(`         ... [${fn.body.length - 6} additional lines executing operational logic]`);
        }
        s.push("");
      });
    }
    s.push("");
  });

  return s.join('\n');
}




// section5_admin.js




const ADMIN_PAGES_DIR = path.join(__dirname, '..', 'admin', 'pages');

const ADMIN_PAGE_DESCRIPTIONS = {
  dashboard: "Master operational dashboard displaying real-time server health, total registered users, active sessions, coin economy circulation, and the In-Game Notification Center Broadcaster form allowing administrators to dispatch Global, Event, Maintenance, or Reward Announcement messages directly into player inboxes with interactive deep-link routing.",
  users: "User administration portal allowing admins to search players by Telegram ID or UID, inspect balances, modify currencies, and toggle bans.",
  "account-requests": "Identity verification and conflict management module for approving multi-device linking and resolving duplicate accounts.",
  "ads-manage": "Monetization configuration panel for adjusting Monetag zone IDs, setting ad display frequencies, cooldowns, and page caps.",
  "firebase-manage": "Database utility suite for exporting full JSON backups, importing database snapshots, and testing connection latency.",
  "mega-add": "Custom jackpot and lottery prize pool creation suite for designing new community events with custom ticket costs.",
  "mega-request": "Cashout validation desk for reviewing and approving Level 1000 Cash Prize claims (10,000 Coins) paid via UPI or Paytm.",
  settings: "Global system control module for toggling maintenance mode, broadcasting emergency banners, and editing Level 1 to 1000 configurations.",
  "tasks-web": "Mission management tool for adding, editing, and deleting external partner website browsing and Telegram subscription tasks."
};

function generateAdminSection() {
  let s = [];
  s.push("================================================================================");
  s.push("SECTION 5: ADMIN PORTAL MODULES & CONTROL CENTER (admin/)");
  s.push("================================================================================");
  s.push("");
  s.push("5.1 ADMIN ARCHITECTURE & MODULAR PIPELINE");
  s.push("The admin portal is a high-security internal dashboard accessible at /admin.");
  s.push("It uses the same modular architecture as the player application:");
  s.push("  - Compiled by admin/assemble.js from 9 distinct module directories in admin/pages/.");
  s.push("  - Employs administrative Firebase bridge (admin/shared/firebase.js) for cloud operations.");
  s.push("  - Features high-contrast dark cybersecurity aesthetics (admin/shared/common.css).");
  s.push("");

  const pageDirs = fs.readdirSync(ADMIN_PAGES_DIR).filter(d => fs.statSync(path.join(ADMIN_PAGES_DIR, d)).isDirectory());

  pageDirs.forEach((pageName, idx) => {
    const pageIndex = idx + 2;
    const pagePath = path.join(ADMIN_PAGES_DIR, pageName);
    const htmlFile = path.join(pagePath, `${pageName}.html`);
    const cssFile = path.join(pagePath, `${pageName}.css`);
    const jsFile = path.join(pagePath, `${pageName}.js`);

    const htmlSize = getFileSize(htmlFile);
    const cssSize = getFileSize(cssFile);
    const jsSize = getFileSize(jsFile);
    const jsLines = getLineCount(jsFile);

    const { ids } = extractHtmlElements(htmlFile);
    const funcs = extractFunctionsDetails(jsFile);
    const desc = ADMIN_PAGE_DESCRIPTIONS[pageName] || "Administrative management module.";

    s.push("--------------------------------------------------------------------------------");
    s.push(`5.${pageIndex} ${pageName.toUpperCase()} MODULE (admin/pages/${pageName}/)`);
    s.push("--------------------------------------------------------------------------------");
    s.push(`Summary: ${desc}`);
    s.push(`Files:`);
    s.push(`  - HTML: admin/pages/${pageName}/${pageName}.html (${htmlSize} bytes)`);
    s.push(`  - CSS : admin/pages/${pageName}/${pageName}.css (${cssSize} bytes)`);
    s.push(`  - JS  : admin/pages/${pageName}/${pageName}.js (${jsSize} bytes, ${jsLines} lines)`);
    s.push("");
    s.push(`A. HTML STRUCTURE & DOM ELEMENT IDS:`);
    if (ids.length > 0) {
      s.push(`  Element IDs: ${ids.join(', ')}`);
    } else {
      s.push(`  Element IDs: Scoped admin panel container.`);
    }
    s.push("");
    s.push(`B. JAVASCRIPT FUNCTIONS & IMPLEMENTATION LOGIC (${funcs.length} functions):`);

    if (funcs.length === 0) {
      s.push(`  - Module utilizes declarative server-rendered controls.`);
    } else {
      funcs.forEach((fn, fIdx) => {
        s.push(`  ${fIdx + 1}. Function: ${fn.name}(${fn.params})`);
        s.push(`     - Line Range: Lines ${fn.startLine} to ${fn.endLine}`);
        if (fn.comment) {
          s.push(`     - Description: ${fn.comment}`);
        }
        s.push(`     - Operational Overview:`);
        const bodyText = fn.body.join('\n');
        if (bodyText.includes('fetch(') || bodyText.includes('/api/')) {
          s.push(`       * API Communication: Sends HTTP request to server.js endpoint for administrative data retrieval/mutation.`);
        }
        if (bodyText.includes('firebase') || bodyText.includes('db.')) {
          s.push(`       * Cloud Database: Interacts directly with Google Firebase Firestore / Realtime Database.`);
        }
        if (bodyText.includes('document.getElementById') || bodyText.includes('innerHTML')) {
          s.push(`       * UI Refresh: Renders updated administrative records, data tables, or status badges.`);
        }

        s.push(`     - Line-by-Line Code Overview:`);
        fn.body.slice(0, 5).forEach((bl, blIdx) => {
          const trimmed = bl.trim();
          if (trimmed) {
            s.push(`         Line ${fn.startLine + blIdx}: ${trimmed}`);
          }
        });
        if (fn.body.length > 5) {
          s.push(`         ... [${fn.body.length - 5} additional lines executing operational logic]`);
        }
        s.push("");
      });
    }
    s.push("");
  });

  return s.join('\n');
}




// section6_7.js
function generateSecurityAndAlgorithmsSections() {
  let s = [];
  s.push("================================================================================");
  s.push("SECTION 6: SECURITY RULES & CONFIGURATIONS");
  s.push("================================================================================");
  s.push("");
  s.push("6.1 FIREBASE REALTIME DATABASE SECURITY (database.rules.json)");
  s.push("The Realtime Database enforces strict role-based access rules:");
  s.push("  - /users/$uid: Enforces that read and write operations are strictly permitted only");
  s.push("    if auth.uid === $uid. No user can read or overwrite another player's currency balances.");
  s.push("  - /leaderboard: Publicly readable (.read: true) so all players can view global rankings.");
  s.push("    Write operations are restricted to server-authenticated tokens or verified user score submissions.");
  s.push("  - /system: Administrative configuration node. Read-only for players; write restricted to admin auth.");
  s.push("");
  s.push("6.2 CLOUD FIRESTORE SECURITY (firestore.rules)");
  s.push("Firestore rules enforce granular object validations:");
  s.push("  - match /databases/{database}/documents");
  s.push("  - match /users/{userId}: allow read, write: if request.auth != null && request.auth.uid == userId;");
  s.push("  - match /settings/{document=**}: allow read: true; allow write: if request.auth.token.admin == true;");
  s.push("  - match /payout_requests/{requestId}: allow create: if request.auth != null; allow read, update: if request.auth.token.admin == true;");
  s.push("");
  s.push("6.3 CLOUD HOSTING & REWRITES (firebase.json & vercel.json)");
  s.push("  - Asset Caching: Static assets (images, web fonts, CSS) have Cache-Control headers set to");
  s.push("    'public, max-age=31536000, immutable' for instant repeat-visit rendering.");
  s.push("  - SPA Routing Rewrites: Any route not matching a physical file is rewritten to '/index.html'");
  s.push("    to enable client-side navigation without 404 errors.");
  s.push("  - API Proxying: Calls to /api/* are routed to serverless Node.js functions on Vercel.");
  s.push("");
  s.push("================================================================================");
  s.push("SECTION 7: END-TO-END EXECUTION FLOWS & ALGORITHMIC PROOFS");
  s.push("================================================================================");
  s.push("");
  s.push("7.1 TAP EXECUTION & POWER CONSUMPTION FLOW");
  s.push("  Step 1: User touches Quantum Reactor Orb (#reactorOrb).");
  s.push("  Step 2: Pointer event is intercepted by handleOrbTap(event) in home.js.");
  s.push("  Step 3: Validates reactor power: if gameState.reactor.currentEnergy < clickPower, plays error");
  s.push("          sawtooth tone and shows 'Core Depleted' floating alert.");
  s.push("  Step 4: Energy Deduction: gameState.reactor.currentEnergy -= clickPower.");
  s.push("  Step 5: Resource Award: gameState.player.coins += clickPower, gameState.player.xp += clickPower.");
  s.push("  Step 6: Particle Generation: Spawns floating neon number at clientX/clientY coordinates.");
  s.push("  Step 7: Feedback: Invokes sfx.playTapSound() and window.triggerTelegramHaptic('light').");
  s.push("  Step 8: Saves game state locally and queues debounced cloud sync.");
  s.push("");
  s.push("7.2 XP LEVEL ADVANCE & DARK GREEN FUEL MATH (LEVELS 1 TO 1000)");
  s.push("  - Linear XP Curve: Required XP for level L is computed as: requiredXp = L * 1000.");
  s.push("    * Level 1   : 1,000 XP");
  s.push("    * Level 500 : 500,000 XP");
  s.push("    * Level 1000: 1,000,000 XP");
  s.push("  - Dark Green Fuel Payout Formula (xp.js):");
  s.push("    * fuelCellsAwarded = Math.max(1, Math.min(200, Math.ceil(lvl / 5)))");
  s.push("    * Mathematical Progression:");
  s.push("      - Levels 1 to 5   : 1 Dark Green Fuel Cell");
  s.push("      - Levels 6 to 10  : 2 Dark Green Fuel Cells");
  s.push("      - Level 50        : 10 Dark Green Fuel Cells");
  s.push("      - Level 500       : 100 Dark Green Fuel Cells");
  s.push("      - Level 1000      : 200 Dark Green Fuel Cells (Max Cap)");
  s.push("  - Compulsory Video Ad Requirement:");
  s.push("    * Claiming any level reward requires watching exactly 1 rewarded ad via showRewardedAd().");
  s.push("  - Level 1000 Mega Cash Prize (10,000 Coins):");
  s.push("    * Unlocks when player reaches Level 1000.");
  s.push("    * Player watches 1,000 rewarded ads (tracked via xpState.watchedAds).");
  s.push("    * Upon reaching 1,000/1,000 ads, player submits payout claim for 10,000 Coins.");
  s.push("");
  s.push("7.3 GOAL MILESTONE PROGRESSION & EXPONENTIAL SCALING (GOALS 1 TO 1000)");
  s.push("  - 3-Emoji Progression Model: Requires Cards 🃏, Keys/Dandiyas 🥢, and Flowers/Tickets 🌸.");
  s.push("  - Mathematical Scaling Formula (goal.js):");
  s.push("    * progressRatio = (lvl - 1) / 999");
  s.push("    * curveFactor = Math.pow(progressRatio, 1.8)");
  s.push("    * cardsRequired   = Math.floor(20 + (200000 - 20) * curveFactor)");
  s.push("    * keysRequired    = Math.floor(50 + (500000 - 50) * curveFactor)");
  s.push("    * ticketsRequired = Math.floor(35 + (350000 - 35) * curveFactor)");
  s.push("  - Milestones:");
  s.push("    * Level 1   : 20 Cards, 50 Keys, 35 Tickets");
  s.push("    * Level 500 : ~54,000 Cards, ~135,000 Keys, ~94,500 Tickets");
  s.push("    * Level 1000: 200,000 Cards, 500,000 Keys, 350,000 Tickets");
  s.push("  - Level 1000 Mega Goal Prize:");
  s.push("    * Unlocks after completing Goal Level 1000 and watching 1,000 rewarded ads.");
  s.push("    * Awards Grand Loot: 100 Dandiyas/Keys, 75 Cards, 150 Flowers/Tickets, and 1,000 Coins.");
  s.push("");
  s.push("7.4 SCRATCH CARD CANVAS ALPHA-SUBSAMPLING MATH & 5-TIER PROBABILITIES");
  s.push("  - Strict Card Lock Enforcement:");
  s.push("    * singleCardState.hasActiveTicket must be true to scratch.");
  s.push("    * Without spending a card, clicking or dragging on the canvas is strictly blocked.");
  s.push("  - Canvas Erasing Physics (scratch.js):");
  s.push("    * Sets ctx.globalCompositeOperation = 'destination-out'.");
  s.push("    * Draws overlapping circles of radius 24px along the drag path.");
  s.push("  - Sub-sampling Alpha Check Algorithm (checkScratchCompletion()):");
  s.push("    * Instead of inspecting all 300x180 = 54,000 pixels (which would cause mobile frame drops),");
  s.push("      the engine sub-samples every 16th pixel (stride = 64 bytes in Uint8ClampedArray).");
  s.push("    * If transparent pixel count (alpha === 0) reaches >= 48% of total sample, triggers auto-reveal.");
  s.push("  - Strict 5-Tier Prize Distribution (SCRATCH_CARD_TIERS):");
  s.push("    * Tier 1: 1-2 Keys           -> 20% Probability");
  s.push("    * Tier 2: 10-20 Eggs         -> 50% Probability");
  s.push("    * Tier 3: 1-2 Tickets        -> 20% Probability");
  s.push("    * Tier 4: 10 Coins           ->  2% Probability");
  s.push("    * Tier 5: 50-75 Blue Coins   ->  8% Probability");
  s.push("    * Total Exact Probability    : 100%");
  s.push("  - On reveal completion, singleCardState.hasActiveTicket resets to false, requiring a new card.");
  s.push("");
  s.push("7.5 12-EGG HATCHERY PIGEONHOLE RANDOMIZATION & 11TH HATCH VICTORY PROOF");
  s.push("  - Grid Layout: 12 cyber eggs (4 columns x 3 rows). Cost: 1 Egg Coin per hatch.");
  s.push("  - 5 Win Categories (Collect 3 of any category to win):");
  s.push("    1. Keys        (3 Keys       -> Win 1 Key)");
  s.push("    2. Tickets     (3 Tickets    -> Win 1 Ticket)");
  s.push("    3. Cards       (3 Cards      -> Win 1 Card)");
  s.push("    4. Coins       (3 Coins      -> Win 10 Coins)");
  s.push("    5. Blue Coins  (3 Blue Coins -> Win 100 Blue Coins)");
  s.push("  - The 10-Item Randomization Rule:");
  s.push("    * At round initialization, the engine chooses targetWinner by weighted odds.");
  s.push("    * It generates a pool of 10 items consisting of exactly 2 items for each of the 5 categories:");
  s.push("      [Key, Key, Ticket, Ticket, Card, Card, Coin, Coin, BlueCoin, BlueCoin].");
  s.push("    * This 10-item pool is shuffled using the Fisher-Yates algorithm.");
  s.push("  - Mathematical Proof of Non-Completion in Hatches 1 to 10:");
  s.push("    * By the Pigeonhole Principle, since the maximum count of any category in the 10-item pool is 2,");
  s.push("      it is mathematically impossible for any category to reach 3 items during the first 10 hatches.");
  s.push("    * At hatch #10, all 5 collection meters will be at exactly 2/3 collected.");
  s.push("  - Guaranteed 11th Hatch Victory:");
  s.push("    * On the 11th hatch, the engine reveals the 3rd matching item for targetWinner.");
  s.push("    * That category hits 3/3, immediately triggering triggerEggWinCelebration().");
  s.push("    * Awards prize (e.g. 100 Blue Coins) and displays celebration modal.");
  s.push("");
  s.push("7.6 ANTI-FRAUD AD VERIFICATION & MULTI-DEVICE ACCOUNT UNIFICATION");
  s.push("  - Monetag Ad Validation: SDK invokes callback only upon complete video playback.");
  s.push("  - Multi-Identity Uniqueness: server.js checks normalized identity indexes (Telegram ID, phone, email).");
  s.push("    If any identifier is already claimed by another UID, registration or linking is blocked.");
  s.push("");
  s.push("7.7 MEMORY MATCH TIMING MATH, SPEED BONUS & STAR RATING PROOFS");
  s.push("  - 4 x 4 Matrix Shuffling: 16 cards comprising 8 identical emoji pairs (⚡, 💎, 🔋, 🚀, 🗝️, 🎫, 🥚, 🎴).");
  s.push("  - Card Flip State Engine: Tracks flippedCards array. Blocks clicks when flippedCards.length === 2 to prevent race conditions.");
  s.push("  - Countdown Timer Loop: 60-second window ticking via setInterval at 1000ms. If timer reaches 0, triggers gameOverMemory().");
  s.push("  - Multi-Factor Reward Algorithm:");
  s.push("    * Base Completion: 150 Coins, 1 Dungeon Key, 15 Diamonds.");
  s.push("    * Speed Bonus: timeBonusCoins = Math.max(0, timeRemaining) * 3.");
  s.push("    * Mistake Rating & Diamond Multiplier:");
  s.push("        - mistakes <= 2 : 3 Stars (⭐⭐⭐) & +60 Diamonds (Peak mastery bonus)");
  s.push("        - mistakes <= 5 : 2 Stars (⭐⭐)  & +35 Diamonds (Proficient solve)");
  s.push("        - mistakes > 5  : 1 Star  (⭐)   & +15 Diamonds (Standard solve)");
  s.push("  - Server Claim Verification: Client passes { timeRemaining, mistakes, stars } to POST /api/reward/claim.");
  s.push("    Server recalculates approved coins and diamonds using the exact same formula, rejecting any manipulated values.");
  s.push("");
  s.push("7.8 COIN CATCHER PHYSICS, HAZARDS, COMBO MULTIPLIER & SCORE BOUNDS");
  s.push("  - Object Spawning Matrix: Spawns every 600ms at randomized X coordinates (5% to 95% stage width).");
  s.push("  - Weighted Entity Distribution:");
  s.push("    * Gold Energy Coin (🪙): 55% frequency, speed 3.2px/frame, +10 Coins, increments combo.");
  s.push("    * Blue Energy Coin (💠): 25% frequency, speed 4.0px/frame, +25 Coins, increments combo.");
  s.push("    * Super Star (⭐): 8% frequency, speed 5.2px/frame, +50 Coins, +0.2x combo boost.");
  s.push("    * Bomb Hazard (💣): 12% frequency, speed 3.5px/frame, causes damage.");
  s.push("  - Life & Collision System: Player begins with 3 Lives (❤️❤️❤️). Catching a bomb triggers screen-shake CSS");
  s.push("    and deducts 1 Life. Losing all 3 lives immediately aborts the 30-second run.");
  s.push("  - Progressive Combo Multiplier: Increases by 0.1x per consecutive catch up to a max cap of 2.5x.");
  s.push("    Hitting a bomb hazard immediately resets the combo multiplier to 1.0x baseline.");
  s.push("  - Physical Speed Bounds Checking: Server enforces that in a 30s session, maximum achievable score");
  s.push("    is physically bounded (< 1500 coins and < 50 diamonds), instantly clamping suspicious values.");
  s.push("");
  s.push("7.9 IN-GAME NOTIFICATION DISPATCH, INBOX PERSISTENCE & DEEP-LINK ROUTING");
  s.push("  - Centralized Dispatch: Administrators compose announcements from the Admin Dashboard (admin/pages/dashboard/).");
  s.push("  - Inbox Notification Structure:");
  s.push("      { id, type, title, message, timestamp, read, actionText, actionTarget }.");
  s.push("  - Unread State Synchronization: App header polls or checks /api/notifications. If any unread message exists,");
  s.push("    the unread indicator pulse (#unreadBellDot) animates via CSS keyframes.");
  s.push("  - Contextual Deep-Link Routing:");
  s.push("    * Action buttons route players directly to specific game subsystems (e.g. actionTarget: 'streak'");
  s.push("      routes to #pageStreak; 'profile' routes to #pageProfile; 'reward' routes to #pageReward).");
  s.push("  - Single or Batch Mark-as-Read: Updates both server memoryStore and local storage to prevent duplicate alerts.");
  s.push("");
  s.push("7.10 ANTI-FRAUD ENGINE: REPLAY PREVENTION, COOLDOWNS & AUTOCLICKER ANOMALY DETECTION");
  s.push("  - Cryptographic Nonce Validation: Every reward claim generates a random UUID nonce. The server maintains");
  s.push("    memoryStore.antiFraud.processedNonces. If a claim arrives with an existing nonce, the server flags a Replay");
  s.push("    Attack and returns HTTP 409 Conflict without modifying user balances.");
  s.push("  - Granular Per-Action Cooldown Intervals (MIN_COOLDOWNS):");
  s.push("    * mini_game_memory : 12,000 ms (12 seconds minimum completion time)");
  s.push("    * mini_game_catcher: 15,000 ms (15 seconds minimum session duration)");
  s.push("    * ad_reward        :  8,000 ms (8 seconds minimum viewing time)");
  s.push("    * daily_streak     : 3,600,000 ms (1 hour between daily claims)");
  s.push("    * referral_claim   :  5,000 ms (5 seconds between squad payouts)");
  s.push("  - Tap Velocity Anomaly Detection (/api/anti-fraud/verify-tap-session):");
  s.push("    * ratePerSec = tapCount / durationSeconds.");
  s.push("    * Human multi-finger physical limit is ~20 to 25 taps/sec.");
  s.push("    * Rates exceeding 40 taps/sec are physically impossible on mobile screens and indicate automated software");
  s.push("      autoclickers. The server blocks the session with HTTP 400 and records the incident to security auditLog.");
  s.push("  - Multi-Identifier Uniqueness: identityIndex maps enforce that no Telegram ID, phone number, or email");
  s.push("    can belong to more than one player UID, shutting down multi-account referral fraud.");
  s.push("");
  s.push("7.11 SERVER-AUTHORITATIVE VS CLIENT-AUTHORITATIVE ARCHITECTURAL SEPARATION");
  s.push("  - Client-Authoritative (Safe UI & Visuals):");
  s.push("    * Active navigation tab and sub-tab selection.");
  s.push("    * Animation frame rendering, particle floaters, and screen-shake effects.");
  s.push("    * Sound effect toggles and volume preferences.");
  s.push("    * Selected cosmetic reactor ring skins.");
  s.push("    * Optimistic local counters for responsive 60 FPS tap feedback.");
  s.push("  - Server-Authoritative (Critical Economic Assets):");
  s.push("    * Gold coins, blue coins, diamonds, keys, spin tickets, and egg coins.");
  s.push("    * Level 1000 cashout payouts (10,000 Coins via UPI/Paytm).");
  s.push("    * Rewarded ad view payouts and energy refills.");
  s.push("    * Referral squad reward disbursements.");
  s.push("    * Achievement unlock certifications and badge granting.");
  s.push("    * Global leaderboard ranking scores.");
  s.push("  - Result: Player modifications to local window.gameState or localStorage cannot compromise game economics;");
  s.push("    any withdrawal, store purchase, or mini-game reward must be authorized by server.js.");
  s.push("================================================================================");
  s.push("                             END OF TECHNICAL GUIDE");
  s.push("================================================================================");
  return s.join('\n');
}




// section8_verification.js
// Technical Guide Section 8: Automated Verification, Diagnostics & QA Suite

function generateVerificationSection() {
  const parts = [];

  parts.push("================================================================================");
  parts.push("SECTION 8: QUALITY ASSURANCE, AUTOMATED VERIFICATION & TEST SUITE");
  parts.push("================================================================================");
  parts.push("");
  parts.push("8.1 MASTER VERIFICATION RUNNER ARCHITECTURE (guide/verification_suite.js)");
  parts.push("To ensure 100% regression-free operations, zero broken script references, and authoritative cloud");
  parts.push("connectivity, all diagnostic and verification procedures are unified into guide/verification_suite.js.");
  parts.push("Execution Command: node guide/verification_suite.js");
  parts.push("");
  parts.push("8.2 ADMIN DOM ELEMENT ID INTEGRITY VERIFICATION (checkAdminIds)");
  parts.push("- Target: Scans all 9 compiled administrative modules (dashboard, users, account-requests, ads-manage,");
  parts.push("  firebase-manage, mega-add, mega-request, settings, tasks-web) and shared/firebase.js.");
  parts.push("- Parsing Logic: Extracts all document.getElementById() calls via regex.");
  parts.push("- Validation: Verifies that every queried ID exists within admin/index.html, preventing null pointer");
  parts.push("  exceptions at runtime.");
  parts.push("");
  parts.push("8.3 ADMIN INLINE EVENT HANDLERS & SECURITY VERIFICATION (checkAdminHandlers)");
  parts.push("- Target: Parses all onclick, onchange, onsubmit, and oninput attributes in admin/index.html.");
  parts.push("- Scope: 100+ inline functions including switchAdminPage, openAddPlayerModal, filterAccountRequests, etc.");
  parts.push("- Proof: Confirms each function is explicitly declared on the window object or script scope.");
  parts.push("");
  parts.push("8.4 FIREBASE RTDB & ANONYMOUS AUTH CONNECTIVITY (testFirebase)");
  parts.push("- Anonymous Auth Sign-Up: Calls Google Identity Toolkit API to verify token issuance.");
  parts.push("- Shallow Endpoint Inspection: Tests read/write operations against /players, /leaderboard, /mega_rewards,");
  parts.push("  /website_tasks_config, and /telegram_tasks_config.");
  parts.push("- Bearer & Query Token Security: Verifies that unauthenticated writes are rejected while authenticated");
  parts.push("  requests return HTTP 200 OK.");
  parts.push("");
  parts.push("8.5 FRONTEND 27 TRIPLET PAGES INTEGRITY (checkFrontendIntegrity)");
  parts.push("- Verifies that all 27 canonical folders under frontend/pages/ contain non-empty matching triplets:");
  parts.push("  <page>.html, <page>.css, and <page>.js.");
  parts.push("- Validates that assemble.js successfully compiles frontend/index.html and frontend/style.css");
  parts.push("  without missing templates or stylesheet links.");
  parts.push("");
  parts.push("8.6 HEADLESS CHROME CDP VISUAL VALIDATION & ANIMATION PROOFS");
  parts.push("- Headless Automation: Spawns Google Chrome via Chrome DevTools Protocol (CDP) on mobile viewport (440x950).");
  parts.push("- Visual Proofs: Validates high-contrast CSS gradients, canvas rotary spinner slices, and 30-day quest cards.");
  parts.push("- Sunflower Loading Diagnostics: Validates canvas harvest animations and loading bar transition timers.");
  parts.push("");

  return parts.join('\n');
}




// build_full_guide.js











const GUIDE_PATH = path.join(ROOT, 'guide.txt');

console.log("=== COMPILING COMPLETE EXHAUSTIVE TECHNICAL GUIDE ===");

let guideParts = [];

// Header & Section 1
guideParts.push("================================================================================");
guideParts.push("ENERGY TAP REACTOR & REWARDS PLATFORM - COMPLETE EXHAUSTIVE TECHNICAL GUIDE");
guideParts.push("CODEBASE ARCHITECTURE, MODULAR PIPELINES & FUNCTION SPECIFICATIONS");
guideParts.push("================================================================================");
guideParts.push("Format: Pure Plain Text (.txt)");
guideParts.push("Scope: Every Page, Every Module, Every Function, and Line-by-Line Architecture");
guideParts.push("Generated: September 2026");
guideParts.push("================================================================================");
guideParts.push("");
guideParts.push("TABLE OF CONTENTS");
guideParts.push("--------------------------------------------------------------------------------");
guideParts.push("1. EXECUTIVE ARCHITECTURE & REPOSITORY BLUEPRINT");
guideParts.push("   1.1 Core Technology Stack & Runtime Ecosystem");
guideParts.push("   1.2 Complete Directory Structure & File Map");
guideParts.push("   1.3 Modular Component Lifecycle & The Assemble Engine (assemble.js)");
guideParts.push("   1.4 Admin Assembly Engine (admin/assemble.js)");
guideParts.push("");
guideParts.push("2. BACKEND SERVER ARCHITECTURE (server.js)");
guideParts.push("   2.1 Architecture, Dependencies & Port Binding");
guideParts.push("   2.2 MIME Types & File Serving Security");
guideParts.push("   2.3 In-Memory Data Store (memoryStore) Schema");
guideParts.push("   2.4 Identity Normalization & Utility Functions");
guideParts.push("   2.5 Authentication & Multi-Identity Management API Endpoints");
guideParts.push("   2.6 Level 1-1000 Configuration & Progression API Endpoints");
guideParts.push("   2.7 Tasks, Users & Administration API Endpoints");
guideParts.push("   2.8 Cashout & Account Requests Processing API Endpoints");
guideParts.push("   2.9 In-Game Notification Center Broadcast APIs (/api/notifications)");
guideParts.push("   2.10 Anti-Fraud & Server-Authoritative Reward Claim API (/api/reward/claim)");
guideParts.push("   2.11 Tap Velocity Anomaly & Autoclicker Detection API (/api/anti-fraud/verify-tap-session)");
guideParts.push("   2.12 Static Asset Delivery Pipeline & Path Sanitization");
guideParts.push("");
guideParts.push("3. FRONTEND CORE & SHARED CLIENT SERVICES (frontend/shared/)");
guideParts.push("   3.1 Reactive Game State & Server Authority Engine (frontend/shared/state.js)");
guideParts.push("   3.2 Application Controller, Router & In-Game Notification Center (frontend/shared/app.js)");
guideParts.push("   3.3 Cloud Database & Realtime Synchronization (frontend/shared/firebase-service.js)");
guideParts.push("   3.4 Ad Network Integration & Simulator (frontend/shared/ad-service.js)");
guideParts.push("   3.5 Global Design System & Cyber Theme Tokens (frontend/shared/common.css)");
guideParts.push("");
guideParts.push("4. DEEP-DIVE INTO ALL 27 FRONTEND PAGES (frontend/pages/)");
guideParts.push("   4.1  Home Page (home) - Quantum Reactor Core");
guideParts.push("   4.2  Energy Page (energy) - 7-Tier Fuel Injector & Booster");
guideParts.push("   4.3  Tasks Page (tasks) - Social Missions & Verification Timers");
guideParts.push("   4.4  Profile Page (profile) - Player Identity, 13 Metrics & 5 Achievement Badges");
guideParts.push("   4.5  XP Page (xp) - 1 to 1000 Level Roadmaps & 10,000 Coin Cash Prize");
guideParts.push("   4.6  Reward Page (reward) - Cyber Arcade & Mini-Game Hub");
guideParts.push("   4.7  Goal Page (goal) - 1 to 1000 Milestones & Mega Goal Prize");
guideParts.push("   4.8  Streak Page (streak) - Consecutive Login Matrix");
guideParts.push("   4.9  Mega Reward Page (mega-reward) - High-Roller Challenges");
guideParts.push("   4.10 Gift Card Page (gift-card) - Store Voucher Redemption");
guideParts.push("   4.11 Gadgets Page (gadgets) - Tech Hardware Marketplace");
guideParts.push("   4.12 Accessories Page (accessories) - Visual Skins & Custom Rings");
guideParts.push("   4.13 Gaming Tool Page (gaming-tool) - CPS Speed Analyzer & Utilities");
guideParts.push("   4.14 Kitchen Page (kitchen) - Lifestyle Goods Catalog");
guideParts.push("   4.15 Stationery Page (stationery) - Office & Creative Supplies");
guideParts.push("   4.16 Fitness Page (fitness) - Health & Athletic Equipment");
guideParts.push("   4.17 Home Decorate Page (home-decorate) - Ambient Living Products");
guideParts.push("   4.18 Custom Page (custom) - Bespoke Orders & Exclusive Perks");
guideParts.push("   4.19 Suggest Box Page (suggest-box) - Feedback & Polling Engine");
guideParts.push("   4.20 Ad Rewards Page (ad-rewards) - Direct Monetag Ad Booster");
guideParts.push("   4.21 Spin Page (spin) - Lucky Rotary Wheel (HTML5 Canvas)");
guideParts.push("   4.22 Chest Page (chest) - 4-Tier Mystery Vaults");
guideParts.push("   4.23 Scratch Page (scratch) - Quantum Scratch Card (Card Lock, Foil Erase & 5 Prize Tiers)");
guideParts.push("   4.24 Egg Page (egg) - 12-Egg Cyber Hatchery (10 Random + 11th Hatch Match-3 Win)");
guideParts.push("   4.25 Leaderboard Page (leaderboard) - Global Realtime Rankings");
guideParts.push("   4.26 Memory Match Page (memory-match) - 4x4 Grid, Timer, Mistake Scaling & Authoritative Rewards");
guideParts.push("   4.27 Coin Catcher Page (coin-catcher) - Falling Coins & Bombs, 3-Life Meter, Combo Multipliers & Server Bounds");
guideParts.push("");
guideParts.push("5. ADMIN PORTAL MODULES & CONTROL CENTER (admin/)");
guideParts.push("   5.1 Admin Architecture & Modular Pipeline");
guideParts.push("   5.2 Dashboard Module (admin/pages/dashboard/) - Added In-Game Notification Center Broadcaster");
guideParts.push("   5.3 User Management Module (admin/pages/users/)");
guideParts.push("   5.4 Account Verification Module (admin/pages/account-requests/)");
guideParts.push("   5.5 Ad Network Configuration Module (admin/pages/ads-manage/)");
guideParts.push("   5.6 Firebase Control Module (admin/pages/firebase-manage/)");
guideParts.push("   5.7 Mega Reward Creation Module (admin/pages/mega-add/)");
guideParts.push("   5.8 Mega Payout Processing Module (admin/pages/mega-request/)");
guideParts.push("   5.9 Global System Settings Module (admin/pages/settings/)");
guideParts.push("   5.10 Web & Social Tasks Control Module (admin/pages/tasks-web/)");
guideParts.push("   5.11 Admin Firebase SDK Bridge (admin/shared/firebase.js)");
guideParts.push("");
guideParts.push("6. SECURITY RULES & CONFIGURATIONS");
guideParts.push("   6.1 Firebase Realtime Database Security (database.rules.json)");
guideParts.push("   6.2 Cloud Firestore Security (firestore.rules)");
guideParts.push("   6.3 Cloud Hosting & Rewrites (firebase.json & vercel.json)");
guideParts.push("");
guideParts.push("7. END-TO-END EXECUTION FLOWS & ALGORITHMIC PROOFS");
guideParts.push("   7.1 Tap Execution & Power Consumption Flow");
guideParts.push("   7.2 XP Level Advance & Dark Green Fuel Math (Levels 1 to 1000)");
guideParts.push("   7.3 Goal Milestone Progression & Exponential Scaling (Goals 1 to 1000)");
guideParts.push("   7.4 Scratch Card Foil Alpha Subsampling Math & 5-Tier Probabilities");
guideParts.push("   7.5 12-Egg Hatchery Pigeonhole Randomization & 11th Hatch Victory Proof");
guideParts.push("   7.6 Anti-Fraud Ad Verification & Multi-Device Account Unification");
guideParts.push("   7.7 Memory Match Timing Math, Speed Bonus & Star Rating Proofs");
guideParts.push("   7.8 Coin Catcher Physics, Hazards, Combo Multiplier & Score Bounds");
guideParts.push("   7.9 In-Game Notification Dispatch, Inbox Persistence & Deep-Link Routing");
guideParts.push("   7.10 Anti-Fraud Engine: Replay Prevention, Cooldowns & Autoclicker Anomaly Detection");
guideParts.push("   7.11 Server-Authoritative vs Client-Authoritative Architectural Separation");
guideParts.push("");
guideParts.push("8. QUALITY ASSURANCE, AUTOMATED VERIFICATION & TEST SUITE");
guideParts.push("   8.1 Master Verification Runner Architecture (guide/verification_suite.js)");
guideParts.push("   8.2 Admin DOM Element ID Integrity Verification (checkAdminIds)");
guideParts.push("   8.3 Admin Inline Event Handlers & Security Verification (checkAdminHandlers)");
guideParts.push("   8.4 Firebase RTDB & Anonymous Auth Connectivity (testFirebase)");
guideParts.push("   8.5 Frontend 27 Triplet Pages Integrity (checkFrontendIntegrity)");
guideParts.push("   8.6 Headless Chrome CDP Visual Validation & Animation Proofs");
guideParts.push("================================================================================");
guideParts.push("");

// Section 1
guideParts.push("================================================================================");
guideParts.push("SECTION 1: EXECUTIVE ARCHITECTURE & REPOSITORY BLUEPRINT");
guideParts.push("================================================================================");
guideParts.push("");
guideParts.push("1.1 CORE TECHNOLOGY STACK & RUNTIME ECOSYSTEM");
guideParts.push("- Runtime: Node.js (v18+ LTS recommended). Pure native HTTP server with zero heavyweight frameworks.");
guideParts.push("- Client: Pure Vanilla HTML5, CSS3, and ES6+ JavaScript. No React, Vue, or Angular bundle bloat.");
guideParts.push("  This ensures instantaneous load times under 500ms on mobile devices and 60 FPS tap responsiveness.");
guideParts.push("- Graphics: HTML5 2D Canvas context utilized for interactive scratch card foil erasing (scratch.js)");
guideParts.push("  and physics-driven rotary wheel deceleration (spin.js).");
guideParts.push("- Procedural Audio: HTML5 Web Audio API (AudioContext) procedural synthesis. Sound effects (square, sine,");
guideParts.push("  sawtooth waves) are generated dynamically with custom ADSR envelopes, eliminating audio asset downloads.");
guideParts.push("- Telegram Mini App: Native Telegram WebApp SDK (telegram-web-app.js) integration for automatic user context,");
guideParts.push("  theme synchronization, and native mobile haptic feedback.");
guideParts.push("- Monetization: Monetag Rewarded Interstitial SDK (Zone 11677609) with automated fallback to an internal");
guideParts.push("  5-second simulated ad countdown player when adblockers or network restrictions occur.");
guideParts.push("- Dual Cloud Database: Bidirectional synchronization with Google Firebase Realtime Database and Cloud");
guideParts.push("  Firestore, backed by local Node.js in-memory caching and localStorage persistence.");
guideParts.push("");
guideParts.push("1.2 DIRECTORY STRUCTURE & FILE MAP");
guideParts.push("d:\\project\\tap gmae\\new\\");
guideParts.push("|-- server.js                         : Master Node.js HTTP server and REST API engine.");
guideParts.push("|-- package.json                      : Node project dependencies and lifecycle scripts.");
guideParts.push("|-- assemble.js                       : Top-level build pipeline executing frontend assembly.");
guideParts.push("|-- database.rules.json               : Firebase Realtime Database security rules.");
guideParts.push("|-- firestore.rules                   : Google Cloud Firestore security rules.");
guideParts.push("|-- firebase.json                     : Firebase Hosting, Rewrites, and Emulator configuration.");
guideParts.push("|-- vercel.json                       : Vercel serverless deployment and API routing configuration.");
guideParts.push("|-- guide.txt                         : This exhaustive technical manual.");
guideParts.push("|");
guideParts.push("|-- frontend/                         : Player Client Single Page Application (SPA).");
guideParts.push("|   |-- index.html                    : Master compiled client SPA containing all 27 page views.");
guideParts.push("|   |-- assemble.js                   : Compiler script that scans, verifies, and stitches 27 pages.");
guideParts.push("|   |-- style.css                     : Top-level stylesheet importing shared and page styles.");
guideParts.push("|   |-- shared/                       : Core client engines and services.");
guideParts.push("|   |   |-- state.js                  : Central reactive gameState store, local persistence & server authority.");
guideParts.push("|   |   |-- app.js                    : App bootstrapper, DOM cache, router, audio, toasts & Notification Center.");
guideParts.push("|   |   |-- firebase-service.js       : Realtime Database & Firestore sync engine.");
guideParts.push("|   |   |-- ad-service.js             : Monetag SDK integration and fallback simulator.");
guideParts.push("|   |   |-- common.css                : Global CSS variables, design tokens, and cyber theme.");
guideParts.push("|   |-- pages/                        : 27 modular self-contained page components.");
guideParts.push("|       |-- home/                     : Central Quantum Reactor, tap engine, click floaters.");
guideParts.push("|       |-- energy/                   : 7-tier fuel injector, generator upgrades, turbo timer.");
guideParts.push("|       |-- tasks/                    : Social, YouTube, Telegram & partner web missions.");
guideParts.push("|       |-- profile/                  : Player profile, 13 operational metrics & 5 achievement badges.");
guideParts.push("|       |-- xp/                       : Levels 1-1000 roadmap & 10,000 Coins Mega Cash Prize.");
guideParts.push("|       |-- reward/                   : Cyber arcade hub linking to all mini-games.");
guideParts.push("|       |-- goal/                     : Goals 1-1000 roadmap & Level 1000 Mega Goal Prize.");
guideParts.push("|       |-- streak/                   : Daily login check-in matrix & streak freeze.");
guideParts.push("|       |-- mega-reward/              : Progressive community jackpot challenges.");
guideParts.push("|       |-- gift-card/                : Google Play, Amazon, and Steam voucher store.");
guideParts.push("|       |-- gadgets/                  : Tech gadgets, smartphones, and hardware rewards.");
guideParts.push("|       |-- accessories/              : Cosmetic reactor ring skins and particle glows.");
guideParts.push("|       |-- gaming-tool/              : CPS (clicks per second) speed diagnostic utility.");
guideParts.push("|       |-- kitchen/                  : Lifestyle and kitchenware reward catalog.");
guideParts.push("|       |-- stationery/               : Academic, school, and creative office supplies catalog.");
guideParts.push("|       |-- fitness/                  : Athletic equipment, gym gear, and health wellness catalog.");
guideParts.push("|       |-- home-decorate/            : Ambient interior decor, smart lighting, and room aesthetic catalog.");
guideParts.push("|       |-- custom/                   : Bespoke reward order portal for exclusive player requests.");
guideParts.push("|       |-- suggest-box/              : Community feedback, game feature voting, and player suggestion submitter.");
guideParts.push("|       |-- ad-rewards/               : Direct rewarded video ad station for instant energy refill.");
guideParts.push("|       |-- spin/                     : Lucky rotary wheel mini-game rendered on HTML5 Canvas.");
guideParts.push("|       |-- chest/                    : 4-tier mystery vault mini-game (Bronze, Silver, Gold, Cyber).");
guideParts.push("|       |-- scratch/                  : Quantum Scratch Card (Card lock, foil erase & 5 prize tiers).");
guideParts.push("|       |-- egg/                      : 12-Egg Cyber Hatchery (10 random non-winning + 11th hatch win).");
guideParts.push("|       |-- leaderboard/              : Global player rankings across total coins and levels.");
guideParts.push("|       |-- memory-match/             : 4x4 Memory Match card game (16 cards, 8 pairs, timer, rewards).");
guideParts.push("|       |-- coin-catcher/             : Dynamic coin catcher (falling coins/bombs, combo meter, 3 lives).");
guideParts.push("|");
guideParts.push("|-- admin/                            : Administrative Web Portal.");
guideParts.push("|   |-- index.html                    : Master compiled admin dashboard.");
guideParts.push("|   |-- assemble.js                   : Admin compiler stitching 9 administrative modules.");
guideParts.push("|   |-- shared/                       : Shared admin modules.");
guideParts.push("|   |   |-- firebase.js               : Admin Firebase SDK bridge with elevated privileges.");
guideParts.push("|   |   |-- common.css                : Admin control styling and data tables.");
guideParts.push("|   |-- pages/                        : 9 administrative control modules.");
guideParts.push("|       |-- dashboard/                : Platform analytics, active sessions, coin circulation.");
guideParts.push("|       |-- users/                    : Player search, balance modifier, ban/unban toggles.");
guideParts.push("|       |-- account-requests/         : Multi-identity conflict review & approval.");
guideParts.push("|       |-- ads-manage/               : Monetag zone IDs, cooldowns, and daily caps.");
guideParts.push("|       |-- firebase-manage/          : Cloud backup export, JSON restore, collection wipes.");
guideParts.push("|       |-- mega-add/                 : Custom jackpot / lottery creator.");
guideParts.push("|       |-- mega-request/             : Payout review for Level 1000 Cash Prizes (UPI/Paytm).");
guideParts.push("|       |-- settings/                 : Maintenance mode, emergency banner, Level 1-1000 editor.");
guideParts.push("|       |-- tasks-web/                : Partner website and social tasks manager.");
guideParts.push("");
guideParts.push("1.3 MODULAR COMPONENT LIFECYCLE & THE ASSEMBLE ENGINE (frontend/assemble.js)");
guideParts.push("Each page is developed across 3 files: <page>.html, <page>.css, and <page>.js.");
guideParts.push("The assemble script (node frontend/assemble.js):");
guideParts.push("  1. Verifies that all 3 files exist for each of the 27 pages.");
guideParts.push("  2. Injects meta tags, SDK scripts, fonts, and stylesheets into the compiled <head>.");
guideParts.push("  3. Concatenates all 27 page HTML fragments into the <main> container.");
guideParts.push("  4. Injects persistent header pills and floating cyber bottom navigation.");
guideParts.push("  5. Concatenates all shared and page JavaScript scripts into frontend/index.html.");
guideParts.push("");
guideParts.push("1.4 ADMIN ASSEMBLY ENGINE (admin/assemble.js)");
guideParts.push("Compiles the 9 administrative modules into admin/index.html with top navigation tabs and administrative controls.");
guideParts.push("");

console.log("Adding Section 2...");
guideParts.push(generateServerSection());

console.log("Adding Section 3...");
guideParts.push(generateSharedSection());

console.log("Adding Section 4 (all 27 pages)...");
guideParts.push(generatePagesSection());

console.log("Adding Section 5 (all 9 admin modules)...");
guideParts.push(generateAdminSection());

console.log("Adding Section 6 & 7...");
guideParts.push(generateSecurityAndAlgorithmsSections());

console.log("Adding Section 8 (Verification & Test Suite)...");
guideParts.push(generateVerificationSection());

const fullText = guideParts.join('\n');
fs.writeFileSync(GUIDE_PATH, fullText, 'utf8');

console.log(`Successfully generated guide.txt!`);
console.log(`Total Length: ${fullText.length} characters`);
console.log(`Total Lines : ${fullText.split('\n').length} lines`);

