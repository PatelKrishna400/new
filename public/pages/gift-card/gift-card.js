/* ==========================================================================
   GIFT CARD PAGE CONTROLLER (pages/gift-card/gift-card.js)
   ========================================================================== */

function initGiftCardPage() {
  if (typeof renderCategoryProducts === 'function') {
    renderCategoryProducts('giftCard');
  }
}

window.initGiftCardPage = initGiftCardPage;
