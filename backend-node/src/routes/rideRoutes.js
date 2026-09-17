const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const rideService = require('../services/rideService');

/**
 * Equivalent to Spring Boot RideController - /api/rides
 */

// GET /api/rides — List all available/upcoming rides
router.get('/', authenticate, async (req, res, next) => {
  try {
    const rides = await rideService.getAvailableLocations();
    res.json(rides);
  } catch (err) { next(err); }
});

// POST /api/rides — Publish a ride
router.post('/', authenticate, async (req, res, next) => {
  try {
    const result = await rideService.publishRide(req.user.email, req.body);
    res.json(result);
  } catch (err) { next(err); }
});

// GET /api/rides/search — Search rides
router.get('/search', authenticate, async (req, res, next) => {
  try {
    const { pickupLocation, destination, departureTime, seats = 1 } = req.query;
    const result = await rideService.searchRides(pickupLocation, destination, departureTime, parseInt(seats));
    res.json(result);
  } catch (err) { next(err); }
});

// GET /api/rides/locations — Available pickup/destination locations
router.get('/locations', authenticate, async (req, res, next) => {
  try {
    res.json(await rideService.getAvailableLocations());
  } catch (err) { next(err); }
});

// GET /api/rides/me — Driver's own rides
router.get('/me', authenticate, async (req, res, next) => {
  try {
    res.json(await rideService.getDriverRides(req.user.email));
  } catch (err) { next(err); }
});

// PUT /api/rides/:id — Update a ride
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    res.json(await rideService.updateMyRide(req.params.id, req.user.email, req.body));
  } catch (err) { next(err); }
});

// DELETE /api/rides/:id — Delete a ride
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await rideService.deleteRide(req.params.id, req.user.email);
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;
