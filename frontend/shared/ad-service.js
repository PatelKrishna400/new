/* ==========================================================================
   UNIVERSAL REWARDED INTERSTITIAL AD SERVICE (shared/ad-service.js)
   - Monetag / Libtl Rewarded Interstitial SDK (Zone: 11677609)
   - Interactive Cyber Video Ad Modal & Failsafe Simulation Engine
   - 100% Reliable Reward Delivery across Mobile, Telegram WebApp & Desktop
   ========================================================================== */

(function() {
  'use strict';

  let adModalEl = null;
  let activeCountdownInterval = null;
  let isAdActive = false;

  // Ensure modal DOM elements exist
  function ensureAdModalDOM() {
    if (document.getElementById('rewardedAdModalBackdrop')) {
      adModalEl = document.getElementById('rewardedAdModalBackdrop');
      return;
    }

    const modal = document.createElement('div');
    modal.id = 'rewardedAdModalBackdrop';
    modal.className = 'rewarded-ad-modal-backdrop';
    modal.style.display = 'none';

    modal.innerHTML = `
      <div class="rewarded-ad-dialog" id="rewardedAdDialog">
        <!-- Top Ad Badge Row -->
        <div class="ad-dialog-top">
          <div class="ad-sponsor-chip">
            <span class="ad-pulse-circle"></span>
            <span>🎬 SPONSORED REWARDED AD</span>
          </div>
          <span class="ad-timer-countdown" id="adTimerCountdown">3s</span>
        </div>

        <!-- Video Simulation Screen -->
        <div class="ad-video-screen">
          <div class="ad-screen-grid-pattern"></div>
          <div class="ad-center-visual">
            <div class="ad-core-spinner outer"></div>
            <div class="ad-core-spinner inner"></div>
            <div class="ad-sponsor-icon">⚡</div>
          </div>
          <div class="ad-screen-branding">
            <h4 class="ad-screen-title" id="adDialogTitle">ENERGY TAP NETWORK</h4>
            <p class="ad-screen-desc" id="adDialogDesc">Watching sponsored video to claim bonus reward...</p>
          </div>
          <div class="ad-monetag-tag">MONETAG ZONE 11677609</div>
        </div>

        <!-- Live Progress Strip -->
        <div class="ad-progress-strip">
          <div class="ad-progress-track">
            <div class="ad-progress-fill" id="adDialogProgressFill" style="width: 0%;"></div>
          </div>
          <div class="ad-progress-meta">
            <span class="ad-meta-text" id="adDialogStatusText">Streaming High-Tech Video Ad...</span>
            <span class="ad-meta-percent" id="adDialogPercentText">0%</span>
          </div>
        </div>

        <!-- Collect / Action Button -->
        <button class="ad-collect-reward-btn disabled" id="btnCollectAdReward">
          <span id="btnCollectAdText">⏳ WATCHING AD (3s)...</span>
        </button>
      </div>
    `;

    document.body.appendChild(modal);
    adModalEl = modal;
  }

  /**
   * Main Rewarded Ad Trigger
   * 
   * @param {Function} [rewardCallback] Callback when ad is finished
   * @param {Object} [options] { adTitle, adDesc, showAlert }
   * @returns {Promise<boolean>}
   */
  function showRewardedAd(rewardCallback, options = {}) {
    ensureAdModalDOM();

    if (isAdActive) {
      console.warn('Ad already playing, skipping duplicate trigger');
      return Promise.resolve(false);
    }

    isAdActive = true;

    return new Promise((resolve) => {
      const title = options.adTitle || 'Bonus Reward';
      const desc = options.adDesc || 'Watch full ad to claim reward!';

      const titleEl = document.getElementById('adDialogTitle');
      const descEl = document.getElementById('adDialogDesc');
      const countdownEl = document.getElementById('adTimerCountdown');
      const fillEl = document.getElementById('adDialogProgressFill');
      const percentEl = document.getElementById('adDialogPercentText');
      const statusEl = document.getElementById('adDialogStatusText');
      const btnCollect = document.getElementById('btnCollectAdReward');
      const btnText = document.getElementById('btnCollectAdText');

      if (titleEl) titleEl.textContent = title;
      if (descEl) descEl.textContent = desc;

      // Show Modal
      if (adModalEl) adModalEl.style.display = 'flex';

      let hasRewarded = false;

      // Safe Reward Executor
      const executeReward = () => {
        if (hasRewarded) return;
        hasRewarded = true;
        isAdActive = false;

        if (activeCountdownInterval) {
          clearInterval(activeCountdownInterval);
          activeCountdownInterval = null;
        }

        // 1. Increment player ad stats
        if (typeof gameState !== 'undefined') {
          if (!gameState.player) gameState.player = {};
          gameState.player.adsWatchedCount = (gameState.player.adsWatchedCount || 0) + 1;

          if (!gameState.dailyStats) gameState.dailyStats = {};
          gameState.dailyStats.adsWatched = (gameState.dailyStats.adsWatched || 0) + 1;
        }

        // 2. Execute user-supplied reward callback
        try {
          if (typeof rewardCallback === 'function') {
            rewardCallback();
          }
        } catch (err) {
          console.error('Error executing ad reward callback:', err);
        }

        // 3. Audio feedback
        if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') {
          sfx.playLevelUpSound();
        }

        // 4. Update UI & Cloud Sync
        if (typeof updateUI === 'function') updateUI();
        if (typeof saveGame === 'function') saveGame();

        // 5. Hide Modal with smooth fade
        if (adModalEl) {
          adModalEl.classList.add('fade-out');
          setTimeout(() => {
            adModalEl.style.display = 'none';
            adModalEl.classList.remove('fade-out');
          }, 300);
        }

        if (typeof showFloatingToast === 'function') {
          showFloatingToast('🎬 Ad Complete: Reward Claimed!');
        }

        resolve(true);
      };

      // 3-Second Interactive Ad Player Animation
      const totalSeconds = 3;
      let secondsLeft = totalSeconds;

      if (countdownEl) countdownEl.textContent = `${secondsLeft}s`;
      if (fillEl) fillEl.style.width = '0%';
      if (percentEl) percentEl.textContent = '0%';
      if (statusEl) statusEl.textContent = 'Streaming High-Tech Video Ad...';
      if (btnCollect) {
        btnCollect.classList.add('disabled');
        btnCollect.onclick = null;
      }
      if (btnText) btnText.textContent = `⏳ WATCHING AD (${secondsLeft}s)...`;

      // Start Countdown
      activeCountdownInterval = setInterval(() => {
        secondsLeft--;
        const progress = Math.min(100, Math.round(((totalSeconds - secondsLeft) / totalSeconds) * 100));

        if (fillEl) fillEl.style.width = `${progress}%`;
        if (percentEl) percentEl.textContent = `${progress}%`;
        if (countdownEl) countdownEl.textContent = secondsLeft > 0 ? `${secondsLeft}s` : 'DONE';

        if (btnText && secondsLeft > 0) {
          btnText.textContent = `⏳ WATCHING AD (${secondsLeft}s)...`;
        }

        if (secondsLeft <= 0) {
          clearInterval(activeCountdownInterval);
          activeCountdownInterval = null;

          if (statusEl) statusEl.textContent = '🎉 Video Complete! Reward Ready!';
          if (btnCollect) {
            btnCollect.classList.remove('disabled');
            btnCollect.onclick = executeReward;
          }
          if (btnText) btnText.textContent = '✨ COLLECT REWARD (READY!)';

          // Auto-claim after brief celebratory pause
          setTimeout(() => {
            executeReward();
          }, 500);
        }
      }, 1000);

      // Concurrently attempt official Monetag SDK invocation with strict timeout protection
      if (typeof window.show_11677609 === 'function') {
        try {
          console.log('🎬 Invoking Monetag SDK show_11677609()...');
          const sdkResult = window.show_11677609();
          if (sdkResult && typeof sdkResult.then === 'function') {
            sdkResult
              .then(() => {
                console.log('✅ Monetag SDK ad watched successfully!');
              })
              .catch(e => {
                console.warn('⚠️ Monetag notice/error, fallback active:', e);
              });
          }
        } catch (e) {
          console.warn('⚠️ Exception calling show_11677609, fallback active:', e);
        }
      }
    });
  }

  // Alias for compatibility with all pages
  window.showRewardedAd = showRewardedAd;
  window.watchRewardedAd = showRewardedAd;
  window.startAdSimulation = function(type, title, desc, callback) {
    showRewardedAd(callback, { adTitle: title, adDesc: desc });
  };

  // Pre-create modal when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureAdModalDOM);
  } else {
    ensureAdModalDOM();
  }
})();
