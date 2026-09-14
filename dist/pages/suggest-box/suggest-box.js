/* ==========================================================================
   SUGGEST BOX CONTROLLER (pages/suggest-box/suggest-box.js)
   - Handles User Feedback & Feature Suggestions:
     * User Name / Telegram Handle prefill & edit
     * Description field for writing suggestions
     * Submit button with validation
   - Writes to Firebase Realtime Database (/suggestions)
   - Keeps local history cache in localStorage (ENERGY_TAP_SUGGESTIONS_V1)
   - Plays sound & displays celebratory feedback toast
   ========================================================================== */

const LOCAL_SUGGESTIONS_KEY = 'ENERGY_TAP_SUGGESTIONS_V1';

function initSuggestBoxPage() {
  prefillSuggestUserName();
  renderSuggestionsHistory();
}

function prefillSuggestUserName() {
  const userInput = document.getElementById('suggestUserName');
  if (userInput && !userInput.value) {
    let name = '';
    if (typeof gameState !== 'undefined' && gameState.player) {
      if (gameState.player.handle) {
        name = gameState.player.handle.startsWith('@') ? gameState.player.handle : '@' + gameState.player.handle;
      } else if (gameState.player.name) {
        name = gameState.player.name;
      }
    }
    userInput.value = name || 'Alex Vance';
  }
}

function handleSuggestionSubmit(event) {
  if (event) event.preventDefault();

  const userInput = document.getElementById('suggestUserName');
  const descInput = document.getElementById('suggestDescription');

  const userName = userInput ? userInput.value.trim() : '';
  const description = descInput ? descInput.value.trim() : '';

  if (!userName) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('⚠️ Please enter your user name or handle.');
    }
    return;
  }

  if (!description) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('⚠️ Please write your suggestion in the description box.');
    }
    return;
  }

  const btn = document.getElementById('btnSubmitSuggestion');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span>Submitting...</span>`;
  }

  const sugId = 'sug_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
  const now = Date.now();

  const suggestionItem = {
    id: sugId,
    userName: userName,
    description: description,
    createdAt: now,
    status: 'Submitted'
  };

  // 1. Submit to Firebase if available
  if (window.firebaseSync && typeof window.firebaseSync.submitSuggestion === 'function') {
    window.firebaseSync.submitSuggestion(userName, description).catch(err => {
      console.warn('Firebase suggestion write notice:', err);
    });
  } else if (window.firebaseSync && window.firebaseSync.database) {
    const userId = window.firebaseSync.userId || 'user_local';
    window.firebaseSync.database.ref(`suggestions/${sugId}`).set({
      ...suggestionItem,
      userId: userId
    }).catch(err => {
      console.warn('Firebase direct suggestion write notice:', err);
    });
  }

  // 2. Save to local storage history
  saveLocalSuggestion(suggestionItem);

  // 3. Audio & Toast feedback
  if (typeof sfx !== 'undefined' && typeof sfx.playLevelUpSound === 'function') {
    sfx.playLevelUpSound();
  }
  if (typeof showFloatingToast === 'function') {
    showFloatingToast('🎉 Suggestion submitted successfully! Thank you for your feedback!');
  }

  // 4. Clear description input (preserve user name for ease of multiple inputs)
  if (descInput) {
    descInput.value = '';
  }

  // 5. Restore submit button
  if (btn) {
    btn.disabled = false;
    btn.innerHTML = `<span class="suggest-btn-icon">🚀</span><span>Submit Suggestion</span>`;
  }

  // 6. Refresh history list
  renderSuggestionsHistory();
}

function saveLocalSuggestion(item) {
  try {
    const list = loadLocalSuggestions();
    list.unshift(item);
    localStorage.setItem(LOCAL_SUGGESTIONS_KEY, JSON.stringify(list));
  } catch (e) {}
}

function loadLocalSuggestions() {
  try {
    const raw = localStorage.getItem(LOCAL_SUGGESTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function renderSuggestionsHistory() {
  const container = document.getElementById('suggestHistoryList');
  const countEl = document.getElementById('suggestHistoryCount');
  if (!container) return;

  const list = loadLocalSuggestions();

  if (countEl) {
    countEl.textContent = `${list.length} Suggestion${list.length === 1 ? '' : 's'}`;
  }

  if (list.length === 0) {
    container.innerHTML = `
      <div class="suggest-empty-history">
        <span class="suggest-empty-icon">💡</span>
        <p class="suggest-empty-text">No suggestions submitted yet.<br>Share your thoughts and feedback above!</p>
      </div>
    `;
    return;
  }

  let html = '';
  list.forEach(item => {
    const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently';

    html += `
      <div class="suggest-history-card">
        <div class="suggest-item-top">
          <span class="suggest-item-author">👤 ${escapeSuggestHtml(item.userName)}</span>
          <span class="suggest-item-badge">${escapeSuggestHtml(item.status || 'Submitted')}</span>
        </div>
        <p class="suggest-item-desc">${escapeSuggestHtml(item.description)}</p>
        <div class="suggest-item-bottom">
          <span>${dateStr}</span>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function escapeSuggestHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#039;');
}

// Global exports
window.initSuggestBoxPage = initSuggestBoxPage;
window.handleSuggestionSubmit = handleSuggestionSubmit;
window.renderSuggestionsHistory = renderSuggestionsHistory;
