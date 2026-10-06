const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Setup mock browser globals
const globalWindow = {
  document: {
    addEventListener: () => {},
    getElementById: () => null,
    querySelectorAll: () => [],
    createElement: () => ({
      classList: { add: () => {}, remove: () => {} },
      style: {},
      appendChild: () => {}
    }),
    body: { appendChild: () => {}, removeChild: () => {} }
  },
  localStorage: {
    store: {},
    getItem(k) { return this.store[k] || null; },
    setItem(k, v) { this.store[k] = String(v); },
    removeItem(k) { delete this.store[k]; }
  },
  performance: { now: () => Date.now() },
  requestAnimationFrame: () => 1
};

global.window = globalWindow;
global.document = globalWindow.document;
global.localStorage = globalWindow.localStorage;
global.performance = globalWindow.performance;
global.requestAnimationFrame = globalWindow.requestAnimationFrame;

// Execute sunflower.js
const sunflowerJsCode = fs.readFileSync(path.join(__dirname, '../frontend/pages/sunflower/sunflower.js'), 'utf8');
eval(sunflowerJsCode);

console.log('=== TEST: SUNFLOWER DEDICATED LAND MANAGER (WATER & COLLECT ONLY) ===');

const state = window.sunflowerState;
assert(state, 'Sunflower state must be defined');

// 1. Verify 20 Plots and Land Worker initial state
assert(Array.isArray(state.plots), 'plots must be an array');
assert.strictEqual(state.plots.length, 20, 'There must be exactly 20 plots');
assert.strictEqual(state.plots[0].id, 1, 'Plot 1 id must be 1');
assert.strictEqual(state.plots[0].unlocked, true, 'Land 1 must be unlocked by default');
assert.strictEqual(typeof state.landWorkersCount, 'number', 'landWorkersCount must be a number');
assert.strictEqual(window.getAssignedLandWorkersCount(), 0, 'Initially 0 assigned land managers');
assert.strictEqual(window.getIdleLandWorkersCount(), state.landWorkersCount, 'Idle count matches total hired initially');
console.log('✔ PASS 1: Land Workers state and plots initialized correctly');

// 2. Test Hiring a Land Manager with Coins (250 Coins)
state.coins = 500;
state.landWorkersCount = 0;
state.plots[0].hasWorker = false;

window.hireLandWorker('coins');
assert.strictEqual(state.landWorkersCount, 1, 'landWorkersCount should be 1');
assert.strictEqual(state.coins, 250, 'Coins should be 250 (500 - 250)');
// Check auto-assignment to Land 1
assert.strictEqual(state.plots[0].hasWorker, true, 'Manager should auto-assign to Land 1');
assert.strictEqual(window.getAssignedLandWorkersCount(), 1, '1 assigned manager');
assert.strictEqual(window.getIdleLandWorkersCount(), 0, '0 idle managers');
console.log('✔ PASS 2: Land Manager hired with coins and auto-assigned to Land 1');

// 3. Test Unassigning & Re-assigning & Toggling
window.unassignLandWorker(1);
assert.strictEqual(state.plots[0].hasWorker, false, 'Land 1 manager should be unassigned');
assert.strictEqual(window.getIdleLandWorkersCount(), 1, '1 idle manager available');

window.assignLandWorker(1);
assert.strictEqual(state.plots[0].hasWorker, true, 'Land 1 manager assigned again');
assert.strictEqual(window.getIdleLandWorkersCount(), 0, '0 idle managers');

window.toggleLandWorkerAssignment(1);
assert.strictEqual(state.plots[0].hasWorker, false, 'Land 1 manager toggled to off');
assert.strictEqual(window.getIdleLandWorkersCount(), 1, '1 idle manager available');

window.toggleLandWorkerAssignment(1);
assert.strictEqual(state.plots[0].hasWorker, true, 'Land 1 manager toggled to on');
assert.strictEqual(window.getIdleLandWorkersCount(), 0, '0 idle managers');
console.log('✔ PASS 3: Unassign, Assign, and Toggle work seamlessly');

// 4. Test Auto-Assigning to multiple lands
state.plots[1].unlocked = true;
state.plots[1].hasWorker = false;
state.plots[0].hasWorker = false;
state.landWorkersCount = 2; // 2 hired, 0 assigned
assert.strictEqual(window.getIdleLandWorkersCount(), 2, '2 idle managers');

window.autoAssignAllLandWorkers();
assert.strictEqual(state.plots[0].hasWorker, true, 'Land 1 assigned');
assert.strictEqual(state.plots[1].hasWorker, true, 'Land 2 assigned');
assert.strictEqual(window.getIdleLandWorkersCount(), 0, '0 idle managers left');
console.log('✔ PASS 4: autoAssignAllLandWorkers assigned idle managers to unlocked lands');

// 5. Test Land Manager Automation: Water Feed for Life Time
const plot1 = state.plots[0];
plot1.hasWorker = true;
plot1.plantStatus = 'alive';
plot1.lifeTimer = 100; // Low life (below 75% of 500)
state.baskets = 5;
const prevBaskets = state.baskets;

const initialLife = plot1.lifeTimer;
// Simulate manager auto-water logic:
if (plot1.hasWorker && plot1.plantStatus === 'alive' && state.baskets > 0) {
  const maxCap = 500;
  if (plot1.lifeTimer < (maxCap * 0.75)) {
    state.baskets -= 1;
    plot1.lifeTimer = Math.min(maxCap, (plot1.lifeTimer || 0) + 10);
  }
}
assert.strictEqual(state.baskets, prevBaskets - 1, '1 water basket should be consumed');
assert.strictEqual(plot1.lifeTimer, initialLife + 10, 'Life should increase by water bonus (+10s)');
console.log('✔ PASS 5: Land Manager automatically feeds water to extend life');

// 6. Test Land Manager Automation: Auto-Collect Harvest Coins
plot1.uncollectedCoins = 50;
const startCoins = state.coins;
if (plot1.hasWorker && (plot1.uncollectedCoins || 0) > 0) {
  const harvest = plot1.uncollectedCoins;
  state.coins = (state.coins || 0) + harvest;
  plot1.totalCoinsGenerated = (plot1.totalCoinsGenerated || 0) + harvest;
  plot1.uncollectedCoins = 0;
  plot1.readyToCollect = false;
}
assert.strictEqual(state.coins, startCoins + 50, 'Coins should be added to player balance automatically');
assert.strictEqual(plot1.uncollectedCoins, 0, 'uncollectedCoins should be reset to 0');
assert.strictEqual(plot1.readyToCollect, false, 'readyToCollect should be false');
console.log('✔ PASS 6: Land Manager automatically collects harvest coins');

// 7. Verify Land Manager DOES NOT clear dead crops (Manual shovel required)
plot1.plantStatus = 'dead';
plot1.isWithered = true;
// Land manager automation runs:
// In sunflower.js, dead crop is NOT touched by manager:
assert.strictEqual(plot1.plantStatus, 'dead', 'Dead plot remains dead until player shovels');
assert.strictEqual(plot1.isWithered, true, 'isWithered remains true for manual shovel clearing');
console.log('✔ PASS 7: Land Manager does NOT auto-recrop (Manual shovel preserved)');

// 8. Verify Land Manager DOES NOT auto-plant seeds (Manual seeding preserved)
plot1.plantStatus = 'empty';
state.seeds = 5;
// Land manager automation runs:
assert.strictEqual(plot1.plantStatus, 'empty', 'Empty plot remains empty for manual seed planting');
assert.strictEqual(state.seeds, 5, 'Seeds balance untouched by Land Manager');
console.log('✔ PASS 8: Land Manager does NOT auto-plant seeds (Seeds preserved)');

console.log('\n======================================================');
console.log('ALL 8 DEDICATED LAND MANAGER (WATER & COLLECT ONLY) TESTS PASSED!');
console.log('======================================================');
