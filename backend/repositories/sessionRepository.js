/**
 * Repositorio de Sesiones de Juego para SQL Server.
 */

// const { sql, getConnection } = require('../config/db');

async function createSession(session) {
  // TODO: SQL Server
  // const pool = await getConnection();
  // const result = await pool.request()
  //   .input('idKahoot', sql.Int, session.kahoot.id)
  //   .input('codigo', sql.NVarChar(10), session.codigo)
  //   .query(`
  //     INSERT INTO SesionesJuego (IdKahoot, CodigoSesion, EstadoSesion, PreguntaActual)
  //     OUTPUT INSERTED.*
  //     VALUES (@idKahoot, @codigo, 'waiting', -1)
  //   `);
  // return result.recordset[0];

  return session;
}

async function getSessionByCodigo(codigo) {
  // TODO: SQL Server
  // const pool = await getConnection();
  // const result = await pool.request()
  //   .input('codigo', sql.NVarChar(10), codigo)
  //   .query('SELECT * FROM SesionesJuego WHERE CodigoSesion = @codigo');
  // return result.recordset[0] || null;

  return null;
}

async function updateSessionEstado(codigo, estado, preguntaActual = null) {
  // TODO: SQL Server
  // const pool = await getConnection();
  // const request = pool.request()
  //   .input('codigo', sql.NVarChar(10), codigo)
  //   .input('estado', sql.NVarChar(50), estado);
  //
  // let query = 'UPDATE SesionesJuego SET EstadoSesion = @estado';
  // if (preguntaActual !== null) {
  //   request.input('pregunta', sql.Int, preguntaActual);
  //   query += ', PreguntaActual = @pregunta';
  // }
  // if (estado === 'finished') {
  //   query += ', FechaFin = GETDATE()';
  // }
  // query += ' WHERE CodigoSesion = @codigo';
  //
  // await request.query(query);

  return true;
}

module.exports = { createSession, getSessionByCodigo, updateSessionEstado };
