/* ═══════════════════════════════════
   TAP EMPIRE — Wallet Screen (Redesigned)
   • Header: 💰 WALLET
   • Main Balance Card: GAME BALANCE (1,250,000 COINS | Estimated value: $12.50)
   • Secondary Cards: 🟡 PENDING ($0.00) | 🟢 COMPLETED ($0.00)
   • Withdrawal Section: Min withdrawal ($1.00), Eligible ($12.50), Amount Input & Request Button
   • Status Badge Component: 🟡 Pending, 🔵 Processing, 🟢 Completed, 🔴 Rejected
   • Recent Transactions History: Slide-in list with + / - indicators
   • Clear non-guaranteed monetary income disclaimers (server-authoritative)
═══════════════════════════════════ */

'use strict';

function renderWalletScreen() {
  const el = document.getElementById('screen-wallet');
  if (!el) return;

  const coins = STATE.coins || 0;
  const targetCoins = STATE.economy?.minimumWithdrawalCoins || 10000000;
  const coinsPerDollar = 1000000; // 1,000,000 coins = $1.00 estimate (10,000,000 = $10.00)
  const estVal = (coins / coinsPerDollar).toFixed(2);
  const eligibleVal = typeof calculateEligibleWithdrawal === 'function' ? calculateEligibleWithdrawal().toFixed(2) : (coins / coinsPerDollar).toFixed(2);
  const minCoins = targetCoins;
  const minDollars = (minCoins / coinsPerDollar).toFixed(2);

  const progPct = Math.min(100, (coins / targetCoins) * 100);
  const remainingCoins = Math.max(0, targetCoins - coins);

  const pendingCount = STATE.pendingWithdrawal ? 1 : 0;
  const pendingAmount = STATE.pendingWithdrawal ? (STATE.pendingWithdrawal.amount || 10.00).toFixed(2) : '0.00';
  const completedAmount = (STATE.completedWithdrawalsTotal || 0).toFixed(2);

  const activeStatus = STATE.pendingWithdrawal ? (STATE.pendingWithdrawal.status || 'pending') : null;

  el.innerHTML = `
    <div class="screen-scroll wallet-page-container">
      
      <!-- ── HEADER ── -->
      <div class="wallet-header">
        <div class="wallet-title">💰 WALLET</div>
      </div>

      <!-- ── MAIN BALANCE CARD (Floating Gradient) ── -->
      <div class="wallet-main-card anim-float-grad">
        <div class="wallet-card-lbl">GAME BALANCE</div>
        <div class="wallet-card-coins-val">${fmt(coins)}</div>
        <div class="wallet-card-coins-unit">COINS</div>
        <div class="wallet-card-est-tag">
          Estimated value: <strong style="color:var(--gold)">$${estVal}</strong>
        </div>
        <div class="wallet-card-est-notice">
          (Estimate only — minimum withdrawal is 10,000,000 coins / $10)
        </div>
      </div>

      <!-- ── WITHDRAWAL PROGRESS CARD ── -->
      <div class="withdraw-progress-card">
        <div class="withdraw-prog-row">
          <span class="withdraw-prog-lbl">WITHDRAWAL PROGRESS</span>
          <span class="withdraw-prog-val">${fmt(coins)} / 10,000,000 (${progPct.toFixed(1)}%)</span>
        </div>
        <div class="withdraw-prog-track">
          <div class="withdraw-prog-fill" style="width:${progPct.toFixed(1)}%"></div>
        </div>
        <div class="withdraw-prog-sub">
          ${coins >= targetCoins ? '✅ Minimum threshold reached!' : `Remaining: ${fmt(remainingCoins)} coins`}
        </div>
      </div>

      <!-- ── SECONDARY SUMMARY CARDS ── -->
      <div class="wallet-secondary-row">
        <div class="wallet-sec-card card-pending">
          <div class="sec-card-top">
            <span class="sec-card-dot">🟡</span>
            <span class="sec-card-title">PENDING</span>
          </div>
          <div class="sec-card-amount">$${pendingAmount}</div>
        </div>

        <div class="wallet-sec-card card-completed">
          <div class="sec-card-top">
            <span class="sec-card-dot">🟢</span>
            <span class="sec-card-title">COMPLETED</span>
          </div>
          <div class="sec-card-amount">$${completedAmount}</div>
        </div>
      </div>

      <!-- ── ACTIVE WITHDRAWAL STATUS BADGE ── -->
      ${activeStatus ? `
        <div class="wallet-status-banner status-${activeStatus} anim-pulse-badge">
          <div class="status-banner-left">
            <span class="status-icon">
              ${activeStatus === 'pending' ? '🟡' : activeStatus === 'processing' ? '🔵' : activeStatus === 'completed' ? '🟢' : '🔴'}
            </span>
            <span class="status-text">
              Status: <strong>${activeStatus.toUpperCase()}</strong>
            </span>
          </div>
          <div class="status-banner-sub">Review in progress (1–3 business days)</div>
        </div>` : ''}

      <!-- ── WITHDRAWAL SECTION ── -->
      <div class="wallet-withdraw-section">
        <div class="section-title" style="margin-bottom:10px">Request Payout</div>
        
        <div class="withdraw-meta-grid">
          <div class="meta-col">
            <div class="meta-lbl">Minimum withdrawal:</div>
            <div class="meta-val">$${minDollars}</div>
          </div>
          <div class="meta-col">
            <div class="meta-lbl">Eligible payout:</div>
            <div class="meta-val highlight">$${eligibleVal}</div>
          </div>
        </div>

        <div class="withdraw-input-wrap">
          <span class="currency-symbol">$</span>
          <input type="number" id="withdraw-amount-input" class="withdraw-input" 
            placeholder="${minDollars}" min="${minDollars}" step="0.5" value="${minDollars}">
        </div>

        <button class="btn btn-gold btn-block btn-req-withdraw" id="btn-submit-withdraw"
          ${STATE.pendingWithdrawal ? 'disabled' : ''}
          onclick="handleWithdrawalSubmit()">
          ${STATE.pendingWithdrawal ? '⏳ WITHDRAWAL PENDING' : '💰 REQUEST WITHDRAWAL'}
        </button>

        <div class="wallet-disclaimer">
          Game coins are virtual reward tokens without guaranteed monetary conversion.<br>
          Withdrawal requests are processed via server validation.
        </div>
      </div>

      <!-- ── RECENT TRANSACTIONS / HISTORY ── -->
      <div class="wallet-history-section">
        <div class="section-title" style="margin-bottom:10px">Recent transactions</div>
        <div id="wallet-txn-list" class="wallet-txn-list">
          <div class="loading-inline">Loading transactions…</div>
        </div>
      </div>

    </div>`;

  _loadAndRenderWalletTransactions();
}

async function handleWithdrawalSubmit() {
  const inputEl = document.getElementById('withdraw-amount-input');
  const amount = inputEl ? parseFloat(inputEl.value) : 1.0;

  if (isNaN(amount) || amount <= 0) {
    showToast('⚠️ Please enter a valid withdrawal amount', 'error');
    return;
  }

  const btn = document.getElementById('btn-submit-withdraw');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '⏳ Submitting request…';
  }

  try {
    if (typeof requestWithdrawal === 'function') {
      await requestWithdrawal();
    } else {
      STATE.pendingWithdrawal = { status: 'pending', amount: amount, createdAt: new Date() };
      showToast('✅ Withdrawal request submitted for review!', 'success');
    }
  } catch (err) {
    showToast('⚠️ Request failed: ' + (err.message || 'Server error'), 'error');
  }

  renderWalletScreen();
}

async function _loadAndRenderWalletTransactions() {
  if (typeof loadTransactions === 'function') {
    await loadTransactions();
  }

  const listEl = document.getElementById('wallet-txn-list');
  if (!listEl) return;

  const txns = STATE.transactions || [
    { type: 'reward', desc: 'Mission reward', delta: 5000, createdAt: new Date() },
    { type: 'withdraw', desc: 'Withdrawal request', delta: -100000, createdAt: new Date(Date.now() - 86400000) },
  ];

  if (!txns.length) {
    listEl.innerHTML = '<div class="empty-state">No transaction history yet.</div>';
    return;
  }

  listEl.innerHTML = txns.map((t, idx) => {
    const isPos = t.delta >= 0;
    const sign = isPos ? '+' : '-';
    const amountText = `${sign}${fmt(Math.abs(t.delta))} Coins`;
    const titleText = esc(t.desc || (isPos ? 'Mission reward' : 'Withdrawal request'));
    const dateText = t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString() : 'Today';

    return `
      <div class="wallet-txn-card ${isPos ? 'txn-pos' : 'txn-neg'} anim-txn-slide" style="animation-delay: ${idx * 0.05}s">
        <div class="txn-card-left">
          <div class="txn-icon-circle">${isPos ? '💰' : '💸'}</div>
          <div class="txn-details">
            <div class="txn-title">${titleText}</div>
            <div class="txn-date">${dateText}</div>
          </div>
        </div>
        <div class="txn-card-right">
          <div class="txn-val ${isPos ? 'pos-val' : 'neg-val'}">${amountText}</div>
        </div>
      </div>`;
  }).join('');
}
