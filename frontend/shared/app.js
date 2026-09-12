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

// Navigation Switcher (Full Mobile View Pages)
function switchPage(pageName) {
  gameState.currentTab = pageName;

  // Bottom Nav active pill sync
  const allRewardSubPages = [
    'spin', 'chest', 'scratch', 'egg', 'streak', 'megaReward', 'mega-reward',
    'giftCard', 'gift-card', 'gadgets', 'accessories', 'gamingTool', 'gaming-tool',
    'kitchen', 'stationery', 'fitness', 'homeDecorate', 'home-decorate', 'custom'
  ];

  // Bottom Nav active pill sync
  DOM.navButtons.forEach(btn => {
    const isRewardSubPage = allRewardSubPages.includes(pageName);
    const isProfileSubPage = (pageName === 'suggestBox' || pageName === 'suggest-box');
    if (btn.dataset.tab === pageName || (btn.dataset.tab === 'reward' && isRewardSubPage) || (btn.dataset.tab === 'profile' && isProfileSubPage)) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Hide all page views
  document.querySelectorAll('.page-view').forEach(p => p.classList.remove('active'));

  // Close any legacy modal backdrop
  closeTabModal();

  // Activate target page
  const pageMap = {
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
    adRewards: DOM.pageAdRewards,
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
    'suggest-box': document.getElementById('pageSuggestBox')
  };

  const targetElem = pageMap[pageName];
  if (targetElem) {
    targetElem.classList.add('active');
  }

  // Page-specific initializers
  if (pageName === 'home') {
    if (typeof updateHomeUI === 'function') updateHomeUI();
  } else if (pageName === 'energy') {
    if (typeof updateEnergyUI === 'function') updateEnergyUI();
  } else if (pageName === 'tasks') {
    if (typeof renderTasksList === 'function') renderTasksList();
  } else if (pageName === 'profile') {
    if (typeof updateProfileUI === 'function') updateProfileUI();
  } else if (pageName === 'xp') {
    if (typeof renderLevelsList === 'function') renderLevelsList();
    if (typeof updateXpViewUI === 'function') updateXpViewUI();
  } else if (pageName === 'reward' || pageName === 'rewards' || pageName === 'wallet') {
    if (typeof updateRewardViewUI === 'function') updateRewardViewUI();
  } else if (pageName === 'goal') {
    if (typeof renderGoalsList === 'function') renderGoalsList();
    if (typeof updateGoalViewUI === 'function') updateGoalViewUI();
  } else if (pageName === 'streak') {
    renderStreakView();
    startStreakTimer();
  } else if (pageName === 'spin') {
    if (typeof updateRewardViewUI === 'function') updateRewardViewUI();
    if (typeof initSpinChaserBulbs === 'function') initSpinChaserBulbs();
    if (typeof updateSpinTicketUI === 'function') updateSpinTicketUI();
  } else if (pageName === 'chest') {
    if (typeof updateRewardViewUI === 'function') updateRewardViewUI();
    if (typeof updateChestUI === 'function') updateChestUI();
  } else if (pageName === 'scratch') {
    if (typeof updateRewardViewUI === 'function') updateRewardViewUI();
    if (typeof initScratchPage === 'function') initScratchPage();
    if (typeof updateScratchUI === 'function') updateScratchUI();
    else if (typeof renderScratchGrid === 'function') renderScratchGrid();
  } else if (pageName === 'egg') {
    if (typeof updateRewardViewUI === 'function') updateRewardViewUI();
    if (typeof renderEggPageContent === 'function') renderEggPageContent();
  } else if (pageName === 'megaReward' || pageName === 'mega-reward') {
    if (typeof renderMegaRewardPage === 'function') renderMegaRewardPage();
  } else if (['giftCard', 'gift-card', 'gadgets', 'accessories', 'gamingTool', 'gaming-tool', 'kitchen', 'stationery', 'fitness', 'homeDecorate', 'home-decorate'].includes(pageName)) {
    if (typeof renderCategoryProducts === 'function') renderCategoryProducts(pageName);
  } else if (pageName === 'custom') {
    if (typeof initCustomPage === 'function') initCustomPage();
  } else if (pageName === 'suggestBox' || pageName === 'suggest-box') {
    if (typeof initSuggestBoxPage === 'function') initSuggestBoxPage();
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
}

window.switchPage = switchPage;

// ==========================================================================
// DAILY STREAK FULL MOBILE VIEW LOGIC
// 24-Hour Cooldown Cycle & Custom Reward Drops:
// Day 1: 2 Green Fuel Cells
// Day 2: 1 Yellow Fuel Cell
// Day 3: 1 Winning Key
// Day 4: 25 Energy
// Day 5: 1 Cyber Dragon Egg
// Day 6: 1 Fortune Scratch Card
// Day 7: 50 Coins Jackpot
// ==========================================================================
function renderStreakView() {
  const currentStreak = gameState.player.streakDays || 0;
  const streakHeader = document.getElementById('streakDaysCount');
  if (streakHeader) streakHeader.textContent = currentStreak;

  const claimBtn = document.getElementById('btnClaimStreak');
  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const lastClaim = gameState.player.lastStreakClaimTime || 0;
  const timeSinceClaim = now - lastClaim;
  const canClaim = timeSinceClaim >= ONE_DAY_MS || lastClaim === 0;

  if (claimBtn) {
    if (canClaim) {
      claimBtn.disabled = false;
      claimBtn.innerHTML = '<span>⚡ CLAIM DAILY STREAK</span>';
      claimBtn.classList.remove('claimed');
    } else {
      claimBtn.disabled = true;
      const hoursLeft = Math.ceil((ONE_DAY_MS - timeSinceClaim) / (60 * 60 * 1000));
      claimBtn.innerHTML = `<span>⏳ NEXT CLAIM IN ${hoursLeft}H</span>`;
      claimBtn.classList.add('claimed');
    }
  }
}

function startStreakTimer() {
  renderStreakView();
}

// Legacy modal fallback helper
function closeTabModal() {
  if (DOM.modalBackdrop) DOM.modalBackdrop.classList.remove('open');
}

window.closeTabModal = closeTabModal;

// Auto Bot & Audio Controls
function toggleAutoBot() {
  gameState.settings.autoBotEnabled = !gameState.settings.autoBotEnabled;
  if (gameState.settings.autoBotEnabled) {
    DOM.autoTapToggleBtn.classList.add('active');
    DOM.autoTapToggleBtn.innerHTML = `<span>🤖</span> Auto Bot: ON`;
    gameState.autoBotInterval = setInterval(() => {
      if (gameState.currentTab === 'home') handleOrbTap();
    }, 600);
  } else {
    DOM.autoTapToggleBtn.classList.remove('active');
    DOM.autoTapToggleBtn.innerHTML = `<span>🤖</span> Auto Bot: OFF`;
    clearInterval(gameState.autoBotInterval);
    gameState.autoBotInterval = null;
  }
}

function toggleSound() {
  gameState.settings.soundEnabled = !gameState.settings.soundEnabled;
  if (gameState.settings.soundEnabled) {
    DOM.soundToggleBtn.innerHTML = `<span>🔊</span> Sound: ON`;
    DOM.soundToggleBtn.classList.remove('active');
  } else {
    DOM.soundToggleBtn.innerHTML = `<span>🔇</span> Sound: OFF`;
    DOM.soundToggleBtn.classList.add('active');
  }
}

// Master UI Update Coordinator
function updateUI() {
  // Sync Header Balance Badges
  const coinEl = document.getElementById('coinCounter') || document.getElementById('headerCoinBalance');
  if (coinEl) coinEl.textContent = formatNumber(gameState.player.coins);
  const blueCoinEl = document.getElementById('blueCoinCounter') || document.getElementById('headerBlueBalance');
  if (blueCoinEl) blueCoinEl.textContent = formatNumber(gameState.player.diamonds || gameState.player.blueCoins || 0);

  // Sync Home Page
  if (typeof updateHomeUI === 'function') updateHomeUI();
  
  // Sync Energy Page
  if (typeof updateEnergyUI === 'function') updateEnergyUI();
  
  // Sync Profile Page
  if (typeof updateProfileUI === 'function') updateProfileUI();

  // Sync XP & Mega Reward
  if (typeof updateXpViewUI === 'function') updateXpViewUI();

  // Sync Rewards & Bounties
  if (typeof updateRewardViewUI === 'function') updateRewardViewUI();

  // Sync Goal & Grand Chest
  if (typeof updateGoalViewUI === 'function') updateGoalViewUI();

  // Sync Mini-Games Pages
  if (typeof updateSpinTicketUI === 'function') updateSpinTicketUI();
  if (typeof updateChestUI === 'function') updateChestUI();
  if (typeof updateScratchUI === 'function') updateScratchUI();
  if (typeof renderEggPageContent === 'function') renderEggPageContent();
}

window.updateUI = updateUI;

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
      if (typeof updateProfileUI === 'function') updateProfileUI();
      if (DOM.playerUsername) DOM.playerUsername.textContent = gameState.player.name;
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

// High-Tech Quantum Splash / Loading Screen Controller
function initSplashScreen() {
  const splash = document.getElementById('appSplashScreen');
  const bar = document.getElementById('splashProgressBar');
  const glow = document.getElementById('splashProgressGlow');
  const percentText = document.getElementById('splashPercentText');
  const statusText = document.getElementById('splashStatusText');

  if (!splash) return;

  let currentPercent = 0;
  const startTime = Date.now();
  const totalDuration = 1800; // 1.8 seconds smooth progress

  const statusMessages = [
    { threshold: 25, text: 'Initializing Quantum Core...' },
    { threshold: 50, text: 'Loading Neural State & Assets...' },
    { threshold: 75, text: 'Connecting to Realtime Cloud...' },
    { threshold: 92, text: 'Calibrating Energy Generators...' },
    { threshold: 100, text: 'Quantum Systems Launch Ready!' }
  ];

  const interval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(1, elapsed / totalDuration);
    // Smooth cubic ease out
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    currentPercent = Math.min(100, Math.round(easeProgress * 100));

    if (bar) bar.style.width = `${currentPercent}%`;
    if (glow) glow.style.width = `${currentPercent}%`;
    if (percentText) percentText.textContent = `${currentPercent}%`;

    if (statusText) {
      for (const msg of statusMessages) {
        if (currentPercent <= msg.threshold) {
          statusText.textContent = msg.text;
          break;
        }
      }
    }

    if (progress >= 1) {
      clearInterval(interval);
      setTimeout(() => {
        splash.classList.add('fade-out');
        setTimeout(() => {
          splash.style.display = 'none';
        }, 700);
      }, 250);
    }
  }, 25);

  // Safety fallback: guaranteed dismiss within 3.5s
  setTimeout(() => {
    if (splash && splash.style.display !== 'none') {
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
});
