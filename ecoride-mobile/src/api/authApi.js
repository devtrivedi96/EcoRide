import api from './axios';

export const authApi = {
  register: (payload) => api.post('/auth/register', payload).then((res) => res.data),
  login: (payload) => api.post('/auth/login', payload).then((res) => res.data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }).then((res) => res.data),
  resetPassword: (payload) => api.post('/auth/reset-password', payload).then((res) => res.data),
};
