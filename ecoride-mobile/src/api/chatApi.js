import api from './axios';
import { MOCK_MODE } from './config';
import { mockChatApi } from '../mock/mockApi';

const realChatApi = {
  history: (tripId) => api.get(`/chat/${tripId}`).then((res) => res.data),
};

export const chatApi = MOCK_MODE ? mockChatApi : realChatApi;
