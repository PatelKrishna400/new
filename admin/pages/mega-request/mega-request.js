/* ==========================================================================
   PAGE: MEGA REQUEST LOGIC (pages/mega-request/mega-request.js)
   ========================================================================== */

let requestsFilter = 'all';
let managingRequestId = null;

window.addEventListener('requestsUpdated', () => {
  renderRequestsTable();
});

document.addEventListener('DOMContentLoaded', () => {
  renderRequestsTable();
});

function renderRequestsTable() {
  const tbody = document.getElementById('requestsTableBody');
  if (!tbody) return;

  const requests = window.adminState.requests || [];
  const filtered = requests.filter(r => {
    if (requestsFilter === 'all') return true;
    return (r.status || 'pending').toLowerCase() === requestsFilter.toLowerCase();
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #64748b; padding: 24px;">No requests in "${requestsFilter}" status.</td></tr>`;
    return;
  }

  let html = '';
  filtered.forEach(r => {
    const pillClass = (r.status === 'approved') ? 'pill-approved' : (r.status === 'delivered') ? 'pill-delivered' : (r.status === 'rejected') ? 'pill-rejected' : 'pill-pending';
    html += `
      <tr>
        <td style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #38bdf8;">#${(r.id || 'REQ').substring(0, 8)}</td>
        <td>
          <div style="font-weight: 800; color: #fff;">${r.username || 'Anonymous'}</div>
          <div style="font-size: 11px; color: #64748b;">${r.telegramHandle || r.telegramId || 'N/A'}</div>
        </td>
        <td>
          <div style="font-weight: 800; color: #22d3ee;">${r.rewardTitle || 'Reward'}</div>
        </td>
        <td style="font-weight: 800; color: #fbbf24;">${Number(r.diamondCost || 0).toLocaleString()} 💎</td>
        <td style="font-size: 11px; color: #94a3b8;">${r.shippingDetails || 'In-App Direct'}</td>
        <td style="font-size: 11px; color: #64748b;">${r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recent'}</td>
        <td><span class="status-pill ${pillClass}">${(r.status || 'pending').toUpperCase()}</span></td>
        <td>
          <button onclick="openRequestManageModal('${r.id}')" class="btn-primary" style="padding: 5px 12px; font-size: 11px;">Manage</button>
        </td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
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

  document.getElementById('modalReqUser').textContent = req.username || 'User';
  document.getElementById('modalReqItem').textContent = req.rewardTitle || 'Reward';
  document.getElementById('modalReqDiamonds').textContent = `${Number(req.diamondCost || 0).toLocaleString()} Diamonds 💎`;
  document.getElementById('modalReqShipping').textContent = req.shippingDetails || 'No address';
  document.getElementById('modalReqStatus').value = (req.status || 'pending').toLowerCase();
  document.getElementById('modalReqNotes').value = req.adminNotes || '';

  document.getElementById('requestManageModal').classList.add('open');
}

function closeRequestManageModal() {
  document.getElementById('requestManageModal').classList.remove('open');
  managingRequestId = null;
}

function saveRequestStatusToFirebase() {
  const db = window.getDb ? window.getDb() : null;
  if (!managingRequestId || !db) return;
  const id = managingRequestId;
  const status = document.getElementById('modalReqStatus').value;
  const notes = document.getElementById('modalReqNotes').value.trim();

  db.ref(`/reward_requests/${id}`).update({
    status,
    adminNotes: notes,
    updatedAt: new Date().toISOString()
  }).then(() => {
    closeRequestManageModal();
    alert(`Order status updated to ${status.toUpperCase()} in Firebase!`);
  }).catch(err => alert('Error: ' + err.message));
}

window.renderRequestsTable = renderRequestsTable;
window.filterRequestsTable = filterRequestsTable;
window.openRequestManageModal = openRequestManageModal;
window.closeRequestManageModal = closeRequestManageModal;
window.saveRequestStatusToFirebase = saveRequestStatusToFirebase;
