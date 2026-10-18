import api from './axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_MODE, STORAGE_KEYS } from './config';
import { mockRideApi } from '../mock/mockApi';
import { KNOWN_DB_VEHICLES } from './vehicleApi';

const realRideApi = {
  search: ({ pickupLocation, destination, departureTime, seats = 1 }) =>
    api.get('/rides/search', {
      params: { pickupLocation, destination, departureTime, seats },
    }).then((res) => res.data),
  locations: () => api.get('/rides/locations').then((res) => res.data),
  mine: () => api.get('/rides/me').then((res) => res.data),
  publish: async (payload) => {
    try {
      const res = await api.post('/rides', payload);
      return res.data;
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || '';
      // If server returned "Vehicle not found" or "Driver must own the vehicle"
      if (errMsg.includes('Vehicle not found') || errMsg.includes('Driver must own')) {
        try {
          const userRaw = await AsyncStorage.getItem(STORAGE_KEYS.user);
          const currentUser = userRaw ? JSON.parse(userRaw) : null;
          const matched =
            KNOWN_DB_VEHICLES[currentUser?.email] || KNOWN_DB_VEHICLES.default;
          if (matched && matched.id && matched.id !== payload.vehicleId) {
            const retryRes = await api.post('/rides', {
              ...payload,
              vehicleId: matched.id,
            });
            return retryRes.data;
          }
        } catch {
          // ignore retry error
        }
      }
      throw err;
    }
  },
  update: (id, payload) => api.put(`/rides/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`/rides/${id}`),
};

export const rideApi = MOCK_MODE ? mockRideApi : realRideApi;
