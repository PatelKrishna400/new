/* ═══════════════════════════════════════════════════════════
   TAP EMPIRE — Global State v2
   CLIENT DISPLAY STATE ONLY.
   Financial balances displayed here are NOT authoritative.
   All writes go through the server or validated Firestore txns.
═══════════════════════════════════════════════════════════ */

'use strict';

const STATE = {
  /* ── Telegram ── */
  tgUser: null,
  isAdmin: false,

  /* ── Economy config (merged from Firestore gameConfig) ── */
  economy: { ...DEFAULT_ECONOMY },

  /* ── Player core (synced from Firestore) ── */
  coins: DEFAULT_ECONOMY.startingCoins,
  energy: DEFAULT_ECONOMY.startingEnergy,
  maxEnergy: DEFAULT_ECONOMY.startingEnergy,
  level: DEFAULT_ECONOMY.startingLevel,
  xp: DEFAULT_ECONOMY.startingXp,
  tapPower: DEFAULT_ECONOMY.startingTapPower,
  criticalChance: DEFAULT_ECONOMY.criticalChanceBase,
  totalTaps: 0,
  totalAdViews: 0,
  boostMultiplier: 1,
  boostExpiry: 0,
  pendingWithdrawal: false,
  lastEnergyUpdate: 0,        // epoch ms — used for timestamp-based regen
  lastActiveTs: 0,        // epoch ms — for offline reward calc

  /* ── Revenue estimates (display only — NOT authoritative) ── */
  estimatedAdRevenue: 0,
  rewardLiability: 0,
  eligibleWithdrawal: 0,

  /* ── Combo ── */
  comboCount: 0,
  comboTimer: null,
  comboExpiry: 0,
  bestCombo: 0,

  /* ── Perfect tap ── */
  perfectTapActive: false,
  perfectTapTs: 0,

  /* ── Session ── */
  sessionId: '',       // unique per page load
  sessionStartTs: Date.now(),
  sessionTaps: 0,
  tapStreak: 0,

  /* ── Tap batching (no per-tap DB writes) ── */
  pendingTaps: 0,        // taps not yet flushed
  pendingCoins: 0,        // coins not yet flushed
  pendingXp: 0,        // xp not yet flushed
  lastFlushTs: 0,        // timestamp of last successful flush

  /* ── Ad tracking ── */
  lastAdTs: 0,
  adDailyCount: 0,
  adDailyDate: '',
  adSessionCount: 0,
  adSessionIds: new Set(),

  /* ── Anti-cheat ── */
  tapTimestamps: [],       // ring buffer for rate limiting
  riskScore: 0,
  riskStatus: 'ok',     // ok | watch | review | suspended
  lastSuspiciousEvent: null,

  /* ── Cached game data ── */
  missions: [],
  achievements: [],
  leaderboard: [],
  myRank: null,     // { rank, nearby: [] }
  transactions: [],

  /* ── App state ── */
  initialized: false,
  isOffline: false,
  networkRetries: 0,

  /* ── Performance ── */
  perfMode: PERF.mode,   // 'low' | 'med' | 'high'

  /* ── Optimistic UI flags ── */
  optimisticCoins: 0,   // visual-only delta not yet server-confirmed
};

/* ─────────────────────────────────────────────────────────
   syncState — merges a Firestore user document into STATE.
   Called after loadOrCreatePlayer() and reloadPlayer().
───────────────────────────────────────────────────────── */
function syncState(data) {
  if (!data) return;

  /* Core numeric fields */
  STATE.coins = data.coins ?? DEFAULT_ECONOMY.startingCoins;
  STATE.energy = data.energy ?? DEFAULT_ECONOMY.startingEnergy;
  STATE.maxEnergy = data.maxEnergy ?? DEFAULT_ECONOMY.startingEnergy;
  STATE.level = data.level ?? DEFAULT_ECONOMY.startingLevel;
  STATE.xp = data.xp ?? DEFAULT_ECONOMY.startingXp;
  STATE.tapPower = data.tapPower ?? tapPowerForLevel(STATE.level);
  STATE.criticalChance = data.criticalChance ?? DEFAULT_ECONOMY.criticalChanceBase;

  STATE.totalTaps = data.totalTaps ?? 0;
  STATE.totalAdViews = data.totalAdViews ?? 0;
  STATE.boostMultiplier = data.boostMultiplier ?? 1;
  STATE.boostExpiry = data.boostExpiry ?? 0;
  STATE.pendingWithdrawal = data.pendingWithdrawal ?? false;

  /* Timestamps */
  STATE.lastActiveTs = data.lastActiveTs ?? 0;
  /* lastEnergyUpdate: prefer server value but fall back gracefully */
  STATE.lastEnergyUpdate = data.lastEnergyUpdate ?? Date.now();

  /* Ad tracking */
  STATE.lastAdTs = data.lastAdTs ?? 0;
  STATE.adDailyCount = data.adDailyCount ?? 0;
  STATE.adDailyDate = data.adDailyDate ?? '';

  /* Risk */
  STATE.riskScore = data.riskScore ?? 0;
  STATE.riskStatus = data.riskStatus ?? 'ok';
  STATE.lastSuspiciousEvent = data.lastSuspiciousEvent ?? null;

  /* Best combo */
  STATE.bestCombo = data.bestCombo ?? 0;

  /* Revenue estimates */
  STATE.estimatedAdRevenue = data.estimatedAdRevenue ?? 0;
  STATE.rewardLiability = data.rewardLiability ?? 0;
  STATE.eligibleWithdrawal = data.eligibleWithdrawal ?? 0;

  /* Reset daily ad count when the calendar day changes */
  const today = new Date().toDateString();
  if (STATE.adDailyDate !== today) {
    STATE.adDailyCount = 0;
    STATE.adDailyDate = today;
  }

  /* Clear expired boost */
  if (STATE.boostExpiry && Date.now() > STATE.boostExpiry) {
    STATE.boostMultiplier = 1;
    STATE.boostExpiry = 0;
  }

  /* Admin check */
  STATE.isAdmin = ADMIN_TELEGRAM_ID !== 0 &&
    Number(STATE.tgUser?.id) === ADMIN_TELEGRAM_ID;

  /* Reset pending counters — server is now the source of truth */
  STATE.pendingTaps = 0;
  STATE.pendingCoins = 0;
  STATE.pendingXp = 0;
  STATE.optimisticCoins = 0;
}

/* ─────────────────────────────────────────────────────────
   generateSessionId — called once at app init
───────────────────────────────────────────────────────── */
function generateSessionId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
