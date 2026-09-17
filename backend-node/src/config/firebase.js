const admin = require('firebase-admin');
const logger = require('./logger');

/**
 * Firebase Admin SDK initialization.
 * Supports two credential modes:
 *   1. Service account JSON file (FIREBASE_SERVICE_ACCOUNT_PATH)
 *   2. Individual env vars (FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY)
 *      — preferred for Docker / CI/CD / cloud deployments
 */
let db;

function initFirebase() {
  if (admin.apps.length > 0) {
    db = admin.firestore();
    return db;
  }

  try {
    let credential;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      // Local dev with a downloaded service account JSON
      const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      credential = admin.credential.cert(serviceAccount);
    } else {
      // Production: individual env-var credentials
      credential = admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // "\\n" → actual newline (common issue in dotenv)
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      });
    }

    admin.initializeApp({ credential });

    db = admin.firestore();

    // Keep long-running Node.js connections alive
    db.settings({ ignoreUndefinedProperties: true });

    logger.info('✅ Firebase Firestore connected.');
  } catch (err) {
    logger.error('❌ Firebase initialization failed', { message: err.message });
    throw err;
  }

  return db;
}

function getDb() {
  if (!db) throw new Error('Firestore not initialized. Call initFirebase() first.');
  return db;
}

module.exports = { initFirebase, getDb, admin };
