/* ==========================================================================
   ENERGY TAP REACTOR - ENERGY GENERATOR (energy.js)
   - Center Circle Energy Generator Engine with live timer & EP accumulation
   - Live generation rate (+0.01 / min increase)
   - 4 Standard Fuel Cells:
     * Green: +5m Timer
     * Yellow: +15m Timer
     * Orange: +30m Timer
     * Red: +60m Timer & +0.01 Rate/Min
   - 2 Special Boost Fuels:
     * Pink Fuel: *2 Boost Timer (2x fast generator work) for 10 min
       - Active countdown in pink tab
       - 1 Hour Cooldown after use
       - Watch Ad to reduce cooldown by 30 min
       - Watch 3 Ads to win 1 Pink Fuel cell
     * Purple Fuel: *5 Boost Timer (5x fast generator work) for 10 min
       - Active countdown in purple tab
       - 5 Hours Cooldown after use
       - Watch Ad to reduce cooldown by 30 min
       - Watch 5 Ads to win 1 Purple Fuel cell
   - Ad simulation fallback and cooldown bypass
   ========================================================================== */

function startEnergyEngine() {
  if (gameState.energyGenerator.timerInterval) {
    clearInterval(gameState.energyGenerator.timerInterval);
  }

  gameState.energyGenerator.timerInterval = setInterval(() => {
    // 1. Tick Boost Timers
    ensureBoostsState();
    const boosts = gameState.energyGenerator.boosts;

    if (boosts.pink.activeRemainingSeconds > 0) {
      boosts.pink.activeRemainingSeconds--;
    }
    if (boosts.pink.cooldownRemainingSeconds > 0) {
      boosts.pink.cooldownRemainingSeconds--;
    }

    if (boosts.purple.activeRemainingSeconds > 0) {
      boosts.purple.activeRemainingSeconds--;
    }
    if (boosts.purple.cooldownRemainingSeconds > 0) {
      boosts.purple.cooldownRemainingSeconds--;
    }

    // 2. Speed Multiplier (Timer works 2x / 5x fast)
    let speedMultiplier = 1;
    if (boosts.pink.activeRemainingSeconds > 0) speedMultiplier *= 2;
    if (boosts.purple.activeRemainingSeconds > 0) speedMultiplier *= 5;

    // 3. Generator Progress
    if (gameState.energyGenerator.remainingSeconds > 0) {
      gameState.energyGenerator.isActive = true;

      // Timer works faster based on active boost multiplier
      const secondsToAdvance = Math.min(gameState.energyGenerator.remainingSeconds, speedMultiplier);
      gameState.energyGenerator.remainingSeconds -= secondsToAdvance;

      const rate = (gameState.energyGenerator.ratePerSec !== undefined)
        ? gameState.energyGenerator.ratePerSec
        : (gameState.energyGenerator.ratePerMin || 0.01);
      const epGain = rate * secondsToAdvance;

      // Energy generated is credited directly into reactor energy balance & EP total
      gameState.reactor.currentEnergy = (gameState.reactor.currentEnergy || 0) + epGain;
      gameState.energyGenerator.epTotal = (gameState.energyGenerator.epTotal || 0) + epGain;

      formatTimerDisplay();
    } else {
      gameState.energyGenerator.isActive = false;
      formatTimerDisplay();
    }

    updateEnergyUI();
    if (typeof updateHomeUI === 'function') updateHomeUI();
  }, 1000);
}

function ensureBoostsState() {
  if (!gameState.energyGenerator.boosts) {
    gameState.energyGenerator.boosts = {
      pink: { activeRemainingSeconds: 0, cooldownRemainingSeconds: 0, adsWatched: 0, multiplier: 2 },
      purple: { activeRemainingSeconds: 0, cooldownRemainingSeconds: 0, adsWatched: 0, multiplier: 5 }
    };
  }
  if (!gameState.energyGenerator.boosts.pink) {
    gameState.energyGenerator.boosts.pink = { activeRemainingSeconds: 0, cooldownRemainingSeconds: 0, adsWatched: 0, multiplier: 2 };
  }
  if (!gameState.energyGenerator.boosts.purple) {
    gameState.energyGenerator.boosts.purple = { activeRemainingSeconds: 0, cooldownRemainingSeconds: 0, adsWatched: 0, multiplier: 5 };
  }
  if (!gameState.energyGenerator.fuelCells) {
    gameState.energyGenerator.fuelCells = { green: 0, yellow: 0, orange: 0, red: 0, pink: 0, purple: 0 };
  }
  if (gameState.energyGenerator.fuelCells.pink === undefined) gameState.energyGenerator.fuelCells.pink = 0;
  if (gameState.energyGenerator.fuelCells.purple === undefined) gameState.energyGenerator.fuelCells.purple = 0;
}

// Master Fuel Action Handler for Green, Yellow, Orange, Red
function handleFuelAction(fuelType) {
  const currentCount = (gameState.energyGenerator.fuelCells && gameState.energyGenerator.fuelCells[fuelType]) || 0;

  if (currentCount > 0) {
    gameState.energyGenerator.fuelCells[fuelType]--;
    gameState.energyGenerator.consumed[fuelType] = (gameState.energyGenerator.consumed[fuelType] || 0) + 1;

    if (fuelType === 'green') {
      gameState.energyGenerator.remainingSeconds += (5 * 60); // +5 Minutes
    } else if (fuelType === 'yellow') {
      gameState.energyGenerator.remainingSeconds += (15 * 60); // +15 Minutes
    } else if (fuelType === 'orange') {
      gameState.energyGenerator.remainingSeconds += (30 * 60); // +30 Minutes
    } else if (fuelType === 'red') {
      gameState.energyGenerator.remainingSeconds += (60 * 60); // +60 Minutes
      if (gameState.energyGenerator.ratePerSec === undefined) {
        gameState.energyGenerator.ratePerSec = gameState.energyGenerator.ratePerMin || 0.01;
      }
      gameState.energyGenerator.ratePerSec += 0.01; // Rate Increase +0.01 / sec
      gameState.energyGenerator.ratePerMin = gameState.energyGenerator.ratePerSec;
    }

    sfx.playLevelUpSound();
    triggerGaugePulse();
    updateUI();
    saveGame();
  } else {
    watchAdForFuel(fuelType);
  }
}

function useGreenFuel() { handleFuelAction('green'); }
function useYellowFuel() { handleFuelAction('yellow'); }
function useOrangeFuel() { handleFuelAction('orange'); }
function useRedFuel() { handleFuelAction('red'); }

// Sponsored Ad Watcher for Standard Fuels
function watchAdForFuel(fuelType) {
  sfx.playTapSound(2);

  let fuelTitle = 'Green Fuel Cell';
  let fuelBonus = '+5 Min Generator Timer';

  if (fuelType === 'yellow') {
    fuelTitle = 'Yellow Fuel Cell';
    fuelBonus = '+15 Min Generator Timer';
  } else if (fuelType === 'orange') {
    fuelTitle = 'Orange Fuel Cell';
    fuelBonus = '+30 Min Generator Timer';
  } else if (fuelType === 'red') {
    fuelTitle = 'Red Fuel Cell';
    fuelBonus = '+60 Min & +0.01 Rate/Sec';
  }

  const doReward = () => {
    gameState.energyGenerator.fuelCells[fuelType] = (gameState.energyGenerator.fuelCells[fuelType] || 0) + 1;
    handleFuelAction(fuelType);
  };

  if (typeof showRewardedAd === 'function') {
    showRewardedAd(doReward);
  } else if (typeof startAdSimulation === 'function') {
    startAdSimulation(fuelType, `+1 ${fuelTitle}`, fuelBonus, doReward);
  } else {
    doReward();
  }
}

// ==========================================================================
// PINK BOOST FUEL (*2 Boost for 10 min, 1h Cooldown, 30m CD Reduce via Ad, 3 Ads = 1 Cell)
// ==========================================================================
function handlePinkAction() {
  ensureBoostsState();
  const pink = gameState.energyGenerator.boosts.pink;
  const count = gameState.energyGenerator.fuelCells.pink || 0;

  // If on cooldown
  if (pink.cooldownRemainingSeconds > 0) {
    sfx.playTapSound(1);
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`⏳ Pink Boost on cooldown! Watch an ad to reduce 30 min.`);
    }
    return;
  }

  // If already active
  if (pink.activeRemainingSeconds > 0) {
    sfx.playTapSound(1);
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`⚡ 2x Speed Boost is already active!`);
    }
    return;
  }

  // If user has fuel cell -> Activate!
  if (count > 0) {
    gameState.energyGenerator.fuelCells.pink--;
    gameState.energyGenerator.consumed.pink = (gameState.energyGenerator.consumed.pink || 0) + 1;
    pink.activeRemainingSeconds = 10 * 60; // 10 minutes active
    pink.cooldownRemainingSeconds = 60 * 60; // 1 hour cooldown

    sfx.playLevelUpSound();
    triggerGaugePulse();
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('⚡ 2x Boost Activated for 10 Minutes!');
    }
    updateUI();
    saveGame();
  } else {
    // 0 cells -> Watch ad toward earning a cell
    watchAdForBoostFuel('pink');
  }
}

// ==========================================================================
// PURPLE BOOST FUEL (*5 Boost for 10 min, 5h Cooldown, 30m CD Reduce via Ad, 5 Ads = 1 Cell)
// ==========================================================================
function handlePurpleAction() {
  ensureBoostsState();
  const purple = gameState.energyGenerator.boosts.purple;
  const count = gameState.energyGenerator.fuelCells.purple || 0;

  // If on cooldown
  if (purple.cooldownRemainingSeconds > 0) {
    sfx.playTapSound(1);
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`⏳ Purple Boost on cooldown! Watch an ad to reduce 30 min.`);
    }
    return;
  }

  // If already active
  if (purple.activeRemainingSeconds > 0) {
    sfx.playTapSound(1);
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`🔥 5x Speed Boost is already active!`);
    }
    return;
  }

  // If user has fuel cell -> Activate!
  if (count > 0) {
    gameState.energyGenerator.fuelCells.purple--;
    gameState.energyGenerator.consumed.purple = (gameState.energyGenerator.consumed.purple || 0) + 1;
    purple.activeRemainingSeconds = 10 * 60; // 10 minutes active
    purple.cooldownRemainingSeconds = 5 * 3600; // 5 hours cooldown

    sfx.playLevelUpSound();
    triggerGaugePulse();
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('🔥 5x Speed Boost Activated for 10 Minutes!');
    }
    updateUI();
    saveGame();
  } else {
    // 0 cells -> Watch ad toward earning a cell
    watchAdForBoostFuel('purple');
  }
}

// Cooldown Reduction: Watch ad to reduce cooldown by 30 min (1800s)
function reduceCooldownWithAd(fuelType) {
  ensureBoostsState();
  const boost = gameState.energyGenerator.boosts[fuelType];
  if (!boost || boost.cooldownRemainingSeconds <= 0) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('Cooldown is already completed!');
    }
    return;
  }

  const fuelName = fuelType === 'pink' ? 'Pink Fuel (*2)' : 'Purple Fuel (*5)';
  const doReduce = () => {
    boost.cooldownRemainingSeconds = Math.max(0, boost.cooldownRemainingSeconds - (30 * 60));
    sfx.playLevelUpSound();
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`⏳ Cooldown reduced by 30 minutes!`);
    }
    updateUI();
    saveGame();
  };

  if (typeof showRewardedAd === 'function') {
    showRewardedAd(doReduce);
  } else if (typeof startAdSimulation === 'function') {
    startAdSimulation(
      `${fuelType}_cd_reduce`,
      `Reduce ${fuelName} Cooldown`,
      'Watch an ad to reduce cooldown timer by 30 minutes',
      doReduce
    );
  } else {
    doReduce();
  }
}

// Watch Ads to earn Pink (3 ads) or Purple (5 ads) Fuel
function watchAdForBoostFuel(fuelType) {
  ensureBoostsState();
  const boost = gameState.energyGenerator.boosts[fuelType];
  const targetAds = fuelType === 'pink' ? 3 : 5;
  const currentAds = boost.adsWatched || 0;
  const fuelName = fuelType === 'pink' ? 'Pink Fuel Cell' : 'Purple Fuel Cell';

  const doBoostAdReward = () => {
    boost.adsWatched = (boost.adsWatched || 0) + 1;

    if (boost.adsWatched >= targetAds) {
      boost.adsWatched = 0;
      gameState.energyGenerator.fuelCells[fuelType] = (gameState.energyGenerator.fuelCells[fuelType] || 0) + 1;
      sfx.playLevelUpSound();
      if (typeof showFloatingToast === 'function') {
        showFloatingToast(`🎉 You unlocked +1 ${fuelName}!`);
      }
    } else {
      sfx.playTapSound(2);
      if (typeof showFloatingToast === 'function') {
        showFloatingToast(`🎬 Ad ${boost.adsWatched}/${targetAds} complete!`);
      }
    }

    updateUI();
    saveGame();
  };

  if (typeof showRewardedAd === 'function') {
    showRewardedAd(doBoostAdReward);
  } else if (typeof startAdSimulation === 'function') {
    startAdSimulation(
      `${fuelType}_boost_fuel`,
      `+1 ${fuelName}`,
      `Watch ad (${currentAds + 1}/${targetAds}) to win +1 ${fuelName}`,
      doBoostAdReward
    );
  } else {
    doBoostAdReward();
  }
}

// Time Format Helpers
function formatSecondsMMSS(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatCooldownDisplay(totalSeconds) {
  if (totalSeconds >= 3600) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return `${h}h ${String(m).padStart(2, '0')}m`;
  }
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

function triggerGaugePulse() {
  if (DOM.gaugeCore) {
    DOM.gaugeCore.style.transform = 'scale(1.18)';
    setTimeout(() => DOM.gaugeCore.style.transform = 'scale(1)', 320);
  }
}

// Synchronize Energy Page UI elements
function updateEnergyUI() {
  ensureBoostsState();

  // Center EP Counter (Current Real Energy Balance in Decimal)
  const epPill = document.getElementById('epCounterPill') || DOM.epCounterPill;
  if (epPill) {
    const epCounterEl = epPill.querySelector('.ep-badge-icon');
    if (epCounterEl) {
      const curEnergy = Math.max(0, Number(gameState.reactor.currentEnergy) || 0);
      epCounterEl.textContent = curEnergy.toFixed(2);
    }
  }

  // Circular Gauge Progress Circle (Synchronized with Current Energy / Max Energy)
  const gaugeCircle = document.getElementById('gaugeProgressCircle');
  if (gaugeCircle) {
    const curEnergy = Math.max(0, Math.floor(gameState.reactor.currentEnergy || 0));
    const maxEnergy = gameState.reactor.maxEnergy || 1000;
    const ratio = Math.min(1, Math.max(0, curEnergy / maxEnergy));
    const circumference = 515;
    gaugeCircle.style.strokeDashoffset = `${circumference * (1 - ratio)}`;
  }

  // Live Generator Rate with active boost tag
  if (DOM.fuelRateVal) {
    const rate = (gameState.energyGenerator.ratePerSec !== undefined)
      ? gameState.energyGenerator.ratePerSec
      : (gameState.energyGenerator.ratePerMin || 0.01);
    const boosts = gameState.energyGenerator.boosts;
    const pinkActive = boosts.pink.activeRemainingSeconds > 0;
    const purpleActive = boosts.purple.activeRemainingSeconds > 0;

    let multiplierBadge = '';
    if (pinkActive && purpleActive) {
      multiplierBadge = ` <span class="rate-boost-tag boost-tag-combo">⚡🔥 *10 BOOST</span>`;
    } else if (purpleActive) {
      multiplierBadge = ` <span class="rate-boost-tag boost-tag-purple">🔥 *5 BOOST</span>`;
    } else if (pinkActive) {
      multiplierBadge = ` <span class="rate-boost-tag boost-tag-pink">⚡ *2 BOOST</span>`;
    }

    DOM.fuelRateVal.innerHTML = `${rate.toFixed(2)} <span class="rate-unit">/ sec</span>${multiplierBadge}`;
  }

  // Standard Cell Count Badges
  if (DOM.greenCellCount) DOM.greenCellCount.textContent = `${gameState.energyGenerator.fuelCells.green || 0} Cells`;
  if (DOM.yellowCellCount) DOM.yellowCellCount.textContent = `${gameState.energyGenerator.fuelCells.yellow || 0} Cells`;
  if (DOM.orangeCellCount) DOM.orangeCellCount.textContent = `${gameState.energyGenerator.fuelCells.orange || 0} Cells`;
  if (DOM.redCellCount) DOM.redCellCount.textContent = `${gameState.energyGenerator.fuelCells.red || 0} Cells`;

  // Standard Fuel Buttons
  if (DOM.btnUseGreenFuel) {
    const greenCount = gameState.energyGenerator.fuelCells.green || 0;
    const span = DOM.btnUseGreenFuel.querySelector('span');
    if (greenCount > 0) {
      DOM.btnUseGreenFuel.className = 'fuel-action-btn green-btn';
      if (span) span.textContent = 'Use (5 Min)';
    } else {
      DOM.btnUseGreenFuel.className = 'fuel-action-btn ad-blue-btn';
      if (span) span.textContent = 'Watch Ad (+1 Fuel)';
    }
  }

  const btnYellow = document.getElementById('btnYellowAd');
  if (btnYellow) {
    const yellowCount = gameState.energyGenerator.fuelCells.yellow || 0;
    const span = btnYellow.querySelector('span');
    if (yellowCount > 0) {
      btnYellow.className = 'fuel-action-btn yellow-btn';
      if (span) span.textContent = 'Use (15 Min)';
    } else {
      btnYellow.className = 'fuel-action-btn ad-blue-btn';
      if (span) span.textContent = 'Watch Ad (+1 Fuel)';
    }
  }

  const btnOrange = document.getElementById('btnOrangeAd');
  if (btnOrange) {
    const orangeCount = gameState.energyGenerator.fuelCells.orange || 0;
    const span = btnOrange.querySelector('span');
    if (orangeCount > 0) {
      btnOrange.className = 'fuel-action-btn orange-btn';
      if (span) span.textContent = 'Use (30 Min)';
    } else {
      btnOrange.className = 'fuel-action-btn ad-blue-btn';
      if (span) span.textContent = 'Watch Ad (+1 Fuel)';
    }
  }

  const btnRed = document.getElementById('btnRedAd');
  if (btnRed) {
    const redCount = gameState.energyGenerator.fuelCells.red || 0;
    const span = btnRed.querySelector('span');
    if (redCount > 0) {
      btnRed.className = 'fuel-action-btn red-btn';
      if (span) span.textContent = 'Use (60 Min)';
    } else {
      btnRed.className = 'fuel-action-btn ad-blue-btn';
      if (span) span.textContent = 'Watch Ad (+1 Fuel)';
    }
  }

  // ========================================================================
  // PINK BOOST FUEL UI SYNCHRONIZATION
  // ========================================================================
  const pink = gameState.energyGenerator.boosts.pink;
  const pinkCount = gameState.energyGenerator.fuelCells.pink || 0;
  const pinkCountEl = document.getElementById('pinkCellCount');
  if (pinkCountEl) pinkCountEl.textContent = `${pinkCount} Cells`;

  const pinkStatusInfo = document.getElementById('pinkStatusInfo');
  if (pinkStatusInfo) {
    if (pink.activeRemainingSeconds > 0) {
      pinkStatusInfo.innerHTML = `<span class="boost-running-badge pulse-pink">⚡ 2x Active: <strong>${formatSecondsMMSS(pink.activeRemainingSeconds)}</strong></span>`;
    } else if (pink.cooldownRemainingSeconds > 0) {
      pinkStatusInfo.innerHTML = `<span class="boost-cd-badge">⏳ Cooldown: <strong>${formatCooldownDisplay(pink.cooldownRemainingSeconds)}</strong></span>`;
    } else {
      pinkStatusInfo.innerHTML = `<span class="boost-ready-badge">✨ Ready • 1h Cooldown</span>`;
    }
  }

  const btnPinkAction = document.getElementById('btnPinkAction');
  const btnPinkText = document.getElementById('btnPinkText');
  const btnPinkReduceCd = document.getElementById('btnPinkReduceCd');
  const pinkAdCountText = document.getElementById('pinkAdCountText');
  const btnPinkAdFarming = document.getElementById('btnPinkAdFarming');

  if (pinkAdCountText) pinkAdCountText.textContent = `${pink.adsWatched || 0}/3`;

  if (btnPinkAction && btnPinkText) {
    if (pink.activeRemainingSeconds > 0) {
      btnPinkAction.className = 'fuel-action-btn pink-btn boost-running-btn';
      btnPinkText.textContent = `⚡ 2x Active (${formatSecondsMMSS(pink.activeRemainingSeconds)})`;
    } else if (pink.cooldownRemainingSeconds > 0) {
      btnPinkAction.className = 'fuel-action-btn pink-btn disabled-btn';
      btnPinkText.textContent = `⏳ On Cooldown (${formatCooldownDisplay(pink.cooldownRemainingSeconds)})`;
    } else if (pinkCount > 0) {
      btnPinkAction.className = 'fuel-action-btn pink-btn';
      btnPinkText.textContent = '⚡ Use 2x Boost';
    } else {
      btnPinkAction.className = 'fuel-action-btn ad-blue-btn';
      btnPinkText.textContent = `🎬 Watch Ad (${pink.adsWatched || 0}/3)`;
    }
  }

  if (btnPinkReduceCd) {
    btnPinkReduceCd.style.display = pink.cooldownRemainingSeconds > 0 ? 'flex' : 'none';
  }

  if (btnPinkAdFarming) {
    // Show farming button when on cooldown or active so user can always progress toward cells
    btnPinkAdFarming.style.display = (pink.cooldownRemainingSeconds > 0 || pink.activeRemainingSeconds > 0) ? 'flex' : (pinkCount === 0 ? 'none' : 'flex');
  }

  // ========================================================================
  // PURPLE BOOST FUEL UI SYNCHRONIZATION
  // ========================================================================
  const purple = gameState.energyGenerator.boosts.purple;
  const purpleCount = gameState.energyGenerator.fuelCells.purple || 0;
  const purpleCountEl = document.getElementById('purpleCellCount');
  if (purpleCountEl) purpleCountEl.textContent = `${purpleCount} Cells`;

  const purpleStatusInfo = document.getElementById('purpleStatusInfo');
  if (purpleStatusInfo) {
    if (purple.activeRemainingSeconds > 0) {
      purpleStatusInfo.innerHTML = `<span class="boost-running-badge pulse-purple">🔥 5x Active: <strong>${formatSecondsMMSS(purple.activeRemainingSeconds)}</strong></span>`;
    } else if (purple.cooldownRemainingSeconds > 0) {
      purpleStatusInfo.innerHTML = `<span class="boost-cd-badge">⏳ Cooldown: <strong>${formatCooldownDisplay(purple.cooldownRemainingSeconds)}</strong></span>`;
    } else {
      purpleStatusInfo.innerHTML = `<span class="boost-ready-badge">✨ Ready • 5h Cooldown</span>`;
    }
  }

  const btnPurpleAction = document.getElementById('btnPurpleAction');
  const btnPurpleText = document.getElementById('btnPurpleText');
  const btnPurpleReduceCd = document.getElementById('btnPurpleReduceCd');
  const purpleAdCountText = document.getElementById('purpleAdCountText');
  const btnPurpleAdFarming = document.getElementById('btnPurpleAdFarming');

  if (purpleAdCountText) purpleAdCountText.textContent = `${purple.adsWatched || 0}/5`;

  if (btnPurpleAction && btnPurpleText) {
    if (purple.activeRemainingSeconds > 0) {
      btnPurpleAction.className = 'fuel-action-btn purple-btn boost-running-btn';
      btnPurpleText.textContent = `🔥 5x Active (${formatSecondsMMSS(purple.activeRemainingSeconds)})`;
    } else if (purple.cooldownRemainingSeconds > 0) {
      btnPurpleAction.className = 'fuel-action-btn purple-btn disabled-btn';
      btnPurpleText.textContent = `⏳ On Cooldown (${formatCooldownDisplay(purple.cooldownRemainingSeconds)})`;
    } else if (purpleCount > 0) {
      btnPurpleAction.className = 'fuel-action-btn purple-btn';
      btnPurpleText.textContent = '🔥 Use 5x Boost';
    } else {
      btnPurpleAction.className = 'fuel-action-btn ad-blue-btn';
      btnPurpleText.textContent = `🎬 Watch Ad (${purple.adsWatched || 0}/5)`;
    }
  }

  if (btnPurpleReduceCd) {
    btnPurpleReduceCd.style.display = purple.cooldownRemainingSeconds > 0 ? 'flex' : 'none';
  }

  if (btnPurpleAdFarming) {
    btnPurpleAdFarming.style.display = (purple.cooldownRemainingSeconds > 0 || purple.activeRemainingSeconds > 0) ? 'flex' : (purpleCount === 0 ? 'none' : 'flex');
  }

  formatTimerDisplay();
}

// Global Exports
window.startEnergyEngine = startEnergyEngine;
window.handleFuelAction = handleFuelAction;
window.useGreenFuel = useGreenFuel;
window.useYellowFuel = useYellowFuel;
window.useOrangeFuel = useOrangeFuel;
window.useRedFuel = useRedFuel;
window.watchAdForFuel = watchAdForFuel;
window.handlePinkAction = handlePinkAction;
window.handlePurpleAction = handlePurpleAction;
window.reduceCooldownWithAd = reduceCooldownWithAd;
window.watchAdForBoostFuel = watchAdForBoostFuel;
window.triggerGaugePulse = triggerGaugePulse;
window.updateEnergyUI = updateEnergyUI;
