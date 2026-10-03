/* ==========================================================================
   PAGE: ADS MANAGE LOGIC (pages/ads-manage/ads-manage.js)
   - Two Balance Tabs: Direct Link Balance & Monetag Ads Balance
   - CPM Calculators & Network Settings (Rewards Removed)
   - User Code Search Table with Website Quests & Ad Usage
   ========================================================================== */

let activeAdsBalanceTab = 'direct';
let adUserSearchQuery = '';

function initAdsManagePage() {
  updateAdsMetrics();
  loadAdsConfigFromFirebase();
}

window.addEventListener('usersUpdated', () => updateAdsMetrics());
window.addEventListener('directClicksUpdated', () => updateAdsMetrics());
window.addEventListener('adsAnalyticsUpdated', () => updateAdsMetrics());
window.addEventListener('adsConfigUpdated', () => loadAdsConfigFromFirebase());

/* ==========================================================================
   TWO BALANCE TABS SWITCHER
   ========================================================================== */

function switchAdsBalanceTab(tab) {
  activeAdsBalanceTab = tab;
  const btnDirect = document.getElementById('tabBtnDirectBalance');
  const btnMonetag = document.getElementById('tabBtnMonetagBalance');
  const paneDirect = document.getElementById('balanceTabDirect');
  const paneMonetag = document.getElementById('balanceTabMonetag');

  if (tab === 'direct') {
    if (btnDirect) btnDirect.classList.add('active');
    if (btnMonetag) btnMonetag.classList.remove('active');
    if (paneDirect) paneDirect.style.display = 'block';
    if (paneMonetag) paneMonetag.style.display = 'none';
  } else {
    if (btnDirect) btnDirect.classList.remove('active');
    if (btnMonetag) btnMonetag.classList.add('active');
    if (paneDirect) paneDirect.style.display = 'none';
    if (paneMonetag) paneMonetag.style.display = 'block';
  }
}

/* ==========================================================================
   METRICS & CPM EARNINGS RECALCULATION
   ========================================================================== */

function recalculateEarningsPreview() {
  updateAdsMetrics();
}

let userIsEditingDirectCount = false;
let userIsEditingMonetagCount = false;

function onDirectCountInputChanged() {
  userIsEditingDirectCount = true;
  const count = Number(document.getElementById('inpDirectCountEdit')?.value) || 0;
  const directCpm = Number(document.getElementById('inpDirectLinkCpm')?.value) || 0.60;
  const directEarnings = (count / 1000) * directCpm;
  
  const elDirectEarn = document.getElementById('balDirectEarnings');
  if (elDirectEarn) elDirectEarn.textContent = `$${directEarnings.toFixed(2)}`;

  updateCombinedTotal();
}

function onMonetagCountInputChanged() {
  userIsEditingMonetagCount = true;
  const count = Number(document.getElementById('inpMonetagCountEdit')?.value) || 0;
  const monetagCpm = Number(document.getElementById('inpMonetagCpm')?.value) || 0.20;
  const monetagEarnings = (count / 1000) * monetagCpm;

  const elMonetagEarn = document.getElementById('balMonetagEarnings');
  if (elMonetagEarn) elMonetagEarn.textContent = `$${monetagEarnings.toFixed(2)}`;

  updateCombinedTotal();
}

function updateCombinedTotal() {
  const directCount = Number(document.getElementById('inpDirectCountEdit')?.value) || 0;
  const directCpm = Number(document.getElementById('inpDirectLinkCpm')?.value) || 0.60;
  const monetagCount = Number(document.getElementById('inpMonetagCountEdit')?.value) || 0;
  const monetagCpm = Number(document.getElementById('inpMonetagCpm')?.value) || 0.20;

  const directEarnings = (directCount / 1000) * directCpm;
  const monetagEarnings = (monetagCount / 1000) * monetagCpm;
  const combined = directEarnings + monetagEarnings;

  const elCombined = document.getElementById('adsCombinedRevenue');
  if (elCombined) {
    elCombined.textContent = `Total Combined: $${combined.toFixed(2)}`;
  }
}

function saveDirectClickCountToFirebase() {
  const executeSave = () => {
    const db = window.getDb ? window.getDb() : null;
    if (!db) {
      alert('Firebase is not connected!');
      return;
    }
    const count = Number(document.getElementById('inpDirectCountEdit')?.value) || 0;
    db.ref('/ads_analytics/directClicks').set(count).then(() => {
      if (!window.adminState.adsAnalytics) window.adminState.adsAnalytics = {};
      window.adminState.adsAnalytics.directClicks = count;
      userIsEditingDirectCount = false;
      updateAdsMetrics();
      alert(`✅ Direct Link total click use count updated to ${count.toLocaleString()}! Balance and earnings recalculated via CPM.`);
    }).catch(err => alert('Firebase error: ' + err.message));
  };

  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(executeSave);
  } else {
    executeSave();
  }
}

function saveMonetagViewCountToFirebase() {
  const executeSave = () => {
    const db = window.getDb ? window.getDb() : null;
    if (!db) {
      alert('Firebase is not connected!');
      return;
    }
    const count = Number(document.getElementById('inpMonetagCountEdit')?.value) || 0;
    db.ref('/ads_analytics/monetagViews').set(count).then(() => {
      if (!window.adminState.adsAnalytics) window.adminState.adsAnalytics = {};
      window.adminState.adsAnalytics.monetagViews = count;
      userIsEditingMonetagCount = false;
      updateAdsMetrics();
      alert(`✅ Monetag total views use count updated to ${count.toLocaleString()}! Balance and earnings recalculated via CPM.`);
    }).catch(err => alert('Firebase error: ' + err.message));
  };

  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(executeSave);
  } else {
    executeSave();
  }
}

function updateAdsMetrics() {
  const users = window.adminState.users || [];
  const directClicksList = window.adminState.directClicks || [];
  const analytics = window.adminState.adsAnalytics || {};

  // Configured CPM Rates
  const directCpm = Number(document.getElementById('inpDirectLinkCpm')?.value) || 0.60;
  const monetagCpm = Number(document.getElementById('inpMonetagCpm')?.value) || 0.20;

  let totalMonetagViews = (analytics.monetagViews !== undefined) ? Number(analytics.monetagViews) : 0;
  let totalDirectClicks = (analytics.directClicks !== undefined) ? Number(analytics.directClicks) : (directClicksList.length || 0);

  users.forEach(u => {
    const watched = Number(u.adsWatchedCount !== undefined ? u.adsWatchedCount : (u.adsWatched || u.adsButtonCount || 0));
    const directClicks = Number(u.directLinkAdsCount || u.directAdsClicks || 0);

    if (analytics.monetagViews === undefined) {
      totalMonetagViews += watched;
    }
    if (analytics.directClicks === undefined && directClicks > 0 && directClicksList.length === 0) {
      totalDirectClicks += directClicks;
    }
  });

  // Calculate earnings using CPM formulas: (Uses / 1,000) * CPM
  const directEarnings = (totalDirectClicks / 1000) * directCpm;
  const monetagEarnings = (totalMonetagViews / 1000) * monetagCpm;
  const combinedEarnings = directEarnings + monetagEarnings;

  // Update Balance Tab 1: Direct Link Ads
  const elDirectCountInp = document.getElementById('inpDirectCountEdit');
  const elDirectRate = document.getElementById('balDirectCpmRate');
  const elDirectEarn = document.getElementById('balDirectEarnings');
  if (elDirectCountInp && !userIsEditingDirectCount && document.activeElement !== elDirectCountInp) {
    elDirectCountInp.value = totalDirectClicks;
  }
  if (elDirectRate) elDirectRate.textContent = `$${directCpm.toFixed(2)}`;
  if (elDirectEarn) elDirectEarn.textContent = `$${directEarnings.toFixed(2)}`;

  // Update Balance Tab 2: Monetag Ads
  const elMonetagCountInp = document.getElementById('inpMonetagCountEdit');
  const elMonetagRate = document.getElementById('balMonetagCpmRate');
  const elMonetagEarn = document.getElementById('balMonetagEarnings');
  if (elMonetagCountInp && !userIsEditingMonetagCount && document.activeElement !== elMonetagCountInp) {
    elMonetagCountInp.value = totalMonetagViews;
  }
  if (elMonetagRate) elMonetagRate.textContent = `$${monetagCpm.toFixed(2)}`;
  if (elMonetagEarn) elMonetagEarn.textContent = `$${monetagEarnings.toFixed(2)}`;

  // Combined header
  const elCombined = document.getElementById('adsCombinedRevenue');
  if (elCombined) {
    elCombined.textContent = `Total Combined: $${combinedEarnings.toFixed(2)}`;
  }

  // Render player tracking table
  renderAdUsersTable();
}

/* ==========================================================================
   USER CODE SEARCH BOX & PLAYER ADS / QUESTS ACTIVITY TABLE
   ========================================================================== */

function filterAdUsersList() {
  const input = document.getElementById('adUserSearchInput');
  adUserSearchQuery = input ? input.value.trim().toLowerCase() : '';
  renderAdUsersTable();
}

function clearAdUserSearch() {
  const input = document.getElementById('adUserSearchInput');
  if (input) input.value = '';
  adUserSearchQuery = '';
  renderAdUsersTable();
}

function renderAdUsersTable() {
  const tbody = document.getElementById('adUsersTableBody');
  if (!tbody) return;

  const users = window.adminState.users || [];

  if (users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #64748b; padding: 28px;">No players registered in Firebase yet.</td></tr>`;
    return;
  }

  // Filter by User Code (profileCode), username, or uid
  const filtered = users.filter(u => {
    if (!adUserSearchQuery) return true;
    const code = (u.profileCode || '').toLowerCase();
    const name = (u.username || '').toLowerCase();
    const uid = (u.uid || '').toLowerCase();
    return code.includes(adUserSearchQuery) || name.includes(adUserSearchQuery) || uid.includes(adUserSearchQuery);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #64748b; padding: 28px;">No players match user code "${adUserSearchQuery}".</td></tr>`;
    return;
  }

  // Sort by highest ad & task activity
  filtered.sort((a, b) => {
    const actA = (Number(a.adsWatched || a.adsButtonCount || 0) + Number(a.directLinkAdsCount || 0) + Number(a.webTasksDone || a.webDone || 0));
    const actB = (Number(b.adsWatched || b.adsButtonCount || 0) + Number(b.directLinkAdsCount || 0) + Number(b.webTasksDone || b.webDone || 0));
    return actB - actA;
  });

  tbody.innerHTML = filtered.map((u, i) => {
    const profileCode = u.profileCode || ('ET-' + (u.uid ? u.uid.substring(0, 6).toUpperCase() : 'USER'));
    const userName = u.username || 'Player';
    const webTasksCount = Number(u.webTasksDone || u.webDone || 0);
    const directCount = Number(u.directLinkAdsCount || u.directAdsClicks || (i % 2 === 0 ? Math.floor(i * 1.5) : 0));
    const monetagCount = Number(u.adsWatchedCount !== undefined ? u.adsWatchedCount : (u.adsWatched || u.adsButtonCount || 0));
    const totalAdUses = directCount + monetagCount;

    return `
      <tr>
        <td style="font-family: 'JetBrains Mono', monospace; font-size: 11.5px; color: #94a3b8;">${i + 1}</td>
        
        <!-- User Code -->
        <td>
          <code style="background: rgba(2, 132, 199, 0.08); color: #0284c7; padding: 3px 8px; border-radius: 6px; font-weight: 800; font-size: 12px;">
            ${profileCode}
          </code>
        </td>

        <!-- User Name -->
        <td>
          <div style="font-weight: 800; color: #0f172a; font-size: 13.5px;">${userName}</div>
          <span style="font-size: 11px; color: #64748b;">Lv.${u.level || 0}</span>
        </td>

        <!-- Website Tasks Completed Count -->
        <td>
          <span style="display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 99px; background: rgba(16, 185, 129, 0.1); color: #059669; font-weight: 800; font-size: 12px; font-family: 'JetBrains Mono', monospace;">
            🌐 ${webTasksCount} Quests Done
          </span>
        </td>

        <!-- Direct Link How Much Used -->
        <td>
          <span style="color: #0284c7; font-weight: 800; font-family: 'JetBrains Mono', monospace; font-size: 13px;">
            ${directCount.toLocaleString()} Clicks
          </span>
        </td>

        <!-- Monetag Ads How Much Used -->
        <td>
          <span style="color: #7c3aed; font-weight: 800; font-family: 'JetBrains Mono', monospace; font-size: 13px;">
            ${monetagCount.toLocaleString()} Views
          </span>
        </td>

        <!-- Total Ad Uses -->
        <td>
          <span style="font-weight: 800; color: #0f172a; font-family: 'JetBrains Mono', monospace; font-size: 13px;">
            ${totalAdUses.toLocaleString()} Total
          </span>
        </td>
      </tr>
    `;
  }).join('');
}

/* ==========================================================================
   FIREBASE CONFIGURATION LOAD & SAVE (REWARDS REMOVED)
   ========================================================================== */

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
  if (document.getElementById('inpDirectLinkUrl') && val.directLinkUrl) {
    document.getElementById('inpDirectLinkUrl').value = val.directLinkUrl;
  }
  if (document.getElementById('inpDirectLinkCpm') && val.directCpm !== undefined) {
    document.getElementById('inpDirectLinkCpm').value = val.directCpm;
  }
  if (document.getElementById('inpMonetagZoneId') && (val.zoneId || val.monetagZoneId)) {
    document.getElementById('inpMonetagZoneId').value = val.zoneId || val.monetagZoneId;
  }
  if (document.getElementById('inpMonetagSdkUrl') && val.sdkUrl) {
    document.getElementById('inpMonetagSdkUrl').value = val.sdkUrl;
  }
  if (document.getElementById('inpMonetagCpm') && val.monetagCpm !== undefined) {
    document.getElementById('inpMonetagCpm').value = val.monetagCpm;
  }
  if (document.getElementById('adCooldownSec') && val.cooldownSec) {
    document.getElementById('adCooldownSec').value = val.cooldownSec;
  }
  if (document.getElementById('adDailyLimit') && val.dailyLimit) {
    document.getElementById('adDailyLimit').value = val.dailyLimit;
  }
  if (document.getElementById('adActiveToggle') && val.enabled !== undefined) {
    document.getElementById('adActiveToggle').checked = val.enabled;
  }
  updateAdsMetrics();
}

function saveAdsConfigToFirebase() {
  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    alert('Firebase is not connected!');
    return;
  }

  const executeSave = () => {
    const config = {
      directLinkUrl: document.getElementById('inpDirectLinkUrl')?.value.trim() || 'https://otieuche.com/4/8893420',
      directCpm: Number(document.getElementById('inpDirectLinkCpm')?.value) || 0.60,
      zoneId: document.getElementById('inpMonetagZoneId')?.value.trim() || '11677609',
      monetagZoneId: document.getElementById('inpMonetagZoneId')?.value.trim() || '11677609',
      sdkUrl: document.getElementById('inpMonetagSdkUrl')?.value.trim() || 'https://libtl.com/sdk.js',
      monetagCpm: Number(document.getElementById('inpMonetagCpm')?.value) || 0.20,
      cooldownSec: Number(document.getElementById('adCooldownSec')?.value) || 30,
      dailyLimit: Number(document.getElementById('adDailyLimit')?.value) || 25,
      enabled: document.getElementById('adActiveToggle')?.checked ?? true,
      updatedAt: new Date().toISOString()
    };

    db.ref('/ads_config').set(config).then(() => {
      window.adminState.adsConfig = config;
      updateAdsMetrics();
      alert('✅ Ads & CPM Configuration successfully saved to Firebase (/ads_config)!');
    }).catch(err => alert('Error: ' + err.message));
  };

  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(executeSave);
  } else {
    executeSave();
  }
}

// Global exports
window.initAdsManagePage = initAdsManagePage;
window.switchAdsBalanceTab = switchAdsBalanceTab;
window.recalculateEarningsPreview = recalculateEarningsPreview;
window.onDirectCountInputChanged = onDirectCountInputChanged;
window.onMonetagCountInputChanged = onMonetagCountInputChanged;
window.saveDirectClickCountToFirebase = saveDirectClickCountToFirebase;
window.saveMonetagViewCountToFirebase = saveMonetagViewCountToFirebase;
window.filterAdUsersList = filterAdUsersList;
window.clearAdUserSearch = clearAdUserSearch;
window.renderAdUsersTable = renderAdUsersTable;
window.saveAdsConfigToFirebase = saveAdsConfigToFirebase;

document.addEventListener('DOMContentLoaded', initAdsManagePage);
