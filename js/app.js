/* ═══════════════════════════════════════════════════════════
   TAP EMPIRE — Core Gameplay Engine (js/app.js)
   • Game State Engine & State Persistence
   • Central Web Audio API Procedural SFX & Telegram Haptics
   • Tap Engine: Touch Ripples, Scale Bounce, Floating Text (+COINS, +XP)
   • Combo System & SVG Progress Ring Animation
   • Ambient Canvas Particle Background Engine
═══════════════════════════════════════════════════════════ */

'use strict';

/* ── GAME STATE & EMOJI DROPS ── */
const DROP_EMOJIS = ['💎', '👑', '⭐', '💰', '🚀', '⚡', '🏆', '🔮', '🗝️', '🍀'];

const BOOST_DEFINITIONS = [
  { id: 'tapPower', icon: '👆', name: 'TAP MULTIPLIER', desc: 'Increases Goal Progress points earned per tap (+1X)', cat: 'tap', baseCost: 500, costGrowth: 1.5, durationSec: 600 },
  { id: 'energySpeed', icon: '⚡', name: 'ENERGY REGEN SPEED', desc: 'Speeds up passive energy regeneration (+0.05 ⚡/sec)', cat: 'energy', baseCost: 750, costGrowth: 1.6, durationSec: 900 },
  { id: 'spinBoost', icon: '🎡', name: 'SPIN MASTER BOOST', desc: 'Grants bonus spin tickets on Goal completion (+1)', cat: 'rewards', baseCost: 1000, costGrowth: 1.7, durationSec: 1200 },
  { id: 'keyBoost', icon: '🔑', name: 'KEY MASTER BOOST', desc: 'Increases Master Key drop frequency from goals', cat: 'rewards', baseCost: 1200, costGrowth: 1.8, durationSec: 1200 },
  { id: 'comboBoost', icon: '🔥', name: 'COMBO STREAK BOOST', desc: 'Extends combo reset duration window (+1.0 sec)', cat: 'tap', baseCost: 600, costGrowth: 1.5, durationSec: 600 },
  { id: 'superCharger', icon: '🚀', name: 'SUPER CHARGER', desc: 'Global 2X multiplier on all game rewards', cat: 'rewards', baseCost: 2500, costGrowth: 2.0, durationSec: 1800 }
];

let _activeBoostFilter = 'all';

const STATE = {
  coins: 0,
  energy: 500,
  maxEnergy: 500,
  level: 1,
  xp: 0,
  xpNeeded: 100,
  combo: 1,
  continuousTaps: 0,
  comboTimer: null,
  comboMax: 4,
  tapPower: 1,
  coinsPerTap: 1,
  genRate: 0.1,
  activeGenSlots: 3,
  boostLevels: {
    tapPower: 1,
    energySpeed: 1,
    spinBoost: 1,
    keyBoost: 1,
    comboBoost: 1,
    superCharger: 1
  },
  boostExpiries: {},
  boostAdCount: {},
  goals: {
    level: 1,
    coinsTarget: 30,
    coinsProgress: 0,
    coinsReward: 5,
    keysTarget: 50,
    keysProgress: 0,
    keysReward: 1,
    spinsTarget: 20,
    spinsProgress: 0,
    spinsReward: 1,
    keysBalance: 0,
    ticketsBalance: 0,
    claimed: { coins: false, keys: false, spins: false }
  },
  activeTaskTab: 'daily',
  activeHomeMode: 'wheel',
  wheelAngle: 0,
  tasksProgress: {},
  claimedTasks: {},
  claimedXPLevels: {},
  unclaimedXPLevels: [],
  settings: {
    sound: true,
    haptic: true
  }
};

/* ── FORMAT NUMBER HELPER ── */
function fmt(num) {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return Math.floor(num).toLocaleString();
}

/* ── WEB AUDIO API SFX ENGINE ── */
let _audioCtx = null;
let _lastTapSoundTs = 0;

function _getCtx() {
  if (!_audioCtx) {
    try {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (_) { return null; }
  }
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}

function playTone(freq, type = 'sine', dur = 0.08, vol = 0.1) {
  if (!STATE.settings.sound) return;
  const ctx = _getCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
  } catch (_) {}
}

const SFX = {
  tap() {
    const now = Date.now();
    if (now - _lastTapSoundTs < 70) return;
    _lastTapSoundTs = now;
    playTone(880, 'sine', 0.07, 0.09);
  },
  combo() { playTone(660, 'triangle', 0.12, 0.11); },
  collect() { playTone(528, 'sine', 0.18, 0.13); playTone(792, 'sine', 0.12, 0.09); },
  levelUp() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, 'sine', 0.25, 0.17), i * 110)); }
};

/* ── TELEGRAM HAPTIC FEEDBACK ── */
function haptic(type = 'light') {
  if (!STATE.settings.haptic) return;
  try {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      const h = window.Telegram.WebApp.HapticFeedback;
      if (type === 'selection') h.selectionChanged();
      else if (['success', 'warning', 'error'].includes(type)) h.notificationOccurred(type);
      else h.impactOccurred(type);
    }
  } catch (_) {}
}

/* ── TOAST SYSTEM ── */
let _toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
}

/* ── UI SYNCHRONIZER ── */
function updateUI() {
  const coinsEl = document.getElementById('top-coins');
  const energyEl = document.getElementById('top-energy');
  const energyTxtEl = document.getElementById('energy-val-txt');
  const energyFillEl = document.getElementById('energy-bar-fill');
  const comboEl = document.getElementById('combo-badge');
  const ringFillEl = document.getElementById('combo-ring-fill');

  if (coinsEl) coinsEl.textContent = fmt(STATE.coins);
  if (energyEl) energyEl.textContent = `${Math.floor(STATE.energy)}`;
  if (energyTxtEl) energyTxtEl.textContent = `${Math.floor(STATE.energy)} ⚡`;
  
  if (energyFillEl) energyFillEl.style.width = '100%';

  // 100-LEVEL XP CALCULATION & UI UPDATES
  const currentLvl = STATE.level || 1;
  const xpNeeded = getXPNeededForLevel(currentLvl);
  const currentXP = Number((STATE.xp || 0).toFixed(1));
  const xpPct = Math.min(100, Math.max(0, (currentXP / xpNeeded) * 100));

  const userLevelBadge = document.getElementById('user-level-badge');
  const userName = document.getElementById('user-name');
  const xpFillEl = document.getElementById('xp-fill');

  if (userLevelBadge) userLevelBadge.textContent = `LV. ${currentLvl}/100`;
  if (userName) userName.textContent = `⭐ LVL ${currentLvl} / 100`;
  if (xpFillEl) xpFillEl.style.width = xpPct + '%';

  // Home Screen Circular Rectangle XP Card Updates
  const xpHomeLevelTitle = document.getElementById('xp-home-level-title');
  const xpHomeBarFill = document.getElementById('xp-home-bar-fill');
  const xpHomeValText = document.getElementById('xp-home-val-text');

  if (xpHomeLevelTitle) xpHomeLevelTitle.textContent = `LEVEL ${currentLvl} / 100`;
  if (xpHomeBarFill) xpHomeBarFill.style.width = xpPct + '%';
  if (xpHomeValText) xpHomeValText.textContent = `${currentXP} / ${xpNeeded} XP`;

  // XP Modal Page Header Updates
  const xpModalHeroLvl = document.getElementById('xp-modal-hero-lvl');
  const xpModalBarFill = document.getElementById('xp-modal-bar-fill');
  const xpModalValTxt = document.getElementById('xp-modal-val-txt');

  if (xpModalHeroLvl) xpModalHeroLvl.textContent = `LEVEL ${currentLvl} / 100`;
  if (xpModalBarFill) xpModalBarFill.style.width = xpPct + '%';
  if (xpModalValTxt) xpModalValTxt.textContent = `${currentXP} / ${xpNeeded} XP`;

  // 🔴 Red Notification Dot Toggle Logic
  STATE.unclaimedXPLevels = STATE.unclaimedXPLevels || [];
  const hasUnclaimedXP = STATE.unclaimedXPLevels.length > 0;
  const xpTopRedDot = document.getElementById('xp-top-red-dot');
  const xpHomeRedDot = document.getElementById('xp-home-red-dot');
  const xpHomeBtnBadge = document.getElementById('xp-home-btn-badge');

  if (xpTopRedDot) xpTopRedDot.classList.toggle('hidden', !hasUnclaimedXP);
  if (xpHomeRedDot) xpHomeRedDot.classList.toggle('hidden', !hasUnclaimedXP);
  if (xpHomeBtnBadge) {
    if (hasUnclaimedXP) {
      xpHomeBtnBadge.textContent = `🎁 CLAIM REWARD (${STATE.unclaimedXPLevels.length}) 🔴`;
      xpHomeBtnBadge.style.background = '#EF4444';
      xpHomeBtnBadge.style.color = '#FFF';
    } else {
      xpHomeBtnBadge.textContent = `100 LEVELS ➔`;
      xpHomeBtnBadge.style.background = 'var(--gold)';
      xpHomeBtnBadge.style.color = '#000';
    }
  }

  let nextThreshold = 10;
  if (STATE.combo === 2) nextThreshold = 40;
  else if (STATE.combo === 3) nextThreshold = 100;

  if (comboEl) {
    if (STATE.combo >= 4) {
      comboEl.textContent = `🔥 MAX x4 COMBO (${STATE.continuousTaps} TAPS)`;
    } else {
      comboEl.textContent = `🔥 x${STATE.combo} COMBO (${STATE.continuousTaps}/${nextThreshold} TAPS)`;
    }
  }

  if (ringFillEl) {
    const totalStroke = 640;
    const comboPct = Math.min(1, STATE.continuousTaps / nextThreshold);
    const offset = totalStroke - (totalStroke * comboPct);
    ringFillEl.style.strokeDashoffset = offset;
  }

  /* 🎯 GOAL TRACKER (3 CIRCULAR SECTION CARDS) UI UPDATES */
  const gTitleEl = document.getElementById('goal-level-title');
  const badgeKeysEl = document.getElementById('badge-keys');
  const badgeTicketsEl = document.getElementById('badge-tickets');

  if (gTitleEl) gTitleEl.textContent = `GOAL LEVEL ${STATE.goals.level}`;
  if (badgeKeysEl) badgeKeysEl.textContent = `🔑 ${STATE.goals.keysBalance} Keys`;
  if (badgeTicketsEl) badgeTicketsEl.textContent = `🎟️ ${STATE.goals.ticketsBalance} Spins`;

  const modeTicketsBadge = document.getElementById('mode-tickets-badge');
  const modeKeysBadge = document.getElementById('mode-keys-badge');
  if (modeTicketsBadge) modeTicketsBadge.textContent = `🎟️ ${STATE.goals.ticketsBalance} Tickets Left`;
  if (modeKeysBadge) modeKeysBadge.textContent = `🔑 ${STATE.goals.keysBalance} Keys Left`;

  const sqTicketsText = document.getElementById('sq-tickets-text');
  const sqKeysText = document.getElementById('sq-keys-text');
  if (sqTicketsText) sqTicketsText.textContent = `🎟️ ${STATE.goals.ticketsBalance || 0} Tickets Available`;
  if (sqKeysText) sqKeysText.textContent = `🔑 ${STATE.goals.keysBalance || 0} Keys Available`;

  const totalStroke = 126; // SVG r=20 circumference = 2 * PI * 20 ≈ 125.6

  // Determine completion status of all 3 goals
  const coinsDone = STATE.goals.coinsProgress >= STATE.goals.coinsTarget;
  const keysDone = STATE.goals.keysProgress >= STATE.goals.keysTarget;
  const spinsDone = STATE.goals.spinsProgress >= STATE.goals.spinsTarget;

  let completedCount = 0;
  if (coinsDone) completedCount++;
  if (keysDone) completedCount++;
  if (spinsDone) completedCount++;

  const allThreeCompleted = completedCount === 3;

  if (!STATE.goals.claimed) STATE.goals.claimed = { coins: false, keys: false, spins: false };

  // 1. Coins Goal Card
  const gCoinsVal = document.getElementById('goal-coins-val');
  const gCoinsRew = document.getElementById('goal-coins-rew');
  const ringCoinsFill = document.getElementById('ring-coins-fill');
  const btnClaimCoins = document.getElementById('btn-claim-coins');

  const coinsPct = Math.min(100, (STATE.goals.coinsProgress / STATE.goals.coinsTarget) * 100);
  if (ringCoinsFill) ringCoinsFill.style.strokeDashoffset = totalStroke - (totalStroke * (coinsPct / 100));

  if (coinsDone) {
    if (gCoinsVal) gCoinsVal.textContent = `100% DONE! 🎉`;
    if (gCoinsRew) gCoinsRew.textContent = `+${fmt(STATE.goals.coinsReward)} Coins`;
  } else {
    if (gCoinsVal) gCoinsVal.textContent = `${STATE.goals.coinsProgress} / ${STATE.goals.coinsTarget}`;
    if (gCoinsRew) gCoinsRew.textContent = `+${fmt(STATE.goals.coinsReward)} Coins`;
  }

  if (btnClaimCoins) {
    if (STATE.goals.claimed.coins) {
      btnClaimCoins.disabled = true;
      btnClaimCoins.className = 'btn-goal-card-claim disabled-lock';
      btnClaimCoins.textContent = '✅ CLAIMED';
    } else if (allThreeCompleted) {
      btnClaimCoins.disabled = false;
      btnClaimCoins.className = 'btn-goal-card-claim ready-green';
      btnClaimCoins.textContent = '🎁 CLAIM';
    } else {
      btnClaimCoins.disabled = true;
      btnClaimCoins.className = 'btn-goal-card-claim disabled-lock';
      btnClaimCoins.textContent = `🔒 (${completedCount}/3)`;
    }
  }

  // 2. Key Goal Card
  const gKeysVal = document.getElementById('goal-keys-val');
  const gKeysRew = document.getElementById('goal-keys-rew');
  const ringKeysFill = document.getElementById('ring-keys-fill');
  const btnClaimKeys = document.getElementById('btn-claim-keys');

  const keysPct = Math.min(100, (STATE.goals.keysProgress / STATE.goals.keysTarget) * 100);
  if (ringKeysFill) ringKeysFill.style.strokeDashoffset = totalStroke - (totalStroke * (keysPct / 100));

  if (keysDone) {
    if (gKeysVal) gKeysVal.textContent = `100% DONE! 🎉`;
    if (gKeysRew) gKeysRew.textContent = `+${STATE.goals.keysReward} Key`;
  } else {
    if (gKeysVal) gKeysVal.textContent = `${STATE.goals.keysProgress} / ${STATE.goals.keysTarget}`;
    if (gKeysRew) gKeysRew.textContent = `+${STATE.goals.keysReward} Key`;
  }

  if (btnClaimKeys) {
    if (STATE.goals.claimed.keys) {
      btnClaimKeys.disabled = true;
      btnClaimKeys.className = 'btn-goal-card-claim disabled-lock';
      btnClaimKeys.textContent = '✅ CLAIMED';
    } else if (allThreeCompleted) {
      btnClaimKeys.disabled = false;
      btnClaimKeys.className = 'btn-goal-card-claim ready-green';
      btnClaimKeys.textContent = '🎁 CLAIM';
    } else {
      btnClaimKeys.disabled = true;
      btnClaimKeys.className = 'btn-goal-card-claim disabled-lock';
      btnClaimKeys.textContent = `🔒 (${completedCount}/3)`;
    }
  }

  // 3. Spin Goal Card
  const gSpinsVal = document.getElementById('goal-spins-val');
  const gSpinsRew = document.getElementById('goal-spins-rew');
  const ringSpinsFill = document.getElementById('ring-spins-fill');
  const btnClaimSpins = document.getElementById('btn-claim-spins');

  const spinsPct = Math.min(100, (STATE.goals.spinsProgress / STATE.goals.spinsTarget) * 100);
  if (ringSpinsFill) ringSpinsFill.style.strokeDashoffset = totalStroke - (totalStroke * (spinsPct / 100));

  if (spinsDone) {
    if (gSpinsVal) gSpinsVal.textContent = `100% DONE! 🎉`;
    if (gSpinsRew) gSpinsRew.textContent = `+${STATE.goals.spinsReward} Ticket`;
  } else {
    if (gSpinsVal) gSpinsVal.textContent = `${STATE.goals.spinsProgress} / ${STATE.goals.spinsTarget}`;
    if (gSpinsRew) gSpinsRew.textContent = `+${STATE.goals.spinsReward} Ticket`;
  }

  if (btnClaimSpins) {
    if (STATE.goals.claimed.spins) {
      btnClaimSpins.disabled = true;
      btnClaimSpins.className = 'btn-goal-card-claim disabled-lock';
      btnClaimSpins.textContent = '✅ CLAIMED';
    } else if (allThreeCompleted) {
      btnClaimSpins.disabled = false;
      btnClaimSpins.className = 'btn-goal-card-claim ready-green';
      btnClaimSpins.textContent = '🎁 CLAIM';
    } else {
      btnClaimSpins.disabled = true;
      btnClaimSpins.className = 'btn-goal-card-claim disabled-lock';
      btnClaimSpins.textContent = `🔒 (${completedCount}/3)`;
    }
  }
}

/* ── 🎯 GOAL CARD CLAIM & LEVEL ADVANCEMENT ENGINE ── */
function claimGoalCard(type) {
  if (!STATE.goals.claimed) STATE.goals.claimed = { coins: false, keys: false, spins: false };

  const coinsDone = STATE.goals.coinsProgress >= STATE.goals.coinsTarget;
  const keysDone = STATE.goals.keysProgress >= STATE.goals.keysTarget;
  const spinsDone = STATE.goals.spinsProgress >= STATE.goals.spinsTarget;
  const allThreeCompleted = coinsDone && keysDone && spinsDone;

  if (!allThreeCompleted) {
    showToast(`🔒 Complete all 3 goals (3/3) to unlock claiming!`);
    return;
  }

  if (STATE.goals.claimed[type]) {
    showToast(`✅ Already claimed!`);
    return;
  }

  // Mark as claimed & award reward
  STATE.goals.claimed[type] = true;

  if (type === 'coins') {
    STATE.coins += STATE.goals.coinsReward;
    showToast(`💰 Claimed +${fmt(STATE.goals.coinsReward)} Coins!`);
  } else if (type === 'keys') {
    STATE.goals.keysBalance = (STATE.goals.keysBalance || 0) + STATE.goals.keysReward;
    showToast(`🔑 Claimed +${STATE.goals.keysReward} Master Key!`);
  } else if (type === 'spins') {
    STATE.goals.ticketsBalance = (STATE.goals.ticketsBalance || 0) + STATE.goals.spinsReward;
    showToast(`🎟️ Claimed +${STATE.goals.spinsReward} Spin Ticket!`);
  }

  SFX.collect();
  haptic('success');

  // Check if ALL 3 CLAIMS ARE NOW COMPLETED
  if (STATE.goals.claimed.coins && STATE.goals.claimed.keys && STATE.goals.claimed.spins) {
    // 🚀 ALL 3 CLAIMS COMPLETED! ADVANCE GOAL LEVEL & POP UP WIN SCRATCH CARD USING ADS!
    STATE.goals.level += 1;

    // Reset progress & scale up targets for next level
    STATE.goals.coinsProgress = 0;
    STATE.goals.keysProgress = 0;
    STATE.goals.spinsProgress = 0;

    STATE.goals.coinsTarget = Math.floor(STATE.goals.coinsTarget * 1.35) + 10;
    STATE.goals.coinsReward = Math.floor(STATE.goals.coinsReward * 1.25) + 2;

    STATE.goals.keysTarget = Math.floor(STATE.goals.keysTarget * 1.4) + 15;
    STATE.goals.spinsTarget = Math.floor(STATE.goals.spinsTarget * 1.3) + 10;

    STATE.goals.claimed = { coins: false, keys: false, spins: false };

    showToast(`🎉 GOAL LEVEL ${STATE.goals.level - 1} COMPLETED! ADVANCING TO LEVEL ${STATE.goals.level}!`);
    createConfettiBurst();

    // Trigger Win Scratch Card Popup Modal using Ads
    setTimeout(() => {
      openScratchCardModal();
    }, 600);
  }

  if (typeof saveUserDataToFirebase === 'function') {
    saveUserDataToFirebase(STATE);
  }

  updateUI();
}

/* ── 🎫 4 SCRATCH CARD TYPES DEFINITIONS ── */
let _activeScratchType = 'wooden';

const SCRATCH_DEFINITIONS = {
  wooden: {
    name: '🪵 WOODEN SCRATCH CARD',
    desc: 'Watch a quick ad to scratch for 5-10⚡ energy & 15K coins!',
    coins: 15000, keys: 1, tickets: 2, energy: 10,
    text: '💰 +15,000 Coins, 🔑 +1 Key & ⚡ +10 Energy!'
  },
  silver: {
    name: '🥈 SILVER SCRATCH CARD',
    desc: 'Watch a quick ad to scratch for 50K coins & 3 tickets!',
    coins: 50000, keys: 2, tickets: 3, energy: 25,
    text: '💰 +50,000 Coins, 🔑 +2 Keys & 🎟️ +3 Tickets!'
  },
  golden: {
    name: '🥇 GOLDEN SCRATCH CARD',
    desc: 'Watch a quick ad to scratch for 250K coins & 5 keys!',
    coins: 250000, keys: 5, tickets: 5, energy: 75,
    text: '💰 +250,000 Coins, 🔑 +5 Keys & 🎟️ +5 Tickets!'
  },
  jackpot: {
    name: '💎 JACKPOT SCRATCH CARD',
    desc: 'Watch a quick ad to scratch for up to 1 MILLION COINS!',
    coins: 1000000, keys: 10, tickets: 10, energy: 100,
    text: '💎 1,000,000 COINS, 🔑 +10 Keys & 🎟️ +10 Tickets!'
  }
};

function selectScratchCardType(type) {
  if (!SCRATCH_DEFINITIONS[type]) return;
  _activeScratchType = type;

  document.querySelectorAll('.spinner-type-btn').forEach(btn => {
    if (btn.id.startsWith('sctype-')) {
      btn.classList.toggle('active', btn.id === `sctype-${type}`);
    }
  });

  const config = SCRATCH_DEFINITIONS[type];
  const subDesc = document.getElementById('scratch-sub-desc');
  if (subDesc) subDesc.textContent = config.desc;

  haptic('selection');
}

/* ── 🎫 SCRATCH CARD POPUP MODAL ENGINE ── */
async function openScratchCardModal() {
  const modal = document.getElementById('scratch-card-modal');
  const loadingOverlay = document.getElementById('scratch-loading-overlay');
  const lvlBadge = document.getElementById('scratch-modal-lvl-badge');
  const surface = document.getElementById('scratch-card-surface');
  const revealedLoot = document.getElementById('scratch-revealed-loot');
  const btnAction = document.getElementById('btn-scratch-ad-action');

  if (!modal) return;
  modal.classList.add('active');
  if (loadingOverlay) loadingOverlay.classList.remove('hidden');

  haptic('selection');

  // Sync latest state from Firebase Realtime Database
  if (typeof loadUserDataFromFirebase === 'function') {
    const saved = await loadUserDataFromFirebase();
    if (saved && saved.goals) {
      STATE.goals = { ...STATE.goals, ...saved.goals };
    }
  }

  const prevLvl = Math.max(1, (STATE.goals.level || 2) - 1);
  if (lvlBadge) lvlBadge.textContent = `GOAL LEVEL ${prevLvl} COMPLETE! 🎉`;
  if (surface) surface.classList.remove('hidden');
  if (revealedLoot) revealedLoot.classList.add('hidden');

  if (btnAction) {
    btnAction.disabled = false;
    btnAction.textContent = '🎥 WATCH AD TO SCRATCH & CLAIM!';
    btnAction.onclick = () => openMonetagAdModal('scratch_card');
  }

  selectScratchCardType(_activeScratchType || 'wooden');

  setTimeout(() => {
    if (loadingOverlay) loadingOverlay.classList.add('hidden');
  }, 400);
}

function closeScratchCardModal() {
  const modal = document.getElementById('scratch-card-modal');
  if (modal) modal.classList.remove('active');
}

/* ── 🎡 SPIN WHEEL & 🧰 MYSTERY CHEST MODAL & ACTION ENGINE ── */
async function openSpinWheelModal() {
  const modal = document.getElementById('spin-wheel-modal');
  const loadingOverlay = document.getElementById('spin-loading-overlay');

  if (modal) modal.classList.add('active');
  if (loadingOverlay) loadingOverlay.classList.remove('hidden');

  haptic('selection');

  // Sync latest spin tickets & wheel state from Firebase Realtime Database
  if (typeof loadUserDataFromFirebase === 'function') {
    const saved = await loadUserDataFromFirebase();
    if (saved && saved.goals) {
      STATE.goals = { ...STATE.goals, ...saved.goals };
    }
  }

  updateUI();
  selectSpinnerType(_activeSpinnerType || 'normal');

  setTimeout(() => {
    if (loadingOverlay) loadingOverlay.classList.add('hidden');
  }, 400);
}

function closeSpinWheelModal() {
  const modal = document.getElementById('spin-wheel-modal');
  if (modal) modal.classList.remove('active');
}

async function openMysteryChestModal() {
  const modal = document.getElementById('mystery-chest-modal');
  const loadingOverlay = document.getElementById('chest-loading-overlay');

  if (modal) modal.classList.add('active');
  if (loadingOverlay) loadingOverlay.classList.remove('hidden');

  haptic('selection');

  // Sync latest master keys & chest state from Firebase Realtime Database
  if (typeof loadUserDataFromFirebase === 'function') {
    const saved = await loadUserDataFromFirebase();
    if (saved && saved.goals) {
      STATE.goals = { ...STATE.goals, ...saved.goals };
    }
  }

  updateUI();
  selectChestType(_activeChestType || 'wooden');

  setTimeout(() => {
    if (loadingOverlay) loadingOverlay.classList.add('hidden');
  }, 400);
}

function closeMysteryChestModal() {
  const modal = document.getElementById('mystery-chest-modal');
  if (modal) modal.classList.remove('active');
}

function handleCardEnterWithAd(mode) {
  if (mode === 'wheel') openSpinWheelModal();
  else if (mode === 'chest') openMysteryChestModal();
  else if (mode === 'scratch') openScratchCardModal();
}

/* ── 🧰 4 CHEST TYPES & LOOT TABLE DEFINITIONS ── */
let _activeChestType = 'wooden';

const CHEST_DEFINITIONS = {
  wooden: {
    name: '🪵 WOODEN CHEST',
    desc: 'Tap the wooden chest to unlock 5-10⚡ energy & 15K coins!',
    costText: '🧰 OPEN WOODEN CHEST (1 🔑 KEY)',
    keyCost: 1,
    lootTable: [
      { energy: 8, coins: 5000, name: '⚡ +8 Energy & 💰 5,000 Coins' },
      { coins: 10000, keys: 1, name: '💰 10,000 Coins & 🔑 +1 Key' },
      { energy: 10, coins: 15000, name: '⚡ +10 Energy & 💰 15,000 Coins' }
    ]
  },
  silver: {
    name: '🥈 SILVER CHEST',
    desc: 'Tap the silver chest for 15-30⚡ energy, 50K coins & tickets!',
    costText: '🧰 OPEN SILVER CHEST (2 🔑 KEYS)',
    keyCost: 2,
    lootTable: [
      { energy: 25, coins: 25000, name: '⚡ +25 Energy & 💰 25,000 Coins' },
      { coins: 50000, tickets: 3, name: '💰 50,000 Coins & 🎟️ +3 Tickets' },
      { keys: 2, tickets: 3, name: '🔑 +2 Keys & 🎟️ +3 Tickets' }
    ]
  },
  golden: {
    name: '🥇 GOLDEN CHEST',
    desc: 'Tap the golden chest for 50-100⚡ energy, 250K coins & 5 keys!',
    costText: '🧰 OPEN GOLDEN CHEST (5 🔑 KEYS)',
    keyCost: 5,
    lootTable: [
      { energy: 75, coins: 100000, name: '⚡ +75 Energy & 💰 100,000 Coins' },
      { coins: 250000, keys: 5, name: '💰 250,000 Coins & 🔑 +5 Keys' },
      { tickets: 5, keys: 5, name: '🎟️ +5 Tickets & 🔑 +5 Keys' }
    ]
  },
  jackpot: {
    name: '💎 JACKPOT CHEST',
    desc: 'Tap the jackpot chest for up to 2 MILLION COINS & +10 KEYS!',
    costText: '🧰 OPEN JACKPOT CHEST (10 🔑 KEYS)',
    keyCost: 10,
    lootTable: [
      { coins: 500000, keys: 5, tickets: 5, name: '💰 500,000 Coins, 🔑 +5 Keys & 🎟️ +5 Tickets' },
      { coins: 1000000, keys: 10, name: '💎 1,000,000 COINS & 🔑 +10 KEYS!' },
      { coins: 2000000, keys: 10, tickets: 10, name: '💎 2 MILLION COINS JACKPOT & +10 KEYS!' }
    ]
  }
};

function selectChestType(type) {
  if (!CHEST_DEFINITIONS[type]) return;
  _activeChestType = type;

  document.querySelectorAll('.spinner-type-btn').forEach(btn => {
    if (btn.id.startsWith('ctype-')) {
      btn.classList.toggle('active', btn.id === `ctype-${type}`);
    }
  });

  const config = CHEST_DEFINITIONS[type];
  const subDesc = document.getElementById('chest-sub-desc');
  const chestBtn = document.getElementById('btn-chest-open');

  if (subDesc) subDesc.textContent = config.desc;
  if (chestBtn) chestBtn.textContent = config.costText;

  haptic('selection');
}

/* ── 🧰 MYSTERY CHEST INTERACTIVE ACTION ── */
let _isChestOpening = false;
function openChestAction() {
  if (_isChestOpening) return;

  const cDef = CHEST_DEFINITIONS[_activeChestType] || CHEST_DEFINITIONS.wooden;
  const keys = STATE.goals.keysBalance || 0;

  if (keys < cDef.keyCost) {
    haptic('warning');
    showToast(`🔑 Out of Master Keys! Needs ${cDef.keyCost} Keys.`);
    return;
  }

  STATE.goals.keysBalance -= cDef.keyCost;
  _isChestOpening = true;

  const chestEmoji = document.getElementById('chest-emoji-box');
  const chestBtn = document.getElementById('btn-chest-open');

  if (chestBtn) chestBtn.disabled = true;
  if (chestEmoji) chestEmoji.classList.add('opening-shake');

  SFX.combo();
  haptic('medium');

  setTimeout(() => {
    if (chestEmoji) {
      chestEmoji.classList.remove('opening-shake');
      chestEmoji.textContent = '🎁';
    }

    _isChestOpening = false;
    if (chestBtn) chestBtn.disabled = false;

    const loot = cDef.lootTable[Math.floor(Math.random() * cDef.lootTable.length)];

    if (loot.energy) STATE.energy = Math.min(STATE.maxEnergy, STATE.energy + loot.energy);
    if (loot.coins) STATE.coins += loot.coins;
    if (loot.keys) STATE.goals.keysBalance += loot.keys;
    if (loot.tickets) STATE.goals.ticketsBalance += loot.tickets;

    SFX.collect();
    haptic('success');
    createConfettiBurst();
    showToast(`🎉 UNLOCKED CHEST! Won ${loot.name}!`);

    setTimeout(() => {
      if (chestEmoji) chestEmoji.textContent = '🧰';
    }, 2000);

    if (typeof saveUserDataToFirebase === 'function') {
      saveUserDataToFirebase(STATE);
    }

    updateUI();
  }, 1200);
}

/* ── 🎡 4 SPINNER TYPES & SLICE DEFINITIONS ── */
let _activeSpinnerType = 'normal';

const SPINNER_DEFINITIONS = {
  normal: {
    name: '🥉 NORMAL SPINNER',
    desc: 'Spin the wheel to win energy (5-10⚡), coins, and keys!',
    costText: '🎡 SPIN WHEEL (1 🎟️ TICKET)',
    ticketCost: 1,
    prizes: [
      { type: 'energy', min: 5, max: 10, label: '⚡ 5-10', name: '⚡ Energy' },
      { type: 'coins', val: 1000, label: '💰 1K', name: '💰 1,000 Coins' },
      { type: 'keys', val: 1, label: '🔑 +1', name: '🔑 +1 Master Key' },
      { type: 'energy', min: 5, max: 10, label: '⚡ 5-10', name: '⚡ Energy' },
      { type: 'coins', val: 5000, label: '💰 5K', name: '💰 5,000 Coins' },
      { type: 'tickets', val: 1, label: '🎟️ +1', name: '🎟️ +1 Spin Ticket' }
    ],
    svgSlices: [
      { color: '#22C55E', text: '⚡ 5-10' },
      { color: '#F5B700', text: '💰 1K' },
      { color: '#00F0FF', text: '🔑 +1' },
      { color: '#22C55E', text: '⚡ 5-10' },
      { color: '#F5B700', text: '💰 5K' },
      { color: '#EC4899', text: '🎟️ +1' }
    ]
  },
  silver: {
    name: '🥈 SILVER SPINNER',
    desc: 'Spin the silver wheel to win 15-30⚡ energy, 25K coins & keys!',
    costText: '🎡 SPIN SILVER (1 🎟️ TICKET)',
    ticketCost: 1,
    prizes: [
      { type: 'energy', min: 15, max: 30, label: '⚡ 15-30', name: '⚡ 25 Energy' },
      { type: 'coins', val: 10000, label: '💰 10K', name: '💰 10,000 Coins' },
      { type: 'keys', val: 2, label: '🔑 +2', name: '🔑 +2 Master Keys' },
      { type: 'tickets', val: 3, label: '🎟️ +3', name: '🎟️ +3 Spin Tickets' },
      { type: 'coins', val: 25000, label: '💰 25K', name: '💰 25,000 Coins' },
      { type: 'xp', val: 25, label: '🔥 +25 XP', name: '🔥 +25 Bonus XP' }
    ],
    svgSlices: [
      { color: '#3B82F6', text: '⚡ 15-30' },
      { color: '#94A3B8', text: '💰 10K' },
      { color: '#00F0FF', text: '🔑 +2' },
      { color: '#EC4899', text: '🎟️ +3' },
      { color: '#E2E8F0', text: '💰 25K' },
      { color: '#F97316', text: '🔥 +25 XP' }
    ]
  },
  golden: {
    name: '🥇 GOLDEN SPINNER',
    desc: 'Spin the golden wheel for 50-100⚡ energy, 100K coins & 5 keys!',
    costText: '🎡 SPIN GOLDEN (1 🎟️ TICKET)',
    ticketCost: 1,
    prizes: [
      { type: 'energy', min: 50, max: 100, label: '⚡ 50-100', name: '⚡ 75 Energy' },
      { type: 'coins', val: 50000, label: '💰 50K', name: '💰 50,000 Coins' },
      { type: 'keys', val: 5, label: '🔑 +5', name: '🔑 +5 Master Keys' },
      { type: 'tickets', val: 5, label: '🎟️ +5', name: '🎟️ +5 Spin Tickets' },
      { type: 'coins', val: 100000, label: '💰 100K', name: '💰 100,000 Coins' },
      { type: 'jackpot', val: 100000, keys: 5, label: '💎 MEGA', name: '💎 GOLDEN MEGA TREASURE (+100K Coins & +5 Keys)' }
    ],
    svgSlices: [
      { color: '#22C55E', text: '⚡ 50-100' },
      { color: '#F5B700', text: '💰 50K' },
      { color: '#00F0FF', text: '🔑 +5' },
      { color: '#EC4899', text: '🎟️ +5' },
      { color: '#F5B700', text: '💰 100K' },
      { color: '#A855F7', text: '💎 MEGA' }
    ]
  },
  jackpot: {
    name: '💎 JACKPOT SPINNER',
    desc: 'Spin the high-roller jackpot wheel for up to 1 MILLION COINS!',
    costText: '🎡 SPIN JACKPOT (1 🎟️ TICKET)',
    ticketCost: 1,
    prizes: [
      { type: 'coins', val: 250000, label: '💰 250K', name: '💰 250,000 Coins' },
      { type: 'keys', val: 10, label: '🔑 +10', name: '🔑 +10 Master Keys' },
      { type: 'tickets', val: 10, label: '🎟️ +10', name: '🎟️ +10 Spin Tickets' },
      { type: 'coins', val: 500000, label: '💰 500K', name: '💰 500,000 Coins' },
      { type: 'jackpot', val: 1000000, keys: 10, label: '💎 1 MIL', name: '💎 1,000,000 COINS JACKPOT!' },
      { type: 'xp', val: 200, label: '🔥 +200 XP', name: '🔥 +200 Bonus XP' }
    ],
    svgSlices: [
      { color: '#A855F7', text: '💰 250K' },
      { color: '#00F0FF', text: '🔑 +10' },
      { color: '#EC4899', text: '🎟️ +10' },
      { color: '#A855F7', text: '💰 500K' },
      { color: '#F5B700', text: '💎 1 MIL' },
      { color: '#F97316', text: '🔥 +200' }
    ]
  }
};

function selectSpinnerType(type) {
  if (!SPINNER_DEFINITIONS[type]) return;
  _activeSpinnerType = type;

  document.querySelectorAll('.spinner-type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.id === `stype-${type}`);
  });

  const config = SPINNER_DEFINITIONS[type];
  const subDesc = document.getElementById('spin-sub-desc');
  const spinBtn = document.getElementById('btn-wheel-spin');
  const discSvg = document.getElementById('wheel-disc-svg');

  if (subDesc) subDesc.textContent = config.desc;
  if (spinBtn) spinBtn.textContent = config.costText;

  if (discSvg) {
    let svgHtml = `<circle cx="100" cy="100" r="96" fill="#1E293B" stroke="#F5B700" stroke-width="4" />`;
    config.svgSlices.forEach((slice, idx) => {
      const rot = idx * 60;
      svgHtml += `
        <g transform="rotate(${rot} 100 100)">
          <path d="M100 100 L100 4 A96 96 0 0 1 183 52 Z" fill="${slice.color}" opacity="0.95"/>
          <text x="125" y="42" font-size="12" font-weight="bold" fill="#000">${slice.text}</text>
        </g>`;
    });
    svgHtml += `
      <circle cx="100" cy="100" r="26" fill="#0F172A" stroke="#F5B700" stroke-width="3" />
      <text x="100" y="104" text-anchor="middle" font-size="11" font-weight="900" fill="#F5B700">SPIN</text>`;
    discSvg.innerHTML = svgHtml;
  }

  haptic('selection');
}

/* ── 🎡 SPIN WHEEL INTERACTIVE ACTION (WITH SLICE CENTER STOPPING FIX) ── */
let _isSpinning = false;
function spinWheelAction() {
  if (_isSpinning) return;

  const tickets = STATE.goals.ticketsBalance || 0;
  if (tickets < 1) {
    haptic('warning');
    showToast('🎟️ Out of Spin Tickets! Watch an ad to get +3 tickets!');
    return;
  }

  // Deduct 1 ticket
  STATE.goals.ticketsBalance -= 1;
  _isSpinning = true;

  const disc = document.getElementById('spin-wheel-disc');
  const spinBtn = document.getElementById('btn-wheel-spin');

  if (spinBtn) spinBtn.disabled = true;

  const sDef = SPINNER_DEFINITIONS[_activeSpinnerType] || SPINNER_DEFINITIONS.normal;
  const prizeIdx = Math.floor(Math.random() * sDef.prizes.length);
  const prize = sDef.prizes[prizeIdx];

  // 🎯 POINTER CENTER STOPPING POSITION FIX:
  // Each slice spans 60 degrees.
  // Stopping at (prizeIdx * 60) + 30 deg positions the pointer DIRECTLY in the CENTER body of the slice!
  // Add variance (+/- 8 deg) to stay within center range while never touching corner borders!
  const sliceCenterOffset = 30;
  const variance = Math.floor(Math.random() * 16) - 8;
  const exactStopAngle = (prizeIdx * 60) + sliceCenterOffset + variance;

  const targetAngle = 1800 + (360 - exactStopAngle);

  STATE.wheelAngle = (STATE.wheelAngle || 0) + targetAngle;

  if (disc) {
    disc.style.transform = `rotate(${STATE.wheelAngle}deg)`;
  }

  SFX.combo();
  haptic('medium');

  setTimeout(() => {
    _isSpinning = false;
    if (spinBtn) spinBtn.disabled = false;

    let rewardMsg = prize.name;

    if (prize.type === 'energy') {
      const energyWon = prize.min ? (Math.floor(Math.random() * (prize.max - prize.min + 1)) + prize.min) : 10;
      STATE.energy = Math.min(STATE.maxEnergy, STATE.energy + energyWon);
      rewardMsg = `⚡ +${energyWon} Energy`;
    } else if (prize.type === 'coins') {
      STATE.coins += prize.val;
    } else if (prize.type === 'keys') {
      STATE.goals.keysBalance += prize.val;
    } else if (prize.type === 'tickets') {
      STATE.goals.ticketsBalance += prize.val;
    } else if (prize.type === 'jackpot') {
      STATE.coins += prize.val;
      if (prize.keys) STATE.goals.keysBalance += prize.keys;
    } else if (prize.type === 'xp') {
      addXP(prize.val);
    }

    SFX.collect();
    haptic('success');
    createConfettiBurst();
    showToast(`🎉 WON ${rewardMsg}!`);

    if (typeof saveUserDataToFirebase === 'function') {
      saveUserDataToFirebase(STATE);
    }

    updateUI();
  }, 3600);
}

/* ── 📺 MONETAG REWARDED AD POPUP LOGIC (WITH SECURITY VERIFICATION) ── */
let _activeClaimType = null;
let _adTimerInterval = null;
let _adStartTimestamp = 0;
let _adSessionToken = null;

function openMonetagAdModal(type) {
  _activeClaimType = type;
  _adStartTimestamp = Date.now();
  _adSessionToken = Math.random().toString(36).substring(2, 10);

  const modal = document.getElementById('ad-modal');
  const statusTxt = document.getElementById('ad-status-txt');
  const timerTxt = document.getElementById('ad-timer-txt');
  const rewardTxt = document.getElementById('ad-reward-txt');
  const claimBtn = document.getElementById('btn-ad-claim');

  if (!modal) return;
  modal.classList.add('active');

  let rewDesc = '';
  if (type === 'scratch_card') {
    rewDesc = `🎫 SCRATCH CARD JACKPOT (💰 +10,000 Coins, 🔑 +3 Keys, 🎟️ +5 Tickets)`;
  } else if (type === 'spin_tickets') {
    rewDesc = `🎟️ +3 BONUS SPIN TICKETS`;
  } else if (type === 'chest_keys') {
    rewDesc = `🔑 +3 BONUS MASTER KEYS`;
  } else if (type.startsWith('enter_')) {
    const featureName = type === 'enter_wheel' ? 'SPIN WHEEL' : 'MYSTERY CHEST';
    rewDesc = `🔓 UNLOCK FULL ${featureName} PAGE`;
  } else if (type.startsWith('boost_')) {
    const boostId = type.replace('boost_', '');
    const bDef = BOOST_DEFINITIONS.find(b => b.id === boostId);
    rewDesc = `💪 ${bDef ? bDef.name : 'BOOST'} (+1 LEVEL)`;
  } else if (type === 'all') rewDesc = `💰 +${fmt(STATE.goals.coinsReward)} Coins, 🔑 +${STATE.goals.keysReward} Key & 🎟️ +${STATE.goals.spinsReward} Ticket`;
  else if (type === 'coins') rewDesc = `💰 +${fmt(STATE.goals.coinsReward)} Coins`;
  else if (type === 'keys') rewDesc = `🔑 +${STATE.goals.keysReward} Master Key`;
  else if (type === 'spins') rewDesc = `🎟️ +${STATE.goals.spinsReward} Spin Ticket`;

  if (rewardTxt) rewardTxt.textContent = rewDesc;
  if (statusTxt) statusTxt.textContent = 'Watching Monetag Rewarded Ad...';
  if (claimBtn) {
    claimBtn.disabled = true;
    claimBtn.textContent = '[ WATCHING AD... ]';
  }

  let countdown = 5;
  if (timerTxt) timerTxt.textContent = `${countdown}s`;

  clearInterval(_adTimerInterval);
  _adTimerInterval = setInterval(() => {
    countdown -= 1;
    if (countdown <= 0) {
      clearInterval(_adTimerInterval);
      if (timerTxt) timerTxt.textContent = 'READY! ✅';
      if (statusTxt) statusTxt.textContent = 'Ad Completed! Click Claim below.';
      if (claimBtn) {
        claimBtn.disabled = false;
        claimBtn.textContent = '[ 🎥 CLAIM REWARD NOW ]';
        claimBtn.onclick = () => confirmClaimReward();
      }
    } else {
      if (timerTxt) timerTxt.textContent = `${countdown}s`;
    }
  }, 1000);

  haptic('selection');
}

function confirmClaimReward() {
  if (!_activeClaimType) return;

  // Security Check: Verify elapsed ad duration (must be at least 4.5s)
  const elapsed = (Date.now() - _adStartTimestamp) / 1000;
  if (elapsed < 4.5 || !_adSessionToken) {
    showToast('🛡️ Security Warning: Ad incomplete! Reward rejected.');
    haptic('error');
    closeMonetagAdModal();
    return;
  }
  _adSessionToken = null; // Consume token

  const type = _activeClaimType;

  if (type === 'scratch_card') {
    const scDef = SCRATCH_DEFINITIONS[_activeScratchType] || SCRATCH_DEFINITIONS.wooden;

    if (scDef.coins) STATE.coins += scDef.coins;
    if (scDef.keys) STATE.goals.keysBalance = (STATE.goals.keysBalance || 0) + scDef.keys;
    if (scDef.tickets) STATE.goals.ticketsBalance = (STATE.goals.ticketsBalance || 0) + scDef.tickets;
    if (scDef.energy) STATE.energy = Math.min(STATE.maxEnergy, STATE.energy + scDef.energy);

    const surface = document.getElementById('scratch-card-surface');
    const revealedLoot = document.getElementById('scratch-revealed-loot');
    const prizeText = document.getElementById('scratch-prize-text');
    const btnAction = document.getElementById('btn-scratch-ad-action');

    if (surface) surface.classList.add('hidden');
    if (revealedLoot) revealedLoot.classList.remove('hidden');
    if (prizeText) prizeText.textContent = scDef.text;

    if (btnAction) {
      btnAction.textContent = '✅ REWARDS CLAIMED! (BACK TO GAME)';
      btnAction.onclick = () => closeScratchCardModal();
    }

    showToast(`🎉 SCRATCHED CARD! Won ${scDef.text}!`);
    createConfettiBurst();

    if (typeof saveUserDataToFirebase === 'function') {
      saveUserDataToFirebase(STATE);
    }
  } else if (type === 'spin_tickets') {
    STATE.goals.ticketsBalance = (STATE.goals.ticketsBalance || 0) + 3;
    showToast(`🎉 Monetag Ad Complete! Earned +3 Spin Tickets!`);
  } else if (type === 'chest_keys') {
    STATE.goals.keysBalance = (STATE.goals.keysBalance || 0) + 3;
    showToast(`🎉 Monetag Ad Complete! Earned +3 Master Keys!`);
  } else if (type.startsWith('enter_')) {
    showToast(`✅ Ad Finished! Accessing full feature page...`);
  } else if (type.startsWith('boost_')) {
    const boostId = type.replace('boost_', '');
    STATE.boostLevels[boostId] = (STATE.boostLevels[boostId] || 1) + 1;
    addBoostTime(boostId, 600); // Add +10 minutes
    showToast(`💪 Upgraded ${boostId.toUpperCase()} (+1 Lvl & +10m Time) via Monetag Ad!`);
    renderBoostScreen();
  } else {
    if (type === 'all' || type === 'coins') {
      const rew = STATE.goals.coinsReward;
      STATE.coins += rew;
      STATE.goals.coinsProgress = 0;
      STATE.goals.coinsClaimable = false;
      STATE.goals.coinsTarget = Math.floor(STATE.goals.coinsTarget * 1.35) + 10;
      STATE.goals.coinsReward = Math.floor(STATE.goals.coinsReward * 1.25) + 2;
    }

    if (type === 'all' || type === 'keys') {
      const rew = STATE.goals.keysReward;
      STATE.goals.keysBalance += rew;
      STATE.goals.keysProgress = 0;
      STATE.goals.keysClaimable = false;
      STATE.goals.keysTarget = Math.floor(STATE.goals.keysTarget * 1.4) + 15;
    }

    if (type === 'all' || type === 'spins') {
      const rew = STATE.goals.spinsReward;
      STATE.goals.ticketsBalance += rew;
      STATE.goals.spinsProgress = 0;
      STATE.goals.spinsClaimable = false;
      STATE.goals.spinsTarget = Math.floor(STATE.goals.spinsTarget * 1.3) + 10;
    }

    if (type === 'all') {
      showToast(`🎉 CLAIMED ALL GOAL REWARDS FROM MONETAG AD!`);
      STATE.goals.level += 1;
    } else {
      showToast(`🎉 Claimed reward from Monetag Ad!`);
    }

    if (!STATE.goals.coinsClaimable && !STATE.goals.keysClaimable && !STATE.goals.spinsClaimable) {
      if (STATE.goals.coinsProgress === 0 && STATE.goals.keysProgress === 0 && STATE.goals.spinsProgress === 0) {
        STATE.goals.level += 1;
      }
    }
  }

  SFX.collect();
  haptic('success');
  closeAdModal();

  if (typeof saveUserDataToFirebase === 'function') {
    saveUserDataToFirebase(STATE);
  }

  updateUI();
}

function closeAdModal() {
  const modal = document.getElementById('ad-modal');
  if (modal) modal.classList.remove('active');
  clearInterval(_adTimerInterval);

  if (typeof _adCompleteCallback === 'function') {
    const cb = _adCompleteCallback;
    _adCompleteCallback = null;
    cb();
  }
}

/* ── FLOATING REWARD TEXT ENGINE ── */
function spawnFloatingText(x, y, text) {
  const container = document.getElementById('float-container');
  if (!container) return;

  const el = document.createElement('div');
  el.className = 'float-text';
  el.textContent = text;
  
  // Random offset for visual variety
  const offsetX = (Math.random() - 0.5) * 30;
  el.style.left = `${x + offsetX}px`;
  el.style.top = `${y}px`;

  container.appendChild(el);

  setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, 900);
}

/* ── TOUCH RIPPLE ANIMATION ── */
function createRipple(btn, clientX, clientY) {
  const rect = btn.getBoundingClientRect();
  const circle = document.createElement('div');
  const diameter = Math.max(rect.width, rect.height);
  const radius = diameter / 2;

  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${clientX - rect.left - radius}px`;
  circle.style.top = `${clientY - rect.top - radius}px`;
  circle.className = 'tap-ripple';

  btn.appendChild(circle);

  setTimeout(() => {
    if (circle.parentNode) circle.parentNode.removeChild(circle);
  }, 500);
}

/* ── GRADUAL COMBO DECAY ENGINE (1-BY-1 LEVEL DROP WITH 2 SEC TIMER) ── */
let _comboDecayTimeout = null;
let _comboDecayInterval = null;

function scheduleComboDecay() {
  if (_comboDecayTimeout) clearTimeout(_comboDecayTimeout);
  if (_comboDecayInterval) clearInterval(_comboDecayInterval);

  _comboDecayTimeout = setTimeout(() => {
    startGradualComboDrain();
  }, 2000); // 2 SECONDS TIMER INACTIVITY BEFORE COMBO DECAY STARTS
}

function startGradualComboDrain() {
  if (_comboDecayInterval) clearInterval(_comboDecayInterval);

  _comboDecayInterval = setInterval(() => {
    if (STATE.combo > 1 || STATE.continuousTaps > 0) {
      const prevCombo = STATE.combo;

      // Reduce combo level ONE BY ONE every 2 seconds
      if (STATE.combo >= 4) {
        STATE.continuousTaps = 39; // Step down to x3 combo threshold
        STATE.combo = 3;
      } else if (STATE.combo === 3) {
        STATE.continuousTaps = 9; // Step down to x2 combo threshold
        STATE.combo = 2;
      } else if (STATE.combo === 2) {
        STATE.continuousTaps = 0; // Step down to x1 combo threshold
        STATE.combo = 1;
      } else {
        STATE.continuousTaps = 0;
        STATE.combo = 1;
      }

      if (STATE.combo < prevCombo) {
        haptic('warning');
        showToast(`⚡ 2s Inactivity! Combo reduced level-by-level to x${STATE.combo}!`);
      }

      updateUI();

      if (STATE.combo <= 1 && STATE.continuousTaps <= 0) {
        clearInterval(_comboDecayInterval);
        _comboDecayInterval = null;
      }
    } else {
      clearInterval(_comboDecayInterval);
      _comboDecayInterval = null;
    }
  }, 2000); // 2 SECONDS TIMER PER LEVEL DECAY STEP
}

/* ── 🛡️ SECURITY & ANTI-AUTO-CLICKER ENGINE ── */
let _tapTimestamps = [];
const MAX_TAPS_PER_SEC = 18; // Max 18 taps per second allowed

function isTapSecurityValid() {
  const now = Date.now();
  _tapTimestamps = _tapTimestamps.filter(t => now - t < 1000);
  if (_tapTimestamps.length >= MAX_TAPS_PER_SEC) {
    showToast('🛡️ Anti-Bot Protection: Tap rate too fast!');
    haptic('warning');
    return false;
  }
  _tapTimestamps.push(now);
  return true;
}

/* ── MAIN TAP ENGINE ── */
let _touchHandled = false;

function handleTap(e) {
  if (!isTapSecurityValid()) return;

  if (e.type === 'touchstart') {
    _touchHandled = true;
  } else if (e.type === 'click' && _touchHandled) {
    _touchHandled = false;
    return;
  }

  e.preventDefault();

  // Stop active combo decay timers when player taps
  if (_comboDecayTimeout) clearTimeout(_comboDecayTimeout);
  if (_comboDecayInterval) clearInterval(_comboDecayInterval);

  if (STATE.energy < 1) {
    haptic('warning');
    showToast('⚡ Out of Energy! Combo slowly decaying...');
    scheduleComboDecay();
    return;
  }

  // Deduct 1 energy & add +0.5 XP towards 100 levels
  STATE.energy -= 1;
  addXP(0.5);

  // Track Tap Task Progress
  incrementTaskProgress('tap', 1);

  // Increment continuous tap counter & calculate combo streak
  STATE.continuousTaps += 1;
  const prevCombo = STATE.combo;

  if (STATE.continuousTaps >= 100) STATE.combo = 4;
  else if (STATE.continuousTaps >= 40) STATE.combo = 3;
  else if (STATE.continuousTaps >= 10) STATE.combo = 2;
  else STATE.combo = 1;

  if (STATE.combo > prevCombo) {
    SFX.combo();
    showToast(`🔥 COMBO UNLOCKED! x${STATE.combo} COMBO (${STATE.combo} DROPS / TAP)!`);
  }

  // Coordinates for ripples & floaters
  const btn = document.getElementById('main-tap-btn');
  let clickX = 100, clickY = 100;

  if (e.touches && e.touches[0]) {
    clickX = e.touches[0].clientX;
    clickY = e.touches[0].clientY;
  } else if (e.clientX) {
    clickX = e.clientX;
    clickY = e.clientY;
  }

  if (btn) createRipple(btn, clickX, clickY);

  const container = document.getElementById('float-container');
  const rect = container ? container.getBoundingClientRect() : null;

  // Determine drops per tap based on Tap Multiplier Boost Level:
  // Lvl 1-4: 1 emoji drop, Lvl 5-9: 2 emoji drops, Lvl 10: 3 emoji drops
  const tapLvl = STATE.boostLevels.tapPower || 1;
  let dropsPerTap = 1;
  if (tapLvl >= 10) dropsPerTap = 3;
  else if (tapLvl >= 5) dropsPerTap = 2;

  // Generate dropsPerTap emoji drops for this tap!
  const GOAL_EMOJIS = ['💰', '🔑', '🎟️'];

  for (let c = 0; c < dropsPerTap; c++) {
    const droppedEmoji = GOAL_EMOJIS[Math.floor(Math.random() * GOAL_EMOJIS.length)];
    let displayTxt = `+1 ${droppedEmoji}`;

    if (droppedEmoji === '💰') {
      incrementTaskProgress('emoji_coins', 1);
      if (!STATE.goals.coinsClaimable && STATE.goals.coinsProgress < STATE.goals.coinsTarget) {
        STATE.goals.coinsProgress += 1;
        if (STATE.goals.coinsProgress >= STATE.goals.coinsTarget) {
          STATE.goals.coinsClaimable = true;
          haptic('success');
          showToast(`🎥 COIN GOAL READY! Watch Monetag Ad to Claim!`);
        }
      } else if (STATE.goals.coinsClaimable) {
        displayTxt = `💨 GAP`; // Empty gap space when goal is finished!
      }
    } else if (droppedEmoji === '🔑') {
      incrementTaskProgress('emoji_keys', 1);
      if (!STATE.goals.keysClaimable && STATE.goals.keysProgress < STATE.goals.keysTarget) {
        STATE.goals.keysProgress += 1;
        if (STATE.goals.keysProgress >= STATE.goals.keysTarget) {
          STATE.goals.keysClaimable = true;
          haptic('success');
          showToast(`🎥 KEY GOAL READY! Watch Monetag Ad to Claim!`);
        }
      } else if (STATE.goals.keysClaimable) {
        displayTxt = `💨 GAP`; // Empty gap space when goal is finished!
      }
    } else if (droppedEmoji === '🎟️') {
      incrementTaskProgress('emoji_spins', 1);
      if (!STATE.goals.spinsClaimable && STATE.goals.spinsProgress < STATE.goals.spinsTarget) {
        STATE.goals.spinsProgress += 1;
        if (STATE.goals.spinsProgress >= STATE.goals.spinsTarget) {
          STATE.goals.spinsClaimable = true;
          haptic('success');
          showToast(`🎥 SPIN GOAL READY! Watch Monetag Ad to Claim!`);
        }
      } else if (STATE.goals.spinsClaimable) {
        displayTxt = `💨 GAP`; // Empty gap space when goal is finished!
      }
    }

    if (container) {
      const offsetX = (c * 24) - ((dropsPerTap - 1) * 12);
      const offsetY = -(c * 16);
      spawnFloatingText(clickX - rect.left + offsetX, clickY - rect.top + offsetY, displayTxt);
    }
  }

  // Save to Firebase & LocalStorage
  if (typeof saveUserDataToFirebase === 'function') {
    saveUserDataToFirebase(STATE);
  }

  // Schedule gradual 1.5s step decay on inactivity or empty energy
  scheduleComboDecay();

  // Sound & Haptics
  SFX.tap();
  haptic('light');

  updateUI();
}

/* ── PASSIVE ENERGY REGENERATION ── */
setInterval(() => {
  if (STATE.energy < STATE.maxEnergy) {
    STATE.energy = Math.min(STATE.maxEnergy, STATE.energy + STATE.genRate);
    updateUI();
  }
}, 1000);

/* ── 💪 BOOST CENTER ENGINE (RED-TO-GREEN SVG RINGS, +5m PER UPGRADE, MAX LVL 10) ── */
const MAX_BOOST_TIME_SEC = 3000; // 50 MINUTES MAX CAPACITY (10 LEVELS OF 5m EACH)
const MAX_BOOST_LEVEL = 10;

function addBoostTime(id, secToAdd = 300) { // Adds +5 Minutes (300s) per upgrade
  const now = Date.now();
  const currentExpiry = STATE.boostExpiries[id] || now;
  const currentRemainingSec = Math.max(0, Math.floor((currentExpiry - now) / 1000));
  const newSec = Math.min(MAX_BOOST_TIME_SEC, currentRemainingSec + secToAdd);
  STATE.boostExpiries[id] = now + (newSec * 1000);
  
  const currLvl = STATE.boostLevels[id] || 1;
  if (currLvl < MAX_BOOST_LEVEL) {
    STATE.boostLevels[id] = currLvl + 1;
  }
}

function getBoostTimerDetails(id) {
  const expiry = STATE.boostExpiries[id] || 0;
  const remainingSec = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
  const pct = Math.min(100, Math.max(0, (remainingSec / MAX_BOOST_TIME_SEC) * 100));

  const mins = Math.floor(remainingSec / 60);
  const secs = remainingSec % 60;
  const text = remainingSec > 0 ? `⏳ ${mins}:${secs.toString().padStart(2, '0')} / 50m` : `⏱️ 00:00 (EXPIRED)`;
  const lvl = STATE.boostLevels[id] || 1;
  const isMaxLevel = lvl >= MAX_BOOST_LEVEL;
  const isActive = remainingSec > 0;

  return { remainingSec, mins, secs, pct, text, lvl, isMaxLevel, isActive };
}

function renderBoostScreen() {
  const container = document.getElementById('boost-cards-list');
  if (!container) return;

  const cardCircumference = 138.2; // r=22 -> 2 * PI * 22 ≈ 138.2

  container.innerHTML = BOOST_DEFINITIONS.map(b => {
    const lvl = STATE.boostLevels[b.id] || 1;
    const tDetails = getBoostTimerDetails(b.id);
    const strokeOffset = cardCircumference - (cardCircumference * (tDetails.pct / 100));

    return `
      <div class="boost-cartridge-card" onclick="openBoostUpgradeModal('${b.id}')">
        <!-- SVG CIRCULAR PROGRESS RING AROUND EMOJI ICON (RED TO GREEN GRADIENT) -->
        <div class="cartridge-circle-container">
          <svg class="cartridge-circle-svg" viewBox="0 0 54 54">
            <circle class="c-ring-bg" cx="27" cy="27" r="22" />
            <circle class="c-ring-fill fill-red-green" id="ring-fill-${b.id}" cx="27" cy="27" r="22" style="stroke-dasharray: 138.2; stroke-dashoffset: ${strokeOffset};" />
          </svg>
          <div class="cartridge-emoji-draw">${b.icon}</div>
        </div>

        <span class="cartridge-name">${b.name}</span>
        <span class="cartridge-level-badge">LVL ${lvl} / 10</span>
      </div>`;
  }).join('');
}

function openBoostUpgradeModal(id) {
  const bDef = BOOST_DEFINITIONS.find(b => b.id === id);
  if (!bDef) return;

  const modal = document.getElementById('boost-upgrade-modal');
  const emojiEl = document.getElementById('bmodal-emoji');
  const titleEl = document.getElementById('bmodal-title');
  const lvlEl = document.getElementById('bmodal-lvl');
  const adLimitEl = document.getElementById('bmodal-ad-limit');
  const descEl = document.getElementById('bmodal-desc');
  const ringFillEl = document.getElementById('bmodal-ring-fill');
  const capStatusEl = document.getElementById('bmodal-cap-status');
  const currValEl = document.getElementById('bmodal-curr-val');
  const nextValEl = document.getElementById('bmodal-next-val');
  const buyBtn = document.getElementById('btn-bmodal-buy');
  const adBtn = document.getElementById('btn-bmodal-ad');

  if (!modal) return;

  const lvl = STATE.boostLevels[id] || 1;
  const cost = Math.floor(bDef.baseCost * Math.pow(bDef.costGrowth, lvl - 1));
  const tDetails = getBoostTimerDetails(id);

  if (emojiEl) emojiEl.textContent = bDef.icon;
  if (titleEl) titleEl.textContent = bDef.name;
  if (lvlEl) lvlEl.textContent = `LEVEL ${lvl} / 10`;
  
  if (adLimitEl) {
    adLimitEl.textContent = tDetails.isActive ? '⏳ TIMER RUNNING' : '⏱️ TIMER EXPIRED (READY)';
    adLimitEl.style.color = tDetails.isActive ? 'var(--gold)' : 'var(--green)';
  }
  
  if (descEl) descEl.textContent = bDef.desc;
  
  if (ringFillEl) {
    const modalCircumference = 176;
    ringFillEl.style.strokeDashoffset = modalCircumference - (modalCircumference * (tDetails.pct / 100));
  }

  if (capStatusEl) {
    if (tDetails.isActive) {
      capStatusEl.textContent = '🔒 UPGRADE LOCKED WHILE ACTIVE';
      capStatusEl.style.color = '#EF4444';
    } else {
      capStatusEl.textContent = '+5m TIME PER UPGRADE';
      capStatusEl.style.color = 'var(--electric-blue)';
    }
  }

  if (currValEl) currValEl.textContent = `Lvl ${lvl}`;
  if (nextValEl) nextValEl.textContent = lvl < MAX_BOOST_LEVEL ? `Lvl ${lvl + 1}` : `Lvl 10 (MAX)`;

  if (buyBtn) {
    if (tDetails.isActive) {
      buyBtn.disabled = true;
      buyBtn.textContent = `⏳ UPGRADE LOCKED (TIMER ACTIVE)`;
    } else if (lvl >= MAX_BOOST_LEVEL) {
      buyBtn.disabled = true;
      buyBtn.textContent = `🔒 MAX LEVEL 10 REACHED`;
    } else {
      buyBtn.disabled = false;
      buyBtn.textContent = `💰 UPGRADE (${fmt(cost)} COINS)`;
      buyBtn.onclick = () => {
        upgradeBoostWithCoins(id, cost);
        closeBoostUpgradeModal();
      };
    }
  }

  if (adBtn) {
    if (tDetails.isActive) {
      adBtn.disabled = true;
      adBtn.textContent = '⏳ AD OPTION LOCKED (TIMER ACTIVE)';
    } else if (lvl >= MAX_BOOST_LEVEL) {
      adBtn.disabled = true;
      adBtn.textContent = '🔒 MAX LEVEL 10 REACHED';
    } else {
      adBtn.disabled = false;
      adBtn.textContent = '🎥 WATCH AD (+1 LVL & +5m TIME)';
      adBtn.onclick = () => {
        closeBoostUpgradeModal();
        upgradeBoostWithAd(id);
      };
    }
  }

  modal.classList.add('active');
  haptic('selection');
}

function closeBoostUpgradeModal() {
  const modal = document.getElementById('boost-upgrade-modal');
  if (modal) modal.classList.remove('active');
}

function upgradeBoostWithCoins(id, cost) {
  const tDetails = getBoostTimerDetails(id);
  if (tDetails.isActive) {
    haptic('warning');
    showToast(`⏳ Boost is currently active! Wait until timer expires to re-upgrade.`);
    return;
  }

  if (STATE.coins < cost) {
    haptic('warning');
    showToast(`⚠️ Insufficient Coins! Need 💰 ${fmt(cost)} Coins.`);
    return;
  }

  STATE.coins -= cost;
  addBoostTime(id, 300); // Add +5 Minutes (300s)

  SFX.collect();
  haptic('success');
  showToast(`💪 ${id.toUpperCase()} Upgraded (+1 Level & +5m Time)!`);

  if (typeof saveUserDataToFirebase === 'function') {
    saveUserDataToFirebase(STATE);
  }

  updateUI();
  renderBoostScreen();
}

function upgradeBoostWithAd(id) {
  const tDetails = getBoostTimerDetails(id);
  if (tDetails.isActive) {
    haptic('warning');
    showToast(`⏳ Boost is currently active! Wait until timer expires to re-upgrade.`);
    return;
  }
  openMonetagAdModal('boost_' + id);
}

/* ── REAL-TIME 1S BOOST CIRCULAR RING & TIMER EXPIRY LEVEL REDUCTION TICKER ── */
setInterval(() => {
  let stateChanged = false;

  BOOST_DEFINITIONS.forEach(b => {
    const ringEl = document.getElementById(`ring-fill-${b.id}`);
    
    // Check if boost active timer just completed/expired!
    if (STATE.boostExpiries[b.id] && Date.now() >= STATE.boostExpiries[b.id]) {
      delete STATE.boostExpiries[b.id]; // Clear expired timer

      // REDUCE 1 LEVEL / LEVEL POWER ACROSS ALL BOOST CARDS WHEN TIMER FINISHES!
      const currentLvl = STATE.boostLevels[b.id] || 1;
      if (currentLvl > 1) {
        STATE.boostLevels[b.id] = currentLvl - 1;
        showToast(`📉 ${b.name} timer finished! Level reduced to LVL ${STATE.boostLevels[b.id]}.`);
        haptic('warning');
        stateChanged = true;
      }
    }

    const tDetails = getBoostTimerDetails(b.id);

    if (ringEl) {
      const cardCircumference = 138.2;
      const strokeOffset = cardCircumference - (cardCircumference * (tDetails.pct / 100));
      ringEl.style.strokeDashoffset = strokeOffset;
    }
  });

  if (stateChanged) {
    if (typeof saveUserDataToFirebase === 'function') {
      saveUserDataToFirebase(STATE);
    }
    updateUI();
    renderBoostScreen();
  }
}, 1000);

/* ── NAVIGATION HANDLER (WITH LOADING SCREEN TRANSITION) ── */
function switchScreen(targetId) {
  const targetScreen = document.getElementById(`screen-${targetId}`);
  if (!targetScreen) {
    showToast(`Screen '${targetId.toUpperCase()}' coming soon!`);
    return;
  }

  // Quick smooth loading transition (350ms)
  const loadingEl = document.getElementById('loading-screen');
  if (loadingEl) {
    loadingEl.classList.remove('loading-hide');
    const fillEl = document.getElementById('loading-progress-fill');
    const pctEl = document.getElementById('loading-pct-text');
    if (fillEl) fillEl.style.width = '100%';
    if (pctEl) pctEl.textContent = '100%';

    setTimeout(() => {
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      targetScreen.classList.add('active');

      document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.screen === targetId);
      });

      if (targetId === 'boost') {
        renderBoostScreen();
      } else if (targetId === 'tasks') {
        renderTasksScreen();
      } else if (targetId === 'rank') {
        renderLeaderboard();
      } else if (targetId === 'profile') {
        renderProfileScreen();
      }

      loadingEl.classList.add('loading-hide');
    }, 350);
  } else {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    targetScreen.classList.add('active');
    if (targetId === 'boost') renderBoostScreen();
    else if (targetId === 'tasks') renderTasksScreen();
    else if (targetId === 'rank') renderLeaderboard();
    else if (targetId === 'profile') renderProfileScreen();
  }

  haptic('selection');
}

/* ── 👤 PROFILE SCREEN & RESTART DATA ENGINE (SAFE PROPER WORK FIX) ── */
async function renderProfileScreen() {
  try {
    // Safely initialize state objects if missing
    STATE.goals = STATE.goals || { level: 1, keysBalance: 0, ticketsBalance: 0 };
    STATE.referrals = STATE.referrals || { invitedCount: 0, claimed: {} };

    // Sync latest profile & goals directly from Firebase Realtime Database
    if (typeof loadUserDataFromFirebase === 'function') {
      const saved = await loadUserDataFromFirebase();
      if (saved) {
        if (saved.coins !== undefined) STATE.coins = saved.coins;
        if (saved.level !== undefined) STATE.level = saved.level;
        if (saved.xp !== undefined) STATE.xp = saved.xp;
        if (saved.goals) STATE.goals = { ...STATE.goals, ...saved.goals };
        if (saved.referrals) STATE.referrals = { ...STATE.referrals, ...saved.referrals };
      }
    }

    const pName = document.getElementById('profile-name');
    const pLvl = document.getElementById('profile-level');
    const pXp = document.getElementById('profile-xp');
    const pCoins = document.getElementById('profile-coins');
    const pKeys = document.getElementById('profile-keys');
    const pTickets = document.getElementById('profile-tickets');
    const pGoalLvl = document.getElementById('profile-goal-lvl');
    const pUserId = document.getElementById('profile-user-id');

    if (pName) pName.textContent = `⭐ LEVEL ${STATE.level || 1} TAPPER`;
    if (pLvl) pLvl.textContent = `LV. ${STATE.level || 1} / 100`;
    if (pXp) pXp.textContent = `${Number((STATE.xp || 0).toFixed(1))} XP`;
    if (pCoins) pCoins.textContent = `${fmt(STATE.coins || 0)} Coins`;
    if (pKeys) pKeys.textContent = `${STATE.goals?.keysBalance || 0} Keys`;
    if (pTickets) pTickets.textContent = `${STATE.goals?.ticketsBalance || 0} Tickets`;
    if (pGoalLvl) pGoalLvl.textContent = `Goal Lvl ${STATE.goals?.level || 1}`;
    if (pUserId) pUserId.textContent = `ID: ${_userId || 'Local'}`;

    // Update Referral System UI safely
    const refLinkInput = document.getElementById('ref-link-input');
    const refCountBadge = document.getElementById('ref-invited-count');
    if (refLinkInput) refLinkInput.value = `https://t.me/tap_king_bot?start=ref_${_userId || 'local'}`;
    if (refCountBadge) refCountBadge.textContent = `${STATE.referrals?.invitedCount || 0} Invited`;

    [1, 5, 10].forEach(m => {
      const btn = document.getElementById(`btn-claim-ref-${m}`);
      if (btn) {
        if (STATE.referrals?.claimed?.[m]) {
          btn.disabled = true;
          btn.className = 'btn-claim-ref-reward';
          btn.textContent = '✅ CLAIMED';
        } else if ((STATE.referrals?.invitedCount || 0) >= m) {
          btn.disabled = false;
          btn.className = 'btn-claim-ref-reward ready';
          btn.textContent = '🎁 CLAIM';
        } else {
          btn.disabled = true;
          btn.className = 'btn-claim-ref-reward';
          btn.textContent = `🔒 (${STATE.referrals?.invitedCount || 0}/${m})`;
        }
      }
    });
  } catch (err) {
    console.warn('[Profile Render Safe Error]:', err);
  }
}

/* ── 👥 REFERRAL SYSTEM FUNCTIONS ── */
function copyReferralLink() {
  const linkInput = document.getElementById('ref-link-input');
  if (linkInput) {
    linkInput.select();
    navigator.clipboard.writeText(linkInput.value).then(() => {
      showToast('📋 Referral Link copied to clipboard!');
      haptic('success');
    }).catch(() => {
      showToast('📋 Link: ' + linkInput.value);
    });
  }
}

function shareReferralTelegram() {
  const userRef = _userId || 'local';
  const text = encodeURIComponent(`🎮 Play Tap King with me! Tap to earn coins, spin the wheel, unlock mystery chests and win jackpot rewards!\n\nJoin using my link: https://t.me/tap_king_bot?start=ref_${userRef}`);
  window.open(`https://t.me/share/url?url=https://t.me/tap_king_bot?start=ref_${userRef}&text=${text}`, '_blank');
  showToast('✈️ Opening Telegram share...');
}

function claimReferralReward(milestone) {
  STATE.referrals = STATE.referrals || { invitedCount: 0, claimed: {} };
  if (STATE.referrals.invitedCount < milestone) {
    showToast(`🔒 Invite ${milestone} friends to unlock this reward!`);
    return;
  }
  if (STATE.referrals.claimed[milestone]) {
    showToast(`✅ Already claimed!`);
    return;
  }

  STATE.referrals.claimed[milestone] = true;
  if (milestone === 1) {
    STATE.coins += 5000;
    STATE.goals.keysBalance = (STATE.goals.keysBalance || 0) + 2;
    showToast('🎉 Claimed 💰 +5,000 Coins & 🔑 +2 Keys!');
  } else if (milestone === 5) {
    STATE.coins += 30000;
    STATE.goals.ticketsBalance = (STATE.goals.ticketsBalance || 0) + 5;
    showToast('🎉 Claimed 💰 +30,000 Coins & 🎟️ +5 Spin Tickets!');
  } else if (milestone === 10) {
    STATE.coins += 100000;
    showToast('🎉 Claimed 💰 +100,000 Coins & 💎 +1,000 Gems!');
  }

  SFX.collect();
  haptic('success');
  createConfettiBurst();

  if (typeof saveUserDataToFirebase === 'function') {
    saveUserDataToFirebase(STATE);
  }

  updateUI();
  renderProfileScreen();
}

function openRestartConfirmModal() {
  const modal = document.getElementById('restart-confirm-modal');
  if (modal) modal.classList.add('active');
  haptic('warning');
}

function closeRestartConfirmModal() {
  const modal = document.getElementById('restart-confirm-modal');
  if (modal) modal.classList.remove('active');
}

async function confirmRestartGameData() {
  STATE.coins = 0;
  STATE.energy = 500;
  STATE.maxEnergy = 500;
  STATE.level = 1;
  STATE.xp = 0;
  STATE.xpNeeded = 100;
  STATE.goals = {
    level: 1,
    coinsTarget: 30,
    coinsProgress: 0,
    coinsReward: 5,
    keysTarget: 50,
    keysProgress: 0,
    keysReward: 1,
    spinsTarget: 20,
    spinsProgress: 0,
    spinsReward: 1,
    keysBalance: 0,
    ticketsBalance: 0,
    claimed: { coins: false, keys: false, spins: false }
  };
  STATE.claimedXPLevels = {};
  STATE.unclaimedXPLevels = [];
  STATE.tasksProgress = {};
  STATE.claimedTasks = {};

  if (typeof restartFirebaseUserData === 'function') {
    await restartFirebaseUserData();
  } else {
    localStorage.removeItem('tg_game_state');
    localStorage.removeItem('te_game_state');
  }

  closeRestartConfirmModal();
  showToast('🔄 Game data successfully restarted in Firebase & LocalStorage!');
  createConfettiBurst();
  updateUI();
  switchScreen('home');
}

/* ── 🏆 LEADERBOARD ENGINE ── */
async function renderLeaderboard() {
  const container = document.getElementById('leaderboard-list-container');
  const myRankNum = document.getElementById('my-rank-num');
  const myRankScore = document.getElementById('my-rank-score');

  const currentXP = Number((STATE.xp || 0).toFixed(1));
  const currentLvl = STATE.level || 1;

  if (myRankScore) myRankScore.textContent = `${currentXP} XP (LV. ${currentLvl})`;

  const myPos = Math.max(1, Math.min(100, 101 - Math.floor(currentXP / 10)));
  if (myRankNum) myRankNum.textContent = `#${myPos}`;

  if (!container) return;

  // Fetch live global leaderboard from Firebase Realtime Database
  let players = null;
  if (typeof fetchFirebaseLeaderboard === 'function') {
    players = await fetchFirebaseLeaderboard();
  }

  if (!players || players.length === 0) {
    players = [
      { rank: 1, name: 'SatoshiTapper', avatar: '👑', xp: 64200 },
      { rank: 2, name: 'VitalicWhale', avatar: '💎', xp: 58900 },
      { rank: 3, name: 'AlphaSniper', avatar: '🚀', xp: 51300 },
      { rank: 4, name: 'TurboClicker', avatar: '⚡', xp: 46700 },
      { rank: 5, name: 'GoldenMaster', avatar: '🎯', xp: 42100 },
      { rank: 6, name: 'NinjaTapper', avatar: '🥷', xp: 38500 },
      { rank: 7, name: 'CoinKing', avatar: '💰', xp: 34000 }
    ];
  } else {
    players = players.map((p, idx) => ({
      rank: idx + 1,
      name: p.name,
      avatar: idx === 0 ? '👑' : idx === 1 ? '💎' : idx === 2 ? '🚀' : '⭐',
      xp: p.xp
    }));
  }

  const html = players.map(p => `
    <div class="rank-player-row">
      <div class="rank-player-left">
        <span class="rank-num">#${p.rank}</span>
        <span class="rank-player-avatar">${p.avatar}</span>
        <div class="rank-player-details">
          <span class="rank-player-name">${p.name}</span>
        </div>
      </div>
      <span class="rank-player-score">${fmt(p.xp)} XP</span>
    </div>
  `).join('');

  container.innerHTML = html;
}

/* ── 🎯 TASKS ENGINE (DAILY, WEEKLY, MONTHLY CARDS & REWARDS) ── */
const TASK_DEFINITIONS = [
  // 📅 DAILY TASKS
  { id: 'd_tap', category: 'daily', icon: '👆', title: 'Tap Master', desc: 'Tap 100 times on the main tap button', target: 100, type: 'tap', rewardType: 'coins', rewardVal: 500, rewardText: '+500 Coins' },
  { id: 'd_coins', category: 'daily', icon: '💰', title: 'Coin Collector', desc: 'Collect 20 Coin Emojis from tapping', target: 20, type: 'emoji_coins', rewardType: 'coins', rewardVal: 300, rewardText: '+300 Coins' },
  { id: 'd_keys', category: 'daily', icon: '🔑', title: 'Key Finder', desc: 'Collect 5 Key Emojis from tapping', target: 5, type: 'emoji_keys', rewardType: 'keys', rewardVal: 1, rewardText: '+1 Key' },
  { id: 'd_spins', category: 'daily', icon: '🎟️', title: 'Spin Hunter', desc: 'Collect 5 Spin Tickets from tapping', target: 5, type: 'emoji_spins', rewardType: 'tickets', rewardVal: 1, rewardText: '+1 Ticket' },
  { id: 'd_spin_wheel', category: 'daily', icon: '🎡', title: 'Wheel Spinner', desc: 'Spin the fortune wheel 2 times using tickets', target: 2, type: 'spin_wheel', rewardType: 'coins', rewardVal: 500, rewardText: '+500 Coins' },
  { id: 'd_open_chest', category: 'daily', icon: '🧰', title: 'Chest Opener', desc: 'Open secret chests 1 time using keys', target: 1, type: 'open_chest', rewardType: 'keys', rewardVal: 1, rewardText: '+1 Key' },

  // 🗓️ WEEKLY TASKS
  { id: 'w_tap', category: 'weekly', icon: '👆', title: 'Weekly Tap Champ', desc: 'Tap 1,000 times', target: 1000, type: 'tap', rewardType: 'coins', rewardVal: 3000, rewardText: '+3,000 Coins' },
  { id: 'w_coins', category: 'weekly', icon: '💰', title: 'Weekly Coin Hoarder', desc: 'Collect 150 Coin Emojis from tapping', target: 150, type: 'emoji_coins', rewardType: 'coins', rewardVal: 2000, rewardText: '+2,000 Coins' },
  { id: 'w_keys', category: 'weekly', icon: '🔑', title: 'Weekly Key Collector', desc: 'Collect 25 Key Emojis from tapping', target: 25, type: 'emoji_keys', rewardType: 'keys', rewardVal: 5, rewardText: '+5 Keys' },
  { id: 'w_spins', category: 'weekly', icon: '🎟️', title: 'Weekly Ticket Collector', desc: 'Collect 25 Spin Tickets from tapping', target: 25, type: 'emoji_spins', rewardType: 'tickets', rewardVal: 5, rewardText: '+5 Tickets' },
  { id: 'w_spin_wheel', category: 'weekly', icon: '🎡', title: 'Weekly Wheel Master', desc: 'Spin the fortune wheel 10 times', target: 10, type: 'spin_wheel', rewardType: 'coins', rewardVal: 2000, rewardText: '+2,000 Coins' },
  { id: 'w_open_chest', category: 'weekly', icon: '🧰', title: 'Weekly Vault Breaker', desc: 'Open secret chests 5 times', target: 5, type: 'open_chest', rewardType: 'keys', rewardVal: 3, rewardText: '+3 Keys' },

  // 📆 MONTHLY TASKS
  { id: 'm_tap', category: 'monthly', icon: '👆', title: 'Monthly Tap Legend', desc: 'Tap 5,000 times', target: 5000, type: 'tap', rewardType: 'coins', rewardVal: 15000, rewardText: '+15,000 Coins' },
  { id: 'm_coins', category: 'monthly', icon: '💰', title: 'Monthly Coin Tycoon', desc: 'Collect 500 Coin Emojis', target: 500, type: 'emoji_coins', rewardType: 'coins', rewardVal: 10000, rewardText: '+10,000 Coins' },
  { id: 'm_keys', category: 'monthly', icon: '🔑', title: 'Monthly Key Master', desc: 'Collect 100 Key Emojis', target: 100, type: 'emoji_keys', rewardType: 'keys', rewardVal: 20, rewardText: '+20 Keys' },
  { id: 'm_spins', category: 'monthly', icon: '🎟️', title: 'Monthly Spin Master', desc: 'Collect 100 Spin Tickets', target: 100, type: 'emoji_spins', rewardType: 'tickets', rewardVal: 20, rewardText: '+20 Tickets' },
  { id: 'm_spin_wheel', category: 'monthly', icon: '🎡', title: 'Monthly Wheel Champion', desc: 'Spin the fortune wheel 30 times', target: 30, type: 'spin_wheel', rewardType: 'coins', rewardVal: 10000, rewardText: '+10,000 Coins' },
  { id: 'm_open_chest', category: 'monthly', icon: '🧰', title: 'Monthly Treasure Lord', desc: 'Open secret chests 20 times', target: 20, type: 'open_chest', rewardType: 'keys', rewardVal: 15, rewardText: '+15 Keys' }
];

function incrementTaskProgress(type, amount = 1) {
  TASK_DEFINITIONS.forEach(task => {
    if (task.type === type) {
      STATE.tasksProgress[task.id] = (STATE.tasksProgress[task.id] || 0) + amount;
    }
  });
}

function switchTaskTab(category) {
  STATE.activeTaskTab = category;

  document.querySelectorAll('.task-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.id === `task-tab-${category}`);
  });

  renderTasksScreen();
  haptic('selection');
}

function renderTasksScreen() {
  const container = document.getElementById('tasks-list-container');
  if (!container) return;

  const currentTab = STATE.activeTaskTab || 'daily';
  const tasksForTab = TASK_DEFINITIONS.filter(t => t.category === currentTab);

  container.innerHTML = tasksForTab.map(t => {
    const prog = STATE.tasksProgress[t.id] || 0;
    const isClaimed = STATE.claimedTasks[t.id] || false;
    const isReady = prog >= t.target && !isClaimed;
    const pct = Math.min(100, (prog / t.target) * 100);

    let btnHtml = '';
    if (isClaimed) {
      btnHtml = `<button class="btn-task-claim claimed" disabled>✅ CLAIMED</button>`;
    } else if (isReady) {
      btnHtml = `<button class="btn-task-claim claim-ready" onclick="claimTaskReward('${t.id}')">🎁 CLAIM</button>`;
    } else {
      btnHtml = `<button class="btn-task-claim claim-disabled" disabled>${prog}/${t.target}</button>`;
    }

    return `
      <div class="task-card-item">
        <div class="task-card-icon">${t.icon}</div>
        <div class="task-card-info">
          <div class="task-card-title">${t.title}</div>
          <div class="task-card-desc">${t.desc}</div>
          <div class="task-card-progress-track">
            <div class="task-card-progress-fill" style="width: ${pct}%;"></div>
          </div>
          <div class="task-card-reward-badge">REWARD: ${t.rewardText}</div>
        </div>
        ${btnHtml}
      </div>`;
  }).join('');
}

function claimTaskReward(taskId) {
  const task = TASK_DEFINITIONS.find(t => t.id === taskId);
  if (!task) return;

  const prog = STATE.tasksProgress[taskId] || 0;
  if (prog < task.target || STATE.claimedTasks[taskId]) {
    haptic('warning');
    return;
  }

  STATE.claimedTasks[taskId] = true;

  if (task.rewardType === 'coins') {
    STATE.coins += task.rewardVal;
  } else if (task.rewardType === 'keys') {
    STATE.goals.keysBalance += task.rewardVal;
  } else if (task.rewardType === 'tickets') {
    STATE.goals.ticketsBalance += task.rewardVal;
  }

  SFX.collect();
  haptic('success');
  showToast(`🎉 Claimed Reward: ${task.rewardText}!`);

  if (typeof saveUserDataToFirebase === 'function') {
    saveUserDataToFirebase(STATE);
  }

  updateUI();
  renderTasksScreen();
}

/* ── ⭐ 100 XP LEVELS ENGINE ── */
function getXPNeededForLevel(lvl) {
  // Level 1 starts with 100 XP target, scaling up to 100 levels!
  return 100 + (lvl - 1) * 50;
}

function addXP(amount) {
  STATE.xp = (STATE.xp || 0) + amount;
  let needed = getXPNeededForLevel(STATE.level || 1);

  STATE.claimedXPLevels = STATE.claimedXPLevels || {};
  STATE.unclaimedXPLevels = STATE.unclaimedXPLevels || [];

  while (STATE.xp >= needed && (STATE.level || 1) < 100) {
    STATE.xp -= needed;
    const completedLvl = STATE.level || 1;
    STATE.level = completedLvl + 1;
    needed = getXPNeededForLevel(STATE.level);

    if (!STATE.claimedXPLevels[completedLvl] && !STATE.unclaimedXPLevels.includes(completedLvl)) {
      STATE.unclaimedXPLevels.push(completedLvl);
    }

    haptic('success');
    showToast(`🎉 LEVEL UP! You reached ⭐ LEVEL ${STATE.level} / 100! Reward ready to claim! 🔴`);
  }

  updateUI();
}

function claimXPLevelReward(lvl) {
  STATE.claimedXPLevels = STATE.claimedXPLevels || {};
  STATE.unclaimedXPLevels = STATE.unclaimedXPLevels || [];

  if (STATE.claimedXPLevels[lvl]) return;

  STATE.claimedXPLevels[lvl] = true;
  STATE.unclaimedXPLevels = STATE.unclaimedXPLevels.filter(l => l !== lvl);

  let rewardTxt = `💰 +${fmt(lvl * 1000)} Coins`;
  if (lvl % 10 === 0) {
    STATE.goals.ticketsBalance += lvl / 2;
    STATE.goals.keysBalance += lvl / 5;
    rewardTxt = `🎟️ +${lvl / 2} Spin Tickets & 🔑 +${lvl / 5} Keys`;
  } else if (lvl % 5 === 0) {
    STATE.goals.keysBalance += lvl / 5;
    rewardTxt = `🔑 +${lvl / 5} Master Keys`;
  } else {
    STATE.coins += lvl * 1000;
  }

  SFX.collect();
  haptic('success');
  showToast(`🎉 CLAIMED LEVEL ${lvl} REWARD: ${rewardTxt}!`);

  if (typeof saveUserDataToFirebase === 'function') {
    saveUserDataToFirebase(STATE);
  }

  renderXPLevelsList();
  updateUI();
}

function renderXPLevelsList() {
  const container = document.getElementById('xp-levels-list-container');
  if (!container) return;

  STATE.claimedXPLevels = STATE.claimedXPLevels || {};
  STATE.unclaimedXPLevels = STATE.unclaimedXPLevels || [];

  const currentLvl = STATE.level || 1;
  const items = [];

  for (let i = 1; i <= 100; i++) {
    const xpReq = getXPNeededForLevel(i);
    let statusClass = 'locked';
    let statusBadge = `<span class="xp-item-badge locked">🔒 LEVEL ${i}</span>`;

    if (i < currentLvl) {
      statusClass = 'completed';
      if (STATE.claimedXPLevels[i]) {
        statusBadge = `<span class="xp-item-badge completed">✅ CLAIMED</span>`;
      } else {
        statusBadge = `<button class="btn-claim-xp-reward" onclick="claimXPLevelReward(${i})">🎁 CLAIM REWARD 🔴</button>`;
      }
    } else if (i === currentLvl) {
      statusClass = 'current';
      statusBadge = `<span class="xp-item-badge current">🔥 IN PROGRESS</span>`;
    }

    let rewardTxt = `💰 +${fmt(i * 1000)} Coins`;
    if (i % 10 === 0) rewardTxt = `🎟️ +${i / 2} Spin Tickets & 🔑 +${i / 5} Keys`;
    else if (i % 5 === 0) rewardTxt = `🔑 +${i / 5} Master Keys`;

    items.push(`
      <div class="xp-level-item-card ${statusClass}">
        <div class="xp-item-lvl-icon">⭐ ${i}</div>
        <div class="xp-item-info">
          <div class="xp-item-title-row">
            <span class="xp-item-lvl-name">LEVEL ${i} / 100</span>
            ${statusBadge}
          </div>
          <div class="xp-item-req-text">Target: ${xpReq} XP Points</div>
          <div class="xp-item-reward-text">Reward: ${rewardTxt}</div>
        </div>
      </div>
    `);
  }

  container.innerHTML = items.join('');
}

function openXPLevelModal() {
  const modal = document.getElementById('xp-levels-modal');
  if (modal) {
    modal.classList.add('active');
    renderXPLevelsList();
    haptic('selection');
    updateUI();
  }
}

function closeXPLevelModal() {
  const modal = document.getElementById('xp-levels-modal');
  if (modal) modal.classList.remove('active');
}

function handleCardEnterWithAd(type) {
  haptic('selection');
  
  // Set pending callback to open full mobile view page ONLY AFTER AD FINISHES!
  _adCompleteCallback = () => {
    if (type === 'wheel') {
      openSpinWheelModal();
    } else if (type === 'chest') {
      openMysteryChestModal();
    }
  };

  // Trigger Monetag Ad first!
  openMonetagAdModal('enter_' + type);
}

function openSpinWheelModal() {
  const modal = document.getElementById('spin-wheel-modal');
  if (modal) {
    modal.classList.add('active');
    haptic('selection');
    updateUI();
  }
}

function closeSpinWheelModal() {
  const modal = document.getElementById('spin-wheel-modal');
  if (modal) modal.classList.remove('active');
}

function openMysteryChestModal() {
  const modal = document.getElementById('mystery-chest-modal');
  if (modal) {
    modal.classList.add('active');
    haptic('selection');
    updateUI();
  }
}

function closeMysteryChestModal() {
  const modal = document.getElementById('mystery-chest-modal');
  if (modal) modal.classList.remove('active');
}

function switchHomeMode(mode) {
  STATE.activeHomeMode = mode;

  document.querySelectorAll('.home-mode-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.id === `hmode-tab-${mode}`);
  });

  document.querySelectorAll('.mode-view-container').forEach(view => {
    view.classList.toggle('active', view.id === `mode-view-${mode}`);
  });

  haptic('selection');
}

function spinWheelAction() {
  if (_isWheelSpinning) return;

  if ((STATE.goals.ticketsBalance || 0) < 1) {
    haptic('warning');
    showToast(`🎟️ Insufficient Spin Tickets! Collect 🎟️ tickets from tapping or tasks.`);
    return;
  }

  // Deduct 1 Spin Ticket
  STATE.goals.ticketsBalance -= 1;
  incrementTaskProgress('spin_wheel', 1);
  updateUI();

  _isWheelSpinning = true;
  const discEl = document.getElementById('spin-wheel-disc');
  const spinBtn = document.getElementById('btn-wheel-spin');
  const pointerEl = document.getElementById('wheel-pointer-arrow');

  if (spinBtn) spinBtn.disabled = true;

  // Calculate random 5-rotation spin + target slice
  const extraDegree = Math.floor(Math.random() * 6) * 60;
  STATE.wheelAngle = (STATE.wheelAngle || 0) + 1800 + extraDegree;

  if (discEl) {
    discEl.style.transform = `rotate(${STATE.wheelAngle}deg)`;
  }

  if (pointerEl) {
    pointerEl.style.transform = 'translateY(6px) scale(1.2)';
  }

  SFX.tap();
  haptic('light');

  // Prize outcome after 3.5s transition
  setTimeout(() => {
    _isWheelSpinning = false;
    if (spinBtn) spinBtn.disabled = false;
    if (pointerEl) pointerEl.style.transform = '';

    const normalizedAngle = (STATE.wheelAngle % 360 + 360) % 360;
    const sliceIndex = Math.floor((360 - normalizedAngle) % 360 / 60);

    const PRIZES = [
      { text: '💰 +5,000 Coins', type: 'coins', val: 5000 },
      { text: '🔑 +2 Master Keys', type: 'keys', val: 2 },
      { text: '🎟️ +3 Spin Tickets', type: 'tickets', val: 3 },
      { text: '⚡ +100 Energy', type: 'energy', val: 100 },
      { text: '💎 JACKPOT! (+20K Coins, +2 Keys)', type: 'jackpot', val: 20000 },
      { text: '🔥 +10 Bonus XP', type: 'xp', val: 10 }
    ];

    const won = PRIZES[sliceIndex] || PRIZES[0];

    if (won.type === 'coins') STATE.coins += won.val;
    else if (won.type === 'keys') STATE.goals.keysBalance += won.val;
    else if (won.type === 'tickets') STATE.goals.ticketsBalance += won.val;
    else if (won.type === 'energy') STATE.energy = Math.min(STATE.maxEnergy, STATE.energy + won.val);
    else if (won.type === 'jackpot') { STATE.coins += 20000; STATE.goals.keysBalance += 2; }
    else if (won.type === 'xp') STATE.xp += won.val;

    SFX.combo();
    haptic('success');
    showToast(`🎉 SPIN WINNER! Won ${won.text}!`);

    if (typeof saveUserDataToFirebase === 'function') {
      saveUserDataToFirebase(STATE);
    }

    updateUI();
  }, 3500);
}

function openChestAction() {
  if (_isChestOpening) return;

  if ((STATE.goals.keysBalance || 0) < 1) {
    haptic('warning');
    showToast(`🔑 Insufficient Master Keys! Collect 🔑 keys from tapping or tasks.`);
    return;
  }

  // Deduct 1 Key
  STATE.goals.keysBalance -= 1;
  incrementTaskProgress('open_chest', 1);
  updateUI();

  _isChestOpening = true;
  const chestBox = document.getElementById('chest-emoji-box');
  const chestBtn = document.getElementById('btn-chest-open');
  const particlesContainer = document.getElementById('chest-particles-container');

  if (chestBtn) chestBtn.disabled = true;
  if (chestBox) chestBox.classList.add('opening-shake');

  SFX.tap();
  haptic('medium');

  // Spawn exploding loot particles
  if (particlesContainer) {
    particlesContainer.innerHTML = '';
    const LOOT_EMOJIS = ['💎', '💰', '🔑', '🎟️', '✨', '⚡'];
    for (let i = 0; i < 8; i++) {
      const p = document.createElement('span');
      p.className = 'chest-burst-particle';
      p.textContent = LOOT_EMOJIS[Math.floor(Math.random() * LOOT_EMOJIS.length)];
      p.style.cssText = `
        position: absolute;
        font-size: 24px;
        left: 50%; top: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        transition: all 0.8s ease-out;
      `;
      particlesContainer.appendChild(p);

      setTimeout(() => {
        const angle = (i / 8) * Math.PI * 2;
        const dist = 60 + Math.random() * 30;
        p.style.transform = `translate(${Math.cos(angle) * dist - 12}px, ${Math.sin(angle) * dist - 12}px) scale(1.3)`;
        p.style.opacity = '0';
      }, 50);
    }
  }

  setTimeout(() => {
    _isChestOpening = false;
    if (chestBtn) chestBtn.disabled = false;
    if (chestBox) chestBox.classList.remove('opening-shake');
    if (particlesContainer) particlesContainer.innerHTML = '';

    // Award random chest jackpot loot
    const coinBonus = 10000 + Math.floor(Math.random() * 15000);
    const ticketBonus = 2;
    STATE.coins += coinBonus;
    STATE.goals.ticketsBalance += ticketBonus;

    SFX.combo();
    haptic('success');
    showToast(`🧰 MYSTERY CHEST OPENED! Won 💰 +${fmt(coinBonus)} Coins & 🎟️ +${ticketBonus} Tickets!`);

    if (typeof saveUserDataToFirebase === 'function') {
      saveUserDataToFirebase(STATE);
    }

    updateUI();
  }, 1000);
}

function initNavigation() {
  document.querySelectorAll('.nav-btn[data-screen], .action-grid-card[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.screen || btn.dataset.nav;
      switchScreen(target);
    });
  });
}

/* ── AMBIENT PARTICLES ENGINE ── */
function initParticleCanvas() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = canvas.parentElement ? canvas.parentElement.clientWidth : window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const particles = Array.from({ length: 25 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 2 + 1,
    color: Math.random() > 0.5 ? 'rgba(245, 183, 0, 0.4)' : 'rgba(0, 240, 255, 0.3)',
    speedY: Math.random() * 0.4 + 0.1
  }));

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();

      p.y -= p.speedY;
      if (p.y < -10) {
        p.y = canvas.height + 10;
        p.x = Math.random() * canvas.width;
      }
    });
    requestAnimationFrame(loop);
  }
  loop();
}

/* ── INITIALIZATION ── */
function initLoadingScreen() {
  const fillEl = document.getElementById('loading-progress-fill');
  const pctEl = document.getElementById('loading-pct-text');
  const screenEl = document.getElementById('loading-screen');

  let currentPct = 0;
  const totalDuration = 3800; // 3.8 seconds extended loading duration
  const intervalTime = 40; // update every 40ms
  const increment = 100 / (totalDuration / intervalTime);

  const timer = setInterval(() => {
    currentPct += increment;
    if (currentPct >= 100) {
      currentPct = 100;
      clearInterval(timer);

      if (fillEl) fillEl.style.width = '100%';
      if (pctEl) pctEl.textContent = '100%';

      setTimeout(() => {
        if (screenEl) screenEl.classList.add('loading-hide');
      }, 500);
    } else {
      const rounded = Math.floor(currentPct);
      if (fillEl) fillEl.style.width = `${rounded}%`;
      if (pctEl) pctEl.textContent = `${rounded}%`;
    }
  }, intervalTime);
}

window.addEventListener('DOMContentLoaded', async () => {
  initLoadingScreen();

  // Load saved state from Firebase / LocalStorage for ALL pages
  if (typeof loadUserDataFromFirebase === 'function') {
    const saved = await loadUserDataFromFirebase();
    if (saved) {
      if (saved.coins !== undefined) STATE.coins = saved.coins;
      if (saved.energy !== undefined) STATE.energy = saved.energy;
      if (saved.maxEnergy !== undefined) STATE.maxEnergy = saved.maxEnergy;
      if (saved.level !== undefined) STATE.level = saved.level;
      if (saved.xp !== undefined) STATE.xp = saved.xp;
      if (saved.goals) STATE.goals = { ...STATE.goals, ...saved.goals };
      if (saved.boostLevels) STATE.boostLevels = { ...STATE.boostLevels, ...saved.boostLevels };
      if (saved.boostExpiries) STATE.boostExpiries = { ...STATE.boostExpiries, ...saved.boostExpiries };
      if (saved.tasksProgress) STATE.tasksProgress = { ...STATE.tasksProgress, ...saved.tasksProgress };
      if (saved.claimedTasks) STATE.claimedTasks = { ...STATE.claimedTasks, ...saved.claimedTasks };
      if (saved.claimedXPLevels) STATE.claimedXPLevels = { ...STATE.claimedXPLevels, ...saved.claimedXPLevels };
      if (saved.unclaimedXPLevels) STATE.unclaimedXPLevels = [...saved.unclaimedXPLevels];
      if (saved.referrals) STATE.referrals = { ...STATE.referrals, ...saved.referrals };
    }
  }

  const tapBtn = document.getElementById('main-tap-btn');
  if (tapBtn) {
    tapBtn.addEventListener('touchstart', handleTap, { passive: false });
    tapBtn.addEventListener('click', handleTap, { passive: false });
  }

  initNavigation();
  initParticleCanvas();
  updateUI();
});
