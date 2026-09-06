/* ==========================================================================
   PAGE: TASKS & WEB LOGIC (pages/tasks-web/tasks-web.js)
   ========================================================================== */

const DEFAULT_WEB_TASKS = [
  { id: 'web1', title: 'Visit: Tap Empire Official Web', url: 'https://tapempire.io', code: '4829', costCoins: 1000, diamondReward: 100, tag: 'SPONSOR QUEST' },
  { id: 'web2', title: 'Visit Partner: CoinMarketCap Hub', url: 'https://coinmarketcap.com', code: '7105', costCoins: 1000, diamondReward: 150, tag: 'PARTNER QUEST' },
  { id: 'web3', title: 'Visit: Airdrop & Rewards Directory', url: 'https://dappradar.com', code: '9364', costCoins: 1000, diamondReward: 200, tag: 'EXCLUSIVE QUEST' }
];

window.addEventListener('websiteTasksUpdated', () => {
  renderWebsiteTasksUI();
});

document.addEventListener('DOMContentLoaded', () => {
  renderWebsiteTasksUI();
});

function renderWebsiteTasksUI() {
  const container = document.getElementById('websiteTasksContainer');
  if (!container) return;

  const tasks = (window.adminState.websiteTasks && window.adminState.websiteTasks.length > 0)
    ? window.adminState.websiteTasks
    : DEFAULT_WEB_TASKS;

  let html = '';
  tasks.forEach((task, idx) => {
    html += `
      <div class="card-panel" style="display: flex; flex-direction: column; gap: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(25, 55, 120, 0.4); padding-bottom: 8px;">
          <span style="font-weight: 800; color: #22d3ee; font-size: 13px;">🌐 QUEST #${idx + 1}</span>
          <span style="font-size: 11px; color: #fbbf24; font-weight: 800;">Entry Cost: 1,000 🪙</span>
        </div>

        <div class="form-group">
          <label class="form-label">Quest Title</label>
          <input type="text" id="wtTitle_${task.id}" value="${task.title}" class="form-input">
        </div>

        <div class="form-group">
          <label class="form-label">Destination URL</label>
          <input type="url" id="wtUrl_${task.id}" value="${task.url}" class="form-input" style="color: #38bdf8; font-family: 'JetBrains Mono', monospace;">
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="form-group">
            <div style="display: flex; justify-content: space-between;">
              <label class="form-label">4-Digit PIN</label>
              <button type="button" onclick="genPin('${task.id}')" style="background: none; border: none; color: #38bdf8; font-size: 10px; font-weight: 800; cursor: pointer;">🎲 Gen</button>
            </div>
            <input type="text" maxlength="4" id="wtCode_${task.id}" value="${task.code}" class="form-input" style="font-family: 'JetBrains Mono', monospace; font-size: 14px; text-align: center; color: #fbbf24; font-weight: 800; letter-spacing: 2px;">
          </div>

          <div class="form-group">
            <label class="form-label">Prize (Diamonds)</label>
            <input type="number" id="wtDiamonds_${task.id}" value="${task.diamondReward || 100}" class="form-input" style="color: #22d3ee; font-weight: 800; text-align: center;">
          </div>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

function genPin(taskId) {
  const pin = Math.floor(1000 + Math.random() * 9000).toString();
  const el = document.getElementById(`wtCode_${taskId}`);
  if (el) el.value = pin;
}

function saveWebsiteTasksToFirebase() {
  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    alert('Firebase is not connected!');
    return;
  }

  const currentTasks = (window.adminState.websiteTasks && window.adminState.websiteTasks.length > 0)
    ? window.adminState.websiteTasks
    : DEFAULT_WEB_TASKS;

  const updated = currentTasks.map(t => {
    const title = document.getElementById(`wtTitle_${t.id}`)?.value.trim() || t.title;
    const url = document.getElementById(`wtUrl_${t.id}`)?.value.trim() || t.url;
    const code = document.getElementById(`wtCode_${t.id}`)?.value.trim() || t.code;
    const diamonds = Number(document.getElementById(`wtDiamonds_${t.id}`)?.value) || t.diamondReward || 100;
    return {
      ...t,
      title,
      url,
      code,
      diamondReward: diamonds,
      costCoins: 1000
    };
  });

  window.adminState.websiteTasks = updated;
  db.ref('/website_tasks_config').set(updated)
    .then(() => alert('Website tasks configuration saved to Firebase!'))
    .catch(err => alert('Firebase error: ' + err.message));
}

function resetDefaultWebsiteTasks() {
  if (!confirm('Reset tasks to default?')) return;
  window.adminState.websiteTasks = [...DEFAULT_WEB_TASKS];
  renderWebsiteTasksUI();
  saveWebsiteTasksToFirebase();
}

window.renderWebsiteTasksUI = renderWebsiteTasksUI;
window.genPin = genPin;
window.saveWebsiteTasksToFirebase = saveWebsiteTasksToFirebase;
window.resetDefaultWebsiteTasks = resetDefaultWebsiteTasks;
