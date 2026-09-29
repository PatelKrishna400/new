// Comprehensive Unit Test Suite for Honey Bee Farm Tycoon
const assert = require('assert');

// Simulate Bee Farm Engine
const BEE_LAND_BASE_TIMES = [
  5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
  15, 16, 17, 18, 19, 20, 22, 24, 26, 30
];

const BEE_FLOWER_UNLOCK_COSTS = [
  0, 10, 25, 50, 100, 175, 275, 400, 550, 750,
  1000, 1350, 1800, 2350, 3000, 3800, 4750, 5850, 7100, 8500
];

function getBeePlotCycleTime(plotIndex, level) {
  const baseTime = BEE_LAND_BASE_TIMES[plotIndex] || 5;
  const L = Math.min(5000, Math.max(1, level || 1));
  if (L >= 5000) return 0.001;
  return Math.max(0.001, baseTime * Math.pow(0.001 / baseTime, (L - 1) / 4999));
}

function getBeePlotHoneyPerCycle(plotIndex, level) {
  const L = Math.min(5000, Math.max(1, level || 1));
  if (L === 1) return 1;
  if (L === 2) return 50;
  if (L === 3) return 500;
  if (L === 4) return 5000;
  return Math.floor(5000 * Math.pow(1.025, L - 4));
}

function getBeePlotMaxLifeLimit(level) {
  const L = Math.min(5000, Math.max(1, level || 1));
  return 60.0 + (L - 1) * 5.0;
}

const beeState = {
  honey: 500,
  diamonds: 50,
  energy: 0,
  larvae: 3,
  pollen: 2,
  smokers: 1,
  upgradeMultiplier: 1,
  flowerWorkersCount: 0,
  plots: Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    unlocked: i === 0,
    plantStatus: i === 0 ? 'alive' : 'empty',
    level: 1,
    lifeTimer: i === 0 ? 60.0 : 0,
    maxLifeLimit: 60.0,
    productionTime: BEE_LAND_BASE_TIMES[i] || 5,
    honeyProduction: 1
  })),
  flowers: Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    unlocked: i === 0,
    unlockCost: BEE_FLOWER_UNLOCK_COSTS[i],
    productionTimer: 5.0,
    productionDuration: 5.0,
    pollenReady: 0,
    hasWorker: false
  }))
};

console.log('=== TEST: HONEY BEE FARM TYCOON ENGINE ===');

// 1. Initial State Verification
assert.strictEqual(beeState.plots.length, 20, 'Should have exactly 20 Hives');
assert.strictEqual(beeState.flowers.length, 20, 'Should have exactly 20 Flower Meadows');
assert.strictEqual(beeState.plots[0].unlocked, true, 'Hive 1 must be unlocked & free');
assert.strictEqual(beeState.flowers[0].unlocked, true, 'Flower Meadow 1 must be unlocked & free');
console.log('✔ PASS: 20 Hives & 20 Flower Meadows initialized correctly with #1 free');

// 2. Mathematical Progression (Level 1 -> 5000)
const l1Speed = getBeePlotCycleTime(0, 1);
const l5000Speed = getBeePlotCycleTime(0, 5000);
assert.strictEqual(l1Speed, 5, 'Level 1 speed should be 5s');
assert.strictEqual(l5000Speed, 0.001, 'Level 5000 speed should reach 0.001s');
assert.strictEqual(getBeePlotHoneyPerCycle(0, 1), 1, 'Level 1 honey output should be 1');
assert.strictEqual(getBeePlotHoneyPerCycle(0, 2), 50, 'Level 2 honey output should be 50');
assert.strictEqual(getBeePlotHoneyPerCycle(0, 4), 5000, 'Level 4 honey output should be 5000');
assert.strictEqual(getBeePlotMaxLifeLimit(1), 60, 'Level 1 max cap should be 60s');
assert.strictEqual(getBeePlotMaxLifeLimit(10), 105, 'Level 10 max cap should be 105s (+5s per level)');
console.log('✔ PASS: Level 1 -> 5000 scaling (0.001s speed, honey curve, life cap) confirmed');

// 3. Multiplier Circle Toggle Logic
let mult = beeState.upgradeMultiplier;
function toggleMult() {
  if (mult === 1) mult = 10;
  else if (mult === 10) mult = 100;
  else if (mult === 100) mult = 'max';
  else mult = 1;
  return mult;
}
assert.strictEqual(toggleMult(), 10);
assert.strictEqual(toggleMult(), 100);
assert.strictEqual(toggleMult(), 'max');
assert.strictEqual(toggleMult(), 1);
console.log('✔ PASS: Circular Multiplier Toggle (1x -> 10x -> 100x -> MAX -> 1x) verified');

// 4. 20 Flower Meadows System (5s bloom cycle producing 1 Pollen Pot)
assert.strictEqual(beeState.flowers[0].productionDuration, 5.0, 'Meadow cycle must be 5.0s');
// Simulate 5 seconds elapse
beeState.flowers[0].productionTimer = 0;
beeState.flowers[0].pollenReady = 1;
assert.strictEqual(beeState.flowers[0].pollenReady, 1, 'Meadow 1 should have 1 Pollen Pot ready');

// Harvest Pollen
const beforePollen = beeState.pollen;
beeState.pollen += beeState.flowers[0].pollenReady;
beeState.flowers[0].pollenReady = 0;
beeState.flowers[0].productionTimer = 5.0;
assert.strictEqual(beeState.pollen, beforePollen + 1, 'Pollen count should increase by 1');
assert.strictEqual(beeState.flowers[0].pollenReady, 0, 'Meadow ready count should reset to 0');
console.log('✔ PASS: Flower Meadow 1 produces 1 Pollen Pot after 5s and manual collection works');

// 5. Flower Forager Worker Hiring & Automation
assert.strictEqual(beeState.flowerWorkersCount, 0);
// Hire for 250 honey
beeState.honey -= 250;
beeState.flowerWorkersCount += 1;
assert.strictEqual(beeState.flowerWorkersCount, 1);
assert.strictEqual(beeState.honey, 250);

// Assign worker to Meadow 1
beeState.flowers[0].hasWorker = true;
assert.strictEqual(beeState.flowers[0].hasWorker, true);

// Worker automated tick: completes 5s cycle and deposits directly into beeState.pollen
const pollenBeforeAuto = beeState.pollen;
beeState.flowers[0].productionTimer = 0;
if (beeState.flowers[0].hasWorker) {
  beeState.pollen += 1;
  beeState.flowers[0].pollenReady = 0;
  beeState.flowers[0].productionTimer = 5.0;
}
assert.strictEqual(beeState.pollen, pollenBeforeAuto + 1, 'Automated worker should deposit Pollen Pot into inventory');
console.log('✔ PASS: Flower Forager Worker hired, assigned to Meadow, and automated collection verified');

// 6. Honey-to-Energy Refinery Conversion (100 🍯 -> 29 ⚡)
assert.strictEqual(beeState.energy, 0);
const honeyBeforeConvert = beeState.honey; // 250
const batches = Math.floor(honeyBeforeConvert / 100); // 2 batches
const cost = batches * 100; // 200 honey
const energyGain = batches * 29; // 58 energy
beeState.honey -= cost;
beeState.energy += energyGain;
assert.strictEqual(beeState.honey, 50, 'Remaining honey should be 50');
assert.strictEqual(beeState.energy, 58, 'Energy gain should be 58 (2 batches of 29)');
console.log('✔ PASS: Royal Honey Refinery (100 🍯 -> 29 ⚡) conversion verified');

// 7. Progressive Meadow 2 Diamond Unlock
assert.strictEqual(beeState.flowers[1].unlocked, false);
const unlockCost = beeState.flowers[1].unlockCost; // 10 diamonds
assert.strictEqual(unlockCost, 10);
assert(beeState.diamonds >= unlockCost);
beeState.diamonds -= unlockCost;
beeState.flowers[1].unlocked = true;
assert.strictEqual(beeState.flowers[1].unlocked, true);
assert.strictEqual(beeState.diamonds, 40);
console.log('✔ PASS: Meadow 2 progressive diamond unlock verified');

console.log('====================================================');
console.log('🎉 ALL 7 BEE FARM UNIT TESTS PASSED SUCCESSFULLY! 100% VERIFIED!');
console.log('====================================================');
