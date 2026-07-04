import { useState } from 'react';
import {
  useTraspasos,
  useCrearTraspaso,
  useEnviarTraspaso,
  useRecibirTraspaso,
  useCancelarTraspaso,
} from '../queries/useTraspasos.js';
import { useSucursales } from '../queries/useSucursales.js';
import { useInventarioLotes } from '../queries/useInventario.js';
import { useAuth } from '../store/AuthContext.jsx';
import { PageHeader, Card, Button, Input, Select, Modal, Badge, Spinner, EmptyState } from '../components/ui';
import { formatFecha } from '../lib/format.js';

const badgeTone = { PENDIENTE: 'warning', EN_TRANSITO: 'accent', RECIBIDO: 'success', CANCELADO: 'danger' };

function NuevoTraspasoModal({ open, onClose }) {
  const { data: sucursales = [] } = useSucursales();
  const crear = useCrearTraspaso();
  const [form, setForm] = useState({ id_sucursal_origen: '', id_sucursal_destino: '', motivo: '', id_lote: '', cantidad: '' });
  const [detalles, setDetalles] = useState([]);
  const [error, setError] = useState(null);

  const { data: lotes = [] } = useInventarioLotes(
    form.id_sucursal_origen ? { id_sucursal: Number(form.id_sucursal_origen), solo_disponible: true } : {},
  );

  const agregarLote = () => {
    if (!form.id_lote || !form.cantidad || Number(form.cantidad) <= 0) return;
    const lote = lotes.find((l) => String(l.id_lote) === form.id_lote);
    if (!lote) return;
    setDetalles((prev) => [...prev, { id_lote: lote.id_lote, numero_lote: lote.numero_lote, cantidad: Number(form.cantidad) }]);
    setForm((f) => ({ ...f, id_lote: '', cantidad: '' }));
  };

  const quitarLote = (id_lote) => setDetalles((prev) => prev.filter((d) => d.id_lote !== id_lote));

  const submit = async () => {
    setError(null);
    try {
      await crear.mutateAsync({
        id_sucursal_origen: Number(form.id_sucursal_origen),
        id_sucursal_destino: Number(form.id_sucursal_destino),
        motivo: form.motivo || undefined,
        detalles: detalles.map((d) => ({ id_lote: d.id_lote, cantidad: d.cantidad })),
      });
      setDetalles([]);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear el traspaso');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo traspaso"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={crear.isPending || detalles.length === 0 || !form.id_sucursal_origen || !form.id_sucursal_destino}>
            {crear.isPending ? 'Creando...' : 'Crear traspaso'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Select id="origen" label="Sucursal origen" value={form.id_sucursal_origen} onChange={(e) => setForm({ ...form, id_sucursal_origen: e.target.value, id_lote: '' })}>
            <option value="">Seleccionar</option>
            {sucursales.map((s) => <option key={s.id_sucursal} value={s.id_sucursal}>{s.nombre}</option>)}
          </Select>
          <Select id="destino" label="Sucursal destino" value={form.id_sucursal_destino} onChange={(e) => setForm({ ...form, id_sucursal_destino: e.target.value })}>
            <option value="">Seleccionar</option>
            {sucursales.filter((s) => String(s.id_sucursal) !== form.id_sucursal_origen).map((s) => <option key={s.id_sucursal} value={s.id_sucursal}>{s.nombre}</option>)}
          </Select>
        </div>
        <Input id="motivo" label="Motivo (opcional)" value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} />

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Select id="lote" label="Lote disponible" value={form.id_lote} onChange={(e) => setForm({ ...form, id_lote: e.target.value })}>
              <option value="">Seleccionar lote</option>
              {lotes.map((l) => <option key={l.id_lote} value={l.id_lote}>{`L${l.id_lote} - ${l.producto?.nombre || ''} (${l.cantidad_actual} u)`}</option>)}
            </Select>
          </div>
          <div className="w-24">
            <Input id="cant" label="Cantidad" type="number" min="1" value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value })} />
          </div>
          <Button variant="secondary" onClick={agregarLote} disabled={!form.id_lote}>Agregar</Button>
        </div>

        {detalles.length > 0 && (
          <div className="rounded-md border text-sm">
            <table className="w-full">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr><th className="px-3 py-2">Lote</th><th className="px-3 py-2 text-right">Cantidad</th><th className="px-3 py-2"></th></tr>
              </thead>
              <tbody>
                {detalles.map((d) => (
                  <tr key={d.id_lote} className="border-t">
                    <td className="px-3 py-2">{d.numero_lote}</td>
                    <td className="px-3 py-2 text-right">{d.cantidad}</td>
                    <td className="px-3 py-2 text-right"><Button size="sm" variant="ghost" onClick={() => quitarLote(d.id_lote)}>Quitar</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </div>
    </Modal>
  );
}

export function Traspasos() {
  const { user } = useAuth();
  const { data: traspasos = [], isLoading } = useTraspasos();
  const enviar = useEnviarTraspaso();
  const recibir = useRecibirTraspaso();
  const cancelar = useCancelarTraspaso();
  const [modal, setModal] = useState(false);

  if (isLoading) return <Spinner className="mx-auto mt-20" />;

  const esGerente = user?.rol?.nombre === 'GERENTE';
  const own = Number(user?.id_sucursal);

  return (
    <div>
      <PageHeader
        title="Traspasos"
        description="Transferencia de mercancia entre sucursales"
        actions={<Button onClick={() => setModal(true)}>Nuevo traspaso</Button>}
      />

      {traspasos.length === 0 ? (
        <EmptyState title="Sin traspasos" description="No hay traspasos registrados." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs font-medium uppercase text-gray-500">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Origen</th>
                  <th className="px-4 py-3">Destino</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Motivo</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {traspasos.map((t) => (
                  <tr key={t.id_traspaso} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{t.id_traspaso}</td>
                    <td className="px-4 py-3">{t.sucursalOrigen?.nombre}</td>
                    <td className="px-4 py-3">{t.sucursalDestino?.nombre}</td>
                    <td className="px-4 py-3"><Badge tone={badgeTone[t.estado]}>{t.estado}</Badge></td>
                    <td className="px-4 py-3 text-xs">{t.motivo || '-'}</td>
                    <td className="px-4 py-3 text-xs">{formatFecha(t.fecha_creacion)}</td>
                    <td className="px-4 py-3 space-x-1">
                      {t.estado === 'PENDIENTE' && (
                        <>
                          <Button size="sm" onClick={() => enviar.mutate(t.id_traspaso)} disabled={enviar.isPending}>Enviar</Button>
                          <Button size="sm" variant="danger" onClick={() => cancelar.mutate({ id: t.id_traspaso })} disabled={cancelar.isPending}>Cancelar</Button>
                        </>
                      )}
                      {t.estado === 'EN_TRANSITO' && (esGerente || Number(t.id_sucursal_destino) === own) && (
                        <Button size="sm" onClick={() => recibir.mutate({ id: t.id_traspaso })} disabled={recibir.isPending}>Recibir</Button>
                      )}
                      {t.estado === 'EN_TRANSITO' && esGerente && (
                        <Button size="sm" variant="danger" onClick={() => cancelar.mutate({ id: t.id_traspaso })} disabled={cancelar.isPending}>Cancelar</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <NuevoTraspasoModal open={modal} onClose={() => setModal(false)} />
    </div>
  );
}
