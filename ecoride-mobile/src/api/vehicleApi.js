import api from './axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_MODE, STORAGE_KEYS } from './config';
import { mockVehicleApi } from '../mock/mockApi';

const VEHICLES_CACHE_PREFIX = '@ecoride_vehicles_';

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

function getVehiclesKey(userKey) {
  return `${VEHICLES_CACHE_PREFIX}${userKey}`;
}

// Map of real, authentic vehicles residing in the Firestore database on Render for pre-seeded corporate accounts
export const KNOWN_DB_VEHICLES = {
  'alice@acme.com': {
    id: 'JtukyecGbddq0mly0Vu5',
    model: 'Tesla Model 3',
    registrationNumber: 'KA-01-AB-1234',
    seatingCapacity: 4,
    vehicleType: 'ELECTRIC',
  },
  'admin@acme.com': {
    id: 'mZfknCQZwcoplFKlcZAO',
    model: 'Kia Seltos',
    registrationNumber: 'MH-12-AB-9999',
    seatingCapacity: 4,
    vehicleType: 'ELECTRIC',
  },
  'siddharth.malhotra93@acme.com': {
    id: '5JwaatBAnohmRMQue81A',
    model: 'Honda City',
    registrationNumber: 'MH-26-AB-3144',
    seatingCapacity: 4,
    vehicleType: 'ELECTRIC',
  },
  'simran.rao15@acme.com': {
    id: '7XNfZiZfFu3gvp7c18OE',
    model: 'Honda City',
    registrationNumber: 'MH-18-AB-8497',
    seatingCapacity: 4,
    vehicleType: 'ELECTRIC',
  },
  'manoj.jain90@acme.com': {
    id: '8cezHq5FRApyrycSSOCy',
    model: 'Mahindra Thar',
    registrationNumber: 'MH-14-AB-9708',
    seatingCapacity: 4,
    vehicleType: 'ELECTRIC',
  },
  'sneha.iyer19@acme.com': {
    id: '9MfvtYzyiNsEP5PlQsra',
    model: 'Hyundai i20',
    registrationNumber: 'MH-34-AB-3070',
    seatingCapacity: 4,
    vehicleType: 'ELECTRIC',
  },
  'pooja.patel85@acme.com': {
    id: 'CoSWPcGFjCtQ0waRHTPs',
    model: 'Maruti Swift',
    registrationNumber: 'MH-43-AB-5636',
    seatingCapacity: 4,
    vehicleType: 'ELECTRIC',
  },
  'shreya.malhotra62@acme.com': {
    id: 'FtPaEojK1wPzDwWEd333',
    model: 'Maruti Swift',
    registrationNumber: 'MH-11-AB-4305',
    seatingCapacity: 4,
    vehicleType: 'ELECTRIC',
  },
  'pooja.joshi67@acme.com': {
    id: 'I5HFQAggTiQkGW7AkfVm',
    model: 'Mahindra Thar',
    registrationNumber: 'MH-13-AB-7613',
    seatingCapacity: 4,
    vehicleType: 'ELECTRIC',
  },
  'anjali.malhotra39@acme.com': {
    id: 'Jfeyt57n4OvK0M8jc9E6',
    model: 'Maruti Swift',
    registrationNumber: 'MH-05-AB-1794',
    seatingCapacity: 4,
    vehicleType: 'ELECTRIC',
  },
  'neha.desai80@acme.com': {
    id: 'MHA1c06a4JOtFgxftL6H',
    model: 'Toyota Innova',
    registrationNumber: 'MH-20-AB-4807',
    seatingCapacity: 4,
    vehicleType: 'ELECTRIC',
  },
  'sneha.patel81@acme.com': {
    id: 'MYE9M3HG1jBXMw53bsbo',
    model: 'Tata Nexon',
    registrationNumber: 'MH-30-AB-6005',
    seatingCapacity: 4,
    vehicleType: 'ELECTRIC',
  },
  'arjun.nair100@acme.com': {
    id: 'Nfn8PMbTL9GCVNR5Ujjq',
    model: 'Tata Nexon',
    registrationNumber: 'MH-29-AB-9405',
    seatingCapacity: 4,
    vehicleType: 'ELECTRIC',
  },
};

const realVehicleApi = {
  getMyVehicles: async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) return [];

    const userKey = getUserKey(currentUser);
    const currentEmail = (currentUser.email || '').trim().toLowerCase();
    const currentId = currentUser.id;
    const cacheKey = getVehiclesKey(userKey);

    // 1. Try fetching from backend /vehicles or /users/vehicles
    try {
      const res = await api.get('/vehicles');
      if (Array.isArray(res.data) && res.data.length > 0) {
        await AsyncStorage.setItem(cacheKey, JSON.stringify(res.data));
        return res.data;
      }
    } catch (err) {
      if (err.response?.status === 404) {
        try {
          const userRes = await api.get('/users/vehicles');
          if (Array.isArray(userRes.data) && userRes.data.length > 0) {
            await AsyncStorage.setItem(cacheKey, JSON.stringify(userRes.data));
            return userRes.data;
          }
        } catch {}
      }
    }

    // 2. Load locally cached vehicles for THIS account
    let localVehicles = [];
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          localVehicles = parsed;
        }
      }
    } catch {}

    // Check if this specific email is in the pre-seeded DB list
    const matchedDbVehicle = currentEmail ? KNOWN_DB_VEHICLES[currentEmail] : null;

    const seenRegs = new Set();
    const seenIds = new Set();
    const uniqueVehicles = [];

    for (const v of localVehicles) {
      if (!v || !v.registrationNumber) continue;
      const reg = v.registrationNumber.trim().toUpperCase();
      if (seenRegs.has(reg)) continue;
      seenRegs.add(reg);

      let id = v.id;
      if (!id || seenIds.has(id)) {
        id = `veh-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      }
      seenIds.add(id);

      uniqueVehicles.push({
        ...v,
        id,
        userId: currentId,
      });
    }

    // Only add matchedDbVehicle if the current user email specifically matches
    if (matchedDbVehicle && !seenRegs.has(matchedDbVehicle.registrationNumber)) {
      uniqueVehicles.unshift({
        ...matchedDbVehicle,
        userId: currentId,
      });
    }

    await AsyncStorage.setItem(cacheKey, JSON.stringify(uniqueVehicles));
    return uniqueVehicles;
  },

  registerVehicle: async (payload) => {
    const currentUser = await getCurrentUser();
    const userKey = getUserKey(currentUser);
    const cacheKey = getVehiclesKey(userKey);

    const body = {
      model: payload.model?.trim(),
      registrationNumber: (payload.registrationNumber || payload.regNo)?.trim().toUpperCase(),
      seatingCapacity: Number(payload.seatingCapacity || payload.capacity) || 4,
      vehicleType: payload.vehicleType || (payload.isEV ? 'ELECTRIC' : 'PETROL'),
    };

    let createdVehicle = null;

    try {
      // Try POST /vehicles
      const res = await api.post('/vehicles', body);
      createdVehicle = res.data;
    } catch (err) {
      try {
        const userRes = await api.post('/users/vehicles', body);
        createdVehicle = userRes.data;
      } catch {
        // fallback locally
      }
    }

    // Always generate a unique ID for new vehicles
    if (!createdVehicle) {
      createdVehicle = {
        id: `veh-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        model: body.model,
        registrationNumber: body.registrationNumber,
        seatingCapacity: body.seatingCapacity,
        vehicleType: body.vehicleType,
        userId: currentUser?.id,
        createdAt: new Date().toISOString(),
      };
    }

    // Update account-scoped local cache without duplicates
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      const list = cached ? JSON.parse(cached) : [];
      const updatedList = [
        createdVehicle,
        ...list.filter(
          (v) =>
            v &&
            v.id !== createdVehicle.id &&
            v.registrationNumber !== createdVehicle.registrationNumber
        ),
      ];
      await AsyncStorage.setItem(cacheKey, JSON.stringify(updatedList));
    } catch {}

    return createdVehicle;
  },

  deleteVehicle: async (vehicleId) => {
    const currentUser = await getCurrentUser();
    const userKey = getUserKey(currentUser);
    const cacheKey = getVehiclesKey(userKey);

    try {
      await api.delete(`/vehicles/${vehicleId}`);
    } catch {
      try {
        await api.delete(`/users/vehicles/${vehicleId}`);
      } catch {}
    }

    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const list = JSON.parse(cached);
        const filtered = list.filter((v) => v.id !== vehicleId);
        await AsyncStorage.setItem(cacheKey, JSON.stringify(filtered));
      }
    } catch {}
  },

  adminList: () => api.get('/admin/vehicles').then((res) => res.data),
  adminUpdate: (vehicleId, payload) =>
    api.put(`/admin/vehicles/${vehicleId}`, payload).then((res) => res.data),
  adminDelete: (vehicleId) => api.delete(`/admin/vehicles/${vehicleId}`),
};

export const vehicleApi = MOCK_MODE ? mockVehicleApi : realVehicleApi;
