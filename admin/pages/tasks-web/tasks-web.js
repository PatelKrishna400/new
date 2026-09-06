/* ==========================================================================
   PAGE: TASKS (TELEGRAM & WEBSITE TASK ADDER) - pages/tasks-web/tasks-web.js
   ========================================================================== */

const DEFAULT_TG_TASKS = [
  {
    id: 'tg1',
    title: 'Join Channel: Earn to ads',
    rewardText: '1 Key for Chest',
    rewardKeys: 1,
    desc: 'Join @Earn_to_ads official Telegram channel to win 1 Key for Chest',
    notes: 'Join the official @Earn_to_ads Telegram announcements channel.',
    tip: 'Tip: Make sure you remain in the channel to continue receiving partner bonuses.',
    iconType: 'plane',
    btnText: 'Join Channel',
    url: 'https://t.me/Earn_to_ads',
    tagText: 'TELEGRAM CHANNEL'
  },
  {
    id: 'tg2',
    title: 'Join Bot: Prover Svoi Akk',
    rewardText: '1 Key for Chest',
    rewardKeys: 1,
    desc: 'Launch and start @prover_svoiakk_bot on Telegram to win 1 Key for Chest',
    notes: 'Launch and start our verified partner Telegram bot @prover_svoiakk_bot.',
    tip: 'Tip: Tap the button below to launch the bot directly in Telegram.',
    iconType: 'bot',
    btnText: 'Join Bot',
    url: 'https://t.me/prover_svoiakk_bot',
    tagText: 'TELEGRAM BOT'
  },
  {
    id: 'tg3',
    title: 'Join Bot: Stars One Click',
    rewardText: '2 Keys for Chest',
    rewardKeys: 2,
    desc: 'Launch and start @stars_oneklic_bot on Telegram to win 2 Keys for Chest',
    notes: 'Launch and start @stars_oneklic_bot on Telegram.',
    tip: 'Tip: Double key reward—unlock 2 mystery chests back-to-back!',
    iconType: 'bot',
    btnText: 'Join Bot',
    url: 'https://t.me/stars_oneklic_bot',
    tagText: 'TELEGRAM BOT'
  }
];

const DEFAULT_WEB_TASKS = [
  { id: 'web1', title: 'Visit: Tap Empire Official Web', url: 'https://tapempire.io', code: '4829', costCoins: 1000, diamondReward: 100, tag: 'SPONSOR QUEST' },
  { id: 'web2', title: 'Visit Partner: CoinMarketCap Hub', url: 'https://coinmarketcap.com', code: '7105', costCoins: 1000, diamondReward: 150, tag: 'PARTNER QUEST' },
  { id: 'web3', title: 'Visit: Airdrop & Rewards Directory', url: 'https://dappradar.com', code: '9364', costCoins: 1000, diamondReward: 200, tag: 'EXCLUSIVE QUEST' }
];

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
   TELEGRAM TASKS LOGIC
   ========================================================================== */

function getTelegramTasks() {
  return (window.adminState.telegramTasks && window.adminState.telegramTasks.length > 0)
    ? window.adminState.telegramTasks
    : DEFAULT_TG_TASKS;
}

function renderTelegramTasksUI() {
  const container = document.getElementById('telegramTasksContainer');
  const badge = document.getElementById('adminTgTasksCountBadge');
  if (!container) return;

  const tasks = getTelegramTasks();
  if (badge) badge.textContent = tasks.length;

  if (tasks.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; background: rgba(4, 10, 26, 0.5); border-radius: 12px; border: 1px dashed rgba(25, 55, 120, 0.5);">
        <p style="color: #94a3b8; font-size: 14px; margin-bottom: 12px;">No Telegram tasks found.</p>
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

    html += `
      <div class="task-item-card" id="tgCard_${task.id}">
        <div class="task-card-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-weight: 800; color: #38bdf8; font-size: 13px;">${typeLabel} #${idx + 1}</span>
            <span style="font-size: 10px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 2px 6px; border-radius: 4px; font-weight: 700;">${tag}</span>
          </div>
          <button type="button" onclick="removeTelegramTask('${task.id}')" title="Delete Task" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; border-radius: 6px; padding: 3px 8px; font-size: 11px; cursor: pointer;">🗑️ Remove</button>
        </div>

        <div class="form-group">
          <label class="form-label">Task Title</label>
          <input type="text" id="tgTitle_${task.id}" value="${task.title || ''}" class="form-input">
        </div>

        <div class="form-group">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <label class="form-label">Telegram URL</label>
            <a href="${task.url || '#'}" target="_blank" style="color: #38bdf8; font-size: 10px; text-decoration: none; font-weight: 700;">↗️ Test Link</a>
          </div>
          <input type="url" id="tgUrl_${task.id}" value="${task.url || ''}" class="form-input" style="color: #38bdf8; font-family: 'JetBrains Mono', monospace; font-size: 12px;">
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="form-group">
            <label class="form-label">Reward (Keys)</label>
            <input type="number" id="tgRewardKeys_${task.id}" value="${task.rewardKeys || 1}" min="1" max="50" class="form-input" style="color: #fbbf24; font-weight: 800; text-align: center;">
          </div>
          <div class="form-group">
            <label class="form-label">Button Text</label>
            <input type="text" id="tgBtnText_${task.id}" value="${task.btnText || 'Join'}" class="form-input" style="text-align: center;">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Description / Subtitle</label>
          <input type="text" id="tgDesc_${task.id}" value="${task.desc || ''}" class="form-input" style="font-size: 12px; color: #cbd5e1;">
        </div>
      </div>
    `;
  });

  // Append big dashed Adder card
  html += `
    <div class="task-item-card" onclick="openNewTelegramTaskModal()" style="border: 2px dashed rgba(56, 189, 248, 0.35); background: rgba(14, 165, 233, 0.04); display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 220px; cursor: pointer; text-align: center; gap: 10px; transition: all 0.2s ease;">
      <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(56, 189, 248, 0.15); display: flex; align-items: center; justify-content: center; font-size: 22px; color: #38bdf8;">➕</div>
      <strong style="color: #38bdf8; font-size: 14px;">Add New Telegram Task</strong>
      <span style="color: #94a3b8; font-size: 11px;">Configure Channel, Bot, or Group Quest</span>
    </div>
  `;

  container.innerHTML = html;
}

function openNewTelegramTaskModal() {
  const modal = document.getElementById('addTgTaskModal');
  if (modal) {
    modal.style.display = 'flex';
    modal.classList.add('open');
  }
}

function closeNewTelegramTaskModal() {
  const modal = document.getElementById('addTgTaskModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('open');
  }
}

function confirmAddTelegramTask() {
  const title = document.getElementById('newTgTitle')?.value.trim();
  const url = document.getElementById('newTgUrl')?.value.trim();
  const type = document.getElementById('newTgType')?.value || 'plane';
  const rewardKeys = Number(document.getElementById('newTgRewardKeys')?.value) || 1;
  const desc = document.getElementById('newTgDesc')?.value.trim();
  const btnText = document.getElementById('newTgBtnText')?.value.trim() || 'Join Channel';

  if (!title) {
    alert('Please enter a task title!');
    return;
  }
  if (!url || !url.includes('t.me')) {
    alert('Please enter a valid Telegram URL (e.g. https://t.me/channel_name)!');
    return;
  }

  const isBot = type === 'bot';
  const newId = 'tg_' + Date.now().toString(36);
  const newTask = {
    id: newId,
    title,
    url,
    iconType: type,
    rewardKeys,
    rewardText: `${rewardKeys} ${rewardKeys > 1 ? 'Keys' : 'Key'} for Chest`,
    desc: desc || `Join ${title} on Telegram to win ${rewardKeys} Chest Key`,
    notes: `Join and follow instructions to claim your ${rewardKeys} Chest Key reward!`,
    tip: 'Tip: Tap the button to launch Telegram directly.',
    btnText,
    tagText: isBot ? 'TELEGRAM BOT' : 'TELEGRAM CHANNEL'
  };

  const current = [...getTelegramTasks(), newTask];
  window.adminState.telegramTasks = current;

  closeNewTelegramTaskModal();
  renderTelegramTasksUI();
  saveTelegramTasksToFirebase();

  // Clear inputs
  if (document.getElementById('newTgTitle')) document.getElementById('newTgTitle').value = '';
  if (document.getElementById('newTgUrl')) document.getElementById('newTgUrl').value = '';
  if (document.getElementById('newTgDesc')) document.getElementById('newTgDesc').value = '';
}

function removeTelegramTask(id) {
  if (!confirm('Are you sure you want to remove this Telegram task?')) return;
  const current = getTelegramTasks().filter(t => t.id !== id);
  window.adminState.telegramTasks = current;
  renderTelegramTasksUI();
  saveTelegramTasksToFirebase();
}

function saveTelegramTasksToFirebase() {
  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    alert('Firebase is not connected!');
    return;
  }

  const currentTasks = getTelegramTasks();
  const updated = currentTasks.map(t => {
    const title = document.getElementById(`tgTitle_${t.id}`)?.value.trim() || t.title;
    const url = document.getElementById(`tgUrl_${t.id}`)?.value.trim() || t.url;
    const rewardKeys = Number(document.getElementById(`tgRewardKeys_${t.id}`)?.value) || t.rewardKeys || 1;
    const btnText = document.getElementById(`tgBtnText_${t.id}`)?.value.trim() || t.btnText || 'Join';
    const desc = document.getElementById(`tgDesc_${t.id}`)?.value.trim() || t.desc;

    return {
      ...t,
      title,
      url,
      rewardKeys,
      rewardText: `${rewardKeys} ${rewardKeys > 1 ? 'Keys' : 'Key'} for Chest`,
      btnText,
      desc
    };
  });

  window.adminState.telegramTasks = updated;
  db.ref('/telegram_tasks_config').set(updated)
    .then(() => alert('Telegram tasks configuration saved to Firebase (/telegram_tasks_config)!'))
    .catch(err => alert('Firebase error: ' + err.message));
}

function resetDefaultTelegramTasks() {
  if (!confirm('Reset Telegram tasks to system defaults?')) return;
  window.adminState.telegramTasks = [...DEFAULT_TG_TASKS];
  renderTelegramTasksUI();
  saveTelegramTasksToFirebase();
}

/* ==========================================================================
   WEBSITE TASKS LOGIC
   ========================================================================== */

function getWebsiteTasks() {
  return (window.adminState.websiteTasks && window.adminState.websiteTasks.length > 0)
    ? window.adminState.websiteTasks
    : DEFAULT_WEB_TASKS;
}

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
    html += `
      <div class="task-item-card" id="webCard_${task.id}">
        <div class="task-card-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-weight: 800; color: #2dd4bf; font-size: 13px;">🌐 QUEST #${idx + 1}</span>
            <span style="font-size: 10px; background: rgba(45, 212, 191, 0.15); color: #2dd4bf; padding: 2px 6px; border-radius: 4px; font-weight: 700;">${task.tag || 'SPONSOR QUEST'}</span>
          </div>
          <button type="button" onclick="removeWebsiteTask('${task.id}')" title="Delete Quest" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; border-radius: 6px; padding: 3px 8px; font-size: 11px; cursor: pointer;">🗑️ Remove</button>
        </div>

        <div class="form-group">
          <label class="form-label">Quest Title</label>
          <input type="text" id="wtTitle_${task.id}" value="${task.title || ''}" class="form-input">
        </div>

        <div class="form-group">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <label class="form-label">Destination URL</label>
            <a href="${task.url || '#'}" target="_blank" style="color: #38bdf8; font-size: 10px; text-decoration: none; font-weight: 700;">↗️ Preview Site</a>
          </div>
          <input type="url" id="wtUrl_${task.id}" value="${task.url || ''}" class="form-input" style="color: #38bdf8; font-family: 'JetBrains Mono', monospace; font-size: 12px;">
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="form-group">
            <div style="display: flex; justify-content: space-between;">
              <label class="form-label">4-Digit PIN</label>
              <button type="button" onclick="genPin('${task.id}')" style="background: none; border: none; color: #38bdf8; font-size: 10px; font-weight: 800; cursor: pointer;">🎲 Gen</button>
            </div>
            <input type="text" maxlength="4" id="wtCode_${task.id}" value="${task.code || '1234'}" class="form-input" style="font-family: 'JetBrains Mono', monospace; font-size: 14px; text-align: center; color: #fbbf24; font-weight: 800; letter-spacing: 2px;">
          </div>

          <div class="form-group">
            <label class="form-label">Prize (Diamonds 💎)</label>
            <input type="number" id="wtDiamonds_${task.id}" value="${task.diamondReward || 100}" class="form-input" style="color: #22d3ee; font-weight: 800; text-align: center;">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="form-group">
            <label class="form-label">Entry Cost (Coins 🪙)</label>
            <input type="number" id="wtCost_${task.id}" value="${task.costCoins !== undefined ? task.costCoins : 1000}" class="form-input" style="color: #facc15; font-weight: 800; text-align: center;">
          </div>
          <div class="form-group">
            <label class="form-label">Tag</label>
            <input type="text" id="wtTag_${task.id}" value="${task.tag || 'SPONSOR QUEST'}" class="form-input" style="text-align: center; font-size: 11px;">
          </div>
        </div>
      </div>
    `;
  });

  // Append big dashed Adder card
  html += `
    <div class="task-item-card" onclick="openNewWebsiteTaskModal()" style="border: 2px dashed rgba(45, 212, 191, 0.35); background: rgba(45, 212, 191, 0.04); display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 220px; cursor: pointer; text-align: center; gap: 10px; transition: all 0.2s ease;">
      <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(45, 212, 191, 0.15); display: flex; align-items: center; justify-content: center; font-size: 22px; color: #2dd4bf;">➕</div>
      <strong style="color: #2dd4bf; font-size: 14px;">Add New Website Quest</strong>
      <span style="color: #94a3b8; font-size: 11px;">Configure Sponsor Secret PIN Quest</span>
    </div>
  `;

  container.innerHTML = html;
}

function genPin(taskId) {
  const pin = Math.floor(1000 + Math.random() * 9000).toString();
  const el = document.getElementById(`wtCode_${taskId}`);
  if (el) el.value = pin;
}

function genNewWebPin() {
  const pin = Math.floor(1000 + Math.random() * 9000).toString();
  const el = document.getElementById('newWebCode');
  if (el) el.value = pin;
}

function openNewWebsiteTaskModal() {
  const modal = document.getElementById('addWebTaskModal');
  if (modal) {
    modal.style.display = 'flex';
    modal.classList.add('open');
  }
}

function closeNewWebsiteTaskModal() {
  const modal = document.getElementById('addWebTaskModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('open');
  }
}

function confirmAddWebsiteTask() {
  const title = document.getElementById('newWebTitle')?.value.trim();
  const url = document.getElementById('newWebUrl')?.value.trim();
  const code = document.getElementById('newWebCode')?.value.trim() || '4829';
  const diamonds = Number(document.getElementById('newWebDiamonds')?.value) || 100;
  const cost = Number(document.getElementById('newWebCostCoins')?.value) || 1000;
  const tag = document.getElementById('newWebTag')?.value || 'SPONSOR QUEST';

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
    url,
    code,
    costCoins: cost,
    diamondReward: diamonds,
    tag,
    rewardText: `${diamonds} Diamonds 💎`,
    desc: `Unlock with ${cost.toLocaleString()} Coins, visit official portal, and enter 4-digit secret code to win ${diamonds} Diamonds 💎`,
    notes: `Spend ${cost.toLocaleString()} Coins to open this website. Search the page for the hidden 4-digit PIN code to claim ${diamonds} Diamonds!`,
    tip: 'Tip: Look carefully at the banner or footer on the webpage for your 4-digit PIN code.',
    iconType: 'globe',
    btnText: 'Unlock & Visit'
  };

  const current = [...getWebsiteTasks(), newTask];
  window.adminState.websiteTasks = current;

  closeNewWebsiteTaskModal();
  renderWebsiteTasksUI();
  saveWebsiteTasksToFirebase();

  // Reset inputs
  if (document.getElementById('newWebTitle')) document.getElementById('newWebTitle').value = '';
  if (document.getElementById('newWebUrl')) document.getElementById('newWebUrl').value = '';
}

function removeWebsiteTask(id) {
  if (!confirm('Are you sure you want to remove this Website quest?')) return;
  const current = getWebsiteTasks().filter(t => t.id !== id);
  window.adminState.websiteTasks = current;
  renderWebsiteTasksUI();
  saveWebsiteTasksToFirebase();
}

function saveWebsiteTasksToFirebase() {
  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    alert('Firebase is not connected!');
    return;
  }

  const currentTasks = getWebsiteTasks();
  const updated = currentTasks.map(t => {
    const title = document.getElementById(`wtTitle_${t.id}`)?.value.trim() || t.title;
    const url = document.getElementById(`wtUrl_${t.id}`)?.value.trim() || t.url;
    const code = document.getElementById(`wtCode_${t.id}`)?.value.trim() || t.code;
    const diamonds = Number(document.getElementById(`wtDiamonds_${t.id}`)?.value) || t.diamondReward || 100;
    const cost = Number(document.getElementById(`wtCost_${t.id}`)?.value) ?? (t.costCoins || 1000);
    const tag = document.getElementById(`wtTag_${t.id}`)?.value.trim() || t.tag || 'SPONSOR QUEST';

    return {
      ...t,
      title,
      url,
      code,
      diamondReward: diamonds,
      costCoins: cost,
      tag,
      rewardText: `${diamonds} Diamonds 💎`
    };
  });

  window.adminState.websiteTasks = updated;
  db.ref('/website_tasks_config').set(updated)
    .then(() => alert('Website tasks configuration saved to Firebase (/website_tasks_config)!'))
    .catch(err => alert('Firebase error: ' + err.message));
}

function resetDefaultWebsiteTasks() {
  if (!confirm('Reset Website tasks to system defaults?')) return;
  window.adminState.websiteTasks = [...DEFAULT_WEB_TASKS];
  renderWebsiteTasksUI();
  saveWebsiteTasksToFirebase();
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
