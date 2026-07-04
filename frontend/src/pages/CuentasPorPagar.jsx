import { useState } from 'react';
import { useCuentasPorPagar, useRegistrarPago } from '../queries/useCuentasPorPagar.js';
import { PageHeader, Card, Button, Input, Select, Modal, Badge, Spinner, EmptyState } from '../components/ui';
import { formatBs, formatFecha } from '../lib/format.js';

const estadoTono = { PENDIENTE: 'warning', PARCIAL: 'accent', PAGADA: 'success' };
const hoy = () => new Date().toISOString().slice(0, 10);

function PagoModal({ cxp, onClose }) {
  const registrar = useRegistrarPago();
  const [monto, setMonto] = useState('');
  const [metodo, setMetodo] = useState('EFECTIVO');
  const [fecha, setFecha] = useState(hoy());
  const [error, setError] = useState(null);

  const [prev, setPrev] = useState(null);
  if (cxp && cxp !== prev) {
    setPrev(cxp);
    setMonto(String(cxp.saldo_pendiente));
    setMetodo('EFECTIVO');
    setFecha(hoy());
    setError(null);
  }

  const saldo = Number(cxp?.saldo_pendiente || 0);
  const puede = Number(monto) > 0 && Number(monto) <= saldo;

  const confirmar = async () => {
    setError(null);
    try {
      await registrar.mutateAsync({
        id: cxp.id_cxp,
        payload: { monto: Number(monto), metodo_pago: metodo, fecha_pago: fecha },
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar el pago');
    }
  };

  return (
    <Modal
      open={Boolean(cxp)}
      onClose={onClose}
      title="Registrar pago"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={confirmar} disabled={!puede || registrar.isPending}>{registrar.isPending ? 'Procesando…' : 'Registrar pago'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-md bg-surface-sunken/40 px-3 py-2 text-sm">
          <div className="flex justify-between"><span className="text-ink-muted">Proveedor</span><span className="font-medium">{cxp?.proveedor?.razon_social}</span></div>
          <div className="flex justify-between"><span className="text-ink-muted">Saldo pendiente</span><span className="font-semibold">{formatBs(saldo)}</span></div>
        </div>
        <Input id="monto" label="Monto a pagar (Bs)" type="number" min="0.01" step="0.01" max={saldo} value={monto} onChange={(e) => setMonto(e.target.value)} />
        <Select id="metodo" label="Método de pago" value={metodo} onChange={(e) => setMetodo(e.target.value)}>
          {['EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', 'TARJETA'].map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </Select>
        <Input id="fecha_pago" label="Fecha de pago" type="date" value={fecha} max={hoy()} onChange={(e) => setFecha(e.target.value)} />
        <p className="text-xs text-ink-soft leading-relaxed">
          El pago genera automáticamente su asiento contable (Cuentas por Pagar / Caja), reflejado en Libro Diario, Mayor y Balance.
        </p>
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </div>
    </Modal>
  );
}

export function CuentasPorPagar() {
  const { data: cuentas, isLoading, isError } = useCuentasPorPagar();
  const [pagando, setPagando] = useState(null);

  return (
    <div>
      <PageHeader
        title="Cuentas por pagar"
        description="Deudas con proveedores y pagos parciales/totales reflejados en la contabilidad (RF-COM-04)."
      />

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-ink-muted"><Spinner /> Cargando cuentas por pagar…</div>
      )}
      {isError && <p className="text-sm text-red-600">No se pudieron cargar las cuentas por pagar.</p>}
      {cuentas && cuentas.length === 0 && (
        <EmptyState title="Sin cuentas por pagar" description="Las órdenes de compra a crédito generan cuentas por pagar al recibirse." />
      )}
      {cuentas && cuentas.length > 0 && (
        <Card>
          <table className="w-full">
            <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-medium">Proveedor</th>
                <th className="px-4 py-3 font-medium">Orden</th>
                <th className="px-4 py-3 font-medium">Emisión</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-right font-medium">Saldo</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {cuentas.map((c) => (
                <tr key={c.id_cxp} className="border-b border-line last:border-0 hover:bg-surface-muted">
                  <td className="px-4 py-3 text-sm font-medium text-ink">{c.proveedor?.razon_social || '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-muted">{c.orden?.numero_orden || '—'}</td>
                  <td className="px-4 py-3 text-sm">{formatFecha(c.fecha_emision)}</td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums">{formatBs(c.monto_total)}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums">{formatBs(c.saldo_pendiente)}</td>
                  <td className="px-4 py-3"><Badge tone={estadoTono[c.estado]}>{c.estado}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    {c.estado !== 'PAGADA' && (
                      <Button size="sm" onClick={() => setPagando(c)}>Registrar pago</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <PagoModal cxp={pagando} onClose={() => setPagando(null)} />
    </div>
  );
}
