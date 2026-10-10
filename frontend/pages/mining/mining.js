/* ==========================================================================
   CRYSTAL MINING TYCOON ENGINE (pages/mining/mining.js)
   Exact replica of Sunflower Valley and Bee Farm architecture with Crystal Mining Theme:
   - 20 Mining Shafts (Levels 1 to 5000, 0.001s speed drop, Shaft 1 free)
   - 20 Geothermal Extractors (500s down to 1s at L5000, produce Coolants)
   - Mining Depot Shop: Drill Core (200 🪙/ad), Coolant 10-pack (250 🪙/ad 5), Pickaxe (200 🪙/ad),
     and 20-Minute Mining Profit Boosters (*2, *5, *10)
   - 20 Drill Operators / Managers: 1 Operator = 1 Mine, 300 💎 unlock slot,
     500/1000/1500 💎 Shards or 10 💎 (+24h) or 1 Ad (+10h), 100-Hour Max Limit
   - Crystal Exchange: 🎡 Lucky Spin Coins (1 Qa 💎 = 1 🎡, Stepper Carousel),
     ⚡ Geothermal Refinery (100 💎 = 29 ⚡), 👑 Prestige (100 💎 ➔ 10 🪙 Gold Coins)
   ========================================================================== */

const MINE_STORAGE_KEY = 'ENERGY_TAP_MINING_STATE_V4';

// 20 Shaft Base Unlock Costs (Plot 1 is Free)
const MINE_LAND_UNLOCK_COSTS = [
  0, 10, 50, 150, 300, 500, 800, 1200, 1800, 2500,
  3500, 5000, 7000, 9500, 13000, 18000, 25000, 35000, 50000, 75000
];

// 20 Geothermal Extractors Base Unlock Costs
const MINE_WELL_UNLOCK_COSTS = [
  0, 10, 30, 75, 150, 300, 500, 800, 1200, 1800,
  2500, 3500, 5000, 7000, 9500, 13000, 18000, 25000, 35000, 50000
];

const MINE_WELL_BASE_TIMES = Array.from({ length: 20 }, (_, i) => (i + 1) * 100);

const MINE_WELL_NAMES = [
  "Sub-Zero Cryo-Pump #1", "Permafrost Wellhead #2", "Glacial Syphon #3",
  "Nitrogen Condenser #4", "Abyssal Coolant Bore #5", "Cryo-Geyser Tap #6",
  "Sub-Terra Heat Sink #7", "Borehole Freon Rig #8", "Deep Mantle Chiller #9",
  "Tectonic Cryo-Vat #10", "Magma Wall Condenser #11", "Lithospheric Radiator #12",
  "Thermal Void Pump #13", "Zero-Kelvin Extractor #14", "Stasis Field Chiller #15",
  "Cryo-Core Injector #16", "Perma-Deep Siphon #17", "Glacier Core Vent #18",
  "Absolute Zero Bore #19", "Apex Chrono-Cryo Spire #20"
];

// Level 1 Shards Generated
const MINE_LAND_L1_COINS = [
  1, 100, 1e3, 10e3, 100e3, 1e6, 10e6, 100e6, 1e9, 10e9,
  100e9, 1e12, 10e12, 100e12, 1e15, 10e15, 100e15, 1e18, 10e18, 100e18
];

// Production Time at Level 1 (sec)
const MINE_LAND_BASE_TIMES = [
  60, 300, 600, 900, 600, 1200, 1500, 1800, 2100, 2400,
  2700, 3000, 3300, 3600, 3900, 4200, 4500, 4800, 5100, 5400
];

// Base Life Limits at Level 1 (sec)
const MINE_LAND_BASE_LIFE_LIMITS = [
  100, 200, 300, 400, 500, 600, 700, 800, 900, 1000,
  1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000
];

// Coolant Bonus (sec added per coolant)
const MINE_LAND_WATER_BONUS = [
  10, 19, 28, 37, 46, 55, 64, 73, 82, 91,
  100, 109, 118, 127, 136, 145, 154, 163, 172, 181
];

// Level 5000 Shards Generated
const MINE_LAND_L5000_COINS = [
  1, 1e6, 1e9, 10e9, 1e12, 100e12, 10e15, 1e18, 100e18, 10e21,
  1e24, 100e24, 10e27, 1e30, 100e30, 10e33, 1e36, 100e36, 10e39, 1e42
];

// Production Time at Level 5000 (sec)
const MINE_LAND_L5000_TIMES = [
  0.001, 0.001, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01,
  0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01
];

const MINE_LAND_L5000_LIFE_LIMITS = [
  500, 1800, 3600, 5400, 7200, 9000, 10800, 12600, 14400, 16200,
  18000, 19800, 21600, 23400, 25200, 27000, 28800, 30600, 32400, 34200
];

function createDefaultMiningPlots() {
  const plots = [];
  for (let i = 1; i <= 20; i++) {
    const isUnlocked = i === 1;
    plots.push({
      id: i,
      unlocked: isUnlocked,
      unlockCost: MINE_LAND_UNLOCK_COSTS[i - 1],
      plantStatus: isUnlocked ? 'alive' : 'empty', // 'empty' | 'growing' | 'alive' | 'dead'
      level: 1,
      growthTimer: 0,
      growthDuration: 30.0,
      lifeTimer: isUnlocked ? 100.0 : 0,
      maxLifeLimit: MINE_LAND_BASE_LIFE_LIMITS[i - 1] || 500,
      timer: MINE_LAND_BASE_TIMES[i - 1] || 60,
      waterUsageCount: 0,
      storedCoins: 0,
      isWithered: false
    });
  }
  return plots;
}

function createDefaultMiningWells() {
  const wells = [];
  for (let i = 1; i <= 20; i++) {
    const isUnlocked = i === 1;
    wells.push({
      id: i,
      name: MINE_WELL_NAMES[i - 1],
      unlocked: isUnlocked,
      unlockCost: MINE_WELL_UNLOCK_COSTS[i - 1],
      level: 1,
      timer: 0,
      cycleTime: MINE_WELL_BASE_TIMES[i - 1],
      basketOutput: 1
    });
  }
  return wells;
}

function createDefaultMiningManagers() {
  const managers = [];
  const avatars = ['⛏️', '🤖', '👷‍♂️', '💠', '❄️', '⛏️', '🤖', '👷‍♂️', '💠', '❄️', '⛏️', '🤖', '👷‍♂️', '💠', '❄️', '⛏️', '🤖', '👷‍♂️', '💠', '❄️'];
  for (let i = 1; i <= 20; i++) {
    managers.push({
      landId: i,
      avatar: avatars[i - 1] || '⛏️',
      unlocked: false,
      hireCount: 0,
      activeTimer: 0 // seconds (capped at 360,000s = 100 hours)
    });
  }
  return managers;
}

function loadInitialMiningState() {
  try {
    localStorage.removeItem('ENERGY_TAP_MINING_STATE_V1');
    localStorage.removeItem('ENERGY_TAP_MINING_STATE_V2');
    localStorage.removeItem('ENERGY_TAP_MINING_STATE_V3');
  } catch (e) {}

  try {
    const raw = localStorage.getItem(MINE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.plots)) {
        if (!Array.isArray(parsed.wells) || parsed.wells.length !== 20) {
          parsed.wells = createDefaultMiningWells();
        }
        if (!Array.isArray(parsed.managers) || parsed.managers.length !== 20) {
          parsed.managers = createDefaultMiningManagers();
        }
        if (typeof parsed.shards !== 'number') parsed.shards = 0;
        if (typeof parsed.cores !== 'number') parsed.cores = 0;
        if (typeof parsed.coolants !== 'number') parsed.coolants = 0;
        if (typeof parsed.pickaxes !== 'number') parsed.pickaxes = 0;
        if (typeof parsed.diamonds !== 'number') parsed.diamonds = 0;
        if (!parsed.upgradeMultiplier) parsed.upgradeMultiplier = 1;
        if (!parsed.activeBooster) parsed.activeBooster = null;
        if (typeof parsed.prestigeLevel !== 'number') parsed.prestigeLevel = 0;
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load mining state:', e);
  }

  return {
    currentPage: 1,
    shards: 0,
    diamonds: 0,
    cores: 0,
    coolants: 0,
    pickaxes: 0,
    upgradeMultiplier: 1,
    activeBooster: null,
    prestigeLevel: 0,
    plots: createDefaultMiningPlots(),
    wells: createDefaultMiningWells(),
    managers: createDefaultMiningManagers()
  };
}

const miningState = loadInitialMiningState();
window.miningState = miningState;

let mineSaveTimeout = null;
function saveMiningStateDebounced() {
  if (mineSaveTimeout) return;
  mineSaveTimeout = setTimeout(() => {
    mineSaveTimeout = null;
    try {
      localStorage.setItem(MINE_STORAGE_KEY, JSON.stringify(miningState));
    } catch (e) {
      console.warn('Mining state save error:', e);
    }
  }, 1000);
}

/* ==========================================================================
   NAVIGATION
   ========================================================================== */
window.navigateMiningPage = function(pageNum) {
  miningState.currentPage = pageNum;

  for (let i = 1; i <= 5; i++) {
    const pageEl = document.getElementById(`minePage${i}`);
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
    1: 'mineMenuTabGarden',
    2: 'mineMenuTabWater',
    3: 'mineMenuTabShop',
    4: 'mineMenuTabWorkers',
    5: 'mineMenuTabConvert'
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

  const viewContainer = document.getElementById('pageMining');
  if (viewContainer) viewContainer.scrollTop = 0;

  if (pageNum === 1) renderMiningPlots();
  if (pageNum === 2) renderMiningWells();
  if (pageNum === 4) renderMiningManagers();
  if (pageNum === 5) {
    renderMineSpinExchange();
    renderMinePrestigeUI();
  }

  updateMiningStickyHeaderAndStats();
  saveMiningStateDebounced();
};

// Compatibility alias
window.navigateMiningTab = function(pageNum) {
  window.navigateMiningPage(pageNum);
};

/* ==========================================================================
   MULTIPLIER TOGGLE
   ========================================================================== */
window.toggleMineUpgradeMultiplier = function(event) {
  if (event) event.stopPropagation();
  const current = miningState.upgradeMultiplier || 1;
  let next = 1;
  if (current === 1) next = 10;
  else if (current === 10) next = 100;
  else if (current === 100) next = 'max';
  else next = 1;

  miningState.upgradeMultiplier = next;
  const displayVal = next === 'max' ? 'MAX' : `${next}x`;
  document.querySelectorAll('.mine-mult-circle-val').forEach(el => el.innerText = displayVal);
  document.querySelectorAll('.mine-mult-circle-toggle-btn').forEach(btn => btn.setAttribute('data-mult', String(next)));
  renderMiningPlots();
  renderMiningWells();
};

/* ==========================================================================
   PAGE 1: 20 MINING SHAFTS (Lv 1 - 5000)
   ========================================================================== */
function getMinePlotCycleTime(landIdx, level) {
  const baseTime = MINE_LAND_BASE_TIMES[landIdx] || 60;
  const targetTime = MINE_LAND_L5000_TIMES[landIdx] || 0.01;
  const prog = Math.min(1.0, Math.max(0, (level - 1) / 4999));
  return Math.max(targetTime, baseTime * Math.pow(targetTime / baseTime, prog));
}

function getMinePlotShardsPerCycle(landIdx, level) {
  const baseCoins = MINE_LAND_L1_COINS[landIdx] || 1;
  const targetCoins = MINE_LAND_L5000_COINS[landIdx] || 100;
  const prog = Math.min(1.0, Math.max(0, (level - 1) / 4999));
  return Math.max(baseCoins, baseCoins * Math.pow(targetCoins / baseCoins, prog));
}

function getMinePlotMaxLifeLimit(landIdx, level) {
  const baseLife = MINE_LAND_BASE_LIFE_LIMITS[landIdx] || 500;
  const targetLife = MINE_LAND_L5000_LIFE_LIMITS[landIdx] || 500;
  const prog = Math.min(1.0, Math.max(0, (level - 1) / 4999));
  return Math.max(baseLife, baseLife + (targetLife - baseLife) * prog);
}

function renderMiningPlots() {
  const container = document.getElementById('minePlotsContainer');
  if (!container) return;

  const unlockedCount = miningState.plots.filter(p => p.unlocked).length;
  const summaryLabel = document.getElementById('minePlotsSummaryLabel');
  if (summaryLabel) summaryLabel.innerText = `${unlockedCount} of 20 Shafts Unlocked`;

  let totalIncome = 0;
  miningState.plots.forEach((p, idx) => {
    if (p.unlocked && p.plantStatus === 'alive') {
      const cycleTime = getMinePlotCycleTime(idx, p.level);
      const shardsPerCycle = getMinePlotShardsPerCycle(idx, p.level);
      totalIncome += (shardsPerCycle / Math.max(0.001, cycleTime));
    }
  });
  const booster = getActiveMineProfitMultiplier();
  totalIncome *= booster;
  const rateEl = document.getElementById('mineTotalIncomeRate');
  if (rateEl) rateEl.innerText = formatMineNumber(totalIncome);

  let html = '';
  miningState.plots.forEach((plot, idx) => {
    if (!plot.unlocked) {
      html += `
        <div class="sf-plot-tile sf-rect-card locked bg-stone-900/90 border border-stone-800 rounded-xl p-3 flex flex-col justify-between gap-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-black text-stone-400">🔒 Shaft #${plot.id} (Locked)</span>
            <span class="text-[9px] bg-stone-800 text-stone-300 font-mono px-2 py-0.5 rounded-full">Slot ${plot.id}</span>
          </div>
          <div class="flex items-center justify-between pt-1">
            <span class="text-xs font-mono font-bold text-cyan-300">${plot.unlockCost} 💎</span>
            <button onclick="unlockMinePlot(${plot.id}, event)" class="bg-cyan-600 hover:bg-cyan-500 text-stone-950 font-black text-xs px-3 py-1.5 rounded-lg active:scale-95 transition">
              <span>Unlock Shaft</span>
            </button>
          </div>
        </div>
      `;
      return;
    }

    const cycleTime = getMinePlotCycleTime(idx, plot.level);
    const shardsPerCycle = getMinePlotShardsPerCycle(idx, plot.level);
    const maxLife = getMinePlotMaxLifeLimit(idx, plot.level);
    const isAlive = plot.plantStatus === 'alive';
    const isGrowing = plot.plantStatus === 'growing';
    const isDead = plot.plantStatus === 'dead';
    const isEmpty = plot.plantStatus === 'empty';

    html += `
      <div class="sf-plot-tile sf-rect-card bg-stone-950/90 border ${isAlive ? 'border-cyan-500/60' : 'border-stone-800'} rounded-xl p-3 flex flex-col gap-2.5 shadow-md">
        <div class="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div class="flex items-center gap-2">
            <span class="text-xl">${isAlive ? '💎' : isGrowing ? '🪨' : isDead ? '⛏️' : '💠'}</span>
            <div>
              <span class="text-xs font-black text-cyan-300">Shaft #${plot.id}</span>
              <span class="text-[9.5px] text-stone-400 font-mono ml-1.5">Lv. ${plot.level}/5000</span>
            </div>
          </div>
          <span class="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full ${isAlive ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : isGrowing ? 'bg-cyan-950 text-cyan-300' : 'bg-rose-950 text-rose-300'}">
            ${isAlive ? 'ACTIVE' : isGrowing ? 'DRILLING' : isDead ? 'OVERHEATED' : 'EMPTY'}
          </span>
        </div>

        <div class="grid grid-cols-2 gap-2 text-[10px]">
          <div class="bg-stone-900/80 p-1.5 rounded-lg border border-stone-800/80">
            <span class="text-stone-400 block text-[9px]">Output / Cycle:</span>
            <span class="text-cyan-300 font-mono font-bold">${formatMineNumber(shardsPerCycle)} 💎</span>
          </div>
          <div class="bg-stone-900/80 p-1.5 rounded-lg border border-stone-800/80">
            <span class="text-stone-400 block text-[9px]">Cycle Speed:</span>
            <span class="text-blue-300 font-mono font-bold">${cycleTime.toFixed(cycleTime < 0.05 ? 3 : 1)}s</span>
          </div>
        </div>

        ${isAlive ? `
          <div class="flex items-center justify-between text-[10px] text-stone-400">
            <span>Thermal Life: <strong class="text-rose-300 font-mono" id="mineLifeTimer-${plot.id}">${(plot.lifeTimer || 0).toFixed(1)}s</strong></span>
            <span>Max Cap: <strong class="text-stone-300 font-mono">${Math.floor(maxLife)}s</strong></span>
          </div>
          <div class="w-full bg-stone-900 rounded-full h-1.5 overflow-hidden border border-stone-800">
            <div id="mineLifeBar-${plot.id}" class="bg-gradient-to-r from-cyan-500 to-rose-500 h-full" style="width: ${Math.min(100, Math.max(0, ((plot.lifeTimer || 0) / maxLife) * 100))}%;"></div>
          </div>
        ` : ''}

        <div class="grid grid-cols-2 gap-2 pt-1">
          ${isEmpty ? `
            <button onclick="placeMineCore(${plot.id}, event)" class="col-span-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-2 rounded-lg active:scale-95 transition">
              <span>🪨 Install Drill Core</span>
            </button>
          ` : isDead ? `
            <button onclick="pickaxeMinePlot(${plot.id}, event)" class="col-span-2 bg-stone-700 hover:bg-stone-600 text-white font-black text-xs py-2 rounded-lg active:scale-95 transition">
              <span>⛏️ Clear Slag</span>
            </button>
          ` : isGrowing ? `
            <div class="col-span-2 text-center text-xs text-cyan-300 font-mono py-1">
              Drilling: ${(plot.growthTimer || 0).toFixed(1)}s
            </div>
          ` : `
            <button onclick="coolMinePlot(${plot.id}, event)" class="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs py-2 rounded-lg active:scale-95 transition">
              <span>❄️ Inject Coolant (+10s)</span>
            </button>
            <button onclick="upgradeMinePlot(${plot.id}, event)" class="bg-cyan-600 hover:bg-cyan-500 text-stone-950 font-black text-xs py-2 rounded-lg active:scale-95 transition">
              <span>⬆️ Upgrade</span>
            </button>
          `}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

window.unlockMinePlot = function(plotId, event) {
  if (event) event.stopPropagation();
  const plot = miningState.plots.find(p => p.id === plotId);
  if (!plot) return;
  const cost = plot.unlockCost || 0;
  if ((miningState.diamonds || 0) < cost) {
    alert(`Need ${cost} 💎 Diamonds!`);
    return;
  }
  miningState.diamonds -= cost;
  plot.unlocked = true;
  plot.plantStatus = 'empty';
  renderMiningPlots();
  updateMiningStickyHeaderAndStats();
  saveMiningStateDebounced();
};

window.placeMineCore = function(plotId, event) {
  if (event) event.stopPropagation();
  const plot = miningState.plots.find(p => p.id === plotId);
  if (!plot || plot.plantStatus !== 'empty') return;
  if ((miningState.cores || 0) < 1) {
    alert('Need 1 🪨 Drill Core! Buy from Mining Depot.');
    return;
  }
  miningState.cores -= 1;
  plot.plantStatus = 'growing';
  plot.growthTimer = 30.0;
  renderMiningPlots();
  updateMiningStickyHeaderAndStats();
  saveMiningStateDebounced();
};

window.coolMinePlot = function(plotId, event) {
  if (event) event.stopPropagation();
  const plot = miningState.plots.find(p => p.id === plotId);
  if (!plot || plot.plantStatus !== 'alive') return;
  if ((miningState.coolants || 0) < 1) {
    alert('Need 1 ❄️ Coolant Canister! Buy from Mining Depot or Extract.');
    return;
  }
  miningState.coolants -= 1;
  const bonus = MINE_LAND_WATER_BONUS[plot.id - 1] || 10;
  const maxLife = getMinePlotMaxLifeLimit(plot.id - 1, plot.level);
  plot.lifeTimer = Math.min(maxLife, (plot.lifeTimer || 0) + bonus);
  renderMiningPlots();
  updateMiningStickyHeaderAndStats();
  saveMiningStateDebounced();
};

window.upgradeMinePlot = function(plotId, event) {
  if (event) event.stopPropagation();
  const plot = miningState.plots.find(p => p.id === plotId);
  if (!plot || plot.plantStatus !== 'alive') return;
  const mult = miningState.upgradeMultiplier === 'max' ? 100 : (Number(miningState.upgradeMultiplier) || 1);
  const costPerLvl = 50 * plot.level;
  const totalCost = costPerLvl * mult;
  if ((miningState.shards || 0) < totalCost) {
    alert(`Need ${formatMineNumber(totalCost)} 💎 Shards!`);
    return;
  }
  miningState.shards -= totalCost;
  plot.level = Math.min(5000, plot.level + mult);
  renderMiningPlots();
  updateMiningStickyHeaderAndStats();
  saveMiningStateDebounced();
};

window.pickaxeMinePlot = function(plotId, event) {
  if (event) event.stopPropagation();
  const plot = miningState.plots.find(p => p.id === plotId);
  if (!plot || plot.plantStatus !== 'dead') return;
  if ((miningState.pickaxes || 0) < 1) {
    alert('Need 1 ⛏️ Sonic Pickaxe! Buy from Mining Depot.');
    return;
  }
  miningState.pickaxes -= 1;
  plot.plantStatus = 'empty';
  renderMiningPlots();
  updateMiningStickyHeaderAndStats();
  saveMiningStateDebounced();
};

/* ==========================================================================
   PAGE 2: 20 GEOTHERMAL EXTRACTORS
   ========================================================================== */
function renderMiningWells() {
  const container = document.getElementById('mineWellsContainer');
  if (!container) return;

  const unlockedCount = miningState.wells.filter(w => w.unlocked).length;
  const summaryLabel = document.getElementById('mineWellsSummaryLabel');
  if (summaryLabel) summaryLabel.innerText = `${unlockedCount} of 20 Units Unlocked`;

  let html = '';
  miningState.wells.forEach(well => {
    if (!well.unlocked) {
      html += `
        <div class="sf-plot-tile sf-rect-card locked bg-stone-900/90 border border-stone-800 rounded-xl p-3 flex flex-col justify-between gap-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-black text-stone-400">🔒 ${well.name} (Locked)</span>
            <span class="text-[9px] bg-stone-800 text-stone-300 font-mono px-2 py-0.5 rounded-full">Unit ${well.id}</span>
          </div>
          <div class="flex items-center justify-between pt-1">
            <span class="text-xs font-mono font-bold text-blue-300">${well.unlockCost} 💎</span>
            <button onclick="unlockMineWell(${well.id}, event)" class="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-3 py-1.5 rounded-lg active:scale-95 transition">
              <span>Unlock Unit</span>
            </button>
          </div>
        </div>
      `;
      return;
    }

    html += `
      <div class="sf-plot-tile sf-rect-card bg-stone-950/90 border border-blue-500/50 rounded-xl p-3 flex flex-col gap-2 shadow-md">
        <div class="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div class="flex items-center gap-2">
            <span class="text-xl">❄️</span>
            <div>
              <span class="text-xs font-black text-blue-300">${well.name}</span>
              <span class="text-[9.5px] text-stone-400 font-mono ml-1.5">Lv. ${well.level}/5000</span>
            </div>
          </div>
          <span class="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-700">
            EXTRACTING
          </span>
        </div>

        <div class="flex items-center justify-between text-[10px] text-stone-300">
          <span>Cycle: <strong class="text-blue-300 font-mono" id="mineWellTimer-${well.id}">${(well.timer || 0).toFixed(1)}s</strong></span>
          <span>Output: <strong class="text-emerald-400 font-mono">+${well.basketOutput || 1} ❄️</strong></span>
        </div>

        <div class="grid grid-cols-2 gap-2 pt-1">
          <button onclick="collectMineWellCoolant(${well.id}, event)" class="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 text-white font-black text-xs py-2 rounded-lg active:scale-95 transition">
            <span>❄️ Harvest Coolant</span>
          </button>
          <button onclick="upgradeMineWell(${well.id}, event)" class="bg-stone-800 hover:bg-stone-700 text-blue-300 font-black text-xs py-2 rounded-lg border border-blue-700/60 active:scale-95 transition">
            <span>⬆️ Upgrade</span>
          </button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

window.unlockMineWell = function(wellId, event) {
  if (event) event.stopPropagation();
  const well = miningState.wells.find(w => w.id === wellId);
  if (!well) return;
  const cost = well.unlockCost || 0;
  if ((miningState.diamonds || 0) < cost) {
    alert(`Need ${cost} 💎 Diamonds!`);
    return;
  }
  miningState.diamonds -= cost;
  well.unlocked = true;
  renderMiningWells();
  updateMiningStickyHeaderAndStats();
  saveMiningStateDebounced();
};

window.collectMineWellCoolant = function(wellId, event) {
  if (event) event.stopPropagation();
  const well = miningState.wells.find(w => w.id === wellId);
  if (!well || !well.unlocked) return;
  const gain = well.basketOutput || 1;
  miningState.coolants = (miningState.coolants || 0) + gain;
  renderMiningWells();
  updateMiningStickyHeaderAndStats();
  saveMiningStateDebounced();
};

window.upgradeMineWell = function(wellId, event) {
  if (event) event.stopPropagation();
  const well = miningState.wells.find(w => w.id === wellId);
  if (!well || !well.unlocked) return;
  const cost = 100 * well.level;
  if ((miningState.shards || 0) < cost) {
    alert(`Need ${formatMineNumber(cost)} 💎 Shards!`);
    return;
  }
  miningState.shards -= cost;
  well.level = Math.min(5000, well.level + 1);
  well.cycleTime = Math.max(1, well.cycleTime * 0.98);
  if (well.level % 10 === 0) well.basketOutput = (well.basketOutput || 1) + 1;
  renderMiningWells();
  updateMiningStickyHeaderAndStats();
  saveMiningStateDebounced();
};

/* ==========================================================================
   PAGE 3: MINING DEPOT SHOP (200 🪙 Core/Pickaxe, 250 🪙 10 Coolants, Boosters)
   ========================================================================== */
window.buyMineItem = function(itemType, count = 1, currency = 'gold') {
  if (typeof gameState === 'undefined' || !gameState.player) return;
  let cost = 0;

  if (itemType === 'core') {
    cost = 200;
    if ((gameState.player.coins || 0) < cost) {
      alert(`Need 200 🪙 Gold Coins! (Have: ${Math.floor(gameState.player.coins || 0)})`);
      return;
    }
    gameState.player.coins -= cost;
    miningState.cores = (miningState.cores || 0) + count;
  } else if (itemType === 'coolant') {
    cost = 250;
    if ((gameState.player.coins || 0) < cost) {
      alert(`Need 250 🪙 Gold Coins! (Have: ${Math.floor(gameState.player.coins || 0)})`);
      return;
    }
    gameState.player.coins -= cost;
    miningState.coolants = (miningState.coolants || 0) + (count || 10);
  } else if (itemType === 'pickaxe') {
    cost = 200;
    if ((gameState.player.coins || 0) < cost) {
      alert(`Need 200 🪙 Gold Coins! (Have: ${Math.floor(gameState.player.coins || 0)})`);
      return;
    }
    gameState.player.coins -= cost;
    miningState.pickaxes = (miningState.pickaxes || 0) + count;
  }

  if (typeof window.updateUI === 'function') window.updateUI();
  if (typeof window.saveGame === 'function') window.saveGame(true);
  updateMiningStickyHeaderAndStats();
  saveMiningStateDebounced();
};

window.openMineAdModal = function(rewardType) {
  const doReward = () => {
    if (rewardType === 'core') miningState.cores = (miningState.cores || 0) + 1;
    else if (rewardType === 'coolant') miningState.coolants = (miningState.coolants || 0) + 5;
    else if (rewardType === 'pickaxe') miningState.pickaxes = (miningState.pickaxes || 0) + 1;
    updateMiningStickyHeaderAndStats();
    saveMiningStateDebounced();
  };

  if (typeof window.showRewardedAd === 'function') {
    window.showRewardedAd(doReward, {
      adTitle: `Free ${rewardType}`,
      adDesc: `Watch sponsor video to claim free Mining Depot Supplies!`
    });
  } else {
    doReward();
  }
};

window.activateMineProfitBooster = function(multiplier) {
  const doActivate = () => {
    miningState.activeBooster = {
      multiplier: Number(multiplier) || 2,
      expiresAt: Date.now() + 20 * 60 * 1000
    };
    updateMineBoosterUI();
    saveMiningStateDebounced();
  };

  if (typeof window.showRewardedAd === 'function') {
    window.showRewardedAd(doActivate, {
      adTitle: `${multiplier}X Mining Profit Booster`,
      adDesc: `Watch sponsor video to boost all crystal mining shards by ${multiplier}X for 20 Minutes!`
    });
  } else {
    doActivate();
  }
};

function getActiveMineProfitMultiplier() {
  if (miningState && miningState.activeBooster && miningState.activeBooster.expiresAt > Date.now()) {
    return Number(miningState.activeBooster.multiplier) || 1;
  }
  return 1;
}

function updateMineBoosterUI() {
  const badge = document.getElementById('mineBoosterActiveBadge');
  if (!badge) return;
  if (miningState && miningState.activeBooster && miningState.activeBooster.expiresAt > Date.now()) {
    const remMs = miningState.activeBooster.expiresAt - Date.now();
    const remMins = Math.floor(remMs / 60000);
    const remSecs = Math.floor((remMs % 60000) / 1000);
    badge.className = "bg-cyan-950 text-cyan-300 text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full border border-cyan-500/50 animate-pulse";
    badge.innerText = `⚡ ${miningState.activeBooster.multiplier}X ACTIVE (${remMins}m ${String(remSecs).padStart(2, '0')}s)`;
  } else {
    badge.className = "bg-stone-800 text-stone-400 text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full border border-stone-700";
    badge.innerText = "No Active Booster";
  }
}

/* ==========================================================================
   PAGE 4: 20 DRILL OPERATORS / MANAGERS (100-Hour Max Cap)
   ========================================================================== */
function formatMineContractDuration(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hrs > 0) return `${hrs}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  return `${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
}

function renderMiningManagers() {
  const listEl = document.getElementById('mineManagersVerticalList');
  if (!listEl) return;

  if (!Array.isArray(miningState.managers) || miningState.managers.length !== 20) {
    miningState.managers = createDefaultMiningManagers();
  }

  const activeCount = miningState.managers.filter(m => m.unlocked && m.activeTimer > 0).length;
  const countBadge = document.getElementById('mineManagersSummaryLabel');
  if (countBadge) countBadge.innerText = `${activeCount} / 20 Active`;

  let html = '';
  miningState.managers.forEach(mgr => {
    const plot = miningState.plots ? miningState.plots[mgr.landId - 1] : null;
    const isPlotUnlocked = plot && plot.unlocked;
    const isActive = mgr.unlocked && mgr.activeTimer > 0;
    const nextCoinCost = (mgr.hireCount + 1) * 500;

    html += `
      <div class="mine-mgr-card ${isActive ? 'active-contract' : (mgr.unlocked ? '' : 'locked')}" id="mineMgrCard-${mgr.landId}">
        <div class="mine-mgr-card-top">
          <div class="mine-mgr-info-left">
            <div class="mine-mgr-avatar-box">
              <span>${mgr.avatar || '⛏️'}</span>
            </div>
            <div class="mine-mgr-title-box">
              <div class="mine-mgr-name">
                <span>Shaft #${mgr.landId} Operator</span>
                <span class="text-[9px] bg-cyan-950/80 text-cyan-300 font-bold px-1.5 py-0.5 rounded border border-cyan-700/60 font-mono">Auto</span>
              </div>
              <div class="mine-mgr-sub">
                <span>${isPlotUnlocked ? `Manages Shaft #${mgr.landId} &bull; Auto-Cool ❄️ &amp; Auto-Harvest 💎` : `⚠️ Unlock Shaft #${mgr.landId} first`}</span>
              </div>
            </div>
          </div>
          <div class="mine-mgr-status-badge ${!mgr.unlocked ? 'locked' : (isActive ? 'active' : 'expired')}" id="mineMgrStatusBadge-${mgr.landId}">
            ${!mgr.unlocked ? '🔒 LOCKED' : (isActive ? `⚡ ${formatMineContractDuration(mgr.activeTimer)}` : '⏳ EXPIRED')}
          </div>
        </div>

        <div class="mine-mgr-actions-row">
          ${!mgr.unlocked ? `
            <button class="mine-mgr-unlock-btn" onclick="unlockMineManager(${mgr.landId}, event)" title="Unlock Operator Slot (300 💎)">
              <span>💎 Hire Drill Operator (300 💎)</span>
            </button>
          ` : `
            <button class="mine-mgr-diamond-btn" onclick="hireMineManagerDiamonds(${mgr.landId}, event)">
              <span>💎 10 💎 (+24h)</span>
            </button>
            <button class="mine-mgr-ad-btn" onclick="hireMineManagerAd(${mgr.landId}, event)">
              <span>📢 Ad (+10h)</span>
            </button>
            <button class="mine-mgr-coin-btn" onclick="hireMineManagerCoins(${mgr.landId}, event)">
              <span>💎 1 Day (${formatMineNumber(nextCoinCost)} 💎)</span>
            </button>
          `}
        </div>
      </div>
    `;
  });

  listEl.innerHTML = html;
}

window.unlockMineManager = function(landId, event) {
  if (event) event.stopPropagation();
  const mgr = miningState.managers.find(m => m.landId === landId);
  if (!mgr) return;
  if ((miningState.diamonds || 0) < 300) {
    alert(`Need 300 💎 Diamonds! (Have: ${miningState.diamonds || 0})`);
    return;
  }
  miningState.diamonds -= 300;
  mgr.unlocked = true;
  mgr.activeTimer = Math.min(360000, 86400);
  renderMiningManagers();
  updateMiningStickyHeaderAndStats();
  saveMiningStateDebounced();
};

window.hireMineManagerDiamonds = function(landId, event) {
  if (event) event.stopPropagation();
  const mgr = miningState.managers.find(m => m.landId === landId);
  if (!mgr || !mgr.unlocked) return;
  const MAX_LIMIT = 360000;
  if ((mgr.activeTimer || 0) >= MAX_LIMIT) {
    alert(`Operator #${landId} is already at maximum 100 Hours limit!`);
    return;
  }
  if ((miningState.diamonds || 0) < 10) {
    alert(`Need 10 💎 Diamonds!`);
    return;
  }
  miningState.diamonds -= 10;
  mgr.activeTimer = Math.min(MAX_LIMIT, (mgr.activeTimer > 0 ? mgr.activeTimer : 0) + 86400);
  renderMiningManagers();
  updateMiningStickyHeaderAndStats();
  saveMiningStateDebounced();
};

window.hireMineManagerCoins = function(landId, event) {
  if (event) event.stopPropagation();
  const mgr = miningState.managers.find(m => m.landId === landId);
  if (!mgr || !mgr.unlocked) return;
  const MAX_LIMIT = 360000;
  if ((mgr.activeTimer || 0) >= MAX_LIMIT) {
    alert(`Operator #${landId} is already at maximum 100 Hours limit!`);
    return;
  }
  const cost = (mgr.hireCount + 1) * 500;
  if ((miningState.shards || 0) < cost) {
    alert(`Need ${formatMineNumber(cost)} 💎 Shards!`);
    return;
  }
  miningState.shards -= cost;
  mgr.hireCount++;
  mgr.activeTimer = Math.min(MAX_LIMIT, (mgr.activeTimer > 0 ? mgr.activeTimer : 0) + 86400);
  renderMiningManagers();
  updateMiningStickyHeaderAndStats();
  saveMiningStateDebounced();
};

window.hireMineManagerAd = function(landId, event) {
  if (event) event.stopPropagation();
  const mgr = miningState.managers.find(m => m.landId === landId);
  if (!mgr || !mgr.unlocked) return;
  const MAX_LIMIT = 360000;
  if ((mgr.activeTimer || 0) >= MAX_LIMIT) {
    alert(`Operator #${landId} is already at maximum 100 Hours limit!`);
    return;
  }
  const doExtend = () => {
    mgr.activeTimer = Math.min(MAX_LIMIT, (mgr.activeTimer > 0 ? mgr.activeTimer : 0) + 36000);
    renderMiningManagers();
    updateMiningStickyHeaderAndStats();
    saveMiningStateDebounced();
  };
  if (typeof window.showRewardedAd === 'function') {
    window.showRewardedAd(doExtend, {
      adTitle: `Operator #${landId} (+10h)`,
      adDesc: `Watch sponsor video to extend Operator #${landId} by 10 Hours!`
    });
  } else {
    doExtend();
  }
};

/* ==========================================================================
   PAGE 5: CRYSTAL EXCHANGE & PRESTIGE
   ========================================================================== */
window.switchMineExchangeSubtab = function(subtab) {
  const tabs = ['spin', 'energy', 'prestige'];
  tabs.forEach(t => {
    const btn = document.getElementById(`mineExchTab${t.charAt(0).toUpperCase() + t.slice(1)}`);
    const sec = document.getElementById(`mineExchangeSection${t.charAt(0).toUpperCase() + t.slice(1)}`);
    if (btn) btn.classList.toggle('active', t === subtab);
    if (sec) sec.classList.toggle('hidden', t !== subtab);
  });
  if (subtab === 'spin') renderMineSpinExchange();
  if (subtab === 'prestige') renderMinePrestigeUI();
};

let currentMineSpinPackageIdx = 0;
const MINE_SPIN_PACKAGES = [
  { tickets: 1, cost: 1e15, label: '1 Qa 💎' },
  { tickets: 5, cost: 5e15, label: '5 Qa 💎' },
  { tickets: 10, cost: 10e15, label: '10 Qa 💎' },
  { tickets: 50, cost: 50e15, label: '50 Qa 💎' },
  { tickets: 100, cost: 100e15, label: '100 Qa 💎' }
];

window.stepMineSpinPackage = function(dir) {
  currentMineSpinPackageIdx = (currentMineSpinPackageIdx + dir + MINE_SPIN_PACKAGES.length) % MINE_SPIN_PACKAGES.length;
  renderMineSpinExchange();
};

function renderMineSpinExchange() {
  const pkg = MINE_SPIN_PACKAGES[currentMineSpinPackageIdx];
  const ticketLbl = document.getElementById('mineSpinPackageTicketsLabel');
  if (ticketLbl) ticketLbl.innerText = `${pkg.tickets} 🎡 Spin Coin${pkg.tickets > 1 ? 's' : ''}`;
  const costLbl = document.getElementById('mineSpinPackageCostLabel');
  if (costLbl) costLbl.innerText = pkg.label;
  const selectCount = document.getElementById('mineSpinSelectedCount');
  if (selectCount) selectCount.innerText = pkg.tickets;

  const coinsDisplay = document.getElementById('mineSpinExchCoinsDisplay');
  if (coinsDisplay) coinsDisplay.innerText = `${formatMineNumber(miningState.shards || 0)} 💎`;
  const ownedDisplay = document.getElementById('mineSpinExchOwnedDisplay');
  if (ownedDisplay && typeof gameState !== 'undefined') {
    ownedDisplay.innerText = `${gameState.player.spinCoins || 0} 🎡`;
  }
}

window.exchangeCurrentMineSpinPackage = function(event) {
  if (event) event.stopPropagation();
  const pkg = MINE_SPIN_PACKAGES[currentMineSpinPackageIdx];
  if ((miningState.shards || 0) < pkg.cost) {
    alert(`Need ${pkg.label}!`);
    return;
  }
  miningState.shards -= pkg.cost;
  if (typeof gameState !== 'undefined' && gameState.player) {
    gameState.player.spinCoins = (gameState.player.spinCoins || 0) + pkg.tickets;
  }
  renderMineSpinExchange();
  updateMiningStickyHeaderAndStats();
  saveMiningStateDebounced();
};

window.exchangeMineCoinsForSpin = function(mode, event) {
  if (event) event.stopPropagation();
  const maxPossible = Math.floor((miningState.shards || 0) / 1e15);
  if (maxPossible < 1) {
    alert('Need at least 1 Qa 💎 Shards!');
    return;
  }
  miningState.shards -= (maxPossible * 1e15);
  if (typeof gameState !== 'undefined' && gameState.player) {
    gameState.player.spinCoins = (gameState.player.spinCoins || 0) + maxPossible;
  }
  renderMineSpinExchange();
  updateMiningStickyHeaderAndStats();
  saveMiningStateDebounced();
};

window.executeMineCoinToEnergy = function(amount) {
  let cost = amount === 'all' ? Math.floor(miningState.shards / 100) * 100 : amount;
  if (cost < 100 || (miningState.shards || 0) < cost) {
    alert('Need at least 100 💎 Shards!');
    return;
  }
  const energyGain = Math.floor((cost / 100) * 29);
  miningState.shards -= cost;
  if (typeof gameState !== 'undefined' && gameState.reactor) {
    const maxE = gameState.reactor.maxEnergy || 1000;
    gameState.reactor.currentEnergy = Math.min(maxE, (gameState.reactor.currentEnergy || 0) + energyGain);
    if (typeof updateEnergyUI === 'function') updateEnergyUI();
  }
  updateMiningStickyHeaderAndStats();
  saveMiningStateDebounced();
};

function renderMinePrestigeUI() {
  const tier = (miningState.prestigeLevel || 0) + 1;
  const cost = tier === 1 ? 100 : tier * 1000;
  const reward = tier === 1 ? 10 : tier * 200;

  const cardTitle = document.getElementById('minePrestigeCardTitle');
  if (cardTitle) cardTitle.innerText = `Tier ${tier} Prestige Exchange`;
  const reqCoins = document.getElementById('minePrestigeReqCoins');
  if (reqCoins) reqCoins.innerText = `${formatMineNumber(cost)} 💎`;
  const rewardCoins = document.getElementById('minePrestigeRewardCoins');
  if (rewardCoins) rewardCoins.innerText = `+${reward} 🪙 Gold Coins`;
  const userCoins = document.getElementById('minePrestigeUserCoinsDisplay');
  if (userCoins) userCoins.innerText = `${formatMineNumber(miningState.shards || 0)} 💎`;
  const costDisplay = document.getElementById('minePrestigeCostDisplay');
  if (costDisplay) costDisplay.innerText = `${formatMineNumber(cost)} 💎`;
  const rewardDisplay = document.getElementById('minePrestigeRewardDisplay');
  if (rewardDisplay) rewardDisplay.innerText = `+${reward} 🪙`;
}

window.executeMinePrestige = function(event) {
  if (event) event.stopPropagation();
  const tier = (miningState.prestigeLevel || 0) + 1;
  const cost = tier === 1 ? 100 : tier * 1000;
  const reward = tier === 1 ? 10 : tier * 200;

  if ((miningState.shards || 0) < cost) {
    alert(`Need ${formatMineNumber(cost)} 💎 Shards!`);
    return;
  }

  miningState.shards -= cost;
  miningState.prestigeLevel = tier;
  if (typeof gameState !== 'undefined' && gameState.player) {
    gameState.player.coins = (gameState.player.coins || 0) + reward;
  }

  miningState.plots = createDefaultMiningPlots();
  miningState.wells = createDefaultMiningWells();

  alert(`👑 Prestige Successful! +${reward} 🪙 Gold Coins Claimed! Mines restarted from Level 1.`);
  navigateMiningPage(1);
  updateMiningStickyHeaderAndStats();
  saveMiningStateDebounced();
};

/* ==========================================================================
   STICKY HEADER UPDATER
   ========================================================================== */
function updateMiningStickyHeaderAndStats() {
  const hSticky = document.getElementById('mineStickyShards');
  if (hSticky) hSticky.innerText = formatMineNumber(miningState.shards || 0);

  const gSticky = document.getElementById('mineStickyGoldCoins');
  if (gSticky && typeof gameState !== 'undefined' && gameState.player) {
    gSticky.innerText = formatMineNumber(gameState.player.coins || 0);
  }

  const dSticky = document.getElementById('mineStickyDiamonds');
  if (dSticky) dSticky.innerText = formatMineNumber(miningState.diamonds || 0);

  const lSticky = document.getElementById('mineStickyCores');
  if (lSticky) lSticky.innerText = miningState.cores || 0;

  const fSticky = document.getElementById('mineStickyCoolants');
  if (fSticky) fSticky.innerText = miningState.coolants || 0;

  const sSticky = document.getElementById('mineStickyPickaxes');
  if (sSticky) sSticky.innerText = miningState.pickaxes || 0;

  // Shop counters
  const sDiamond = document.getElementById('mineShopDiamondCount');
  if (sDiamond) sDiamond.innerText = `${miningState.diamonds || 0} 💎`;
  const sCore = document.getElementById('mineShopCoreCount');
  if (sCore) sCore.innerText = miningState.cores || 0;
  const sCoolant = document.getElementById('mineShopCoolantCount');
  if (sCoolant) sCoolant.innerText = miningState.coolants || 0;
  const sPickaxe = document.getElementById('mineShopPickaxeCount');
  if (sPickaxe) sPickaxe.innerText = miningState.pickaxes || 0;
}

/* ==========================================================================
   MAIN TICK LOOP
   ========================================================================== */
let mineLastTime = performance.now();
function mineMainLoop(now) {
  const deltaSec = Math.min(1.0, (now - mineLastTime) / 1000);
  mineLastTime = now;

  const isMineActive = (typeof gameState !== 'undefined' && gameState.currentTab === 'mining') ||
                       (document.getElementById('pageMining') && document.getElementById('pageMining').classList.contains('active'));

  // 1. Tick 20 Shafts
  const booster = getActiveMineProfitMultiplier();
  miningState.plots.forEach((plot, idx) => {
    if (!plot.unlocked) return;

    if (plot.plantStatus === 'growing') {
      plot.growthTimer = Math.max(0, (plot.growthTimer || 30.0) - deltaSec);
      if (plot.growthTimer <= 0) {
        plot.plantStatus = 'alive';
        plot.level = 1;
        plot.lifeTimer = 100.0;
        plot.timer = getMinePlotCycleTime(idx, 1);
        if (isMineActive && miningState.currentPage === 1) renderMiningPlots();
      }
    }

    if (plot.plantStatus === 'alive') {
      plot.lifeTimer = Math.max(0, (plot.lifeTimer || 0) - deltaSec);
      if (plot.lifeTimer <= 0) {
        plot.plantStatus = 'dead';
        if (isMineActive && miningState.currentPage === 1) renderMiningPlots();
        return;
      }

      const cycleTime = getMinePlotCycleTime(idx, plot.level);
      plot.timer = (plot.timer || cycleTime) - deltaSec;
      if (plot.timer <= 0) {
        const shardsGained = getMinePlotShardsPerCycle(idx, plot.level) * booster;
        miningState.shards += shardsGained;
        plot.timer = cycleTime;
      }
    }
  });

  // 2. Tick 20 Extractors
  miningState.wells.forEach(well => {
    if (!well.unlocked) return;
    well.timer = (well.timer || 0) + deltaSec;
    if (well.timer >= well.cycleTime) {
      well.timer = 0;
      miningState.coolants = (miningState.coolants || 0) + (well.basketOutput || 1);
    }
  });

  // 3. Tick 20 Managers
  if (Array.isArray(miningState.managers)) {
    miningState.managers.forEach(mgr => {
      if (mgr.unlocked && mgr.activeTimer > 0) {
        mgr.activeTimer = Math.max(0, mgr.activeTimer - deltaSec);
        const plot = miningState.plots[mgr.landId - 1];
        if (plot && plot.unlocked && plot.plantStatus === 'alive' && (plot.lifeTimer || 0) < 20 && (miningState.coolants || 0) > 0) {
          miningState.coolants--;
          const bonus = MINE_LAND_WATER_BONUS[plot.id - 1] || 10;
          const maxLife = getMinePlotMaxLifeLimit(plot.id - 1, plot.level);
          plot.lifeTimer = Math.min(maxLife, (plot.lifeTimer || 0) + bonus);
        }
      }
    });
  }

  // 4. Update UI
  if (isMineActive) {
    updateMiningStickyHeaderAndStats();
    updateMineBoosterUI();
    if (miningState.currentPage === 4) {
      miningState.managers.forEach(mgr => {
        const badge = document.getElementById(`mineMgrStatusBadge-${mgr.landId}`);
        if (badge && mgr.unlocked) {
          if (mgr.activeTimer > 0) {
            badge.className = 'mine-mgr-status-badge active';
            badge.innerText = `⚡ ${formatMineContractDuration(mgr.activeTimer)}`;
          } else {
            badge.className = 'mine-mgr-status-badge expired';
            badge.innerText = '⏳ EXPIRED';
          }
        }
      });
    }
  }

  requestAnimationFrame(mineMainLoop);
}

/* ==========================================================================
   FORMATTERS
   ========================================================================== */
const MINE_NUM_SUFFIXES = [
  "", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No",
  "Dc", "Ud", "Dd", "Td", "Qad", "Qid", "Sxd", "Spd", "Ocd", "Nod", "Vg"
];

function formatMineNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return "0";
  if (num < 1000) return Math.floor(num).toLocaleString();
  const tier = Math.min(MINE_NUM_SUFFIXES.length - 1, Math.floor(Math.log10(num) / 3));
  if (tier <= 0) return Math.floor(num).toLocaleString();
  const scale = Math.pow(10, tier * 3);
  const scaled = num / scale;
  return scaled.toFixed(scaled < 10 ? 2 : 1) + MINE_NUM_SUFFIXES[tier];
}

function initMiningTycoonGame() {
  const mult = miningState.upgradeMultiplier || 1;
  const displayVal = mult === 'max' ? 'MAX' : `${mult}x`;
  document.querySelectorAll('.mine-mult-circle-val').forEach(el => el.innerText = displayVal);
  document.querySelectorAll('.mine-mult-circle-toggle-btn').forEach(btn => btn.setAttribute('data-mult', String(mult)));

  renderMiningPlots();
  renderMiningWells();
  renderMiningManagers();
  updateMiningStickyHeaderAndStats();
  requestAnimationFrame(mineMainLoop);
}

window.initMiningTycoonGame = initMiningTycoonGame;
window.renderMiningPlots = renderMiningPlots;
window.renderMiningWells = renderMiningWells;
window.renderMiningManagers = renderMiningManagers;
window.updateMiningMiniStats = updateMiningStickyHeaderAndStats;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMiningTycoonGame);
} else {
  initMiningTycoonGame();
}
