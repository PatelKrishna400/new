/* ═══════════════════════════════════════════════════════════
   TAP EMPIRE — Multi-Tier Chest Engine (Redesigned)
   • Tiers: COMMON 📦, RARE 💎, EPIC 👑, LEGENDARY 🔥
   • Pre-opening modal with idle floating animation
   • 1.5-second animation sequence:
     1. Chest shake & lock vibrate (0 - 300ms)
     2. Light beam & backdrop flash (300 - 600ms)
     3. Lid open & particle burst (600 - 900ms)
     4. Reward icon scale 0.5 → 1.2 → 1.0 (900 - 1400ms)
   • Result reveal: 🎉 YOU WON! with [ COLLECT ] and [ ✨ 2× REWARD (Ad Required) ]
═══════════════════════════════════════════════════════════ */

'use strict';

const CHEST_TIERS = {
  common:    { key: 'common',    name: 'Common Chest',    icon: '📦', baseCoins: 1000,  energy: 50,  color: '#3B82F6', tag: 'COMMON' },
  rare:      { key: 'rare',      name: 'Rare Chest',      icon: '💎', baseCoins: 2500,  energy: 100, color: '#A78BFA', tag: 'RARE' },
  epic:      { key: 'epic',      name: 'Epic Chest',      icon: '👑', baseCoins: 5000,  energy: 250, color: '#F5B700', tag: 'EPIC' },
  legendary: { key: 'legendary', name: 'Legendary Chest', icon: '🔥', baseCoins: 15000, energy: 500, color: '#EF4444', tag: 'LEGENDARY' },
};

function openChestModal(tierKey = 'epic') {
  const tier = CHEST_TIERS[tierKey] || CHEST_TIERS.epic;

  showModal(`
    <div class="chest-modal-container chest-theme-${tier.key}">
      <div class="chest-modal-header">
        <div class="chest-tier-badge" style="color:${tier.color};border-color:${tier.color}">
          ${tier.tag}
        </div>
        <div class="chest-modal-title">🎁 MYSTERY CHEST</div>
      </div>

      <!-- Center Chest area with idle float -->
      <div class="chest-display-area" id="chest-display-area">
        <div class="chest-light-beam" id="chest-light-beam"></div>
        <div class="chest-animated-icon chest-idle-float" id="chest-animated-icon">
          ${tier.icon}
        </div>
        <div class="chest-lock-icon" id="chest-lock-icon">🔒</div>
      </div>

      <!-- Possible Rewards list -->
      <div class="chest-possible-rewards">
        <div class="possible-title">POSSIBLE REWARDS:</div>
        <div class="possible-chips-row">
          <span class="possible-chip">💰 Coins</span>
          <span class="possible-chip">⚡ Energy</span>
          <span class="possible-chip">🔥 Boost</span>
          <span class="possible-chip">⭐ XP</span>
        </div>
      </div>

      <!-- Open Button -->
      <div class="chest-actions-area" id="chest-actions-area">
        <button class="btn btn-gold btn-open-chest" onclick="startChestOpeningAnimation('${tier.key}')">
          🎁 OPEN CHEST
        </button>
      </div>
    </div>
  `);
}

/* ── 1.5-Second Opening Sequence ── */
function startChestOpeningAnimation(tierKey) {
  const tier = CHEST_TIERS[tierKey] || CHEST_TIERS.epic;
  const iconEl = document.getElementById('chest-animated-icon');
  const lockEl = document.getElementById('chest-lock-icon');
  const beamEl = document.getElementById('chest-light-beam');
  const actionsEl = document.getElementById('chest-actions-area');

  if (actionsEl) actionsEl.style.display = 'none';

  haptic('medium');
  if (typeof SFX !== 'undefined' && SFX.tap) SFX.tap();

  /* Step 1: Shake chest & vibrate lock (0 - 350ms) */
  if (iconEl) {
    iconEl.classList.remove('chest-idle-float');
    iconEl.classList.add('anim-chest-shake');
  }
  if (lockEl) {
    lockEl.classList.add('anim-lock-vibrate');
  }

  /* Step 2: Light beam appears & background brightens (350ms) */
  setTimeout(() => {
    if (beamEl) beamEl.classList.add('anim-light-beam');
    haptic('heavy');
    if (typeof SFX !== 'undefined' && SFX.critical) SFX.critical();
  }, 350);

  /* Step 3: Chest opens & particles explode (650ms) */
  setTimeout(() => {
    if (lockEl) lockEl.style.display = 'none';
    if (iconEl) {
      iconEl.classList.remove('anim-chest-shake');
      iconEl.textContent = '✨';
    }
    if (typeof spawnCollectBurst === 'function') {
      spawnCollectBurst(window.innerWidth / 2, window.innerHeight / 2);
    }
    haptic('heavy');
    if (typeof SFX !== 'undefined' && SFX.reward) SFX.reward();
  }, 650);

  /* Step 4: Reward icon scales 0.5 → 1.2 → 1.0 (900ms - 1400ms) */
  setTimeout(() => {
    renderChestResultModal(tier);
  }, 1400);
}

/* ── Result Modal Reveal ── */
function renderChestResultModal(tier) {
  const adAvailable = typeof AdManager !== 'undefined' ? AdManager.canShowRewardedAd() : true;

  showModal(`
    <div class="chest-result-container chest-theme-${tier.key}">
      <div class="chest-result-header anim-streak-pop">
        <div class="chest-result-won-title">🎉 YOU WON!</div>
        <div class="chest-result-tier-name" style="color:${tier.color}">${tier.name}</div>
      </div>

      <!-- Scaled Reward Icon 0.5 → 1.2 → 1.0 -->
      <div class="chest-reward-icon-wrap anim-reward-scale">
        <div class="chest-reward-main-icon">💰</div>
      </div>

      <!-- Animated Reward Amounts -->
      <div class="chest-reward-values anim-fadein">
        <div class="chest-reward-coin-val">💰 +${fmt(tier.baseCoins)} COINS</div>
        <div class="chest-reward-energy-val">⚡ +${tier.energy} Energy</div>
      </div>

      <!-- Result Action Buttons -->
      <div class="chest-result-actions">
        <button class="btn btn-gold btn-block" onclick="closeModal();_claimChestNormal('${tier.key}')">
          COLLECT
        </button>

        ${adAvailable ? `
          <button class="btn btn-outline btn-block btn-2x-ad" onclick="closeModal();_claimChestWithAd('${tier.key}')">
            ✨ 2× REWARD <span class="ad-req-badge">(Watch Ad)</span>
          </button>` : ''}
      </div>
    </div>
  `);
}

async function _claimChestNormal(tierKey) {
  const tier = CHEST_TIERS[tierKey] || CHEST_TIERS.epic;
  STATE.coins += tier.baseCoins;
  restoreEnergy(tier.energy);
  updateCoinUI();
  SFX.collect();
  haptic('success');
  showToast(`🎁 Opened ${tier.name}! +${fmt(tier.baseCoins)} Coins`, 'success');
  updateMissionProgress('chest', 1);
  await persistUser({ coins: STATE.coins, energy: STATE.energy });
}

async function _claimChestWithAd(tierKey) {
  const tier = CHEST_TIERS[tierKey] || CHEST_TIERS.epic;
  const totalCoins = tier.baseCoins * 2;
  const totalEnergy = tier.energy * 2;
  
  if (typeof AdManager !== 'undefined') {
    const ok = await AdManager.showRewardedAd(`chest_${tierKey}`, tier.baseCoins, tier.baseCoins);
    if (ok) {
      STATE.coins += totalCoins;
      restoreEnergy(totalEnergy);
      updateCoinUI();
      SFX.reward();
      haptic('success');
      showToast(`✨ 2× REWARD! Opened ${tier.name} for +${fmt(totalCoins)} Coins!`, 'success');
      updateMissionProgress('chest', 1);
      await persistUser({ coins: STATE.coins, energy: STATE.energy });
      return;
    }
  }

  await _claimChestNormal(tierKey);
}
