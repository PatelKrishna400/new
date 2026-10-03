const fs = require('fs');

// Mock browser environment
const mockDOM = {};
const mockElements = {};

function getMockEl(id) {
  if (!mockElements[id]) {
    mockElements[id] = {
      id,
      textContent: '',
      innerHTML: '',
      style: {},
      classList: {
        add: () => {},
        remove: () => {},
        contains: () => false,
        toggle: () => {}
      },
      querySelector: (sel) => getMockEl(id + '_' + sel),
      querySelectorAll: () => [],
      addEventListener: () => {},
      appendChild: () => {},
      remove: () => {}
    };
  }
  return mockElements[id];
}

const mockDocument = {
  getElementById: (id) => getMockEl(id),
  querySelector: (sel) => getMockEl(sel),
  querySelectorAll: () => [],
  createElement: (tag) => getMockEl('new_' + tag),
  body: getMockEl('body')
};

const mockWindow = {
  document: mockDocument,
  location: { href: '' },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} }
};

// 1. Load state.js
const stateCode = fs.readFileSync('frontend/shared/state.js', 'utf8');
const stateFn = new Function('window', 'document', 'localStorage', stateCode + '; return { gameState, DOM, saveGame };');
const { gameState, DOM } = stateFn(mockWindow, mockDocument, mockWindow.localStorage);

console.log('--- Initial Fuel Cells State ---');
console.log('fuelCells:', gameState.energyGenerator.fuelCells);
if (gameState.energyGenerator.fuelCells.blue !== 0 || gameState.energyGenerator.fuelCells.lightblue !== 0) {
  throw new Error('Blue and Light Blue should be initialized to 0 in state.js');
}
console.log('✅ Blue and Light Blue exist in gameState.energyGenerator.fuelCells');

// 2. Load energy.js
const energyCode = fs.readFileSync('frontend/pages/energy/energy.js', 'utf8');
const energyFn = new Function(
  'window', 'document', 'gameState', 'DOM', 'sfx', 'formatNumber', 'showFloatingToast', 'updateUI', 'saveGame',
  energyCode + '; return { handleFuelAction, getFuelDisplayName, updateEnergyUI };'
);

const mockSfx = { playLevelUpSound: () => {}, playTapSound: () => {}, playErrorSound: () => {} };
let toastMsg = '';
const mockToast = (msg) => { toastMsg = msg; console.log('Toast:', msg); };

const energyExports = energyFn(
  mockWindow, mockDocument, gameState, DOM, mockSfx,
  (n) => String(n), mockToast, () => {}, () => {}
);

console.log('\n--- Testing Blue Fuel (30s Skip) ---');
// Give 2 Blue Fuel cells
gameState.energyGenerator.fuelCells.blue = 2;
gameState.energyGenerator.remainingSeconds = 120; // 2 minutes active
gameState.reactor.currentEnergy = 5.0;
gameState.energyGenerator.ratePerSec = 0.002;

console.log('Before Blue Fuel: remainingSeconds =', gameState.energyGenerator.remainingSeconds, ', energy =', gameState.reactor.currentEnergy);
energyExports.handleFuelAction('blue');

console.log('After Blue Fuel: remainingSeconds =', gameState.energyGenerator.remainingSeconds, ', energy =', gameState.reactor.currentEnergy);
console.log('Blue Fuel cells left =', gameState.energyGenerator.fuelCells.blue);

if (gameState.energyGenerator.remainingSeconds !== 90) {
  throw new Error(`Expected remainingSeconds to be 90 after 30s skip, got ${gameState.energyGenerator.remainingSeconds}`);
}
if (gameState.reactor.currentEnergy <= 5.0) {
  throw new Error('Expected energy to increase from 30s generation');
}
if (gameState.energyGenerator.fuelCells.blue !== 1) {
  throw new Error('Expected blue fuel count to decrement to 1');
}
console.log('✅ Blue Fuel (30s skip) verified successfully!');

console.log('\n--- Testing Light Blue Fuel (1m Skip) ---');
// Give 2 Light Blue Fuel cells
gameState.energyGenerator.fuelCells.lightblue = 2;
console.log('Before Light Blue Fuel: remainingSeconds =', gameState.energyGenerator.remainingSeconds, ', energy =', gameState.reactor.currentEnergy);
energyExports.handleFuelAction('lightblue');

console.log('After Light Blue Fuel: remainingSeconds =', gameState.energyGenerator.remainingSeconds, ', energy =', gameState.reactor.currentEnergy);
console.log('Light Blue Fuel cells left =', gameState.energyGenerator.fuelCells.lightblue);

if (gameState.energyGenerator.remainingSeconds !== 30) {
  throw new Error(`Expected remainingSeconds to be 30 after 60s skip, got ${gameState.energyGenerator.remainingSeconds}`);
}
if (gameState.energyGenerator.fuelCells.lightblue !== 1) {
  throw new Error('Expected lightblue fuel count to decrement to 1');
}
console.log('✅ Light Blue Fuel (1m skip) verified successfully!');

console.log('\n--- Testing Fuel Shop Pricing in profile.js ---');
const profileCode = fs.readFileSync('frontend/pages/profile/profile.js', 'utf8');
const profileFn = new Function(
  'window', 'document', 'gameState', 'formatNumber', 'showShopToast',
  profileCode + '; return { getFuelCellPricing, renderAllFuelShopCards, DEFAULT_FUEL_CELLS_CONFIG };'
);

const profileExports = profileFn(
  mockWindow, mockDocument, gameState, (n) => String(n), () => {}
);

const bluePricing = profileExports.getFuelCellPricing('blue');
const lightBluePricing = profileExports.getFuelCellPricing('lightblue');

console.log('Blue Fuel Pricing:', bluePricing);
console.log('Light Blue Fuel Pricing:', lightBluePricing);

if (!bluePricing || bluePricing.multiplier !== 2.0) {
  throw new Error('Blue pricing multiplier should be 2.0');
}
if (!lightBluePricing || lightBluePricing.multiplier !== 3.5) {
  throw new Error('Light Blue pricing multiplier should be 3.5');
}

// Test renderAllFuelShopCards
const listEl = getMockEl('fuelShopCardsList');
profileExports.renderAllFuelShopCards();
if (!listEl.innerHTML.includes('Blue Fuel Cell') || !listEl.innerHTML.includes('Light Blue Fuel Cell')) {
  throw new Error('renderAllFuelShopCards should render both Blue Fuel Cell and Light Blue Fuel Cell');
}
console.log('✅ Shop renders Blue Fuel Cell and Light Blue Fuel Cell cards!');

console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
