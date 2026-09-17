require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { initFirebase } = require('./firebase');
const bcrypt = require('bcryptjs');
const { COLLECTIONS, findOne, findAll, create, set, getDb } = require('../models');

// ── Helpers ────────────────────────────────────────────────────────────────

async function createUserIfNotFound(email, firstName, lastName, role, companyId, createVehicle, phoneNumber, vehicleModel, vehicleRegNum) {
  let user = await findOne(COLLECTIONS.USERS, 'email', email);
  if (user) return user;

  user = await create(COLLECTIONS.USERS, {
    firstName, lastName, email,
    password: await bcrypt.hash('password123', 10),
    phoneNumber: phoneNumber || null,
    role, companyId, driverLicense: null,
  });

  const balance = 1000 + Math.floor(Math.random() * 4000);
  await create(COLLECTIONS.WALLETS, { userId: user.id, balance });

  if (createVehicle && vehicleModel && vehicleRegNum) {
    const existing = await findOne(COLLECTIONS.VEHICLES, 'registrationNumber', vehicleRegNum);
    if (!existing) {
      await create(COLLECTIONS.VEHICLES, {
        ownerId: user.id, model: vehicleModel,
        registrationNumber: vehicleRegNum, seatingCapacity: 4,
      });
    }
  }
  return user;
}

async function seedMockRidesAndTrips(alice, admin, bob) {
  const existing = await findAll(COLLECTIONS.RIDES);
  if (existing.length > 0) return;  // already seeded

  // Admin vehicle
  let adminVehicle = (await findAll(COLLECTIONS.VEHICLES, [['ownerId', '==', admin.id]]))[0];
  if (!adminVehicle) {
    adminVehicle = await create(COLLECTIONS.VEHICLES, {
      ownerId: admin.id, model: 'Kia Seltos',
      registrationNumber: 'MH-12-AB-9999', seatingCapacity: 4,
    });
  }

  const adminRide = await create(COLLECTIONS.RIDES, {
    driverId: admin.id, vehicleId: adminVehicle.id,
    pickupLocation: 'Andheri, Mumbai', destination: 'Bandra Kurla Complex, Mumbai',
    departureTime: new Date(Date.now() - 2 * 86400000).toISOString(),
    availableSeats: 2, farePerSeat: 150,
  });

  await create(COLLECTIONS.TRIPS, { rideId: adminRide.id, passengerId: alice.id, bookedSeats: 1, totalFare: 150, status: 'COMPLETED', startOtp: '1234' });
  await create(COLLECTIONS.TRIPS, { rideId: adminRide.id, passengerId: bob.id,   bookedSeats: 1, totalFare: 150, status: 'COMPLETED', startOtp: '1234' });

  // Alice vehicle
  let aliceVehicle = (await findAll(COLLECTIONS.VEHICLES, [['ownerId', '==', alice.id]]))[0];
  if (!aliceVehicle) {
    aliceVehicle = await create(COLLECTIONS.VEHICLES, {
      ownerId: alice.id, model: 'Tesla Model 3',
      registrationNumber: 'KA-01-AB-1234', seatingCapacity: 4,
    });
  }

  const aliceRide = await create(COLLECTIONS.RIDES, {
    driverId: alice.id, vehicleId: aliceVehicle.id,
    pickupLocation: 'Koramangala, Bangalore', destination: 'Electronic City, Bangalore',
    departureTime: new Date(Date.now() - 5 * 86400000).toISOString(),
    availableSeats: 2, farePerSeat: 200,
  });
  await create(COLLECTIONS.TRIPS, { rideId: aliceRide.id, passengerId: admin.id, bookedSeats: 1, totalFare: 200, status: 'COMPLETED', startOtp: '5678' });

  const aliceRide2 = await create(COLLECTIONS.RIDES, {
    driverId: alice.id, vehicleId: aliceVehicle.id,
    pickupLocation: 'Indiranagar, Bangalore', destination: 'Whitefield, Bangalore',
    departureTime: new Date(Date.now() + 1 * 86400000).toISOString(),
    availableSeats: 3, farePerSeat: 250,
  });
  await create(COLLECTIONS.TRIPS, { rideId: aliceRide2.id, passengerId: bob.id, bookedSeats: 1, totalFare: 250, status: 'PENDING', startOtp: '9999' });
}

// ── Main run ────────────────────────────────────────────────────────────────

async function run() {
  // Find or create company
  let company = await findOne(COLLECTIONS.COMPANIES, 'emailDomain', 'acme.com');
  if (!company) {
    company = await create(COLLECTIONS.COMPANIES, { name: 'Acme Corp', emailDomain: 'acme.com', active: true });
  }

  const admin = await createUserIfNotFound('admin@acme.com', 'Admin', 'User', 'ADMIN', company.id, false, '+917820022627', null, null);
  const alice = await createUserIfNotFound('alice@acme.com', 'Alice', 'Smith', 'EMPLOYEE', company.id, true, '+917895669918', 'Tesla Model 3', 'KA-01-AB-1234');
  const bob   = await createUserIfNotFound('bob@acme.com',   'Bob',   'Johnson', 'EMPLOYEE', company.id, false, '+919484844775', null, null);

  const firstNames = ['Aarav','Arjun','Amit','Rahul','Rohit','Rohan','Siddharth','Vikram','Vishal','Manoj','Neha','Pooja','Priya','Riya','Sneha','Shreya','Simran','Anjali','Kavya','Kiran'];
  const lastNames  = ['Sharma','Singh','Kumar','Patel','Gupta','Verma','Jain','Reddy','Rao','Desai','Joshi','Iyer','Menon','Nair','Kapoor','Malhotra','Chopra','Agarwal','Bhat','Das'];
  const carModels  = ['Maruti Swift','Hyundai i20','Tata Nexon','Mahindra Thar','Honda City','Kia Seltos','Toyota Innova'];

  const existingCount = (await findAll(COLLECTIONS.USERS, [['companyId', '==', company.id]])).length;
  if (existingCount < 10) {
    console.log('Seeding 100 users...');
    for (let i = 1; i <= 100; i++) {
      const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const email = `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@acme.com`;
      const phone = `+91${9000000000 + Math.floor(Math.random() * 999999999)}`;
      const hasVehicle = Math.random() < 0.35;
      const carModel = hasVehicle ? carModels[Math.floor(Math.random() * carModels.length)] : null;
      const regNum   = hasVehicle ? `MH-${String(Math.floor(Math.random() * 50) + 1).padStart(2,'0')}-AB-${1000 + Math.floor(Math.random() * 9000)}` : null;
      await createUserIfNotFound(email, fName, lName, 'EMPLOYEE', company.id, hasVehicle, phone, carModel, regNum);
    }
  }

  await seedMockRidesAndTrips(alice, admin, bob);
  console.log('✅ Firestore seeding complete.');
}

module.exports = { run };

if (require.main === module) {
  (async () => {
    initFirebase();
    await run();
    process.exit(0);
  })();
}
