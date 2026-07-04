import { useState } from 'react';
import { usePresupuestos, useEjecucionPresupuesto } from '../queries/usePresupuestos.js';
import { PageHeader, Card, CardBody, Select, Badge, Spinner, EmptyState, Button } from '../components/ui';
import { formatBs } from '../lib/format.js';
import { exportarPDF, pdfBs } from '../lib/pdf.js';

const alertaTono = { SOBREGIRO: 'danger', BAJO_META: 'warning' };
const alertaLabel = { SOBREGIRO: 'Sobregiro', BAJO_META: 'Bajo meta' };

export function EjecucionPresupuesto() {
  const { data: presupuestos = [] } = usePresupuestos();
  const [id, setId] = useState('');
  const { data, isLoading } = useEjecucionPresupuesto(Number(id), { enabled: !!id });

  const t = data?.totales;

  const exportar = () =>
    exportarPDF({
      titulo: 'Ejecución presupuestaria',
      subtitulo: `${data.nombre} — gestión ${data.gestion}`,
      columnas: ['Código', 'Cuenta', 'Tipo', 'Planificado', 'Real', 'Desviación', '% ejec.', 'Alerta'],
      filas: data.lineas.map((l) => [
        l.codigo, l.nombre, l.tipo, pdfBs(l.planificado), pdfBs(l.real), pdfBs(l.desviacion),
        l.porcentaje != null ? `${l.porcentaje}%` : '—', l.alerta ? alertaLabel[l.alerta] : '',
      ]),
      resumen: [
        `Ingresos: plan ${pdfBs(t.plan_ingresos)} · real ${pdfBs(t.real_ingresos)}`,
        `Gastos: plan ${pdfBs(t.plan_gastos)} · real ${pdfBs(t.real_gastos)}`,
        `Utilidad: plan ${pdfBs(t.plan_utilidad)} · real ${pdfBs(t.real_utilidad)}`,
      ],
      archivo: `ejecucion-presupuesto-${data.gestion}`,
    });

  return (
    <div>
      <PageHeader title="Ejecución presupuestaria" description="Comparación de lo planificado con lo ejecutado real (movimientos contables de la gestión) — RF-PRE-03/04/05." />

      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-80">
              <Select id="presupuesto" label="Presupuesto" value={id} onChange={(e) => setId(e.target.value)}>
                <option value="">— Seleccionar —</option>
                {presupuestos.map((p) => (
                  <option key={p.id_presupuesto} value={p.id_presupuesto}>{p.nombre} · {p.gestion} ({p.estado})</option>
                ))}
              </Select>
            </div>
            {data && <Button variant="secondary" onClick={exportar}>Exportar PDF</Button>}
          </div>
        </CardBody>
      </Card>

      {!id && <EmptyState title="Selecciona un presupuesto" description="Elige un presupuesto para ver su ejecución." />}
      {id && isLoading && <div className="flex items-center gap-2 text-sm text-ink-muted"><Spinner /> Calculando ejecución…</div>}

      {data && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card><CardBody><p className="text-xs uppercase tracking-wide text-ink-soft">Ingresos (plan / real)</p><p className="mt-1 text-lg font-semibold">{formatBs(t.plan_ingresos)} / {formatBs(t.real_ingresos)}</p></CardBody></Card>
            <Card><CardBody><p className="text-xs uppercase tracking-wide text-ink-soft">Gastos (plan / real)</p><p className="mt-1 text-lg font-semibold">{formatBs(t.plan_gastos)} / {formatBs(t.real_gastos)}</p></CardBody></Card>
            <Card><CardBody><p className="text-xs uppercase tracking-wide text-ink-soft">Utilidad (plan / real)</p><p className="mt-1 text-lg font-semibold">{formatBs(t.plan_utilidad)} / {formatBs(t.real_utilidad)}</p></CardBody></Card>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
                  <tr>
                    <th className="px-4 py-3 font-medium">Cuenta</th>
                    <th className="px-4 py-3 font-medium">Tipo</th>
                    <th className="px-4 py-3 text-right font-medium">Planificado</th>
                    <th className="px-4 py-3 text-right font-medium">Real</th>
                    <th className="px-4 py-3 text-right font-medium">Desviación</th>
                    <th className="px-4 py-3 text-right font-medium">% ejec.</th>
                    <th className="px-4 py-3 font-medium">Alerta</th>
                  </tr>
                </thead>
                <tbody>
                  {data.lineas.map((l) => (
                    <tr key={l.id_cuenta} className="border-b border-line last:border-0 hover:bg-surface-muted">
                      <td className="px-4 py-3"><span className="font-mono text-xs text-ink-soft">{l.codigo}</span> {l.nombre}</td>
                      <td className="px-4 py-3"><Badge tone={l.tipo === 'INGRESO' ? 'success' : 'danger'}>{l.tipo}</Badge></td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatBs(l.planificado)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatBs(l.real)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatBs(l.desviacion)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{l.porcentaje != null ? `${l.porcentaje}%` : '—'}</td>
                      <td className="px-4 py-3">{l.alerta ? <Badge tone={alertaTono[l.alerta]}>{alertaLabel[l.alerta]}</Badge> : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
