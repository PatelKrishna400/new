const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('Testing 30-Day Task System and Minigame Event Hooks...');

// 1. Check all event hooks in source files
const filesToCheck = [
  { file: 'frontend/pages/energy/energy.js', pattern: "recordTaskEvent('fuel_' + fuelType, 1)" },
  { file: 'frontend/pages/spin/spin.js', pattern: "recordTaskEvent('use_ticket', 1)" },
  { file: 'frontend/pages/spin/spin.js', pattern: "recordTaskEvent('spin_wheel', 1)" },
  { file: 'frontend/pages/scratch/scratch.js', pattern: "recordTaskEvent('use_card', 1)" },
  { file: 'frontend/pages/chest/chest.js', pattern: "recordTaskEvent('use_key', 1)" },
  { file: 'frontend/pages/egg/egg.js', pattern: "recordTaskEvent('use_egg', 1)" },
  { file: 'frontend/pages/coin-catcher/coin-catcher.js', pattern: "recordTaskEvent('use_boom', 1)" },
  { file: 'frontend/pages/memory-match/memory-match.js', pattern: "recordTaskEvent('use_brain', 1)" },
  { file: 'frontend/pages/home/home.js', pattern: "recordTaskEvent('spin_wheel', 1)" },
  { file: 'frontend/pages/profile/profile.js', pattern: "recordTaskEvent('shop_diamond', cost)" },
  { file: 'frontend/pages/sunflower/sunflower.js', pattern: "recordTaskEvent('shop_diamond', priceDiamonds)" },
  { file: 'frontend/pages/sunflower/sunflower.js', pattern: "recordTaskEvent('sunflower_prestige', 1)" },
  { file: 'frontend/pages/sunflower/sunflower.js', pattern: "recordTaskEvent('sunflower_upgrade', 1)" },
  { file: 'frontend/pages/diamond-generator/diamond-generator.js', pattern: "recordTaskEvent('diamond_gen', 1)" }
];

filesToCheck.forEach(({ file, pattern }) => {
  const fullPath = path.join(__dirname, '..', file);
  const content = fs.readFileSync(fullPath, 'utf8');
  assert(content.includes(pattern), `Missing pattern "${pattern}" in ${file}`);
  console.log(`✅ Verified event hook in ${file}: ${pattern}`);
});

// 2. Validate tasks.js logic in sandbox
const tasksJs = fs.readFileSync(path.join(__dirname, '..', 'frontend/pages/tasks/tasks.js'), 'utf8');

// Mock browser environment
const localStorageMock = {};
global.localStorage = {
  getItem: (k) => localStorageMock[k] || null,
  setItem: (k, v) => { localStorageMock[k] = v; }
};
global.window = global;
global.window.addEventListener = () => {};
global.document = {
  getElementById: () => null,
  addEventListener: () => {}
};
global.gameState = {
  player: { coins: 50000, diamonds: 500, blueCoins: 0 },
  tasksState: { openedWebsite: {}, claimedWebsite: {} }
};

// Evaluate tasks.js
eval(tasksJs);

// Test generateTasksForDay
console.log('Testing generateTasksForDay for 30 days...');
for (let d = 1; d <= 30; d++) {
  const tasks = generateTasksForDay(d);
  assert.strictEqual(tasks.length, 10, `Day ${d} must have exactly 10 tasks`);
  assert.strictEqual(tasks[0].type, 'diamond_gen', `Day ${d} task 1 must be diamond_gen`);
  assert.strictEqual(tasks[1].type, 'web_task', `Day ${d} task 2 must be web_task`);
  assert.strictEqual(tasks[2].type, 'fuel_use', `Day ${d} task 3 must be fuel_use`);
  assert.strictEqual(tasks[3].type, 'sunflower_upgrade', `Day ${d} task 4 must be sunflower_upgrade`);
  assert.strictEqual(tasks[4].type, 'sunflower_prestige', `Day ${d} task 5 must be sunflower_prestige`);
  
  // Task 6 bracket: ticket, card, key, boom
  const validT6 = ['use_ticket', 'use_card', 'use_key', 'use_boom'];
  assert(validT6.includes(tasks[5].type), `Day ${d} task 6 must be in bracket pool, got ${tasks[5].type}`);
  assert.strictEqual(tasks[5].target, 5, `Day ${d} task 6 target must be 5`);

  // Task 7 bracket: egg, brain
  const validT7 = ['use_egg', 'use_brain'];
  assert(validT7.includes(tasks[6].type), `Day ${d} task 7 must be in bracket pool, got ${tasks[6].type}`);
  assert.strictEqual(tasks[6].target, 100, `Day ${d} task 7 target must be 100`);

  assert.strictEqual(tasks[7].type, 'spin_wheel', `Day ${d} task 8 must be spin_wheel`);
  assert.strictEqual(tasks[8].type, 'shop_diamond', `Day ${d} task 9 must be shop_diamond`);
  assert.strictEqual(tasks[9].type, 'complete_eight', `Day ${d} task 10 must be complete_eight`);
}
console.log('✅ All 30 days have correct task structures and bracket variations!');

// Test recordTaskEvent
console.log('Testing recordTaskEvent on Day 1...');
recordTaskEvent('diamond_gen', 2);
recordTaskEvent('fuel_green', 1);
recordTaskEvent('fuel_darkgreen', 2); // 2 * 0.4 = 0.8 => total 1.8
recordTaskEvent('sunflower_upgrade', 200);
recordTaskEvent('sunflower_prestige', 1);

const state = loadThirtyDayState();
const day1 = state.days[1];
assert.strictEqual(day1.progress[0], 2, 'Diamond gen progress should be 2');
assert.strictEqual(day1.progress[1], 0, 'Web task progress should be 0');
assert.strictEqual(day1.progress[2], 1.8, 'Fuel progress should be 1.8');
assert.strictEqual(day1.progress[3], 200, 'Sunflower upgrade progress should be 200');
assert.strictEqual(day1.progress[4], 1, 'Sunflower prestige progress should be 1');

console.log('✅ recordTaskEvent updates state accurately!');
console.log('All tests passed successfully!');
