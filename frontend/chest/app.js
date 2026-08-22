/* =========================================================
   MYSTERY CHEST VAULT - COMPLETE GAME ENGINE & KEY SHOP
   ========================================================= */

(function () {
  'use strict';

  // --- TELEGRAM SDK ---
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
    try { tg.enableClosingConfirmation(); } catch (e) {}
    try {
      if (tg.BackButton) {
        tg.BackButton.show();
        tg.BackButton.onClick(() => handleBackAction());
      }
    } catch (e) {}
  }

  function triggerHaptic(type = 'light') {
    if (!tg || !tg.HapticFeedback) return;
    try {
      if (type === 'light' || type === 'medium' || type === 'heavy') {
        tg.HapticFeedback.impactOccurred(type);
      } else if (type === 'success' || type === 'warning' || type === 'error') {
        tg.HapticFeedback.notificationOccurred(type);
      } else if (type === 'select') {
        tg.HapticFeedback.selectionChanged();
      }
    } catch (e) {}
  }

  // --- SOUND EFFECTS SYNTHESIS ---
  class SoundFX {
    constructor() {
      this.ctx = null;
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    }

    playClick() {
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    }

    playRumble() {
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(70, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(45, this.ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.16, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.45);
    }

    playOpenLid() {
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(950, this.ctx.currentTime + 0.28);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.28);
    }

    playFanfare(rarity) {
      this.init();
      const now = this.ctx.currentTime;
      let notes = [523.25, 659.25, 783.99];

      if (rarity === 'epic') notes = [523.25, 659.25, 783.99, 1046.50];
      if (rarity === 'legendary') notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
      if (rarity === 'mythic') notes = [523.25, 659.25, 783.99, 987.77, 1174.66, 1318.51, 1567.98];

      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = rarity === 'mythic' ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.18, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.6);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.6);
      });
    }

    playCoinJingle() {
      this.init();
      const notes = [987.77, 1318.51];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.06);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.06 + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.06);
        osc.stop(this.ctx.currentTime + idx * 0.06 + 0.18);
      });
    }
  }

  const sound = new SoundFX();

  // --- EMOJI LOOT CATALOG ---
  const ITEMS_CATALOG = [
    // COMMON
    { id: 'c1', name: 'Starter Shortsword', rarity: 'common', emoji: '🗡️', power: 45 },
    { id: 'c2', name: 'Magic Wand', rarity: 'common', emoji: '🪄', power: 50 },
    { id: 'c3', name: 'Adventurer Boots', rarity: 'common', emoji: '🥾', power: 35 },
    { id: 'c4', name: 'Guardian Shield', rarity: 'common', emoji: '🛡️', power: 40 },
    { id: 'c5', name: 'Bonus Coin Pouch', rarity: 'common', emoji: '💰', power: 25 },
    { id: 'c6', name: 'Health Elixir', rarity: 'common', emoji: '🧪', power: 30 },

    // RARE
    { id: 'r1', name: 'Frostbite Dagger', rarity: 'rare', emoji: '❄️', power: 120 },
    { id: 'r2', name: 'Arcane Grimoire', rarity: 'rare', emoji: '📖', power: 140 },
    { id: 'r3', name: 'Shadow Cloak', rarity: 'rare', emoji: '🥷', power: 115 },
    { id: 'r4', name: 'Cobalt Ring', rarity: 'rare', emoji: '💍', power: 130 },
    { id: 'r5', name: 'Silver Key', rarity: 'rare', emoji: '🥈', power: 100 },
    { id: 'r6', name: 'Griffin Pet', rarity: 'rare', emoji: '🦅', power: 160 },

    // EPIC
    { id: 'e1', name: 'Dragon Blade', rarity: 'epic', emoji: '🔥⚔️', power: 340 },
    { id: 'e2', name: 'Titan Solar Aegis', rarity: 'epic', emoji: '🛡️✨', power: 380 },
    { id: 'e3', name: 'Soulfire Lantern', rarity: 'epic', emoji: '🏮', power: 310 },
    { id: 'e4', name: 'Emerald Wyrm', rarity: 'epic', emoji: '🐉', power: 420 },

    // LEGENDARY
    { id: 'l1', name: 'Excalibur', rarity: 'legendary', emoji: '⚔️🌟', power: 850 },
    { id: 'l2', name: 'Sovereign Crown', rarity: 'legendary', emoji: '👑💎', power: 920 },
    { id: 'l3', name: 'Phoenix Spirit', rarity: 'legendary', emoji: '🐦🔥', power: 980 },

    // MYTHIC
    { id: 'm1', name: 'Nebula Sovereign', rarity: 'mythic', emoji: '🌌⚔️', power: 2400 },
    { id: 'm2', name: 'Void Dragon Eye', rarity: 'mythic', emoji: '👁️🔮', power: 2600 }
  ];

  const DROP_RATES = {
    bronze: { common: 0.70, rare: 0.22, epic: 0.07, legendary: 0.009, mythic: 0.001 },
    silver: { common: 0.20, rare: 0.55, epic: 0.20, legendary: 0.04, mythic: 0.01 },
    golden: { common: 0.05, rare: 0.25, epic: 0.45, legendary: 0.20, mythic: 0.05 }
  };

  // --- GAME STATE (ALL STARTING BALANCES SET TO 0) ---
  class GameState {
    constructor() {
      this.keys = {
        free: 0,     // Bronze Keys
        silver: 0,   // Silver Keys
        golden: 0    // Golden Keys
      };
      this.hasSilverPass = false;
      this.silverAdsWatched = 0;
      this.hasGoldenPass = false;
      this.goldenAdsWatched = 0;
      this.starsBalance = 0;
      this.coins = 0;
      this.energy = 100;
      this.xp = 0;
      this.inventory = {};
      this.load();
    }

    save() {
      try {
        const data = {
          keys: this.keys,
          hasSilverPass: this.hasSilverPass,
          silverAdsWatched: this.silverAdsWatched,
          hasGoldenPass: this.hasGoldenPass,
          goldenAdsWatched: this.goldenAdsWatched,
          starsBalance: this.starsBalance,
          coins: this.coins,
          energy: this.energy,
          xp: this.xp,
          inventory: this.inventory
        };
        localStorage.setItem('mystery_vault_zero_start_v1', JSON.stringify(data));
      } catch (e) {}
    }

    load() {
      try {
        const raw = localStorage.getItem('mystery_vault_zero_start_v1');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.keys) this.keys = parsed.keys;
          if (parsed.hasSilverPass !== undefined) this.hasSilverPass = parsed.hasSilverPass;
          if (parsed.silverAdsWatched !== undefined) this.silverAdsWatched = parsed.silverAdsWatched;
          if (parsed.hasGoldenPass !== undefined) this.hasGoldenPass = parsed.hasGoldenPass;
          if (parsed.goldenAdsWatched !== undefined) this.goldenAdsWatched = parsed.goldenAdsWatched;
          if (parsed.starsBalance !== undefined) this.starsBalance = parsed.starsBalance;
          if (parsed.coins !== undefined) this.coins = parsed.coins;
          if (parsed.energy !== undefined) this.energy = parsed.energy;
          if (parsed.xp !== undefined) this.xp = parsed.xp;
          if (parsed.inventory) this.inventory = parsed.inventory;
        }
      } catch (e) {}
    }

    addItem(item) {
      this.inventory[item.id] = (this.inventory[item.id] || 0) + 1;
      this.save();
    }
  }

  const state = new GameState();

  // --- FULL-VIEW BACKGROUND CANVAS ---
  function initBgCanvas() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const particles = [];
    const colors = ['#d97706', '#38bdf8', '#f59e0b', '#ec4899'];
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.6 + 0.5,
        alpha: Math.random() * 0.7 + 0.3,
        speedY: Math.random() * 0.35 + 0.1,
        speedX: (Math.random() - 0.5) * 0.2,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.y -= p.speedY;
        p.x += p.speedX;
        if (p.y < 0) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = p.radius * 3;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.restore();
      });
      requestAnimationFrame(render);
    }
    render();
  }

  // --- RNG DROP GENERATOR ---
  function rollDrop(tierKey) {
    if (tierKey === 'bronze' || tierKey === 'free') {
      // Bronze: Win 10 Energy only
      return { id: 'reward_energy_10', name: '10 Energy', rarity: 'common', emoji: '⚡', power: 10, type: 'energy', amount: 10 };
    } else if (tierKey === 'silver') {
      // Silver: 10 Bronze Keys or 10 XP randomly
      const silverPool = [
        { id: 'reward_key_10', name: '10 Bronze Keys', rarity: 'rare', emoji: '🗝️', power: 10, type: 'keys_free', amount: 10 },
        { id: 'reward_xp_10', name: '10 XP Points', rarity: 'rare', emoji: '✨', power: 10, type: 'xp', amount: 10 }
      ];
      return silverPool[Math.floor(Math.random() * silverPool.length)];
    } else if (tierKey === 'golden') {
      // Golden: 10 Coins, 1 Silver Key, or 10 Bronze Keys randomly
      const goldenPool = [
        { id: 'reward_coins_10', name: '10 Coins', rarity: 'legendary', emoji: '💰', power: 10, type: 'coins', amount: 10 },
        { id: 'reward_silver_key_1', name: '1 Silver Key', rarity: 'epic', emoji: '🗝️', power: 1, type: 'keys_silver', amount: 1 },
        { id: 'reward_key_10', name: '10 Bronze Keys', rarity: 'rare', emoji: '🗝️', power: 10, type: 'keys_free', amount: 10 }
      ];
      return goldenPool[Math.floor(Math.random() * goldenPool.length)];
    }
    return { id: 'reward_energy_10', name: '10 Energy', rarity: 'common', emoji: '⚡', power: 10, type: 'energy', amount: 10 };
  }

  // --- DOM ELEMENTS ---
  const elBtnCircleBack = document.getElementById('btnCircleBack');
  const elLblTopKeyBalance = document.getElementById('lblTopKeyBalance');

  const elKeyCountNormal = document.getElementById('keyCountNormal');
  const elKeyCountSilver = document.getElementById('keyCountSilver');
  const elKeyCountGolden = document.getElementById('keyCountGolden');

  const elSilverLockBadge = document.getElementById('silverLockBadge');
  const elGoldenLockBadge = document.getElementById('goldenLockBadge');

  const elLblNormalKeyCount = document.getElementById('lblNormalKeyCount');
  const elBtnOpenBronzeKey = document.getElementById('btnOpenBronzeKey');

  const elBtnOpenSilverMain = document.getElementById('btnOpenSilverMain');
  const elTxtSilverCta = document.getElementById('txtSilverCta');
  const elSubSilverCta = document.getElementById('subSilverCta');
  const elBtnTriggerSilverPassModal = document.getElementById('btnTriggerSilverPassModal');

  const elBtnOpenGoldenMain = document.getElementById('btnOpenGoldenMain');
  const elTxtGoldenCta = document.getElementById('txtGoldenCta');
  const elSubGoldenCta = document.getElementById('subGoldenCta');
  const elBtnTriggerGoldenPassModal = document.getElementById('btnTriggerGoldenPassModal');

  // Key Shop Watch Ad Button
  const elShopWatchAdBtn = document.getElementById('shopWatchAdBtn');

  // Silver Pass Modal
  const elModalSilverPass = document.getElementById('modalSilverPass');
  const elBtnCloseSilverModal = document.getElementById('btnCloseSilverModal');
  const elBtnBuySilverStars = document.getElementById('btnBuySilverStars');
  const elBtnWatchAdForSilverPass = document.getElementById('btnWatchAdForSilverPass');
  const elLblSilverAdsProgress = document.getElementById('lblSilverAdsProgress');
  const elFillSilverAds = document.getElementById('fillSilverAds');

  // Golden Pass Modal
  const elModalGoldenPass = document.getElementById('modalGoldenPass');
  const elBtnCloseGoldenModal = document.getElementById('btnCloseGoldenModal');
  const elBtnBuyGoldenStars = document.getElementById('btnBuyGoldenStars');
  const elBtnWatchAdForGoldenPass = document.getElementById('btnWatchAdForGoldenPass');
  const elLblGoldenAdsProgress = document.getElementById('lblGoldenAdsProgress');
  const elFillGoldenAds = document.getElementById('fillGoldenAds');

  // Cinematic Scene Elements
  const elCinematicScene = document.getElementById('cinematicScene');
  const elSceneStatusTitle = document.getElementById('sceneStatusTitle');
  const elSceneChestHero = document.getElementById('sceneChestHero');
  const elSceneHeroEmoji = document.getElementById('sceneHeroEmoji');
  const elSceneHeroLock = document.getElementById('sceneHeroLock');

  // Rewarded Ad Modal
  const elModalAd = document.getElementById('modalAd');
  const elAdProgressFill = document.getElementById('adProgressFill');
  const elAdCountdown = document.getElementById('adCountdown');
  const elBtnClaimAdReward = document.getElementById('btnClaimAdReward');

  // Reveal Modal
  const elModalReveal = document.getElementById('modalReveal');
  const elCardsRevealGrid = document.getElementById('cardsRevealGrid');
  const elBtnClaimLoot = document.getElementById('btnClaimLoot');

  const elToastContainer = document.getElementById('toastContainer');
  const elTapParticleContainer = document.getElementById('tapParticleContainer');

  let isOpening = false;
  let adTimerInterval = null;
  let activeAdRewardCallback = null;
  let pendingChestPrize = null;

  // --- UPDATE UI ---
  function updateUI() {
    const elTicketNormal = document.getElementById('ticketCountNormal') || elKeyCountNormal;
    const elTicketSilver = document.getElementById('ticketCountSilver') || elKeyCountSilver;
    const elTicketGolden = document.getElementById('ticketCountGolden') || elKeyCountGolden;
    const elStarsDisplay = document.getElementById('topStarsDisplay');

    if (elLblTopKeyBalance) elLblTopKeyBalance.textContent = state.keys.free;
    if (elLblNormalKeyCount) elLblNormalKeyCount.textContent = state.keys.free;
    if (elStarsDisplay) elStarsDisplay.textContent = state.starsBalance;

    if (elTicketNormal) elTicketNormal.textContent = state.keys.free;
    if (elTicketSilver) elTicketSilver.textContent = state.keys.silver;
    if (elTicketGolden) elTicketGolden.textContent = state.keys.golden;

    // Silver Pass Status
    if (state.hasSilverPass) {
      if (elSilverLockBadge) {
        elSilverLockBadge.textContent = '🔓 Unlocked';
        elSilverLockBadge.classList.add('unlocked');
      }
      elTxtSilverCta.textContent = '🥈 OPEN SILVER CHEST (VIP PASS)';
      elSubSilverCta.textContent = 'Unlimited VIP Openings Active!';
      elBtnTriggerSilverPassModal.textContent = '✅ PASS ACTIVE';
      elBtnTriggerSilverPassModal.disabled = true;
    } else {
      if (elSilverLockBadge) {
        elSilverLockBadge.textContent = '🔒 Locked';
        elSilverLockBadge.classList.remove('unlocked');
      }
      elTxtSilverCta.textContent = '🥈 OPEN WITH SILVER PASS';
      elSubSilverCta.textContent = '⭐️ 500 Stars or 📺 50 Ads';
      elBtnTriggerSilverPassModal.textContent = 'GET PASS 🥈';
      elBtnTriggerSilverPassModal.disabled = false;
    }

    // Golden Pass Status
    if (state.hasGoldenPass) {
      if (elGoldenLockBadge) {
        elGoldenLockBadge.textContent = '🔓 Unlocked';
        elGoldenLockBadge.classList.add('unlocked');
      }
      elTxtGoldenCta.textContent = '👑 OPEN GOLDEN CHEST (VIP PASS)';
      elSubGoldenCta.textContent = 'Unlimited Royal Openings Active!';
      elBtnTriggerGoldenPassModal.textContent = '✅ PASS ACTIVE';
      elBtnTriggerGoldenPassModal.disabled = true;
    } else {
      if (elGoldenLockBadge) {
        elGoldenLockBadge.textContent = '🔒 Locked';
        elGoldenLockBadge.classList.remove('unlocked');
      }
      elTxtGoldenCta.textContent = '👑 OPEN WITH GOLDEN PASS';
      elSubGoldenCta.textContent = '⭐️ 1,000 Stars or 📺 100 Ads';
      elBtnTriggerGoldenPassModal.textContent = 'GET PASS 👑';
      elBtnTriggerGoldenPassModal.disabled = false;
    }

    // Sync Locked Tab Visual States for Silver and Gold
    const silverTabBtn = document.querySelector('.tier-tab-btn.silver-tier');
    const goldenTabBtn = document.querySelector('.tier-tab-btn.golden-tier');
    if (silverTabBtn) silverTabBtn.classList.toggle('locked-tier', !state.hasSilverPass);
    if (goldenTabBtn) goldenTabBtn.classList.toggle('locked-tier', !state.hasGoldenPass);

    // Modal Progress Bars
    if (elLblSilverAdsProgress) elLblSilverAdsProgress.textContent = `${state.silverAdsWatched}/50`;
    const silverPct = Math.min(100, (state.silverAdsWatched / 50) * 100);
    if (elFillSilverAds) elFillSilverAds.style.width = `${silverPct}%`;

    if (elLblGoldenAdsProgress) elLblGoldenAdsProgress.textContent = `${state.goldenAdsWatched}/100`;
    const goldenPct = Math.min(100, (state.goldenAdsWatched / 100) * 100);
    if (elFillGoldenAds) elFillGoldenAds.style.width = `${goldenPct}%`;
  }

  function handleBackAction() {
    sound.playClick();
    triggerHaptic('light');
    try {
      if (window.parent && window.parent !== window && typeof window.parent.closeChestPage === 'function') {
        window.parent.closeChestPage();
        return;
      }
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = '../index.html';
      }
    } catch (e) {
      window.location.href = '../index.html';
    }
  }

  function showToast(msg) {
    // Above notifications removed per user preference
  }

  function spawnTap(x, y, txt) {
    const el = document.createElement('div');
    el.className = 'tap-float-num';
    el.style.left = `${x - 20}px`;
    el.style.top = `${y - 20}px`;
    el.textContent = txt;
    elTapParticleContainer.appendChild(el);
    setTimeout(() => el.remove(), 800);
  }

  let activePassTier = 'silver';

  function openPassModal(tier) {
    activePassTier = tier;
    const modal = document.getElementById('passModal');
    if (!modal) return;
    const emoji = document.getElementById('passModalEmoji');
    const title = document.getElementById('passModalTitle');
    const tag = document.getElementById('passModalTag');
    const perks = document.getElementById('passModalPerks');

    if (tier === 'silver') {
      if (emoji) {
        emoji.textContent = '🗝️';
        emoji.className = 'pass-header-burst silver-key-icon silver-pass-burst';
      }
      if (title) title.textContent = 'Unlock Silver VIP Pass';
      if (tag) tag.textContent = 'VIP PASS REQUIRED';
      if (desc) desc.textContent = 'Get permanent access to the Silver Vault with exclusive rewards!';
      if (perks) {
        perks.innerHTML = `
          <div class="perk-item">✨ Permanent Silver Vault & Chest Access</div>
          <div class="perk-item">🗝️ Drop Pools: 10 Bronze Keys or 10 XP</div>
          <div class="perk-item">⚡ 2x Faster Ad Unlock Progress</div>
          <div class="perk-item">🥈 Exclusive Silver Key Rewards</div>
        `;
      }
      if (btnStarsText) btnStarsText.textContent = '⭐ 500 Telegram Stars';
      if (adsCount) adsCount.textContent = state.silverAdsWatched;
      if (adsTarget) adsTarget.textContent = '50';
    } else {
      if (emoji) {
        emoji.textContent = '🗝️';
        emoji.className = 'pass-header-burst golden-key-icon gold-pass-burst';
      }
      if (title) title.textContent = 'Unlock Gold VIP Pass';
      if (tag) tag.textContent = 'VIP PASS REQUIRED';
      if (desc) desc.textContent = 'Get permanent access to the Gold Vault with royal rewards!';
      if (perks) {
        perks.innerHTML = `
          <div class="perk-item">👑 Permanent Gold Vault & Chest Access</div>
          <div class="perk-item">💰 Drop Pools: 10 Coins, 1 Silver Key, or 10 Bronze Keys</div>
          <div class="perk-item">⚡ Royal Drop Luck Multipliers</div>
          <div class="perk-item">👑 Maximum Coin & Key Rewards</div>
        `;
      }
      if (btnStarsText) btnStarsText.textContent = '⭐ 1,000 Telegram Stars';
      if (adsCount) adsCount.textContent = state.goldenAdsWatched;
      if (adsTarget) adsTarget.textContent = '100';
    }

    modal.classList.add('active', 'open');
    triggerHaptic('warning');
  }

  function closePassModal() {
    const modal = document.getElementById('passModal');
    if (modal) modal.classList.remove('active', 'open');
    sound.playClick();
    triggerHaptic('light');
  }

  function switchTab(tabKey) {
    if (!tabKey) return;

    // VIP Pass Verification: Gated Silver & Gold Pages
    if (tabKey === 'silver' && !state.hasSilverPass) {
      sound.playClick();
      triggerHaptic('warning');
      showToast('🥈 Silver VIP Pass Required!');
      openPassModal('silver');
      // Keep on bronze tab
      switchTabDirect('free');
      return;
    }
    if (tabKey === 'golden' && !state.hasGoldenPass) {
      sound.playClick();
      triggerHaptic('warning');
      showToast('👑 Gold VIP Pass Required!');
      openPassModal('golden');
      // Keep on bronze tab
      switchTabDirect('free');
      return;
    }

    switchTabDirect(tabKey);
  }

  function switchTabDirect(tabKey) {
    sound.playClick();
    triggerHaptic('select');

    document.querySelectorAll('.tier-tab-btn').forEach(b => {
      const active = (b.dataset.tier === tabKey || b.dataset.tab === tabKey);
      b.classList.toggle('active', active);
    });

    document.querySelectorAll('.tab-page').forEach(p => {
      const active = (p.id === `page-${tabKey}` || (tabKey === 'bronze' && p.id === 'page-free') || (tabKey === 'free' && p.id === 'page-free') || (tabKey === 'bronze' && p.id === 'page-bronze'));
      p.classList.toggle('active', active);
    });

    const elHeaderKeyEmoji = document.getElementById('headerKeyEmoji');
    if (elHeaderKeyEmoji) {
      if (tabKey === 'bronze' || tabKey === 'free') {
        elHeaderKeyEmoji.className = 'header-key-emoji bronze-key-icon';
      } else if (tabKey === 'silver') {
        elHeaderKeyEmoji.className = 'header-key-emoji silver-key-icon';
      } else if (tabKey === 'golden') {
        elHeaderKeyEmoji.className = 'header-key-emoji golden-key-icon';
      }
    }
  }

  // --- REWARDED AD SIMULATOR (TELEGRAM PARTNER ADS) ---
  function startRewardedAd(rewardCallback) {
    sound.playClick();
    triggerHaptic('medium');
    activeAdRewardCallback = rewardCallback;

    const modal = document.getElementById('adPlayerModal') || document.getElementById('modalAd');
    const progressBar = document.getElementById('adProgressBar') || document.getElementById('adProgressFill');
    const countdownText = document.getElementById('adCountdownText') || document.getElementById('adCountdown');

    if (modal) modal.classList.add('active', 'open');
    if (progressBar) progressBar.style.width = '0%';

    let secondsLeft = 3;
    if (countdownText) countdownText.textContent = `Reward unlocking in ${secondsLeft}s...`;

    let progress = 0;
    const intervalTime = 100;
    const totalSteps = (secondsLeft * 1000) / intervalTime;

    clearInterval(adTimerInterval);
    adTimerInterval = setInterval(() => {
      progress++;
      const pct = Math.min(100, (progress / totalSteps) * 100);
      if (progressBar) progressBar.style.width = `${pct}%`;

      const currentSec = Math.max(0, Math.ceil(secondsLeft - (progress * intervalTime) / 1000));
      if (countdownText) countdownText.textContent = `Reward unlocking in ${currentSec}s...`;

      if (progress >= totalSteps) {
        clearInterval(adTimerInterval);
        triggerHaptic('success');
        sound.playCoinJingle();
        
        setTimeout(() => {
          if (modal) modal.classList.remove('active', 'open');
          if (typeof activeAdRewardCallback === 'function') {
            activeAdRewardCallback();
          }
          state.save();
          updateUI();
        }, 400);
      }
    }, intervalTime);
  }

  function claimAdReward() {
    const modal = document.getElementById('adPlayerModal') || document.getElementById('modalAd');
    if (modal) modal.classList.remove('active', 'open');
    sound.playCoinJingle();
    triggerHaptic('success');
    if (typeof activeAdRewardCallback === 'function') {
      activeAdRewardCallback();
    }
    state.save();
    updateUI();
  }

  // --- OPEN CHEST CINEMATIC SÉANCE RITUAL SEQUENCE ---
  async function executeChestOpen(tierKey, cardElem, tapEvt) {
    if (isOpening) return;

    // Validate 1 Key Requirement: If 0 keys, do NOT use/open chest!
    if (tierKey === 'bronze' || tierKey === 'free') {
      if ((state.keys.free || 0) < 1) {
        triggerHaptic('warning');
        sound.playRumble();
        if (cardElem) {
          cardElem.classList.add('chest-shake-empty');
          setTimeout(() => cardElem.classList.remove('chest-shake-empty'), 500);
        }
        return;
      }
      state.keys.free -= 1;
    } else if (tierKey === 'silver') {
      if ((state.keys.silver || 0) < 1) {
        triggerHaptic('warning');
        sound.playRumble();
        if (cardElem) {
          cardElem.classList.add('chest-shake-empty');
          setTimeout(() => cardElem.classList.remove('chest-shake-empty'), 500);
        }
        return;
      }
      state.keys.silver -= 1;
    } else if (tierKey === 'golden') {
      if ((state.keys.golden || 0) < 1) {
        triggerHaptic('warning');
        sound.playRumble();
        if (cardElem) {
          cardElem.classList.add('chest-shake-empty');
          setTimeout(() => cardElem.classList.remove('chest-shake-empty'), 500);
        }
        return;
      }
      state.keys.golden -= 1;
    }

    // 1 Key used -> Save and update live badge immediately
    state.save();
    isOpening = true;
    updateUI();

    if (tapEvt) {
      spawnTap(tapEvt.clientX || window.innerWidth / 2, tapEvt.clientY || window.innerHeight / 2, `✨ Opening Chest!`);
    }

    pendingChestPrize = rollDrop(tierKey);

    // Setup Cinematic Scene
    if (tierKey === 'bronze') {
      elSceneHeroEmoji.textContent = '🎁';
      if (elSceneHeroLock) elSceneHeroLock.textContent = '🗝️';
    } else if (tierKey === 'silver') {
      elSceneHeroEmoji.textContent = '💎';
      if (elSceneHeroLock) elSceneHeroLock.textContent = '🥈';
    } else {
      elSceneHeroEmoji.textContent = '👑';
      if (elSceneHeroLock) elSceneHeroLock.textContent = '👑';
    }

    elSceneStatusTitle.textContent = '✨ SÉANCE RITUAL INITIATED... ✨';
    elSceneChestHero.classList.remove('breaking');
    elCinematicScene.classList.add('active');

    triggerHaptic('heavy');
    sound.playRumble();

    await wait(600);
    elSceneStatusTitle.textContent = '🔥 BREAKING ANCIENT SEAL... 🔥';
    elSceneChestHero.classList.add('breaking');
    triggerHaptic('medium');

    await wait(800);
    sound.playOpenLid();
    if (elSceneHeroLock) {
      elSceneHeroLock.style.transform = 'scale(1.6) rotate(45deg)';
      elSceneHeroLock.style.opacity = '0';
    }
    elSceneStatusTitle.textContent = '⚡ CELESTIAL BURST UNLEASHED! ⚡';
    triggerHaptic('heavy');

    await wait(500);
    sound.playFanfare(pendingChestPrize.rarity);
    triggerHaptic('success');

    // Fade out scene and reveal loot popup
    elCinematicScene.classList.remove('active');
    await wait(300);
    if (elSceneHeroLock) {
      elSceneHeroLock.style.transform = '';
      elSceneHeroLock.style.opacity = '1';
    }
    elSceneChestHero.classList.remove('breaking');

    displayReveal([pendingChestPrize]);
    isOpening = false;
    updateUI();
  }

  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

  // --- WINNER CELEBRATION REVEAL MODAL (EXACT FROM SPINNER) ---
  function displayReveal(items) {
    const item = items[0] || { name: '10 Energy', emoji: '⚡', amount: 10 };
    const modal = document.getElementById('modalReveal');
    const iconBurst = document.getElementById('winnerIconBurst');
    const title = document.getElementById('winnerText');
    const desc = document.getElementById('winnerDesc');

    if (iconBurst) iconBurst.textContent = item.emoji;
    if (title) title.textContent = item.name;
    if (desc) desc.textContent = `🎉 You won +${item.amount} ${item.name}! Watch a short ad to claim.`;

    if (modal) modal.classList.add('active', 'open');
  }

  function closeReveal() {
    const modal = document.getElementById('modalReveal');
    if (modal) modal.classList.remove('active', 'open');
    sound.playClick();
    triggerHaptic('light');
  }

  function claimChestRewardWithAd() {
    if (!pendingChestPrize) {
      closeReveal();
      return;
    }

    closeReveal();

    startRewardedAd(() => {
      if (!pendingChestPrize) return;
      const item = pendingChestPrize;
      state.addItem(item);

      // Apply Reward to State
      if (item.type === 'energy') {
        state.energy = (state.energy || 0) + item.amount;
      } else if (item.type === 'keys_free') {
        state.keys.free += item.amount;
      } else if (item.type === 'keys_silver') {
        state.keys.silver += item.amount;
      } else if (item.type === 'coins') {
        state.coins = (state.coins || 0) + item.amount;
      } else if (item.type === 'xp') {
        state.xp = (state.xp || 0) + item.amount;
      }

      state.save();
      updateUI();
      triggerHaptic('success');
      sound.playCoinJingle();
      showToast(`🎉 Claimed +${item.amount} ${item.name}!`);
      pendingChestPrize = null;
    });
  }

  // --- KEY SHOP CONVERSIONS & AD HANDLERS ---
  function setupKeyShop() {
    // 1. Convert Buttons (Bronze to Silver, Bronze to Golden)
    // 1. Convert Buttons (Bronze to Silver, Bronze to Golden)
    document.querySelectorAll('.exchange-btn[data-convert]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cost = parseInt(btn.dataset.cost, 10);
        const costType = btn.dataset.costType; // 'free' = bronze
        const reward = parseInt(btn.dataset.reward, 10);
        const rewardType = btn.dataset.rewardType; // 'silver' or 'golden'

        const available = state.keys[costType] || 0;
        if (available < cost) {
          triggerHaptic('warning');
          showToast(`🗝️ Need ${cost} Bronze Keys (You have ${available})! Watch ads below.`);
          return;
        }

        // Direct instant key conversion connected to live balance
        state.keys[costType] -= cost;
        state.keys[rewardType] += reward;
        state.save();
        updateUI();
        triggerHaptic('success');
        sound.playCoinJingle();
        const targetIcon = rewardType === 'silver' ? '🥈 Silver Key' : '👑 Gold Key';
        showToast(`🎉 Converted ${cost} Bronze Keys ➔ +${reward} ${targetIcon}!`);
      });
    });

    // 2. Watch Ad for 2 Free Bronze Keys (Telegram Partner Ads)
    const shopAdBtn = document.getElementById('shopWatchAdBtn') || elShopWatchAdBtn;
    if (shopAdBtn) {
      shopAdBtn.addEventListener('click', () => {
        triggerHaptic('medium');
        startRewardedAd(() => {
          state.keys.free += 2;
          state.save();
          updateUI();
          triggerHaptic('success');
          sound.playCoinJingle();
          showToast('🎁 +2 Bronze Keys Added to Balance!');
        });
      });
    }
  }

  // --- SILVER PASS PURCHASE HANDLERS ---
  function buySilverWithStars() {
    if (state.starsBalance < 500) {
      triggerHaptic('warning');
      showToast('⭐️ Need 500 Telegram Stars!');
      return;
    }
    state.starsBalance -= 500;
    state.hasSilverPass = true;
    sound.playCoinJingle();
    triggerHaptic('success');
    showToast('🎉 Silver Pass Activated with 500 Stars! 🥈');
    elModalSilverPass.classList.remove('open');
    state.save();
    updateUI();
  }

  function watchAdForSilver() {
    startRewardedAd(() => {
      state.silverAdsWatched += 1;
      const countEl = document.getElementById('passAdsCount');
      if (countEl) countEl.textContent = state.silverAdsWatched;
      showToast(`📺 Ad watched! (${state.silverAdsWatched}/50 Ads)`);
      if (state.silverAdsWatched >= 50) {
        state.hasSilverPass = true;
        showToast('🎉 50 Ads Complete! Silver Pass Activated! 🥈');
        closePassModal();
        switchTabDirect('silver');
      }
      state.save();
      updateUI();
    });
  }

  // --- GOLDEN PASS PURCHASE HANDLERS ---
  function buyGoldenWithStars() {
    if (state.starsBalance < 1000) {
      triggerHaptic('warning');
      showToast('⭐️ Need 1,000 Telegram Stars!');
      return;
    }
    state.starsBalance -= 1000;
    state.hasGoldenPass = true;
    sound.playCoinJingle();
    triggerHaptic('success');
    showToast('🎉 Golden Pass Activated with 1,000 Stars! 👑');
    closePassModal();
    state.save();
    updateUI();
  }

  function watchAdForGolden() {
    startRewardedAd(() => {
      state.goldenAdsWatched += 1;
      const countEl = document.getElementById('passAdsCount');
      if (countEl) countEl.textContent = state.goldenAdsWatched;
      showToast(`📺 Ad watched! (${state.goldenAdsWatched}/100 Ads)`);
      if (state.goldenAdsWatched >= 100) {
        state.hasGoldenPass = true;
        showToast('🎉 100 Ads Complete! Golden Pass Activated! 👑');
        closePassModal();
        switchTabDirect('golden');
      }
      state.save();
      updateUI();
    });
  }

  // --- EVENT LISTENERS ---
  function setupEvents() {
    const btnTopBack = document.getElementById('btnTopBack') || elBtnCircleBack;
    if (btnTopBack) btnTopBack.addEventListener('click', handleBackAction);

    // 3 Tabs (Bronze / Silver / Golden)
    document.querySelectorAll('.tier-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTier = btn.dataset.tier || btn.dataset.tab;
        switchTab(targetTier);
      });
    });

    setupKeyShop();

    // Tap on any of the 3 chest cards on screen
    document.querySelectorAll('.chest-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const tier = card.dataset.tier === 'free' ? 'bronze' : card.dataset.tier;
        executeChestOpen(tier, card, e);
      });
    });

    // Lucky CTA Buttons (Pick random of the 3 on current page)
    if (elBtnOpenBronzeKey) {
      elBtnOpenBronzeKey.addEventListener('click', (e) => {
        const cards = document.querySelectorAll('#page-free .chest-card, #page-bronze .chest-card');
        const lucky = cards[Math.floor(Math.random() * cards.length)];
        executeChestOpen('bronze', lucky, e);
      });
    }

    if (elBtnOpenSilverMain) {
      elBtnOpenSilverMain.addEventListener('click', (e) => {
        const cards = document.querySelectorAll('#page-silver .chest-card');
        const lucky = cards[Math.floor(Math.random() * cards.length)];
        executeChestOpen('silver', lucky, e);
      });
    }

    if (elBtnTriggerSilverPassModal) {
      elBtnTriggerSilverPassModal.addEventListener('click', () => {
        sound.playClick();
        triggerHaptic('light');
        const passModal = document.getElementById('passModal') || elModalSilverPass;
        if (passModal) passModal.classList.add('active', 'open');
      });
    }

    if (elBtnOpenGoldenMain) {
      elBtnOpenGoldenMain.addEventListener('click', (e) => {
        const cards = document.querySelectorAll('#page-golden .chest-card');
        const lucky = cards[Math.floor(Math.random() * cards.length)];
        executeChestOpen('golden', lucky, e);
      });
    }

    if (elBtnTriggerGoldenPassModal) {
      elBtnTriggerGoldenPassModal.addEventListener('click', () => {
        sound.playClick();
        triggerHaptic('light');
        const passModal = document.getElementById('passModal') || elModalGoldenPass;
        if (passModal) passModal.classList.add('active', 'open');
      });
    }

    // Pass Modal Actions
    const buyPassWithStarsBtn = document.getElementById('buyPassWithStarsBtn');
    if (buyPassWithStarsBtn) {
      buyPassWithStarsBtn.addEventListener('click', () => {
        if (activePassTier === 'silver') {
          buySilverWithStars();
          if (state.hasSilverPass) {
            closePassModal();
            switchTabDirect('silver');
          }
        } else {
          buyGoldenWithStars();
          if (state.hasGoldenPass) {
            closePassModal();
            switchTabDirect('golden');
          }
        }
      });
    }

    const buyPassWithAdsBtn = document.getElementById('buyPassWithAdsBtn');
    if (buyPassWithAdsBtn) {
      buyPassWithAdsBtn.addEventListener('click', () => {
        if (activePassTier === 'silver') {
          watchAdForSilver();
        } else {
          watchAdForGolden();
        }
      });
    }

    const closePassModalBtn = document.getElementById('closePassModalBtn');
    if (closePassModalBtn) {
      closePassModalBtn.addEventListener('click', closePassModal);
    }

    // Ad & Reveal
    if (elBtnClaimAdReward) elBtnClaimAdReward.addEventListener('click', claimAdReward);
    const claimBtn = document.getElementById('btnClaimLoot') || elBtnClaimLoot;
    if (claimBtn) claimBtn.addEventListener('click', claimChestRewardWithAd);

    // Backdrop click
    document.querySelectorAll('.tma-modal-backdrop, .modal-overlay').forEach(b => {
      b.addEventListener('click', (e) => {
        if (e.target === b && b !== elModalAd && b.id !== 'adPlayerModal') b.classList.remove('open', 'active');
      });
    });
  }

  // --- INITIALIZE ---
  function init() {
    initBgCanvas();
    setupEvents();
    updateUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
