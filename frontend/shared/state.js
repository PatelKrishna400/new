// ==========================================================================
// UNIFIED LEVEL-BASED GOAL & XP SYSTEM ENGINE (Single Source of Truth)
// Levels 1 to 100 configured via Firebase (/levels_config) and Admin Portal
// ==========================================================================

// Deterministic pseudo-random seed cache per level for natural variation (Levels 1 to 1000)
const GOAL_TARGETS_CACHE = [];

function getDeterministicGoalTargets(lvl) {
  const l = Math.max(1, Math.min(1000, parseInt(lvl, 10) || 1));
  if (GOAL_TARGETS_CACHE[l]) return GOAL_TARGETS_CACHE[l];

  if (GOAL_TARGETS_CACHE.length === 0) {
    GOAL_TARGETS_CACHE[1] = { cards: 20, keys: 50, tickets: 35 };
    for (let i = 2; i < 1000; i++) {
      const progress = (i - 1) / 999;
      // Exponential scaling from 1 to 10,000x
      const mult = Math.pow(10000, progress);

      // Deterministic fixed pseudo-random factor between -0.02 and +0.02
      const rCards = (Math.sin(i * 12.9898) * 43758.5453) % 1;
      const rKeys = (Math.sin(i * 78.233) * 43758.5453) % 1;
      const rTickets = (Math.sin(i * 45.164) * 43758.5453) % 1;

      const jCards = 1 + (Math.abs(rCards) * 0.04 - 0.02);
      const jKeys = 1 + (Math.abs(rKeys) * 0.04 - 0.02);
      const jTickets = 1 + (Math.abs(rTickets) * 0.04 - 0.02);

      let c = Math.round(20 * mult * jCards);
      let k = Math.round(50 * mult * jKeys);
      let t = Math.round(35 * mult * jTickets);

      // Ensure monotonically non-decreasing progression up to level 1000
      c = Math.max(GOAL_TARGETS_CACHE[i - 1].cards, Math.min(200000, c));
      k = Math.max(GOAL_TARGETS_CACHE[i - 1].keys, Math.min(500000, k));
      t = Math.max(GOAL_TARGETS_CACHE[i - 1].tickets, Math.min(350000, t));

      GOAL_TARGETS_CACHE[i] = { cards: c, keys: k, tickets: t };
    }
    GOAL_TARGETS_CACHE[1000] = { cards: 200000, keys: 500000, tickets: 350000 };
  }

  return GOAL_TARGETS_CACHE[l] || { cards: 20, keys: 50, tickets: 35 };
}

// Dark Green Fuel scaling formula for XP page: Level 1 = 1, Level 1000 = 200
// Progressive calculation: 100 levels / 20 steps = 5 levels per +1 fuel cell
function calculateLevelDarkGreenFuel(lvl) {
  const l = Math.max(1, parseInt(lvl, 10) || 1);
  return Math.max(1, Math.min(200, Math.ceil(l / 5)));
}

// Memoized default level configurations cache for zero-allocation O(1) returns
const DEFAULT_LEVEL_CONFIG_CACHE = [];

// Baseline level configuration generator (Levels 1 to 1000)
function generateDefaultLevelConfig(lvl) {
  const l = Math.max(1, parseInt(lvl, 10) || 1);
  if (DEFAULT_LEVEL_CONFIG_CACHE[l]) return DEFAULT_LEVEL_CONFIG_CACHE[l];

  const targets = getDeterministicGoalTargets(l);
  const xpRequired = l * 1000;
  let rewardQty = 1;
  if (l > 750) rewardQty = 30;
  else if (l > 500) rewardQty = 25;
  else if (l > 350) rewardQty = 20;
  else if (l > 200) rewardQty = 12;
  else if (l > 100) rewardQty = 8;
  else if (l > 75) rewardQty = 5;
  else if (l > 50) rewardQty = 4;
  else if (l > 25) rewardQty = 3;
  else if (l > 10) rewardQty = 2;

  const cfg = {
    level: l,
    name: `Level ${l}`,
    isLocked: false,
    xpRequired: xpRequired,
    targets: {
      cards: targets.cards,
      keys: targets.keys,
      tickets: targets.tickets
    },
    rewards: {
      coins: l * 25,
      xpBonus: l * 10,
      cards: rewardQty,
      keys: rewardQty,
      tickets: rewardQty,
      fuel: calculateLevelDarkGreenFuel(l)
    }
  };

  DEFAULT_LEVEL_CONFIG_CACHE[l] = cfg;
  return cfg;
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

// XP-Specific Level Progression Helpers (100% Decoupled from Goal Page)
function getXpActiveLevel() {
  if (typeof gameState !== 'undefined' && gameState.xpState && gameState.xpState.currentLevel) {
    return Math.max(1, parseInt(gameState.xpState.currentLevel, 10) || 1);
  }
  if (typeof gameState !== 'undefined' && gameState.xpState && gameState.xpState.claimedLevels) {
    for (let l = 1; l <= 1000; l++) {
      if (!gameState.xpState.claimedLevels[l]) return l;
    }
    return 1000;
  }
  return 1;
}

function isXpLevelUnlocked(lvl) {
  const l = Math.max(1, parseInt(lvl, 10) || 1);
  const cfg = getLevelConfig(l);
  if (cfg && cfg.isLocked) return false;
  if (l === 1) return true;
  const claimed = (typeof gameState !== 'undefined' && gameState.xpState && gameState.xpState.claimedLevels) || {};
  return !!claimed[l - 1];
}

function isXpLevelClaimed(lvl) {
  const l = Math.max(1, parseInt(lvl, 10) || 1);
  const claimed = (typeof gameState !== 'undefined' && gameState.xpState && gameState.xpState.claimedLevels) || {};
  return !!claimed[l];
}

// Global Exports
if (typeof window !== 'undefined') {
  window.getDeterministicGoalTargets = getDeterministicGoalTargets;
  window.calculateLevelDarkGreenFuel = calculateLevelDarkGreenFuel;
  window.generateDefaultLevelConfig = generateDefaultLevelConfig;
  window.getLevelConfig = getLevelConfig;
  window.getLevelRequiredXP = getLevelRequiredXP;
  window.isLevelUnlocked = isLevelUnlocked;
  window.isLevelCompleted = isLevelCompleted;
  window.getActiveLevel = getActiveLevel;
  window.getXpActiveLevel = getXpActiveLevel;
  window.isXpLevelUnlocked = isXpLevelUnlocked;
  window.isXpLevelClaimed = isXpLevelClaimed;
}

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
  piggyBank: {
    totalStored: 0,
    extensionDays: 0,
    records: []
  },
  diamondGenerator: {
    powerLevel: 1,
    speedLevel: 1,
    isRunning: false,
    cycleProgress: 0,
    generationStartTime: 0,
    status: 'ready',
    claimed: true,
    totalProduced: 0,
    powerDiscount: 0,
    speedDiscount: 0,
    lastPowerAdTime: 0,
    lastSpeedAdTime: 0,
    powerMilestoneAds: 0,
    speedMilestoneAds: 0
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
    name: 'Player',
    handle: 'player',
    profileCode: '',
    telegram: '',
    mobile: '',
    email: '',
    emailVerified: false,
    tier: 'BRONZE',
    level: 1,
    maxLevel: 1000,
    coins: 0,
    blueCoins: 0,
    diamonds: 0,
    diamondWins: 0,
    diamondWinsCount: 0,
    xp: 0,
    xpToNextLevel: 1000,
    streakDays: 0,
    lastStreakClaimTime: 0,
    chestKeys: 0,
    chestTickets: 0,
    scratchCards: 0,
    eggs: 0,
    brainCoins: 0,
    balloonCoins: 0,
    boomCoins: 0,
    sunflower: 0,
    sunflowerCoins: 0,
    waterBuckets: 0,
    shovels: 0,
    passAdCooldowns: {},
    adsWatchedCount: 0,
    websiteTasksCompleted: 0,
    status: 'active'
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
    tapMultiplier: 1,
    currentEnergy: 0,
    maxEnergy: 1000,
    energyTaps: 0,
    comboMultiplier: 1.0,
    comboTaps: 0,
    comboDecayInterval: null,
    profit2xEndTime: 0, // 3-Hour *2 Profit Boost
    fastXpEndTime: 0,   // 10-Minute Fast XP Surge (+1 XP per tap)
    fastXpAdsWatched: 0, // Progress towards 5 ads
    energyAdCooldownEndTime: 0 // 5-Hour background cooldown after watching ad for +10 energy
  },
  energyGenerator: {
    epTotal: 0,
    remainingSeconds: 0,
    darkRedRemainingSeconds: 0,
    ratePerSec: 0.001,
    ratePerMin: 0.001,
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
      darkred: 0,
      pink: 0,
      purple: 0,
      blue: 0,
      lightblue: 0
    },
    consumed: {
      green: 0,
      darkgreen: 0,
      yellow: 0,
      orange: 0,
      red: 0,
      darkred: 0,
      pink: 0,
      purple: 0,
      blue: 0,
      lightblue: 0
    },
    fuelPurchases: {
      darkred: 0,
      blue: 0,
      lightblue: 0
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
  diamondGenerator: {
    diamondsPerCycle: 0.000001,
    cycleDuration: 60.00,
    progressSeconds: 0,
    lastTickTime: Date.now(),
    totalDiamondsProduced: 0,
    productionLevel: 1,
    productionUpgradesCount: 0,
    productionBaseCost: 50,
    productionCostStep: 25,
    productionCostDiscount: 0,
    production1000DiamondDiscountUsed: false,
    productionAdDiscountsCount: 0,
    timeLevel: 1,
    timeUpgradesCount: 0,
    timeBaseCost: 10,
    timeCostStep: 50,
    timeCostDiscount: 0,
    timeAdFirstDiscountUsed: false,
    timeAdCooldownEndTime: 0,
    timeSubsequentAdDiscountsCount: 0
  },
  xpState: {
    currentSubtab: 'mega', // 'mega' | 'levels'
    currentLevel: 1,
    watchedAds: 0,
    claimedLevels: {},
    megaRewardClaimed: false,
    seasonEndMs: Date.now() + 30 * 24 * 3600 * 1000
  },
  goalState: {
    currentSubtab: 'mega', // 'mega' | 'goals'
    currentLevel: 1,
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
  spinState: {
    level: 1,
    crowns: 0,
    targetCrowns: 5,
    giftsClaimed: 0
  },
  puzzleState: {
    caughtFragments: 0,
    currentMilestoneIndex: 0,
    puzzlePieces: 0,
    tiles: [false, false, false, false, false, false, false, false, false]
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
    fuel_darkred: 0,
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
      if (parsed.diamondGenerator) {
        if (!gameState.diamondGenerator) gameState.diamondGenerator = {};
        Object.assign(gameState.diamondGenerator, parsed.diamondGenerator);
      }
      if (parsed.tasksState) Object.assign(gameState.tasksState, parsed.tasksState);
      if (parsed.xpState) Object.assign(gameState.xpState, parsed.xpState);
      if (parsed.goalState) Object.assign(gameState.goalState, parsed.goalState);
      if (parsed.spinState) {
        gameState.spinState = Object.assign({
          level: 1,
          crowns: 0,
          targetCrowns: 5,
          giftsClaimed: 0
        }, parsed.spinState);
      } else if (!gameState.spinState) {
        gameState.spinState = {
          level: 1,
          crowns: 0,
          targetCrowns: 5,
          giftsClaimed: 0
        };
      }
      if (parsed.puzzleState) {
        gameState.puzzleState = Object.assign({
          caughtFragments: 0,
          currentMilestoneIndex: 0,
          puzzlePieces: 0,
          tiles: [false, false, false, false, false, false, false, false, false]
        }, parsed.puzzleState);
      } else if (!gameState.puzzleState) {
        gameState.puzzleState = {
          caughtFragments: 0,
          currentMilestoneIndex: 0,
          puzzlePieces: 0,
          tiles: [false, false, false, false, false, false, false, false, false]
        };
      }
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
      if (gameState.player.balloonCoins === undefined) {
        gameState.player.balloonCoins = 0;
      }
      if (gameState.player.sunflowerCoins === undefined) {
        gameState.player.sunflowerCoins = gameState.player.sunflower || 0;
      }
      if (!gameState.player.passAdCooldowns) {
        gameState.player.passAdCooldowns = {};
      }
      if (gameState.reactor.currentEnergy === undefined) {
        gameState.reactor.currentEnergy = 0;
        gameState.reactor.maxEnergy = 1000;
      }

      // Ensure energyGenerator defaults for Dark Green, Dark Red, Pink and Purple fuels & boosts
      if (gameState.energyGenerator.darkRedRemainingSeconds === undefined) {
        gameState.energyGenerator.darkRedRemainingSeconds = 0;
      }
      if (!gameState.energyGenerator.fuelCells) {
        gameState.energyGenerator.fuelCells = { green: 0, darkgreen: 0, yellow: 0, orange: 0, red: 0, darkred: 0, pink: 0, purple: 0, blue: 0, lightblue: 0 };
      } else {
        if (gameState.energyGenerator.fuelCells.darkgreen === undefined) gameState.energyGenerator.fuelCells.darkgreen = 0;
        if (gameState.energyGenerator.fuelCells.darkred === undefined) gameState.energyGenerator.fuelCells.darkred = 0;
        if (gameState.energyGenerator.fuelCells.pink === undefined) gameState.energyGenerator.fuelCells.pink = 0;
        if (gameState.energyGenerator.fuelCells.purple === undefined) gameState.energyGenerator.fuelCells.purple = 0;
        if (gameState.energyGenerator.fuelCells.blue === undefined) gameState.energyGenerator.fuelCells.blue = 0;
        if (gameState.energyGenerator.fuelCells.lightblue === undefined) gameState.energyGenerator.fuelCells.lightblue = 0;
      }
      if (!gameState.energyGenerator.consumed) {
        gameState.energyGenerator.consumed = { green: 0, darkgreen: 0, yellow: 0, orange: 0, red: 0, darkred: 0, pink: 0, purple: 0, blue: 0, lightblue: 0 };
      } else {
        if (gameState.energyGenerator.consumed.darkgreen === undefined) gameState.energyGenerator.consumed.darkgreen = 0;
        if (gameState.energyGenerator.consumed.darkred === undefined) gameState.energyGenerator.consumed.darkred = 0;
        if (gameState.energyGenerator.consumed.pink === undefined) gameState.energyGenerator.consumed.pink = 0;
        if (gameState.energyGenerator.consumed.purple === undefined) gameState.energyGenerator.consumed.purple = 0;
        if (gameState.energyGenerator.consumed.blue === undefined) gameState.energyGenerator.consumed.blue = 0;
        if (gameState.energyGenerator.consumed.lightblue === undefined) gameState.energyGenerator.consumed.lightblue = 0;
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
      if (!gameState.energyGenerator.ratePerSec || gameState.energyGenerator.ratePerSec === 0.01) {
        gameState.energyGenerator.ratePerSec = 0.001;
      }
      if (!gameState.energyGenerator.ratePerMin || gameState.energyGenerator.ratePerMin === 0.01) {
        gameState.energyGenerator.ratePerMin = 0.001;
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
  gameState.reactor.tapMultiplier = 1;
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
  gameState.energyGenerator.fuelCells = { green: 0, darkgreen: 0, yellow: 0, orange: 0, red: 0, darkred: 0, pink: 0, purple: 0, blue: 0, lightblue: 0 };
  gameState.energyGenerator.consumed = { green: 0, darkgreen: 0, yellow: 0, orange: 0, red: 0, darkred: 0, pink: 0, purple: 0, blue: 0, lightblue: 0 };
  gameState.energyGenerator.boosts = {
    pink: { activeRemainingSeconds: 0, cooldownRemainingSeconds: 0, adsWatched: 0, multiplier: 2 },
    purple: { activeRemainingSeconds: 0, cooldownRemainingSeconds: 0, adsWatched: 0, multiplier: 5 }
  };

  // Reset Diamond Generator to base Level 1 stats
  gameState.diamondGenerator = {
    diamondsPerCycle: 0.000001,
    cycleDuration: 60.00,
    progressSeconds: 0,
    lastTickTime: now,
    totalDiamondsProduced: 0,
    productionLevel: 1,
    productionUpgradesCount: 0,
    productionBaseCost: 50,
    productionCostStep: 25,
    productionCostDiscount: 0,
    production1000DiamondDiscountUsed: false,
    productionAdDiscountsCount: 0,
    timeLevel: 1,
    timeUpgradesCount: 0,
    timeBaseCost: 10,
    timeCostStep: 50,
    timeCostDiscount: 0,
    timeAdFirstDiscountUsed: false,
    timeAdCooldownEndTime: 0,
    timeSubsequentAdDiscountsCount: 0
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
  gameState.spinState = {
    level: 1,
    crowns: 0,
    targetCrowns: 5,
    giftsClaimed: 0
  };

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
    fuel_darkred: 0,
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
  if (gameState.dailyStats.fuel_darkred === undefined) gameState.dailyStats.fuel_darkred = 0;
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

let _saveGameTimeout = null;
let _saveGamePending = false;

function _performActualSave() {
  _saveGamePending = false;
  if (_saveGameTimeout) {
    clearTimeout(_saveGameTimeout);
    _saveGameTimeout = null;
  }
  try {
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
        tapMultiplier: gameState.reactor.tapMultiplier || 1,
        currentEnergy: Number((gameState.reactor.currentEnergy || 0).toFixed(2)),
        maxEnergy: gameState.reactor.maxEnergy,
        energyTaps: gameState.reactor.energyTaps,
        comboTaps: gameState.reactor.comboTaps,
        comboMultiplier: gameState.reactor.comboMultiplier,
        profit2xEndTime: gameState.reactor.profit2xEndTime || 0,
        fastXpEndTime: gameState.reactor.fastXpEndTime || 0,
        fastXpAdsWatched: gameState.reactor.fastXpAdsWatched || 0,
        energyAdCooldownEndTime: gameState.reactor.energyAdCooldownEndTime || 0
      },
      energyGenerator: {
        epTotal: Number((gameState.energyGenerator.epTotal || 0).toFixed(2)),
        remainingSeconds: Math.max(0, Math.floor(gameState.energyGenerator.remainingSeconds || 0)),
        ratePerSec: gameState.energyGenerator.ratePerSec || gameState.energyGenerator.ratePerMin || 0.001,
        ratePerMin: gameState.energyGenerator.ratePerSec || gameState.energyGenerator.ratePerMin || 0.001,
        lastTickTime: gameState.energyGenerator.lastTickTime || Date.now(),
        lastSavedTime: Date.now(),
        fuelCells: gameState.energyGenerator.fuelCells,
        consumed: gameState.energyGenerator.consumed,
        boosts: gameState.energyGenerator.boosts
      },
      diamondGenerator: {
        diamondsPerCycle: gameState.diamondGenerator ? gameState.diamondGenerator.diamondsPerCycle : 0.000001,
        cycleDuration: gameState.diamondGenerator ? gameState.diamondGenerator.cycleDuration : 60.00,
        progressSeconds: gameState.diamondGenerator ? gameState.diamondGenerator.progressSeconds : 0,
        lastTickTime: (gameState.diamondGenerator && gameState.diamondGenerator.lastTickTime) || Date.now(),
        totalDiamondsProduced: gameState.diamondGenerator ? gameState.diamondGenerator.totalDiamondsProduced : 0,
        productionLevel: gameState.diamondGenerator ? gameState.diamondGenerator.productionLevel : 1,
        productionUpgradesCount: gameState.diamondGenerator ? gameState.diamondGenerator.productionUpgradesCount : 0,
        productionBaseCost: 50,
        productionCostStep: 25,
        productionCostDiscount: gameState.diamondGenerator ? gameState.diamondGenerator.productionCostDiscount : 0,
        production1000DiamondDiscountUsed: gameState.diamondGenerator ? !!gameState.diamondGenerator.production1000DiamondDiscountUsed : false,
        productionAdDiscountsCount: gameState.diamondGenerator ? (gameState.diamondGenerator.productionAdDiscountsCount || 0) : 0,
        timeLevel: gameState.diamondGenerator ? gameState.diamondGenerator.timeLevel : 1,
        timeUpgradesCount: gameState.diamondGenerator ? gameState.diamondGenerator.timeUpgradesCount : 0,
        timeBaseCost: 10,
        timeCostStep: 50,
        timeCostDiscount: gameState.diamondGenerator ? gameState.diamondGenerator.timeCostDiscount : 0,
        timeAdFirstDiscountUsed: gameState.diamondGenerator ? !!gameState.diamondGenerator.timeAdFirstDiscountUsed : false,
        timeAdCooldownEndTime: gameState.diamondGenerator ? (gameState.diamondGenerator.timeAdCooldownEndTime || 0) : 0,
        timeSubsequentAdDiscountsCount: gameState.diamondGenerator ? (gameState.diamondGenerator.timeSubsequentAdDiscountsCount || 0) : 0
      },
      tasksState: gameState.tasksState,
      xpState: gameState.xpState,
      goalState: gameState.goalState,
      spinState: gameState.spinState || {
        level: 1,
        crowns: 0,
        targetCrowns: 3,
        giftsClaimed: 0
      },
      dailyStats: gameState.dailyStats
    }));
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }

  // Real-time Cloud Save to Firebase
  if (window.firebaseSync && typeof window.firebaseSync.debouncedSave === 'function') {
    window.firebaseSync.debouncedSave();
  }
}

function saveGame(immediate = false) {
  if (immediate) {
    _performActualSave();
    return;
  }
  if (_saveGameTimeout) return;
  _saveGamePending = true;
  _saveGameTimeout = setTimeout(() => {
    _performActualSave();
  }, 350);
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

function completeActiveLevel(targetLvl, options = {}) {
  const activeLvl = getActiveLevel();
  const lvlToComplete = targetLvl || activeLvl;
  const cfg = getLevelConfig(lvlToComplete);

  // If source is XP, handle ONLY XP page level reward claiming (Dark Green Fuel)
  if (options.source === 'xp') {
    if (!gameState.xpState) gameState.xpState = {};
    if (!gameState.xpState.claimedLevels) gameState.xpState.claimedLevels = {};
    gameState.xpState.claimedLevels[lvlToComplete] = true;
    gameState.xpState.currentLevel = Math.max((gameState.xpState.currentLevel || 1), lvlToComplete + 1);

    const darkGreenFuel = typeof calculateLevelDarkGreenFuel === 'function'
      ? calculateLevelDarkGreenFuel(lvlToComplete)
      : Math.max(1, Math.min(20, Math.ceil(lvlToComplete / 5)));
    if (!gameState.energyGenerator.fuelCells) {
      gameState.energyGenerator.fuelCells = { green: 0, darkgreen: 0, yellow: 0, orange: 0, red: 0, pink: 0, purple: 0, blue: 0, lightblue: 0, darkred: 0 };
    }
    gameState.energyGenerator.fuelCells.darkgreen = (gameState.energyGenerator.fuelCells.darkgreen || 0) + darkGreenFuel;

    saveGame(true);
    if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
      window.firebaseSync.saveToCloudImmediate();
    }
    return { success: true, xpLevel: gameState.xpState.currentLevel, rewards: { darkGreenFuel } };
  }

  // GOAL LEVEL COMPLETION (Completely decoupled from XP page rewards)
  if (!gameState.progression) {
    gameState.progression = { activeLevel: 1, completedLevels: {}, levelProgress: { cards: 0, keys: 0, tickets: 0 }, levelXp: 0 };
  }
  if (!gameState.progression.completedLevels) {
    gameState.progression.completedLevels = {};
  }
  gameState.progression.completedLevels[lvlToComplete] = true;

  // Mark in Goal State ONLY (DO NOT touch gameState.xpState.claimedLevels!)
  if (!gameState.goalState) gameState.goalState = {};
  if (!gameState.goalState.claimedGoals) gameState.goalState.claimedGoals = {};
  gameState.goalState.claimedGoals[lvlToComplete] = true;

  // Award goal milestone rewards
  const rewards = cfg.rewards || {};
  gameState.player.coins = (gameState.player.coins || 0) + (rewards.coins || 0);
  gameState.player.xp = (gameState.player.xp || 0) + (rewards.xpBonus || 0);
  gameState.player.chestTickets = (gameState.player.chestTickets || 0) + (rewards.tickets || 0);
  gameState.player.chestKeys = (gameState.player.chestKeys || 0) + (rewards.keys || 0);
  gameState.player.scratchCards = (gameState.player.scratchCards || 0) + (rewards.cards || 0);

  // Advance Goal level to next level if available
  const nextLvl = lvlToComplete + 1;
  if (nextLvl <= 1000) {
    gameState.progression.activeLevel = nextLvl;
    gameState.progression.levelProgress = { cards: 0, keys: 0, tickets: 0 };
    gameState.progression.levelXp = 0;

    if (gameState.goalState) {
      gameState.goalState.currentLevel = nextLvl;
      gameState.goalState.levelProgress = { cards: 0, keys: 0, tickets: 0 };
      gameState.goalState.levelAdsWatched = 0;
    }
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

  // Save game state locally and cloud immediately on level up
  saveGame(true);
  if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
    window.firebaseSync.saveToCloudImmediate();
  }

  return { success: true, activeLevel: gameState.progression.activeLevel, rewards: rewards };
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

var BigNum = class BigNum {
  constructor(m = 0, e = 0) {
    if (m === 0 || isNaN(m)) {
      this.m = 0;
      this.e = 0;
    } else {
      let exp = Math.floor(e);
      let man = m;
      if (man <= 0) {
        this.m = 0;
        this.e = 0;
        return;
      }
      const factor = Math.floor(Math.log10(man));
      man = man / Math.pow(10, factor);
      exp += factor;
      this.m = man;
      this.e = exp;
    }
  }

  static from(val) {
    if (val instanceof BigNum) return new BigNum(val.m, val.e);
    if (typeof val === 'number') {
      if (val <= 0 || isNaN(val) || !isFinite(val)) return new BigNum(0, 0);
      const e = Math.floor(Math.log10(val));
      const m = val / Math.pow(10, e);
      return new BigNum(m, e);
    }
    if (typeof val === 'string') {
      if (!val || val === '0') return new BigNum(0, 0);
      if (val.startsWith('{')) {
        try {
          const parsed = JSON.parse(val);
          if (parsed && typeof parsed.m === 'number') return new BigNum(parsed.m, parsed.e || 0);
        } catch(e) {}
      }
      if (val.includes('e') || val.includes('E')) {
        const parts = val.toLowerCase().split('e');
        return new BigNum(parseFloat(parts[0]), parseInt(parts[1], 10));
      }
      const num = parseFloat(val);
      if (isNaN(num) || num <= 0) return new BigNum(0, 0);
      const e = Math.floor(Math.log10(num));
      return new BigNum(num / Math.pow(10, e), e);
    }
    if (val && typeof val.m === 'number' && typeof val.e === 'number') {
      return new BigNum(val.m, val.e);
    }
    return new BigNum(0, 0);
  }

  add(other) {
    const b = BigNum.from(other);
    if (this.m === 0) return b;
    if (b.m === 0) return new BigNum(this.m, this.e);
    const diff = this.e - b.e;
    if (diff > 16) return new BigNum(this.m, this.e);
    if (diff < -16) return new BigNum(b.m, b.e);
    if (diff >= 0) {
      return new BigNum(this.m + b.m * Math.pow(10, -diff), this.e);
    } else {
      return new BigNum(this.m * Math.pow(10, diff) + b.m, b.e);
    }
  }

  sub(other) {
    const b = BigNum.from(other);
    if (b.m === 0) return new BigNum(this.m, this.e);
    if (this.m === 0) return new BigNum(0, 0);
    const diff = this.e - b.e;
    if (diff > 16) return new BigNum(this.m, this.e);
    if (diff < 0) return new BigNum(0, 0);
    const newM = this.m - b.m * Math.pow(10, -diff);
    if (newM <= 0) return new BigNum(0, 0);
    return new BigNum(newM, this.e);
  }

  mul(other) {
    const b = BigNum.from(other);
    if (this.m === 0 || b.m === 0) return new BigNum(0, 0);
    return new BigNum(this.m * b.m, this.e + b.e);
  }

  div(other) {
    const b = BigNum.from(other);
    if (b.m === 0) return new BigNum(0, 0);
    if (this.m === 0) return new BigNum(0, 0);
    return new BigNum(this.m / b.m, this.e - b.e);
  }

  pow(power) {
    if (power === 0) return new BigNum(1, 0);
    if (this.m === 0) return new BigNum(0, 0);
    const totalExp = (Math.log10(this.m) + this.e) * power;
    const intExp = Math.floor(totalExp);
    const fracExp = totalExp - intExp;
    return new BigNum(Math.pow(10, fracExp), intExp);
  }

  cmp(other) {
    const b = BigNum.from(other);
    if (this.m === 0 && b.m === 0) return 0;
    if (this.m === 0) return -1;
    if (b.m === 0) return 1;
    if (this.e > b.e) return 1;
    if (this.e < b.e) return -1;
    if (this.m > b.m + 1e-12) return 1;
    if (this.m < b.m - 1e-12) return -1;
    return 0;
  }

  gte(other) { return this.cmp(other) >= 0; }
  lte(other) { return this.cmp(other) <= 0; }
  gt(other) { return this.cmp(other) > 0; }
  lt(other) { return this.cmp(other) < 0; }
  eq(other) { return this.cmp(other) === 0; }

  toNumber() {
    if (this.m === 0) return 0;
    if (this.e > 308) return Infinity;
    return this.m * Math.pow(10, this.e);
  }

  toString() {
    if (this.m === 0) return '0';
    if (this.e < 3) return (this.m * Math.pow(10, this.e)).toFixed(2).replace(/\.00$/, '');
    return `${this.m.toFixed(4)}e+${this.e}`;
  }

  toJSON() {
    return { m: this.m, e: this.e };
  }
};
window.BigNum = BigNum;

var NUMBER_SUFFIXES = [
  '',     // 10^0
  'K',    // 10^3
  'M',    // 10^6
  'B',    // 10^9
  'T',    // 10^12
  'Qa',   // 10^15
  'Qi',   // 10^18
  'Sx',   // 10^21
  'Sp',   // 10^24
  'Oc',   // 10^27
  'No',   // 10^30
  'Dc',   // 10^33
  'Ud',   // 10^36
  'Dd',   // 10^39
  'Td',   // 10^42
  'Qad',  // 10^45
  'Qid',  // 10^48
  'Sxd',  // 10^51
  'Spd',  // 10^54
  'Ocd',  // 10^57
  'Nod',  // 10^60
  'Vg',   // 10^63
  'Uv',   // 10^66
  'Dv',   // 10^69
  'Tv',   // 10^72
  'Qav',  // 10^75
  'Qiv',  // 10^78
  'Sxv',  // 10^81
  'Spv',  // 10^84
  'Ocv',  // 10^87
  'Nov',  // 10^90
  'Tg',   // 10^93
  'Utg',  // 10^96
  'Dtg',  // 10^99
  'Ttg',  // 10^102
  'Qatg', // 10^105
  'Qitg', // 10^108
  'Sxtg', // 10^111
  'Sptg', // 10^114
  'Octg', // 10^117
  'Notg'  // 10^120
];
window.NUMBER_SUFFIXES = NUMBER_SUFFIXES;

var formatNumber = function(val) {
  if (val === undefined || val === null) return '0';
  const bn = BigNum.from(val);
  if (bn.m === 0) return '0';
  if (bn.e < 3) {
    const raw = bn.m * Math.pow(10, bn.e);
    if (Math.abs(raw - Math.round(raw)) < 1e-4) return Math.round(raw).toLocaleString();
    return raw.toFixed(raw < 10 ? 2 : 1).replace(/\.0+$/, '');
  }
  const tier = Math.floor(bn.e / 3);
  if (tier >= NUMBER_SUFFIXES.length - 1) {
    const superTier = Math.floor((bn.e - 120) / 3);
    if (superTier <= 0) {
      const scaled = bn.m * Math.pow(10, bn.e - 120);
      let str = scaled.toFixed(scaled < 10 ? 2 : (scaled < 100 ? 1 : 0));
      str = str.replace(/\.0+$/, '').replace(/(\.[1-9])0$/, '$1');
      return str + 'Notg';
    }
    return `${bn.m.toFixed(2)}e+${bn.e}`;
  }
  const suffix = NUMBER_SUFFIXES[tier];
  const expInTier = bn.e % 3;
  const scaled = bn.m * Math.pow(10, expInTier);
  let str = scaled.toFixed(scaled < 10 ? 2 : (scaled < 100 ? 1 : 0));
  str = str.replace(/\.0+$/, '').replace(/(\.[1-9])0$/, '$1');
  return str + suffix;
}
window.formatNumber = formatNumber;

function formatDiamondDisplay(num) {
  if (num === undefined || num === null || isNaN(num)) return '0.000000';
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
  if (num >= 10000) return (num / 1000).toFixed(1) + 'k';
  return Number(num).toFixed(6);
}
window.formatDiamondDisplay = formatDiamondDisplay;

function formatTimerDisplay() {
  const drSecs = (gameState.energyGenerator && gameState.energyGenerator.darkRedRemainingSeconds) || 0;
  const stdSecs = (gameState.energyGenerator && gameState.energyGenerator.remainingSeconds) || 0;
  const totalSecs = drSecs + stdSecs;
  const displaySecs = drSecs > 0 ? drSecs : stdSecs;
  const h = Math.floor(displaySecs / 3600);
  const m = Math.floor((displaySecs % 3600) / 60);
  const s = Math.floor(displaySecs % 60);
  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  
  if (DOM.fuelTimerVal) {
    if (totalSecs > 0) {
      if (drSecs > 0) {
        DOM.fuelTimerVal.textContent = `${mm}m ${ss}s`;
      } else {
        DOM.fuelTimerVal.textContent = h > 0 ? `${hh}h ${mm}m` : `${mm}m ${ss}s`;
      }
      if (DOM.energyGaugeWrapper) DOM.energyGaugeWrapper.classList.add('active-generating');
    } else {
      DOM.fuelTimerVal.textContent = '00h 00m';
      if (DOM.energyGaugeWrapper) DOM.energyGaugeWrapper.classList.remove('active-generating');
    }
  }
}

// Ambient Background Particles (Idempotent + DocumentFragment batch)
function initAmbientParticles() {
  if (!DOM.ambientParticles) return;
  if (DOM.ambientParticles.childElementCount > 0) return;
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < 20; i++) {
    const particle = document.createElement('div');
    particle.className = 'ambient-particle';
    const size = Math.random() * 4 + 2;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.animationDuration = `${Math.random() * 8 + 6}s`;
    particle.style.animationDelay = `${Math.random() * 5}s`;
    fragment.appendChild(particle);
  }
  DOM.ambientParticles.appendChild(fragment);
}

// DOM References Cache
const DOM = {
  playerLevelBadge: document.getElementById('playerLevelBadge'),
  playerUsername: document.getElementById('playerUsername'),
  coinCounter: document.getElementById('coinCounter') || document.getElementById('headerCoinBalance'),
  coinPill: document.getElementById('coinPill'),
  blueCoinCounter: null,
  blueCoinPill: null,
  streakBtn: document.getElementById('streakBtn'),
  
  pageHome: document.getElementById('pageHome'),
  pageEnergy: document.getElementById('pageEnergy'),
  pageSunflower: document.getElementById('pageSunflower'),
  pageBeeFarm: document.getElementById('pageBeeFarm'),
  pageMining: document.getElementById('pageMining'),
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
  darkredCellCount: document.getElementById('darkredCellCount'),
  pinkCellCount: document.getElementById('pinkCellCount'),
  purpleCellCount: document.getElementById('purpleCellCount'),
  blueCellCount: document.getElementById('blueCellCount'),
  lightblueCellCount: document.getElementById('lightblueCellCount'),
  btnUseGreenFuel: document.getElementById('btnUseGreenFuel'),
  btnUseDarkGreenFuel: document.getElementById('btnUseDarkGreenFuel'),
  btnUseDarkRedFuel: document.getElementById('btnUseDarkRedFuel'),
  
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
  window.getDeterministicGoalTargets = getDeterministicGoalTargets;
  window.calculateLevelDarkGreenFuel = calculateLevelDarkGreenFuel;
  window.generateDefaultLevelConfig = generateDefaultLevelConfig;
  window.getLevelConfig = getLevelConfig;
  window.getLevelRequiredXP = getLevelRequiredXP;
  window.isLevelUnlocked = isLevelUnlocked;
  window.isLevelCompleted = isLevelCompleted;
  window.getActiveLevel = getActiveLevel;
  window.canClaimActiveLevel = canClaimActiveLevel;
  window.completeActiveLevel = completeActiveLevel;
  window.claimServerAuthoritativeReward = claimServerAuthoritativeReward;
}

/**
 * Server-Authoritative Reward Claim & Anti-Fraud Engine
 * Validates important economic operations through backend validation
 */
async function claimServerAuthoritativeReward(action, payload) {
  const uid = (typeof firebaseSync !== 'undefined' && firebaseSync.userId)
    || (gameState && gameState.player && gameState.player.profileCode)
    || 'player_guest';

  const nonce = 'claim_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

  try {
    const res = await fetch('/api/reward/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid,
        nonce,
        action,
        payload: payload || {},
        clientTimestamp: Date.now()
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.balances) {
        // Authoritative server balance update
        if (data.balances.coins !== undefined) {
          gameState.player.coins = data.balances.coins;
        }
        if (data.balances.diamonds !== undefined) {
          gameState.bank.diamonds = data.balances.diamonds;
          gameState.player.diamonds = data.balances.diamonds;
        }
        if (data.balances.keys !== undefined) {
          gameState.bank.keys = data.balances.keys;
        }

        if (typeof updateUI === 'function') updateUI();
        if (typeof saveGame === 'function') saveGame(true);
        return data;
      }
    } else {
      const errData = await res.json().catch(() => ({}));
      console.warn('Server rejected reward claim:', errData);
      if (errData.error && typeof showFloatingToast === 'function') {
        showFloatingToast(`⚠️ ${errData.error}`);
      }
      return { ok: false, error: errData.error };
    }
  } catch (err) {
    console.warn('Network offline, queuing local fallback for claim:', err);
    // Offline local fallback
    if (payload && payload.claimedCoins) gameState.player.coins = (gameState.player.coins || 0) + Number(payload.claimedCoins);
    if (payload && payload.claimedDiamonds) gameState.bank.diamonds = (gameState.bank.diamonds || 0) + Number(payload.claimedDiamonds);
    if (typeof updateUI === 'function') updateUI();
    if (typeof saveGame === 'function') saveGame(true);
    return { ok: true, offline: true };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    gameState,
    DOM,
    getDeterministicGoalTargets,
    calculateLevelDarkGreenFuel,
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

