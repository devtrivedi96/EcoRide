const { COLLECTIONS, findById, findOne, findAll, create, update, runTransaction, getDb } = require('../models');

function generateOtp() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

async function enrichTrip(trip) {
  const [ride, passenger] = await Promise.all([
    trip.rideId ? findById(COLLECTIONS.RIDES, trip.rideId) : null,
    trip.passengerId ? findById(COLLECTIONS.USERS, trip.passengerId) : null,
  ]);
  let driver = null;
  if (ride?.driverId) driver = await findById(COLLECTIONS.USERS, ride.driverId);
  return mapToDto(trip, ride, passenger, driver);
}

async function bookTrip(userEmail, body) {
  const passenger = await findOne(COLLECTIONS.USERS, 'email', userEmail);
  if (!passenger) throw new Error('Passenger not found');

  const rideId = body.rideId || body.ride_id;
  const seats = body.bookedSeats ?? body.booked_seats ?? 1;

  // Use Firestore transaction to safely deduct available seats
  const db = getDb();
  let tripId;

  await runTransaction(async (t) => {
    const rideRef = db.collection(COLLECTIONS.RIDES).doc(String(rideId));
    const rideDoc = await t.get(rideRef);
    if (!rideDoc.exists) throw new Error('Ride not found');
    const ride = { id: rideDoc.id, ...rideDoc.data() };

    if (ride.driverId === passenger.id) throw new Error('Driver cannot book their own ride');
    if (ride.availableSeats < seats) throw new Error('Not enough available seats');

    const totalFare = parseFloat(ride.farePerSeat) * seats;
    const otp = generateOtp();

    const tripRef = db.collection(COLLECTIONS.TRIPS).doc();
    tripId = tripRef.id;

    const now = new Date().toISOString();
    t.update(rideRef, { availableSeats: ride.availableSeats - seats, updatedAt: now });
    t.set(tripRef, {
      rideId: ride.id,
      passengerId: passenger.id,
      bookedSeats: seats,
      totalFare,
      status: 'PENDING',
      startOtp: otp,
      createdAt: now,
      updatedAt: now,
    });
  });

  const trip = await findById(COLLECTIONS.TRIPS, tripId);
  return enrichTrip(trip);
}

async function acceptTrip(tripId, driverEmail) {
  const trip = await findById(COLLECTIONS.TRIPS, tripId);
  if (!trip) throw new Error('Trip not found');
  const ride = await findById(COLLECTIONS.RIDES, trip.rideId);
  const driver = await findById(COLLECTIONS.USERS, ride.driverId);
  if (driver.email !== driverEmail) throw new Error('Only the driver can accept the trip');
  if (trip.status !== 'PENDING') throw new Error('Can only accept PENDING trips');
  await update(COLLECTIONS.TRIPS, tripId, { status: 'ACCEPTED' });
  return enrichTrip(await findById(COLLECTIONS.TRIPS, tripId));
}

async function rejectTrip(tripId, driverEmail) {
  const trip = await findById(COLLECTIONS.TRIPS, tripId);
  if (!trip) throw new Error('Trip not found');
  const ride = await findById(COLLECTIONS.RIDES, trip.rideId);
  const driver = await findById(COLLECTIONS.USERS, ride.driverId);
  if (driver.email !== driverEmail) throw new Error('Only the driver can reject the trip');
  if (trip.status !== 'PENDING') throw new Error('Can only reject PENDING trips');

  // Restore seats
  await update(COLLECTIONS.RIDES, trip.rideId, { availableSeats: ride.availableSeats + trip.bookedSeats });
  await update(COLLECTIONS.TRIPS, tripId, { status: 'REJECTED' });
  return enrichTrip(await findById(COLLECTIONS.TRIPS, tripId));
}

async function getPassengerTrips(userEmail) {
  const passenger = await findOne(COLLECTIONS.USERS, 'email', userEmail);
  if (!passenger) throw new Error('User not found');
  const trips = await findAll(COLLECTIONS.TRIPS, [['passengerId', '==', passenger.id]]);
  return Promise.all(trips.map(enrichTrip));
}

async function getDriverTrips(userEmail) {
  const driver = await findOne(COLLECTIONS.USERS, 'email', userEmail);
  if (!driver) throw new Error('Driver not found');

  // Get all rides by this driver, then all trips on those rides
  const rides = await findAll(COLLECTIONS.RIDES, [['driverId', '==', driver.id]]);
  if (rides.length === 0) return [];

  const rideIds = rides.map(r => r.id);
  // Firestore 'in' supports up to 30 values — safe for most cases
  const db = getDb();
  const snap = await db.collection(COLLECTIONS.TRIPS).where('rideId', 'in', rideIds.slice(0, 30)).get();
  const trips = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return Promise.all(trips.map(enrichTrip));
}

async function updateTripStatus(tripId, status, driverEmail) {
  const trip = await findById(COLLECTIONS.TRIPS, tripId);
  if (!trip) throw new Error('Trip not found');
  const ride = await findById(COLLECTIONS.RIDES, trip.rideId);
  const driver = await findById(COLLECTIONS.USERS, ride.driverId);
  if (driver.email !== driverEmail) throw new Error('Only the driver can update the trip status');
  await update(COLLECTIONS.TRIPS, tripId, { status: status.toUpperCase() });
  return enrichTrip(await findById(COLLECTIONS.TRIPS, tripId));
}

async function verifyOtpAndStartTrip(tripId, otp, driverEmail) {
  const trip = await findById(COLLECTIONS.TRIPS, tripId);
  if (!trip) throw new Error('Trip not found');
  const ride = await findById(COLLECTIONS.RIDES, trip.rideId);
  const driver = await findById(COLLECTIONS.USERS, ride.driverId);
  if (driver.email !== driverEmail) throw new Error('Only the driver can start the trip');
  if (trip.status !== 'ACCEPTED') throw new Error('Only ACCEPTED trips can be started');
  if (!trip.startOtp || trip.startOtp !== otp) throw new Error('Invalid OTP');
  await update(COLLECTIONS.TRIPS, tripId, { status: 'STARTED' });
  return enrichTrip(await findById(COLLECTIONS.TRIPS, tripId));
}

async function cancelTripAsPassenger(tripId, userEmail) {
  const trip = await findById(COLLECTIONS.TRIPS, tripId);
  if (!trip) throw new Error('Trip not found');
  const passenger = await findById(COLLECTIONS.USERS, trip.passengerId);
  if (passenger.email !== userEmail) throw new Error('Only the passenger who booked this trip can cancel it');

  const cancellable = ['PENDING', 'ACCEPTED', 'BOOKED'];
  if (!cancellable.includes(trip.status)) throw new Error('Cannot cancel a trip that is already started or completed');

  const ride = await findById(COLLECTIONS.RIDES, trip.rideId);
  await update(COLLECTIONS.RIDES, trip.rideId, { availableSeats: ride.availableSeats + trip.bookedSeats });
  await update(COLLECTIONS.TRIPS, tripId, { status: 'CANCELLED' });
  return enrichTrip(await findById(COLLECTIONS.TRIPS, tripId));
}

function mapToDto(trip, ride, passenger, driver, viewerEmail = null) {
  // Only expose OTP to the passenger who booked the trip (they show it to the driver)
  const showOtp = passenger && viewerEmail === passenger.email;
  return {
    id: trip.id,
    bookedSeats: trip.bookedSeats,
    totalFare: trip.totalFare,
    status: trip.status,
    ...(showOtp ? { startOtp: trip.startOtp } : {}),
    passenger: passenger ? {
      id: passenger.id,
      firstName: passenger.firstName,
      lastName: passenger.lastName,
      email: passenger.email,
      phoneNumber: passenger.phoneNumber,
    } : null,
    ride: ride ? {
      id: ride.id,
      pickupLocation: ride.pickupLocation,
      destination: ride.destination,
      departureTime: ride.departureTime,
      farePerSeat: ride.farePerSeat,
      driver: driver ? {
        firstName: driver.firstName,
        lastName: driver.lastName,
        email: driver.email,
        phoneNumber: driver.phoneNumber,
      } : null,
    } : null,
  };
}


module.exports = {
  bookTrip, acceptTrip, rejectTrip, getPassengerTrips, getDriverTrips,
  updateTripStatus, verifyOtpAndStartTrip, cancelTripAsPassenger,
};
