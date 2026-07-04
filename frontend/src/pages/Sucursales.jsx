import { useState } from 'react';
import {
  useSucursales,
  useCrearSucursal,
  useActualizarSucursal,
  useCambiarEstadoSucursal,
} from '../queries/useSucursales.js';
import { PageHeader, Card, Button, Input, Select, Modal, Badge, Spinner, EmptyState } from '../components/ui';

const ESTADOS = ['ACTIVA', 'INACTIVA', 'EN_MANTENIMIENTO'];
const vacio = { nombre: '', ciudad: '', direccion: '', telefono: '', estado: 'ACTIVA' };

function badgeTone(estado) {
  if (estado === 'ACTIVA') return 'success';
  if (estado === 'INACTIVA') return 'danger';
  return 'warning';
}

function SucursalModal({ open, onClose, sucursal }) {
  const crear = useCrearSucursal();
  const actualizar = useActualizarSucursal();
  const editando = Boolean(sucursal);
  const [form, setForm] = useState(vacio);
  const [error, setError] = useState(null);

  const [prev, setPrev] = useState(null);
  if (open && sucursal !== prev) {
    setPrev(sucursal);
    setForm(sucursal ? { ...vacio, ...sucursal } : vacio);
    setError(null);
  }

  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const submit = async () => {
    setError(null);
    const payload = {
      nombre: form.nombre.trim(),
      ciudad: form.ciudad.trim(),
      direccion: form.direccion.trim(),
      telefono: form.telefono?.trim() || undefined,
    };
    try {
      if (editando) await actualizar.mutateAsync({ id: sucursal.id_sucursal, ...payload });
      else await crear.mutateAsync({ ...payload, estado: form.estado });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar');
    }
  };

  const pending = crear.isPending || actualizar.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editando ? 'Editar sucursal' : 'Nueva sucursal'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={pending || !form.nombre || !form.ciudad || !form.direccion}>
            {pending ? 'Guardando...' : 'Guardar'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input id="nombre" label="Nombre" value={form.nombre} onChange={set('nombre')} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input id="ciudad" label="Ciudad" value={form.ciudad} onChange={set('ciudad')} />
          <Input id="telefono" label="Telefono" value={form.telefono} onChange={set('telefono')} />
        </div>
        <Input id="direccion" label="Direccion" value={form.direccion} onChange={set('direccion')} />
        {!editando && (
          <Select id="estado" label="Estado" value={form.estado} onChange={set('estado')}>
            {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
          </Select>
        )}
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </div>
    </Modal>
  );
}

export function Sucursales() {
  const { data: sucursales, isLoading, isError } = useSucursales();
  const cambiarEstado = useCambiarEstadoSucursal();
  const [modal, setModal] = useState({ open: false, sucursal: null });

  if (isLoading) return <Spinner className="mx-auto mt-20" />;
  if (isError) return <EmptyState title="Error al cargar sucursales" />;

  return (
    <div>
      <PageHeader
        title="Sucursales"
        description="Administracion de sucursales de MarketSuper"
        actions={<Button onClick={() => setModal({ open: true, sucursal: null })}>Nueva sucursal</Button>}
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-xs font-medium uppercase text-gray-500">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Ciudad</th>
                <th className="px-4 py-3">Direccion</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(sucursales || []).map((s) => (
                <tr key={s.id_sucursal} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{s.id_sucursal}</td>
                  <td className="px-4 py-3 font-medium">{s.nombre}</td>
                  <td className="px-4 py-3">{s.ciudad}</td>
                  <td className="px-4 py-3">{s.direccion}</td>
                  <td className="px-4 py-3"><Badge tone={badgeTone(s.estado)}>{s.estado}</Badge></td>
                  <td className="px-4 py-3 space-x-2">
                    <Button size="sm" variant="ghost" onClick={() => setModal({ open: true, sucursal: s })}>
                      Editar
                    </Button>
                    {s.estado === 'ACTIVA' ? (
                      <Button size="sm" variant="danger" onClick={() => cambiarEstado.mutate({ id: s.id_sucursal, estado: 'INACTIVA' })}>
                        Inactivar
                      </Button>
                    ) : (
                      <Button size="sm" variant="secondary" onClick={() => cambiarEstado.mutate({ id: s.id_sucursal, estado: 'ACTIVA' })}>
                        Activar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <SucursalModal
        open={modal.open}
        onClose={() => setModal({ open: false, sucursal: null })}
        sucursal={modal.sucursal}
      />
    </div>
  );
}
