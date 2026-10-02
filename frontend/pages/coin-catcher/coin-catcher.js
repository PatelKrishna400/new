/**
 * Coin Fall Catcher Mini-Game (pages/coin-catcher/coin-catcher.js)
 * 
 * Rules & Mechanics:
 * - 100 Diamonds Entry Cost paid to play.
 * - Coins (🪙) and Booms (💣) fall from top to bottom.
 * - Tapping a coin collects it into the run's bank.
 * - Falling speed is randomized and progressively accelerates as playing time increases.
 * - Tapping a 💣 Boom detonates: shows "Try Again / Resume" modal offering a Rewarded Ad to resume and keep coins, OR exit and forfeit coins.
 * - Prominent "COLLECT & EXIT" button below the stage allows the player to safely cash out their coin bank at any time.
 * - Option on collection to watch a rewarded ad to 2X Double the collected coins.
 */

(function() {
  'use strict';

  let isGameActive = false;
  let isBoomPaused = false;
  let animFrameId = null;
  let timerInterval = null;
  let lastFrameTime = 0;

  // Gameplay Run State
  let elapsedSeconds = 0;
  let bankedCoins = 0;
  let speedMultiplier = 1.0;
  let activeItems = [];
  let nextSpawnTime = 0;

  // DOM Elements Cache
  let elStage = null;
  let elTime = null;
  let elScore = null;
  let elSpeed = null;
  let elBoomCoinPillVal = null;
  let elIntroBoomBal = null;
  let elCollectBtn = null;
  let elCollectBtnText = null;
  let elOverlay = null;
  let elBoomModal = null;
  let elStartOverlay = null;

  function initDOMElements() {
    elStage = document.getElementById('catcherStage');
    elTime = document.getElementById('catcherTimeVal');
    elScore = document.getElementById('catcherScoreVal');
    elSpeed = document.getElementById('catcherSpeedVal');
    elBoomCoinPillVal = document.getElementById('catcherPlayerBoomCoinsVal');
    elIntroBoomBal = document.getElementById('catcherIntroBoomBal');
    elCollectBtn = document.getElementById('btnCatcherCollectBank');
    elCollectBtnText = document.getElementById('catcherCollectBtnText');
    elOverlay = document.getElementById('catcherModalOverlay');
    elBoomModal = document.getElementById('catcherBoomModal');
    elStartOverlay = document.getElementById('catcherStartOverlay');

    updateBoomCoinBalances();
  }

  function updateBoomCoinBalances() {
    const boomCoins = (typeof gameState !== 'undefined' && gameState.player && gameState.player.boomCoins !== undefined)
      ? Number(gameState.player.boomCoins)
      : 0;

    if (elBoomCoinPillVal) elBoomCoinPillVal.textContent = boomCoins.toLocaleString();
    if (elIntroBoomBal) elIntroBoomBal.textContent = boomCoins.toLocaleString();
  }

  function updateHUD() {
    if (elTime) elTime.textContent = `${elapsedSeconds}s`;
    if (elScore) elScore.textContent = bankedCoins.toLocaleString();
    if (elSpeed) elSpeed.textContent = `${speedMultiplier.toFixed(1)}x`;

    if (elCollectBtn) {
      if (bankedCoins > 0 && (isGameActive || isBoomPaused)) {
        elCollectBtn.disabled = false;
        elCollectBtn.classList.add('has-bounty');
        if (elCollectBtnText) {
          elCollectBtnText.textContent = `COLLECT ${bankedCoins.toLocaleString()} COINS & EXIT`;
        }
      } else {
        elCollectBtn.disabled = true;
        elCollectBtn.classList.remove('has-bounty');
        if (elCollectBtnText) {
          elCollectBtnText.textContent = 'COLLECT & EXIT (0 🪙)';
        }
      }
    }
  }

  /**
   * Start a New Coin Fall Round (Costs 1 Boom Coin)
   */
  function startCoinCatcherGame() {
    initDOMElements();

    const currentBoomCoins = (typeof gameState !== 'undefined' && gameState.player && gameState.player.boomCoins !== undefined)
      ? Number(gameState.player.boomCoins)
      : 0;

    // Check if player has 1 Boom Coin
    if (currentBoomCoins < 1) {
      if (typeof sfx !== 'undefined' && sfx.playErrorSound) sfx.playErrorSound();
      if (typeof showGameEntryRequirementModal === 'function') {
        showGameEntryRequirementModal('1 Boom Coin', '💣', 'Coin Fall Catcher');
      } else if (typeof showFloatingToast === 'function') {
        showFloatingToast('⚠️ Insufficient Boom Coins! 1 💣 required to play.');
      }
      return;
    }

    // Deduct 1 Boom Coin
    gameState.player.boomCoins -= 1;
    if (typeof saveGame === 'function') saveGame(true);
    if (typeof updateUI === 'function') updateUI();
    updateBoomCoinBalances();

    if (typeof sfx !== 'undefined' && sfx.playBuySound) sfx.playBuySound();
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('💣 -1 Boom Coin paid! Round Started!');
    }

    // Clean up any ongoing session
    cancelAnimationFrame(animFrameId);
    clearInterval(timerInterval);

    if (elStage) {
      const oldItems = elStage.querySelectorAll('.falling-item, .catcher-score-pop');
      oldItems.forEach(el => el.remove());
    }

    // Reset Run State
    isGameActive = true;
    isBoomPaused = false;
    elapsedSeconds = 0;
    bankedCoins = 0;
    speedMultiplier = 1.0;
    activeItems = [];
    nextSpawnTime = Date.now() + 250;

    if (elStartOverlay) elStartOverlay.style.display = 'none';
    if (elOverlay) elOverlay.classList.remove('open');
    if (elBoomModal) elBoomModal.classList.remove('open');

    updateHUD();

    // Start Elapsed Playing Time Loop (increases fall speed dynamically)
    timerInterval = setInterval(() => {
      if (!isGameActive || isBoomPaused) return;
      elapsedSeconds++;
      // Fall speed increases smoothly over time (+4% per second)
      speedMultiplier = Number((1.0 + (elapsedSeconds * 0.04)).toFixed(2));
      updateHUD();
    }, 1000);

    // Start Animation Loop
    lastFrameTime = performance.now();
    animFrameId = requestAnimationFrame(gameLoop);
  }

  /**
   * Main Physics & Animation Loop
   */
  function gameLoop(now) {
    if (!isGameActive || isBoomPaused) return;

    if (!elStage || !elStage.isConnected || elStage.offsetParent === null) {
      cancelAnimationFrame(animFrameId);
      isGameActive = false;
      return;
    }

    const dt = Math.min(0.05, (now - lastFrameTime) / 1000);
    lastFrameTime = now;

    // Spawn new falling items
    if (Date.now() >= nextSpawnTime) {
      spawnFallingItem();
      // Spawn interval accelerates slightly as time increases (between 250ms and 500ms)
      const baseDelay = Math.max(260, 480 - (elapsedSeconds * 5));
      nextSpawnTime = Date.now() + Math.floor(baseDelay + Math.random() * 200);
    }

    // Update active falling items
    const stageHeight = elStage.clientHeight || 440;
    for (let i = activeItems.length - 1; i >= 0; i--) {
      const item = activeItems[i];
      item.y += item.speed * (dt * 60);
      item.el.style.top = `${item.y}px`;

      // Item passed below the stage
      if (item.y > stageHeight + 45) {
        if (item.el.parentNode) item.el.parentNode.removeChild(item.el);
        activeItems.splice(i, 1);
      }
    }

    animFrameId = requestAnimationFrame(gameLoop);
  }

  /**
   * Spawn a Falling Item: Only Coin (🪙) and Boom/Bomb (💣)
   */
  function spawnFallingItem() {
    if (!elStage) return;

    const stageWidth = elStage.clientWidth || 320;
    const isBomb = Math.random() < 0.32; // ~68% Coins, ~32% Booms

    let type = 'coin';
    let icon = '🪙';
    let className = 'coin-gold';

    // Base speed is randomized, then multiplied by elapsed time speed multiplier
    const baseRandomSpeed = 1.9 + Math.random() * 1.6;
    let speed = baseRandomSpeed * speedMultiplier;

    if (isBomb) {
      type = 'bomb';
      icon = '💣';
      className = 'bomb-hazard';
      speed += 0.3;
    }

    const x = 32 + Math.random() * Math.max(120, stageWidth - 64);
    const itemEl = document.createElement('div');
    itemEl.className = `falling-item ${className}`;
    itemEl.textContent = icon;
    itemEl.style.left = `${x}px`;
    itemEl.style.top = `-35px`;

    const itemObj = {
      el: itemEl,
      type: type,
      x: x,
      y: -35,
      speed: speed
    };

    // Tap / Click Handler
    const tapHandler = (e) => {
      e.stopPropagation();
      e.preventDefault();
      handleItemTap(itemObj);
    };

    itemEl.addEventListener('touchstart', tapHandler, { passive: false });
    itemEl.addEventListener('mousedown', tapHandler);

    elStage.appendChild(itemEl);
    activeItems.push(itemObj);
  }

  /**
   * Handle Player Tap on a Falling Item
   */
  function handleItemTap(item) {
    if (!isGameActive || isBoomPaused) return;

    // Remove tapped item from active pool
    const idx = activeItems.indexOf(item);
    if (idx !== -1) activeItems.splice(idx, 1);
    if (item.el.parentNode) item.el.parentNode.removeChild(item.el);

    if (item.type === 'bomb') {
      // 💣 BOOM DETONATED!
      handleBoomDetonated(item.x, item.y);
    } else {
      // 🪙 COIN COLLECTED!
      const earned = Math.round(10 * Math.min(2.5, 1.0 + (elapsedSeconds * 0.015)));
      bankedCoins += earned;

      spawnScorePopup(item.x, item.y, `+${earned} 🪙`, 'gold');
      if (typeof sfx !== 'undefined' && sfx.playTapSound) sfx.playTapSound(1);

      updateHUD();
    }
  }

  /**
   * Boom Hazard Hit: Pause Game & Show Try Again Modal
   */
  function handleBoomDetonated(x, y) {
    isBoomPaused = true;
    isGameActive = false;
    cancelAnimationFrame(animFrameId);
    clearInterval(timerInterval);

    // Screen Shake & Bomb Audio
    if (elStage) {
      elStage.classList.remove('shake');
      void elStage.offsetWidth; // trigger reflow
      elStage.classList.add('shake');
    }
    if (typeof sfx !== 'undefined' && sfx.playBombSound) sfx.playBombSound();

    spawnScorePopup(x, y, 'BOOM! 💥', 'bomb');

    // Populate and open Boom Modal
    const bankedTextEl = document.getElementById('catcherBoomBankedText');
    const resumeCoinsEl = document.getElementById('catcherBoomResumeCoins');
    if (bankedTextEl) bankedTextEl.textContent = `${bankedCoins.toLocaleString()} 🪙`;
    if (resumeCoinsEl) resumeCoinsEl.textContent = bankedCoins.toLocaleString();

    if (elBoomModal) {
      elBoomModal.classList.add('open');
    }
  }

  /**
   * Boom Modal Option 1: Watch Ad to Resume Game & Keep Banked Coins
   */
  function resumeAfterBombAd() {
    const handleAdSuccess = () => {
      if (elBoomModal) elBoomModal.classList.remove('open');

      // Clear all existing bombs from stage to give player a clean resume
      for (let i = activeItems.length - 1; i >= 0; i--) {
        if (activeItems[i].type === 'bomb') {
          if (activeItems[i].el.parentNode) activeItems[i].el.parentNode.removeChild(activeItems[i].el);
          activeItems.splice(i, 1);
        }
      }

      isBoomPaused = false;
      isGameActive = true;

      // Resume timer
      timerInterval = setInterval(() => {
        if (!isGameActive || isBoomPaused) return;
        elapsedSeconds++;
        speedMultiplier = Number((1.0 + (elapsedSeconds * 0.04)).toFixed(2));
        updateHUD();
      }, 1000);

      // Resume animation loop
      lastFrameTime = performance.now();
      animFrameId = requestAnimationFrame(gameLoop);

      if (typeof sfx !== 'undefined' && sfx.playLevelUpSound) sfx.playLevelUpSound();
      if (typeof showFloatingToast === 'function') {
        showFloatingToast(`✨ Revived! Game resumed with ${bankedCoins.toLocaleString()} 🪙!`);
      }
    };

    if (typeof window.showRewardedAd === 'function') {
      window.showRewardedAd(handleAdSuccess, {
        adTitle: 'REVIVE COIN FALL RUN',
        adDesc: 'Watching sponsored video to resume game and protect your coins...'
      });
    } else {
      handleAdSuccess();
    }
  }

  /**
   * Boom Modal Option 2: Exit & Forfeit Coins (Coins are NOT collected)
   */
  function exitAndForfeitCoins() {
    if (elBoomModal) elBoomModal.classList.remove('open');

    // Coins are not collected
    bankedCoins = 0;
    isGameActive = false;
    isBoomPaused = false;
    cancelAnimationFrame(animFrameId);
    clearInterval(timerInterval);

    // Clear falling items
    if (elStage) {
      const oldItems = elStage.querySelectorAll('.falling-item, .catcher-score-pop');
      oldItems.forEach(el => el.remove());
    }
    activeItems = [];

    if (typeof showFloatingToast === 'function') {
      showFloatingToast('💥 Bomb Detonated! Coins were forfeited.');
    }

    updateHUD();
    updateDiamondBalances();

    // Show Start Overlay for next run
    if (elStartOverlay) elStartOverlay.style.display = 'flex';
  }

  /**
   * Prominent Below-the-Page "COLLECT & EXIT" Button Handler
   */
  function collectAndExitCoinCatcher() {
    if (bankedCoins <= 0) {
      if (typeof showFloatingToast === 'function') {
        showFloatingToast('⚠️ No coins in bank yet! Tap coins to bank them.');
      }
      return;
    }

    // Stop active gameplay safely
    isGameActive = false;
    isBoomPaused = false;
    cancelAnimationFrame(animFrameId);
    clearInterval(timerInterval);

    // Clear active items
    if (elStage) {
      const oldItems = elStage.querySelectorAll('.falling-item, .catcher-score-pop');
      oldItems.forEach(el => el.remove());
    }
    activeItems = [];

    // Populate Victory / Bounty Modal
    const statCoinsEl = document.getElementById('catcherStatCoins');
    const statTimeEl = document.getElementById('catcherStatTime');
    const statSpeedEl = document.getElementById('catcherStatSpeed');
    const statRewardEl = document.getElementById('catcherStatReward');

    if (statCoinsEl) statCoinsEl.textContent = `${bankedCoins.toLocaleString()} 🪙`;
    if (statTimeEl) statTimeEl.textContent = `${elapsedSeconds}s`;
    if (statSpeedEl) statSpeedEl.textContent = `${speedMultiplier.toFixed(1)}x`;
    if (statRewardEl) statRewardEl.textContent = `+${bankedCoins.toLocaleString()} Coins 🪙`;

    if (typeof sfx !== 'undefined' && sfx.playLevelUpSound) sfx.playLevelUpSound();
    if (elOverlay) elOverlay.classList.add('open');
  }

  /**
   * Claim Banked Coins (Optionally 2X Double with Rewarded Ad)
   */
  async function claimCoinCatcherReward(watchDoubleAd = false) {
    if (bankedCoins <= 0) {
      if (elOverlay) elOverlay.classList.remove('open');
      if (elStartOverlay) elStartOverlay.style.display = 'flex';
      return;
    }

    const processRewardPayout = (multiplier = 1) => {
      const finalCoins = Math.round(bankedCoins * multiplier);

      // Req 13: 0.0001% (1 in 1,000,000) Diamond Jackpot chance
      if (typeof rollDiamondJackpot === 'function') {
        rollDiamondJackpot('coin_catcher');
      }

      if (typeof gameState !== 'undefined') {
        gameState.player.coins = (gameState.player.coins || 0) + finalCoins;
        if (!gameState.player.miniGamesPlayed) gameState.player.miniGamesPlayed = 0;
        gameState.player.miniGamesPlayed++;

        if (typeof updateUI === 'function') updateUI();
        if (typeof saveGame === 'function') saveGame(true);
      }

      if (typeof sfx !== 'undefined' && sfx.playBuySound) sfx.playBuySound();

      if (typeof showFloatingToast === 'function') {
        if (multiplier > 1) {
          showFloatingToast(`🔥 2X BONUS! +${finalCoins.toLocaleString()} Coins added to your bank!`);
        } else {
          showFloatingToast(`🎉 +${finalCoins.toLocaleString()} Coins safely deposited to your vault!`);
        }
      }

      if (elOverlay) elOverlay.classList.remove('open');
      bankedCoins = 0;
      updateHUD();
      updateBoomCoinBalances();

      if (elStartOverlay) elStartOverlay.style.display = 'flex';
    };

    if (watchDoubleAd) {
      if (typeof window.showRewardedAd === 'function') {
        window.showRewardedAd(() => {
          processRewardPayout(2);
        }, {
          adTitle: '2X COIN MULTIPLIER',
          adDesc: 'Watching sponsored video to double your earned coin bounty...'
        });
      } else {
        processRewardPayout(2);
      }
    } else {
      processRewardPayout(1);
    }
  }

  /**
   * Floating Score Text on Tap (+10 🪙 or BOOM!)
   */
  function spawnScorePopup(x, y, text, colorClass) {
    if (!elStage) return;
    const pop = document.createElement('div');
    pop.className = `catcher-score-pop ${colorClass}`;
    pop.textContent = text;
    pop.style.left = `${x}px`;
    pop.style.top = `${y}px`;
    elStage.appendChild(pop);

    setTimeout(() => {
      if (pop.parentNode) pop.parentNode.removeChild(pop);
    }, 600);
  }

  /**
   * Free Boom Coin from Rewarded Ad
   */
  function claimFreeBoomCoinAd() {
    const grantCoin = () => {
      if (!gameState.player) return;
      gameState.player.boomCoins = (Number(gameState.player.boomCoins) || 0) + 1;
      if (typeof saveGame === 'function') saveGame(true);
      if (typeof updateUI === 'function') updateUI();
      updateBoomCoinBalances();
      if (typeof sfx !== 'undefined' && sfx.playBuySound) sfx.playBuySound();
      if (typeof showFloatingToast === 'function') {
        showFloatingToast('🎉 +1 💣 Boom Coin added to your inventory!');
      }
    };

    if (typeof window.showRewardedAd === 'function') {
      window.showRewardedAd(grantCoin, {
        adTitle: 'FREE 💣 BOOM COIN',
        adDesc: 'Watch a quick message to receive 1 Free Boom Coin!'
      });
    } else {
      grantCoin();
    }
  }

  // Global Window Exports
  window.startCoinCatcherGame = startCoinCatcherGame;
  window.collectAndExitCoinCatcher = collectAndExitCoinCatcher;
  window.claimCoinCatcherReward = claimCoinCatcherReward;
  window.resumeAfterBombAd = resumeAfterBombAd;
  window.exitAndForfeitCoins = exitAndForfeitCoins;
  window.claimFreeBoomCoinAd = claimFreeBoomCoinAd;
  window.updateBoomCoinBalances = updateBoomCoinBalances;

  window.initCoinCatcherPage = function() {
    initDOMElements();
    if (!isGameActive && elStartOverlay) {
      elStartOverlay.style.display = 'flex';
    }
    updateBoomCoinBalances();
    updateHUD();
  };
})();
