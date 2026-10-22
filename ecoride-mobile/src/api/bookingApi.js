import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './axios';
import { MOCK_MODE, STORAGE_KEYS } from './config';
import { mockBookingApi } from '../mock/mockApi';

const SHARED_ALL_RIDES_KEY = '@ecoride_shared_all_rides';
const SHARED_ALL_TRIPS_KEY = '@ecoride_shared_all_trips';

async function getCurrentUser() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.user);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

async function getSharedRides() {
  try {
    const raw = await AsyncStorage.getItem(SHARED_ALL_RIDES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

async function getSharedTrips() {
  try {
    const raw = await AsyncStorage.getItem(SHARED_ALL_TRIPS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

async function saveSharedTrip(trip) {
  if (!trip || !trip.id) return;
  try {
    const existing = await getSharedTrips();
    const updated = [trip, ...existing.filter((t) => t && t.id !== trip.id)];
    await AsyncStorage.setItem(SHARED_ALL_TRIPS_KEY, JSON.stringify(updated));
  } catch {}
}

const realBookingApi = {
  book: async (payload) => {
    // 1. Attempt booking through remote backend
    try {
      const res = await api.post('/trips', payload);
      if (res?.data) {
        await saveSharedTrip(res.data);
        return res.data;
      }
    } catch (err) {
      // 2. If remote backend returned an error (e.g. ride published locally in shared pool)
      const sharedRides = await getSharedRides();
      const matchedRide = sharedRides.find((r) => r && r.id === payload.rideId);

      if (matchedRide) {
        const currentUser = await getCurrentUser();
        const farePerSeat = Number(matchedRide.farePerSeat || matchedRide.pricePerSeat || 80);
        const bookedSeats = Number(payload.bookedSeats || 1);
        const totalFare = farePerSeat * bookedSeats;

        const localTrip = {
          id: `trip-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          rideId: matchedRide.id,
          ride: matchedRide,
          passengerId: currentUser?.id || `user-pass-${Date.now()}`,
          passenger: currentUser || {
            id: 'user-pass',
            firstName: 'Passenger',
            lastName: 'Colleague',
            email: 'passenger@ecoride.com',
          },
          driverId: matchedRide.driverId || matchedRide.driver?.id,
          driver: matchedRide.driver,
          bookedSeats,
          totalFare,
          status: 'PENDING',
          startOtp: String(Math.floor(1000 + Math.random() * 9000)),
          createdAt: new Date().toISOString(),
          isLocal: true,
        };

        // Decrement available seats in shared ride
        try {
          const updatedRides = sharedRides.map((r) =>
            r.id === matchedRide.id
              ? { ...r, availableSeats: Math.max(0, (r.availableSeats || 1) - bookedSeats) }
              : r
          );
          await AsyncStorage.setItem(SHARED_ALL_RIDES_KEY, JSON.stringify(updatedRides));
        } catch {}

        await saveSharedTrip(localTrip);
        return localTrip;
      }

      throw err;
    }
  },

  myTrips: async () => {
    let serverTrips = [];
    try {
      const res = await api.get('/trips/me');
      serverTrips = Array.isArray(res.data) ? res.data : [];
    } catch {}

    const currentUser = await getCurrentUser();
    const currentId = currentUser?.id;
    const currentEmail = (currentUser?.email || '').trim().toLowerCase();

    let sharedTrips = [];
    try {
      sharedTrips = await getSharedTrips();
    } catch {}

    const seen = new Set();
    const merged = [];

    for (const t of serverTrips) {
      if (t && t.id && !seen.has(t.id)) {
        seen.add(t.id);
        merged.push(t);
      }
    }

    for (const t of sharedTrips) {
      if (t && t.id && !seen.has(t.id)) {
        const isMyPassengerTrip =
          (currentId && t.passengerId === currentId) ||
          (currentId && t.passenger?.id === currentId) ||
          (currentEmail && t.passenger?.email?.trim().toLowerCase() === currentEmail);
        if (isMyPassengerTrip) {
          seen.add(t.id);
          merged.push(t);
        }
      }
    }

    return merged;
  },

  driverTrips: async () => {
    let serverTrips = [];
    try {
      const res = await api.get('/trips/driver');
      serverTrips = Array.isArray(res.data) ? res.data : [];
    } catch {}

    const currentUser = await getCurrentUser();
    const currentId = currentUser?.id;
    const currentEmail = (currentUser?.email || '').trim().toLowerCase();

    let sharedTrips = [];
    try {
      sharedTrips = await getSharedTrips();
    } catch {}

    const seen = new Set();
    const merged = [];

    for (const t of serverTrips) {
      if (t && t.id && !seen.has(t.id)) {
        seen.add(t.id);
        merged.push(t);
      }
    }

    for (const t of sharedTrips) {
      if (t && t.id && !seen.has(t.id)) {
        const isMyDriverTrip =
          (currentId && t.driverId === currentId) ||
          (currentId && t.driver?.id === currentId) ||
          (currentEmail && t.driver?.email?.trim().toLowerCase() === currentEmail);
        if (isMyDriverTrip) {
          seen.add(t.id);
          merged.push(t);
        }
      }
    }

    return merged;
  },

  accept: async (tripId) => {
    try {
      const sharedTrips = await getSharedTrips();
      const updated = sharedTrips.map((t) => (t.id === tripId ? { ...t, status: 'ACCEPTED' } : t));
      await AsyncStorage.setItem(SHARED_ALL_TRIPS_KEY, JSON.stringify(updated));
    } catch {}
    return api.post(`/trips/${tripId}/accept`).then((res) => res.data).catch(() => ({ id: tripId, status: 'ACCEPTED' }));
  },

  reject: async (tripId) => {
    try {
      const sharedTrips = await getSharedTrips();
      const updated = sharedTrips.map((t) => (t.id === tripId ? { ...t, status: 'REJECTED' } : t));
      await AsyncStorage.setItem(SHARED_ALL_TRIPS_KEY, JSON.stringify(updated));
    } catch {}
    return api.post(`/trips/${tripId}/reject`).then((res) => res.data).catch(() => ({ id: tripId, status: 'REJECTED' }));
  },

  cancel: (tripId) => api.patch(`/trips/${tripId}/cancel`).then((res) => res.data).catch(() => null),

  updateStatus: async (tripId, status) => {
    try {
      const sharedTrips = await getSharedTrips();
      const updated = sharedTrips.map((t) => (t.id === tripId ? { ...t, status } : t));
      await AsyncStorage.setItem(SHARED_ALL_TRIPS_KEY, JSON.stringify(updated));
    } catch {}
    return api.patch(`/trips/${tripId}/status`, null, { params: { status } }).then((res) => res.data).catch(() => null);
  },

  verifyOtp: async (tripId, otp) => {
    try {
      const res = await api.post(`/trips/${tripId}/verify-otp`, { otp }, { params: { otp } });
      return res.data;
    } catch (err) {
      // Check shared trips
      const sharedTrips = await getSharedTrips();
      const matched = sharedTrips.find((t) => t.id === tripId);
      if (matched && matched.startOtp === String(otp).trim()) {
        const updated = sharedTrips.map((t) => (t.id === tripId ? { ...t, status: 'IN_PROGRESS' } : t));
        await AsyncStorage.setItem(SHARED_ALL_TRIPS_KEY, JSON.stringify(updated));
        return { success: true, status: 'IN_PROGRESS' };
      }
      throw err;
    }
  },
};

export const bookingApi = MOCK_MODE ? mockBookingApi : realBookingApi;
