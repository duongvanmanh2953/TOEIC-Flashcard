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

let chatSocket: Socket | null = null;

export const getChatSocket = (userId?: string): Socket => {
  if (!chatSocket) {
    const serverUrl =
      import.meta.env.VITE_API_URL?.replace('/api/v1', '') ||
      `${window.location.protocol}//${window.location.hostname}:4000`;

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

let isLifecycleBound = false;

function bindBfcacheLifecycle() {
  if (isLifecycleBound || typeof window === 'undefined') return;
  isLifecycleBound = true;

  window.addEventListener('pagehide', () => {
    // Gracefully close active connections when navigating into bfcache
    if (socket?.connected) {
      socket.disconnect();
    }
    if (chatSocket?.connected) {
      chatSocket.disconnect();
    }
  });

  window.addEventListener('pageshow', (event) => {
    // Reconnect when restored from back/forward cache
    if (event.persisted) {
      if (socket && !socket.connected) {
        socket.connect();
      }
      if (chatSocket && !chatSocket.connected) {
        chatSocket.connect();
      }
    }
  });
}

// Bind bfcache lifecycle early in client environment
bindBfcacheLifecycle();

export default getSocket;

