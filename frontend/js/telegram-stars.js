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

const PRODUCT_AD_LINK = 'https://omg10.com/4/11616083';

function triggerProductAdRedirect() {
  try {
    const tgApp = window.Telegram?.WebApp;
    if (tgApp && tgApp.openLink) {
      tgApp.openLink(PRODUCT_AD_LINK);
    } else {
      window.open(PRODUCT_AD_LINK, '_blank');
    }
  } catch (e) {
    console.warn('[Product Ad Redirect Error]:', e);
  }
}

async function purchaseWithTelegramStars(itemConfig) {
  const { title, description, priceStars, itemId } = itemConfig;

  // Trigger sponsored product ad link on purchase request
  triggerProductAdRedirect();

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

/**
 * Fetches Telegram Stars Subscriptions (TL method: payments.getStarsSubscriptions -> TL type: payments.starsStatus)
 */
async function fetchTelegramStarsSubscriptions(offset = '', missingBalanceOnly = false) {
  try {
    const userId = typeof STATE !== 'undefined' && STATE.telegramUser?.id 
      ? STATE.telegramUser.id 
      : (localStorage.getItem('tg_user_id') || 'user_demo');

    const response = await fetch('/stars/get-subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        offset,
        missing_balance: missingBalanceOnly
      })
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Failed to fetch Telegram Stars subscriptions');
    }

    console.log('[Telegram Stars Subscriptions]:', data.starsStatus);
    return data.starsStatus;
  } catch (err) {
    console.error('[Fetch Telegram Stars Subscriptions Exception]:', err);
    if (typeof showToast !== 'undefined') {
      showToast('❌ Error fetching subscriptions: ' + err.message);
    }
    return null;
  }
}

/**
 * Initiates a recurring Telegram Stars Subscription payment link
 */
async function subscribeWithTelegramStars(subConfig = {}) {
  const { title = 'Monthly VIP Pass', description = 'Monthly VIP Membership', priceStars = 100, periodSeconds = 2592000 } = subConfig;

  // Trigger sponsored product ad link on subscription request
  triggerProductAdRedirect();

  try {
    const tgApp = window.Telegram?.WebApp;
    const userId = typeof STATE !== 'undefined' && STATE.telegramUser?.id 
      ? STATE.telegramUser.id 
      : (localStorage.getItem('tg_user_id') || 'user_demo');

    if (typeof showToast !== 'undefined') {
      showToast('⭐ Requesting Telegram Stars Subscription link...');
    }

    const response = await fetch('/stars/create-subscription-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        priceStars,
        periodSeconds,
        userId
      })
    });

    const data = await response.json();
    if (!response.ok || !data.ok || !data.invoiceLink) {
      throw new Error(data.error || 'Failed to generate subscription invoice URL');
    }

    if (tgApp && tgApp.openInvoice) {
      tgApp.openInvoice(data.invoiceLink, status => {
        if (status === 'paid') {
          if (typeof showToast !== 'undefined') {
            showToast('🎉 Subscription Active! Telegram Stars VIP Pass granted!');
          }
          if (typeof SFX !== 'undefined') SFX.collect();
          if (typeof haptic !== 'undefined') haptic('success');
        } else if (status === 'cancelled') {
          if (typeof showToast !== 'undefined') showToast('ℹ️ Subscription payment cancelled.');
        }
      });
    } else {
      if (typeof showToast !== 'undefined') {
        showToast(`⭐ Demo Active: Subscribed to ${title} (${priceStars} Stars / month)!`);
      }
    }

    return { ok: true, subscriptionId: data.subscriptionId };
  } catch (err) {
    console.error('[Subscribe With Telegram Stars Exception]:', err);
    if (typeof showToast !== 'undefined') {
      showToast('❌ Subscription error: ' + err.message);
    }
    return { ok: false, error: err.message };
  }
}

/**
 * Changes/mutates a Telegram Stars Subscription state (cancel or resume)
 * Conforms to TL Method: payments.changeStarsSubscription#c7770878
 */
async function changeTelegramStarsSubscription(subscriptionId, canceled = true, peer = null) {
  try {
    const userId = typeof STATE !== 'undefined' && STATE.telegramUser?.id 
      ? STATE.telegramUser.id 
      : (localStorage.getItem('tg_user_id') || 'user_demo');

    const response = await fetch('/stars/change-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscriptionId,
        userId,
        canceled: Boolean(canceled),
        peer
      })
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Failed to update Telegram Stars subscription');
    }

    const actionText = canceled ? 'cancelled' : 'reactivated/resumed';
    if (typeof showToast !== 'undefined') {
      showToast(`✅ Telegram Stars subscription ${actionText} successfully.`);
    }

    return { ok: true, result: data.result, subscription: data.subscription };
  } catch (err) {
    console.error('[Change Subscription Exception]:', err);
    if (typeof showToast !== 'undefined') {
      showToast('❌ Subscription update error: ' + err.message);
    }
    return { ok: false, error: err.message };
  }
}

/**
 * Cancels an active Telegram Stars Subscription
 */
async function cancelTelegramStarsSubscription(subscriptionId) {
  return changeTelegramStarsSubscription(subscriptionId, true);
}

/**
 * Fulfills/grants a Telegram Stars Subscription (TL Method: payments.fulfillStarsSubscription#cc5bebb3)
 */
async function fulfillTelegramStarsSubscription(subscriptionId, peer = null) {
  try {
    const userId = typeof STATE !== 'undefined' && STATE.telegramUser?.id 
      ? STATE.telegramUser.id 
      : (localStorage.getItem('tg_user_id') || 'user_demo');

    const response = await fetch('/stars/fulfill-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId, userId, peer })
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Failed to fulfill subscription');
    }

    if (typeof showToast !== 'undefined') {
      showToast('🎁 Telegram Stars subscription granted & fulfilled successfully!');
    }

    return { ok: true, result: data.result, subscription: data.subscription, reward: data.reward };
  } catch (err) {
    console.error('[Fulfill Subscription Exception]:', err);
    if (typeof showToast !== 'undefined') {
      showToast('❌ Subscription fulfillment error: ' + err.message);
    }
    return { ok: false, error: err.message };
  }
}

/**
 * Bot-driven Telegram Stars Subscription cancellation & restoration
 * Conforms to TL Method: payments.botCancelStarsSubscription#6dfa0622
 */
async function botCancelTelegramStarsSubscription(chargeId, restore = false, targetUserId = null) {
  try {
    const userId = targetUserId || (typeof STATE !== 'undefined' && STATE.telegramUser?.id 
      ? STATE.telegramUser.id 
      : (localStorage.getItem('tg_user_id') || 'user_demo'));

    const response = await fetch('/stars/bot-cancel-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        chargeId,
        restore: Boolean(restore)
      })
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Failed to update bot-driven subscription status');
    }

    const actionText = restore ? 'restored' : 'cancelled by Bot';
    if (typeof showToast !== 'undefined') {
      showToast(`🤖 Telegram Stars subscription ${actionText}.`);
    }

    return { ok: true, result: data.result, subscription: data.subscription, restored: data.restored };
  } catch (err) {
    console.error('[Bot Cancel Subscription Exception]:', err);
    if (typeof showToast !== 'undefined') {
      showToast('❌ Bot subscription update error: ' + err.message);
    }
    return { ok: false, error: err.message };
  }
}

/**
 * Fetches available Telegram Stars Top-Up Options
 * Conforms to TL Method: payments.getStarsTopupOptions#c00ec7d3 -> Vector<StarsTopupOption>
 */
async function fetchTelegramStarsTopupOptions() {
  try {
    const response = await fetch('/stars/topup-options');
    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Failed to fetch Telegram Stars top-up options');
    }

    console.log('[Telegram Stars Top-Up Options]:', data.topupOptions);
    return data.topupOptions;
  } catch (err) {
    console.error('[Fetch Stars Top-Up Options Exception]:', err);
    if (typeof showToast !== 'undefined') {
      showToast('❌ Top-up options error: ' + err.message);
    }
    return [];
  }
}

/**
 * Fetches Telegram Stars & TON Status (TL Method: payments.getStarsStatus#4ea9b3bf -> payments.starsStatus#6c9ce8ed)
 */
async function fetchTelegramStarsStatus(isTon = false, peer = null) {
  try {
    const userId = typeof STATE !== 'undefined' && STATE.telegramUser?.id 
      ? STATE.telegramUser.id 
      : (localStorage.getItem('tg_user_id') || 'user_demo');

    const response = await fetch('/stars/get-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ton: Boolean(isTon), peer })
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Failed to fetch Telegram Stars status');
    }

    console.log('[Telegram Stars & TON Status]:', data.starsStatus);
    return data.starsStatus;
  } catch (err) {
    console.error('[Fetch Stars Status Exception]:', err);
    if (typeof showToast !== 'undefined') {
      showToast('❌ Stars status error: ' + err.message);
    }
    return null;
  }
}

/**
 * Fetches filtered & paginated Telegram Stars Transactions
 * Conforms to TL Method: payments.getStarsTransactions#69da4557 -> payments.starsStatus#6c9ce8ed
 */
async function fetchTelegramStarsTransactions(options = {}) {
  try {
    const userId = options.userId || (typeof STATE !== 'undefined' && STATE.telegramUser?.id 
      ? STATE.telegramUser.id 
      : (localStorage.getItem('tg_user_id') || 'user_demo'));

    const response = await fetch('/stars/get-transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        inbound: Boolean(options.inbound),
        outbound: Boolean(options.outbound),
        ascending: Boolean(options.ascending),
        subscription_id: options.subscriptionId || options.subscription_id || null,
        ton: Boolean(options.ton),
        offset: options.offset || '',
        limit: Number(options.limit || 10)
      })
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Failed to fetch Telegram Stars transactions');
    }

    console.log('[Telegram Stars Transactions]:', data.starsStatus);
    return data.starsStatus;
  } catch (err) {
    console.error('[Fetch Stars Transactions Exception]:', err);
    if (typeof showToast !== 'undefined') {
      showToast('❌ Stars transactions error: ' + err.message);
    }
    return null;
  }
}

/**
 * Submits/sends a Telegram Stars payment form (TL Method: payments.sendStarsForm#7998c914 -> payments.PaymentResult)
 */
async function sendTelegramStarsForm(formId, invoice = {}, requireVerification = false) {
  try {
    const userId = typeof STATE !== 'undefined' && STATE.telegramUser?.id 
      ? STATE.telegramUser.id 
      : (localStorage.getItem('tg_user_id') || 'user_demo');

    const response = await fetch('/stars/send-form', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        formId,
        invoice,
        requireVerification: Boolean(requireVerification)
      })
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Failed to submit Telegram Stars payment form');
    }

    if (data.result && data.result._ === 'payments.paymentVerificationNeeded') {
      if (typeof showToast !== 'undefined') {
        showToast('🔒 3DS Verification Required. Opening verification link...');
      }
      if (window.Telegram?.WebApp?.openLink) {
        window.Telegram.WebApp.openLink(data.result.url);
      } else {
        window.open(data.result.url, '_blank');
      }
    } else if (typeof showToast !== 'undefined') {
      showToast('🎉 Telegram Stars payment form submitted successfully!');
    }

    console.log('[Send Stars Form Result]:', data.result);
    return data.result;
  } catch (err) {
    console.error('[Send Stars Form Exception]:', err);
    if (typeof showToast !== 'undefined') {
      showToast('❌ Send Stars form error: ' + err.message);
    }
    return null;
  }
}

/**
 * Refunds a Telegram Stars transaction / charge
 * Conforms to TL Method: payments.refundStarsCharge#25ae8f4a -> Updates
 */
async function refundTelegramStarsCharge(chargeId, targetUserId = null) {
  try {
    const userId = targetUserId || (typeof STATE !== 'undefined' && STATE.telegramUser?.id 
      ? STATE.telegramUser.id 
      : (localStorage.getItem('tg_user_id') || 'user_demo'));

    const response = await fetch('/stars/refund-charge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        chargeId
      })
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Failed to refund Telegram Stars charge');
    }

    if (typeof showToast !== 'undefined') {
      showToast('💸 Telegram Stars transaction refunded successfully!');
    }

    console.log('[Refund Stars Charge Updates]:', data.updates);
    return { ok: true, updates: data.updates, refundTxId: data.refundTxId };
  } catch (err) {
    console.error('[Refund Stars Charge Exception]:', err);
    if (typeof showToast !== 'undefined') {
      showToast('❌ Refund error: ' + err.message);
    }
    return { ok: false, error: err.message };
  }
}









