const express = require('express');
const router = express.Router();
const kahootRepository = require('../repositories/kahootRepository');

// GET /api/kahoot - Obtener todos los Kahoots creados
router.get('/', async (req, res) => {
  try {
    const kahoots = await kahootRepository.getAllKahoots();
    res.json(kahoots);
  } catch (err) {
    console.error('Error al obtener kahoots:', err.message);
    res.status(500).json({ error: 'Error al obtener los Kahoots' });
  }
});

// GET /api/kahoot/:id - Obtener un Kahoot específico por su ID
router.get('/:id', async (req, res) => {
  try {
    const kahoot = await kahootRepository.getKahootById(req.params.id);
    if (!kahoot) {
      return res.status(404).json({ error: 'Kahoot no encontrado' });
    }
    res.json(kahoot);
  } catch (err) {
    console.error('Error al obtener kahoot:', err.message);
    res.status(500).json({ error: 'Error al obtener el Kahoot' });
  }
});

// POST /api/kahoot - Crear un nuevo Kahoot con sus preguntas y opciones
router.post('/', async (req, res) => {
  const { titulo, descripcion, preguntas } = req.body;

  if (!titulo || !preguntas || preguntas.length === 0) {
    return res.status(400).json({ error: 'El título y al menos una pregunta son obligatorios' });
  }

  const kahoot = {
    titulo,
    descripcion: descripcion || '',
    preguntas: preguntas.map((p, index) => ({
      textoPregunta: p.textoPregunta,
      tiempoLimite: p.tiempoLimite || 20,
      orden: index + 1,
      opciones: p.opciones.map((o) => ({
        textoOpcion: o.textoOpcion,
        figura: o.figura,
        esCorrecta: o.esCorrecta === true
      }))
    }))
  };

  try {
    const guardado = await kahootRepository.createKahoot(kahoot);
    res.status(201).json(guardado);
  } catch (err) {
    console.error('Error al crear kahoot:', err.message);
    res.status(500).json({ error: 'Error al guardar el Kahoot' });
  }
});

module.exports = router;
