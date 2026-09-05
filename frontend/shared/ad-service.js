/* ==========================================================================
   MONETAG / LIBTL REWARDED INTERSTITIAL AD SERVICE (shared/ad-service.js)
   - Zone: 11677609
   - SDK function: show_11677609()
   - Intercepts and executes rewarded ad on all Ad Watch and Claim buttons
   ========================================================================== */

(function() {
  'use strict';

  /**
   * Executes the Monetag rewarded interstitial ad.
   * On completion, calls the reward callback function.
   * 
   * @param {Function} [rewardCallback] Function executed when user watches the ad
   * @param {Object} [options] Optional parameters (e.g. adTitle, alertOnComplete)
   * @returns {Promise<boolean>}
   */
  function showRewardedAd(rewardCallback, options = {}) {
    return new Promise((resolve) => {
      const executeReward = () => {
        try {
          // 1. Track ad count in player state
          if (typeof gameState !== 'undefined' && gameState.player) {
            gameState.player.adsWatchedCount = (gameState.player.adsWatchedCount || 0) + 1;
          }

          // 2. Execute user-defined reward function
          if (typeof rewardCallback === 'function') {
            rewardCallback();
          }

          // 3. Audio & visual confirmation
          if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') {
            sfx.playLevelUpSound();
          }

          if (options.showAlert) {
            alert('You have seen an ad!');
          }

          // 4. Update UI and save game
          if (typeof updateUI === 'function') updateUI();
          if (typeof saveGame === 'function') saveGame();

          resolve(true);
        } catch (err) {
          console.error('Error executing ad reward:', err);
          resolve(false);
        }
      };

      // Check if Monetag / Libtl SDK function is defined
      if (typeof show_11677609 === 'function') {
        console.log('🎬 Requesting Monetag Rewarded Interstitial show_11677609()...');
        try {
          show_11677609()
            .then(() => {
              console.log('✅ Monetag Rewarded Interstitial watched successfully!');
              executeReward();
            })
            .catch((err) => {
              console.warn('⚠️ Monetag Ad ended with notice/error, granting reward fallback:', err);
              executeReward();
            });
        } catch (err) {
          console.warn('⚠️ Exception invoking show_11677609, granting reward fallback:', err);
          executeReward();
        }
      } else {
        console.log('ℹ️ show_11677609 not found (offline/blocked/test mode), granting reward directly');
        executeReward();
      }
    });
  }

  // Global exports
  window.showRewardedAd = showRewardedAd;
  window.watchRewardedAd = showRewardedAd;
})();
