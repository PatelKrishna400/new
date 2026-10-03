const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('Testing Diamond 💎 and Blue Coin 💙 icon requirements...');

const frontendIndex = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');
const adminIndex = fs.readFileSync(path.join(__dirname, '../admin/index.html'), 'utf8');
const adminDashboardHtml = fs.readFileSync(path.join(__dirname, '../admin/pages/dashboard/dashboard.html'), 'utf8');
const adminDashboardJs = fs.readFileSync(path.join(__dirname, '../admin/pages/dashboard/dashboard.js'), 'utf8');
const adminFirebaseJs = fs.readFileSync(path.join(__dirname, '../admin/shared/firebase.js'), 'utf8');
const streakJs = fs.readFileSync(path.join(__dirname, '../frontend/pages/streak/streak.js'), 'utf8');
const spinJs = fs.readFileSync(path.join(__dirname, '../frontend/pages/spin/spin.js'), 'utf8');
const profileHtml = fs.readFileSync(path.join(__dirname, '../frontend/pages/profile/profile.html'), 'utf8');
const profileJs = fs.readFileSync(path.join(__dirname, '../frontend/pages/profile/profile.js'), 'utf8');

// 1. Verify no remaining 🔷 in frontend/index.html and admin/index.html
assert(!frontendIndex.includes('🔷'), 'frontend/index.html must not contain 🔷');
assert(!adminIndex.includes('🔷'), 'admin/index.html must not contain 🔷');
console.log('✅ 1. No 🔷 found in frontend/index.html or admin/index.html');

// 2. Admin Dashboard tests
assert(adminDashboardHtml.includes('dashTotalDiamonds'), 'Admin dashboard must include dashTotalDiamonds');
assert(adminDashboardHtml.includes('dashTotalBlueCoins'), 'Admin dashboard must include dashTotalBlueCoins');
assert(adminDashboardHtml.includes('Diamonds in Circulation'), 'Admin dashboard must display Diamonds in Circulation card');
assert(adminDashboardHtml.includes('Blue Coins in Circulation'), 'Admin dashboard must display Blue Coins in Circulation card');
assert(adminDashboardJs.includes("elDiamonds.title = `${d.toLocaleString()} Diamonds 💎`"), 'Dashboard JS must set Diamonds 💎');
assert(adminDashboardJs.includes("elBlueCoins.title = `${b.toLocaleString()} Blue Coins 💙`"), 'Dashboard JS must set Blue Coins 💙');
assert(adminFirebaseJs.includes('totalDiamonds += Number(u.diamonds || 0)'), 'Firebase JS must aggregate totalDiamonds');
assert(adminFirebaseJs.includes('totalBlueCoins: totalBlueCoins'), 'Firebase JS must return totalBlueCoins');
console.log('✅ 2. Admin Dashboard successfully updated with Diamonds 💎 and Blue Coins 💙');

// 3. Admin Users and Settings tests
assert(adminIndex.includes('BLUE COINS 💙'), 'Admin users page must display BLUE COINS 💙');
assert(adminIndex.includes('Blue Coins 💙'), 'Admin edit/add modals must have Blue Coins 💙');
assert(adminIndex.includes('DIAMONDS 💎'), 'Admin users page must display DIAMONDS 💎');
assert(adminIndex.includes('Diamonds 💎'), 'Admin edit/add modals must have Diamonds 💎');
assert(adminIndex.includes('💙 Blue Coins'), 'Admin settings page must have 💙 Blue Coins');
assert(adminIndex.includes('💎 Diamonds'), 'Admin settings page must have 💎 Diamonds');
console.log('✅ 3. Admin Users and Settings pages verified with 💎 and 💙');

// 4. User Panel tests
assert(streakJs.includes("day: 2, icon: '💙'"), 'Streak Day 2 must use icon 💙');
assert(streakJs.includes("day: 7, icon: '💎'"), 'Streak Day 7 must use icon 💎');
assert(spinJs.includes("icon: '💙'"), 'Spin prizes must use icon 💙');
assert(frontendIndex.includes('500 Blue</span>') || frontendIndex.includes('500 Blue'), 'Shop includes 500 Blue');
assert(frontendIndex.includes('<span class="method-icon" style="font-size: 15px;">💙</span>'), 'Shop buy buttons must use 💙');
assert(profileHtml.includes('id="profileDiamondBalance"'), 'Profile must have Diamond balance');
assert(profileHtml.includes('id="profileBlueCoinBalance"'), 'Profile must have Blue Coin balance');
assert(profileJs.includes("icon: '💙'"), 'Fuel cell blue config must use icon 💙');
console.log('✅ 4. User Panel pages verified with 💎 and 💙');

console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
