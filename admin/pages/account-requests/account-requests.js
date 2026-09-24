/* ==========================================================================
   PAGE: ACCOUNT CREATION REQUESTS (pages/account-requests/account-requests.js)
   - Real-time Account Request Management connected to Firebase RTDB
   - Allows admin to review requests from users whose accounts were deleted
   - 1-click review & user creation into Firebase /players
   ========================================================================== */

let accountRequestsFilter = 'all';

function filterAccountRequests(status) {
  accountRequestsFilter = status;
  const buttons = document.querySelectorAll('.acc-req-filter-btn');
  buttons.forEach(btn => {
    btn.classList.remove('active');
  });

  const activeBtnMap = {
    all: document.getElementById('btnAccReqAll'),
    pending: document.getElementById('btnAccReqPending'),
    approved: document.getElementById('btnAccReqApproved'),
    rejected: document.getElementById('btnAccReqRejected')
  };
  if (activeBtnMap[status]) activeBtnMap[status].classList.add('active');

  renderAccountRequestsTable();
}
window.filterAccountRequests = filterAccountRequests;

window.addEventListener('accountRequestsUpdated', () => {
  renderAccountRequestsTable();
});

document.addEventListener('DOMContentLoaded', () => {
  renderAccountRequestsTable();
});

function renderAccountRequestsTable() {
  const tbody = document.getElementById('accountRequestsTableBody');
  if (!tbody) return;

  const requests = (window.adminState && window.adminState.accountRequests)
    ? window.adminState.accountRequests
    : [];

  const countPill = document.getElementById('accountRequestsCountPill');
  if (countPill) countPill.textContent = `${requests.length} Requests`;

  const pendingCount = requests.filter(r => (r.status || 'pending').toLowerCase() === 'pending').length;
  const subPendingBadge = document.getElementById('subBadgeReqPending');
  if (subPendingBadge) {
    subPendingBadge.textContent = pendingCount;
    subPendingBadge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
  }

  const filtered = requests.filter(r => {
    const s = (r.status || 'pending').toLowerCase();
    if (accountRequestsFilter === 'all') return true;
    return s === accountRequestsFilter.toLowerCase();
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; color: #64748b; padding: 36px;">
          No account creation requests found in "${accountRequestsFilter}" status.
        </td>
      </tr>
    `;
    return;
  }

  let html = '';
  filtered.forEach(r => {
    const status = (r.status || 'pending').toLowerCase();
    let statusPill = `<span class="badge-amber" style="padding: 2px 8px; border-radius: 99px; font-size: 11px;">⏳ Pending</span>`;

    if (status === 'approved') {
      statusPill = `<span style="background: rgba(16, 185, 129, 0.15); color: #059669; border: 1px solid rgba(16, 185, 129, 0.3); padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 700;">✅ Approved</span>`;
    } else if (status === 'rejected') {
      statusPill = `<span style="background: rgba(239, 68, 68, 0.15); color: #dc2626; border: 1px solid rgba(239, 68, 68, 0.3); padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 700;">❌ Rejected</span>`;
    }

    const dateStr = r.dateStr || (r.requestedAt ? new Date(r.requestedAt).toLocaleString() : 'Recent');
    const oldUid = r.oldUserId || '-';
    const reasonText = r.reason || 'Requested account creation';

    html += `
      <tr>
        <!-- Req ID -->
        <td>
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 11.5px; color: #0284c7; font-weight: 700;">
            #${escapeReqHtml((r.id || 'REQ').substring(0, 10))}
          </div>
        </td>

        <!-- Date -->
        <td>
          <span style="font-size: 11.5px; color: #64748b;">${escapeReqHtml(dateStr)}</span>
        </td>

        <!-- Player Name -->
        <td>
          <strong style="font-size: 13px; color: #0f172a;">${escapeReqHtml(r.name || 'Player')}</strong>
        </td>

        <!-- Telegram / Contact -->
        <td>
          <code style="font-size: 11.5px; color: #0284c7; background: rgba(2, 132, 199, 0.08); padding: 1px 6px; border-radius: 4px;">
            ${escapeReqHtml(r.telegram || r.username || '-')}
          </code>
          ${r.phone ? `<div style="font-size: 10.5px; color: #64748b; margin-top: 2px;">📞 ${escapeReqHtml(r.phone)}</div>` : ''}
        </td>

        <!-- Old UID -->
        <td>
          <code style="font-size: 10px; color: #64748b; background: #f1f5f9; padding: 1px 4px; border-radius: 3px;" title="${oldUid}">
            ${escapeReqHtml(oldUid.length > 12 ? oldUid.slice(0, 10) + '...' : oldUid)}
          </code>
        </td>

        <!-- Reason -->
        <td>
          <div style="font-size: 11.5px; color: #334155; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeReqHtml(reasonText)}">
            ${escapeReqHtml(reasonText)}
          </div>
        </td>

        <!-- Status -->
        <td>
          ${statusPill}
        </td>

        <!-- Actions -->
        <td style="text-align: right;">
          <div style="display: flex; gap: 6px; justify-content: flex-end;">
            ${status === 'pending' ? `
              <button type="button" class="acc-req-action-btn acc-req-btn-approve" onclick="reviewAndCreateUserFromRequest('${r.id}')" title="Review details and create account directly in Firebase">
                <span>➕</span> <span>Create User</span>
              </button>
              <button type="button" class="acc-req-action-btn acc-req-btn-reject" onclick="rejectAccountRequest('${r.id}')" title="Reject request">
                <span>✕</span> <span>Reject</span>
              </button>
            ` : `
              <button type="button" class="acc-req-action-btn" style="background: #f1f5f9; color: #475569;" onclick="reviewAndCreateUserFromRequest('${r.id}')" title="View details">
                <span>👁️</span> <span>View / Re-add</span>
              </button>
            `}
            <button type="button" class="acc-req-action-btn acc-req-btn-delete" onclick="deleteAccountRequest('${r.id}')" title="Permanently delete request">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}
window.renderAccountRequestsTable = renderAccountRequestsTable;

function escapeReqHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function reviewAndCreateUserFromRequest(reqId) {
  const requests = (window.adminState && window.adminState.accountRequests) || [];
  const req = requests.find(r => r.id === reqId);
  if (!req) return;

  // Switch to users view and open prefilled Add User modal
  if (typeof switchAdminPage === 'function') {
    switchAdminPage('users', 'User Analytics & Players');
  }

  setTimeout(() => {
    if (typeof openAddPlayerModal === 'function') {
      openAddPlayerModal({
        name: req.name || '',
        username: req.username || req.name || '',
        telegram: req.telegram || '',
        requestId: req.id,
        oldUserId: req.oldUserId
      });
    }
  }, 150);
}
window.reviewAndCreateUserFromRequest = reviewAndCreateUserFromRequest;

function rejectAccountRequest(reqId) {
  if (!confirm(`Are you sure you want to REJECT account request #${reqId}?`)) return;

  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    alert('Firebase is not connected!');
    return;
  }

  db.ref(`account_requests/${reqId}`).update({
    status: 'rejected',
    rejectedAt: Date.now()
  }).then(() => {
    alert('Request marked as rejected.');
    renderAccountRequestsTable();
  }).catch(err => alert('Error: ' + err.message));
}
window.rejectAccountRequest = rejectAccountRequest;

function deleteAccountRequest(reqId) {
  if (!confirm(`Permanently remove account request #${reqId}?`)) return;

  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    alert('Firebase is not connected!');
    return;
  }

  db.ref(`account_requests/${reqId}`).remove().then(() => {
    renderAccountRequestsTable();
  }).catch(err => alert('Error: ' + err.message));
}
window.deleteAccountRequest = deleteAccountRequest;
