const fs = require('fs');

// Mock browser DOM
const mockElements = {};
function getMockEl(id) {
  if (!mockElements[id]) {
    mockElements[id] = {
      id,
      textContent: '',
      innerHTML: '',
      title: '',
      disabled: false,
      dataset: {},
      style: {},
      setAttribute: () => {},
      getAttribute: () => '',
      classList: {
        add: () => {},
        remove: () => {},
        contains: () => false,
        toggle: () => {}
      },
      querySelector: (s) => getMockEl(id + '_' + s),
      querySelectorAll: () => [],
      addEventListener: () => {},
      removeEventListener: () => {},
      appendChild: () => {},
      remove: () => {}
    };
  }
  return mockElements[id];
}

const mockDocument = {
  getElementById: (id) => getMockEl(id),
  querySelector: (s) => getMockEl(s),
  querySelectorAll: () => [],
  createElement: (t) => getMockEl('new_' + t),
  addEventListener: () => {},
  removeEventListener: () => {},
  body: getMockEl('body')
};

const mockWindow = {
  document: mockDocument,
  location: { href: '' },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  setInterval: (fn, ms) => {},
  clearInterval: () => {}
};

// 1. Load state.js
const stateCode = fs.readFileSync('frontend/shared/state.js', 'utf8');
const stateFn = new Function('window', 'document', 'localStorage', stateCode + '; return { gameState, DOM, saveGame };');
const { gameState, DOM } = stateFn(mockWindow, mockDocument, mockWindow.localStorage);

// 2. Load profile.js
const profileCode = fs.readFileSync('frontend/pages/profile/profile.js', 'utf8');
const profileFn = new Function(
  'window', 'document', 'gameState', 'DOM', 'formatNumber', 'showShopToast', 'sfx',
  profileCode + '; return window;'
);

const mockSfx = { playLevelUpSound: () => {}, playTapSound: () => {}, playErrorSound: () => {} };
let toastLog = [];
const mockToast = (msg, icon) => { toastLog.push({ msg, icon }); };
const mockFormatNumber = (n) => String(n);

const w = profileFn(mockWindow, mockDocument, gameState, DOM, mockFormatNumber, mockToast, mockSfx);

console.log('================================================================');
console.log('🧪 TESTING SHOP PASSES & ENERGY FUEL CELL SCALED COSTS');
console.log('================================================================\n');

// TEST 1: Buy Pass items with Diamonds (100 💎 -> 1 item)
console.log('--- TEST 1: 100 Diamonds Pass Purchases ---');
gameState.player.diamonds = 250;
gameState.player.blueCoins = 250;
gameState.player.chestKeys = 0;
gameState.player.chestTickets = 0;
gameState.player.eggs = 0;
gameState.player.scratchCards = 0;

// Buy Key
w.buyPassItemWithDiamonds('key');
console.log('Key purchased. Diamonds remaining:', gameState.player.diamonds, 'Keys:', gameState.player.chestKeys);
if (gameState.player.diamonds !== 150 || gameState.player.chestKeys !== 1) {
  throw new Error('Expected 1 key and 150 diamonds remaining');
}

// Buy Ticket
w.buyPassItemWithDiamonds('ticket');
console.log('Ticket purchased. Diamonds remaining:', gameState.player.diamonds, 'Tickets:', gameState.player.chestTickets);
if (gameState.player.diamonds !== 50 || gameState.player.chestTickets !== 1) {
  throw new Error('Expected 1 ticket and 50 diamonds remaining');
}

// Try to buy Egg with only 50 diamonds (Should fail - requires 100)
toastLog = [];
w.buyPassItemWithDiamonds('egg');
if (gameState.player.diamonds !== 50 || gameState.player.eggs !== 0) {
  throw new Error('Expected purchase to fail when diamonds < 100');
}
console.log('✅ Correctly blocked purchase with insufficient diamonds (< 100)');

// Add diamonds and buy Egg + Scratch Card
gameState.player.diamonds = 300;
w.buyPassItemWithDiamonds('egg');
w.buyPassItemWithDiamonds('scratchCard');
if (gameState.player.diamonds !== 100 || gameState.player.eggs !== 1 || gameState.player.scratchCards !== 1) {
  throw new Error('Expected 1 egg and 1 scratchCard for 100 diamonds each');
}
console.log('✅ All 4 pass items (Key, Ticket, Egg, Scratch Card) verified for 100 Diamonds!');

// TEST 2: Rewarded Ads with Individual 24-Hour Cooldown
console.log('\n--- TEST 2: Rewarded Ads with Individual 24-Hour Cooldown ---');
gameState.player.passAdCooldowns = {};
const startKeys = gameState.player.chestKeys;
const startTickets = gameState.player.chestTickets;

// Claim Key via Ad
w.claimPassItemViaAd('key');
if (gameState.player.chestKeys !== startKeys + 1) {
  throw new Error('Expected chestKeys to increment by 1 via ad');
}
if (!gameState.player.passAdCooldowns.key) {
  throw new Error('Expected passAdCooldowns.key to be set');
}
console.log('Key ad watched at timestamp:', gameState.player.passAdCooldowns.key);

// Try to claim Key again immediately -> Should be blocked!
toastLog = [];
w.claimPassItemViaAd('key');
if (gameState.player.chestKeys !== startKeys + 1) {
  throw new Error('Key claim should have been blocked during 24h cooldown!');
}
console.log('✅ Key ad correctly blocked during active 24h cooldown!');

// Verify INDIVIDUAL tab functionality: Ticket can still be claimed!
w.claimPassItemViaAd('ticket');
if (gameState.player.chestTickets !== startTickets + 1) {
  throw new Error('Expected ticket to be claimable independently!');
}
console.log('✅ Ticket claimed independently while Key was on cooldown!');

// Check UI timer rendering
w.updatePassAdTimersUI();
const keyBtn = getMockEl('passAdBtn_key');
const keyLbl = getMockEl('passAdLabel_key');
const keyGain = getMockEl('passAdGain_key');

console.log('Key Button Disabled:', keyBtn.disabled, '| Label:', keyLbl.textContent, '| Badge:', keyGain.textContent);
if (!keyBtn.disabled || !keyLbl.textContent.includes('⏳') || keyGain.textContent !== '24h Lock') {
  throw new Error('Key button should show active 24h cooldown state');
}

const ticketBtn = getMockEl('passAdBtn_ticket');
const eggBtn = getMockEl('passAdBtn_egg');
console.log('Egg Button Disabled (no ad watched yet):', eggBtn.disabled);
if (eggBtn.disabled) {
  throw new Error('Egg button should not be disabled before ad watch');
}
console.log('✅ Individual 24h cooldown and UI timers verified!');

// TEST 3: Energy Fuel Cell Diamond Costs (10x Increase)
console.log('\n--- TEST 3: Energy Fuel Cell Diamond Costs (10x Increase) ---');
const expectedPrices = {
  darkgreen: 20,
  green: 50,
  yellow: 100,
  orange: 200,
  blue: 250,
  lightblue: 350,
  red: 500,
  darkred: 750,
  pink: 1000,
  purple: 2000
};

for (const [fuel, price] of Object.entries(expectedPrices)) {
  const actualCost = w.getFuelCellDiamondCost(fuel);
  console.log(`Fuel ${fuel.padEnd(10)}: cost = ${actualCost} 💎 (expected ${price} 💎)`);
  if (actualCost !== price) {
    throw new Error(`Expected ${fuel} to cost ${price} diamonds, got ${actualCost}`);
  }
}
console.log('✅ All fuel cell diamond costs verified to match 10x scale (darkgreen: 20, green: 50, etc.)!');

// TEST 4: Purchasing Fuel Cells with Diamonds
console.log('\n--- TEST 4: Purchasing Fuel Cells with Diamonds ---');
gameState.player.diamonds = 200;
gameState.energyGenerator.fuelCells.darkgreen = 0;
gameState.energyGenerator.fuelCells.green = 0;

// Buy darkgreen for 20 diamonds
w.purchaseFuelCell('darkgreen', 'diamond');
if (gameState.player.diamonds !== 180 || gameState.energyGenerator.fuelCells.darkgreen !== 1) {
  throw new Error('Expected darkgreen fuel to cost 20 diamonds');
}
console.log('Darkgreen fuel cell purchased: left =', gameState.player.diamonds, 'diamonds, owned =', gameState.energyGenerator.fuelCells.darkgreen);

// Reset purchase lock between calls
if (typeof w.resetFuelPurchaseLock === 'function') w.resetFuelPurchaseLock();

// Buy green for 50 diamonds
w.purchaseFuelCell('green', 'diamond');
if (gameState.player.diamonds !== 130 || gameState.energyGenerator.fuelCells.green !== 1) {
  throw new Error('Expected green fuel to cost 50 diamonds');
}
console.log('Green fuel cell purchased: left =', gameState.player.diamonds, 'diamonds, owned =', gameState.energyGenerator.fuelCells.green);
console.log('Green fuel cell purchased: left =', gameState.player.diamonds, 'diamonds, owned =', gameState.energyGenerator.fuelCells.green);

console.log('\n================================================================');
console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! 100% VERIFIED!');
console.log('================================================================\n');
