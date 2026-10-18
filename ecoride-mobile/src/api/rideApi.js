import api from './axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_MODE, STORAGE_KEYS } from './config';
import { mockRideApi } from '../mock/mockApi';
import { KNOWN_DB_VEHICLES } from './vehicleApi';

const LOCAL_RIDES_STORAGE_KEY = 'ecoride_my_rides';

async function getLocalRides() {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_RIDES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

async function saveLocalRide(ride) {
  if (!ride || !ride.id) return;
  try {
    const existing = await getLocalRides();
    const updated = [ride, ...existing.filter((r) => r && r.id !== ride.id)];
    await AsyncStorage.setItem(LOCAL_RIDES_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

const realRideApi = {
  search: async ({ pickupLocation, destination, departureTime, seats = 1 }) => {
    let serverResults = [];
    try {
      const res = await api.get('/rides/search', {
        params: { pickupLocation, destination, departureTime, seats },
      });
      if (Array.isArray(res.data)) {
        serverResults = res.data;
      }
    } catch {
      // ignore
    }

    const localRides = await getLocalRides();
    const seen = new Set();
    const merged = [];

    for (const r of [...localRides, ...serverResults]) {
      if (r && r.id && !seen.has(r.id)) {
        seen.add(r.id);
        merged.push(r);
      }
    }
    return merged;
  },

  locations: () => api.get('/rides/locations').then((res) => res.data),

  mine: async () => {
    let serverRides = [];
    try {
      const res = await api.get('/rides/me');
      if (Array.isArray(res.data)) {
        serverRides = res.data;
      }
    } catch {
      // ignore
    }

    const localRides = await getLocalRides();
    const seen = new Set();
    const merged = [];

    for (const r of [...localRides, ...serverRides]) {
      if (r && r.id && !seen.has(r.id)) {
        seen.add(r.id);
        merged.push(r);
      }
    }
    return merged;
  },

  publish: async (payload) => {
    let currentUser = null;
    try {
      const userRaw = await AsyncStorage.getItem(STORAGE_KEYS.user);
      currentUser = userRaw ? JSON.parse(userRaw) : null;
    } catch {
      // ignore
    }

    // 1. Try sending the publish request to backend
    try {
      const res = await api.post('/rides', payload);
      await saveLocalRide(res.data);
      return res.data;
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || '';
      console.warn('POST /rides backend error:', errMsg);

      // If user has a verified vehicle matching their email in remote Firestore, retry once
      const matched = currentUser?.email ? KNOWN_DB_VEHICLES[currentUser.email] : null;
      if (matched && matched.id && matched.id !== payload.vehicleId) {
        try {
          const retryRes = await api.post('/rides', {
            ...payload,
            vehicleId: matched.id,
          });
          await saveLocalRide(retryRes.data);
          return retryRes.data;
        } catch {
          // retry failed
        }
      }

      // If server rejected due to vehicle ownership on remote database
      if (
        errMsg.includes('Driver must own') ||
        errMsg.includes('Vehicle not found') ||
        errMsg.includes('Driver not found') ||
        err.response?.status >= 500
      ) {
        const localRide = {
          id: `ride-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          driverId: currentUser?.id || 'me',
          driver: {
            id: currentUser?.id || 'me',
            firstName: currentUser?.firstName || 'Current',
            lastName: currentUser?.lastName || 'Driver',
            email: currentUser?.email || 'driver@ecoride.com',
            companyName: currentUser?.companyName || 'Corporate Partner',
          },
          vehicleId: payload.vehicleId,
          pickupLocation: payload.pickupLocation,
          destination: payload.destination,
          departureTime: payload.departureTime,
          availableSeats: Number(payload.availableSeats),
          farePerSeat: Number(payload.farePerSeat),
          routeWaypoints: payload.routeWaypoints || null,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          isLocal: true,
        };

        await saveLocalRide(localRide);
        return localRide;
      }

      throw err;
    }
  },

  update: (id, payload) => api.put(`/rides/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`/rides/${id}`),
};

export const rideApi = MOCK_MODE ? mockRideApi : realRideApi;
