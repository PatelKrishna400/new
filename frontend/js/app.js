/* ═══════════════════════════════════
   TAP EMPIRE — App Bootstrap (fixed)
   Boot order fix: syncState → applyUpgrades
   so upgrade values always override Firestore defaults.
═══════════════════════════════════ */

'use strict';

async function bootApp() {
  try {
    /* 1 — Telegram */
    initTelegram();

    /* 2 — Particles */
    resizeParticleCanvas();
    initBgParticles();
    animateParticles();

    /* 3 — Firebase */
    const fbOk = initFirebase();
    if (!fbOk) throw new Error('Firebase init failed — check FIREBASE_CONFIG in config.js');

    /* 4 — Economy config (loads Firestore overrides into STATE.economy) */
    await loadEconomy();

    /* 5 — Auth */
    await signInAnonymouslyIfNeeded();

    /* 6 — Player data from Firestore */
    const playerData = await loadOrCreatePlayer();

    /* 7 — Sync Firestore values into STATE
           MUST happen before applyUpgrades so tapPower/maxEnergy
           from Firestore don't later overwrite upgrade values      */
    syncState(playerData);

    /* 8 — Apply local upgrade levels on top of synced Firestore state
           This is the correct order: Firestore base → upgrade bonus  */
    applyUpgrades();

    /* 9 — Offline energy regen (timestamp-based, no DB write) */
    applyOfflineEnergyRegen();

    /* 10 — Mission + Achievement state from localStorage */
    initMissions();
    initAchievements();

    /* 11 — Start game loops */
    startEnergyRegen();
    startPerfectTapSystem();
    startAdCooldownTick();

    /* 12 — Populate top bar */
    updateTopBar();
    updateCoinUI();
    updateLevelUI();
    updateEnergyUI();

    /* 13 — Navigation + first screen */
    initNav();
    switchScreen('home');

    /* 14 — Lifecycle handlers */
    _registerLifecycleHandlers();

    /* 15 — Ready */
    STATE.initialized = true;
    STATE.sessionId = generateSessionId();

    /* 16 — Daily reward nudge (delayed so home screen renders first) */
    if (canClaimDaily()) {
      setTimeout(() => showToast('🎁 Daily reward ready! Go to Tasks → Daily', 'success'), 1200);
    }

    /* 17 — Background leaderboard update */
    updateLeaderboard().catch(() => { });

  } catch (err) {
    console.error('[boot]', err);
    const appEl = document.getElementById('app');
    if (appEl) appEl.style.display = 'flex';
    document.body.insertAdjacentHTML('afterbegin',
      `<div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;
                   background:#0B1020;color:#FF5C6C;font-size:14px;padding:24px;text-align:center;
                   z-index:9999;line-height:1.8;flex-direction:column;gap:16px">
         <div style="font-size:40px">⚠️</div>
         <div>${esc(err.message || 'Startup error')}</div>
         <button onclick="location.reload()"
           style="background:#F5B700;color:#000;border:none;padding:12px 28px;
                  border-radius:12px;font-size:15px;font-weight:800;cursor:pointer">
           Reload
         </button>
       </div>`
    );
  }
}

/* ── Lifecycle handlers ── */
function _registerLifecycleHandlers() {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) _onAppHide();
    else _onAppShow();
  });

  window.addEventListener('offline', () => {
    STATE.isOffline = true;
    const b = document.getElementById('offline-banner');
    if (b) b.style.display = 'flex';
  });

  window.addEventListener('online', () => {
    STATE.isOffline = false;
    const b = document.getElementById('offline-banner');
    if (b) b.style.display = 'none';
    /* Resync authoritative state on reconnect */
    reloadPlayer().then(() => {
      /* Re-apply upgrades after reload so tapPower is correct */
      applyUpgrades();
      updateCoinUI();
      updateLevelUI();
      updateEnergyUI();
      showToast('🟢 Back online — state synced', 'success');
    }).catch(() => { });
  });

  window.addEventListener('resize', resizeParticleCanvas, { passive: true });
}

function _onAppHide() {
  STATE.lastActiveTs = Date.now();
  persistUser({ lastActiveTs: STATE.lastActiveTs }).catch(() => { });
  stopEnergyRegen();
}

function _onAppShow() {
  applyOfflineEnergyRegen();
  startEnergyRegen();
  const screen = getCurrentScreen();
  if (screen && SCREEN_RENDERERS[screen]) {
    try { SCREEN_RENDERERS[screen](); } catch (_) { }
  }
}

document.addEventListener('DOMContentLoaded', bootApp);
