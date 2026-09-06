/* ==========================================================================
   PAGE: DASHBOARD LOGIC (pages/dashboard/dashboard.js)
   - Displays: Total Player Number, Daily Task Completed Data, Web Task Completed Data
   ========================================================================== */

function initDashboardPage() {
  updateDashboardMetrics();
}

window.addEventListener('usersUpdated', () => {
  updateDashboardMetrics();
});

function updateDashboardMetrics() {
  const users = window.adminState.users || [];

  const totalPlayers = users.length;
  const totalDailyTasks = users.reduce((sum, u) => sum + (Number(u.dailyTasksDone) || 0), 0);
  const totalWebTasks = users.reduce((sum, u) => sum + (Number(u.webTasksDone) || 0), 0);
  const totalAdsButtonCount = users.reduce((sum, u) => sum + (Number(u.adsButtonCount || u.adsWatched) || 0), 0);

  const elPlayers = document.getElementById('dashTotalPlayers');
  const elDaily = document.getElementById('dashDailyTasksCompleted');
  const elWeb = document.getElementById('dashWebTasksCompleted');
  const elAds = document.getElementById('dashAdsButtonCount');

  if (elPlayers) elPlayers.textContent = totalPlayers.toLocaleString();
  if (elDaily) elDaily.textContent = totalDailyTasks.toLocaleString();
  if (elWeb) elWeb.textContent = totalWebTasks.toLocaleString();
  if (elAds) elAds.textContent = totalAdsButtonCount.toLocaleString();
}

document.addEventListener('DOMContentLoaded', initDashboardPage);
