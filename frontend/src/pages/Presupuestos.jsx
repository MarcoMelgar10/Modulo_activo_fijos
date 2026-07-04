import { useMemo, useState } from 'react';
import {
  usePresupuestos,
  useCrearPresupuesto,
  useActualizarPresupuesto,
  useAprobarPresupuesto,
  useRechazarPresupuesto,
} from '../queries/usePresupuestos.js';
import { useCuentasPlanas } from '../queries/useCuentas.js';
import { useAuth } from '../store/AuthContext.jsx';
import { PageHeader, Card, Button, Input, Modal, Badge, Spinner, EmptyState } from '../components/ui';
import { formatBs } from '../lib/format.js';

const estadoTono = { BORRADOR: 'warning', APROBADO: 'success', RECHAZADO: 'danger' };
const anioActual = new Date().getFullYear();
const lineaVacia = () => ({ id_cuenta: '', monto_planificado: '' });
const totalPlan = (p) => (p.lineas ?? []).reduce((a, l) => a + Number(l.monto_planificado || 0), 0);

function PresupuestoModal({ open, onClose, presupuesto }) {
  const { data: cuentas = [] } = useCuentasPlanas();
  const crear = useCrearPresupuesto();
  const actualizar = useActualizarPresupuesto();
  const editando = Boolean(presupuesto);

  const presupuestables = useMemo(
    () => cuentas.filter((c) => c.permite_movimiento && ['INGRESO', 'GASTO'].includes(c.tipo)),
    [cuentas],
  );

  const [nombre, setNombre] = useState('');
  const [gestion, setGestion] = useState(String(anioActual));
  const [lineas, setLineas] = useState([lineaVacia()]);
  const [error, setError] = useState(null);
  const [prev, setPrev] = useState(undefined);

  if (open && presupuesto !== prev) {
    setPrev(presupuesto);
    setNombre(presupuesto?.nombre ?? '');
    setGestion(String(presupuesto?.gestion ?? anioActual));
    setLineas(
      presupuesto?.lineas?.length
        ? presupuesto.lineas.map((l) => ({ id_cuenta: String(l.id_cuenta), monto_planificado: String(l.monto_planificado) }))
        : [lineaVacia()],
    );
    setError(null);
  }

  const setLinea = (i, campo, val) => setLineas((prev2) => prev2.map((l, idx) => (idx === i ? { ...l, [campo]: val } : l)));
  const total = lineas.reduce((a, l) => a + Number(l.monto_planificado || 0), 0);
  const puede = nombre.trim() && gestion && lineas.every((l) => l.id_cuenta && Number(l.monto_planificado) >= 0) && lineas.length > 0;

  const guardar = async () => {
    setError(null);
    const payload = {
      nombre: nombre.trim(),
      gestion: Number(gestion),
      lineas: lineas.map((l) => ({ id_cuenta: Number(l.id_cuenta), monto_planificado: Number(l.monto_planificado || 0) })),
    };
    try {
      if (editando) await actualizar.mutateAsync({ id: presupuesto.id_presupuesto, payload: { nombre: payload.nombre, lineas: payload.lineas } });
      else await crear.mutateAsync(payload);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar el presupuesto');
    }
  };

  const pending = crear.isPending || actualizar.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={editando ? 'Editar presupuesto' : 'Nuevo presupuesto'}
      footer={
        <>
          <span className="mr-auto text-sm font-medium">Total planificado: {formatBs(total)}</span>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={guardar} disabled={!puede || pending}>{pending ? 'Guardando…' : 'Guardar'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2"><Input id="nombre" label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} /></div>
          <Input id="gestion" label="Gestión (año)" type="number" min="2000" max="2100" value={gestion} onChange={(e) => setGestion(e.target.value)} disabled={editando} />
        </div>

        <div className="overflow-hidden rounded-md border border-line">
          <table className="w-full text-sm">
            <thead className="bg-surface-sunken text-left text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-3 py-2 font-medium">Cuenta (Ingreso / Gasto)</th>
                <th className="w-40 px-3 py-2 text-right font-medium">Monto planificado</th>
                <th className="w-10 px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {lineas.map((l, i) => (
                <tr key={i}>
                  <td className="px-2 py-1.5">
                    <select className="h-9 w-full rounded-md border border-line bg-surface px-2 text-sm" value={l.id_cuenta} onChange={(e) => setLinea(i, 'id_cuenta', e.target.value)}>
                      <option value="">— Seleccionar —</option>
                      {presupuestables.map((c) => (
                        <option key={c.id_cuenta} value={c.id_cuenta}>{c.codigo} · {c.nombre} ({c.tipo})</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1.5">
                    <input type="number" min="0" step="0.01" className="h-9 w-full rounded-md border border-line bg-surface px-2 text-right text-sm" value={l.monto_planificado} onChange={(e) => setLinea(i, 'monto_planificado', e.target.value)} />
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <button type="button" className="text-ink-soft hover:text-red-600 disabled:opacity-30" onClick={() => setLineas((p) => p.filter((_, idx) => idx !== i))} disabled={lineas.length <= 1} aria-label="Quitar">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr><td className="px-3 py-2" colSpan={3}><button type="button" className="text-sm text-accent-600 hover:text-accent-700" onClick={() => setLineas((p) => [...p, lineaVacia()])}>+ Agregar línea</button></td></tr>
            </tfoot>
          </table>
        </div>
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </div>
    </Modal>
  );
}

export function Presupuestos() {
  const { user } = useAuth();
  const esGerente = user?.rol?.nombre === 'GERENTE';
  const { data: presupuestos, isLoading, isError } = usePresupuestos();
  const aprobar = useAprobarPresupuesto();
  const rechazar = useRechazarPresupuesto();
  const [open, setOpen] = useState(false);
  const [editar, setEditar] = useState(null);

  const abrirNuevo = () => { setEditar(null); setOpen(true); };
  const abrirEditar = (p) => { setEditar(p); setOpen(true); };

  return (
    <div>
      <PageHeader
        title="Presupuestos"
        description="Definición anual de ingresos y gastos planificados. El contador define; el gerente aprueba (RF-PRE-01/02)."
        actions={<Button onClick={abrirNuevo}>Nuevo presupuesto</Button>}
      />

      {isLoading && <div className="flex items-center gap-2 text-sm text-ink-muted"><Spinner /> Cargando presupuestos…</div>}
      {isError && <p className="text-sm text-red-600">No se pudieron cargar los presupuestos.</p>}
      {presupuestos && presupuestos.length === 0 && (
        <EmptyState title="Sin presupuestos" description="Crea el primer presupuesto anual." action={<Button onClick={abrirNuevo}>Nuevo presupuesto</Button>} />
      )}
      {presupuestos && presupuestos.length > 0 && (
        <Card>
          <table className="w-full">
            <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Gestión</th>
                <th className="px-4 py-3 text-right font-medium">Planificado</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {presupuestos.map((p) => (
                <tr key={p.id_presupuesto} className="border-b border-line last:border-0 hover:bg-surface-muted">
                  <td className="px-4 py-3 text-sm font-medium text-ink">{p.nombre}</td>
                  <td className="px-4 py-3 text-sm">{p.gestion}</td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums">{formatBs(totalPlan(p))}</td>
                  <td className="px-4 py-3"><Badge tone={estadoTono[p.estado]}>{p.estado}</Badge></td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {p.estado === 'BORRADOR' && (
                      <Button size="sm" variant="secondary" onClick={() => abrirEditar(p)}>Editar</Button>
                    )}
                    {p.estado === 'BORRADOR' && esGerente && (
                      <>
                        <Button size="sm" onClick={() => aprobar.mutate(p.id_presupuesto)} disabled={aprobar.isPending}>Aprobar</Button>
                        <Button size="sm" variant="ghost" onClick={() => rechazar.mutate({ id: p.id_presupuesto, payload: {} })} disabled={rechazar.isPending}>Rechazar</Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <PresupuestoModal open={open} onClose={() => setOpen(false)} presupuesto={editar} />
    </div>
  );
}
