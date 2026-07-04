import { useState } from 'react';
import { useFlujoCaja } from '../queries/useReportes.js';
import { PageHeader, Card, CardBody, Button, Input, Spinner, EmptyState, Badge } from '../components/ui';
import { formatBs } from '../lib/format.js';
import { exportarPDF, pdfBs } from '../lib/pdf.js';

const origenLabel = {
  VENTA: 'Ventas', COMPRA: 'Compras', PAGO: 'Pagos', DEVOLUCION: 'Devoluciones', MANUAL: 'Asientos manuales', CIERRE: 'Cierre',
};

export function FlujoCaja() {
  const [form, setForm] = useState({ fecha_inicio: '', fecha_fin: '' });
  const [filtros, setFiltros] = useState(null);
  const { data, isLoading, isError } = useFlujoCaja(filtros || {}, { enabled: filtros !== null });

  const submit = (e) => {
    e.preventDefault();
    if (!form.fecha_inicio || !form.fecha_fin) return;
    setFiltros({ fecha_inicio: form.fecha_inicio, fecha_fin: form.fecha_fin });
  };

  const movimientos = data?.movimientos ?? [];
  const tiene = data && (movimientos.length > 0 || data.saldo_inicial !== 0);

  const exportar = () =>
    exportarPDF({
      titulo: 'Flujo de Caja',
      subtitulo: `Del ${data.fecha_inicio} al ${data.fecha_fin}`,
      columnas: ['Origen', 'Entradas', 'Salidas', 'Neto'],
      filas: movimientos.map((m) => [origenLabel[m.tipo_origen] || m.tipo_origen, pdfBs(m.entradas), pdfBs(m.salidas), pdfBs(m.neto)]),
      resumen: [
        `Saldo inicial: ${pdfBs(data.saldo_inicial)}`,
        `Total entradas: ${pdfBs(data.total_entradas)}`,
        `Total salidas: ${pdfBs(data.total_salidas)}`,
        `Flujo neto: ${pdfBs(data.flujo_neto)}`,
        `Saldo final: ${pdfBs(data.saldo_final)}`,
      ],
      archivo: `flujo-caja-${data.fecha_inicio}_${data.fecha_fin}`,
    });

  return (
    <div className="space-y-6">
      <PageHeader title="Flujo de Caja" description="Movimientos de efectivo y bancos del período (método directo): saldo inicial + entradas − salidas." />

      <Card>
        <CardBody>
          <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-4 sm:items-end">
            <Input id="fi" label="Fecha inicio" type="date" required value={form.fecha_inicio} onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} />
            <Input id="ff" label="Fecha fin" type="date" required value={form.fecha_fin} onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })} />
            <Button type="submit" disabled={!form.fecha_inicio || !form.fecha_fin}>Generar</Button>
            {tiene && <Button type="button" variant="secondary" onClick={exportar}>Exportar PDF</Button>}
          </form>
        </CardBody>
      </Card>

      {filtros === null && <EmptyState title="Filtros requeridos" description="Selecciona un rango de fechas." />}
      {filtros !== null && isLoading && <div className="flex items-center gap-2 text-sm text-ink-muted"><Spinner /> Calculando…</div>}
      {filtros !== null && isError && <p className="text-sm text-red-600">No se pudo generar el flujo de caja.</p>}
      {filtros !== null && !isLoading && !isError && !tiene && <EmptyState title="Sin movimientos de efectivo" description="No hubo entradas ni salidas de caja/bancos en el período." />}

      {tiene && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <Card><CardBody><p className="text-xs uppercase tracking-wide text-ink-soft">Saldo inicial</p><p className="mt-1 text-xl font-semibold">{formatBs(data.saldo_inicial)}</p></CardBody></Card>
            <Card><CardBody><p className="text-xs uppercase tracking-wide text-ink-soft">Entradas</p><p className="mt-1 text-xl font-semibold text-emerald-700">{formatBs(data.total_entradas)}</p></CardBody></Card>
            <Card><CardBody><p className="text-xs uppercase tracking-wide text-ink-soft">Salidas</p><p className="mt-1 text-xl font-semibold text-red-700">{formatBs(data.total_salidas)}</p></CardBody></Card>
            <Card><CardBody><p className="text-xs uppercase tracking-wide text-ink-soft">Saldo final</p><p className="mt-1 text-xl font-semibold">{formatBs(data.saldo_final)}</p></CardBody></Card>
          </div>

          <Card>
            <CardBody>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold">Movimientos por origen</p>
                <Badge tone={data.flujo_neto >= 0 ? 'success' : 'danger'}>Flujo neto {formatBs(data.flujo_neto)}</Badge>
              </div>
              {movimientos.length === 0 ? (
                <p className="text-sm text-ink-muted">Sin movimientos en el rango (solo saldo de apertura).</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide text-ink-soft">
                    <tr>
                      <th className="py-2 font-medium">Origen</th>
                      <th className="py-2 text-right font-medium">Entradas</th>
                      <th className="py-2 text-right font-medium">Salidas</th>
                      <th className="py-2 text-right font-medium">Neto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {movimientos.map((m) => (
                      <tr key={m.tipo_origen}>
                        <td className="py-2">{origenLabel[m.tipo_origen] || m.tipo_origen}</td>
                        <td className="py-2 text-right tabular-nums">{formatBs(m.entradas)}</td>
                        <td className="py-2 text-right tabular-nums">{formatBs(m.salidas)}</td>
                        <td className="py-2 text-right tabular-nums font-medium">{formatBs(m.neto)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
