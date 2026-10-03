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

  // Milestone Targets progression: 20, 70, 130, 180... Each reached awards exactly +1 🧩 piece
  const PUZZLE_MILESTONES = [20, 70, 130, 180, 240, 310, 390, 480, 580, 700];

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

  // Puzzle HUD Elements Cache
  let elPuzzleProgressText = null;
  let elPuzzleProgressBarFill = null;
  let elPuzzleMilestoneSubText = null;
  let elCatcherPuzzlePiecesBadge = null;
  let elCafePieceCounter = null;
  let elCafeFooterPieces = null;
  let elCafeRevealedRatio = null;

  // Morning Cafe Ad & Audio State
  let cafeAudioCtx = null;
  let activeCafeAdTarget = null;
  let cafeAdCountdownInterval = null;
  let cafeAdRemainingSeconds = 5;

  function ensurePuzzleState() {
    if (typeof gameState === 'undefined') return { caughtFragments: 0, currentMilestoneIndex: 0, puzzlePieces: 0, tiles: Array(9).fill(false) };
    if (!gameState.puzzleState) {
      gameState.puzzleState = {
        caughtFragments: 0,
        currentMilestoneIndex: 0,
        puzzlePieces: 0,
        tiles: [false, false, false, false, false, false, false, false, false]
      };
    }
    if (!Array.isArray(gameState.puzzleState.tiles) || gameState.puzzleState.tiles.length !== 9) {
      gameState.puzzleState.tiles = [false, false, false, false, false, false, false, false, false];
    }
    if (gameState.puzzleState.caughtFragments === undefined) gameState.puzzleState.caughtFragments = 0;
    if (gameState.puzzleState.currentMilestoneIndex === undefined) gameState.puzzleState.currentMilestoneIndex = 0;
    if (gameState.puzzleState.puzzlePieces === undefined) gameState.puzzleState.puzzlePieces = 0;
    return gameState.puzzleState;
  }

  function getPuzzleCurrentTarget(idx) {
    if (idx < PUZZLE_MILESTONES.length) return PUZZLE_MILESTONES[idx];
    // Dynamic formula beyond 700: +110, +120, +130...
    const lastTarget = PUZZLE_MILESTONES[PUZZLE_MILESTONES.length - 1];
    const extraSteps = idx - (PUZZLE_MILESTONES.length - 1);
    return lastTarget + (extraSteps * 120);
  }

  function getPuzzlePreviousTarget(idx) {
    if (idx <= 0) return 0;
    return getPuzzleCurrentTarget(idx - 1);
  }

  function updatePuzzleHUD() {
    const ps = ensurePuzzleState();
    const currTarget = getPuzzleCurrentTarget(ps.currentMilestoneIndex);
    const prevTarget = getPuzzlePreviousTarget(ps.currentMilestoneIndex);

    const neededInMilestone = Math.max(1, currTarget - prevTarget);
    const progressInMilestone = Math.max(0, Math.min(neededInMilestone, ps.caughtFragments - prevTarget));
    const pct = Math.min(100, Math.max(0, (progressInMilestone / neededInMilestone) * 100));

    if (elPuzzleProgressText) {
      elPuzzleProgressText.textContent = `${ps.caughtFragments} / ${currTarget} 🧩`;
    }
    if (elPuzzleProgressBarFill) {
      elPuzzleProgressBarFill.style.width = `${pct}%`;
    }
    if (elPuzzleMilestoneSubText) {
      elPuzzleMilestoneSubText.textContent = `Target: ${currTarget} 🧩 • Win +1 Piece to unlock Morning Café tiles!`;
    }
    if (elCatcherPuzzlePiecesBadge) {
      elCatcherPuzzlePiecesBadge.textContent = String(ps.puzzlePieces);
    }
    if (elCafePieceCounter) {
      elCafePieceCounter.textContent = String(ps.puzzlePieces);
    }
    if (elCafeFooterPieces) {
      elCafeFooterPieces.textContent = `${ps.puzzlePieces} 🧩`;
    }

    const revealedCount = ps.tiles.filter(Boolean).length;
    if (elCafeRevealedRatio) {
      elCafeRevealedRatio.textContent = `${revealedCount} / 9`;
    }
  }

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

    // Puzzle Elements
    elPuzzleProgressText = document.getElementById('puzzleProgressText');
    elPuzzleProgressBarFill = document.getElementById('puzzleProgressBarFill');
    elPuzzleMilestoneSubText = document.getElementById('puzzleMilestoneSubText');
    elCatcherPuzzlePiecesBadge = document.getElementById('catcherPuzzlePiecesBadge');
    elCafePieceCounter = document.getElementById('cafe-piece-counter');
    elCafeFooterPieces = document.getElementById('cafe-footer-pieces');
    elCafeRevealedRatio = document.getElementById('cafe-revealed-ratio');

    updateBoomCoinBalances();
    updatePuzzleHUD();
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

    updatePuzzleHUD();
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
   * Spawn a Falling Item: Coin (🪙), Boom/Bomb (💣), or Fast-Falling Puzzle Fragment (🧩)
   */
  function spawnFallingItem() {
    if (!elStage) return;

    const stageWidth = elStage.clientWidth || 320;
    const rand = Math.random();

    let type = 'coin';
    let icon = '🪙';
    let className = 'coin-gold';

    // Base speed is randomized, then multiplied by elapsed time speed multiplier
    const baseRandomSpeed = 1.9 + Math.random() * 1.6;
    let speed = baseRandomSpeed * speedMultiplier;

    if (rand < 0.22) {
      // 🧩 FAST-FALLING PUZZLE FRAGMENT (Falls at fast speed as requested)
      type = 'puzzle';
      icon = '🧩';
      className = 'puzzle-fragment-fast';
      speed = (baseRandomSpeed * 1.85 + 1.6) * speedMultiplier;
    } else if (rand < 0.48) {
      // 💣 BOOM HAZARD (~26% Booms)
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
    } else if (item.type === 'puzzle') {
      // 🧩 FAST PUZZLE FRAGMENT COLLECTED!
      handlePuzzleFragmentCollected(item.x, item.y);
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
   * Puzzle Fragment Collected: Update fragments & check milestone targets (20, 70, 130, 180...)
   * When target completed -> exactly +1 puzzle piece awarded!
   */
  function handlePuzzleFragmentCollected(x, y) {
    const ps = ensurePuzzleState();
    ps.caughtFragments += 1;

    let target = getPuzzleCurrentTarget(ps.currentMilestoneIndex);
    let pieceAwarded = false;

    // Check if target reached
    if (ps.caughtFragments >= target) {
      ps.puzzlePieces += 1;
      ps.currentMilestoneIndex += 1;
      pieceAwarded = true;
    }

    if (typeof saveGame === 'function') saveGame(true);

    if (pieceAwarded) {
      spawnScorePopup(x, y, `🎯 TARGET MET! +1 🧩`, 'puzzle');
      playCafeVictoryChime();
      if (typeof showFloatingToast === 'function') {
        showFloatingToast(`🎉 Target ${target} 🧩 Reached! +1 Puzzle Piece awarded!`);
      }
    } else {
      spawnScorePopup(x, y, `+1 🧩 (${ps.caughtFragments}/${target})`, 'puzzle');
      playCafePopSound();
    }

    updatePuzzleHUD();
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

  /**
   * ==========================================================================
   * MORNING CAFÉ 2D PUZZLE GAME ENGINE
   * ==========================================================================
   */
  function initCafeAudio() {
    if (!cafeAudioCtx) {
      cafeAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  function playCafePopSound() {
    try {
      initCafeAudio();
      const osc = cafeAudioCtx.createOscillator();
      const gain = cafeAudioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, cafeAudioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, cafeAudioCtx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.3, cafeAudioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, cafeAudioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(cafeAudioCtx.destination);
      osc.start();
      osc.stop(cafeAudioCtx.currentTime + 0.13);
    } catch (e) {}
  }

  function playCafeCoinChime() {
    try {
      initCafeAudio();
      const osc1 = cafeAudioCtx.createOscillator();
      const osc2 = cafeAudioCtx.createOscillator();
      const gain = cafeAudioCtx.createGain();
      osc1.type = 'triangle';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(987.77, cafeAudioCtx.currentTime);
      osc2.frequency.setValueAtTime(1318.51, cafeAudioCtx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.25, cafeAudioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, cafeAudioCtx.currentTime + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(cafeAudioCtx.destination);
      osc1.start();
      osc2.start(cafeAudioCtx.currentTime + 0.08);
      osc1.stop(cafeAudioCtx.currentTime + 0.35);
      osc2.stop(cafeAudioCtx.currentTime + 0.35);
    } catch (e) {}
  }

  function playCafeVictoryChime() {
    try {
      initCafeAudio();
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          if (!cafeAudioCtx) return;
          const osc = cafeAudioCtx.createOscillator();
          const gain = cafeAudioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.25, cafeAudioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, cafeAudioCtx.currentTime + 0.4);
          osc.connect(gain);
          gain.connect(cafeAudioCtx.destination);
          osc.start();
          osc.stop(cafeAudioCtx.currentTime + 0.45);
        }, idx * 90);
      });
    } catch (e) {}
  }

  function playCafeThump() {
    try {
      initCafeAudio();
      const osc = cafeAudioCtx.createOscillator();
      const gain = cafeAudioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, cafeAudioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(75, cafeAudioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, cafeAudioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, cafeAudioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(cafeAudioCtx.destination);
      osc.start();
      osc.stop(cafeAudioCtx.currentTime + 0.16);
    } catch (e) {}
  }

  const COLS = 3;
  const ROWS = 3;
  const CELL_W = 120; // 360 / 3
  const CELL_H = 120; // 360 / 3

  // 3x3 Tile layout definition
  const TILE_DEFINITIONS = [
    { id: 0, col: 0, row: 0, type: 'PIECE', cost: 1 },
    { id: 1, col: 1, row: 0, type: 'AD',    cost: 0 },
    { id: 2, col: 2, row: 0, type: 'PIECE', cost: 1 },
    { id: 3, col: 0, row: 1, type: 'AD',    cost: 0 },
    { id: 4, col: 1, row: 1, type: 'PIECE', cost: 1 },
    { id: 5, col: 2, row: 1, type: 'AD',    cost: 0 },
    { id: 6, col: 0, row: 2, type: 'PIECE', cost: 1 },
    { id: 7, col: 1, row: 2, type: 'AD',    cost: 0 },
    { id: 8, col: 2, row: 2, type: 'PIECE', cost: 1 }
  ];

  // Mathematical symmetric jigsaw edge curve
  function makeJigsawEdgePath(p1, p2, dir) {
    if (dir === 0) {
      return ` L ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
    }

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const L = Math.hypot(dx, dy);
    const ux = dx / L;
    const uy = dy / L;
    const nx = -uy;
    const ny = ux;

    const toPt = (u, v) => {
      const x = p1.x + u * ux + v * dir * nx;
      const y = p1.y + u * uy + v * dir * ny;
      return `${x.toFixed(2)} ${y.toFixed(2)}`;
    };

    return ` L ${toPt(38, 0)} ` +
           `C ${toPt(43, 0)}, ${toPt(46, -2)}, ${toPt(46, 3)} ` +
           `C ${toPt(46, 8)}, ${toPt(38, 14)}, ${toPt(42, 21)} ` +
           `C ${toPt(46, 26)}, ${toPt(53, 26)}, ${toPt(60, 26)} ` +
           `C ${toPt(67, 26)}, ${toPt(74, 26)}, ${toPt(78, 21)} ` +
           `C ${toPt(82, 14)}, ${toPt(74, 8)}, ${toPt(74, 3)} ` +
           `C ${toPt(74, -2)}, ${toPt(77, 0)}, ${toPt(82, 0)} ` +
           `L ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  const V_SEAMS = [
    [1, -1],
    [-1, 1],
    [1, -1]
  ];

  const H_SEAMS = [
    [1, -1, 1],
    [-1, 1, -1]
  ];

  function buildPiecePath(c, r) {
    const x0 = c * CELL_W;
    const y0 = r * CELL_H;
    const x1 = (c + 1) * CELL_W;
    const y1 = (r + 1) * CELL_H;

    const p00 = { x: x0, y: y0 };
    const p10 = { x: x1, y: y0 };
    const p11 = { x: x1, y: y1 };
    const p01 = { x: x0, y: y1 };

    let d = `M ${p00.x.toFixed(2)} ${p00.y.toFixed(2)}`;

    // 1. TOP EDGE
    if (r === 0) {
      d += ` L ${p10.x.toFixed(2)} ${p10.y.toFixed(2)}`;
    } else {
      const dir = -H_SEAMS[r - 1][c];
      d += makeJigsawEdgePath(p00, p10, dir);
    }

    // 2. RIGHT EDGE
    if (c === COLS - 1) {
      d += ` L ${p11.x.toFixed(2)} ${p11.y.toFixed(2)}`;
    } else {
      const dir = -V_SEAMS[r][c];
      d += makeJigsawEdgePath(p10, p11, dir);
    }

    // 3. BOTTOM EDGE
    if (r === ROWS - 1) {
      d += ` L ${p01.x.toFixed(2)} ${p01.y.toFixed(2)}`;
    } else {
      const dir = H_SEAMS[r][c];
      d += makeJigsawEdgePath(p11, p01, dir);
    }

    // 4. LEFT EDGE
    if (c === 0) {
      d += ` L ${p00.x.toFixed(2)} ${p00.y.toFixed(2)}`;
    } else {
      const dir = V_SEAMS[r][c - 1];
      d += makeJigsawEdgePath(p01, p00, dir);
    }

    d += ' Z';
    return d;
  }

  function renderCafeBoard() {
    const container = document.getElementById('cafe-puzzle-pieces-container');
    if (!container) return;
    container.innerHTML = '';

    const ps = ensurePuzzleState();
    updatePuzzleHUD();

    TILE_DEFINITIONS.forEach((tileDef) => {
      const isRevealed = !!ps.tiles[tileDef.id];
      if (isRevealed) return;

      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.id = `cafe-piece-group-${tileDef.id}`;
      group.setAttribute('class', 'puzzle-piece-group');

      // Draw seamless interlocking jigsaw piece
      const pathData = buildPiecePath(tileDef.col, tileDef.row);
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('class', 'piece-body');
      path.setAttribute('d', pathData);
      path.setAttribute('fill', 'url(#cafePiecePinkGrad)');
      path.setAttribute('stroke', '#991b3b');
      path.setAttribute('stroke-width', '3');
      path.setAttribute('stroke-linejoin', 'round');
      path.setAttribute('stroke-linecap', 'round');
      group.appendChild(path);

      // Center badge for ADS or PIECE
      const centerX = tileDef.col * CELL_W + CELL_W / 2;
      const centerY = tileDef.row * CELL_H + CELL_H / 2;
      const badgeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      badgeGroup.setAttribute('transform', `translate(${centerX}, ${centerY})`);
      badgeGroup.setAttribute('pointer-events', 'none');

      if (tileDef.type === 'AD') {
        badgeGroup.innerHTML = `
          <rect x="-24" y="-15" width="48" height="30" rx="9" fill="#580822" />
          <rect x="-24" y="-17" width="48" height="30" rx="9" fill="#e11d48" stroke="#881337" stroke-width="2" />
          <text x="0" y="5" font-size="18" text-anchor="middle">📺</text>
        `;
      } else {
        badgeGroup.innerHTML = `
          <rect x="-29" y="-15" width="58" height="30" rx="9" fill="#78350f" />
          <rect x="-29" y="-17" width="58" height="30" rx="9" fill="#fbbf24" stroke="#92400e" stroke-width="2" />
          <text x="-11" y="4" font-size="17" text-anchor="middle">🧩</text>
          <text x="12" y="5" font-family="'Fredoka One', cursive" font-size="18" fill="#451a03" text-anchor="middle">1</text>
        `;
      }

      group.appendChild(badgeGroup);
      group.onclick = () => handleCafeTileClick(tileDef);
      container.appendChild(group);
    });
  }

  function handleCafeTileClick(tileDef) {
    const ps = ensurePuzzleState();
    if (ps.tiles[tileDef.id]) return;

    if (tileDef.type === 'AD') {
      startCafeAdRewardSequence(tileDef.id);
    } else {
      if (ps.puzzlePieces >= 1) {
        ps.puzzlePieces -= 1;
        if (typeof saveGame === 'function') saveGame(true);
        playCafePopSound();
        popCafeTile(tileDef.id);
      } else {
        playCafeThump();
        openCafeSubModal('cafe-pieces-prompt-modal');
      }
    }
  }

  function popCafeTile(tileId) {
    const ps = ensurePuzzleState();
    if (ps.tiles[tileId]) return;

    ps.tiles[tileId] = true;
    if (typeof saveGame === 'function') saveGame(true);

    const el = document.getElementById(`cafe-piece-group-${tileId}`);
    if (el) {
      el.classList.add('piece-popping');
      setTimeout(() => {
        renderCafeBoard();
        checkCafeWinCondition();
      }, 360);
    } else {
      renderCafeBoard();
      checkCafeWinCondition();
    }
  }

  function startCafeAdRewardSequence(target) {
    activeCafeAdTarget = target;
    cafeAdRemainingSeconds = 5;

    const adModal = document.getElementById('cafe-ad-modal');
    const closeBtn = document.getElementById('cafe-ad-close-btn');
    const badge = document.getElementById('cafe-ad-timer-badge');
    const progress = document.getElementById('cafe-ad-progress-fill');

    if (closeBtn) {
      closeBtn.disabled = true;
      closeBtn.innerText = `Skip in ${cafeAdRemainingSeconds}s`;
      closeBtn.className = 'cafe-btn-2d bg-slate-300 text-slate-500 font-game text-xs px-3 py-1 rounded-xl border border-slate-400 cursor-not-allowed';
    }
    if (badge) badge.innerText = `Reward in ${cafeAdRemainingSeconds}s`;
    if (progress) progress.style.width = '0%';

    openCafeSubModal('cafe-ad-modal');
    playCafeCoinChime();

    if (cafeAdCountdownInterval) clearInterval(cafeAdCountdownInterval);

    setTimeout(() => {
      if (progress) progress.style.width = '100%';
    }, 50);

    cafeAdCountdownInterval = setInterval(() => {
      cafeAdRemainingSeconds--;
      if (cafeAdRemainingSeconds > 0) {
        if (badge) badge.innerText = `Reward in ${cafeAdRemainingSeconds}s`;
        if (closeBtn) closeBtn.innerText = `Skip in ${cafeAdRemainingSeconds}s`;
      } else {
        clearInterval(cafeAdCountdownInterval);
        if (badge) badge.innerText = 'Reward Ready! 🎁';
        if (closeBtn) {
          closeBtn.disabled = false;
          closeBtn.innerText = 'Claim Reward ✕';
          closeBtn.className = 'cafe-btn-2d cafe-shimmer bg-emerald-500 hover:bg-emerald-400 text-white font-game text-xs px-3 py-1 rounded-xl border-2 border-emerald-950 shadow cursor-pointer font-bold';
        }
        playCafeCoinChime();
      }
    }, 1000);
  }

  function finishCafeAdSimulation() {
    closeCafeSubModal('cafe-ad-modal');
    if (cafeAdCountdownInterval) clearInterval(cafeAdCountdownInterval);

    const ps = ensurePuzzleState();

    if (activeCafeAdTarget === 'TOKENS') {
      ps.puzzlePieces += 2;
      if (typeof saveGame === 'function') saveGame(true);
      renderCafeBoard();
      playCafeCoinChime();
      if (typeof showFloatingToast === 'function') {
        showFloatingToast('Ad completed! +2 🧩 Puzzle Pieces added!');
      }
    } else if (typeof activeCafeAdTarget === 'number') {
      const targetId = activeCafeAdTarget;
      ps.puzzlePieces += 1; // Free unlock + 1 bonus piece as in user template!
      if (typeof saveGame === 'function') saveGame(true);
      popCafeTile(targetId);
      playCafeVictoryChime();
      if (typeof showFloatingToast === 'function') {
        showFloatingToast('Tile unlocked + 1 Bonus 🧩 piece earned!');
      }
    }
    activeCafeAdTarget = null;
  }

  function checkCafeWinCondition() {
    const ps = ensurePuzzleState();
    const remaining = ps.tiles.filter(t => !t).length;
    if (remaining === 0) {
      playCafeVictoryChime();
      if (typeof window.confetti === 'function') {
        try {
          window.confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          setTimeout(() => {
            window.confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0 } });
            window.confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1 } });
          }, 200);
        } catch (e) {}
      }
      setTimeout(() => {
        openCafeSubModal('cafe-win-modal');
      }, 500);
    }
  }

  function claimMorningCafeWinRewards() {
    if (typeof gameState !== 'undefined') {
      // Award +1 Lucky Spin ticket & +300 Energy
      if (gameState.player) {
        gameState.player.tickets = (gameState.player.tickets || 0) + 1;
      }
      if (gameState.reactor) {
        gameState.reactor.currentEnergy = Math.min(
          gameState.reactor.maxEnergy || 1000,
          (gameState.reactor.currentEnergy || 0) + 300
        );
      }
      if (typeof updateUI === 'function') updateUI();
      if (typeof saveGame === 'function') saveGame(true);
    }

    closeCafeSubModal('cafe-win-modal');
    playCafeCoinChime();
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('🏆 Rewards Claimed! +1 Spin Ticket & +300 Energy added! ☕✨');
    }
  }

  function resetMorningCafePuzzle() {
    const ps = ensurePuzzleState();
    ps.tiles = [false, false, false, false, false, false, false, false, false];
    if (typeof saveGame === 'function') saveGame(true);
    renderCafeBoard();
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('Board reset! Uncover the Morning Café again!');
    }
  }

  function openMorningCafePuzzleModal() {
    const modal = document.getElementById('morningCafePuzzleModal');
    if (modal) {
      modal.style.display = 'flex';
      renderCafeBoard();
    }
  }

  function closeMorningCafePuzzleModal() {
    const modal = document.getElementById('morningCafePuzzleModal');
    if (modal) modal.style.display = 'none';
  }

  function openCafeSubModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
  }

  function closeCafeSubModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  }

  // Global Window Exports
  window.startCoinCatcherGame = startCoinCatcherGame;
  window.collectAndExitCoinCatcher = collectAndExitCoinCatcher;
  window.claimCoinCatcherReward = claimCoinCatcherReward;
  window.resumeAfterBombAd = resumeAfterBombAd;
  window.exitAndForfeitCoins = exitAndForfeitCoins;
  window.claimFreeBoomCoinAd = claimFreeBoomCoinAd;
  window.updateBoomCoinBalances = updateBoomCoinBalances;

  // Morning Cafe Puzzle Exports
  window.openMorningCafePuzzleModal = openMorningCafePuzzleModal;
  window.closeMorningCafePuzzleModal = closeMorningCafePuzzleModal;
  window.openCafeSubModal = openCafeSubModal;
  window.closeCafeSubModal = closeCafeSubModal;
  window.renderCafeBoard = renderCafeBoard;
  window.startCafeAdRewardSequence = startCafeAdRewardSequence;
  window.finishCafeAdSimulation = finishCafeAdSimulation;
  window.claimMorningCafeWinRewards = claimMorningCafeWinRewards;
  window.resetMorningCafePuzzle = resetMorningCafePuzzle;
  window.updatePuzzleHUD = updatePuzzleHUD;

  window.initCoinCatcherPage = function() {
    initDOMElements();
    if (!isGameActive && elStartOverlay) {
      elStartOverlay.style.display = 'flex';
    }
    updateBoomCoinBalances();
    updateHUD();
    updatePuzzleHUD();
  };
})();

