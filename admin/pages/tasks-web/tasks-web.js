/* ==========================================================================
   PAGE: TASKS (TELEGRAM & WEBSITE TASK ADDER) - pages/tasks-web/tasks-web.js
   ========================================================================== */

const TG_STORAGE_KEY = 'ENERGY_TAP_TG_TASKS';
const WEB_STORAGE_KEY = 'ENERGY_TAP_WEB_TASKS';
const MONTHLY_STORAGE_KEY = 'ENERGY_TAP_MONTHLY_TASKS_CONFIG_V1';

const DEFAULT_TG_TASKS = [];
const DEFAULT_WEB_TASKS = [];
const DEFAULT_MONTHLY_TASKS = [
  { id: 'd1', number: 1, title: '1. Tap 2,000 Times', target: 2000, rewardCards: 1, type: 'tap', tagText: 'MONTHLY QUEST', desc: 'Tap the central orb 2,000 times on the Home page to win 1 Scratch Card', disabled: false },
  { id: 'd2', number: 2, title: '2. Tap 5,000 Times', target: 5000, rewardCards: 1, type: 'tap', tagText: 'MONTHLY QUEST', desc: 'Reach 5,000 total taps on the central orb to win 1 Scratch Card', disabled: false },
  { id: 'd3', number: 3, title: '3. Tap 10,000 Times', target: 10000, rewardCards: 1, type: 'tap', tagText: 'MONTHLY QUEST', desc: 'Harvest 10,000 taps on the central orb to win 1 Scratch Card', disabled: false },
  { id: 'd_fuel_green', number: 4, title: '4. Use 2,000 Green Fuel', target: 2000, rewardCards: 1, type: 'fuel_green', tagText: 'MONTHLY QUEST', desc: 'Consume 2,000 Green Fuel cells in the Energy Generator to win 1 Scratch Card', disabled: false },
  { id: 'd_fuel_yellow_1', number: 5, title: '5. Use 1,000 Yellow Fuel', target: 1000, rewardCards: 1, type: 'fuel_yellow_1', tagText: 'MONTHLY QUEST', desc: 'Consume 1,000 Yellow Fuel cells in the Energy Generator to win 1 Scratch Card', disabled: false },
  { id: 'd_fuel_orange_1', number: 6, title: '6. Use 500 Orange Fuel', target: 500, rewardCards: 1, type: 'fuel_orange', tagText: 'MONTHLY QUEST', desc: 'Consume 500 Orange Fuel cells in the Energy Generator to win 1 Scratch Card', disabled: false },
  { id: 'd_fuel_red_1', number: 7, title: '7. Use 250 Red Fuel', target: 250, rewardCards: 1, type: 'fuel_red', tagText: 'MONTHLY QUEST', desc: 'Burn 250 high-octane Red Fuel cells in the Energy Generator to win 1 Scratch Card', disabled: false },
  { id: 'd_fuel_pink_1', number: 8, title: '8. Use 100 Pink Fuel', target: 100, rewardCards: 1, type: 'fuel_pink', tagText: 'MONTHLY QUEST', desc: 'Burn 100 exotic Pink Fuel cells in the Energy Generator to win 1 Scratch Card', disabled: false },
  { id: 'd_fuel_purple_1', number: 9, title: '9. Use 50 Purple Fuel', target: 50, rewardCards: 1, type: 'fuel_purple', tagText: 'MONTHLY QUEST', desc: 'Deploy 50 rare Purple Fuel cells into the Energy Generator to win 1 Scratch Card', disabled: false },
  { id: 'd_spin_100', number: 10, title: '10. Spin lucky wheel 100 in 30 days', target: 100, rewardCards: 1, type: 'spin', tagText: 'MONTHLY QUEST', desc: 'Spin the Lucky Wheel 100 times in 30 days to win 1 Scratch Card', disabled: false },
  { id: 'd_chest_100', number: 11, title: '11. Chest open 100 in 30 days', target: 100, rewardCards: 1, type: 'chest', tagText: 'MONTHLY QUEST', desc: 'Open 100 Treasure Chests in 30 days to win 1 Scratch Card', disabled: false },
  { id: 'd_chest_250', number: 12, title: '12. Chest open 250 in 30 days', target: 250, rewardCards: 1, type: 'chest', tagText: 'MONTHLY QUEST', desc: 'Open 250 Treasure Chests in 30 days to win 1 Scratch Card', disabled: false },
  { id: 'd_scratch_200', number: 13, title: '13. Card scratch 200 in 30 days', target: 200, rewardCards: 1, type: 'scratch', tagText: 'MONTHLY QUEST', desc: 'Play and scratch 200 Scratch Cards in 30 days to win 1 Scratch Card', disabled: false },
  { id: 'd_egg_300', number: 14, title: '14. Egg coin use in egg game 300 in 30 days', target: 300, rewardCards: 1, type: 'egg', tagText: 'MONTHLY QUEST', desc: 'Use 300 Egg Coins in Cyber Egg Hatchery in 30 days to win 1 Scratch Card', disabled: false }
];

// Initialize on events
window.addEventListener('websiteTasksUpdated', () => {
  renderWebsiteTasksUI();
});

window.addEventListener('telegramTasksUpdated', () => {
  renderTelegramTasksUI();
});

window.addEventListener('monthlyTasksUpdated', () => {
  renderMonthlyTasksUI();
});

document.addEventListener('DOMContentLoaded', () => {
  renderTelegramTasksUI();
  renderWebsiteTasksUI();
  renderMonthlyTasksUI();
});

// Switch Subtabs
function switchAdminTaskSubtab(tabName) {
  const tabs = ['telegram', 'website', 'daily'];
  tabs.forEach(t => {
    const btn = document.getElementById('btnSubtab' + t.charAt(0).toUpperCase() + t.slice(1));
    const content = document.getElementById('subtabContent' + t.charAt(0).toUpperCase() + t.slice(1));
    if (btn) btn.classList.toggle('active', t === tabName);
    if (content) {
      content.style.display = (t === tabName) ? 'block' : 'none';
      content.classList.toggle('active', t === tabName);
    }
  });
}

/* ==========================================================================
   TELEGRAM TASKS LOGIC (REWARD: FIXED TO SCRATCH CARDS 🎴, NO DESCRIPTION)
   ========================================================================== */

function getTelegramTasks() {
  if (window.adminState && window.adminState.telegramTasks && Array.isArray(window.adminState.telegramTasks)) {
    return window.adminState.telegramTasks;
  }
  try {
    const cached = localStorage.getItem(TG_STORAGE_KEY);
    if (cached !== null) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        window.adminState.telegramTasks = parsed;
        return parsed;
      }
    }
  } catch (e) {}
  return [];
}

let tgAutoSaveTimer = null;
function onTgTaskInput(taskId) {
  clearTimeout(tgAutoSaveTimer);
  tgAutoSaveTimer = setTimeout(() => {
    performSaveTelegramTasksToFirebase(true);
  }, 500);
}
window.onTgTaskInput = onTgTaskInput;

function getTaskCompletionStats(taskType, taskId) {
  const users = (window.adminState && window.adminState.users) ? window.adminState.users : [];
  let count = 0;
  users.forEach(u => {
    const raw = u.raw || {};
    const tasksState = raw.tasksState || {};
    if (taskType === 'telegram') {
      if (tasksState.claimedTelegram && tasksState.claimedTelegram[taskId]) count++;
    } else {
      if (tasksState.claimedWebsite && tasksState.claimedWebsite[taskId]) count++;
    }
  });
  return count;
}
window.getTaskCompletionStats = getTaskCompletionStats;

function toggleTaskStatus(taskType, taskId) {
  const isTg = taskType === 'telegram';
  const isMonthly = taskType === 'monthly';
  const tasks = isTg ? getTelegramTasks() : (isMonthly ? getMonthlyTasks() : getWebsiteTasks());
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  task.disabled = !task.disabled;
  if (isTg) {
    performSaveTelegramTasksToFirebase(false);
    renderTelegramTasksUI();
  } else if (isMonthly) {
    performSaveMonthlyTasksToFirebase(false);
    renderMonthlyTasksUI();
  } else {
    performSaveWebsiteTasksToFirebase(false);
    renderWebsiteTasksUI();
  }
}
window.toggleTaskStatus = toggleTaskStatus;

function renderTelegramTasksUI() {
  const container = document.getElementById('telegramTasksContainer');
  const badge = document.getElementById('adminTgTasksCountBadge');
  if (!container) return;

  const tasks = getTelegramTasks();
  if (badge) badge.textContent = tasks.length;

  if (tasks.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; background: rgba(4, 10, 26, 0.5); border-radius: 12px; border: 1px dashed rgba(25, 55, 120, 0.5);">
        <p style="color: #94a3b8; font-size: 14px; margin-bottom: 12px;">No Telegram tasks found in Firebase.</p>
        <button onclick="openNewTelegramTaskModal()" class="btn-primary">➕ Add Your First Telegram Task</button>
      </div>
    `;
    return;
  }

  let html = '';
  tasks.forEach((task, idx) => {
    const isBot = task.iconType === 'bot' || (task.tagText && task.tagText.includes('BOT'));
    const typeLabel = isBot ? '🤖 BOT' : '✈️ CHANNEL';
    const tag = task.tagText || (isBot ? 'TELEGRAM BOT' : 'TELEGRAM CHANNEL');
    const coinsVal = Number(task.coins !== undefined ? task.coins : (task.rewardCoins !== undefined ? task.rewardCoins : 100));
    const completions = getTaskCompletionStats('telegram', task.id);
    const isDisabled = task.disabled === true;

    html += `
      <div class="task-item-card" id="tgCard_${task.id}" style="${isDisabled ? 'opacity: 0.7; border-color: rgba(239, 68, 68, 0.4);' : ''}">
        <div class="task-card-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-weight: 800; color: #38bdf8; font-size: 13px;">${typeLabel} #${idx + 1}</span>
            <span style="font-size: 10px; background: ${isDisabled ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 189, 248, 0.15)'}; color: ${isDisabled ? '#f87171' : '#38bdf8'}; padding: 2px 6px; border-radius: 4px; font-weight: 700;">
              ${isDisabled ? 'DISABLED' : tag}
            </span>
            <span style="font-size: 10.5px; color: #10b981; font-weight: 700; font-family: 'JetBrains Mono', monospace;" title="Number of players who completed this task">
              👥 ${completions} Done
            </span>
          </div>
          <div style="display: flex; gap: 6px; align-items: center;">
            <button type="button" onclick="toggleTaskStatus('telegram', '${task.id}')" class="btn-dash-outline" style="padding: 2px 8px; font-size: 10.5px; border-color: ${isDisabled ? '#10b981' : '#f59e0b'}; color: ${isDisabled ? '#10b981' : '#f59e0b'};">
              ${isDisabled ? 'Enable' : 'Disable'}
            </button>
            <button type="button" onclick="removeTelegramTask('${task.id}')" title="Delete Task" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; border-radius: 6px; padding: 2px 8px; font-size: 10.5px; cursor: pointer;">🗑️</button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Task Title</label>
          <input type="text" id="tgTitle_${task.id}" value="${task.title || ''}" oninput="onTgTaskInput('${task.id}')" class="form-input">
        </div>

        <div class="form-group">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <label class="form-label">Telegram URL</label>
            <a href="${task.url || '#'}" target="_blank" style="color: #38bdf8; font-size: 10px; text-decoration: none; font-weight: 700;">↗️ Test Link</a>
          </div>
          <input type="url" id="tgUrl_${task.id}" value="${task.url || ''}" oninput="onTgTaskInput('${task.id}')" class="form-input" style="color: #38bdf8; font-family: 'JetBrains Mono', monospace; font-size: 12px;">
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="form-group">
            <label class="form-label">Reward (Coins 🪙)</label>
            <input type="number" id="tgRewardCoins_${task.id}" value="${coinsVal}" min="1" max="100000" oninput="onTgTaskInput('${task.id}')" class="form-input" style="color: #f59e0b; font-weight: 800; text-align: center; font-size: 14px;">
          </div>
          <div class="form-group">
            <label class="form-label">Button Text</label>
            <input type="text" id="tgBtnText_${task.id}" value="${task.btnText || 'Join'}" oninput="onTgTaskInput('${task.id}')" class="form-input" style="text-align: center;">
          </div>
        </div>
      </div>
    `;
  });

  // Append big dashed Adder card
  html += `
    <div class="task-item-card" onclick="openNewTelegramTaskModal()" style="border: 2px dashed rgba(56, 189, 248, 0.35); background: rgba(14, 165, 233, 0.04); display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 200px; cursor: pointer; text-align: center; gap: 10px; transition: all 0.2s ease;">
      <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(56, 189, 248, 0.15); display: flex; align-items: center; justify-content: center; font-size: 22px; color: #38bdf8;">➕</div>
      <strong style="color: #38bdf8; font-size: 14px;">Add New Telegram Task</strong>
      <span style="color: #94a3b8; font-size: 11px;">Fixed Reward: 100 Coins 🪙</span>
    </div>
  `;

  container.innerHTML = html;
}


function openNewTelegramTaskModal() {
  const modal = document.getElementById('newTelegramTaskModal') || document.getElementById('addTgTaskModal');
  if (modal) {
    modal.style.display = 'flex';
    modal.classList.add('open');
  }
}

function closeNewTelegramTaskModal() {
  const modal = document.getElementById('newTelegramTaskModal') || document.getElementById('addTgTaskModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('open');
  }
}

function confirmAddTelegramTask() {
  const title = (document.getElementById('inpNewTgTitle')?.value || '').trim();
  const url = (document.getElementById('inpNewTgLink')?.value || '').trim();
  const rewardCoins = Number(document.getElementById('inpNewTgCoins')?.value || document.getElementById('inpNewTgCards')?.value) || 100;

  if (!title) {
    alert('Please enter a task title!');
    return;
  }
  if (!url || !url.includes('t.me')) {
    alert('Please enter a valid Telegram URL (e.g. https://t.me/channel_name)!');
    return;
  }

  const isBot = url.toLowerCase().includes('bot');
  const newId = 'tg_' + Date.now().toString(36);
  const newTask = {
    id: newId,
    title,
    url,
    iconType: isBot ? 'bot' : 'plane',
    coins: rewardCoins,
    rewardCoins: rewardCoins,
    rewardText: `${rewardCoins.toLocaleString()} Coins 🪙`,
    btnText: isBot ? 'Join Bot' : 'Join Channel',
    tagText: isBot ? 'TELEGRAM BOT' : 'TELEGRAM CHANNEL'
  };

  const current = [...getTelegramTasks(), newTask];
  window.adminState.telegramTasks = current;
  try { localStorage.setItem(TG_STORAGE_KEY, JSON.stringify(current)); } catch(e){}

  closeNewTelegramTaskModal();
  renderTelegramTasksUI();
  performSaveTelegramTasksToFirebase(false);

  // Clear inputs
  if (document.getElementById('inpNewTgTitle')) document.getElementById('inpNewTgTitle').value = '';
  if (document.getElementById('inpNewTgLink')) document.getElementById('inpNewTgLink').value = '';
  if (document.getElementById('inpNewTgCoins')) document.getElementById('inpNewTgCoins').value = '100';
  if (document.getElementById('inpNewTgCards')) document.getElementById('inpNewTgCards').value = '100';
}

function removeTelegramTask(id) {
  if (!confirm('Are you sure you want to remove this Telegram task?')) return;
  const current = getTelegramTasks().filter(t => t.id !== id);
  window.adminState.telegramTasks = current;
  try {
    localStorage.setItem(TG_STORAGE_KEY, JSON.stringify(current));
    localStorage.setItem('ENERGY_TAP_TELEGRAM_TASKS_CONFIG_V1', JSON.stringify(current));
  } catch(e){}
  renderTelegramTasksUI();
  performSaveTelegramTasksToFirebase(true);
}

function saveTelegramTasksToFirebase() {
  performSaveTelegramTasksToFirebase(false);
}

function performSaveTelegramTasksToFirebase(isSilent) {
  const currentTasks = getTelegramTasks();
  const updated = currentTasks.map(t => {
    const title = document.getElementById(`tgTitle_${t.id}`)?.value.trim() || t.title;
    const url = document.getElementById(`tgUrl_${t.id}`)?.value.trim() || t.url;
    const coins = Number(document.getElementById(`tgRewardCoins_${t.id}`)?.value || document.getElementById(`tgRewardCards_${t.id}`)?.value) || t.coins || t.rewardCoins || 100;
    const btnText = document.getElementById(`tgBtnText_${t.id}`)?.value.trim() || t.btnText || 'Join';

    return {
      ...t,
      title,
      url,
      coins,
      rewardCoins: coins,
      rewardText: `${coins.toLocaleString()} Coins 🪙`,
      btnText
    };
  });

  window.adminState.telegramTasks = updated;
  try {
    localStorage.setItem(TG_STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem('ENERGY_TAP_TELEGRAM_TASKS_CONFIG_V1', JSON.stringify(updated));
  } catch(e){}

  // Sync to backend REST API
  fetch('/api/tasks/telegram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updated)
  }).catch(() => {});

  const db = window.getDb ? window.getDb() : null;
  if (db) {
    db.ref('/telegram_tasks_config').set(updated)
      .then(() => {
        if (!isSilent) alert('✅ Telegram tasks configuration saved to Firebase (/telegram_tasks_config)!');
      })
      .catch(err => {
        if (!isSilent) alert('Firebase error: ' + err.message);
      });
  }
}

function resetDefaultTelegramTasks() {
  // Deprecated: Fixed default data removed. Tasks are purely managed from Firebase.
}

/* ==========================================================================
   WEBSITE TASKS LOGIC (WITH EDITABLE QUEST DESCRIPTION TAB & PIN CODE)
   ========================================================================== */

function getWebsiteTasks() {
  if (window.adminState && Array.isArray(window.adminState.websiteTasks)) {
    return window.adminState.websiteTasks;
  }
  try {
    const cached = localStorage.getItem(WEB_STORAGE_KEY) || localStorage.getItem('ENERGY_TAP_WEBSITE_TASKS_CONFIG_V1');
    if (cached !== null) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        if (window.adminState) window.adminState.websiteTasks = parsed;
        return parsed;
      }
    }
  } catch (e) {}
  if (window.adminState) {
    window.adminState.websiteTasks = [];
  }
  return [];
}

let webAutoSaveTimer = null;
function onWebTaskInput(taskId) {
  clearTimeout(webAutoSaveTimer);
  webAutoSaveTimer = setTimeout(() => {
    performSaveWebsiteTasksToFirebase(true);
  }, 500);
}
window.onWebTaskInput = onWebTaskInput;

function renderWebsiteTasksUI() {
  const container = document.getElementById('websiteTasksContainer');
  const badge = document.getElementById('adminWebTasksCountBadge');
  if (!container) return;

  const tasks = getWebsiteTasks();
  if (badge) badge.textContent = tasks.length;

  if (tasks.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; background: rgba(4, 10, 26, 0.5); border-radius: 12px; border: 1px dashed rgba(25, 55, 120, 0.5);">
        <p style="color: #94a3b8; font-size: 14px; margin-bottom: 12px;">No Website quests found.</p>
        <button onclick="openNewWebsiteTaskModal()" class="btn-primary">➕ Add Your First Website Quest</button>
      </div>
    `;
    return;
  }

  let html = '';
  tasks.forEach((task, idx) => {
    const completions = getTaskCompletionStats('website', task.id);
    const isDisabled = task.disabled === true;

    html += `
      <div class="task-item-card" id="webCard_${task.id}" style="${isDisabled ? 'opacity: 0.7; border-color: rgba(239, 68, 68, 0.4);' : ''}">
        <div class="task-card-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-weight: 800; color: #2dd4bf; font-size: 13px;">🌐 QUEST #${idx + 1}</span>
            <span style="font-size: 10px; background: ${isDisabled ? 'rgba(239, 68, 68, 0.15)' : 'rgba(45, 212, 191, 0.15)'}; color: ${isDisabled ? '#f87171' : '#2dd4bf'}; padding: 2px 6px; border-radius: 4px; font-weight: 700;">
              ${isDisabled ? 'DISABLED' : (task.tag || 'SPONSOR QUEST')}
            </span>
            <span style="font-size: 10.5px; color: #10b981; font-weight: 700; font-family: 'JetBrains Mono', monospace;" title="Number of players who completed this quest">
              👥 ${completions} Done
            </span>
          </div>
          <div style="display: flex; gap: 6px; align-items: center;">
            <button type="button" onclick="toggleTaskStatus('website', '${task.id}')" class="btn-dash-outline" style="padding: 2px 8px; font-size: 10.5px; border-color: ${isDisabled ? '#10b981' : '#f59e0b'}; color: ${isDisabled ? '#10b981' : '#f59e0b'};">
              ${isDisabled ? 'Enable' : 'Disable'}
            </button>
            <button type="button" onclick="removeWebsiteTask('${task.id}')" title="Delete Quest" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; border-radius: 6px; padding: 2px 8px; font-size: 10.5px; cursor: pointer;">🗑️</button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Quest Title</label>
          <input type="text" id="wtTitle_${task.id}" value="${task.title || ''}" oninput="onWebTaskInput('${task.id}')" class="form-input">
        </div>

        <div class="form-group">
          <label class="form-label">Quest Description</label>
          <textarea id="wtDesc_${task.id}" rows="2" oninput="onWebTaskInput('${task.id}')" placeholder="Describe instructions and how to verify..." class="form-input" style="font-size: 12px; color: #cbd5e1; line-height: 1.4;">${task.desc || task.notes || ''}</textarea>
        </div>

        <div class="form-group">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <label class="form-label">Destination URL</label>
            <a href="${task.url || '#'}" target="_blank" style="color: #38bdf8; font-size: 10px; text-decoration: none; font-weight: 700;">↗️ Preview Site</a>
          </div>
          <input type="url" id="wtUrl_${task.id}" value="${task.url || ''}" oninput="onWebTaskInput('${task.id}')" class="form-input" style="color: #38bdf8; font-family: 'JetBrains Mono', monospace; font-size: 12px;">
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="form-group">
            <div style="display: flex; justify-content: space-between;">
              <label class="form-label">4-Digit PIN</label>
              <button type="button" onclick="genPin('${task.id}')" style="background: none; border: none; color: #38bdf8; font-size: 10px; font-weight: 800; cursor: pointer;">🎲 Gen</button>
            </div>
            <input type="text" maxlength="4" id="wtCode_${task.id}" value="${task.code || '1234'}" oninput="onWebTaskInput('${task.id}')" class="form-input" style="font-family: 'JetBrains Mono', monospace; font-size: 14px; text-align: center; color: #fbbf24; font-weight: 800; letter-spacing: 2px;">
          </div>

          <div class="form-group">
            <label class="form-label">Timer (Seconds ⏱️)</label>
            <input type="number" id="wtTimer_${task.id}" value="${task.timer || task.duration || 15}" min="5" max="300" oninput="onWebTaskInput('${task.id}')" class="form-input" style="color: #38bdf8; font-weight: 800; text-align: center;">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="form-group">
            <label class="form-label">Prize (Diamonds 💎)</label>
            <input type="number" id="wtDiamonds_${task.id}" value="${task.diamondReward || 100}" oninput="onWebTaskInput('${task.id}')" class="form-input" style="color: #22d3ee; font-weight: 800; text-align: center;">
          </div>
          <div class="form-group">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <label class="form-label">Entry Cost (Coins 🪙)</label>
              <div style="display: flex; gap: 4px;">
                <button type="button" onclick="document.getElementById('wtCost_${task.id}').value=1000; onWebTaskInput('${task.id}');" style="padding: 1px 5px; font-size: 10px; font-weight: 700; background: #fef3c7; color: #b45309; border: 1px solid #fcd34d; border-radius: 4px; cursor: pointer;">1K</button>
                <button type="button" onclick="document.getElementById('wtCost_${task.id}').value=10000; onWebTaskInput('${task.id}');" style="padding: 1px 5px; font-size: 10px; font-weight: 700; background: #fef3c7; color: #b45309; border: 1px solid #fcd34d; border-radius: 4px; cursor: pointer;">10K</button>
              </div>
            </div>
            <input type="number" id="wtCost_${task.id}" value="${task.costCoins !== undefined ? task.costCoins : 1000}" oninput="onWebTaskInput('${task.id}')" class="form-input" style="color: #facc15; font-weight: 800; text-align: center;">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Tag Badge</label>
          <input type="text" id="wtTag_${task.id}" value="${task.tag || 'SPONSOR QUEST'}" oninput="onWebTaskInput('${task.id}')" class="form-input" style="text-align: center; font-size: 11px;">
        </div>
      </div>
    `;
  });

  // Append big dashed Adder card
  html += `
    <div class="task-item-card" onclick="openNewWebsiteTaskModal()" style="border: 2px dashed rgba(45, 212, 191, 0.35); background: rgba(45, 212, 191, 0.04); display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 220px; cursor: pointer; text-align: center; gap: 10px; transition: all 0.2s ease;">
      <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(45, 212, 191, 0.15); display: flex; align-items: center; justify-content: center; font-size: 22px; color: #2dd4bf;">➕</div>
      <strong style="color: #2dd4bf; font-size: 14px;">Add New Website Quest</strong>
      <span style="color: #94a3b8; font-size: 11px;">Configure Sponsor Secret PIN, Description &amp; Timer</span>
    </div>
  `;

  container.innerHTML = html;
}

function genPin(taskId) {
  const pin = Math.floor(1000 + Math.random() * 9000).toString();
  const el = document.getElementById(`wtCode_${taskId}`);
  if (el) {
    el.value = pin;
    onWebTaskInput(taskId);
  }
}

function genNewWebPin() {
  const pin = Math.floor(1000 + Math.random() * 9000).toString();
  const el = document.getElementById('inpNewWebPin') || document.getElementById('newWebCode');
  if (el) el.value = pin;
}

function openNewWebsiteTaskModal() {
  const modal = document.getElementById('newWebsiteTaskModal') || document.getElementById('addWebTaskModal');
  if (modal) {
    modal.style.display = 'flex';
    modal.classList.add('open');
  }
}

function closeNewWebsiteTaskModal() {
  const modal = document.getElementById('newWebsiteTaskModal') || document.getElementById('addWebTaskModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('open');
  }
}

function confirmAddWebsiteTask() {
  const title = (document.getElementById('inpNewWebTitle')?.value || '').trim();
  const desc = (document.getElementById('inpNewWebDesc')?.value || '').trim();
  const url = (document.getElementById('inpNewWebUrl')?.value || '').trim();
  const code = (document.getElementById('inpNewWebPin')?.value || '4829').trim();
  const timer = Number(document.getElementById('inpNewWebTimer')?.value) || 15;
  const diamonds = Number(document.getElementById('inpNewWebDiamonds')?.value) || 50;
  const cost = Number(document.getElementById('inpNewWebCoins')?.value) || 10000;
  const tag = (document.getElementById('inpNewWebTag')?.value || 'SPONSOR QUEST').trim();

  if (!title) {
    alert('Please enter a quest title!');
    return;
  }
  if (!url || !url.startsWith('http')) {
    alert('Please enter a valid URL starting with http:// or https://');
    return;
  }

  const newId = 'web_' + Date.now().toString(36);
  const newTask = {
    id: newId,
    title,
    desc: desc || `Unlock with ${cost.toLocaleString()} Coins, visit official portal for ${timer}s, and enter 4-digit secret PIN to win ${diamonds} Diamonds 💎`,
    url,
    code,
    timer: timer,
    duration: timer,
    costCoins: cost,
    diamondReward: diamonds,
    tag,
    rewardText: `${diamonds} Diamonds 💎`,
    notes: `Spend ${cost.toLocaleString()} Coins to open this website. Browse for ${timer} seconds to find the hidden 4-digit PIN code and claim ${diamonds} Diamonds!`,
    tip: 'Tip: Look carefully at the banner or footer on the webpage for your 4-digit PIN code.',
    iconType: 'globe',
    btnText: 'Unlock & Visit'
  };

  const current = [...getWebsiteTasks(), newTask];
  window.adminState.websiteTasks = current;
  try { localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(current)); } catch(e){}

  closeNewWebsiteTaskModal();
  renderWebsiteTasksUI();
  performSaveWebsiteTasksToFirebase(false);

  // Reset inputs
  if (document.getElementById('inpNewWebTitle')) document.getElementById('inpNewWebTitle').value = '';
  if (document.getElementById('inpNewWebDesc')) document.getElementById('inpNewWebDesc').value = '';
  if (document.getElementById('inpNewWebUrl')) document.getElementById('inpNewWebUrl').value = '';
  if (document.getElementById('inpNewWebPin')) document.getElementById('inpNewWebPin').value = '';
  if (document.getElementById('inpNewWebTimer')) document.getElementById('inpNewWebTimer').value = '15';
}

function removeWebsiteTask(id) {
  if (!confirm('Are you sure you want to remove this Website quest?')) return;
  const current = getWebsiteTasks().filter(t => t.id !== id);
  window.adminState.websiteTasks = current;
  try {
    localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(current));
    localStorage.setItem('ENERGY_TAP_WEBSITE_TASKS_CONFIG_V1', JSON.stringify(current));
  } catch(e){}
  renderWebsiteTasksUI();
  performSaveWebsiteTasksToFirebase(true);
}

function saveWebsiteTasksToFirebase() {
  performSaveWebsiteTasksToFirebase(false);
}

function performSaveWebsiteTasksToFirebase(isSilent) {
  const currentTasks = getWebsiteTasks();
  const updated = currentTasks.map(t => {
    const titleEl = document.getElementById(`wtTitle_${t.id}`);
    const descEl = document.getElementById(`wtDesc_${t.id}`);
    const urlEl = document.getElementById(`wtUrl_${t.id}`);
    const codeEl = document.getElementById(`wtCode_${t.id}`);
    const timerEl = document.getElementById(`wtTimer_${t.id}`);
    const diamondsEl = document.getElementById(`wtDiamonds_${t.id}`);
    const costEl = document.getElementById(`wtCost_${t.id}`);
    const tagEl = document.getElementById(`wtTag_${t.id}`);

    const title = titleEl ? titleEl.value.trim() : (t.title || '');
    const desc = descEl ? descEl.value.trim() : (t.desc || t.notes || '');
    const url = urlEl ? urlEl.value.trim() : (t.url || '');
    const code = codeEl ? codeEl.value.trim() : (t.code || '1234');
    const timer = timerEl ? (Number(timerEl.value) || 15) : (Number(t.timer || t.duration) || 15);
    const diamonds = diamondsEl ? (Number(diamondsEl.value) || 100) : (Number(t.diamondReward) || 100);
    const cost = costEl ? (Number(costEl.value) || 1000) : (Number(t.costCoins) || 1000);
    const tag = tagEl ? tagEl.value.trim() : (t.tag || 'SPONSOR QUEST');

    return {
      ...t,
      title: title || t.title,
      desc,
      url: url || t.url,
      code: code || '1234',
      timer,
      duration: timer,
      diamondReward: diamonds,
      costCoins: cost,
      tag,
      rewardText: `${diamonds} Diamonds 💎`,
      notes: desc || `Spend ${cost.toLocaleString()} Coins to open this website.`
    };
  });

  window.adminState.websiteTasks = updated;
  try {
    localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem('ENERGY_TAP_WEBSITE_TASKS_CONFIG_V1', JSON.stringify(updated));
  } catch(e){}

  // Sync to backend REST API
  fetch('/api/tasks/website', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updated)
  }).catch(() => {});

  const db = window.getDb ? window.getDb() : null;
  if (db) {
    db.ref('/website_tasks_config').set(updated)
      .then(() => {
        if (!isSilent && typeof showAdminToast === 'function') {
          showAdminToast('Website quests saved to Firebase!', 'success');
        } else if (!isSilent) {
          alert('✅ Website tasks configuration saved to Firebase (/website_tasks_config)!');
        }
      })
      .catch(err => {
        if (!isSilent) alert('Firebase error: ' + err.message);
      });
  }
}

function resetDefaultWebsiteTasks() {
  // Deprecated: Fixed default data removed. Tasks are purely managed from Firebase.
}

// ==========================================================================
// 30-DAY MONTHLY COMPETITION FIREBASE CONTROLLER
// ==========================================================================
function renderMonthlyCompetitionUI() {
  const cycleEl = document.getElementById('adminMonthlyCycleNum');
  const countdownEl = document.getElementById('adminMonthlyCountdown');
  const endDateEl = document.getElementById('adminMonthlyEndDate');
  const progressBar = document.getElementById('adminMonthlyProgressBar');
  const progressText = document.getElementById('adminMonthlyProgressText');
  const startEl = document.getElementById('adminMonthlyCycleStartDate');
  const endFootEl = document.getElementById('adminMonthlyCycleEndDateFoot');

  const comp = window.adminState.monthlyCompetition || {
    cycleNumber: 1,
    startTime: Date.now(),
    endTime: Date.now() + 30 * 86400 * 1000
  };

  if (cycleEl) cycleEl.textContent = `Cycle #${comp.cycleNumber || 1}`;

  const now = Date.now();
  const startTime = comp.startTime || (now - 86400 * 1000);
  const endTime = comp.endTime || (now + 29 * 86400 * 1000);
  const totalDuration = Math.max(1000, endTime - startTime);
  const elapsedMs = Math.max(0, Math.min(totalDuration, now - startTime));
  const remainingMs = Math.max(0, endTime - now);

  const totalSecs = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  if (countdownEl) {
    countdownEl.textContent = `${days}d ${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
  }

  const endD = new Date(endTime);
  const startD = new Date(startTime);

  if (endDateEl) {
    endDateEl.textContent = endD.toLocaleDateString() + ' ' + endD.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (startEl) {
    startEl.textContent = `Started: ${startD.toLocaleDateString()}`;
  }
  if (endFootEl) {
    endFootEl.textContent = `Ends: ${endD.toLocaleDateString()}`;
  }

  // Calculate live progress percentage and elapsed days
  const elapsedPct = Math.min(100, Math.max(0, (elapsedMs / totalDuration) * 100));
  const elapsedDays = Math.min(30, Math.max(0, Math.floor(elapsedMs / (86400 * 1000))));

  if (progressBar) {
    progressBar.style.width = `${elapsedPct.toFixed(1)}%`;
  }
  if (progressText) {
    progressText.textContent = `Day ${elapsedDays} of 30 (${elapsedPct.toFixed(1)}%)`;
  }
}

function restartMonthlyCompetitionInFirebase() {
  const executeRestart = () => {
    if (!confirm('⚠️ Are you sure you want to START A NEW 30-DAY COMPETITION CYCLE?\n\nThis will trigger a full reset of all active players monthly quest claims and competition stats in Firebase backend!')) {
      return;
    }

    const now = Date.now();
    const currentCycle = (window.adminState.monthlyCompetition && window.adminState.monthlyCompetition.cycleNumber) || 1;
    const newCycle = currentCycle + 1;
    const newEndTime = now + (30 * 24 * 60 * 60 * 1000);

    const newCompData = {
      title: '30-Day Monthly Task Competition',
      cycleDays: 30,
      cycleNumber: newCycle,
      startTime: now,
      endTime: newEndTime,
      forceResetTimestamp: now,
      lastUpdated: now
    };

    const db = window.getDb ? window.getDb() : null;
    if (!db) {
      alert('Firebase is not connected!');
      return;
    }

    db.ref('/monthly_competition').set(newCompData)
      .then(() => {
        window.adminState.monthlyCompetition = newCompData;
        renderMonthlyCompetitionUI();
        alert(`✅ New 30-Day Competition Cycle #${newCycle} successfully started in Firebase backend!\nAll connected players will automatically receive the reset.`);
      })
      .catch(err => {
        alert('Firebase error: ' + err.message);
      });
  };

  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(executeRestart);
  } else {
    executeRestart();
  }
}

function extendMonthlyCompetition(days) {
  const executeExtend = () => {
    const comp = window.adminState.monthlyCompetition || {
      cycleNumber: 1,
      startTime: Date.now(),
      endTime: Date.now() + 30 * 86400 * 1000
    };

    const extensionMs = days * 86400 * 1000;
    const currentEnd = comp.endTime > Date.now() ? comp.endTime : Date.now();
    const updatedEnd = currentEnd + extensionMs;

    const db = window.getDb ? window.getDb() : null;
    if (!db) {
      alert('Firebase is not connected!');
      return;
    }

    db.ref('/monthly_competition').update({
      endTime: updatedEnd,
      lastUpdated: Date.now()
    }).then(() => {
      if (window.adminState.monthlyCompetition) {
        window.adminState.monthlyCompetition.endTime = updatedEnd;
      }
      renderMonthlyCompetitionUI();
      alert(`✅ Competition extended by +${days} days in Firebase! New end date: ${new Date(updatedEnd).toLocaleDateString()}`);
    }).catch(err => {
      alert('Firebase error: ' + err.message);
    });
  };

  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(executeExtend);
  } else {
    executeExtend();
  }
}

window.addEventListener('monthlyCompetitionUpdated', renderMonthlyCompetitionUI);

// Live ticker for admin countdown
setInterval(() => {
  renderMonthlyCompetitionUI();
}, 1000);

/* ==========================================================================
   MONTHLY (30-DAY) TASKS & QUOTAS LOGIC (pages/tasks-web/tasks-web.js)
   ========================================================================== */

function getMonthlyTasks() {
  if (window.adminState && window.adminState.monthlyTasks && Array.isArray(window.adminState.monthlyTasks) && window.adminState.monthlyTasks.length > 0) {
    return window.adminState.monthlyTasks;
  }
  try {
    const cached = localStorage.getItem(MONTHLY_STORAGE_KEY);
    if (cached !== null) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        window.adminState.monthlyTasks = parsed;
        return parsed;
      }
    }
  } catch (e) {}
  // Default fallback baseline 14 tasks
  const defaults = JSON.parse(JSON.stringify(DEFAULT_MONTHLY_TASKS));
  window.adminState.monthlyTasks = defaults;
  return defaults;
}

let monthlyAutoSaveTimer = null;
function onMonthlyTaskInput(taskId) {
  clearTimeout(monthlyAutoSaveTimer);
  monthlyAutoSaveTimer = setTimeout(() => {
    performSaveMonthlyTasksToFirebase(true);
  }, 500);
}
window.onMonthlyTaskInput = onMonthlyTaskInput;

function renderMonthlyTasksUI() {
  const container = document.getElementById('monthlyTasksContainer');
  const badge = document.getElementById('adminMonthlyTasksCountBadge');
  if (!container) return;

  const tasks = getMonthlyTasks();
  if (badge) badge.textContent = tasks.length;

  if (tasks.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; background: rgba(4, 10, 26, 0.5); border-radius: 12px; border: 1px dashed rgba(25, 55, 120, 0.5);">
        <p style="color: #94a3b8; font-size: 14px; margin-bottom: 12px;">No Monthly Quests configured in Firebase.</p>
        <button onclick="openNewMonthlyTaskModal()" class="btn-primary">➕ Add Your First Monthly Quest</button>
      </div>
    `;
    return;
  }

  let html = '';
  tasks.forEach((task, idx) => {
    const isDisabled = task.disabled === true;
    const cardsVal = Number(task.rewardCards || task.rewardVal || 1);
    const targetVal = Number(task.target || 1000);
    const tag = task.tagText || 'MONTHLY QUEST';

    html += `
      <div class="task-item-card" id="monthlyCard_${task.id}" style="${isDisabled ? 'opacity: 0.7; border-color: rgba(239, 68, 68, 0.4);' : ''}">
        <div class="task-card-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-weight: 800; color: #38bdf8; font-size: 13px;">🏆 QUEST #${task.number || (idx + 1)}</span>
            <span style="font-size: 10px; background: ${isDisabled ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)'}; color: ${isDisabled ? '#f87171' : '#10b981'}; padding: 2px 6px; border-radius: 4px; font-weight: 700;">
              ${isDisabled ? 'DISABLED' : tag}
            </span>
          </div>
          <div style="display: flex; gap: 6px; align-items: center;">
            <button type="button" onclick="toggleTaskStatus('monthly', '${task.id}')" class="btn-dash-outline" style="padding: 2px 8px; font-size: 10.5px; border-color: ${isDisabled ? '#10b981' : '#f59e0b'}; color: ${isDisabled ? '#10b981' : '#f59e0b'};">
              ${isDisabled ? 'Enable' : 'Disable'}
            </button>
            <button type="button" onclick="removeMonthlyTask('${task.id}')" title="Delete Quest" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; border-radius: 6px; padding: 2px 8px; font-size: 10.5px; cursor: pointer;">🗑️</button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Quest Title</label>
          <input type="text" id="monthlyTitle_${task.id}" value="${task.title || ''}" oninput="onMonthlyTaskInput('${task.id}')" class="form-input">
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="form-group">
            <label class="form-label">Action Type</label>
            <select id="monthlyType_${task.id}" onchange="onMonthlyTaskInput('${task.id}')" class="form-input" style="font-weight: 700;">
              <option value="tap" ${task.type === 'tap' ? 'selected' : ''}>Taps (tap)</option>
              <option value="fuel_green" ${task.type === 'fuel_green' ? 'selected' : ''}>Green Fuel</option>
              <option value="fuel_yellow_1" ${task.type === 'fuel_yellow_1' ? 'selected' : ''}>Yellow Fuel</option>
              <option value="fuel_orange" ${task.type === 'fuel_orange' ? 'selected' : ''}>Orange Fuel</option>
              <option value="fuel_red" ${task.type === 'fuel_red' ? 'selected' : ''}>Red Fuel</option>
              <option value="fuel_pink" ${task.type === 'fuel_pink' ? 'selected' : ''}>Pink Fuel</option>
              <option value="fuel_purple" ${task.type === 'fuel_purple' ? 'selected' : ''}>Purple Fuel</option>
              <option value="spin" ${task.type === 'spin' ? 'selected' : ''}>Wheel Spins</option>
              <option value="chest" ${task.type === 'chest' ? 'selected' : ''}>Chests</option>
              <option value="scratch" ${task.type === 'scratch' ? 'selected' : ''}>Scratch Cards</option>
              <option value="egg" ${task.type === 'egg' ? 'selected' : ''}>Egg Coins</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Target Amount</label>
            <input type="number" id="monthlyTarget_${task.id}" value="${targetVal}" min="1" oninput="onMonthlyTaskInput('${task.id}')" class="form-input" style="font-weight: 800; text-align: center;">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="form-group">
            <label class="form-label">Reward (Cards 🎴)</label>
            <input type="number" id="monthlyCards_${task.id}" value="${cardsVal}" min="1" max="50" oninput="onMonthlyTaskInput('${task.id}')" class="form-input" style="color: #db2777; font-weight: 800; text-align: center; font-size: 14px;">
          </div>
          <div class="form-group">
            <label class="form-label">Tag Badge</label>
            <input type="text" id="monthlyTag_${task.id}" value="${task.tagText || 'MONTHLY QUEST'}" oninput="onMonthlyTaskInput('${task.id}')" class="form-input" style="text-align: center;">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Quest Description / Guide</label>
          <input type="text" id="monthlyDesc_${task.id}" value="${task.desc || ''}" oninput="onMonthlyTaskInput('${task.id}')" class="form-input">
        </div>
      </div>
    `;
  });

  // Append big dashed Adder card
  html += `
    <div class="task-item-card" onclick="openNewMonthlyTaskModal()" style="border: 2px dashed rgba(16, 185, 129, 0.35); background: rgba(16, 185, 129, 0.04); display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 200px; cursor: pointer; text-align: center; gap: 10px; transition: all 0.2s ease;">
      <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(16, 185, 129, 0.15); display: flex; align-items: center; justify-content: center; font-size: 22px; color: #10b981;">➕</div>
      <strong style="color: #10b981; font-size: 14px;">Add New Monthly Quest</strong>
      <span style="color: #94a3b8; font-size: 11px;">Fixed Reward: Scratch Cards 🎴</span>
    </div>
  `;

  container.innerHTML = html;
}

function openNewMonthlyTaskModal() {
  const modal = document.getElementById('newMonthlyTaskModal');
  if (modal) {
    modal.style.display = 'flex';
    modal.classList.add('open');
  }
}

function closeNewMonthlyTaskModal() {
  const modal = document.getElementById('newMonthlyTaskModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('open');
  }
}

function confirmAddMonthlyTask() {
  const title = (document.getElementById('inpNewMonthlyTitle')?.value || '').trim();
  const type = document.getElementById('inpNewMonthlyType')?.value || 'tap';
  const target = Number(document.getElementById('inpNewMonthlyTarget')?.value) || 1000;
  const rewardCards = Number(document.getElementById('inpNewMonthlyCards')?.value) || 1;
  const tagText = (document.getElementById('inpNewMonthlyTag')?.value || 'MONTHLY QUEST').trim();
  const desc = (document.getElementById('inpNewMonthlyDesc')?.value || '').trim();

  if (!title) {
    alert('Please enter a quest title!');
    return;
  }

  const tasks = getMonthlyTasks();
  const newId = 'm_' + Date.now().toString(36);
  const newTask = {
    id: newId,
    number: tasks.length + 1,
    title: title,
    type: type,
    target: target,
    rewardCards: rewardCards,
    rewardVal: rewardCards,
    rewardType: 'scratch_card',
    rewardText: `${rewardCards} Scratch Card${rewardCards > 1 ? 's' : ''}`,
    tagText: tagText,
    desc: desc || `Complete quest to win ${rewardCards} Scratch Cards 🎴`,
    notes: desc || `Complete quest during the 30-day competition cycle.`,
    tip: 'Tip: Progress towards this goal every day to earn Scratch Cards.',
    disabled: false
  };

  tasks.push(newTask);
  window.adminState.monthlyTasks = tasks;
  try {
    localStorage.setItem(MONTHLY_STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {}

  closeNewMonthlyTaskModal();
  renderMonthlyTasksUI();
  performSaveMonthlyTasksToFirebase(false);

  // Clear inputs
  const titleEl = document.getElementById('inpNewMonthlyTitle');
  if (titleEl) titleEl.value = '';
  const descEl = document.getElementById('inpNewMonthlyDesc');
  if (descEl) descEl.value = '';
}

function removeMonthlyTask(taskId) {
  if (!confirm('Are you sure you want to delete this Monthly Quest?')) return;
  const tasks = getMonthlyTasks();
  const filtered = tasks.filter(t => t.id !== taskId);
  window.adminState.monthlyTasks = filtered;
  try {
    localStorage.setItem(MONTHLY_STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {}
  renderMonthlyTasksUI();
  performSaveMonthlyTasksToFirebase(false);
}

function performSaveMonthlyTasksToFirebase(isSilent = false) {
  const tasks = getMonthlyTasks();
  tasks.forEach(task => {
    const titleEl = document.getElementById(`monthlyTitle_${task.id}`);
    const typeEl = document.getElementById(`monthlyType_${task.id}`);
    const targetEl = document.getElementById(`monthlyTarget_${task.id}`);
    const cardsEl = document.getElementById(`monthlyCards_${task.id}`);
    const tagEl = document.getElementById(`monthlyTag_${task.id}`);
    const descEl = document.getElementById(`monthlyDesc_${task.id}`);

    if (titleEl) task.title = titleEl.value.trim();
    if (typeEl) task.type = typeEl.value;
    if (targetEl) task.target = Number(targetEl.value) || 1000;
    if (cardsEl) {
      const c = Number(cardsEl.value) || 1;
      task.rewardCards = c;
      task.rewardVal = c;
      task.rewardText = `${c} Scratch Card${c > 1 ? 's' : ''}`;
    }
    if (tagEl) task.tagText = tagEl.value.trim();
    if (descEl) {
      task.desc = descEl.value.trim();
      task.notes = descEl.value.trim();
    }
  });

  try {
    localStorage.setItem(MONTHLY_STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {}

  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    if (!isSilent) alert('⚠️ Firebase not connected. Saved to local cache only.');
    return;
  }

  db.ref('/monthly_tasks_config').set(tasks)
    .then(() => {
      if (!isSilent) {
        alert('✅ Monthly Quests successfully published to Firebase (/monthly_tasks_config)! All connected players will receive the live updates immediately.');
      }
    })
    .catch(err => {
      console.error('Firebase save error:', err);
      if (!isSilent) alert('Firebase error: ' + err.message);
    });
}

function saveMonthlyTasksToFirebase() {
  performSaveMonthlyTasksToFirebase(false);
}

// Global Exports
window.switchAdminTaskSubtab = switchAdminTaskSubtab;

window.renderTelegramTasksUI = renderTelegramTasksUI;
window.openNewTelegramTaskModal = openNewTelegramTaskModal;
window.closeNewTelegramTaskModal = closeNewTelegramTaskModal;
window.confirmAddTelegramTask = confirmAddTelegramTask;
window.removeTelegramTask = removeTelegramTask;
window.saveTelegramTasksToFirebase = saveTelegramTasksToFirebase;
window.resetDefaultTelegramTasks = resetDefaultTelegramTasks;

window.renderWebsiteTasksUI = renderWebsiteTasksUI;
window.openNewWebsiteTaskModal = openNewWebsiteTaskModal;
window.closeNewWebsiteTaskModal = closeNewWebsiteTaskModal;
window.confirmAddWebsiteTask = confirmAddWebsiteTask;
window.removeWebsiteTask = removeWebsiteTask;
window.genPin = genPin;
window.genNewWebPin = genNewWebPin;
window.saveWebsiteTasksToFirebase = saveWebsiteTasksToFirebase;
window.resetDefaultWebsiteTasks = resetDefaultWebsiteTasks;

window.renderMonthlyTasksUI = renderMonthlyTasksUI;
window.openNewMonthlyTaskModal = openNewMonthlyTaskModal;
window.closeNewMonthlyTaskModal = closeNewMonthlyTaskModal;
window.confirmAddMonthlyTask = confirmAddMonthlyTask;
window.removeMonthlyTask = removeMonthlyTask;
window.saveMonthlyTasksToFirebase = saveMonthlyTasksToFirebase;
window.performSaveMonthlyTasksToFirebase = performSaveMonthlyTasksToFirebase;

window.renderMonthlyCompetitionUI = renderMonthlyCompetitionUI;
window.restartMonthlyCompetitionInFirebase = restartMonthlyCompetitionInFirebase;
window.extendMonthlyCompetition = extendMonthlyCompetition;

