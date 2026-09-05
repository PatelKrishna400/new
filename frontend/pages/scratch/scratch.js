/* ==========================================================================
   HOLOGRAPHIC SCRATCH CARD MINI-GAME (pages/scratch/scratch.js)
   ========================================================================== */
// Ensure chest and card reward pool is available
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
// ==========================================================================
// 3. HOLOGRAPHIC SCRATCH CARD MINI-GAME LOGIC (GRAY TAP COVER & GRAY FLAMES RUFF)
// ==========================================================================
function resetScratchCard(consumeCard = false) {
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
    gameState.rewardState.cardCountedForDay = true;
  } else {
    gameState.rewardState.cardCountedForDay = false;
  }

  // Generate 9 tiles with weighted random symbols from CHEST_AND_CARD_REWARDS
  const tiles = [];
  const willWin = Math.random() < 0.65;
  const winningSym = CHEST_AND_CARD_REWARDS[Math.floor(Math.random() * CHEST_AND_CARD_REWARDS.length)];

  for (let i = 0; i < 9; i++) {
    if (willWin && i < 3) {
      tiles.push({ ...winningSym, revealed: false, scratching: false });
    } else {
      const randSym = CHEST_AND_CARD_REWARDS[Math.floor(Math.random() * CHEST_AND_CARD_REWARDS.length)];
      tiles.push({ ...randSym, revealed: false, scratching: false });
    }
  }

  // Shuffle tiles
  tiles.sort(() => Math.random() - 0.5);

  gameState.rewardState.scratchTiles = tiles;
  gameState.rewardState.scratchedCount = 0;
  gameState.rewardState.scratchActive = true;

  renderScratchGrid();
  updateUI();
  saveGame();
}

function renderScratchGrid() {
  const grid = document.getElementById('scratchGrid9');
  if (!grid) return;

  if (!gameState.rewardState.scratchTiles || gameState.rewardState.scratchTiles.length === 0) {
    resetScratchCard(false);
    return;
  }

  let html = '';
  gameState.rewardState.scratchTiles.forEach((tile, index) => {
    html += `
      <div class="scratch-tile ${tile.revealed ? 'revealed' : ''} ${tile.scratching ? 'flame-burn' : ''}" onclick="scratchTile(${index}, event)">
        <div class="tile-hidden-face">
          <span class="tile-icon">${tile.icon}</span>
          <span class="tile-label">${tile.label}</span>
        </div>
        <!-- Gray Tap Cover with Metallic Foil Finish -->
        <div class="tile-cover-gray-foil">
          <div class="gray-foil-pattern"></div>
          <div class="gray-foil-emblem">
            <span class="foil-lock-icon">🔒</span>
            <span class="foil-tap-text">TAP & SCRATCH</span>
          </div>
          <!-- Gray Flame Burning Overlay (shown during ruff/burn) -->
          <div class="gray-flame-overlay">
            <div class="flame-particle p1"></div>
            <div class="flame-particle p2"></div>
            <div class="flame-particle p3"></div>
            <span class="flame-icon-burn">🔥</span>
          </div>
        </div>
      </div>
    `;
  });

  grid.innerHTML = html;

  const countEl = document.getElementById('scratchRevealedText');
  if (countEl) countEl.textContent = `${gameState.rewardState.scratchedCount} / 9 Scratched`;
}

function scratchTile(index, event) {
  const tile = gameState.rewardState.scratchTiles[index];
  if (!tile || tile.revealed || tile.scratching) return;

  // Ensure card play is counted for daily stats
  if (!gameState.rewardState.cardCountedForDay) {
    gameState.rewardState.cardCountedForDay = true;
    if (typeof checkDailyStatsDate === 'function') checkDailyStatsDate();
    if (gameState.dailyStats) gameState.dailyStats.scratches = (gameState.dailyStats.scratches || 0) + 1;
  }

  tile.scratching = true;
  sfx.playTapSound(3);

  // Trigger Gray Flame "ruff" burn animation
  const tileEls = document.querySelectorAll('.scratch-tile');
  if (tileEls[index]) {
    tileEls[index].classList.add('flame-burn');
  }

  setTimeout(() => {
    tile.scratching = false;
    tile.revealed = true;
    gameState.rewardState.scratchedCount++;
    sfx.playTapSound(1);

    renderScratchGrid();

    // Check for matches if 3 or more scratched
    const counts = {};
    gameState.rewardState.scratchTiles.filter(t => t.revealed).forEach(t => {
      counts[t.label] = (counts[t.label] || 0) + 1;
    });

    const statusText = document.getElementById('scratchStatusText');
    for (const [label, cnt] of Object.entries(counts)) {
      if (cnt >= 3 && !tile.awarded) {
        tile.awarded = true;
        const matchedSym = CHEST_AND_CARD_REWARDS.find(s => s.label === label);
        if (matchedSym) {
          if (matchedSym.type === 'coins') gameState.player.coins += matchedSym.amount;
          else if (matchedSym.type === 'energy') gameState.reactor.currentEnergy = (gameState.reactor.currentEnergy || 0) + matchedSym.amount;
          else if (matchedSym.type === 'keys') {
            gameState.player.chestKeys += matchedSym.amount;
            if (gameState.goal) gameState.goal.currentKeys = Math.min(gameState.goal.targetKeys, (gameState.goal.currentKeys || 0) + matchedSym.amount);
          }
          else if (matchedSym.type === 'egg') gameState.player.eggs = (gameState.player.eggs || 0) + matchedSym.amount;
          else if (matchedSym.type === 'green_fuel') gameState.energyGenerator.fuelCells.green = (gameState.energyGenerator.fuelCells.green || 0) + matchedSym.amount;
          else if (matchedSym.type === 'yellow_fuel') gameState.energyGenerator.fuelCells.yellow = (gameState.energyGenerator.fuelCells.yellow || 0) + matchedSym.amount;
          else if (matchedSym.type === 'tickets') gameState.player.chestTickets += matchedSym.amount;

          sfx.playLevelUpSound();
          if (statusText) {
            statusText.innerHTML = `🎉 MATCH 3 WIN! You won <strong>${matchedSym.label}</strong>!`;
          }
          updateUI();
          saveGame();
          return;
        }
      }
    }

    if (gameState.rewardState.scratchedCount >= 9) {
      if (statusText) statusText.textContent = 'Card complete! Tap below for a new scratch card.';
    }
  }, 380);
}

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


window.resetScratchCard = resetScratchCard;
window.scratchTile = scratchTile;
window.buyScratchCardWithAd = buyScratchCardWithAd;
window.renderScratchGrid = renderScratchGrid;
