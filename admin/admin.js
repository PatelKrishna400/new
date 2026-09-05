/* ==========================================================================
   ENERGY TAP REACTOR - MEGA REWARDS ADMIN PORTAL CONTROLLER
   - Firebase Realtime Database Integration (/mega_rewards)
   - LocalStorage Realtime Mirroring & Offline Fallback
   - CRUD (Add, Edit, Delete, Stock update, Toggle active)
   - Live Image Preview & File to Base64 Conversion
   - 1-Click Sample Rewards Seeder across all 9 categories
   ========================================================================== */

// Firebase Configuration (Same project database as Telegram Mini App)
const firebaseConfig = {
  apiKey: "AIzaSyDnujl5_iBlSzwDfjCLA7sFQ7zW1DxROic",
  authDomain: "tap-game-80070.firebaseapp.com",
  databaseURL: "https://tap-game-80070-default-rtdb.firebaseio.com",
  projectId: "tap-game-80070",
  storageBucket: "tap-game-80070.firebasestorage.app",
  messagingSenderId: "1028935905694",
  appId: "1:1028935905694:web:af5190281ad93c0ebbe68f",
  measurementId: "G-B8KMYEQ0L4"
};

const LOCAL_STORAGE_KEY = 'ENERGY_TAP_MEGA_REWARDS_DATA_V1';

// All 9 Official Mega Reward Categories
const CATEGORIES = [
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

// Admin State
let adminState = {
  rewards: [],
  selectedCategory: 'gift-card',
  filterCategory: 'all',
  searchQuery: '',
  editingId: null,
  isFirebaseOnline: false
};

let db = null;
let auth = null;

// ==========================================================================
// INITIALIZATION & FIREBASE SETUP
// ==========================================================================
function initAdminPortal() {
  loadLocalRewards();
  initFirebase();
  setupEventListeners();
  renderCategoryChips();
  renderFilterButtons();
  updateMetrics();
  renderRewardsGrid();
  updateLivePreview();
}

function initFirebase() {
  try {
    if (typeof firebase !== 'undefined') {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      db = firebase.database();
      auth = firebase.auth();

      auth.signInAnonymously()
        .then(() => {
          setCloudStatus(true);
          listenToCloudRewards();
        })
        .catch(err => {
          console.warn('Firebase Auth failed, attempting read without auth token:', err);
          setCloudStatus(false);
          listenToCloudRewards();
        });
    } else {
      setCloudStatus(false);
    }
  } catch (err) {
    console.error('Firebase initialization error:', err);
    setCloudStatus(false);
  }
}

function setCloudStatus(isOnline) {
  adminState.isFirebaseOnline = isOnline;
  const chip = document.getElementById('cloudSyncChip');
  const label = document.getElementById('cloudStatusText');
  if (chip && label) {
    if (isOnline) {
      chip.classList.add('synced');
      label.textContent = 'Cloud Live (RTDB)';
    } else {
      chip.classList.remove('synced');
      label.textContent = 'Local Cache Mode';
    }
  }
}

// Real-time Cloud Synchronization
function listenToCloudRewards() {
  if (!db) return;
  const rewardsRef = db.ref('/mega_rewards');
  rewardsRef.on('value', snapshot => {
    const data = snapshot.val();
    if (data) {
      const rewardsArray = Array.isArray(data) ? data : Object.values(data);
      adminState.rewards = rewardsArray;
      saveLocalRewards();
      renderRewardsGrid();
      updateMetrics();
      console.log(`🔥 Realtime sync: ${adminState.rewards.length} mega rewards received from Firebase.`);
    }
  });
}

function syncToCloud() {
  saveLocalRewards();
  if (db && adminState.isFirebaseOnline) {
    const rewardsMap = {};
    adminState.rewards.forEach(r => {
      rewardsMap[r.id] = r;
    });
    db.ref('/mega_rewards').set(rewardsMap)
      .then(() => console.log('☁️ Mega rewards synchronized to Firebase cloud.'))
      .catch(e => console.warn('Failed to push to Firebase:', e));
  }
}

function loadLocalRewards() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      adminState.rewards = JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to parse local rewards:', e);
    adminState.rewards = [];
  }
}

function saveLocalRewards() {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(adminState.rewards));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
}

// ==========================================================================
// FORM HANDLING & LIVE PREVIEW
// ==========================================================================
function setupEventListeners() {
  const form = document.getElementById('rewardForm');
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }

  // Live input sync for preview
  const titleInput = document.getElementById('rewardTitle');
  const priceInput = document.getElementById('rewardDiamonds');
  const tagInput = document.getElementById('rewardTag');
  const imageInput = document.getElementById('rewardImageUrl');
  const fileInput = document.getElementById('rewardImageFile');

  if (titleInput) titleInput.addEventListener('input', updateLivePreview);
  if (priceInput) priceInput.addEventListener('input', updateLivePreview);
  if (tagInput) tagInput.addEventListener('change', updateLivePreview);

  if (imageInput) {
    imageInput.addEventListener('input', () => {
      const url = imageInput.value.trim();
      updatePreviewImage(url);
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = ev => {
          const base64Url = ev.target.result;
          if (imageInput) imageInput.value = base64Url;
          updatePreviewImage(base64Url);
          showToast('📸 Image converted & loaded for upload!');
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Search input
  const searchEl = document.getElementById('inventorySearch');
  if (searchEl) {
    searchEl.addEventListener('input', e => {
      adminState.searchQuery = e.target.value.toLowerCase();
      renderRewardsGrid();
    });
  }
}

function updatePreviewImage(url) {
  const imgEl = document.getElementById('previewImg');
  const placeholderEl = document.getElementById('previewPlaceholder');
  if (!imgEl || !placeholderEl) return;

  if (url && url.length > 5) {
    imgEl.src = url;
    imgEl.style.display = 'block';
    placeholderEl.style.display = 'none';
    imgEl.onerror = () => {
      imgEl.style.display = 'none';
      placeholderEl.style.display = 'flex';
    };
  } else {
    imgEl.style.display = 'none';
    placeholderEl.style.display = 'flex';
  }
  updateLivePreview();
}

function updateLivePreview() {
  const titleVal = document.getElementById('rewardTitle')?.value || 'Reward Title';
  const diamondVal = document.getElementById('rewardDiamonds')?.value || '500';
  const tagVal = document.getElementById('rewardTag')?.value || 'HOT';
  const cat = CATEGORIES.find(c => c.id === adminState.selectedCategory) || CATEGORIES[0];
  const imgUrl = document.getElementById('rewardImageUrl')?.value;

  const prevTitle = document.getElementById('simTitle');
  const prevTag = document.getElementById('simTag');
  const prevDiamonds = document.getElementById('simDiamonds');
  const prevCat = document.getElementById('simCategory');
  const prevMedia = document.getElementById('simMediaBox');

  if (prevTitle) prevTitle.textContent = titleVal;
  if (prevTag) prevTag.textContent = tagVal;
  if (prevDiamonds) prevDiamonds.textContent = parseInt(diamondVal, 10).toLocaleString();
  if (prevCat) prevCat.textContent = `${cat.icon} ${cat.name}`;

  if (prevMedia) {
    if (imgUrl && imgUrl.length > 5) {
      prevMedia.innerHTML = `<img src="${imgUrl}" class="sim-img" alt="Preview">`;
    } else {
      prevMedia.innerHTML = `<span class="sim-fallback-icon">${cat.icon}</span>`;
    }
  }
}

// ==========================================================================
// CATEGORY SELECTOR & FILTER CHIPS
// ==========================================================================
function renderCategoryChips() {
  const container = document.getElementById('categoryChipsContainer');
  if (!container) return;

  container.innerHTML = CATEGORIES.map(cat => `
    <button type="button" 
            class="cat-chip-btn ${cat.id === adminState.selectedCategory ? 'active' : ''}" 
            onclick="selectCategory('${cat.id}')">
      <span class="cat-chip-icon">${cat.icon}</span>
      <span>${cat.name}</span>
    </button>
  `).join('');
}

function selectCategory(catId) {
  adminState.selectedCategory = catId;
  renderCategoryChips();
  updateLivePreview();
}

function renderFilterButtons() {
  const container = document.getElementById('categoryFilterBar');
  if (!container) return;

  let html = `
    <button class="cat-filter-btn ${adminState.filterCategory === 'all' ? 'active' : ''}" 
            onclick="setCategoryFilter('all')">
      🌟 All (${adminState.rewards.length})
    </button>
  `;

  CATEGORIES.forEach(cat => {
    const count = adminState.rewards.filter(r => r.category === cat.id).length;
    html += `
      <button class="cat-filter-btn ${adminState.filterCategory === cat.id ? 'active' : ''}" 
              onclick="setCategoryFilter('${cat.id}')">
        ${cat.icon} ${cat.name} (${count})
      </button>
    `;
  });

  container.innerHTML = html;
}

function setCategoryFilter(catId) {
  adminState.filterCategory = catId;
  renderFilterButtons();
  renderRewardsGrid();
}

// ==========================================================================
// CRUD: CREATE, READ, UPDATE, DELETE REWARDS
// ==========================================================================
function handleFormSubmit(e) {
  e.preventDefault();

  const title = document.getElementById('rewardTitle').value.trim();
  const diamonds = parseInt(document.getElementById('rewardDiamonds').value, 10) || 100;
  const cashValue = document.getElementById('rewardCashValue').value.trim() || '$50';
  const stock = parseInt(document.getElementById('rewardStock').value, 10) || 10;
  const tag = document.getElementById('rewardTag').value || 'FEATURED';
  const imageUrl = document.getElementById('rewardImageUrl').value.trim();
  const description = document.getElementById('rewardDesc').value.trim();
  const reqLevel = parseInt(document.getElementById('rewardLevelReq').value, 10) || 0;

  if (!title) {
    showToast('⚠️ Please enter a reward title!');
    return;
  }

  const catObj = CATEGORIES.find(c => c.id === adminState.selectedCategory) || CATEGORIES[0];

  if (adminState.editingId) {
    // Update existing reward
    const idx = adminState.rewards.findIndex(r => r.id === adminState.editingId);
    if (idx !== -1) {
      adminState.rewards[idx] = {
        ...adminState.rewards[idx],
        category: adminState.selectedCategory,
        categoryName: catObj.name,
        categoryIcon: catObj.icon,
        title,
        diamonds,
        cashValue,
        stock,
        tag,
        imageUrl: imageUrl || '',
        description,
        reqLevel,
        updatedAt: Date.now()
      };
      showToast(`✅ "${title}" updated successfully!`);
    }
    adminState.editingId = null;
    document.getElementById('submitBtnText').textContent = 'Upload Mega Reward to Cloud';
  } else {
    // Create new reward
    const newReward = {
      id: 'mr_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now(),
      category: adminState.selectedCategory,
      categoryName: catObj.name,
      categoryIcon: catObj.icon,
      title,
      diamonds,
      cashValue,
      stock,
      tag,
      imageUrl: imageUrl || '',
      description,
      reqLevel,
      status: 'active',
      createdAt: Date.now()
    };
    adminState.rewards.unshift(newReward);
    showToast(`🎉 "${title}" uploaded to Mega Rewards!`);
  }

  syncToCloud();
  resetForm();
  renderRewardsGrid();
  renderFilterButtons();
  updateMetrics();
}

function resetForm() {
  document.getElementById('rewardForm').reset();
  adminState.editingId = null;
  document.getElementById('submitBtnText').textContent = 'Upload Mega Reward to Cloud';
  updatePreviewImage('');
  selectCategory('gift-card');
  updateLivePreview();
}

function editReward(rewardId) {
  const reward = adminState.rewards.find(r => r.id === rewardId);
  if (!reward) return;

  adminState.editingId = rewardId;
  document.getElementById('rewardTitle').value = reward.title || '';
  document.getElementById('rewardDiamonds').value = reward.diamonds || 100;
  document.getElementById('rewardCashValue').value = reward.cashValue || '';
  document.getElementById('rewardStock').value = reward.stock || 10;
  document.getElementById('rewardTag').value = reward.tag || 'FEATURED';
  document.getElementById('rewardImageUrl').value = reward.imageUrl || '';
  document.getElementById('rewardDesc').value = reward.description || '';
  document.getElementById('rewardLevelReq').value = reward.reqLevel || 0;

  selectCategory(reward.category);
  updatePreviewImage(reward.imageUrl);

  document.getElementById('submitBtnText').textContent = 'Save Changes to Cloud';
  window.scrollTo({ top: 120, behavior: 'smooth' });
  showToast(`✏️ Editing "${reward.title}"`);
}

function deleteReward(rewardId) {
  const reward = adminState.rewards.find(r => r.id === rewardId);
  if (!reward) return;

  if (confirm(`Are you sure you want to delete "${reward.title}"?`)) {
    adminState.rewards = adminState.rewards.filter(r => r.id !== rewardId);
    if (adminState.editingId === rewardId) {
      resetForm();
    }
    syncToCloud();
    renderRewardsGrid();
    renderFilterButtons();
    updateMetrics();
    showToast(`🗑️ Deleted "${reward.title}"`);
  }
}

function toggleRewardStock(rewardId, delta) {
  const reward = adminState.rewards.find(r => r.id === rewardId);
  if (!reward) return;

  reward.stock = Math.max(0, (reward.stock || 0) + delta);
  syncToCloud();
  renderRewardsGrid();
  updateMetrics();
  showToast(`📦 Stock for "${reward.title}": ${reward.stock}`);
}

// ==========================================================================
// INVENTORY RENDERING & METRICS
// ==========================================================================
function renderRewardsGrid() {
  const grid = document.getElementById('rewardsGrid');
  if (!grid) return;

  let filtered = adminState.rewards;

  // Filter by category
  if (adminState.filterCategory !== 'all') {
    filtered = filtered.filter(r => r.category === adminState.filterCategory);
  }

  // Filter by search
  if (adminState.searchQuery) {
    filtered = filtered.filter(r => 
      r.title.toLowerCase().includes(adminState.searchQuery) ||
      (r.description && r.description.toLowerCase().includes(adminState.searchQuery)) ||
      (r.categoryName && r.categoryName.toLowerCase().includes(adminState.searchQuery))
    );
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-inventory-card">
        <div class="empty-icon">👑</div>
        <h4 class="empty-title">No Mega Rewards in this Category</h4>
        <p class="empty-desc">Use the upload form on the left to add items, or click "Seed Sample Rewards" to generate instant test items.</p>
        <button class="btn-tool btn-seed" onclick="seedSampleRewards()">⚡ Seed Default Mega Rewards</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(reward => {
    const cat = CATEGORIES.find(c => c.id === reward.category) || { icon: '🎁', name: reward.category };
    const hasImg = reward.imageUrl && reward.imageUrl.length > 5;
    const isOutOfStock = (reward.stock || 0) <= 0;

    return `
      <div class="reward-admin-card" id="rewardCard-${reward.id}">
        <div class="card-media-banner">
          ${hasImg 
            ? `<img src="${reward.imageUrl}" class="card-media-img" alt="${reward.title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"><span class="card-media-fallback" style="display:none;">${cat.icon}</span>` 
            : `<span class="card-media-fallback">${cat.icon}</span>`
          }
          <span class="card-badge-tag">${reward.tag || 'HOT'}</span>
          <span class="card-diamond-pill">💎 ${(reward.diamonds || 100).toLocaleString()}</span>
        </div>

        <div class="card-content-body">
          <span class="card-cat-badge">${cat.icon} ${cat.name}</span>
          <h4 class="card-title-text">${reward.title}</h4>
          <p class="card-desc-text">${reward.description || 'No description provided.'}</p>

          <div class="card-meta-row">
            <div class="meta-stock-group">
              <span>Stock: </span>
              <span class="meta-stock-val ${isOutOfStock ? 'out' : ''}">${isOutOfStock ? 'OUT OF STOCK' : `${reward.stock} units`}</span>
            </div>

            <div class="card-actions-row">
              <button class="btn-card-action" onclick="toggleRewardStock('${reward.id}', 5)" title="+5 Stock">+5</button>
              <button class="btn-card-action" onclick="editReward('${reward.id}')" title="Edit Reward">✏️</button>
              <button class="btn-card-action btn-del" onclick="deleteReward('${reward.id}')" title="Delete Reward">🗑️</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function updateMetrics() {
  const totalCountEl = document.getElementById('metricTotalRewards');
  const activeCatsEl = document.getElementById('metricActiveCats');
  const totalDiamondsEl = document.getElementById('metricTotalDiamonds');
  const inStockEl = document.getElementById('metricInStock');

  const totalRewards = adminState.rewards.length;
  const uniqueCats = new Set(adminState.rewards.map(r => r.category)).size;
  const totalDiamonds = adminState.rewards.reduce((sum, r) => sum + ((r.diamonds || 0) * (r.stock || 1)), 0);
  const totalStock = adminState.rewards.reduce((sum, r) => sum + (r.stock || 0), 0);

  if (totalCountEl) totalCountEl.textContent = totalRewards.toLocaleString();
  if (activeCatsEl) activeCatsEl.textContent = `${uniqueCats} / 9`;
  if (totalDiamondsEl) totalDiamondsEl.textContent = totalDiamonds.toLocaleString();
  if (inStockEl) inStockEl.textContent = totalStock.toLocaleString();
}

// ==========================================================================
// 1-CLICK SEED SAMPLE MEGA REWARDS (ACROSS ALL 9 CATEGORIES)
// ==========================================================================
function seedSampleRewards() {
  const samples = [
    // 1. Gift Card
    {
      id: 'mr_gc_amazon_100',
      category: 'gift-card',
      categoryName: 'Gift Card',
      categoryIcon: '🎁',
      title: 'Amazon $100 Digital Voucher',
      diamonds: 1000,
      cashValue: '$100',
      stock: 25,
      tag: 'BESTSELLER',
      imageUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&auto=format&fit=crop&q=60',
      description: 'Instant Amazon electronic voucher delivered via verified Telegram message. Redeemable for all items worldwide.',
      reqLevel: 5,
      status: 'active',
      createdAt: Date.now() - 100000
    },
    {
      id: 'mr_gc_steam_50',
      category: 'gift-card',
      categoryName: 'Gift Card',
      categoryIcon: '🎁',
      title: 'Steam $50 Wallet Card',
      diamonds: 500,
      cashValue: '$50',
      stock: 40,
      tag: 'GAMING',
      imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop&q=60',
      description: 'Add $50 directly to your Steam wallet. Purchase any game, DLC, or Steam Community Market items.',
      reqLevel: 3,
      status: 'active',
      createdAt: Date.now() - 90000
    },

    // 2. Gadgets
    {
      id: 'mr_gad_iphone16',
      category: 'gadgets',
      categoryName: 'Gadgets',
      categoryIcon: '📱',
      title: 'Apple iPhone 16 Pro 256GB',
      diamonds: 12000,
      cashValue: '$1,099',
      stock: 5,
      tag: 'FLAGSHIP',
      imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop&q=60',
      description: 'Grade-A Titanium flagship smartphone with A18 Pro Bionic chip, 48MP Fusion camera, and global AppleCare warranty.',
      reqLevel: 20,
      status: 'active',
      createdAt: Date.now() - 80000
    },
    {
      id: 'mr_gad_airpods_pro',
      category: 'gadgets',
      categoryName: 'Gadgets',
      categoryIcon: '📱',
      title: 'Apple AirPods Pro (2nd Gen)',
      diamonds: 2500,
      cashValue: '$249',
      stock: 18,
      tag: 'POPULAR',
      imageUrl: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=500&auto=format&fit=crop&q=60',
      description: 'Up to 2x more Active Noise Cancellation, Adaptive Audio, and MagSafe charging case with USB-C.',
      reqLevel: 10,
      status: 'active',
      createdAt: Date.now() - 70000
    },

    // 3. Accessories
    {
      id: 'mr_acc_magsafe_powerbank',
      category: 'accessories',
      categoryName: 'Accessories',
      categoryIcon: '🎒',
      title: 'Anker MagSafe 10,000mAh PowerBank',
      diamonds: 450,
      cashValue: '$49',
      stock: 35,
      tag: 'EDC',
      imageUrl: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500&auto=format&fit=crop&q=60',
      description: 'Snap-on magnetic wireless charger with kickstand and fast 20W USB-C bi-directional power delivery.',
      reqLevel: 2,
      status: 'active',
      createdAt: Date.now() - 60000
    },

    // 4. Gaming Tool
    {
      id: 'mr_gam_dualsense',
      category: 'gaming-tool',
      categoryName: 'Gaming Tool',
      categoryIcon: '🎮',
      title: 'Sony DualSense Wireless Controller',
      diamonds: 700,
      cashValue: '$69',
      stock: 22,
      tag: 'ESPORTS',
      imageUrl: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=500&auto=format&fit=crop&q=60',
      description: 'Immersive haptic feedback, dynamic adaptive triggers, and integrated microphone in Midnight Black.',
      reqLevel: 5,
      status: 'active',
      createdAt: Date.now() - 50000
    },

    // 5. Kitchen
    {
      id: 'mr_kit_delonghi',
      category: 'kitchen',
      categoryName: 'Kitchen',
      categoryIcon: '☕',
      title: "De'Longhi Dedica Espresso Machine",
      diamonds: 2200,
      cashValue: '$299',
      stock: 8,
      tag: 'GOURMET',
      imageUrl: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500&auto=format&fit=crop&q=60',
      description: 'Premium 15-bar Italian espresso pump machine with manual milk frother and stainless steel body.',
      reqLevel: 8,
      status: 'active',
      createdAt: Date.now() - 40000
    },

    // 6. Stationery
    {
      id: 'mr_stat_lamy',
      category: 'stationery',
      categoryName: 'Stationery',
      categoryIcon: '✒️',
      title: 'Lamy 2000 Bauhaus Fountain Pen',
      diamonds: 1800,
      cashValue: '$199',
      stock: 12,
      tag: 'COLLECTOR',
      imageUrl: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&auto=format&fit=crop&q=60',
      description: 'Iconic Macrolon fiberglass body with 14-karat platinum-coated gold nib and piston filling mechanism.',
      reqLevel: 6,
      status: 'active',
      createdAt: Date.now() - 30000
    },

    // 7. Fitness
    {
      id: 'mr_fit_theragun',
      category: 'fitness',
      categoryName: 'Fitness',
      categoryIcon: '🏋️',
      title: 'Theragun Mini Deep Muscle Massager',
      diamonds: 1900,
      cashValue: '$199',
      stock: 14,
      tag: 'WELLNESS',
      imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=500&auto=format&fit=crop&q=60',
      description: 'Ultra-portable, pocket-sized percussion therapy device with QuietForce technology and 3 speed presets.',
      reqLevel: 7,
      status: 'active',
      createdAt: Date.now() - 20000
    },

    // 8. Home Decorate
    {
      id: 'mr_home_nanoleaf',
      category: 'home-decorate',
      categoryName: 'Home Decorate',
      categoryIcon: '🏠',
      title: 'Nanoleaf RGB Smart Hexagon Panels (9PK)',
      diamonds: 2100,
      cashValue: '$219',
      stock: 10,
      tag: 'CYBERPUNK',
      imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format&fit=crop&q=60',
      description: 'Modular RGB touch-sensitive smart light panels with music visualizer, screen mirror, and HomeKit integration.',
      reqLevel: 9,
      status: 'active',
      createdAt: Date.now() - 10000
    },

    // 9. Custom
    {
      id: 'mr_cust_vip_gold',
      category: 'custom',
      categoryName: 'Custom',
      categoryIcon: '⭐',
      title: 'Custom Laser-Engraved 24K Gold NFC Card',
      diamonds: 5000,
      cashValue: '$500',
      stock: 5,
      tag: 'VIP ONLY',
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60',
      description: 'Custom personalized 24K gold plated metal card with embedded NFC tap transmitter and custom laser engraved nickname.',
      reqLevel: 25,
      status: 'active',
      createdAt: Date.now()
    }
  ];

  adminState.rewards = samples;
  syncToCloud();
  renderRewardsGrid();
  renderFilterButtons();
  updateMetrics();
  showToast('⚡ 10 Sample Mega Rewards across all 9 categories loaded & synced!');
}

// ==========================================================================
// EXPORT / IMPORT JSON
// ==========================================================================
function exportRewardsJson() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(adminState.rewards, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `tap_empire_mega_rewards_${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast('📥 Mega rewards JSON exported successfully!');
}

function triggerImportFile() {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json';
  fileInput.onchange = e => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const imported = JSON.parse(ev.target.result);
          if (Array.isArray(imported)) {
            adminState.rewards = imported;
            syncToCloud();
            renderRewardsGrid();
            renderFilterButtons();
            updateMetrics();
            showToast(`📤 Successfully imported ${imported.length} mega rewards!`);
          } else {
            alert('Invalid JSON: Must be an array of rewards.');
          }
        } catch (err) {
          alert('Error parsing JSON file: ' + err.message);
        }
      };
      reader.readAsText(file);
    }
  };
  fileInput.click();
}

// ==========================================================================
// TOAST NOTIFICATIONS
// ==========================================================================
function showToast(msg) {
  let toast = document.getElementById('adminToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'adminToast';
    toast.className = 'toast-notice';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span>⚡</span> <span>${msg}</span>`;
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Global Exports
window.initAdminPortal = initAdminPortal;
window.selectCategory = selectCategory;
window.setCategoryFilter = setCategoryFilter;
window.editReward = editReward;
window.deleteReward = deleteReward;
window.toggleRewardStock = toggleRewardStock;
window.resetForm = resetForm;
window.seedSampleRewards = seedSampleRewards;
window.exportRewardsJson = exportRewardsJson;
window.triggerImportFile = triggerImportFile;

document.addEventListener('DOMContentLoaded', initAdminPortal);
