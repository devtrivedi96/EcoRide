/**
 * Firestore collection names + helper functions.
 * Replaces Sequelize models — no ORM, just lightweight wrappers over Firestore.
 *
 * All documents use Firestore's auto-generated string IDs (exposed as `id`).
 * Fields use camelCase to match the existing API response shape.
 */
const { getDb } = require('../config/firebase');

// ── Collection name constants ──────────────────────────────────────────────
const COLLECTIONS = {
  COMPANIES:           'companies',
  USERS:               'users',
  COMPANY_SETTINGS:    'companySettings',
  SAVED_LOCATIONS:     'savedLocations',
  PASSWORD_RESET:      'passwordResetTokens',
  VEHICLES:            'vehicles',
  RIDES:               'rides',
  TRIPS:               'trips',
  WALLETS:             'wallets',
  TRANSACTIONS:        'paymentTransactions',
  CHAT:                'chatMessages',
  AUDIT:               'auditLogs',
};

// ── Low-level helpers ──────────────────────────────────────────────────────

/** Convert a Firestore DocumentSnapshot → plain JS object (with id). */
function docToObj(doc) {
  if (!doc || !doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

/** Convert a Firestore QuerySnapshot → array of plain JS objects. */
function snapshotToArray(snapshot) {
  return snapshot.docs.map(docToObj);
}

/** Get a single doc by its Firestore document ID. */
async function findById(collection, id) {
  const db = getDb();
  const doc = await db.collection(collection).doc(String(id)).get();
  return docToObj(doc);
}

/**
 * Find the FIRST document matching a single field equality.
 * e.g. findOne('users', 'email', 'alice@acme.com')
 */
async function findOne(collection, field, value) {
  const db = getDb();
  const snap = await db.collection(collection).where(field, '==', value).limit(1).get();
  if (snap.empty) return null;
  return docToObj(snap.docs[0]);
}

/** Get ALL documents in a collection (optionally with simple where clauses). */
async function findAll(collection, wheres = []) {
  const db = getDb();
  let query = db.collection(collection);
  for (const [field, op, value] of wheres) {
    query = query.where(field, op, value);
  }
  const snap = await query.get();
  return snapshotToArray(snap);
}

/** Create a new document (auto-ID). Returns the created object with id. */
async function create(collection, data) {
  const db = getDb();
  const now = new Date().toISOString();
  const payload = { ...data, createdAt: now, updatedAt: now };
  const ref = await db.collection(collection).add(payload);
  return { id: ref.id, ...payload };
}

/** Upsert a document with a KNOWN id (e.g. during seeding). */
async function set(collection, id, data) {
  const db = getDb();
  const now = new Date().toISOString();
  const payload = { ...data, createdAt: now, updatedAt: now };
  await db.collection(collection).doc(String(id)).set(payload, { merge: true });
  return { id: String(id), ...payload };
}

/** Update specific fields on an existing document. */
async function update(collection, id, data) {
  const db = getDb();
  const payload = { ...data, updatedAt: new Date().toISOString() };
  await db.collection(collection).doc(String(id)).update(payload);
  return findById(collection, id);
}

/** Delete a document by ID. */
async function remove(collection, id) {
  const db = getDb();
  await db.collection(collection).doc(String(id)).delete();
}

/** Delete all documents matching a query. */
async function removeWhere(collection, field, value) {
  const db = getDb();
  const snap = await db.collection(collection).where(field, '==', value).get();
  const batch = db.batch();
  snap.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
}

/** Count documents in a collection (optionally filtered). */
async function count(collection, wheres = []) {
  const docs = await findAll(collection, wheres);
  return docs.length;
}

/**
 * Run a Firestore transaction — callback receives the Firestore `transaction` object.
 * Returns whatever the callback returns.
 */
async function runTransaction(callback) {
  const db = getDb();
  return db.runTransaction(callback);
}

// In-memory audit log array (backward-compat with auditService)
const auditLogs = [];

module.exports = {
  COLLECTIONS,
  findById,
  findOne,
  findAll,
  create,
  set,
  update,
  remove,
  removeWhere,
  count,
  runTransaction,
  auditLogs,
  getDb,
};
