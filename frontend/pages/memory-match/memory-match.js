/**
 * Memory Match 4x4 Mini-Game (pages/memory-match/memory-match.js)
 * - 4x4 Grid of 16 Cards (8 Pairs with Emojis, No Diamonds)
 * - 1 Brain Coin per Card Split/Flip
 * - Matching pairs are removed from the board
 * - Finish game -> Wins ONLY 5 Balloon Coins (🎈 5)
 * - Otherwise (Incomplete/Time expired) -> Wins 10 Brain Coins (🧠 10)
 * - Balloon Pursuit Progression Map Popup integration with 11 Stages + Stage 12 Jackpot
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
    timeRemaining = 60;
    matchesFound = 0;
    mistakes = 0;
    flippedCards = [];
    isBoardLocked = false;
    isGameActive = true;
    lastCalculatedReward = null;

    if (elOverlay) {
      elOverlay.classList.remove('open');
    }

    updateHUD();
    updateBrainCoinPill();
    updateBalloonCoinPill();

    // Generate 16 cards (8 pairs)
    const deck = [];
    MEMORY_CARD_TYPES.forEach(type => {
      deck.push({ ...type, uid: `${type.id}_a` });
      deck.push({ ...type, uid: `${type.id}_b` });
    });

    const shuffled = shuffle(deck);

    // Render cards into grid
    elGrid.innerHTML = '';
    shuffled.forEach(card => {
      const cardEl = document.createElement('div');
      cardEl.className = 'memory-card';
      cardEl.dataset.cardId = card.id;
      cardEl.dataset.cardUid = card.uid;

      cardEl.innerHTML = `
        <div class="memory-card-inner">
          <div class="memory-card-back">
            <span class="symbol">🎴</span>
          </div>
          <div class="memory-card-front" style="border-color: ${card.color}; box-shadow: 0 0 15px ${card.color}40;">
            <span class="symbol">${card.symbol}</span>
            <span class="label" style="color: ${card.color};">${card.title}</span>
          </div>
        </div>
      `;

      cardEl.addEventListener('click', () => onCardClicked(cardEl, card));
      elGrid.appendChild(cardEl);
    });

    // Start 60-second countdown
    timerInterval = setInterval(() => {
      timeRemaining--;
      updateHUD();

      if (timeRemaining <= 0) {
        clearInterval(timerInterval);
        endGame(false);
      }
    }, 1000);
  }

  function onCardClicked(cardEl, card) {
    if (!isGameActive || isBoardLocked) return;
    if (cardEl.classList.contains('flipped') || cardEl.classList.contains('matched')) return;
    if (flippedCards.length >= 2) return;

    // Deduct 1 Brain Coin per card flip
    if (typeof gameState !== 'undefined' && gameState.player) {
      const currentBrainCoins = Number(gameState.player.brainCoins || 0);
      if (currentBrainCoins < 1) {
        if (typeof showFloatingToast === 'function') {
          showFloatingToast('⚠️ You need at least 1 🧠 Brain Coin to flip a card! Tap the + button to claim free coins.');
        } else {
          alert('You need at least 1 Brain Coin to flip a card!');
        }
        if (typeof sfx !== 'undefined' && sfx.playErrorSound) {
          sfx.playErrorSound();
        }
        return;
      }

      gameState.player.brainCoins = Math.max(0, currentBrainCoins - 1);
      if (typeof recordTaskEvent === 'function') {
        recordTaskEvent('use_brain', 1);
      }
      if (typeof updateUI === 'function') updateUI();
      if (typeof saveGame === 'function') saveGame(true);
      updateBrainCoinPill();
    }

    // Flip card
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
      // Finish game -> Win ONLY 5 Balloon Coins
      lastCalculatedReward = {
        isVictory: true,
        type: 'balloon_coins',
        amount: 5,
        timeRemaining: timeRemaining,
        mistakes: mistakes
      };

      if (elIcon) elIcon.textContent = '🎈';
      if (elTitle) elTitle.textContent = 'PUZZLE COMPLETE!';
      if (elDesc) elDesc.textContent = `All 8 pairs matched in ${60 - timeRemaining}s! You won 5 Balloon Coins!`;

      if (elStars) {
        const starItems = elStars.querySelectorAll('.star-item');
        const stars = mistakes <= 2 ? 3 : (mistakes <= 6 ? 2 : 1);
        starItems.forEach((st, idx) => st.classList.toggle('active', idx < stars));
      }

      if (elStatTime) elStatTime.textContent = `${timeRemaining}s Remaining`;
      if (elStatMistakes) elStatMistakes.textContent = `${mistakes} Mistakes`;
      if (elStatReward) {
        elStatReward.innerHTML = `<span style="color: #facc15; font-size: 16px; font-weight: 800;">+5 Balloon Coins 🎈</span>`;
      }
      if (elClaimBtn) {
        elClaimBtn.style.display = 'flex';
        elClaimBtn.disabled = false;
        elClaimBtn.innerHTML = '<span>🎈</span> Claim 5 Coins &amp; Use in Balloon Pursuit';
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
      // Award ONLY 5 Balloon Coins
      if (typeof gameState !== 'undefined' && gameState.player) {
        if (gameState.player.balloonCoins === undefined) gameState.player.balloonCoins = 0;
        gameState.player.balloonCoins += 5;
        if (typeof updateUI === 'function') updateUI();
        if (typeof saveGame === 'function') saveGame(true);
        if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
          window.firebaseSync.saveToCloudImmediate();
        }
      }
      if (typeof showFloatingToast === 'function') {
        showFloatingToast('🎉 Victory! +5 🎈 Balloon Coins added! Opening Balloon Pursuit...');
      }
      if (typeof sfx !== 'undefined' && sfx.playLevelUpSound) {
        sfx.playLevelUpSound();
      }

      // Automatically open Balloon Pursuit progression map
      setTimeout(() => {
        openBalloonPursuitModal();
      }, 400);
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
    updateBalloonCoinPill();
  }

  function updateBrainCoinPill() {
    const el = document.getElementById('memoryPlayerBrainCoinsVal');
    const coins = (typeof gameState !== 'undefined' && gameState.player && gameState.player.brainCoins !== undefined)
      ? Number(gameState.player.brainCoins)
      : 0;
    if (el) el.textContent = coins.toLocaleString();
  }

  function updateBalloonCoinPill() {
    const el = document.getElementById('memoryPlayerBalloonCoinsVal');
    const coins = (typeof gameState !== 'undefined' && gameState.player && gameState.player.balloonCoins !== undefined)
      ? Number(gameState.player.balloonCoins)
      : 0;
    if (el) el.textContent = coins.toLocaleString();

    const pursuitCoinsEl = document.getElementById('player-coins');
    if (pursuitCoinsEl) pursuitCoinsEl.textContent = coins.toLocaleString();
  }

  window.claimFreeBrainCoinAd = function() {
    // Rewarded interstitial
    if (typeof show_10676091 === 'function') {
      show_10676091().then(() => {
        // You need to add your user reward function here, which will be executed after the user watches the ad.
        // For more details, please refer to the detailed instructions.
        alert('You have seen an ad!');
        grantBrainCoin();
      }).catch(e => {
        console.warn('show_10676091 notice:', e);
        grantBrainCoin();
      });
    } else if (typeof window.showRewardedAd === 'function') {
      window.showRewardedAd(grantBrainCoin, {
        adTitle: 'Free Brain Coin Sponsor Ad',
        adDesc: 'Watch full sponsored ad to earn 1 Brain Coin'
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

  // =========================================================================
  // BALLOON PURSUIT PROGRESSION MAP ENGINE
  // =========================================================================
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playBalloonSound(type) {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      if (type === 'pop') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.13);
      } else if (type === 'coin') {
        const freqs = [987.77, 1318.51];
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.25, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.26);
        });
      } else if (type === 'locked') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.linearRampToValueAtTime(90, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.16);
      } else if (type === 'fanfare') {
        const melody = [523.25, 659.25, 783.99, 1046.50];
        melody.forEach((f, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now + i * 0.14);
          gain.gain.setValueAtTime(0.28, now + i * 0.14);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.14 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.14);
          osc.stop(now + i * 0.14 + 0.45);
        });
      }
    } catch (e) {
      console.warn('Balloon pursuit audio error:', e);
    }
  }

  function getBalloonPursuitState() {
    if (typeof gameState !== 'undefined') {
      if (!gameState.balloonPursuitState) {
        gameState.balloonPursuitState = {
          currentUnlockedStage: 1,
          jackpotAdsWatched: 0,
          stageAdsWatchedMap: {},
          stageCoinsPaidMap: {}
        };
      }
      return gameState.balloonPursuitState;
    }
    return {
      currentUnlockedStage: 1,
      jackpotAdsWatched: 0,
      stageAdsWatchedMap: {},
      stageCoinsPaidMap: {}
    };
  }

  function getPlayerBalloonCoins() {
    if (typeof gameState !== 'undefined' && gameState.player && gameState.player.balloonCoins !== undefined) {
      return Number(gameState.player.balloonCoins);
    }
    return 0;
  }

  function setPlayerBalloonCoins(amount) {
    if (typeof gameState !== 'undefined' && gameState.player) {
      gameState.player.balloonCoins = Math.max(0, amount);
      if (typeof updateUI === 'function') updateUI();
      if (typeof saveGame === 'function') saveGame(true);
      if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
        window.firebaseSync.saveToCloudImmediate();
      }
    }
    updateBalloonCoinPill();
  }

  let pendingStageToCollect = null;
  let adInterval = null;
  let adDuration = 5;
  let adCountdown = 5;
  let adReadyToClaim = false;

  const UNIFORM_BALLOON_COLORS = { 
    main: "#facc15",
    left: "#84cc16",
    right: "#84cc16",
    center: "#22c55e"
  };

  const STAGE_CONFIGS = [
    { id: 1, coinCost: 2, adsRequired: 1, rewardText: "🗝️ 1 Key", rewardBadge: "🗝️ 1" },
    { id: 2, coinCost: 5, adsRequired: 1, rewardText: "🎟️ 1 Ticket", rewardBadge: "🎟️ 1" },
    { id: 3, coinCost: 10, adsRequired: 1, rewardText: "🟢⛽ Green Fuel", rewardBadge: "🟢 Fuel" },
    { id: 4, coinCost: 100, adsRequired: 3, rewardText: "⚡ 100 Energy", rewardBadge: "⚡ 100" },
    { id: 5, coinCost: 70, adsRequired: 1, rewardText: "⚡ 50 Energy", rewardBadge: "⚡ 50" },
    { id: 6, coinCost: 80, adsRequired: 1, rewardText: "🌲⛽ 5 Dark Green Fuel", rewardBadge: "🌲 5 Fuel" },
    { id: 7, coinCost: 90, adsRequired: 1, rewardText: "🧠 10 Brains", rewardBadge: "🧠 10" },
    { id: 8, coinCost: 100, adsRequired: 1, rewardText: "💣 3 Bombs", rewardBadge: "💣 3" },
    { id: 9, coinCost: 110, adsRequired: 5, rewardText: "🟢 Green + 🟡 Yellow Fuel", rewardBadge: "🟢🟡 Fuel" },
    { id: 10, coinCost: 120, adsRequired: 1, rewardText: "🌲⛽ 3 Dark Green Fuel", rewardBadge: "🌲 3 Fuel" },
    { id: 11, coinCost: 130, adsRequired: 3, rewardText: "🔵⛽ Blue Fuel", rewardBadge: "🔵 Fuel" }
  ];

  function openBalloonPursuitModal() {
    const modal = document.getElementById('balloonPursuitModal');
    if (modal) {
      modal.classList.remove('hidden');
      renderStagesGrid();
      updateBalloonCoinPill();
      startBalloonTimer();
      playBalloonSound('pop');
    }
  }

  function closeBalloonPursuitModal() {
    const modal = document.getElementById('balloonPursuitModal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  function renderStagesGrid() {
    const container = document.getElementById('stages-container');
    if (!container) return;
    container.innerHTML = '';

    // Row 1 (Top): Stage 1 -> Stage 2 -> Stage 3
    const row1 = createRowElement([
      { type: 'stage', id: 1 },
      { type: 'star', from: 1, to: 2 },
      { type: 'stage', id: 2 },
      { type: 'star', from: 2, to: 3 },
      { type: 'stage', id: 3 }
    ]);
    container.appendChild(row1);

    // Downward Star Connector: Stage 3 down to Stage 4 (right side)
    container.appendChild(createVerticalStarRow('right', 3, 4));

    // Row 2: Stage 6 <- Stage 5 <- Stage 4
    const row2 = createRowElement([
      { type: 'stage', id: 6 },
      { type: 'star', from: 5, to: 6 },
      { type: 'stage', id: 5 },
      { type: 'star', from: 4, to: 5 },
      { type: 'stage', id: 4 }
    ]);
    container.appendChild(row2);

    // Downward Star Connector: Stage 6 down to Stage 7 (left side)
    container.appendChild(createVerticalStarRow('left', 6, 7));

    // Row 3: Stage 7 -> Stage 8 -> Stage 9
    const row3 = createRowElement([
      { type: 'stage', id: 7 },
      { type: 'star', from: 7, to: 8 },
      { type: 'stage', id: 8 },
      { type: 'star', from: 8, to: 9 },
      { type: 'stage', id: 9 }
    ]);
    container.appendChild(row3);

    // Downward Star Connector: Stage 9 down to Stage 10 (right side)
    container.appendChild(createVerticalStarRow('right', 9, 10));

    // Row 4 (Bottom): [Lead to Grand] <- Stage 11 <- Stage 10
    const row4 = createRowElement([
      { type: 'leadToGrand' },
      { type: 'star', from: 11, to: 12 },
      { type: 'stage', id: 11 },
      { type: 'star', from: 10, to: 11 },
      { type: 'stage', id: 10 }
    ]);
    container.appendChild(row4);

    updateGrandCardStatus();
    updateBalloonCoinPill();
  }

  function createRowElement(items) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'flex items-center justify-between w-full relative z-10';

    items.forEach(item => {
      if (item.type === 'stage') {
        rowDiv.appendChild(buildStageCard(item.id));
      } else if (item.type === 'star') {
        rowDiv.appendChild(buildStarConnector(item.from, item.to));
      } else if (item.type === 'leadToGrand') {
        const leadDiv = document.createElement('div');
        leadDiv.className = 'flex-1 max-w-[95px] aspect-[4/4.3] flex flex-col items-center justify-center';
        leadDiv.innerHTML = `
          <div class="w-8 h-8 rounded-full bg-amber-400 border-2 border-amber-800 flex items-center justify-center text-amber-950 shadow-[0_2px_0_#78350f] animate-bounce mb-0.5">
            <svg viewBox="0 0 24 24" class="w-4 h-4 fill-current rotate-90">
              <path d="M3.5 12a1.5 1.5 0 0 0 1.5 1.5h7.5v2.8a1.2 1.2 0 0 0 2 0.9l6.2-4.6a1.2 1.2 0 0 0 0-1.8l-6.2-4.6a1.2 1.2 0 0 0-2 0.9v2.9H5a1.5 1.5 0 0 0-1.5 1.5z"/>
            </svg>
          </div>
          <span class="font-game text-[9px] text-amber-300 tracking-wider">JACKPOT</span>
        `;
        rowDiv.appendChild(leadDiv);
      }
    });

    return rowDiv;
  }

  function createVerticalStarRow(alignment, fromStage, toStage) {
    const div = document.createElement('div');
    div.className = `flex w-full px-8 ${alignment === 'left' ? 'justify-start' : 'justify-end'} -my-2 relative z-10`;
    div.appendChild(buildStarConnector(fromStage, toStage));
    return div;
  }

  function buildStarConnector(fromStage, toStage) {
    const st = getBalloonPursuitState();
    const starWrapper = document.createElement('div');
    const isPathPassed = st.currentUnlockedStage > fromStage;
    const isCurrentStep = st.currentUnlockedStage === fromStage;

    let stateClass = 'idle';
    if (isPathPassed) {
      stateClass = 'done';
    } else if (isCurrentStep) {
      stateClass = 'active';
    }

    starWrapper.className = `star-connector ${stateClass}`;
    starWrapper.innerHTML = `<div class="star-gem"></div>`;
    return starWrapper;
  }

  function buildStageCard(stageId) {
    const st = getBalloonPursuitState();
    const card = document.createElement('div');
    const isCompleted = stageId < st.currentUnlockedStage;
    const isActive = stageId === st.currentUnlockedStage;
    const config = STAGE_CONFIGS[stageId - 1];
    const isCoinPaid = (st.stageCoinsPaidMap && st.stageCoinsPaidMap[stageId]) || false;

    let cardClasses = "game-card-scenic flex-1 max-w-[95px] aspect-[4/4.3] rounded-2xl p-1 cursor-pointer flex flex-col justify-between ";

    if (isCompleted) {
      cardClasses += "game-card-completed";
    } else if (isActive) {
      cardClasses += "game-card-active";
    }

    card.className = cardClasses;
    card.onclick = () => onStageCardClick(stageId);

    // Top Reward Badge
    const topRewardHtml = `
      <div class="w-full flex justify-center pt-0.5 z-10">
        <div class="bg-gradient-to-b from-amber-200 via-yellow-300 to-amber-400 border border-[#78350f] text-[#78350f] font-game text-[9.5px] px-2 py-0.5 rounded-full shadow-[0_2px_0_#78350f] flex items-center justify-center space-x-0.5 max-w-[86px] truncate filter drop-shadow-xs">
          <span>${config.rewardBadge}</span>
        </div>
      </div>
    `;

    // Hot Air Balloon SVG
    const colors = UNIFORM_BALLOON_COLORS;
    const balloonSvg = `
      <div class="relative w-11 h-12 flex items-center justify-center mx-auto my-0.5 ${isActive ? 'balloon-bob' : ''}">
        <div class="absolute top-0.5 -left-1 text-[10px] opacity-70 select-none pointer-events-none">☁️</div>
        <svg viewBox="0 0 100 100" class="w-full h-full filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.35)]">
          <ellipse cx="50" cy="42" rx="34" ry="36" fill="${colors.main}" stroke="#1e293b" stroke-width="3" />
          <path d="M35 12 C44 26 44 58 35 78 C25 68 18 55 18 42 C18 28 25 18 35 12 Z" fill="${colors.left}" stroke="#1e293b" stroke-width="2" />
          <path d="M65 12 C56 26 56 58 65 78 C75 68 82 55 82 42 C82 28 75 18 65 12 Z" fill="${colors.right}" stroke="#1e293b" stroke-width="2" />
          <ellipse cx="50" cy="42" rx="13" ry="36" fill="${colors.center}" stroke="#1e293b" stroke-width="2" />
          <line x1="39" y1="76" x2="43" y2="86" stroke="#1e293b" stroke-width="2.5" />
          <line x1="61" y1="76" x2="57" y2="86" stroke="#1e293b" stroke-width="2.5" />
          <rect x="42" y="84" width="16" height="12" rx="2.5" fill="#b45309" stroke="#451a03" stroke-width="2.5" />
        </svg>
      </div>
    `;

    // Bottom Action
    let bottomActionHtml = '';
    if (isCompleted) {
      bottomActionHtml = `
        <div class="w-full bg-emerald-700 border border-emerald-900 text-white font-game text-[8.5px] py-0.5 rounded-lg text-center shadow-xs">
          CLAIMED
        </div>
      `;
    } else if (isActive) {
      if (!isCoinPaid) {
        bottomActionHtml = `
          <button class="btn-2d w-full bg-gradient-to-b from-amber-300 to-amber-500 border-2 border-[#78350f] text-[#78350f] font-game text-[8.5px] py-0.5 rounded-lg shadow-[0_2px_0_#78350f] flex items-center justify-center space-x-0.5">
            <span>PAY 🎈${config.coinCost}</span>
          </button>
        `;
      } else {
        bottomActionHtml = `
          <button class="btn-2d w-full bg-gradient-to-b from-emerald-400 to-green-500 border-2 border-[#064e3b] text-[#064e3b] font-game text-[8.5px] py-0.5 rounded-lg shadow-[0_2px_0_#064e3b] flex items-center justify-center space-x-1 animate-pulse">
            <span>COLLECT</span>
            <span class="text-[9px]">📢</span>
          </button>
        `;
      }
    } else {
      bottomActionHtml = `
        <div class="w-full bg-[#0f172a]/70 border border-black/40 text-white/95 font-game text-[8.5px] py-0.5 rounded-lg text-center truncate px-0.5 shadow-inner">
          🎈 ${config.coinCost}
        </div>
      `;
    }

    card.innerHTML = `
      ${topRewardHtml}
      ${balloonSvg}
      <div class="w-full text-center z-10 mb-0.5">
        ${bottomActionHtml}
      </div>
    `;

    return card;
  }

  function onStageCardClick(stageId) {
    const st = getBalloonPursuitState();
    if (stageId < st.currentUnlockedStage) {
      playBalloonSound('pop');
      showBalloonToast(`Stage #${stageId} already completed! ✓`);
      return;
    }

    if (stageId > st.currentUnlockedStage) {
      playBalloonSound('locked');
      showBalloonToast(`Unlock Stage #${st.currentUnlockedStage} first!`);
      return;
    }

    pendingStageToCollect = stageId;
    playBalloonSound('pop');
    refreshPopupState();
    openModal('stage-popup-modal');
  }

  function refreshPopupState() {
    const stageId = pendingStageToCollect;
    if (!stageId) return;

    const st = getBalloonPursuitState();
    const config = STAGE_CONFIGS[stageId - 1];
    const isPaid = (st.stageCoinsPaidMap && st.stageCoinsPaidMap[stageId]) || false;
    const adsWatched = (st.stageAdsWatchedMap && st.stageAdsWatchedMap[stageId]) || 0;

    const iconEl = document.getElementById('popup-stage-icon');
    if (iconEl) iconEl.innerHTML = `<span class="text-4xl filter drop-shadow">🎈</span>`;

    const titleEl = document.getElementById('popup-stage-title');
    if (titleEl) titleEl.innerText = `STAGE ${stageId}`;

    const costEl = document.getElementById('popup-cost-display');
    if (costEl) costEl.innerText = `🎈 ${config.coinCost}`;

    const rewardEl = document.getElementById('popup-reward-display');
    if (rewardEl) rewardEl.innerText = config.rewardText;

    const stepText = document.getElementById('popup-ad-progress-text');
    const stepIcon = document.getElementById('popup-step-icon');
    const actionBtn = document.getElementById('popup-watch-ad-btn');
    const descEl = document.getElementById('popup-stage-desc');

    if (!isPaid) {
      if (descEl) descEl.innerText = `Step 1: Pay 🎈 ${config.coinCost} Balloon Coins to unlock!`;
      if (stepIcon) stepIcon.innerText = "💰";
      if (stepText) stepText.innerText = `STEP 1: PAY 🎈 ${config.coinCost} COINS`;
      if (actionBtn) {
        actionBtn.className = "btn-2d w-full py-3.5 rounded-2xl font-game text-base sm:text-lg tracking-wider text-[#451a03] bg-gradient-to-b from-amber-300 via-yellow-300 to-amber-500 border-3 border-[#78350f] shadow-[0_5px_0_#78350f] flex items-center justify-center space-x-2";
        actionBtn.innerHTML = `<span>PAY 🎈 ${config.coinCost} COINS</span>`;
      }
    } else {
      if (descEl) descEl.innerText = `Coins paid! Step 2: Watch ad to collect ${config.rewardText}!`;
      if (stepIcon) stepIcon.innerText = "📢";
      if (stepText) stepText.innerText = `STEP 2: WATCH AD (${adsWatched}/${config.adsRequired} COMPLETED)`;
      if (actionBtn) {
        actionBtn.className = "btn-2d w-full py-3.5 rounded-2xl font-game text-base sm:text-lg tracking-wider text-[#064e3b] bg-gradient-to-b from-emerald-300 via-green-300 to-emerald-500 border-3 border-[#064e3b] shadow-[0_5px_0_#064e3b] flex items-center justify-center space-x-2 animate-bounce";
        actionBtn.innerHTML = `<span>WATCH AD TO COLLECT</span> <span class="text-xl">📢</span>`;
      }
    }
  }

  function handlePopupActionButton() {
    const stageId = pendingStageToCollect;
    if (!stageId) return;

    const st = getBalloonPursuitState();
    const config = STAGE_CONFIGS[stageId - 1];
    const isPaid = (st.stageCoinsPaidMap && st.stageCoinsPaidMap[stageId]) || false;
    const playerCoins = getPlayerBalloonCoins();

    // STEP 1: Pay Balloon Coins First
    if (!isPaid) {
      if (playerCoins < config.coinCost) {
        playBalloonSound('locked');
        showBalloonToast(`Need 🎈 ${config.coinCost} Coins! (You have ${playerCoins}) Play Memory Match to win more!`);
        return;
      }

      setPlayerBalloonCoins(playerCoins - config.coinCost);
      if (!st.stageCoinsPaidMap) st.stageCoinsPaidMap = {};
      st.stageCoinsPaidMap[stageId] = true;

      playBalloonSound('coin');
      showBalloonToast(`Paid 🎈 ${config.coinCost} Coins! Now watch ad to collect! 📺`);
      refreshPopupState();
      renderStagesGrid();
      return;
    }

    // STEP 2: Watch Ad to Collect
    startStageAd();
  }

  function addTestCoins() {
    const coins = getPlayerBalloonCoins() + 100;
    setPlayerBalloonCoins(coins);
    playBalloonSound('coin');
    showBalloonToast(`Added +100 🎈 Balloon Coins! Balance: ${coins}`);
  }

  function startStageAd() {
    const stageId = pendingStageToCollect;
    if (!stageId) return;

    const isJackpot = stageId === 12;
    const st = getBalloonPursuitState();
    const adsWatched = isJackpot ? st.jackpotAdsWatched : ((st.stageAdsWatchedMap && st.stageAdsWatchedMap[stageId]) || 0);

    closeModal('stage-popup-modal');
    openModal('ad-simulator-modal');
    playBalloonSound('pop');

    // 30-Second timer for Jackpot, 15-Second timer for regular stages
    adDuration = isJackpot ? 30 : 15;
    adCountdown = adDuration;
    adReadyToClaim = false;

    // Rewarded interstitial
    if (typeof show_10676091 === 'function') {
      show_10676091().then(() => {
        alert('You have seen an ad!');
      }).catch(e => {
        console.warn('show_10676091 notice in Balloon Pursuit:', e);
      });
    }

    const skipBtn = document.getElementById('ad-skip-btn');
    if (skipBtn) {
      skipBtn.className = "font-game text-xs bg-[#362161] border border-amber-400/60 text-amber-200 px-3 py-1 rounded-xl cursor-not-allowed opacity-70";
      skipBtn.innerHTML = `WAIT: <span id="ad-timer">${adCountdown}</span>s`;
    }

    const timerEl = document.getElementById('ad-timer');
    if (timerEl) timerEl.innerText = adCountdown;

    const progressFill = document.getElementById('ad-progress-fill');
    if (progressFill) progressFill.style.width = '0%';

    const sceneTitle = document.getElementById('ad-scene-title');
    if (sceneTitle) sceneTitle.innerText = isJackpot ? "JACKPOT 30s AD 📢" : "STAGE AD 📢";

    const mainHeading = document.getElementById('ad-main-heading');
    if (mainHeading) mainHeading.innerText = isJackpot ? "JACKPOT AD: 10 DIAMONDS!" : "HOT AIR SKY AD!";

    const subHeading = document.getElementById('ad-sub-heading');
    if (subHeading) {
      subHeading.innerText = isJackpot 
        ? `Ad #${adsWatched + 1} of 10 for Jackpot Loot!`
        : `Watch ad to claim stage reward!`;
    }

    const floatingIcon = document.getElementById('ad-floating-icon');
    if (floatingIcon) floatingIcon.innerText = isJackpot ? "👑" : "🎈";

    const statusMsg = document.getElementById('ad-status-msg');
    if (statusMsg) statusMsg.innerText = "Watching ad to collect stage reward...";

    const claimBtn = document.getElementById('ad-claim-reward-btn');
    if (claimBtn) {
      claimBtn.disabled = true;
      claimBtn.className = "btn-2d w-full py-3 rounded-2xl font-game text-sm tracking-wider text-gray-400 bg-gray-700 border-2 border-gray-600 cursor-not-allowed";
      claimBtn.innerText = `WATCHING AD... (${adCountdown}s)`;
    }

    if (adInterval) clearInterval(adInterval);

    adInterval = setInterval(() => {
      adCountdown--;
      const timerEl = document.getElementById('ad-timer');
      if (timerEl) timerEl.innerText = adCountdown;

      const progressPercent = ((adDuration - adCountdown) / adDuration) * 100;
      const fillEl = document.getElementById('ad-progress-fill');
      if (fillEl) fillEl.style.width = `${progressPercent}%`;

      const claimBtn = document.getElementById('ad-claim-reward-btn');
      if (adCountdown > 0) {
        if (claimBtn) claimBtn.innerText = `WATCHING AD... (${adCountdown}s)`;
      } else {
        clearInterval(adInterval);
        adReadyToClaim = true;
        playBalloonSound('coin');

        const statusEl = document.getElementById('ad-status-msg');
        if (statusEl) statusEl.innerText = "Ad complete! Tap to claim progress!";
        if (claimBtn) {
          claimBtn.disabled = false;
          claimBtn.className = "btn-2d w-full py-3 rounded-2xl font-game text-sm tracking-wider text-[#064e3b] bg-gradient-to-b from-emerald-300 via-green-300 to-emerald-500 border-3 border-[#064e3b] shadow-[0_4px_0_#064e3b] animate-bounce";
          claimBtn.innerHTML = `CLAIM AD REWARD 🎁`;
        }

        const skipEl = document.getElementById('ad-skip-btn');
        if (skipEl) {
          skipEl.className = "btn-2d font-game text-xs bg-emerald-600 border border-emerald-800 text-white px-3 py-1 rounded-xl cursor-pointer";
          skipEl.innerText = "CLAIM ✕";
        }
      }
    }, 1000);
  }

  function finishAdEarlyIfReady() {
    if (adReadyToClaim) {
      claimAdReward();
    } else {
      showBalloonToast(`Please wait ${adCountdown}s for ad to finish! 📺`);
    }
  }

  function claimAdReward() {
    if (!adReadyToClaim) return;
    if (adInterval) clearInterval(adInterval);

    const stageId = pendingStageToCollect;
    if (!stageId) return;

    closeModal('ad-simulator-modal');
    playBalloonSound('coin');
    const st = getBalloonPursuitState();

    // Handle Jackpot 10-Ads Flow
    if (stageId === 12) {
      st.jackpotAdsWatched = (st.jackpotAdsWatched || 0) + 1;
      if (st.jackpotAdsWatched >= 10) {
        grantStageReward(12);
        openModal('victory-modal');
        playBalloonSound('fanfare');
      } else {
        showBalloonToast(`Jackpot Ad #${st.jackpotAdsWatched}/10 Completed! (${10 - st.jackpotAdsWatched} remaining)`);
      }
      updateGrandCardStatus();
      pendingStageToCollect = null;
      return;
    }

    // Handle Regular Stages (1 to 11)
    const config = STAGE_CONFIGS[stageId - 1];
    if (!st.stageAdsWatchedMap) st.stageAdsWatchedMap = {};
    const prevWatched = st.stageAdsWatchedMap[stageId] || 0;
    const newWatched = prevWatched + 1;
    st.stageAdsWatchedMap[stageId] = newWatched;

    if (newWatched >= config.adsRequired) {
      st.currentUnlockedStage = Math.max(st.currentUnlockedStage, stageId + 1);
      grantStageReward(stageId);
      showBalloonToast(`Stage #${stageId} COMPLETE! Won ${config.rewardText}! 🎉`);
      pendingStageToCollect = null;
    } else {
      showBalloonToast(`Ad #${newWatched}/${config.adsRequired} Done for Stage #${stageId}!`);
    }

    renderStagesGrid();
  }

  function grantStageReward(stageId) {
    if (typeof gameState === 'undefined' || !gameState.player) return;
    if (!gameState.energyGenerator) gameState.energyGenerator = {};
    if (!gameState.energyGenerator.fuelCells) {
      gameState.energyGenerator.fuelCells = { green: 0, darkgreen: 0, yellow: 0, orange: 0, red: 0, darkred: 0, pink: 0, purple: 0, blue: 0, lightblue: 0 };
    }
    if (!gameState.reactor) gameState.reactor = { currentEnergy: 0 };

    switch (stageId) {
      case 1: // 🗝️ 1 Key
        gameState.player.chestKeys = (gameState.player.chestKeys || 0) + 1;
        break;
      case 2: // 🎟️ 1 Ticket
        gameState.player.chestTickets = (gameState.player.chestTickets || 0) + 1;
        break;
      case 3: // 🟢⛽ Green Fuel
        gameState.energyGenerator.fuelCells.green = (gameState.energyGenerator.fuelCells.green || 0) + 1;
        break;
      case 4: // ⚡ 100 Energy
        gameState.reactor.currentEnergy = (gameState.reactor.currentEnergy || 0) + 100;
        break;
      case 5: // ⚡ 50 Energy
        gameState.reactor.currentEnergy = (gameState.reactor.currentEnergy || 0) + 50;
        break;
      case 6: // 🌲⛽ 5 Dark Green Fuel
        gameState.energyGenerator.fuelCells.darkgreen = (gameState.energyGenerator.fuelCells.darkgreen || 0) + 5;
        break;
      case 7: // 🧠 10 Brains
        gameState.player.brainCoins = (gameState.player.brainCoins || 0) + 10;
        break;
      case 8: // 💣 3 Bombs
        gameState.player.bombs = (gameState.player.bombs || 0) + 3;
        gameState.player.boomCoins = (gameState.player.boomCoins || 0) + 3;
        break;
      case 9: // 🟢 Green + 🟡 Yellow Fuel
        gameState.energyGenerator.fuelCells.green = (gameState.energyGenerator.fuelCells.green || 0) + 1;
        gameState.energyGenerator.fuelCells.yellow = (gameState.energyGenerator.fuelCells.yellow || 0) + 1;
        break;
      case 10: // 🌲 3 Dark Green Fuel
        gameState.energyGenerator.fuelCells.darkgreen = (gameState.energyGenerator.fuelCells.darkgreen || 0) + 3;
        break;
      case 11: // 🔵 Blue Fuel
        gameState.energyGenerator.fuelCells.blue = (gameState.energyGenerator.fuelCells.blue || 0) + 1;
        break;
      case 12: // Jackpot: 10 Diamonds + Red Fuel + 1 Key + 5 Eggs + 1 Card
        gameState.player.diamonds = (gameState.player.diamonds || 0) + 10;
        gameState.energyGenerator.fuelCells.red = (gameState.energyGenerator.fuelCells.red || 0) + 1;
        gameState.player.chestKeys = (gameState.player.chestKeys || 0) + 1;
        gameState.player.eggs = (gameState.player.eggs || 0) + 5;
        gameState.player.scratchCards = (gameState.player.scratchCards || 0) + 1;
        gameState.player.cardCoins = (gameState.player.cardCoins || 0) + 1;
        break;
    }

    if (typeof updateUI === 'function') updateUI();
    if (typeof saveGame === 'function') saveGame(true);
    if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
      window.firebaseSync.saveToCloudImmediate();
    }
  }

  function handleGrandStageClick() {
    const st = getBalloonPursuitState();
    if (st.currentUnlockedStage <= 11) {
      playBalloonSound('locked');
      showBalloonToast(`Complete Stages 1-11 first to unlock the Jackpot! (${st.currentUnlockedStage - 1}/11 done)`);
      return;
    }

    if ((st.jackpotAdsWatched || 0) >= 10) {
      openModal('victory-modal');
      playBalloonSound('fanfare');
      return;
    }

    pendingStageToCollect = 12;
    const iconEl = document.getElementById('popup-stage-icon');
    if (iconEl) iconEl.innerHTML = `<span class="text-5xl filter drop-shadow">💎👑</span>`;

    const titleEl = document.getElementById('popup-stage-title');
    if (titleEl) titleEl.innerText = "STAGE 12: GRAND JACKPOT";

    const descEl = document.getElementById('popup-stage-desc');
    if (descEl) descEl.innerText = "Watch 10 ads (30s timer each) to claim the ultimate jackpot!";

    const costEl = document.getElementById('popup-cost-display');
    if (costEl) costEl.innerText = "10 ADS (30s)";

    const rewardEl = document.getElementById('popup-reward-display');
    if (rewardEl) rewardEl.innerText = "10💎+Red+Key+5Eggs+Card";

    const progressEl = document.getElementById('popup-ad-progress-text');
    if (progressEl) progressEl.innerText = `JACKPOT ADS (${st.jackpotAdsWatched || 0}/10 COMPLETED)`;

    const watchBtn = document.getElementById('popup-watch-ad-btn');
    if (watchBtn) {
      watchBtn.className = "btn-2d w-full py-3.5 rounded-2xl font-game text-base sm:text-lg tracking-wider text-[#064e3b] bg-gradient-to-b from-emerald-300 via-green-300 to-emerald-500 border-3 border-[#064e3b] shadow-[0_5px_0_#064e3b] flex items-center justify-center space-x-2 animate-bounce";
      watchBtn.innerHTML = `<span>WATCH 30s AD (${(st.jackpotAdsWatched || 0) + 1}/10)</span> <span class="text-xl">📢</span>`;
    }

    openModal('stage-popup-modal');
  }

  function updateGrandCardStatus() {
    const st = getBalloonPursuitState();
    const fillBar = document.getElementById('progression-bar-fill');
    const grandBtn = document.getElementById('grand-collect-btn');
    const card = document.getElementById('grand-stage-card');
    const adsPill = document.getElementById('jackpot-ads-pill');
    const jackpotAds = st.jackpotAdsWatched || 0;

    if (adsPill) adsPill.innerText = `${jackpotAds}/10 ADS (30s)`;

    if (st.currentUnlockedStage > 11) {
      const percentage = Math.round((jackpotAds / 10) * 100);
      if (fillBar) fillBar.style.width = `${percentage}%`;
      if (card) card.classList.add('active-stage-ring');

      if (grandBtn) {
        if (jackpotAds >= 10) {
          grandBtn.className = "btn-2d font-game text-[11px] py-1 px-3 rounded-xl border-3 border-[#064e3b] bg-emerald-400 text-[#064e3b] shadow-[0_3px_0_#064e3b] animate-bounce";
          grandBtn.innerHTML = `CLAIM 👑`;
        } else {
          grandBtn.className = "btn-2d font-game text-[11px] py-1 px-3 rounded-xl border-3 border-[#78350f] bg-gradient-to-b from-amber-300 to-amber-500 text-[#78350f] shadow-[0_3px_0_#78350f] animate-bounce";
          grandBtn.innerHTML = `AD ${jackpotAds + 1}/10 📢`;
        }
      }
    } else {
      const completedCount = Math.min(11, st.currentUnlockedStage - 1);
      const percentage = Math.round((completedCount / 11) * 100);
      if (fillBar) fillBar.style.width = `${percentage}%`;

      if (card) card.classList.remove('active-stage-ring');
      if (grandBtn) {
        grandBtn.className = "btn-2d font-game text-[10px] py-1 px-3 rounded-xl border-2 border-sky-300/40 bg-[#0c4a6e]/90 text-sky-200 cursor-not-allowed";
        grandBtn.innerText = `UNLOCK ${completedCount}/11 FIRST`;
      }
    }
  }

  function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  }

  function showBalloonToast(msg) {
    const toast = document.getElementById('bp-toast') || document.getElementById('toast');
    if (!toast) return;
    toast.innerText = msg;
    toast.classList.remove('opacity-0');
    toast.classList.add('opacity-100');
    setTimeout(() => {
      toast.classList.remove('opacity-100');
      toast.classList.add('opacity-0');
    }, 2300);
  }

  function resetBalloonPursuitGame() {
    closeModal('victory-modal');
    const st = getBalloonPursuitState();
    st.currentUnlockedStage = 1;
    st.jackpotAdsWatched = 0;
    st.stageAdsWatchedMap = {};
    st.stageCoinsPaidMap = {};
    renderStagesGrid();
    showBalloonToast('Balloon Pursuit Reset! Collect all 12 stages! 🎈');
    playBalloonSound('pop');
  }

  // 27-Hour Countdown Timer
  let bpSecondsLeft = 27 * 3600 + 29 * 60 + 17;
  let bpCountdownInterval = null;
  function startBalloonTimer() {
    if (bpCountdownInterval) return;
    bpCountdownInterval = setInterval(() => {
      if (bpSecondsLeft > 0) {
        bpSecondsLeft--;
        const h = String(Math.floor(bpSecondsLeft / 3600)).padStart(2, '0');
        const m = String(Math.floor((bpSecondsLeft % 3600) / 60)).padStart(2, '0');
        const s = String(bpSecondsLeft % 60).padStart(2, '0');
        const el = document.getElementById('countdown-timer');
        if (el) el.innerText = `${h}:${m}:${s}`;
      }
    }, 1000);
  }

  // Global window bindings
  window.startMemoryMatchGame = startMemoryMatchGame;
  window.claimMemoryMatchReward = claimMemoryMatchReward;
  window.updateBrainCoinPill = updateBrainCoinPill;
  window.updateBalloonCoinPill = updateBalloonCoinPill;
  window.openBalloonPursuitModal = openBalloonPursuitModal;
  window.closeBalloonPursuitModal = closeBalloonPursuitModal;
  window.handleGrandStageClick = handleGrandStageClick;
  window.handlePopupActionButton = handlePopupActionButton;
  window.finishAdEarlyIfReady = finishAdEarlyIfReady;
  window.claimAdReward = claimAdReward;
  window.resetBalloonPursuitGame = resetBalloonPursuitGame;
  window.addTestCoins = addTestCoins;
  window.openModal = openModal;
  window.closeModal = closeModal;
  window.showToast = showBalloonToast;

  window.initMemoryMatchPage = function() {
    initDOMElements();
    updateBrainCoinPill();
    updateBalloonCoinPill();
    if (!isGameActive) {
      startMemoryMatchGame();
    }
  };
})();
