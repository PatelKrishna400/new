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

// ==========================================================================
// MULTI-TAP POWER ENGINE (*1, *2, *3, *5, *10, *50, *100)
// Dynamic unlocks based on Energy Balance limits
// ==========================================================================
const MULTI_TAP_CONFIG = [
  { multiplier: 1, limit: 0 },
  { multiplier: 2, limit: 100 },
  { multiplier: 3, limit: 250 },
  { multiplier: 5, limit: 500 },
  { multiplier: 10, limit: 1000 },
  { multiplier: 50, limit: 5000 },
  { multiplier: 100, limit: 10000 }
];

function getActiveMultiTapMultiplier() {
  if (!gameState || !gameState.reactor) return 1;
  const currentEnergy = Math.floor(gameState.reactor.currentEnergy || 0);
  const activeMult = gameState.reactor.tapMultiplier || 1;
  let isAllowed = false;
  let maxAllowed = 1;

  for (let i = 0; i < MULTI_TAP_CONFIG.length; i++) {
    const cfg = MULTI_TAP_CONFIG[i];
    if (currentEnergy >= cfg.limit && currentEnergy >= cfg.multiplier) {
      if (cfg.multiplier === activeMult) isAllowed = true;
      if (cfg.multiplier > maxAllowed) maxAllowed = cfg.multiplier;
    }
  }

  if (isAllowed) return activeMult;
  gameState.reactor.tapMultiplier = maxAllowed;
  return maxAllowed;
}
window.getActiveMultiTapMultiplier = getActiveMultiTapMultiplier;

function setMultiTapMultiplier(multiplier) {
  if (!gameState || !gameState.reactor) return;
  const currentEnergy = Math.floor(gameState.reactor.currentEnergy || 0);
  const targetCfg = MULTI_TAP_CONFIG.find(c => c.multiplier === multiplier);
  if (!targetCfg) return;

  if (currentEnergy < targetCfg.limit || currentEnergy < multiplier) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`⚡ Need ${targetCfg.limit}+ Energy to use ${multiplier}× Multi-Tap!`);
    }
    return;
  }

  gameState.reactor.tapMultiplier = multiplier;
  if (typeof triggerTelegramHaptic === 'function') triggerTelegramHaptic('selection');
  if (typeof sfx !== 'undefined' && typeof sfx.playTapSound === 'function') sfx.playTapSound(2);

  updateMultiTapOptions();
  if (typeof showFloatingToast === 'function') {
    showFloatingToast(`⚡ ${multiplier}× Multi-Tap Active (${multiplier} Energy/tap)!`);
  }
}
window.setMultiTapMultiplier = setMultiTapMultiplier;

function updateMultiTapOptions() {
  if (!gameState || !gameState.reactor) return;
  const currentEnergy = Math.floor(gameState.reactor.currentEnergy || 0);
  const activeMult = getActiveMultiTapMultiplier();

  MULTI_TAP_CONFIG.forEach(cfg => {
    const btn = document.getElementById(`btnMultiTap${cfg.multiplier}`);
    if (!btn) return;

    const isUnlocked = (currentEnergy >= cfg.limit);
    if (isUnlocked) {
      if (btn.style.display === 'none' || !btn.style.display) {
        btn.style.display = 'inline-flex';
        btn.classList.add('unlocked-pulse');
        setTimeout(() => btn.classList.remove('unlocked-pulse'), 450);
      }
    } else {
      btn.style.display = 'none';
    }

    if (cfg.multiplier === activeMult) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}
window.updateMultiTapOptions = updateMultiTapOptions;

// Orb Tap Handler
function handleOrbTap(e) {
  const mult = getActiveMultiTapMultiplier();
  const availableEnergy = Math.floor(gameState.reactor.currentEnergy || 0);

  // 1. Strict Energy Verification (Must have enough energy for active multiplier)
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

  // If player doesn't have enough energy for current multiplier M, fallback to highest affordable
  let activeMult = mult;
  if (availableEnergy < mult) {
    activeMult = 1;
    gameState.reactor.tapMultiplier = 1;
    updateMultiTapOptions();
  }

  // Consume Energy (-activeMult Energy per click)
  gameState.reactor.currentEnergy = Math.max(0, (gameState.reactor.currentEnergy || 0) - activeMult);

  // Immediate live sync of energy balance on Home & Energy page (cached lookups)
  if (!_homeEnergyTapCountEl) _homeEnergyTapCountEl = document.getElementById('energyTapCount') || DOM.energyTapCount;
  if (_homeEnergyTapCountEl) {
    _homeEnergyTapCountEl.textContent = Math.floor(gameState.reactor.currentEnergy).toString();
  }
  if (!_homeEpCounterEl) _homeEpCounterEl = document.querySelector('#epCounterPill .ep-badge-icon');
  if (_homeEpCounterEl) {
    const curVal = Math.max(0, Number(gameState.reactor.currentEnergy) || 0);
    _homeEpCounterEl.textContent = curVal.toFixed(2);
  }

  updateMultiTapOptions();

  // 2. Combo Calculation based on total tap streak
  gameState.reactor.comboTaps = (gameState.reactor.comboTaps || 0) + activeMult;
  gameState.reactor.comboMultiplier = getComboMultiplier(gameState.reactor.comboTaps);

  const comboLvl = Math.floor(gameState.reactor.comboMultiplier);
  sfx.playTapSound(comboLvl);

  // 3. Tap Registration & Blue Coin Bank Collection
  gameState.reactor.energyTaps = (gameState.reactor.energyTaps || 0) + activeMult;
  if (typeof checkDailyStatsDate === 'function') checkDailyStatsDate();
  if (gameState.dailyStats) {
    gameState.dailyStats.taps = (gameState.dailyStats.taps || 0) + activeMult;
  }

  const now = Date.now();

  // Check 24-hour full bank withdrawal pass
  const is24hPassActive = !!(gameState.bank && gameState.bank.fullWithdrawalPassEndTime && now < gameState.bank.fullWithdrawalPassEndTime);
  let coinDepositText = `+${activeMult} 🪙`;
  if (is24hPassActive) {
    gameState.player.coins = (gameState.player.coins || 0) + activeMult;
    coinDepositText = `+${activeMult} 🪙`;
  } else {
    if (!gameState.bank) gameState.bank = { coins: 0, fullWithdrawalPassEndTime: 0 };
    gameState.bank.coins = (gameState.bank.coins || 0) + activeMult;
  }

  

  // 4. Boosters & XP Progression
  const isProfit2xActive = !!(
    (gameState.reactor && gameState.reactor.profit2xEndTime && now < gameState.reactor.profit2xEndTime) ||
    isHome2xBoostActive()
  );
  const isFastXpActive = !!(
    gameState.reactor && gameState.reactor.fastXpEndTime && now < gameState.reactor.fastXpEndTime
  );

  const boostFactor = isProfit2xActive ? 2 : 1;
  const comboMultiplier = gameState.reactor.comboMultiplier || 1.0;
  let xpGain = +(0.1 * comboMultiplier * boostFactor * activeMult).toFixed(2);
  if (isFastXpActive) {
    xpGain = +(xpGain + (1.0 * activeMult)).toFixed(2); // Fast XP per tap scaled!
  }

  gameState.player.xp = +(gameState.player.xp + xpGain).toFixed(2);
  if (gameState.progression) {
    gameState.progression.levelXp = +((gameState.progression.levelXp || 0) + xpGain).toFixed(2);
  }

  // Level Up Check
  const maxLevel = gameState.player.maxLevel || 500;
  const curActiveLvl = typeof getActiveLevel === 'function' ? getActiveLevel() : ((gameState.progression && gameState.progression.activeLevel) || gameState.player.level || 1);
  const cfgActive = typeof getLevelConfig === 'function' ? getLevelConfig(curActiveLvl) : null;
  const xpNeeded = cfgActive ? Number(cfgActive.xpRequired) : (typeof getLevelRequiredXP === 'function' ? getLevelRequiredXP(curActiveLvl) : curActiveLvl * 1000);

  if ((gameState.progression && gameState.progression.levelXp >= xpNeeded) || (gameState.player.xp >= xpNeeded)) {
    // Check if targets are also completed or auto-advance
    if (typeof canClaimActiveLevel === 'function' && canClaimActiveLevel(curActiveLvl)) {
      if (typeof completeActiveLevel === 'function') {
        completeActiveLevel(curActiveLvl);
        sfx.playLevelUpSound();
        triggerLevelUpAnimation();
        if (typeof showFloatingToast === 'function') {
          showFloatingToast(`🎉 Level ${curActiveLvl} Completed! Advanced to Level ${getActiveLevel()}!`);
        }
      }
    }
  }

  // 5. Random Item Drops on Taps (🎟️ Card, 🔑 Key, 🎫 Ticket) -> Level Targets
  let droppedItem = null;
  const roll = Math.random();
  if (roll < 0.28) { // 28% chance per tap
    const activeLvl = typeof getActiveLevel === 'function' ? getActiveLevel() : ((gameState.progression && gameState.progression.activeLevel) || 1);
    const req = typeof getGoalLevelRequirements === 'function' ? getGoalLevelRequirements(activeLvl) : { cards: 20, keys: 50, tickets: 35 };
    if (!gameState.progression) {
      gameState.progression = { activeLevel: 1, completedLevels: {}, levelProgress: { cards: 0, keys: 0, tickets: 0 }, levelXp: 0 };
    }
    if (!gameState.progression.levelProgress) {
      gameState.progression.levelProgress = { cards: 0, keys: 0, tickets: 0 };
    }
    if (!gameState.goalState) gameState.goalState = {};
    if (!gameState.goalState.levelProgress) gameState.goalState.levelProgress = { cards: 0, keys: 0, tickets: 0 };
    
    const itemRoll = Math.random();
    if (itemRoll < 0.35) {
      gameState.progression.levelProgress.cards = Math.min(req.cards, (gameState.progression.levelProgress.cards || 0) + activeMult);
      gameState.goalState.levelProgress.cards = gameState.progression.levelProgress.cards;
      droppedItem = { text: `🃏 +${activeMult} Card${activeMult > 1 ? 's' : ''}`, color: '#f43f5e' };
    } else if (itemRoll < 0.70) {
      gameState.progression.levelProgress.keys = Math.min(req.keys, (gameState.progression.levelProgress.keys || 0) + activeMult);
      gameState.goalState.levelProgress.keys = gameState.progression.levelProgress.keys;
      droppedItem = { text: `🔑 +${activeMult} Key${activeMult > 1 ? 's' : ''}`, color: '#fbbf24' };
    } else {
      gameState.progression.levelProgress.tickets = Math.min(req.tickets, (gameState.progression.levelProgress.tickets || 0) + activeMult);
      gameState.goalState.levelProgress.tickets = gameState.progression.levelProgress.tickets;
      droppedItem = { text: `🎟️ +${activeMult} Ticket${activeMult > 1 ? 's' : ''}`, color: '#ec4899' };
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
    let tapText = `+${activeMult} Tap${activeMult > 1 ? 's' : ''}`;
    if (isProfit2xActive) tapText = `🔥 +${activeMult} Tap${activeMult > 1 ? 's' : ''} (*2 Profit)`;
    createFloatingNumber(clientX, clientY, tapText, isProfit2xActive ? '#fbbf24' : '#38bdf8');
    
    

    if (isFastXpActive) {
      setTimeout(() => {
        createFloatingNumber(clientX + (Math.random() - 0.5) * 20, clientY - 38, `+${activeMult} ⭐ Fast XP`, '#c084fc');
      }, 110);
    }

    if (droppedItem) {
      setTimeout(() => {
        createFloatingNumber(clientX + (Math.random() - 0.5) * 30, clientY - 48, droppedItem.text, droppedItem.color);
      }, 160);
    }
    createSparks(clientX, clientY);
  }

  updateUI();
  saveGame();
}

let _homeEnergyTapCountEl = null;
let _homeEpCounterEl = null;
let _homeBlueEls = null;
let _homeOrbStageRect = null;
let _homeOrbStageRectTime = 0;

function getOrbStageRect() {
  const now = performance.now();
  if (!_homeOrbStageRect || (now - _homeOrbStageRectTime) > 800) {
    if (DOM.orbStage) {
      _homeOrbStageRect = DOM.orbStage.getBoundingClientRect();
      _homeOrbStageRectTime = now;
    }
  }
  return _homeOrbStageRect || { left: 0, top: 0 };
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
  
  const rect = getOrbStageRect();
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
  const rect = getOrbStageRect();
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

let _cachedHomeGoldEls = null;
let _cachedHomeBlueEls = null;
let _cachedHomeDiamondEls = null;
let _cachedHomeXpLimitEl = null;
let _cachedHomeGoalCardsEl = null;
let _cachedHomeEnergyTapEl = null;
let _cachedHomeBadgeProfit = null;
let _cachedHomeBadgeBank = null;

let _lastHomeGoldText = null;
let _lastHomeBlueText = null;
let _lastHomeDiamondText = null;

function updateHomeUI() {
  const activeLevel = typeof getActiveLevel === 'function'
    ? getActiveLevel()
    : ((gameState.progression && gameState.progression.activeLevel) || gameState.player.level || 1);

  if (DOM.playerLevelBadge) {
    const lvlText = `Lv.${activeLevel}`;
    if (DOM.playerLevelBadge.textContent !== lvlText) DOM.playerLevelBadge.textContent = lvlText;
  }

  // 1. Coins
  const formattedGold = formatNumber(gameState.player.coins);
  if (_lastHomeGoldText !== formattedGold) {
    _lastHomeGoldText = formattedGold;
    if (!_cachedHomeGoldEls) _cachedHomeGoldEls = document.querySelectorAll('#coinCounter, #headerCoinBalance');
    _cachedHomeGoldEls.forEach(el => { if (el.textContent !== formattedGold) el.textContent = formattedGold; });
  }

  

  // 3. Diamonds
  const formattedDiamonds = formatNumber(gameState.player.diamonds || 0);
  if (_lastHomeDiamondText !== formattedDiamonds) {
    _lastHomeDiamondText = formattedDiamonds;
    if (!_cachedHomeDiamondEls) _cachedHomeDiamondEls = document.querySelectorAll('#headerDiamondBalance, #playerDiamondBalance');
    _cachedHomeDiamondEls.forEach(el => { if (el.textContent !== formattedDiamonds) el.textContent = formattedDiamonds; });
  }

  // Level Config from single source of truth
  const cfg = typeof getLevelConfig === 'function' ? getLevelConfig(activeLevel) : null;
  const xpTarget = cfg ? Number(cfg.xpRequired) : (typeof getLevelRequiredXP === 'function' ? getLevelRequiredXP(activeLevel) : activeLevel * 1000);
  const xpCurrent = (gameState.progression && gameState.progression.levelXp !== undefined)
    ? Number(gameState.progression.levelXp)
    : Number(gameState.player.xp || 0);

  // XP Card
  if (DOM.xpLevelNum) {
    const actLvlStr = String(activeLevel);
    if (DOM.xpLevelNum.textContent !== actLvlStr) DOM.xpLevelNum.textContent = actLvlStr;
  }
  const xpPercent = Math.min(100, Math.max(0, (xpCurrent / xpTarget) * 100));
  if (DOM.xpProgressFill) {
    const xpW = `${xpPercent}%`;
    if (DOM.xpProgressFill.style.width !== xpW) DOM.xpProgressFill.style.width = xpW;
  }

  if (!_cachedHomeXpLimitEl) _cachedHomeXpLimitEl = document.getElementById('xpLevelLimitText');
  if (_cachedHomeXpLimitEl) {
    const xpLimitStr = `${Math.floor(xpCurrent)} / ${xpTarget}`;
    if (_cachedHomeXpLimitEl.textContent !== xpLimitStr) _cachedHomeXpLimitEl.textContent = xpLimitStr;
  }

  // Goal Card Progress & Stats (Active Level Targets)
  const goalReq = (cfg && cfg.targets)
    ? cfg.targets
    : (typeof getGoalLevelRequirements === 'function' ? getGoalLevelRequirements(activeLevel) : { cards: 20, keys: 50, tickets: 35 });
  
  const goalProg = (gameState.progression && gameState.progression.levelProgress)
    || (gameState.goalState && gameState.goalState.levelProgress)
    || { cards: 0, keys: 0, tickets: 0 };

  if (DOM.goalLevelNum) {
    const gLvlStr = String(activeLevel);
    if (DOM.goalLevelNum.textContent !== gLvlStr) DOM.goalLevelNum.textContent = gLvlStr;
  }
  
  if (!_cachedHomeGoalCardsEl) _cachedHomeGoalCardsEl = document.getElementById('goalCards') || DOM.goalCoins;
  if (_cachedHomeGoalCardsEl) {
    const gCardsStr = `${goalProg.cards || 0}/${goalReq.cards}`;
    if (_cachedHomeGoalCardsEl.textContent !== gCardsStr) _cachedHomeGoalCardsEl.textContent = gCardsStr;
  }
  if (DOM.goalKeys) {
    const gKeysStr = `${goalProg.keys || 0}/${goalReq.keys}`;
    if (DOM.goalKeys.textContent !== gKeysStr) DOM.goalKeys.textContent = gKeysStr;
  }
  if (DOM.goalTickets) {
    const gTicketsStr = `${goalProg.tickets || 0}/${goalReq.tickets}`;
    if (DOM.goalTickets.textContent !== gTicketsStr) DOM.goalTickets.textContent = gTicketsStr;
  }
  
  const totalGoalRatio = (
    (((goalProg.cards || 0) / goalReq.cards) * 0.34) +
    (((goalProg.keys || 0) / goalReq.keys) * 0.33) +
    (((goalProg.tickets || 0) / goalReq.tickets) * 0.33)
  ) * 100;
  if (DOM.goalProgressFill) {
    const goalW = `${Math.min(100, Math.max(6, totalGoalRatio))}%`;
    if (DOM.goalProgressFill.style.width !== goalW) DOM.goalProgressFill.style.width = goalW;
  }

  // Energy Balance Pill (⚡ Energy Balance - Integer Only)
  if (!_cachedHomeEnergyTapEl) _cachedHomeEnergyTapEl = document.getElementById('energyTapCount') || DOM.energyTapCount;
  if (_cachedHomeEnergyTapEl) {
    const curEnergy = gameState.reactor.currentEnergy !== undefined ? gameState.reactor.currentEnergy : 0;
    const energyStr = Math.floor(Math.max(0, curEnergy)).toString();
    if (_cachedHomeEnergyTapEl.textContent !== energyStr) _cachedHomeEnergyTapEl.textContent = energyStr;
  }

  // Booster Button Badges
  const now = Date.now();
  if (!_cachedHomeBadgeProfit) _cachedHomeBadgeProfit = document.getElementById('badgeBoosterProfit');
  if (_cachedHomeBadgeProfit) {
    const isAct = !!(gameState.reactor && gameState.reactor.profit2xEndTime && now < gameState.reactor.profit2xEndTime);
    let profText;
    if (isAct) {
      const rem = Math.ceil((gameState.reactor.profit2xEndTime - now) / 1000);
      const h = Math.floor(rem / 3600);
      const m = Math.floor((rem % 3600) / 60);
      profText = `${h}h ${m}m`;
    } else {
      profText = '*2 PROFIT';
    }
    if (_cachedHomeBadgeProfit.textContent !== profText) _cachedHomeBadgeProfit.textContent = profText;
  }

  const badgeBank = document.getElementById('badgeBoosterBank');
  if (badgeBank) {
    const bankCoins = (gameState.bank && gameState.bank.coins) || 0;
    const bankStr = `${bankCoins} 🪙`;
    if (badgeBank.textContent !== bankStr) badgeBank.textContent = bankStr;
  }

  const badgeFastXp = document.getElementById('badgeBoosterFastXp');
  if (badgeFastXp) {
    const isAct = !!(gameState.reactor && gameState.reactor.fastXpEndTime && now < gameState.reactor.fastXpEndTime);
    if (isAct) {
      const rem = Math.ceil((gameState.reactor.fastXpEndTime - now) / 1000);
      const m = Math.floor(rem / 60);
      const s = rem % 60;
      badgeFastXp.textContent = `${m}:${String(s).padStart(2, '0')}`;
    } else {
      badgeFastXp.textContent = 'FAST XP';
    }
  }

  // Update Combo Pill
  updateHomeComboPill();

  // Update Multi-Tap Circle Selector Options (*1, *2, *3, *5, *10, *50, *100)
  if (typeof updateMultiTapOptions === 'function') {
    updateMultiTapOptions();
  }

  // Update 5-Hour Energy Booster Icon Visibility
  if (typeof updateHomeEnergyBoosterVisibility === 'function') {
    updateHomeEnergyBoosterVisibility();
  }

  // Update Quantum Diamond Generator & Upgrades UI
  if (typeof updateDiamondGeneratorUI === 'function') {
    updateDiamondGeneratorUI();
  }
}

// ==========================================================================
// QUANTUM DIAMOND GENERATOR ENGINE
// - Base: 0.000001 Diamond every 60.00s
// - Output Upgrade: +0.000001 Diamond / cycle (Starts 50 Coins, +25 Coins each)
// - Output Cost Reduction (after 10 upgrades):
//     - 1,000 Diamonds = -100 Coins (One-time)
//     - 1 Ad = -50 Coins (Repeatable for more uses)
// - Time Reduce Upgrade: -0.01s cycle time (Starts 10 Diamonds, +50 Diamonds each)
// - Time Cost Reduction:
//     - 1st Ad = -10 Diamonds cost reduction
//     - 10 min cooldown timer
//     - Subsequent Ads = -1 Diamond cost reduction per ad (with 10m cooldown between)
// ==========================================================================

let _diamondGenInterval = null;

function getDiamondsPerCycle() {
  if (!gameState || !gameState.diamondGenerator) return 0.000001;
  const base = 0.000001;
  const level = gameState.diamondGenerator.productionLevel || 1;
  return Number((base + (level - 1) * 0.000001).toFixed(6));
}

function getDiamondCycleDuration() {
  if (!gameState || !gameState.diamondGenerator) return 60.00;
  const level = gameState.diamondGenerator.timeLevel || 1;
  const duration = 60.00 - (level - 1) * 0.01;
  return Math.max(1.00, Number(duration.toFixed(2)));
}

function getDiamondOutputCost() {
  if (!gameState || !gameState.diamondGenerator) return 50;
  const upgradesCount = gameState.diamondGenerator.productionUpgradesCount || 0;
  const baseCost = 50 + upgradesCount * 25;
  const discount = gameState.diamondGenerator.productionCostDiscount || 0;
  return Math.max(25, baseCost - discount);
}

function getDiamondSpeedCost() {
  if (!gameState || !gameState.diamondGenerator) return 10;
  const upgradesCount = gameState.diamondGenerator.timeUpgradesCount || 0;
  const baseCost = 10 + upgradesCount * 50;
  const discount = gameState.diamondGenerator.timeCostDiscount || 0;
  return Math.max(1, baseCost - discount);
}

function initDiamondGeneratorEngine() {
  if (!gameState.diamondGenerator) {
    gameState.diamondGenerator = {
      diamondsPerCycle: 0.000001,
      cycleDuration: 60.00,
      progressSeconds: 0,
      lastTickTime: Date.now(),
      totalDiamondsProduced: 0,
      productionLevel: 1,
      productionUpgradesCount: 0,
      productionBaseCost: 50,
      productionCostStep: 25,
      productionCostDiscount: 0,
      production1000DiamondDiscountUsed: false,
      productionAdDiscountsCount: 0,
      timeLevel: 1,
      timeUpgradesCount: 0,
      timeBaseCost: 10,
      timeCostStep: 50,
      timeCostDiscount: 0,
      timeAdFirstDiscountUsed: false,
      timeAdCooldownEndTime: 0,
      timeSubsequentAdDiscountsCount: 0
    };
  }

  // Catchup offline time
  catchupDiamondGenerator();

  if (_diamondGenInterval) {
    clearInterval(_diamondGenInterval);
    _diamondGenInterval = null;
  }

  // Defer to diamond-generator.js engine to prevent duplicate timers and screen blinking
  if (typeof updateDiamondGeneratorUI === 'function') {
    updateDiamondGeneratorUI();
  }
}

function catchupDiamondGenerator() {
  if (!gameState || !gameState.diamondGenerator) return;
  const now = Date.now();
  const lastTick = gameState.diamondGenerator.lastTickTime || now;
  const elapsed = Math.max(0, (now - lastTick) / 1000);
  const cycleDur = getDiamondCycleDuration();
  const rate = getDiamondsPerCycle();

  if (elapsed > 0) {
    const totalProg = (gameState.diamondGenerator.progressSeconds || 0) + elapsed;
    const completed = Math.floor(totalProg / cycleDur);
    if (completed > 0) {
      const generated = Number((completed * rate).toFixed(6));
      gameState.player.diamonds = Number(((gameState.player.diamonds || 0) + generated).toFixed(6));
      gameState.diamondGenerator.totalDiamondsProduced = Number(((gameState.diamondGenerator.totalDiamondsProduced || 0) + generated).toFixed(6));
      gameState.diamondGenerator.progressSeconds = totalProg % cycleDur;
      if (typeof showFloatingToast === 'function') {
        showFloatingToast(`💎 Generator produced +${formatDiamondDisplay(generated)} Diamonds while away!`);
      }
      if (typeof updateUI === 'function') updateUI();
      if (typeof saveGame === 'function') saveGame();
    } else {
      gameState.diamondGenerator.progressSeconds = totalProg;
    }
  }
  gameState.diamondGenerator.lastTickTime = now;
}
window.catchupDiamondGenerator = catchupDiamondGenerator;

function tickDiamondGenerator() {
  if (!gameState || !gameState.diamondGenerator) return;
  const now = Date.now();
  const lastTick = gameState.diamondGenerator.lastTickTime || now;
  const dt = Math.max(0, (now - lastTick) / 1000);
  gameState.diamondGenerator.lastTickTime = now;

  const cycleDur = getDiamondCycleDuration();
  const rate = getDiamondsPerCycle();

  gameState.diamondGenerator.progressSeconds = (gameState.diamondGenerator.progressSeconds || 0) + dt;

  if (gameState.diamondGenerator.progressSeconds >= cycleDur) {
    const completedCycles = Math.floor(gameState.diamondGenerator.progressSeconds / cycleDur);
    gameState.diamondGenerator.progressSeconds = gameState.diamondGenerator.progressSeconds % cycleDur;

    const awardedDiamonds = Number((completedCycles * rate).toFixed(6));
    gameState.player.diamonds = Number(((gameState.player.diamonds || 0) + awardedDiamonds).toFixed(6));
    gameState.diamondGenerator.totalDiamondsProduced = Number(((gameState.diamondGenerator.totalDiamondsProduced || 0) + awardedDiamonds).toFixed(6));

    // Audio & Visual celebratory burst
    triggerDiamondGlintEffect();
    if (typeof sfx !== 'undefined' && typeof sfx.playCoinSound === 'function') {
      sfx.playCoinSound();
    }

    if (completedCycles === 1) {
      const coreEl = document.getElementById('diamondCrystalNode');
      if (coreEl) {
        const rect = coreEl.getBoundingClientRect();
        if (typeof createFloatingNumber === 'function') {
          createFloatingNumber(rect.left + rect.width / 2, rect.top + 20, `+${formatDiamondDisplay(awardedDiamonds)} 💎`, '#00f0ff');
        }
      }
    }

    if (typeof updateUI === 'function') updateUI();
    if (typeof saveGame === 'function') saveGame();
  }

  // Update live progress and countdown elements directly for ultra-smooth 60fps feel
  updateDiamondLiveIndicators(cycleDur, rate);
}

function updateDiamondLiveIndicators(cycleDur, rate) {
  if (typeof updateDiamondGeneratorRealtime === 'function') {
    updateDiamondGeneratorRealtime();
    return;
  }
}

function updateDiamondGeneratorUI() {
  if (typeof window.updateDiamondGeneratorUI === 'function' && window.updateDiamondGeneratorUI !== updateDiamondGeneratorUI) {
    window.updateDiamondGeneratorUI();
    return;
  }
  if (!gameState || !gameState.diamondGenerator) return;

  const cycleDur = getDiamondCycleDuration();
  const rate = getDiamondsPerCycle();
  const outputCost = getDiamondOutputCost();
  const speedCost = getDiamondSpeedCost();
  const pLevel = gameState.diamondGenerator.productionLevel || 1;
  const sLevel = gameState.diamondGenerator.timeLevel || 1;
  const upCount = gameState.diamondGenerator.productionUpgradesCount || 0;

  // Header Rate Pill
  const headerPill = document.getElementById('genRateHeaderBadge');
  if (headerPill) {
    headerPill.textContent = `+${formatDiamondDisplay(rate)} 💎 / ${cycleDur.toFixed(2)}s`;
  }

  // Linear meta left
  const metaLeft = document.getElementById('diamondCycleRateMeta');
  if (metaLeft) {
    metaLeft.textContent = `💎 +${formatDiamondDisplay(rate)} every ${cycleDur.toFixed(2)}s`;
  }

  // 1. Output Upgrade Card
  const outSub = document.getElementById('ducOutputSub');
  if (outSub) {
    outSub.textContent = `Rate: +${formatDiamondDisplay(rate)} 💎/cycle`;
  }
  const outBadge = document.getElementById('ducOutputLevelBadge');
  if (outBadge) {
    outBadge.textContent = `Lv. ${pLevel}`;
  }
  const btnOutCost = document.getElementById('btnUpgradeOutputCostText');
  if (btnOutCost) {
    btnOutCost.textContent = `Cost: 🪙 ${outputCost} Coins`;
  }
  const btnOut = document.getElementById('btnUpgradeOutput');
  if (btnOut) {
    const canAffordCoins = (gameState.player.coins || 0) >= outputCost;
    btnOut.disabled = !canAffordCoins;
  }

  // Cost Reducer Box for Output
  const milestoneText = document.getElementById('outputReducerMilestoneText');
  const reducerActions = document.getElementById('outputReducerActions');
  const isReducerUnlocked = upCount >= 10;

  if (milestoneText) {
    if (isReducerUnlocked) {
      milestoneText.textContent = `✨ UNLOCKED (${upCount} Upgrades)`;
      milestoneText.style.color = '#10b981';
    } else {
      milestoneText.textContent = `Unlocks after 10 Upgrades (${upCount}/10)`;
      milestoneText.style.color = '#f59e0b';
    }
  }
  if (reducerActions) {
    reducerActions.style.display = isReducerUnlocked ? 'flex' : 'none';
  }

  // 1,000 Diamond discount button state
  const btn1000 = document.getElementById('btnDiscount1000Diamond');
  const btn1000Title = document.getElementById('btnDiscount1000Title');
  if (btn1000) {
    const alreadyUsed = !!gameState.diamondGenerator.production1000DiamondDiscountUsed;
    if (alreadyUsed) {
      btn1000.disabled = true;
      if (btn1000Title) btn1000Title.textContent = '✓ Claimed (-100 Coins)';
    } else {
      const has1000Diamonds = (gameState.player.diamonds || 0) >= 1000;
      btn1000.disabled = !has1000Diamonds;
      if (btn1000Title) btn1000Title.textContent = 'Use 1,000 Diamonds';
    }
  }

  // Output discount note
  const outDiscount = gameState.diamondGenerator.productionCostDiscount || 0;
  const outDiscountNote = document.getElementById('outputDiscountAppliedNote');
  if (outDiscountNote) {
    if (outDiscount > 0) {
      outDiscountNote.style.display = 'block';
      outDiscountNote.textContent = `Total Discount: -${outDiscount} Coins (Min: 25 Coins)`;
    } else {
      outDiscountNote.style.display = 'none';
    }
  }

  // 2. Speed Upgrade Card
  const speedSub = document.getElementById('ducSpeedSub');
  if (speedSub) {
    speedSub.textContent = `Cycle: ${cycleDur.toFixed(2)}s`;
  }
  const speedBadge = document.getElementById('ducSpeedLevelBadge');
  if (speedBadge) {
    speedBadge.textContent = `Lv. ${sLevel}`;
  }
  const btnSpeedCost = document.getElementById('btnUpgradeSpeedCostText');
  if (btnSpeedCost) {
    btnSpeedCost.textContent = `Cost: 💎 ${speedCost} Diamonds`;
  }
  const btnSpeed = document.getElementById('btnUpgradeSpeed');
  if (btnSpeed) {
    const canAffordDiamonds = (gameState.player.diamonds || 0) >= speedCost;
    btnSpeed.disabled = !canAffordDiamonds;
  }

  // Speed Ad Discount Button text & state
  updateSpeedAdDiscountButtonState();

  // Speed discount note
  const speedDiscount = gameState.diamondGenerator.timeCostDiscount || 0;
  const speedDiscountNote = document.getElementById('speedDiscountAppliedNote');
  if (speedDiscountNote) {
    if (speedDiscount > 0) {
      speedDiscountNote.style.display = 'block';
      speedDiscountNote.textContent = `Total Discount: -${speedDiscount} Diamonds (Min: 1 💎)`;
    } else {
      speedDiscountNote.style.display = 'none';
    }
  }

  // Footer Total Produced
  const totalVal = document.getElementById('genTotalProducedVal');
  if (totalVal) {
    totalVal.textContent = formatDiamondDisplay(gameState.diamondGenerator.totalDiamondsProduced || 0);
  }

  // Sync Entry Card Badges on Home and Energy Pages
  const dgeRate = document.getElementById('dgeHomeRateVal');
  if (dgeRate) dgeRate.textContent = `+${formatDiamondDisplay(rate)} 💎 / ${cycleDur.toFixed(2)}s`;

  const dgeCycle = document.getElementById('dgeHomeCycleText');
  if (dgeCycle) dgeCycle.textContent = `Cycle: ${cycleDur.toFixed(2)}s`;

  const dgEnergyRate = document.getElementById('dgEnergyEntryRate');
  if (dgEnergyRate) dgEnergyRate.textContent = `+${formatDiamondDisplay(rate)}`;

  const dgEnergyCycle = document.getElementById('dgEnergyEntryCycle');
  if (dgEnergyCycle) dgEnergyCycle.textContent = `${cycleDur.toFixed(2)}s`;
}

function updateSpeedAdDiscountButtonState() {
  const btn = document.getElementById('btnDiscountSpeedAd');
  const title = document.getElementById('speedAdDiscountBtnTitle');
  const sub = document.getElementById('speedAdDiscountBtnSub');
  const statusBadge = document.getElementById('speedReducerStatusBadge');
  if (!btn || !gameState.diamondGenerator) return;

  const now = Date.now();
  const cooldownEnd = gameState.diamondGenerator.timeAdCooldownEndTime || 0;
  const isCooldown = cooldownEnd > now;
  const isFirstAd = !gameState.diamondGenerator.timeAdFirstDiscountUsed;

  if (isCooldown) {
    btn.disabled = true;
    const rem = Math.ceil((cooldownEnd - now) / 1000);
    const m = Math.floor(rem / 60);
    const s = rem % 60;
    if (title) title.textContent = `⏳ Cooldown (${m}:${String(s).padStart(2, '0')})`;
    if (sub) sub.textContent = 'Next ad reduces 1 💎 in cost';
    if (statusBadge) {
      statusBadge.textContent = `Cooldown: ${m}:${String(s).padStart(2, '0')}`;
      statusBadge.style.color = '#94a3b8';
    }
  } else {
    btn.disabled = false;
    if (isFirstAd) {
      if (title) title.textContent = 'Watch Ad (-10 💎 Cost)';
      if (sub) sub.textContent = 'First Ad Bonus • 10m Cooldown';
      if (statusBadge) {
        statusBadge.textContent = 'First Ad: -10 💎!';
        statusBadge.style.color = '#34d399';
      }
    } else {
      if (title) title.textContent = 'Watch Ad (-1 💎 Cost)';
      if (sub) sub.textContent = 'Per Ad: -1 💎 • 10m Cooldown';
      if (statusBadge) {
        statusBadge.textContent = 'Ad Ready: -1 💎';
        statusBadge.style.color = '#38bdf8';
      }
    }
  }
}

function updateSpeedAdCooldownRealtime() {
  if (!gameState || !gameState.diamondGenerator) return;
  const now = Date.now();
  const cooldownEnd = gameState.diamondGenerator.timeAdCooldownEndTime || 0;
  if (cooldownEnd > 0) {
    updateSpeedAdDiscountButtonState();
  }
}

function triggerDiamondGlintEffect() {
  const node = document.getElementById('diamondCrystalNode');
  if (node) {
    node.classList.add('diamond-glint-burst');
    setTimeout(() => {
      node.classList.remove('diamond-glint-burst');
    }, 600);
  }
}

// --------------------------------------------------------------------------
// UPGRADE ACTIONS
// --------------------------------------------------------------------------

function purchaseDiamondOutputUpgrade() {
  if (!gameState || !gameState.diamondGenerator) return;
  const cost = getDiamondOutputCost();

  if ((gameState.player.coins || 0) < cost) {
    if (typeof sfx !== 'undefined' && typeof sfx.playTapSound === 'function') sfx.playTapSound(1);
    const btn = document.getElementById('btnUpgradeOutput');
    if (btn) {
      btn.classList.add('orb-error-shake');
      setTimeout(() => btn.classList.remove('orb-error-shake'), 400);
    }
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`🪙 Need ${cost} Coins to upgrade output!`);
    }
    return;
  }

  // Deduct coins & upgrade output
  gameState.player.coins -= cost;
  gameState.diamondGenerator.productionLevel = (gameState.diamondGenerator.productionLevel || 1) + 1;
  gameState.diamondGenerator.productionUpgradesCount = (gameState.diamondGenerator.productionUpgradesCount || 0) + 1;
  gameState.diamondGenerator.diamondsPerCycle = Number(((gameState.diamondGenerator.diamondsPerCycle || 0.000001) + 0.000001).toFixed(6));

  if (typeof triggerTelegramHaptic === 'function') triggerTelegramHaptic('success');
  if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') sfx.playLevelUpSound();

  if (gameState.diamondGenerator.productionUpgradesCount === 10) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('🎉 Milestone Reached! Cost Reducer is now UNLOCKED for Output Upgrades!');
    }
  } else {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`✨ Output Upgraded! Now generating +${formatDiamondDisplay(getDiamondsPerCycle())} 💎 per cycle!`);
    }
  }

  triggerDiamondGlintEffect();
  updateHomeUI();
  if (typeof updateUI === 'function') updateUI();
  saveGame(true);
}
window.purchaseDiamondOutputUpgrade = purchaseDiamondOutputUpgrade;

function applyDiamondDiscount1000() {
  if (!gameState || !gameState.diamondGenerator) return;
  if ((gameState.diamondGenerator.productionUpgradesCount || 0) < 10) {
    if (typeof showFloatingToast === 'function') showFloatingToast('🔒 Unlocks after 10 Output Upgrades!');
    return;
  }
  if (gameState.diamondGenerator.production1000DiamondDiscountUsed) {
    if (typeof showFloatingToast === 'function') showFloatingToast('✓ 1,000 Diamond discount already claimed!');
    return;
  }
  if ((gameState.player.diamonds || 0) < 1000) {
    if (typeof showFloatingToast === 'function') showFloatingToast(`💎 Need 1,000 Diamonds! (Current: ${formatNumber(gameState.player.diamonds || 0)})`);
    return;
  }

  gameState.player.diamonds = Number(((gameState.player.diamonds || 0) - 1000).toFixed(6));
  gameState.diamondGenerator.production1000DiamondDiscountUsed = true;
  gameState.diamondGenerator.productionCostDiscount = (gameState.diamondGenerator.productionCostDiscount || 0) + 100;

  if (typeof triggerTelegramHaptic === 'function') triggerTelegramHaptic('success');
  if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') sfx.playLevelUpSound();
  if (typeof showFloatingToast === 'function') {
    showFloatingToast('🎉 Spent 1,000 Diamonds! Output upgrade cost reduced by 100 Coins!');
  }

  updateHomeUI();
  if (typeof updateUI === 'function') updateUI();
  saveGame(true);
}
window.applyDiamondDiscount1000 = applyDiamondDiscount1000;

function applyOutputAdDiscount() {
  if (!gameState || !gameState.diamondGenerator) return;
  if ((gameState.diamondGenerator.productionUpgradesCount || 0) < 10) {
    if (typeof showFloatingToast === 'function') showFloatingToast('🔒 Unlocks after 10 Output Upgrades!');
    return;
  }

  if (typeof showRewardedAd === 'function') {
    showRewardedAd(() => {
      gameState.diamondGenerator.productionCostDiscount = (gameState.diamondGenerator.productionCostDiscount || 0) + 50;
      gameState.diamondGenerator.productionAdDiscountsCount = (gameState.diamondGenerator.productionAdDiscountsCount || 0) + 1;
      if (typeof showFloatingToast === 'function') {
        showFloatingToast('🎬 Ad watched! Output upgrade cost reduced by 50 Coins!');
      }
      updateHomeUI();
      if (typeof updateUI === 'function') updateUI();
      saveGame(true);
    }, {
      adTitle: 'Output Upgrade Discount',
      adDesc: 'Watch ad to reduce coin cost by 50 coins!'
    });
  } else {
    gameState.diamondGenerator.productionCostDiscount = (gameState.diamondGenerator.productionCostDiscount || 0) + 50;
    gameState.diamondGenerator.productionAdDiscountsCount = (gameState.diamondGenerator.productionAdDiscountsCount || 0) + 1;
    updateHomeUI();
    if (typeof updateUI === 'function') updateUI();
    saveGame(true);
  }
}
window.applyOutputAdDiscount = applyOutputAdDiscount;

function purchaseDiamondSpeedUpgrade() {
  if (!gameState || !gameState.diamondGenerator) return;
  const cost = getDiamondSpeedCost();

  if ((gameState.player.diamonds || 0) < cost) {
    if (typeof sfx !== 'undefined' && typeof sfx.playTapSound === 'function') sfx.playTapSound(1);
    const btn = document.getElementById('btnUpgradeSpeed');
    if (btn) {
      btn.classList.add('orb-error-shake');
      setTimeout(() => btn.classList.remove('orb-error-shake'), 400);
    }
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`💎 Need ${cost} Diamonds to overclock speed!`);
    }
    return;
  }

  // Deduct diamonds & upgrade speed
  gameState.player.diamonds = Number(((gameState.player.diamonds || 0) - cost).toFixed(6));
  gameState.diamondGenerator.timeLevel = (gameState.diamondGenerator.timeLevel || 1) + 1;
  gameState.diamondGenerator.timeUpgradesCount = (gameState.diamondGenerator.timeUpgradesCount || 0) + 1;
  gameState.diamondGenerator.cycleDuration = Math.max(1.00, Number(((gameState.diamondGenerator.cycleDuration || 60.00) - 0.01).toFixed(2)));

  if (typeof triggerTelegramHaptic === 'function') triggerTelegramHaptic('success');
  if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') sfx.playLevelUpSound();
  if (typeof showFloatingToast === 'function') {
    showFloatingToast(`⚡ Overclocked! Cycle time reduced to ${getDiamondCycleDuration().toFixed(2)}s (-0.01s)!`);
  }

  triggerDiamondGlintEffect();
  updateHomeUI();
  if (typeof updateUI === 'function') updateUI();
  saveGame(true);
}
window.purchaseDiamondSpeedUpgrade = purchaseDiamondSpeedUpgrade;

function applySpeedAdDiscount() {
  if (!gameState || !gameState.diamondGenerator) return;
  const now = Date.now();
  const cooldownEnd = gameState.diamondGenerator.timeAdCooldownEndTime || 0;

  if (cooldownEnd > now) {
    const rem = Math.ceil((cooldownEnd - now) / 1000);
    const m = Math.floor(rem / 60);
    const s = rem % 60;
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`⏳ Cooldown active! Next ad available in ${m}m ${s}s`);
    }
    return;
  }

  const isFirstAd = !gameState.diamondGenerator.timeAdFirstDiscountUsed;
  const discountAmount = isFirstAd ? 10 : 1;

  if (typeof showRewardedAd === 'function') {
    showRewardedAd(() => {
      if (isFirstAd) {
        gameState.diamondGenerator.timeAdFirstDiscountUsed = true;
      } else {
        gameState.diamondGenerator.timeSubsequentAdDiscountsCount = (gameState.diamondGenerator.timeSubsequentAdDiscountsCount || 0) + 1;
      }
      gameState.diamondGenerator.timeCostDiscount = (gameState.diamondGenerator.timeCostDiscount || 0) + discountAmount;
      // Start 10 minute cooldown (10 * 60 * 1000 ms)
      gameState.diamondGenerator.timeAdCooldownEndTime = Date.now() + 10 * 60 * 1000;

      if (typeof showFloatingToast === 'function') {
        showFloatingToast(`🎬 Ad watched! Speed upgrade cost reduced by ${discountAmount} Diamond${discountAmount > 1 ? 's' : ''}! 10m cooldown started.`);
      }

      updateHomeUI();
      if (typeof updateUI === 'function') updateUI();
      saveGame(true);
    }, {
      adTitle: 'Speed Upgrade Discount',
      adDesc: `Watch ad to reduce speed diamond cost by ${discountAmount} 💎!`
    });
  } else {
    if (isFirstAd) {
      gameState.diamondGenerator.timeAdFirstDiscountUsed = true;
    } else {
      gameState.diamondGenerator.timeSubsequentAdDiscountsCount = (gameState.diamondGenerator.timeSubsequentAdDiscountsCount || 0) + 1;
    }
    gameState.diamondGenerator.timeCostDiscount = (gameState.diamondGenerator.timeCostDiscount || 0) + discountAmount;
    gameState.diamondGenerator.timeAdCooldownEndTime = Date.now() + 10 * 60 * 1000;
    updateHomeUI();
    if (typeof updateUI === 'function') updateUI();
    saveGame(true);
  }
}
window.applySpeedAdDiscount = applySpeedAdDiscount;

// Initialize Engines automatically on load
initComboDecayEngine();
initDiamondGeneratorEngine();

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
  if (gameState.player.coins !== undefined) gameState.player.coins = gameState.player.diamonds;
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

// ==========================================================================
// 5-HOUR ENERGY AD BOOSTER ENGINE (BACKGROUND COOLDOWN)
// User requirement:
// "home page in have show pop up than in energy popup in edit a one time ads
//  throw energy if win than after 5 hours timer start in background not show in
//  user panel but count this timer in backend than after a timer finish than
//  show a popup in home page otherwise remove a popup."
// ==========================================================================
const ENERGY_AD_COOLDOWN_MS = 5 * 60 * 60 * 1000; // 5 Hours (18,000,000 ms)
let wasEnergyAdOnCooldown = false;
let energyPopupShownForCycle = false;

function isEnergyAdCooldownActive() {
  return !!(gameState && gameState.reactor && gameState.reactor.energyAdCooldownEndTime && Date.now() < gameState.reactor.energyAdCooldownEndTime);
}

function getEnergyAdCooldownRemainingSeconds() {
  if (!isEnergyAdCooldownActive()) return 0;
  return Math.max(0, Math.ceil((gameState.reactor.energyAdCooldownEndTime - Date.now()) / 1000));
}

// "otherwise remove a popup" -> Hide booster button from home page while on cooldown
function updateHomeEnergyBoosterVisibility() {
  const btn = document.getElementById('btnBoosterEnergy');
  if (!btn) return;
  if (isEnergyAdCooldownActive()) {
    btn.style.display = 'none';
  } else {
    btn.style.display = 'flex';
  }
}

// Background tick to monitor the 5-hour cooldown without rendering a countdown in user panel
function checkEnergyAdCooldownBackground() {
  const isCool = isEnergyAdCooldownActive();
  updateHomeEnergyBoosterVisibility();

  if (isCool) {
    wasEnergyAdOnCooldown = true;
    energyPopupShownForCycle = false;
  } else {
    // If it was on cooldown and now finished:
    if (wasEnergyAdOnCooldown) {
      wasEnergyAdOnCooldown = false;
      energyPopupShownForCycle = false;
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('HOME_ENERGY_POPUP_LOAD_SHOWN');
      }
      // Note: Automatic popups removed per user request ("side in many popup are remove..")
    }
  }
}

// Background 1-second interval ticker for cooldown tracking
if (typeof window !== 'undefined') {
  setInterval(checkEnergyAdCooldownBackground, 1000);
}

// Automatic Fixed Popup on Initial Game Load - Suppressed per user request
function checkAndShowHomeFixedPopupOnLoad() {
  // Suppressed automatic popup on load ("side in many popup are remove..")
}

// Run check on initial load
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    updateHome2xIconVisibility();
    updateHomeEnergyBoosterVisibility();
    checkAndShowHomeFixedPopupOnLoad();
  });
}

function openHomeActionPopup(type) {
  const backdrop = document.getElementById('homePopupBackdrop');
  const header = document.getElementById('homePopupHeader');
  const body = document.getElementById('homePopupBody');
  if (!backdrop || !header || !body) return;

  currentHomePopupType = type;

  if (type === 'booster_energy' || type === 'coin') {
    if (isEnergyAdCooldownActive()) {
      if (typeof showFloatingToast === 'function') {
        showFloatingToast('⚡ Energy booster is recharging! Available every 5 hours.');
      }
      return;
    }
    renderBoosterEnergyPopup(header, body);
  } else if (type === 'booster_profit') {
    renderBoosterProfitPopup(header, body);
  } else if (type === 'booster_bank') {
    renderBoosterBankPopup(header, body);
  } else if (type === 'booster_fast_xp') {
    renderBoosterFastXpPopup(header, body);
  } else if (type === 'ads_2x') {
    renderBoosterProfitPopup(header, body);
  } else if (type === 'auto_click') {
    renderHomeAutoClickPopup(header, body);
  } else if (type === 'profile') {
    renderHomeProfilePopup(header, body);
  } else if (type === 'blue') {
    renderBoosterBankPopup(header, body);
  } else if (type === 'bonus') {
    renderBoosterFastXpPopup(header, body);
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
      if (type === 'booster_energy' || type === 'coin') {
        if (isEnergyAdCooldownActive()) {
          closeHomeActionPopup();
        } else {
          renderBoosterEnergyPopup(header, body);
        }
      } else if (type === 'booster_profit') renderBoosterProfitPopup(header, body);
      else if (type === 'booster_bank') renderBoosterBankPopup(header, body);
      else if (type === 'booster_fast_xp') renderBoosterFastXpPopup(header, body);
      else if (type === 'ads_2x') renderBoosterProfitPopup(header, body);
    }
  }
}


// ==========================================================================
// 4 NEW BOOSTER POPUPS & ACTIONS (TASKS #3)
// 1. 10 Energy (1-Time Ad every 5 hours)
// 2. 3 Hours *2 Profit (1 Ad or 150 Coins)
// 3. Big Bank Blue Coin Deposit/Withdraw (1 Ad = 100 Coins, 100 Diamonds = Full + 24h Pass)
// 4. Fast XP Surge (100 Diamonds or 5 Ads)
// ==========================================================================

// 1. 10 Energy Booster Popup View (1-Time Ad every 5 hours)
function renderBoosterEnergyPopup(header, body) {
  header.innerHTML = `
    <div class="home-popup-festive-pill">⚡ SACRED ENERGY BOOST</div>
    <div class="home-popup-icon-wrap" style="background: radial-gradient(circle, rgba(56, 189, 248, 0.3) 0%, rgba(2, 132, 199, 0.1) 100%); border: 2px solid #38bdf8; color: #38bdf8; font-size: 28px;">⚡</div>
    <h3 class="home-popup-title">10 ENERGY BOOSTER</h3>
    <p class="home-popup-subtitle">Watch 1 quick ad to instantly recharge +10 Energy units for your reactor! Available once every 5 hours.</p>
  `;
  body.innerHTML = `
    <div class="popup-stat-banner">
      <span class="popup-stat-label">Energy Reward</span>
      <span class="popup-stat-value" style="color: #38bdf8; font-weight: 800;">+10 ENERGY UNITS</span>
    </div>
    <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 8px;">
      <button class="popup-action-btn" style="background: linear-gradient(135deg, #0284c7, #0369a1); border: 1.5px solid #38bdf8; color: #ffffff; padding: 13px; font-weight: 800; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 8px;" onclick="buyEnergyBoosterWithAd()">
        <span style="font-size: 18px;">🎬</span> WATCH 1 AD FOR +10 ENERGY
      </button>
    </div>
  `;
}

window.buyEnergyBoosterWithAd = function() {
  if (isEnergyAdCooldownActive()) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('⚡ Energy booster is recharging! Available every 5 hours.');
    }
    closeHomeActionPopup();
    return;
  }

  const doReward = () => {
    gameState.reactor.currentEnergy = (gameState.reactor.currentEnergy || 0) + 10;
    
    // Start 5 hours timer in background (not shown in user panel, but counted in backend)
    const now = Date.now();
    if (!gameState.reactor) gameState.reactor = {};
    gameState.reactor.energyAdCooldownEndTime = now + ENERGY_AD_COOLDOWN_MS;
    wasEnergyAdOnCooldown = true;
    energyPopupShownForCycle = false;
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('HOME_ENERGY_POPUP_LOAD_SHOWN');
    }

    if (typeof sfx !== 'undefined' && sfx.playEnergyRechargeSound) {
      sfx.playEnergyRechargeSound();
    } else if (typeof sfx !== 'undefined' && sfx.playTapSound) {
      sfx.playTapSound(2);
    }

    if (typeof showFloatingToast === 'function') {
      showFloatingToast('⚡ +10 Energy Claimed via Ad! Next available in 5 hours.');
    }

    closeHomeActionPopup();
    updateHomeEnergyBoosterVisibility();
    if (typeof updateUI === 'function') updateUI();
    if (typeof saveGame === 'function') saveGame();
    if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
      window.firebaseSync.saveToCloudImmediate();
    }
  };

  if (typeof showRewardedAd === 'function') {
    showRewardedAd(doReward);
  } else if (typeof startAdSimulation === 'function') {
    startAdSimulation('energy', '10 Energy Booster', 'Watch 1 Ad for +10 Energy', doReward);
  } else {
    doReward();
  }
};

window.buyEnergyBoosterWithCoins = function() {
  if (typeof showFloatingToast === 'function') {
    showFloatingToast('⚡ Energy booster is available exclusively via 1 Ad once every 5 hours!');
  }
};

window.isEnergyAdCooldownActive = isEnergyAdCooldownActive;
window.getEnergyAdCooldownRemainingSeconds = getEnergyAdCooldownRemainingSeconds;
window.updateHomeEnergyBoosterVisibility = updateHomeEnergyBoosterVisibility;
window.checkEnergyAdCooldownBackground = checkEnergyAdCooldownBackground;

// 2. 3 Hours *2 Profit Booster Popup View
function renderBoosterProfitPopup(header, body) {
  const now = Date.now();
  const isAct = !!(gameState.reactor && gameState.reactor.profit2xEndTime && now < gameState.reactor.profit2xEndTime);
  const remSecs = isAct ? Math.ceil((gameState.reactor.profit2xEndTime - now) / 1000) : 0;
  const h = Math.floor(remSecs / 3600);
  const m = Math.floor((remSecs % 3600) / 60);
  const s = remSecs % 60;
  const timeStr = `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;

  header.innerHTML = `
    <div class="home-popup-festive-pill">🔥 SUPER PROFIT BOOST</div>
    <div class="home-popup-icon-wrap" style="background: radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, rgba(180, 83, 9, 0.1) 100%); border: 2px solid #f59e0b; color: #fbbf24; font-size: 28px;">🔥</div>
    <h3 class="home-popup-title">3 HOURS *2 PROFIT</h3>
    <p class="home-popup-subtitle">Supercharge your sacred taps! Doubles all energy output, tap combo gains, and profits for 3 full hours!</p>
  `;

  let statusHtml = '';
  if (isAct) {
    statusHtml = `
      <div style="background: rgba(245, 158, 11, 0.18); border: 1.5px solid #f59e0b; border-radius: 12px; padding: 12px; text-align: center; margin-bottom: 8px;">
        <div style="font-size: 11px; font-weight: 800; color: #fbbf24;">🔥 *2 PROFIT ACTIVE!</div>
        <div style="font-size: 24px; font-weight: 900; color: #ffffff; font-family: monospace;">${timeStr}</div>
        <div style="font-size: 10px; color: #fde68a;">Time Remaining</div>
      </div>
    `;
  }

  body.innerHTML = `
    ${statusHtml}
    <div class="popup-stat-banner">
      <span class="popup-stat-label">Profit Multiplier</span>
      <span class="popup-stat-value" style="color: #f59e0b; font-weight: 800;">*2.0X SACRED PROFIT (3 HOURS)</span>
    </div>
    <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 8px;">
      <button class="popup-action-btn" style="background: linear-gradient(135deg, #0284c7, #0369a1); border: 1.5px solid #38bdf8; color: #ffffff; padding: 13px; font-weight: 800; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 8px;" onclick="buyProfitBoosterWithAd()">
        <span style="font-size: 18px;">🎬</span> WATCH 1 AD FOR 3H *2 PROFIT
      </button>
      <button class="popup-action-btn btn-gold-glow" style="background: linear-gradient(135deg, #d97706, #b45309); border: 1.5px solid #fbbf24; color: #ffffff; padding: 13px; font-weight: 800; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 8px;" onclick="buyProfitBoosterWithCoins()">
        <span style="font-size: 18px;">🪙</span> BUY FOR 150 COINS (3H *2 PROFIT)
      </button>
    </div>
  `;
}

window.buyProfitBoosterWithAd = function() {
  const doReward = () => {
    gameState.reactor.profit2xEndTime = Date.now() + (3 * 3600 * 1000);
    sfx.playLevelUpSound();
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('🔥 3 Hours *2 Profit Boost Activated via Ad!');
    }
    closeHomeActionPopup();
    updateUI();
    saveGame();
    if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
      window.firebaseSync.saveToCloudImmediate();
    }
  };

  if (typeof showRewardedAd === 'function') {
    showRewardedAd(doReward);
  } else if (typeof startAdSimulation === 'function') {
    startAdSimulation('profit', '3H *2 Profit Boost', 'Watch 1 Ad for 3 Hours of 2X Profit', doReward);
  } else {
    doReward();
  }
};

window.buyProfitBoosterWithCoins = function() {
  if ((gameState.player.coins || 0) < 150) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('Need 150 Coins for 3H *2 Profit Boost!');
    }
    return;
  }
  gameState.player.coins -= 150;
  gameState.reactor.profit2xEndTime = Date.now() + (3 * 3600 * 1000);
  sfx.playLevelUpSound();
  if (typeof showFloatingToast === 'function') {
    showFloatingToast('🔥 3 Hours *2 Profit Boost Purchased! (-150 Coins)');
  }
  closeHomeActionPopup();
  updateUI();
  saveGame();
  if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
    window.firebaseSync.saveToCloudImmediate();
  }
};

// 3. Big Bank Blue Coin Deposit/Withdraw Popup View
function renderBoosterBankPopup(header, body) {
  const now = Date.now();
  const bankBalance = (gameState.bank && gameState.bank.coins) || 0;
  const isPassActive = !!(gameState.bank && gameState.bank.fullWithdrawalPassEndTime && now < gameState.bank.fullWithdrawalPassEndTime);
  const remSecs = isPassActive ? Math.ceil((gameState.bank.fullWithdrawalPassEndTime - now) / 1000) : 0;
  const h = Math.floor(remSecs / 3600);
  const m = Math.floor((remSecs % 3600) / 60);
  const s = remSecs % 60;
  const passStr = `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;

  header.innerHTML = `
    <div class="home-popup-festive-pill">🏦 VAULT BIG BANK</div>
    <div class="home-popup-icon-wrap" style="background: radial-gradient(circle, rgba(6, 182, 212, 0.3) 0%, rgba(8, 145, 178, 0.1) 100%); border: 2px solid #06b6d4; color: #38bdf8; font-size: 28px;">🏦</div>
    <h3 class="home-popup-title">BIG BANK VAULT</h3>
    <p class="home-popup-subtitle">Every tap deposits coins into this vault! Withdraw 100 with 1 Ad, or unlock full withdrawals + 24-hour pass with 100 Diamonds.</p>
  `;

  let passHtml = '';
  if (isPassActive) {
    passHtml = `
      <div style="background: rgba(16, 185, 129, 0.18); border: 1.5px solid #10b981; border-radius: 12px; padding: 10px; text-align: center; margin-bottom: 8px;">
        <div style="font-size: 11px; font-weight: 800; color: #10b981;">✅ 24H FULL WITHDRAWAL PASS ACTIVE</div>
        <div style="font-size: 20px; font-weight: 900; color: #ffffff; font-family: monospace;">${passStr}</div>
        <div style="font-size: 10px; color: #a7f3d0;">All tap coins go straight to your wallet!</div>
      </div>
    `;
  }

  body.innerHTML = `
    ${passHtml}
    <div class="popup-stat-banner" style="background: rgba(6, 182, 212, 0.12); border-color: rgba(6, 182, 212, 0.4);">
      <span class="popup-stat-label">Bank Vault Balance</span>
      <span class="popup-stat-value" style="color: #38bdf8; font-size: 20px; font-weight: 900;">${bankBalance} 🪙 Gold Coins</span>
    </div>
    <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 8px;">
      <button class="popup-action-btn" style="background: linear-gradient(135deg, #0284c7, #0369a1); border: 1.5px solid #38bdf8; color: #ffffff; padding: 13px; font-weight: 800; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 8px;" onclick="withdrawBankWithAd()">
        <span style="font-size: 18px;">🎬</span> WATCH 1 AD -> WITHDRAW 100 COINS
      </button>
      <button class="popup-action-btn" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); border: 1.5px solid #a78bfa; color: #ffffff; padding: 13px; font-weight: 800; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 0 16px rgba(139, 92, 246, 0.4);" onclick="withdrawFullBankWithDiamonds()">
        <span style="font-size: 18px;">💎</span> 100 DIAMONDS: FULL WITHDRAWAL + 24H PASS
      </button>
    </div>
  `;
}

window.withdrawBankWithAd = function() {
  const available = (gameState.bank && gameState.bank.coins) || 0;
  if (available <= 0) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('Big Bank is empty! Tap the reactor to store Gold Coins first.');
    }
    return;
  }

  const doReward = () => {
    const amt = Math.min(100, (gameState.bank && gameState.bank.coins) || 0);
    gameState.bank.coins = Math.max(0, (gameState.bank.coins || 0) - amt);
    gameState.player.coins = (gameState.player.coins || 0) + amt;
    sfx.playLevelUpSound();
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`🏦 Withdrew ${amt} Gold Coins from Big Bank!`);
    }
    closeHomeActionPopup();
    updateUI();
    saveGame();
    if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
      window.firebaseSync.saveToCloudImmediate();
    }
  };

  if (typeof showRewardedAd === 'function') {
    showRewardedAd(doReward);
  } else if (typeof startAdSimulation === 'function') {
    startAdSimulation('bank', 'Big Bank Withdrawal', 'Watch 1 Ad to withdraw 100 Gold Coins', doReward);
  } else {
    doReward();
  }
};

window.withdrawFullBankWithDiamonds = function() {
  if ((gameState.player.diamonds || 0) < 100) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('Need 100 Diamonds for Full Bank Withdrawal + 24H Pass!');
    }
    return;
  }

  gameState.player.diamonds -= 100;
  const available = (gameState.bank && gameState.bank.coins) || 0;
  gameState.player.coins = (gameState.player.coins || 0) + available;
  if (gameState.bank) gameState.bank.coins = 0;
  gameState.bank.fullWithdrawalPassEndTime = Date.now() + (24 * 3600 * 1000);

  sfx.playLevelUpSound();
  if (typeof showFloatingToast === 'function') {
    showFloatingToast(`🏦 Full Bank Withdrawn (${available} Gold Coins) & 24H Pass Activated!`);
  }
  closeHomeActionPopup();
  updateUI();
  saveGame();
  if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
    window.firebaseSync.saveToCloudImmediate();
  }
};

// 4. Fast XP Surge (+1 XP/tap for 10 min) Popup View
function renderBoosterFastXpPopup(header, body) {
  const now = Date.now();
  const isAct = !!(gameState.reactor && gameState.reactor.fastXpEndTime && now < gameState.reactor.fastXpEndTime);
  const remSecs = isAct ? Math.ceil((gameState.reactor.fastXpEndTime - now) / 1000) : 0;
  const m = Math.floor(remSecs / 60);
  const s = remSecs % 60;
  const timeStr = `${m}m ${String(s).padStart(2, '0')}s`;
  const adsWatched = (gameState.reactor && gameState.reactor.fastXpAdsWatched) || 0;

  header.innerHTML = `
    <div class="home-popup-festive-pill">⭐ FAST XP ACCELERATOR</div>
    <div class="home-popup-icon-wrap" style="background: radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, rgba(126, 34, 206, 0.1) 100%); border: 2px solid #a855f7; color: #c084fc; font-size: 28px;">⭐</div>
    <h3 class="home-popup-title">FAST XP SURGE (+1 XP/TAP)</h3>
    <p class="home-popup-subtitle">Supercharge your level progression! Every single tap awards +1 FULL XP point for 10 minutes working duration.</p>
  `;

  let statusHtml = '';
  if (isAct) {
    statusHtml = `
      <div style="background: rgba(168, 85, 247, 0.18); border: 1.5px solid #a855f7; border-radius: 12px; padding: 12px; text-align: center; margin-bottom: 8px;">
        <div style="font-size: 11px; font-weight: 800; color: #c084fc;">⭐ FAST XP ACTIVE (+1 XP PER TAP)</div>
        <div style="font-size: 24px; font-weight: 900; color: #ffffff; font-family: monospace;">${timeStr}</div>
        <div style="font-size: 10px; color: #e9d5ff;">Time Remaining</div>
      </div>
    `;
  }

  body.innerHTML = `
    ${statusHtml}
    <div class="popup-stat-banner">
      <span class="popup-stat-label">Fast XP Rate</span>
      <span class="popup-stat-value" style="color: #c084fc; font-weight: 800;">+1 XP PER TAP (10 MINS)</span>
    </div>
    <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 8px;">
      <button class="popup-action-btn" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); border: 1.5px solid #a78bfa; color: #ffffff; padding: 13px; font-weight: 800; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 8px;" onclick="activateFastXpWithDiamonds()">
        <span style="font-size: 18px;">💎</span> 100 DIAMONDS -> 10 MIN FAST XP
      </button>
      <button class="popup-action-btn" style="background: linear-gradient(135deg, #0284c7, #0369a1); border: 1.5px solid #38bdf8; color: #ffffff; padding: 13px; font-weight: 800; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 8px;" onclick="watchFastXpAd()">
        <span style="font-size: 18px;">🎬</span> WATCH 5 ADS (${adsWatched}/5 WATCHED)
      </button>
    </div>
  `;
}

window.activateFastXpWithDiamonds = function() {
  if ((gameState.player.diamonds || 0) < 100) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('Need 100 Diamonds to activate 10 Min Fast XP!');
    }
    return;
  }
  gameState.player.diamonds -= 100;
  gameState.reactor.fastXpEndTime = Date.now() + (10 * 60 * 1000);
  sfx.playLevelUpSound();
  if (typeof showFloatingToast === 'function') {
    showFloatingToast('⭐ Fast XP Surge Activated! +1 XP per tap for 10 minutes!');
  }
  closeHomeActionPopup();
  updateUI();
  saveGame();
  if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
    window.firebaseSync.saveToCloudImmediate();
  }
};

window.watchFastXpAd = function() {
  const doReward = () => {
    gameState.reactor.fastXpAdsWatched = ((gameState.reactor.fastXpAdsWatched || 0) + 1);
    if (gameState.reactor.fastXpAdsWatched >= 5) {
      gameState.reactor.fastXpAdsWatched = 0;
      gameState.reactor.fastXpEndTime = Date.now() + (10 * 60 * 1000);
      sfx.playLevelUpSound();
      if (typeof showFloatingToast === 'function') {
        showFloatingToast('⭐ 5 Ads Watched! Fast XP Surge Activated for 10 minutes!');
      }
      closeHomeActionPopup();
    } else {
      if (typeof showFloatingToast === 'function') {
        showFloatingToast(`🎬 Ad Watched (${gameState.reactor.fastXpAdsWatched}/5)! Watch ${5 - gameState.reactor.fastXpAdsWatched} more for Fast XP.`);
      }
      refreshHomePopupIfOpen('booster_fast_xp');
    }
    updateUI();
    saveGame();
    if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
      window.firebaseSync.saveToCloudImmediate();
    }
  };

  if (typeof showRewardedAd === 'function') {
    showRewardedAd(doReward);
  } else if (typeof startAdSimulation === 'function') {
    startAdSimulation('fast_xp', 'Fast XP Ad Watcher', `Watch ad (${(gameState.reactor.fastXpAdsWatched || 0) + 1}/5) for 10 Min Fast XP Surge`, doReward);
  } else {
    doReward();
  }
};


function renderHome2xPopup(header, body) {
  const isActive = isHome2xBoostActive();
  const isCooldown = isHome2xCooldownActive();
  const rem = getHome2xRemainingSeconds();
  const mins = Math.floor(rem / 60);
  const secs = rem % 60;

  header.innerHTML = `
    <div class="home-popup-icon-wrap" style="background: radial-gradient(circle, rgba(0, 240, 255, 0.25) 0%, rgba(14, 165, 233, 0.1) 100%); border: 2px solid #00f0ff; color: #38bdf8; font-size: 26px; box-shadow: 0 0 25px rgba(0, 240, 255, 0.4);">⚡</div>
    <h3 class="home-popup-title" style="letter-spacing: 0.5px;">QUANTUM 2X MULTIPLIER</h3>
    <p class="home-popup-subtitle">Supercharge your reactor output! Doubles all energy output, tap combo gains, and XP for a full 30-minute duration.</p>
  `;

  let timerBanner = '';
  if (isActive) {
    timerBanner = `
      <div style="background: linear-gradient(135deg, rgba(0, 240, 255, 0.15) 0%, rgba(14, 165, 233, 0.25) 100%); border: 1.5px solid #00f0ff; border-radius: 14px; padding: 14px; text-align: center; margin-bottom: 4px; box-shadow: 0 0 20px rgba(0, 240, 255, 0.25);">
        <div style="font-size: 11px; font-weight: 800; color: #38bdf8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">⚡ 2X TURBO BURST ACTIVE (30 MIN TIMER)</div>
        <div id="garbaActiveTimerDigits" style="font-family: 'JetBrains Mono', monospace; font-size: 32px; font-weight: 900; color: #ffffff; text-shadow: 0 0 14px rgba(0, 240, 255, 0.9);">
          ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}
        </div>
        <div style="font-size: 11px; color: #a5f3fc; margin-top: 2px;">Active Multiplier Remaining</div>
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
      <span class="popup-stat-value" style="color: #00f0ff; font-weight: 800;">*2.0X QUANTUM TAP POWER</span>
    </div>

    <!-- Buy with 10 Diamonds or Turbo Burst -->
    <button class="popup-action-btn btn-cyan-glow" onclick="buyGarba2xWithDiamonds()" ${isLocked ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''} style="display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 800; padding: 13px; border-radius: 12px; background: linear-gradient(135deg, #0284c7, #0369a1); color: #ffffff; border: 1.5px solid #38bdf8; box-shadow: 0 4px 15px rgba(56, 189, 248, 0.35);">
      <span style="font-size: 18px;">💎</span>
      <span>${isLocked ? '⚡ Turbo Burst Currently Running' : 'Activate 2X (10 Diamonds)'}</span>
    </button>

    <!-- Ad Bonus -->
    <button class="popup-action-btn btn-emerald-glow" onclick="buyGarba2xWithAds()" ${isLocked ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''} style="display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 800; padding: 13px; border-radius: 12px; background: linear-gradient(135deg, #059669, #047857); color: #ffffff; border: 1.5px solid #34d399; box-shadow: 0 4px 15px rgba(52, 211, 153, 0.35);">
      <span style="font-size: 18px;">🎬</span>
      <span>${isLocked ? '⚡ 2X Active' : 'Watch Ad for 30 Min 2X Boost'}</span>
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
    <div class="home-popup-icon-wrap" style="background: rgba(16, 185, 129, 0.2); border: 2px solid #10b981; color: #34d399;">🤖</div>
    <h3 class="home-popup-title">QUANTUM AUTO-BOT</h3>
    <p class="home-popup-subtitle">Deploy AI robotic automation to tap the reactor orb continuously at high precision frequency!</p>
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
      <span>${isRunning ? '⏹️' : '▶️'}</span> ${isRunning ? 'Stop Auto-Bot' : 'Start Auto-Bot'}
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
  const blueCoins = gameState.player.diamonds || gameState.player.coins || 0;

  header.innerHTML = `
    <div class="home-popup-icon-wrap" style="background: rgba(168, 85, 247, 0.2); border: 2px solid #a855f7; color: #c084fc;">⚡</div>
    <h3 class="home-popup-title">COMMANDER PROFILE</h3>
    <p class="home-popup-subtitle">Commander: ${gameState.player.handle || 'player'} • Status: Online</p>
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
        <span class="popup-stat-label">Diamonds</span>
        <span class="popup-stat-value" style="color: #38bdf8; font-size: 16px;">💎 ${formatNumber(gameState.player.diamonds || 0)}</span>
      </div>
    </div>

    <div class="popup-stat-banner">
      <span class="popup-stat-label">XP Progress</span>
      <span class="popup-stat-value" style="color: #f97316;">${xpCur} / ${xpTar} XP</span>
    </div>

    <div class="popup-feature-card" style="background: linear-gradient(135deg, rgba(88, 28, 135, 0.5) 0%, rgba(15, 23, 42, 0.9) 100%); border-color: rgba(192, 132, 252, 0.4);">
      <div class="popup-feature-left">
        <span class="popup-feature-icon">💎</span>
        <div class="popup-feature-info">
          <span class="popup-feature-title">Commander Supply Drop</span>
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
  if (gameState.player.coins !== undefined) gameState.player.coins = gameState.player.diamonds;
  if (typeof saveGame === 'function') saveGame();
  updateHomeUI();
  if (typeof showFloatingToast === 'function') {
    showFloatingToast('💎 Supply Drop Claimed: +2,000 Coins & +10 Blue Gems!');
  }
  if (typeof sfx !== 'undefined' && sfx.playCardRewardSound) sfx.playCardRewardSound();
  refreshHomePopupIfOpen('profile');
}

// 4. Golden Coin Reward Vault Popup
function renderHomeCoinPopup(header, body) {
  const goldCoins = gameState.player.coins || 0;

  header.innerHTML = `
    <div class="home-popup-icon-wrap" style="background: rgba(251, 191, 36, 0.2); border: 2px solid #fbbf24; color: #fde047;">🪙</div>
    <h3 class="home-popup-title">GOLD COIN VAULT</h3>
    <p class="home-popup-subtitle">Manage your gold reserves to upgrade generators, reactors, and purchase game boosters.</p>
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
          <span class="popup-feature-title">Daily Coin Supply</span>
          <span class="popup-feature-sub">+2,500 Gold Coins</span>
        </div>
      </div>
      <button class="popup-mini-btn btn-gold-glow" onclick="claimHomeCoinBonus(2500, 'Daily Supply')">Claim</button>
    </div>

    <div class="popup-feature-card">
      <div class="popup-feature-left">
        <span class="popup-feature-icon">⚡</span>
        <div class="popup-feature-info">
          <span class="popup-feature-title">Energy Converter</span>
          <span class="popup-feature-sub">50 Energy ➔ 1,000 Coins</span>
        </div>
      </div>
      <button class="popup-mini-btn btn-cyan-glow" onclick="convertHomeEnergyToCoins()">Convert</button>
    </div>

    <div class="popup-feature-card">
      <div class="popup-feature-left">
        <span class="popup-feature-icon">👑</span>
        <div class="popup-feature-info">
          <span class="popup-feature-title">Quantum Bounty</span>
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
  const blueCoins = gameState.player.coins || 0;

  header.innerHTML = `
    <div class="home-popup-icon-wrap" style="background: rgba(6, 182, 212, 0.2); border: 2px solid #06b6d4; color: #38bdf8;">💙</div>
    <h3 class="home-popup-title">BLUE GEM VAULT</h3>
    <p class="home-popup-subtitle">Quantum blue crystals used for high-tier upgrades, multipliers, and exclusive shop items.</p>
  `;

  body.innerHTML = `
    <div class="popup-stat-banner">
      <span class="popup-stat-label">Blue Coin Balance</span>
      <span class="popup-stat-value" style="color: #38bdf8; font-size: 17px;">💙 ${formatNumber(blueCoins)} BLUE</span>
    </div>

    <div class="popup-feature-card">
      <div class="popup-feature-left">
        <span class="popup-feature-icon">🎁</span>
        <div class="popup-feature-info">
          <span class="popup-feature-title">Free Quantum Drop</span>
          <span class="popup-feature-sub">+15 Gold Coins</span>
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
        <span class="popup-feature-icon">💎</span>
        <div class="popup-feature-info">
          <span class="popup-feature-title">Quantum Crystal Gift</span>
          <span class="popup-feature-sub">+50 Gold Coins</span>
        </div>
      </div>
      <button class="popup-mini-btn btn-cyan-glow" onclick="claimHomeBlueCoinBonus(50, 'Amrit Gem Gift')">Claim</button>
    </div>
  `;
}

function claimHomeBlueCoinBonus(amount, sourceName) {
  gameState.player.coins = (gameState.player.coins || 0) + amount;
  if (typeof saveGame === 'function') saveGame();
  updateHomeUI();
  if (typeof showFloatingToast === 'function') {
    showFloatingToast(`💙 +${amount} Gold Coins Claimed!`);
  }
  if (typeof sfx !== 'undefined' && sfx.playCoinSound) sfx.playCoinSound();
  refreshHomePopupIfOpen('blue');
}

function exchangeGoldToBlueCoins() {
  const currentGold = gameState.player.coins || 0;
  if (currentGold < 5000) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('⚠️ Need at least 5,000 Gold Coins to synthesize Gold Coins!');
    }
    return;
  }
  gameState.player.coins -= 5000;
  gameState.player.coins = (gameState.player.coins || 0) + 25;
  if (typeof saveGame === 'function') saveGame();
  updateHomeUI();
  if (typeof showFloatingToast === 'function') {
    showFloatingToast('🔄 Synthesized 5,000 Gold Coins into 25 Gold Coins!');
  }
  if (typeof sfx !== 'undefined' && sfx.playLevelUpSound) sfx.playLevelUpSound();
  refreshHomePopupIfOpen('blue');
}

// 6. Grand Mystery Reward Capsule Popup
function renderHomeBonusPopup(header, body) {
  header.innerHTML = `
    <div class="home-popup-icon-wrap" style="background: rgba(244, 63, 94, 0.2); border: 2px solid #f43f5e; color: #fb7185;">🎁</div>
    <h3 class="home-popup-title">QUANTUM REWARD CAPSULE</h3>
    <p class="home-popup-subtitle">Unlock the quantum reward capsule for instant Gold Coins, Blue Gems, Spin Tickets, and Mystery Keys!</p>
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
        <span class="popup-stat-value" style="color: #38bdf8;">💙 +10 - 25</span>
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
      <span>🎁</span> OPEN & CLAIM REWARD CAPSULE
    </button>
  `;
}

function openHomeMysteryCapsule() {
  const goldBonus = Math.floor(Math.random() * 2500) + 3500;
  const blueBonus = Math.floor(Math.random() * 15) + 10;
  gameState.player.coins = (gameState.player.coins || 0) + goldBonus;
  gameState.player.coins = (gameState.player.coins || 0) + blueBonus;
  if (gameState.player.chestKeys !== undefined) gameState.player.chestKeys = (gameState.player.chestKeys || 0) + 1;
  if (gameState.player.spinTickets !== undefined) gameState.player.spinTickets = (gameState.player.spinTickets || 0) + 1;
  if (gameState.player.scratchCards !== undefined) gameState.player.scratchCards = (gameState.player.scratchCards || 0) + 1;

  if (typeof saveGame === 'function') saveGame();
  updateHomeUI();

  if (typeof showFloatingToast === 'function') {
    showFloatingToast(`🎉 Capsule Reward: +${formatNumber(goldBonus)} Gold, +${blueBonus} 💙 Gold Coins, 🎫 1 Ticket, 🔑 1 Key!`);
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

// ==========================================================================
// REAL-TIME HOME ANNOUNCEMENT BANNER (ADMIN SYNCED VIA /game_config)
// ==========================================================================
function renderHomeAnnouncement() {
  const cfg = window.cloudGameConfig || {};
  let banner = document.getElementById('homeLiveAnnouncementBanner');

  if (!cfg.announcementActive || !cfg.announcementText || !cfg.announcementText.trim()) {
    if (banner) banner.style.display = 'none';
    return;
  }

  const pageHome = document.getElementById('pageHome');
  if (!pageHome) return;

  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'homeLiveAnnouncementBanner';
    banner.style.cssText = 'background: linear-gradient(135deg, rgba(14, 165, 233, 0.18), rgba(99, 102, 241, 0.22)); border: 1.5px solid rgba(56, 189, 248, 0.45); border-radius: 12px; padding: 10px 14px; margin: 8px 14px 12px; display: flex; align-items: center; justify-content: space-between; gap: 10px; box-shadow: 0 4px 16px rgba(14, 165, 233, 0.15); animation: fadeIn 0.3s ease; position: relative; z-index: 20;';
    pageHome.insertBefore(banner, pageHome.firstChild);
  }

  banner.style.display = 'flex';
  banner.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0;">
      <span style="font-size: 18px; flex-shrink: 0;">📢</span>
      <div style="color: #e2e8f0; font-size: 12px; font-weight: 600; line-height: 1.4; word-break: break-word;">
        ${cfg.announcementText.trim()}
      </div>
    </div>
    <button type="button" onclick="dismissHomeAnnouncement()" style="background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer; padding: 0 4px; line-height: 1;" title="Dismiss">&times;</button>
  `;
}

function dismissHomeAnnouncement() {
  const banner = document.getElementById('homeLiveAnnouncementBanner');
  if (banner) banner.style.display = 'none';
}

window.renderHomeAnnouncement = renderHomeAnnouncement;
window.dismissHomeAnnouncement = dismissHomeAnnouncement;

window.addEventListener('gameConfigUpdated', () => {
  renderHomeAnnouncement();
});

window.addEventListener('levelsConfigUpdated', () => {
  updateHomeUI();
});

document.addEventListener('DOMContentLoaded', () => {
  renderHomeAnnouncement();
  if (typeof initDiamondGeneratorEngine === 'function') {
    initDiamondGeneratorEngine();
  }
  if (typeof updateMultiTapOptions === 'function') {
    updateMultiTapOptions();
  }
});

function switchHomeLeaderboardTab(tab) {
  if (typeof switchLeaderboardCategory === 'function') {
    switchLeaderboardCategory(tab);
  }
  if (typeof switchPage === 'function') {
    switchPage('leaderboard');
  }
}
window.switchHomeLeaderboardTab = switchHomeLeaderboardTab;


