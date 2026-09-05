/* ==========================================================================
   REWARDS & BOUNTIES HUB (pages/reward/reward.js)
   ========================================================================== */
/* ==========================================================================
   REWARDS HUB & MINI-GAMES CONTROLLER (pages/reward/reward.js)
   - 4 Rectangle Subtabs: Vault / Streak, Spin Wheel, Mystery Chest, Scratch Card
   - Spin Wheel Engine (Ticket Balance Sync & 8-Prize Spinner)
   - Mystery Chest Engine (Winning Key Balance Sync & Unbox Loot)
   - Holographic Scratch Card Engine (Card Balance Sync & 3x3 Match Game)
   - Rewards Page UI Synchronization
   ========================================================================== */

if (!gameState.rewardState) {
  gameState.rewardState = {
    activeSubtab: 'vault', // 'vault' | 'spin' | 'chest' | 'scratch'
    spinRotation: 0,
    isSpinning: false,
    isUnboxingChest: false,
    scratchTiles: [],
    scratchedCount: 0,
    scratchActive: false
  };
}

// 4 Subtabs Switcher
function switchRewardSubtab(tabName) {
  gameState.rewardState.activeSubtab = tabName;

  // Subtab Button Active Classes
  const tabs = ['vault', 'spin', 'chest', 'scratch'];
  tabs.forEach(t => {
    const btn = document.getElementById(`rewardSubtab${t.charAt(0).toUpperCase() + t.slice(1)}`);
    const card = document.getElementById(`rewardTab${t.charAt(0).toUpperCase() + t.slice(1)}`);
    if (btn) {
      if (t === tabName) btn.classList.add('active');
      else btn.classList.remove('active');
    }
    if (card) {
      if (t === tabName) card.classList.add('active');
      else card.classList.remove('active');
    }
  });

  sfx.playTapSound(1);
  updateRewardViewUI();
}

// ==========================================================================
// MASTER REWARD UI SYNCHRONIZATION
// ==========================================================================
function updateRewardViewUI() {
  const curSubtab = (gameState.rewardState && gameState.rewardState.activeSubtab) || 'vault';
  const tabs = ['vault', 'spin', 'chest', 'scratch'];
  tabs.forEach(t => {
    const btn = document.getElementById(`rewardSubtab${t.charAt(0).toUpperCase() + t.slice(1)}`);
    const card = document.getElementById(`rewardTab${t.charAt(0).toUpperCase() + t.slice(1)}`);
    if (btn) {
      if (t === curSubtab) btn.classList.add('active');
      else btn.classList.remove('active');
    }
    if (card) {
      if (t === curSubtab) card.classList.add('active');
      else card.classList.remove('active');
    }
  });

  const coinBal = document.getElementById('rewardCoinsBal');
  if (coinBal) coinBal.textContent = formatNumber(gameState.player.coins);

  // Tab 1: Vault / Streak
  const rectCoins = document.getElementById('rewardRectCoins');
  if (rectCoins) rectCoins.textContent = formatNumber(gameState.player.coins);

  const rectEnergy = document.getElementById('rewardRectEnergy');
  if (rectEnergy) {
    const curEnergy = gameState.reactor.currentEnergy || 0;
    rectEnergy.textContent = Math.floor(curEnergy).toString();
  }

  const rectStreak = document.getElementById('rewardRectStreak');
  if (rectStreak) rectStreak.textContent = `${gameState.player.streakDays || 0} Days 🔥`;

  // Tab 2: Spinner -> Ticket Balance
  const ticketCount = gameState.player.chestTickets || 0;
  const spinTickets = document.getElementById('rewardSpinTickets');
  if (spinTickets) spinTickets.textContent = `${ticketCount} Tickets`;

  const spinTicketsVal = document.getElementById('spinTicketsVal');
  if (spinTicketsVal) spinTicketsVal.textContent = `${ticketCount}`;

  const spinAvail = document.getElementById('spinAvailableTickets');
  if (spinAvail) spinAvail.textContent = `${ticketCount} Ticket${ticketCount === 1 ? '' : 's'}`;

  // Tab 3: Chest -> Winning Key Balance
  const keyCount = gameState.player.chestKeys || 0;
  const chestKeys = document.getElementById('rewardChestKeys');
  if (chestKeys) chestKeys.textContent = `${keyCount} Keys`;

  const chestKeysVal = document.getElementById('chestKeysVal');
  if (chestKeysVal) chestKeysVal.textContent = `${keyCount}`;

  const chestAvail = document.getElementById('chestAvailableKeys');
  if (chestAvail) chestAvail.textContent = `${keyCount} Key${keyCount === 1 ? '' : 's'}`;

  // Tab 4: Scratch Card -> Card Balance
  const cardCount = gameState.player.scratchCards !== undefined ? gameState.player.scratchCards : ticketCount;
  const scratchCards = document.getElementById('rewardScratchCards');
  if (scratchCards) scratchCards.textContent = `${cardCount} Cards`;

  const scratchCardsVal = document.getElementById('scratchCardsVal');
  if (scratchCardsVal) scratchCardsVal.textContent = `${cardCount}`;

  const scratchAvail = document.getElementById('scratchAvailableCards');
  if (scratchAvail) scratchAvail.textContent = `${cardCount} Card${cardCount === 1 ? '' : 's'}`;

  // Tab 5: Hatching Egg -> Egg Count
  const eggs = gameState.player.eggs !== undefined ? gameState.player.eggs : 0;
  const eggCountEl = document.getElementById('rewardEggCount');
  if (eggCountEl) {
    eggCountEl.textContent = `${eggs} Egg${eggs === 1 ? '' : 's'}`;
  }
  const eggPageEggsCount = document.getElementById('eggPageEggsCount');
  if (eggPageEggsCount) {
    eggPageEggsCount.textContent = eggs;
  }

  if (gameState.currentTab === 'scratch' || gameState.rewardState.activeSubtab === 'scratch') {
    renderScratchGrid();
  }
  if (gameState.currentTab === 'egg') {
    renderEggPageContent();
  }
}


window.switchRewardSubtab = switchRewardSubtab;
window.updateRewardViewUI = updateRewardViewUI;
