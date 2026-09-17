import api from './axios';

export const vehicleApi = {
  adminList: () => api.get('/admin/vehicles').then((res) => res.data),
  adminUpdate: (vehicleId, payload) => api.put(`/admin/vehicles/${vehicleId}`, payload).then((res) => res.data),
  adminDelete: (vehicleId) => api.delete(`/admin/vehicles/${vehicleId}`),
};
