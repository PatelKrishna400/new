/* ==========================================================================
   QUANTUM DIAMOND GENERATOR ENGINE (pages/diamond-generator/diamond-generator.js)
   - Energy required to start generation (10 Base Energy + 5 Energy per upgrade)
   - Continuous timer countdown when active with accurate timestamp delta
   - Output Upgrade (+0.000001 💎): 50 Coins base, +25 Coins each
   - Speed Upgrade (-0.01s cycle): 10 💎 base, +25 💎 each
   - Output Cost Reducer (Unlocks after 10 upgrades):
       * 1,000 💎 -> -100 Coins Cost (1-Time)
       * 1 Ad -> -50 Coins Cost
   - Speed Cost Reducer:
       * 1st Ad -> -10 💎 Cost Reduction (10-minute cooldown)
       * Subsequent Ads -> -1 💎 Cost Reduction per ad (with 10-minute cooldown)
   ========================================================================== */

let _dgProductionInterval = null;
let _dgLastTickTime = Date.now();

// Base Configuration Constants
const DG_BASE_CYCLE_SEC = 60.00;
const DG_BASE_OUTPUT_RATE = 0.000001;
const DG_OUTPUT_BASE_COST = 50;
const DG_OUTPUT_COST_STEP = 25;
const DG_SPEED_BASE_COST = 10;
const DG_SPEED_COST_STEP = 25; // Speed upgrade cost add 25 per upgrade
const DG_BASE_START_ENERGY = 10; // 10 Base Energy to start generation
const DG_ENERGY_STEP_PER_UPGRADE = 5; // +5 Energy to start per output/speed upgrade
const DG_SPEED_AD_COOLDOWN_MS = 10 * 60 * 1000; // 10 Minutes

// Helper: Format Diamond display with up to 6 decimals
function formatDiamondDisplay(num) {
  if (num === undefined || num === null || isNaN(num)) return '0.000000';
  return Number(num).toFixed(6);
}

// Initializer & State Verification
function ensureDiamondGenState() {
  if (!window.gameState) return null;
  if (!window.gameState.diamondGenerator) {
    window.gameState.diamondGenerator = {
      productionLevel: 1,
      timeLevel: 1,
      productionUpgradesCount: 0,
      timeUpgradesCount: 0,
      productionCostDiscount: 0,
      timeCostDiscount: 0,
      diamond1000DiscountUsed: false,
      cycleProgress: 0,
      totalProduced: 0,
      isRunning: false,
      generationStartTime: 0,
      generationDuration: 60.00,
      lastSpeedAdTime: 0,
      hasUsedFirstSpeedAd: false
    };
  }
  const dg = window.gameState.diamondGenerator;
  if (dg.productionLevel === undefined) dg.productionLevel = 1;
  if (dg.timeLevel === undefined) dg.timeLevel = 1;
  if (dg.productionUpgradesCount === undefined) dg.productionUpgradesCount = 0;
  if (dg.timeUpgradesCount === undefined) dg.timeUpgradesCount = 0;
  if (dg.productionCostDiscount === undefined) dg.productionCostDiscount = 0;
  if (dg.timeCostDiscount === undefined) dg.timeCostDiscount = 0;
  if (dg.diamond1000DiscountUsed === undefined) dg.diamond1000DiscountUsed = false;
  if (dg.cycleProgress === undefined) dg.cycleProgress = 0;
  if (dg.totalProduced === undefined) dg.totalProduced = 0;
  if (dg.isRunning === undefined) dg.isRunning = false;
  if (dg.generationStartTime === undefined) dg.generationStartTime = 0;
  if (dg.generationDuration === undefined) dg.generationDuration = getDiamondCycleDuration();
  if (dg.lastSpeedAdTime === undefined) dg.lastSpeedAdTime = 0;
  if (dg.hasUsedFirstSpeedAd === undefined) dg.hasUsedFirstSpeedAd = false;
  return dg;
}

// Energy Cost to Start Generation:
// Base: 10 Energy. Each upgrade (output or speed) adds +5 Energy.
function getDiamondGenEnergyCost() {
  const dg = ensureDiamondGenState();
  if (!dg) return DG_BASE_START_ENERGY;
  const totalUpgrades = Math.max(0, ((dg.productionLevel || 1) - 1) + ((dg.timeLevel || 1) - 1));
  return DG_BASE_START_ENERGY + (totalUpgrades * DG_ENERGY_STEP_PER_UPGRADE);
}

// Formula Calculations
function getDiamondsPerCycle() {
  const dg = ensureDiamondGenState();
  if (!dg) return DG_BASE_OUTPUT_RATE;
  return Number((DG_BASE_OUTPUT_RATE + (dg.productionLevel - 1) * 0.000001).toFixed(6));
}

function getDiamondCycleDuration() {
  const dg = ensureDiamondGenState();
  if (!dg) return DG_BASE_CYCLE_SEC;
  const dur = DG_BASE_CYCLE_SEC - (dg.timeLevel - 1) * 0.01;
  return Math.max(1.00, Number(dur.toFixed(2)));
}

function getDiamondOutputCost() {
  const dg = ensureDiamondGenState();
  if (!dg) return DG_OUTPUT_BASE_COST;
  const baseCost = DG_OUTPUT_BASE_COST + dg.productionUpgradesCount * DG_OUTPUT_COST_STEP;
  return Math.max(25, baseCost - (dg.productionCostDiscount || 0));
}

function getDiamondSpeedCost() {
  const dg = ensureDiamondGenState();
  if (!dg) return DG_SPEED_BASE_COST;
  const baseCost = DG_SPEED_BASE_COST + dg.timeUpgradesCount * DG_SPEED_COST_STEP;
  return Math.max(1, baseCost - (dg.timeCostDiscount || 0));
}

function isSpeedAdOnCooldown() {
  const dg = ensureDiamondGenState();
  if (!dg || !dg.lastSpeedAdTime) return false;
  return (Date.now() - dg.lastSpeedAdTime) < DG_SPEED_AD_COOLDOWN_MS;
}

function getSpeedAdCooldownRemainingSec() {
  const dg = ensureDiamondGenState();
  if (!dg || !dg.lastSpeedAdTime) return 0;
  const rem = DG_SPEED_AD_COOLDOWN_MS - (Date.now() - dg.lastSpeedAdTime);
  return Math.max(0, Math.ceil(rem / 1000));
}

// Action: Start Diamond Generation (Uses Energy)
function startDiamondGeneration() {
  if (!window.gameState) return;
  const dg = ensureDiamondGenState();
  if (!dg) return;

  if (dg.isRunning) {
    const dur = dg.generationDuration || getDiamondCycleDuration();
    const rem = Math.max(0, dur - (dg.cycleProgress || 0));
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`⚡ Generation in progress! ${rem.toFixed(1)}s remaining.`);
    }
    return;
  }

  const energyCost = getDiamondGenEnergyCost();
  const currentEnergy = Math.floor(window.gameState.reactor?.currentEnergy || 0);

  if (currentEnergy < energyCost) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`⚡ Need ${energyCost} Energy to start generation! (Have: ${currentEnergy}). Tap reactor!`);
    }
    return;
  }

  // Deduct energy & start generation
  window.gameState.reactor.currentEnergy -= energyCost;
  dg.isRunning = true;
  dg.cycleProgress = 0;
  dg.generationDuration = getDiamondCycleDuration();
  dg.generationStartTime = Date.now();

  if (typeof saveGame === 'function') saveGame();
  if (typeof updateUI === 'function') updateUI();
  if (typeof updateEnergyUI === 'function') updateEnergyUI();
  if (typeof updateHomeUI === 'function') updateHomeUI();
  updateDiamondGeneratorUI();

  if (typeof showFloatingToast === 'function') {
    showFloatingToast(`⚡ Consumed ${energyCost} Energy! Quantum Diamond Generation started.`);
  }

  if (typeof sfx !== 'undefined' && typeof sfx.playTapSound === 'function') {
    sfx.playTapSound(3);
  }
}

// Purchase: Output Power Upgrade (+0.000001 💎)
function purchaseDiamondOutputUpgrade() {
  const dg = ensureDiamondGenState();
  if (!dg || !window.gameState) return;

  const cost = getDiamondOutputCost();
  const playerCoins = window.gameState.player.coins || 0;

  if (playerCoins < cost) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`🪙 Need ${cost} coins! (Have: ${playerCoins})`);
    }
    return;
  }

  // Deduct coins & advance output level
  window.gameState.player.coins -= cost;
  dg.productionLevel = (dg.productionLevel || 1) + 1;
  dg.productionUpgradesCount = (dg.productionUpgradesCount || 0) + 1;

  if (typeof saveGame === 'function') saveGame();
  if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
    window.firebaseSync.saveToCloudImmediate();
  }

  updateDiamondGeneratorUI();
  if (typeof updateHomeUI === 'function') updateHomeUI();
  if (typeof updateUI === 'function') updateUI();

  const newEnergyCost = getDiamondGenEnergyCost();
  if (typeof showFloatingToast === 'function') {
    showFloatingToast(`💎 Output upgraded to +${formatDiamondDisplay(getDiamondsPerCycle())} 💎! (Energy to start: ${newEnergyCost} ⚡)`);
  }
}

// Purchase: Speed Upgrade (-0.01s cycle)
function purchaseDiamondSpeedUpgrade() {
  const dg = ensureDiamondGenState();
  if (!dg || !window.gameState) return;

  const cost = getDiamondSpeedCost();
  const playerDiamonds = window.gameState.player.diamonds || 0;

  if (playerDiamonds < cost) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`💎 Need ${cost} diamonds! (Have: ${formatDiamondDisplay(playerDiamonds)})`);
    }
    return;
  }

  // Deduct diamonds & advance speed level
  window.gameState.player.diamonds = Number((playerDiamonds - cost).toFixed(6));
  dg.timeLevel = (dg.timeLevel || 1) + 1;
  dg.timeUpgradesCount = (dg.timeUpgradesCount || 0) + 1;

  if (typeof saveGame === 'function') saveGame();
  if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
    window.firebaseSync.saveToCloudImmediate();
  }

  updateDiamondGeneratorUI();
  if (typeof updateHomeUI === 'function') updateHomeUI();
  if (typeof updateUI === 'function') updateUI();

  const newEnergyCost = getDiamondGenEnergyCost();
  if (typeof showFloatingToast === 'function') {
    showFloatingToast(`⚡ Cycle speed overclocked to ${getDiamondCycleDuration().toFixed(2)}s! (Energy to start: ${newEnergyCost} ⚡)`);
  }
}

// Discount: 1,000 Diamonds for -100 Coins (1-time use)
function applyDiamondDiscount1000() {
  const dg = ensureDiamondGenState();
  if (!dg || !window.gameState) return;

  if (dg.productionUpgradesCount < 10) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`🔒 Unlocks after 10 Output Upgrades! (${dg.productionUpgradesCount}/10)`);
    }
    return;
  }

  if (dg.diamond1000DiscountUsed) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`ℹ️ 1,000 Diamond discount has already been redeemed!`);
    }
    return;
  }

  const playerDiamonds = window.gameState.player.diamonds || 0;
  if (playerDiamonds < 1000) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`💎 Need 1,000 Diamonds! (Have: ${formatDiamondDisplay(playerDiamonds)})`);
    }
    return;
  }

  window.gameState.player.diamonds = Number((playerDiamonds - 1000).toFixed(6));
  dg.diamond1000DiscountUsed = true;
  dg.productionCostDiscount = (dg.productionCostDiscount || 0) + 100;

  if (typeof saveGame === 'function') saveGame();
  if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
    window.firebaseSync.saveToCloudImmediate();
  }

  updateDiamondGeneratorUI();
  if (typeof showFloatingToast === 'function') {
    showFloatingToast(`🎉 Redeemed! Output upgrade cost permanently reduced by 100 Coins!`);
  }
}

// Discount: Watch 1 Ad for -50 Coins
function applyOutputAdDiscount() {
  const dg = ensureDiamondGenState();
  if (!dg || !window.gameState) return;

  if (dg.productionUpgradesCount < 10) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`🔒 Unlocks after 10 Output Upgrades! (${dg.productionUpgradesCount}/10)`);
    }
    return;
  }

  const triggerReward = () => {
    dg.productionCostDiscount = (dg.productionCostDiscount || 0) + 50;
    if (typeof saveGame === 'function') saveGame();
    if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
      window.firebaseSync.saveToCloudImmediate();
    }
    updateDiamondGeneratorUI();
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`🎬 Ad watched! Output upgrade cost reduced by 50 Coins!`);
    }
  };

  if (typeof showMonetagRewardedAd === 'function') {
    showMonetagRewardedAd({
      onRewarded: triggerReward,
      onError: triggerReward
    });
  } else {
    triggerReward();
  }
}

// Discount: Watch Ad for Speed Upgrade Cost
function applySpeedAdDiscount() {
  const dg = ensureDiamondGenState();
  if (!dg || !window.gameState) return;

  if (isSpeedAdOnCooldown()) {
    const rem = getSpeedAdCooldownRemainingSec();
    const m = Math.floor(rem / 60);
    const s = rem % 60;
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`⏳ Ad bonus recharging! Next ad in ${m}m ${s}s.`);
    }
    return;
  }

  const isFirst = !dg.hasUsedFirstSpeedAd;
  const reductionAmount = isFirst ? 10 : 1;

  const triggerReward = () => {
    dg.timeCostDiscount = (dg.timeCostDiscount || 0) + reductionAmount;
    dg.lastSpeedAdTime = Date.now();
    dg.hasUsedFirstSpeedAd = true;

    if (typeof saveGame === 'function') saveGame();
    if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
      window.firebaseSync.saveToCloudImmediate();
    }

    updateDiamondGeneratorUI();
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`🎬 Ad watched! Speed upgrade cost reduced by ${reductionAmount} 💎! (10m cooldown active)`);
    }
  };

  if (typeof showMonetagRewardedAd === 'function') {
    showMonetagRewardedAd({
      onRewarded: triggerReward,
      onError: triggerReward
    });
  } else {
    triggerReward();
  }
}

// Background Production Loop (Only increments when isRunning is true)
function startDiamondGeneratorLoop() {
  if (_dgProductionInterval) clearInterval(_dgProductionInterval);
  _dgLastTickTime = Date.now();

  _dgProductionInterval = setInterval(() => {
    const now = Date.now();
    const dt = (now - _dgLastTickTime) / 1000;
    _dgLastTickTime = now;

    if (!window.gameState) return;
    const dg = ensureDiamondGenState();
    if (!dg) return;

    if (dg.isRunning) {
      const cycleDuration = dg.generationDuration || getDiamondCycleDuration();

      if (dg.generationStartTime) {
        dg.cycleProgress = Math.min(cycleDuration, (now - dg.generationStartTime) / 1000);
      } else {
        dg.cycleProgress = (dg.cycleProgress || 0) + dt;
      }

      if (dg.cycleProgress >= cycleDuration) {
        // Complete cycle
        dg.isRunning = false;
        dg.cycleProgress = 0;
        dg.generationStartTime = 0;

        const outputPerCycle = getDiamondsPerCycle();
        window.gameState.player.diamonds = Number(((window.gameState.player.diamonds || 0) + outputPerCycle).toFixed(6));
        dg.totalProduced = Number(((dg.totalProduced || 0) + outputPerCycle).toFixed(6));

        if (typeof saveGame === 'function') saveGame();
        if (typeof updateUI === 'function') updateUI();
        if (typeof updateHomeUI === 'function') updateHomeUI();
        updateDiamondGeneratorUI();

        // Trigger visual pulse across all crystal nodes
        document.querySelectorAll('.diamond-crystal-node').forEach(node => {
          node.classList.add('cycle-complete-pulse');
          setTimeout(() => node.classList.remove('cycle-complete-pulse'), 800);
        });

        if (typeof showFloatingToast === 'function') {
          showFloatingToast(`💎 Generation Complete! +${formatDiamondDisplay(outputPerCycle)} 💎 collected!`);
        }

        if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') {
          sfx.playLevelUpSound();
        }
      }
    }

    updateDiamondGeneratorRealtime();
  }, 100);
}

// Real-Time Progress Visuals
function updateDiamondGeneratorRealtime() {
  const dg = ensureDiamondGenState();
  if (!dg) return;

  const cycleDuration = dg.generationDuration || getDiamondCycleDuration();
  const currentProgress = dg.cycleProgress || 0;
  const remainingSeconds = dg.isRunning ? Math.max(0, cycleDuration - currentProgress) : cycleDuration;
  const percent = dg.isRunning ? Math.min(100, Math.max(0, (currentProgress / cycleDuration) * 100)) : 0;
  const energyCost = getDiamondGenEnergyCost();

  // 1. Central Countdown Text (both on dedicated page and home page)
  document.querySelectorAll('.diamond-countdown-text, #diamondCountdownText, #diamondCountdownTextHome').forEach(el => {
    if (el) {
      el.textContent = `${remainingSeconds.toFixed(1)}s`;
    }
  });

  // 2. SVG Rings
  const circumference = 439.82;
  const offset = dg.isRunning ? (circumference - (percent / 100) * circumference) : circumference;
  document.querySelectorAll('.diamond-ring-fill, #diamondProgressRing, #diamondProgressRingHome').forEach(ringEl => {
    if (ringEl) {
      ringEl.style.strokeDashoffset = offset.toFixed(2);
    }
  });

  // 3. Start Generation Buttons
  document.querySelectorAll('.btn-start-diamond-gen, #btnStartDiamondGen, #btnStartDiamondGenHome').forEach(btn => {
    if (btn) {
      if (dg.isRunning) {
        btn.innerHTML = `<span class="btn-shine"></span><span>⚡ Generating... (${remainingSeconds.toFixed(1)}s)</span>`;
        btn.classList.add('generating-active');
        btn.disabled = true;
      } else {
        btn.innerHTML = `<span class="btn-shine"></span><span>⚡ Start Generation (${energyCost} Energy)</span>`;
        btn.classList.remove('generating-active');
        btn.disabled = false;
      }
    }
  });

  // 4. Status Badges & Cycle Texts
  document.querySelectorAll('.dg-status-text, #dgStatusText, #dgeHomeCycleText').forEach(st => {
    if (st) {
      if (dg.isRunning) {
        st.textContent = `⚡ Active: ${remainingSeconds.toFixed(1)}s`;
        st.style.color = '#38bdf8';
      } else {
        st.textContent = `Ready (${energyCost} ⚡)`;
        st.style.color = '#10b981';
      }
    }
  });

  // 5. Speed Ad Cooldown Display
  updateSpeedAdCooldownRealtime();
}

function updateSpeedAdCooldownRealtime() {
  const badge = document.getElementById('speedReducerStatusBadge');
  const btnTitle = document.getElementById('speedAdDiscountBtnTitle');
  const btnSub = document.getElementById('speedAdDiscountBtnSub');
  const btn = document.getElementById('btnDiscountSpeedAd');
  const dg = ensureDiamondGenState();
  if (!dg || !badge || !btnTitle) return;

  const onCool = isSpeedAdOnCooldown();
  const isFirst = !dg.hasUsedFirstSpeedAd;

  if (onCool) {
    const rem = getSpeedAdCooldownRemainingSec();
    const m = Math.floor(rem / 60);
    const s = rem % 60;
    const timeStr = `${m}m ${String(s).padStart(2, '0')}s`;
    badge.textContent = `Cooldown: ${timeStr}`;
    badge.style.color = '#ef4444';
    btnTitle.textContent = `Ad Recharging (${timeStr})`;
    if (btnSub) btnSub.textContent = `Available again in ${timeStr}`;
    if (btn) btn.style.opacity = '0.65';
  } else {
    badge.textContent = 'Ad Bonus Available';
    badge.style.color = '#10b981';
    btnTitle.textContent = isFirst ? 'Watch Ad (-10 💎 Cost)' : 'Watch Ad (-1 💎 Cost)';
    if (btnSub) btnSub.textContent = isFirst ? 'First Ad Bonus • 10m Cooldown' : 'Repeated Ad Bonus • 10m Cooldown';
    if (btn) btn.style.opacity = '1';
  }
}

// Full UI Update
function updateDiamondGeneratorUI() {
  if (!window.gameState) return;
  const dg = ensureDiamondGenState();
  if (!dg) return;

  const cycleDur = getDiamondCycleDuration();
  const rate = getDiamondsPerCycle();
  const outputCost = getDiamondOutputCost();
  const speedCost = getDiamondSpeedCost();
  const energyCost = getDiamondGenEnergyCost();
  const pLevel = dg.productionLevel || 1;
  const sLevel = dg.timeLevel || 1;
  const upCount = dg.productionUpgradesCount || 0;

  // Header badges
  document.querySelectorAll('#dgRateHeaderBadge, #dgRateHeaderBadgeHome').forEach(headerPill => {
    if (headerPill) {
      headerPill.textContent = `+${formatDiamondDisplay(rate)} 💎 / ${cycleDur.toFixed(2)}s`;
    }
  });

  // Core rate label
  document.querySelectorAll('#diamondCoreRateLabel, #diamondCoreRateLabelHome').forEach(coreRate => {
    if (coreRate) {
      coreRate.textContent = `+${formatDiamondDisplay(rate)} 💎`;
    }
  });

  // Energy Required Badge / Info
  document.querySelectorAll('.dg-energy-cost-val, #dgRequiredEnergyVal, #dgRequiredEnergyValHome').forEach(el => {
    if (el) el.textContent = `${energyCost} ⚡`;
  });

  // Top Sticky Resource Balances
  const stickyDia = document.getElementById('dgStickyDiamonds');
  if (stickyDia) stickyDia.textContent = formatDiamondDisplay(window.gameState.player.diamonds || 0);

  const stickyCoins = document.getElementById('dgStickyCoins');
  if (stickyCoins && typeof formatNumber === 'function') {
    stickyCoins.textContent = formatNumber(window.gameState.player.coins || 0);
  }

  const stickyEnergy = document.getElementById('dgStickyEnergy');
  if (stickyEnergy) {
    stickyEnergy.textContent = Math.floor(window.gameState.reactor ? window.gameState.reactor.currentEnergy || 0 : 0);
  }

  // Metrics Strip
  document.querySelectorAll('#dgCycleDurationMetric, #dgCycleDurationMetricHome').forEach(el => {
    if (el) el.textContent = `${cycleDur.toFixed(2)}s`;
  });

  document.querySelectorAll('#dgOutputRateMetric, #dgOutputRateMetricHome').forEach(el => {
    if (el) el.textContent = `+${formatDiamondDisplay(rate)} 💎`;
  });

  document.querySelectorAll('#genTotalProducedVal, #genTotalProducedValHome').forEach(el => {
    if (el) el.textContent = `${formatDiamondDisplay(dg.totalProduced || 0)} 💎`;
  });

  // Output Power Upgrade Card
  document.querySelectorAll('#ducOutputLevelBadge, #ducOutputLevelBadgeHome').forEach(el => {
    if (el) el.textContent = `Lv. ${pLevel}`;
  });

  document.querySelectorAll('#ducOutputSub, #ducOutputSubHome').forEach(el => {
    if (el) el.textContent = `Rate: +${formatDiamondDisplay(rate)} 💎/cycle`;
  });

  document.querySelectorAll('#btnUpgradeOutputCostText, #btnUpgradeOutputCostTextHome').forEach(el => {
    if (el) el.textContent = `Cost: 🪙 ${outputCost} Coins`;
  });

  // Output Cost Reducers (Unlocked at 10 upgrades)
  const outMilestone = document.getElementById('outputReducerMilestoneText');
  const outActions = document.getElementById('outputReducerActions');
  const outDiscountNote = document.getElementById('outputDiscountAppliedNote');

  if (outMilestone && outActions) {
    if (upCount >= 10) {
      outMilestone.textContent = 'Milestone Unlocked!';
      outMilestone.style.color = '#10b981';
      outActions.style.display = 'grid';
    } else {
      outMilestone.textContent = `Unlocks after 10 Upgrades (${upCount}/10)`;
      outMilestone.style.color = '#f59e0b';
      outActions.style.display = 'none';
    }
  }

  const btn1000 = document.getElementById('btnDiscount1000Diamond');
  if (btn1000) {
    if (dg.diamond1000DiscountUsed) {
      btn1000.disabled = true;
      btn1000.style.opacity = '0.5';
      const bTitle = document.getElementById('btnDiscount1000Title');
      if (bTitle) bTitle.textContent = '1,000 💎 (Claimed)';
    } else {
      btn1000.disabled = false;
      btn1000.style.opacity = '1';
    }
  }

  if (outDiscountNote) {
    const curDisc = dg.productionCostDiscount || 0;
    if (curDisc > 0) {
      outDiscountNote.style.display = 'block';
      outDiscountNote.textContent = `Applied Discount: -${curDisc} Coins on every upgrade`;
    } else {
      outDiscountNote.style.display = 'none';
    }
  }

  // Speed Upgrade Card
  document.querySelectorAll('#ducSpeedLevelBadge, #ducSpeedLevelBadgeHome').forEach(el => {
    if (el) el.textContent = `Lv. ${sLevel}`;
  });

  document.querySelectorAll('#ducSpeedSub, #ducSpeedSubHome').forEach(el => {
    if (el) el.textContent = `Cycle: ${cycleDur.toFixed(2)}s (-0.01s/lvl)`;
  });

  document.querySelectorAll('#btnUpgradeSpeedCostText, #btnUpgradeSpeedCostTextHome').forEach(el => {
    if (el) el.textContent = `Cost: 💎 ${speedCost} Diamonds`;
  });

  const spdDiscountNote = document.getElementById('speedDiscountAppliedNote');
  if (spdDiscountNote) {
    const curDisc = dg.timeCostDiscount || 0;
    if (curDisc > 0) {
      spdDiscountNote.style.display = 'block';
      spdDiscountNote.textContent = `Applied Discount: -${curDisc} 💎 on every speed upgrade`;
    } else {
      spdDiscountNote.style.display = 'none';
    }
  }

  // Sync Home Page Rate Label
  const dgeRate = document.getElementById('dgeHomeRateVal');
  if (dgeRate) dgeRate.textContent = `+${formatDiamondDisplay(rate)} 💎 / ${cycleDur.toFixed(2)}s`;

  updateDiamondGeneratorRealtime();
}

// Initialize on Script Load & Window Events
if (typeof window !== 'undefined') {
  startDiamondGeneratorLoop();
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      updateDiamondGeneratorUI();
    });
  }
}

// Global Exports
window.startDiamondGeneration = startDiamondGeneration;
window.getDiamondGenEnergyCost = getDiamondGenEnergyCost;
window.purchaseDiamondOutputUpgrade = purchaseDiamondOutputUpgrade;
window.purchaseDiamondSpeedUpgrade = purchaseDiamondSpeedUpgrade;
window.applyDiamondDiscount1000 = applyDiamondDiscount1000;
window.applyOutputAdDiscount = applyOutputAdDiscount;
window.applySpeedAdDiscount = applySpeedAdDiscount;
window.updateDiamondGeneratorUI = updateDiamondGeneratorUI;
window.updateDiamondGeneratorRealtime = updateDiamondGeneratorRealtime;
window.formatDiamondDisplay = formatDiamondDisplay;
window.getDiamondsPerCycle = getDiamondsPerCycle;
window.getDiamondCycleDuration = getDiamondCycleDuration;
window.getDiamondOutputCost = getDiamondOutputCost;
window.getDiamondSpeedCost = getDiamondSpeedCost;
