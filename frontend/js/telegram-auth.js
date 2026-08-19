/* ═══════════════════════════════════════════════════════════
   TAP GAME — Telegram WebApp Client Authenticator (js/telegram-auth.js)
   • Extracts window.Telegram.WebApp.initData (raw string)
   • Sends raw initData to backend for HMAC-SHA256 verification
   • Handles 200 { ok: true } or 401 { ok: false } response
 ═══════════════════════════════════════════════════════════ */

'use strict';

async function authenticateTelegramUser(apiEndpoint = '/api/validate-telegram-auth') {
  try {
    const tgApp = window.Telegram?.WebApp;
    const rawInitData = tgApp?.initData;

    if (!rawInitData) {
      console.log('[Telegram Auth Client] Standalone / Web mode active (No Telegram initData)');
      return { ok: false, error: 'Standalone mode' };
    }

    console.log('[Telegram Auth Client] Sending raw initData to backend validator...');

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ initData: rawInitData })
    });

    if (response.status === 200) {
      const data = await response.json();
      console.log('[Telegram Auth Client] Verification successful! 200 OK:', data);
      
      if (data.user) {
        if (typeof STATE !== 'undefined') {
          STATE.telegramUser = data.user;
        }
        const nameEl = document.getElementById('user-name');
        if (nameEl && data.user.first_name) {
          nameEl.textContent = data.user.first_name;
        }
      }
      return { ok: true, user: data.user };
    } else {
      const errData = await response.json().catch(() => ({}));
      console.warn(`[Telegram Auth Client] Verification failed (${response.status}):`, errData.error);
      return { ok: false, status: response.status, error: errData.error };
    }
  } catch (err) {
    console.warn('[Telegram Auth Client] Connection error:', err);
    return { ok: false, error: err.message };
  }
}

// Auto-run on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => authenticateTelegramUser());
} else {
  authenticateTelegramUser();
}
