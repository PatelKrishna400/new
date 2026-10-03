const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Website Task Button Label & Mechanics...');

const tasksJsPath = path.join(__dirname, '..', '..', 'tasks', 'tasks.js');
const tasksJsContent = fs.readFileSync(tasksJsPath, 'utf8');

// 1. Verify "Buy Website Task" text is removed from button generation
assert(!tasksJsContent.includes("<span>🪙 Buy Website Task"), "Must not contain '<span>🪙 Buy Website Task' in tasks.js");
assert(!tasksJsContent.includes("btnText: 'Buy Website Task"), "Must not contain 'Buy Website Task' in btnText defaults");
console.log('✅ 1. No "Buy Website Task" text in rendered button elements or btnText.');

// 2. Verify button renders cost + coin logo: "${cost.toLocaleString()} 🪙"
assert(tasksJsContent.includes("<span>${cost.toLocaleString()} 🪙</span>"), "Must render <span>${cost.toLocaleString()} 🪙</span> in tasks.js");
console.log('✅ 2. Correct button text template found: <span>${cost.toLocaleString()} 🪙</span>');

// 3. Mock DOM environment and test buyWebsiteTask and rendering
global.window = {
  addEventListener: () => {},
  removeEventListener: () => {}
};
global.document = {
  getElementById: (id) => {
    if (id === 'tasksListContainer') {
      return { innerHTML: '', querySelectorAll: () => [] };
    }
    if (id === 'taskNotesModalActions') {
      return { innerHTML: '' };
    }
    if (id === 'taskNotesBackdrop') {
      return { classList: { add: () => {}, remove: () => {} } };
    }
    return null;
  }
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {}
};
global.gameState = {
  player: { coins: 5000 },
  tasksState: { openedWebsite: {} }
};
global.saveGame = () => {};
global.updateUI = () => {};
global.sfx = { playBuySound: () => {}, playErrorSound: () => {} };
global.showFloatingToast = () => {};
global.renderTasksList = () => {};
global.DOM = {};

// Evaluate tasks.js functions
eval(tasksJsContent);

// Test getWebsiteTasksList
const list = getWebsiteTasksList();
assert(Array.isArray(list) && list.length > 0, "Website tasks list must not be empty");
const firstTask = list[0];
assert.strictEqual(firstTask.btnText, '1,000 🪙', "Task btnText should be '1,000 🪙'");
console.log('✅ 3. getWebsiteTasksList() produces btnText "1,000 🪙".');

// Test buyWebsiteTask execution
const initialCoins = gameState.player.coins;
buyWebsiteTask(firstTask.id);
assert.strictEqual(gameState.player.coins, initialCoins - 1000, "Coins must be reduced by 1000");
assert.strictEqual(gameState.tasksState.openedWebsite[firstTask.id], true, "Task must be marked as openedWebsite");
console.log('✅ 4. buyWebsiteTask() successfully deducted 1,000 coins and activated opened state.');

console.log('🎉 ALL WEBSITE TASK BUTTON TESTS PASSED!');
