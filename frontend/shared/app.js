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
  } else if (pageName === 'spin' || pageName === 'chest') {
    if (typeof updateRewardViewUI === 'function') updateRewardViewUI();
  } else if (pageName === 'scratch') {
    if (typeof updateRewardViewUI === 'function') updateRewardViewUI();
    if (typeof renderScratchGrid === 'function') renderScratchGrid();
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
// Day 4: 1 Spin Ticket
// Day 5: 1 Scratch Card
// Day 6: 1 Orange Fuel Cell
// Day 7: 5 Green, 2 Yellow, 1 Orange Fuel Cells
// ==========================================================================

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
}

// Bootstrap
document.addEventListener('DOMContentLoaded', () => {
  initTelegramWebApp();
  loadSavedGame();
  initAmbientParticles();
  initEvents();
  startEnergyEngine();
  updateUI();
});
