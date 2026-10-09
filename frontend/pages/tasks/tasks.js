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
    cost: 1000,
    costAlt: 10000,
    url: 'https://diskwala.com/quest/alpha',
    correctPin: '4821',
    rewardDiamonds: 100,
    tagText: 'DISKWALA SPONSOR'
  },
  {
    id: 'web_dw_2',
    title: 'Diskwala Cloud Sponsor Quest #2',
    cost: 1000,
    costAlt: 10000,
    url: 'https://diskwala.com/quest/beta',
    correctPin: '7392',
    rewardDiamonds: 150,
    tagText: 'DISKWALA SPONSOR'
  },
  {
    id: 'web_dw_3',
    title: 'Diskwala Elite Partner Quest #3',
    cost: 10000,
    costAlt: 1000,
    url: 'https://diskwala.com/quest/gamma',
    correctPin: '5164',
    rewardDiamonds: 250,
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
   SUBTAB SWITCHER (30-Day Quests vs Website Tasks)
   ========================================================================== */
window.switchTaskSubtab = function(tabName) {
  const dailyBtn = document.getElementById('subtabDaily');
  const webBtn = document.getElementById('subtabWebsite');
  const gridContainer = document.getElementById('thirtyDayGridContainer');
  const webContainer = document.getElementById('websiteTasksListContainer');

  if (tabName === 'daily') {
    if (dailyBtn) dailyBtn.classList.add('active');
    if (webBtn) webBtn.classList.remove('active');
    if (gridContainer) gridContainer.classList.remove('hidden');
    if (webContainer) webContainer.classList.add('hidden');
    renderThirtyDayCards();
  } else {
    if (webBtn) webBtn.classList.add('active');
    if (dailyBtn) dailyBtn.classList.remove('active');
    if (gridContainer) gridContainer.classList.add('hidden');
    if (webContainer) webContainer.classList.remove('hidden');
    renderWebsiteTasks();
  }
};

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
              <span>🎬 Claim (+10 🪙)</span>
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
    const cloud = window.cloudWebsiteTasks || JSON.parse(localStorage.getItem('ENERGY_TAP_WEBSITE_TASKS_CONFIG_V1') || 'null');
    if (Array.isArray(cloud) && cloud.length > 0) {
      return cloud.filter(c => !c.disabled).map(ct => ({
        id: ct.id,
        title: ct.title,
        cost: ct.costCoins !== undefined ? ct.costCoins : 1000,
        costAlt: ct.costAlt !== undefined ? ct.costAlt : 10000,
        url: ct.url || 'https://diskwala.com',
        correctPin: ct.code || ct.correctPin || '1234',
        rewardDiamonds: ct.diamondReward || ct.rewardDiamonds || 100,
        tagText: ct.tag || ct.tagText || 'DISKWALA SPONSOR'
      }));
    }
  } catch (e) {}
  return WEBSITE_TASKS;
}

function renderWebsiteTasks() {
  const container = document.getElementById('websiteTasksListContainer');
  if (!container) return;

  if (typeof gameState.tasksState === 'undefined') gameState.tasksState = {};
  if (!gameState.tasksState.openedWebsite) gameState.tasksState.openedWebsite = {};
  if (!gameState.tasksState.claimedWebsite) gameState.tasksState.claimedWebsite = {};

  const currentTasks = getActiveWebsiteTasks();
  let html = '';
  currentTasks.forEach(task => {
    const isOpened = gameState.tasksState.openedWebsite[task.id];
    const isClaimed = gameState.tasksState.claimedWebsite[task.id];

    html += `
      <div class="bg-stone-950/90 border border-stone-800 rounded-xl p-3 flex flex-col gap-2.5 shadow-md">
        <div class="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div class="flex items-center gap-2">
            <span class="text-xl">🌐</span>
            <div>
              <h4 class="text-xs font-black text-amber-300">${task.title}</h4>
              <span class="text-[9px] text-stone-400 font-mono">${task.tagText || 'DISKWALA QUEST'}</span>
            </div>
          </div>
          <span class="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700">
            +${task.rewardDiamonds} 💎
          </span>
        </div>

        <div class="flex items-center justify-between text-[10px] text-stone-300">
          <span>Cost Options: <strong class="text-amber-300 font-mono">1,000 🪙</strong> or <strong class="text-amber-300 font-mono">10,000 🪙</strong></span>
          <span>Secret 4-Digit Code Required</span>
        </div>

        <div class="grid grid-cols-2 gap-2 pt-1">
          ${isClaimed ? `
            <button class="col-span-2 bg-stone-800 text-stone-400 font-black text-xs py-2 rounded-lg cursor-default">
              <span>✅ Quest Claimed (+${task.rewardDiamonds} 💎)</span>
            </button>
          ` : isOpened ? `
            <button onclick="openWebsiteTaskUrl('${task.id}')" class="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs py-2 rounded-lg active:scale-95 transition">
              <span>🔗 Open Diskwala Site</span>
            </button>
            <button onclick="openWebsitePinModal('${task.id}')" class="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-2 rounded-lg active:scale-95 transition">
              <span>🔢 Enter Code</span>
            </button>
          ` : `
            <button onclick="unlockWebsiteTask('${task.id}', 1000)" class="bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-xs py-2 rounded-lg active:scale-95 transition">
              <span>🪙 Unlock (1,000 🪙)</span>
            </button>
            <button onclick="unlockWebsiteTask('${task.id}', 10000)" class="bg-yellow-600 hover:bg-yellow-500 text-stone-950 font-black text-xs py-2 rounded-lg active:scale-95 transition">
              <span>🪙 Unlock (10,000 🪙)</span>
            </button>
          `}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

window.unlockWebsiteTask = function(taskId, cost) {
  if (typeof gameState === 'undefined' || !gameState.player) return;
  if ((gameState.player.coins || 0) < cost) {
    alert(`Need ${cost.toLocaleString()} 🪙 Coins! (Have: ${Math.floor(gameState.player.coins || 0)})`);
    return;
  }

  gameState.player.coins -= cost;
  if (!gameState.tasksState.openedWebsite) gameState.tasksState.openedWebsite = {};
  gameState.tasksState.openedWebsite[taskId] = true;

  if (typeof window.updateUI === 'function') window.updateUI();
  renderWebsiteTasks();

  // Automatically open the Diskwala link
  openWebsiteTaskUrl(taskId);
};

window.openWebsiteTaskUrl = function(taskId) {
  const task = getActiveWebsiteTasks().find(t => t.id === taskId);
  if (!task) return;
  window.open(task.url || 'https://diskwala.com', '_blank');
};

window.openWebsitePinModal = function(taskId) {
  activeVerifyingTaskId = taskId;
  const modal = document.getElementById('webCodeModalBackdrop');
  if (modal) modal.style.display = 'flex';

  for (let i = 0; i < 4; i++) {
    const input = document.getElementById(`webPin${i}`);
    if (input) input.value = '';
  }
};

window.closeWebCodeModal = function(event) {
  if (event) event.stopPropagation();
  const modal = document.getElementById('webCodeModalBackdrop');
  if (modal) modal.style.display = 'none';
};

window.revisitWebsiteTaskUrl = function() {
  if (activeVerifyingTaskId) openWebsiteTaskUrl(activeVerifyingTaskId);
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

  if (enteredPin !== task.correctPin) {
    alert('❌ Incorrect 4-Digit Code! Please browse the site carefully and try again.');
    return;
  }

  // Code correct! Watch Ad to claim reward (Requirement 12: all task reward collect for using a ads)
  const doClaim = () => {
    if (!gameState.tasksState.claimedWebsite) gameState.tasksState.claimedWebsite = {};
    gameState.tasksState.claimedWebsite[task.id] = true;

    if (typeof gameState !== 'undefined' && gameState.player) {
      gameState.player.diamonds = (gameState.player.diamonds || 0) + (task.rewardDiamonds || 100);
      if (typeof window.updateUI === 'function') window.updateUI();
    }

    closeWebCodeModal();
    renderWebsiteTasks();

    // Increment website task progress for today's daily task!
    recordTaskEvent('web_task', 1);

    alert(`🎉 Verified! You won +${task.rewardDiamonds} 💎 Diamonds!`);
  };

  if (typeof window.showRewardedAd === 'function') {
    window.showRewardedAd(doClaim, {
      adTitle: 'Claim Web Quest Diamonds',
      adDesc: 'Watch sponsor video to verify and collect your Diamonds!'
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

window.addEventListener('websiteTasksUpdated', () => {
  renderWebsiteTasks();
});

// Window Exports
window.renderThirtyDayCards = renderThirtyDayCards;
window.renderWebsiteTasks = renderWebsiteTasks;
window.getActiveWebsiteTasks = getActiveWebsiteTasks;
window.WEBSITE_TASKS = WEBSITE_TASKS;
