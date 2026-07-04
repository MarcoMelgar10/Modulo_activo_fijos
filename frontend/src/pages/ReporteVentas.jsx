import { useState } from 'react';
import { useReporteVentas } from '../queries/useVentas.js';
import { PageHeader, Card, CardBody, Button, Input, Spinner, EmptyState } from '../components/ui';
import { formatBs, formatFecha } from '../lib/format.js';
import { exportarPDF, pdfBs } from '../lib/pdf.js';

export function ReporteVentas() {
  const [filtros, setFiltros] = useState({ desde: '', hasta: '' });
  const [aplicados, setAplicados] = useState({});
  const { data, isLoading, isError } = useReporteVentas(aplicados);

  const aplicar = () => {
    const limpio = {};
    if (filtros.desde) limpio.desde = filtros.desde;
    if (filtros.hasta) limpio.hasta = filtros.hasta;
    setAplicados(limpio);
  };

  const totales = data?.totales;
  const porSucursal = data?.porSucursal ?? [];
  const ventas = data?.ventas ?? [];

  const exportarPdf = () =>
    exportarPDF({
      titulo: 'Reporte de Ventas',
      subtitulo: `${aplicados.desde || 'inicio'} — ${aplicados.hasta || 'hoy'}`,
      columnas: ['Número', 'Fecha', 'Sucursal', 'Método', 'Total'],
      filas: ventas.map((v) => [v.numero_venta, formatFecha(v.fecha), v.sucursal?.nombre || `#${v.id_sucursal}`, v.metodo_pago, pdfBs(v.monto_total)]),
      resumen: [
        `Ventas: ${totales.cantidad}`,
        `Descuentos: ${pdfBs(totales.descuento)}`,
        `Total vendido: ${pdfBs(totales.total)}`,
        ...porSucursal.map((s) => `${s.sucursal}: ${s.cantidad} ventas · ${pdfBs(s.total)}`),
      ],
      archivo: 'reporte-ventas',
    });

  return (
    <div>
      <PageHeader
        title="Reporte de ventas"
        description="Ventas por rango de fecha con totales y comparativa entre sucursales (RF-VEN-04)."
      />

      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-44"><Input id="desde" label="Desde" type="date" value={filtros.desde} onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })} /></div>
            <div className="w-44"><Input id="hasta" label="Hasta" type="date" value={filtros.hasta} onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })} /></div>
            <Button onClick={aplicar}>Aplicar</Button>
            {totales && ventas.length > 0 && <Button variant="secondary" onClick={exportarPdf}>Exportar PDF</Button>}
          </div>
        </CardBody>
      </Card>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-ink-muted"><Spinner /> Calculando reporte…</div>
      )}
      {isError && <p className="text-sm text-red-600">No se pudo generar el reporte.</p>}

      {totales && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <Card><CardBody><p className="text-xs uppercase tracking-wide text-ink-soft">Ventas</p><p className="mt-1 text-2xl font-semibold">{totales.cantidad}</p></CardBody></Card>
            <Card><CardBody><p className="text-xs uppercase tracking-wide text-ink-soft">Descuentos</p><p className="mt-1 text-2xl font-semibold">{formatBs(totales.descuento)}</p></CardBody></Card>
            <Card><CardBody><p className="text-xs uppercase tracking-wide text-ink-soft">Total vendido</p><p className="mt-1 text-2xl font-semibold">{formatBs(totales.total)}</p></CardBody></Card>
          </div>

          <Card className="mb-6">
            <CardBody>
              <p className="mb-3 text-sm font-semibold">Comparativa por sucursal</p>
              {porSucursal.length === 0 ? (
                <p className="text-sm text-ink-muted">Sin datos en el rango.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide text-ink-soft">
                    <tr><th className="py-2 font-medium">Sucursal</th><th className="py-2 text-right font-medium">Ventas</th><th className="py-2 text-right font-medium">Total</th></tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {porSucursal.map((s) => (
                      <tr key={s.id_sucursal}>
                        <td className="py-2">{s.sucursal}</td>
                        <td className="py-2 text-right tabular-nums">{s.cantidad}</td>
                        <td className="py-2 text-right tabular-nums">{formatBs(s.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardBody>
          </Card>

          {ventas.length === 0 ? (
            <EmptyState title="Sin ventas en el rango" />
          ) : (
            <Card>
              <table className="w-full">
                <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
                  <tr>
                    <th className="px-4 py-3 font-medium">Número</th>
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium">Sucursal</th>
                    <th className="px-4 py-3 font-medium">Pago</th>
                    <th className="px-4 py-3 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {ventas.map((v) => (
                    <tr key={v.id_venta} className="border-b border-line last:border-0">
                      <td className="px-4 py-3 font-mono text-xs text-ink-muted">{v.numero_venta}</td>
                      <td className="px-4 py-3 text-sm">{formatFecha(v.fecha)}</td>
                      <td className="px-4 py-3 text-sm">{v.sucursal?.nombre || `#${v.id_sucursal}`}</td>
                      <td className="px-4 py-3 text-sm">{v.metodo_pago}</td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums">{formatBs(v.monto_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
