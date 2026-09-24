const fs = require('fs');
const path = require('path');
const assert = require('assert');

// 1. Load and evaluate the spin.js functions
const spinJsPath = path.join(__dirname, '..', 'frontend', 'pages', 'spin', 'spin.js');
const spinJsContent = fs.readFileSync(spinJsPath, 'utf8');

// Create mock window and gameState context
const sandbox = {
  window: {},
  document: {
    addEventListener: () => {},
    getElementById: () => null
  },
  gameState: {
    player: {
      coins: 1000,
      blueCoins: 500,
      chestKeys: 10,
      chestTickets: 10,
      scratchCards: 5
    },
    spinState: {
      level: 1,
      crowns: 0,
      targetCrowns: 5,
      giftsClaimed: 0
    }
  },
  sfx: {
    playTapSound: () => {},
    playLevelUpSound: () => {}
  },
  triggerSpinConfetti: () => {},
  updateUI: () => {},
  saveGame: () => {},
  showFloatingToast: () => {}
};

const fn = new Function('window', 'document', 'gameState', 'sfx', 'triggerSpinConfetti', 'updateUI', 'saveGame', 'showFloatingToast', spinJsContent);
fn(sandbox.window, sandbox.document, sandbox.gameState, sandbox.sfx, sandbox.triggerSpinConfetti, sandbox.updateUI, sandbox.saveGame, sandbox.showFloatingToast);

const {
  getKingLevelTarget,
  getCrownWinProbability,
  getCrownGainPerHit,
  getKingLevelRewards,
  getKingWaveStageInfo,
  getSpinState
} = sandbox.window;

console.log('--- Testing Wave Targets ---');
console.log('Level 1:', getKingLevelTarget(1));
assert.strictEqual(getKingLevelTarget(1), 5, 'Level 1 target must be 5');

console.log('Level 5:', getKingLevelTarget(5));
assert.strictEqual(getKingLevelTarget(5), 550, 'Level 5 target must be 550');

console.log('Level 7:', getKingLevelTarget(7));
assert.strictEqual(getKingLevelTarget(7), 50, 'Level 7 target must be 50');

console.log('Level 10:', getKingLevelTarget(10));
assert.strictEqual(getKingLevelTarget(10), 730, 'Level 10 target must be 730');

console.log('Level 15 (Crest 3):', getKingLevelTarget(15));
console.log('Level 17 (Trough 3):', getKingLevelTarget(17));
console.log('Level 500:', getKingLevelTarget(500));
console.log('Level 1000:', getKingLevelTarget(1000));

// Test all 1000 levels produce positive valid integers
for (let lvl = 1; lvl <= 1000; lvl++) {
  const target = getKingLevelTarget(lvl);
  assert(Number.isInteger(target) && target >= 5, `Level ${lvl} target must be integer >= 5, got ${target}`);
}
console.log('✓ All 1000 levels have valid positive integer targets!');

console.log('\n--- Testing Inverse Winning Probability ---');
const p1 = getCrownWinProbability(getKingLevelTarget(1)); // limit 5
const p7 = getCrownWinProbability(getKingLevelTarget(7)); // limit 50
const p5 = getCrownWinProbability(getKingLevelTarget(5)); // limit 550
const p10 = getCrownWinProbability(getKingLevelTarget(10)); // limit 730

console.log(`P(Limit 5) = ${(p1 * 100).toFixed(1)}%`);
console.log(`P(Limit 50) = ${(p7 * 100).toFixed(1)}%`);
console.log(`P(Limit 550) = ${(p5 * 100).toFixed(1)}%`);
console.log(`P(Limit 730) = ${(p10 * 100).toFixed(1)}%`);

assert(p1 > p7, 'P(Limit 5) must be higher than P(Limit 50)');
assert(p7 > p5, 'P(Limit 50) must be higher than P(Limit 550)');
assert(p5 >= p10, 'P(Limit 550) must be >= P(Limit 730)');
assert(p10 >= 0.05, 'Minimum probability floor must be >= 5%');
assert(p1 <= 0.48, 'Maximum probability ceiling must be <= 48%');
console.log('✓ Inverse probability distribution verified!');

console.log('\n--- Testing Rewards Engine ---');
const r1 = getKingLevelRewards(1);
const r2 = getKingLevelRewards(2);
const r5 = getKingLevelRewards(5);
const r10 = getKingLevelRewards(10);
const r11 = getKingLevelRewards(11);

console.log('Level 1 Rewards:', r1);
assert.strictEqual(r1.coins, 10, 'Level 1 coins must be 10');
assert.strictEqual(r1.blueCoins, 100, 'Level 1 blue coins must be 100');

console.log('Level 2 Rewards:', r2);
assert.strictEqual(r2.coins, 20, 'Level 2 coins must be 20 (+10 increase)');
assert.strictEqual(r2.blueCoins, 200, 'Level 2 blue coins must be 200');

console.log('Level 10 Rewards:', r10);
assert.strictEqual(r10.coins, 100, 'Level 10 coins must be 100');
assert.strictEqual(r10.blueCoins, 1000, 'Level 10 blue coins must be 1000');

console.log('Level 11 Rewards:', r11);
assert.strictEqual(r11.coins, 110, 'Level 11 coins must be 110');
assert(r11.blueCoins >= 100, 'Level 11 blue coins cyclic');

console.log('✓ Rewards progression verified!');

console.log('\n--- Checking Compiled frontend/index.html ---');
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'index.html'), 'utf8');
assert(indexHtml.includes('KING EVENT • LEVEL'), 'index.html must include KING EVENT header');
assert(indexHtml.includes('spinWaveTag'), 'index.html must include spinWaveTag');
assert(indexHtml.includes('spinCrownBarFill'), 'index.html must include spinCrownBarFill');
assert(indexHtml.includes('spinLevelRewardStrip'), 'index.html must include spinLevelRewardStrip');
assert(indexHtml.includes('spinGiftCoinsVal'), 'index.html must include spinGiftCoinsVal');
assert(indexHtml.includes('spinGiftBlueVal'), 'index.html must include spinGiftBlueVal');
assert(indexHtml.includes('pages/spin/spin.js'), 'index.html must include pages/spin/spin.js script tag');
assert(spinJsContent.includes('function getKingLevelTarget'), 'spin.js must include getKingLevelTarget');
assert(spinJsContent.includes('function getCrownWinProbability'), 'spin.js must include getCrownWinProbability');
assert(spinJsContent.includes('function getKingLevelRewards'), 'spin.js must include getKingLevelRewards');
console.log('✓ Compiled frontend/index.html has all required elements and scripts!');

console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');

