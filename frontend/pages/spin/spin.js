/* ==========================================================================
   LUCKY SPIN WHEEL MINI-GAME (pages/spin/spin.js)
   - 8 Precise Slices:
     0: ❌ Try Again
     1: 🟢 1 Green Fuel Cell
     2: 🟡 1 Yellow Fuel Cell
     3: 🔑 1 Winning Key
     4: ⚡ 10 Energy
     5: 🥚 1 Cyber Egg
     6: 🪙 10 Coins (2% Jackpot)
     7: ❌ Try Again
   - Mathematically exact pointer alignment at 12 o'clock
   - Dynamic 24-LED perimeter chaser ring
   - Realistic flapper tick audio & haptic feedback
   - Ticket inventory synchronization & Ad Ticket farming
   ========================================================================== */

const SPIN_PRIZES = [
  { label: '❌ Try Again', type: 'none', amount: 0, icon: '❌', rarity: 'common' },
  { label: '🟢 1 Green Fuel', type: 'green_fuel', amount: 1, icon: '🟢', rarity: 'green' },
  { label: '🟡 1 Yellow Fuel', type: 'yellow_fuel', amount: 1, icon: '🟡', rarity: 'epic' },
  { label: '🔑 1 Winning Key', type: 'keys', amount: 1, icon: '🔑', rarity: 'rare' },
  { label: '⚡ 10 Energy', type: 'energy', amount: 10, icon: '⚡', rarity: 'energy' },
  { label: '🥚 1 Cyber Egg', type: 'egg', amount: 1, icon: '🥚', rarity: 'egg' },
  { label: '🪙 10 Coins', type: 'coins', amount: 10, icon: '🪙', isJackpot: true, rarity: 'jackpot' },
  { label: '❌ Try Again', type: 'none', amount: 0, icon: '❌', rarity: 'common' }
];

// Initialize 24 circular LED Chaser Bulbs around the perimeter
function initSpinChaserBulbs() {
  const ring = document.getElementById('spinChaserRing');
  if (!ring) return;
  ring.innerHTML = ''; // Fresh render ensures exact placement

  const totalBulbs = 24;
  for (let i = 0; i < totalBulbs; i++) {
    const bulb = document.createElement('div');
    bulb.className = `chaser-bulb ${i % 2 === 0 ? '' : 'alt'}`;
    const angle = (i / totalBulbs) * 2 * Math.PI - (Math.PI / 2);
    // Percentage positioning from center 50% with radius 49.5%
    const leftPercent = 50 + 49.5 * Math.cos(angle);
    const topPercent = 50 + 49.5 * Math.sin(angle);
    bulb.style.left = `${leftPercent.toFixed(2)}%`;
    bulb.style.top = `${topPercent.toFixed(2)}%`;
    bulb.style.animationDelay = `${(i * 0.08).toFixed(2)}s`;
    ring.appendChild(bulb);
  }
}

// Synthesize realistic mechanical click sound for wheel pegs
function playWheelTickSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!window.wheelAudioCtx) window.wheelAudioCtx = new AudioCtx();
    const ctx = window.wheelAudioCtx;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(950 + Math.random() * 150, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.035);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.035);
  } catch (e) {}
}

// Unified Spin click handler (No Ads)
function handleSpinButtonClick() {
  if (gameState.rewardState && gameState.rewardState.isSpinning) return;
  const tickets = (gameState.player && gameState.player.chestTickets) || 0;
  if (tickets > 0) {
    spinLuckyWheel();
  } else {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('🎟️ You need 1 Spin Ticket! Complete goals or tap the reactor orb to earn tickets!');
    }
    if (typeof sfx !== 'undefined' && typeof sfx.playTapSound === 'function') {
      sfx.playTapSound(1);
    }
  }
}

// Update Ticket Balance header and Tab in Spin Page
function updateSpinTicketUI() {
  const countHeaderEl = document.getElementById('spinTicketHeaderCount');
  const countTabEl = document.getElementById('spinTicketCountVal');
  const tickets = (gameState.player && gameState.player.chestTickets) || 0;

  if (countHeaderEl) countHeaderEl.textContent = tickets.toString();
  if (countTabEl) countTabEl.textContent = tickets.toString();

  const btn = document.getElementById('btnSpinWheel');
  const btnIcon = document.getElementById('spinBtnIcon');
  const btnText = document.getElementById('spinBtnText');
  const centerHubLabel = document.getElementById('spinCenterHubLabel');

  const isSpinning = gameState.rewardState && gameState.rewardState.isSpinning;

  if (isSpinning) {
    if (btn) {
      btn.disabled = true;
      btn.className = 'spin-action-main-btn spin-mode';
    }
    if (btnIcon) btnIcon.textContent = '⚡';
    if (btnText) btnText.textContent = 'SPINNING WHEEL...';
    if (centerHubLabel) centerHubLabel.textContent = '...';
  } else if (tickets > 0) {
    if (btn) {
      btn.disabled = false;
      btn.className = 'spin-action-main-btn spin-mode';
    }
    if (btnIcon) btnIcon.textContent = '🎡';
    if (btnText) btnText.textContent = `SPIN THE WHEEL (${tickets} 🎫)`;
    if (centerHubLabel) centerHubLabel.textContent = 'SPIN';
  } else {
    // 0 tickets: no ad mode, friendly prompt
    if (btn) {
      btn.disabled = false;
      btn.className = 'spin-action-main-btn no-ticket-mode';
    }
    if (btnIcon) btnIcon.textContent = '🎟️';
    if (btnText) btnText.textContent = 'NEED 1 TICKET TO SPIN (0 🎫)';
    if (centerHubLabel) centerHubLabel.textContent = '0 🎫';
  }
}

// Trigger celebratory particle explosion for big wins
function triggerSpinConfetti() {
  const container = document.getElementById('pageSpin');
  if (!container) return;

  const colors = ['#f59e0b', '#fde047', '#38bdf8', '#10b981', '#a855f7', '#ec4899'];
  for (let i = 0; i < 28; i++) {
    const p = document.createElement('div');
    p.className = 'ambient-particle';
    const size = Math.random() * 8 + 4;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    p.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    p.style.left = `${Math.random() * 80 + 10}%`;
    p.style.top = '35%';
    p.style.position = 'absolute';
    p.style.zIndex = '30';
    p.style.opacity = '1';
    p.style.transform = `translate(${Math.random() * 160 - 80}px, ${Math.random() * -120 - 40}px) rotate(${Math.random() * 360}deg)`;
    p.style.transition = 'all 1.6s cubic-bezier(0.1, 0.8, 0.2, 1)';
    container.appendChild(p);

    setTimeout(() => {
      p.style.opacity = '0';
      p.style.transform = `translate(${Math.random() * 200 - 100}px, ${Math.random() * 150 + 100}px) scale(0.3)`;
      setTimeout(() => p.remove(), 1600);
    }, 50);
  }
}

// Master Lucky Wheel Spin Execution
function spinLuckyWheel() {
  if (gameState.rewardState.isSpinning) return;

  // Consume ticket if available
  if (gameState.player.chestTickets && gameState.player.chestTickets > 0) {
    gameState.player.chestTickets--;
  }

  gameState.rewardState.isSpinning = true;
  updateSpinTicketUI();
  sfx.playTapSound(3);

  // Daily Stats tracking
  if (typeof checkDailyStatsDate === 'function') checkDailyStatsDate();
  if (gameState.dailyStats) gameState.dailyStats.spins = (gameState.dailyStats.spins || 0) + 1;

  // Exact 2% Probability for 10 Coins Jackpot (slice index 6):
  // rand < 0.02 -> 10 Coins (strictly 2%)
  // rand >= 0.02 -> other 7 slices: [0, 1, 2, 3, 4, 5, 7]
  const rand = Math.random();
  let sliceIndex;
  if (rand < 0.02) {
    sliceIndex = 6;
  } else {
    const nonCoinSlices = [0, 1, 2, 3, 4, 5, 7];
    sliceIndex = nonCoinSlices[Math.floor(Math.random() * nonCoinSlices.length)];
  }

  const prize = SPIN_PRIZES[sliceIndex];

  // Mathematical rotation calculation:
  // Slices are laid out clockwise starting with slice 0 at 12 o'clock (0°).
  // Target angle: `(360 - sliceIndex * 45) % 360`
  const fullSpins = 6; // 6 fast full rotations
  const currentRotation = gameState.rewardState.spinRotation || 0;
  const targetRemainder = (360 - (sliceIndex * 45)) % 360;
  const currentRemainder = currentRotation % 360;
  let diff = targetRemainder - currentRemainder;
  if (diff <= 0) diff += 360;
  const newRotation = currentRotation + (fullSpins * 360) + diff;
  gameState.rewardState.spinRotation = newRotation;

  const wheelEl = document.getElementById('spinWheelCircle');
  const wheelFrame = document.getElementById('spinWheelFrame');
  const resultBox = document.getElementById('spinResultBox');
  const resultTag = document.getElementById('spinResultTag');
  const winIcon = document.getElementById('spinWinIcon');
  const winTitle = document.getElementById('spinWinTitle');
  const winDesc = document.getElementById('spinWinDesc');
  const pointer = document.getElementById('spinPointerArrow');

  if (wheelFrame) wheelFrame.classList.add('spinning-active');

  if (resultBox) {
    resultBox.className = 'spin-result-display';
  }
  if (resultTag) {
    resultTag.className = 'spin-result-badge spinning';
    resultTag.textContent = '⚡ SPINNING...';
  }
  if (winIcon) winIcon.textContent = '🎡';
  if (winTitle) winTitle.textContent = 'Wheel Accelerating...';
  if (winDesc) winDesc.textContent = 'Hold on tight! Randomizing prize slice...';

  // Realistic peg-flapper click rhythm (starts fast, slows down gradually)
  const tickDelays = [60, 60, 65, 70, 75, 85, 95, 110, 130, 155, 185, 225, 275, 335, 410, 500, 610];
  let accumulatedDelay = 0;
  tickDelays.forEach(delay => {
    accumulatedDelay += delay;
    setTimeout(() => {
      if (gameState.rewardState.isSpinning) {
        playWheelTickSound();
        if (pointer) {
          pointer.classList.remove('ticking');
          void pointer.offsetWidth; // Trigger reflow
          pointer.classList.add('ticking');
        }
        if (typeof triggerTelegramHaptic === 'function') triggerTelegramHaptic('light');
      }
    }, accumulatedDelay);
  });

  if (wheelEl) {
    wheelEl.style.transition = 'transform 3.8s cubic-bezier(0.12, 0.85, 0.2, 1)';
    wheelEl.style.transform = `rotate(${newRotation}deg)`;
  }

  setTimeout(() => {
    if (wheelFrame) wheelFrame.classList.remove('spinning-active');

    // Award prize
    if (prize.type === 'coins') {
      gameState.player.coins += prize.amount;
    } else if (prize.type === 'energy') {
      gameState.reactor.currentEnergy = (gameState.reactor.currentEnergy || 0) + prize.amount;
    } else if (prize.type === 'keys') {
      gameState.player.chestKeys = (gameState.player.chestKeys || 0) + prize.amount;
      if (gameState.goal) gameState.goal.currentKeys = Math.min(gameState.goal.targetKeys, (gameState.goal.currentKeys || 0) + prize.amount);
    } else if (prize.type === 'egg') {
      gameState.player.eggs = (gameState.player.eggs || 0) + prize.amount;
    } else if (prize.type === 'green_fuel') {
      gameState.energyGenerator.fuelCells.green = (gameState.energyGenerator.fuelCells.green || 0) + prize.amount;
    } else if (prize.type === 'yellow_fuel') {
      gameState.energyGenerator.fuelCells.yellow = (gameState.energyGenerator.fuelCells.yellow || 0) + prize.amount;
    }

    gameState.rewardState.isSpinning = false;

    if (prize.type === 'none') {
      sfx.playTapSound(1);
      if (resultBox) resultBox.className = 'spin-result-display miss-active';
      if (resultTag) {
        resultTag.className = 'spin-result-badge missed';
        resultTag.textContent = '❌ TRY AGAIN';
      }
      if (winIcon) winIcon.textContent = '❌';
      if (winTitle) winTitle.textContent = 'Missed This Time!';
      if (winDesc) winDesc.textContent = 'Better luck next spin! Tap the reactor orb or complete goals for more tickets!';
    } else {
      sfx.playLevelUpSound();
      triggerSpinConfetti();

      if (prize.isJackpot) {
        if (resultBox) resultBox.className = 'spin-result-display jackpot-active';
        if (resultTag) {
          resultTag.className = 'spin-result-badge jackpot';
          resultTag.textContent = '👑 GRAND JACKPOT!';
        }
        if (winIcon) winIcon.textContent = prize.icon;
        if (winTitle) winTitle.textContent = `JACKPOT: +${prize.label.toUpperCase()}!`;
        if (winDesc) winDesc.textContent = `Massive score! ${prize.label} credited straight to your balance!`;
      } else {
        if (resultBox) resultBox.className = 'spin-result-display winner-active';
        if (resultTag) {
          resultTag.className = 'spin-result-badge winner';
          resultTag.textContent = '🎉 WINNER!';
        }
        if (winIcon) winIcon.textContent = prize.icon;
        if (winTitle) winTitle.textContent = `+${prize.label.toUpperCase()}`;
        if (winDesc) winDesc.textContent = `${prize.label} successfully added to your inventory!`;
      }
    }

    updateSpinTicketUI();
    updateUI();
    saveGame();
    if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
      window.firebaseSync.saveToCloudImmediate();
    }
  }, 4000);
}

// Auto-initialize Chaser Bulbs on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initSpinChaserBulbs();
  updateSpinTicketUI();
});

// Global exports
window.initSpinChaserBulbs = initSpinChaserBulbs;
window.updateSpinTicketUI = updateSpinTicketUI;
window.spinLuckyWheel = spinLuckyWheel;
window.handleSpinButtonClick = handleSpinButtonClick;
