/* ═══════════════════════════════════
   TAP EMPIRE — Upgrade System
═══════════════════════════════════ */

'use strict';

const UPGRADES_DEF = [
  { id: 'tapPower', icon: '👆', name: 'Tap Power', desc: 'Coins earned per tap', key: 'tapPower', baseVal: 1, perLevel: 1, baseCost: 500, costMult: 1.8 },
  { id: 'energyCap', icon: '🔋', name: 'Energy Capacity', desc: 'Maximum energy pool', key: 'maxEnergy', baseVal: 500, perLevel: 50, baseCost: 800, costMult: 1.6 },
  { id: 'energyRegen', icon: '⚡', name: 'Energy Regen', desc: 'Energy regeneration speed', key: 'regenMult', baseVal: 1, perLevel: .25, baseCost: 600, costMult: 1.7 },
  { id: 'critChance', icon: '💥', name: 'Critical Chance', desc: 'Chance for critical tap', key: 'criticalChance', baseVal: .05, perLevel: .02, baseCost: 1000, costMult: 2.0 },
  { id: 'comboDur', icon: '🔥', name: 'Combo Duration', desc: 'How long combos last', key: 'comboMs', baseVal: 2000, perLevel: 200, baseCost: 700, costMult: 1.6 },
  { id: 'passive', icon: '💸', name: 'Passive Income', desc: 'Offline coins per hour', key: 'passiveIncome', baseVal: 50, perLevel: 50, baseCost: 2000, costMult: 2.2 },
];

const SHOP_ITEMS = [
  { id: 'boost2x', icon: '⚡', name: '2× Tap Boost', desc: 'Double tap reward — 30 min', price: 50, currency: 'XTR' },
  { id: 'fullenergy', icon: '🔋', name: 'Full Energy', desc: 'Instantly restore all energy', price: 100, currency: 'XTR' },
  { id: 'vip', icon: '👑', name: 'VIP Boost', desc: '3× tap + full energy — 1 hr', price: 500, currency: 'XTR' },
  { id: 'starter', icon: '🎁', name: 'Starter Pack', desc: '10,000 coins + full energy', price: 1000, currency: 'XTR' },
  { id: 'skin_gold', icon: '🌟', name: 'Gold Core Skin', desc: 'Premium animated core skin', price: 1500, currency: 'XTR' },
];

function _getUpgradeLevels() {
  return JSON.parse(localStorage.getItem('te_upgrades') || '{}');
}
function _saveUpgradeLevels(lvls) {
  localStorage.setItem('te_upgrades', JSON.stringify(lvls));
}
function getUpgradeLevel(id) { return _getUpgradeLevels()[id] || 0; }

function upgradeCost(upg) {
  const lvl = getUpgradeLevel(upg.id);
  return Math.floor(upg.baseCost * Math.pow(upg.costMult, lvl));
}

function upgradeValue(upg) {
  const lvl = getUpgradeLevel(upg.id);
  return upg.baseVal + upg.perLevel * lvl;
}

function applyUpgrades() {
  UPGRADES_DEF.forEach(u => {
    const val = upgradeValue(u);
    if (u.key === 'tapPower') STATE.tapPower = val;
    if (u.key === 'maxEnergy') STATE.maxEnergy = val;
    if (u.key === 'criticalChance') STATE.criticalChance = Math.min(.5, val);
    if (u.key === 'comboMs') STATE.economy.comboResetMs = val;
    if (u.key === 'regenMult') STATE.economy.energyRegenPerSec = (1 / 3) * val;
  });
}

async function buyUpgrade(id) {
  const upg = UPGRADES_DEF.find(u => u.id === id);
  if (!upg) return;
  const cost = upgradeCost(upg);
  if (STATE.coins < cost) { showToast(`⚠️ Need ${fmt(cost)} coins`); SFX.error(); return; }
  const lvls = _getUpgradeLevels();
  lvls[id] = (lvls[id] || 0) + 1;
  _saveUpgradeLevels(lvls);
  STATE.coins -= cost;
  updateCoinUI();
  applyUpgrades();
  SFX.upgrade();
  haptic('medium');
  showToast(`⬆️ ${upg.name} → Level ${lvls[id]}!`);
  updateMissionProgress('upgrade', 1);
  await persistUser({ coins: STATE.coins, tapPower: STATE.tapPower, maxEnergy: STATE.maxEnergy, criticalChance: STATE.criticalChance });
}

async function buyStarsItem(itemId) {
  const item = SHOP_ITEMS.find(i => i.id === itemId);
  if (!item) return;
  showModal(`
    <div style="text-align:center;padding:10px 0">
      <div style="font-size:48px;margin-bottom:10px">${item.icon}</div>
      <div style="font-size:18px;font-weight:800;margin-bottom:6px">${item.name}</div>
      <div style="font-size:13px;color:var(--muted);margin-bottom:12px">${item.desc}</div>
      <div style="font-size:26px;font-weight:900;color:var(--gold);margin-bottom:18px">⭐ ${item.price}</div>
      <div style="font-size:11px;color:var(--muted);margin-bottom:16px;line-height:1.6">
        Paid via Telegram Stars (XTR).<br>Your backend must create the invoice link.
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <button class="btn btn-muted" onclick="closeModal()">Cancel</button>
        <button class="btn btn-gold" onclick="closeModal();_initStarsPurchase('${itemId}')">Buy ⭐</button>
      </div>
    </div>
  `);
}

async function _initStarsPurchase(itemId) {
  /*
    PRODUCTION FLOW:
    1. POST /api/stars/create-invoice { itemId, initData }
    2. Backend calls Telegram: createInvoiceLink { currency:"XTR", prices }
    3. Backend returns { invoiceLink }
    4. Frontend: TG.openInvoice(invoiceLink, cb)
    5. On cb status='paid': reload player from server
    6. Backend handles successful_payment webhook → grants item
  */
  showToast('⭐ Configure /api/stars/create-invoice on your backend');
  try {
    const resp = await callAPI('/stars/create-invoice', { itemId, initData: getInitData() });
    if (resp?.invoiceLink) {
      openInvoice(resp.invoiceLink, async status => {
        if (status === 'paid') {
          showToast('✅ Purchase successful! Loading…');
          SFX.purchase();
          await reloadPlayer();
        } else if (status === 'cancelled') {
          showToast('❌ Purchase cancelled');
        }
      });
    }
  } catch (_) { }
}

/* ═══════════════════════
   BOOST ACTIONS HANDLER
═══════════════════════ */
async function activateBoostAction(type) {
  haptic('medium');
  if (typeof SFX !== 'undefined' && SFX.upgrade) SFX.upgrade();

  if (type === 'tap2x') {
    if (typeof doCollect === 'function') {
      await doCollect('boost_ad');
    } else {
      STATE.boostMultiplier = 2;
      STATE.boostExpiry = Date.now() + 10 * 60 * 1000;
      await persistUser({ boostMultiplier: STATE.boostMultiplier, boostExpiry: STATE.boostExpiry });
      showToast('🚀 2× Tap Power activated for 10 min!', 'success');
    }
  } else if (type === 'energy') {
    const addAmt = 100;
    STATE.energy = Math.min(STATE.maxEnergy, STATE.energy + addAmt);
    updateEnergyUI();
    showToast(`⚡ Restored +${addAmt} Energy!`, 'success');
    await persistUser({ energy: STATE.energy, lastEnergyUpdate: Date.now() });
  } else if (type === 'lucky') {
    STATE.criticalChance = Math.min(0.5, (STATE.criticalChance || 0.05) + 0.15);
    showToast('🍀 Lucky Boost active! +15% Crit Chance', 'success');
    setTimeout(() => {
      applyUpgrades();
    }, 10 * 60 * 1000);
  } else if (type === 'chest') {
    STATE.chestBoostExpiry = Date.now() + 10 * 60 * 1000;
    showToast('🎁 2× Chest Rewards active for 10 min!', 'success');
  } else if (type === 'premium') {
    buyStarsItem('boost2x');
    return;
  }

  if (typeof renderBoostScreen === 'function') {
    renderBoostScreen();
  }
}
