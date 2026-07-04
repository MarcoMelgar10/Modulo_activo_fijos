import { useState } from 'react';
import {
  useDispositivosBiometricos,
  useCrearDispositivoBiometrico,
  useCambiarEstadoDispositivo,
} from '../queries/useDispositivosBiometricos.js';
import { useSucursales } from '../queries/useSucursales.js';
import { PageHeader, Card, Button, Input, Select, Modal, Badge, Spinner, EmptyState } from '../components/ui';

const vacio = { dispositivo_id: '', id_sucursal: '', nombre: '', ubicacion: '', secret: '' };

function DispositivoModal({ open, onClose }) {
  const { data: sucursales = [] } = useSucursales();
  const crear = useCrearDispositivoBiometrico();
  const [form, setForm] = useState(vacio);
  const [error, setError] = useState(null);

  if (open && form.dispositivo_id === '' && !form._init) {
    setForm({ ...vacio, _init: true });
    setError(null);
  }

  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const submit = async () => {
    setError(null);
    try {
      await crear.mutateAsync({
        dispositivo_id: form.dispositivo_id.trim(),
        id_sucursal: Number(form.id_sucursal),
        nombre: form.nombre.trim(),
        ubicacion: form.ubicacion?.trim() || undefined,
        secret: form.secret,
      });
      setForm(vacio);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo dispositivo biometrico"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={crear.isPending || !form.dispositivo_id || !form.id_sucursal || !form.nombre || !form.secret}>
            {crear.isPending ? 'Creando...' : 'Crear'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input id="did" label="ID Dispositivo" placeholder="BIO-SC-001" value={form.dispositivo_id} onChange={set('dispositivo_id')} />
        <Select id="sucursal" label="Sucursal" value={form.id_sucursal} onChange={set('id_sucursal')}>
          <option value="">Seleccionar</option>
          {sucursales.map((s) => <option key={s.id_sucursal} value={s.id_sucursal}>{s.nombre}</option>)}
        </Select>
        <Input id="nombre" label="Nombre" value={form.nombre} onChange={set('nombre')} />
        <Input id="ubicacion" label="Ubicacion" value={form.ubicacion} onChange={set('ubicacion')} />
        <Input id="secret" label="Secret" type="password" value={form.secret} onChange={set('secret')} />
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </div>
    </Modal>
  );
}

export function DispositivosBiometricos() {
  const { data: dispositivos = [], isLoading } = useDispositivosBiometricos();
  const cambiarEstado = useCambiarEstadoDispositivo();
  const [modal, setModal] = useState(false);

  if (isLoading) return <Spinner className="mx-auto mt-20" />;

  return (
    <div>
      <PageHeader
        title="Dispositivos biometricos"
        description="Gestion de dispositivos de control de acceso a bodegas"
        actions={<Button onClick={() => setModal(true)}>Nuevo dispositivo</Button>}
      />

      {dispositivos.length === 0 ? (
        <EmptyState title="Sin dispositivos" description="No hay dispositivos registrados." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs font-medium uppercase text-gray-500">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Sucursal</th>
                  <th className="px-4 py-3">Ubicacion</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {dispositivos.map((d) => (
                  <tr key={d.dispositivo_id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{d.dispositivo_id}</td>
                    <td className="px-4 py-3 font-medium">{d.nombre}</td>
                    <td className="px-4 py-3">{d.sucursal?.nombre}</td>
                    <td className="px-4 py-3 text-xs">{d.ubicacion || '-'}</td>
                    <td className="px-4 py-3">
                      <Badge tone={d.activo ? 'success' : 'danger'}>{d.activo ? 'Activo' : 'Inactivo'}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {d.activo ? (
                        <Button size="sm" variant="danger" onClick={() => cambiarEstado.mutate({ id: d.dispositivo_id, activo: false })}>Desactivar</Button>
                      ) : (
                        <Button size="sm" variant="secondary" onClick={() => cambiarEstado.mutate({ id: d.dispositivo_id, activo: true })}>Activar</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <DispositivoModal open={modal} onClose={() => setModal(false)} />
    </div>
  );
}
