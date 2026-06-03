const memoryStore = require('../data/memoryStore');
const kahootRepository = require('../repositories/kahootRepository');
const { generarCodigoSesion, generarId } = require('../utils/codeGenerator');

// Puntaje base que se ajusta según la velocidad de respuesta
const PUNTAJE_BASE = 1000;

/**
 * Inicializa todos los eventos de Socket.IO para el juego en tiempo real.
 * Esta es la pieza central de la aplicación: maneja el flujo completo del juego.
 */
function initGameSocket(io) {
  io.on('connection', (socket) => {
    console.log(`Cliente conectado: ${socket.id}`);

    // =============================================
    // EVENTO: Administrador crea una sesión de juego
    // =============================================
    socket.on('create-session', async ({ kahootId }) => {
      try {
        const kahoot = await kahootRepository.getKahootById(kahootId);

        if (!kahoot) {
          socket.emit('error', { mensaje: 'Kahoot no encontrado' });
          return;
        }

        const codigo = generarCodigoSesion();

        const nuevaSesion = {
          codigo,
          kahoot,
          jugadores: [],
          estado: 'waiting',
          preguntaActual: -1,
          puntajes: {},
          respuestas: [],
          respuestasActuales: {},
          tiempoInicioPregunta: null,
          adminSocketId: socket.id
        };

        memoryStore.createSession(nuevaSesion);

        socket.join(codigo);
        socket.emit('session-created', {
          codigo,
          kahootTitulo: kahoot.titulo,
          totalPreguntas: kahoot.preguntas.length
        });

        console.log(`Sesión creada: ${codigo} | Kahoot: "${kahoot.titulo}"`);
      } catch (err) {
        console.error('Error al crear sesión:', err.message);
        socket.emit('error', { mensaje: 'Error al cargar el Kahoot' });
      }
    });

    // =============================================
    // EVENTO: Invitado se une a una sesión
    // =============================================
    socket.on('join-session', ({ codigo, nombre }) => {
      // TODO: SQL Server → const session = await sessionRepository.getSessionByCodigo(codigo);
      const session = memoryStore.getSession(codigo);

      if (!session) {
        socket.emit('error', { mensaje: 'Código de sesión no válido' });
        return;
      }

      if (session.estado !== 'waiting') {
        socket.emit('error', { mensaje: 'El juego ya ha comenzado. No puedes unirte.' });
        return;
      }

      // Si el nombre ya existe es una reconexión (ej: recarga de página o StrictMode de React)
      const jugadorExistente = session.jugadores.find(j => j.nombre === nombre);
      if (jugadorExistente) {
        jugadorExistente.socketId = socket.id; // Actualizar socket ID
        socket.join(codigo);
        socket.emit('joined-session', {
          codigo,
          nombre,
          kahootTitulo: session.kahoot.titulo
        });
        console.log(`${nombre} se reconectó a la sesión ${codigo}`);
        return;
      }

      const jugador = { id: generarId(), nombre, socketId: socket.id };
      session.jugadores.push(jugador);
      session.puntajes[nombre] = 0;

      socket.join(codigo);
      socket.emit('joined-session', {
        codigo,
        nombre,
        kahootTitulo: session.kahoot.titulo
      });

      // Notificar a todos en la sala (admin + jugadores) sobre el nuevo participante
      io.to(codigo).emit('player-joined', {
        jugadores: session.jugadores,
        nuevoJugador: nombre
      });

      // TODO: SQL Server → await participantRepository.createParticipant(jugador, codigo);
      console.log(`${nombre} se unió a la sesión ${codigo}`);
    });

    // =============================================
    // EVENTO: Administrador inicia el juego
    // =============================================
    socket.on('start-game', ({ codigo }) => {
      const session = memoryStore.getSession(codigo);

      if (!session || session.adminSocketId !== socket.id) {
        socket.emit('error', { mensaje: 'No autorizado para iniciar el juego' });
        return;
      }

      if (session.jugadores.length === 0) {
        socket.emit('error', { mensaje: 'No hay participantes. Espera a que alguien se una.' });
        return;
      }

      session.estado = 'active';
      session.preguntaActual = 0;

      io.to(codigo).emit('game-started', {
        mensaje: '¡El juego ha comenzado!',
        totalPreguntas: session.kahoot.preguntas.length
      });

      // Mostrar la primera pregunta inmediatamente
      mostrarPregunta(io, session, codigo);
    });

    // =============================================
    // EVENTO: Invitado envía su respuesta
    // =============================================
    socket.on('submit-answer', ({ codigo, nombre, indiceOpcion, tiempoMs }) => {
      const session = memoryStore.getSession(codigo);

      if (!session || session.estado !== 'active') {
        socket.emit('error', { mensaje: 'No es posible responder en este momento' });
        return;
      }

      // Evitar que el mismo jugador responda dos veces la misma pregunta
      if (session.respuestasActuales[nombre] !== undefined) {
        socket.emit('error', { mensaje: 'Ya enviaste una respuesta para esta pregunta' });
        return;
      }

      const pregunta = session.kahoot.preguntas[session.preguntaActual];
      const opcionElegida = pregunta.opciones[indiceOpcion];
      const opcionCorrecta = pregunta.opciones.find(o => o.esCorrecta);
      const esCorrecta = opcionElegida?.esCorrecta === true;

      // Calcular puntaje: 0 si incorrecto, hasta 1000 si correcto (según rapidez)
      let puntaje = 0;
      if (esCorrecta) {
        const tiempoLimiteMs = pregunta.tiempoLimite * 1000;
        const factorRapidez = Math.max(0, 1 - (tiempoMs / tiempoLimiteMs));
        // Puntaje entre 500 y 1000 dependiendo de qué tan rápido respondió
        puntaje = Math.round(PUNTAJE_BASE * (0.5 + 0.5 * factorRapidez));
      }

      session.respuestasActuales[nombre] = { indiceOpcion, tiempoMs, esCorrecta, puntaje };
      session.puntajes[nombre] = (session.puntajes[nombre] || 0) + puntaje;

      // Guardar registro detallado para el Excel
      session.respuestas.push({
        nombreJugador: nombre,
        textoPregunta: pregunta.textoPregunta,
        respuestaSeleccionada: opcionElegida?.textoOpcion || 'Sin respuesta',
        respuestaCorrecta: opcionCorrecta?.textoOpcion || '',
        esCorrecta,
        tiempoMs,
        puntaje,
        puntajeTotal: session.puntajes[nombre]
      });

      // Confirmar al jugador que su respuesta fue recibida
      socket.emit('answer-received', {
        mensaje: '¡Respuesta enviada!',
        esCorrecta,
        puntaje
      });

      // Informar a todos cuántas respuestas se han recibido
      const totalRespuestas = Object.keys(session.respuestasActuales).length;
      io.to(codigo).emit('answer-count', {
        totalRespuestas,
        totalJugadores: session.jugadores.length
      });

      // TODO: SQL Server → await resultRepository.saveAnswer(...)

      // Si todos respondieron, terminar la pregunta automáticamente
      if (totalRespuestas >= session.jugadores.length) {
        terminarPregunta(io, session, codigo);
      }
    });

    // =============================================
    // EVENTO: Administrador termina el tiempo manualmente
    // =============================================
    socket.on('end-question', ({ codigo }) => {
      const session = memoryStore.getSession(codigo);

      if (!session || session.adminSocketId !== socket.id) {
        socket.emit('error', { mensaje: 'No autorizado' });
        return;
      }

      if (session.estado === 'active') {
        terminarPregunta(io, session, codigo);
      }
    });

    // =============================================
    // EVENTO: Administrador avanza a la siguiente pregunta
    // =============================================
    socket.on('next-question', ({ codigo }) => {
      const session = memoryStore.getSession(codigo);

      if (!session || session.adminSocketId !== socket.id) {
        socket.emit('error', { mensaje: 'No autorizado' });
        return;
      }

      session.preguntaActual++;
      session.respuestasActuales = {};

      if (session.preguntaActual >= session.kahoot.preguntas.length) {
        terminarJuego(io, session, codigo);
      } else {
        session.estado = 'active';
        mostrarPregunta(io, session, codigo);
      }
    });

    // =============================================
    // EVENTO: Cliente se desconecta
    // =============================================
    socket.on('disconnect', () => {
      console.log(`Cliente desconectado: ${socket.id}`);
    });
  });
}

// =============================================
// Función auxiliar: Mostrar la pregunta actual
// Envía datos completos al admin y solo figuras a los invitados
// =============================================
function mostrarPregunta(io, session, codigo) {
  const pregunta = session.kahoot.preguntas[session.preguntaActual];
  session.tiempoInicioPregunta = Date.now();
  session.estado = 'active';
  session.respuestasActuales = {};

  const datosPreguntaAdmin = {
    pregunta: pregunta.textoPregunta,
    opciones: pregunta.opciones,   // Con textos y cuál es la correcta
    tiempoLimite: pregunta.tiempoLimite,
    numeroPregunta: session.preguntaActual + 1,
    totalPreguntas: session.kahoot.preguntas.length,
    esAdmin: true
  };

  const datosPreguntaInvitado = {
    pregunta: pregunta.textoPregunta,
    figuras: ['triangulo', 'circulo', 'cuadrado', 'rombo'],
    tiempoLimite: pregunta.tiempoLimite,
    numeroPregunta: session.preguntaActual + 1,
    totalPreguntas: session.kahoot.preguntas.length,
    esAdmin: false
  };

  // Al admin: datos completos con textos de respuesta
  io.to(session.adminSocketId).emit('show-question', datosPreguntaAdmin);

  // A cada invitado: solo figuras (sin textos de respuesta)
  const socketsEnSala = io.sockets.adapter.rooms.get(codigo);
  if (socketsEnSala) {
    socketsEnSala.forEach(socketId => {
      if (socketId !== session.adminSocketId) {
        io.to(socketId).emit('show-question', datosPreguntaInvitado);
      }
    });
  }

  // Auto-terminar la pregunta al vencer el tiempo
  const timerMs = pregunta.tiempoLimite * 1000;
  const indiceActual = session.preguntaActual;

  setTimeout(() => {
    const sessionActual = memoryStore.getSession(codigo);
    if (
      sessionActual &&
      sessionActual.estado === 'active' &&
      sessionActual.preguntaActual === indiceActual
    ) {
      terminarPregunta(io, sessionActual, codigo);
    }
  }, timerMs + 500); // +500ms de margen para recibir últimas respuestas
}

// =============================================
// Función auxiliar: Terminar la pregunta actual
// Calcula top 3 y emite resultados parciales
// =============================================
function terminarPregunta(io, session, codigo) {
  if (session.estado !== 'active') return;

  session.estado = 'question-results';

  const pregunta = session.kahoot.preguntas[session.preguntaActual];
  const respuestasCorrectas = [];

  // Recopilar quiénes respondieron correctamente y en qué tiempo
  Object.entries(session.respuestasActuales).forEach(([nombre, datos]) => {
    if (datos.esCorrecta) {
      respuestasCorrectas.push({
        nombre,
        tiempoMs: datos.tiempoMs,
        puntaje: datos.puntaje
      });
    }
  });

  // Ordenar por tiempo de respuesta para determinar el top 3
  respuestasCorrectas.sort((a, b) => a.tiempoMs - b.tiempoMs);
  const top3 = respuestasCorrectas.slice(0, 3);

  // Ranking general actualizado con puntajes acumulados
  const ranking = Object.entries(session.puntajes)
    .map(([nombre, puntaje]) => ({ nombre, puntaje }))
    .sort((a, b) => b.puntaje - a.puntaje);

  const respuestaCorrecta = pregunta.opciones.find(o => o.esCorrecta)?.textoOpcion || '';

  io.to(codigo).emit('question-ended', { respuestaCorrecta, top3, ranking });
  io.to(codigo).emit('show-top-three', { top3, ranking });
}

// =============================================
// Función auxiliar: Terminar el juego completo
// Calcula y emite el ranking final
// =============================================
function terminarJuego(io, session, codigo) {
  session.estado = 'finished';

  const rankingFinal = session.jugadores.map(jugador => {
    const respJugador = session.respuestas.filter(r => r.nombreJugador === jugador.nombre);
    const correctas = respJugador.filter(r => r.esCorrecta).length;
    const incorrectas = respJugador.filter(r => !r.esCorrecta).length;
    const tiempos = respJugador.map(r => r.tiempoMs || 0);
    const tiempoPromedio = tiempos.length > 0
      ? Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length)
      : 0;

    return {
      nombre: jugador.nombre,
      puntajeTotal: session.puntajes[jugador.nombre] || 0,
      respuestasCorrectas: correctas,
      respuestasIncorrectas: incorrectas,
      tiempoPromedio
    };
  });

  rankingFinal.sort((a, b) => b.puntajeTotal - a.puntajeTotal);
  rankingFinal.forEach((r, i) => { r.posicion = i + 1; });

  // TODO: SQL Server → await resultRepository.saveResultadosFinales(rankingFinal, codigo);

  io.to(codigo).emit('game-ended', { mensaje: '¡El juego ha terminado!' });
  io.to(codigo).emit('show-final-results', {
    rankingFinal,
    codigo,
    kahootTitulo: session.kahoot.titulo
  });

  console.log(`Juego finalizado | Sesión: ${codigo} | Ganador: ${rankingFinal[0]?.nombre}`);
}

module.exports = { initGameSocket };
