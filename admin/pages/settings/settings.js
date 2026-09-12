/* ==========================================================================
   PAGE: SETTINGS LOGIC (pages/settings/settings.js)
   ========================================================================== */

function reconnectFirebase() {
  if (window.initFirebase) {
    window.initFirebase();
    alert('Firebase connection refreshed!');
  }
}

function triggerGlobalSeasonReset() {
  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    alert('Firebase is not connected!');
    return;
  }

  if (!confirm('⚠️ Are you sure you want to trigger a GLOBAL Season Restart?\n\nThis will send a signal to all connected players via Firebase (/season) to reset their XP and Goal progress to Level 0, restore all level claim data, and initialize a new 30-day season cycle so each player can climb and claim rewards level-wise!')) {
    return;
  }

  const now = Date.now();
  db.ref('/season').set({
    seasonNumber: now,
    seasonDurationDays: 30,
    seasonStartTime: now,
    forceRestartTimestamp: now
  }).then(() => {
    alert('🚀 Global 30-day season reset published to Firebase (/season)!\nConnected players will now restore level claims and start from Level 0.');
  }).catch(err => alert('Error triggering season reset: ' + err.message));
}

function triggerMonthlyCompetitionReset() {
  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    alert('Firebase is not connected!');
    return;
  }

  if (!confirm('🏆 Restart the 30-Day Monthly Task Competition (/monthly_competition)?\n\nThis will start a fresh 30-day cycle for monthly tasks in Firebase backend!')) {
    return;
  }

  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  db.ref('/monthly_competition').set({
    cycleNumber: 1,
    startTime: now,
    endTime: now + thirtyDays,
    lastUpdated: now,
    active: true
  }).then(() => {
    alert('🏆 Monthly Task Competition reset to 30 days in Firebase backend!');
  }).catch(err => alert('Error resetting monthly competition: ' + err.message));
}

window.reconnectFirebase = reconnectFirebase;
window.triggerGlobalSeasonReset = triggerGlobalSeasonReset;
window.triggerMonthlyCompetitionReset = triggerMonthlyCompetitionReset;

