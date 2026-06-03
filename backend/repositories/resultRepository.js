/**
 * Repositorio de Resultados para SQL Server.
 * Maneja el guardado de respuestas individuales y resultados finales.
 */

// const { sql, getConnection } = require('../config/db');

async function saveAnswer(respuesta, codigoSesion) {
  // TODO: SQL Server
  // const pool = await getConnection();
  //
  // Primero obtener IdParticipante, IdSesion, IdPregunta, IdOpcion por nombre/codigo
  // const sesionResult = await pool.request()
  //   .input('codigo', sql.NVarChar(10), codigoSesion)
  //   .query('SELECT IdSesion FROM SesionesJuego WHERE CodigoSesion = @codigo');
  // const idSesion = sesionResult.recordset[0]?.IdSesion;
  //
  // const participanteResult = await pool.request()
  //   .input('nombre', sql.NVarChar(100), respuesta.nombreJugador)
  //   .input('idSesion', sql.Int, idSesion)
  //   .query('SELECT IdParticipante FROM Participantes WHERE NombreParticipante = @nombre AND IdSesion = @idSesion');
  // const idParticipante = participanteResult.recordset[0]?.IdParticipante;
  //
  // await pool.request()
  //   .input('idParticipante', sql.Int, idParticipante)
  //   .input('idSesion', sql.Int, idSesion)
  //   .input('esCorrecta', sql.Bit, respuesta.esCorrecta ? 1 : 0)
  //   .input('tiempoMs', sql.Int, respuesta.tiempoMs)
  //   .input('puntaje', sql.Int, respuesta.puntaje)
  //   .query(`
  //     INSERT INTO RespuestasParticipantes
  //     (IdParticipante, IdSesion, EsCorrecta, TiempoRespuestaMs, PuntajeObtenido)
  //     VALUES (@idParticipante, @idSesion, @esCorrecta, @tiempoMs, @puntaje)
  //   `);

  return true;
}

async function saveResultadosFinales(rankingFinal, codigoSesion) {
  // TODO: SQL Server
  // const pool = await getConnection();
  // const sesionResult = await pool.request()
  //   .input('codigo', sql.NVarChar(10), codigoSesion)
  //   .query('SELECT IdSesion FROM SesionesJuego WHERE CodigoSesion = @codigo');
  // const idSesion = sesionResult.recordset[0]?.IdSesion;
  //
  // for (const resultado of rankingFinal) {
  //   const partResult = await pool.request()
  //     .input('nombre', sql.NVarChar(100), resultado.nombre)
  //     .input('idSesion', sql.Int, idSesion)
  //     .query('SELECT IdParticipante FROM Participantes WHERE NombreParticipante = @nombre AND IdSesion = @idSesion');
  //   const idParticipante = partResult.recordset[0]?.IdParticipante;
  //
  //   await pool.request()
  //     .input('idSesion', sql.Int, idSesion)
  //     .input('idParticipante', sql.Int, idParticipante)
  //     .input('posicion', sql.Int, resultado.posicion)
  //     .input('puntaje', sql.Int, resultado.puntajeTotal)
  //     .input('correctas', sql.Int, resultado.respuestasCorrectas)
  //     .input('incorrectas', sql.Int, resultado.respuestasIncorrectas)
  //     .input('tiempoPromedio', sql.Int, resultado.tiempoPromedio)
  //     .query(`
  //       INSERT INTO ResultadosFinales
  //       (IdSesion, IdParticipante, Posicion, PuntajeTotal, RespuestasCorrectas, RespuestasIncorrectas, TiempoPromedioRespuestaMs)
  //       VALUES (@idSesion, @idParticipante, @posicion, @puntaje, @correctas, @incorrectas, @tiempoPromedio)
  //     `);
  //
  //   await pool.request()
  //     .input('puntaje', sql.Int, resultado.puntajeTotal)
  //     .input('idParticipante', sql.Int, idParticipante)
  //     .query('UPDATE Participantes SET PuntajeTotal = @puntaje WHERE IdParticipante = @idParticipante');
  // }

  return true;
}

async function getResultadosBySession(codigoSesion) {
  // TODO: SQL Server
  // const pool = await getConnection();
  // const result = await pool.request()
  //   .input('codigo', sql.NVarChar(10), codigoSesion)
  //   .query(`
  //     SELECT rf.Posicion, p.NombreParticipante, rf.PuntajeTotal,
  //            rf.RespuestasCorrectas, rf.RespuestasIncorrectas, rf.TiempoPromedioRespuestaMs
  //     FROM ResultadosFinales rf
  //     INNER JOIN Participantes p ON rf.IdParticipante = p.IdParticipante
  //     INNER JOIN SesionesJuego s ON rf.IdSesion = s.IdSesion
  //     WHERE s.CodigoSesion = @codigo
  //     ORDER BY rf.Posicion
  //   `);
  // return result.recordset;

  return [];
}

async function getDetalleRespuestasBySession(codigoSesion) {
  // TODO: SQL Server
  // const pool = await getConnection();
  // const result = await pool.request()
  //   .input('codigo', sql.NVarChar(10), codigoSesion)
  //   .query(`
  //     SELECT
  //       p.NombreParticipante,
  //       pr.TextoPregunta,
  //       or_sel.TextoOpcion AS RespuestaSeleccionada,
  //       or_cor.TextoOpcion AS RespuestaCorrecta,
  //       rp.EsCorrecta,
  //       rp.TiempoRespuestaMs,
  //       rp.PuntajeObtenido
  //     FROM RespuestasParticipantes rp
  //     INNER JOIN Participantes p ON rp.IdParticipante = p.IdParticipante
  //     INNER JOIN SesionesJuego s ON rp.IdSesion = s.IdSesion
  //     INNER JOIN Preguntas pr ON rp.IdPregunta = pr.IdPregunta
  //     LEFT JOIN OpcionesRespuesta or_sel ON rp.IdOpcionSeleccionada = or_sel.IdOpcion
  //     INNER JOIN OpcionesRespuesta or_cor ON or_cor.IdPregunta = pr.IdPregunta AND or_cor.EsCorrecta = 1
  //     WHERE s.CodigoSesion = @codigo
  //     ORDER BY p.NombreParticipante, pr.OrdenPregunta
  //   `);
  // return result.recordset;

  return [];
}

module.exports = { saveAnswer, saveResultadosFinales, getResultadosBySession, getDetalleRespuestasBySession };
