/* ==========================================================================
   SUNFLOWER SOLAR TYCOON ENGINE (pages/sunflower/sunflower.js)
   20 Lands Fixed 2*10 System &bull; Levels 1 to 5000 &bull; 5s to 0.001s Speed
   Sticky Header &bull; 5-Tab Custom Bottom Menu &bull; Workers &bull; 100🪙=29⚡
   ========================================================================== */

const SF_STORAGE_KEY = 'ENERGY_TAP_SUNFLOWER_STATE_V2';

// 20 Lands Base Unlock Costs (Plot 1 is Free)
const SF_LAND_UNLOCK_COSTS = [
  0,      // Land 1: Free
  10,     // Land 2: 10 💎
  50,     // Land 3: 50 💎
  150,    // Land 4: 150 💎
  300,    // Land 5: 300 💎
  500,    // Land 6: 500 💎
  800,    // Land 7: 800 💎
  1200,   // Land 8: 1200 💎
  1800,   // Land 9: 1800 💎
  2500,   // Land 10: 2500 💎
  3500,   // Land 11: 3500 💎
  5000,   // Land 12: 5000 💎
  7000,   // Land 13: 7000 💎
  9500,   // Land 14: 9500 💎
  13000,  // Land 15: 13000 💎
  18000,  // Land 16: 18000 💎
  25000,  // Land 17: 25000 💎
  35000,  // Land 18: 35000 💎
  50000,  // Land 19: 50000 💎
  75000   // Land 20: 75000 💎
];

// 20 Lands Base Starting Production Times (at Level 1)
const SF_LAND_BASE_TIMES = [
  5,        // Land 1: 5s
  30,       // Land 2: 30s
  60,       // Land 3: 1 min (60s)
  300,      // Land 4: 5 min (300s)
  600,      // Land 5: 10 min
  1200,     // Land 6: 20 min
  1800,     // Land 7: 30 min
  2700,     // Land 8: 45 min
  3600,     // Land 9: 1 hr
  5400,     // Land 10: 1.5 hr
  7200,     // Land 11: 2 hr
  10800,    // Land 12: 3 hr
  14400,    // Land 13: 4 hr
  21600,    // Land 14: 6 hr
  28800,    // Land 15: 8 hr
  43200,    // Land 16: 12 hr
  57600,    // Land 17: 16 hr
  72000,    // Land 18: 20 hr
  86400,    // Land 19: 24 hr
  172800    // Land 20: 48 hr
];

// Innate Land Output Multipliers
const SF_LAND_MULTIPLIERS = [
  1, 2, 5, 12, 30, 80, 200, 500, 1200, 3000,
  8000, 20000, 50000, 120000, 300000, 800000, 2000000, 5000000, 12000000, 30000000
];

function createDefaultSfPlots() {
  const plots = [];
  for (let i = 1; i <= 20; i++) {
    const isUnlocked = i === 1;
    plots.push({
      id: i,
      unlocked: isUnlocked,
      unlockCost: SF_LAND_UNLOCK_COSTS[i - 1],
      level: 1, // Levels 1 to 5000
      progress: 0, // 0 to 1 cycle progress
      lifeTimer: isUnlocked ? 60 : 0,
      maxLifeTimer: 60,
      isWithered: false,
      lastTick: Date.now()
    });
  }
  return plots;
}

function loadInitialSunflowerState() {
  try {
    const raw = localStorage.getItem(SF_STORAGE_KEY) || localStorage.getItem('ENERGY_TAP_SUNFLOWER_STATE_V1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.plots) && parsed.plots.length === 20) {
        // Upgrade existing plot schemas to Level 1-5000 format
        parsed.plots.forEach((p, idx) => {
          if (typeof p.level !== 'number') p.level = 1;
          if (typeof p.progress !== 'number') p.progress = 0;
          if (typeof p.unlockCost !== 'number') p.unlockCost = SF_LAND_UNLOCK_COSTS[idx];
        });
        if (!parsed.workers) {
          parsed.workers = { walter: false, dave: false, elena: false, leo: false };
        }
        if (!parsed.upgradeMultiplier) parsed.upgradeMultiplier = 1;
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse saved Sunflower state:', e);
  }

  return {
    currentPage: 1,
    coins: 150,
    energy: 0,
    diamonds: 25,
    baskets: 2,
    shovels: 1,
    sproutDiamondCost: 1,
    upgradeMultiplier: 1, // 1, 10, 100, or 'max'
    workers: {
      walter: false, // auto-pumps water cistern
      dave: false,   // auto-harvests lands 1-5
      elena: false,  // auto-harvests lands 6-10 + 20% coin boost
      leo: false     // auto-harvests lands 11-20 + 2x speed
    },
    cistern: {
      basketsInCrate: 0,
      maxCrateCapacity: 5,
      baseFillSeconds: 4.0,
      currentProgress: 0,
      boostTimerRemaining: 0
    },
    plots: createDefaultSfPlots()
  };
}

const sunflowerState = loadInitialSunflowerState();
window.sunflowerState = sunflowerState;

let sfSaveTimeout = null;
function saveSunflowerStateDebounced() {
  if (sfSaveTimeout) return;
  sfSaveTimeout = setTimeout(() => {
    sfSaveTimeout = null;
    try {
      localStorage.setItem(SF_STORAGE_KEY, JSON.stringify(sunflowerState));
    } catch (e) {}
  }, 1000);
}

/* ==========================================================================
   FORMULAS: SPEED, OUTPUT & UPGRADE COSTS (Levels 1 to 5000)
   ========================================================================== */

// 1. Cycle Time: Level 1 = Base Time (e.g. 5s) -> Level 5000 = 0.001s
function getSfPlotCycleTime(plotIndex, level) {
  const baseTime = SF_LAND_BASE_TIMES[plotIndex] || 5;
  const L = Math.min(5000, Math.max(1, level || 1));
  if (L >= 5000) return 0.001;

  // Smooth progression from baseTime at Level 1 to 0.001s at Level 5000
  const progress = (L - 1) / 4999;
  let time = baseTime * (1 - progress) + 0.001 * progress;

  // Leo Worker speed boost (halves cycle duration)
  if (sunflowerState.workers && sunflowerState.workers.leo) {
    time = time / 2;
  }
  return Math.max(0.001, time);
}

// 2. Sunflower Coins Generated Per Cycle
// Level 1 = 1 coin, Level 2 = 50 coins, Level 3 = 500 coins, Level > 3 scales up!
function getSfPlotCoinsPerCycle(plotIndex, level) {
  const mult = SF_LAND_MULTIPLIERS[plotIndex] || 1;
  const L = Math.min(5000, Math.max(1, level || 1));
  let baseCoins = 1;

  if (L === 1) {
    baseCoins = 1;
  } else if (L === 2) {
    baseCoins = 50;
  } else if (L === 3) {
    baseCoins = 500;
  } else {
    const diff = L - 3;
    baseCoins = 500 + diff * 120 + Math.floor(15 * Math.pow(diff, 1.25));
  }

  let total = Math.round(baseCoins * mult);

  // Elena Worker output boost (+20%)
  if (sunflowerState.workers && sunflowerState.workers.elena) {
    total = Math.round(total * 1.2);
  }
  return Math.max(1, total);
}

// 3. Upgrade Cost: generating coin value * 10 + Level
// Level was upgraded -> cost becomes (coinsGenerated * 10) + L
function getSfPlotUpgradeCost(plotIndex, level) {
  const L = Math.min(5000, Math.max(1, level || 1));
  if (L >= 5000) return Infinity; // Max Level!
  const coinsGen = getSfPlotCoinsPerCycle(plotIndex, L);
  return Math.round(coinsGen * 10 + L);
}

// Multi-Buy Calculator (1x, 10x, 100x, MAX)
function getSfMultiUpgradeInfo(plotIndex, currentLevel, multMode, playerCoins) {
  let levelsToAdd = 0;
  let totalCost = 0;
  let curL = currentLevel;

  let targetLevels = 1;
  if (multMode === 10) targetLevels = 10;
  else if (multMode === 100) targetLevels = 100;
  else if (multMode === 'max') targetLevels = 5000;

  while (curL < 5000 && levelsToAdd < targetLevels) {
    const cost = getSfPlotUpgradeCost(plotIndex, curL);
    if (multMode === 'max' && totalCost + cost > playerCoins) {
      break;
    }
    totalCost += cost;
    curL++;
    levelsToAdd++;
    if (multMode !== 'max' && levelsToAdd >= targetLevels) break;
  }

  if (levelsToAdd === 0 && multMode === 'max') {
    levelsToAdd = 1;
    totalCost = getSfPlotUpgradeCost(plotIndex, currentLevel);
  }

  return {
    levelsToAdd: Math.max(1, levelsToAdd),
    totalCost,
    targetLevel: Math.min(5000, currentLevel + levelsToAdd)
  };
}

/* ==========================================================================
   AUDIO SYNTHESIS SYSTEM
   ========================================================================== */
const sunflowerAudio = {
  ctx: null,
  muted: false,
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  },
  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },
  playTone(freq, type = 'sine', duration = 0.12, gainLevel = 0.09) {
    if (this.muted) return;
    this.init(); this.resume();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainLevel, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration + 0.02);
    } catch (e) {}
  },
  playCoin() {
    if (this.muted) return;
    this.init(); this.resume();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.05);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.24);
    } catch (e) {}
  },
  playWaterSplash() {
    if (this.muted) return;
    this.init(); this.resume();
    if (!this.ctx) return;
    try {
      const bufferSize = this.ctx.sampleRate * 0.15;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);
      filter.Q.setValueAtTime(3.0, this.ctx.currentTime);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start();
    } catch (e) {}
  },
  playUnlockChime() {
    if (this.muted) return;
    this.init(); this.resume();
    if (!this.ctx) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
      setTimeout(() => this.playTone(f, 'sine', 0.2, 0.1), idx * 70);
    });
  },
  playUpgradeChime() {
    if (this.muted) return;
    this.init(); this.resume();
    if (!this.ctx) return;
    [587.33, 739.99, 880.0, 1174.66].forEach((f, idx) => {
      setTimeout(() => this.playTone(f, 'triangle', 0.18, 0.1), idx * 60);
    });
  },
  playSolarChime() {
    if (this.muted) return;
    this.init(); this.resume();
    if (!this.ctx) return;
    [659.25, 830.61, 987.77, 1318.51].forEach((f, idx) => {
      setTimeout(() => this.playTone(f, 'triangle', 0.22, 0.1), idx * 80);
    });
  }
};

function spawnSfFloat(text, x, y, color = 'text-amber-400') {
  const el = document.createElement('div');
  el.className = `floating-coin-particle ${color} text-xs sm:text-sm select-none font-bold`;
  el.innerHTML = text;
  el.style.left = `${x || window.innerWidth / 2}px`;
  el.style.top = `${y || window.innerHeight / 2}px`;
  document.body.appendChild(el);
  setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, 1100);
}

/* ==========================================================================
   NAVIGATION: 5-TAB CUSTOM BOTTOM MENU
   1: Garden | 2: Water | 3: Shop | 4: Workers | 5: Converter
   ========================================================================== */
window.navigateSunflowerPage = function(pageNum) {
  sunflowerState.currentPage = pageNum;
  sunflowerAudio.playTone(520, 'triangle', 0.08, 0.05);

  // Switch Active Page View
  for (let i = 1; i <= 5; i++) {
    const pageEl = document.getElementById(`sfPage${i}`);
    if (pageEl) {
      if (i === pageNum) {
        pageEl.classList.remove('hidden');
        pageEl.classList.add('active-page');
      } else {
        pageEl.classList.add('hidden');
        pageEl.classList.remove('active-page');
      }
    }
  }

  // Update Bottom Menu Bar Active State
  const menuMap = {
    1: 'sfMenuTabGarden',
    2: 'sfMenuTabWater',
    3: 'sfMenuTabShop',
    4: 'sfMenuTabWorkers',
    5: 'sfMenuTabConvert'
  };

  Object.values(menuMap).forEach(btnId => {
    const b = document.getElementById(btnId);
    if (b) b.classList.remove('active');
  });

  const activeBtnId = menuMap[pageNum];
  if (activeBtnId) {
    const b = document.getElementById(activeBtnId);
    if (b) b.classList.add('active');
  }

  // Align scenic backdrop position based on tab
  const stageArtwork = document.getElementById('sfStageArtwork');
  if (stageArtwork) {
    if (pageNum === 1) stageArtwork.style.backgroundPosition = 'right 20%';
    else if (pageNum === 2) stageArtwork.style.backgroundPosition = 'left 15%';
    else if (pageNum === 3) stageArtwork.style.backgroundPosition = '85% center';
    else if (pageNum === 4) stageArtwork.style.backgroundPosition = 'center top';
    else if (pageNum === 5) stageArtwork.style.backgroundPosition = 'right 35%';
  }

  const viewContainer = document.getElementById('pageSunflower');
  if (viewContainer) {
    viewContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  saveSunflowerStateDebounced();
};

/* ==========================================================================
   UPGRADE MULTIPLIER (1x, 10x, 100x, MAX)
   ========================================================================== */
window.setSfUpgradeMultiplier = function(mult) {
  sunflowerState.upgradeMultiplier = mult;
  document.querySelectorAll('.sf-mult-btn').forEach(b => {
    const m = b.getAttribute('data-mult');
    if (m === String(mult)) b.classList.add('active');
    else b.classList.remove('active');
  });
  renderSunflowerPlots();
};

/* ==========================================================================
   LAND UPGRADE & ACTION SYSTEM
   ========================================================================== */
window.upgradeSfPlot = function(plotId, event = null) {
  const plotIndex = plotId - 1;
  const plot = sunflowerState.plots[plotIndex];
  if (!plot || !plot.unlocked || plot.level >= 5000) return;

  const mult = sunflowerState.upgradeMultiplier || 1;
  const info = getSfMultiUpgradeInfo(plotIndex, plot.level, mult, sunflowerState.coins);

  if (sunflowerState.coins >= info.totalCost) {
    sunflowerState.coins -= info.totalCost;
    plot.level = info.targetLevel;

    sunflowerAudio.playUpgradeChime();
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnSfFloat(`▲ Land #${plot.id} Lv. ${plot.level} (+${info.levelsToAdd})!`, posX, posY, 'text-yellow-400');

    saveSunflowerStateDebounced();
    updateStickyHeaderAndMiniStats();
    renderSunflowerPlots();
  } else {
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnSfFloat(`Need ${formatNumber(info.totalCost)} ☀️ Coins!`, posX, posY, 'text-red-400');
  }
};

window.unlockSfPlot = function(plotId, event = null) {
  const plotIndex = plotId - 1;
  const plot = sunflowerState.plots[plotIndex];
  if (!plot || plot.unlocked) return;

  const cost = plot.unlockCost;
  if (sunflowerState.diamonds >= cost) {
    sunflowerState.diamonds -= cost;
    plot.unlocked = true;
    plot.level = 1;
    plot.progress = 0;
    plot.lifeTimer = 60;
    plot.isWithered = false;

    sunflowerAudio.playUnlockChime();
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnSfFloat(`🎉 Land #${plot.id} Unlocked (-${cost} 💎)!`, posX, posY, 'text-emerald-400');

    saveSunflowerStateDebounced();
    updateStickyHeaderAndMiniStats();
    renderSunflowerPlots();
  } else {
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnSfFloat(`Need ${cost} 💎 to unlock Land #${plot.id}!`, posX, posY, 'text-red-400');
  }
};

window.handleSfPlotClick = function(plotId, event = null) {
  const plotIndex = plotId - 1;
  const plot = sunflowerState.plots[plotIndex];
  if (!plot) return;

  if (!plot.unlocked) {
    unlockSfPlot(plotId, event);
    return;
  }

  if (plot.isWithered) {
    shovelSfPlot(plotId, event);
    return;
  }

  // Tap to water and give life bonus
  waterSfPlot(plotId, event);
};

window.waterSfPlot = function(plotId, event = null) {
  const plotIndex = plotId - 1;
  const plot = sunflowerState.plots[plotIndex];
  if (!plot || !plot.unlocked || plot.isWithered) return;

  if (sunflowerState.baskets > 0) {
    sunflowerState.baskets -= 1;
    plot.lifeTimer = Math.min(180, plot.lifeTimer + 35);
    plot.maxLifeTimer = Math.max(plot.maxLifeTimer, plot.lifeTimer);
    sunflowerAudio.playWaterSplash();
    if (event) spawnSfFloat('+35s Solar Hydration! 🧺', event.clientX, event.clientY, 'text-cyan-400');
    saveSunflowerStateDebounced();
    updateStickyHeaderAndMiniStats();
  } else {
    if (event) spawnSfFloat('No Buckets! Visit Page 2 Water Cistern 💧', event.clientX, event.clientY, 'text-red-400');
  }
};

window.shovelSfPlot = function(plotId, event = null) {
  const plotIndex = plotId - 1;
  const plot = sunflowerState.plots[plotIndex];
  if (!plot || !plot.unlocked || !plot.isWithered) return;

  if (sunflowerState.shovels > 0) {
    sunflowerState.shovels -= 1;
    plot.isWithered = false;
    plot.progress = 0;
    plot.lifeTimer = 60;
    sunflowerAudio.playTone(200, 'sawtooth', 0.2, 0.1);
    if (event) spawnSfFloat(`Plot #${plot.id} Cleared & Replanted! 🌱`, event.clientX, event.clientY, 'text-emerald-400');
    saveSunflowerStateDebounced();
    updateStickyHeaderAndMiniStats();
    renderSunflowerPlots();
  } else {
    if (event) spawnSfFloat('Need 🪏 Shovel! Buy on Page 3 Shop', event.clientX, event.clientY, 'text-red-400');
  }
};

window.waterAllSfPlots = function(event = null) {
  let watered = 0;
  sunflowerState.plots.forEach(p => {
    if (p.unlocked && !p.isWithered && sunflowerState.baskets > 0) {
      sunflowerState.baskets -= 1;
      p.lifeTimer = Math.min(180, p.lifeTimer + 35);
      watered++;
    }
  });
  if (watered > 0) {
    sunflowerAudio.playWaterSplash();
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnSfFloat(`Watered ${watered} Lands! 🧺`, posX, posY, 'text-cyan-300');
    saveSunflowerStateDebounced();
    updateStickyHeaderAndMiniStats();
  } else {
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnSfFloat('No buckets or active lands to water!', posX, posY, 'text-stone-400');
  }
};

window.shovelAllSfPlots = function(event = null) {
  let cleared = 0;
  sunflowerState.plots.forEach(p => {
    if (p.unlocked && p.isWithered && sunflowerState.shovels > 0) {
      sunflowerState.shovels -= 1;
      p.isWithered = false;
      p.progress = 0;
      p.lifeTimer = 60;
      cleared++;
    }
  });
  if (cleared > 0) {
    sunflowerAudio.playTone(200, 'sawtooth', 0.2, 0.1);
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnSfFloat(`Cleared ${cleared} Lands! 🪏`, posX, posY, 'text-emerald-400');
    saveSunflowerStateDebounced();
    updateStickyHeaderAndMiniStats();
    renderSunflowerPlots();
  }
};

/* ==========================================================================
   WORKER & AUTOMATION HQ (Walter, Dave, Elena, Leo)
   ========================================================================== */
window.hireSunflowerWorker = function(workerKey) {
  const costs = {
    walter: { coins: 500, diamonds: 10, name: 'Walter (Well Master)' },
    dave: { coins: 1500, diamonds: 25, name: 'Dave (Lands 1-5)' },
    elena: { coins: 10000, diamonds: 50, name: 'Elena (Lands 6-10 +20%)' },
    leo: { coins: 50000, diamonds: 100, name: 'Leo (Lands 11-20 2x Speed)' }
  };

  const req = costs[workerKey];
  if (!req) return;

  if (sunflowerState.workers && sunflowerState.workers[workerKey]) {
    spawnSfFloat(`${req.name} is already working! ⚡`, window.innerWidth / 2, window.innerHeight / 2, 'text-yellow-400');
    return;
  }

  // Check Coins or Diamonds
  let paidWithCoins = false;
  if (sunflowerState.coins >= req.coins) {
    sunflowerState.coins -= req.coins;
    paidWithCoins = true;
  } else if (sunflowerState.diamonds >= req.diamonds) {
    sunflowerState.diamonds -= req.diamonds;
  } else {
    spawnSfFloat(`Need ${req.coins} ☀️ Coins or ${req.diamonds} 💎!`, window.innerWidth / 2, window.innerHeight / 2, 'text-red-400');
    return;
  }

  if (!sunflowerState.workers) sunflowerState.workers = {};
  sunflowerState.workers[workerKey] = true;

  sunflowerAudio.playUnlockChime();
  spawnSfFloat(`🎉 Hired ${req.name}!`, window.innerWidth / 2, window.innerHeight / 2, 'text-emerald-400');

  saveSunflowerStateDebounced();
  updateStickyHeaderAndMiniStats();
  updateWorkersUI();
  renderSunflowerPlots();
};

function updateWorkersUI() {
  const keys = ['walter', 'dave', 'elena', 'leo'];
  keys.forEach(k => {
    const isHired = sunflowerState.workers && sunflowerState.workers[k];
    const badge = document.getElementById(`sfWorkerBadge${capitalize(k)}`);
    const btn = document.getElementById(`sfHireWorker${capitalize(k)}Btn`);
    if (badge) {
      if (isHired) {
        badge.className = "text-[9px] bg-emerald-950 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/50";
        badge.innerText = "Active ⚡";
      } else {
        badge.className = "text-[9px] bg-stone-800 text-stone-400 font-bold px-2 py-0.5 rounded-full border border-stone-700";
        badge.innerText = "Not Hired";
      }
    }
    if (btn && isHired) {
      btn.innerText = "✓ Active Automation";
      btn.className = "w-full bg-stone-800 text-emerald-400 font-bold text-xs py-2 rounded-xl cursor-default border border-emerald-500/40";
      btn.disabled = true;
    }
  });
}

/* ==========================================================================
   SOLAR REFINERY CONVERTER: 100 ☀️ Coins -> 29 ⚡ Energy
   ========================================================================== */
window.executeSfCoinToEnergy = function(amount = 100, event = null) {
  let cost = 0;
  if (amount === 'all') {
    const batches = Math.floor(sunflowerState.coins / 100);
    cost = batches * 100;
  } else {
    cost = amount;
  }

  if (cost < 100 || sunflowerState.coins < cost) {
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnSfFloat('Need at least 100 ☀️ Coins to Convert!', posX, posY, 'text-red-400');
    return;
  }

  const batches = Math.floor(cost / 100);
  const energyGain = batches * 29;

  sunflowerState.coins -= cost;
  sunflowerState.energy = (sunflowerState.energy || 0) + energyGain;

  // Synergy with Player's Core Reactor Energy
  if (typeof gameState !== 'undefined' && gameState.reactor) {
    const maxE = gameState.reactor.maxEnergy || 1000;
    gameState.reactor.currentEnergy = Math.min(maxE, (gameState.reactor.currentEnergy || 0) + energyGain);
    if (typeof updateEnergyUI === 'function') updateEnergyUI();
  }

  sunflowerAudio.playSolarChime();
  const posX = event ? event.clientX : window.innerWidth / 2;
  const posY = event ? event.clientY : window.innerHeight / 2;
  spawnSfFloat(`-${cost} ☀️ &rarr; +${energyGain} ⚡ Solar Energy!`, posX, posY, 'text-yellow-300');

  saveSunflowerStateDebounced();
  updateStickyHeaderAndMiniStats();
};

/* ==========================================================================
   RENDER 20 LANDS IN FIXED 2*10 FORMAT
   ========================================================================== */
function renderSunflowerPlots() {
  const container = document.getElementById('sfPlotsContainer');
  if (!container) return;

  const mult = sunflowerState.upgradeMultiplier || 1;
  const coins = sunflowerState.coins;

  container.innerHTML = '';

  sunflowerState.plots.forEach((plot, idx) => {
    const tile = document.createElement('div');
    tile.id = `sfPlotTile-${plot.id}`;

    if (!plot.unlocked) {
      tile.className = "sf-plot-tile locked";
      tile.innerHTML = `
        <div class="sf-tile-header">
          <span class="sf-tile-num">Land #${plot.id}</span>
          <span class="text-[9px] bg-red-950/80 text-red-300 font-bold px-1.5 py-0.2 rounded-full border border-red-800">Locked 🔒</span>
        </div>
        <div class="sf-tile-body" onclick="unlockSfPlot(${plot.id}, event)">
          <span class="sf-tile-sprite opacity-40">🪨</span>
          <div class="sf-tile-stats">
            <span class="text-[11px] font-black text-cyan-300">${plot.unlockCost} 💎</span>
            <span class="text-[9px] text-stone-400">Unlock Fee</span>
          </div>
        </div>
        <div class="sf-tile-progress-track">
          <div class="sf-tile-progress-fill" style="width: 0%"></div>
        </div>
        <button onclick="unlockSfPlot(${plot.id}, event)" class="sf-tile-up-btn bg-cyan-700 hover:bg-cyan-600">
          <span>Unlock Land 🔓</span>
        </button>
      `;
    } else {
      tile.className = "sf-plot-tile";

      const cycleTime = getSfPlotCycleTime(idx, plot.level);
      const coinsPerCycle = getSfPlotCoinsPerCycle(idx, plot.level);
      const upInfo = getSfMultiUpgradeInfo(idx, plot.level, mult, coins);
      const canAfford = coins >= upInfo.totalCost && plot.level < 5000;

      // Automated check
      const isAuto = (plot.id <= 5 && sunflowerState.workers && sunflowerState.workers.dave) ||
                     (plot.id >= 6 && plot.id <= 10 && sunflowerState.workers && sunflowerState.workers.elena) ||
                     (plot.id >= 11 && sunflowerState.workers && sunflowerState.workers.leo);

      // Status indicator
      let spriteEmoji = '🌻';
      if (plot.isWithered) spriteEmoji = '🥀';
      else if (plot.level > 1000) spriteEmoji = '☀️🌻';
      else if (plot.level > 2500) spriteEmoji = '✨🌻';

      const timeText = cycleTime < 0.1 ? '⚡ Hyper' : `${cycleTime.toFixed(1)}s`;
      const isHyper = cycleTime < 0.1;

      tile.innerHTML = `
        <div class="sf-tile-header">
          <span class="sf-tile-num">Land #${plot.id}</span>
          <span class="sf-tile-level-badge" id="sfPlotLvBadge-${plot.id}">Lv. ${plot.level}/5000</span>
        </div>

        <div class="sf-tile-body" onclick="handleSfPlotClick(${plot.id}, event)">
          <span class="sf-tile-sprite">${spriteEmoji}</span>
          <div class="sf-tile-stats">
            <span class="sf-tile-output" id="sfPlotOut-${plot.id}">+${formatNumber(coinsPerCycle)} ☀️</span>
            <span class="sf-tile-timer" id="sfPlotTime-${plot.id}">⏱️ ${timeText}</span>
          </div>
        </div>

        <div class="sf-tile-progress-track">
          <div class="sf-tile-progress-fill ${isHyper ? 'speed-hyper' : ''}" id="sfPlotProg-${plot.id}" style="width: ${isHyper ? '100%' : (plot.progress * 100) + '%'}"></div>
        </div>

        <button onclick="upgradeSfPlot(${plot.id}, event)" id="sfPlotUpBtn-${plot.id}" class="sf-tile-up-btn ${!canAfford ? 'disabled' : ''}">
          <span>▲ Lv. ${plot.level < 5000 ? upInfo.targetLevel : 'MAX'} (${plot.level < 5000 ? formatNumber(upInfo.totalCost) + ' 🪙' : 'MAX'})</span>
        </button>
      `;
    }

    container.appendChild(tile);
  });
}

/* ==========================================================================
   GAME LOOP & RESOURCE ADVANCEMENT
   ========================================================================== */
let sfLastFrameTime = performance.now();
let sfIncomeSecondAccumulator = 0;

function sunflowerMainLoop(now) {
  const dt = Math.min(1.0, (now - sfLastFrameTime) / 1000);
  sfLastFrameTime = now;

  let gardenTotalCps = 0;

  // 1. Water Cistern Automation (Walter) & Simulation
  const currentFillSpeed = sunflowerState.cistern.boostTimerRemaining > 0 ? 2.0 : 4.0;
  if (sunflowerState.cistern.boostTimerRemaining > 0) {
    sunflowerState.cistern.boostTimerRemaining = Math.max(0, sunflowerState.cistern.boostTimerRemaining - dt);
  }

  if (sunflowerState.cistern.basketsInCrate < sunflowerState.cistern.maxCrateCapacity) {
    sunflowerState.cistern.currentProgress += dt;
    if (sunflowerState.cistern.currentProgress >= currentFillSpeed) {
      sunflowerState.cistern.currentProgress = 0;
      sunflowerState.cistern.basketsInCrate += 1;

      // Walter Worker automatically collects baskets directly into inventory!
      if (sunflowerState.workers && sunflowerState.workers.walter) {
        sunflowerState.baskets += sunflowerState.cistern.basketsInCrate;
        sunflowerState.cistern.basketsInCrate = 0;
      }
    }
  }

  // 2. Advance All 20 Lands
  sunflowerState.plots.forEach((plot, idx) => {
    if (!plot.unlocked) return;

    const cycleTime = getSfPlotCycleTime(idx, plot.level);
    const coinsPerCycle = getSfPlotCoinsPerCycle(idx, plot.level);
    const isAuto = (plot.id <= 5 && sunflowerState.workers && sunflowerState.workers.dave) ||
                   (plot.id >= 6 && plot.id <= 10 && sunflowerState.workers && sunflowerState.workers.elena) ||
                   (plot.id >= 11 && sunflowerState.workers && sunflowerState.workers.leo) ||
                   (cycleTime < 0.1);

    // Life timer countdown if not withered
    if (plot.lifeTimer > 0) {
      plot.lifeTimer = Math.max(0, plot.lifeTimer - dt);
      if (plot.lifeTimer === 0 && !isAuto) {
        plot.isWithered = true;
      }
    }

    if (plot.isWithered) return;

    if (cycleTime < 0.1) {
      // Hyper rate-based continuous generation
      const rate = coinsPerCycle / cycleTime;
      gardenTotalCps += rate;
      sunflowerState.coins += rate * dt;
    } else {
      gardenTotalCps += coinsPerCycle / cycleTime;
      plot.progress += dt / cycleTime;

      if (plot.progress >= 1.0) {
        plot.progress = 0;
        sunflowerState.coins += coinsPerCycle;
      }

      // Update progress bar DOM directly for smooth 60fps rendering
      const barEl = document.getElementById(`sfPlotProg-${plot.id}`);
      if (barEl) {
        barEl.style.width = `${Math.min(100, Math.floor(plot.progress * 100))}%`;
      }
    }
  });

  // 3. Update Income Rate Display
  sfIncomeSecondAccumulator += dt;
  if (sfIncomeSecondAccumulator >= 0.5) {
    sfIncomeSecondAccumulator = 0;
    const rateEl = document.getElementById('sfTotalIncomeRate');
    if (rateEl) rateEl.innerText = formatNumber(gardenTotalCps);
    updateStickyHeaderAndMiniStats();
    updateLiveUpgradeButtons();
  }

  requestAnimationFrame(sunflowerMainLoop);
}

// Update live upgrade button affordances without full re-render
function updateLiveUpgradeButtons() {
  const mult = sunflowerState.upgradeMultiplier || 1;
  const coins = sunflowerState.coins;

  sunflowerState.plots.forEach((plot, idx) => {
    if (!plot.unlocked) return;
    const btn = document.getElementById(`sfPlotUpBtn-${plot.id}`);
    if (btn) {
      const upInfo = getSfMultiUpgradeInfo(idx, plot.level, mult, coins);
      const canAfford = coins >= upInfo.totalCost && plot.level < 5000;
      if (canAfford) btn.classList.remove('disabled');
      else btn.classList.add('disabled');
    }
  });
}

function updateStickyHeaderAndMiniStats() {
  // Sticky Header Bar Balances
  const sCoins = document.getElementById('sfStickyCoins');
  const sBaskets = document.getElementById('sfStickyBaskets');
  const sShovels = document.getElementById('sfStickyShovels');
  const sDiamonds = document.getElementById('sfStickyDiamonds');

  if (sCoins) sCoins.innerText = formatNumber(Math.floor(sunflowerState.coins));
  if (sBaskets) sBaskets.innerText = sunflowerState.baskets;
  if (sShovels) sShovels.innerText = sunflowerState.shovels;
  if (sDiamonds) sDiamonds.innerText = sunflowerState.diamonds;

  // Energy Page Hub Card Balances
  const eCoins = document.getElementById('sfEntryCoins');
  const eBaskets = document.getElementById('sfEntryBaskets');
  const eShovels = document.getElementById('sfEntryShovels');

  if (eCoins) eCoins.innerText = formatNumber(Math.floor(sunflowerState.coins));
  if (eBaskets) eBaskets.innerText = sunflowerState.baskets;
  if (eShovels) eShovels.innerText = sunflowerState.shovels;

  // Page 2 & Page 5 displays
  const invB = document.getElementById('sfInvBaskets');
  const crateC = document.getElementById('sfCrateCounter');
  const wallB = document.getElementById('sfWallStorageBaskets');
  const collBadge = document.getElementById('sfCollectableBadge');
  const convCoin = document.getElementById('sfConvCoinDisplay');
  const convTot = document.getElementById('sfConvTotalEnergyDisplay');

  if (invB) invB.innerText = `${sunflowerState.baskets} 🧺`;
  if (crateC) crateC.innerText = sunflowerState.cistern.basketsInCrate;
  if (wallB) wallB.innerText = `${sunflowerState.cistern.basketsInCrate} / 5 🧺`;
  if (collBadge) collBadge.innerText = sunflowerState.cistern.basketsInCrate;
  if (convCoin) convCoin.innerText = `${formatNumber(Math.floor(sunflowerState.coins))} ☀️`;
  if (convTot) convTot.innerText = `${formatNumber(sunflowerState.energy || 0)} ⚡`;
}

/* ==========================================================================
   INITIALIZATION & SHOP / AD HOOKS
   ========================================================================== */
function initSunflowerTycoonGame() {
  // Bind Cistern Collect Button
  const collBtn = document.getElementById('sfCollectBasketsBtn');
  if (collBtn) {
    collBtn.onclick = () => {
      const amt = sunflowerState.cistern.basketsInCrate;
      if (amt > 0) {
        sunflowerState.baskets += amt;
        sunflowerState.cistern.basketsInCrate = 0;
        sunflowerAudio.playWaterSplash();
        spawnSfFloat(`+${amt} Baskets Collected! 🧺`, window.innerWidth / 2, window.innerHeight / 2, 'text-cyan-400');
        saveSunflowerStateDebounced();
        updateStickyHeaderAndMiniStats();
      }
    };
  }

  // Diamond Sprout Purchase
  const buySprout = document.getElementById('sfBuySproutDiamondBtn');
  if (buySprout) {
    buySprout.onclick = () => {
      const price = sunflowerState.sproutDiamondCost || 1;
      if (sunflowerState.diamonds >= price) {
        sunflowerState.diamonds -= price;
        sunflowerState.sproutDiamondCost = price + 1;
        sunflowerAudio.playTone(600, 'triangle', 0.15, 0.1);
        spawnSfFloat(`Planted Sprout! (-${price} 💎)`, window.innerWidth / 2, window.innerHeight / 2, 'text-emerald-400');
        saveSunflowerStateDebounced();
        updateStickyHeaderAndMiniStats();
      }
    };
  }

  // Diamond Shovel Purchase
  const buyShovel = document.getElementById('sfBuyShovelDiamondBtn');
  if (buyShovel) {
    buyShovel.onclick = () => {
      if (sunflowerState.diamonds >= 10) {
        sunflowerState.diamonds -= 10;
        sunflowerState.shovels += 1;
        sunflowerAudio.playTone(400, 'sine', 0.15, 0.1);
        spawnSfFloat('+1 Shovel Acquired! 🪏', window.innerWidth / 2, window.innerHeight / 2, 'text-stone-300');
        saveSunflowerStateDebounced();
        updateStickyHeaderAndMiniStats();
      }
    };
  }

  // Diamond Basket Purchase
  const buyBasket = document.getElementById('sfBuyBasketDiamondBtn');
  if (buyBasket) {
    buyBasket.onclick = () => {
      if (sunflowerState.diamonds >= 2) {
        sunflowerState.diamonds -= 2;
        sunflowerState.baskets += 1;
        sunflowerAudio.playWaterSplash();
        spawnSfFloat('+1 Basket Acquired! 🧺', window.innerWidth / 2, window.innerHeight / 2, 'text-cyan-300');
        saveSunflowerStateDebounced();
        updateStickyHeaderAndMiniStats();
      }
    };
  }

  // Overdrive Boost Purchase
  const buyBoost = document.getElementById('sfBuyBoostDiamondBtn');
  if (buyBoost) {
    buyBoost.onclick = () => {
      if (sunflowerState.diamonds >= 8) {
        sunflowerState.diamonds -= 8;
        sunflowerState.cistern.boostTimerRemaining += 60;
        sunflowerAudio.playSolarChime();
        spawnSfFloat('⚡ 2x Pump Speed Active for 60s!', window.innerWidth / 2, window.innerHeight / 2, 'text-yellow-400');
        saveSunflowerStateDebounced();
        updateStickyHeaderAndMiniStats();
      }
    };
  }

  // Sound Toggle
  const sndBtn = document.getElementById('sfSoundBtn');
  if (sndBtn) {
    sndBtn.onclick = () => {
      sunflowerAudio.muted = !sunflowerAudio.muted;
      sndBtn.innerText = sunflowerAudio.muted ? '🔇' : '🔊';
    };
  }

  // Render initial plots and update UI
  renderSunflowerPlots();
  updateStickyHeaderAndMiniStats();
  updateWorkersUI();

  // Start Main Loop
  requestAnimationFrame(sunflowerMainLoop);
}

// Number Formatter Helper (e.g. 1.2K, 3.4M, 5.6B)
function formatNumber(num) {
  if (typeof num !== 'number' || isNaN(num)) return '0';
  if (num < 1000) return num.toLocaleString();
  if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
  if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
  if (num < 1000000000000) return (num / 1000000000).toFixed(1) + 'B';
  return (num / 1000000000000).toFixed(1) + 'T';
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Master Panoramic Image Inspection Modal Helpers
function openSunflowerImageViewer() {
  const modal = document.getElementById('sfImageViewerModal');
  if (modal) modal.classList.remove('hidden');
}

function closeSunflowerImageViewer() {
  const modal = document.getElementById('sfImageViewerModal');
  if (modal) modal.classList.add('hidden');
}

// Global Exports
window.openSunflowerImageViewer = openSunflowerImageViewer;
window.closeSunflowerImageViewer = closeSunflowerImageViewer;
window.initSunflowerTycoonGame = initSunflowerTycoonGame;
window.renderSunflowerPlots = renderSunflowerPlots;
window.updateSunflowerMiniStats = updateStickyHeaderAndMiniStats;
window.executeSfCoinToEnergy = executeSfCoinToEnergy;

// Auto-run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSunflowerTycoonGame);
} else {
  initSunflowerTycoonGame();
}
