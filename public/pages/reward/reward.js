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
    activeSubtab: 'all', // 'all'
    spinRotation: 0,
    isSpinning: false,
    isUnboxingChest: false,
    scratchTiles: [],
    scratchedCount: 0,
    scratchActive: false
  };
}

// 6 Subtabs Switcher (All, Vault, Spin, Chest, Scratch, Egg)
function switchRewardSubtab(tabName) {
  if (!gameState.rewardState) gameState.rewardState = {};
  gameState.rewardState.activeSubtab = tabName;

  const tabs = ['all', 'vault', 'spin', 'chest', 'scratch', 'egg'];
  tabs.forEach(t => {
    const btn = document.getElementById(`rewardSubtab${t.charAt(0).toUpperCase() + t.slice(1)}`);
    if (btn) {
      if (t === tabName) btn.classList.add('active');
      else btn.classList.remove('active');
    }
  });

  const allCards = ['rewardTabSpin', 'rewardTabChest', 'rewardTabScratch', 'rewardTabEgg'];
  if (tabName === 'all') {
    allCards.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'flex';
    });
  } else {
    const cardMap = {
      spin: 'rewardTabSpin',
      chest: 'rewardTabChest',
      scratch: 'rewardTabScratch',
      egg: 'rewardTabEgg'
    };
    const targetId = cardMap[tabName];
    allCards.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (id === targetId) {
          el.style.display = 'flex';
        } else {
          el.style.display = 'none';
        }
      }
    });

    if (targetId) {
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        targetEl.classList.add('pulse-highlight');
        setTimeout(() => targetEl.classList.remove('pulse-highlight'), 1200);
      }
    }
  }

  sfx.playTapSound(1);
  updateRewardViewUI();
}

// ==========================================================================
function updateRewardViewUI() {
  const allCards = ['rewardTabSpin', 'rewardTabChest', 'rewardTabScratch', 'rewardTabEgg'];
  allCards.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'flex';
  });

  const coinBal = document.getElementById('rewardCoinsBal');
  if (coinBal) coinBal.textContent = formatNumber(gameState.player.coins);

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
  if (chestAvail) chestAvail.textContent = `${keyCount}`;
  if (typeof updateChestUI === 'function') updateChestUI();

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
  const eggCountEl = document.getElementById('rewardEggCount') || document.getElementById('rewardEggCoins');
  if (eggCountEl) {
    eggCountEl.textContent = `${eggs} Egg${eggs === 1 ? '' : 's'}`;
  }
  const eggPageEggsCount = document.getElementById('eggPageEggsCount');
  if (eggPageEggsCount) {
    eggPageEggsCount.textContent = eggs;
  }

  if (gameState.currentTab === 'scratch' || gameState.rewardState.activeSubtab === 'scratch') {
    if (typeof initScratchPage === 'function') initScratchPage();
    else if (typeof renderScratchGrid === 'function') renderScratchGrid();
  }
  if (gameState.currentTab === 'egg') {
    renderEggPageContent();
  }
}


window.switchRewardSubtab = switchRewardSubtab;
window.updateRewardViewUI = updateRewardViewUI;
