// Exportación de reportes a PDF (RF-REP-02 / RF-CON-03).
// jsPDF y jspdf-autotable se cargan de forma dinámica: el bundle no depende de
// ellos hasta que el usuario pulsa "Exportar PDF" (requiere `npm install`).

const bs = new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const pdfBs = (v) => `Bs ${bs.format(Number(v || 0))}`;

/**
 * Genera y descarga un PDF con encabezado de empresa, metadatos de generación,
 * una tabla (autotable) y líneas de resumen opcionales.
 *
 * @param {object} p
 * @param {string} p.titulo        Título del reporte.
 * @param {string} [p.subtitulo]   Rango/filtros (ej. "Del 01/06 al 30/06").
 * @param {string[]} p.columnas    Encabezados de la tabla.
 * @param {Array<Array>} p.filas   Filas de la tabla.
 * @param {string[]} [p.resumen]   Líneas de resumen bajo la tabla.
 * @param {string} [p.archivo]     Nombre del archivo (sin extensión).
 */
export async function exportarPDF({ titulo, subtitulo, columnas, filas, resumen = [], archivo }) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF();
  const marginX = 14;

  // Encabezado / membrete.
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('Flowy · ERP', marginX, 16);
  doc.setFontSize(12);
  doc.text(titulo, marginX, 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(110);
  let headerY = 30;
  if (subtitulo) {
    doc.text(subtitulo, marginX, headerY);
    headerY += 5;
  }
  doc.text(`Generado: ${new Date().toLocaleString('es-BO')}`, marginX, headerY);
  doc.setTextColor(0);

  autoTable(doc, {
    startY: headerY + 5,
    head: [columnas],
    body: filas,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [31, 41, 55], textColor: 255 },
    alternateRowStyles: { fillColor: [246, 247, 249] },
  });

  let y = (doc.lastAutoTable?.finalY ?? headerY + 10) + 8;
  doc.setFontSize(10);
  for (const linea of resumen) {
    doc.text(String(linea), marginX, y);
    y += 6;
  }

  doc.save(`${archivo || titulo}.pdf`);
}
