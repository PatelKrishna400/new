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

const BEE_STORAGE_KEY = 'ENERGY_TAP_BEEFARM_STATE_V4';

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

// Base Cycle Times (Meadow 1: 100s, Meadow 2: 200s, ..., Meadow 20: 2000s)
const BEE_WELL_BASE_TIMES = Array.from({ length: 20 }, (_, i) => (i + 1) * 100);

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
  100, 200, 300, 400, 500, 600, 700, 800, 900, 1000,
  1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000
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
      lifeTimer: isUnlocked ? 100.0 : 0,
      maxLifeLimit: BEE_LAND_BASE_LIFE_LIMITS[i - 1] || 500,
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

function createDefaultBeeWellManagers() {
  const managers = [];
  const avatars = ['🌸', '🌺', '🌼', '🌻', '🌷', '🌸', '🌺', '🌼', '🌻', '🌷', '🌸', '🌺', '🌼', '🌻', '🌷', '🌸', '🌺', '🌼', '🌻', '🌷'];
  for (let i = 1; i <= 20; i++) {
    managers.push({
      landId: i,
      avatar: avatars[i - 1] || '🌸',
      unlocked: false,
      hireCount: 0,
      activeTimer: 0
    });
  }
  return managers;
}

function loadInitialBeeState() {
  try {
    localStorage.removeItem('ENERGY_TAP_BEEFARM_STATE_V1');
    localStorage.removeItem('ENERGY_TAP_BEEFARM_STATE_V2');
    localStorage.removeItem('ENERGY_TAP_BEEFARM_STATE_V3');
  } catch (e) {}

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
        if (!Array.isArray(parsed.wellManagers) || parsed.wellManagers.length !== 20) {
          parsed.wellManagers = createDefaultBeeWellManagers();
        }
        if (!parsed.managerSubTab) parsed.managerSubTab = 'hive';
        if (typeof parsed.honey !== 'number') parsed.honey = 0;
        if (typeof parsed.larvae !== 'number') parsed.larvae = 0;
        if (typeof parsed.flowers !== 'number') parsed.flowers = 0;
        if (typeof parsed.smokers !== 'number') parsed.smokers = 0;
        if (typeof parsed.diamonds !== 'number') parsed.diamonds = 0;
        if (!parsed.upgradeMultiplier) parsed.upgradeMultiplier = 1;
        if (!parsed.activeBooster) parsed.activeBooster = null;
        if (!parsed.activeSpeedBooster) parsed.activeSpeedBooster = null;
        if (typeof parsed.prestigeLevel !== 'number') parsed.prestigeLevel = 0;
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load bee farm state:', e);
  }

  return {
    currentPage: 1,
    managerSubTab: 'hive',
    honey: 0,
    diamonds: 0,
    larvae: 0,
    flowers: 0,
    smokers: 0,
    upgradeMultiplier: 1,
    activeBooster: null,
    activeSpeedBooster: null,
    prestigeLevel: 0,
    plots: createDefaultBeePlots(),
    wells: createDefaultBeeWells(),
    managers: createDefaultBeeManagers(),
    wellManagers: createDefaultBeeWellManagers()
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

  const mult = beeState.upgradeMultiplier === 'max' ? 100 : (Number(beeState.upgradeMultiplier) || 1);
  const larvae = beeState.larvae || 0;
  const flowers = beeState.flowers || 0;
  const smokers = beeState.smokers || 0;

  let html = '';
  beeState.plots.forEach((plot, idx) => {
    // 1. LOCKED PLOT
    if (!plot.unlocked) {
      html += `
        <div class="sf-plot-tile sf-sketch-card locked" id="beePlotCard-${plot.id}">
          <div class="sf-sketch-square stage-locked" onclick="unlockBeePlot(${plot.id}, event)" title="Unlock hive with diamonds">
            <div class="sf-sketch-square-art">🔒</div>
            <span class="sf-sketch-square-badge dead">Locked</span>
            <span class="text-[9px] font-mono font-bold text-stone-600 mt-1">${plot.unlockCost} 💎</span>
          </div>
          <div class="sf-sketch-right">
            <div class="sf-sketch-top">
              <div class="sf-sketch-land-title">
                <span>Hive ${plot.id}</span>
              </div>
              <div class="sf-sketch-lv-col">
                <span class="sf-sketch-lv-tag">Locked</span>
              </div>
            </div>
            <div class="sf-sketch-middle py-1">
              <p class="text-xs text-stone-500">Untamed apiary grove awaiting colonization. Unlock to start housing bee colonies!</p>
            </div>
            <div class="sf-sketch-bottom">
              <button onclick="unlockBeePlot(${plot.id}, event)" class="sf-btn-sketch-action sf-btn-unlock col-span-2 w-full" style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); border: 1.5px solid #38bdf8; color: #ffffff;">
                <span>🔓 Unlock Hive (${plot.unlockCost} 💎)</span>
              </button>
            </div>
          </div>
        </div>
      `;
      return;
    }

    // 2. DEAD / EXPIRED PLOT (Matches Land 1 Expired in the user screenshot!)
    if (plot.plantStatus === 'dead') {
      html += `
        <div class="sf-plot-tile sf-sketch-card dead" id="beePlotCard-${plot.id}">
          <div class="sf-sketch-square stage-dead" onclick="smokeBeePlot(${plot.id}, event)" title="Click with smoker to clear">
            <div class="sf-sketch-square-art">🥀</div>
            <span class="sf-sketch-square-badge dead">EXPIRED HIVE</span>
            <span class="text-[9px] font-bold text-rose-800 mt-1">💨 Clear</span>
          </div>
          <div class="sf-sketch-right">
            <div class="sf-sketch-top">
              <div class="sf-sketch-land-title">
                <span>Hive ${plot.id}</span>
              </div>
              <div class="sf-sketch-lv-col">
                <span class="sf-sketch-lv-tag bg-rose-100 text-rose-800 border-rose-300">Expired</span>
              </div>
            </div>
            <div class="sf-sketch-middle py-1">
              <p class="text-xs text-rose-800 font-medium">Life expired. Clear with bee smoker 💨 to recolonize and start at Level 1.</p>
            </div>
            <div class="sf-sketch-bottom">
              <button onclick="smokeBeePlot(${plot.id}, event)" class="sf-btn-sketch-action col-span-2 w-full" style="background: linear-gradient(135deg, #be123c 0%, #9f1239 100%); border: 1.5px solid #fb7185; color: #ffffff;">
                <span>💨 Remove with Smoker (Owned: ${smokers})</span>
              </button>
            </div>
          </div>
        </div>
      `;
      return;
    }

    // 3. EMPTY PLOT
    if (plot.plantStatus === 'empty') {
      html += `
        <div class="sf-plot-tile sf-sketch-card empty" id="beePlotCard-${plot.id}">
          <div class="sf-sketch-square stage-empty" onclick="placeBeeLarva(${plot.id}, event)" title="Install Queen Larva">
            <div class="sf-sketch-square-art">🍯</div>
            <span class="sf-sketch-square-badge" style="background:#78350f;color:#fef08a;">Empty Hive</span>
            <span class="text-[9px] font-bold text-amber-900 mt-1">+ Install Larva</span>
          </div>
          <div class="sf-sketch-right">
            <div class="sf-sketch-top">
              <div class="sf-sketch-land-title">
                <span>Hive ${plot.id}</span>
              </div>
              <div class="sf-sketch-lv-col">
                <span class="sf-sketch-lv-tag">Lv 1 Apiary</span>
                <span class="sf-sketch-rate text-stone-500">Ready</span>
              </div>
            </div>
            <div class="sf-sketch-middle py-1">
              <p class="text-xs text-stone-600">Install Queen Larva &bull; 30s brooding incubation &bull; Produces pure honey</p>
            </div>
            <div class="sf-sketch-bottom">
              ${larvae > 0 ? `
                <button onclick="placeBeeLarva(${plot.id}, event)" class="sf-btn-sketch-action col-span-2 w-full" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border: 1.5px solid #6ee7b7; color: #ffffff;">
                  <span>🐛 Install Queen Larva (Owned: ${larvae})</span>
                </button>
              ` : `
                <button onclick="quickBuyLarvaAndInstall(${plot.id}, event)" class="sf-btn-sketch-action col-span-2 w-full" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border: 1.5px solid #fde047; color: #ffffff;">
                  <span>🛒 Buy Queen Larva (50 🍯 / 1 💎)</span>
                </button>
              `}
            </div>
          </div>
        </div>
      `;
      return;
    }

    // 4. INCUBATING / GROWING PLOT
    if (plot.plantStatus === 'growing') {
      const growthTime = Math.max(0, plot.growthTimer || 0);
      const progress = Math.max(0, Math.min(1, (30 - growthTime) / 30));
      html += `
        <div class="sf-plot-tile sf-sketch-card growing" id="beePlotCard-${plot.id}">
          <div class="sf-sketch-square stage-growing">
            <div class="sf-sketch-square-art animate-buzz-float">🐛</div>
            <span class="sf-sketch-square-badge growing">Incubating</span>
            <span class="text-[9px] font-mono font-bold text-emerald-800 mt-1" id="beeGrowthSquareTimer-${plot.id}">${Math.ceil(growthTime)}s</span>
          </div>
          <div class="sf-sketch-right">
            <div class="sf-sketch-top">
              <div class="sf-sketch-land-title">
                <span>Hive ${plot.id}</span>
              </div>
              <div class="sf-sketch-lv-col">
                <span class="sf-sketch-lv-tag">Lv 1 Larva</span>
                <span class="sf-sketch-rate text-emerald-700">Brooding</span>
              </div>
            </div>
            <div class="sf-sketch-middle">
              <div class="sf-loading-bar-wrap">
                <div class="sf-loading-bar-fill" id="beeGrowthBar-${plot.id}" style="width: ${(progress * 100).toFixed(1)}%"></div>
                <span class="sf-loading-bar-text" id="beeGrowthTimer-${plot.id}">⏳ Incubating: ${Math.ceil(growthTime)}s / 30s</span>
              </div>
              <div class="sf-sketch-life-info">
                <span>30s brooding incubation</span>
                <span>Metamorphoses into active worker colony!</span>
              </div>
            </div>
            <div class="sf-sketch-bottom">
              <button class="sf-btn-sketch-action col-span-2 w-full" disabled style="background:#e2e8f0;color:#94a3b8;border:1.5px solid #cbd5e1;cursor:not-allowed;">
                <span>⏳ Metamorphosis (${Math.ceil(growthTime)}s left)...</span>
              </button>
            </div>
          </div>
        </div>
      `;
      return;
    }

    // 5. ACTIVE / ALIVE PLOT
    const cycleTime = getBeePlotCycleTime(idx, plot.level);
    const honeyPerCycle = getBeePlotHoneyPerCycle(idx, plot.level);
    const maxLife = getBeePlotMaxLifeLimit(idx, plot.level);
    const costPerLvl = 50 * plot.level;
    const upgradeCost = costPerLvl * mult;
    const cycleProgress = Math.min(1, Math.max(0, 1 - ((plot.timer || cycleTime) / Math.max(0.001, cycleTime))));

    html += `
      <div class="sf-plot-tile sf-sketch-card alive" id="beePlotCard-${plot.id}">
        <div class="sf-sketch-square stage-alive">
          <div class="sf-sketch-square-art animate-buzz-float">🐝</div>
          <span class="sf-sketch-square-badge alive">Active Hive</span>
          <span class="text-[9px] font-mono font-bold text-amber-900 mt-1">+${formatBeeNumber(honeyPerCycle)} 🍯</span>
        </div>
        <div class="sf-sketch-right">
          <div class="sf-sketch-top">
            <div class="sf-sketch-land-title">
              <span>Hive ${plot.id}</span>
            </div>
            <div class="sf-sketch-lv-col">
              <span class="sf-sketch-lv-tag">Lv. ${plot.level}/5000</span>
              <span class="sf-sketch-rate text-amber-600">+${formatBeeNumber(honeyPerCycle / Math.max(0.001, cycleTime))} 🍯/s</span>
            </div>
          </div>
          <div class="sf-sketch-middle">
            <div class="sf-loading-bar-wrap">
              <div class="sf-loading-bar-fill ${cycleProgress >= 0.95 ? 'ready' : ''}" id="beeCycleBar-${plot.id}" style="width: ${(cycleProgress * 100).toFixed(1)}%"></div>
              <span class="sf-loading-bar-text" id="beeCycleText-${plot.id}">⚡ Cycle: ${Math.max(0, plot.timer || 0).toFixed(1)}s / ${cycleTime.toFixed(cycleTime < 0.05 ? 3 : 1)}s</span>
            </div>
            <div class="sf-sketch-life-info">
              <span>❤️ Life: <strong id="beeLifeTimerText-${plot.id}">${(plot.lifeTimer || 0).toFixed(1)}s / ${Math.floor(maxLife)}s</strong></span>
              <span>Speed: <strong>${cycleTime.toFixed(cycleTime < 0.05 ? 3 : 1)}s</strong></span>
            </div>
          </div>
          <div class="sf-sketch-bottom grid grid-cols-2 gap-2">
            <button onclick="nourishBeePlot(${plot.id}, event)" class="sf-btn-sketch-action" style="background: linear-gradient(135deg, #e11d48 0%, #be123c 100%); border: 1.5px solid #fda4af; color: #ffffff;">
              <span>🌸 Feed Flower (+10s)</span>
            </button>
            <button onclick="upgradeBeePlot(${plot.id}, event)" class="sf-btn-sketch-action sf-sketch-up-btn" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border: 1.5px solid #fde047; color: #ffffff;">
              <span>⬆️ Upgrade (${formatBeeNumber(upgradeCost)} 🪙)</span>
            </button>
          </div>
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
    quickBuyLarvaAndInstall(plotId, event);
    return;
  }
  beeState.larvae -= 1;
  plot.plantStatus = 'growing';
  plot.growthTimer = 30.0;
  renderBeePlots();
  updateBeeStickyHeaderAndStats();
  saveBeeStateDebounced();
};

window.quickBuyLarvaAndInstall = function(plotId, event) {
  if (event) event.stopPropagation();
  const plot = beeState.plots.find(p => p.id === plotId);
  if (!plot || plot.plantStatus !== 'empty') return;
  if ((beeState.honey || 0) >= 50) {
    beeState.honey -= 50;
  } else if ((beeState.diamonds || 0) >= 1) {
    beeState.diamonds -= 1;
  } else {
    alert('Need 50 🍯 Honey or 1 💎 Diamond to buy a Queen Larva!');
    return;
  }
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
  if ((beeState.smokers || 0) >= 1) {
    beeState.smokers -= 1;
    plot.plantStatus = 'empty';
  } else if ((beeState.honey || 0) >= 50) {
    beeState.honey -= 50;
    plot.plantStatus = 'empty';
  } else if ((beeState.diamonds || 0) >= 1) {
    beeState.diamonds -= 1;
    plot.plantStatus = 'empty';
  } else {
    alert('Need 1 💨 Smoker (Cost: 50 🍯 or 1 💎 from Apiary Shop)!');
    return;
  }
  renderBeePlots();
  updateBeeStickyHeaderAndStats();
  saveBeeStateDebounced();
};

/* ==========================================================================
   PAGE 2: 20 FLOWER MEADOWS (500s down to 1s at L5000)
   ========================================================================== */
function formatTimerText(timerSec, maxSec) {
  const s = Math.max(0, Math.ceil(timerSec || 0));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins}m ${secs.toString().padStart(2, '0')}s`;
}

function getBeeWellCycleTime(wellIndex, level) {
  const base = BEE_WELL_BASE_TIMES[wellIndex] || 100;
  const ratio = (level - 1) / 4999;
  return Math.max(1, base * Math.pow(1 / base, ratio));
}

function getBeeWellFlowersPerCycle(wellIndex, level) {
  return 1 + Math.floor((level - 1) / 10);
}

function getBeeWellUpgradeCost(wellIndex, level) {
  return Math.floor(50 * Math.pow(1.12, level - 1) * (wellIndex + 1));
}

function getBeeWellMultiUpgradeInfo(wellIndex, currentLevel, mult, availableCoins) {
  if (currentLevel >= 5000) {
    return { targetLevel: 5000, levelsToAdd: 0, totalCost: 0, isAdUpgrade: false };
  }
  let targetLevel = currentLevel + 1;
  if (mult === 'max') {
    let costAcc = 0;
    let lvl = currentLevel;
    while (lvl < 5000) {
      if (lvl % 5 === 0 && lvl !== currentLevel) break;
      const c = getBeeWellUpgradeCost(wellIndex, lvl);
      if (costAcc + c > availableCoins && lvl > currentLevel) break;
      costAcc += c;
      lvl++;
    }
    targetLevel = Math.max(currentLevel + 1, lvl);
    return { targetLevel, levelsToAdd: targetLevel - currentLevel, totalCost: costAcc, isAdUpgrade: currentLevel % 5 === 0 };
  }
  const add = Number(mult) || 1;
  targetLevel = Math.min(5000, currentLevel + add);
  let totalCost = 0;
  for (let l = currentLevel; l < targetLevel; l++) {
    totalCost += getBeeWellUpgradeCost(wellIndex, l);
  }
  return { targetLevel, levelsToAdd: targetLevel - currentLevel, totalCost, isAdUpgrade: currentLevel % 5 === 0 };
}

function renderBeeWells() {
  const container = document.getElementById('beeWellsContainer');
  if (!container || !Array.isArray(beeState.wells)) return;

  const mult = beeState.upgradeMultiplier || 1;
  const playerGoldCoins = (window.gameState && window.gameState.player && window.gameState.player.coins) || 0;
  const availableCoins = Math.max(beeState.honey || 0, playerGoldCoins);

  const unlockedCount = beeState.wells.filter(w => w.unlocked).length;
  const summaryLabel = document.getElementById('beeWellsSummaryLabel');
  if (summaryLabel) summaryLabel.innerText = `${unlockedCount} of 20 Meadows Unlocked`;

  container.innerHTML = '';

  beeState.wells.forEach((well, idx) => {
    const tile = document.createElement('div');
    tile.id = `beeWellTile-${well.id}`;

    // 1. LOCKED MEADOW
    if (!well.unlocked) {
      tile.className = "sf-well-card locked";
      tile.innerHTML = `
        <div class="sf-card-header">
          <div class="flex items-center gap-1.5">
            <span class="text-stone-500 text-sm">🏞️</span>
            <span class="sf-card-title">${well.name || `Flower Meadow #${well.id}`}</span>
          </div>
          <span class="sf-status-pill pill-locked">Locked 🔒</span>
        </div>
        <div class="sf-card-body flex items-center justify-between gap-3 py-2">
          <div class="sf-card-avatar locked-avatar">🪨</div>
          <div class="sf-card-details flex-1">
            <div class="text-xs font-black text-stone-700">Underground Meadow Soil</div>
            <div class="text-[10px] text-stone-500">Cultivation &amp; pump license fee: <strong class="text-cyan-700">${well.unlockCost} 💎</strong></div>
          </div>
        </div>
        <button onclick="unlockBeeWell(${well.id}, event)" class="sf-card-btn sf-btn-unlock">
          <span>🔓 Unlock Well (${well.unlockCost} 💎)</span>
        </button>
      `;
      container.appendChild(tile);
      return;
    }

    // 2. UNLOCKED MEADOW
    const cycleTime = getBeeWellCycleTime(idx, well.level);
    const flowersPerCycle = getBeeWellFlowersPerCycle(idx, well.level);
    const upInfo = getBeeWellMultiUpgradeInfo(idx, well.level, mult, availableCoins);
    const canAfford = availableCoins >= upInfo.totalCost && well.level < 5000;
    const stored = well.storedFlowers || 0;
    const wellSecLeft = Math.ceil(Math.max(0, cycleTime - (well.timer || 0)));

    let cardClass = "sf-well-card active";
    if (well.hasWorker) cardClass += " automated";
    else if (stored > 0) cardClass += " ready";
    else cardClass += " producing";

    let pillClass = 'pill-well-idle';
    let pillText = `👆 Click Flower Coin`;
    if (well.hasWorker) {
      pillClass = 'pill-well-automated';
      pillText = `👷 Manager Auto (${wellSecLeft}s)`;
    } else if (stored > 0) {
      pillClass = 'pill-well-ready';
      pillText = `🌸 ${stored} Ready • Claim`;
    } else {
      pillClass = 'pill-well-filling';
      pillText = `⏳ Blooming (${wellSecLeft}s)`;
    }

    const coinIcon = well.hasWorker ? '👷' : (stored > 0 ? '🌸' : '🌺');
    const coinBadge = well.hasWorker ? 'AUTO' : (stored > 0 ? 'CLAIM' : 'BLOOM');
    const coinStateClass = well.hasWorker ? 'automated' : (stored > 0 ? 'ready' : 'producing');

    tile.className = cardClass;
    tile.innerHTML = `
      <div class="sf-card-header">
        <div class="flex items-center gap-1.5">
          <span class="text-cyan-500 text-sm">${well.hasWorker ? '👷🌸' : '🌸'}</span>
          <span class="sf-card-title">${well.name || `Flower Meadow #${well.id}`}</span>
          <span class="sf-card-level-tag" id="beeWellLvBadge-${well.id}">Lv. ${well.level}/5000</span>
        </div>
        <span class="sf-status-pill ${pillClass}" id="beeWellStatusPill-${well.id}">
          ${pillText}
        </span>
      </div>

      <div class="sf-card-body flex items-center justify-between gap-3 py-1.5">
        <div class="sf-water-coin ${coinStateClass}"
             id="beeWaterCoin-${well.id}"
             onclick="clickBeeWellCoin(${well.id}, event)"
             title="${well.hasWorker ? '👷 Manager Active: Auto-harvesting flowers!' : (stored > 0 ? '🌸 Click to harvest ' + stored + ' flowers!' : '⏳ Blooming flowers... ' + wellSecLeft + 's left')}">
          <span class="sf-water-coin-icon" id="beeWaterCoinIcon-${well.id}">${coinIcon}</span>
          <span class="sf-water-coin-badge" id="beeWaterCoinBadge-${well.id}">${coinBadge}</span>
        </div>

        <div class="sf-card-details flex-1 flex flex-col gap-1">
          <div class="flex justify-between items-center text-[11px]">
            <span class="font-black text-cyan-800" id="beeWellOut-${well.id}">+${formatBeeNumber(flowersPerCycle)} 🌸 Flowers</span>
            <span class="font-mono text-cyan-700 font-bold text-[10px]" id="beeWellTime-${well.id}">
              ⏱️ ${formatTimerText(well.timer || 0, cycleTime)} / ${formatTimerText(cycleTime, cycleTime)}${stored > 0 ? ` (+${stored} 🌸 ready)` : ''}
            </span>
          </div>

          <div class="sf-progress-bar-track">
            <div class="sf-progress-bar-fill cyan ${stored > 0 ? 'ready' : ''}" id="beeWellProgressBar-${well.id}" style="width: ${(Math.max(0, Math.min(1, (well.timer || 0) / cycleTime)) * 100).toFixed(1)}%"></div>
          </div>

          <div class="text-[9.5px] text-stone-600 mt-0.5 flex justify-between items-center" id="beeWellDescRow-${well.id}">
            ${well.hasWorker
              ? `<span class="text-emerald-700 font-bold flex items-center gap-1"><span>⚡</span> Manager auto-deposits flowers directly to inventory!</span>`
              : (stored > 0
                  ? `<span class="text-cyan-800 font-bold">Stored: <strong id="beeWellStoredCount-${well.id}">${stored}</strong> 🌸 &bull; Click Flower Coin or Collect!</span>`
                  : `<span class="text-cyan-700 font-semibold">🌸 Blooming flowers... (${wellSecLeft}s left)</span>`
                )
            }
            <span class="font-mono text-[9px] text-stone-500">Base: ${BEE_WELL_BASE_TIMES[idx]}s &bull; 1🌸</span>
          </div>
        </div>
      </div>

      <div class="sf-card-dual-actions grid grid-cols-2 gap-1.5 pt-1">
        <div id="beeWellWorkerSlot-${well.id}">
          <button onclick="collectBeeWellFlowers(${well.id}, event)" id="beeWellCollectBtn-${well.id}" class="sf-card-btn sf-btn-well-collect ${stored > 0 ? 'active-ready' : ''} w-full" title="Collect stored flowers">
            <span>🌸 Collect ${stored > 0 ? `(${stored} 🌸)` : ''}</span>
          </button>
        </div>

        ${well.level >= 5000
          ? `<button id="beeWellUpBtn-${well.id}" class="sf-card-btn sf-btn-upgrade disabled" disabled><span>★ MAX</span></button>`
          : (well.level % 5 === 0
              ? `<button onclick="upgradeBeeWell(${well.id}, event)" id="beeWellUpBtn-${well.id}" class="sf-card-btn sf-btn-upgrade sf-ad-upgrade-btn" title="Watch sponsor video to upgrade well level"><span>📢 Watch Ad (Lv.${well.level + 1})</span></button>`
              : `<button onclick="upgradeBeeWell(${well.id}, event)" id="beeWellUpBtn-${well.id}" class="sf-card-btn sf-btn-upgrade ${!canAfford ? 'disabled' : ''}"><span>▲ Lv.${upInfo.targetLevel} (${formatBeeNumber(upInfo.totalCost)} 🪙)</span></button>`
            )
        }
      </div>
    `;

    container.appendChild(tile);
  });
}

window.clickBeeWellCoin = function(wellId, event) {
  if (event) event.stopPropagation();
  const well = beeState.wells.find(w => w.id === wellId);
  if (!well || !well.unlocked) return;
  if ((well.storedFlowers || 0) > 0) {
    collectBeeWellFlowers(wellId, event);
  }
};

window.unlockBeeWell = function(wellId, event) {
  if (event) event.stopPropagation();
  const well = beeState.wells.find(w => w.id === wellId);
  if (!well || well.unlocked) return;
  const cost = well.unlockCost || 0;
  if ((beeState.diamonds || 0) < cost) {
    alert(`Need ${cost} 💎 Diamonds!`);
    return;
  }
  beeState.diamonds -= cost;
  well.unlocked = true;
  well.level = 1;
  well.timer = 0;
  well.storedFlowers = 0;
  renderBeeWells();
  updateBeeStickyHeaderAndStats();
  saveBeeStateDebounced();
};

window.collectBeeWellFlowers = function(wellId, event) {
  if (event) event.stopPropagation();
  const well = beeState.wells.find(w => w.id === wellId);
  if (!well || !well.unlocked) return;
  const gain = well.storedFlowers || well.basketOutput || 1;
  well.storedFlowers = 0;
  beeState.flowers = (beeState.flowers || 0) + gain;
  renderBeeWells();
  updateBeeStickyHeaderAndStats();
  saveBeeStateDebounced();
};

window.upgradeBeeWell = function(wellId, event) {
  if (event) event.stopPropagation();
  const well = beeState.wells.find(w => w.id === wellId);
  if (!well || !well.unlocked || well.level >= 5000) return;

  if (well.level % 5 === 0) {
    window.upgradeBeeWellWithAd(wellId, event);
    return;
  }

  const mult = beeState.upgradeMultiplier || 1;
  const playerGoldCoins = (window.gameState && window.gameState.player && window.gameState.player.coins) || 0;
  const availableCoins = Math.max(beeState.honey || 0, playerGoldCoins);
  const upInfo = getBeeWellMultiUpgradeInfo(well.id - 1, well.level, mult, availableCoins);

  if (upInfo.totalCost > availableCoins) {
    alert(`Need ${formatBeeNumber(upInfo.totalCost)} Coins!`);
    return;
  }

  if ((beeState.honey || 0) >= upInfo.totalCost) {
    beeState.honey -= upInfo.totalCost;
  } else if (playerGoldCoins >= upInfo.totalCost) {
    window.gameState.player.coins -= upInfo.totalCost;
    if (typeof window.updateUI === 'function') window.updateUI();
    if (typeof window.saveGame === 'function') window.saveGame(true);
  }

  well.level = upInfo.targetLevel;
  renderBeeWells();
  updateBeeStickyHeaderAndStats();
  saveBeeStateDebounced();
};

window.upgradeBeeWellWithAd = function(wellId, event) {
  const well = beeState.wells.find(w => w.id === wellId);
  if (!well || !well.unlocked || well.level >= 5000) return;

  const doAdUpgrade = () => {
    well.level = Math.min(5000, well.level + 1);
    renderBeeWells();
    updateBeeStickyHeaderAndStats();
    saveBeeStateDebounced();
  };

  if (typeof window.showRewardedAd === 'function') {
    window.showRewardedAd(doAdUpgrade, {
      adTitle: `Meadow #${well.id} Milestone Lv.${well.level + 1}`,
      adDesc: `Watch sponsor video to upgrade Meadow past Level ${well.level}!`
    });
  } else {
    doAdUpgrade();
  }
};

/* ==========================================================================
   PAGE 3: APIARY SHOP (200 🪙 Larva/Smoker, 250 🪙 10 Flowers, Boosters)
   ========================================================================== */
window.buyBeeItem = function(itemType, count = 1, currency = 'gold') {
  if (typeof gameState === 'undefined' || !gameState.player) return;
  let cost = 0;

  if (itemType === 'larva') {
    cost = 200;
    if ((gameState.player.coins || 0) < cost) {
      alert(`Need 200 🪙 Gold Coins! (Have: ${Math.floor(gameState.player.coins || 0)})`);
      return;
    }
    gameState.player.coins -= cost;
    beeState.larvae = (beeState.larvae || 0) + count;
  } else if (itemType === 'flower') {
    cost = 250;
    if ((gameState.player.coins || 0) < cost) {
      alert(`Need 250 🪙 Gold Coins! (Have: ${Math.floor(gameState.player.coins || 0)})`);
      return;
    }
    gameState.player.coins -= cost;
    beeState.flowers = (beeState.flowers || 0) + (count || 10);
  } else if (itemType === 'smoker') {
    cost = 200;
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

  if (multiplier === 2) {
    if (typeof window.showRewardedAd === 'function') {
      window.showRewardedAd(doActivate, {
        adTitle: `2X Profit Booster`,
        adDesc: `Watch sponsor video to boost harvest profits by 2X for 20 Minutes!`
      });
    } else {
      doActivate();
    }
  } else if (multiplier === 5) {
    const cost = 100;
    if (typeof gameState !== 'undefined' && gameState.player) {
      if ((gameState.player.coins || 0) < cost) {
        alert(`Need 100 🪙 Gold Coins!`);
        return;
      }
      gameState.player.coins -= cost;
      if (typeof window.updateUI === 'function') window.updateUI();
      if (typeof window.saveGame === 'function') window.saveGame(true);
      doActivate();
    }
  } else if (multiplier === 10) {
    const cost = 100;
    if ((beeState.diamonds || 0) < cost && (typeof gameState !== 'undefined' && gameState.player && (gameState.player.diamonds || 0) < cost)) {
      alert(`Need 100 💎 Diamonds!`);
      return;
    }
    if ((beeState.diamonds || 0) >= cost) {
      beeState.diamonds -= cost;
    } else if (typeof gameState !== 'undefined' && gameState.player) {
      gameState.player.diamonds -= cost;
      if (typeof window.updateUI === 'function') window.updateUI();
      if (typeof window.saveGame === 'function') window.saveGame(true);
    }
    doActivate();
  }
};

window.activateBeeSpeedBooster = function(multiplier) {
  const doActivate = () => {
    beeState.activeSpeedBooster = {
      multiplier: Number(multiplier) || 2,
      expiresAt: Date.now() + 20 * 60 * 1000
    };
    updateBeeBoosterUI();
    saveBeeStateDebounced();
  };

  if (multiplier === 2) {
    if (typeof window.showRewardedAd === 'function') {
      window.showRewardedAd(doActivate, {
        adTitle: `2X Speed Booster`,
        adDesc: `Watch sponsor video to boost production speed by 2X for 20 Minutes!`
      });
    } else {
      doActivate();
    }
  } else if (multiplier === 5) {
    const cost = 100;
    if (typeof gameState !== 'undefined' && gameState.player) {
      if ((gameState.player.coins || 0) < cost) {
        alert(`Need 100 🪙 Gold Coins!`);
        return;
      }
      gameState.player.coins -= cost;
      if (typeof window.updateUI === 'function') window.updateUI();
      if (typeof window.saveGame === 'function') window.saveGame(true);
      doActivate();
    }
  } else if (multiplier === 10) {
    const cost = 100;
    if ((beeState.diamonds || 0) < cost && (typeof gameState !== 'undefined' && gameState.player && (gameState.player.diamonds || 0) < cost)) {
      alert(`Need 100 💎 Diamonds!`);
      return;
    }
    if ((beeState.diamonds || 0) >= cost) {
      beeState.diamonds -= cost;
    } else if (typeof gameState !== 'undefined' && gameState.player) {
      gameState.player.diamonds -= cost;
      if (typeof window.updateUI === 'function') window.updateUI();
      if (typeof window.saveGame === 'function') window.saveGame(true);
    }
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
  if (badge) {
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

  const sBadge = document.getElementById('beeSpeedBoosterActiveBadge');
  if (sBadge) {
    if (beeState && beeState.activeSpeedBooster && beeState.activeSpeedBooster.expiresAt > Date.now()) {
      const remMs = beeState.activeSpeedBooster.expiresAt - Date.now();
      const remMins = Math.floor(remMs / 60000);
      const remSecs = Math.floor((remMs % 60000) / 1000);
      sBadge.className = "bg-cyan-950 text-cyan-300 text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full border border-cyan-500/50 animate-pulse";
      sBadge.innerText = `⚡ ${beeState.activeSpeedBooster.multiplier}X ACTIVE (${remMins}m ${String(remSecs).padStart(2, '0')}s)`;
    } else {
      sBadge.className = "bg-stone-800 text-stone-400 text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full border border-stone-700";
      sBadge.innerText = "No Active Booster";
    }
  }
}

/* ==========================================================================
   PAGE 4: 20 AUTOMATION MANAGERS (HIVES & MEADOWS)
   ========================================================================== */
function formatBeeContractDuration(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hrs > 0) return `${hrs}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  return `${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
}

window.switchBeeManagerTab = function(tab) {
  if (beeState) {
    beeState.managerSubTab = tab;
  }
  const tabHive = document.getElementById('beeMgrTabHive');
  const tabMeadow = document.getElementById('beeMgrTabMeadow');
  if (tabHive && tabMeadow) {
    if (tab === 'meadow') {
      tabHive.className = 'sf-mgr-subtab-btn sunflower';
      tabMeadow.className = 'sf-mgr-subtab-btn active water';
    } else {
      tabHive.className = 'sf-mgr-subtab-btn active sunflower';
      tabMeadow.className = 'sf-mgr-subtab-btn water';
    }
  }
  renderBeeManagers();
};

function renderBeeManagers() {
  const listEl = document.getElementById('beeManagersVerticalList');
  if (!listEl) return;

  if (!Array.isArray(beeState.managers) || beeState.managers.length !== 20) {
    beeState.managers = createDefaultBeeManagers();
  }
  if (!Array.isArray(beeState.wellManagers) || beeState.wellManagers.length !== 20) {
    beeState.wellManagers = createDefaultBeeWellManagers();
  }

  const activeHiveCount = beeState.managers.filter(m => m.unlocked && m.activeTimer > 0).length;
  const activeMeadowCount = beeState.wellManagers.filter(m => m.unlocked && m.activeTimer > 0).length;

  const countBadge = document.getElementById('beeManagersSummaryLabel');
  const hiveBadge = document.getElementById('beeMgrHiveActiveBadge');
  const meadowBadge = document.getElementById('beeMgrMeadowActiveBadge');

  if (hiveBadge) hiveBadge.innerText = `${activeHiveCount}/20`;
  if (meadowBadge) meadowBadge.innerText = `${activeMeadowCount}/20`;

  const currentTab = beeState.managerSubTab || 'hive';
  if (countBadge) {
    countBadge.innerText = currentTab === 'meadow'
      ? `${activeMeadowCount} / 20 Meadow Active`
      : `${activeHiveCount} / 20 Hive Active`;
  }

  const tabHive = document.getElementById('beeMgrTabHive');
  const tabMeadow = document.getElementById('beeMgrTabMeadow');
  if (tabHive && tabMeadow) {
    if (currentTab === 'meadow') {
      tabHive.className = 'sf-mgr-subtab-btn sunflower';
      tabMeadow.className = 'sf-mgr-subtab-btn active water';
    } else {
      tabHive.className = 'sf-mgr-subtab-btn active sunflower';
      tabMeadow.className = 'sf-mgr-subtab-btn water';
    }
  }

  let html = '';

  if (currentTab === 'hive') {
    // 🐝 20 HIVE MANAGERS
    beeState.managers.forEach(mgr => {
      const plot = beeState.plots ? beeState.plots[mgr.landId - 1] : null;
      const isPlotUnlocked = plot && plot.unlocked;
      const isActive = mgr.unlocked && mgr.activeTimer > 0;
      const nextCoinCost = (mgr.hireCount + 1) * 500;

      html += `
        <div class="sf-mgr-card ${isActive ? 'active-contract' : (mgr.unlocked ? '' : 'locked')}" id="beeMgrCard-${mgr.landId}">
          <div class="sf-mgr-card-top">
            <div class="sf-mgr-info-left">
              <div class="sf-mgr-avatar-box">
                <span>${mgr.avatar || '👷‍♂️'}</span>
              </div>
              <div class="sf-mgr-title-box">
                <div class="sf-mgr-name">
                  <span>🐝 Hive Manager #${mgr.landId}</span>
                  <span class="text-[9px] bg-amber-950/80 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-700/60 font-mono">Hive #${mgr.landId}</span>
                </div>
                <div class="sf-mgr-sub">
                  <span>${isPlotUnlocked ? `Manages Hive #${mgr.landId} • Auto-Feed 🌸 &amp; Auto-Harvest 🍯` : `⚠️ Unlock Hive #${mgr.landId} in Apiary first`}</span>
                </div>
              </div>
            </div>
            <div class="sf-mgr-status-badge ${!mgr.unlocked ? 'locked' : (isActive ? 'active' : 'expired')}" id="beeMgrStatusBadge-${mgr.landId}">
              ${!mgr.unlocked ? '🔒 LOCKED' : (isActive ? `⚡ ${formatBeeContractDuration(mgr.activeTimer)}` : '⏳ EXPIRED')}
            </div>
          </div>

          <div class="sf-mgr-actions-row" id="beeMgrActionsRow-${mgr.landId}">
            ${!mgr.unlocked ? `
              <button class="sf-mgr-unlock-btn" onclick="unlockBeeManager(${mgr.landId}, event)" title="Unlock Hive Manager (Costs 300 🪙 Gold Coins)">
                <span>🪙 Hire Hive Manager (300 🪙 Gold Coins)</span>
              </button>
            ` : `
              <button class="sf-mgr-coin-btn bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs py-2 px-2 rounded-xl transition flex items-center justify-center gap-1 border border-yellow-400" onclick="hireBeeManagerGoldCoins(${mgr.landId}, event)" title="Extend Manager by 24 Hours for 10 Gold Coins (Max 100h)">
                <span>🪙 10 🪙 (+24h)</span>
              </button>
              <button class="sf-mgr-ad-btn" onclick="hireBeeManagerAd(${mgr.landId}, event)" title="Extend Manager by 10 Hours via Ad (Max 100h)">
                <span>📢 Ad (+10h)</span>
              </button>
              <button class="sf-mgr-coin-btn" onclick="hireBeeManagerCoins(${mgr.landId}, event)" title="Extend 1 Day for Honey (Max 100h)">
                <span>🍯 1 Day (${formatBeeNumber(nextCoinCost)} 🍯)</span>
              </button>
            `}
          </div>
        </div>
      `;
    });
  } else {
    // 🌸 20 MEADOW MANAGERS
    beeState.wellManagers.forEach(mgr => {
      const well = beeState.wells ? beeState.wells[mgr.landId - 1] : null;
      const isWellUnlocked = well && well.unlocked;
      const isActive = mgr.unlocked && mgr.activeTimer > 0;
      const nextCoinCost = (mgr.hireCount + 1) * 500;

      html += `
        <div class="sf-mgr-card water-card ${isActive ? 'active-contract' : (mgr.unlocked ? '' : 'locked')}" id="beeMeadowMgrCard-${mgr.landId}">
          <div class="sf-mgr-card-top">
            <div class="sf-mgr-info-left">
              <div class="sf-mgr-avatar-box">
                <span>${mgr.avatar || '🌸'}</span>
              </div>
              <div class="sf-mgr-title-box">
                <div class="sf-mgr-name">
                  <span>🌸 Meadow Manager #${mgr.landId}</span>
                  <span class="text-[9px] bg-cyan-950/80 text-cyan-300 font-bold px-1.5 py-0.5 rounded border border-cyan-700/60 font-mono">Meadow #${mgr.landId}</span>
                </div>
                <div class="sf-mgr-sub">
                  <span>${isWellUnlocked ? `Manages Meadow #${mgr.landId} • Auto-Harvest 🌸` : `⚠️ Unlock Meadow #${mgr.landId} in Meadows first`}</span>
                </div>
              </div>
            </div>
            <div class="sf-mgr-status-badge ${!mgr.unlocked ? 'locked' : (isActive ? 'active' : 'expired')}" id="beeMeadowMgrStatusBadge-${mgr.landId}">
              ${!mgr.unlocked ? '🔒 LOCKED' : (isActive ? `⚡ ${formatBeeContractDuration(mgr.activeTimer)}` : '⏳ EXPIRED')}
            </div>
          </div>

          <div class="sf-mgr-actions-row" id="beeMeadowMgrActionsRow-${mgr.landId}">
            ${!mgr.unlocked ? `
              <button class="sf-mgr-unlock-btn" onclick="unlockBeeMeadowManager(${mgr.landId}, event)" title="Unlock Meadow Manager (Costs 300 🪙 Gold Coins)">
                <span>🪙 Hire Meadow Manager (300 🪙 Gold Coins)</span>
              </button>
            ` : `
              <button class="sf-mgr-coin-btn bg-cyan-600 hover:bg-cyan-500 text-stone-950 font-bold text-xs py-2 px-2 rounded-xl transition flex items-center justify-center gap-1 border border-cyan-400" onclick="hireBeeMeadowManagerGoldCoins(${mgr.landId}, event)" title="Extend Manager by 24 Hours for 10 Gold Coins (Max 100h)">
                <span>🪙 10 🪙 (+24h)</span>
              </button>
              <button class="sf-mgr-ad-btn" onclick="hireBeeMeadowManagerAd(${mgr.landId}, event)" title="Extend Manager by 10 Hours via Ad (Max 100h)">
                <span>📢 Ad (+10h)</span>
              </button>
              <button class="sf-mgr-coin-btn" onclick="hireBeeMeadowManagerCoins(${mgr.landId}, event)" title="Extend 1 Day for Honey (Max 100h)">
                <span>🍯 1 Day (${formatBeeNumber(nextCoinCost)} 🍯)</span>
              </button>
            `}
          </div>
        </div>
      `;
    });
  }

  listEl.innerHTML = html;
}

window.unlockBeeManager = function(landId, event) {
  if (event) event.stopPropagation();
  const mgr = beeState.managers.find(m => m.landId === landId);
  if (!mgr) return;
  const cost = 300;
  const playerCoins = (window.gameState && window.gameState.player && window.gameState.player.coins) || 0;
  if (playerCoins < cost) {
    alert(`Need 300 🪙 Gold Coins! (Have: ${Math.floor(playerCoins)})`);
    return;
  }
  if (window.gameState && window.gameState.player) {
    window.gameState.player.coins -= cost;
    if (typeof window.updateUI === 'function') window.updateUI();
    if (typeof window.saveGame === 'function') window.saveGame(true);
  }
  mgr.unlocked = true;
  mgr.activeTimer = Math.min(360000, 86400);
  renderBeeManagers();
  updateBeeStickyHeaderAndStats();
  saveBeeStateDebounced();
};

window.unlockBeeMeadowManager = function(landId, event) {
  if (event) event.stopPropagation();
  const mgr = beeState.wellManagers.find(m => m.landId === landId);
  if (!mgr) return;
  const cost = 300;
  const playerCoins = (window.gameState && window.gameState.player && window.gameState.player.coins) || 0;
  if (playerCoins < cost) {
    alert(`Need 300 🪙 Gold Coins! (Have: ${Math.floor(playerCoins)})`);
    return;
  }
  if (window.gameState && window.gameState.player) {
    window.gameState.player.coins -= cost;
    if (typeof window.updateUI === 'function') window.updateUI();
    if (typeof window.saveGame === 'function') window.saveGame(true);
  }
  mgr.unlocked = true;
  mgr.activeTimer = Math.min(360000, 86400);
  renderBeeManagers();
  updateBeeStickyHeaderAndStats();
  saveBeeStateDebounced();
};

window.hireBeeManagerGoldCoins = function(landId, event) {
  if (event) event.stopPropagation();
  const mgr = beeState.managers.find(m => m.landId === landId);
  if (!mgr || !mgr.unlocked) return;
  const MAX_LIMIT = 360000;
  if ((mgr.activeTimer || 0) >= MAX_LIMIT) {
    alert(`Manager #${landId} is already at the maximum 100 Hours limit!`);
    return;
  }
  const playerCoins = (window.gameState && window.gameState.player && window.gameState.player.coins) || 0;
  if (playerCoins < 10) {
    alert(`Need 10 🪙 Gold Coins!`);
    return;
  }
  if (window.gameState && window.gameState.player) {
    window.gameState.player.coins -= 10;
    if (typeof window.updateUI === 'function') window.updateUI();
    if (typeof window.saveGame === 'function') window.saveGame(true);
  }
  mgr.activeTimer = Math.min(MAX_LIMIT, (mgr.activeTimer > 0 ? mgr.activeTimer : 0) + 86400);
  renderBeeManagers();
  updateBeeStickyHeaderAndStats();
  saveBeeStateDebounced();
};

window.hireBeeMeadowManagerGoldCoins = function(landId, event) {
  if (event) event.stopPropagation();
  const mgr = beeState.wellManagers.find(m => m.landId === landId);
  if (!mgr || !mgr.unlocked) return;
  const MAX_LIMIT = 360000;
  if ((mgr.activeTimer || 0) >= MAX_LIMIT) {
    alert(`Manager #${landId} is already at the maximum 100 Hours limit!`);
    return;
  }
  const playerCoins = (window.gameState && window.gameState.player && window.gameState.player.coins) || 0;
  if (playerCoins < 10) {
    alert(`Need 10 🪙 Gold Coins!`);
    return;
  }
  if (window.gameState && window.gameState.player) {
    window.gameState.player.coins -= 10;
    if (typeof window.updateUI === 'function') window.updateUI();
    if (typeof window.saveGame === 'function') window.saveGame(true);
  }
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

window.hireBeeMeadowManagerCoins = function(landId, event) {
  if (event) event.stopPropagation();
  const mgr = beeState.wellManagers.find(m => m.landId === landId);
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

window.hireBeeMeadowManagerAd = function(landId, event) {
  if (event) event.stopPropagation();
  const mgr = beeState.wellManagers.find(m => m.landId === landId);
  if (!mgr || !mgr.unlocked) return;
  const MAX_LIMIT = 360000;
  if ((mgr.activeTimer || 0) >= MAX_LIMIT) {
    alert(`Manager #${landId} is already at maximum 100 Hours limit!`);
    return;
  }
  const doExtend = () => {
    mgr.activeTimer = Math.min(MAX_LIMIT, (mgr.activeTimer > 0 ? mgr.activeTimer : 0) + 36000);
    renderBeeManagers();
    updateBeeStickyHeaderAndStats();
    saveBeeStateDebounced();
  };
  if (typeof window.showRewardedAd === 'function') {
    window.showRewardedAd(doExtend, {
      adTitle: `Meadow Manager #${landId} (+10h)`,
      adDesc: `Watch sponsor video to extend Meadow Manager #${landId} by 10 Hours!`
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
        plot.lifeTimer = 100.0;
        plot.timer = getBeePlotCycleTime(idx, 1);
        if (isBeeActive && beeState.currentPage === 1) renderBeePlots();
      } else if (isBeeActive && beeState.currentPage === 1) {
        const growthTime = plot.growthTimer;
        const progress = Math.max(0, Math.min(1, (30 - growthTime) / 30));
        const bar = document.getElementById(`beeGrowthBar-${plot.id}`);
        if (bar) bar.style.width = `${(progress * 100).toFixed(1)}%`;
        const timerText = document.getElementById(`beeGrowthTimer-${plot.id}`);
        if (timerText) timerText.innerText = `⏳ Incubating: ${Math.ceil(growthTime)}s / 30s`;
        const sqTimer = document.getElementById(`beeGrowthSquareTimer-${plot.id}`);
        if (sqTimer) sqTimer.innerText = `${Math.ceil(growthTime)}s`;
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

      if (isBeeActive && beeState.currentPage === 1) {
        const cycleProgress = Math.min(1, Math.max(0, 1 - ((plot.timer || cycleTime) / Math.max(0.001, cycleTime))));
        const bar = document.getElementById(`beeCycleBar-${plot.id}`);
        if (bar) {
          bar.style.width = `${(cycleProgress * 100).toFixed(1)}%`;
          if (cycleProgress >= 0.95) bar.classList.add('ready');
          else bar.classList.remove('ready');
        }
        const cycleText = document.getElementById(`beeCycleText-${plot.id}`);
        if (cycleText) cycleText.innerText = `⚡ Cycle: ${Math.max(0, plot.timer || 0).toFixed(1)}s / ${cycleTime.toFixed(cycleTime < 0.05 ? 3 : 1)}s`;
        const lifeText = document.getElementById(`beeLifeTimerText-${plot.id}`);
        const maxLife = getBeePlotMaxLifeLimit(idx, plot.level);
        if (lifeText) lifeText.innerText = `${(plot.lifeTimer || 0).toFixed(1)}s / ${Math.floor(maxLife)}s`;
      }
    }
  });

  // 2. Tick 20 Flower Meadows
  beeState.wells.forEach((well, idx) => {
    if (!well.unlocked) return;
    const cycleTime = getBeeWellCycleTime(idx, well.level);
    const meadowMgr = Array.isArray(beeState.wellManagers) ? beeState.wellManagers.find(m => m.landId === well.id) : null;
    const hasManager = meadowMgr && meadowMgr.unlocked && meadowMgr.activeTimer > 0;
    well.hasWorker = !!hasManager;

    well.timer = (well.timer || 0) + deltaSec;
    if (well.timer >= cycleTime) {
      const flowersPerCycle = getBeeWellFlowersPerCycle(idx, well.level);
      well.timer = 0;
      if (hasManager) {
        beeState.flowers = (beeState.flowers || 0) + flowersPerCycle;
        well.storedFlowers = 0;
      } else {
        well.storedFlowers = (well.storedFlowers || 0) + flowersPerCycle;
      }
    }

    if (isBeeActive && beeState.currentPage === 2) {
      const bar = document.getElementById(`beeWellProgressBar-${well.id}`);
      if (bar) {
        const pct = Math.max(0, Math.min(1, (well.timer || 0) / cycleTime)) * 100;
        bar.style.width = `${pct.toFixed(1)}%`;
        if ((well.storedFlowers || 0) > 0 || hasManager) bar.classList.add('ready');
        else bar.classList.remove('ready');
      }
      const timeLbl = document.getElementById(`beeWellTime-${well.id}`);
      if (timeLbl) {
        timeLbl.innerText = `⏱️ ${formatTimerText(well.timer || 0, cycleTime)} / ${formatTimerText(cycleTime, cycleTime)}${(well.storedFlowers || 0) > 0 ? ` (+${well.storedFlowers} 🌸 ready)` : ''}`;
      }
      const collectBtn = document.getElementById(`beeWellCollectBtn-${well.id}`);
      if (collectBtn) {
        if ((well.storedFlowers || 0) > 0) {
          collectBtn.classList.add('active-ready');
          collectBtn.innerHTML = `<span>🌸 Collect (${well.storedFlowers} 🌸)</span>`;
        } else {
          collectBtn.classList.remove('active-ready');
          collectBtn.innerHTML = `<span>🌸 Collect</span>`;
        }
      }
    }
  });

  // 3. Tick 20 Hive & Meadow Managers
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

  if (Array.isArray(beeState.wellManagers)) {
    beeState.wellManagers.forEach(mgr => {
      if (mgr.unlocked && mgr.activeTimer > 0) {
        mgr.activeTimer = Math.max(0, mgr.activeTimer - deltaSec);
      }
    });
  }

  // 4. Update UI
  if (isBeeActive) {
    updateBeeStickyHeaderAndStats();
    updateBeeBoosterUI();
    if (beeState.currentPage === 4) {
      if (beeState.managerSubTab === 'meadow') {
        if (Array.isArray(beeState.wellManagers)) {
          beeState.wellManagers.forEach(mgr => {
            const badge = document.getElementById(`beeMeadowMgrStatusBadge-${mgr.landId}`);
            if (badge && mgr.unlocked) {
              if (mgr.activeTimer > 0) {
                badge.className = 'sf-mgr-status-badge active';
                badge.innerText = `⚡ ${formatBeeContractDuration(mgr.activeTimer)}`;
              } else {
                badge.className = 'sf-mgr-status-badge expired';
                badge.innerText = '⏳ EXPIRED';
              }
            }
          });
        }
      } else {
        if (Array.isArray(beeState.managers)) {
          beeState.managers.forEach(mgr => {
            const badge = document.getElementById(`beeMgrStatusBadge-${mgr.landId}`);
            if (badge && mgr.unlocked) {
              if (mgr.activeTimer > 0) {
                badge.className = 'sf-mgr-status-badge active';
                badge.innerText = `⚡ ${formatBeeContractDuration(mgr.activeTimer)}`;
              } else {
                badge.className = 'sf-mgr-status-badge expired';
                badge.innerText = '⏳ EXPIRED';
              }
            }
          });
        }
      }
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
