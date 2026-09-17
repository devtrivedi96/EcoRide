const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { authenticate } = require('../middleware/authMiddleware');
const savedLocationService = require('../services/savedLocationService');
const { COLLECTIONS, findOne, update, findById, findAll } = require('../models');

// PUT /api/users/reset-password
router.put('/reset-password', authenticate, async (req, res, next) => {
  try {
    const user = await findOne(COLLECTIONS.USERS, 'email', req.user.email);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await update(COLLECTIONS.USERS, user.id, { password: await bcrypt.hash(req.body.newPassword, 12) });
    res.json({ message: 'Password updated successfully' });
  } catch (err) { next(err); }
});

// GET /api/users/me
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await findOne(COLLECTIONS.USERS, 'email', req.user.email);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const company = user.companyId ? await findById(COLLECTIONS.COMPANIES, user.companyId) : null;
    res.json({
      id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email,
      phoneNumber: user.phoneNumber, role: user.role, companyName: company?.name || null, driverLicense: user.driverLicense,
    });
  } catch (err) { next(err); }
});

// GET /api/users/saved-places
router.get('/saved-places', authenticate, async (req, res, next) => {
  try { res.json(await savedLocationService.getSavedLocations(req.user.email)); } catch (err) { next(err); }
});

// POST /api/users/saved-places
router.post('/saved-places', authenticate, async (req, res, next) => {
  try { res.json(await savedLocationService.addSavedLocation(req.user.email, req.body)); } catch (err) { next(err); }
});

// DELETE /api/users/saved-places/:id
router.delete('/saved-places/:id', authenticate, async (req, res, next) => {
  try {
    await savedLocationService.deleteSavedLocation(req.user.email, req.params.id);
    res.status(200).send();
  } catch (err) { next(err); }
});

module.exports = router;
