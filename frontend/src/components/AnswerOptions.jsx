// Muestra las 4 opciones de respuesta en la pantalla del administrador
// Con sus colores y figuras al estilo Kahoot

const FIGURAS = [
  { icono: '▲', clase: 'forma-triangulo', label: 'Triángulo' },
  { icono: '●', clase: 'forma-circulo',   label: 'Círculo'   },
  { icono: '■', clase: 'forma-cuadrado',  label: 'Cuadrado'  },
  { icono: '◆', clase: 'forma-rombo',     label: 'Rombo'     },
];

function AnswerOptions({ opciones, mostrarCorrecta = false }) {
  if (!opciones || opciones.length === 0) return null;

  return (
    <div className="opciones-admin-grid">
      {opciones.map((opcion, indice) => {
        const figura = FIGURAS[indice] || FIGURAS[0];
        const esCorrecta = opcion.esCorrecta;

        return (
          <div
            key={opcion.id || indice}
            className={`opcion-admin ${figura.clase} ${mostrarCorrecta && esCorrecta ? 'opcion-resaltada' : ''}`}
          >
            <span className="opcion-icono-admin">{figura.icono}</span>
            <span className="opcion-texto-admin">{opcion.textoOpcion}</span>
            {mostrarCorrecta && esCorrecta && (
              <span className="opcion-check">✓</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default AnswerOptions;
