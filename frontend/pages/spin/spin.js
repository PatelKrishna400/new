/* ==========================================================================
   LUCKY SPIN WHEEL MINI-GAME (pages/spin/spin.js)
   - 8 Precise Slices:
     0: 👑 1 Crown (Collect 👑 for Level Mystery Gift!)
     1: 🪙 50 Coins
     2: 🔑 1 Winning Key
     3: 🎴 1 Scratch Card
     4: ❌ Try Again
     5: 🎟️ 1 Spin Ticket
     6: 🪙 1 Gold Coin (Jackpot)
     7: 💎 5 Diamonds
   - Mathematically exact pointer alignment at 12 o'clock
   - Clean White Luxury Wedges for high contrast
   - Crown Quest Level Tab: Track and collect 👑 crowns to unlock Grand Gifts
   - Dynamic 24-LED perimeter chaser ring
   - Realistic flapper tick audio & haptic feedback
   ========================================================================== */

const SPIN_PRIZES = [
  { label: '1 Crown', type: 'crown', amount: 1, icon: '👑', isCrown: true, rarity: 'epic' },
  { label: '10 Party Coins', type: 'party_coins', amount: 10, icon: '🎉', rarity: 'common' },
  { label: '1 Key', type: 'keys', amount: 1, icon: '🔑', rarity: 'rare' },
  { label: '1 Card', type: 'card', amount: 1, icon: '🎴', rarity: 'rare' },
  { label: 'Try Again', type: 'none', amount: 0, icon: '❌', rarity: 'common' },
  { label: '1 Ticket', type: 'ticket', amount: 1, icon: '🎟️', rarity: 'rare' },
  { label: '500 Coins', type: 'coins', amount: 500, icon: '🪙', isJackpot: true, rarity: 'jackpot' },
  { label: '20 Party Coins', type: 'party_coins', amount: 20, icon: '🎉', rarity: 'rare' }
];

// 🧨 DYNAMITE WHEEL (🎉 SPINNER PRIZES: 1, 2, 5, 10, 15, 20, 25, 50, Try Again)
const DYNAMITE_PRIZES = [
  { label: '1 Dynamite', type: 'dynamite', amount: 1, icon: '🧨', rarity: 'common' },     // slice 0 (0°)
  { label: '2 Dynamite', type: 'dynamite', amount: 2, icon: '🧨', rarity: 'common' },     // slice 1 (40°)
  { label: '5 Dynamite', type: 'dynamite', amount: 5, icon: '🧨', rarity: 'common' },     // slice 2 (80°)
  { label: '10 Dynamite', type: 'dynamite', amount: 10, icon: '🧨', rarity: 'rare' },     // slice 3 (120°)
  { label: '15 Dynamite', type: 'dynamite', amount: 15, icon: '🧨', rarity: 'rare' },     // slice 4 (160°)
  { label: 'Try Again', type: 'none', amount: 0, icon: '❌', rarity: 'common' },           // slice 5 (200°)
  { label: '20 Dynamite', type: 'dynamite', amount: 20, icon: '🧨', rarity: 'epic' },     // slice 6 (240°)
  { label: '25 Dynamite', type: 'dynamite', amount: 25, icon: '🧨', rarity: 'epic' },     // slice 7 (280°)
  { label: '50 Dynamite', type: 'dynamite', amount: 50, icon: '🧨', isJackpot: true, rarity: 'jackpot' } // slice 8 (320°)
];

let currentSpinWheelTab = 'ticket'; // 'ticket' | 'dynamite'
let currentPartyBet = 1; // 1 | 10 | 20

// ==========================================================================
// KING EVENT MATHEMATICAL ENGINE (1 - 1000 LEVELS WAVE PROGRESSION)
// ==========================================================================

/**
 * Returns the target crowns limit for a given King Event level (1 - 1000).
 * Wave form requirements:
 * - Level 1: 5
 * - Level 5: 550 (crest)
 * - Level 7: 50 (trough)
 * - Level 10: 730 (crest)
 * - Scales procedurally up to Level 1000 with oscillating wave cycles.
 */
function getKingLevelTarget(level) {
  const lvl = Math.max(1, Math.min(1000, Math.floor(level || 1)));
  if (lvl === 1) return 5;
  if (lvl === 5) return 550;
  if (lvl === 7) return 50;
  if (lvl === 10) return 730;

  const cycle = Math.floor((lvl - 1) / 5);
  const peakVal = 550 + (cycle * 180);
  const troughVal = Math.round(50 + ((cycle - 1) * 15));
  const pos = (lvl - 1) % 5;

  if (pos === 4) return peakVal;
  if (pos === 1 && cycle >= 1) return troughVal;
  if (pos === 0) return (cycle === 0 ? 5 : Math.round(troughVal * 2.6));
  if (pos === 1) return 30;
  if (pos === 2) return Math.round(troughVal + (peakVal - troughVal) * 0.25);
  if (pos === 3) return Math.round(troughVal + (peakVal - troughVal) * 0.62);
  return 50;
}
window.getKingLevelTarget = getKingLevelTarget;

/**
 * Calculates the inverse probability for winning the 👑 Crown slice (slice 0).
 * Winning probability is strictly inverse to the level's limit:
 * - Small limits (5, 50) have high winning chance (45% down to 20%).
 * - High limits (550, 730) have lower winning chance (~10% down to ~8%).
 * - Always clamped between 5% and 48%.
 */
function getCrownWinProbability(targetLimit) {
  const base = 5;
  const p = 0.05 + 0.40 * Math.pow(base / Math.max(base, targetLimit), 0.45);
  return Math.min(0.48, Math.max(0.05, p));
}
window.getCrownWinProbability = getCrownWinProbability;

/**
 * Calculates the crown collection amount per hit.
 * For wave crests with high limits (e.g. 550, 730), rewards proportional crown chunks
 * so progress is steady and exciting while respecting the wave scale.
 */
function getCrownGainPerHit(targetLimit) {
  if (targetLimit <= 50) return 1;
  return Math.max(1, Math.round(targetLimit / 50));
}
window.getCrownGainPerHit = getCrownGainPerHit;

/**
 * Calculates the rich level rewards for a given King Event level.
 * - Coins: starts at 10 and increases by +10 per level (10 * level).
 * - Diamonds: cyclic increase level-wise.
 * - Keys, tickets, and cards scale steadily.
 */
function getKingLevelRewards(level) {
  const lvl = Math.max(1, Math.min(1000, Math.floor(level || 1)));
  const coins = 10 * lvl;
  const keys = Math.min(25, 2 + Math.floor(lvl / 50));
  const tickets = Math.min(50, 3 + Math.floor(lvl / 25));
  const cards = Math.min(25, 2 + Math.floor(lvl / 50));
  return { coins, diamonds: 0, keys, tickets, cards };
}
window.getKingLevelRewards = getKingLevelRewards;

/**
 * Classifies wave stage for visual tag: Crest vs Trough vs Stage
 */
function getKingWaveStageInfo(level, target) {
  const pos = (level - 1) % 5;
  if (level === 5 || level === 10 || pos === 4) {
    return { type: 'crest', text: '⚡ WAVE CREST' };
  } else if (level === 7 || (pos === 1 && level > 5)) {
    return { type: 'trough', text: '🌊 WAVE TROUGH' };
  } else {
    return { type: 'normal', text: `STAGE ${pos + 1}/5` };
  }
}
window.getKingWaveStageInfo = getKingWaveStageInfo;

// Authoritative Crown Quest State
function getSpinState() {
  if (typeof gameState === 'undefined') return { level: 1, crowns: 0, targetCrowns: 5, giftsClaimed: 0 };
  if (!gameState.spinState) {
    gameState.spinState = {
      level: 1,
      crowns: 0,
      targetCrowns: 5,
      giftsClaimed: 0
    };
  }
  if (!gameState.spinState.targetCrowns) {
    gameState.spinState.targetCrowns = getKingLevelTarget(gameState.spinState.level || 1);
  }
  return gameState.spinState;
}

// Initialize 24 circular LED Chaser Bulbs around the perimeter of active wheels
function initSpinChaserBulbs() {
  ['spinChaserRing', 'spinPartyChaserRing'].forEach(ringId => {
    const ring = document.getElementById(ringId);
    if (!ring) return;
    if (ring.children.length === 24) return;
    ring.innerHTML = '';

    const totalBulbs = 24;
    for (let i = 0; i < totalBulbs; i++) {
      const bulb = document.createElement('div');
      bulb.className = `chaser-bulb ${i % 2 === 0 ? '' : 'alt'}`;
      const angle = (i / totalBulbs) * 2 * Math.PI - (Math.PI / 2);
      const leftPercent = 50 + 49.5 * Math.cos(angle);
      const topPercent = 50 + 49.5 * Math.sin(angle);
      bulb.style.left = `${leftPercent.toFixed(2)}%`;
      bulb.style.top = `${topPercent.toFixed(2)}%`;
      bulb.style.animationDelay = `${(i * 0.08).toFixed(2)}s`;
      ring.appendChild(bulb);
    }
  });
}

// Synthesize realistic mechanical click sound for wheel pegs
function playWheelTickSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!window.wheelAudioCtx) window.wheelAudioCtx = new AudioCtx();
    const ctx = window.wheelAudioCtx;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(950 + Math.random() * 150, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.035);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.035);
  } catch (e) {}
}

// Unified Spin click handler
function handleSpinButtonClick() {
  if (gameState.rewardState && gameState.rewardState.isSpinning) return;
  const tickets = Math.max(0, parseInt(gameState.player && gameState.player.chestTickets) || 0);
  if (tickets >= 1) {
    spinLuckyWheel();
  } else {
    if (typeof showGameEntryRequirementModal === 'function') {
      showGameEntryRequirementModal('1 Spin Ticket', '🎟️', 'Lucky Spin Wheel');
    } else if (typeof showFloatingToast === 'function') {
      showFloatingToast('🎟️ You need 1 Spin Ticket to spin the wheel!');
    }
    if (typeof sfx !== 'undefined' && typeof sfx.playTapSound === 'function') {
      sfx.playTapSound(1);
    }
  }
}

// Update King Event UI (Only shows 👑 loading bar, 👑 collected / target, and winning prizes in emoji)
function updateSpinLevelUI() {
  const state = getSpinState();
  const level = Math.max(1, Math.min(1000, state.level || 1));
  const targetLimit = state.targetCrowns || getKingLevelTarget(level);
  state.targetCrowns = targetLimit;

  const fillEl = document.getElementById('spinCrownBarFill');
  const countEl = document.getElementById('spinCrownCountText');
  const rewardPreviewEl = document.getElementById('spinLevelRewardPreviewText');

  const crowns = state.crowns || 0;
  const pct = Math.min(100, Math.max(0, (crowns / targetLimit) * 100));
  if (fillEl) fillEl.style.width = `${pct}%`;
  if (countEl) countEl.innerHTML = `👑 ${crowns} / ${targetLimit}`;

  const rewards = getKingLevelRewards(level);
  if (rewardPreviewEl) {
    rewardPreviewEl.innerHTML = `🎁 🪙 +${rewards.coins} • 🗝️ +${rewards.keys} • 🎟️ +${rewards.tickets} • 🎴 +${rewards.cards}`;
  }
}
window.updateSpinLevelUI = updateSpinLevelUI;

// Update Ticket Balance header and Tab in Spin Page
function updateSpinTicketUI() {
  const countHeaderEl = document.getElementById('spinTicketHeaderCount');
  const countTabEl = document.getElementById('spinTicketCountVal');
  const tickets = (gameState.player && gameState.player.chestTickets) || 0;

  if (countHeaderEl) countHeaderEl.textContent = tickets.toString();
  if (countTabEl) countTabEl.textContent = tickets.toString();

  const btn = document.getElementById('btnSpinWheel');
  const btnIcon = document.getElementById('spinBtnIcon');
  const btnText = document.getElementById('spinBtnText');
  const centerHubLabel = document.getElementById('spinCenterHubLabel');

  const isSpinning = gameState.rewardState && gameState.rewardState.isSpinning;

  if (isSpinning) {
    if (btn) {
      btn.disabled = true;
      btn.className = 'spin-action-main-btn spin-mode';
    }
    if (btnIcon) btnIcon.textContent = '⚡';
    if (btnText) btnText.textContent = 'SPINNING WHEEL...';
    if (centerHubLabel) centerHubLabel.textContent = '...';
  } else if (tickets > 0) {
    if (btn) {
      btn.disabled = false;
      btn.className = 'spin-action-main-btn spin-mode';
    }
    if (btnIcon) btnIcon.textContent = '🎡';
    if (btnText) btnText.textContent = `SPIN THE WHEEL (${tickets} 🎫)`;
    if (centerHubLabel) centerHubLabel.textContent = 'SPIN';
  } else {
    // 0 tickets mode
    if (btn) {
      btn.disabled = false;
      btn.className = 'spin-action-main-btn no-ticket-mode';
    }
    if (btnIcon) btnIcon.textContent = '🎟️';
    if (btnText) btnText.textContent = 'NEED 1 TICKET TO SPIN (0 🎫)';
    if (centerHubLabel) centerHubLabel.textContent = '0 🎫';
  }

  // Update Party Coins & Dynamite Coins balances
  const partyHeaderEl = document.getElementById('spinPartyHeaderCount');
  const partyCoins = (gameState.player && (gameState.player.partyCoins !== undefined ? gameState.player.partyCoins : gameState.player.blueCoins)) || 0;
  if (partyHeaderEl) partyHeaderEl.textContent = typeof formatNumber === 'function' ? formatNumber(partyCoins) : partyCoins.toString();

  const dynamiteHeaderEl = document.getElementById('spinDynamiteHeaderCount');
  const dynamiteCoins = (gameState.player && gameState.player.dynamiteCoins) || 0;
  if (dynamiteHeaderEl) dynamiteHeaderEl.textContent = typeof formatNumber === 'function' ? formatNumber(dynamiteCoins) : dynamiteCoins.toString();

  // Update Dynamite Wheel Action Button State
  const partyBtn = document.getElementById('btnSpinPartyWheel');
  const partyBtnIcon = document.getElementById('spinPartyBtnIcon');
  const partyBtnText = document.getElementById('spinPartyBtnText');
  const partyHubLabel = document.getElementById('spinPartyCenterHubLabel');
  const isPartySpinning = gameState.rewardState && gameState.rewardState.isPartySpinning;

  if (isPartySpinning) {
    if (partyBtn) {
      partyBtn.disabled = true;
      partyBtn.className = 'spin-action-main-btn dynamite-mode';
    }
    if (partyBtnIcon) partyBtnIcon.textContent = '⚡';
    if (partyBtnText) partyBtnText.textContent = 'SPINNING DYNAMITE...';
    if (partyHubLabel) partyHubLabel.textContent = '...';
  } else if (partyCoins >= currentPartyBet) {
    if (partyBtn) {
      partyBtn.disabled = false;
      partyBtn.className = 'spin-action-main-btn dynamite-mode';
    }
    if (partyBtnIcon) partyBtnIcon.textContent = '🧨';
    if (partyBtnText) partyBtnText.textContent = `SPIN DYNAMITE WHEEL (${currentPartyBet} 🎉)`;
    if (partyHubLabel) partyHubLabel.textContent = 'SPIN';
  } else {
    if (partyBtn) {
      partyBtn.disabled = false;
      partyBtn.className = 'spin-action-main-btn dynamite-mode no-ticket-mode';
    }
    if (partyBtnIcon) partyBtnIcon.textContent = '🎉';
    if (partyBtnText) partyBtnText.textContent = `NEED ${currentPartyBet} 🎉 COINS (${partyCoins} 🎉)`;
    if (partyHubLabel) partyHubLabel.textContent = `${partyCoins} 🎉`;
  }

  updateSpinLevelUI();
}

// Trigger celebratory particle explosion for big wins
function triggerSpinConfetti() {
  const container = document.getElementById('pageSpin');
  if (!container) return;

  const colors = ['#f59e0b', '#fde047', '#38bdf8', '#10b981', '#a855f7', '#ec4899'];
  for (let i = 0; i < 28; i++) {
    const p = document.createElement('div');
    p.className = 'ambient-particle';
    const size = Math.random() * 8 + 4;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    p.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    p.style.left = `${Math.random() * 80 + 10}%`;
    p.style.top = '35%';
    p.style.position = 'absolute';
    p.style.zIndex = '30';
    p.style.opacity = '1';
    p.style.transform = `translate(${Math.random() * 160 - 80}px, ${Math.random() * -120 - 40}px) rotate(${Math.random() * 360}deg)`;
    p.style.transition = 'all 1.6s cubic-bezier(0.1, 0.8, 0.2, 1)';
    container.appendChild(p);

    setTimeout(() => {
      p.style.opacity = '0';
      p.style.transform = `translate(${Math.random() * 200 - 100}px, ${Math.random() * 150 + 100}px) scale(0.3)`;
      setTimeout(() => p.remove(), 1600);
    }, 50);
  }
}

// Master Lucky Wheel Spin Execution
function spinLuckyWheel() {
  if (gameState.rewardState && gameState.rewardState.isSpinning) return;

  // Strict Entry Requirement (Req 11): 1 Ticket required
  const tickets = (gameState.player && gameState.player.chestTickets) || 0;
  if (tickets < 1) {
    if (typeof showGameEntryRequirementModal === 'function') {
      showGameEntryRequirementModal('1 Spin Ticket', '🎟️', 'Lucky Spin Wheel');
    }
    return;
  }
  gameState.player.chestTickets--;

  if (!gameState.rewardState) gameState.rewardState = {};
  gameState.rewardState.isSpinning = true;
  updateSpinTicketUI();
  sfx.playTapSound(3);

  // Daily Stats tracking
  if (typeof checkDailyStatsDate === 'function') checkDailyStatsDate();
  if (gameState.dailyStats) gameState.dailyStats.spins = (gameState.dailyStats.spins || 0) + 1;
  if (typeof recordTaskEvent === 'function') {
    recordTaskEvent('use_ticket', 1);
    recordTaskEvent('spin_wheel', 1);
  }

  // King Event Probability Distribution (Inverse to Level Limit):
  const spinState = getSpinState();
  const level = Math.max(1, Math.min(1000, spinState.level || 1));
  const targetLimit = spinState.targetCrowns || getKingLevelTarget(level);
  const crownProb = getCrownWinProbability(targetLimit);

  const COIN_JACKPOT_PROB = 0.05;

  const rand = Math.random();
  let sliceIndex;
  if (rand < COIN_JACKPOT_PROB) {
    sliceIndex = 6; // 🪙 500 Coins Jackpot
  } else if (rand < COIN_JACKPOT_PROB + crownProb) {
    sliceIndex = 0; // 👑 King Crown slice (inverse to level limit)
  } else {
    const nonJackpotSlices = [1, 2, 3, 4, 5, 7];
    sliceIndex = nonJackpotSlices[Math.floor(Math.random() * nonJackpotSlices.length)];
  }

  const prizes = SPIN_PRIZES;
  const prize = prizes[sliceIndex];

  // Mathematical rotation calculation:
  // Slices are laid out clockwise starting with slice 0 at 12 o'clock (0°).
  // Target angle: `(360 - sliceIndex * 45) % 360`
  const fullSpins = 6; // 6 fast full rotations
  const currentRotation = gameState.rewardState.spinRotation || 0;
  const targetRemainder = (360 - (sliceIndex * 45)) % 360;
  const currentRemainder = currentRotation % 360;
  let diff = targetRemainder - currentRemainder;
  if (diff <= 0) diff += 360;
  const newRotation = currentRotation + (fullSpins * 360) + diff;
  gameState.rewardState.spinRotation = newRotation;

  const wheelEl = document.getElementById('spinWheelCircle');
  const wheelFrame = document.getElementById('spinWheelFrame');
  const pointer = document.getElementById('spinPointerArrow');

  if (wheelFrame) wheelFrame.classList.add('spinning-active');

  // Realistic peg-flapper click rhythm
  const tickDelays = [60, 60, 65, 70, 75, 85, 95, 110, 130, 155, 185, 225, 275, 335, 410, 500, 610];
  let accumulatedDelay = 0;
  tickDelays.forEach(delay => {
    accumulatedDelay += delay;
    setTimeout(() => {
      if (gameState.rewardState && gameState.rewardState.isSpinning) {
        playWheelTickSound();
        if (pointer) {
          pointer.classList.remove('ticking');
          void pointer.offsetWidth;
          pointer.classList.add('ticking');
        }
        if (typeof triggerTelegramHaptic === 'function') triggerTelegramHaptic('light');
      }
    }, accumulatedDelay);
  });

  if (wheelEl) {
    wheelEl.style.transition = 'transform 3.8s cubic-bezier(0.12, 0.85, 0.2, 1)';
    wheelEl.style.transform = `rotate(${newRotation}deg)`;
  }

  setTimeout(() => {
    if (wheelFrame) wheelFrame.classList.remove('spinning-active');
    gameState.rewardState.isSpinning = false;

    if (prize.type === 'none') {
      sfx.playTapSound(1);
      if (typeof showFloatingToast === 'function') {
        showFloatingToast('❌ Missed this time! Better luck next spin!');
      }
      updateSpinTicketUI();
      updateUI();
      saveGame();
      if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
        window.firebaseSync.saveToCloudImmediate();
      }
    } else if (prize.isCrown) {
      // 👑 Crown slice hit!
      const spinState = getSpinState();
      const currentLevel = Math.max(1, Math.min(1000, spinState.level || 1));
      const currentLimit = spinState.targetCrowns || getKingLevelTarget(currentLevel);
      const crownGain = getCrownGainPerHit(currentLimit);

      spinState.crowns = (spinState.crowns || 0) + crownGain;
      sfx.playLevelUpSound();
      triggerSpinConfetti();

      updateSpinLevelUI();
      updateSpinTicketUI();
      updateUI();
      saveGame();
      if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
        window.firebaseSync.saveToCloudImmediate();
      }

      if (spinState.crowns >= currentLimit) {
        // Goal reached -> reveal the Grand Mystery Gift!
        setTimeout(() => {
          showMysteryGiftModal();
        }, 500);
      } else {
        showSpinPrizeModal({
          label: `${crownGain} Crown${crownGain > 1 ? 's' : ''} Collected`,
          type: 'crown',
          amount: crownGain,
          icon: '👑',
          isCrown: true,
          rarity: 'epic'
        });
      }
    } else {
      sfx.playLevelUpSound();
      triggerSpinConfetti();
      showSpinPrizeModal(prize);
    }
  }, 4000);
}

// Global variable tracking pending uncollected spin reward
window.currentPendingSpinPrize = null;

// Display Winning Prize Popup Modal
function showSpinPrizeModal(prize) {
  window.currentPendingSpinPrize = prize;

  const backdrop = document.getElementById('spinRewardBackdrop');
  const modalBadge = document.getElementById('spinModalBadge');
  const modalIcon = document.getElementById('spinModalIcon');
  const modalTitle = document.getElementById('spinModalTitle');
  const modalSubtitle = document.getElementById('spinModalSubtitle');
  const modal2xPreview = document.getElementById('spinModal2xPreview');
  const modal2xText = document.getElementById('spinModal2xText');
  const doubleBtn = document.getElementById('btnSpinDoubleReward');
  const doubleBtnText = document.getElementById('spinDoubleBtnText');
  const claimBtnText = document.getElementById('spinClaimBtnText');

  const cleanLabel = prize.label.replace(/^\d+\s*/, '');
  const doubleAmount = prize.amount * 2;

  if (modalBadge) {
    if (prize.isCrown) {
      modalBadge.className = 'spin-modal-badge winner';
      modalBadge.textContent = '👑 CROWN COLLECTED!';
    } else if (prize.isJackpot) {
      modalBadge.className = 'spin-modal-badge winner';
      modalBadge.textContent = '👑 GRAND JACKPOT WINNER!';
    } else {
      modalBadge.className = 'spin-modal-badge winner';
      modalBadge.textContent = '🎉 PRIZE UNLOCKED!';
    }
  }

  if (modalIcon) {
    modalIcon.textContent = prize.icon || '🪙';
  }

  if (modalTitle) {
    if (prize.isCrown) {
      modalTitle.textContent = `YOU COLLECTED ${prize.amount} 👑 CROWN${prize.amount > 1 ? 'S' : ''}!`;
    } else {
      modalTitle.textContent = `YOU WON ${prize.amount} ${cleanLabel.toUpperCase()}!`;
    }
  }

  if (modalSubtitle) {
    if (prize.isCrown) {
      const state = getSpinState();
      modalSubtitle.textContent = `Crown progress: ${state.crowns} / ${state.targetCrowns} collected toward Level ${state.level || 1} Gift!`;
    } else if (prize.isJackpot) {
      modalSubtitle.textContent = `Ultra-rare 10% Jackpot landed! Choose your claim option below.`;
    } else {
      modalSubtitle.textContent = `Fortune Wheel slice unlocked! Claim your reward or double it.`;
    }
  }

  if (prize.isCrown) {
    // Crowns don't need 2X ads
    if (modal2xPreview) modal2xPreview.style.display = 'none';
    if (doubleBtn) doubleBtn.style.display = 'none';
    if (claimBtnText) claimBtnText.textContent = 'Awesome! (Continue)';
  } else {
    if (modal2xPreview) modal2xPreview.style.display = 'flex';
    if (doubleBtn) doubleBtn.style.display = 'flex';
    if (modal2xText) {
      modal2xText.innerHTML = `Watch 1 ad to double this to <strong>+${doubleAmount} ${cleanLabel} (2X Profit)</strong>!`;
    }
    if (doubleBtnText) {
      doubleBtnText.textContent = `DOUBLE TO +${doubleAmount} (2X)`;
    }
    if (claimBtnText) {
      claimBtnText.textContent = `Claim Regular (+${prize.amount})`;
    }
  }

  if (backdrop) {
    backdrop.classList.add('active');
  }
}

// Award inventory prize helper
function applySpinPrize(prize, multiplier = 1) {
  if (!prize || !prize.amount) return;
  const finalAmount = prize.amount * multiplier;

  if (prize.type === 'coins') {
    gameState.player.coins += finalAmount;
  } else if (prize.type === 'party_coins' || prize.type === 'party' || prize.type === 'blue_coins' || prize.type === 'blueCoins') {
    gameState.player.partyCoins = (gameState.player.partyCoins || gameState.player.blueCoins || 0) + finalAmount;
    gameState.player.blueCoins = gameState.player.partyCoins;
  } else if (prize.type === 'dynamite' || prize.type === 'dynamite_coins') {
    gameState.player.dynamiteCoins = (gameState.player.dynamiteCoins || 0) + finalAmount;
  } else if (prize.type === 'keys') {
    gameState.player.chestKeys = (gameState.player.chestKeys || 0) + finalAmount;
    if (gameState.goal) gameState.goal.currentKeys = Math.min(gameState.goal.targetKeys, (gameState.goal.currentKeys || 0) + finalAmount);
  } else if (prize.type === 'card') {
    gameState.player.scratchCards = (gameState.player.scratchCards !== undefined ? gameState.player.scratchCards : 0) + finalAmount;
  } else if (prize.type === 'ticket') {
    gameState.player.chestTickets = (gameState.player.chestTickets || 0) + finalAmount;
  } else if (prize.type === 'crown') {
    // Crown already counted in spinLuckyWheel
    updateSpinLevelUI();
  }

  updateSpinTicketUI();
  updateUI();
  saveGame();
  if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
    window.firebaseSync.saveToCloudImmediate();
  }
}

// Action 1: 2X Profit (Watch Ad & Double Reward)
function claimDoubleSpinReward() {
  if (!window.currentPendingSpinPrize) return;
  const prize = window.currentPendingSpinPrize;
  window.currentPendingSpinPrize = null;

  const backdrop = document.getElementById('spinRewardBackdrop');
  if (backdrop) backdrop.classList.remove('active');

  const handleDoubleSuccess = () => {
    applySpinPrize(prize, 2);
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`⚡ 2X PROFIT! Claimed +${prize.amount * 2} ${prize.label}!`);
    }
    if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') {
      sfx.playLevelUpSound();
    }
  };

  // Rewarded interstitial
  if (typeof show_10676091 === 'function') {
    show_10676091().then(() => {
      // You need to add your user reward function here, which will be executed after the user watches the ad.
      // For more details, please refer to the detailed instructions.
      alert('You have seen an ad!');
      handleDoubleSuccess();
    }).catch(e => {
      console.warn('show_10676091 notice:', e);
      handleDoubleSuccess();
    });
  } else if (typeof showRewardedAd === 'function') {
    showRewardedAd(handleDoubleSuccess, () => {
      applySpinPrize(prize, 1);
      if (typeof showFloatingToast === 'function') {
        showFloatingToast(`Claimed regular +${prize.amount} ${prize.label}`);
      }
    });
  } else {
    handleDoubleSuccess();
  }
}

// Action 2: Claim Regular Reward
function claimRegularSpinReward() {
  if (!window.currentPendingSpinPrize) return;
  const prize = window.currentPendingSpinPrize;
  window.currentPendingSpinPrize = null;

  const backdrop = document.getElementById('spinRewardBackdrop');
  if (backdrop) backdrop.classList.remove('active');

  applySpinPrize(prize, 1);
  if (typeof showFloatingToast === 'function') {
    showFloatingToast(`✓ Claimed +${prize.amount} ${prize.label}!`);
  }
  if (typeof sfx !== 'undefined' && typeof sfx.playTapSound === 'function') {
    sfx.playTapSound(1);
  }
}

// Close Modal Backdrop
function closeSpinRewardModal(event) {
  const backdrop = document.getElementById('spinRewardBackdrop');
  if (backdrop) backdrop.classList.remove('active');

  if (window.currentPendingSpinPrize) {
    const prize = window.currentPendingSpinPrize;
    window.currentPendingSpinPrize = null;
    applySpinPrize(prize, 1);
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`✓ Claimed +${prize.amount} ${prize.label}!`);
    }
  }
}

// ==========================================================================
// GRAND MYSTERY GIFT POPUP MODAL (WHEN 👑 CROWNS GOAL IS REACHED)
// ==========================================================================
function showMysteryGiftModal() {
  const spinState = getSpinState();
  const level = Math.max(1, Math.min(1000, spinState.level || 1));
  const rewards = getKingLevelRewards(level);

  const backdrop = document.getElementById('spinGiftModalBackdrop');
  const titleEl = document.getElementById('spinGiftTitle');
  const subEl = document.getElementById('spinGiftSub');
  const coinsValEl = document.getElementById('spinGiftCoinsVal');
  const keysValEl = document.getElementById('spinGiftKeysVal');
  const ticketsValEl = document.getElementById('spinGiftTicketsVal');
  const cardsValEl = document.getElementById('spinGiftCardsVal');
  const claimBtn = document.getElementById('btnClaimMysteryGift');

  if (titleEl) titleEl.textContent = `👑 KING EVENT GIFT UNLOCKED!`;
  if (subEl) subEl.textContent = `You collected all ${spinState.targetCrowns} 👑 King Crowns and unlocked the Mystery Gift!`;

  if (coinsValEl) coinsValEl.textContent = `+${rewards.coins}`;
  if (keysValEl) keysValEl.textContent = `+${rewards.keys}`;
  if (ticketsValEl) ticketsValEl.textContent = `+${rewards.tickets}`;
  if (cardsValEl) cardsValEl.textContent = `+${rewards.cards}`;

  if (claimBtn) {
    claimBtn.onclick = claimMysteryGiftReward;
    const btnSpan = claimBtn.querySelector('span');
    if (btnSpan) btnSpan.textContent = '🎉 CLAIM ALL GIFTS';
  }

  if (backdrop) backdrop.classList.add('active');
  triggerSpinConfetti();
  if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') {
    sfx.playLevelUpSound();
  }
}
window.showMysteryGiftModal = showMysteryGiftModal;

function showMysteryGiftPreview() {
  const spinState = getSpinState();
  const level = Math.max(1, Math.min(1000, spinState.level || 1));
  const rewards = getKingLevelRewards(level);

  const backdrop = document.getElementById('spinGiftModalBackdrop');
  const titleEl = document.getElementById('spinGiftTitle');
  const subEl = document.getElementById('spinGiftSub');
  const coinsValEl = document.getElementById('spinGiftCoinsVal');
  const keysValEl = document.getElementById('spinGiftKeysVal');
  const ticketsValEl = document.getElementById('spinGiftTicketsVal');
  const cardsValEl = document.getElementById('spinGiftCardsVal');
  const claimBtn = document.getElementById('btnClaimMysteryGift');

  if (titleEl) titleEl.textContent = `👑 KING EVENT REWARD PREVIEW`;
  if (subEl) subEl.textContent = `Collect ${spinState.targetCrowns} 👑 King Crowns to unlock this Gift!`;

  if (coinsValEl) coinsValEl.textContent = `+${rewards.coins}`;
  if (keysValEl) keysValEl.textContent = `+${rewards.keys}`;
  if (ticketsValEl) ticketsValEl.textContent = `+${rewards.tickets}`;
  if (cardsValEl) cardsValEl.textContent = `+${rewards.cards}`;

  if (claimBtn) {
    claimBtn.onclick = () => {
      if (backdrop) backdrop.classList.remove('active');
    };
    const btnSpan = claimBtn.querySelector('span');
    if (btnSpan) btnSpan.textContent = 'GOT IT (BACK TO SPIN)';
  }

  if (backdrop) backdrop.classList.add('active');
}
window.showMysteryGiftPreview = showMysteryGiftPreview;

function claimMysteryGiftReward() {
  const spinState = getSpinState();
  const backdrop = document.getElementById('spinGiftModalBackdrop');
  if (backdrop) backdrop.classList.remove('active');

  const currentLevel = Math.max(1, Math.min(1000, spinState.level || 1));
  const rewards = getKingLevelRewards(currentLevel);

  gameState.player.coins += rewards.coins;
  // Diamonds removed from King Event rewards
  gameState.player.chestKeys = (gameState.player.chestKeys || 0) + rewards.keys;
  gameState.player.chestTickets = (gameState.player.chestTickets || 0) + rewards.tickets;
  gameState.player.scratchCards = (gameState.player.scratchCards !== undefined ? gameState.player.scratchCards : 0) + rewards.cards;

  // Progress to next King Event Level up to 1000
  const nextLevel = Math.min(1000, currentLevel + 1);
  spinState.level = nextLevel;
  spinState.crowns = 0;
  spinState.targetCrowns = getKingLevelTarget(nextLevel);
  spinState.giftsClaimed = (spinState.giftsClaimed || 0) + 1;

  updateSpinLevelUI();
  updateSpinTicketUI();
  updateUI();
  saveGame();
  if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
    window.firebaseSync.saveToCloudImmediate();
  }

  if (typeof showFloatingToast === 'function') {
    showFloatingToast(`👑 KING EVENT GIFT CLAIMED! +${rewards.coins} 🪙, +${rewards.keys} 🗝️, +${rewards.tickets} 🎫, +${rewards.cards} 🎴!`);
  }
  if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') {
    sfx.playLevelUpSound();
  }
}
window.claimMysteryGiftReward = claimMysteryGiftReward;

function closeMysteryGiftModal(event) {
  const spinState = getSpinState();
  const currentLimit = spinState.targetCrowns || getKingLevelTarget(spinState.level || 1);
  if ((spinState.crowns || 0) >= currentLimit) {
    claimMysteryGiftReward();
  } else {
    const backdrop = document.getElementById('spinGiftModalBackdrop');
    if (backdrop) backdrop.classList.remove('active');
  }
}
window.closeMysteryGiftModal = closeMysteryGiftModal;

// Segmented Subtab Switcher for Spin Page
function switchSpinSubtab(subtabName = 'wheel') {
  if (gameState.rewardState && gameState.rewardState.isSpinning) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('⚡ Wheel is currently spinning! Please wait for it to stop.');
    }
    return;
  }

  const contentWheel = document.getElementById('spinSubtabContentWheel');
  if (contentWheel) {
    contentWheel.style.display = 'flex';
    contentWheel.classList.add('active');
  }

  initSpinChaserBulbs();
  updateSpinTicketUI();
  updateSpinLevelUI();
}

// Auto-initialize Chaser Bulbs & Level on DOM ready only if spin page is active
document.addEventListener('DOMContentLoaded', () => {
  if (typeof gameState !== 'undefined' && gameState.currentTab === 'spin') {
    initSpinChaserBulbs();
    updateSpinTicketUI();
    updateSpinLevelUI();
  }
});

// ==========================================================================
// DYNAMITE WHEEL (🎉 SPINNER WITH 🧨 PRIZES)
// ==========================================================================

function switchSpinWheelTab(tab) {
  if (gameState.rewardState && (gameState.rewardState.isSpinning || gameState.rewardState.isPartySpinning)) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('⚡ Wheel is spinning! Please wait for it to stop.');
    }
    return;
  }
  currentSpinWheelTab = tab;
  const btnTicket = document.getElementById('spinTabBtnTicket');
  const btnDynamite = document.getElementById('spinTabBtnDynamite');
  const contentTicket = document.getElementById('spinSubtabContentWheel');
  const contentDynamite = document.getElementById('spinSubtabContentDynamite');

  if (tab === 'ticket') {
    if (btnTicket) btnTicket.classList.add('active');
    if (btnDynamite) btnDynamite.classList.remove('active');
    if (contentTicket) {
      contentTicket.style.display = 'block';
      contentTicket.classList.add('active');
    }
    if (contentDynamite) {
      contentDynamite.style.display = 'none';
      contentDynamite.classList.remove('active');
    }
  } else {
    if (btnTicket) btnTicket.classList.remove('active');
    if (btnDynamite) btnDynamite.classList.add('active');
    if (contentTicket) {
      contentTicket.style.display = 'none';
      contentTicket.classList.remove('active');
    }
    if (contentDynamite) {
      contentDynamite.style.display = 'block';
      contentDynamite.classList.add('active');
    }
  }
  initSpinChaserBulbs();
  updateSpinTicketUI();
}
window.switchSpinWheelTab = switchSpinWheelTab;

function setSpinPartyBet(amount) {
  currentPartyBet = Number(amount) || 1;
  [1, 10, 20].forEach(val => {
    const btn = document.getElementById(`spinBetBtn${val}`);
    if (btn) btn.classList.toggle('active', val === currentPartyBet);
  });
  updateSpinTicketUI();
  if (typeof sfx !== 'undefined' && typeof sfx.playTapSound === 'function') {
    sfx.playTapSound(2);
  }
}
window.setSpinPartyBet = setSpinPartyBet;

function watchAdForPartyCoins() {
  const doReward = () => {
    const gain = 20;
    gameState.player.partyCoins = (gameState.player.partyCoins || gameState.player.blueCoins || 0) + gain;
    gameState.player.blueCoins = gameState.player.partyCoins;
    updateSpinTicketUI();
    updateUI();
    saveGame();
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`🎉 Claimed +${gain} Free Party Coins!`);
    }
    if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') {
      sfx.playLevelUpSound();
    }
  };

  if (typeof window.showRewardedAd === 'function') {
    window.showRewardedAd(doReward, {
      adTitle: 'Free +20 🎉 Party Coins',
      adDesc: 'Watch sponsor video to get +20 Party Coins for the Dynamite Wheel!'
    });
  } else {
    doReward();
  }
}
window.watchAdForPartyCoins = watchAdForPartyCoins;

function handlePartySpinButtonClick() {
  if (gameState.rewardState && gameState.rewardState.isPartySpinning) return;
  const partyCoins = (gameState.player && (gameState.player.partyCoins !== undefined ? gameState.player.partyCoins : gameState.player.blueCoins)) || 0;
  if (partyCoins < currentPartyBet) {
    if (confirm(`You need at least ${currentPartyBet} 🎉 Party Coins to spin! (Have: ${partyCoins} 🎉)\n\nWatch a quick ad to get +20 Free 🎉 Party Coins?`)) {
      watchAdForPartyCoins();
    }
    return;
  }
  spinDynamiteWheel();
}
window.handlePartySpinButtonClick = handlePartySpinButtonClick;

function spinDynamiteWheel() {
  if (gameState.rewardState && gameState.rewardState.isPartySpinning) return;

  const partyCoins = (gameState.player && (gameState.player.partyCoins !== undefined ? gameState.player.partyCoins : gameState.player.blueCoins)) || 0;
  if (partyCoins < currentPartyBet) return;

  // Deduct party coins
  gameState.player.partyCoins = Math.max(0, partyCoins - currentPartyBet);
  gameState.player.blueCoins = gameState.player.partyCoins;

  if (!gameState.rewardState) gameState.rewardState = {};
  gameState.rewardState.isPartySpinning = true;
  updateSpinTicketUI();
  if (typeof sfx !== 'undefined' && typeof sfx.playTapSound === 'function') sfx.playTapSound(3);

  // Daily Stats & tasks
  if (typeof checkDailyStatsDate === 'function') checkDailyStatsDate();
  if (gameState.dailyStats) gameState.dailyStats.spins = (gameState.dailyStats.spins || 0) + 1;
  if (typeof recordTaskEvent === 'function') {
    recordTaskEvent('spin_wheel', 1);
  }

  // Weighted probability for 9 slices (1, 2, 5, 10, 15, Try Again, 20, 25, 50):
  const weights = [25, 20, 18, 12, 8, 7, 5, 3, 2];
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * totalWeight;
  let sliceIndex = 0;
  for (let i = 0; i < weights.length; i++) {
    if (r < weights[i]) {
      sliceIndex = i;
      break;
    }
    r -= weights[i];
  }

  const prize = DYNAMITE_PRIZES[sliceIndex];

  // Mathematical rotation calculation for 9 slices (40 deg each):
  const fullSpins = 6;
  const currentRotation = gameState.rewardState.partySpinRotation || 0;
  const targetRemainder = (360 - (sliceIndex * 40)) % 360;
  const currentRemainder = currentRotation % 360;
  let diff = targetRemainder - currentRemainder;
  if (diff <= 0) diff += 360;
  const newRotation = currentRotation + (fullSpins * 360) + diff;
  gameState.rewardState.partySpinRotation = newRotation;

  const wheelEl = document.getElementById('spinPartyWheelCircle');
  const wheelFrame = document.getElementById('spinPartyWheelFrame');
  const pointer = document.getElementById('spinPartyPointerArrow');

  if (wheelFrame) wheelFrame.classList.add('spinning-active');

  // Mechanical flapper ticking rhythm
  const tickDelays = [60, 60, 65, 70, 75, 85, 95, 110, 130, 155, 185, 225, 275, 335, 410, 500, 610];
  let accumulatedDelay = 0;
  tickDelays.forEach(delay => {
    accumulatedDelay += delay;
    setTimeout(() => {
      if (gameState.rewardState && gameState.rewardState.isPartySpinning) {
        playWheelTickSound();
        if (pointer) {
          pointer.classList.remove('ticking');
          void pointer.offsetWidth;
          pointer.classList.add('ticking');
        }
        if (typeof triggerTelegramHaptic === 'function') triggerTelegramHaptic('light');
      }
    }, accumulatedDelay);
  });

  if (wheelEl) {
    wheelEl.style.transition = 'transform 3.8s cubic-bezier(0.12, 0.85, 0.2, 1)';
    wheelEl.style.transform = `rotate(${newRotation}deg)`;
  }

  setTimeout(() => {
    if (wheelFrame) wheelFrame.classList.remove('spinning-active');
    gameState.rewardState.isPartySpinning = false;

    if (prize.type === 'none') {
      if (typeof sfx !== 'undefined' && typeof sfx.playTapSound === 'function') sfx.playTapSound(1);
      if (typeof showFloatingToast === 'function') {
        showFloatingToast('❌ Missed this time! Try again for 🧨 Dynamite Coins!');
      }
      updateSpinTicketUI();
      updateUI();
      saveGame();
      if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
        window.firebaseSync.saveToCloudImmediate();
      }
    } else {
      if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') sfx.playLevelUpSound();
      triggerSpinConfetti();
      const amountWon = prize.amount * currentPartyBet;
      showSpinPrizeModal({
        label: `${amountWon} Dynamite Coins`,
        type: 'dynamite',
        amount: amountWon,
        icon: '🧨',
        rarity: prize.rarity
      });
    }
  }, 4000);
}
window.spinDynamiteWheel = spinDynamiteWheel;

// Global exports
window.initSpinChaserBulbs = initSpinChaserBulbs;
window.updateSpinTicketUI = updateSpinTicketUI;
window.spinLuckyWheel = spinLuckyWheel;
window.handleSpinButtonClick = handleSpinButtonClick;
window.switchSpinSubtab = switchSpinSubtab;
window.showSpinPrizeModal = showSpinPrizeModal;
window.claimDoubleSpinReward = claimDoubleSpinReward;
window.claimRegularSpinReward = claimRegularSpinReward;
window.closeSpinRewardModal = closeSpinRewardModal;
window.getSpinState = getSpinState;
window.showMysteryGiftPreview = showMysteryGiftPreview;
