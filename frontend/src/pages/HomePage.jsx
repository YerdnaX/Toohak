import { useNavigate } from 'react-router-dom';

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="home-card">
        <div className="home-logo">
          <img src="/images/logo1.png" alt="Logo" className="home-logo-img" />
          <p className="home-subtitulo">Juego de preguntas en tiempo real</p>
        </div>

        <div className="home-botones">
          <button
            className="btn btn-admin"
            onClick={() => navigate('/admin')}
          >
            <span className="btn-icon">👑</span>
            Entrar como Administrador
          </button>

          <button
            className="btn btn-guest"
            onClick={() => navigate('/unirse')}
          >
            <span className="btn-icon">🎯</span>
            Entrar como Invitado
          </button>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
