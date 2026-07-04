import { useState } from 'react';
import { useAuditoria, useModulosAuditoria } from '../queries/useAuditoria.js';
import { PageHeader, Card, CardBody, Button, Input, Select, Badge, Spinner, EmptyState } from '../components/ui';
import { exportarPDF } from '../lib/pdf.js';

const fechaHora = (v) => (v ? new Date(v).toLocaleString('es-BO') : '');

export function Auditoria() {
  const { data: modulos = [] } = useModulosAuditoria();
  const [form, setForm] = useState({ desde: '', hasta: '', modulo: '' });
  const [aplicados, setAplicados] = useState({});
  const { data: logs, isLoading, isError } = useAuditoria(aplicados);

  const aplicar = (e) => {
    e.preventDefault();
    const f = {};
    if (form.desde) f.desde = form.desde;
    if (form.hasta) f.hasta = form.hasta;
    if (form.modulo) f.modulo = form.modulo;
    setAplicados(f);
  };

  const filas = logs ?? [];

  const exportar = () =>
    exportarPDF({
      titulo: 'Auditoría de acciones',
      subtitulo: `${aplicados.desde || 'inicio'} — ${aplicados.hasta || 'hoy'}${aplicados.modulo ? ` · ${aplicados.modulo}` : ''}`,
      columnas: ['Fecha y hora', 'Usuario', 'Módulo', 'Acción', 'IP'],
      filas: filas.map((l) => [
        fechaHora(l.fecha_hora),
        l.empleado ? l.empleado.usuario : '—',
        l.modulo,
        l.accion,
        l.ip_address || '',
      ]),
      archivo: 'auditoria',
    });

  return (
    <div>
      <PageHeader title="Auditoría de acciones" description="Historial de acciones por usuario, filtrable por fecha y módulo (RF-REP-03)." />

      <Card className="mb-6">
        <CardBody>
          <form onSubmit={aplicar} className="flex flex-wrap items-end gap-3">
            <div className="w-44"><Input id="desde" label="Desde" type="date" value={form.desde} onChange={(e) => setForm({ ...form, desde: e.target.value })} /></div>
            <div className="w-44"><Input id="hasta" label="Hasta" type="date" value={form.hasta} onChange={(e) => setForm({ ...form, hasta: e.target.value })} /></div>
            <div className="w-48">
              <Select id="modulo" label="Módulo" value={form.modulo} onChange={(e) => setForm({ ...form, modulo: e.target.value })}>
                <option value="">— Todos —</option>
                {modulos.map((m) => (<option key={m} value={m}>{m}</option>))}
              </Select>
            </div>
            <Button type="submit">Filtrar</Button>
            {filas.length > 0 && <Button type="button" variant="secondary" onClick={exportar}>Exportar PDF</Button>}
          </form>
        </CardBody>
      </Card>

      {isLoading && <div className="flex items-center gap-2 text-sm text-ink-muted"><Spinner /> Cargando auditoría…</div>}
      {isError && <p className="text-sm text-red-600">No se pudo cargar la auditoría.</p>}
      {filas.length === 0 && !isLoading && <EmptyState title="Sin registros" description="No hay acciones para los filtros seleccionados." />}

      {filas.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
                <tr>
                  <th className="px-4 py-3 font-medium">Fecha y hora</th>
                  <th className="px-4 py-3 font-medium">Usuario</th>
                  <th className="px-4 py-3 font-medium">Módulo</th>
                  <th className="px-4 py-3 font-medium">Acción</th>
                  <th className="px-4 py-3 font-medium">IP</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((l) => (
                  <tr key={l.id_log} className="border-b border-line last:border-0 hover:bg-surface-muted">
                    <td className="px-4 py-3 whitespace-nowrap text-ink-muted">{fechaHora(l.fecha_hora)}</td>
                    <td className="px-4 py-3">{l.empleado ? `${l.empleado.nombre} ${l.empleado.apellido}` : '—'}</td>
                    <td className="px-4 py-3"><Badge tone="neutral">{l.modulo}</Badge></td>
                    <td className="px-4 py-3 font-mono text-xs">{l.accion}</td>
                    <td className="px-4 py-3 text-xs text-ink-soft">{l.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
