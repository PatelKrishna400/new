/* ==========================================================================
   DAILY STREAK REWARDS (pages/streak/streak.js)
   ========================================================================== */
const STREAK_DAYS_CONFIG = [
  { day: 1, icon: '🪙', coins: 10, label: '+10 Gold Coins' },
  { day: 2, icon: '🟢', green: 1, label: '+1 Green Fuel' },
  { day: 3, icon: '🗝️', keys: 1, label: '+1 Key' },
  { day: 4, icon: '🎟️', tickets: 1, label: '+1 Ticket' },
  { day: 5, icon: '🥚', eggs: 10, label: '+10 Eggs' },
  { day: 6, icon: '🎰', partyCoins: 1, label: '+1 Spin Coin' },
  { day: 7, icon: '💎', diamonds: 5, label: '+5 Diamonds' }
];

const STREAK_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 Hours

function formatStreakCooldownTime(ms) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  return `${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
}

function formatStreakCooldownShort(ms) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m ${totalSec % 60}s`;
}

let streakCountdownTimerId = null;

function startStreakTimer() {
  if (streakCountdownTimerId) clearInterval(streakCountdownTimerId);
  streakCountdownTimerId = setInterval(() => {
    if (gameState.currentTab === 'streak' || (DOM.pageStreak && DOM.pageStreak.classList.contains('active'))) {
      renderStreakView();
    }
  }, 1000);
}

function renderStreakView() {
  const now = Date.now();
  const lastClaim = gameState.player.lastStreakClaimTime || 0;
  const elapsed = now - lastClaim;
  const inCooldown = lastClaim > 0 && elapsed < STREAK_COOLDOWN_MS;
  const remainingMs = inCooldown ? (STREAK_COOLDOWN_MS - elapsed) : 0;

  let currentStreak = gameState.player.streakDays || 0;

  // If 7 days cycle completed and 24h cooldown has expired -> Automatically restart to Day 1!
  if (currentStreak >= 7 && !inCooldown) {
    gameState.player.streakDays = 0;
    currentStreak = 0;
    if (typeof saveGame === 'function') saveGame();
  }

  // During cooldown right after claiming Day 7, all 7 days were completed in this cycle
  const allCompleted = (currentStreak >= 7 && inCooldown);
  const currentDayIndex = allCompleted ? 6 : (currentStreak % 7);

  if (DOM.streakHeroTitle) {
    if (allCompleted) {
      DOM.streakHeroTitle.textContent = `7 Day Streak • Complete!`;
    } else {
      DOM.streakHeroTitle.textContent = `${currentStreak} Day Streak`;
    }
  }

  if (DOM.streakStatusText) {
    if (allCompleted) {
      DOM.streakStatusText.textContent = `🎉 All 7 Done • Restarts in ${formatStreakCooldownShort(remainingMs)}`;
    } else if (inCooldown) {
      DOM.streakStatusText.textContent = `Next in ${formatStreakCooldownTime(remainingMs)}`;
    } else {
      DOM.streakStatusText.textContent = `Day ${currentDayIndex + 1} of 7 • Ready!`;
    }
  }

  if (DOM.streakCalendarGrid) {
    let gridHTML = '';
    STREAK_DAYS_CONFIG.forEach((cfg, idx) => {
      const isClaimed = allCompleted ? true : (idx < currentDayIndex);
      const isCurrentTarget = allCompleted ? false : (idx === currentDayIndex);
      const isDay7 = idx === 6;

      let cardClass = 'streak-day-card';
      if (isDay7) cardClass += ' day-7-card';

      let statusPill = `<span class="streak-day-status-pill">🔒 Locked</span>`;

      if (isClaimed) {
        cardClass += ' claimed-day';
        statusPill = `<span class="streak-day-status-pill">✓ Claimed</span>`;
      } else if (isCurrentTarget) {
        if (inCooldown) {
          cardClass += ' active-day cooldown-day';
          statusPill = `<span class="streak-day-status-pill">⏳ ${formatStreakCooldownShort(remainingMs)}</span>`;
        } else {
          cardClass += ' active-day';
          statusPill = `<span class="streak-day-status-pill">⚡ Ready</span>`;
        }
      }

      gridHTML += `
        <div class="${cardClass}">
          <span class="streak-day-title">Day ${cfg.day}</span>
          <span class="streak-day-icon">${cfg.icon}</span>
          <span class="streak-day-reward-text">${cfg.label}</span>
          ${statusPill}
        </div>
      `;
    });
    DOM.streakCalendarGrid.innerHTML = gridHTML;
  }

  if (DOM.streakClaimMainBtn) {
    if (allCompleted) {
      DOM.streakClaimMainBtn.className = 'streak-claim-main-btn cooldown disabled';
      DOM.streakClaimMainBtn.innerHTML = `<span>🎉 CYCLE COMPLETE • RESTARTS IN ${formatStreakCooldownTime(remainingMs)}</span>`;
    } else if (inCooldown) {
      DOM.streakClaimMainBtn.className = 'streak-claim-main-btn cooldown disabled';
      DOM.streakClaimMainBtn.innerHTML = `<span>⏳ NEXT REWARD IN ${formatStreakCooldownTime(remainingMs)}</span>`;
    } else {
      DOM.streakClaimMainBtn.className = 'streak-claim-main-btn';
      DOM.streakClaimMainBtn.innerHTML = `<span>🔥 CLAIM DAY ${currentDayIndex + 1} REWARD</span>`;
    }
  }
}

function claimCurrentStreakDay() {
  const now = Date.now();
  const lastClaim = gameState.player.lastStreakClaimTime || 0;
  const elapsed = now - lastClaim;

  if (lastClaim > 0 && elapsed < STREAK_COOLDOWN_MS) {
    const remainingMs = STREAK_COOLDOWN_MS - elapsed;
    sfx.playTapSound(1);
    if (DOM.sheetTitle && DOM.sheetContent && DOM.modalBackdrop) {
      DOM.sheetTitle.textContent = `⏳ 24-HOUR COOLDOWN ACTIVE`;
      DOM.sheetContent.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px 0; gap: 14px; text-align: center;">
          <div style="font-size: 50px;">⏳</div>
          <h3 style="font-size: 18px; font-weight: 800; color: #f97316;">Next Daily Reward In:</h3>
          <div style="font-size: 22px; font-family: 'JetBrains Mono', monospace; font-weight: 800; color: #ffffff; background: rgba(15, 23, 42, 0.85); border: 1.5px solid #f97316; border-radius: 12px; padding: 10px 20px;">
            ${formatStreakCooldownTime(remainingMs)}
          </div>
          <p style="font-size: 12.5px; color: #94a3b8; max-width: 280px;">Daily rewards unlock once every 24 hours. Check back once the timer expires!</p>
          <button class="feature-btn" onclick="closeTabModal()" style="width: 100%; padding: 12px; font-size: 14px; font-weight: 800; border-radius: 12px; background: #334155;">Got it</button>
        </div>
      `;
      DOM.modalBackdrop.classList.add('open');
    }
    return;
  }

  const executeStreakReward = () => {
    let currentStreak = gameState.player.streakDays || 0;
    if (currentStreak >= 7) {
      currentStreak = 0;
      gameState.player.streakDays = 0;
    }
    const currentDayIndex = currentStreak % 7;
    const todayCfg = STREAK_DAYS_CONFIG[currentDayIndex];

    // Ensure player and generator exist
    if (!gameState.player) gameState.player = {};
    if (!gameState.energyGenerator) gameState.energyGenerator = { fuelCells: {} };
    if (!gameState.energyGenerator.fuelCells) gameState.energyGenerator.fuelCells = {};

    // 1. Award Gold Coins (Day 1: 10 Gold Coins)
    if (todayCfg.coins) {
      gameState.player.coins = (gameState.player.coins || 0) + todayCfg.coins;
      window._lastCurrencyDeductionTime = Date.now();
    }

    // 2. Award Fuel Cells (Day 2: 1 Green Fuel)
    if (todayCfg.green) {
      gameState.energyGenerator.fuelCells.green = (gameState.energyGenerator.fuelCells.green || 0) + todayCfg.green;
    }
    if (todayCfg.darkgreen) {
      gameState.energyGenerator.fuelCells.darkgreen = (gameState.energyGenerator.fuelCells.darkgreen || 0) + todayCfg.darkgreen;
    }

    // 3. Award Keys (Day 3: 1 Key)
    if (todayCfg.keys) {
      gameState.player.chestKeys = (gameState.player.chestKeys || 0) + todayCfg.keys;
      if (gameState.goal) {
        gameState.goal.currentKeys = Math.min(gameState.goal.targetKeys || 10, (gameState.goal.currentKeys || 0) + todayCfg.keys);
      }
    }

    // 4. Award Tickets (Day 4: 1 Ticket)
    if (todayCfg.tickets) {
      gameState.player.chestTickets = (gameState.player.chestTickets || 0) + todayCfg.tickets;
      if (gameState.goal) {
        gameState.goal.currentTickets = Math.min(gameState.goal.targetTickets || 10, (gameState.goal.currentTickets || 0) + todayCfg.tickets);
      }
    }

    // 5. Award Eggs (Day 5: 10 Eggs)
    if (todayCfg.eggs) {
      gameState.player.eggs = (gameState.player.eggs || 0) + todayCfg.eggs;
    }

    // 6. Award Spin Coins (Day 6: 1 Spin Coin)
    if (todayCfg.partyCoins) {
      gameState.player.partyCoins = (gameState.player.partyCoins || 0) + todayCfg.partyCoins;
      gameState.player.spinCoins = (gameState.player.spinCoins || 0) + todayCfg.partyCoins;
      if (gameState.player.blueCoins !== undefined) {
        gameState.player.blueCoins = (gameState.player.blueCoins || 0) + todayCfg.partyCoins;
      }
      if (typeof updateSpinTicketUI === 'function') updateSpinTicketUI();
    }

    // 7. Award Diamonds (Day 7: 5 Diamonds)
    if (todayCfg.diamonds) {
      gameState.player.diamonds = (gameState.player.diamonds || 0) + todayCfg.diamonds;
      if (gameState.player.blueCoins !== undefined && !todayCfg.partyCoins) {
        gameState.player.blueCoins = (gameState.player.blueCoins || 0) + todayCfg.diamonds;
      }
    }

    // Fallback for Cards if configured
    if (todayCfg.cards) {
      gameState.player.scratchCards = (gameState.player.scratchCards || 0) + todayCfg.cards;
    }

    // Advance Streak & Record Timestamp
    const nextStreak = currentStreak + 1;
    gameState.player.streakDays = nextStreak;
    gameState.player.lastStreakClaimTime = Date.now();

    const isCycleComplete = nextStreak >= 7;
    if (isCycleComplete) {
      gameState.player.streakCyclesCompleted = (gameState.player.streakCyclesCompleted || 0) + 1;
    }

    sfx.playLevelUpSound();

    // Show Reward Claim Modal
    if (DOM.sheetTitle && DOM.sheetContent && DOM.modalBackdrop) {
      DOM.sheetTitle.textContent = isCycleComplete ? `🎉 DAY 7 CLAIMED • ALL 7 DAYS COMPLETED!` : `🎉 DAY ${todayCfg.day} REWARD CLAIMED!`;
      DOM.sheetContent.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px 0; gap: 14px; text-align: center;">
          <div style="font-size: 54px; animation: bounceGlow 1.2s infinite alternate;">${todayCfg.icon}</div>
          <h3 style="font-size: 20px; font-weight: 800; color: #f97316;">${isCycleComplete ? 'Full 7-Day Streak Complete! 🏆' : `Day ${todayCfg.day} Streak Unlocked!`}</h3>
          <p style="font-size: 13px; color: #94a3b8; line-height: 1.5; max-width: 280px;">Your daily reward has been credited:</p>
          <div style="background: rgba(249, 115, 22, 0.15); border: 1.5px solid #f97316; border-radius: 14px; padding: 12px 18px; width: 100%;">
            <div style="font-size: 16px; font-weight: 800; color: #fb923c;">${todayCfg.label}</div>
          </div>
          <div style="font-size: 12px; color: #64748b;">${isCycleComplete ? '🔄 Streak cycle completed! Restarts from Day 1 after the 24-hour cooldown.' : '⏳ 24-hour timer started! Next reward unlocks tomorrow.'}</div>
          <button class="feature-btn" onclick="closeTabModal()" style="width: 100%; padding: 12px; font-size: 14px; font-weight: 800; border-radius: 12px; background: linear-gradient(90deg, #ea580c, #f97316);">Claimed ✨</button>
        </div>
      `;
      DOM.modalBackdrop.classList.add('open');
    }

    updateUI();
    renderStreakView();
    if (typeof updateEnergyUI === 'function') updateEnergyUI();
    if (typeof updateProfileUI === 'function') updateProfileUI();
    if (typeof updateShopUI === 'function') updateShopUI();
    if (typeof updateEggUI === 'function') updateEggUI();
    if (typeof updateSpinTicketUI === 'function') updateSpinTicketUI();
    saveGame(true);
    if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
      window.firebaseSync.saveToCloudImmediate();
    }
  };

  // Rewarded interstitial
  if (typeof show_10676091 === 'function') {
    show_10676091().then(() => {
      // You need to add your user reward function here, which will be executed after the user watches the ad.
      // For more details, please refer to the detailed instructions.
      alert('You have seen an ad!');
      executeStreakReward();
    }).catch(e => {
      console.warn('show_10676091 notice:', e);
      executeStreakReward();
    });
  } else if (typeof showRewardedAd === 'function') {
    showRewardedAd(executeStreakReward);
  } else {
    executeStreakReward();
  }
}


// Testing Helpers for Quick Verification
function testResetStreakCooldown() {
  gameState.player.lastStreakClaimTime = 0;
  renderStreakView();
  saveGame();
}

function testSkipStreak24h() {
  gameState.player.lastStreakClaimTime = (gameState.player.lastStreakClaimTime || Date.now()) - STREAK_COOLDOWN_MS;
  renderStreakView();
  saveGame();
}

function testResetStreakDays() {
  gameState.player.streakDays = 0;
  gameState.player.lastStreakClaimTime = 0;
  renderStreakView();
  saveGame();
}

window.renderStreakView = renderStreakView;
window.claimCurrentStreakDay = claimCurrentStreakDay;
window.startStreakTimer = startStreakTimer;
window.testResetStreakCooldown = testResetStreakCooldown;
window.testSkipStreak24h = testSkipStreak24h;
window.testResetStreakDays = testResetStreakDays;
