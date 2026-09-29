/**
 * Verification Test: XP & Goal Page Decoupling and Sunflower Heading / Menu Bar
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Mock browser globals
global.window = global;
global.document = {
  getElementById: (id) => {
    if (!global._mockElements) global._mockElements = {};
    if (!global._mockElements[id]) {
      global._mockElements[id] = {
        id,
        classList: {
          classes: new Set(),
          add(c) { this.classes.add(c); },
          remove(c) { this.classes.delete(c); },
          contains(c) { return this.classes.has(c); }
        },
        style: {},
        textContent: '',
        innerHTML: '',
        scrollIntoView() {},
        scrollTop: 0
      };
    }
    return global._mockElements[id];
  },
  querySelector: () => ({ scrollTop: 0 }),
  querySelectorAll: () => [],
  documentElement: { scrollTop: 0 },
  body: { scrollTop: 0 }
};
global.window.scrollTo = () => {};
global.DOM = {};

// Load state.js
require(path.join(__dirname, '../../../shared/state.js'));

console.log('--- 1. Testing Default Game State Initialization ---');
assert(gameState.xpState, 'xpState must exist');
assert(gameState.goalState, 'goalState must exist');
assert.strictEqual(gameState.xpState.currentLevel, 1, 'xpState.currentLevel starts at 1');
assert.strictEqual(gameState.goalState.currentLevel, 1, 'goalState.currentLevel starts at 1');
console.log('✓ Initial game states correctly configured.');

console.log('--- 2. Testing Goal Level 1 Completion & XP Decoupling ---');
// Set up Goal Level 1 items
gameState.progression.levelProgress = { cards: 20, keys: 50, tickets: 35 };
gameState.player.xp = 500; // Player has 500 XP (below 1000 XP requirement for XP Level 1)

// Goal level 1 claim
const goalResult = completeActiveLevel(1);
assert(goalResult && goalResult.success, 'Goal completion must succeed without ReferenceError');
assert.strictEqual(gameState.goalState.claimedGoals[1], true, 'Goal level 1 marked in goalState.claimedGoals');
assert.strictEqual(gameState.progression.completedLevels[1], true, 'Goal level 1 marked in progression.completedLevels');
assert.strictEqual(gameState.progression.activeLevel, 2, 'Goal active level advanced to 2');

// Verify XP page is NOT claimed!
assert(!gameState.xpState.claimedLevels[1], 'XP Level 1 MUST NOT be claimed automatically when Goal Level 1 completes!');
assert.strictEqual(isXpLevelClaimed(1), false, 'isXpLevelClaimed(1) returns false');
assert.strictEqual(isXpLevelUnlocked(1), true, 'XP Level 1 is unlocked');
console.log('✓ Goal Level 1 completion succeeded and did NOT taint XP Level 1!');

console.log('--- 3. Testing XP Page Progression & Reward Claiming ---');
// Give player 1000 XP so Level 1 requirement is met
gameState.player.xp = 1200;
assert(gameState.player.xp >= 1000, 'Player has enough XP for Level 1');

// Now claim XP Level 1
const initialDarkGreenFuel = gameState.energyGenerator.fuelCells.darkgreen || 0;
const xpResult = completeActiveLevel(1, { source: 'xp' });
assert(xpResult && xpResult.success, 'XP level claim must succeed');
assert.strictEqual(gameState.xpState.claimedLevels[1], true, 'XP Level 1 is now claimed');
assert.strictEqual(isXpLevelClaimed(1), true, 'isXpLevelClaimed(1) is true');
assert.strictEqual(gameState.xpState.currentLevel, 2, 'XP current level advanced to 2');
assert(gameState.energyGenerator.fuelCells.darkgreen > initialDarkGreenFuel, 'Dark Green Fuel cells were awarded');

// Verify XP Level 2 is unlocked, but Level 3 is locked
assert.strictEqual(isXpLevelUnlocked(2), true, 'XP Level 2 is unlocked because Level 1 is claimed');
assert.strictEqual(isXpLevelUnlocked(3), false, 'XP Level 3 is locked because Level 2 is not yet claimed');
console.log('✓ XP Level reward claiming is 100% independent and functional!');

global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

console.log('--- 4. Testing Sunflower CSS & Navigation Rules ---');
const sunflowerCss = fs.readFileSync(path.join(__dirname, '../../sunflower/sunflower.css'), 'utf8');
assert(sunflowerCss.includes('overflow-x: clip;'), 'sunflower.css must use overflow-x: clip to preserve sticky positioning');
assert(sunflowerCss.includes('.sf-bottom-menu-bar {'), 'sunflower.css must contain .sf-bottom-menu-bar styles');
assert(sunflowerCss.includes('background: #ffffff !important;'), 'sunflower.css bottom menu bar must have white background');
assert(sunflowerCss.includes('border: 2px solid #f59e0b !important;'), 'sunflower.css bottom menu bar must have yellow border');

const sunflowerJs = fs.readFileSync(path.join(__dirname, '../../sunflower/sunflower.js'), 'utf8');
assert(sunflowerJs.includes("stickyHdr.style.display = 'flex'"), 'sunflower.js must explicitly ensure sfStickyHeader display');
assert(sunflowerJs.includes('viewContainer.scrollTop = 0'), 'sunflower.js must reset scrollTop on page change');
console.log('✓ Sunflower styles and navigation verified!');

console.log('\n======================================');
console.log('ALL VERIFICATION TESTS PASSED SUCCESSFULLY!');
console.log('======================================\n');
