/* ═══════════════════════════════════════════════════════════
   TAP GAME — Telegram Stars / Coins Withdrawal Engine (js/telegram-withdrawal.js)
   
   Client                              Backend
     │                                    │
     ├─ POST /withdrawal/request ────────►│
     │  { initData }                      ├─ verifyInitData (HMAC)
     │                                    ├─ Load economy config from Firestore
     │                                    ├─ Load user doc from Firestore
     │                                    ├─ Check: coins, level, adViews, riskStatus
     │                                    ├─ Database transaction:
     │                                    │   - user.coins = 0
     │                                    │   - user.pendingWithdrawal = true
     │                                    │   - Create withdrawals/{id}
     │                                    │   - Create transactions/{id}
     │◄─ { ok, stars, message } ─────────┤
     │                                    │
     │  Admin reviews in Admin Panel      │
     │  Admin sets status → completed     │
     │  Admin sends Stars via bot manually│
 ═══════════════════════════════════════════════════════════ */

'use strict';

async function requestCoinsWithdrawal(coinsToWithdraw) {
  try {
    const rawInitData = window.Telegram?.WebApp?.initData || '';
    const userId = STATE?.telegramUser?.id || localStorage.getItem('tg_user_id');

    if (typeof showToast !== 'undefined') {
      showToast('⏳ Submitting withdrawal request to backend...');
    }

    const response = await fetch('/withdrawal/request', {
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

    const data = await response.json();

    if (response.ok && data.ok) {
      // Execute local state transaction: user.coins = 0, user.pendingWithdrawal = true
      if (typeof STATE !== 'undefined') {
        STATE.coins = 0;
        STATE.pendingWithdrawal = true;
      }

      if (typeof saveUserDataToFirebase !== 'undefined') {
        saveUserDataToFirebase(STATE);
      }

      if (typeof updateUI !== 'undefined') {
        updateUI();
      }

      if (typeof showToast !== 'undefined') {
        showToast(`🎉 ${data.message}`);
      }

      return { ok: true, stars: data.stars, message: data.message };
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
