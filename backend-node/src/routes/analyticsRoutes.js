const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const analyticsService = require('../services/analyticsService');
const pdfService = require('../services/pdfService');

/**
 * Equivalent to Spring Boot AnalyticsController - /api/analytics
 */

// GET /api/analytics/dashboard
router.get('/dashboard', authenticate, async (req, res, next) => {
  try {
    res.json(await analyticsService.getCompanyDashboard(req.user.email));
  } catch (err) { next(err); }
});

// GET /api/analytics/dashboard/pdf
router.get('/dashboard/pdf', authenticate, async (req, res, next) => {
  try {
    const dto = await analyticsService.getCompanyDashboard(req.user.email);
    const pdfBuffer = await pdfService.generateAdminAnalyticsPdfReport(dto);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=admin-analytics.pdf',
    });
    res.send(pdfBuffer);
  } catch (err) { next(err); }
});

module.exports = router;
