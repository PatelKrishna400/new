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
  'xp',
  'reward',
  'goal',
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
  'egg'
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
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">

  <!-- Shared Global Styles -->
  <link rel="stylesheet" href="shared/common.css">

  <!-- Modular Page-Wise Styles -->
${PAGE_KEYS.map(k => `  <link rel="stylesheet" href="pages/${k}/${k}.css">`).join('\n')}
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

  <!-- Floating Navratri Marigold Petals Container -->
  <div class="navratri-petals-container" id="navratriPetals">
    <div class="marigold-petal" style="left: 8%; animation-duration: 9.5s; animation-delay: 0s;"></div>
    <div class="marigold-petal" style="left: 26%; animation-duration: 12.5s; animation-delay: 3s;"></div>
    <div class="marigold-petal" style="left: 48%; animation-duration: 8.8s; animation-delay: 1.5s;"></div>
    <div class="marigold-petal" style="left: 68%; animation-duration: 11.2s; animation-delay: 4s;"></div>
    <div class="marigold-petal" style="left: 85%; animation-duration: 10s; animation-delay: 2s;"></div>
    <div class="marigold-petal" style="left: 93%; animation-duration: 13s; animation-delay: 5.5s;"></div>
  </div>

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
                <!-- Stylized Alex Vance Head & Torso -->
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
              <h1 class="user-name" id="playerUsername">Alex Vance</h1>
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

          <!-- Blue Gem Coin Badge -->
          <div class="metric-pill blue-coin-pill" id="blueCoinPill" title="Blue Gem Coins">
            <div class="coin-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                <polygon points="12 2 21 8.5 17.5 21 6.5 21 3 8.5" fill="#0284c7" stroke="#38bdf8" stroke-width="1.5"/>
                <polygon points="12 5 18 9.5 15.5 18 8.5 18 6 9.5" fill="#38bdf8" stroke="#bae6fd" stroke-width="1"/>
                <circle cx="12" cy="12" r="2.5" fill="#f0f9ff"/>
              </svg>
            </div>
            <span class="pill-value" id="headerBlueBalance">0</span>
          </div>

          <!-- Streak / Fire Button -->
          <button class="icon-action-btn streak-btn" id="streakBtn" title="Daily Streak">
            <span class="btn-dot-indicator"></span>
            <svg class="fire-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 23c-4.97 0-9-3.8-9-8.5 0-3.66 2.4-7.4 5.5-9.5 0 0 .5-.34.7-.22.2.12.23.4.16.62-.48 1.48-.48 3.1.2 4.35.1.18.33.25.5.15.17-.1.25-.3.2-.49-.4-1.63.1-3.37 1.3-4.57 1.4-1.4 2.2-3.1 2.3-4.84 0-.25.22-.45.47-.45.18 0 .34.1.42.27 2.1 4.3 4.1 6.5 4.1 9.68 0 4.69-4.03 8.5-6.85 8.5z"/>
            </svg>
          </button>
        </div>

        <!-- Authentic Navratri Temple Door Toran Garland (Bandhanwar) -->
        <div class="navratri-toran" aria-hidden="true">
          <svg class="toran-door-svg" viewBox="0 0 440 42" preserveAspectRatio="none">
            <defs>
              <!-- Auspicious Gradients -->
              <linearGradient id="toranBandGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#b45309"/>
                <stop offset="15%" stop-color="#f59e0b"/>
                <stop offset="35%" stop-color="#fde047"/>
                <stop offset="50%" stop-color="#f59e0b"/>
                <stop offset="65%" stop-color="#fde047"/>
                <stop offset="85%" stop-color="#f59e0b"/>
                <stop offset="100%" stop-color="#b45309"/>
              </linearGradient>
              <radialGradient id="toranGendaYellow" cx="38%" cy="38%" r="62%">
                <stop offset="0%" stop-color="#fffbeb"/>
                <stop offset="35%" stop-color="#fde047"/>
                <stop offset="70%" stop-color="#f59e0b"/>
                <stop offset="100%" stop-color="#b45309"/>
              </radialGradient>
              <radialGradient id="toranGendaOrange" cx="38%" cy="38%" r="62%">
                <stop offset="0%" stop-color="#fff7ed"/>
                <stop offset="35%" stop-color="#fb923c"/>
                <stop offset="70%" stop-color="#ea580c"/>
                <stop offset="100%" stop-color="#9a3412"/>
              </radialGradient>
              <radialGradient id="toranGendaRed" cx="38%" cy="38%" r="62%">
                <stop offset="0%" stop-color="#fff1f2"/>
                <stop offset="35%" stop-color="#fb7185"/>
                <stop offset="70%" stop-color="#e11d48"/>
                <stop offset="100%" stop-color="#881337"/>
              </radialGradient>
              <linearGradient id="toranLeafGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#22c55e"/>
                <stop offset="55%" stop-color="#15803d"/>
                <stop offset="100%" stop-color="#052e16"/>
              </linearGradient>
              <linearGradient id="toranBellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#fffbeb"/>
                <stop offset="40%" stop-color="#fbbf24"/>
                <stop offset="80%" stop-color="#d97706"/>
                <stop offset="100%" stop-color="#78350f"/>
              </linearGradient>
              <radialGradient id="toranRosetteGrad" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stop-color="#ffffff"/>
                <stop offset="40%" stop-color="#fde047"/>
                <stop offset="75%" stop-color="#f59e0b"/>
                <stop offset="100%" stop-color="#b45309"/>
              </radialGradient>
              <!-- Mango Leaf Template -->
              <g id="mangoLeaf">
                <path d="M 0 0 C -3.8 6, -3.2 14, 0 20 C 3.2 14, 3.8 6, 0 0 Z" fill="url(#toranLeafGrad)" filter="drop-shadow(0 1px 1.5px rgba(0,0,0,0.6))"/>
                <line x1="0" y1="1" x2="0" y2="18" stroke="#86efac" stroke-width="0.75" opacity="0.85"/>
              </g>
              <!-- Brass Bell Template -->
              <g id="brassBell">
                <path d="M -4.5 3 C -4.5 0, 4.5 0, 4.5 3 L 5.5 7.5 C 5.5 9, -5.5 9, -5.5 7.5 Z" fill="url(#toranBellGrad)" filter="drop-shadow(0 1.5px 2.5px rgba(245,158,11,0.6))"/>
                <circle cx="0" cy="9.8" r="1.4" fill="#fef08a"/>
              </g>
            </defs>

            <!-- 1. Top Gota-Patti Embroidered Door Pelmet Ribbon -->
            <rect x="0" y="0" width="440" height="4.5" fill="url(#toranBandGrad)"/>
            <line x1="0" y1="4.5" x2="440" y2="4.5" stroke="#fde047" stroke-width="0.8"/>
            <!-- Diamond Mirror (Abhla) Studs Along Door Frame -->
            <g fill="#ffffff" stroke="#92400e" stroke-width="0.5" opacity="0.95">
              <polygon points="14,2.2 16.5,0.6 19,2.2 16.5,3.8"/>
              <polygon points="40,2.2 42.5,0.6 45,2.2 42.5,3.8"/>
              <polygon points="66,2.2 68.5,0.6 71,2.2 68.5,3.8"/>
              <polygon points="92,2.2 94.5,0.6 97,2.2 94.5,3.8"/>
              <polygon points="118,2.2 120.5,0.6 123,2.2 120.5,3.8"/>
              <polygon points="144,2.2 146.5,0.6 149,2.2 146.5,3.8"/>
              <polygon points="170,2.2 172.5,0.6 175,2.2 172.5,3.8"/>
              <polygon points="196,2.2 198.5,0.6 201,2.2 198.5,3.8"/>
              <polygon points="220,2.2 222.5,0.6 225,2.2 222.5,3.8"/>
              <polygon points="244,2.2 246.5,0.6 249,2.2 246.5,3.8"/>
              <polygon points="270,2.2 272.5,0.6 275,2.2 272.5,3.8"/>
              <polygon points="296,2.2 298.5,0.6 301,2.2 298.5,3.8"/>
              <polygon points="322,2.2 324.5,0.6 327,2.2 324.5,3.8"/>
              <polygon points="348,2.2 350.5,0.6 353,2.2 350.5,3.8"/>
              <polygon points="374,2.2 376.5,0.6 379,2.2 376.5,3.8"/>
              <polygon points="400,2.2 402.5,0.6 405,2.2 402.5,3.8"/>
              <polygon points="426,2.2 428.5,0.6 431,2.2 428.5,3.8"/>
            </g>

            <!-- 2. Scalloped Garland Swags (4 Traditional Arches) -->
            <!-- Golden connecting cords -->
            <path d="M 14 4 Q 66 22 118 4" stroke="#f59e0b" stroke-width="1.8" fill="none" stroke-dasharray="2 1.5"/>
            <path d="M 118 4 Q 169 22 220 4" stroke="#f59e0b" stroke-width="1.8" fill="none" stroke-dasharray="2 1.5"/>
            <path d="M 220 4 Q 271 22 322 4" stroke="#f59e0b" stroke-width="1.8" fill="none" stroke-dasharray="2 1.5"/>
            <path d="M 322 4 Q 374 22 426 4" stroke="#f59e0b" stroke-width="1.8" fill="none" stroke-dasharray="2 1.5"/>

            <!-- Hanging Mango / Ashoka Leaves (Pointing Down along curves) -->
            <!-- Arch 1 Leaves -->
            <use href="#mangoLeaf" x="38" y="7" transform="rotate(-8 38 7)"/>
            <use href="#mangoLeaf" x="52" y="12"/>
            <use href="#mangoLeaf" x="80" y="12"/>
            <use href="#mangoLeaf" x="96" y="7" transform="rotate(8 96 7)"/>
            <!-- Arch 2 Leaves -->
            <use href="#mangoLeaf" x="142" y="7" transform="rotate(-8 142 7)"/>
            <use href="#mangoLeaf" x="156" y="12"/>
            <use href="#mangoLeaf" x="182" y="12"/>
            <use href="#mangoLeaf" x="198" y="7" transform="rotate(8 198 7)"/>
            <!-- Arch 3 Leaves -->
            <use href="#mangoLeaf" x="244" y="7" transform="rotate(-8 244 7)"/>
            <use href="#mangoLeaf" x="258" y="12"/>
            <use href="#mangoLeaf" x="284" y="12"/>
            <use href="#mangoLeaf" x="300" y="7" transform="rotate(8 300 7)"/>
            <!-- Arch 4 Leaves -->
            <use href="#mangoLeaf" x="346" y="7" transform="rotate(-8 346 7)"/>
            <use href="#mangoLeaf" x="360" y="12"/>
            <use href="#mangoLeaf" x="388" y="12"/>
            <use href="#mangoLeaf" x="404" y="7" transform="rotate(8 404 7)"/>

            <!-- Fluffy Multi-Tone Marigold (Genda Phool) Flowers along arches -->
            <!-- Arch 1 Marigolds -->
            <circle cx="28" cy="9" r="5.2" fill="url(#toranGendaYellow)"/>
            <circle cx="48" cy="15" r="5.4" fill="url(#toranGendaOrange)"/>
            <circle cx="66" cy="18" r="6" fill="url(#toranGendaRed)"/>
            <circle cx="86" cy="15" r="5.4" fill="url(#toranGendaYellow)"/>
            <circle cx="106" cy="9" r="5.2" fill="url(#toranGendaOrange)"/>
            <!-- Arch 2 Marigolds -->
            <circle cx="132" cy="9" r="5.2" fill="url(#toranGendaRed)"/>
            <circle cx="152" cy="15" r="5.4" fill="url(#toranGendaYellow)"/>
            <circle cx="169" cy="18" r="6" fill="url(#toranGendaOrange)"/>
            <circle cx="188" cy="15" r="5.4" fill="url(#toranGendaRed)"/>
            <circle cx="208" cy="9" r="5.2" fill="url(#toranGendaYellow)"/>
            <!-- Arch 3 Marigolds -->
            <circle cx="234" cy="9" r="5.2" fill="url(#toranGendaOrange)"/>
            <circle cx="254" cy="15" r="5.4" fill="url(#toranGendaRed)"/>
            <circle cx="271" cy="18" r="6" fill="url(#toranGendaYellow)"/>
            <circle cx="290" cy="15" r="5.4" fill="url(#toranGendaOrange)"/>
            <circle cx="310" cy="9" r="5.2" fill="url(#toranGendaRed)"/>
            <!-- Arch 4 Marigolds -->
            <circle cx="336" cy="9" r="5.2" fill="url(#toranGendaYellow)"/>
            <circle cx="356" cy="15" r="5.4" fill="url(#toranGendaOrange)"/>
            <circle cx="374" cy="18" r="6" fill="url(#toranGendaRed)"/>
            <circle cx="394" cy="15" r="5.4" fill="url(#toranGendaYellow)"/>
            <circle cx="414" cy="9" r="5.2" fill="url(#toranGendaOrange)"/>

            <!-- Auspicious Suspended Golden Temple Bells (Ghunghroo) At Swag Centers -->
            <line x1="66" y1="21" x2="66" y2="25" stroke="#f59e0b" stroke-width="1.2"/>
            <use href="#brassBell" x="66" y="25"/>
            <line x1="169" y1="21" x2="169" y2="25" stroke="#f59e0b" stroke-width="1.2"/>
            <use href="#brassBell" x="169" y="25"/>
            <line x1="271" y1="21" x2="271" y2="25" stroke="#f59e0b" stroke-width="1.2"/>
            <use href="#brassBell" x="271" y="25"/>
            <line x1="374" y1="21" x2="374" y2="25" stroke="#f59e0b" stroke-width="1.2"/>
            <use href="#brassBell" x="374" y="25"/>

            <!-- Junction Medallion Rosettes with Pearl Centers -->
            <circle cx="14" cy="4" r="5" fill="url(#toranRosetteGrad)"/>
            <circle cx="14" cy="4" r="2.2" fill="#ffffff"/>
            <circle cx="118" cy="4" r="5" fill="url(#toranRosetteGrad)"/>
            <circle cx="118" cy="4" r="2.2" fill="#ffffff"/>
            <circle cx="220" cy="4" r="5.5" fill="url(#toranRosetteGrad)"/>
            <circle cx="220" cy="4" r="2.5" fill="#ffffff"/>
            <circle cx="322" cy="4" r="5" fill="url(#toranRosetteGrad)"/>
            <circle cx="322" cy="4" r="2.2" fill="#ffffff"/>
            <circle cx="426" cy="4" r="5" fill="url(#toranRosetteGrad)"/>
            <circle cx="426" cy="4" r="2.2" fill="#ffffff"/>

            <!-- 3. Left Door-Post Entrance Cascading Latkan (Hanging Tassel) -->
            <line x1="14" y1="6" x2="14" y2="34" stroke="#fbbf24" stroke-width="1.2" stroke-dasharray="1.5 1"/>
            <use href="#mangoLeaf" x="14" y="6" transform="scale(0.7) translate(-10 0)"/>
            <circle cx="14" cy="13" r="4.5" fill="url(#toranGendaYellow)"/>
            <circle cx="14" cy="20" r="4.5" fill="url(#toranGendaRed)"/>
            <circle cx="14" cy="27" r="4.5" fill="url(#toranGendaOrange)"/>
            <use href="#brassBell" x="14" y="30"/>

            <!-- 4. Right Door-Post Entrance Cascading Latkan (Hanging Tassel) -->
            <line x1="426" y1="6" x2="426" y2="34" stroke="#fbbf24" stroke-width="1.2" stroke-dasharray="1.5 1"/>
            <use href="#mangoLeaf" x="426" y="6" transform="scale(0.7) translate(-10 0)"/>
            <circle cx="426" cy="13" r="4.5" fill="url(#toranGendaRed)"/>
            <circle cx="426" cy="20" r="4.5" fill="url(#toranGendaYellow)"/>
            <circle cx="426" cy="27" r="4.5" fill="url(#toranGendaOrange)"/>
            <use href="#brassBell" x="426" y="30"/>
          </svg>
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

  <!-- Modular Page-Wise Scripts -->
${PAGE_KEYS.map(k => `  <script src="pages/${k}/${k}.js"></script>`).join('\n')}

  <!-- App Shell & Router -->
  <script src="shared/app.js"></script>
</body>
</html>
`;

fs.writeFileSync(path.join(ROOT_DIR, 'index.html'), headerContent + pagesContent + footerContent, 'utf8');
console.log('Successfully assembled modular index.html!');

// Also write CSS aggregator to style.css for backwards compatibility
const styleImports = [
  '/* CSS Aggregator for modular pages */',
  '@import url("shared/common.css");',
  ...PAGE_KEYS.map(k => `@import url("pages/${k}/${k}.css");`)
].join('\n');
fs.writeFileSync(path.join(ROOT_DIR, 'style.css'), styleImports + '\n', 'utf8');
console.log('Successfully updated style.css with modular imports!');

