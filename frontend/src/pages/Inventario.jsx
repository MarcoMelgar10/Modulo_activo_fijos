import { useState } from 'react';
import { useInventarioStock } from '../queries/useInventario.js';
import { useSucursales } from '../queries/useSucursales.js';
import { useAuth } from '../store/AuthContext.jsx';
import { PageHeader, Card, Button, Select, Badge, Spinner, EmptyState } from '../components/ui';

export function Inventario() {
  const { user } = useAuth();
  const { data: sucursales = [] } = useSucursales();
  const esGerente = user?.rol?.nombre === 'GERENTE';
  const [sucursalFiltro, setSucursalFiltro] = useState('');

  const params = esGerente && sucursalFiltro ? { id_sucursal: Number(sucursalFiltro) } : {};
  const { data: stock = [], isLoading } = useInventarioStock(params);

  if (isLoading) return <Spinner className="mx-auto mt-20" />;

  return (
    <div>
      <PageHeader
        title="Inventario por sucursal"
        description="Stock agregado por producto y sucursal"
      />

      {esGerente && (
        <div className="mb-4 max-w-xs">
          <Select id="sucursal" label="Filtrar por sucursal" value={sucursalFiltro} onChange={(e) => setSucursalFiltro(e.target.value)}>
            <option value="">Todas las sucursales</option>
            {sucursales.map((s) => <option key={s.id_sucursal} value={s.id_sucursal}>{s.nombre}</option>)}
          </Select>
        </div>
      )}

      {stock.length === 0 ? (
        <EmptyState title="Sin stock" description="No hay productos con stock disponible." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs font-medium uppercase text-gray-500">
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Codigo</th>
                  <th className="px-4 py-3">Sucursal</th>
                  <th className="px-4 py-3 text-right">Stock</th>
                  <th className="px-4 py-3 text-right">Minimo</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {stock.map((r, i) => (
                  <tr key={`${r.id_producto}-${r.id_sucursal}`} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{r.producto}</td>
                    <td className="px-4 py-3 font-mono text-xs">{r.codigo_barras}</td>
                    <td className="px-4 py-3">{r.sucursal}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.cantidad_total}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.stock_minimo}</td>
                    <td className="px-4 py-3">
                      <Badge tone={r.estado_stock === 'BAJO' ? 'danger' : 'success'}>
                        {r.estado_stock === 'BAJO' ? 'Bajo' : 'OK'}
                      </Badge>
                    </td>
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
