/* ==========================================================================
   ENERGY TAP REACTOR - ENERGY GENERATOR (energy.js)
   - Center Circle Energy Generator Engine with live timer & EP accumulation
   - Live generation rate (0.001 / sec baseline)
   - 4 Standard Fuel Cells:
     * Green: +5m Timer
     * Yellow: +15m Timer
     * Orange: +30m Timer
     * Red: +60m Timer & +0.001 Rate/Sec
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

// Piecewise simulation engine for real-time and offline energy generation
function advanceEnergyGenerator(deltaSeconds, isOffline = false) {
  ensureBoostsState();
  if (!deltaSeconds || deltaSeconds <= 0) return { epGain: 0, fuelSecondsConsumed: 0 };

  const boosts = gameState.energyGenerator.boosts;
  let remainingSecs = Math.floor(deltaSeconds);
  let totalEpGained = 0;
  let totalFuelSecondsConsumed = 0;
  let iterations = 0;

  while (remainingSecs > 0 && iterations < 50) {
    iterations++;

    const pinkActive = boosts.pink.activeRemainingSeconds || 0;
    const purpleActive = boosts.purple.activeRemainingSeconds || 0;
    const pinkCd = boosts.pink.cooldownRemainingSeconds || 0;
    const purpleCd = boosts.purple.cooldownRemainingSeconds || 0;
    const fuelSecs = gameState.energyGenerator.remainingSeconds || 0;
    const darkRedSecs = gameState.energyGenerator.darkRedRemainingSeconds || 0;

    let speedMult = 1;
    if (pinkActive > 0) speedMult *= 2;
    if (purpleActive > 0) speedMult *= 5;

    // Fast-path: if no fuel, no dark red, and no active boosts, just fast-forward cooldowns
    if (fuelSecs <= 0 && darkRedSecs <= 0 && pinkActive <= 0 && purpleActive <= 0) {
      boosts.pink.cooldownRemainingSeconds = Math.max(0, pinkCd - remainingSecs);
      boosts.purple.cooldownRemainingSeconds = Math.max(0, purpleCd - remainingSecs);
      remainingSecs = 0;
      break;
    }

    // Determine duration until next state change
    let step = remainingSecs;
    if (pinkActive > 0) step = Math.min(step, pinkActive);
    if (purpleActive > 0) step = Math.min(step, purpleActive);
    if (pinkCd > 0 && pinkActive <= 0) step = Math.min(step, pinkCd);
    if (purpleCd > 0 && purpleActive <= 0) step = Math.min(step, purpleCd);
    if (darkRedSecs > 0) {
      const secondsToExhaustDarkRed = Math.ceil(darkRedSecs / speedMult);
      step = Math.min(step, secondsToExhaustDarkRed);
    } else if (fuelSecs > 0) {
      const secondsToExhaustFuel = Math.ceil(fuelSecs / speedMult);
      step = Math.min(step, secondsToExhaustFuel);
    }
    step = Math.max(1, Math.min(step, remainingSecs));

    // 1. Tick Boost active or cooldowns
    if (boosts.pink.activeRemainingSeconds > 0) {
      boosts.pink.activeRemainingSeconds = Math.max(0, boosts.pink.activeRemainingSeconds - step);
    } else if (boosts.pink.cooldownRemainingSeconds > 0) {
      boosts.pink.cooldownRemainingSeconds = Math.max(0, boosts.pink.cooldownRemainingSeconds - step);
    }

    if (boosts.purple.activeRemainingSeconds > 0) {
      boosts.purple.activeRemainingSeconds = Math.max(0, boosts.purple.activeRemainingSeconds - step);
    } else if (boosts.purple.cooldownRemainingSeconds > 0) {
      boosts.purple.cooldownRemainingSeconds = Math.max(0, boosts.purple.cooldownRemainingSeconds - step);
    }

    // 2. Consume fuel & accrue EP
    if (gameState.energyGenerator.darkRedRemainingSeconds > 0) {
      // Dark Red generator operates for 30s at 0.01 Energy per second
      const darkRedToConsume = Math.min(gameState.energyGenerator.darkRedRemainingSeconds, step * speedMult);
      gameState.energyGenerator.darkRedRemainingSeconds -= darkRedToConsume;
      totalFuelSecondsConsumed += darkRedToConsume;

      const rate = 0.01; // 0.01 Energy per second
      const epGain = rate * darkRedToConsume;
      totalEpGained += epGain;

      gameState.reactor.currentEnergy = (gameState.reactor.currentEnergy || 0) + epGain;
      gameState.energyGenerator.epTotal = (gameState.energyGenerator.epTotal || 0) + epGain;
    } else if (gameState.energyGenerator.remainingSeconds > 0) {
      const fuelToConsume = Math.min(gameState.energyGenerator.remainingSeconds, step * speedMult);
      gameState.energyGenerator.remainingSeconds -= fuelToConsume;
      totalFuelSecondsConsumed += fuelToConsume;

      const rate = (gameState.energyGenerator.ratePerSec !== undefined)
        ? gameState.energyGenerator.ratePerSec
        : (gameState.energyGenerator.ratePerMin || 0.001);
      const epGain = rate * fuelToConsume;
      totalEpGained += epGain;

      gameState.reactor.currentEnergy = (gameState.reactor.currentEnergy || 0) + epGain;
      gameState.energyGenerator.epTotal = (gameState.energyGenerator.epTotal || 0) + epGain;
    }

    remainingSecs -= step;
  }

  gameState.energyGenerator.isActive = (
    (gameState.energyGenerator.remainingSeconds > 0) || 
    ((gameState.energyGenerator.darkRedRemainingSeconds || 0) > 0)
  );
  return { epGain: totalEpGained, fuelSecondsConsumed: totalFuelSecondsConsumed };
}

// Process offline catchup when reopening the app, returning from background, or cloud sync
function processEnergyGeneratorOfflineCatchup(fromTimestamp, source = 'offline') {
  if (!fromTimestamp || isNaN(Number(fromTimestamp))) return;
  const now = Date.now();
  const elapsedSeconds = Math.floor((now - Number(fromTimestamp)) / 1000);

  if (elapsedSeconds < 2) return;

  const result = advanceEnergyGenerator(elapsedSeconds, true);
  gameState.energyGenerator.lastTickTime = now;

  if (result && result.epGain > 0.001) {
    const epStr = result.epGain.toFixed(2);
    const timeFormatted = formatCooldownDisplay(elapsedSeconds);
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`⚡ While away: +${epStr} EP generated (${timeFormatted})!`);
    }
  }

  formatTimerDisplay();
  updateEnergyUI();
  if (typeof updateHomeUI === 'function') updateHomeUI();
  saveGame();
}

let energyAutoSaveTicks = 0;

function startEnergyEngine() {
  if (gameState.energyGenerator.timerInterval) {
    clearInterval(gameState.energyGenerator.timerInterval);
  }

  if (!gameState.energyGenerator.lastTickTime) {
    gameState.energyGenerator.lastTickTime = Date.now();
  }

  gameState.energyGenerator.timerInterval = setInterval(() => {
    const now = Date.now();
    const lastTick = gameState.energyGenerator.lastTickTime || now;
    const dt = Math.floor((now - lastTick) / 1000);

    if (dt >= 1) {
      advanceEnergyGenerator(dt, false);
      gameState.energyGenerator.lastTickTime = now;
    }

    gameState.energyGenerator.isActive = (
      (gameState.energyGenerator.remainingSeconds > 0) || 
      ((gameState.energyGenerator.darkRedRemainingSeconds || 0) > 0)
    );
    formatTimerDisplay();
    updateEnergyUI();
    if (typeof updateHomeUI === 'function') updateHomeUI();

    // Auto-save periodic progress to Firebase & LocalStorage while generating
    energyAutoSaveTicks++;
    if (energyAutoSaveTicks >= 6) {
      energyAutoSaveTicks = 0;
      if (gameState.energyGenerator.isActive) {
        saveGame();
      }
    }
  }, 1000);
}

function ensureBoostsState() {
  if (gameState.energyGenerator.darkRedRemainingSeconds === undefined) {
    gameState.energyGenerator.darkRedRemainingSeconds = 0;
  }
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
    gameState.energyGenerator.fuelCells = { green: 0, darkgreen: 0, yellow: 0, orange: 0, red: 0, darkred: 0, pink: 0, purple: 0 };
  }
  if (gameState.energyGenerator.fuelCells.darkgreen === undefined) gameState.energyGenerator.fuelCells.darkgreen = 0;
  if (gameState.energyGenerator.fuelCells.darkred === undefined) gameState.energyGenerator.fuelCells.darkred = 0;
  if (gameState.energyGenerator.fuelCells.pink === undefined) gameState.energyGenerator.fuelCells.pink = 0;
  if (gameState.energyGenerator.fuelCells.purple === undefined) gameState.energyGenerator.fuelCells.purple = 0;
}

// Master Fuel Action Handler for Green, Dark Green, Yellow, Orange, Red (Zero Ads)
function handleFuelAction(fuelType) {
  const currentCount = (gameState.energyGenerator.fuelCells && gameState.energyGenerator.fuelCells[fuelType]) || 0;

  if (currentCount > 0) {
    gameState.energyGenerator.fuelCells[fuelType]--;
  }

  gameState.energyGenerator.consumed[fuelType] = (gameState.energyGenerator.consumed[fuelType] || 0) + 1;

  // Track daily task fuel consumption
  if (typeof checkDailyStatsDate === 'function') checkDailyStatsDate();
  if (gameState.dailyStats) {
    const statKey = 'fuel_' + fuelType;
    gameState.dailyStats[statKey] = (gameState.dailyStats[statKey] || 0) + 1;
  }

  if (fuelType === 'green') {
    gameState.energyGenerator.remainingSeconds += (5 * 60); // +5 Minutes
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('⚡ Green Fuel activated: +5 Min Generator Timer added!');
    }
  } else if (fuelType === 'darkgreen') {
    gameState.energyGenerator.remainingSeconds += 60; // +1 Minute
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('🌿 Dark Green Fuel activated: +1 Min Generator Timer added!');
    }
  } else if (fuelType === 'yellow') {
    gameState.energyGenerator.remainingSeconds += (15 * 60); // +15 Minutes
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('⚡ Yellow Fuel activated: +15 Min Generator Timer added!');
    }
  } else if (fuelType === 'orange') {
    gameState.energyGenerator.remainingSeconds += (30 * 60); // +30 Minutes
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('⚡ Orange Fuel activated: +30 Min Generator Timer added!');
    }
  } else if (fuelType === 'red') {
    if (gameState.energyGenerator.ratePerSec === undefined) {
      gameState.energyGenerator.ratePerSec = gameState.energyGenerator.ratePerMin || 0.001;
    }
    gameState.energyGenerator.ratePerSec = +(gameState.energyGenerator.ratePerSec + 0.001).toFixed(4);
    gameState.energyGenerator.ratePerMin = gameState.energyGenerator.ratePerSec;
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`🔥 Red Fuel activated: +0.001 EP/Sec Rate increased! (Current: +${gameState.energyGenerator.ratePerSec}/s)`);
    }
  } else if (fuelType === 'darkred') {
    gameState.energyGenerator.darkRedRemainingSeconds = (gameState.energyGenerator.darkRedRemainingSeconds || 0) + 30;
    gameState.energyGenerator.isActive = true;
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('⚡ Dark Red Generator activated: 30s at 0.01 Energy/sec!');
    }
  } else if (fuelType === 'blue') {
    executeTimeSkip(30, 'Blue Fuel (30s Skip)');
  } else if (fuelType === 'lightblue') {
    executeTimeSkip(60, 'Light Blue Fuel (1m Skip)');
  }

  sfx.playLevelUpSound();
  triggerGaugePulse();
  updateUI();
  saveGame();
}

function useGreenFuel() { handleFuelAction('green'); }
function useDarkGreenFuel() { handleFuelAction('darkgreen'); }
function useYellowFuel() { handleFuelAction('yellow'); }
function useOrangeFuel() { handleFuelAction('orange'); }
function useRedFuel() { handleFuelAction('red'); }
function useDarkRedFuel() { handleFuelAction('darkred'); }
function useBlueFuel() { handleFuelAction('blue'); }
function useLightBlueFuel() { handleFuelAction('lightblue'); }
window.useBlueFuel = useBlueFuel;
window.useLightBlueFuel = useLightBlueFuel;

// Time Skip Engine for Blue (30s) and Light Blue (60s / 1m) Fuels
function executeTimeSkip(skipSeconds, label) {
  ensureBoostsState();
  const boosts = (gameState.energyGenerator && gameState.energyGenerator.boosts) || { pink: {}, purple: {} };
  let speedMult = 1;
  if (boosts.pink && (boosts.pink.activeRemainingSeconds || 0) > 0) speedMult *= 2;
  if (boosts.purple && (boosts.purple.activeRemainingSeconds || 0) > 0) speedMult *= 5;

  const rate = gameState.energyGenerator.ratePerSec || gameState.energyGenerator.ratePerMin || 0.001;
  let epGain = 0;

  // 1. Advance active fuel timer if present
  if ((gameState.energyGenerator.remainingSeconds || 0) > 0) {
    const timeToDeduct = Math.min(skipSeconds, gameState.energyGenerator.remainingSeconds);
    gameState.energyGenerator.remainingSeconds -= timeToDeduct;
    epGain += +(timeToDeduct * rate * speedMult);
    if (timeToDeduct < skipSeconds) {
      epGain += +((skipSeconds - timeToDeduct) * rate);
    }
  } else {
    // If no fuel timer is currently burning, immediately generate full energy for the skipped duration!
    epGain += +(skipSeconds * rate * speedMult);
  }

  // 2. Advance Dark Red special timer if active
  if ((gameState.energyGenerator.darkRedRemainingSeconds || 0) > 0) {
    const drDeduct = Math.min(skipSeconds, gameState.energyGenerator.darkRedRemainingSeconds);
    gameState.energyGenerator.darkRedRemainingSeconds -= drDeduct;
    epGain += +(drDeduct * 0.01);
  }

  // 3. Fast-forward boost cooldowns if on cooldown
  if (boosts.pink && (boosts.pink.cooldownRemainingSeconds || 0) > 0) {
    boosts.pink.cooldownRemainingSeconds = Math.max(0, boosts.pink.cooldownRemainingSeconds - skipSeconds);
  }
  if (boosts.purple && (boosts.purple.cooldownRemainingSeconds || 0) > 0) {
    boosts.purple.cooldownRemainingSeconds = Math.max(0, boosts.purple.cooldownRemainingSeconds - skipSeconds);
  }

  // 4. Advance boost active timer if currently running
  if (boosts.pink && (boosts.pink.activeRemainingSeconds || 0) > 0) {
    boosts.pink.activeRemainingSeconds = Math.max(0, boosts.pink.activeRemainingSeconds - skipSeconds);
  }
  if (boosts.purple && (boosts.purple.activeRemainingSeconds || 0) > 0) {
    boosts.purple.activeRemainingSeconds = Math.max(0, boosts.purple.activeRemainingSeconds - skipSeconds);
  }

  // 5. Award Energy EP
  epGain = +epGain.toFixed(2);
  gameState.reactor.currentEnergy = +((gameState.reactor.currentEnergy || 0) + epGain).toFixed(2);
  gameState.energyGenerator.epTotal = +((gameState.energyGenerator.epTotal || 0) + epGain).toFixed(2);

  // Sound and Toast
  if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') {
    sfx.playLevelUpSound();
  }
  triggerGaugePulse();
  if (typeof showFloatingToast === 'function') {
    showFloatingToast(`⚡ ${label} activated! Skipped ${skipSeconds}s & gained +${epGain.toFixed(2)} EP!`);
  }
}

// ==========================================================================
// PINK BOOST FUEL (*2 Boost for 10 min, 1h Cooldown - Zero Ads)
// ==========================================================================
function handlePinkAction() {
  ensureBoostsState();
  const pink = gameState.energyGenerator.boosts.pink;
  const count = gameState.energyGenerator.fuelCells.pink || 0;

  // If on cooldown
  if (pink.cooldownRemainingSeconds > 0) {
    sfx.playTapSound(1);
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`⏳ Pink Boost on cooldown (${formatCooldownDisplay(pink.cooldownRemainingSeconds)})`);
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

  if (count > 0) {
    gameState.energyGenerator.fuelCells.pink--;
  }
  gameState.energyGenerator.consumed.pink = (gameState.energyGenerator.consumed.pink || 0) + 1;

  // Track daily task fuel consumption
  if (typeof checkDailyStatsDate === 'function') checkDailyStatsDate();
  if (gameState.dailyStats) {
    gameState.dailyStats.fuel_pink = (gameState.dailyStats.fuel_pink || 0) + 1;
  }

  pink.activeRemainingSeconds = 10 * 60; // 10 minutes active
  pink.cooldownRemainingSeconds = 60 * 60; // 1 hour cooldown

  sfx.playLevelUpSound();
  triggerGaugePulse();
  if (typeof showFloatingToast === 'function') {
    showFloatingToast('⚡ 2x Boost Activated for 10 Minutes!');
  }
  updateUI();
  saveGame();
}

// ==========================================================================
// PURPLE BOOST FUEL (*5 Boost for 10 min, 5h Cooldown - Zero Ads)
// ==========================================================================
function handlePurpleAction() {
  ensureBoostsState();
  const purple = gameState.energyGenerator.boosts.purple;
  const count = gameState.energyGenerator.fuelCells.purple || 0;

  // If on cooldown
  if (purple.cooldownRemainingSeconds > 0) {
    sfx.playTapSound(1);
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`⏳ Purple Boost on cooldown (${formatCooldownDisplay(purple.cooldownRemainingSeconds)})`);
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

  if (count > 0) {
    gameState.energyGenerator.fuelCells.purple--;
  }
  gameState.energyGenerator.consumed.purple = (gameState.energyGenerator.consumed.purple || 0) + 1;

  // Track daily task fuel consumption
  if (typeof checkDailyStatsDate === 'function') checkDailyStatsDate();
  if (gameState.dailyStats) {
    gameState.dailyStats.fuel_purple = (gameState.dailyStats.fuel_purple || 0) + 1;
  }

  purple.activeRemainingSeconds = 10 * 60; // 10 minutes active
  purple.cooldownRemainingSeconds = 5 * 3600; // 5 hours cooldown

  sfx.playLevelUpSound();
  triggerGaugePulse();
  if (typeof showFloatingToast === 'function') {
    showFloatingToast('🔥 5x Speed Boost Activated for 10 Minutes!');
  }
  updateUI();
  saveGame();
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

  // If Energy page is not currently active, skip updating 20+ fuel cell buttons and status badges
  const isEnergyPageActive = (gameState.currentTab === 'energy') || (DOM.pageEnergy && DOM.pageEnergy.classList.contains('active'));
  if (!isEnergyPageActive) {
    formatTimerDisplay();
    return;
  }

  // Live Generator Rate with active boost tag
  if (DOM.fuelRateVal) {
    const drSecs = (gameState.energyGenerator && gameState.energyGenerator.darkRedRemainingSeconds) || 0;
    const rate = drSecs > 0 ? 0.01 : ((gameState.energyGenerator.ratePerSec !== undefined)
      ? gameState.energyGenerator.ratePerSec
      : (gameState.energyGenerator.ratePerMin || 0.001));
    const boosts = gameState.energyGenerator.boosts;
    const pinkActive = boosts.pink.activeRemainingSeconds > 0;
    const purpleActive = boosts.purple.activeRemainingSeconds > 0;

    let multiplierBadge = '';
    if (drSecs > 0) {
      multiplierBadge = ` <span class="rate-boost-tag boost-tag-darkred">🔴 DARK RED 0.01/s</span>`;
    } else if (pinkActive && purpleActive) {
      multiplierBadge = ` <span class="rate-boost-tag boost-tag-combo">⚡🔥 *10 BOOST</span>`;
    } else if (purpleActive) {
      multiplierBadge = ` <span class="rate-boost-tag boost-tag-purple">🔥 *5 BOOST</span>`;
    } else if (pinkActive) {
      multiplierBadge = ` <span class="rate-boost-tag boost-tag-pink">⚡ *2 BOOST</span>`;
    }

    DOM.fuelRateVal.innerHTML = `${Number(rate).toFixed(3)} <span class="rate-unit">/ sec</span>${multiplierBadge}`;
  }

  // Standard Cell Count Badges
  // Track current toggle mode per fuel type: 'use' or 'buy'
  if (!window.fuelModes) {
    window.fuelModes = {
      green: 'use',
      darkgreen: 'use',
      yellow: 'use',
      orange: 'use',
      red: 'use',
      darkred: 'use',
      pink: 'use',
      purple: 'use'
    };
  }

  // Update Fuel Cell Badges
  if (DOM.greenCellCount) DOM.greenCellCount.textContent = `${gameState.energyGenerator.fuelCells.green || 0} Cells`;
  const elDarkGreen = DOM.darkgreenCellCount || document.getElementById('darkgreenCellCount');
  if (elDarkGreen) elDarkGreen.textContent = `${gameState.energyGenerator.fuelCells.darkgreen || 0} Cells`;
  if (DOM.yellowCellCount) DOM.yellowCellCount.textContent = `${gameState.energyGenerator.fuelCells.yellow || 0} Cells`;
  if (DOM.orangeCellCount) DOM.orangeCellCount.textContent = `${gameState.energyGenerator.fuelCells.orange || 0} Cells`;
  if (DOM.redCellCount) DOM.redCellCount.textContent = `${gameState.energyGenerator.fuelCells.red || 0} Cells`;
  const elDarkRed = DOM.darkredCellCount || document.getElementById('darkredCellCount');
  if (elDarkRed) elDarkRed.textContent = `${(gameState.energyGenerator.fuelCells && gameState.energyGenerator.fuelCells.darkred) || 0} Cells`;

  const darkredStatusInfo = document.getElementById('darkredStatusInfo');
  if (darkredStatusInfo) {
    const drSecs = (gameState.energyGenerator && gameState.energyGenerator.darkRedRemainingSeconds) || 0;
    if (drSecs > 0) {
      darkredStatusInfo.style.display = 'flex';
      darkredStatusInfo.innerHTML = `<span class="boost-running-badge pulse-darkred">🔴 Active: <strong>${drSecs}s</strong> @ 0.01/s</span>`;
    } else {
      darkredStatusInfo.style.display = 'none';
      darkredStatusInfo.innerHTML = '';
    }
  }

  // Standard Fuel Cells (Direct Action Button: Use when > 0, Disabled when 0)
  const standardFuels = [
    { type: 'green', btnId: 'btnUseGreenFuel', textId: 'btnGreenText', defaultColor: 'green-btn', label: '⚡ Use Fuel (+5m)' },
    { type: 'darkgreen', btnId: 'btnUseDarkGreenFuel', textId: 'btnDarkGreenText', defaultColor: 'darkgreen-btn', label: '⚡ Use Fuel (+1m)' },
    { type: 'yellow', btnId: 'btnYellowAd', textId: 'btnYellowText', defaultColor: 'yellow-btn', label: '⚡ Use Fuel (+15m)' },
    { type: 'orange', btnId: 'btnOrangeAd', textId: 'btnOrangeText', defaultColor: 'orange-btn', label: '⚡ Use Fuel (+30m)' },
    { type: 'red', btnId: 'btnRedAd', textId: 'btnRedText', defaultColor: 'red-btn', label: '⚡ Use Fuel (+0.001/s)' },
    { type: 'darkred', btnId: 'btnUseDarkRedFuel', textId: 'btnDarkRedText', defaultColor: 'darkred-btn', label: '⚡ Use Fuel (30s)' }
  ];

  standardFuels.forEach(item => {
    const count = (gameState.energyGenerator.fuelCells && gameState.energyGenerator.fuelCells[item.type]) || 0;
    const btn = document.getElementById(item.btnId);
    const span = document.getElementById(item.textId) || (btn ? btn.querySelector('span') : null);

    if (btn) {
      if (item.type === 'darkred' && (gameState.energyGenerator.darkRedRemainingSeconds || 0) > 0) {
        const drSecs = gameState.energyGenerator.darkRedRemainingSeconds;
        if (count <= 0) {
          btn.className = `fuel-action-btn ${item.defaultColor} boost-running-btn`;
          if (span) span.innerHTML = `<span>⚡ Active (${drSecs}s)</span>`;
        } else {
          btn.className = `fuel-action-btn ${item.defaultColor}`;
          if (span) span.innerHTML = `<span>⚡ Add +30s (${count})</span>`;
        }
      } else if (count <= 0) {
        btn.className = `fuel-action-btn ${item.defaultColor} disabled-btn`;
        if (span) span.innerHTML = `<span>⚡ Use Fuel (0)</span>`;
      } else {
        btn.className = `fuel-action-btn ${item.defaultColor}`;
        if (span) span.innerHTML = `<span>⚡ Use Fuel (${count})</span>`;
      }
    }
  });

  // ========================================================================
  // PINK BOOST FUEL UI (Direct Action Button)
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
      pinkStatusInfo.innerHTML = `<span class="boost-ready-badge">✨ Ready • 10m Boost</span>`;
    }
  }

  const btnPinkAction = document.getElementById('btnPinkAction');
  const btnPinkText = document.getElementById('btnPinkText');

  if (btnPinkAction && btnPinkText) {
    if (pink.activeRemainingSeconds > 0) {
      btnPinkAction.className = 'fuel-action-btn pink-btn boost-running-btn';
      btnPinkText.textContent = `⚡ 2x Active (${formatSecondsMMSS(pink.activeRemainingSeconds)})`;
    } else if (pink.cooldownRemainingSeconds > 0) {
      btnPinkAction.className = 'fuel-action-btn pink-btn disabled-btn';
      btnPinkText.textContent = `⏳ Cooldown (${formatCooldownDisplay(pink.cooldownRemainingSeconds)})`;
    } else if (pinkCount <= 0) {
      btnPinkAction.className = 'fuel-action-btn pink-btn disabled-btn';
      btnPinkText.textContent = `⚡ Use 2x Boost (0)`;
    } else {
      btnPinkAction.className = 'fuel-action-btn pink-btn';
      btnPinkText.textContent = `⚡ Use 2x Boost (${pinkCount})`;
    }
  }

  // ========================================================================
  // PURPLE BOOST FUEL UI (Direct Action Button)
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
      purpleStatusInfo.innerHTML = `<span class="boost-ready-badge">✨ Ready • 10m Boost</span>`;
    }
  }

  const btnPurpleAction = document.getElementById('btnPurpleAction');
  const btnPurpleText = document.getElementById('btnPurpleText');

  if (btnPurpleAction && btnPurpleText) {
    if (purple.activeRemainingSeconds > 0) {
      btnPurpleAction.className = 'fuel-action-btn purple-btn boost-running-btn';
      btnPurpleText.textContent = `🔥 5x Active (${formatSecondsMMSS(purple.activeRemainingSeconds)})`;
    } else if (purple.cooldownRemainingSeconds > 0) {
      btnPurpleAction.className = 'fuel-action-btn purple-btn disabled-btn';
      btnPurpleText.textContent = `⏳ Cooldown (${formatCooldownDisplay(purple.cooldownRemainingSeconds)})`;
    } else if (purpleCount <= 0) {
      btnPurpleAction.className = 'fuel-action-btn purple-btn disabled-btn';
      btnPurpleText.textContent = `🔥 Use 5x Boost (0)`;
    } else {
      btnPurpleAction.className = 'fuel-action-btn purple-btn';
      btnPurpleText.textContent = `🔥 Use 5x Boost (${purpleCount})`;
    }
  }

  formatTimerDisplay();
}

// Helper to get fuel readable name
function getFuelDisplayName(fuelType) {
  switch (fuelType) {
    case 'green': return 'Green Fuel (+5m)';
    case 'darkgreen': return 'Dark Green Fuel (+1m)';
    case 'yellow': return 'Yellow Fuel (+15m)';
    case 'orange': return 'Orange Fuel (+30m)';
    case 'red': return 'Red Fuel (+0.001 Rate)';
    case 'darkred': return 'Dark Red Fuel (30s @ 0.01/s)';
    case 'blue': return 'Blue Fuel (30s Skip)';
    case 'lightblue': return 'Light Blue Fuel (1m Skip)';
    case 'pink': return 'Pink Boost Fuel (*2)';
    case 'purple': return 'Purple Boost Fuel (*5)';
    default: return 'Fuel';
  }
}

// Master Execution Handler for Fuel Action Button
window.executeFuelButtonAction = function(fuelType) {
  const count = (gameState.energyGenerator && gameState.energyGenerator.fuelCells && gameState.energyGenerator.fuelCells[fuelType]) || 0;

  if (count <= 0) {
    if (typeof sfx !== 'undefined' && typeof sfx.playErrorSound === 'function') {
      sfx.playErrorSound();
    }
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`No ${getFuelDisplayName(fuelType)} cells available!`);
    }
    return;
  }

  if (fuelType === 'pink') {
    handlePinkAction();
  } else if (fuelType === 'purple') {
    handlePurpleAction();
  } else {
    handleFuelAction(fuelType);
  }
};

window.openShopForFuel = function(fuelType) {
  if (typeof switchPage === 'function') switchPage('profile');
  setTimeout(() => {
    if (typeof switchProfileSubtab === 'function') switchProfileSubtab('shop');
    const fuelSec = document.getElementById('shopFuelSection');
    if (fuelSec) fuelSec.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
};

window.setFuelMode = function() {};

// Global Exports
window.startEnergyEngine = startEnergyEngine;
window.handleFuelAction = handleFuelAction;
window.useGreenFuel = useGreenFuel;
window.useDarkGreenFuel = useDarkGreenFuel;
window.useYellowFuel = useYellowFuel;
window.useOrangeFuel = useOrangeFuel;
window.useRedFuel = useRedFuel;
window.handlePinkAction = handlePinkAction;
window.handlePurpleAction = handlePurpleAction;
window.triggerGaugePulse = triggerGaugePulse;
window.updateEnergyUI = updateEnergyUI;
window.advanceEnergyGenerator = advanceEnergyGenerator;
window.setFuelMode = window.setFuelMode;
window.executeFuelButtonAction = window.executeFuelButtonAction;
window.processEnergyGeneratorOfflineCatchup = processEnergyGeneratorOfflineCatchup;

/* ==========================================================================
   SUNFLOWER SOLAR TYCOON - 20 LAND GARDEN INTEGRATION
   ========================================================================== */

const SF_STORAGE_KEY = 'ENERGY_TAP_SUNFLOWER_STATE_V1';

const SF_LAND_UNLOCK_COSTS = [
  0,      // Plot 1: Free
  10,     // Plot 2: 10 💎
  100,    // Plot 3: 100 💎
  250,    // Plot 4: 250 💎
  450,    // Plot 5: 450 💎
  750,    // Plot 6: 750 💎
  1200,   // Plot 7: 1200 💎
  1800,   // Plot 8: 1800 💎
  2600,   // Plot 9: 2600 💎
  3600,   // Plot 10: 3600 💎
  5000,   // Plot 11: 5000 💎
  7000,   // Plot 12: 7000 💎
  9500,   // Plot 13: 9500 💎
  12500,  // Plot 14: 12500 💎
  16500,  // Plot 15: 16500 💎
  21500,  // Plot 16: 21500 💎
  28000,  // Plot 17: 28000 💎
  36000,  // Plot 18: 36000 💎
  46000,  // Plot 19: 46000 💎
  60000   // Plot 20: 60000 💎
];

function createDefaultSfPlots() {
  const plots = [];
  for (let i = 1; i <= 20; i++) {
    const isUnlocked = i === 1; // Plot 1 starts unlocked
    plots.push({
      id: i,
      unlocked: isUnlocked,
      unlockCost: SF_LAND_UNLOCK_COSTS[i - 1],
      stage: isUnlocked ? 2 : 0, // Plot 1 starts with a blooming flower
      growthProgress: isUnlocked ? 100 : 0,
      lifeTimer: isUnlocked ? 55 : 0,
      maxLifeTimer: 60
    });
  }
  return plots;
}

function loadInitialSunflowerState() {
  try {
    const raw = localStorage.getItem(SF_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.plots) && parsed.plots.length === 20) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse saved Sunflower state:', e);
  }

  return {
    currentPage: 1,
    coins: 150,
    energy: 0,
    diamonds: 25,
    baskets: 2,
    shovels: 1,
    sproutDiamondCost: 1,
    cistern: {
      basketsInCrate: 0,
      maxCrateCapacity: 5,
      baseFillSeconds: 4.0,
      currentProgress: 0,
      boostTimerRemaining: 0
    },
    plots: createDefaultSfPlots()
  };
}

const sunflowerState = loadInitialSunflowerState();
window.sunflowerState = sunflowerState;

let sfSaveTimeout = null;
function saveSunflowerStateDebounced() {
  if (sfSaveTimeout) return;
  sfSaveTimeout = setTimeout(() => {
    sfSaveTimeout = null;
    try {
      localStorage.setItem(SF_STORAGE_KEY, JSON.stringify(sunflowerState));
    } catch (e) {}
  }, 1000);
}

// Web Audio API Synthesizer
const sunflowerAudio = {
  ctx: null,
  muted: false,
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  },
  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },
  playTone(freq, type = 'sine', duration = 0.12, gainLevel = 0.09) {
    if (this.muted) return;
    this.init(); this.resume();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainLevel, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration + 0.02);
    } catch (e) {}
  },
  playCoin() {
    if (this.muted) return;
    this.init(); this.resume();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.05);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.23);
    } catch (e) {}
  },
  playWaterSplash() {
    if (this.muted) return;
    this.init(); this.resume();
    if (!this.ctx) return;
    try {
      const bufferSize = this.ctx.sampleRate * 0.14;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(750, this.ctx.currentTime);
      filter.Q.setValueAtTime(2.0, this.ctx.currentTime);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start();
    } catch (e) {}
  },
  playDig() {
    if (this.muted) return;
    this.init(); this.resume();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(75, this.ctx.currentTime + 0.16);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.16);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch (e) {}
  },
  playUnlockChime() {
    if (this.muted) return;
    this.init(); this.resume();
    if (!this.ctx) return;
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, idx) => {
      setTimeout(() => {
        this.playTone(f, 'sine', 0.2, 0.1);
      }, idx * 60);
    });
  },
  playSolarChime() {
    if (this.muted) return;
    this.init(); this.resume();
    if (!this.ctx) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
      setTimeout(() => {
        this.playTone(f, 'sine', 0.2, 0.08);
      }, idx * 60);
    });
  }
};

function spawnSfFloat(text, x, y, color = 'text-amber-500') {
  const el = document.createElement('div');
  el.className = `floating-feedback ${color} text-xs sm:text-sm select-none`;
  el.innerHTML = text;
  el.style.left = `${x || window.innerWidth / 2}px`;
  el.style.top = `${y || window.innerHeight / 2}px`;
  document.body.appendChild(el);
  setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, 1100);
}

// Subview Switching on Energy Page
let currentEnergySubview = 'fuel'; // 'fuel' or 'sunflower'

window.switchEnergySubview = function(subview) {
  currentEnergySubview = subview;
  const fuelView = document.getElementById('energyFuelGeneratorView');
  const sfView = document.getElementById('energySunflowerFarmingView');
  const btnFuel = document.getElementById('subtabBtnFuelGenerator');
  const btnSf = document.getElementById('subtabBtnSunflowerFarm');

  if (subview === 'sunflower') {
    if (fuelView) fuelView.style.display = 'none';
    if (sfView) sfView.style.display = 'flex';
    if (btnFuel) btnFuel.classList.remove('active');
    if (btnSf) btnSf.classList.add('active');

    initSunflowerTycoonGame();
    renderSunflowerTycoon();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    if (fuelView) fuelView.style.display = 'block';
    if (sfView) sfView.style.display = 'none';
    if (btnFuel) btnFuel.classList.add('active');
    if (btnSf) btnSf.classList.remove('active');

    updateEnergyUI();
    updateSunflowerMiniStats();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

const sfPageBadges = {
  1: "Page 1: Garden 🌻",
  2: "Page 2: Wall Cistern 🧱",
  3: "Page 3: Solar & Diamond Shop ⚡💎"
};

window.navigateSunflowerPage = function(pageNum) {
  sunflowerState.currentPage = pageNum;
  sunflowerAudio.playTone(440, 'triangle', 0.08, 0.05);

  for (let i = 1; i <= 3; i++) {
    const pageEl = document.getElementById(`sfPage${i}`);
    if (pageEl) {
      if (i === pageNum) {
        pageEl.classList.add('active-page');
      } else {
        pageEl.classList.remove('active-page');
      }
    }

    const deskTab = document.getElementById(`sfDesktopTab${i}`);
    if (deskTab) {
      if (i === pageNum) {
        deskTab.className = "page-nav-btn flex-1 py-2 px-3 rounded-xl font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 bg-amber-500 text-white shadow";
      } else {
        deskTab.className = "page-nav-btn flex-1 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm text-stone-700 hover:bg-amber-200/70 transition flex items-center justify-center gap-2";
      }
    }

    const mobTab = document.getElementById(`sfMobileTab${i}`);
    if (mobTab) {
      const borderClass = i === 1 ? ' border-x border-amber-200' : '';
      if (i === pageNum) {
        mobTab.className = `flex flex-col items-center p-1 text-amber-600 font-black text-[10px] flex-1 relative${borderClass}`;
      } else {
        mobTab.className = `flex flex-col items-center p-1 text-stone-500 font-bold text-[10px] flex-1 relative${borderClass}`;
      }
    }
  }

  const badgeEl = document.getElementById('sfActivePageBadge');
  if (badgeEl) badgeEl.innerText = sfPageBadges[pageNum] || `Page ${pageNum}`;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

function getEmptyUnlockedSfPlot() {
  return sunflowerState.plots.find(p => p.unlocked && p.stage === 0);
}

// 100 Sunflower Coins -> 29 Solar Energy Conversion
function executeSfCoinToEnergy(batches = 1, event = null) {
  const cost = batches * 100;
  const energyGain = batches * 29;

  if (sunflowerState.coins >= cost) {
    sunflowerState.coins -= cost;
    sunflowerState.energy += energyGain;

    // Direct Synergy: Also charge player's main reactor energy!
    if (typeof gameState !== 'undefined' && gameState.reactor) {
      const maxE = gameState.reactor.maxEnergy || 1000;
      gameState.reactor.currentEnergy = Math.min(maxE, (gameState.reactor.currentEnergy || 0) + energyGain);
      if (typeof updateEnergyUI === 'function') updateEnergyUI();
    }

    sunflowerAudio.playSolarChime();
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnSfFloat(`-${cost}🪙 &rarr; +${energyGain}⚡ Solar Energy!`, posX, posY, 'text-yellow-600');
    saveSunflowerStateDebounced();
    renderSunflowerTycoon();
  } else {
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnSfFloat('Need at least 100 Coins (🪙)!', posX, posY, 'text-red-500');
  }
}

// Unlock Land Plot Function
window.unlockSfPlot = function(plotId, event = null) {
  const plot = sunflowerState.plots.find(p => p.id === plotId);
  if (!plot || plot.unlocked) return;

  const cost = plot.unlockCost;
  if (sunflowerState.diamonds >= cost) {
    sunflowerState.diamonds -= cost;
    plot.unlocked = true;
    plot.stage = 0; // Empty, ready to plant
    plot.growthProgress = 0;
    plot.lifeTimer = 0;

    sunflowerAudio.playUnlockChime();
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnSfFloat(`🎉 Land #${plot.id} Unlocked (-${cost} 💎)!`, posX, posY, 'text-emerald-500');
    saveSunflowerStateDebounced();
    renderSunflowerTycoon();
  } else {
    const posX = event ? event.clientX : window.innerWidth / 2;
    const posY = event ? event.clientY : window.innerHeight / 2;
    spawnSfFloat(`Need ${cost} 💎 to unlock Land #${plot.id}!`, posX, posY, 'text-red-500');
  }
};

window.waterSfPlot = function(plotId, event = null) {
  const plot = sunflowerState.plots.find(p => p.id === plotId);
  if (!plot || !plot.unlocked) return;

  if (sunflowerState.baskets <= 0) {
    if (event) spawnSfFloat('No Water Baskets! Visit Page 2 Wall Cistern 🧱', event.clientX, event.clientY, 'text-red-500');
    return;
  }

  if (plot.stage === 2) {
    sunflowerState.baskets -= 1;
    plot.lifeTimer = Math.min(120, plot.lifeTimer + 35);
    plot.maxLifeTimer = Math.max(plot.maxLifeTimer, plot.lifeTimer);
    sunflowerAudio.playWaterSplash();
    if (event) spawnSfFloat('+35s Coin Life Added! 💧', event.clientX, event.clientY, 'text-blue-500');
    saveSunflowerStateDebounced();
    renderSunflowerTycoon();
  } else if (plot.stage === 1) {
    sunflowerState.baskets -= 1;
    plot.growthProgress = Math.min(100, plot.growthProgress + 35);
    sunflowerAudio.playWaterSplash();
    if (event) spawnSfFloat('Sprout Accelerated! 💧', event.clientX, event.clientY, 'text-blue-500');
    saveSunflowerStateDebounced();
    renderSunflowerTycoon();
  }
};

window.shovelSfPlot = function(plotId, event = null) {
  const plot = sunflowerState.plots.find(p => p.id === plotId);
  if (!plot || !plot.unlocked || plot.stage !== 3) return;

  if (sunflowerState.shovels > 0) {
    sunflowerState.shovels -= 1;
    plot.stage = 0;
    plot.growthProgress = 0;
    plot.lifeTimer = 0;
    sunflowerAudio.playDig();
    if (event) spawnSfFloat(`Withered Plant Cleared from Land #${plot.id}! Plot Ready 🌱`, event.clientX, event.clientY, 'text-amber-800');
    saveSunflowerStateDebounced();
    renderSunflowerTycoon();
  } else {
    if (event) spawnSfFloat('Need 🪏 Shovel! Buy on Page 3 or Watch Ad', event.clientX, event.clientY, 'text-red-500');
  }
};

window.handleSfPlotAction = function(plotId, event) {
  const plot = sunflowerState.plots.find(p => p.id === plotId);
  if (!plot) return;

  if (!plot.unlocked) {
    window.unlockSfPlot(plotId, event);
  } else if (plot.stage === 0) {
    const buySproutBtn = document.getElementById('sfBuySproutDiamondBtn');
    if (buySproutBtn) buySproutBtn.click();
  } else if (plot.stage === 1 || plot.stage === 2) {
    window.waterSfPlot(plotId, event);
  } else if (plot.stage === 3) {
    window.shovelSfPlot(plotId, event);
  }
};

// Ad Campaigns simulation
const SF_AD_CAMPAIGNS = [
  {
    brand: "SolarSprout Botanics",
    headline: "Instant Super-Growth Mist",
    pitch: "Watch seedlings flourish into towering, sun-absorbing marvels in record time!",
    emoji: "🌻"
  },
  {
    brand: "HydroWall Systems",
    headline: "High-Pressure Mountain Aqueduct",
    pitch: "Streamlined stone pumps delivering gallons directly into your garden beds.",
    emoji: "💧"
  },
  {
    brand: "MasterSmith Tools",
    headline: "Tempered Hardwood Shovels",
    pitch: "Clear expired stalks and stubborn roots effortlessly with clean soil prep.",
    emoji: "🪏"
  }
];

let activeSfAdReward = null;
let sfAdCountdownTimer = null;

window.openSfAdWatchModal = function(rewardType) {
  activeSfAdReward = rewardType;
  const campaign = SF_AD_CAMPAIGNS[Math.floor(Math.random() * SF_AD_CAMPAIGNS.length)];

  const brandEl = document.getElementById('sfAdBrandName');
  const headEl = document.getElementById('sfAdHeadline');
  const pitchEl = document.getElementById('sfAdCatchphrase');
  const emojiEl = document.getElementById('sfAdGraphicEmoji');
  const tagEl = document.getElementById('sfAdRewardTag');
  const timerBadge = document.getElementById('sfAdTimerBadge');
  const progBar = document.getElementById('sfAdProgressBar');
  const claimBtn = document.getElementById('sfAdClaimBtn');
  const modal = document.getElementById('sfAdReelModal');

  if (brandEl) brandEl.innerText = campaign.brand;
  if (headEl) headEl.innerText = campaign.headline;
  if (pitchEl) pitchEl.innerText = `"${campaign.pitch}"`;
  if (emojiEl) emojiEl.innerText = campaign.emoji;

  if (tagEl) {
    tagEl.innerText = rewardType === 'sprout' ? "1 Free Sprout 🌱" : "1 Free Shovel 🪏";
  }

  let secondsLeft = 5;
  if (timerBadge) timerBadge.innerText = `⏳ ${secondsLeft}s`;
  if (progBar) progBar.style.width = '0%';
  if (claimBtn) {
    claimBtn.disabled = true;
    claimBtn.className = "bg-stone-700 text-stone-500 font-bold text-xs px-3.5 py-1.5 rounded-xl cursor-not-allowed transition";
    claimBtn.innerText = "Watching...";
  }

  if (modal) modal.classList.remove('hidden');

  clearInterval(sfAdCountdownTimer);
  const startMs = Date.now();
  const totalMs = secondsLeft * 1000;

  sfAdCountdownTimer = setInterval(() => {
    const elapsed = Date.now() - startMs;
    const pct = Math.min(100, (elapsed / totalMs) * 100);
    if (progBar) progBar.style.width = `${pct}%`;

    const rem = Math.max(0, Math.ceil((totalMs - elapsed) / 1000));
    if (timerBadge) timerBadge.innerText = `⏳ ${rem}s`;

    if (elapsed >= totalMs) {
      clearInterval(sfAdCountdownTimer);
      if (timerBadge) timerBadge.innerText = "Completed! ✅";
      if (claimBtn) {
        claimBtn.disabled = false;
        claimBtn.className = "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 active:scale-95 text-white font-black text-xs px-4 py-2 rounded-xl shadow cursor-pointer animate-pulse";
        claimBtn.innerText = "Claim Free Reward! 🎉";
      }
    }
  }, 75);
};

// Render 20 Land Plots
function renderSfPlots() {
  const container = document.getElementById('sfPlotsContainer');
  if (!container) return;
  container.innerHTML = '';

  sunflowerState.plots.forEach(plot => {
    const card = document.createElement('div');
    card.id = `sf-plot-card-${plot.id}`;

    if (!plot.unlocked) {
      card.className = "locked-bed rounded-2xl p-3 flex flex-col items-center justify-between min-h-[160px] relative text-white border-2 border-slate-700/80 shadow-md";
      card.innerHTML = `
        <div class="w-full flex items-center justify-between">
          <span class="text-[10px] text-slate-400 font-bold">Land #${plot.id}</span>
          <span class="text-[9px] bg-red-950/80 text-red-300 font-bold px-1.5 py-0.5 rounded-full border border-red-800">Locked 🔒</span>
        </div>
        <div class="my-1 text-center">
          <div class="text-3xl filter grayscale opacity-75">🪵</div>
          <div class="text-[11px] font-black text-amber-300 mt-1">${plot.unlockCost} 💎</div>
        </div>
        <button onclick="unlockSfPlot(${plot.id}, event)" class="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-stone-900 font-black text-[10px] py-1.5 rounded-xl shadow active:scale-95 transition flex items-center justify-center gap-1">
          <span>Unlock 🔓</span>
        </button>
      `;
    } else {
      card.className = "dirt-bed rounded-2xl p-3 flex flex-col items-center justify-between min-h-[160px] relative text-white transition-all border border-amber-900/40 shadow";

      let emoji = '';
      let badge = '';
      let actionBtn = '';
      let progressHtml = '';

      if (plot.stage === 0) {
        emoji = '<span class="text-3xl opacity-20">🕳️</span>';
        badge = '<span class="text-[9px] bg-stone-800/80 text-stone-300 px-1.5 py-0.5 rounded-full font-mono">Empty Bed</span>';
        actionBtn = `
          <button onclick="document.getElementById('sfBuySproutDiamondBtn')?.click()" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-2.5 py-1 rounded-xl shadow active:scale-95 transition">
            Plant Sprout 🌱
          </button>
        `;
        progressHtml = '<div class="h-2"></div>';
      } else if (plot.stage === 1) {
        emoji = '<span class="text-3xl sm:text-4xl animate-bounce-gentle filter drop-shadow">🌱</span>';
        badge = '<span class="text-[9px] bg-green-900/90 text-green-200 px-1.5 py-0.5 rounded-full font-mono">Growing</span>';
        actionBtn = `
          <button onclick="waterSfPlot(${plot.id}, event)" class="bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] px-2 py-1 rounded-lg shadow active:scale-95 transition">
            🧺 Pour Water
          </button>
        `;
        progressHtml = `
          <div class="w-full">
            <div class="flex justify-between text-[9px] text-green-200 mb-0.5">
              <span id="sf-plot-timer-${plot.id}">🌱 Growing ${Math.floor(plot.growthProgress)}%</span>
            </div>
            <div class="w-full bg-black/50 rounded-full h-1.5 overflow-hidden">
              <div id="sf-plot-bar-${plot.id}" class="bg-emerald-400 h-full transition-all" style="width: ${plot.growthProgress}%"></div>
            </div>
          </div>
        `;
      } else if (plot.stage === 2) {
        emoji = '<span class="text-4xl sm:text-5xl filter drop-shadow hover:scale-105 transition-transform animate-pulse">🌻</span>';
        badge = '<span class="text-[9px] bg-amber-400 text-amber-950 font-black px-1.5 py-0.5 rounded-full shadow-sm">+2☀️/s</span>';
        actionBtn = `
          <div class="flex items-center gap-1">
            <button onclick="waterSfPlot(${plot.id}, event)" class="bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[9px] px-2 py-1 rounded-lg shadow active:scale-95 transition" title="Add +35s life">
              🧺 +35s
            </button>
            <button onclick="navigateSunflowerPage(3)" class="bg-amber-400 hover:bg-amber-300 text-stone-900 font-black text-[9px] px-2 py-1 rounded-lg shadow active:scale-95 transition" title="Convert to Solar Energy">
              ⚡ Shop
            </button>
          </div>
        `;
        const rem = Math.max(0, Math.ceil(plot.lifeTimer));
        const pct = Math.max(0, Math.min(100, (plot.lifeTimer / (plot.maxLifeTimer || 60)) * 100));
        progressHtml = `
          <div class="w-full">
            <div class="flex justify-between text-[9px] text-yellow-200 mb-0.5">
              <span id="sf-plot-timer-${plot.id}">⏳ ${rem}s left (+2☀️/s)</span>
            </div>
            <div class="w-full bg-black/50 rounded-full h-1.5 overflow-hidden">
              <div id="sf-plot-bar-${plot.id}" class="bg-gradient-to-r from-amber-400 to-yellow-300 h-full transition-all" style="width: ${pct}%"></div>
            </div>
          </div>
        `;
      } else if (plot.stage === 3) {
        emoji = '<span class="text-3xl sm:text-4xl filter grayscale contrast-125">🥀</span>';
        badge = '<span class="text-[9px] bg-red-800 text-red-100 font-bold px-1.5 py-0.5 rounded-full">Withered!</span>';
        actionBtn = `
          <button onclick="shovelSfPlot(${plot.id}, event)" class="bg-amber-700 hover:bg-amber-600 text-white font-black text-[9px] px-2 py-1 rounded-lg shadow active:scale-95 transition flex items-center gap-1">
            <span>🪏 Dig</span>
          </button>
        `;
        progressHtml = `
          <div class="text-[9px] text-red-300 font-medium text-center">
            Water depleted!
          </div>
        `;
      }

      card.innerHTML = `
        <div class="w-full flex items-center justify-between">
          <span class="text-[10px] text-stone-400 font-bold">Land #${plot.id}</span>
          ${badge}
        </div>
        <div class="my-1 cursor-pointer" onclick="handleSfPlotAction(${plot.id}, event)">
          ${emoji}
        </div>
        <div class="w-full flex flex-col gap-1 items-center">
          ${progressHtml}
          <div class="mt-1">${actionBtn}</div>
        </div>
      `;
    }

    container.appendChild(card);
  });
}

function updateSunflowerMiniStats() {
  const plotsUnlocked = sunflowerState.plots.filter(p => p.unlocked).length;
  const entryUnlocked = document.getElementById('sfEntryPlotsUnlocked');
  const entryBaskets = document.getElementById('sfEntryBaskets');
  const navBadge = document.getElementById('sfNavLiveBadge');

  if (entryUnlocked) entryUnlocked.innerText = plotsUnlocked;
  if (entryBaskets) entryBaskets.innerText = sunflowerState.baskets;
  if (navBadge) navBadge.innerText = `${plotsUnlocked}/20 Lands`;
}

function updateSfFastDisplays() {
  const setTxt = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.innerText = val;
  };

  setTxt('sfCoinCount', Math.floor(sunflowerState.coins));
  setTxt('sfEnergyCount', Math.floor(sunflowerState.energy));
  setTxt('sfDiamondCount', sunflowerState.diamonds);
  setTxt('sfBasketCount', sunflowerState.baskets);
  setTxt('sfShovelCount', sunflowerState.shovels);
  setTxt('sfVaultDiamondCount', `${sunflowerState.diamonds} 💎`);
  setTxt('sfCisternInvBaskets', `${sunflowerState.baskets} 🧺`);

  setTxt('sfShopCoinsDisplay', `${Math.floor(sunflowerState.coins)} 🪙`);
  const batches = Math.floor(sunflowerState.coins / 100);
  setTxt('sfConvertibleBatchesDisplay', `${batches} ${batches === 1 ? 'Batch' : 'Batches'} (${batches * 29} ⚡)`);
  setTxt('sfShopEnergyDisplay', `${Math.floor(sunflowerState.energy)} ⚡`);

  const unlockedCount = sunflowerState.plots.filter(p => p.unlocked).length;
  setTxt('sfUnlockedPlotsCounter', unlockedCount);
  setTxt('sfMobileUnlockedCount', unlockedCount);
  setTxt('sfLandSummaryLabel', `${unlockedCount} of 20 Lands Unlocked`);

  const nextLocked = sunflowerState.plots.find(p => !p.unlocked);
  const nextBadge = document.getElementById('sfNextLandCostBadge');
  if (nextBadge) {
    nextBadge.innerText = nextLocked ? `Land #${nextLocked.id}: ${nextLocked.unlockCost} 💎` : "All 20 Lands Maxed! 🏆";
  }

  updateSunflowerMiniStats();

  // Fast plot timer/bar update if viewing Page 1
  if (currentEnergySubview === 'sunflower' && sunflowerState.currentPage === 1) {
    sunflowerState.plots.forEach(plot => {
      if (!plot.unlocked) return;
      const timerEl = document.getElementById(`sf-plot-timer-${plot.id}`);
      const barEl = document.getElementById(`sf-plot-bar-${plot.id}`);
      if (timerEl && barEl) {
        if (plot.stage === 2) {
          const rem = Math.max(0, Math.ceil(plot.lifeTimer));
          timerEl.innerText = `⏳ ${rem}s left (+2☀️/s)`;
          const pct = Math.max(0, Math.min(100, (plot.lifeTimer / (plot.maxLifeTimer || 60)) * 100));
          barEl.style.width = `${pct}%`;
        } else if (plot.stage === 1) {
          timerEl.innerText = `🌱 Growing ${Math.floor(plot.growthProgress)}%`;
          barEl.style.width = `${plot.growthProgress}%`;
        }
      }
    });
  }
}

function renderSunflowerTycoon() {
  const badgeSprout = document.getElementById('sfCurrentSproutPriceBadge');
  const btnSproutPrice = document.getElementById('sfBtnSproutDiamondPrice');
  if (badgeSprout) badgeSprout.innerText = `${sunflowerState.sproutDiamondCost} 💎`;
  if (btnSproutPrice) btnSproutPrice.innerText = sunflowerState.sproutDiamondCost;

  updateSfFastDisplays();
  renderSfPlots();
}

let isSunflowerTycoonInit = false;
let sfLastTime = performance.now();
let sfCoinSecondAccumulator = 0;
let sfRafRunning = false;

function sunflowerGameLoop(now) {
  const deltaSec = Math.min(0.2, (now - sfLastTime) / 1000);
  sfLastTime = now;

  // 1. Page 2 Wall Cistern Worker Simulation
  if (sunflowerState.cistern.boostTimerRemaining > 0) {
    sunflowerState.cistern.boostTimerRemaining = Math.max(0, sunflowerState.cistern.boostTimerRemaining - deltaSec);
    const boostBadge = document.getElementById('sfBoostActiveBadge');
    const boostTime = document.getElementById('sfBoostTimeRemaining');
    const speedLbl = document.getElementById('sfWorkerSpeedLabel');
    if (boostBadge) boostBadge.classList.remove('hidden');
    if (boostTime) boostTime.innerText = Math.ceil(sunflowerState.cistern.boostTimerRemaining);
    if (speedLbl) speedLbl.innerText = "1 basket / 2s (2x Overdrive!)";
  } else {
    const boostBadge = document.getElementById('sfBoostActiveBadge');
    const speedLbl = document.getElementById('sfWorkerSpeedLabel');
    if (boostBadge) boostBadge.classList.add('hidden');
    if (speedLbl) speedLbl.innerText = "1 basket / 4s";
  }

  const currentFillRate = sunflowerState.cistern.boostTimerRemaining > 0 ? 2.0 : 4.0;
  const statusEl = document.getElementById('sfWorkerStatusText');

  if (sunflowerState.cistern.basketsInCrate < sunflowerState.cistern.maxCrateCapacity) {
    sunflowerState.cistern.currentProgress += deltaSec;
    if (sunflowerState.cistern.currentProgress >= currentFillRate) {
      sunflowerState.cistern.currentProgress = 0;
      sunflowerState.cistern.basketsInCrate += 1;
    }
    if (statusEl) statusEl.innerText = "Pumping water into crate...";
  } else {
    sunflowerState.cistern.currentProgress = 0;
    if (statusEl) statusEl.innerText = "Wall crate full (5/5 🧺)! Collect now.";
  }

  const workerPct = sunflowerState.cistern.basketsInCrate >= sunflowerState.cistern.maxCrateCapacity
    ? 100
    : Math.floor((sunflowerState.cistern.currentProgress / currentFillRate) * 100);

  const progBar = document.getElementById('sfWorkerProgressBar');
  const pctLbl = document.getElementById('sfWorkerCyclePercent');
  const crateCnt = document.getElementById('sfWallCrateCounter');
  const collBadge = document.getElementById('sfCollectableBadge');
  const deskNavBadge = document.getElementById('sfDesktopNavCrateBadge');
  const mobNavBadge = document.getElementById('sfMobileNavCrateBadge');
  const cisternCrate = document.getElementById('sfCisternCrateBaskets');

  if (progBar) progBar.style.width = `${workerPct}%`;
  if (pctLbl) pctLbl.innerText = `${workerPct}%`;
  if (crateCnt) crateCnt.innerText = sunflowerState.cistern.basketsInCrate;
  if (collBadge) collBadge.innerText = sunflowerState.cistern.basketsInCrate;
  if (deskNavBadge) deskNavBadge.innerText = sunflowerState.cistern.basketsInCrate;
  if (mobNavBadge) mobNavBadge.innerText = sunflowerState.cistern.basketsInCrate;
  if (cisternCrate) cisternCrate.innerText = `${sunflowerState.cistern.basketsInCrate} / 5 🧺`;

  // 2. Sunflower Growth & Continuous Per-Second Solar Coin Generation (+2 ☀️/s)
  sfCoinSecondAccumulator += deltaSec;
  const tickCoins = sfCoinSecondAccumulator >= 1.0;
  if (tickCoins) {
    sfCoinSecondAccumulator = 0;
  }

  let plotStateChanged = false;

  sunflowerState.plots.forEach(plot => {
    if (!plot.unlocked) return;

    if (plot.stage === 1) { // Sprout growing
      plot.growthProgress += 20 * deltaSec;
      if (plot.growthProgress >= 100) {
        plot.stage = 2; // Bloomed
        plot.growthProgress = 100;
        plot.lifeTimer = 50;
        plot.maxLifeTimer = 50;
        plotStateChanged = true;
        sunflowerAudio.playTone(523.25, 'triangle', 0.15, 0.1);
      }
    } else if (plot.stage === 2) { // Blooming sunflower emitting coins
      plot.lifeTimer -= deltaSec;

      if (tickCoins) {
        sunflowerState.coins += 2;
        // Float occasionally if viewing Page 1
        if (currentEnergySubview === 'sunflower' && sunflowerState.currentPage === 1 && Math.random() < 0.25) {
          const card = document.getElementById(`sf-plot-card-${plot.id}`);
          if (card) {
            const rect = card.getBoundingClientRect();
            spawnSfFloat('+2 ☀️🪙', rect.left + rect.width / 2, rect.top + 10, 'text-yellow-500');
          }
        }
      }

      if (plot.lifeTimer <= 0) {
        plot.stage = 3; // Withered
        plot.lifeTimer = 0;
        plotStateChanged = true;
        sunflowerAudio.playTone(175, 'sawtooth', 0.25, 0.15);
      }
    }
  });

  if (plotStateChanged && currentEnergySubview === 'sunflower') {
    renderSfPlots();
    saveSunflowerStateDebounced();
  }

  updateSfFastDisplays();
  requestAnimationFrame(sunflowerGameLoop);
}

function initSunflowerTycoonGame() {
  if (isSunflowerTycoonInit) return;
  isSunflowerTycoonInit = true;

  // Collect Baskets from Cistern Crate
  const collectBtn = document.getElementById('sfCollectBasketsBtn');
  if (collectBtn) {
    collectBtn.addEventListener('click', (e) => {
      if (sunflowerState.cistern.basketsInCrate > 0) {
        const count = sunflowerState.cistern.basketsInCrate;
        sunflowerState.baskets += count;
        sunflowerState.cistern.basketsInCrate = 0;
        sunflowerAudio.playWaterSplash();
        spawnSfFloat(`+${count} Water Baskets 🧺!`, e.clientX, e.clientY, 'text-blue-500');
        saveSunflowerStateDebounced();
        renderSunflowerTycoon();
      } else {
        spawnSfFloat('Worker still pumping water...', e.clientX, e.clientY, 'text-stone-400');
      }
    });
  }

  // Convert 100 / All Coins
  const conv100 = document.getElementById('sfConvert100Btn');
  if (conv100) {
    conv100.addEventListener('click', (e) => executeSfCoinToEnergy(1, e));
  }

  const convAll = document.getElementById('sfConvertAllBtn');
  if (convAll) {
    convAll.addEventListener('click', (e) => {
      const batches = Math.floor(sunflowerState.coins / 100);
      if (batches >= 1) {
        executeSfCoinToEnergy(batches, e);
      } else {
        spawnSfFloat('Not enough coins for 1 batch (100 required)!', e.clientX, e.clientY, 'text-stone-400');
      }
    });
  }

  // Buy Sprout (+1 💎 Escalation)
  const buySproutBtn = document.getElementById('sfBuySproutDiamondBtn');
  if (buySproutBtn) {
    buySproutBtn.addEventListener('click', (e) => {
      const emptyPlot = getEmptyUnlockedSfPlot();
      if (!emptyPlot) {
        spawnSfFloat('No empty unlocked plot on Page 1! Unlock more land.', e.clientX, e.clientY, 'text-red-500');
        return;
      }

      if (sunflowerState.diamonds >= sunflowerState.sproutDiamondCost) {
        sunflowerState.diamonds -= sunflowerState.sproutDiamondCost;
        const paidPrice = sunflowerState.sproutDiamondCost;
        sunflowerState.sproutDiamondCost += 1;

        emptyPlot.stage = 1;
        emptyPlot.growthProgress = 0;
        emptyPlot.lifeTimer = 50;

        sunflowerAudio.playTone(650, 'sine', 0.18, 0.15);
        spawnSfFloat(`🌱 Sprout Planted in Land #${emptyPlot.id} (-${paidPrice} 💎)!`, e.clientX, e.clientY, 'text-emerald-600');
        saveSunflowerStateDebounced();
        renderSunflowerTycoon();
      } else {
        spawnSfFloat(`Need ${sunflowerState.sproutDiamondCost} Diamonds! 💎`, e.clientX, e.clientY, 'text-red-500');
      }
    });
  }

  // Buy Shovel (10 💎)
  const buyShovelBtn = document.getElementById('sfBuyShovelDiamondBtn');
  if (buyShovelBtn) {
    buyShovelBtn.addEventListener('click', (e) => {
      if (sunflowerState.diamonds >= 10) {
        sunflowerState.diamonds -= 10;
        sunflowerState.shovels += 1;
        sunflowerAudio.playTone(850, 'triangle', 0.2, 0.15);
        spawnSfFloat('+1 Shovel 🪏 (-10 💎)', e.clientX, e.clientY, 'text-stone-800');
        saveSunflowerStateDebounced();
        renderSunflowerTycoon();
      } else {
        spawnSfFloat('Need 10 Diamonds for Shovel! 💎', e.clientX, e.clientY, 'text-red-500');
      }
    });
  }

  // Buy Water Basket (2 💎)
  const buyBasketBtn = document.getElementById('sfBuyBasketDiamondBtn');
  if (buyBasketBtn) {
    buyBasketBtn.addEventListener('click', (e) => {
      if (sunflowerState.diamonds >= 2) {
        sunflowerState.diamonds -= 2;
        sunflowerState.baskets += 1;
        sunflowerAudio.playWaterSplash();
        spawnSfFloat('+1 Water Basket 🧺 (-2 💎)', e.clientX, e.clientY, 'text-blue-600');
        saveSunflowerStateDebounced();
        renderSunflowerTycoon();
      } else {
        spawnSfFloat('Need 2 Diamonds for Basket! 💎', e.clientX, e.clientY, 'text-red-500');
      }
    });
  }

  // Buy Coins (5 💎 for 250 Coins)
  const buyCoinsBtn = document.getElementById('sfBuyCoinsDiamondBtn');
  if (buyCoinsBtn) {
    buyCoinsBtn.addEventListener('click', (e) => {
      if (sunflowerState.diamonds >= 5) {
        sunflowerState.diamonds -= 5;
        sunflowerState.coins += 250;
        sunflowerAudio.playCoin();
        spawnSfFloat('+250 Coins 🪙 (-5 💎)', e.clientX, e.clientY, 'text-amber-600');
        saveSunflowerStateDebounced();
        renderSunflowerTycoon();
      } else {
        spawnSfFloat('Need 5 Diamonds for Coins! 💎', e.clientX, e.clientY, 'text-red-500');
      }
    });
  }

  // Worker Speed Boost (8 💎 for 2x pump speed for 60s)
  const buyBoostBtn = document.getElementById('sfBuyWorkerBoostDiamondBtn');
  if (buyBoostBtn) {
    buyBoostBtn.addEventListener('click', (e) => {
      if (sunflowerState.diamonds >= 8) {
        sunflowerState.diamonds -= 8;
        sunflowerState.cistern.boostTimerRemaining = Math.max(sunflowerState.cistern.boostTimerRemaining, 0) + 60;
        sunflowerAudio.playSolarChime();
        spawnSfFloat('⚡ 2x Worker Speed Activated (-8 💎)!', e.clientX, e.clientY, 'text-cyan-500');
        saveSunflowerStateDebounced();
        renderSunflowerTycoon();
      } else {
        spawnSfFloat('Need 8 Diamonds for Speed Boost! 💎', e.clientX, e.clientY, 'text-red-500');
      }
    });
  }

  // Water All & Clear All Withered
  const waterAll = document.getElementById('sfWaterAllBtn');
  if (waterAll) {
    waterAll.addEventListener('click', (e) => {
      let count = 0;
      sunflowerState.plots.forEach(p => {
        if (p.unlocked && p.stage === 2 && sunflowerState.baskets > 0) {
          sunflowerState.baskets -= 1;
          p.lifeTimer = Math.min(120, p.lifeTimer + 35);
          count++;
        }
      });
      if (count > 0) {
        sunflowerAudio.playWaterSplash();
        spawnSfFloat(`Watered ${count} Sunflowers! 🧺`, e.clientX, e.clientY, 'text-blue-500');
        saveSunflowerStateDebounced();
        renderSunflowerTycoon();
      } else {
        spawnSfFloat('No active sunflowers or no water baskets!', e.clientX, e.clientY, 'text-stone-400');
      }
    });
  }

  const clearAll = document.getElementById('sfClearAllWitheredBtn');
  if (clearAll) {
    clearAll.addEventListener('click', (e) => {
      let cleared = 0;
      sunflowerState.plots.forEach(p => {
        if (p.unlocked && p.stage === 3 && sunflowerState.shovels > 0) {
          sunflowerState.shovels -= 1;
          p.stage = 0;
          p.growthProgress = 0;
          p.lifeTimer = 0;
          cleared++;
        }
      });
      if (cleared > 0) {
        sunflowerAudio.playDig();
        spawnSfFloat(`Cleared ${cleared} withered plots! 🪏`, e.clientX, e.clientY, 'text-amber-800');
        saveSunflowerStateDebounced();
        renderSunflowerTycoon();
      } else {
        spawnSfFloat('No withered flowers or no shovels!', e.clientX, e.clientY, 'text-stone-400');
      }
    });
  }

  // Ad Claim Listener
  const claimBtn = document.getElementById('sfAdClaimBtn');
  const adModal = document.getElementById('sfAdReelModal');
  if (claimBtn) {
    claimBtn.addEventListener('click', () => {
      if (activeSfAdReward === 'sprout') {
        const empty = getEmptyUnlockedSfPlot();
        if (empty) {
          empty.stage = 1;
          empty.growthProgress = 0;
          empty.lifeTimer = 50;
          sunflowerAudio.playTone(720, 'sine', 0.2, 0.2);
          spawnSfFloat(`🎁 1 Free Sprout Planted in Land #${empty.id}! 🌱`, window.innerWidth / 2, window.innerHeight / 2, 'text-emerald-500');
        } else {
          sunflowerState.diamonds += 1;
          spawnSfFloat('All unlocked plots occupied! +1 💎 Compensated!', window.innerWidth / 2, window.innerHeight / 2, 'text-cyan-500');
        }
      } else if (activeSfAdReward === 'shovel') {
        sunflowerState.shovels += 1;
        sunflowerAudio.playTone(880, 'sine', 0.2, 0.2);
        spawnSfFloat('🎁 1 Free Shovel 🪏 Claimed!', window.innerWidth / 2, window.innerHeight / 2, 'text-stone-800');
      }
      saveSunflowerStateDebounced();
      renderSunflowerTycoon();
      if (adModal) adModal.classList.add('hidden');
      activeSfAdReward = null;
    });
  }

  // Sound & Guide Listeners
  const soundBtn = document.getElementById('sfSoundBtn');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      sunflowerAudio.muted = !sunflowerAudio.muted;
      soundBtn.innerText = sunflowerAudio.muted ? '🔇' : '🔊';
    });
  }

  const guideBtn = document.getElementById('sfGuideBtn');
  const rulesModal = document.getElementById('sfRulesModal');
  const closeRules1 = document.getElementById('sfCloseRulesBtn');
  const closeRules2 = document.getElementById('sfCloseRulesBtn2');

  if (guideBtn && rulesModal) guideBtn.addEventListener('click', () => rulesModal.classList.remove('hidden'));
  if (closeRules1 && rulesModal) closeRules1.addEventListener('click', () => rulesModal.classList.add('hidden'));
  if (closeRules2 && rulesModal) closeRules2.addEventListener('click', () => rulesModal.classList.add('hidden'));

  // Start simulation loop
  if (!sfRafRunning) {
    sfRafRunning = true;
    sfLastTime = performance.now();
    requestAnimationFrame(sunflowerGameLoop);
  }
}

// Global Exports for Sunflower Tycoon
window.initSunflowerTycoonGame = initSunflowerTycoonGame;
window.renderSunflowerTycoon = renderSunflowerTycoon;
window.executeSfCoinToEnergy = executeSfCoinToEnergy;
window.updateSunflowerMiniStats = updateSunflowerMiniStats;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    updateSunflowerMiniStats();
    if (document.getElementById('energySunflowerFarmingView')) {
      initSunflowerTycoonGame();
    }
  });
} else {
  updateSunflowerMiniStats();
  if (document.getElementById('energySunflowerFarmingView')) {
    initSunflowerTycoonGame();
  }
}

