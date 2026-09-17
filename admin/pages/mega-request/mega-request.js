/* ==========================================================================
   PAGE: MEGA REDEMPTION REQUESTS (pages/mega-request/mega-request.js)
   Shows: User Name, Order Name, Website Task Completed Count, Approval Button
   ========================================================================== */

let requestsFilter = 'all';
let managingRequestId = null;

window.addEventListener('requestsUpdated', () => {
  renderRequestsTable();
});

window.addEventListener('usersUpdated', () => {
  renderRequestsTable();
});

document.addEventListener('DOMContentLoaded', () => {
  renderRequestsTable();
});

function renderRequestsTable() {
  const tbody = document.getElementById('requestsTableBody');
  if (!tbody) return;

  const requests = window.adminState.requests || [];
  const users = window.adminState.users || [];

  const filtered = requests.filter(r => {
    if (requestsFilter === 'all') return true;
    return (r.status || 'pending').toLowerCase() === requestsFilter.toLowerCase();
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #64748b; padding: 36px;">No redemption requests found in "${requestsFilter}" status.</td></tr>`;
    return;
  }

  let html = '';
  filtered.forEach(r => {
    const status = (r.status || 'pending').toLowerCase();
    const pillClass = (status === 'approved') ? 'pill-approved' : (status === 'delivered') ? 'pill-delivered' : (status === 'rejected') ? 'pill-rejected' : 'pill-pending';
    
    // 1. User Name
    const userName = r.username || r.userName || 'Player';
    const tgDisplay = r.telegramHandle || r.userTgHandle || r.telegramId || '';

    // 2. Order Name
    const orderName = r.rewardTitle || r.itemTitle || r.orderName || r.title || 'Mega Reward Item';

    // 3. Website Task Completed Count (cross-referenced with user state)
    const user = users.find(u => u.uid === r.userId || u.username === userName || (u.telegram && u.telegram === tgDisplay));
    const webTasksCount = user ? (Number(user.webTasksDone || user.webDone) || 0) : (Number(r.webTasksCompleted || r.websiteTasksCount) || 0);

    // 4. Diamond Cost & Shipping
    const diamondCost = Number(r.diamondCost || r.diamondsCost || r.diamonds || 0);
    const shipDisplay = r.shippingDetails || r.deliveryInfo || r.deliveryAddress || 'Telegram / Digital';
    const dateDisplay = r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recent';

    html += `
      <tr>
        <td style="font-family: 'JetBrains Mono', monospace; font-size: 11.5px; color: #0284c7; font-weight: 700;">#${(r.id || 'REQ').substring(0, 8)}</td>
        
        <!-- User Name -->
        <td>
          <div style="font-weight: 800; color: #0f172a; font-size: 13.5px;">${userName}</div>
          ${tgDisplay ? `<div style="font-size: 11px; color: #64748b;">${tgDisplay}</div>` : ''}
        </td>

        <!-- Order Name -->
        <td>
          <div style="font-weight: 800; color: #0284c7; font-size: 13.5px;">${orderName}</div>
        </td>

        <!-- Website Tasks Completed Count -->
        <td>
          <span style="display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 99px; background: rgba(2, 132, 199, 0.1); color: #0284c7; font-size: 11.5px; font-weight: 800; font-family: 'JetBrains Mono', monospace;">
            🌐 ${webTasksCount} Quests Done
          </span>
        </td>

        <!-- Diamonds -->
        <td style="font-weight: 800; color: #d97706; font-size: 13px;">${diamondCost.toLocaleString()} 💎</td>

        <!-- Shipping / Delivery -->
        <td style="font-size: 12px; color: #475569; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${shipDisplay}">
          ${shipDisplay}
        </td>

        <!-- Date -->
        <td style="font-size: 12px; color: #64748b;">${dateDisplay}</td>

        <!-- Status -->
        <td><span class="status-pill ${pillClass}">${status.toUpperCase()}</span></td>

        <!-- Direct Approval Button & Actions -->
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 6px; align-items: center;">
            ${status !== 'approved' && status !== 'delivered' ? `
              <button onclick="quickApproveOrder('${r.id}')" class="btn-primary" style="padding: 5px 12px; font-size: 11.5px; background: linear-gradient(135deg, #059669 0%, #10b981 100%);" title="Direct 1-Click Approve Order">
                ✅ Approve
              </button>
            ` : ''}
            <button onclick="openRequestManageModal('${r.id}')" class="btn-secondary" style="padding: 5px 10px; font-size: 11.5px;">
              Manage
            </button>
          </div>
        </td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

function quickApproveOrder(id) {
  const executeApprove = () => {
    const db = window.getDb ? window.getDb() : null;
    if (!db) {
      alert('Firebase is not connected!');
      return;
    }

    db.ref(`/reward_requests/${id}`).update({
      status: 'approved',
      approvedAt: new Date().toISOString()
    }).then(() => {
      const requests = window.adminState.requests || [];
      const req = requests.find(r => r.id === id);
      if (req) req.status = 'approved';
      renderRequestsTable();
      alert(`✅ Order #${id.substring(0, 8)} approved successfully!`);
    }).catch(err => alert('Firebase error: ' + err.message));
  };

  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(executeApprove);
  } else {
    executeApprove();
  }
}

function filterRequestsTable(status) {
  requestsFilter = status;
  document.querySelectorAll('[data-reqfilter]').forEach(b => {
    if (b.getAttribute('data-reqfilter') === status) b.classList.add('active');
    else b.classList.remove('active');
  });
  renderRequestsTable();
}

function openRequestManageModal(id) {
  const requests = window.adminState.requests || [];
  const req = requests.find(r => r.id === id);
  if (!req) return;
  managingRequestId = id;

  const users = window.adminState.users || [];
  const userName = req.username || req.userName || 'User';
  const user = users.find(u => u.uid === req.userId || u.username === userName);
  const webTasksCount = user ? (Number(user.webTasksDone || user.webDone) || 0) : (Number(req.webTasksCompleted) || 0);

  if (document.getElementById('modalReqUser')) {
    document.getElementById('modalReqUser').textContent = `${userName} (🌐 ${webTasksCount} Website Quests Done)`;
  }
  if (document.getElementById('modalReqItem')) {
    document.getElementById('modalReqItem').textContent = req.rewardTitle || req.itemTitle || req.orderName || 'Reward';
  }
  if (document.getElementById('modalReqDiamonds')) {
    document.getElementById('modalReqDiamonds').textContent = `${Number(req.diamondCost || req.diamondsCost || req.diamonds || 0).toLocaleString()} Diamonds 💎`;
  }
  if (document.getElementById('modalReqShipping')) {
    document.getElementById('modalReqShipping').textContent = req.shippingDetails || req.deliveryInfo || req.deliveryAddress || 'No address';
  }
  if (document.getElementById('modalReqStatus')) {
    document.getElementById('modalReqStatus').value = (req.status || 'pending').toLowerCase();
  }
  if (document.getElementById('modalReqNotes')) {
    document.getElementById('modalReqNotes').value = req.adminNotes || '';
  }

  const modal = document.getElementById('requestManageModal');
  if (modal) modal.classList.add('open');
}

function closeRequestManageModal() {
  const modal = document.getElementById('requestManageModal');
  if (modal) modal.classList.remove('open');
  managingRequestId = null;
}

function saveRequestStatusToFirebase() {
  const executeSaveStatus = () => {
    const db = window.getDb ? window.getDb() : null;
    if (!managingRequestId || !db) return;
    const id = managingRequestId;
    const status = document.getElementById('modalReqStatus')?.value || 'pending';
    const notes = document.getElementById('modalReqNotes')?.value.trim() || '';

    db.ref(`/reward_requests/${id}`).update({
      status: status,
      adminNotes: notes,
      updatedAt: new Date().toISOString()
    }).then(() => {
      const requests = window.adminState.requests || [];
      const req = requests.find(r => r.id === id);
      if (req) {
        req.status = status;
        req.adminNotes = notes;
      }
      closeRequestManageModal();
      renderRequestsTable();
      alert(`Order #${id.substring(0, 8)} updated to ${status.toUpperCase()}!`);
    }).catch(err => alert('Firebase error: ' + err.message));
  };

  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(executeSaveStatus);
  } else {
    executeSaveStatus();
  }
}

function seedSampleRequestsToFirebase() {
  // Deprecated: Sample data seeding removed. Orders are purely received from players in Firebase.
}

// Global exports
window.renderRequestsTable = renderRequestsTable;
window.filterRequestsTable = filterRequestsTable;
window.quickApproveOrder = quickApproveOrder;
window.openRequestManageModal = openRequestManageModal;
window.closeRequestManageModal = closeRequestManageModal;
window.saveRequestStatusToFirebase = saveRequestStatusToFirebase;
window.seedSampleRequestsToFirebase = seedSampleRequestsToFirebase;
