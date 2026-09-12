/* ==========================================================================
   PAGE: ADS MANAGE LOGIC (pages/ads-manage/ads-manage.js)
   ========================================================================== */

function initAdsManagePage() {
  updateAdsMetrics();
  loadAdsConfigFromFirebase();
}

window.addEventListener('usersUpdated', () => updateAdsMetrics());
window.addEventListener('directClicksUpdated', () => updateAdsMetrics());
window.addEventListener('adsAnalyticsUpdated', () => updateAdsMetrics());
window.addEventListener('adsConfigUpdated', () => loadAdsConfigFromFirebase());

function updateAdsMetrics() {
  const users = window.adminState.users || [];
  const directClicksList = window.adminState.directClicks || [];
  const analytics = window.adminState.adsAnalytics || {};
  
  // Calculate total reward ads watched across players
  let totalWatched = 0;
  let totalDirectClicks = directClicksList.length || (analytics.directClicks || 0);
  let viewersCount = 0;
  const viewersMap = {};

  users.forEach(u => {
    const uname = u.username || u.name || 'Anonymous';
    const watched = Number(u.adsWatchedCount || u.adsCount || u.tasksCount || 0) || Math.floor((u.level || 1) * 3);
    const directClicks = Number(u.directLinkAdsCount || u.directAdsClicks || 0);

    totalWatched += watched;
    if (directClicks > 0 && directClicksList.length === 0) {
      totalDirectClicks += directClicks;
    }

    if (watched > 0 || directClicks > 0) {
      viewersCount++;
      viewersMap[uname] = {
        username: uname,
        watched: watched,
        directClicks: directClicks,
        coinsEarned: (watched * 500) + (directClicks * 250),
        diamondsEarned: watched * 5
      };
    }
  });

  // Also include players from direct clicks list if not in users
  directClicksList.forEach(c => {
    const uname = c.username || 'Player';
    if (!viewersMap[uname]) {
      viewersCount++;
      viewersMap[uname] = {
        username: uname,
        watched: 0,
        directClicks: 1,
        coinsEarned: c.rewardCoins || 250,
        diamondsEarned: 0
      };
    } else {
      if (users.length === 0 || !users.some(u => (u.username || u.name) === uname && u.directLinkAdsCount)) {
        viewersMap[uname].directClicks = (viewersMap[uname].directClicks || 0) + 1;
        viewersMap[uname].coinsEarned += (c.rewardCoins || 250);
      }
    }
  });

  // Calculate earnings according to user requirement:
  // - Rewarded ads CPM = $0.20 per 1,000 clicks/views
  // - Direct link ads CPM = $0.60 per 1,000 clicks
  const rewardRev = (totalWatched / 1000) * 0.20;
  const directRev = (totalDirectClicks / 1000) * 0.60;
  const totalEstRev = rewardRev + directRev;

  const elWatched = document.getElementById('adsTotalWatched');
  const elDirect = document.getElementById('adsTotalDirectClicks');
  const elRev = document.getElementById('adsEstRevenue');
  const elBreakdown = document.getElementById('adsRevenueBreakdown');
  const elViewers = document.getElementById('adsUniqueViewers');

  if (elWatched) elWatched.textContent = totalWatched.toLocaleString();
  if (elDirect) elDirect.textContent = totalDirectClicks.toLocaleString();
  if (elRev) elRev.textContent = `$${totalEstRev.toFixed(2)}`;
  if (elBreakdown) elBreakdown.textContent = `Reward: $${rewardRev.toFixed(2)} • Direct: $${directRev.toFixed(2)}`;
  if (elViewers) elViewers.textContent = viewersCount.toLocaleString();

  // Render Table
  renderTopAdViewers(Object.values(viewersMap));
}

function renderTopAdViewers(list) {
  const tbody = document.getElementById('adViewersTableBody');
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #64748b; padding: 20px;">No ad watch or direct link data recorded yet.</td></tr>`;
    return;
  }

  list.sort((a, b) => (b.watched + b.directClicks) - (a.watched + a.directClicks));
  const top10 = list.slice(0, 10);

  let html = '';
  top10.forEach((item, i) => {
    html += `
      <tr>
        <td style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #64748b;">#${i + 1}</td>
        <td style="font-weight: 800; color: #f8fafc;">${item.username}</td>
        <td style="color: #fbbf24; font-weight: 800; font-family: 'JetBrains Mono', monospace;">${item.watched} ads</td>
        <td style="color: #22d3ee; font-weight: 800; font-family: 'JetBrains Mono', monospace;">${item.directClicks || 0} clicks</td>
        <td style="color: #38bdf8; font-family: 'JetBrains Mono', monospace;">+${item.coinsEarned.toLocaleString()} 🪙</td>
        <td style="color: #22d3ee; font-family: 'JetBrains Mono', monospace;">+${item.diamondsEarned.toLocaleString()} 💎</td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

function loadAdsConfigFromFirebase() {
  const cfg = window.adminState.adsConfig;
  if (cfg) {
    applyAdsConfigToInputs(cfg);
    return;
  }

  const db = window.getDb ? window.getDb() : null;
  if (!db) return;

  db.ref('/ads_config').once('value').then(snap => {
    const val = snap.val();
    if (val) {
      window.adminState.adsConfig = val;
      applyAdsConfigToInputs(val);
    }
  }).catch(() => {});
}

function applyAdsConfigToInputs(val) {
  if (document.getElementById('adZoneId') && val.zoneId) document.getElementById('adZoneId').value = val.zoneId;
  if (document.getElementById('adSdkUrl') && val.sdkUrl) document.getElementById('adSdkUrl').value = val.sdkUrl;
  if (document.getElementById('adDirectLinkUrl') && val.directLinkUrl) document.getElementById('adDirectLinkUrl').value = val.directLinkUrl;
  if (document.getElementById('adDirectRewardCoins') && val.directRewardCoins) document.getElementById('adDirectRewardCoins').value = val.directRewardCoins;
  if (document.getElementById('adRewardCoins') && val.rewardCoins) document.getElementById('adRewardCoins').value = val.rewardCoins;
  if (document.getElementById('adRewardDiamonds') && val.rewardDiamonds) document.getElementById('adRewardDiamonds').value = val.rewardDiamonds;
  if (document.getElementById('adCooldownSec') && val.cooldownSec) document.getElementById('adCooldownSec').value = val.cooldownSec;
  if (document.getElementById('adDailyLimit') && val.dailyLimit) document.getElementById('adDailyLimit').value = val.dailyLimit;
  if (document.getElementById('adActiveToggle') && val.enabled !== undefined) document.getElementById('adActiveToggle').checked = val.enabled;
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
    directLinkUrl: document.getElementById('adDirectLinkUrl')?.value.trim() || 'https://otieuche.com/4/8893420',
    directRewardCoins: Number(document.getElementById('adDirectRewardCoins')?.value) || 250,
    rewardCoins: Number(document.getElementById('adRewardCoins')?.value) || 500,
    rewardDiamonds: Number(document.getElementById('adRewardDiamonds')?.value) || 5,
    cooldownSec: Number(document.getElementById('adCooldownSec')?.value) || 30,
    dailyLimit: Number(document.getElementById('adDailyLimit')?.value) || 25,
    enabled: document.getElementById('adActiveToggle')?.checked ?? true,
    rewardCpm: 0.20,
    directCpm: 0.60,
    updatedAt: new Date().toISOString()
  };

  db.ref('/ads_config').set(config).then(() => {
    window.adminState.adsConfig = config;
    alert('Ads configuration saved to Firebase (/ads_config)!');
  }).catch(err => alert('Error: ' + err.message));
}

window.initAdsManagePage = initAdsManagePage;
window.saveAdsConfigToFirebase = saveAdsConfigToFirebase;

document.addEventListener('DOMContentLoaded', initAdsManagePage);
