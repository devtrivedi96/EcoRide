import { io } from 'socket.io-client';
import { SOCKET_URL } from './config';

export function createTripSocket(token) {
  return io(SOCKET_URL, {
    path: '/ws',
    transports: ['websocket'],
    auth: { token },
  });
}
