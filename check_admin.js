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

let allJs = html;
PAGE_KEYS.forEach(k => {
  const p = path.join('admin', 'pages', k, `${k}.js`);
  if (fs.existsSync(p)) {
    allJs += '\n' + fs.readFileSync(p, 'utf8');
  }
});
allJs += '\n' + fs.readFileSync('admin/shared/firebase.js', 'utf8');

const onclickMatches = html.match(/onclick="([^"]+)"/g) || [];
const onchangeMatches = html.match(/onchange="([^"]+)"/g) || [];
const onsubmitMatches = html.match(/onsubmit="([^"]+)"/g) || [];
const oninputMatches = html.match(/oninput="([^"]+)"/g) || [];

const allMatches = [...onclickMatches, ...onchangeMatches, ...onsubmitMatches, ...oninputMatches];
const functionNames = new Set();
allMatches.forEach(m => {
  const fnMatch = m.match(/on[a-z]+="([a-zA-Z0-9_]+)\(/);
  if (fnMatch) functionNames.add(fnMatch[1]);
});

console.log(`Checking ${functionNames.size} inline event handlers across all admin scripts...`);
let missing = [];
functionNames.forEach(fn => {
  const hasDef = allJs.includes(`function ${fn}`) || 
                 allJs.includes(`window.${fn}`) || 
                 allJs.includes(`${fn} =`) || 
                 allJs.includes(`${fn}:`);
  if (!hasDef) {
    missing.push(fn);
  }
});

if (missing.length === 0) {
  console.log('✅ All handler functions are defined in admin scripts!');
} else {
  console.log('❌ Missing functions:', missing);
}
