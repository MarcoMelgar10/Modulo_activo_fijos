import { useMemo, useState } from 'react';
import {
  useAsientos,
  useCrearAsiento,
  useConfirmarAsiento,
  useAnularAsiento,
} from '../queries/useAsientos.js';
import { useCuentasPlanas } from '../queries/useCuentas.js';
import {
  PageHeader,
  Card,
  Button,
  Input,
  Modal,
  Badge,
  Spinner,
  EmptyState,
} from '../components/ui';
import { formatBs, formatFecha } from '../lib/format.js';

const estadoTono = { BORRADOR: 'warning', CONFIRMADO: 'success', ANULADO: 'danger' };
const hoy = () => new Date().toISOString().slice(0, 10);
const lineaVacia = () => ({ id_cuenta: '', descripcion: '', debe: '', haber: '' });
const cents = (v) => Math.round(Number(v || 0) * 100);

function EditorAsiento({ open, onClose }) {
  const { data: cuentas = [] } = useCuentasPlanas();
  const crear = useCrearAsiento();
  const hojas = useMemo(() => cuentas.filter((c) => c.permite_movimiento), [cuentas]);

  const [fecha, setFecha] = useState(hoy());
  const [concepto, setConcepto] = useState('');
  const [lineas, setLineas] = useState([lineaVacia(), lineaVacia()]);
  const [error, setError] = useState(null);

  const totalDebe = lineas.reduce((a, l) => a + cents(l.debe), 0);
  const totalHaber = lineas.reduce((a, l) => a + cents(l.haber), 0);
  const diferencia = totalDebe - totalHaber;
  const balanceado = diferencia === 0 && totalDebe > 0;
  const lineasValidas = lineas.every(
    (l) => l.id_cuenta && (cents(l.debe) > 0) !== (cents(l.haber) > 0),
  );
  const puedeGuardar = balanceado && lineasValidas && concepto.trim() && lineas.length >= 2;

  const setLinea = (i, campo, valor) =>
    setLineas((prev) => prev.map((l, idx) => (idx === i ? { ...l, [campo]: valor } : l)));

  const reset = () => {
    setFecha(hoy());
    setConcepto('');
    setLineas([lineaVacia(), lineaVacia()]);
    setError(null);
  };

  const guardar = async () => {
    setError(null);
    const payload = {
      fecha,
      concepto: concepto.trim(),
      lineas: lineas.map((l) => ({
        id_cuenta: Number(l.id_cuenta),
        descripcion: l.descripcion?.trim() || undefined,
        debe: Number(l.debe || 0),
        haber: Number(l.haber || 0),
      })),
    };
    try {
      await crear.mutateAsync(payload);
      reset();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar el asiento');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title="Nuevo asiento contable"
      footer={
        <>
          <span className="mr-auto text-sm">
            {balanceado ? (
              <Badge tone="success">Balanceado</Badge>
            ) : (
              <Badge tone="danger">Descuadre: {formatBs(Math.abs(diferencia) / 100)}</Badge>
            )}
          </span>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={!puedeGuardar || crear.isPending}>
            {crear.isPending ? 'Guardando…' : 'Guardar borrador'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input id="fecha" label="Fecha" type="date" value={fecha} max={hoy()} onChange={(e) => setFecha(e.target.value)} />
          <div className="sm:col-span-2">
            <Input
              id="concepto"
              label="Concepto / glosa"
              placeholder="Descripción del asiento"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-md border border-line">
          <table className="w-full text-sm">
            <thead className="bg-surface-sunken text-left text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-3 py-2 font-medium">Cuenta</th>
                <th className="px-3 py-2 font-medium">Detalle</th>
                <th className="w-32 px-3 py-2 text-right font-medium">Debe</th>
                <th className="w-32 px-3 py-2 text-right font-medium">Haber</th>
                <th className="w-10 px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {lineas.map((l, i) => (
                <tr key={i}>
                  <td className="px-2 py-1.5">
                    <select
                      className="h-9 w-full rounded-md border border-line bg-surface px-2 text-sm"
                      value={l.id_cuenta}
                      onChange={(e) => setLinea(i, 'id_cuenta', e.target.value)}
                    >
                      <option value="">— Seleccionar —</option>
                      {hojas.map((c) => (
                        <option key={c.id_cuenta} value={c.id_cuenta}>
                          {c.codigo} · {c.nombre}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      className="h-9 w-full rounded-md border border-line bg-surface px-2 text-sm"
                      value={l.descripcion}
                      onChange={(e) => setLinea(i, 'descripcion', e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="h-9 w-full rounded-md border border-line bg-surface px-2 text-right text-sm"
                      value={l.debe}
                      onChange={(e) => setLinea(i, 'debe', e.target.value)}
                      disabled={cents(l.haber) > 0}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="h-9 w-full rounded-md border border-line bg-surface px-2 text-right text-sm"
                      value={l.haber}
                      onChange={(e) => setLinea(i, 'haber', e.target.value)}
                      disabled={cents(l.debe) > 0}
                    />
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <button
                      type="button"
                      className="text-ink-soft hover:text-red-600 disabled:opacity-30"
                      onClick={() => setLineas((prev) => prev.filter((_, idx) => idx !== i))}
                      disabled={lineas.length <= 2}
                      aria-label="Quitar línea"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-surface-muted font-medium">
              <tr>
                <td className="px-3 py-2" colSpan={2}>
                  <button
                    type="button"
                    className="text-sm text-accent-600 hover:text-accent-700"
                    onClick={() => setLineas((prev) => [...prev, lineaVacia()])}
                  >
                    + Agregar línea
                  </button>
                </td>
                <td className="px-3 py-2 text-right">{formatBs(totalDebe / 100)}</td>
                <td className="px-3 py-2 text-right">{formatBs(totalHaber / 100)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </div>
    </Modal>
  );
}

function FilaAsiento({ asiento }) {
  const confirmar = useConfirmarAsiento();
  const anular = useAnularAsiento();
  const total = asiento.lineas?.reduce((a, l) => a + Number(l.debe), 0) ?? 0;

  return (
    <tr className="border-b border-line last:border-0 hover:bg-surface-muted">
      <td className="px-4 py-3 font-mono text-xs text-ink-muted">{asiento.numero_asiento}</td>
      <td className="px-4 py-3 text-sm">{formatFecha(asiento.fecha)}</td>
      <td className="px-4 py-3 text-sm">{asiento.concepto}</td>
      <td className="px-4 py-3"><Badge tone="neutral">{asiento.tipo_origen}</Badge></td>
      <td className="px-4 py-3 text-right text-sm tabular-nums">{formatBs(total)}</td>
      <td className="px-4 py-3"><Badge tone={estadoTono[asiento.estado]}>{asiento.estado}</Badge></td>
      <td className="px-4 py-3 text-right">
        {asiento.estado === 'BORRADOR' && (
          <Button size="sm" variant="secondary" onClick={() => confirmar.mutate(asiento.id_asiento)} disabled={confirmar.isPending}>
            Confirmar
          </Button>
        )}
        {asiento.estado === 'CONFIRMADO' && (
          <Button size="sm" variant="ghost" onClick={() => anular.mutate(asiento.id_asiento)} disabled={anular.isPending}>
            Anular
          </Button>
        )}
      </td>
    </tr>
  );
}

export function Asientos() {
  const { data: asientos, isLoading, isError } = useAsientos();
  const [open, setOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Asientos contables"
        description="Registro de asientos con partida doble (Debe = Haber)."
        actions={<Button onClick={() => setOpen(true)}>Nuevo asiento</Button>}
      />

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <Spinner /> Cargando asientos…
        </div>
      )}
      {isError && <p className="text-sm text-red-600">No se pudieron cargar los asientos.</p>}
      {asientos && asientos.length === 0 && (
        <EmptyState
          title="Sin asientos registrados"
          description="Crea el primer asiento contable manual."
          action={<Button onClick={() => setOpen(true)}>Nuevo asiento</Button>}
        />
      )}
      {asientos && asientos.length > 0 && (
        <Card>
          <table className="w-full">
            <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-medium">Número</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Concepto</th>
                <th className="px-4 py-3 font-medium">Origen</th>
                <th className="px-4 py-3 text-right font-medium">Importe</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {asientos.map((a) => (
                <FilaAsiento key={a.id_asiento} asiento={a} />
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <EditorAsiento open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
