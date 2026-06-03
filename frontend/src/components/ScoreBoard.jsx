// Tabla de resultados finales para la pantalla del administrador

const MEDALLAS = { 1: '🥇', 2: '🥈', 3: '🥉' };

function ScoreBoard({ rankingFinal }) {
  if (!rankingFinal || rankingFinal.length === 0) {
    return <p>No hay resultados disponibles.</p>;
  }

  return (
    <div className="scoreboard">
      <table className="scoreboard-tabla">
        <thead>
          <tr>
            <th>Pos.</th>
            <th>Nombre</th>
            <th>Puntaje Total</th>
            <th>Correctas</th>
            <th>Incorrectas</th>
            <th>Tiempo Prom.</th>
          </tr>
        </thead>
        <tbody>
          {rankingFinal.map((jugador) => (
            <tr
              key={jugador.nombre}
              className={jugador.posicion <= 3 ? `fila-top${jugador.posicion}` : ''}
            >
              <td className="pos-celda">
                {MEDALLAS[jugador.posicion] || `#${jugador.posicion}`}
              </td>
              <td className="nombre-celda">{jugador.nombre}</td>
              <td className="puntaje-celda">{jugador.puntajeTotal} pts</td>
              <td className="texto-verde">{jugador.respuestasCorrectas} ✓</td>
              <td className="texto-rojo">{jugador.respuestasIncorrectas} ✗</td>
              <td>{jugador.tiempoPromedio ? `${(jugador.tiempoPromedio / 1000).toFixed(1)}s` : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ScoreBoard;
