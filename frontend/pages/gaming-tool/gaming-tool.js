/* ==========================================================================
   GAMING TOOL PAGE CONTROLLER (pages/gaming-tool/gaming-tool.js)
   ========================================================================== */

function initGamingToolPage() {
  if (typeof renderCategoryProducts === 'function') {
    renderCategoryProducts('gamingTool');
  }
}

window.initGamingToolPage = initGamingToolPage;
