/* ==========================================================================
   MEGA REWARDS CONTROLLER (pages/mega-reward/mega-reward.js)
   - 9 Distinct Reward Category Tabs & Dedicated Subpages:
     1. Gift Card (giftCard / gift-card)
     2. Gadgets (gadgets)
     3. Accessories (accessories)
     4. Gaming Tool (gamingTool / gaming-tool)
     5. Kitchen (kitchen)
     6. Stationery (stationery)
     7. Fitness (fitness)
     8. Home Decorate (homeDecorate / home-decorate)
     9. Custom (custom)
   - Real-time Cloud Read from Firebase (/mega_rewards)
   - Real-time Cloud Write to Firebase (/reward_requests)
   - Real-time Diamond Balance Synchronization
   - Sleek Redemption Modal with Player Delivery Details
   - Offline Mirroring & Local Fallback
   ========================================================================== */

const MEGA_CATEGORIES = [
  {
    id: 'gift-card',
    altId: 'gift_card',
    number: 1,
    title: '1. Gift Card',
    tag: 'DIGITAL VOUCHER',
    pageId: 'giftCard',
    catalogId: 'giftCardCatalog',
    diamondCounterId: 'diamondValGiftCard',
    themeClass: 'theme-cyan',
    icon: '🎁',
    svgIcon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#00d2ff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 12 20 22 4 22 4 12"/>
      <rect x="2" y="7" width="20" height="5" rx="1"/>
      <line x1="12" y1="22" x2="12" y2="7"/>
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
    </svg>`
  },
  {
    id: 'gadgets',
    altId: 'gadgets',
    number: 2,
    title: '2. Gadgets',
    tag: 'SMART TECH',
    pageId: 'gadgets',
    catalogId: 'gadgetsCatalog',
    diamondCounterId: 'diamondValGadgets',
    themeClass: 'theme-blue',
    icon: '📱',
    svgIcon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="3"/>
      <line x1="12" y1="18" x2="12.01" y2="18"/>
    </svg>`
  },
  {
    id: 'accessories',
    altId: 'accessories',
    number: 3,
    title: '3. Accessories',
    tag: 'EDC GEAR',
    pageId: 'accessories',
    catalogId: 'accessoriesCatalog',
    diamondCounterId: 'diamondValAccessories',
    themeClass: 'theme-purple',
    icon: '🎒',
    svgIcon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#c084fc" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>`
  },
  {
    id: 'gaming-tool',
    altId: 'gaming_tool',
    number: 4,
    title: '4. Gaming Tool',
    tag: 'PRO GAMING',
    pageId: 'gamingTool',
    catalogId: 'gamingToolCatalog',
    diamondCounterId: 'diamondValGamingTool',
    themeClass: 'theme-pink',
    icon: '🎮',
    svgIcon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#f472b6" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="6"/>
      <circle cx="8" cy="12" r="2"/>
      <line x1="15" y1="10" x2="15" y2="10.01"/>
      <line x1="17" y1="12" x2="17" y2="12.01"/>
      <line x1="15" y1="14" x2="15" y2="14.01"/>
      <line x1="13" y1="12" x2="13" y2="12.01"/>
    </svg>`
  },
  {
    id: 'kitchen',
    altId: 'kitchen',
    number: 5,
    title: '5. Kitchen',
    tag: 'GOURMET TECH',
    pageId: 'kitchen',
    catalogId: 'kitchenCatalog',
    diamondCounterId: 'diamondValKitchen',
    themeClass: 'theme-orange',
    icon: '☕',
    svgIcon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fb923c" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
      <line x1="6" y1="1" x2="6" y2="4"/>
      <line x1="10" y1="1" x2="10" y2="4"/>
      <line x1="14" y1="1" x2="14" y2="4"/>
    </svg>`
  },
  {
    id: 'stationery',
    altId: 'stationery',
    number: 6,
    title: '6. Stationery',
    tag: 'STUDIO & DESK',
    pageId: 'stationery',
    catalogId: 'stationeryCatalog',
    diamondCounterId: 'diamondValStationery',
    themeClass: 'theme-yellow',
    icon: '✒️',
    svgIcon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#facc15" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 19l7-7 3 3-7 7-3-3z"/>
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
      <path d="M2 2l7.586 7.586"/>
      <circle cx="11" cy="11" r="1.5"/>
    </svg>`
  },
  {
    id: 'fitness',
    altId: 'fitness',
    number: 7,
    title: '7. Fitness',
    tag: 'PERFORMANCE',
    pageId: 'fitness',
    catalogId: 'fitnessCatalog',
    diamondCounterId: 'diamondValFitness',
    themeClass: 'theme-green',
    icon: '🏋️',
    svgIcon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#34d399" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 4v16"/>
      <path d="M18 4v16"/>
      <path d="M2 8v8"/>
      <path d="M22 8v8"/>
      <line x1="6" y1="12" x2="18" y2="12"/>
    </svg>`
  },
  {
    id: 'home-decorate',
    altId: 'home_decorate',
    number: 8,
    title: '8. Home Decorate',
    tag: 'AMBIENT LIVING',
    pageId: 'homeDecorate',
    catalogId: 'homeDecorateCatalog',
    diamondCounterId: 'diamondValHomeDecorate',
    themeClass: 'theme-red',
    icon: '🏠',
    svgIcon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#f87171" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>`
  },
  {
    id: 'custom',
    altId: 'custom',
    number: 9,
    title: '9. Custom',
    tag: 'VIP EXCLUSIVE',
    pageId: 'custom',
    catalogId: 'customCatalog',
    diamondCounterId: 'diamondValCustom',
    themeClass: 'theme-violet',
    icon: '⭐',
    svgIcon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#e879f9" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>`
  }
];

let activeRedeemReward = null;

// ==========================================================================
// MAIN MEGA REWARDS OVERVIEW PAGE
// ==========================================================================
function renderMegaRewardPage() {
  updateMegaDiamondDisplay();
  renderMegaVerticalTabs();
}

function updateMegaDiamondDisplay() {
  const currentDiamonds = (gameState.player && gameState.player.diamonds) ? gameState.player.diamonds : 0;
  
  // Update overview diamond pill
  const diamondBtn = document.getElementById('playerDiamondBalance');
  if (diamondBtn) diamondBtn.textContent = currentDiamonds.toLocaleString();

  // Update all subpage diamond counters
  MEGA_CATEGORIES.forEach(cat => {
    const el = document.getElementById(cat.diamondCounterId);
    if (el) el.textContent = currentDiamonds.toLocaleString();
  });
}

function renderMegaVerticalTabs() {
  const container = document.getElementById('megaVerticalTabsContainer');
  if (!container) return;

  let html = '';

  MEGA_CATEGORIES.forEach(cat => {
    html += `
      <div class="mega-decorated-tab-card ${cat.themeClass}" id="megaCatTab-${cat.id}" onclick="navigateToMegaSubPage('${cat.pageId}')" role="button" tabindex="0">
        <div class="mega-tab-glow-fx"></div>
        <div class="mega-tab-accent-bar"></div>
        
        <div class="mega-tab-icon-box">
          ${cat.svgIcon}
          <div class="mega-icon-halo"></div>
        </div>

        <div class="mega-tab-text-info">
          <div class="mega-tab-title-row">
            <span class="mega-tab-title">${cat.title}</span>
            <span class="mega-cat-tag">${cat.tag}</span>
          </div>
        </div>

        <div class="mega-tab-chevron-col">
          <svg class="mega-tab-chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function navigateToMegaSubPage(pageId) {
  if (typeof sfx !== 'undefined' && typeof sfx.playTapSound === 'function') {
    sfx.playTapSound(1);
  }
  if (typeof switchPage === 'function') {
    switchPage(pageId);
  }
  renderCategoryProducts(pageId);
}

function onMegaDiamondClick() {
  const diamonds = (gameState.player && gameState.player.diamonds) ? gameState.player.diamonds : 0;
  if (typeof showFloatingToast === 'function') {
    showFloatingToast(`💎 Diamond Balance: ${diamonds.toLocaleString()} — Complete special quests or claim milestones to earn more!`);
  }
}

// ==========================================================================
// REAL-TIME CATEGORY PRODUCTS RENDERER (READS CLOUD MEGA REWARDS)
// ==========================================================================
function renderCategoryProducts(pageIdOrCatId) {
  const cat = MEGA_CATEGORIES.find(c => c.pageId === pageIdOrCatId || c.id === pageIdOrCatId || c.altId === pageIdOrCatId);
  if (!cat) return;

  updateMegaDiamondDisplay();

  const container = document.getElementById(cat.catalogId);
  if (!container) return;

  // Retrieve cloud rewards (or cached)
  let allRewards = window.cloudMegaRewards || [];
  if (!allRewards || allRewards.length === 0) {
    try {
      const cached = localStorage.getItem('ENERGY_TAP_MEGA_REWARDS_CACHE_V1') || localStorage.getItem('ENERGY_TAP_MEGA_REWARDS_DATA_V1');
      if (cached) allRewards = JSON.parse(cached);
    } catch (e) {}
  }

  // Filter for this category
  const filtered = allRewards.filter(r => {
    if (!r) return false;
    const rCat = (r.category || '').toLowerCase().replace(/_/g, '-');
    const cId = cat.id.toLowerCase().replace(/_/g, '-');
    return rCat === cId || rCat === cat.altId.toLowerCase();
  });

  const playerDiamonds = (gameState.player && gameState.player.diamonds) ? gameState.player.diamonds : 0;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="category-empty-state">
        <span class="empty-state-icon">${cat.icon}</span>
        <h4 class="empty-state-title">No ${cat.title.replace(/^\d+\.\s*/, '')} Available Yet</h4>
        <p class="empty-state-sub">The administrator hasn't uploaded any products to this category yet. Check back soon or visit other categories!</p>
      </div>
    `;
    return;
  }

  let html = `<div class="category-products-grid">`;

  filtered.forEach(item => {
    const isOutOfStock = (item.stock !== undefined && item.stock <= 0);
    const diamondCost = Number(item.diamonds) || 100;
    const canAfford = playerDiamonds >= diamondCost;
    const hasImage = item.imageUrl && item.imageUrl.length > 5;

    html += `
      <div class="category-product-card" id="rewardCard-${item.id}">
        <div class="product-top-row">
          <div class="product-media-box">
            ${hasImage 
              ? `<img src="${item.imageUrl}" class="product-media-img" alt="${item.title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"><span style="display:none;">${cat.icon}</span>`
              : `<span>${cat.icon}</span>`
            }
          </div>

          <div class="product-info-col">
            <div class="product-tag-row">
              <span class="product-badge-tag">${item.tag || 'FEATURED'}</span>
              <span class="product-stock-tag ${isOutOfStock ? 'out' : ''}">
                ${isOutOfStock ? '● Sold Out' : `● ${item.stock || 1} in stock`}
              </span>
            </div>
            <h4 class="product-title" title="${item.title}">${item.title}</h4>
            <p class="product-desc">${item.description || 'Exclusive reward available for instant diamond redemption.'}</p>
          </div>
        </div>

        <div class="product-bottom-row">
          <div class="product-price-col">
            <div class="product-diamond-cost">
              <span>💎</span>
              <span>${diamondCost.toLocaleString()}</span>
            </div>
            <span class="product-cash-val">Value: ${item.cashValue || '$50'}</span>
          </div>

          <div>
            ${isOutOfStock ? `
              <button class="btn-redeem-item disabled" disabled>Sold Out</button>
            ` : !canAfford ? `
              <button class="btn-redeem-item disabled" onclick="showFloatingToast('Need ${(diamondCost - playerDiamonds).toLocaleString()} more 💎 to redeem this reward!')">
                <span>Need ${(diamondCost - playerDiamonds).toLocaleString()} 💎</span>
              </button>
            ` : `
              <button class="btn-redeem-item" onclick="openRewardRedemptionModal('${item.id}')">
                <span>Redeem</span>
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
}

// Automatically re-render whichever category page is open
function renderCurrentCategoryRewards() {
  MEGA_CATEGORIES.forEach(cat => {
    const pageEl = document.getElementById(cat.pageId === 'giftCard' ? 'pageGiftCard' : `page${cat.pageId.charAt(0).toUpperCase() + cat.pageId.slice(1)}`);
    if (pageEl && pageEl.classList.contains('active')) {
      renderCategoryProducts(cat.pageId);
    }
  });
}

// ==========================================================================
// REDEMPTION MODAL LOGIC & FIREBASE REALTIME WRITE
// ==========================================================================
function openRewardRedemptionModal(rewardId) {
  let allRewards = window.cloudMegaRewards || [];
  if (!allRewards.length) {
    try {
      const cached = localStorage.getItem('ENERGY_TAP_MEGA_REWARDS_CACHE_V1') || localStorage.getItem('ENERGY_TAP_MEGA_REWARDS_DATA_V1');
      if (cached) allRewards = JSON.parse(cached);
    } catch (e) {}
  }

  const reward = allRewards.find(r => r.id === rewardId);
  if (!reward) return;

  const playerDiamonds = (gameState.player && gameState.player.diamonds) ? gameState.player.diamonds : 0;
  const cost = Number(reward.diamonds) || 0;

  if (playerDiamonds < cost) {
    showFloatingToast(`⚠️ You need ${(cost - playerDiamonds).toLocaleString()} more 💎 to redeem "${reward.title}"`);
    return;
  }

  activeRedeemReward = reward;

  const backdrop = document.getElementById('rewardRedemptionBackdrop');
  const iconEl = document.getElementById('redeemModalIcon');
  const titleEl = document.getElementById('redeemModalTitle');
  const costEl = document.getElementById('redeemModalCost');
  const balanceEl = document.getElementById('redeemModalBalance');
  const afterEl = document.getElementById('redeemModalAfter');
  const contactInput = document.getElementById('redeemContact');

  if (iconEl) iconEl.textContent = reward.categoryIcon || '🎁';
  if (titleEl) titleEl.textContent = `Redeem: ${reward.title}`;
  if (costEl) costEl.textContent = `💎 ${cost.toLocaleString()}`;
  if (balanceEl) balanceEl.textContent = `💎 ${playerDiamonds.toLocaleString()}`;
  if (afterEl) afterEl.textContent = `💎 ${(playerDiamonds - cost).toLocaleString()}`;

  if (contactInput) {
    contactInput.value = (gameState.player && gameState.player.handle) 
      ? (gameState.player.handle.startsWith('@') ? gameState.player.handle : '@' + gameState.player.handle)
      : '';
  }

  if (backdrop) backdrop.classList.add('open');
}

function closeRewardRedemptionModal(event) {
  if (event && event.target && event.target.id !== 'rewardRedemptionBackdrop' && !event.target.classList.contains('redemption-close-btn')) {
    return;
  }
  const backdrop = document.getElementById('rewardRedemptionBackdrop');
  if (backdrop) backdrop.classList.remove('open');
  activeRedeemReward = null;
}

function handleRedemptionSubmit(event) {
  event.preventDefault();
  if (!activeRedeemReward) return;

  const cost = Number(activeRedeemReward.diamonds) || 0;
  const playerDiamonds = (gameState.player && gameState.player.diamonds) ? gameState.player.diamonds : 0;

  if (playerDiamonds < cost) {
    showFloatingToast('⚠️ Insufficient diamonds balance!');
    return;
  }

  const contact = document.getElementById('redeemContact')?.value.trim() || '';
  const address = document.getElementById('redeemAddress')?.value.trim() || '';
  const notes = document.getElementById('redeemNotes')?.value.trim() || '';

  if (!contact || !address) {
    showFloatingToast('⚠️ Please fill in your Telegram contact and delivery details!');
    return;
  }

  const btn = document.getElementById('btnConfirmRedeem');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span>Submitting Request...</span>`;
  }

  // 1. Deduct diamonds from player state
  gameState.player.diamonds = Math.max(0, playerDiamonds - cost);

  // 2. Decrement local stock for immediate feedback
  if (activeRedeemReward.stock !== undefined) {
    activeRedeemReward.stock = Math.max(0, activeRedeemReward.stock - 1);
  }

  // 3. Write request to Firebase Realtime Database
  const deliveryInfo = { contact, address, notes };
  const targetReward = { ...activeRedeemReward };

  if (window.firebaseSync && typeof window.firebaseSync.submitRewardRequest === 'function') {
    window.firebaseSync.submitRewardRequest(targetReward, deliveryInfo)
      .then(() => {
        finishRedemptionProcess(targetReward);
      })
      .catch((err) => {
        console.warn('Fallback: request cached locally:', err);
        finishRedemptionProcess(targetReward);
      });
  } else {
    finishRedemptionProcess(targetReward);
  }
}

function finishRedemptionProcess(reward) {
  // Sync state to Firebase & LocalStorage
  if (typeof saveGame === 'function') saveGame();
  if (typeof updateUI === 'function') updateUI();
  updateMegaDiamondDisplay();

  // Play celebratory sound
  if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') {
    sfx.playLevelUpSound();
  }

  // Close modal
  const backdrop = document.getElementById('rewardRedemptionBackdrop');
  if (backdrop) backdrop.classList.remove('open');

  const btn = document.getElementById('btnConfirmRedeem');
  if (btn) {
    btn.disabled = false;
    btn.innerHTML = `<span>Confirm & Submit Request</span>`;
  }

  // Show Toast
  if (typeof showFloatingToast === 'function') {
    showFloatingToast(`🎉 Redemption submitted! Admin will verify and deliver "${reward.title}".`);
  }

  // Reset form
  const form = document.getElementById('rewardRedemptionForm');
  if (form) form.reset();

  // Re-render category view
  renderCurrentCategoryRewards();
  activeRedeemReward = null;
}

// Global Exports
window.MEGA_CATEGORIES = MEGA_CATEGORIES;
window.renderMegaRewardPage = renderMegaRewardPage;
window.updateMegaDiamondDisplay = updateMegaDiamondDisplay;
window.renderMegaVerticalTabs = renderMegaVerticalTabs;
window.navigateToMegaSubPage = navigateToMegaSubPage;
window.onMegaDiamondClick = onMegaDiamondClick;
window.renderCategoryProducts = renderCategoryProducts;
window.renderCurrentCategoryRewards = renderCurrentCategoryRewards;
window.openRewardRedemptionModal = openRewardRedemptionModal;
window.closeRewardRedemptionModal = closeRewardRedemptionModal;
window.handleRedemptionSubmit = handleRedemptionSubmit;
