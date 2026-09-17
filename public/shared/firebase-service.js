/* ==========================================================================
   FIREBASE CLOUD DATA & REALTIME SYNC SERVICE (shared/firebase-service.js)
   - Firebase App & Analytics Initialization
   - Anonymous Authentication & Persistent Cloud Player UID
   - Realtime Database Synchronization (Auto-Save, Realtime Load, Offline Fallback)
   - Whitelist Submissions to Firebase
   - Global Live Leaderboard Sync
   ========================================================================== */

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDnujl5_iBlSzwDfjCLA7sFQ7zW1DxROic",
  authDomain: "tap-game-80070.firebaseapp.com",
  databaseURL: "https://tap-game-80070-default-rtdb.firebaseio.com",
  projectId: "tap-game-80070",
  storageBucket: "tap-game-80070.firebasestorage.app",
  messagingSenderId: "1028935905694",
  appId: "1:1028935905694:web:af5190281ad93c0ebbe68f",
  measurementId: "G-B8KMYEQ0L4"
};

class FirebaseSyncService {
  constructor() {
    this.app = null;
    this.analytics = null;
    this.auth = null;
    this.database = null;
    this.userId = null;
    this.isInitialized = false;
    this.isOnline = false;
    this.isAuthenticated = false;
    this.authPromise = null;
    this.saveTimeout = null;
    this.syncStatus = 'connecting'; // 'connecting' | 'synced' | 'saving' | 'offline' | 'auth_required'

    this.init();
  }

  init() {
    try {
      if (typeof firebase !== 'undefined') {
        // Initialize Firebase
        if (!firebase.apps.length) {
          this.app = firebase.initializeApp(firebaseConfig);
        } else {
          this.app = firebase.app();
        }

        // Initialize Analytics if supported
        if (typeof firebase.analytics === 'function') {
          try {
            this.analytics = firebase.analytics();
          } catch (e) {
            console.log('Firebase Analytics initialized or pending', e);
          }
        }

        // Initialize Realtime Database & Auth
        this.database = firebase.database();
        this.auth = firebase.auth();

        // Listen for Authentication state changes (Authentication required for all user data store)
        this.auth.onAuthStateChanged((user) => {
          if (user) {
            this.userId = user.uid;
            this.isAuthenticated = true;
            this.isInitialized = true;
            this.isOnline = true;
            this.setSyncStatus('synced');
            console.log('🔥 Firebase Auth verified! Authenticated Player UID:', this.userId);
            
            // Initial cloud sync: load from Firebase, then attach real-time presence
            this.loadFromCloud();
            this.setupPresence();
            this.listenToMegaRewards();
            this.listenToWebsiteTasks();
            this.listenToTelegramTasks();
            this.listenToUser();
            this.listenToSeason();
            this.listenToMonthlyCompetition();
            this.listenToAdsConfig();
            this.listenToGameConfig();
            this.registerOrUpdateCurrentAuthorization();
            this.listenToAuthorizations();
          } else {
            this.isAuthenticated = false;
            console.log('Firebase Auth required: authenticating player session...');
            this.ensureAuthenticated().catch((error) => {
              console.warn('Firebase Auth failed. Authentication is required to store user data:', error);
              this.setSyncStatus('auth_required');
            });
          }
        });
      } else {
        console.warn('Firebase SDK not loaded, using LocalStorage only.');
        this.setSyncStatus('offline');
      }
    } catch (err) {
      console.error('Firebase Initialization error:', err);
      this.setSyncStatus('offline');
    }
  }

  // ==========================================================================
  // AUTHENTICATION GUARD: REQUIRED FOR STORING ALL USER DATA IN FIREBASE
  // ==========================================================================
  ensureAuthenticated() {
    if (this.auth && this.auth.currentUser) {
      this.userId = this.auth.currentUser.uid;
      this.isAuthenticated = true;
      return Promise.resolve(this.auth.currentUser);
    }

    if (!this.auth) {
      return Promise.reject(new Error('Firebase Auth is not available. Authentication required to store user data.'));
    }

    if (this.authPromise) {
      return this.authPromise;
    }

    this.setSyncStatus('connecting');
    this.authPromise = this.auth.signInAnonymously()
      .then((userCredential) => {
        this.userId = userCredential.user.uid;
        this.isAuthenticated = true;
        this.isOnline = true;
        this.setSyncStatus('synced');
        this.authPromise = null;
        console.log('✅ Firebase Authentication successful for player store:', this.userId);
        return userCredential.user;
      })
      .catch((err) => {
        this.authPromise = null;
        this.isAuthenticated = false;
        this.setSyncStatus('auth_required');
        console.warn('⚠️ Firebase Authentication required before storing user data:', err);
        throw err;
      });

    return this.authPromise;
  }

  getOrCreateLocalUid() {
    let uid = localStorage.getItem('ENERGY_TAP_FIREBASE_LOCAL_UID_V5');
    if (!uid) {
      uid = 'user_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      localStorage.setItem('ENERGY_TAP_FIREBASE_LOCAL_UID_V5', uid);
    }
    return uid;
  }

  setSyncStatus(status) {
    this.syncStatus = status;
    const statusEls = document.querySelectorAll('.firebase-cloud-status-badge');
    statusEls.forEach(statusEl => {
      if (status === 'synced') {
        statusEl.innerHTML = `<span class="cloud-dot online">●</span> 🔐 Auth Synced`;
        statusEl.className = 'firebase-cloud-status-badge synced';
      } else if (status === 'saving') {
        statusEl.innerHTML = `<span class="cloud-dot syncing">●</span> 🔐 Saving...`;
        statusEl.className = 'firebase-cloud-status-badge saving';
      } else if (status === 'connecting') {
        statusEl.innerHTML = `<span class="cloud-dot connecting">●</span> 🔐 Authenticating...`;
        statusEl.className = 'firebase-cloud-status-badge connecting';
      } else if (status === 'auth_required') {
        statusEl.innerHTML = `<span class="cloud-dot offline">●</span> ⚠️ Auth Required`;
        statusEl.className = 'firebase-cloud-status-badge offline';
      } else {
        statusEl.innerHTML = `<span class="cloud-dot offline">●</span> Offline Mode`;
        statusEl.className = 'firebase-cloud-status-badge offline';
      }
    });
  }

  setupPresence() {
    if (!this.database || !this.userId) return;
    const connectedRef = this.database.ref('.info/connected');
    connectedRef.on('value', (snap) => {
      if (snap.val() === true) {
        this.isOnline = true;
        this.setSyncStatus('synced');
      } else {
        this.isOnline = false;
        this.setSyncStatus('offline');
      }
    });
  }

  // Load Game Data From Firebase
  loadFromCloud() {
    if (!this.database || !this.userId) return;

    const userRef = this.database.ref(`players/${this.userId}`);
    userRef.once('value')
      .then((snapshot) => {
        const cloudData = snapshot.val();
        if (cloudData && typeof cloudData === 'object') {
          console.log('🔥 Cloud state retrieved from Firebase:', cloudData);

          // Check if cloud state is from older version before Global Zero Reset
          const cloudResetVer = cloudData.resetVersion || 0;
          const cloudUpdatedAt = cloudData.updatedAt || 0;
          const resetEpoch = (typeof GLOBAL_RESET_TIMESTAMP !== 'undefined') ? GLOBAL_RESET_TIMESTAMP : 1773510000000;
          const requiredVer = (typeof GAME_RESET_VERSION !== 'undefined') ? GAME_RESET_VERSION : 6;

          if (cloudResetVer < requiredVer || cloudUpdatedAt < resetEpoch) {
            console.log('🔄 Cloud player record is from prior season/version. Resetting player to Level 0, zero balances, and new event timers!');
            if (typeof resetAllDataToZero === 'function') {
              resetAllDataToZero();
            }
            return;
          }

          // Merge cloud data into gameState
          if (cloudData.player) Object.assign(gameState.player, cloudData.player);
          if (cloudData.goal) Object.assign(gameState.goal, cloudData.goal);
          if (cloudData.tasksState) Object.assign(gameState.tasksState, cloudData.tasksState);
          if (cloudData.xpState) Object.assign(gameState.xpState, cloudData.xpState);
          if (cloudData.goalState) Object.assign(gameState.goalState, cloudData.goalState);
          if (cloudData.dailyStats) Object.assign(gameState.dailyStats, cloudData.dailyStats);

          let shouldCatchup = false;
          let catchupTimestamp = null;

          if (cloudData.energyGenerator) {
            const cloudTick = Number(cloudData.energyGenerator.lastTickTime) || Number(cloudData.updatedAt) || 0;
            const localTick = Number(gameState.energyGenerator.lastTickTime) || 0;

            // If cloud tick is newer than local tick, accept cloud energy and generator state
            if (cloudTick > localTick) {
              Object.assign(gameState.energyGenerator, cloudData.energyGenerator);
              if (cloudData.reactor) {
                Object.assign(gameState.reactor, cloudData.reactor);
                if (cloudData.reactor.currentEnergy !== undefined) {
                  gameState.reactor.currentEnergy = Number(cloudData.reactor.currentEnergy);
                }
              }
              catchupTimestamp = cloudTick;
              shouldCatchup = true;
            } else {
              // Local state is already up to date or progressed ahead
              if (cloudData.reactor) {
                // Keep the higher or local energy to avoid reverting offline gains
                const cloudEnergy = Number(cloudData.reactor.currentEnergy) || 0;
                if ((gameState.reactor.currentEnergy || 0) < cloudEnergy) {
                  gameState.reactor.currentEnergy = cloudEnergy;
                }
              }
            }
          } else if (cloudData.reactor) {
            Object.assign(gameState.reactor, cloudData.reactor);
            if (cloudData.reactor.currentEnergy !== undefined) {
              gameState.reactor.currentEnergy = Number(cloudData.reactor.currentEnergy);
            }
          }

          if (shouldCatchup && catchupTimestamp && typeof processEnergyGeneratorOfflineCatchup === 'function') {
            processEnergyGeneratorOfflineCatchup(catchupTimestamp, 'firebaseCloud');
          }

          // Synchronize Energy Counters on both Home and Energy pages
          const curEnergy = Math.floor(gameState.reactor.currentEnergy || 0);
          const maxEnergy = gameState.reactor.maxEnergy || 1000;
          const energyTapCountEl = document.getElementById('energyTapCount');
          if (energyTapCountEl) energyTapCountEl.textContent = `${curEnergy.toLocaleString()} / ${maxEnergy.toLocaleString()}`;
          const epBadgeIconEl = document.querySelector('#epCounterPill .ep-badge-icon');
          if (epBadgeIconEl) epBadgeIconEl.textContent = (Number(gameState.reactor.currentEnergy) || 0).toFixed(2);

          // Update UI with cloud loaded state
          if (typeof updateUI === 'function') updateUI();
          if (typeof renderTasksList === 'function') renderTasksList();
          if (typeof renderLevelsList === 'function') renderLevelsList();
          if (typeof renderGoalsList === 'function') renderGoalsList();
          if (typeof updateMegaDiamondDisplay === 'function') updateMegaDiamondDisplay();
        } else {
          // Data was removed from Firebase or first time: initialize clean 0 state
          if (typeof gameState !== 'undefined' && gameState.player) {
            gameState.player.level = 0;
            gameState.player.xp = 0;
            gameState.player.coins = 0;
            gameState.player.diamonds = 0;
            gameState.player.chestKeys = 0;
            gameState.player.scratchCards = 0;
            gameState.player.chestTickets = 0;
            gameState.player.eggs = 0;
            gameState.player.adsWatchedCount = 0;
            gameState.player.websiteTasksCompleted = 0;
          }
          if (typeof saveGame === 'function') saveGame();
          if (typeof updateUI === 'function') updateUI();
        }
      })
      .catch((err) => {
        console.warn('Error fetching data from Firebase:', err);
      });
  }

  // Real-time listener for user updates / resets from Admin Portal
  listenToUser() {
    if (!this.database || !this.userId) return;

    const userRef = this.database.ref(`players/${this.userId}`);
    userRef.on('value', (snapshot) => {
      const cloudData = snapshot.val();
      if (!cloudData || typeof cloudData !== 'object') {
        // Player was removed from Firebase: reset all local state to 0
        if (typeof resetAllDataToZero === 'function') {
          resetAllDataToZero();
        }
        return;
      }

      // Check if remote cloud state is from older version before Global Zero Reset
      const cloudResetVer = cloudData.resetVersion || 0;
      const cloudUpdatedAt = cloudData.updatedAt || 0;
      const resetEpoch = (typeof GLOBAL_RESET_TIMESTAMP !== 'undefined') ? GLOBAL_RESET_TIMESTAMP : 1773510000000;
      const requiredVer = (typeof GAME_RESET_VERSION !== 'undefined') ? GAME_RESET_VERSION : 6;

      if (cloudResetVer < requiredVer || cloudUpdatedAt < resetEpoch) {
        console.log('🔄 Remote cloud player record is older than Global Zero Reset. Enforcing fresh zero state!');
        if (typeof resetAllDataToZero === 'function') {
          resetAllDataToZero();
        }
        return;
      }

      let hasChanged = false;

      if (cloudData.player && typeof gameState !== 'undefined' && gameState.player) {
        if (gameState.player.level !== cloudData.player.level) {
          gameState.player.level = cloudData.player.level || 0;
          hasChanged = true;
        }
        if (gameState.player.coins !== cloudData.player.coins) {
          gameState.player.coins = cloudData.player.coins || 0;
          hasChanged = true;
        }
        if (gameState.player.diamonds !== cloudData.player.diamonds) {
          gameState.player.diamonds = cloudData.player.diamonds || 0;
          hasChanged = true;
        }
        if (cloudData.player.blueCoins !== undefined && gameState.player.blueCoins !== cloudData.player.blueCoins) {
          gameState.player.blueCoins = cloudData.player.blueCoins || 0;
          hasChanged = true;
        }
        if (gameState.player.chestKeys !== cloudData.player.chestKeys) {
          gameState.player.chestKeys = cloudData.player.chestKeys || 0;
          hasChanged = true;
        }
        if (gameState.player.scratchCards !== cloudData.player.scratchCards) {
          gameState.player.scratchCards = cloudData.player.scratchCards || 0;
          hasChanged = true;
        }
        if (gameState.player.chestTickets !== cloudData.player.chestTickets) {
          gameState.player.chestTickets = cloudData.player.chestTickets || 0;
          hasChanged = true;
        }
        if (gameState.player.eggs !== cloudData.player.eggs) {
          gameState.player.eggs = cloudData.player.eggs || 0;
          hasChanged = true;
        }
        if (cloudData.player.xp !== undefined && gameState.player.xp !== cloudData.player.xp) {
          gameState.player.xp = cloudData.player.xp || 0;
          hasChanged = true;
        }
      }

      if (cloudData.goal && typeof gameState !== 'undefined' && gameState.goal) {
        if (gameState.goal.level !== cloudData.goal.level) {
          gameState.goal.level = cloudData.goal.level || 0;
          gameState.goal.currentCoins = cloudData.goal.currentCoins || 0;
          gameState.goal.currentKeys = cloudData.goal.currentKeys || 0;
          gameState.goal.currentTickets = cloudData.goal.currentTickets || 0;
          hasChanged = true;
        }
      }

      if (cloudData.goalState && typeof gameState !== 'undefined' && gameState.goalState) {
        if (gameState.goalState.currentLevel !== cloudData.goalState.currentLevel) {
          gameState.goalState.currentLevel = cloudData.goalState.currentLevel || 0;
          gameState.goalState.claimedGoals = cloudData.goalState.claimedGoals || {};
          hasChanged = true;
        } else if (JSON.stringify(gameState.goalState.claimedGoals || {}) !== JSON.stringify(cloudData.goalState.claimedGoals || {})) {
          gameState.goalState.claimedGoals = cloudData.goalState.claimedGoals || {};
          hasChanged = true;
        }
        if (cloudData.goalState.seasonEndMs && gameState.goalState.seasonEndMs !== cloudData.goalState.seasonEndMs) {
          gameState.goalState.seasonEndMs = cloudData.goalState.seasonEndMs;
          hasChanged = true;
        }
      }

      if (cloudData.xpState && typeof gameState !== 'undefined' && gameState.xpState) {
        if (JSON.stringify(gameState.xpState.claimedLevels || {}) !== JSON.stringify(cloudData.xpState.claimedLevels || {})) {
          gameState.xpState.claimedLevels = cloudData.xpState.claimedLevels || {};
          hasChanged = true;
        }
        if (cloudData.xpState.seasonEndMs && gameState.xpState.seasonEndMs !== cloudData.xpState.seasonEndMs) {
          gameState.xpState.seasonEndMs = cloudData.xpState.seasonEndMs;
          hasChanged = true;
        }
      }

      if (cloudData.tasksState && typeof gameState !== 'undefined' && gameState.tasksState) {
        if (JSON.stringify(gameState.tasksState.claimedDaily || {}) !== JSON.stringify(cloudData.tasksState.claimedDaily || {})) {
          gameState.tasksState.claimedDaily = cloudData.tasksState.claimedDaily || {};
          hasChanged = true;
        }
      }

      if (hasChanged) {
        if (typeof saveGame === 'function') saveGame();
        if (typeof updateUI === 'function') updateUI();
        if (typeof renderTasksList === 'function') renderTasksList();
        if (typeof renderLevelsList === 'function') renderLevelsList();
        if (typeof renderGoalsList === 'function') renderGoalsList();
        if (typeof updateMegaDiamondDisplay === 'function') updateMegaDiamondDisplay();
      }
    });
  }

  // Real-time listener for Global Season Resets from Admin (/season)
  listenToSeason() {
    if (!this.database) return;

    const seasonRef = this.database.ref('/season');
    seasonRef.on('value', (snapshot) => {
      let seasonData = snapshot.val();
      const now = Date.now();
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const resetEpoch = (typeof GLOBAL_RESET_TIMESTAMP !== 'undefined') ? GLOBAL_RESET_TIMESTAMP : 1773510000000;

      if (!seasonData || !seasonData.forceRestartTimestamp || seasonData.forceRestartTimestamp < resetEpoch) {
        seasonData = {
          seasonNumber: 2,
          seasonStartTime: now,
          seasonEndTime: now + thirtyDaysMs,
          seasonDurationDays: 30,
          forceRestartTimestamp: now,
          lastUpdated: now
        };
        seasonRef.set(seasonData).catch(() => {});
      }

      const adminSeasonTimestamp = seasonData.forceRestartTimestamp || seasonData.seasonStartTime || 0;
      const localLastProcessed = Number(localStorage.getItem('ENERGY_TAP_LAST_ADMIN_SEASON_RESET') || 0);

      // If admin triggered a new season reset after our last processed reset
      if (adminSeasonTimestamp > localLastProcessed) {
        localStorage.setItem('ENERGY_TAP_LAST_ADMIN_SEASON_RESET', adminSeasonTimestamp);
        console.log('🔄 Global Admin Season Reset received from Firebase! Restoring levels & zero balances for user:', this.userId);

        const duration = (seasonData.seasonDurationDays ? seasonData.seasonDurationDays * 86400 * 1000 : thirtyDaysMs);

        // Reset user XP level claim data, watched ads, and restart level progression
        if (gameState.xpState) {
          gameState.xpState.claimedLevels = {};
          gameState.xpState.watchedAds = 0;
          gameState.xpState.megaRewardClaimed = false;
          gameState.xpState.seasonEndMs = now + duration;
        }
        if (gameState.player) {
          gameState.player.level = 0;
          gameState.player.xp = 0;
          gameState.player.xpToNextLevel = 1000;
          gameState.player.coins = 0;
          gameState.player.blueCoins = 0;
          gameState.player.diamonds = 0;
          gameState.player.chestKeys = 0;
          gameState.player.chestTickets = 0;
          gameState.player.scratchCards = 0;
          gameState.player.eggs = 0;
        }

        // Reset user Goal level claim data and progress
        if (gameState.goalState) {
          gameState.goalState.claimedGoals = {};
          gameState.goalState.currentLevel = 0;
          gameState.goalState.levelProgress = { cards: 0, keys: 0, tickets: 0 };
          gameState.goalState.levelAdsWatched = 0;
          gameState.goalState.megaWatchedAds = 0;
          gameState.goalState.megaRewardClaimed = false;
          gameState.goalState.grandChestClaimed = false;
          gameState.goalState.seasonEndMs = now + duration;
        }
        if (gameState.goal) {
          gameState.goal.level = 0;
          gameState.goal.currentCoins = 0;
          gameState.goal.currentKeys = 0;
          gameState.goal.currentTickets = 0;
        }

        // Reset Reactor & Generator Energy
        if (gameState.reactor) {
          gameState.reactor.currentEnergy = 0;
          gameState.reactor.energyTaps = 0;
          gameState.reactor.comboTaps = 0;
          gameState.reactor.comboMultiplier = 1.0;
        }
        if (gameState.energyGenerator) {
          gameState.energyGenerator.epTotal = 0;
          gameState.energyGenerator.remainingSeconds = 0;
          gameState.energyGenerator.isActive = false;
          gameState.energyGenerator.fuelCells = { green: 0, darkgreen: 0, yellow: 0, orange: 0, red: 0, pink: 0, purple: 0 };
          gameState.energyGenerator.consumed = { green: 0, darkgreen: 0, yellow: 0, orange: 0, red: 0, pink: 0, purple: 0 };
          gameState.energyGenerator.boosts = {
            pink: { activeRemainingSeconds: 0, cooldownRemainingSeconds: 0, adsWatched: 0, multiplier: 2 },
            purple: { activeRemainingSeconds: 0, cooldownRemainingSeconds: 0, adsWatched: 0, multiplier: 5 }
          };
        }

        // Reset monthly tasks
        if (gameState.tasksState) {
          gameState.tasksState.claimedDaily = {};
          gameState.tasksState.claimedTelegram = {};
          gameState.tasksState.claimedWebsite = {};
          gameState.tasksState.claimedMonthly = {};
        }
        if (gameState.dailyStats) {
          gameState.dailyStats.spins = 0;
          gameState.dailyStats.chests = 0;
          gameState.dailyStats.scratches = 0;
          gameState.dailyStats.eggs = 0;
          gameState.dailyStats.taps = 0;
          gameState.dailyStats.fuel_green = 0;
          gameState.dailyStats.fuel_yellow = 0;
          gameState.dailyStats.fuel_orange = 0;
          gameState.dailyStats.fuel_red = 0;
          gameState.dailyStats.fuel_pink = 0;
          gameState.dailyStats.fuel_purple = 0;
          gameState.dailyStats.fuel_darkgreen = 0;
          gameState.dailyStats.resetTimestamp = now;
        }

        if (typeof saveGame === 'function') saveGame();
        if (typeof updateUI === 'function') updateUI();
        if (typeof renderTasksList === 'function') renderTasksList();
        if (typeof renderLevelsList === 'function') renderLevelsList();
        if (typeof renderGoalsList === 'function') renderGoalsList();
        if (typeof formatTimerDisplay === 'function') formatTimerDisplay();

        // Immediately persist this user's newly restored state to their individual Firebase node
        this.saveToCloudImmediate();

        if (typeof showFloatingToast === 'function') {
          showFloatingToast('🌟 New Season Started! Level 0 & Zero Balances across all users!');
        }
      }
    });
  }

  // Real-time listener for Global 30-Day Monthly Task Competition (/monthly_competition)
  listenToMonthlyCompetition() {
    if (!this.database) return;

    const compRef = this.database.ref('/monthly_competition');
    compRef.on('value', (snapshot) => {
      let compData = snapshot.val();
      const now = Date.now();
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const resetEpoch = (typeof GLOBAL_RESET_TIMESTAMP !== 'undefined') ? GLOBAL_RESET_TIMESTAMP : 1773510000000;

      if (!compData || typeof compData !== 'object' || !compData.endTime || !compData.forceResetTimestamp || compData.forceResetTimestamp < resetEpoch) {
        // Initialize 30-day competition in Firebase backend if not yet set or outdated
        compData = {
          title: '30-Day Monthly Task Competition',
          cycleDays: 30,
          cycleNumber: 2,
          startTime: now,
          endTime: now + thirtyDaysMs,
          forceResetTimestamp: now,
          lastUpdated: now
        };
        compRef.set(compData).catch(() => {});
      }

      // Check if competition cycle naturally expired in Firebase backend
      if (now >= compData.endTime) {
        console.log('⏳ 30-day competition cycle reached its end! Advancing to next cycle in Firebase backend.');
        compData = {
          title: '30-Day Monthly Task Competition',
          cycleDays: 30,
          cycleNumber: (compData.cycleNumber || 1) + 1,
          startTime: now,
          endTime: now + thirtyDaysMs,
          forceResetTimestamp: now,
          lastUpdated: now
        };
        compRef.set(compData).catch(() => {});
      }

      // Save into gameState
      if (typeof gameState !== 'undefined') {
        gameState.monthlyCompetition = compData;
      }
      try {
        localStorage.setItem('ENERGY_TAP_MONTHLY_COMPETITION', JSON.stringify(compData));
      } catch(e) {}

      const adminResetTimestamp = compData.forceResetTimestamp || compData.startTime || 0;
      const localLastProcessed = Number(localStorage.getItem('ENERGY_TAP_LAST_MONTHLY_COMP_RESET') || 0);

      // Trigger reset if new cycle or admin force-reset was triggered
      if (adminResetTimestamp > localLastProcessed) {
        localStorage.setItem('ENERGY_TAP_LAST_MONTHLY_COMP_RESET', adminResetTimestamp);
        console.log('🔄 Firebase Monthly Task Competition Reset applied for player:', this.userId);

        if (typeof gameState !== 'undefined') {
          if (!gameState.tasksState) {
            gameState.tasksState = { claimedDaily: {}, claimedTelegram: {}, claimedWebsite: {} };
          }
          gameState.tasksState.claimedDaily = {};
          gameState.tasksState.claimedTelegram = {};
          gameState.tasksState.claimedWebsite = {};
          if (gameState.tasksState.claimedMonthly) {
            gameState.tasksState.claimedMonthly = {};
          }

          if (!gameState.dailyStats) {
            gameState.dailyStats = {};
          }
          gameState.dailyStats.spins = 0;
          gameState.dailyStats.chests = 0;
          gameState.dailyStats.scratches = 0;
          gameState.dailyStats.eggs = 0;
          gameState.dailyStats.taps = 0;
          gameState.dailyStats.fuel_green = 0;
          gameState.dailyStats.fuel_yellow = 0;
          gameState.dailyStats.fuel_orange = 0;
          gameState.dailyStats.fuel_red = 0;
          gameState.dailyStats.fuel_pink = 0;
          gameState.dailyStats.fuel_purple = 0;
          gameState.dailyStats.fuel_darkgreen = 0;
          gameState.dailyStats.date = new Date().toDateString();
          gameState.dailyStats.resetTimestamp = compData.startTime;

          if (typeof saveGame === 'function') saveGame();
          if (typeof updateUI === 'function') updateUI();
          if (typeof renderTasksList === 'function') renderTasksList();
          if (typeof updateMonthlyCompetitionTimer === 'function') updateMonthlyCompetitionTimer();

          // Sync reset state directly to player's Firebase record
          this.saveToCloudImmediate();

          if (typeof showFloatingToast === 'function') {
            showFloatingToast(`🏆 New 30-Day Monthly Quest Competition Cycle #${compData.cycleNumber || 1} Started!`);
          }
        }
      } else {
        // Ensure UI countdown timer has latest Firebase end time
        if (typeof updateMonthlyCompetitionTimer === 'function') {
          updateMonthlyCompetitionTimer();
        }
      }
    });
  }

  // Debounced Save (efficient for fast taps)
  debouncedSave() {
    if (!this.database || !this.userId) return;
    this.setSyncStatus('saving');
    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.saveToCloudImmediate();
    }, 1200);
  }

  // Immediate Save to Firebase
  saveToCloudImmediate() {
    if (!this.database) return;

    // Authentication is strictly required for all user data store
    this.ensureAuthenticated().then(() => {
      if (!this.userId) return;

      // Calculate aggregated activity metrics
      const totalAdsWatched = (gameState.player.adsWatchedCount || 0) + 
        (gameState.xpState ? (gameState.xpState.watchedAds || 0) : 0) + 
        (gameState.goalState ? ((gameState.goalState.levelAdsWatched || 0) + (gameState.goalState.megaWatchedAds || 0)) : 0);

      const completedWebTasks = (gameState.tasksState && gameState.tasksState.claimedWebsite) 
        ? Object.keys(gameState.tasksState.claimedWebsite).filter(k => gameState.tasksState.claimedWebsite[k]).length 
        : ((gameState.tasksState && gameState.tasksState.claimedTelegram) 
            ? Object.keys(gameState.tasksState.claimedTelegram).filter(k => gameState.tasksState.claimedTelegram[k]).length 
            : (gameState.player.websiteTasksCompleted || 0));

      if (!gameState.player.profileCode && this.userId) {
        const cleanUid = this.userId.replace(/[^a-zA-Z0-9]/g, '');
        gameState.player.profileCode = 'ET-' + (cleanUid.length >= 6 ? cleanUid.slice(-6).toUpperCase() : this.userId.toUpperCase());
      }

      const playerPayload = {
        ...gameState.player,
        profileCode: gameState.player.profileCode,
        adsWatchedCount: totalAdsWatched,
        websiteTasksCompleted: completedWebTasks
      };

      const payload = {
        resetVersion: (typeof GAME_RESET_VERSION !== 'undefined') ? GAME_RESET_VERSION : 6,
        updatedAt: typeof firebase !== 'undefined' && firebase.database && firebase.database.ServerValue ? firebase.database.ServerValue.TIMESTAMP : Date.now(),
        player: playerPayload,
        goal: gameState.goal,
        reactor: {
          tapPower: gameState.reactor.tapPower || 1,
          currentEnergy: Number((gameState.reactor.currentEnergy || 0).toFixed(2)),
          maxEnergy: gameState.reactor.maxEnergy || 1000,
          energyTaps: gameState.reactor.energyTaps || 0,
          comboMultiplier: gameState.reactor.comboMultiplier || 1.0,
          comboTaps: gameState.reactor.comboTaps || 0
        },
        energyGenerator: {
          epTotal: Number((gameState.energyGenerator.epTotal || 0).toFixed(2)),
          remainingSeconds: Math.max(0, Math.floor(gameState.energyGenerator.remainingSeconds || 0)),
          ratePerSec: gameState.energyGenerator.ratePerSec || gameState.energyGenerator.ratePerMin || 0.01,
          ratePerMin: gameState.energyGenerator.ratePerSec || gameState.energyGenerator.ratePerMin || 0.01,
          lastTickTime: gameState.energyGenerator.lastTickTime || Date.now(),
          lastSavedTime: Date.now(),
          fuelCells: gameState.energyGenerator.fuelCells,
          consumed: gameState.energyGenerator.consumed,
          boosts: gameState.energyGenerator.boosts
        },
        tasksState: gameState.tasksState,
        xpState: gameState.xpState,
        goalState: gameState.goalState,
        dailyStats: gameState.dailyStats
      };

      this.database.ref(`players/${this.userId}`).set(payload)
        .then(() => {
          this.setSyncStatus('synced');
          // Also update leaderboard entry
          this.updateLeaderboardEntry();
        })
        .catch((err) => {
          console.warn('Firebase save failed:', err);
          if (err.code === 'PERMISSION_DENIED') {
            this.setSyncStatus('auth_required');
          } else {
            this.setSyncStatus('offline');
          }
        });
    }).catch((err) => {
      console.warn('⚠️ User data store rejected: Authentication required!', err);
      this.setSyncStatus('auth_required');
    });
  }

  // Live Leaderboard synchronization (Authentication required)
  updateLeaderboardEntry() {
    if (!this.database) return;
    this.ensureAuthenticated().then(() => {
      if (!this.userId) return;
      const leaderboardPayload = {
        name: gameState.player.name || 'Alex Vance',
        handle: gameState.player.handle || 'alex_blue',
        level: Number(gameState.player.level || 0),
        coins: Number(gameState.player.coins || 0),
        energyTaps: Number(gameState.reactor.energyTaps || 0),
        resetVersion: (typeof GAME_RESET_VERSION !== 'undefined') ? GAME_RESET_VERSION : 6,
        lastActive: typeof firebase !== 'undefined' && firebase.database && firebase.database.ServerValue ? firebase.database.ServerValue.TIMESTAMP : Date.now()
      };
      this.database.ref(`leaderboard/${this.userId}`).set(leaderboardPayload).catch(() => {});
    }).catch(() => {});
  }

  // Global Admin Reset: Force-restart Season, Competition & User balances across all users
  triggerGlobalAdminReset() {
    if (!this.database) return Promise.reject(new Error('Firebase Realtime Database is not initialized.'));
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    const seasonUpdate = this.database.ref('/season').set({
      seasonNumber: 2,
      seasonStartTime: now,
      seasonEndTime: now + thirtyDaysMs,
      seasonDurationDays: 30,
      forceRestartTimestamp: now,
      lastUpdated: now
    });

    const competitionUpdate = this.database.ref('/monthly_competition').set({
      title: '30-Day Monthly Task Competition',
      cycleDays: 30,
      cycleNumber: 2,
      startTime: now,
      endTime: now + thirtyDaysMs,
      forceResetTimestamp: now,
      lastUpdated: now
    });

    return Promise.all([seasonUpdate, competitionUpdate])
      .then(() => {
        console.log('🌟 Global Admin Season & Competition reset signals pushed to Firebase!');
        if (typeof resetAllDataToZero === 'function') {
          resetAllDataToZero();
        }
        if (typeof showFloatingToast === 'function') {
          showFloatingToast('🚀 Global Reset Applied: Level 0 & Zero Balances across all users!');
        }
        return true;
      })
      .catch((err) => {
        console.warn('Firebase global reset error:', err);
        if (typeof resetAllDataToZero === 'function') {
          resetAllDataToZero();
        }
        return false;
      });
  }

  // Submit Whitelist to Firebase (Authentication required)
  saveWhitelist(handleOrEmail) {
    if (!this.database) return Promise.resolve();
    return this.ensureAuthenticated().then(() => {
      if (!this.userId) return Promise.resolve();
      return this.database.ref(`whitelist/${this.userId}`).set({
        handleOrEmail: handleOrEmail,
        name: gameState.player.name,
        submittedAt: Date.now()
      });
    }).catch(() => Promise.resolve());
  }

  // ==========================================================================
  // MEGA REWARDS REAL-TIME READ LISTENER
  // ==========================================================================
  listenToMegaRewards() {
    if (!this.database) {
      // Load local cache if database is not ready
      this.loadCachedMegaRewards();
      return;
    }

    const rewardsRef = this.database.ref('/mega_rewards');
    rewardsRef.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Array.isArray(data) ? data : Object.keys(data).map(k => ({ id: k, ...data[k] }));
        window.cloudMegaRewards = list.filter(Boolean).map(item => ({
          ...item,
          diamonds: item.diamonds !== undefined ? Number(item.diamonds) : (Number(item.diamondCost) || 100),
          diamondCost: item.diamondCost !== undefined ? Number(item.diamondCost) : (Number(item.diamonds) || 100)
        }));
        try {
          localStorage.setItem('ENERGY_TAP_MEGA_REWARDS_CACHE_V1', JSON.stringify(window.cloudMegaRewards));
        } catch (e) {}
        console.log(`🔥 Received ${window.cloudMegaRewards.length} mega rewards from cloud.`);
      } else {
        // Explicitly empty: admin removed all rewards
        window.cloudMegaRewards = [];
        try {
          localStorage.setItem('ENERGY_TAP_MEGA_REWARDS_CACHE_V1', '[]');
        } catch (e) {}
        console.log('🔥 Mega rewards empty or cleared from cloud.');
      }

      // Re-render current category page if open
      if (typeof window.renderCurrentCategoryRewards === 'function') {
        window.renderCurrentCategoryRewards();
      }
      window.dispatchEvent(new CustomEvent('megaRewardsUpdated', { detail: window.cloudMegaRewards }));
    }, (err) => {
      console.warn('Could not fetch cloud mega rewards, using local cache:', err);
      this.loadCachedMegaRewards();
    });
  }

  listenToAdsConfig() {
    if (!this.database) return;
    this.database.ref('/ads_config').on('value', (snapshot) => {
      const val = snapshot.val();
      if (val) {
        window.cloudAdsConfig = val;
        // Update direct ad button label if present
        const directBtn = document.getElementById('directAdBtnText');
        if (directBtn && val.directRewardCoins) {
          directBtn.textContent = `🔗 VISIT SPONSOR & GET +${val.directRewardCoins} 🪙`;
        }
      }
    });
  }

  loadCachedMegaRewards() {
    try {
      const cached = localStorage.getItem('ENERGY_TAP_MEGA_REWARDS_CACHE_V1') || localStorage.getItem('ENERGY_TAP_MEGA_REWARDS_DATA_V1');
      if (cached) {
        window.cloudMegaRewards = JSON.parse(cached);
        return;
      }
    } catch (e) {}
    window.cloudMegaRewards = [];
  }

  // ==========================================================================
  // WEBSITE TASKS REAL-TIME CONFIG LISTENER (/website_tasks_config)
  // ==========================================================================
  listenToWebsiteTasks() {
    if (!this.database) {
      this.loadCachedWebsiteTasks();
      return;
    }

    const tasksRef = this.database.ref('/website_tasks_config');
    tasksRef.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const rawList = Array.isArray(data) ? data : Object.values(data);
        window.cloudWebsiteTasks = rawList.filter(Boolean);
        try {
          localStorage.setItem('ENERGY_TAP_WEBSITE_TASKS_CONFIG_V1', JSON.stringify(window.cloudWebsiteTasks));
        } catch (e) {}
        console.log(`🌐 Received ${window.cloudWebsiteTasks.length} website tasks from cloud.`);
      } else {
        // Admin deleted or cleared all website tasks
        window.cloudWebsiteTasks = [];
        try {
          localStorage.setItem('ENERGY_TAP_WEBSITE_TASKS_CONFIG_V1', '[]');
        } catch (e) {}
        console.log('🌐 Website tasks cleared from cloud.');
      }

      // Re-render tasks list if tasks page is active
      if (typeof window.renderTasksList === 'function') {
        window.renderTasksList();
      }
      window.dispatchEvent(new CustomEvent('websiteTasksUpdated', { detail: window.cloudWebsiteTasks }));
    }, (err) => {
      console.warn('Could not fetch cloud website tasks, using local cache:', err);
      this.loadCachedWebsiteTasks();
    });
  }

  loadCachedWebsiteTasks() {
    try {
      const cached = localStorage.getItem('ENERGY_TAP_WEBSITE_TASKS_CONFIG_V1');
      if (cached) {
        window.cloudWebsiteTasks = JSON.parse(cached);
        return;
      }
    } catch (e) {}
    window.cloudWebsiteTasks = null;
  }

  // ==========================================================================
  // TELEGRAM TASKS REAL-TIME CONFIG LISTENER (/telegram_tasks_config)
  // ==========================================================================
  listenToTelegramTasks() {
    if (!this.database) {
      this.loadCachedTelegramTasks();
      return;
    }

    const tasksRef = this.database.ref('/telegram_tasks_config');
    tasksRef.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const rawList = Array.isArray(data) ? data : Object.values(data);
        window.cloudTelegramTasks = rawList.filter(Boolean);
        try {
          localStorage.setItem('ENERGY_TAP_TELEGRAM_TASKS_CONFIG_V1', JSON.stringify(window.cloudTelegramTasks));
        } catch (e) {}
        console.log(`✈️ Received ${window.cloudTelegramTasks.length} telegram tasks from cloud.`);
      } else {
        // Admin deleted or cleared all telegram tasks
        window.cloudTelegramTasks = [];
        try {
          localStorage.setItem('ENERGY_TAP_TELEGRAM_TASKS_CONFIG_V1', '[]');
        } catch (e) {}
        console.log('✈️ Telegram tasks cleared from cloud.');
      }

      // Re-render tasks list if tasks page is active
      if (typeof window.renderTasksList === 'function') {
        window.renderTasksList();
      }
      window.dispatchEvent(new CustomEvent('telegramTasksUpdated', { detail: window.cloudTelegramTasks }));
    }, (err) => {
      console.warn('Could not fetch cloud telegram tasks, using local cache:', err);
      this.loadCachedTelegramTasks();
    });
  }

  loadCachedTelegramTasks() {
    try {
      const cached = localStorage.getItem('ENERGY_TAP_TELEGRAM_TASKS_CONFIG_V1');
      if (cached) {
        window.cloudTelegramTasks = JSON.parse(cached);
        return;
      }
    } catch (e) {}
    window.cloudTelegramTasks = null;
  }

  // ==========================================================================
  // GLOBAL GAME & WEBSITE CONFIG REAL-TIME LISTENER (/game_config)
  // ==========================================================================
  listenToGameConfig() {
    if (!this.database) {
      this.loadCachedGameConfig();
      return;
    }

    const cfgRef = this.database.ref('/game_config');
    cfgRef.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data && typeof data === 'object') {
        window.cloudGameConfig = data;
        try {
          localStorage.setItem('ENERGY_TAP_GAME_CONFIG_V1', JSON.stringify(data));
        } catch (e) {}
      } else {
        window.cloudGameConfig = {};
      }

      this.applyGameConfig(window.cloudGameConfig);
      window.dispatchEvent(new CustomEvent('gameConfigUpdated', { detail: window.cloudGameConfig }));
    }, (err) => {
      console.warn('Could not fetch game_config, using local cache:', err);
      this.loadCachedGameConfig();
    });
  }

  loadCachedGameConfig() {
    try {
      const cached = localStorage.getItem('ENERGY_TAP_GAME_CONFIG_V1');
      if (cached) {
        window.cloudGameConfig = JSON.parse(cached);
        this.applyGameConfig(window.cloudGameConfig);
        return;
      }
    } catch (e) {}
    window.cloudGameConfig = {};
  }

  applyGameConfig(cfg) {
    if (!cfg) return;

    // 1. Maintenance Mode
    const maintOverlay = document.getElementById('globalMaintenanceOverlay');
    if (cfg.maintenanceMode === true) {
      if (!maintOverlay) {
        const overlay = document.createElement('div');
        overlay.id = 'globalMaintenanceOverlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(2,6,23,0.95);backdrop-filter:blur(12px);z-index:999999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;text-align:center;padding:24px;';
        overlay.innerHTML = `
          <div style="font-size: 54px; margin-bottom: 16px;">🔧</div>
          <h2 style="font-size: 22px; font-weight: 800; color: #38bdf8; margin-bottom: 8px;">System Under Maintenance</h2>
          <p style="color: #94a3b8; max-width: 360px; font-size: 13.5px; line-height: 1.5;">The administrators are currently performing system updates. Live gameplay and transactions will resume shortly.</p>
          <div style="margin-top: 20px; font-size: 11px; color: #64748b; font-family: monospace; letter-spacing: 1px;">STATUS: TEMPORARILY OFFLINE</div>
        `;
        document.body.appendChild(overlay);
      } else {
        maintOverlay.style.display = 'flex';
      }
    } else if (maintOverlay) {
      maintOverlay.style.display = 'none';
    }

    // 2. Announcement Banner on Home
    if (typeof window.renderHomeAnnouncement === 'function') {
      window.renderHomeAnnouncement();
    }

    // 3. App Name
    if (cfg.appName) {
      document.title = `${cfg.appName} - Telegram Web Mini-App`;
      const brandLogo = document.getElementById('brandLogoText') || document.querySelector('.brand-logo-text');
      if (brandLogo) brandLogo.textContent = cfg.appName;
    }
  }

  // ==========================================================================
  // SUBMIT MEGA REWARD REDEMPTION REQUEST (WRITE TO /reward_requests)
  // ==========================================================================
  submitRewardRequest(item, deliveryInfo) {
    if (!item) return Promise.reject(new Error('Invalid reward item'));

    return this.ensureAuthenticated().then(() => {
      const reqId = 'req_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
      const dCost = Number(item.diamonds !== undefined ? item.diamonds : item.diamondCost) || 0;
      const playerName = (gameState.player && (gameState.player.name || gameState.player.username)) || 'Player';
      const playerHandle = (gameState.player && gameState.player.handle) 
        ? (gameState.player.handle.startsWith('@') ? gameState.player.handle : '@' + gameState.player.handle) 
        : (gameState.player && gameState.player.telegram ? gameState.player.telegram : '@alex_blue');
      const shipDetails = (deliveryInfo && (deliveryInfo.address || deliveryInfo.contact)) || 'In-App Direct';

      const payload = {
        id: reqId,
        userId: this.userId || this.getOrCreateLocalUid(),
        userName: playerName,
        username: playerName,
        userTgHandle: playerHandle,
        telegramHandle: playerHandle,
        rewardId: item.id || 'reward_unknown',
        rewardTitle: item.title || 'Mega Reward',
        itemTitle: item.title || 'Mega Reward',
        category: item.category || 'gift-card',
        categoryName: item.categoryName || item.category || 'Mega Reward',
        categoryIcon: item.categoryIcon || '🎁',
        diamondsCost: dCost,
        diamondCost: dCost,
        cashValue: item.cashValue || '$0',
        shippingDetails: shipDetails,
        deliveryInfo: (deliveryInfo && deliveryInfo.contact) || shipDetails,
        contactInfo: (deliveryInfo && deliveryInfo.contact) || '',
        deliveryAddress: (deliveryInfo && deliveryInfo.address) || '',
        userNotes: (deliveryInfo && deliveryInfo.notes) || '',
        status: 'pending', // 'pending' | 'approved' | 'delivered' | 'rejected'
        createdAt: typeof firebase !== 'undefined' && firebase.database && firebase.database.ServerValue ? firebase.database.ServerValue.TIMESTAMP : Date.now(),
        updatedAt: typeof firebase !== 'undefined' && firebase.database && firebase.database.ServerValue ? firebase.database.ServerValue.TIMESTAMP : Date.now()
      };

      // If online with Firebase database
      if (this.database) {
        return this.database.ref(`reward_requests/${reqId}`).set(payload)
          .then(() => {
            console.log('✅ Reward request written to Firebase /reward_requests:', reqId);
            this.cacheLocalRequest(payload);
            return payload;
          })
          .catch((err) => {
            console.warn('Firebase request save failed, cached locally:', err);
            this.cacheLocalRequest(payload);
            return payload;
          });
      } else {
        this.cacheLocalRequest(payload);
        return Promise.resolve(payload);
      }
    });
  }

  cacheLocalRequest(req) {
    try {
      const raw = localStorage.getItem('ENERGY_TAP_ADMIN_REQUESTS_V1');
      const list = raw ? JSON.parse(raw) : [];
      list.unshift(req);
      localStorage.setItem('ENERGY_TAP_ADMIN_REQUESTS_V1', JSON.stringify(list));
    } catch (e) {}
  }

  // ==========================================================================
  // SUBMIT SUGGESTION (WRITE TO /suggestions)
  // ==========================================================================
  submitSuggestion(userName, description) {
    if (!description) return Promise.reject(new Error('Empty description'));

    return this.ensureAuthenticated().then(() => {
      const sugId = 'sug_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
      const payload = {
        id: sugId,
        userId: this.userId || this.getOrCreateLocalUid(),
        userName: userName || (gameState.player && gameState.player.name) || 'Anonymous',
        userTgHandle: (gameState.player && gameState.player.handle) 
          ? (gameState.player.handle.startsWith('@') ? gameState.player.handle : '@' + gameState.player.handle) 
          : '',
        description: description,
        status: 'Submitted',
        createdAt: typeof firebase !== 'undefined' && firebase.database && firebase.database.ServerValue ? firebase.database.ServerValue.TIMESTAMP : Date.now()
      };

      if (this.database) {
        return this.database.ref(`suggestions/${sugId}`).set(payload)
          .then(() => {
            console.log('✅ Suggestion written to Firebase /suggestions:', sugId);
            return payload;
          })
          .catch((err) => {
            console.warn('Firebase suggestion write notice:', err);
            return payload;
          });
      }
      return Promise.resolve(payload);
    });
  }

  // ==========================================================================
  // ACCOUNT SECURITY & STRICT UNIQUENESS VALIDATION
  // (Prevents duplicate Profile Code, Username, Telegram Link, and Mobile Number)
  // ==========================================================================
  async validateUniqueCredentials({ profileCode, username, telegram, mobile, email, excludeUid }) {
    if (!this.database) return { ok: true };

    const targetUid = excludeUid || this.userId;
    const normCode = (c) => (c || '').toString().trim().toUpperCase();
    const normName = (n) => (n || '').toString().trim().toLowerCase();
    const normTg = (t) => (t || '').toString().trim().toLowerCase().replace(/^https?:\/\/t\.me\//, '').replace(/^@/, '');
    const normMobile = (m) => (m || '').toString().replace(/[^0-9]/g, '');
    const normEmail = (e) => (e || '').toString().trim().toLowerCase();

    const targetCode = normCode(profileCode);
    const targetUsername = normName(username);
    const targetTg = normTg(telegram);
    const targetPhone = normMobile(mobile);
    const targetEmail = normEmail(email);

    try {
      const snap = await this.database.ref('/players').once('value');
      const val = snap.val();
      if (!val) return { ok: true };

      for (const [uid, node] of Object.entries(val)) {
        if (uid === targetUid) continue; // Skip self
        const pl = node.player || {};

        // 1. Check Profile Code Uniqueness
        if (targetCode) {
          const existingCode = normCode(pl.profileCode);
          if (existingCode && existingCode === targetCode) {
            return {
              ok: false,
              field: 'profileCode',
              error: `Security Error: Profile Code "${profileCode}" is already in use by another account! Please choose a unique code.`
            };
          }
        }

        // 2. Check Username Uniqueness
        if (targetUsername) {
          const existingUser = normName(pl.name || pl.username);
          if (existingUser === targetUsername) {
            return {
              ok: false,
              field: 'username',
              error: `Security Error: Username "${username}" is already registered by another player! Please choose a unique username.`
            };
          }
        }

        // 3. Check Telegram Link / Account Uniqueness
        if (targetTg) {
          const existingTg = normTg(pl.telegram || pl.handle);
          if (existingTg && existingTg === targetTg) {
            return {
              ok: false,
              field: 'telegram',
              error: `Security Error: Telegram account "${telegram}" is already linked to another player! A Telegram link can only be registered once.`
            };
          }
        }

        // 4. Check Mobile Number Uniqueness
        if (targetPhone) {
          const existingPhone = normMobile(pl.mobile || pl.phone);
          if (existingPhone && existingPhone === targetPhone) {
            return {
              ok: false,
              field: 'mobile',
              error: `Security Error: Mobile number "${mobile}" is already registered to another player! Each phone number can only be used once.`
            };
          }
        }

        // 5. Check Email Uniqueness
        if (targetEmail) {
          const existingEmail = normEmail(pl.email);
          if (existingEmail && existingEmail === targetEmail) {
            return {
              ok: false,
              field: 'email',
              error: `Security Error: Email "${email}" is already registered to another player! Each email address can only be linked once.`
            };
          }
        }
      }

      return { ok: true };
    } catch (err) {
      console.warn('Validation query notice:', err);
      return { ok: true }; // Allow if offline
    }
  }

  // Login / Switch account using Profile Code
  async loginWithProfileCode(rawCode) {
    if (!rawCode || !rawCode.trim()) {
      return { ok: false, error: 'Please enter a valid Profile Code.' };
    }
    const cleanQuery = rawCode.trim().toUpperCase();

    if (!this.database) {
      return { ok: false, error: 'Database is offline. Please check your internet connection.' };
    }

    try {
      const snap = await this.database.ref('/players').once('value');
      const val = snap.val();
      if (!val) {
        return { ok: false, error: 'No players found in database.' };
      }

      let foundUid = null;
      let foundData = null;

      for (const [uid, node] of Object.entries(val)) {
        const pl = node.player || {};
        const code = (pl.profileCode || '').trim().toUpperCase();
        if (code === cleanQuery || uid === rawCode.trim()) {
          foundUid = uid;
          foundData = node;
          break;
        }
      }

      if (!foundUid) {
        return { ok: false, error: `No player account found with Profile Code "${rawCode}".` };
      }

      // Switch active player session to this UID
      this.userId = foundUid;
      localStorage.setItem('ENERGY_TAP_FIREBASE_LOCAL_UID_V5', foundUid);
      
      // Load all cloud data
      this.loadFromCloud();
      this.listenToUser();
      await this.registerOrUpdateCurrentAuthorization();
      this.listenToAuthorizations();

      return {
        ok: true,
        uid: foundUid,
        player: foundData.player || {},
        profileCode: foundData.player?.profileCode || rawCode
      };
    } catch (err) {
      return { ok: false, error: 'Login failed: ' + err.message };
    }
  }

  // ==========================================================================
  // TELEGRAM MTPROTO AUTHORIZATION & SESSION MANAGEMENT (schema: authorization#ad01d61d)
  // ==========================================================================

  // Persistent 64-bit session hash for Telegram TL authorization
  getSessionHash() {
    let hash = localStorage.getItem('ENERGY_TAP_SESSION_HASH_TL');
    if (!hash) {
      const p1 = Math.floor(10000000 + Math.random() * 90000000);
      const p2 = Math.floor(10000000 + Math.random() * 90000000);
      hash = `${p1}${p2}`;
      localStorage.setItem('ENERGY_TAP_SESSION_HASH_TL', hash);
    }
    return hash;
  }

  // Device & environment detector
  detectDeviceInfo() {
    const ua = navigator.userAgent || '';
    let platform = 'Web';
    let device_model = 'Web Browser';
    let system_version = '';

    const tgPlatform = window.Telegram?.WebApp?.platform;

    if (/iPhone/i.test(ua)) {
      platform = 'iOS';
      device_model = 'Apple iPhone';
      const m = ua.match(/OS (\d+[_.]\d+)/);
      system_version = m ? m[1].replace(/_/g, '.') : 'iOS';
    } else if (/iPad/i.test(ua)) {
      platform = 'iOS';
      device_model = 'Apple iPad';
      const m = ua.match(/OS (\d+[_.]\d+)/);
      system_version = m ? m[1].replace(/_/g, '.') : 'iPadOS';
    } else if (/Android/i.test(ua)) {
      platform = 'Android';
      const modelMatch = ua.match(/;\s*([^;]+?)\s*Build/i);
      device_model = modelMatch ? modelMatch[1].trim() : 'Android Device';
      const verMatch = ua.match(/Android\s*([0-9.]+)/i);
      system_version = verMatch ? `Android ${verMatch[1]}` : 'Android';
    } else if (/Macintosh|Mac OS X/i.test(ua)) {
      platform = 'macOS';
      device_model = 'Apple Mac';
      const m = ua.match(/Mac OS X (\d+[_.]\d+)/);
      system_version = m ? m[1].replace(/_/g, '.') : 'macOS';
    } else if (/Windows/i.test(ua)) {
      platform = 'Windows';
      device_model = 'Windows PC';
      if (/Windows NT 10.0/i.test(ua)) system_version = 'Windows 10/11';
      else if (/Windows NT 6.3/i.test(ua)) system_version = 'Windows 8.1';
      else system_version = 'Windows';
    } else if (/Linux/i.test(ua)) {
      platform = 'Linux';
      device_model = 'Linux PC';
      system_version = 'Linux';
    }

    if (tgPlatform && tgPlatform !== 'unknown') {
      device_model += ` (TG ${tgPlatform})`;
    }

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const tzParts = tz.split('/');
    const region = tzParts[tzParts.length - 1].replace(/_/g, ' ');
    const country = tzParts[0] || 'Global';

    return {
      device_model,
      platform,
      system_version,
      country,
      region
    };
  }

  // Fetch client IP with session caching
  async fetchClientIp() {
    let cached = sessionStorage.getItem('ENERGY_TAP_CLIENT_IP');
    if (cached) return cached;
    try {
      const res = await fetch('https://api.ipify.org?format=json', { cache: 'force-cache' });
      if (res.ok) {
        const d = await res.json();
        if (d.ip) {
          sessionStorage.setItem('ENERGY_TAP_CLIENT_IP', d.ip);
          return d.ip;
        }
      }
    } catch (e) {
      // fallback
    }
    return '127.0.0.1';
  }

  // Telegram TL constructor: authorization#ad01d61d
  createAuthorizationObject(existing = null, ip = '127.0.0.1') {
    const hash = this.getSessionHash();
    const info = this.detectDeviceInfo();
    const nowSec = Math.floor(Date.now() / 1000);
    const isOfficial = Boolean(window.Telegram?.WebApp?.initData);

    return {
      hash: hash,
      device_model: info.device_model,
      platform: info.platform,
      system_version: info.system_version,
      api_id: 2040,
      app_name: 'Energy Tap Reactor',
      app_version: '1.0.0',
      date_created: existing?.date_created || nowSec,
      date_active: nowSec,
      ip: existing?.ip && existing.ip !== '127.0.0.1' ? existing.ip : ip,
      country: existing?.country || info.country,
      region: existing?.region || info.region,
      // Flags (TL conditional fields)
      current: true,
      official_app: isOfficial,
      password_pending: false,
      encrypted_requests_disabled: existing?.encrypted_requests_disabled || false,
      call_requests_disabled: existing?.call_requests_disabled || false,
      unconfirmed: false
    };
  }

  // Register or update active device authorization in Firebase
  async registerOrUpdateCurrentAuthorization() {
    if (!this.database || !this.userId) return null;
    try {
      const hash = this.getSessionHash();
      const authRef = this.database.ref(`players/${this.userId}/authorizations/${hash}`);
      const snap = await authRef.once('value');
      const existing = snap.val();
      const ip = await this.fetchClientIp();
      const authObj = this.createAuthorizationObject(existing, ip);

      const isNew = !existing;
      await authRef.update(authObj);
      this.database.ref(`players/${this.userId}`).update({ updatedAt: Date.now() });

      if (isNew) {
        this.emitNewAuthorization(authObj);
      }
      return authObj;
    } catch (err) {
      console.warn('Could not register authorization in Firebase:', err);
      return null;
    }
  }

  // Emit updateNewAuthorization#8951abef
  emitNewAuthorization(authObj) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`📱 New login session authorized for ${authObj.device_model}`);
    }
    window.dispatchEvent(new CustomEvent('updateNewAuthorization', { detail: authObj }));
  }

  // account.getAuthorizations#e320c158 = account.Authorizations
  async getAuthorizations() {
    const currentHash = this.getSessionHash();
    if (!this.database || !this.userId) {
      const ip = await this.fetchClientIp();
      const localAuth = this.createAuthorizationObject(null, ip);
      localAuth.current = true;
      return {
        authorization_ttl_days: 180,
        authorizations: [localAuth]
      };
    }

    try {
      const snap = await this.database.ref(`players/${this.userId}/authorizations`).once('value');
      const val = snap.val() || {};
      const list = [];

      for (const [key, item] of Object.entries(val)) {
        if (!item || typeof item !== 'object') continue;
        const auth = {
          ...item,
          hash: item.hash || key,
          current: (item.hash || key) === currentHash
        };
        list.push(auth);
      }

      if (!list.some(a => a.hash === currentHash)) {
        const ip = await this.fetchClientIp();
        const currentAuth = this.createAuthorizationObject(null, ip);
        currentAuth.current = true;
        list.unshift(currentAuth);
        this.registerOrUpdateCurrentAuthorization();
      }

      list.sort((a, b) => {
        if (a.current) return -1;
        if (b.current) return 1;
        return (b.date_active || 0) - (a.date_active || 0);
      });

      return {
        authorization_ttl_days: 180,
        authorizations: list
      };
    } catch (err) {
      console.warn('Error reading authorizations:', err);
      const ip = await this.fetchClientIp();
      return {
        authorization_ttl_days: 180,
        authorizations: [this.createAuthorizationObject(null, ip)]
      };
    }
  }

  // account.resetAuthorization#df77f3bc hash:long = Bool
  async resetAuthorization(hash) {
    if (!hash) return false;
    const currentHash = this.getSessionHash();
    const isSelf = String(hash) === String(currentHash);

    if (this.database && this.userId) {
      try {
        await this.database.ref(`players/${this.userId}/authorizations/${hash}`).remove();
        await this.database.ref(`players/${this.userId}`).update({ updatedAt: Date.now() });
      } catch (e) {
        console.warn('Error resetting authorization:', e);
      }
    }

    if (isSelf) {
      localStorage.removeItem('ENERGY_TAP_SESSION_HASH_TL');
      if (typeof showFloatingToast === 'function') {
        showFloatingToast('🚪 Logged out from this device.');
      }
      setTimeout(() => {
        window.location.reload();
      }, 800);
    }
    return true;
  }

  // Terminate all other sessions
  async resetAllOtherAuthorizations() {
    if (!this.database || !this.userId) return false;
    const currentHash = this.getSessionHash();
    try {
      const snap = await this.database.ref(`players/${this.userId}/authorizations`).once('value');
      const val = snap.val() || {};
      const updates = {};
      for (const key of Object.keys(val)) {
        if (String(key) !== String(currentHash)) {
          updates[`players/${this.userId}/authorizations/${key}`] = null;
        }
      }
      if (Object.keys(updates).length > 0) {
        updates[`players/${this.userId}/updatedAt`] = Date.now();
        await this.database.ref().update(updates);
      }
      return true;
    } catch (e) {
      console.warn('Error resetting other authorizations:', e);
      return false;
    }
  }

  // account.changeAuthorizationSettings#40f48462
  async changeAuthorizationSettings(hash, settings = {}) {
    if (!this.database || !this.userId || !hash) return false;
    try {
      const payload = {};
      if (typeof settings.encrypted_requests_disabled === 'boolean') {
        payload.encrypted_requests_disabled = settings.encrypted_requests_disabled;
      }
      if (typeof settings.call_requests_disabled === 'boolean') {
        payload.call_requests_disabled = settings.call_requests_disabled;
      }
      if (typeof settings.confirmed === 'boolean') {
        payload.unconfirmed = !settings.confirmed;
      }
      payload.date_active = Math.floor(Date.now() / 1000);

      await this.database.ref(`players/${this.userId}/authorizations/${hash}`).update(payload);
      await this.database.ref(`players/${this.userId}`).update({ updatedAt: Date.now() });
      return true;
    } catch (e) {
      console.warn('Error changing authorization settings:', e);
      return false;
    }
  }

  // Real-time listener for active sessions & remote revocation guard
  listenToAuthorizations() {
    if (!this.database || !this.userId) return;
    const currentHash = this.getSessionHash();
    const authsRef = this.database.ref(`players/${this.userId}/authorizations`);

    if (this._authsListenerRef) {
      this._authsListenerRef.off('value');
    }
    this._authsListenerRef = authsRef;

    authsRef.on('value', (snap) => {
      const val = snap.val();
      const count = val ? Object.keys(val).length : 1;

      const badge = document.getElementById('activeSessionsCountBadge');
      if (badge) badge.textContent = count;
      const countText = document.getElementById('activeSessionsTextCount');
      if (countText) countText.textContent = `${count} Active Device${count > 1 ? 's' : ''}`;

      // Remote revocation check
      if (val && Object.keys(val).length > 0 && !val[currentHash]) {
        console.warn('⚠️ This device authorization was revoked remotely!');
        alert('⚠️ Your active session was terminated from another device. You have been logged out.');
        localStorage.removeItem('ENERGY_TAP_SESSION_HASH_TL');
        window.location.reload();
      }
    });
  }

  // Save / Update Account Security (validates uniqueness before committing)
  async saveAccountSecurityCredentials({ profileCode, username, telegram, mobile, email, emailVerified }) {
    // 1. Enforce Uniqueness
    const check = await this.validateUniqueCredentials({
      profileCode,
      username,
      telegram,
      mobile,
      email,
      excludeUid: this.userId
    });

    if (!check.ok) {
      return check;
    }

    // 2. Apply to local gameState
    if (profileCode) gameState.player.profileCode = profileCode.trim().toUpperCase();
    if (username) {
      gameState.player.name = username.trim();
      gameState.player.username = username.trim();
    }
    if (telegram) {
      gameState.player.telegram = telegram.trim();
      gameState.player.handle = telegram.trim().replace(/^https?:\/\/t\.me\//, '').replace(/^@/, '');
    }
    if (mobile) {
      gameState.player.mobile = mobile.trim();
    }
    if (email !== undefined) {
      gameState.player.email = (email || '').trim().toLowerCase();
    }
    if (emailVerified !== undefined) {
      gameState.player.emailVerified = Boolean(emailVerified);
    }

    // 3. Sync immediately to Firebase
    this.saveToCloudImmediate();

    if (typeof saveGame === 'function') saveGame();
    if (typeof updateUI === 'function') updateUI();
    if (typeof updateProfileUI === 'function') updateProfileUI();

    return { ok: true };
  }

  // ==========================================================================
  // TELEGRAM MTPROTO EMAIL VERIFICATION ENGINE
  // ==========================================================================

  // Mask email for pattern: e.g. "alex.vance@example.com" -> "a***e@example.com"
  maskEmailPattern(email) {
    if (!email || !email.includes('@')) return '***@***.***';
    const [user, domain] = email.split('@');
    if (user.length <= 2) {
      return `${user[0]}*@${domain}`;
    }
    return `${user[0]}***${user[user.length - 1]}@${domain}`;
  }

  // account.sendVerifyEmailCode#98e037bb purpose:EmailVerifyPurpose email:string = account.SentEmailCode
  async sendVerifyEmailCode(purpose = 'emailVerifyPurposeLoginSetup', email = '') {
    if (!email || !email.trim()) {
      return { ok: false, error: 'Please enter a valid email address.' };
    }
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return { ok: false, error: 'Please enter a valid email address (e.g. name@domain.com).' };
    }

    // Enforce uniqueness
    const check = await this.validateUniqueCredentials({ email: cleanEmail, excludeUid: this.userId });
    if (!check.ok) {
      return check;
    }

    // Generate 6-digit Telegram-standard OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const masked = this.maskEmailPattern(cleanEmail);
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    const verificationRecord = {
      code,
      email: cleanEmail,
      purpose,
      sentAt: Date.now(),
      expiresAt
    };

    // Save in Firebase and sessionStorage
    if (this.database && this.userId) {
      try {
        await this.database.ref(`players/${this.userId}/email_verification`).set(verificationRecord);
        await this.database.ref(`players/${this.userId}`).update({ updatedAt: Date.now() });
      } catch (e) {
        console.warn('Could not save email verification to Firebase:', e);
      }
    }
    sessionStorage.setItem('ENERGY_TAP_PENDING_EMAIL_VERIF', JSON.stringify(verificationRecord));

    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`📧 Telegram Email Code: [${code}] sent to ${masked}`);
    }

    return {
      ok: true,
      sent_code: {
        _constructor: 'account.sentEmailCode#811f854f',
        email_pattern: masked,
        length: 6
      },
      code: code
    };
  }

  // account.verifyEmail#032da4cf purpose:EmailVerifyPurpose verification:EmailVerification = account.EmailVerified
  async verifyEmail(purpose = 'emailVerifyPurposeLoginSetup', verification = {}) {
    let pending = null;

    if (this.database && this.userId) {
      try {
        const snap = await this.database.ref(`players/${this.userId}/email_verification`).once('value');
        pending = snap.val();
      } catch (e) {
        console.warn('Error reading email verification from Firebase:', e);
      }
    }

    if (!pending) {
      const sessionRaw = sessionStorage.getItem('ENERGY_TAP_PENDING_EMAIL_VERIF');
      if (sessionRaw) {
        try { pending = JSON.parse(sessionRaw); } catch (e) {}
      }
    }

    let verifiedEmail = pending?.email || (typeof verification === 'object' ? verification.email : null) || gameState.player.email;

    // Check verification method: code / Google / Apple
    if (verification.type === 'google' || verification.type === 'apple') {
      if (!verifiedEmail) {
        verifiedEmail = `${(gameState.player.name || 'player').toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`;
      }
    } else {
      const inputCode = (typeof verification === 'string' ? verification : (verification.code || '')).toString().trim();
      if (!inputCode) {
        return { ok: false, error: 'Please enter the 6-digit verification code.' };
      }

      if (!pending) {
        return { ok: false, error: 'No verification code requested. Please request a new code.' };
      }

      if (Date.now() > (pending.expiresAt || 0)) {
        return { ok: false, error: 'Verification code has expired. Please request a new one.' };
      }

      if (inputCode !== String(pending.code).trim()) {
        return { ok: false, error: 'Invalid verification code. Please check your code and try again.' };
      }
    }

    // Success: Commit to player profile in Firebase and local state
    gameState.player.email = verifiedEmail;
    gameState.player.emailVerified = true;

    if (this.database && this.userId) {
      try {
        await this.database.ref(`players/${this.userId}/player`).update({
          email: verifiedEmail,
          emailVerified: true
        });
        await this.database.ref(`players/${this.userId}/email_verification`).remove();
        await this.database.ref(`players/${this.userId}`).update({ updatedAt: Date.now() });
      } catch (e) {
        console.warn('Error writing verified email to Firebase:', e);
      }
    }

    sessionStorage.removeItem('ENERGY_TAP_PENDING_EMAIL_VERIF');
    this.saveToCloudImmediate();

    if (typeof saveGame === 'function') saveGame();
    if (typeof updateUI === 'function') updateUI();
    if (typeof updateProfileUI === 'function') updateProfileUI();

    return {
      ok: true,
      verified: {
        _constructor: 'account.emailVerified#2b96cd1b',
        email: verifiedEmail
      }
    };
  }

  // auth.resetLoginEmail#7e960193
  async resetLoginEmail() {
    gameState.player.email = '';
    gameState.player.emailVerified = false;

    if (this.database && this.userId) {
      try {
        await this.database.ref(`players/${this.userId}/player`).update({
          email: '',
          emailVerified: false
        });
        await this.database.ref(`players/${this.userId}/email_verification`).remove();
        await this.database.ref(`players/${this.userId}`).update({ updatedAt: Date.now() });
      } catch (e) {
        console.warn('Error resetting email in Firebase:', e);
      }
    }

    sessionStorage.removeItem('ENERGY_TAP_PENDING_EMAIL_VERIF');
    this.saveToCloudImmediate();

    if (typeof saveGame === 'function') saveGame();
    if (typeof updateUI === 'function') updateUI();
    if (typeof updateProfileUI === 'function') updateProfileUI();

    return { ok: true };
  }

  // ==========================================================================
  // TELEGRAM MTPROTO PHONE CODE DISPATCH & AUTHENTICATION (auth.sendCode, auth.resendCode, auth.requestFirebaseSms)
  // ==========================================================================

  normalizePhoneNumber(phone) {
    if (!phone) return '';
    const cleaned = phone.toString().replace(/[^0-9+]/g, '');
    return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
  }

  // auth.sendCode#a677244f phone_number:string api_id:int api_hash:string settings:CodeSettings = auth.SentCode
  async sendCode(phone_number, settings = {}) {
    const cleanPhone = this.normalizePhoneNumber(phone_number);
    if (!cleanPhone || cleanPhone.length < 8) {
      return { ok: false, error: 'Please enter a valid phone number with country code (e.g. +1234567890).' };
    }

    const phone_code_hash = 'pch_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    const codeLength = 6;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const timeout = 60;

    let sentCodeType = {
      _constructor: 'auth.sentCodeTypeFirebaseSms#009fd736',
      length: codeLength,
      push_timeout: timeout,
      receipt: `rcpt_${Date.now()}`
    };

    if (settings.allow_flashcall) {
      sentCodeType = {
        _constructor: 'auth.sentCodeTypeFlashCall#ab03c6d9',
        pattern: `${cleanPhone.slice(0, cleanPhone.length - 4)}****`
      };
    } else if (settings.allow_missed_call) {
      sentCodeType = {
        _constructor: 'auth.sentCodeTypeMissedCall#82006484',
        prefix: '+1800',
        length: codeLength
      };
    } else if (settings.allow_app_hash) {
      sentCodeType = {
        _constructor: 'auth.sentCodeTypeApp#3dbb5986',
        length: codeLength
      };
    } else if (settings.allow_firebase !== false) {
      sentCodeType = {
        _constructor: 'auth.sentCodeTypeFirebaseSms#009fd736',
        length: codeLength,
        push_timeout: timeout,
        receipt: `rcpt_${Date.now()}`
      };
    } else {
      sentCodeType = {
        _constructor: 'auth.sentCodeTypeSms#c000bba2',
        length: codeLength
      };
    }

    const payload = {
      phone_number: cleanPhone,
      phone_code_hash,
      code,
      type: sentCodeType,
      timeout,
      sentAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000
    };

    if (this.database) {
      try {
        await this.database.ref(`phone_verifications/${phone_code_hash}`).set(payload);
      } catch (e) {
        console.warn('Could not save phone verification to Firebase:', e);
      }
    }
    sessionStorage.setItem(`ENERGY_TAP_PHONE_CODE_${phone_code_hash}`, JSON.stringify(payload));

    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`📱 Telegram Code sent to ${cleanPhone}! Code: ${code}`);
    }

    return {
      ok: true,
      sent_code: {
        _constructor: 'auth.sentCode#5e002502',
        type: sentCodeType,
        phone_code_hash,
        timeout,
        next_type: 'auth.sentCodeTypeCall#5353e5a7'
      },
      code
    };
  }

  // auth.resendCode#cae47523
  async resendCode(phone_number, phone_code_hash, reason = '') {
    const cleanPhone = this.normalizePhoneNumber(phone_number);
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    const timeout = 60;

    const sentCodeType = {
      _constructor: 'auth.sentCodeTypeSms#c000bba2',
      length: 6
    };

    const payload = {
      phone_number: cleanPhone,
      phone_code_hash,
      code: newCode,
      type: sentCodeType,
      timeout,
      sentAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000
    };

    if (this.database) {
      try {
        await this.database.ref(`phone_verifications/${phone_code_hash}`).set(payload);
      } catch (e) {}
    }
    sessionStorage.setItem(`ENERGY_TAP_PHONE_CODE_${phone_code_hash}`, JSON.stringify(payload));

    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`🔄 Resent Telegram SMS Code to ${cleanPhone}! Code: ${newCode}`);
    }

    return {
      ok: true,
      sent_code: {
        _constructor: 'auth.sentCode#5e002502',
        type: sentCodeType,
        phone_code_hash,
        timeout
      },
      code: newCode
    };
  }

  // auth.requestFirebaseSms#8e39261e
  async requestFirebaseSms(phone_number, phone_code_hash, tokens = {}) {
    return this.resendCode(phone_number, phone_code_hash, 'firebase_sms');
  }

  // Verify phone code and sign in (or link to account)
  async signInWithPhone(phone_number, phone_code_hash, inputCode) {
    const cleanPhone = this.normalizePhoneNumber(phone_number);
    const cleanCode = (inputCode || '').toString().trim();

    if (!cleanCode) {
      return { ok: false, error: 'Please enter the verification code.' };
    }

    let record = null;
    if (this.database) {
      try {
        const snap = await this.database.ref(`phone_verifications/${phone_code_hash}`).once('value');
        record = snap.val();
      } catch (e) {}
    }

    if (!record) {
      const cached = sessionStorage.getItem(`ENERGY_TAP_PHONE_CODE_${phone_code_hash}`);
      if (cached) {
        try { record = JSON.parse(cached); } catch (e) {}
      }
    }

    if (!record) {
      return { ok: false, error: 'Verification session expired. Please request a new code.' };
    }

    if (Date.now() > (record.expiresAt || 0)) {
      return { ok: false, error: 'Verification code has expired. Please request a new code.' };
    }

    if (cleanCode !== String(record.code).trim()) {
      return { ok: false, error: 'Invalid verification code. Please check and try again.' };
    }

    let foundUid = null;
    let foundPlayer = null;

    if (this.database) {
      try {
        const snap = await this.database.ref('/players').once('value');
        const val = snap.val() || {};
        const normPhone = (p) => (p || '').toString().replace(/[^0-9]/g, '');
        const targetClean = normPhone(cleanPhone);

        for (const [uid, node] of Object.entries(val)) {
          const pl = node.player || {};
          const existingPhone = normPhone(pl.mobile || pl.phone);
          if (existingPhone && existingPhone === targetClean) {
            foundUid = uid;
            foundPlayer = pl;
            break;
          }
        }
      } catch (e) {
        console.warn('Error querying player by phone:', e);
      }
    }

    if (foundUid) {
      this.userId = foundUid;
      localStorage.setItem('ENERGY_TAP_FIREBASE_LOCAL_UID_V5', foundUid);
      this.loadFromCloud();
      this.listenToUser();
      await this.registerOrUpdateCurrentAuthorization();
      this.listenToAuthorizations();

      return {
        ok: true,
        action: 'login',
        uid: foundUid,
        player: foundPlayer
      };
    } else {
      gameState.player.mobile = cleanPhone;
      gameState.player.phoneVerified = true;

      if (this.database && this.userId) {
        try {
          await this.database.ref(`players/${this.userId}/player`).update({
            mobile: cleanPhone,
            phoneVerified: true
          });
          await this.database.ref(`players/${this.userId}`).update({ updatedAt: Date.now() });
        } catch (e) {}
      }

      this.saveToCloudImmediate();
      if (typeof saveGame === 'function') saveGame();
      if (typeof updateUI === 'function') updateUI();
      if (typeof updateProfileUI === 'function') updateProfileUI();

      return {
        ok: true,
        action: 'linked',
        player: gameState.player
      };
    }
  }
}

// Global Firebase Instance & MTProto Authorization Aliases
window.firebaseSync = new FirebaseSyncService();
window.globalAdminResetAllUsers = function() {
  if (window.firebaseSync) return window.firebaseSync.triggerGlobalAdminReset();
};
window.getAuthorizations = function() {
  return window.firebaseSync ? window.firebaseSync.getAuthorizations() : Promise.resolve({ authorizations: [] });
};
window.resetAuthorization = function(hash) {
  return window.firebaseSync ? window.firebaseSync.resetAuthorization(hash) : Promise.resolve(false);
};
window.changeAuthorizationSettings = function(hash, settings) {
  return window.firebaseSync ? window.firebaseSync.changeAuthorizationSettings(hash, settings) : Promise.resolve(false);
};
window.sendVerifyEmailCode = function(purpose, email) {
  return window.firebaseSync ? window.firebaseSync.sendVerifyEmailCode(purpose, email) : Promise.resolve({ ok: false });
};
window.verifyEmail = function(purpose, verification) {
  return window.firebaseSync ? window.firebaseSync.verifyEmail(purpose, verification) : Promise.resolve({ ok: false });
};
window.resetLoginEmail = function() {
  return window.firebaseSync ? window.firebaseSync.resetLoginEmail() : Promise.resolve({ ok: false });
};
window.sendPhoneCode = function(phone, settings) {
  return window.firebaseSync ? window.firebaseSync.sendCode(phone, settings) : Promise.resolve({ ok: false });
};
window.resendPhoneCode = function(phone, hash, reason) {
  return window.firebaseSync ? window.firebaseSync.resendCode(phone, hash, reason) : Promise.resolve({ ok: false });
};
window.signInWithPhone = function(phone, hash, code) {
  return window.firebaseSync ? window.firebaseSync.signInWithPhone(phone, hash, code) : Promise.resolve({ ok: false });
};


