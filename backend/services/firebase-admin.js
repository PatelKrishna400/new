/**
 * BACKEND SERVICE: FIREBASE ADMIN (backend/services/firebase-admin.js)
 * Firebase Admin SDK initialization & privileged database operations.
 */

let adminInstance = null;
let dbInstance = null;

function initFirebaseAdmin() {
  if (adminInstance) return { admin: adminInstance, db: dbInstance };

  try {
    const admin = require('firebase-admin');
    if (admin.apps && admin.apps.length > 0) {
      adminInstance = admin;
      dbInstance = admin.database();
      return { admin: adminInstance, db: dbInstance };
    }

    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : null;

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://tap-empire-default-rtdb.firebaseio.com'
      });
      adminInstance = admin;
      dbInstance = admin.database();
      console.log('✅ Firebase Admin SDK initialized with Service Account.');
    }
  } catch (err) {
    // Graceful fallback when firebase-admin package or credentials are not provisioned
    // Backend operates in memory/REST fallback mode
  }

  return { admin: adminInstance, db: dbInstance };
}

module.exports = {
  initFirebaseAdmin,
  getAdmin: () => adminInstance,
  getDb: () => dbInstance
};
