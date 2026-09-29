// Test for Sunflower Buy Multiplier Toggle Switch
const assert = require('assert');

// Simulate sunflowerState
const sunflowerState = {
  upgradeMultiplier: 1,
  coins: 500,
  plots: [
    { id: 1, unlocked: true, level: 1, plantStatus: 'alive' }
  ]
};

function toggleSfUpgradeMultiplier() {
  const current = sunflowerState.upgradeMultiplier || 1;
  let next = 1;
  if (current === 1 || current === '1') next = 10;
  else if (current === 10 || current === '10') next = 100;
  else if (current === 100 || current === '100') next = 'max';
  else next = 1;

  sunflowerState.upgradeMultiplier = next;
  return next;
}

console.log('=== TEST: SUNFLOWER MULTIPLIER CIRCLE TOGGLE ===');

// Initial state
assert.strictEqual(sunflowerState.upgradeMultiplier, 1, 'Initial multiplier should be 1');
console.log('✔ PASS: Initial multiplier is 1x');

// 1st toggle: 1 -> 10
assert.strictEqual(toggleSfUpgradeMultiplier(), 10, '1st toggle should be 10');
assert.strictEqual(sunflowerState.upgradeMultiplier, 10);
console.log('✔ PASS: 1st toggle switches to 10x');

// 2nd toggle: 10 -> 100
assert.strictEqual(toggleSfUpgradeMultiplier(), 100, '2nd toggle should be 100');
assert.strictEqual(sunflowerState.upgradeMultiplier, 100);
console.log('✔ PASS: 2nd toggle switches to 100x');

// 3rd toggle: 100 -> max
assert.strictEqual(toggleSfUpgradeMultiplier(), 'max', '3rd toggle should be max');
assert.strictEqual(sunflowerState.upgradeMultiplier, 'max');
console.log('✔ PASS: 3rd toggle switches to MAX');

// 4th toggle: max -> 1
assert.strictEqual(toggleSfUpgradeMultiplier(), 1, '4th toggle should cycle back to 1');
assert.strictEqual(sunflowerState.upgradeMultiplier, 1);
console.log('✔ PASS: 4th toggle cycles back to 1x');

console.log('====================================================');
console.log('🎉 ALL MULTIPLIER TOGGLE TESTS PASSED SUCCESSFULLY!');
console.log('====================================================');
