/* ==========================================================================
   HONEY BEE FARM TYCOON ENGINE (pages/bee-farm/bee-farm.js)
   20 Hives, Maya Nectar Wall, 100 🍯 -> 29 ⚡ Royal Jelly Converter
   ========================================================================== */

const BEE_STORAGE_KEY = 'beefarm_tycoon_state_v1';

const BEE_LAND_UNLOCK_COSTS = [
  0,      // Land 1: Free
  10,     // Land 2: 10 💎
  100,    // Land 3: 100 💎
  250,    // Land 4
  450,    // Land 5
  750,    // Land 6
  1200,   // Land 7
  1800,   // Land 8
  2600,   // Land 9
  3600,   // Land 10
  5000,   // Land 11
  7000,   // Land 12
  9500,   // Land 13
  12500,  // Land 14
  16500,  // Land 15
  21500,  // Land 16
  28000,  // Land 17
  36000,  // Land 18
  46000,  // Land 19
  60000   // Land 20
];

function createDefaultBeePlots() {
  const plots = [];
  for (let i = 1; i <= 20; i++) {
    const isUnlocked = i === 1;
    plots.push({
      id: i,
      unlocked: isUnlocked,
      unlockCost: BEE_LAND_UNLOCK_COSTS[i - 1],
      stage: isUnlocked ? 2 : 0, // 0: Empty, 1: Larva Incubation, 2: Active Hive (+2 🍯/s), 3: Dormant/Abandoned
      growthProgress: isUnlocked ? 100 : 0,
      lifeTimer: isUnlocked ? 55 : 0,
      maxLifeTimer: 60
    });
  }
  return plots;
}

function loadInitialBeeFarmState() {
  try {
    const raw = localStorage.getItem(BEE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.plots) && parsed.plots.length === 20) {
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
    pollen: 2,
    smokers: 1,
    larvaDiamondCost: 1,
    wall: {
      pollenInCrate: 0,
      maxCrateCapacity: 5,
      baseFillSeconds: 4.0,
      currentProgress: 0,
      boostTimerRemaining: 0
    },
    plots: createDefaultBeePlots()
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
    if (this.muted) return;
    this.init(); this.resume();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch (e) {}
  },
  playPollenSplash() {
    if (this.muted) return;
    this.init(); this.resume();
    if (!this.ctx) return;
    try {
      const bufferSize = this.ctx.sampleRate * 0.14;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(950, this.ctx.currentTime);
      filter.Q.setValueAtTime(3.0, this.ctx.currentTime);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start();
    } catch (e) {}
  },
  playSmoke() {
    if (this.muted) return;
    this.init(); this.resume();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(90, this.ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {}
  },
  playUnlockChime() {
    if (this.muted) return;
    this.init(); this.resume();
    if (!this.ctx) return;
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, idx) => {
      setTimeout(() => this.playTone(f, 'sine', 0.2, 0.1), idx * 60);
    });
  },
  playRefineryChime() {
    if (this.muted) return;
    this.init(); this.resume();
    if (!this.ctx) return;
    [587.33, 739.99, 880.0, 1174.66].forEach((f, idx) => {
      setTimeout(() => this.playTone(f, 'triangle', 0.2, 0.09), idx * 65);
    });
  }
};

function spawnBeeFloat(text, x, y, color = 'text-amber-600') {
  const el = document.createElement('div');
  el.className = `floating-honey-particle ${color} text-xs sm:text-sm select-none font-bold`;
  el.innerHTML = text;
  el.style.left = `${x || window.innerWidth / 2}px`;
  el.style.top = `${y || window.innerHeight / 2}px`;
  document.body.appendChild(el);
  setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, 1200);
}

const beePageBadges = {
  1: "Page 1: Apiary Groves 🐝",
  2: "Page 2: Nectar Wall 🌸🧱",
  3: "Page 3: Refinery & Shop ⚡💎"
};

window.navigateBeePage = function(pageNum) {
  beeState.currentPage = pageNum;
  beeAudio.playTone(480, 'triangle', 0.08, 0.05);

  for (let i = 1; i <= 3; i++) {
    const pageEl = document.getElementById(`beePage${i}`);
    if (pageEl) {
      if (i === pageNum) pageEl.classList.add('active-page');
      else pageEl.classList.remove('active-page');
    }

    const tabEl = document.getElementById(`beeTab${i}`);
    if (tabEl) {
      if (i === pageNum) tabEl.classList.add('active-tab');
      else tabEl.classList.remove('active-tab');
    }
  }

  const badgeEl = document.getElementById('beeActivePageBadge');
  if (badgeEl) badgeEl.innerText = beePageBadges[pageNum] || `Page ${pageNum}`;

  // Dynamically pan panoramic scenic artwork based on active tab
  const stageArtwork = document.getElementById('beeStageArtwork');
  if (stageArtwork) {
    if (pageNum === 1) stageArtwork.style.backgroundPosition = 'right 25%';
    else if (pageNum === 2) stageArtwork.style.backgroundPosition = 'left 15%';
    else if (pageNum === 3) stageArtwork.style.backgroundPosition = 'right 5%';
    else if (pageNum === 4) stageArtwork.style.backgroundPosition = 'center top';
  }

  const viewContainer = document.getElementById('pageBeeFarm');
  if (viewContainer) {
    viewContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

function getEmptyUnlockedBeePlot() {
  return beeState.plots.find(p => p.unlocked && p.stage === 0);
}

// 100 Honey Drops -> 29 Royal Jelly Energy Conversion
window.executeHoneyToEnergy = function(batches = 1, event = null) {
  const cost = batches * 100;
  const energyGain = batches * 29;

  if (beeState.honey >= cost) {
    beeState.honey -= cost;
    beeState.energy += energyGain;

    // Direct Synergy: Also recharges player's main reactor energy!
    if (typeof gameState !== 'undefined' && gameState.reactor) {
      const maxE = gameState.reactor.maxEnergy || 1000;
      gameState.reactor.currentEnergy = Math.min(maxE, (gameState.reactor.currentEnergy || 0) + energyGain);
      if (typeof updateEnergyUI === 'function') updateEnergyUI();
    }

    beeAudio.playRefineryChime();
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnBeeFloat(`-${cost}🍯 &rarr; +${energyGain}⚡ Royal Jelly!`, posX, posY, 'text-yellow-600');
    saveBeeStateDebounced();
    renderBeeFarmTycoon();
  } else {
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnBeeFloat('Need at least 100 Honey Drops (🍯)!', posX, posY, 'text-red-500');
  }
};

window.unlockBeePlot = function(plotId, event = null) {
  const plot = beeState.plots.find(p => p.id === plotId);
  if (!plot || plot.unlocked) return;

  const cost = plot.unlockCost;
  if (beeState.diamonds >= cost) {
    beeState.diamonds -= cost;
    plot.unlocked = true;
    plot.stage = 0; // Empty and ready
    plot.growthProgress = 0;
    plot.lifeTimer = 0;

    beeAudio.playUnlockChime();
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnBeeFloat(`🎉 Land #${plot.id} Unlocked (-${cost} 💎)!`, posX, posY, 'text-emerald-600');
    saveBeeStateDebounced();
    updateBeeFarmMiniStats();
    renderBeeFarmTycoon();
  } else {
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnBeeFloat(`Need ${cost} 💎 to unlock Land #${plot.id}!`, posX, posY, 'text-red-500');
  }
};

window.feedBeePlot = function(plotId, event = null) {
  const plot = beeState.plots.find(p => p.id === plotId);
  if (!plot || !plot.unlocked) return;

  if (beeState.pollen <= 0) {
    if (event) spawnBeeFloat('No Pollen Pots! Visit Page 2 Nectar Wall 🌸', event.clientX, event.clientY, 'text-red-500');
    return;
  }

  if (plot.stage === 2) {
    beeState.pollen -= 1;
    plot.lifeTimer = Math.min(120, plot.lifeTimer + 35);
    plot.maxLifeTimer = Math.max(plot.maxLifeTimer, plot.lifeTimer);
    beeAudio.playPollenSplash();
    if (event) spawnBeeFloat('+35s Honey Life Added! 🏺', event.clientX, event.clientY, 'text-rose-600');
    saveBeeStateDebounced();
    updateBeeFarmMiniStats();
    renderBeeFarmTycoon();
  } else if (plot.stage === 1) {
    beeState.pollen -= 1;
    plot.growthProgress = Math.min(100, plot.growthProgress + 35);
    beeAudio.playPollenSplash();
    if (event) spawnBeeFloat('Brood Accelerated! 🏺', event.clientX, event.clientY, 'text-rose-600');
    saveBeeStateDebounced();
    updateBeeFarmMiniStats();
    renderBeeFarmTycoon();
  }
};

window.smokeBeePlot = function(plotId, event = null) {
  const plot = beeState.plots.find(p => p.id === plotId);
  if (!plot || !plot.unlocked || plot.stage !== 3) return;

  if (beeState.smokers > 0) {
    beeState.smokers -= 1;
    plot.stage = 0;
    plot.growthProgress = 0;
    plot.lifeTimer = 0;
    beeAudio.playSmoke();
    if (event) spawnBeeFloat(`Dormant Hive Cleared from Land #${plot.id}! Plot Ready 🐝`, event.clientX, event.clientY, 'text-amber-800');
    saveBeeStateDebounced();
    renderBeeFarmTycoon();
  } else {
    if (event) spawnBeeFloat('Need 💨 Smoker! Buy on Page 3 or Watch Ad', event.clientX, event.clientY, 'text-red-500');
  }
};

window.handleBeePlotAction = function(plotId, event) {
  const plot = beeState.plots.find(p => p.id === plotId);
  if (!plot) return;

  if (!plot.unlocked) {
    unlockBeePlot(plotId, event);
  } else if (plot.stage === 0) {
    const buyBtn = document.getElementById('beeBuyLarvaDiamondBtn');
    if (buyBtn) buyBtn.click();
  } else if (plot.stage === 1 || plot.stage === 2) {
    feedBeePlot(plotId, event);
  } else if (plot.stage === 3) {
    smokeBeePlot(plotId, event);
  }
};

function renderBeePlots() {
  const container = document.getElementById('beePlotsContainer');
  if (!container) return;
  container.innerHTML = '';

  beeState.plots.forEach(plot => {
    const card = document.createElement('div');
    card.id = `bee-plot-card-${plot.id}`;

    if (!plot.unlocked) {
      card.className = "bee-locked-bed rounded-xl p-2.5 flex flex-col items-center justify-between min-h-[150px] relative text-white border border-slate-700/80 shadow-md";
      card.innerHTML = `
        <div class="w-full flex items-center justify-between text-[9.5px]">
          <span class="text-slate-400 font-bold">Land #${plot.id}</span>
          <span class="bg-red-950/80 text-red-300 font-bold px-1.5 py-0.2 rounded-full border border-red-800">Locked 🔒</span>
        </div>
        <div class="my-1 text-center">
          <div class="text-2xl sm:text-3xl filter grayscale opacity-75">🪵</div>
          <div class="text-[10px] font-black text-amber-300 mt-1">${plot.unlockCost} 💎</div>
        </div>
        <button onclick="unlockBeePlot(${plot.id}, event)" class="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-stone-900 font-black text-[9.5px] py-1.5 rounded-lg shadow active:scale-95 transition flex items-center justify-center gap-1">
          <span>Unlock 🔓</span>
        </button>
      `;
    } else {
      card.className = "bee-hive-bed rounded-xl p-2.5 flex flex-col items-center justify-between min-h-[150px] relative text-white transition-all border border-amber-900/40 shadow";

      let emoji = '';
      let badge = '';
      let actionBtn = '';
      let progressHtml = '';

      if (plot.stage === 0) {
        emoji = '<span class="text-2xl sm:text-3xl opacity-30 select-none">🍯</span>';
        badge = '<span class="text-[8.5px] bg-stone-800/80 text-stone-300 px-1.5 py-0.2 rounded-full font-mono">Empty Hive</span>';
        actionBtn = `
          <button onclick="document.getElementById('beeBuyLarvaDiamondBtn').click()" class="bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-[9.5px] px-2.5 py-1 rounded-lg shadow active:scale-95 transition">
            Place Larva 🐝
          </button>
        `;
        progressHtml = '<div class="h-2"></div>';
      } else if (plot.stage === 1) {
        emoji = '<span class="text-3xl animate-bounce select-none filter drop-shadow">🥚</span>';
        badge = '<span class="text-[8.5px] bg-amber-900/90 text-amber-200 px-1.5 py-0.2 rounded-full font-mono">Incubating</span>';
        actionBtn = `
          <button onclick="feedBeePlot(${plot.id}, event)" class="bg-rose-600 hover:bg-rose-500 text-white font-bold text-[9.5px] px-2 py-1 rounded-lg shadow active:scale-95 transition">
            🏺 Pour Pollen
          </button>
        `;
        progressHtml = `
          <div class="w-full">
            <div class="flex justify-between text-[8.5px] text-amber-200 mb-0.5 font-bold">
              <span id="bee-timer-${plot.id}">🐝 Brood ${Math.floor(plot.growthProgress)}%</span>
            </div>
            <div class="w-full bg-black/50 rounded-full h-1.5 overflow-hidden">
              <div id="bee-bar-${plot.id}" class="bg-amber-400 h-full transition-all" style="width: ${plot.growthProgress}%"></div>
            </div>
          </div>
        `;
      } else if (plot.stage === 2) {
        emoji = '<span class="text-3xl sm:text-4xl filter drop-shadow hover:scale-105 transition-transform animate-buzz-float select-none">🐝🍯</span>';
        badge = '<span class="text-[8.5px] bg-amber-400 text-amber-950 font-black px-1.5 py-0.2 rounded-full shadow-sm">+2🍯/s</span>';
        actionBtn = `
          <div class="flex items-center gap-1">
            <button onclick="feedBeePlot(${plot.id}, event)" class="bg-rose-600 hover:bg-rose-500 text-white font-black text-[9px] px-2 py-1 rounded-lg shadow active:scale-95 transition" title="Add +35s life">
              🏺 +35s
            </button>
            <button onclick="navigateBeePage(3)" class="bg-amber-400 hover:bg-amber-300 text-stone-900 font-black text-[9px] px-2 py-1 rounded-lg shadow active:scale-95 transition" title="Refinery">
              ⚡ Shop
            </button>
          </div>
        `;
        const rem = Math.max(0, Math.ceil(plot.lifeTimer));
        progressHtml = `
          <div class="w-full">
            <div class="flex justify-between text-[8.5px] text-yellow-200 mb-0.5 font-bold">
              <span id="bee-timer-${plot.id}">⏳ ${rem}s left (+2🍯/s)</span>
            </div>
            <div class="w-full bg-black/50 rounded-full h-1.5 overflow-hidden">
              <div id="bee-bar-${plot.id}" class="bg-gradient-to-r from-amber-400 to-yellow-300 h-full transition-all" style="width: ${(plot.lifeTimer / plot.maxLifeTimer) * 100}%"></div>
            </div>
          </div>
        `;
      } else if (plot.stage === 3) {
        emoji = '<span class="text-3xl filter grayscale contrast-125 select-none">🕸️</span>';
        badge = '<span class="text-[8.5px] bg-red-800 text-red-100 font-bold px-1.5 py-0.2 rounded-full">Dormant!</span>';
        actionBtn = `
          <button onclick="smokeBeePlot(${plot.id}, event)" class="bg-stone-700 hover:bg-stone-600 text-white font-black text-[9px] px-2 py-1 rounded-lg shadow active:scale-95 transition flex items-center gap-1">
            <span>💨 Smoke</span>
          </button>
        `;
        progressHtml = `
          <div class="text-[8.5px] text-red-300 font-medium text-center">
            Pollen depleted!
          </div>
        `;
      }

      card.innerHTML = `
        <div class="w-full flex items-center justify-between text-[9.5px]">
          <span class="text-amber-200/80 font-bold">Land #${plot.id}</span>
          ${badge}
        </div>
        <div class="my-1 cursor-pointer" onclick="handleBeePlotAction(${plot.id}, event)">
          ${emoji}
        </div>
        <div class="w-full flex flex-col gap-1 items-center">
          ${progressHtml}
          <div class="mt-0.5">${actionBtn}</div>
        </div>
      `;
    }

    container.appendChild(card);
  });
}

function updateBeeFastDisplays() {
  const honeyEl = document.getElementById('beeHoneyCount');
  const energyEl = document.getElementById('beeEnergyCount');
  const diamondEl = document.getElementById('beeDiamondCount');
  const pollenEl = document.getElementById('beePollenCount');
  const smokerEl = document.getElementById('beeSmokerCount');

  if (honeyEl) honeyEl.innerText = Math.floor(beeState.honey);
  if (energyEl) energyEl.innerText = Math.floor(beeState.energy);
  if (diamondEl) diamondEl.innerText = beeState.diamonds;
  if (pollenEl) pollenEl.innerText = beeState.pollen;
  if (smokerEl) smokerEl.innerText = beeState.smokers;

  const shopDiamond = document.getElementById('beeShopDiamondCount');
  if (shopDiamond) shopDiamond.innerText = `${beeState.diamonds} 💎`;

  const larvaBadge = document.getElementById('beeCurrentLarvaPriceBadge');
  const larvaBtnVal = document.getElementById('beeBtnLarvaPrice');
  if (larvaBadge) larvaBadge.innerText = `${beeState.larvaDiamondCost} 💎`;
  if (larvaBtnVal) larvaBtnVal.innerText = beeState.larvaDiamondCost;

  const shopHoney = document.getElementById('beeShopHoneyDisplay');
  const shopBatches = document.getElementById('beeShopBatchesDisplay');
  const shopEnergy = document.getElementById('beeShopEnergyDisplay');

  if (shopHoney) shopHoney.innerText = `${Math.floor(beeState.honey)} 🍯`;
  const batches = Math.floor(beeState.honey / 100);
  if (shopBatches) shopBatches.innerText = `${batches} ${batches === 1 ? 'Batch' : 'Batches'} (${batches * 29} ⚡)`;
  if (shopEnergy) shopEnergy.innerText = `${Math.floor(beeState.energy)} ⚡`;

  const unlockedCount = beeState.plots.filter(p => p.unlocked).length;
  const landCount = document.getElementById('beeLandCount');
  const landSum = document.getElementById('beeLandSummaryLabel');
  if (landCount) landCount.innerText = unlockedCount;
  if (landSum) landSum.innerText = `${unlockedCount} of 20 Lands Unlocked`;

  const nextLocked = beeState.plots.find(p => !p.unlocked);
  const nextBadge = document.getElementById('beeNextLandCostBadge');
  if (nextBadge) {
    if (nextLocked) nextBadge.innerText = `Plot #${nextLocked.id}: ${nextLocked.unlockCost} 💎`;
    else nextBadge.innerText = "All 20 Lands Maxed! 🏆";
  }

  // Live progress bars on Page 1
  const isBeeActive = (typeof gameState !== 'undefined' && (gameState.currentTab === 'bee-farm' || gameState.currentTab === 'beefarm')) || (document.getElementById('pageBeeFarm') && document.getElementById('pageBeeFarm').classList.contains('active'));
  if (isBeeActive && beeState.currentPage === 1) {
    beeState.plots.forEach(plot => {
      if (!plot.unlocked) return;
      const timerText = document.getElementById(`bee-timer-${plot.id}`);
      const progressBar = document.getElementById(`bee-bar-${plot.id}`);
      if (timerText && progressBar) {
        if (plot.stage === 2) {
          const rem = Math.max(0, Math.ceil(plot.lifeTimer));
          timerText.innerText = `⏳ ${rem}s left (+2🍯/s)`;
          progressBar.style.width = `${(plot.lifeTimer / plot.maxLifeTimer) * 100}%`;
        } else if (plot.stage === 1) {
          timerText.innerText = `🐝 Brood ${Math.floor(plot.growthProgress)}%`;
          progressBar.style.width = `${plot.growthProgress}%`;
        }
      }
    });
  }
}

function updateBeeFarmMiniStats() {
  const hElem = document.getElementById('bfEntryHoney');
  const pElem = document.getElementById('bfEntryPollen');
  const sElem = document.getElementById('bfEntrySmoker');
  if (hElem) hElem.innerText = typeof beeState !== 'undefined' ? Math.floor(beeState.honey || 0) : 0;
  if (pElem) pElem.innerText = typeof beeState !== 'undefined' ? (beeState.pollen || 2) : 2;
  if (sElem) sElem.innerText = typeof beeState !== 'undefined' ? (beeState.smokers || 1) : 1;
}

let beeLastTime = performance.now();
let beeHoneySecondAccumulator = 0;
let beeRafRunning = false;

function beeGameLoop(now) {
  const deltaSec = (now - beeLastTime) / 1000;
  beeLastTime = now;

  // 1. Page 2 Nectar Wall Harvester Maya Simulation
  const boostBadge = document.getElementById('beeBoostActiveBadge');
  const boostTime = document.getElementById('beeBoostTimeRemaining');
  const speedLabel = document.getElementById('beeHarvesterSpeedLabel');

  if (beeState.wall.boostTimerRemaining > 0) {
    beeState.wall.boostTimerRemaining = Math.max(0, beeState.wall.boostTimerRemaining - deltaSec);
    if (boostBadge) boostBadge.classList.remove('hidden');
    if (boostTime) boostTime.innerText = Math.ceil(beeState.wall.boostTimerRemaining);
    if (speedLabel) speedLabel.innerText = "1 pot / 2s (2x Overdrive!)";
  } else {
    if (boostBadge) boostBadge.classList.add('hidden');
    if (speedLabel) speedLabel.innerText = "1 pot / 4s";
  }

  const currentFillRate = beeState.wall.boostTimerRemaining > 0 ? 2.0 : 4.0;
  const statusText = document.getElementById('beeHarvesterStatusText');

  if (beeState.wall.pollenInCrate < beeState.wall.maxCrateCapacity) {
    beeState.wall.currentProgress += deltaSec;
    if (beeState.wall.currentProgress >= currentFillRate) {
      beeState.wall.currentProgress = 0;
      beeState.wall.pollenInCrate += 1;
    }
    if (statusText) statusText.innerText = "Gathering floral pollen from wild trellis...";
  } else {
    beeState.wall.currentProgress = 0;
    if (statusText) statusText.innerText = "Wall crate full (5/5 🏺)! Collect now.";
  }

  const harvesterPct = beeState.wall.pollenInCrate >= beeState.wall.maxCrateCapacity
    ? 100
    : Math.floor((beeState.wall.currentProgress / currentFillRate) * 100);

  const progBar = document.getElementById('beeHarvesterProgressBar');
  const cyclePct = document.getElementById('beeHarvesterCyclePercent');
  const crateCnt = document.getElementById('beeWallCrateCounter');
  const collBadge = document.getElementById('beeCollectableBadge');
  const wallBadge = document.getElementById('beeWallBadge');
  const invPollen = document.getElementById('beeWallInvPollen');
  const cratePollen = document.getElementById('beeWallCratePollen');

  if (progBar) progBar.style.width = `${harvesterPct}%`;
  if (cyclePct) cyclePct.innerText = `${harvesterPct}%`;
  if (crateCnt) crateCnt.innerText = beeState.wall.pollenInCrate;
  if (collBadge) collBadge.innerText = beeState.wall.pollenInCrate;
  if (wallBadge) wallBadge.innerText = beeState.wall.pollenInCrate;
  if (invPollen) invPollen.innerText = `${beeState.pollen} 🏺`;
  if (cratePollen) cratePollen.innerText = `${beeState.wall.pollenInCrate} / 5 🏺`;

  // 2. Active Hive Brood & Continuous Per-Second Honey Drop Generation (+2 🍯/s)
  beeHoneySecondAccumulator += deltaSec;
  const tickHoney = beeHoneySecondAccumulator >= 1.0;
  if (tickHoney) beeHoneySecondAccumulator = 0;

  let plotStateChanged = false;
  const isBeeActive = (typeof gameState !== 'undefined' && (gameState.currentTab === 'bee-farm' || gameState.currentTab === 'beefarm')) || (document.getElementById('pageBeeFarm') && document.getElementById('pageBeeFarm').classList.contains('active'));

  beeState.plots.forEach(plot => {
    if (!plot.unlocked) return;

    if (plot.stage === 1) { // Brood incubation
      plot.growthProgress += 20 * deltaSec;
      if (plot.growthProgress >= 100) {
        plot.stage = 2; // Active Hive
        plot.growthProgress = 100;
        plot.lifeTimer = 50;
        plot.maxLifeTimer = 50;
        plotStateChanged = true;
        beeAudio.playTone(523.25, 'triangle', 0.15, 0.1);
      }
    } else if (plot.stage === 2) { // Active hive generating +2 🍯/s
      plot.lifeTimer -= deltaSec;

      if (tickHoney) {
        beeState.honey += 2;
        if (isBeeActive && beeState.currentPage === 1 && Math.random() < 0.28) {
          const cardEl = document.getElementById(`bee-plot-card-${plot.id}`);
          if (cardEl) {
            const rect = cardEl.getBoundingClientRect();
            spawnBeeFloat('+2 🍯', rect.left + rect.width / 2, rect.top + 10, 'text-amber-600');
          }
        }
      }

      if (plot.lifeTimer <= 0) {
        plot.stage = 3; // Dormant / Infested
        plot.lifeTimer = 0;
        plotStateChanged = true;
        beeAudio.playTone(180, 'sawtooth', 0.25, 0.15);
      }
    }
  });

  if (plotStateChanged && isBeeActive) {
    renderBeePlots();
    saveBeeStateDebounced();
  }

  updateBeeFastDisplays();
  requestAnimationFrame(beeGameLoop);
}

function renderBeeFarmTycoon() {
  updateBeeFastDisplays();
  renderBeePlots();
  updateBeeFarmMiniStats();
}

let activeBeeAdReward = null;
let beeAdInterval = null;

const BEE_SPONSOR_ADS = [
  { brand: "WildHoney Labs", headline: "Royal Blossom Extraction", pitch: "Watch queen bees thrive and hives produce rich, golden honey effortlessly!", emoji: "🐝" },
  { brand: "FloralFlora Botanics", headline: "High-Yield Orchid Trellis", pitch: "Pure floral nectar packed with wild mountain minerals for healthy hives.", emoji: "🌸" },
  { brand: "ApexApiary Gear", headline: "Tempered Hardwood Hive Smokers", pitch: "Calm agitated colonies and clean dormant hives effortlessly in seconds.", emoji: "💨" }
];

window.openBeeAdModal = function(rewardType) {
  activeBeeAdReward = rewardType;
  const modal = document.getElementById('beeAdReelModal');
  if (!modal) return;

  const campaign = BEE_SPONSOR_ADS[Math.floor(Math.random() * BEE_SPONSOR_ADS.length)];
  const brand = document.getElementById('beeAdBrandName');
  const headline = document.getElementById('beeAdHeadline');
  const catchphrase = document.getElementById('beeAdCatchphrase');
  const emoji = document.getElementById('beeAdGraphicEmoji');
  const rewardTag = document.getElementById('beeAdRewardTag');
  const timerBadge = document.getElementById('beeAdTimerBadge');
  const pBar = document.getElementById('beeAdProgressBar');
  const claimBtn = document.getElementById('beeAdClaimBtn');

  if (brand) brand.innerText = campaign.brand;
  if (headline) headline.innerText = campaign.headline;
  if (catchphrase) catchphrase.innerText = `"${campaign.pitch}"`;
  if (emoji) emoji.innerText = campaign.emoji;
  if (rewardTag) rewardTag.innerText = rewardType === 'larva' ? "1 Free Queen Larva 🐝" : "1 Free Hive Smoker 💨";

  let remainingMs = 5000;
  if (timerBadge) timerBadge.innerText = `⏳ 5s`;
  if (pBar) pBar.style.width = '0%';
  if (claimBtn) {
    claimBtn.disabled = true;
    claimBtn.className = "bg-stone-700 text-stone-500 font-bold text-xs px-3.5 py-1.5 rounded-xl cursor-not-allowed transition";
    claimBtn.innerText = "Watching...";
  }

  modal.classList.remove('hidden');

  clearInterval(beeAdInterval);
  const startMs = Date.now();

  beeAdInterval = setInterval(() => {
    const elapsed = Date.now() - startMs;
    const pct = Math.min(100, (elapsed / remainingMs) * 100);
    if (pBar) pBar.style.width = `${pct}%`;

    const remSec = Math.max(0, Math.ceil((remainingMs - elapsed) / 1000));
    if (timerBadge) timerBadge.innerText = `⏳ ${remSec}s`;

    if (elapsed >= remainingMs) {
      clearInterval(beeAdInterval);
      if (timerBadge) timerBadge.innerText = "Completed! ✅";
      if (claimBtn) {
        claimBtn.disabled = false;
        claimBtn.className = "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 active:scale-95 text-white font-black text-xs px-4 py-2 rounded-xl shadow cursor-pointer animate-pulse";
        claimBtn.innerText = "Claim Free Reward! 🎉";
      }
    }
  }, 75);
};

let isBeeFarmTycoonInit = false;
function initBeeFarmTycoonGame() {
  if (isBeeFarmTycoonInit) return;
  isBeeFarmTycoonInit = true;

  // Pollen collection from Maya's crate
  const collectBtn = document.getElementById('beeCollectPollenBtn');
  if (collectBtn) {
    collectBtn.addEventListener('click', (e) => {
      if (beeState.wall.pollenInCrate > 0) {
        const count = beeState.wall.pollenInCrate;
        beeState.pollen += count;
        beeState.wall.pollenInCrate = 0;
        beeAudio.playPollenSplash();
        spawnBeeFloat(`+${count} Pollen Pots 🏺!`, e.clientX, e.clientY, 'text-rose-600');
        saveBeeStateDebounced();
        updateBeeFarmMiniStats();
        renderBeeFarmTycoon();
      } else {
        spawnBeeFloat('Maya still gathering floral nectar...', e.clientX, e.clientY, 'text-stone-400');
      }
    });
  }

  // Convert 100 / All Honey
  const conv100 = document.getElementById('beeConvert100Btn');
  if (conv100) conv100.addEventListener('click', (e) => executeHoneyToEnergy(1, e));

  const convAll = document.getElementById('beeConvertAllBtn');
  if (convAll) {
    convAll.addEventListener('click', (e) => {
      const batches = Math.floor(beeState.honey / 100);
      if (batches >= 1) executeHoneyToEnergy(batches, e);
      else spawnBeeFloat('Not enough honey for 1 batch (100 required)!', e.clientX, e.clientY, 'text-stone-400');
    });
  }

  // Buy Larva (+1 💎 Escalation)
  const buyLarvaBtn = document.getElementById('beeBuyLarvaDiamondBtn');
  if (buyLarvaBtn) {
    buyLarvaBtn.addEventListener('click', (e) => {
      const emptyPlot = getEmptyUnlockedBeePlot();
      if (!emptyPlot) {
        spawnBeeFloat('No empty unlocked plot on Page 1! Unlock more land.', e.clientX, e.clientY, 'text-red-500');
        return;
      }

      if (beeState.diamonds >= beeState.larvaDiamondCost) {
        beeState.diamonds -= beeState.larvaDiamondCost;
        const paidPrice = beeState.larvaDiamondCost;
        beeState.larvaDiamondCost += 1;

        emptyPlot.stage = 1;
        emptyPlot.growthProgress = 0;
        emptyPlot.lifeTimer = 50;

        beeAudio.playTone(600, 'sine', 0.18, 0.15);
        spawnBeeFloat(`🐝 Queen Larva Placed in Land #${emptyPlot.id} (-${paidPrice} 💎)!`, e.clientX, e.clientY, 'text-amber-600');
        saveBeeStateDebounced();
        renderBeeFarmTycoon();
      } else {
        spawnBeeFloat(`Need ${beeState.larvaDiamondCost} Diamonds! 💎`, e.clientX, e.clientY, 'text-red-500');
      }
    });
  }

  // Buy Smoker (10 💎)
  const buySmokerBtn = document.getElementById('beeBuySmokerDiamondBtn');
  if (buySmokerBtn) {
    buySmokerBtn.addEventListener('click', (e) => {
      if (beeState.diamonds >= 10) {
        beeState.diamonds -= 10;
        beeState.smokers += 1;
        beeAudio.playTone(750, 'triangle', 0.2, 0.15);
        spawnBeeFloat('+1 Hive Smoker 💨 (-10 💎)', e.clientX, e.clientY, 'text-stone-800');
        saveBeeStateDebounced();
        renderBeeFarmTycoon();
      } else {
        spawnBeeFloat('Need 10 Diamonds for Smoker! 💎', e.clientX, e.clientY, 'text-red-500');
      }
    });
  }

  // Buy Pollen Pot (2 💎)
  const buyPollenBtn = document.getElementById('beeBuyPollenDiamondBtn');
  if (buyPollenBtn) {
    buyPollenBtn.addEventListener('click', (e) => {
      if (beeState.diamonds >= 2) {
        beeState.diamonds -= 2;
        beeState.pollen += 1;
        beeAudio.playPollenSplash();
        spawnBeeFloat('+1 Pollen Pot 🏺 (-2 💎)', e.clientX, e.clientY, 'text-rose-600');
        saveBeeStateDebounced();
        updateBeeFarmMiniStats();
        renderBeeFarmTycoon();
      } else {
        spawnBeeFloat('Need 2 Diamonds for Pollen Pot! 💎', e.clientX, e.clientY, 'text-red-500');
      }
    });
  }

  // Buy Honey Pack (5 💎 for 250 Honey)
  const buyHoneyBtn = document.getElementById('beeBuyHoneyDiamondBtn');
  if (buyHoneyBtn) {
    buyHoneyBtn.addEventListener('click', (e) => {
      if (beeState.diamonds >= 5) {
        beeState.diamonds -= 5;
        beeState.honey += 250;
        beeAudio.playHoneyPop();
        spawnBeeFloat('+250 Honey 🍯 (-5 💎)', e.clientX, e.clientY, 'text-amber-600');
        saveBeeStateDebounced();
        renderBeeFarmTycoon();
      } else {
        spawnBeeFloat('Need 5 Diamonds for Honey Pack! 💎', e.clientX, e.clientY, 'text-red-500');
      }
    });
  }

  // Harvester Speed Boost (8 💎 for 2x pump speed for 60s)
  const buyBoostBtn = document.getElementById('beeBuyBoostDiamondBtn');
  if (buyBoostBtn) {
    buyBoostBtn.addEventListener('click', (e) => {
      if (beeState.diamonds >= 8) {
        beeState.diamonds -= 8;
        beeState.wall.boostTimerRemaining = Math.max(beeState.wall.boostTimerRemaining, 0) + 60;
        beeAudio.playRefineryChime();
        spawnBeeFloat('⚡ 2x Harvester Speed Activated (-8 💎)!', e.clientX, e.clientY, 'text-amber-600');
        saveBeeStateDebounced();
        renderBeeFarmTycoon();
      } else {
        spawnBeeFloat('Need 8 Diamonds for Speed Boost! 💎', e.clientX, e.clientY, 'text-red-500');
      }
    });
  }

  // Nourish All & Smoke All
  const pollenAll = document.getElementById('beePollenAllBtn');
  if (pollenAll) {
    pollenAll.addEventListener('click', (e) => {
      let count = 0;
      beeState.plots.forEach(p => {
        if (p.unlocked && p.stage === 2 && beeState.pollen > 0) {
          beeState.pollen -= 1;
          p.lifeTimer = Math.min(120, p.lifeTimer + 35);
          count++;
        }
      });
      if (count > 0) {
        beeAudio.playPollenSplash();
        spawnBeeFloat(`Nourished ${count} Hives! 🏺`, e.clientX, e.clientY, 'text-rose-600');
        saveBeeStateDebounced();
        updateBeeFarmMiniStats();
        renderBeeFarmTycoon();
      } else {
        spawnBeeFloat('No active hives or no pollen pots!', e.clientX, e.clientY, 'text-stone-400');
      }
    });
  }

  const smokeAll = document.getElementById('beeSmokeAllBtn');
  if (smokeAll) {
    smokeAll.addEventListener('click', (e) => {
      let cleared = 0;
      beeState.plots.forEach(p => {
        if (p.unlocked && p.stage === 3 && beeState.smokers > 0) {
          beeState.smokers -= 1;
          p.stage = 0;
          p.growthProgress = 0;
          p.lifeTimer = 0;
          cleared++;
        }
      });
      if (cleared > 0) {
        beeAudio.playSmoke();
        spawnBeeFloat(`Cleared ${cleared} dormant hives! 💨`, e.clientX, e.clientY, 'text-stone-700');
        saveBeeStateDebounced();
        renderBeeFarmTycoon();
      } else {
        spawnBeeFloat('No dormant hives or no smokers!', e.clientX, e.clientY, 'text-stone-400');
      }
    });
  }

  // Claim Ad
  const adClaim = document.getElementById('beeAdClaimBtn');
  const adModal = document.getElementById('beeAdReelModal');
  if (adClaim) {
    adClaim.addEventListener('click', () => {
      if (activeBeeAdReward === 'larva') {
        const empty = getEmptyUnlockedBeePlot();
        if (empty) {
          empty.stage = 1;
          empty.growthProgress = 0;
          empty.lifeTimer = 50;
          beeAudio.playTone(720, 'sine', 0.2, 0.2);
          spawnBeeFloat(`🎁 1 Free Larva Placed in Land #${empty.id}! 🐝`, window.innerWidth / 2, window.innerHeight / 2, 'text-emerald-600');
        } else {
          beeState.diamonds += 1;
          spawnBeeFloat('All plots occupied! +1 💎 Compensated!', window.innerWidth / 2, window.innerHeight / 2, 'text-cyan-600');
        }
      } else if (activeBeeAdReward === 'smoker') {
        beeState.smokers += 1;
        beeAudio.playTone(850, 'sine', 0.2, 0.2);
        spawnBeeFloat('🎁 1 Free Hive Smoker 💨 Claimed!', window.innerWidth / 2, window.innerHeight / 2, 'text-stone-800');
      }
      saveBeeStateDebounced();
      renderBeeFarmTycoon();
      if (adModal) adModal.classList.add('hidden');
      activeBeeAdReward = null;
    });
  }

  // Sound & Guide
  const soundBtn = document.getElementById('beeSoundBtn');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      beeAudio.muted = !beeAudio.muted;
      soundBtn.innerText = beeAudio.muted ? '🔇' : '🔊';
    });
  }

  const guideBtn = document.getElementById('beeGuideBtn');
  const rulesModal = document.getElementById('beeRulesModal');
  const closeRules1 = document.getElementById('beeCloseRulesBtn');
  const closeRules2 = document.getElementById('beeCloseRulesBtn2');

  if (guideBtn && rulesModal) guideBtn.addEventListener('click', () => rulesModal.classList.remove('hidden'));
  if (closeRules1 && rulesModal) closeRules1.addEventListener('click', () => rulesModal.classList.add('hidden'));
  if (closeRules2 && rulesModal) closeRules2.addEventListener('click', () => rulesModal.classList.add('hidden'));

  // Start simulation loop
  if (!beeRafRunning) {
    beeRafRunning = true;
    beeLastTime = performance.now();
    requestAnimationFrame(beeGameLoop);
  }
}

// Global Exports
window.initBeeFarmTycoonGame = initBeeFarmTycoonGame;
window.renderBeeFarmTycoon = renderBeeFarmTycoon;
window.updateBeeFarmMiniStats = updateBeeFarmMiniStats;

// Auto-run when script loads or DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initBeeFarmTycoonGame();
    renderBeeFarmTycoon();
  });
} else {
  initBeeFarmTycoonGame();
  renderBeeFarmTycoon();
}
