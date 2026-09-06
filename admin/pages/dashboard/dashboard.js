/* ==========================================================================
   PAGE: DASHBOARD LOGIC (pages/dashboard/dashboard.js)
   ========================================================================== */

function initDashboardPage() {
  updateDashboardMetrics();
  renderDashRecentOrders();
  renderDashRecentUsers();
}

window.addEventListener('usersUpdated', () => {
  updateDashboardMetrics();
  renderDashRecentUsers();
});

window.addEventListener('rewardsUpdated', () => {
  updateDashboardMetrics();
});

window.addEventListener('requestsUpdated', () => {
  updateDashboardMetrics();
  renderDashRecentOrders();
});

function updateDashboardMetrics() {
  const users = window.adminState.users || [];
  const rewards = window.adminState.rewards || [];
  const requests = window.adminState.requests || [];

  const pendingCount = requests.filter(r => (r.status || 'pending').toLowerCase() === 'pending').length;
  const totalDiamonds = rewards.reduce((s, r) => s + (Number(r.diamondCost) || 0) * (Number(r.stock) || 0), 0);

  const elUsers = document.getElementById('dashTotalUsers');
  const elRewards = document.getElementById('dashTotalRewards');
  const elOrders = document.getElementById('dashPendingOrders');
  const elDiamonds = document.getElementById('dashTotalDiamonds');

  if (elUsers) elUsers.textContent = users.length.toLocaleString();
  if (elRewards) elRewards.textContent = rewards.length.toLocaleString();
  if (elOrders) elOrders.textContent = pendingCount.toLocaleString();
  if (elDiamonds) elDiamonds.textContent = totalDiamonds.toLocaleString() + ' 💎';
}

function renderDashRecentOrders() {
  const el = document.getElementById('dashRecentOrdersList');
  if (!el) return;
  const requests = window.adminState.requests || [];
  const recent = requests.slice(0, 5);

  if (recent.length === 0) {
    el.innerHTML = '<div style="padding: 16px; text-align: center; color: #64748b;">No recent requests found in Firebase.</div>';
    return;
  }

  let html = '';
  recent.forEach(r => {
    const pillClass = (r.status === 'approved') ? 'pill-approved' : (r.status === 'delivered') ? 'pill-delivered' : (r.status === 'rejected') ? 'pill-rejected' : 'pill-pending';
    html += `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: rgba(4, 10, 26, 0.6); border: 1px solid rgba(25, 55, 120, 0.35); border-radius: 8px; margin-bottom: 8px;">
        <div>
          <div style="font-weight: 800; font-size: 13px; color: #f8fafc;">${r.rewardTitle || 'Reward Item'}</div>
          <div style="font-size: 11px; color: #94a3b8;">${r.username || 'User'} • ${Number(r.diamondCost || 0).toLocaleString()} 💎</div>
        </div>
        <span class="status-pill ${pillClass}">${(r.status || 'pending').toUpperCase()}</span>
      </div>
    `;
  });
  el.innerHTML = html;
}

function renderDashRecentUsers() {
  const el = document.getElementById('dashRecentUsersList');
  if (!el) return;
  const users = window.adminState.users || [];
  const recent = users.slice(0, 5);

  if (recent.length === 0) {
    el.innerHTML = '<div style="padding: 16px; text-align: center; color: #64748b;">No players found in Firebase.</div>';
    return;
  }

  let html = '';
  recent.forEach(u => {
    html += `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: rgba(4, 10, 26, 0.6); border: 1px solid rgba(25, 55, 120, 0.35); border-radius: 8px; margin-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 30px; height: 30px; border-radius: 8px; background: #0284c7; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #fff; font-size: 12px;">${(u.username || 'U').charAt(0).toUpperCase()}</div>
          <div>
            <div style="font-weight: 800; font-size: 13px; color: #f8fafc;">${u.username}</div>
            <div style="font-size: 11px; color: #22d3ee;">${Number(u.diamonds).toLocaleString()} 💎 • Lv.${u.level}</div>
          </div>
        </div>
        <button onclick="openUserEditModal('${u.uid}')" class="btn-secondary" style="padding: 4px 8px; font-size: 10.5px;">Edit</button>
      </div>
    `;
  });
  el.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', initDashboardPage);
