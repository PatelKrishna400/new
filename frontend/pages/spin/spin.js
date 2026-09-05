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
   ========================================================================== */

const SPIN_PRIZES = [
  { label: '❌ Try Again', type: 'none', amount: 0, icon: '❌' },
  { label: '🟢 1 Green Fuel', type: 'green_fuel', amount: 1, icon: '🟢' },
  { label: '🟡 1 Yellow Fuel', type: 'yellow_fuel', amount: 1, icon: '🟡' },
  { label: '🔑 1 Winning Key', type: 'keys', amount: 1, icon: '🔑' },
  { label: '⚡ 10 Energy', type: 'energy', amount: 10, icon: '⚡' },
  { label: '🥚 1 Cyber Egg', type: 'egg', amount: 1, icon: '🥚' },
  { label: '🪙 10 Coins', type: 'coins', amount: 10, icon: '🪙', isJackpot: true },
  { label: '❌ Try Again', type: 'none', amount: 0, icon: '❌' }
];

function spinLuckyWheel() {
  if (gameState.rewardState.isSpinning) return;

  // Consume ticket if available, otherwise allow spinning freely
  if (gameState.player.chestTickets && gameState.player.chestTickets > 0) {
    gameState.player.chestTickets--;
  }

  gameState.rewardState.isSpinning = true;
  sfx.playTapSound(2);

  // Daily Stats tracking
  if (typeof checkDailyStatsDate === 'function') checkDailyStatsDate();
  if (gameState.dailyStats) gameState.dailyStats.spins = (gameState.dailyStats.spins || 0) + 1;

  // Exact 2% Probability for 10 Coins (slice index 6):
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
  // To rotate slice `sliceIndex` clockwise into the 12 o'clock pointer,
  // the wheel must land at an angle where `rotation % 360 === (360 - sliceIndex * 45) % 360`.
  const fullSpins = 5;
  const currentRotation = gameState.rewardState.spinRotation || 0;
  const targetRemainder = (360 - (sliceIndex * 45)) % 360;
  const currentRemainder = currentRotation % 360;
  let diff = targetRemainder - currentRemainder;
  if (diff <= 0) diff += 360;
  const newRotation = currentRotation + (fullSpins * 360) + diff;
  gameState.rewardState.spinRotation = newRotation;

  const wheelEl = document.getElementById('spinWheelCircle');
  const resultBox = document.getElementById('spinResultText');
  const btn = document.getElementById('btnSpinWheel');

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span>🎡 SPINNING WHEEL...</span>`;
  }
  if (resultBox) {
    resultBox.textContent = '🎡 Spinning lucky cyber wheel... Will you strike lucky?';
  }

  if (wheelEl) {
    wheelEl.style.transition = 'transform 3.8s cubic-bezier(0.12, 0.85, 0.2, 1)';
    wheelEl.style.transform = `rotate(${newRotation}deg)`;
  }

  setTimeout(() => {
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
      if (resultBox) {
        resultBox.innerHTML = `❌ <strong>Try Again!</strong> Better luck on your next spin!`;
      }
    } else {
      sfx.playLevelUpSound();
      if (resultBox) {
        resultBox.innerHTML = `🎉 WON: <strong>${prize.label}</strong>! Added to your inventory.`;
      }
      if (typeof showFloatingToast === 'function') {
        showFloatingToast(`🎉 Lucky Spin: Won ${prize.label}!`);
      }
    }

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span>🎡 SPIN THE WHEEL</span>`;
    }

    updateUI();
    saveGame();
  }, 4000);
}

// Global exports
window.spinLuckyWheel = spinLuckyWheel;
