import { useState } from 'react';
import {
  useOrdenesCompra,
  useCrearOrden,
  useEnviarOrden,
  useRecibirOrden,
  useCancelarOrden,
} from '../queries/useOrdenesCompra.js';
import { useProveedores } from '../queries/useProveedores.js';
import { useProductos } from '../queries/useProductos.js';
import { PageHeader, Card, Button, Input, Select, Modal, Badge, Spinner, EmptyState } from '../components/ui';
import { formatBs, formatFecha } from '../lib/format.js';

const estadoTono = { BORRADOR: 'warning', ENVIADA: 'accent', RECIBIDA: 'success', CANCELADA: 'danger' };
const hoy = () => new Date().toISOString().slice(0, 10);
const lineaVacia = () => ({ id_producto: '', cantidad: '1', precio_unitario: '' });

function NuevaOrdenModal({ open, onClose }) {
  const { data: proveedores = [] } = useProveedores({ activo: true });
  const { data: productos = [] } = useProductos({ activo: true });
  const crear = useCrearOrden();

  const [idProveedor, setIdProveedor] = useState('');
  const [condicion, setCondicion] = useState('CREDITO');
  const [fecha, setFecha] = useState(hoy());
  const [lineas, setLineas] = useState([lineaVacia()]);
  const [error, setError] = useState(null);

  const total = lineas.reduce((a, l) => a + Number(l.cantidad || 0) * Number(l.precio_unitario || 0), 0);
  const puedeGuardar = idProveedor && lineas.every((l) => l.id_producto && Number(l.cantidad) > 0 && Number(l.precio_unitario) > 0);

  const setLinea = (i, campo, valor) =>
    setLineas((prev) => prev.map((l, idx) => (idx === i ? { ...l, [campo]: valor } : l)));

  // Al elegir producto, prefilla el precio con el precio de compra del catálogo.
  const elegirProducto = (i, id) => {
    const prod = productos.find((p) => String(p.id_producto) === id);
    setLineas((prev) =>
      prev.map((l, idx) => (idx === i ? { ...l, id_producto: id, precio_unitario: prod ? String(prod.precio_compra) : l.precio_unitario } : l)),
    );
  };

  const reset = () => {
    setIdProveedor(''); setCondicion('CREDITO'); setFecha(hoy()); setLineas([lineaVacia()]); setError(null);
  };

  const guardar = async () => {
    setError(null);
    const payload = {
      id_proveedor: Number(idProveedor),
      condicion_pago: condicion,
      fecha_emision: fecha,
      lineas: lineas.map((l) => ({
        id_producto: Number(l.id_producto),
        cantidad: Number(l.cantidad),
        precio_unitario: Number(l.precio_unitario),
      })),
    };
    try {
      await crear.mutateAsync(payload);
      reset();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear la orden');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title="Nueva orden de compra"
      footer={
        <>
          <span className="mr-auto text-sm font-medium">Total: {formatBs(total)}</span>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={guardar} disabled={!puedeGuardar || crear.isPending}>{crear.isPending ? 'Guardando…' : 'Guardar borrador'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Select id="proveedor" label="Proveedor" value={idProveedor} onChange={(e) => setIdProveedor(e.target.value)}>
            <option value="">— Seleccionar —</option>
            {proveedores.map((p) => (
              <option key={p.id_proveedor} value={p.id_proveedor}>{p.razon_social}</option>
            ))}
          </Select>
          <Select id="condicion" label="Condición de pago" value={condicion} onChange={(e) => setCondicion(e.target.value)}>
            <option value="CREDITO">Crédito (genera cuenta por pagar)</option>
            <option value="CONTADO">Contado (paga de Caja)</option>
          </Select>
          <Input id="fecha" label="Fecha de emisión" type="date" value={fecha} max={hoy()} onChange={(e) => setFecha(e.target.value)} />
        </div>

        <div className="overflow-hidden rounded-md border border-line">
          <table className="w-full text-sm">
            <thead className="bg-surface-sunken text-left text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-3 py-2 font-medium">Producto</th>
                <th className="w-24 px-3 py-2 text-right font-medium">Cantidad</th>
                <th className="w-32 px-3 py-2 text-right font-medium">Precio unit.</th>
                <th className="w-32 px-3 py-2 text-right font-medium">Subtotal</th>
                <th className="w-10 px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {lineas.map((l, i) => (
                <tr key={i}>
                  <td className="px-2 py-1.5">
                    <select
                      className="h-9 w-full rounded-md border border-line bg-surface px-2 text-sm"
                      value={l.id_producto}
                      onChange={(e) => elegirProducto(i, e.target.value)}
                    >
                      <option value="">— Seleccionar —</option>
                      {productos.map((p) => (
                        <option key={p.id_producto} value={p.id_producto}>{p.nombre}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1.5">
                    <input type="number" min="1" className="h-9 w-full rounded-md border border-line bg-surface px-2 text-right text-sm"
                      value={l.cantidad} onChange={(e) => setLinea(i, 'cantidad', e.target.value)} />
                  </td>
                  <td className="px-2 py-1.5">
                    <input type="number" min="0" step="0.01" className="h-9 w-full rounded-md border border-line bg-surface px-2 text-right text-sm"
                      value={l.precio_unitario} onChange={(e) => setLinea(i, 'precio_unitario', e.target.value)} />
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums">
                    {formatBs(Number(l.cantidad || 0) * Number(l.precio_unitario || 0))}
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <button type="button" className="text-ink-soft hover:text-red-600 disabled:opacity-30"
                      onClick={() => setLineas((prev) => prev.filter((_, idx) => idx !== i))} disabled={lineas.length <= 1} aria-label="Quitar línea">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="px-3 py-2" colSpan={5}>
                  <button type="button" className="text-sm text-accent-600 hover:text-accent-700" onClick={() => setLineas((prev) => [...prev, lineaVacia()])}>
                    + Agregar línea
                  </button>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </div>
    </Modal>
  );
}

function RecibirModal({ orden, onClose }) {
  const recibir = useRecibirOrden();
  const [fecha, setFecha] = useState(hoy());
  const [error, setError] = useState(null);

  const confirmar = async () => {
    setError(null);
    try {
      await recibir.mutateAsync({ id: orden.id_orden, payload: { fecha_recepcion: fecha } });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo recibir la orden');
    }
  };

  return (
    <Modal
      open={Boolean(orden)}
      onClose={onClose}
      title={`Recibir ${orden?.numero_orden ?? ''}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={confirmar} disabled={recibir.isPending}>{recibir.isPending ? 'Procesando…' : 'Confirmar recepción'}</Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-ink-muted leading-relaxed">
          Al confirmar, se crean los lotes de inventario, se genera el asiento contable
          {orden?.condicion_pago === 'CREDITO' ? ' y la cuenta por pagar' : ' (pago de contado)'} de forma automática.
        </p>
        <Input id="fecha_recepcion" label="Fecha de recepción" type="date" value={fecha} max={hoy()} onChange={(e) => setFecha(e.target.value)} />
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </div>
    </Modal>
  );
}

export function OrdenesCompra() {
  const { data: ordenes, isLoading, isError } = useOrdenesCompra();
  const enviar = useEnviarOrden();
  const cancelar = useCancelarOrden();
  const [open, setOpen] = useState(false);
  const [recibiendo, setRecibiendo] = useState(null);

  return (
    <div>
      <PageHeader
        title="Órdenes de compra"
        description="Ciclo Borrador → Enviada → Recibida. La recepción genera inventario y contabilidad (RF-COM-02/03)."
        actions={<Button onClick={() => setOpen(true)}>Nueva orden</Button>}
      />

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-ink-muted"><Spinner /> Cargando órdenes…</div>
      )}
      {isError && <p className="text-sm text-red-600">No se pudieron cargar las órdenes.</p>}
      {ordenes && ordenes.length === 0 && (
        <EmptyState title="Sin órdenes de compra" description="Crea la primera orden de compra." action={<Button onClick={() => setOpen(true)}>Nueva orden</Button>} />
      )}
      {ordenes && ordenes.length > 0 && (
        <Card>
          <table className="w-full">
            <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-medium">Número</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Proveedor</th>
                <th className="px-4 py-3 font-medium">Pago</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {ordenes.map((o) => (
                <tr key={o.id_orden} className="border-b border-line last:border-0 hover:bg-surface-muted">
                  <td className="px-4 py-3 font-mono text-xs text-ink-muted">{o.numero_orden}</td>
                  <td className="px-4 py-3 text-sm">{formatFecha(o.fecha_emision)}</td>
                  <td className="px-4 py-3 text-sm">{o.proveedor?.razon_social || '—'}</td>
                  <td className="px-4 py-3"><Badge tone="neutral">{o.condicion_pago}</Badge></td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums">{formatBs(o.monto_total)}</td>
                  <td className="px-4 py-3"><Badge tone={estadoTono[o.estado]}>{o.estado}</Badge></td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {o.estado === 'BORRADOR' && (
                      <Button size="sm" variant="secondary" onClick={() => enviar.mutate(o.id_orden)} disabled={enviar.isPending}>Enviar</Button>
                    )}
                    {o.estado === 'ENVIADA' && (
                      <Button size="sm" onClick={() => setRecibiendo(o)}>Recibir</Button>
                    )}
                    {['BORRADOR', 'ENVIADA'].includes(o.estado) && (
                      <Button size="sm" variant="ghost" onClick={() => cancelar.mutate(o.id_orden)} disabled={cancelar.isPending}>Cancelar</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <NuevaOrdenModal open={open} onClose={() => setOpen(false)} />
      <RecibirModal orden={recibiendo} onClose={() => setRecibiendo(null)} />
    </div>
  );
}
