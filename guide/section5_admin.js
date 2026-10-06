// section5_admin.js
const fs = require('fs');
const path = require('path');
const { extractFunctionsDetails, extractHtmlElements, getFileSize, getLineCount } = require('./parse_utils');

const ADMIN_PAGES_DIR = path.join(__dirname, 'admin', 'pages');

const ADMIN_PAGE_DESCRIPTIONS = {
  dashboard: "Master operational dashboard displaying real-time server health, total registered users, active sessions, coin economy circulation, and the In-Game Notification Center Broadcaster form allowing administrators to dispatch Global, Event, Maintenance, or Reward Announcement messages directly into player inboxes with interactive deep-link routing.",
  users: "User administration portal allowing admins to search players by Telegram ID or UID, inspect balances, modify currencies, and toggle bans.",
  "account-requests": "Identity verification and conflict management module for approving multi-device linking and resolving duplicate accounts.",
  "ads-manage": "Monetization configuration panel for adjusting Monetag zone IDs, setting ad display frequencies, cooldowns, and page caps.",
  "firebase-manage": "Database utility suite for exporting full JSON backups, importing database snapshots, and testing connection latency.",
  "mega-add": "Custom jackpot and lottery prize pool creation suite for designing new community events with custom ticket costs.",
  "mega-request": "Cashout validation desk for reviewing and approving Level 1000 Cash Prize claims (10,000 Coins) paid via UPI or Paytm.",
  settings: "Global system control module for toggling maintenance mode, broadcasting emergency banners, and editing Level 1 to 1000 configurations.",
  "tasks-web": "Mission management tool for adding, editing, and deleting external partner website browsing and Telegram subscription tasks."
};

function generateAdminSection() {
  let s = [];
  s.push("================================================================================");
  s.push("SECTION 5: ADMIN PORTAL MODULES & CONTROL CENTER (admin/)");
  s.push("================================================================================");
  s.push("");
  s.push("5.1 ADMIN ARCHITECTURE & MODULAR PIPELINE");
  s.push("The admin portal is a high-security internal dashboard accessible at /admin.");
  s.push("It uses the same modular architecture as the player application:");
  s.push("  - Compiled by admin/assemble.js from 9 distinct module directories in admin/pages/.");
  s.push("  - Employs administrative Firebase bridge (admin/shared/firebase.js) for cloud operations.");
  s.push("  - Features high-contrast dark cybersecurity aesthetics (admin/shared/common.css).");
  s.push("");

  const pageDirs = fs.readdirSync(ADMIN_PAGES_DIR).filter(d => fs.statSync(path.join(ADMIN_PAGES_DIR, d)).isDirectory());

  pageDirs.forEach((pageName, idx) => {
    const pageIndex = idx + 2;
    const pagePath = path.join(ADMIN_PAGES_DIR, pageName);
    const htmlFile = path.join(pagePath, `${pageName}.html`);
    const cssFile = path.join(pagePath, `${pageName}.css`);
    const jsFile = path.join(pagePath, `${pageName}.js`);

    const htmlSize = getFileSize(htmlFile);
    const cssSize = getFileSize(cssFile);
    const jsSize = getFileSize(jsFile);
    const jsLines = getLineCount(jsFile);

    const { ids } = extractHtmlElements(htmlFile);
    const funcs = extractFunctionsDetails(jsFile);
    const desc = ADMIN_PAGE_DESCRIPTIONS[pageName] || "Administrative management module.";

    s.push("--------------------------------------------------------------------------------");
    s.push(`5.${pageIndex} ${pageName.toUpperCase()} MODULE (admin/pages/${pageName}/)`);
    s.push("--------------------------------------------------------------------------------");
    s.push(`Summary: ${desc}`);
    s.push(`Files:`);
    s.push(`  - HTML: admin/pages/${pageName}/${pageName}.html (${htmlSize} bytes)`);
    s.push(`  - CSS : admin/pages/${pageName}/${pageName}.css (${cssSize} bytes)`);
    s.push(`  - JS  : admin/pages/${pageName}/${pageName}.js (${jsSize} bytes, ${jsLines} lines)`);
    s.push("");
    s.push(`A. HTML STRUCTURE & DOM ELEMENT IDS:`);
    if (ids.length > 0) {
      s.push(`  Element IDs: ${ids.join(', ')}`);
    } else {
      s.push(`  Element IDs: Scoped admin panel container.`);
    }
    s.push("");
    s.push(`B. JAVASCRIPT FUNCTIONS & IMPLEMENTATION LOGIC (${funcs.length} functions):`);

    if (funcs.length === 0) {
      s.push(`  - Module utilizes declarative server-rendered controls.`);
    } else {
      funcs.forEach((fn, fIdx) => {
        s.push(`  ${fIdx + 1}. Function: ${fn.name}(${fn.params})`);
        s.push(`     - Line Range: Lines ${fn.startLine} to ${fn.endLine}`);
        if (fn.comment) {
          s.push(`     - Description: ${fn.comment}`);
        }
        s.push(`     - Operational Overview:`);
        const bodyText = fn.body.join('\n');
        if (bodyText.includes('fetch(') || bodyText.includes('/api/')) {
          s.push(`       * API Communication: Sends HTTP request to server.js endpoint for administrative data retrieval/mutation.`);
        }
        if (bodyText.includes('firebase') || bodyText.includes('db.')) {
          s.push(`       * Cloud Database: Interacts directly with Google Firebase Firestore / Realtime Database.`);
        }
        if (bodyText.includes('document.getElementById') || bodyText.includes('innerHTML')) {
          s.push(`       * UI Refresh: Renders updated administrative records, data tables, or status badges.`);
        }

        s.push(`     - Line-by-Line Code Overview:`);
        fn.body.slice(0, 5).forEach((bl, blIdx) => {
          const trimmed = bl.trim();
          if (trimmed) {
            s.push(`         Line ${fn.startLine + blIdx}: ${trimmed}`);
          }
        });
        if (fn.body.length > 5) {
          s.push(`         ... [${fn.body.length - 5} additional lines executing operational logic]`);
        }
        s.push("");
      });
    }
    s.push("");
  });

  return s.join('\n');
}

module.exports = { generateAdminSection };
