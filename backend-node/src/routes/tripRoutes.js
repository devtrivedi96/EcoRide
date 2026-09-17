const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const tripService = require('../services/tripService');
const pdfService = require('../services/pdfService');

/**
 * Equivalent to Spring Boot TripController - /api/trips
 */

// POST /api/trips — Book a trip
router.post('/', authenticate, async (req, res, next) => {
  try {
    res.json(await tripService.bookTrip(req.user.email, req.body));
  } catch (err) { next(err); }
});

// GET /api/trips/me — Passenger's booked trips
router.get('/me', authenticate, async (req, res, next) => {
  try {
    res.json(await tripService.getPassengerTrips(req.user.email));
  } catch (err) { next(err); }
});

// GET /api/trips/me/pdf — Download PDF report
router.get('/me/pdf', authenticate, async (req, res, next) => {
  try {
    const trips = await tripService.getPassengerTrips(req.user.email);
    const pdfBuffer = await pdfService.generateEmployeePdfReport(req.user.email, trips);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=my-trips-report.pdf',
    });
    res.send(pdfBuffer);
  } catch (err) { next(err); }
});

// GET /api/trips/driver — Driver's trip requests
router.get('/driver', authenticate, async (req, res, next) => {
  try {
    res.json(await tripService.getDriverTrips(req.user.email));
  } catch (err) { next(err); }
});

// PATCH /api/trips/:tripId/status — Update trip status
router.patch('/:tripId/status', authenticate, async (req, res, next) => {
  try {
    res.json(await tripService.updateTripStatus(req.params.tripId, req.query.status, req.user.email));
  } catch (err) { next(err); }
});

// PATCH /api/trips/:tripId/cancel — Passenger cancels trip
router.patch('/:tripId/cancel', authenticate, async (req, res, next) => {
  try {
    res.json(await tripService.cancelTripAsPassenger(req.params.tripId, req.user.email));
  } catch (err) { next(err); }
});

// POST /api/trips/:tripId/accept — Driver accepts
router.post('/:tripId/accept', authenticate, async (req, res, next) => {
  try {
    res.json(await tripService.acceptTrip(req.params.tripId, req.user.email));
  } catch (err) { next(err); }
});

// POST /api/trips/:tripId/reject — Driver rejects
router.post('/:tripId/reject', authenticate, async (req, res, next) => {
  try {
    res.json(await tripService.rejectTrip(req.params.tripId, req.user.email));
  } catch (err) { next(err); }
});

// POST /api/trips/:tripId/verify-otp — Verify OTP and start trip
router.post('/:tripId/verify-otp', authenticate, async (req, res, next) => {
  try {
    res.json(await tripService.verifyOtpAndStartTrip(req.params.tripId, req.query.otp, req.user.email));
  } catch (err) { next(err); }
});

module.exports = router;
