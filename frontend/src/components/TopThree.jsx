// Muestra el top 3 de participantes más rápidos al responder correctamente

const MEDALLAS = ['🥇', '🥈', '🥉'];
const COLORES_PODIO = ['top-primero', 'top-segundo', 'top-tercero'];

function TopThree({ top3 }) {
  if (!top3 || top3.length === 0) {
    return (
      <div className="top3-container">
        <h3 className="top3-titulo">Top 3 más rápidos</h3>
        <div className="card top3-vacio">
          <p>Nadie respondió correctamente esta vez.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="top3-container">
      <h3 className="top3-titulo">Top 3 más rápidos</h3>
      <div className="top3-lista">
        {top3.map((jugador, index) => (
          <div key={jugador.nombre} className={`top3-item ${COLORES_PODIO[index]}`}>
            <span className="top3-medalla">{MEDALLAS[index]}</span>
            <div className="top3-info">
              <span className="top3-nombre">{jugador.nombre}</span>
              <span className="top3-tiempo">
                {(jugador.tiempoMs / 1000).toFixed(1)}s
              </span>
            </div>
            <span className="top3-puntaje">+{jugador.puntaje} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TopThree;
