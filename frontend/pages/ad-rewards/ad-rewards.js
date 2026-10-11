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

  // Directly run Monetag Rewarded Ad with single-reward guard (prevents double credit)
  // NOTE: showRewardedAd() itself already invokes Monetag SDKs internally,
  // so calling show_10676091 here AND showRewardedAd would fire callback twice.
  let _adRewardClaimed = false;
  const _onceCallback = () => {
    if (_adRewardClaimed) return;
    _adRewardClaimed = true;
    if (typeof callback === 'function') callback();
  };

  // Rewarded interstitial
  if (typeof show_10676091 === 'function') {
    show_10676091().then(() => {
      // You need to add your user reward function here, which will be executed after the user watches the ad.
      // For more details, please refer to the detailed instructions.
      alert('You have seen an ad!');
      _onceCallback();
    }).catch(e => {
      console.warn('show_10676091 notice:', e);
      _onceCallback();
    });
    return;
  }

  // Fallback: unified ad service
  if (typeof showRewardedAd === 'function') {
    showRewardedAd(_onceCallback, { adTitle: title, adDesc: desc });
    return;
  }

  switchPage('adRewards');

  if (DOM.adRewardTitle) DOM.adRewardTitle.textContent = title;
  if (DOM.adRewardDesc) DOM.adRewardDesc.textContent = desc;
  if (DOM.btnClaimAdReward) {
    DOM.btnClaimAdReward.classList.add('disabled');
    DOM.btnClaimAdReward.innerHTML = `<span>WATCHING AD (15s)...</span>`;
  }
  if (DOM.adProgressFill) DOM.adProgressFill.style.width = '0%';
  if (DOM.adCountdownBadge) DOM.adCountdownBadge.textContent = '15s';

  if (adSimulationInterval) clearInterval(adSimulationInterval);

  let secondsLeft = 15;
  const totalSeconds = 15;

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
