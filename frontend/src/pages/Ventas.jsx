import { useState } from 'react';
import { useVentas, useCrearDevolucion } from '../queries/useVentas.js';
import { PageHeader, Card, Button, Input, Modal, Badge, Spinner, EmptyState } from '../components/ui';
import { formatBs, formatFecha } from '../lib/format.js';

const estadoTono = { COMPLETADA: 'success', ANULADA: 'danger', DEVOLUCION_PARCIAL: 'warning' };

function DevolucionModal({ venta, onClose }) {
  const devolver = useCrearDevolucion();
  const [motivo, setMotivo] = useState('');
  const [cantidades, setCantidades] = useState({});
  const [error, setError] = useState(null);

  const [prev, setPrev] = useState(null);
  if (venta && venta !== prev) {
    setPrev(venta);
    setMotivo('');
    setCantidades({});
    setError(null);
  }

  const setCant = (id, val) => setCantidades((c) => ({ ...c, [id]: val }));

  const lineas = (venta?.detalles ?? [])
    .map((d) => ({ id_detalle_venta: d.id_detalle, cantidad_dev: Number(cantidades[d.id_detalle] || 0) }))
    .filter((l) => l.cantidad_dev > 0);
  const puede = motivo.trim() && lineas.length > 0;

  const confirmar = async () => {
    setError(null);
    try {
      await devolver.mutateAsync({ id_venta: venta.id_venta, motivo: motivo.trim(), lineas });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar la devolución');
    }
  };

  return (
    <Modal
      open={Boolean(venta)}
      onClose={onClose}
      size="lg"
      title={`Devolución — ${venta?.numero_venta ?? ''}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={confirmar} disabled={!puede || devolver.isPending}>{devolver.isPending ? 'Procesando…' : 'Registrar devolución'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="overflow-hidden rounded-md border border-line">
          <table className="w-full text-sm">
            <thead className="bg-surface-sunken text-left text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-3 py-2 font-medium">Producto</th>
                <th className="w-24 px-3 py-2 text-right font-medium">Vendido</th>
                <th className="w-28 px-3 py-2 text-right font-medium">A devolver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(venta?.detalles ?? []).map((d) => (
                <tr key={d.id_detalle}>
                  <td className="px-3 py-2">{d.producto?.nombre || `#${d.id_producto}`}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{d.cantidad}</td>
                  <td className="px-3 py-2">
                    <input type="number" min="0" max={d.cantidad}
                      className="h-9 w-full rounded-md border border-line bg-surface px-2 text-right text-sm"
                      value={cantidades[d.id_detalle] ?? ''} onChange={(e) => setCant(d.id_detalle, e.target.value)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Input id="motivo" label="Motivo" placeholder="Ej. producto dañado" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        <p className="text-xs text-ink-soft leading-relaxed">
          Se repone el stock de los lotes y se genera el asiento de reversa (Devoluciones sobre Ventas / IVA / Caja o Bancos).
        </p>
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </div>
    </Modal>
  );
}

export function Ventas() {
  const { data: ventas, isLoading, isError } = useVentas();
  const [devolviendo, setDevolviendo] = useState(null);

  return (
    <div>
      <PageHeader
        title="Ventas"
        description="Historial de ventas y registro de devoluciones (RF-VEN-03)."
      />

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-ink-muted"><Spinner /> Cargando ventas…</div>
      )}
      {isError && <p className="text-sm text-red-600">No se pudieron cargar las ventas.</p>}
      {ventas && ventas.length === 0 && (
        <EmptyState title="Sin ventas registradas" description="Registra ventas desde el Punto de venta." />
      )}
      {ventas && ventas.length > 0 && (
        <Card>
          <table className="w-full">
            <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-medium">Número</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Cajero</th>
                <th className="px-4 py-3 font-medium">Pago</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {ventas.map((v) => (
                <tr key={v.id_venta} className="border-b border-line last:border-0 hover:bg-surface-muted">
                  <td className="px-4 py-3 font-mono text-xs text-ink-muted">{v.numero_venta}</td>
                  <td className="px-4 py-3 text-sm">{formatFecha(v.fecha)}</td>
                  <td className="px-4 py-3 text-sm">{v.cajero ? `${v.cajero.nombre} ${v.cajero.apellido}` : '—'}</td>
                  <td className="px-4 py-3"><Badge tone="neutral">{v.metodo_pago}</Badge></td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums">{formatBs(v.monto_total)}</td>
                  <td className="px-4 py-3"><Badge tone={estadoTono[v.estado]}>{v.estado}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    {v.estado !== 'ANULADA' && (
                      <Button size="sm" variant="secondary" onClick={() => setDevolviendo(v)}>Devolver</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <DevolucionModal venta={devolviendo} onClose={() => setDevolviendo(null)} />
    </div>
  );
}
