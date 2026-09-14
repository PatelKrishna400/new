/* ==========================================================================
   CUSTOM AMAZON ORDER CONTROLLER (pages/custom/custom.js)
   - User Custom Product Submission Form:
     * User Name / Telegram Handle
     * Amazon Product Link
     * Product Name
     * Description of Product / Notes
   - Real-time Cloud Save to Firebase (/reward_requests)
   - LocalStorage History Tracking & Status Synchronization
   ========================================================================== */

const LOCAL_CUSTOM_REQUESTS_KEY = 'ENERGY_TAP_USER_CUSTOM_REQUESTS_V1';

function initCustomPage() {
  updateCustomDiamondDisplay();
  prefillCustomUserFields();
  renderCustomRequestsHistory();
}

function updateCustomDiamondDisplay() {
  const diamondValEl = document.getElementById('diamondValCustom');
  if (diamondValEl) {
    const currentDiamonds = (gameState.player && gameState.player.diamonds) ? gameState.player.diamonds : 0;
    diamondValEl.textContent = currentDiamonds.toLocaleString();
  }
}

function prefillCustomUserFields() {
  const userInput = document.getElementById('customUserName');
  if (userInput && !userInput.value) {
    const defaultName = (gameState.player && gameState.player.handle) 
      ? (gameState.player.handle.startsWith('@') ? gameState.player.handle : '@' + gameState.player.handle)
      : (gameState.player && gameState.player.name) ? gameState.player.name : '';
    userInput.value = defaultName;
  }
}

function handleCustomOrderSubmit(event) {
  event.preventDefault();

  const userName = document.getElementById('customUserName')?.value.trim();
  const amazonLink = document.getElementById('customAmazonLink')?.value.trim();
  const productName = document.getElementById('customProductName')?.value.trim();
  const productDesc = document.getElementById('customProductDesc')?.value.trim();

  if (!userName || !amazonLink || !productName || !productDesc) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('⚠️ Please fill in all 4 required fields!');
    }
    return;
  }

  // Basic Amazon URL sanity check
  if (!amazonLink.startsWith('http://') && !amazonLink.startsWith('https://')) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('⚠️ Please enter a valid URL starting with https://');
    }
    return;
  }

  const btn = document.getElementById('btnSubmitCustomOrder');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span>Submitting Request...</span>`;
  }

  const reqId = 'req_cust_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
  const now = Date.now();

  const requestPayload = {
    id: reqId,
    userId: (window.firebaseSync && window.firebaseSync.userId) || 'user_local',
    userName: userName,
    userTgHandle: userName.startsWith('@') ? userName : `@${userName}`,
    rewardId: reqId,
    rewardTitle: `[CUSTOM] ${productName}`,
    itemTitle: productName,
    productName: productName,
    category: 'custom',
    categoryName: 'Custom Amazon Product',
    categoryIcon: '⭐',
    diamondsCost: 0,
    diamondCost: 0,
    cashValue: 'Custom Quote',
    amazonLink: amazonLink,
    deliveryInfo: `Amazon: ${amazonLink}`,
    userNotes: productDesc,
    status: 'pending', // 'pending' | 'approved' | 'delivered' | 'rejected'
    isCustomOrder: true,
    createdAt: now,
    updatedAt: now
  };

  // 1. Save to Firebase Realtime Database (/reward_requests)
  if (window.firebaseSync && typeof window.firebaseSync.submitRewardRequest === 'function') {
    window.firebaseSync.submitRewardRequest({
      id: reqId,
      title: `[CUSTOM] ${productName}`,
      category: 'custom',
      categoryName: 'Custom Amazon Product',
      categoryIcon: '⭐',
      diamonds: 0,
      cashValue: 'Amazon'
    }, {
      contact: userName,
      address: amazonLink,
      notes: productDesc
    }).catch(err => {
      console.warn('Firebase custom order write notice:', err);
    });
  }

  // 2. Save to User's local custom history
  saveCustomRequestLocally(requestPayload);

  // 3. Audio & Toast feedback
  if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') {
    sfx.playLevelUpSound();
  }
  if (typeof showFloatingToast === 'function') {
    showFloatingToast(`🎉 Custom Amazon request for "${productName}" submitted! Admin will review it.`);
  }

  // 4. Reset form fields (keeping user name for convenience)
  const linkInput = document.getElementById('customAmazonLink');
  const nameInput = document.getElementById('customProductName');
  const descInput = document.getElementById('customProductDesc');
  if (linkInput) linkInput.value = '';
  if (nameInput) nameInput.value = '';
  if (descInput) descInput.value = '';

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = `<span class="sparkle-star">✨</span><span>Submit Custom Amazon Request</span>`;
  }

  // 5. Refresh history list
  renderCustomRequestsHistory();
}

function saveCustomRequestLocally(req) {
  try {
    const raw = localStorage.getItem(LOCAL_CUSTOM_REQUESTS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.unshift(req);
    localStorage.setItem(LOCAL_CUSTOM_REQUESTS_KEY, JSON.stringify(list));
  } catch (e) {}
}

function loadLocalCustomRequests() {
  try {
    const raw = localStorage.getItem(LOCAL_CUSTOM_REQUESTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function renderCustomRequestsHistory() {
  const container = document.getElementById('customRequestsHistoryList');
  const countEl = document.getElementById('customHistoryCount');
  if (!container) return;

  const list = loadLocalCustomRequests();

  if (countEl) {
    countEl.textContent = `${list.length} Request${list.length === 1 ? '' : 's'}`;
  }

  if (list.length === 0) {
    container.innerHTML = `
      <div class="custom-empty-history">
        <span class="custom-empty-icon">⭐</span>
        <p class="custom-empty-text">No custom Amazon orders submitted yet.<br>Submit your first product link above!</p>
      </div>
    `;
    return;
  }

  let html = '';
  list.forEach(req => {
    const statusClass = `status-badge-${req.status || 'pending'}`;
    const dateStr = req.createdAt ? new Date(req.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Today';

    html += `
      <div class="custom-request-card" id="customCard-${req.id}">
        <div class="custom-req-top">
          <span class="custom-req-id">#REQ-${req.id.slice(-6).toUpperCase()}</span>
          <span class="custom-req-status-badge ${statusClass}">${(req.status || 'pending').toUpperCase()}</span>
        </div>

        <h5 class="custom-req-product-name">${escapeHtml(req.productName || req.itemTitle || 'Custom Product')}</h5>
        <p class="custom-req-desc">${escapeHtml(req.userNotes || 'No notes provided')}</p>

        <div class="custom-req-bottom">
          <a href="${escapeHtml(req.amazonLink || '#')}" target="_blank" rel="noopener noreferrer" class="custom-req-link-btn">
            <span>🔗 Amazon Link</span>
          </a>
          <span class="custom-req-date">${dateStr}</span>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
}

// Global Exports
window.initCustomPage = initCustomPage;
window.handleCustomOrderSubmit = handleCustomOrderSubmit;
window.renderCustomRequestsHistory = renderCustomRequestsHistory;
