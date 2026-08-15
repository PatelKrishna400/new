/* ═══════════════════════════════════════════════════════════
   TAP EMPIRE — Configuration v2
   • Firebase public config (safe to expose)
   • Economy defaults (overridden by Firestore gameConfig)
   • Performance mode detection
   • Utility functions
   NEVER put secrets (bot token, service account key) here.
═══════════════════════════════════════════════════════════ */

'use strict';

/* ── Firebase public config — project: tap-game-80070 ── */
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDnujl5_iBlSzwDfjCLA7sFQ7zW1DxROic',
  authDomain: 'tap-game-80070.firebaseapp.com',
  projectId: 'tap-game-80070',
  storageBucket: 'tap-game-80070.firebasestorage.app',
  messagingSenderId: '1028935905694',
  appId: '1:1028935905694:web:1fc8bb35a959d99bbbe68f',
  measurementId: 'G-EBXQ2KY1HL',
};

/* ── Monetag rewarded-ad zone ──────────────────────────────
   Obtain from: https://monetag.com → Dashboard → Create Zone
   → Rewarded Interstitial. The SDK <script> tag must also be
   added to index.html from your Monetag dashboard.
   The exposed function will be: window['show_' + MONETAG_ZONE_ID]
─────────────────────────────────────────────────────────── */
const MONETAG_ZONE_ID = '11577158';

/* ── Admin Telegram user ID ───────────────────────────────
   Only this numeric ID sees the admin panel.
   Get it from @userinfobot on Telegram.
─────────────────────────────────────────────────────────── */
const ADMIN_TELEGRAM_ID = 8854472153;

/* ── Backend API base URL ─────────────────────────────────
   Dev:  http://localhost:5001/YOUR_PROJECT/us-central1/api
   Prod: https://us-central1-YOUR_PROJECT.cloudfunctions.net/api
─────────────────────────────────────────────────────────── */
const API_BASE = 'https://us-central1-tap-game-80070.cloudfunctions.net/api';

/* ── Tap-batch sync interval (ms) ────────────────────────
   Taps are accumulated locally and flushed to Firestore
   every TAP_BATCH_INTERVAL ms (or on demand).
   This prevents per-tap Firestore writes.
─────────────────────────────────────────────────────────── */
const TAP_BATCH_INTERVAL = 3000;  // flush every 3 s of idle
const TAP_BATCH_MAX_TAPS = 200;   // force-flush after this many taps
const LEADERBOARD_UPDATE_PROB = 0.08; // ~8% chance to update lb per batch

/* ── Cache TTLs (ms) ─────────────────────────────────────
   Non-sensitive data cached in localStorage.
─────────────────────────────────────────────────────────── */
const CACHE_TTL = {
  economy: 15 * 60 * 1000,  // 15 min
  leaderboard: 2 * 60 * 1000,  // 2 min
  missions: 5 * 60 * 1000,  // 5 min (definitions only)
  profile: 1 * 60 * 1000,  // 1 min
};

/* ── Default economy (overridden by Firestore gameConfig/economy) ── */
const DEFAULT_ECONOMY = {
  /* Starting Player Values */
  startingCoins: 100,
  startingEnergy: 500,
  startingTapPower: 1,
  startingLevel: 1,
  startingXp: 0,

  /* Tap Progression */
  coinsPerTap: 1,
  tapPowerLevelMultiplier: 0.35, // tapPower = floor(1 + level * 0.35)
  criticalChanceBase: 0.03,       // 3% critical win chance
  criticalMultiplier: 2,          // 2× normal reward on critical
  perfectTapWindowMs: 800,
  perfectTapMultiplier: 2,

  /* Win Reward System */
  baseWinReward: 5,
  winIncrement: 1.8,

  /* Combo */
  comboResetMs: 2000,
  comboThresholds: [5, 10, 20, 50],
  comboMultipliers: [2, 3, 5, 10],

  /* Energy */
  energyMax: 500,
  energyRegenPerSec: 1 / 3,   // ~1 per 3 seconds

  /* Ads / collection */
  rewardAdCooldownSeconds: 60,
  maximumRewardAdsPerDay: 10,
  maximumRewardAdsPerSession: 5,
  minimumSecondsBetweenAdReqs: 60,
  adRewardCoins: 100,
  offlineRewardCoinsPerHour: 50,
  offlineRewardAdMultiplier: 2,
  chestBaseReward: 25,
  chestAdMultiplier: 2,
  energyCollectAmount: 10,  // Changed from 100 to 10 per collect / ad watch
  tapPowerTimerMs: 30 * 60 * 1000, // 30 minutes timed level boost
  dailyBonusCoins: 10,

  /* 7-Day Daily Bonus Cycle */
  dailyBonusCycle: [10, 15, 20, 30, 40, 60, 100],

  /* Progression */
  xpPerTap: 1,
  tapRateLimit: 20,      // max taps/second before warning

  /* Economy / withdrawal */
  minimumWithdrawalCoins: 100000,
  minimumWithdrawalStars: 10,
  coinsPerStar: 10000,
  maximumDailyWithdrawalCoins: 500000,
  minimumWithdrawalLevel: 10,
  minimumWithdrawalAdViews: 20,
  payoutRatio: 0.30,
  revenueReserve: 0.30,
  globalPayoutPaused: false,

  /* Referral Rewards (Gradual) */
  referralJoinCoins: 10,
  referralActiveCoins: 25,
  referralLvl5Coins: 50,
  referralLvl10Coins: 100,
  referralRewardCoins: 185,

  /* Revenue tracking (estimates – display only) */
  estimatedCPM: 2.0,
  adFillRate: 1.0,
  monthlyRevenueTarget: 1000,
};

/* ══════════════════════════════════════════
   PERFORMANCE MODE DETECTION
   Detects device capability and sets
   body class: perf-low | perf-med | perf-high
══════════════════════════════════════════ */
const PERF = (() => {
  /* Saved preference overrides auto-detect */
  const saved = localStorage.getItem('te_perf_mode');
  if (saved && ['low', 'med', 'high'].includes(saved)) {
    return { mode: saved, auto: false };
  }

  /* Heuristic: hardware concurrency + memory + connection */
  const cores = navigator.hardwareConcurrency || 2;
  const mem = navigator.deviceMemory || 2; // GB, Chromium only
  const conn = (navigator.connection || {}).effectiveType || '4g';
  const isSlowNet = conn === '2g' || conn === 'slow-2g';

  let score = 0;
  if (cores >= 6) score += 2;
  else if (cores >= 4) score += 1;
  if (mem >= 4) score += 2;
  else if (mem >= 2) score += 1;
  if (isSlowNet) score -= 1;

  const mode = score >= 4 ? 'high' : score >= 2 ? 'med' : 'low';
  return { mode, auto: true };
})();

function applyPerfMode(mode) {
  document.body.classList.remove('perf-low', 'perf-med', 'perf-high');
  document.body.classList.add('perf-' + mode);
  localStorage.setItem('te_perf_mode', mode);
}

/* Apply immediately (before DOM ready is fine – body exists) */
applyPerfMode(PERF.mode);

/* Particle counts per performance tier */
const PARTICLE_COUNT = { low: 5, med: 12, high: 22 };
const BG_PARTICLE_COUNT = { low: 0, med: 18, high: 38 };

/* ══════════════════════════════════════════
   PROGRESSION & ECONOMY FORMULAS
══════════════════════════════════════════ */

/** Tap power formula for a given player level: floor(1 + lvl * 0.35) */
function tapPowerForLevel(lvl) {
  return Math.floor(1 + (lvl || 1) * 0.35);
}

/** Win reward formula based on win count & player level */
function winRewardForCount(winCount, lvl) {
  const base = Math.floor(5 + (winCount * 1.8) + (Math.sqrt(winCount) * 2));
  const maxLimit = lvl >= 100 ? 500 : lvl >= 50 ? 250 : lvl >= 30 ? 150 : lvl >= 20 ? 100 : lvl >= 10 ? 60 : lvl >= 5 ? 35 : 20;
  return Math.min(maxLimit, base);
}

/** Win streak bonus */
function winStreakBonus(streak) {
  if (streak >= 30) return 50;
  if (streak >= 20) return 30;
  if (streak >= 10) return 15;
  if (streak >= 5) return 5;
  return 0;
}

/** 7-Day daily bonus cycle reward */
function dailyRewardForDay(dayNumber) {
  const cycle = DEFAULT_ECONOMY.dailyBonusCycle;
  const idx = Math.max(0, (dayNumber - 1) % cycle.length);
  return cycle[idx];
}

/** Level-up reward for a given target level */
function levelUpReward(lvl) {
  const rewards = { 2: 10, 3: 15, 4: 20, 5: 25, 10: 100, 20: 250, 50: 750, 100: 2000 };
  return rewards[lvl] || Math.floor(lvl * 5);
}

/** Upgrade cost formula: floor(100 * pow(1.25, level - 1)) */
function upgradeCost(upgradeLevel) {
  return Math.floor(100 * Math.pow(1.25, Math.max(1, upgradeLevel) - 1));
}

/** XP required to advance from level `lvl` to `lvl + 1`: 100, 150, 220, 300, 400... */
function xpForLevel(lvl) {
  if (lvl === 1) return 100;
  if (lvl === 2) return 150;
  if (lvl === 3) return 220;
  if (lvl === 4) return 300;
  if (lvl === 5) return 400;
  return Math.floor(100 * Math.pow(1.35, lvl - 1));
}

/** Format a large number: 1.23M, 456K, 1,234 */
function fmt(n) {
  n = Math.floor(n);
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString();
}

/** Format seconds as MM:SS */
function fmtTime(s) {
  s = Math.max(0, Math.ceil(s));
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' +
    String(s % 60).padStart(2, '0');
}

/** Format a relative timestamp ("2 min ago", "just now") */
function fmtRelative(ts) {
  if (!ts) return '';
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + ' min ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}

/** Format a USD value for display */
function fmtUSD(n) {
  if (typeof n !== 'number' || isNaN(n)) return '$0.00';
  return '$' + n.toFixed(n < 0.01 ? 6 : 2);
}

/** Escape HTML for safe innerHTML insertion */
function esc(str) {
  return String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

/** Clamp a value between min and max */
function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

/** Throttle — returns a fn that fires at most once per `ms` */
function throttle(fn, ms) {
  let last = 0;
  return function (...args) {
    const now = Date.now();
    if (now - last >= ms) { last = now; fn.apply(this, args); }
  };
}

/** Debounce — delays execution until `ms` after last call */
function debounce(fn, ms) {
  let t;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), ms);
  };
}

/** Lightweight API caller — always sends initData for auth */
async function callAPI(path, body = {}, method = 'POST') {
  const url = API_BASE + path;
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, initData: getInitData() }),
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Server error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

/** localStorage cache helper */
const Cache = {
  set(key, data, ttl = 300000) {
    try {
      localStorage.setItem('te_cache_' + key, JSON.stringify({ data, exp: Date.now() + ttl }));
    } catch (_) { }
  },
  get(key) {
    try {
      const raw = localStorage.getItem('te_cache_' + key);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (Date.now() > obj.exp) { localStorage.removeItem('te_cache_' + key); return null; }
      return obj.data;
    } catch (_) { return null; }
  },
  del(key) {
    try { localStorage.removeItem('te_cache_' + key); } catch (_) { }
  },
};
