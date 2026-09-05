/* ==========================================================================
   KITCHEN PAGE CONTROLLER (pages/kitchen/kitchen.js)
   ========================================================================== */

function initKitchenPage() {
  if (typeof renderCategoryProducts === 'function') {
    renderCategoryProducts('kitchen');
  }
}

window.initKitchenPage = initKitchenPage;
