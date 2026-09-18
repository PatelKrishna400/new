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
  const executeReset = () => {
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
  };

  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(executeReset);
  } else {
    executeReset();
  }
}

function triggerMonthlyCompetitionReset() {
  const executeCompReset = () => {
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
  };

  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(executeCompReset);
  } else {
    executeCompReset();
  }
}

window.reconnectFirebase = reconnectFirebase;
window.triggerGlobalSeasonReset = triggerGlobalSeasonReset;
window.triggerMonthlyCompetitionReset = triggerMonthlyCompetitionReset;

// ==========================================================================
// ADMIN TEAM MANAGEMENT (STRICTLY 2 TO 5 USERS ONLY)
// ==========================================================================
function renderAdminTeamUI() {
  const tbody = document.getElementById('adminUsersTableBody');
  const countPill = document.getElementById('adminCountPill');
  const addBtn = document.getElementById('openAddAdminBtn');
  if (!tbody) return;

  const admins = (window.adminState && window.adminState.adminUsers) ? window.adminState.adminUsers : [];
  const count = admins.length;

  if (countPill) {
    countPill.textContent = `Admins: ${count} / 5 (Allowed: 2 - 5)`;
    if (count >= 5) {
      countPill.style.background = 'rgba(239, 68, 68, 0.15)';
      countPill.style.borderColor = 'rgba(239, 68, 68, 0.4)';
      countPill.style.color = '#f87171';
    } else if (count <= 2) {
      countPill.style.background = 'rgba(245, 158, 11, 0.15)';
      countPill.style.borderColor = 'rgba(245, 158, 11, 0.4)';
      countPill.style.color = '#fbbf24';
    } else {
      countPill.style.background = 'rgba(56, 189, 248, 0.15)';
      countPill.style.borderColor = 'rgba(56, 189, 248, 0.4)';
      countPill.style.color = '#38bdf8';
    }
  }

  if (addBtn) {
    if (count >= 5) {
      addBtn.disabled = true;
      addBtn.style.opacity = '0.5';
      addBtn.style.cursor = 'not-allowed';
      addBtn.title = 'Maximum capacity reached (5 admin limit)';
    } else {
      addBtn.disabled = false;
      addBtn.style.opacity = '1';
      addBtn.style.cursor = 'pointer';
      addBtn.title = 'Add new admin user';
    }
  }

  if (count === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #94a3b8; padding: 24px;">No admin records loaded. Checking cloud...</td></tr>`;
    return;
  }

  const currentAdmin = window.getCurrentAdminSession ? window.getCurrentAdminSession() : null;

  tbody.innerHTML = admins.map(adm => {
    const isSelf = currentAdmin && currentAdmin.username === adm.username;
    const isSuper = (adm.role || '').toLowerCase().includes('super');
    const createdStr = adm.createdAt ? new Date(adm.createdAt).toLocaleDateString() : 'System';

    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #0284c7, #2563eb); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; color: #fff;">
              ${(adm.username || 'A')[0].toUpperCase()}
            </div>
            <div>
              <strong style="color: #0f172a; font-size: 13px;">${escapeHtmlSettings(adm.name || adm.username)}</strong>
              ${isSelf ? `<span style="margin-left: 6px; font-size: 10px; background: rgba(56, 189, 248, 0.2); color: #0284c7; padding: 2px 6px; border-radius: 10px; font-weight: 700;">You</span>` : ''}
            </div>
          </div>
        </td>
        <td><code style="color: #38bdf8; font-weight: 700;">@${escapeHtmlSettings(adm.username)}</code></td>
        <td>
          <span class="admin-team-pill ${isSuper ? 'admin-pill-super' : 'admin-pill-manager'}">
            ${isSuper ? '👑' : '🛡️'} ${escapeHtmlSettings(adm.role || 'Admin')}
          </span>
        </td>
        <td>
          <span style="font-family: monospace; color: #94a3b8; letter-spacing: 2px;">••••••••</span>
          <button onclick="changeAdminPassword('${escapeHtmlSettings(adm.username)}')" style="margin-left: 8px; background: none; border: none; color: #38bdf8; cursor: pointer; font-size: 11px; text-decoration: underline;">Change</button>
        </td>
        <td style="color: #94a3b8; font-size: 12px;">${createdStr}</td>
        <td style="text-align: right;">
          <button onclick="deleteAdminUser('${escapeHtmlSettings(adm.username)}')" class="btn-secondary" style="color: #f87171; border-color: rgba(239, 68, 68, 0.4); padding: 4px 10px; font-size: 12px;" ${count <= 2 ? 'disabled title="Minimum 2 admins required. Cannot delete."' : ''}>
            🗑️ Remove
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function escapeHtmlSettings(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function openAddAdminModal() {
  const admins = (window.adminState && window.adminState.adminUsers) ? window.adminState.adminUsers : [];
  if (admins.length >= 5) {
    alert('⚠️ LIMIT REACHED: A maximum of 5 admin users is strictly enforced.\nYou cannot add more than 5 admin users.');
    return;
  }

  const modal = document.getElementById('addAdminModal');
  if (modal) {
    document.getElementById('newAdminUsername').value = '';
    document.getElementById('newAdminPassword').value = '';
    document.getElementById('newAdminName').value = '';
    document.getElementById('newAdminRole').value = 'Operations Admin';
    modal.classList.add('active');
  }
}

function closeAddAdminModal() {
  const modal = document.getElementById('addAdminModal');
  if (modal) modal.classList.remove('active');
}

function saveNewAdminUser() {
  const executeAddAdmin = () => {
    const admins = (window.adminState && window.adminState.adminUsers) ? window.adminState.adminUsers : [];
    if (admins.length >= 5) {
      alert('⚠️ Maximum limit of 5 admin users reached! Cannot add more.');
      return;
    }

    const usernameInput = document.getElementById('newAdminUsername');
    const passwordInput = document.getElementById('newAdminPassword');
    const nameInput = document.getElementById('newAdminName');
    const roleInput = document.getElementById('newAdminRole');

    const rawUser = usernameInput ? usernameInput.value.trim().toLowerCase() : '';
    const pass = passwordInput ? passwordInput.value.trim() : '';
    const name = nameInput ? nameInput.value.trim() : '';
    const role = roleInput ? roleInput.value : 'Operations Admin';

    if (!rawUser || rawUser.length < 3) {
      alert('Please enter a valid username (at least 3 characters, alphanumeric).');
      return;
    }
    const cleanUser = rawUser.replace(/[^a-z0-9_]/g, '');
    if (!cleanUser) {
      alert('Username can only contain letters, numbers, and underscores.');
      return;
    }
    if (!pass || pass.length < 6) {
      alert('Please enter a secure password (at least 6 characters).');
      return;
    }

    // Check if exists
    if (admins.some(a => a.username.toLowerCase() === cleanUser)) {
      alert(`Admin user "${cleanUser}" already exists!`);
      return;
    }

    const db = window.getDb ? window.getDb() : null;
    if (!db) {
      alert('Database is offline!');
      return;
    }

    db.ref(`/admin_users/${cleanUser}`).set({
      username: cleanUser,
      password: pass,
      name: name || cleanUser,
      role: role,
      createdAt: Date.now()
    }).then(() => {
      alert(`✅ Admin user "${cleanUser}" successfully created! (Total admins: ${admins.length + 1} / 5)`);
      closeAddAdminModal();
    }).catch(err => {
      alert('Error adding admin: ' + err.message);
    });
  };

  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(executeAddAdmin);
  } else {
    executeAddAdmin();
  }
}

function changeAdminPassword(username) {
  const executeChange = () => {
    const newPass = prompt(`Enter new password for admin "${username}" (minimum 6 characters):`);
    if (!newPass) return;
    if (newPass.trim().length < 6) {
      alert('Password must be at least 6 characters!');
      return;
    }

    const db = window.getDb ? window.getDb() : null;
    if (!db) {
      alert('Database offline!');
      return;
    }

    db.ref(`/admin_users/${username}/password`).set(newPass.trim())
      .then(() => alert(`✅ Password updated for admin "${username}"!`))
      .catch(err => alert('Failed to update password: ' + err.message));
  };

  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(executeChange);
  } else {
    executeChange();
  }
}

function deleteAdminUser(username) {
  const executeDeleteAdmin = () => {
    const admins = (window.adminState && window.adminState.adminUsers) ? window.adminState.adminUsers : [];
    if (admins.length <= 2) {
      alert('⚠️ MINIMUM REQUIREMENT: Exactly 2 to 5 admin users are allowed.\nYou cannot delete this admin because a minimum of 2 admin accounts is strictly required!');
      return;
    }

    const currentAdmin = window.getCurrentAdminSession ? window.getCurrentAdminSession() : null;
    if (currentAdmin && currentAdmin.username === username) {
      if (!confirm(`⚠️ You are currently logged in as "${username}". Deleting your own account will immediately log you out. Proceed?`)) {
        return;
      }
    } else {
      if (!confirm(`Are you sure you want to permanently delete admin "${username}"?\nAdmins remaining after deletion: ${admins.length - 1}`)) {
        return;
      }
    }

    const db = window.getDb ? window.getDb() : null;
    if (!db) {
      alert('Database offline!');
      return;
    }

    db.ref(`/admin_users/${username}`).remove()
      .then(() => {
        alert(`Admin user "${username}" deleted.`);
        if (currentAdmin && currentAdmin.username === username && window.logoutAdmin) {
          window.logoutAdmin();
        }
      })
      .catch(err => alert('Error deleting admin: ' + err.message));
  };

  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(executeDeleteAdmin);
  } else {
    executeDeleteAdmin();
  }
}

window.renderAdminTeamUI = renderAdminTeamUI;
window.openAddAdminModal = openAddAdminModal;
window.closeAddAdminModal = closeAddAdminModal;
window.saveNewAdminUser = saveNewAdminUser;
window.changeAdminPassword = changeAdminPassword;
window.deleteAdminUser = deleteAdminUser;

// ==========================================================================
// GLOBAL WEBSITE & GAME CONFIGURATION (STATIC DATA EDITOR)
// ==========================================================================
function loadGlobalGameConfigFromFirebase() {
  const cfg = (window.adminState && window.adminState.gameConfig) ? window.adminState.gameConfig : {};
  const elName = document.getElementById('cfgAppName');
  const elMaint = document.getElementById('cfgMaintenance');
  const elMaintTag = document.getElementById('maintenanceStatusTag');
  const elEnergy = document.getElementById('cfgStartingEnergy');
  const elMaxEnergy = document.getElementById('cfgMaxEnergy');
  const elRegen = document.getElementById('cfgRegenRate');
  const elTap = document.getElementById('cfgTapPower');
  const elSupport = document.getElementById('cfgSupportUrl');
  const elAnnounce = document.getElementById('cfgAnnouncement');
  const elAnnounceActive = document.getElementById('cfgAnnouncementActive');
  const elUpdated = document.getElementById('gameConfigLastUpdated');

  if (elName) elName.value = cfg.appName || 'Energy Tap';
  if (elMaint) elMaint.value = String(cfg.maintenanceMode === true);
  if (elMaintTag) {
    elMaintTag.textContent = cfg.maintenanceMode ? '🔴 Under Maintenance' : '🟢 Normal Active';
    elMaintTag.style.color = cfg.maintenanceMode ? '#ef4444' : '#059669';
  }
  if (elEnergy) elEnergy.value = cfg.startingEnergy || 1000;
  if (elMaxEnergy) elMaxEnergy.value = cfg.maxBaseEnergy || 1000;
  if (elRegen) elRegen.value = cfg.energyRegenRate || 1;
  if (elTap) elTap.value = cfg.tapBasePower || 1;
  if (elSupport) elSupport.value = cfg.supportTelegramUrl || 'https://t.me/energy_tap_support';
  if (elAnnounce) elAnnounce.value = cfg.announcementText || '';
  if (elAnnounceActive) elAnnounceActive.checked = cfg.announcementActive !== false;

  if (elUpdated) {
    elUpdated.textContent = cfg.updatedAt ? ('Last Synced: ' + new Date(cfg.updatedAt).toLocaleTimeString()) : 'Cloud Synced (Live RTDB)';
  }
}

function saveGlobalGameConfig() {
  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(performSaveGlobalGameConfig);
  } else {
    performSaveGlobalGameConfig();
  }
}

function performSaveGlobalGameConfig() {
  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    alert('Firebase is not connected!');
    return;
  }

  const updatedConfig = {
    appName: (document.getElementById('cfgAppName')?.value || 'Energy Tap').trim(),
    maintenanceMode: document.getElementById('cfgMaintenance')?.value === 'true',
    startingEnergy: Number(document.getElementById('cfgStartingEnergy')?.value) || 1000,
    maxBaseEnergy: Number(document.getElementById('cfgMaxEnergy')?.value) || 1000,
    energyRegenRate: Number(document.getElementById('cfgRegenRate')?.value) || 1,
    tapBasePower: Number(document.getElementById('cfgTapPower')?.value) || 1,
    supportTelegramUrl: (document.getElementById('cfgSupportUrl')?.value || '').trim(),
    announcementText: (document.getElementById('cfgAnnouncement')?.value || '').trim(),
    announcementActive: document.getElementById('cfgAnnouncementActive')?.checked === true,
    updatedAt: Date.now()
  };

  db.ref('/game_config').set(updatedConfig)
    .then(() => {
      window.adminState.gameConfig = updatedConfig;
      loadGlobalGameConfigFromFirebase();
      if (typeof window.logActivity === 'function') {
        window.logActivity('Admin Settings', 'Updated global game settings & economy parameters in /game_config', '⚙️');
      }
      alert('💾 Global Website & Game configuration successfully saved to Firebase (/game_config)!');
    })
    .catch(err => alert('Error writing configuration to Firebase: ' + err.message));
}

// ==========================================================================
// ADMIN LEVEL PROGRESSION & GOAL/XP SYSTEM ENGINE (LEVELS 1 - 100)
// ==========================================================================
let currentSelectedAdminLevel = 1;

function getDefaultAdminLevelConfig(lvl) {
  const l = Math.max(1, parseInt(lvl, 10) || 1);
  const cards = 20 + (l - 1) * 6 + ((l * 11) % 15);
  const keys = 50 + (l - 1) * 9 + ((l * 17) % 20);
  const tickets = 35 + (l - 1) * 7 + ((l * 13) % 18);
  const xpRequired = l * 1000;
  let rewardQty = 1;
  if (l > 75) rewardQty = 5;
  else if (l > 50) rewardQty = 4;
  else if (l > 25) rewardQty = 3;
  else if (l > 10) rewardQty = 2;

  return {
    level: l,
    name: `Level ${l}`,
    isLocked: false,
    xpRequired: xpRequired,
    targets: { cards, keys, tickets },
    rewards: {
      coins: l * 25,
      xpBonus: l * 10,
      cards: rewardQty,
      keys: rewardQty,
      tickets: rewardQty,
      fuel: 5
    }
  };
}

function initAdminLevelSelect() {
  const sel = document.getElementById('adminLevelSelect');
  if (!sel) return;
  if (sel.children.length >= 100) return;

  sel.innerHTML = '';
  for (let i = 1; i <= 100; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `Level ${i}`;
    sel.appendChild(opt);
  }
  sel.value = currentSelectedAdminLevel;
}

function onAdminSelectLevel(lvl) {
  currentSelectedAdminLevel = Math.max(1, Math.min(100, parseInt(lvl, 10) || 1));
  const sel = document.getElementById('adminLevelSelect');
  if (sel) sel.value = currentSelectedAdminLevel;

  const levelsConfig = (window.adminState && window.adminState.levelsConfig) || {};
  const cfg = levelsConfig[currentSelectedAdminLevel] || getDefaultAdminLevelConfig(currentSelectedAdminLevel);
  const targets = cfg.targets || {};
  const rewards = cfg.rewards || {};

  const isLocked = !!cfg.isLocked;
  const lockSelect = document.getElementById('lvlEditLock');
  if (lockSelect) lockSelect.value = isLocked ? 'true' : 'false';

  const statusPill = document.getElementById('adminLevelStatusPill');
  if (statusPill) {
    if (isLocked) {
      statusPill.textContent = '🔴 LOCKED BY ADMIN';
      statusPill.style.background = 'rgba(239, 68, 68, 0.15)';
      statusPill.style.color = '#ef4444';
      statusPill.style.borderColor = 'rgba(239, 68, 68, 0.3)';
    } else {
      statusPill.textContent = '🟢 UNLOCKED';
      statusPill.style.background = 'rgba(16, 185, 129, 0.15)';
      statusPill.style.color = '#059669';
      statusPill.style.borderColor = 'rgba(16, 185, 129, 0.3)';
    }
  }

  const def = getDefaultAdminLevelConfig(currentSelectedAdminLevel);
  const inpXp = document.getElementById('lvlEditXp');
  if (inpXp) inpXp.value = cfg.xpRequired !== undefined ? cfg.xpRequired : (cfg.xpToNextLevel || def.xpRequired);

  const inpCards = document.getElementById('lvlEditCards');
  if (inpCards) inpCards.value = targets.cards !== undefined ? targets.cards : def.targets.cards;

  const inpKeys = document.getElementById('lvlEditKeys');
  if (inpKeys) inpKeys.value = targets.keys !== undefined ? targets.keys : def.targets.keys;

  const inpTickets = document.getElementById('lvlEditTickets');
  if (inpTickets) inpTickets.value = targets.tickets !== undefined ? targets.tickets : def.targets.tickets;

  const inpCoins = document.getElementById('lvlEditCoins');
  if (inpCoins) inpCoins.value = rewards.coins !== undefined ? rewards.coins : def.rewards.coins;

  const inpXpBonus = document.getElementById('lvlEditXpBonus');
  if (inpXpBonus) inpXpBonus.value = rewards.xpBonus !== undefined ? rewards.xpBonus : def.rewards.xpBonus;

  const inpItemQty = document.getElementById('lvlEditItemQty');
  if (inpItemQty) inpItemQty.value = rewards.cards !== undefined ? rewards.cards : def.rewards.cards;

  const inpFuel = document.getElementById('lvlEditFuel');
  if (inpFuel) inpFuel.value = rewards.fuel !== undefined ? rewards.fuel : def.rewards.fuel;
}

function stepAdminLevel(delta) {
  const next = Math.max(1, Math.min(100, currentSelectedAdminLevel + delta));
  onAdminSelectLevel(next);
}

function saveCurrentAdminLevel() {
  const lvl = currentSelectedAdminLevel;
  const isLocked = document.getElementById('lvlEditLock')?.value === 'true';
  const xpRequired = Number(document.getElementById('lvlEditXp')?.value) || (lvl * 1000);
  const cards = Number(document.getElementById('lvlEditCards')?.value) || 20;
  const keys = Number(document.getElementById('lvlEditKeys')?.value) || 50;
  const tickets = Number(document.getElementById('lvlEditTickets')?.value) || 35;
  const coins = Number(document.getElementById('lvlEditCoins')?.value) || (lvl * 25);
  const xpBonus = Number(document.getElementById('lvlEditXpBonus')?.value) || (lvl * 10);
  const itemQty = Number(document.getElementById('lvlEditItemQty')?.value) || 1;
  const fuel = Number(document.getElementById('lvlEditFuel')?.value) || 5;

  const updatedLevelConfig = {
    level: lvl,
    name: `Level ${lvl}`,
    isLocked: isLocked,
    xpRequired: xpRequired,
    targets: { cards, keys, tickets },
    rewards: {
      coins,
      xpBonus,
      cards: itemQty,
      keys: itemQty,
      tickets: itemQty,
      fuel
    },
    updatedAt: Date.now()
  };

  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    alert('Firebase is not connected!');
    return;
  }

  db.ref(`/levels_config/${lvl}`).set(updatedLevelConfig)
    .then(() => {
      if (!window.adminState.levelsConfig) window.adminState.levelsConfig = {};
      window.adminState.levelsConfig[lvl] = updatedLevelConfig;
      onAdminSelectLevel(lvl);
      if (typeof window.logActivity === 'function') {
        window.logActivity('Level Updated', `Level ${lvl} requirements & rewards updated in /levels_config`, '🎯');
      }
      alert(`💾 Level ${lvl} configuration saved to Firebase (/levels_config/${lvl})!\nAll connected game clients will immediately apply these settings.`);
    })
    .catch(err => alert('Error saving level configuration: ' + err.message));
}

function autoScaleAllLevels() {
  if (!confirm('⚡ Auto-scale all 100 Levels with progressive XP, Targets & Rewards?\n\nThis will compute a smooth scaling curve for Levels 1 to 100 and write to Firebase.')) {
    return;
  }

  const allConfigs = {};
  for (let l = 1; l <= 100; l++) {
    allConfigs[l] = getDefaultAdminLevelConfig(l);
  }

  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    alert('Firebase is not connected!');
    return;
  }

  db.ref('/levels_config').set(allConfigs)
    .then(() => {
      window.adminState.levelsConfig = allConfigs;
      onAdminSelectLevel(currentSelectedAdminLevel);
      alert('✅ All 100 Levels successfully scaled and saved to Firebase (/levels_config)!');
    })
    .catch(err => alert('Error writing levels: ' + err.message));
}

function lockLevelsAbovePrompt() {
  const thresholdStr = prompt('Enter level number above which ALL levels will be LOCKED (e.g. 5 to lock Levels 6-100):', '5');
  if (!thresholdStr) return;
  const threshold = parseInt(thresholdStr, 10);
  if (isNaN(threshold) || threshold < 1) {
    alert('Please enter a valid level number (1-100).');
    return;
  }

  const levelsConfig = (window.adminState && window.adminState.levelsConfig) || {};
  const allConfigs = {};
  for (let l = 1; l <= 100; l++) {
    const base = levelsConfig[l] || getDefaultAdminLevelConfig(l);
    allConfigs[l] = {
      ...base,
      isLocked: l > threshold
    };
  }

  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    alert('Firebase is not connected!');
    return;
  }

  db.ref('/levels_config').set(allConfigs)
    .then(() => {
      window.adminState.levelsConfig = allConfigs;
      onAdminSelectLevel(currentSelectedAdminLevel);
      alert(`🔒 Levels ${threshold + 1} to 100 have been LOCKED in Firebase.\nLevels 1 to ${threshold} remain accessible.`);
    })
    .catch(err => alert('Error locking levels: ' + err.message));
}

function resetLevelsToDefaultTemplate() {
  if (!confirm('🔄 Reset all levels to default template in Firebase?')) return;
  autoScaleAllLevels();
}

window.initAdminLevelSelect = initAdminLevelSelect;
window.onAdminSelectLevel = onAdminSelectLevel;
window.stepAdminLevel = stepAdminLevel;
window.saveCurrentAdminLevel = saveCurrentAdminLevel;
window.autoScaleAllLevels = autoScaleAllLevels;
window.lockLevelsAbovePrompt = lockLevelsAbovePrompt;
window.resetLevelsToDefaultTemplate = resetLevelsToDefaultTemplate;

window.loadGlobalGameConfigFromFirebase = loadGlobalGameConfigFromFirebase;
window.saveGlobalGameConfig = saveGlobalGameConfig;

// ==========================================================================
// ADMIN ENERGY FUEL CELL SHOP PRICING & MULTIPLIERS ENGINE
// ==========================================================================
const DEFAULT_ADMIN_FUEL_CONFIG = {
  basePrices: { ad: 1, blueCoin: 10, goldCoin: 1, diamond: 10, coinPack: 150, bluePack: 75 },
  multipliers: { green: 1.0, yellow: 1.5, orange: 2.5, pink: 7.0, purple: 8.5, red: 5.0 }
};

function loadFuelCellsConfigFromFirebase() {
  const cfg = (window.adminState && window.adminState.fuelCellsConfig) || DEFAULT_ADMIN_FUEL_CONFIG;
  const base = cfg.basePrices || DEFAULT_ADMIN_FUEL_CONFIG.basePrices;
  const mults = cfg.multipliers || DEFAULT_ADMIN_FUEL_CONFIG.multipliers;

  const elAd = document.getElementById('cfgFuelBaseAd');
  const elBlue = document.getElementById('cfgFuelBaseBlue');
  const elGold = document.getElementById('cfgFuelBaseGold');
  const elDiamond = document.getElementById('cfgFuelBaseDiamond');
  const elCoinPack = document.getElementById('cfgFuelBaseCoinPack');
  const elBluePack = document.getElementById('cfgFuelBaseBluePack');

  if (elAd) elAd.value = base.ad !== undefined ? base.ad : 1;
  if (elBlue) elBlue.value = base.blueCoin !== undefined ? base.blueCoin : 10;
  if (elGold) elGold.value = base.goldCoin !== undefined ? base.goldCoin : 1;
  if (elDiamond) elDiamond.value = base.diamond !== undefined ? base.diamond : 10;
  if (elCoinPack) elCoinPack.value = base.coinPack !== undefined ? base.coinPack : 150;
  if (elBluePack) elBluePack.value = base.bluePack !== undefined ? base.bluePack : 75;

  const elGreen = document.getElementById('cfgFuelMultGreen');
  const elYellow = document.getElementById('cfgFuelMultYellow');
  const elOrange = document.getElementById('cfgFuelMultOrange');
  const elPink = document.getElementById('cfgFuelMultPink');
  const elPurple = document.getElementById('cfgFuelMultPurple');
  const elRed = document.getElementById('cfgFuelMultRed');

  if (elGreen) elGreen.value = mults.green !== undefined ? mults.green : 1.0;
  if (elYellow) elYellow.value = mults.yellow !== undefined ? mults.yellow : 1.5;
  if (elOrange) elOrange.value = mults.orange !== undefined ? mults.orange : 2.5;
  if (elPink) elPink.value = mults.pink !== undefined ? mults.pink : 7.0;
  if (elPurple) elPurple.value = mults.purple !== undefined ? mults.purple : 8.5;
  if (elRed) elRed.value = mults.red !== undefined ? mults.red : 5.0;
}

function saveFuelCellsConfigFromAdmin() {
  const executeSave = () => {
    const db = window.getDb ? window.getDb() : null;
    if (!db) {
      alert('Firebase is not connected!');
      return;
    }

    const payload = {
      basePrices: {
        ad: Math.max(1, Number(document.getElementById('cfgFuelBaseAd')?.value) || 1),
        blueCoin: Math.max(1, Number(document.getElementById('cfgFuelBaseBlue')?.value) || 10),
        goldCoin: Math.max(1, Number(document.getElementById('cfgFuelBaseGold')?.value) || 1),
        diamond: Math.max(1, Number(document.getElementById('cfgFuelBaseDiamond')?.value) || 10),
        coinPack: Math.max(1, Number(document.getElementById('cfgFuelBaseCoinPack')?.value) || 150),
        bluePack: Math.max(1, Number(document.getElementById('cfgFuelBaseBluePack')?.value) || 75)
      },
      multipliers: {
        green: Number(document.getElementById('cfgFuelMultGreen')?.value) || 1.0,
        yellow: Number(document.getElementById('cfgFuelMultYellow')?.value) || 1.5,
        orange: Number(document.getElementById('cfgFuelMultOrange')?.value) || 2.5,
        pink: Number(document.getElementById('cfgFuelMultPink')?.value) || 7.0,
        purple: Number(document.getElementById('cfgFuelMultPurple')?.value) || 8.5,
        red: Number(document.getElementById('cfgFuelMultRed')?.value) || 5.0
      },
      updatedAt: Date.now()
    };

    db.ref('/fuel_cells_config').set(payload)
      .then(() => {
        window.adminState.fuelCellsConfig = payload;
        if (typeof window.logActivity === 'function') {
          window.logActivity('Fuel Shop Updated', 'Updated base prices & color multipliers in /fuel_cells_config', '🔋');
        }
        alert('💾 Energy Fuel Cell Shop prices & multipliers saved to Firebase (/fuel_cells_config)!');
      })
      .catch(err => alert('Error saving fuel prices: ' + err.message));
  };

  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(executeSave);
  } else {
    executeSave();
  }
}

function resetFuelCellsConfigToDefault() {
  if (!confirm('Reset fuel cell pricing & multipliers to default in form?')) return;
  window.adminState.fuelCellsConfig = DEFAULT_ADMIN_FUEL_CONFIG;
  loadFuelCellsConfigFromFirebase();
}

window.loadFuelCellsConfigFromFirebase = loadFuelCellsConfigFromFirebase;
window.saveFuelCellsConfigFromAdmin = saveFuelCellsConfigFromAdmin;
window.resetFuelCellsConfigToDefault = resetFuelCellsConfigToDefault;

// ==========================================================================
// TOOL 6: ACCOUNT AUTHORIZATION & ONE ACCOUNT PER USER CONFIGURATION (/auth_config)
// ==========================================================================
function loadAuthConfigFromFirebase() {
  const db = window.getDb ? window.getDb() : null;
  if (!db) return;

  db.ref('/auth_config').once('value')
    .then(snap => {
      const val = snap.val() || {};
      const tgEl = document.getElementById('authCfgTelegram');
      const phoneEl = document.getElementById('authCfgPhone');
      const emailEl = document.getElementById('authCfgEmail');
      const oneTgEl = document.getElementById('authCfgOneTelegram');
      const onePhoneEl = document.getElementById('authCfgOnePhone');
      const oneEmailEl = document.getElementById('authCfgOneEmail');
      const linkEl = document.getElementById('authCfgLinking');

      if (tgEl) tgEl.checked = val.telegramAuth !== false;
      if (phoneEl) phoneEl.checked = val.phoneAuth !== false;
      if (emailEl) emailEl.checked = val.emailAuth !== false;
      if (oneTgEl) oneTgEl.checked = val.oneTelegramPerAccount !== false;
      if (onePhoneEl) onePhoneEl.checked = val.onePhonePerAccount !== false;
      if (oneEmailEl) oneEmailEl.checked = val.oneEmailPerAccount !== false;
      if (linkEl) linkEl.checked = val.accountLinking !== false;
    })
    .catch(err => console.warn('Error loading auth config:', err));
}

function saveAuthConfigFromAdmin() {
  const executeSave = () => {
    const db = window.getDb ? window.getDb() : null;
    if (!db) {
      alert('Firebase database not connected.');
      return;
    }

    const payload = {
      telegramAuth: Boolean(document.getElementById('authCfgTelegram')?.checked),
      phoneAuth: Boolean(document.getElementById('authCfgPhone')?.checked),
      emailAuth: Boolean(document.getElementById('authCfgEmail')?.checked),
      oneTelegramPerAccount: Boolean(document.getElementById('authCfgOneTelegram')?.checked),
      onePhonePerAccount: Boolean(document.getElementById('authCfgOnePhone')?.checked),
      oneEmailPerAccount: Boolean(document.getElementById('authCfgOneEmail')?.checked),
      accountLinking: Boolean(document.getElementById('authCfgLinking')?.checked),
      updatedAt: Date.now()
    };

    db.ref('/auth_config').set(payload)
      .then(() => {
        fetch('/api/auth/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(() => {});

        if (typeof window.logActivity === 'function') {
          window.logActivity('Auth Config Updated', 'Updated Account Authorization & Uniqueness rules in /auth_config', '🔐');
        }
        alert('💾 Account Authorization and One Account Per User configuration saved to Firebase (/auth_config)!');
      })
      .catch(err => alert('Error saving auth config: ' + err.message));
  };

  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(executeSave);
  } else {
    executeSave();
  }
}

async function scanAndMigrateIdentityIndexes() {
  const reportWrap = document.getElementById('authIndexReportWrap');
  const reportContent = document.getElementById('authIndexReportContent');

  if (reportWrap) reportWrap.style.display = 'block';
  if (reportContent) reportContent.innerHTML = '<em>Scanning Firebase player records and building identity indexes...</em>';

  try {
    const res = await fetch('/api/auth/migrate-indexes', { method: 'POST' });
    const data = await res.json();

    if (!data.ok) {
      if (reportContent) reportContent.innerHTML = `<span style="color: #dc2626;">Scan error: ${data.error || 'Failed'}</span>`;
      return;
    }

    const m = data.migration;
    let html = `
      <div style="margin-bottom: 8px;">
        <strong>✅ Scan &amp; Indexing Complete:</strong>
        Scanned <strong>${m.totalUsers}</strong> users.
        Built <strong>${m.indexedTelegram}</strong> Telegram indexes,
        <strong>${m.indexedPhones}</strong> phone indexes, and
        <strong>${m.indexedEmails}</strong> email indexes.
      </div>
    `;

    if (m.duplicatesDetected > 0) {
      html += `
        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 10px; border-radius: 8px; margin-top: 8px;">
          <span style="color: #dc2626; font-weight: 800;">⚠️ Potential Duplicate Accounts Found (${m.duplicatesDetected}):</span>
          <ul style="margin: 6px 0 0 16px; padding: 0;">
            ${m.duplicateReport.map(d => `
              <li><strong>${d.type.toUpperCase()} [${d.value}]</strong> shared by ${d.count} accounts: <code>${d.uids.join(', ')}</code></li>
            `).join('')}
          </ul>
          <p style="margin: 6px 0 0 0; font-size: 11px; color: #64748b;">
            💡 Note: Accounts are NOT automatically merged to protect user balances and referrals. Visit the <strong>Users</strong> page to review and resolve individual duplicate accounts.
          </p>
        </div>
      `;
    } else {
      html += `
        <div style="color: #15803d; font-weight: 700; margin-top: 6px;">
          ✨ Zero duplicate identities found. All accounts strictly satisfy 1 Telegram = 1 Account, 1 Phone = 1 Account, and 1 Email = 1 Account!
        </div>
      `;
    }

    if (reportContent) reportContent.innerHTML = html;
  } catch (err) {
    if (reportContent) reportContent.innerHTML = `<span style="color: #dc2626;">Network error running scan: ${err.message}</span>`;
  }
}

window.loadAuthConfigFromFirebase = loadAuthConfigFromFirebase;
window.saveAuthConfigFromAdmin = saveAuthConfigFromAdmin;
window.scanAndMigrateIdentityIndexes = scanAndMigrateIdentityIndexes;

window.addEventListener('adminUsersUpdated', renderAdminTeamUI);
window.addEventListener('gameConfigUpdated', loadGlobalGameConfigFromFirebase);
window.addEventListener('fuelCellsConfigUpdated', loadFuelCellsConfigFromFirebase);
window.addEventListener('levelsConfigUpdated', () => {
  initAdminLevelSelect();
  onAdminSelectLevel(currentSelectedAdminLevel);
});

document.addEventListener('DOMContentLoaded', () => {
  renderAdminTeamUI();
  loadGlobalGameConfigFromFirebase();
  loadFuelCellsConfigFromFirebase();
  loadAuthConfigFromFirebase();
  initAdminLevelSelect();
  onAdminSelectLevel(currentSelectedAdminLevel);
});


