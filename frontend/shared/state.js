// ==========================================================================
// UNIFIED LEVEL-BASED GOAL & XP SYSTEM ENGINE (Single Source of Truth)
// Levels 1 to 100 configured via Firebase (/levels_config) and Admin Portal
// ==========================================================================

// Deterministic baseline level configuration generator
function generateDefaultLevelConfig(lvl) {
  const l = Math.max(1, parseInt(lvl, 10) || 1);
  let cards = 20;
  let keys = 50;
  let tickets = 35;
  if (l > 1) {
    cards = 20 + (l - 1) * 6 + (((l - 1) * 11) % 15);
    keys = 50 + (l - 1) * 9 + (((l - 1) * 17) % 20);
    tickets = 35 + (l - 1) * 7 + (((l - 1) * 13) % 18);
  }
  const xpRequired = l * 1000;
  let rewardQty = 1;
  if (l > 75) rewardQty = 5;
  else if (l > 50) rewardQty = 4;
  else if (l > 25) rewardQty = 3;
  else if (l > 10) rewardQty = 2;

  return {
    level: l,
    name: `Level ${l}`,
    isLocked: false,
    xpRequired: xpRequired,
    targets: {
      cards: cards,
      keys: keys,
      tickets: tickets
    },
    rewards: {
      coins: l * 25,
      xpBonus: l * 10,
      cards: rewardQty,
      keys: rewardQty,
      tickets: rewardQty,
      fuel: 5
    }
  };
}

// Authoritative Level Configuration accessor (Firebase / Backend API is Source of Truth)
function getLevelConfig(lvl) {
  const l = Math.max(1, parseInt(lvl, 10) || 1);
  const def = generateDefaultLevelConfig(l);

  if (typeof gameState !== 'undefined' && gameState.levelsConfig && gameState.levelsConfig[l]) {
    const cfg = gameState.levelsConfig[l];
    const targets = cfg.targets || {};
    const rewards = cfg.rewards || {};

    return {
      level: l,
      name: cfg.name || def.name,
      isLocked: !!cfg.isLocked,
      xpRequired: Number(cfg.xpRequired !== undefined ? cfg.xpRequired : (cfg.xpToNextLevel || def.xpRequired)),
      targets: {
        cards: Number(targets.cards !== undefined ? targets.cards : def.targets.cards),
        keys: Number(targets.keys !== undefined ? targets.keys : def.targets.keys),
        tickets: Number(targets.tickets !== undefined ? targets.tickets : def.targets.tickets)
      },
      rewards: {
        coins: Number(rewards.coins !== undefined ? rewards.coins : def.rewards.coins),
        xpBonus: Number(rewards.xpBonus !== undefined ? rewards.xpBonus : def.rewards.xpBonus),
        cards: Number(rewards.cards !== undefined ? rewards.cards : def.rewards.cards),
        keys: Number(rewards.keys !== undefined ? rewards.keys : def.rewards.keys),
        tickets: Number(rewards.tickets !== undefined ? rewards.tickets : def.rewards.tickets),
        fuel: Number(rewards.fuel !== undefined ? rewards.fuel : def.rewards.fuel)
      }
    };
  }

  return def;
}

// XP Threshold Calculator: directly uses Level Configuration
function getLevelRequiredXP(lvl) {
  return getLevelConfig(lvl).xpRequired;
}

// Level Lock / Unlock Status verification
function isLevelUnlocked(lvl) {
  const l = Math.max(1, parseInt(lvl, 10) || 1);
  const cfg = getLevelConfig(l);

  // 1. Admin Lock Check: If Admin set isLocked = true, level is locked for everyone
  if (cfg.isLocked) return false;

  // 2. Level 1 is always unlocked if not Admin locked
  if (l === 1) return true;

  // 3. Level N requires Level N-1 to be completed
  const completed = (typeof gameState !== 'undefined' && gameState.progression && gameState.progression.completedLevels)
    ? gameState.progression.completedLevels
    : {};
  return !!completed[l - 1];
}

function isLevelCompleted(lvl) {
  const l = Math.max(1, parseInt(lvl, 10) || 1);
  const completed = (typeof gameState !== 'undefined' && gameState.progression && gameState.progression.completedLevels)
    ? gameState.progression.completedLevels
    : {};
  return !!completed[l];
}

function getActiveLevel() {
  if (typeof gameState !== 'undefined' && gameState.progression && gameState.progression.activeLevel) {
    return Math.max(1, parseInt(gameState.progression.activeLevel, 10) || 1);
  }
  return 1;
}

// Global Exports
window.generateDefaultLevelConfig = generateDefaultLevelConfig;
window.getLevelConfig = getLevelConfig;
window.getLevelRequiredXP = getLevelRequiredXP;
window.isLevelUnlocked = isLevelUnlocked;
window.isLevelCompleted = isLevelCompleted;
window.getActiveLevel = getActiveLevel;

// Combo Multiplier Calculator
function getComboMultiplier(tapCount) {
  if (tapCount >= 500) return 3.0;
  if (tapCount >= 250) return 2.5;
  if (tapCount >= 150) return 2.0;
  if (tapCount >= 75) return 1.7;
  if (tapCount >= 50) return 1.5;
  if (tapCount >= 30) return 1.3;
  if (tapCount >= 10) return 1.0;
  return 1.0;
}

// Global Reset Epoch Versioning (Guarantees fresh 0 balance & level 1 for all users)
const GAME_RESET_VERSION = 7;
const GLOBAL_RESET_TIMESTAMP = 1773510000000;
window.GAME_RESET_VERSION = GAME_RESET_VERSION;
window.GLOBAL_RESET_TIMESTAMP = GLOBAL_RESET_TIMESTAMP;

// Authoritative Game State Definition
const gameState = {
  currentTab: 'home', // 'home' | 'energy' | 'tasks' | 'profile' | 'xp' | 'wallet' | 'goal'
  taskSubtab: 'daily', // 'daily' | 'telegram' | 'website'
  levelsConfig: {}, // Live cache from Firebase /levels_config (Source of Truth)
  progression: {
    activeLevel: 1, // Current active level (1, 2, 3...)
    completedLevels: {}, // { 1: true, 2: true, ... }
    levelProgress: {
      cards: 0,
      keys: 0,
      tickets: 0
    },
    levelXp: 0 // Current XP accumulated within the active level
  },
  bank: {
    blueCoins: 0, // Accumulated Blue Coins from taps in the Big Bank
    fullWithdrawalPassEndTime: 0 // If active (> Date.now()), full auto-withdrawal pass for 24h
  },
  tasksState: {
    claimedDaily: {},
    claimedTelegram: {},
    claimedWebsite: {},
    claimedMonthly: {},
    failedWebsite: {},
    openedWebsite: {}
  },
  player: {
    name: 'Alex Vance',
    handle: 'alex_blue',
    profileCode: '',
    telegram: '',
    mobile: '',
    email: '',
    emailVerified: false,
    tier: 'BRONZE',
    level: 1,
    maxLevel: 100,
    coins: 0,
    blueCoins: 0,
    diamonds: 0,
    xp: 0,
    xpToNextLevel: 1000,
    streakDays: 0,
    lastStreakClaimTime: 0,
    chestKeys: 0,
    chestTickets: 0,
    scratchCards: 0,
    eggs: 0,
    adsWatchedCount: 0,
    websiteTasksCompleted: 0
  },
  goal: {
    level: 1,
    currentCoins: 0,
    targetCoins: 85,
    currentKeys: 0,
    targetKeys: 71,
    currentTickets: 0,
    targetTickets: 49,
  },
  reactor: {
    tapPower: 1,
    currentEnergy: 0,
    maxEnergy: 1000,
    energyTaps: 0,
    comboMultiplier: 1.0,
    comboTaps: 0,
    comboDecayInterval: null,
    profit2xEndTime: 0, // 3-Hour *2 Profit Boost
    fastXpEndTime: 0,   // 10-Minute Fast XP Surge (+1 XP per tap)
    fastXpAdsWatched: 0 // Progress towards 5 ads
  },
  energyGenerator: {
    epTotal: 0,
    remainingSeconds: 0,
    ratePerSec: 0.01,
    ratePerMin: 0.01,
    isActive: false,
    timerInterval: null,
    lastTickTime: Date.now(),
    lastSavedTime: Date.now(),
    fuelCells: {
      green: 0,
      darkgreen: 0,
      yellow: 0,
      orange: 0,
      red: 0,
      pink: 0,
      purple: 0
    },
    consumed: {
      green: 0,
      darkgreen: 0,
      yellow: 0,
      orange: 0,
      red: 0,
      pink: 0,
      purple: 0
    },
    boosts: {
      pink: {
        activeRemainingSeconds: 0,
        cooldownRemainingSeconds: 0,
        adsWatched: 0,
        multiplier: 2
      },
      purple: {
        activeRemainingSeconds: 0,
        cooldownRemainingSeconds: 0,
        adsWatched: 0,
        multiplier: 5
      }
    }
  },
  xpState: {
    currentSubtab: 'mega', // 'mega' | 'levels'
    watchedAds: 0,
    claimedLevels: {},
    megaRewardClaimed: false,
    seasonEndMs: Date.now() + 30 * 24 * 3600 * 1000
  },
  goalState: {
    currentSubtab: 'mega', // 'mega' | 'goals'
    currentLevel: 0,
    levelProgress: {
      cards: 0,
      keys: 0,
      tickets: 0
    },
    levelAdsWatched: 0, // 0 to 3 ads
    claimedGoals: {},
    megaWatchedAds: 0, // 0 to 1000 ads
    megaRewardClaimed: false,
    grandChestClaimed: false,
    seasonEndMs: Date.now() + 30 * 24 * 3600 * 1000
  },
  settings: {
    soundEnabled: true,
    autoBotEnabled: false,
  },
  dailyStats: {
    spins: 0,
    chests: 0,
    scratches: 0,
    eggs: 0,
    taps: 0,
    fuel_green: 0,
    fuel_yellow: 0,
    fuel_orange: 0,
    fuel_red: 0,
    fuel_pink: 0,
    fuel_purple: 0,
    fuel_darkgreen: 0,
    date: new Date().toDateString(),
    resetTimestamp: Date.now()
  },
  autoBotInterval: null,
};

// LocalStorage Key (Bumped to V6 for Global Fresh Zero Restart)
const STORAGE_KEY = 'ENERGY_TAP_REACTOR_SAVE_V6';

// Load & Save
function loadSavedGame() {
  // Purge legacy saves to guarantee fresh zero start for all users
  try {
    localStorage.removeItem('ENERGY_TAP_REACTOR_SAVE_V1');
    localStorage.removeItem('ENERGY_TAP_REACTOR_SAVE_V2');
    localStorage.removeItem('ENERGY_TAP_REACTOR_SAVE_V3');
    localStorage.removeItem('ENERGY_TAP_REACTOR_SAVE_V4');
    localStorage.removeItem('ENERGY_TAP_REACTOR_SAVE_V5');
  } catch (e) {}

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);

      // Verify reset version & timestamp to guarantee fresh 0 restart
      if (!parsed.resetVersion || parsed.resetVersion < GAME_RESET_VERSION || (parsed.updatedAt || 0) < GLOBAL_RESET_TIMESTAMP) {
        console.log('🔄 Older save data detected before Global Zero Reset. Initializing fresh 0 state.');
        resetAllDataToZero();
        return;
      }

      Object.assign(gameState.player, parsed.player || {});
      Object.assign(gameState.goal, parsed.goal || {});
      Object.assign(gameState.reactor, parsed.reactor || {});
      if (parsed.progression) gameState.progression = Object.assign(gameState.progression, parsed.progression);
      if (parsed.bank) gameState.bank = Object.assign(gameState.bank, parsed.bank);
      if (parsed.levelsConfig) gameState.levelsConfig = Object.assign(gameState.levelsConfig, parsed.levelsConfig);
      if (parsed.energyGenerator) Object.assign(gameState.energyGenerator, parsed.energyGenerator);
      if (parsed.tasksState) Object.assign(gameState.tasksState, parsed.tasksState);
      if (parsed.xpState) Object.assign(gameState.xpState, parsed.xpState);
      if (parsed.goalState) Object.assign(gameState.goalState, parsed.goalState);
      if (parsed.dailyStats) {
        gameState.dailyStats = Object.assign({
          spins: 0,
          chests: 0,
          scratches: 0,
          eggs: 0,
          taps: 0,
          fuel_green: 0,
          fuel_yellow: 0,
          fuel_orange: 0,
          fuel_red: 0,
          fuel_pink: 0,
          fuel_purple: 0,
          fuel_darkgreen: 0,
          date: new Date().toDateString(),
          resetTimestamp: Date.now()
        }, parsed.dailyStats);
      }
      checkDailyStatsDate();

      // Ensure authoritative progression state
      if (!gameState.progression) {
        gameState.progression = {
          activeLevel: Math.max(1, gameState.player.level || (gameState.goalState && gameState.goalState.currentLevel) || 1),
          completedLevels: {},
          levelProgress: { cards: 0, keys: 0, tickets: 0 },
          levelXp: 0
        };
      }
      if (gameState.progression.activeLevel < 1) gameState.progression.activeLevel = 1;
      if (!gameState.bank) {
        gameState.bank = { blueCoins: 0, fullWithdrawalPassEndTime: 0 };
      }

      // Synchronize all legacy level pointers to authoritative activeLevel
      const activeLvl = gameState.progression.activeLevel;
      gameState.player.level = activeLvl;
      gameState.goal.level = activeLvl;
      if (gameState.goalState) gameState.goalState.currentLevel = activeLvl;

      if (gameState.player.diamonds === undefined) gameState.player.diamonds = 0;
      if (gameState.player.blueCoins === undefined) gameState.player.blueCoins = 0;

      // Ensure goalState defaults
      if (!gameState.goalState.levelProgress) {
        gameState.goalState.levelProgress = { cards: 0, keys: 0, tickets: 0 };
      }
      if (gameState.goalState.levelAdsWatched === undefined) {
        gameState.goalState.levelAdsWatched = 0;
      }

      // Ensure proper XP curve initialization from level config
      const activeCfg = getLevelConfig(activeLvl);
      gameState.player.xpToNextLevel = activeCfg.xpRequired;
      if (gameState.player.eggs === undefined) {
        gameState.player.eggs = 0;
      }
      if (gameState.player.scratchCards === undefined) {
        gameState.player.scratchCards = 0;
      }
      if (gameState.reactor.currentEnergy === undefined) {
        gameState.reactor.currentEnergy = 0;
        gameState.reactor.maxEnergy = 1000;
      }

      // Ensure energyGenerator defaults for Dark Green, Pink and Purple fuels & boosts
      if (!gameState.energyGenerator.fuelCells) {
        gameState.energyGenerator.fuelCells = { green: 0, darkgreen: 0, yellow: 0, orange: 0, red: 0, pink: 0, purple: 0 };
      } else {
        if (gameState.energyGenerator.fuelCells.darkgreen === undefined) gameState.energyGenerator.fuelCells.darkgreen = 0;
        if (gameState.energyGenerator.fuelCells.pink === undefined) gameState.energyGenerator.fuelCells.pink = 0;
        if (gameState.energyGenerator.fuelCells.purple === undefined) gameState.energyGenerator.fuelCells.purple = 0;
      }
      if (!gameState.energyGenerator.consumed) {
        gameState.energyGenerator.consumed = { green: 0, darkgreen: 0, yellow: 0, orange: 0, red: 0, pink: 0, purple: 0 };
      } else {
        if (gameState.energyGenerator.consumed.darkgreen === undefined) gameState.energyGenerator.consumed.darkgreen = 0;
        if (gameState.energyGenerator.consumed.pink === undefined) gameState.energyGenerator.consumed.pink = 0;
        if (gameState.energyGenerator.consumed.purple === undefined) gameState.energyGenerator.consumed.purple = 0;
      }
      if (!gameState.energyGenerator.boosts) {
        gameState.energyGenerator.boosts = {
          pink: { activeRemainingSeconds: 0, cooldownRemainingSeconds: 0, adsWatched: 0, multiplier: 2 },
          purple: { activeRemainingSeconds: 0, cooldownRemainingSeconds: 0, adsWatched: 0, multiplier: 5 }
        };
      } else {
        if (!gameState.energyGenerator.boosts.pink) {
          gameState.energyGenerator.boosts.pink = { activeRemainingSeconds: 0, cooldownRemainingSeconds: 0, adsWatched: 0, multiplier: 2 };
        }
        if (!gameState.energyGenerator.boosts.purple) {
          gameState.energyGenerator.boosts.purple = { activeRemainingSeconds: 0, cooldownRemainingSeconds: 0, adsWatched: 0, multiplier: 5 };
        }
      }
      if (!gameState.energyGenerator.lastTickTime) {
        gameState.energyGenerator.lastTickTime = Date.now();
      }

      // Ensure tasksState has all subtabs initialized
      if (!gameState.tasksState) {
        gameState.tasksState = { claimedDaily: {}, claimedTelegram: {}, claimedWebsite: {}, claimedMonthly: {}, failedWebsite: {}, openedWebsite: {} };
      } else {
        if (!gameState.tasksState.claimedDaily) gameState.tasksState.claimedDaily = {};
        if (!gameState.tasksState.claimedTelegram) gameState.tasksState.claimedTelegram = {};
        if (!gameState.tasksState.claimedWebsite) gameState.tasksState.claimedWebsite = {};
        if (!gameState.tasksState.claimedMonthly) gameState.tasksState.claimedMonthly = {};
        if (!gameState.tasksState.failedWebsite) gameState.tasksState.failedWebsite = {};
        if (!gameState.tasksState.openedWebsite) gameState.tasksState.openedWebsite = {};
      }

      // Check and process offline EP generator progression from saved state
      if (typeof processEnergyGeneratorOfflineCatchup === 'function') {
        processEnergyGeneratorOfflineCatchup(gameState.energyGenerator.lastTickTime, 'localStorage');
      }
    } catch (e) {
      console.warn('Failed to load saved state, using default restart', e);
      resetAllDataToZero();
    }
  } else {
    // Initial zero baseline save
    resetAllDataToZero();
  }
}

// Reset Game State to Fresh Starting Slate Across Balances, Levels & Event Timers
function resetAllDataToZero() {
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  try {
    localStorage.removeItem('ENERGY_TAP_REACTOR_SAVE_V1');
    localStorage.removeItem('ENERGY_TAP_REACTOR_SAVE_V2');
    localStorage.removeItem('ENERGY_TAP_REACTOR_SAVE_V3');
    localStorage.removeItem('ENERGY_TAP_REACTOR_SAVE_V4');
    localStorage.removeItem('ENERGY_TAP_REACTOR_SAVE_V5');
    localStorage.removeItem('ENERGY_TAP_REACTOR_SAVE_V6');
    localStorage.removeItem('ENERGY_TAP_FIREBASE_LOCAL_UID');
    localStorage.removeItem('ENERGY_TAP_FIREBASE_LOCAL_UID_V5');
  } catch(e) {}
  
  // 1. Reset progression & player balances to Level 1
  gameState.progression = {
    activeLevel: 1,
    completedLevels: {},
    levelProgress: { cards: 0, keys: 0, tickets: 0 },
    levelXp: 0
  };
  gameState.bank = {
    blueCoins: 0,
    fullWithdrawalPassEndTime: 0
  };

  gameState.player.level = 1;
  gameState.player.coins = 0;
  gameState.player.blueCoins = 0;
  gameState.player.diamonds = 0;
  gameState.player.xp = 0;
  gameState.player.xpToNextLevel = getLevelRequiredXP(1);
  gameState.player.streakDays = 0;
  gameState.player.lastStreakClaimTime = 0;
  gameState.player.chestKeys = 0;
  gameState.player.chestTickets = 0;
  gameState.player.scratchCards = 0;
  gameState.player.eggs = 0;
  gameState.player.adsWatchedCount = 0;
  gameState.player.websiteTasksCompleted = 0;

  // 2. Reset Goal page level & mission items to start Level 1
  gameState.goal.level = 1;
  gameState.goal.currentCoins = 0;
  gameState.goal.targetCoins = 85;
  gameState.goal.currentKeys = 0;
  gameState.goal.targetKeys = 71;
  gameState.goal.currentTickets = 0;
  gameState.goal.targetTickets = 49;

  gameState.goalState.currentSubtab = 'mega';
  gameState.goalState.currentLevel = 1;
  gameState.goalState.levelProgress = { cards: 0, keys: 0, tickets: 0 };
  gameState.goalState.levelAdsWatched = 0;
  gameState.goalState.claimedGoals = {};
  gameState.goalState.megaWatchedAds = 0;
  gameState.goalState.megaRewardClaimed = false;
  gameState.goalState.grandChestClaimed = false;
  gameState.goalState.seasonEndMs = now + thirtyDaysMs;

  // 3. Reset Reactor & Generator Energy to 0
  gameState.reactor.tapPower = 1;
  gameState.reactor.currentEnergy = 0;
  gameState.reactor.maxEnergy = 1000;
  gameState.reactor.energyTaps = 0;
  gameState.reactor.comboTaps = 0;
  gameState.reactor.comboMultiplier = 1.0;

  gameState.energyGenerator.epTotal = 0;
  gameState.energyGenerator.remainingSeconds = 0;
  gameState.energyGenerator.isActive = false;
  gameState.energyGenerator.lastTickTime = now;
  gameState.energyGenerator.lastSavedTime = now;
  gameState.energyGenerator.fuelCells = { green: 0, darkgreen: 0, yellow: 0, orange: 0, red: 0, pink: 0, purple: 0 };
  gameState.energyGenerator.consumed = { green: 0, darkgreen: 0, yellow: 0, orange: 0, red: 0, pink: 0, purple: 0 };
  gameState.energyGenerator.boosts = {
    pink: { activeRemainingSeconds: 0, cooldownRemainingSeconds: 0, adsWatched: 0, multiplier: 2 },
    purple: { activeRemainingSeconds: 0, cooldownRemainingSeconds: 0, adsWatched: 0, multiplier: 5 }
  };

  // 4. Reset Tasks & XP Level rewards to start 0
  gameState.tasksState = {
    claimedDaily: {},
    claimedTelegram: {},
    claimedWebsite: {},
    claimedMonthly: {},
    failedWebsite: {},
    openedWebsite: {}
  };

  gameState.xpState.currentSubtab = 'mega';
  gameState.xpState.watchedAds = 0;
  gameState.xpState.claimedLevels = {};
  gameState.xpState.megaRewardClaimed = false;
  gameState.xpState.seasonEndMs = now + thirtyDaysMs;

  // 5. Reset Daily Stats & Event Timers
  gameState.dailyStats = {
    spins: 0,
    chests: 0,
    scratches: 0,
    eggs: 0,
    taps: 0,
    fuel_green: 0,
    fuel_yellow: 0,
    fuel_orange: 0,
    fuel_red: 0,
    fuel_pink: 0,
    fuel_purple: 0,
    fuel_darkgreen: 0,
    date: new Date().toDateString(),
    resetTimestamp: now
  };

  if (gameState.monthlyCompetition) {
    gameState.monthlyCompetition.startTime = now;
    gameState.monthlyCompetition.endTime = now + thirtyDaysMs;
    gameState.monthlyCompetition.forceResetTimestamp = now;
  }

  // Save to persistent storage with reset epoch version
  saveGame();

  // Cloud sync to Firebase
  if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
    window.firebaseSync.saveToCloudImmediate();
  }
  if (window.firebaseSync && typeof window.firebaseSync.updateLeaderboardEntry === 'function') {
    window.firebaseSync.updateLeaderboardEntry();
  }

  // Re-render UI components to show clean Level 0 and zero balances
  if (typeof updateUI === 'function') updateUI();
  if (typeof updateAllUI === 'function') updateAllUI();
  if (typeof renderLevelsList === 'function') renderLevelsList();
  if (typeof renderGoalsList === 'function') renderGoalsList();
  if (typeof renderTasksList === 'function') renderTasksList();
  if (typeof formatTimerDisplay === 'function') formatTimerDisplay();
  if (typeof updateMonthlyCompetitionTimer === 'function') updateMonthlyCompetitionTimer();

  console.log('✅ Full Zero Reset Completed: All balances, XP, Goal levels, and Event Timers set to fresh Level 0 start.');
}

window.resetAllDataToZero = resetAllDataToZero;

// 30-Day Monthly Task Competition Cycle & Stats Reset
const MONTHLY_RESET_CYCLE_MS = 30 * 24 * 60 * 60 * 1000;
const DAILY_RESET_CYCLE_MS = MONTHLY_RESET_CYCLE_MS; // Backwards compatibility alias

function checkDailyStatsDate() {
  const now = Date.now();
  const today = new Date().toDateString();

  if (!gameState.dailyStats) {
    gameState.dailyStats = {
      spins: 0,
      chests: 0,
      scratches: 0,
      eggs: 0,
      taps: 0,
      fuel_green: 0,
      fuel_yellow: 0,
      fuel_orange: 0,
      fuel_red: 0,
      fuel_pink: 0,
      fuel_purple: 0,
      fuel_darkgreen: 0,
      date: today,
      resetTimestamp: now
    };
  }

  // Ensure individual properties exist
  if (gameState.dailyStats.resetTimestamp === undefined) gameState.dailyStats.resetTimestamp = now;
  if (gameState.dailyStats.taps === undefined) gameState.dailyStats.taps = 0;
  if (gameState.dailyStats.fuel_green === undefined) gameState.dailyStats.fuel_green = 0;
  if (gameState.dailyStats.fuel_yellow === undefined) gameState.dailyStats.fuel_yellow = 0;
  if (gameState.dailyStats.fuel_orange === undefined) gameState.dailyStats.fuel_orange = 0;
  if (gameState.dailyStats.fuel_red === undefined) gameState.dailyStats.fuel_red = 0;
  if (gameState.dailyStats.fuel_pink === undefined) gameState.dailyStats.fuel_pink = 0;
  if (gameState.dailyStats.fuel_purple === undefined) gameState.dailyStats.fuel_purple = 0;
  if (gameState.dailyStats.fuel_darkgreen === undefined) gameState.dailyStats.fuel_darkgreen = 0;

  const compEndTime = (gameState.monthlyCompetition && gameState.monthlyCompetition.endTime) || null;
  const isExpiredByFirebase = compEndTime ? (now >= compEndTime) : false;
  const elapsed = now - (gameState.dailyStats.resetTimestamp || now);
  const isExpiredByLocal = elapsed >= MONTHLY_RESET_CYCLE_MS;

  // Auto-reset when 30-day competition cycle has elapsed
  if (isExpiredByFirebase || isExpiredByLocal) {
    gameState.dailyStats.spins = 0;
    gameState.dailyStats.chests = 0;
    gameState.dailyStats.scratches = 0;
    gameState.dailyStats.eggs = 0;
    gameState.dailyStats.taps = 0;
    gameState.dailyStats.fuel_green = 0;
    gameState.dailyStats.fuel_yellow = 0;
    gameState.dailyStats.fuel_orange = 0;
    gameState.dailyStats.fuel_red = 0;
    gameState.dailyStats.fuel_pink = 0;
    gameState.dailyStats.fuel_purple = 0;
    gameState.dailyStats.fuel_darkgreen = 0;
    gameState.dailyStats.date = today;
    gameState.dailyStats.resetTimestamp = now;

    // Reset all claimed monthly tasks so user can restart and redo them
    if (!gameState.tasksState) {
      gameState.tasksState = { claimedDaily: {}, claimedTelegram: {}, claimedWebsite: {} };
    }
    gameState.tasksState.claimedDaily = {};
    if (gameState.tasksState.claimedMonthly) {
      gameState.tasksState.claimedMonthly = {};
    }

    saveGame();
    if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
      window.firebaseSync.saveToCloudImmediate();
    }
    if (typeof renderTasksList === 'function') {
      renderTasksList();
    }
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('🔄 30-Day Monthly Quests reset! New competition cycle started.');
    }
  }

  // Also check season expiration for XP Level rewards & Goal Level rewards
  checkSeasonExpiration();
}
window.checkDailyStatsDate = checkDailyStatsDate;

// Season Expiration & Level Reward Restoration Logic (Per-User Individual Execution)
function checkSeasonExpiration() {
  const now = Date.now();
  let needSave = false;

  // XP Page Season Check: Run for individual player
  if (gameState.xpState) {
    if (!gameState.xpState.seasonEndMs || now >= gameState.xpState.seasonEndMs) {
      // Re-fix and restore claimed levels so user can climb levels and claim new rewards
      gameState.xpState.claimedLevels = {};
      gameState.xpState.watchedAds = 0;
      gameState.xpState.megaRewardClaimed = false;
      gameState.xpState.seasonEndMs = now + (30 * 24 * 60 * 60 * 1000);

      // Restore player level to 0 and reset XP so the user starts fresh and climbs new levels level-wise!
      if (gameState.player) {
        gameState.player.level = 0;
        gameState.player.xp = 0;
        gameState.player.xpToNextLevel = 1000;
      }
      needSave = true;
      console.log('🔄 XP Season restarted: Level rewards restored and new 30-day season initialized for user!');
    }
  }

  // Goal Page Season Check: Run for individual player
  if (gameState.goalState) {
    if (!gameState.goalState.seasonEndMs || now >= gameState.goalState.seasonEndMs) {
      // Re-fix and restore claimed goals and level progress so user can progress level-wise anew
      gameState.goalState.claimedGoals = {};
      gameState.goalState.currentLevel = 0;
      gameState.goalState.levelProgress = { cards: 0, keys: 0, tickets: 0 };
      gameState.goalState.levelAdsWatched = 0;
      gameState.goalState.megaWatchedAds = 0;
      gameState.goalState.megaRewardClaimed = false;
      gameState.goalState.grandChestClaimed = false;
      gameState.goalState.seasonEndMs = now + (30 * 24 * 60 * 60 * 1000);
      if (gameState.goal) {
        gameState.goal.level = 0;
        gameState.goal.currentCoins = 0;
        gameState.goal.currentKeys = 0;
        gameState.goal.currentTickets = 0;
      }
      needSave = true;
      console.log('🔄 Goal Season restarted: Goal levels and claim data restored for new 30-day season for user!');
    }
  }

  if (needSave) {
    saveGame();
    if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
      window.firebaseSync.saveToCloudImmediate();
    }
    if (typeof updateUI === 'function') updateUI();
    if (typeof renderLevelsList === 'function') renderLevelsList();
    if (typeof renderGoalsList === 'function') renderGoalsList();
  }
}
window.checkSeasonExpiration = checkSeasonExpiration;

function saveGame() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    resetVersion: GAME_RESET_VERSION,
    updatedAt: Date.now(),
    progression: gameState.progression,
    bank: gameState.bank,
    levelsConfig: gameState.levelsConfig,
    player: gameState.player,
    goal: gameState.goal,
    reactor: {
      tapPower: gameState.reactor.tapPower,
      currentEnergy: Number((gameState.reactor.currentEnergy || 0).toFixed(2)),
      maxEnergy: gameState.reactor.maxEnergy,
      energyTaps: gameState.reactor.energyTaps,
      comboTaps: gameState.reactor.comboTaps,
      comboMultiplier: gameState.reactor.comboMultiplier,
      profit2xEndTime: gameState.reactor.profit2xEndTime || 0,
      fastXpEndTime: gameState.reactor.fastXpEndTime || 0,
      fastXpAdsWatched: gameState.reactor.fastXpAdsWatched || 0
    },
    energyGenerator: {
      epTotal: Number((gameState.energyGenerator.epTotal || 0).toFixed(2)),
      remainingSeconds: Math.max(0, Math.floor(gameState.energyGenerator.remainingSeconds || 0)),
      ratePerSec: gameState.energyGenerator.ratePerSec || gameState.energyGenerator.ratePerMin || 0.01,
      ratePerMin: gameState.energyGenerator.ratePerSec || gameState.energyGenerator.ratePerMin || 0.01,
      lastTickTime: gameState.energyGenerator.lastTickTime || Date.now(),
      lastSavedTime: Date.now(),
      fuelCells: gameState.energyGenerator.fuelCells,
      consumed: gameState.energyGenerator.consumed,
      boosts: gameState.energyGenerator.boosts
    },
    tasksState: gameState.tasksState,
    xpState: gameState.xpState,
    goalState: gameState.goalState,
    dailyStats: gameState.dailyStats
  }));

  // Real-time Cloud Save to Firebase
  if (window.firebaseSync && typeof window.firebaseSync.debouncedSave === 'function') {
    window.firebaseSync.debouncedSave();
  }
}

// Level Progression Completer (Unified across Goal, XP, Home)
function canClaimActiveLevel() {
  const activeLvl = getActiveLevel();
  const cfg = getLevelConfig(activeLvl);
  if (cfg.isLocked) return false;

  const prog = (gameState.progression && gameState.progression.levelProgress) || { cards: 0, keys: 0, tickets: 0 };
  const itemsComplete = (prog.cards || 0) >= cfg.targets.cards &&
                        (prog.keys || 0) >= cfg.targets.keys &&
                        (prog.tickets || 0) >= cfg.targets.tickets;
  return itemsComplete;
}

function completeActiveLevel(targetLvl) {
  const activeLvl = getActiveLevel();
  const lvlToComplete = targetLvl || activeLvl;
  const cfg = getLevelConfig(lvlToComplete);

  // Mark current level as completed
  if (!gameState.progression) {
    gameState.progression = { activeLevel: 1, completedLevels: {}, levelProgress: { cards: 0, keys: 0, tickets: 0 }, levelXp: 0 };
  }
  if (!gameState.progression.completedLevels) {
    gameState.progression.completedLevels = {};
  }
  gameState.progression.completedLevels[lvlToComplete] = true;

  // Sync to legacy claimed maps
  if (!gameState.xpState.claimedLevels) gameState.xpState.claimedLevels = {};
  gameState.xpState.claimedLevels[lvlToComplete] = true;
  if (!gameState.goalState.claimedGoals) gameState.goalState.claimedGoals = {};
  gameState.goalState.claimedGoals[lvlToComplete] = true;

  // Award level rewards
  const rewards = cfg.rewards;
  gameState.player.coins = (gameState.player.coins || 0) + (rewards.coins || 0);
  gameState.player.xp = (gameState.player.xp || 0) + (rewards.xpBonus || 0);
  gameState.player.chestTickets = (gameState.player.chestTickets || 0) + (rewards.tickets || 0);
  gameState.player.chestKeys = (gameState.player.chestKeys || 0) + (rewards.keys || 0);
  gameState.player.scratchCards = (gameState.player.scratchCards || 0) + (rewards.cards || 0);
  if (rewards.fuel) {
    if (!gameState.energyGenerator.fuelCells) {
      gameState.energyGenerator.fuelCells = { green: 0, darkgreen: 0, yellow: 0, orange: 0, red: 0, pink: 0, purple: 0 };
    }
    gameState.energyGenerator.fuelCells.green = (gameState.energyGenerator.fuelCells.green || 0) + rewards.fuel;
  }

  // Advance to next level if available and not locked by admin
  const nextLvl = lvlToComplete + 1;
  const nextCfg = getLevelConfig(nextLvl);

  if (nextLvl <= 100) {
    gameState.progression.activeLevel = nextLvl;
    gameState.progression.levelProgress = { cards: 0, keys: 0, tickets: 0 };
    gameState.progression.levelXp = 0;

    // Sync legacy pointers
    gameState.player.level = nextLvl;
    gameState.goal.level = nextLvl;
    if (gameState.goalState) {
      gameState.goalState.currentLevel = nextLvl;
      gameState.goalState.levelProgress = { cards: 0, keys: 0, tickets: 0 };
      gameState.goalState.levelAdsWatched = 0;
    }
    gameState.player.xpToNextLevel = nextCfg.xpRequired;
  }

  if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') {
    sfx.playLevelUpSound();
  }

  // Synchronize all UI views
  if (typeof updateUI === 'function') updateUI();
  if (typeof renderGoalsList === 'function') renderGoalsList();
  if (typeof renderLevelsList === 'function') renderLevelsList();
  if (typeof updateGoalViewUI === 'function') updateGoalViewUI();
  if (typeof updateXpViewUI === 'function') updateXpViewUI();
  if (typeof updateHomeViewUI === 'function') updateHomeViewUI();

  // Save game state locally and cloud
  saveGame();
  if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
    window.firebaseSync.saveToCloudImmediate();
  }

  return { success: true, activeLevel: gameState.progression.activeLevel, rewards };
}

window.canClaimActiveLevel = canClaimActiveLevel;
window.completeActiveLevel = completeActiveLevel;

// Audio System
class SoundFX {
  constructor() {
    this.ctx = null;
    this.initContext();
  }

  initContext() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx && !this.ctx) this.ctx = new AudioCtx();
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  playTapSound(comboLevel = 1) {
    if (!gameState.settings.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    const baseFreq = 480 + (comboLevel - 1) * 75;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.6, now + 0.08);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  playLevelUpSound() {
    if (!gameState.settings.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const now = this.ctx.currentTime;
    [261.63, 329.63, 392.00, 523.25].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0.15, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.3);
    });
  }
}

const sfx = new SoundFX();

// Number & Timer Formatting Helpers
function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 10000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
}

function formatTimerDisplay() {
  const secs = gameState.energyGenerator.remainingSeconds;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  
  if (DOM.fuelTimerVal) {
    if (secs > 0) {
      DOM.fuelTimerVal.textContent = h > 0 ? `${hh}h ${mm}m` : `${mm}m ${ss}s`;
      if (DOM.energyGaugeWrapper) DOM.energyGaugeWrapper.classList.add('active-generating');
    } else {
      DOM.fuelTimerVal.textContent = '00h 00m';
      if (DOM.energyGaugeWrapper) DOM.energyGaugeWrapper.classList.remove('active-generating');
    }
  }
}

// Ambient Background Particles
function initAmbientParticles() {
  if (!DOM.ambientParticles) return;
  for (let i = 0; i < 20; i++) {
    const particle = document.createElement('div');
    particle.className = 'ambient-particle';
    const size = Math.random() * 4 + 2;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.animationDuration = `${Math.random() * 8 + 6}s`;
    particle.style.animationDelay = `${Math.random() * 5}s`;
    DOM.ambientParticles.appendChild(particle);
  }
}

// DOM References Cache
const DOM = {
  playerLevelBadge: document.getElementById('playerLevelBadge'),
  playerUsername: document.getElementById('playerUsername'),
  coinCounter: document.getElementById('coinCounter') || document.getElementById('headerCoinBalance'),
  coinPill: document.getElementById('coinPill'),
  blueCoinCounter: document.getElementById('blueCoinCounter') || document.getElementById('headerBlueBalance'),
  blueCoinPill: document.getElementById('blueCoinPill'),
  streakBtn: document.getElementById('streakBtn'),
  
  pageHome: document.getElementById('pageHome'),
  pageEnergy: document.getElementById('pageEnergy'),
  pageTasks: document.getElementById('pageTasks'),
  pageProfile: document.getElementById('pageProfile'),
  pageXP: document.getElementById('pageXP'),
  pageWallet: document.getElementById('pageWallet'),
  pageGoal: document.getElementById('pageGoal'),
  pageAdRewards: document.getElementById('pageAdRewards'),
  
  // Goal Page Elements (Levels 1 - 100 System & Mega Reward)
  goalSeasonTimer: document.getElementById('goalSeasonTimer'),
  btnToggleGoals: document.getElementById('btnToggleGoals'),
  toggleGoalsBtnText: document.getElementById('toggleGoalsBtnText'),
  subtabGoalsList: document.getElementById('subtabGoalsList'),
  subtabGoalMegaReward: document.getElementById('subtabGoalMegaReward'),
  goalMegaRewardSubView: document.getElementById('goalMegaRewardSubView'),
  goalRoadmapSubView: document.getElementById('goalRoadmapSubView'),
  goalMegaStep1Card: document.getElementById('goalMegaStep1Card'),
  goalMegaStep1Badge: document.getElementById('goalMegaStep1Badge'),
  goalMegaStep1SubText: document.getElementById('goalMegaStep1SubText'),
  goalMegaStep1Lock: document.getElementById('goalMegaStep1Lock'),
  goalMegaAdsCounterHeader: document.getElementById('goalMegaAdsCounterHeader'),
  goalMegaAdsProgressFill: document.getElementById('goalMegaAdsProgressFill'),
  goalMegaAdsRemainText: document.getElementById('goalMegaAdsRemainText'),
  goalMegaActionBtn: document.getElementById('goalMegaActionBtn'),
  goalMegaActionBtnText: document.getElementById('goalMegaActionBtnText'),
  goalMegaActionLockIcon: document.getElementById('goalMegaActionLockIcon'),
  goalsScrollList: document.getElementById('goalsScrollList'),
  
  // Reward Page Elements
  pageReward: document.getElementById('pageReward'),
  rewardCoinsBal: document.getElementById('rewardCoinsBal'),
  milestoneRewardsList: document.getElementById('milestoneRewardsList'),
  
  // XP Page Elements
  xpSeasonTimer: document.getElementById('xpSeasonTimer'),
  xpGenTimerVal: document.getElementById('xpGenTimerVal'),
  btnToggleLevels: document.getElementById('btnToggleLevels'),
  toggleLevelsBtnText: document.getElementById('toggleLevelsBtnText'),
  subtabLevelsList: document.getElementById('subtabLevelsList'),
  subtabMegaReward: document.getElementById('subtabMegaReward'),
  xpMegaRewardSubView: document.getElementById('xpMegaRewardSubView'),
  xpLevelsListSubView: document.getElementById('xpLevelsListSubView'),
  xpGeneratorTimerStatus: document.getElementById('xpGeneratorTimerStatus'),
  xpGenStatusPill: document.getElementById('xpGenStatusPill'),
  xpGenStatusText: document.getElementById('xpGenStatusText'),
  megaStep1Card: document.getElementById('megaStep1Card'),
  megaStep1Badge: document.getElementById('megaStep1Badge'),
  megaStep1SubText: document.getElementById('megaStep1SubText'),
  megaStep1Lock: document.getElementById('megaStep1Lock'),
  megaAdsCounterHeader: document.getElementById('megaAdsCounterHeader'),
  megaAdsProgressFill: document.getElementById('megaAdsProgressFill'),
  megaAdsRemainText: document.getElementById('megaAdsRemainText'),
  megaActionBtn: document.getElementById('megaActionBtn'),
  megaActionBtnText: document.getElementById('megaActionBtnText'),
  megaActionLockIcon: document.getElementById('megaActionLockIcon'),
  levelsScrollList: document.getElementById('levelsScrollList'),
  
  // Profile Elements
  profileDisplayName: document.getElementById('profileDisplayName'),
  profileHandle: document.getElementById('profileHandle'),
  profileTierBadge: document.getElementById('profileTierBadge'),
  profileCoinBalance: document.getElementById('profileCoinBalance'),
  profileStreakVal: document.getElementById('profileStreakVal'),
  profileEnergyPool: document.getElementById('profileEnergyPool'),
  
  // Tasks
  subtabDaily: document.getElementById('subtabDaily'),
  subtabTelegram: document.getElementById('subtabTelegram'),
  subtabWebsite: document.getElementById('subtabWebsite'),
  tasksListContainer: document.getElementById('tasksListContainer'),
  dailyBadgeCount: document.getElementById('dailyBadgeCount'),
  telegramBadgeCount: document.getElementById('telegramBadgeCount'),
  websiteBadgeCount: document.getElementById('websiteBadgeCount'),
  
  // Home: XP & Goals
  xpCard: document.getElementById('xpCard'),
  xpLevelNum: document.getElementById('xpLevelNum'),
  xpProgressFill: document.getElementById('xpProgressFill'),
  goalCard: document.getElementById('goalCard'),
  goalLevelNum: document.getElementById('goalLevelNum'),
  goalCoins: document.getElementById('goalCoins'),
  goalKeys: document.getElementById('goalKeys'),
  goalTickets: document.getElementById('goalTickets'),
  goalProgressFill: document.getElementById('goalProgressFill'),
  
  // Home: Reactor Orb
  comboPill: document.getElementById('comboPill'),
  comboMultiplierText: document.getElementById('comboMultiplierText'),
  reactorOrb: document.getElementById('reactorOrb'),
  orbStage: document.getElementById('orbStage'),
  energyTapCount: document.getElementById('energyTapCount'),
  
  // Energy Page
  energyGaugeWrapper: document.getElementById('energyGaugeWrapper'),
  gaugeCore: document.getElementById('gaugeCore'),
  epCounterPill: document.getElementById('epCounterPill'),
  fuelTimerVal: document.getElementById('fuelTimerVal'),
  fuelRateVal: document.getElementById('fuelRateVal'),
  greenCellCount: document.getElementById('greenCellCount'),
  darkgreenCellCount: document.getElementById('darkgreenCellCount'),
  yellowCellCount: document.getElementById('yellowCellCount'),
  orangeCellCount: document.getElementById('orangeCellCount'),
  redCellCount: document.getElementById('redCellCount'),
  pinkCellCount: document.getElementById('pinkCellCount'),
  purpleCellCount: document.getElementById('purpleCellCount'),
  btnUseGreenFuel: document.getElementById('btnUseGreenFuel'),
  btnUseDarkGreenFuel: document.getElementById('btnUseDarkGreenFuel'),
  
  // Streak & Ad Rewards Pages
  pageStreak: document.getElementById('pageStreak'),
  streakHeroTitle: document.getElementById('streakHeroTitle'),
  streakStatusText: document.getElementById('streakStatusText'),
  streakCalendarGrid: document.getElementById('streakCalendarGrid'),
  streakClaimMainBtn: document.getElementById('streakClaimMainBtn'),
  pageAdRewards: document.getElementById('pageAdRewards'),
  adCountdownBadge: document.getElementById('adCountdownBadge'),
  adRewardTitle: document.getElementById('adRewardTitle'),
  adRewardDesc: document.getElementById('adRewardDesc'),
  adProgressFill: document.getElementById('adProgressFill'),
  btnClaimAdReward: document.getElementById('btnClaimAdReward'),

  // Nav & Modals
  navButtons: document.querySelectorAll('.nav-tab-btn'),
  modalBackdrop: document.getElementById('modalBackdrop'),
  sheetTitle: document.getElementById('sheetTitle'),
  sheetContent: document.getElementById('sheetContent'),
  sheetCloseBtn: document.getElementById('sheetCloseBtn'),
  
  // Desktop
  soundToggleBtn: document.getElementById('soundToggleBtn'),
  autoTapToggleBtn: document.getElementById('autoTapToggleBtn'),
  resetDataBtn: document.getElementById('resetDataBtn'),
  ambientParticles: document.getElementById('ambientParticles')
};

if (typeof window !== 'undefined') {
  window.gameState = gameState;
  window.DOM = DOM;
  window.generateDefaultLevelConfig = generateDefaultLevelConfig;
  window.getLevelConfig = getLevelConfig;
  window.getLevelRequiredXP = getLevelRequiredXP;
  window.isLevelUnlocked = isLevelUnlocked;
  window.isLevelCompleted = isLevelCompleted;
  window.getActiveLevel = getActiveLevel;
  window.canClaimActiveLevel = canClaimActiveLevel;
  window.completeActiveLevel = completeActiveLevel;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    gameState,
    DOM,
    generateDefaultLevelConfig,
    getLevelConfig,
    getLevelRequiredXP,
    isLevelUnlocked,
    isLevelCompleted,
    getActiveLevel,
    canClaimActiveLevel,
    completeActiveLevel
  };
}

