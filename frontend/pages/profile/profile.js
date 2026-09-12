/* ==========================================================================
   PROFILE PAGE CONTROLLER (pages/profile/profile.js)
   - Two Tab Switcher: Profile Tab & Shop Tab
   - Profile Data & Avatar Editing (Pencil Logo & Camera trigger)
   - Shop Upgrades (Tap Power, Max Energy Tank, Instant 100% Recharge)
   - Shop Game Passes & Tickets (Spin Tickets, Chest Keys, Scratch Cards, Eggs)
   - Daily Free Supply Drop Package
   - Promo Code Generator ("profile_name_number")
   - Friend Promo Code Redemption (+10 Coins Win)
   - Firebase Real-Time Data Write Sync Display
   - Telegram Referral Sharing
   ========================================================================== */

// Avatar Presets for Profile Customization
const AVATAR_PRESETS = [
  { id: 'alex', name: 'Alex Vance', emoji: '⚡', grad1: '#3b82f6', grad2: '#1d4ed8', jacket: '#1e293b', shirt: '#2563eb' },
  { id: 'neo', name: 'Neo Cyber', emoji: '🟢', grad1: '#10b981', grad2: '#047857', jacket: '#0f291e', shirt: '#059669' },
  { id: 'nova', name: 'Solar Nova', emoji: '🟡', grad1: '#f59e0b', grad2: '#d97706', jacket: '#291e0a', shirt: '#d97706' },
  { id: 'valkyrie', name: 'Valkyrie', emoji: '🟣', grad1: '#ec4899', grad2: '#be185d', jacket: '#2d1225', shirt: '#db2777' },
  { id: 'phantom', name: 'Phantom', emoji: '🔮', grad1: '#8b5cf6', grad2: '#6d28d9', jacket: '#1e1438', shirt: '#7c3aed' },
  { id: 'titan', name: 'Titan Flame', emoji: '🔥', grad1: '#f97316', grad2: '#c2410c', jacket: '#30180d', shirt: '#ea580c' },
];

let selectedPresetId = gameState.player.avatarPreset || 'alex';

// Helper to generate Promo Code in format: "name_number"
function generatePromoCodeForPlayer(name) {
  const cleanName = (name || 'player').toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
  const randNum = Math.floor(1000 + Math.random() * 9000); // 4-digit number
  return `${cleanName}_${randNum}`;
}

// Ensure player has a promo code and usedPromoCodes list
if (!gameState.player.promoCode) {
  gameState.player.promoCode = generatePromoCodeForPlayer(gameState.player.name);
}
if (!gameState.player.usedPromoCodes) {
  gameState.player.usedPromoCodes = [];
}
if (!gameState.player.avatarPreset) {
  gameState.player.avatarPreset = 'alex';
}

// ==========================================================================
// TAB SWITCHER: PROFILE vs SHOP
// ==========================================================================
window.switchProfileSubtab = function(tabName) {
  const profileBtn = document.getElementById('subtabProfile');
  const shopBtn = document.getElementById('subtabShop');
  const profilePane = document.getElementById('paneProfile');
  const shopPane = document.getElementById('paneShop');

  if (profileBtn) profileBtn.classList.remove('active');
  if (shopBtn) shopBtn.classList.remove('active');
  if (profilePane) profilePane.classList.remove('active');
  if (shopPane) shopPane.classList.remove('active');

  if (tabName === 'shop') {
    if (shopBtn) shopBtn.classList.add('active');
    if (shopPane) shopPane.classList.add('active');
    updateShopUI();
  } else {
    if (profileBtn) profileBtn.classList.add('active');
    if (profilePane) profilePane.classList.add('active');
    updateProfileUI();
  }

  if (typeof sfx !== 'undefined' && typeof sfx.playTapSound === 'function') {
    sfx.playTapSound(1.2);
  }
};

window.openBlueTab = function() {
  if (typeof switchPage === 'function') {
    switchPage('profile');
  }
  setTimeout(() => {
    switchProfileSubtab('shop');
  }, 50);
};

// ==========================================================================
// EDIT PROFILE & AVATAR PRESET MODAL
// ==========================================================================
window.openEditProfileModal = function() {
  DOM.sheetTitle.textContent = 'Edit Profile & Avatar';
  selectedPresetId = gameState.player.avatarPreset || 'alex';

  const presetOptionsHtml = AVATAR_PRESETS.map(p => `
    <div class="avatar-preset-item ${p.id === selectedPresetId ? 'selected' : ''}" id="presetOption_${p.id}" onclick="chooseAvatarPreset('${p.id}')">
      <div class="preset-avatar-circle" style="background: linear-gradient(135deg, ${p.grad1}, ${p.grad2});">
        <span>${p.emoji}</span>
      </div>
      <span class="preset-name">${p.name}</span>
    </div>
  `).join('');

  DOM.sheetContent.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 14px; padding: 4px 0;">
      <!-- Avatar Preset Picker -->
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <label style="font-size: 12px; font-weight: 700; color: #94a3b8;">Choose Cyber Avatar Style</label>
        <div class="avatar-preset-grid">
          ${presetOptionsHtml}
        </div>
      </div>

      <!-- Display Name Input -->
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <label style="font-size: 12px; font-weight: 700; color: #94a3b8;">Display Name</label>
        <input type="text" id="editPlayerNameInput" value="${gameState.player.name}" style="background: rgba(15, 23, 42, 0.9); border: 1.5px solid rgba(56, 189, 248, 0.4); border-radius: 12px; padding: 10px 14px; font-family: var(--font-primary); font-size: 14px; font-weight: 700; color: #ffffff; outline: none;">
      </div>

      <!-- Telegram Handle Input -->
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <label style="font-size: 12px; font-weight: 700; color: #94a3b8;">Telegram Handle</label>
        <div style="position: relative; display: flex; align-items: center;">
          <span style="position: absolute; left: 14px; color: #0284c7; font-weight: 800;">@</span>
          <input type="text" id="editPlayerHandleInput" value="${gameState.player.handle || 'alex_blue'}" style="width: 100%; background: rgba(15, 23, 42, 0.9); border: 1.5px solid rgba(56, 189, 248, 0.4); border-radius: 12px; padding: 10px 14px 10px 32px; font-family: var(--font-primary); font-size: 14px; font-weight: 700; color: #38bdf8; outline: none;">
        </div>
      </div>

      <button class="feature-btn" onclick="saveProfileData()" style="padding: 12px; font-size: 14px; font-weight: 800; border-radius: 14px; margin-top: 6px;">Save Changes ✨</button>
    </div>
  `;
  DOM.modalBackdrop.classList.add('open');
};

window.chooseAvatarPreset = function(presetId) {
  selectedPresetId = presetId;
  AVATAR_PRESETS.forEach(p => {
    const el = document.getElementById(`presetOption_${p.id}`);
    if (el) {
      if (p.id === presetId) el.classList.add('selected');
      else el.classList.remove('selected');
    }
  });
  if (typeof sfx !== 'undefined' && typeof sfx.playTapSound === 'function') {
    sfx.playTapSound(1.5);
  }
};

window.applyAvatarPresetToElements = function(presetId) {
  const preset = AVATAR_PRESETS.find(p => p.id === presetId) || AVATAR_PRESETS[0];
  
  // Profile SVG gradient stops
  const pAvatarGrad = document.getElementById('pAvatarGrad');
  if (pAvatarGrad) {
    pAvatarGrad.innerHTML = `
      <stop offset="0%" stop-color="${preset.grad1}" />
      <stop offset="60%" stop-color="${preset.grad2}" />
      <stop offset="100%" stop-color="#0284c7" />
    `;
  }

  // Profile torso jacket
  const jacketPath = document.getElementById('avatarJacketPath');
  if (jacketPath) jacketPath.setAttribute('fill', preset.jacket);

  const shirtPath = document.getElementById('avatarInnerShirtPath');
  if (shirtPath) shirtPath.setAttribute('fill', preset.shirt);

  // Header Avatar SVG gradient
  const avatarGrad = document.getElementById('avatarGrad');
  if (avatarGrad) {
    avatarGrad.innerHTML = `
      <stop offset="0%" stop-color="${preset.grad1}" />
      <stop offset="50%" stop-color="${preset.grad2}" />
      <stop offset="100%" stop-color="#06b6d4" />
    `;
  }
};

window.saveProfileData = function() {
  const nameInput = document.getElementById('editPlayerNameInput');
  const handleInput = document.getElementById('editPlayerHandleInput');
  
  if (nameInput && nameInput.value.trim()) {
    const oldName = gameState.player.name;
    gameState.player.name = nameInput.value.trim();
    
    // Update promo code prefix if name changed
    if (oldName !== gameState.player.name) {
      const parts = (gameState.player.promoCode || '').split('_');
      const numPart = parts.length > 1 ? parts[1] : Math.floor(1000 + Math.random() * 9000);
      const cleanName = gameState.player.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
      gameState.player.promoCode = `${cleanName}_${numPart}`;
    }
  }

  if (handleInput && handleInput.value.trim()) {
    gameState.player.handle = handleInput.value.trim().replace(/^@/, '');
  }

  if (selectedPresetId) {
    gameState.player.avatarPreset = selectedPresetId;
    applyAvatarPresetToElements(selectedPresetId);
  }

  if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') {
    sfx.playLevelUpSound();
  }

  updateUI();
  updateProfileUI();
  saveGame();
  
  // Real-time Firebase cloud write
  if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
    window.firebaseSync.saveToCloudImmediate();
  }
  
  closeTabModal();
};

// ==========================================================================
// SHOP LOGIC: UPGRADES, PASSES & FREE SUPPLY DROP
// ==========================================================================

window.showShopToast = function(msg, icon = '✨') {
  const toast = document.getElementById('shopToast');
  const msgEl = document.getElementById('shopToastMsg');
  const iconEl = document.getElementById('shopToastIcon');
  if (!toast) return;
  if (msgEl) msgEl.textContent = msg;
  if (iconEl) iconEl.textContent = icon;
  toast.classList.add('show');
  clearTimeout(window._shopToastTimer);
  window._shopToastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2400);
};

window.updateShopUI = function() {
  // Update Coin and Diamond display in Shop
  const coinEl = document.getElementById('shopCoinVal');
  if (coinEl) coinEl.textContent = formatNumber(gameState.player.coins);

  const diaEl = document.getElementById('shopDiamondVal');
  if (diaEl) diaEl.textContent = formatNumber(gameState.player.diamonds || 0);

  // Tap Power Upgrade info
  const tapPowerLvlEl = document.getElementById('shopTapPowerLvl');
  if (tapPowerLvlEl) tapPowerLvlEl.textContent = `Lv.${gameState.reactor.tapPower || 1}`;

  const tapPowerGainEl = document.getElementById('shopTapPowerGain');
  if (tapPowerGainEl) tapPowerGainEl.textContent = `+${(gameState.reactor.tapPower || 1) + 1} EP / tap`;

  const tapPowerPriceEl = document.getElementById('shopTapPowerPrice');
  if (tapPowerPriceEl) {
    const price = (gameState.reactor.tapPower || 1) * 50;
    tapPowerPriceEl.textContent = formatNumber(price);
  }

  // Max Energy Upgrade info
  const maxEnergyLvlEl = document.getElementById('shopMaxEnergyLvl');
  if (maxEnergyLvlEl) maxEnergyLvlEl.textContent = `${formatNumber(gameState.reactor.maxEnergy || 1000)} EP`;

  // Passes Inventory
  const spinTicketsEl = document.getElementById('shopOwnedTickets');
  if (spinTicketsEl) spinTicketsEl.textContent = formatNumber(gameState.player.chestTickets || 0);

  const keysEl = document.getElementById('shopOwnedKeys');
  if (keysEl) keysEl.textContent = formatNumber(gameState.player.chestKeys || 0);

  const scratchEl = document.getElementById('shopOwnedScratch');
  if (scratchEl) scratchEl.textContent = formatNumber(gameState.player.scratchCards || 0);

  const eggsEl = document.getElementById('shopOwnedEggs');
  if (eggsEl) eggsEl.textContent = formatNumber(gameState.player.eggs || 0);

  // Fuel Depot Inventory
  const fuelKeys = ['green', 'darkgreen', 'yellow', 'orange', 'red', 'pink', 'purple'];
  fuelKeys.forEach(ft => {
    const el = document.getElementById(`shopOwnedFuel_${ft}`);
    if (el) {
      const count = (gameState.energyGenerator && gameState.energyGenerator.fuelCells && gameState.energyGenerator.fuelCells[ft]) || 0;
      el.textContent = `${formatNumber(count)} Owned`;
    }
  });

  // Daily Free Supply Drop Status
  const freebieBtn = document.getElementById('btnClaimShopFreebie');
  const freebieText = document.getElementById('freebieBtnText');
  if (freebieBtn && freebieText) {
    const COOLDOWN_MS = 24 * 60 * 60 * 1000;
    const lastClaim = gameState.player.lastShopFreeClaim || 0;
    const now = Date.now();
    const diff = now - lastClaim;

    if (diff < COOLDOWN_MS) {
      freebieBtn.disabled = true;
      const rem = COOLDOWN_MS - diff;
      const hrs = Math.floor(rem / (1000 * 60 * 60));
      const mins = Math.floor((rem % (1000 * 60 * 60)) / (1000 * 60));
      freebieText.textContent = `⏳ NEXT IN ${hrs}h ${mins}m`;
    } else {
      freebieBtn.disabled = false;
      freebieText.textContent = `🎁 CLAIM FREE SUPPLY`;
    }
  }
};

window.buyReactorUpgrade = function(type) {
  if (type === 'tapPower') {
    const currentPower = gameState.reactor.tapPower || 1;
    const price = currentPower * 50;
    if (gameState.player.coins < price) {
      showShopToast(`Need ${price} Coins! Earn more in Tap`, '⚠️');
      if (typeof sfx !== 'undefined' && typeof sfx.playTapSound === 'function') sfx.playTapSound(0.5);
      return;
    }
    gameState.player.coins -= price;
    gameState.reactor.tapPower = currentPower + 1;
    if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') sfx.playLevelUpSound();
    showShopToast(`Tap Power Upgraded to Lv.${gameState.reactor.tapPower}!`, '⚡');
  } else if (type === 'maxEnergy') {
    const price = 100;
    if (gameState.player.coins < price) {
      showShopToast(`Need ${price} Coins for Max Energy!`, '⚠️');
      if (typeof sfx !== 'undefined' && typeof sfx.playTapSound === 'function') sfx.playTapSound(0.5);
      return;
    }
    gameState.player.coins -= price;
    gameState.reactor.maxEnergy = (gameState.reactor.maxEnergy || 1000) + 250;
    if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') sfx.playLevelUpSound();
    showShopToast(`Max Energy Expanded to ${formatNumber(gameState.reactor.maxEnergy)} EP!`, '🔋');
  } else if (type === 'refill') {
    const price = 35;
    if (gameState.player.coins < price) {
      showShopToast(`Need ${price} Coins for Supercharge!`, '⚠️');
      if (typeof sfx !== 'undefined' && typeof sfx.playTapSound === 'function') sfx.playTapSound(0.5);
      return;
    }
    gameState.player.coins -= price;
    gameState.reactor.currentEnergy = gameState.reactor.maxEnergy;
    if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') sfx.playLevelUpSound();
    showShopToast(`Energy Tank 100% Supercharged!`, '⚡');
  }

  updateUI();
  updateProfileUI();
  updateShopUI();
  saveGame();

  if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
    window.firebaseSync.saveToCloudImmediate();
  }
};

window.buyPassItem = function(itemType) {
  const itemsMap = {
    spinTicket: { cost: 25, prop: 'chestTickets', name: 'Lucky Spin Ticket', icon: '🎡' },
    chestKey: { cost: 50, prop: 'chestKeys', name: 'Mystery Chest Key', icon: '🔑' },
    scratchCard: { cost: 35, prop: 'scratchCards', name: 'Fortune Scratch Card', icon: '🎟️' },
    egg: { cost: 75, prop: 'eggs', name: 'Cyber Dragon Egg', icon: '🥚' }
  };

  const item = itemsMap[itemType];
  if (!item) return;

  if (gameState.player.coins < item.cost) {
    showShopToast(`Need ${item.cost} Coins for ${item.name}!`, '⚠️');
    if (typeof sfx !== 'undefined' && typeof sfx.playTapSound === 'function') sfx.playTapSound(0.5);
    return;
  }

  gameState.player.coins -= item.cost;
  gameState.player[item.prop] = (gameState.player[item.prop] || 0) + 1;

  if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') sfx.playLevelUpSound();
  showShopToast(`+1 ${item.name} added to vault!`, item.icon);

  updateUI();
  updateProfileUI();
  updateShopUI();
  saveGame();

  if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
    window.firebaseSync.saveToCloudImmediate();
  }
};

window.buyFuelInShop = function(fuelType, price, currency) {
  if (currency === 'diamonds') {
    window.buyFuelWithDiamonds(fuelType, price, 1);
  } else {
    window.buyFuelWithCoins(fuelType, price, 1);
  }
};

// 3-Way Fuel Purchase Engine (Ads: 1 cell; Coins: 5 cells; Diamonds: 10 cells)
window.buyFuelWithAds = function(fuelType, requiredAds, rewardCells) {
  const cells = rewardCells || 1;
  const ads = requiredAds || 1;

  if (typeof sfx !== 'undefined' && typeof sfx.playTapSound === 'function') {
    sfx.playTapSound(1.2);
  }

  const completeAdWatch = () => {
    if (!gameState.energyGenerator.fuelCells) {
      gameState.energyGenerator.fuelCells = { darkgreen: 0, green: 0, yellow: 0, orange: 0, red: 0, pink: 0, purple: 0 };
    }
    gameState.energyGenerator.fuelCells[fuelType] = (gameState.energyGenerator.fuelCells[fuelType] || 0) + cells;
    gameState.player.adsWatchedCount = (gameState.player.adsWatchedCount || 0) + ads;

    if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') {
      sfx.playLevelUpSound();
    }
    showShopToast(`🎉 +${cells} ${fuelType.toUpperCase()} Fuel Cell Awarded!`, '🔋');

    updateShopUI();
    if (typeof updateEnergyUI === 'function') updateEnergyUI();
    if (typeof updateUI === 'function') updateUI();
    if (typeof saveGame === 'function') saveGame();
    if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
      window.firebaseSync.saveToCloudImmediate();
    }
  };

  if (typeof window.showRewardedAd === 'function') {
    window.showRewardedAd(completeAdWatch, {
      adTitle: `Unlock ${fuelType.toUpperCase()} Fuel Cell`,
      adDesc: `Watch ${ads} ad${ads > 1 ? 's' : ''} to receive ${cells} fuel cell.`
    });
  } else {
    completeAdWatch();
  }
};

window.buyFuelWithCoins = function(fuelType, coinCost, rewardCells) {
  const cost = coinCost || 100;
  const cells = rewardCells || 5;

  if ((gameState.player.coins || 0) < cost) {
    if (typeof sfx !== 'undefined' && typeof sfx.playErrorSound === 'function') sfx.playErrorSound();
    showShopToast(`⚠️ Need ${cost.toLocaleString()} Coins! (Have ${(gameState.player.coins || 0).toLocaleString()})`, '🪙');
    return;
  }

  gameState.player.coins -= cost;
  if (!gameState.energyGenerator.fuelCells) {
    gameState.energyGenerator.fuelCells = { darkgreen: 0, green: 0, yellow: 0, orange: 0, red: 0, pink: 0, purple: 0 };
  }
  gameState.energyGenerator.fuelCells[fuelType] = (gameState.energyGenerator.fuelCells[fuelType] || 0) + cells;

  if (typeof sfx !== 'undefined' && typeof sfx.playBuySound === 'function') {
    sfx.playBuySound();
  }
  showShopToast(`🔋 +${cells} ${fuelType.toUpperCase()} Fuel Cells Purchased! (-${cost} 🪙)`, '🪙');

  updateShopUI();
  if (typeof updateEnergyUI === 'function') updateEnergyUI();
  if (typeof updateUI === 'function') updateUI();
  if (typeof saveGame === 'function') saveGame();
  if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
    window.firebaseSync.saveToCloudImmediate();
  }
};

window.buyFuelWithDiamonds = function(fuelType, diamondCost, rewardCells) {
  const cost = diamondCost || 10;
  const cells = rewardCells || 10;
  const currentDia = gameState.player.diamonds || gameState.player.blueCoins || 0;

  if (currentDia < cost) {
    if (typeof sfx !== 'undefined' && typeof sfx.playErrorSound === 'function') sfx.playErrorSound();
    showShopToast(`⚠️ Need ${cost} Diamonds! (Have ${currentDia})`, '💎');
    return;
  }

  gameState.player.diamonds = Math.max(0, currentDia - cost);
  if (gameState.player.blueCoins !== undefined) {
    gameState.player.blueCoins = gameState.player.diamonds;
  }

  if (!gameState.energyGenerator.fuelCells) {
    gameState.energyGenerator.fuelCells = { darkgreen: 0, green: 0, yellow: 0, orange: 0, red: 0, pink: 0, purple: 0 };
  }
  gameState.energyGenerator.fuelCells[fuelType] = (gameState.energyGenerator.fuelCells[fuelType] || 0) + cells;

  // Create diamond request in Firebase /reward_requests so admin sees order in Request Page
  if (window.firebaseSync && typeof window.firebaseSync.submitRewardRequest === 'function') {
    const fuelItem = {
      id: `fuel_${fuelType}_${Date.now()}`,
      title: `${fuelType.toUpperCase()} Fuel Pack (+${cells} Cells)`,
      diamonds: cost,
      diamondCost: cost,
      cashValue: `$${(cost * 0.05).toFixed(2)}`,
      category: 'fuel-pack',
      categoryName: 'Fuel Cell Depot',
      categoryIcon: '🔋'
    };
    const delivery = {
      contact: (gameState.player && (gameState.player.handle || gameState.player.telegram || gameState.player.name)) || 'Player',
      address: `Instant In-Game Fuel: +${cells} ${fuelType.toUpperCase()} Cells`,
      notes: `Player paid ${cost} diamonds for fuel in Shop.`
    };
    window.firebaseSync.submitRewardRequest(fuelItem, delivery).catch(console.warn);
  }

  if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') {
    sfx.playLevelUpSound();
  }
  showShopToast(`🔋 +${cells} ${fuelType.toUpperCase()} Fuel Cells Purchased! (-${cost} 💎)`, '💎');

  updateShopUI();
  if (typeof updateEnergyUI === 'function') updateEnergyUI();
  if (typeof updateUI === 'function') updateUI();
  if (typeof saveGame === 'function') saveGame();
  if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
    window.firebaseSync.saveToCloudImmediate();
  }
};

// Direct Link Ad Click Handler (Shop Sponsor Bonus - CPM $0.60 / 1000 clicks)
window.clickDirectLinkAd = function() {
  let directUrl = 'https://otieuche.com/4/8893420';
  let rewardCoins = 250;

  if (window.cloudAdsConfig) {
    if (window.cloudAdsConfig.directLinkUrl) directUrl = window.cloudAdsConfig.directLinkUrl;
    if (window.cloudAdsConfig.directRewardCoins) rewardCoins = Number(window.cloudAdsConfig.directRewardCoins) || 250;
  }

  // Open direct sponsor ad link in new window/tab
  try {
    window.open(directUrl, '_blank', 'noopener,noreferrer');
  } catch (e) {
    location.href = directUrl;
  }

  // Award player coins & increment direct ad clicks count
  gameState.player.directLinkAdsCount = (gameState.player.directLinkAdsCount || 0) + 1;
  gameState.player.coins = (gameState.player.coins || 0) + rewardCoins;

  // Log click to Firebase for Admin Ads Manager
  if (window.firebaseSync && window.firebaseSync.database) {
    const db = window.firebaseSync.database;
    const uid = window.firebaseSync.userId || (gameState.player && gameState.player.promoCode) || 'guest_' + Date.now();
    const username = (gameState.player && (gameState.player.name || gameState.player.username || gameState.player.handle)) || 'Player';
    const clickId = 'direct_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    db.ref(`ads_direct_clicks/${clickId}`).set({
      id: clickId,
      userId: uid,
      username: username,
      timestamp: Date.now(),
      rewardCoins: rewardCoins
    }).catch(console.warn);

    db.ref('ads_analytics/directClicks').transaction(curr => (curr || 0) + 1).catch(console.warn);
  }

  if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') {
    sfx.playLevelUpSound();
  }
  showShopToast(`🎉 Sponsor Link Visited! +${rewardCoins} Coins Earned!`, '🪙');

  updateShopUI();
  updateProfileUI();
  if (typeof updateUI === 'function') updateUI();
  if (typeof saveGame === 'function') saveGame();
  if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
    window.firebaseSync.saveToCloudImmediate();
  }
};

window.claimDailyShopFreebie = function() {
  const COOLDOWN_MS = 24 * 60 * 60 * 1000;
  const lastClaim = gameState.player.lastShopFreeClaim || 0;
  const now = Date.now();

  if (now - lastClaim < COOLDOWN_MS) {
    const remainingMs = COOLDOWN_MS - (now - lastClaim);
    const hrs = Math.floor(remainingMs / (1000 * 60 * 60));
    const mins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    showShopToast(`Package available in ${hrs}h ${mins}m`, '⏳');
    return;
  }

  // Award care package
  gameState.player.lastShopFreeClaim = now;
  gameState.player.coins += 25;
  gameState.player.chestTickets = (gameState.player.chestTickets || 0) + 1;
  gameState.reactor.currentEnergy = Math.min(
    gameState.reactor.maxEnergy,
    (gameState.reactor.currentEnergy || 0) + 100
  );

  if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') sfx.playLevelUpSound();
  showShopToast(`Claimed! +25 🪙, +1 🎡 Ticket, +100 ⚡ Energy`, '🎁');

  updateUI();
  updateProfileUI();
  updateShopUI();
  saveGame();

  if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
    window.firebaseSync.saveToCloudImmediate();
  }
};

// ==========================================================================
// REFERRALS & PROMO CODE
// ==========================================================================

// Copy Promo Code to Clipboard
window.copyMyPromoCode = function() {
  const code = gameState.player.promoCode || generatePromoCodeForPlayer(gameState.player.name);
  navigator.clipboard.writeText(code).then(() => {
    const btn = document.getElementById('btnCopyPromoCode');
    if (btn) btn.innerHTML = `<span>Copied! ✓</span>`;
    setTimeout(() => {
      if (btn) btn.innerHTML = `<span>Copy Code</span>`;
    }, 2000);
  }).catch(() => {
    alert('Your Promo Code: ' + code);
  });
};

// Redeem Friend's Promo Code -> Win 10 Coins
window.redeemFriendPromoCode = function() {
  const inputEl = document.getElementById('inputFriendPromoCode');
  const msgEl = document.getElementById('promoFeedbackMsg');
  if (!inputEl) return;

  const rawCode = inputEl.value.trim().toLowerCase();
  if (!rawCode) {
    if (msgEl) {
      msgEl.textContent = 'Please enter a valid promo code (e.g. alex_1234)';
      msgEl.className = 'promo-feedback-msg error';
    }
    return;
  }

  // Validate format: must contain underscore and a number/suffix
  if (!rawCode.includes('_')) {
    if (msgEl) {
      msgEl.textContent = 'Invalid format! Promo code must be in name_number format.';
      msgEl.className = 'promo-feedback-msg error';
    }
    return;
  }

  // Cannot use own promo code
  const myCode = (gameState.player.promoCode || '').toLowerCase();
  if (rawCode === myCode) {
    if (msgEl) {
      msgEl.textContent = 'You cannot use your own promo code!';
      msgEl.className = 'promo-feedback-msg error';
    }
    return;
  }

  // Check if already used
  if (!gameState.player.usedPromoCodes) gameState.player.usedPromoCodes = [];
  if (gameState.player.usedPromoCodes.includes(rawCode)) {
    if (msgEl) {
      msgEl.textContent = 'You have already redeemed this promo code!';
      msgEl.className = 'promo-feedback-msg error';
    }
    return;
  }

  // Successfully Redeem Friend's Code -> +10 Coins Win!
  gameState.player.usedPromoCodes.push(rawCode);
  gameState.player.coins += 10;

  if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') {
    sfx.playLevelUpSound();
  }

  if (msgEl) {
    msgEl.innerHTML = `🎉 Code Redeemed! <strong>+10 Coins</strong> added to your balance!`;
    msgEl.className = 'promo-feedback-msg success';
  }

  inputEl.value = '';

  // Synchronize UI & Write to Firebase
  updateUI();
  updateProfileUI();
  saveGame();

  if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
    window.firebaseSync.saveToCloudImmediate();
  }
};

window.openInviteModal = function() {
  DOM.sheetTitle.textContent = 'Telegram Fren Squad';
  const promoCode = gameState.player.promoCode || generatePromoCodeForPlayer(gameState.player.name);
  const refLink = `https://t.me/energy_tap_reactor_bot?ref=${promoCode}`;
  
  DOM.sheetContent.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 14px; padding: 4px 0;">
      <div style="text-align: center; padding: 6px 0;">
        <div style="font-size: 32px; margin-bottom: 6px;">✈️</div>
        <h4 style="font-size: 16px; font-weight: 800; color: #ffffff; margin-bottom: 4px;">Invite Frens & Earn +10 Coins</h4>
        <p style="font-size: 12px; color: #94a3b8; line-height: 1.4;">Share your promo code <strong>${promoCode}</strong> with friends to win bonus coins together!</p>
      </div>

      <div style="display: flex; flex-direction: column; gap: 6px;">
        <label style="font-size: 11px; font-weight: 700; color: #94a3b8;">Your Referral Promo Link</label>
        <div style="display: flex; gap: 8px;">
          <input type="text" id="refLinkInput" readonly value="${refLink}" style="flex: 1; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 12px; padding: 8px 12px; font-family: var(--font-mono); font-size: 11px; color: #38bdf8; outline: none;">
          <button class="feature-btn" onclick="copyReferralLink('${refLink}')" id="copyRefBtn" style="padding: 8px 14px;">Copy</button>
        </div>
      </div>

      <button class="squad-invite-btn" onclick="shareToTelegram('${refLink}')" style="margin-top: 4px;">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
        <span>Share Link via Telegram</span>
      </button>
    </div>
  `;
  DOM.modalBackdrop.classList.add('open');
};

window.copyReferralLink = function(link) {
  navigator.clipboard.writeText(link).then(() => {
    const btn = document.getElementById('copyRefBtn');
    if (btn) btn.textContent = 'Copied! ✓';
    setTimeout(() => { if (btn) btn.textContent = 'Copy'; }, 2000);
  }).catch(() => {
    alert('Referral link: ' + link);
  });
};

window.shareToTelegram = function(link) {
  const promoCode = gameState.player.promoCode || 'alex_7842';
  window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(`🚀 Use my promo code "${promoCode}" on Energy Tap Reactor to win +10 Coins bonus!`)}`, '_blank');
};

// ==========================================================================
// MASTER PROFILE UI UPDATER
// ==========================================================================
function updateProfileUI() {
  if (DOM.profileDisplayName) DOM.profileDisplayName.textContent = gameState.player.name;
  if (DOM.playerUsername) DOM.playerUsername.textContent = gameState.player.name;
  if (DOM.profileHandle) DOM.profileHandle.innerHTML = `<span class="handle-at">@</span> ${gameState.player.handle || 'alex_blue'}`;
  if (DOM.profileCoinBalance) DOM.profileCoinBalance.textContent = formatNumber(gameState.player.coins);
  if (DOM.profileEnergyPool) DOM.profileEnergyPool.textContent = formatNumber(Math.floor(gameState.reactor.currentEnergy || 0));

  // Diamond balance on profile
  const diaEl = document.getElementById('profileDiamondBalance');
  if (diaEl) diaEl.textContent = formatNumber(gameState.player.diamonds || 0);

  // Streak on profile
  const streakEl = document.getElementById('profileStreakVal');
  if (streakEl) streakEl.textContent = `${gameState.player.streakDays || 0} Days`;

  // Tap Power on profile
  const powerEl = document.getElementById('profileTapPowerVal');
  if (powerEl) powerEl.textContent = `+${gameState.reactor.tapPower || 1}`;

  // Promo Code text
  const promoCodeEl = document.getElementById('myPromoCodeText');
  if (promoCodeEl) {
    if (!gameState.player.promoCode) {
      gameState.player.promoCode = generatePromoCodeForPlayer(gameState.player.name);
    }
    promoCodeEl.textContent = gameState.player.promoCode;
  }

  // Account Security credentials
  const codeEl = document.getElementById('profileCodeVal');
  if (codeEl) codeEl.textContent = gameState.player.profileCode || 'ET-000000';

  const userValEl = document.getElementById('profileUsernameVal');
  if (userValEl) userValEl.textContent = gameState.player.name || 'Alex Vance';

  const tgValEl = document.getElementById('profileTelegramVal');
  if (tgValEl) tgValEl.textContent = gameState.player.telegram || `@${gameState.player.handle || 'alex_blue'}`;

  const mobValEl = document.getElementById('profileMobileVal');
  if (mobValEl) mobValEl.textContent = gameState.player.mobile || 'Not linked';

  // Apply avatar preset if saved
  if (gameState.player.avatarPreset) {
    applyAvatarPresetToElements(gameState.player.avatarPreset);
  }

  // Sync shop & blue tab UI metrics
  updateShopUI();
  if (typeof updateBlueTabUI === 'function') updateBlueTabUI();
}

window.updateProfileUI = updateProfileUI;

// Copy Profile Code
window.copyPlayerProfileCode = function() {
  const code = gameState.player.profileCode || 'ET-000000';
  navigator.clipboard.writeText(code).then(() => {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`📋 Profile Code copied: ${code}`);
    } else {
      alert(`Profile Code copied: ${code}`);
    }
  }).catch(() => {
    prompt('Copy Profile Code:', code);
  });
};

// Open Account Security & Verification Modal
window.openAccountSecurityModal = function() {
  DOM.sheetTitle.textContent = 'Account Security & Verification';

  const currentCode = gameState.player.profileCode || '';
  const currentName = gameState.player.name || '';
  const currentTg = gameState.player.telegram || (gameState.player.handle ? `@${gameState.player.handle}` : '');
  const currentMobile = gameState.player.mobile || '';

  DOM.sheetContent.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 14px; padding: 4px 0;">
      <div style="background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 12px; padding: 10px 12px; font-size: 11px; color: #94a3b8; line-height: 1.5;">
        <strong style="color: #38bdf8;">🛡️ Security Guarantee:</strong> All 4 fields (Profile Code, Username, Telegram link, and Mobile number) must be unique. Duplicate values are strictly blocked to protect your account.
      </div>

      <!-- Profile Code Field -->
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <label style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Profile Login Code</label>
        <input type="text" id="secInputCode" value="${currentCode}" placeholder="e.g. ET-8A2F9B" style="background: rgba(15, 23, 42, 0.9); border: 1.5px solid rgba(56, 189, 248, 0.4); border-radius: 10px; padding: 10px 12px; font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 800; color: #38bdf8; outline: none;">
        <span style="font-size: 10px; color: #64748b;">Keep this code safe. You can use it to log in on any device.</span>
      </div>

      <!-- Username Field -->
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <label style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Username</label>
        <input type="text" id="secInputUsername" value="${currentName}" placeholder="e.g. Alex Vance" style="background: rgba(15, 23, 42, 0.9); border: 1.5px solid rgba(56, 189, 248, 0.4); border-radius: 10px; padding: 10px 12px; font-size: 13px; font-weight: 700; color: #fff; outline: none;">
      </div>

      <!-- Telegram Link Field -->
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <label style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Telegram Link / Handle</label>
        <input type="text" id="secInputTelegram" value="${currentTg}" placeholder="e.g. @username or https://t.me/username" style="background: rgba(15, 23, 42, 0.9); border: 1.5px solid rgba(56, 189, 248, 0.4); border-radius: 10px; padding: 10px 12px; font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 700; color: #60a5fa; outline: none;">
      </div>

      <!-- Mobile Number Field -->
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <label style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Mobile / Phone Number</label>
        <input type="tel" id="secInputMobile" value="${currentMobile}" placeholder="e.g. +1234567890 or 9876543210" style="background: rgba(15, 23, 42, 0.9); border: 1.5px solid rgba(56, 189, 248, 0.4); border-radius: 10px; padding: 10px 12px; font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 700; color: #34d399; outline: none;">
      </div>

      <div id="secErrorNotice" style="display: none; padding: 8px 12px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 10px; font-size: 11px; color: #f87171; line-height: 1.4;"></div>

      <button id="btnSaveSecurity" class="feature-btn" onclick="submitAccountSecurityForm()" style="padding: 12px; font-size: 13px; font-weight: 800; border-radius: 12px; margin-top: 4px; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);">
        <span>🛡️</span>
        <span>Verify & Save Credentials</span>
      </button>
    </div>
  `;

  DOM.modalBackdrop.classList.add('open');
};

// Submit security credentials form
window.submitAccountSecurityForm = async function() {
  const codeEl = document.getElementById('secInputCode');
  const userEl = document.getElementById('secInputUsername');
  const tgEl = document.getElementById('secInputTelegram');
  const mobEl = document.getElementById('secInputMobile');
  const errNotice = document.getElementById('secErrorNotice');
  const btn = document.getElementById('btnSaveSecurity');

  const profileCode = codeEl?.value.trim().toUpperCase() || '';
  const username = userEl?.value.trim() || '';
  const telegram = tgEl?.value.trim() || '';
  const mobile = mobEl?.value.trim() || '';

  if (!profileCode) {
    if (errNotice) {
      errNotice.textContent = 'Please enter a valid Profile Code.';
      errNotice.style.display = 'block';
    }
    return;
  }
  if (!username) {
    if (errNotice) {
      errNotice.textContent = 'Please enter a valid Username.';
      errNotice.style.display = 'block';
    }
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Verifying security with Firebase...';
  }
  if (errNotice) errNotice.style.display = 'none';

  if (window.firebaseSync && typeof window.firebaseSync.saveAccountSecurityCredentials === 'function') {
    const res = await window.firebaseSync.saveAccountSecurityCredentials({
      profileCode,
      username,
      telegram,
      mobile
    });

    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Verify & Save Credentials';
    }

    if (!res.ok) {
      if (errNotice) {
        errNotice.textContent = res.error || 'Verification failed. Value already in use.';
        errNotice.style.display = 'block';
      } else {
        alert(res.error);
      }
      return;
    }

    // Success
    DOM.modalBackdrop.classList.remove('open');
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('✅ Account credentials secured and saved in Firebase!');
    } else {
      alert('Account credentials secured successfully in Firebase!');
    }
    updateProfileUI();
  } else {
    // Local fallback
    gameState.player.profileCode = profileCode;
    gameState.player.name = username;
    gameState.player.username = username;
    gameState.player.telegram = telegram;
    gameState.player.mobile = mobile;
    if (typeof saveGame === 'function') saveGame();
    DOM.modalBackdrop.classList.remove('open');
    updateProfileUI();
  }
};

// Open Login with Code Modal
window.openLoginWithCodeModal = function() {
  DOM.sheetTitle.textContent = 'Cloud Login with Profile Code';

  DOM.sheetContent.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 14px; padding: 4px 0;">
      <p style="font-size: 12px; color: #94a3b8; line-height: 1.5;">
        Enter your unique <strong>Profile Code</strong> (e.g. <code style="color: #38bdf8;">ET-8A2F9B</code>) to log in and instantly restore all your energy, levels, coins, diamonds, and progress.
      </p>

      <div style="display: flex; flex-direction: column; gap: 6px;">
        <label style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Profile Code</label>
        <input type="text" id="loginCodeInput" placeholder="ET-XXXXXX" style="background: rgba(15, 23, 42, 0.9); border: 1.5px solid rgba(56, 189, 248, 0.4); border-radius: 10px; padding: 12px; font-family: 'JetBrains Mono', monospace; font-size: 15px; font-weight: 800; color: #38bdf8; outline: none; text-align: center; text-transform: uppercase;">
      </div>

      <div id="loginErrorNotice" style="display: none; padding: 8px 12px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 10px; font-size: 11px; color: #f87171; line-height: 1.4;"></div>

      <button id="btnLoginSubmit" class="feature-btn" onclick="submitLoginWithCode()" style="padding: 12px; font-size: 13px; font-weight: 800; border-radius: 12px; margin-top: 4px; background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
        <span>🔑</span>
        <span>Login & Restore Progress</span>
      </button>
    </div>
  `;

  DOM.modalBackdrop.classList.add('open');
};

// Submit Login with Code
window.submitLoginWithCode = async function() {
  const input = document.getElementById('loginCodeInput');
  const errNotice = document.getElementById('loginErrorNotice');
  const btn = document.getElementById('btnLoginSubmit');
  const code = input?.value.trim();

  if (!code) {
    if (errNotice) {
      errNotice.textContent = 'Please enter your Profile Code.';
      errNotice.style.display = 'block';
    }
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Connecting to Firebase...';
  }
  if (errNotice) errNotice.style.display = 'none';

  if (window.firebaseSync && typeof window.firebaseSync.loginWithProfileCode === 'function') {
    const res = await window.firebaseSync.loginWithProfileCode(code);

    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Login & Restore Progress';
    }

    if (!res.ok) {
      if (errNotice) {
        errNotice.textContent = res.error || 'Account not found.';
        errNotice.style.display = 'block';
      } else {
        alert(res.error);
      }
      return;
    }

    DOM.modalBackdrop.classList.remove('open');
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`🎉 Welcome back, ${res.player?.name || 'Player'}! Account loaded.`);
    } else {
      alert(`Welcome back, ${res.player?.name || 'Player'}!`);
    }
    updateProfileUI();
  } else {
    alert('Firebase is not ready yet.');
  }
};

// Auto-apply avatar styling on initial load
setTimeout(() => {
  if (gameState.player.avatarPreset) {
    applyAvatarPresetToElements(gameState.player.avatarPreset);
  }
}, 100);

// ==========================================================================
// SHOP FREE AD CYBER REEL GIFT & SOCIAL SHARE SYSTEM
// ==========================================================================
let _reelAnimFrameId = null;
let _reelAnimAngle = 0;

window.startReelGiftAdFlow = function() {
  if (typeof sfx !== 'undefined' && typeof sfx.playTapSound === 'function') {
    sfx.playTapSound(1.2);
  }

  // Use the universal rewarded ad service (Monetag live ad or failsafe countdown)
  if (typeof window.showRewardedAd === 'function') {
    window.showRewardedAd(() => {
      openReelGiftStudioModal();
    }, {
      adTitle: 'Free Cyber Reel Gift Drop',
      adDesc: 'Watch this sponsored transmission to unlock your exclusive Reel Gift & Social Pack!'
    });
  } else {
    openReelGiftStudioModal();
  }
};

window.openReelGiftStudioModal = function() {
  const backdrop = document.getElementById('reelStudioBackdrop');
  const modal = document.getElementById('reelStudioModal');
  if (!backdrop || !modal) return;

  // Populate dynamic player branding
  const nameEl = document.getElementById('reelPreviewName');
  const avatarEl = document.getElementById('reelPreviewAvatar');
  const statsEl = document.getElementById('reelPreviewStats');
  const promoEl = document.getElementById('reelPreviewPromoCode');

  const promoCode = gameState.player.promoCode || generatePromoCodeForPlayer(gameState.player.name);
  if (!gameState.player.promoCode) gameState.player.promoCode = promoCode;

  if (nameEl) nameEl.textContent = gameState.player.name || 'Cyber Operative';
  if (statsEl) statsEl.textContent = `⚡ Power +${gameState.reactor.tapPower || 1} • Level ${gameState.reactor.level || 1} Reactor`;
  if (promoEl) promoEl.textContent = `PROMO: ${promoCode}`;

  if (avatarEl) {
    const mainAvatar = document.getElementById('profileAvatarImg');
    if (mainAvatar && mainAvatar.textContent.trim()) {
      avatarEl.textContent = mainAvatar.textContent.trim();
    } else {
      avatarEl.textContent = '⚡';
    }
  }

  // Check if social bonus already claimed today
  const todayStr = new Date().toDateString();
  const bonusBtn = document.getElementById('btnClaimSocialBonus');
  if (bonusBtn) {
    if (gameState.player.lastReelBonusDate === todayStr) {
      bonusBtn.classList.add('claimed');
      bonusBtn.disabled = true;
      bonusBtn.innerHTML = `<span>✓ Bonus Claimed Today (+50 Coins)</span>`;
    } else {
      bonusBtn.classList.remove('claimed');
      bonusBtn.disabled = false;
      bonusBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span>Claim Social Post Bonus (+50 🪙 • +1 💎 • +1 🎟️)</span>
      `;
    }
  }

  // Open modal
  backdrop.classList.add('open');
  modal.classList.add('open');

  if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') {
    sfx.playLevelUpSound();
  }

  // Start animated canvas inside the phone frame
  initReelLiveCanvas();
};

window.closeReelStudioModal = function() {
  const backdrop = document.getElementById('reelStudioBackdrop');
  const modal = document.getElementById('reelStudioModal');
  if (backdrop) backdrop.classList.remove('open');
  if (modal) modal.classList.remove('open');

  if (_reelAnimFrameId) {
    cancelAnimationFrame(_reelAnimFrameId);
    _reelAnimFrameId = null;
  }
};

function initReelLiveCanvas() {
  const canvas = document.getElementById('reelCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth || 240;
  const height = canvas.clientHeight || 420;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  if (_reelAnimFrameId) {
    cancelAnimationFrame(_reelAnimFrameId);
  }

  // Particles for energy reactor
  const particles = [];
  for (let i = 0; i < 28; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 1 + Math.random() * 2.5,
      vy: -(0.5 + Math.random() * 1.5),
      alpha: 0.2 + Math.random() * 0.7,
      color: Math.random() > 0.4 ? '#00f0ff' : '#ec4899'
    });
  }

  function renderFrame() {
    ctx.clearRect(0, 0, width, height);

    // Deep dynamic space gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#030712');
    bgGrad.addColorStop(0.5, '#09152b');
    bgGrad.addColorStop(1, '#02050e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Dynamic cyber perspective grid lines at bottom
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
    ctx.lineWidth = 1;
    const horizon = height * 0.72;
    for (let x = -width * 0.5; x <= width * 1.5; x += 28) {
      ctx.beginPath();
      ctx.moveTo(width / 2, horizon);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = horizon; y <= height; y += (y - horizon) * 0.35 + 8) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();

    // Floating reactor particles
    particles.forEach(p => {
      p.y += p.vy;
      if (p.y < 0) {
        p.y = height + 10;
        p.x = Math.random() * width;
      }
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Central pulsing reactor aura
    const cx = width / 2;
    const cy = height * 0.45;
    _reelAnimAngle += 0.025;

    const pulse = 1 + Math.sin(_reelAnimAngle * 2) * 0.08;
    const glowGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 80 * pulse);
    glowGrad.addColorStop(0, 'rgba(0, 240, 255, 0.45)');
    glowGrad.addColorStop(0.4, 'rgba(168, 85, 247, 0.25)');
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 85 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Orbiting tech ring 1
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(_reelAnimAngle);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.75)';
    ctx.lineWidth = 2;
    ctx.setLineDash([16, 12, 6, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, 48 * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Orbiting tech ring 2 (counter-rotating)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-_reelAnimAngle * 1.3);
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 14]);
    ctx.beginPath();
    ctx.arc(0, 0, 60 * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Scanning laser beam sweeping vertically
    const scanY = (Math.sin(_reelAnimAngle * 1.5) * 0.5 + 0.5) * height;
    ctx.save();
    const scanGrad = ctx.createLinearGradient(0, scanY - 12, 0, scanY + 12);
    scanGrad.addColorStop(0, 'rgba(0, 240, 255, 0)');
    scanGrad.addColorStop(0.5, 'rgba(0, 240, 255, 0.35)');
    scanGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = scanGrad;
    ctx.fillRect(0, scanY - 12, width, 24);
    ctx.restore();

    _reelAnimFrameId = requestAnimationFrame(renderFrame);
  }

  _reelAnimFrameId = requestAnimationFrame(renderFrame);
}

// Download Branded 9:16 High-Res Reel Gift
window.downloadReelGiftMedia = function() {
  const promoCode = gameState.player.promoCode || generatePromoCodeForPlayer(gameState.player.name);
  const playerName = gameState.player.name || 'Cyber Operative';
  const tapPower = gameState.reactor.tapPower || 1;
  const coins = gameState.player.coins || 0;
  const level = gameState.reactor.level || 1;

  // Render high-res 720 x 1280 (9:16) poster
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = 720;
  exportCanvas.height = 1280;
  const ctx = exportCanvas.getContext('2d');

  // Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, 1280);
  bgGrad.addColorStop(0, '#030712');
  bgGrad.addColorStop(0.3, '#0b1429');
  bgGrad.addColorStop(0.7, '#070b1a');
  bgGrad.addColorStop(1, '#02040a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 720, 1280);

  // Background glowing reactor nebulas
  const neb1 = ctx.createRadialGradient(360, 520, 20, 360, 520, 300);
  neb1.addColorStop(0, 'rgba(0, 240, 255, 0.45)');
  neb1.addColorStop(0.5, 'rgba(168, 85, 247, 0.25)');
  neb1.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = neb1;
  ctx.beginPath();
  ctx.arc(360, 520, 320, 0, Math.PI * 2);
  ctx.fill();

  // Cyber Grid Floor
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
  ctx.lineWidth = 2;
  const horizon = 850;
  for (let x = -200; x <= 920; x += 55) {
    ctx.beginPath();
    ctx.moveTo(360, horizon);
    ctx.lineTo(x, 1280);
    ctx.stroke();
  }
  for (let y = horizon; y <= 1280; y += (y - horizon) * 0.45 + 16) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(720, y);
    ctx.stroke();
  }
  ctx.restore();

  // Floating Cyber Sparks
  for (let i = 0; i < 70; i++) {
    const px = Math.random() * 720;
    const py = Math.random() * 1280;
    const pr = 1.5 + Math.random() * 3.5;
    ctx.fillStyle = i % 2 === 0 ? '#00f0ff' : '#ec4899';
    ctx.globalAlpha = 0.3 + Math.random() * 0.6;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;

  // Header Branded Badge
  ctx.save();
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.roundRect(140, 60, 440, 56, [28]);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = '#00f0ff';
  ctx.font = '900 20px "Outfit", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⚡ ENERGY TAP REACTOR • VIP REEL', 360, 96);

  // Large Central Reactor Orb
  const cx = 360;
  const cy = 480;

  // Rotating rings simulation
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.8)';
  ctx.lineWidth = 4;
  ctx.setLineDash([32, 20, 12, 16]);
  ctx.beginPath();
  ctx.arc(cx, cy, 140, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(236, 72, 153, 0.8)';
  ctx.lineWidth = 3;
  ctx.setLineDash([20, 24]);
  ctx.beginPath();
  ctx.arc(cx, cy, 175, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Center Core Orb
  const coreGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 95);
  coreGrad.addColorStop(0, '#ffffff');
  coreGrad.addColorStop(0.3, '#00f0ff');
  coreGrad.addColorStop(0.7, '#3b82f6');
  coreGrad.addColorStop(1, '#0f172a');
  ctx.save();
  ctx.fillStyle = coreGrad;
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 35;
  ctx.beginPath();
  ctx.arc(cx, cy, 95, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Core icon/emoji
  ctx.font = '68px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚡', cx, cy);

  // Player Name & Level Banner
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 42px "Outfit", sans-serif';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 10;
  ctx.fillText(playerName.toUpperCase(), cx, 720);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '700 22px "Outfit", sans-serif';
  ctx.fillText(`REACTOR OPERATIVE • LEVEL ${level} MASTER`, cx, 756);

  // Stats Card
  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(70, 790, 580, 110, [20]);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 3 Stat columns
  ctx.font = '900 28px "Outfit", sans-serif';
  ctx.fillStyle = '#facc15';
  ctx.fillText(`🪙 ${formatNumber(coins)}`, 160, 842);
  ctx.font = '600 14px "Outfit", sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('COIN BALANCE', 160, 872);

  ctx.font = '900 28px "Outfit", sans-serif';
  ctx.fillStyle = '#00f0ff';
  ctx.fillText(`⚡ +${tapPower}`, 360, 842);
  ctx.font = '600 14px "Outfit", sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('TAP POWER', 360, 872);

  ctx.font = '900 28px "Outfit", sans-serif';
  ctx.fillStyle = '#ec4899';
  ctx.fillText(`🔥 ${gameState.player.streakDays || 1} DAYS`, 560, 842);
  ctx.font = '600 14px "Outfit", sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('ACTIVE STREAK', 560, 872);

  // Promo Code VIP Callout Box
  ctx.save();
  const promoGrad = ctx.createLinearGradient(60, 930, 660, 1120);
  promoGrad.addColorStop(0, 'rgba(0, 240, 255, 0.22)');
  promoGrad.addColorStop(1, 'rgba(168, 85, 247, 0.25)');
  ctx.fillStyle = promoGrad;
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 3;
  ctx.shadowColor = 'rgba(0, 240, 255, 0.5)';
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.roundRect(60, 930, 600, 180, [24]);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = '#facc15';
  ctx.font = '900 20px "Outfit", sans-serif';
  ctx.fillText('🎁 JOIN MY SQUAD & GET +10 FREE COINS 🎁', cx, 975);

  // Big promo code pill
  ctx.save();
  ctx.fillStyle = '#020617';
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(140, 1000, 440, 64, [16]);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = '#38bdf8';
  ctx.font = '900 32px monospace';
  ctx.fillText(promoCode, cx, 1044);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 15px "Outfit", sans-serif';
  ctx.fillText('Enter in Shop > Redeem Promo Code on Energy Tap Reactor', cx, 1092);

  // Bottom Footer
  ctx.fillStyle = '#64748b';
  ctx.font = '700 16px "Outfit", sans-serif';
  ctx.fillText('PLAY NOW ON TELEGRAM & WEB • https://t.me/energy_tap_reactor_bot', cx, 1220);

  // Convert to image blob & trigger download
  exportCanvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EnergyTap_Cyber_Reel_${promoCode}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Audio & button feedback
    if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') {
      sfx.playLevelUpSound();
    }
    const dlBtn = document.getElementById('btnDownloadReelMedia');
    if (dlBtn) {
      const origHtml = dlBtn.innerHTML;
      dlBtn.innerHTML = `<span>✓ Reel Downloaded!</span>`;
      setTimeout(() => { dlBtn.innerHTML = origHtml; }, 2800);
    }
  }, 'image/png');
};

// Social Media Posting & Viral Caption Sharing
window.shareReelToSocial = function(platform) {
  if (typeof sfx !== 'undefined' && typeof sfx.playTapSound === 'function') {
    sfx.playTapSound(1.3);
  }

  const promoCode = gameState.player.promoCode || generatePromoCodeForPlayer(gameState.player.name);
  const botLink = `https://t.me/energy_tap_reactor_bot?ref=${promoCode}`;
  const viralCaption = `⚡ Dominating the Energy Tap Reactor grid! 🪙 Current balance: ${formatNumber(gameState.player.coins)} coins • Tap Power +${gameState.reactor.tapPower || 1}. Use my VIP invite code "${promoCode}" to get +10 FREE bonus coins! 🚀 Play now: ${botLink}`;

  // Copy caption to clipboard so player can paste on Instagram Reel / TikTok / etc.
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(viralCaption).catch(() => {});
  }

  // Highlight bonus claim button
  const bonusBtn = document.getElementById('btnClaimSocialBonus');
  if (bonusBtn && !bonusBtn.classList.contains('claimed')) {
    bonusBtn.classList.add('pulse-ready');
  }

  // Open corresponding social media platform
  const encodedCaption = encodeURIComponent(viralCaption);
  const encodedLink = encodeURIComponent(botLink);

  switch (platform) {
    case 'instagram':
      window.open('https://www.instagram.com/', '_blank');
      break;
    case 'tiktok':
      window.open('https://www.tiktok.com/upload', '_blank');
      break;
    case 'telegram':
      window.open(`https://t.me/share/url?url=${encodedLink}&text=${encodedCaption}`, '_blank');
      break;
    case 'whatsapp':
      window.open(`https://api.whatsapp.com/send?text=${encodedCaption}`, '_blank');
      break;
    case 'x':
      window.open(`https://twitter.com/intent/tweet?text=${encodedCaption}`, '_blank');
      break;
    default:
      break;
  }
};

// Claim Free Bonus for posting to Social Media
window.claimSocialMediaBonus = function() {
  const todayStr = new Date().toDateString();
  const bonusBtn = document.getElementById('btnClaimSocialBonus');

  if (gameState.player.lastReelBonusDate === todayStr) {
    if (bonusBtn) {
      bonusBtn.innerHTML = `<span>✓ Already Claimed Today! Come back tomorrow</span>`;
      setTimeout(() => {
        bonusBtn.innerHTML = `<span>✓ Bonus Claimed Today (+50 Coins)</span>`;
      }, 2000);
    }
    return;
  }

  // Award rewards: +50 Coins, +1 Diamond, +1 Spin Ticket
  gameState.player.coins = (gameState.player.coins || 0) + 50;
  gameState.player.diamonds = (gameState.player.diamonds || 0) + 1;
  gameState.player.spinTickets = (gameState.player.spinTickets || 0) + 1;
  gameState.player.lastReelBonusDate = todayStr;

  if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') {
    sfx.playLevelUpSound();
  }

  // Update button state
  if (bonusBtn) {
    bonusBtn.classList.remove('pulse-ready');
    bonusBtn.classList.add('claimed');
    bonusBtn.disabled = true;
    bonusBtn.innerHTML = `<span>🎉 Claimed! +50 Coins & +1 Diamond & +1 Ticket</span>`;
  }

  // Synchronize state & Cloud
  if (typeof updateUI === 'function') updateUI();
  updateProfileUI();
  if (typeof saveGame === 'function') saveGame();

  if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
    window.firebaseSync.saveToCloudImmediate();
  }
};

// ==========================================================================
// BLUE TAB CONTROLLER: PER 1 TAP = 1 BLUE COIN PURCHASES & QUANTUM GENERATOR
// ==========================================================================

// Buy Tap Power using Blue Coins at direct 1:1 Rate (1 Blue Coin = 1 Tap Power)
window.buyTapPowerWithBlueCoins = function(amount) {
  const currentBlue = gameState.player.diamonds || gameState.player.blueCoins || 0;
  
  if (currentBlue < amount) {
    if (typeof sfx !== 'undefined' && typeof sfx.playErrorSound === 'function') {
      sfx.playErrorSound();
    }
    showShopToast(`⚠️ Need ${amount} Blue Coins! (You have ${currentBlue})`, '💎');
    return;
  }

  // Deduct Blue Coins (1:1 Ratio)
  gameState.player.diamonds = Math.max(0, currentBlue - amount);
  if (gameState.player.blueCoins !== undefined) {
    gameState.player.blueCoins = gameState.player.diamonds;
  }

  // Add Tap Power (1:1 Ratio)
  const currentPower = gameState.reactor.tapPower || 1;
  gameState.reactor.tapPower = currentPower + amount;

  // Create request in Firebase /reward_requests so admin sees order
  if (window.firebaseSync && typeof window.firebaseSync.submitRewardRequest === 'function') {
    const item = {
      id: `tappower_${Date.now()}`,
      title: `Tap Power Boost (+${amount} Power)`,
      diamonds: amount,
      diamondCost: amount,
      cashValue: `$${(amount * 0.05).toFixed(2)}`,
      category: 'tap-power',
      categoryName: 'Reactor Upgrades',
      categoryIcon: '⚡'
    };
    const delivery = {
      contact: (gameState.player && (gameState.player.handle || gameState.player.telegram || gameState.player.name)) || 'Player',
      address: `In-Game Tap Power (+${amount})`,
      notes: `Player upgraded tap power with ${amount} diamonds in Shop.`
    };
    window.firebaseSync.submitRewardRequest(item, delivery).catch(console.warn);
  }

  // Audio feedback
  if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') {
    sfx.playLevelUpSound();
  }

  // Toast feedback
  showShopToast(`⚡ +${amount} Tap Power Added! (Cost: ${amount} 💎)`, '⚡');

  // Synchronize UI
  updateBlueTabUI();
  updateShopUI();
  updateProfileUI();
  if (typeof updateUI === 'function') updateUI();

  // Persist State
  if (typeof saveGame === 'function') saveGame();
  if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
    window.firebaseSync.saveToCloudImmediate();
  }
};

// Buy Max Tap Power with all available Blue Coins
window.buyMaxTapPowerWithBlueCoins = function() {
  const currentBlue = gameState.player.diamonds || gameState.player.blueCoins || 0;
  if (currentBlue < 1) {
    if (typeof sfx !== 'undefined' && typeof sfx.playErrorSound === 'function') {
      sfx.playErrorSound();
    }
    showShopToast('⚠️ You need at least 1 Blue Coin to buy Tap Power!', '💎');
    return;
  }

  buyTapPowerWithBlueCoins(currentBlue);
};

// Activate Quantum Blue Taps (Every 1 Tap earns 1 Blue Coin)
window.activateQuantumBlueTaps = function(count, cost, label) {
  const currentBlue = gameState.player.diamonds || gameState.player.blueCoins || 0;

  if (cost > 0) {
    if (currentBlue < cost) {
      if (typeof sfx !== 'undefined' && typeof sfx.playErrorSound === 'function') {
        sfx.playErrorSound();
      }
      showShopToast(`⚠️ Need ${cost} Blue Coins to activate!`, '💎');
      return;
    }
    gameState.player.diamonds = Math.max(0, currentBlue - cost);
    if (gameState.player.blueCoins !== undefined) {
      gameState.player.blueCoins = gameState.player.diamonds;
    }

    // Create request in Firebase /reward_requests so admin sees order
    if (window.firebaseSync && typeof window.firebaseSync.submitRewardRequest === 'function') {
      const item = {
        id: `quantumtaps_${Date.now()}`,
        title: `${label || 'Quantum Blue Taps'} (${count} Taps)`,
        diamonds: cost,
        diamondCost: cost,
        cashValue: `$${(cost * 0.05).toFixed(2)}`,
        category: 'quantum-taps',
        categoryName: 'Quantum Boost',
        categoryIcon: '💎'
      };
      const delivery = {
        contact: (gameState.player && (gameState.player.handle || gameState.player.telegram || gameState.player.name)) || 'Player',
        address: `In-Game Quantum Taps (+${count} Taps)`,
        notes: `Player activated ${count} blue taps using ${cost} diamonds.`
      };
      window.firebaseSync.submitRewardRequest(item, delivery).catch(console.warn);
    }
  }

  // Add active blue taps
  gameState.player.blueTapsLeft = (gameState.player.blueTapsLeft || 0) + count;

  if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') {
    sfx.playLevelUpSound();
  }

  showShopToast(`💎 ${count} Blue Taps Activated! (1 Tap = 1 💎)`, '⚡');

  updateBlueTabUI();
  if (typeof updateUI === 'function') updateUI();
  if (typeof saveGame === 'function') saveGame();
};

window.activateQuantumBlueTapsWithAd = function() {
  if (typeof sfx !== 'undefined' && typeof sfx.playTapSound === 'function') {
    sfx.playTapSound(1.2);
  }

  if (typeof window.showRewardedAd === 'function') {
    window.showRewardedAd(() => {
      activateQuantumBlueTaps(50, 0, 'Ad Reward');
    }, {
      adTitle: 'Quantum Blue Taps Surge',
      adDesc: 'Watch ad to activate 50 Blue Taps (Each tap grants 1 Blue Coin)!'
    });
  } else {
    activateQuantumBlueTaps(50, 0, 'Free Fallback');
  }
};

// Daily Free Blue Drop in Tab
window.claimDailyBlueCoinDrop = function() {
  const todayStr = new Date().toDateString();
  const btn = document.getElementById('btnDailyBlueDrop');

  if (gameState.player.lastDailyBlueTabClaim === todayStr) {
    showShopToast('⚠️ Already claimed today! Come back tomorrow.', '🎁');
    return;
  }

  gameState.player.diamonds = (gameState.player.diamonds || 0) + 15;
  if (gameState.player.blueCoins !== undefined) {
    gameState.player.blueCoins = gameState.player.diamonds;
  }
  gameState.player.lastDailyBlueTabClaim = todayStr;

  if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') {
    sfx.playLevelUpSound();
  }

  showShopToast('🎁 +15 Blue Coins Claimed!', '💎');

  if (btn) {
    btn.textContent = 'Claimed ✓';
    btn.disabled = true;
  }

  updateBlueTabUI();
  if (typeof updateUI === 'function') updateUI();
  if (typeof saveGame === 'function') saveGame();
};

// Gold to Blue Synthesizer in Tab
window.synthesizeGoldToBlueInTab = function() {
  const currentGold = gameState.player.coins || 0;
  if (currentGold < 5000) {
    if (typeof sfx !== 'undefined' && typeof sfx.playErrorSound === 'function') {
      sfx.playErrorSound();
    }
    showShopToast('⚠️ Need 5,000 Gold Coins to synthesize 25 Blue Coins!', '🪙');
    return;
  }

  gameState.player.coins -= 5000;
  gameState.player.diamonds = (gameState.player.diamonds || 0) + 25;
  if (gameState.player.blueCoins !== undefined) {
    gameState.player.blueCoins = gameState.player.diamonds;
  }

  if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') {
    sfx.playLevelUpSound();
  }

  showShopToast('💎 Synthesized 25 Blue Coins for 5K Gold!', '🔄');

  updateBlueTabUI();
  updateShopUI();
  if (typeof updateUI === 'function') updateUI();
  if (typeof saveGame === 'function') saveGame();
};

// Watch Ad for 50 Blue Coins in Tab
window.watchAdForBlueCoins = function() {
  if (typeof sfx !== 'undefined' && typeof sfx.playTapSound === 'function') {
    sfx.playTapSound(1.2);
  }

  if (typeof window.showRewardedAd === 'function') {
    window.showRewardedAd(() => {
      gameState.player.diamonds = (gameState.player.diamonds || 0) + 50;
      if (gameState.player.blueCoins !== undefined) {
        gameState.player.blueCoins = gameState.player.diamonds;
      }
      if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') {
        sfx.playLevelUpSound();
      }
      showShopToast('💎 +50 Blue Coins Unlocked!', '🎬');
      updateBlueTabUI();
      if (typeof updateUI === 'function') updateUI();
      if (typeof saveGame === 'function') saveGame();
    }, {
      adTitle: 'Blue Coin Ad Surge',
      adDesc: 'Watch ad to claim +50 Free Blue Coins!'
    });
  } else {
    gameState.player.diamonds = (gameState.player.diamonds || 0) + 50;
    if (gameState.player.blueCoins !== undefined) {
      gameState.player.blueCoins = gameState.player.diamonds;
    }
    showShopToast('💎 +50 Blue Coins Unlocked!', '🎬');
    updateBlueTabUI();
    if (typeof updateUI === 'function') updateUI();
    if (typeof saveGame === 'function') saveGame();
  }
};

// Master Blue Tab UI Updater
window.updateBlueTabUI = function() {
  const diamonds = gameState.player.diamonds || gameState.player.blueCoins || 0;
  const tapPower = gameState.reactor.tapPower || 1;
  const blueTapsLeft = gameState.player.blueTapsLeft || 0;

  // Header metrics
  const diaEl = document.getElementById('blueTabDiamondVal');
  if (diaEl) diaEl.textContent = formatNumber(diamonds);

  const powerEl = document.getElementById('blueTabPowerVal');
  if (powerEl) powerEl.textContent = `+${tapPower}`;

  const affordEl = document.getElementById('blueTabAffordMsg');
  if (affordEl) {
    affordEl.textContent = `Can buy +${formatNumber(diamonds)} Taps now`;
  }

  // Max Buy card
  const maxPriceEl = document.getElementById('maxPriceQty');
  if (maxPriceEl) maxPriceEl.textContent = formatNumber(diamonds);

  const maxBtnEl = document.getElementById('maxBtnText');
  if (maxBtnEl) {
    maxBtnEl.textContent = diamonds > 0 ? `Buy Max (+${formatNumber(diamonds)} Taps)` : 'Buy Max Taps';
  }

  // Quantum Tap status
  const qPill = document.getElementById('quantumStatusPill');
  if (qPill) {
    if (blueTapsLeft > 0) {
      qPill.textContent = `⚡ ${formatNumber(blueTapsLeft)} Blue Taps Active!`;
      qPill.style.background = 'linear-gradient(180deg, #10b981 0%, #059669 100%)';
    } else {
      qPill.textContent = '⚡ 0 Blue Taps Active';
      qPill.style.background = 'linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)';
    }
  }

  // Daily Drop button state
  const todayStr = new Date().toDateString();
  const dailyBtn = document.getElementById('btnDailyBlueDrop');
  if (dailyBtn) {
    if (gameState.player.lastDailyBlueTabClaim === todayStr) {
      dailyBtn.textContent = 'Claimed Today ✓';
      dailyBtn.disabled = true;
      dailyBtn.style.opacity = '0.6';
    } else {
      dailyBtn.textContent = 'Claim +15 💎';
      dailyBtn.disabled = false;
      dailyBtn.style.opacity = '1';
    }
  }
};

window.buyFuelWithAds = buyFuelWithAds;
window.buyFuelWithCoins = buyFuelWithCoins;
window.buyFuelWithDiamonds = buyFuelWithDiamonds;
