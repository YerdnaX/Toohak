// Lista de participantes conectados en la sala de espera

function PlayerList({ jugadores }) {
  return (
    <div className="player-list">
      <h3 className="player-list-titulo">
        Participantes conectados ({jugadores.length})
      </h3>
      {jugadores.length === 0 ? (
        <p className="player-list-vacio">
          Aún no hay participantes. Comparte el código de sesión.
        </p>
      ) : (
        <ul className="player-list-items">
          {jugadores.map((jugador, index) => (
            <li key={jugador.id || index} className="player-item">
              <span className="player-avatar">
                {jugador.nombre.charAt(0).toUpperCase()}
              </span>
              <span className="player-nombre">{jugador.nombre}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PlayerList;
