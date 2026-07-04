import { useState } from 'react';
import {
  useUsuarios,
  useRoles,
  useCrearUsuario,
  useActualizarUsuario,
  useCambiarEstadoUsuario,
} from '../queries/useUsuarios.js';
import { useSucursales } from '../queries/useSucursales.js';
import { PageHeader, Card, Button, Input, Select, Modal, Badge, Spinner, EmptyState } from '../components/ui';

const rolTono = { GERENTE: 'accent', CONTADOR: 'success', CAJERO: 'warning', BODEGUERO: 'neutral' };
const vacio = { nombre: '', apellido: '', usuario: '', password: '', id_rol: '', id_sucursal: '' };

function UsuarioModal({ open, onClose, usuario }) {
  const { data: roles = [] } = useRoles();
  const { data: sucursales = [] } = useSucursales();
  const crear = useCrearUsuario();
  const actualizar = useActualizarUsuario();
  const editando = Boolean(usuario);
  const [form, setForm] = useState(vacio);
  const [error, setError] = useState(null);

  const [prev, setPrev] = useState(null);
  if (open && usuario !== prev) {
    setPrev(usuario);
    setForm(
      usuario
        ? { nombre: usuario.nombre, apellido: usuario.apellido, usuario: usuario.usuario, password: '', id_rol: String(usuario.id_rol), id_sucursal: String(usuario.id_sucursal || '') }
        : vacio,
    );
    setError(null);
  }

  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const submit = async () => {
    setError(null);
    try {
      if (editando) {
        const payload = {
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          id_rol: Number(form.id_rol),
          id_sucursal: Number(form.id_sucursal),
        };
        if (form.password) payload.password = form.password;
        await actualizar.mutateAsync({ id: usuario.id_empleado, payload });
      } else {
        await crear.mutateAsync({
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          usuario: form.usuario.trim(),
          password: form.password,
          id_rol: Number(form.id_rol),
          id_sucursal: Number(form.id_sucursal),
        });
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar el usuario');
    }
  };

  const pending = crear.isPending || actualizar.isPending;
  const puedeGuardar = form.nombre && form.apellido && form.id_rol && form.id_sucursal && (editando || (form.usuario && form.password));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editando ? 'Editar usuario' : 'Nuevo usuario'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={pending || !puedeGuardar}>{pending ? 'Guardando…' : 'Guardar'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input id="nombre" label="Nombre" value={form.nombre} onChange={set('nombre')} />
          <Input id="apellido" label="Apellido" value={form.apellido} onChange={set('apellido')} />
        </div>
        <Input id="usuario" label="Usuario (login)" value={form.usuario} onChange={set('usuario')} disabled={editando} />
        <Input
          id="password"
          label={editando ? 'Nueva contraseña (dejar en blanco para no cambiar)' : 'Contraseña inicial'}
          type="password"
          value={form.password}
          onChange={set('password')}
        />
        <Select id="rol" label="Rol" value={form.id_rol} onChange={set('id_rol')}>
          <option value="">— Seleccionar —</option>
          {roles.map((r) => (
            <option key={r.id_rol} value={r.id_rol}>{r.nombre}</option>
          ))}
        </Select>
        <Select id="sucursal" label="Sucursal" value={form.id_sucursal} onChange={set('id_sucursal')}>
          <option value="">— Seleccionar —</option>
          {sucursales.map((s) => (
            <option key={s.id_sucursal} value={s.id_sucursal}>{s.nombre}</option>
          ))}
        </Select>
        <p className="text-xs text-ink-soft leading-relaxed">
          El rol determina a qué módulos accede el usuario: GERENTE ve todo; CONTADOR contabilidad;
          CAJERO ventas; BODEGUERO inventario y compras.
        </p>
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </div>
    </Modal>
  );
}

export function Usuarios() {
  const { data: usuarios, isLoading, isError } = useUsuarios();
  const estado = useCambiarEstadoUsuario();
  const [open, setOpen] = useState(false);
  const [editar, setEditar] = useState(null);

  const abrirNuevo = () => { setEditar(null); setOpen(true); };
  const abrirEditar = (u) => { setEditar(u); setOpen(true); };

  return (
    <div>
      <PageHeader
        title="Usuarios"
        description="Alta de usuarios y asignación de roles. El rol define el acceso a los módulos (RF-USR-02/04)."
        actions={<Button onClick={abrirNuevo}>Nuevo usuario</Button>}
      />

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-ink-muted"><Spinner /> Cargando usuarios…</div>
      )}
      {isError && <p className="text-sm text-red-600">No se pudieron cargar los usuarios.</p>}
      {usuarios && usuarios.length === 0 && (
        <EmptyState title="Sin usuarios" description="Crea el primer usuario." action={<Button onClick={abrirNuevo}>Nuevo usuario</Button>} />
      )}
      {usuarios && usuarios.length > 0 && (
        <Card>
          <table className="w-full">
            <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-medium">Usuario</th>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Rol</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id_empleado} className="border-b border-line last:border-0 hover:bg-surface-muted">
                  <td className="px-4 py-3 font-mono text-xs text-ink-muted">{u.usuario}</td>
                  <td className="px-4 py-3 text-sm">{u.nombre} {u.apellido}</td>
                  <td className="px-4 py-3"><Badge tone={rolTono[u.rol?.nombre] || 'neutral'}>{u.rol?.nombre}</Badge></td>
                  <td className="px-4 py-3"><Badge tone={u.activo ? 'success' : 'danger'}>{u.activo ? 'ACTIVO' : 'INACTIVO'}</Badge></td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Button size="sm" variant="secondary" onClick={() => abrirEditar(u)}>Editar</Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => estado.mutate({ id: u.id_empleado, activo: !u.activo })}
                      disabled={estado.isPending}
                    >
                      {u.activo ? 'Dar de baja' : 'Reactivar'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <UsuarioModal open={open} onClose={() => setOpen(false)} usuario={editar} />
    </div>
  );
}
