/* ═══════════════════════════════════════════════════════════
   TAP EMPIRE — Telegram Stars (XTR) Premium Shop (Redesigned)
   • Header: 💎 PREMIUM SHOP
   • Subtitle: Upgrade your game with ⭐ Telegram Stars.
   • Hero Product: 🔥 SUPER TAP BOOST (2× Tap Power 30m, ⭐ 50)
   • Product Grid:
     - ⚡ ENERGY PACK (+500 Energy, ⭐ 25)
     - 🎁 PREMIUM CHEST (Rare rewards, ⭐ 75)
     - 🔥 SUPER BOOST (2× Tap 30 min, ⭐ 100)
     - 💎 PREMIUM SKIN (Exclusive visual, ⭐ 150)
   • Visuals: Distinct ⭐ Stars styling (never looks like coins 💰)
   • Backend-authoritative: Item granted only after Telegram confirmation
═══════════════════════════════════════════════════════════ */

'use strict';

const STARS_PRODUCTS = {
  hero: {
    id: 'super_tap_50',
    name: 'SUPER TAP BOOST',
    desc: '2× Tap Power • 30 Minutes',
    price: 50,
    icon: '🔥',
    isHero: true
  },
  grid: [
    { id: 'energy_25',   name: 'ENERGY PACK',   desc: '+500 Energy',      price: 25,  icon: '⚡' },
    { id: 'chest_75',    name: 'PREMIUM CHEST', desc: 'Rare rewards',     price: 75,  icon: '🎁' },
    { id: 'boost_100',   name: 'SUPER BOOST',   desc: '2× Tap • 30 min',  price: 100, icon: '🔥' },
    { id: 'skin_150',    name: 'PREMIUM SKIN',  desc: 'Exclusive visual', price: 150, icon: '💎' },
  ]
};

const StarsShop = {
  items: STARS_PRODUCTS,
  openModal: openStarsShopModal,
  buyItem: handleStarsPurchase
};

function openStarsShopModal() {
  const hero = STARS_PRODUCTS.hero;
  const grid = STARS_PRODUCTS.grid;

  showModal(`
    <div class="stars-shop-modal-container">
      
      <!-- Header -->
      <div class="stars-shop-header">
        <div class="stars-shop-title">💎 PREMIUM SHOP</div>
        <div class="stars-shop-subtitle">Upgrade your game with ⭐ Telegram Stars.</div>
      </div>

      <!-- Hero Product Card -->
      <div class="stars-hero-card">
        <div class="hero-badge">HERO OFFER</div>
        <div class="hero-card-content">
          <div class="hero-card-left">
            <div class="hero-icon stars-icon-idle-float">${hero.icon}</div>
          </div>
          <div class="hero-card-right">
            <div class="hero-product-name">${hero.name}</div>
            <div class="hero-product-desc">${hero.desc}</div>
            <div class="hero-product-price">⭐ ${hero.price} Stars</div>
            <button class="btn btn-stars-buy btn-hero-buy" onclick="handleStarsPurchase(event, '${hero.id}')">
              ⭐ BUY NOW
            </button>
          </div>
        </div>
      </div>

      <!-- Product Grid (2 columns) -->
      <div class="stars-grid">
        ${grid.map(p => `
          <div class="stars-grid-card">
            <div class="grid-card-icon stars-icon-idle-float">${p.icon}</div>
            <div class="grid-card-name">${p.name}</div>
            <div class="grid-card-desc">${p.desc}</div>
            <div class="grid-card-price">⭐ ${p.price} Stars</div>
            <button class="btn btn-stars-buy btn-grid-buy" onclick="handleStarsPurchase(event, '${p.id}')">
              ⭐ BUY
            </button>
          </div>
        `).join('')}
      </div>

    </div>
  `);
}

async function handleStarsPurchase(e, productId) {
  const btn = e ? e.currentTarget : null;
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '⏳ Loading…';
  }

  showToast('⌛ Creating Telegram Stars invoice…');

  try {
    let invoiceLink = null;
    if (typeof callAPI === 'function') {
      const res = await callAPI('/stars/create-invoice', { itemId: productId });
      invoiceLink = res?.invoiceLink;
    }

    if (!invoiceLink) {
      invoiceLink = `https://t.me/invoice/test_${productId}`;
    }

    if (window.Telegram?.WebApp?.openInvoice) {
      window.Telegram.WebApp.openInvoice(invoiceLink, (status) => {
        if (status === 'paid') {
          SFX.levelUp();
          haptic('success');
          showToast('✨ Purchase Successful! Item Granted.', 'success');
          setTimeout(() => reloadPlayer(), 1200);
        } else if (status === 'cancelled') {
          showToast('⚠️ Payment cancelled', 'error');
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = '⭐ BUY';
          }
        } else {
          showToast(`⚠️ Payment status: ${status}`, 'error');
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = '⭐ BUY';
          }
        }
      });
    } else {
      window.open(invoiceLink, '_blank');
      showToast('⭐ Invoice opened. Complete payment in Telegram!');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '⭐ BUY';
      }
    }
  } catch (err) {
    console.warn('[StarsShop]', err.message);
    showToast(`⚠️ Invoice error: ${err.message}`, 'error');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '⭐ BUY';
    }
  }
}
