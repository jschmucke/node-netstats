import { io, Socket } from 'socket.io-client';

export const socket: Socket = io('/primus', {
  path: '/socket.io',
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1_000,
  reconnectionDelayMax: 10_000,
  autoConnect: false,
});
