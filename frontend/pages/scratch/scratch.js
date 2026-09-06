/* ==========================================================================
   HOLOGRAPHIC SCRATCH CARD MINI-GAME (pages/scratch/scratch.js)
   - One Card Lucky Ticket with Realistic Metallic Gray Film Rub & Reveal
   - 3x3 Match-3 Alternate Mode
   ========================================================================== */

// 1. REWARD POOLS
const SINGLE_SCRATCH_REWARDS = [
  { label: "100 Coins", type: "coins", amount: 100, icon: "🪙", tier: "COMMONS TIER", tierColor: "#94a3b8", weight: 25 },
  { label: "250 Coins", type: "coins", amount: 250, icon: "🪙", tier: "UNCOMMON TIER", tierColor: "#38bdf8", weight: 20 },
  { label: "500 Coins", type: "coins", amount: 500, icon: "🪙", tier: "RARE TIER", tierColor: "#a855f7", weight: 15 },
  { label: "1,000 Coins", type: "coins", amount: 1000, icon: "🪙", tier: "EPIC TIER", tierColor: "#f43f5e", weight: 10 },
  { label: "5,000 Coins", type: "coins", amount: 5000, icon: "👑", tier: "👑 MEGA JACKPOT", tierColor: "#fbbf24", weight: 4 },
  { label: "25 Energy", type: "energy", amount: 25, icon: "⚡", tier: "ENERGY SURGE", tierColor: "#06b6d4", weight: 10 },
  { label: "50 Energy", type: "energy", amount: 50, icon: "⚡", tier: "SUPER CHARGE", tierColor: "#22d3ee", weight: 6 },
  { label: "2 Keys", type: "keys", amount: 2, icon: "🔑", tier: "VAULT UNLOCK", tierColor: "#f59e0b", weight: 6 },
  { label: "1 Cyber Egg", type: "egg", amount: 1, icon: "🥚", tier: "HATCHERY BOUNTY", tierColor: "#10b981", weight: 4 },
];

if (typeof CHEST_AND_CARD_REWARDS === "undefined") {
  window.CHEST_AND_CARD_REWARDS = [
    { label: "10 Coins", type: "coins", amount: 10, icon: "🪙" },
    { label: "10 Energy", type: "energy", amount: 10, icon: "⚡" },
    { label: "1 Key", type: "keys", amount: 1, icon: "🔑" },
    { label: "1 Egg", type: "egg", amount: 1, icon: "🥚" },
    { label: "1 Green Fuel", type: "green_fuel", amount: 1, icon: "🟢" },
    { label: "1 Yellow Fuel", type: "yellow_fuel", amount: 1, icon: "🟡" },
    { label: "1 Ticket", type: "tickets", amount: 1, icon: "🎟️" }
  ];
}

// Single Card Runtime State
const singleCardState = {
  activeMode: 'single', // 'single' | 'grid'
  currentReward: null,
  serial: '#TKT-78491',
  isRevealed: false,
  isScratching: false,
  scratchedPercent: 0,
  cardCountedForDay: false,
  lastX: 0,
  lastY: 0,
  canvasInitialized: false,
  rubStrokeCount: 0
};

// ==========================================================================
// 2. MODE SWITCHER
// ==========================================================================
function switchScratchMode(mode = 'single') {
  singleCardState.activeMode = 'single';
  const singleArea = document.getElementById('scratchSingleCardArea');
  if (singleArea) singleArea.style.display = 'flex';
  if (!singleCardState.canvasInitialized || !singleCardState.currentReward) {
    dealNewSingleCard(false);
  }
  sfx.playTapSound(1);
}

// ==========================================================================
// 3. ONE CARD SCRATCH TICKET ENGINE
// ==========================================================================

// Deal a fresh Single Scratch Card
function dealNewSingleCard(consumeCard = false) {
  const cards = gameState.player.scratchCards !== undefined ? gameState.player.scratchCards : (gameState.player.chestTickets || 0);

  if (consumeCard) {
    if (cards <= 0) {
      buyScratchCardWithAd();
      return;
    }
    if (gameState.player.scratchCards !== undefined) {
      gameState.player.scratchCards = Math.max(0, gameState.player.scratchCards - 1);
    } else {
      gameState.player.chestTickets = Math.max(0, (gameState.player.chestTickets || 0) - 1);
    }
    sfx.playTapSound(2);

    // Daily Stats tracking
    if (typeof checkDailyStatsDate === 'function') checkDailyStatsDate();
    if (gameState.dailyStats) gameState.dailyStats.scratches = (gameState.dailyStats.scratches || 0) + 1;
    singleCardState.cardCountedForDay = true;
  } else {
    singleCardState.cardCountedForDay = false;
  }

  // Pick weighted random reward
  const totalWeight = SINGLE_SCRATCH_REWARDS.reduce((acc, r) => acc + r.weight, 0);
  let rand = Math.random() * totalWeight;
  let selected = SINGLE_SCRATCH_REWARDS[0];
  for (const reward of SINGLE_SCRATCH_REWARDS) {
    if (rand < reward.weight) {
      selected = reward;
      break;
    }
    rand -= reward.weight;
  }

  singleCardState.currentReward = selected;
  singleCardState.serial = `#TKT-${Math.floor(10000 + Math.random() * 90000)}`;
  singleCardState.isRevealed = false;
  singleCardState.isScratching = false;
  singleCardState.scratchedPercent = 0;
  singleCardState.rubStrokeCount = 0;

  // Render Underneath Secret Reward
  renderSingleRewardCard();

  // Draw Metallic Gray Film Canvas
  initSingleScratchCanvas();

  // Reset Progress & Status
  updateScratchProgressUI(0);
  const statusEl = document.getElementById('singleScratchStatusText');
  if (statusEl) {
    statusEl.innerHTML = '🪙 Rub or scratch the gray film to reveal your reward!';
  }

  updateUI();
  saveGame();
}

// Render Secret Reward underneath canvas
function renderSingleRewardCard() {
  const reward = singleCardState.currentReward;
  if (!reward) return;

  const serialEl = document.getElementById('ticketSerialText');
  if (serialEl) serialEl.textContent = singleCardState.serial;

  const tierEl = document.getElementById('ticketTierBadge');
  if (tierEl) {
    tierEl.textContent = reward.tier;
    tierEl.style.color = reward.tierColor || '#fbbf24';
    tierEl.style.borderColor = reward.tierColor || '#fbbf24';
  }

  const iconEl = document.getElementById('singleRewardIcon');
  if (iconEl) iconEl.textContent = reward.icon;

  const tagEl = document.getElementById('singleRewardTag');
  if (tagEl) tagEl.textContent = reward.tier;

  const amountEl = document.getElementById('singleRewardAmount');
  if (amountEl) amountEl.textContent = `+${reward.amount} ${reward.type.toUpperCase()}`;

  const descEl = document.getElementById('singleRewardDesc');
  if (descEl) descEl.textContent = reward.label;

  const stampEl = document.getElementById('singleRewardStamp');
  if (stampEl) stampEl.classList.remove('visible');
}

// Draw Metallic Gray Film on HTML5 Canvas
function initSingleScratchCanvas() {
  const canvas = document.getElementById('scratchCanvas');
  if (!canvas) return;

  const parent = canvas.parentElement;
  if (!parent) return;

  const rect = parent.getBoundingClientRect();
  const width = rect.width || 320;
  const height = rect.height || 190;
  const dpr = window.devicePixelRatio || 1;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  // Restore normal composite mode
  ctx.globalCompositeOperation = 'source-over';
  canvas.classList.remove('cleared');

  // 1. Metallic Silver/Gray Film Gradient
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0.0, '#334155');
  grad.addColorStop(0.2, '#64748b');
  grad.addColorStop(0.45, '#94a3b8');
  grad.addColorStop(0.55, '#cbd5e1');
  grad.addColorStop(0.75, '#475569');
  grad.addColorStop(1.0, '#1e293b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // 2. Micro Security Lattice Texture
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  const spacing = 10;
  for (let x = -height; x < width + height; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + height, height);
    ctx.stroke();
  }
  for (let x = -height; x < width + height; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, height);
    ctx.lineTo(x + height, 0);
    ctx.stroke();
  }

  // 3. Shimmer Border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 2;
  ctx.strokeRect(6, 6, width - 12, height - 12);

  // 4. Central Foil Emblem Badge
  const cx = width / 2;
  const cy = height / 2;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(cx - 100, cy - 35, 200, 70, 14) : ctx.rect(cx - 100, cy - 35, 200, 70);
  ctx.fill();
  ctx.strokeStyle = 'rgba(244, 114, 182, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Emblem Icon & Text
  ctx.font = '22px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🔒', cx, cy - 10);

  ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#f8fafc';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 4;
  ctx.fillText('✦ RUB OR SCRATCH HERE ✦', cx, cy + 16);
  ctx.shadowBlur = 0;

  // Bind Event Listeners once
  if (!singleCardState.canvasInitialized) {
    bindScratchEvents(canvas);
    singleCardState.canvasInitialized = true;
  }
}

// Bind Mouse & Touch scratch events
function bindScratchEvents(canvas) {
  let isDown = false;

  const getCanvasCoords = (e) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handleStart = (e) => {
    if (singleCardState.isRevealed) return;
    isDown = true;
    const { x, y } = getCanvasCoords(e);
    singleCardState.lastX = x;
    singleCardState.lastY = y;
    scratchAt(x, y, true);
  };

  const handleMove = (e) => {
    if (!isDown || singleCardState.isRevealed) return;
    if (e.cancelable) e.preventDefault(); // Stop mobile window scroll
    const { x, y } = getCanvasCoords(e);
    scratchLine(singleCardState.lastX, singleCardState.lastY, x, y);
    singleCardState.lastX = x;
    singleCardState.lastY = y;
  };

  const handleEnd = () => {
    if (!isDown) return;
    isDown = false;
    checkScratchCompletion();
  };

  canvas.addEventListener('mousedown', handleStart);
  window.addEventListener('mousemove', handleMove);
  window.addEventListener('mouseup', handleEnd);

  canvas.addEventListener('touchstart', handleStart, { passive: false });
  window.addEventListener('touchmove', handleMove, { passive: false });
  window.addEventListener('touchend', handleEnd);
  window.addEventListener('touchcancel', handleEnd);
}

// Erase a circular spot
function scratchAt(x, y, isStart = false) {
  const canvas = document.getElementById('scratchCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  if (!singleCardState.cardCountedForDay) {
    singleCardState.cardCountedForDay = true;
    if (typeof checkDailyStatsDate === 'function') checkDailyStatsDate();
    if (gameState.dailyStats) gameState.dailyStats.scratches = (gameState.dailyStats.scratches || 0) + 1;
  }

  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(x, y, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  spawnScratchDust(x, y);

  if (isStart) {
    sfx.playTapSound(1);
  }
}

// Erase a continuous smooth line between two points
function scratchLine(x1, y1, x2, y2) {
  const canvas = document.getElementById('scratchCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.lineWidth = 42;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();

  singleCardState.rubStrokeCount++;

  // Spawn flying metallic shavings & audio feedback periodically
  if (singleCardState.rubStrokeCount % 2 === 0) {
    spawnScratchDust(x2, y2);
  }
  if (singleCardState.rubStrokeCount % 8 === 0) {
    sfx.playTapSound(2);
    checkScratchCompletion();
  }
}

// Flying silver & gold scratch dust particles
function spawnScratchDust(x, y) {
  const dustLayer = document.getElementById('scratchDustLayer');
  if (!dustLayer) return;

  for (let i = 0; i < 3; i++) {
    const p = document.createElement('div');
    p.className = 'scratch-dust-particle';
    const size = Math.random() * 5 + 3;
    const isGold = Math.random() > 0.6;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.background = isGold ? '#fbbf24' : '#cbd5e1';
    p.style.boxShadow = isGold ? '0 0 6px #fbbf24' : '0 0 4px #cbd5e1';
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;

    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * 40 + 15;
    p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    p.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);

    dustLayer.appendChild(p);
    setTimeout(() => p.remove(), 520);
  }
}

// Calculate scratch percentage by sub-sampling transparent pixels
function checkScratchCompletion() {
  if (singleCardState.isRevealed) return;

  const canvas = document.getElementById('scratchCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  try {
    const width = canvas.width;
    const height = canvas.height;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    let transparentCount = 0;
    const stride = 16; // Sample every 16th pixel for silky 60fps performance
    let totalSampled = 0;

    for (let i = 3; i < data.length; i += stride * 4) {
      totalSampled++;
      if (data[i] === 0) {
        transparentCount++;
      }
    }

    const percent = Math.min(100, Math.round((transparentCount / totalSampled) * 100));
    singleCardState.scratchedPercent = percent;
    updateScratchProgressUI(percent);

    // If >= 48% rubbed off, automatically finish and reveal reward!
    if (percent >= 48) {
      completeSingleCardReveal();
    }
  } catch (e) {
    console.warn('Canvas scratch read error', e);
  }
}

// Update UI Progress Bar
function updateScratchProgressUI(percent) {
  const bar = document.getElementById('scratchProgressBar');
  const text = document.getElementById('scratchProgressText');

  if (bar) bar.style.width = `${percent}%`;
  if (text) text.textContent = `${percent}% Scratched`;
}

// Fully reveal reward and award prize
function completeSingleCardReveal() {
  if (singleCardState.isRevealed) return;
  singleCardState.isRevealed = true;
  singleCardState.scratchedPercent = 100;
  updateScratchProgressUI(100);

  // Clear gray film canvas with smooth fade
  const canvas = document.getElementById('scratchCanvas');
  if (canvas) {
    canvas.classList.add('cleared');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // Stamp badge
  const stampEl = document.getElementById('singleRewardStamp');
  if (stampEl) stampEl.classList.add('visible');

  // Claim the reward into player inventory
  const reward = singleCardState.currentReward;
  if (reward) {
    if (reward.type === 'coins') gameState.player.coins += reward.amount;
    else if (reward.type === 'energy') gameState.reactor.currentEnergy = (gameState.reactor.currentEnergy || 0) + reward.amount;
    else if (reward.type === 'keys') {
      gameState.player.chestKeys = (gameState.player.chestKeys || 0) + reward.amount;
      if (gameState.goal) gameState.goal.currentKeys = Math.min(gameState.goal.targetKeys, (gameState.goal.currentKeys || 0) + reward.amount);
    }
    else if (reward.type === 'egg') gameState.player.eggs = (gameState.player.eggs || 0) + reward.amount;
    else if (reward.type === 'tickets') gameState.player.chestTickets = (gameState.player.chestTickets || 0) + reward.amount;

    sfx.playLevelUpSound();

    const statusEl = document.getElementById('singleScratchStatusText');
    if (statusEl) {
      statusEl.innerHTML = `🎉 <strong>WINNER!</strong> You revealed <strong>${reward.label}</strong>!`;
    }

    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`🎉 Scratch Card: Won ${reward.label}!`);
    }
  }

  updateUI();
  saveGame();
}

// Quick reveal button
function quickScratchSingleCard() {
  if (singleCardState.isRevealed) return;
  if (!singleCardState.cardCountedForDay) {
    singleCardState.cardCountedForDay = true;
    if (typeof checkDailyStatsDate === 'function') checkDailyStatsDate();
    if (gameState.dailyStats) gameState.dailyStats.scratches = (gameState.dailyStats.scratches || 0) + 1;
  }
  sfx.playTapSound(3);
  completeSingleCardReveal();
}

// 3x3 Stubs redirecting to Single Card
function resetScratchCard(consumeCard = false) {
  dealNewSingleCard(consumeCard);
}

function renderScratchGrid() {
  dealNewSingleCard(false);
}

function scratchTile(index, event) {
  quickScratchSingleCard();
}

// Watch Ad to get 1 Free Scratch Card
function buyScratchCardWithAd() {
  sfx.playTapSound(1);
  const doReward = () => {
    if (gameState.player.scratchCards !== undefined) {
      gameState.player.scratchCards = (gameState.player.scratchCards || 0) + 1;
    } else {
      gameState.player.chestTickets = (gameState.player.chestTickets || 0) + 1;
    }
    updateUI();
    saveGame();
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('🎴 +1 Free Scratch Card Received!');
    }
  };

  if (typeof showRewardedAd === 'function') {
    showRewardedAd(doReward);
  } else if (typeof startAdSimulation === 'function') {
    startAdSimulation('scratch', 'Scratch Card Pass', '+1 Free Scratch Card', doReward);
  } else {
    doReward();
  }
}

// Initialize on page entry (Single Luxury Card Full Page View)
function initScratchPage() {
  singleCardState.activeMode = 'single';
  if (!singleCardState.currentReward) {
    dealNewSingleCard(false);
  } else {
    setTimeout(() => {
      initSingleScratchCanvas();
    }, 50);
  }
}

// Export functions to window
window.switchScratchMode = switchScratchMode;
window.dealNewSingleCard = dealNewSingleCard;
window.quickScratchSingleCard = quickScratchSingleCard;
window.resetScratchCard = resetScratchCard;
window.scratchTile = scratchTile;
window.buyScratchCardWithAd = buyScratchCardWithAd;
window.renderScratchGrid = renderScratchGrid;
window.initScratchPage = initScratchPage;
window.singleCardState = singleCardState;
