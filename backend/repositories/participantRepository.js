/**
 * Repositorio de Participantes para SQL Server.
 */

// const { sql, getConnection } = require('../config/db');

async function createParticipant(jugador, codigoSesion) {
  // TODO: SQL Server
  // const pool = await getConnection();
  // const sesionResult = await pool.request()
  //   .input('codigo', sql.NVarChar(10), codigoSesion)
  //   .query('SELECT IdSesion FROM SesionesJuego WHERE CodigoSesion = @codigo');
  //
  // const idSesion = sesionResult.recordset[0]?.IdSesion;
  // if (!idSesion) throw new Error('Sesión no encontrada');
  //
  // const result = await pool.request()
  //   .input('idSesion', sql.Int, idSesion)
  //   .input('nombre', sql.NVarChar(100), jugador.nombre)
  //   .input('socketId', sql.NVarChar(100), jugador.socketId)
  //   .query(`
  //     INSERT INTO Participantes (IdSesion, NombreParticipante, SocketId)
  //     OUTPUT INSERTED.*
  //     VALUES (@idSesion, @nombre, @socketId)
  //   `);
  // return result.recordset[0];

  return jugador;
}

async function updateParticipantScore(nombre, codigoSesion, puntajeTotal) {
  // TODO: SQL Server
  // const pool = await getConnection();
  // await pool.request()
  //   .input('nombre', sql.NVarChar(100), nombre)
  //   .input('codigo', sql.NVarChar(10), codigoSesion)
  //   .input('puntaje', sql.Int, puntajeTotal)
  //   .query(`
  //     UPDATE p SET p.PuntajeTotal = @puntaje
  //     FROM Participantes p
  //     INNER JOIN SesionesJuego s ON p.IdSesion = s.IdSesion
  //     WHERE p.NombreParticipante = @nombre AND s.CodigoSesion = @codigo
  //   `);

  return true;
}

async function getParticipantsBySession(codigoSesion) {
  // TODO: SQL Server
  // const pool = await getConnection();
  // const result = await pool.request()
  //   .input('codigo', sql.NVarChar(10), codigoSesion)
  //   .query(`
  //     SELECT p.*
  //     FROM Participantes p
  //     INNER JOIN SesionesJuego s ON p.IdSesion = s.IdSesion
  //     WHERE s.CodigoSesion = @codigo
  //     ORDER BY p.PuntajeTotal DESC
  //   `);
  // return result.recordset;

  return [];
}

module.exports = { createParticipant, updateParticipantScore, getParticipantsBySession };
