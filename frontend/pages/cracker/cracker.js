/* ==========================================================================
   CRACKER BOOM & 1-1000 LEVEL MILESTONES CONTROLLER (pages/cracker/cracker.js)
   - Levels 1 to 1000 Cracker Boom progression using 🧨 Crackers won from Spinner
   - Level 1000 Mega Reward with 1,000 Ads Watcher
   - Grand Prize: 5,000 Diamonds, 2,000 Keys, 1,000 Cards, 500,000 Coins
   - Subtabs: Crackers 1-1000 Roadmap vs Mega Reward
   ========================================================================== */

(function() {
  'use strict';

  // Ensure Cracker State is Initialized in gameState
  function ensureCrackerState() {
    if (typeof gameState === 'undefined') return null;
    if (!gameState.crackerState) {
      gameState.crackerState = {
        currentLevel: 1,
        claimedLevels: {},
        currentSubtab: 'levels',
        megaWatchedAds: 0,
        megaRewardClaimed: false,
        seasonEndMs: Date.now() + 30 * 86400 * 1000
      };
    }
    if (gameState.crackerState.currentLevel === undefined) gameState.crackerState.currentLevel = 1;
    if (!gameState.crackerState.claimedLevels) gameState.crackerState.claimedLevels = {};
    if (gameState.crackerState.currentSubtab === undefined) gameState.crackerState.currentSubtab = 'levels';
    if (gameState.crackerState.megaWatchedAds === undefined) gameState.crackerState.megaWatchedAds = 0;
    if (gameState.crackerState.seasonEndMs === undefined) gameState.crackerState.seasonEndMs = Date.now() + 30 * 86400 * 1000;
    return gameState.crackerState;
  }

  // Calculate 🧨 Cracker Requirements for any Level 1 to 1000
  function getCrackerLevelRequirement(lvl) {
    if (lvl <= 1) return 2;
    if (lvl <= 5) return 2 + (lvl - 1) * 2;
    if (lvl <= 20) return 10 + (lvl - 5) * 3;
    if (lvl <= 50) return 55 + (lvl - 20) * 4;
    if (lvl <= 100) return 175 + (lvl - 50) * 5;
    if (lvl <= 500) return 425 + Math.round((lvl - 100) * 4.5);
    return Math.round(2225 + Math.pow(lvl - 500, 1.25) * 0.9);
  }

  // Calculate Level Rewards
  function getCrackerLevelRewards(lvl) {
    return {
      coins: lvl * 50,
      xp: lvl * 20,
      diamonds: Math.max(1, Math.floor(lvl / 15)),
      keys: Math.max(1, Math.floor(lvl / 25)),
      cards: Math.max(1, Math.floor(lvl / 30)),
      tickets: Math.max(1, Math.floor(lvl / 20))
    };
  }

  // Subtab Switcher
  function switchCrackerSubtab(subtabName) {
    const cs = ensureCrackerState();
    if (cs) cs.currentSubtab = subtabName;

    const subtabListBtn = document.getElementById('subtabCrackerLevelsList');
    const subtabMegaBtn = document.getElementById('subtabCrackerMegaReward');
    const roadmapView = document.getElementById('crackerRoadmapSubView');
    const megaView = document.getElementById('crackerMegaRewardSubView');
    const toggleBtnText = document.getElementById('toggleCrackerBtnText');

    if (subtabName === 'levels') {
      if (subtabListBtn) subtabListBtn.classList.add('active');
      if (subtabMegaBtn) subtabMegaBtn.classList.remove('active');
      if (roadmapView) roadmapView.classList.add('active');
      if (megaView) megaView.classList.remove('active');
      if (toggleBtnText) toggleBtnText.textContent = 'MEGA REWARD';
      renderCrackerLevelsList();
    } else {
      if (subtabListBtn) subtabListBtn.classList.remove('active');
      if (subtabMegaBtn) subtabMegaBtn.classList.add('active');
      if (roadmapView) roadmapView.classList.remove('active');
      if (megaView) megaView.classList.add('active');
      const curLvl = cs ? cs.currentLevel : 1;
      if (toggleBtnText) toggleBtnText.textContent = `CRACKER LV. ${curLvl}`;
    }

    if (typeof sfx !== 'undefined' && sfx.playTapSound) sfx.playTapSound(1);
    updateCrackerViewUI();
  }

  function toggleCrackerSubView() {
    const cs = ensureCrackerState();
    if (cs && cs.currentSubtab === 'levels') {
      switchCrackerSubtab('mega');
    } else {
      switchCrackerSubtab('levels');
    }
  }

  // Windowed rendering range state
  let visibleMinLevel = 1;
  let visibleMaxLevel = 60;

  // Render Cracker Levels 1 to 1000 Roadmap List
  function renderCrackerLevelsList() {
    const listEl = document.getElementById('crackerLevelsScrollList');
    if (!listEl) return;

    const cs = ensureCrackerState();
    const curLvl = cs ? cs.currentLevel : 1;
    const claimed = cs ? cs.claimedLevels : {};
    const playerCrackers = (typeof gameState !== 'undefined' && gameState.player && gameState.player.dynamiteCoins) || 0;

    // Window around current level
    const startLvl = Math.max(1, Math.min(curLvl - 10, visibleMinLevel));
    const endLvl = Math.min(1000, Math.max(curLvl + 50, visibleMaxLevel));

    let html = '';

    // Show Previous Chunk button if needed
    if (startLvl > 1) {
      html += `
        <button type="button" class="cracker-need-btn" style="width: 100%; justify-content: center; padding: 10px; margin-bottom: 6px;" onclick="window.showEarlierCrackerLevels()">
          ▲ Show Earlier Levels (1 to ${startLvl - 1})
        </button>
      `;
    }

    for (let g = startLvl; g <= endLvl; g++) {
      const req = getCrackerLevelRequirement(g);
      const rewards = getCrackerLevelRewards(g);
      const isClaimed = !!claimed[g];
      const isCurrent = (g === curLvl);
      const isUnlocked = (g <= curLvl);

      let rowClass = 'cracker-row-card';
      if (isClaimed) rowClass += ' reached';
      if (isCurrent) rowClass += ' active-level-row';

      // Status / Action Column
      let statusHtml = '';
      if (isClaimed) {
        statusHtml = `<div class="cracker-done-badge">✓ Upgraded</div>`;
      } else if (isCurrent) {
        if (playerCrackers >= req) {
          statusHtml = `
            <button class="cracker-claim-btn" onclick="handleCrackerLevelClaim(${g})">
              💥 Upgrade (${req} 🧨)
            </button>
          `;
        } else {
          const needed = req - playerCrackers;
          statusHtml = `
            <button class="cracker-need-btn" onclick="promptNeedCrackers(${needed})" title="Need ${needed} more 🧨 to upgrade">
              <span>🧨</span> Need ${needed}
            </button>
          `;
        }
      } else if (isUnlocked) {
        statusHtml = `
          <button class="cracker-claim-btn" onclick="handleCrackerLevelClaim(${g})">
            💥 Upgrade (${req} 🧨)
          </button>
        `;
      } else {
        statusHtml = `
          <div class="cracker-lock-icon" title="Locked">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
        `;
      }

      let progressSnippet = '';
      if (isCurrent && !isClaimed) {
        progressSnippet = `
          <div class="cracker-row-progress">
            Progress: 🧨 ${playerCrackers.toLocaleString()} / ${req.toLocaleString()} ${playerCrackers >= req ? '• Ready to Upgrade!' : ''}
          </div>
        `;
      }

      html += `
        <div class="${rowClass}" id="crackerRow-${g}">
          <div class="cracker-level-badge">
            <span class="badge-letter">C</span>
            <span class="badge-num">${g}</span>
          </div>

          <div class="cracker-row-info">
            <span class="cracker-row-title">Cracker Level ${g}</span>
            <span class="cracker-row-req">Req: 🧨 ${req.toLocaleString()} Crackers</span>
            ${progressSnippet}
          </div>

          <div class="cracker-row-rewards-col">
            <div class="cracker-rewards-pill-wrap">
              <span class="cracker-reward-chip gold">🪙 +${rewards.coins.toLocaleString()}</span>
              <span class="cracker-reward-chip diamond">💎 +${rewards.diamonds}</span>
              ${rewards.keys > 0 ? `<span class="cracker-reward-chip">🔑 +${rewards.keys}</span>` : ''}
              ${rewards.cards > 0 ? `<span class="cracker-reward-chip">🃏 +${rewards.cards}</span>` : ''}
            </div>
            ${statusHtml}
          </div>
        </div>
      `;
    }

    // Show Next Chunk / Jump buttons if needed
    if (endLvl < 1000) {
      html += `
        <button type="button" class="cracker-need-btn" style="width: 100%; justify-content: center; padding: 10px; margin-top: 6px;" onclick="window.showMoreCrackerLevels()">
          ▼ Show More Levels (${endLvl + 1} to 1000)
        </button>
        <button type="button" class="cracker-jump-1000-btn" onclick="window.jumpToCrackerLevel1000()">
          👑 Jump to Level 1000 (Mega Cracker Prize) ▼
        </button>
      `;
    }

    // ==========================================
    // LEVEL 1000 GRAND REWARD ROW (BELOW LEVEL 1000)
    // Same level tab format, clicking opens popup modal
    // ==========================================
    const isLvl1000Completed = curLvl >= 1000 || !!(claimed && claimed[1000]);
    const isMegaClaimed = !!(cs && cs.megaRewardClaimed);
    const watchedAds = (cs && cs.megaWatchedAds) || 0;
    const adsPct = Math.min(100, Math.floor((watchedAds / 1000) * 100));

    let grandStatusSummary = '';
    let grandActionBtn = '';

    if (isMegaClaimed) {
      grandStatusSummary = '✓ Grand Cracker Prize Claimed!';
      grandActionBtn = `<div class="cracker-done-badge">✓ Claimed</div>`;
    } else if (!isLvl1000Completed) {
      grandStatusSummary = `🔒 Reach Cracker Lv 1000 to unlock`;
      grandActionBtn = `
        <button class="cracker-claim-btn grand-open-btn" onclick="window.openCrackerMegaRewardModal(event)" title="Tap to view Grand Reward">
          🎁 VIEW PRIZE
        </button>
      `;
    } else if (watchedAds < 1000) {
      grandStatusSummary = `📢 Ads: ${watchedAds} / 1000 (${adsPct}%)`;
      grandActionBtn = `
        <button class="cracker-claim-btn grand-open-btn" onclick="window.openCrackerMegaRewardModal(event)" title="Tap to watch ads for Grand Reward">
          📢 WATCH AD
        </button>
      `;
    } else {
      grandStatusSummary = `🎉 1,000 Ads Done! Ready to claim!`;
      grandActionBtn = `
        <button class="cracker-claim-btn grand-open-btn" onclick="window.openCrackerMegaRewardModal(event)" title="Tap to claim Grand Reward">
          👑 CLAIM
        </button>
      `;
    }

    html += `
      <div class="cracker-row-card cracker-grand-reward-row" id="crackerRow-grand" onclick="window.openCrackerMegaRewardModal(event)" title="Tap to view Level 1000 Grand Reward">
        <div class="cracker-level-badge cracker-grand-badge">
          <span class="badge-letter">👑</span>
          <span class="badge-num">1000</span>
        </div>

        <div class="cracker-row-info">
          <div class="cracker-grand-title-row">
            <span class="cracker-row-title cracker-grand-title">Level 1000 Mega Cracker Boom Prize</span>
            <span class="cracker-grand-pill">GRAND REWARD</span>
          </div>
          <span class="cracker-row-req">Req: Cracker Lv 1000 + Watch 1,000 Ads</span>
          <div class="cracker-row-progress" style="color: #fb923c;">
            ${grandStatusSummary}
          </div>
        </div>

        <div class="cracker-row-rewards-col">
          <div class="cracker-rewards-pill-wrap grand-pills-wrap">
            <span class="cracker-reward-chip diamond">💎 +10</span>
            <span class="cracker-reward-chip gold">🪙 +500</span>
            <span class="cracker-reward-chip darkgreen">🧪 5 DG</span>
            <span class="cracker-reward-chip green">🧪 5 G</span>
            <span class="cracker-reward-chip yellow">🧪 5 Y</span>
            <span class="cracker-reward-chip orange">🧪 5 O</span>
            <span class="cracker-reward-chip energy">⚡ +100</span>
          </div>
          ${grandActionBtn}
        </div>
      </div>
    `;

    listEl.innerHTML = html;
  }

  window.showEarlierCrackerLevels = function() {
    visibleMinLevel = 1;
    renderCrackerLevelsList();
  };

  window.showMoreCrackerLevels = function() {
    visibleMaxLevel = Math.min(1000, visibleMaxLevel + 60);
    renderCrackerLevelsList();
  };

  window.jumpToCrackerLevel1000 = function() {
    visibleMinLevel = 980;
    visibleMaxLevel = 1000;
    renderCrackerLevelsList();
    setTimeout(() => {
      const grandRow = document.getElementById('crackerRow-grand');
      if (grandRow) grandRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  // Helper when clicking "Need X Crackers"
  window.promptNeedCrackers = function(needed) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`🧨 Need ${needed} more Crackers! Spin the Party Wheel to win more!`);
    } else {
      alert(`Need ${needed} more Crackers! Spin the Party Wheel to win more!`);
    }
  };

  // Claim Cracker Level Action
  function handleCrackerLevelClaim(lvl) {
    const cs = ensureCrackerState();
    if (!cs) return;

    const curLvl = cs.currentLevel;
    if (lvl !== curLvl) {
      if (typeof showFloatingToast === 'function') {
        showFloatingToast(`Complete Level ${curLvl} before accessing Level ${lvl}!`);
      }
      return;
    }

    const req = getCrackerLevelRequirement(curLvl);
    const playerCrackers = (typeof gameState !== 'undefined' && gameState.player && gameState.player.dynamiteCoins) || 0;

    if (playerCrackers < req) {
      if (typeof showFloatingToast === 'function') {
        showFloatingToast(`⚠️ Insufficient Crackers! You have ${playerCrackers} 🧨, need ${req} 🧨.`);
      }
      return;
    }

    // Deduct required crackers
    gameState.player.dynamiteCoins -= req;

    // Grant level rewards
    const rewards = getCrackerLevelRewards(curLvl);
    gameState.player.coins = (gameState.player.coins || 0) + rewards.coins;
    gameState.player.xp = (gameState.player.xp || 0) + rewards.xp;
    gameState.player.diamonds = (gameState.player.diamonds || 0) + rewards.diamonds;
    gameState.player.chestKeys = (gameState.player.chestKeys || 0) + rewards.keys;
    gameState.player.scratchCards = (gameState.player.scratchCards || 0) + rewards.cards;
    gameState.player.chestTickets = (gameState.player.chestTickets || 0) + rewards.tickets;

    // Advance Level
    cs.claimedLevels[curLvl] = true;
    if (cs.currentLevel < 1000) {
      cs.currentLevel = curLvl + 1;
    }

    if (typeof recordTaskEvent === 'function') {
      recordTaskEvent('cracker_level_completed', curLvl);
    }

    // Audio & Visual Effects
    if (typeof sfx !== 'undefined' && sfx.playLevelUpSound) {
      sfx.playLevelUpSound();
    } else if (typeof sfx !== 'undefined' && sfx.playBuySound) {
      sfx.playBuySound();
    }

    if (typeof confetti === 'function') {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch (e) {}
    }

    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`💥 CRACKER LEVEL ${curLvl} UPGRADED! +${rewards.coins.toLocaleString()} 🪙 • +${rewards.diamonds} 💎`);
    }

    if (typeof saveGame === 'function') saveGame(true);
    if (typeof updateUI === 'function') updateUI();
    updateCrackerViewUI();
  }

  // Rewarded Ad Boost for +5 Free Crackers
  function watchAdForCrackerBoost() {
    const handleSuccess = () => {
      if (typeof gameState !== 'undefined' && gameState.player) {
        gameState.player.dynamiteCoins = (gameState.player.dynamiteCoins || 0) + 5;
        if (typeof updateUI === 'function') updateUI();
        if (typeof saveGame === 'function') saveGame(true);
      }
      if (typeof sfx !== 'undefined' && sfx.playBuySound) sfx.playBuySound();
      if (typeof showFloatingToast === 'function') {
        showFloatingToast('🎉 +5 Free 🧨 Crackers added to your stash!');
      }
      updateCrackerViewUI();
    };

    if (typeof window.showRewardedAd === 'function') {
      window.showRewardedAd(handleSuccess, {
        adTitle: 'FREE 🧨 CRACKERS BOOST',
        adDesc: 'Watching sponsor video for +5 Free Crackers...'
      });
    } else {
      handleSuccess();
    }
  }

  // Mega Reward Action Handler
  function handleCrackerMegaRewardAction() {
    const cs = ensureCrackerState();
    if (!cs) return;

    const curLvl = cs.currentLevel;
    const isLvl1000Completed = curLvl >= 1000 || !!cs.claimedLevels[1000];

    if (!isLvl1000Completed) {
      if (typeof showFloatingToast === 'function') {
        showFloatingToast(`Complete Cracker Level 1000 first (Current: Level ${curLvl})!`);
      }
      return;
    }

    if (cs.megaRewardClaimed) {
      if (typeof showFloatingToast === 'function') {
        showFloatingToast('✓ You have already claimed the Cracker Mega Reward!');
      }
      return;
    }

    const watchedAds = cs.megaWatchedAds || 0;

    // If still watching ads
    if (watchedAds < 1000) {
      const handleAdSuccess = () => {
        cs.megaWatchedAds = (cs.megaWatchedAds || 0) + 1;
        if (typeof showFloatingToast === 'function') {
          showFloatingToast(`📢 Ad Watched (${cs.megaWatchedAds}/1000) for Mega Reward!`);
        }
        if (typeof saveGame === 'function') saveGame(true);
        updateCrackerViewUI();
      };

      if (typeof window.showRewardedAd === 'function') {
        window.showRewardedAd(handleAdSuccess, {
          adTitle: 'CRACKER MEGA REWARD AD',
          adDesc: `Watching ad ${watchedAds + 1} of 1,000 for the Grand Prize...`
        });
      } else {
        handleAdSuccess();
      }
      return;
    }

    // Claim Grand Prize
    cs.megaRewardClaimed = true;
    if (typeof gameState !== 'undefined') {
      if (!gameState.player) gameState.player = {};
      gameState.player.diamonds = (gameState.player.diamonds || 0) + 10;
      gameState.player.coins = (gameState.player.coins || 0) + 500;

      if (!gameState.energyGenerator) gameState.energyGenerator = { fuelCells: {} };
      if (!gameState.energyGenerator.fuelCells) {
        gameState.energyGenerator.fuelCells = { green: 0, darkgreen: 0, yellow: 0, orange: 0, red: 0, darkred: 0, pink: 0, purple: 0, blue: 0, lightblue: 0 };
      }
      gameState.energyGenerator.fuelCells.darkgreen = (gameState.energyGenerator.fuelCells.darkgreen || 0) + 5;
      gameState.energyGenerator.fuelCells.green = (gameState.energyGenerator.fuelCells.green || 0) + 5;
      gameState.energyGenerator.fuelCells.yellow = (gameState.energyGenerator.fuelCells.yellow || 0) + 5;
      gameState.energyGenerator.fuelCells.orange = (gameState.energyGenerator.fuelCells.orange || 0) + 5;

      if (!gameState.reactor) gameState.reactor = {};
      gameState.reactor.currentEnergy = (gameState.reactor.currentEnergy || 0) + 100;
    }

    if (typeof syncPlayerCurrenciesImmediate === 'function') {
      syncPlayerCurrenciesImmediate();
    }
    if (window.firebaseSync && typeof window.firebaseSync.debouncedSave === 'function') {
      window.firebaseSync.debouncedSave();
    }

    if (typeof confetti === 'function') {
      try {
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.5 }
        });
      } catch (e) {}
    }

    if (typeof sfx !== 'undefined' && sfx.playLevelUpSound) sfx.playLevelUpSound();
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('👑 GRAND CRACKER PRIZE CLAIMED! +10 💎 • +500 🪙 • 5 DG • 5 G • 5 Y • 5 O • +100 ⚡');
    }

    if (typeof saveGame === 'function') saveGame(true);
    if (typeof updateUI === 'function') updateUI();
    updateCrackerViewUI();
  }

  // Master UI Synchronizer for Cracker Page
  function updateCrackerViewUI() {
    const pageEl = document.getElementById('pageCracker');
    if (!pageEl) return;

    const cs = ensureCrackerState();
    const curLvl = cs ? cs.currentLevel : 1;
    const playerCrackers = (typeof gameState !== 'undefined' && gameState.player && gameState.player.dynamiteCoins) || 0;

    // Season Countdown
    const timerEl = document.getElementById('crackerSeasonTimer');
    if (timerEl) {
      const now = Date.now();
      const seasonEnd = (cs && cs.seasonEndMs) || (now + 30 * 86400 * 1000);
      const diffMs = Math.max(0, seasonEnd - now);
      const diffSecs = Math.floor(diffMs / 1000);
      const days = Math.floor(diffSecs / 86400);
      const hours = Math.floor((diffSecs % 86400) / 3600);
      const mins = Math.floor((diffSecs % 3600) / 60);
      const secs = diffSecs % 60;
      timerEl.textContent = `${days}d ${hours}h ${mins}m ${secs}s`;
    }

    // Cracker Balance Header
    const balanceEl = document.getElementById('crackerHeaderBalance');
    if (balanceEl) {
      balanceEl.textContent = playerCrackers.toLocaleString();
    }

    // Top Level Badge Button
    const badgeTextEl = document.getElementById('toggleCrackerBtnText');
    if (badgeTextEl) {
      if (cs && cs.currentSubtab === 'levels') {
        badgeTextEl.textContent = 'MEGA REWARD';
      } else {
        badgeTextEl.textContent = `CRACKER LV. ${curLvl}`;
      }
    }

    // Step 1: Cracker Level 1000 Status (Updates both SubView and Modal)
    const isLvl1000Completed = curLvl >= 1000 || !!(cs && cs.claimedLevels && cs.claimedLevels[1000]);
    [document.getElementById('crackerMegaStep1Badge'), document.getElementById('modalCrackerStep1Badge')].forEach(badge => {
      if (!badge) return;
      if (isLvl1000Completed) {
        badge.textContent = 'COMPLETED';
        badge.className = 'mega-step-badge completed';
      } else {
        badge.textContent = 'LOCKED';
        badge.className = 'mega-step-badge locked';
      }
    });

    [document.getElementById('crackerMegaStep1SubText'), document.getElementById('modalCrackerStep1SubText')].forEach(sub => {
      if (sub) sub.textContent = `Current: Cracker Level ${curLvl} / 1000`;
    });

    [document.getElementById('crackerMegaStep1Lock'), document.getElementById('modalCrackerStep1Lock')].forEach(lock => {
      if (lock) lock.style.display = isLvl1000Completed ? 'none' : 'block';
    });

    // Step 2: 1,000 Ads Progress (Updates both SubView and Modal)
    const watchedAds = (cs && cs.megaWatchedAds) || 0;
    const adsPct = Math.min(100, Math.floor((watchedAds / 1000) * 100));

    [document.getElementById('crackerMegaAdsCounterHeader'), document.getElementById('modalCrackerAdsCounterHeader')].forEach(hdr => {
      if (hdr) hdr.textContent = `${watchedAds} / 1000 Ads (${adsPct}%)`;
    });

    [document.getElementById('crackerMegaAdsProgressFill'), document.getElementById('modalCrackerAdsProgressFill')].forEach(fill => {
      if (fill) fill.style.width = `${adsPct}%`;
    });

    [document.getElementById('crackerMegaAdsRemainText'), document.getElementById('modalCrackerAdsRemainText')].forEach(rem => {
      if (rem) rem.textContent = `${Math.max(0, 1000 - watchedAds)} ads remaining`;
    });

    // Master Mega Action Button State (Updates both SubView and Modal)
    const isClaimed = !!(cs && cs.megaRewardClaimed);
    const actionBtns = [
      { btn: document.getElementById('crackerMegaActionBtn'), text: document.getElementById('crackerMegaActionBtnText'), lock: document.getElementById('crackerMegaActionLockIcon') },
      { btn: document.getElementById('modalCrackerActionBtn'), text: document.getElementById('modalCrackerActionBtnText'), lock: document.getElementById('modalCrackerActionLockIcon') }
    ];

    actionBtns.forEach(({ btn, text, lock }) => {
      if (!btn) return;
      if (!isLvl1000Completed) {
        btn.className = 'mega-action-btn disabled cracker-mega-btn';
        if (text) text.textContent = `REACH CRACKER LEVEL 1000 TO UNLOCK AD WATCHER`;
        if (lock) lock.style.display = 'block';
      } else if (watchedAds < 1000) {
        btn.className = 'mega-action-btn cracker-mega-btn';
        if (text) text.textContent = `WATCH AD (${watchedAds}/1000) FOR CRACKER MEGA REWARD 📢`;
        if (lock) lock.style.display = 'none';
      } else if (!isClaimed) {
        btn.className = 'mega-action-btn claim-ready cracker-mega-btn';
        if (text) text.textContent = `🎉 CLAIM GRAND CRACKER PRIZE (10 💎 • 500 🪙 • 20 FUELS • 100 ⚡) 👑`;
        if (lock) lock.style.display = 'none';
      } else {
        btn.className = 'mega-action-btn claimed cracker-mega-btn';
        if (text) text.textContent = `✓ CRACKER MEGA REWARD CLAIMED`;
        if (lock) lock.style.display = 'none';
      }
    });

    // If currently on levels subtab, refresh list
    if (cs && cs.currentSubtab === 'levels') {
      renderCrackerLevelsList();
    }
  }

  // Modal Open & Close Functions
  function openCrackerMegaRewardModal(e) {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    const modal = document.getElementById('crackerMegaModalOverlay');
    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('open');
      updateCrackerViewUI();
    }
    if (typeof sfx !== 'undefined' && sfx.playTapSound) sfx.playTapSound(1);
  }

  function closeCrackerMegaRewardModal(e) {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    const modal = document.getElementById('crackerMegaModalOverlay');
    if (modal) {
      modal.classList.remove('open');
      modal.style.display = 'none';
    }
    if (typeof sfx !== 'undefined' && sfx.playTapSound) sfx.playTapSound(1);
  }

  // Escape key closes modal
  window.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      const modal = document.getElementById('crackerMegaModalOverlay');
      if (modal && modal.classList.contains('open')) {
        closeCrackerMegaRewardModal();
      }
    }
  });

  // Page Initializer
  function initCrackerPage() {
    ensureCrackerState();
    const cs = ensureCrackerState();
    switchCrackerSubtab((cs && cs.currentSubtab) || 'levels');
    updateCrackerViewUI();
  }

  // Global Window Exports
  window.initCrackerPage = initCrackerPage;
  window.updateCrackerViewUI = updateCrackerViewUI;
  window.switchCrackerSubtab = switchCrackerSubtab;
  window.toggleCrackerSubView = toggleCrackerSubView;
  window.handleCrackerLevelClaim = handleCrackerLevelClaim;
  window.watchAdForCrackerBoost = watchAdForCrackerBoost;
  window.handleCrackerMegaRewardAction = handleCrackerMegaRewardAction;
  window.getCrackerLevelRequirement = getCrackerLevelRequirement;
  window.getCrackerLevelRewards = getCrackerLevelRewards;
  window.openCrackerMegaRewardModal = openCrackerMegaRewardModal;
  window.closeCrackerMegaRewardModal = closeCrackerMegaRewardModal;

})();
