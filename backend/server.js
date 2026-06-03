const path = require('path');
const fs = require('fs');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Buscar .env en la carpeta backend/ (donde está este archivo).
// Funciona tanto en local como cuando Plesk ejecuta desde la raíz del proyecto.
const envPath = path.resolve(__dirname, '.env');
require('dotenv').config({ path: envPath });

const kahootRoutes = require('./routes/kahootRoutes');
const resultRoutes = require('./routes/resultRoutes');
const { initGameSocket } = require('./sockets/gameSocket');

const app = express();
const server = http.createServer(app);

const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// En producción el frontend está en el mismo dominio (no se necesita CORS).
// En desarrollo se permite localhost:5173.
const corsOrigin = NODE_ENV === 'production' ? FRONTEND_URL : '*';

const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST']
  },
  // pingTimeout amplio para que iOS no desconecte al bloquear pantalla
  pingTimeout: 60000,
  pingInterval: 25000,
  // El cliente usará polling primero y luego intentará upgrade a WebSocket
  transports: ['polling', 'websocket']
});

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

// Rutas de la API REST
app.use('/api/kahoot', kahootRoutes);
app.use('/api/results', resultRoutes);

// Ruta de verificación de estado del servidor (health check)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    entorno: NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// En producción: el backend sirve el frontend compilado de React.
// Esto permite que todo corra desde un solo proceso Node.js en Plesk.
if (NODE_ENV === 'production') {
  const staticCandidates = [
    path.join(__dirname, 'public'),
    path.join(__dirname, '..', 'frontend', 'dist')
  ];

  const frontendBuild = staticCandidates.find((candidatePath) => {
    const indexPath = path.join(candidatePath, 'index.html');
    return fs.existsSync(indexPath);
  });

  if (!frontendBuild) {
    console.error('No se encontro un build del frontend.');
    console.error('Rutas revisadas:', staticCandidates.join(' | '));
  } else {
    console.log('Frontend estatico servido desde:', frontendBuild);
    app.use(express.static(frontendBuild));
  }

  // React Router (BrowserRouter): cualquier ruta desconocida devuelve index.html.
  // Nota: con base './' en vite, los assets se cargan con rutas relativas.
  // Este handler envía index.html para que React Router maneje la navegación.
  app.get('*', (req, res) => {
    if (!frontendBuild) {
      return res.status(503).json({
        error: 'Frontend no compilado. Ejecuta: cd frontend && npm run build'
      });
    }

    res.sendFile(path.join(frontendBuild, 'index.html'));
  });
}

// Inicializar Socket.IO
initGameSocket(io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor Kahoot Clone corriendo en puerto ${PORT} [${NODE_ENV}]`);
});
