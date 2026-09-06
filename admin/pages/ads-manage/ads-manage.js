/* ==========================================================================
   PAGE: ADS MANAGE LOGIC (pages/ads-manage/ads-manage.js)
   ========================================================================== */

function initAdsManagePage() {
  updateAdsMetrics();
  loadAdsConfigFromFirebase();
}

window.addEventListener('usersUpdated', () => {
  updateAdsMetrics();
});

function updateAdsMetrics() {
  const users = window.adminState.users || [];
  
  // Calculate total ads watched across all players
  let totalWatched = 0;
  let viewersCount = 0;
  const viewersList = [];

  users.forEach(u => {
    const watched = u.tasksCount || Math.floor((u.level || 1) * 3.5);
    if (watched > 0) {
      totalWatched += watched;
      viewersCount++;
      viewersList.push({
        username: u.username,
        watched: watched,
        coinsEarned: watched * 500,
        diamondsEarned: watched * 5
      });
    }
  });

  // Est revenue based on ~$1.80 eCPM
  const estRev = ((totalWatched / 1000) * 1.80).toFixed(2);

  const elWatched = document.getElementById('adsTotalWatched');
  const elRev = document.getElementById('adsEstRevenue');
  const elViewers = document.getElementById('adsUniqueViewers');

  if (elWatched) elWatched.textContent = totalWatched.toLocaleString();
  if (elRev) elRev.textContent = `$${estRev}`;
  if (elViewers) elViewers.textContent = viewersCount.toLocaleString();

  // Render Table
  renderTopAdViewers(viewersList);
}

function renderTopAdViewers(list) {
  const tbody = document.getElementById('adViewersTableBody');
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #64748b; padding: 20px;">No ad watch data recorded yet.</td></tr>`;
    return;
  }

  list.sort((a, b) => b.watched - a.watched);
  const top10 = list.slice(0, 10);

  let html = '';
  top10.forEach((item, i) => {
    html += `
      <tr>
        <td style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #64748b;">#${i + 1}</td>
        <td style="font-weight: 800; color: #f8fafc;">${item.username}</td>
        <td style="color: #fbbf24; font-weight: 800; font-family: 'JetBrains Mono', monospace;">${item.watched} ads</td>
        <td style="color: #38bdf8; font-family: 'JetBrains Mono', monospace;">+${item.coinsEarned.toLocaleString()} 🪙</td>
        <td style="color: #22d3ee; font-family: 'JetBrains Mono', monospace;">+${item.diamondsEarned.toLocaleString()} 💎</td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

function loadAdsConfigFromFirebase() {
  const db = window.getDb ? window.getDb() : null;
  if (!db) return;

  db.ref('/ads_config').once('value').then(snap => {
    const val = snap.val();
    if (val) {
      if (document.getElementById('adZoneId') && val.zoneId) document.getElementById('adZoneId').value = val.zoneId;
      if (document.getElementById('adSdkUrl') && val.sdkUrl) document.getElementById('adSdkUrl').value = val.sdkUrl;
      if (document.getElementById('adRewardCoins') && val.rewardCoins) document.getElementById('adRewardCoins').value = val.rewardCoins;
      if (document.getElementById('adRewardDiamonds') && val.rewardDiamonds) document.getElementById('adRewardDiamonds').value = val.rewardDiamonds;
      if (document.getElementById('adCooldownSec') && val.cooldownSec) document.getElementById('adCooldownSec').value = val.cooldownSec;
      if (document.getElementById('adDailyLimit') && val.dailyLimit) document.getElementById('adDailyLimit').value = val.dailyLimit;
      if (document.getElementById('adActiveToggle') && val.enabled !== undefined) document.getElementById('adActiveToggle').checked = val.enabled;
    }
  }).catch(() => {});
}

function saveAdsConfigToFirebase() {
  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    alert('Firebase is not connected!');
    return;
  }

  const config = {
    zoneId: document.getElementById('adZoneId')?.value.trim() || '11677609',
    sdkUrl: document.getElementById('adSdkUrl')?.value.trim() || 'https://libtl.com/sdk.js',
    rewardCoins: Number(document.getElementById('adRewardCoins')?.value) || 500,
    rewardDiamonds: Number(document.getElementById('adRewardDiamonds')?.value) || 5,
    cooldownSec: Number(document.getElementById('adCooldownSec')?.value) || 30,
    dailyLimit: Number(document.getElementById('adDailyLimit')?.value) || 25,
    enabled: document.getElementById('adActiveToggle')?.checked ?? true,
    updatedAt: new Date().toISOString()
  };

  db.ref('/ads_config').set(config).then(() => {
    alert('Ads configuration saved to Firebase (/ads_config)!');
  }).catch(err => alert('Error: ' + err.message));
}

window.initAdsManagePage = initAdsManagePage;
window.saveAdsConfigToFirebase = saveAdsConfigToFirebase;

document.addEventListener('DOMContentLoaded', initAdsManagePage);
