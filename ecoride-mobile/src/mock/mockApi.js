// ─── Mock API Layer ───────────────────────────────────────────────────────────
// All functions return Promises to match real API signatures.
// Importing screens/components never need to know this exists.
import {
  MOCK_USER,
  MOCK_WALLET,
  MOCK_TRANSACTIONS,
  MOCK_RIDES,
  MOCK_MY_RIDES,
  MOCK_TRIPS,
  MOCK_DRIVER_TRIPS,
  MOCK_ADMIN_STATS,
  MOCK_ADMIN_USERS,
  MOCK_VEHICLES,
  MOCK_CHAT_HISTORY,
} from './mockData';

// In-memory mutable state so actions like "book" and "recharge" feel real
let mockTrips = [...MOCK_TRIPS];
let mockDriverTrips = [...MOCK_DRIVER_TRIPS];
let mockWallet = { ...MOCK_WALLET };
let mockTransactions = [...MOCK_TRANSACTIONS];
let mockMyRides = [...MOCK_MY_RIDES];
let mockAdminUsers = [...MOCK_ADMIN_USERS];

function delay(ms = 400) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const mockAuthApi = {
  login: async ({ email }) => {
    await delay();
    return { token: 'mock-jwt', user: { ...MOCK_USER, email } };
  },
  register: async (payload) => {
    await delay();
    return { token: 'mock-jwt', user: { ...MOCK_USER, ...payload } };
  },
  forgotPassword: async () => { await delay(); return { message: 'Reset link sent (mock).' }; },
  resetPassword: async () => { await delay(); return { message: 'Password reset (mock).' }; },
};

// ─── User ─────────────────────────────────────────────────────────────────────
export const mockUserApi = {
  me: async () => { await delay(200); return MOCK_USER; },
  resetPassword: async () => { await delay(); return { message: 'Password updated (mock).' }; },
  savedPlaces: async () => { await delay(); return []; },
  addSavedPlace: async (p) => { await delay(); return { id: `sp-${Date.now()}`, ...p }; },
  deleteSavedPlace: async () => { await delay(); },
};

// ─── Rides ────────────────────────────────────────────────────────────────────
export const mockRideApi = {
  search: async ({ pickupLocation, destination }) => {
    await delay();
    // Simple substring match (case-insensitive)
    const q = (s) => s?.toLowerCase?.() || '';
    return MOCK_RIDES.filter(
      (r) =>
        q(r.pickupLocation).includes(q(pickupLocation)) ||
        q(r.destination).includes(q(destination)),
    );
  },
  locations: async () => {
    await delay(200);
    return ['Koramangala', 'Electronic City', 'Indiranagar', 'Whitefield', 'HSR Layout', 'Hebbal', 'JP Nagar', 'Manyata Tech Park'];
  },
  mine: async () => { await delay(); return mockMyRides; },
  publish: async (payload) => {
    await delay();
    const newRide = {
      id: `ride-${Date.now()}`,
      ...payload,
      vehicle: { model: 'Unknown Vehicle' },
      driver: MOCK_USER,
    };
    mockMyRides = [newRide, ...mockMyRides];
    return newRide;
  },
  update: async (id, payload) => {
    await delay();
    mockMyRides = mockMyRides.map((r) => r.id === id ? { ...r, ...payload } : r);
    return mockMyRides.find((r) => r.id === id);
  },
  remove: async (id) => {
    await delay();
    mockMyRides = mockMyRides.filter((r) => r.id !== id);
  },
};

// ─── Bookings / Trips ─────────────────────────────────────────────────────────
export const mockBookingApi = {
  book: async ({ rideId, bookedSeats }) => {
    await delay();
    const ride = MOCK_RIDES.find((r) => r.id === rideId) || {};
    const newTrip = {
      id: `trip-${Date.now()}`,
      status: 'PENDING',
      bookedSeats,
      totalFare: (ride.farePerSeat || 0) * bookedSeats,
      startOtp: null,
      ride,
      passenger: MOCK_USER,
    };
    mockTrips = [newTrip, ...mockTrips];
    return newTrip;
  },
  myTrips: async () => { await delay(); return mockTrips; },
  driverTrips: async () => { await delay(); return mockDriverTrips; },
  cancel: async (tripId) => {
    await delay();
    mockTrips = mockTrips.map((t) => t.id === tripId ? { ...t, status: 'CANCELLED' } : t);
    mockDriverTrips = mockDriverTrips.map((t) => t.id === tripId ? { ...t, status: 'CANCELLED' } : t);
  },
  accept: async (tripId) => {
    await delay();
    mockDriverTrips = mockDriverTrips.map((t) =>
      t.id === tripId ? { ...t, status: 'ACCEPTED', startOtp: String(Math.floor(1000 + Math.random() * 9000)) } : t,
    );
  },
  reject: async (tripId) => {
    await delay();
    mockDriverTrips = mockDriverTrips.map((t) => t.id === tripId ? { ...t, status: 'REJECTED' } : t);
  },
  updateStatus: async (tripId, status) => {
    await delay();
    mockDriverTrips = mockDriverTrips.map((t) => t.id === tripId ? { ...t, status } : t);
  },
  verifyOtp: async (tripId) => {
    await delay();
    mockDriverTrips = mockDriverTrips.map((t) => t.id === tripId ? { ...t, status: 'STARTED' } : t);
  },
};

// ─── Payments ─────────────────────────────────────────────────────────────────
export const mockPaymentApi = {
  wallet: async () => { await delay(); return mockWallet; },
  rechargeWallet: async ({ amount }) => {
    await delay();
    mockWallet = { balance: mockWallet.balance + Number(amount) };
    mockTransactions = [
      { id: `tx-${Date.now()}`, transactionType: 'RECHARGE', amount: Number(amount), paymentMethod: 'UPI', status: 'SUCCESS', createdAt: new Date().toISOString() },
      ...mockTransactions,
    ];
    return mockWallet;
  },
  payTrip: async ({ tripId }) => {
    await delay();
    const trip = mockTrips.find((t) => t.id === tripId);
    const amount = trip?.totalFare || 0;
    mockWallet = { balance: mockWallet.balance - amount };
    mockTransactions = [
      { id: `tx-${Date.now()}`, transactionType: 'TRIP_PAYMENT', amount, paymentMethod: 'WALLET', status: 'SUCCESS', createdAt: new Date().toISOString() },
      ...mockTransactions,
    ];
    mockTrips = mockTrips.map((t) => t.id === tripId ? { ...t, status: 'PAID' } : t);
    return { message: 'Payment successful (mock).' };
  },
  transactions: async () => { await delay(); return mockTransactions; },
  createOrder: async (amount) => { await delay(); return { orderId: `order-${Date.now()}`, amount }; },
  verifyRazorpay: async () => { await delay(); return { message: 'Verified (mock).' }; },
  logFailure: async () => { await delay(); },
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export const mockAdminApi = {
  stats: async () => { await delay(); return MOCK_ADMIN_STATS; },
  users: async () => { await delay(); return mockAdminUsers; },
  updateUser: async (userId, payload) => {
    await delay();
    mockAdminUsers = mockAdminUsers.map((u) => u.id === userId ? { ...u, ...payload } : u);
    return mockAdminUsers.find((u) => u.id === userId);
  },
  deleteUser: async (userId) => {
    await delay();
    mockAdminUsers = mockAdminUsers.filter((u) => u.id !== userId);
  },
  setRole: async (userId, role) => {
    await delay();
    mockAdminUsers = mockAdminUsers.map((u) => u.id === userId ? { ...u, role } : u);
    return mockAdminUsers.find((u) => u.id === userId);
  },
  vehicles: async () => { await delay(); return MOCK_VEHICLES; },
  trips: async () => { await delay(); return [...mockTrips, ...mockDriverTrips]; },
  analytics: async () => { await delay(); return MOCK_ADMIN_STATS; },
};

// ─── Chat ─────────────────────────────────────────────────────────────────────
let mockChats = { ...MOCK_CHAT_HISTORY };

export const mockChatApi = {
  history: async (tripId) => {
    await delay(200);
    return mockChats[tripId] || [];
  },
  sendMessage: async (tripId, message) => {
    await delay(100);
    const msg = { id: `msg-${Date.now()}`, ...message, timestamp: new Date().toISOString() };
    mockChats = { ...mockChats, [tripId]: [...(mockChats[tripId] || []), msg] };
    return msg;
  },
};

// ─── Socket stub (mock mode — no real WS) ────────────────────────────────────
export function createMockTripSocket(tripId, onMessage) {
  const listeners = {};
  return {
    emit: (event, payload) => {
      if (event === 'send-message' && onMessage) {
        // Echo back after small delay
        setTimeout(() => {
          onMessage({
            id: `msg-${Date.now()}`,
            senderEmail: payload?.message?.senderEmail,
            content: payload?.message?.content,
            timestamp: new Date().toISOString(),
          });
        }, 150);
      }
    },
    on: (event, cb) => { listeners[event] = cb; },
    off: () => {},
    disconnect: () => {},
  };
}
