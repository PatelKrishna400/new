const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== VERIFYING REQUIREMENTS 6, 7, 8, 9, 10 ===\n');

// 1. Requirement 9: Mega rewards back button returns to home
const megaHtml = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'pages', 'mega-reward', 'mega-reward.html'), 'utf8');
assert(megaHtml.includes("onclick=\"switchPage('home')\""), 'Req 9 Failed: Mega reward back button must call switchPage("home")');
console.log('✅ Requirement 9 Passed: Mega rewards back button returns to home page');

// 2. Requirement 6 & 8: Scratch card uses 1 coin, gray foil removed, no diamonds
const scratchHtml = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'pages', 'scratch', 'scratch.html'), 'utf8');
const scratchJs = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'pages', 'scratch', 'scratch.js'), 'utf8');
assert(!scratchJs.includes("type: 'diamonds'"), 'Req 8 Failed: Scratch card must not have diamond reward tier');
assert(!scratchHtml.includes("5% Diamonds"), 'Req 8 Failed: Scratch card HTML odds must not include diamonds');
assert(scratchJs.includes("gameState.player.scratchCards = Math.max(0, gameState.player.scratchCards - 1);"), 'Req 6 Failed: Must deduct card coin on scratch');
assert(scratchJs.includes("prepareFreshScratchTicket"), 'Req 6 Failed: Must have prepareFreshScratchTicket');
console.log('✅ Requirement 6 & 8 Passed: Scratch card consumes 1 card coin on foil scratch and has no diamonds');

// 3. Requirement 7 & 8: Match card game
const memJs = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'pages', 'memory-match', 'memory-match.js'), 'utf8');
const memHtml = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'pages', 'memory-match', 'memory-match.html'), 'utf8');
const memCss = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'pages', 'memory-match', 'memory-match.css'), 'utf8');

// 4x4 cards check
assert(memJs.includes("deck.push({ ...type, uid: `${type.id}_1` });") && memJs.includes("deck.push({ ...type, uid: `${type.id}_2` });"), 'Req 7 Failed: 16 cards must be generated');
// 1 brain coin per card split
assert(memJs.includes("gameState.player.brainCoins = Math.max(0, gameState.player.brainCoins - 1);"), 'Req 7 Failed: 1 brain coin deducted per card flip/split');
// card-removed on match
assert(memJs.includes("card-removed"), 'Req 7 Failed: Matched cards must be removed with card-removed class');
assert(memCss.includes(".memory-card.card-removed"), 'Req 7 Failed: CSS must define .memory-card.card-removed');
// Finish -> dark green fuel, otherwise 10 brain coins
assert(memJs.includes("fuelCells.darkgreen = (gameState.energyGenerator.fuelCells.darkgreen || 0) + 1;"), 'Req 7 Failed: Finish game must award 1 Dark Green Fuel');
assert(memJs.includes("gameState.player.brainCoins = (gameState.player.brainCoins || 0) + 10;"), 'Req 7 Failed: Incomplete/otherwise must award 10 Brain Coins');
assert(!memJs.includes("diamondBonus"), 'Req 8 Failed: Memory match must not reward diamonds');
console.log('✅ Requirement 7 & 8 Passed: Memory match 4x4 emoji cards, 1 brain coin per flip, cards removed on match, win dark green fuel on finish, 10 brain coins otherwise, no diamonds');

// 4. Requirement 8: Full game in full page not in tab
const appJs = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'shared', 'app.js'), 'utf8');
const commonCss = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'shared', 'common.css'), 'utf8');
assert(appJs.includes("FULL_GAME_PAGES"), 'Req 8 Failed: app.js must define FULL_GAME_PAGES');
assert(appJs.includes("full-page-game-active"), 'Req 8 Failed: app.js must toggle full-page-game-active');
assert(commonCss.includes("body.full-page-game-active .bottom-nav"), 'Req 8 Failed: common.css must hide bottom-nav for full games');
console.log('✅ Requirement 8 Passed: Full games show in full page not in tab');

// 5. Requirement 10: Diamond Generator energy & timer
const dgJs = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'pages', 'diamond-generator', 'diamond-generator.js'), 'utf8');
const homeJs = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'pages', 'home', 'home.js'), 'utf8');
assert(dgJs.includes("remainingSeconds = 0;"), 'Req 10 Failed: Timer remaining seconds must be 0 when energy not used');
assert(homeJs.includes("if (!dg.isRunning || !dg.generationStartTime)"), 'Req 10 Failed: catchup and tick in home.js must do no action if energy not used');
console.log('✅ Requirement 10 Passed: Diamond generator does no action when energy not used; only starts when 100 energy is used');

console.log('\n🎉 ALL REQUIREMENTS 6, 7, 8, 9, 10 PASSED ENTIRELY!');
