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
    DOM.comboMultiplierText.textContent = `*${multiplier.toFixed(1)} COMBO`;
    const comboTapsEl = document.getElementById('comboTapsCount');
    if (comboTapsEl) {
      comboTapsEl.textContent = `(${gameState.reactor.comboTaps || 0} Taps)`;
    }
    
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

  // 3. Tap Registration
  gameState.reactor.energyTaps = (gameState.reactor.energyTaps || 0) + 1;
  if (typeof checkDailyStatsDate === 'function') checkDailyStatsDate();
  if (gameState.dailyStats) {
    gameState.dailyStats.taps = (gameState.dailyStats.taps || 0) + 1;
  }

  // Award +1 Blue Coin on every tap button click
  gameState.player.diamonds = (gameState.player.diamonds || 0) + 1;
  gameState.player.blueCoins = (gameState.player.blueCoins || 0) + 1;
  
  const blueEls = document.querySelectorAll('#blueCoinCounter, #headerBlueBalance, .blue-coin-val');
  blueEls.forEach(el => {
    el.textContent = formatNumber(gameState.player.diamonds);
  });
  const bluePill = document.getElementById('blueCoinPill') || (typeof DOM !== 'undefined' && DOM.blueCoinPill);
  if (bluePill) {
    bluePill.classList.add('pulse-glow');
    setTimeout(() => bluePill.classList.remove('pulse-glow'), 220);
  }

  // 4. XP Progression (0.1 XP per tap, scaled with combo & active 2x boost)
  const is2xActive = isHome2xBoostActive();
  const boostFactor = is2xActive ? 2 : 1;
  const xpGain = +(0.1 * (gameState.reactor.comboMultiplier || 1.0) * boostFactor).toFixed(2);
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
      // 🃏 Card Drop
      gameState.goalState.levelProgress.cards = Math.min(req.cards, (gameState.goalState.levelProgress.cards || 0) + 1);
      droppedItem = { text: '🃏 +1 Card', color: '#f43f5e' };
    } else if (itemRoll < 0.70) {
      // 🥢 Dandiya Drop
      gameState.goalState.levelProgress.keys = Math.min(req.keys, (gameState.goalState.levelProgress.keys || 0) + 1);
      droppedItem = { text: '🥢 +1 Dandiya', color: '#fbbf24' };
    } else {
      // 🌸 Flower Drop
      gameState.goalState.levelProgress.tickets = Math.min(req.tickets, (gameState.goalState.levelProgress.tickets || 0) + 1);
      droppedItem = { text: '🌸 +1 Flower', color: '#ec4899' };
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
    const is2xActive = isHome2xBoostActive();
    createFloatingNumber(clientX, clientY, is2xActive ? '⚡ +1 Tap (*2 Boost)' : '+1 Tap', is2xActive ? '#fbbf24' : '#38bdf8');
    setTimeout(() => {
      createFloatingNumber(clientX + (Math.random() - 0.5) * 24, clientY - 26, '+1 💎 Blue Coin', '#38bdf8');
    }, 70);
    if (droppedItem) {
      setTimeout(() => {
        createFloatingNumber(clientX + (Math.random() - 0.5) * 30, clientY - 48, droppedItem.text, droppedItem.color);
      }, 150);
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

  // Navratri Festive Celebration: Spawn occasional floating marigold / festive spark emoji
  if (Math.random() < 0.4) {
    const festiveEmojis = ['✨', '🌸', '🪔', '🌼', '🥢'];
    const festEl = document.createElement('div');
    festEl.className = 'floating-number';
    festEl.textContent = festiveEmojis[Math.floor(Math.random() * festiveEmojis.length)];
    festEl.style.fontSize = '20px';
    festEl.style.left = `${relX + (Math.random() - 0.5) * 40}px`;
    festEl.style.top = `${relY - 25}px`;
    festEl.style.filter = 'drop-shadow(0 0 6px #ffbe0b)';
    DOM.orbStage.appendChild(festEl);
    setTimeout(() => {
      if (festEl.parentNode) festEl.parentNode.removeChild(festEl);
    }, 850);
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
  if (DOM.playerLevelBadge) DOM.playerLevelBadge.textContent = `Lv.${gameState.player.level}`;
  const goldEls = document.querySelectorAll('#coinCounter, #headerCoinBalance');
  goldEls.forEach(el => { el.textContent = formatNumber(gameState.player.coins); });
  const blueEls = document.querySelectorAll('#blueCoinCounter, #headerBlueBalance, .blue-coin-val');
  blueEls.forEach(el => { el.textContent = formatNumber(gameState.player.diamonds || gameState.player.blueCoins || 0); });
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

  // Update Profile Circle Badge
  const profileBadgeEl = document.getElementById('circleProfileBadge');
  if (profileBadgeEl) {
    profileBadgeEl.textContent = `LV.${gameState.player.level || 0}`;
  }

  // Update Auto-Click Circle Badge & Active Pulse
  const autoBadgeEl = document.getElementById('circleAutoBadge');
  const autoCircleBtn = document.getElementById('btnCircleAutoClick');
  const isAutoOn = !!(gameState.settings && gameState.settings.autoBotEnabled);
  if (autoBadgeEl) {
    autoBadgeEl.textContent = isAutoOn ? 'ON' : 'BOT';
  }
  if (autoCircleBtn) {
    if (isAutoOn) {
      autoCircleBtn.classList.add('pulse-active');
    } else {
      autoCircleBtn.classList.remove('pulse-active');
    }
  }

  // Update 2X Multiplier Badge
  updateHome2xBadge();

  // Update Combo Pill
  updateHomeComboPill();
}

// Initialize Combo Decay Engine automatically on load
initComboDecayEngine();

// ==========================================================================
// HOME ACTION CIRCLES & POP-UP MODAL ENGINE
// ==========================================================================
let home2xBoostTimer = null;
let home2xCooldownTimer = null;
let currentHomePopupType = null;

// Garba 2X Configuration
const GARBA_BOOST_DURATION_SEC = 30 * 60; // 30 Minutes
const GARBA_COOLDOWN_DURATION_SEC = 2 * 60 * 60; // 2 Hours

function isHome2xBoostActive() {
  return !!(gameState && gameState.reactor && gameState.reactor.boost2xEndTime && Date.now() < gameState.reactor.boost2xEndTime);
}

function getHome2xRemainingSeconds() {
  if (!isHome2xBoostActive()) return 0;
  return Math.max(0, Math.ceil((gameState.reactor.boost2xEndTime - Date.now()) / 1000));
}

// 2-Hour Cooldown check (Cooldown starts after 2X boost is activated/used)
function isHome2xCooldownActive() {
  return !!(gameState && gameState.reactor && gameState.reactor.boost2xCooldownEndTime && Date.now() < gameState.reactor.boost2xCooldownEndTime);
}

function getHome2xCooldownRemainingSeconds() {
  if (!isHome2xCooldownActive()) return 0;
  return Math.max(0, Math.ceil((gameState.reactor.boost2xCooldownEndTime - Date.now()) / 1000));
}

// Check if circle icon should be visible on Home page
// "if using timer complete / pop-up use throw any buy than in home page in remove a pop-up icon, but a reset timer complete than show in home page."
function updateHome2xIconVisibility() {
  const circle2x = document.getElementById('btnCircle2x');
  if (!circle2x) return;

  // Immediately remove / hide icon if boost is active OR currently in 2-hour reset cooldown
  if (isHome2xBoostActive() || isHome2xCooldownActive()) {
    circle2x.style.display = 'none';
  } else {
    // Show icon on home page once 2-hour reset timer completes!
    circle2x.style.display = 'flex';
  }
}

// Activate 30-Min Garba 2X Boost
function activateHome2xBoost(durationSeconds = GARBA_BOOST_DURATION_SEC, method = 'diamonds') {
  if (!gameState.reactor) gameState.reactor = {};
  const now = Date.now();
  
  // 30 Min active boost (usage timer)
  gameState.reactor.boost2xEndTime = now + (durationSeconds * 1000);
  // 2-Hour reset cooldown period (not shown in popup, only active usage time is shown)
  gameState.reactor.boost2xCooldownEndTime = now + (GARBA_COOLDOWN_DURATION_SEC * 1000);
  
  if (typeof saveGame === 'function') saveGame();
  if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
    window.firebaseSync.saveToCloudImmediate();
  }

  startHome2xTimerTick();
  updateHome2xIconVisibility();

  if (typeof showFloatingToast === 'function') {
    showFloatingToast(`⚡ Garba 2X Tap Multiplier Activated for 30 Minutes!`);
  }
  
  // Close or refresh modal
  refreshHomePopupIfOpen('ads_2x');
}

function buyGarba2xWithDiamonds() {
  if (isHome2xBoostActive() || isHome2xCooldownActive()) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('⚡ Garba 2X Multiplier already active or resetting!');
    }
    return;
  }

  const cost = 10;
  if ((gameState.player.diamonds || 0) < cost) {
    if (typeof sfx !== 'undefined' && sfx.playErrorSound) sfx.playErrorSound();
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('⚠️ Insufficient Diamonds! Need 10 💎 to unlock Garba 2X Turbo Burst.');
    }
    return;
  }

  gameState.player.diamonds -= cost;
  if (gameState.player.blueCoins !== undefined) gameState.player.blueCoins = gameState.player.diamonds;
  if (typeof sfx !== 'undefined' && sfx.playBuySound) sfx.playBuySound();
  
  activateHome2xBoost(GARBA_BOOST_DURATION_SEC, 'diamonds');
  if (typeof updateUI === 'function') updateUI();
}

function buyGarba2xWithAds() {
  if (isHome2xBoostActive() || isHome2xCooldownActive()) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('⚡ Garba 2X Multiplier already active or resetting!');
    }
    return;
  }

  const executeWatch = () => {
    activateHome2xBoost(GARBA_BOOST_DURATION_SEC, 'ads');
    if (typeof updateUI === 'function') updateUI();
  };

  if (typeof showRewardedAd === 'function') {
    showRewardedAd(executeWatch);
  } else if (typeof startAdSimulation === 'function') {
    startAdSimulation('festive', 'Garba 2X Festive Bonus', 'Watch 1 Ad to activate 30-Min Turbo Multiplier', executeWatch);
  } else {
    executeWatch();
  }
}

function startHome2xTimerTick() {
  if (home2xBoostTimer) clearInterval(home2xBoostTimer);
  updateHome2xBadge();
  updateHome2xIconVisibility();

  home2xBoostTimer = setInterval(() => {
    updateHome2xBadge();
    updateHome2xIconVisibility();

    // Dynamically update timer digits inside popup if currently open
    if (currentHomePopupType === 'ads_2x') {
      const activeTimerDigits = document.getElementById('garbaActiveTimerDigits');
      if (activeTimerDigits) {
        const rem = getHome2xRemainingSeconds();
        if (rem > 0) {
          const mins = Math.floor(rem / 60);
          const secs = rem % 60;
          activeTimerDigits.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        } else {
          // Timer finished
          refreshHomePopupIfOpen('ads_2x');
        }
      }
    }

    if (!isHome2xBoostActive() && !isHome2xCooldownActive()) {
      clearInterval(home2xBoostTimer);
      home2xBoostTimer = null;
      updateHome2xBadge();
      updateHome2xIconVisibility();
      refreshHomePopupIfOpen('ads_2x');
    }
  }, 1000);
}

function updateHome2xBadge() {
  const badge = document.getElementById('circle2xBadge');
  const circle2x = document.getElementById('btnCircle2x');
  if (!badge) return;

  if (isHome2xBoostActive()) {
    const rem = getHome2xRemainingSeconds();
    const mins = Math.floor(rem / 60);
    const secs = rem % 60;
    badge.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    if (circle2x) circle2x.classList.add('pulse-active');
  } else {
    badge.textContent = '*2';
    if (circle2x) circle2x.classList.remove('pulse-active');
  }
}

// Check initial 2x timer and cooldown state
if (isHome2xBoostActive() || isHome2xCooldownActive()) {
  startHome2xTimerTick();
}

// Automatic Popup on Login / Next Visit when 2-hour reset timer finishes
function checkAndShowGarba2xPopupOnLogin() {
  // If not in 2-hour cooldown and not currently boosted, show popup on visit/login
  if (!isHome2xBoostActive() && !isHome2xCooldownActive()) {
    setTimeout(() => {
      // Only pop up if user is currently on home page
      const homePage = document.getElementById('pageHome');
      if (homePage && homePage.classList.contains('active')) {
        openHomeActionPopup('ads_2x');
      }
    }, 1200);
  }
}

// Run check on initial load
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    updateHome2xIconVisibility();
    checkAndShowGarba2xPopupOnLogin();
  });
}

function openHomeActionPopup(type) {
  const backdrop = document.getElementById('homePopupBackdrop');
  const header = document.getElementById('homePopupHeader');
  const body = document.getElementById('homePopupBody');
  if (!backdrop || !header || !body) return;

  currentHomePopupType = type;

  if (type === 'ads_2x') {
    renderHome2xPopup(header, body);
  } else if (type === 'auto_click') {
    renderHomeAutoClickPopup(header, body);
  } else if (type === 'profile') {
    renderHomeProfilePopup(header, body);
  } else if (type === 'coin') {
    renderHomeCoinPopup(header, body);
  } else if (type === 'blue') {
    renderHomeBlueCoinPopup(header, body);
  } else if (type === 'bonus') {
    renderHomeBonusPopup(header, body);
  }

  backdrop.classList.add('open');
  if (typeof sfx !== 'undefined' && sfx.playCardRewardSound) sfx.playCardRewardSound();
}

function closeHomeActionPopup(e) {
  if (e && e.target && e.target.id !== 'homePopupBackdrop' && e.target.id !== 'homePopupCloseBtn') {
    return;
  }
  const backdrop = document.getElementById('homePopupBackdrop');
  if (backdrop) backdrop.classList.remove('open');
  currentHomePopupType = null;
}

function refreshHomePopupIfOpen(type) {
  const backdrop = document.getElementById('homePopupBackdrop');
  if (!backdrop || !backdrop.classList.contains('open')) return;
  if (currentHomePopupType === type) {
    const header = document.getElementById('homePopupHeader');
    const body = document.getElementById('homePopupBody');
    if (header && body) {
      if (type === 'ads_2x') renderHome2xPopup(header, body);
      else if (type === 'auto_click') renderHomeAutoClickPopup(header, body);
      else if (type === 'profile') renderHomeProfilePopup(header, body);
      else if (type === 'coin') renderHomeCoinPopup(header, body);
      else if (type === 'blue') renderHomeBlueCoinPopup(header, body);
      else if (type === 'bonus') renderHomeBonusPopup(header, body);
    }
  }
}

// 1. Garba 2X Tap Multiplier Popup View
// Note: Only the 30-min active usage timer is displayed in popup. The 2-hour reset cooldown is NOT shown in popup.
function renderHome2xPopup(header, body) {
  const isActive = isHome2xBoostActive();
  const isCooldown = isHome2xCooldownActive();
  const rem = getHome2xRemainingSeconds();
  const mins = Math.floor(rem / 60);
  const secs = rem % 60;

  header.innerHTML = `
    <div class="home-popup-festive-pill">🪔 NAVRATRI FESTIVE UTSAV ✨</div>
    <div class="home-popup-icon-wrap" style="background: radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, rgba(180, 83, 9, 0.1) 100%); border: 2px solid #f59e0b; color: #fbbf24; font-size: 26px; box-shadow: 0 0 25px rgba(245, 158, 11, 0.4);">⚡</div>
    <h3 class="home-popup-title" style="letter-spacing: 0.5px;">GARBA 2X TAP MULTIPLIER</h3>
    <p class="home-popup-subtitle">Supercharge your sacred taps with Turbo Burst! Doubles all energy output, tap combo gains, and XP for a full 30-minute duration.</p>
  `;

  let timerBanner = '';
  if (isActive) {
    timerBanner = `
      <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, rgba(180, 83, 9, 0.3) 100%); border: 1.5px solid #f59e0b; border-radius: 14px; padding: 14px; text-align: center; margin-bottom: 4px; box-shadow: 0 0 20px rgba(245, 158, 11, 0.25);">
        <div style="font-size: 11px; font-weight: 800; color: #fbbf24; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">⚡ 2X TURBO BURST ACTIVE (30 MIN TIMER)</div>
        <div id="garbaActiveTimerDigits" style="font-family: 'JetBrains Mono', monospace; font-size: 32px; font-weight: 900; color: #ffffff; text-shadow: 0 0 14px rgba(251, 191, 36, 0.9);">
          ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}
        </div>
        <div style="font-size: 11px; color: #fde68a; margin-top: 2px;">Active Multiplier Remaining</div>
      </div>
    `;
  } else {
    timerBanner = `
      <div class="popup-stat-banner">
        <span class="popup-stat-label">Session Duration</span>
        <span class="popup-stat-value" style="color: #38bdf8; font-weight: 800;">⚡ 30 MINUTES ACTIVE</span>
      </div>
    `;
  }

  const isLocked = isActive || isCooldown;

  body.innerHTML = `
    ${timerBanner}

    <div class="popup-stat-banner">
      <span class="popup-stat-label">Output Multiplier</span>
      <span class="popup-stat-value" style="color: #f59e0b; font-weight: 800;">*2.0X SACRED TAP POWER</span>
    </div>

    <!-- Buy with 10 Diamonds or Turbo Burst -->
    <button class="popup-action-btn btn-gold-glow" onclick="buyGarba2xWithDiamonds()" ${isLocked ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''} style="display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 800; padding: 13px; border-radius: 12px; background: linear-gradient(135deg, #d97706, #b45309); color: #ffffff; border: 1.5px solid #fbbf24; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.35);">
      <span style="font-size: 18px;">💎</span>
      <span>${isLocked ? '⚡ Turbo Burst Currently Running' : 'Buy with 10 Diamonds (Turbo Burst)'}</span>
    </button>

    <!-- Festive Bonus (Watch Ad) -->
    <button class="popup-action-btn btn-cyan-glow" onclick="buyGarba2xWithAds()" ${isLocked ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''} style="display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 800; padding: 13px; border-radius: 12px; background: linear-gradient(135deg, #0284c7, #0369a1); color: #ffffff; border: 1.5px solid #38bdf8; box-shadow: 0 4px 15px rgba(56, 189, 248, 0.35);">
      <span style="font-size: 18px;">🎬</span>
      <span>${isLocked ? '🪔 Festive Bonus Active' : 'Festive Bonus (Watch Ad for 30 Min 2X)'}</span>
    </button>
  `;
}

function triggerHome2xWatchAd() {
  activateHome2xBoost(300);
}

// 2. Auto-Clicker Bot Reward Popup
function renderHomeAutoClickPopup(header, body) {
  const isRunning = !!(gameState.settings && gameState.settings.autoBotEnabled);

  header.innerHTML = `
    <div class="home-popup-festive-pill">🪔 NAVRATRI UTSAV REWARD ✨</div>
    <div class="home-popup-icon-wrap" style="background: rgba(16, 185, 129, 0.2); border: 2px solid #10b981; color: #34d399;">🤖</div>
    <h3 class="home-popup-title">DANDIYA AUTO-BOT REWARD</h3>
    <p class="home-popup-subtitle">Deploy AI robotic automation to tap the reactor orb continuously with sacred dandiya rhythm!</p>
  `;

  body.innerHTML = `
    <div class="popup-stat-banner">
      <span class="popup-stat-label">Bot Operating Mode</span>
      <span class="popup-stat-value" style="color: ${isRunning ? '#34d399' : '#94a3b8'};">
        ${isRunning ? '🟢 ACTIVE & TAPPING' : '⚪ SYSTEM STANDBY'}
      </span>
    </div>

    <div class="popup-stat-banner">
      <span class="popup-stat-label">Tapping Frequency</span>
      <span class="popup-stat-value" style="color: #38bdf8;">~2.0 TAPS / SEC</span>
    </div>

    <button class="popup-action-btn ${isRunning ? 'btn-ghost-dark' : 'btn-emerald-glow'}" onclick="toggleHomeAutoBot()">
      <span>${isRunning ? '⏹️' : '▶️'}</span> ${isRunning ? 'Stop Dandiya Auto-Bot' : 'Start Dandiya Auto-Bot'}
    </button>

    <button class="popup-action-btn btn-cyan-glow" onclick="triggerHomeAutoTurbo()">
      <span>⚡</span> Claim Turbo Burst (+25 Free Instant Taps)
    </button>
  `;
}

function toggleHomeAutoBot() {
  if (typeof toggleAutoBot === 'function') {
    toggleAutoBot();
  } else {
    gameState.settings.autoBotEnabled = !gameState.settings.autoBotEnabled;
  }
  updateHomeUI();
  refreshHomePopupIfOpen('auto_click');
}

function triggerHomeAutoTurbo() {
  let taps = 0;
  const turboInterval = setInterval(() => {
    if (taps < 25 && Math.floor(gameState.reactor.currentEnergy || 0) >= 1) {
      handleOrbTap();
      taps++;
    } else {
      clearInterval(turboInterval);
    }
  }, 70);
  if (typeof showFloatingToast === 'function') {
    showFloatingToast('⚡ Turbo Burst Fired: 25 Rapid Taps Claimed!');
  }
  if (typeof sfx !== 'undefined' && sfx.playTapSound) sfx.playTapSound(3);
}

// 3. Profile & Rank Blessing Reward Popup
function renderHomeProfilePopup(header, body) {
  const lvl = gameState.player.level || 0;
  const xpCur = +(gameState.player.xp || 0);
  const xpTar = gameState.player.xpToNextLevel || 1000;
  const goldCoins = gameState.player.coins || 0;
  const blueCoins = gameState.player.diamonds || gameState.player.blueCoins || 0;

  header.innerHTML = `
    <div class="home-popup-festive-pill">🪔 NAVRATRI UTSAV REWARD ✨</div>
    <div class="home-popup-icon-wrap" style="background: rgba(168, 85, 247, 0.2); border: 2px solid #a855f7; color: #c084fc;">🪔</div>
    <h3 class="home-popup-title">MAA SHAKTI PLAYER PROFILE</h3>
    <p class="home-popup-subtitle">Commander: ${gameState.player.handle || 'alex_blue'} • Status: Online & Blessed</p>
  `;

  body.innerHTML = `
    <div class="popup-grid-2">
      <div class="popup-stat-banner" style="flex-direction: column; align-items: flex-start; gap: 4px;">
        <span class="popup-stat-label">Current Level</span>
        <span class="popup-stat-value" style="color: #a855f7; font-size: 17px;">Level ${lvl}</span>
      </div>
      <div class="popup-stat-banner" style="flex-direction: column; align-items: flex-start; gap: 4px;">
        <span class="popup-stat-label">Total Taps</span>
        <span class="popup-stat-value" style="color: #38bdf8; font-size: 17px;">${gameState.reactor.energyTaps || 0}</span>
      </div>
    </div>

    <div class="popup-grid-2">
      <div class="popup-stat-banner" style="flex-direction: column; align-items: flex-start; gap: 4px;">
        <span class="popup-stat-label">Gold Coins</span>
        <span class="popup-stat-value" style="color: #fbbf24; font-size: 16px;">🪙 ${formatNumber(goldCoins)}</span>
      </div>
      <div class="popup-stat-banner" style="flex-direction: column; align-items: flex-start; gap: 4px;">
        <span class="popup-stat-label">Blue Coins</span>
        <span class="popup-stat-value" style="color: #38bdf8; font-size: 16px;">💎 ${formatNumber(blueCoins)}</span>
      </div>
    </div>

    <div class="popup-stat-banner">
      <span class="popup-stat-label">XP Progress</span>
      <span class="popup-stat-value" style="color: #f97316;">${xpCur} / ${xpTar} XP</span>
    </div>

    <div class="popup-feature-card" style="background: linear-gradient(135deg, rgba(88, 28, 135, 0.5) 0%, rgba(15, 23, 42, 0.9) 100%); border-color: rgba(192, 132, 252, 0.4);">
      <div class="popup-feature-left">
        <span class="popup-feature-icon">🪔</span>
        <div class="popup-feature-info">
          <span class="popup-feature-title">Shakti Festive Blessing</span>
          <span class="popup-feature-sub">+2,000 Coins & +10 Blue Gems</span>
        </div>
      </div>
      <button class="popup-mini-btn btn-purple-glow" onclick="claimHomeProfileBlessing()">Claim</button>
    </div>

    <button class="popup-action-btn btn-purple-glow" onclick="closeHomeActionPopup(); switchPage('profile');">
      <span>📂</span> Open Full Profile & Shop
    </button>
  `;
}

function claimHomeProfileBlessing() {
  gameState.player.coins = (gameState.player.coins || 0) + 2000;
  gameState.player.diamonds = (gameState.player.diamonds || 0) + 10;
  if (gameState.player.blueCoins !== undefined) gameState.player.blueCoins = gameState.player.diamonds;
  if (typeof saveGame === 'function') saveGame();
  updateHomeUI();
  if (typeof showFloatingToast === 'function') {
    showFloatingToast('🪔 Maa Shakti Blessing Claimed: +2,000 Coins & +10 Blue Gems!');
  }
  if (typeof sfx !== 'undefined' && sfx.playCardRewardSound) sfx.playCardRewardSound();
  refreshHomePopupIfOpen('profile');
}

// 4. Golden Coin Reward Vault Popup
function renderHomeCoinPopup(header, body) {
  const goldCoins = gameState.player.coins || 0;

  header.innerHTML = `
    <div class="home-popup-festive-pill">🪔 NAVRATRI UTSAV REWARD ✨</div>
    <div class="home-popup-icon-wrap" style="background: rgba(251, 191, 36, 0.2); border: 2px solid #fbbf24; color: #fde047;">🪙</div>
    <h3 class="home-popup-title">LAKSHMI COIN REWARD VAULT</h3>
    <p class="home-popup-subtitle">Auspicious festival prosperity! Claim golden coin rewards to upgrade skills and fuel cells.</p>
  `;

  body.innerHTML = `
    <div class="popup-stat-banner">
      <span class="popup-stat-label">Gold Vault Balance</span>
      <span class="popup-stat-value" style="color: #fbbf24; font-size: 17px;">🪙 ${formatNumber(goldCoins)} COINS</span>
    </div>

    <div class="popup-feature-card">
      <div class="popup-feature-left">
        <span class="popup-feature-icon">🎁</span>
        <div class="popup-feature-info">
          <span class="popup-feature-title">Daily Lakshmi Drop</span>
          <span class="popup-feature-sub">+2,500 Gold Coins</span>
        </div>
      </div>
      <button class="popup-mini-btn btn-gold-glow" onclick="claimHomeCoinBonus(2500, 'Daily Supply')">Claim</button>
    </div>

    <div class="popup-feature-card">
      <div class="popup-feature-left">
        <span class="popup-feature-icon">⚡</span>
        <div class="popup-feature-info">
          <span class="popup-feature-title">Shakti Energy Converter</span>
          <span class="popup-feature-sub">50 Energy ➔ 1,000 Coins</span>
        </div>
      </div>
      <button class="popup-mini-btn btn-cyan-glow" onclick="convertHomeEnergyToCoins()">Convert</button>
    </div>

    <div class="popup-feature-card">
      <div class="popup-feature-left">
        <span class="popup-feature-icon">🪔</span>
        <div class="popup-feature-info">
          <span class="popup-feature-title">Navratri Festival Bounty</span>
          <span class="popup-feature-sub">+10,000 Gold Coins</span>
        </div>
      </div>
      <button class="popup-mini-btn btn-gold-glow" onclick="claimHomeCoinBonus(10000, 'Festival Bounty')">Claim</button>
    </div>
  `;
}

function claimHomeCoinBonus(amount, sourceName) {
  gameState.player.coins = (gameState.player.coins || 0) + amount;
  if (typeof saveGame === 'function') saveGame();
  updateHomeUI();
  if (typeof showFloatingToast === 'function') {
    showFloatingToast(`🪙 +${formatNumber(amount)} Gold Coins Claimed!`);
  }
  if (typeof sfx !== 'undefined' && sfx.playCoinSound) sfx.playCoinSound();
  refreshHomePopupIfOpen('coin');
}

function convertHomeEnergyToCoins() {
  const currentEnergy = Math.floor(gameState.reactor.currentEnergy || 0);
  if (currentEnergy < 50) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('⚠️ Need at least 50 Energy to convert!');
    }
    return;
  }
  gameState.reactor.currentEnergy -= 50;
  gameState.player.coins = (gameState.player.coins || 0) + 1000;
  if (typeof saveGame === 'function') saveGame();
  updateHomeUI();
  if (typeof showFloatingToast === 'function') {
    showFloatingToast('⚡ Converted 50 Energy into 1,000 Gold Coins!');
  }
  if (typeof sfx !== 'undefined' && sfx.playCoinSound) sfx.playCoinSound();
  refreshHomePopupIfOpen('coin');
}

// 5. Blue Coin Vault Reward Popup
function renderHomeBlueCoinPopup(header, body) {
  const blueCoins = gameState.player.diamonds || gameState.player.blueCoins || 0;

  header.innerHTML = `
    <div class="home-popup-festive-pill">🪔 NAVRATRI UTSAV REWARD ✨</div>
    <div class="home-popup-icon-wrap" style="background: rgba(6, 182, 212, 0.2); border: 2px solid #06b6d4; color: #38bdf8;">💎</div>
    <h3 class="home-popup-title">SHAKTI BLUE GEM VAULT</h3>
    <p class="home-popup-subtitle">Divine quantum blue crystals used for high-tier upgrades, multipliers, and exclusive shop items.</p>
  `;

  body.innerHTML = `
    <div class="popup-stat-banner">
      <span class="popup-stat-label">Blue Coin Balance</span>
      <span class="popup-stat-value" style="color: #38bdf8; font-size: 17px;">💎 ${formatNumber(blueCoins)} BLUE</span>
    </div>

    <div class="popup-feature-card">
      <div class="popup-feature-left">
        <span class="popup-feature-icon">🎁</span>
        <div class="popup-feature-info">
          <span class="popup-feature-title">Free Quantum Drop</span>
          <span class="popup-feature-sub">+15 Blue Coins</span>
        </div>
      </div>
      <button class="popup-mini-btn btn-cyan-glow" onclick="claimHomeBlueCoinBonus(15, 'Quantum Drop')">Claim</button>
    </div>

    <div class="popup-feature-card">
      <div class="popup-feature-left">
        <span class="popup-feature-icon">🔄</span>
        <div class="popup-feature-info">
          <span class="popup-feature-title">Crystal Synthesizer</span>
          <span class="popup-feature-sub">5,000 Gold ➔ 25 Blue</span>
        </div>
      </div>
      <button class="popup-mini-btn btn-cyan-glow" onclick="exchangeGoldToBlueCoins()">Exchange</button>
    </div>

    <div class="popup-feature-card" style="background: linear-gradient(135deg, rgba(14, 38, 88, 0.85) 0%, rgba(8, 20, 52, 0.95) 100%); border-color: rgba(56, 189, 248, 0.6);">
      <div class="popup-feature-left">
        <span class="popup-feature-icon">🛍️</span>
        <div class="popup-feature-info">
          <span class="popup-feature-title">Profile Shop & Items</span>
          <span class="popup-feature-sub">Spend Blue Gems in Profile Shop</span>
        </div>
      </div>
      <button class="popup-mini-btn btn-cyan-glow" onclick="closeHomeActionPopup(); switchPage('profile'); switchProfileSubtab('shop');">Open Shop</button>
    </div>

    <div class="popup-feature-card">
      <div class="popup-feature-left">
        <span class="popup-feature-icon">🪔</span>
        <div class="popup-feature-info">
          <span class="popup-feature-title">Navratri Amrit Gem Gift</span>
          <span class="popup-feature-sub">+50 Blue Coins</span>
        </div>
      </div>
      <button class="popup-mini-btn btn-cyan-glow" onclick="claimHomeBlueCoinBonus(50, 'Amrit Gem Gift')">Claim</button>
    </div>
  `;
}

function claimHomeBlueCoinBonus(amount, sourceName) {
  gameState.player.diamonds = (gameState.player.diamonds || 0) + amount;
  if (gameState.player.blueCoins !== undefined) gameState.player.blueCoins = gameState.player.diamonds;
  if (typeof saveGame === 'function') saveGame();
  updateHomeUI();
  if (typeof showFloatingToast === 'function') {
    showFloatingToast(`💎 +${amount} Blue Coins Claimed!`);
  }
  if (typeof sfx !== 'undefined' && sfx.playCoinSound) sfx.playCoinSound();
  refreshHomePopupIfOpen('blue');
}

function exchangeGoldToBlueCoins() {
  const currentGold = gameState.player.coins || 0;
  if (currentGold < 5000) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('⚠️ Need at least 5,000 Gold Coins to synthesize Blue Coins!');
    }
    return;
  }
  gameState.player.coins -= 5000;
  gameState.player.diamonds = (gameState.player.diamonds || 0) + 25;
  if (gameState.player.blueCoins !== undefined) gameState.player.blueCoins = gameState.player.diamonds;
  if (typeof saveGame === 'function') saveGame();
  updateHomeUI();
  if (typeof showFloatingToast === 'function') {
    showFloatingToast('💎 Successfully Synthesized 25 Blue Coins!');
  }
  if (typeof sfx !== 'undefined' && sfx.playCoinSound) sfx.playCoinSound();
  refreshHomePopupIfOpen('blue');
}

// 6. Grand Mystery Mahotsav Reward Capsule Popup
function renderHomeBonusPopup(header, body) {
  header.innerHTML = `
    <div class="home-popup-festive-pill">🪔 GRAND FESTIVE REWARD ✨</div>
    <div class="home-popup-icon-wrap" style="background: rgba(244, 63, 94, 0.2); border: 2px solid #f43f5e; color: #fb7185;">🎁</div>
    <h3 class="home-popup-title">NAVRATRI MAHOTSAV CAPSULE</h3>
    <p class="home-popup-subtitle">Unlock the sacred festival reward capsule for instant Gold Coins, Blue Gems, Spin Tickets, and Mystery Keys!</p>
  `;

  body.innerHTML = `
    <div class="popup-stat-banner">
      <span class="popup-stat-label">Capsule Integrity</span>
      <span class="popup-stat-value" style="color: #fb7185;">⚡ CHARGED & READY TO CLAIM</span>
    </div>

    <div class="popup-grid-2">
      <div class="popup-stat-banner" style="flex-direction: column; align-items: flex-start; gap: 2px;">
        <span class="popup-stat-label">Gold Bounty</span>
        <span class="popup-stat-value" style="color: #fbbf24;">🪙 +3.5K - 6K</span>
      </div>
      <div class="popup-stat-banner" style="flex-direction: column; align-items: flex-start; gap: 2px;">
        <span class="popup-stat-label">Blue Crystals</span>
        <span class="popup-stat-value" style="color: #38bdf8;">💎 +10 - 25</span>
      </div>
    </div>

    <div class="popup-grid-2">
      <div class="popup-stat-banner" style="flex-direction: column; align-items: flex-start; gap: 2px;">
        <span class="popup-stat-label">Spin Ticket</span>
        <span class="popup-stat-value" style="color: #f59e0b;">🎫 +1 Ticket</span>
      </div>
      <div class="popup-stat-banner" style="flex-direction: column; align-items: flex-start; gap: 2px;">
        <span class="popup-stat-label">Mystery Key</span>
        <span class="popup-stat-value" style="color: #34d399;">🔑 +1 Key</span>
      </div>
    </div>

    <button class="popup-action-btn" style="background: linear-gradient(90deg, #f43f5e, #fb7185); color: #ffffff; box-shadow: 0 0 20px rgba(244, 63, 94, 0.6);" onclick="openHomeMysteryCapsule()">
      <span>🎁</span> OPEN & CLAIM MAHOTSAV REWARD
    </button>
  `;
}

function openHomeMysteryCapsule() {
  const goldBonus = Math.floor(Math.random() * 2500) + 3500;
  const blueBonus = Math.floor(Math.random() * 15) + 10;
  gameState.player.coins = (gameState.player.coins || 0) + goldBonus;
  gameState.player.diamonds = (gameState.player.diamonds || 0) + blueBonus;
  if (gameState.player.blueCoins !== undefined) gameState.player.blueCoins = gameState.player.diamonds;
  if (gameState.player.chestKeys !== undefined) gameState.player.chestKeys = (gameState.player.chestKeys || 0) + 1;
  if (gameState.player.spinTickets !== undefined) gameState.player.spinTickets = (gameState.player.spinTickets || 0) + 1;
  if (gameState.player.scratchCards !== undefined) gameState.player.scratchCards = (gameState.player.scratchCards || 0) + 1;

  if (typeof saveGame === 'function') saveGame();
  updateHomeUI();

  if (typeof showFloatingToast === 'function') {
    showFloatingToast(`🎉 Mahotsav Gift: +${formatNumber(goldBonus)} Gold, +${blueBonus} Blue, 🎫 1 Ticket, 🔑 1 Key!`);
  }
  if (typeof sfx !== 'undefined' && sfx.playCardRewardSound) {
    sfx.playCardRewardSound();
  }

  closeHomeActionPopup();
}

// Global Exports
window.handleOrbTap = handleOrbTap;
window.createFloatingNumber = createFloatingNumber;
window.createSparks = createSparks;
window.triggerLevelUpAnimation = triggerLevelUpAnimation;
window.updateHomeUI = updateHomeUI;
window.updateHomeComboPill = updateHomeComboPill;
window.initComboDecayEngine = initComboDecayEngine;

window.openHomeActionPopup = openHomeActionPopup;
window.closeHomeActionPopup = closeHomeActionPopup;
window.triggerHome2xWatchAd = triggerHome2xWatchAd;
window.activateHome2xBoost = activateHome2xBoost;
window.buyGarba2xWithDiamonds = buyGarba2xWithDiamonds;
window.buyGarba2xWithAds = buyGarba2xWithAds;
window.updateHome2xIconVisibility = updateHome2xIconVisibility;
window.toggleHomeAutoBot = toggleHomeAutoBot;
window.triggerHomeAutoTurbo = triggerHomeAutoTurbo;
window.claimHomeCoinBonus = claimHomeCoinBonus;
window.convertHomeEnergyToCoins = convertHomeEnergyToCoins;
window.claimHomeBlueCoinBonus = claimHomeBlueCoinBonus;
window.exchangeGoldToBlueCoins = exchangeGoldToBlueCoins;
window.openHomeMysteryCapsule = openHomeMysteryCapsule;
window.claimHomeProfileBlessing = claimHomeProfileBlessing;
