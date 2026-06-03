// Punto de entrada para IIS + iisnode (Plesk Windows)
// Este archivo arranca el servidor backend.

try {
  require('./backend/server.js');
} catch (err) {
  // Si hay un error al arrancar, mostrarlo claramente en el log de iisnode
  console.error('=== ERROR AL INICIAR EL SERVIDOR ===');
  console.error(err.message);
  console.error(err.stack);

  // Crear un servidor HTTP mínimo para que iisnode pueda mostrar el error
  const http = require('http');
  const server = http.createServer((req, res) => {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(
      'ERROR AL INICIAR KAHOOT CLONE\n\n' +
      err.message + '\n\n' +
      err.stack
    );
  });
  server.listen(process.env.PORT || 3001);
}
