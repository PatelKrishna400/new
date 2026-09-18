/* ==========================================================================
   PAGE: TASKS (TELEGRAM & WEBSITE TASK ADDER) - pages/tasks-web/tasks-web.js
   ========================================================================== */

const TG_STORAGE_KEY = 'ENERGY_TAP_TG_TASKS';
const WEB_STORAGE_KEY = 'ENERGY_TAP_WEB_TASKS';

const DEFAULT_TG_TASKS = [];
const DEFAULT_WEB_TASKS = [];

// Initialize on events
window.addEventListener('websiteTasksUpdated', () => {
  renderWebsiteTasksUI();
});

window.addEventListener('telegramTasksUpdated', () => {
  renderTelegramTasksUI();
});

document.addEventListener('DOMContentLoaded', () => {
  renderTelegramTasksUI();
  renderWebsiteTasksUI();
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
  const tasks = isTg ? getTelegramTasks() : getWebsiteTasks();
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  task.disabled = !task.disabled;
  if (isTg) {
    performSaveTelegramTasksToFirebase(false);
    renderTelegramTasksUI();
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
    const cardsVal = Number(task.rewardCards || task.scratchCards || task.rewardKeys || 1);
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
            <label class="form-label">Reward (Scratch Cards 🎴)</label>
            <input type="number" id="tgRewardCards_${task.id}" value="${cardsVal}" min="1" max="50" oninput="onTgTaskInput('${task.id}')" class="form-input" style="color: #db2777; font-weight: 800; text-align: center; font-size: 14px;">
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
      <span style="color: #94a3b8; font-size: 11px;">Fixed Reward: Scratch Cards 🎴</span>
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
  const rewardCards = Number(document.getElementById('inpNewTgCards')?.value) || 1;

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
    rewardCards,
    scratchCards: rewardCards,
    rewardText: `${rewardCards} Scratch Card${rewardCards > 1 ? 's' : ''} 🎴`,
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
  if (document.getElementById('inpNewTgCards')) document.getElementById('inpNewTgCards').value = '1';
}

function removeTelegramTask(id) {
  if (!confirm('Are you sure you want to remove this Telegram task?')) return;
  const current = getTelegramTasks().filter(t => t.id !== id);
  window.adminState.telegramTasks = current;
  try { localStorage.setItem(TG_STORAGE_KEY, JSON.stringify(current)); } catch(e){}
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
    const rewardCards = Number(document.getElementById(`tgRewardCards_${t.id}`)?.value) || t.rewardCards || t.scratchCards || 1;
    const btnText = document.getElementById(`tgBtnText_${t.id}`)?.value.trim() || t.btnText || 'Join';

    return {
      ...t,
      title,
      url,
      rewardCards,
      scratchCards: rewardCards,
      rewardText: `${rewardCards} Scratch Card${rewardCards > 1 ? 's' : ''} 🎴`,
      btnText
    };
  });

  window.adminState.telegramTasks = updated;
  try { localStorage.setItem(TG_STORAGE_KEY, JSON.stringify(updated)); } catch(e){}

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
  if (window.adminState && window.adminState.websiteTasks && Array.isArray(window.adminState.websiteTasks)) {
    return window.adminState.websiteTasks;
  }
  try {
    const cached = localStorage.getItem(WEB_STORAGE_KEY);
    if (cached !== null) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        window.adminState.websiteTasks = parsed;
        return parsed;
      }
    }
  } catch (e) {}
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
            <label class="form-label">Entry Cost (Coins 🪙)</label>
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
  const diamonds = Number(document.getElementById('inpNewWebDiamonds')?.value) || 100;
  const cost = Number(document.getElementById('inpNewWebCoins')?.value) || 1000;
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
  try { localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(current)); } catch(e){}
  renderWebsiteTasksUI();
  performSaveWebsiteTasksToFirebase(true);
}

function saveWebsiteTasksToFirebase() {
  performSaveWebsiteTasksToFirebase(false);
}

function performSaveWebsiteTasksToFirebase(isSilent) {
  const currentTasks = getWebsiteTasks();
  const updated = currentTasks.map(t => {
    const title = document.getElementById(`wtTitle_${t.id}`)?.value.trim() || t.title;
    const desc = document.getElementById(`wtDesc_${t.id}`)?.value.trim() || t.desc || '';
    const url = document.getElementById(`wtUrl_${t.id}`)?.value.trim() || t.url;
    const code = document.getElementById(`wtCode_${t.id}`)?.value.trim() || t.code;
    const timer = Number(document.getElementById(`wtTimer_${t.id}`)?.value) || t.timer || t.duration || 15;
    const diamonds = Number(document.getElementById(`wtDiamonds_${t.id}`)?.value) || t.diamondReward || 100;
    const cost = Number(document.getElementById(`wtCost_${t.id}`)?.value) ?? (t.costCoins || 1000);
    const tag = document.getElementById(`wtTag_${t.id}`)?.value.trim() || t.tag || 'SPONSOR QUEST';

    return {
      ...t,
      title,
      desc,
      url,
      code,
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
  try { localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(updated)); } catch(e){}

  const db = window.getDb ? window.getDb() : null;
  if (db) {
    db.ref('/website_tasks_config').set(updated)
      .then(() => {
        if (!isSilent) alert('✅ Website tasks configuration saved to Firebase (/website_tasks_config)!');
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

window.renderMonthlyCompetitionUI = renderMonthlyCompetitionUI;
window.restartMonthlyCompetitionInFirebase = restartMonthlyCompetitionInFirebase;
window.extendMonthlyCompetition = extendMonthlyCompetition;
