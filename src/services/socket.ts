import { io, Socket } from 'socket.io-client';
import { authStorage } from './api';

let socketInstance: Socket | null = null;

export function getInterviewSocket(customToken?: string): Socket {
  const token = customToken || authStorage.getToken();

  if (socketInstance && socketInstance.connected) {
    return socketInstance;
  }

  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }

  // Connect to the same origin host/port
  socketInstance = io({
    auth: {
      token,
    },
    query: {
      token: token || '',
    },
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socketInstance.on('connect', () => {
    console.log('[Socket] Connected to signaling server, ID:', socketInstance?.id);
  });

  socketInstance.on('connect_error', (err) => {
    console.warn('[Socket] Connection error:', err.message);
  });

  socketInstance.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  return socketInstance;
}

export function disconnectInterviewSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
