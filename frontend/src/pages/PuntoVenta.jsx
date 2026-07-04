import { useState } from 'react';
import { useProductos } from '../queries/useProductos.js';
import { useCrearVenta } from '../queries/useVentas.js';
import { PageHeader, Card, CardBody, CardTitle, Button, Input, Select, Badge, EmptyState } from '../components/ui';
import { formatBs } from '../lib/format.js';

const METODOS = ['EFECTIVO', 'TARJETA_DEBITO', 'TARJETA_CREDITO', 'QR'];

export function PuntoVenta() {
  const { data: productos = [] } = useProductos({ activo: true });
  const crear = useCrearVenta();

  const [carrito, setCarrito] = useState([]);
  const [prodSel, setProdSel] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [metodo, setMetodo] = useState('EFECTIVO');
  const [descuento, setDescuento] = useState('');
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);

  const subtotal = carrito.reduce((a, l) => a + l.cantidad * l.precio_unitario, 0);
  const total = Math.max(0, subtotal - Number(descuento || 0));

  const agregar = () => {
    setError(null);
    const prod = productos.find((p) => String(p.id_producto) === prodSel);
    if (!prod || Number(cantidad) <= 0) return;
    setCarrito((prev) => {
      const existe = prev.find((l) => l.id_producto === prod.id_producto);
      if (existe) {
        return prev.map((l) =>
          l.id_producto === prod.id_producto ? { ...l, cantidad: l.cantidad + Number(cantidad) } : l,
        );
      }
      return [...prev, { id_producto: prod.id_producto, nombre: prod.nombre, cantidad: Number(cantidad), precio_unitario: Number(prod.precio_venta) }];
    });
    setProdSel('');
    setCantidad('1');
  };

  const quitar = (id) => setCarrito((prev) => prev.filter((l) => l.id_producto !== id));

  const registrar = async () => {
    setError(null);
    setExito(null);
    try {
      const venta = await crear.mutateAsync({
        id_sucursal: 1,
        metodo_pago: metodo,
        descuento: Number(descuento || 0),
        lineas: carrito.map((l) => ({ id_producto: l.id_producto, cantidad: l.cantidad, precio_unitario: l.precio_unitario })),
      });
      setExito(venta);
      setCarrito([]);
      setDescuento('');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar la venta');
    }
  };

  return (
    <div>
      <PageHeader
        title="Punto de venta"
        description="Registro de ventas: descuenta stock por FEFO y genera el asiento contable (RF-VEN-01/02)."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Selección de productos */}
        <Card className="lg:col-span-2">
          <CardBody className="space-y-4">
            <CardTitle className="text-base">Productos</CardTitle>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Select id="prod" label="Producto" value={prodSel} onChange={(e) => setProdSel(e.target.value)}>
                  <option value="">— Seleccionar —</option>
                  {productos.map((p) => (
                    <option key={p.id_producto} value={p.id_producto}>{p.nombre} · {formatBs(p.precio_venta)}</option>
                  ))}
                </Select>
              </div>
              <div className="w-24">
                <Input id="cant" label="Cantidad" type="number" min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
              </div>
              <Button onClick={agregar} disabled={!prodSel}>Agregar</Button>
            </div>

            {carrito.length === 0 ? (
              <EmptyState title="Carrito vacío" description="Agrega productos para registrar la venta." />
            ) : (
              <div className="overflow-hidden rounded-md border border-line">
                <table className="w-full text-sm">
                  <thead className="bg-surface-sunken text-left text-xs uppercase tracking-wide text-ink-soft">
                    <tr>
                      <th className="px-3 py-2 font-medium">Producto</th>
                      <th className="w-20 px-3 py-2 text-right font-medium">Cant.</th>
                      <th className="w-28 px-3 py-2 text-right font-medium">Precio</th>
                      <th className="w-28 px-3 py-2 text-right font-medium">Subtotal</th>
                      <th className="w-10 px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {carrito.map((l) => (
                      <tr key={l.id_producto}>
                        <td className="px-3 py-2">{l.nombre}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{l.cantidad}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatBs(l.precio_unitario)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatBs(l.cantidad * l.precio_unitario)}</td>
                        <td className="px-3 py-2 text-center">
                          <button type="button" className="text-ink-soft hover:text-red-600" onClick={() => quitar(l.id_producto)} aria-label="Quitar">✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Cobro */}
        <Card>
          <CardBody className="space-y-4">
            <CardTitle className="text-base">Cobro</CardTitle>
            <Select id="metodo" label="Método de pago" value={metodo} onChange={(e) => setMetodo(e.target.value)}>
              {METODOS.map((m) => (<option key={m} value={m}>{m.replace('_', ' ')}</option>))}
            </Select>
            <Input id="descuento" label="Descuento (Bs)" type="number" min="0" step="0.01" value={descuento} onChange={(e) => setDescuento(e.target.value)} />

            <div className="space-y-1 border-t border-line pt-3 text-sm">
              <div className="flex justify-between"><span className="text-ink-muted">Subtotal</span><span className="tabular-nums">{formatBs(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-ink-muted">Descuento</span><span className="tabular-nums">− {formatBs(Number(descuento || 0))}</span></div>
              <div className="flex justify-between text-base font-semibold"><span>Total</span><span className="tabular-nums">{formatBs(total)}</span></div>
            </div>

            <Button className="w-full" onClick={registrar} disabled={carrito.length === 0 || crear.isPending}>
              {crear.isPending ? 'Registrando…' : 'Registrar venta'}
            </Button>

            {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            {exito && (
              <div className="rounded-md border border-emerald-100 bg-emerald-50/40 px-3 py-2 text-sm">
                <div className="flex items-center gap-2"><Badge tone="success">Registrada</Badge><span className="font-mono">{exito.numero_venta}</span></div>
                <p className="mt-1 text-xs text-ink-muted">Total {formatBs(exito.monto_total)} · asiento generado automáticamente.</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
