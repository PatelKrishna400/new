/* ==========================================================================
   PAGE: USERS LOGIC (pages/users/users.js)
   - Primary View (Tab 1): All Users List & Search Bar showing:
     * User Name
     * Code (Profile Code)
     * Telegram Account
     * Ads Count Balance
     * "More Detail" button
   - Secondary View (Tab 2): More Detail (Comprehensive 14 Core Metrics):
     1. Energy
     2. Count Taps
     3. XP Level
     4. Goal Level
     5. Monthly Task Complete
     6. Telegram Task Completed
     7. Website Task Completed
     8. Key
     9. Egg
     10. Card (Scratch Cards)
     11. Ticket
     12. Diamond
     13. Coin
     14. Blue Coin
     + Strict Uniqueness Security (Code, Username, Telegram, Mobile)
   - Multiple user support: data changes dynamically by Profile Code
   ========================================================================== */

let activeUserUid = null;
let currentViewMode = 'list'; // 'list' | 'detail'

window.addEventListener('usersUpdated', () => {
  refreshUsersUI();
});

document.addEventListener('DOMContentLoaded', () => {
  refreshUsersUI();
});

// Refresh whole page UI when Firebase data arrives
function refreshUsersUI() {
  populateUserDropdown();
  renderUsersTable();

  const users = window.adminState?.users || [];
  
  // Total users badge in navigation pill
  const pillCount = document.getElementById('pillTotalUsersCount');
  if (pillCount) pillCount.textContent = users.length;

  // Header quick summary counters
  const sumPlayers = document.getElementById('summaryTotalPlayers');
  if (sumPlayers) sumPlayers.textContent = users.length;

  const sumAds = document.getElementById('summaryTotalAds');
  if (sumAds) {
    const totalAds = users.reduce((acc, u) => acc + (Number(u.adsWatched) || 0), 0);
    sumAds.textContent = `${totalAds.toLocaleString()} 🎬`;
  }

  if (users.length > 0) {
    const existing = users.find(u => u.uid === activeUserUid);
    if (existing) {
      renderUserProfileInspector(existing);
    } else {
      activeUserUid = users[0].uid;
      renderUserProfileInspector(users[0]);
    }
  } else {
    renderEmptyInspectorState();
  }
}

// Populate the user selector dropdown
function populateUserDropdown() {
  const select = document.getElementById('profileUserDropdown');
  if (!select) return;

  const users = window.adminState?.users || [];
  if (users.length === 0) {
    select.innerHTML = '<option value="">No players in Firebase</option>';
    return;
  }

  let html = '';
  users.forEach(u => {
    const isSelected = u.uid === activeUserUid ? 'selected' : '';
    html += `<option value="${u.uid}" ${isSelected}>[${u.profileCode}] ${u.username} (🎬 ${u.adsWatched || 0} Ads • Lv.${u.level})</option>`;
  });
  select.innerHTML = html;
}

// Switch between All Users List and More Detail View
function setUserViewMode(mode) {
  currentViewMode = mode;
  const listBtn = document.getElementById('btnViewList');
  const detailBtn = document.getElementById('btnViewDetail');
  const listContainer = document.getElementById('userListTabContainer');
  const detailContainer = document.getElementById('userDetailTabContainer');

  if (mode === 'detail') {
    listBtn?.classList.remove('active');
    detailBtn?.classList.add('active');
    listContainer?.classList.remove('active');
    detailContainer?.classList.add('active');
  } else {
    listBtn?.classList.add('active');
    detailBtn?.classList.remove('active');
    listContainer?.classList.add('active');
    detailContainer?.classList.remove('active');
  }
}

// OPEN USER MORE DETAIL (Called from the "More Detail" button in the table)
function openUserMoreDetail(uid) {
  const users = window.adminState?.users || [];
  const user = users.find(u => u.uid === uid);
  if (!user) return;

  activeUserUid = uid;

  // Sync inputs and dropdowns
  const inputEl = document.getElementById('profileCodeInput');
  if (inputEl) inputEl.value = user.profileCode || user.uid;

  const selectEl = document.getElementById('profileUserDropdown');
  if (selectEl) selectEl.value = user.uid;

  const topLabel = document.getElementById('topActiveUserLabel');
  if (topLabel) topLabel.textContent = `${user.username} (${user.profileCode})`;

  renderUserProfileInspector(user);
  setUserViewMode('detail');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Load player when user types or pastes Profile Code / UID into input
function loadUserByProfileCodeInput() {
  const inputEl = document.getElementById('profileCodeInput');
  if (!inputEl) return;
  const query = inputEl.value.trim().toLowerCase();
  if (!query) {
    alert('Please enter a Profile Code, UID, or Username to search.');
    return;
  }

  const users = window.adminState?.users || [];
  const found = users.find(u => {
    const code = (u.profileCode || '').toLowerCase();
    const uid = (u.uid || '').toLowerCase();
    const name = (u.username || '').toLowerCase();
    return code === query || uid === query || name === query || code.includes(query) || uid.includes(query) || name.includes(query);
  });

  if (found) {
    openUserMoreDetail(found.uid);
  } else {
    alert(`⚠️ Player not found with Profile Code or UID: "${query}".\nCheck the spelling or pick from the dropdown.`);
  }
}

// When dropdown selection changes
function onUserDropdownChange() {
  const select = document.getElementById('profileUserDropdown');
  if (!select) return;
  const uid = select.value;
  if (uid) {
    openUserMoreDetail(uid);
  }
}

// Navigate to previous or next user
function navigateUserStep(direction) {
  const users = window.adminState?.users || [];
  if (users.length === 0) return;

  let currentIndex = users.findIndex(u => u.uid === activeUserUid);
  if (currentIndex === -1) currentIndex = 0;

  let nextIndex = currentIndex + direction;
  if (nextIndex < 0) nextIndex = users.length - 1;
  if (nextIndex >= users.length) nextIndex = 0;

  openUserMoreDetail(users[nextIndex].uid);
}

// Inspect a user given their UID
function inspectUserByUid(uid) {
  openUserMoreDetail(uid);
}

// Clear search input in Users List
function clearUserSearch() {
  const input = document.getElementById('userSearchInput');
  if (input) {
    input.value = '';
    input.focus();
  }
  renderUsersTable();
}

// Render the entire 14-metrics page for the active user
function renderUserProfileInspector(u) {
  if (!u) return;

  // 1. Hero Info
  const heroAvatar = document.getElementById('heroAvatarLetter');
  if (heroAvatar) heroAvatar.textContent = (u.username || 'U').substring(0, 2).toUpperCase();

  const heroLevelBadge = document.getElementById('heroLevelBadge');
  if (heroLevelBadge) heroLevelBadge.textContent = `Lv.${u.level || 0}`;

  const heroUsername = document.getElementById('heroUsername');
  if (heroUsername) heroUsername.textContent = u.username || 'Unknown Player';

  const heroHandle = document.getElementById('heroHandle');
  if (heroHandle) heroHandle.textContent = `@${u.handle || (u.username || 'player').toLowerCase()}`;

  const heroProfileCodeText = document.getElementById('heroProfileCodeText');
  if (heroProfileCodeText) heroProfileCodeText.textContent = u.profileCode || 'ET-000000';

  const heroTelegramText = document.getElementById('heroTelegramText');
  if (heroTelegramText) heroTelegramText.textContent = u.telegram || (u.handle ? `@${u.handle}` : 'Not set');

  const heroAdsText = document.getElementById('heroAdsText');
  if (heroAdsText) heroAdsText.textContent = `${Number(u.adsWatched || 0).toLocaleString()} 🎬`;

  const heroMobileText = document.getElementById('heroMobileText');
  if (heroMobileText) heroMobileText.textContent = u.mobile || 'Not set';

  const heroUidText = document.getElementById('heroUidText');
  if (heroUidText) heroUidText.textContent = u.uid ? (u.uid.length > 14 ? u.uid.substring(0, 14) + '...' : u.uid) : 'N/A';

  const heroLastActive = document.getElementById('heroLastActive');
  if (heroLastActive) {
    heroLastActive.textContent = u.lastActive ? `Last Active: ${new Date(u.lastActive).toLocaleTimeString()} (${new Date(u.lastActive).toLocaleDateString()})` : 'Active recently';
  }

  // Identity / Security Inputs
  const inpInspProfileCode = document.getElementById('inpInspProfileCode');
  if (inpInspProfileCode) inpInspProfileCode.value = u.profileCode || '';

  const inpInspUsername = document.getElementById('inpInspUsername');
  if (inpInspUsername) inpInspUsername.value = u.username || '';

  const inpInspTelegram = document.getElementById('inpInspTelegram');
  if (inpInspTelegram) inpInspTelegram.value = u.telegram || (u.handle ? `@${u.handle}` : '');

  const inpInspAdsWatched = document.getElementById('inpInspAdsWatched');
  if (inpInspAdsWatched) inpInspAdsWatched.value = Number(u.adsWatched || 0);

  const inpInspMobile = document.getElementById('inpInspMobile');
  if (inpInspMobile) inpInspMobile.value = u.mobile || '';

  const subText = document.getElementById('ibsbSubText');
  if (subText) subText.textContent = `Apply all 14 updated values to ${u.username} [${u.profileCode}] in Firebase Realtime DB`;

  // 2. Metric 1: ENERGY
  const curEnergy = Math.floor(u.currentEnergy || 0);
  const maxEnergy = u.maxEnergy || 1000;
  const energyPct = Math.min(100, Math.max(0, Math.round((curEnergy / maxEnergy) * 100)));
  const dispMetricEnergy = document.getElementById('dispMetricEnergy');
  if (dispMetricEnergy) dispMetricEnergy.textContent = `${curEnergy.toLocaleString()} / ${maxEnergy.toLocaleString()}`;
  const barMetricEnergy = document.getElementById('barMetricEnergy');
  if (barMetricEnergy) barMetricEnergy.style.width = `${energyPct}%`;
  const badgeEnergyPct = document.getElementById('badgeEnergyPct');
  if (badgeEnergyPct) badgeEnergyPct.textContent = `${energyPct}%`;
  const inpInspEnergy = document.getElementById('inpInspEnergy');
  if (inpInspEnergy) inpInspEnergy.value = curEnergy;
  const inpInspMaxEnergy = document.getElementById('inpInspMaxEnergy');
  if (inpInspMaxEnergy) inpInspMaxEnergy.value = maxEnergy;

  // 3. Metric 2: COUNT TAPS
  const totalTaps = Number(u.countTaps || 0);
  const dispMetricCountTaps = document.getElementById('dispMetricCountTaps');
  if (dispMetricCountTaps) dispMetricCountTaps.textContent = `${totalTaps.toLocaleString()} Taps`;
  const dispMetricDailyTaps = document.getElementById('dispMetricDailyTaps');
  if (dispMetricDailyTaps) dispMetricDailyTaps.textContent = `Daily Taps: ${Number(u.dailyTaps || 0).toLocaleString()} • Tap Power: ${u.tapPower || 1}x`;
  const badgeTapPower = document.getElementById('badgeTapPower');
  if (badgeTapPower) badgeTapPower.textContent = `${u.tapPower || 1}x Power`;
  const inpInspCountTaps = document.getElementById('inpInspCountTaps');
  if (inpInspCountTaps) inpInspCountTaps.value = totalTaps;
  const inpInspTapPower = document.getElementById('inpInspTapPower');
  if (inpInspTapPower) inpInspTapPower.value = u.tapPower || 1;

  // 4. Metric 3: XP LEVEL
  const xpLevel = Number(u.level || 0);
  const currentXp = Number(u.xp || 0);
  const reqXp = Number(u.xpToNextLevel || ((xpLevel + 1) * 1000));
  const xpPct = Math.min(100, Math.max(0, Math.round((currentXp / (reqXp || 1)) * 100)));
  const dispMetricXpLevel = document.getElementById('dispMetricXpLevel');
  if (dispMetricXpLevel) dispMetricXpLevel.textContent = `Lv. ${xpLevel}`;
  const barMetricXp = document.getElementById('barMetricXp');
  if (barMetricXp) barMetricXp.style.width = `${xpPct}%`;
  const dispMetricXpProgress = document.getElementById('dispMetricXpProgress');
  if (dispMetricXpProgress) dispMetricXpProgress.textContent = `${currentXp.toLocaleString()} / ${reqXp.toLocaleString()} XP (${xpPct}%)`;
  const badgeXpRank = document.getElementById('badgeXpRank');
  if (badgeXpRank) badgeXpRank.textContent = xpLevel >= 50 ? 'DIAMOND' : (xpLevel >= 25 ? 'GOLD' : (xpLevel >= 10 ? 'SILVER' : 'BRONZE'));
  const inpInspXpLevel = document.getElementById('inpInspXpLevel');
  if (inpInspXpLevel) inpInspXpLevel.value = xpLevel;
  const inpInspXp = document.getElementById('inpInspXp');
  if (inpInspXp) inpInspXp.value = currentXp;

  // 5. Metric 4: GOAL LEVEL
  const goalLevel = Number(u.goalLevel || 0);
  const dispMetricGoalLevel = document.getElementById('dispMetricGoalLevel');
  if (dispMetricGoalLevel) dispMetricGoalLevel.textContent = `G-Lv. ${goalLevel}`;
  const badgeGoalStage = document.getElementById('badgeGoalStage');
  if (badgeGoalStage) badgeGoalStage.textContent = `Stage ${goalLevel}`;
  const inpInspGoalLevel = document.getElementById('inpInspGoalLevel');
  if (inpInspGoalLevel) inpInspGoalLevel.value = goalLevel;

  // 6. Metric 5: MONTHLY TASK COMPLETE
  const monthlyDone = Number(u.monthlyDone || 0);
  const dispMetricMonthlyTasks = document.getElementById('dispMetricMonthlyTasks');
  if (dispMetricMonthlyTasks) dispMetricMonthlyTasks.textContent = `${monthlyDone} Done`;
  const dispMetricMonthlyBreakdown = document.getElementById('dispMetricMonthlyBreakdown');
  if (dispMetricMonthlyBreakdown) dispMetricMonthlyBreakdown.textContent = `Claimed Monthly Quests: ${monthlyDone} / 30`;
  const inpInspMonthlyTasks = document.getElementById('inpInspMonthlyTasks');
  if (inpInspMonthlyTasks) inpInspMonthlyTasks.value = monthlyDone;

  // 7. Metric 6: TELEGRAM TASK COMPLETED
  const tgDone = Number(u.tgDone || 0);
  const dispMetricTgTasks = document.getElementById('dispMetricTgTasks');
  if (dispMetricTgTasks) dispMetricTgTasks.textContent = `${tgDone} Done`;
  const dispMetricTgBreakdown = document.getElementById('dispMetricTgBreakdown');
  if (dispMetricTgBreakdown) dispMetricTgBreakdown.textContent = `Claimed Telegram channels: ${tgDone}`;
  const inpInspTgTasks = document.getElementById('inpInspTgTasks');
  if (inpInspTgTasks) inpInspTgTasks.value = tgDone;

  // 8. Metric 7: WEBSITE TASK COMPLETED
  const webDone = Number(u.webDone || 0);
  const dispMetricWebTasks = document.getElementById('dispMetricWebTasks');
  if (dispMetricWebTasks) dispMetricWebTasks.textContent = `${webDone} Done`;
  const dispMetricWebBreakdown = document.getElementById('dispMetricWebBreakdown');
  if (dispMetricWebBreakdown) dispMetricWebBreakdown.textContent = `Claimed Web visits: ${webDone}`;
  const inpInspWebTasks = document.getElementById('inpInspWebTasks');
  if (inpInspWebTasks) inpInspWebTasks.value = webDone;

  // 9. Metric 8: KEY
  const keys = Number(u.chestKeys || 0);
  const dispMetricKeys = document.getElementById('dispMetricKeys');
  if (dispMetricKeys) dispMetricKeys.textContent = `${keys.toLocaleString()} 🗝️`;
  const inpInspKeys = document.getElementById('inpInspKeys');
  if (inpInspKeys) inpInspKeys.value = keys;

  // 10. Metric 9: EGG
  const eggs = Number(u.eggs || 0);
  const dispMetricEggs = document.getElementById('dispMetricEggs');
  if (dispMetricEggs) dispMetricEggs.textContent = `${eggs.toLocaleString()} 🥚`;
  const inpInspEggs = document.getElementById('inpInspEggs');
  if (inpInspEggs) inpInspEggs.value = eggs;

  // 11. Metric 10: CARD (SCRATCH)
  const cards = Number(u.scratchCards || 0);
  const dispMetricCards = document.getElementById('dispMetricCards');
  if (dispMetricCards) dispMetricCards.textContent = `${cards.toLocaleString()} 🎴`;
  const inpInspCards = document.getElementById('inpInspCards');
  if (inpInspCards) inpInspCards.value = cards;

  // 12. Metric 11: TICKET
  const tickets = Number(u.chestTickets || 0);
  const dispMetricTickets = document.getElementById('dispMetricTickets');
  if (dispMetricTickets) dispMetricTickets.textContent = `${tickets.toLocaleString()} 🎟️`;
  const inpInspTickets = document.getElementById('inpInspTickets');
  if (inpInspTickets) inpInspTickets.value = tickets;

  // 13. Metric 12: DIAMOND
  const diamonds = Number(u.diamonds || 0);
  const dispMetricDiamonds = document.getElementById('dispMetricDiamonds');
  if (dispMetricDiamonds) dispMetricDiamonds.textContent = `${diamonds.toLocaleString()} 💎`;
  const inpInspDiamonds = document.getElementById('inpInspDiamonds');
  if (inpInspDiamonds) inpInspDiamonds.value = diamonds;

  // 14. Metric 13: COIN
  const coins = Number(u.coins || 0);
  const dispMetricCoins = document.getElementById('dispMetricCoins');
  if (dispMetricCoins) dispMetricCoins.textContent = `${coins.toLocaleString()} 🪙`;
  const inpInspCoins = document.getElementById('inpInspCoins');
  if (inpInspCoins) inpInspCoins.value = coins;

  // 15. Metric 14: BLUE COIN
  const blueCoins = Number(u.blueCoins !== undefined ? u.blueCoins : (u.diamonds || 0));
  const blueTaps = Number(u.blueTapsLeft || 0);
  const dispMetricBlueCoins = document.getElementById('dispMetricBlueCoins');
  if (dispMetricBlueCoins) dispMetricBlueCoins.textContent = `${blueCoins.toLocaleString()} 🔷`;
  const dispMetricBlueTapsLeft = document.getElementById('dispMetricBlueTapsLeft');
  if (dispMetricBlueTapsLeft) dispMetricBlueTapsLeft.textContent = `Blue Taps Surge: ${blueTaps} taps left`;
  const badgeBlueTaps = document.getElementById('badgeBlueTaps');
  if (badgeBlueTaps) badgeBlueTaps.textContent = `${blueTaps} Surge Taps`;
  const inpInspBlueCoins = document.getElementById('inpInspBlueCoins');
  if (inpInspBlueCoins) inpInspBlueCoins.value = blueCoins;
  const inpInspBlueTaps = document.getElementById('inpInspBlueTaps');
  if (inpInspBlueTaps) inpInspBlueTaps.value = blueTaps;
}

// Fallback empty inspector state
function renderEmptyInspectorState() {
  const heroUsername = document.getElementById('heroUsername');
  if (heroUsername) heroUsername.textContent = 'No Players Available';
  const heroProfileCodeText = document.getElementById('heroProfileCodeText');
  if (heroProfileCodeText) heroProfileCodeText.textContent = 'ET-NONE';
}

// Save all 14 metrics for the currently inspected user to Firebase
function saveCurrentProfileStatsToFirebase() {
  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    alert('Firebase is not connected. Please check connection in Settings.');
    return;
  }
  if (!activeUserUid) {
    alert('No player currently selected to save.');
    return;
  }

  const uid = activeUserUid;
  const user = (window.adminState?.users || []).find(u => u.uid === uid) || {};

  // Read identity and security fields
  const newProfileCode = document.getElementById('inpInspProfileCode')?.value.trim().toUpperCase() || user.profileCode || '';
  const newUsername = document.getElementById('inpInspUsername')?.value.trim() || user.username || '';
  const newTelegram = document.getElementById('inpInspTelegram')?.value.trim() || '';
  const newAdsWatched = Math.max(0, Number(document.getElementById('inpInspAdsWatched')?.value) || 0);
  const newMobile = document.getElementById('inpInspMobile')?.value.trim() || '';

  // Enforce Strict Uniqueness Security across all players
  const allUsers = window.adminState?.users || [];
  const normCode = c => (c || '').toString().trim().toUpperCase();
  const normName = n => (n || '').toString().trim().toLowerCase();
  const normTg = t => (t || '').toString().trim().toLowerCase().replace(/^https?:\/\/t\.me\//, '').replace(/^@/, '');
  const normPhone = p => (p || '').toString().replace(/[^0-9]/g, '');

  if (newProfileCode) {
    const conflict = allUsers.find(other => other.uid !== uid && normCode(other.profileCode) === normCode(newProfileCode));
    if (conflict) {
      alert(`❌ Security Error: Profile Code "${newProfileCode}" is already in use by player "${conflict.username}".\nEach Profile Code must be unique!`);
      return;
    }
  }

  if (newUsername) {
    const conflict = allUsers.find(other => other.uid !== uid && normName(other.username) === normName(newUsername));
    if (conflict) {
      alert(`❌ Security Error: Username "${newUsername}" is already registered to player UID ${conflict.uid}.\nEach Username must be unique!`);
      return;
    }
  }

  if (newTelegram) {
    const conflict = allUsers.find(other => other.uid !== uid && normTg(other.telegram) && normTg(other.telegram) === normTg(newTelegram));
    if (conflict) {
      alert(`❌ Security Error: Telegram account "${newTelegram}" is already registered to player "${conflict.username}".\nA Telegram link can only be used once!`);
      return;
    }
  }

  if (newMobile) {
    const conflict = allUsers.find(other => other.uid !== uid && normPhone(other.mobile) && normPhone(other.mobile) === normPhone(newMobile));
    if (conflict) {
      alert(`❌ Security Error: Mobile number "${newMobile}" is already registered to player "${conflict.username}".\nEach phone number must be unique!`);
      return;
    }
  }

  // Read all 14 metric values from inputs
  const energy = Math.max(0, Number(document.getElementById('inpInspEnergy')?.value) || 0);
  const maxEnergy = Math.max(100, Number(document.getElementById('inpInspMaxEnergy')?.value) || 1000);
  const countTaps = Math.max(0, Number(document.getElementById('inpInspCountTaps')?.value) || 0);
  const tapPower = Math.max(1, Number(document.getElementById('inpInspTapPower')?.value) || 1);

  const xpLevel = Math.max(0, Number(document.getElementById('inpInspXpLevel')?.value) || 0);
  const xp = Math.max(0, Number(document.getElementById('inpInspXp')?.value) || 0);
  const xpToNextLevel = (xpLevel + 1) * 1000;

  const goalLevel = Math.max(0, Number(document.getElementById('inpInspGoalLevel')?.value) || 0);

  const monthlyTasks = Math.max(0, Number(document.getElementById('inpInspMonthlyTasks')?.value) || 0);
  const tgTasks = Math.max(0, Number(document.getElementById('inpInspTgTasks')?.value) || 0);
  const webTasks = Math.max(0, Number(document.getElementById('inpInspWebTasks')?.value) || 0);

  const keys = Math.max(0, Number(document.getElementById('inpInspKeys')?.value) || 0);
  const eggs = Math.max(0, Number(document.getElementById('inpInspEggs')?.value) || 0);
  const cards = Math.max(0, Number(document.getElementById('inpInspCards')?.value) || 0);
  const tickets = Math.max(0, Number(document.getElementById('inpInspTickets')?.value) || 0);
  const diamonds = Math.max(0, Number(document.getElementById('inpInspDiamonds')?.value) || 0);
  const coins = Math.max(0, Number(document.getElementById('inpInspCoins')?.value) || 0);
  const blueCoins = Math.max(0, Number(document.getElementById('inpInspBlueCoins')?.value) || 0);
  const blueTaps = Math.max(0, Number(document.getElementById('inpInspBlueTaps')?.value) || 0);

  const updates = {};
  // Identity and security credentials
  if (newProfileCode) updates[`/players/${uid}/player/profileCode`] = newProfileCode;
  if (newUsername) {
    updates[`/players/${uid}/player/username`] = newUsername;
    updates[`/players/${uid}/player/name`] = newUsername;
  }
  updates[`/players/${uid}/player/telegram`] = newTelegram;
  if (newTelegram) {
    updates[`/players/${uid}/player/handle`] = newTelegram.replace(/^https?:\/\/t\.me\//, '').replace(/^@/, '');
  }
  updates[`/players/${uid}/player/mobile`] = newMobile;
  updates[`/players/${uid}/player/adsWatchedCount`] = newAdsWatched;

  // Player node
  updates[`/players/${uid}/player/level`] = xpLevel;
  updates[`/players/${uid}/player/xp`] = xp;
  updates[`/players/${uid}/player/xpToNextLevel`] = xpToNextLevel;
  updates[`/players/${uid}/player/coins`] = coins;
  updates[`/players/${uid}/player/diamonds`] = diamonds;
  updates[`/players/${uid}/player/blueCoins`] = blueCoins;
  updates[`/players/${uid}/player/blueTapsLeft`] = blueTaps;
  updates[`/players/${uid}/player/chestKeys`] = keys;
  updates[`/players/${uid}/player/scratchCards`] = cards;
  updates[`/players/${uid}/player/chestTickets`] = tickets;
  updates[`/players/${uid}/player/eggs`] = eggs;
  updates[`/players/${uid}/player/energyTaps`] = countTaps;
  updates[`/players/${uid}/player/currentEnergy`] = energy;
  updates[`/players/${uid}/player/maxEnergy`] = maxEnergy;
  updates[`/players/${uid}/player/tapPower`] = tapPower;
  updates[`/players/${uid}/player/websiteTasksCompleted`] = webTasks;
  updates[`/players/${uid}/player/lastActive`] = new Date().toISOString();

  // Reactor node
  updates[`/players/${uid}/reactor/currentEnergy`] = energy;
  updates[`/players/${uid}/reactor/maxEnergy`] = maxEnergy;
  updates[`/players/${uid}/reactor/tapPower`] = tapPower;
  updates[`/players/${uid}/reactor/energyTaps`] = countTaps;

  // Goal nodes
  updates[`/players/${uid}/goal/level`] = goalLevel;
  updates[`/players/${uid}/goalState/currentLevel`] = goalLevel;

  // XP State node
  updates[`/players/${uid}/xpState/currentLevel`] = xpLevel;
  updates[`/players/${uid}/xpState/currentXP`] = xp;

  // Leaderboard sync
  updates[`/leaderboard/${uid}/name`] = newUsername || user.username;
  updates[`/leaderboard/${uid}/level`] = xpLevel;
  updates[`/leaderboard/${uid}/coins`] = coins;
  updates[`/leaderboard/${uid}/energyTaps`] = countTaps;
  updates[`/leaderboard/${uid}/lastActive`] = Date.now();

  const saveBtn = document.getElementById('btnHeroSave');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span>⏳</span> Saving to Firebase...';
  }

  db.ref().update(updates)
    .then(() => {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<span>✅</span> Saved Successfully!';
        setTimeout(() => {
          saveBtn.innerHTML = '<span>💾</span> Save Changes to Firebase';
        }, 2200);
      }
      alert(`✅ All 14 metrics for "${newUsername || user.username || uid}" [${newProfileCode}] updated successfully in Firebase!`);
    })
    .catch(err => {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<span>💾</span> Save Changes to Firebase';
      }
      alert('❌ Error saving to Firebase: ' + err.message);
    });
}

// Revert inputs back to original loaded state
function reloadCurrentProfileOriginal() {
  const users = window.adminState?.users || [];
  const user = users.find(u => u.uid === activeUserUid);
  if (user) {
    renderUserProfileInspector(user);
    alert('Values reloaded from cloud.');
  }
}

// Copy Profile Code to Clipboard
function copyCurrentProfileCode() {
  const codeEl = document.getElementById('heroProfileCodeText');
  if (!codeEl) return;
  const text = codeEl.textContent.trim();
  navigator.clipboard.writeText(text).then(() => {
    alert(`📋 Profile Code copied: ${text}`);
  }).catch(() => {
    prompt('Copy Profile Code:', text);
  });
}

// Copy UID to Clipboard
function copyCurrentUid() {
  if (!activeUserUid) return;
  navigator.clipboard.writeText(activeUserUid).then(() => {
    alert(`📋 UID copied: ${activeUserUid}`);
  }).catch(() => {
    prompt('Copy UID:', activeUserUid);
  });
}

// Restart Season for currently inspected user
function restartCurrentProfileSeason() {
  if (!activeUserUid) return;
  const user = (window.adminState?.users || []).find(u => u.uid === activeUserUid);
  restartUserSeasonInFirebase(activeUserUid, user ? user.username : '');
}

// Restart Player to 0 for currently inspected user
function restartCurrentProfilePlayer() {
  if (!activeUserUid) return;
  const user = (window.adminState?.users || []).find(u => u.uid === activeUserUid);
  restartPlayerInFirebase(activeUserUid, user ? user.username : '');
}

// Remove currently inspected user
function removeCurrentProfileUser() {
  if (!activeUserUid) return;
  const user = (window.adminState?.users || []).find(u => u.uid === activeUserUid);
  removeUserFromFirebase(activeUserUid, user ? user.username : '');
}

// ALL USERS LIST TABLE RENDERING (Shows User Name, Code, Telegram, Ads Count Balance & More Detail button)
function renderUsersTable() {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  const users = window.adminState?.users || [];
  const q = (document.getElementById('userSearchInput')?.value || '').toLowerCase().trim();
  const filtered = users.filter(u => {
    return (u.username || '').toLowerCase().includes(q) || 
           (u.uid || '').toLowerCase().includes(q) ||
           (u.profileCode || '').toLowerCase().includes(q) ||
           (u.handle || '').toLowerCase().includes(q) ||
           (u.telegram || '').toLowerCase().includes(q) ||
           (u.mobile || '').toLowerCase().includes(q);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #64748b; padding: 36px;">No players matching "${q || ''}" found in Firebase.</td></tr>`;
    return;
  }

  let html = '';
  filtered.forEach((u, i) => {
    const isCurrent = u.uid === activeUserUid;
    const adsCount = Number(u.adsWatched || 0);

    html += `
      <tr style="${isCurrent ? 'background: rgba(2, 132, 199, 0.09);' : ''}">
        <td style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #64748b;">#${i + 1}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 32px; height: 32px; border-radius: 9px; background: linear-gradient(135deg, #0284c7, #1d4ed8); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; color: #fff; flex-shrink: 0;">
              ${(u.username || 'U').substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div style="font-weight: 800; color: #0f172a; font-size: 13px;">${u.username}</div>
              <div style="font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #64748b;">${u.uid ? u.uid.substring(0, 10) + '...' : ''}</div>
            </div>
          </div>
        </td>
        <td>
          <span class="user-profile-code-chip" title="Profile Code">${u.profileCode}</span>
        </td>
        <td>
          <span class="telegram-chip" title="Telegram Account">${u.telegram || (u.handle ? '@' + u.handle : '—')}</span>
        </td>
        <td>
          <span class="ads-count-chip" title="Ads Count Balance">🎬 ${adsCount.toLocaleString()}</span>
        </td>
        <td>
          <span style="color: #c084fc; font-weight: 800; font-family: 'JetBrains Mono', monospace;">Lv.${u.level || 0}</span>
        </td>
        <td style="color: #fbbf24; font-weight: 800; font-family: 'JetBrains Mono', monospace;">
          ${Number(u.coins || 0).toLocaleString()} 🪙
        </td>
        <td style="color: #22d3ee; font-weight: 800; font-family: 'JetBrains Mono', monospace;">
          ${Number(u.diamonds || 0).toLocaleString()} 💎
        </td>
        <td style="text-align: center; white-space: nowrap;">
          <div style="display: inline-flex; gap: 6px; align-items: center;">
            <button onclick="openUserMoreDetail('${u.uid}')" class="btn-more-detail" title="Open complete 14 metrics page for ${u.username}">
              <span>🔍</span>
              <span>More Detail</span>
            </button>
            <button onclick="restartUserSeasonInFirebase('${u.uid}', '${u.username}')" class="btn-secondary" style="padding: 5px 8px; font-size: 11px; color: #38bdf8; border-color: rgba(56, 189, 248, 0.4);" title="Restart Season">🌟</button>
            <button onclick="restartPlayerInFirebase('${u.uid}', '${u.username}')" class="btn-secondary" style="padding: 5px 8px; font-size: 11px; color: #fbbf24; border-color: rgba(245, 158, 11, 0.4);" title="Clean to 0">🔄</button>
            <button onclick="removeUserFromFirebase('${u.uid}', '${u.username}')" class="btn-secondary" style="padding: 5px 8px; font-size: 11px; color: #f87171; border-color: rgba(239, 68, 68, 0.4);" title="Remove Player">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

function filterUsersTable() {
  renderUsersTable();
}

// Compatibility functions for external callers
function openUserEditModal(uid) {
  openUserMoreDetail(uid);
}

function closeUserEditModal() {
  const modal = document.getElementById('userEditModal');
  if (modal) modal.classList.remove('open');
}

function savePlayerEditToFirebase() {
  saveCurrentProfileStatsToFirebase();
}

function restartPlayerInFirebase(uid, uname) {
  const db = window.getDb ? window.getDb() : null;
  const targetUid = uid || activeUserUid;
  if (!targetUid || !db) return;

  const user = (window.adminState?.users || []).find(u => u.uid === targetUid);
  const username = uname || (user ? user.username : 'this player');

  if (!confirm(`⚠️ Are you sure you want to RESTART ${username} to 0?\n\nThis will keep the SAME user account in Firebase, but clean all stats (Energy, XP, Goal, Taps, Monthly, TG, Web, Keys, Eggs, Cards, Tickets, Diamonds, Coins, Blue Coins) to fresh 0 starting values!`)) {
    return;
  }

  const cleanPlayerData = {
    player: {
      uid: targetUid,
      username: username,
      name: username,
      profileCode: user ? user.profileCode : 'ET-' + targetUid.slice(-6).toUpperCase(),
      telegram: user ? user.telegram : '',
      mobile: user ? user.mobile : '',
      level: 0,
      xp: 0,
      xpToNextLevel: 1000,
      coins: 0,
      diamonds: 0,
      blueCoins: 0,
      blueTapsLeft: 0,
      chestKeys: 0,
      scratchCards: 0,
      chestTickets: 0,
      eggs: 0,
      currentEnergy: 0,
      maxEnergy: 1000,
      tapPower: 1,
      energyTaps: 0,
      streakDays: 0,
      adsWatchedCount: 0,
      websiteTasksCompleted: 0,
      lastActive: new Date().toISOString()
    },
    goal: {
      level: 0,
      currentCoins: 0,
      currentKeys: 0,
      currentTickets: 0
    },
    goalState: {
      currentLevel: 0,
      levelAdsWatched: 0,
      megaWatchedAds: 0,
      levelProgress: { cards: 0, keys: 0, tickets: 0 },
      megaRewardClaimed: false,
      grandChestClaimed: false,
      claimedGoals: {},
      seasonEndMs: Date.now() + 30 * 24 * 3600 * 1000
    },
    tasksState: {
      claimedDaily: {},
      claimedTelegram: {},
      claimedWebsite: {},
      claimedMonthly: {},
      failedWebsite: {},
      openedWebsite: {}
    },
    dailyStats: {
      taps: 0,
      adsWatched: 0,
      spins: 0,
      chests: 0,
      scratches: 0,
      eggs: 0,
      resetTimestamp: Date.now()
    },
    xpState: {
      currentLevel: 0,
      currentXP: 0,
      watchedAds: 0,
      megaRewardClaimed: false,
      claimedLevels: {},
      seasonEndMs: Date.now() + 30 * 24 * 3600 * 1000
    },
    reactor: {
      currentEnergy: 0,
      energyTaps: 0,
      maxEnergy: 1000,
      tapPower: 1
    }
  };

  db.ref(`/players/${targetUid}`).set(cleanPlayerData).then(() => {
    alert(`🔄 Player "${username}" data successfully reset to 0 in Firebase!`);
  }).catch(err => alert('Error resetting player: ' + err.message));
}

function restartUserSeasonInFirebase(uid, uname) {
  const targetUid = uid || activeUserUid;
  if (!targetUid) return;

  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    alert('Firebase is not connected!');
    return;
  }

  const user = (window.adminState?.users || []).find(u => u.uid === targetUid);
  const username = uname || (user ? user.username : 'this player');

  if (!confirm(`🌟 Restart Season & Restore Level Rewards for "${username}"?\n\nThis will restore this user's XP & Goal progression to Level 0 and clear claimed level rewards for a fresh season cycle.\n(Coins, diamonds, inventory, and energy will remain safe!)`)) {
    return;
  }

  const now = Date.now();
  const seasonEnd = now + 30 * 24 * 3600 * 1000;

  const updates = {};
  updates[`/players/${targetUid}/player/level`] = 0;
  updates[`/players/${targetUid}/player/xp`] = 0;
  updates[`/players/${targetUid}/player/xpToNextLevel`] = 1000;
  updates[`/players/${targetUid}/xpState`] = {
    currentLevel: 0,
    currentXP: 0,
    watchedAds: 0,
    megaRewardClaimed: false,
    claimedLevels: {},
    seasonEndMs: seasonEnd
  };
  updates[`/players/${targetUid}/goalState`] = {
    currentLevel: 0,
    levelAdsWatched: 0,
    megaWatchedAds: 0,
    levelProgress: { cards: 0, keys: 0, tickets: 0 },
    megaRewardClaimed: false,
    grandChestClaimed: false,
    claimedGoals: {},
    seasonEndMs: seasonEnd
  };
  updates[`/players/${targetUid}/goal`] = {
    level: 0,
    currentCoins: 0,
    currentKeys: 0,
    currentTickets: 0
  };

  db.ref().update(updates).then(() => {
    alert(`🌟 Season successfully restarted for "${username}"!`);
  }).catch(err => alert('Error restarting season: ' + err.message));
}

function removeUserFromFirebase(uid, username) {
  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    alert('Firebase is not connected!');
    return;
  }

  const targetUid = uid || activeUserUid;
  if (!targetUid) return;

  const user = (window.adminState?.users || []).find(u => u.uid === targetUid);
  const targetName = username || (user ? user.username : targetUid);
  const userTelegram = user ? (user.telegram || (user.handle ? '@' + user.handle : '')) : '';
  const userCode = user ? (user.profileCode || '') : '';

  if (!confirm(`🗑️ PERMANENTLY DELETE ALL DATA FOR "${targetName}"?\n\nThis will completely purge from Firebase:\n• Player Account & 14 Metrics (/players/${targetUid})\n• Leaderboard Ranking (/leaderboard/${targetUid})\n• Security Whitelist (/whitelist/${targetUid})\n• All Prize & Diamond Requests (/reward_requests)\n• All Direct Link Ad Clicks (/ads_direct_clicks)\n• All Player Feedback & Suggestions (/suggestions)\n\nThis action cannot be undone!`)) {
    return;
  }

  // 1. Prepare multi-path atomic delete map
  const updates = {};
  updates[`/players/${targetUid}`] = null;
  updates[`/leaderboard/${targetUid}`] = null;
  updates[`/whitelist/${targetUid}`] = null;

  // 2. Fetch and purge associated records in parallel
  const cleanupPromises = [];

  // Clean /reward_requests
  cleanupPromises.push(
    db.ref('/reward_requests').once('value').then(snap => {
      const val = snap.val();
      if (val) {
        Object.keys(val).forEach(reqId => {
          const r = val[reqId];
          const matchUid = (r.userId === targetUid);
          const matchName = (r.username && r.username.toLowerCase() === targetName.toLowerCase()) || 
                            (r.userName && r.userName.toLowerCase() === targetName.toLowerCase());
          const matchTg = userTelegram && (r.telegramHandle === userTelegram || r.userTgHandle === userTelegram);
          if (matchUid || matchName || matchTg) {
            updates[`/reward_requests/${reqId}`] = null;
          }
        });
      }
    }).catch(err => console.warn('Error reading /reward_requests for cleanup:', err))
  );

  // Clean /ads_direct_clicks
  cleanupPromises.push(
    db.ref('/ads_direct_clicks').once('value').then(snap => {
      const val = snap.val();
      if (val) {
        Object.keys(val).forEach(clickId => {
          const c = val[clickId];
          const matchUid = (c.userId === targetUid);
          const matchName = (c.username && c.username.toLowerCase() === targetName.toLowerCase());
          if (matchUid || matchName) {
            updates[`/ads_direct_clicks/${clickId}`] = null;
          }
        });
      }
    }).catch(err => console.warn('Error reading /ads_direct_clicks for cleanup:', err))
  );

  // Clean /suggestions
  cleanupPromises.push(
    db.ref('/suggestions').once('value').then(snap => {
      const val = snap.val();
      if (val) {
        Object.keys(val).forEach(sugId => {
          const s = val[sugId];
          const matchUid = (s.userId === targetUid || s.authorUid === targetUid);
          const matchName = (s.username && s.username.toLowerCase() === targetName.toLowerCase()) ||
                            (s.authorName && s.authorName.toLowerCase() === targetName.toLowerCase());
          if (matchUid || matchName) {
            updates[`/suggestions/${sugId}`] = null;
          }
        });
      }
    }).catch(err => console.warn('Error reading /suggestions for cleanup:', err))
  );

  Promise.all(cleanupPromises).then(() => {
    // Atomic batch delete from Firebase Realtime Database
    return db.ref().update(updates);
  }).then(() => {
    // Immediate local state update for instant UI feedback
    if (window.adminState) {
      window.adminState.users = (window.adminState.users || []).filter(u => u.uid !== targetUid);
      if (window.adminState.requests) {
        window.adminState.requests = window.adminState.requests.filter(r => 
          r.userId !== targetUid && 
          r.username?.toLowerCase() !== targetName.toLowerCase() && 
          r.userName?.toLowerCase() !== targetName.toLowerCase()
        );
      }
      if (window.adminState.directClicks) {
        window.adminState.directClicks = window.adminState.directClicks.filter(c => 
          c.userId !== targetUid && 
          c.username?.toLowerCase() !== targetName.toLowerCase()
        );
      }
    }

    if (activeUserUid === targetUid) {
      const remaining = window.adminState?.users || [];
      activeUserUid = remaining.length > 0 ? remaining[0].uid : null;
    }

    refreshUsersUI();
    if (typeof updateGlobalMetrics === 'function') updateGlobalMetrics();

    alert(`✅ Player "${targetName}" and ALL user data (Account, Leaderboard, Whitelist, Requests, Clicks, Suggestions) were completely removed from Firebase!`);
  }).catch(err => {
    alert('❌ Error deleting user data from Firebase: ' + err.message);
  });
}

function removeUserFromModal() {
  if (activeUserUid) {
    removeCurrentProfileUser();
  }
}

// Global Exports
window.setUserViewMode = setUserViewMode;
window.openUserMoreDetail = openUserMoreDetail;
window.clearUserSearch = clearUserSearch;
window.loadUserByProfileCodeInput = loadUserByProfileCodeInput;
window.onUserDropdownChange = onUserDropdownChange;
window.navigateUserStep = navigateUserStep;
window.inspectUserByUid = inspectUserByUid;
window.saveCurrentProfileStatsToFirebase = saveCurrentProfileStatsToFirebase;
window.reloadCurrentProfileOriginal = reloadCurrentProfileOriginal;
window.copyCurrentProfileCode = copyCurrentProfileCode;
window.copyCurrentUid = copyCurrentUid;
window.restartCurrentProfileSeason = restartCurrentProfileSeason;
window.restartCurrentProfilePlayer = restartCurrentProfilePlayer;
window.removeCurrentProfileUser = removeCurrentProfileUser;
window.renderUsersTable = renderUsersTable;
window.filterUsersTable = filterUsersTable;
window.openUserEditModal = openUserEditModal;
window.closeUserEditModal = closeUserEditModal;
window.savePlayerEditToFirebase = savePlayerEditToFirebase;
window.restartPlayerInFirebase = restartPlayerInFirebase;
window.restartUserSeasonInFirebase = restartUserSeasonInFirebase;
window.removeUserFromFirebase = removeUserFromFirebase;
window.removeUserFromModal = removeUserFromModal;
