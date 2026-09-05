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
          })
          .catch((error) => {
            console.warn('Firebase Auth failed, falling back to local UID:', error);
            this.userId = this.getOrCreateLocalUid();
            this.isInitialized = true;
            this.isOnline = true;
            this.setSyncStatus('synced');
            this.loadFromCloud();
            this.listenToMegaRewards();
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
          if (cloudData.reactor) {
            Object.assign(gameState.reactor, cloudData.reactor);
            if (cloudData.reactor.currentEnergy !== undefined) {
              gameState.reactor.currentEnergy = Number(cloudData.reactor.currentEnergy);
            }
          }
          if (cloudData.energyGenerator) Object.assign(gameState.energyGenerator, cloudData.energyGenerator);
          if (cloudData.tasksState) Object.assign(gameState.tasksState, cloudData.tasksState);
          if (cloudData.xpState) Object.assign(gameState.xpState, cloudData.xpState);
          if (cloudData.goalState) Object.assign(gameState.goalState, cloudData.goalState);
          if (cloudData.dailyStats) Object.assign(gameState.dailyStats, cloudData.dailyStats);

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
          // First time player in cloud, save current initial state
          this.saveToCloudImmediate();
        }
      })
      .catch((err) => {
        console.warn('Error fetching data from Firebase:', err);
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

    const completedWebTasks = (gameState.tasksState && gameState.tasksState.claimedTelegram) 
      ? Object.keys(gameState.tasksState.claimedTelegram).filter(k => gameState.tasksState.claimedTelegram[k]).length 
      : (gameState.player.websiteTasksCompleted || 0);

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
        currentEnergy: Math.floor(gameState.reactor.currentEnergy || 0),
        maxEnergy: gameState.reactor.maxEnergy || 1000,
        energyTaps: gameState.reactor.energyTaps || 0,
        comboMultiplier: gameState.reactor.comboMultiplier || 1.0,
        comboTaps: gameState.reactor.comboTaps || 0
      },
      energyGenerator: {
        epTotal: gameState.energyGenerator.epTotal || 0,
        remainingSeconds: gameState.energyGenerator.remainingSeconds || 0,
        ratePerSec: gameState.energyGenerator.ratePerSec || gameState.energyGenerator.ratePerMin || 0.01,
        ratePerMin: gameState.energyGenerator.ratePerSec || gameState.energyGenerator.ratePerMin || 0.01,
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

