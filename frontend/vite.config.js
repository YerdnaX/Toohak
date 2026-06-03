import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Rutas absolutas desde la raíz del dominio (correcto para dominio raíz + React Router)
  base: '/',
  plugins: [react()],
  server: {
    port: 5173
  },
  build: {
    // Genera el build DENTRO de backend/public/ para que Express lo sirva directamente.
    // Así no hay ambigüedad de rutas al subir al servidor Plesk.
    outDir: '../backend/public',
    sourcemap: false,
    emptyOutDir: false
  }
});
