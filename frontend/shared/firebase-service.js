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
    this.saveTimeout = null;
    this.syncStatus = 'connecting'; // 'connecting' | 'synced' | 'saving' | 'offline'

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

        // Sign in anonymously for seamless user session
        this.auth.signInAnonymously()
          .then((userCredential) => {
            this.userId = userCredential.user.uid;
            this.isInitialized = true;
            this.isOnline = true;
            this.setSyncStatus('synced');
            console.log('🔥 Firebase connected successfully! Player UID:', this.userId);
            
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
          })
          .catch((error) => {
            console.warn('Firebase Auth failed, falling back to local UID:', error);
            this.userId = this.getOrCreateLocalUid();
            this.isInitialized = true;
            this.isOnline = true;
            this.setSyncStatus('synced');
            this.loadFromCloud();
            this.listenToMegaRewards();
            this.listenToWebsiteTasks();
            this.listenToTelegramTasks();
            this.listenToUser();
            this.listenToSeason();
            this.listenToMonthlyCompetition();
            this.listenToAdsConfig();
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
        statusEl.innerHTML = `<span class="cloud-dot online">●</span> Cloud Synced`;
        statusEl.className = 'firebase-cloud-status-badge synced';
      } else if (status === 'saving') {
        statusEl.innerHTML = `<span class="cloud-dot syncing">●</span> Syncing...`;
        statusEl.className = 'firebase-cloud-status-badge saving';
      } else if (status === 'connecting') {
        statusEl.innerHTML = `<span class="cloud-dot connecting">●</span> Connecting...`;
        statusEl.className = 'firebase-cloud-status-badge connecting';
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
        // Player was removed from Firebase: reset local state to 0
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
        if (typeof gameState !== 'undefined' && gameState.goal) {
          gameState.goal.level = 0;
          gameState.goal.currentCoins = 0;
          gameState.goal.currentKeys = 0;
          gameState.goal.currentTickets = 0;
        }
        if (typeof gameState !== 'undefined' && gameState.tasksState) {
          gameState.tasksState.claimedDaily = {};
          gameState.tasksState.claimedTelegram = {};
          gameState.tasksState.claimedWebsite = {};
        }
        if (typeof saveGame === 'function') saveGame();
        if (typeof updateUI === 'function') updateUI();
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
      const seasonData = snapshot.val();
      if (!seasonData) return;

      const adminSeasonTimestamp = seasonData.forceRestartTimestamp || seasonData.seasonStartTime || 0;
      const localLastProcessed = Number(localStorage.getItem('ENERGY_TAP_LAST_ADMIN_SEASON_RESET') || 0);

      // If admin triggered a new season reset after our last processed reset
      if (adminSeasonTimestamp > localLastProcessed) {
        localStorage.setItem('ENERGY_TAP_LAST_ADMIN_SEASON_RESET', adminSeasonTimestamp);
        console.log('🔄 Global Admin Season Reset received from Firebase! Restoring levels & claims for user:', this.userId);

        const now = Date.now();
        const duration = (seasonData.seasonDurationDays ? seasonData.seasonDurationDays * 86400 * 1000 : 30 * 86400 * 1000);

        // Reset user XP level claim data and restart level progression
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

        // Reset monthly tasks
        if (gameState.tasksState) {
          gameState.tasksState.claimedDaily = {};
        }
        if (gameState.dailyStats) {
          gameState.dailyStats.resetTimestamp = now;
        }

        if (typeof saveGame === 'function') saveGame();
        if (typeof updateUI === 'function') updateUI();
        if (typeof renderTasksList === 'function') renderTasksList();
        if (typeof renderLevelsList === 'function') renderLevelsList();
        if (typeof renderGoalsList === 'function') renderGoalsList();

        // Immediately persist this user's newly restored state to their individual Firebase node
        this.saveToCloudImmediate();

        if (typeof showFloatingToast === 'function') {
          showFloatingToast('🌟 New Season Started! Level rewards restored & ready to claim anew!');
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

      if (!compData || typeof compData !== 'object' || !compData.endTime) {
        // Initialize 30-day competition in Firebase backend if not yet set
        compData = {
          title: '30-Day Monthly Task Competition',
          cycleDays: 30,
          cycleNumber: 1,
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
    if (!this.database || !this.userId) return;

    // Calculate aggregated activity metrics
    const totalAdsWatched = (gameState.player.adsWatchedCount || 0) + 
      (gameState.xpState ? (gameState.xpState.watchedAds || 0) : 0) + 
      (gameState.goalState ? ((gameState.goalState.levelAdsWatched || 0) + (gameState.goalState.megaWatchedAds || 0)) : 0);

    const completedWebTasks = (gameState.tasksState && gameState.tasksState.claimedWebsite) 
      ? Object.keys(gameState.tasksState.claimedWebsite).filter(k => gameState.tasksState.claimedWebsite[k]).length 
      : ((gameState.tasksState && gameState.tasksState.claimedTelegram) 
          ? Object.keys(gameState.tasksState.claimedTelegram).filter(k => gameState.tasksState.claimedTelegram[k]).length 
          : (gameState.player.websiteTasksCompleted || 0));

    const playerPayload = {
      ...gameState.player,
      adsWatchedCount: totalAdsWatched,
      websiteTasksCompleted: completedWebTasks
    };

    const payload = {
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
        this.setSyncStatus('offline');
      });
  }

  // Live Leaderboard synchronization
  updateLeaderboardEntry() {
    if (!this.database || !this.userId) return;
    const leaderboardPayload = {
      name: gameState.player.name || 'Alex Vance',
      handle: gameState.player.handle || 'alex_blue',
      level: gameState.player.level || 0,
      coins: gameState.player.coins || 0,
      energyTaps: gameState.reactor.energyTaps || 0,
      lastActive: typeof firebase !== 'undefined' && firebase.database && firebase.database.ServerValue ? firebase.database.ServerValue.TIMESTAMP : Date.now()
    };
    this.database.ref(`leaderboard/${this.userId}`).set(leaderboardPayload).catch(() => {});
  }

  // Submit Whitelist to Firebase
  saveWhitelist(handleOrEmail) {
    if (!this.database || !this.userId) return Promise.resolve();
    return this.database.ref(`whitelist/${this.userId}`).set({
      handleOrEmail: handleOrEmail,
      name: gameState.player.name,
      coins: gameState.player.coins,
      submittedAt: typeof firebase !== 'undefined' && firebase.database && firebase.database.ServerValue ? firebase.database.ServerValue.TIMESTAMP : Date.now()
    });
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
        window.cloudMegaRewards = Array.isArray(data) ? data : Object.values(data);
        try {
          localStorage.setItem('ENERGY_TAP_MEGA_REWARDS_CACHE_V1', JSON.stringify(window.cloudMegaRewards));
        } catch (e) {}
        console.log(`🔥 Received ${window.cloudMegaRewards.length} mega rewards from cloud.`);
      } else {
        this.loadCachedMegaRewards();
      }

      // Re-render current category page if open
      if (typeof window.renderCurrentCategoryRewards === 'function') {
        window.renderCurrentCategoryRewards();
      }
    }, (err) => {
      console.warn('Could not fetch cloud mega rewards, using local cache:', err);
      this.loadCachedMegaRewards();
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
        window.cloudWebsiteTasks = Array.isArray(data) ? data : Object.values(data);
        try {
          localStorage.setItem('ENERGY_TAP_WEBSITE_TASKS_CONFIG_V1', JSON.stringify(window.cloudWebsiteTasks));
        } catch (e) {}
        console.log(`🌐 Received ${window.cloudWebsiteTasks.length} website tasks from cloud.`);
      } else {
        this.loadCachedWebsiteTasks();
      }

      // Re-render tasks list if tasks page is active
      if (typeof window.renderTasksList === 'function') {
        window.renderTasksList();
      }
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
        window.cloudTelegramTasks = Array.isArray(data) ? data : Object.values(data);
        try {
          localStorage.setItem('ENERGY_TAP_TELEGRAM_TASKS_CONFIG_V1', JSON.stringify(window.cloudTelegramTasks));
        } catch (e) {}
        console.log(`✈️ Received ${window.cloudTelegramTasks.length} telegram tasks from cloud.`);
      } else {
        this.loadCachedTelegramTasks();
      }

      // Re-render tasks list if tasks page is active
      if (typeof window.renderTasksList === 'function') {
        window.renderTasksList();
      }
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
  // SUBMIT MEGA REWARD REDEMPTION REQUEST (WRITE TO /reward_requests)
  // ==========================================================================
  submitRewardRequest(item, deliveryInfo) {
    if (!item) return Promise.reject(new Error('Invalid reward item'));

    const reqId = 'req_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
    const payload = {
      id: reqId,
      userId: this.userId || this.getOrCreateLocalUid(),
      userName: (gameState.player && gameState.player.name) || 'Alex Vance',
      userTgHandle: (gameState.player && gameState.player.handle) 
        ? (gameState.player.handle.startsWith('@') ? gameState.player.handle : '@' + gameState.player.handle) 
        : '@alex_blue',
      rewardId: item.id || 'reward_unknown',
      rewardTitle: item.title || 'Mega Reward',
      itemTitle: item.title || 'Mega Reward',
      category: item.category || 'gift-card',
      categoryName: item.categoryName || item.category || 'Mega Reward',
      categoryIcon: item.categoryIcon || '🎁',
      diamondsCost: Number(item.diamonds) || 0,
      diamondCost: Number(item.diamonds) || 0,
      cashValue: item.cashValue || '$0',
      deliveryInfo: deliveryInfo.contact || deliveryInfo.address || 'Direct Telegram Message',
      contactInfo: deliveryInfo.contact || '',
      deliveryAddress: deliveryInfo.address || '',
      userNotes: deliveryInfo.notes || '',
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
  }
}

// Global Firebase Instance
window.firebaseSync = new FirebaseSyncService();

