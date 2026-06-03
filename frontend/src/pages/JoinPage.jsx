import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../socket.js';

function JoinPage() {
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  function unirseSesion(e) {
    e.preventDefault();
    setError('');

    if (!codigo.trim() || codigo.trim().length !== 6) {
      setError('El código de sesión debe tener 6 dígitos');
      return;
    }
    if (!nombre.trim()) {
      setError('Debes ingresar tu nombre');
      return;
    }

    setCargando(true);

    // Conectar el socket si no está conectado
    if (!socket.connected) socket.connect();

    socket.emit('join-session', {
      codigo: codigo.trim(),
      nombre: nombre.trim()
    });

    // Escuchar la confirmación del servidor
    socket.once('joined-session', ({ codigo: cod, nombre: nom, kahootTitulo }) => {
      setCargando(false);
      navigate(`/juego/${cod}`, {
        state: { nombre: nom, kahootTitulo }
      });
    });

    // Escuchar error del servidor
    socket.once('error', ({ mensaje }) => {
      setCargando(false);
      setError(mensaje);
    });
  }

  return (
    <div className="join-container">
      <div className="join-card">
        <button
          className="btn-volver"
          onClick={() => navigate('/')}
          style={{ alignSelf: 'flex-start' }}
        >
          ← Volver
        </button>

        <h1 className="join-titulo">Unirse al juego</h1>

        <form onSubmit={unirseSesion} className="join-form">
          <div className="campo">
            <label htmlFor="codigo">Código de sesión</label>
            <input
              id="codigo"
              type="text"
              value={codigo}
              onChange={e => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              className="input input-codigo"
              maxLength={6}
              disabled={cargando}
            />
          </div>

          <div className="campo">
            <label htmlFor="nombre">Tu nombre</label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ingresa tu nombre"
              className="input"
              maxLength={50}
              disabled={cargando}
            />
          </div>

          {error && <div className="alerta alerta-error">{error}</div>}

          <button
            type="submit"
            className="btn btn-guest btn-grande"
            disabled={cargando}
          >
            {cargando ? 'Conectando...' : 'Unirse al juego'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default JoinPage;
