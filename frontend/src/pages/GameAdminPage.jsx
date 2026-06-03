import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import socket from '../socket.js';
import PlayerList from '../components/PlayerList.jsx';
import AnswerOptions from '../components/AnswerOptions.jsx';
import TopThree from '../components/TopThree.jsx';
import ScoreBoard from '../components/ScoreBoard.jsx';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? '';

function GameAdminPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { kahootId, kahootTitulo } = location.state || {};

  const [estado, setEstado] = useState('cargando');
  // estados: cargando | esperando | jugando | resultado-pregunta | finalizado

  const [codigoSesion, setCodigoSesion] = useState('');
  const [jugadores, setJugadores] = useState([]);
  const [preguntaActual, setPreguntaActual] = useState(null);
  const [numeroPregunta, setNumeroPregunta] = useState(0);
  const [totalPreguntas, setTotalPreguntas] = useState(0);
  const [tiempoLimite, setTiempoLimite] = useState(20);
  const [segundosRestantes, setSegundosRestantes] = useState(0);
  const [respuestasRecibidas, setRespuestasRecibidas] = useState(0);
  const [top3, setTop3] = useState([]);
  const [rankingParcial, setRankingParcial] = useState([]);
  const [rankingFinal, setRankingFinal] = useState([]);
  const [respuestaCorrecta, setRespuestaCorrecta] = useState('');
  const [error, setError] = useState('');
  const timerRef = useRef(null);

  // Ref para evitar que React StrictMode emita create-session dos veces.
  // En desarrollo, StrictMode ejecuta los effects dos veces para detectar errores;
  // sin esta guardia se crearían dos sesiones distintas.
  const sesionCreadaRef = useRef(false);

  useEffect(() => {
    if (!kahootId) {
      navigate('/admin');
      return;
    }

    if (!socket.connected) socket.connect();

    // Emitir create-session solo una vez aunque el effect se ejecute dos veces
    if (!sesionCreadaRef.current) {
      sesionCreadaRef.current = true;
      socket.emit('create-session', { kahootId });
    }

    socket.on('session-created', ({ codigo, totalPreguntas: total }) => {
      setCodigoSesion(codigo);
      setTotalPreguntas(total);
      setEstado('esperando');
    });

    socket.on('player-joined', ({ jugadores: lista }) => {
      setJugadores([...lista]); // copia para forzar re-render
    });

    socket.on('game-started', ({ totalPreguntas: total }) => {
      setTotalPreguntas(total);
    });

    socket.on('show-question', (datos) => {
      if (!datos.esAdmin) return;
      setPreguntaActual(datos);
      setNumeroPregunta(datos.numeroPregunta);
      setTiempoLimite(datos.tiempoLimite);
      setSegundosRestantes(datos.tiempoLimite);
      setRespuestasRecibidas(0);
      setEstado('jugando');
      iniciarTimer(datos.tiempoLimite);
    });

    socket.on('answer-count', ({ totalRespuestas }) => {
      setRespuestasRecibidas(totalRespuestas);
    });

    socket.on('question-ended', ({ respuestaCorrecta: resp, top3: t3, ranking }) => {
      detenerTimer();
      setRespuestaCorrecta(resp);
      setTop3(t3);
      setRankingParcial(ranking);
      setEstado('resultado-pregunta');
    });

    socket.on('show-final-results', ({ rankingFinal: rf }) => {
      setRankingFinal(rf);
      setEstado('finalizado');
    });

    socket.on('error', ({ mensaje }) => {
      setError(mensaje);
    });

    return () => {
      detenerTimer();
      socket.off('session-created');
      socket.off('player-joined');
      socket.off('game-started');
      socket.off('show-question');
      socket.off('answer-count');
      socket.off('question-ended');
      socket.off('show-final-results');
      socket.off('error');
      // NO desconectamos aquí para no romper la sesión en StrictMode.
      // El socket se desconecta solo al cerrar la pestaña o al navegar al inicio.
    };
  }, [kahootId]);

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

  function iniciarJuego() {
    socket.emit('start-game', { codigo: codigoSesion });
  }

  function terminarPreguntaManual() {
    socket.emit('end-question', { codigo: codigoSesion });
  }

  function siguientePregunta() {
    socket.emit('next-question', { codigo: codigoSesion });
  }

  function descargarExcel() {
    window.open(`${BACKEND_URL}/api/results/${codigoSesion}/excel`, '_blank');
  }

  function volverAlPanel() {
    socket.disconnect();
    navigate('/admin');
  }

  if (!kahootId) return null;

  // ============================
  // PANTALLA: Cargando
  // ============================
  if (estado === 'cargando') {
    return (
      <div className="page-container centrado">
        <div className="loading">Creando sesión de juego...</div>
      </div>
    );
  }

  // ============================
  // PANTALLA: Finalizado
  // ============================
  if (estado === 'finalizado') {
    return (
      <div className="page-container">
        <div className="game-header">
          <h1>Juego finalizado</h1>
          <p className="kahoot-nombre">{kahootTitulo}</p>
        </div>

        <div className="finalizado-contenido">
          <div className="card">
            <h2 className="seccion-titulo">Ranking Final</h2>
            <ScoreBoard rankingFinal={rankingFinal} />
          </div>

          <div className="finalizado-acciones">
            <button className="btn btn-excel" onClick={descargarExcel}>
              Descargar resultados en Excel
            </button>
            <button className="btn btn-secondary" onClick={volverAlPanel}>
              Volver al panel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Cabecera con código de sesión */}
      <div className="game-header">
        <h2 className="kahoot-nombre">{kahootTitulo || 'Sesión de juego'}</h2>
        <div className="codigo-sesion">
          <span className="codigo-label">Código de sesión:</span>
          <span className="codigo-valor">{codigoSesion}</span>
        </div>
      </div>

      {error && <div className="alerta alerta-error">{error}</div>}

      {/* ============================
          PANTALLA: Sala de espera
          ============================ */}
      {estado === 'esperando' && (
        <div className="sala-espera">
          <div className="sala-codigo-grande">
            <p>Comparte este código con los participantes:</p>
            <div className="codigo-grande">{codigoSesion}</div>
            <p className="sala-url">Los invitados van a: <strong>/unirse</strong></p>
          </div>

          {/* Lista de participantes que se van uniendo */}
          <div className="card player-list-card">
            <PlayerList jugadores={jugadores} />
          </div>

          <button
            className="btn btn-iniciar-juego"
            onClick={iniciarJuego}
            disabled={jugadores.length === 0}
          >
            {jugadores.length === 0
              ? 'Esperando participantes...'
              : `¡Iniciar juego! (${jugadores.length} participante${jugadores.length !== 1 ? 's' : ''})`}
          </button>
        </div>
      )}

      {/* ============================
          PANTALLA: Pregunta activa
          ============================ */}
      {estado === 'jugando' && preguntaActual && (
        <div className="pregunta-admin">
          <div className="pregunta-header">
            <span className="pregunta-numero">
              Pregunta {numeroPregunta} de {totalPreguntas}
            </span>
            <div className={`timer ${segundosRestantes <= 5 ? 'timer-urgente' : ''}`}>
              {segundosRestantes}s
            </div>
            <span className="respuestas-count">
              {respuestasRecibidas}/{jugadores.length} respuestas
            </span>
          </div>

          <div className="card pregunta-texto-card">
            <h2 className="pregunta-texto">{preguntaActual.pregunta}</h2>
          </div>

          <AnswerOptions
            opciones={preguntaActual.opciones}
            mostrarCorrecta={false}
          />

          <button className="btn btn-terminar" onClick={terminarPreguntaManual}>
            Terminar pregunta
          </button>
        </div>
      )}

      {/* ============================
          PANTALLA: Resultados de pregunta
          ============================ */}
      {estado === 'resultado-pregunta' && (
        <div className="resultado-pregunta">
          <div className="card respuesta-correcta-card">
            <h3>Respuesta correcta:</h3>
            <p className="respuesta-correcta-texto">{respuestaCorrecta}</p>
          </div>

          <TopThree top3={top3} />

          <div className="card ranking-parcial">
            <h3>Ranking actual</h3>
            <ul className="ranking-lista">
              {rankingParcial.slice(0, 5).map((j, i) => (
                <li key={j.nombre} className="ranking-item">
                  <span className="ranking-pos">{i + 1}</span>
                  <span className="ranking-nombre">{j.nombre}</span>
                  <span className="ranking-puntaje">{j.puntaje} pts</span>
                </li>
              ))}
            </ul>
          </div>

          <button className="btn btn-siguiente" onClick={siguientePregunta}>
            {numeroPregunta >= totalPreguntas ? 'Ver resultados finales' : 'Siguiente pregunta'}
          </button>
        </div>
      )}
    </div>
  );
}

export default GameAdminPage;
