/* ═══════════════════════════════════════════════════════════
   TAP GAME — Telegram WebApp Client Authenticator (js/telegram-auth.js)
   • Extracts window.Telegram.WebApp.initData (raw string)
   • Sends raw initData to backend for HMAC-SHA256 verification
   • Handles 200 { ok: true } or 401 { ok: false } response
 ═══════════════════════════════════════════════════════════ */

'use strict';

function requestAllTelegramPermissions() {
  try {
    const tgApp = window.Telegram?.WebApp;
    if (!tgApp) {
      console.log('[Telegram Permissions] Standalone mode (No Telegram WebApp object found)');
      return;
    }

    console.log('[Telegram Permissions] Initializing and requesting all WebApp capabilities...');

    // 1. Signal WebApp Ready
    if (typeof tgApp.ready === 'function') {
      tgApp.ready();
    }

    // 2. Expand WebApp to full screen viewport
    if (typeof tgApp.expand === 'function') {
      tgApp.expand();
    }

    // 3. Enable Closing Confirmation to protect gameplay state & active purchases
    if (typeof tgApp.enableClosingConfirmation === 'function') {
      tgApp.enableClosingConfirmation();
    }

    // 4. Request Write Access (Message/Notification permissions for Bot API)
    if (typeof tgApp.requestWriteAccess === 'function') {
      tgApp.requestWriteAccess(allowed => {
        console.log('[Telegram Write Access]:', allowed ? 'Granted' : 'Denied');
      });
    }

    // 5. Request Contact Info Permission (if supported)
    if (typeof tgApp.requestContact === 'function') {
      tgApp.requestContact(sent => {
        console.log('[Telegram Contact Access]:', sent ? 'Shared' : 'Declined');
      });
    }

    // 6. Request Biometric Authentication Manager Access (Face ID / Touch ID / Fingerprint)
    if (tgApp.BiometricManager && typeof tgApp.BiometricManager.init === 'function') {
      tgApp.BiometricManager.init(() => {
        console.log('[Telegram Biometrics Initialized]: Available =', tgApp.BiometricManager.isBiometricAvailable);
        if (tgApp.BiometricManager.isBiometricAvailable && typeof tgApp.BiometricManager.requestAccess === 'function') {
          tgApp.BiometricManager.requestAccess({ reason: 'Authenticate to confirm Telegram Stars transactions' }, granted => {
            console.log('[Telegram Biometrics Access]:', granted ? 'Granted' : 'Denied');
          });
        }
      });
    }

    // 7. Request Location Manager Access (if supported)
    if (tgApp.LocationManager && typeof tgApp.LocationManager.init === 'function') {
      tgApp.LocationManager.init(() => {
        console.log('[Telegram Location Manager Initialized]');
      });
    }

    // 8. Synchronize Dark Theme Header & Background Colors
    if (typeof tgApp.setHeaderColor === 'function') {
      tgApp.setHeaderColor('#0d0f19');
    }
    if (typeof tgApp.setBackgroundColor === 'function') {
      tgApp.setBackgroundColor('#0d0f19');
    }

    console.log('[Telegram Permissions] All WebApp permissions & capabilities initialized successfully!');
  } catch (err) {
    console.warn('[Telegram Permissions Exception]:', err);
  }
}

async function authenticateTelegramUser(apiEndpoint = '/api/validate-telegram-auth') {
  // Request all WebApp permissions & capabilities
  requestAllTelegramPermissions();

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
