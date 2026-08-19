/* ═══════════════════════════════════════════════════════════
   TAP GAME — Telegram Stars Client Payment Engine (js/telegram-stars.js)
   
   Client                     Backend (Cloud Function)       Telegram
     │                               │                           │
     ├─ POST /stars/create-invoice ─►│                           │
     │                               ├─ createInvoiceLink ──────►│
     │◄─ { invoiceLink } ────────────┤◄─ invoice URL ────────────┤
     │                               │                           │
     ├─ TG.openInvoice(invoiceLink) ─────────────────────────────►
     │                               │                           │
     │◄─ pre_checkout_query ─────────────────────────────────────┤
     │                               │◄─ pre_checkout_query ─────┤
     │                               ├─ answerPreCheckoutQuery ──►│
     │                               │                           │
     │                               │◄─ successful_payment ─────┤
     │                               ├─ grantStarsItem() (Database transaction)
     │◄─ Bot message: "Purchase OK" ─┤
 ═══════════════════════════════════════════════════════════ */

'use strict';

async function purchaseWithTelegramStars(itemConfig) {
  const { title, description, priceStars, itemId } = itemConfig;

  try {
    const tgApp = window.Telegram?.WebApp;

    if (!tgApp || !tgApp.openInvoice) {
      if (typeof showToast !== 'undefined') {
        showToast(`⭐ Standalone / Demo: Purchased ${title} (${priceStars} Stars)!`);
      }
      if (itemId && itemId.includes('spins') && typeof STATE !== 'undefined') {
        STATE.goals.ticketsBalance = (STATE.goals.ticketsBalance || 0) + 10;
      } else if (itemId && itemId.includes('keys') && typeof STATE !== 'undefined') {
        STATE.goals.keysBalance = (STATE.goals.keysBalance || 0) + 10;
      }
      if (typeof updateUI !== 'undefined') updateUI();
      return { ok: true, demo: true };
    }

    if (typeof showToast !== 'undefined') {
      showToast('⭐ Requesting Telegram Stars invoice link...');
    }

    // 1. POST /stars/create-invoice to request invoice URL
    const response = await fetch('/stars/create-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        priceStars,
        itemId,
        userId: STATE?.telegramUser?.id || localStorage.getItem('tg_user_id')
      })
    });

    const data = await response.json();

    if (!response.ok || !data.ok || !data.invoiceLink) {
      throw new Error(data.error || 'Failed to generate invoice URL');
    }

    // 2. Open Telegram Native Payment Drawer: TG.openInvoice(invoiceLink)
    tgApp.openInvoice(data.invoiceLink, status => {
      console.log('[Telegram Stars Payment] Callback status:', status);
      if (status === 'paid') {
        if (typeof showToast !== 'undefined') {
          showToast('🎉 Purchase OK! Telegram Stars item granted successfully!');
        }
        if (typeof SFX !== 'undefined') SFX.collect();
        if (typeof haptic !== 'undefined') haptic('success');
      } else if (status === 'cancelled') {
        if (typeof showToast !== 'undefined') {
          showToast('ℹ️ Telegram Stars payment was cancelled.');
        }
      } else {
        if (typeof showToast !== 'undefined') {
          showToast('⚠️ Payment status: ' + status);
        }
      }
    });

    return { ok: true };
  } catch (err) {
    console.error('[Telegram Stars Payment Exception]:', err);
    if (typeof showToast !== 'undefined') {
      showToast('❌ Stars payment error: ' + err.message);
    }
    return { ok: false, error: err.message };
  }
}
