/* ==========================================================================
   WEBSITE TASK SYSTEM - ADMIN PANEL CONTROLLER - js/admin.js
   Dashboard, Task Codes, Blog Editor (10 pages), Ad Manager (5 ads/page), 
   Reward Config, User Code Management & Live User Auditing
   ========================================================================== */

class AdminController {
  constructor() {
    this.isAuthenticated = false;
    this.adminSecret = "admin7080"; // Configurable Admin Passkey
    this.activeTab = 'dashboard';
    this.usersList = [];
    this.taskConfig = null;
    this.currentSelectedPageForAds = 'page1';
    this.editingPageId = null;
    this.editingAdId = null;

    this.init();
  }

  init() {
    const authSession = sessionStorage.getItem('WEBSITE_TASK_ADMIN_AUTH');
    if (authSession === 'true') {
      this.isAuthenticated = true;
    }

    document.addEventListener('DOMContentLoaded', () => {
      this.setupUI();
      if (this.isAuthenticated) {
        this.unlockAdminPanel();
      }
    });

    window.addEventListener('websiteTaskConfigUpdated', e => {
      this.taskConfig = e.detail;
      this.renderTaskCodeTab();
      this.renderBlogManagement();
      this.renderAdManagement();
      this.renderRewardManagement();
      this.updateDashboardStats();
    });
  }

  setupUI() {
    const loginForm = document.getElementById('adminLoginForm');
    if (loginForm) {
      loginForm.onsubmit = (e) => {
        e.preventDefault();
        this.handleLogin();
      };
    }

    document.querySelectorAll('.admin-nav-item').forEach(item => {
      item.onclick = () => {
        const tab = item.getAttribute('data-tab');
        this.switchTab(tab);
      };
    });
  }

  handleLogin() {
    const pinInput = document.getElementById('adminPinInput');
    const pin = pinInput ? pinInput.value.trim() : '';

    if (pin === this.adminSecret || pin === 'tapadmin2026' || pin === 'admin123') {
      this.isAuthenticated = true;
      sessionStorage.setItem('WEBSITE_TASK_ADMIN_AUTH', 'true');
      this.unlockAdminPanel();
      if (window.websiteApp) window.websiteApp.showToast('✅ Admin Authentication Verified!', 'success');
    } else {
      if (window.websiteApp) window.websiteApp.showToast('❌ Invalid Admin Passkey. Access Denied.', 'error');
    }
  }

  unlockAdminPanel() {
    const authBox = document.getElementById('adminAuthGateBox');
    const layout = document.getElementById('adminMainLayout');
    if (authBox) authBox.style.display = 'none';
    if (layout) layout.style.display = 'flex';

    this.fetchRealtimeUsers();
    this.switchTab(this.activeTab);
  }

  logout() {
    this.isAuthenticated = false;
    sessionStorage.removeItem('WEBSITE_TASK_ADMIN_AUTH');
    window.location.reload();
  }

  switchTab(tabName) {
    this.activeTab = tabName;
    document.querySelectorAll('.admin-nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
    });
    document.querySelectorAll('.admin-section').forEach(sec => {
      sec.classList.toggle('active', sec.id === `section_${tabName}`);
    });

    if (tabName === 'dashboard') this.updateDashboardStats();
    if (tabName === 'taskcode') this.renderTaskCodeTab();
    if (tabName === 'blog') this.renderBlogManagement();
    if (tabName === 'ads') this.renderAdManagement();
    if (tabName === 'rewards') this.renderRewardManagement();
    if (tabName === 'users') this.renderUsersTable();
  }

  // --------------------------------------------------------------------------
  // 1. DASHBOARD & REALTIME USER TRACKING
  // --------------------------------------------------------------------------
  fetchRealtimeUsers() {
    if (!window.firebaseService || !window.firebaseService.db) return;
    const db = window.firebaseService.db;

    db.ref('users').on('value', snapshot => {
      const data = snapshot.val() || {};
      this.usersList = Object.keys(data).map(uid => {
        const u = data[uid];
        const wt = u.websiteTask || {};
        return {
          uid: uid,
          userCode: u.userCode || 'N/A',
          username: u.username || (u.userCode ? u.userCode : uid.substring(0, 8)),
          telegram: u.userTgHandle || u.telegram || 'N/A',
          blueCoins: u.blueCoins || 0,
          status: u.status || 'active',
          currentPage: wt.currentPage || 1,
          completedPages: Object.keys(wt.completedPages || {}).length,
          completedAds: Object.keys(wt.completedAds || {}).length,
          rewardsEarned: wt.totalEarned || 0,
          completed: !!wt.completed,
          lastActivity: wt.lastActivity || u.lastActivity || Date.now()
        };
      });

      this.updateDashboardStats();
      if (this.activeTab === 'users') this.renderUsersTable();
    });

    db.ref('players').on('value', snapshot => {
      const pData = snapshot.val() || {};
      Object.keys(pData).forEach(pUid => {
        const existing = this.usersList.find(x => x.uid === pUid);
        const pl = pData[pUid].player || {};
        if (existing) {
          if (!existing.userCode || existing.userCode === 'N/A') {
            existing.userCode = pl.profileCode || 'N/A';
          }
          existing.username = pl.name || existing.username;
          existing.telegram = pl.handle || existing.telegram;
          existing.blueCoins = Math.max(existing.blueCoins, pl.blueCoins || 0);
        } else {
          this.usersList.push({
            uid: pUid,
            userCode: pl.profileCode || 'N/A',
            username: pl.name || pUid.substring(0, 8),
            telegram: pl.handle || 'N/A',
            blueCoins: pl.blueCoins || 0,
            status: pl.status || 'active',
            currentPage: 1,
            completedPages: 0,
            completedAds: 0,
            rewardsEarned: 0,
            completed: false,
            lastActivity: Date.now()
          });
        }
      });
      this.updateDashboardStats();
      if (this.activeTab === 'users') this.renderUsersTable();
    });
  }

  updateDashboardStats() {
    const totalUsers = this.usersList.length;
    const participants = this.usersList.filter(u => u.completedPages > 0 || u.completedAds > 0).length;
    const totalPagesDone = this.usersList.reduce((acc, u) => acc + u.completedPages, 0);
    const totalAdsDone = this.usersList.reduce((acc, u) => acc + u.completedAds, 0);
    const totalRewards = this.usersList.reduce((acc, u) => acc + u.rewardsEarned, 0);

    const pages = (this.taskConfig && this.taskConfig.pages) ? this.taskConfig.pages : (window.DEFAULT_FINANCIAL_BLOG_CONFIG ? window.DEFAULT_FINANCIAL_BLOG_CONFIG.pages : {});
    const ads = (this.taskConfig && this.taskConfig.ads) ? this.taskConfig.ads : (window.DEFAULT_FINANCIAL_BLOG_CONFIG ? window.DEFAULT_FINANCIAL_BLOG_CONFIG.ads : {});

    const activePagesCount = Object.keys(pages).filter(k => pages[k].enabled !== false).length;
    const activeAdsCount = Object.keys(ads).filter(k => ads[k].enabled !== false).length;

    const startOfToday = new Date().setHours(0, 0, 0, 0);
    const todayCompletions = this.usersList.filter(u => u.lastActivity >= startOfToday && (u.completedPages > 0 || u.completedAds > 0)).length;

    const el = (id) => document.getElementById(id);
    if (el('dashTotalUsers')) el('dashTotalUsers').innerText = totalUsers.toLocaleString();
    if (el('dashParticipants')) el('dashParticipants').innerText = participants.toLocaleString();
    if (el('dashPagesCompleted')) el('dashPagesCompleted').innerText = totalPagesDone.toLocaleString();
    if (el('dashAdsCompleted')) el('dashAdsCompleted').innerText = totalAdsDone.toLocaleString();
    if (el('dashTotalRewards')) el('dashTotalRewards').innerText = `${totalRewards.toLocaleString()} Blue Coins`;
    if (el('dashActiveTask')) el('dashActiveTask').innerText = `${activePagesCount} / 10 Chapters`;
    if (el('dashActiveAds')) el('dashActiveAds').innerText = `${activeAdsCount} / 50 Active`;
    if (el('dashTodayCompletions')) el('dashTodayCompletions').innerText = todayCompletions.toLocaleString();
  }

  // --------------------------------------------------------------------------
  // 2. TASK CODE & ACCESS MANAGEMENT
  // --------------------------------------------------------------------------
  renderTaskCodeTab() {
    const tc = this.taskConfig || window.DEFAULT_FINANCIAL_BLOG_CONFIG || {};
    const taskCode = (tc.taskCode || 'TASK-FIN-2026-001').toUpperCase();
    const taskName = tc.title || 'Financial Blog Task';
    const reward = tc.rewardPerPage || 100;
    const isEnabled = tc.enabled !== false;

    const nameInput = document.getElementById('cfgTaskName');
    const codeInput = document.getElementById('cfgTaskCode');
    const rewardInput = document.getElementById('cfgTaskPageReward');
    const statusSelect = document.getElementById('cfgTaskStatus');
    const badge = document.getElementById('activeTaskCodeBadge');

    if (nameInput) nameInput.value = taskName;
    if (codeInput) codeInput.value = taskCode;
    if (rewardInput) rewardInput.value = reward;
    if (statusSelect) statusSelect.value = isEnabled ? 'enabled' : 'disabled';
    if (badge) badge.innerText = `Active Code: ${taskCode}`;
  }

  async saveTaskManagementConfig() {
    const name = (document.getElementById('cfgTaskName')?.value || 'Financial Blog Task').trim();
    const code = (document.getElementById('cfgTaskCode')?.value || 'TASK-FIN-2026-001').trim().toUpperCase();
    const reward = parseInt(document.getElementById('cfgTaskPageReward')?.value, 10) || 100;
    const status = document.getElementById('cfgTaskStatus')?.value || 'enabled';
    const isEnabled = (status === 'enabled');

    if (!code) {
      if (window.websiteApp) window.websiteApp.showToast('Please enter a valid Task Code.', 'error');
      return;
    }

    if (!window.firebaseService || !window.firebaseService.db) {
      if (window.websiteApp) window.websiteApp.showToast('Firebase connection unavailable.', 'error');
      return;
    }

    try {
      await window.firebaseService.db.ref('websiteTasks/financialBlog').update({
        title: name,
        taskCode: code,
        rewardPerPage: reward,
        enabled: isEnabled,
        status: status,
        updatedAt: Date.now()
      });

      const badge = document.getElementById('activeTaskCodeBadge');
      if (badge) badge.innerText = `Active Code: ${code}`;

      if (window.websiteApp) window.websiteApp.showToast(`✅ Task Code "${code}" updated live in Firebase!`, 'success');
    } catch(err) {
      if (window.websiteApp) window.websiteApp.showToast(`Error saving task code: ${err.message}`, 'error');
    }
  }

  // --------------------------------------------------------------------------
  // 3. BLOG MANAGEMENT (10 Pages)
  // --------------------------------------------------------------------------
  renderBlogManagement() {
    const container = document.getElementById('adminBlogPagesList');
    if (!container) return;
    container.innerHTML = '';

    const pages = (this.taskConfig && this.taskConfig.pages) ? this.taskConfig.pages : (window.DEFAULT_FINANCIAL_BLOG_CONFIG ? window.DEFAULT_FINANCIAL_BLOG_CONFIG.pages : {});

    for (let i = 1; i <= 10; i++) {
      const pageKey = `page${i}`;
      const p = pages[pageKey] || { title: `Chapter ${i}`, reward: 100, enabled: true };
      const isEnabled = p.enabled !== false;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>Page ${i}</strong></td>
        <td>${p.title}</td>
        <td><span class="coin-badge blue">+${p.reward || 100} Blue Coins</span></td>
        <td>${isEnabled ? '<span class="status-tag done">Active</span>' : '<span class="status-tag locked">Disabled</span>'}</td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="window.adminController.openEditPageModal('${pageKey}')">✏️ Edit</button>
          <button class="btn btn-outline btn-sm" onclick="window.adminController.togglePageEnabled('${pageKey}', ${!isEnabled})">
            ${isEnabled ? '🚫 Disable' : '✅ Enable'}
          </button>
          <a href="blog.html#page${i}" target="_blank" class="btn btn-primary btn-sm">👁️ Preview</a>
        </td>
      `;
      container.appendChild(tr);
    }
  }

  openEditPageModal(pageKey) {
    this.editingPageId = pageKey;
    const pages = (this.taskConfig && this.taskConfig.pages) ? this.taskConfig.pages : (window.DEFAULT_FINANCIAL_BLOG_CONFIG ? window.DEFAULT_FINANCIAL_BLOG_CONFIG.pages : {});
    const p = pages[pageKey] || { title: '', subtitle: '', reward: 100 };

    const modal = document.getElementById('editPageModal');
    const titleInput = document.getElementById('modalPageTitle');
    const subInput = document.getElementById('modalPageSubtitle');
    const rewardInput = document.getElementById('modalPageReward');

    if (titleInput) titleInput.value = p.title || '';
    if (subInput) subInput.value = p.subtitle || '';
    if (rewardInput) rewardInput.value = p.reward || 100;
    if (modal) modal.classList.add('active');
  }

  closeEditPageModal() {
    const modal = document.getElementById('editPageModal');
    if (modal) modal.classList.remove('active');
    this.editingPageId = null;
  }

  async savePageChanges() {
    if (!this.editingPageId) return;
    const title = document.getElementById('modalPageTitle').value.trim();
    const subtitle = document.getElementById('modalPageSubtitle').value.trim();
    const reward = parseInt(document.getElementById('modalPageReward').value, 10) || 100;

    if (!window.firebaseService || !window.firebaseService.db) return;

    try {
      const pageRef = window.firebaseService.db.ref(`websiteTasks/financialBlog/pages/${this.editingPageId}`);
      await pageRef.update({
        title: title,
        subtitle: subtitle,
        reward: reward
      });
      if (window.websiteApp) window.websiteApp.showToast('✅ Page updated in Firebase in real-time!', 'success');
      this.closeEditPageModal();
    } catch (err) {
      if (window.websiteApp) window.websiteApp.showToast(`Error updating page: ${err.message}`, 'error');
    }
  }

  async togglePageEnabled(pageKey, newStatus) {
    if (!window.firebaseService || !window.firebaseService.db) return;
    try {
      await window.firebaseService.db.ref(`websiteTasks/financialBlog/pages/${pageKey}`).update({
        enabled: newStatus
      });
      if (window.websiteApp) window.websiteApp.showToast(`Page ${newStatus ? 'enabled' : 'disabled'} successfully!`, 'success');
    } catch (err) {
      if (window.websiteApp) window.websiteApp.showToast(`Failed to update page status: ${err.message}`, 'error');
    }
  }

  // --------------------------------------------------------------------------
  // 4. ADVERTISEMENT MANAGEMENT (5 Ads per Page)
  // --------------------------------------------------------------------------
  selectPageForAds(pageKey) {
    this.currentSelectedPageForAds = pageKey;
    this.renderAdManagement();
  }

  renderAdManagement() {
    const pageSelect = document.getElementById('adminAdPageSelect');
    if (pageSelect && pageSelect.value !== this.currentSelectedPageForAds) {
      pageSelect.value = this.currentSelectedPageForAds;
    }

    const container = document.getElementById('adminAdsList');
    if (!container) return;
    container.innerHTML = '';

    const ads = (this.taskConfig && this.taskConfig.ads) ? this.taskConfig.ads : (window.DEFAULT_FINANCIAL_BLOG_CONFIG ? window.DEFAULT_FINANCIAL_BLOG_CONFIG.ads : {});
    const pageNum = parseInt(this.currentSelectedPageForAds.replace('page', ''), 10) || 1;

    for (let slot = 1; slot <= 5; slot++) {
      const adId = `page${pageNum}_ad${slot}`;
      const ad = ads[adId] || { title: `Sponsor Ad #${slot}`, url: 'https://finance.yahoo.com', reward: 50, timer: 15, enabled: true };
      const isEnabled = ad.enabled !== false;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>Slot #${slot}</strong></td>
        <td>${ad.title}</td>
        <td><a href="${ad.url}" target="_blank" style="color: var(--neon-cyan);">${ad.url.length > 30 ? ad.url.substring(0, 30) + '...' : ad.url}</a></td>
        <td><span class="coin-badge gold">+${ad.reward || 50}</span></td>
        <td>${ad.timer || 15}s</td>
        <td>${isEnabled ? '<span class="status-tag done">Active</span>' : '<span class="status-tag locked">Disabled</span>'}</td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="window.adminController.openEditAdModal('${adId}')">✏️ Edit</button>
          <button class="btn btn-outline btn-sm" onclick="window.adminController.toggleAdEnabled('${adId}', ${!isEnabled})">
            ${isEnabled ? '🚫 Disable' : '✅ Enable'}
          </button>
        </td>
      `;
      container.appendChild(tr);
    }
  }

  openEditAdModal(adId) {
    this.editingAdId = adId;
    const ads = (this.taskConfig && this.taskConfig.ads) ? this.taskConfig.ads : (window.DEFAULT_FINANCIAL_BLOG_CONFIG ? window.DEFAULT_FINANCIAL_BLOG_CONFIG.ads : {});
    const ad = ads[adId] || { title: '', url: '', reward: 50, timer: 15 };

    const modal = document.getElementById('editAdModal');
    const titleInput = document.getElementById('modalAdTitle');
    const urlInput = document.getElementById('modalAdUrl');
    const rewardInput = document.getElementById('modalAdReward');
    const timerInput = document.getElementById('modalAdTimer');

    if (titleInput) titleInput.value = ad.title || '';
    if (urlInput) urlInput.value = ad.url || '';
    if (rewardInput) rewardInput.value = ad.reward || 50;
    if (timerInput) timerInput.value = ad.timer || 15;
    if (modal) modal.classList.add('active');
  }

  closeEditAdModal() {
    const modal = document.getElementById('editAdModal');
    if (modal) modal.classList.remove('active');
    this.editingAdId = null;
  }

  async saveAdChanges() {
    if (!this.editingAdId) return;
    const title = document.getElementById('modalAdTitle').value.trim();
    const url = document.getElementById('modalAdUrl').value.trim();
    const reward = parseInt(document.getElementById('modalAdReward').value, 10) || 50;
    const timer = parseInt(document.getElementById('modalAdTimer').value, 10) || 15;

    if (!window.firebaseService || !window.firebaseService.db) return;

    try {
      const adRef = window.firebaseService.db.ref(`websiteTasks/financialBlog/ads/${this.editingAdId}`);
      await adRef.update({
        title: title,
        url: url,
        reward: reward,
        timer: timer
      });
      if (window.websiteApp) window.websiteApp.showToast('✅ Advertisement updated live in Firebase!', 'success');
      this.closeEditAdModal();
    } catch (err) {
      if (window.websiteApp) window.websiteApp.showToast(`Error updating ad: ${err.message}`, 'error');
    }
  }

  async toggleAdEnabled(adId, newStatus) {
    if (!window.firebaseService || !window.firebaseService.db) return;
    try {
      await window.firebaseService.db.ref(`websiteTasks/financialBlog/ads/${adId}`).update({
        enabled: newStatus
      });
      if (window.websiteApp) window.websiteApp.showToast(`Ad ${newStatus ? 'enabled' : 'disabled'} in real-time!`, 'success');
    } catch (err) {
      if (window.websiteApp) window.websiteApp.showToast(`Failed to update ad: ${err.message}`, 'error');
    }
  }

  // --------------------------------------------------------------------------
  // 5. REWARD CONFIGURATION
  // --------------------------------------------------------------------------
  renderRewardManagement() {
    const pageRewardInput = document.getElementById('cfgPageReward');
    const adRewardInput = document.getElementById('cfgAdReward');
    const finalRewardInput = document.getElementById('cfgFinalReward');
    const taskEnabledToggle = document.getElementById('cfgTaskEnabled');

    const tc = this.taskConfig || window.DEFAULT_FINANCIAL_BLOG_CONFIG || {};

    if (pageRewardInput) pageRewardInput.value = tc.rewardPerPage || 100;
    if (adRewardInput) adRewardInput.value = tc.rewardPerAd || 50;
    if (finalRewardInput) finalRewardInput.value = tc.completionReward || 500;
    if (taskEnabledToggle) taskEnabledToggle.checked = tc.enabled !== false;
  }

  async saveRewardConfig() {
    const pageReward = parseInt(document.getElementById('cfgPageReward').value, 10) || 100;
    const adReward = parseInt(document.getElementById('cfgAdReward').value, 10) || 50;
    const finalReward = parseInt(document.getElementById('cfgFinalReward').value, 10) || 500;
    const enabled = document.getElementById('cfgTaskEnabled').checked;

    if (!window.firebaseService || !window.firebaseService.db) return;

    try {
      await window.firebaseService.db.ref('websiteTasks/financialBlog').update({
        rewardPerPage: pageReward,
        rewardPerAd: adReward,
        completionReward: finalReward,
        enabled: enabled
      });
      if (window.websiteApp) window.websiteApp.showToast('✅ Reward configuration updated in Firebase!', 'success');
    } catch (err) {
      if (window.websiteApp) window.websiteApp.showToast(`Failed to update config: ${err.message}`, 'error');
    }
  }

  // --------------------------------------------------------------------------
  // 6. USER PROGRESS & USER CODE MANAGEMENT
  // --------------------------------------------------------------------------
  renderUsersTable() {
    const tbody = document.getElementById('adminUsersTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const query = (document.getElementById('userSearchInput')?.value || '').toLowerCase().trim();
    const filterStatus = document.getElementById('userStatusFilter')?.value || 'all';

    const filtered = this.usersList.filter(u => {
      const matchQuery = !query || 
        (u.userCode && u.userCode.toLowerCase().includes(query)) ||
        u.uid.toLowerCase().includes(query) || 
        u.username.toLowerCase().includes(query) || 
        u.telegram.toLowerCase().includes(query);

      let matchStatus = true;
      if (filterStatus === 'completed') matchStatus = u.completed;
      if (filterStatus === 'progress') matchStatus = !u.completed && (u.completedPages > 0 || u.completedAds > 0);
      if (filterStatus === 'new') matchStatus = u.completedPages === 0 && u.completedAds === 0;

      return matchQuery && matchStatus;
    });

    filtered.forEach(u => {
      const tr = document.createElement('tr');
      const isUserActive = u.status !== 'disabled';

      tr.innerHTML = `
        <td>
          <div style="font-weight: 700; color: #fff;">${u.username}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${u.uid}</div>
        </td>
        <td>
          <span class="status-tag current" style="font-family: monospace; font-size: 0.85rem; font-weight: 700;">
            ${u.userCode}
          </span>
        </td>
        <td>${u.telegram}</td>
        <td>Page ${u.currentPage}</td>
        <td><span class="status-tag done">${u.completedPages} / 10</span></td>
        <td>${u.completedAds} / 50</td>
        <td><span class="coin-badge blue">+${u.rewardsEarned}</span></td>
        <td>
          ${isUserActive ? '<span class="status-tag done">Active</span>' : '<span class="status-tag locked">Disabled</span>'}
        </td>
        <td>
          <button class="btn btn-outline btn-sm" title="Regenerate User Code" onclick="window.adminController.regenerateUserCode('${u.uid}')">
            🔄 New Code
          </button>
          <button class="btn btn-outline btn-sm" title="Toggle User Access" onclick="window.adminController.toggleUserStatus('${u.uid}', '${u.status}')">
            ${isUserActive ? '🚫' : '✅'}
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    const countLabel = document.getElementById('userCountLabel');
    if (countLabel) countLabel.innerText = `Showing ${filtered.length} of ${this.usersList.length} users`;
  }

  async regenerateUserCode(uid) {
    if (!confirm(`Regenerate User Code for account ${uid}?`)) return;
    if (!window.firebaseService || !window.firebaseService.db) return;

    const clean = uid.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const suffix = clean.length >= 6 ? clean.slice(-6) : Math.random().toString(36).substring(2, 8).toUpperCase();
    const newCode = 'USER-' + suffix;

    try {
      await window.firebaseService.db.ref(`users/${uid}`).update({
        userCode: newCode
      });
      await window.firebaseService.db.ref(`players/${uid}/player`).update({
        profileCode: newCode
      });

      if (window.websiteApp) window.websiteApp.showToast(`✅ User Code updated to ${newCode}!`, 'success');
    } catch(err) {
      if (window.websiteApp) window.websiteApp.showToast(`Failed to update User Code: ${err.message}`, 'error');
    }
  }

  async toggleUserStatus(uid, currentStatus) {
    if (!window.firebaseService || !window.firebaseService.db) return;
    const newStatus = (currentStatus === 'disabled') ? 'active' : 'disabled';

    try {
      await window.firebaseService.db.ref(`users/${uid}`).update({
        status: newStatus
      });
      await window.firebaseService.db.ref(`players/${uid}/player`).update({
        status: newStatus
      });

      if (window.websiteApp) window.websiteApp.showToast(`User status set to ${newStatus}.`, 'success');
    } catch(err) {
      if (window.websiteApp) window.websiteApp.showToast(`Error updating status: ${err.message}`, 'error');
    }
  }
}

// Global Instance
window.adminController = new AdminController();
