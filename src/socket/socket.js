import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io({ autoConnect: false, auth: { token: localStorage.getItem('token') } });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  s.auth = { token: localStorage.getItem('token') };
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) socket.disconnect();
}
