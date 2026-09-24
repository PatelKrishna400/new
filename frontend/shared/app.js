/* ==========================================================================
   APP SHELL & NAVIGATION ROUTER (shared/app.js)
   ========================================================================== */
/* ==========================================================================
   ENERGY TAP REACTOR - MASTER APPLICATION CONTROLLER (shared/app.js)
   - Master View Router (switchPage for all 9 views)
   - Daily Streak Full Mobile View & Claim Logic
   - Ad Fuel Station & Video Simulation Page
   - Master UI Synchronizer (updateUI)
   - Event Listener Initializer (initEvents)
   - Application Lifecycle (DOMContentLoaded)
   ========================================================================== */

// Bottom Nav active pill cache & Set lookup
const ALL_REWARD_SUB_PAGES = [
  'spin', 'chest', 'scratch', 'egg', 'streak', 'megaReward', 'mega-reward',
  'giftCard', 'gift-card', 'gadgets', 'accessories', 'gamingTool', 'gaming-tool',
  'kitchen', 'stationery', 'fitness', 'homeDecorate', 'home-decorate', 'custom',
  'memoryMatch', 'memory-match', 'coinCatcher', 'coin-catcher'
];
const REWARD_SUB_PAGES_SET = new Set(ALL_REWARD_SUB_PAGES);

let _cachedPageMap = null;
let _currentActivePageElem = null;

function getPageMap() {
  if (!_cachedPageMap) {
    _cachedPageMap = {
      home: DOM.pageHome,
      energy: DOM.pageEnergy,
      tasks: DOM.pageTasks,
      profile: DOM.pageProfile,
      xp: DOM.pageXP,
      reward: DOM.pageReward,
      rewards: DOM.pageReward,
      wallet: DOM.pageReward,
      goal: DOM.pageGoal,
      streak: DOM.pageStreak,
      adRewards: document.getElementById('pageAdRewards') || DOM.pageAdRewards,
      'ad-rewards': document.getElementById('pageAdRewards') || DOM.pageAdRewards,
      spin: document.getElementById('pageSpin'),
      chest: document.getElementById('pageChest'),
      scratch: document.getElementById('pageScratch'),
      egg: document.getElementById('pageEgg'),
      megaReward: document.getElementById('pageMegaReward'),
      'mega-reward': document.getElementById('pageMegaReward'),
      giftCard: document.getElementById('pageGiftCard'),
      'gift-card': document.getElementById('pageGiftCard'),
      gadgets: document.getElementById('pageGadgets'),
      accessories: document.getElementById('pageAccessories'),
      gamingTool: document.getElementById('pageGamingTool'),
      'gaming-tool': document.getElementById('pageGamingTool'),
      kitchen: document.getElementById('pageKitchen'),
      stationery: document.getElementById('pageStationery'),
      fitness: document.getElementById('pageFitness'),
      homeDecorate: document.getElementById('pageHomeDecorate'),
      custom: document.getElementById('pageCustom'),
      suggestBox: document.getElementById('pageSuggestBox'),
      'suggest-box': document.getElementById('pageSuggestBox'),
      leaderboard: document.getElementById('pageLeaderboard'),
      memoryMatch: document.getElementById('pageMemoryMatch'),
      'memory-match': document.getElementById('pageMemoryMatch'),
      coinCatcher: document.getElementById('pageCoinCatcher'),
      'coin-catcher': document.getElementById('pageCoinCatcher')
    };
  }
  return _cachedPageMap;
}

// High-Performance Dynamic Module Loader & Background Idle Preloader
const PAGE_FILE_MAP = {
  'home': 'home',
  'energy': 'energy',
  'tasks': 'tasks',
  'profile': 'profile',
  'xp': 'xp',
  'reward': 'reward',
  'rewards': 'reward',
  'wallet': 'reward',
  'goal': 'goal',
  'streak': 'streak',
  'megaReward': 'mega-reward',
  'mega-reward': 'mega-reward',
  'giftCard': 'gift-card',
  'gift-card': 'gift-card',
  'gadgets': 'gadgets',
  'accessories': 'accessories',
  'gamingTool': 'gaming-tool',
  'gaming-tool': 'gaming-tool',
  'kitchen': 'kitchen',
  'stationery': 'stationery',
  'fitness': 'fitness',
  'homeDecorate': 'home-decorate',
  'home-decorate': 'home-decorate',
  'custom': 'custom',
  'suggestBox': 'suggest-box',
  'suggest-box': 'suggest-box',
  'adRewards': 'ad-rewards',
  'ad-rewards': 'ad-rewards',
  'spin': 'spin',
  'chest': 'chest',
  'scratch': 'scratch',
  'egg': 'egg',
  'leaderboard': 'leaderboard',
  'memoryMatch': 'memory-match',
  'memory-match': 'memory-match',
  'coinCatcher': 'coin-catcher',
  'coin-catcher': 'coin-catcher'
};

const _loadedPageScripts = new Set(['home', 'energy']);
const _loadingPagePromises = new Map();

function ensurePageLoaded(pageName) {
  const fileKey = PAGE_FILE_MAP[pageName] || pageName;
  if (_loadedPageScripts.has(fileKey)) return Promise.resolve();
  if (_loadingPagePromises.has(fileKey)) return _loadingPagePromises.get(fileKey);

  const promise = new Promise((resolve) => {
    const existing = document.querySelector(`script[src*="pages/${fileKey}/${fileKey}.js"]`);
    if (existing) {
      _loadedPageScripts.add(fileKey);
      _loadingPagePromises.delete(fileKey);
      return resolve();
    }

    const script = document.createElement('script');
    script.src = `pages/${fileKey}/${fileKey}.js`;
    script.async = true;
    script.onload = () => {
      _loadedPageScripts.add(fileKey);
      _loadingPagePromises.delete(fileKey);
      resolve();
    };
    script.onerror = (e) => {
      console.warn(`[LazyLoader] Could not load pages/${fileKey}/${fileKey}.js`, e);
      _loadingPagePromises.delete(fileKey);
      resolve();
    };
    document.body.appendChild(script);
  });

  _loadingPagePromises.set(fileKey, promise);
  return promise;
}
window.ensurePageLoaded = ensurePageLoaded;

function preloadNonCriticalPages() {
  const allKeys = [
    'tasks', 'profile', 'xp', 'reward', 'goal', 'streak',
    'spin', 'chest', 'scratch', 'egg', 'leaderboard',
    'memory-match', 'coin-catcher', 'mega-reward',
    'gift-card', 'gadgets', 'accessories', 'gaming-tool',
    'kitchen', 'stationery', 'fitness', 'home-decorate',
    'custom', 'suggest-box', 'ad-rewards'
  ];

  let idx = 0;
  function loadNext() {
    if (idx >= allKeys.length) return;
    const key = allKeys[idx++];
    if (_loadedPageScripts.has(key)) {
      loadNext();
      return;
    }
    ensurePageLoaded(key).then(() => {
      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(loadNext, { timeout: 1000 });
      } else {
        setTimeout(loadNext, 120);
      }
    });
  }

  // Preload starts quietly after the initial Home UI is completely usable
  setTimeout(() => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(loadNext, { timeout: 2000 });
    } else {
      setTimeout(loadNext, 500);
    }
  }, 2200);
}
window.preloadNonCriticalPages = preloadNonCriticalPages;

// Navigation Switcher (Full Mobile View Pages)
function switchPage(pageName) {
  window.switchPage = switchPage;
  gameState.currentTab = pageName;

  // Ensure any open home action popups are closed
  const homeBackdrop = document.getElementById('homePopupBackdrop');
  if (homeBackdrop) homeBackdrop.classList.remove('open');

  // Bottom Nav active pill sync with O(1) Set lookup
  const isRewardSubPage = REWARD_SUB_PAGES_SET.has(pageName);
  const isProfileSubPage = (pageName === 'suggestBox' || pageName === 'suggest-box');

  DOM.navButtons.forEach(btn => {
    if (btn.dataset.tab === pageName || (btn.dataset.tab === 'reward' && isRewardSubPage) || (btn.dataset.tab === 'profile' && isProfileSubPage)) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Hide previously active page view directly without global querySelectorAll
  if (_currentActivePageElem) {
    _currentActivePageElem.classList.remove('active');
  } else {
    document.querySelectorAll('.page-view').forEach(p => p.classList.remove('active'));
  }

  // Close any legacy modal backdrop
  closeTabModal();

  // Activate target page from cached map immediately
  const pageMap = getPageMap();
  const targetElem = pageMap[pageName];
  if (targetElem) {
    targetElem.classList.add('active');
    _currentActivePageElem = targetElem;
  }

  // Telegram Native BackButton Sync
  const tg = window.Telegram?.WebApp;
  if (tg && tg.BackButton) {
    if (allRewardSubPages.includes(pageName) || pageName === 'suggestBox' || pageName === 'suggest-box') {
      tg.BackButton.show();
    } else {
      tg.BackButton.hide();
    }
  }

  // Page-specific initializers runner
  function runPageInitializers(targetPage) {
    if (targetPage === 'leaderboard') {
      if (typeof updateLeaderboardUI === 'function') updateLeaderboardUI();
    } else if (targetPage === 'home') {
      if (typeof updateHomeUI === 'function') updateHomeUI();
    } else if (targetPage === 'energy') {
      if (typeof updateEnergyUI === 'function') updateEnergyUI();
    } else if (targetPage === 'tasks') {
      if (typeof renderTasksList === 'function') renderTasksList();
    } else if (targetPage === 'profile') {
      if (typeof updateProfileUI === 'function') updateProfileUI();
    } else if (targetPage === 'xp') {
      if (typeof renderLevelsList === 'function') renderLevelsList();
      if (typeof updateXpViewUI === 'function') updateXpViewUI();
    } else if (targetPage === 'reward' || targetPage === 'rewards' || targetPage === 'wallet') {
      if (typeof updateRewardViewUI === 'function') updateRewardViewUI();
    } else if (targetPage === 'goal') {
      if (typeof renderGoalsList === 'function') renderGoalsList();
      if (typeof updateGoalViewUI === 'function') updateGoalViewUI();
    } else if (targetPage === 'streak') {
      if (typeof renderStreakView === 'function') renderStreakView();
      if (typeof startStreakTimer === 'function') startStreakTimer();
    } else if (targetPage === 'spin') {
      if (typeof updateRewardViewUI === 'function') updateRewardViewUI();
      if (typeof initSpinChaserBulbs === 'function') initSpinChaserBulbs();
      if (typeof updateSpinTicketUI === 'function') updateSpinTicketUI();
    } else if (targetPage === 'chest') {
      if (typeof updateRewardViewUI === 'function') updateRewardViewUI();
      if (typeof updateChestUI === 'function') updateChestUI();
    } else if (targetPage === 'scratch') {
      if (typeof updateRewardViewUI === 'function') updateRewardViewUI();
      if (typeof initScratchPage === 'function') initScratchPage();
      if (typeof updateScratchUI === 'function') updateScratchUI();
      else if (typeof renderScratchGrid === 'function') renderScratchGrid();
    } else if (targetPage === 'egg') {
      if (typeof updateRewardViewUI === 'function') updateRewardViewUI();
      if (typeof renderEggPageContent === 'function') renderEggPageContent();
    } else if (targetPage === 'megaReward' || targetPage === 'mega-reward') {
      if (typeof renderMegaRewardPage === 'function') renderMegaRewardPage();
    } else if (['giftCard', 'gift-card', 'gadgets', 'accessories', 'gamingTool', 'gaming-tool', 'kitchen', 'stationery', 'fitness', 'homeDecorate', 'home-decorate'].includes(targetPage)) {
      if (typeof renderCategoryProducts === 'function') renderCategoryProducts(targetPage);
    } else if (targetPage === 'custom') {
      if (typeof initCustomPage === 'function') initCustomPage();
    } else if (targetPage === 'suggestBox' || targetPage === 'suggest-box') {
      if (typeof initSuggestBoxPage === 'function') initSuggestBoxPage();
    } else if (targetPage === 'memoryMatch' || targetPage === 'memory-match') {
      if (typeof initMemoryMatchPage === 'function') initMemoryMatchPage();
    } else if (targetPage === 'coinCatcher' || targetPage === 'coin-catcher') {
      if (typeof initCoinCatcherPage === 'function') initCoinCatcherPage();
    }
  }

  ensurePageLoaded(pageName).then(() => {
    runPageInitializers(pageName);
  });
}

window.switchPage = switchPage;

// ==========================================================================
// DAILY STREAK HELPER
// (Full 7-Day interactive streak logic is implemented in pages/streak/streak.js)
// ==========================================================================

// Legacy modal fallback helper
function closeTabModal() {
  if (DOM.modalBackdrop) DOM.modalBackdrop.classList.remove('open');
}

window.closeTabModal = closeTabModal;

// Auto Bot & Audio Controls
function toggleAutoBot() {
  gameState.settings.autoBotEnabled = !gameState.settings.autoBotEnabled;
  if (DOM.autoTapToggleBtn) {
    DOM.autoTapToggleBtn.classList.toggle('active', gameState.settings.autoBotEnabled);
    DOM.autoTapToggleBtn.innerHTML = `<span>🤖</span> Auto Bot: ${gameState.settings.autoBotEnabled ? 'ON' : 'OFF'}`;
  }
  if (gameState.settings.autoBotEnabled) {
    gameState.autoBotInterval = setInterval(() => {
      if (gameState.currentTab === 'home' && typeof handleOrbTap === 'function') handleOrbTap();
    }, 600);
  } else {
    clearInterval(gameState.autoBotInterval);
    gameState.autoBotInterval = null;
  }
}

function toggleSound() {
  gameState.settings.soundEnabled = !gameState.settings.soundEnabled;
  if (DOM.soundToggleBtn) {
    DOM.soundToggleBtn.innerHTML = `<span>${gameState.settings.soundEnabled ? '🔊' : '🔇'}</span> Sound: ${gameState.settings.soundEnabled ? 'ON' : 'OFF'}`;
    DOM.soundToggleBtn.classList.toggle('active', !gameState.settings.soundEnabled);
  }
}

// Master UI Update Coordinator with cached element collections
let _cachedCoinEls = null;
let _cachedBlueEls = null;
let _cachedDiamondEls = null;

function getCoinElements() {
  if (!_cachedCoinEls || _cachedCoinEls.length === 0) {
    _cachedCoinEls = document.querySelectorAll('#coinCounter, #headerCoinBalance, #shopCoinVal, #rewardCoinsBal, #profileCoinBalance');
  }
  return _cachedCoinEls;
}

function getBlueElements() {
  if (!_cachedBlueEls || _cachedBlueEls.length === 0) {
    _cachedBlueEls = document.querySelectorAll('#blueCoinCounter, #headerBlueBalance, .blue-coin-val');
  }
  return _cachedBlueEls;
}

function getDiamondElements() {
  if (!_cachedDiamondEls || _cachedDiamondEls.length === 0) {
    _cachedDiamondEls = document.querySelectorAll('#headerDiamondBalance, #playerDiamondBalance, .diamond-val');
  }
  return _cachedDiamondEls;
}

let _lastFormattedCoins = null;
let _lastFormattedBlueCoins = null;
let _lastFormattedDiamonds = null;

function updateUI(full = false) {
  // Sync Header & Page Balance Badges across all pages
  const formattedCoins = formatNumber(gameState.player.coins || 0);
  const formattedBlueCoins = formatNumber(gameState.player.blueCoins || 0);
  const formattedDiamonds = formatNumber(gameState.player.diamonds || 0);

  // 1. Gold Coins
  if (full || _lastFormattedCoins !== formattedCoins) {
    _lastFormattedCoins = formattedCoins;
    const coinElements = getCoinElements();
    coinElements.forEach(el => { if (el.textContent !== formattedCoins) el.textContent = formattedCoins; });
  }

  // 2. Blue Gem Coins (Header & In-Game Badges)
  if (full || _lastFormattedBlueCoins !== formattedBlueCoins) {
    _lastFormattedBlueCoins = formattedBlueCoins;
    const blueElements = getBlueElements();
    blueElements.forEach(el => { if (el.textContent !== formattedBlueCoins) el.textContent = formattedBlueCoins; });
  }

  // 3. Diamonds (Header & Mega Reward & Profile Badges)
  if (full || _lastFormattedDiamonds !== formattedDiamonds) {
    _lastFormattedDiamonds = formattedDiamonds;
    const diamondElements = getDiamondElements();
    diamondElements.forEach(el => { if (el.textContent !== formattedDiamonds) el.textContent = formattedDiamonds; });
  }

  if (typeof updateMegaDiamondDisplay === 'function') updateMegaDiamondDisplay();
  if (typeof updateShopUI === 'function') updateShopUI();

  const curTab = gameState.currentTab;

  // Sync active page view (skips updating invisible background tabs during rapid tapping)
  if (curTab === 'home' || full) {
    if (typeof updateHomeUI === 'function') updateHomeUI();
  }
  if (curTab === 'energy' || full) {
    if (typeof updateEnergyUI === 'function') updateEnergyUI();
  }
  if (curTab === 'profile' || full) {
    if (typeof updateProfileUI === 'function') updateProfileUI();
  }
  if (curTab === 'xp' || full) {
    if (typeof updateXpViewUI === 'function') updateXpViewUI();
  }
  if (curTab === 'reward' || curTab === 'rewards' || curTab === 'wallet' || full) {
    if (typeof updateRewardViewUI === 'function') updateRewardViewUI();
  }
  if (curTab === 'goal' || full) {
    if (typeof updateGoalViewUI === 'function') updateGoalViewUI();
  }
  if (curTab === 'spin' || full) {
    if (typeof updateSpinTicketUI === 'function') updateSpinTicketUI();
  }
  if (curTab === 'chest' || full) {
    if (typeof updateChestUI === 'function') updateChestUI();
  }
  if (curTab === 'scratch' || full) {
    if (typeof updateScratchUI === 'function') updateScratchUI();
  }
  if (curTab === 'egg' || full) {
    if (typeof renderEggPageContent === 'function') renderEggPageContent();
  }
}

window.updateUI = updateUI;
window.updateAllUI = function() { updateUI(true); };

// Telegram Mini App (TMA) Native SDK Integration
function initTelegramWebApp() {
  const tg = window.Telegram?.WebApp;
  if (!tg) return;

  try {
    tg.ready();
    tg.expand();
    if (typeof tg.enableClosingConfirmation === 'function') tg.enableClosingConfirmation();
    if (typeof tg.disableVerticalSwipes === 'function') tg.disableVerticalSwipes();
    if (typeof tg.setHeaderColor === 'function') tg.setHeaderColor('#040919');
    if (typeof tg.setBackgroundColor === 'function') tg.setBackgroundColor('#01040a');

    // Read real Telegram user info if launched inside Telegram
    const tgUser = tg.initDataUnsafe?.user;
    if (tgUser) {
      if (tgUser.first_name) {
        gameState.player.name = `${tgUser.first_name}${tgUser.last_name ? ' ' + tgUser.last_name : ''}`.trim();
      }
      if (tgUser.username) {
        gameState.player.handle = `@${tgUser.username}`;
      }
      if (tgUser.id) {
        gameState.player.telegramId = String(tgUser.id);
      }
      if (typeof updateProfileUI === 'function') updateProfileUI();
      if (DOM.playerUsername) DOM.playerUsername.textContent = gameState.player.name;

      // Enforce 1 Telegram = 1 Account via primary Telegram identity
      if (window.firebaseSync && typeof window.firebaseSync.handleTelegramAuthorization === 'function') {
        window.firebaseSync.handleTelegramAuthorization(tgUser).catch(e => console.warn('TG Auth Sync:', e));
      }
    }

    // Native BackButton handler
    if (tg.BackButton) {
      tg.BackButton.onClick(() => {
        triggerTelegramHaptic('selection');
        if (gameState.currentTab === 'suggestBox' || gameState.currentTab === 'suggest-box') {
          switchPage('profile');
        } else if (['spin', 'chest', 'scratch', 'egg', 'streak', 'adRewards'].includes(gameState.currentTab)) {
          switchPage('reward');
        } else {
          switchPage('home');
        }
      });
    }
  } catch (e) {
    console.warn('Telegram WebApp initialization error:', e);
  }
}

// Telegram Native Haptic Feedback Helper
function triggerTelegramHaptic(type = 'light') {
  const haptic = window.Telegram?.WebApp?.HapticFeedback;
  if (!haptic) return;
  try {
    if (type === 'light') haptic.impactOccurred('light');
    else if (type === 'medium') haptic.impactOccurred('medium');
    else if (type === 'heavy') haptic.impactOccurred('heavy');
    else if (type === 'rigid') haptic.impactOccurred('rigid');
    else if (type === 'soft') haptic.impactOccurred('soft');
    else if (type === 'success') haptic.notificationOccurred('success');
    else if (type === 'warning') haptic.notificationOccurred('warning');
    else if (type === 'error') haptic.notificationOccurred('error');
    else if (type === 'selection') haptic.selectionChanged();
  } catch (e) {}
}

window.initTelegramWebApp = initTelegramWebApp;
window.triggerTelegramHaptic = triggerTelegramHaptic;

// Master Event Initializer
function initEvents() {
  DOM.reactorOrb.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    triggerTelegramHaptic('medium');
    handleOrbTap(e);
  });

  DOM.streakBtn.addEventListener('click', () => {
    triggerTelegramHaptic('selection');
    switchPage('streak');
  });
  DOM.xpCard.addEventListener('click', () => {
    triggerTelegramHaptic('selection');
    switchPage('xp');
  });
  DOM.goalCard.addEventListener('click', () => {
    triggerTelegramHaptic('selection');
    switchPage('goal');
  });

  DOM.navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      triggerTelegramHaptic('selection');
      const tab = btn.dataset.tab;
      switchPage(tab);
    });
  });

  if (DOM.sheetCloseBtn) DOM.sheetCloseBtn.addEventListener('click', closeTabModal);
  if (DOM.modalBackdrop) {
    DOM.modalBackdrop.addEventListener('click', (e) => {
      if (e.target === DOM.modalBackdrop) closeTabModal();
    });
  }

  if (DOM.soundToggleBtn) DOM.soundToggleBtn.addEventListener('click', toggleSound);
  if (DOM.autoTapToggleBtn) DOM.autoTapToggleBtn.addEventListener('click', toggleAutoBot);

  // Background and Offline Lifecycle Handlers
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      if (gameState.energyGenerator) {
        gameState.energyGenerator.lastTickTime = Date.now();
      }
      saveGame();
      if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
        window.firebaseSync.saveToCloudImmediate();
      }
    } else if (document.visibilityState === 'visible') {
      if (typeof processEnergyGeneratorOfflineCatchup === 'function' && gameState.energyGenerator) {
        processEnergyGeneratorOfflineCatchup(gameState.energyGenerator.lastTickTime, 'visibilityChange');
      }
    }
  });

  window.addEventListener('pagehide', () => {
    if (gameState.energyGenerator) gameState.energyGenerator.lastTickTime = Date.now();
    saveGame();
    if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
      window.firebaseSync.saveToCloudImmediate();
    }
  });

  window.addEventListener('beforeunload', () => {
    if (gameState.energyGenerator) gameState.energyGenerator.lastTickTime = Date.now();
    saveGame();
    if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
      window.firebaseSync.saveToCloudImmediate();
    }
  });

  window.addEventListener('focus', () => {
    if (typeof processEnergyGeneratorOfflineCatchup === 'function' && gameState.energyGenerator) {
      processEnergyGeneratorOfflineCatchup(gameState.energyGenerator.lastTickTime, 'windowFocus');
    }
  });
}

// High-Tech Quantum Splash / Loading Screen Controller (requestAnimationFrame)
function initSplashScreen() {
  const splash = document.getElementById('appSplashScreen');
  const bar = document.getElementById('splashProgressBar');
  const glow = document.getElementById('splashProgressGlow');
  const percentText = document.getElementById('splashPercentText');
  const statusText = document.getElementById('splashStatusText');

  if (!splash) return;

  let currentPercent = 0;
  const startTime = performance.now();
  const totalDuration = 1800; // 1.8 seconds smooth progress
  let animFrameId = null;

  const statusMessages = [
    { threshold: 25, text: 'Initializing Quantum Core...' },
    { threshold: 50, text: 'Loading Neural State & Assets...' },
    { threshold: 75, text: 'Connecting to Realtime Cloud...' },
    { threshold: 92, text: 'Calibrating Energy Generators...' },
    { threshold: 100, text: 'Quantum Systems Launch Ready!' }
  ];

  function tickSplash(now) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / totalDuration);
    // Smooth cubic ease out
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    currentPercent = Math.min(100, Math.round(easeProgress * 100));

    if (bar) bar.style.width = `${currentPercent}%`;
    if (glow) glow.style.width = `${currentPercent}%`;
    if (percentText) percentText.textContent = `${currentPercent}%`;

    if (statusText) {
      for (let i = 0; i < statusMessages.length; i++) {
        if (currentPercent <= statusMessages[i].threshold) {
          statusText.textContent = statusMessages[i].text;
          break;
        }
      }
    }

    if (progress < 1) {
      animFrameId = requestAnimationFrame(tickSplash);
    } else {
      setTimeout(() => {
        splash.classList.add('fade-out');
        setTimeout(() => {
          splash.style.display = 'none';
        }, 700);
      }, 250);
    }
  }

  animFrameId = requestAnimationFrame(tickSplash);

  // Safety fallback: guaranteed dismiss within 3.5s
  setTimeout(() => {
    if (splash && splash.style.display !== 'none') {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      splash.classList.add('fade-out');
      setTimeout(() => { splash.style.display = 'none'; }, 700);
    }
  }, 3500);
}

window.initSplashScreen = initSplashScreen;

// Bootstrap
document.addEventListener('DOMContentLoaded', () => {
  initSplashScreen();
  initTelegramWebApp();
  loadSavedGame();
  initAmbientParticles();
  initEvents();
  startEnergyEngine();
  updateUI();
  if (typeof fetchNotifications === 'function') fetchNotifications();
  preloadNonCriticalPages();
});

// ==========================================================================
// NOTIFICATION CENTER CLIENT CONTROLLER
// ==========================================================================
let _cachedNotifications = [];
let _activeNotifFilter = 'all';

async function fetchNotifications() {
  try {
    const res = await fetch('/api/notifications');
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.notifications)) {
        _cachedNotifications = data.notifications;
        updateNotificationBadges();
        renderNotifications();
      }
    }
  } catch (e) {
    // Offline default fallback notifications
    if (!_cachedNotifications || _cachedNotifications.length === 0) {
      _cachedNotifications = [
        { id: 'def_1', type: 'reward', title: '🎁 Daily Reward Available', message: 'Your Daily Streak bonus is ready to collect!', timestamp: Date.now() - 3600000, read: false, actionText: 'Claim Streak', actionTarget: 'streak' },
        { id: 'def_2', type: 'system', title: '🏆 Achievement Unlocked', message: 'Tap Master badge ready to view on your profile!', timestamp: Date.now() - 7200000, read: false, actionText: 'View Badges', actionTarget: 'profile' },
        { id: 'def_3', type: 'reward', title: '🔥 Your 7-day Streak is Active', message: 'Keep tapping daily to maintain your peak multipliers!', timestamp: Date.now() - 86400000, read: false, actionText: 'Check Streak', actionTarget: 'streak' },
        { id: 'def_4', type: 'system', title: '🎉 Community Boss Defeated', message: 'Global milestone reached! +500 Coins added to vault.', timestamp: Date.now() - 172800000, read: true, actionText: 'Rewards', actionTarget: 'reward' },
        { id: 'def_5', type: 'reward', title: '🎁 Season Reward Available', message: 'Season 2 competition rewards have been finalized.', timestamp: Date.now() - 259200000, read: true, actionText: 'Open XP', actionTarget: 'xp' },
        { id: 'def_6', type: 'system', title: '👥 Your Referral Joined', message: 'A new recruit entered the reactor using your invite code.', timestamp: Date.now() - 345600000, read: true, actionText: 'Squad Info', actionTarget: 'profile' }
      ];
      updateNotificationBadges();
      renderNotifications();
    }
  }
}

function updateNotificationBadges() {
  const unreadCount = (_cachedNotifications || []).filter(n => !n.read).length;
  const bellDot = document.getElementById('inboxUnreadDot');
  if (bellDot) bellDot.style.display = unreadCount > 0 ? 'block' : 'none';

  const badgeCount = document.getElementById('inboxUnreadCountBadge');
  if (badgeCount) badgeCount.textContent = `${unreadCount} New`;
}

function toggleNotificationInbox(forceOpen) {
  const overlay = document.getElementById('notificationModalOverlay');
  if (!overlay) return;
  const isOpen = overlay.classList.contains('open');
  const shouldOpen = forceOpen !== undefined ? forceOpen : !isOpen;

  if (shouldOpen) {
    overlay.classList.add('open');
    renderNotifications();
  } else {
    overlay.classList.remove('open');
  }
}

function filterNotifications(filterType) {
  _activeNotifFilter = filterType;
  const tabs = ['All', 'Rewards', 'System'];
  tabs.forEach(t => {
    const tabEl = document.getElementById(`notifFilter${t}`);
    if (tabEl) tabEl.classList.toggle('active', t.toLowerCase() === filterType);
  });
  renderNotifications();
}

function renderNotifications() {
  const container = document.getElementById('notificationItemsList');
  if (!container) return;

  let items = _cachedNotifications || [];
  if (_activeNotifFilter === 'rewards') {
    items = items.filter(n => n.type === 'reward');
  } else if (_activeNotifFilter === 'system') {
    items = items.filter(n => n.type === 'system' || n.type === 'global' || n.type === 'maintenance');
  }

  if (items.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 30px 10px; color: #64748b;">
        <span style="font-size: 32px; display: block; margin-bottom: 6px;">📭</span>
        <div style="font-size: 13px; font-weight: 700;">No notifications found</div>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(n => {
    const timeAgo = formatTimeAgo(n.timestamp || Date.now());
    return `
      <div class="notif-item-card ${n.read ? '' : 'unread'}" id="notifCard-${n.id}">
        <div class="notif-item-header">
          <span class="notif-item-title">${n.title}</span>
          <span class="notif-item-time">${timeAgo}</span>
        </div>
        <p class="notif-item-msg">${n.message}</p>
        <div class="notif-item-actions">
          <button class="notif-action-btn" onclick="handleNotificationAction('${n.id}', '${n.actionTarget || 'home'}')">
            ${n.actionText || 'View'} →
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function formatTimeAgo(ts) {
  const diffSecs = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSecs < 60) return 'Just now';
  if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
  if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
  return `${Math.floor(diffSecs / 86400)}d ago`;
}

function handleNotificationAction(notifId, targetPage) {
  const item = (_cachedNotifications || []).find(n => n.id === notifId);
  if (item) item.read = true;
  updateNotificationBadges();

  // Mark on server
  fetch('/api/notifications/mark-read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: notifId })
  }).catch(() => {});

  toggleNotificationInbox(false);
  if (typeof switchPage === 'function' && targetPage) {
    switchPage(targetPage);
  }
}

async function markAllNotificationsRead() {
  (_cachedNotifications || []).forEach(n => { n.read = true; });
  updateNotificationBadges();
  renderNotifications();

  fetch('/api/notifications/mark-read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ all: true })
  }).catch(() => {});
}

window.toggleNotificationInbox = toggleNotificationInbox;
window.filterNotifications = filterNotifications;
window.handleNotificationAction = handleNotificationAction;
window.markAllNotificationsRead = markAllNotificationsRead;
window.fetchNotifications = fetchNotifications;

