// section4_pages.js
const fs = require('fs');
const path = require('path');
const { extractFunctionsDetails, extractHtmlElements, getFileSize, getLineCount } = require('./parse_utils');

const PAGES_DIR = path.join(__dirname, 'frontend', 'pages');

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

module.exports = { generatePagesSection };
