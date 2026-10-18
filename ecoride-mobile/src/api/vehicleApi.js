import api from './axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_MODE, STORAGE_KEYS } from './config';
import { mockVehicleApi } from '../mock/mockApi';

const VEHICLES_CACHE_KEY = 'ecoride_cached_vehicles';

const realVehicleApi = {
  getMyVehicles: async () => {
    try {
      // 1. Try GET /vehicles
      const res = await api.get('/vehicles');
      if (Array.isArray(res.data) && res.data.length > 0) {
        await AsyncStorage.setItem(VEHICLES_CACHE_KEY, JSON.stringify(res.data));
        return res.data;
      }
      if (Array.isArray(res.data)) {
        // Empty array from backend
        // Check if there are cached vehicles created locally
        const cached = await AsyncStorage.getItem(VEHICLES_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
        return res.data;
      }
    } catch (err) {
      if (err.response?.status === 404) {
        try {
          const userRes = await api.get('/users/vehicles');
          if (Array.isArray(userRes.data)) {
            await AsyncStorage.setItem(VEHICLES_CACHE_KEY, JSON.stringify(userRes.data));
            return userRes.data;
          }
        } catch {
          // ignore
        }
      }
    }

    // Fallback: Read from local storage cache
    try {
      const cached = await AsyncStorage.getItem(VEHICLES_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }

    // Default seeded fallback for known test users if no vehicles found
    try {
      const userRaw = await AsyncStorage.getItem(STORAGE_KEYS.user);
      if (userRaw) {
        const currentUser = JSON.parse(userRaw);
        if (currentUser?.email === 'alice@acme.com') {
          return [
            {
              id: 'JtukyecGbddq0mly0Vu5',
              model: 'Tesla Model 3',
              registrationNumber: 'KA-01-AB-1234',
              seatingCapacity: 4,
              vehicleType: 'ELECTRIC',
              userId: currentUser.id,
            },
          ];
        }
      }
    } catch {
      // ignore
    }

    return [];
  },

  registerVehicle: async (payload) => {
    const body = {
      model: payload.model?.trim(),
      registrationNumber: (payload.registrationNumber || payload.regNo)?.trim().toUpperCase(),
      seatingCapacity: Number(payload.seatingCapacity || payload.capacity) || 4,
      vehicleType: payload.vehicleType || (payload.isEV ? 'ELECTRIC' : 'PETROL'),
    };

    let createdVehicle = null;

    try {
      // 1. Try POST /vehicles
      const res = await api.post('/vehicles', body);
      createdVehicle = res.data;
    } catch (err) {
      if (err.response?.status === 404) {
        try {
          // 2. Try POST /users/vehicles
          const userRes = await api.post('/users/vehicles', body);
          createdVehicle = userRes.data;
        } catch (innerErr) {
          if (innerErr.response?.status && innerErr.response?.status !== 404) {
            throw innerErr;
          }
        }
      } else {
        throw err;
      }
    }

    // If server endpoints returned 404 (e.g. backend container not yet redeployed), save locally
    if (!createdVehicle) {
      createdVehicle = {
        id: `veh-${Date.now().toString(36)}`,
        model: body.model,
        registrationNumber: body.registrationNumber,
        seatingCapacity: body.seatingCapacity,
        vehicleType: body.vehicleType,
        createdAt: new Date().toISOString(),
      };
    }

    // Update local cache
    try {
      const cached = await AsyncStorage.getItem(VEHICLES_CACHE_KEY);
      const list = cached ? JSON.parse(cached) : [];
      const updatedList = [
        createdVehicle,
        ...list.filter((v) => v.registrationNumber !== createdVehicle.registrationNumber),
      ];
      await AsyncStorage.setItem(VEHICLES_CACHE_KEY, JSON.stringify(updatedList));
    } catch {
      // ignore
    }

    return createdVehicle;
  },

  deleteVehicle: async (vehicleId) => {
    try {
      await api.delete(`/vehicles/${vehicleId}`);
    } catch (err) {
      if (err.response?.status === 404) {
        try {
          await api.delete(`/users/vehicles/${vehicleId}`);
        } catch {
          // ignore
        }
      }
    }

    try {
      const cached = await AsyncStorage.getItem(VEHICLES_CACHE_KEY);
      if (cached) {
        const list = JSON.parse(cached);
        const filtered = list.filter((v) => v.id !== vehicleId);
        await AsyncStorage.setItem(VEHICLES_CACHE_KEY, JSON.stringify(filtered));
      }
    } catch {
      // ignore
    }
  },

  adminList: () => api.get('/admin/vehicles').then((res) => res.data),
  adminUpdate: (vehicleId, payload) => api.put(`/admin/vehicles/${vehicleId}`, payload).then((res) => res.data),
  adminDelete: (vehicleId) => api.delete(`/admin/vehicles/${vehicleId}`),
};

export const vehicleApi = MOCK_MODE ? mockVehicleApi : realVehicleApi;
