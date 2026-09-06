import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const serverUrl =
      import.meta.env.VITE_API_URL?.replace('/api/v1', '') ||
      `${window.location.protocol}//${window.location.hostname}:4000`;

    socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('⚡ Connected to VocabFlow Realtime WebSocket Server:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from Realtime WebSocket Server:', reason);
    });
  }

  return socket;
};

export default getSocket;
