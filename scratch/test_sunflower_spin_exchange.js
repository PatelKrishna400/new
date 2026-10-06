const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Setup mock browser globals
const globalWindow = {
  document: {
    addEventListener: () => {},
    getElementById: (id) => ({
      id,
      innerHTML: '',
      innerText: '',
      textContent: '',
      classList: {
        add: () => {},
        remove: () => {},
        contains: () => false
      },
      appendChild: () => {},
      style: {}
    }),
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

console.log('=== TEST: SUNFLOWER SPIN COIN EXCHANGE (1 QA ☀️ = 1 🎡 SPIN COIN) ===');

assert.strictEqual(window.SF_SPIN_BASE_COST, 1e15, 'Base cost must be 1e15 (1 Qa)');
assert.deepStrictEqual(window.SF_SPIN_BATCHES, [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000], 'Must contain batches [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000]');
console.log('✔ PASS 1: Base cost (1 Qa) and 10 batch packages configured correctly');

// Setup player and state
global.gameState = {
  player: {
    chestTickets: 5
  }
};
window.sunflowerState.coins = 500; // Not enough for 1 Qa (1e15)

// Test Insufficient funds
const prevCoins = window.sunflowerState.coins;
const prevTickets = global.gameState.player.chestTickets;
window.exchangeSfCoinsForSpin(1);
assert.strictEqual(window.sunflowerState.coins, prevCoins, 'Coins should not be deducted if insufficient');
assert.strictEqual(global.gameState.player.chestTickets, prevTickets, 'Tickets should not be awarded if insufficient');
console.log('✔ PASS 2: Insufficient balance safely handled');

// Test 1 Spin Coin Exchange
window.sunflowerState.coins = 2.5e15; // 2.5 Qa
window.exchangeSfCoinsForSpin(1);
assert.strictEqual(window.sunflowerState.coins, 1.5e15, 'Coins should be 1.5 Qa (2.5 Qa - 1 Qa)');
assert.strictEqual(global.gameState.player.chestTickets, 6, 'Spin Tickets should increase from 5 to 6');
console.log('✔ PASS 3: 1 🎡 Spin Coin exchanged for 1 Qa ☀️ successfully');

// Test Batch Exchange: 10 Spin Coins
window.sunflowerState.coins = 15e15; // 15 Qa
window.exchangeSfCoinsForSpin(10);
assert.strictEqual(window.sunflowerState.coins, 5e15, 'Coins should be 5 Qa (15 Qa - 10 Qa)');
assert.strictEqual(global.gameState.player.chestTickets, 16, 'Spin Tickets should increase by 10 (6 -> 16)');
console.log('✔ PASS 4: Batch of 10 🎡 Spin Coins exchanged for 10 Qa ☀️ successfully');

// Test Batch Exchange: 500 Spin Coins
window.sunflowerState.coins = 600e15; // 600 Qa
window.exchangeSfCoinsForSpin(500);
assert.strictEqual(window.sunflowerState.coins, 100e15, 'Coins should be 100 Qa (600 Qa - 500 Qa)');
assert.strictEqual(global.gameState.player.chestTickets, 516, 'Spin Tickets should increase by 500 (16 -> 516)');
console.log('✔ PASS 5: Batch of 500 🎡 Spin Coins exchanged for 500 Qa ☀️ successfully');

// Test MAX Exchange
window.sunflowerState.coins = 7.8e15; // 7.8 Qa -> floor is 7 Qa = 7 tickets
const startT = global.gameState.player.chestTickets;
window.exchangeSfCoinsForSpin('max');
assert.strictEqual(global.gameState.player.chestTickets, startT + 7, 'Max exchange should award 7 tickets');
assert.strictEqual(Math.round(window.sunflowerState.coins), Math.round(0.8e15), 'Remaining coins should be 0.8 Qa');
console.log('✔ PASS 6: MAX possible 🎡 Spin Coins exchange verified');

// Test subtab switching
assert.doesNotThrow(() => {
  window.switchSunflowerExchangeSubtab('spin');
  window.switchSunflowerExchangeSubtab('fuel');
  window.switchSunflowerExchangeSubtab('energy');
}, 'Subtab switcher should function without errors');
console.log('✔ PASS 7: Subtab switcher for spin, fuel, and energy verified');

console.log('\n======================================================');
console.log('🎉 ALL 7 SPIN COIN EXCHANGE TESTS PASSED SUCCESSFULLY! 100%');
console.log('======================================================');
