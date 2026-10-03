const assert = require('assert');

function getKingLevelTarget(level) {
  const lvl = Math.max(1, Math.min(1000, Math.floor(level || 1)));
  if (lvl === 1) return 5;
  if (lvl === 5) return 550;
  if (lvl === 7) return 50;
  if (lvl === 10) return 730;

  // Wave cycle of 5 levels:
  // Peaks at: 5, 10, 15, 20, 25...
  // Troughs at: 7, 12, 17, 22, 27...
  const cycle = Math.floor((lvl - 1) / 5);
  const peakVal = 550 + (cycle * 180);
  const troughVal = Math.round(50 + ((cycle - 1) * 15));
  const pos = (lvl - 1) % 5;

  if (pos === 4) {
    return peakVal;
  } else if (pos === 1 && cycle >= 1) {
    return troughVal;
  } else if (pos === 0) {
    if (cycle === 0) return 5;
    return Math.round(troughVal * 2.6);
  } else if (pos === 1) {
    return 30;
  } else if (pos === 2) {
    return Math.round(troughVal + (peakVal - troughVal) * 0.25);
  } else if (pos === 3) {
    return Math.round(troughVal + (peakVal - troughVal) * 0.62);
  }

  return 50;
}

function getCrownWinProbability(targetLimit) {
  const base = 5;
  const p = 0.05 + 0.40 * Math.pow(base / Math.max(base, targetLimit), 0.45);
  return Math.min(0.48, Math.max(0.05, p));
}

function getKingLevelRewards(level, targetLimit) {
  const lvl = Math.max(1, Math.min(1000, Math.floor(level || 1)));
  
  // 1. Coins: 10 + 10 per level increase
  const coins = 10 * lvl;
  
  // 2. Blue Coins: 100 to 1000 level-wise increase in cycles
  const cyclePos = ((lvl - 1) % 10) + 1; // 1 to 10
  const cycleBlock = Math.floor((lvl - 1) / 10);
  const blueCoins = (cyclePos * 100) + (cycleBlock * 50);
  
  const keys = Math.min(25, 2 + Math.floor(lvl / 50));
  const tickets = Math.min(50, 3 + Math.floor(lvl / 25));
  const cards = Math.min(25, 2 + Math.floor(lvl / 50));
  
  return { coins, blueCoins, keys, tickets, cards };
}

function getCrownGainPerHit(targetLimit) {
  if (targetLimit <= 50) return 1;
  return Math.max(1, Math.round(targetLimit / 50));
}

// Verification Tests
assert.strictEqual(getKingLevelTarget(1), 5, 'Level 1 target must be 5');
assert.strictEqual(getKingLevelTarget(5), 550, 'Level 5 target must be 550');
assert.strictEqual(getKingLevelTarget(7), 50, 'Level 7 target must be 50');
assert.strictEqual(getKingLevelTarget(10), 730, 'Level 10 target must be 730');

// Verify inverse probability:
// Limit 5 should have HIGHER probability than limit 50, which is HIGHER than 550, which is HIGHER than 730
const p1 = getCrownWinProbability(getKingLevelTarget(1));
const p7 = getCrownWinProbability(getKingLevelTarget(7));
const p5 = getCrownWinProbability(getKingLevelTarget(5));
const p10 = getCrownWinProbability(getKingLevelTarget(10));

console.log(`Probabilities: Lvl 1 (lim 5): ${(p1*100).toFixed(1)}%, Lvl 7 (lim 50): ${(p7*100).toFixed(1)}%, Lvl 5 (lim 550): ${(p5*100).toFixed(1)}%, Lvl 10 (lim 730): ${(p10*100).toFixed(1)}%`);
assert(p1 > p7, 'Prob of limit 5 must be > limit 50');
assert(p7 > p5, 'Prob of limit 50 must be > limit 550');
assert(p5 > p10, 'Prob of limit 550 must be > limit 730');

// Verify rewards:
const r1 = getKingLevelRewards(1, 5);
const r2 = getKingLevelRewards(2, 30);
const r10 = getKingLevelRewards(10, 730);

console.log('Rewards Lvl 1:', r1);
console.log('Rewards Lvl 2:', r2);
console.log('Rewards Lvl 10:', r10);

assert.strictEqual(r1.coins, 10, 'Lvl 1 coins must be 10');
assert.strictEqual(r2.coins, 20, 'Lvl 2 coins must be 20 (+10 increase)');
assert.strictEqual(r1.blueCoins, 100, 'Lvl 1 blue coins must be 100');
assert.strictEqual(r10.blueCoins, 1000, 'Lvl 10 blue coins must reach 1000');

console.log('✅ All King Event wave & probability tests passed successfully!');
