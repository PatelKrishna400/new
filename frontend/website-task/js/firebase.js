/* ==========================================================================
   WEBSITE TASK SYSTEM - FIREBASE REALTIME DATABASE & SYNC SERVICE
   js/firebase.js
   Integrates with existing Tap Game player accounts and Firebase RTDB
   Includes User Code + Task Code Verification System
   ========================================================================== */

const firebaseConfigPrimary = {
  apiKey: "AIzaSyDnujl5_iBlSzwDfjCLA7sFQ7zW1DxROic",
  authDomain: "tap-game-80070.firebaseapp.com",
  databaseURL: "https://tap-game-80070-default-rtdb.firebaseio.com",
  projectId: "tap-game-80070",
  storageBucket: "tap-game-80070.firebasestorage.app",
  messagingSenderId: "1028935905694",
  appId: "1:1028935905694:web:af51902893c0ebbe68f",
  measurementId: "G-B8KMYEQ0L4"
};

const firebaseConfigFallback = {
  apiKey: "AIzaSyDnUl5_iBlSzwDfjCLA3fQ7Fz1WxROic",
  authDomain: "tap-game-80070.firebaseapp.com",
  databaseURL: "https://tap-game-80070-default-rtdb.firebaseio.com",
  projectId: "tap-game-80070",
  storageBucket: "tap-game-80070.firebasestorage.app",
  messagingSenderId: "1028935905694",
  appId: "1:1028935905694:web:af51902893c0ebbe68f",
  measurementId: "G-B8KMYEQ0L4"
};

class FirebaseService {
  constructor() {
    this.app = null;
    this.auth = null;
    this.db = null;
    this.userId = null;
    this.userCode = null;
    this.isOnline = false;
    this.isInitialized = false;
    this.userProgress = {
      currentPage: 1,
      completedPages: {},
      completedAds: {},
      claimedRewards: {},
      totalEarned: 0,
      completed: false,
      finalRewardClaimed: false,
      lastActivity: Date.now()
    };
    this.userBalance = {
      blueCoins: 0,
      coins: 0
    };
    this.taskConfig = null;
    this.init();
  }

  init() {
    try {
      if (typeof firebase !== 'undefined') {
        try {
          if (!firebase.apps.length) {
            this.app = firebase.initializeApp(firebaseConfigPrimary);
          } else {
            this.app = firebase.app();
          }
        } catch (e) {
          console.warn('Initial key error, attempting fallback config:', e);
          this.app = firebase.initializeApp(firebaseConfigFallback);
        }

        this.db = firebase.database();
        this.auth = firebase.auth();

        // Resolve Player UID & User Code
        this.resolveUserIdentity().then(() => {
          this.setupPresence();
          this.listenToTaskConfig();
          this.listenToUserData();
        });
      } else {
        console.warn('Firebase SDK not loaded, using offline local state.');
        this.setupLocalFallback();
      }
    } catch (err) {
      console.error('Firebase initialization error:', err);
      this.setupLocalFallback();
    }
  }

  async resolveUserIdentity() {
    // 1. Check URL query params for ?uid=
    const params = new URLSearchParams(window.location.search);
    const queryUid = params.get('uid');
    
    // 2. Check Tap Game existing localStorage UID
    const localTapGameUid = localStorage.getItem('ENERGY_TAP_FIREBASE_LOCAL_UID_V5');

    if (queryUid) {
      this.userId = queryUid;
      localStorage.setItem('ENERGY_TAP_FIREBASE_LOCAL_UID_V5', queryUid);
    } else if (localTapGameUid) {
      this.userId = localTapGameUid;
    }

    // 3. Authenticate with Firebase
    if (this.auth) {
      try {
        const userCredential = await this.auth.signInAnonymously();
        if (!this.userId) {
          this.userId = userCredential.user.uid;
          localStorage.setItem('ENERGY_TAP_FIREBASE_LOCAL_UID_V5', this.userId);
        }
        this.isOnline = true;
      } catch (err) {
        console.warn('Firebase Anonymous Auth warning:', err);
        if (!this.userId) {
          this.userId = 'usr_' + Math.random().toString(36).substr(2, 9);
          localStorage.setItem('ENERGY_TAP_FIREBASE_LOCAL_UID_V5', this.userId);
        }
      }
    } else if (!this.userId) {
      this.userId = 'usr_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('ENERGY_TAP_FIREBASE_LOCAL_UID_V5', this.userId);
    }

    // 4. Resolve / Generate User Code (e.g. USER-8F42K9 or ET-XXXXXX)
    await this.resolveUserCode();

    this.isInitialized = true;
    window.dispatchEvent(new CustomEvent('userAuthReady', { detail: { uid: this.userId, userCode: this.userCode } }));
  }

  async resolveUserCode() {
    if (!this.userId) return;

    // Check existing stored user code
    let code = localStorage.getItem('WEBSITE_TASK_USER_CODE_' + this.userId);

    if (this.db) {
      try {
        // Check users/{uid}
        const userSnap = await this.db.ref(`users/${this.userId}`).once('value');
        const uVal = userSnap.val();
        if (uVal && uVal.userCode) {
          code = uVal.userCode;
        } else {
          // Check players/{uid}/player/profileCode
          const playerSnap = await this.db.ref(`players/${this.userId}/player`).once('value');
          const pVal = playerSnap.val();
          if (pVal && pVal.profileCode) {
            code = pVal.profileCode;
          }
        }

        // If no code exists yet, generate one
        if (!code) {
          const clean = this.userId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
          const suffix = clean.length >= 6 ? clean.slice(-6) : Math.random().toString(36).substring(2, 8).toUpperCase();
          code = 'USER-' + suffix;

          // Save to users/{uid} and players/{uid}/player
          await this.db.ref(`users/${this.userId}`).update({
            userCode: code,
            uid: this.userId,
            status: 'active',
            updatedAt: Date.now()
          });
          await this.db.ref(`players/${this.userId}/player`).update({
            profileCode: code
          });
        }
      } catch (e) {
        console.warn('Could not read userCode from cloud:', e);
      }
    }

    if (!code) {
      const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      code = 'USER-' + suffix;
    }

    this.userCode = code.toUpperCase();
    localStorage.setItem('WEBSITE_TASK_USER_CODE_' + this.userId, this.userCode);
  }

  setupPresence() {
    if (!this.db) return;
    const connectedRef = this.db.ref('.info/connected');
    connectedRef.on('value', snap => {
      this.isOnline = snap.val() === true;
      window.dispatchEvent(new CustomEvent('firebaseStatusChanged', { detail: { isOnline: this.isOnline } }));
    });
  }

  // Real-time listener for Task & Ad Configuration
  listenToTaskConfig() {
    if (!this.db) return;
    const configRef = this.db.ref('websiteTasks/financialBlog');
    configRef.on('value', snapshot => {
      const val = snapshot.val();
      if (val) {
        // Ensure taskCode exists on the config
        if (!val.taskCode) {
          val.taskCode = "TASK-FIN-2026-001";
        }
        this.taskConfig = val;
        window.dispatchEvent(new CustomEvent('websiteTaskConfigUpdated', { detail: val }));
      } else {
        this.seedDefaultConfig();
      }
    });
  }

  // Real-time listener for User Progress and Blue Coins Balance
  listenToUserData() {
    if (!this.db || !this.userId) return;

    // Listen to users/{uid}
    const userRef = this.db.ref(`users/${this.userId}`);
    userRef.on('value', snapshot => {
      const val = snapshot.val() || {};
      if (val.userCode) {
        this.userCode = val.userCode.toUpperCase();
      }
      const wt = val.websiteTask || {};
      this.userProgress = {
        currentPage: wt.currentPage || 1,
        completedPages: wt.completedPages || {},
        completedAds: wt.completedAds || {},
        claimedRewards: wt.claimedRewards || {},
        totalEarned: wt.totalEarned || 0,
        completed: !!wt.completed,
        finalRewardClaimed: !!wt.finalRewardClaimed,
        lastActivity: wt.lastActivity || Date.now()
      };
      if (val.blueCoins !== undefined) {
        this.userBalance.blueCoins = Math.max(this.userBalance.blueCoins, val.blueCoins || 0);
      }
      window.dispatchEvent(new CustomEvent('userProgressUpdated', { detail: this.userProgress }));
      window.dispatchEvent(new CustomEvent('userBalanceUpdated', { detail: this.userBalance }));
    });

    // Listen to existing Tap Game player record: players/{uid}/player
    const playerRef = this.db.ref(`players/${this.userId}/player`);
    playerRef.on('value', snapshot => {
      const pl = snapshot.val();
      if (pl) {
        this.userBalance.blueCoins = Math.max(this.userBalance.blueCoins, pl.blueCoins || 0);
        this.userBalance.coins = pl.coins || 0;
        if (pl.profileCode && !this.userCode) {
          this.userCode = pl.profileCode.toUpperCase();
        }
      }
      window.dispatchEvent(new CustomEvent('userBalanceUpdated', { detail: this.userBalance }));
    });
  }

  // ==========================================================================
  // MANDATORY FIRST PAGE VERIFICATION ENGINE
  // User Code + Task Code Verification
  // ==========================================================================
  async verifyTaskCredentials(enteredUserCode, enteredTaskCode) {
    if (!enteredUserCode || !enteredUserCode.trim()) {
      throw new Error('Please enter your User Code.');
    }
    if (!enteredTaskCode || !enteredTaskCode.trim()) {
      throw new Error('Please enter the Task Code.');
    }

    const cleanUserCode = enteredUserCode.trim().toUpperCase();
    const cleanTaskCode = enteredTaskCode.trim().toUpperCase();

    // 1. Firebase Authentication Check
    if (!this.userId) {
      await this.resolveUserIdentity();
    }
    if (!this.userId) {
      throw new Error('Authentication failed. Please refresh and try again.');
    }

    // 2. User Code Verification against currently authenticated user
    let actualUserCode = this.userCode;
    let actualProfileCode = null;

    if (this.db) {
      try {
        const uSnap = await this.db.ref(`users/${this.userId}`).once('value');
        const uData = uSnap.val();
        if (uData && uData.userCode) {
          actualUserCode = uData.userCode.toUpperCase();
        }
        const pSnap = await this.db.ref(`players/${this.userId}/player`).once('value');
        const pData = pSnap.val();
        if (pData && pData.profileCode) {
          actualProfileCode = pData.profileCode.toUpperCase();
        }
      } catch(e) {
        console.warn('Error fetching cloud credentials for verification:', e);
      }
    }

    const isUserCodeValid = (actualUserCode && cleanUserCode === actualUserCode) ||
                            (actualProfileCode && cleanUserCode === actualProfileCode);

    if (!isUserCodeValid) {
      const err = new Error('Invalid User Code.\n\nPlease enter the User Code associated with your account.');
      err.code = 'INVALID_USER_CODE';
      throw err;
    }

    // 3. Task Code Verification against Database
    let targetTask = null;
    let targetTaskId = null;

    if (this.db) {
      const tasksSnap = await this.db.ref('websiteTasks').once('value');
      const allTasks = tasksSnap.val() || {};

      for (const [taskId, taskData] of Object.entries(allTasks)) {
        const tCode = (taskData.taskCode || 'TASK-FIN-2026-001').toUpperCase();
        if (tCode === cleanTaskCode) {
          targetTask = taskData;
          targetTaskId = taskId;
          break;
        }
      }
    }

    // Fallback check against default task
    if (!targetTask) {
      const defaultCode = ((this.taskConfig && this.taskConfig.taskCode) || 'TASK-FIN-2026-001').toUpperCase();
      if (cleanTaskCode === defaultCode) {
        targetTask = this.taskConfig || window.DEFAULT_FINANCIAL_BLOG_CONFIG;
        targetTaskId = 'financialBlog';
      }
    }

    if (!targetTask) {
      const err = new Error('Invalid Task Code.\n\nPlease check the Task Code and try again.');
      err.code = 'INVALID_TASK_CODE';
      throw err;
    }

    // 4. Task Status Check (Enabled / Disabled)
    if (targetTask.enabled === false || targetTask.status === 'disabled') {
      const err = new Error('This task is currently unavailable.');
      err.code = 'TASK_DISABLED';
      throw err;
    }

    // 5. Already Completed Check
    let isAlreadyCompleted = false;
    if (this.userProgress && this.userProgress.completed) {
      isAlreadyCompleted = true;
    }

    if (this.db) {
      try {
        const uSnap = await this.db.ref(`users/${this.userId}/websiteTask/completed`).once('value');
        if (uSnap.val() === true) isAlreadyCompleted = true;

        const pSnap = await this.db.ref(`players/${this.userId}/tasks/claimedWebsite/financial_blog`).once('value');
        if (pSnap.val() === true) isAlreadyCompleted = true;

        const compSnap = await this.db.ref(`taskCompletions/${targetTaskId}_${this.userId}`).once('value');
        if (compSnap.val() === true) isAlreadyCompleted = true;
      } catch(e) {}
    }

    if (isAlreadyCompleted) {
      const err = new Error('Task Already Completed\n\nYou have already completed this task.');
      err.code = 'TASK_ALREADY_COMPLETED';
      throw err;
    }

    // 6. Issue Verified Session Ticket
    const sessionTicket = {
      userId: this.userId,
      userCode: cleanUserCode,
      taskId: targetTaskId,
      taskCode: cleanTaskCode,
      verifiedAt: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };

    sessionStorage.setItem('WEBSITE_TASK_VERIFIED_SESSION', JSON.stringify(sessionTicket));

    // Log Verification Activity
    if (this.db) {
      try {
        this.db.ref('activity_log').push({
          userId: this.userId,
          userCode: cleanUserCode,
          taskCode: cleanTaskCode,
          type: 'task_verification_success',
          timestamp: Date.now()
        });
      } catch(e) {}
    }

    return {
      success: true,
      taskId: targetTaskId,
      taskCode: cleanTaskCode,
      taskData: targetTask
    };
  }

  // Access Guard Checker for task.html & blog.html
  isSessionVerified() {
    const raw = sessionStorage.getItem('WEBSITE_TASK_VERIFIED_SESSION');
    if (!raw) return false;
    try {
      const ticket = JSON.parse(raw);
      if (!ticket || !ticket.userId || !ticket.taskCode) return false;
      if (ticket.expiresAt && Date.now() > ticket.expiresAt) return false;
      return true;
    } catch(e) {
      return false;
    }
  }

  // Atomic Reward Claim for Ads or Page Completion
  async claimRewardAtomic(type, id, amount, meta = {}) {
    if (!this.userId) throw new Error('User not authenticated');
    amount = Number(amount) || 0;

    // Check locally first for duplicate claims
    if (type === 'ad' && this.userProgress.completedAds[id]) {
      throw new Error('Reward for this advertisement has already been claimed.');
    }
    if (type === 'page' && this.userProgress.completedPages[id]) {
      throw new Error('Reward for this page has already been claimed.');
    }
    if (type === 'final' && this.userProgress.finalRewardClaimed) {
      throw new Error('Final completion reward has already been claimed.');
    }

    if (this.db) {
      const userRef = this.db.ref(`users/${this.userId}`);
      
      const txResult = await userRef.transaction(currentData => {
        if (!currentData) {
          currentData = {
            blueCoins: 0,
            userCode: this.userCode || 'USER-MEMBER',
            websiteTask: {
              currentPage: 1,
              completedPages: {},
              completedAds: {},
              claimedRewards: {},
              totalEarned: 0,
              completed: false,
              finalRewardClaimed: false,
              lastActivity: Date.now()
            }
          };
        }

        if (!currentData.websiteTask) {
          currentData.websiteTask = {
            currentPage: 1,
            completedPages: {},
            completedAds: {},
            claimedRewards: {},
            totalEarned: 0,
            completed: false,
            finalRewardClaimed: false,
            lastActivity: Date.now()
          };
        }

        const wt = currentData.websiteTask;
        wt.completedPages = wt.completedPages || {};
        wt.completedAds = wt.completedAds || {};
        wt.claimedRewards = wt.claimedRewards || {};

        if (type === 'ad' && wt.completedAds[id]) return;
        if (type === 'page' && wt.completedPages[id]) return;
        if (type === 'final' && wt.finalRewardClaimed) return;

        const now = Date.now();
        if (type === 'ad') {
          wt.completedAds[id] = now;
        } else if (type === 'page') {
          wt.completedPages[id] = now;
          const pageNum = parseInt(id.replace(/\D/g, ''), 10) || 1;
          wt.currentPage = Math.max(wt.currentPage || 1, pageNum + 1);
        } else if (type === 'final') {
          wt.completed = true;
          wt.finalRewardClaimed = true;
          wt.completedAt = now;
        }

        wt.claimedRewards[id] = amount;
        wt.totalEarned = (wt.totalEarned || 0) + amount;
        wt.lastActivity = now;

        currentData.blueCoins = (currentData.blueCoins || 0) + amount;
        return currentData;
      });

      if (!txResult.committed) {
        throw new Error('Transaction was cancelled or reward was already claimed.');
      }

      // Simultaneously update existing Tap Game player record in players/{uid}
      const playerRef = this.db.ref(`players/${this.userId}`);
      await playerRef.transaction(plData => {
        if (!plData) plData = { player: { blueCoins: 0 }, tasks: {} };
        if (!plData.player) plData.player = { blueCoins: 0 };
        plData.player.blueCoins = (plData.player.blueCoins || 0) + amount;

        if (!plData.tasks) plData.tasks = {};
        if (!plData.tasks.claimedWebsite) plData.tasks.claimedWebsite = {};
        plData.tasks.claimedWebsite['financial_blog_' + id] = true;
        if (type === 'final') {
          plData.tasks.claimedWebsite['financial_blog'] = true;
        }
        return plData;
      });

      // Mark global completion map if final reward
      if (type === 'final') {
        try {
          this.db.ref(`taskCompletions/financialBlog_${this.userId}`).set(true);
        } catch(e) {}
      }

      // Record Activity Log
      try {
        this.db.ref('activity_log').push({
          userId: this.userId,
          userCode: this.userCode,
          type: 'reward_claim',
          claimType: type,
          targetId: id,
          amount: amount,
          timestamp: Date.now()
        });
      } catch(e) {}

      return { success: true, reward: amount };
    } else {
      // Local fallback
      this.userBalance.blueCoins += amount;
      if (type === 'ad') this.userProgress.completedAds[id] = Date.now();
      if (type === 'page') {
        this.userProgress.completedPages[id] = Date.now();
        const pNum = parseInt(id.replace(/\D/g, ''), 10) || 1;
        this.userProgress.currentPage = Math.max(this.userProgress.currentPage, pNum + 1);
      }
      if (type === 'final') {
        this.userProgress.completed = true;
        this.userProgress.finalRewardClaimed = true;
      }
      this.userProgress.totalEarned += amount;
      this.saveLocalState();
      window.dispatchEvent(new CustomEvent('userProgressUpdated', { detail: this.userProgress }));
      window.dispatchEvent(new CustomEvent('userBalanceUpdated', { detail: this.userBalance }));
      return { success: true, reward: amount };
    }
  }

  // Seed default configuration if Firebase has no websiteTasks/financialBlog node
  async seedDefaultConfig() {
    if (!this.db) return;
    const defaultData = window.DEFAULT_FINANCIAL_BLOG_CONFIG || null;
    if (defaultData) {
      try {
        defaultData.taskCode = "TASK-FIN-2026-001";
        await this.db.ref('websiteTasks/financialBlog').set(defaultData);
        console.log('Seeded default financial blog task configuration to Firebase.');
      } catch (err) {
        console.warn('Could not seed config to Firebase:', err);
      }
    }
  }

  // Local fallback storage
  setupLocalFallback() {
    const local = localStorage.getItem('WEBSITE_TASK_PROGRESS_' + (this.userId || 'default'));
    if (local) {
      try { this.userProgress = JSON.parse(local); } catch(e){}
    }
    const bal = localStorage.getItem('WEBSITE_TASK_BALANCE_' + (this.userId || 'default'));
    if (bal) {
      try { this.userBalance = JSON.parse(bal); } catch(e){}
    }
  }

  saveLocalState() {
    localStorage.setItem('WEBSITE_TASK_PROGRESS_' + this.userId, JSON.stringify(this.userProgress));
    localStorage.setItem('WEBSITE_TASK_BALANCE_' + this.userId, JSON.stringify(this.userBalance));
  }
}

// Global Singleton Instance
window.firebaseService = new FirebaseService();
