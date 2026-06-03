import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import socket from '../socket.js';

// Figuras al estilo Kahoot: índice 0-3 corresponde a las opciones del servidor
const FORMAS = [
  { nombre: 'triangulo', icono: '▲', etiqueta: 'Triángulo', clase: 'forma-triangulo' },
  { nombre: 'circulo',   icono: '●', etiqueta: 'Círculo',   clase: 'forma-circulo'   },
  { nombre: 'cuadrado',  icono: '■', etiqueta: 'Cuadrado',  clase: 'forma-cuadrado'  },
  { nombre: 'rombo',     icono: '◆', etiqueta: 'Rombo',     clase: 'forma-rombo'     },
];

function GuestGamePage() {
  const { codigo } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { nombre, kahootTitulo } = location.state || {};

  const [estado, setEstado] = useState('esperando');
  // estados: esperando | pregunta | respondido | resultado | finalizado

  const [textoPregunta, setTextoPregunta] = useState('');
  const [numeroPregunta, setNumeroPregunta] = useState(0);
  const [totalPreguntas, setTotalPreguntas] = useState(0);
  const [tiempoLimite, setTiempoLimite] = useState(20);
  const [segundosRestantes, setSegundosRestantes] = useState(0);
  const [indiceElegido, setIndiceElegido] = useState(null);
  const [esCorrecta, setEsCorrecta] = useState(null);
  const [puntajeGanado, setPuntajeGanado] = useState(0);
  const [respuestaCorrecta, setRespuestaCorrecta] = useState('');
  const [resultadoFinal, setResultadoFinal] = useState(null);
  const [jugadoresConectados, setJugadoresConectados] = useState(0);
  const [error, setError] = useState('');
  const tiempoInicioPregunta = useRef(null);
  const timerRef = useRef(null);
  const estadoRef = useRef('esperando'); // ref para acceder al estado actual dentro del timeout

  useEffect(() => {
    if (!nombre) {
      navigate('/unirse');
      return;
    }

    // Si el socket se desconectó (ej: recarga de página), reconectar y re-unirse
    if (!socket.connected) {
      socket.connect();
      socket.emit('join-session', { codigo, nombre });
    }
    // Si ya está conectado (viene de JoinPage), el socket ya está en la sala.
    // NO desconectar en cleanup para no romper la sesión en StrictMode de React.

    socket.on('player-joined', ({ jugadores }) => {
      setJugadoresConectados(jugadores.length);
    });

    socket.on('game-started', ({ totalPreguntas: total }) => {
      setTotalPreguntas(total);
      // No cambiamos estado aquí; show-question lo hace
    });

    socket.on('show-question', (datos) => {
      // El admin también recibe show-question pero con esAdmin:true, ignorarlo
      if (datos.esAdmin) return;

      setTextoPregunta(datos.pregunta);
      setNumeroPregunta(datos.numeroPregunta);
      setTotalPreguntas(datos.totalPreguntas);
      setTiempoLimite(datos.tiempoLimite);
      setSegundosRestantes(datos.tiempoLimite);
      setIndiceElegido(null);
      setEsCorrecta(null);
      setPuntajeGanado(0);
      setRespuestaCorrecta('');
      estadoRef.current = 'pregunta';
      setEstado('pregunta');
      tiempoInicioPregunta.current = Date.now();
      iniciarTimer(datos.tiempoLimite);
    });

    socket.on('answer-received', ({ esCorrecta: correcto, puntaje }) => {
      setEsCorrecta(correcto);
      setPuntajeGanado(puntaje);
      estadoRef.current = 'respondido';
      setEstado('respondido');
      detenerTimer();
    });

    socket.on('question-ended', ({ respuestaCorrecta: resp }) => {
      setRespuestaCorrecta(resp);
      detenerTimer();
      // Mostrar resultado tanto si respondió como si no respondió a tiempo
      estadoRef.current = 'resultado';
      setEstado('resultado');
    });

    socket.on('show-top-three', () => {
      // El invitado solo espera la siguiente pregunta
    });

    socket.on('show-final-results', ({ rankingFinal }) => {
      const miResultado = rankingFinal.find(r => r.nombre === nombre);
      setResultadoFinal(miResultado || null);
      estadoRef.current = 'finalizado';
      setEstado('finalizado');
      detenerTimer();
    });

    socket.on('error', ({ mensaje }) => {
      setError(mensaje);
    });

    // Cleanup: solo remover listeners, NO desconectar.
    // Desconectar aquí rompería la sesión en React StrictMode (dev mode).
    return () => {
      detenerTimer();
      socket.off('player-joined');
      socket.off('game-started');
      socket.off('show-question');
      socket.off('answer-received');
      socket.off('question-ended');
      socket.off('show-top-three');
      socket.off('show-final-results');
      socket.off('error');
    };
  }, []);

  function iniciarTimer(segundos) {
    detenerTimer();
    setSegundosRestantes(segundos);
    timerRef.current = setInterval(() => {
      setSegundosRestantes(prev => {
        if (prev <= 1) { detenerTimer(); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  function detenerTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function responder(indice) {
    if (estadoRef.current !== 'pregunta' || indiceElegido !== null) return;

    const tiempoMs = Date.now() - (tiempoInicioPregunta.current || Date.now());
    setIndiceElegido(indice);

    socket.emit('submit-answer', {
      codigo,
      nombre,
      indiceOpcion: indice,
      tiempoMs
    });
  }

  if (!nombre) return null;

  // ============================
  // PANTALLA: Sala de espera
  // ============================
  if (estado === 'esperando') {
    return (
      <div className="guest-container">
        <div className="guest-espera">
          <div className="guest-avatar">{nombre.charAt(0).toUpperCase()}</div>
          <h2 className="guest-nombre">{nombre}</h2>
          {kahootTitulo && <p className="guest-kahoot">{kahootTitulo}</p>}
          <div className="espera-spinner"></div>
          <p className="espera-texto">Esperando que el administrador inicie el juego...</p>
          {jugadoresConectados > 0 && (
            <p className="espera-jugadores">
              {jugadoresConectados} jugador(es) conectado(s)
            </p>
          )}
          {error && <div className="alerta alerta-error">{error}</div>}
        </div>
      </div>
    );
  }

  // ============================
  // PANTALLA: Juego finalizado
  // ============================
  if (estado === 'finalizado') {
    return (
      <div className="guest-container">
        <div className="guest-finalizado">
          <h1 className="finalizado-titulo">¡Juego terminado!</h1>
          {resultadoFinal ? (
            <div className="card resultado-final-card">
              <div className="resultado-posicion">
                {resultadoFinal.posicion === 1 && <span className="medalla">🥇</span>}
                {resultadoFinal.posicion === 2 && <span className="medalla">🥈</span>}
                {resultadoFinal.posicion === 3 && <span className="medalla">🥉</span>}
                {resultadoFinal.posicion > 3 && (
                  <span className="posicion-numero">#{resultadoFinal.posicion}</span>
                )}
              </div>
              <h2 className="resultado-nombre">{resultadoFinal.nombre}</h2>
              <div className="resultado-stats">
                <div className="stat">
                  <span className="stat-valor">{resultadoFinal.puntajeTotal}</span>
                  <span className="stat-label">puntos</span>
                </div>
                <div className="stat">
                  <span className="stat-valor texto-verde">{resultadoFinal.respuestasCorrectas}</span>
                  <span className="stat-label">correctas</span>
                </div>
                <div className="stat">
                  <span className="stat-valor texto-rojo">{resultadoFinal.respuestasIncorrectas}</span>
                  <span className="stat-label">incorrectas</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="texto-gris">No se encontraron tus resultados.</p>
          )}
          <button
            className="btn btn-primary"
            onClick={() => { socket.disconnect(); navigate('/'); }}
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // ============================
  // PANTALLA: Resultado de una pregunta
  // ============================
  if (estado === 'resultado') {
    return (
      <div className="guest-container">
        <div className="guest-resultado">
          {esCorrecta ? (
            <div className="resultado-correcto">
              <div className="resultado-icono">✓</div>
              <h2>¡Correcto!</h2>
              <p className="puntaje-ganado">+{puntajeGanado} puntos</p>
            </div>
          ) : (
            <div className="resultado-incorrecto">
              <div className="resultado-icono">✗</div>
              <h2>Incorrecto</h2>
              {respuestaCorrecta && (
                <p className="respuesta-correcta-guest">
                  Respuesta correcta: <strong>{respuestaCorrecta}</strong>
                </p>
              )}
            </div>
          )}
          <p className="esperando-siguiente">Esperando la siguiente pregunta...</p>
        </div>
      </div>
    );
  }

  // ============================
  // PANTALLA: Respondido (esperando que termine el tiempo)
  // ============================
  if (estado === 'respondido') {
    return (
      <div className="guest-container">
        <div className="guest-respondido">
          <div className="respondido-icono">✓</div>
          <h2>¡Respuesta enviada!</h2>
          <div className={`forma-elegida ${FORMAS[indiceElegido]?.clase}`}>
            <span>{FORMAS[indiceElegido]?.icono}</span>
          </div>
          <p className="texto-gris">Esperando que los demás terminen...</p>
        </div>
      </div>
    );
  }

  // ============================
  // PANTALLA: Pregunta activa (mostrar figuras para responder)
  // ============================
  return (
    <div className="guest-container guest-jugando">
      <div className="pregunta-guest-header">
        <span className="pregunta-numero-guest">
          Pregunta {numeroPregunta}/{totalPreguntas}
        </span>
        <div className={`timer-guest ${segundosRestantes <= 5 ? 'timer-urgente' : ''}`}>
          {segundosRestantes}s
        </div>
      </div>

      <div className="pregunta-texto-guest">
        <h2>{textoPregunta}</h2>
      </div>

      <div className="formas-grid">
        {FORMAS.map((forma, indice) => (
          <button
            key={forma.nombre}
            className={`forma-btn ${forma.clase} ${indiceElegido === indice ? 'forma-elegida-activa' : ''}`}
            onClick={() => responder(indice)}
            disabled={indiceElegido !== null}
          >
            <span className="forma-icono">{forma.icono}</span>
            <span className="forma-etiqueta">{forma.etiqueta}</span>
          </button>
        ))}
      </div>

      {error && <div className="alerta alerta-error">{error}</div>}
    </div>
  );
}

export default GuestGamePage;
