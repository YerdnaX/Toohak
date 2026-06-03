/**
 * Almacenamiento en memoria para prueba de concepto.
 *
 * MIGRACIÓN A SQL SERVER:
 * - Kahoots → kahootRepository.js
 * - Sesiones → sessionRepository.js
 * - Participantes → participantRepository.js
 * - Resultados → resultRepository.js
 *
 * Buscar comentarios "TODO: SQL Server" en el código para
 * identificar exactamente los puntos de reemplazo.
 */

// Almacén de Kahoots creados
const kahoots = [];

// Almacén de sesiones activas (clave: código de sesión de 6 dígitos)
const sessions = {};

// ============= FUNCIONES DE KAHOOTS =============

function getAllKahoots() {
  return [...kahoots];
}

function getKahootById(id) {
  return kahoots.find(k => k.id === id) || null;
}

function createKahoot(kahoot) {
  kahoots.push(kahoot);
  return kahoot;
}

// ============= FUNCIONES DE SESIONES =============

function createSession(session) {
  sessions[session.codigo] = session;
  return session;
}

function getSession(codigo) {
  return sessions[codigo] || null;
}

function updateSession(codigo, updates) {
  if (sessions[codigo]) {
    Object.assign(sessions[codigo], updates);
  }
  return sessions[codigo];
}

function deleteSession(codigo) {
  delete sessions[codigo];
}

function getAllSessions() {
  return Object.values(sessions);
}

module.exports = {
  getAllKahoots,
  getKahootById,
  createKahoot,
  createSession,
  getSession,
  updateSession,
  deleteSession,
  getAllSessions
};
