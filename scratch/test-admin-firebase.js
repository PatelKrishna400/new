const fs = require('fs');

const adminHtml = fs.readFileSync('admin/index.html', 'utf8');
const firebaseJs = fs.readFileSync('admin/shared/firebase.js', 'utf8');

const checks = [
  { name: 'Firebase App SDK in admin/index.html', ok: adminHtml.includes('firebase-app-compat.js') },
  { name: 'Firebase Auth SDK in admin/index.html', ok: adminHtml.includes('firebase-auth-compat.js') },
  { name: 'Firebase Database SDK in admin/index.html', ok: adminHtml.includes('firebase-database-compat.js') },
  { name: 'shared/firebase.js in admin/index.html', ok: adminHtml.includes('src="shared/firebase.js"') },
  { name: 'ADMIN_SECURITY_KEY defined in admin/index.html', ok: adminHtml.includes('ADMIN_SECURITY_KEY = \'0911\'') },
  { name: 'pendingSecurityAction defined in admin/index.html', ok: adminHtml.includes('pendingSecurityAction = null') },
  { name: 'Error handlers in admin/shared/firebase.js', ok: firebaseJs.includes('onFirebasePermissionError(err, \'/players\')') },
  { name: 'Fallback loader in admin/shared/firebase.js', ok: firebaseJs.includes('loadFallbackDataSources()') },
  { name: 'Rules warning copy in admin/shared/firebase.js', ok: firebaseJs.includes('copyFirebaseRulesToClipboard') }
];

console.log('--- Admin Firebase Integration Verification ---');
let allPassed = true;
checks.forEach(c => {
  console.log(`${c.ok ? '✅' : '❌'} ${c.name}`);
  if (!c.ok) allPassed = false;
});

if (allPassed) {
  console.log('\n🎉 ALL ADMIN VERIFICATION CHECKS PASSED!');
} else {
  console.error('\n❌ SOME CHECKS FAILED!');
  process.exit(1);
}
