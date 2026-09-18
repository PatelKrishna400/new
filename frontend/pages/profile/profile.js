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
  DOM.sheetTitle.textContent = 'Edit Profile & Cyber ID';
  selectedPresetId = gameState.player.avatarPreset || 'alex';

  const presetOptionsHtml = AVATAR_PRESETS.map(p => `
    <div class="avatar-preset-item ${p.id === selectedPresetId ? 'selected' : ''}" id="presetOption_${p.id}" onclick="chooseAvatarPreset('${p.id}')">
      <div class="preset-avatar-circle" style="background: linear-gradient(135deg, ${p.grad1}, ${p.grad2});">
        <span>${p.emoji}</span>
      </div>
      <span class="preset-name">${p.name}</span>
    </div>
  `).join('');

  const currentCode = gameState.player.profileCode || 'ET-000000';

  DOM.sheetContent.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 14px; padding: 4px 0;">
      <!-- Fixed Permanent User Code (Cloud ID) -->
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <label style="font-size: 12px; font-weight: 700; color: #94a3b8;">Fixed User Code (Firebase Linked)</label>
          <span style="font-size: 10px; font-weight: 800; color: #10b981; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); padding: 2px 8px; border-radius: 9999px;">🔒 FIXED PERMANENT</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <input type="text" id="editPlayerCodeInput" value="${currentCode}" readonly style="flex: 1; background: rgba(3, 8, 24, 0.85); border: 1.5px solid rgba(56, 189, 248, 0.4); border-radius: 12px; padding: 10px 14px; font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 800; color: #38bdf8; outline: none; cursor: default;">
          <button type="button" onclick="copyPlayerProfileCode()" style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.4); color: #38bdf8; border-radius: 12px; padding: 10px 14px; font-weight: 800; cursor: pointer; font-size: 13px;">📋 Copy</button>
        </div>
        <span style="font-size: 10.5px; color: #64748b;">Fixed permanent code is synced with Firebase and Admin portal. Duplicate user accounts cannot be created.</span>
      </div>

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

      <button class="feature-btn" id="btnSaveProfileData" onclick="saveProfileData()" style="padding: 12px; font-size: 14px; font-weight: 800; border-radius: 14px; margin-top: 6px;">Save Changes ✨</button>
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

window.saveProfileData = async function() {
  const nameInput = document.getElementById('editPlayerNameInput');
  const handleInput = document.getElementById('editPlayerHandleInput');
  const saveBtn = document.getElementById('btnSaveProfileData');
  
  const newName = nameInput ? nameInput.value.trim() : gameState.player.name;
  const newHandle = handleInput ? handleInput.value.trim().replace(/^@/, '') : (gameState.player.handle || 'alex_blue');

  // Prevent duplicate user creation by validating unique credentials against Firebase
  if (window.firebaseSync && typeof window.firebaseSync.validateUniqueCredentials === 'function') {
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Checking Cloud Uniqueness...';
    }

    try {
      const valRes = await window.firebaseSync.validateUniqueCredentials({
        profileCode: gameState.player.profileCode,
        username: newName,
        telegram: `@${newHandle}`,
        excludeUid: window.firebaseSync.userId
      });

      if (!valRes.ok) {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = 'Save Changes ✨';
        }
        if (typeof showFloatingToast === 'function') {
          showFloatingToast(valRes.error || 'Duplicate user detected in Firebase!');
        } else {
          alert(valRes.error || 'Duplicate user detected in Firebase!');
        }
        return;
      }
    } catch (err) {
      console.warn('Uniqueness check error, proceeding with caution:', err);
    }

    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Changes ✨';
    }
  }

  if (newName) {
    const oldName = gameState.player.name;
    gameState.player.name = newName;
    
    // Update promo code prefix if name changed
    if (oldName !== gameState.player.name) {
      const parts = (gameState.player.promoCode || '').split('_');
      const numPart = parts.length > 1 ? parts[1] : Math.floor(1000 + Math.random() * 9000);
      const cleanName = gameState.player.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
      gameState.player.promoCode = `${cleanName}_${numPart}`;
    }
  }

  if (newHandle) {
    gameState.player.handle = newHandle;
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
  
  // Real-time Firebase cloud write & ensure profileCode is written
  if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
    window.firebaseSync.saveToCloudImmediate();
  }
  
  closeTabModal();
  if (typeof showFloatingToast === 'function') {
    showFloatingToast('✅ Profile updated and synced with Firebase!');
  }
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
  // Update Coin and Diamond/Blue Coin display in Shop
  const coinEl = document.getElementById('shopCoinVal');
  if (coinEl) coinEl.textContent = formatNumber(gameState.player.coins || 0);

  const diaEl = document.getElementById('shopDiamondVal');
  if (diaEl) diaEl.textContent = formatNumber(gameState.player.diamonds || 0);

  const blueCoinEl = document.getElementById('shopBlueCoinVal');
  const currentBlueVal = gameState.player.blueCoins !== undefined ? gameState.player.blueCoins : (gameState.player.diamonds || 0);
  if (blueCoinEl) blueCoinEl.textContent = formatNumber(currentBlueVal);

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
  if (spinTicketsEl) spinTicketsEl.textContent = `${formatNumber(gameState.player.chestTickets || 0)} Owned`;

  const keysEl = document.getElementById('shopOwnedKeys');
  if (keysEl) keysEl.textContent = `${formatNumber(gameState.player.chestKeys || 0)} Owned`;

  const scratchEl = document.getElementById('shopOwnedScratch');
  if (scratchEl) scratchEl.textContent = `${formatNumber(gameState.player.scratchCards || 0)} Owned`;

  const eggsEl = document.getElementById('shopOwnedEggs');
  if (eggsEl) eggsEl.textContent = `${formatNumber(gameState.player.eggs || 0)} Owned`;

  // Fuel Depot Inventory & Progressive Ad Counts
  const fuelKeys = ['green', 'darkgreen', 'yellow', 'orange', 'red', 'pink', 'purple'];
  const reqAdsMap = { darkgreen: 1, green: 2, yellow: 2, orange: 3, red: 5, pink: 5, purple: 5 };
  fuelKeys.forEach(ft => {
    const el = document.getElementById(`shopOwnedFuel_${ft}`);
    if (el) {
      const count = (gameState.energyGenerator && gameState.energyGenerator.fuelCells && gameState.energyGenerator.fuelCells[ft]) || 0;
      el.textContent = `${formatNumber(count)} Owned`;
    }

    const adLabel = document.getElementById(`adLabel_${ft}`);
    if (adLabel) {
      const totalReq = reqAdsMap[ft] || 1;
      const prog = (gameState.shopAdWatchProgress && gameState.shopAdWatchProgress[ft]) || 0;
      if (prog > 0 && prog < totalReq) {
        adLabel.textContent = `${prog}/${totalReq} Ads`;
        adLabel.style.color = '#f59e0b';
      } else {
        adLabel.textContent = totalReq === 1 ? '1 Ad' : `${totalReq} Ads`;
        adLabel.style.color = '';
      }
    }
  });

  if (typeof window.renderFuelShopTab === 'function') {
    window.renderFuelShopTab();
  }

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
    gameState.reactor.currentEnergy = gameState.reactor.maxEnergy || 1000;
    if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') sfx.playLevelUpSound();
    showShopToast(`Energy Tank 100% Supercharged!`, '⚡');
  }

  updateUI();
  updateShopUI();
  updateProfileUI();
  if (typeof saveGame === 'function') saveGame();
  if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
    window.firebaseSync.saveToCloudImmediate();
  }
};

window.buyPassItem = function(itemType) {
  const PASS_PRICES = {
    spinTicket: { cost: 25, name: 'Spin Ticket', icon: '🎡', field: 'chestTickets', goalKey: 'tickets' },
    ticket: { cost: 25, name: 'Spin Ticket', icon: '🎡', field: 'chestTickets', goalKey: 'tickets' },
    chestKey: { cost: 50, name: 'Mystery Chest Key', icon: '🔑', field: 'chestKeys', goalKey: 'keys' },
    key: { cost: 50, name: 'Mystery Chest Key', icon: '🔑', field: 'chestKeys', goalKey: 'keys' },
    scratchCard: { cost: 35, name: 'Scratch Card', icon: '🎟️', field: 'scratchCards', goalKey: 'cards' },
    egg: { cost: 75, name: 'Cyber Dragon Egg', icon: '🥚', field: 'eggs' }
  };

  const item = PASS_PRICES[itemType];
  if (!item) return;

  if (gameState.player.coins < item.cost) {
    showShopToast(`Need ${item.cost} Coins for ${item.name}!`, '⚠️');
    if (typeof sfx !== 'undefined' && typeof sfx.playTapSound === 'function') sfx.playTapSound(0.5);
    return;
  }

  gameState.player.coins -= item.cost;
  gameState.player[item.field] = (gameState.player[item.field] || 0) + 1;

  // If item corresponds to active level goal target, advance goal progress
  if (item.goalKey && gameState.goalState && gameState.goalState.levelProgress) {
    gameState.goalState.levelProgress[item.goalKey] = (gameState.goalState.levelProgress[item.goalKey] || 0) + 1;
  }

  if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') {
    sfx.playLevelUpSound();
  } else if (typeof sfx !== 'undefined' && typeof sfx.playTapSound === 'function') {
    sfx.playTapSound(1.5);
  }

  showShopToast(`+1 ${item.name} added to vault!`, item.icon);

  if (typeof updateUI === 'function') updateUI();
  if (typeof updateShopUI === 'function') updateShopUI();
  if (typeof updateProfileUI === 'function') updateProfileUI();
  if (typeof updateGoalUI === 'function') updateGoalUI();
  if (typeof updateChestUI === 'function') updateChestUI();
  if (typeof updateSpinUI === 'function') updateSpinUI();
  if (typeof updateEggUI === 'function') updateEggUI();
  if (typeof updateScratchUI === 'function') updateScratchUI();

  if (typeof saveGame === 'function') saveGame();
  if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
    window.firebaseSync.saveToCloudImmediate();
  }
};

// Buy Passes & Vault Items with 200 Blue Coins (1 Key = 200 Blue, 1 Ticket = 200 Blue, 1 Egg = 200 Blue)
window.buyItemWithBlueCoins = function(itemType, cost = 200) {
  const BLUE_PASS_ITEMS = {
    key: { name: 'Mystery Chest Key', icon: '🔑', field: 'chestKeys', goalKey: 'keys' },
    chestKey: { name: 'Mystery Chest Key', icon: '🔑', field: 'chestKeys', goalKey: 'keys' },
    ticket: { name: 'Spin Ticket', icon: '🎡', field: 'chestTickets', goalKey: 'tickets' },
    spinTicket: { name: 'Spin Ticket', icon: '🎡', field: 'chestTickets', goalKey: 'tickets' },
    egg: { name: 'Cyber Dragon Egg', icon: '🥚', field: 'eggs' },
    scratchCard: { name: 'Scratch Card', icon: '🎟️', field: 'scratchCards', goalKey: 'cards' }
  };

  const item = BLUE_PASS_ITEMS[itemType];
  if (!item) return;

  const currentBlue = gameState.player.blueCoins !== undefined ? gameState.player.blueCoins : (gameState.player.diamonds || 0);

  if (currentBlue < cost) {
    if (typeof sfx !== 'undefined' && typeof sfx.playErrorSound === 'function') sfx.playErrorSound();
    showShopToast(`⚠️ Need ${cost} Blue Coins! (Have ${currentBlue})`, '💎');
    return;
  }

  // Deduct Blue Coins
  gameState.player.blueCoins = Math.max(0, currentBlue - cost);
  if (gameState.player.diamonds !== undefined) {
    gameState.player.diamonds = gameState.player.blueCoins;
  }

  // Grant Item to player vault inventory
  gameState.player[item.field] = (gameState.player[item.field] || 0) + 1;

  // If item corresponds to active level goal target, also advance goal progress
  if (item.goalKey && gameState.goalState && gameState.goalState.levelProgress) {
    gameState.goalState.levelProgress[item.goalKey] = (gameState.goalState.levelProgress[item.goalKey] || 0) + 1;
  }

  if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') {
    sfx.playLevelUpSound();
  } else if (typeof sfx !== 'undefined' && typeof sfx.playTapSound === 'function') {
    sfx.playTapSound(1.5);
  }

  showShopToast(`🎉 +1 ${item.name} purchased for ${cost} Blue Coins!`, item.icon);

  if (typeof updateUI === 'function') updateUI();
  if (typeof updateShopUI === 'function') updateShopUI();
  if (typeof updateProfileUI === 'function') updateProfileUI();
  if (typeof updateGoalUI === 'function') updateGoalUI();
  if (typeof updateChestUI === 'function') updateChestUI();
  if (typeof updateSpinUI === 'function') updateSpinUI();
  if (typeof updateEggUI === 'function') updateEggUI();
  if (typeof updateScratchUI === 'function') updateScratchUI();

  if (typeof saveGame === 'function') saveGame();
  if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
    window.firebaseSync.saveToCloudImmediate();
  }
};

window.buyFuelInShop = function(fuelType, price, currency) {
  if (currency === 'coins') {
    window.buyFuelWithCoins(fuelType, price, 1);
  }
};

// ==========================================================================
// ENERGY FUEL CELL SHOP: 6-COLOR HORIZONTAL TABS & DYNAMIC MULTIPLIER ENGINE
// ==========================================================================
let currentSelectedFuelColor = 'green';
let isFuelPurchaseInProgress = false;

// Default configuration with exact base prices and multipliers
const DEFAULT_FUEL_CELLS_CONFIG = {
  basePrices: {
    ad: 1,           // 1 Ad for Green
    blueCoin: 10,    // 10 Blue Coins for Green
    goldCoin: 1,     // 1 Gold Coin for Green
    diamond: 10,     // 10 Diamonds (Section 5)
    coinPack: 150,   // 150 Coins (Section 5)
    bluePack: 75     // 75 Blue Coins (Section 5)
  },
  multipliers: {
    green: 1,
    yellow: 1.5,
    orange: 2.5,
    pink: 7,
    purple: 8.5,
    red: 5
  },
  meta: {
    green: {
      name: 'Green Fuel Cell',
      icon: '🌿',
      effect: '+5 Minutes generator timer boost',
      color: '#10b981'
    },
    yellow: {
      name: 'Yellow Fuel Cell',
      icon: '⚡',
      effect: '+15 Minutes generator timer boost',
      color: '#f59e0b'
    },
    orange: {
      name: 'Orange Fuel Cell',
      icon: '🔥',
      effect: '+30 Minutes generator timer boost',
      color: '#f97316'
    },
    pink: {
      name: 'Pink Boost Fuel',
      icon: '🌸',
      effect: '2x speed generator boost for 10 min',
      color: '#ec4899'
    },
    purple: {
      name: 'Purple Boost Fuel',
      icon: '🔮',
      effect: '5x speed generator boost for 10 min',
      color: '#a855f7'
    },
    red: {
      name: 'Red Fuel Cell',
      icon: '💎',
      effect: '+0.001 EP/Sec rate permanent boost',
      color: '#ef4444'
    }
  }
};

function getFuelCellsConfig() {
  const cloudCfg = (gameState && gameState.fuelCellsConfig) || null;
  if (cloudCfg && cloudCfg.multipliers && cloudCfg.basePrices) {
    return cloudCfg;
  }
  return DEFAULT_FUEL_CELLS_CONFIG;
}

function getFuelCellPricing(color) {
  const cfg = getFuelCellsConfig();
  const mult = (cfg.multipliers && cfg.multipliers[color]) !== undefined ? cfg.multipliers[color] : (DEFAULT_FUEL_CELLS_CONFIG.multipliers[color] || 1);
  const base = cfg.basePrices || DEFAULT_FUEL_CELLS_CONFIG.basePrices;

  // Primary Prices (Base Green: 1 Ad, 10 Blue, 1 Gold Coin)
  // Round up fractional ads and gold coins so integer payments are clean
  const adCost = Math.max(1, Math.ceil(base.ad * mult));
  const blueCost = Math.max(1, Math.round(base.blueCoin * mult));
  const goldCost = Math.max(1, Math.ceil(base.goldCoin * mult));

  // Alternative / Bulk Prices (Base: 10 Diamond, 150 Coin, 75 Blue)
  const diamondCost = Math.max(1, Math.round(base.diamond * mult));
  const coinPackCost = Math.max(1, Math.round(base.coinPack * mult));
  const bluePackCost = Math.max(1, Math.round(base.bluePack * mult));

  return {
    multiplier: mult,
    adCost,
    blueCost,
    goldCost,
    diamondCost,
    coinPackCost,
    bluePackCost
  };
}

function switchFuelTab(color) {
  const allowed = ['green', 'yellow', 'orange', 'pink', 'purple', 'red'];
  if (!allowed.includes(color)) color = 'green';
  currentSelectedFuelColor = color;

  // Highlight tab
  const tabs = document.querySelectorAll('.fuel-color-tab');
  tabs.forEach(tab => {
    if (tab.getAttribute('data-color') === color) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  renderFuelShopTab();
}
window.switchFuelTab = switchFuelTab;

function renderFuelShopTab() {
  const cardContainer = document.getElementById('fuelActiveCard');
  if (!cardContainer) return;

  const color = currentSelectedFuelColor;
  const cfg = getFuelCellsConfig();
  const meta = (cfg.meta && cfg.meta[color]) || DEFAULT_FUEL_CELLS_CONFIG.meta[color] || {
    name: `${color.toUpperCase()} Fuel Cell`,
    icon: '🔋',
    effect: 'Energy reactor fuel cell boost',
    color: '#10b981'
  };

  const pricing = getFuelCellPricing(color);
  const ownedCount = (gameState.energyGenerator && gameState.energyGenerator.fuelCells && gameState.energyGenerator.fuelCells[color]) || 0;

  // Check progressive ad watch progress if any
  const adProgress = (gameState.shopAdWatchProgress && gameState.shopAdWatchProgress[color]) || 0;
  const adLabelText = (adProgress > 0 && adProgress < pricing.adCost) 
    ? `${adProgress}/${pricing.adCost} Ads` 
    : (pricing.adCost === 1 ? '1 Ad' : `${pricing.adCost} Ads`);

  cardContainer.style.borderColor = `${meta.color}55`;
  cardContainer.style.boxShadow = `0 10px 30px rgba(0,0,0,0.5), 0 0 20px ${meta.color}25, inset 0 1px 0 rgba(255,255,255,0.15)`;

  cardContainer.innerHTML = `
    <div class="fuel-card-header">
      <div class="fuel-header-left">
        <div class="fuel-hero-icon" style="background: linear-gradient(135deg, ${meta.color}33, ${meta.color}15); border: 1.5px solid ${meta.color}; color: ${meta.color};">
          <span>${meta.icon}</span>
        </div>
        <div>
          <div class="fuel-hero-title-row">
            <h4 class="fuel-hero-title" style="color: ${meta.color};">${meta.name}</h4>
            <span class="fuel-hero-multiplier-badge">×${pricing.multiplier}</span>
          </div>
          <p class="fuel-hero-desc">${meta.effect}</p>
        </div>
      </div>
      <div class="fuel-inventory-badge" style="border-color: ${meta.color}66; color: ${meta.color};">
        ${formatNumber(ownedCount)} Cells Owned
      </div>
    </div>

    <!-- Section 2 & 4: Primary Purchase Options (Ad, Blue Coin, Gold Coin) -->
    <div>
      <div class="fuel-pricing-section-title">
        <span>⚡ Base Price Options (×${pricing.multiplier})</span>
      </div>
      <div class="fuel-pricing-grid">
        <!-- Option 1: Watch Ad -->
        <button type="button" class="fuel-buy-btn fuel-btn-ad" onclick="purchaseFuelCell('${color}', 'ad')" title="Watch Ad for Fuel Cell">
          <span class="fuel-btn-icon">🎬</span>
          <span class="fuel-btn-cost">${adLabelText}</span>
          <span class="fuel-btn-label">Watch Ad</span>
        </button>

        <!-- Option 2: Blue Coins -->
        <button type="button" class="fuel-buy-btn fuel-btn-blue" onclick="purchaseFuelCell('${color}', 'blueCoin')" title="Buy with ${pricing.blueCost} Blue Coins">
          <span class="fuel-btn-icon">🔷</span>
          <span class="fuel-btn-cost">${formatNumber(pricing.blueCost)}</span>
          <span class="fuel-btn-label">Blue Coins</span>
        </button>

        <!-- Option 3: Gold Coins -->
        <button type="button" class="fuel-buy-btn fuel-btn-gold" onclick="purchaseFuelCell('${color}', 'goldCoin')" title="Buy with ${pricing.goldCost} Gold Coins">
          <span class="fuel-btn-icon">🪙</span>
          <span class="fuel-btn-cost">${formatNumber(pricing.goldCost)}</span>
          <span class="fuel-btn-label">Gold Coins</span>
        </button>
      </div>
    </div>

    <!-- Section 5: Alternative / Bulk Vault Options (Diamond, Coin Pack, Blue Pack) -->
    <div style="border-top: 1px dashed rgba(255,255,255,0.08); padding-top: 10px;">
      <div class="fuel-pricing-section-title">
        <span>💎 Alternative / Vault Options (×${pricing.multiplier})</span>
      </div>
      <div class="fuel-pricing-grid">
        <!-- Option 4: Diamonds (10 * Multiplier) -->
        <button type="button" class="fuel-buy-btn fuel-btn-diamond" onclick="purchaseFuelCell('${color}', 'diamond')" title="Buy with ${pricing.diamondCost} Diamonds">
          <span class="fuel-btn-icon">💎</span>
          <span class="fuel-btn-cost">${formatNumber(pricing.diamondCost)}</span>
          <span class="fuel-btn-label">Diamonds</span>
        </button>

        <!-- Option 5: 150x Coin Pack (150 * Multiplier) -->
        <button type="button" class="fuel-buy-btn fuel-btn-gold" onclick="purchaseFuelCell('${color}', 'coinPack')" title="Buy with ${pricing.coinPackCost} Regular Coins">
          <span class="fuel-btn-icon">🪙</span>
          <span class="fuel-btn-cost">${formatNumber(pricing.coinPackCost)}</span>
          <span class="fuel-btn-label">150× Coins</span>
        </button>

        <!-- Option 6: 75x Blue Pack (75 * Multiplier) -->
        <button type="button" class="fuel-buy-btn fuel-btn-blue" onclick="purchaseFuelCell('${color}', 'bluePack')" title="Buy with ${pricing.bluePackCost} Blue Coins">
          <span class="fuel-btn-icon">🔷</span>
          <span class="fuel-btn-cost">${formatNumber(pricing.bluePackCost)}</span>
          <span class="fuel-btn-label">75× Blue</span>
        </button>
      </div>
    </div>
  `;
}
window.renderFuelShopTab = renderFuelShopTab;

// Comprehensive Fuel Purchase Handler with Concurrency Protection & Atomic Cloud Sync
async function purchaseFuelCell(color, method) {
  if (isFuelPurchaseInProgress) return;
  isFuelPurchaseInProgress = true;

  const resetLock = () => {
    setTimeout(() => { isFuelPurchaseInProgress = false; }, 350);
  };

  const pricing = getFuelCellPricing(color);
  const cfg = getFuelCellsConfig();
  const meta = (cfg.meta && cfg.meta[color]) || DEFAULT_FUEL_CELLS_CONFIG.meta[color] || { name: `${color.toUpperCase()} Fuel Cell` };

  // Make sure fuelCells object exists
  if (!gameState.energyGenerator) gameState.energyGenerator = {};
  if (!gameState.energyGenerator.fuelCells) {
    gameState.energyGenerator.fuelCells = { green: 0, darkgreen: 0, yellow: 0, orange: 0, red: 0, pink: 0, purple: 0 };
  }
  if (!gameState.player) gameState.player = {};

  // 1. WATCH AD METHOD
  if (method === 'ad') {
    const totalAdsRequired = pricing.adCost;
    if (!gameState.shopAdWatchProgress) gameState.shopAdWatchProgress = {};
    const currentProgress = (gameState.shopAdWatchProgress[color] || 0) + 1;

    const onAdWatchedSuccess = () => {
      gameState.player.adsWatchedCount = (gameState.player.adsWatchedCount || 0) + 1;

      if (currentProgress < totalAdsRequired) {
        gameState.shopAdWatchProgress[color] = currentProgress;
        const remaining = totalAdsRequired - currentProgress;
        if (typeof sfx !== 'undefined' && typeof sfx.playTapSound === 'function') sfx.playTapSound(1.3);
        showShopToast(`🎬 Ad ${currentProgress}/${totalAdsRequired} watched! Need ${remaining} more for +1 ${meta.name}.`, '⏳');
      } else {
        // Complete!
        gameState.shopAdWatchProgress[color] = 0;
        gameState.energyGenerator.fuelCells[color] = (gameState.energyGenerator.fuelCells[color] || 0) + 1;
        if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') sfx.playLevelUpSound();
        showShopToast(`🎉 +1 ${meta.name} Unlocked & Added to Energy Depot!`, '🔋');
      }

      finishFuelTransaction();
      resetLock();
    };

    if (typeof window.showRewardedAd === 'function') {
      window.showRewardedAd(onAdWatchedSuccess, {
        adTitle: `Unlock ${meta.name}`,
        adDesc: `Watch ad to unlock fuel cell (${currentProgress}/${totalAdsRequired})`
      });
    } else {
      onAdWatchedSuccess();
    }
    return;
  }

  // 2. BLUE COIN METHOD (Primary Base 10)
  if (method === 'blueCoin') {
    const cost = pricing.blueCost;
    const current = gameState.player.blueCoins || 0;
    if (current < cost) {
      if (typeof sfx !== 'undefined' && typeof sfx.playErrorSound === 'function') sfx.playErrorSound();
      showShopToast(`⚠️ Need ${formatNumber(cost)} Blue Coins! (Have ${formatNumber(current)})`, '🔷');
      resetLock();
      return;
    }
    gameState.player.blueCoins -= cost;
    awardFuelCellAndSave(color, meta.name, `${cost} Blue Coins`);
    resetLock();
    return;
  }

  // 3. GOLD COIN METHOD (Primary Base 1)
  if (method === 'goldCoin') {
    const cost = pricing.goldCost;
    const current = gameState.player.coins || 0;
    if (current < cost) {
      if (typeof sfx !== 'undefined' && typeof sfx.playErrorSound === 'function') sfx.playErrorSound();
      showShopToast(`⚠️ Need ${formatNumber(cost)} Gold Coins! (Have ${formatNumber(current)})`, '🪙');
      resetLock();
      return;
    }
    gameState.player.coins -= cost;
    awardFuelCellAndSave(color, meta.name, `${cost} Gold Coins`);
    resetLock();
    return;
  }

  // 4. DIAMOND METHOD (Base 10)
  if (method === 'diamond') {
    const cost = pricing.diamondCost;
    const current = gameState.player.diamonds || 0;
    if (current < cost) {
      if (typeof sfx !== 'undefined' && typeof sfx.playErrorSound === 'function') sfx.playErrorSound();
      showShopToast(`⚠️ Need ${formatNumber(cost)} Diamonds! (Have ${formatNumber(current)})`, '💎');
      resetLock();
      return;
    }
    gameState.player.diamonds -= cost;
    awardFuelCellAndSave(color, meta.name, `${cost} Diamonds`);
    resetLock();
    return;
  }

  // 5. COIN PACK METHOD (Base 150)
  if (method === 'coinPack') {
    const cost = pricing.coinPackCost;
    const current = gameState.player.coins || 0;
    if (current < cost) {
      if (typeof sfx !== 'undefined' && typeof sfx.playErrorSound === 'function') sfx.playErrorSound();
      showShopToast(`⚠️ Need ${formatNumber(cost)} Coins! (Have ${formatNumber(current)})`, '🪙');
      resetLock();
      return;
    }
    gameState.player.coins -= cost;
    awardFuelCellAndSave(color, meta.name, `${formatNumber(cost)} Coins`);
    resetLock();
    return;
  }

  // 6. BLUE PACK METHOD (Base 75)
  if (method === 'bluePack') {
    const cost = pricing.bluePackCost;
    const current = gameState.player.blueCoins || 0;
    if (current < cost) {
      if (typeof sfx !== 'undefined' && typeof sfx.playErrorSound === 'function') sfx.playErrorSound();
      showShopToast(`⚠️ Need ${formatNumber(cost)} Blue Coins! (Have ${formatNumber(current)})`, '🔷');
      resetLock();
      return;
    }
    gameState.player.blueCoins -= cost;
    awardFuelCellAndSave(color, meta.name, `${formatNumber(cost)} Blue Coins`);
    resetLock();
    return;
  }

  resetLock();
}
window.purchaseFuelCell = purchaseFuelCell;

function awardFuelCellAndSave(color, fuelName, spentDetails) {
  gameState.energyGenerator.fuelCells[color] = (gameState.energyGenerator.fuelCells[color] || 0) + 1;

  if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') {
    sfx.playLevelUpSound();
  }
  showShopToast(`🎉 +1 ${fuelName} Purchased for ${spentDetails}!`, '🔋');

  finishFuelTransaction();
}

function finishFuelTransaction() {
  renderFuelShopTab();
  updateShopUI();
  if (typeof updateProfileUI === 'function') updateProfileUI();
  if (typeof updateEnergyUI === 'function') updateEnergyUI();
  if (typeof updateHomeUI === 'function') updateHomeUI();
  if (typeof updateUI === 'function') updateUI();

  if (typeof saveGame === 'function') saveGame();
  if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
    window.firebaseSync.saveToCloudImmediate();
  }
}

// Backwards-compatible wrappers
window.buyFuelWithAds = function(fuelType) {
  return purchaseFuelCell(fuelType, 'ad');
};

window.buyFuelWithCoins = function(fuelType) {
  return purchaseFuelCell(fuelType, 'goldCoin');
};

window.buyFuelWithDiamonds = function(fuelType) {
  return purchaseFuelCell(fuelType, 'diamond');
};

window.convertBlueCoinsToFuelAd = function(fuelType) {
  return purchaseFuelCell(fuelType, 'blueCoin');
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
  gameState.player.coins = (gameState.player.coins || 0) + 25;
  gameState.player.chestTickets = (gameState.player.chestTickets || 0) + 1;
  gameState.player.spinTickets = gameState.player.chestTickets;
  gameState.reactor.currentEnergy = Math.min(
    gameState.reactor.maxEnergy || 1000,
    (gameState.reactor.currentEnergy || 0) + 100
  );

  if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') sfx.playLevelUpSound();
  showShopToast(`Claimed! +25 🪙, +1 🎡 Ticket, +100 ⚡ Energy`, '🎁');

  updateUI();
  updateProfileUI();
  updateShopUI();
  if (typeof updateHomeUI === 'function') updateHomeUI();
  if (typeof updateEnergyUI === 'function') updateEnergyUI();
  if (typeof updateSpinTicketUI === 'function') updateSpinTicketUI();
  if (typeof updateRewardViewUI === 'function') updateRewardViewUI();
  if (typeof updateGoalViewUI === 'function') updateGoalViewUI();
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

  const cardCodeEl = document.getElementById('profileCardUserCode');
  if (cardCodeEl) cardCodeEl.textContent = gameState.player.profileCode || 'ET-000000';

  const userValEl = document.getElementById('profileUsernameVal');
  if (userValEl) userValEl.textContent = gameState.player.name || 'Alex Vance';

  const tgValEl = document.getElementById('profileTelegramVal');
  if (tgValEl) tgValEl.textContent = gameState.player.telegram || `@${gameState.player.handle || 'alex_blue'}`;

  const tgIdBadge = document.getElementById('profileTelegramIdBadge');
  if (tgIdBadge) {
    if (gameState.player.telegramId) {
      tgIdBadge.textContent = `ID: ${gameState.player.telegramId}`;
      tgIdBadge.style.color = '#10b981';
    } else {
      tgIdBadge.textContent = 'ID: Not linked';
      tgIdBadge.style.color = '#64748b';
    }
  }

  const mobValEl = document.getElementById('profileMobileVal');
  const mobActionWrap = document.getElementById('profileMobileActionWrap');
  if (mobValEl) {
    if (gameState.player.mobile) {
      mobValEl.textContent = gameState.player.mobile;
      if (mobActionWrap) {
        if (gameState.player.phoneVerified) {
          mobActionWrap.innerHTML = `
            <span style="font-size: 9.5px; font-weight: 800; color: #10b981; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); padding: 2px 6px; border-radius: 9999px;">Verified ✓</span>
          `;
        } else {
          mobActionWrap.innerHTML = `
            <button type="button" onclick="openPhoneVerificationModal()" class="feature-btn" style="padding: 2px 7px; font-size: 9.5px; font-weight: 800; border-radius: 9999px; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); color: #f59e0b;">
              Verify 📱
            </button>
          `;
        }
      }
    } else {
      mobValEl.textContent = 'Not linked';
      if (mobActionWrap) {
        mobActionWrap.innerHTML = `
          <button type="button" onclick="openPhoneVerificationModal()" class="feature-btn" style="padding: 2px 7px; font-size: 9.5px; font-weight: 800; border-radius: 9999px; background: rgba(52, 211, 153, 0.15); border: 1px solid rgba(52, 211, 153, 0.4); color: #34d399;">
            Link 📱
          </button>
        `;
      }
    }
  }

  // Email Address & Verification Status
  const emailValEl = document.getElementById('profileEmailVal');
  const emailActionWrap = document.getElementById('profileEmailActionWrap');
  if (emailValEl) {
    if (gameState.player.email) {
      emailValEl.textContent = gameState.player.email;
      if (emailActionWrap) {
        if (gameState.player.emailVerified) {
          emailActionWrap.innerHTML = `
            <span style="font-size: 10px; font-weight: 800; color: #10b981; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); padding: 3px 8px; border-radius: 9999px;">Verified ✅</span>
            <button type="button" onclick="confirmResetLoginEmail()" title="Unlink / Reset Email" style="background: none; border: none; cursor: pointer; font-size: 11px; color: #94a3b8; padding: 2px;">✕</button>
          `;
        } else {
          emailActionWrap.innerHTML = `
            <button type="button" onclick="openEmailVerificationModal('emailVerifyPurposeLoginSetup')" class="feature-btn" style="padding: 4px 10px; font-size: 10.5px; font-weight: 800; border-radius: 9999px; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); color: #f59e0b;">
              <span>⚠️ Verify Code</span>
            </button>
          `;
        }
      }
    } else {
      emailValEl.textContent = 'Not linked';
      if (emailActionWrap) {
        emailActionWrap.innerHTML = `
          <button type="button" onclick="openEmailVerificationModal('emailVerifyPurposeLoginSetup')" class="feature-btn" style="padding: 4px 10px; font-size: 10.5px; font-weight: 800; border-radius: 9999px; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.4); color: #38bdf8;">
            <span>✉️ Verify Email</span>
          </button>
        `;
      }
    }
  }

  // Update active device & session indicator
  const devModelEl = document.getElementById('currentDeviceModelText');
  const devHashEl = document.getElementById('currentDeviceSessionHashText');
  if (devModelEl && window.firebaseSync && typeof window.firebaseSync.detectDeviceInfo === 'function') {
    const info = window.firebaseSync.detectDeviceInfo();
    const hash = window.firebaseSync.getSessionHash();
    devModelEl.textContent = `${info.device_model} • Active Now`;
    if (devHashEl) devHashEl.textContent = `Session: #${hash.slice(-6)} (${info.platform})`;
  }

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

      <!-- Profile Code Field (Fixed Permanent Code) -->
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <label style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Profile Login Code</label>
          <span style="font-size: 9.5px; font-weight: 800; color: #10b981; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.35); padding: 1.5px 6px; border-radius: 999px;">🔒 FIXED PERMANENT</span>
        </div>
        <input type="text" id="secInputCode" value="${currentCode}" readonly style="background: rgba(15, 23, 42, 0.6); border: 1.5px solid rgba(56, 189, 248, 0.25); border-radius: 10px; padding: 10px 12px; font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 800; color: #38bdf8; outline: none; cursor: not-allowed; opacity: 0.85;">
        <span style="font-size: 10px; color: #64748b;">Unique auto-assigned code linked to your cloud data. Cannot be changed to prevent duplicate account creation.</span>
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

// Open Login with Code / Phone Modal
window.openLoginWithCodeModal = function(activeTab = 'code') {
  DOM.sheetTitle.textContent = activeTab === 'phone' ? 'Telegram Phone Login' : 'Cloud Login with Profile Code';

  DOM.sheetContent.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 14px; padding: 4px 0;">
      <!-- Tab Switcher -->
      <div style="display: flex; gap: 8px; background: rgba(15, 23, 42, 0.6); padding: 4px; border-radius: 12px; border: 1px solid rgba(56, 189, 248, 0.2);">
        <button type="button" onclick="openLoginWithCodeModal('code')" class="feature-btn" style="flex: 1; padding: 8px; font-size: 11.5px; font-weight: 800; border-radius: 8px; background: ${activeTab === 'code' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'transparent'}; color: ${activeTab === 'code' ? '#fff' : '#94a3b8'};">
          <span>🔑 Profile Code</span>
        </button>
        <button type="button" onclick="openLoginWithCodeModal('phone')" class="feature-btn" style="flex: 1; padding: 8px; font-size: 11.5px; font-weight: 800; border-radius: 8px; background: ${activeTab === 'phone' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'transparent'}; color: ${activeTab === 'phone' ? '#fff' : '#94a3b8'};">
          <span>📱 Telegram Phone</span>
        </button>
      </div>

      ${activeTab === 'code' ? `
        <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0;">
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
      ` : `
        <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0;">
          Enter your phone number to receive a Telegram verification code and restore your account progress.
        </p>

        <div style="display: flex; flex-direction: column; gap: 6px;">
          <label style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Phone Number (with country code)</label>
          <input type="tel" id="loginPhoneInput" placeholder="+1234567890" value="${gameState.player.mobile || ''}" style="background: rgba(15, 23, 42, 0.9); border: 1.5px solid rgba(56, 189, 248, 0.4); border-radius: 10px; padding: 12px; font-family: 'JetBrains Mono', monospace; font-size: 15px; font-weight: 800; color: #38bdf8; outline: none;">
        </div>

        <!-- Code Settings (codeSettings#ad253d78) -->
        <div style="display: flex; flex-direction: column; gap: 6px; background: rgba(2, 6, 23, 0.7); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 10px; padding: 10px;">
          <div style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase;">Delivery Options (CodeSettings)</div>
          <div style="display: flex; flex-wrap: wrap; gap: 10px;">
            <label style="font-size: 11px; color: #cbd5e1; display: flex; align-items: center; gap: 5px; cursor: pointer;">
              <input type="checkbox" id="chkSettingFirebase" checked style="accent-color: #0284c7;">
              <span>Firebase SMS</span>
            </label>
            <label style="font-size: 11px; color: #cbd5e1; display: flex; align-items: center; gap: 5px; cursor: pointer;">
              <input type="checkbox" id="chkSettingFlashcall" style="accent-color: #0284c7;">
              <span>Flash Call</span>
            </label>
            <label style="font-size: 11px; color: #cbd5e1; display: flex; align-items: center; gap: 5px; cursor: pointer;">
              <input type="checkbox" id="chkSettingApp" style="accent-color: #0284c7;">
              <span>Telegram App</span>
            </label>
          </div>
        </div>

        <div id="loginPhoneErrorNotice" style="display: none; padding: 8px 12px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 10px; font-size: 11px; color: #f87171; line-height: 1.4;"></div>

        <button id="btnSendPhoneCodeSubmit" class="feature-btn" onclick="submitSendPhoneCode('login')" style="padding: 12px; font-size: 13px; font-weight: 800; border-radius: 12px; margin-top: 4px; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);">
          <span>📨</span>
          <span>Send Telegram Code (auth.sendCode)</span>
        </button>
      `}
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

// ==========================================================================
// TELEGRAM MTPROTO ACTIVE SESSIONS & DEVICES MANAGER
// ==========================================================================
window.openAuthorizationsModal = async function() {
  DOM.sheetTitle.textContent = 'Active Sessions & Devices';

  DOM.sheetContent.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 30px 10px; gap: 10px;">
      <div class="session-pulsing-dot" style="width: 14px; height: 14px;"></div>
      <span style="font-size: 13px; color: #94a3b8; font-weight: 700;">Loading active authorizations...</span>
    </div>
  `;
  DOM.modalBackdrop.classList.add('open');

  if (!window.firebaseSync || typeof window.firebaseSync.getAuthorizations !== 'function') {
    DOM.sheetContent.innerHTML = `
      <div style="padding: 16px; text-align: center; color: #f87171; font-size: 13px;">
        Active sessions manager unavailable in offline mode.
      </div>
    `;
    return;
  }

  try {
    const data = await window.firebaseSync.getAuthorizations();
    renderAuthorizationsModalContent(data);
  } catch (err) {
    DOM.sheetContent.innerHTML = `
      <div style="padding: 16px; text-align: center; color: #f87171; font-size: 13px;">
        Failed to load authorizations: ${err.message}
      </div>
    `;
  }
};

window.renderAuthorizationsModalContent = function(data) {
  const authorizations = data.authorizations || [];
  const otherSessions = authorizations.filter(a => !a.current);

  const formatTime = (ts) => {
    if (!ts) return 'Unknown';
    const d = new Date(ts * 1000);
    return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getPlatformIcon = (platform, isCurrent) => {
    const p = (platform || '').toLowerCase();
    if (p.includes('ios') || p.includes('iphone') || p.includes('ipad')) return '📱';
    if (p.includes('android')) return '🤖';
    if (p.includes('mac')) return '💻';
    if (p.includes('win')) return '🖥️';
    if (p.includes('linux')) return '🐧';
    return isCurrent ? '🟢' : '🌐';
  };

  let html = `
    <div style="display: flex; flex-direction: column; gap: 14px; padding: 4px 0;">
      <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0;">
        Review and manage all devices currently logged into your account. Terminating a session will instantly revoke its access.
      </p>
  `;

  if (otherSessions.length > 0) {
    html += `
      <button type="button" class="session-btn-terminate-all" onclick="terminateAllOtherAuthSessions()">
        <span>🛑</span>
        <span>Terminate All Other Sessions (${otherSessions.length})</span>
      </button>
    `;
  }

  html += `<div style="display: flex; flex-direction: column; gap: 10px;">`;

  authorizations.forEach(auth => {
    const isCur = Boolean(auth.current);
    const icon = getPlatformIcon(auth.platform, isCur);
    const createdStr = formatTime(auth.date_created);
    const activeStr = isCur ? 'Active Now' : formatTime(auth.date_active);
    const locationStr = [auth.region, auth.country].filter(Boolean).join(', ') || 'Global';

    html += `
      <div class="session-item-card ${isCur ? 'current' : ''}">
        <div class="session-card-header">
          <div class="session-device-title">
            <span style="font-size: 16px;">${icon}</span>
            <span>${auth.device_model || 'Unknown Device'}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 5px;">
            ${isCur ? `<span class="session-badge-current"><span class="session-pulsing-dot" style="width: 6px; height: 6px;"></span> This Device</span>` : ''}
            ${auth.official_app ? `<span class="session-badge-official">Telegram Mini App</span>` : ''}
          </div>
        </div>

        <div class="session-meta-grid">
          <div>OS: <strong>${auth.platform || 'Web'} ${auth.system_version || ''}</strong></div>
          <div>IP: <strong>${auth.ip || '127.0.0.1'}</strong></div>
          <div>Location: <strong>${locationStr}</strong></div>
          <div>Last Active: <strong>${activeStr}</strong></div>
          <div>Session Hash: <strong>#${String(auth.hash).slice(-8)}</strong></div>
          <div>Logged In: <strong>${createdStr}</strong></div>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px; border-top: 1px dashed rgba(255, 255, 255, 0.08); padding-top: 6px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <label style="font-size: 10.5px; color: #94a3b8; display: flex; align-items: center; gap: 4px; cursor: pointer;">
              <input type="checkbox" ${auth.call_requests_disabled ? 'checked' : ''} onchange="toggleAuthCallRequests('${auth.hash}', this.checked)" style="cursor: pointer;">
              <span>Disable Calls</span>
            </label>
          </div>

          ${isCur ? `
            <span style="font-size: 11px; font-weight: 700; color: #10b981; display: inline-flex; align-items: center; gap: 4px;">
              <span>✅</span> Current Session
            </span>
          ` : `
            <button type="button" class="session-action-btn-revoke" onclick="terminateAuthSession('${auth.hash}')">
              <span>🛑</span>
              <span>Revoke</span>
            </button>
          `}
        </div>
      </div>
    `;
  });

  html += `
      </div>
    </div>
  `;

  DOM.sheetContent.innerHTML = html;
};

// Terminate single session
window.terminateAuthSession = async function(hash) {
  if (!confirm('Are you sure you want to terminate this session? The device will be logged out immediately.')) {
    return;
  }
  if (window.firebaseSync && typeof window.firebaseSync.resetAuthorization === 'function') {
    await window.firebaseSync.resetAuthorization(hash);
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('🛑 Session revoked successfully.');
    }
    const data = await window.firebaseSync.getAuthorizations();
    renderAuthorizationsModalContent(data);
  }
};

// Terminate all other sessions
window.terminateAllOtherAuthSessions = async function() {
  if (!confirm('Terminate ALL other active sessions? All other phones and browsers will be logged out immediately.')) {
    return;
  }
  if (window.firebaseSync && typeof window.firebaseSync.resetAllOtherAuthorizations === 'function') {
    await window.firebaseSync.resetAllOtherAuthorizations();
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('🛑 All other sessions terminated.');
    }
    const data = await window.firebaseSync.getAuthorizations();
    renderAuthorizationsModalContent(data);
  }
};

// Toggle call requests setting
window.toggleAuthCallRequests = async function(hash, checked) {
  if (window.firebaseSync && typeof window.firebaseSync.changeAuthorizationSettings === 'function') {
    await window.firebaseSync.changeAuthorizationSettings(hash, { call_requests_disabled: checked });
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(checked ? '🔇 Call requests disabled for session' : '🔊 Call requests enabled');
    }
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
  if (gameState.player.blueCoins !== undefined) gameState.player.blueCoins = gameState.player.diamonds;
  gameState.player.chestTickets = (gameState.player.chestTickets || 0) + 1;
  gameState.player.spinTickets = gameState.player.chestTickets;
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
  updateShopUI();
  if (typeof updateSpinTicketUI === 'function') updateSpinTicketUI();
  if (typeof updateRewardViewUI === 'function') updateRewardViewUI();
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

  // Synchronize UI across all tabs
  updateBlueTabUI();
  updateShopUI();
  updateProfileUI();
  if (typeof updateHomeUI === 'function') updateHomeUI();
  if (typeof updateEnergyUI === 'function') updateEnergyUI();
  if (typeof updateMegaDiamondDisplay === 'function') updateMegaDiamondDisplay();
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

// ==========================================================================
// TELEGRAM MTPROTO EMAIL VERIFICATION MODAL & FLOW
// ==========================================================================

window.openEmailVerificationModal = function(purpose = 'emailVerifyPurposeLoginSetup', step = 1, pattern = '') {
  DOM.sheetTitle.textContent = purpose === 'emailVerifyPurposeLoginChange' ? 'Change Login Email' : 'Setup Login Email';

  const currentEmail = gameState.player.email || '';

  if (step === 1) {
    DOM.sheetContent.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 14px; padding: 4px 0;">
        <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0;">
          Link a verified email to protect your account and receive Telegram security login notifications.
        </p>

        <div style="display: flex; flex-direction: column; gap: 6px;">
          <label style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Email Address</label>
          <input type="email" id="inpVerifyEmailTarget" placeholder="name@domain.com" value="${currentEmail}" style="background: rgba(15, 23, 42, 0.9); border: 1.5px solid rgba(56, 189, 248, 0.4); border-radius: 10px; padding: 12px; font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 700; color: #38bdf8; outline: none;">
        </div>

        <div id="emailVerifErrorNotice" style="display: none; padding: 8px 12px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 10px; font-size: 11px; color: #f87171; line-height: 1.4;"></div>

        <button type="button" id="btnSendEmailCode" onclick="submitSendVerifyEmailCode('${purpose}')" class="feature-btn" style="padding: 12px; font-size: 13px; font-weight: 800; border-radius: 12px; margin-top: 4px; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);">
          <span>📨</span>
          <span>Send 6-Digit Code</span>
        </button>

        <!-- Social 1-Tap Verification (auth.sentCodeTypeSetUpEmailRequired: apple/google) -->
        <div style="display: flex; align-items: center; gap: 10px; margin: 4px 0;">
          <div style="flex: 1; height: 1px; background: rgba(255, 255, 255, 0.1);"></div>
          <span style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Or 1-Tap Sign-In</span>
          <div style="flex: 1; height: 1px; background: rgba(255, 255, 255, 0.1);"></div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <button type="button" onclick="submitSocialEmailVerification('google')" class="feature-btn" style="padding: 10px; font-size: 11.5px; font-weight: 800; border-radius: 10px; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.2); color: #ffffff;">
            <span>🌐 Google</span>
          </button>
          <button type="button" onclick="submitSocialEmailVerification('apple')" class="feature-btn" style="padding: 10px; font-size: 11.5px; font-weight: 800; border-radius: 10px; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.2); color: #ffffff;">
            <span>🍎 Apple</span>
          </button>
        </div>
      </div>
    `;
  } else if (step === 2) {
    DOM.sheetContent.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 14px; padding: 4px 0;">
        <div style="display: flex; align-items: center; gap: 8px; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); padding: 10px 12px; border-radius: 12px;">
          <span style="font-size: 18px;">✉️</span>
          <div style="display: flex; flex-direction: column;">
            <span style="font-size: 11px; font-weight: 800; color: #f8fafc;">Verification code sent</span>
            <span style="font-size: 11.5px; font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #38bdf8;">${pattern || 'your email'}</span>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 6px;">
          <label style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Enter 6-Digit Code</label>
          <input type="text" id="inpVerifyEmailCode" maxlength="6" placeholder="• • • • • •" style="background: rgba(15, 23, 42, 0.9); border: 1.5px solid rgba(56, 189, 248, 0.4); border-radius: 10px; padding: 12px; font-family: 'JetBrains Mono', monospace; font-size: 20px; font-weight: 800; color: #38bdf8; outline: none; text-align: center; letter-spacing: 6px;">
        </div>

        <div id="emailVerifErrorNotice" style="display: none; padding: 8px 12px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 10px; font-size: 11px; color: #f87171; line-height: 1.4;"></div>

        <button type="button" id="btnConfirmEmailVerify" onclick="submitVerifyEmailCode('${purpose}')" class="feature-btn" style="padding: 12px; font-size: 13px; font-weight: 800; border-radius: 12px; margin-top: 4px; background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
          <span>✅</span>
          <span>Verify & Confirm Email</span>
        </button>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
          <button type="button" onclick="openEmailVerificationModal('${purpose}', 1)" style="background: none; border: none; color: #94a3b8; font-size: 11.5px; font-weight: 700; cursor: pointer;">
            ← Change Email
          </button>
          <button type="button" onclick="submitSendVerifyEmailCode('${purpose}')" style="background: none; border: none; color: #38bdf8; font-size: 11.5px; font-weight: 700; cursor: pointer;">
            Resend Code
          </button>
        </div>
      </div>
    `;
  }

  DOM.modalBackdrop.classList.add('open');
};

// Send OTP code
window.submitSendVerifyEmailCode = async function(purpose = 'emailVerifyPurposeLoginSetup') {
  const input = document.getElementById('inpVerifyEmailTarget');
  const errNotice = document.getElementById('emailVerifErrorNotice');
  const btn = document.getElementById('btnSendEmailCode');
  const email = (input?.value || gameState.player.email || '').trim();

  if (!email) {
    if (errNotice) {
      errNotice.textContent = 'Please enter an email address.';
      errNotice.style.display = 'block';
    }
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Sending Code...';
  }
  if (errNotice) errNotice.style.display = 'none';

  if (window.firebaseSync && typeof window.firebaseSync.sendVerifyEmailCode === 'function') {
    const res = await window.firebaseSync.sendVerifyEmailCode(purpose, email);

    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Send 6-Digit Code';
    }

    if (!res.ok) {
      if (errNotice) {
        errNotice.textContent = res.error || 'Failed to send code.';
        errNotice.style.display = 'block';
      } else {
        alert(res.error);
      }
      return;
    }

    openEmailVerificationModal(purpose, 2, res.sent_code?.email_pattern || email);
  } else {
    alert('Service offline.');
  }
};

// Verify OTP code
window.submitVerifyEmailCode = async function(purpose = 'emailVerifyPurposeLoginSetup') {
  const input = document.getElementById('inpVerifyEmailCode');
  const errNotice = document.getElementById('emailVerifErrorNotice');
  const btn = document.getElementById('btnConfirmEmailVerify');
  const code = (input?.value || '').trim();

  if (!code || code.length < 6) {
    if (errNotice) {
      errNotice.textContent = 'Please enter the 6-digit code.';
      errNotice.style.display = 'block';
    }
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Verifying...';
  }
  if (errNotice) errNotice.style.display = 'none';

  if (window.firebaseSync && typeof window.firebaseSync.verifyEmail === 'function') {
    const res = await window.firebaseSync.verifyEmail(purpose, { type: 'code', code });

    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Verify & Confirm Email';
    }

    if (!res.ok) {
      if (errNotice) {
        errNotice.textContent = res.error || 'Verification failed.';
        errNotice.style.display = 'block';
      } else {
        alert(res.error);
      }
      return;
    }

    DOM.modalBackdrop.classList.remove('open');
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`🎉 Email ${res.verified?.email || ''} successfully verified!`);
    } else {
      alert('Email successfully verified!');
    }
    updateProfileUI();
  } else {
    alert('Service offline.');
  }
};

// Social 1-tap verification
window.submitSocialEmailVerification = async function(provider) {
  if (window.firebaseSync && typeof window.firebaseSync.verifyEmail === 'function') {
    const res = await window.firebaseSync.verifyEmail('emailVerifyPurposeLoginSetup', {
      type: provider,
      token: `token_${provider}_${Date.now()}`
    });

    if (res.ok) {
      DOM.modalBackdrop.classList.remove('open');
      if (typeof showFloatingToast === 'function') {
        showFloatingToast(`🎉 Linked via ${provider.toUpperCase()}! Email verified.`);
      }
      updateProfileUI();
    } else {
      alert(res.error || 'Social sign-in failed.');
    }
  }
};

// Confirm unlink / reset email
window.confirmResetLoginEmail = async function() {
  if (!confirm('Unlink this email from your account? You can link or verify another email anytime.')) {
    return;
  }
  if (window.firebaseSync && typeof window.firebaseSync.resetLoginEmail === 'function') {
    await window.firebaseSync.resetLoginEmail();
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('Email address unlinked.');
    }
    updateProfileUI();
  }
};

// ==========================================================================
// TELEGRAM MTPROTO PHONE CODE DISPATCH & VERIFICATION FLOW
// ==========================================================================

window.renderPhoneCodeInputModal = function(phone, phoneCodeHash, mode = 'login', sentCodeType = {}) {
  DOM.sheetTitle.textContent = mode === 'link' ? 'Verify Mobile Number' : 'Enter Telegram Code';

  let countdown = 60;
  const methodLabel = sentCodeType._constructor ? sentCodeType._constructor.split('#')[0] : 'SMS OTP';

  DOM.sheetContent.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 14px; padding: 4px 0;">
      <div style="display: flex; align-items: center; gap: 8px; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); padding: 10px 12px; border-radius: 12px;">
        <span style="font-size: 20px;">📱</span>
        <div style="display: flex; flex-direction: column;">
          <span style="font-size: 11px; font-weight: 800; color: #f8fafc;">Code sent to ${phone}</span>
          <span style="font-size: 10px; color: #38bdf8; font-family: 'JetBrains Mono', monospace;">Method: ${methodLabel}</span>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 6px;">
        <label style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">6-Digit OTP Code</label>
        <input type="text" id="inpPhoneVerifyCode" maxlength="6" placeholder="• • • • • •" style="background: rgba(15, 23, 42, 0.9); border: 1.5px solid rgba(56, 189, 248, 0.4); border-radius: 10px; padding: 12px; font-family: 'JetBrains Mono', monospace; font-size: 20px; font-weight: 800; color: #38bdf8; outline: none; text-align: center; letter-spacing: 6px;">
      </div>

      <div id="phoneCodeErrorNotice" style="display: none; padding: 8px 12px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 10px; font-size: 11px; color: #f87171; line-height: 1.4;"></div>

      <button id="btnSubmitPhoneVerify" class="feature-btn" onclick="submitVerifyPhoneCode('${phone}', '${phoneCodeHash}', '${mode}')" style="padding: 12px; font-size: 13px; font-weight: 800; border-radius: 12px; margin-top: 4px; background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
        <span>✅</span>
        <span>Verify & Proceed</span>
      </button>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
        <button type="button" onclick="openLoginWithCodeModal('phone')" style="background: none; border: none; color: #94a3b8; font-size: 11px; font-weight: 700; cursor: pointer;">
          ← Change Number
        </button>
        <button type="button" id="btnPhoneResend" onclick="submitResendPhoneCode('${phone}', '${phoneCodeHash}', '${mode}')" style="background: none; border: none; color: #38bdf8; font-size: 11px; font-weight: 700; cursor: pointer;">
          Resend Code (<span id="phoneResendTimer">60s</span>)
        </button>
      </div>
    </div>
  `;

  // Countdown timer
  clearInterval(window._phoneResendInterval);
  window._phoneResendInterval = setInterval(() => {
    countdown--;
    const timerEl = document.getElementById('phoneResendTimer');
    const resendBtn = document.getElementById('btnPhoneResend');
    if (timerEl) timerEl.textContent = `${countdown}s`;
    if (countdown <= 0) {
      clearInterval(window._phoneResendInterval);
      if (resendBtn) resendBtn.textContent = 'Resend Code Now';
    }
  }, 1000);
};

// Open Phone Verification Modal for linking phone to current account
window.openPhoneVerificationModal = function() {
  DOM.sheetTitle.textContent = 'Link & Verify Mobile Number';
  const currentPhone = gameState.player.mobile || '';

  DOM.sheetContent.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 14px; padding: 4px 0;">
      <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0;">
        Link your mobile phone number using Telegram's MTProto verification code dispatch.
      </p>

      <div style="display: flex; flex-direction: column; gap: 6px;">
        <label style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Mobile Number</label>
        <input type="tel" id="inpLinkPhoneTarget" placeholder="+1234567890" value="${currentPhone}" style="background: rgba(15, 23, 42, 0.9); border: 1.5px solid rgba(56, 189, 248, 0.4); border-radius: 10px; padding: 12px; font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 700; color: #38bdf8; outline: none;">
      </div>

      <div id="phoneLinkErrorNotice" style="display: none; padding: 8px 12px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 10px; font-size: 11px; color: #f87171; line-height: 1.4;"></div>

      <button type="button" id="btnSendPhoneLinkCode" onclick="submitSendPhoneCode('link')" class="feature-btn" style="padding: 12px; font-size: 13px; font-weight: 800; border-radius: 12px; margin-top: 4px; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);">
        <span>📨</span>
        <span>Send Code (auth.sendCode)</span>
      </button>
    </div>
  `;

  DOM.modalBackdrop.classList.add('open');
};

// Send Phone Code handler
window.submitSendPhoneCode = async function(mode = 'login') {
  const inputId = mode === 'link' ? 'inpLinkPhoneTarget' : 'loginPhoneInput';
  const errId = mode === 'link' ? 'phoneLinkErrorNotice' : 'loginPhoneErrorNotice';
  const btnId = mode === 'link' ? 'btnSendPhoneLinkCode' : 'btnSendPhoneCodeSubmit';

  const input = document.getElementById(inputId);
  const errNotice = document.getElementById(errId);
  const btn = document.getElementById(btnId);
  const phone = (input?.value || '').trim();

  if (!phone) {
    if (errNotice) {
      errNotice.textContent = 'Please enter a valid phone number with country code.';
      errNotice.style.display = 'block';
    }
    return;
  }

  const allowFirebase = document.getElementById('chkSettingFirebase')?.checked ?? true;
  const allowFlashcall = document.getElementById('chkSettingFlashcall')?.checked ?? false;
  const allowApp = document.getElementById('chkSettingApp')?.checked ?? false;

  const settings = {
    allow_firebase: allowFirebase,
    allow_flashcall: allowFlashcall,
    allow_app_hash: allowApp
  };

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Sending Code...';
  }
  if (errNotice) errNotice.style.display = 'none';

  if (window.firebaseSync && typeof window.firebaseSync.sendCode === 'function') {
    const res = await window.firebaseSync.sendCode(phone, settings);

    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Send Telegram Code';
    }

    if (!res.ok) {
      if (errNotice) {
        errNotice.textContent = res.error || 'Failed to send code.';
        errNotice.style.display = 'block';
      } else {
        alert(res.error);
      }
      return;
    }

    renderPhoneCodeInputModal(phone, res.sent_code?.phone_code_hash, mode, res.sent_code?.type);
  } else {
    alert('Service offline.');
  }
};

// Verify Phone Code handler
window.submitVerifyPhoneCode = async function(phone, phoneCodeHash, mode = 'login') {
  const input = document.getElementById('inpPhoneVerifyCode');
  const errNotice = document.getElementById('phoneCodeErrorNotice');
  const btn = document.getElementById('btnSubmitPhoneVerify');
  const code = (input?.value || '').trim();

  if (!code || code.length < 5) {
    if (errNotice) {
      errNotice.textContent = 'Please enter the verification code.';
      errNotice.style.display = 'block';
    }
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Verifying Code...';
  }
  if (errNotice) errNotice.style.display = 'none';

  if (window.firebaseSync && typeof window.firebaseSync.signInWithPhone === 'function') {
    const res = await window.firebaseSync.signInWithPhone(phone, phoneCodeHash, code, mode);

    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Verify & Proceed';
    }

    if (!res.ok) {
      if (errNotice) {
        errNotice.textContent = res.error || 'Verification failed.';
        errNotice.style.display = 'block';
      } else {
        alert(res.error);
      }
      return;
    }

    clearInterval(window._phoneResendInterval);
    DOM.modalBackdrop.classList.remove('open');

    if (res.action === 'login') {
      if (typeof showFloatingToast === 'function') {
        showFloatingToast(`🎉 Logged in via phone ${phone}! Progress restored.`);
      }
    } else {
      if (typeof showFloatingToast === 'function') {
        showFloatingToast(`📱 Mobile number ${phone} successfully linked & verified!`);
      }
    }
    updateProfileUI();
  } else {
    alert('Service offline.');
  }
};

// Resend Phone Code handler
window.submitResendPhoneCode = async function(phone, phoneCodeHash, mode = 'login') {
  if (window.firebaseSync && typeof window.firebaseSync.resendCode === 'function') {
    const res = await window.firebaseSync.resendCode(phone, phoneCodeHash);
    if (res.ok) {
      renderPhoneCodeInputModal(phone, res.sent_code?.phone_code_hash || phoneCodeHash, mode, res.sent_code?.type);
    }
  }
};

// Auto-initialize Fuel Shop Tab on load
setTimeout(() => {
  if (typeof window.renderFuelShopTab === 'function') {
    window.renderFuelShopTab();
  }
}, 150);
