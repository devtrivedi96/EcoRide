const { COLLECTIONS, findById, findOne, findAll, create, update, remove, runTransaction, getDb } = require('../models');

/**
 * RideService — Firestore implementation
 */

async function publishRide(userEmail, body) {
  const driver = await findOne(COLLECTIONS.USERS, 'email', userEmail);
  if (!driver) throw new Error('Driver not found');

  const vehicleId = body.vehicleId || body.vehicle_id;
  const vehicle = await findById(COLLECTIONS.VEHICLES, vehicleId);
  if (!vehicle) throw new Error('Vehicle not found');
  if (vehicle.ownerId !== driver.id) throw new Error('Driver must own the vehicle to publish a ride');

  const seats = body.availableSeats ?? body.available_seats;
  if (seats > vehicle.seatingCapacity) throw new Error('Available seats cannot exceed vehicle capacity');

  const ride = await create(COLLECTIONS.RIDES, {
    driverId: driver.id,
    vehicleId: vehicle.id,
    pickupLocation: body.pickupLocation || body.pickup_location,
    destination: body.destination,
    departureTime: body.departureTime || body.departure_time,
    availableSeats: seats,
    farePerSeat: parseFloat(body.farePerSeat || body.fare_per_seat),
    routeWaypoints: body.routeWaypoints || body.route_waypoints || null,
  });

  return mapToDto(ride, driver, vehicle, []);
}

async function searchRides(pickup, destination, time, seats = 1) {
  // Firestore: filter by departureTime >= time, then filter seats & location in memory
  const db = getDb();
  const snap = await db.collection(COLLECTIONS.RIDES)
    .where('departureTime', '>=', new Date(time).toISOString())
    .get();

  const rides = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  const filtered = rides.filter(r =>
    r.availableSeats >= parseInt(seats) &&
    r.pickupLocation.toLowerCase().includes(pickup.toLowerCase()) &&
    r.destination.toLowerCase().includes(destination.toLowerCase())
  );

  return Promise.all(filtered.map(r => enrichRide(r)));
}

async function getAvailableLocations() {
  const now = new Date().toISOString();
  const db = getDb();
  const snap = await db.collection(COLLECTIONS.RIDES)
    .where('departureTime', '>=', now)
    .where('availableSeats', '>', 0)
    .get();

  const allLocations = new Set();
  snap.docs.forEach(doc => {
    const r = doc.data();
    if (r.pickupLocation) allLocations.add(r.pickupLocation);
    if (r.destination) allLocations.add(r.destination);
    if (r.routeWaypoints) r.routeWaypoints.split(',').forEach(wp => allLocations.add(wp.trim()));
  });

  const sorted = Array.from(allLocations).filter(Boolean).sort();
  return { pickupLocations: sorted, destinations: sorted };
}

async function getDriverRides(userEmail) {
  const driver = await findOne(COLLECTIONS.USERS, 'email', userEmail);
  if (!driver) throw new Error('Driver not found');

  const rides = await findAll(COLLECTIONS.RIDES, [['driverId', '==', driver.id]]);
  return Promise.all(rides.map(r => enrichRide(r)));
}

async function updateMyRide(id, userEmail, body) {
  const ride = await findById(COLLECTIONS.RIDES, id);
  if (!ride) throw new Error('Ride not found');

  const driver = await findOne(COLLECTIONS.USERS, 'email', userEmail);
  if (ride.driverId !== driver.id) throw new Error('Unauthorized to edit this ride');

  const trips = await findAll(COLLECTIONS.TRIPS, [['rideId', '==', id]]);
  let updates;
  if (trips.length > 0) {
    updates = {
      departureTime: body.departureTime || body.departure_time || ride.departureTime,
      farePerSeat: parseFloat(body.farePerSeat || body.fare_per_seat || ride.farePerSeat),
      routeWaypoints: body.routeWaypoints || body.route_waypoints || ride.routeWaypoints,
    };
  } else {
    updates = {
      pickupLocation: body.pickupLocation || body.pickup_location || ride.pickupLocation,
      destination: body.destination || ride.destination,
      departureTime: body.departureTime || body.departure_time || ride.departureTime,
      farePerSeat: parseFloat(body.farePerSeat || body.fare_per_seat || ride.farePerSeat),
      routeWaypoints: body.routeWaypoints || body.route_waypoints || ride.routeWaypoints,
    };
  }

  const updated = await update(COLLECTIONS.RIDES, id, updates);
  return enrichRide(updated);
}

async function deleteRide(id, userEmail) {
  const ride = await findById(COLLECTIONS.RIDES, id);
  if (!ride) throw new Error('Ride not found');

  const driver = await findOne(COLLECTIONS.USERS, 'email', userEmail);
  if (ride.driverId !== driver.id) throw new Error('Unauthorized to delete this ride');

  const trips = await findAll(COLLECTIONS.TRIPS, [['rideId', '==', id]]);
  const db = getDb();
  const batch = db.batch();
  trips.forEach(t => {
    if (t.status !== 'CANCELLED') {
      batch.update(db.collection(COLLECTIONS.TRIPS).doc(t.id), { status: 'CANCELLED' });
    }
  });
  await batch.commit();
  await remove(COLLECTIONS.RIDES, id);
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function enrichRide(ride) {
  const [driver, vehicle, trips] = await Promise.all([
    ride.driverId ? findById(COLLECTIONS.USERS, ride.driverId) : null,
    ride.vehicleId ? findById(COLLECTIONS.VEHICLES, ride.vehicleId) : null,
    findAll(COLLECTIONS.TRIPS, [['rideId', '==', ride.id]]),
  ]);

  // Enrich trip passengers
  const enrichedTrips = await Promise.all(trips.map(async t => {
    const passenger = t.passengerId ? await findById(COLLECTIONS.USERS, t.passengerId) : null;
    return { ...t, passenger };
  }));

  let company = null;
  if (driver?.companyId) company = await findById(COLLECTIONS.COMPANIES, driver.companyId);

  return mapToDto(ride, driver, vehicle, enrichedTrips, company);
}

function mapToDto(ride, driver, vehicle, trips = [], company = null) {
  return {
    id: ride.id,
    driver: driver ? {
      id: driver.id,
      firstName: driver.firstName,
      lastName: driver.lastName,
      email: driver.email,
      phoneNumber: driver.phoneNumber,
      companyName: company ? company.name : null,
    } : null,
    vehicle: vehicle ? {
      id: vehicle.id,
      model: vehicle.model,
      registrationNumber: vehicle.registrationNumber,
      seatingCapacity: vehicle.seatingCapacity,
    } : null,
    pickupLocation: ride.pickupLocation,
    destination: ride.destination,
    departureTime: ride.departureTime,
    availableSeats: ride.availableSeats,
    farePerSeat: ride.farePerSeat,
    routeWaypoints: ride.routeWaypoints,
    trips: trips.map(t => ({
      id: t.id,
      passenger: t.passenger ? {
        id: t.passenger.id,
        firstName: t.passenger.firstName,
        lastName: t.passenger.lastName,
        email: t.passenger.email,
        phoneNumber: t.passenger.phoneNumber,
      } : null,
      bookedSeats: t.bookedSeats,
      totalFare: t.totalFare,
      status: t.status,
    })),
  };
}

module.exports = { publishRide, searchRides, getAvailableLocations, getDriverRides, updateMyRide, deleteRide };
