/* ==========================================================================
   XP & MEGA CASH PRIZE CONTROLLER (pages/xp/xp.js)
   - Level 1 - 1000 Progression List & Milestones
   - Claiming Level Progression Rewards
   - 10,000 Coins Level 1000 Mega Cash Prize Logic
   - Ad Watcher Simulation & Claim Verification
   - Developer/Debug Test Helpers
   - XP Page UI Synchronization
   ========================================================================== */

window.switchXpSubtab = function(subtabName) {
  gameState.xpState.currentSubtab = subtabName;
  if (subtabName === 'levels') {
    DOM.subtabLevelsList.classList.add('active');
    DOM.subtabMegaReward.classList.remove('active');
    DOM.xpLevelsListSubView.classList.add('active');
    DOM.xpMegaRewardSubView.classList.remove('active');
    if (DOM.toggleLevelsBtnText) DOM.toggleLevelsBtnText.textContent = 'MEGA REWARD';
    renderLevelsList();
  } else {
    DOM.subtabLevelsList.classList.remove('active');
    DOM.subtabMegaReward.classList.add('active');
    DOM.xpLevelsListSubView.classList.remove('active');
    DOM.xpMegaRewardSubView.classList.add('active');
    if (DOM.toggleLevelsBtnText) DOM.toggleLevelsBtnText.textContent = 'LV. 1 - 1000';
  }
  sfx.playTapSound(1);
  updateUI();
};

window.toggleXpSubView = function() {
  if (gameState.xpState.currentSubtab === 'levels') {
    switchXpSubtab('mega');
  } else {
    switchXpSubtab('levels');
  }
};

// Dark Green Fuel scaling formula: Level 1 = 1, Level 1000 = 200
window.calculateLevelDarkGreenFuel = function(lvl) {
  return Math.max(1, Math.min(200, Math.ceil(lvl / 5)));
};

window.renderLevelsList = function() {
  if (!DOM.levelsScrollList) return;
  if (gameState.currentTab !== 'xp' || (gameState.xpState && gameState.xpState.currentSubtab !== 'levels')) {
    return;
  }
  const activeLevel = typeof getXpActiveLevel === 'function'
    ? getXpActiveLevel()
    : ((gameState.xpState && gameState.xpState.currentLevel) || 1);

  const curXp = Number(gameState.player.xp || 0);
  const claimedLevelsState = (gameState.xpState && gameState.xpState.claimedLevels) || {};

  let html = '';
  for (let lvl = 1; lvl <= 1000; lvl++) {
    const cfg = typeof getLevelConfig === 'function' ? getLevelConfig(lvl) : null;
    const reqXp = cfg ? Number(cfg.xpRequired) : (lvl * 1000);
    const isLockedByAdmin = !!(cfg && cfg.isLocked);
    const isUnlocked = !isLockedByAdmin && (lvl === 1 || !!claimedLevelsState[lvl - 1]);
    const isClaimed = !!claimedLevelsState[lvl];
    const isCurrent = (lvl === activeLevel);
    const hasEnoughXp = (curXp >= reqXp);
    const isReached = isClaimed || (isUnlocked && hasEnoughXp);

    // Reward pills: Dark Green Fuel cells only
    const fuelAmount = window.calculateLevelDarkGreenFuel(lvl);
    let rewardHtml = `
      <span class="lvl-reward-pill pill-fuel" style="background: rgba(5, 150, 105, 0.25); border: 1px solid #10b981; color: #34d399; font-weight: 800; display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 6px;">
        <span>🔋</span> +${fuelAmount} Dark Green Fuel
      </span>
    `;

    // Status action
    let statusHtml = '';
    if (isLockedByAdmin && !isClaimed) {
      statusHtml = `
        <div class="level-lock-status" title="Locked by Admin" style="color: #ef4444; display: flex; flex-direction: column; align-items: center; gap: 2px;">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span style="font-size: 8px; font-weight: 800; color: #f87171;">LOCKED</span>
        </div>
      `;
    } else if (isClaimed) {
      statusHtml = `<span style="font-size: 11px; font-weight: 800; color: #10b981;">✓ Claimed</span>`;
    } else if (isUnlocked) {
      if (hasEnoughXp) {
        statusHtml = `<button class="level-claim-btn" style="background: linear-gradient(135deg, #059669, #10b981); box-shadow: 0 0 12px rgba(16, 185, 129, 0.5);" onclick="claimLevelReward(${lvl})"><span>📢</span> Claim</button>`;
      } else {
        statusHtml = `<span style="font-size: 10px; font-weight: 700; color: #38bdf8;">${Math.floor(curXp).toLocaleString()}/${reqXp.toLocaleString()} XP</span>`;
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
    if (!isClaimed && isUnlocked) {
      progressSnippet = `
        <div style="font-size: 10px; color: ${hasEnoughXp ? '#34d399' : '#38bdf8'}; font-weight: 700; margin-top: 2px;">
          XP: ${Math.floor(curXp).toLocaleString()} / ${reqXp.toLocaleString()} XP ${hasEnoughXp ? '• Ready! 📢 1 Ad' : `• Need ${(reqXp - Math.floor(curXp)).toLocaleString()} more`}
        </div>
      `;
    }

    html += `
      <div class="level-row-card ${isReached ? 'reached' : ''} ${isCurrent ? 'active-level-row' : ''}" id="levelRow-${lvl}">
        <div class="level-left-info">
          <div class="level-number-badge" style="background: ${isCurrent ? '#0284c7' : (isClaimed ? 'rgba(5, 150, 105, 0.8)' : 'rgba(30, 41, 59, 0.8)')};">
            <span class="lv-lbl">LV</span>
            <span class="lv-val">${lvl}</span>
          </div>
          <div class="level-text-info">
            <div class="level-title-row">
              <span class="level-title-text">Level ${lvl}</span>
            </div>
            <span class="level-xp-req">${reqXp.toLocaleString()} XP</span>
            ${progressSnippet}
          </div>
        </div>

        <div class="level-right-rewards">
          ${rewardHtml}
          ${statusHtml}
        </div>
      </div>
    `;
  }
  DOM.levelsScrollList.innerHTML = html;
};

// 1 Ad Watch Compulsory for XP Level Reward (100% Decoupled from Goal Page)
window.claimLevelReward = function(lvl) {
  const cfg = typeof getLevelConfig === 'function' ? getLevelConfig(lvl) : null;
  if (cfg && cfg.isLocked) {
    if (typeof showFloatingToast === 'function') showFloatingToast(`Level ${lvl} is locked by Admin.`);
    return;
  }

  const isUnlocked = typeof isXpLevelUnlocked === 'function'
    ? isXpLevelUnlocked(lvl)
    : (lvl === 1 || !!(gameState.xpState && gameState.xpState.claimedLevels && gameState.xpState.claimedLevels[lvl - 1]));

  if (!isUnlocked) {
    if (typeof showFloatingToast === 'function') showFloatingToast(`Claim Level ${lvl - 1} XP reward first!`);
    return;
  }

  const isClaimed = typeof isXpLevelClaimed === 'function'
    ? isXpLevelClaimed(lvl)
    : !!(gameState.xpState && gameState.xpState.claimedLevels && gameState.xpState.claimedLevels[lvl]);

  if (isClaimed) {
    if (typeof showFloatingToast === 'function') showFloatingToast(`Level ${lvl} reward already claimed!`);
    return;
  }

  const curXp = Number(gameState.player.xp || 0);
  const reqXp = cfg ? Number(cfg.xpRequired) : (lvl * 1000);

  if (curXp < reqXp) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`Need ${(reqXp - Math.floor(curXp)).toLocaleString()} more XP to claim Level ${lvl}!`);
    }
    return;
  }

  sfx.playTapSound(1);

  // Require 1 Rewarded Ad Watch for XP Level Reward
  if (typeof showRewardedAd === 'function') {
    showRewardedAd(() => {
      executeClaimLevelReward(lvl);
    });
  } else if (typeof startAdSimulation === 'function') {
    startAdSimulation('xp', `Level ${lvl} Reward Claim`, `Watch 1 ad to claim Level ${lvl} reward`, () => {
      executeClaimLevelReward(lvl);
    });
  } else {
    executeClaimLevelReward(lvl);
  }
};

function executeClaimLevelReward(lvl) {
  const darkGreenFuel = window.calculateLevelDarkGreenFuel(lvl);

  if (!gameState.energyGenerator.fuelCells) {
    gameState.energyGenerator.fuelCells = { green: 0, darkgreen: 0, yellow: 0, orange: 0, red: 0, pink: 0, purple: 0, blue: 0, lightblue: 0, darkred: 0 };
  }
  gameState.energyGenerator.fuelCells.darkgreen = (gameState.energyGenerator.fuelCells.darkgreen || 0) + darkGreenFuel;

  if (!gameState.xpState) gameState.xpState = {};
  if (!gameState.xpState.claimedLevels) gameState.xpState.claimedLevels = {};
  gameState.xpState.claimedLevels[lvl] = true;
  gameState.xpState.currentLevel = Math.max((gameState.xpState.currentLevel || 1), lvl + 1);

  sfx.playLevelUpSound();

  const nextLvl = Math.min(1000, lvl + 1);
  if (DOM.sheetTitle && DOM.sheetContent && DOM.modalBackdrop) {
    DOM.sheetTitle.textContent = `🎉 XP LEVEL ${lvl} COMPLETE!`;
    DOM.sheetContent.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px 0; gap: 14px; text-align: center;">
        <div style="font-size: 54px; animation: bounceGlow 1.2s infinite alternate;">🔋</div>
        <h3 style="font-size: 20px; font-weight: 800; color: #34d399;">XP Level ${lvl} Claimed!</h3>
        <p style="font-size: 13px; color: #94a3b8; line-height: 1.5; max-width: 280px;">You reached ${(typeof getLevelConfig === 'function' && getLevelConfig(lvl) ? Number(getLevelConfig(lvl).xpRequired) : lvl * 1000).toLocaleString()} XP, watched 1 ad, and unlocked your reward:</p>
        <div style="background: rgba(5, 150, 105, 0.2); border: 1.5px solid #10b981; border-radius: 14px; padding: 14px 20px; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <span style="font-size: 24px;">🔋</span>
          <span style="font-size: 18px; font-weight: 800; color: #34d399;">+${darkGreenFuel} Dark Green Fuel</span>
        </div>
        <button class="feature-btn" onclick="closeTabModal()" style="width: 100%; padding: 12px; font-size: 14px; font-weight: 800; border-radius: 12px; background: linear-gradient(135deg, #059669, #10b981);">Advance to Level ${nextLvl} ✨</button>
      </div>
    `;
    DOM.modalBackdrop.classList.add('open');
  }

  renderLevelsList();
  updateUI();
  saveGame(true);
  if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
    window.firebaseSync.saveToCloudImmediate();
  }

  if (typeof showFloatingToast === 'function') {
    showFloatingToast(`🎉 XP Level ${lvl} Claimed: +${darkGreenFuel} Dark Green Fuel!`);
  }
}

window.handleMegaRewardAction = function() {
  if (gameState.player.level < 1000) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('Reach Level 1000 first to unlock the Mega Prize!');
    }
    return;
  }

  if (gameState.xpState.watchedAds < 100) {
    const doAd = () => {
      gameState.xpState.watchedAds = Math.min(100, (gameState.xpState.watchedAds || 0) + 1);
      switchPage('xp');
      updateUI();
      saveGame();
      if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
        window.firebaseSync.saveToCloudImmediate();
      }
      if (typeof showFloatingToast === 'function') {
        showFloatingToast(`🎬 Ad Watched! Progress: ${gameState.xpState.watchedAds}/100 Ads`);
      }
    };

    if (typeof showRewardedAd === 'function') {
      showRewardedAd(doAd);
    } else if (typeof startAdSimulation === 'function') {
      startAdSimulation('xp', 'Level 1000 Mega Ad Watcher', '+1 Ad Progress Towards 1,000 Diamonds Prize', doAd);
    } else {
      doAd();
    }
  } else if (!gameState.xpState.megaRewardClaimed) {
    // Claim Mega Reward: 1,000 Diamonds
    const doClaimMega = () => {
      gameState.xpState.megaRewardClaimed = true;
      gameState.player.diamonds = (gameState.player.diamonds || 0) + 1000;
      sfx.playLevelUpSound();
      updateUI();
      saveGame();
      if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
        window.firebaseSync.saveToCloudImmediate();
      }
      if (typeof showFloatingToast === 'function') {
        showFloatingToast('🎉 1,000 Diamonds Mega Reward Claimed! 💎');
      }
    };

    if (typeof showRewardedAd === 'function') {
      showRewardedAd(doClaimMega);
    } else {
      doClaimMega();
    }
  }
};

// Debug & Fast-Testing Helpers for XP
window.testSetLevel1000 = function() {
  gameState.player.level = 1000;
  gameState.player.xp = 1000000;
  sfx.playLevelUpSound();
  renderLevelsList();
  updateUI();
  saveGame();
};
window.testSetLevel100 = window.testSetLevel1000;

window.testAddAds = function(count = 10) {
  if (gameState.player.level < 1000) {
    gameState.player.level = 1000;
    gameState.player.xp = 1000000;
  }
  gameState.xpState.watchedAds = Math.min(100, (gameState.xpState.watchedAds || 0) + count);
  sfx.playTapSound(2);
  updateUI();
  saveGame();
};

window.testFillAllAds = function() {
  if (gameState.player.level < 1000) {
    gameState.player.level = 1000;
    gameState.player.xp = 1000000;
  }
  gameState.xpState.watchedAds = 100;
  sfx.playLevelUpSound();
  updateUI();
  saveGame();
};

function updateXpViewUI() {
  if (!DOM.pageXP) return;

  // Season Countdown & Expiration check
  if (typeof checkSeasonExpiration === 'function') checkSeasonExpiration();
  const now = Date.now();
  const diffMs = Math.max(0, (gameState.xpState.seasonEndMs || (now + 30 * 86400 * 1000)) - now);
  const diffSecs = Math.floor(diffMs / 1000);
  const days = Math.floor(diffSecs / 86400);
  const hours = Math.floor((diffSecs % 86400) / 3600);
  const mins = Math.floor((diffSecs % 3600) / 60);
  const secs = diffSecs % 60;
  if (DOM.xpSeasonTimer) {
    DOM.xpSeasonTimer.textContent = `${days}d ${hours}h ${mins}m ${secs}s`;
  }

  // Energy Generator timers in XP view
  const timerSecs = gameState.energyGenerator.remainingSeconds;
  const th = Math.floor(timerSecs / 3600);
  const tm = Math.floor((timerSecs % 3600) / 60);
  const ts = timerSecs % 60;
  const timeStr = timerSecs > 3600 ? `${String(th).padStart(2, '0')}h ${String(tm).padStart(2, '0')}m` : `${String(tm).padStart(2, '0')}m ${String(ts).padStart(2, '0')}s`;
  
  if (DOM.xpGenTimerVal) DOM.xpGenTimerVal.textContent = timeStr;
  if (DOM.xpGeneratorTimerStatus) DOM.xpGeneratorTimerStatus.textContent = timeStr;

  if (DOM.xpGenStatusPill) {
    if (timerSecs > 0) {
      DOM.xpGenStatusPill.classList.add('active-pill');
      if (DOM.xpGenStatusText) DOM.xpGenStatusText.textContent = 'ACTIVE';
    } else {
      DOM.xpGenStatusPill.classList.remove('active-pill');
      if (DOM.xpGenStatusText) DOM.xpGenStatusText.textContent = 'INACTIVE';
    }
  }

  // Step 1: Reach Level 1000
  const isLv1000 = gameState.player.level >= 1000;
  if (DOM.megaStep1Badge) {
    if (isLv1000) {
      DOM.megaStep1Badge.textContent = 'COMPLETED';
      DOM.megaStep1Badge.className = 'mega-step-badge unlocked';
      if (DOM.megaStep1SubText) DOM.megaStep1SubText.textContent = 'Current: Level 1000 / 1000 (1,000,000 / 1,000,000 XP)';
      if (DOM.megaStep1Lock) DOM.megaStep1Lock.innerHTML = `<polyline points="20 6 9 17 4 12" stroke="#10b981" stroke-width="2.5" fill="none"/>`;
    } else {
      DOM.megaStep1Badge.textContent = 'LOCKED';
      DOM.megaStep1Badge.className = 'mega-step-badge locked';
      const xpReqRemaining = Math.max(0, 1000000 - gameState.player.xp);
      if (DOM.megaStep1SubText) DOM.megaStep1SubText.textContent = `Current: Level ${gameState.player.level} / 1000 (-${xpReqRemaining.toLocaleString()} / 1,000,000 XP)`;
      if (DOM.megaStep1Lock) DOM.megaStep1Lock.innerHTML = `<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>`;
    }
  }

  // Step 2: Watch 100 Ads
  const watched = gameState.xpState.watchedAds || 0;
  const adsPercent = Math.min(100, Math.floor((watched / 100) * 100));
  if (DOM.megaAdsCounterHeader) DOM.megaAdsCounterHeader.textContent = `${watched} / 100 Ads (${adsPercent}%)`;
  if (DOM.megaAdsProgressFill) DOM.megaAdsProgressFill.style.width = `${adsPercent}%`;
  if (DOM.megaAdsRemainText) DOM.megaAdsRemainText.textContent = `${Math.max(0, 100 - watched)} ads remaining`;

  // Action Button
  if (DOM.megaActionBtn) {
    if (!isLv1000) {
      DOM.megaActionBtn.className = 'mega-action-btn disabled';
      if (DOM.megaActionBtnText) DOM.megaActionBtnText.textContent = 'REACH LEVEL 1000 TO UNLOCK AD WATCHER';
      if (DOM.megaActionLockIcon) DOM.megaActionLockIcon.style.display = 'block';
    } else if (watched < 100) {
      DOM.megaActionBtn.className = 'mega-action-btn active-watch';
      if (DOM.megaActionBtnText) DOM.megaActionBtnText.textContent = `WATCH AD (+1 / 100) [${watched}/100]`;
      if (DOM.megaActionLockIcon) DOM.megaActionLockIcon.style.display = 'none';
    } else if (!gameState.xpState.megaRewardClaimed) {
      DOM.megaActionBtn.className = 'mega-action-btn claim-ready';
      if (DOM.megaActionBtnText) DOM.megaActionBtnText.textContent = '🎉 CLAIM 1,000 DIAMONDS MEGA REWARD 💎';
      if (DOM.megaActionLockIcon) DOM.megaActionLockIcon.style.display = 'none';
    } else {
      DOM.megaActionBtn.className = 'mega-action-btn disabled';
      if (DOM.megaActionBtnText) DOM.megaActionBtnText.textContent = '✓ 1,000 DIAMONDS REWARD CLAIMED';
      if (DOM.megaActionLockIcon) DOM.megaActionLockIcon.style.display = 'none';
    }
  }
}

window.updateXpViewUI = updateXpViewUI;

window.addEventListener('levelsConfigUpdated', () => {
  if (gameState.xpState && gameState.xpState.currentSubtab === 'levels') {
    renderLevelsList();
  }
  updateXpViewUI();
});

