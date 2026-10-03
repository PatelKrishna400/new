/* ==========================================================================
   HOLOGRAPHIC SCRATCH CARD MINI-GAME (pages/scratch/scratch.js)
   - One Card Lucky Ticket with Realistic Metallic Gray Film Rub & Reveal
   - 3x3 Match-3 Alternate Mode
   ========================================================================== */

// 1. REWARD POOLS WITH EXACT PROBABILITIES (Diamonds removed per Req 8):
// 1-2 Keys (20%), 10-20 Eggs (50%), 1-2 Tickets (20%), 100-250 Coins (10%)
const SCRATCH_CARD_TIERS = [
  { type: 'keys', min: 1, max: 2, weight: 20, icon: '🔑', tier: 'KEY REWARD 🔑', tierColor: '#f59e0b', desc: 'Keys to unlock mystery chests!' },
  { type: 'egg', min: 10, max: 20, weight: 50, icon: '🥚', tier: 'EGG REWARD 🥚', tierColor: '#10b981', desc: 'Egg coins to hatch 12-Egg cyber prizes!' },
  { type: 'tickets', min: 1, max: 2, weight: 20, icon: '🎟️', tier: 'TICKET REWARD 🎟️', tierColor: '#ec4899', desc: 'Tickets to spin the lucky wheel!' },
  { type: 'coins', min: 100, max: 250, weight: 10, icon: '🪙', tier: 'GOLD COINS 🪙', tierColor: '#fbbf24', desc: 'Gold coins deposited to your balance!' }
];

function generateScratchReward() {
  const rand = Math.random() * 100;
  let cumulative = 0;
  let selected = SCRATCH_CARD_TIERS[0];
  for (const tier of SCRATCH_CARD_TIERS) {
    cumulative += tier.weight;
    if (rand < cumulative) {
      selected = tier;
      break;
    }
  }
  const amount = Math.floor(Math.random() * (selected.max - selected.min + 1)) + selected.min;
  let label = '';
  if (selected.type === 'keys') {
    label = `${amount} Key${amount > 1 ? 's' : ''}`;
  } else if (selected.type === 'egg') {
    label = `${amount} Eggs`;
  } else if (selected.type === 'tickets') {
    label = `${amount} Ticket${amount > 1 ? 's' : ''}`;
  } else if (selected.type === 'coins') {
    label = `${amount} Coin${amount > 1 ? 's' : ''}`;
  
  }

  return {
    type: selected.type,
    amount: amount,
    icon: selected.icon,
    tier: selected.tier,
    tierColor: selected.tierColor,
    label: label,
    desc: selected.desc
  };
}

const SINGLE_SCRATCH_REWARDS = SCRATCH_CARD_TIERS;
window.CHEST_AND_CARD_REWARDS = SCRATCH_CARD_TIERS;

// Single Card Runtime State
const singleCardState = {
  activeMode: 'single', // 'single' | 'grid'
  hasActiveTicket: false, // Must spend 1 card to activate ticket
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
  if (!singleCardState.hasActiveTicket || !singleCardState.currentReward) {
    renderLockedCardPlaceholder();
  }
  sfx.playTapSound(1);
}

// ==========================================================================
// 3. ONE CARD SCRATCH TICKET ENGINE
// ==========================================================================

// Deal a fresh Single Scratch Card (Strict Rule: requires 1 card!)
// Prepare a fresh scratch ticket covered in metallic gray foil
function prepareFreshScratchTicket() {
  singleCardState.hasActiveTicket = false; // Uses 1 coin upon first rub/scratch
  singleCardState.currentReward = generateScratchReward();
  singleCardState.serial = `#TKT-${Math.floor(10000 + Math.random() * 90000)}`;
  singleCardState.isRevealed = false;
  singleCardState.isScratching = false;
  singleCardState.scratchedPercent = 0;
  singleCardState.rubStrokeCount = 0;

  renderSingleRewardCard();
  initSingleScratchCanvas();
  requestAnimationFrame(() => {
    initSingleScratchCanvas();
  });
  updateScratchProgressUI(0);

  const statusEl = document.getElementById('singleScratchStatusText');
  if (statusEl) {
    statusEl.innerHTML = '🪙 Rub or scratch the gray foil to use 1 Card Coin and reveal your prize!';
  }
  updateScratchUI();
}

// Deal a fresh Single Scratch Card
function dealNewSingleCard(consumeCard = false) {
  const cards = gameState.player.scratchCards !== undefined ? gameState.player.scratchCards : (gameState.player.chestTickets || 0);

  if (cards <= 0) {
    singleCardState.hasActiveTicket = false;
    renderLockedCardPlaceholder();
    if (typeof showGameEntryRequirementModal === 'function') {
      showGameEntryRequirementModal('1 Scratch Card', '🎴', 'Scratch Card Fortune');
    } else if (typeof showFloatingToast === 'function') {
      showFloatingToast('🎴 You need 1 Scratch Card to play!');
    }
    const statusEl = document.getElementById('singleScratchStatusText');
    if (statusEl) {
      statusEl.innerHTML = '⚠️ <strong>No Scratch Cards!</strong> Earn cards to scratch.';
    }
    if (typeof triggerTelegramHaptic === 'function') triggerTelegramHaptic('error');
    updateScratchUI();
    return false;
  }

  prepareFreshScratchTicket();
  sfx.playTapSound(1);
  return true;
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
  if (tagEl) {
    tagEl.textContent = reward.tier || 'LUCKY WINNER!';
    tagEl.style.color = reward.tierColor || '#38bdf8';
  }

  const amountEl = document.getElementById('singleRewardAmount');
  if (amountEl) {
    if (reward.type === 'keys') {
      amountEl.textContent = `+${reward.amount} KEY${reward.amount > 1 ? 'S' : ''} 🔑`;
      amountEl.style.color = '#f59e0b';
    } else if (reward.type === 'egg') {
      amountEl.textContent = `+${reward.amount} EGGS 🥚`;
      amountEl.style.color = '#10b981';
    } else if (reward.type === 'tickets') {
      amountEl.textContent = `+${reward.amount} TICKET${reward.amount > 1 ? 'S' : ''} 🎟️`;
      amountEl.style.color = '#ec4899';
    } else if (reward.type === 'coins') {
      amountEl.textContent = `+${reward.amount} COIN${reward.amount > 1 ? 'S' : ''} 🪙`;
      amountEl.style.color = '#fbbf24';
    
    } else {
      amountEl.textContent = `+${reward.amount} ${reward.type.toUpperCase()}`;
      amountEl.style.color = reward.tierColor || '#fbbf24';
    }
  }

  const descEl = document.getElementById('singleRewardDesc');
  if (descEl) {
    if (reward.type === 'keys') {
      descEl.textContent = `+${reward.amount} Key${reward.amount > 1 ? 's' : ''} added to your inventory for mystery chests!`;
    } else if (reward.type === 'egg') {
      descEl.textContent = `+${reward.amount} Egg coins added to hatch 12-Egg cyber prizes!`;
    } else if (reward.type === 'tickets') {
      descEl.textContent = `+${reward.amount} Ticket${reward.amount > 1 ? 's' : ''} added to spin the lucky wheel!`;
    } else if (reward.type === 'coins') {
      descEl.textContent = `+${reward.amount} Gold coin${reward.amount > 1 ? 's' : ''} deposited to your vault!`;
    
    } else {
      descEl.textContent = reward.desc || reward.label;
    }
  }

  const stampEl = document.getElementById('singleRewardStamp');
  if (stampEl) {
    stampEl.classList.remove('visible');
    stampEl.textContent = 'REVEALED';
    stampEl.style.color = '#10b981';
    stampEl.style.borderColor = '#10b981';
  }
}

// ==========================================================================
// RENDER LOCKED CARD PLACEHOLDER (When user has not spent a card)
// ==========================================================================
function renderLockedCardPlaceholder() {
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
  ctx.globalCompositeOperation = 'source-over';
  canvas.classList.remove('cleared');

  // 1. Sleek Metallic Silver / Slate Foil Gradient
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0.0, '#1e293b');
  grad.addColorStop(0.2, '#475569');
  grad.addColorStop(0.4, '#94a3b8');
  grad.addColorStop(0.55, '#cbd5e1');
  grad.addColorStop(0.7, '#64748b');
  grad.addColorStop(1.0, '#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // 2. Micro Security Pattern
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  const spacing = 12;
  for (let x = -height; x < width + height; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + height, height);
    ctx.stroke();
  }

  // 3. Shimmer Border
  ctx.strokeStyle = 'rgba(236, 72, 153, 0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(6, 6, width - 12, height - 12);

  // 4. Center Hologram Locked Badge
  const cx = width / 2;
  const cy = height / 2;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(cx - 110, cy - 40, 220, 80, 16);
  } else {
    ctx.rect(cx - 110, cy - 40, 220, 80);
  }
  ctx.fill();
  ctx.strokeStyle = 'rgba(236, 72, 153, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Emblem Icon & Text
  ctx.font = '24px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🎴', cx, cy - 14);

  ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#fbcfe8';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 4;
  ctx.fillText('TAP "NEW TICKET" TO UNLOCK', cx, cy + 12);

  ctx.font = '8.5px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('Costs 1 Card • Instant Win Prizes', cx, cy + 26);
  ctx.shadowBlur = 0;

  // Update Status Text & Badges
  const statusEl = document.getElementById('singleScratchStatusText');
  if (statusEl) {
    statusEl.innerHTML = '🎴 <strong>Ticket Locked:</strong> Tap <strong>"NEW TICKET (1 CARD)"</strong> below to unlock and scratch!';
  }

  const tierBadge = document.getElementById('ticketTierBadge');
  if (tierBadge) {
    tierBadge.textContent = '🎴 1 CARD REQUIRED';
    tierBadge.style.color = '#f472b6';
    tierBadge.style.borderColor = '#f472b6';
  }

  const serialBadge = document.getElementById('ticketSerialText');
  if (serialBadge) serialBadge.textContent = '#TKT-LOCKED';

  updateScratchProgressUI(0);

  // Bind Events if needed
  if (!singleCardState.canvasInitialized) {
    bindScratchEvents(canvas);
    singleCardState.canvasInitialized = true;
  }
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
  grad.addColorStop(0.18, '#64748b');
  grad.addColorStop(0.38, '#94a3b8');
  grad.addColorStop(0.52, '#e2e8f0');
  grad.addColorStop(0.68, '#cbd5e1');
  grad.addColorStop(0.82, '#64748b');
  grad.addColorStop(1.0, '#1e293b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // 2. Micro Security Lattice Texture
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
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
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(6, 6, width - 12, height - 12);

  // 4. Central Foil Emblem Badge
  const cx = width / 2;
  const cy = height / 2;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(cx - 105, cy - 35, 210, 70, 14);
  } else {
    ctx.rect(cx - 105, cy - 35, 210, 70);
  }
  ctx.fill();
  ctx.strokeStyle = 'rgba(244, 114, 182, 0.7)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Emblem Icon & Text
  ctx.font = '22px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🪙', cx, cy - 10);

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

// Bind Modern Pointer & Touch Scratch Events
function bindScratchEvents(canvas) {
  let isDown = false;

  const getCanvasCoords = (e) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handlePointerDown = (e) => {
    // If ticket is not activated yet, spend 1 Card Coin upon first scratch!
    if (!singleCardState.hasActiveTicket) {
      const cards = gameState.player.scratchCards !== undefined ? gameState.player.scratchCards : (gameState.player.chestTickets || 0);
      if (cards <= 0) {
        if (typeof showFloatingToast === 'function') {
          showFloatingToast('🎴 You have 0 Scratch Cards! Tap reactor orb or complete goals to earn cards!');
        }
        const statusEl = document.getElementById('singleScratchStatusText');
        if (statusEl) {
          statusEl.innerHTML = '⚠️ <strong>No Card Coins!</strong> You need 1 Card Coin to scratch.';
        }
        if (typeof triggerTelegramHaptic === 'function') triggerTelegramHaptic('error');
        return;
      }

      // Consume 1 card coin for this scratch card
      if (gameState.player.scratchCards !== undefined) {
        gameState.player.scratchCards = Math.max(0, gameState.player.scratchCards - 1);
      } else {
        gameState.player.chestTickets = Math.max(0, (gameState.player.chestTickets || 0) - 1);
      }
      singleCardState.hasActiveTicket = true;
      singleCardState.cardCountedForDay = true;
      if (typeof checkDailyStatsDate === 'function') checkDailyStatsDate();
      if (gameState.dailyStats) gameState.dailyStats.scratches = (gameState.dailyStats.scratches || 0) + 1;
      sfx.playTapSound(2);
      updateScratchUI();
      updateUI();
      saveGame();
      if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
        window.firebaseSync.saveToCloudImmediate();
      }

      const statusEl = document.getElementById('singleScratchStatusText');
      if (statusEl) {
        statusEl.innerHTML = '🪙 1 Card Coin used! Rub to remove the gray foil and reveal your reward!';
      }
    }
    if (singleCardState.isRevealed) return;

    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (err) {}

    isDown = true;
    const { x, y } = getCanvasCoords(e);
    singleCardState.lastX = x;
    singleCardState.lastY = y;
    scratchAt(x, y, true);
  };

  const handlePointerMove = (e) => {
    if (!isDown || !singleCardState.hasActiveTicket || singleCardState.isRevealed) return;
    if (e.cancelable) e.preventDefault();
    const { x, y } = getCanvasCoords(e);
    scratchLine(singleCardState.lastX, singleCardState.lastY, x, y);
    singleCardState.lastX = x;
    singleCardState.lastY = y;
  };

  const handlePointerUp = (e) => {
    if (!isDown) return;
    isDown = false;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch (err) {}
    checkScratchCompletion();
  };

  canvas.addEventListener('pointerdown', handlePointerDown);
  canvas.addEventListener('pointermove', handlePointerMove);
  canvas.addEventListener('pointerup', handlePointerUp);
  canvas.addEventListener('pointercancel', handlePointerUp);

  // Fallback touch prevent default for smooth mobile rubbing
  canvas.addEventListener('touchstart', (e) => {
    if (e.cancelable) e.preventDefault();
  }, { passive: false });
}

// Erase a circular spot
function scratchAt(x, y, isStart = false) {
  if (!singleCardState.hasActiveTicket || singleCardState.isRevealed) return;

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
  ctx.arc(x, y, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  spawnScratchDust(x, y);

  if (isStart) {
    sfx.playTapSound(1);
  }
}

// Erase a continuous smooth line between two points with interpolation
function scratchLine(x1, y1, x2, y2) {
  if (!singleCardState.hasActiveTicket || singleCardState.isRevealed) return;
  const canvas = document.getElementById('scratchCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 4));

  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';

  // Smooth line stroke
  ctx.lineWidth = 48;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Circle stamps along the vector for 100% gapless rubbing
  for (let i = 0; i <= steps; i++) {
    const px = x1 + (dx * i) / steps;
    const py = y1 + (dy * i) / steps;
    ctx.beginPath();
    ctx.arc(px, py, 24, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  singleCardState.rubStrokeCount++;

  // Spawn flying metallic shavings & audio feedback periodically
  if (singleCardState.rubStrokeCount % 2 === 0) {
    spawnScratchDust(x2, y2);
  }
  if (singleCardState.rubStrokeCount % 6 === 0) {
    sfx.playTapSound(2);
    checkScratchCompletion();
  }
}

// Cached DOM references for high-speed rubbing loop
let _scratchDustLayer = null;
let _scratchProgressBar = null;
let _scratchProgressText = null;

// Flying silver & gold scratch dust particles
function spawnScratchDust(x, y) {
  if (!_scratchDustLayer) _scratchDustLayer = document.getElementById('scratchDustLayer');
  if (!_scratchDustLayer) return;

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

    _scratchDustLayer.appendChild(p);
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
  if (!_scratchProgressBar) _scratchProgressBar = document.getElementById('scratchProgressBar');
  if (!_scratchProgressText) _scratchProgressText = document.getElementById('scratchProgressText');

  if (_scratchProgressBar) _scratchProgressBar.style.width = `${percent}%`;
  if (_scratchProgressText) _scratchProgressText.textContent = `${percent}% Scratched`;
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
    if (reward.type === 'keys') {
      gameState.player.chestKeys = (gameState.player.chestKeys || 0) + reward.amount;
      if (gameState.goal) gameState.goal.currentKeys = Math.min(gameState.goal.targetKeys, (gameState.goal.currentKeys || 0) + reward.amount);
      sfx.playLevelUpSound();
      const statusEl = document.getElementById('singleScratchStatusText');
      if (statusEl) {
        statusEl.innerHTML = `🎉 <strong>WINNER!</strong> You revealed <strong>+${reward.amount} Key${reward.amount > 1 ? 's' : ''} 🔑</strong>!`;
      }
      if (typeof showFloatingToast === 'function') {
        showFloatingToast(`🎉 Scratch Card: Won +${reward.amount} Key${reward.amount > 1 ? 's' : ''} 🔑!`);
      }
    } else if (reward.type === 'egg') {
      gameState.player.eggs = (gameState.player.eggs || 0) + reward.amount;
      sfx.playLevelUpSound();
      const statusEl = document.getElementById('singleScratchStatusText');
      if (statusEl) {
        statusEl.innerHTML = `🎉 <strong>WINNER!</strong> You revealed <strong>+${reward.amount} Eggs 🥚</strong>!`;
      }
      if (typeof showFloatingToast === 'function') {
        showFloatingToast(`🎉 Scratch Card: Won +${reward.amount} Eggs 🥚!`);
      }
    } else if (reward.type === 'tickets') {
      gameState.player.chestTickets = (gameState.player.chestTickets || 0) + reward.amount;
      if (gameState.goal) gameState.goal.currentTickets = Math.min(gameState.goal.targetTickets, (gameState.goal.currentTickets || 0) + reward.amount);
      sfx.playLevelUpSound();
      const statusEl = document.getElementById('singleScratchStatusText');
      if (statusEl) {
        statusEl.innerHTML = `🎉 <strong>WINNER!</strong> You revealed <strong>+${reward.amount} Ticket${reward.amount > 1 ? 's' : ''} 🎟️</strong>!`;
      }
      if (typeof showFloatingToast === 'function') {
        showFloatingToast(`🎉 Scratch Card: Won +${reward.amount} Ticket${reward.amount > 1 ? 's' : ''} 🎟️!`);
      }
    } else if (reward.type === 'coins') {
      gameState.player.coins = (gameState.player.coins || 0) + reward.amount;
      sfx.playLevelUpSound();
      const statusEl = document.getElementById('singleScratchStatusText');
      if (statusEl) {
        statusEl.innerHTML = `🎉 <strong>WINNER!</strong> You revealed <strong>+${reward.amount} Coins 🪙</strong>!`;
      }
      if (typeof showFloatingToast === 'function') {
        showFloatingToast(`🎉 Scratch Card: Won +${reward.amount} Coins 🪙!`);
      }
    }
  }

  // Once scratched and revealed, ticket is consumed and no longer active!
  singleCardState.hasActiveTicket = false;

  updateScratchUI();
  updateUI();
  saveGame();
  if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
    window.firebaseSync.saveToCloudImmediate();
  }
}

// Quick reveal button
function quickScratchSingleCard() {
  if (!singleCardState.hasActiveTicket || singleCardState.isRevealed) return;
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

// Initialize on page entry (Single Luxury Card Full Page View)
function initScratchPage() {
  singleCardState.activeMode = 'single';
  const cards = gameState.player.scratchCards !== undefined ? gameState.player.scratchCards : (gameState.player.chestTickets || 0);

  if (cards > 0 && (!singleCardState.currentReward || singleCardState.isRevealed)) {
    prepareFreshScratchTicket();
  } else if (!singleCardState.hasActiveTicket || !singleCardState.currentReward) {
    renderLockedCardPlaceholder();
  } else {
    setTimeout(() => {
      initSingleScratchCanvas();
    }, 50);
  }
  updateScratchUI();
}

function updateScratchUI() {
  const cards = gameState.player.scratchCards !== undefined ? gameState.player.scratchCards : (gameState.player.chestTickets || 0);
  const pillVal = document.getElementById('scratchCardsVal');
  if (pillVal) pillVal.textContent = cards.toString();

  const mainBtnLabel = document.getElementById('scratchMainBtnLabel');
  if (mainBtnLabel) {
    if (cards > 0) {
      mainBtnLabel.textContent = `🎴 NEW TICKET (${cards} CARDS)`;
    } else {
      mainBtnLabel.textContent = `⚠️ NEED 1 CARD (0 🎴)`;
    }
  }

  const nextBtnText = document.getElementById('btnNewCardText');
  if (nextBtnText) {
    if (cards > 0) {
      nextBtnText.textContent = `NEXT TICKET (${cards} 🎴)`;
    } else {
      nextBtnText.textContent = `NEED 1 CARD (0 🎴)`;
    }
  }
}

// Export functions to window
window.switchScratchMode = switchScratchMode;
window.dealNewSingleCard = dealNewSingleCard;
window.quickScratchSingleCard = quickScratchSingleCard;
window.resetScratchCard = resetScratchCard;
window.scratchTile = scratchTile;
window.renderLockedCardPlaceholder = renderLockedCardPlaceholder;
window.renderScratchGrid = renderScratchGrid;
window.initScratchPage = initScratchPage;
window.updateScratchUI = updateScratchUI;
window.singleCardState = singleCardState;


