/* ==========================================================================
   FITNESS PAGE CONTROLLER (pages/fitness/fitness.js)
   ========================================================================== */

function initFitnessPage() {
  if (typeof renderCategoryProducts === 'function') {
    renderCategoryProducts('fitness');
  }
}

window.initFitnessPage = initFitnessPage;
