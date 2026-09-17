import api from './axios';

export const chatApi = {
  history: (tripId) => api.get(`/chat/${tripId}`).then((res) => res.data),
};
