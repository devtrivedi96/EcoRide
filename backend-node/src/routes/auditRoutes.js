const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');
const { getAuditLogs } = require('../services/auditService');

/**
 * Equivalent to Spring Boot AdminAuditController - /api/audit
 */

// GET /api/audit/logs — Get all in-memory audit logs
router.get('/logs', authenticate, requireAdmin, (req, res) => {
  res.json(getAuditLogs());
});

module.exports = router;
