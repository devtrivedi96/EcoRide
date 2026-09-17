const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');
const adminService = require('../services/adminService');
const { COLLECTIONS, findById, findAll, create, update, remove, removeWhere, count, getDb } = require('../models');

// POST /api/admin/drivers/onboard
router.post('/drivers/onboard', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phoneNumber, driverLicense, vehicleModel, vehicleRegistration, seatingCapacity, insuranceDocument, registrationDocument, pollutionDocument } = req.body;

    const existing = await require('../models').findOne(COLLECTIONS.USERS, 'email', email);
    if (existing) return res.status(400).json({ message: 'Email already in use' });

    const emailDomain = email.substring(email.indexOf('@') + 1);
    let company = await require('../models').findOne(COLLECTIONS.COMPANIES, 'emailDomain', emailDomain);
    if (!company) company = await create(COLLECTIONS.COMPANIES, { name: emailDomain, emailDomain, active: true });

    const user = await create(COLLECTIONS.USERS, {
      firstName, lastName, email, password: await bcrypt.hash(password, 12),
      phoneNumber, driverLicense, role: 'EMPLOYEE', companyId: company.id,
    });

    await create(COLLECTIONS.WALLETS, { userId: user.id, balance: 0 });
    await create(COLLECTIONS.VEHICLES, {
      ownerId: user.id, model: vehicleModel, registrationNumber: vehicleRegistration,
      seatingCapacity: seatingCapacity || 4, insuranceDocument, registrationDocument, pollutionDocument,
    });

    res.json(mapUserDto(user, company));
  } catch (err) { next(err); }
});

// DELETE /api/admin/users/:userId
router.delete('/users/:userId', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const wallet = await require('../models').findOne(COLLECTIONS.WALLETS, 'userId', userId);
    if (wallet) {
      await removeWhere(COLLECTIONS.TRANSACTIONS, 'walletId', wallet.id);
      await remove(COLLECTIONS.WALLETS, wallet.id);
    }
    const vehicles = await findAll(COLLECTIONS.VEHICLES, [['ownerId', '==', userId]]);
    for (const v of vehicles) await remove(COLLECTIONS.VEHICLES, v.id);
    await remove(COLLECTIONS.USERS, userId);
    res.status(200).send();
  } catch (err) { next(err); }
});

// DELETE /api/admin/vehicles/:vehicleId
router.delete('/vehicles/:vehicleId', authenticate, requireAdmin, async (req, res, next) => {
  try {
    await remove(COLLECTIONS.VEHICLES, req.params.vehicleId);
    res.status(200).send();
  } catch (err) { next(err); }
});

// PUT /api/admin/users/:userId
router.put('/users/:userId', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const user = await findById(COLLECTIONS.USERS, req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const updated = await update(COLLECTIONS.USERS, req.params.userId, {
      firstName: req.body.firstName || user.firstName,
      lastName:  req.body.lastName  || user.lastName,
      phoneNumber: req.body.phoneNumber || user.phoneNumber,
      ...(req.body.email ? { email: req.body.email } : {}),
    });
    const company = updated.companyId ? await findById(COLLECTIONS.COMPANIES, updated.companyId) : null;
    res.json(mapUserDto(updated, company));
  } catch (err) { next(err); }
});

// PUT /api/admin/vehicles/:vehicleId
router.put('/vehicles/:vehicleId', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const vehicle = await findById(COLLECTIONS.VEHICLES, req.params.vehicleId);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    const updated = await update(COLLECTIONS.VEHICLES, req.params.vehicleId, {
      model: req.body.model || vehicle.model,
      registrationNumber: req.body.registrationNumber || vehicle.registrationNumber,
      seatingCapacity: req.body.seatingCapacity ?? vehicle.seatingCapacity,
    });
    res.json(mapVehicleDto(updated));
  } catch (err) { next(err); }
});

// GET /api/admin/dashboard/stats
router.get('/dashboard/stats', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const [totalUsers, vehicles, totalTrips] = await Promise.all([
      count(COLLECTIONS.USERS),
      findAll(COLLECTIONS.VEHICLES),
      count(COLLECTIONS.TRIPS),
    ]);
    const totalDrivers = new Set(vehicles.map(v => v.ownerId)).size;
    const totalVehicles = vehicles.length;
    const totalDistance = totalTrips * 12;
    res.json({ totalUsers, totalDrivers, totalVehicles, totalTrips, totalDistance, fuelConsumption: Math.floor(totalDistance / 15), costPerKm: 10 });
  } catch (err) { next(err); }
});

// GET /api/admin/users
router.get('/users', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const users = await findAll(COLLECTIONS.USERS);
    const companies = await findAll(COLLECTIONS.COMPANIES);
    const companyMap = Object.fromEntries(companies.map(c => [c.id, c]));
    res.json(users.map(u => mapUserDto(u, companyMap[u.companyId])));
  } catch (err) { next(err); }
});

// GET /api/admin/settings
router.get('/settings', authenticate, requireAdmin, async (req, res, next) => {
  try { res.json(await adminService.getCompanySettings(req.user.email)); } catch (err) { next(err); }
});

// PUT /api/admin/settings
router.put('/settings', authenticate, requireAdmin, async (req, res, next) => {
  try { res.json(await adminService.updateCompanySettings(req.user.email, req.body)); } catch (err) { next(err); }
});

// GET /api/admin/employees
router.get('/employees', authenticate, requireAdmin, async (req, res, next) => {
  try { res.json(await adminService.getCompanyEmployees(req.user.email)); } catch (err) { next(err); }
});

// GET /api/admin/vehicles
router.get('/vehicles', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const vehicles = await findAll(COLLECTIONS.VEHICLES);
    res.json(vehicles.map(mapVehicleDto));
  } catch (err) { next(err); }
});

// PUT /api/admin/users/:userId/role
router.put('/users/:userId/role', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const role = req.query.role || req.body.role;
    const updated = await update(COLLECTIONS.USERS, req.params.userId, { role });
    const company = updated.companyId ? await findById(COLLECTIONS.COMPANIES, updated.companyId) : null;
    res.json(mapUserDto(updated, company));
  } catch (err) { next(err); }
});

// GET /api/admin/trips — all trips (admin view)
router.get('/trips', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const trips = await findAll(COLLECTIONS.TRIPS);
    res.json(trips);
  } catch (err) { next(err); }
});

function mapUserDto(u, company) {
  return { id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email, phoneNumber: u.phoneNumber, role: u.role, companyName: company?.name || null };
}
function mapVehicleDto(v) {
  return { id: v.id, model: v.model, registrationNumber: v.registrationNumber, seatingCapacity: v.seatingCapacity, userId: v.ownerId };
}

module.exports = router;
