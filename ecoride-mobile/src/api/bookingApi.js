import api from './axios';
import { MOCK_MODE } from './config';
import { mockBookingApi } from '../mock/mockApi';

const realBookingApi = {
  book: (payload) => api.post('/trips', payload).then((res) => res.data),
  myTrips: () => api.get('/trips/me').then((res) => res.data),
  driverTrips: () => api.get('/trips/driver').then((res) => res.data),
  cancel: (tripId) => api.patch(`/trips/${tripId}/cancel`).then((res) => res.data),
  accept: (tripId) => api.post(`/trips/${tripId}/accept`).then((res) => res.data),
  reject: (tripId) => api.post(`/trips/${tripId}/reject`).then((res) => res.data),
  updateStatus: (tripId, status) => api.patch(`/trips/${tripId}/status`, null, { params: { status } }).then((res) => res.data),
  verifyOtp: (tripId, otp) => api.post(`/trips/${tripId}/verify-otp`, null, { params: { otp } }).then((res) => res.data),
};

export const bookingApi = MOCK_MODE ? mockBookingApi : realBookingApi;
