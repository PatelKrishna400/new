/**
 * Assemble & Verification Script for Modular Pages
 * Assembles all 14 page-wise HTML, CSS, and JS files into index.html
 */
const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const PAGES_DIR = path.join(ROOT_DIR, 'pages');
const SHARED_DIR = path.join(ROOT_DIR, 'shared');

const PAGE_KEYS = [
  'home',
  'energy',
  'tasks',
  'profile',
  'reward',
  'streak',
  'mega-reward',
  'gift-card',
  'gadgets',
  'accessories',
  'gaming-tool',
  'kitchen',
  'stationery',
  'fitness',
  'home-decorate',
  'custom',
  'suggest-box',
  'ad-rewards',
  'spin',
  'chest',
  'scratch',
  'egg',
  'leaderboard',
  'memory-match',
  'coin-catcher',
  'sunflower',
  'bee-farm',
  'mining',
  'diamond-generator'
];

console.log('--- Verifying Modular Page Structure ---');
let allValid = true;

PAGE_KEYS.forEach(key => {
  const htmlPath = path.join(PAGES_DIR, key, `${key}.html`);
  const cssPath = path.join(PAGES_DIR, key, `${key}.css`);
  const jsPath = path.join(PAGES_DIR, key, `${key}.js`);

  if (!fs.existsSync(htmlPath)) {
    console.error(`Missing HTML: ${htmlPath}`);
    allValid = false;
  }
  if (!fs.existsSync(cssPath)) {
    console.error(`Missing CSS: ${cssPath}`);
    allValid = false;
  }
  if (!fs.existsSync(jsPath)) {
    console.error(`Missing JS: ${jsPath}`);
    allValid = false;
  }
});

if (!allValid) {
  console.error('Assembly aborted due to missing files.');
  process.exit(1);
}

console.log(`All ${PAGE_KEYS.length} pages verified with HTML, CSS, and JS!`);

// Construct Master index.html
const headerContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="theme-color" content="#040919">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <title>Energy Tap Reactor - Telegram Mini App</title>
  <!-- Telegram WebApp SDK -->
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
  <!-- Monetag Rewarded Interstitial SDK (Zone: 11677609) -->
  <script src="https://libtl.com/sdk.js" data-zone="11677609" data-sdk="show_11677609"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&family=Fredoka:wght@400;500;600;700&family=Fredoka+One&family=Nunito:wght@700;800;900&family=Orbitron:wght@500;700;800;900&family=Rajdhani:wght@500;600;700&family=Quicksand:wght@600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
  <!-- Tailwind CSS (Scoped without preflight reset) -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      corePlugins: { preflight: false },
      theme: {
        extend: {
          fontFamily: {
            sci: ['Orbitron', 'monospace'],
            tech: ['Rajdhani', 'sans-serif'],
            fredoka: ['Fredoka', 'sans-serif']
          },
          colors: {
            sunamber: '#f59e0b',
            sunyellow: '#fde047',
            leafgreen: '#22c55e',
            earthbrown: '#78350f',
            stonegray: '#334155',
            honeygold: '#f59e0b',
            honeyamber: '#d97706',
            combcream: '#fef3c7',
            hivebrown: '#78350f',
            nectarrose: '#fb7185',
            abyss: '#040711',
            cavern: '#090f1e',
            cybercyan: '#00f0ff',
            neonviolet: '#bd00ff',
            plasmaamber: '#ffaa00',
            cryoice: '#38bdf8',
            volcanicslag: '#ff3344',
            coremetal: '#141e33'
          },
          animation: {
            'bounce-gentle': 'bounceGentle 2s infinite ease-in-out',
            'spin-very-slow': 'spin 25s linear infinite',
            'worker-hammer': 'workerPump 1.8s infinite ease-in-out',
            'float-slow': 'floatSlow 3s ease-in-out infinite',
            'buzz-float': 'buzzDance 0.8s infinite ease-in-out',
            'float-gentle': 'floatGentle 2.5s ease-in-out infinite',
            'pulse-glow': 'pulseGlow 2s infinite'
          },
          keyframes: {
            bounceGentle: {
              '0%, 100%': { transform: 'translateY(0)' },
              '50%': { transform: 'translateY(-6px)' }
            },
            floatSlow: {
              '0%, 100%': { transform: 'translateY(0px)' },
              '50%': { transform: 'translateY(-10px)' }
            },
            workerPump: {
              '0%, 100%': { transform: 'rotate(0deg) scale(1)' },
              '50%': { transform: 'rotate(-12deg) translateY(4px) scale(0.96)' }
            },
            buzzDance: {
              '0%, 100%': { transform: 'translate(0px, 0px) rotate(0deg)' },
              '25%': { transform: 'translate(2px, -3px) rotate(3deg)' },
              '50%': { transform: 'translate(-2px, 1px) rotate(-3deg)' },
              '75%': { transform: 'translate(2px, 2px) rotate(2deg)' }
            },
            floatGentle: {
              '0%, 100%': { transform: 'translateY(0px)' },
              '50%': { transform: 'translateY(-6px)' }
            },
            pulseGlow: {
              '0%, 100%': { filter: 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.4))' },
              '50%': { filter: 'drop-shadow(0 0 16px rgba(245, 158, 11, 0.85))' }
            }
          }
        }
      }
    };
  </script>

  <!-- Consolidated Unified Stylesheet (Replaces 29 separate blocking HTTP round-trips) -->
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <!-- High-Tech Quantum Loading Splash Screen -->
  <div class="app-splash-screen" id="appSplashScreen">
    <div class="splash-backdrop-glow"></div>
    <div class="splash-content">
      <!-- Animated Reactor Core Logo -->
      <div class="splash-reactor-core">
        <div class="splash-core-ring outer"></div>
        <div class="splash-core-ring middle"></div>
        <div class="splash-core-ring inner"></div>
        <div class="splash-core-center">
          <svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="#22d3ee" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="rgba(34, 211, 238, 0.25)"/>
          </svg>
        </div>
        <div class="splash-core-pulsar"></div>
      </div>

      <!-- App Title & Branding -->
      <div class="splash-branding">
        <h1 class="splash-title">ENERGY TAP</h1>
        <div class="splash-subtitle-badge">
          <span class="splash-pulse-dot"></span>
          <span>QUANTUM REACTOR v5.0</span>
        </div>
      </div>

      <!-- Progress Section -->
      <div class="splash-progress-wrapper">
        <div class="splash-progress-track">
          <div class="splash-progress-bar" id="splashProgressBar"></div>
          <div class="splash-progress-glow" id="splashProgressGlow"></div>
        </div>
        <div class="splash-progress-meta">
          <span class="splash-status-text" id="splashStatusText">Initializing Quantum Core...</span>
          <span class="splash-percent-text" id="splashPercentText">0%</span>
        </div>
      </div>

      <!-- Telegram / Network Security Pill -->
      <div class="splash-security-pill">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <span>SECURE QUANTUM CLOUD READY</span>
      </div>
    </div>
  </div>

  <!-- Ambient background glow elements -->
  <div class="ambient-glow glow-top"></div>
  <div class="ambient-glow glow-bottom"></div>
  <div class="particles-container" id="ambientParticles"></div>


  <!-- Main Mobile Shell Container -->
  <div class="app-viewport">
    <main class="mobile-container" id="app">
      
      <!-- Top Status / Header (Shared across pages) -->
      <header class="app-header">
        <div class="user-profile-widget" onclick="switchPage('profile')" style="cursor: pointer;">
          <div class="avatar-wrapper">
            <div class="avatar-img-box" id="headerAvatarBox">
              <svg viewBox="0 0 100 100" class="avatar-svg">
                <defs>
                  <linearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#4f46e5" />
                    <stop offset="50%" stop-color="#3b82f6" />
                    <stop offset="100%" stop-color="#06b6d4" />
                  </linearGradient>
                  <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#fbcfe8" />
                    <stop offset="100%" stop-color="#cbd5e1" />
                  </linearGradient>
                </defs>
                <rect width="100" height="100" fill="#0f172a" />
                <circle cx="50" cy="50" r="46" fill="url(#avatarGrad)" opacity="0.3"/>
                <!-- Stylized Player Portrait Avatar -->
                <circle cx="50" cy="40" r="22" fill="url(#skinGrad)"/>
                <!-- Hair -->
                <path d="M 28 36 C 28 20, 72 20, 72 36 C 68 28, 60 25, 50 25 C 40 25, 32 28, 28 36 Z" fill="#1e293b"/>
                <path d="M 30 38 Q 26 48 31 52 Q 33 42 34 38 Z" fill="#1e293b"/>
                <path d="M 70 38 Q 74 48 69 52 Q 67 42 66 38 Z" fill="#1e293b"/>
                <!-- Face Features -->
                <ellipse cx="42" cy="40" rx="2.5" ry="3" fill="#0f172a"/>
                <ellipse cx="58" cy="40" rx="2.5" ry="3" fill="#0f172a"/>
                <path d="M 46 48 Q 50 51 54 48" stroke="#0f172a" stroke-width="1.8" stroke-linecap="round" fill="none"/>
                <!-- Body / Jacket -->
                <path d="M 20 85 C 22 62, 35 60, 50 60 C 65 60, 78 62, 80 85 Z" fill="#3b82f6"/>
                <path d="M 38 60 L 50 78 L 62 60" fill="#1d4ed8"/>
                <path d="M 45 78 L 50 100 L 55 78" fill="#1e293b"/>
              </svg>
            </div>
            <span class="level-badge" id="playerLevelBadge">Lv.0</span>
          </div>
          <div class="user-meta">
            <div class="user-name-row">
              <h1 class="user-name" id="playerUsername">Player</h1>
              <span class="tg-verified-badge" id="tgVerifiedBadge" title="Telegram Mini App Verified">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="#24A1DE"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
              </span>
            </div>
            <div class="firebase-cloud-status-badge connecting" id="firebaseCloudStatus" style="display: none;">
              <span class="cloud-dot connecting">●</span> Connecting...
            </div>
          </div>
        </div>

        <div class="header-actions">
          <!-- Golden Coin Badge -->
          <div class="metric-pill coin-pill" id="coinPill" title="Golden Coin Balance">
            <div class="coin-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                <circle cx="12" cy="12" r="9" fill="#f59e0b" stroke="#fbbf24" stroke-width="1.5"/>
                <circle cx="12" cy="12" r="6.5" stroke="#d97706" stroke-width="1" stroke-dasharray="2 1"/>
                <path d="M9.5 9h5M12 9v6M10 15h4" stroke="#78350f" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
            </div>
            <span class="pill-value" id="headerCoinBalance">0</span>
          </div>


          <!-- Diamond Badge -->
          <div class="metric-pill diamond-pill" id="diamondPill" title="Diamonds (Mega Rewards)">
            <div class="coin-icon diamond-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                <polygon points="6 3 18 3 22 9 12 22 2 9" fill="#0891b2" stroke="#22d3ee" stroke-width="1.5"/>
                <polygon points="6 3 12 9 18 3" fill="#67e8f9" opacity="0.8"/>
                <polygon points="2 9 12 9 6 3" fill="#a5f3fc" opacity="0.6"/>
                <polygon points="18 3 12 9 22 9" fill="#06b6d4" opacity="0.7"/>
                <polygon points="12 22 12 9 2 9" fill="#0e7490" opacity="0.5"/>
                <polygon points="12 22 22 9 12 9" fill="#164e63" opacity="0.7"/>
              </svg>
            </div>
            <span class="pill-value diamond-pill-val" id="headerDiamondBalance">0</span>
          </div>

          <!-- Streak / Fire Button -->
          <button class="icon-action-btn streak-btn" id="streakBtn" title="Daily Streak">
            <span class="btn-dot-indicator"></span>
            <svg class="fire-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 23c-4.97 0-9-3.8-9-8.5 0-3.66 2.4-7.4 5.5-9.5 0 0 .5-.34.7-.22.2.12.23.4.16.62-.48 1.48-.48 3.1.2 4.35.1.18.33.25.5.15.17-.1.25-.3.2-.49-.4-1.63.1-3.37 1.3-4.57 1.4-1.4 2.2-3.1 2.3-4.84 0-.25.22-.45.47-.45.18 0 .34.1.42.27 2.1 4.3 4.1 6.5 4.1 9.68 0 4.69-4.03 8.5-6.85 8.5z"/>
            </svg>
          </button>

          <!-- Notification Inbox Bell Button -->
          <button class="icon-action-btn inbox-btn" id="headerInboxBtn" onclick="toggleNotificationInbox()" title="Notification Inbox">
            <span class="btn-dot-indicator unread-bell-dot" id="inboxUnreadDot" style="display: none;"></span>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </button>
        </div>


      </header>

      <!-- ================================================================
           MODULAR PAGES CONTAINER (LOADED FROM /pages/)
           ================================================================ -->
`;

const pagesContent = PAGE_KEYS.map(k => {
  const html = fs.readFileSync(path.join(PAGES_DIR, k, `${k}.html`), 'utf8');
  return `      <!-- PAGE: ${k.toUpperCase()} -->\n${html.split('\n').map(l => '      ' + l).join('\n')}`;
}).join('\n\n');

const footerContent = `

      <!-- Floating Bottom Navigation -->
      <nav class="bottom-nav">
        <button class="nav-tab-btn" data-tab="tasks" id="navTasks" aria-label="Tasks">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 11l3 3L22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
        </button>

        <button class="nav-tab-btn" data-tab="energy" id="navEnergy" aria-label="Energy">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        </button>

        <button class="nav-tab-btn home-center-btn active" data-tab="home" id="navHome" aria-label="Home">
          <div class="home-btn-glow"></div>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </button>

        <button class="nav-tab-btn" data-tab="reward" id="navReward" aria-label="Rewards">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 12 20 22 4 22 4 12"/>
            <rect x="2" y="7" width="20" height="5" rx="1"/>
            <line x1="12" y1="22" x2="12" y2="7"/>
            <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
            <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
          </svg>
        </button>

        <button class="nav-tab-btn" data-tab="profile" id="navProfile" aria-label="Profile">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </button>
      </nav>

    </main>

    <!-- Modal Sheets -->
    <div class="modal-backdrop" id="modalBackdrop">
      <div class="modal-sheet" id="modalSheet">
        <div class="sheet-drag-handle"></div>
        <div class="sheet-header">
          <h3 class="sheet-title" id="sheetTitle">Title</h3>
          <button class="sheet-close-btn" id="sheetCloseBtn">&times;</button>
        </div>
        <div class="sheet-content" id="sheetContent"></div>
      </div>
    </div>

    <!-- Notification Center Modal / In-Game Inbox -->
    <div class="notification-modal-overlay" id="notificationModalOverlay">
      <div class="notification-modal-sheet">
        <div class="notification-sheet-handle"></div>
        
        <div class="notification-modal-header">
          <div class="notif-header-title-wrap">
            <span class="notif-bell-icon">🔔</span>
            <h3 class="notif-title">Command Center Inbox</h3>
            <span class="notif-unread-count-pill" id="inboxUnreadCountBadge">0 New</span>
          </div>
          <button class="notif-close-btn" onclick="toggleNotificationInbox(false)">✕</button>
        </div>

        <!-- Filter Tabs: All, Rewards, System -->
        <div class="notif-filter-tabs">
          <button class="notif-filter-btn active" id="notifFilterAll" onclick="filterNotifications('all')">All</button>
          <button class="notif-filter-btn" id="notifFilterRewards" onclick="filterNotifications('rewards')">Rewards 🎁</button>
          <button class="notif-filter-btn" id="notifFilterSystem" onclick="filterNotifications('system')">Announcements 📢</button>
        </div>

        <!-- Notification Messages List -->
        <div class="notification-list" id="notificationItemsList">
          <!-- Rendered dynamically -->
        </div>

        <div class="notif-sheet-footer">
          <button class="notif-mark-all-read-btn" onclick="markAllNotificationsRead()">
            <span>✓</span> Mark All as Read
          </button>
        </div>
      </div>
    </div>

  </div>

  <!-- Firebase Cloud Realtime SDKs -->
  <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics-compat.js"></script>
  <script src="shared/firebase-service.js"></script>

  <!-- Monetag Ad Service -->
  <script src="shared/ad-service.js"></script>

  <!-- Shared Core State -->
  <script src="shared/state.js"></script>

  <!-- Critical Initial Modules (Home, Energy Reactor & Diamond Generator) -->
  <script src="pages/home/home.js"></script>
  <script src="pages/energy/energy.js"></script>
  <script src="pages/diamond-generator/diamond-generator.js"></script>

  <!-- App Shell, Dynamic On-Demand Loader & Router -->
  <script src="shared/app.js"></script>
</body>
</html>
`;

const fullHtml = headerContent + pagesContent + footerContent;
fs.writeFileSync(path.join(ROOT_DIR, 'index.html'), fullHtml, 'utf8');
console.log('Successfully assembled modular index.html in frontend/!');

// Compile consolidated CSS into style.css directly
const commonCss = fs.readFileSync(path.join(SHARED_DIR, 'common.css'), 'utf8');
const pageCssBundles = PAGE_KEYS.map(k => {
  const p = path.join(PAGES_DIR, k, `${k}.css`);
  return fs.existsSync(p) ? `/* --- PAGE: ${k.toUpperCase()} --- */\n` + fs.readFileSync(p, 'utf8') : '';
}).join('\n\n');
const fullCss = `/* Energy Tap Reactor - Consolidated Unified Stylesheet */\n${commonCss}\n\n${pageCssBundles}\n`;
fs.writeFileSync(path.join(ROOT_DIR, 'style.css'), fullCss, 'utf8');
console.log('Successfully compiled consolidated style.css in frontend/!');



