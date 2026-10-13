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

const THIRTY_DAY_STORAGE_KEY = 'ENERGY_TAP_7DAY_TASKS_V2';

// Website Tasks List with Diskwala links and 1,000 / 10,000 coin options
let WEBSITE_TASKS = [];

// Helper to generate the 10 tasks for Day d (1 to 30)
function generateTasksForDay(dayNum) {
  const t6Items = ['ticket', 'card', 'key', 'boom'];
  const t7Items = ['egg', 'brain'];

  let t6Item = 'ticket';
  let t7Item = 'egg';

  if (dayNum === 1) {
    // Day 1: strictly ticket for Task 6 and egg for Task 7
    t6Item = 'ticket';
    t7Item = 'egg';
  } else {
    // Days 2 to 30: randomly change option given in brackets using deterministic pseudo-random per day
    const seed6 = Math.sin(dayNum * 127.1 + 311.7) * 43758.5453;
    const idx6 = Math.floor(Math.abs(seed6)) % t6Items.length;
    t6Item = t6Items[idx6];

    const seed7 = Math.cos(dayNum * 269.5 + 183.3) * 43758.5453;
    const idx7 = Math.floor(Math.abs(seed7)) % t7Items.length;
    t7Item = t7Items[idx7];
  }

  const t6Meta = {
    ticket: { title: 'Use 5 Tickets', sub: 'Spin lucky prize spinner with tickets', emoji: '🎫' },
    card: { title: 'Use 5 Scratch Cards', sub: 'Scratch & reveal cards in Scratch minigame', emoji: '🃏' },
    key: { title: 'Use 5 Chest Keys', sub: 'Unlock mystery treasure chests with keys', emoji: '🔑' },
    boom: { title: 'Use 5 Booms', sub: 'Boom blast in Coin Catcher minigame', emoji: '💣' }
  }[t6Item] || { title: `Use 5 ${t6Item.toUpperCase()}`, sub: `Minigame ${t6Item}`, emoji: '🎫' };

  const t7Meta = {
    egg: { title: 'Use 100 Eggs', sub: 'Hatch 100 eggs in Egg Nest minigame', emoji: '🥚' },
    brain: { title: 'Use 100 Brains', sub: 'Challenge 100 brains in Memory Match', emoji: '🧠' }
  }[t7Item] || { title: `Use 100 ${t7Item.toUpperCase()}`, sub: `Minigame ${t7Item}`, emoji: '🥚' };

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
      title: 'Sunflower Land Upgrade 200',
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
      title: t6Meta.title,
      sub: t6Meta.sub,
      type: `use_${t6Item}`,
      target: 5,
      emoji: t6Meta.emoji
    },
    {
      id: `d${dayNum}_t7`,
      title: t7Meta.title,
      sub: t7Meta.sub,
      type: `use_${t7Item}`,
      target: 100,
      emoji: t7Meta.emoji
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
      title: 'Shop Use 100 Diamonds',
      sub: 'Spend 100 diamonds in Shop',
      type: 'shop_diamond',
      target: 100,
      emoji: '🛍️'
    },
    {
      id: `d${dayNum}_t10`,
      title: 'Complete Total 8 Tasks',
      sub: 'Finish any 8 tasks today',
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
    activeDayIndex: 1, // 1 to 7
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

  // Ensure each day has a record (1 to 7 Days Only)
  for (let d = 1; d <= 7; d++) {
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
      // If previous day was completed, advance activeDayIndex (1 to 7)
      if (defaultState.days[defaultState.activeDayIndex].completedCount >= 10) {
        defaultState.activeDayIndex = Math.min(7, defaultState.activeDayIndex + 1);
      }
    } else if (diffDays > 1) {
      // Streak broken!
      defaultState.streakBroken = true;
    }
  }

  defaultState.activeDayIndex = Math.min(7, defaultState.activeDayIndex || 1);
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
const DEFAULT_TELEGRAM_TASKS = [];

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

  const tgBadge = document.getElementById('telegramBadgeCount');
  if (tgBadge) tgBadge.textContent = activeTasks.length;

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
      <div class="web-task-card-minimal tg-task-card" id="tgCard-${task.id}" onclick="joinTelegramTask('${task.id}', '${task.title.replace(/'/g, "\\'")}', ${rewardKeys}, '${task.url}')" role="button" tabindex="0">
        <div class="web-task-card-left">
          <div class="tg-task-icon-box">
            <span>✈️</span>
          </div>
          <div class="tg-task-text-col">
            <span class="web-task-card-title">${task.title}</span>
          </div>
        </div>
        <div class="tg-task-right">
          <div class="web-task-reward-pill tg-reward">
            <span>🔑 +${rewardKeys} Key${rewardKeys === 1 ? '' : 's'}</span>
          </div>
          <button class="tg-task-action-btn" type="button">
            <span>Join ➔</span>
          </button>
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
   RENDER 30-DAY RECTANGLE TABS & IN-PAGE QUESTS VIEW
   ========================================================================== */
function isMegaRewardUnlocked() {
  if (typeof gameState !== 'undefined' && gameState.megaRewardUnlocked) return true;
  try {
    if (localStorage.getItem('ENERGY_TAP_MEGA_REWARD_UNLOCKED') === 'true') return true;
  } catch (e) {}
  if (thirtyDayState && thirtyDayState.days && thirtyDayState.days[7] && thirtyDayState.days[7].completedCount >= 8) return true;
  return false;
}

function renderMegaRewardBanner() {
  const banner = document.getElementById('dailyMegaRewardBanner');
  if (!banner) return;

  const unlocked = isMegaRewardUnlocked();
  let completedDaysCount = 0;
  for (let d = 1; d <= 7; d++) {
    if (thirtyDayState.days[d] && thirtyDayState.days[d].completedCount >= 8) {
      completedDaysCount++;
    }
  }

  if (unlocked) {
    banner.className = 'daily-mega-reward-card unlocked';
    banner.innerHTML = `
      <div class="mega-banner-content" onclick="switchPage('mega-reward')">
        <div class="mega-banner-left">
          <div class="mega-banner-icon-box unlocked">
            <span class="mega-banner-icon">👑</span>
          </div>
          <div class="mega-banner-text">
            <div class="mega-banner-badge">7 DAYS COMPLETED 🎉</div>
            <h4 class="mega-banner-heading">MEGA REWARD REQUEST UNLOCKED!</h4>
          </div>
        </div>
        <button class="mega-banner-btn" type="button" onclick="event.stopPropagation(); switchPage('mega-reward')">
          <span>CLAIM REWARD 🎁</span>
        </button>
      </div>
    `;
  } else {
    const pct = Math.min(100, Math.round((completedDaysCount / 7) * 100));
    banner.className = 'daily-mega-reward-card locked';
    banner.innerHTML = `
      <div class="mega-banner-content">
        <div class="mega-banner-left">
          <div class="mega-banner-icon-box locked">
            <span class="mega-banner-icon">🔒</span>
          </div>
          <div class="mega-banner-text">
            <div class="mega-banner-badge-locked">UNLOCKS AFTER 7 DAYS</div>
            <h4 class="mega-banner-heading-locked">7-Day Grand Prize: Mega Reward</h4>
            <div class="mega-banner-progress-bar-wrap">
              <div class="mega-banner-progress-bar-fill" style="width: ${pct}%;"></div>
            </div>
          </div>
        </div>
        <div class="mega-banner-prog-box">
          <span class="mega-banner-prog-label">Days Cleared</span>
          <span class="mega-banner-prog-val font-mono font-black">${completedDaysCount} / 7</span>
          <span class="mega-banner-prog-pct">${pct}% Completed</span>
        </div>
      </div>
    `;
  }
}

function renderThirtyDayTabs() {
  const tabsStrip = document.getElementById('thirtyDayRectTabsStrip');
  if (!tabsStrip) return;

  const chevronColors = [
    '#e5001a', // 1: Red
    '#ff7a00', // 2: Orange
    '#f8b837', // 3: Golden Yellow
    '#56b970', // 4: Leaf Green
    '#009fd9', // 5: Sky Cyan
    '#4355a8', // 6: Royal Indigo
    '#782bcf'  // 7: Rich Purple
  ];

  let html = '';
  for (let d = 1; d <= 7; d++) {
    const color = chevronColors[d - 1];
    const dayData = thirtyDayState.days[d] || { completedCount: 0, dayRewardClaimed: false };
    const isCompleted = dayData.completedCount >= 10;
    const isPreviousDayCompleted = d === 1 || (thirtyDayState.days[d - 1] && thirtyDayState.days[d - 1].completedCount >= 8);
    const isUnlocked = isPreviousDayCompleted && d <= thirtyDayState.activeDayIndex;
    const isSelected = d === currentSelectedDay;

    let statusText = '🔒 Lock';
    let pillClass = 'locked';

    if (isCompleted) {
      statusText = '✓ Done';
      pillClass = 'completed';
    } else if (isUnlocked) {
      statusText = '⚡ Active';
      pillClass = 'active';
    } else {
      statusText = '🔒 Lock';
      pillClass = 'locked';
    }

    // Exact geometric chevron arrows matching reference image:
    // Day 1 has flat left edge, right arrow point
    // Days 2-7 have interlocking indented back notch (0,0 -> 30,35 -> 0,70) and matching right arrow point (70,0 -> 100,35 -> 70,70)
    const svgPath = (d === 1)
      ? `<polygon points="0,0 70,0 100,35 70,70 0,70" fill="${color}" />`
      : `<polygon points="0,0 70,0 100,35 70,70 0,70 30,35" fill="${color}" />`;

    const circleCx = (d === 1) ? 42 : 55;

    html += `
      <button type="button" 
        class="chevron-arrow-btn ${pillClass} ${isSelected ? 'selected' : ''}" 
        onclick="selectDayTab(${d})" 
        id="dayTab-${d}" 
        style="--chevron-glow: ${color};" 
        title="Day ${d}: ${statusText}">
        <div class="chevron-arrow-graphic">
          <svg viewBox="0 0 100 70" preserveAspectRatio="none" class="chevron-arrow-svg">
            ${svgPath}
            <circle cx="${circleCx}" cy="35" r="16.5" fill="#ffffff" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.28))" />
            <text x="${circleCx}" y="41.5" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900" font-size="17" fill="${color}">${d}</text>
          </svg>
        </div>
        <div class="chevron-arrow-meta">
          <span class="chevron-day-tag">Day ${d}</span>
          <span class="chevron-status-badge ${pillClass}">${statusText}</span>
        </div>
      </button>
    `;
  }

  tabsStrip.innerHTML = html;
}

window.selectDayTab = function(dayNum) {
  currentSelectedDay = Math.max(1, Math.min(7, Number(dayNum) || 1));
  renderThirtyDayTabs();
  renderSelectedDayQuests(currentSelectedDay);

  const tabEl = document.getElementById(`dayTab-${currentSelectedDay}`);
  if (tabEl) {
    tabEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }
};

function renderSelectedDayQuests(dayNum) {
  const panel = document.getElementById('selectedDayQuestsPanel');
  if (!panel) return;

  const validDay = Math.max(1, Math.min(7, Number(dayNum) || 1));
  const titleEl = document.getElementById('selectedDayTitle');
  const subEl = document.getElementById('selectedDaySubtitle');
  const progTextEl = document.getElementById('selectedDayProgText');
  const barFillEl = document.getElementById('selectedDayBarFill');
  const statusPillEl = document.getElementById('selectedDayStatusPill');
  const statusTextEl = document.getElementById('selectedDayStatusText');
  const container = document.getElementById('selectedDayTasksList');

  const tasks = generateTasksForDay(validDay);
  const dayData = thirtyDayState.days[validDay] || { progress: Array(10).fill(0), claimed: Array(10).fill(false), completedCount: 0 };

  // Calculate completion
  let doneCount = 0;
  tasks.forEach((t, idx) => {
    if ((dayData.progress[idx] || 0) >= t.target) doneCount++;
  });
  dayData.completedCount = doneCount;

  // Auto-complete task 10 if 8 tasks are done
  if (doneCount >= 8 && (dayData.progress[9] || 0) < 8) {
    dayData.progress[9] = 8;
  }

  if (titleEl) titleEl.innerText = validDay === 7 ? `👑 Day 7 Grand Finale Quests (10 Tasks)` : `Day ${validDay} Quests (10 Tasks)`;
  if (subEl) subEl.innerHTML = '';
  if (progTextEl) progTextEl.innerText = `${doneCount} / 10 Completed`;
  if (barFillEl) barFillEl.style.width = `${Math.min(100, Math.round((doneCount / 10) * 100))}%`;

  const isCompleted = doneCount >= 10;
  const isPreviousDayCompleted = validDay === 1 || (thirtyDayState.days[validDay - 1] && thirtyDayState.days[validDay - 1].completedCount >= 8);
  const isUnlocked = isPreviousDayCompleted && validDay <= thirtyDayState.activeDayIndex;

  if (statusPillEl && statusTextEl) {
    if (isCompleted) {
      statusPillEl.className = 'selected-day-status-pill completed';
      statusTextEl.innerText = '✅ Day Complete';
    } else if (isUnlocked) {
      statusPillEl.className = 'selected-day-status-pill active';
      statusTextEl.innerText = '⚡ Day Active';
    } else {
      statusPillEl.className = 'selected-day-status-pill locked';
      statusTextEl.innerText = '🔒 Day Locked';
    }
  }

  // Check 10,000 Diamonds Day Reward
  if (doneCount >= 10 && !dayData.dayRewardClaimed) {
    dayData.dayRewardClaimed = true;
    if (typeof gameState !== 'undefined' && gameState.player) {
      gameState.player.diamonds = (gameState.player.diamonds || 0) + 10000;
      if (typeof window.updateUI === 'function') window.updateUI();
    }
    alert(`🎉 DAY ${validDay} 100% COMPLETED!\nYou won +10,000 💎 Diamonds!`);

    // If Day 7 completed, unlock Mega Reward Request!
    if (validDay === 7) {
      if (typeof gameState !== 'undefined') {
        gameState.megaRewardUnlocked = true;
      }
      try {
        localStorage.setItem('ENERGY_TAP_MEGA_REWARD_UNLOCKED', 'true');
      } catch (e) {}
      alert('👑 ALL 7 DAYS COMPLETED!\nMega Reward Request has been UNLOCKED!\nYou can now claim real Mega Rewards!');
      renderMegaRewardBanner();
    }
    saveThirtyDayState();
  }

  if (!container) return;

  let html = '';
  tasks.forEach((task, idx) => {
    const prog = dayData.progress[idx] || 0;
    const isTargetMet = prog >= task.target;
    const isClaimed = dayData.claimed[idx];
    const pct = Math.min(100, Math.round((Math.min(prog, task.target) / task.target) * 100));

    html += `
      <div class="day-task-row ${isClaimed ? 'task-claimed' : (isTargetMet ? 'task-completed' : '')}">
        <div class="day-task-avatar">
          <span>${task.emoji}</span>
        </div>
        <div class="day-task-info">
          <div class="day-task-title-row">
            <span class="day-task-title">${task.title}</span>
            <span class="day-task-target-pill ${isClaimed ? 'claimed' : (isTargetMet ? 'complete' : '')}">
              ${isClaimed ? '✓ Done' : `${Math.min(task.target, prog)} / ${task.target}`}
            </span>
          </div>
          <div class="day-task-mini-progress">
            <div class="day-task-mini-progress-fill ${isClaimed ? 'claimed' : (isTargetMet ? 'complete' : '')}" style="width: ${isClaimed ? 100 : pct}%;"></div>
          </div>
        </div>

        <div class="day-task-action-wrap">
          ${isClaimed ? `
            <button class="day-task-claim-btn claimed" type="button" disabled>
              <span>✓ Claimed</span>
            </button>
          ` : isTargetMet ? `
            <button class="day-task-claim-btn claim-ready" type="button" onclick="claimDayTaskReward(${dayNum}, ${idx})">
              <span>📢 Claim +10 🪙</span>
            </button>
          ` : `
            <button class="day-task-claim-btn go-btn" type="button" onclick="executeTaskQuickAction('${task.type}')">
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

function renderThirtyDayCards() {
  const streakDisplay = document.getElementById('streakCountDisplay');
  if (streakDisplay) streakDisplay.innerText = `${thirtyDayState.streakCount} Day${thirtyDayState.streakCount > 1 ? 's' : ''}`;

  const dayNumDisplay = document.getElementById('currentActiveDayNum');
  if (dayNumDisplay) dayNumDisplay.innerText = Math.min(7, thirtyDayState.activeDayIndex || 1);

  // Check if broken streak notice should popup
  if (thirtyDayState.streakBroken) {
    const modal = document.getElementById('brokenStreakModal');
    if (modal) modal.style.display = 'flex';
  }

  // Render Mega Reward Banner
  renderMegaRewardBanner();

  // Render Current Selected Day Quests Panel (Synchronized with 7 Arrow Chevrons)
  if (!currentSelectedDay || currentSelectedDay < 1 || currentSelectedDay > 7) {
    currentSelectedDay = Math.min(7, thirtyDayState.activeDayIndex || 1);
  }

  // Render 7 Arrow Chevron Process Chain Tabs
  renderThirtyDayTabs();

  // Render Current Selected Day Quests Panel
  renderSelectedDayQuests(currentSelectedDay);
}

/* ==========================================================================
   DAY 10-TASKS DETAIL MODAL (Backward-compatibility sheet)
   ========================================================================== */
window.openDayDetailModal = function(dayNum) {
  selectDayTab(dayNum);
};

window.closeDayDetailModal = function(event) {
  if (event) event.stopPropagation();
  const modal = document.getElementById('dayDetailModalBackdrop');
  if (modal) modal.style.display = 'none';
};

function renderDayTasksList(dayNum) {
  renderSelectedDayQuests(dayNum);
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
    renderSelectedDayQuests(dayNum);
    renderThirtyDayTabs();
    renderMegaRewardBanner();
    saveThirtyDayState();

    if (typeof showFloatingToast === 'function') {
      showFloatingToast('🎉 +10 🪙 Gold Coins Added to Balance!');
    } else {
      alert('🎉 +10 🪙 Gold Coins Claimed!');
    }
  };

  // Rewarded interstitial
  if (typeof show_10676091 === 'function') {
    show_10676091().then(() => {
      // You need to add your user reward function here, which will be executed after the user watches the ad.
      // For more details, please refer to the detailed instructions.
      alert('You have seen an ad!');
      doClaim();
    }).catch((e) => {
      console.warn('show_10676091 notice:', e);
      alert('You have seen an ad!');
      doClaim();
    });
  } else if (typeof window.showRewardedAd === 'function') {
    window.showRewardedAd(doClaim);
  } else {
    alert('You have seen an ad!');
    doClaim();
  }
};

window.executeTaskQuickAction = function(taskType) {
  closeDayDetailModal();
  if (taskType === 'diamond_gen') switchPage('diamond-generator');
  else if (taskType === 'web_task') switchTaskSubtab('website');
  else if (taskType === 'fuel_use') switchPage('energy');
  else if (taskType === 'sunflower_upgrade' || taskType === 'sunflower_prestige') switchPage('sunflower');
  else if (taskType === 'use_ticket' || taskType === 'spin_wheel') switchPage('spin');
  else if (taskType === 'use_card') switchPage('scratch');
  else if (taskType === 'use_key') switchPage('chest');
  else if (taskType === 'use_boom') switchPage('coin-catcher');
  else if (taskType === 'use_egg') switchPage('egg');
  else if (taskType === 'use_brain') switchPage('memory-match');
  else if (taskType === 'shop_diamond') switchPage('profile');
  else switchPage('home');
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

  // Rewarded interstitial
  if (typeof show_10676091 === 'function') {
    show_10676091().then(() => {
      // You need to add your user reward function here, which will be executed after the user watches the ad.
      // For more details, please refer to the detailed instructions.
      alert('You have seen an ad!');
      doRepair();
    }).catch((e) => {
      console.warn('show_10676091 notice:', e);
      alert('You have seen an ad!');
      doRepair();
    });
  } else if (typeof window.showRewardedAd === 'function') {
    window.showRewardedAd(doRepair);
  } else {
    alert('You have seen an ad!');
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

  const webBadge = document.getElementById('websiteBadgeCount');
  if (webBadge) webBadge.textContent = activeTasks.length;

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
      <div class="web-task-card-minimal web-sponsor-card ${isOpened ? 'is-unlocked' : ''}" onclick="openWebsiteTaskPopup('${task.id}')" role="button" tabindex="0">
        <div class="web-task-card-left">
          <div class="web-task-icon-box ${isOpened ? 'unlocked' : 'locked'}">
            <span>${isOpened ? '🔓' : '🌐'}</span>
          </div>
          <div class="web-task-text-col">
            <div class="flex items-center gap-1.5">
              <span class="web-task-card-title">${task.title}</span>
              <span class="web-sponsor-tag">${task.tagText || 'SPONSOR'}</span>
            </div>
          </div>
        </div>
        <div class="web-task-right">
          <div class="web-task-reward-pill web-reward">
            <span>💎 +${rewardDiamonds}</span>
          </div>
          <button class="web-task-action-btn ${isOpened ? 'verify-btn' : 'unlock-btn'}" type="button">
            <span>${isOpened ? 'Enter PIN ➔' : 'Unlock 🪙'}</span>
          </button>
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

  // Rewarded interstitial
  if (typeof show_10676091 === 'function') {
    show_10676091().then(() => {
      // You need to add your user reward function here, which will be executed after the user watches the ad.
      // For more details, please refer to the detailed instructions.
      alert('You have seen an ad!');
      doClaim();
    }).catch((e) => {
      console.warn('show_10676091 notice:', e);
      alert('You have seen an ad!');
      doClaim();
    });
  } else if (typeof window.showRewardedAd === 'function') {
    window.showRewardedAd(doClaim);
  } else {
    alert('You have seen an ad!');
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
  renderTelegramTasks();
  syncTasksFromServerIfEmpty();
});

function syncTasksFromServerIfEmpty() {
  fetch('/api/tasks')
    .then(r => r.json())
    .then(data => {
      if (data && data.ok) {
        let changed = false;
        if (Array.isArray(data.telegramTasks) && (window.cloudTelegramTasks === undefined || window.cloudTelegramTasks === null)) {
          window.cloudTelegramTasks = data.telegramTasks;
          try {
            localStorage.setItem('ENERGY_TAP_TELEGRAM_TASKS_CONFIG_V1', JSON.stringify(data.telegramTasks));
            localStorage.setItem('ENERGY_TAP_TG_TASKS', JSON.stringify(data.telegramTasks));
          } catch(e){}
          changed = true;
        }
        if (Array.isArray(data.websiteTasks) && (window.cloudWebsiteTasks === undefined || window.cloudWebsiteTasks === null)) {
          window.cloudWebsiteTasks = data.websiteTasks;
          try {
            localStorage.setItem('ENERGY_TAP_WEBSITE_TASKS_CONFIG_V1', JSON.stringify(data.websiteTasks));
            localStorage.setItem('ENERGY_TAP_WEB_TASKS', JSON.stringify(data.websiteTasks));
          } catch(e){}
          changed = true;
        }
        if (changed) {
          renderTelegramTasks();
          renderWebsiteTasks();
        }
      }
    })
    .catch(() => {});
}

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

