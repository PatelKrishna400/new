/**
 * Memory Match 4x4 Mini-Game
 * Matches 8 pairs within a timer.
 * Rewards depend on: completion, time, and mistakes.
 */

(function() {
  const MEMORY_CARD_TYPES = [
    { id: 'core', symbol: '⚡', title: 'Energy Core', color: '#00f0ff' },
    { id: 'fuel', symbol: '🔋', title: 'Fuel Cell', color: '#10b981' },
    { id: 'gem', symbol: '💎', title: 'Diamond', color: '#38bdf8' },
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

    // Create 16 cards (8 pairs)
    const deck = [];
    MEMORY_CARD_TYPES.forEach(type => {
      deck.push({ ...type, uid: `${type.id}_1` });
      deck.push({ ...type, uid: `${type.id}_2` });
    });

    const shuffledDeck = shuffle(deck);

    // Build DOM
    elGrid.innerHTML = '';
    const fragment = document.createDocumentFragment();

    shuffledDeck.forEach((card, index) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'memory-card';
      cardEl.dataset.type = card.id;
      cardEl.dataset.index = index;

      cardEl.innerHTML = `
        <div class="memory-card-front">
          <span class="card-circuit-logo">⚡</span>
        </div>
        <div class="memory-card-back" style="border-color: ${card.color};">
          <span class="card-symbol">${card.symbol}</span>
          <span class="card-title">${card.title}</span>
        </div>
      `;

      cardEl.addEventListener('click', () => handleCardClick(cardEl, card));
      fragment.appendChild(cardEl);
    });

    elGrid.appendChild(fragment);

    // Start Timer
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
    if (cardEl.classList.contains('flipped') || cardEl.classList.contains('matched')) return;

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
      // MATCH FOUND!
      setTimeout(() => {
        card1.el.classList.add('matched');
        card2.el.classList.add('matched');
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
      // NO MATCH
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
      // Calculate Rewards based on completion, time remaining, and mistakes
      const baseCoins = 150;
      const timeBonus = timeRemaining * 3; // +3 coins per second left
      let diamondBonus = 15;
      let stars = 1;

      if (mistakes <= 2) {
        stars = 3;
        diamondBonus = 60;
      } else if (mistakes <= 5) {
        stars = 2;
        diamondBonus = 35;
      }

      const totalCoins = baseCoins + timeBonus;

      lastCalculatedReward = {
        coins: totalCoins,
        diamonds: diamondBonus,
        keys: 1,
        timeRemaining: timeRemaining,
        mistakes: mistakes,
        stars: stars,
        isVictory: true
      };

      if (elIcon) elIcon.textContent = '🏆';
      if (elTitle) elTitle.textContent = 'REACTOR SYNCHRONIZED!';
      if (elDesc) elDesc.textContent = `Completed with ${timeRemaining}s remaining and ${mistakes} mistake${mistakes === 1 ? '' : 's'}.`;

      if (elStars) {
        const starItems = elStars.querySelectorAll('.star-item');
        starItems.forEach((st, idx) => {
          st.classList.toggle('active', idx < stars);
        });
      }

      if (elStatTime) elStatTime.textContent = `${timeRemaining}s left (+${timeBonus} Coins)`;
      if (elStatMistakes) elStatMistakes.textContent = `${mistakes} (${stars} Star${stars > 1 ? 's' : ''})`;
      if (elStatReward) elStatReward.textContent = `+${totalCoins.toLocaleString()} Coins 🪙, +${diamondBonus} 💎, +1 🔑`;
      if (elClaimBtn) {
        elClaimBtn.style.display = 'flex';
        elClaimBtn.disabled = false;
        elClaimBtn.textContent = '🎁 Claim Reward';
      }

      if (typeof sfx !== 'undefined' && sfx.playLevelUpSound) {
        sfx.playLevelUpSound();
      }
    } else {
      lastCalculatedReward = null;
      if (elIcon) elIcon.textContent = '⏳';
      if (elTitle) elTitle.textContent = 'TIME EXPIRED!';
      if (elDesc) elDesc.textContent = 'The quantum reactor destabilized. Try again to claim rewards!';
      if (elStars) {
        elStars.querySelectorAll('.star-item').forEach(st => st.classList.remove('active'));
      }
      if (elStatTime) elStatTime.textContent = '0s';
      if (elStatMistakes) elStatMistakes.textContent = mistakes;
      if (elStatReward) elStatReward.textContent = '0 Coins (Requires All 8 Pairs)';
      if (elClaimBtn) elClaimBtn.style.display = 'none';
    }

    elOverlay.classList.add('open');
  }

  async function claimMemoryMatchReward() {
    if (!lastCalculatedReward || !lastCalculatedReward.isVictory) return;

    const elClaimBtn = document.getElementById('memoryClaimBtn');
    if (elClaimBtn) {
      elClaimBtn.disabled = true;
      elClaimBtn.textContent = '⏳ Verifying with Server...';
    }

    const payload = {
      action: 'mini_game_memory',
      timeRemaining: lastCalculatedReward.timeRemaining,
      mistakes: lastCalculatedReward.mistakes,
      stars: lastCalculatedReward.stars,
      claimedCoins: lastCalculatedReward.coins,
      claimedDiamonds: lastCalculatedReward.diamonds,
      claimedKeys: lastCalculatedReward.keys
    };

    // Server authoritative claim validation
    if (typeof window.claimServerAuthoritativeReward === 'function') {
      try {
        const res = await window.claimServerAuthoritativeReward('mini_game_memory', payload);
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
        gameState.bank.keys = (gameState.bank.keys || 0) + (lastCalculatedReward.keys || 0);
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
    startMemoryMatchGame();
  }

  // Global window bindings
  window.startMemoryMatchGame = startMemoryMatchGame;
  window.claimMemoryMatchReward = claimMemoryMatchReward;
  window.initMemoryMatchPage = function() {
    initDOMElements();
    if (!isGameActive) {
      startMemoryMatchGame();
    }
  };
})();
