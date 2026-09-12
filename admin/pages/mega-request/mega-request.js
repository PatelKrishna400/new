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
    const userDisplay = r.username || r.userName || 'Anonymous';
    const tgDisplay = r.telegramHandle || r.userTgHandle || r.telegramId || 'N/A';
    const itemDisplay = r.rewardTitle || r.itemTitle || 'Reward';
    const diamondCost = Number(r.diamondCost || r.diamondsCost || 0);
    const shipDisplay = r.shippingDetails || r.deliveryInfo || r.deliveryAddress || 'In-App Direct';
    const dateDisplay = r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recent';

    html += `
      <tr>
        <td style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #38bdf8;">#${(r.id || 'REQ').substring(0, 8)}</td>
        <td>
          <div style="font-weight: 800; color: #fff;">${userDisplay}</div>
          <div style="font-size: 11px; color: #64748b;">${tgDisplay}</div>
        </td>
        <td>
          <div style="font-weight: 800; color: #22d3ee;">${itemDisplay}</div>
        </td>
        <td style="font-weight: 800; color: #fbbf24;">${diamondCost.toLocaleString()} 💎</td>
        <td style="font-size: 11px; color: #94a3b8;">${shipDisplay}</td>
        <td style="font-size: 11px; color: #64748b;">${dateDisplay}</td>
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

  document.getElementById('modalReqUser').textContent = req.username || req.userName || 'User';
  document.getElementById('modalReqItem').textContent = req.rewardTitle || req.itemTitle || 'Reward';
  document.getElementById('modalReqDiamonds').textContent = `${Number(req.diamondCost || req.diamondsCost || 0).toLocaleString()} Diamonds 💎`;
  document.getElementById('modalReqShipping').textContent = req.shippingDetails || req.deliveryInfo || req.deliveryAddress || 'No address';
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
