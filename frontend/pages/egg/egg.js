/* ==========================================================================
   12-EGG CYBER HATCHERY MINI-GAME (pages/egg/egg.js)
   - 12 Eggs Interactive Set
   - 5 Prize Categories:
     * Keys (3 -> Win 1 Key)
     * Tickets (3 -> Win 1 Ticket)
     * Cards (3 -> Win 1 Card)
     * Coins (3 -> Win 1 Coin)
     * Blue Coins (3 -> Win 50 Blue Coins!)
   - Hatched one by one (1 Egg Coin per hatch).
   - In first 10 hatches: Random distribution of 2 of each category (none reaches 3).
   - On 11th hatch: 3rd matching item revealed -> Match-3 Victory Result Modal!
   ========================================================================== */

// 4 Reward Definitions with Winning Prizes & Odds
const EGG_HATCH_REWARDS = {
  key: { type: 'key', label: '1 Key', icon: '🔑', winAmount: 1, unit: 'Key', weight: 30 },
  ticket: { type: 'ticket', label: '1 Ticket', icon: '🎟️', winAmount: 1, unit: 'Ticket', weight: 30 },
  card: { type: 'card', label: '1 Card', icon: '🎴', winAmount: 1, unit: 'Card', weight: 20 },
  coin: { type: 'diamond', label: '25 Diamonds', icon: '💎', winAmount: 25, unit: 'Diamonds', weight: 20 }
};

if (!gameState.eggHatchState) {
  gameState.eggHatchState = {
    eggs: [],
    collected: {
      key: 0,
      ticket: 0,
      card: 0,
      coin: 0
    },
    hatchedCount: 0,
    targetWinner: 'coin',
    first8Items: [],
    gameCompleted: false,
    isHatching: false
  };
}

// Selects the winning reward category for this 12-egg round based on probability
function pickTargetWinningCategory() {
  const categories = ['key', 'ticket', 'card', 'coin'];
  const totalWeight = categories.reduce((sum, cat) => sum + (EGG_HATCH_REWARDS[cat].weight || 25), 0);
  let rand = Math.random() * totalWeight;

  for (const cat of categories) {
    const w = EGG_HATCH_REWARDS[cat].weight || 25;
    if (rand < w) {
      return cat;
    }
    rand -= w;
  }
  return 'coin';
}

// Fisher-Yates shuffle helper
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Shuffles and initializes a fresh 12-egg game
function shuffleEggs12(manual = false) {
  if (manual) sfx.playTapSound(1);

  // 1. Pick the guaranteed winning prize on hatch #9
  const targetWinner = pickTargetWinningCategory();

  // 2. Prepare first 8 items: exactly 2 of each of the 4 categories (2 * 4 = 8 items)
  // This guarantees that in the first 8 hatches, no item ever reaches 3!
  const base8 = [
    'key', 'key',
    'ticket', 'ticket',
    'card', 'card',
    'coin', 'coin'
  ];
  const shuffledFirst8 = shuffleArray(base8);

  // 3. Initialize 12 egg slots on the grid
  const newEggs = [];
  for (let i = 0; i < 12; i++) {
    newEggs.push({
      id: i,
      revealed: false,
      hatching: false,
      item: null
    });
  }

  // 4. Update Game State
  if (!gameState.eggHatchState) gameState.eggHatchState = {};
  gameState.eggHatchState.eggs = newEggs;
  gameState.eggHatchState.collected = {
    key: 0,
    ticket: 0,
    card: 0,
    coin: 0
  };
  gameState.eggHatchState.hatchedCount = 0;
  gameState.eggHatchState.targetWinner = targetWinner;
  gameState.eggHatchState.first8Items = shuffledFirst8;
  gameState.eggHatchState.gameCompleted = false;
  gameState.eggHatchState.isHatching = false;

  // Close win modal if open
  closeEggWinModal(false);

  renderEggPageContent();
  updateUI();
  saveGame();

  const statusText = document.getElementById('eggStatusText');
  if (statusText) {
    statusText.innerHTML = manual
      ? '🔄 <strong>12 Fresh Cyber Eggs Shuffled!</strong> Tap any egg to hatch.'
      : 'Tap eggs to hatch (1 Egg Coin). Reveal matching items to win match-3 prizes!';
  }

  if (manual && typeof showFloatingToast === 'function') {
    showFloatingToast('🔄 12 New Cyber Eggs Shuffled!');
  }
}

// Hatch an individual egg from the 12-egg grid
function hatchEggCell(index) {
  if (!gameState.eggHatchState || gameState.eggHatchState.isHatching) return;

  // If game is completed, prompt to claim or reshuffle
  if (gameState.eggHatchState.gameCompleted) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('🎉 Current 12-egg round completed! Tap Collect or Reshuffle to play again.');
    }
    return;
  }

  const egg = gameState.eggHatchState.eggs[index];
  if (!egg || egg.revealed || egg.hatching) return;

  // Check 1 Egg Coin cost (Req 11)
  const eggsAvailable = gameState.player.eggs !== undefined ? gameState.player.eggs : 0;
  if (eggsAvailable <= 0) {
    if (typeof showGameEntryRequirementModal === 'function') {
      showGameEntryRequirementModal('1 Egg Coin', '🥚', 'Egg Hatchery');
    } else if (typeof showFloatingToast === 'function') {
      showFloatingToast('🥚 You need 1 Egg Coin to hatch!');
    }
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

    // Determine the hatched item according to the 8-item base + 9th win rule:
    const hatchedCount = (gameState.eggHatchState.hatchedCount || 0) + 1;
    gameState.eggHatchState.hatchedCount = hatchedCount;

    let itemType = 'coin';

    if (hatchedCount <= 8) {
      // Draw from the pre-shuffled list of 8 items (2 of each category)
      const first8 = gameState.eggHatchState.first8Items || [];
      itemType = first8[hatchedCount - 1] || 'key';
    } else if (hatchedCount === 9) {
      // 9th hatch ALWAYS completes the target winning category (reaching 3/3)!
      itemType = gameState.eggHatchState.targetWinner || 'coin';
    } else {
      // Subsequent fallback if player continues
      itemType = gameState.eggHatchState.targetWinner || 'coin';
    }

    const rewardDef = EGG_HATCH_REWARDS[itemType] || EGG_HATCH_REWARDS.coin;
    egg.item = rewardDef;

    // Increment collection tracker for this category
    if (!gameState.eggHatchState.collected) {
      gameState.eggHatchState.collected = { key: 0, ticket: 0, card: 0, coin: 0 };
    }
    gameState.eggHatchState.collected[itemType] = Math.min(3, (gameState.eggHatchState.collected[itemType] || 0) + 1);

    renderEggPageContent();

    const count = gameState.eggHatchState.collected[itemType];
    const statusText = document.getElementById('eggStatusText');

    // If 9th egg hatched OR any item reaches 3 -> MATCH-3 VICTORY!
    if (hatchedCount === 9 || count >= 3) {
      triggerEggWinCelebration(itemType, rewardDef);
      return;
    }

    if (statusText) {
      statusText.innerHTML = `Hatched <strong>${rewardDef.icon} ${rewardDef.label}</strong>! (${count}/3) • Hatch #${hatchedCount}/9`;
    }

    updateUI();
    saveGame();
    if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
      window.firebaseSync.saveToCloudImmediate();
    }
  }, 380);
}

// Trigger the Match-3 Victory Result Modal & Credit the Reward
function triggerEggWinCelebration(itemType, rewardDef) {
  gameState.eggHatchState.gameCompleted = true;
  sfx.playLevelUpSound();

  // Req 13: 0.0001% (1 in 1,000,000) Diamond Jackpot chance
  if (typeof rollDiamondJackpot === 'function') {
    rollDiamondJackpot('egg_hatchery');
  }

  // 1. Credit the respective winning prize
  if (itemType === 'coin' || itemType === 'diamond') {
    gameState.player.diamonds = (gameState.player.diamonds || 0) + (rewardDef.winAmount || 25);
  } else if (itemType === 'key') {
    gameState.player.chestKeys = (gameState.player.chestKeys || 0) + 1;
    if (gameState.goal) gameState.goal.currentKeys = Math.min(gameState.goal.targetKeys, (gameState.goal.currentKeys || 0) + 1);
  } else if (itemType === 'ticket') {
    gameState.player.chestTickets = (gameState.player.chestTickets || 0) + 1;
    if (gameState.goal) gameState.goal.currentTickets = Math.min(gameState.goal.targetTickets, (gameState.goal.currentTickets || 0) + 1);
  } else if (itemType === 'card') {
    if (gameState.player.scratchCards !== undefined) {
      gameState.player.scratchCards = (gameState.player.scratchCards || 0) + 1;
    } else {
      gameState.player.chestTickets = (gameState.player.chestTickets || 0) + 1;
    }
  }

  // 2. Update Status Box
  const statusText = document.getElementById('eggStatusText');
  if (statusText) {
    statusText.innerHTML = `🎉 <strong>MATCH-3 VICTORY!</strong> You won <strong>+${rewardDef.label}</strong>!`;
  }

  if (typeof showFloatingToast === 'function') {
    showFloatingToast(`🎉 Match-3 Win! Won +${rewardDef.label}!`);
  }

  // 3. Display Match-3 Victory Modal
  const modal = document.getElementById('eggWinResultModal');
  const iconEl = document.getElementById('eggWinPrizeIcon');
  const titleEl = document.getElementById('eggWinPrizeTitle');
  const descEl = document.getElementById('eggWinPrizeDesc');

  if (iconEl) iconEl.textContent = rewardDef.icon;
  if (titleEl) titleEl.textContent = `YOU WON ${rewardDef.label.toUpperCase()}!`;
  if (descEl) descEl.textContent = `3 ${rewardDef.unit} collected! Reward added to your vault balance.`;

  if (modal) {
    modal.style.display = 'flex';
  }

  updateUI();
  saveGame();
  if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
    window.firebaseSync.saveToCloudImmediate();
  }
}

// Close Match-3 Victory Modal and optionally reshuffle fresh round
function closeEggWinModal(autoReshuffle = true) {
  const modal = document.getElementById('eggWinResultModal');
  if (modal) {
    modal.style.display = 'none';
  }
  if (autoReshuffle) {
    sfx.playTapSound(1);
    shuffleEggs12(false);
  }
}

let _eggPipsCache = null;

// Render the 12-Egg Hatchery Page View
function renderEggPageContent() {
  const isEggActive = (gameState.currentTab === 'egg') || (document.getElementById('pageEgg') && document.getElementById('pageEgg').classList.contains('active'));
  if (!isEggActive) return;

  const eggs = gameState.player.eggs !== undefined ? gameState.player.eggs : 0;

  const eggCountEl = document.getElementById('eggPageEggsCount');
  if (eggCountEl) eggCountEl.textContent = eggs;

  const eggAvail = document.getElementById('eggAvailableCoins');
  if (eggAvail) eggAvail.textContent = `${eggs} Egg${eggs === 1 ? '' : 's'}`;

  // Ensure 12 eggs initialized
  if (!gameState.eggHatchState || !gameState.eggHatchState.eggs || gameState.eggHatchState.eggs.length !== 12) {
    shuffleEggs12(false);
    return;
  }

  // Update Remaining Eggs Count Badge
  const unhatchedCount = gameState.eggHatchState.eggs.filter(e => !e.revealed).length;
  const remainEl = document.getElementById('eggRemainingGridText');
  if (remainEl) remainEl.textContent = `${unhatchedCount} / 12 Remaining`;

  // Initialize cached count and pip elements
  if (!_eggPipsCache) {
    _eggPipsCache = {};
    ['key', 'ticket', 'card', 'coin'].forEach(type => {
      const elementSuffix = type.charAt(0).toUpperCase() + type.slice(1);
      _eggPipsCache[type] = {
        countEl: document.getElementById(`eggCount${elementSuffix}`),
        pipsContainer: document.getElementById(`eggPips${elementSuffix}`)
      };
    });
  }

  // Update 4 Collection Counters & Pips
  const collected = gameState.eggHatchState.collected || { key: 0, ticket: 0, card: 0, coin: 0 };
  ['key', 'ticket', 'card', 'coin'].forEach(type => {
    const refs = _eggPipsCache[type];
    if (refs) {
      if (refs.countEl) refs.countEl.textContent = collected[type] || 0;
      if (refs.pipsContainer) {
        const val = collected[type] || 0;
        refs.pipsContainer.innerHTML = `
          <span class="pip ${val >= 1 ? 'filled' : ''}"></span>
          <span class="pip ${val >= 2 ? 'filled' : ''}"></span>
          <span class="pip ${val >= 3 ? 'filled' : ''}"></span>
        `;
      }
    }
  });

  // Render 12 Eggs in 4x3 Grid
  const gridEl = document.getElementById('eggGrid16');
  if (!gridEl) return;

  let html = '';
  gameState.eggHatchState.eggs.forEach((egg, idx) => {
    const isRevealed = egg.revealed;
    const isHatching = egg.hatching;
    const item = egg.item;

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
            <span class="egg-prize-icon">${item ? item.icon : '✨'}</span>
            <span class="egg-prize-label">${item ? item.label : 'Revealed'}</span>
          </div>
        `}
      </div>
    `;
  });

  gridEl.innerHTML = html;
}

function promptEggCoinsInfo() {
  if (typeof showFloatingToast === 'function') {
    showFloatingToast('🥚 Egg Coins can be earned by tapping the Reactor Orb, spinning the wheel, or claiming mystery chests!');
  }
}

// Export functions to window
window.renderEggPageContent = renderEggPageContent;
window.hatchEggCell = hatchEggCell;
window.shuffleEggs12 = shuffleEggs12;
window.shuffleEggs16 = shuffleEggs12; // Backwards compatible alias
window.closeEggWinModal = closeEggWinModal;
window.promptEggCoinsInfo = promptEggCoinsInfo;
