/* ==========================================================================
   PAGE: SETTINGS LOGIC (pages/settings/settings.js)
   ========================================================================== */

function reconnectFirebase() {
  if (window.initFirebase) {
    window.initFirebase();
    alert('Firebase connection refreshed!');
  }
}

window.reconnectFirebase = reconnectFirebase;
