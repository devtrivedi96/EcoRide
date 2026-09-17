const admin = require('firebase-admin');
const logger = require('./logger');

const { firebaseConfig } = require('./firebaseConfig');

let db;
let clientApp;

/**
 * Firebase Admin SDK initialization for server-side operations (Firestore, Auth, Admin).
 */
function initFirebase() {
  if (admin.apps.length > 0) {
    db = admin.firestore();
    return db;
  }

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId;
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      // Local dev with a downloaded service account JSON
      const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId,
        storageBucket
      });
    } else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      // Individual env-var credentials
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // "\\n" → actual newline
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        storageBucket
      });
    } else {
      // Initialize with application default or project ID
      admin.initializeApp({
        projectId,
        storageBucket
      });
    }

    db = admin.firestore();

    // Keep long-running Node.js connections alive
    db.settings({ ignoreUndefinedProperties: true });

    logger.info(`✅ Firebase Admin initialized (Project: ${projectId}).`);
  } catch (err) {
    logger.error('❌ Firebase initialization failed', { message: err.message });
    throw err;
  }

  return db;
}

function getDb() {
  if (!db) {
    return initFirebase();
  }
  return db;
}

/**
 * Optional: Firebase Client Web SDK initialization (if required for client-side emulation or services)
 */
function initClientFirebase() {
  try {
    const { initializeApp, getApps } = require('firebase/app');
    if (!getApps || getApps().length === 0) {
      clientApp = initializeApp(firebaseConfig);
    }
    return clientApp;
  } catch {
    return null;
  }
}

module.exports = {
  firebaseConfig,
  initFirebase,
  getDb,
  admin,
  initClientFirebase
};
