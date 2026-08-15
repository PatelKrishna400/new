/* ═══════════════════════════════════
   TAP EMPIRE — Navigation
   Fixed: removed duplicate callAPI (lives in config.js)
   Fixed: removed duplicate _centerCoords (lives in collection.js)
═══════════════════════════════════ */

'use strict';

/* ── Screen registry ── */
const SCREEN_RENDERERS = {
  home: renderHomeScreen,
  boost: renderBoostScreen,
  tasks: renderTasksScreen,
  rank: renderRankScreen,
  wallet: renderWalletScreen,
  profile: renderProfileScreen,
  events: renderEventsScreen,
  referral: renderReferralScreen,
  admin: renderAdminScreen,
};

let _currentScreen = 'home';

function switchScreen(name) {
  if (!SCREEN_RENDERERS[name]) return;
  if (name === 'admin' && !STATE.isAdmin) return;

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.screen === name);
  });
  document.querySelectorAll('.screen').forEach(el => {
    el.classList.toggle('active', el.id === `screen-${name}`);
  });

  _currentScreen = name;

  try {
    SCREEN_RENDERERS[name]();
  } catch (e) {
    console.error(`[nav] renderScreen(${name})`, e);
  }

  haptic('light');
}

function getCurrentScreen() {
  return _currentScreen;
}

function initNav() {
  document.querySelectorAll('.nav-btn[data-screen]').forEach(btn => {
    btn.addEventListener('click', () => switchScreen(btn.dataset.screen));
  });
}
