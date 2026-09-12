/* ==========================================================================
   PAGE: MEGA ADD LOGIC (pages/mega-add/mega-add.js)
   ========================================================================== */

const MEGA_CATEGORIES = [
  { id: 'gift-card', name: 'Gift Card', icon: '🎁', tag: 'VOUCHER' },
  { id: 'gadgets', name: 'Gadgets', icon: '📱', tag: 'SMART TECH' },
  { id: 'accessories', name: 'Accessories', icon: '🎒', tag: 'EDC GEAR' },
  { id: 'gaming-tool', name: 'Gaming Tool', icon: '🎮', tag: 'PRO GAMING' },
  { id: 'kitchen', name: 'Kitchen', icon: '☕', tag: 'GOURMET' },
  { id: 'stationery', name: 'Stationery', icon: '✒️', tag: 'STUDIO' },
  { id: 'fitness', name: 'Fitness', icon: '🏋️', tag: 'ATHLETICS' },
  { id: 'home-decorate', name: 'Home Decorate', icon: '🏠', tag: 'INTERIOR' },
  { id: 'custom', name: 'Custom', icon: '⭐', tag: 'VIP EXCLUSIVE' }
];

let selectedCategory = 'gift-card';
let editingRewardId = null;

window.addEventListener('rewardsUpdated', () => {
  renderRewardsCatalog();
});

document.addEventListener('DOMContentLoaded', () => {
  initCategoryChips();
  renderRewardsCatalog();
});

function initCategoryChips() {
  const container = document.getElementById('categoryChips');
  if (!container) return;
  let html = '';
  MEGA_CATEGORIES.forEach(c => {
    const isAct = c.id === selectedCategory;
    html += `
      <button type="button" class="cat-btn ${isAct ? 'active' : ''}" onclick="selectCategory('${c.id}')">
        <span>${c.icon}</span> <span>${c.name}</span>
      </button>
    `;
  });
  container.innerHTML = html;
}

function selectCategory(catId) {
  selectedCategory = catId;
  initCategoryChips();
  const catObj = MEGA_CATEGORIES.find(c => c.id === catId);
  const tagInp = document.getElementById('inpRewardTag');
  if (tagInp && !tagInp.value) {
    tagInp.value = catObj ? catObj.tag : 'SPECIAL';
  }
}

function saveRewardToFirebase() {
  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    alert('Firebase is not connected!');
    return;
  }
  const title = document.getElementById('inpRewardTitle').value.trim();
  const diamonds = Number(document.getElementById('inpRewardDiamonds').value);
  const stock = Number(document.getElementById('inpRewardStock').value);
  const cashValue = document.getElementById('inpRewardCashVal')?.value.trim() || `$${Math.round(diamonds / 20) || 50}`;
  const desc = document.getElementById('inpRewardDesc')?.value.trim() || 'Exclusive reward available for instant diamond redemption.';
  const tag = document.getElementById('inpRewardTag').value.trim();
  const img = document.getElementById('inpRewardImage').value.trim();

  if (!title || !diamonds) {
    alert('Please provide Title and Diamond cost!');
    return;
  }

  const catObj = MEGA_CATEGORIES.find(c => c.id === selectedCategory) || MEGA_CATEGORIES[0];
  let rewards = window.adminState.rewards || [];

  if (editingRewardId) {
    const idx = rewards.findIndex(r => r.id === editingRewardId);
    if (idx !== -1) {
      rewards[idx] = {
        ...rewards[idx],
        title,
        category: selectedCategory,
        diamonds: diamonds,
        diamondCost: diamonds,
        stock: stock >= 0 ? stock : 10,
        cashValue: cashValue,
        description: desc,
        tag: tag || catObj.tag,
        imageUrl: img
      };
    }
    editingRewardId = null;
    document.getElementById('rewardFormTitle').textContent = 'Add New Mega Reward';
    document.getElementById('btnSaveReward').textContent = 'Save Reward to Firebase';
  } else {
    const newReward = {
      id: 'reward_' + Date.now(),
      title,
      category: selectedCategory,
      diamonds: diamonds,
      diamondCost: diamonds,
      stock: stock >= 0 ? stock : 15,
      cashValue: cashValue,
      description: desc,
      tag: tag || catObj.tag,
      imageUrl: img,
      active: true,
      createdAt: new Date().toISOString()
    };
    rewards.unshift(newReward);
  }

  db.ref('/mega_rewards').set(rewards)
    .then(() => {
      clearRewardForm();
      alert('Reward saved to Firebase!');
    })
    .catch(err => alert('Firebase error: ' + err.message));
}

function clearRewardForm() {
  editingRewardId = null;
  document.getElementById('inpRewardTitle').value = '';
  document.getElementById('inpRewardDiamonds').value = '';
  document.getElementById('inpRewardStock').value = '';
  if (document.getElementById('inpRewardCashVal')) document.getElementById('inpRewardCashVal').value = '';
  if (document.getElementById('inpRewardDesc')) document.getElementById('inpRewardDesc').value = '';
  document.getElementById('inpRewardTag').value = '';
  document.getElementById('inpRewardImage').value = '';
  document.getElementById('rewardFormTitle').textContent = 'Add New Mega Reward';
  document.getElementById('btnSaveReward').textContent = 'Save Reward to Firebase';
}

function editRewardItem(id) {
  const rewards = window.adminState.rewards || [];
  const item = rewards.find(r => r.id === id);
  if (!item) return;
  editingRewardId = id;
  selectCategory(item.category || 'gift-card');

  document.getElementById('inpRewardTitle').value = item.title;
  document.getElementById('inpRewardDiamonds').value = item.diamonds || item.diamondCost || '';
  document.getElementById('inpRewardStock').value = item.stock !== undefined ? item.stock : 10;
  if (document.getElementById('inpRewardCashVal')) document.getElementById('inpRewardCashVal').value = item.cashValue || '';
  if (document.getElementById('inpRewardDesc')) document.getElementById('inpRewardDesc').value = item.description || '';
  document.getElementById('inpRewardTag').value = item.tag || '';
  document.getElementById('inpRewardImage').value = item.imageUrl || '';

  document.getElementById('rewardFormTitle').textContent = `Editing: ${item.title}`;
  document.getElementById('btnSaveReward').textContent = 'Update Reward in Firebase';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteRewardItem(id) {
  const db = window.getDb ? window.getDb() : null;
  if (!db) return;
  if (!confirm('Are you sure you want to delete this reward from Firebase?')) return;
  const rewards = (window.adminState.rewards || []).filter(r => r.id !== id);
  db.ref('/mega_rewards').set(rewards)
    .then(() => alert('Item deleted from Firebase!'))
    .catch(err => alert('Error: ' + err.message));
}

function seedSampleRewardsToFirebase() {
  const db = window.getDb ? window.getDb() : null;
  if (!db) {
    alert('Firebase is not connected!');
    return;
  }
  const sample = [
    { id: 'seed_1', title: '$100 Amazon Gift Card', category: 'gift-card', diamonds: 1500, diamondCost: 1500, stock: 20, cashValue: '$100', description: 'Digital Amazon e-voucher delivered directly to your Telegram.', tag: 'VOUCHER', active: true, imageUrl: '' },
    { id: 'seed_2', title: 'Apple AirPods Pro 2', category: 'gadgets', diamonds: 3500, diamondCost: 3500, stock: 12, cashValue: '$249', description: 'Active Noise Cancelling wireless earbuds with MagSafe case.', tag: 'SMART TECH', active: true, imageUrl: '' },
    { id: 'seed_3', title: 'Nomad Titanium Band', category: 'accessories', diamonds: 1800, diamondCost: 1800, stock: 15, cashValue: '$120', description: 'Grade 2 Titanium link strap designed for Apple Watch Ultra.', tag: 'EDC GEAR', active: true, imageUrl: '' },
    { id: 'seed_4', title: 'Razer DeathAdder V3 Pro', category: 'gaming-tool', diamonds: 2200, diamondCost: 2200, stock: 10, cashValue: '$150', description: 'Ultra-lightweight wireless esports gaming mouse.', tag: 'PRO GAMING', active: true, imageUrl: '' },
    { id: 'seed_5', title: 'Ember Temperature Mug', category: 'kitchen', diamonds: 1950, diamondCost: 1950, stock: 18, cashValue: '$130', description: 'Precision heated coffee mug with 1.5 hour battery life.', tag: 'GOURMET', active: true, imageUrl: '' },
    { id: 'seed_6', title: 'Lamy 2000 Bauhaus Pen', category: 'stationery', diamonds: 2400, diamondCost: 2400, stock: 8, cashValue: '$160', description: 'Timeless fiberglass fountain pen with 14K gold nib.', tag: 'STUDIO', active: true, imageUrl: '' },
    { id: 'seed_7', title: 'Theragun Mini Massager', category: 'fitness', diamonds: 2800, diamondCost: 2800, stock: 14, cashValue: '$199', description: 'Ultra-portable, on-the-go deep muscle percussion treatment.', tag: 'ATHLETICS', active: true, imageUrl: '' },
    { id: 'seed_8', title: 'Nanoleaf Hexagons Starter', category: 'home-decorate', diamonds: 3100, diamondCost: 3100, stock: 9, cashValue: '$220', description: 'Modular smart LED light panels with rhythm music sync.', tag: 'INTERIOR', active: true, imageUrl: '' },
    { id: 'seed_9', title: 'Energy Tap 24K Gold Founder Card', category: 'custom', diamonds: 10000, diamondCost: 10000, stock: 3, cashValue: '$1000', description: 'Real physical engraved 24K gold founder membership card.', tag: 'VIP EXCLUSIVE', active: true, imageUrl: '' }
  ];
  db.ref('/mega_rewards').set(sample)
    .then(() => alert('9 Sample Rewards seeded to Firebase!'))
    .catch(err => alert('Firebase error: ' + err.message));
}

function renderRewardsCatalog() {
  const grid = document.getElementById('rewardsCatalogGrid');
  const meta = document.getElementById('rewardsInventoryMeta');
  if (!grid) return;

  const rewards = window.adminState.rewards || [];
  if (meta) meta.textContent = `${rewards.length} items registered`;

  if (rewards.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 32px; text-align: center; color: #64748b;">
        No reward items found in Firebase. Click "Seed 9 Sample Items" or add one above!
      </div>
    `;
    return;
  }

  let html = '';
  rewards.forEach(r => {
    const cat = MEGA_CATEGORIES.find(c => c.id === r.category) || MEGA_CATEGORIES[0];
    html += `
      <div style="background: rgba(4, 10, 26, 0.7); border: 1px solid rgba(25, 55, 120, 0.4); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column;">
        <div style="height: 120px; background: #030818; position: relative; display: flex; align-items: center; justify-content: center;">
          ${r.imageUrl ? `<img src="${r.imageUrl}" style="width: 100%; height: 100%; object-fit: cover;">` : `<span style="font-size: 38px;">${cat.icon}</span>`}
          <span style="position: absolute; top: 8px; left: 8px; background: rgba(2, 6, 20, 0.85); color: #38bdf8; font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 99px;">${r.tag || cat.tag}</span>
          <span style="position: absolute; bottom: 8px; right: 8px; background: #0284c7; color: #fff; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 99px;">${Number(r.diamondCost).toLocaleString()} 💎</span>
        </div>
        <div style="padding: 12px; display: flex; flex-direction: column; gap: 6px; flex: 1;">
          <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase;">${cat.name}</div>
          <h4 style="font-size: 13.5px; font-weight: 800; color: #fff;">${r.title}</h4>
          <div style="font-size: 11px; color: #94a3b8; margin-top: auto;">Stock: <strong>${r.stock}</strong> units</div>
          <div style="display: flex; gap: 6px; margin-top: 8px;">
            <button onclick="editRewardItem('${r.id}')" class="btn-secondary" style="flex: 1; padding: 5px; font-size: 11px;">Edit</button>
            <button onclick="deleteRewardItem('${r.id}')" class="btn-secondary" style="padding: 5px 8px; font-size: 11px; color: #f87171;">🗑️</button>
          </div>
        </div>
      </div>
    `;
  });
  grid.innerHTML = html;
}

window.selectCategory = selectCategory;
window.saveRewardToFirebase = saveRewardToFirebase;
window.clearRewardForm = clearRewardForm;
window.editRewardItem = editRewardItem;
window.deleteRewardItem = deleteRewardItem;
window.seedSampleRewardsToFirebase = seedSampleRewardsToFirebase;
window.renderRewardsCatalog = renderRewardsCatalog;
