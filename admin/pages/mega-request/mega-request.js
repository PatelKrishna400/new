/* ==========================================================================
   PAGE: MEGA REDEMPTION & WITHDRAWAL REQUESTS (pages/mega-request/mega-request.js)
   - Real-time Wallet / Withdrawal Management directly connected to Firebase RTDB
   - Statuses: Pending, Approved, Rejected, Completed
   - Displays: User, UID, Amount, Stars/Coins, Payment Info, Tx ID, Date, Status
   - Instant 1-click Status Transitions & Modal Management
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

  const requests = (window.adminState && window.adminState.rewardRequests)
    ? window.adminState.rewardRequests
    : (window.adminState && window.adminState.requests ? window.adminState.requests : []);

  const users = (window.adminState && window.adminState.users) ? window.adminState.users : [];

  const filtered = requests.filter(r => {
    const s = (r.status || 'pending').toLowerCase();
    const normalizedStatus = (s === 'delivered') ? 'completed' : s;
    if (requestsFilter === 'all') return true;
    return normalizedStatus === requestsFilter.toLowerCase();
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #64748b; padding: 36px;">No requests found in "${requestsFilter}" status.</td></tr>`;
    return;
  }

  let html = '';
  filtered.forEach(r => {
    const rawStatus = (r.status || 'pending').toLowerCase();
    const status = (rawStatus === 'delivered') ? 'completed' : rawStatus;

    let pillClass = 'pill-pending';
    let pillStyle = 'background: rgba(245, 158, 11, 0.15); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.3);';

    if (status === 'approved') {
      pillClass = 'pill-approved';
      pillStyle = 'background: rgba(59, 130, 246, 0.15); color: #2563eb; border: 1px solid rgba(59, 130, 246, 0.3);';
    } else if (status === 'completed') {
      pillClass = 'pill-delivered';
      pillStyle = 'background: rgba(16, 185, 129, 0.15); color: #059669; border: 1px solid rgba(16, 185, 129, 0.3);';
    } else if (status === 'rejected') {
      pillClass = 'pill-rejected';
      pillStyle = 'background: rgba(239, 68, 68, 0.15); color: #dc2626; border: 1px solid rgba(239, 68, 68, 0.3);';
    }

    // 1. User info
    const userName = r.username || r.userName || 'Player';
    const uid = r.userId || r.uid || '-';
    const user = users.find(u => u.uid === uid || u.username === userName);
    const userDisplay = user ? (user.name || user.username) : userName;

    // 2. Order / Item / Amount info
    const orderName = r.rewardTitle || r.itemTitle || r.orderName || r.title || (r.amount ? `Withdrawal ${r.amount}` : 'Reward Claim');
    const amountVal = r.amount || r.diamondCost || r.diamondsCost || r.coinsCost || 0;
    const currencyType = r.currency || r.costType || (r.diamondCost ? 'Diamonds 💎' : 'Coins 🪙');

    // 3. Payment / Shipping info
    const payInfo = r.paymentInfo || r.walletAddress || r.upiId || r.shippingDetails || r.deliveryAddress || r.accountDetails || 'Digital delivery';
    const txId = r.txId || r.transactionId || r.referenceId || r.id || 'N/A';

    // 4. Date
    const rawDate = r.createdAt || r.date || r.timestamp;
    const dateDisplay = rawDate ? new Date(rawDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent';

    html += `
      <tr>
        <!-- Tx / Request ID -->
        <td>
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 11.5px; color: #0284c7; font-weight: 700;">
            #${escapeReqText((r.id || 'REQ').substring(0, 8))}
          </div>
          ${txId !== r.id ? `<span style="font-size: 10px; color: #64748b; font-family: monospace;">Ref: ${escapeReqText(txId.slice(0, 10))}</span>` : ''}
        </td>

        <!-- User & UID -->
        <td>
          <div style="font-weight: 800; color: #0f172a; font-size: 13px;">${escapeReqText(userDisplay)}</div>
          <code style="font-size: 10.5px; color: #64748b; background: #f1f5f9; padding: 1px 4px; border-radius: 3px;" title="${uid}">
            ${escapeReqText(uid.length > 12 ? uid.slice(0, 10) + '...' : uid)}
          </code>
        </td>

        <!-- Amount / Item -->
        <td>
          <div style="font-weight: 700; color: #0284c7; font-size: 13px;">${escapeReqText(orderName)}</div>
        </td>

        <!-- Cost / Currency -->
        <td>
          <span style="font-weight: 800; color: #d97706; font-size: 13px; font-family: 'JetBrains Mono', monospace;">
            ${Number(amountVal).toLocaleString()} ${escapeReqText(currencyType)}
          </span>
        </td>

        <!-- Payment Info -->
        <td>
          <div style="font-size: 12px; color: #334155; max-width: 170px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeReqText(payInfo)}">
            ${escapeReqText(payInfo)}
          </div>
        </td>

        <!-- Date -->
        <td style="font-size: 12px; color: #64748b; white-space: nowrap;">${dateDisplay}</td>

        <!-- Status -->
        <td>
          <span class="status-pill ${pillClass}" style="${pillStyle}; text-transform: uppercase; font-size: 10.5px; font-weight: 800; padding: 2px 8px; border-radius: 99px;">
            ${status.toUpperCase()}
          </span>
        </td>

        <!-- Actions -->
        <td style="text-align: right; white-space: nowrap;">
          <div style="display: inline-flex; gap: 4px; align-items: center;">
            ${status === 'pending' ? `
              <button onclick="setWithdrawalStatusDirect('${r.id}', 'approved')" class="btn-primary" style="padding: 4px 8px; font-size: 11px; background: #0284c7;" title="Approve Request">
                ✓ Approve
              </button>
              <button onclick="setWithdrawalStatusDirect('${r.id}', 'rejected')" class="btn-secondary" style="padding: 4px 8px; font-size: 11px; color: #dc2626; border-color: #fca5a5;" title="Reject Request">
                ✕ Reject
              </button>
            ` : ''}

            ${status === 'approved' ? `
              <button onclick="setWithdrawalStatusDirect('${r.id}', 'completed')" class="btn-primary" style="padding: 4px 8px; font-size: 11px; background: #059669;" title="Mark as Completed">
                ✓ Complete
              </button>
              <button onclick="setWithdrawalStatusDirect('${r.id}', 'rejected')" class="btn-secondary" style="padding: 4px 8px; font-size: 11px; color: #dc2626; border-color: #fca5a5;" title="Reject Request">
                ✕ Reject
              </button>
            ` : ''}

            <button onclick="openRequestManageModal('${r.id}')" class="btn-secondary" style="padding: 4px 8px; font-size: 11px;">
              Manage
            </button>
          </div>
        </td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

/**
 * Direct 1-Click Status Update (Pending -> Approved / Completed / Rejected)
 */
function setWithdrawalStatusDirect(id, nextStatus) {
  const confirmMsg = `Update request #${id.substring(0, 8)} to status: ${nextStatus.toUpperCase()}?`;
  if (!confirm(confirmMsg)) return;

  if (typeof window.updateWithdrawalStatus === 'function') {
    window.updateWithdrawalStatus(id, nextStatus)
      .then(() => {
        renderRequestsTable();
      })
      .catch(err => alert('Firebase Error: ' + err.message));
  } else {
    const db = window.getDb ? window.getDb() : null;
    if (!db) return;
    db.ref(`/reward_requests/${id}`).update({
      status: nextStatus,
      updatedAt: Date.now()
    }).then(() => renderRequestsTable());
  }
}
window.setWithdrawalStatusDirect = setWithdrawalStatusDirect;

function filterRequestsTable(status) {
  requestsFilter = status;
  document.querySelectorAll('[data-reqfilter]').forEach(b => {
    if (b.getAttribute('data-reqfilter') === status) b.classList.add('active');
    else b.classList.remove('active');
  });
  renderRequestsTable();
}
window.filterRequestsTable = filterRequestsTable;

function openRequestManageModal(id) {
  const requests = (window.adminState && window.adminState.rewardRequests)
    ? window.adminState.rewardRequests
    : (window.adminState && window.adminState.requests ? window.adminState.requests : []);

  const req = requests.find(r => r.id === id);
  if (!req) return;
  managingRequestId = id;
  window.currentManagingRequestId = id;

  const users = (window.adminState && window.adminState.users) ? window.adminState.users : [];
  const userName = req.username || req.userName || 'User';
  const user = users.find(u => u.uid === req.userId || u.username === userName);
  const webTasksCount = user ? (Number(user.webTasksDone || user.webDone) || 0) : (Number(req.webTasksCompleted) || 0);

  if (document.getElementById('modalReqUser')) {
    document.getElementById('modalReqUser').textContent = `${user ? (user.name || user.username) : userName} (UID: ${req.userId || '-'})`;
  }
  if (document.getElementById('modalReqItem')) {
    document.getElementById('modalReqItem').textContent = req.rewardTitle || req.itemTitle || req.orderName || (req.amount ? `Withdrawal ${req.amount}` : 'Reward');
  }
  if (document.getElementById('modalReqDiamonds')) {
    const amountVal = req.amount || req.diamondCost || req.diamondsCost || req.diamonds || req.coins || 0;
    const curr = req.currency || (req.diamondCost ? 'Diamonds 💎' : 'Coins 🪙');
    document.getElementById('modalReqDiamonds').textContent = `${Number(amountVal).toLocaleString()} ${curr}`;
  }
  if (document.getElementById('modalReqShipping')) {
    document.getElementById('modalReqShipping').textContent = req.paymentInfo || req.walletAddress || req.upiId || req.shippingDetails || req.deliveryInfo || req.deliveryAddress || 'Direct In-App Delivery';
  }
  if (document.getElementById('modalReqStatus')) {
    const rawS = (req.status || 'pending').toLowerCase();
    document.getElementById('modalReqStatus').value = (rawS === 'delivered') ? 'completed' : rawS;
  }
  if (document.getElementById('modalReqNotes')) {
    document.getElementById('modalReqNotes').value = req.notes || req.adminNotes || req.txId || '';
  }

  const modal = document.getElementById('requestManageModal');
  if (modal) modal.classList.add('open');
}
window.openRequestManageModal = openRequestManageModal;

function closeRequestManageModal() {
  const modal = document.getElementById('requestManageModal');
  if (modal) modal.classList.remove('open');
  managingRequestId = null;
  window.currentManagingRequestId = null;
}
window.closeRequestManageModal = closeRequestManageModal;

function saveRequestStatusToFirebase() {
  const id = managingRequestId || window.currentManagingRequestId;
  if (!id) return;

  const status = document.getElementById('modalReqStatus')?.value || 'pending';
  const notes = document.getElementById('modalReqNotes')?.value.trim() || '';

  if (typeof window.updateWithdrawalStatus === 'function') {
    window.updateWithdrawalStatus(id, status, notes)
      .then(() => {
        alert(`✅ Order #${id.substring(0, 8)} status saved as ${status.toUpperCase()}!`);
        closeRequestManageModal();
        renderRequestsTable();
      })
      .catch(err => alert('Error saving status: ' + err.message));
  } else {
    const db = window.getDb ? window.getDb() : null;
    if (!db) return;
    db.ref(`/reward_requests/${id}`).update({
      status: status,
      notes: notes,
      updatedAt: Date.now()
    }).then(() => {
      alert(`✅ Order #${id.substring(0, 8)} status saved!`);
      closeRequestManageModal();
      renderRequestsTable();
    }).catch(err => alert('Error: ' + err.message));
  }
}
window.saveRequestStatusToFirebase = saveRequestStatusToFirebase;

function escapeReqText(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

window.renderRequestsTable = renderRequestsTable;

