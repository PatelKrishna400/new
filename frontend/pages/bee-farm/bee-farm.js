/* ==========================================================================
   HONEY BEE FARM TYCOON ENGINE (pages/bee-farm/bee-farm.js)
   Exact replica of Sunflower Valley architecture with Honey Bee Theme:
   - 20 Apiary Hives (Levels 1 to 5000, 0.001s speed drop, Hive 1 free)
   - 20 Flower Meadows (500s down to 1s at L5000, produce Flowers)
   - Apiary Shop: Larva (200 🪙/ad), Flowers 10-pack (250 🪙/ad 5), Smoker (200 🪙/ad),
     and 20-Minute Honey Profit Boosters (*2, *5, *10)
   - 20 Apiary Managers: 1 Manager = 1 Hive, 300 💎 unlock slot,
     500/1000/1500 🍯 or 10 💎 (+24h) or 1 Ad (+10h), 100-Hour Max Limit
   - Royal Exchange: 🎡 Lucky Spin Coins (1 Qa 🍯 = 1 🎡, Stepper Carousel),
     ⚡ Royal Refinery (100 🍯 = 29 ⚡), 👑 Prestige (100 🍯 ➔ 10 🪙 Gold Coins)
   ========================================================================== */

const BEE_STORAGE_KEY = 'ENERGY_TAP_BEEFARM_STATE_V3';

// 20 Hive Base Unlock Costs (Plot 1 is Free)
const BEE_LAND_UNLOCK_COSTS = [
  0, 10, 50, 150, 300, 500, 800, 1200, 1800, 2500,
  3500, 5000, 7000, 9500, 13000, 18000, 25000, 35000, 50000, 75000
];

// 20 Flower Meadows Base Unlock Costs
const BEE_WELL_UNLOCK_COSTS = [
  0, 10, 30, 75, 150, 300, 500, 800, 1200, 1800,
  2500, 3500, 5000, 7000, 9500, 13000, 18000, 25000, 35000, 50000
];

// Base Cycle Times (Meadow 1: 500s, Meadow 2: 1000s, ..., Meadow 20: 10000s)
const BEE_WELL_BASE_TIMES = Array.from({ length: 20 }, (_, i) => (i + 1) * 500);

const BEE_WELL_NAMES = [
  "Wild Sunflower Glade #1", "Sweet Lavender Trellis #2", "Crimson Blossom Meadow #3",
  "Orange Orchard Basin #4", "Royal Orchid Valley #5", "Heather Blossom Ridge #6",
  "White Jasmine Glade #7", "Purple Cornflower Field #8", "Golden Marigold Meadow #9",
  "Pink Lotus Lagoon #10", "Midnight Dahlia Garden #11", "Alpine Edelweiss Peak #12",
  "Scarlet Poppy Prairie #13", "Honeysuckle Arbor #14", "Sunlit Chamomile Haven #15",
  "Magnolia Breeze Grove #16", "Saffron Crocus Ridge #17", "Cherry Blossom Canopy #18",
  "Starflower Clearing #19", "Mythic Royal Sunblossom #20"
];

// Level 1 Honey Generated
const BEE_LAND_L1_COINS = [
  1, 100, 1e3, 10e3, 100e3, 1e6, 10e6, 100e6, 1e9, 10e9,
  100e9, 1e12, 10e12, 100e12, 1e15, 10e15, 100e15, 1e18, 10e18, 100e18
];

// Production Time at Level 1 (sec)
const BEE_LAND_BASE_TIMES = [
  60, 300, 600, 900, 600, 1200, 1500, 1800, 2100, 2400,
  2700, 3000, 3300, 3600, 3900, 4200, 4500, 4800, 5100, 5400
];

// Base Life Limits at Level 1 (sec)
const BEE_LAND_BASE_LIFE_LIMITS = [
  500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000,
  5500, 6000, 6500, 7000, 7500, 8000, 8500, 9000, 9500, 10000
];

// Flower Bonus (sec added per flower)
const BEE_LAND_WATER_BONUS = [
  10, 19, 28, 37, 46, 55, 64, 73, 82, 91,
  100, 109, 118, 127, 136, 145, 154, 163, 172, 181
];

// Level 5000 Honey Generated
const BEE_LAND_L5000_COINS = [
  1, 1e6, 1e9, 10e9, 1e12, 100e12, 10e15, 1e18, 100e18, 10e21,
  1e24, 100e24, 10e27, 1e30, 100e30, 10e33, 1e36, 100e36, 10e39, 1e42
];

// Production Time at Level 5000 (sec)
const BEE_LAND_L5000_TIMES = [
  0.001, 0.001, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01,
  0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01
];

const BEE_LAND_L5000_LIFE_LIMITS = [
  500, 1800, 3600, 5400, 7200, 9000, 10800, 12600, 14400, 16200,
  18000, 19800, 21600, 23400, 25200, 27000, 28800, 30600, 32400, 34200
];

function createDefaultBeePlots() {
  const plots = [];
  for (let i = 1; i <= 20; i++) {
    const isUnlocked = i === 1;
    plots.push({
      id: i,
      unlocked: isUnlocked,
      unlockCost: BEE_LAND_UNLOCK_COSTS[i - 1],
      plantStatus: isUnlocked ? 'alive' : 'empty', // 'empty' | 'growing' | 'alive' | 'dead'
      level: 1,
      growthTimer: 0,
      growthDuration: 30.0,
      lifeTimer: isUnlocked ? 60.0 : 0,
      maxLifeLimit: 60.0,
      timer: BEE_LAND_BASE_TIMES[i - 1] || 60,
      waterUsageCount: 0,
      storedCoins: 0,
      isWithered: false
    });
  }
  return plots;
}

function createDefaultBeeWells() {
  const wells = [];
  for (let i = 1; i <= 20; i++) {
    const isUnlocked = i === 1;
    wells.push({
      id: i,
      name: BEE_WELL_NAMES[i - 1],
      unlocked: isUnlocked,
      unlockCost: BEE_WELL_UNLOCK_COSTS[i - 1],
      level: 1,
      timer: 0,
      cycleTime: BEE_WELL_BASE_TIMES[i - 1],
      basketOutput: 1,
      pendingBaskets: 0,
      hasWorker: false
    });
  }
  return wells;
}

function createDefaultBeeManagers() {
  const managers = [];
  const avatars = ['🐝', '👩‍🌾', '👨‍🌾', '🍯', '🌸', '🐝', '👩‍🌾', '👨‍🌾', '🍯', '🌸', '🐝', '👩‍🌾', '👨‍🌾', '🍯', '🌸', '🐝', '👩‍🌾', '👨‍🌾', '🍯', '🌸'];
  for (let i = 1; i <= 20; i++) {
    managers.push({
      landId: i,
      avatar: avatars[i - 1] || '🐝',
      unlocked: false,
      hireCount: 0,
      activeTimer: 0 // seconds (capped at 360,000s = 100 hours)
    });
  }
  return managers;
}

function loadInitialBeeState() {
  try {
    const raw = localStorage.getItem(BEE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.plots)) {
        if (!Array.isArray(parsed.wells) || parsed.wells.length !== 20) {
          parsed.wells = createDefaultBeeWells();
        }
        if (!Array.isArray(parsed.managers) || parsed.managers.length !== 20) {
          parsed.managers = createDefaultBeeManagers();
        }
        if (typeof parsed.honey !== 'number') parsed.honey = 150;
        if (typeof parsed.larvae !== 'number') parsed.larvae = 3;
        if (typeof parsed.flowers !== 'number') parsed.flowers = 2;
        if (typeof parsed.smokers !== 'number') parsed.smokers = 1;
        if (typeof parsed.diamonds !== 'number') parsed.diamonds = 25;
        if (!parsed.upgradeMultiplier) parsed.upgradeMultiplier = 1;
        if (!parsed.activeBooster) parsed.activeBooster = null;
        if (typeof parsed.prestigeLevel !== 'number') parsed.prestigeLevel = 0;
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load bee farm state:', e);
  }

  return {
    currentPage: 1,
    honey: 150,
    diamonds: 25,
    larvae: 3,
    flowers: 2,
    smokers: 1,
    upgradeMultiplier: 1,
    activeBooster: null,
    prestigeLevel: 0,
    plots: createDefaultBeePlots(),
    wells: createDefaultBeeWells(),
    managers: createDefaultBeeManagers()
  };
}

const beeState = loadInitialBeeState();
window.beeState = beeState;

let beeSaveTimeout = null;
function saveBeeStateDebounced() {
  if (beeSaveTimeout) return;
  beeSaveTimeout = setTimeout(() => {
    beeSaveTimeout = null;
    try {
      localStorage.setItem(BEE_STORAGE_KEY, JSON.stringify(beeState));
    } catch (e) {
      console.warn('Bee state save error:', e);
    }
  }, 1000);
}

/* ==========================================================================
   NAVIGATION: 5-TAB CUSTOM BOTTOM MENU
   1: Apiary | 2: Flowers | 3: Shop | 4: Managers | 5: Exchange
   ========================================================================== */
window.navigateBeePage = function(pageNum) {
  beeState.currentPage = pageNum;

  for (let i = 1; i <= 5; i++) {
    const pageEl = document.getElementById(`beePage${i}`);
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

  const menuMap = {
    1: 'beeMenuTabGarden',
    2: 'beeMenuTabWater',
    3: 'beeMenuTabShop',
    4: 'beeMenuTabWorkers',
    5: 'beeMenuTabConvert'
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

  const viewContainer = document.getElementById('pageBeeFarm');
  if (viewContainer) viewContainer.scrollTop = 0;

  if (pageNum === 1) renderBeePlots();
  if (pageNum === 2) renderBeeWells();
  if (pageNum === 4) renderBeeManagers();
  if (pageNum === 5) {
    renderBeeSpinExchange();
    renderBeePrestigeUI();
  }

  updateBeeStickyHeaderAndStats();
  saveBeeStateDebounced();
};

/* ==========================================================================
   MULTIPLIER TOGGLE (1x -> 10x -> 100x -> MAX)
   ========================================================================== */
window.toggleBeeUpgradeMultiplier = function(event) {
  if (event) event.stopPropagation();
  const current = beeState.upgradeMultiplier || 1;
  let next = 1;
  if (current === 1) next = 10;
  else if (current === 10) next = 100;
  else if (current === 100) next = 'max';
  else next = 1;

  beeState.upgradeMultiplier = next;
  const displayVal = next === 'max' ? 'MAX' : `${next}x`;
  document.querySelectorAll('.bee-mult-circle-val').forEach(el => el.innerText = displayVal);
  document.querySelectorAll('.bee-mult-circle-toggle-btn').forEach(btn => btn.setAttribute('data-mult', String(next)));
  renderBeePlots();
  renderBeeWells();
};

/* ==========================================================================
   PAGE 1: 20 APIARY HIVES (Lv 1 - 5000)
   ========================================================================== */
function getBeePlotCycleTime(landIdx, level) {
  const baseTime = BEE_LAND_BASE_TIMES[landIdx] || 60;
  const targetTime = BEE_LAND_L5000_TIMES[landIdx] || 0.01;
  const prog = Math.min(1.0, Math.max(0, (level - 1) / 4999));
  return Math.max(targetTime, baseTime * Math.pow(targetTime / baseTime, prog));
}

function getBeePlotHoneyPerCycle(landIdx, level) {
  const baseCoins = BEE_LAND_L1_COINS[landIdx] || 1;
  const targetCoins = BEE_LAND_L5000_COINS[landIdx] || 100;
  const prog = Math.min(1.0, Math.max(0, (level - 1) / 4999));
  return Math.max(baseCoins, baseCoins * Math.pow(targetCoins / baseCoins, prog));
}

function getBeePlotMaxLifeLimit(landIdx, level) {
  const baseLife = BEE_LAND_BASE_LIFE_LIMITS[landIdx] || 500;
  const targetLife = BEE_LAND_L5000_LIFE_LIMITS[landIdx] || 500;
  const prog = Math.min(1.0, Math.max(0, (level - 1) / 4999));
  return Math.max(baseLife, baseLife + (targetLife - baseLife) * prog);
}

function renderBeePlots() {
  const container = document.getElementById('beePlotsContainer');
  if (!container) return;

  const unlockedCount = beeState.plots.filter(p => p.unlocked).length;
  const summaryLabel = document.getElementById('beePlotsSummaryLabel');
  if (summaryLabel) summaryLabel.innerText = `${unlockedCount} of 20 Hives Unlocked`;

  let totalIncome = 0;
  beeState.plots.forEach((p, idx) => {
    if (p.unlocked && p.plantStatus === 'alive') {
      const cycleTime = getBeePlotCycleTime(idx, p.level);
      const honeyPerCycle = getBeePlotHoneyPerCycle(idx, p.level);
      totalIncome += (honeyPerCycle / Math.max(0.001, cycleTime));
    }
  });
  const booster = getActiveBeeProfitMultiplier();
  totalIncome *= booster;
  const rateEl = document.getElementById('beeTotalIncomeRate');
  if (rateEl) rateEl.innerText = formatBeeNumber(totalIncome);

  let html = '';
  beeState.plots.forEach((plot, idx) => {
    if (!plot.unlocked) {
      html += `
        <div class="sf-plot-tile sf-rect-card locked bg-stone-900/90 border border-stone-800 rounded-xl p-3 flex flex-col justify-between gap-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-black text-stone-400">🔒 Hive #${plot.id} (Locked)</span>
            <span class="text-[9px] bg-stone-800 text-stone-300 font-mono px-2 py-0.5 rounded-full">Slot ${plot.id}</span>
          </div>
          <div class="flex items-center justify-between pt-1">
            <span class="text-xs font-mono font-bold text-amber-300">${plot.unlockCost} 💎</span>
            <button onclick="unlockBeePlot(${plot.id}, event)" class="bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-xs px-3 py-1.5 rounded-lg active:scale-95 transition">
              <span>Unlock Hive</span>
            </button>
          </div>
        </div>
      `;
      return;
    }

    const cycleTime = getBeePlotCycleTime(idx, plot.level);
    const honeyPerCycle = getBeePlotHoneyPerCycle(idx, plot.level);
    const maxLife = getBeePlotMaxLifeLimit(idx, plot.level);
    const isAlive = plot.plantStatus === 'alive';
    const isGrowing = plot.plantStatus === 'growing';
    const isDead = plot.plantStatus === 'dead';
    const isEmpty = plot.plantStatus === 'empty';

    html += `
      <div class="sf-plot-tile sf-rect-card bg-stone-950/90 border ${isAlive ? 'border-amber-500/60' : 'border-stone-800'} rounded-xl p-3 flex flex-col gap-2.5 shadow-md" id="beePlotCard-${plot.id}">
        <div class="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div class="flex items-center gap-2">
            <span class="text-xl">${isAlive ? '🐝' : isGrowing ? '🐛' : isDead ? '💨' : '🍯'}</span>
            <div>
              <span class="text-xs font-black text-amber-300">Hive #${plot.id}</span>
              <span class="text-[9.5px] text-stone-400 font-mono ml-1.5">Lv. ${plot.level}/5000</span>
            </div>
          </div>
          <span class="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full ${isAlive ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : isGrowing ? 'bg-cyan-950 text-cyan-300' : 'bg-rose-950 text-rose-300'}">
            ${isAlive ? 'ACTIVE' : isGrowing ? 'INCUBATING' : isDead ? 'DORMANT' : 'EMPTY'}
          </span>
        </div>

        <div class="grid grid-cols-2 gap-2 text-[10px]">
          <div class="bg-stone-900/80 p-1.5 rounded-lg border border-stone-800/80">
            <span class="text-stone-400 block text-[9px]">Output / Cycle:</span>
            <span class="text-amber-300 font-mono font-bold">${formatBeeNumber(honeyPerCycle)} 🍯</span>
          </div>
          <div class="bg-stone-900/80 p-1.5 rounded-lg border border-stone-800/80">
            <span class="text-stone-400 block text-[9px]">Cycle Speed:</span>
            <span class="text-cyan-300 font-mono font-bold">${cycleTime.toFixed(cycleTime < 0.05 ? 3 : 1)}s</span>
          </div>
        </div>

        ${isAlive ? `
          <div class="flex items-center justify-between text-[10px] text-stone-400">
            <span>Life Remaining: <strong class="text-rose-300 font-mono" id="beeLifeTimer-${plot.id}">${(plot.lifeTimer || 0).toFixed(1)}s</strong></span>
            <span>Max Cap: <strong class="text-stone-300 font-mono">${Math.floor(maxLife)}s</strong></span>
          </div>
          <div class="w-full bg-stone-900 rounded-full h-1.5 overflow-hidden border border-stone-800">
            <div id="beeLifeBar-${plot.id}" class="bg-gradient-to-r from-amber-500 to-rose-500 h-full" style="width: ${Math.min(100, Math.max(0, ((plot.lifeTimer || 0) / maxLife) * 100))}%;"></div>
          </div>
        ` : ''}

        <div class="grid grid-cols-2 gap-2 pt-1">
          ${isEmpty ? `
            <button onclick="placeBeeLarva(${plot.id}, event)" class="col-span-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-2 rounded-lg active:scale-95 transition">
              <span>🐛 Install Larva</span>
            </button>
          ` : isDead ? `
            <button onclick="smokeBeePlot(${plot.id}, event)" class="col-span-2 bg-stone-700 hover:bg-stone-600 text-white font-black text-xs py-2 rounded-lg active:scale-95 transition">
              <span>💨 Clear with Smoker</span>
            </button>
          ` : isGrowing ? `
            <div class="col-span-2 text-center text-xs text-cyan-300 font-mono py-1">
              Incubating: ${(plot.growthTimer || 0).toFixed(1)}s
            </div>
          ` : `
            <button onclick="nourishBeePlot(${plot.id}, event)" class="bg-rose-600 hover:bg-rose-500 text-white font-black text-xs py-2 rounded-lg active:scale-95 transition">
              <span>🌸 Feed Flower (+10s)</span>
            </button>
            <button onclick="upgradeBeePlot(${plot.id}, event)" class="bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-xs py-2 rounded-lg active:scale-95 transition">
              <span>⬆️ Upgrade</span>
            </button>
          `}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

window.unlockBeePlot = function(plotId, event) {
  if (event) event.stopPropagation();
  const plot = beeState.plots.find(p => p.id === plotId);
  if (!plot) return;
  const cost = plot.unlockCost || 0;
  if ((beeState.diamonds || 0) < cost) {
    alert(`Need ${cost} 💎 Diamonds!`);
    return;
  }
  beeState.diamonds -= cost;
  plot.unlocked = true;
  plot.plantStatus = 'empty';
  renderBeePlots();
  updateBeeStickyHeaderAndStats();
  saveBeeStateDebounced();
};

window.placeBeeLarva = function(plotId, event) {
  if (event) event.stopPropagation();
  const plot = beeState.plots.find(p => p.id === plotId);
  if (!plot || plot.plantStatus !== 'empty') return;
  if ((beeState.larvae || 0) < 1) {
    alert('Need 1 🐛 Queen Larva! Buy from Apiary Shop.');
    return;
  }
  beeState.larvae -= 1;
  plot.plantStatus = 'growing';
  plot.growthTimer = 30.0;
  renderBeePlots();
  updateBeeStickyHeaderAndStats();
  saveBeeStateDebounced();
};

window.nourishBeePlot = function(plotId, event) {
  if (event) event.stopPropagation();
  const plot = beeState.plots.find(p => p.id === plotId);
  if (!plot || plot.plantStatus !== 'alive') return;
  if ((beeState.flowers || 0) < 1) {
    alert('Need 1 🌸 Fresh Flower! Harvest from Meadows or Buy from Shop.');
    return;
  }
  beeState.flowers -= 1;
  const bonus = BEE_LAND_WATER_BONUS[plot.id - 1] || 10;
  const maxLife = getBeePlotMaxLifeLimit(plot.id - 1, plot.level);
  plot.lifeTimer = Math.min(maxLife, (plot.lifeTimer || 0) + bonus);
  renderBeePlots();
  updateBeeStickyHeaderAndStats();
  saveBeeStateDebounced();
};

window.upgradeBeePlot = function(plotId, event) {
  if (event) event.stopPropagation();
  const plot = beeState.plots.find(p => p.id === plotId);
  if (!plot || plot.plantStatus !== 'alive') return;
  const mult = beeState.upgradeMultiplier === 'max' ? 100 : (Number(beeState.upgradeMultiplier) || 1);
  const costPerLvl = 50 * plot.level;
  const totalCost = costPerLvl * mult;
  if ((beeState.honey || 0) < totalCost) {
    alert(`Need ${formatBeeNumber(totalCost)} 🍯 Honey!`);
    return;
  }
  beeState.honey -= totalCost;
  plot.level = Math.min(5000, plot.level + mult);
  renderBeePlots();
  updateBeeStickyHeaderAndStats();
  saveBeeStateDebounced();
};

window.smokeBeePlot = function(plotId, event) {
  if (event) event.stopPropagation();
  const plot = beeState.plots.find(p => p.id === plotId);
  if (!plot || plot.plantStatus !== 'dead') return;
  if ((beeState.smokers || 0) < 1) {
    alert('Need 1 💨 Smoker! Buy from Apiary Shop.');
    return;
  }
  beeState.smokers -= 1;
  plot.plantStatus = 'empty';
  renderBeePlots();
  updateBeeStickyHeaderAndStats();
  saveBeeStateDebounced();
};

/* ==========================================================================
   PAGE 2: 20 FLOWER MEADOWS (500s down to 1s at L5000)
   ========================================================================== */
function renderBeeWells() {
  const container = document.getElementById('beeWellsContainer');
  if (!container) return;

  const unlockedCount = beeState.wells.filter(w => w.unlocked).length;
  const summaryLabel = document.getElementById('beeWellsSummaryLabel');
  if (summaryLabel) summaryLabel.innerText = `${unlockedCount} of 20 Meadows Unlocked`;

  let html = '';
  beeState.wells.forEach(well => {
    if (!well.unlocked) {
      html += `
        <div class="sf-plot-tile sf-rect-card locked bg-stone-900/90 border border-stone-800 rounded-xl p-3 flex flex-col justify-between gap-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-black text-stone-400">🔒 ${well.name} (Locked)</span>
            <span class="text-[9px] bg-stone-800 text-stone-300 font-mono px-2 py-0.5 rounded-full">Field ${well.id}</span>
          </div>
          <div class="flex items-center justify-between pt-1">
            <span class="text-xs font-mono font-bold text-rose-300">${well.unlockCost} 💎</span>
            <button onclick="unlockBeeWell(${well.id}, event)" class="bg-rose-600 hover:bg-rose-500 text-white font-black text-xs px-3 py-1.5 rounded-lg active:scale-95 transition">
              <span>Unlock Meadow</span>
            </button>
          </div>
        </div>
      `;
      return;
    }

    html += `
      <div class="sf-plot-tile sf-rect-card bg-stone-950/90 border border-rose-500/50 rounded-xl p-3 flex flex-col gap-2 shadow-md">
        <div class="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div class="flex items-center gap-2">
            <span class="text-xl">🌸</span>
            <div>
              <span class="text-xs font-black text-rose-300">${well.name}</span>
              <span class="text-[9.5px] text-stone-400 font-mono ml-1.5">Lv. ${well.level}/5000</span>
            </div>
          </div>
          <span class="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-700">
            PRODUCING
          </span>
        </div>

        <div class="flex items-center justify-between text-[10px] text-stone-300">
          <span>Cycle: <strong class="text-rose-300 font-mono" id="beeWellTimer-${well.id}">${(well.timer || 0).toFixed(1)}s</strong></span>
          <span>Output: <strong class="text-emerald-400 font-mono">+${well.basketOutput || 1} 🌸</strong></span>
        </div>

        <div class="grid grid-cols-2 gap-2 pt-1">
          <button onclick="collectBeeWellFlowers(${well.id}, event)" class="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 text-white font-black text-xs py-2 rounded-lg active:scale-95 transition">
            <span>🌸 Harvest Flowers</span>
          </button>
          <button onclick="upgradeBeeWell(${well.id}, event)" class="bg-stone-800 hover:bg-stone-700 text-rose-300 font-black text-xs py-2 rounded-lg border border-rose-700/60 active:scale-95 transition">
            <span>⬆️ Upgrade</span>
          </button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

window.unlockBeeWell = function(wellId, event) {
  if (event) event.stopPropagation();
  const well = beeState.wells.find(w => w.id === wellId);
  if (!well) return;
  const cost = well.unlockCost || 0;
  if ((beeState.diamonds || 0) < cost) {
    alert(`Need ${cost} 💎 Diamonds!`);
    return;
  }
  beeState.diamonds -= cost;
  well.unlocked = true;
  renderBeeWells();
  updateBeeStickyHeaderAndStats();
  saveBeeStateDebounced();
};

window.collectBeeWellFlowers = function(wellId, event) {
  if (event) event.stopPropagation();
  const well = beeState.wells.find(w => w.id === wellId);
  if (!well || !well.unlocked) return;
  const gain = well.basketOutput || 1;
  beeState.flowers = (beeState.flowers || 0) + gain;
  renderBeeWells();
  updateBeeStickyHeaderAndStats();
  saveBeeStateDebounced();
};

window.upgradeBeeWell = function(wellId, event) {
  if (event) event.stopPropagation();
  const well = beeState.wells.find(w => w.id === wellId);
  if (!well || !well.unlocked) return;
  const cost = 100 * well.level;
  if ((beeState.honey || 0) < cost) {
    alert(`Need ${formatBeeNumber(cost)} 🍯 Honey!`);
    return;
  }
  beeState.honey -= cost;
  well.level = Math.min(5000, well.level + 1);
  well.cycleTime = Math.max(1, well.cycleTime * 0.98);
  if (well.level % 10 === 0) well.basketOutput = (well.basketOutput || 1) + 1;
  renderBeeWells();
  updateBeeStickyHeaderAndStats();
  saveBeeStateDebounced();
};

/* ==========================================================================
   PAGE 3: APIARY SHOP (200 🪙 Larva/Smoker, 250 🪙 10 Flowers, Boosters)
   ========================================================================== */
window.buyBeeItem = function(itemType, count = 1, currency = 'gold') {
  if (typeof gameState === 'undefined' || !gameState.player) return;
  let cost = 0;

  if (itemType === 'larva') {
    cost = 200; // 200 gold coins
    if ((gameState.player.coins || 0) < cost) {
      alert(`Need 200 🪙 Gold Coins! (Have: ${Math.floor(gameState.player.coins || 0)})`);
      return;
    }
    gameState.player.coins -= cost;
    beeState.larvae = (beeState.larvae || 0) + count;
  } else if (itemType === 'flower') {
    cost = 250; // 250 gold coins for 10 flowers
    if ((gameState.player.coins || 0) < cost) {
      alert(`Need 250 🪙 Gold Coins! (Have: ${Math.floor(gameState.player.coins || 0)})`);
      return;
    }
    gameState.player.coins -= cost;
    beeState.flowers = (beeState.flowers || 0) + (count || 10);
  } else if (itemType === 'smoker') {
    cost = 200; // 200 gold coins
    if ((gameState.player.coins || 0) < cost) {
      alert(`Need 200 🪙 Gold Coins! (Have: ${Math.floor(gameState.player.coins || 0)})`);
      return;
    }
    gameState.player.coins -= cost;
    beeState.smokers = (beeState.smokers || 0) + count;
  }

  if (typeof window.updateUI === 'function') window.updateUI();
  if (typeof window.saveGame === 'function') window.saveGame(true);
  updateBeeStickyHeaderAndStats();
  saveBeeStateDebounced();
};

window.openBeeAdModal = function(rewardType) {
  const doReward = () => {
    if (rewardType === 'larva') beeState.larvae = (beeState.larvae || 0) + 1;
    else if (rewardType === 'flower') beeState.flowers = (beeState.flowers || 0) + 5;
    else if (rewardType === 'smoker') beeState.smokers = (beeState.smokers || 0) + 1;
    updateBeeStickyHeaderAndStats();
    saveBeeStateDebounced();
  };

  if (typeof window.showRewardedAd === 'function') {
    window.showRewardedAd(doReward, {
      adTitle: `Free ${rewardType}`,
      adDesc: `Watch sponsor video to claim free Apiary Supplies!`
    });
  } else {
    doReward();
  }
};

window.activateBeeProfitBooster = function(multiplier) {
  const doActivate = () => {
    beeState.activeBooster = {
      multiplier: Number(multiplier) || 2,
      expiresAt: Date.now() + 20 * 60 * 1000 // 20 minutes
    };
    updateBeeBoosterUI();
    saveBeeStateDebounced();
  };

  if (typeof window.showRewardedAd === 'function') {
    window.showRewardedAd(doActivate, {
      adTitle: `${multiplier}X Honey Profit Booster`,
      adDesc: `Watch sponsor video to boost all honey profits by ${multiplier}X for 20 Minutes!`
    });
  } else {
    doActivate();
  }
};

function getActiveBeeProfitMultiplier() {
  if (beeState && beeState.activeBooster && beeState.activeBooster.expiresAt > Date.now()) {
    return Number(beeState.activeBooster.multiplier) || 1;
  }
  return 1;
}

function updateBeeBoosterUI() {
  const badge = document.getElementById('beeBoosterActiveBadge');
  if (!badge) return;
  if (beeState && beeState.activeBooster && beeState.activeBooster.expiresAt > Date.now()) {
    const remMs = beeState.activeBooster.expiresAt - Date.now();
    const remMins = Math.floor(remMs / 60000);
    const remSecs = Math.floor((remMs % 60000) / 1000);
    badge.className = "bg-amber-950 text-amber-300 text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full border border-amber-500/50 animate-pulse";
    badge.innerText = `⚡ ${beeState.activeBooster.multiplier}X ACTIVE (${remMins}m ${String(remSecs).padStart(2, '0')}s)`;
  } else {
    badge.className = "bg-stone-800 text-stone-400 text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full border border-stone-700";
    badge.innerText = "No Active Booster";
  }
}

/* ==========================================================================
   PAGE 4: 20 APIARY MANAGERS (100-Hour Max Cap)
   ========================================================================== */
function formatBeeContractDuration(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hrs > 0) return `${hrs}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  return `${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
}

function renderBeeManagers() {
  const listEl = document.getElementById('beeManagersVerticalList');
  if (!listEl) return;

  if (!Array.isArray(beeState.managers) || beeState.managers.length !== 20) {
    beeState.managers = createDefaultBeeManagers();
  }

  const activeCount = beeState.managers.filter(m => m.unlocked && m.activeTimer > 0).length;
  const countBadge = document.getElementById('beeManagersSummaryLabel');
  if (countBadge) countBadge.innerText = `${activeCount} / 20 Active`;

  let html = '';
  beeState.managers.forEach(mgr => {
    const plot = beeState.plots ? beeState.plots[mgr.landId - 1] : null;
    const isPlotUnlocked = plot && plot.unlocked;
    const isActive = mgr.unlocked && mgr.activeTimer > 0;
    const nextCoinCost = (mgr.hireCount + 1) * 500;

    html += `
      <div class="bee-mgr-card ${isActive ? 'active-contract' : (mgr.unlocked ? '' : 'locked')}" id="beeMgrCard-${mgr.landId}">
        <div class="bee-mgr-card-top">
          <div class="bee-mgr-info-left">
            <div class="bee-mgr-avatar-box">
              <span>${mgr.avatar || '🐝'}</span>
            </div>
            <div class="bee-mgr-title-box">
              <div class="bee-mgr-name">
                <span>Hive #${mgr.landId} Manager</span>
                <span class="text-[9px] bg-amber-950/80 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-700/60 font-mono">Auto</span>
              </div>
              <div class="bee-mgr-sub">
                <span>${isPlotUnlocked ? `Manages Hive #${mgr.landId} &bull; Auto-Feed 🌸 &amp; Auto-Harvest 🍯` : `⚠️ Unlock Hive #${mgr.landId} first`}</span>
              </div>
            </div>
          </div>
          <div class="bee-mgr-status-badge ${!mgr.unlocked ? 'locked' : (isActive ? 'active' : 'expired')}" id="beeMgrStatusBadge-${mgr.landId}">
            ${!mgr.unlocked ? '🔒 LOCKED' : (isActive ? `⚡ ${formatBeeContractDuration(mgr.activeTimer)}` : '⏳ EXPIRED')}
          </div>
        </div>

        <div class="bee-mgr-actions-row">
          ${!mgr.unlocked ? `
            <button class="bee-mgr-unlock-btn" onclick="unlockBeeManager(${mgr.landId}, event)" title="Unlock Manager Slot (300 💎)">
              <span>💎 Hire Apiary Manager (300 💎)</span>
            </button>
          ` : `
            <button class="bee-mgr-diamond-btn" onclick="hireBeeManagerDiamonds(${mgr.landId}, event)">
              <span>💎 10 💎 (+24h)</span>
            </button>
            <button class="bee-mgr-ad-btn" onclick="hireBeeManagerAd(${mgr.landId}, event)">
              <span>🎬 Ad (+10h)</span>
            </button>
            <button class="bee-mgr-coin-btn" onclick="hireBeeManagerCoins(${mgr.landId}, event)">
              <span>🍯 1 Day (${formatBeeNumber(nextCoinCost)} 🍯)</span>
            </button>
          `}
        </div>
      </div>
    `;
  });

  listEl.innerHTML = html;
}

window.unlockBeeManager = function(landId, event) {
  if (event) event.stopPropagation();
  const mgr = beeState.managers.find(m => m.landId === landId);
  if (!mgr) return;
  if ((beeState.diamonds || 0) < 300) {
    alert(`Need 300 💎 Diamonds! (Have: ${beeState.diamonds || 0})`);
    return;
  }
  beeState.diamonds -= 300;
  mgr.unlocked = true;
  mgr.activeTimer = Math.min(360000, 86400); // 24h
  renderBeeManagers();
  updateBeeStickyHeaderAndStats();
  saveBeeStateDebounced();
};

window.hireBeeManagerDiamonds = function(landId, event) {
  if (event) event.stopPropagation();
  const mgr = beeState.managers.find(m => m.landId === landId);
  if (!mgr || !mgr.unlocked) return;
  const MAX_LIMIT = 360000; // 100 hours
  if ((mgr.activeTimer || 0) >= MAX_LIMIT) {
    alert(`Manager #${landId} is already at the maximum 100 Hours limit!`);
    return;
  }
  if ((beeState.diamonds || 0) < 10) {
    alert(`Need 10 💎 Diamonds!`);
    return;
  }
  beeState.diamonds -= 10;
  mgr.activeTimer = Math.min(MAX_LIMIT, (mgr.activeTimer > 0 ? mgr.activeTimer : 0) + 86400);
  renderBeeManagers();
  updateBeeStickyHeaderAndStats();
  saveBeeStateDebounced();
};

window.hireBeeManagerCoins = function(landId, event) {
  if (event) event.stopPropagation();
  const mgr = beeState.managers.find(m => m.landId === landId);
  if (!mgr || !mgr.unlocked) return;
  const MAX_LIMIT = 360000;
  if ((mgr.activeTimer || 0) >= MAX_LIMIT) {
    alert(`Manager #${landId} is already at the maximum 100 Hours limit!`);
    return;
  }
  const cost = (mgr.hireCount + 1) * 500;
  if ((beeState.honey || 0) < cost) {
    alert(`Need ${formatBeeNumber(cost)} 🍯 Honey!`);
    return;
  }
  beeState.honey -= cost;
  mgr.hireCount++;
  mgr.activeTimer = Math.min(MAX_LIMIT, (mgr.activeTimer > 0 ? mgr.activeTimer : 0) + 86400);
  renderBeeManagers();
  updateBeeStickyHeaderAndStats();
  saveBeeStateDebounced();
};

window.hireBeeManagerAd = function(landId, event) {
  if (event) event.stopPropagation();
  const mgr = beeState.managers.find(m => m.landId === landId);
  if (!mgr || !mgr.unlocked) return;
  const MAX_LIMIT = 360000;
  if ((mgr.activeTimer || 0) >= MAX_LIMIT) {
    alert(`Manager #${landId} is already at maximum 100 Hours limit!`);
    return;
  }
  const doExtend = () => {
    mgr.activeTimer = Math.min(MAX_LIMIT, (mgr.activeTimer > 0 ? mgr.activeTimer : 0) + 36000); // +10h
    renderBeeManagers();
    updateBeeStickyHeaderAndStats();
    saveBeeStateDebounced();
  };
  if (typeof window.showRewardedAd === 'function') {
    window.showRewardedAd(doExtend, {
      adTitle: `Manager #${landId} (+10h)`,
      adDesc: `Watch sponsor video to extend Manager #${landId} by 10 Hours!`
    });
  } else {
    doExtend();
  }
};

/* ==========================================================================
   PAGE 5: ROYAL EXCHANGE & PRESTIGE
   ========================================================================== */
window.switchBeeExchangeSubtab = function(subtab) {
  const tabs = ['spin', 'energy', 'prestige'];
  tabs.forEach(t => {
    const btn = document.getElementById(`beeExchTab${t.charAt(0).toUpperCase() + t.slice(1)}`);
    const sec = document.getElementById(`beeExchangeSection${t.charAt(0).toUpperCase() + t.slice(1)}`);
    if (btn) btn.classList.toggle('active', t === subtab);
    if (sec) sec.classList.toggle('hidden', t !== subtab);
  });
  if (subtab === 'spin') renderBeeSpinExchange();
  if (subtab === 'prestige') renderBeePrestigeUI();
};

let currentBeeSpinPackageIdx = 0;
const BEE_SPIN_PACKAGES = [
  { tickets: 1, cost: 1e15, label: '1 Qa 🍯' },
  { tickets: 5, cost: 5e15, label: '5 Qa 🍯' },
  { tickets: 10, cost: 10e15, label: '10 Qa 🍯' },
  { tickets: 50, cost: 50e15, label: '50 Qa 🍯' },
  { tickets: 100, cost: 100e15, label: '100 Qa 🍯' }
];

window.stepBeeSpinPackage = function(dir) {
  currentBeeSpinPackageIdx = (currentBeeSpinPackageIdx + dir + BEE_SPIN_PACKAGES.length) % BEE_SPIN_PACKAGES.length;
  renderBeeSpinExchange();
};

function renderBeeSpinExchange() {
  const pkg = BEE_SPIN_PACKAGES[currentBeeSpinPackageIdx];
  const ticketLbl = document.getElementById('beeSpinPackageTicketsLabel');
  if (ticketLbl) ticketLbl.innerText = `${pkg.tickets} 🎡 Spin Coin${pkg.tickets > 1 ? 's' : ''}`;
  const costLbl = document.getElementById('beeSpinPackageCostLabel');
  if (costLbl) costLbl.innerText = pkg.label;
  const selectCount = document.getElementById('beeSpinSelectedCount');
  if (selectCount) selectCount.innerText = pkg.tickets;

  const coinsDisplay = document.getElementById('beeSpinExchCoinsDisplay');
  if (coinsDisplay) coinsDisplay.innerText = `${formatBeeNumber(beeState.honey || 0)} 🍯`;
  const ownedDisplay = document.getElementById('beeSpinExchOwnedDisplay');
  if (ownedDisplay && typeof gameState !== 'undefined') {
    ownedDisplay.innerText = `${gameState.player.spinCoins || 0} 🎡`;
  }
}

window.exchangeCurrentBeeSpinPackage = function(event) {
  if (event) event.stopPropagation();
  const pkg = BEE_SPIN_PACKAGES[currentBeeSpinPackageIdx];
  if ((beeState.honey || 0) < pkg.cost) {
    alert(`Need ${pkg.label}!`);
    return;
  }
  beeState.honey -= pkg.cost;
  if (typeof gameState !== 'undefined' && gameState.player) {
    gameState.player.spinCoins = (gameState.player.spinCoins || 0) + pkg.tickets;
  }
  renderBeeSpinExchange();
  updateBeeStickyHeaderAndStats();
  saveBeeStateDebounced();
};

window.exchangeBeeCoinsForSpin = function(mode, event) {
  if (event) event.stopPropagation();
  const maxPossible = Math.floor((beeState.honey || 0) / 1e15);
  if (maxPossible < 1) {
    alert('Need at least 1 Qa 🍯 Honey!');
    return;
  }
  beeState.honey -= (maxPossible * 1e15);
  if (typeof gameState !== 'undefined' && gameState.player) {
    gameState.player.spinCoins = (gameState.player.spinCoins || 0) + maxPossible;
  }
  renderBeeSpinExchange();
  updateBeeStickyHeaderAndStats();
  saveBeeStateDebounced();
};

window.executeBeeCoinToEnergy = function(amount) {
  let cost = amount === 'all' ? Math.floor(beeState.honey / 100) * 100 : amount;
  if (cost < 100 || (beeState.honey || 0) < cost) {
    alert('Need at least 100 🍯 Honey!');
    return;
  }
  const energyGain = Math.floor((cost / 100) * 29);
  beeState.honey -= cost;
  if (typeof gameState !== 'undefined' && gameState.reactor) {
    const maxE = gameState.reactor.maxEnergy || 1000;
    gameState.reactor.currentEnergy = Math.min(maxE, (gameState.reactor.currentEnergy || 0) + energyGain);
    if (typeof updateEnergyUI === 'function') updateEnergyUI();
  }
  updateBeeStickyHeaderAndStats();
  saveBeeStateDebounced();
};

function renderBeePrestigeUI() {
  const tier = (beeState.prestigeLevel || 0) + 1;
  const cost = tier === 1 ? 100 : tier * 1000;
  const reward = tier === 1 ? 10 : tier * 200;

  const cardTitle = document.getElementById('beePrestigeCardTitle');
  if (cardTitle) cardTitle.innerText = `Tier ${tier} Prestige Exchange`;
  const reqCoins = document.getElementById('beePrestigeReqCoins');
  if (reqCoins) reqCoins.innerText = `${formatBeeNumber(cost)} 🍯`;
  const rewardCoins = document.getElementById('beePrestigeRewardCoins');
  if (rewardCoins) rewardCoins.innerText = `+${reward} 🪙 Gold Coins`;
  const userCoins = document.getElementById('beePrestigeUserCoinsDisplay');
  if (userCoins) userCoins.innerText = `${formatBeeNumber(beeState.honey || 0)} 🍯`;
  const costDisplay = document.getElementById('beePrestigeCostDisplay');
  if (costDisplay) costDisplay.innerText = `${formatBeeNumber(cost)} 🍯`;
  const rewardDisplay = document.getElementById('beePrestigeRewardDisplay');
  if (rewardDisplay) rewardDisplay.innerText = `+${reward} 🪙`;
}

window.executeBeePrestige = function(event) {
  if (event) event.stopPropagation();
  const tier = (beeState.prestigeLevel || 0) + 1;
  const cost = tier === 1 ? 100 : tier * 1000;
  const reward = tier === 1 ? 10 : tier * 200;

  if ((beeState.honey || 0) < cost) {
    alert(`Need ${formatBeeNumber(cost)} 🍯 Honey!`);
    return;
  }

  beeState.honey -= cost;
  beeState.prestigeLevel = tier;
  if (typeof gameState !== 'undefined' && gameState.player) {
    gameState.player.coins = (gameState.player.coins || 0) + reward;
  }

  // Reset hives and meadows to Level 1
  beeState.plots = createDefaultBeePlots();
  beeState.wells = createDefaultBeeWells();

  alert(`👑 Prestige Successful! +${reward} 🪙 Gold Coins Claimed! Apiary restarted from Level 1.`);
  navigateBeePage(1);
  updateBeeStickyHeaderAndStats();
  saveBeeStateDebounced();
};

/* ==========================================================================
   STICKY HEADER UPDATER
   ========================================================================== */
function updateBeeStickyHeaderAndStats() {
  const hSticky = document.getElementById('beeStickyHoney');
  if (hSticky) hSticky.innerText = formatBeeNumber(beeState.honey || 0);

  const gSticky = document.getElementById('beeStickyGoldCoins');
  if (gSticky && typeof gameState !== 'undefined' && gameState.player) {
    gSticky.innerText = formatBeeNumber(gameState.player.coins || 0);
  }

  const dSticky = document.getElementById('beeStickyDiamonds');
  if (dSticky) dSticky.innerText = formatBeeNumber(beeState.diamonds || 0);

  const lSticky = document.getElementById('beeStickyLarvae');
  if (lSticky) lSticky.innerText = beeState.larvae || 0;

  const fSticky = document.getElementById('beeStickyFlowers');
  if (fSticky) fSticky.innerText = beeState.flowers || 0;

  const sSticky = document.getElementById('beeStickySmokers');
  if (sSticky) sSticky.innerText = beeState.smokers || 0;

  // Shop vault diamond label
  const sDiamond = document.getElementById('beeShopDiamondCount');
  if (sDiamond) sDiamond.innerText = `${beeState.diamonds || 0} 💎`;
  const sLarva = document.getElementById('beeShopLarvaCount');
  if (sLarva) sLarva.innerText = beeState.larvae || 0;
  const sFlower = document.getElementById('beeShopFlowerCount');
  if (sFlower) sFlower.innerText = beeState.flowers || 0;
  const sSmoker = document.getElementById('beeShopSmokerCount');
  if (sSmoker) sSmoker.innerText = beeState.smokers || 0;
}

/* ==========================================================================
   MAIN TICK LOOP
   ========================================================================== */
let beeLastTime = performance.now();
function beeMainLoop(now) {
  const deltaSec = Math.min(1.0, (now - beeLastTime) / 1000);
  beeLastTime = now;

  const isBeeActive = (typeof gameState !== 'undefined' && (gameState.currentTab === 'bee-farm' || gameState.currentTab === 'beefarm')) ||
                      (document.getElementById('pageBeeFarm') && document.getElementById('pageBeeFarm').classList.contains('active'));

  // 1. Tick 20 Hive Plots
  const booster = getActiveBeeProfitMultiplier();
  beeState.plots.forEach((plot, idx) => {
    if (!plot.unlocked) return;

    if (plot.plantStatus === 'growing') {
      plot.growthTimer = Math.max(0, (plot.growthTimer || 30.0) - deltaSec);
      if (plot.growthTimer <= 0) {
        plot.plantStatus = 'alive';
        plot.level = 1;
        plot.lifeTimer = 60.0;
        plot.timer = getBeePlotCycleTime(idx, 1);
        if (isBeeActive && beeState.currentPage === 1) renderBeePlots();
      }
    }

    if (plot.plantStatus === 'alive') {
      plot.lifeTimer = Math.max(0, (plot.lifeTimer || 0) - deltaSec);
      if (plot.lifeTimer <= 0) {
        plot.plantStatus = 'dead';
        if (isBeeActive && beeState.currentPage === 1) renderBeePlots();
        return;
      }

      const cycleTime = getBeePlotCycleTime(idx, plot.level);
      plot.timer = (plot.timer || cycleTime) - deltaSec;
      if (plot.timer <= 0) {
        const honeyGained = getBeePlotHoneyPerCycle(idx, plot.level) * booster;
        beeState.honey += honeyGained;
        plot.timer = cycleTime;
      }
    }
  });

  // 2. Tick 20 Flower Meadows
  beeState.wells.forEach(well => {
    if (!well.unlocked) return;
    well.timer = (well.timer || 0) + deltaSec;
    if (well.timer >= well.cycleTime) {
      well.timer = 0;
      beeState.flowers = (beeState.flowers || 0) + (well.basketOutput || 1);
    }
  });

  // 3. Tick 20 Managers
  if (Array.isArray(beeState.managers)) {
    beeState.managers.forEach(mgr => {
      if (mgr.unlocked && mgr.activeTimer > 0) {
        mgr.activeTimer = Math.max(0, mgr.activeTimer - deltaSec);
        // Auto feed flower if life is low
        const plot = beeState.plots[mgr.landId - 1];
        if (plot && plot.unlocked && plot.plantStatus === 'alive' && (plot.lifeTimer || 0) < 20 && (beeState.flowers || 0) > 0) {
          beeState.flowers--;
          const bonus = BEE_LAND_WATER_BONUS[plot.id - 1] || 10;
          const maxLife = getBeePlotMaxLifeLimit(plot.id - 1, plot.level);
          plot.lifeTimer = Math.min(maxLife, (plot.lifeTimer || 0) + bonus);
        }
      }
    });
  }

  // 4. Update UI
  if (isBeeActive) {
    updateBeeStickyHeaderAndStats();
    updateBeeBoosterUI();
    if (beeState.currentPage === 4) {
      beeState.managers.forEach(mgr => {
        const badge = document.getElementById(`beeMgrStatusBadge-${mgr.landId}`);
        if (badge && mgr.unlocked) {
          if (mgr.activeTimer > 0) {
            badge.className = 'bee-mgr-status-badge active';
            badge.innerText = `⚡ ${formatBeeContractDuration(mgr.activeTimer)}`;
          } else {
            badge.className = 'bee-mgr-status-badge expired';
            badge.innerText = '⏳ EXPIRED';
          }
        }
      });
    }
  }

  requestAnimationFrame(beeMainLoop);
}

/* ==========================================================================
   FORMATTERS
   ========================================================================== */
const BEE_NUM_SUFFIXES = [
  "", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No",
  "Dc", "Ud", "Dd", "Td", "Qad", "Qid", "Sxd", "Spd", "Ocd", "Nod", "Vg"
];

function formatBeeNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return "0";
  if (num < 1000) return Math.floor(num).toLocaleString();
  const tier = Math.min(BEE_NUM_SUFFIXES.length - 1, Math.floor(Math.log10(num) / 3));
  if (tier <= 0) return Math.floor(num).toLocaleString();
  const scale = Math.pow(10, tier * 3);
  const scaled = num / scale;
  return scaled.toFixed(scaled < 10 ? 2 : 1) + BEE_NUM_SUFFIXES[tier];
}

function initBeeFarmTycoonGame() {
  const mult = beeState.upgradeMultiplier || 1;
  const displayVal = mult === 'max' ? 'MAX' : `${mult}x`;
  document.querySelectorAll('.bee-mult-circle-val').forEach(el => el.innerText = displayVal);
  document.querySelectorAll('.bee-mult-circle-toggle-btn').forEach(btn => btn.setAttribute('data-mult', String(mult)));

  renderBeePlots();
  renderBeeWells();
  renderBeeManagers();
  updateBeeStickyHeaderAndStats();
  requestAnimationFrame(beeMainLoop);
}

window.initBeeFarmTycoonGame = initBeeFarmTycoonGame;
window.renderBeePlots = renderBeePlots;
window.renderBeeWells = renderBeeWells;
window.renderBeeManagers = renderBeeManagers;
window.updateBeeFarmMiniStats = updateBeeStickyHeaderAndStats;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBeeFarmTycoonGame);
} else {
  initBeeFarmTycoonGame();
}
