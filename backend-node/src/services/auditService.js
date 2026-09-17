const { auditLogs, create, COLLECTIONS } = require('../models');
const logger = require('../config/logger');

async function logEvent(eventType, userEmail, details, ipAddress = 'IP_NOT_CAPTURED') {
  const entry = { eventTime: new Date().toISOString(), eventType, userEmail, details, ipAddress };
  auditLogs.unshift(entry);
  logger.info(`[AUDIT] ${eventType} | ${userEmail} | ${details}`);

  // Persist to Firestore asynchronously (non-blocking)
  try {
    await create(COLLECTIONS.AUDIT, entry);
  } catch (e) {
    logger.warn('Audit Firestore write failed — log kept in-memory only');
  }
}

function getAuditLogs() { return [...auditLogs]; }

module.exports = { logEvent, getAuditLogs };
