import api from './axios';
import { MOCK_MODE } from './config';
import { mockRideApi } from '../mock/mockApi';

const realRideApi = {
  search: ({ pickupLocation, destination, departureTime, seats = 1 }) =>
    api.get('/rides/search', {
      params: { pickupLocation, destination, departureTime, seats },
    }).then((res) => res.data),
  locations: () => api.get('/rides/locations').then((res) => res.data),
  mine: () => api.get('/rides/me').then((res) => res.data),
  publish: (payload) => api.post('/rides', payload).then((res) => res.data),
  update: (id, payload) => api.put(`/rides/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`/rides/${id}`),
};

export const rideApi = MOCK_MODE ? mockRideApi : realRideApi;
