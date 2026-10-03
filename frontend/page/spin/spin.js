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
  { label: '50 Coins', type: 'coins', amount: 50, icon: '🪙', rarity: 'common' },
  { label: '1 Key', type: 'keys', amount: 1, icon: '🔑', rarity: 'rare' },
  { label: '1 Card', type: 'card', amount: 1, icon: '🎴', rarity: 'rare' },
  { label: 'Try Again', type: 'none', amount: 0, icon: '❌', rarity: 'common' },
  { label: '1 Ticket', type: 'ticket', amount: 1, icon: '🎟️', rarity: 'rare' },
  { label: '1,000 Diamonds', type: 'diamonds', amount: 1000, icon: '💎', isJackpot: true, rarity: 'jackpot' },
  { label: '5 Diamonds', type: 'diamonds', amount: 5, icon: '💎', rarity: 'rare' }
];

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
  const cyclePos = ((lvl - 1) % 10) + 1; // 1 to 10
  const cycleBlock = Math.floor((lvl - 1) / 10);
  const diamonds = Math.max(1, Math.floor(cyclePos / 2) + cycleBlock);
  const keys = Math.min(25, 2 + Math.floor(lvl / 50));
  const tickets = Math.min(50, 3 + Math.floor(lvl / 25));
  const cards = Math.min(25, 2 + Math.floor(lvl / 50));
  return { coins, diamonds, keys, tickets, cards };
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

// Initialize 24 circular LED Chaser Bulbs around the perimeter
function initSpinChaserBulbs() {
  const ring = document.getElementById('spinChaserRing');
  if (!ring) return;
  if (ring.children.length === 24) return; // Already rendered, skip DOM recreation
  ring.innerHTML = ''; // Fresh render ensures exact placement

  const totalBulbs = 24;
  for (let i = 0; i < totalBulbs; i++) {
    const bulb = document.createElement('div');
    bulb.className = `chaser-bulb ${i % 2 === 0 ? '' : 'alt'}`;
    const angle = (i / totalBulbs) * 2 * Math.PI - (Math.PI / 2);
    // Percentage positioning from center 50% with radius 49.5%
    const leftPercent = 50 + 49.5 * Math.cos(angle);
    const topPercent = 50 + 49.5 * Math.sin(angle);
    bulb.style.left = `${leftPercent.toFixed(2)}%`;
    bulb.style.top = `${topPercent.toFixed(2)}%`;
    bulb.style.animationDelay = `${(i * 0.08).toFixed(2)}s`;
    ring.appendChild(bulb);
  }
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
  const tickets = (gameState.player && gameState.player.chestTickets) || 0;
  if (tickets > 0) {
    spinLuckyWheel();
  } else {
    if (typeof showGameEntryRequirementModal === 'function') {
      showGameEntryRequirementModal('1 Spin Ticket', '🎟️', 'Lucky Spin Wheel');
    } else if (typeof showFloatingToast === 'function') {
      showFloatingToast('🎟️ You need 1 Spin Ticket to play!');
    }
    if (typeof sfx !== 'undefined' && typeof sfx.playTapSound === 'function') {
      sfx.playTapSound(1);
    }
  }
}

// Update King Event Level Tab UI (1 - 1000 Levels Wave Progression)
function updateSpinLevelUI() {
  const state = getSpinState();
  const level = Math.max(1, Math.min(1000, state.level || 1));
  const targetLimit = state.targetCrowns || getKingLevelTarget(level);
  state.targetCrowns = targetLimit;

  const titleEl = document.getElementById('spinLevelTitle');
  const subEl = document.getElementById('spinLevelSub');
  const fillEl = document.getElementById('spinCrownBarFill');
  const countEl = document.getElementById('spinCrownCountText');
  const statusEl = document.getElementById('spinCrownStatusText');
  const waveTagEl = document.getElementById('spinWaveTag');
  const rewardPreviewEl = document.getElementById('spinLevelRewardPreviewText');

  if (titleEl) titleEl.textContent = `👑 KING EVENT • LEVEL ${level} / 1000`;
  if (subEl) subEl.textContent = `Collect ${targetLimit} 👑 King Crowns to unlock Level ${level} Gift!`;
  
  const crowns = state.crowns || 0;
  const pct = Math.min(100, Math.max(0, (crowns / targetLimit) * 100));
  if (fillEl) fillEl.style.width = `${pct}%`;
  if (countEl) countEl.textContent = `👑 ${crowns} / ${targetLimit} King Crowns Collected`;

  const crownProb = getCrownWinProbability(targetLimit);
  const probPercent = Math.round(crownProb * 100);

  if (statusEl) {
    if (crowns >= targetLimit) {
      statusEl.textContent = '🎁 Mystery Gift Ready to Open!';
      statusEl.style.color = '#fbbf24';
    } else {
      statusEl.textContent = `🎯 Crown Chance: ${probPercent}% (Inverse to Limit ${targetLimit})`;
      statusEl.style.color = '#94a3b8';
    }
  }

  if (waveTagEl) {
    const waveInfo = getKingWaveStageInfo(level, targetLimit);
    waveTagEl.className = `spin-wave-badge ${waveInfo.type}`;
    waveTagEl.textContent = waveInfo.text;
  }

  const rewards = getKingLevelRewards(level);
  if (rewardPreviewEl) {
    rewardPreviewEl.textContent = `+${rewards.coins} 🪙 • +${rewards.diamonds} 💎 • +${rewards.keys} 🗝️ • +${rewards.tickets} 🎫`;
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

  // King Event Probability Distribution (Inverse to Level Limit):
  const spinState = getSpinState();
  const level = Math.max(1, Math.min(1000, spinState.level || 1));
  const targetLimit = spinState.targetCrowns || getKingLevelTarget(level);
  const crownProb = getCrownWinProbability(targetLimit);

  // Req 13: Diamond win probability must be exactly 0.0001% (1 in 1,000,000)
  const DIAMOND_JACKPOT_PROB = 0.000001;

  const rand = Math.random();
  let sliceIndex;
  if (rand < DIAMOND_JACKPOT_PROB) {
    sliceIndex = 6; // 💎 1,000 Diamonds Jackpot
  } else if (rand < DIAMOND_JACKPOT_PROB + crownProb) {
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
  } else if (prize.type === 'diamonds') {
    gameState.player.diamonds = (gameState.player.diamonds || 0) + finalAmount;
    if (prize.isJackpot) {
      gameState.player.diamondWins = (gameState.player.diamondWins || 0) + 1;
      if (window.firebaseSync && typeof window.firebaseSync.updateLeaderboardEntry === 'function') {
        window.firebaseSync.updateLeaderboardEntry();
      }
    }

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

  if (typeof showRewardedAd === 'function') {
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
  const diaValEl = document.getElementById('spinGiftDiamondsVal');
  const keysValEl = document.getElementById('spinGiftKeysVal');
  const ticketsValEl = document.getElementById('spinGiftTicketsVal');
  const claimBtn = document.getElementById('btnClaimMysteryGift');

  if (titleEl) titleEl.textContent = `👑 LEVEL ${level} COMPLETE!`;
  if (subEl) subEl.textContent = `You collected all ${spinState.targetCrowns} 👑 King Crowns and completed Level ${level} of 1000!`;

  if (coinsValEl) coinsValEl.textContent = `+${rewards.coins}`;
  if (diaValEl) diaValEl.textContent = `+${rewards.diamonds}`;
  if (keysValEl) keysValEl.textContent = `+${rewards.keys}`;
  if (ticketsValEl) ticketsValEl.textContent = `+${rewards.tickets}`;

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
  const diaValEl = document.getElementById('spinGiftDiamondsVal');
  const keysValEl = document.getElementById('spinGiftKeysVal');
  const ticketsValEl = document.getElementById('spinGiftTicketsVal');
  const claimBtn = document.getElementById('btnClaimMysteryGift');

  if (titleEl) titleEl.textContent = `👑 LEVEL ${level} REWARD PREVIEW`;
  if (subEl) subEl.textContent = `Collect ${spinState.targetCrowns} 👑 King Crowns to unlock this Level ${level} gift!`;

  if (coinsValEl) coinsValEl.textContent = `+${rewards.coins}`;
  if (diaValEl) diaValEl.textContent = `+${rewards.diamonds}`;
  if (keysValEl) keysValEl.textContent = `+${rewards.keys}`;
  if (ticketsValEl) ticketsValEl.textContent = `+${rewards.tickets}`;

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
  gameState.player.diamonds = (gameState.player.diamonds || 0) + rewards.diamonds;
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
    showFloatingToast(`👑 LEVEL ${currentLevel} COMPLETED! +${rewards.coins} 🪙, +${rewards.diamonds} 💎, +${rewards.keys} 🗝️, +${rewards.tickets} 🎫! Next: Level ${nextLevel}`);
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
