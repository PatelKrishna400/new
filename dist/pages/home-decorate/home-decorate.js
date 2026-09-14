/* ==========================================================================
   HOME DECORATE PAGE CONTROLLER (pages/home-decorate/home-decorate.js)
   ========================================================================== */

function initHomeDecoratePage() {
  if (typeof renderCategoryProducts === 'function') {
    renderCategoryProducts('homeDecorate');
  }
}

window.initHomeDecoratePage = initHomeDecoratePage;
