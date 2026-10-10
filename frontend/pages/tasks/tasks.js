/* ==========================================================================
   ENERGY TAP REACTOR - TASKS & QUESTS (pages/tasks/tasks.js)
   - 30-Day Tasks in 3x10 Rectangle Grid Format
   - 10 Daily Tasks per Day (Task 6 bracket: ticket, card, key, boom; Task 7 bracket: egg, brain)
   - Reward: +10 Coins per task (Collected via Ad Watch)
   - Complete all 10 tasks in a day: Win 10,000 💎!
   - Day N only unlocks when Day N-1 has all 10 tasks completed & daily login
   - Daily Login Streak: Global Date tracking. Broken streak popup notice (Watch Ad or 100 💎)
   - Completing Day 30 unlocks Mega Reward Request
   - Website Tasks: 10,000 Coins or 1,000 Coins open/buy, Diskwala links, 4-digit code, claim via Ad
   ========================================================================== */

const THIRTY_DAY_STORAGE_KEY = 'ENERGY_TAP_30DAY_TASKS_V1';

// Website Tasks List with Diskwala links and 1,000 / 10,000 coin options
let WEBSITE_TASKS = [
  {
    id: 'web_dw_1',
    title: 'Diskwala Portal Sponsor Quest #1',
    cost: 10000,
    costAlt: 10000,
    url: 'https://diskwala.com/quest/alpha',
    correctPin: '4821',
    rewardDiamonds: 50,
    tagText: 'DISKWALA SPONSOR'
  },
  {
    id: 'web_dw_2',
    title: 'Diskwala Cloud Sponsor Quest #2',
    cost: 10000,
    costAlt: 10000,
    url: 'https://diskwala.com/quest/beta',
    correctPin: '7392',
    rewardDiamonds: 50,
    tagText: 'DISKWALA SPONSOR'
  },
  {
    id: 'web_dw_3',
    title: 'Diskwala Elite Partner Quest #3',
    cost: 10000,
    costAlt: 10000,
    url: 'https://diskwala.com/quest/gamma',
    correctPin: '5164',
    rewardDiamonds: 50,
    tagText: 'DISKWALA VIP'
  }
];

// Helper to generate the 10 tasks for Day d (1 to 30)
function generateTasksForDay(dayNum) {
  const t6Items = ['ticket', 'card', 'key', 'boom'];
  const t7Items = ['egg', 'brain'];

  const t6Item = t6Items[(dayNum - 1) % t6Items.length];
  const t7Item = t7Items[(dayNum - 1) % t7Items.length];

  const t6Emoji = { ticket: '🎫', card: '🃏', key: '🔑', boom: '💣' }[t6Item] || '🎫';
  const t7Emoji = { egg: '🥚', brain: '🧠' }[t7Item] || '🥚';

  return [
    {
      id: `d${dayNum}_t1`,
      title: 'Generate Diamond 2 Times',
      sub: 'Diamond Generator page',
      type: 'diamond_gen',
      target: 2,
      emoji: '💎'
    },
    {
      id: `d${dayNum}_t2`,
      title: 'Complete 1 Website Task',
      sub: 'Diskwala sponsor quest',
      type: 'web_task',
      target: 1,
      emoji: '🌐'
    },
    {
      id: `d${dayNum}_t3`,
      title: 'Use 5 Dark Green or 2 Green Fuel',
      sub: 'Energy Generator fuel reactor',
      type: 'fuel_use',
      target: 2, // 2 green or 5 dark green
      emoji: '🔋'
    },
    {
      id: `d${dayNum}_t4`,
      title: 'Sunflower Land Upgrade 200 Times',
      sub: 'Upgrade Sunflower Valley plots',
      type: 'sunflower_upgrade',
      target: 200,
      emoji: '🌻'
    },
    {
      id: `d${dayNum}_t5`,
      title: 'Sunflower Change to Gold Coin',
      sub: 'Prestige / Convert coins in Sunflower Valley',
      type: 'sunflower_prestige',
      target: 1,
      emoji: '🪙'
    },
    {
      id: `d${dayNum}_t6`,
      title: `Use 5 ${t6Item.toUpperCase()}s`,
      sub: `Consume 5 ${t6Item}s in minigames`,
      type: `use_${t6Item}`,
      target: 5,
      emoji: t6Emoji
    },
    {
      id: `d${dayNum}_t7`,
      title: `Use 100 ${t7Item.toUpperCase()}s`,
      sub: `Consume 100 ${t7Item}s in minigames`,
      type: `use_${t7Item}`,
      target: 100,
      emoji: t7Emoji
    },
    {
      id: `d${dayNum}_t8`,
      title: 'Spin 5 Big Prize Spinner',
      sub: 'Lucky Wheel spins',
      type: 'spin_wheel',
      target: 5,
      emoji: '🎡'
    },
    {
      id: `d${dayNum}_t9`,
      title: 'Spend 100 Diamonds in Shop',
      sub: 'Shop item purchases',
      type: 'shop_diamond',
      target: 100,
      emoji: '🛍️'
    },
    {
      id: `d${dayNum}_t10`,
      title: 'Complete Total 8 Tasks Today',
      sub: 'Finish 8 out of today’s quests',
      type: 'complete_eight',
      target: 8,
      emoji: '🏆'
    }
  ];
}

// 30-Day State Initialization
function loadThirtyDayState() {
  const todayStr = new Date().toISOString().slice(0, 10);
  let defaultState = {
    streakCount: 1,
    lastLoginDate: todayStr,
    activeDayIndex: 1, // 1 to 30
    streakBroken: false,
    days: {}
  };

  try {
    const raw = localStorage.getItem(THIRTY_DAY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        defaultState = Object.assign(defaultState, parsed);
      }
    }
  } catch (e) {
    console.warn('Failed to load 30-day state:', e);
  }

  // Ensure each day has a record
  for (let d = 1; d <= 30; d++) {
    if (!defaultState.days[d]) {
      defaultState.days[d] = {
        progress: Array(10).fill(0),
        claimed: Array(10).fill(false),
        completedCount: 0,
        dayRewardClaimed: false
      };
    }
  }

  // Check Daily Login Streak using calendar day logic
  if (defaultState.lastLoginDate !== todayStr) {
    const lastDate = new Date(defaultState.lastLoginDate);
    const currDate = new Date(todayStr);
    const diffDays = Math.round((currDate - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive day login!
      defaultState.streakCount++;
      defaultState.lastLoginDate = todayStr;
      // If previous day was completed, advance activeDayIndex
      if (defaultState.days[defaultState.activeDayIndex].completedCount >= 10) {
        defaultState.activeDayIndex = Math.min(30, defaultState.activeDayIndex + 1);
      }
    } else if (diffDays > 1) {
      // Streak broken!
      defaultState.streakBroken = true;
    }
  }

  return defaultState;
}

let thirtyDayState = loadThirtyDayState();
window.thirtyDayState = thirtyDayState;

function saveThirtyDayState() {
  try {
    localStorage.setItem(THIRTY_DAY_STORAGE_KEY, JSON.stringify(thirtyDayState));
  } catch (e) {
    console.warn('Error saving 30-day state:', e);
  }
}

let currentSelectedDay = 1;
let activeVerifyingTaskId = null;

/* ==========================================================================
   SUBTAB SWITCHER (1. Daily Task, 2. Telegram Task, 3. Website Task)
   ========================================================================== */
window.switchTaskSubtab = function(tabName) {
  const dailyBtn = document.getElementById('subtabDaily');
  const tgBtn = document.getElementById('subtabTelegram');
  const webBtn = document.getElementById('subtabWebsite');
  const dailyStrip = document.getElementById('dailyStreakStrip');
  const gridContainer = document.getElementById('thirtyDayGridContainer');
  const tgContainer = document.getElementById('telegramTasksListContainer');
  const webContainer = document.getElementById('websiteTasksListContainer');

  if (dailyBtn) dailyBtn.classList.toggle('active', tabName === 'daily');
  if (tgBtn) tgBtn.classList.toggle('active', tabName === 'telegram');
  if (webBtn) webBtn.classList.toggle('active', tabName === 'website');

  if (dailyStrip) dailyStrip.style.display = (tabName === 'daily') ? 'flex' : 'none';

  if (gridContainer) gridContainer.classList.toggle('hidden', tabName !== 'daily');
  if (tgContainer) tgContainer.classList.toggle('hidden', tabName !== 'telegram');
  if (webContainer) webContainer.classList.toggle('hidden', tabName !== 'website');

  if (tabName === 'daily') {
    renderThirtyDayCards();
  } else if (tabName === 'telegram') {
    renderTelegramTasks();
  } else if (tabName === 'website') {
    renderWebsiteTasks();
  }
};

/* ==========================================================================
   SUBTAB 2: TELEGRAM TASKS (JOIN TELEGRAM, CLAIM KEYS)
   ========================================================================== */
const DEFAULT_TELEGRAM_TASKS = [
  {
    id: 'tg1',
    title: 'Join Channel: Earn to ads',
    rewardText: '1 Key for Chest',
    rewardKeys: 1,
    desc: 'Join @Earn_to_ads official Telegram channel to win 1 Key for Chest',
    url: 'https://t.me/Earn_to_ads',
    tagText: 'TELEGRAM'
  },
  {
    id: 'tg2',
    title: 'Join Bot: Prover Svoi Akk',
    rewardText: '1 Key for Chest',
    rewardKeys: 1,
    desc: 'Launch and start @prover_svoiakk_bot on Telegram to win 1 Key for Chest',
    url: 'https://t.me/prover_svoiakk_bot',
    tagText: 'TELEGRAM BOT'
  },
  {
    id: 'tg3',
    title: 'Join Bot: Stars One Click',
    rewardText: '2 Keys for Chest',
    rewardKeys: 2,
    desc: 'Start @stars_oneclick_bot to receive 2 Chest Keys',
    url: 'https://t.me/stars_oneclick_bot',
    tagText: 'PARTNER BOT'
  }
];

function getTelegramTasksList() {
  try {
    let cloud = window.cloudTelegramTasks;
    if (cloud === undefined || cloud === null) {
      const raw = localStorage.getItem('ENERGY_TAP_TELEGRAM_TASKS_CONFIG_V1') || localStorage.getItem('ENERGY_TAP_TG_TASKS');
      if (raw !== null) {
        cloud = JSON.parse(raw);
      }
    }
    if (Array.isArray(cloud)) {
      return cloud.filter(c => c && !c.disabled).map(ct => ({
        id: ct.id,
        title: ct.title,
        rewardText: ct.rewardText || `${ct.rewardKeys || 1} Key for Chest`,
        rewardKeys: Number(ct.rewardKeys || 1),
        desc: ct.desc || `Join ${ct.title} to claim rewards`,
        url: ct.url || 'https://t.me/Earn_to_ads',
        tagText: ct.tag || ct.tagText || 'TELEGRAM'
      }));
    }
  } catch (e) {}
  return [];
}
window.getTelegramTasksList = getTelegramTasksList;

function renderTelegramTasks() {
  const container = document.getElementById('telegramTasksListContainer');
  if (!container) return;

  if (typeof gameState !== 'undefined') {
    if (typeof gameState.tasksState === 'undefined') gameState.tasksState = {};
    if (!gameState.tasksState.claimedTelegram) gameState.tasksState.claimedTelegram = {};
  }

  const allTasks = getTelegramTasksList();
  // Completed tasks are removed from the active list
  const activeTasks = allTasks.filter(task => {
    return !(gameState && gameState.tasksState && gameState.tasksState.claimedTelegram && gameState.tasksState.claimedTelegram[task.id]);
  });

  if (activeTasks.length === 0) {
    container.innerHTML = `
      <div class="empty-tasks-state py-8 text-center flex flex-col items-center justify-center gap-2">
        <span class="text-3xl">✈️</span>
        <span class="font-bold text-sm text-slate-300">No Telegram Tasks Available</span>
        <span class="text-xs text-slate-500 font-mono">${allTasks.length > 0 ? 'All Telegram tasks completed! 🎉' : 'Admin has not added any Telegram tasks.'}</span>
      </div>
    `;
    return;
  }

  let html = '';
  activeTasks.forEach(task => {
    const rewardKeys = Number(task.rewardKeys || 1);

    html += `
      <div class="web-task-card-minimal" id="tgCard-${task.id}" onclick="joinTelegramTask('${task.id}', '${task.title.replace(/'/g, "\\'")}', ${rewardKeys}, '${task.url}')" role="button" tabindex="0">
        <div class="web-task-card-left">
          <span class="web-task-card-icon">✈️</span>
          <div>
            <span class="web-task-card-title">${task.title}</span>
            <div style="font-size: 10px; color: #94a3b8; font-family: monospace;">${task.desc}</div>
          </div>
        </div>
        <div class="web-task-reward-pill">
          <span>🔑 +${rewardKeys} Key${rewardKeys === 1 ? '' : 's'}</span>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}
window.renderTelegramTasks = renderTelegramTasks;

function joinTelegramTask(taskId, title, rewardKeys, url, event) {
  if (event && typeof event.stopPropagation === 'function') event.stopPropagation();

  if (typeof gameState !== 'undefined') {
    if (typeof gameState.tasksState === 'undefined') gameState.tasksState = {};
    if (!gameState.tasksState.claimedTelegram) gameState.tasksState.claimedTelegram = {};

    if (gameState.tasksState.claimedTelegram[taskId]) {
      alert('This Telegram task has already been completed!');
      return;
    }
  }

  if (url) window.open(url, '_blank');

  if (typeof gameState !== 'undefined') {
    gameState.tasksState.claimedTelegram[taskId] = true;
    if (typeof gameState.player !== 'undefined') {
      gameState.player.chestKeys = (gameState.player.chestKeys || 0) + rewardKeys;
    }
    if (typeof gameState.goal !== 'undefined') {
      gameState.goal.currentKeys = Math.min(gameState.goal.targetKeys || 100, (gameState.goal.currentKeys || 0) + rewardKeys);
    }
  }

  alert(`🎉 Completed! +${rewardKeys} Key${rewardKeys === 1 ? '' : 's'} added to your Inventory!`);

  if (typeof window.updateUI === 'function') window.updateUI();
  if (typeof window.saveGame === 'function') window.saveGame();
  renderTelegramTasks();
}
window.joinTelegramTask = joinTelegramTask;

/* ==========================================================================
   RENDER 30-DAY RECTANGLE CARDS GRID (3*10 CARDS FORM)
   ========================================================================== */
function renderThirtyDayCards() {
  const container = document.getElementById('thirtyDayGridContainer');
  if (!container) return;

  const streakDisplay = document.getElementById('streakCountDisplay');
  if (streakDisplay) streakDisplay.innerText = `${thirtyDayState.streakCount} Day${thirtyDayState.streakCount > 1 ? 's' : ''}`;

  const dayNumDisplay = document.getElementById('currentActiveDayNum');
  if (dayNumDisplay) dayNumDisplay.innerText = thirtyDayState.activeDayIndex;

  // Check if broken streak notice should popup
  if (thirtyDayState.streakBroken) {
    const modal = document.getElementById('brokenStreakModal');
    if (modal) modal.style.display = 'flex';
  }

  let html = '';
  for (let d = 1; d <= 30; d++) {
    const dayData = thirtyDayState.days[d] || { completedCount: 0, dayRewardClaimed: false };
    const isCompleted = dayData.completedCount >= 10;
    const isPreviousDayCompleted = d === 1 || (thirtyDayState.days[d - 1] && thirtyDayState.days[d - 1].completedCount >= 10);
    const isUnlocked = isPreviousDayCompleted && d <= thirtyDayState.activeDayIndex;
    const isActive = d === thirtyDayState.activeDayIndex && !isCompleted;

    let cardClass = 'thirty-day-card';
    let statusText = '';
    let pillClass = '';

    if (isCompleted) {
      cardClass += ' completed-day';
      statusText = '✅ 10/10 Done';
      pillClass = 'completed';
    } else if (isUnlocked) {
      cardClass += ' active-day';
      statusText = `In Progress (${dayData.completedCount}/10)`;
      pillClass = 'active';
    } else {
      cardClass += ' locked-day';
      statusText = '🔒 Locked';
      pillClass = 'locked';
    }

    html += `
      <div class="${cardClass}" onclick="openDayDetailModal(${d})" id="dayCard-${d}">
        <span class="thirty-day-num">DAY ${d}</span>
        <span class="thirty-day-status-pill ${pillClass}">${statusText}</span>
        ${d === 30 ? '<span class="text-[8px] bg-yellow-950 text-yellow-300 font-bold px-1 rounded border border-yellow-500/50">👑 MEGA REWARD</span>' : ''}
      </div>
    `;
  }

  container.innerHTML = html;
}

/* ==========================================================================
   DAY 10-TASKS DETAIL MODAL
   ========================================================================== */
window.openDayDetailModal = function(dayNum) {
  const isPreviousDayCompleted = dayNum === 1 || (thirtyDayState.days[dayNum - 1] && thirtyDayState.days[dayNum - 1].completedCount >= 10);
  const isUnlocked = isPreviousDayCompleted && dayNum <= thirtyDayState.activeDayIndex;

  if (!isUnlocked && !thirtyDayState.days[dayNum].completedCount) {
    alert(`Day ${dayNum} is Locked! Complete all 10 tasks of previous days and maintain daily streak to unlock.`);
    return;
  }

  currentSelectedDay = dayNum;
  const modal = document.getElementById('dayDetailModalBackdrop');
  if (modal) modal.style.display = 'flex';

  const titleEl = document.getElementById('dayModalTitle');
  if (titleEl) titleEl.innerText = `Day ${dayNum} Quests (10 Tasks)`;

  renderDayTasksList(dayNum);
};

window.closeDayDetailModal = function(event) {
  if (event) event.stopPropagation();
  const modal = document.getElementById('dayDetailModalBackdrop');
  if (modal) modal.style.display = 'none';
};

function renderDayTasksList(dayNum) {
  const container = document.getElementById('dayTasksVerticalList');
  if (!container) return;

  const tasks = generateTasksForDay(dayNum);
  const dayData = thirtyDayState.days[dayNum];

  // Count how many are 100% completed
  let doneCount = 0;
  tasks.forEach((t, idx) => {
    if (dayData.progress[idx] >= t.target) doneCount++;
  });
  dayData.completedCount = doneCount;

  // Auto-complete task 10 if 8 tasks are done
  if (doneCount >= 8 && dayData.progress[9] < 8) {
    dayData.progress[9] = 8;
  }

  const progLabel = document.getElementById('dayTasksProgressLabel');
  if (progLabel) progLabel.innerText = `${doneCount} / 10 Completed`;

  // If all 10 completed and day reward not claimed, award 10,000 Diamonds!
  if (doneCount >= 10 && !dayData.dayRewardClaimed) {
    dayData.dayRewardClaimed = true;
    if (typeof gameState !== 'undefined' && gameState.player) {
      gameState.player.diamonds = (gameState.player.diamonds || 0) + 10000;
      if (typeof window.updateUI === 'function') window.updateUI();
    }
    alert(`🎉 DAY ${dayNum} 100% COMPLETED!\nYou won +10,000 💎 Diamonds!`);

    // If Day 30 completed, unlock Mega Reward Request!
    if (dayNum === 30 && typeof gameState !== 'undefined') {
      gameState.megaRewardUnlocked = true;
      alert('👑 ALL 30 DAYS COMPLETED!\nMega Reward Request has been UNLOCKED!');
    }
    saveThirtyDayState();
  }

  let html = '';
  tasks.forEach((task, idx) => {
    const prog = dayData.progress[idx] || 0;
    const isTargetMet = prog >= task.target;
    const isClaimed = dayData.claimed[idx];

    html += `
      <div class="day-task-row ${isTargetMet ? 'task-completed' : ''}">
        <div class="day-task-info">
          <div class="day-task-title flex items-center gap-1.5">
            <span>${task.emoji}</span>
            <span>${task.title}</span>
          </div>
          <div class="day-task-prog">
            Progress: ${Math.min(task.target, prog)} / ${task.target} &bull; ${task.sub}
          </div>
        </div>

        <div>
          ${isClaimed ? `
            <button class="day-task-claim-btn claimed">
              <span>✅ Claimed</span>
            </button>
          ` : isTargetMet ? `
            <button class="day-task-claim-btn" onclick="claimDayTaskReward(${dayNum}, ${idx})">
              <span>📢 Claim (+10 🪙)</span>
            </button>
          ` : `
            <button class="day-task-claim-btn" onclick="executeTaskQuickAction('${task.type}')" style="background: rgba(255,255,255,0.08); color: #cbd5e1;">
              <span>Go &rarr;</span>
            </button>
          `}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
  saveThirtyDayState();
}

window.claimDayTaskReward = function(dayNum, taskIdx) {
  const dayData = thirtyDayState.days[dayNum];
  if (!dayData || dayData.claimed[taskIdx]) return;

  const doClaim = () => {
    dayData.claimed[taskIdx] = true;
    if (typeof gameState !== 'undefined' && gameState.player) {
      gameState.player.coins = (gameState.player.coins || 0) + 10;
      if (typeof window.updateUI === 'function') window.updateUI();
    }
    renderDayTasksList(dayNum);
    renderThirtyDayCards();
    saveThirtyDayState();
    alert('🎉 +10 🪙 Gold Coins Claimed!');
  };

  if (typeof window.showRewardedAd === 'function') {
    window.showRewardedAd(doClaim, {
      adTitle: 'Claim Task Reward',
      adDesc: 'Watch a short video to claim +10 Coins!'
    });
  } else {
    doClaim();
  }
};

window.executeTaskQuickAction = function(taskType) {
  closeDayDetailModal();
  if (taskType === 'diamond_gen') switchPage('diamond-generator');
  else if (taskType === 'web_task') switchTaskSubtab('website');
  else if (taskType === 'fuel_use') switchPage('energy');
  else if (taskType === 'sunflower_upgrade' || taskType === 'sunflower_prestige') switchPage('sunflower');
  else if (taskType === 'spin_wheel') switchPage('spin');
  else if (taskType === 'shop_diamond') switchPage('profile');
};

/* ==========================================================================
   STREAK REPAIR POPUP
   ========================================================================== */
window.repairDailyStreakWithAd = function() {
  const doRepair = () => {
    thirtyDayState.streakBroken = false;
    thirtyDayState.lastLoginDate = new Date().toISOString().slice(0, 10);
    const modal = document.getElementById('brokenStreakModal');
    if (modal) modal.style.display = 'none';
    saveThirtyDayState();
    renderThirtyDayCards();
    alert('🔥 Daily Streak Repaired! You can now continue your 30-Day Quests.');
  };

  if (typeof window.showRewardedAd === 'function') {
    window.showRewardedAd(doRepair, {
      adTitle: 'Repair Daily Streak',
      adDesc: 'Watch sponsor video to repair your 30-day streak!'
    });
  } else {
    doRepair();
  }
};

window.repairDailyStreakWithDiamonds = function() {
  if (typeof gameState === 'undefined' || !gameState.player) return;
  if ((gameState.player.diamonds || 0) < 100) {
    alert(`Need 100 💎 Diamonds! (Have: ${gameState.player.diamonds || 0})`);
    return;
  }

  gameState.player.diamonds -= 100;
  thirtyDayState.streakBroken = false;
  thirtyDayState.lastLoginDate = new Date().toISOString().slice(0, 10);
  const modal = document.getElementById('brokenStreakModal');
  if (modal) modal.style.display = 'none';
  if (typeof window.updateUI === 'function') window.updateUI();
  saveThirtyDayState();
  renderThirtyDayCards();
  alert('🔥 Daily Streak Repaired with 100 💎 Diamonds!');
};

/* ==========================================================================
   SUBTAB 2: WEBSITE TASKS (10,000 / 1,000 COIN ENTRY, DISKWALA LINK, AD CLAIM)
   ========================================================================== */
function getActiveWebsiteTasks() {
  try {
    let cloud = window.cloudWebsiteTasks;
    if (cloud === undefined || cloud === null) {
      const raw = localStorage.getItem('ENERGY_TAP_WEBSITE_TASKS_CONFIG_V1') || localStorage.getItem('ENERGY_TAP_WEB_TASKS');
      if (raw !== null) {
        cloud = JSON.parse(raw);
      }
    }
    if (Array.isArray(cloud)) {
      return cloud.filter(c => c && !c.disabled).map(ct => ({
        id: ct.id,
        title: ct.title,
        cost: 10000,
        costAlt: 10000,
        url: ct.url || 'https://diskwala.com',
        correctPin: ct.code || ct.correctPin || '4821',
        rewardDiamonds: ct.diamondReward || ct.rewardDiamonds || 50,
        tagText: ct.tag || ct.tagText || 'DISKWALA SPONSOR'
      }));
    }
  } catch (e) {}
  return [];
}

function renderWebsiteTasks() {
  const container = document.getElementById('websiteTasksListContainer');
  if (!container) return;

  if (typeof gameState === 'undefined') return;
  if (typeof gameState.tasksState === 'undefined') gameState.tasksState = {};
  if (!gameState.tasksState.openedWebsite) gameState.tasksState.openedWebsite = {};
  if (!gameState.tasksState.claimedWebsite) gameState.tasksState.claimedWebsite = {};

  const allTasks = getActiveWebsiteTasks();
  // Completed tasks are removed from the active list
  const activeTasks = allTasks.filter(task => {
    return !(gameState.tasksState && gameState.tasksState.claimedWebsite && gameState.tasksState.claimedWebsite[task.id]);
  });

  if (activeTasks.length === 0) {
    container.innerHTML = `
      <div class="empty-tasks-state py-8 text-center flex flex-col items-center justify-center gap-2">
        <span class="text-3xl">🌐</span>
        <span class="font-bold text-sm text-slate-300">No Website Tasks Available</span>
        <span class="text-xs text-slate-500 font-mono">${allTasks.length > 0 ? 'All Website tasks completed! 🎉' : 'Admin has not added any Website tasks.'}</span>
      </div>
    `;
    return;
  }

  let html = '';
  activeTasks.forEach(task => {
    const isOpened = !!gameState.tasksState.openedWebsite[task.id];
    const rewardDiamonds = Number(task.rewardDiamonds || task.diamondReward || 50);

    html += `
      <div class="web-task-card-minimal ${isOpened ? 'is-unlocked' : ''}" onclick="openWebsiteTaskPopup('${task.id}')" role="button" tabindex="0">
        <div class="web-task-card-left">
          <span class="web-task-card-icon">🌐</span>
          <span class="web-task-card-title">${task.title}</span>
        </div>
        <div class="web-task-reward-pill">
          <span>+${rewardDiamonds} 💎</span>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

window.openWebsiteTaskPopup = function(taskId) {
  activeVerifyingTaskId = taskId;
  const task = getActiveWebsiteTasks().find(t => t.id === taskId);
  if (!task) return;

  const modal = document.getElementById('webCodeModalBackdrop');
  if (!modal) return;

  const titleEl = document.getElementById('webModalTitle');
  const subtagEl = document.getElementById('webModalSubtag');
  const prizeTagEl = document.getElementById('webModalPrizeTag');
  const rewardDiamonds = Number(task.rewardDiamonds || task.diamondReward || 50);

  if (titleEl) titleEl.innerText = task.title;
  if (subtagEl) subtagEl.innerText = task.tagText || task.tag || 'DISKWALA SPONSOR';
  if (prizeTagEl) prizeTagEl.innerText = `+${rewardDiamonds} 💎`;

  const isClaimed = !!(gameState.tasksState && gameState.tasksState.claimedWebsite && gameState.tasksState.claimedWebsite[taskId]);
  const isOpened = !!(gameState.tasksState && gameState.tasksState.openedWebsite && gameState.tasksState.openedWebsite[taskId]);

  const viewLocked = document.getElementById('webModalLockedView');
  const viewUnlocked = document.getElementById('webModalUnlockedView');
  const viewClaimed = document.getElementById('webModalClaimedView');

  if (isClaimed) {
    if (viewLocked) viewLocked.style.display = 'none';
    if (viewUnlocked) viewUnlocked.style.display = 'none';
    if (viewClaimed) viewClaimed.style.display = 'flex';
  } else if (isOpened) {
    if (viewLocked) viewLocked.style.display = 'none';
    if (viewClaimed) viewClaimed.style.display = 'none';
    if (viewUnlocked) viewUnlocked.style.display = 'flex';
    for (let i = 0; i < 4; i++) {
      const input = document.getElementById(`webPin${i}`);
      if (input) input.value = '';
    }
    setTimeout(() => {
      const firstPin = document.getElementById('webPin0');
      if (firstPin) firstPin.focus();
    }, 100);
  } else {
    if (viewUnlocked) viewUnlocked.style.display = 'none';
    if (viewClaimed) viewClaimed.style.display = 'none';
    if (viewLocked) viewLocked.style.display = 'flex';
  }

  modal.style.display = 'flex';
};

// Backward-compatible alias for existing callers
window.openWebsitePinModal = window.openWebsiteTaskPopup;

window.unlockCurrentWebsiteTask = function() {
  if (!activeVerifyingTaskId) return;
  const task = getActiveWebsiteTasks().find(t => t.id === activeVerifyingTaskId);
  if (!task) return;

  const cost = 10000;
  if (typeof gameState === 'undefined' || !gameState.player) return;
  if ((gameState.player.coins || 0) < cost) {
    alert(`Need 10,000 🪙 Coins to unlock this quest! (Current: ${Math.floor(gameState.player.coins || 0).toLocaleString()} 🪙)`);
    return;
  }

  gameState.player.coins -= cost;
  if (!gameState.tasksState.openedWebsite) gameState.tasksState.openedWebsite = {};
  gameState.tasksState.openedWebsite[activeVerifyingTaskId] = true;

  if (typeof window.saveGame === 'function') window.saveGame();
  if (typeof window.updateUI === 'function') window.updateUI();
  renderWebsiteTasks();

  // Automatically open the sponsor link in new tab
  if (task.url) {
    window.open(task.url, '_blank');
  }

  // Switch modal view to Unlocked (PIN Entry)
  const viewLocked = document.getElementById('webModalLockedView');
  const viewUnlocked = document.getElementById('webModalUnlockedView');
  if (viewLocked) viewLocked.style.display = 'none';
  if (viewUnlocked) {
    viewUnlocked.style.display = 'flex';
    for (let i = 0; i < 4; i++) {
      const input = document.getElementById(`webPin${i}`);
      if (input) input.value = '';
    }
    setTimeout(() => {
      const firstPin = document.getElementById('webPin0');
      if (firstPin) firstPin.focus();
    }, 100);
  }
};

window.revisitWebsiteTaskUrl = function() {
  if (!activeVerifyingTaskId) return;
  const task = getActiveWebsiteTasks().find(t => t.id === activeVerifyingTaskId);
  if (!task) return;
  if (task.url) window.open(task.url, '_blank');
};

window.closeWebCodeModal = function(event) {
  if (event) event.stopPropagation();
  const modal = document.getElementById('webCodeModalBackdrop');
  if (modal) modal.style.display = 'none';
  activeVerifyingTaskId = null;
};

window.submitWebsiteCodeVerification = function() {
  if (!activeVerifyingTaskId) return;
  const task = getActiveWebsiteTasks().find(t => t.id === activeVerifyingTaskId);
  if (!task) return;

  let enteredPin = '';
  for (let i = 0; i < 4; i++) {
    const input = document.getElementById(`webPin${i}`);
    enteredPin += input ? input.value.trim() : '';
  }

  if (enteredPin.length < 4) {
    alert('Please enter the complete 4-digit PIN code!');
    return;
  }

  const expectedPin = String(task.correctPin || task.code || '4821').trim();
  if (enteredPin !== expectedPin) {
    alert('❌ Incorrect 4-Digit Code! Please browse the site carefully and try again.');
    return;
  }

  // Code correct! Must watch rewarded ad to collect 50 Diamonds
  const doClaim = () => {
    if (!gameState.tasksState.claimedWebsite) gameState.tasksState.claimedWebsite = {};
    gameState.tasksState.claimedWebsite[task.id] = true;

    const rewardDiamonds = Number(task.rewardDiamonds || task.diamondReward || 50);

    if (typeof gameState !== 'undefined' && gameState.player) {
      gameState.player.diamonds = (gameState.player.diamonds || 0) + rewardDiamonds;
      gameState.player.websiteTasksCompleted = (gameState.player.websiteTasksCompleted || 0) + 1;
      gameState.player.completedWebTasks = (gameState.player.completedWebTasks || 0) + 1;
      if (typeof window.updateUI === 'function') window.updateUI();
      if (typeof window.saveGame === 'function') window.saveGame();
    }

    closeWebCodeModal();
    renderWebsiteTasks();

    // Increment website task progress for today's daily task!
    if (typeof recordTaskEvent === 'function') {
      recordTaskEvent('web_task', 1);
    }

    // Refresh Gift Card catalog if active
    if (typeof window.renderCurrentCategoryRewards === 'function') {
      window.renderCurrentCategoryRewards();
    }

    alert(`🎉 Verified! You won +${rewardDiamonds} 💎 Diamonds!`);
  };

  if (typeof window.showRewardedAd === 'function') {
    window.showRewardedAd(doClaim, {
      adTitle: 'Claim 50 Diamonds',
      adDesc: 'Watch sponsor video to verify and collect your 50 Diamonds!'
    });
  } else {
    doClaim();
  }
};

/* ==========================================================================
   GLOBAL EVENT HOOK: Record progress for 30-Day Tasks
   ========================================================================== */
window.recordTaskEvent = function(eventType, amount = 1) {
  const activeDay = thirtyDayState.activeDayIndex;
  const dayData = thirtyDayState.days[activeDay];
  if (!dayData) return;

  const tasks = generateTasksForDay(activeDay);
  let updated = false;

  tasks.forEach((task, idx) => {
    if (task.type === eventType) {
      dayData.progress[idx] = (dayData.progress[idx] || 0) + amount;
      updated = true;
    } else if (task.type === 'fuel_use') {
      if (eventType === 'fuel_green') {
        dayData.progress[idx] = (dayData.progress[idx] || 0) + (amount || 1);
        updated = true;
      } else if (eventType === 'fuel_darkgreen') {
        dayData.progress[idx] = (dayData.progress[idx] || 0) + (amount ? amount * 0.4 : 0.4);
        updated = true;
      }
    }
  });

  // Calculate task 10 progress: completed total 8 tasks today
  let doneCount = 0;
  for (let i = 0; i < 9; i++) {
    if ((dayData.progress[i] || 0) >= tasks[i].target) {
      doneCount++;
    }
  }
  const prevP9 = dayData.progress[9] || 0;
  dayData.progress[9] = Math.min(8, doneCount);
  if (dayData.progress[9] !== prevP9) updated = true;

  if (updated) {
    saveThirtyDayState();
    renderThirtyDayCards();
  }
};

/* ==========================================================================
   PIN INPUT AUTO-ADVANCE & EVENT LISTENERS
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  for (let i = 0; i < 4; i++) {
    const input = document.getElementById(`webPin${i}`);
    if (input) {
      input.addEventListener('input', (e) => {
        if (e.target.value.length === 1 && i < 3) {
          const next = document.getElementById(`webPin${i + 1}`);
          if (next) next.focus();
        }
      });
    }
  }

  renderThirtyDayCards();
  renderWebsiteTasks();
});

// Window Exports
window.renderTasksList = function() {
  const activeSubtab = document.querySelector('.task-subtab-btn.active');
  const subtabId = activeSubtab ? activeSubtab.id : 'subtabDaily';
  if (subtabId === 'subtabTelegram') {
    renderTelegramTasks();
  } else if (subtabId === 'subtabWebsite') {
    renderWebsiteTasks();
  } else {
    renderThirtyDayCards();
  }
};
window.renderThirtyDayCards = renderThirtyDayCards;
window.renderTelegramTasks = renderTelegramTasks;
window.renderWebsiteTasks = renderWebsiteTasks;
window.getActiveWebsiteTasks = getActiveWebsiteTasks;
window.WEBSITE_TASKS = WEBSITE_TASKS;

window.addEventListener('telegramTasksUpdated', () => {
  renderTelegramTasks();
});

window.addEventListener('websiteTasksUpdated', () => {
  renderWebsiteTasks();
});
