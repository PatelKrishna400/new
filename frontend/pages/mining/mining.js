/* ==========================================================================
   CRYSTAL MINING & GEM FORGE TYCOON ENGINE (pages/mining/mining.js)
   20 Terraces, Nora Cryo-Geyser Wall, 100 🔮 -> 29 ⚡ Plasma Converter
   ========================================================================== */

const MINE_STORAGE_KEY = 'mining_tycoon_state_v1';

const MINE_TERRACE_UNLOCK_COSTS = [
  0,      // Plot 1: Free
  10,     // Plot 2: 10 💎
  100,    // Plot 3: 100 💎
  250,    // Plot 4
  450,    // Plot 5
  750,    // Plot 6
  1200,   // Plot 7
  1800,   // Plot 8
  2600,   // Plot 9
  3600,   // Plot 10
  5000,   // Plot 11
  7000,   // Plot 12
  9500,   // Plot 13
  12500,  // Plot 14
  16500,  // Plot 15
  21500,  // Plot 16
  28000,  // Plot 17
  36000,  // Plot 18
  46000,  // Plot 19
  60000   // Plot 20
];

function createDefaultMineTerraces() {
  const terraces = [];
  for (let i = 1; i <= 20; i++) {
    const isUnlocked = i === 1;
    terraces.push({
      id: i,
      unlocked: isUnlocked,
      cost: MINE_TERRACE_UNLOCK_COSTS[i - 1],
      stage: isUnlocked ? 2 : 0, // 0: Bed Ready, 1: Geode Germinating, 2: Active Gem Spire (+2 🔮/s), 3: Overheated Slag
      growthProgress: isUnlocked ? 100 : 0,
      thermalTimer: isUnlocked ? 55 : 0,
      maxThermalTimer: 60
    });
  }
  return terraces;
}

function loadInitialMiningState() {
  try {
    const raw = localStorage.getItem(MINE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.terraces) && parsed.terraces.length === 20) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse saved Mining state:', e);
  }

  return {
    currentTab: 1,
    shards: 150,
    energy: 0,
    diamonds: 25,
    coolant: 2,
    pickaxes: 1,
    geodeDiamondCost: 1,
    wall: {
      canistersInCrate: 0,
      maxCapacity: Infinity,
      baseFillSeconds: 4.0,
      currentProgress: 0,
      overdriveRemaining: 0
    },
    terraces: createDefaultMineTerraces()
  };
}

const mineState = loadInitialMiningState();
if (mineState && mineState.wall) {
  mineState.wall.maxCapacity = Infinity;
}
window.mineState = mineState;

let mineSaveTimeout = null;
function saveMineStateDebounced() {
  if (mineSaveTimeout) return;
  mineSaveTimeout = setTimeout(() => {
    mineSaveTimeout = null;
    try {
      localStorage.setItem(MINE_STORAGE_KEY, JSON.stringify(mineState));
    } catch (e) {}
  }, 1000);
}

const miningAudio = {
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
  playTone(freq, type = 'sine', duration = 0.12, gainLvl = 0.08) {
    if (this.muted) return;
    this.init(); this.resume();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainLvl, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration + 0.02);
    } catch (e) {}
  },
  playCrystalChime() {
    if (this.muted) return;
    this.init(); this.resume();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1100, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.09);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.17);
    } catch (e) {}
  },
  playCryoHiss() {
    if (this.muted) return;
    this.init(); this.resume();
    if (!this.ctx) return;
    try {
      const bufferSize = this.ctx.sampleRate * 0.16;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.09, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.16);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start();
    } catch (e) {}
  },
  playPickaxeClink() {
    if (this.muted) return;
    this.init(); this.resume();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.15);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.17);
    } catch (e) {}
  },
  playUnlockFanfare() {
    if (this.muted) return;
    this.init(); this.resume();
    if (!this.ctx) return;
    [587.33, 739.99, 880.0, 1174.66, 1479.98].forEach((f, idx) => {
      setTimeout(() => this.playTone(f, 'sine', 0.18, 0.1), idx * 60);
    });
  },
  playForgeHum() {
    if (this.muted) return;
    this.init(); this.resume();
    if (!this.ctx) return;
    [220, 330, 440, 660].forEach((f, idx) => {
      setTimeout(() => this.playTone(f, 'triangle', 0.25, 0.12), idx * 70);
    });
  }
};

function spawnMineFloat(text, x, y, color = 'text-cyan-400') {
  const el = document.createElement('div');
  el.className = `crystal-shard-float font-sci text-xs sm:text-sm select-none ${color}`;
  el.innerHTML = text;
  el.style.left = `${x || window.innerWidth / 2}px`;
  el.style.top = `${y || window.innerHeight / 2}px`;
  document.body.appendChild(el);
  setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, 1100);
}

const minePageBadges = {
  1: "Page 1: Cavern Terraces 🔮",
  2: "Page 2: Cryo-Geyser Wall 🌊🧱",
  3: "Page 3: Plasma Forge & Vault ⚡💎"
};

window.navigateMiningTab = function(tabNum) {
  mineState.currentTab = tabNum;
  miningAudio.playTone(520, 'triangle', 0.08, 0.05);

  for (let i = 1; i <= 3; i++) {
    const pageEl = document.getElementById(`minePage${i}`);
    if (pageEl) {
      if (i === tabNum) pageEl.classList.add('active-page');
      else pageEl.classList.remove('active-page');
    }

    const tabEl = document.getElementById(`mineTab${i}`);
    if (tabEl) {
      if (i === tabNum) tabEl.classList.add('active-tab');
      else tabEl.classList.remove('active-tab');
    }
  }

  const badgeEl = document.getElementById('mineActivePageBadge');
  if (badgeEl) badgeEl.innerText = minePageBadges[tabNum] || `Page ${tabNum}`;

  const viewContainer = document.getElementById('pageMining');
  if (viewContainer) {
    viewContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

function getEmptyUnlockedMineTerrace() {
  return mineState.terraces.find(t => t.unlocked && t.stage === 0);
}

// 100 Shards -> 29 Plasma Energy Conversion
window.executeShardConversion = function(batches = 1, event = null) {
  const cost = batches * 100;
  const energyGain = batches * 29;

  if (mineState.shards >= cost) {
    mineState.shards -= cost;
    mineState.energy += energyGain;

    // Direct Synergy: Also recharges player's main reactor energy!
    if (typeof gameState !== 'undefined' && gameState.reactor) {
      const maxE = gameState.reactor.maxEnergy || 1000;
      gameState.reactor.currentEnergy = Math.min(maxE, (gameState.reactor.currentEnergy || 0) + energyGain);
      if (typeof updateEnergyUI === 'function') updateEnergyUI();
    }

    miningAudio.playForgeHum();
    const core = document.getElementById('minePlasmaForgeCore');
    if (core) {
      core.classList.add('plasma-shake');
      setTimeout(() => core.classList.remove('plasma-shake'), 380);
    }

    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnMineFloat(`-${cost}🔮 &rarr; +${energyGain}⚡ PLASMA!`, posX, posY, 'text-amber-300');
    saveMineStateDebounced();
    renderMiningTycoon();
  } else {
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnMineFloat('Requires at least 100 Crystal Shards (🔮)!', posX, posY, 'text-rose-400');
  }
};

window.unlockMineTerrace = function(terraceId, event = null) {
  const terrace = mineState.terraces.find(t => t.id === terraceId);
  if (!terrace || terrace.unlocked) return;

  const cost = terrace.cost;
  if (mineState.diamonds >= cost) {
    mineState.diamonds -= cost;
    terrace.unlocked = true;
    terrace.stage = 0; // Bed Ready
    terrace.growthProgress = 0;
    terrace.thermalTimer = 0;

    miningAudio.playUnlockFanfare();
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnMineFloat(`🎉 Terrace #${terrace.id} Excavated (-${cost} 💎)!`, posX, posY, 'text-cyan-300');
    saveMineStateDebounced();
    updateMiningMiniStats();
    renderMiningTycoon();
  } else {
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnMineFloat(`Requires ${cost} 💎 to excavate Terrace #${terrace.id}!`, posX, posY, 'text-rose-400');
  }
};

window.coolMineTerrace = function(terraceId, event = null) {
  const terrace = mineState.terraces.find(t => t.id === terraceId);
  if (!terrace || !terrace.unlocked) return;

  if (mineState.coolant <= 0) {
    if (event) spawnMineFloat('No Cryo-Canisters! Visit Page 2 Geyser Wall 🌊', event.clientX, event.clientY, 'text-rose-400');
    return;
  }

  if (terrace.stage === 2) {
    mineState.coolant -= 1;
    terrace.thermalTimer = Math.min(120, terrace.thermalTimer + 35);
    terrace.maxThermalTimer = Math.max(terrace.maxThermalTimer, terrace.thermalTimer);
    miningAudio.playCryoHiss();
    if (event) spawnMineFloat('+35s Thermal Life! 🧪', event.clientX, event.clientY, 'text-sky-300');
    saveMineStateDebounced();
    updateMiningMiniStats();
    renderMiningTycoon();
  } else if (terrace.stage === 1) {
    mineState.coolant -= 1;
    terrace.growthProgress = Math.min(100, terrace.growthProgress + 35);
    miningAudio.playCryoHiss();
    if (event) spawnMineFloat('Germination Boosted! 🧪', event.clientX, event.clientY, 'text-sky-300');
    saveMineStateDebounced();
    updateMiningMiniStats();
    renderMiningTycoon();
  }
};

window.shatterMineSlag = function(terraceId, event = null) {
  const terrace = mineState.terraces.find(t => t.id === terraceId);
  if (!terrace || !terrace.unlocked || terrace.stage !== 3) return;

  if (mineState.pickaxes > 0) {
    mineState.pickaxes -= 1;
    terrace.stage = 0;
    terrace.growthProgress = 0;
    terrace.thermalTimer = 0;
    miningAudio.playPickaxeClink();
    if (event) spawnMineFloat(`Slag Shattered from Terrace #${terrace.id}! Plot Ready ✨`, event.clientX, event.clientY, 'text-cyan-300');
    saveMineStateDebounced();
    renderMiningTycoon();
  } else {
    if (event) spawnMineFloat('Need 🔨 Sonic Pickaxe! Buy on Page 3 or Watch Ad', event.clientX, event.clientY, 'text-rose-400');
  }
};

window.triggerMineCrystalClick = function(terraceId, event) {
  const terrace = mineState.terraces.find(t => t.id === terraceId);
  if (!terrace || !terrace.unlocked) return;

  if (terrace.stage === 2) {
    mineState.shards += 1;
    miningAudio.playCrystalChime();
    spawnMineFloat('+1 🔮', event.clientX, event.clientY, 'text-cyan-300');
    saveMineStateDebounced();
    updateMiningTelemetry();
  }
};

function renderMineTerraces() {
  const container = document.getElementById('mineTerracesContainer');
  if (!container || !mineState.terraces) return;
  container.innerHTML = '';

  mineState.terraces.forEach(terrace => {
    const card = document.createElement('div');
    card.id = `mine-terrace-${terrace.id}`;
    if (!terrace.unlocked) {
      card.className = "mine-terrace-locked rounded-xl p-3 flex items-center justify-between gap-3 relative text-slate-300 border border-slate-700/60 shadow-md";
      card.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="text-3xl filter grayscale opacity-60">🪨</div>
          <div>
            <div class="flex items-center gap-2 text-xs font-sci">
              <span class="text-slate-200 font-bold">Terrace #${terrace.id}</span>
              <span class="bg-red-950/80 text-red-300 px-2 py-0.5 rounded border border-red-700/60 text-[9px]">LOCKED 🔒</span>
            </div>
            <div class="text-[11px] font-sci text-cyan-300 mt-1">Excavation fee: <strong>${terrace.cost} 💎</strong></div>
          </div>
        </div>
        <button onclick="unlockMineTerrace(${terrace.id}, event)" class="sci-btn bg-cyan-600 hover:bg-cyan-500 text-black font-sci font-bold text-xs px-4 py-2 rounded-xl transition flex items-center justify-center gap-1.5 whitespace-nowrap">
          <span>EXCAVATE 🔓</span>
        </button>
      `;
    } else {
      card.className = "mine-terrace-card rounded-xl p-3 flex flex-col gap-2 relative text-slate-100";

      let graphic = '';
      let statusBadge = '';
      let actionControls = '';
      let barMarkup = '';

      if (terrace.stage === 0) {
        graphic = '<span class="text-3xl opacity-35 select-none">🔮</span>';
        statusBadge = '<span class="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-sci">BED READY</span>';
        actionControls = `
          <button onclick="document.getElementById('mineBuyGeodeDiamondBtn').click()" class="sci-btn bg-cyan-500 hover:bg-cyan-400 text-black font-sci font-bold text-xs px-3.5 py-1.5 rounded-lg transition whitespace-nowrap">
            INFUSE GEODE ✨
          </button>
        `;
        barMarkup = '<div class="text-[11px] text-slate-400 font-sci">Infuse a seed geode to begin crystallization</div>';
      } else if (terrace.stage === 1) {
        graphic = '<span class="text-3xl animate-pulse filter drop-shadow select-none">✨🥚</span>';
        statusBadge = '<span class="text-[9px] bg-purple-950 text-purple-300 px-2 py-0.5 rounded font-sci border border-purple-500/40">INFUSING</span>';
        actionControls = `
          <button onclick="coolMineTerrace(${terrace.id}, event)" class="sci-btn bg-sky-600 hover:bg-sky-500 text-white font-sci text-[10px] px-3 py-1.5 rounded-lg whitespace-nowrap">
            🧪 INFUSE CRYO
          </button>
        `;
        barMarkup = `
          <div class="w-full">
            <div class="flex justify-between text-[9px] font-sci text-cyan-300 mb-0.5">
              <span id="mine-timer-${terrace.id}">✨ Infusing ${Math.floor(terrace.growthProgress)}%</span>
            </div>
            <div class="w-full bg-abyss rounded-full h-2 overflow-hidden border border-slate-700">
              <div id="mine-bar-${terrace.id}" class="bg-gradient-to-r from-purple-500 to-cyan-400 h-full transition-all" style="width: ${terrace.growthProgress}%"></div>
            </div>
          </div>
        `;
      } else if (terrace.stage === 2) {
        graphic = '<span class="text-3xl filter drop-shadow hover:scale-105 transition-transform animate-pulse cursor-pointer select-none">🔮💎</span>';
        statusBadge = '<span class="text-[9px] bg-cyan-950 text-cyan-300 font-sci font-bold px-2 py-0.5 rounded border border-cyan-400 shadow-glow-cyan">+2🔮/s</span>';
        actionControls = `
          <div class="flex items-center gap-1.5">
            <button onclick="coolMineTerrace(${terrace.id}, event)" class="sci-btn bg-sky-600 hover:bg-sky-500 text-white font-sci text-[10px] px-3 py-1.5 rounded-lg whitespace-nowrap" title="Add +35s life">
              🧪 +35s
            </button>
            <button onclick="navigateMiningTab(3)" class="sci-btn bg-amber-500 hover:bg-amber-400 text-black font-sci text-[10px] px-3 py-1.5 rounded-lg whitespace-nowrap" title="Forge">
              ⚡ FORGE
            </button>
          </div>
        `;
        const rem = Math.max(0, Math.ceil(terrace.thermalTimer));
        barMarkup = `
          <div class="w-full">
            <div class="flex justify-between text-[9px] font-sci text-cyan-300 mb-0.5">
              <span id="mine-timer-${terrace.id}">⏳ ${rem}s stability (+2🔮/s)</span>
            </div>
            <div class="w-full bg-abyss rounded-full h-2 overflow-hidden border border-slate-700">
              <div id="mine-bar-${terrace.id}" class="bg-gradient-to-r from-sky-400 to-cyan-300 h-full transition-all shadow-glow-cyan" style="width: ${(terrace.thermalTimer / terrace.maxThermalTimer) * 100}%"></div>
            </div>
          </div>
        `;
      } else if (terrace.stage === 3) {
        graphic = '<span class="text-3xl filter contrast-125 select-none">🌋🪨</span>';
        statusBadge = '<span class="text-[9px] bg-rose-950 text-rose-300 font-sci px-2 py-0.5 rounded border border-rose-500/50">OVERHEATED</span>';
        actionControls = `
          <button onclick="shatterMineSlag(${terrace.id}, event)" class="sci-btn bg-rose-700 hover:bg-rose-600 text-white font-sci text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1 whitespace-nowrap">
            <span>🔨 SHATTER</span>
          </button>
        `;
        barMarkup = `
          <div class="text-[10px] text-rose-400 font-mono">
            Coolant expired! Shatter slag to restart.
          </div>
        `;
      }

      card.innerHTML = `
        <div class="w-full flex items-center justify-between text-[10px] font-sci pb-1 border-b border-slate-700/60">
          <span class="text-cyan-300 font-bold">Terrace #${terrace.id}</span>
          ${statusBadge}
        </div>
        <div class="w-full flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div class="flex items-center gap-3 w-full sm:w-auto">
            <div class="cursor-pointer shrink-0" onclick="handleMineTerraceAction(${terrace.id}, event)">
              ${graphic}
            </div>
            <div class="flex-1 sm:w-64">
              ${barMarkup}
            </div>
          </div>
          <div class="shrink-0 w-full sm:w-auto flex justify-end">
            ${actionControls}
          </div>
        </div>
      `;
    }

    container.appendChild(card);
  });
}

function updateMiningTelemetry() {
  const shardsEl = document.getElementById('mineShardCount');
  const energyEl = document.getElementById('mineEnergyCount');
  const diamondEl = document.getElementById('mineDiamondCount');
  const coolantEl = document.getElementById('mineCoolantCount');
  const pickaxesEl = document.getElementById('minePickaxeCount');

  if (shardsEl) shardsEl.innerText = Math.floor(mineState.shards);
  if (energyEl) energyEl.innerText = Math.floor(mineState.energy);
  if (diamondEl) diamondEl.innerText = mineState.diamonds;
  if (coolantEl) coolantEl.innerText = mineState.coolant;
  if (pickaxesEl) pickaxesEl.innerText = mineState.pickaxes;

  const shopDiamond = document.getElementById('mineShopDiamondCount');
  if (shopDiamond) shopDiamond.innerText = `${mineState.diamonds} 💎`;

  const geodeBadge = document.getElementById('mineCurrentGeodePriceBadge');
  const geodeBtnVal = document.getElementById('mineBtnGeodePrice');
  if (geodeBadge) geodeBadge.innerText = `${mineState.geodeDiamondCost} 💎`;
  if (geodeBtnVal) geodeBtnVal.innerText = mineState.geodeDiamondCost;

  const shopShards = document.getElementById('mineShopShardsDisplay');
  const shopBatches = document.getElementById('mineShopBatchesDisplay');
  const shopEnergy = document.getElementById('mineShopEnergyDisplay');

  if (shopShards) shopShards.innerText = `${Math.floor(mineState.shards)} 🔮`;
  const batches = Math.floor(mineState.shards / 100);
  if (shopBatches) shopBatches.innerText = `${batches} ${batches === 1 ? 'Batch' : 'Batches'} (${batches * 29} ⚡)`;
  if (shopEnergy) shopEnergy.innerText = `${Math.floor(mineState.energy)} ⚡`;

  const unlockedCount = mineState.terraces.filter(t => t.unlocked).length;
  const terraceCount = document.getElementById('mineTerraceCount');
  const drillText = document.getElementById('mineDrillProgressText');
  const depthInd = document.getElementById('mineDepthIndicator');

  if (terraceCount) terraceCount.innerText = unlockedCount;
  if (drillText) drillText.innerText = `${unlockedCount} / 20 Terraces Excavated`;
  if (depthInd) depthInd.innerText = `${150 + (unlockedCount * 45)}m`;

  const nextLocked = mineState.terraces.find(t => !t.unlocked);
  const nextBadge = document.getElementById('mineNextTerraceBadge');
  if (nextBadge) {
    if (nextLocked) nextBadge.innerText = `Plot #${nextLocked.id}: ${nextLocked.cost} 💎`;
    else nextBadge.innerText = "All 20 Terraces Maxed! 🏆";
  }

  // Live progress bars on Page 1
  const isMiningActive = (typeof gameState !== 'undefined' && gameState.currentTab === 'mining') || (document.getElementById('pageMining') && document.getElementById('pageMining').classList.contains('active'));
  if (isMiningActive && mineState.currentTab === 1) {
    mineState.terraces.forEach(t => {
      if (!t.unlocked) return;
      const timerText = document.getElementById(`mine-timer-${t.id}`);
      const progressBar = document.getElementById(`mine-bar-${t.id}`);
      if (timerText && progressBar) {
        if (t.stage === 2) {
          const rem = Math.max(0, Math.ceil(t.thermalTimer));
          timerText.innerText = `⏳ ${rem}s stability (+2🔮/s)`;
          progressBar.style.width = `${(t.thermalTimer / t.maxThermalTimer) * 100}%`;
        } else if (t.stage === 1) {
          timerText.innerText = `✨ Infusing ${Math.floor(t.growthProgress)}%`;
          progressBar.style.width = `${t.growthProgress}%`;
        }
      }
    });
  }
}

function updateMiningMiniStats() {
  const crElem = document.getElementById('mineEntryCrystals');
  const coElem = document.getElementById('mineEntryCoolant');
  const piElem = document.getElementById('mineEntryPickaxe');
  if (crElem) crElem.innerText = typeof mineState !== 'undefined' ? Math.floor(mineState.crystals || 0) : 0;
  if (coElem) coElem.innerText = typeof mineState !== 'undefined' ? (mineState.coolant || 2) : 2;
  if (piElem) piElem.innerText = typeof mineState !== 'undefined' ? (mineState.pickaxes || 1) : 1;
}

let mineLastTime = performance.now();
let mineShardSecondAccumulator = 0;
let mineRafRunning = false;

function mineGameLoop(now) {
  const deltaSec = (now - mineLastTime) / 1000;
  mineLastTime = now;

  // 1. Page 2 Geyser Wall Condenser Simulation
  const overdriveTag = document.getElementById('mineOverdriveActiveTag');
  const overdriveSec = document.getElementById('mineOverdriveSecLeft');
  const cycleRateLabel = document.getElementById('mineGeyserCycleRateLabel');

  if (mineState.wall.overdriveRemaining > 0) {
    mineState.wall.overdriveRemaining = Math.max(0, mineState.wall.overdriveRemaining - deltaSec);
    if (overdriveTag) overdriveTag.classList.remove('hidden');
    if (overdriveSec) overdriveSec.innerText = Math.ceil(mineState.wall.overdriveRemaining);
    if (cycleRateLabel) cycleRateLabel.innerText = "1 Canister / 2.0s (2x Overdrive!)";
  } else {
    if (overdriveTag) overdriveTag.classList.add('hidden');
    if (cycleRateLabel) cycleRateLabel.innerText = "1 Canister / 4.0s";
  }

  const currentRate = mineState.wall.overdriveRemaining > 0 ? 2.0 : 4.0;
  const statusText = document.getElementById('mineGeyserStatusText');

  if (mineState.wall.canistersInCrate < mineState.wall.maxCapacity) {
    mineState.wall.currentProgress += deltaSec;
    if (mineState.wall.currentProgress >= currentRate) {
      mineState.wall.currentProgress = 0;
      mineState.wall.canistersInCrate += 1;
    }
    if (statusText) statusText.innerText = "Condensing high-pressure thermal vapor (Unlimited)...";
  } else {
    mineState.wall.currentProgress = 0;
    if (statusText) statusText.innerText = "Condensing high-pressure thermal vapor (Unlimited)...";
  }

  const geyserPct = Math.min(100, Math.floor((mineState.wall.currentProgress / currentRate) * 100));

  const progBar = document.getElementById('mineGeyserProgressBar');
  const pctLbl = document.getElementById('mineGeyserPercentLabel');
  const crateCnt = document.getElementById('mineWallCrateCounter');
  const badgeInner = document.getElementById('mineCrateBadgeInner');
  const wallBadge = document.getElementById('mineWallBadge');
  const invCoolant = document.getElementById('mineWallInvCoolant');
  const crateDisp = document.getElementById('mineWallCrateDisplay');

  if (progBar) progBar.style.width = `${geyserPct}%`;
  if (pctLbl) pctLbl.innerText = `${geyserPct}%`;
  if (crateCnt) crateCnt.innerText = mineState.wall.canistersInCrate;
  if (badgeInner) badgeInner.innerText = mineState.wall.canistersInCrate;
  if (wallBadge) wallBadge.innerText = mineState.wall.canistersInCrate;
  if (invCoolant) invCoolant.innerText = `${mineState.coolant} 🧪`;
  if (crateDisp) crateDisp.innerText = `${mineState.wall.canistersInCrate} 🧪 (Unlimited)`;

  // 2. Active Gem Spire Continuous Shard Generation (+2 🔮/s) & Thermal Life Decay
  mineShardSecondAccumulator += deltaSec;
  const tickShards = mineShardSecondAccumulator >= 1.0;
  if (tickShards) mineShardSecondAccumulator = 0;

  let terraceStateChanged = false;
  const isMiningActive = (typeof gameState !== 'undefined' && gameState.currentTab === 'mining') || (document.getElementById('pageMining') && document.getElementById('pageMining').classList.contains('active'));

  mineState.terraces.forEach(terrace => {
    if (!terrace.unlocked) return;

    if (terrace.stage === 1) { // Geode germinating
      terrace.growthProgress += 20 * deltaSec;
      if (terrace.growthProgress >= 100) {
        terrace.stage = 2; // Active Gem Spire
        terrace.growthProgress = 100;
        terrace.thermalTimer = 50;
        terrace.maxThermalTimer = 50;
        terraceStateChanged = true;
        miningAudio.playTone(660, 'triangle', 0.15, 0.1);
      }
    } else if (terrace.stage === 2) { // Active spire generating +2 🔮/s
      terrace.thermalTimer -= deltaSec;

      if (tickShards) {
        mineState.shards += 2;
        if (isMiningActive && mineState.currentTab === 1 && Math.random() < 0.28) {
          const cardEl = document.getElementById(`mine-terrace-card-${terrace.id}`);
          if (cardEl) {
            const rect = cardEl.getBoundingClientRect();
            spawnMineFloat('+2 🔮', rect.left + rect.width / 2, rect.top + 10, 'text-cyan-300');
          }
        }
      }

      if (terrace.thermalTimer <= 0) {
        terrace.stage = 3; // Overheated Volcanic Slag!
        terrace.thermalTimer = 0;
        terraceStateChanged = true;
        miningAudio.playTone(180, 'sawtooth', 0.25, 0.14);
      }
    }
  });

  if (terraceStateChanged && isMiningActive) {
    renderMineTerraces();
    saveMineStateDebounced();
  }

  updateMiningTelemetry();
  requestAnimationFrame(mineGameLoop);
}

function renderMiningTycoon() {
  updateMiningTelemetry();
  renderMineTerraces();
  updateMiningMiniStats();
}

let activeMiningAdReward = null;
let miningAdInterval = null;

const MINING_SPONSOR_ADS = [
  { brand: "NovaMining Industrial", headline: "Cryo-Resonance Sub-Drill", pitch: "Unleash 400% deeper cavern resonance with zero coolant decay. Official sponsor of Deep Core 9.", emoji: "💎" },
  { brand: "ApexGeo Heavy Tech", headline: "Tungsten Seismic Sonic Disrupter", pitch: "Instantly fractures volcanic slag into fertile mineral soil in under 1 microsecond.", emoji: "🔨" },
  { brand: "SubZero Vapor Systems", headline: "Liquid Nitrogen Geyser Valves", pitch: "Rapid condensation technology that keeps high-energy gem cores perfectly balanced.", emoji: "🌊" }
];

window.openMiningAdModal = function(rewardType) {
  activeMiningAdReward = rewardType;
  const modal = document.getElementById('mineAdReelModal');
  if (!modal) return;

  const spot = MINING_SPONSOR_ADS[Math.floor(Math.random() * MINING_SPONSOR_ADS.length)];
  const brand = document.getElementById('mineAdBrandName');
  const headline = document.getElementById('mineAdHeadline');
  const catchphrase = document.getElementById('mineAdCatchphrase');
  const emoji = document.getElementById('mineAdGraphicEmoji');
  const rewardTag = document.getElementById('mineAdRewardTag');
  const timerBadge = document.getElementById('mineAdTimerBadge');
  const pBar = document.getElementById('mineAdProgressBar');
  const claimBtn = document.getElementById('mineAdClaimBtn');

  if (brand) brand.innerText = spot.brand;
  if (headline) headline.innerText = spot.headline;
  if (catchphrase) catchphrase.innerText = `"${spot.pitch}"`;
  if (emoji) emoji.innerText = spot.emoji;
  if (rewardTag) rewardTag.innerText = rewardType === 'geode' ? "1 Free Seed Geode ✨" : "1 Free Sonic Pickaxe 🔨";

  let remainingMs = 5000;
  if (timerBadge) timerBadge.innerText = `⏳ 5s`;
  if (pBar) pBar.style.width = '0%';
  if (claimBtn) {
    claimBtn.disabled = true;
    claimBtn.className = "bg-slate-800 text-slate-500 font-sci text-xs px-4 py-2 rounded-xl cursor-not-allowed transition";
    claimBtn.innerText = "TRANSMITTING...";
  }

  modal.classList.remove('hidden');

  clearInterval(miningAdInterval);
  const startMs = Date.now();

  miningAdInterval = setInterval(() => {
    const elapsed = Date.now() - startMs;
    const pct = Math.min(100, (elapsed / remainingMs) * 100);
    if (pBar) pBar.style.width = `${pct}%`;

    const remSec = Math.max(0, Math.ceil((remainingMs - elapsed) / 1000));
    if (timerBadge) timerBadge.innerText = `⏳ ${remSec}s`;

    if (elapsed >= remainingMs) {
      clearInterval(miningAdInterval);
      if (timerBadge) timerBadge.innerText = "COMPLETED ✅";
      if (claimBtn) {
        claimBtn.disabled = false;
        claimBtn.className = "sci-btn bg-cyan-400 hover:bg-cyan-300 text-black font-sci font-black text-xs px-5 py-2.5 rounded-xl cursor-pointer animate-pulse shadow-glow-cyan";
        claimBtn.innerText = "CLAIM REWARD 🎉";
      }
    }
  }, 70);
};

let isMiningTycoonInit = false;
function initMiningTycoonGame() {
  if (isMiningTycoonInit) return;
  isMiningTycoonInit = true;

  // Collect Cryo-Canisters from Nora's depot
  const collectBtn = document.getElementById('mineCollectCanistersBtn');
  if (collectBtn) {
    collectBtn.addEventListener('click', (e) => {
      if (mineState.wall.canistersInCrate > 0) {
        const count = mineState.wall.canistersInCrate;
        mineState.coolant += count;
        mineState.wall.canistersInCrate = 0;
        miningAudio.playCryoHiss();
        spawnMineFloat(`+${count} Cryo-Canisters 🧪!`, e.clientX, e.clientY, 'text-sky-300');
        saveMineStateDebounced();
        updateMiningMiniStats();
        renderMiningTycoon();
      } else {
        spawnMineFloat('Condenser vats still charging...', e.clientX, e.clientY, 'text-slate-400');
      }
    });
  }

  // Convert 100 / All Shards
  const conv100 = document.getElementById('mineConvert100Btn');
  if (conv100) conv100.addEventListener('click', (e) => executeShardConversion(1, e));

  const convAll = document.getElementById('mineConvertAllBtn');
  if (convAll) {
    convAll.addEventListener('click', (e) => {
      const batches = Math.floor(mineState.shards / 100);
      if (batches >= 1) executeShardConversion(batches, e);
      else spawnMineFloat('Insufficient shards for 1 batch (100 req)!', e.clientX, e.clientY, 'text-slate-400');
    });
  }

  // Buy Seed Geode (+1 💎 Escalation)
  const buyGeodeBtn = document.getElementById('mineBuyGeodeDiamondBtn');
  if (buyGeodeBtn) {
    buyGeodeBtn.addEventListener('click', (e) => {
      const emptyTerrace = getEmptyUnlockedMineTerrace();
      if (!emptyTerrace) {
        spawnMineFloat('All excavated terraces occupied! Unlock deeper sectors.', e.clientX, e.clientY, 'text-rose-400');
        return;
      }

      if (mineState.diamonds >= mineState.geodeDiamondCost) {
        mineState.diamonds -= mineState.geodeDiamondCost;
        const paidPrice = mineState.geodeDiamondCost;
        mineState.geodeDiamondCost += 1;

        emptyTerrace.stage = 1;
        emptyTerrace.growthProgress = 0;
        emptyTerrace.thermalTimer = 50;

        miningAudio.playTone(660, 'sine', 0.18, 0.14);
        spawnMineFloat(`✨ Geode Infused in Terrace #${emptyTerrace.id} (-${paidPrice} 💎)!`, e.clientX, e.clientY, 'text-cyan-300');
        saveMineStateDebounced();
        renderMiningTycoon();
      } else {
        spawnMineFloat(`Need ${mineState.geodeDiamondCost} Diamonds! 💎`, e.clientX, e.clientY, 'text-rose-400');
      }
    });
  }

  // Buy Sonic Pickaxe (10 💎)
  const buyPickaxeBtn = document.getElementById('mineBuyPickaxeDiamondBtn');
  if (buyPickaxeBtn) {
    buyPickaxeBtn.addEventListener('click', (e) => {
      if (mineState.diamonds >= 10) {
        mineState.diamonds -= 10;
        mineState.pickaxes += 1;
        miningAudio.playTone(740, 'triangle', 0.2, 0.15);
        spawnMineFloat('+1 Sonic Pickaxe 🔨 (-10 💎)', e.clientX, e.clientY, 'text-rose-300');
        saveMineStateDebounced();
        renderMiningTycoon();
      } else {
        spawnMineFloat('Need 10 Diamonds for Sonic Pickaxe! 💎', e.clientX, e.clientY, 'text-rose-400');
      }
    });
  }

  // Buy Instant Cryo-Canister (2 💎)
  const buyCoolantBtn = document.getElementById('mineBuyCoolantDiamondBtn');
  if (buyCoolantBtn) {
    buyCoolantBtn.addEventListener('click', (e) => {
      if (mineState.diamonds >= 2) {
        mineState.diamonds -= 2;
        mineState.coolant += 1;
        miningAudio.playCryoHiss();
        spawnMineFloat('+1 Cryo-Canister 🧪 (-2 💎)', e.clientX, e.clientY, 'text-sky-300');
        saveMineStateDebounced();
        updateMiningMiniStats();
        renderMiningTycoon();
      } else {
        spawnMineFloat('Need 2 Diamonds for Cryo-Canister! 💎', e.clientX, e.clientY, 'text-rose-400');
      }
    });
  }

  // Buy Shards Cache (5 💎 for 250 Shards)
  const buyShardsBtn = document.getElementById('mineBuyShardsDiamondBtn');
  if (buyShardsBtn) {
    buyShardsBtn.addEventListener('click', (e) => {
      if (mineState.diamonds >= 5) {
        mineState.diamonds -= 5;
        mineState.shards += 250;
        miningAudio.playCrystalChime();
        spawnMineFloat('+250 Crystal Shards 🔮 (-5 💎)', e.clientX, e.clientY, 'text-cyan-300');
        saveMineStateDebounced();
        renderMiningTycoon();
      } else {
        spawnMineFloat('Need 5 Diamonds for Shards Cache! 💎', e.clientX, e.clientY, 'text-rose-400');
      }
    });
  }

  // Vapor Overdrive (8 💎 for 2x speed for 60s)
  const buyOverdriveBtn = document.getElementById('mineBuyOverdriveDiamondBtn');
  if (buyOverdriveBtn) {
    buyOverdriveBtn.addEventListener('click', (e) => {
      if (mineState.diamonds >= 8) {
        mineState.diamonds -= 8;
        mineState.wall.overdriveRemaining = Math.max(mineState.wall.overdriveRemaining, 0) + 60;
        miningAudio.playForgeHum();
        spawnMineFloat('⚡ 2x Vapor Overdrive Active (-8 💎)!', e.clientX, e.clientY, 'text-amber-300');
        saveMineStateDebounced();
        renderMiningTycoon();
      } else {
        spawnMineFloat('Need 8 Diamonds for Vapor Overdrive! 💎', e.clientX, e.clientY, 'text-rose-400');
      }
    });
  }

  // Cool All & Shatter All Slag
  const coolAll = document.getElementById('mineCoolAllBtn');
  if (coolAll) {
    coolAll.addEventListener('click', (e) => {
      let count = 0;
      mineState.terraces.forEach(t => {
        if (t.unlocked && t.stage === 2 && mineState.coolant > 0) {
          mineState.coolant -= 1;
          t.thermalTimer = Math.min(120, t.thermalTimer + 35);
          count++;
        }
      });
      if (count > 0) {
        miningAudio.playCryoHiss();
        spawnMineFloat(`Stabilized ${count} Gem Spires! 🧪`, e.clientX, e.clientY, 'text-sky-300');
        saveMineStateDebounced();
        updateMiningMiniStats();
        renderMiningTycoon();
      } else {
        spawnMineFloat('No active spires or no canisters in reserve!', e.clientX, e.clientY, 'text-slate-400');
      }
    });
  }

  const mineAllSlag = document.getElementById('mineMineAllSlagBtn');
  if (mineAllSlag) {
    mineAllSlag.addEventListener('click', (e) => {
      let cleared = 0;
      mineState.terraces.forEach(t => {
        if (t.unlocked && t.stage === 3 && mineState.pickaxes > 0) {
          mineState.pickaxes -= 1;
          t.stage = 0;
          t.growthProgress = 0;
          t.thermalTimer = 0;
          cleared++;
        }
      });
      if (cleared > 0) {
        miningAudio.playPickaxeClink();
        spawnMineFloat(`Shattered ${cleared} volcanic slag deposits! 🔨`, e.clientX, e.clientY, 'text-rose-300');
        saveMineStateDebounced();
        renderMiningTycoon();
      } else {
        spawnMineFloat('No overheated slag or no sonic pickaxes available!', e.clientX, e.clientY, 'text-slate-400');
      }
    });
  }

  // Claim Ad
  const adClaim = document.getElementById('mineAdClaimBtn');
  const adModal = document.getElementById('mineAdReelModal');
  if (adClaim) {
    adClaim.addEventListener('click', () => {
      if (activeMiningAdReward === 'geode') {
        const empty = getEmptyUnlockedMineTerrace();
        if (empty) {
          empty.stage = 1;
          empty.growthProgress = 0;
          empty.thermalTimer = 50;
          miningAudio.playTone(720, 'sine', 0.2, 0.2);
          spawnMineFloat(`🎁 Free Seed Geode Placed in Terrace #${empty.id}! ✨`, window.innerWidth / 2, window.innerHeight / 2, 'text-cyan-300');
        } else {
          mineState.diamonds += 1;
          spawnMineFloat('Terraces full! +1 💎 Compensated!', window.innerWidth / 2, window.innerHeight / 2, 'text-fuchsia-300');
        }
      } else if (activeMiningAdReward === 'pickaxe') {
        mineState.pickaxes += 1;
        miningAudio.playTone(850, 'sine', 0.2, 0.2);
        spawnMineFloat('🎁 1 Free Sonic Pickaxe 🔨 Claimed!', window.innerWidth / 2, window.innerHeight / 2, 'text-rose-300');
      }
      saveMineStateDebounced();
      renderMiningTycoon();
      if (adModal) adModal.classList.add('hidden');
      activeMiningAdReward = null;
    });
  }

  // Sound & Guide
  const soundBtn = document.getElementById('mineSoundBtn');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      miningAudio.muted = !miningAudio.muted;
      soundBtn.innerText = miningAudio.muted ? '🔇' : '🔊';
    });
  }

  const guideBtn = document.getElementById('mineGuideBtn');
  const rulesModal = document.getElementById('mineRulesModal');
  const closeRules1 = document.getElementById('mineCloseRulesBtn');
  const closeRules2 = document.getElementById('mineCloseRulesBtn2');

  if (guideBtn && rulesModal) guideBtn.addEventListener('click', () => rulesModal.classList.remove('hidden'));
  if (closeRules1 && rulesModal) closeRules1.addEventListener('click', () => rulesModal.classList.add('hidden'));
  if (closeRules2 && rulesModal) closeRules2.addEventListener('click', () => rulesModal.classList.add('hidden'));

  // Start simulation loop
  if (!mineRafRunning) {
    mineRafRunning = true;
    mineLastTime = performance.now();
    requestAnimationFrame(mineGameLoop);
  }
}

// Global Exports
window.initMiningTycoonGame = initMiningTycoonGame;
window.renderMiningTycoon = renderMiningTycoon;
window.updateMiningMiniStats = updateMiningMiniStats;

// Auto-run when script loads or DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initMiningTycoonGame();
    renderMiningTycoon();
  });
} else {
  initMiningTycoonGame();
  renderMiningTycoon();
}
