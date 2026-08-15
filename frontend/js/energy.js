/* ═══════════════════════════════════════════════════════════
   TAP EMPIRE — Energy System v2
   • Timestamp-based calculation — NO per-second DB writes
   • UI updates via setInterval (visual only)
   • Firestore write only when energy is consumed or restored
   • lastEnergyUpdate stored in Firestore; current energy
     is always derived from (lastEnergyUpdate + elapsed * rate)
═══════════════════════════════════════════════════════════ */

'use strict';

let _energyUiTimer = null;

/* ─────────────────────────────────────────────────────────
   calculateCurrentEnergy
   Derives the current energy from the stored timestamp.
   Call this whenever you need the true current energy,
   instead of reading STATE.energy directly.
───────────────────────────────────────────────────────── */
function calculateCurrentEnergy() {
  if (STATE.energy >= STATE.maxEnergy) return STATE.maxEnergy;

  const now = Date.now();
  const elapsed = Math.max(0, (now - STATE.lastEnergyUpdate) / 1000); // seconds
  const rate = STATE.economy.energyRegenPerSec ?? (1 / 3);
  const regen = elapsed * rate;
  return Math.min(STATE.maxEnergy, STATE.energy + regen);
}

/* ─────────────────────────────────────────────────────────
   startEnergyRegen
   Runs a UI-update loop every 500ms.
   Does NOT write to Firestore on every tick —
   only updates STATE.energy + UI.
   The server derives energy from lastEnergyUpdate timestamp.
───────────────────────────────────────────────────────── */
function startEnergyRegen() {
  stopEnergyRegen();

  /* Seed lastEnergyUpdate if not set */
  if (!STATE.lastEnergyUpdate) STATE.lastEnergyUpdate = Date.now();

  _energyUiTimer = setInterval(() => {
    if (STATE.energy >= STATE.maxEnergy) return;

    const newEnergy = calculateCurrentEnergy();
    if (newEnergy > STATE.energy) {
      STATE.energy = newEnergy;
      STATE.lastEnergyUpdate = Date.now();
      updateEnergyUI();
    }
  }, 500); // 500ms tick — smooth enough, cheap enough
}

function stopEnergyRegen() {
  clearInterval(_energyUiTimer);
  _energyUiTimer = null;
}

/* ─────────────────────────────────────────────────────────
   consumeEnergy
   Deducts energy immediately (client-optimistic).
   Persist via persistUser() — coalesced, not per-tap.
───────────────────────────────────────────────────────── */
function consumeEnergy(amount = 1) {
  /* Recalculate before consuming to account for regen since last tap */
  STATE.energy = calculateCurrentEnergy();

  if (STATE.energy < amount) return false;

  STATE.energy -= amount;
  STATE.lastEnergyUpdate = Date.now();
  updateEnergyUI();
  return true;
}

/* ─────────────────────────────────────────────────────────
   restoreEnergy
   Used by boosts, ad rewards, daily rewards.
   Writes to Firestore immediately (meaningful state change).
───────────────────────────────────────────────────────── */
function restoreEnergy(amount) {
  STATE.energy = Math.min(STATE.maxEnergy, STATE.energy + amount);
  STATE.lastEnergyUpdate = Date.now();
  updateEnergyUI();
  /* Immediate persist — energy restoration is a meaningful event */
  persistUser({ energy: STATE.energy, lastEnergyUpdate: STATE.lastEnergyUpdate }, true);
}

/* ─────────────────────────────────────────────────────────
   applyOfflineEnergyRegen
   Called once at startup after loading player data.
   Calculates how much energy regenerated while offline
   and applies it without any DB round-trip.
───────────────────────────────────────────────────────── */
function applyOfflineEnergyRegen() {
  if (!STATE.lastEnergyUpdate) return;
  const calculated = calculateCurrentEnergy();
  if (calculated > STATE.energy) {
    STATE.energy = calculated;
    STATE.lastEnergyUpdate = Date.now();
  }
}
