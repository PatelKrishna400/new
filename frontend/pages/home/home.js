/* ==========================================================================
   ENERGY TAP REACTOR - HOME PAGE LOGIC (home.js)
   - Energy Consumption (-1 Energy per click)
   - Combo Tiers (*1, *1.3, *1.5, *1.7, *2, *2.5, *3) with 1 tap/sec decay
   - Random Emojis / Scratch Card Ticket, Key, Coin Drops -> Goal Tab Sync
   - Level Progression (+0.1 XP per tap, Level 1: 10 XP, Level 2: 25, Level 3: 50...)
   - Energy Balance Pill with ⚡ Logo linking to Energy Page
   ========================================================================== */

// Combo Decay Engine (Decreases 1 combo tap count per second)
function initComboDecayEngine() {
  if (gameState.reactor.comboDecayInterval) {
    clearInterval(gameState.reactor.comboDecayInterval);
  }

  gameState.reactor.comboDecayInterval = setInterval(() => {
    if (gameState.reactor.comboTaps > 0) {
      gameState.reactor.comboTaps--;
      gameState.reactor.comboMultiplier = getComboMultiplier(gameState.reactor.comboTaps);
      updateHomeComboPill();
    }
  }, 1000);
}

// Update Combo Pill Visuals
function updateHomeComboPill() {
  if (DOM.comboPill && DOM.comboMultiplierText) {
    const multiplier = gameState.reactor.comboMultiplier || 1.0;
    DOM.comboMultiplierText.textContent = `*${multiplier.toFixed(1)} COMBO (${gameState.reactor.comboTaps} Taps)`;
    
    if (multiplier > 1.0) {
      DOM.comboPill.classList.add('combo-active');
      if (multiplier >= 3.0) {
        DOM.comboPill.style.borderColor = '#f43f5e';
        DOM.comboPill.style.boxShadow = '0 0 16px rgba(244, 63, 94, 0.6)';
      } else if (multiplier >= 2.0) {
        DOM.comboPill.style.borderColor = '#f59e0b';
        DOM.comboPill.style.boxShadow = '0 0 14px rgba(245, 158, 11, 0.5)';
      } else {
        DOM.comboPill.style.borderColor = '#f97316';
        DOM.comboPill.style.boxShadow = '0 0 12px rgba(249, 115, 22, 0.4)';
      }
    } else {
      DOM.comboPill.classList.remove('combo-active');
      DOM.comboPill.style.borderColor = 'rgba(255, 255, 255, 0.08)';
      DOM.comboPill.style.boxShadow = 'none';
    }
  }
}

// Orb Tap Handler
function handleOrbTap(e) {
  // 1. Strict Energy Verification (Must have at least 1 full unit of energy to tap)
  const availableEnergy = Math.floor(gameState.reactor.currentEnergy || 0);
  if (availableEnergy < 1) {
    sfx.playTapSound(1);
    
    // Orb Error Shake Animation
    if (DOM.reactorOrb) {
      DOM.reactorOrb.classList.add('orb-error-shake');
      setTimeout(() => {
        if (DOM.reactorOrb) DOM.reactorOrb.classList.remove('orb-error-shake');
      }, 400);
    }

    // Floating error text (NO XP, NO ITEM EMOJI DROPS!)
    let x, y;
    if (e && e.clientX && e.clientY) {
      x = e.clientX;
      y = e.clientY;
    } else if (e && e.touches && e.touches[0]) {
      x = e.touches[0].clientX;
      y = e.touches[0].clientY;
    } else if (DOM.reactorOrb) {
      const rect = DOM.reactorOrb.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    }
    if (x && y) {
      createFloatingNumber(x, y, '⚡ 0 Energy!', '#ef4444');
    }
    
    if (DOM.energyCounterPill) {
      DOM.energyCounterPill.classList.add('pulse-warning');
      setTimeout(() => {
        if (DOM.energyCounterPill) DOM.energyCounterPill.classList.remove('pulse-warning');
      }, 600);
    }

    // STRICT RETURN: Without energy, DO NOT award coins, DO NOT award XP, DO NOT drop emojis!
    return;
  }

  // Consume 1 Energy (-1 Energy per click)
  gameState.reactor.currentEnergy = Math.max(0, (gameState.reactor.currentEnergy || 0) - 1);

  // Immediate live sync of energy balance on Home & Energy page
  const energyTapCountEl = document.getElementById('energyTapCount') || DOM.energyTapCount;
  if (energyTapCountEl) {
    energyTapCountEl.textContent = Math.floor(gameState.reactor.currentEnergy).toString();
  }
  const epCounterEl = document.querySelector('#epCounterPill .ep-badge-icon');
  if (epCounterEl) {
    const curVal = Math.max(0, Number(gameState.reactor.currentEnergy) || 0);
    epCounterEl.textContent = curVal.toFixed(2);
  }

  // 2. Combo Calculation based on total tap streak
  // *1 for 10 tap, *1.3 for 30 tap, *1.5 for 50 tap, *1.7 for 75 tap, *2 for 150 tap, *2.5 for 250 tap, *3 for 500 tap
  gameState.reactor.comboTaps = (gameState.reactor.comboTaps || 0) + 1;
  gameState.reactor.comboMultiplier = getComboMultiplier(gameState.reactor.comboTaps);

  const comboLvl = Math.floor(gameState.reactor.comboMultiplier);
  sfx.playTapSound(comboLvl);

  // 3. Coin Reward Calculation
  const baseGain = gameState.reactor.tapPower || 1;
  const totalCoinGain = Math.round(baseGain * gameState.reactor.comboMultiplier);
  gameState.player.coins += totalCoinGain;
  gameState.reactor.energyTaps += 1;

  // 4. XP Progression (0.1 XP per tap, scaled with combo)
  const xpGain = +(0.1 * (gameState.reactor.comboMultiplier || 1.0)).toFixed(2);
  gameState.player.xp = +(gameState.player.xp + xpGain).toFixed(2);

  // Level Up Check (Level 0: 1,000 XP, Level 1: 2,000 XP, Level 2: 3,000 XP...)
  const maxLevel = gameState.player.maxLevel || 100;
  if (!gameState.player.xpToNextLevel) {
    gameState.player.xpToNextLevel = getLevelRequiredXP(gameState.player.level || 0);
  }
  while (gameState.player.level < maxLevel && gameState.player.xp >= gameState.player.xpToNextLevel) {
    gameState.player.xp = +(gameState.player.xp - gameState.player.xpToNextLevel).toFixed(2);
    gameState.player.level += 1;
    gameState.player.xpToNextLevel = getLevelRequiredXP(gameState.player.level);
    sfx.playLevelUpSound();
    triggerLevelUpAnimation();
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`🎉 Level Up! You reached Level ${gameState.player.level}!`);
    }
  }

  // 5. Random Item Drops on Taps (🎟️ Card, 🔑 Key, 🎫 Ticket) -> Sync to Goal Tab & Level Mission
  let droppedItem = null;
  const roll = Math.random();
  if (roll < 0.25) { // 25% chance per tap
    const curLvl = (gameState.goalState && gameState.goalState.currentLevel !== undefined) ? gameState.goalState.currentLevel : 0;
    const targetLvl = curLvl === 0 ? 1 : curLvl;
    const req = typeof getGoalLevelRequirements === 'function' ? getGoalLevelRequirements(targetLvl) : { cards: 20, keys: 50, tickets: 35 };
    if (!gameState.goalState.levelProgress) gameState.goalState.levelProgress = { cards: 0, keys: 0, tickets: 0 };
    
    const itemRoll = Math.random();
    if (itemRoll < 0.35) {
      // 🎟️ Scratch Card Drop
      gameState.goalState.levelProgress.cards = Math.min(req.cards, (gameState.goalState.levelProgress.cards || 0) + 1);
      droppedItem = { text: '🎟️ +1 Card', color: '#f43f5e' };
    } else if (itemRoll < 0.70) {
      // 🔑 Chest Key Drop
      gameState.goalState.levelProgress.keys = Math.min(req.keys, (gameState.goalState.levelProgress.keys || 0) + 1);
      droppedItem = { text: '🔑 +1 Key', color: '#fbbf24' };
    } else {
      // 🎫 Lottery Ticket Drop
      gameState.goalState.levelProgress.tickets = Math.min(req.tickets, (gameState.goalState.levelProgress.tickets || 0) + 1);
      droppedItem = { text: '🎫 +1 Ticket', color: '#38bdf8' };
    }
  }

  // Orb tap visual animation
  if (DOM.reactorOrb) {
    DOM.reactorOrb.classList.add('tapped');
    setTimeout(() => DOM.reactorOrb.classList.remove('tapped'), 90);
  }

  // Coordinate calculations for floating numbers & particles
  let clientX, clientY;
  if (e && e.clientX && e.clientY) {
    clientX = e.clientX;
    clientY = e.clientY;
  } else if (e && e.touches && e.touches[0]) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else if (DOM.reactorOrb) {
    const rect = DOM.reactorOrb.getBoundingClientRect();
    clientX = rect.left + rect.width / 2;
    clientY = rect.top + rect.height / 2;
  }

  if (clientX && clientY) {
    createFloatingNumber(clientX, clientY, `+${totalCoinGain}`);
    if (droppedItem) {
      setTimeout(() => {
        createFloatingNumber(clientX + (Math.random() - 0.5) * 30, clientY - 30, droppedItem.text, droppedItem.color);
      }, 120);
    }
    createSparks(clientX, clientY);
  }

  updateUI();
  saveGame();
}

function createFloatingNumber(x, y, text, customColor = null) {
  if (!DOM.orbStage) return;
  const floatEl = document.createElement('div');
  floatEl.className = 'floating-number';
  floatEl.textContent = text;
  if (customColor) {
    floatEl.style.color = customColor;
    floatEl.style.textShadow = `0 0 10px ${customColor}, 0 2px 4px rgba(0,0,0,0.8)`;
    floatEl.style.fontSize = '17px';
  }
  
  const rect = DOM.orbStage.getBoundingClientRect();
  const relX = x - rect.left;
  const relY = y - rect.top;

  const randOffset = (Math.random() - 0.5) * 40;
  const randRot = (Math.random() - 0.5) * 20;

  floatEl.style.left = `${relX + randOffset}px`;
  floatEl.style.top = `${relY}px`;
  floatEl.style.setProperty('--rot', `${randRot}deg`);

  DOM.orbStage.appendChild(floatEl);
  setTimeout(() => {
    if (floatEl.parentNode) floatEl.parentNode.removeChild(floatEl);
  }, 850);
}

function createSparks(x, y) {
  if (!DOM.orbStage) return;
  const sparkCount = 6;
  const rect = DOM.orbStage.getBoundingClientRect();
  const relX = x - rect.left;
  const relY = y - rect.top;

  // Expanding shockwave ripple
  const wave = document.createElement('div');
  wave.className = 'tap-shockwave';
  wave.style.left = `${relX}px`;
  wave.style.top = `${relY}px`;
  DOM.orbStage.appendChild(wave);
  setTimeout(() => {
    if (wave.parentNode) wave.parentNode.removeChild(wave);
  }, 450);

  for (let i = 0; i < sparkCount; i++) {
    const spark = document.createElement('div');
    spark.className = 'spark-particle';
    const angle = (Math.PI * 2 / sparkCount) * i + Math.random() * 0.5;
    const distance = 40 + Math.random() * 45;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;

    spark.style.left = `${relX}px`;
    spark.style.top = `${relY}px`;
    spark.style.setProperty('--tx', `${tx}px`);
    spark.style.setProperty('--ty', `${ty}px`);

    DOM.orbStage.appendChild(spark);
    setTimeout(() => {
      if (spark.parentNode) spark.parentNode.removeChild(spark);
    }, 600);
  }
}

function triggerLevelUpAnimation() {
  if (!DOM.playerLevelBadge) return;
  DOM.playerLevelBadge.style.transform = 'translateX(-50%) scale(1.4)';
  DOM.playerLevelBadge.style.background = '#f59e0b';
  setTimeout(() => {
    DOM.playerLevelBadge.style.transform = 'translateX(-50%) scale(1)';
    DOM.playerLevelBadge.style.background = '#2563eb';
  }, 400);
}

function updateHomeUI() {
  // Player Level Badge & Coins
  if (DOM.playerLevelBadge) DOM.playerLevelBadge.textContent = `Lv.${gameState.player.level}`;
  if (DOM.coinCounter) DOM.coinCounter.textContent = formatNumber(gameState.player.coins);
  if (DOM.xpLevelNum) DOM.xpLevelNum.textContent = gameState.player.level;

  // XP Progress Fill
  const xpCurrent = +(gameState.player.xp || 0);
  const xpTarget = gameState.player.xpToNextLevel || getLevelRequiredXP(gameState.player.level || 0);
  const xpPercent = Math.min(100, Math.max(0, (xpCurrent / xpTarget) * 100));
  if (DOM.xpProgressFill) DOM.xpProgressFill.style.width = `${xpPercent}%`;

  // Goal Card Progress & Stats (Levels 1 - 100 System)
  const curGoalLvl = (gameState.goalState && gameState.goalState.currentLevel !== undefined) ? gameState.goalState.currentLevel : 0;
  const targetGoalLvl = curGoalLvl === 0 ? 1 : curGoalLvl;
  const goalReq = typeof getGoalLevelRequirements === 'function' ? getGoalLevelRequirements(targetGoalLvl) : { cards: 20, keys: 50, tickets: 35 };
  const goalProg = (gameState.goalState && gameState.goalState.levelProgress) || { cards: 0, keys: 0, tickets: 0 };

  if (DOM.goalLevelNum) DOM.goalLevelNum.textContent = curGoalLvl;
  
  const goalCardsEl = document.getElementById('goalCards') || DOM.goalCoins;
  if (goalCardsEl) goalCardsEl.textContent = `${goalProg.cards || 0}/${goalReq.cards}`;
  if (DOM.goalKeys) DOM.goalKeys.textContent = `${goalProg.keys || 0}/${goalReq.keys}`;
  if (DOM.goalTickets) DOM.goalTickets.textContent = `${goalProg.tickets || 0}/${goalReq.tickets}`;
  
  const totalGoalRatio = (
    ((goalProg.cards || 0) / goalReq.cards) * 0.34 +
    ((goalProg.keys || 0) / goalReq.keys) * 0.33 +
    ((goalProg.tickets || 0) / goalReq.tickets) * 0.33
  ) * 100;
  if (DOM.goalProgressFill) DOM.goalProgressFill.style.width = `${Math.min(100, Math.max(6, totalGoalRatio))}%`;

  // Energy Balance Pill (⚡ Energy Balance - Integer Only)
  const energyTapEl = document.getElementById('energyTapCount') || DOM.energyTapCount;
  if (energyTapEl) {
    const curEnergy = gameState.reactor.currentEnergy !== undefined ? gameState.reactor.currentEnergy : 0;
    energyTapEl.textContent = Math.floor(Math.max(0, curEnergy)).toString();
  }

  // XP Card Level Limit Text (e.g. "10/1000")
  const xpLevelLimitEl = document.getElementById('xpLevelLimitText');
  if (xpLevelLimitEl) {
    const formattedCur = (xpCurrent % 1 === 0) ? xpCurrent.toString() : xpCurrent.toFixed(1);
    const formattedTar = xpTarget.toString();
    xpLevelLimitEl.textContent = `${formattedCur}/${formattedTar}`;
  }

  // Update Combo Pill
  updateHomeComboPill();
}

// Initialize Combo Decay Engine automatically on load
initComboDecayEngine();

// Global Exports
window.handleOrbTap = handleOrbTap;
window.createFloatingNumber = createFloatingNumber;
window.createSparks = createSparks;
window.triggerLevelUpAnimation = triggerLevelUpAnimation;
window.updateHomeUI = updateHomeUI;
window.updateHomeComboPill = updateHomeComboPill;
window.initComboDecayEngine = initComboDecayEngine;
