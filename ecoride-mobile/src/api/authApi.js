import api from './axios';
import { MOCK_MODE } from './config';
import { mockAuthApi } from '../mock/mockApi';

const realAuthApi = {
  register: (payload) => api.post('/auth/register', payload).then((res) => res.data),
  login: (payload) => api.post('/auth/login', payload).then((res) => res.data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }).then((res) => res.data),
  resetPassword: (payload) => api.post('/auth/reset-password', payload).then((res) => res.data),
};

export const authApi = MOCK_MODE ? mockAuthApi : realAuthApi;
