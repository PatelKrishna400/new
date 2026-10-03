/**
 * Memory Match 4x4 Mini-Game (pages/memory-match/memory-match.js)
 * - 4x4 Grid of 16 Cards (8 Pairs with Emojis, No Diamonds)
 * - 1 Brain Coin per Card Split/Flip
 * - Matching pairs are removed from the board
 * - Finish game -> Wins 1 Dark Green Fuel
 * - Otherwise (Incomplete/Time expired) -> Wins 10 Brain Coins
 */

(function() {
  const MEMORY_CARD_TYPES = [
    { id: 'core', symbol: '⚡', title: 'Lightning', color: '#00f0ff' },
    { id: 'fuel', symbol: '🔋', title: 'Fuel Cell', color: '#10b981' },
    { id: 'rocket', symbol: '🚀', title: 'Rocket', color: '#38bdf8' },
    { id: 'coin', symbol: '🪙', title: 'Cyber Coin', color: '#eab308' },
    { id: 'key', symbol: '🔑', title: 'Shakti Key', color: '#f59e0b' },
    { id: 'ticket', symbol: '🎟️', title: 'Lucky Ticket', color: '#ec4899' },
    { id: 'egg', symbol: '🥚', title: 'Amrit Egg', color: '#14b8a6' },
    { id: 'crown', symbol: '👑', title: 'Royal Crown', color: '#a855f7' }
  ];

  let isGameActive = false;
  let timerInterval = null;
  let timeRemaining = 60;
  let matchesFound = 0;
  let mistakes = 0;
  let flippedCards = [];
  let isBoardLocked = false;
  let lastCalculatedReward = null;

  // DOM Elements cache
  let elGrid = null;
  let elTime = null;
  let elMatches = null;
  let elMistakes = null;
  let elOverlay = null;

  function initDOMElements() {
    elGrid = document.getElementById('memoryGridContainer');
    elTime = document.getElementById('memoryTimeVal');
    elMatches = document.getElementById('memoryMatchesVal');
    elMistakes = document.getElementById('memoryMistakesVal');
    elOverlay = document.getElementById('memoryModalOverlay');
  }

  function shuffle(array) {
    const copy = array.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function startMemoryMatchGame() {
    initDOMElements();
    if (!elGrid) return;

    // Reset game state
    clearInterval(timerInterval);
    isGameActive = true;
    timeRemaining = 60;
    matchesFound = 0;
    mistakes = 0;
    flippedCards = [];
    isBoardLocked = false;
    lastCalculatedReward = null;

    if (elOverlay) elOverlay.classList.remove('open');
    updateHUD();
    updateBrainCoinPill();

    // Create 16 cards (8 pairs of 2 cards each)
    const deck = [];
    MEMORY_CARD_TYPES.forEach(type => {
      deck.push({ ...type, uid: `${type.id}_1` });
      deck.push({ ...type, uid: `${type.id}_2` });
    });

    const shuffledDeck = shuffle(deck);

    // Build 4x4 DOM Grid
    elGrid.innerHTML = '';
    const fragment = document.createDocumentFragment();

    shuffledDeck.forEach((card, index) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'memory-card';
      cardEl.dataset.type = card.id;
      cardEl.dataset.index = index;

      cardEl.innerHTML = `
        <div class="memory-card-front">
          <span class="card-circuit-logo">🧠</span>
        </div>
        <div class="memory-card-back" style="border-color: ${card.color};">
          <span class="card-symbol-emoji">${card.symbol}</span>
          <span class="card-title">${card.title}</span>
        </div>
      `;

      cardEl.addEventListener('click', () => handleCardClick(cardEl, card));
      fragment.appendChild(cardEl);
    });

    elGrid.appendChild(fragment);

    // Start 60s countdown timer
    timerInterval = setInterval(() => {
      if (!isGameActive) return;
      timeRemaining--;
      updateHUD();

      if (timeRemaining <= 0) {
        endGame(false);
      }
    }, 1000);

    if (typeof sfx !== 'undefined' && sfx.playTapSound) {
      sfx.playTapSound(2);
    }
  }

  function handleCardClick(cardEl, card) {
    if (!isGameActive || isBoardLocked) return;
    if (cardEl.classList.contains('flipped') || cardEl.classList.contains('matched') || cardEl.classList.contains('card-removed')) return;

    // Strict Rule: 1 Brain Coin per card split/flip
    const brainCoins = (typeof gameState !== 'undefined' && gameState.player && gameState.player.brainCoins !== undefined)
      ? Number(gameState.player.brainCoins)
      : 0;

    if (brainCoins < 1) {
      if (typeof showFloatingToast === 'function') {
        showFloatingToast('⚠️ Need 1 🧠 Brain Coin to flip a card! Claim free coins below.');
      }
      if (typeof sfx !== 'undefined' && sfx.playErrorSound) {
        sfx.playErrorSound();
      }
      return;
    }

    // Deduct 1 Brain Coin for this split/flip
    gameState.player.brainCoins = Math.max(0, gameState.player.brainCoins - 1);
    if (typeof updateUI === 'function') updateUI();
    if (typeof saveGame === 'function') saveGame(true);
    updateBrainCoinPill();

    // Flip card & show emoji
    cardEl.classList.add('flipped');
    flippedCards.push({ el: cardEl, data: card });

    if (typeof sfx !== 'undefined' && sfx.playTapSound) {
      sfx.playTapSound(1);
    }

    if (flippedCards.length === 2) {
      checkMatch();
    }
  }

  function checkMatch() {
    isBoardLocked = true;
    const [card1, card2] = flippedCards;

    if (card1.data.id === card2.data.id) {
      // MATCH FOUND! Both cards match -> REMOVE CARDS FROM BOARD
      setTimeout(() => {
        card1.el.classList.add('matched', 'card-removed');
        card2.el.classList.add('matched', 'card-removed');

        matchesFound++;
        flippedCards = [];
        isBoardLocked = false;
        updateHUD();

        if (typeof sfx !== 'undefined' && sfx.playLevelUpSound) {
          sfx.playLevelUpSound();
        }

        if (matchesFound === 8) {
          endGame(true);
        }
      }, 350);
    } else {
      // NO MATCH -> Flip back after preview
      mistakes++;
      updateHUD();
      setTimeout(() => {
        card1.el.classList.remove('flipped');
        card2.el.classList.remove('flipped');
        flippedCards = [];
        isBoardLocked = false;
      }, 700);
    }
  }

  function updateHUD() {
    if (elTime) elTime.textContent = `${Math.max(0, timeRemaining)}s`;
    if (elMatches) elMatches.textContent = `${matchesFound} / 8`;
    if (elMistakes) elMistakes.textContent = mistakes;
  }

  function endGame(isVictory) {
    isGameActive = false;
    clearInterval(timerInterval);

    initDOMElements();
    if (!elOverlay) return;

    const elIcon = document.getElementById('memoryResultIcon');
    const elTitle = document.getElementById('memoryResultTitle');
    const elDesc = document.getElementById('memoryResultDesc');
    const elStars = document.getElementById('memoryStarsRow');
    const elStatTime = document.getElementById('memoryStatTime');
    const elStatMistakes = document.getElementById('memoryStatMistakes');
    const elStatReward = document.getElementById('memoryStatReward');
    const elClaimBtn = document.getElementById('memoryClaimBtn');

    if (isVictory) {
      // Finish game -> Win 1 Dark Green Fuel
      lastCalculatedReward = {
        isVictory: true,
        type: 'darkgreen_fuel',
        amount: 1,
        timeRemaining: timeRemaining,
        mistakes: mistakes
      };

      if (elIcon) elIcon.textContent = '🔋';
      if (elTitle) elTitle.textContent = 'REACTOR SYNCHRONIZED!';
      if (elDesc) elDesc.textContent = `All 8 pairs matched in ${60 - timeRemaining}s! You won Dark Green Fuel!`;

      if (elStars) {
        const starItems = elStars.querySelectorAll('.star-item');
        const stars = mistakes <= 2 ? 3 : (mistakes <= 6 ? 2 : 1);
        starItems.forEach((st, idx) => st.classList.toggle('active', idx < stars));
      }

      if (elStatTime) elStatTime.textContent = `${timeRemaining}s Remaining`;
      if (elStatMistakes) elStatMistakes.textContent = `${mistakes} Mistakes`;
      if (elStatReward) {
        elStatReward.innerHTML = `<span style="color: #34d399; font-size: 16px; font-weight: 800;">+1 Dark Green Fuel 🔋</span>`;
      }
      if (elClaimBtn) {
        elClaimBtn.style.display = 'flex';
        elClaimBtn.disabled = false;
        elClaimBtn.innerHTML = '<span>🔋</span> Claim Dark Green Fuel';
      }

      if (typeof sfx !== 'undefined' && sfx.playLevelUpSound) {
        sfx.playLevelUpSound();
      }
    } else {
      // Incomplete / Time expired -> Otherwise win 10 Brain Coins
      lastCalculatedReward = {
        isVictory: false,
        type: 'brain_coins',
        amount: 10,
        timeRemaining: 0,
        mistakes: mistakes
      };

      if (elIcon) elIcon.textContent = '🧠';
      if (elTitle) elTitle.textContent = 'TIME EXPIRED!';
      if (elDesc) elDesc.textContent = 'Game ended before clearing all cards. Consolation reward awarded!';

      if (elStars) {
        elStars.querySelectorAll('.star-item').forEach(st => st.classList.remove('active'));
      }

      if (elStatTime) elStatTime.textContent = '0s';
      if (elStatMistakes) elStatMistakes.textContent = `${mistakes} Mistakes`;
      if (elStatReward) {
        elStatReward.innerHTML = `<span style="color: #c084fc; font-size: 16px; font-weight: 800;">+10 Brain Coins 🧠</span>`;
      }
      if (elClaimBtn) {
        elClaimBtn.style.display = 'flex';
        elClaimBtn.disabled = false;
        elClaimBtn.innerHTML = '<span>🧠</span> Claim 10 Brain Coins';
      }
    }

    elOverlay.classList.add('open');
  }

  function claimMemoryMatchReward() {
    if (!lastCalculatedReward) return;

    const elClaimBtn = document.getElementById('memoryClaimBtn');
    if (elClaimBtn) {
      elClaimBtn.disabled = true;
      elClaimBtn.textContent = '✓ Claimed!';
    }

    if (lastCalculatedReward.isVictory) {
      // Award 1 Dark Green Fuel
      if (typeof gameState !== 'undefined') {
        if (!gameState.energyGenerator) gameState.energyGenerator = {};
        if (!gameState.energyGenerator.fuelCells) {
          gameState.energyGenerator.fuelCells = { green: 0, darkgreen: 0, yellow: 0, orange: 0, red: 0, darkred: 0, pink: 0, purple: 0, blue: 0, lightblue: 0 };
        }
        gameState.energyGenerator.fuelCells.darkgreen = (gameState.energyGenerator.fuelCells.darkgreen || 0) + 1;
        if (typeof updateUI === 'function') updateUI();
        if (typeof saveGame === 'function') saveGame(true);
        if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
          window.firebaseSync.saveToCloudImmediate();
        }
      }
      if (typeof showFloatingToast === 'function') {
        showFloatingToast('🎉 Victory! +1 Dark Green Fuel 🔋 added to Energy Reactor!');
      }
      if (typeof sfx !== 'undefined' && sfx.playLevelUpSound) {
        sfx.playLevelUpSound();
      }
    } else {
      // Otherwise: Award 10 Brain Coins
      if (typeof gameState !== 'undefined' && gameState.player) {
        gameState.player.brainCoins = (gameState.player.brainCoins || 0) + 10;
        if (typeof updateUI === 'function') updateUI();
        if (typeof saveGame === 'function') saveGame(true);
        if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
          window.firebaseSync.saveToCloudImmediate();
        }
      }
      if (typeof showFloatingToast === 'function') {
        showFloatingToast('🎁 Consolation Reward: +10 🧠 Brain Coins claimed!');
      }
      if (typeof sfx !== 'undefined' && sfx.playCoinSound) {
        sfx.playCoinSound();
      }
    }

    // Increment mini-game counter on profile stats
    if (typeof gameState !== 'undefined' && gameState.player) {
      if (!gameState.player.miniGamesPlayed) gameState.player.miniGamesPlayed = 0;
      gameState.player.miniGamesPlayed++;
    }

    if (elOverlay) elOverlay.classList.remove('open');
    lastCalculatedReward = null;
    isGameActive = false;
    updateBrainCoinPill();
  }

  function updateBrainCoinPill() {
    const el = document.getElementById('memoryPlayerBrainCoinsVal');
    const coins = (typeof gameState !== 'undefined' && gameState.player && gameState.player.brainCoins !== undefined)
      ? Number(gameState.player.brainCoins)
      : 0;
    if (el) el.textContent = coins.toLocaleString();
  }

  window.claimFreeBrainCoinAd = function() {
    if (typeof window.show_11677609 === 'function') {
      window.show_11677609().then(() => {
        grantBrainCoin();
      }).catch(() => {
        grantBrainCoin();
      });
    } else {
      grantBrainCoin();
    }
  };

  function grantBrainCoin() {
    if (typeof gameState !== 'undefined' && gameState.player) {
      gameState.player.brainCoins = (gameState.player.brainCoins || 0) + 1;
      if (typeof saveGame === 'function') saveGame(true);
      if (typeof updateUI === 'function') updateUI();
      updateBrainCoinPill();
      if (typeof sfx !== 'undefined' && sfx.playUpgradeChime) sfx.playUpgradeChime();
      if (typeof showFloatingToast === 'function') {
        showFloatingToast('🎉 +1 🧠 Brain Coin received!');
      }
    }
  }

  // Global window bindings
  window.startMemoryMatchGame = startMemoryMatchGame;
  window.claimMemoryMatchReward = claimMemoryMatchReward;
  window.updateBrainCoinPill = updateBrainCoinPill;
  window.initMemoryMatchPage = function() {
    initDOMElements();
    updateBrainCoinPill();
    if (!isGameActive) {
      startMemoryMatchGame();
    }
  };
})();
