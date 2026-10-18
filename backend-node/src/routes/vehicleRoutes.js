const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const vehicleService = require('../services/vehicleService');

// GET /api/vehicles — List authenticated user's vehicles
router.get('/', authenticate, async (req, res, next) => {
  try {
    const vehicles = await vehicleService.getMyVehicles(req.user.email);
    res.json(vehicles);
  } catch (err) {
    next(err);
  }
});

// GET /api/vehicles/me — Alternative path to list vehicles
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const vehicles = await vehicleService.getMyVehicles(req.user.email);
    res.json(vehicles);
  } catch (err) {
    next(err);
  }
});

// POST /api/vehicles — Register a new vehicle
router.post('/', authenticate, async (req, res, next) => {
  try {
    const vehicle = await vehicleService.registerVehicle(req.user.email, req.body);
    res.status(201).json(vehicle);
  } catch (err) {
    if (err.message.includes('required') || err.message.includes('already registered')) {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
});

// PUT /api/vehicles/:id — Update a vehicle
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const updated = await vehicleService.updateVehicle(req.user.email, req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    if (err.message === 'Vehicle not found') return res.status(404).json({ message: err.message });
    if (err.message.includes('Unauthorized')) return res.status(403).json({ message: err.message });
    next(err);
  }
});

// DELETE /api/vehicles/:id — Delete a vehicle
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await vehicleService.deleteVehicle(req.user.email, req.params.id);
    res.status(204).send();
  } catch (err) {
    if (err.message === 'Vehicle not found') return res.status(404).json({ message: err.message });
    if (err.message.includes('Unauthorized')) return res.status(403).json({ message: err.message });
    next(err);
  }
});

module.exports = router;
