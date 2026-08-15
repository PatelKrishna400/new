/* ═══════════════════════════════════════════════════════════
   TAP EMPIRE — Energy System (No Automatic Time-Based Regeneration)
   • Section 12: Energy is ONLY earned through gameplay, chests, spins, tasks, and rewards.
   • NO per-second or offline time-based energy regeneration.
═══════════════════════════════════════════════════════════ */

'use strict';

function calculateCurrentEnergy() {
  return Math.min(STATE.maxEnergy, Math.max(0, STATE.energy || 0));
}

function startEnergyRegen() {
  /* Section 12: Automatic energy regeneration is disabled. Energy is restored via rewards/chests/spins. */
  updateEnergyUI();
}

function stopEnergyRegen() {
  /* No-op timer clean */
}

function consumeEnergy(amount = 1) {
  if (STATE.energy < amount) return false;
  STATE.energy -= amount;
  updateEnergyUI();
  return true;
}

function restoreEnergy(amount) {
  STATE.energy = Math.min(STATE.maxEnergy, (STATE.energy || 0) + amount);
  updateEnergyUI();
  persistUser({ energy: STATE.energy }, true);
}

function applyOfflineEnergyRegen() {
  /* Section 12: No offline time-based energy additions */
}
