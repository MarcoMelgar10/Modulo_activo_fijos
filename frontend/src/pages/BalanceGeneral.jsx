import { useState } from 'react';
import { useBalanceGeneral } from '../queries/useReportes.js';
import { PageHeader, Card, CardBody, Button, Input, Spinner, EmptyState, Badge } from '../components/ui';
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

export function BalanceGeneral() {
  const [form, setForm] = useState({ fecha_inicio: '', fecha_fin: '' });
  const [filtros, setFiltros] = useState(null);
  const { data, isLoading, isError } = useBalanceGeneral(filtros || {}, { enabled: filtros !== null });

  const submit = (e) => {
    e.preventDefault();
    if (!form.fecha_inicio || !form.fecha_fin) return;
    setFiltros({ fecha_inicio: form.fecha_inicio, fecha_fin: form.fecha_fin });
  };

  const cuentas = data?.cuentas ?? [];
  const v = data?.validacion ?? {};
  const activo = cuentas.filter((c) => c.tipo === 'ACTIVO');
  const pasivo = cuentas.filter((c) => c.tipo === 'PASIVO');
  const patrimonio = cuentas.filter((c) => c.tipo === 'PATRIMONIO');
  const tiene = cuentas.length > 0;

  const exportar = () =>
    exportarPDF({
      titulo: 'Balance General',
      subtitulo: `Del ${data.fecha_inicio} al ${data.fecha_fin}`,
      columnas: ['Código', 'Cuenta', 'Tipo', 'Saldo'],
      filas: cuentas.map((c) => [c.codigo, c.nombre, c.tipo, pdfBs(c.saldo)]),
      resumen: [
        `Total Activo: ${pdfBs(v.total_activo)}`,
        `Total Pasivo: ${pdfBs(v.total_pasivo)}`,
        `Total Patrimonio (incl. resultado del ejercicio): ${pdfBs((v.total_patrimonio || 0) + (v.resultado_ejercicio || 0))}`,
        `Ecuación contable: ${v.ecuacion_cumplida ? 'Cuadrada' : 'Descuadrada'}`,
      ],
      archivo: `balance-general-${data.fecha_fin}`,
    });

  return (
    <div className="space-y-6">
      <PageHeader title="Balance General" description="Situación financiera: activos, pasivos y patrimonio a una fecha de corte." />

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
      {filtros !== null && isError && <p className="text-sm text-red-600">No se pudo generar el balance.</p>}
      {filtros !== null && !isLoading && !isError && !tiene && <EmptyState title="Sin datos" description="No hay movimientos en el período." />}

      {tiene && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <GrupoCuentas titulo="Activo" cuentas={activo} total={v.total_activo} />
            <div className="space-y-6">
              <GrupoCuentas titulo="Pasivo" cuentas={pasivo} total={v.total_pasivo} />
              <GrupoCuentas titulo="Patrimonio" cuentas={patrimonio} total={(v.total_patrimonio || 0) + (v.resultado_ejercicio || 0)} />
            </div>
          </div>

          <Card className={v.ecuacion_cumplida ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-200 bg-red-50/30'}>
            <CardBody className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="text-sm font-semibold text-ink">Ecuación contable</h4>
                <p className="mt-0.5 text-xs text-ink-muted">Activo = Pasivo + Patrimonio</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-ink-muted">
                  {formatBs(v.total_activo)} = {formatBs(v.pasivo_mas_patrimonio)}
                </span>
                <Badge tone={v.ecuacion_cumplida ? 'success' : 'danger'}>{v.ecuacion_cumplida ? 'Cuadrado' : 'Descuadrado'}</Badge>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
