/* ==========================================================================
   QUANTUM DIAMOND GENERATOR ENGINE (pages/diamond-generator/diamond-generator.js)
   - Uses Energy to Start Generation (Base 100 ⚡ + 5 ⚡ per upgrade level)
   - 60.00s Timer -> Rewards 0.000001 💎 * Power Level upon completion
   - Power Upgrade: +0.000001 💎 rate (Costs 50 Coins for Lv 2, 100 for Lv 3, 150 for Lv 4...)
   - Speed Upgrade: -0.01s cycle (Costs 10 Diamonds for Lv 2, 15 for Lv 3, 20 for Lv 4...)
   - Cost Reducer Tabs [ POWER ] and [ SPEED ]:
       * Power Tab: Watch Ad reduces coin cost by 10 coins (30s cooldown timer between ads)
       * Speed Tab: Watch Ad reduces diamond cost by 1 diamond (30s cooldown timer between ads)
       * Milestone Rule: Every 10 levels (10->11, 20->21...), 3 ads watch is compulsory with 30s timer between ads!
   - Firebase Realtime Database Sync on all actions
   ========================================================================== */

let _dgProductionInterval = null;
let _dgLastTickTime = Date.now();

// Configuration Constants
const DG_BASE_CYCLE_SEC = 60.00;
const DG_BASE_OUTPUT_RATE = 0.000001;
const DG_BASE_START_ENERGY = 100; // 100 Energy to start generation
const DG_ENERGY_STEP_PER_UPGRADE = 5; // +5 Energy per upgrade
const DG_AD_COOLDOWN_MS = 30 * 1000; // 30 Seconds timer between ads

// Format Diamond display (up to 6 decimals)
function formatDiamondDisplay(num) {
  if (num === undefined || num === null || isNaN(num)) return '0.000000';
  return Number(num).toFixed(6);
}

// Initializer & State Verification
function ensureDiamondGenState() {
  if (!window.gameState) return null;
  if (!window.gameState.diamondGenerator) {
    window.gameState.diamondGenerator = {};
  }
  const dg = window.gameState.diamondGenerator;

  // Support migration from old keys if any
  if (dg.powerLevel === undefined) dg.powerLevel = dg.productionLevel || 1;
  if (dg.speedLevel === undefined) dg.speedLevel = dg.timeLevel || 1;
  if (dg.isRunning === undefined) dg.isRunning = false;
  if (dg.cycleProgress === undefined || isNaN(dg.cycleProgress)) dg.cycleProgress = 0;
  if (dg.generationStartTime === undefined) dg.generationStartTime = 0;
  if (dg.totalProduced === undefined) dg.totalProduced = 0;

  // Discounts & Ad Timers
  if (dg.powerDiscount === undefined) dg.powerDiscount = 0;
  if (dg.speedDiscount === undefined) dg.speedDiscount = 0;
  if (dg.lastPowerAdTime === undefined) dg.lastPowerAdTime = 0;
  if (dg.lastSpeedAdTime === undefined) dg.lastSpeedAdTime = 0;

  // Milestone Compulsory Ads (0 to 3)
  if (dg.powerMilestoneAds === undefined) dg.powerMilestoneAds = 0;
  if (dg.speedMilestoneAds === undefined) dg.speedMilestoneAds = 0;

  return dg;
}

// Energy Cost: Base 100 + 5 per each upgrade beyond level 1
function getDiamondGenEnergyCost() {
  const dg = ensureDiamondGenState();
  if (!dg) return DG_BASE_START_ENERGY;
  const totalUpgrades = Math.max(0, ((dg.powerLevel || 1) - 1) + ((dg.speedLevel || 1) - 1));
  return DG_BASE_START_ENERGY + (totalUpgrades * DG_ENERGY_STEP_PER_UPGRADE);
}

// Diamond Output Rate: 0.000001 * powerLevel
function getDiamondsPerCycle() {
  const dg = ensureDiamondGenState();
  if (!dg) return DG_BASE_OUTPUT_RATE;
  const pLvl = Math.max(1, parseInt(dg.powerLevel, 10) || 1);
  return Number((pLvl * DG_BASE_OUTPUT_RATE).toFixed(6));
}

// Cycle Duration: 60.00s - 0.01s * (speedLevel - 1)
function getDiamondCycleDuration() {
  const dg = ensureDiamondGenState();
  if (!dg) return DG_BASE_CYCLE_SEC;
  const sLvl = Math.max(1, parseInt(dg.speedLevel, 10) || 1);
  const dur = DG_BASE_CYCLE_SEC - (sLvl - 1) * 0.01;
  return Math.max(1.00, Number(dur.toFixed(2)));
}

// Power Upgrade Cost: Lv 1->2 is 50, Lv 2->3 is 100, Lv 3->4 is 150...
function getDiamondPowerUpgradeCost() {
  const dg = ensureDiamondGenState();
  if (!dg) return 50;
  const curLvl = Math.max(1, parseInt(dg.powerLevel, 10) || 1);
  const baseCost = curLvl * 50;
  const discount = Math.max(0, parseInt(dg.powerDiscount, 10) || 0);
  return Math.max(10, baseCost - discount);
}

// Speed Upgrade Cost: Lv 1->2 is 10, Lv 2->3 is 15, Lv 3->4 is 20... (+5 each)
function getDiamondSpeedUpgradeCost() {
  const dg = ensureDiamondGenState();
  if (!dg) return 10;
  const curLvl = Math.max(1, parseInt(dg.speedLevel, 10) || 1);
  const baseCost = 10 + (curLvl - 1) * 5;
  const discount = Math.max(0, parseInt(dg.speedDiscount, 10) || 0);
  return Math.max(1, baseCost - discount);
}

// Check if player is at a 10-level milestone requiring compulsory ads
function isPowerMilestoneLocked() {
  const dg = ensureDiamondGenState();
  if (!dg) return false;
  const curLvl = Math.max(1, parseInt(dg.powerLevel, 10) || 1);
  return (curLvl % 10 === 0) && ((dg.powerMilestoneAds || 0) < 3);
}

function isSpeedMilestoneLocked() {
  const dg = ensureDiamondGenState();
  if (!dg) return false;
  const curLvl = Math.max(1, parseInt(dg.speedLevel, 10) || 1);
  return (curLvl % 10 === 0) && ((dg.speedMilestoneAds || 0) < 3);
}

// Action: Start Diamond Generation
function startDiamondGeneration() {
  if (!window.gameState) return;
  const dg = ensureDiamondGenState();
  if (!dg) return;

  if (dg.isRunning) {
    const dur = getDiamondCycleDuration();
    const rem = Math.max(0, dur - (dg.cycleProgress || 0));
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`⚡ In progress: ${rem.toFixed(1)}s remaining`);
    }
    return;
  }

  const energyCost = getDiamondGenEnergyCost();
  const currentEnergy = Math.floor(window.gameState.reactor?.currentEnergy || 0);

  if (currentEnergy < energyCost) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`Need ${energyCost} ⚡ Energy! (Have: ${currentEnergy}). Tap reactor!`);
    }
    return;
  }

  // Deduct energy & start timer
  window.gameState.reactor.currentEnergy -= energyCost;
  dg.isRunning = true;
  dg.cycleProgress = 0;
  dg.generationStartTime = Date.now();

  saveAllState();
  updateDiamondGeneratorUI();
  updateDiamondGeneratorRealtime();

  if (typeof showFloatingToast === 'function') {
    showFloatingToast(`⚡ Generation Started (-${energyCost} ⚡)`);
  }
}

// Action: Purchase Power Upgrade
function purchaseDiamondOutputUpgrade() {
  const dg = ensureDiamondGenState();
  if (!dg || !window.gameState) return;

  if (isPowerMilestoneLocked()) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`🔒 Watch 3 Ads to unlock Level ${dg.powerLevel + 1}! (${dg.powerMilestoneAds || 0}/3)`);
    }
    return;
  }

  const cost = getDiamondPowerUpgradeCost();
  const playerCoins = window.gameState.player.coins || 0;

  if (playerCoins < cost) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`Need ${cost} Coins! (Have: ${playerCoins})`);
    }
    return;
  }

  window.gameState.player.coins -= cost;
  dg.powerLevel = (dg.powerLevel || 1) + 1;
  dg.powerDiscount = 0; // Reset discount for next level
  dg.powerMilestoneAds = 0; // Reset milestone for next level

  saveAllState();
  updateDiamondGeneratorUI();

  if (typeof showFloatingToast === 'function') {
    showFloatingToast(`💎 Power Lv. ${dg.powerLevel} (+${formatDiamondDisplay(getDiamondsPerCycle())} 💎)`);
  }
}

// Action: Purchase Speed Upgrade
function purchaseDiamondSpeedUpgrade() {
  const dg = ensureDiamondGenState();
  if (!dg || !window.gameState) return;

  if (isSpeedMilestoneLocked()) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`🔒 Watch 3 Ads to unlock Level ${dg.speedLevel + 1}! (${dg.speedMilestoneAds || 0}/3)`);
    }
    return;
  }

  const cost = getDiamondSpeedUpgradeCost();
  const playerDiamonds = window.gameState.player.diamonds || 0;

  if (playerDiamonds < cost) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`Need ${cost} Diamonds! (Have: ${formatDiamondDisplay(playerDiamonds)})`);
    }
    return;
  }

  window.gameState.player.diamonds = Number((playerDiamonds - cost).toFixed(6));
  dg.speedLevel = (dg.speedLevel || 1) + 1;
  dg.speedDiscount = 0; // Reset discount for next level
  dg.speedMilestoneAds = 0; // Reset milestone for next level

  saveAllState();
  updateDiamondGeneratorUI();

  if (typeof showFloatingToast === 'function') {
    showFloatingToast(`⚡ Speed Lv. ${dg.speedLevel} (${getDiamondCycleDuration().toFixed(2)}s)`);
  }
}

// Ad Action: Watch Power Ad Discount (-10 Coins) with 30s Cooldown
function watchPowerAdDiscount() {
  const dg = ensureDiamondGenState();
  if (!dg) return;

  const now = Date.now();
  if (now - (dg.lastPowerAdTime || 0) < DG_AD_COOLDOWN_MS) {
    const rem = Math.ceil((DG_AD_COOLDOWN_MS - (now - dg.lastPowerAdTime)) / 1000);
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`⏳ Wait ${rem}s before next ad!`);
    }
    return;
  }

  const triggerReward = () => {
    dg.powerDiscount = (dg.powerDiscount || 0) + 10;
    dg.lastPowerAdTime = Date.now();
    saveAllState();
    updateDiamondGeneratorUI();
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('🏷️ -10 Coins Cost Reduced!');
    }
  };

  if (typeof showMonetagRewardedAd === 'function') {
    showMonetagRewardedAd({ onRewarded: triggerReward, onError: triggerReward });
  } else {
    triggerReward();
  }
}

// Ad Action: Watch Speed Ad Discount (-1 Diamond) with 30s Cooldown
function watchSpeedAdDiscount() {
  const dg = ensureDiamondGenState();
  if (!dg) return;

  const now = Date.now();
  if (now - (dg.lastSpeedAdTime || 0) < DG_AD_COOLDOWN_MS) {
    const rem = Math.ceil((DG_AD_COOLDOWN_MS - (now - dg.lastSpeedAdTime)) / 1000);
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`⏳ Wait ${rem}s before next ad!`);
    }
    return;
  }

  const triggerReward = () => {
    dg.speedDiscount = (dg.speedDiscount || 0) + 1;
    dg.lastSpeedAdTime = Date.now();
    saveAllState();
    updateDiamondGeneratorUI();
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('🏷️ -1 Diamond Cost Reduced!');
    }
  };

  if (typeof showMonetagRewardedAd === 'function') {
    showMonetagRewardedAd({ onRewarded: triggerReward, onError: triggerReward });
  } else {
    triggerReward();
  }
}

// Milestone Ad Actions (Compulsory 3 Ads on every 10 levels with 30s Cooldown)
function watchPowerMilestoneAd() {
  const dg = ensureDiamondGenState();
  if (!dg) return;

  const now = Date.now();
  if (now - (dg.lastPowerAdTime || 0) < DG_AD_COOLDOWN_MS) {
    const rem = Math.ceil((DG_AD_COOLDOWN_MS - (now - dg.lastPowerAdTime)) / 1000);
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`⏳ Wait ${rem}s before next ad!`);
    }
    return;
  }

  const triggerReward = () => {
    dg.powerMilestoneAds = Math.min(3, (dg.powerMilestoneAds || 0) + 1);
    dg.lastPowerAdTime = Date.now();
    saveAllState();
    updateDiamondGeneratorUI();
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`🎬 Milestone Ad ${dg.powerMilestoneAds}/3 Watched!`);
    }
  };

  if (typeof showMonetagRewardedAd === 'function') {
    showMonetagRewardedAd({ onRewarded: triggerReward, onError: triggerReward });
  } else {
    triggerReward();
  }
}

function watchSpeedMilestoneAd() {
  const dg = ensureDiamondGenState();
  if (!dg) return;

  const now = Date.now();
  if (now - (dg.lastSpeedAdTime || 0) < DG_AD_COOLDOWN_MS) {
    const rem = Math.ceil((DG_AD_COOLDOWN_MS - (now - dg.lastSpeedAdTime)) / 1000);
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`⏳ Wait ${rem}s before next ad!`);
    }
    return;
  }

  const triggerReward = () => {
    dg.speedMilestoneAds = Math.min(3, (dg.speedMilestoneAds || 0) + 1);
    dg.lastSpeedAdTime = Date.now();
    saveAllState();
    updateDiamondGeneratorUI();
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`🎬 Milestone Ad ${dg.speedMilestoneAds}/3 Watched!`);
    }
  };

  if (typeof showMonetagRewardedAd === 'function') {
    showMonetagRewardedAd({ onRewarded: triggerReward, onError: triggerReward });
  } else {
    triggerReward();
  }
}

// Tab Switch Function for Cost Reducers: [ POWER ] and [ SPEED ]
function switchDgCostTab(tab) {
  const tabPower = document.getElementById('tabPowerCost');
  const tabSpeed = document.getElementById('tabSpeedCost');
  const panelPower = document.getElementById('panelPowerCost');
  const panelSpeed = document.getElementById('panelSpeedCost');

  if (tab === 'power') {
    if (tabPower) tabPower.classList.add('active');
    if (tabSpeed) tabSpeed.classList.remove('active');
    if (panelPower) panelPower.classList.add('active');
    if (panelSpeed) panelSpeed.classList.remove('active');
  } else {
    if (tabPower) tabPower.classList.remove('active');
    if (tabSpeed) tabSpeed.classList.add('active');
    if (panelPower) panelPower.classList.remove('active');
    if (panelSpeed) panelSpeed.classList.add('active');
  }
}

// Save All Game State & Sync to Firebase
function saveAllState() {
  if (typeof saveGame === 'function') saveGame();
  if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
    window.firebaseSync.saveToCloudImmediate();
  }
  if (typeof updateUI === 'function') updateUI();
  if (typeof updateHomeUI === 'function') updateHomeUI();
}

// Main 100ms Generator Loop
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
      const cycleDuration = getDiamondCycleDuration();

      if (dg.generationStartTime) {
        dg.cycleProgress = Math.min(cycleDuration, (now - dg.generationStartTime) / 1000);
      } else {
        dg.cycleProgress = (dg.cycleProgress || 0) + dt;
      }

      if (dg.cycleProgress >= cycleDuration) {
        // Complete Cycle!
        dg.isRunning = false;
        dg.cycleProgress = 0;
        dg.generationStartTime = 0;

        const outputPerCycle = getDiamondsPerCycle();
        window.gameState.player.diamonds = Number(((window.gameState.player.diamonds || 0) + outputPerCycle).toFixed(6));
        dg.totalProduced = Number(((dg.totalProduced || 0) + outputPerCycle).toFixed(6));

        saveAllState();
        updateDiamondGeneratorUI();

        // Crystal pulse
        document.querySelectorAll('.diamond-crystal-node').forEach(node => {
          node.classList.add('cycle-complete-pulse');
          setTimeout(() => node.classList.remove('cycle-complete-pulse'), 800);
        });

        if (typeof showFloatingToast === 'function') {
          showFloatingToast(`💎 Won +${formatDiamondDisplay(outputPerCycle)} Diamond!`);
        }
        if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') {
          sfx.playLevelUpSound();
        }
      }
    }

    updateDiamondGeneratorRealtime();
  }, 100);
}

// Real-Time Smooth Progress Updates
function updateDiamondGeneratorRealtime() {
  const dg = ensureDiamondGenState();
  if (!dg) return;

  const cycleDuration = getDiamondCycleDuration();
  const currentProgress = dg.cycleProgress || 0;
  const remainingSeconds = dg.isRunning ? Math.max(0, cycleDuration - currentProgress) : cycleDuration;
  const percent = dg.isRunning ? Math.min(100, Math.max(0, (currentProgress / cycleDuration) * 100)) : 0;
  const energyCost = getDiamondGenEnergyCost();

  // 1. Countdown Text
  document.querySelectorAll('#diamondCountdownText, .diamond-countdown-text, #diamondCountdownTextHome').forEach(el => {
    if (el) el.textContent = `${remainingSeconds.toFixed(1)}s`;
  });

  // 2. Circular SVG Progress Ring
  const circumference = 439.82;
  const offset = dg.isRunning ? (circumference - (percent / 100) * circumference) : circumference;
  document.querySelectorAll('#diamondProgressRing, .diamond-ring-fill, #diamondProgressRingHome').forEach(ring => {
    if (ring) ring.style.strokeDashoffset = offset.toFixed(2);
  });

  // 3. Start Generation Buttons
  const startBtnText = document.getElementById('btnStartDiamondGenText');
  const startBtn = document.getElementById('btnStartDiamondGen');
  if (startBtn) {
    if (dg.isRunning) {
      if (startBtnText) startBtnText.textContent = `⚡ GENERATING... (${remainingSeconds.toFixed(1)}s)`;
      startBtn.classList.add('generating-active');
      startBtn.disabled = true;
    } else {
      if (startBtnText) startBtnText.textContent = `⚡ START GENERATION (${energyCost} ⚡)`;
      startBtn.classList.remove('generating-active');
      startBtn.disabled = false;
    }
  }

  // Home Start Button (if present)
  document.querySelectorAll('#btnStartDiamondGenHome').forEach(btn => {
    if (dg.isRunning) {
      btn.innerHTML = `<span>⚡ GENERATING (${remainingSeconds.toFixed(1)}s)</span>`;
      btn.disabled = true;
    } else {
      btn.innerHTML = `<span>⚡ START (${energyCost} ⚡)</span>`;
      btn.disabled = false;
    }
  });

  // 4. Status Badge
  const statusBadge = document.getElementById('dgStatusBadge');
  if (statusBadge) {
    if (dg.isRunning) {
      statusBadge.textContent = 'ACTIVE';
      statusBadge.classList.add('active');
    } else {
      statusBadge.textContent = 'READY';
      statusBadge.classList.remove('active');
    }
  }

  // 5. Cooldowns on Ad Buttons (30s Timer)
  const now = Date.now();
  const powerCdRem = Math.max(0, Math.ceil((DG_AD_COOLDOWN_MS - (now - (dg.lastPowerAdTime || 0))) / 1000));
  const speedCdRem = Math.max(0, Math.ceil((DG_AD_COOLDOWN_MS - (now - (dg.lastSpeedAdTime || 0))) / 1000));

  const pAdBtn = document.getElementById('btnPowerAdDiscount');
  const pAdTxt = document.getElementById('powerAdBtnText');
  if (pAdBtn && pAdTxt) {
    if (powerCdRem > 0) {
      pAdTxt.textContent = `⏳ Wait ${powerCdRem}s (Ad Cooldown)`;
      pAdBtn.classList.add('cooldown');
    } else {
      pAdTxt.textContent = 'Watch Ad (-10 Coins Cost)';
      pAdBtn.classList.remove('cooldown');
    }
  }

  const sAdBtn = document.getElementById('btnSpeedAdDiscount');
  const sAdTxt = document.getElementById('speedAdBtnText');
  if (sAdBtn && sAdTxt) {
    if (speedCdRem > 0) {
      sAdTxt.textContent = `⏳ Wait ${speedCdRem}s (Ad Cooldown)`;
      sAdBtn.classList.add('cooldown');
    } else {
      sAdTxt.textContent = 'Watch Ad (-1 Diamond Cost)';
      sAdBtn.classList.remove('cooldown');
    }
  }

  // Milestone ad buttons
  const pMBtn = document.getElementById('btnPowerMilestoneAd');
  if (pMBtn) {
    if (powerCdRem > 0) {
      pMBtn.innerHTML = `<span>⏳ Wait ${powerCdRem}s</span>`;
      pMBtn.classList.add('cooldown');
    } else {
      pMBtn.innerHTML = '<span>🎬 Watch Required Ad (30s Timer)</span>';
      pMBtn.classList.remove('cooldown');
    }
  }

  const sMBtn = document.getElementById('btnSpeedMilestoneAd');
  if (sMBtn) {
    if (speedCdRem > 0) {
      sMBtn.innerHTML = `<span>⏳ Wait ${speedCdRem}s</span>`;
      sMBtn.classList.add('cooldown');
    } else {
      sMBtn.innerHTML = '<span>🎬 Watch Required Ad (30s Timer)</span>';
      sMBtn.classList.remove('cooldown');
    }
  }
}

// Full UI Synchronizer
function updateDiamondGeneratorUI() {
  const dg = ensureDiamondGenState();
  if (!dg || !window.gameState) return;

  const rate = getDiamondsPerCycle();
  const cycleDur = getDiamondCycleDuration();
  const powerCost = getDiamondPowerUpgradeCost();
  const speedCost = getDiamondSpeedUpgradeCost();

  // Resource Pills
  const dVal = document.getElementById('dgStickyDiamonds');
  if (dVal) dVal.textContent = formatDiamondDisplay(window.gameState.player.diamonds);

  const cVal = document.getElementById('dgStickyCoins');
  if (cVal) cVal.textContent = String(window.gameState.player.coins || 0);

  const eVal = document.getElementById('dgStickyEnergy');
  if (eVal) eVal.textContent = String(Math.floor(window.gameState.reactor?.currentEnergy || 0));

  // Rate Tags
  const rateTag = document.getElementById('dgRateHeaderBadge');
  if (rateTag) rateTag.textContent = `+${formatDiamondDisplay(rate)} 💎 / ${cycleDur.toFixed(2)}s`;

  const coreRate = document.getElementById('diamondCoreRateLabel');
  if (coreRate) coreRate.textContent = `+${formatDiamondDisplay(rate)} 💎`;

  // Power Upgrade Card
  const pBadge = document.getElementById('ducOutputLevelBadge');
  if (pBadge) pBadge.textContent = `Lv. ${dg.powerLevel}`;

  const pSub = document.getElementById('ducOutputSub');
  if (pSub) pSub.textContent = `Rate: +${formatDiamondDisplay(rate)} 💎/cycle`;

  const pCostTxt = document.getElementById('btnUpgradeOutputCostText');
  if (pCostTxt) pCostTxt.textContent = `${powerCost} 🪙`;

  const pUpgBtn = document.getElementById('btnUpgradeOutput');
  const pLocked = isPowerMilestoneLocked();
  if (pUpgBtn) {
    if (pLocked) {
      pUpgBtn.classList.add('locked');
      const pUpgTxt = document.getElementById('btnUpgradeOutputText');
      if (pUpgTxt) pUpgTxt.textContent = '🔒 Watch 3 Ads to Unlock';
    } else {
      pUpgBtn.classList.remove('locked');
      const pUpgTxt = document.getElementById('btnUpgradeOutputText');
      if (pUpgTxt) pUpgTxt.textContent = 'UPGRADE (+0.000001 💎)';
    }
  }

  // Power Milestone Box
  const pMBox = document.getElementById('powerMilestoneBox');
  const pMProg = document.getElementById('powerMilestoneProgressText');
  if (pMBox && pMProg) {
    if (dg.powerLevel % 10 === 0) {
      pMBox.style.display = 'flex';
      pMProg.textContent = `${dg.powerMilestoneAds || 0} / 3 Ads`;
    } else {
      pMBox.style.display = 'none';
    }
  }

  const pDiscBadge = document.getElementById('powerDiscountBadge');
  if (pDiscBadge) pDiscBadge.textContent = `-${dg.powerDiscount || 0} 🪙 DISCOUNT`;

  // Speed Upgrade Card
  const sBadge = document.getElementById('ducSpeedLevelBadge');
  if (sBadge) sBadge.textContent = `Lv. ${dg.speedLevel}`;

  const sSub = document.getElementById('ducSpeedSub');
  if (sSub) sSub.textContent = `Cycle: ${cycleDur.toFixed(2)}s (-0.01s)`;

  const sCostTxt = document.getElementById('btnUpgradeSpeedCostText');
  if (sCostTxt) sCostTxt.textContent = `${speedCost} 💎`;

  const sUpgBtn = document.getElementById('btnUpgradeSpeed');
  const sLocked = isSpeedMilestoneLocked();
  if (sUpgBtn) {
    if (sLocked) {
      sUpgBtn.classList.add('locked');
      const sUpgTxt = document.getElementById('btnUpgradeSpeedText');
      if (sUpgTxt) sUpgTxt.textContent = '🔒 Watch 3 Ads to Unlock';
    } else {
      sUpgBtn.classList.remove('locked');
      const sUpgTxt = document.getElementById('btnUpgradeSpeedText');
      if (sUpgTxt) sUpgTxt.textContent = 'OVERCLOCK (-0.01s)';
    }
  }

  // Speed Milestone Box
  const sMBox = document.getElementById('speedMilestoneBox');
  const sMProg = document.getElementById('speedMilestoneProgressText');
  if (sMBox && sMProg) {
    if (dg.speedLevel % 10 === 0) {
      sMBox.style.display = 'flex';
      sMProg.textContent = `${dg.speedMilestoneAds || 0} / 3 Ads`;
    } else {
      sMBox.style.display = 'none';
    }
  }

  const sDiscBadge = document.getElementById('speedDiscountBadge');
  if (sDiscBadge) sDiscBadge.textContent = `-${dg.speedDiscount || 0} 💎 DISCOUNT`;

  // Update Home Card if present
  const dgeRate = document.getElementById('dgeHomeRateVal');
  if (dgeRate) dgeRate.textContent = `+${formatDiamondDisplay(rate)} 💎 / ${cycleDur.toFixed(2)}s`;

  updateDiamondGeneratorRealtime();
}

// Lifecycle Hooks
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
window.watchPowerAdDiscount = watchPowerAdDiscount;
window.watchSpeedAdDiscount = watchSpeedAdDiscount;
window.watchPowerMilestoneAd = watchPowerMilestoneAd;
window.watchSpeedMilestoneAd = watchSpeedMilestoneAd;
window.switchDgCostTab = switchDgCostTab;
window.updateDiamondGeneratorUI = updateDiamondGeneratorUI;
window.updateDiamondGeneratorRealtime = updateDiamondGeneratorRealtime;
window.formatDiamondDisplay = formatDiamondDisplay;
window.getDiamondsPerCycle = getDiamondsPerCycle;
window.getDiamondCycleDuration = getDiamondCycleDuration;
