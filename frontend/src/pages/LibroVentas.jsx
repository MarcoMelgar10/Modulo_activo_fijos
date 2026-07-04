import { useState } from 'react';
import { PageHeader, Card, CardBody, Select, Spinner, EmptyState } from '../components/ui';
import { useLibroVentas } from '../queries/useLibrosFiscal.js';
import { formatBs, formatFecha } from '../lib/format.js';
import { exportarPDF, pdfBs } from '../lib/pdf.js';

const MESES = [
  { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' }, { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' }, { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
];

function exportCSV(registros) {
  const header = 'Fecha,Número Asiento,Concepto,Neto,IVA Débito,Total\n';
  const rows = registros.map((r) =>
    [r.fecha, r.numero_asiento, `"${r.concepto}"`, r.monto_neto, r.iva, r.monto_total].join(','),
  ).join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'libro-ventas.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function LibroVentas() {
  const now = new Date();
  const [gestion] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);

  const { data, isLoading } = useLibroVentas({ mes, gestion });

  const exportarPdf = () =>
    exportarPDF({
      titulo: 'Libro de Ventas',
      subtitulo: `${MESES.find((m) => m.value === mes)?.label} ${gestion}`,
      columnas: ['Fecha', 'Nro. Asiento', 'Concepto', 'Neto', 'IVA Débito', 'Total'],
      filas: data.registros.map((r) => [formatFecha(r.fecha), r.numero_asiento, r.concepto, pdfBs(r.monto_neto), pdfBs(r.iva), pdfBs(r.monto_total)]),
      resumen: [
        `Total Neto: ${pdfBs(data.totales.total_neto)}`,
        `Total IVA Débito: ${pdfBs(data.totales.total_iva)}`,
        `Total General: ${pdfBs(data.totales.total_general)}`,
      ],
      archivo: `libro-ventas-${gestion}-${String(mes).padStart(2, '0')}`,
    });

  return (
    <div>
      <PageHeader title="Libro de Ventas" description="Registro de ventas con IVA Débito Fiscal desglosado." />

      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm text-ink-muted">Período:</span>
        <Select value={mes} onChange={(e) => setMes(Number(e.target.value))}>
          {MESES.map((m) => (
            <option key={m.value} value={m.value}>{m.label} {gestion}</option>
          ))}
        </Select>
        {data?.registros?.length > 0 && (
          <div className="ml-auto flex items-center gap-4">
            <button onClick={() => exportCSV(data.registros)} className="text-sm text-blue-600 hover:underline">Exportar CSV</button>
            <button onClick={exportarPdf} className="text-sm text-blue-600 hover:underline">Exportar PDF</button>
          </div>
        )}
      </div>

      <Card>
        <CardBody>
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-ink-muted">
              <Spinner /> Cargando…
            </div>
          ) : !data?.registros?.length ? (
            <EmptyState title="Sin registros" description="No hay ventas en este período." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-ink-muted">
                    <th className="pb-2 pr-4">Fecha</th>
                    <th className="pb-2 pr-4">Nro. Asiento</th>
                    <th className="pb-2 pr-4">Concepto</th>
                    <th className="pb-2 pr-4 text-right">Neto</th>
                    <th className="pb-2 pr-4 text-right">IVA Débito</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.registros.map((r, i) => (
                    <tr key={i} className="border-b border-line/50">
                      <td className="py-2 pr-4">{formatFecha(r.fecha)}</td>
                      <td className="py-2 pr-4 font-mono text-xs">{r.numero_asiento}</td>
                      <td className="py-2 pr-4">{r.concepto}</td>
                      <td className="py-2 pr-4 text-right">{formatBs(r.monto_neto)}</td>
                      <td className="py-2 pr-4 text-right">{formatBs(r.iva)}</td>
                      <td className="py-2 text-right font-medium">{formatBs(r.monto_total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-semibold">
                    <td colSpan={3} className="pt-3 pr-4">Totales</td>
                    <td className="pt-3 pr-4 text-right">{formatBs(data.totales.total_neto)}</td>
                    <td className="pt-3 pr-4 text-right">{formatBs(data.totales.total_iva)}</td>
                    <td className="pt-3 text-right">{formatBs(data.totales.total_general)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
