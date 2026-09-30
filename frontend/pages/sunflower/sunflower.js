/* ==========================================================================
   SUNFLOWER SOLAR TYCOON ENGINE (pages/sunflower/sunflower.js)
   - 20 Lands in Rectangular Card Layout (Levels 1 to 5000)
   - 30s Growth Phase -> 40s Base Lifetime upon Mature Bloom
   - Water Bucket: +10s Life Extension (Level 1 Cap: 120s, +5s added per Level Upgrade)
   - Shovel: Clears Withered/Dead Sunflowers -> Buy Plant -> Restart at Level 1
   - Workers HQ: 2 Top Tabs for Farming Workers & Water Workers
   - Firebase Realtime Database Integration & Cloud Sync in Every Action
   ========================================================================== */

const SF_STORAGE_KEY = 'ENERGY_TAP_SUNFLOWER_STATE_V3';

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

// ==========================================================================
// 20 WELLS AQUIFER CONFIGURATION (FIXED 1*20 FORMAT)
// - Well 1 is Free: Produces 1 Basket after 5s
// - Wells 2 to 20: Progressive unlock costs, cycle times & basket outputs
// - Well Workers: Assignable workers for continuous automated basket creation
// ==========================================================================
const SF_WELL_UNLOCK_COSTS = [
  0,      // Well 1: Free (5s base, 1 basket)
  10,     // Well 2: 10 💎
  30,     // Well 3: 30 💎
  75,     // Well 4: 75 💎
  150,    // Well 5: 150 💎
  300,    // Well 6: 300 💎
  500,    // Well 7: 500 💎
  800,    // Well 8: 800 💎
  1200,   // Well 9: 1200 💎
  1800,   // Well 10: 1800 💎
  2500,   // Well 11: 2500 💎
  3500,   // Well 12: 3500 💎
  5000,   // Well 13: 5000 💎
  7000,   // Well 14: 7000 💎
  9500,   // Well 15: 9500 💎
  13000,  // Well 16: 13000 💎
  18000,  // Well 17: 18000 💎
  25000,  // Well 18: 25000 💎
  35000,  // Well 19: 35000 💎
  50000   // Well 20: 50000 💎
];

// 20 Wells Base Starting Cycle Times (Well 1: 5s base)
const SF_WELL_BASE_TIMES = [
  5,        // Well 1: 5s (Exact user specification!)
  10,       // Well 2: 10s
  20,       // Well 3: 20s
  35,       // Well 4: 35s
  60,       // Well 5: 1m
  90,       // Well 6: 1.5m
  120,      // Well 7: 2m
  180,      // Well 8: 3m
  240,      // Well 9: 4m
  300,      // Well 10: 5m
  420,      // Well 11: 7m
  600,      // Well 12: 10m
  900,      // Well 13: 15m
  1200,     // Well 14: 20m
  1800,     // Well 15: 30m
  2700,     // Well 16: 45m
  3600,     // Well 17: 1h
  5400,     // Well 18: 1.5h
  7200,     // Well 19: 2h
  10800     // Well 20: 3h
];

// 20 Wells Base Basket Production per Cycle (Well 1: 1 basket)
const SF_WELL_BASE_BASKETS = [
  1,        // Well 1: 1 basket (Exact user specification!)
  2,        // Well 2: 2 baskets
  3,        // Well 3: 3 baskets
  5,        // Well 4: 5 baskets
  8,        // Well 5: 8 baskets
  12,       // Well 6: 12 baskets
  16,       // Well 7: 16 baskets
  22,       // Well 8: 22 baskets
  30,       // Well 9: 30 baskets
  40,       // Well 10: 40 baskets
  55,       // Well 11: 55 baskets
  75,       // Well 12: 75 baskets
  100,      // Well 13: 100 baskets
  140,      // Well 14: 140 baskets
  200,      // Well 15: 200 baskets
  300,      // Well 16: 300 baskets
  450,      // Well 17: 450 baskets
  700,      // Well 18: 700 baskets
  1000,     // Well 19: 1000 baskets
  1500      // Well 20: 1500 baskets
];

const SF_WELL_NAMES = [
  "Mountain Spring Well #1",
  "Valley Aquifer Well #2",
  "Pebble Creek Well #3",
  "Deep Geyser Well #4",
  "Glacier Fountain Well #5",
  "Crystal Borehole Well #6",
  "Emerald Artesian Well #7",
  "Sunstone Cistern Well #8",
  "Golden Cascades Well #9",
  "Highland Basin Well #10",
  "Riverhead Siphon Well #11",
  "Sapphire Reservoir Well #12",
  "Quartz Spring Well #13",
  "Cobalt Torrent Well #14",
  "Obsidian Trench Well #15",
  "Celestial Aqueduct Well #16",
  "Solar Spring Well #17",
  "Radiant Basin Well #18",
  "Infinity Flow Well #19",
  "Apex Ocean Well #20"
];

// 20 Lands Base Starting Cycle Times (at Level 1)
const SF_LAND_BASE_TIMES = [
  5,        // Land 1: 5s
  30,       // Land 2: 30s
  60,       // Land 3: 1m
  300,      // Land 4: 5m
  600,      // Land 5: 10m
  900,      // Land 6: 15m
  1200,     // Land 7: 20m
  1800,     // Land 8: 30m
  2700,     // Land 9: 45m
  3600,     // Land 10: 1h
  5400,     // Land 11: 1.5h
  7200,     // Land 12: 2h
  10800,    // Land 13: 3h
  14400,    // Land 14: 4h
  18000,    // Land 15: 5h
  21600,    // Land 16: 6h
  28800,    // Land 17: 8h
  36000,    // Land 18: 10h
  43200,    // Land 19: 12h
  86400     // Land 20: 24h
];

// Max Life Limit Formula: Level 1 = 120s limit, +5s added per level upgrade
function getSfPlotMaxLifeLimit(level) {
  const L = Math.max(1, level || 1);
  return 120 + (L - 1) * 5;
}

function createDefaultSfPlots() {
  const plots = [];
  for (let i = 1; i <= 20; i++) {
    const isUnlocked = i === 1;
    const baseTime = SF_LAND_BASE_TIMES[i - 1];
    plots.push({
      id: i,
      unlocked: isUnlocked,
      unlockCost: SF_LAND_UNLOCK_COSTS[i - 1],
      level: 1, // Levels 1 to 5000
      plantStatus: isUnlocked ? 'alive' : 'empty', // 'empty' | 'growing' | 'alive' | 'dead'
      growthTimer: 0,
      growthDuration: 30.0, // 30 seconds proper growth
      lifeTimer: isUnlocked ? 40.0 : 0, // Starts at 40s once grown
      productionTime: baseTime,
      coinProduction: 1,
      upgradeCost: 10,
      timer: baseTime,
      totalCoinsGenerated: 0,
      progress: 0,
      isWithered: false,
      lastTick: Date.now()
    });
  }
  return plots;
}

function createDefaultSfWells() {
  const wells = [];
  for (let i = 1; i <= 20; i++) {
    const isUnlocked = i === 1;
    const baseTime = SF_WELL_BASE_TIMES[i - 1];
    const baseBaskets = SF_WELL_BASE_BASKETS[i - 1];
    wells.push({
      id: i,
      name: SF_WELL_NAMES[i - 1],
      unlocked: isUnlocked,
      unlockCost: SF_WELL_UNLOCK_COSTS[i - 1],
      level: 1, // Levels 1 to 5000
      productionTime: baseTime,
      basketProduction: baseBaskets,
      upgradeCost: Math.round(baseBaskets * 30 + 20),
      timer: baseTime,
      storedBaskets: 0,
      maxStorage: Math.max(5, baseBaskets * 5),
      hasWorker: false,
      totalBasketsGenerated: 0,
      lastTick: Date.now()
    });
  }
  return wells;
}

function loadInitialSunflowerState() {
  try {
    const raw = localStorage.getItem(SF_STORAGE_KEY) || localStorage.getItem('ENERGY_TAP_SUNFLOWER_STATE_V2') || localStorage.getItem('ENERGY_TAP_SUNFLOWER_STATE_V1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.plots) && parsed.plots.length === 20) {
        parsed.plots.forEach((p, idx) => {
          if (typeof p.level !== 'number') p.level = 1;
          p.level = Math.min(5000, Math.max(1, p.level));
          if (typeof p.unlockCost !== 'number') p.unlockCost = SF_LAND_UNLOCK_COSTS[idx];
          p.productionTime = getSfPlotCycleTime(idx, p.level);
          p.coinProduction = getSfPlotCoinsPerCycle(idx, p.level);
          p.upgradeCost = getSfPlotUpgradeCost(idx, p.level);
          if (typeof p.timer !== 'number') p.timer = p.productionTime;
          if (typeof p.totalCoinsGenerated !== 'number') p.totalCoinsGenerated = 0;
          if (typeof p.growthDuration !== 'number') p.growthDuration = 30.0;
          if (typeof p.growthTimer !== 'number') p.growthTimer = 0;

          // Migrate plantStatus
          if (!p.plantStatus) {
            if (!p.unlocked) p.plantStatus = 'empty';
            else if (p.isWithered) p.plantStatus = 'dead';
            else p.plantStatus = 'alive';
          }

          if (typeof p.lifeTimer !== 'number') {
            p.lifeTimer = (p.plantStatus === 'alive') ? 40.0 : 0;
          }
          if (p.isWithered || (p.plantStatus === 'alive' && p.lifeTimer <= 0)) {
            p.plantStatus = 'dead';
            p.isWithered = true;
          }
        });

        // Wells Migration & Initialization
        if (!Array.isArray(parsed.wells) || parsed.wells.length !== 20) {
          parsed.wells = createDefaultSfWells();
        } else {
          parsed.wells.forEach((w, idx) => {
            if (typeof w.level !== 'number') w.level = 1;
            w.level = Math.min(5000, Math.max(1, w.level));
            if (typeof w.unlockCost !== 'number') w.unlockCost = SF_WELL_UNLOCK_COSTS[idx];
            w.productionTime = getSfWellCycleTime(idx, w.level);
            w.basketProduction = getSfWellBasketsPerCycle(idx, w.level);
            w.upgradeCost = getSfWellUpgradeCost(idx, w.level);
            if (typeof w.timer !== 'number') w.timer = w.productionTime;
            if (typeof w.storedBaskets !== 'number') w.storedBaskets = 0;
            if (typeof w.maxStorage !== 'number') w.maxStorage = Math.max(5, w.basketProduction * 5);
            if (typeof w.hasWorker !== 'boolean') w.hasWorker = false;
            if (typeof w.totalBasketsGenerated !== 'number') w.totalBasketsGenerated = 0;
            if (!w.name) w.name = SF_WELL_NAMES[idx];

            // Offline catchup for automated well workers
            if (w.unlocked && w.hasWorker && w.lastTick) {
              const elapsedSec = (Date.now() - w.lastTick) / 1000;
              if (elapsedSec > 0 && w.productionTime > 0) {
                const cycles = Math.floor(elapsedSec / w.productionTime);
                if (cycles > 0) {
                  const gained = cycles * w.basketProduction;
                  parsed.baskets = (parsed.baskets || 0) + gained;
                  w.totalBasketsGenerated = (w.totalBasketsGenerated || 0) + gained;
                }
              }
            }
            w.lastTick = Date.now();
          });
        }

        if (typeof parsed.wellWorkersCount !== 'number') {
          const assigned = parsed.wells.filter(w => w.hasWorker).length;
          parsed.wellWorkersCount = assigned;
        }

        if (typeof parsed.seeds !== 'number') parsed.seeds = 3;
        if (typeof parsed.baskets !== 'number') parsed.baskets = 2;
        if (typeof parsed.shovels !== 'number') parsed.shovels = 1;
        if (!parsed.workers) {
          parsed.workers = { walter: false, dave: false, elena: false, leo: false, barney: false, chloe: false };
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
    seeds: 3,        // Sunflower plants / seeds in inventory
    baskets: 2,      // Water buckets
    shovels: 1,      // Shovels to clear dead plants
    upgradeMultiplier: 1, // 1, 10, 100, or 'max'
    wellWorkersCount: 0, // Total hired well workers
    workers: {
      walter: false, // Water Worker: auto-pumps cistern spring water & boosts wells
      chloe: false,  // Water Worker: auto-waters plants when life < 30s
      dave: false,   // Farming Worker: auto-harvests lands 1-5
      elena: false,  // Farming Worker: auto-harvests lands 6-10 + 20% coin boost
      leo: false,    // Farming Worker: auto-harvests lands 11-20 + 2x speed
      barney: false  // Farming Worker: auto-plants seeds into empty plots
    },
    cistern: {
      basketsInCrate: 0,
      maxCrateCapacity: 5,
      baseFillSeconds: 4.0,
      currentProgress: 0,
      boostTimerRemaining: 0
    },
    isWaterCollecting: false,
    plots: createDefaultSfPlots(),
    wells: createDefaultSfWells()
  };
}

const sunflowerState = loadInitialSunflowerState();
sunflowerState._diamonds = sunflowerState.diamonds || 25;
sunflowerState._coins = sunflowerState.coins || 150;

Object.defineProperty(sunflowerState, 'diamonds', {
  get() {
    if (typeof window !== 'undefined' && window.gameState && window.gameState.player && typeof window.gameState.player.diamonds === 'number') {
      return window.gameState.player.diamonds;
    }
    return this._diamonds || 0;
  },
  set(val) {
    const num = Math.max(0, Number(val) || 0);
    this._diamonds = num;
    if (typeof window !== 'undefined' && window.gameState && window.gameState.player) {
      window.gameState.player.diamonds = num;
      if (typeof window.updateUI === 'function') window.updateUI();
      if (typeof window.saveGame === 'function') window.saveGame(true);
    }
  }
});

Object.defineProperty(sunflowerState, 'coins', {
  get() {
    if (typeof window !== 'undefined' && window.gameState && window.gameState.player && typeof window.gameState.player.coins === 'number') {
      return window.gameState.player.coins;
    }
    return this._coins || 0;
  },
  set(val) {
    const num = Math.max(0, Number(val) || 0);
    this._coins = num;
    if (typeof window !== 'undefined' && window.gameState && window.gameState.player) {
      window.gameState.player.coins = num;
      if (typeof window.updateUI === 'function') window.updateUI();
      if (typeof window.saveGame === 'function') window.saveGame(true);
    }
  }
});

window.sunflowerState = sunflowerState;

/* ==========================================================================
   FIREBASE REALTIME CLOUD SYNCHRONIZATION
   ========================================================================== */
let sfSaveTimeout = null;
function saveSunflowerStateDebounced() {
  if (sfSaveTimeout) return;
  sfSaveTimeout = setTimeout(() => {
    sfSaveTimeout = null;
    try {
      localStorage.setItem(SF_STORAGE_KEY, JSON.stringify(sunflowerState));
    } catch (e) {}
    syncSunflowerToFirebase();
  }, 1000);
}

function syncSunflowerToFirebase() {
  if (typeof window !== 'undefined' && window.firebaseSync) {
    const fs = window.firebaseSync;
    if (fs.database && fs.userId) {
      updateFirebaseCloudBadge('saving');
      fs.database.ref(`players/${fs.userId}/sunflower`).set(sunflowerState)
        .then(() => {
          updateFirebaseCloudBadge('synced');
        })
        .catch(() => {
          updateFirebaseCloudBadge('offline');
        });
    }
  }
}

function updateFirebaseCloudBadge(status) {
  const dot = document.getElementById('sfFbDot');
  const label = document.getElementById('sfFbLabel');
  if (!dot || !label) return;

  if (status === 'synced') {
    dot.className = 'sf-cloud-dot online';
    label.innerText = 'Cloud Synced';
  } else if (status === 'saving') {
    dot.className = 'sf-cloud-dot syncing';
    label.innerText = 'Saving...';
  } else {
    dot.className = 'sf-cloud-dot offline';
    label.innerText = 'Offline';
  }
}

window.syncSunflowerFromCloud = function(cloudSunflower) {
  if (!cloudSunflower || typeof cloudSunflower !== 'object') return;
  try {
    if (Array.isArray(cloudSunflower.plots) && cloudSunflower.plots.length === 20) {
      sunflowerState.plots = cloudSunflower.plots;
    }
    if (Array.isArray(cloudSunflower.wells) && cloudSunflower.wells.length === 20) {
      sunflowerState.wells = cloudSunflower.wells;
    }
    if (typeof cloudSunflower.wellWorkersCount === 'number') {
      sunflowerState.wellWorkersCount = cloudSunflower.wellWorkersCount;
    }
    if (typeof cloudSunflower.coins === 'number') sunflowerState.coins = cloudSunflower.coins;
    if (typeof cloudSunflower.seeds === 'number') sunflowerState.seeds = cloudSunflower.seeds;
    if (typeof cloudSunflower.baskets === 'number') sunflowerState.baskets = cloudSunflower.baskets;
    if (typeof cloudSunflower.shovels === 'number') sunflowerState.shovels = cloudSunflower.shovels;
    if (cloudSunflower.workers) sunflowerState.workers = Object.assign(sunflowerState.workers || {}, cloudSunflower.workers);
    if (cloudSunflower.cistern) sunflowerState.cistern = Object.assign(sunflowerState.cistern || {}, cloudSunflower.cistern);
    renderSunflowerPlots();
    renderSunflowerWells();
    updateStickyHeaderAndMiniStats();
    updateWorkersUI();
    updateFirebaseCloudBadge('synced');
  } catch (e) {
    console.warn('Failed to apply cloud sunflower state:', e);
  }
};

/* ==========================================================================
   FORMULAS: SPEED, OUTPUT & UPGRADE COSTS (Levels 1 to 5000)
   ========================================================================== */

function getSfPlotCycleTime(plotIndex, level) {
  const baseTime = SF_LAND_BASE_TIMES[plotIndex] || 5;
  const L = Math.min(5000, Math.max(1, level || 1));
  if (L >= 5000) return 0.001;

  let time = baseTime * Math.pow(0.001 / baseTime, (L - 1) / 4999);

  // Leo Worker speed boost (halves cycle duration)
  if (sunflowerState && sunflowerState.workers && sunflowerState.workers.leo) {
    time = time / 2;
  }
  return Math.max(0.001, time);
}

function getSfPlotCoinsPerCycle(plotIndex, level) {
  const L = Math.min(5000, Math.max(1, level || 1));
  let baseCoins = 1;

  if (L === 1) baseCoins = 1;
  else if (L === 2) baseCoins = 50;
  else if (L === 3) baseCoins = 500;
  else if (L === 4) baseCoins = 5000;
  else {
    baseCoins = Math.floor(5000 * Math.pow(1.025, L - 4));
  }

  // Elena Worker output boost (+20%)
  if (sunflowerState && sunflowerState.workers && sunflowerState.workers.elena) {
    baseCoins = Math.round(baseCoins * 1.2);
  }
  return Math.max(1, baseCoins);
}

function getSfPlotUpgradeCost(plotIndex, level) {
  const L = Math.min(5000, Math.max(1, level || 1));
  if (L >= 5000) return Infinity;
  const coinsGen = getSfPlotCoinsPerCycle(plotIndex, L);
  return Math.round(coinsGen * 10);
}

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
    if (cost === Infinity) break;
    if (multMode === 'max' && totalCost + cost > playerCoins && levelsToAdd > 0) {
      break;
    }
    totalCost += cost;
    curL++;
    levelsToAdd++;
    if (multMode !== 'max' && levelsToAdd >= targetLevels) break;
  }

  if (levelsToAdd === 0) {
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
   FORMULAS: 20 WELLS SPEED, OUTPUT & UPGRADE COSTS (Levels 1 to 5000)
   ========================================================================== */

function getSfWellCycleTime(wellIndex, level) {
  const baseTime = SF_WELL_BASE_TIMES[wellIndex] || 5;
  const L = Math.min(5000, Math.max(1, level || 1));
  if (L >= 5000) return 0.05;

  let time = baseTime * Math.pow(0.05 / baseTime, (L - 1) / 4999);

  // Walter Aquifer Grandmaster speed boost (+25% speed => time / 1.25)
  if (sunflowerState && sunflowerState.workers && sunflowerState.workers.walter) {
    time = time / 1.25;
  }
  return Math.max(0.05, time);
}

function getSfWellBasketsPerCycle(wellIndex, level) {
  const baseBaskets = SF_WELL_BASE_BASKETS[wellIndex] || 1;
  const L = Math.min(5000, Math.max(1, level || 1));
  if (L === 1) return baseBaskets;
  return Math.floor(baseBaskets * (1 + (L - 1) * 0.1));
}

function getSfWellUpgradeCost(wellIndex, level) {
  const L = Math.min(5000, Math.max(1, level || 1));
  if (L >= 5000) return Infinity;
  const baseCoins = (wellIndex + 1) * 25;
  return Math.round(baseCoins * Math.pow(1.05, L - 1));
}

function getSfWellMultiUpgradeInfo(wellIndex, currentLevel, multMode, playerCoins) {
  let levelsToAdd = 0;
  let totalCost = 0;
  let curL = currentLevel;

  let targetLevels = 1;
  if (multMode === 10) targetLevels = 10;
  else if (multMode === 100) targetLevels = 100;
  else if (multMode === 'max') targetLevels = 5000;

  while (curL < 5000 && levelsToAdd < targetLevels) {
    const cost = getSfWellUpgradeCost(wellIndex, curL);
    if (cost === Infinity) break;
    if (multMode === 'max' && totalCost + cost > playerCoins && levelsToAdd > 0) {
      break;
    }
    totalCost += cost;
    curL++;
    levelsToAdd++;
    if (multMode !== 'max' && levelsToAdd >= targetLevels) break;
  }

  if (levelsToAdd === 0) {
    levelsToAdd = 1;
    totalCost = getSfWellUpgradeCost(wellIndex, currentLevel);
  }

  return {
    levelsToAdd: Math.max(1, levelsToAdd),
    totalCost,
    targetLevel: Math.min(5000, currentLevel + levelsToAdd)
  };
}

function getAssignedWellWorkersCount() {
  if (!sunflowerState || !Array.isArray(sunflowerState.wells)) return 0;
  return sunflowerState.wells.filter(w => w.hasWorker).length;
}
window.getAssignedWellWorkersCount = getAssignedWellWorkersCount;

function getIdleWellWorkersCount() {
  const total = sunflowerState.wellWorkersCount || 0;
  const assigned = getAssignedWellWorkersCount();
  return Math.max(0, total - assigned);
}
window.getIdleWellWorkersCount = getIdleWellWorkersCount;

function formatTimerText(seconds, cycleTime) {
  if (cycleTime < 0.05) return '0.001s';
  const sec = Math.max(0, seconds || 0);
  if (sec >= 3600) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    return `${h}h ${m}m ${s < 10 ? '0' : ''}${s}s`;
  }
  if (sec >= 60) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }
  return `${sec.toFixed(1)}s`;
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

  // Ensure upper game heading remains pinned, fully visible, and not scrolled off
  const viewContainer = document.getElementById('pageSunflower');
  if (viewContainer) {
    viewContainer.scrollTop = 0;
  }
  const appContainer = document.querySelector('.mobile-container') || document.querySelector('.app-container');
  if (appContainer) {
    appContainer.scrollTop = 0;
  }
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  // Explicitly ensure the sticky top header bar is visible and flex layout intact
  const stickyHdr = document.getElementById('sfStickyHeader');
  if (stickyHdr) {
    stickyHdr.style.display = 'flex';
    stickyHdr.style.visibility = 'visible';
    stickyHdr.style.opacity = '1';
  }

  if (pageNum === 1) renderSunflowerPlots();
  if (pageNum === 2) renderSunflowerWells();
  if (pageNum === 4) updateWorkersUI();

  saveSunflowerStateDebounced();
};

/* ==========================================================================
   WORKER PAGE SUBTABS (Farming / Water)
   ========================================================================== */
window.switchSunflowerWorkerSubtab = function(tabKey) {
  const farmBtn = document.getElementById('sfWorkerTabFarming');
  const waterBtn = document.getElementById('sfWorkerTabWater');
  const farmSec = document.getElementById('sfWorkerSectionFarming');
  const waterSec = document.getElementById('sfWorkerSectionWater');

  if (tabKey === 'farming') {
    if (farmBtn) farmBtn.classList.add('active');
    if (waterBtn) waterBtn.classList.remove('active');
    if (farmSec) farmSec.classList.remove('hidden');
    if (waterSec) waterSec.classList.add('hidden');
  } else {
    if (waterBtn) waterBtn.classList.add('active');
    if (farmBtn) farmBtn.classList.remove('active');
    if (waterSec) waterSec.classList.remove('hidden');
    if (farmSec) farmSec.classList.add('hidden');
    updateWorkersUI();
  }
  sunflowerAudio.playTone(480, 'sine', 0.08, 0.05);
};

/* ==========================================================================
   UPGRADE MULTIPLIER (1x, 10x, 100x, MAX) - CIRCLE TOGGLE SWITCH
   ========================================================================== */
window.setSfUpgradeMultiplier = function(mult) {
  sunflowerState.upgradeMultiplier = mult;

  // 1. Update circular toggle button text & data-mult attribute
  const displayVal = mult === 'max' ? 'MAX' : `${mult}x`;
  document.querySelectorAll('.sf-mult-circle-val').forEach(el => {
    el.innerText = displayVal;
  });
  document.querySelectorAll('.sf-mult-circle-toggle-btn').forEach(btn => {
    btn.setAttribute('data-mult', String(mult));
    btn.classList.remove('sf-mult-bump');
    void btn.offsetWidth;
    btn.classList.add('sf-mult-bump');
    setTimeout(() => btn.classList.remove('sf-mult-bump'), 220);
  });

  // 2. Legacy support for any multi-button elements
  document.querySelectorAll('.sf-mult-btn').forEach(b => {
    const m = b.getAttribute('data-mult');
    if (m === String(mult)) b.classList.add('active');
    else b.classList.remove('active');
  });

  renderSunflowerPlots();
  renderSunflowerWells();
  saveSunflowerStateDebounced();
};

window.toggleSfUpgradeMultiplier = function(event = null) {
  const current = sunflowerState.upgradeMultiplier || 1;
  let next = 1;
  if (current === 1 || current === '1') next = 10;
  else if (current === 10 || current === '10') next = 100;
  else if (current === 100 || current === '100') next = 'max';
  else next = 1;

  setSfUpgradeMultiplier(next);

  sunflowerAudio.playTone(620, 'triangle', 0.08, 0.06);

  const display = next === 'max' ? 'MAX' : `${next}x`;
  const posX = event ? event.clientX : window.innerWidth / 2;
  const posY = event ? event.clientY : window.innerHeight / 2;
  spawnSfFloat(`⚡ Buy Multiplier: ${display}`, posX, posY, 'text-amber-400');
};

/* ==========================================================================
   LAND ACTIONS: PLANT, WATER (+10s), UPGRADE (+5s CAP), SHOVEL (CLEAR)
   ========================================================================== */

// 1. Plant Seed (Restart to Level 1, 30s Growth)
window.plantSfPlot = function(plotId, event = null) {
  const plotIndex = plotId - 1;
  const plot = sunflowerState.plots[plotIndex];
  if (!plot || !plot.unlocked || plot.plantStatus !== 'empty') return;

  if (sunflowerState.seeds > 0) {
    sunflowerState.seeds -= 1;
    plot.plantStatus = 'growing';
    plot.growthTimer = 30.0;
    plot.growthDuration = 30.0;
    plot.level = 1;
    plot.lifeTimer = 0;
    plot.isWithered = false;

    sunflowerAudio.playTone(550, 'triangle', 0.15, 0.1);
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnSfFloat(`🌱 Planted Seed on Land #${plot.id}! (30s Growth started)`, posX, posY, 'text-emerald-400');

    saveSunflowerStateDebounced();
    updateStickyHeaderAndMiniStats();
    renderSunflowerPlots();
  } else {
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnSfFloat(`No seeds in inventory! Buy in Shop 🏪`, posX, posY, 'text-red-400');
  }
};

// 2. Quick Buy Plant from Shop and Install Directly onto Plot
window.quickBuyPlantAndInstall = function(plotId, event = null) {
  if (sunflowerState.coins >= 50) {
    sunflowerState.coins -= 50;
    sunflowerState.seeds = (sunflowerState.seeds || 0) + 1;
    plantSfPlot(plotId, event);
  } else if (sunflowerState.diamonds >= 1) {
    sunflowerState.diamonds -= 1;
    sunflowerState.seeds = (sunflowerState.seeds || 0) + 1;
    plantSfPlot(plotId, event);
  } else {
    navigateSunflowerPage(3);
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnSfFloat('Need 50 ☀️ or 1 💎 to buy a Plant Seed!', posX, posY, 'text-amber-400');
  }
};

// 3. Water Plot (+10s lifetime, Cap: 120s + 5s * (level - 1))
window.waterSfPlot = function(plotId, event = null) {
  const plotIndex = plotId - 1;
  const plot = sunflowerState.plots[plotIndex];
  if (!plot || !plot.unlocked || plot.plantStatus !== 'alive') return;

  const maxCap = getSfPlotMaxLifeLimit(plot.level);

  if (plot.lifeTimer >= maxCap) {
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnSfFloat(`Already at maximum life limit (${maxCap}s)! Upgrade level for +5s! 🌻`, posX, posY, 'text-amber-400');
    return;
  }

  if (sunflowerState.baskets > 0) {
    sunflowerState.baskets -= 1;
    plot.lifeTimer = Math.min(maxCap, plot.lifeTimer + 10);
    sunflowerAudio.playWaterSplash();
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnSfFloat(`+10s Solar Life! (Cap: ${maxCap}s) 🪣`, posX, posY, 'text-cyan-400');

    saveSunflowerStateDebounced();
    updateStickyHeaderAndMiniStats();
    updateSinglePlotUI(plotId);
  } else {
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnSfFloat('No Buckets! Collect at Water Well (Page 2) or Shop (Page 3) 💧', posX, posY, 'text-red-400');
  }
};

// 4. Upgrade Land Level (Adds +5s to max life limit cap & boosts coin output)
window.upgradeSfPlot = function(plotId, event = null) {
  const plotIndex = plotId - 1;
  const plot = sunflowerState.plots[plotIndex];
  if (!plot || !plot.unlocked || plot.level >= 5000) return;

  const mult = sunflowerState.upgradeMultiplier || 1;
  const info = getSfMultiUpgradeInfo(plotIndex, plot.level, mult, sunflowerState.coins);

  if (sunflowerState.coins >= info.totalCost) {
    sunflowerState.coins -= info.totalCost;
    plot.level = info.targetLevel;

    const newCycleTime = getSfPlotCycleTime(plotIndex, plot.level);
    plot.productionTime = newCycleTime;
    plot.coinProduction = getSfPlotCoinsPerCycle(plotIndex, plot.level);
    plot.upgradeCost = getSfPlotUpgradeCost(plotIndex, plot.level);

    const newCap = getSfPlotMaxLifeLimit(plot.level);

    sunflowerAudio.playUpgradeChime();
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnSfFloat(`▲ Land #${plot.id} Lv. ${plot.level}! Max Life Cap: ${newCap}s (+${info.levelsToAdd * 5}s)! 🌻`, posX, posY, 'text-yellow-400');

    updateSinglePlotUI(plotId);
    updateStickyHeaderAndMiniStats();
    saveSunflowerStateDebounced();
  } else {
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnSfFloat(`Need ${formatNumber(info.totalCost)} 🌻 Coins!`, posX, posY, 'text-red-400');
  }
};

// 5. Shovel Dead Flower (Clears plot -> Install new plant -> Restart Level 1)
window.shovelSfPlot = function(plotId, event = null) {
  const plotIndex = plotId - 1;
  const plot = sunflowerState.plots[plotIndex];
  if (!plot || !plot.unlocked || plot.plantStatus !== 'dead') return;

  if (sunflowerState.shovels > 0) {
    sunflowerState.shovels -= 1;
    plot.plantStatus = 'empty';
    plot.isWithered = false;
    plot.level = 1;
    plot.growthTimer = 0;
    plot.lifeTimer = 0;
    plot.timer = getSfPlotCycleTime(plotIndex, 1);

    sunflowerAudio.playTone(200, 'sawtooth', 0.2, 0.1);
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnSfFloat(`Plot #${plot.id} Cleared! Install a new plant to restart at Level 1 🌱`, posX, posY, 'text-emerald-400');

    saveSunflowerStateDebounced();
    updateStickyHeaderAndMiniStats();
    renderSunflowerPlots();
  } else {
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnSfFloat('Need 🪏 Shovel! Buy on Page 3 Shop', posX, posY, 'text-red-400');
  }
};

// 6. Unlock Land Plot
window.unlockSfPlot = function(plotId, event = null) {
  const plotIndex = plotId - 1;
  const plot = sunflowerState.plots[plotIndex];
  if (!plot || plot.unlocked) return;

  const cost = plot.unlockCost;
  const currentDiamonds = sunflowerState.diamonds;

  if (currentDiamonds >= cost) {
    sunflowerState.diamonds = currentDiamonds - cost;
    plot.unlocked = true;
    plot.level = 1;
    plot.plantStatus = 'empty';
    plot.growthTimer = 0;
    plot.lifeTimer = 0;
    plot.isWithered = false;

    sunflowerAudio.playUnlockChime();
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnSfFloat(`🎉 Land #${plot.id} Unlocked (-${cost} 💎)! Ready for planting!`, posX, posY, 'text-emerald-400');

    saveSunflowerStateDebounced();
    updateStickyHeaderAndMiniStats();
    renderSunflowerPlots();
  } else {
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    const haveStr = typeof currentDiamonds === 'number' ? (currentDiamonds < 1 && currentDiamonds > 0 ? currentDiamonds.toFixed(6) : currentDiamonds) : 0;
    spawnSfFloat(`Need ${cost} 💎! Have: ${haveStr} 💎`, posX, posY, 'text-red-400');
  }
};

// 6b. Start Water Collection Session (Uses 1 ⚡ Energy)
window.startWaterCollectionSession = function(event = null) {
  if (sunflowerState.isWaterCollecting) {
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnSfFloat('Water collection in progress...', posX, posY, 'text-cyan-400');
    return;
  }

  const currentEnergy = (typeof window !== 'undefined' && window.gameState && window.gameState.reactor && typeof window.gameState.reactor.currentEnergy === 'number')
    ? window.gameState.reactor.currentEnergy
    : 0;

  if (currentEnergy < 1) {
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnSfFloat('Need 1 ⚡ Energy to start water collection!', posX, posY, 'text-red-400');
    return;
  }

  // Deduct 1 ⚡ Energy
  window.gameState.reactor.currentEnergy -= 1;
  if (typeof window.updateUI === 'function') window.updateUI();
  if (typeof window.saveGame === 'function') window.saveGame(true);

  sunflowerState.isWaterCollecting = true;

  if (Array.isArray(sunflowerState.wells)) {
    sunflowerState.wells.forEach((w, idx) => {
      if (w.unlocked) {
        w.productionTime = getSfWellCycleTime(idx, w.level);
        w.timer = w.productionTime;
      }
    });
  }

  const btn = document.getElementById('sfStartWaterCollectionBtn');
  if (btn) {
    btn.classList.add('collecting');
    btn.innerHTML = '<span>⚡ Collecting Water...</span>';
  }

  sunflowerAudio.playSolarChime();
  const posX = event ? event.clientX : window.innerWidth / 2;
  const posY = event ? event.clientY : window.innerHeight / 2;
  spawnSfFloat('⚡ Water Collection Started (-1 ⚡)!', posX, posY, 'text-cyan-400');
};

// 7. Quick Tool: Plant All Empty Plots
window.plantAllSfPlots = function(event = null) {
  let planted = 0;
  sunflowerState.plots.forEach(p => {
    if (p.unlocked && p.plantStatus === 'empty' && sunflowerState.seeds > 0) {
      sunflowerState.seeds -= 1;
      p.plantStatus = 'growing';
      p.growthTimer = 30.0;
      p.growthDuration = 30.0;
      p.level = 1;
      p.lifeTimer = 0;
      p.isWithered = false;
      planted++;
    }
  });

  if (planted > 0) {
    sunflowerAudio.playTone(550, 'triangle', 0.15, 0.1);
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnSfFloat(`🌱 Planted ${planted} Lands with Seeds!`, posX, posY, 'text-emerald-400');
    saveSunflowerStateDebounced();
    updateStickyHeaderAndMiniStats();
    renderSunflowerPlots();
  } else {
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnSfFloat('No empty lands or seeds in inventory!', posX, posY, 'text-stone-400');
  }
};

// 8. Quick Tool: Water All Active Plots (+10s life)
window.waterAllSfPlots = function(event = null) {
  let watered = 0;
  sunflowerState.plots.forEach(p => {
    if (p.unlocked && p.plantStatus === 'alive' && sunflowerState.baskets > 0) {
      const maxCap = getSfPlotMaxLifeLimit(p.level);
      if (p.lifeTimer < maxCap) {
        sunflowerState.baskets -= 1;
        p.lifeTimer = Math.min(maxCap, p.lifeTimer + 10);
        watered++;
      }
    }
  });

  if (watered > 0) {
    sunflowerAudio.playWaterSplash();
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnSfFloat(`Watered ${watered} Lands (+10s Life)! 🧺`, posX, posY, 'text-cyan-300');
    saveSunflowerStateDebounced();
    updateStickyHeaderAndMiniStats();
    renderSunflowerPlots();
  } else {
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnSfFloat('No buckets or all active flowers already at maximum cap!', posX, posY, 'text-stone-400');
  }
};

// 9. Quick Tool: Shovel All Dead Plots
window.shovelAllSfPlots = function(event = null) {
  let cleared = 0;
  sunflowerState.plots.forEach(p => {
    if (p.unlocked && p.plantStatus === 'dead' && sunflowerState.shovels > 0) {
      sunflowerState.shovels -= 1;
      p.plantStatus = 'empty';
      p.isWithered = false;
      p.level = 1;
      p.growthTimer = 0;
      p.lifeTimer = 0;
      cleared++;
    }
  });

  if (cleared > 0) {
    sunflowerAudio.playTone(200, 'sawtooth', 0.2, 0.1);
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnSfFloat(`Cleared ${cleared} Dead Lands! 🪏`, posX, posY, 'text-emerald-400');
    saveSunflowerStateDebounced();
    updateStickyHeaderAndMiniStats();
    renderSunflowerPlots();
  } else {
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnSfFloat('No dead flowers to shovel!', posX, posY, 'text-stone-400');
  }
};

/* ==========================================================================
   SHOP ITEMS PURCHASING (Seeds, Buckets, Shovels)
   ========================================================================== */
window.buySunflowerItem = function(itemType, count = 1, currency = 'coins') {
  let priceCoins = 0;
  let priceDiamonds = 0;

  if (itemType === 'seed') {
    if (count === 1) { priceCoins = 50; priceDiamonds = 1; }
    else { priceCoins = 200; priceDiamonds = 4; }
  } else if (itemType === 'basket') {
    if (count === 1) { priceCoins = 20; priceDiamonds = 1; }
    else { priceCoins = 80; priceDiamonds = 3; }
  } else if (itemType === 'shovel') {
    if (count === 1) { priceCoins = 50; priceDiamonds = 3; }
    else { priceCoins = 120; priceDiamonds = 7; }
  }

  if (currency === 'coins') {
    if (sunflowerState.coins >= priceCoins) {
      sunflowerState.coins -= priceCoins;
      if (itemType === 'seed') sunflowerState.seeds = (sunflowerState.seeds || 0) + count;
      else if (itemType === 'basket') sunflowerState.baskets = (sunflowerState.baskets || 0) + count;
      else if (itemType === 'shovel') sunflowerState.shovels = (sunflowerState.shovels || 0) + count;

      sunflowerAudio.playTone(600, 'triangle', 0.15, 0.1);
      spawnSfFloat(`+${count} ${itemType === 'seed' ? 'Plant Seeds 🌱' : itemType === 'basket' ? 'Buckets 🧺' : 'Shovels 🪏'} Acquired!`, window.innerWidth / 2, window.innerHeight / 2, 'text-emerald-400');
      saveSunflowerStateDebounced();
      updateStickyHeaderAndMiniStats();
    } else {
      spawnSfFloat(`Need ${priceCoins} ☀️ Coins!`, window.innerWidth / 2, window.innerHeight / 2, 'text-red-400');
    }
  } else {
    if (sunflowerState.diamonds >= priceDiamonds) {
      sunflowerState.diamonds -= priceDiamonds;
      if (itemType === 'seed') sunflowerState.seeds = (sunflowerState.seeds || 0) + count;
      else if (itemType === 'basket') sunflowerState.baskets = (sunflowerState.baskets || 0) + count;
      else if (itemType === 'shovel') sunflowerState.shovels = (sunflowerState.shovels || 0) + count;

      sunflowerAudio.playTone(600, 'triangle', 0.15, 0.1);
      spawnSfFloat(`+${count} ${itemType === 'seed' ? 'Plant Seeds 🌱' : itemType === 'basket' ? 'Buckets 🧺' : 'Shovels 🪏'} Acquired!`, window.innerWidth / 2, window.innerHeight / 2, 'text-cyan-400');
      saveSunflowerStateDebounced();
      updateStickyHeaderAndMiniStats();
    } else {
      spawnSfFloat(`Need ${priceDiamonds} 💎 Diamonds!`, window.innerWidth / 2, window.innerHeight / 2, 'text-red-400');
    }
  }
};

/* ==========================================================================
   WORKER & AUTOMATION HQ (Farming & Water Workers)
   ========================================================================== */
window.hireSunflowerWorker = function(workerKey) {
  const costs = {
    walter: { coins: 500, diamonds: 10, name: 'Walter (Well Master)' },
    chloe:  { coins: 3500, diamonds: 40, name: 'Chloe (Auto-Hydrator)' },
    dave:   { coins: 1500, diamonds: 25, name: 'Dave (Lands 1-5)' },
    elena:  { coins: 10000, diamonds: 50, name: 'Elena (Lands 6-10 +20%)' },
    leo:    { coins: 50000, diamonds: 100, name: 'Leo (Lands 11-20 2x Speed)' },
    barney: { coins: 5000, diamonds: 35, name: 'Barney (Auto-Planter)' }
  };

  const req = costs[workerKey];
  if (!req) return;

  if (sunflowerState.workers && sunflowerState.workers[workerKey]) {
    spawnSfFloat(`${req.name} is already working! ⚡`, window.innerWidth / 2, window.innerHeight / 2, 'text-yellow-400');
    return;
  }

  if (sunflowerState.coins >= req.coins) {
    sunflowerState.coins -= req.coins;
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
};

function updateWorkersUI() {
  const keys = ['walter', 'chloe', 'dave', 'elena', 'leo', 'barney'];
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

  // Well Automation Worker Allocation & Mini Matrix
  const hiredCount = sunflowerState.wellWorkersCount || 0;
  const assignedCount = getAssignedWellWorkersCount();
  const idleCount = getIdleWellWorkersCount();

  const hiredBadge = document.getElementById('sfWellWorkerBadge');
  const hiredCountEl = document.getElementById('sfWellWorkersHiredCount');
  const statHired = document.getElementById('sfWorkerStatHired');
  const statAssigned = document.getElementById('sfWorkerStatAssigned');
  const statIdle = document.getElementById('sfWorkerStatIdle');

  if (hiredCountEl) hiredCountEl.innerText = hiredCount;
  if (statHired) statHired.innerText = hiredCount;
  if (statAssigned) statAssigned.innerText = assignedCount;
  if (statIdle) statIdle.innerText = idleCount;

  if (hiredBadge) {
    if (hiredCount >= 20) {
      hiredBadge.innerText = '20 / 20 Max Hired ★';
      hiredBadge.className = 'text-[9.5px] bg-emerald-950 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/50';
    } else {
      hiredBadge.innerText = `${hiredCount} / 20 Hired`;
    }
  }

  // 20 Wells Mini Chip Grid on Workers Page
  const miniGrid = document.getElementById('sfWellWorkerMiniGrid');
  if (miniGrid && Array.isArray(sunflowerState.wells)) {
    miniGrid.innerHTML = '';
    sunflowerState.wells.forEach(w => {
      const chip = document.createElement('div');
      if (!w.unlocked) {
        chip.className = 'sf-well-mini-chip locked';
        chip.title = `Well #${w.id} is locked. Unlock on Page 2!`;
        chip.innerHTML = `<span>#${w.id}</span><span>🔒</span>`;
      } else if (w.hasWorker) {
        chip.className = 'sf-well-mini-chip assigned';
        chip.title = `Well #${w.id} has an active worker! Click to recall/unassign.`;
        chip.innerHTML = `<span>#${w.id}</span><span>👷</span>`;
        chip.onclick = (e) => toggleWellWorkerAssignment(w.id, e);
      } else {
        chip.className = 'sf-well-mini-chip unassigned';
        chip.title = idleCount > 0 ? `Well #${w.id} has no worker. Click to assign an idle worker!` : `Well #${w.id} has no worker. Hire workers above!`;
        chip.innerHTML = `<span>#${w.id}</span><span>⛲</span>`;
        chip.onclick = (e) => toggleWellWorkerAssignment(w.id, e);
      }
      miniGrid.appendChild(chip);
    });
  }
}

/* ==========================================================================
   20 WELLS AQUIFER ACTIONS & WELL WORKERS AUTOMATION
   ========================================================================== */

// 1. Collect Stored Baskets from a Single Well (Manual)
window.collectWellBaskets = function(wellId, event = null) {
  const wellIndex = wellId - 1;
  const well = sunflowerState.wells[wellIndex];
  if (!well || !well.unlocked) return;

  const amt = well.storedBaskets || 0;
  if (amt > 0) {
    sunflowerState.baskets = (sunflowerState.baskets || 0) + amt;
    well.storedBaskets = 0;
    sunflowerAudio.playWaterSplash();
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnSfFloat(`+${amt} Water Baskets Collected! 🧺`, posX, posY, 'text-cyan-400');
    saveSunflowerStateDebounced();
    updateStickyHeaderAndMiniStats();
    updateSingleWellUI(wellId);
  } else {
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnSfFloat(`Well #${wellId} is still filling... (${(well.timer || 0).toFixed(1)}s)`, posX, posY, 'text-stone-400');
  }
};

// 2. Quick Tool: Collect from All Ready Wells at Once
window.collectAllWellsBaskets = function(event = null) {
  let totalCollected = 0;
  if (Array.isArray(sunflowerState.wells)) {
    sunflowerState.wells.forEach(w => {
      if (w.unlocked && w.storedBaskets > 0) {
        totalCollected += w.storedBaskets;
        w.storedBaskets = 0;
        updateSingleWellUI(w.id);
      }
    });
  }

  if (totalCollected > 0) {
    sunflowerState.baskets = (sunflowerState.baskets || 0) + totalCollected;
    sunflowerAudio.playWaterSplash();
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnSfFloat(`+${totalCollected} Water Baskets Collected from All Wells! 🧺`, posX, posY, 'text-cyan-300');
    saveSunflowerStateDebounced();
    updateStickyHeaderAndMiniStats();
  } else {
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnSfFloat(`No stored baskets in manual wells!`, posX, posY, 'text-stone-400');
  }
};

// 3. Assign an Idle Well Worker to a Well
window.assignWellWorker = function(wellId, event = null) {
  const wellIndex = wellId - 1;
  const well = sunflowerState.wells[wellIndex];
  if (!well || !well.unlocked) return;

  if (well.hasWorker) {
    spawnSfFloat(`Well #${wellId} already has an automated worker!`, window.innerWidth / 2, window.innerHeight / 2, 'text-amber-400');
    return;
  }

  const idle = getIdleWellWorkersCount();
  if (idle <= 0) {
    spawnSfFloat(`No idle workers! Hire one in Workers HQ (Page 4) 👷`, window.innerWidth / 2, window.innerHeight / 2, 'text-red-400');
    return;
  }

  well.hasWorker = true;
  sunflowerAudio.playTone(640, 'triangle', 0.16, 0.1);
  const posX = event ? event.clientX : window.innerWidth / 2;
  const posY = event ? event.clientY : window.innerHeight / 2;
  spawnSfFloat(`👷 Well Worker Assigned to Well #${wellId}! Auto-producing 🧺!`, posX, posY, 'text-emerald-400');

  saveSunflowerStateDebounced();
  updateStickyHeaderAndMiniStats();
  updateSingleWellUI(wellId);
  updateWorkersUI();
};

// 4. Recall / Unassign a Worker from a Well
window.unassignWellWorker = function(wellId, event = null) {
  const wellIndex = wellId - 1;
  const well = sunflowerState.wells[wellIndex];
  if (!well || !well.hasWorker) return;

  well.hasWorker = false;
  sunflowerAudio.playTone(400, 'sine', 0.12, 0.08);
  const posX = event ? event.clientX : window.innerWidth / 2;
  const posY = event ? event.clientY : window.innerHeight / 2;
  spawnSfFloat(`👷 Worker recalled from Well #${wellId}! Returned to idle pool.`, posX, posY, 'text-amber-400');

  saveSunflowerStateDebounced();
  updateStickyHeaderAndMiniStats();
  updateSingleWellUI(wellId);
  updateWorkersUI();
};

// 5. Toggle Worker Assignment on a Well
window.toggleWellWorkerAssignment = function(wellId, event = null) {
  const wellIndex = wellId - 1;
  const well = sunflowerState.wells[wellIndex];
  if (!well || !well.unlocked) return;

  if (well.hasWorker) {
    unassignWellWorker(wellId, event);
  } else {
    assignWellWorker(wellId, event);
  }
};

// 6. Auto-Assign All Idle Workers to Unlocked Wells
window.autoAssignAllWellWorkers = function(event = null) {
  let assignedCount = 0;
  let idle = getIdleWellWorkersCount();

  if (Array.isArray(sunflowerState.wells)) {
    sunflowerState.wells.forEach(w => {
      if (w.unlocked && !w.hasWorker && idle > 0) {
        w.hasWorker = true;
        idle--;
        assignedCount++;
        updateSingleWellUI(w.id);
      }
    });
  }

  if (assignedCount > 0) {
    sunflowerAudio.playUnlockChime();
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnSfFloat(`⚡ Auto-assigned ${assignedCount} Well Workers!`, posX, posY, 'text-emerald-400');
    saveSunflowerStateDebounced();
    updateStickyHeaderAndMiniStats();
    updateWorkersUI();
  } else {
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnSfFloat(`No available idle workers to assign!`, posX, posY, 'text-stone-400');
  }
};

// 7. Hire a Well Worker (Repeatable for up to 20 Wells)
window.hireWellWorker = function(currency = 'coins') {
  const currentCount = sunflowerState.wellWorkersCount || 0;
  if (currentCount >= 20) {
    spawnSfFloat(`Max 20 Well Workers already hired (1 for each well)! ⚡`, window.innerWidth / 2, window.innerHeight / 2, 'text-amber-400');
    return;
  }

  const costCoins = 250;
  const costDiamonds = 5;

  if (currency === 'coins') {
    if (sunflowerState.coins >= costCoins) {
      sunflowerState.coins -= costCoins;
      sunflowerState.wellWorkersCount = currentCount + 1;
      sunflowerAudio.playUnlockChime();
      spawnSfFloat(`🎉 Hired Well Worker #${sunflowerState.wellWorkersCount}!`, window.innerWidth / 2, window.innerHeight / 2, 'text-emerald-400');
      // Auto-assign to first unlocked well without worker
      const freeWell = sunflowerState.wells.find(w => w.unlocked && !w.hasWorker);
      if (freeWell) {
        freeWell.hasWorker = true;
        spawnSfFloat(`⚡ Auto-assigned to Well #${freeWell.id}!`, window.innerWidth / 2, window.innerHeight / 2 + 30, 'text-cyan-300');
      }
      saveSunflowerStateDebounced();
      updateStickyHeaderAndMiniStats();
      renderSunflowerWells();
      updateWorkersUI();
    } else {
      spawnSfFloat(`Need ${costCoins} ☀️ Coins to hire a Well Worker!`, window.innerWidth / 2, window.innerHeight / 2, 'text-red-400');
    }
  } else {
    if (sunflowerState.diamonds >= costDiamonds) {
      sunflowerState.diamonds -= costDiamonds;
      sunflowerState.wellWorkersCount = currentCount + 1;
      sunflowerAudio.playUnlockChime();
      spawnSfFloat(`🎉 Hired Well Worker #${sunflowerState.wellWorkersCount}!`, window.innerWidth / 2, window.innerHeight / 2, 'text-cyan-400');
      const freeWell = sunflowerState.wells.find(w => w.unlocked && !w.hasWorker);
      if (freeWell) {
        freeWell.hasWorker = true;
        spawnSfFloat(`⚡ Auto-assigned to Well #${freeWell.id}!`, window.innerWidth / 2, window.innerHeight / 2 + 30, 'text-cyan-300');
      }
      saveSunflowerStateDebounced();
      updateStickyHeaderAndMiniStats();
      renderSunflowerWells();
      updateWorkersUI();
    } else {
      spawnSfFloat(`Need ${costDiamonds} 💎 Diamonds to hire a Well Worker!`, window.innerWidth / 2, window.innerHeight / 2, 'text-red-400');
    }
  }
};

// 8. Unlock a Locked Well with Diamonds
window.unlockSfWell = function(wellId, event = null) {
  const wellIndex = wellId - 1;
  const well = sunflowerState.wells[wellIndex];
  if (!well || well.unlocked) return;

  const cost = well.unlockCost;
  if (sunflowerState.diamonds >= cost) {
    sunflowerState.diamonds -= cost;
    well.unlocked = true;
    well.level = 1;
    well.timer = getSfWellCycleTime(wellIndex, 1);
    well.storedBaskets = 0;
    well.lastTick = Date.now();

    // Auto-assign an idle worker if player has one
    if (getIdleWellWorkersCount() > 0) {
      well.hasWorker = true;
    }

    sunflowerAudio.playUnlockChime();
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnSfFloat(`🎉 Well #${well.id} Unlocked (-${cost} 💎)!`, posX, posY, 'text-emerald-400');

    saveSunflowerStateDebounced();
    updateStickyHeaderAndMiniStats();
    renderSunflowerWells();
    updateWorkersUI();
  } else {
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnSfFloat(`Need ${cost} 💎 to unlock Well #${well.id}!`, posX, posY, 'text-red-400');
  }
};

// 9. Upgrade Well Level with Coins
window.upgradeSfWell = function(wellId, event = null) {
  const wellIndex = wellId - 1;
  const well = sunflowerState.wells[wellIndex];
  if (!well || !well.unlocked || well.level >= 5000) return;

  const mult = sunflowerState.upgradeMultiplier || 1;
  const info = getSfWellMultiUpgradeInfo(wellIndex, well.level, mult, sunflowerState.coins);

  if (sunflowerState.coins >= info.totalCost) {
    sunflowerState.coins -= info.totalCost;
    well.level = info.targetLevel;

    well.productionTime = getSfWellCycleTime(wellIndex, well.level);
    well.basketProduction = getSfWellBasketsPerCycle(wellIndex, well.level);
    well.upgradeCost = getSfWellUpgradeCost(wellIndex, well.level);
    well.maxStorage = Math.max(5, well.basketProduction * 5);

    sunflowerAudio.playUpgradeChime();
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnSfFloat(`▲ Well #${well.id} Lv. ${well.level}! (+Speed & Basket Output)`, posX, posY, 'text-cyan-300');

    updateSingleWellUI(wellId);
    updateStickyHeaderAndMiniStats();
    saveSunflowerStateDebounced();
  } else {
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnSfFloat(`Need ${formatNumber(info.totalCost)} 🌻 Coins!`, posX, posY, 'text-red-400');
  }
};

// 10. Render All 20 Wells in Fixed 1*20 Format
function renderSunflowerWells() {
  const container = document.getElementById('sfWellsContainer');
  if (!container || !Array.isArray(sunflowerState.wells)) return;

  const mult = sunflowerState.upgradeMultiplier || 1;
  const coins = sunflowerState.coins;
  const idleWorkers = getIdleWellWorkersCount();

  container.innerHTML = '';

  sunflowerState.wells.forEach((well, idx) => {
    const tile = document.createElement('div');
    tile.id = `sfWellTile-${well.id}`;

    // 1. LOCKED WELL
    if (!well.unlocked) {
      tile.className = "sf-well-card locked";
      tile.innerHTML = `
        <div class="sf-card-header">
          <div class="flex items-center gap-1.5">
            <span class="text-stone-500 text-sm">🏞️</span>
            <span class="sf-card-title">${well.name || `Water Well #${well.id}`}</span>
          </div>
          <span class="sf-status-pill pill-locked">Locked 🔒</span>
        </div>
        <div class="sf-card-body flex items-center justify-between gap-3 py-2">
          <div class="sf-card-avatar locked-avatar">🪨</div>
          <div class="sf-card-details flex-1">
            <div class="text-xs font-black text-stone-700">Underground Aquifer Well</div>
            <div class="text-[10px] text-stone-500">Drilling &amp; pump license fee: <strong class="text-cyan-700">${well.unlockCost} 💎</strong></div>
          </div>
        </div>
        <button onclick="unlockSfWell(${well.id}, event)" class="sf-card-btn sf-btn-unlock">
          <span>🔓 Unlock Well (${well.unlockCost} 💎)</span>
        </button>
      `;
      container.appendChild(tile);
      return;
    }

    // 2. UNLOCKED WELL
    const cycleTime = getSfWellCycleTime(idx, well.level);
    const basketsPerCycle = getSfWellBasketsPerCycle(idx, well.level);
    const upInfo = getSfWellMultiUpgradeInfo(idx, well.level, mult, coins);
    const canAfford = coins >= upInfo.totalCost && well.level < 5000;
    const progress = Math.max(0, Math.min(1, 1 - (well.timer / cycleTime)));
    const stored = well.storedBaskets || 0;

    let cardClass = "sf-well-card active";
    if (well.hasWorker) cardClass += " automated";
    else if (stored > 0) cardClass += " ready";

    tile.className = cardClass;
    tile.innerHTML = `
      <div class="sf-card-header">
        <div class="flex items-center gap-1.5">
          <span class="text-cyan-500 text-sm">${well.hasWorker ? '👷💧' : '⛲'}</span>
          <span class="sf-card-title">${well.name || `Water Well #${well.id}`}</span>
          <span class="sf-card-level-tag" id="sfWellLvBadge-${well.id}">Lv. ${well.level}/5000</span>
        </div>
        <span class="sf-status-pill ${well.hasWorker ? 'pill-well-automated' : (stored > 0 ? 'pill-well-ready' : 'pill-well-filling')}" id="sfWellStatusPill-${well.id}">
          ${well.hasWorker ? '👷 Automated (Auto-🧺)' : (stored > 0 ? `🧺 Ready (${stored} 🧺)` : `⏳ Filling (${well.timer.toFixed(1)}s)`)}
        </span>
      </div>

      <div class="sf-card-body flex items-center justify-between gap-3 py-1.5">
        <div class="sf-card-avatar alive-avatar text-3xl select-none">${well.hasWorker ? '👨‍🌾💧' : '⛲'}</div>
        <div class="sf-card-details flex-1 flex flex-col gap-1">
          <div class="flex justify-between items-center text-[11px]">
            <span class="font-black text-cyan-800" id="sfWellOut-${well.id}">+${formatNumber(basketsPerCycle)} 🧺 Baskets</span>
            <span class="font-mono text-cyan-700 font-bold text-[10px]" id="sfWellTime-${well.id}">⏱️ ${formatTimerText(well.timer, cycleTime)} / ${formatTimerText(cycleTime, cycleTime)}</span>
          </div>

          <div class="sf-progress-bar-track">
            <div class="sf-progress-bar-fill cyan" id="sfWellProgressBar-${well.id}" style="width: ${(progress * 100).toFixed(1)}%"></div>
          </div>

          <div class="text-[9.5px] text-stone-600 mt-0.5 flex justify-between items-center" id="sfWellDescRow-${well.id}">
            ${well.hasWorker
              ? `<span class="text-emerald-700 font-bold flex items-center gap-1"><span>⚡</span> Worker auto-deposits directly into inventory!</span>`
              : `<span class="text-cyan-800 font-semibold">Well Storage: <strong id="sfWellStoredCount-${well.id}">${stored}</strong> / ${well.maxStorage} 🧺</span>`
            }
            <span class="font-mono text-[9px] text-stone-500">Base: ${SF_WELL_BASE_TIMES[idx]}s &bull; ${SF_WELL_BASE_BASKETS[idx]}🧺</span>
          </div>
        </div>
      </div>

      <!-- Dual Action Buttons: Collect / Worker Assignment & Level Upgrade -->
      <div class="sf-card-dual-actions grid grid-cols-2 gap-1.5 pt-1">
        <div id="sfWellWorkerSlot-${well.id}">
          ${well.hasWorker ? `
            <button onclick="unassignWellWorker(${well.id}, event)" class="sf-card-btn sf-btn-well-automated w-full" title="Worker is active! Click to unassign">
              <span>👷 Worker Active (Recall)</span>
            </button>
          ` : (stored > 0 ? `
            <button onclick="collectWellBaskets(${well.id}, event)" class="sf-card-btn sf-btn-well-collect w-full" title="Collect stored water baskets">
              <span>🧺 Collect (${stored} 🧺)</span>
            </button>
          ` : (idleWorkers > 0 ? `
            <button onclick="assignWellWorker(${well.id}, event)" class="sf-card-btn sf-btn-well-assign w-full" title="Assign an idle well worker">
              <span>👷 Assign Worker (${idleWorkers})</span>
            </button>
          ` : `
            <button onclick="hireWellWorker('coins')" class="sf-card-btn sf-btn-well-assign w-full" title="Hire a Well Worker (250 ☀️)">
              <span>🛒 Hire Worker (250 ☀️)</span>
            </button>
          `))}
        </div>

        <button onclick="upgradeSfWell(${well.id}, event)" id="sfWellUpBtn-${well.id}" class="sf-card-btn sf-btn-upgrade ${well.level >= 5000 ? 'disabled' : (!canAfford ? 'disabled' : '')}">
          <span>${well.level >= 5000 ? '★ MAX' : `▲ Lv.${upInfo.targetLevel} (${formatNumber(upInfo.totalCost)} ☀️)`}</span>
        </button>
      </div>
    `;

    container.appendChild(tile);
  });

  const summary = document.getElementById('sfWellsSummaryLabel');
  if (summary) {
    const unlockedCount = sunflowerState.wells.filter(w => w.unlocked).length;
    summary.innerText = `${unlockedCount} of 20 Wells Unlocked`;
  }
}

// 11. Immediate Single-Well Real-Time UI Updater
function updateSingleWellUI(wellId, full = true) {
  const wellIndex = wellId - 1;
  const well = sunflowerState.wells[wellIndex];
  if (!well || !well.unlocked) return;

  const cycleTime = getSfWellCycleTime(wellIndex, well.level);
  const progress = Math.max(0, Math.min(1, 1 - (well.timer / cycleTime)));
  const stored = well.storedBaskets || 0;

  const timeEl = document.getElementById(`sfWellTime-${wellId}`);
  if (timeEl) timeEl.innerText = `⏱️ ${formatTimerText(well.timer, cycleTime)} / ${formatTimerText(cycleTime, cycleTime)}`;

  const barEl = document.getElementById(`sfWellProgressBar-${wellId}`);
  if (barEl) barEl.style.width = `${(progress * 100).toFixed(1)}%`;

  if (full) {
    const pillEl = document.getElementById(`sfWellStatusPill-${wellId}`);
    if (pillEl) {
      if (well.hasWorker) {
        pillEl.className = "sf-status-pill pill-well-automated";
        pillEl.innerText = "👷 Automated (Auto-🧺)";
      } else if (stored > 0) {
        pillEl.className = "sf-status-pill pill-well-ready";
        pillEl.innerText = `🧺 Ready (${stored} 🧺)`;
      } else {
        pillEl.className = "sf-status-pill pill-well-filling";
        pillEl.innerText = `⏳ Filling (${well.timer.toFixed(1)}s)`;
      }
    }

    const storedEl = document.getElementById(`sfWellStoredCount-${wellId}`);
    if (storedEl) storedEl.innerText = stored;

    const workerSlot = document.getElementById(`sfWellWorkerSlot-${wellId}`);
    if (workerSlot) {
      const idleWorkers = getIdleWellWorkersCount();
      if (well.hasWorker) {
        workerSlot.innerHTML = `
          <button onclick="unassignWellWorker(${wellId}, event)" class="sf-card-btn sf-btn-well-automated w-full" title="Worker is active! Click to unassign">
            <span>👷 Worker Active (Recall)</span>
          </button>
        `;
      } else if (stored > 0) {
        workerSlot.innerHTML = `
          <button onclick="collectWellBaskets(${wellId}, event)" class="sf-card-btn sf-btn-well-collect w-full" title="Collect stored water baskets">
            <span>🧺 Collect (${stored} 🧺)</span>
          </button>
        `;
      } else if (idleWorkers > 0) {
        workerSlot.innerHTML = `
          <button onclick="assignWellWorker(${wellId}, event)" class="sf-card-btn sf-btn-well-assign w-full" title="Assign an idle well worker">
            <span>👷 Assign Worker (${idleWorkers})</span>
          </button>
        `;
      } else {
        workerSlot.innerHTML = `
          <button onclick="hireWellWorker('coins')" class="sf-card-btn sf-btn-well-assign w-full" title="Hire a Well Worker (250 ☀️)">
            <span>🛒 Hire Worker (250 ☀️)</span>
          </button>
        `;
      }
    }

    const mult = sunflowerState.upgradeMultiplier || 1;
    const upInfo = getSfWellMultiUpgradeInfo(wellIndex, well.level, mult, sunflowerState.coins);
    const canAfford = sunflowerState.coins >= upInfo.totalCost && well.level < 5000;
    const upBtn = document.getElementById(`sfWellUpBtn-${wellId}`);
    if (upBtn) {
      if (well.level >= 5000) {
        upBtn.className = "sf-card-btn sf-btn-upgrade disabled";
        upBtn.disabled = true;
        upBtn.innerHTML = "<span>★ MAX</span>";
      } else {
        upBtn.disabled = false;
        upBtn.className = `sf-card-btn sf-btn-upgrade ${!canAfford ? 'disabled' : ''}`;
        upBtn.innerHTML = `<span>▲ Lv.${upInfo.targetLevel} (${formatNumber(upInfo.totalCost)} ☀️)</span>`;
      }
    }
  }
}

/* ==========================================================================
   RENDER 20 LANDS IN SLEEK RECTANGULAR CARDS
   ========================================================================== */
function renderSunflowerPlots() {
  const container = document.getElementById('sfPlotsContainer');
  if (!container) return;

  const mult = sunflowerState.upgradeMultiplier || 1;
  const coins = sunflowerState.coins;
  const seeds = sunflowerState.seeds || 0;
  const shovels = sunflowerState.shovels || 0;

  sunflowerState.plots.forEach((plot, idx) => {
    let tile = document.getElementById(`sfPlotTile-${plot.id}`);
    const isNew = !tile;
    if (isNew) {
      tile = document.createElement('div');
      tile.id = `sfPlotTile-${plot.id}`;
    }

    // 1. LOCKED PLOT
    if (!plot.unlocked) {
      tile.className = "sf-plot-tile sf-rect-card locked";
      tile.innerHTML = `
        <div class="sf-card-header">
          <div class="flex items-center gap-1.5">
            <span class="text-stone-400 text-sm">🔒</span>
            <span class="sf-card-title">Land Plot #${plot.id}</span>
          </div>
          <span class="sf-status-pill pill-locked">Locked</span>
        </div>
        <div class="sf-card-body flex items-center justify-between gap-3 py-2">
          <div class="sf-card-avatar locked-avatar">🔒</div>
          <div class="sf-card-details flex-1">
            <div class="text-xs font-black text-stone-700">Land Plot #${plot.id}</div>
            <div class="text-[10px] text-stone-500">Unlock: <strong class="text-cyan-700 font-mono font-bold">${plot.unlockCost} 💎</strong></div>
          </div>
        </div>
        <button onclick="unlockSfPlot(${plot.id}, event)" class="sf-card-btn sf-btn-unlock">
          <span>🔓 Unlock Land (${plot.unlockCost} 💎)</span>
        </button>
      `;
      if (isNew) container.appendChild(tile);
      return;
    }

    // 2. UNLOCKED: EMPTY PLOT
    if (plot.plantStatus === 'empty') {
      tile.className = "sf-plot-tile sf-rect-card empty";
      tile.innerHTML = `
        <div class="sf-card-header">
          <div class="flex items-center gap-1.5">
            <span class="text-amber-600 text-sm">🌱</span>
            <span class="sf-card-title">Land Plot #${plot.id}</span>
          </div>
          <span class="sf-status-pill pill-empty">Empty Soil</span>
        </div>
        <div class="sf-card-body flex items-center justify-between gap-3 py-2">
          <div class="sf-card-avatar empty-avatar">🟫</div>
          <div class="sf-card-details flex-1">
            <div class="text-xs font-black text-amber-900">Fertile Soil Prepared</div>
            <div class="text-[10px] text-stone-600">Install plant &bull; 30s growth &bull; Starts Lv. 1</div>
          </div>
        </div>
        <div class="sf-card-actions">
          ${seeds > 0 ? `
            <button onclick="plantSfPlot(${plot.id}, event)" class="sf-card-btn sf-btn-plant">
              <span>🌱 Plant Sunflower (Owned: ${seeds}) &rarr; Start Lv. 1</span>
            </button>
          ` : `
            <button onclick="quickBuyPlantAndInstall(${plot.id}, event)" class="sf-card-btn sf-btn-buy-plant">
              <span>🛒 Buy Plant in Shop (50 ☀️ / 1 💎)</span>
            </button>
          `}
        </div>
      `;
      if (isNew) container.appendChild(tile);
      return;
    }

    // 3. UNLOCKED: 30s GROWING PHASE
    if (plot.plantStatus === 'growing') {
      const growthTime = Math.max(0, plot.growthTimer || 0);
      const progress = Math.max(0, Math.min(1, (30 - growthTime) / 30));
      tile.className = "sf-plot-tile sf-rect-card growing";
      tile.innerHTML = `
        <div class="sf-card-header">
          <div class="flex items-center gap-1.5">
            <span class="text-emerald-600 text-sm">🌱</span>
            <span class="sf-card-title">Land Plot #${plot.id}</span>
            <span class="sf-card-level-tag">Lv. 1 Seedling</span>
          </div>
          <span class="sf-status-pill pill-growing animate-pulse">⏳ Growing (${growthTime.toFixed(0)}s)</span>
        </div>
        <div class="sf-card-body flex items-center justify-between gap-3 py-1.5">
          <div class="sf-card-avatar growing-avatar text-3xl animate-bounce-gentle">${growthTime < 15 ? '🌿' : '🌱'}</div>
          <div class="sf-card-details flex-1 flex flex-col gap-1">
            <div class="flex justify-between items-center text-[10.5px]">
              <span class="font-black text-emerald-800">Sprouting Sunflower</span>
              <span class="font-mono font-bold text-emerald-700" id="sfGrowthTimer-${plot.id}">${growthTime.toFixed(1)}s / 30s</span>
            </div>
            <div class="sf-progress-bar-track">
              <div class="sf-progress-bar-fill emerald" id="sfGrowthBar-${plot.id}" style="width: ${(progress * 100).toFixed(1)}%"></div>
            </div>
            <div class="text-[9.5px] text-stone-500">30s Growth Phase &bull; Starts with 40s lifetime</div>
          </div>
        </div>
        <div class="sf-card-actions">
          <button class="sf-card-btn sf-btn-disabled" disabled>
            <span>⏳ Photosynthesizing (30s Growth Phase)...</span>
          </button>
        </div>
      `;
      if (isNew) container.appendChild(tile);
      return;
    }

    // 4. UNLOCKED: DEAD / WITHERED STALKS
    if (plot.plantStatus === 'dead') {
      tile.className = "sf-plot-tile sf-rect-card dead";
      tile.innerHTML = `
        <div class="sf-card-header">
          <div class="flex items-center gap-1.5">
            <span class="text-stone-500 text-sm">🥀</span>
            <span class="sf-card-title">Land Plot #${plot.id}</span>
          </div>
          <span class="sf-status-pill pill-dead">🥀 Dead</span>
        </div>
        <div class="sf-card-body flex items-center justify-between gap-3 py-1.5">
          <div class="sf-card-avatar dead-avatar text-3xl">🥀</div>
          <div class="sf-card-details flex-1">
            <div class="text-xs font-black text-rose-900">Life Expired</div>
            <div class="text-[10px] text-stone-600">Clear with shovel 🪏 to replant at Level 1</div>
          </div>
        </div>
        <div class="sf-card-actions">
          <button onclick="shovelSfPlot(${plot.id}, event)" class="sf-card-btn sf-btn-shovel">
            <span>🪏 Remove with Shovel (Owned: ${shovels})</span>
          </button>
        </div>
      `;
      if (isNew) container.appendChild(tile);
      return;
    }

    // 5. UNLOCKED: ALIVE & MATURE SUNFLOWER
    const cycleTime = getSfPlotCycleTime(idx, plot.level);
    const coinsPerCycle = getSfPlotCoinsPerCycle(idx, plot.level);
    const upInfo = getSfMultiUpgradeInfo(idx, plot.level, mult, coins);
    const canAfford = coins >= upInfo.totalCost && plot.level < 5000;
    const maxCap = getSfPlotMaxLifeLimit(plot.level);
    const lifeProgress = Math.max(0, Math.min(1, (plot.lifeTimer || 0) / maxCap));

    let spriteEmoji = '🌻';
    if (plot.level > 1000) spriteEmoji = '☀️🌻';
    if (plot.level > 2500) spriteEmoji = '✨🌻';

    tile.className = "sf-plot-tile sf-rect-card alive";
    tile.innerHTML = `
      <div class="sf-card-header">
        <div class="flex items-center gap-1.5">
          <span class="text-amber-500 text-sm">🌻</span>
          <span class="sf-card-title">Land Plot #${plot.id}</span>
          <span class="sf-card-level-tag" id="sfPlotLvBadge-${plot.id}">Lv. ${plot.level}/5000</span>
        </div>
        <span class="sf-status-pill pill-alive">🌻 Alive &bull; Cap: ${maxCap}s</span>
      </div>

      <div class="sf-card-body flex items-center justify-between gap-3 py-1.5">
        <div class="sf-card-avatar alive-avatar text-3xl">${spriteEmoji}</div>
        <div class="sf-card-details flex-1 flex flex-col gap-1">
          <div class="flex justify-between items-center text-[11px]">
            <span class="font-black text-amber-900" id="sfPlotOut-${plot.id}">+${formatNumber(coinsPerCycle)} 🌻 Coins</span>
            <span class="font-mono text-cyan-700 font-bold text-[10px]" id="sfPlotTime-${plot.id}">⏱️ ${formatTimerText(plot.timer, cycleTime)}</span>
          </div>

          <!-- Life Timer Gauge with Max Limit Cap -->
          <div class="flex justify-between items-center text-[10px] text-stone-700 mt-0.5">
            <span class="font-bold flex items-center gap-1">
              <span>⏳ Life:</span>
              <span class="font-mono text-amber-800 font-extrabold" id="sfLifeTimer-${plot.id}">${(plot.lifeTimer || 0).toFixed(1)}s</span>
            </span>
            <span class="text-[9.5px] font-mono text-stone-500">Max Cap: <strong class="text-amber-800" id="sfCapLabel-${plot.id}">${maxCap}s</strong></span>
          </div>

          <div class="sf-progress-bar-track">
            <div class="sf-progress-bar-fill amber" id="sfLifeBar-${plot.id}" style="width: ${(lifeProgress * 100).toFixed(1)}%"></div>
          </div>
        </div>
      </div>

      <!-- Dual Action Buttons: Water (+10s) & Upgrade Level (+5s Cap, +Coins) -->
      <div class="sf-card-dual-actions grid grid-cols-2 gap-1.5 pt-1">
        <button onclick="waterSfPlot(${plot.id}, event)" class="sf-card-btn sf-btn-water" title="Water flower to add +10s lifetime">
          <span>🪣 Water (+10s)</span>
        </button>
        <button onclick="upgradeSfPlot(${plot.id}, event)" id="sfPlotUpBtn-${plot.id}" class="sf-card-btn sf-btn-upgrade ${plot.level >= 5000 ? 'disabled' : (!canAfford ? 'disabled' : '')}">
          <span>${plot.level >= 5000 ? '★ MAX' : `▲ Lv.${upInfo.targetLevel} (+5s Cap)`}</span>
        </button>
      </div>
    `;

    if (isNew) container.appendChild(tile);
  });

  const summary = document.getElementById('sfPlotsSummaryLabel');
  if (summary) {
    const unlockedCount = sunflowerState.plots.filter(p => p.unlocked).length;
    summary.innerText = `${unlockedCount} of 20 Lands Unlocked`;
  }
}

// Immediate Single-Land Real-Time UI Updater
function updateSinglePlotUI(plotId) {
  const plotIndex = plotId - 1;
  const plot = sunflowerState.plots[plotIndex];
  if (!plot || !plot.unlocked) return;

  const cycleTime = getSfPlotCycleTime(plotIndex, plot.level);
  const coinsPerCycle = getSfPlotCoinsPerCycle(plotIndex, plot.level);
  const mult = sunflowerState.upgradeMultiplier || 1;
  const upInfo = getSfMultiUpgradeInfo(plotIndex, plot.level, mult, sunflowerState.coins);
  const canAfford = sunflowerState.coins >= upInfo.totalCost && plot.level < 5000;
  const maxCap = getSfPlotMaxLifeLimit(plot.level);

  const lvEl = document.getElementById(`sfPlotLvBadge-${plotId}`);
  if (lvEl) lvEl.innerText = `Lv. ${plot.level}/5000`;

  const outEl = document.getElementById(`sfPlotOut-${plotId}`);
  if (outEl) outEl.innerText = `+${formatNumber(coinsPerCycle)} 🌻 Coins`;

  const capEl = document.getElementById(`sfCapLabel-${plotId}`);
  if (capEl) capEl.innerText = `${maxCap}s`;

  const lifeEl = document.getElementById(`sfLifeTimer-${plotId}`);
  if (lifeEl) lifeEl.innerText = `${(plot.lifeTimer || 0).toFixed(1)}s`;

  const lifeBar = document.getElementById(`sfLifeBar-${plotId}`);
  if (lifeBar) {
    const lifeProgress = Math.max(0, Math.min(1, (plot.lifeTimer || 0) / maxCap));
    lifeBar.style.width = `${(lifeProgress * 100).toFixed(1)}%`;
  }

  const btnEl = document.getElementById(`sfPlotUpBtn-${plotId}`);
  if (btnEl) {
    if (plot.level >= 5000) {
      btnEl.className = "sf-card-btn sf-btn-upgrade disabled";
      btnEl.disabled = true;
      btnEl.innerHTML = `<span>★ MAX</span>`;
    } else {
      btnEl.disabled = false;
      btnEl.className = `sf-card-btn sf-btn-upgrade ${!canAfford ? 'disabled' : ''}`;
      btnEl.innerHTML = `<span>▲ Lv.${upInfo.targetLevel} (+5s Cap)</span>`;
    }
  }
}

/* ==========================================================================
   GAME LOOP & RESOURCE ADVANCEMENT
   ========================================================================== */
let sfLastFrameTime = performance.now();
let sfIncomeSecondAccumulator = 0;
let sfNeedRerender = false;

function sunflowerMainLoop(now) {
  const dt = Math.min(1.0, (now - sfLastFrameTime) / 1000);
  sfLastFrameTime = now;

  let gardenTotalCps = 0;
  sfNeedRerender = false;

  // 1. Advance All 20 Wells (Water Aquifer) ONLY when isWaterCollecting is true (Manual Trigger with 1 ⚡)
  if (sunflowerState.isWaterCollecting && Array.isArray(sunflowerState.wells)) {
    let anyWellTicking = false;
    sunflowerState.wells.forEach((well, idx) => {
      if (!well.unlocked) return;

      const cycleTime = getSfWellCycleTime(idx, well.level);
      const basketsPerCycle = getSfWellBasketsPerCycle(idx, well.level);
      well.productionTime = cycleTime;
      well.basketProduction = basketsPerCycle;
      well.lastTick = Date.now();

      if (well.timer > 0) {
        well.timer -= dt;
        anyWellTicking = true;
        if (well.timer <= 0) {
          well.timer = 0;
          const produced = basketsPerCycle;
          well.totalBasketsGenerated = (well.totalBasketsGenerated || 0) + produced;

          if (well.hasWorker) {
            // Automatic Well Worker creates water baskets directly into player inventory!
            sunflowerState.baskets = (sunflowerState.baskets || 0) + produced;
          } else {
            // Manual storage in well
            const maxCap = well.maxStorage || Math.max(5, basketsPerCycle * 5);
            well.storedBaskets = Math.min(maxCap, (well.storedBaskets || 0) + produced);
          }
          updateSingleWellUI(well.id, true);
        } else {
          // Fast progress bar & timer update
          updateSingleWellUI(well.id, false);
        }
      } else {
        updateSingleWellUI(well.id, false);
      }
    });

    if (!anyWellTicking) {
      sunflowerState.isWaterCollecting = false;
      const btn = document.getElementById('sfStartWaterCollectionBtn');
      if (btn) {
        btn.classList.remove('collecting');
        btn.innerHTML = '<span>⚡ Start Water Collection (1 ⚡)</span>';
      }
      sunflowerAudio.playWaterSplash();
      spawnSfFloat('✅ Water Collection Complete!', window.innerWidth / 2, window.innerHeight / 2, 'text-emerald-400');
      saveSunflowerStateDebounced();
      updateStickyHeaderAndMiniStats();
    }
  }

  // Fallback for pump overdrive boost timer if active
  if (sunflowerState.cistern && sunflowerState.cistern.boostTimerRemaining > 0) {
    sunflowerState.cistern.boostTimerRemaining = Math.max(0, sunflowerState.cistern.boostTimerRemaining - dt);
  }

  // 2. Advance All 20 Lands
  sunflowerState.plots.forEach((plot, idx) => {
    if (!plot.unlocked) return;

    // A. GROWING PHASE (30 Seconds)
    if (plot.plantStatus === 'growing') {
      plot.growthTimer -= dt;
      if (plot.growthTimer <= 0) {
        plot.growthTimer = 0;
        plot.plantStatus = 'alive';
        plot.lifeTimer = 40.0; // 40s lifetime begins!
        plot.isWithered = false;
        sunflowerAudio.playSolarChime();
        spawnSfFloat(`🌻 Land #${plot.id} Matured! 40s Lifetime Started!`, window.innerWidth / 2, window.innerHeight / 2, 'text-yellow-400');
        sfNeedRerender = true;
      } else {
        const timeEl = document.getElementById(`sfGrowthTimer-${plot.id}`);
        if (timeEl) timeEl.innerText = `${plot.growthTimer.toFixed(1)}s / 30s`;
        const barEl = document.getElementById(`sfGrowthBar-${plot.id}`);
        if (barEl) {
          const p = Math.max(0, Math.min(1, (30 - plot.growthTimer) / 30));
          barEl.style.width = `${(p * 100).toFixed(1)}%`;
        }
      }
      return;
    }

    // B. EMPTY PLOT: Barney Auto-Planter Worker
    if (plot.plantStatus === 'empty') {
      if (sunflowerState.workers && sunflowerState.workers.barney && sunflowerState.seeds > 0) {
        sunflowerState.seeds -= 1;
        plot.plantStatus = 'growing';
        plot.growthTimer = 30.0;
        plot.growthDuration = 30.0;
        plot.level = 1;
        plot.lifeTimer = 0;
        plot.isWithered = false;
        sfNeedRerender = true;
      }
      return;
    }

    // C. DEAD PLOT
    if (plot.plantStatus === 'dead') {
      return;
    }

    // D. ALIVE PHASE
    if (plot.plantStatus === 'alive') {
      const maxCap = getSfPlotMaxLifeLimit(plot.level);

      // Chloe Auto-Waterer Worker
      if (sunflowerState.workers && sunflowerState.workers.chloe && sunflowerState.baskets > 0 && plot.lifeTimer < 30) {
        sunflowerState.baskets -= 1;
        plot.lifeTimer = Math.min(maxCap, plot.lifeTimer + 10);
      }

      plot.lifeTimer -= dt;

      // Flower dies when lifetime runs out
      if (plot.lifeTimer <= 0) {
        plot.lifeTimer = 0;
        plot.plantStatus = 'dead';
        plot.isWithered = true;
        sunflowerAudio.playTone(180, 'sawtooth', 0.25, 0.1);
        spawnSfFloat(`🥀 Land #${plot.id} Sunflower expired! Use shovel 🪏 to clear`, window.innerWidth / 2, window.innerHeight / 2, 'text-rose-400');
        sfNeedRerender = true;
        return;
      }

      // Coin Generation
      const cycleTime = getSfPlotCycleTime(idx, plot.level);
      const coinsPerCycle = getSfPlotCoinsPerCycle(idx, plot.level);

      plot.productionTime = cycleTime;
      plot.coinProduction = coinsPerCycle;

      if (cycleTime < 0.05) {
        const rate = coinsPerCycle / cycleTime;
        gardenTotalCps += rate;
        const earned = rate * dt;
        sunflowerState.coins += earned;
        plot.totalCoinsGenerated = (plot.totalCoinsGenerated || 0) + earned;
        plot.timer = 0.001;
      } else {
        gardenTotalCps += coinsPerCycle / cycleTime;
        if (typeof plot.timer !== 'number') plot.timer = cycleTime;
        plot.timer -= dt;

        if (plot.timer <= 0) {
          const completedCycles = 1 + Math.floor(-plot.timer / cycleTime);
          const earned = completedCycles * coinsPerCycle;
          sunflowerState.coins += earned;
          plot.totalCoinsGenerated = (plot.totalCoinsGenerated || 0) + earned;
          plot.timer = cycleTime - (-plot.timer % cycleTime);

          if (!sunflowerAudio.muted && cycleTime >= 0.5) {
            sunflowerAudio.playCoin();
          }
        }

        const timeEl = document.getElementById(`sfPlotTime-${plot.id}`);
        if (timeEl) timeEl.innerText = `⏱️ ${formatTimerText(plot.timer, cycleTime)}`;
      }

      // Update Life Gauge
      const lifeEl = document.getElementById(`sfLifeTimer-${plot.id}`);
      if (lifeEl) lifeEl.innerText = `${plot.lifeTimer.toFixed(1)}s`;
      const lifeBar = document.getElementById(`sfLifeBar-${plot.id}`);
      if (lifeBar) {
        const p = Math.max(0, Math.min(1, plot.lifeTimer / maxCap));
        lifeBar.style.width = `${(p * 100).toFixed(1)}%`;
      }
    }
  });

  if (sfNeedRerender) {
    renderSunflowerPlots();
  }

  // 3. Update Income Rate Display & Live UI
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

function updateLiveUpgradeButtons() {
  const mult = sunflowerState.upgradeMultiplier || 1;
  const coins = sunflowerState.coins;

  sunflowerState.plots.forEach((plot, idx) => {
    if (!plot.unlocked || plot.plantStatus !== 'alive') return;
    const btn = document.getElementById(`sfPlotUpBtn-${plot.id}`);
    if (btn) {
      if (plot.level >= 5000) {
        btn.className = "sf-card-btn sf-btn-upgrade disabled";
        btn.disabled = true;
        btn.innerHTML = `<span>★ MAX</span>`;
      } else {
        const upInfo = getSfMultiUpgradeInfo(idx, plot.level, mult, coins);
        const canAfford = coins >= upInfo.totalCost;
        btn.disabled = false;
        if (canAfford) {
          btn.classList.remove('disabled');
        } else {
          btn.classList.add('disabled');
        }
        btn.innerHTML = `<span>▲ Lv.${upInfo.targetLevel} (+5s Cap)</span>`;
      }
    }
  });

  if (Array.isArray(sunflowerState.wells)) {
    sunflowerState.wells.forEach((well, idx) => {
      if (!well.unlocked) return;
      const upBtn = document.getElementById(`sfWellUpBtn-${well.id}`);
      if (upBtn) {
        if (well.level >= 5000) {
          upBtn.className = "sf-card-btn sf-btn-upgrade disabled";
          upBtn.disabled = true;
          upBtn.innerHTML = "<span>★ MAX</span>";
        } else {
          const upInfo = getSfWellMultiUpgradeInfo(idx, well.level, mult, coins);
          const canAfford = coins >= upInfo.totalCost;
          upBtn.disabled = false;
          if (canAfford) {
            upBtn.classList.remove('disabled');
          } else {
            upBtn.classList.add('disabled');
          }
          upBtn.innerHTML = `<span>▲ Lv.${upInfo.targetLevel} (${formatNumber(upInfo.totalCost)} ☀️)</span>`;
        }
      }
    });
  }
}

function updateStickyHeaderAndMiniStats() {
  const sCoins = document.getElementById('sfStickyCoins');
  const sSeeds = document.getElementById('sfStickySeeds');
  const sBaskets = document.getElementById('sfStickyBaskets');
  const sShovels = document.getElementById('sfStickyShovels');
  const sBlueCoins = document.getElementById('sfStickyBlueCoins');

  if (sCoins) sCoins.innerText = formatNumber(Math.floor(sunflowerState.coins));
  if (sSeeds) sSeeds.innerText = sunflowerState.seeds || 0;
  if (sBaskets) sBaskets.innerText = sunflowerState.baskets || 0;
  if (sShovels) sShovels.innerText = sunflowerState.shovels || 0;

  if (sBlueCoins) {
    const blueVal = (typeof gameState !== 'undefined' && gameState.player && typeof gameState.player.blueCoins === 'number')
      ? gameState.player.blueCoins
      : (sunflowerState.blueCoins || 0);
    sBlueCoins.innerText = formatNumber(blueVal);
  }

  // Shop display counts
  const spPlant = document.getElementById('sfShopPlantCount');
  const spBask = document.getElementById('sfShopBucketCount');
  const spShov = document.getElementById('sfShopShovelCount');
  const spDiam = document.getElementById('sfShopDiamondCount');
  if (spPlant) spPlant.innerText = sunflowerState.seeds || 0;
  if (spBask) spBask.innerText = sunflowerState.baskets || 0;
  if (spShov) spShov.innerText = sunflowerState.shovels || 0;
  if (spDiam) {
    const d = sunflowerState.diamonds;
    spDiam.innerText = (typeof d === 'number' && d > 0 && d < 1 ? d.toFixed(6) : (d || 0)) + ' 💎';
  }

  // Water Page 2 Live Counters
  const wpBask = document.getElementById('sfWaterPageBasketsCount');
  const wpIdle = document.getElementById('sfWaterPageIdleWorkers');
  const wpSummary = document.getElementById('sfWellsSummaryLabel');
  const wpWorkerBadge = document.getElementById('sfWellWorkersSummaryBadge');

  if (wpBask) wpBask.innerText = `${sunflowerState.baskets || 0} 🧺`;
  if (wpIdle) wpIdle.innerText = getIdleWellWorkersCount();
  if (wpSummary && Array.isArray(sunflowerState.wells)) {
    const unl = sunflowerState.wells.filter(w => w.unlocked).length;
    wpSummary.innerText = `${unl} of 20 Wells Unlocked`;
  }
  if (wpWorkerBadge) {
    wpWorkerBadge.innerText = `👷 ${getAssignedWellWorkersCount()}/20 Workers`;
  }

  // Converter Page 5 counters
  const convCoin = document.getElementById('sfConvCoinDisplay');
  const convTot = document.getElementById('sfConvTotalEnergyDisplay');
  if (convCoin) convCoin.innerText = `${formatNumber(Math.floor(sunflowerState.coins))} ☀️`;
  if (convTot) convTot.innerText = `${formatNumber(sunflowerState.energy || 0)} ⚡`;
}

/* ==========================================================================
   SOLAR REFINERY CONVERTER: 100 ☀️ Coins -> 29 ⚡ Energy
   ========================================================================== */
function executeSfCoinToEnergy(amount = 100, event = null) {
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
}

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */
function initSunflowerTycoonGame() {
  const collBtn = document.getElementById('sfCollectAllWellsBtn');
  if (collBtn) {
    collBtn.onclick = (e) => collectAllWellsBaskets(e);
  }

  const sndBtn = document.getElementById('sfSoundBtn');
  if (sndBtn) {
    sndBtn.onclick = () => {
      sunflowerAudio.muted = !sunflowerAudio.muted;
      sndBtn.innerText = sunflowerAudio.muted ? '🔇' : '🔊';
    };
  }

  // Initialize Multiplier Circle Toggle Button
  const mult = sunflowerState.upgradeMultiplier || 1;
  const displayVal = mult === 'max' ? 'MAX' : `${mult}x`;
  document.querySelectorAll('.sf-mult-circle-val').forEach(el => {
    el.innerText = displayVal;
  });
  document.querySelectorAll('.sf-mult-circle-toggle-btn').forEach(btn => {
    btn.setAttribute('data-mult', String(mult));
  });

  renderSunflowerPlots();
  renderSunflowerWells();
  updateStickyHeaderAndMiniStats();
  updateWorkersUI();
  syncSunflowerToFirebase();

  requestAnimationFrame(sunflowerMainLoop);
}

const SF_NUM_SUFFIXES = [
  '', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No',
  'Dc', 'Ud', 'Dd', 'Td', 'Qad', 'Qid', 'Sxd', 'Spd', 'Ocd', 'Nod', 'Vg'
];

function formatNumber(num) {
  if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) return '0';
  if (Math.abs(num) < 1000) return Math.floor(num).toLocaleString();
  const tier = Math.min(SF_NUM_SUFFIXES.length - 1, Math.floor(Math.log10(Math.abs(num)) / 3));
  if (tier <= 0) return Math.floor(num).toLocaleString();
  const scale = Math.pow(10, tier * 3);
  const scaled = num / scale;
  return scaled.toFixed(scaled < 10 ? 2 : 1) + SF_NUM_SUFFIXES[tier];
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Global Exports
window.initSunflowerTycoonGame = initSunflowerTycoonGame;
window.renderSunflowerPlots = renderSunflowerPlots;
window.renderSunflowerWells = renderSunflowerWells;
window.updateSunflowerMiniStats = updateStickyHeaderAndMiniStats;
window.executeSfCoinToEnergy = executeSfCoinToEnergy;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSunflowerTycoonGame);
} else {
  initSunflowerTycoonGame();
}
