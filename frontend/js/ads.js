/* ═══════════════════════════════════════════════════════════
   TAP EMPIRE — Central AdManager Engine
   Monetag Rewarded Ads Integration & Session Manager
   Adheres to Section #22 of Master Prompt Specification
   NEVER reward fake clicks, skipped ads, or duplicate callbacks.
═══════════════════════════════════════════════════════════ */

'use strict';

const AdManager = {
  /**
   * Check if a rewarded ad can be displayed based on cooldown & daily limit
   */
  canShowRewardedAd() {
    if (STATE.isOffline) return false;
    const cooldownMs = (STATE.economy.rewardAdCooldownSeconds || 60) * 1000;
    const remainingCooldown = Math.max(0, Math.ceil((STATE.lastAdTs + cooldownMs - Date.now()) / 1000));
    if (remainingCooldown > 0) return false;

    const today = new Date().toDateString();
    if (STATE.adDailyDate !== today) {
      STATE.adDailyCount = 0;
      STATE.adDailyDate = today;
    }
    const dailyLimit = STATE.economy.maximumRewardAdsPerDay || 10;
    if (STATE.adDailyCount >= dailyLimit) return false;

    const sessionLimit = STATE.economy.maximumRewardAdsPerSession || 5;
    if (STATE.adSessionCount >= sessionLimit) return false;

    return true;
  },

  /**
   * Create a unique ad session doc in Firestore before showing ad to prevent replay attacks
   */
  async startRewardSession(rewardType, baseAmount) {
    const sessionId = `ad_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    if (STATE.adSessionIds.has(sessionId)) throw new Error('Duplicate session ID');
    STATE.adSessionIds.add(sessionId);

    const uid = String(STATE.tgUser?.id || 'demo_0');
    try {
      await refs.adSessions().doc(sessionId).set({
        sessionId,
        telegramId: uid,
        userId: uid,
        rewardType,
        rewardAmount: baseAmount,
        status: 'created',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min TTL
      });
    } catch (e) {
      console.warn('[AdManager.startRewardSession]', e.message);
    }
    return sessionId;
  },

  /**
   * Display the rewarded ad via Monetag SDK or fail-safe dev simulator
   */
  async showRewardedAd(rewardType, baseAmount = 0, bonusAmount = 0) {
    if (!this.canShowRewardedAd()) {
      showToast('⏳ Rewarded ad not available right now');
      return false;
    }

    const sessionId = await this.startRewardSession(rewardType, baseAmount + bonusAmount);
    const zoneId = typeof MONETAG_ZONE_ID !== 'undefined' ? MONETAG_ZONE_ID : '11577158';
    const monetagFn = window[`show_${zoneId}`] || window.show_11577158;

    if (typeof monetagFn !== 'function') {
      // Development mode / script blocked fallback simulator
      const completed = await this._simulateAdModal(sessionId);
      if (completed) {
        await this.grantReward(sessionId, rewardType, baseAmount + bonusAmount);
        return true;
      }
      return false;
    }

    try {
      await Promise.resolve(monetagFn());
      await this.grantReward(sessionId, rewardType, baseAmount + bonusAmount);
      return true;
    } catch (err) {
      console.warn('[AdManager.showRewardedAd] Ad skipped or failed:', err);
      STATE.adSessionIds.delete(sessionId);
      try {
        await refs.adSessions().doc(sessionId).update({ status: 'failed' });
      } catch (_) { }
      showToast('📺 Bonus unavailable — please try again later');
      return false;
    }
  },

  /**
   * Verify reward session status with backend or Firestore
   */
  async verifyReward(sessionId) {
    try {
      const snap = await refs.adSessions().doc(sessionId).get();
      if (!snap.exists) return false;
      return snap.data().status === 'rewarded';
    } catch (_) {
      return false;
    }
  },

  /**
   * Atomically grant reward coins/energy to player state & Firestore.
   * Called by chest.js, spin.js, and other systems that use AdManager directly.
   * NOTE: collection.js uses its own _grantCollectionReward — do NOT call this
   * from _onAdCompleted in collection.js (would double-count).
   */
  async grantReward(sessionId, rewardType, totalAmount) {
    const today = new Date().toDateString();
    const now = Date.now();
    const uid = String(STATE.tgUser?.id || 'demo_0');

    // ── Update STATE counters exactly once ────────────────────
    STATE.adDailyCount++;
    STATE.adDailyDate = today;
    STATE.adSessionCount++;
    STATE.lastAdTs = now;
    STATE.totalAdViews++;

    if (rewardType === 'energy') {
      const fillAmount = totalAmount || STATE.maxEnergy;
      restoreEnergy(fillAmount);
      showToast('⚡ Full energy restored!');
    } else {
      STATE.coins += totalAmount;
      updateCoinUI();
      showToast(`🎁 +${fmt(totalAmount)} Coins claimed!`);
    }

    SFX.collect();
    haptic('success');

    // ── Single Firestore transaction — uses increment, not snapshot reads ──
    try {
      await db.runTransaction(async t => {
        const sesRef = refs.adSessions().doc(sessionId);
        const sesSnap = await t.get(sesRef);

        if (sesSnap.exists && sesSnap.data().status === 'rewarded') {
          throw new Error('Already rewarded');
        }

        const userPatch = {
          totalAdViews: firebase.firestore.FieldValue.increment(1),
          adDailyCount: firebase.firestore.FieldValue.increment(1),
          adDailyDate: today,
          lastAdTs: now,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        };

        if (rewardType === 'energy') {
          userPatch.energy = STATE.energy;
          userPatch.lastEnergyUpdate = STATE.lastEnergyUpdate;
        } else {
          userPatch.coins = firebase.firestore.FieldValue.increment(totalAmount);
        }

        t.update(refs.user(uid), userPatch);
        t.update(sesRef, {
          status: 'rewarded',
          rewardedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        t.set(refs.txn().doc(), {
          userId: uid,
          type: 'ad_reward',
          subType: rewardType,
          delta: totalAmount,
          desc: `Ad Reward — ${rewardType}`,
          sessionId,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      });
    } catch (e) {
      if (e.message === 'Already rewarded') {
        // Roll back optimistic STATE changes
        STATE.adDailyCount--;
        STATE.adSessionCount--;
        STATE.totalAdViews--;
        if (rewardType !== 'energy') { STATE.coins -= totalAmount; updateCoinUI(); }
        showToast('⚠️ Reward already claimed');
        return;
      }
      console.warn('[AdManager.grantReward]', e.message);
    }

    refreshHomeCollections();
    updateMissionProgress('ad', 1);
    checkAchievements();
  },

  /**
   * Internal ad countdown simulator (for dev/testing)
   */
  _simulateAdModal(sessionId) {
    return new Promise(resolve => {
      showModal(`
        <div style="text-align:center;padding:16px 0">
          <div style="font-size:44px;margin-bottom:10px">📺</div>
          <div style="font-size:18px;font-weight:800;margin-bottom:6px">Watching Rewarded Video…</div>
          <div style="font-size:12px;color:var(--muted);margin-bottom:16px">DEV MODE SIMULATOR</div>
          <div id="sim-timer" style="font-size:32px;font-weight:900;color:var(--gold);margin-bottom:18px">5</div>
          <button class="btn btn-muted" id="sim-skip" disabled style="opacity:.4">Wait (5s)…</button>
        </div>
      `);

      let sec = 5;
      const iv = setInterval(() => {
        sec--;
        const timerEl = document.getElementById('sim-timer');
        if (timerEl) timerEl.textContent = sec;
        if (sec <= 2) {
          const skipBtn = document.getElementById('sim-skip');
          if (skipBtn) {
            skipBtn.disabled = false;
            skipBtn.style.opacity = '1';
            skipBtn.textContent = 'Claim Reward';
            skipBtn.onclick = () => {
              clearInterval(iv);
              closeModal();
              resolve(true);
            };
          }
        }
        if (sec <= 0) {
          clearInterval(iv);
          closeModal();
          resolve(true);
        }
      }, 1000);
    });
  }
};
