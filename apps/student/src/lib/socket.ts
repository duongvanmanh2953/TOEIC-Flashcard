import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const serverUrl =
      import.meta.env.VITE_WS_URL ||
      import.meta.env.VITE_API_URL?.replace('/api/v1', '') ||
      (isLocal ? `${window.location.protocol}//${window.location.hostname}:4000` : window.location.origin);

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

let chatSocket: Socket | null = null;

export const getChatSocket = (userId?: string): Socket => {
  if (!chatSocket) {
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const serverUrl =
      import.meta.env.VITE_WS_URL ||
      import.meta.env.VITE_API_URL?.replace('/api/v1', '') ||
      (isLocal ? `${window.location.protocol}//${window.location.hostname}:4000` : window.location.origin);

    chatSocket = io(`${serverUrl}/chat`, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      autoConnect: true,
      query: userId ? { userId } : undefined,
    });

    chatSocket.on('connect', () => {
      console.log('💬 Connected to VocabFlow Realtime E2EE Chat Gateway:', chatSocket?.id);
      if (userId) {
        chatSocket?.emit('register_user', { userId });
      }
    });

    chatSocket.on('disconnect', (reason) => {
      console.log('💬 Disconnected from Chat Gateway:', reason);
    });
  } else if (userId) {
    chatSocket.emit('register_user', { userId });
  }

  return chatSocket;
};

export default getSocket;

