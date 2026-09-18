/* ==========================================================================
   XP & MEGA CASH PRIZE CONTROLLER (pages/xp/xp.js)
   - Level 1 - 100 Progression List & Milestones
   - Claiming Level Progression Rewards
   - 10,000 Coins Level 100 Mega Cash Prize Logic
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
    if (DOM.toggleLevelsBtnText) DOM.toggleLevelsBtnText.textContent = 'LV. 1 - 100';
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

window.renderLevelsList = function() {
  if (!DOM.levelsScrollList) return;
  const activeLevel = typeof getActiveLevel === 'function'
    ? getActiveLevel()
    : ((gameState.progression && gameState.progression.activeLevel) || gameState.player.level || 1);

  const curXp = (gameState.progression && gameState.progression.levelXp !== undefined)
    ? Number(gameState.progression.levelXp)
    : Number(gameState.player.xp || 0);

  let html = '';
  for (let lvl = 1; lvl <= 100; lvl++) {
    const cfg = typeof getLevelConfig === 'function' ? getLevelConfig(lvl) : null;
    const reqXp = cfg ? Number(cfg.xpRequired) : (lvl * 1000);
    const isUnlocked = typeof isLevelUnlocked === 'function' ? isLevelUnlocked(lvl) : (lvl <= activeLevel);
    const isClaimed = typeof isLevelCompleted === 'function' ? isLevelCompleted(lvl) : !!gameState.xpState.claimedLevels[lvl];
    const isCurrent = (lvl === activeLevel);
    const isLockedByAdmin = !!(cfg && cfg.isLocked);
    const isReached = (lvl < activeLevel) || (isCurrent && curXp >= reqXp);

    let tierName = 'Bronze';
    if (lvl > 80) tierName = 'Diamond';
    else if (lvl > 60) tierName = 'Platinum';
    else if (lvl > 40) tierName = 'Gold';
    else if (lvl > 20) tierName = 'Silver';

    // Reward pills from cfg.rewards
    let rewardHtml = '';
    if (cfg && cfg.rewards) {
      rewardHtml = `
        <div style="display: flex; gap: 4px; flex-wrap: wrap;">
          <span class="lvl-reward-pill pill-milestone-coins">🪙 +${cfg.rewards.coins || lvl * 25}</span>
          <span class="lvl-reward-pill pill-ticket">🃏 +${cfg.rewards.cards || 1}</span>
          <span class="lvl-reward-pill pill-key">🥢 +${cfg.rewards.keys || 1}</span>
        </div>
      `;
    } else if (lvl % 10 === 0) {
      rewardHtml = `
        <div class="milestone-container">
          <div class="milestone-banner-tag">MILESTONE</div>
          <div class="milestone-pills-row">
            <span class="lvl-reward-pill pill-milestone-coins">🟡 +${lvl * 25}</span>
            <span class="lvl-reward-pill pill-fuel">⚡ +5 Fuel</span>
          </div>
        </div>
      `;
    } else {
      rewardHtml = `<span class="lvl-reward-pill pill-ticket">🎟️ +1 Ticket</span>`;
    }

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
    } else if (isCurrent && isUnlocked) {
      if (curXp >= reqXp) {
        statusHtml = `<button class="level-claim-btn" style="background: linear-gradient(135deg, #8b5cf6, #d946ef);" onclick="claimLevelReward(${lvl})"><span>🎬</span> Claim</button>`;
      } else {
        statusHtml = `<span style="font-size: 10px; font-weight: 700; color: #38bdf8;">${Math.floor(curXp)}/${reqXp}</span>`;
      }
    } else if (isReached && isUnlocked) {
      statusHtml = `<button class="level-claim-btn" onclick="claimLevelReward(${lvl})"><span>🎬</span> Claim</button>`;
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
      progressSnippet = `
        <div style="font-size: 10px; color: #38bdf8; font-weight: 700; margin-top: 2px;">
          XP Progress: ${Math.floor(curXp)} / ${reqXp} XP ${curXp >= reqXp ? '• Ready!' : ''}
        </div>
      `;
    }

    html += `
      <div class="level-row-card ${isReached ? 'reached' : ''} ${isCurrent ? 'active-level-row' : ''}" id="levelRow-${lvl}">
        <div class="level-left-info">
          <div class="level-number-badge" style="background: ${isCurrent ? '#0284c7' : 'rgba(30, 41, 59, 0.8)'};">
            <span class="lv-lbl">LV</span>
            <span class="lv-val">${lvl}</span>
          </div>
          <div class="level-text-info">
            <div class="level-title-row">
              <span class="level-title-text">Level ${lvl}</span>
              ${isLockedByAdmin ? '<span class="level-tier-tag" style="color: #ef4444; font-weight: 800;">[LOCKED]</span>' : `<span class="level-tier-tag">(${tierName})</span>`}
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

// 1 Ad Watch Compulsory for XP Level Reward
window.claimLevelReward = function(lvl) {
  const activeLevel = typeof getActiveLevel === 'function'
    ? getActiveLevel()
    : ((gameState.progression && gameState.progression.activeLevel) || gameState.player.level || 1);

  const cfg = typeof getLevelConfig === 'function' ? getLevelConfig(lvl) : null;
  if (cfg && cfg.isLocked) {
    if (typeof showFloatingToast === 'function') showFloatingToast(`Level ${lvl} is locked by Admin.`);
    return;
  }

  if (typeof isLevelUnlocked === 'function' && !isLevelUnlocked(lvl)) {
    if (typeof showFloatingToast === 'function') showFloatingToast(`Reach and complete Level ${activeLevel} first!`);
    return;
  }

  const curXp = (gameState.progression && gameState.progression.levelXp !== undefined)
    ? Number(gameState.progression.levelXp)
    : Number(gameState.player.xp || 0);
  const reqXp = cfg ? Number(cfg.xpRequired) : (lvl * 1000);

  if (lvl === activeLevel && curXp < reqXp) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`Need ${reqXp - Math.floor(curXp)} more XP to claim Level ${lvl}!`);
    }
    return;
  }

  const isClaimed = typeof isLevelCompleted === 'function' ? isLevelCompleted(lvl) : !!gameState.xpState.claimedLevels[lvl];
  if (isClaimed) return;

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
  const activeLevel = typeof getActiveLevel === 'function'
    ? getActiveLevel()
    : ((gameState.progression && gameState.progression.activeLevel) || gameState.player.level || 1);

  if (lvl === activeLevel && typeof completeActiveLevel === 'function') {
    completeActiveLevel(lvl);
  } else {
    if (!gameState.xpState.claimedLevels) gameState.xpState.claimedLevels = {};
    gameState.xpState.claimedLevels[lvl] = true;
    if (gameState.progression && gameState.progression.completedLevels) {
      gameState.progression.completedLevels[lvl] = true;
    }

    const cfg = typeof getLevelConfig === 'function' ? getLevelConfig(lvl) : null;
    const rew = (cfg && cfg.rewards) || { coins: lvl * 25, cards: 1, keys: 1, tickets: 1, xp: lvl * 10 };
    gameState.player.coins = (gameState.player.coins || 0) + (rew.coins || lvl * 25);
    gameState.player.chestKeys = (gameState.player.chestKeys || 0) + (rew.keys || 1);
    gameState.player.chestTickets = (gameState.player.chestTickets || 0) + (rew.tickets || 1);
  }

  sfx.playLevelUpSound();
  renderLevelsList();
  updateUI();
  saveGame();
  if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
    window.firebaseSync.saveToCloudImmediate();
  }

  if (typeof showFloatingToast === 'function') {
    showFloatingToast(`🎉 Level ${lvl} Rewards Claimed!`);
  }
}

window.handleMegaRewardAction = function() {
  if (gameState.player.level < 100) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('Reach Level 100 first to unlock the Mega Prize!');
    }
    return;
  }

  if (gameState.xpState.watchedAds < 1000) {
    const doAd = () => {
      gameState.xpState.watchedAds = Math.min(1000, (gameState.xpState.watchedAds || 0) + 1);
      switchPage('xp');
      updateUI();
      saveGame();
      if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
        window.firebaseSync.saveToCloudImmediate();
      }
      if (typeof showFloatingToast === 'function') {
        showFloatingToast(`🎬 Ad Watched! Progress: ${gameState.xpState.watchedAds}/1,000 Ads`);
      }
    };

    if (typeof showRewardedAd === 'function') {
      showRewardedAd(doAd);
    } else if (typeof startAdSimulation === 'function') {
      startAdSimulation('xp', 'Level 100 Mega Ad Watcher', '+1 Ad Progress Towards 10,000 Cash Prize', doAd);
    } else {
      doAd();
    }
  } else if (!gameState.xpState.megaRewardClaimed) {
    // Claim Mega Reward
    const doClaimMega = () => {
      gameState.xpState.megaRewardClaimed = true;
      gameState.player.coins += 10000;
      sfx.playLevelUpSound();
      updateUI();
      saveGame();
      if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
        window.firebaseSync.saveToCloudImmediate();
      }
      if (typeof showFloatingToast === 'function') {
        showFloatingToast('🎉 10,000 Coins Mega Reward Claimed!');
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
window.testSetLevel100 = function() {
  gameState.player.level = 100;
  gameState.player.xp = 100000;
  sfx.playLevelUpSound();
  renderLevelsList();
  updateUI();
  saveGame();
};

window.testAddAds = function(count = 100) {
  if (gameState.player.level < 100) {
    gameState.player.level = 100;
    gameState.player.xp = 100000;
  }
  gameState.xpState.watchedAds = Math.min(1000, (gameState.xpState.watchedAds || 0) + count);
  sfx.playTapSound(2);
  updateUI();
  saveGame();
};

window.testFillAllAds = function() {
  if (gameState.player.level < 100) {
    gameState.player.level = 100;
    gameState.player.xp = 100000;
  }
  gameState.xpState.watchedAds = 1000;
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

  // Step 1: Reach Level 100
  const isLv100 = gameState.player.level >= 100;
  if (DOM.megaStep1Badge) {
    if (isLv100) {
      DOM.megaStep1Badge.textContent = 'COMPLETED';
      DOM.megaStep1Badge.className = 'mega-step-badge unlocked';
      if (DOM.megaStep1SubText) DOM.megaStep1SubText.textContent = 'Current: Level 100 / 100 (100,000 / 100,000 XP)';
      if (DOM.megaStep1Lock) DOM.megaStep1Lock.innerHTML = `<polyline points="20 6 9 17 4 12" stroke="#10b981" stroke-width="2.5" fill="none"/>`;
    } else {
      DOM.megaStep1Badge.textContent = 'LOCKED';
      DOM.megaStep1Badge.className = 'mega-step-badge locked';
      const xpReqRemaining = Math.max(0, 100000 - gameState.player.xp);
      if (DOM.megaStep1SubText) DOM.megaStep1SubText.textContent = `Current: Level ${gameState.player.level} / 100 (-${xpReqRemaining.toLocaleString()} / 100,000 XP)`;
      if (DOM.megaStep1Lock) DOM.megaStep1Lock.innerHTML = `<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>`;
    }
  }

  // Step 2: Watch 1,000 Ads
  const watched = gameState.xpState.watchedAds || 0;
  const adsPercent = Math.min(100, Math.floor((watched / 1000) * 100));
  if (DOM.megaAdsCounterHeader) DOM.megaAdsCounterHeader.textContent = `${watched} / 1000 Ads (${adsPercent}%)`;
  if (DOM.megaAdsProgressFill) DOM.megaAdsProgressFill.style.width = `${adsPercent}%`;
  if (DOM.megaAdsRemainText) DOM.megaAdsRemainText.textContent = `${Math.max(0, 1000 - watched)} ads remaining`;

  // Action Button
  if (DOM.megaActionBtn) {
    if (!isLv100) {
      DOM.megaActionBtn.className = 'mega-action-btn disabled';
      if (DOM.megaActionBtnText) DOM.megaActionBtnText.textContent = 'REACH LEVEL 100 TO UNLOCK AD WATCHER';
      if (DOM.megaActionLockIcon) DOM.megaActionLockIcon.style.display = 'block';
    } else if (watched < 1000) {
      DOM.megaActionBtn.className = 'mega-action-btn active-watch';
      if (DOM.megaActionBtnText) DOM.megaActionBtnText.textContent = `WATCH AD (+1 / 1,000) [${watched}/1000]`;
      if (DOM.megaActionLockIcon) DOM.megaActionLockIcon.style.display = 'none';
    } else if (!gameState.xpState.megaRewardClaimed) {
      DOM.megaActionBtn.className = 'mega-action-btn claim-ready';
      if (DOM.megaActionBtnText) DOM.megaActionBtnText.textContent = '🎉 CLAIM 10,000 COINS MEGA REWARD';
      if (DOM.megaActionLockIcon) DOM.megaActionLockIcon.style.display = 'none';
    } else {
      DOM.megaActionBtn.className = 'mega-action-btn disabled';
      if (DOM.megaActionBtnText) DOM.megaActionBtnText.textContent = '✓ 10,000 COINS REWARD CLAIMED';
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

