/* ==========================================================================
   DAILY STREAK REWARDS (pages/streak/streak.js)
   ========================================================================== */
const STREAK_DAYS_CONFIG = [
  { day: 1, icon: '🟢', green: 2, yellow: 0, orange: 0, keys: 0, tickets: 0, cards: 0, label: '+2 Green Fuel' },
  { day: 2, icon: '🟡', green: 0, yellow: 1, orange: 0, keys: 0, tickets: 0, cards: 0, label: '+1 Yellow Fuel' },
  { day: 3, icon: '🔑', green: 0, yellow: 0, orange: 0, keys: 1, tickets: 0, cards: 0, label: '+1 Key' },
  { day: 4, icon: '🎟️', green: 0, yellow: 0, orange: 0, keys: 0, tickets: 1, cards: 0, label: '+1 Ticket' },
  { day: 5, icon: '🎴', green: 0, yellow: 0, orange: 0, keys: 0, tickets: 0, cards: 1, label: '+1 Card' },
  { day: 6, icon: '🟠', green: 0, yellow: 0, orange: 1, keys: 0, tickets: 0, cards: 0, label: '+1 Orange Fuel' },
  { day: 7, icon: '👑', green: 5, yellow: 2, orange: 1, keys: 0, tickets: 0, cards: 0, label: '+5 🟢 • +2 🟡 • +1 🟠' }
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
  const currentStreak = gameState.player.streakDays || 0;
  const currentDayIndex = currentStreak % 7; // 0 = Day 1, 6 = Day 7

  const now = Date.now();
  const lastClaim = gameState.player.lastStreakClaimTime || 0;
  const elapsed = now - lastClaim;
  const inCooldown = lastClaim > 0 && elapsed < STREAK_COOLDOWN_MS;
  const remainingMs = inCooldown ? (STREAK_COOLDOWN_MS - elapsed) : 0;

  if (DOM.streakHeroTitle) {
    DOM.streakHeroTitle.textContent = `${currentStreak} Day Streak`;
  }

  if (DOM.streakStatusText) {
    if (inCooldown) {
      DOM.streakStatusText.textContent = `Next in ${formatStreakCooldownTime(remainingMs)}`;
    } else {
      DOM.streakStatusText.textContent = `Day ${currentDayIndex + 1} of 7 • Ready!`;
    }
  }

  if (DOM.streakCalendarGrid) {
    let gridHTML = '';
    STREAK_DAYS_CONFIG.forEach((cfg, idx) => {
      const isClaimed = idx < currentDayIndex;
      const isCurrentTarget = idx === currentDayIndex;
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
    const todayCfg = STREAK_DAYS_CONFIG[currentDayIndex];
    if (inCooldown) {
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
    const currentStreak = gameState.player.streakDays || 0;
    const currentDayIndex = currentStreak % 7;
    const todayCfg = STREAK_DAYS_CONFIG[currentDayIndex];

    // Award Fuel Cells
    if (todayCfg.green) {
      gameState.energyGenerator.fuelCells.green = (gameState.energyGenerator.fuelCells.green || 0) + todayCfg.green;
    }
    if (todayCfg.yellow) {
      gameState.energyGenerator.fuelCells.yellow = (gameState.energyGenerator.fuelCells.yellow || 0) + todayCfg.yellow;
    }
    if (todayCfg.orange) {
      gameState.energyGenerator.fuelCells.orange = (gameState.energyGenerator.fuelCells.orange || 0) + todayCfg.orange;
    }

    // Award Keys
    if (todayCfg.keys) {
      gameState.player.chestKeys = (gameState.player.chestKeys || 0) + todayCfg.keys;
      if (gameState.goal) {
        gameState.goal.currentKeys = Math.min(gameState.goal.targetKeys, (gameState.goal.currentKeys || 0) + todayCfg.keys);
      }
    }

    // Award Tickets
    if (todayCfg.tickets) {
      gameState.player.chestTickets = (gameState.player.chestTickets || 0) + todayCfg.tickets;
      if (gameState.goal) {
        gameState.goal.currentTickets = Math.min(gameState.goal.targetTickets, (gameState.goal.currentTickets || 0) + todayCfg.tickets);
      }
    }

    // Award Cards
    if (todayCfg.cards) {
      gameState.player.scratchCards = (gameState.player.scratchCards || 0) + todayCfg.cards;
      gameState.player.chestTickets = (gameState.player.chestTickets || 0) + todayCfg.cards;
    }

    // Advance Streak & Record Timestamp
    gameState.player.streakDays = currentStreak + 1;
    gameState.player.lastStreakClaimTime = Date.now();

    sfx.playLevelUpSound();

    // Show Reward Claim Modal
    if (DOM.sheetTitle && DOM.sheetContent && DOM.modalBackdrop) {
      DOM.sheetTitle.textContent = `🎉 DAY ${todayCfg.day} REWARD CLAIMED!`;
      DOM.sheetContent.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px 0; gap: 14px; text-align: center;">
          <div style="font-size: 54px; animation: bounceGlow 1.2s infinite alternate;">${todayCfg.icon}</div>
          <h3 style="font-size: 20px; font-weight: 800; color: #f97316;">Day ${todayCfg.day} Streak Unlocked!</h3>
          <p style="font-size: 13px; color: #94a3b8; line-height: 1.5; max-width: 280px;">Your daily rewards have been credited:</p>
          <div style="background: rgba(249, 115, 22, 0.15); border: 1.5px solid #f97316; border-radius: 14px; padding: 12px 18px; width: 100%;">
            <div style="font-size: 16px; font-weight: 800; color: #fb923c;">${todayCfg.label}</div>
          </div>
          <div style="font-size: 12px; color: #64748b;">⏳ 24-hour timer started! Next reward unlocks tomorrow.</div>
          <button class="feature-btn" onclick="closeTabModal()" style="width: 100%; padding: 12px; font-size: 14px; font-weight: 800; border-radius: 12px; background: linear-gradient(90deg, #ea580c, #f97316);">Claimed ✨</button>
        </div>
      `;
      DOM.modalBackdrop.classList.add('open');
    }

    updateUI();
    renderStreakView();
    saveGame();
  };

  if (typeof showRewardedAd === 'function') {
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
