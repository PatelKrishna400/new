/* ==========================================================================
   QUANTUM DIAMOND GENERATOR & PIGGY BANK ENGINE (diamond-generator.js)
   - Strict 100 Energy = 60 Seconds Generation Rule
   - Does NOT auto-start on page load; strictly requires user energy spend
   - Page refresh does NOT restart or reset timer; resumes or completes seamlessly
   - All rewards go directly into the 30-Day Piggy Bank Storage
   - Collect from Piggy Bank to Main Balance with duplicate prevention
   - +1 Day Storage Extension via Rewarded Ad
   - Separate Power & Speed Ad discounts with explicit activation
   - Firebase Realtime Database is authoritative source of truth
   ========================================================================== */

let _dgProductionInterval = null;
let _dgLastTickTime = Date.now();

// Constants
const DG_BASE_CYCLE_SEC = 300.00; // 5 Minutes (300 seconds)
const DG_BASE_OUTPUT_RATE = 0.00000001; // 0.00000001 Diamonds per 5 min cycle
const DG_REQUIRED_ENERGY = 100; // 100 Energy = 60s Generation
const DG_AD_COOLDOWN_MS = 30 * 1000; // 30s between ads
const PIGGY_RETENTION_MS = 30 * 24 * 60 * 60 * 1000; // 30-Day retention rule

// Format Diamond display (up to 6 decimals)
function formatDiamondDisplay(num) {
  if (num === undefined || num === null || isNaN(num)) return '0.00000000';
  return Number(num).toFixed(8);
}


// Format Diamond Timer with decimals: e.g. 05:00.0, 04:59.8
function formatDiamondTimer(seconds) {
  const totalSecs = Math.max(0, Math.ceil(Number(seconds) || 0));
  const mins = Math.floor(totalSecs / 60);
  const remainingSecs = totalSecs % 60;
  return `${String(mins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
}
window.formatDiamondTimer = formatDiamondTimer;

// Initializer & State Verification for Diamond Generator
function ensureDiamondGenState() {
  if (!window.gameState) return null;
  if (!window.gameState.diamondGenerator) {
    window.gameState.diamondGenerator = {};
  }
  const dg = window.gameState.diamondGenerator;

  if (dg.powerLevel === undefined) dg.powerLevel = dg.productionLevel || 1;
  if (dg.speedLevel === undefined) dg.speedLevel = dg.timeLevel || 1;
  if (dg.isRunning === undefined) dg.isRunning = false;
  if (dg.cycleProgress === undefined || isNaN(dg.cycleProgress)) dg.cycleProgress = 0;
  if (dg.generationStartTime === undefined) dg.generationStartTime = 0;
  if (dg.totalProduced === undefined) dg.totalProduced = 0;
  if (dg.status === undefined) dg.status = 'ready';
  if (dg.claimed === undefined) dg.claimed = true;

  // Discounts & Ad Timers
  if (dg.powerDiscount === undefined) dg.powerDiscount = 0;
  if (dg.speedDiscount === undefined) dg.speedDiscount = 0;
  if (dg.lastPowerAdTime === undefined) dg.lastPowerAdTime = 0;
  if (dg.lastSpeedAdTime === undefined) dg.lastSpeedAdTime = 0;

  // Milestones
  if (dg.powerMilestoneAds === undefined) dg.powerMilestoneAds = 0;
  if (dg.speedMilestoneAds === undefined) dg.speedMilestoneAds = 0;

  return dg;
}

// Initializer & State Verification for Piggy Bank
function ensurePiggyBankState() {
  if (!window.gameState) return null;
  if (!window.gameState.piggyBank) {
    window.gameState.piggyBank = {
      totalStored: 0,
      extensionDays: 0,
      records: []
    };
  }
  const pb = window.gameState.piggyBank;
  if (pb.extensionDays === undefined) pb.extensionDays = 0;
  if (!Array.isArray(pb.records)) pb.records = [];

  return pb;
}

// Energy Cost: Exactly 100 Energy per cycle
function getDiamondGenEnergyCost() {
  return DG_REQUIRED_ENERGY;
}

// Diamond Output Rate: 0.000001 * powerLevel
function getDiamondsPerCycle() {
  const dg = ensureDiamondGenState();
  if (!dg) return DG_BASE_OUTPUT_RATE;
  const pLvl = Math.max(1, parseInt(dg.powerLevel, 10) || 1);
  return Number((pLvl * DG_BASE_OUTPUT_RATE).toFixed(8));
}

// Cycle Duration: Exactly 60.00s base (speed upgrade reduces slightly down to 30s)
function getDiamondCycleDuration() {
  const dg = ensureDiamondGenState();
  if (!dg) return DG_BASE_CYCLE_SEC;
  const sLvl = Math.max(1, parseInt(dg.speedLevel, 10) || 1);
  const dur = DG_BASE_CYCLE_SEC - (sLvl - 1) * 2.00;
  return Math.max(120.00, Number(dur.toFixed(2)));
}

// Upgrade Costs
function getDiamondPowerUpgradeCost() {
  const dg = ensureDiamondGenState();
  if (!dg) return 50;
  const curLvl = Math.max(1, parseInt(dg.powerLevel, 10) || 1);
  const baseCost = curLvl * 50;
  const discount = Math.max(0, parseInt(dg.powerDiscount, 10) || 0);
  return Math.max(10, baseCost - discount);
}

function getDiamondSpeedUpgradeCost() {
  const dg = ensureDiamondGenState();
  if (!dg) return 10;
  const curLvl = Math.max(1, parseInt(dg.speedLevel, 10) || 1);
  const baseCost = 10 + (curLvl - 1) * 5;
  const discount = Math.max(0, parseInt(dg.speedDiscount, 10) || 0);
  return Math.max(1, baseCost - discount);
}

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

// ==========================================================================
// PIGGY BANK STORAGE & 30-DAY RETENTION ENGINE
// ==========================================================================
function getRecordExpiryTimestamp(record) {
  const pb = ensurePiggyBankState();
  const extensionMs = (pb ? (pb.extensionDays || 0) : 0) * 86400000;
  const baseCreated = Number(record.createdAt || Date.now());
  return baseCreated + PIGGY_RETENTION_MS + extensionMs;
}

function isPiggyRecordActive(record) {
  if (!record || record.collected) return false;
  return true; // Unlimited retention: diamonds never expire!
}

function getPiggyBankCollectibleTotal() {
  const pb = ensurePiggyBankState();
  if (!pb || !Array.isArray(pb.records)) return 0;
  let total = 0;
  pb.records.forEach(rec => {
    if (isPiggyRecordActive(rec)) {
      total += Number(rec.amount || 0);
    }
  });
  return Number(total.toFixed(6));
}

// Deposit newly generated diamonds into Piggy Bank
function depositDiamondToPiggyBank(amount, source = 'diamond_generator') {
  const pb = ensurePiggyBankState();
  if (!pb) return;

  const now = Date.now();
  const record = {
    id: `pgr_${now}_${Math.random().toString(36).substr(2, 5)}`,
    amount: Number(amount),
    source: source,
    createdAt: now,
    collected: false,
    collectedAt: 0
  };

  pb.records.unshift(record);
  // Unlimited storage capacity
  pb.totalStored = getPiggyBankCollectibleTotal();
}

// Helper to get total verified completed website tasks
function getCompletedWebsiteTasksCount() {
  if (!window.gameState) return 0;
  const pCount = Number(window.gameState.player?.websiteTasksCompleted || 0);
  const claimedWeb = window.gameState.tasksState?.claimedWebsite || {};
  const claimedCount = Object.keys(claimedWeb).filter(k => claimedWeb[k]).length;
  return Math.max(pCount, claimedCount);
}

function showPiggyWebsiteTaskNotice(completedCount) {
  const modal = document.getElementById('piggyWebTasksModal');
  const countLabel = document.getElementById('piggyWebTasksCountLabel');
  if (countLabel) countLabel.textContent = `${completedCount} / 5 Completed`;
  if (modal) modal.style.display = 'flex';
}

function closePiggyWebTasksModal() {
  const modal = document.getElementById('piggyWebTasksModal');
  if (modal) modal.style.display = 'none';
}

function goToWebsiteTasksFromPiggy() {
  closePiggyWebTasksModal();
  if (typeof switchPage === 'function') {
    switchPage('tasks');
    setTimeout(() => {
      if (typeof switchTaskSubtab === 'function') {
        switchTaskSubtab('website');
      }
    }, 50);
  }
}

// Action: Collect Diamonds from Piggy Bank to Main Balance
function collectPiggyBankDiamonds() {
  const pb = ensurePiggyBankState();
  if (!pb || !window.gameState) return;

  const collectible = getPiggyBankCollectibleTotal();
  // Must have at least 1 diamond accumulated
  if (collectible < 1) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('ℹ️ You need at least 1.0 💎 in Piggy Bank to collect!');
    }
    return;
  }

  // Requirement: Must have completed at least 5 website tasks
  const completedWebTasks = getCompletedWebsiteTasksCount();
  if (completedWebTasks < 5) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`⚠️ Complete 5 Website Tasks to collect! (${completedWebTasks}/5 completed)`);
    }
    showPiggyWebsiteTaskNotice(completedWebTasks);
    return;
  }

  // Mark all active records as collected
  const now = Date.now();
  let collectedCount = 0;
  pb.records.forEach(rec => {
    if (isPiggyRecordActive(rec)) {
      rec.collected = true;
      rec.collectedAt = now;
      collectedCount++;
    }
  });

  // Credit to main player balance
  window.gameState.player.diamonds = Number(((window.gameState.player.diamonds || 0) + collectible).toFixed(6));
  if (!window.gameState.player.diamondWins) window.gameState.player.diamondWins = 0;
  window.gameState.player.diamondWins += collectedCount;

  pb.totalStored = getPiggyBankCollectibleTotal();

  saveAllState();
  updateDiamondGeneratorUI();

  if (typeof showFloatingToast === 'function') {
    showFloatingToast(`🎉 Collected +${formatDiamondDisplay(collectible)} 💎 to Balance!`);
  }
  if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') {
    sfx.playLevelUpSound();
  }
}

// Action: Extend Piggy Bank Storage by +1 Day via Ad
function extendPiggyBankWithAd() {
  const pb = ensurePiggyBankState();
  if (!pb) return;

  const triggerExtension = () => {
    pb.extensionDays = (pb.extensionDays || 0) + 1;
    saveAllState();
    updateDiamondGeneratorUI();

    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`⏳ +1 Day Added! Storage extended by 24 hours.`);
    }
    if (typeof sfx !== 'undefined' && typeof sfx.playBuySound === 'function') {
      sfx.playBuySound();
    }
  };

  if (typeof showMonetagRewardedAd === 'function') {
    showMonetagRewardedAd({ onRewarded: triggerExtension, onError: triggerExtension });
  } else {
    triggerExtension();
  }
}

// Toggle collapsible records view
function togglePiggyRecords() {
  const listEl = document.getElementById('piggyRecordsList');
  const arrowEl = document.getElementById('piggyRecordsArrow');
  if (!listEl) return;

  const isOpen = listEl.style.display !== 'none';
  listEl.style.display = isOpen ? 'none' : 'flex';
  if (arrowEl) arrowEl.classList.toggle('open', !isOpen);
}

// ==========================================================================
// DIAMOND GENERATION ACTIONS (STRICT ENERGY & REFRESH SAFETY)
// ==========================================================================

// Action: Start Diamond Generation
function startDiamondGeneration() {
  if (!window.gameState) return;
  const dg = ensureDiamondGenState();
  if (!dg) return;

  const cycleDuration = getDiamondCycleDuration();

  // If already generating, show remaining time
  if (dg.isRunning) {
    const elapsed = dg.generationStartTime ? Math.max(0, (Date.now() - dg.generationStartTime) / 1000) : (dg.cycleProgress || 0);
    const rem = Math.max(0, cycleDuration - elapsed);
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`⚡ Generation in progress: ${rem.toFixed(1)}s remaining`);
    }
    return;
  }

  const energyCost = getDiamondGenEnergyCost();
  const currentEnergy = Math.floor(window.gameState.reactor?.currentEnergy || 0);

  // Strict: Cannot start without 100 Energy
  if (currentEnergy < energyCost) {
    dg.status = 'not_enough_energy';
    updateDiamondGeneratorUI();
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`⚠️ Need ${energyCost} ⚡ Energy! (You have: ${currentEnergy}). Earn energy first!`);
    }
    if (typeof sfx !== 'undefined' && typeof sfx.playErrorSound === 'function') {
      sfx.playErrorSound();
    }
    return;
  }

  // Deduct 100 Energy authoritative
  window.gameState.reactor.currentEnergy -= energyCost;
  dg.isRunning = true;
  dg.status = 'generating';
  dg.cycleProgress = 0;
  dg.generationStartTime = Date.now();
  dg.claimed = false;

  saveAllState();
  updateDiamondGeneratorUI();
  updateDiamondGeneratorRealtime();

  if (typeof showFloatingToast === 'function') {
    showFloatingToast(`⚡ Diamond Generation Started (-${energyCost} ⚡)`);
  }
  if (typeof sfx !== 'undefined' && typeof sfx.playTapSound === 'function') {
    sfx.playTapSound(2);
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
  dg.powerDiscount = 0;
  dg.powerMilestoneAds = 0;

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
  dg.speedDiscount = 0;
  dg.speedMilestoneAds = 0;

  saveAllState();
  updateDiamondGeneratorUI();

  if (typeof showFloatingToast === 'function') {
    showFloatingToast(`⚡ Speed Lv. ${dg.speedLevel} (${getDiamondCycleDuration().toFixed(2)}s)`);
  }
}

// Power Ad: Reduces coin cost by 10
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

// Speed Ad: Reduces diamond cost by 1
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

// Milestones
function watchPowerMilestoneAd() {
  const dg = ensureDiamondGenState();
  if (!dg) return;
  const now = Date.now();
  if (now - (dg.lastPowerAdTime || 0) < DG_AD_COOLDOWN_MS) {
    const rem = Math.ceil((DG_AD_COOLDOWN_MS - (now - dg.lastPowerAdTime)) / 1000);
    if (typeof showFloatingToast === 'function') showFloatingToast(`⏳ Wait ${rem}s before next ad!`);
    return;
  }
  const triggerReward = () => {
    dg.powerMilestoneAds = Math.min(3, (dg.powerMilestoneAds || 0) + 1);
    dg.lastPowerAdTime = Date.now();
    saveAllState();
    updateDiamondGeneratorUI();
    if (typeof showFloatingToast === 'function') showFloatingToast(`🎬 Milestone Ad ${dg.powerMilestoneAds}/3 Watched!`);
  };
  if (typeof showMonetagRewardedAd === 'function') {
    showMonetagRewardedAd({ onRewarded: triggerReward, onError: triggerReward });
  } else triggerReward();
}

function watchSpeedMilestoneAd() {
  const dg = ensureDiamondGenState();
  if (!dg) return;
  const now = Date.now();
  if (now - (dg.lastSpeedAdTime || 0) < DG_AD_COOLDOWN_MS) {
    const rem = Math.ceil((DG_AD_COOLDOWN_MS - (now - dg.lastSpeedAdTime)) / 1000);
    if (typeof showFloatingToast === 'function') showFloatingToast(`⏳ Wait ${rem}s before next ad!`);
    return;
  }
  const triggerReward = () => {
    dg.speedMilestoneAds = Math.min(3, (dg.speedMilestoneAds || 0) + 1);
    dg.lastSpeedAdTime = Date.now();
    saveAllState();
    updateDiamondGeneratorUI();
    if (typeof showFloatingToast === 'function') showFloatingToast(`🎬 Milestone Ad ${dg.speedMilestoneAds}/3 Watched!`);
  };
  if (typeof showMonetagRewardedAd === 'function') {
    showMonetagRewardedAd({ onRewarded: triggerReward, onError: triggerReward });
  } else triggerReward();
}

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

function saveAllState() {
  if (typeof saveGame === 'function') saveGame();
  if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
    window.firebaseSync.saveToCloudImmediate();
  }
  if (typeof updateUI === 'function') updateUI();
  if (typeof updateHomeUI === 'function') updateHomeUI();
}

// ==========================================================================
// PERSISTENT GENERATOR TICK LOOP
// ==========================================================================
function startDiamondGeneratorLoop() {
  if (_dgProductionInterval) clearInterval(_dgProductionInterval);
  _dgLastTickTime = Date.now();

  _dgProductionInterval = setInterval(() => {
    const now = Date.now();
    if (!window.gameState) return;
    const dg = ensureDiamondGenState();
    if (!dg) return;

    const cycleDuration = getDiamondCycleDuration();

    // STRICT: Only progress if explicitly started with energy!
    if (dg.isRunning && dg.generationStartTime > 0) {
      const startTime = Number(dg.generationStartTime) || 0;
      if (startTime <= 0) {
        dg.isRunning = false;
        dg.cycleProgress = 0;
        dg.status = 'ready';
        updateDiamondGeneratorRealtime();
        return;
      }

      const elapsedSeconds = Math.max(0, (now - startTime) / 1000);
      dg.cycleProgress = Math.min(cycleDuration, elapsedSeconds);

      if (elapsedSeconds >= cycleDuration) {
        // Complete Cycle authoritative & reward directly to player diamonds
        if (!dg.claimed) {
          dg.claimed = true;
          dg.isRunning = false;
          dg.cycleProgress = 0;
          dg.generationStartTime = 0;
          dg.status = 'completed';

          const outputPerCycle = getDiamondsPerCycle();
          dg.totalProduced = Number(((dg.totalProduced || 0) + outputPerCycle).toFixed(8));

          // IMMEDIATELY CREATE & CREDIT DIAMOND DIRECTLY TO PLAYER BALANCE
          window.gameState.player.diamonds = Number(((window.gameState.player.diamonds || 0) + outputPerCycle).toFixed(8));
          if (!window.gameState.player.diamondWins) window.gameState.player.diamondWins = 0;
          window.gameState.player.diamondWins += 1;

          // Also record in Piggy Bank for history / vault storage
          depositDiamondToPiggyBank(outputPerCycle, 'diamond_generator');

          saveAllState();
          updateDiamondGeneratorUI();

          // Crystal pulse animation
          document.querySelectorAll('.diamond-crystal-node').forEach(node => {
            node.classList.add('cycle-complete-pulse');
            setTimeout(() => node.classList.remove('cycle-complete-pulse'), 800);
          });

          if (typeof showFloatingToast === 'function') {
            showFloatingToast(`💎 +${formatDiamondDisplay(outputPerCycle)} Diamond Generated & Stored!`);
          }
          if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') {
            sfx.playLevelUpSound();
          }
        } else {
          dg.isRunning = false;
          dg.generationStartTime = 0;
          dg.cycleProgress = 0;
          dg.status = 'ready';
        }
      }
    }

    updateDiamondGeneratorRealtime();
  }, 100);
}

// Real-Time Smooth Progress Updates (Second-by-second clean countdown + linear progress)
function updateDiamondGeneratorRealtime() {
  const dg = ensureDiamondGenState();
  if (!dg) return;

  const cycleDuration = getDiamondCycleDuration();
  const startTime = Number(dg.generationStartTime) || 0;
  
  let remainingSeconds = cycleDuration;
  let percent = 0;

  if (dg.isRunning && startTime > 0) {
    const elapsedSeconds = Math.max(0, (Date.now() - startTime) / 1000);
    remainingSeconds = Math.max(0, cycleDuration - elapsedSeconds);
    percent = Math.min(100, Math.max(0, (elapsedSeconds / cycleDuration) * 100));
  } else {
    // If not using 100 energy in diamond page, timer does NOT do any action!
    remainingSeconds = 0;
    percent = 0;
  }

  const currentEnergy = Math.floor(window.gameState?.reactor?.currentEnergy || 0);

  // Sync sticky live energy badge on top
  const stickyEnergyEl = document.getElementById('dgStickyEnergy');
  if (stickyEnergyEl) stickyEnergyEl.textContent = String(currentEnergy);

  // 1. Countdown Text: Idle at 00:00 until 100 energy used
  const formattedTime = (dg.isRunning && startTime > 0) ? formatDiamondTimer(remainingSeconds) : '00:00';
  document.querySelectorAll('#diamondCountdownText, .diamond-countdown-text, #diamondCountdownTextHome').forEach(el => {
    if (el && el.textContent !== formattedTime) {
      el.textContent = formattedTime;
    }
  });

  const rateLabelEl = document.getElementById('diamondCoreRateLabel');
  if (rateLabelEl) {
    rateLabelEl.textContent = (dg.isRunning && startTime > 0) ? `+${formatDiamondDisplay(getDiamondsPerCycle())} 💎` : 'Needs 100 ⚡';
  }

  // 2. Circular SVG Progress Ring
  const circumference = 439.82;
  const offset = dg.isRunning ? Math.max(0, circumference - (percent / 100) * circumference) : circumference;
  document.querySelectorAll('#diamondProgressRing, .diamond-ring-fill, #diamondProgressRingHome').forEach(ring => {
    if (ring) ring.style.strokeDashoffset = offset.toFixed(2);
  });

  // 3. Linear Loading Progress Bar
  document.querySelectorAll('#diamondLinearBar, .diamond-linear-fill, #diamondLinearBarHome, .dg-progress-bar-fill').forEach(bar => {
    if (bar) bar.style.width = `${percent.toFixed(2)}%`;
  });

  // 4. Status Badge State Display (Ready, Generating, Completed, Not Enough Energy)
  const statusBadge = document.getElementById('dgStatusBadge');
  if (statusBadge) {
    statusBadge.className = 'dg-status-tag';
    if (dg.isRunning) {
      statusBadge.textContent = 'GENERATING';
      statusBadge.classList.add('generating');
    } else if (dg.status === 'completed') {
      statusBadge.textContent = 'COMPLETED';
      statusBadge.classList.add('completed');
    } else if (currentEnergy < DG_REQUIRED_ENERGY) {
      statusBadge.textContent = 'NOT ENOUGH ENERGY';
      statusBadge.classList.add('not-enough-energy');
    } else {
      statusBadge.textContent = 'READY';
      statusBadge.classList.add('ready');
    }
  }

  // 5. Start Generation Button: Strict 100 Energy per diamond generated
  const startBtnText = document.getElementById('btnStartDiamondGenText');
  const startBtn = document.getElementById('btnStartDiamondGen');
  if (startBtn) {
    if (dg.isRunning) {
      if (startBtnText) startBtnText.textContent = `⚡ GENERATING... (${formattedTime})`;
      startBtn.classList.add('generating-active');
      startBtn.disabled = true;
    } else if (currentEnergy < DG_REQUIRED_ENERGY) {
      if (startBtnText) startBtnText.textContent = `⚠️ NEED 100 ⚡ (HAVE ${currentEnergy} ⚡)`;
      startBtn.classList.remove('generating-active');
      startBtn.disabled = false;
    } else {
      if (startBtnText) startBtnText.textContent = '⚡ START GENERATION (100 ⚡)';
      startBtn.classList.remove('generating-active');
      startBtn.disabled = false;
    }
  }

  // Home Start Button Sync
  document.querySelectorAll('#btnStartDiamondGenHome').forEach(btn => {
    if (dg.isRunning) {
      btn.innerHTML = `<span>⚡ GENERATING (${formattedTime})</span>`;
      btn.disabled = true;
    } else if (currentEnergy < DG_REQUIRED_ENERGY) {
      btn.innerHTML = `<span>⚠️ NEED 100 ⚡</span>`;
      btn.disabled = false;
    } else {
      btn.innerHTML = `<span>⚡ START (100 ⚡)</span>`;
      btn.disabled = false;
    }
  });

  // 6. Cooldowns on Ad Buttons
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
}

// Full UI Synchronizer
function updateDiamondGeneratorUI() {
  const dg = ensureDiamondGenState();
  const pb = ensurePiggyBankState();
  if (!dg || !window.gameState) return;

  const rate = getDiamondsPerCycle();
  const cycleDur = getDiamondCycleDuration();
  const powerCost = getDiamondPowerUpgradeCost();
  const speedCost = getDiamondSpeedUpgradeCost();

  // Resource Sticky Pills
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

  // Piggy Bank UI
  const piggyCollectible = getPiggyBankCollectibleTotal();
  const piggyAmountEl = document.getElementById('piggyStoredAmount');
  if (piggyAmountEl) piggyAmountEl.textContent = formatDiamondDisplay(piggyCollectible);

  const piggyBtn = document.getElementById('btnCollectPiggyBank');
  const piggyNoticeEl = document.getElementById('piggyCollectNotice');
  if (piggyBtn) {
    if (piggyCollectible >= 1) {
      piggyBtn.style.display = 'flex';
      piggyBtn.disabled = false;
      piggyBtn.classList.add('can-collect');
      if (piggyNoticeEl) piggyNoticeEl.style.display = 'none';
    } else {
      piggyBtn.style.display = 'none';
      piggyBtn.disabled = true;
      piggyBtn.classList.remove('can-collect');
      if (piggyNoticeEl) {
        piggyNoticeEl.style.display = 'block';
        piggyNoticeEl.textContent = `Collect button appears when at least 1.0 💎 is accumulated in Piggy Bank (Current: ${formatDiamondDisplay(piggyCollectible)} 💎). Complete 5 Website Tasks to collect.`;
      }
    }
  }

  const extensionBadge = document.getElementById('piggyExtensionBadge');
  if (extensionBadge) {
    extensionBadge.textContent = `+${pb ? (pb.extensionDays || 0) : 0} Days Extended`;
  }

  const expiryStatusEl = document.getElementById('piggyExpiryStatus');
  if (expiryStatusEl && pb) {
    // Find oldest active deposit
    const activeRecords = (pb.records || []).filter(r => isPiggyRecordActive(r));
    if (activeRecords.length > 0) {
      const oldest = activeRecords[activeRecords.length - 1];
      const expiryTime = getRecordExpiryTimestamp(oldest);
      const remainingHours = Math.max(0, Math.floor((expiryTime - Date.now()) / (1000 * 3600)));
      const days = Math.floor(remainingHours / 24);
      const hrs = remainingHours % 24;
      expiryStatusEl.textContent = `Oldest Deposit: Expires in ${days}d ${hrs}h`;
    } else {
      expiryStatusEl.textContent = 'Storage: Ready for generated diamonds';
    }
  }

  // Render Records
  renderPiggyBankRecordsList();

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

  // Speed Upgrade Card
  const sBadge = document.getElementById('ducSpeedLevelBadge');
  if (sBadge) sBadge.textContent = `Lv. ${dg.speedLevel}`;

  const sSub = document.getElementById('ducSpeedSub');
  if (sSub) sSub.textContent = `Cycle: ${cycleDur.toFixed(2)}s (-0.05s)`;

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
      if (sUpgTxt) sUpgTxt.textContent = 'OVERCLOCK (-0.05s)';
    }
  }

  // Update Home Card if present
  const dgeRate = document.getElementById('dgeHomeRateVal');
  if (dgeRate) dgeRate.textContent = `+${formatDiamondDisplay(rate)} 💎 / ${cycleDur.toFixed(2)}s`;

  updateDiamondGeneratorRealtime();
}

function renderPiggyBankRecordsList() {
  const listEl = document.getElementById('piggyRecordsList');
  const countEl = document.getElementById('piggyRecordCount');
  if (!listEl) return;

  const pb = ensurePiggyBankState();
  const records = (pb && Array.isArray(pb.records)) ? pb.records : [];
  if (countEl) countEl.textContent = records.length;

  if (records.length === 0) {
    listEl.innerHTML = '<div class="no-records-msg">No diamond deposits yet. Generate diamonds with 100 ⚡!</div>';
    return;
  }

  let html = '';
  records.slice(0, 15).forEach(rec => {
    const isAct = isPiggyRecordActive(rec);
    const isCol = !!rec.collected;
    const expiryTime = getRecordExpiryTimestamp(rec);
    const remDays = Math.max(0, Math.ceil((expiryTime - Date.now()) / (1000 * 86400)));
    const dateStr = new Date(rec.createdAt || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    let statusPill = '';
    if (isCol) {
      statusPill = '<span class="record-status-pill collected">Collected</span>';
    } else if (isAct) {
      statusPill = `<span class="record-status-pill active">${remDays}d left</span>`;
    } else {
      statusPill = '<span class="record-status-pill expired">Expired</span>';
    }

    html += `
      <div class="piggy-record-item">
        <div>
          <span class="record-amount">+${formatDiamondDisplay(rec.amount)} 💎</span>
          <div class="record-meta">${dateStr}</div>
        </div>
        ${statusPill}
      </div>
    `;
  });

  listEl.innerHTML = html;
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
window.collectPiggyBankDiamonds = collectPiggyBankDiamonds;
window.extendPiggyBankWithAd = extendPiggyBankWithAd;
window.togglePiggyRecords = togglePiggyRecords;
