const { sql, getConnection } = require('../config/db');

async function getAllKahoots() {
  const pool = await getConnection();
  const result = await pool.request().query(`
    SELECT
      k.IdKahoot,
      k.Titulo,
      k.Descripcion,
      k.FechaCreacion,
      COUNT(p.IdPregunta) AS TotalPreguntas
    FROM Kahoots k
    LEFT JOIN Preguntas p ON p.IdKahoot = k.IdKahoot
    WHERE k.Estado = 'activo'
    GROUP BY k.IdKahoot, k.Titulo, k.Descripcion, k.FechaCreacion
    ORDER BY k.FechaCreacion DESC
  `);

  return result.recordset.map(row => ({
    id: String(row.IdKahoot),
    titulo: row.Titulo,
    descripcion: row.Descripcion || '',
    fechaCreacion: row.FechaCreacion,
    preguntas: Array(Number(row.TotalPreguntas)).fill(null)
  }));
}

async function getKahootById(id) {
  const pool = await getConnection();

  const kahootResult = await pool.request()
    .input('id', sql.Int, parseInt(id, 10))
    .query("SELECT * FROM Kahoots WHERE IdKahoot = @id AND Estado = 'activo'");

  if (!kahootResult.recordset.length) return null;
  const k = kahootResult.recordset[0];

  const preguntasResult = await pool.request()
    .input('idKahoot', sql.Int, parseInt(id, 10))
    .query('SELECT * FROM Preguntas WHERE IdKahoot = @idKahoot ORDER BY OrdenPregunta');

  const preguntas = await Promise.all(preguntasResult.recordset.map(async (p) => {
    const opcionesResult = await pool.request()
      .input('idPregunta', sql.Int, p.IdPregunta)
      .query('SELECT * FROM OpcionesRespuesta WHERE IdPregunta = @idPregunta');

    return {
      id: String(p.IdPregunta),
      textoPregunta: p.TextoPregunta,
      tiempoLimite: p.TiempoLimiteSegundos,
      orden: p.OrdenPregunta,
      opciones: opcionesResult.recordset.map(o => ({
        id: String(o.IdOpcion),
        textoOpcion: o.TextoOpcion,
        figura: o.Figura.toLowerCase(),
        esCorrecta: o.EsCorrecta === true || o.EsCorrecta === 1
      }))
    };
  }));

  return {
    id: String(k.IdKahoot),
    titulo: k.Titulo,
    descripcion: k.Descripcion || '',
    fechaCreacion: k.FechaCreacion,
    preguntas
  };
}

async function createKahoot(kahoot) {
  const pool = await getConnection();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    // Garantizar que exista el administrador por defecto (ID=1)
    await new sql.Request(transaction).query(`
      IF NOT EXISTS (SELECT 1 FROM Administradores WHERE IdAdministrador = 1)
        INSERT INTO Administradores (Nombre, Email, Usuario, Contrasena)
        VALUES ('Admin', 'admin@kahoot.local', 'Admin', '123456')
    `);

    const kahootResult = await new sql.Request(transaction)
      .input('titulo', sql.NVarChar(200), kahoot.titulo)
      .input('descripcion', sql.NVarChar(500), kahoot.descripcion || '')
      .query(`
        INSERT INTO Kahoots (IdAdministrador, Titulo, Descripcion)
        OUTPUT INSERTED.IdKahoot, INSERTED.FechaCreacion
        VALUES (1, @titulo, @descripcion)
      `);

    const idKahoot = kahootResult.recordset[0].IdKahoot;
    const fechaCreacion = kahootResult.recordset[0].FechaCreacion;

    for (const [i, pregunta] of kahoot.preguntas.entries()) {
      const preguntaResult = await new sql.Request(transaction)
        .input('idKahoot', sql.Int, idKahoot)
        .input('texto', sql.NVarChar(500), pregunta.textoPregunta)
        .input('tiempo', sql.Int, pregunta.tiempoLimite || 20)
        .input('orden', sql.Int, i + 1)
        .query(`
          INSERT INTO Preguntas (IdKahoot, TextoPregunta, TiempoLimiteSegundos, OrdenPregunta)
          OUTPUT INSERTED.IdPregunta
          VALUES (@idKahoot, @texto, @tiempo, @orden)
        `);

      const idPregunta = preguntaResult.recordset[0].IdPregunta;

      for (const opcion of pregunta.opciones) {
        // La constraint de la DB usa primera letra mayúscula: Triangulo, Circulo, etc.
        const figuraDb = opcion.figura.charAt(0).toUpperCase() + opcion.figura.slice(1);

        await new sql.Request(transaction)
          .input('idPregunta', sql.Int, idPregunta)
          .input('textoOpcion', sql.NVarChar(300), opcion.textoOpcion)
          .input('figura', sql.NVarChar(20), figuraDb)
          .input('esCorrecta', sql.Bit, opcion.esCorrecta ? 1 : 0)
          .query(`
            INSERT INTO OpcionesRespuesta (IdPregunta, TextoOpcion, Figura, EsCorrecta)
            VALUES (@idPregunta, @textoOpcion, @figura, @esCorrecta)
          `);
      }
    }

    await transaction.commit();

    return {
      id: String(idKahoot),
      titulo: kahoot.titulo,
      descripcion: kahoot.descripcion || '',
      fechaCreacion: fechaCreacion.toISOString(),
      preguntas: kahoot.preguntas
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = { getAllKahoots, getKahootById, createKahoot };
