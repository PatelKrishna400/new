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

// 6 Subtabs Switcher (All, Mega, Spin, Chest, Scratch, Egg)
function switchRewardSubtab(tabName) {
  if (!gameState.rewardState) gameState.rewardState = {};
  gameState.rewardState.activeSubtab = tabName;

  const tabs = ['all', 'mega', 'spin', 'chest', 'scratch', 'egg'];
  tabs.forEach(t => {
    const btn = document.getElementById(`rewardSubtab${t.charAt(0).toUpperCase() + t.slice(1)}`);
    if (btn) {
      if (t === tabName) btn.classList.add('active');
      else btn.classList.remove('active');
    }
  });

  const allCards = ['rewardTabMega', 'rewardTabSpin', 'rewardTabChest', 'rewardTabScratch', 'rewardTabEgg'];
  if (tabName === 'all') {
    allCards.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'flex';
    });
  } else {
    const cardMap = {
      mega: 'rewardTabMega',
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

  if (typeof sfx !== 'undefined' && typeof sfx.playTapSound === 'function') sfx.playTapSound(1);
  updateRewardViewUI();
}

// ==========================================================================
// RENDER LIVE ADMIN MEGA REWARDS SHELF (READS /mega_rewards FROM FIREBASE)
// ==========================================================================
function renderRewardAdminMegaShelf() {
  const shelf = document.getElementById('rewardAdminMegaShelf');
  if (!shelf) return;

  let allRewards = window.cloudMegaRewards || [];
  if (!allRewards || allRewards.length === 0) {
    try {
      const cached = localStorage.getItem('ENERGY_TAP_MEGA_REWARDS_CACHE_V1') || localStorage.getItem('ENERGY_TAP_MEGA_REWARDS_DATA_V1');
      if (cached) allRewards = JSON.parse(cached);
    } catch (e) {}
  }

  const activeRewards = (allRewards || []).filter(r => r && r.active !== false);
  const totalCount = activeRewards.length;

  const countEl = document.getElementById('rewardAdminItemCount');
  if (countEl) {
    countEl.textContent = `${totalCount} Listed`;
  }

  const playerDiamonds = (gameState.player && gameState.player.diamonds) ? gameState.player.diamonds : 0;

  if (totalCount === 0) {
    shelf.innerHTML = `
      <div class="admin-shelf-empty-box">
        <span style="font-size: 22px;">👑</span>
        <span style="font-weight: 800; color: #fbbf24; font-size: 13px;">9 Exclusive Mega Reward Categories Live</span>
        <span style="font-size: 11px; color: #94a3b8; max-width: 280px; text-align: center;">Gift Cards, Gadgets, Gaming Gear, Studio, Kitchen & Custom VIP requests. Admin items appear here automatically!</span>
      </div>
    `;
    return;
  }

  // Display top items in a scrollable horizontal shelf
  let html = `
    <div class="admin-shelf-header-row">
      <span class="admin-shelf-title">🔥 Featured Live Rewards</span>
      <span class="admin-shelf-badge">${totalCount} Available</span>
    </div>
    <div class="admin-shelf-scroll">
  `;

  activeRewards.slice(0, 10).forEach(item => {
    const title = item.title || item.productName || item.name || 'Exclusive Reward';
    const catIcon = item.categoryIcon || '🎁';
    const catName = item.categoryName || item.category || 'Special';
    const cost = Number(item.diamonds !== undefined ? item.diamonds : item.diamondCost) || 100;
    const canAfford = playerDiamonds >= cost;
    const isOutOfStock = (item.stock !== undefined && item.stock <= 0);
    const imgUrl = item.imageUrl || item.image || item.img || '';
    const hasImage = imgUrl && imgUrl.length > 5;
    const stars = Number(item.buyerStar || item.stars || item.rating || 4.9).toFixed(1);

    html += `
      <div class="admin-shelf-card" onclick="if(typeof openRewardRedemptionModal==='function'){openRewardRedemptionModal('${item.id}');}">
        <div class="admin-shelf-card-top">
          <div class="admin-shelf-img">
            ${hasImage 
              ? `<img src="${imgUrl}" alt="${title}" style="width:100%;height:100%;border-radius:10px;object-fit:cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"><span style="display:none;">${catIcon}</span>`
              : `<span>${catIcon}</span>`
            }
          </div>
          <div class="admin-shelf-info">
            <span class="admin-shelf-cat-tag">${catName} • ⭐${stars}</span>
            <div class="admin-shelf-item-title" title="${title}">${title}</div>
          </div>
        </div>
        <div class="admin-shelf-card-bottom">
          <span class="admin-shelf-cost">💎 ${cost.toLocaleString()}</span>
          ${isOutOfStock ? `
            <span style="font-size: 10px; color: #ef4444; font-weight: 700;">Sold Out</span>
          ` : `
            <button class="admin-shelf-redeem-btn" onclick="event.stopPropagation(); if(typeof openRewardRedemptionModal==='function'){openRewardRedemptionModal('${item.id}');}">
              ${canAfford ? 'Redeem' : 'View'}
            </button>
          `}
        </div>
      </div>
    `;
  });

  html += `</div>`;
  shelf.innerHTML = html;
}

// ==========================================================================
function updateRewardViewUI() {
  const allCards = ['rewardTabMega', 'rewardTabSpin', 'rewardTabChest', 'rewardTabScratch', 'rewardTabEgg'];
  allCards.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'flex';
  });

  const coinBal = document.getElementById('rewardCoinsBal');
  if (coinBal) coinBal.textContent = formatNumber(gameState.player.coins);

  // Tab 1: Mega Rewards -> Diamonds Balance & Live Admin Shelf
  const playerDiamonds = (gameState.player && gameState.player.diamonds) ? gameState.player.diamonds : 0;
  const megaDiamonds = document.getElementById('rewardMegaDiamonds');
  if (megaDiamonds) megaDiamonds.textContent = `${playerDiamonds.toLocaleString()} 💎`;

  renderRewardAdminMegaShelf();

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

// Auto-refresh shelf when cloud mega rewards update
window.addEventListener('megaRewardsUpdated', () => {
  if (typeof updateRewardViewUI === 'function') {
    updateRewardViewUI();
  }
});

window.switchRewardSubtab = switchRewardSubtab;
window.updateRewardViewUI = updateRewardViewUI;
window.renderRewardAdminMegaShelf = renderRewardAdminMegaShelf;
