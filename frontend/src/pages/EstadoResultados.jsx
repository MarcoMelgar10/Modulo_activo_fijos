import { useState } from 'react';
import { useEstadoResultados } from '../queries/useReportes.js';
import { PageHeader, Card, CardBody, Button, Input, Spinner, EmptyState } from '../components/ui';
import { formatBs } from '../lib/format.js';
import { exportarPDF, pdfBs } from '../lib/pdf.js';

const sangria = { 1: 'font-bold text-ink', 2: 'pl-4 font-semibold text-ink-muted', 3: 'pl-8 text-ink-muted', 4: 'pl-12 text-ink-soft' };

function GrupoCuentas({ titulo, cuentas, total }) {
  return (
    <Card>
      <div className="flex items-center justify-between border-b border-line bg-surface-sunken px-5 py-4">
        <h3 className="text-xs font-bold uppercase tracking-wide text-ink">{titulo}</h3>
        <span className="text-sm font-bold text-ink">{formatBs(total)}</span>
      </div>
      <CardBody className="py-2">
        {cuentas.length === 0 ? (
          <p className="py-3 text-center text-xs text-ink-soft">Sin movimientos</p>
        ) : (
          cuentas.map((c) => (
            <div key={c.id_cuenta || c.codigo} className="flex items-center justify-between border-b border-line/40 py-2 text-sm last:border-0">
              <div className={`flex items-center gap-3 ${sangria[c.nivel] || ''}`}>
                <span className="font-mono text-xs text-ink-soft">{c.codigo}</span>
                <span>{c.nombre}</span>
              </div>
              <span className="tabular-nums">{formatBs(c.saldo)}</span>
            </div>
          ))
        )}
      </CardBody>
    </Card>
  );
}

export function EstadoResultados() {
  const [form, setForm] = useState({ fecha_inicio: '', fecha_fin: '' });
  const [filtros, setFiltros] = useState(null);
  const { data, isLoading, isError } = useEstadoResultados(filtros || {}, { enabled: filtros !== null });

  const submit = (e) => {
    e.preventDefault();
    if (!form.fecha_inicio || !form.fecha_fin) return;
    setFiltros({ fecha_inicio: form.fecha_inicio, fecha_fin: form.fecha_fin });
  };

  const cuentas = data?.cuentas ?? [];
  const r = data?.resumen ?? {};
  const ingresos = cuentas.filter((c) => c.tipo === 'INGRESO');
  const gastos = cuentas.filter((c) => c.tipo === 'GASTO');
  const tiene = cuentas.length > 0;

  const exportar = () =>
    exportarPDF({
      titulo: 'Estado de Resultados',
      subtitulo: `Del ${data.fecha_inicio} al ${data.fecha_fin}`,
      columnas: ['Código', 'Cuenta', 'Tipo', 'Monto'],
      filas: cuentas.map((c) => [c.codigo, c.nombre, c.tipo, pdfBs(c.saldo)]),
      resumen: [
        `Total Ingresos: ${pdfBs(r.total_ingresos)}`,
        `Total Gastos: ${pdfBs(r.total_gastos)}`,
        `${r.es_utilidad ? 'Utilidad' : 'Pérdida'} neta: ${pdfBs(r.utilidad_neta)}`,
      ],
      archivo: `estado-resultados-${data.fecha_fin}`,
    });

  return (
    <div className="space-y-6">
      <PageHeader title="Estado de Resultados" description="Ingresos y gastos del período para determinar la utilidad o pérdida." />

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
      {filtros !== null && isError && <p className="text-sm text-red-600">No se pudo generar el reporte.</p>}
      {filtros !== null && !isLoading && !isError && !tiene && <EmptyState title="Sin datos" description="No hay ingresos ni gastos en el período." />}

      {tiene && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <GrupoCuentas titulo="Ingresos" cuentas={ingresos} total={r.total_ingresos} />
            <GrupoCuentas titulo="Gastos" cuentas={gastos} total={r.total_gastos} />
          </div>

          <Card className={r.es_utilidad ? 'border-emerald-200 bg-emerald-50/20' : 'border-line bg-surface-sunken/40'}>
            <CardBody className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="text-sm font-semibold text-ink">Resultado del ejercicio</h4>
                <p className="mt-0.5 text-xs text-ink-muted">Ingresos − Gastos</p>
              </div>
              <div className="text-right">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-soft">{r.es_utilidad ? 'Utilidad' : 'Pérdida'}</p>
                <p className={`text-2xl font-bold tracking-tight ${r.es_utilidad ? 'text-emerald-700' : 'text-ink'}`}>{formatBs(r.utilidad_neta)}</p>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
