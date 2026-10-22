// ─── EcoRide Consolidated Single Mock Data ────────────────────────────────────
// Single cohesive mock entity set connecting the entire application seamlessly.

export const MOCK_USER = {
  id: 'mock-user-001',
  firstName: 'Alice',
  lastName: 'Demo',
  email: 'alice@acme.com',
  phoneNumber: '+91 98765 43210',
  role: 'EMPLOYEE',
  companyName: 'Acme Corp',
  walletBalance: 1250,
  avatarUrl: null,
};

export const MOCK_TOKEN = 'mock-jwt-token-for-testing';

// ─── Single Vehicle ───────────────────────────────────────────────────────────
export const MOCK_VEHICLES = [
  {
    id: 'veh-001',
    userId: 'mock-user-001',
    model: 'Tata Nexon EV',
    registrationNumber: 'KA 01 AB 1234',
    seatingCapacity: 4,
    vehicleType: 'ELECTRIC',
  },
];

// ─── Single Ride ──────────────────────────────────────────────────────────────
const now = Date.now();

export const MOCK_RIDES = [
  {
    id: 'ride-001',
    pickupLocation: 'Koramangala 4th Block',
    destination: 'Electronic City Phase 1',
    departureTime: new Date(now + 1 * 3600 * 1000).toISOString(),
    availableSeats: 3,
    farePerSeat: 80,
    routeWaypoints: 'Silk Board, HSR Layout',
    pickupCoords: { lat: 12.9340, lng: 77.6280 },
    dropCoords: { lat: 12.8450, lng: 77.6630 },
    vehicle: MOCK_VEHICLES[0],
    driver: {
      id: 'user-driver-001',
      firstName: 'Rajan',
      lastName: 'Sharma',
      companyName: 'Acme Corp',
    },
    driverRating: '4.9',
    matchScore: '98% Match',
  },
  {
    id: 'ride-002',
    pickupLocation: 'HSR Layout Sector 2',
    destination: 'Bellandur EcoSpace',
    departureTime: new Date(now + 90 * 60 * 1000).toISOString(),
    availableSeats: 2,
    farePerSeat: 60,
    routeWaypoints: 'Agara Lake, Outer Ring Road',
    pickupCoords: { lat: 12.9100, lng: 77.6480 },
    dropCoords: { lat: 12.9260, lng: 77.6820 },
    vehicle: {
      id: 'veh-002',
      model: 'Hyundai Ioniq 5',
      registrationNumber: 'KA 03 MN 5678',
      seatingCapacity: 4,
      vehicleType: 'ELECTRIC',
    },
    driver: {
      id: 'user-driver-002',
      firstName: 'Priya',
      lastName: 'Menon',
      companyName: 'Infosys',
    },
    driverRating: '4.8',
    matchScore: '95% Match',
  },
  {
    id: 'ride-003',
    pickupLocation: 'Indiranagar 100ft Road',
    destination: 'Whitefield ITPL',
    departureTime: new Date(now + 2 * 3600 * 1000).toISOString(),
    availableSeats: 3,
    farePerSeat: 90,
    routeWaypoints: 'Marathahalli Bridge, Kundalahalli',
    pickupCoords: { lat: 12.9784, lng: 77.6408 },
    dropCoords: { lat: 12.9860, lng: 77.7380 },
    vehicle: {
      id: 'veh-003',
      model: 'MG ZS EV',
      registrationNumber: 'KA 05 XY 9012',
      seatingCapacity: 4,
      vehicleType: 'ELECTRIC',
    },
    driver: {
      id: 'user-driver-003',
      firstName: 'Vikram',
      lastName: 'Deshmukh',
      companyName: 'Wipro Technologies',
    },
    driverRating: '4.9',
    matchScore: '92% Match',
  },
  {
    id: 'ride-004',
    pickupLocation: 'BTM Layout 2nd Stage',
    destination: 'Electronic City Phase 2',
    departureTime: new Date(now + 150 * 60 * 1000).toISOString(),
    availableSeats: 1,
    farePerSeat: 70,
    routeWaypoints: 'Bommanahalli, Beratena Agrahara',
    pickupCoords: { lat: 12.9166, lng: 77.6101 },
    dropCoords: { lat: 12.8380, lng: 77.6850 },
    vehicle: MOCK_VEHICLES[0],
    driver: {
      id: 'user-driver-004',
      firstName: 'Ananya',
      lastName: 'Iyer',
      companyName: 'Acme Corp',
    },
    driverRating: '4.7',
    matchScore: '94% Match',
  },
  {
    id: 'ride-005',
    pickupLocation: 'Prahlad Nagar, SG Highway',
    destination: 'GIFT City, Gandhinagar',
    departureTime: new Date(now + 3 * 3600 * 1000).toISOString(),
    availableSeats: 3,
    farePerSeat: 120,
    routeWaypoints: 'Iskcon Cross Road, Vaishno Devi Circle',
    pickupCoords: { lat: 23.0135, lng: 72.5085 },
    dropCoords: { lat: 23.2156, lng: 72.6369 },
    vehicle: {
      id: 'veh-005',
      model: 'Tata Tiago EV',
      registrationNumber: 'GJ 01 ER 7788',
      seatingCapacity: 4,
      vehicleType: 'ELECTRIC',
    },
    driver: {
      id: 'user-driver-005',
      firstName: 'Karan',
      lastName: 'Patel',
      companyName: 'TCS Infocity',
    },
    driverRating: '5.0',
    matchScore: '96% Match',
  },
];

// Single user-offered ride
export const MOCK_MY_RIDES = [MOCK_RIDES[0]];

// ─── Single Booking / Trip ────────────────────────────────────────────────────
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
];

// ─── Single Driver Trip Request ───────────────────────────────────────────────
export const MOCK_DRIVER_TRIPS = [
  {
    id: 'dtrip-001',
    status: 'ACCEPTED',
    bookedSeats: 1,
    totalFare: 80,
    startOtp: '4821',
    ride: MOCK_RIDES[0],
    passenger: {
      id: 'user-emp-001',
      firstName: 'Bob',
      lastName: 'Kumar',
      companyName: 'Acme Corp',
    },
  },
];

// ─── Wallet & Single Transaction ──────────────────────────────────────────────
export const MOCK_WALLET = { balance: 1250 };

export const MOCK_TRANSACTIONS = [
  {
    id: 'tx-001',
    transactionType: 'RECHARGE',
    amount: 500,
    paymentMethod: 'UPI',
    status: 'SUCCESS',
    createdAt: new Date(now - 24 * 3600 * 1000).toISOString(),
  },
];

// ─── Admin ────────────────────────────────────────────────────────────────────
export const MOCK_ADMIN_STATS = {
  totalUsers: 1,
  totalDrivers: 1,
  totalVehicles: 1,
  totalTrips: 1,
};

export const MOCK_ADMIN_USERS = [
  {
    id: 'mock-user-001',
    firstName: 'Alice',
    lastName: 'Demo',
    email: 'alice@acme.com',
    companyName: 'Acme Corp',
    role: 'EMPLOYEE',
  },
];

// ─── Chat ─────────────────────────────────────────────────────────────────────
export const MOCK_CHAT_HISTORY = {
  'trip-001': [
    {
      id: 'msg-001',
      senderEmail: 'rajan@acme.com',
      content: 'Hi Alice! I will pick you up near Koramangala Signal.',
      timestamp: new Date(now - 20 * 60 * 1000).toISOString(),
    },
    {
      id: 'msg-002',
      senderEmail: 'alice@acme.com',
      content: 'Sounds great Rajan! I am waiting near the main gate.',
      timestamp: new Date(now - 15 * 60 * 1000).toISOString(),
    },
  ],
  'dtrip-001': [
    {
      id: 'msg-003',
      senderEmail: 'bob@acme.com',
      content: 'Looking forward to the carpool!',
      timestamp: new Date(now - 10 * 60 * 1000).toISOString(),
    },
  ],
};

// ─── Map Markers (Bengaluru corridor) ─────────────────────────────────────────
export const MOCK_MAP_REGION = {
  latitude: 12.9352,
  longitude: 77.6245,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

export const MOCK_MAP_MARKERS = [
  {
    id: 'mk-001',
    title: 'Koramangala (Pickup)',
    description: 'Ride pickup point',
    latitude: 12.9352,
    longitude: 77.6245,
    type: 'pickup',
  },
  {
    id: 'mk-002',
    title: 'Electronic City (Destination)',
    description: 'Drop location',
    latitude: 12.8399,
    longitude: 77.6770,
    type: 'destination',
  },
];
