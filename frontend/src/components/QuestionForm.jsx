// Formulario para crear/editar una pregunta con sus 4 opciones
// Usado en CreateKahootPage

const FIGURAS = [
  { valor: 'triangulo', icono: '▲', label: 'Triángulo', clase: 'forma-triangulo' },
  { valor: 'circulo',   icono: '●', label: 'Círculo',   clase: 'forma-circulo'   },
  { valor: 'cuadrado',  icono: '■', label: 'Cuadrado',  clase: 'forma-cuadrado'  },
  { valor: 'rombo',     icono: '◆', label: 'Rombo',     clase: 'forma-rombo'     },
];

function QuestionForm({ numero, pregunta, onUpdate, onEliminar }) {
  function actualizarTexto(valor) {
    onUpdate({ ...pregunta, textoPregunta: valor });
  }

  function actualizarTiempo(valor) {
    onUpdate({ ...pregunta, tiempoLimite: parseInt(valor) || 20 });
  }

  function actualizarOpcion(indice, campo, valor) {
    const nuevasOpciones = pregunta.opciones.map((op, i) => {
      if (campo === 'esCorrecta') {
        // Solo una opción puede ser correcta (radio button)
        return { ...op, esCorrecta: i === indice };
      }
      if (i === indice) {
        return { ...op, [campo]: valor };
      }
      return op;
    });
    onUpdate({ ...pregunta, opciones: nuevasOpciones });
  }

  return (
    <div className="question-form card">
      <div className="question-form-header">
        <h3 className="question-numero">Pregunta {numero}</h3>
        <button
          type="button"
          className="btn-eliminar"
          onClick={onEliminar}
          title="Eliminar pregunta"
        >
          ✕
        </button>
      </div>

      <div className="campo">
        <label>Texto de la pregunta *</label>
        <input
          type="text"
          value={pregunta.textoPregunta}
          onChange={e => actualizarTexto(e.target.value)}
          placeholder="Escribe aquí la pregunta..."
          className="input"
          maxLength={500}
        />
      </div>

      <div className="campo campo-tiempo">
        <label>Tiempo límite (segundos)</label>
        <select
          value={pregunta.tiempoLimite}
          onChange={e => actualizarTiempo(e.target.value)}
          className="input select-tiempo"
        >
          <option value={10}>10 segundos</option>
          <option value={15}>15 segundos</option>
          <option value={20}>20 segundos</option>
          <option value={30}>30 segundos</option>
          <option value={45}>45 segundos</option>
          <option value={60}>60 segundos</option>
        </select>
      </div>

      <div className="opciones-grid">
        {pregunta.opciones.map((opcion, indice) => {
          const figura = FIGURAS[indice];
          return (
            <div
              key={indice}
              className={`opcion-form ${figura.clase} ${opcion.esCorrecta ? 'opcion-correcta' : ''}`}
            >
              <div className="opcion-figura-header">
                <span className="opcion-icono">{figura.icono}</span>
                <span className="opcion-label">{figura.label}</span>
                <label className="opcion-correcta-label">
                  <input
                    type="radio"
                    name={`correcta-pregunta-${numero}`}
                    checked={opcion.esCorrecta}
                    onChange={() => actualizarOpcion(indice, 'esCorrecta', true)}
                  />
                  Correcta
                </label>
              </div>
              <input
                type="text"
                value={opcion.textoOpcion}
                onChange={e => actualizarOpcion(indice, 'textoOpcion', e.target.value)}
                placeholder={`Opción ${indice + 1}...`}
                className="input opcion-input"
                maxLength={300}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default QuestionForm;
