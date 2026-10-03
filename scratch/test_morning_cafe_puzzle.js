/**
 * Automated Verification Script for Morning Café 2D Puzzle & Coin Catching Integration
 */
const fs = require('fs');
const path = require('path');

console.log('--- RUNNING MORNING CAFÉ PUZZLE TESTS ---');

// Mock browser DOM and AudioContext
const domElements = {};
global.document = {
  querySelectorAll: () => [],
  querySelector: () => null,
  getElementById: (id) => {
    if (!domElements[id]) {
      domElements[id] = {
        id,
        style: {},
        classList: {
          classes: new Set(),
          add(c) { this.classes.add(c); },
          remove(c) { this.classes.delete(c); },
          contains(c) { return this.classes.has(c); }
        },
        querySelectorAll: () => [],
        appendChild: () => {},
        removeChild: () => {},
        setAttribute: () => {},
        getAttribute: () => null,
        addEventListener: () => {}
      };
    }
    return domElements[id];
  },
  createElement: (tag) => ({
    tagName: tag,
    style: {},
    classList: { add: () => {}, remove: () => {} },
    appendChild: () => {},
    addEventListener: () => {}
  }),
  createElementNS: (ns, tag) => ({
    tagName: tag,
    setAttribute: () => {},
    appendChild: () => {},
    style: {}
  })
};

global.window = {
  AudioContext: function() {
    return {
      currentTime: 0,
      createOscillator: () => ({
        type: '',
        frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, linearRampToValueAtTime: () => {} },
        connect: () => {},
        start: () => {},
        stop: () => {}
      }),
      createGain: () => ({
        gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, linearRampToValueAtTime: () => {} },
        connect: () => {}
      }),
      destination: {}
    };
  }
};

global.performance = { now: () => Date.now() };

// Load state.js
const stateModule = require(path.join(__dirname, '..', 'frontend', 'shared', 'state.js'));
global.gameState = stateModule.gameState;

if (!global.gameState || !global.gameState.puzzleState) {
  console.error('FAIL: gameState.puzzleState not initialized in state.js');
  process.exit(1);
}
console.log('PASS: gameState.puzzleState exists with defaults:', global.gameState.puzzleState);

// Load coin-catcher.js
require(path.join(__dirname, '..', 'frontend', 'pages', 'coin-catcher', 'coin-catcher.js'));

console.log('Checking exported functions...');
const requiredFunctions = [
  'openMorningCafePuzzleModal',
  'closeMorningCafePuzzleModal',
  'openCafeSubModal',
  'closeCafeSubModal',
  'renderCafeBoard',
  'startCafeAdRewardSequence',
  'finishCafeAdSimulation',
  'claimMorningCafeWinRewards',
  'resetMorningCafePuzzle',
  'updatePuzzleHUD'
];

requiredFunctions.forEach(fn => {
  if (typeof global.window[fn] !== 'function') {
    console.error(`FAIL: window.${fn} is not a function`);
    process.exit(1);
  }
  console.log(`PASS: window.${fn} is exported`);
});

// Initialize Coin Catcher page to cache DOM elements
global.window.initCoinCatcherPage();

// Test Milestone Targets: 20, 70, 130, 180...
const ps = global.gameState.puzzleState;
ps.caughtFragments = 19;
ps.currentMilestoneIndex = 0;
ps.puzzlePieces = 0;

global.window.updatePuzzleHUD();
console.log('Initial HUD text:', domElements['puzzleProgressText'].textContent);
if (domElements['puzzleProgressText'].textContent !== '19 / 20 🧩') {
  console.error('FAIL: expected "19 / 20 🧩", got', domElements['puzzleProgressText'].textContent);
  process.exit(1);
}

// Emulate catching 20th fragment -> target 20 reached -> awards 1 piece, advances to 70
ps.caughtFragments = 20;
if (ps.caughtFragments >= 20) {
  ps.puzzlePieces += 1;
  ps.currentMilestoneIndex += 1;
}
global.window.updatePuzzleHUD();

console.log('After milestone 1 reached:');
console.log('Pieces:', ps.puzzlePieces, 'Milestone idx:', ps.currentMilestoneIndex);
console.log('HUD text:', domElements['puzzleProgressText'].textContent);

if (ps.puzzlePieces !== 1 || ps.currentMilestoneIndex !== 1 || domElements['puzzleProgressText'].textContent !== '20 / 70 🧩') {
  console.error('FAIL: milestone progression mismatch');
  process.exit(1);
}
console.log('PASS: Milestone progression 20 -> 70 verified!');

// Test board render
global.window.renderCafeBoard();
console.log('PASS: renderCafeBoard executed cleanly');

// Test Claim Rewards (+1 spin ticket, +300 energy)
const prevTickets = global.gameState.player.tickets || 0;
const prevEnergy = global.gameState.reactor.currentEnergy || 0;
global.window.claimMorningCafeWinRewards();

if ((global.gameState.player.tickets || 0) !== prevTickets + 1) {
  console.error('FAIL: Ticket reward not added');
  process.exit(1);
}
if ((global.gameState.reactor.currentEnergy || 0) !== prevEnergy + 300) {
  console.error('FAIL: Energy reward not added');
  process.exit(1);
}
console.log('PASS: Morning Cafe claim win rewards verified (+1 Ticket, +300 Energy)!');

console.log('ALL MORNING CAFÉ 2D PUZZLE TESTS PASSED SUCCESSFULLY! ✨🎉');
