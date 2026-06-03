const express = require('express');
const router = express.Router();
const memoryStore = require('../data/memoryStore');
const { generarExcel } = require('../utils/excelGenerator');

// TODO: SQL Server → const resultRepository = require('../repositories/resultRepository');

// GET /api/results/:sessionCode - Obtener resultados de una sesión
router.get('/:sessionCode', (req, res) => {
  // TODO: SQL Server → const session = await resultRepository.getResultadosBySession(req.params.sessionCode);
  const session = memoryStore.getSession(req.params.sessionCode);

  if (!session) {
    return res.status(404).json({ error: 'Sesión no encontrada' });
  }

  res.json({
    codigo: session.codigo,
    kahoot: session.kahoot?.titulo,
    estado: session.estado,
    jugadores: session.jugadores,
    puntajes: session.puntajes
  });
});

// GET /api/results/:sessionCode/excel - Generar y descargar el archivo Excel
router.get('/:sessionCode/excel', async (req, res) => {
  // TODO: SQL Server → obtener datos desde resultRepository y participantRepository
  const session = memoryStore.getSession(req.params.sessionCode);

  if (!session) {
    return res.status(404).json({ error: 'Sesión no encontrada' });
  }

  if (session.estado !== 'finished') {
    return res.status(400).json({ error: 'La sesión aún no ha finalizado' });
  }

  try {
    const workbook = await generarExcel(session);
    const nombreArchivo = `kahoot_resultados_${session.codigo}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error al generar Excel:', error);
    res.status(500).json({ error: 'Error al generar el archivo Excel' });
  }
});

module.exports = router;
