/* ==========================================================================
   AD FUEL STATION & VIDEO REWARDS (pages/ad-rewards/ad-rewards.js)
   ========================================================================== */
// ==========================================================================
// AD REWARDS SIMULATION STATION (FULL MOBILE VIEW)
// ==========================================================================

let activeAdRewardState = {
  fuelType: 'green',
  rewardTitle: 'Green Fuel Cell',
  rewardDesc: '+5 Min Generator Timer',
  callback: null
};

let adSimulationInterval = null;

function startAdSimulation(fuelType, title, desc, callback) {
  activeAdRewardState = { fuelType, rewardTitle: title, rewardDesc: desc, callback };

  // Directly run Monetag Rewarded Interstitial Ad (show_11677609)
  if (typeof showRewardedAd === 'function') {
    showRewardedAd(callback);
    return;
  }

  switchPage('adRewards');

  if (DOM.adRewardTitle) DOM.adRewardTitle.textContent = title;
  if (DOM.adRewardDesc) DOM.adRewardDesc.textContent = desc;
  if (DOM.btnClaimAdReward) {
    DOM.btnClaimAdReward.classList.add('disabled');
    DOM.btnClaimAdReward.innerHTML = `<span>WATCHING AD (5s)...</span>`;
  }
  if (DOM.adProgressFill) DOM.adProgressFill.style.width = '0%';
  if (DOM.adCountdownBadge) DOM.adCountdownBadge.textContent = '5s';

  if (adSimulationInterval) clearInterval(adSimulationInterval);

  let secondsLeft = 5;
  const totalSeconds = 5;

  adSimulationInterval = setInterval(() => {
    secondsLeft--;
    const progressPercent = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
    
    if (DOM.adProgressFill) DOM.adProgressFill.style.width = `${progressPercent}%`;
    if (DOM.adCountdownBadge) DOM.adCountdownBadge.textContent = `${secondsLeft}s`;

    if (secondsLeft <= 0) {
      clearInterval(adSimulationInterval);
      if (DOM.adCountdownBadge) DOM.adCountdownBadge.textContent = 'DONE';
      if (DOM.btnClaimAdReward) {
        DOM.btnClaimAdReward.classList.remove('disabled');
        DOM.btnClaimAdReward.innerHTML = `<span>✨ COLLECT REWARD</span>`;
      }
      sfx.playLevelUpSound();
    } else {
      if (DOM.btnClaimAdReward) {
        DOM.btnClaimAdReward.innerHTML = `<span>WATCHING AD (${secondsLeft}s)...</span>`;
      }
    }
  }, 1000);
}

function collectSimulatedAdReward() {
  if (DOM.btnClaimAdReward && DOM.btnClaimAdReward.classList.contains('disabled')) return;

  // Track ad usage count
  if (!gameState.player) gameState.player = {};
  gameState.player.adsWatchedCount = (gameState.player.adsWatchedCount || 0) + 1;

  if (typeof activeAdRewardState.callback === 'function') {
    activeAdRewardState.callback();
  }

  sfx.playLevelUpSound();
  switchPage('energy');
  updateUI();
  saveGame();
}

window.startAdSimulation = startAdSimulation;
window.collectSimulatedAdReward = collectSimulatedAdReward;
