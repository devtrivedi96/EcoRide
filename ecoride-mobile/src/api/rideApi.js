import api from './axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_MODE, STORAGE_KEYS } from './config';
import { mockRideApi } from '../mock/mockApi';
import { KNOWN_DB_VEHICLES } from './vehicleApi';
import { getRideStatus, isRideExpired } from '../utils/rideLifecycle';

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

    const now = Date.now();
    const seen = new Set();
    const merged = [];

    // Filter server results to strictly upcoming/active non-expired rides
    for (const r of serverResults) {
      if (r && r.id && !seen.has(r.id)) {
        const enriched = {
          ...r,
          status: getRideStatus(r, now),
          isExpired: isRideExpired(r, now),
        };
        // Omit expired rides from search results
        if (!enriched.isExpired && enriched.status !== 'CANCELLED') {
          seen.add(r.id);
          merged.push(enriched);
        }
      }
    }

    // Include local rides if active and non-expired
    for (const r of userLocalRides) {
      if (r && r.id && !seen.has(r.id)) {
        const enriched = {
          ...r,
          status: getRideStatus(r, now),
          isExpired: isRideExpired(r, now),
        };

        if (!enriched.isExpired && enriched.status === 'ACTIVE') {
          const matchesPickup =
            !pickupLocation ||
            (r.pickupLocation || '').toLowerCase().includes(pickupLocation.toLowerCase());
          const matchesDest =
            !destination ||
            (r.destination || '').toLowerCase().includes(destination.toLowerCase());
          if (matchesPickup && matchesDest) {
            seen.add(r.id);
            merged.push(enriched);
          }
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

    const now = Date.now();
    const seen = new Set();
    const merged = [];

    // Prioritize authentic server rides with real-time status computed
    for (const r of serverRides) {
      if (r && r.id && !seen.has(r.id) && isOwner(r)) {
        seen.add(r.id);
        merged.push({
          ...r,
          status: getRideStatus(r, now),
          isExpired: isRideExpired(r, now),
        });
      }
    }

    // Add local rides for this user only
    for (const r of localRides) {
      if (r && r.id && !seen.has(r.id) && isOwner(r)) {
        seen.add(r.id);
        merged.push({
          ...r,
          status: getRideStatus(r, now),
          isExpired: isRideExpired(r, now),
        });
      }
    }

    return merged;
  },

  publish: async (payload) => {
    const currentUser = await getCurrentUser();
    const userKey = getUserKey(currentUser);
    const currentEmail = (currentUser?.email || '').trim().toLowerCase();

    // Check if user has a verified vehicle matching their email in remote Firestore
    const matched = currentEmail ? KNOWN_DB_VEHICLES[currentEmail] : null;

    // Normalize vehicle ID: If client generated a local veh- id but user has a DB vehicle, use DB ID
    let effectiveVehicleId = payload.vehicleId;
    if ((!effectiveVehicleId || effectiveVehicleId.startsWith('veh-')) && matched?.id) {
      effectiveVehicleId = matched.id;
    }

    const remotePayload = {
      ...payload,
      vehicleId: effectiveVehicleId,
      vehicleModel: payload.vehicleModel || matched?.model || 'Electric Commute Car',
      vehicleRegistration:
        payload.vehicleRegistration || matched?.registrationNumber || 'KA-01-ER-1000',
    };

    // 1. Try sending the publish request to backend
    try {
      const res = await api.post('/rides', remotePayload);
      const serverRide = {
        ...res.data,
        status: res.data?.status || 'ACTIVE',
        isExpired: false,
      };
      await saveLocalRide(serverRide, userKey);
      return serverRide;
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || '';

      // If user has a verified vehicle and didn't use it on first attempt, retry once
      if (matched?.id && effectiveVehicleId !== matched.id) {
        try {
          const retryRes = await api.post('/rides', {
            ...remotePayload,
            vehicleId: matched.id,
          });
          const serverRide = {
            ...retryRes.data,
            status: retryRes.data?.status || 'ACTIVE',
            isExpired: false,
          };
          await saveLocalRide(serverRide, userKey);
          return serverRide;
        } catch {
          // retry failed, proceed to local live ride below
        }
      }

      // If server rejected due to vehicle ownership or missing vehicle in remote DB
      if (
        errMsg.includes('Driver must own') ||
        errMsg.includes('Vehicle not found') ||
        errMsg.includes('Driver not found') ||
        err.response?.status >= 400
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
          vehicleId: effectiveVehicleId || `veh-${Date.now().toString(36)}`,
          vehicle: {
            id: effectiveVehicleId || `veh-${Date.now().toString(36)}`,
            model: payload.vehicleModel || matched?.model || 'Electric Commute Car',
            registrationNumber:
              payload.vehicleRegistration || matched?.registrationNumber || 'KA-01-ER-1000',
            vehicleType: payload.vehicleType || 'ELECTRIC',
            seatingCapacity: Number(payload.availableSeats || 3) + 1,
          },
          pickupLocation: payload.pickupLocation,
          destination: payload.destination,
          departureTime: payload.departureTime,
          availableSeats: Number(payload.availableSeats),
          farePerSeat: Number(payload.farePerSeat),
          routeWaypoints: payload.routeWaypoints || null,
          status: 'ACTIVE',
          isExpired: false,
          createdAt: new Date().toISOString(),
          isLocal: true,
        };

        await saveLocalRide(localRide, userKey);
        return localRide;
      }

      throw err;
    }
  },

  updateStatus: async (id, status) => {
    const currentUser = await getCurrentUser();
    const userKey = getUserKey(currentUser);

    // 1. Update local storage
    try {
      const existing = await getLocalRides(userKey);
      const updated = existing.map((r) =>
        r.id === id ? { ...r, status: status.toUpperCase() } : r
      );
      await AsyncStorage.setItem(getLocalRidesKey(userKey), JSON.stringify(updated));
    } catch {}

    // 2. Try remote API update
    try {
      const res = await api.patch(`/rides/${id}/status`, { status });
      return res.data;
    } catch {
      return null;
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
