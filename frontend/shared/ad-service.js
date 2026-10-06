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

  let adModalRefs = null;

  // Ensure modal DOM elements exist and cache static references
  function ensureAdModalDOM() {
    if (adModalRefs && document.getElementById('rewardedAdModalBackdrop')) {
      adModalEl = adModalRefs.backdrop;
      return;
    }

    let modal = document.getElementById('rewardedAdModalBackdrop');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'rewardedAdModalBackdrop';
      modal.className = 'rewarded-ad-modal-backdrop';
      modal.style.display = 'none';

      const MONETAG_DIRECT_LINK = 'https://otieuche.com/4/8893420';
      modal.innerHTML = `
        <div class="rewarded-ad-dialog" id="rewardedAdDialog">
          <!-- Top Ad Badge Row -->
          <div class="ad-dialog-top">
            <div class="ad-sponsor-chip">
              <span class="ad-pulse-circle"></span>
              <span>🎬 SPONSORED REWARDED AD</span>
            </div>
            <span class="ad-timer-countdown" id="adTimerCountdown">15s</span>
          </div>

          <!-- Video Simulation Screen with Proper Monetag Direct Link -->
          <div class="ad-video-screen" id="adVideoScreenBox" style="cursor: pointer;" title="Tap to visit official sponsor ad" onclick="window.open('${MONETAG_DIRECT_LINK}', '_blank')">
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

            <!-- Clickable Official Ads Link Button -->
            <a href="${MONETAG_DIRECT_LINK}" target="_blank" rel="noopener noreferrer" class="ad-direct-link-btn" onclick="event.stopPropagation(); window.open('${MONETAG_DIRECT_LINK}', '_blank');">
              <span>🌐 OPEN SPONSOR AD</span>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>

            <div class="ad-monetag-tag">MONETAG ZONE 11677609</div>
          </div>

          <!-- Live Progress Strip -->
          <div class="ad-progress-strip">
            <div class="ad-progress-track">
              <div class="ad-progress-fill" id="adDialogProgressFill" style="width: 0%;"></div>
            </div>
            <div class="ad-progress-meta">
              <span class="ad-meta-text" id="adDialogStatusText">Streaming Sponsored Ad (15s)...</span>
              <span class="ad-meta-percent" id="adDialogPercentText">0%</span>
            </div>
          </div>

          <!-- Collect / Action Button -->
          <button class="ad-collect-reward-btn disabled" id="btnCollectAdReward">
            <span id="btnCollectAdText">⏳ WATCHING AD (15s)...</span>
          </button>
        </div>
      `;

      document.body.appendChild(modal);
    }

    adModalEl = modal;
    adModalRefs = {
      backdrop: modal,
      titleEl: document.getElementById('adDialogTitle'),
      descEl: document.getElementById('adDialogDesc'),
      countdownEl: document.getElementById('adTimerCountdown'),
      fillEl: document.getElementById('adDialogProgressFill'),
      percentEl: document.getElementById('adDialogPercentText'),
      statusEl: document.getElementById('adDialogStatusText'),
      btnCollect: document.getElementById('btnCollectAdReward'),
      btnText: document.getElementById('btnCollectAdText')
    };
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

      const { titleEl, descEl, countdownEl, fillEl, percentEl, statusEl, btnCollect, btnText } = adModalRefs;

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

      // 15-Second Interactive Ad Player Animation (Proper Rewarded Ad)
      const totalSeconds = 15;
      let secondsLeft = totalSeconds;

      if (countdownEl) countdownEl.textContent = `${secondsLeft}s`;
      if (fillEl) fillEl.style.width = '0%';
      if (percentEl) percentEl.textContent = '0%';
      if (statusEl) statusEl.textContent = 'Streaming Sponsored Ad (15s)...';
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

      // Monetag Zone 10676091: Rewarded Popup vs Rewarded Interstitial
      if (typeof window.show_10676091 === 'function') {
        try {
          const isPop = options.isPopup || options.type === 'pop';
          if (isPop) {
            console.log('🎬 Invoking Monetag Rewarded Popup show_10676091("pop")...');
            window.show_10676091('pop').then(() => {
              // user watch ad till the end or close it in interstitial format
              // your code to reward user for rewarded format
              console.log('✅ Monetag Rewarded Popup completed successfully!');
              executeReward();
              if (adModalEl) adModalEl.style.display = 'none';
            }).catch(e => {
              // user get error during playing ad
              console.warn('⚠️ Monetag popup ad notice/error, simulation fallback active:', e);
            });
          } else {
            console.log('🎬 Invoking Monetag Rewarded Interstitial show_10676091()...');
            window.show_10676091().then(() => {
              // User reward function executed after the user watches the ad
              console.log('✅ Monetag Rewarded Interstitial completed successfully!');
              executeReward();
              if (adModalEl) adModalEl.style.display = 'none';
            }).catch(e => {
              // user get error during playing ad
              console.warn('⚠️ Monetag rewarded interstitial notice/error, simulation fallback active:', e);
            });
          }
        } catch (e) {
          console.warn('⚠️ Exception calling show_10676091:', e);
        }
      }

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

  // In-App Interstitial Ad Trigger for Shop Page (Zone: 10676091)
  window.triggerShopInAppInterstitial = function() {
    try {
      if (typeof window.show_10676091 === 'function') {
        window.show_10676091({
          type: 'inApp',
          inAppSettings: {
            frequency: 2,
            capping: 0.1,
            interval: 30,
            timeout: 5,
            everyPage: false
          }
        });
      } else if (typeof window.show_10676091 === 'undefined') {
        window.show_10676091 = function(opts) {
          (window.show_10676091.q = window.show_10676091.q || []).push(opts);
        };
        window.show_10676091({
          type: 'inApp',
          inAppSettings: {
            frequency: 2,
            capping: 0.1,
            interval: 30,
            timeout: 5,
            everyPage: false
          }
        });
      }
    } catch (err) {
      console.warn('⚠️ Error triggering show_10676091 in-app interstitial:', err);
    }
  };

  // Pre-create modal when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureAdModalDOM);
  } else {
    ensureAdModalDOM();
  }
})();
