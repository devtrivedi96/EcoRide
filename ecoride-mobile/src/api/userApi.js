import api from './axios';
import { MOCK_MODE } from './config';
import { mockUserApi } from '../mock/mockApi';

const realUserApi = {
  me: () => api.get('/users/me').then((res) => res.data),
  resetPassword: (newPassword) => api.put('/users/reset-password', { newPassword }).then((res) => res.data),
  savedPlaces: () => api.get('/users/saved-places').then((res) => res.data),
  addSavedPlace: (payload) => api.post('/users/saved-places', payload).then((res) => res.data),
  deleteSavedPlace: (id) => api.delete(`/users/saved-places/${id}`),
};

export const userApi = MOCK_MODE ? mockUserApi : realUserApi;
