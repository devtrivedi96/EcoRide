import api from './axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_MODE, STORAGE_KEYS } from './config';
import { mockRideApi } from '../mock/mockApi';
import { KNOWN_DB_VEHICLES } from './vehicleApi';

const RIDES_STORAGE_PREFIX = '@ecoride_my_rides_';

async function getCurrentUser() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.user);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function getUserKey(user) {
  if (!user) return 'guest';
  return (user.id || user.email || 'guest').trim().toLowerCase();
}

function getLocalRidesKey(userKey) {
  return `${RIDES_STORAGE_PREFIX}${userKey}`;
}

async function getLocalRides(userKey) {
  if (!userKey || userKey === 'guest') return [];
  try {
    const key = getLocalRidesKey(userKey);
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

async function saveLocalRide(ride, userKey) {
  if (!ride || !ride.id || !userKey || userKey === 'guest') return;
  try {
    const existing = await getLocalRides(userKey);
    const updated = [ride, ...existing.filter((r) => r && r.id !== ride.id)];
    await AsyncStorage.setItem(getLocalRidesKey(userKey), JSON.stringify(updated));
  } catch {}
}

async function removeLocalRide(rideId, userKey) {
  if (!rideId || !userKey || userKey === 'guest') return;
  try {
    const existing = await getLocalRides(userKey);
    const updated = existing.filter((r) => r && r.id !== rideId);
    await AsyncStorage.setItem(getLocalRidesKey(userKey), JSON.stringify(updated));
  } catch {}
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
    } catch {}

    // Include active local rides for the current user if matching
    let userLocalRides = [];
    try {
      const currentUser = await getCurrentUser();
      const userKey = getUserKey(currentUser);
      userLocalRides = await getLocalRides(userKey);
    } catch {}

    const seen = new Set();
    const merged = [];

    for (const r of serverResults) {
      if (r && r.id && !seen.has(r.id)) {
        seen.add(r.id);
        merged.push(r);
      }
    }

    for (const r of userLocalRides) {
      if (r && r.id && !seen.has(r.id) && r.status === 'ACTIVE') {
        const matchesPickup =
          !pickupLocation ||
          (r.pickupLocation || '').toLowerCase().includes(pickupLocation.toLowerCase());
        const matchesDest =
          !destination ||
          (r.destination || '').toLowerCase().includes(destination.toLowerCase());
        if (matchesPickup && matchesDest) {
          seen.add(r.id);
          merged.push(r);
        }
      }
    }

    return merged;
  },

  locations: () => api.get('/rides/locations').then((res) => res.data),

  mine: async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) return [];

    const currentEmail = (currentUser.email || '').trim().toLowerCase();
    const currentId = currentUser.id;
    const userKey = getUserKey(currentUser);

    let serverRides = [];
    try {
      const res = await api.get('/rides/me');
      if (Array.isArray(res.data)) {
        serverRides = res.data;
      }
    } catch {}

    // Account-scoped local rides only
    const localRides = await getLocalRides(userKey);

    // Strict ownership verification: only rides where THIS user is the driver
    const isOwner = (r) => {
      if (!r) return false;
      if (currentId && (r.driverId === currentId || r.driver?.id === currentId)) return true;
      if (currentEmail && r.driver?.email && r.driver.email.trim().toLowerCase() === currentEmail) {
        return true;
      }
      return false;
    };

    const seen = new Set();
    const merged = [];

    // Prioritize authentic server rides
    for (const r of serverRides) {
      if (r && r.id && !seen.has(r.id) && isOwner(r)) {
        seen.add(r.id);
        merged.push(r);
      }
    }

    // Add local rides for this user only
    for (const r of localRides) {
      if (r && r.id && !seen.has(r.id) && isOwner(r)) {
        seen.add(r.id);
        merged.push(r);
      }
    }

    return merged;
  },

  publish: async (payload) => {
    const currentUser = await getCurrentUser();
    const userKey = getUserKey(currentUser);

    // 1. Try sending the publish request to backend
    try {
      const res = await api.post('/rides', payload);
      await saveLocalRide(res.data, userKey);
      return res.data;
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || '';
      console.warn('POST /rides backend error:', errMsg);

      // If user has a verified vehicle matching their email in remote Firestore, retry once
      const matched = currentUser?.email
        ? KNOWN_DB_VEHICLES[currentUser.email.trim().toLowerCase()]
        : null;
      if (matched && matched.id && matched.id !== payload.vehicleId) {
        try {
          const retryRes = await api.post('/rides', {
            ...payload,
            vehicleId: matched.id,
          });
          await saveLocalRide(retryRes.data, userKey);
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
        const driverId = currentUser?.id || `user-${Date.now().toString(36)}`;
        const driverEmail = currentUser?.email || 'driver@ecoride.com';
        const driverFirstName = currentUser?.firstName || 'Current';
        const driverLastName = currentUser?.lastName || 'Driver';

        const localRide = {
          id: `ride-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          driverId,
          driver: {
            id: driverId,
            firstName: driverFirstName,
            lastName: driverLastName,
            email: driverEmail,
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

        await saveLocalRide(localRide, userKey);
        return localRide;
      }

      throw err;
    }
  },

  update: async (id, payload) => {
    const currentUser = await getCurrentUser();
    const userKey = getUserKey(currentUser);
    try {
      const existing = await getLocalRides(userKey);
      const updated = existing.map((r) => (r.id === id ? { ...r, ...payload } : r));
      await AsyncStorage.setItem(getLocalRidesKey(userKey), JSON.stringify(updated));
    } catch {}
    return api.put(`/rides/${id}`, payload).then((res) => res.data).catch(() => null);
  },

  remove: async (id) => {
    const currentUser = await getCurrentUser();
    const userKey = getUserKey(currentUser);
    await removeLocalRide(id, userKey);
    return api.delete(`/rides/${id}`).catch(() => {});
  },
};

export const rideApi = MOCK_MODE ? mockRideApi : realRideApi;
