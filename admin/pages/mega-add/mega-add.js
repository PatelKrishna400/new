/* ==========================================================================
   PAGE: MEGA REWARDS & CUSTOM REQUESTS LOGIC (pages/mega-add/mega-add.js)
   ========================================================================== */

// 8 Standard Categories (Custom is a separate tab, NOT a standard category)
const MEGA_CATEGORIES = [
  { id: 'gift-card', name: 'Gift Card', icon: '🎁', tag: 'VOUCHER' },
  { id: 'gadgets', name: 'Gadgets', icon: '📱', tag: 'SMART TECH' },
  { id: 'accessories', name: 'Accessories', icon: '🎒', tag: 'EDC GEAR' },
  { id: 'gaming-tool', name: 'Gaming Tool', icon: '🎮', tag: 'PRO GAMING' },
  { id: 'kitchen', name: 'Kitchen', icon: '☕', tag: 'GOURMET' },
  { id: 'stationery', name: 'Stationery', icon: '✒️', tag: 'STUDIO' },
  { id: 'fitness', name: 'Fitness', icon: '🏋️', tag: 'ATHLETICS' },
  { id: 'home-decorate', name: 'Home Decorate', icon: '🏠', tag: 'INTERIOR' }
];

let selectedCategory = 'gift-card';
let editingRewardId = null;
let activeMegaTab = 'standard';
let customRequestsFilter = 'all';

// Real-time Event Listeners
window.addEventListener('rewardsUpdated', () => {
  renderRewardsCatalog();
});

window.addEventListener('customRequestsUpdated', () => {
  updateCustomReqBadge();
  if (activeMegaTab === 'custom') {
    renderCustomRequestsTable();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  initCategoryDropdown();
  renderRewardsCatalog();
  renderCustomRequestsTable();
  // Attach live input listeners to clear error styling on compulsory fields
  ['inpRewardTitle', 'inpRewardBuyerStar', 'inpRewardDiamonds', 'inpRewardRealVal', 'inpRewardOfferVal', 'inpRewardLink', 'inpRewardImage'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        el.style.borderColor = '';
        el.style.boxShadow = '';
      });
    }
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    const wrap = document.getElementById('categoryDropdownWrap');
    if (wrap && !wrap.contains(e.target)) {
      const menu = document.getElementById('categoryDropdownMenu');
      const arrow = document.getElementById('catSelectArrow');
      if (menu) menu.classList.remove('show');
      if (arrow) arrow.classList.remove('open');
    }
  });
});

/* ==========================================================================
   CATEGORY DROPDOWN LOGIC
   ========================================================================== */

function initCategoryDropdown() {
  const menu = document.getElementById('categoryDropdownMenu');
  if (!menu) return;

  menu.innerHTML = MEGA_CATEGORIES.map(cat => `
    <div class="category-dropdown-item ${cat.id === selectedCategory ? 'active' : ''}" onclick="selectCategory('${cat.id}')">
      <div class="cat-item-left">
        <span class="cat-item-icon">${cat.icon}</span>
        <span class="cat-item-name">${cat.name}</span>
      </div>
      <span class="cat-item-tag">${cat.tag}</span>
    </div>
  `).join('');

  updateCategoryDropdownButton();
}

function toggleCategoryDropdown() {
  const menu = document.getElementById('categoryDropdownMenu');
  const arrow = document.getElementById('catSelectArrow');
  if (!menu) return;

  const isOpen = menu.classList.toggle('show');
  if (arrow) arrow.classList.toggle('open', isOpen);
}

function selectCategory(catId) {
  selectedCategory = catId;
  const menu = document.getElementById('categoryDropdownMenu');
  const arrow = document.getElementById('catSelectArrow');
  if (menu) menu.classList.remove('show');
  if (arrow) arrow.classList.remove('open');

  updateCategoryDropdownButton();
  initCategoryDropdown();

  // If user is on custom tab, switch to standard edit form
  if (activeMegaTab !== 'standard') {
    switchMegaAddTab('standard');
  }

  const catObj = MEGA_CATEGORIES.find(c => c.id === catId);
  const tagInp = document.getElementById('inpRewardTag');
  if (tagInp && !tagInp.value) {
    tagInp.value = catObj ? catObj.tag : 'SPECIAL';
  }
}

function updateCategoryDropdownButton() {
  const catObj = MEGA_CATEGORIES.find(c => c.id === selectedCategory) || MEGA_CATEGORIES[0];
  const iconEl = document.getElementById('selectedCatIcon');
  const nameEl = document.getElementById('selectedCatName');
  if (iconEl) iconEl.textContent = catObj.icon;
  if (nameEl) nameEl.textContent = catObj.name;
}

/* ==========================================================================
   TAB SWITCHER: STANDARD VS CUSTOM REQUESTS
   ========================================================================== */

function switchMegaAddTab(tab) {
  activeMegaTab = tab;
  const btnStandard = document.getElementById('tabBtnMegaStandard');
  const btnCustom = document.getElementById('tabBtnMegaCustom');
  const secStandard = document.getElementById('megaStandardSection');
  const secCustom = document.getElementById('megaCustomSection');

  if (tab === 'standard') {
    if (btnStandard) btnStandard.classList.add('active');
    if (btnCustom) btnCustom.classList.remove('active');
    if (secStandard) secStandard.style.display = 'block';
    if (secCustom) secCustom.style.display = 'none';
  } else {
    if (btnStandard) btnStandard.classList.remove('active');
    if (btnCustom) btnCustom.classList.add('active');
    if (secStandard) secStandard.style.display = 'none';
    if (secCustom) secCustom.style.display = 'block';
    renderCustomRequestsTable();
  }
}

function updateCustomReqBadge() {
  const badge = document.getElementById('customReqBadge');
  const requests = window.adminState.customRequests || [];
  const pending = requests.filter(r => (r.status || 'pending').toLowerCase() === 'pending').length;
  if (badge) {
    badge.textContent = pending > 0 ? pending : requests.length;
  }
}

/* ==========================================================================
   STANDARD REWARD FORM: SAVE WITH 7 COMPULSORY FIELDS
   1. Product Name
   2. Buyer Star
   3. Diamond Cost
   4. Real Value
   5. Offer Value
   6. Product Link
   7. Image URL
   ========================================================================== */

function saveRewardToFirebase() {
  const executeSave = () => {
    const db = window.getDb ? window.getDb() : null;
    if (!db) {
      alert('Firebase is not connected!');
      return;
    }

    const elTitle = document.getElementById('inpRewardTitle');
    const elBuyerStar = document.getElementById('inpRewardBuyerStar');
    const elDiamonds = document.getElementById('inpRewardDiamonds');
    const elRealVal = document.getElementById('inpRewardRealVal');
    const elOfferVal = document.getElementById('inpRewardOfferVal');
    const elLink = document.getElementById('inpRewardLink');
    const elImg = document.getElementById('inpRewardImage');

    const title = (elTitle?.value || '').trim();
    const buyerStar = Number(elBuyerStar?.value) || 0;
    const diamonds = Number(elDiamonds?.value) || 0;
    const realVal = (elRealVal?.value || '').trim();
    const offerVal = (elOfferVal?.value || '').trim();
    const link = (elLink?.value || '').trim();
    const img = (elImg?.value || '').trim();

    const stock = Number(document.getElementById('inpRewardStock')?.value) || 15;
    const tag = (document.getElementById('inpRewardTag')?.value || '').trim();
    const desc = (document.getElementById('inpRewardDesc')?.value || '').trim();

    // Reset validation error styles
    [elTitle, elBuyerStar, elDiamonds, elRealVal, elOfferVal, elLink, elImg].forEach(el => {
      if (el) {
        el.style.borderColor = '';
        el.style.boxShadow = '';
      }
    });

    // STRICT COMPULSORY VALIDATION (All 7 Fields Required)
    const missing = [];
    let firstInvalidEl = null;

    if (!title) {
      missing.push('Product Name');
      if (elTitle) { elTitle.style.borderColor = '#ef4444'; elTitle.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.15)'; }
      if (!firstInvalidEl) firstInvalidEl = elTitle;
    }
    if (!buyerStar || buyerStar < 1 || buyerStar > 5) {
      missing.push('Buyer Star (1.0 to 5.0 ⭐)');
      if (elBuyerStar) { elBuyerStar.style.borderColor = '#ef4444'; elBuyerStar.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.15)'; }
      if (!firstInvalidEl) firstInvalidEl = elBuyerStar;
    }
    if (!diamonds || diamonds <= 0) {
      missing.push('Diamond Cost (💎)');
      if (elDiamonds) { elDiamonds.style.borderColor = '#ef4444'; elDiamonds.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.15)'; }
      if (!firstInvalidEl) firstInvalidEl = elDiamonds;
    }
    if (!realVal) {
      missing.push('Real Value (e.g. $249)');
      if (elRealVal) { elRealVal.style.borderColor = '#ef4444'; elRealVal.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.15)'; }
      if (!firstInvalidEl) firstInvalidEl = elRealVal;
    }
    if (!offerVal) {
      missing.push('Offer Value (e.g. $199)');
      if (elOfferVal) { elOfferVal.style.borderColor = '#ef4444'; elOfferVal.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.15)'; }
      if (!firstInvalidEl) firstInvalidEl = elOfferVal;
    }
    if (!link) {
      missing.push('Product Link (🔗 URL)');
      if (elLink) { elLink.style.borderColor = '#ef4444'; elLink.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.15)'; }
      if (!firstInvalidEl) firstInvalidEl = elLink;
    }
    if (!img) {
      missing.push('Image URL (🖼️)');
      if (elImg) { elImg.style.borderColor = '#ef4444'; elImg.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.15)'; }
      if (!firstInvalidEl) firstInvalidEl = elImg;
    }

    if (missing.length > 0) {
      if (firstInvalidEl) {
        firstInvalidEl.focus();
        firstInvalidEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      alert(`⚠️ All 7 Compulsory Fields Required to Save Reward:\n\n` + missing.map(m => `• ${m}`).join('\n') + `\n\nPlease fill in every required field before submitting to Firebase.`);
      return;
    }

    const catObj = MEGA_CATEGORIES.find(c => c.id === selectedCategory) || MEGA_CATEGORIES[0];
    let rewards = [...(window.adminState.rewards || [])];

    const rewardPayload = {
      title,
      name: title,
      productName: title,
      buyerStar: Number(buyerStar),
      stars: Number(buyerStar),
      rating: Number(buyerStar),
      category: selectedCategory,
      categoryName: catObj.name,
      categoryIcon: catObj.icon,
      diamonds: Number(diamonds),
      diamondCost: Number(diamonds),
      realValue: realVal,
      originalPrice: realVal,
      mrp: realVal,
      offerValue: offerVal,
      cashValue: offerVal,
      discountPrice: offerVal,
      link: link,
      productLink: link,
      url: link,
      imageUrl: img,
      image: img,
      img: img,
      stock: stock >= 0 ? stock : 15,
      description: desc || `${title} - rated ${buyerStar} stars by verified buyers.`,
      tag: tag || catObj.tag,
      active: true,
      updatedAt: new Date().toISOString()
    };

    if (editingRewardId) {
      const idx = rewards.findIndex(r => r.id === editingRewardId);
      if (idx !== -1) {
        rewards[idx] = {
          ...rewards[idx],
          ...rewardPayload
        };
      }
      editingRewardId = null;
      document.getElementById('rewardFormTitle').textContent = 'Add New Mega Reward';
      document.getElementById('btnSaveReward').textContent = 'Save Reward to Firebase';
    } else {
      const newReward = {
        id: 'reward_' + Date.now(),
        ...rewardPayload,
        createdAt: new Date().toISOString()
      };
      rewards.unshift(newReward);
    }

    db.ref('/mega_rewards').set(rewards)
      .then(() => {
        window.adminState.rewards = rewards;
        clearRewardForm();
        renderRewardsCatalog();
        alert('✅ Reward successfully saved to Firebase (/mega_rewards) with all 7 compulsory fields!');
      })
      .catch(err => alert('Firebase error: ' + err.message));
  };

  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(executeSave);
  } else {
    executeSave();
  }
}

function clearRewardForm() {
  editingRewardId = null;
  ['inpRewardTitle', 'inpRewardBuyerStar', 'inpRewardDiamonds', 'inpRewardRealVal', 'inpRewardOfferVal', 'inpRewardLink', 'inpRewardImage'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.borderColor = '';
      el.style.boxShadow = '';
    }
  });

  if (document.getElementById('inpRewardTitle')) document.getElementById('inpRewardTitle').value = '';
  if (document.getElementById('inpRewardBuyerStar')) document.getElementById('inpRewardBuyerStar').value = '';
  if (document.getElementById('inpRewardDiamonds')) document.getElementById('inpRewardDiamonds').value = '';
  if (document.getElementById('inpRewardRealVal')) document.getElementById('inpRewardRealVal').value = '';
  if (document.getElementById('inpRewardOfferVal')) document.getElementById('inpRewardOfferVal').value = '';
  if (document.getElementById('inpRewardStock')) document.getElementById('inpRewardStock').value = '15';
  if (document.getElementById('inpRewardDesc')) document.getElementById('inpRewardDesc').value = '';
  if (document.getElementById('inpRewardTag')) document.getElementById('inpRewardTag').value = '';
  if (document.getElementById('inpRewardLink')) document.getElementById('inpRewardLink').value = '';
  if (document.getElementById('inpRewardImage')) document.getElementById('inpRewardImage').value = '';

  const titleEl = document.getElementById('rewardFormTitle');
  const btnEl = document.getElementById('btnSaveReward');
  if (titleEl) titleEl.textContent = 'Add New Mega Reward';
  if (btnEl) btnEl.textContent = 'Save Reward to Firebase';
}

function editRewardItem(id) {
  const rewards = window.adminState.rewards || [];
  const item = rewards.find(r => r.id === id);
  if (!item) return;

  editingRewardId = id;
  selectCategory(item.category || 'gift-card');

  ['inpRewardTitle', 'inpRewardBuyerStar', 'inpRewardDiamonds', 'inpRewardRealVal', 'inpRewardOfferVal', 'inpRewardLink', 'inpRewardImage'].forEach(fid => {
    const el = document.getElementById(fid);
    if (el) {
      el.style.borderColor = '';
      el.style.boxShadow = '';
    }
  });

  if (document.getElementById('inpRewardTitle')) document.getElementById('inpRewardTitle').value = item.title || item.productName || item.name || '';
  if (document.getElementById('inpRewardBuyerStar')) document.getElementById('inpRewardBuyerStar').value = item.buyerStar || item.stars || item.rating || 4.8;
  if (document.getElementById('inpRewardDiamonds')) document.getElementById('inpRewardDiamonds').value = item.diamonds || item.diamondCost || '';
  if (document.getElementById('inpRewardRealVal')) document.getElementById('inpRewardRealVal').value = item.realValue || item.originalPrice || item.mrp || '';
  if (document.getElementById('inpRewardOfferVal')) document.getElementById('inpRewardOfferVal').value = item.offerValue || item.cashValue || item.discountPrice || '';
  if (document.getElementById('inpRewardStock')) document.getElementById('inpRewardStock').value = item.stock !== undefined ? item.stock : 10;
  if (document.getElementById('inpRewardDesc')) document.getElementById('inpRewardDesc').value = item.description || '';
  if (document.getElementById('inpRewardTag')) document.getElementById('inpRewardTag').value = item.tag || '';
  if (document.getElementById('inpRewardLink')) document.getElementById('inpRewardLink').value = item.link || item.productLink || item.url || '';
  if (document.getElementById('inpRewardImage')) document.getElementById('inpRewardImage').value = item.imageUrl || item.image || item.img || '';

  const titleEl = document.getElementById('rewardFormTitle');
  const btnEl = document.getElementById('btnSaveReward');
  const displayTitle = item.title || item.productName || item.name || 'Reward';
  if (titleEl) titleEl.textContent = `Editing: ${displayTitle}`;
  if (btnEl) btnEl.textContent = 'Update Reward in Firebase';

  switchMegaAddTab('standard');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteRewardItem(id) {
  const executeDelete = () => {
    const db = window.getDb ? window.getDb() : null;
    if (!db) return;
    if (!confirm('Are you sure you want to delete this reward from Firebase?')) return;
    const rewards = (window.adminState.rewards || []).filter(r => r.id !== id);
    db.ref('/mega_rewards').set(rewards)
      .then(() => {
        window.adminState.rewards = rewards;
        renderRewardsCatalog();
        alert('Item deleted from Firebase!');
      })
      .catch(err => alert('Error: ' + err.message));
  };

  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(executeDelete);
  } else {
    executeDelete();
  }
}

/* ==========================================================================
   RENDER STANDARD REWARDS INVENTORY CATALOG
   ========================================================================== */

function renderRewardsCatalog() {
  const grid = document.getElementById('rewardsCatalogGrid');
  const meta = document.getElementById('rewardsInventoryMeta');
  if (!grid) return;

  const rewards = window.adminState.rewards || [];
  if (meta) meta.textContent = `${rewards.length} items registered`;

  if (rewards.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 36px; text-align: center; color: #64748b;">
        No reward items found in Firebase (/mega_rewards). Add a new mega reward above to publish it for all players.
      </div>
    `;
    return;
  }

  let html = '';
  rewards.forEach(r => {
    const cat = MEGA_CATEGORIES.find(c => c.id === r.category) || MEGA_CATEGORIES[0];
    const buyerStar = Number(r.buyerStar || 4.8).toFixed(1);
    const diamonds = Number(r.diamondCost || r.diamonds || 0).toLocaleString();
    const realVal = r.realValue || '';
    const offerVal = r.offerValue || r.cashValue || '';
    const link = r.link || r.productLink || '';
    const imgUrl = r.imageUrl || r.image || '';

    html += `
      <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 14px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 1px 4px rgba(15, 23, 42, 0.03); transition: all 0.2s ease;">
        <div style="height: 140px; background: #f8fafc; border-bottom: 1.5px solid #f1f5f9; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden;">
          ${imgUrl ? `<img src="${imgUrl}" alt="${r.title}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null;this.parentElement.innerHTML='<span style=\\'font-size:42px;\\'>${cat.icon}</span>';">` : `<span style="font-size: 42px;">${cat.icon}</span>`}
          <span style="position: absolute; top: 8px; left: 8px; background: #ffffff; color: #0284c7; border: 1px solid rgba(2, 132, 199, 0.25); font-size: 9.5px; font-weight: 800; padding: 3px 8px; border-radius: 99px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">${r.tag || cat.tag}</span>
          <span style="position: absolute; top: 8px; right: 8px; background: rgba(15, 23, 42, 0.85); color: #facc15; font-size: 10px; font-weight: 800; padding: 3px 7px; border-radius: 99px; display: inline-flex; align-items: center; gap: 3px;">
            ⭐ ${buyerStar}
          </span>
          <span style="position: absolute; bottom: 8px; right: 8px; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; font-size: 11px; font-weight: 800; padding: 3px 9px; border-radius: 99px; box-shadow: 0 2px 6px rgba(2, 132, 199, 0.25);">${diamonds} 💎</span>
        </div>
        <div style="padding: 14px; display: flex; flex-direction: column; gap: 6px; flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 10.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px;">${cat.name}</span>
            <span style="font-size: 11px; color: #64748b;">Stock: <strong style="color: #0f172a;">${r.stock || 10}</strong></span>
          </div>
          <h4 style="font-size: 14px; font-weight: 800; color: #0f172a; line-height: 1.3;">${r.title || r.productName}</h4>
          
          <div style="display: flex; align-items: baseline; gap: 8px; margin-top: 4px;">
            ${realVal ? `<span style="font-size: 12px; color: #94a3b8; text-decoration: line-through; font-weight: 700;">${realVal}</span>` : ''}
            ${offerVal ? `<span style="font-size: 13.5px; color: #059669; font-weight: 800;">${offerVal}</span>` : ''}
          </div>

          ${link ? `
            <a href="${link}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: #0284c7; font-weight: 700; text-decoration: none; margin-top: 2px;">
              🔗 Product Store Page ↗
            </a>
          ` : ''}

          <div style="display: flex; gap: 8px; margin-top: auto; padding-top: 10px;">
            <button onclick="editRewardItem('${r.id}')" class="btn-secondary" style="flex: 1; padding: 6px; font-size: 11.5px; text-align: center; justify-content: center;">Edit</button>
            <button onclick="deleteRewardItem('${r.id}')" class="btn-secondary" style="padding: 6px 10px; font-size: 11.5px; color: #ef4444;" title="Delete Reward">🗑️</button>
          </div>
        </div>
      </div>
    `;
  });
  grid.innerHTML = html;
}

/* ==========================================================================
   USER CUSTOM REQUESTS LIST
   Shows 5 required data points:
   1. User Name
   2. Required (Item)
   3. Link
   4. Image
   5. Why Requires
   ========================================================================== */

function filterCustomRequests(status) {
  customRequestsFilter = status;
  document.querySelectorAll('.btn-custom-filter').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-custfilter') === status);
  });
  renderCustomRequestsTable();
}

function renderCustomRequestsTable() {
  const tbody = document.getElementById('customRequestsTableBody');
  if (!tbody) return;

  const requests = window.adminState.customRequests || [];
  const filtered = requests.filter(r => {
    if (customRequestsFilter === 'all') return true;
    return (r.status || 'pending').toLowerCase() === customRequestsFilter;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 36px; color: #64748b;">
          ${requests.length === 0 ? 'No custom reward requests found in Firebase (/custom_reward_requests).' : 'No custom requests match this filter.'}
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(r => {
    const userName = r.userName || r.username || r.playerName || 'Player';
    const requiredItem = r.itemName || r.required || r.title || 'Exclusive Custom Item';
    const link = r.link || r.productLink || r.url || '#';
    const imgUrl = r.imageUrl || r.image || '';
    const whyRequires = r.whyRequires || r.reason || r.description || 'Player reached milestone tier and requested this custom reward.';
    const status = (r.status || 'pending').toLowerCase();
    const reqId = r.id;

    let statusBadge = `<span class="req-status-pill status-pending">Pending</span>`;
    if (status === 'approved') {
      statusBadge = `<span class="req-status-pill status-approved">Approved</span>`;
    } else if (status === 'rejected') {
      statusBadge = `<span class="req-status-pill status-rejected">Rejected</span>`;
    }

    return `
      <tr>
        <td>
          <div style="width: 48px; height: 48px; border-radius: 8px; overflow: hidden; background: #f1f5f9; display: flex; align-items: center; justify-content: center; border: 1.5px solid #e2e8f0;">
            ${imgUrl ? `<img src="${imgUrl}" alt="${requiredItem}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null;this.parentElement.innerHTML='⭐';">` : '<span style="font-size: 20px;">⭐</span>'}
          </div>
        </td>
        <td>
          <div style="font-weight: 800; color: #0f172a; font-size: 13.5px;">${userName}</div>
          <span style="font-size: 10.5px; color: #64748b; font-family: 'JetBrains Mono', monospace;">${r.userId || r.profileCode || 'ID: ' + reqId.substring(0, 8)}</span>
        </td>
        <td>
          <div style="font-weight: 800; color: #0284c7; font-size: 13px;">${requiredItem}</div>
          ${r.estimatedPrice ? `<span style="font-size: 11px; color: #059669; font-weight: 700;">Est: ${r.estimatedPrice}</span>` : ''}
        </td>
        <td>
          ${link && link !== '#' ? `
            <a href="${link}" target="_blank" rel="noopener noreferrer" class="link-pill-btn">
              🔗 View Link
            </a>
          ` : '<span style="color: #94a3b8; font-size: 11px;">No link</span>'}
        </td>
        <td>
          <div class="why-requires-text" title="${whyRequires.replace(/"/g, '&quot;')}">
            "${whyRequires}"
          </div>
        </td>
        <td>${statusBadge}</td>
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 6px;">
            ${status !== 'approved' ? `
              <button onclick="approveAndPrefillCustomRequest('${reqId}')" class="btn-primary" style="padding: 5px 10px; font-size: 11px; background: #059669;" title="Approve & Pre-fill into Standard Mega Reward form">
                ✓ Pre-fill
              </button>
            ` : ''}
            ${status !== 'rejected' ? `
              <button onclick="rejectCustomRequest('${reqId}')" class="btn-secondary" style="padding: 5px 8px; font-size: 11px; color: #ef4444;" title="Reject request">
                ✕ Reject
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function approveAndPrefillCustomRequest(reqId) {
  const requests = window.adminState.customRequests || [];
  const req = requests.find(r => r.id === reqId);
  if (!req) return;

  // Pre-fill standard form
  if (document.getElementById('inpRewardTitle')) {
    document.getElementById('inpRewardTitle').value = req.itemName || req.required || '';
  }
  if (document.getElementById('inpRewardBuyerStar')) {
    document.getElementById('inpRewardBuyerStar').value = '5.0';
  }
  if (document.getElementById('inpRewardDiamonds')) {
    document.getElementById('inpRewardDiamonds').value = req.diamondCost || 5000;
  }
  if (document.getElementById('inpRewardRealVal')) {
    document.getElementById('inpRewardRealVal').value = req.estimatedPrice || '$150';
  }
  if (document.getElementById('inpRewardOfferVal')) {
    document.getElementById('inpRewardOfferVal').value = req.estimatedPrice || '$150';
  }
  if (document.getElementById('inpRewardLink')) {
    document.getElementById('inpRewardLink').value = req.link || req.productLink || '';
  }
  if (document.getElementById('inpRewardImage')) {
    document.getElementById('inpRewardImage').value = req.imageUrl || req.image || '';
  }
  if (document.getElementById('inpRewardDesc')) {
    document.getElementById('inpRewardDesc').value = req.whyRequires ? `Custom reward requested by ${req.userName}: ${req.whyRequires}` : '';
  }

  // Update request status in Firebase to approved
  const db = window.getDb ? window.getDb() : null;
  if (db) {
    db.ref(`/custom_reward_requests/${reqId}/status`).set('approved');
    req.status = 'approved';
    updateCustomReqBadge();
  }

  // Switch to standard tab and scroll to form
  switchMegaAddTab('standard');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  alert(`✅ Custom request from ${req.userName} has been pre-filled into the Mega Reward form!\nReview the 7 compulsory fields and click "Save Reward to Firebase".`);
}

function rejectCustomRequest(reqId) {
  const executeReject = () => {
    const db = window.getDb ? window.getDb() : null;
    if (!db) return;
    db.ref(`/custom_reward_requests/${reqId}/status`).set('rejected')
      .then(() => {
        const requests = window.adminState.customRequests || [];
        const req = requests.find(r => r.id === reqId);
        if (req) req.status = 'rejected';
        renderCustomRequestsTable();
        updateCustomReqBadge();
        alert('Custom request marked as rejected.');
      })
      .catch(err => alert('Firebase error: ' + err.message));
  };

  if (typeof window.requireAdminPassword === 'function') {
    window.requireAdminPassword(executeReject);
  } else {
    executeReject();
  }
}

/* ==========================================================================
   DEPRECATED SAMPLE DATA SEEDERS (REMOVED)
   ========================================================================== */

function seedSampleRewardsToFirebase() {
  // Deprecated: Sample data seeding removed. Rewards are purely managed from Firebase.
}

function seedSampleCustomRequestsToFirebase() {
  // Deprecated: Sample data seeding removed. Custom requests are purely received from players in Firebase.
}

// Global window exports
window.initCategoryDropdown = initCategoryDropdown;
window.toggleCategoryDropdown = toggleCategoryDropdown;
window.selectCategory = selectCategory;
window.switchMegaAddTab = switchMegaAddTab;
window.filterCustomRequests = filterCustomRequests;
window.renderCustomRequestsTable = renderCustomRequestsTable;
window.approveAndPrefillCustomRequest = approveAndPrefillCustomRequest;
window.rejectCustomRequest = rejectCustomRequest;
window.saveRewardToFirebase = saveRewardToFirebase;
window.clearRewardForm = clearRewardForm;
window.editRewardItem = editRewardItem;
window.deleteRewardItem = deleteRewardItem;
window.seedSampleRewardsToFirebase = seedSampleRewardsToFirebase;
window.seedSampleCustomRequestsToFirebase = seedSampleCustomRequestsToFirebase;
window.renderRewardsCatalog = renderRewardsCatalog;
window.updateCustomReqBadge = updateCustomReqBadge;
