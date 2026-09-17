import { io } from 'socket.io-client';
import { SOCKET_URL, MOCK_MODE } from './config';
import { createMockTripSocket } from '../mock/mockApi';

export function createTripSocket(token, tripId, onMessage) {
  if (MOCK_MODE) {
    return createMockTripSocket(tripId, onMessage);
  }
  return io(SOCKET_URL, {
    path: '/ws',
    transports: ['websocket'],
    auth: { token },
  });
}
