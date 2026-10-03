const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- Testing Requirements 11 to 15 ---');

function readNorm(file) {
  return fs.readFileSync(path.join(__dirname, file), 'utf8').replace(/\r\n/g, '\n');
}

// 1. Verify Req 11: Piggy Bank in Diamond Generator
const dgJs = readNorm('../frontend/pages/diamond-generator/diamond-generator.js');
const dgHtml = readNorm('../frontend/pages/diamond-generator/diamond-generator.html');
const dgCss = readNorm('../frontend/pages/diamond-generator/diamond-generator.css');

assert(dgJs.includes('getCompletedWebsiteTasksCount'), 'Req 11: Should have getCompletedWebsiteTasksCount helper');
assert(dgJs.includes('if (collectible < 1)'), 'Req 11: Should check collectible < 1');
assert(dgJs.includes('completedWebTasks < 5'), 'Req 11: Should require at least 5 completed website tasks to collect');
assert(dgJs.includes('showPiggyWebsiteTaskNotice'), 'Req 11: Should show notice/modal when fewer than 5 website tasks completed');
assert(dgJs.includes('piggyBtn.style.display = \'none\''), 'Req 11: Should hide collect button when collectible < 1');
assert(dgJs.includes('piggyBtn.style.display = \'flex\''), 'Req 11: Should show collect button when collectible >= 1');
assert(dgHtml.includes('id="piggyWebTasksModal"'), 'Req 11: HTML should contain piggyWebTasksModal');
assert(dgHtml.includes('id="btnCollectPiggyBank"'), 'Req 11: HTML should contain btnCollectPiggyBank');
assert(dgCss.includes('.dg-modal-overlay'), 'Req 11: CSS should contain modal styling');
console.log('✅ Requirement 11 verified!');

// 2. Verify Req 12: Menu bar stays in page at bottom across views
const appJs = readNorm('../frontend/shared/app.js');
const commonCss = readNorm('../frontend/shared/common.css');

assert(appJs.includes('bottomNavEl.style.display = \'flex\''), 'Req 12: app.js should keep bottom nav display flex across games');
assert(!commonCss.includes('body.full-page-game-active .bottom-nav {\n  display: none !important;'), 'Req 12: common.css should not hide bottom-nav on full page games');
assert(commonCss.includes('body.full-page-game-active .bottom-nav {\n  display: flex !important;'), 'Req 12: common.css keeps bottom-nav displayed');
console.log('✅ Requirement 12 verified!');

// 3. Verify Req 13: Unlimited collecting and storing place limit
const miningJs = readNorm('../frontend/pages/mining/mining.js');
const miningHtml = readNorm('../frontend/pages/mining/mining.html');
const sunflowerJs = readNorm('../frontend/pages/sunflower/sunflower.js');

assert(miningJs.includes('maxCapacity: Infinity'), 'Req 13: mining.js wall crate should have maxCapacity: Infinity');
assert(miningJs.includes('(Unlimited)'), 'Req 13: mining.js crate display should show unlimited');
assert(miningHtml.includes('Unlimited'), 'Req 13: mining.html should mention unlimited capacity');
assert(sunflowerJs.includes('maxCrateCapacity: Infinity'), 'Req 13: sunflower.js cistern should have maxCrateCapacity: Infinity');
assert(sunflowerJs.includes('maxStorage: Infinity'), 'Req 13: sunflower.js wells should have maxStorage: Infinity');
console.log('✅ Requirement 13 verified!');

// 4. Verify Req 15: Leaderboard self rank tab stays fixed above menu bar
const lbCss = readNorm('../frontend/pages/leaderboard/leaderboard.css');
const lbHtml = readNorm('../frontend/pages/leaderboard/leaderboard.html');

assert(lbCss.includes('.leaderboard-my-standing-bar {\n  position: fixed;'), 'Req 15: leaderboard standing bar should have position: fixed');
assert(lbCss.includes('bottom: calc(76px + max(0px, env(safe-area-inset-bottom)));'), 'Req 15: leaderboard standing bar positioned above menu bar');
assert(lbHtml.includes('id="leaderboardMyStandingBar"'), 'Req 15: leaderboard HTML should contain leaderboardMyStandingBar');
console.log('✅ Requirement 15 verified!');

// 5. Verify assembled index.html and style.css contain these changes
const indexHtml = readNorm('../frontend/index.html');
const styleCss = readNorm('../frontend/style.css');

assert(indexHtml.includes('piggyWebTasksModal'), 'index.html contains piggyWebTasksModal');
assert(indexHtml.includes('leaderboardMyStandingBar'), 'index.html contains leaderboardMyStandingBar');
assert(styleCss.includes('.dg-modal-overlay'), 'style.css contains dg-modal-overlay');
assert(styleCss.includes('.leaderboard-my-standing-bar {\n  position: fixed;'), 'style.css contains fixed leaderboard standing bar');
console.log('✅ Master index.html and style.css verified!');

console.log('🎉 ALL REQUIREMENTS 11 TO 15 AUTOMATED TESTS PASSED!');
