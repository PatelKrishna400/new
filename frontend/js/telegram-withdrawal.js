/* ═══════════════════════════════════════════════════════════
   TAP GAME — Telegram Stars / Coins Withdrawal Engine (js/telegram-withdrawal.js)
   • Live Exchange Rate (10,000 Coins = 1 Telegram Star)
   • Realtime Validation & Backend Request Submission
   • Realtime Sync with Firebase Realtime Database
   • Payout History with Status Badges (Pending, Approved, Completed, Rejected)
═══════════════════════════════════════════════════════════ */

'use strict';

const WITHDRAWAL_CONFIG = {
  minCoins: 100000,
  coinsPerStar: 10000,
  minLevel: 1
};

let _currentWithdrawTab = 'form';

function openStarWithdrawModal(defaultStars = null, defaultCost = null, type = 'coins') {
  const modal = document.getElementById('star-withdraw-modal');
  if (!modal) return;

  // 1. Populate current player coin balance
  const currentCoins = (typeof STATE !== 'undefined' && STATE.coins !== undefined) ? STATE.coins : 0;
  const coinsBalEl = document.getElementById('withdraw-available-coins');
  if (coinsBalEl) {
    coinsBalEl.textContent = Number(currentCoins).toLocaleString() + ' Coins';
  }

  // 2. Populate telegram user ID / username if known
  const userField = document.getElementById('star-withdraw-username');
  if (userField && !userField.value) {
    const tgUser = (typeof STATE !== 'undefined' && STATE.telegramUser) || window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (tgUser) {
      userField.value = tgUser.username ? `@${tgUser.username}` : (tgUser.id || '');
    } else {
      userField.value = localStorage.getItem('tg_user_id') || '';
    }
  }

  // 3. Pre-fill amount if triggered from specific tier
  const inputEl = document.getElementById('withdraw-coins-input');
  if (inputEl) {
    if (defaultCost && typeof defaultCost === 'number') {
      inputEl.value = defaultCost;
    } else if (!inputEl.value || Number(inputEl.value) < WITHDRAWAL_CONFIG.minCoins) {
      inputEl.value = Math.min(Math.max(WITHDRAWAL_CONFIG.minCoins, currentCoins), 1000000);
    }
    onWithdrawCoinsInputChange(inputEl.value);
  }

  // 4. Subscribe and render live history from Firebase
  if (typeof subscribeToRealtimeWithdrawals === 'function') {
    subscribeToRealtimeWithdrawals(renderWithdrawalHistory);
  }

  modal.classList.add('active');
  modal.style.display = 'flex';

  if (typeof haptic === 'function') haptic('selection');
}

function openWithdrawalPage() {
  openStarWithdrawModal();
}

function closeStarWithdrawModal() {
  const modal = document.getElementById('star-withdraw-modal');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }
}

function switchWithdrawTab(tabName) {
  _currentWithdrawTab = tabName;
  const btnForm = document.getElementById('tab-btn-withdraw-form');
  const btnHist = document.getElementById('tab-btn-withdraw-history');
  const contentForm = document.getElementById('withdraw-tab-form-content');
  const contentHist = document.getElementById('withdraw-tab-history-content');

  if (tabName === 'form') {
    if (btnForm) btnForm.classList.add('active');
    if (btnHist) btnHist.classList.remove('active');
    if (contentForm) { contentForm.classList.add('active'); contentForm.style.display = 'block'; }
    if (contentHist) { contentHist.classList.remove('active'); contentHist.style.display = 'none'; }
  } else {
    if (btnForm) btnForm.classList.remove('active');
    if (btnHist) btnHist.classList.add('active');
    if (contentForm) { contentForm.classList.remove('active'); contentForm.style.display = 'none'; }
    if (contentHist) { contentHist.classList.add('active'); contentHist.style.display = 'block'; }
  }

  if (typeof haptic === 'function') haptic('selection');
}

function onWithdrawCoinsInputChange(val) {
  const coins = Math.max(0, parseInt(val, 10) || 0);
  const starsCalculated = Math.floor(coins / WITHDRAWAL_CONFIG.coinsPerStar);
  
  const payoutEl = document.getElementById('withdraw-calculated-stars');
  if (payoutEl) {
    payoutEl.textContent = `${starsCalculated.toLocaleString()} ⭐ Telegram Stars`;
  }
}

function setWithdrawPresetAmount(amount) {
  const inputEl = document.getElementById('withdraw-coins-input');
  if (inputEl) {
    inputEl.value = amount;
    onWithdrawCoinsInputChange(amount);
  }
  if (typeof haptic === 'function') haptic('selection');
}

function setWithdrawMaxCoins() {
  const currentCoins = (typeof STATE !== 'undefined' && STATE.coins !== undefined) ? STATE.coins : 0;
  const inputEl = document.getElementById('withdraw-coins-input');
  if (inputEl) {
    inputEl.value = currentCoins;
    onWithdrawCoinsInputChange(currentCoins);
  }
  if (typeof haptic === 'function') haptic('selection');
}

async function submitWithdrawalForm() {
  const inputEl = document.getElementById('withdraw-coins-input');
  const userField = document.getElementById('star-withdraw-username');
  const coins = parseInt(inputEl?.value, 10) || 0;
  const targetUser = userField?.value?.trim() || 'user_demo';

  const currentCoins = (typeof STATE !== 'undefined' && STATE.coins !== undefined) ? STATE.coins : 0;

  if (coins < WITHDRAWAL_CONFIG.minCoins) {
    if (typeof showToast === 'function') {
      showToast(`⚠️ Minimum withdrawal is ${WITHDRAWAL_CONFIG.minCoins.toLocaleString()} Coins (10 ⭐ Stars)!`);
    }
    if (typeof SFX !== 'undefined' && SFX.error) SFX.error();
    return;
  }

  if (coins > currentCoins) {
    if (typeof showToast === 'function') {
      showToast(`❌ Insufficient Coins! You have ${Number(currentCoins).toLocaleString()} Coins.`);
    }
    if (typeof SFX !== 'undefined' && SFX.error) SFX.error();
    return;
  }

  const submitBtn = document.getElementById('btn-submit-withdraw-action');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Processing Request...';
  }

  const starsPayout = Math.floor(coins / WITHDRAWAL_CONFIG.coinsPerStar);

  const res = await requestCoinsWithdrawal(coins, targetUser);

  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = '⭐ CONFIRM & SUBMIT WITHDRAWAL';
  }

  if (res && res.ok) {
    // Record to Firebase Realtime Database
    const newRecord = {
      id: res.withdrawalId || ('wd_' + Date.now()),
      coins: coins,
      stars: starsPayout,
      status: 'pending',
      targetUser: targetUser,
      createdAt: Date.now()
    };

    if (typeof saveWithdrawalToFirebase === 'function') {
      await saveWithdrawalToFirebase(newRecord);
    }

    if (typeof SFX !== 'undefined' && SFX.collect) SFX.collect();
    if (typeof haptic === 'function') haptic('success');

    // Switch to history tab to show the pending request
    switchWithdrawTab('history');
  }
}

async function requestCoinsWithdrawal(coinsToWithdraw, targetUser = null) {
  try {
    const rawInitData = window.Telegram?.WebApp?.initData || '';
    const userId = targetUser || STATE?.telegramUser?.id || localStorage.getItem('tg_user_id');

    if (typeof showToast !== 'undefined') {
      showToast('⏳ Submitting withdrawal request to backend...');
    }

    const apiBase = (typeof getApiBaseUrl === 'function') ? getApiBaseUrl() : ((typeof window !== 'undefined' && window.location.port !== '3000' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) ? 'http://localhost:3000' : '');
    const response = await fetch(`${apiBase}/withdrawal/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        initData: rawInitData,
        coins: coinsToWithdraw || STATE.coins || 0,
        userId: userId
      })
    });

    const data = await response.json().catch(() => ({ ok: false, error: 'Invalid response from server' }));

    if (response.ok && data.ok) {
      // Execute local state transaction: deduct coins
      if (typeof STATE !== 'undefined') {
        STATE.coins = Math.max(0, STATE.coins - coinsToWithdraw);
        STATE.pendingWithdrawal = true;
      }

      if (typeof saveUserDataToFirebase !== 'undefined') {
        saveUserDataToFirebase(STATE);
      }

      if (typeof updateUI !== 'undefined') {
        updateUI();
      }

      // Update available coins in modal
      const coinsBalEl = document.getElementById('withdraw-available-coins');
      if (coinsBalEl && typeof STATE !== 'undefined') {
        coinsBalEl.textContent = Number(STATE.coins).toLocaleString() + ' Coins';
      }

      if (typeof showToast !== 'undefined') {
        showToast(`🎉 ${data.message || 'Withdrawal request submitted successfully!'}`);
      }

      return { ok: true, stars: data.stars, message: data.message, withdrawalId: data.withdrawalId };
    } else {
      const errorMsg = data.error || 'Withdrawal request rejected by server.';
      if (typeof showToast !== 'undefined') {
        showToast(`❌ Withdrawal Error: ${errorMsg}`);
      }
      return { ok: false, error: errorMsg };
    }
  } catch (err) {
    console.error('[Withdrawal Request Exception]:', err);
    if (typeof showToast !== 'undefined') {
      showToast(`❌ Network Error: ${err.message}`);
    }
    return { ok: false, error: err.message };
  }
}

function renderWithdrawalHistory(records = []) {
  const container = document.getElementById('withdraw-history-container');
  const countEl = document.getElementById('withdraw-history-count');
  if (!container) return;

  if (countEl) {
    countEl.textContent = records.length;
  }

  if (!records || records.length === 0) {
    container.innerHTML = `
      <div class="withdraw-empty-state">
        <span class="empty-icon">📭</span>
        <p>No withdrawal requests yet. Tap to earn coins and request your first Telegram Stars payout!</p>
      </div>
    `;
    return;
  }

  let html = '';
  records.forEach(r => {
    const statusUpper = (r.status || 'pending').toUpperCase();
    let statusClass = 'pending';
    let statusIcon = '⏳';

    if (statusUpper.includes('COMPLET') || statusUpper.includes('PAID') || statusUpper.includes('APPROV')) {
      statusClass = 'completed';
      statusIcon = '✅';
    } else if (statusUpper.includes('REJECT') || statusUpper.includes('CANCEL')) {
      statusClass = 'rejected';
      statusIcon = '❌';
    } else if (statusUpper.includes('PROCESS')) {
      statusClass = 'processing';
      statusIcon = '⚡';
    }

    const dateStr = r.createdAt ? new Date(r.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : 'Recent';

    html += `
      <div class="withdraw-history-item ${statusClass}">
        <div class="wh-top-row">
          <div class="wh-stars-payout">
            <span class="wh-star-icon">⭐</span>
            <span class="wh-star-val">+${Number(r.stars || 0).toLocaleString()} Stars</span>
          </div>
          <span class="wh-status-badge ${statusClass}">${statusIcon} ${statusUpper}</span>
        </div>
        <div class="wh-bottom-row">
          <span class="wh-coins-cost">💰 -${Number(r.coins || 0).toLocaleString()} Coins</span>
          <span class="wh-date">${dateStr}</span>
        </div>
        <div class="wh-tx-id">ID: <code>${r.id || 'N/A'}</code></div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// Global functions for backward compatibility
function confirmStarGiftWithdrawal() {
  submitWithdrawalForm();
}
