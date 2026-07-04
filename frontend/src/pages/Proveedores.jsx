import { useState } from 'react';
import {
  useProveedores,
  useCrearProveedor,
  useActualizarProveedor,
  useEliminarProveedor,
} from '../queries/useProveedores.js';
import { PageHeader, Card, Button, Input, Modal, Badge, Spinner, EmptyState } from '../components/ui';

const vacio = { razon_social: '', nit: '', contacto: '', telefono: '', email: '', ciudad: '' };

function ProveedorModal({ open, onClose, proveedor }) {
  const crear = useCrearProveedor();
  const actualizar = useActualizarProveedor();
  const editando = Boolean(proveedor);
  const [form, setForm] = useState(vacio);
  const [error, setError] = useState(null);

  // Sincroniza el formulario al abrir.
  const [prev, setPrev] = useState(null);
  if (open && proveedor !== prev) {
    setPrev(proveedor);
    setForm(proveedor ? { ...vacio, ...proveedor } : vacio);
    setError(null);
  }

  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const submit = async () => {
    setError(null);
    const payload = {
      razon_social: form.razon_social.trim(),
      nit: form.nit.trim(),
      contacto: form.contacto?.trim() || undefined,
      telefono: form.telefono?.trim() || undefined,
      email: form.email?.trim() || undefined,
      ciudad: form.ciudad?.trim() || undefined,
    };
    try {
      if (editando) await actualizar.mutateAsync({ id: proveedor.id_proveedor, payload });
      else await crear.mutateAsync(payload);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar el proveedor');
    }
  };

  const pending = crear.isPending || actualizar.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editando ? 'Editar proveedor' : 'Nuevo proveedor'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={pending || !form.razon_social || !form.nit}>
            {pending ? 'Guardando…' : 'Guardar'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input id="razon_social" label="Razón social" value={form.razon_social} onChange={set('razon_social')} />
        <Input id="nit" label="NIT" placeholder="1023456789" value={form.nit} onChange={set('nit')} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input id="contacto" label="Contacto" value={form.contacto} onChange={set('contacto')} />
          <Input id="telefono" label="Teléfono" value={form.telefono} onChange={set('telefono')} />
          <Input id="email" label="Email" type="email" value={form.email} onChange={set('email')} />
          <Input id="ciudad" label="Ciudad" value={form.ciudad} onChange={set('ciudad')} />
        </div>
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </div>
    </Modal>
  );
}

export function Proveedores() {
  const { data: proveedores, isLoading, isError } = useProveedores();
  const eliminar = useEliminarProveedor();
  const [open, setOpen] = useState(false);
  const [editar, setEditar] = useState(null);

  const abrirNuevo = () => { setEditar(null); setOpen(true); };
  const abrirEditar = (p) => { setEditar(p); setOpen(true); };

  return (
    <div>
      <PageHeader
        title="Proveedores"
        description="Gestión de proveedores: razón social, NIT y datos de contacto (RF-COM-01)."
        actions={<Button onClick={abrirNuevo}>Nuevo proveedor</Button>}
      />

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-ink-muted"><Spinner /> Cargando proveedores…</div>
      )}
      {isError && <p className="text-sm text-red-600">No se pudieron cargar los proveedores.</p>}
      {proveedores && proveedores.length === 0 && (
        <EmptyState title="Sin proveedores" description="Registra el primer proveedor." action={<Button onClick={abrirNuevo}>Nuevo proveedor</Button>} />
      )}
      {proveedores && proveedores.length > 0 && (
        <Card>
          <table className="w-full">
            <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-medium">Razón social</th>
                <th className="px-4 py-3 font-medium">NIT</th>
                <th className="px-4 py-3 font-medium">Contacto</th>
                <th className="px-4 py-3 font-medium">Ciudad</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {proveedores.map((p) => (
                <tr key={p.id_proveedor} className="border-b border-line last:border-0 hover:bg-surface-muted">
                  <td className="px-4 py-3 text-sm font-medium text-ink">{p.razon_social}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-muted">{p.nit}</td>
                  <td className="px-4 py-3 text-sm">{p.contacto || '—'}</td>
                  <td className="px-4 py-3 text-sm">{p.ciudad || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge tone={p.activo ? 'success' : 'danger'}>{p.activo ? 'ACTIVO' : 'INACTIVO'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Button size="sm" variant="secondary" onClick={() => abrirEditar(p)}>Editar</Button>
                    {p.activo && (
                      <Button size="sm" variant="ghost" onClick={() => eliminar.mutate(p.id_proveedor)} disabled={eliminar.isPending}>
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

      <ProveedorModal open={open} onClose={() => setOpen(false)} proveedor={editar} />
    </div>
  );
}
