import { io } from 'socket.io-client';

// En producción (Plesk) el frontend se sirve desde el mismo dominio que el backend,
// por lo que no se necesita URL explícita → Socket.IO se conecta al mismo origen.
// En desarrollo local apunta a http://localhost:3001
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const socket = io(BACKEND_URL || undefined, {
  autoConnect: false,
  transports: ['polling', 'websocket'], // polling first: iOS WebKit rejects WS handshake through iisnode
  upgrade: true,
  rememberUpgrade: false,
  timeout: 20000,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

export default socket;
