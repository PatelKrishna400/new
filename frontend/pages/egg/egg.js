/* ==========================================================================
   CYBER EGG HATCHERY MINI-GAME (pages/egg/egg.js)
   ========================================================================== */
// ==========================================================================
// 4. CYBER EGG HATCHERY MINI-GAME LOGIC (16-EGG SET • COLLECT 3 TO WIN)
// Rewards: Key, Ticket, Card, Coin (Coin win probability is strictly 2%)
// Winning: 3 Keys -> +1 Key | 3 Cards -> +1 Card | 3 Tickets -> +1 Ticket | 3 Coins -> +10 Coins
// Costs: 1 Egg Coin per egg hatch | Ads provide +1 Egg Coin
// As soon as first set of 3 is completed -> Claim reward, restart & reshuffle all 16 eggs!
// ==========================================================================

if (!gameState.eggHatchState) {
  gameState.eggHatchState = {
    eggs: [],
    collected: {
      key: 0,
      ticket: 0,
      card: 0,
      coin: 0
    },
    isHatching: false
  };
}

const EGG_HATCH_REWARDS = {
  coin: { type: 'coin', label: '10 Coins', icon: '🪙', isRare: true },
  key: { type: 'key', label: '1 Key', icon: '🔑' },
  ticket: { type: 'ticket', label: '1 Ticket', icon: '🎟️' },
  card: { type: 'card', label: '1 Card', icon: '🎴' }
};

// Generates a reward item for an egg with exact 2% Coin probability
function generateEggItem() {
  const rand = Math.random();
  // Strictly 2% chance for Coin
  if (rand < 0.02) {
    return EGG_HATCH_REWARDS.coin;
  } else if (rand < 0.3467) { // (100% - 2%) / 3 = 32.67%
    return EGG_HATCH_REWARDS.key;
  } else if (rand < 0.6733) {
    return EGG_HATCH_REWARDS.ticket;
  } else {
    return EGG_HATCH_REWARDS.card;
  }
}

// Shuffles and initializes a fresh 16-egg set
function shuffleEggs16(manual = false) {
  if (manual) sfx.playTapSound(1);

  const newEggs = [];
  for (let i = 0; i < 16; i++) {
    newEggs.push({
      id: i,
      item: generateEggItem(),
      revealed: false,
      hatching: false
    });
  }

  if (!gameState.eggHatchState) gameState.eggHatchState = {};
  gameState.eggHatchState.eggs = newEggs;
  gameState.eggHatchState.collected = {
    key: 0,
    ticket: 0,
    card: 0,
    coin: 0
  };
  gameState.eggHatchState.isHatching = false;

  renderEggPageContent();
  updateUI();
  saveGame();

  const statusText = document.getElementById('eggStatusText');
  if (statusText) {
    statusText.innerHTML = manual 
      ? '🔄 <strong>16 Fresh Cyber Eggs Shuffled!</strong> Tap any egg to hatch.'
      : 'Tap any egg to hatch (1 Egg Coin). First to collect 3 wins & reshuffles!';
  }

  if (manual && typeof showFloatingToast === 'function') {
    showFloatingToast('🔄 16 New Cyber Eggs Shuffled!');
  }
}

// Hatch an individual egg from the 16-egg grid
function hatchEggCell(index) {
  if (!gameState.eggHatchState || gameState.eggHatchState.isHatching) return;

  const egg = gameState.eggHatchState.eggs[index];
  if (!egg || egg.revealed || egg.hatching) return;

  // Check 1 Egg Coin cost
  const eggsAvailable = gameState.player.eggs !== undefined ? gameState.player.eggs : 0;
  if (eggsAvailable <= 0) {
    claimFreeEggByAd();
    return;
  }

  // Deduct 1 Egg Coin
  gameState.player.eggs = Math.max(0, eggsAvailable - 1);
  egg.hatching = true;
  gameState.eggHatchState.isHatching = true;
  sfx.playTapSound(3);

  // Daily Stats tracking
  if (typeof checkDailyStatsDate === 'function') checkDailyStatsDate();
  if (gameState.dailyStats) gameState.dailyStats.eggs = (gameState.dailyStats.eggs || 0) + 1;

  renderEggPageContent();

  setTimeout(() => {
    egg.hatching = false;
    egg.revealed = true;
    gameState.eggHatchState.isHatching = false;
    sfx.playTapSound(1);

    // Increment collection tracker for this item
    const itemType = egg.item.type;
    gameState.eggHatchState.collected[itemType] = (gameState.eggHatchState.collected[itemType] || 0) + 1;

    renderEggPageContent();

    // Check if 3 collected (first 3 to complete wins!)
    const count = gameState.eggHatchState.collected[itemType];
    const statusText = document.getElementById('eggStatusText');

    if (count >= 3) {
      // First set of 3 completed! Award respective prize
      sfx.playLevelUpSound();

      if (itemType === 'key') {
        gameState.player.chestKeys = (gameState.player.chestKeys || 0) + 1;
        if (gameState.goal) gameState.goal.currentKeys = Math.min(gameState.goal.targetKeys, (gameState.goal.currentKeys || 0) + 1);
        if (statusText) statusText.innerHTML = `🎉 <strong>3 KEYS COLLECTED!</strong> You won <strong>+1 Winning Key</strong>! Reshuffling 16 eggs...`;
        if (typeof showFloatingToast === 'function') showFloatingToast('🎉 3 Keys Collected! Won +1 Key!');
      } else if (itemType === 'ticket') {
        gameState.player.chestTickets = (gameState.player.chestTickets || 0) + 1;
        if (gameState.goal) gameState.goal.currentTickets = Math.min(gameState.goal.targetTickets, (gameState.goal.currentTickets || 0) + 1);
        if (statusText) statusText.innerHTML = `🎉 <strong>3 TICKETS COLLECTED!</strong> You won <strong>+1 Spin Ticket</strong>! Reshuffling 16 eggs...`;
        if (typeof showFloatingToast === 'function') showFloatingToast('🎉 3 Tickets Collected! Won +1 Ticket!');
      } else if (itemType === 'card') {
        if (gameState.player.scratchCards !== undefined) {
          gameState.player.scratchCards = (gameState.player.scratchCards || 0) + 1;
        } else {
          gameState.player.chestTickets = (gameState.player.chestTickets || 0) + 1;
        }
        if (statusText) statusText.innerHTML = `🎉 <strong>3 CARDS COLLECTED!</strong> You won <strong>+1 Scratch Card</strong>! Reshuffling 16 eggs...`;
        if (typeof showFloatingToast === 'function') showFloatingToast('🎉 3 Cards Collected! Won +1 Scratch Card!');
      } else if (itemType === 'coin') {
        gameState.player.coins = (gameState.player.coins || 0) + 10;
        if (statusText) statusText.innerHTML = `🎉 <strong>3 RARE COINS COLLECTED!</strong> You won <strong>+10 Coins</strong>! Reshuffling 16 eggs...`;
        if (typeof showFloatingToast === 'function') showFloatingToast('🎉 3 Rare Coins Collected! Won +10 Coins!');
      }

      updateUI();
      saveGame();

      // Restart and reshuffle all 16 eggs after small celebration delay
      setTimeout(() => {
        shuffleEggs16(false);
      }, 1600);
      return;
    }

    // Check if all 16 eggs revealed without reaching 3 (auto-reshuffle)
    const allRevealed = gameState.eggHatchState.eggs.every(e => e.revealed);
    if (allRevealed) {
      if (statusText) statusText.textContent = 'All 16 eggs hatched! Reshuffling fresh set...';
      setTimeout(() => {
        shuffleEggs16(false);
      }, 1400);
    } else {
      if (statusText) {
        statusText.innerHTML = `Hatched <strong>${egg.item.label}</strong>! (${gameState.eggHatchState.collected[itemType]}/3 Collected)`;
      }
    }

    updateUI();
    saveGame();
  }, 380);
}

// Render the 16-Egg Hatchery Page View
function renderEggPageContent() {
  const eggs = gameState.player.eggs !== undefined ? gameState.player.eggs : 0;

  const eggCountEl = document.getElementById('eggPageEggsCount');
  if (eggCountEl) eggCountEl.textContent = eggs;

  const eggAvail = document.getElementById('eggAvailableCoins');
  if (eggAvail) eggAvail.textContent = `${eggs} Egg${eggs === 1 ? '' : 's'}`;

  // Ensure 16 eggs initialized
  if (!gameState.eggHatchState || !gameState.eggHatchState.eggs || gameState.eggHatchState.eggs.length !== 16) {
    shuffleEggs16(false);
    return;
  }

  // Update Remaining Eggs Count Badge
  const unhatchedCount = gameState.eggHatchState.eggs.filter(e => !e.revealed).length;
  const remainEl = document.getElementById('eggRemainingGridText');
  if (remainEl) remainEl.textContent = `${unhatchedCount} / 16 Remaining`;

  // Update 4 Collection Counters & Pips
  const collected = gameState.eggHatchState.collected || { key: 0, ticket: 0, card: 0, coin: 0 };
  ['key', 'ticket', 'card', 'coin'].forEach(type => {
    const capitalized = type.charAt(0).toUpperCase() + type.slice(1);
    const countEl = document.getElementById(`eggCount${capitalized}`);
    if (countEl) countEl.textContent = collected[type] || 0;

    const pipsContainer = document.getElementById(`eggPips${capitalized}`);
    if (pipsContainer) {
      const val = collected[type] || 0;
      pipsContainer.innerHTML = `
        <span class="pip ${val >= 1 ? 'filled' : ''}"></span>
        <span class="pip ${val >= 2 ? 'filled' : ''}"></span>
        <span class="pip ${val >= 3 ? 'filled' : ''}"></span>
      `;
    }
  });

  // Render 16 Eggs in 4x4 Grid
  const gridEl = document.getElementById('eggGrid16');
  if (!gridEl) return;

  let html = '';
  gameState.eggHatchState.eggs.forEach((egg, idx) => {
    const isRevealed = egg.revealed;
    const isHatching = egg.hatching;

    html += `
      <div class="egg-cell-card ${isRevealed ? 'revealed' : ''} ${isHatching ? 'hatching' : ''}" onclick="hatchEggCell(${idx})">
        ${!isRevealed ? `
          <div class="egg-shell-visual">
            <div class="egg-shell-glow"></div>
            <div class="egg-shell-specular"></div>
            <div class="egg-shell-icon">🥚</div>
            <span class="egg-cost-pill">1 🥚</span>
          </div>
        ` : `
          <div class="egg-revealed-content">
            <span class="egg-prize-icon">${egg.item.icon}</span>
            <span class="egg-prize-label">${egg.item.label}</span>
          </div>
        `}
      </div>
    `;
  });

  gridEl.innerHTML = html;
}

// Watch ad to get 1 Free Egg Coin
function claimFreeEggByAd() {
  sfx.playTapSound(1);
  const doReward = () => {
    gameState.player.eggs = (gameState.player.eggs || 0) + 1;
    updateUI();
    saveGame();
    renderEggPageContent();
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('🥚 +1 Free Egg Coin Received!');
    }
  };

  if (typeof showRewardedAd === 'function') {
    showRewardedAd(doReward);
  } else if (typeof startAdSimulation === 'function') {
    startAdSimulation('egg', 'Cyber Hatchery Pass', '+1 Free Egg Coin', doReward);
  } else {
    doReward();
  }
}


window.renderEggPageContent = renderEggPageContent;
window.hatchEggCell = hatchEggCell;
window.shuffleEggs16 = shuffleEggs16;
window.claimFreeEggByAd = claimFreeEggByAd;
