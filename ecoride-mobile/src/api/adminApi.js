import api from './axios';

export const adminApi = {
  stats: () => api.get('/admin/dashboard/stats').then((res) => res.data),
  users: () => api.get('/admin/users').then((res) => res.data),
  updateUser: (userId, payload) => api.put(`/admin/users/${userId}`, payload).then((res) => res.data),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  setRole: (userId, role) => api.put(`/admin/users/${userId}/role`, null, { params: { role } }).then((res) => res.data),
  vehicles: () => api.get('/admin/vehicles').then((res) => res.data),
  trips: () => api.get('/admin/trips').then((res) => res.data),
  analytics: () => api.get('/analytics/dashboard').then((res) => res.data),
};
