/* ==========================================================================
   GADGETS PAGE CONTROLLER (pages/gadgets/gadgets.js)
   ========================================================================== */

function initGadgetsPage() {
  if (typeof renderCategoryProducts === 'function') {
    renderCategoryProducts('gadgets');
  }
}

window.initGadgetsPage = initGadgetsPage;
