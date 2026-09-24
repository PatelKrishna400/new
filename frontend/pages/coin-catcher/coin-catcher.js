/**
 * Coin Catcher Mini-Game
 * Coins fall from top. Player taps/catches them. Avoid bomb hazards.
 */

(function() {
  let isGameActive = false;
  let animFrameId = null;
  let timerInterval = null;
  let timeRemaining = 30;
  let scoreCoins = 0;
  let scoreDiamonds = 0;
  let combo = 1.0;
  let peakCombo = 1.0;
  let lives = 3;
  let lastCalculatedReward = null;

  // Active falling items array
  let activeItems = [];
  let nextSpawnTime = 0;

  // DOM Elements cache
  let elStage = null;
  let elTime = null;
  let elScore = null;
  let elCombo = null;
  let elLives = null;
  let elOverlay = null;
  let elStartOverlay = null;

  function initDOMElements() {
    elStage = document.getElementById('catcherStage');
    elTime = document.getElementById('catcherTimeVal');
    elScore = document.getElementById('catcherScoreVal');
    elCombo = document.getElementById('catcherComboVal');
    elLives = document.getElementById('catcherLivesVal');
    elOverlay = document.getElementById('catcherModalOverlay');
    elStartOverlay = document.getElementById('catcherStartOverlay');
  }

  function startCoinCatcherGame() {
    initDOMElements();
    if (!elStage) return;

    // Reset game state
    cancelAnimationFrame(animFrameId);
    clearInterval(timerInterval);

    // Clear falling elements from stage
    const oldItems = elStage.querySelectorAll('.falling-item, .catcher-score-pop');
    oldItems.forEach(el => el.remove());

    isGameActive = true;
    timeRemaining = 30;
    scoreCoins = 0;
    scoreDiamonds = 0;
    combo = 1.0;
    peakCombo = 1.0;
    lives = 3;
    activeItems = [];
    nextSpawnTime = Date.now() + 300;
    lastCalculatedReward = null;

    if (elStartOverlay) elStartOverlay.style.display = 'none';
    if (elOverlay) elOverlay.classList.remove('open');
    updateHUD();

    // Start 30s countdown
    timerInterval = setInterval(() => {
      if (!isGameActive) return;
      timeRemaining--;
      updateHUD();

      if (timeRemaining <= 0) {
        endGame(true);
      }
    }, 1000);

    // Start Animation Loop
    lastFrameTime = performance.now();
    animFrameId = requestAnimationFrame(gameLoop);

    if (typeof sfx !== 'undefined' && sfx.playTapSound) {
      sfx.playTapSound(2);
    }
  }

  let lastFrameTime = 0;

  function gameLoop(now) {
    if (!isGameActive) return;

    // Stop loop if stage is disconnected or hidden
    if (!elStage || !elStage.isConnected || elStage.offsetParent === null) {
      cancelAnimationFrame(animFrameId);
      isGameActive = false;
      return;
    }

    const dt = Math.min(0.05, (now - lastFrameTime) / 1000);
    lastFrameTime = now;

    // Spawn new items
    if (Date.now() >= nextSpawnTime) {
      spawnFallingItem();
      // Spawn interval between 350ms and 700ms
      nextSpawnTime = Date.now() + Math.floor(350 + Math.random() * 350);
    }

    // Update active items
    const stageHeight = elStage.clientHeight || 440;
    for (let i = activeItems.length - 1; i >= 0; i--) {
      const item = activeItems[i];
      item.y += item.speed * (dt * 60);
      item.el.style.top = `${item.y}px`;

      // Fell off the bottom
      if (item.y > stageHeight + 40) {
        if (item.el.parentNode) item.el.parentNode.removeChild(item.el);
        activeItems.splice(i, 1);

        // Reset combo if coin fell without being caught
        if (item.type !== 'bomb') {
          combo = Math.max(1.0, Number((combo - 0.2).toFixed(1)));
          updateHUD();
        }
      }
    }

    animFrameId = requestAnimationFrame(gameLoop);
  }

  function spawnFallingItem() {
    if (!elStage) return;

    const stageWidth = elStage.clientWidth || 320;
    // 65% Gold Coin, 18% Blue Coin, 7% Star, 10% Bomb
    const rand = Math.random();
    let type = 'gold';
    let icon = '🪙';
    let className = 'coin-gold';
    let speed = 2.2 + Math.random() * 1.5;

    if (rand < 0.60) {
      type = 'gold';
      icon = '🪙';
      className = 'coin-gold';
    } else if (rand < 0.80) {
      type = 'blue';
      icon = '🔷';
      className = 'coin-blue';
      speed += 0.5;
    } else if (rand < 0.88) {
      type = 'star';
      icon = '⭐';
      className = 'star-item';
      speed += 0.8;
    } else {
      type = 'bomb';
      icon = '💣';
      className = 'bomb-hazard';
      speed += 0.4;
    }

    const x = 30 + Math.random() * (stageWidth - 60);
    const itemEl = document.createElement('div');
    itemEl.className = `falling-item ${className}`;
    itemEl.textContent = icon;
    itemEl.style.left = `${x}px`;
    itemEl.style.top = `-30px`;

    const itemObj = {
      el: itemEl,
      type: type,
      x: x,
      y: -30,
      speed: speed
    };

    // Tap/Catch handler
    const catchHandler = (e) => {
      e.stopPropagation();
      e.preventDefault();
      handleItemCatch(itemObj);
    };

    itemEl.addEventListener('touchstart', catchHandler, { passive: false });
    itemEl.addEventListener('mousedown', catchHandler);

    elStage.appendChild(itemEl);
    activeItems.push(itemObj);
  }

  function handleItemCatch(item) {
    if (!isGameActive) return;

    // Remove from active array
    const idx = activeItems.indexOf(item);
    if (idx !== -1) activeItems.splice(idx, 1);

    if (item.type === 'bomb') {
      // BOMB HIT!
      lives--;
      combo = 1.0;
      spawnScorePopup(item.x, item.y, '-1 LIFE 💣', 'bomb');

      // Screen shake
      if (elStage) {
        elStage.classList.remove('shake');
        void elStage.offsetWidth; // trigger reflow
        elStage.classList.add('shake');
      }

      if (typeof sfx !== 'undefined' && sfx.playBombSound) {
        sfx.playBombSound();
      }

      updateHUD();

      if (lives <= 0) {
        endGame(false); // Detonated!
      }
    } else {
      // COIN / STAR CATCH!
      combo = Math.min(3.0, Number((combo + 0.1).toFixed(1)));
      if (combo > peakCombo) peakCombo = combo;

      let gainCoins = 0;
      let gainDiamonds = 0;
      let text = '';
      let colorClass = 'gold';

      if (item.type === 'gold') {
        gainCoins = Math.round(10 * combo);
        text = `+${gainCoins}`;
        colorClass = 'gold';
      } else if (item.type === 'blue') {
        gainCoins = Math.round(25 * combo);
        gainDiamonds = 2;
        text = `+${gainCoins} 🪙 +2 💎`;
        colorClass = 'blue';
      } else if (item.type === 'star') {
        gainCoins = Math.round(50 * combo);
        gainDiamonds = 5;
        combo = Math.min(3.0, Number((combo + 0.3).toFixed(1)));
        text = `+${gainCoins} 🔥`;
        colorClass = 'blue';
      }

      scoreCoins += gainCoins;
      scoreDiamonds += gainDiamonds;
      spawnScorePopup(item.x, item.y, text, colorClass);

      if (typeof sfx !== 'undefined' && sfx.playTapSound) {
        sfx.playTapSound(1);
      }

      updateHUD();
    }

    if (item.el.parentNode) {
      item.el.parentNode.removeChild(item.el);
    }
  }

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

  function updateHUD() {
    if (elTime) elTime.textContent = `${Math.max(0, timeRemaining)}s`;
    if (elScore) elScore.textContent = scoreCoins.toLocaleString();
    if (elCombo) elCombo.textContent = `${combo.toFixed(1)}x`;
    if (elLives) {
      let hearts = '';
      for (let i = 0; i < 3; i++) {
        hearts += i < lives ? '❤️' : '🖤';
      }
      elLives.textContent = hearts;
    }
  }

  function endGame(isTimeComplete) {
    isGameActive = false;
    cancelAnimationFrame(animFrameId);
    clearInterval(timerInterval);

    initDOMElements();
    if (!elOverlay) return;

    const elIcon = document.getElementById('catcherResultIcon');
    const elTitle = document.getElementById('catcherResultTitle');
    const elDesc = document.getElementById('catcherResultDesc');
    const elStatCoins = document.getElementById('catcherStatCoins');
    const elStatCombo = document.getElementById('catcherStatCombo');
    const elStatLives = document.getElementById('catcherStatLives');
    const elStatReward = document.getElementById('catcherStatReward');
    const elClaimBtn = document.getElementById('catcherClaimBtn');

    // Calculate lives bonus (+30 coins per remaining life)
    const lifeBonus = Math.max(0, lives) * 30;
    const finalCoins = scoreCoins + lifeBonus;

    lastCalculatedReward = {
      coins: finalCoins,
      diamonds: scoreDiamonds,
      livesRemaining: lives,
      peakCombo: peakCombo,
      isSuccess: isTimeComplete && scoreCoins > 0
    };

    if (isTimeComplete && scoreCoins > 0) {
      if (elIcon) elIcon.textContent = '🪙';
      if (elTitle) elTitle.textContent = 'ROUND COMPLETE!';
      if (elDesc) elDesc.textContent = `Time expired! Bonus awarded for ${lives} remaining lives.`;
      if (elClaimBtn) {
        elClaimBtn.style.display = 'flex';
        elClaimBtn.disabled = false;
        elClaimBtn.textContent = '🎁 Claim Reward';
      }
    } else {
      if (elIcon) elIcon.textContent = '💥';
      if (elTitle) elTitle.textContent = 'BOMB DETONATED!';
      if (elDesc) elDesc.textContent = 'Too many bombs hit! Be careful and tap only coins!';
      if (elClaimBtn) {
        // Still allow claiming whatever coins were caught before detonation
        elClaimBtn.style.display = finalCoins > 0 ? 'flex' : 'none';
        elClaimBtn.disabled = false;
        elClaimBtn.textContent = '🎁 Claim Earned Bounty';
      }
    }

    if (elStatCoins) elStatCoins.textContent = `${scoreCoins.toLocaleString()} (+${lifeBonus} Life Bonus)`;
    if (elStatCombo) elStatCombo.textContent = `${peakCombo.toFixed(1)}x`;
    if (elStatLives) {
      let hearts = '';
      for (let i = 0; i < 3; i++) hearts += i < lives ? '❤️' : '🖤';
      elStatLives.textContent = hearts;
    }
    if (elStatReward) elStatReward.textContent = `+${finalCoins.toLocaleString()} Coins 🪙, +${scoreDiamonds} 💎`;

    elOverlay.classList.add('open');

    if (typeof sfx !== 'undefined' && sfx.playLevelUpSound && isTimeComplete) {
      sfx.playLevelUpSound();
    }
  }

  async function claimCoinCatcherReward() {
    if (!lastCalculatedReward) return;

    const elClaimBtn = document.getElementById('catcherClaimBtn');
    if (elClaimBtn) {
      elClaimBtn.disabled = true;
      elClaimBtn.textContent = '⏳ Verifying with Server...';
    }

    const payload = {
      action: 'mini_game_catcher',
      coinsEarned: lastCalculatedReward.coins,
      diamondsEarned: lastCalculatedReward.diamonds,
      livesRemaining: lastCalculatedReward.livesRemaining,
      peakCombo: lastCalculatedReward.peakCombo
    };

    // Server authoritative claim validation
    if (typeof window.claimServerAuthoritativeReward === 'function') {
      try {
        const res = await window.claimServerAuthoritativeReward('mini_game_catcher', payload);
        if (res && res.success) {
          if (typeof showFloatingToast === 'function') {
            showFloatingToast(`✅ Server Verified: +${lastCalculatedReward.coins} Coins & +${lastCalculatedReward.diamonds} Diamonds!`);
          }
        }
      } catch (e) {
        console.warn('Fallback local claim:', e);
      }
    } else {
      // Local fallback
      if (typeof gameState !== 'undefined') {
        gameState.player.coins = (gameState.player.coins || 0) + lastCalculatedReward.coins;
        gameState.bank.diamonds = (gameState.bank.diamonds || 0) + lastCalculatedReward.diamonds;
        if (typeof updateUI === 'function') updateUI();
        if (typeof saveGame === 'function') saveGame(true);
      }
    }

    // Increment mini-game counter on profile stats
    if (typeof gameState !== 'undefined') {
      if (!gameState.player.miniGamesPlayed) gameState.player.miniGamesPlayed = 0;
      gameState.player.miniGamesPlayed++;
    }

    if (elOverlay) elOverlay.classList.remove('open');
    lastCalculatedReward = null;
    startCoinCatcherGame();
  }

  // Global window bindings
  window.startCoinCatcherGame = startCoinCatcherGame;
  window.claimCoinCatcherReward = claimCoinCatcherReward;
  window.initCoinCatcherPage = function() {
    initDOMElements();
    if (!isGameActive && elStartOverlay) {
      elStartOverlay.style.display = 'flex';
    }
  };
})();
