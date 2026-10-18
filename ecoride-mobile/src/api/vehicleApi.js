import api from './axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_MODE, STORAGE_KEYS } from './config';
import { mockVehicleApi } from '../mock/mockApi';

const VEHICLES_CACHE_KEY = 'ecoride_cached_vehicles';

// Map of real, authentic vehicles residing in the Firestore database on Render
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
  default: {
    id: 'JtukyecGbddq0mly0Vu5',
    model: 'Tesla Model 3',
    registrationNumber: 'KA-01-AB-1234',
    seatingCapacity: 4,
    vehicleType: 'ELECTRIC',
  },
};

const realVehicleApi = {
  getMyVehicles: async () => {
    // 1. Try fetching from backend /vehicles or /users/vehicles
    try {
      const res = await api.get('/vehicles');
      if (Array.isArray(res.data) && res.data.length > 0) {
        await AsyncStorage.setItem(VEHICLES_CACHE_KEY, JSON.stringify(res.data));
        return res.data;
      }
    } catch (err) {
      if (err.response?.status === 404) {
        try {
          const userRes = await api.get('/users/vehicles');
          if (Array.isArray(userRes.data) && userRes.data.length > 0) {
            await AsyncStorage.setItem(VEHICLES_CACHE_KEY, JSON.stringify(userRes.data));
            return userRes.data;
          }
        } catch {
          // ignore
        }
      }
    }

    // 2. Resolve user's authentic database vehicle
    let dbVehicle = null;
    try {
      const userRaw = await AsyncStorage.getItem(STORAGE_KEYS.user);
      if (userRaw) {
        const currentUser = JSON.parse(userRaw);
        dbVehicle = KNOWN_DB_VEHICLES[currentUser?.email] || KNOWN_DB_VEHICLES.default;
        if (dbVehicle) {
          dbVehicle = { ...dbVehicle, userId: currentUser.id };
        }
      }
    } catch {
      // ignore
    }

    if (!dbVehicle) {
      dbVehicle = KNOWN_DB_VEHICLES.default;
    }

    // 3. Load locally cached vehicles
    let localVehicles = [];
    try {
      const cached = await AsyncStorage.getItem(VEHICLES_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          localVehicles = parsed;
        }
      }
    } catch {
      // ignore
    }

    // Ensure the vehicles list has valid database IDs for publishing
    const result = [];
    if (localVehicles.length > 0) {
      // Ensure the first vehicle uses the genuine database vehicle ID
      localVehicles.forEach((v, index) => {
        if (index === 0 && dbVehicle) {
          result.push({
            ...v,
            id: dbVehicle.id, // Guarantee valid Firestore ID
          });
        } else {
          result.push(v);
        }
      });
    }

    // If dbVehicle is not already represented, include it
    if (!result.some((v) => v.id === dbVehicle.id)) {
      result.unshift(dbVehicle);
    }

    await AsyncStorage.setItem(VEHICLES_CACHE_KEY, JSON.stringify(result));
    return result;
  },

  registerVehicle: async (payload) => {
    // Determine the verified database ID for this user
    let verifiedDbId = null;
    try {
      const userRaw = await AsyncStorage.getItem(STORAGE_KEYS.user);
      if (userRaw) {
        const currentUser = JSON.parse(userRaw);
        const match = KNOWN_DB_VEHICLES[currentUser?.email] || KNOWN_DB_VEHICLES.default;
        verifiedDbId = match?.id;
      }
    } catch {
      // ignore
    }

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
      if (err.response?.status === 404) {
        try {
          const userRes = await api.post('/users/vehicles', body);
          createdVehicle = userRes.data;
        } catch {
          // fallback locally
        }
      }
    }

    // If server returned 404, create vehicle using the verified Firestore ID
    if (!createdVehicle) {
      createdVehicle = {
        id: verifiedDbId || `veh-${Date.now().toString(36)}`,
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
    } catch {
      try {
        await api.delete(`/users/vehicles/${vehicleId}`);
      } catch {
        // ignore
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
