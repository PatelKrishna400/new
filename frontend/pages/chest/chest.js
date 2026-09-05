/* ==========================================================================
   MYSTERY CHEST MINI-GAME (pages/chest/chest.js)
   ========================================================================== */

const CHEST_AND_CARD_REWARDS = [
  { label: '🟢 1 Green Fuel', type: 'green_fuel', amount: 1, icon: '🟢' },
  { label: '🟡 1 Yellow Fuel', type: 'yellow_fuel', amount: 1, icon: '🟡' },
  { label: '🔑 1 Winning Key', type: 'keys', amount: 1, icon: '🔑' },
  { label: '⚡ 10 Energy', type: 'energy', amount: 10, icon: '⚡' },
  { label: '🥚 1 Cyber Egg', type: 'egg', amount: 1, icon: '🥚' },
  { label: '🪙 10 Coins', type: 'coins', amount: 10, icon: '🪙' },
  { label: '🎟️ 1 Spin Ticket', type: 'tickets', amount: 1, icon: '🎟️' }
];

let chestRoundState = {
  isActiveRound: false,
  selectedBox: null,
  rewards: { 1: null, 2: null, 3: null },
  claimed: { 1: false, 2: false, 3: false },
  isProcessing: false
};

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
        showFloatingToast(`Chest #${boxNum} has already been claimed!`);
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
      showFloatingToast('🔑 You need 1 Winning Key to unlock! Watch an ad to get one.');
    }
    buyChestKeyWithAd();
    return;
  }

  // Consume 1 Key
  gameState.player.chestKeys--;
  chestRoundState.isProcessing = true;
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
  const title = document.getElementById('chestLootTitle');
  const desc = document.getElementById('chestLootDesc');

  if (chosenBox) chosenBox.classList.add('opening');
  if (chosenLid) chosenLid.classList.add('opened');
  if (title) title.innerHTML = `Opening Chest #${boxNum}...`;
  if (desc) desc.innerHTML = `Unlocking chest with 1 Winning Key...`;

  if (typeof updateUI === 'function') updateUI();

  // 600ms Timer: Open the chosen chest and reveal other two
  setTimeout(() => {
    const chosenReward = chestRoundState.rewards[boxNum];
    awardChestPrize(chosenReward);

    if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') {
      sfx.playLevelUpSound();
    }

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

    // 2. Open the other two non-chosen chests (Revealed, but NOT won yet)
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
            <button class="chest-box-ad-btn" onclick="event.stopPropagation(); claimNonChoiceChestWithAd(${i})">
              🎬 Watch Ad to Win
            </button>
          </div>
        `;
      }
    }

    // 3. Update Loot Banner & Action Buttons
    if (title) title.innerHTML = `🎉 Won: <strong>${chosenReward.label}</strong>!`;
    if (desc) desc.innerHTML = `✨ The other 2 chests have revealed their rewards! Watch an ad to claim either one, or reset chests for the next round.`;

    const btnUnlock = document.getElementById('btnUnlockChest');
    const btnAdBuy = document.getElementById('btnChestAdBuy');
    const btnReset = document.getElementById('btnChestReset');

    if (btnUnlock) btnUnlock.style.display = 'none';
    if (btnAdBuy) btnAdBuy.style.display = 'none';
    if (btnReset) btnReset.style.display = 'flex';

    chestRoundState.isProcessing = false;
    if (typeof updateUI === 'function') updateUI();
    if (typeof saveGame === 'function') saveGame();
  }, 650);
}

function unlockMysteryChest() {
  if (chestRoundState.isActiveRound || chestRoundState.isProcessing) return;
  const randBox = Math.floor(Math.random() * 3) + 1;
  unlockMysteryChestBox(randBox);
}

function claimNonChoiceChestWithAd(boxNum) {
  if (!chestRoundState.isActiveRound || chestRoundState.claimed[boxNum] || chestRoundState.isProcessing) return;

  const reward = chestRoundState.rewards[boxNum];
  if (!reward) return;

  if (typeof sfx !== 'undefined' && typeof sfx.playTapSound === 'function') {
    sfx.playTapSound(1);
  }

  const doClaim = () => {
    awardChestPrize(reward);
    chestRoundState.claimed[boxNum] = true;

    const boxEl = document.getElementById(`chestBox${boxNum}`);
    if (boxEl) boxEl.classList.add('winner-box');

    const bottomEl = document.getElementById(`chestBottom${boxNum}`);
    if (bottomEl) {
      bottomEl.innerHTML = `<span class="chest-box-tag won">✓ WON: ${reward.label}</span>`;
    }

    const title = document.getElementById('chestLootTitle');
    const desc = document.getElementById('chestLootDesc');

    if (title) title.innerHTML = `🎉 Claimed: <strong>${reward.label}</strong>!`;
    
    // Check if all 3 chests are now claimed
    if (chestRoundState.claimed[1] && chestRoundState.claimed[2] && chestRoundState.claimed[3]) {
      if (desc) desc.innerHTML = `🏆 All 3 chest rewards collected! Click Reset Chests below to play another round.`;
    } else {
      if (desc) desc.innerHTML = `✨ Reward claimed! You can watch an ad for the remaining chest or reset for the next round.`;
    }

    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`🎉 +${reward.label} Claimed!`);
    }

    if (typeof updateUI === 'function') updateUI();
    if (typeof saveGame === 'function') saveGame();
  };

  if (typeof showRewardedAd === 'function') {
    showRewardedAd(doClaim);
  } else if (typeof startAdSimulation === 'function') {
    startAdSimulation('chest', 'Chest Reward Ad', reward.label, doClaim);
  } else {
    doClaim();
  }
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
    if (bottom) bottom.innerHTML = `<span class="chest-box-action">TAP TO OPEN</span>`;
  }

  chestRoundState = {
    isActiveRound: false,
    selectedBox: null,
    rewards: { 1: null, 2: null, 3: null },
    claimed: { 1: false, 2: false, 3: false },
    isProcessing: false
  };

  const title = document.getElementById('chestLootTitle');
  const desc = document.getElementById('chestLootDesc');
  const btnUnlock = document.getElementById('btnUnlockChest');
  const btnAdBuy = document.getElementById('btnChestAdBuy');
  const btnReset = document.getElementById('btnChestReset');

  if (title) title.innerHTML = `Mystery Vault`;
  if (desc) desc.innerHTML = `Select any of the 3 chests to unlock with 1 Key for surprise rewards!`;

  if (btnUnlock) btnUnlock.style.display = 'flex';
  if (btnAdBuy) btnAdBuy.style.display = 'flex';
  if (btnReset) btnReset.style.display = 'none';

  if (typeof showFloatingToast === 'function') {
    showFloatingToast('🔄 Chests reset for next round!');
  }
}

function buyChestKeyWithAd() {
  if (typeof sfx !== 'undefined' && typeof sfx.playTapSound === 'function') {
    sfx.playTapSound(1);
  }

  const doReward = () => {
    gameState.player.chestKeys = (gameState.player.chestKeys || 0) + 1;
    if (typeof updateUI === 'function') updateUI();
    if (typeof saveGame === 'function') saveGame();
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('🔑 +1 Free Mystery Key Received!');
    }
  };

  if (typeof showRewardedAd === 'function') {
    showRewardedAd(doReward);
  } else if (typeof startAdSimulation === 'function') {
    startAdSimulation('chest', 'Mystery Key Pass', '+1 Free Mystery Key', doReward);
  } else {
    doReward();
  }
}

window.onChestBoxClicked = onChestBoxClicked;
window.unlockMysteryChest = unlockMysteryChest;
window.unlockMysteryChestBox = unlockMysteryChestBox;
window.claimNonChoiceChestWithAd = claimNonChoiceChestWithAd;
window.resetThreeChests = resetThreeChests;
window.buyChestKeyWithAd = buyChestKeyWithAd;
window.awardChestPrize = awardChestPrize;
