/* ==========================================================================
   ACCESSORIES PAGE CONTROLLER (pages/accessories/accessories.js)
   ========================================================================== */

function initAccessoriesPage() {
  if (typeof renderCategoryProducts === 'function') {
    renderCategoryProducts('accessories');
  }
}

window.initAccessoriesPage = initAccessoriesPage;
