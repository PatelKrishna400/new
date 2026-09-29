/* ==========================================================================
   HONEY BEE FARM TYCOON ENGINE (pages/bee-farm/bee-farm.js)
   20 Apiary Hives (Lv. 1-5000, 0.001s speed drop),
   20 Flower Collecting Meadows (5s bloom cycle producing Pollen Pots),
   Flower Forager Workers (Automation), Supply Shop,
   and 100 🍯 -> 29 ⚡ Royal Energy Refinery
   ========================================================================== */

const BEE_STORAGE_KEY = 'beefarm_tycoon_state_v2';

// 20 Hive Plot Diamond Unlock Costs
const BEE_LAND_UNLOCK_COSTS = [
  0,      // Hive 1: Free
  10,     // Hive 2: 10 💎
  100,    // Hive 3: 100 💎
  250,    // Hive 4
  450,    // Hive 5
  750,    // Hive 6
  1200,   // Hive 7
  1800,   // Hive 8
  2600,   // Hive 9
  3600,   // Hive 10
  5000,   // Hive 11
  7000,   // Hive 12
  9500,   // Hive 13
  12500,  // Hive 14
  16500,  // Hive 15
  21500,  // Hive 16
  28000,  // Hive 17
  36000,  // Hive 18
  46000,  // Hive 19
  60000   // Hive 20
];

const BEE_LAND_BASE_TIMES = [
  5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
  15, 16, 17, 18, 19, 20, 22, 24, 26, 30
];

// 20 Flower Meadow Progressive Diamond Unlock Costs
const BEE_FLOWER_UNLOCK_COSTS = [
  0,     // Meadow 1: Free
  10,    // Meadow 2: 10 💎
  25,    // Meadow 3: 25 💎
  50,    // Meadow 4: 50 💎
  100,   // Meadow 5: 100 💎
  175,   // Meadow 6
  275,   // Meadow 7
  400,   // Meadow 8
  550,   // Meadow 9
  750,   // Meadow 10
  1000,  // Meadow 11
  1350,  // Meadow 12
  1800,  // Meadow 13
  2350,  // Meadow 14
  3000,  // Meadow 15
  3800,  // Meadow 16
  4750,  // Meadow 17
  5850,  // Meadow 18
  7100,  // Meadow 19
  8500   // Meadow 20
];

const BEE_FLOWER_NAMES = [
  "Wild Sunflower & Golden Clover",
  "Sweet Lavender Trellis",
  "Crimson Wildflower Blossom",
  "Orange Blossom Orchard",
  "Royal Orchid Valley",
  "Mountain Heather Blossom",
  "White Jasmine Glade",
  "Purple Cornflower Meadow",
  "Golden Marigold Fields",
  "Pink Lotus Lagoon",
  "Midnight Dahlia Garden",
  "Alpine Edelweiss Peak",
  "Scarlet Poppy Prairie",
  "Honeycomb Honeysuckle",
  "Sunlit Chamomile Haven",
  "Magnolia Breeze Grove",
  "Saffron Crocus Ridge",
  "Cherry Blossom Canopy",
  "Celestial Starflower Meadow",
  "Mythic Royal Sunblossom"
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
      productionTime: BEE_LAND_BASE_TIMES[i - 1] || 5,
      honeyProduction: 1,
      timer: BEE_LAND_BASE_TIMES[i - 1] || 5,
      isWithered: false
    });
  }
  return plots;
}

function createDefaultBeeFlowers() {
  const flowers = [];
  for (let i = 1; i <= 20; i++) {
    const isUnlocked = i === 1;
    flowers.push({
      id: i,
      name: BEE_FLOWER_NAMES[i - 1] || `Flower Meadow #${i}`,
      unlocked: isUnlocked,
      unlockCost: BEE_FLOWER_UNLOCK_COSTS[i - 1],
      productionTimer: 5.0,
      productionDuration: 5.0,
      pollenReady: 0, // 0 or 1
      hasWorker: false
    });
  }
  return flowers;
}

function loadInitialBeeFarmState() {
  try {
    const raw = localStorage.getItem(BEE_STORAGE_KEY) || localStorage.getItem('beefarm_tycoon_state_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        if (!Array.isArray(parsed.plots) || parsed.plots.length !== 20 || typeof parsed.plots[0].level !== 'number') {
          parsed.plots = createDefaultBeePlots();
        }
        if (!Array.isArray(parsed.flowers) || parsed.flowers.length !== 20) {
          parsed.flowers = createDefaultBeeFlowers();
        }
        if (typeof parsed.larvae !== 'number') parsed.larvae = 3;
        if (typeof parsed.pollen !== 'number') parsed.pollen = 2;
        if (typeof parsed.smokers !== 'number') parsed.smokers = 1;
        if (typeof parsed.honey !== 'number') parsed.honey = 150;
        if (typeof parsed.diamonds !== 'number') parsed.diamonds = 25;
        if (typeof parsed.energy !== 'number') parsed.energy = 0;
        if (typeof parsed.flowerWorkersCount !== 'number') parsed.flowerWorkersCount = 0;
        if (!parsed.upgradeMultiplier) parsed.upgradeMultiplier = 1;
        if (!parsed.workers) {
          parsed.workers = { walter: false, elena: false, dave: false, chloe: false, leo: false, barney: false };
        }
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse saved Bee Farm state:', e);
  }

  return {
    currentPage: 1,
    honey: 150,
    energy: 0,
    diamonds: 25,
    larvae: 3,
    pollen: 2,
    smokers: 1,
    upgradeMultiplier: 1, // 1, 10, 100, or 'max'
    flowerWorkersCount: 0,
    workers: {
      walter: false,
      elena: false,
      dave: false,
      chloe: false,
      leo: false,
      barney: false
    },
    plots: createDefaultBeePlots(),
    flowers: createDefaultBeeFlowers()
  };
}

const beeState = loadInitialBeeFarmState();
window.beeState = beeState;

let beeSaveTimeout = null;
function saveBeeStateDebounced() {
  if (beeSaveTimeout) return;
  beeSaveTimeout = setTimeout(() => {
    beeSaveTimeout = null;
    try {
      localStorage.setItem(BEE_STORAGE_KEY, JSON.stringify(beeState));
    } catch (e) {}
  }, 1000);
}

/* ==========================================================================
   AUDIO SYNTHESIS SYSTEM
   ========================================================================== */
const beeAudio = {
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
  playTone(freq, type = 'sine', duration = 0.12, gainLevel = 0.08) {
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
  playHoneyPop() {
    this.playTone(850, 'triangle', 0.1, 0.07);
  },
  playPollenSplash() {
    this.playTone(720, 'sine', 0.15, 0.08);
  },
  playSmoke() {
    this.playTone(180, 'sawtooth', 0.2, 0.09);
  },
  playUpgradeChime() {
    [523, 659, 783, 1046].forEach((f, idx) => {
      setTimeout(() => this.playTone(f, 'triangle', 0.15, 0.08), idx * 60);
    });
  },
  playUnlockChime() {
    [440, 554, 659, 880].forEach((f, idx) => {
      setTimeout(() => this.playTone(f, 'sine', 0.2, 0.09), idx * 70);
    });
  },
  playRefineryChime() {
    [600, 750, 900, 1200].forEach((f, idx) => {
      setTimeout(() => this.playTone(f, 'triangle', 0.18, 0.1), idx * 60);
    });
  }
};

window.toggleBeeAudioMute = function() {
  beeAudio.muted = !beeAudio.muted;
  const btns = document.querySelectorAll('#beeSoundBtn, #beeSoundToggleBtn');
  btns.forEach(b => {
    b.innerText = beeAudio.muted ? '🔇' : '🔊';
  });
};

function spawnBeeFloat(text, x, y, color = 'text-amber-400') {
  const el = document.createElement('div');
  el.className = `floating-honey-particle ${color} text-xs sm:text-sm select-none font-black`;
  el.innerHTML = text;
  el.style.left = `${x || window.innerWidth / 2}px`;
  el.style.top = `${y || window.innerHeight / 2}px`;
  document.body.appendChild(el);
  setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, 1200);
}

/* ==========================================================================
   MATHEMATICAL FORMULAS: HIVES (LEVELS 1 TO 5000)
   Speed drops down to 0.001s, Output scales, Max Cap increases +5s
   ========================================================================== */

function getBeePlotCycleTime(plotIndex, level) {
  const baseTime = BEE_LAND_BASE_TIMES[plotIndex] || 5;
  const L = Math.min(5000, Math.max(1, level || 1));
  if (L >= 5000) return 0.001;

  let time = baseTime * Math.pow(0.001 / baseTime, (L - 1) / 4999);

  // Leo Scout Bee Worker speed boost (halves cycle duration)
  if (beeState && beeState.workers && beeState.workers.leo) {
    time = time / 2;
  }
  return Math.max(0.001, time);
}

function getBeePlotHoneyPerCycle(plotIndex, level) {
  const L = Math.min(5000, Math.max(1, level || 1));
  let baseHoney = 1;

  if (L === 1) baseHoney = 1;
  else if (L === 2) baseHoney = 50;
  else if (L === 3) baseHoney = 500;
  else if (L === 4) baseHoney = 5000;
  else {
    baseHoney = Math.floor(5000 * Math.pow(1.025, L - 4));
  }

  // Elena Queen Attendant output boost (+20%)
  if (beeState && beeState.workers && beeState.workers.elena) {
    baseHoney = Math.round(baseHoney * 1.2);
  }
  return Math.max(1, baseHoney);
}

function getBeePlotUpgradeCost(plotIndex, level) {
  const L = Math.min(5000, Math.max(1, level || 1));
  if (L >= 5000) return Infinity;
  const honeyGen = getBeePlotHoneyPerCycle(plotIndex, L);
  return Math.round(honeyGen * 10);
}

function getBeePlotMaxLifeLimit(level) {
  const L = Math.min(5000, Math.max(1, level || 1));
  return 60.0 + (L - 1) * 5.0; // Starts at 60s, +5s per level upgrade
}

function getBeeMultiUpgradeInfo(plotIndex, currentLevel, multMode, playerHoney) {
  let levelsToAdd = 0;
  let totalCost = 0;
  let curL = currentLevel;

  let targetLevels = 1;
  if (multMode === 10) targetLevels = 10;
  else if (multMode === 100) targetLevels = 100;
  else if (multMode === 'max') targetLevels = 5000;

  while (curL < 5000 && levelsToAdd < targetLevels) {
    const cost = getBeePlotUpgradeCost(plotIndex, curL);
    if (cost === Infinity) break;
    if (multMode === 'max' && totalCost + cost > playerHoney && levelsToAdd > 0) {
      break;
    }
    totalCost += cost;
    curL++;
    levelsToAdd++;
    if (multMode !== 'max' && levelsToAdd >= targetLevels) break;
  }

  if (levelsToAdd === 0) {
    levelsToAdd = 1;
    totalCost = getBeePlotUpgradeCost(plotIndex, currentLevel);
  }

  return {
    levelsToAdd: Math.max(1, levelsToAdd),
    totalCost,
    targetLevel: Math.min(5000, currentLevel + levelsToAdd)
  };
}

/* ==========================================================================
   NAVIGATION: 5-TAB SYSTEM
   1: Apiary | 2: Flowers | 3: Shop | 4: Workers | 5: Converter
   ========================================================================== */

const beePageBadges = {
  1: "Page 1: Apiary Hives 🐝",
  2: "Page 2: Flower Meadows 🌸",
  3: "Page 3: Supply Store 🏪",
  4: "Page 4: Workers HQ 👷",
  5: "Page 5: Energy Refinery ⚡"
};

window.navigateBeePage = function(pageNum) {
  beeState.currentPage = pageNum;
  beeAudio.playTone(520, 'triangle', 0.08, 0.05);

  // Toggle Page Sections
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

    const tabEl = document.getElementById(`beeTab${i}`);
    if (tabEl) {
      if (i === pageNum) tabEl.classList.add('active-tab');
      else tabEl.classList.remove('active-tab');
    }
  }

  // Update Top Dashboard Badge
  const badgeEl = document.getElementById('beeActivePageBadge');
  if (badgeEl) badgeEl.innerText = beePageBadges[pageNum] || `Page ${pageNum}`;

  // Update Bottom Menu Bar Active State
  const menuMap = {
    1: 'beeMenuTabApiary',
    2: 'beeMenuTabFlowers',
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

  // Pan Panoramic Background Artwork
  const stageArtwork = document.getElementById('beeStageArtwork');
  if (stageArtwork) {
    if (pageNum === 1) stageArtwork.style.backgroundPosition = 'right 25%';
    else if (pageNum === 2) stageArtwork.style.backgroundPosition = 'left 15%';
    else if (pageNum === 3) stageArtwork.style.backgroundPosition = 'right 5%';
    else if (pageNum === 4) stageArtwork.style.backgroundPosition = 'center 40%';
    else if (pageNum === 5) stageArtwork.style.backgroundPosition = 'center 80%';
  }

  if (pageNum === 1) renderBeePlots();
  if (pageNum === 2) renderBeeFlowers();
  if (pageNum === 4) renderBeeWorkerAssignments();
  updateBeeFarmMiniStats();
};

/* ==========================================================================
   UPGRADE MULTIPLIER (1x, 10x, 100x, MAX) - CIRCLE TOGGLE SWITCH
   ========================================================================== */

window.setBeeUpgradeMultiplier = function(mult) {
  beeState.upgradeMultiplier = mult;

  // 1. Update circular toggle button text & data-mult attribute
  const displayVal = mult === 'max' ? 'MAX' : `${mult}x`;
  document.querySelectorAll('.bee-mult-circle-val').forEach(el => {
    el.innerText = displayVal;
  });
  document.querySelectorAll('.bee-mult-circle-toggle-btn').forEach(btn => {
    btn.setAttribute('data-mult', String(mult));
    btn.classList.remove('bee-mult-bump');
    void btn.offsetWidth;
    btn.classList.add('bee-mult-bump');
    setTimeout(() => btn.classList.remove('bee-mult-bump'), 220);
  });

  renderBeePlots();
  saveBeeStateDebounced();
};

window.toggleBeeUpgradeMultiplier = function(event = null) {
  const current = beeState.upgradeMultiplier || 1;
  let next = 1;
  if (current === 1 || current === '1') next = 10;
  else if (current === 10 || current === '10') next = 100;
  else if (current === 100 || current === '100') next = 'max';
  else next = 1;

  setBeeUpgradeMultiplier(next);

  beeAudio.playTone(620, 'triangle', 0.08, 0.06);

  const display = next === 'max' ? 'MAX' : `${next}x`;
  const posX = event ? event.clientX : window.innerWidth / 2;
  const posY = event ? event.clientY : window.innerHeight / 2;
  spawnBeeFloat(`⚡ Buy Multiplier: ${display}`, posX, posY, 'text-amber-400');
};

/* ==========================================================================
   PAGE 1: APIARY HIVE ACTIONS
   Place Larva, Nourish (+10s), Upgrade (+5s Cap), Smoke (Clear)
   ========================================================================== */

window.placeBeePlot = function(plotId, event = null) {
  const plotIndex = plotId - 1;
  const plot = beeState.plots[plotIndex];
  if (!plot || !plot.unlocked || plot.plantStatus !== 'empty') return;

  if (beeState.larvae > 0) {
    beeState.larvae -= 1;
    plot.plantStatus = 'growing';
    plot.growthTimer = 30.0;
    plot.growthDuration = 30.0;
    plot.level = 1;
    plot.lifeTimer = 0;
    plot.isWithered = false;

    beeAudio.playTone(550, 'triangle', 0.15, 0.1);
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnBeeFloat(`🐝 Installed Queen Larva in Hive #${plot.id}! (30s Incubation)`, posX, posY, 'text-emerald-400');

    saveBeeStateDebounced();
    updateBeeFarmMiniStats();
    renderBeePlots();
  } else {
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnBeeFloat('No Queen Larvae in inventory! Buy at Shop (Page 3) 🐝', posX, posY, 'text-red-400');
  }
};

window.nourishBeePlot = function(plotId, event = null) {
  const plotIndex = plotId - 1;
  const plot = beeState.plots[plotIndex];
  if (!plot || !plot.unlocked) return;

  if (plot.plantStatus !== 'alive') {
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnBeeFloat('Only active producing hives can be nourished with Pollen! 🏺', posX, posY, 'text-stone-400');
    return;
  }

  if (beeState.pollen > 0) {
    const maxCap = getBeePlotMaxLifeLimit(plot.level);
    if (plot.lifeTimer >= maxCap) {
      const posX = event ? event.clientX : window.innerWidth / 2;
      const posY = event ? event.clientY : window.innerHeight / 2;
      spawnBeeFloat(`Hive #${plot.id} already at Max Life Limit (${maxCap}s)! Upgrade to raise cap 🏺`, posX, posY, 'text-yellow-400');
      return;
    }

    beeState.pollen -= 1;
    plot.lifeTimer = Math.min(maxCap, (plot.lifeTimer || 0) + 10.0);

    beeAudio.playPollenSplash();
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnBeeFloat(`🏺 Nourished Hive #${plot.id} (+10s Life)!`, posX, posY, 'text-rose-300');

    saveBeeStateDebounced();
    updateBeeFarmMiniStats();
    renderBeePlots();
  } else {
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnBeeFloat('No Pollen Pots! Harvest at Flower Meadows (Page 2) 🌸', posX, posY, 'text-red-400');
  }
};

window.upgradeBeePlot = function(plotId, event = null) {
  const plotIndex = plotId - 1;
  const plot = beeState.plots[plotIndex];
  if (!plot || !plot.unlocked || plot.level >= 5000) return;

  const mult = beeState.upgradeMultiplier || 1;
  const info = getBeeMultiUpgradeInfo(plotIndex, plot.level, mult, beeState.honey);

  if (beeState.honey >= info.totalCost) {
    beeState.honey -= info.totalCost;
    plot.level = info.targetLevel;

    const newCycleTime = getBeePlotCycleTime(plotIndex, plot.level);
    plot.productionTime = newCycleTime;
    plot.honeyProduction = getBeePlotHoneyPerCycle(plotIndex, plot.level);
    plot.maxLifeLimit = getBeePlotMaxLifeLimit(plot.level);

    beeAudio.playUpgradeChime();
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnBeeFloat(`▲ Hive #${plot.id} Lv. ${plot.level}! Max Life Cap: ${plot.maxLifeLimit}s (+${info.levelsToAdd * 5}s)! 🐝`, posX, posY, 'text-yellow-400');

    renderBeePlots();
    updateBeeFarmMiniStats();
    saveBeeStateDebounced();
  } else {
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnBeeFloat(`Need ${formatBeeNumber(info.totalCost)} 🍯 Honey Drops!`, posX, posY, 'text-red-400');
  }
};

window.smokeBeePlot = function(plotId, event = null) {
  const plotIndex = plotId - 1;
  const plot = beeState.plots[plotIndex];
  if (!plot || !plot.unlocked || plot.plantStatus !== 'dead') return;

  if (beeState.smokers > 0) {
    beeState.smokers -= 1;
    plot.plantStatus = 'empty';
    plot.isWithered = false;
    plot.level = 1;
    plot.growthTimer = 0;
    plot.lifeTimer = 0;
    plot.timer = getBeePlotCycleTime(plotIndex, 1);

    beeAudio.playSmoke();
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnBeeFloat(`Hive #${plot.id} Cleared with Smoker! Install a new Queen Larva 🐝`, posX, posY, 'text-emerald-400');

    saveBeeStateDebounced();
    updateBeeFarmMiniStats();
    renderBeePlots();
  } else {
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnBeeFloat('No Smokers in inventory! Buy at Shop (Page 3) 💨', posX, posY, 'text-red-400');
  }
};

window.unlockBeePlot = function(plotId, event = null) {
  const plotIndex = plotId - 1;
  const plot = beeState.plots[plotIndex];
  if (!plot || plot.unlocked) return;

  const cost = plot.unlockCost;
  if (beeState.diamonds >= cost) {
    beeState.diamonds -= cost;
    plot.unlocked = true;
    plot.plantStatus = 'empty';
    plot.level = 1;

    beeAudio.playUnlockChime();
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnBeeFloat(`🎉 Hive #${plot.id} Unlocked (-${cost} 💎)! Ready for Queen Larva!`, posX, posY, 'text-emerald-400');

    saveBeeStateDebounced();
    updateBeeFarmMiniStats();
    renderBeePlots();
  } else {
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnBeeFloat(`Need ${cost} 💎 to unlock Hive #${plot.id}!`, posX, posY, 'text-red-400');
  }
};

// Quick Tools
window.placeAllBeeHives = function(event = null) {
  let placed = 0;
  beeState.plots.forEach(p => {
    if (p.unlocked && p.plantStatus === 'empty' && beeState.larvae > 0) {
      beeState.larvae -= 1;
      p.plantStatus = 'growing';
      p.growthTimer = 30.0;
      p.growthDuration = 30.0;
      p.level = 1;
      p.lifeTimer = 0;
      p.isWithered = false;
      placed++;
    }
  });

  if (placed > 0) {
    beeAudio.playTone(550, 'triangle', 0.15, 0.1);
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnBeeFloat(`🐝 Installed ${placed} Queen Larvae into Hives!`, posX, posY, 'text-emerald-400');
    saveBeeStateDebounced();
    updateBeeFarmMiniStats();
    renderBeePlots();
  } else {
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnBeeFloat('No empty hives or Queen Larvae in inventory!', posX, posY, 'text-stone-400');
  }
};

window.nourishAllBeeHives = function(event = null) {
  let nourished = 0;
  beeState.plots.forEach(p => {
    if (p.unlocked && p.plantStatus === 'alive' && beeState.pollen > 0) {
      const maxCap = getBeePlotMaxLifeLimit(p.level);
      if (p.lifeTimer < maxCap) {
        beeState.pollen -= 1;
        p.lifeTimer = Math.min(maxCap, p.lifeTimer + 10.0);
        nourished++;
      }
    }
  });

  if (nourished > 0) {
    beeAudio.playPollenSplash();
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnBeeFloat(`Nourished ${nourished} Hives (+10s Life)! 🏺`, posX, posY, 'text-rose-300');
    saveBeeStateDebounced();
    updateBeeFarmMiniStats();
    renderBeePlots();
  } else {
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnBeeFloat('No Pollen Pots or all active hives already at max cap!', posX, posY, 'text-stone-400');
  }
};

window.smokeAllBeeHives = function(event = null) {
  let cleared = 0;
  beeState.plots.forEach(p => {
    if (p.unlocked && p.plantStatus === 'dead' && beeState.smokers > 0) {
      beeState.smokers -= 1;
      p.plantStatus = 'empty';
      p.isWithered = false;
      p.level = 1;
      p.growthTimer = 0;
      p.lifeTimer = 0;
      cleared++;
    }
  });

  if (cleared > 0) {
    beeAudio.playSmoke();
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnBeeFloat(`Cleared ${cleared} Dead Hives with Smokers! 💨`, posX, posY, 'text-emerald-400');
    saveBeeStateDebounced();
    updateBeeFarmMiniStats();
    renderBeePlots();
  } else {
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnBeeFloat('No dead hives to clear!', posX, posY, 'text-stone-400');
  }
};

/* ==========================================================================
   PAGE 2: FLOWER COLLECTING MEADOWS ACTIONS
   Harvest Pollen Pots (5s Bloom), Unlock Meadows, Collect All
   ========================================================================== */

window.collectFlowerPollen = function(flowerId, event = null) {
  const flowerIndex = flowerId - 1;
  const flower = beeState.flowers[flowerIndex];
  if (!flower || !flower.unlocked || flower.pollenReady <= 0) return;

  const count = flower.pollenReady;
  beeState.pollen += count;
  flower.pollenReady = 0;
  flower.productionTimer = 5.0;

  beeAudio.playPollenSplash();
  const posX = event ? event.clientX : window.innerWidth / 2;
  const posY = event ? event.clientY : window.innerHeight / 2;
  spawnBeeFloat(`+${count} Pollen Pot 🏺 Harvested from Meadow #${flower.id}!`, posX, posY, 'text-rose-300');

  saveBeeStateDebounced();
  updateBeeFarmMiniStats();
  renderBeeFlowers();
};

window.collectAllFlowersPollen = function(event = null) {
  let totalCollected = 0;
  beeState.flowers.forEach(f => {
    if (f.unlocked && f.pollenReady > 0) {
      totalCollected += f.pollenReady;
      f.pollenReady = 0;
      f.productionTimer = 5.0;
    }
  });

  if (totalCollected > 0) {
    beeState.pollen += totalCollected;
    beeAudio.playPollenSplash();
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnBeeFloat(`🌸 Harvested +${totalCollected} Pollen Pots from all Flower Meadows!`, posX, posY, 'text-rose-300');
    saveBeeStateDebounced();
    updateBeeFarmMiniStats();
    renderBeeFlowers();
  } else {
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnBeeFloat('No flower meadows have ready pollen pots to harvest yet! (5s bloom cycle)', posX, posY, 'text-stone-400');
  }
};

window.unlockBeeFlower = function(flowerId, event = null) {
  const flowerIndex = flowerId - 1;
  const flower = beeState.flowers[flowerIndex];
  if (!flower || flower.unlocked) return;

  const cost = flower.unlockCost;
  if (beeState.diamonds >= cost) {
    beeState.diamonds -= cost;
    flower.unlocked = true;
    flower.productionTimer = 5.0;
    flower.pollenReady = 0;

    beeAudio.playUnlockChime();
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnBeeFloat(`🌸 Flower Meadow #${flower.id} Unlocked (-${cost} 💎)!`, posX, posY, 'text-emerald-400');

    saveBeeStateDebounced();
    updateBeeFarmMiniStats();
    renderBeeFlowers();
    renderBeeWorkerAssignments();
  } else {
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnBeeFloat(`Need ${cost} 💎 to unlock Flower Meadow #${flower.id}!`, posX, posY, 'text-red-400');
  }
};

/* ==========================================================================
   PAGE 4: WORKERS HQ (FLOWER FORAGERS AUTOMATION & COLONY SPECIALISTS)
   ========================================================================== */

function getAssignedBeeFlowerWorkersCount() {
  if (!beeState || !Array.isArray(beeState.flowers)) return 0;
  return beeState.flowers.filter(f => f.hasWorker).length;
}

function getIdleBeeFlowerWorkersCount() {
  const total = beeState.flowerWorkersCount || 0;
  const assigned = getAssignedBeeFlowerWorkersCount();
  return Math.max(0, total - assigned);
}

window.hireBeeFlowerWorker = function(currency = 'honey') {
  if (currency === 'honey') {
    if (beeState.honey >= 250) {
      beeState.honey -= 250;
      beeState.flowerWorkersCount = (beeState.flowerWorkersCount || 0) + 1;
      beeAudio.playTone(650, 'sine', 0.15, 0.1);
      spawnBeeFloat('👩‍🌾 Hired 1 Flower Forager Worker (-250 🍯)!', null, null, 'text-emerald-400');
      saveBeeStateDebounced();
      updateBeeFarmMiniStats();
      renderBeeWorkerAssignments();
      renderBeeFlowers();
    } else {
      spawnBeeFloat('Need 250 🍯 Honey Drops to hire a Forager Worker!', null, null, 'text-red-400');
    }
  } else if (currency === 'diamonds') {
    if (beeState.diamonds >= 5) {
      beeState.diamonds -= 5;
      beeState.flowerWorkersCount = (beeState.flowerWorkersCount || 0) + 1;
      beeAudio.playTone(650, 'sine', 0.15, 0.1);
      spawnBeeFloat('👩‍🌾 Hired 1 Flower Forager Worker (-5 💎)!', null, null, 'text-cyan-300');
      saveBeeStateDebounced();
      updateBeeFarmMiniStats();
      renderBeeWorkerAssignments();
      renderBeeFlowers();
    } else {
      spawnBeeFloat('Need 5 💎 Diamonds to hire a Forager Worker!', null, null, 'text-red-400');
    }
  }
};

window.assignBeeFlowerWorker = function(flowerId) {
  const flowerIndex = flowerId - 1;
  const flower = beeState.flowers[flowerIndex];
  if (!flower || !flower.unlocked || flower.hasWorker) return;

  if (getIdleBeeFlowerWorkersCount() <= 0) {
    spawnBeeFloat('No idle Forager Workers available! Hire more in Workers HQ 👩‍🌾', null, null, 'text-stone-400');
    return;
  }

  flower.hasWorker = true;
  beeAudio.playTone(700, 'triangle', 0.12, 0.08);
  spawnBeeFloat(`👩‍🌾 Forager Worker assigned to Meadow #${flower.id}! Auto-harvesting active!`, null, null, 'text-emerald-400');

  saveBeeStateDebounced();
  updateBeeFarmMiniStats();
  renderBeeWorkerAssignments();
  renderBeeFlowers();
};

window.recallBeeFlowerWorker = function(flowerId) {
  const flowerIndex = flowerId - 1;
  const flower = beeState.flowers[flowerIndex];
  if (!flower || !flower.hasWorker) return;

  flower.hasWorker = false;
  beeAudio.playTone(400, 'sawtooth', 0.1, 0.08);
  spawnBeeFloat(`Recalled Forager Worker from Meadow #${flower.id}!`, null, null, 'text-amber-400');

  saveBeeStateDebounced();
  updateBeeFarmMiniStats();
  renderBeeWorkerAssignments();
  renderBeeFlowers();
};

window.switchBeeWorkerSubtab = function(tabName) {
  const flowerTab = document.getElementById('beeWorkerTabFlower');
  const colonyTab = document.getElementById('beeWorkerTabColony');
  const flowerContent = document.getElementById('beeWorkerSubtabFlowerContent');
  const colonyContent = document.getElementById('beeWorkerSubtabColonyContent');

  if (tabName === 'flower') {
    if (flowerTab) { flowerTab.className = "px-3 py-1 rounded-lg text-xs font-bold transition bg-emerald-600 text-white"; }
    if (colonyTab) { colonyTab.className = "px-3 py-1 rounded-lg text-xs font-bold transition text-stone-400 hover:text-white"; }
    if (flowerContent) flowerContent.classList.remove('hidden');
    if (colonyContent) colonyContent.classList.add('hidden');
  } else {
    if (colonyTab) { colonyTab.className = "px-3 py-1 rounded-lg text-xs font-bold transition bg-emerald-600 text-white"; }
    if (flowerTab) { flowerTab.className = "px-3 py-1 rounded-lg text-xs font-bold transition text-stone-400 hover:text-white"; }
    if (colonyContent) colonyContent.classList.remove('hidden');
    if (flowerContent) flowerContent.classList.add('hidden');
  }
};

window.hireColonySpecialist = function(workerId) {
  if (!beeState.workers) beeState.workers = {};
  if (beeState.workers[workerId]) {
    spawnBeeFloat('Specialist already hired and active!', null, null, 'text-amber-400');
    return;
  }

  let cost = 500;
  if (workerId === 'elena') cost = 1500;

  if (beeState.honey >= cost) {
    beeState.honey -= cost;
    beeState.workers[workerId] = true;
    beeAudio.playUpgradeChime();
    spawnBeeFloat(`Colony Manager hired (-${cost} 🍯)!`, null, null, 'text-emerald-400');
    saveBeeStateDebounced();
    updateBeeFarmMiniStats();
  } else {
    spawnBeeFloat(`Need ${cost} 🍯 Honey Drops to hire this manager!`, null, null, 'text-red-400');
  }
};

/* ==========================================================================
   PAGE 5: ROYAL HONEY-TO-ENERGY REFINERY (100 🍯 -> 29 ⚡)
   ========================================================================== */

window.executeBeeHoneyToEnergy = function(mode = 'single') {
  let cost = 0;
  if (mode === 'single') {
    cost = 100;
  } else {
    cost = Math.floor(beeState.honey / 100) * 100;
  }

  if (cost < 100 || beeState.honey < cost) {
    spawnBeeFloat('Need at least 100 🍯 Honey Drops to refine into 29 ⚡ Energy!', null, null, 'text-red-400');
    return;
  }

  const batches = Math.floor(cost / 100);
  const energyGain = batches * 29;

  beeState.honey -= cost;
  beeState.energy = (beeState.energy || 0) + energyGain;

  // Sync to global reactor state
  if (typeof gameState !== 'undefined' && gameState.reactor) {
    const maxE = gameState.reactor.maxEnergy || 1000;
    gameState.reactor.currentEnergy = Math.min(maxE, (gameState.reactor.currentEnergy || 0) + energyGain);
    if (typeof updateEnergyUI === 'function') updateEnergyUI();
  }

  beeAudio.playRefineryChime();
  spawnBeeFloat(`-${cost} 🍯 &rarr; +${energyGain} ⚡ Royal Jelly Energy!`, null, null, 'text-yellow-300');

  saveBeeStateDebounced();
  updateBeeFarmMiniStats();
};

/* ==========================================================================
   PAGE 3: SUPPLY SHOP PURCHASING & REWARDED ADS
   ========================================================================== */

window.buyBeeItem = function(itemType, count = 1, currency = 'honey') {
  let priceHoney = 0;
  let priceDiamonds = 0;

  if (itemType === 'larva') {
    priceHoney = 50; priceDiamonds = 1;
  } else if (itemType === 'pollen') {
    priceHoney = 20; priceDiamonds = 1;
  } else if (itemType === 'smoker') {
    priceHoney = 50; priceDiamonds = 3;
  }

  if (currency === 'honey') {
    if (beeState.honey >= priceHoney) {
      beeState.honey -= priceHoney;
      if (itemType === 'larva') beeState.larvae = (beeState.larvae || 0) + count;
      else if (itemType === 'pollen') beeState.pollen = (beeState.pollen || 0) + count;
      else if (itemType === 'smoker') beeState.smokers = (beeState.smokers || 0) + count;

      beeAudio.playTone(600, 'triangle', 0.1, 0.08);
      spawnBeeFloat(`+${count} ${itemType === 'larva' ? 'Queen Larva 🐝' : (itemType === 'pollen' ? 'Pollen Pot 🏺' : 'Smoker 💨')}!`, null, null, 'text-emerald-400');
      saveBeeStateDebounced();
      updateBeeFarmMiniStats();
    } else {
      spawnBeeFloat(`Need ${priceHoney} 🍯 Honey Drops!`, null, null, 'text-red-400');
    }
  } else if (currency === 'diamonds') {
    if (beeState.diamonds >= priceDiamonds) {
      beeState.diamonds -= priceDiamonds;
      if (itemType === 'larva') beeState.larvae = (beeState.larvae || 0) + count;
      else if (itemType === 'pollen') beeState.pollen = (beeState.pollen || 0) + count;
      else if (itemType === 'smoker') beeState.smokers = (beeState.smokers || 0) + count;

      beeAudio.playTone(600, 'triangle', 0.1, 0.08);
      spawnBeeFloat(`+${count} ${itemType === 'larva' ? 'Queen Larva 🐝' : (itemType === 'pollen' ? 'Pollen Pot 🏺' : 'Smoker 💨')}!`, null, null, 'text-cyan-300');
      saveBeeStateDebounced();
      updateBeeFarmMiniStats();
    } else {
      spawnBeeFloat(`Need ${priceDiamonds} 💎 Diamonds!`, null, null, 'text-red-400');
    }
  }
};

let currentBeeAdReward = 'larva';
window.openBeeAdModal = function(rewardType = 'larva') {
  currentBeeAdReward = rewardType;
  const modal = document.getElementById('beeAdReelModal');
  const bar = document.getElementById('beeAdProgressBar');
  const btn = document.getElementById('beeAdClaimBtn');
  const timerBadge = document.getElementById('beeAdTimerBadge');
  const tag = document.getElementById('beeAdRewardTag');

  if (!modal) return;
  modal.classList.remove('hidden');

  if (tag) {
    tag.innerText = rewardType === 'larva' ? '1 Free Queen Larva 🐝' : '1 Free Pollen Pot 🏺';
  }
  if (bar) bar.style.width = '0%';
  if (btn) {
    btn.disabled = true;
    btn.innerText = 'Watching (5s)...';
    btn.className = "bg-stone-700 text-stone-500 font-bold text-[10px] px-3 py-1.5 rounded-lg cursor-not-allowed transition";
  }

  let timeLeft = 5;
  if (timerBadge) timerBadge.innerText = `⏳ 5s`;

  setTimeout(() => { if (bar) bar.style.width = '100%'; }, 50);

  const countdown = setInterval(() => {
    timeLeft--;
    if (timerBadge) timerBadge.innerText = `⏳ ${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(countdown);
      if (btn) {
        btn.disabled = false;
        btn.innerText = 'Claim Free Reward 🎉';
        btn.className = "bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition active:scale-95";
        btn.onclick = () => claimBeeAdReward();
      }
    }
  }, 1000);
};

window.claimBeeAdReward = function() {
  const modal = document.getElementById('beeAdReelModal');
  if (modal) modal.classList.add('hidden');

  if (currentBeeAdReward === 'larva') {
    beeState.larvae = (beeState.larvae || 0) + 1;
    spawnBeeFloat('🎉 Free Queen Larva 🐝 Claimed!', null, null, 'text-emerald-400');
  } else {
    beeState.pollen = (beeState.pollen || 0) + 1;
    spawnBeeFloat('🎉 Free Pollen Pot 🏺 Claimed!', null, null, 'text-rose-300');
  }

  beeAudio.playTone(700, 'triangle', 0.15, 0.1);
  saveBeeStateDebounced();
  updateBeeFarmMiniStats();
};

/* ==========================================================================
   RENDER 20 APIARY HIVES (FIXED 1*20 FORMAT)
   ========================================================================== */

function renderBeePlots() {
  const container = document.getElementById('beePlotsContainer');
  if (!container) return;

  const mult = beeState.upgradeMultiplier || 1;
  const honey = beeState.honey;
  const larvae = beeState.larvae || 0;
  const smokers = beeState.smokers || 0;

  container.innerHTML = '';

  beeState.plots.forEach((plot, idx) => {
    const tile = document.createElement('div');
    tile.id = `beePlotTile-${plot.id}`;

    // 1. LOCKED PLOT
    if (!plot.unlocked) {
      tile.className = "sf-plot-tile sf-rect-card locked";
      tile.innerHTML = `
        <div class="sf-card-header">
          <div class="flex items-center gap-1.5">
            <span class="text-stone-500 text-sm">🏞️</span>
            <span class="sf-card-title">Apiary Hive #${plot.id}</span>
          </div>
          <span class="sf-status-pill pill-locked">Locked 🔒</span>
        </div>
        <div class="sf-card-body flex items-center justify-between gap-3 py-2">
          <div class="sf-card-avatar locked-avatar">🪨</div>
          <div class="sf-card-details flex-1">
            <div class="text-xs font-black text-stone-700">Grove Terraforming Required</div>
            <div class="text-[10px] text-stone-500">Excavation fee: <strong class="text-cyan-700">${plot.unlockCost} 💎</strong></div>
          </div>
        </div>
        <button onclick="unlockBeePlot(${plot.id}, event)" class="sf-card-btn sf-btn-unlock">
          <span>🔓 Unlock Hive (${plot.unlockCost} 💎)</span>
        </button>
      `;
      container.appendChild(tile);
      return;
    }

    // 2. UNLOCKED: EMPTY HIVE
    if (plot.plantStatus === 'empty') {
      tile.className = "sf-plot-tile sf-rect-card empty";
      tile.innerHTML = `
        <div class="sf-card-header">
          <div class="flex items-center gap-1.5">
            <span class="text-amber-600 text-sm">🐝</span>
            <span class="sf-card-title">Apiary Hive #${plot.id}</span>
          </div>
          <span class="sf-status-pill pill-empty">Empty Box 🟫</span>
        </div>
        <div class="sf-card-body flex items-center justify-between gap-3 py-2">
          <div class="sf-card-avatar empty-avatar">🟫</div>
          <div class="sf-card-details flex-1">
            <div class="text-xs font-black text-amber-900">Wooden Hive Prepared</div>
            <div class="text-[10px] text-stone-600">Install a Queen Larva to start <strong>30s incubation</strong> &amp; begin at <strong>Level 1</strong>!</div>
          </div>
        </div>
        <div class="sf-card-actions">
          ${larvae > 0 ? `
            <button onclick="placeBeePlot(${plot.id}, event)" class="sf-card-btn sf-btn-plant">
              <span>🐝 Install Queen Larva (Owned: ${larvae}) &rarr; Start Lv. 1</span>
            </button>
          ` : `
            <button onclick="buyBeeItem('larva', 1, 'honey')" class="sf-card-btn sf-btn-buy-plant">
              <span>🛒 Buy Queen Larva (50 🍯 / 1 💎)</span>
            </button>
          `}
        </div>
      `;
      container.appendChild(tile);
      return;
    }

    // 3. UNLOCKED: 30s INCUBATION PHASE
    if (plot.plantStatus === 'growing') {
      const growthTime = Math.max(0, plot.growthTimer || 0);
      const progress = Math.max(0, Math.min(1, (30 - growthTime) / 30));
      tile.className = "sf-plot-tile sf-rect-card growing";
      tile.innerHTML = `
        <div class="sf-card-header">
          <div class="flex items-center gap-1.5">
            <span class="text-emerald-600 text-sm">🐝</span>
            <span class="sf-card-title">Apiary Hive #${plot.id}</span>
            <span class="sf-card-level-tag">Lv. 1 Larva</span>
          </div>
          <span class="sf-status-pill pill-growing animate-pulse">⏳ Incubation (${growthTime.toFixed(0)}s)</span>
        </div>
        <div class="sf-card-body flex items-center justify-between gap-3 py-1.5">
          <div class="sf-card-avatar growing-avatar text-3xl animate-bounce-gentle">🐛</div>
          <div class="sf-card-details flex-1 flex flex-col gap-1">
            <div class="flex justify-between items-center text-[10.5px]">
              <span class="font-black text-emerald-800">Incubating Queen Larva</span>
              <span class="font-mono font-bold text-emerald-700" id="beeGrowthTimer-${plot.id}">${growthTime.toFixed(1)}s / 30s</span>
            </div>
            <div class="sf-progress-bar-track">
              <div class="sf-progress-bar-fill emerald" id="beeGrowthBar-${plot.id}" style="width: ${(progress * 100).toFixed(1)}%"></div>
            </div>
            <div class="text-[9.5px] text-stone-500">Matures in 30s &bull; Starts with 60s colony lifetime!</div>
          </div>
        </div>
        <div class="sf-card-actions">
          <button class="sf-card-btn sf-btn-disabled" disabled>
            <span>⏳ Hatching Queen Colony (30s Phase)...</span>
          </button>
        </div>
      `;
      container.appendChild(tile);
      return;
    }

    // 4. UNLOCKED: DEAD / DORMANT HIVE
    if (plot.plantStatus === 'dead') {
      tile.className = "sf-plot-tile sf-rect-card dead";
      tile.innerHTML = `
        <div class="sf-card-header">
          <div class="flex items-center gap-1.5">
            <span class="text-stone-500 text-sm">🕸️</span>
            <span class="sf-card-title">Apiary Hive #${plot.id}</span>
          </div>
          <span class="sf-status-pill pill-dead">🕸️ Dormant (Expired)</span>
        </div>
        <div class="sf-card-body flex items-center justify-between gap-3 py-1.5">
          <div class="sf-card-avatar dead-avatar text-3xl">🕸️</div>
          <div class="sf-card-details flex-1">
            <div class="text-xs font-black text-rose-900">Colony Life Expired</div>
            <div class="text-[10px] text-stone-600">Clear with Smoker 💨 to free plot, buy a new Queen Larva, and restart at <strong>Level 1</strong>!</div>
          </div>
        </div>
        <div class="sf-card-actions">
          <button onclick="smokeBeePlot(${plot.id}, event)" class="sf-card-btn sf-btn-shovel">
            <span>💨 Clear with Smoker (Owned: ${smokers})</span>
          </button>
        </div>
      `;
      container.appendChild(tile);
      return;
    }

    // 5. UNLOCKED: ALIVE & PRODUCING HIVE
    const cycleTime = getBeePlotCycleTime(idx, plot.level);
    const honeyPerCycle = getBeePlotHoneyPerCycle(idx, plot.level);
    const upInfo = getBeeMultiUpgradeInfo(idx, plot.level, mult, honey);
    const canAfford = honey >= upInfo.totalCost && plot.level < 5000;
    const maxCap = getBeePlotMaxLifeLimit(plot.level);
    const lifeProgress = Math.max(0, Math.min(1, (plot.lifeTimer || 0) / maxCap));

    let spriteEmoji = '🐝';
    if (plot.level > 1000) spriteEmoji = '🍯🐝';
    if (plot.level > 2500) spriteEmoji = '✨🐝';

    tile.className = "sf-plot-tile sf-rect-card alive";
    tile.innerHTML = `
      <div class="sf-card-header">
        <div class="flex items-center gap-1.5">
          <span class="text-amber-500 text-sm">🐝</span>
          <span class="sf-card-title">Apiary Hive #${plot.id}</span>
          <span class="sf-card-level-tag" id="beePlotLvBadge-${plot.id}">Lv. ${plot.level}/5000</span>
        </div>
        <span class="sf-status-pill pill-alive">🐝 Active &bull; Cap: ${maxCap}s</span>
      </div>

      <div class="sf-card-body flex items-center justify-between gap-3 py-1.5">
        <div class="sf-card-avatar alive-avatar text-3xl animate-buzz-float">${spriteEmoji}</div>
        <div class="sf-card-details flex-1 flex flex-col gap-1">
          <div class="flex justify-between items-center text-[11px]">
            <span class="font-black text-amber-900" id="beePlotOut-${plot.id}">+${formatBeeNumber(honeyPerCycle)} 🍯 Honey</span>
            <span class="font-mono text-cyan-700 font-bold text-[10px]" id="beePlotTime-${plot.id}">⏱️ ${formatBeeTimerText(plot.timer, cycleTime)}</span>
          </div>

          <!-- Life Timer Gauge with Max Limit Cap -->
          <div class="flex justify-between items-center text-[10px] text-stone-700 mt-0.5">
            <span class="font-bold flex items-center gap-1">
              <span>⏳ Life:</span>
              <span class="font-mono text-amber-800 font-extrabold" id="beeLifeTimer-${plot.id}">${(plot.lifeTimer || 0).toFixed(1)}s</span>
            </span>
            <span class="text-[9.5px] font-mono text-stone-500">Max Cap: <strong class="text-amber-800" id="beeCapLabel-${plot.id}">${maxCap}s</strong></span>
          </div>

          <div class="sf-progress-bar-track">
            <div class="sf-progress-bar-fill amber" id="beeLifeBar-${plot.id}" style="width: ${(lifeProgress * 100).toFixed(1)}%"></div>
          </div>
        </div>
      </div>

      <!-- Dual Action Buttons: Nourish (+10s) & Upgrade Level (+5s Cap, +Honey) -->
      <div class="sf-card-dual-actions grid grid-cols-2 gap-1.5 pt-1">
        <button onclick="nourishBeePlot(${plot.id}, event)" class="sf-card-btn sf-btn-water" title="Nourish with Pollen Pot to add +10s lifetime">
          <span>🏺 Nourish (+10s)</span>
        </button>
        <button onclick="upgradeBeePlot(${plot.id}, event)" id="beePlotUpBtn-${plot.id}" class="sf-card-btn sf-btn-upgrade ${plot.level >= 5000 ? 'disabled' : (!canAfford ? 'disabled' : '')}">
          <span>${plot.level >= 5000 ? '★ MAX' : `▲ Lv.${upInfo.targetLevel} (+5s Cap)`}</span>
        </button>
      </div>
    `;

    container.appendChild(tile);
  });

  const summary = document.getElementById('beePlotsSummaryLabel');
  if (summary) {
    const unlockedCount = beeState.plots.filter(p => p.unlocked).length;
    summary.innerText = `${unlockedCount} of 20 Hives Unlocked`;
  }
}

/* ==========================================================================
   RENDER 20 FLOWER COLLECTING MEADOWS (FIXED 1*20 FORMAT)
   ========================================================================== */

function renderBeeFlowers() {
  const container = document.getElementById('beeFlowersContainer');
  if (!container) return;

  container.innerHTML = '';

  let totalReady = 0;

  beeState.flowers.forEach((flower, idx) => {
    if (flower.unlocked && flower.pollenReady > 0) totalReady += flower.pollenReady;

    const tile = document.createElement('div');
    tile.id = `beeFlowerCard-${flower.id}`;

    // 1. LOCKED MEADOW
    if (!flower.unlocked) {
      tile.className = "sf-well-card sf-rect-card locked";
      tile.innerHTML = `
        <div class="sf-card-header">
          <div class="flex items-center gap-1.5">
            <span class="text-stone-500 text-sm">🔒</span>
            <span class="sf-card-title">Meadow #${flower.id}: ${flower.name}</span>
          </div>
          <span class="sf-status-pill pill-locked">Locked 🔒</span>
        </div>
        <div class="sf-card-body flex items-center justify-between gap-3 py-2">
          <div class="sf-card-avatar locked-avatar text-2xl">🌱</div>
          <div class="sf-card-details flex-1">
            <div class="text-xs font-black text-stone-700">Floral Meadow Overgrown</div>
            <div class="text-[10px] text-stone-500">Excavation fee: <strong class="text-cyan-700 font-mono">${flower.unlockCost} 💎</strong></div>
          </div>
        </div>
        <button onclick="unlockBeeFlower(${flower.id}, event)" class="sf-card-btn sf-btn-unlock">
          <span>🔓 Unlock Flower Meadow (${flower.unlockCost} 💎)</span>
        </button>
      `;
      container.appendChild(tile);
      return;
    }

    // 2. UNLOCKED MEADOW
    const progress = Math.max(0, Math.min(1, (5.0 - (flower.productionTimer || 0)) / 5.0));
    const isReady = flower.pollenReady > 0;

    tile.className = "sf-well-card sf-rect-card alive";
    tile.innerHTML = `
      <div class="sf-card-header">
        <div class="flex items-center gap-1.5">
          <span class="text-rose-400 text-sm">🌸</span>
          <span class="sf-card-title">Meadow #${flower.id}: ${flower.name}</span>
        </div>
        <div class="flex items-center gap-1">
          ${flower.hasWorker ? '<span class="text-[9.5px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-700 font-bold">👩‍🌾 Forager Active</span>' : ''}
          <span class="sf-status-pill ${isReady ? 'pill-alive animate-pulse' : 'pill-empty'}">
            ${isReady ? '🏺 Ready to Harvest!' : '🌸 Blooming (5s)'}
          </span>
        </div>
      </div>

      <div class="sf-card-body flex items-center justify-between gap-3 py-1.5">
        <div class="sf-card-avatar text-3xl animate-bounce-gentle">🌸</div>
        <div class="sf-card-details flex-1 flex flex-col gap-1">
          <div class="flex justify-between items-center text-[10.5px]">
            <span class="font-black text-rose-300">Nectar Extraction Cycle</span>
            <span class="font-mono text-cyan-300 font-bold" id="beeFlowerTimer-${flower.id}">
              ${isReady ? 'Ready!' : `${(flower.productionTimer || 0).toFixed(1)}s / 5s`}
            </span>
          </div>

          <div class="sf-progress-bar-track">
            <div class="sf-progress-bar-fill rose" id="beeFlowerBar-${flower.id}" style="width: ${(progress * 100).toFixed(1)}%"></div>
          </div>

          <div class="flex justify-between items-center text-[9.5px] text-stone-400">
            <span>Produces: <strong class="text-rose-300 font-mono">1 Pollen Pot 🏺 / 5s</strong></span>
            <span>Stored in Bloom: <strong class="text-rose-300 font-mono">${flower.pollenReady} 🏺</strong></span>
          </div>
        </div>
      </div>

      <div class="sf-card-actions pt-1">
        <button onclick="collectFlowerPollen(${flower.id}, event)" class="sf-card-btn sf-btn-water ${isReady ? '' : 'disabled'}" ${isReady ? '' : 'disabled'}>
          <span>🏺 Harvest Pollen Pot (${flower.pollenReady} Ready)</span>
        </button>
      </div>
    `;

    container.appendChild(tile);
  });

  const allBadge = document.getElementById('beeCollectAllBadge');
  if (allBadge) allBadge.innerText = `${totalReady} 🏺`;

  const summary = document.getElementById('beeFlowersSummaryLabel');
  if (summary) {
    const count = beeState.flowers.filter(f => f.unlocked).length;
    summary.innerText = `${count} of 20 Meadows Unlocked`;
  }
}

/* ==========================================================================
   RENDER WORKER ASSIGNMENTS BOARD (PAGE 4)
   ========================================================================== */

function renderBeeWorkerAssignments() {
  const container = document.getElementById('beeWorkerAssignmentGrid');
  if (!container) return;

  container.innerHTML = '';

  const idleCount = getIdleBeeFlowerWorkersCount();

  beeState.flowers.forEach(flower => {
    const card = document.createElement('div');
    card.className = "bg-stone-800/80 rounded-xl p-2.5 border border-stone-700 flex flex-col justify-between gap-2 shadow";

    if (!flower.unlocked) {
      card.innerHTML = `
        <div class="flex items-center justify-between text-[11px]">
          <span class="font-bold text-stone-500">Meadow #${flower.id}</span>
          <span class="text-[9px] text-stone-600">Locked 🔒</span>
        </div>
        <div class="text-[10px] text-stone-500">${flower.name}</div>
        <button disabled class="w-full bg-stone-900 text-stone-600 text-[10px] py-1 rounded-lg cursor-not-allowed">
          Locked
        </button>
      `;
    } else if (flower.hasWorker) {
      card.innerHTML = `
        <div class="flex items-center justify-between text-[11px]">
          <span class="font-bold text-rose-300">Meadow #${flower.id}</span>
          <span class="text-[9px] bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-700 font-bold">Auto-Gathering</span>
        </div>
        <div class="text-[10px] text-stone-300 truncate">${flower.name}</div>
        <button onclick="recallBeeFlowerWorker(${flower.id})" class="w-full bg-rose-700 hover:bg-rose-600 text-white font-bold text-[10px] py-1 rounded-lg transition shadow">
          Recall Worker ↩️
        </button>
      `;
    } else {
      card.innerHTML = `
        <div class="flex items-center justify-between text-[11px]">
          <span class="font-bold text-rose-300">Meadow #${flower.id}</span>
          <span class="text-[9px] bg-stone-700 text-stone-400 px-1.5 py-0.2 rounded font-bold">Unassigned</span>
        </div>
        <div class="text-[10px] text-stone-300 truncate">${flower.name}</div>
        <button onclick="assignBeeFlowerWorker(${flower.id})" class="w-full ${idleCount > 0 ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-stone-700 text-stone-500 cursor-not-allowed'} font-bold text-[10px] py-1 rounded-lg transition shadow" ${idleCount > 0 ? '' : 'disabled'}>
          Assign Worker ➕
        </button>
      `;
    }

    container.appendChild(card);
  });
}

/* ==========================================================================
   MINI STATS & HEADER UPDATER
   ========================================================================== */

function updateBeeFarmMiniStats() {
  const hCount = document.getElementById('beeHoneyCount');
  if (hCount) hCount.innerText = formatBeeNumber(beeState.honey);

  const lCount = document.getElementById('beeLarvaeCount');
  if (lCount) lCount.innerText = beeState.larvae || 0;

  const pCount = document.getElementById('beePollenCount');
  if (pCount) pCount.innerText = beeState.pollen || 0;

  const sCount = document.getElementById('beeSmokerCount');
  if (sCount) sCount.innerText = beeState.smokers || 0;

  const dCount = document.getElementById('beeDiamondCount');
  if (dCount) dCount.innerText = beeState.diamonds || 0;

  const eCount = document.getElementById('beeEnergyCount');
  if (eCount) eCount.innerText = Math.floor(beeState.energy || 0);

  // Shop Counts
  const sDiamond = document.getElementById('beeShopDiamondCount');
  if (sDiamond) sDiamond.innerText = beeState.diamonds || 0;

  const sLarvae = document.getElementById('beeShopLarvaeOwned');
  if (sLarvae) sLarvae.innerText = `${beeState.larvae || 0} 🐝`;

  const sPollen = document.getElementById('beeShopPollenOwned');
  if (sPollen) sPollen.innerText = `${beeState.pollen || 0} 🏺`;

  const sSmoker = document.getElementById('beeShopSmokersOwned');
  if (sSmoker) sSmoker.innerText = `${beeState.smokers || 0} 💨`;

  // Top Nav Tab Counts
  const lTabCount = document.getElementById('beeLandCount');
  if (lTabCount) {
    const uCount = beeState.plots.filter(p => p.unlocked).length;
    lTabCount.innerText = uCount;
  }

  const fTabCount = document.getElementById('beeFlowerCount');
  if (fTabCount) {
    const uCount = beeState.flowers.filter(f => f.unlocked).length;
    fTabCount.innerText = uCount;
  }

  // Worker Counters
  const totW = document.getElementById('beeTotalWorkersCount');
  if (totW) totW.innerText = beeState.flowerWorkersCount || 0;

  const asgW = document.getElementById('beeAssignedWorkersCount');
  if (asgW) asgW.innerText = getAssignedBeeFlowerWorkersCount();

  const idlW = document.getElementById('beeIdleWorkersCount');
  if (idlW) idlW.innerText = getIdleBeeFlowerWorkersCount();

  // Refinery Counters
  const refH = document.getElementById('beeRefineryHoneyDisplay');
  if (refH) refH.innerText = `${formatBeeNumber(beeState.honey)} 🍯`;

  const batches = Math.floor(beeState.honey / 100);
  const refB = document.getElementById('beeRefineryBatchesDisplay');
  if (refB) refB.innerText = `${batches} Batches (${batches * 29} ⚡)`;

  const refE = document.getElementById('beeRefineryEnergyDisplay');
  if (refE) refE.innerText = `${Math.floor(beeState.energy || 0)} ⚡`;

  // Compute Total Honey Output Rate
  let totalHoneyRate = 0;
  beeState.plots.forEach((p, idx) => {
    if (p.unlocked && p.plantStatus === 'alive') {
      const cycle = getBeePlotCycleTime(idx, p.level);
      const out = getBeePlotHoneyPerCycle(idx, p.level);
      totalHoneyRate += (out / cycle);
    }
  });

  const rateEl = document.getElementById('beeTotalIncomeRate');
  if (rateEl) rateEl.innerText = formatBeeNumber(totalHoneyRate);
}

/* ==========================================================================
   MAIN GAME LOOP
   ========================================================================== */

let beeLastTime = performance.now();
function beeMainLoop(now) {
  const deltaSec = Math.min(1.0, (now - beeLastTime) / 1000);
  beeLastTime = now;

  const isBeeActive = (typeof gameState !== 'undefined' && (gameState.currentTab === 'bee-farm' || gameState.currentTab === 'beefarm')) ||
                      (document.getElementById('pageBeeFarm') && document.getElementById('pageBeeFarm').classList.contains('active'));

  // 1. Tick 20 Hive Plots
  beeState.plots.forEach((plot, idx) => {
    if (!plot.unlocked) return;

    // A. 30s Incubation
    if (plot.plantStatus === 'growing') {
      plot.growthTimer = Math.max(0, (plot.growthTimer || 30.0) - deltaSec);
      if (plot.growthTimer <= 0) {
        plot.plantStatus = 'alive';
        plot.level = 1;
        plot.lifeTimer = 60.0;
        plot.maxLifeLimit = 60.0;
        plot.timer = getBeePlotCycleTime(idx, 1);
        if (isBeeActive && beeState.currentPage === 1) renderBeePlots();
      }
    }

    // B. Active Producing Hives
    if (plot.plantStatus === 'alive') {
      plot.lifeTimer = Math.max(0, (plot.lifeTimer || 0) - deltaSec);
      if (plot.lifeTimer <= 0) {
        plot.plantStatus = 'dead';
        plot.isWithered = true;
        if (isBeeActive && beeState.currentPage === 1) renderBeePlots();
        return;
      }

      // Production Timer
      const cycleTime = getBeePlotCycleTime(idx, plot.level);
      plot.timer = (plot.timer || cycleTime) - deltaSec;
      if (plot.timer <= 0) {
        const honeyGained = getBeePlotHoneyPerCycle(idx, plot.level);
        beeState.honey += honeyGained;
        plot.timer = cycleTime;
      }
    }
  });

  // 2. Tick 20 Flower Collecting Meadows (5s bloom cycle)
  beeState.flowers.forEach(flower => {
    if (!flower.unlocked) return;

    if (flower.pollenReady < 1) {
      flower.productionTimer = Math.max(0, (flower.productionTimer || 5.0) - deltaSec);
      if (flower.productionTimer <= 0) {
        flower.pollenReady = 1;
        flower.productionTimer = 5.0;

        // Auto-Harvest by assigned Flower Forager Worker!
        if (flower.hasWorker) {
          beeState.pollen = (beeState.pollen || 0) + 1;
          flower.pollenReady = 0;
          if (isBeeActive && Math.random() < 0.2) {
            spawnBeeFloat('👩‍🌾 +1 Pollen Pot 🏺 (Auto-Harvested)!', null, null, 'text-rose-300');
          }
        }
      }
    }
  });

  // 3. Real-time UI updates
  if (isBeeActive) {
    updateBeeFarmMiniStats();

    // Fast-updating plots UI on page 1
    if (beeState.currentPage === 1) {
      beeState.plots.forEach((p, idx) => {
        if (!p.unlocked) return;
        if (p.plantStatus === 'growing') {
          const t = document.getElementById(`beeGrowthTimer-${p.id}`);
          if (t) t.innerText = `${(p.growthTimer || 0).toFixed(1)}s / 30s`;
          const b = document.getElementById(`beeGrowthBar-${p.id}`);
          if (b) b.style.width = `${Math.min(100, Math.max(0, ((30 - (p.growthTimer || 0)) / 30) * 100)).toFixed(1)}%`;
        } else if (p.plantStatus === 'alive') {
          const cycleTime = getBeePlotCycleTime(idx, p.level);
          const t = document.getElementById(`beePlotTime-${p.id}`);
          if (t) t.innerText = `⏱️ ${formatBeeTimerText(p.timer, cycleTime)}`;
          const lt = document.getElementById(`beeLifeTimer-${p.id}`);
          if (lt) lt.innerText = `${(p.lifeTimer || 0).toFixed(1)}s`;
          const maxCap = getBeePlotMaxLifeLimit(p.level);
          const lb = document.getElementById(`beeLifeBar-${p.id}`);
          if (lb) lb.style.width = `${Math.min(100, Math.max(0, ((p.lifeTimer || 0) / maxCap) * 100)).toFixed(1)}%`;
        }
      });
    }

    // Fast-updating flower meadows on page 2
    if (beeState.currentPage === 2) {
      beeState.flowers.forEach(f => {
        if (!f.unlocked) return;
        const ft = document.getElementById(`beeFlowerTimer-${f.id}`);
        if (ft) ft.innerText = f.pollenReady > 0 ? 'Ready!' : `${(f.productionTimer || 0).toFixed(1)}s / 5s`;
        const fb = document.getElementById(`beeFlowerBar-${f.id}`);
        if (fb) fb.style.width = `${Math.min(100, Math.max(0, ((5.0 - (f.productionTimer || 0)) / 5.0) * 100)).toFixed(1)}%`;
      });
    }
  }

  requestAnimationFrame(beeMainLoop);
}

/* ==========================================================================
   FORMATTERS & HELPERS
   ========================================================================== */

const BEE_NUM_SUFFIXES = [
  '', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No',
  'Dc', 'Ud', 'Dd', 'Td', 'Qad', 'Qid', 'Sxd', 'Spd', 'Ocd', 'Nod', 'Vg'
];

function formatBeeNumber(num) {
  if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) return '0';
  if (Math.abs(num) < 1000) return Math.floor(num).toLocaleString();
  const tier = Math.min(BEE_NUM_SUFFIXES.length - 1, Math.floor(Math.log10(Math.abs(num)) / 3));
  if (tier <= 0) return Math.floor(num).toLocaleString();
  const scale = Math.pow(10, tier * 3);
  const scaled = num / scale;
  return scaled.toFixed(scaled < 10 ? 2 : 1) + BEE_NUM_SUFFIXES[tier];
}

function formatBeeTimerText(seconds, cycleTime) {
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
   INITIALIZATION
   ========================================================================== */

function initBeeFarmTycoonGame() {
  const guideBtn = document.getElementById('beeGuideBtn');
  const rulesModal = document.getElementById('beeRulesModal');
  const closeRules1 = document.getElementById('beeCloseRulesBtn');
  const closeRules2 = document.getElementById('beeCloseRulesBtn2');

  if (guideBtn && rulesModal) {
    guideBtn.onclick = () => rulesModal.classList.remove('hidden');
  }
  if (closeRules1 && rulesModal) {
    closeRules1.onclick = () => rulesModal.classList.add('hidden');
  }
  if (closeRules2 && rulesModal) {
    closeRules2.onclick = () => rulesModal.classList.add('hidden');
  }

  // Initialize circular multiplier toggle
  const mult = beeState.upgradeMultiplier || 1;
  const displayVal = mult === 'max' ? 'MAX' : `${mult}x`;
  document.querySelectorAll('.bee-mult-circle-val').forEach(el => {
    el.innerText = displayVal;
  });
  document.querySelectorAll('.bee-mult-circle-toggle-btn').forEach(btn => {
    btn.setAttribute('data-mult', String(mult));
  });

  renderBeePlots();
  renderBeeFlowers();
  renderBeeWorkerAssignments();
  updateBeeFarmMiniStats();

  requestAnimationFrame(beeMainLoop);
}

// Global Exports
window.initBeeFarmTycoonGame = initBeeFarmTycoonGame;
window.renderBeePlots = renderBeePlots;
window.renderBeeFlowers = renderBeeFlowers;
window.updateBeeFarmUI = updateBeeFarmMiniStats;
window.updateBeeFarmMiniStats = updateBeeFarmMiniStats;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBeeFarmTycoonGame);
} else {
  initBeeFarmTycoonGame();
}
