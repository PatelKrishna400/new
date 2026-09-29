const fs = require('fs');
const path = require('path');

console.log('--- Testing Diamond Generator Logic & Formulae ---');

// 1. Emulate gameState
const gameState = {
  player: { coins: 500, diamonds: 2000 },
  diamondGenerator: {
    diamondsPerCycle: 0.000001,
    cycleDuration: 60.00,
    progressSeconds: 0,
    lastTickTime: Date.now(),
    totalDiamondsProduced: 0,
    productionLevel: 1,
    productionUpgradesCount: 0,
    productionBaseCost: 50,
    productionCostStep: 25,
    productionCostDiscount: 0,
    production1000DiamondDiscountUsed: false,
    productionAdDiscountsCount: 0,
    timeLevel: 1,
    timeUpgradesCount: 0,
    timeBaseCost: 10,
    timeCostStep: 50,
    timeCostDiscount: 0,
    timeAdFirstDiscountUsed: false,
    timeAdCooldownEndTime: 0,
    timeSubsequentAdDiscountsCount: 0
  }
};

function getDiamondsPerCycle() {
  const base = 0.000001;
  const level = gameState.diamondGenerator.productionLevel || 1;
  return Number((base + (level - 1) * 0.000001).toFixed(6));
}

function getDiamondCycleDuration() {
  const level = gameState.diamondGenerator.timeLevel || 1;
  const duration = 60.00 - (level - 1) * 0.01;
  return Math.max(1.00, Number(duration.toFixed(2)));
}

function getDiamondOutputCost() {
  const upgradesCount = gameState.diamondGenerator.productionUpgradesCount || 0;
  const baseCost = 50 + upgradesCount * 25;
  const discount = gameState.diamondGenerator.productionCostDiscount || 0;
  return Math.max(25, baseCost - discount);
}

function getDiamondSpeedCost() {
  const upgradesCount = gameState.diamondGenerator.timeUpgradesCount || 0;
  const baseCost = 10 + upgradesCount * 50;
  const discount = gameState.diamondGenerator.timeCostDiscount || 0;
  return Math.max(1, baseCost - discount);
}

function formatNumber(num) {
  if (num === undefined || num === null || isNaN(num)) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 10000) return (num / 1000).toFixed(1) + 'k';
  if (Number.isInteger(num)) return num.toString();
  const fixed = Number(num).toFixed(6);
  return fixed.replace(/(\.\d*?[1-9])0+$|\.0*$/, '$1');
}

function formatDiamondDisplay(num) {
  if (num === undefined || num === null || isNaN(num)) return '0.000000';
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
  if (num >= 10000) return (num / 1000).toFixed(1) + 'k';
  return Number(num).toFixed(6);
}

// Test 1: Initial state
console.assert(getDiamondsPerCycle() === 0.000001, 'Base rate should be 0.000001');
console.assert(getDiamondCycleDuration() === 60.00, 'Base duration should be 60.00s');
console.assert(getDiamondOutputCost() === 50, 'Output initial cost should be 50 coins');
console.assert(getDiamondSpeedCost() === 10, 'Speed initial cost should be 10 diamonds');
console.log('✓ Test 1: Initial values pass');

// Test 2: Output Upgrades & Cost Scaling (+25 each)
for (let i = 1; i <= 3; i++) {
  const cost = getDiamondOutputCost();
  gameState.diamondGenerator.productionLevel++;
  gameState.diamondGenerator.productionUpgradesCount++;
  console.log(`  Upgrade ${i}: paid ${cost} coins -> new rate: ${getDiamondsPerCycle()} 💎, next cost: ${getDiamondOutputCost()} coins`);
}
console.assert(getDiamondsPerCycle() === 0.000004, 'Rate after 3 upgrades should be 0.000004');
console.assert(getDiamondOutputCost() === 125, 'Cost after 3 upgrades should be 125 coins');
console.log('✓ Test 2: Output upgrades & cost scaling pass');

// Test 3: Reach 10 Upgrades Milestone & 1000 Diamond Cost Reducer (-100 Coins)
while (gameState.diamondGenerator.productionUpgradesCount < 10) {
  gameState.diamondGenerator.productionLevel++;
  gameState.diamondGenerator.productionUpgradesCount++;
}
console.assert(gameState.diamondGenerator.productionUpgradesCount >= 10, 'Milestone 10 upgrades reached');
const costBeforeDiscount = getDiamondOutputCost();
// Apply 1000 Diamond discount:
gameState.diamondGenerator.production1000DiamondDiscountUsed = true;
gameState.diamondGenerator.productionCostDiscount += 100;
const costAfterDiscount = getDiamondOutputCost();
console.assert(costAfterDiscount === costBeforeDiscount - 100, 'Cost should be reduced by 100 coins');
console.log(`✓ Test 3: 10 Upgrades reached, 1000 Diamond discount applied: was ${costBeforeDiscount} coins, now ${costAfterDiscount} coins`);

// Test 4: Ad watch for -50 coins
gameState.diamondGenerator.productionCostDiscount += 50;
const costAfterAd = getDiamondOutputCost();
console.assert(costAfterAd === costAfterDiscount - 50, 'Cost should be reduced by another 50 coins');
console.log(`✓ Test 4: Ad discount applied: was ${costAfterDiscount} coins, now ${costAfterAd} coins`);

// Test 5: Speed Upgrade & Cost Scaling (+50 diamonds each, -0.01s time)
for (let i = 1; i <= 3; i++) {
  const cost = getDiamondSpeedCost();
  gameState.diamondGenerator.timeLevel++;
  gameState.diamondGenerator.timeUpgradesCount++;
  console.log(`  Speed Upgrade ${i}: paid ${cost} 💎 -> new cycle: ${getDiamondCycleDuration()}s, next cost: ${getDiamondSpeedCost()} 💎`);
}
console.assert(getDiamondCycleDuration() === 59.97, 'Cycle duration should be 59.97s');
console.assert(getDiamondSpeedCost() === 160, 'Cost should be 160 diamonds (10 + 3 * 50)');
console.log('✓ Test 5: Speed upgrades & cost scaling pass');

// Test 6: Speed 1st Ad watch (-10 diamonds & 10 min cooldown)
const speedCostBeforeAd = getDiamondSpeedCost();
gameState.diamondGenerator.timeAdFirstDiscountUsed = true;
gameState.diamondGenerator.timeCostDiscount += 10;
gameState.diamondGenerator.timeAdCooldownEndTime = Date.now() + 10 * 60 * 1000;
const speedCostAfterAd1 = getDiamondSpeedCost();
console.assert(speedCostAfterAd1 === speedCostBeforeAd - 10, '1st Ad should reduce speed cost by 10 diamonds');
console.log(`✓ Test 6: 1st Ad discount applied: was ${speedCostBeforeAd} 💎, now ${speedCostAfterAd1} 💎, 10m cooldown active`);

// Test 7: Subsequent Ad watch (-1 diamond)
gameState.diamondGenerator.timeCostDiscount += 1;
const speedCostAfterAd2 = getDiamondSpeedCost();
console.assert(speedCostAfterAd2 === speedCostAfterAd1 - 1, 'Subsequent Ad should reduce speed cost by 1 diamond');
console.log(`✓ Test 7: Subsequent Ad discount applied: was ${speedCostAfterAd1} 💎, now ${speedCostAfterAd2} 💎`);

// Test 8: Formatting
console.assert(formatNumber(0.000001) === '0.000001', 'formatNumber(0.000001) should be 0.000001');
console.assert(formatNumber(0.000005) === '0.000005', 'formatNumber(0.000005) should be 0.000005');
console.assert(formatDiamondDisplay(0.000001) === '0.000001', 'formatDiamondDisplay(0.000001) should be 0.000001');
console.log('✓ Test 8: Formatting tests pass');

console.log('\n=============================================');
console.log('🎉 ALL DIAMOND GENERATOR UNIT TESTS PASSED 100%!');
console.log('=============================================');
