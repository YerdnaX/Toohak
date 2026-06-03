import { useNavigate } from 'react-router-dom';

// Esta página es opcional: los resultados se muestran directamente
// en GameAdminPage y GuestGamePage. Se puede usar para compartir
// un enlace de resultados en el futuro.

function ResultsPage() {
  const navigate = useNavigate();

  return (
    <div className="page-container centrado">
      <div className="card">
        <h1>Resultados</h1>
        <p>Los resultados del juego se muestran directamente en la pantalla del administrador.</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Volver al inicio
        </button>
      </div>
    </div>
  );
}

export default ResultsPage;
