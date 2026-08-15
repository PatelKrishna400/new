/* ═══════════════════════════════════
   TAP EMPIRE — Collection Reward Engine
   Rewarded ads are integrated INTO game
   collection actions, not shown as a
   standalone "WATCH AD" button.
═══════════════════════════════════ */

'use strict';

/* ── Collection types ── */
const COLLECTION_TYPES = {
  offline: { label: 'Offline Reward', icon: '💤', baseMultiplier: 1, adMultiplier: 2 },
  chest: { label: 'Open Chest', icon: '🎁', baseMultiplier: 1, adMultiplier: 2 },
  energy: { label: 'Claim Energy', icon: '⚡', baseMultiplier: 1, adMultiplier: 2 },
  daily: { label: 'Daily Bonus', icon: '🌟', baseMultiplier: 1, adMultiplier: 2 },
  mission: { label: 'Mission Bonus', icon: '🎯', baseMultiplier: 1, adMultiplier: 2 },
  direct_ad: { label: 'Watch Ad Bonus', icon: '📺', baseMultiplier: 1, adMultiplier: 1 },
  boost_ad: { label: 'Ad Tap Boost (2×)', icon: '🚀', baseMultiplier: 1, adMultiplier: 1 },
};

/* ── Ad cooldown timer ── */
let _adCooldownInterval;

function getAdCooldownRemaining() {
  const cooldownMs = (STATE.economy.rewardAdCooldownSeconds || 60) * 1000;
  return Math.max(0, Math.ceil((STATE.lastAdTs + cooldownMs - Date.now()) / 1000));
}

function getAdDailyRemaining() {
  const today = new Date().toDateString();
  if (STATE.adDailyDate !== today) { STATE.adDailyCount = 0; STATE.adDailyDate = today; }
  return Math.max(0, (STATE.economy.maximumRewardAdsPerDay || 10) - STATE.adDailyCount);
}

function canShowAd() {
  return (
    getAdCooldownRemaining() === 0 &&
    getAdDailyRemaining() > 0 &&
    STATE.adSessionCount < (STATE.economy.maximumRewardAdsPerSession || 5) &&
    !STATE.isOffline
  );
}

function startAdCooldownTick() {
  clearInterval(_adCooldownInterval);
  _adCooldownInterval = setInterval(() => {
    // Update any visible timers in collection cards
    document.querySelectorAll('.collect-card-timer[data-type]').forEach(el => {
      const rem = getAdCooldownRemaining();
      if (rem > 0) {
        el.textContent = `Bonus in ${fmtTime(rem)}`;
      } else {
        el.textContent = '';
        const card = el.closest('.collect-card');
        if (card) card.classList.remove('on-cooldown');
      }
    });
    document.querySelectorAll('.daily-limit-val').forEach(el => {
      el.textContent = `${STATE.adDailyCount} / ${STATE.economy.maximumRewardAdsPerDay || 10}`;
    });
  }, 1000);
}

/* ── Main collect action ── */
async function doCollect(type) {
  const def = COLLECTION_TYPES[type];
  if (!def) return;

  const adAvailable = canShowAd();

  if (type === 'direct_ad') {
    if (!adAvailable) {
      const rem = getAdCooldownRemaining();
      showToast(rem > 0 ? `⏳ Ad cooldown active (${fmtTime(rem)})` : '⏳ Daily ad limit reached');
      return;
    }
    const rewardAmt = STATE.economy.adRewardCoins || 500;
    await _collectWithAd('direct_ad', 0, rewardAmt);
    return;
  }

  if (type === 'boost_ad') {
    if (!adAvailable) {
      const rem = getAdCooldownRemaining();
      showToast(rem > 0 ? `⏳ Ad cooldown active (${fmtTime(rem)})` : '⏳ Daily ad limit reached');
      return;
    }
    await _collectWithAd('boost_ad', 0, 0);
    return;
  }

  // Calculate base reward
  let baseReward = 0;
  let bonusReward = 0;

  if (type === 'offline') {
    const hours = Math.min(8, (Date.now() - STATE.lastActiveTs) / 3600000);
    baseReward = Math.floor(hours * (STATE.economy.offlineRewardCoinsPerHour || 100));
    bonusReward = baseReward * ((STATE.economy.offlineRewardAdMultiplier || 2) - 1);
    if (baseReward <= 0) { showToast('💤 Come back after a while for offline rewards!'); return; }
  } else if (type === 'chest') {
    baseReward = STATE.economy.chestBaseReward || 500;
    bonusReward = baseReward * ((STATE.economy.chestAdMultiplier || 2) - 1);
  } else if (type === 'energy') {
    const amount = STATE.economy.energyCollectAmount || 100;
    if (!adAvailable) {
      restoreEnergy(amount);
      showToast(`⚡ +${amount} Energy!`);
      SFX.collect();
      haptic('success');
      spawnCollectBurst(..._centerCoords());
      await persistUser({ energy: STATE.energy, lastEnergyUpdate: STATE.lastEnergyUpdate });
      refreshHomeCollections();
      return;
    }
    // With ad: full restore
    baseReward = 0;
    bonusReward = 0;
  } else if (type === 'daily') {
    baseReward = STATE.economy.dailyBonusCoins || 1000;
    bonusReward = baseReward;
  } else if (type === 'mission') {
    baseReward = 500;
    bonusReward = 500;
  }

  if (adAvailable) {
    // Show confirm modal: collect normal OR get 2× with bonus
    _showCollectModal(type, def, baseReward, bonusReward);
  } else {
    // No ad available — give base reward immediately
    await _grantCollectionReward(type, baseReward, false);
  }
}

function _showCollectModal(type, def, base, bonus) {
  const total = base + bonus;
  const cooldownRem = getAdCooldownRemaining();
  const dailyRem = getAdDailyRemaining();

  let bonusRow = '';
  let normalRow = '';

  if (type === 'energy') {
    normalRow = `<div style="background:var(--card2);border-radius:10px;padding:14px;margin-bottom:10px">
      <div style="font-size:13px;color:var(--muted)">Restore</div>
      <div style="font-size:22px;font-weight:900;color:var(--blue)">⚡ ${STATE.economy.energyCollectAmount || 100}</div>
    </div>`;
    bonusRow = `<div style="background:rgba(56,217,150,.1);border:1.5px solid rgba(56,217,150,.35);border-radius:10px;padding:14px;margin-bottom:14px">
      <div style="font-size:11px;color:var(--success);font-weight:700;margin-bottom:4px">🎁 BONUS AVAILABLE</div>
      <div style="font-size:22px;font-weight:900;color:var(--success)">⚡ Full Energy</div>
      <div style="font-size:11px;color:var(--muted);margin-top:4px">Watch a short video to restore all energy</div>
    </div>`;
  } else {
    normalRow = base > 0 ? `<div style="background:var(--card2);border-radius:10px;padding:14px;margin-bottom:10px">
      <div style="font-size:13px;color:var(--muted)">Collect now</div>
      <div style="font-size:26px;font-weight:900;color:var(--gold)">💰 +${fmt(base)}</div>
    </div>` : '';
    bonusRow = `<div style="background:rgba(245,183,0,.1);border:1.5px solid rgba(245,183,0,.35);border-radius:10px;padding:14px;margin-bottom:14px">
      <div style="font-size:11px;color:var(--gold);font-weight:700;margin-bottom:4px">🎁 2× BONUS AVAILABLE</div>
      <div style="font-size:26px;font-weight:900;color:var(--gold)">💰 +${fmt(total)}</div>
      <div style="font-size:11px;color:var(--muted);margin-top:4px">Watch a short video to double your reward</div>
    </div>`;
  }

  showModal(`
    <div>
      <div style="font-size:36px;text-align:center;margin-bottom:8px">${def.icon}</div>
      <div style="font-size:17px;font-weight:800;text-align:center;margin-bottom:16px">${def.label}</div>
      ${bonusRow}
      ${normalRow}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:4px">
        ${base > 0 || type === 'energy'
      ? `<button class="btn btn-muted" onclick="closeModal();_collectNormal('${type}',${base})">
               ${type === 'energy' ? `⚡ +${STATE.economy.energyCollectAmount || 100}` : `💰 +${fmt(base)}`}
             </button>`
      : `<div></div>`
    }
        <button class="btn btn-gold" onclick="closeModal();_collectWithAd('${type}',${base},${bonus})">
          🎁 ${type === 'energy' ? 'Full Energy' : `+${fmt(total)}`}
        </button>
      </div>
      <div style="text-align:center;font-size:10px;color:var(--muted);margin-top:10px">
        Bonus collections today: ${STATE.adDailyCount} / ${STATE.economy.maximumRewardAdsPerDay || 10}
      </div>
    </div>
  `);
}

async function _collectNormal(type, amount) {
  await _grantCollectionReward(type, amount, false);
}

async function _collectWithAd(type, base, bonus) {
  if (!canShowAd()) {
    showToast('⏳ Bonus not available right now');
    await _grantCollectionReward(type, base, false);
    return;
  }
  await _runRewardedAd(type, base, bonus);
}

/* ── Rewarded ad runner ── */
async function _runRewardedAd(type, base, bonus) {
  // Create a unique session to prevent replay
  const sessionId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  if (STATE.adSessionIds.has(sessionId)) { showToast('⚠️ Duplicate session'); return; }
  STATE.adSessionIds.add(sessionId);

  // Write session to Firestore before ad (prevents replay)
  const uid = String(STATE.tgUser?.id || 'demo_0');
  try {
    await refs.adSessions().doc(sessionId).set({
      sessionId,
      telegramId: uid,
      userId: uid,
      rewardType: type,
      rewardAmount: base + bonus,
      status: 'created',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min expiry
    });
  } catch (e) { console.warn('[adSession write]', e); }

  /* ── Monetag Rewarded Interstitial (Zone 11577158) ─────────────
     SDK loaded in <head> exposes: window.show_11577158() or window['show_' + MONETAG_ZONE_ID]
  ─────────────────────────────────────────────────────────── */
  const monetagFn = window[`show_${MONETAG_ZONE_ID}`] || window.show_11577158;

  if (typeof monetagFn !== 'function') {
    // Dev/demo mode fallback: simulate ad
    await _simulateAd(sessionId);
    await _onAdCompleted(sessionId, type, base, bonus);
    return;
  }

  try {
    // Call show_11577158() which returns a promise on completion
    await Promise.resolve(monetagFn());
    await _onAdCompleted(sessionId, type, base, bonus);
  } catch (err) {
    // Ad was skipped or unavailable — no reward
    STATE.adSessionIds.delete(sessionId);
    _markSessionFailed(sessionId);
    showToast('📺 Bonus unavailable — please try again later');
  }
}

async function _simulateAd(sessionId) {
  return new Promise(resolve => {
    showModal(`
      <div style="text-align:center;padding:16px 0">
        <div style="font-size:40px;margin-bottom:10px">📺</div>
        <div style="font-size:16px;font-weight:700;margin-bottom:6px">Loading Bonus…</div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:16px">DEV MODE — Monetag SDK not loaded</div>
        <div id="sim-timer" style="font-size:28px;font-weight:900;color:var(--gold);margin-bottom:18px">5</div>
        <button class="btn btn-muted" id="sim-skip" disabled style="opacity:.4">Skip (wait)</button>
      </div>
    `);
    let t = 5;
    const iv = setInterval(() => {
      t--;
      const te = document.getElementById('sim-timer');
      if (te) te.textContent = t;
      if (t <= 3) {
        const sk = document.getElementById('sim-skip');
        if (sk) { sk.disabled = false; sk.style.opacity = '1'; sk.onclick = () => { clearInterval(iv); closeModal(); resolve(); }; }
      }
      if (t <= 0) { clearInterval(iv); closeModal(); resolve(); }
    }, 1000);
  });
}

/* ── Award after valid completion ── */
async function _onAdCompleted(sessionId, type, base, bonus) {
  /*
    PRODUCTION NOTE:
    In production, call your backend instead of awarding here directly:
      POST /api/rewards/ad-complete
      { sessionId, initData: getInitData() }
    The backend verifies:
      1. initData HMAC (Telegram auth)
      2. sessionId not already rewarded (Firestore)
      3. Daily limit from Firestore (not client)
      4. Session not expired
    Then atomically credits coins via Firestore transaction.
    Frontend then calls reloadPlayer() to refresh from server.

    DO NOT increment adDailyCount / totalAdViews here.
    _grantCollectionReward() is the single place that does it,
    both in STATE and in the Firestore transaction.
    Incrementing here AND there was causing double-counting.
  */

  const totalReward = base + bonus;

  // Grant reward — adDailyCount / totalAdViews incremented inside there
  await _grantCollectionReward(type, totalReward, true, sessionId);
}

/* ── Core reward granting ── */
async function _grantCollectionReward(type, amount, fromAd, sessionId = null) {
  const uid = String(STATE.tgUser?.id || 'demo_0');
  const today = new Date().toDateString();
  const now = Date.now();

  // ── Update local STATE counters ONCE, right here ──────────────
  // These are never touched before this point in the ad flow.
  if (fromAd) {
    STATE.adDailyCount++;
    STATE.adDailyDate = today;
    STATE.adSessionCount++;
    STATE.lastAdTs = now;
    STATE.totalAdViews++;

    // Revenue estimate (display only — not authoritative)
    const cpm = STATE.economy.estimatedCPM || 2.0;
    const fill = STATE.economy.adFillRate || 1.0;
    const ratio = STATE.economy.payoutRatio || 0.30;
    const revPerAd = (cpm / 1000) * fill;
    STATE.estimatedAdRevenue = parseFloat((STATE.totalAdViews * revPerAd).toFixed(6));
    STATE.eligibleWithdrawal = parseFloat((STATE.estimatedAdRevenue * ratio).toFixed(6));
    STATE.rewardLiability = parseFloat(
      (STATE.totalAdViews * amount / (STATE.economy.coinsPerStar || 10000) * 0.013).toFixed(6)
    );
  }

  if (type === 'energy') {
    const fillAmount = fromAd ? STATE.maxEnergy - STATE.energy : (STATE.economy.energyCollectAmount || 100);
    restoreEnergy(fillAmount);
    showToast(fromAd ? '⚡ Full energy restored!' : `⚡ +${fillAmount} Energy!`);
    SFX.collect();
    haptic('success');
    spawnCollectBurst(..._centerCoords());

    // Persist energy + ad counters in one write (no transaction needed for energy)
    const patch = { energy: STATE.energy, lastEnergyUpdate: STATE.lastEnergyUpdate };
    if (fromAd) {
      patch.totalAdViews = firebase.firestore.FieldValue.increment(1);
      patch.adDailyCount = firebase.firestore.FieldValue.increment(1);
      patch.adDailyDate = today;
      patch.lastAdTs = now;
      patch.estimatedAdRevenue = STATE.estimatedAdRevenue;
      patch.eligibleWithdrawal = STATE.eligibleWithdrawal;
      patch.rewardLiability = STATE.rewardLiability;
    }
    patch.lastActiveTs = now;
    patch.updatedAt = firebase.firestore.FieldValue.serverTimestamp();

    // Mark session rewarded + persist in one batch
    if (fromAd && sessionId) {
      const batch = db.batch();
      batch.update(refs.user(uid), patch);
      batch.update(refs.adSessions().doc(sessionId), {
        status: 'rewarded',
        rewardedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      await batch.commit().catch(e => console.warn('[grantCollectionReward energy batch]', e));
    } else {
      await persistUser(patch, true);
    }

  } else {
    // ── Coins reward ──────────────────────────────────────────
    STATE.coins += amount;
    updateCoinUI();
    SFX.collect();
    haptic('success');
    spawnCollectBurst(..._centerCoords());
    showToast(`${fromAd ? '🎁' : '✅'} +${fmt(amount)} Coins collected!`);
    updateMissionProgress('collect', 1);
    if (fromAd) updateMissionProgress('ad', 1);

    // Firestore transaction — duplicate protection via sessionId check
    try {
      await db.runTransaction(async t => {
        const ref = refs.user(uid);
        const snap = await t.get(ref);
        if (!snap.exists) throw new Error('User not found');

        // Duplicate check: session must not already be 'rewarded'
        if (fromAd && sessionId) {
          const sesRef = refs.adSessions().doc(sessionId);
          const sesSnap = await t.get(sesRef);
          if (sesSnap.exists && sesSnap.data().status === 'rewarded') {
            throw new Error('Already rewarded');
          }
          // Mark session rewarded inside the same transaction
          t.update(sesRef, {
            status: 'rewarded',
            rewardedAt: firebase.firestore.FieldValue.serverTimestamp(),
          });
        }

        // Use FieldValue.increment — never rely on stale snapshot values
        const patch = {
          coins: firebase.firestore.FieldValue.increment(amount),
          lastActiveTs: now,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        };
        if (fromAd) {
          patch.totalAdViews = firebase.firestore.FieldValue.increment(1);
          patch.adDailyCount = firebase.firestore.FieldValue.increment(1);
          patch.adDailyDate = today;
          patch.lastAdTs = now;
          patch.estimatedAdRevenue = STATE.estimatedAdRevenue;
          patch.eligibleWithdrawal = STATE.eligibleWithdrawal;
          patch.rewardLiability = STATE.rewardLiability;
        }
        t.update(ref, patch);

        // Transaction record
        t.set(refs.txn().doc(), {
          userId: uid,
          type: fromAd ? 'ad_collect' : 'collect',
          subType: type,
          delta: amount,
          desc: fromAd
            ? `Bonus Collection — ${COLLECTION_TYPES[type]?.label}`
            : `Collection — ${COLLECTION_TYPES[type]?.label}`,
          sessionId: sessionId || null,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      });
    } catch (e) {
      if (e.message === 'Already rewarded') {
        // Roll back optimistic state update
        STATE.coins -= amount;
        if (fromAd) {
          STATE.adDailyCount--;
          STATE.adSessionCount--;
          STATE.totalAdViews--;
          STATE.lastAdTs = STATE.lastAdTs; // unchanged; previous was overwritten
        }
        updateCoinUI();
        showToast('⚠️ Reward already claimed');
      } else {
        console.warn('[grantCollectionReward]', e);
      }
      return; // stop — don't update lastActiveTs or refresh on failure
    }
  }

  // Only reached on success
  STATE.lastActiveTs = now;
  refreshHomeCollections();
  checkAchievements();
}

async function _markSessionFailed(sessionId) {
  try {
    await refs.adSessions().doc(sessionId).update({ status: 'failed' });
  } catch (_) { }
}

/* ── Offline reward calculation ── */
function getOfflineReward() {
  if (!STATE.lastActiveTs) return 0;
  const hours = Math.min(8, (Date.now() - STATE.lastActiveTs) / 3600000);
  return Math.floor(hours * (STATE.economy.offlineRewardCoinsPerHour || 100));
}

/* ── Helper: get screen center coords ── */
function _centerCoords() {
  const w = window.innerWidth, h = window.innerHeight;
  return [Math.min(w, 480) / 2, h / 2];
}

/* ── Refresh collection cards on home ── */
function refreshHomeCollections() {
  const strip = document.getElementById('collection-strip');
  if (strip) renderCollectionCards(strip);
}

/* ── Render all collection cards ── */
function renderCollectionCards(container) {
  const adReady = canShowAd();
  const cooldownR = getAdCooldownRemaining();
  const dailyUsed = STATE.adDailyCount;
  const dailyMax = STATE.economy.maximumRewardAdsPerDay || 10;
  const offlineAmt = getOfflineReward();
  const chestBase = STATE.economy.chestBaseReward || 500;

  const cards = [];

  // Offline reward (only if earned)
  if (offlineAmt > 0) {
    cards.push(`
      <div class="collect-card ${adReady ? '' : 'on-cooldown'}" onclick="doCollect('offline')">
        <div class="collect-card-icon">💤</div>
        <div class="collect-card-info">
          <div class="collect-card-title">Offline Reward</div>
          <div class="collect-card-sub">${adReady ? 'Bonus available' : (cooldownR > 0 ? 'Cooldown active' : '')}</div>
          ${adReady ? '<div class="collect-card-bonus">2× with bonus</div>' : ''}
        </div>
        <div class="collect-card-right">
          <div class="collect-card-reward">💰 +${fmt(offlineAmt)}</div>
          ${adReady ? `<div style="font-size:10px;color:var(--gold)">or 💰 +${fmt(offlineAmt * 2)}</div>` : ''}
          ${cooldownR > 0 ? `<div class="collect-card-timer" data-type="offline">${fmtTime(cooldownR)}</div>` : ''}
        </div>
        ${adReady ? '<div class="bonus-pill">2× BONUS</div>' : ''}
      </div>`);
  }

  // Chest
  cards.push(`
    <div class="collect-card ${adReady ? '' : ''}" onclick="doCollect('chest')">
      <div class="collect-card-icon">🎁</div>
      <div class="collect-card-info">
        <div class="collect-card-title">Open Chest</div>
        <div class="collect-card-sub">Random reward inside</div>
        ${adReady ? '<div class="collect-card-bonus">2× with bonus</div>' : ''}
      </div>
      <div class="collect-card-right">
        <div class="collect-card-reward">💰 +${fmt(chestBase)}</div>
        ${adReady ? `<div style="font-size:10px;color:var(--gold)">or 💰 +${fmt(chestBase * 2)}</div>` : ''}
        ${cooldownR > 0 ? `<div class="collect-card-timer" data-type="chest">${fmtTime(cooldownR)}</div>` : ''}
      </div>
      ${adReady ? '<div class="bonus-pill">2× BONUS</div>' : ''}
    </div>`);

  // Energy
  cards.push(`
    <div class="collect-card" onclick="doCollect('energy')">
      <div class="collect-card-icon">⚡</div>
      <div class="collect-card-info">
        <div class="collect-card-title">Claim Energy</div>
        <div class="collect-card-sub">${adReady ? 'Full restore available' : `+${STATE.economy.energyCollectAmount || 100} Energy`}</div>
        ${adReady ? '<div class="collect-card-bonus">Full restore with bonus</div>' : ''}
      </div>
      <div class="collect-card-right">
        <div class="collect-card-reward">⚡ +${adReady ? 'Full' : STATE.economy.energyCollectAmount || 100}</div>
      </div>
      ${adReady ? '<div class="bonus-pill">FULL</div>' : ''}
    </div>`);

  // Direct Watch Ad (+500 Coins)
  cards.push(`
    <div class="collect-card ${adReady ? '' : 'on-cooldown'}" onclick="doCollect('direct_ad')">
      <div class="collect-card-icon">📺</div>
      <div class="collect-card-info">
        <div class="collect-card-title">Watch Ad Bonus</div>
        <div class="collect-card-sub">${adReady ? 'Instant bonus coins' : (cooldownR > 0 ? 'Cooldown active' : 'Daily limit reached')}</div>
        ${adReady ? '<div class="collect-card-bonus">Watch short video ad</div>' : ''}
      </div>
      <div class="collect-card-right">
        <div class="collect-card-reward">💰 +${fmt(STATE.economy.adRewardCoins || 500)}</div>
        ${cooldownR > 0 ? `<div class="collect-card-timer" data-type="direct_ad">${fmtTime(cooldownR)}</div>` : ''}
      </div>
      ${adReady ? '<div class="bonus-pill">AD REWARD</div>' : ''}
    </div>`);

  // Daily ad counter
  const counterHtml = `
    <div class="daily-limit-row">
      <span class="daily-limit-label">Bonus Collections Today</span>
      <span class="daily-limit-val">${dailyUsed} / ${dailyMax}</span>
    </div>
    ${dailyUsed >= dailyMax ? `<div style="text-align:center;font-size:11px;color:var(--muted);padding:4px 14px 8px">All bonus collections completed today. Normal gameplay continues!</div>` : ''}`;

  container.innerHTML = cards.join('') + counterHtml;
}
