/* ==========================================================================
   GOAL & 1-100 LEVEL MILESTONES CONTROLLER (pages/goal/goal.js)
   - Goals 1 to 100 with 3 collectible emoji requirements:
     * 🎟️ Scratch Cards
     * 🔑 Chest Keys
     * 🎫 Lottery Tickets
   - Level 1 Requirements: Cards = 20, Keys = 50, Tickets = 35
   - Tiered Level Rewards (Levels 1-10: +1 all, 11-25: +2, 26-50: +3, 51-75: +4, 76-100: +5)
   - Goal Level 100 Mega Reward:
     * Unlocks when Goal Level 100 is completed
     * 1,000 Ads Watcher
     * Mega Prize: 100 Keys, 75 Cards, 150 Tickets, 1,000 Coins
   - Subtabs: Goals 1-100 List vs Mega Reward
   ========================================================================== */

// Helper: Calculate 3-Emoji Requirements for any Level 1 to 100
function getGoalLevelRequirements(lvl) {
  if (lvl === 1) {
    return { cards: 20, keys: 50, tickets: 35 };
  }
  // Deterministic progressive scaling curve
  const cards = 20 + (lvl - 1) * 6 + ((lvl * 11) % 15);
  const keys = 50 + (lvl - 1) * 9 + ((lvl * 17) % 20);
  const tickets = 35 + (lvl - 1) * 7 + ((lvl * 13) % 18);
  return { cards, keys, tickets };
}

// Helper: Calculate Tier Reward Quantity based on Level
function getGoalLevelRewardQty(lvl) {
  if (lvl <= 10) return 1;
  if (lvl <= 25) return 2;
  if (lvl <= 50) return 3;
  if (lvl <= 75) return 4;
  return 5;
}

// Helper: Get Tier Label
function getGoalTierLabel(lvl) {
  if (lvl <= 10) return '⭐ TIER 1: +1 CARD • +1 KEY • +1 TICKET';
  if (lvl <= 25) return '⭐⭐ TIER 2: +2 CARDS • +2 KEYS • +2 TICKETS';
  if (lvl <= 50) return '⭐⭐⭐ TIER 3: +3 CARDS • +3 KEYS • +3 TICKETS';
  if (lvl <= 75) return '⭐⭐⭐⭐ TIER 4: +4 CARDS • +4 KEYS • +4 TICKETS';
  return '👑 MASTER TIER: +5 CARDS • +5 KEYS • +5 TICKETS';
}

// Subtab Switcher (Goals 1-100 vs Mega Reward)
window.switchGoalSubtab = function(subtabName) {
  if (!gameState.goalState) gameState.goalState = {};
  gameState.goalState.currentSubtab = subtabName;

  if (subtabName === 'goals') {
    if (DOM.subtabGoalsList) DOM.subtabGoalsList.classList.add('active');
    if (DOM.subtabGoalMegaReward) DOM.subtabGoalMegaReward.classList.remove('active');
    if (DOM.goalRoadmapSubView) DOM.goalRoadmapSubView.classList.add('active');
    if (DOM.goalMegaRewardSubView) DOM.goalMegaRewardSubView.classList.remove('active');
    if (DOM.toggleGoalsBtnText) DOM.toggleGoalsBtnText.textContent = 'MEGA REWARD';
    renderGoalsList();
  } else {
    if (DOM.subtabGoalsList) DOM.subtabGoalsList.classList.remove('active');
    if (DOM.subtabGoalMegaReward) DOM.subtabGoalMegaReward.classList.add('active');
    if (DOM.goalRoadmapSubView) DOM.goalRoadmapSubView.classList.remove('active');
    if (DOM.goalMegaRewardSubView) DOM.goalMegaRewardSubView.classList.add('active');
    if (DOM.toggleGoalsBtnText) DOM.toggleGoalsBtnText.textContent = 'GOALS 1-100';
  }

  sfx.playTapSound(1);
  updateUI();
};

window.toggleGoalSubView = function() {
  if (gameState.goalState.currentSubtab === 'goals') {
    switchGoalSubtab('mega');
  } else {
    switchGoalSubtab('goals');
  }
};

// Render Goals 1 to 100 Roadmap List
window.renderGoalsList = function() {
  if (!DOM.goalsScrollList) return;
  const curLvl = (gameState.goalState && gameState.goalState.currentLevel !== undefined) ? gameState.goalState.currentLevel : 0;
  const prog = gameState.goalState.levelProgress || { cards: 0, keys: 0, tickets: 0 };
  const adsWatched = gameState.goalState.levelAdsWatched || 0;
  let html = '';

  for (let g = 1; g <= 100; g++) {
    const req = getGoalLevelRequirements(g);
    const rewardQty = getGoalLevelRewardQty(g);
    const isClaimed = !!(gameState.goalState.claimedGoals && gameState.goalState.claimedGoals[g]);
    const isCurrent = (curLvl === 0 && g === 1) || g === curLvl;

    let rowClass = 'level-row-card';
    if (isClaimed) rowClass += ' reached';
    if (isCurrent) rowClass += ' active-level-row';

    // Status / Action Column
    let statusHtml = '';
    if (isClaimed) {
      statusHtml = `<span style="font-size: 11px; font-weight: 800; color: #10b981;">✓ Claimed</span>`;
    } else if (isCurrent) {
      const isItemsComplete = prog.cards >= req.cards && prog.keys >= req.keys && prog.tickets >= req.tickets;
      if (!isItemsComplete) {
        statusHtml = `<button class="level-claim-btn" onclick="handleGoalLevelAction(${g})">Collect 🎯</button>`;
      } else {
        statusHtml = `<button class="level-claim-btn" style="background: linear-gradient(135deg, #8b5cf6, #d946ef);" onclick="handleGoalLevelAction(${g})"><span>🎬</span> Claim</button>`;
      }
    } else {
      statusHtml = `
        <div class="level-lock-status">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
      `;
    }

    let progressSnippet = '';
    if (isCurrent && !isClaimed) {
      const isItemsComplete = prog.cards >= req.cards && prog.keys >= req.keys && prog.tickets >= req.tickets;
      progressSnippet = `
        <div style="font-size: 10px; color: #38bdf8; font-weight: 700; margin-top: 2px;">
          Progress: 🎟️ ${prog.cards}/${req.cards} • 🔑 ${prog.keys}/${req.keys} • 🎫 ${prog.tickets}/${req.tickets} ${isItemsComplete ? '• 🎬 1 Ad to Claim' : ''}
        </div>
      `;
    }

    html += `
      <div class="${rowClass}" id="goalRow-${g}">
        <div class="level-left-info">
          <div class="level-number-badge" style="background: ${isCurrent ? '#0284c7' : 'rgba(30, 41, 59, 0.8)'};">
            <span class="lv-lbl">G</span>
            <span class="lv-val">${g}</span>
          </div>
          <div class="level-text-info">
            <div class="level-title-row">
              <span class="level-title-text">Goal Level ${g}</span>
              <span class="level-tier-tag" style="color: #38bdf8; font-weight: 800;">(+${rewardQty} All)</span>
            </div>
            <span class="level-xp-req" style="color: #94a3b8; font-size: 10px;">Req: 🎟️ ${req.cards} • 🔑 ${req.keys} • 🎫 ${req.tickets}</span>
            ${progressSnippet}
          </div>
        </div>

        <div class="level-right-rewards">
          <div style="display: flex; gap: 4px;">
            <span class="lvl-reward-pill pill-ticket">🎟️ +${rewardQty}</span>
            <span class="lvl-reward-pill pill-key">🔑 +${rewardQty}</span>
            <span class="lvl-reward-pill pill-fuel">🎫 +${rewardQty}</span>
          </div>
          ${statusHtml}
        </div>
      </div>
    `;
  }
  DOM.goalsScrollList.innerHTML = html;
};

// Level Action Handler (Collect items via taps -> watch 1 Telegram ad -> claim)
window.handleGoalLevelAction = function(lvl) {
  const curLevel = (gameState.goalState && gameState.goalState.currentLevel !== undefined) ? gameState.goalState.currentLevel : 0;
  const targetLvl = curLevel === 0 ? 1 : curLevel;
  if (lvl !== targetLvl) return;

  const req = getGoalLevelRequirements(targetLvl);
  const prog = gameState.goalState.levelProgress || { cards: 0, keys: 0, tickets: 0 };
  const isItemsComplete = prog.cards >= req.cards && prog.keys >= req.keys && prog.tickets >= req.tickets;

  if (!isItemsComplete) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`Tap the Energy Reactor to collect all 3 items first!`);
    } else {
      alert(`Collect all 3 items (Cards: ${prog.cards}/${req.cards}, Keys: ${prog.keys}/${req.keys}, Tickets: ${prog.tickets}/${req.tickets}) by tapping the reactor!`);
    }
    return;
  }

  sfx.playTapSound(1);

  // Require 1 Rewarded Ad Watch for Goal Level Reward
  if (typeof showRewardedAd === 'function') {
    showRewardedAd(() => {
      executeClaimGoalLevel(targetLvl);
    });
  } else if (typeof startAdSimulation === 'function') {
    startAdSimulation('goal', `Goal Level ${targetLvl} Reward`, `Watch 1 ad to claim Goal Level ${targetLvl} reward`, () => {
      executeClaimGoalLevel(targetLvl);
    });
  } else {
    executeClaimGoalLevel(targetLvl);
  }
};

function executeClaimGoalLevel(targetLvl) {
  const rewardQty = getGoalLevelRewardQty(targetLvl);
  if (!gameState.goalState.claimedGoals) gameState.goalState.claimedGoals = {};
  gameState.goalState.claimedGoals[targetLvl] = true;

  // Award loot (Cards, Keys, Tickets + Bonus Coins & XP)
  gameState.player.chestTickets = (gameState.player.chestTickets || 0) + rewardQty;
  gameState.player.chestKeys = (gameState.player.chestKeys || 0) + rewardQty;
  gameState.player.coins = (gameState.player.coins || 0) + (targetLvl * 25);
  gameState.player.xp = (gameState.player.xp || 0) + (targetLvl * 10);

  sfx.playLevelUpSound();

  if (DOM.sheetTitle && DOM.sheetContent && DOM.modalBackdrop) {
    DOM.sheetTitle.textContent = `🎉 GOAL LEVEL ${targetLvl} COMPLETE!`;
    DOM.sheetContent.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px 0; gap: 14px; text-align: center;">
        <div style="font-size: 54px; animation: bounceGlow 1.2s infinite alternate;">🏆</div>
        <h3 style="font-size: 20px; font-weight: 800; color: #38bdf8;">Goal Level ${targetLvl} Claimed!</h3>
        <p style="font-size: 13px; color: #94a3b8; line-height: 1.5; max-width: 280px;">You collected all items, watched 1 ad, and unlocked your loot:</p>
        <div style="background: rgba(6, 182, 212, 0.15); border: 1.5px solid #06b6d4; border-radius: 14px; padding: 12px 18px; width: 100%; display: flex; flex-direction: column; gap: 6px;">
          <div style="font-size: 15px; font-weight: 800; color: #38bdf8;">+${rewardQty} 🎟️ Cards • +${rewardQty} 🔑 Keys • +${rewardQty} 🎫 Tickets</div>
          <div style="font-size: 12px; color: #94a3b8;">+${targetLvl * 25} Coins • +${targetLvl * 10} XP</div>
        </div>
        <button class="feature-btn" onclick="closeTabModal()" style="width: 100%; padding: 12px; font-size: 14px; font-weight: 800; border-radius: 12px;">Advance to Level ${Math.min(100, targetLvl + 1)} ✨</button>
      </div>
    `;
    DOM.modalBackdrop.classList.add('open');
  }

  // Advance level
  if (targetLvl < 100) {
    gameState.goalState.currentLevel = targetLvl + 1;
    gameState.goalState.levelProgress = { cards: 0, keys: 0, tickets: 0 };
    gameState.goalState.levelAdsWatched = 0;
  }

  updateUI();
  saveGame();
}

// ==========================================================================
// GOAL LEVEL 100 MEGA REWARD ACTION HANDLER (1,000 Ads -> 100 Keys, 75 Cards, 150 Tickets, 1,000 Coins)
// ==========================================================================
window.handleGoalMegaRewardAction = function() {
  const curLevel = (gameState.goalState && gameState.goalState.currentLevel !== undefined) ? gameState.goalState.currentLevel : 0;
  const isLvl100Completed = curLevel >= 100 || !!(gameState.goalState.claimedGoals && gameState.goalState.claimedGoals[100]);

  if (!isLvl100Completed) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`Complete Goal Level 100 to unlock the 1,000 Ads Mega Watcher!`);
    } else {
      alert(`Complete Goal Level 100 to unlock the 1,000 Ads Mega Watcher! (Current: Level ${curLevel}/100)`);
    }
    return;
  }

  const watched = gameState.goalState.megaWatchedAds || 0;

  if (watched < 1000) {
    // Watch 1 Ad toward 1,000
    const doGoalAd = () => {
      gameState.goalState.megaWatchedAds = Math.min(1000, (gameState.goalState.megaWatchedAds || 0) + 1);
      updateUI();
      saveGame();
      if (typeof showFloatingToast === 'function') {
        showFloatingToast(`🎬 Ad Watched! Progress: ${gameState.goalState.megaWatchedAds}/1,000 Ads`);
      }
    };

    if (typeof showRewardedAd === 'function') {
      showRewardedAd(doGoalAd);
    } else if (typeof startAdSimulation === 'function') {
      startAdSimulation('goal_mega', 'Goal Mega Prize Ad Watcher', '+1 Ad Progress Towards 100 Keys, 75 Cards, 150 Tickets & 1K Coins', doGoalAd);
    } else {
      doGoalAd();
    }
  } else if (!gameState.goalState.megaRewardClaimed) {
    // Claim Mega Reward!
    const doClaimMegaGoal = () => {
      gameState.goalState.megaRewardClaimed = true;
      // Win 100 Keys, 75 Cards, 150 Tickets, 1,000 Coins
      gameState.player.chestKeys = (gameState.player.chestKeys || 0) + 100;
      gameState.player.chestTickets = (gameState.player.chestTickets || 0) + 75 + 150; // Cards + Tickets
      gameState.player.coins = (gameState.player.coins || 0) + 1000;
      sfx.playLevelUpSound();
      updateUI();
      saveGame();
    };

    if (typeof showRewardedAd === 'function') {
      showRewardedAd(doClaimMegaGoal);
    } else {
      doClaimMegaGoal();
    }

    // Win 100 Keys, 75 Cards, 150 Tickets, 1,000 Coins
    gameState.player.chestKeys = (gameState.player.chestKeys || 0) + 100;
    gameState.player.chestTickets = (gameState.player.chestTickets || 0) + 75 + 150; // Cards + Tickets
    gameState.player.coins = (gameState.player.coins || 0) + 1000;

    sfx.playLevelUpSound();

    if (DOM.sheetTitle && DOM.sheetContent && DOM.modalBackdrop) {
      DOM.sheetTitle.textContent = `👑 LEVEL 100 MEGA GOAL REWARD CLAIMED!`;
      DOM.sheetContent.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px 0; gap: 14px; text-align: center;">
          <div style="font-size: 58px; animation: bounceGlow 1.2s infinite alternate;">👑</div>
          <h3 style="font-size: 20px; font-weight: 800; color: #38bdf8;">Grand Goal Jackpot!</h3>
          <p style="font-size: 13px; color: #94a3b8; line-height: 1.5; max-width: 280px;">You reached Level 100, completed 1,000 ads, and claimed the ultimate reward bundle:</p>
          <div style="background: rgba(6, 182, 212, 0.15); border: 1.5px solid #06b6d4; border-radius: 14px; padding: 14px 18px; width: 100%; display: flex; flex-direction: column; gap: 8px;">
            <div style="font-size: 15px; font-weight: 800; color: #38bdf8;">🔑 +100 Mystery Keys</div>
            <div style="font-size: 15px; font-weight: 800; color: #ec4899;">🎟️ +75 Scratch Cards</div>
            <div style="font-size: 15px; font-weight: 800; color: #06b6d4;">🎫 +150 Spin Tickets</div>
            <div style="font-size: 15px; font-weight: 800; color: #fbbf24;">🪙 +1,000 Bonus Coins</div>
          </div>
          <button class="feature-btn" onclick="closeTabModal()" style="width: 100%; padding: 12px; font-size: 14px; font-weight: 800; border-radius: 12px;">AWESOME! ✨</button>
        </div>
      `;
      DOM.modalBackdrop.classList.add('open');
    }

    updateUI();
    saveGame();
  }
};

// Fast Testing Helpers
window.testSetGoalLevel100 = function() {
  if (!gameState.goalState) gameState.goalState = {};
  gameState.goalState.currentLevel = 100;
  if (!gameState.goalState.claimedGoals) gameState.goalState.claimedGoals = {};
  gameState.goalState.claimedGoals[100] = true;
  sfx.playLevelUpSound();
  renderGoalsList();
  updateUI();
  saveGame();
};

window.testAddGoalMegaAds = function(count = 100) {
  if (!gameState.goalState) gameState.goalState = {};
  if (gameState.goalState.currentLevel < 100) {
    gameState.goalState.currentLevel = 100;
  }
  gameState.goalState.megaWatchedAds = Math.min(1000, (gameState.goalState.megaWatchedAds || 0) + count);
  sfx.playTapSound(2);
  updateUI();
  saveGame();
};

window.testFillAllGoalMegaAds = function() {
  if (!gameState.goalState) gameState.goalState = {};
  gameState.goalState.currentLevel = 100;
  gameState.goalState.megaWatchedAds = 1000;
  sfx.playLevelUpSound();
  updateUI();
  saveGame();
};

window.testAddGoalCards = function(count = 10) {
  const curLevel = gameState.goalState.currentLevel || 1;
  const req = getGoalLevelRequirements(curLevel);
  if (!gameState.goalState.levelProgress) gameState.goalState.levelProgress = { cards: 0, keys: 0, tickets: 0 };
  gameState.goalState.levelProgress.cards = Math.min(req.cards, (gameState.goalState.levelProgress.cards || 0) + count);
  sfx.playTapSound(2);
  updateUI();
  saveGame();
};

window.testAddGoalKeys = function(count = 10) {
  const curLevel = gameState.goalState.currentLevel || 1;
  const req = getGoalLevelRequirements(curLevel);
  if (!gameState.goalState.levelProgress) gameState.goalState.levelProgress = { cards: 0, keys: 0, tickets: 0 };
  gameState.goalState.levelProgress.keys = Math.min(req.keys, (gameState.goalState.levelProgress.keys || 0) + count);
  sfx.playTapSound(2);
  updateUI();
  saveGame();
};

window.testAddGoalTickets = function(count = 10) {
  const curLevel = gameState.goalState.currentLevel || 1;
  const req = getGoalLevelRequirements(curLevel);
  if (!gameState.goalState.levelProgress) gameState.goalState.levelProgress = { cards: 0, keys: 0, tickets: 0 };
  gameState.goalState.levelProgress.tickets = Math.min(req.tickets, (gameState.goalState.levelProgress.tickets || 0) + count);
  sfx.playTapSound(2);
  updateUI();
  saveGame();
};

window.testFillGoalItems = function() {
  const curLevel = gameState.goalState.currentLevel || 1;
  const req = getGoalLevelRequirements(curLevel);
  gameState.goalState.levelProgress = { cards: req.cards, keys: req.keys, tickets: req.tickets };
  sfx.playTapSound(2);
  updateUI();
  saveGame();
};

window.testWatchGoalAd = function() {
  gameState.goalState.levelAdsWatched = Math.min(3, (gameState.goalState.levelAdsWatched || 0) + 1);
  sfx.playTapSound(2);
  updateUI();
  saveGame();
};

window.testSkipGoalLevel = function() {
  const curLevel = gameState.goalState.currentLevel || 1;
  if (!gameState.goalState.claimedGoals) gameState.goalState.claimedGoals = {};
  gameState.goalState.claimedGoals[curLevel] = true;
  if (curLevel < 100) {
    gameState.goalState.currentLevel = curLevel + 1;
    gameState.goalState.levelProgress = { cards: 0, keys: 0, tickets: 0 };
    gameState.goalState.levelAdsWatched = 0;
  }
  sfx.playLevelUpSound();
  updateUI();
  saveGame();
};

// UI Synchronizer for Goal Page
function updateGoalViewUI() {
  if (!DOM.pageGoal) return;

  const curLevel = (gameState.goalState && gameState.goalState.currentLevel !== undefined) ? gameState.goalState.currentLevel : 0;

  // Season Countdown
  const now = Date.now();
  const seasonEnd = (gameState.goalState && gameState.goalState.seasonEndMs) || (now + 12 * 86400 * 1000);
  const diffMs = Math.max(0, seasonEnd - now);
  const diffSecs = Math.floor(diffMs / 1000);
  const days = Math.floor(diffSecs / 86400);
  const hours = Math.floor((diffSecs % 86400) / 3600);
  const mins = Math.floor((diffSecs % 3600) / 60);
  const secs = diffSecs % 60;
  if (DOM.goalSeasonTimer) {
    DOM.goalSeasonTimer.textContent = `${days}d ${hours}h ${mins}m ${secs}s`;
  }

  // Top Nav Toggle Button
  if (DOM.toggleGoalsBtnText) {
    if (gameState.goalState && gameState.goalState.currentSubtab === 'goals') {
      DOM.toggleGoalsBtnText.textContent = 'MEGA REWARD';
    } else {
      DOM.toggleGoalsBtnText.textContent = 'GOALS 1-100';
    }
  }

  // Step 1: Goal Level 100 Status
  const isLvl100Completed = curLevel >= 100 || !!(gameState.goalState && gameState.goalState.claimedGoals && gameState.goalState.claimedGoals[100]);
  if (DOM.goalMegaStep1Badge) {
    if (isLvl100Completed) {
      DOM.goalMegaStep1Badge.textContent = 'COMPLETED';
      DOM.goalMegaStep1Badge.className = 'mega-step-badge completed';
    } else {
      DOM.goalMegaStep1Badge.textContent = 'LOCKED';
      DOM.goalMegaStep1Badge.className = 'mega-step-badge locked';
    }
  }

  if (DOM.goalMegaStep1SubText) {
    DOM.goalMegaStep1SubText.textContent = `Current: Goal Level ${curLevel} / 100`;
  }

  if (DOM.goalMegaStep1Lock) {
    DOM.goalMegaStep1Lock.style.display = isLvl100Completed ? 'none' : 'block';
  }

  // Step 2: 1,000 Ads Progress
  const watchedAds = (gameState.goalState && gameState.goalState.megaWatchedAds) || 0;
  const adsPct = Math.min(100, Math.floor((watchedAds / 1000) * 100));

  if (DOM.goalMegaAdsCounterHeader) {
    DOM.goalMegaAdsCounterHeader.textContent = `${watchedAds} / 1000 Ads (${adsPct}%)`;
  }

  if (DOM.goalMegaAdsProgressFill) {
    DOM.goalMegaAdsProgressFill.style.width = `${adsPct}%`;
  }

  if (DOM.goalMegaAdsRemainText) {
    DOM.goalMegaAdsRemainText.textContent = `${Math.max(0, 1000 - watchedAds)} ads remaining`;
  }

  // Master Mega Action Button State
  const isClaimed = !!(gameState.goalState && gameState.goalState.megaRewardClaimed);
  if (DOM.goalMegaActionBtn) {
    if (!isLvl100Completed) {
      DOM.goalMegaActionBtn.className = 'mega-action-btn disabled';
      if (DOM.goalMegaActionBtnText) DOM.goalMegaActionBtnText.textContent = `REACH GOAL LEVEL 100 TO UNLOCK AD WATCHER`;
      if (DOM.goalMegaActionLockIcon) DOM.goalMegaActionLockIcon.style.display = 'block';
    } else if (watchedAds < 1000) {
      DOM.goalMegaActionBtn.className = 'mega-action-btn';
      if (DOM.goalMegaActionBtnText) DOM.goalMegaActionBtnText.textContent = `WATCH AD (${watchedAds}/1000) FOR GOAL MEGA REWARD 🎬`;
      if (DOM.goalMegaActionLockIcon) DOM.goalMegaActionLockIcon.style.display = 'none';
    } else if (!isClaimed) {
      DOM.goalMegaActionBtn.className = 'mega-action-btn claim-ready';
      if (DOM.goalMegaActionBtnText) DOM.goalMegaActionBtnText.textContent = `🎉 CLAIM MEGA REWARD (100 KEYS, 75 CARDS, 150 TICKETS, 1000 COINS) 👑`;
      if (DOM.goalMegaActionLockIcon) DOM.goalMegaActionLockIcon.style.display = 'none';
    } else {
      DOM.goalMegaActionBtn.className = 'mega-action-btn claimed';
      if (DOM.goalMegaActionBtnText) DOM.goalMegaActionBtnText.textContent = `✓ MEGA REWARD CLAIMED (100 KEYS, 75 CARDS, 150 TICKETS, 1000 COINS)`;
      if (DOM.goalMegaActionLockIcon) DOM.goalMegaActionLockIcon.style.display = 'none';
    }
  }

  if (gameState.goalState && gameState.goalState.currentSubtab === 'goals') {
    renderGoalsList();
  }
}

window.getGoalLevelRequirements = getGoalLevelRequirements;
window.getGoalLevelRewardQty = getGoalLevelRewardQty;
window.getGoalTierLabel = getGoalTierLabel;
window.updateGoalViewUI = updateGoalViewUI;
