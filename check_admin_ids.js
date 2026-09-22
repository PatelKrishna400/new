const fs = require('fs');
const path = require('path');

const html = fs.readFileSync('admin/index.html', 'utf8');

const PAGE_KEYS = [
  'dashboard',
  'users',
  'mega-add',
  'mega-request',
  'tasks-web',
  'firebase-manage',
  'ads-manage',
  'settings'
];

let jsFiles = ['admin/shared/firebase.js'];
PAGE_KEYS.forEach(k => {
  jsFiles.push(path.join('admin', 'pages', k, `${k}.js`));
});

console.log('Checking getElementById across admin scripts...');
let missingIds = [];

jsFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.match(/getElementById\(['"`]([a-zA-Z0-9_-]+)['"`]\)/g) || [];
  matches.forEach(m => {
    const id = m.match(/getElementById\(['"`]([a-zA-Z0-9_-]+)['"`]\)/)[1];
    // Dynamic IDs like tgTitle_${task.id} or wtTitle_${t.id} are skipped
    if (id.includes('$')) return;
    // Check if id exists in html
    if (!html.includes(`id="${id}"`) && !html.includes(`id='${id}'`)) {
      missingIds.push({ file, id });
    }
  });
});

console.log(`Found ${missingIds.length} potentially missing element IDs:`);
missingIds.forEach(item => {
  console.log(`  - [${item.file}] Missing: #${item.id}`);
});
