'use client';

import { io, type Socket } from 'socket.io-client';
import { API_URL } from './constants';

export const socket: Socket = io(API_URL, {
  autoConnect: false,
  withCredentials: true,
});

export function connectSocket() {
  if (!socket.connected) {
    socket.connect();
  }
}

export function disconnectSocket() {
  if (socket.connected) {
    socket.disconnect();
  }
}
