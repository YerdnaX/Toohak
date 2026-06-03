const ExcelJS = require('exceljs');

/**
 * Genera un archivo Excel con los resultados completos de una sesión de juego.
 * Incluye dos hojas: Resumen Final y Detalle de Respuestas.
 *
 * @param {Object} session - Objeto de sesión con todos los datos del juego
 * @returns {ExcelJS.Workbook} - Workbook listo para ser enviado al cliente
 */
async function generarExcel(session) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Kahoot Clone';
  workbook.created = new Date();

  // Estilo base para encabezados de columna
  const estiloEncabezado = {
    font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF46178F' } },
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    border: {
      top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
    }
  };

  // ============================================
  // HOJA 1: Resumen Final
  // ============================================
  const hoja1 = workbook.addWorksheet('Resumen Final');

  // Fila de título del Kahoot
  hoja1.mergeCells('A1:F1');
  const celdaTitulo = hoja1.getCell('A1');
  celdaTitulo.value = `Resultados de: ${session.kahoot?.titulo || 'Kahoot'}`;
  celdaTitulo.font = { bold: true, size: 14, color: { argb: 'FF46178F' } };
  celdaTitulo.alignment = { horizontal: 'center', vertical: 'middle' };
  hoja1.getRow(1).height = 30;

  // Fila de fecha y código de sesión
  hoja1.mergeCells('A2:F2');
  const celdaFecha = hoja1.getCell('A2');
  celdaFecha.value = `Fecha: ${new Date().toLocaleString('es-ES')} | Código de sesión: ${session.codigo}`;
  celdaFecha.font = { size: 10, color: { argb: 'FF666666' } };
  celdaFecha.alignment = { horizontal: 'center' };
  hoja1.getRow(2).height = 18;

  // Encabezados de columnas
  hoja1.getRow(3).values = [
    'Posición',
    'Nombre del Participante',
    'Puntaje Total',
    'Respuestas Correctas',
    'Respuestas Incorrectas',
    'Tiempo Promedio (ms)'
  ];
  hoja1.getRow(3).height = 25;
  hoja1.getRow(3).eachCell(cell => { cell.style = estiloEncabezado; });

  hoja1.columns = [
    { key: 'posicion', width: 12 },
    { key: 'nombre', width: 28 },
    { key: 'puntaje', width: 16 },
    { key: 'correctas', width: 22 },
    { key: 'incorrectas', width: 22 },
    { key: 'tiempoPromedio', width: 24 }
  ];

  const resultados = calcularResultadosFinales(session);

  resultados.forEach((r, index) => {
    const fila = hoja1.addRow([
      r.posicion,
      r.nombre,
      r.puntajeTotal,
      r.respuestasCorrectas,
      r.respuestasIncorrectas,
      Math.round(r.tiempoPromedio)
    ]);

    // Colores especiales para los primeros tres lugares
    let colorFondo = index % 2 === 0 ? 'FFF5F0FF' : 'FFFFFFFF';
    if (r.posicion === 1) colorFondo = 'FFFFF9C4'; // Oro
    if (r.posicion === 2) colorFondo = 'FFF5F5F5'; // Plata
    if (r.posicion === 3) colorFondo = 'FFFFF3E0'; // Bronce

    fila.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorFondo } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        right: { style: 'thin', color: { argb: 'FFDDDDDD' } }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
  });

  // ============================================
  // HOJA 2: Detalle de Respuestas
  // ============================================
  const hoja2 = workbook.addWorksheet('Detalle de Respuestas');

  hoja2.getRow(1).values = [
    'Nombre del Participante',
    'Pregunta',
    'Respuesta Seleccionada',
    'Respuesta Correcta',
    'Acertó',
    'Tiempo de Respuesta (ms)',
    'Puntaje Obtenido'
  ];
  hoja2.getRow(1).height = 25;
  hoja2.getRow(1).eachCell(cell => { cell.style = estiloEncabezado; });

  hoja2.columns = [
    { key: 'nombre', width: 25 },
    { key: 'pregunta', width: 42 },
    { key: 'respuestaSeleccionada', width: 28 },
    { key: 'respuestaCorrecta', width: 28 },
    { key: 'acerto', width: 12 },
    { key: 'tiempoMs', width: 26 },
    { key: 'puntaje', width: 20 }
  ];

  const detalles = obtenerDetalleRespuestas(session);

  detalles.forEach(d => {
    const fila = hoja2.addRow([
      d.nombre,
      d.pregunta,
      d.respuestaSeleccionada,
      d.respuestaCorrecta,
      d.acerto ? 'Si' : 'No',
      d.tiempoMs,
      d.puntaje
    ]);

    // Verde si acertó, rojo si no acertó
    const colorFondo = d.acerto ? 'FFE8F5E9' : 'FFFCE4EC';
    fila.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorFondo } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        right: { style: 'thin', color: { argb: 'FFDDDDDD' } }
      };
      cell.alignment = { vertical: 'middle', wrapText: true };
    });
  });

  return workbook;
}

// Calcula el ranking final ordenado por puntaje
function calcularResultadosFinales(session) {
  const jugadores = session.jugadores || [];
  const puntajes = session.puntajes || {};
  const respuestas = session.respuestas || [];

  const resultados = jugadores.map(jugador => {
    const respJugador = respuestas.filter(r => r.nombreJugador === jugador.nombre);
    const correctas = respJugador.filter(r => r.esCorrecta).length;
    const incorrectas = respJugador.filter(r => !r.esCorrecta).length;
    const tiempos = respJugador.map(r => r.tiempoMs || 0);
    const tiempoPromedio = tiempos.length > 0
      ? tiempos.reduce((a, b) => a + b, 0) / tiempos.length
      : 0;

    return {
      nombre: jugador.nombre,
      puntajeTotal: puntajes[jugador.nombre] || 0,
      respuestasCorrectas: correctas,
      respuestasIncorrectas: incorrectas,
      tiempoPromedio
    };
  });

  resultados.sort((a, b) => b.puntajeTotal - a.puntajeTotal);
  resultados.forEach((r, i) => { r.posicion = i + 1; });
  return resultados;
}

// Obtiene el detalle de todas las respuestas para la hoja 2
function obtenerDetalleRespuestas(session) {
  return (session.respuestas || []).map(r => ({
    nombre: r.nombreJugador,
    pregunta: r.textoPregunta,
    respuestaSeleccionada: r.respuestaSeleccionada,
    respuestaCorrecta: r.respuestaCorrecta,
    acerto: r.esCorrecta,
    tiempoMs: r.tiempoMs,
    puntaje: r.puntaje
  }));
}

module.exports = { generarExcel };
