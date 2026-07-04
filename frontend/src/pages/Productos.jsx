import { useState } from 'react';
import {
  useProductos,
  useCategorias,
  useCrearProducto,
  useActualizarProducto,
  useEliminarProducto,
  useCrearCategoria,
} from '../queries/useProductos.js';
import { PageHeader, Card, Button, Input, Select, Modal, Badge, Spinner, EmptyState } from '../components/ui';
import { formatBs } from '../lib/format.js';

const vacio = {
  id_categoria: '', codigo_barras: '', nombre: '', unidad_medida: 'UND',
  precio_compra: '', precio_venta: '', stock_minimo: '5',
};

function ProductoModal({ open, onClose, producto }) {
  const { data: categorias = [] } = useCategorias();
  const crear = useCrearProducto();
  const actualizar = useActualizarProducto();
  const crearCategoria = useCrearCategoria();
  const editando = Boolean(producto);
  const [form, setForm] = useState(vacio);
  const [nuevaCat, setNuevaCat] = useState('');
  const [error, setError] = useState(null);

  const [prev, setPrev] = useState(null);
  if (open && producto !== prev) {
    setPrev(producto);
    setForm(producto ? { ...vacio, ...producto, id_categoria: String(producto.id_categoria) } : vacio);
    setError(null);
  }

  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const agregarCategoria = async () => {
    if (!nuevaCat.trim()) return;
    try {
      const cat = await crearCategoria.mutateAsync({ nombre: nuevaCat.trim() });
      setForm({ ...form, id_categoria: String(cat.id_categoria) });
      setNuevaCat('');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear la categoría');
    }
  };

  const submit = async () => {
    setError(null);
    const payload = {
      id_categoria: Number(form.id_categoria),
      codigo_barras: form.codigo_barras.trim(),
      nombre: form.nombre.trim(),
      unidad_medida: form.unidad_medida.trim() || 'UND',
      precio_compra: Number(form.precio_compra || 0),
      precio_venta: Number(form.precio_venta || 0),
      stock_minimo: Number(form.stock_minimo || 0),
    };
    try {
      if (editando) await actualizar.mutateAsync({ id: producto.id_producto, payload });
      else await crear.mutateAsync(payload);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar el producto');
    }
  };

  const pending = crear.isPending || actualizar.isPending;
  const puedeGuardar = form.id_categoria && form.codigo_barras && form.nombre && form.precio_venta;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editando ? 'Editar producto' : 'Nuevo producto'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={pending || !puedeGuardar}>{pending ? 'Guardando…' : 'Guardar'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Select id="categoria" label="Categoría" value={form.id_categoria} onChange={set('id_categoria')}>
          <option value="">— Seleccionar —</option>
          {categorias.map((c) => (
            <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
          ))}
        </Select>
        <div className="flex items-end gap-2">
          <Input id="nuevaCat" label="Nueva categoría (opcional)" value={nuevaCat} onChange={(e) => setNuevaCat(e.target.value)} />
          <Button variant="secondary" onClick={agregarCategoria} disabled={!nuevaCat.trim() || crearCategoria.isPending}>Añadir</Button>
        </div>
        <Input id="codigo_barras" label="Código de barras" value={form.codigo_barras} onChange={set('codigo_barras')} />
        <Input id="nombre" label="Nombre" value={form.nombre} onChange={set('nombre')} />
        <div className="grid grid-cols-2 gap-4">
          <Input id="unidad_medida" label="Unidad" value={form.unidad_medida} onChange={set('unidad_medida')} />
          <Input id="stock_minimo" label="Stock mínimo" type="number" min="0" value={form.stock_minimo} onChange={set('stock_minimo')} />
          <Input id="precio_compra" label="Precio compra (Bs)" type="number" min="0" step="0.01" value={form.precio_compra} onChange={set('precio_compra')} />
          <Input id="precio_venta" label="Precio venta (Bs)" type="number" min="0" step="0.01" value={form.precio_venta} onChange={set('precio_venta')} />
        </div>
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </div>
    </Modal>
  );
}

export function Productos() {
  const { data: productos, isLoading, isError } = useProductos();
  const eliminar = useEliminarProducto();
  const [open, setOpen] = useState(false);
  const [editar, setEditar] = useState(null);

  const abrirNuevo = () => { setEditar(null); setOpen(true); };
  const abrirEditar = (p) => { setEditar(p); setOpen(true); };

  return (
    <div>
      <PageHeader
        title="Productos"
        description="Catálogo de productos con categoría, precios y stock mínimo (RF-INV-01)."
        actions={<Button onClick={abrirNuevo}>Nuevo producto</Button>}
      />

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-ink-muted"><Spinner /> Cargando productos…</div>
      )}
      {isError && <p className="text-sm text-red-600">No se pudieron cargar los productos.</p>}
      {productos && productos.length === 0 && (
        <EmptyState title="Sin productos" description="Registra el primer producto." action={<Button onClick={abrirNuevo}>Nuevo producto</Button>} />
      )}
      {productos && productos.length > 0 && (
        <Card>
          <table className="w-full">
            <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Categoría</th>
                <th className="px-4 py-3 text-right font-medium">Compra</th>
                <th className="px-4 py-3 text-right font-medium">Venta</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr key={p.id_producto} className="border-b border-line last:border-0 hover:bg-surface-muted">
                  <td className="px-4 py-3 text-sm font-medium text-ink">{p.nombre}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-muted">{p.codigo_barras}</td>
                  <td className="px-4 py-3 text-sm">{p.categoria?.nombre || '—'}</td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums">{formatBs(p.precio_compra)}</td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums">{formatBs(p.precio_venta)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={p.activo ? 'success' : 'danger'}>{p.activo ? 'ACTIVO' : 'INACTIVO'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Button size="sm" variant="secondary" onClick={() => abrirEditar(p)}>Editar</Button>
                    {p.activo && (
                      <Button size="sm" variant="ghost" onClick={() => eliminar.mutate(p.id_producto)} disabled={eliminar.isPending}>
                        Dar de baja
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <ProductoModal open={open} onClose={() => setOpen(false)} producto={editar} />
    </div>
  );
}
