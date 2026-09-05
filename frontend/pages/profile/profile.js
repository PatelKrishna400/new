/* ==========================================================================
   PROFILE PAGE CONTROLLER (pages/profile/profile.js)
   - Profile Data Editing (Pencil Logo trigger)
   - Promo Code Generator ("profile_name_number")
   - Friend Promo Code Redemption (+10 Coins Win)
   - Firebase Real-Time Data Write Sync Display
   - Telegram Referral Sharing
   ========================================================================== */

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

// Open Edit Profile Modal
window.openEditProfileModal = function() {
  DOM.sheetTitle.textContent = 'Edit Profile Data';
  DOM.sheetContent.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 14px; padding: 4px 0;">
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <label style="font-size: 12px; font-weight: 700; color: #94a3b8;">Display Name</label>
        <input type="text" id="editPlayerNameInput" value="${gameState.player.name}" style="background: rgba(15, 23, 42, 0.9); border: 1.5px solid rgba(56, 189, 248, 0.4); border-radius: 12px; padding: 10px 14px; font-family: var(--font-primary); font-size: 14px; font-weight: 700; color: #ffffff; outline: none;">
      </div>
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

  sfx.playLevelUpSound();
  updateUI();
  saveGame();
  
  // Real-time Firebase cloud write
  if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
    window.firebaseSync.saveToCloudImmediate();
  }
  
  closeTabModal();
};

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

  sfx.playLevelUpSound();

  if (msgEl) {
    msgEl.innerHTML = `🎉 Code Redeemed! <strong>+10 Coins</strong> added to your balance!`;
    msgEl.className = 'promo-feedback-msg success';
  }

  inputEl.value = '';

  // Synchronize UI & Write to Firebase
  updateUI();
  saveGame();

  if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
    window.firebaseSync.saveToCloudImmediate();
  }
};

// Force Sync to Firebase Cloud
window.syncFirebaseDataNow = function() {
  if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
    window.firebaseSync.saveToCloudImmediate();
    sfx.playTapSound(2);

    const statusEl = document.getElementById('profileFirebaseStatus');
    if (statusEl) {
      statusEl.innerHTML = `✓ Written at ${new Date().toLocaleTimeString()}`;
      statusEl.style.color = '#38bdf8';
      setTimeout(() => {
        if (statusEl) {
          statusEl.innerHTML = `● Live Active`;
          statusEl.style.color = '#34d399';
        }
      }, 2500);
    }
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

function updateProfileUI() {
  if (DOM.profileDisplayName) DOM.profileDisplayName.textContent = gameState.player.name;
  if (DOM.playerUsername) DOM.playerUsername.textContent = gameState.player.name;
  if (DOM.profileHandle) DOM.profileHandle.innerHTML = `<span class="handle-at">@</span> ${gameState.player.handle || 'alex_blue'}`;
  if (DOM.profileCoinBalance) DOM.profileCoinBalance.textContent = formatNumber(gameState.player.coins);
  if (DOM.profileEnergyPool) DOM.profileEnergyPool.textContent = formatNumber(Math.floor(gameState.reactor.currentEnergy || 0));

  // Update Promo Code Display
  const promoCodeEl = document.getElementById('myPromoCodeText');
  if (promoCodeEl) {
    if (!gameState.player.promoCode) {
      gameState.player.promoCode = generatePromoCodeForPlayer(gameState.player.name);
    }
    promoCodeEl.textContent = gameState.player.promoCode;
  }

  // Update Firebase Cloud Data Details
  const firebaseUidEl = document.getElementById('profileFirebaseUid');
  if (firebaseUidEl && window.firebaseSync) {
    const uid = window.firebaseSync.userId || 'Connecting...';
    firebaseUidEl.textContent = uid.length > 18 ? uid.substring(0, 18) + '...' : uid;
  }
}

window.updateProfileUI = updateProfileUI;
