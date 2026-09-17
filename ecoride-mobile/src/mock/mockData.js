// ─── EcoRide Mock Data ────────────────────────────────────────────────────────
// Single source of truth for all mock data used in MOCK_MODE.
// Bangalore-based realistic data.

export const MOCK_USER = {
  id: 'mock-user-001',
  firstName: 'Alice',
  lastName: 'Demo',
  email: 'alice@acme.com',
  phoneNumber: '+91 98765 43210',
  role: 'EMPLOYEE',        // try 'DRIVER', 'ADMIN' to test other roles
  companyName: 'Acme Corp',
  walletBalance: 1250,
  avatarUrl: null,
};

export const MOCK_TOKEN = 'mock-jwt-token-for-testing';

// ─── Vehicles ─────────────────────────────────────────────────────────────────
export const MOCK_VEHICLES = [
  {
    id: 'veh-001',
    userId: 'user-driver-001',
    model: 'Tata Nexon EV',
    registrationNumber: 'KA 01 AB 1234',
    seatingCapacity: 4,
    vehicleType: 'ELECTRIC',
  },
  {
    id: 'veh-002',
    userId: 'user-driver-002',
    model: 'MG ZS EV',
    registrationNumber: 'KA 05 CD 5678',
    seatingCapacity: 5,
    vehicleType: 'ELECTRIC',
  },
  {
    id: 'veh-003',
    userId: 'mock-user-001',
    model: 'Ola S1 Pro',
    registrationNumber: 'KA 03 EF 9012',
    seatingCapacity: 2,
    vehicleType: 'ELECTRIC',
  },
];

// ─── Rides ────────────────────────────────────────────────────────────────────
const now = Date.now();

export const MOCK_RIDES = [
  {
    id: 'ride-001',
    pickupLocation: 'Koramangala',
    destination: 'Electronic City',
    departureTime: new Date(now + 2 * 3600 * 1000).toISOString(),
    availableSeats: 2,
    farePerSeat: 80,
    routeWaypoints: 'BTM Layout, Silk Board',
    vehicle: MOCK_VEHICLES[0],
    driver: {
      id: 'user-driver-001',
      firstName: 'Rajan',
      lastName: 'Sharma',
      companyName: 'Acme Corp',
    },
  },
  {
    id: 'ride-002',
    pickupLocation: 'Indiranagar',
    destination: 'Whitefield',
    departureTime: new Date(now + 5 * 3600 * 1000).toISOString(),
    availableSeats: 3,
    farePerSeat: 120,
    routeWaypoints: 'MG Road, Marathahalli',
    vehicle: MOCK_VEHICLES[1],
    driver: {
      id: 'user-driver-002',
      firstName: 'Priya',
      lastName: 'Nair',
      companyName: 'Acme Corp',
    },
  },
  {
    id: 'ride-003',
    pickupLocation: 'HSR Layout',
    destination: 'Hebbal',
    departureTime: new Date(now + 24 * 3600 * 1000).toISOString(),
    availableSeats: 1,
    farePerSeat: 150,
    routeWaypoints: 'Koramangala, Mekhri Circle',
    vehicle: MOCK_VEHICLES[0],
    driver: {
      id: 'user-driver-001',
      firstName: 'Rajan',
      lastName: 'Sharma',
      companyName: 'Acme Corp',
    },
  },
  // Alice's own published ride
  {
    id: 'ride-004',
    pickupLocation: 'JP Nagar',
    destination: 'Manyata Tech Park',
    departureTime: new Date(now + 3 * 3600 * 1000).toISOString(),
    availableSeats: 2,
    farePerSeat: 100,
    routeWaypoints: 'Banashankari, Yeshwanthpur',
    vehicle: MOCK_VEHICLES[2],
    driver: MOCK_USER,
  },
];

// Alice's own rides (published by her)
export const MOCK_MY_RIDES = [MOCK_RIDES[3]];

// ─── Trips (bookings) ─────────────────────────────────────────────────────────
export const MOCK_TRIPS = [
  {
    id: 'trip-001',
    status: 'ACCEPTED',
    bookedSeats: 1,
    totalFare: 80,
    startOtp: '4821',
    ride: MOCK_RIDES[0],
    passenger: MOCK_USER,
  },
  {
    id: 'trip-002',
    status: 'COMPLETED',
    bookedSeats: 2,
    totalFare: 240,
    startOtp: null,
    ride: MOCK_RIDES[1],
    passenger: MOCK_USER,
  },
  {
    id: 'trip-003',
    status: 'PENDING',
    bookedSeats: 1,
    totalFare: 150,
    startOtp: null,
    ride: MOCK_RIDES[2],
    passenger: MOCK_USER,
  },
];

// Trips that Alice drives (she published ride-004 and has one request)
export const MOCK_DRIVER_TRIPS = [
  {
    id: 'dtrip-001',
    status: 'PENDING',
    bookedSeats: 1,
    totalFare: 100,
    startOtp: null,
    ride: MOCK_RIDES[3],
    passenger: {
      id: 'user-emp-001',
      firstName: 'Bob',
      lastName: 'Kumar',
      companyName: 'Acme Corp',
    },
  },
];

// ─── Wallet ───────────────────────────────────────────────────────────────────
export const MOCK_WALLET = { balance: 1250 };

export const MOCK_TRANSACTIONS = [
  {
    id: 'tx-001',
    transactionType: 'RECHARGE',
    amount: 500,
    paymentMethod: 'UPI',
    status: 'SUCCESS',
    createdAt: new Date(now - 3 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'tx-002',
    transactionType: 'TRIP_PAYMENT',
    amount: 240,
    paymentMethod: 'WALLET',
    status: 'SUCCESS',
    createdAt: new Date(now - 2 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'tx-003',
    transactionType: 'RECHARGE',
    amount: 1000,
    paymentMethod: 'UPI',
    status: 'SUCCESS',
    createdAt: new Date(now - 7 * 24 * 3600 * 1000).toISOString(),
  },
];

// ─── Admin ────────────────────────────────────────────────────────────────────
export const MOCK_ADMIN_STATS = {
  totalUsers: 42,
  totalDrivers: 8,
  totalVehicles: 6,
  totalTrips: 127,
};

export const MOCK_ADMIN_USERS = [
  { id: 'user-driver-001', firstName: 'Rajan', lastName: 'Sharma', email: 'rajan@acme.com', companyName: 'Acme Corp', role: 'DRIVER' },
  { id: 'user-driver-002', firstName: 'Priya', lastName: 'Nair', email: 'priya@acme.com', companyName: 'Acme Corp', role: 'DRIVER' },
  { id: 'user-emp-001', firstName: 'Bob', lastName: 'Kumar', email: 'bob@acme.com', companyName: 'Acme Corp', role: 'EMPLOYEE' },
  { id: 'mock-user-001', firstName: 'Alice', lastName: 'Demo', email: 'alice@acme.com', companyName: 'Acme Corp', role: 'EMPLOYEE' },
];

// ─── Chat ─────────────────────────────────────────────────────────────────────
export const MOCK_CHAT_HISTORY = {
  'trip-001': [
    { id: 'msg-001', senderEmail: 'rajan@acme.com', content: 'Hi! I will pick you up from Koramangala Signal.', timestamp: new Date(now - 30 * 60 * 1000).toISOString() },
    { id: 'msg-002', senderEmail: 'alice@acme.com', content: 'Great, I will be there. Please WhatsApp if you need to reach me.', timestamp: new Date(now - 25 * 60 * 1000).toISOString() },
    { id: 'msg-003', senderEmail: 'rajan@acme.com', content: 'Perfect, see you soon!', timestamp: new Date(now - 20 * 60 * 1000).toISOString() },
  ],
  'trip-002': [
    { id: 'msg-004', senderEmail: 'priya@acme.com', content: 'Starting from Indiranagar 6th Main. Please be ready.', timestamp: new Date(now - 2 * 24 * 3600 * 1000).toISOString() },
  ],
  'trip-003': [],
  'dtrip-001': [
    { id: 'msg-005', senderEmail: 'bob@acme.com', content: 'Looking forward to the ride!', timestamp: new Date(now - 10 * 60 * 1000).toISOString() },
  ],
};

// ─── Map Markers (Bangalore co-ords) ─────────────────────────────────────────
export const MOCK_MAP_REGION = {
  latitude: 12.9716,
  longitude: 77.5946,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

export const MOCK_MAP_MARKERS = [
  { id: 'mk-001', title: 'Koramangala', description: 'Ride pickup', latitude: 12.9352, longitude: 77.6245, type: 'pickup' },
  { id: 'mk-002', title: 'Electronic City', description: 'Destination', latitude: 12.8399, longitude: 77.6770, type: 'destination' },
  { id: 'mk-003', title: 'Indiranagar', description: 'Ride pickup', latitude: 12.9783, longitude: 77.6408, type: 'pickup' },
  { id: 'mk-004', title: 'Whitefield', description: 'Destination', latitude: 12.9698, longitude: 77.7500, type: 'destination' },
  { id: 'mk-005', title: 'HSR Layout', description: 'Ride pickup', latitude: 12.9116, longitude: 77.6474, type: 'pickup' },
  { id: 'mk-006', title: 'JP Nagar', description: 'Your ride', latitude: 12.9101, longitude: 77.5858, type: 'myRide' },
];
