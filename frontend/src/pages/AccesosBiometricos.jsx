import { useState } from 'react';
import { useAccesosBiometricos, useSimularAcceso } from '../queries/useAccesosBiometricos.js';
import { useDispositivosBiometricos } from '../queries/useDispositivosBiometricos.js';
import { useSucursales } from '../queries/useSucursales.js';
import { PageHeader, Card, Button, Select, Badge, Spinner, EmptyState, Modal, Input } from '../components/ui';
import { formatFecha } from '../lib/format.js';

function SimularModal({ open, onClose }) {
  const { data: dispositivos = [] } = useDispositivosBiometricos();
  const simular = useSimularAcceso();
  const [form, setForm] = useState({ dispositivo_id: '', id_empleado: '', tipo_movimiento: 'ENTRADA' });
  const [resultado, setResultado] = useState(null);

  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const submit = async () => {
    setResultado(null);
    try {
      const r = await simular.mutateAsync({
        dispositivo_id: form.dispositivo_id,
        id_empleado: Number(form.id_empleado),
        tipo_movimiento: form.tipo_movimiento,
      });
      setResultado(r);
    } catch (err) {
      setResultado({ error: err.response?.data?.error || 'Error' });
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => { setResultado(null); onClose(); }}
      title="Simular acceso biometrico"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cerrar</Button>
          <Button onClick={submit} disabled={simular.isPending || !form.dispositivo_id || !form.id_empleado}>
            {simular.isPending ? 'Simulando...' : 'Simular'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Select id="disp" label="Dispositivo" value={form.dispositivo_id} onChange={set('dispositivo_id')}>
          <option value="">Seleccionar</option>
          {dispositivos.map((d) => <option key={d.dispositivo_id} value={d.dispositivo_id}>{d.nombre}</option>)}
        </Select>
        <Input id="emp" label="ID Empleado" type="number" value={form.id_empleado} onChange={set('id_empleado')} />
        <Select id="tipo" label="Tipo movimiento" value={form.tipo_movimiento} onChange={set('tipo_movimiento')}>
          <option value="ENTRADA">ENTRADA</option>
          <option value="SALIDA">SALIDA</option>
        </Select>
        {resultado && !resultado.error && (
          <div className={`rounded-md p-3 text-sm ${resultado.autorizado ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            <p className="font-semibold">{resultado.autorizado ? 'ACCESO AUTORIZADO' : 'ACCESO DENEGADO'}</p>
            <p className="text-xs">{resultado.mensaje}</p>
          </div>
        )}
        {resultado?.error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{resultado.error}</p>}
      </div>
    </Modal>
  );
}

export function AccesosBiometricos() {
  const { data: sucursales = [] } = useSucursales();
  const [filtros, setFiltros] = useState({});
  const { data: accesos = [], isLoading } = useAccesosBiometricos(filtros);
  const [modal, setModal] = useState(false);

  if (isLoading) return <Spinner className="mx-auto mt-20" />;

  return (
    <div>
      <PageHeader
        title="Accesos biometricos"
        description="Registro de eventos de acceso a bodegas"
        actions={<Button onClick={() => setModal(true)}>Simular acceso</Button>}
      />

      <div className="mb-4 flex gap-4">
        <div className="max-w-xs">
          <Select id="filtro_sucursal" label="Sucursal" value={filtros.id_sucursal || ''} onChange={(e) => setFiltros({ ...filtros, id_sucursal: e.target.value || undefined })}>
            <option value="">Todas</option>
            {sucursales.map((s) => <option key={s.id_sucursal} value={s.id_sucursal}>{s.nombre}</option>)}
          </Select>
        </div>
        <div className="max-w-xs">
          <Select id="filtro_resultado" label="Resultado" value={filtros.resultado ?? ''} onChange={(e) => setFiltros({ ...filtros, resultado: e.target.value || undefined })}>
            <option value="">Todos</option>
            <option value="true">Autorizado</option>
            <option value="false">Denegado</option>
          </Select>
        </div>
      </div>

      {accesos.length === 0 ? (
        <EmptyState title="Sin accesos" description="No hay eventos registrados." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs font-medium uppercase text-gray-500">
                  <th className="px-4 py-3">Fecha/Hora</th>
                  <th className="px-4 py-3">Empleado</th>
                  <th className="px-4 py-3">Sucursal</th>
                  <th className="px-4 py-3">Dispositivo</th>
                  <th className="px-4 py-3">Movimiento</th>
                  <th className="px-4 py-3">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {accesos.map((a) => (
                  <tr key={a.id_acceso} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs">{formatFecha(a.fecha_hora)}</td>
                    <td className="px-4 py-3">{a.empleado?.nombre} {a.empleado?.apellido}</td>
                    <td className="px-4 py-3">{a.sucursal?.nombre}</td>
                    <td className="px-4 py-3 font-mono text-xs">{a.dispositivo?.nombre}</td>
                    <td className="px-4 py-3"><Badge tone={a.tipo_movimiento === 'ENTRADA' ? 'accent' : 'neutral'}>{a.tipo_movimiento}</Badge></td>
                    <td className="px-4 py-3">
                      <Badge tone={a.resultado ? 'success' : 'danger'}>{a.resultado ? 'Autorizado' : 'Denegado'}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <SimularModal open={modal} onClose={() => setModal(false)} />
    </div>
  );
}
