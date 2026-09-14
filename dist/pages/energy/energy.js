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

    let speedMult = 1;
    if (pinkActive > 0) speedMult *= 2;
    if (purpleActive > 0) speedMult *= 5;

    // Fast-path: if no fuel and no active boosts, just fast-forward cooldowns
    if (fuelSecs <= 0 && pinkActive <= 0 && purpleActive <= 0) {
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
    if (fuelSecs > 0) {
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
    if (gameState.energyGenerator.remainingSeconds > 0) {
      const fuelToConsume = Math.min(gameState.energyGenerator.remainingSeconds, step * speedMult);
      gameState.energyGenerator.remainingSeconds -= fuelToConsume;
      totalFuelSecondsConsumed += fuelToConsume;

      const rate = (gameState.energyGenerator.ratePerSec !== undefined)
        ? gameState.energyGenerator.ratePerSec
        : (gameState.energyGenerator.ratePerMin || 0.01);
      const epGain = rate * fuelToConsume;
      totalEpGained += epGain;

      gameState.reactor.currentEnergy = (gameState.reactor.currentEnergy || 0) + epGain;
      gameState.energyGenerator.epTotal = (gameState.energyGenerator.epTotal || 0) + epGain;
    }

    remainingSecs -= step;
  }

  gameState.energyGenerator.isActive = (gameState.energyGenerator.remainingSeconds > 0);
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

    gameState.energyGenerator.isActive = (gameState.energyGenerator.remainingSeconds > 0);
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
      gameState.energyGenerator.ratePerSec = gameState.energyGenerator.ratePerMin || 0.01;
    }
    gameState.energyGenerator.ratePerSec = +(gameState.energyGenerator.ratePerSec + 0.01).toFixed(2);
    gameState.energyGenerator.ratePerMin = gameState.energyGenerator.ratePerSec;
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`🔥 Red Fuel activated: +0.01 EP/Sec Rate increased! (Current: +${gameState.energyGenerator.ratePerSec}/s)`);
    }
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
  // Track current toggle mode per fuel type: 'use' or 'buy'
  if (!window.fuelModes) {
    window.fuelModes = {
      green: 'use',
      darkgreen: 'use',
      yellow: 'use',
      orange: 'use',
      red: 'use',
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

  // Standard Fuel Cells (Direct Action Button: Use when > 0, Disabled when 0)
  const standardFuels = [
    { type: 'green', btnId: 'btnUseGreenFuel', textId: 'btnGreenText', defaultColor: 'green-btn', label: '⚡ Use Fuel (+5m)' },
    { type: 'darkgreen', btnId: 'btnUseDarkGreenFuel', textId: 'btnDarkGreenText', defaultColor: 'darkgreen-btn', label: '⚡ Use Fuel (+1m)' },
    { type: 'yellow', btnId: 'btnYellowAd', textId: 'btnYellowText', defaultColor: 'yellow-btn', label: '⚡ Use Fuel (+15m)' },
    { type: 'orange', btnId: 'btnOrangeAd', textId: 'btnOrangeText', defaultColor: 'orange-btn', label: '⚡ Use Fuel (+30m)' },
    { type: 'red', btnId: 'btnRedAd', textId: 'btnRedText', defaultColor: 'red-btn', label: '⚡ Use Fuel (+0.01/s)' }
  ];

  standardFuels.forEach(item => {
    const count = (gameState.energyGenerator.fuelCells && gameState.energyGenerator.fuelCells[item.type]) || 0;
    const btn = document.getElementById(item.btnId);
    const span = document.getElementById(item.textId) || (btn ? btn.querySelector('span') : null);

    if (btn) {
      if (count <= 0) {
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
    case 'red': return 'Red Fuel (+0.01 Rate)';
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
