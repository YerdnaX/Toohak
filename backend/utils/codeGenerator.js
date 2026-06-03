/**
 * Generadores de identificadores únicos para el sistema
 */

// Genera un código numérico de 6 dígitos para que los invitados accedan al juego
function generarCodigoSesion() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Genera un ID único usando timestamp + cadena aleatoria
function generarId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

module.exports = { generarCodigoSesion, generarId };
