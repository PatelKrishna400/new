/* ═══════════════════════════════════
   TAP EMPIRE — Telegram WebApp
═══════════════════════════════════ */

'use strict';

const TG = window.Telegram?.WebApp || null;

function initTelegram() {
  if (!TG) {
    console.warn('[Telegram] Running outside Telegram — demo mode');
    STATE.tgUser = { id: 0, first_name: 'Demo', username: 'demo_user', photo_url: null };
    return;
  }
  TG.ready();
  TG.expand();
  TG.setHeaderColor && TG.setHeaderColor('#0B1020');
  TG.setBackgroundColor && TG.setBackgroundColor('#0B1020');

  const u = TG.initDataUnsafe?.user;
  STATE.tgUser = u
    ? { id: u.id, first_name: u.first_name, username: u.username || null, photo_url: u.photo_url || null }
    : { id: 0, first_name: 'Player', username: null, photo_url: null };
  /*
    SECURITY NOTE:
    TG.initDataUnsafe is UNTRUSTED on the client.
    For financial operations, always send TG.initData (the raw string)
    to your backend, which validates the HMAC-SHA256 signature using
    your bot token. Only after server validation should any reward,
    withdrawal, or payment be processed.
  */
}

function getInitData() {
  return TG?.initData || '';
}

function haptic(type = 'light') {
  try {
    const h = TG?.HapticFeedback;
    if (!h) return;
    if (type === 'light')   h.impactOccurred('light');
    if (type === 'medium')  h.impactOccurred('medium');
    if (type === 'heavy')   h.impactOccurred('heavy');
    if (type === 'success') h.notificationOccurred('success');
    if (type === 'warning') h.notificationOccurred('warning');
    if (type === 'error')   h.notificationOccurred('error');
  } catch (_) {}
}

function openTelegramLink(url) {
  if (TG?.openTelegramLink) TG.openTelegramLink(url);
  else window.open(url, '_blank');
}

function openExternalLink(url) {
  if (TG?.openLink) TG.openLink(url, { try_instant_view: false });
  else window.open(url, '_blank');
}

function openInvoice(url, callback) {
  if (TG?.openInvoice) {
    TG.openInvoice(url, callback);
  } else {
    showToast('⚠️ Stars payment requires Telegram Mini App');
  }
}

function getReferralParam() {
  return TG?.initDataUnsafe?.start_param ||
    new URLSearchParams(window.location.search).get('start') || null;
}
