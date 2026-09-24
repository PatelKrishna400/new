const assert = require('assert');
const fs = require('fs');

console.log("=== VERIFYING RECENT BATCH REQUIREMENTS ===");

// 1. Check spin page tabs removal
const spinHtml = fs.readFileSync('frontend/pages/spin/spin.html', 'utf8');
assert(!spinHtml.includes('subtabSpinOdds'), "Odds tab button must be removed from spin.html");
assert(!spinHtml.includes('subtabSpinRules'), "Rules tab button must be removed from spin.html");
assert(!spinHtml.includes('spinSubtabContentOdds'), "Odds tab content must be removed from spin.html");
assert(!spinHtml.includes('spinSubtabContentRules'), "Rules tab content must be removed from spin.html");
console.log("✅ 1. Spin page tabs ('Prize Odds' and 'Rules') successfully removed!");

// Check assembled frontend/index.html as well
const frontendIndexHtml = fs.readFileSync('frontend/index.html', 'utf8');
assert(!frontendIndexHtml.includes('id="subtabSpinOdds"'), "subtabSpinOdds must not exist in frontend/index.html");
assert(!frontendIndexHtml.includes('id="subtabSpinRules"'), "subtabSpinRules must not exist in frontend/index.html");
assert(!frontendIndexHtml.includes('id="spinSubtabContentOdds"'), "spinSubtabContentOdds must not exist in frontend/index.html");
assert(!frontendIndexHtml.includes('id="spinSubtabContentRules"'), "spinSubtabContentRules must not exist in frontend/index.html");
console.log("✅ 2. Assembled frontend/index.html verified clean of spin tabs!");

// 2. Check Daily Streak Days configuration
const streakJs = fs.readFileSync('frontend/pages/streak/streak.js', 'utf8');
assert(streakJs.includes("darkgreen: 1, label: '+1 Dark Green Fuel'"), "Day 1 must award 1 Dark Green Fuel");
assert(streakJs.includes("blueCoins: 10, label: '+10 Blue Coins'"), "Day 2 must award 10 Blue Coins");
assert(streakJs.includes("green: 2, label: '+2 Green Fuel'"), "Day 6 must award 2 Green Fuel");
assert(streakJs.includes("diamonds: 1, label: '+1 Diamond'"), "Day 7 must award 1 Diamond");
console.log("✅ 3. Daily Streak Rewards verified: Day 1: 1 Dark Green Fuel, Day 2: 10 Blue Coins, Day 6: 2 Green Fuel, Day 7: 1 Diamond!");

// 3. Check Shop Prices
const profileHtml = fs.readFileSync('frontend/pages/profile/profile.html', 'utf8');
assert(profileHtml.includes("buyItemWithBlueCoins('key', 500)"), "Key costs 500 Blue Coins");
assert(profileHtml.includes("buyItemWithBlueCoins('ticket', 250)"), "Ticket costs 250 Blue Coins");
assert(profileHtml.includes("buyItemWithBlueCoins('scratchCard', 750)"), "Card costs 750 Blue Coins");
assert(profileHtml.includes("buyEggsWithAd()"), "Eggs can be bought with Ad (10 eggs)");
assert(profileHtml.includes("buyEggsWithDiamonds(5)"), "Eggs can be bought with 5 Diamonds (10 eggs)");
console.log("✅ 4. Shop prices verified (500 Key, 250 Ticket, 750 Card, 10 Eggs via Ad / 5 Diamonds)!");

// 4. Check Viewport Paddings for proper full-page view
const scratchCss = fs.readFileSync('frontend/pages/scratch/scratch.css', 'utf8');
assert(scratchCss.includes('padding: 6px 12px 85px 12px !important;'), "Scratch page has 85px bottom padding");

const chestCss = fs.readFileSync('frontend/pages/chest/chest.css', 'utf8');
assert(chestCss.includes('padding: 6px 12px 85px 12px !important;'), "Chest page has 85px bottom padding");

const eggCss = fs.readFileSync('frontend/pages/egg/egg.css', 'utf8');
assert(eggCss.includes('padding: 6px 12px 85px 12px !important;'), "Egg page has 85px bottom padding");

const spinCss = fs.readFileSync('frontend/pages/spin/spin.css', 'utf8');
assert(spinCss.includes('padding: 6px 12px 85px 12px !important;'), "Spin page has 85px bottom padding");
console.log("✅ 5. Full-page viewports verified for Scratch, Chest, Egg, and Spin pages!");

console.log("\n🎉 ALL BATCH REQUIREMENTS PASSED 100%!");
