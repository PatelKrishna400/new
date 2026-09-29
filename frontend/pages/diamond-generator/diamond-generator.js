/* ==========================================================================
   QUANTUM DIAMOND GENERATOR ENGINE (pages/diamond-generator/diamond-generator.js)
   - Continuous Diamond Auto-Production (0.000001 💎 every 60.00s base)
   - Output Upgrade (+0.000001 💎): 50 Coins base, +25 Coins each
   - Output Cost Reducer (Unlocks after 10 upgrades):
       * 1,000 💎 -> -100 Coins Cost (1-Time)
       * 1 Ad -> -50 Coins Cost
   - Speed Upgrade (-0.01s cycle): 10 💎 base, +50 💎 each
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
const DG_SPEED_COST_STEP = 50;
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
  if (dg.lastSpeedAdTime === undefined) dg.lastSpeedAdTime = 0;
  if (dg.hasUsedFirstSpeedAd === undefined) dg.hasUsedFirstSpeedAd = false;
  return dg;
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

// Purchase: Output Power Upgrade
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

  if (typeof showFloatingToast === 'function') {
    showFloatingToast(`💎 Output upgraded to +${formatDiamondDisplay(getDiamondsPerCycle())} 💎 / cycle!`);
  }
}

// Purchase: Speed Upgrade
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
  window.gameState.player.diamonds -= cost;
  dg.timeLevel = (dg.timeLevel || 1) + 1;
  dg.timeUpgradesCount = (dg.timeUpgradesCount || 0) + 1;

  if (typeof saveGame === 'function') saveGame();
  if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
    window.firebaseSync.saveToCloudImmediate();
  }

  updateDiamondGeneratorUI();
  if (typeof updateHomeUI === 'function') updateHomeUI();

  if (typeof showFloatingToast === 'function') {
    showFloatingToast(`⚡ Cycle speed overclocked to ${getDiamondCycleDuration().toFixed(2)}s!`);
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

  window.gameState.player.diamonds -= 1000;
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

// Background Production Loop
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

    const cycleDuration = getDiamondCycleDuration();
    dg.cycleProgress = (dg.cycleProgress || 0) + dt;

    if (dg.cycleProgress >= cycleDuration) {
      const outputPerCycle = getDiamondsPerCycle();
      const cyclesCompleted = Math.floor(dg.cycleProgress / cycleDuration);
      dg.cycleProgress = dg.cycleProgress % cycleDuration;

      const earnedDiamonds = Number((cyclesCompleted * outputPerCycle).toFixed(6));
      window.gameState.player.diamonds = Number(((window.gameState.player.diamonds || 0) + earnedDiamonds).toFixed(6));
      dg.totalProduced = Number(((dg.totalProduced || 0) + earnedDiamonds).toFixed(6));

      if (typeof saveGame === 'function') saveGame();

      // Trigger sparkle/pulse visual if on page
      const node = document.getElementById('diamondCrystalNode');
      if (node) {
        node.classList.add('cycle-complete-pulse');
        setTimeout(() => node.classList.remove('cycle-complete-pulse'), 500);
      }
    }

    updateDiamondGeneratorRealtime();
  }, 100);
}

// Real-Time Progress Visuals
function updateDiamondGeneratorRealtime() {
  const dg = ensureDiamondGenState();
  if (!dg) return;

  const cycleDuration = getDiamondCycleDuration();
  const currentProgress = dg.cycleProgress || 0;
  const remainingSeconds = Math.max(0, cycleDuration - currentProgress);
  const percent = Math.min(100, Math.max(0, (currentProgress / cycleDuration) * 100));

  // 1. Central Countdown Text
  const countText = document.getElementById('diamondCountdownText');
  if (countText) {
    countText.textContent = `${remainingSeconds.toFixed(1)}s`;
  }

  // 2. SVG Ring
  const ringEl = document.getElementById('diamondProgressRing');
  if (ringEl) {
    const circumference = 439.82;
    const offset = circumference - (percent / 100) * circumference;
    ringEl.style.strokeDashoffset = offset.toFixed(2);
  }

  // 3. Speed Ad Cooldown Display
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
  const pLevel = dg.productionLevel || 1;
  const sLevel = dg.timeLevel || 1;
  const upCount = dg.productionUpgradesCount || 0;

  // Header badges
  const headerPill = document.getElementById('dgRateHeaderBadge');
  if (headerPill) {
    headerPill.textContent = `+${formatDiamondDisplay(rate)} 💎 / ${cycleDur.toFixed(2)}s`;
  }

  // Core rate label
  const coreRate = document.getElementById('diamondCoreRateLabel');
  if (coreRate) {
    coreRate.textContent = `+${formatDiamondDisplay(rate)} 💎`;
  }

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
  const durMetric = document.getElementById('dgCycleDurationMetric');
  if (durMetric) durMetric.textContent = `${cycleDur.toFixed(2)}s`;

  const rateMetric = document.getElementById('dgOutputRateMetric');
  if (rateMetric) rateMetric.textContent = `+${formatDiamondDisplay(rate)} 💎`;

  const totalMetric = document.getElementById('genTotalProducedVal');
  if (totalMetric) totalMetric.textContent = `${formatDiamondDisplay(dg.totalProduced || 0)} 💎`;

  // Output Power Upgrade Card
  const outLvl = document.getElementById('ducOutputLevelBadge');
  if (outLvl) outLvl.textContent = `Lv. ${pLevel}`;

  const outSub = document.getElementById('ducOutputSub');
  if (outSub) outSub.textContent = `Rate: +${formatDiamondDisplay(rate)} 💎/cycle`;

  const outCostTxt = document.getElementById('btnUpgradeOutputCostText');
  if (outCostTxt) outCostTxt.textContent = `Cost: 🪙 ${outputCost} Coins`;

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
  const spdLvl = document.getElementById('ducSpeedLevelBadge');
  if (spdLvl) spdLvl.textContent = `Lv. ${sLevel}`;

  const spdSub = document.getElementById('ducSpeedSub');
  if (spdSub) spdSub.textContent = `Cycle: ${cycleDur.toFixed(2)}s (-0.01s/lvl)`;

  const spdCostTxt = document.getElementById('btnUpgradeSpeedCostText');
  if (spdCostTxt) spdCostTxt.textContent = `Cost: 💎 ${speedCost} Diamonds`;

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

  // Sync Home Page Entry Card Badges if present
  const dgeRate = document.getElementById('dgeHomeRateVal');
  if (dgeRate) dgeRate.textContent = `+${formatDiamondDisplay(rate)} 💎 / ${cycleDur.toFixed(2)}s`;

  const dgeCycle = document.getElementById('dgeHomeCycleText');
  if (dgeCycle) dgeCycle.textContent = `Cycle: ${cycleDur.toFixed(2)}s`;

  updateSpeedAdCooldownRealtime();
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
window.purchaseDiamondOutputUpgrade = purchaseDiamondOutputUpgrade;
window.purchaseDiamondSpeedUpgrade = purchaseDiamondSpeedUpgrade;
window.applyDiamondDiscount1000 = applyDiamondDiscount1000;
window.applyOutputAdDiscount = applyOutputAdDiscount;
window.applySpeedAdDiscount = applySpeedAdDiscount;
window.updateDiamondGeneratorUI = updateDiamondGeneratorUI;
window.formatDiamondDisplay = formatDiamondDisplay;
window.getDiamondsPerCycle = getDiamondsPerCycle;
window.getDiamondCycleDuration = getDiamondCycleDuration;
window.getDiamondOutputCost = getDiamondOutputCost;
window.getDiamondSpeedCost = getDiamondSpeedCost;
