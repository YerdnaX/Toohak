import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// En producción (Plesk) VITE_BACKEND_URL está vacío → URL relativa al mismo dominio
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? '';

// Credenciales de administrador (quemadas en código para la demo académica)
const ADMIN_USUARIO = 'Admin';
const ADMIN_CONTRASENA = '123456';

function AdminPage() {
  const navigate = useNavigate();

  // Estado de autenticación
  const [autenticado, setAutenticado] = useState(false);
  const [inputUsuario, setInputUsuario] = useState('');
  const [inputContrasena, setInputContrasena] = useState('');
  const [errorLogin, setErrorLogin] = useState('');

  // Estado del panel principal
  const [kahoots, setKahoots] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  // Cargar Kahoots solo después de autenticarse
  useEffect(() => {
    if (autenticado) cargarKahoots();
  }, [autenticado]);

  function intentarLogin(e) {
    e.preventDefault();
    setErrorLogin('');
    if (inputUsuario === ADMIN_USUARIO && inputContrasena === ADMIN_CONTRASENA) {
      setAutenticado(true);
    } else {
      setErrorLogin('Usuario o contraseña incorrectos');
    }
  }

  async function cargarKahoots() {
    try {
      setCargando(true);
      const respuesta = await axios.get(`${BACKEND_URL}/api/kahoot`);
      setKahoots(respuesta.data);
    } catch (err) {
      setError('No se pudieron cargar los Kahoots. Verifica que el servidor esté corriendo.');
    } finally {
      setCargando(false);
    }
  }

  function iniciarSesion(kahoot) {
    navigate('/admin/juego', { state: { kahootId: kahoot.id, kahootTitulo: kahoot.titulo } });
  }

  // ============================
  // PANTALLA DE LOGIN
  // ============================
  if (!autenticado) {
    return (
      <div className="login-container">
        <div className="login-card">
          <button className="btn-volver" onClick={() => navigate('/')}>
            ← Volver al inicio
          </button>

          <div className="login-header">
            <span className="login-icon">👑</span>
            <h1 className="login-titulo">Acceso Administrador</h1>
            <p className="login-subtitulo">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={intentarLogin} className="login-form">
            <div className="campo">
              <label htmlFor="usuario">Usuario</label>
              <input
                id="usuario"
                type="text"
                value={inputUsuario}
                onChange={e => setInputUsuario(e.target.value)}
                placeholder="Ingresa tu usuario"
                className="input"
                autoFocus
              />
            </div>

            <div className="campo">
              <label htmlFor="contrasena">Contraseña</label>
              <input
                id="contrasena"
                type="password"
                value={inputContrasena}
                onChange={e => setInputContrasena(e.target.value)}
                placeholder="Ingresa tu contraseña"
                className="input"
              />
            </div>

            {errorLogin && (
              <div className="alerta alerta-error">{errorLogin}</div>
            )}

            <button type="submit" className="btn btn-admin" style={{ width: '100%', marginTop: '8px' }}>
              Ingresar al panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ============================
  // PANEL DE ADMINISTRADOR
  // ============================
  return (
    <div className="page-container">
      <div className="page-header">
        <button className="btn-volver" onClick={() => navigate('/')}>← Volver</button>
        <h1 className="page-titulo">Panel de Administrador</h1>
      </div>

      <div className="admin-contenido">
        <div className="admin-acciones">
          <button
            className="btn btn-primary"
            onClick={() => navigate('/admin/crear')}
          >
            + Crear nuevo Kahoot
          </button>
          <button className="btn btn-secondary" onClick={cargarKahoots}>
            Actualizar lista
          </button>
        </div>

        {error && <div className="alerta alerta-error">{error}</div>}

        {cargando ? (
          <div className="loading">Cargando Kahoots...</div>
        ) : kahoots.length === 0 ? (
          <div className="vacio">
            <p>No hay Kahoots creados todavía.</p>
            <p>Crea uno nuevo para comenzar.</p>
          </div>
        ) : (
          <div className="kahoots-lista">
            <h2 className="seccion-titulo">Mis Kahoots ({kahoots.length})</h2>
            {kahoots.map(kahoot => (
              <div key={kahoot.id} className="kahoot-tarjeta">
                <div className="kahoot-info">
                  <h3 className="kahoot-titulo">{kahoot.titulo}</h3>
                  {kahoot.descripcion && (
                    <p className="kahoot-descripcion">{kahoot.descripcion}</p>
                  )}
                  <span className="kahoot-meta">
                    {kahoot.preguntas?.length || 0} preguntas &bull;{' '}
                    Creado: {new Date(kahoot.fechaCreacion).toLocaleDateString('es-ES')}
                  </span>
                </div>
                <button
                  className="btn btn-iniciar"
                  onClick={() => iniciarSesion(kahoot)}
                >
                  Iniciar sesión
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPage;
