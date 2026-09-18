const fs = require('fs');

const tasksJs = fs.readFileSync('frontend/pages/tasks/tasks.js', 'utf8');
const indexHtml = fs.readFileSync('frontend/index.html', 'utf8');

const check1 = tasksJs.includes("monthlyBanner.style.display = subtabName === 'daily' ? 'flex' : 'none'");
const check2 = tasksJs.includes("monthlyBanner.style.display = gameState.taskSubtab === 'daily' ? 'flex' : 'none'");
const checkHtmlHasBanner = indexHtml.includes('id="monthlyCompetitionBanner"');
const checkHtmlHasScript = indexHtml.includes('src="pages/tasks/tasks.js"');

console.log('1. Banner toggle in switchTaskSubtab (tasks.js):', check1);
console.log('2. Banner toggle in renderTasksList (tasks.js):', check2);
console.log('3. index.html includes monthlyCompetitionBanner:', checkHtmlHasBanner);
console.log('4. index.html includes pages/tasks/tasks.js script:', checkHtmlHasScript);

if (check1 && check2 && checkHtmlHasBanner && checkHtmlHasScript) {
  console.log('✅ ALL VERIFICATIONS PASSED: Timer tab/banner is removed when viewing Telegram or Website tabs!');
} else {
  console.error('❌ Verification failed');
  process.exit(1);
}
