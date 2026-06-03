import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import QuestionForm from '../components/QuestionForm.jsx';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? '';

const FIGURAS = ['triangulo', 'circulo', 'cuadrado', 'rombo'];

// Plantilla para una pregunta vacía con 4 opciones
function crearPreguntaVacia() {
  return {
    textoPregunta: '',
    tiempoLimite: 20,
    opciones: FIGURAS.map(figura => ({
      textoOpcion: '',
      figura,
      esCorrecta: false
    }))
  };
}

function CreateKahootPage() {
  const navigate = useNavigate();
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [preguntas, setPreguntas] = useState([crearPreguntaVacia()]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  function agregarPregunta() {
    setPreguntas(prev => [...prev, crearPreguntaVacia()]);
  }

  function eliminarPregunta(index) {
    if (preguntas.length === 1) {
      setError('Debe haber al menos una pregunta');
      return;
    }
    setPreguntas(prev => prev.filter((_, i) => i !== index));
  }

  function actualizarPregunta(index, nuevaPregunta) {
    setPreguntas(prev => {
      const copia = [...prev];
      copia[index] = nuevaPregunta;
      return copia;
    });
  }

  function validar() {
    if (!titulo.trim()) return 'El título del Kahoot es obligatorio';

    for (let i = 0; i < preguntas.length; i++) {
      const p = preguntas[i];
      if (!p.textoPregunta.trim()) {
        return `La pregunta ${i + 1} no tiene texto`;
      }
      for (let j = 0; j < p.opciones.length; j++) {
        if (!p.opciones[j].textoOpcion.trim()) {
          return `La opción ${j + 1} de la pregunta ${i + 1} está vacía`;
        }
      }
      const tieneCorrecta = p.opciones.some(o => o.esCorrecta);
      if (!tieneCorrecta) {
        return `La pregunta ${i + 1} no tiene una respuesta correcta seleccionada`;
      }
    }

    return null;
  }

  async function guardarKahoot(e) {
    e.preventDefault();
    setError('');

    const mensajeError = validar();
    if (mensajeError) {
      setError(mensajeError);
      return;
    }

    try {
      setGuardando(true);
      await axios.post(`${BACKEND_URL}/api/kahoot`, { titulo, descripcion, preguntas });
      navigate('/admin');
    } catch (err) {
      setError('Error al guardar el Kahoot. Intenta nuevamente.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <button className="btn-volver" onClick={() => navigate('/admin')}>← Volver</button>
        <h1 className="page-titulo">Crear nuevo Kahoot</h1>
      </div>

      <form onSubmit={guardarKahoot} className="crear-form">
        {/* Información general del Kahoot */}
        <div className="card">
          <h2 className="seccion-titulo">Información general</h2>
          <div className="campo">
            <label htmlFor="titulo">Título del Kahoot *</label>
            <input
              id="titulo"
              type="text"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ej: Quiz de Historia"
              className="input"
              maxLength={200}
            />
          </div>
          <div className="campo">
            <label htmlFor="descripcion">Descripción (opcional)</label>
            <input
              id="descripcion"
              type="text"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Breve descripción del Kahoot"
              className="input"
              maxLength={500}
            />
          </div>
        </div>

        {/* Lista de preguntas */}
        <div className="preguntas-seccion">
          <h2 className="seccion-titulo">Preguntas ({preguntas.length})</h2>

          {preguntas.map((pregunta, index) => (
            <QuestionForm
              key={index}
              numero={index + 1}
              pregunta={pregunta}
              onUpdate={(nuevaPregunta) => actualizarPregunta(index, nuevaPregunta)}
              onEliminar={() => eliminarPregunta(index)}
            />
          ))}

          <button
            type="button"
            className="btn btn-secondary btn-agregar"
            onClick={agregarPregunta}
          >
            + Agregar pregunta
          </button>
        </div>

        {error && <div className="alerta alerta-error">{error}</div>}

        <div className="form-acciones">
          <button type="submit" className="btn btn-primary btn-grande" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar Kahoot'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateKahootPage;
