/* ==========================================================================
   MYSTERY CHEST MINI-GAME (pages/chest/chest.js)
   High-Tech Cyber Vault with 3D Animated Chests & Rich Reward Feedback
   ========================================================================== */

const CHEST_AND_CARD_REWARDS = [
  { label: '1 Green Fuel', type: 'green_fuel', amount: 1, icon: '🟢' },
  { label: '1 Yellow Fuel', type: 'yellow_fuel', amount: 1, icon: '🟡' },
  { label: '1 Winning Key', type: 'keys', amount: 1, icon: '🔑' },
  { label: '10 Energy', type: 'energy', amount: 10, icon: '⚡' },
  { label: '1 Cyber Egg', type: 'egg', amount: 1, icon: '🥚' },
  { label: '10 Coins', type: 'coins', amount: 10, icon: '🪙' },
  { label: '5 Diamonds', type: 'diamonds', amount: 5, icon: '💎' },
  { label: '1 Spin Ticket', type: 'tickets', amount: 1, icon: '🎟️' }
];

let chestRoundState = {
  isActiveRound: false,
  selectedBox: null,
  rewards: { 1: null, 2: null, 3: null },
  claimed: { 1: false, 2: false, 3: false },
  isProcessing: false
};

// Particle explosion for victory moments
function triggerChestConfetti() {
  const container = document.getElementById('pageChest');
  if (!container) return;

  const colors = ['#f59e0b', '#fde047', '#38bdf8', '#10b981', '#a855f7', '#ec4899'];
  for (let i = 0; i < 26; i++) {
    const p = document.createElement('div');
    p.className = 'ambient-particle';
    const size = Math.random() * 8 + 4;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    p.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    p.style.left = `${Math.random() * 80 + 10}%`;
    p.style.top = '38%';
    p.style.position = 'absolute';
    p.style.zIndex = '30';
    p.style.opacity = '1';
    p.style.transform = `translate(${Math.random() * 160 - 80}px, ${Math.random() * -120 - 40}px) rotate(${Math.random() * 360}deg)`;
    p.style.transition = 'all 1.6s cubic-bezier(0.1, 0.8, 0.2, 1)';
    container.appendChild(p);

    setTimeout(() => {
      p.style.opacity = '0';
      p.style.transform = `translate(${Math.random() * 200 - 100}px, ${Math.random() * 150 + 100}px) scale(0.3)`;
      setTimeout(() => p.remove(), 1600);
    }, 50);
  }
}

// Synchronize Key Balance & Action Button UI
function updateChestUI() {
  const keys = (gameState.player && gameState.player.chestKeys) || 0;
  const keysValEl = document.getElementById('chestKeysVal');
  const keysTabEl = document.getElementById('chestAvailableKeys');
  if (keysValEl) keysValEl.textContent = keys.toString();
  if (keysTabEl) keysTabEl.textContent = keys.toString();

  const btn = document.getElementById('btnUnlockChest');
  const btnIcon = document.getElementById('chestBtnIcon');
  const btnText = document.getElementById('chestBtnText');

  if (!btn) return;

  if (chestRoundState.isProcessing) {
    btn.disabled = true;
    if (btnIcon) btnIcon.textContent = '⚡';
    if (btnText) btnText.textContent = 'DECRYPTING VAULT...';
  } else if (chestRoundState.isActiveRound) {
    btn.disabled = false;
    btn.className = 'chest-action-main-btn reset-mode';
    if (btnIcon) btnIcon.textContent = '🔄';
    if (btnText) btnText.textContent = 'RESET CHESTS (NEXT ROUND)';
  } else if (keys > 0) {
    btn.disabled = false;
    btn.className = 'chest-action-main-btn key-mode';
    if (btnIcon) btnIcon.textContent = '🔑';
    if (btnText) btnText.textContent = `UNLOCK RANDOM CHEST (${keys} KEY${keys === 1 ? '' : 'S'})`;
  } else {
    btn.disabled = false;
    btn.className = 'chest-action-main-btn no-key-mode';
    if (btnIcon) btnIcon.textContent = '🔑';
    if (btnText) btnText.textContent = 'NEED 1 KEY TO UNLOCK (0 🔑)';
  }
}

// Unified Action Button Handler (No Ads)
function handleChestActionButtonClick() {
  if (chestRoundState.isProcessing) return;

  if (chestRoundState.isActiveRound) {
    resetThreeChests();
    return;
  }

  const keys = (gameState.player && gameState.player.chestKeys) || 0;
  if (keys > 0) {
    unlockMysteryChest();
  } else {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('🔑 You need 1 Mystery Key! Tap the reactor orb or complete goals to find keys!');
    }
    if (typeof sfx !== 'undefined' && typeof sfx.playTapSound === 'function') {
      sfx.playTapSound(1);
    }
  }
}

function awardChestPrize(reward) {
  if (!reward || typeof gameState === 'undefined') return;

  if (reward.type === 'coins') {
    gameState.player.coins = (gameState.player.coins || 0) + reward.amount;
  } else if (reward.type === 'energy') {
    if (gameState.reactor) {
      gameState.reactor.currentEnergy = (gameState.reactor.currentEnergy || 0) + reward.amount;
    }
  } else if (reward.type === 'keys') {
    gameState.player.chestKeys = (gameState.player.chestKeys || 0) + reward.amount;
    if (gameState.goal) {
      gameState.goal.currentKeys = Math.min(gameState.goal.targetKeys || 10, (gameState.goal.currentKeys || 0) + reward.amount);
    }
  } else if (reward.type === 'egg') {
    gameState.player.eggs = (gameState.player.eggs || 0) + reward.amount;
  } else if (reward.type === 'green_fuel') {
    if (gameState.energyGenerator && gameState.energyGenerator.fuelCells) {
      gameState.energyGenerator.fuelCells.green = (gameState.energyGenerator.fuelCells.green || 0) + reward.amount;
    }
  } else if (reward.type === 'yellow_fuel') {
    if (gameState.energyGenerator && gameState.energyGenerator.fuelCells) {
      gameState.energyGenerator.fuelCells.yellow = (gameState.energyGenerator.fuelCells.yellow || 0) + reward.amount;
    }
  } else if (reward.type === 'tickets') {
    gameState.player.chestTickets = (gameState.player.chestTickets || 0) + reward.amount;
    if (gameState.goal) {
      gameState.goal.currentTickets = Math.min(gameState.goal.targetTickets || 10, (gameState.goal.currentTickets || 0) + reward.amount);
    }
  } else if (reward.type === 'diamonds') {
    gameState.player.diamonds = (gameState.player.diamonds || 0) + reward.amount;
  }

  if (typeof saveGame === 'function') saveGame();
  if (typeof updateUI === 'function') updateUI();
  if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
    window.firebaseSync.saveToCloudImmediate();
  }
}

function onChestBoxClicked(boxNum) {
  if (chestRoundState.isProcessing) return;

  if (chestRoundState.isActiveRound) {
    // If user clicks an unchosen revealed chest in the active round, prompt ad watch
    if (!chestRoundState.claimed[boxNum]) {
      claimNonChoiceChestWithAd(boxNum);
    } else {
      if (typeof showFloatingToast === 'function') {
        showFloatingToast(`Vault Chest #${boxNum} has already been claimed!`);
      }
    }
    return;
  }

  // Not in an active round: unlock with key
  unlockMysteryChestBox(boxNum);
}

function unlockMysteryChestBox(boxNum) {
  if (chestRoundState.isProcessing) return;

  const keys = (gameState.player && gameState.player.chestKeys) || 0;
  if (keys <= 0) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('🔑 You need 1 Winning Key! Watch an ad to get one for free.');
    }
    buyChestKeyWithAd();
    return;
  }

  // Consume 1 Key
  gameState.player.chestKeys--;
  chestRoundState.isProcessing = true;
  updateChestUI();

  if (typeof sfx !== 'undefined' && typeof sfx.playTapSound === 'function') {
    sfx.playTapSound(2);
  }

  // Daily Stats tracking
  if (typeof checkDailyStatsDate === 'function') checkDailyStatsDate();
  if (gameState.dailyStats) gameState.dailyStats.chests = (gameState.dailyStats.chests || 0) + 1;

  // Prepare 3 distinct rewards
  const shuffled = [...CHEST_AND_CARD_REWARDS].sort(() => 0.5 - Math.random());
  chestRoundState.rewards = {
    1: shuffled[0],
    2: shuffled[1],
    3: shuffled[2]
  };
  chestRoundState.selectedBox = boxNum;
  chestRoundState.claimed = { 1: false, 2: false, 3: false };
  chestRoundState.claimed[boxNum] = true;
  chestRoundState.isActiveRound = true;

  const chosenBox = document.getElementById(`chestBox${boxNum}`);
  const chosenLid = document.getElementById(`chestLid${boxNum}`);
  const resultCard = document.getElementById('chestLootBanner');
  const badge = document.getElementById('chestLootBadge');
  const title = document.getElementById('chestLootTitle');
  const desc = document.getElementById('chestLootDesc');
  const icon = document.getElementById('chestWinIcon');

  if (chosenBox) chosenBox.classList.add('opening');
  if (chosenLid) chosenLid.classList.add('opened');

  if (resultCard) resultCard.className = 'chest-result-display';
  if (badge) {
    badge.className = 'chest-result-badge opening';
    badge.textContent = '⚡ DECRYPTING VAULT...';
  }
  if (icon) icon.textContent = '🔑';
  if (title) title.textContent = `Opening Chest #${boxNum}...`;
  if (desc) desc.textContent = `Decrypting quantum lock with 1 Winning Key...`;

  if (typeof updateUI === 'function') updateUI();

  // 650ms: Reveal the prize and other two chests
  setTimeout(() => {
    const chosenReward = chestRoundState.rewards[boxNum];
    awardChestPrize(chosenReward);

    if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') {
      sfx.playLevelUpSound();
    }
    triggerChestConfetti();

    // 1. Setup Chosen Chest Box (Won)
    if (chosenBox) {
      chosenBox.classList.remove('opening');
      chosenBox.classList.add('opened', 'winner-box');
    }
    const chosenFloat = document.getElementById(`chestFloatingPrize${boxNum}`);
    if (chosenFloat) chosenFloat.innerHTML = chosenReward.icon;

    const chosenBottom = document.getElementById(`chestBottom${boxNum}`);
    if (chosenBottom) {
      chosenBottom.innerHTML = `<span class="chest-box-tag won">✓ WON: ${chosenReward.label}</span>`;
    }

    // 2. Open the other two non-chosen chests (Revealed for optional ad claim)
    for (let i = 1; i <= 3; i++) {
      if (i === boxNum) continue;

      const otherReward = chestRoundState.rewards[i];
      const otherBox = document.getElementById(`chestBox${i}`);
      const otherLid = document.getElementById(`chestLid${i}`);
      const otherFloat = document.getElementById(`chestFloatingPrize${i}`);
      const otherBottom = document.getElementById(`chestBottom${i}`);

      if (otherBox) otherBox.classList.add('opened');
      if (otherLid) otherLid.classList.add('opened');
      if (otherFloat) otherFloat.innerHTML = otherReward.icon;

      if (otherBottom) {
        otherBottom.innerHTML = `
          <div class="chest-nonchoice-slot">
            <span class="chest-reward-reveal-text">${otherReward.label}</span>
          </div>
        `;
      }
    }

    // 3. Update Winning Showcase Card
    if (resultCard) resultCard.className = 'chest-result-display winner-active';
    if (badge) {
      badge.className = 'chest-result-badge winner';
      badge.textContent = '🎉 YOU WON!';
    }
    if (icon) icon.textContent = chosenReward.icon;
    if (title) title.textContent = `WON: ${chosenReward.label.toUpperCase()}!`;
    if (desc) desc.textContent = `Prize credited directly to your balance! Tap Reset Chests below for the next round.`;

    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`🎉 Vault Unlocked: Won ${chosenReward.label}!`);
    }

    chestRoundState.isProcessing = false;
    updateChestUI();
    if (typeof updateUI === 'function') updateUI();
    if (typeof saveGame === 'function') saveGame();
  }, 650);
}

function unlockMysteryChest() {
  if (chestRoundState.isActiveRound || chestRoundState.isProcessing) return;
  const randBox = Math.floor(Math.random() * 3) + 1;
  unlockMysteryChestBox(randBox);
}

function resetThreeChests() {
  if (chestRoundState.isProcessing) return;

  if (typeof sfx !== 'undefined' && typeof sfx.playTapSound === 'function') {
    sfx.playTapSound(1);
  }

  for (let i = 1; i <= 3; i++) {
    const box = document.getElementById(`chestBox${i}`);
    const lid = document.getElementById(`chestLid${i}`);
    const float = document.getElementById(`chestFloatingPrize${i}`);
    const bottom = document.getElementById(`chestBottom${i}`);

    if (box) box.classList.remove('opened', 'opening', 'winner-box');
    if (lid) lid.classList.remove('opened');
    if (float) float.innerHTML = '';
    if (bottom) bottom.innerHTML = `<span class="chest-box-action">TAP TO UNLOCK</span>`;
  }

  chestRoundState = {
    isActiveRound: false,
    selectedBox: null,
    rewards: { 1: null, 2: null, 3: null },
    claimed: { 1: false, 2: false, 3: false },
    isProcessing: false
  };

  const resultCard = document.getElementById('chestLootBanner');
  const badge = document.getElementById('chestLootBadge');
  const title = document.getElementById('chestLootTitle');
  const desc = document.getElementById('chestLootDesc');
  const icon = document.getElementById('chestWinIcon');

  if (resultCard) resultCard.className = 'chest-result-display';
  if (badge) {
    badge.className = 'chest-result-badge';
    badge.textContent = '🎯 VAULT READY';
  }
  if (icon) icon.textContent = '🧰';
  if (title) title.textContent = 'Mystery Vault Armed';
  if (desc) desc.textContent = 'Select any chest or tap UNLOCK below with 1 Key!';

  if (typeof showFloatingToast === 'function') {
    showFloatingToast('🔄 Vault chests reset for next round!');
  }

  updateChestUI();
}

// Auto-sync on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  updateChestUI();
});

// Window exports
window.onChestBoxClicked = onChestBoxClicked;
window.unlockMysteryChest = unlockMysteryChest;
window.unlockMysteryChestBox = unlockMysteryChestBox;
window.resetThreeChests = resetThreeChests;
window.awardChestPrize = awardChestPrize;
window.updateChestUI = updateChestUI;
window.handleChestActionButtonClick = handleChestActionButtonClick;
