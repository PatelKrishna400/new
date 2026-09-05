// Level XP Threshold Calculator
// Level 0 complete limit: 1,000 XP
// Level 1 complete limit: 2,000 XP
// Level 2 complete limit: 3,000 XP
// Level N complete limit: (N + 1) * 1,000 XP
function getLevelRequiredXP(lvl) {
  const currentLvl = Math.max(0, parseInt(lvl, 10) || 0);
  return (currentLvl + 1) * 1000;
}

// Combo Multiplier Calculator
// *1 for 10 tap, *1.3 for 30 tap, *1.5 for 50 tap, *1.7 for 75 tap, *2 for 150 tap, *2.5 for 250 tap, *3 for 500 tap
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

// Game State Definition
const gameState = {
  currentTab: 'home', // 'home' | 'energy' | 'tasks' | 'profile' | 'xp' | 'wallet' | 'goal'
  taskSubtab: 'daily', // 'daily' | 'telegram'
  player: {
    name: 'Alex Vance',
    handle: 'alex_blue',
    tier: 'BRONZE',
    level: 0,
    maxLevel: 100,
    coins: 0,
    xp: 0,
    xpToNextLevel: 1000,
    streakDays: 0,
    lastStreakClaimTime: 0,
    chestKeys: 0,
    chestTickets: 0,
    scratchCards: 0,
    eggs: 0,
    diamonds: 0,
  },
  goal: {
    level: 0,
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
  },
  energyGenerator: {
    epTotal: 0,
    remainingSeconds: 0,
    ratePerSec: 0.01,
    ratePerMin: 0.01,
    isActive: false,
    timerInterval: null,
    fuelCells: {
      green: 0,
      yellow: 0,
      orange: 0,
      red: 0,
      pink: 0,
      purple: 0
    },
    consumed: {
      green: 0,
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
  tasksState: {
    claimedDaily: {},
    claimedTelegram: {}
  },
  xpState: {
    currentSubtab: 'mega', // 'mega' | 'levels'
    watchedAds: 0,
    claimedLevels: {},
    megaRewardClaimed: false,
    seasonEndMs: Date.now() + (12 * 24 * 3600 + 22 * 60 + 42) * 1000
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
    seasonEndMs: Date.now() + (12 * 24 * 3600 + 22 * 60 + 42) * 1000
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
    date: new Date().toDateString()
  },
  autoBotInterval: null,
};

// LocalStorage Key
const STORAGE_KEY = 'ENERGY_TAP_REACTOR_SAVE_V5';

// Load & Save
function loadSavedGame() {
  // Purge legacy saves to guarantee fresh zero start
  try {
    localStorage.removeItem('ENERGY_TAP_REACTOR_SAVE_V1');
    localStorage.removeItem('ENERGY_TAP_REACTOR_SAVE_V2');
    localStorage.removeItem('ENERGY_TAP_REACTOR_SAVE_V3');
    localStorage.removeItem('ENERGY_TAP_REACTOR_SAVE_V4');
  } catch (e) {}

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      Object.assign(gameState.player, parsed.player || {});
      Object.assign(gameState.goal, parsed.goal || {});
      Object.assign(gameState.reactor, parsed.reactor || {});
      if (parsed.energyGenerator) Object.assign(gameState.energyGenerator, parsed.energyGenerator);
      if (parsed.tasksState) Object.assign(gameState.tasksState, parsed.tasksState);
      if (parsed.xpState) Object.assign(gameState.xpState, parsed.xpState);
      if (parsed.goalState) Object.assign(gameState.goalState, parsed.goalState);
      if (parsed.dailyStats) {
        gameState.dailyStats = Object.assign({ spins: 0, chests: 0, scratches: 0, eggs: 0, date: new Date().toDateString() }, parsed.dailyStats);
      }
      checkDailyStatsDate();

      if (gameState.player.diamonds === undefined) gameState.player.diamonds = 0;

      // Ensure goalState defaults
      if (!gameState.goalState.levelProgress) {
        gameState.goalState.levelProgress = { cards: 0, keys: 0, tickets: 0 };
      }
      if (gameState.goalState.currentLevel === undefined) {
        gameState.goalState.currentLevel = 0;
      }
      if (gameState.goalState.levelAdsWatched === undefined) {
        gameState.goalState.levelAdsWatched = 0;
      }

      // Ensure proper XP curve initialization
      if (!gameState.player.xpToNextLevel || gameState.player.xpToNextLevel < 1000) {
        gameState.player.xpToNextLevel = getLevelRequiredXP(gameState.player.level || 0);
      }
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

      // Ensure energyGenerator defaults for Pink and Purple fuels & boosts
      if (!gameState.energyGenerator.fuelCells) {
        gameState.energyGenerator.fuelCells = { green: 0, yellow: 0, orange: 0, red: 0, pink: 0, purple: 0 };
      } else {
        if (gameState.energyGenerator.fuelCells.pink === undefined) gameState.energyGenerator.fuelCells.pink = 0;
        if (gameState.energyGenerator.fuelCells.purple === undefined) gameState.energyGenerator.fuelCells.purple = 0;
      }
      if (!gameState.energyGenerator.consumed) {
        gameState.energyGenerator.consumed = { green: 0, yellow: 0, orange: 0, red: 0, pink: 0, purple: 0 };
      } else {
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
    } catch (e) {
      console.warn('Failed to load saved state, using default', e);
    }
  } else {
    // Initial zero baseline save
    saveGame();
  }
}

// Reset Game State to Fresh Zero Slate
function resetAllDataToZero() {
  try {
    localStorage.removeItem('ENERGY_TAP_REACTOR_SAVE_V1');
    localStorage.removeItem('ENERGY_TAP_REACTOR_SAVE_V2');
    localStorage.removeItem('ENERGY_TAP_REACTOR_SAVE_V3');
    localStorage.removeItem('ENERGY_TAP_REACTOR_SAVE_V4');
    localStorage.removeItem('ENERGY_TAP_REACTOR_SAVE_V5');
    localStorage.removeItem('ENERGY_TAP_FIREBASE_LOCAL_UID');
    localStorage.removeItem('ENERGY_TAP_FIREBASE_LOCAL_UID_V5');
  } catch(e) {}
  
  gameState.player.level = 0;
  gameState.player.coins = 0;
  gameState.player.xp = 0;
  gameState.player.xpToNextLevel = 1000;
  gameState.player.streakDays = 0;
  gameState.player.lastStreakClaimTime = 0;
  gameState.player.chestKeys = 0;
  gameState.player.chestTickets = 0;
  gameState.player.scratchCards = 0;
  gameState.player.eggs = 0;

  gameState.goal.level = 0;
  gameState.goal.currentCoins = 0;
  gameState.goal.targetCoins = 85;
  gameState.goal.currentKeys = 0;
  gameState.goal.targetKeys = 71;
  gameState.goal.currentTickets = 0;
  gameState.goal.targetTickets = 49;

  gameState.reactor.currentEnergy = 0;
  gameState.reactor.maxEnergy = 1000;
  gameState.reactor.energyTaps = 0;
  gameState.reactor.comboTaps = 0;
  gameState.reactor.comboMultiplier = 1.0;

  gameState.energyGenerator.epTotal = 0;
  gameState.energyGenerator.remainingSeconds = 0;
  gameState.energyGenerator.isActive = false;
  gameState.energyGenerator.fuelCells = { green: 0, yellow: 0, orange: 0, red: 0, pink: 0, purple: 0 };
  gameState.energyGenerator.consumed = { green: 0, yellow: 0, orange: 0, red: 0, pink: 0, purple: 0 };
  gameState.energyGenerator.boosts = {
    pink: { activeRemainingSeconds: 0, cooldownRemainingSeconds: 0, adsWatched: 0, multiplier: 2 },
    purple: { activeRemainingSeconds: 0, cooldownRemainingSeconds: 0, adsWatched: 0, multiplier: 5 }
  };

  gameState.tasksState.claimedDaily = {};
  gameState.tasksState.claimedTelegram = {};
  gameState.xpState.watchedAds = 0;
  gameState.xpState.claimedLevels = {};
  gameState.xpState.megaRewardClaimed = false;

  gameState.goalState.currentLevel = 0;
  gameState.goalState.levelProgress = { cards: 0, keys: 0, tickets: 0 };
  gameState.goalState.levelAdsWatched = 0;
  gameState.goalState.claimedGoals = {};
  gameState.goalState.megaWatchedAds = 0;
  gameState.goalState.megaRewardClaimed = false;
  gameState.goalState.grandChestClaimed = false;

  gameState.dailyStats = {
    spins: 0,
    chests: 0,
    scratches: 0,
    eggs: 0,
    date: new Date().toDateString()
  };

  saveGame();
  if (typeof updateAllUI === 'function') updateAllUI();
  else if (typeof updateUI === 'function') updateUI();
}

window.resetAllDataToZero = resetAllDataToZero;

// Check and reset daily stats if day changed
function checkDailyStatsDate() {
  if (!gameState.dailyStats) {
    gameState.dailyStats = { spins: 0, chests: 0, scratches: 0, eggs: 0, date: new Date().toDateString() };
  }
  const today = new Date().toDateString();
  if (gameState.dailyStats.date !== today) {
    gameState.dailyStats.spins = 0;
    gameState.dailyStats.chests = 0;
    gameState.dailyStats.scratches = 0;
    gameState.dailyStats.eggs = 0;
    gameState.dailyStats.date = today;
    if (gameState.tasksState && gameState.tasksState.claimedDaily) {
      delete gameState.tasksState.claimedDaily['d_spin_50'];
      delete gameState.tasksState.claimedDaily['d_chest_50'];
      delete gameState.tasksState.claimedDaily['d_scratch_30'];
      delete gameState.tasksState.claimedDaily['d_egg_50'];
    }
  }
}
window.checkDailyStatsDate = checkDailyStatsDate;

function saveGame() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    player: gameState.player,
    goal: gameState.goal,
    reactor: {
      tapPower: gameState.reactor.tapPower,
      currentEnergy: gameState.reactor.currentEnergy,
      maxEnergy: gameState.reactor.maxEnergy,
      energyTaps: gameState.reactor.energyTaps,
      comboTaps: gameState.reactor.comboTaps,
      comboMultiplier: gameState.reactor.comboMultiplier
    },
    energyGenerator: {
      epTotal: gameState.energyGenerator.epTotal,
      remainingSeconds: gameState.energyGenerator.remainingSeconds,
      ratePerSec: gameState.energyGenerator.ratePerSec || gameState.energyGenerator.ratePerMin || 0.01,
      ratePerMin: gameState.energyGenerator.ratePerSec || gameState.energyGenerator.ratePerMin || 0.01,
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
  coinCounter: document.getElementById('coinCounter'),
  coinPill: document.getElementById('coinPill'),
  streakBtn: document.getElementById('streakBtn'),
  
  pageHome: document.getElementById('pageHome'),
  pageEnergy: document.getElementById('pageEnergy'),
  pageTasks: document.getElementById('pageTasks'),
  pageProfile: document.getElementById('pageProfile'),
  pageXP: document.getElementById('pageXP'),
  pageWallet: document.getElementById('pageWallet'),
  pageGoal: document.getElementById('pageGoal'),
  
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
  tasksListContainer: document.getElementById('tasksListContainer'),
  dailyBadgeCount: document.getElementById('dailyBadgeCount'),
  telegramBadgeCount: document.getElementById('telegramBadgeCount'),
  
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
  yellowCellCount: document.getElementById('yellowCellCount'),
  orangeCellCount: document.getElementById('orangeCellCount'),
  redCellCount: document.getElementById('redCellCount'),
  pinkCellCount: document.getElementById('pinkCellCount'),
  purpleCellCount: document.getElementById('purpleCellCount'),
  btnUseGreenFuel: document.getElementById('btnUseGreenFuel'),
  
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
