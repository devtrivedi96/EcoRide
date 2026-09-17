const { COLLECTIONS, findOne, findAll } = require('../models');

async function getCompanyDashboard(adminEmail) {
  const admin = await findOne(COLLECTIONS.USERS, 'email', adminEmail);
  if (!admin) throw new Error('Admin not found');

  const allTrips = await findAll(COLLECTIONS.TRIPS);
  const totalTrips = allTrips.length;
  const avgDistancePerTripKm = 15.0;
  const totalDistance = totalTrips * avgDistancePerTripKm;
  const estimatedFuelLiters = totalDistance / 15.0;
  const totalFareExchanged = allTrips.reduce((s, t) => s + parseFloat(t.totalFare || 0), 0);
  const totalCostSaved = totalFareExchanged; // hypothetical double vs actual
  const costPerKilometer = totalDistance > 0 ? +(totalFareExchanged / totalDistance).toFixed(2) : 0;

  return { totalTrips, totalDistanceTravelledKm: totalDistance, estimatedFuelConsumptionLiters: estimatedFuelLiters, totalCostSaved, costPerKilometer };
}

module.exports = { getCompanyDashboard };
