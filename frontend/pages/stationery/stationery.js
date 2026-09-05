/* ==========================================================================
   STATIONERY PAGE CONTROLLER (pages/stationery/stationery.js)
   ========================================================================== */

function initStationeryPage() {
  if (typeof renderCategoryProducts === 'function') {
    renderCategoryProducts('stationery');
  }
}

window.initStationeryPage = initStationeryPage;
