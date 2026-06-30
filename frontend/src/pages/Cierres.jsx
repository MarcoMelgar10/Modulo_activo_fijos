import { useState } from 'react';
import { useCierres, useCerrarGestion } from '../queries/useCierres.js';
import { PageHeader, Card, Button, Input, Modal, Badge, Spinner, EmptyState } from '../components/ui';
import { formatBs, formatFecha } from '../lib/format.js';

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between px-3 py-2">
      <span className="text-ink-muted">{label}</span>
      <span className="font-medium text-ink tabular-nums">{value}</span>
    </div>
  );
}

function CerrarGestionModal({ open, onClose }) {
  const cerrar = useCerrarGestion();
  const [anio, setAnio] = useState(String(new Date().getFullYear()));
  const [error, setError] = useState(null);
  const [resultado, setResultado] = useState(null);

  const cerrarModal = () => {
    setResultado(null);
    setError(null);
    onClose();
  };

  const submit = async () => {
    setError(null);
    try {
      const data = await cerrar.mutateAsync(Number(anio));
      setResultado(data);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cerrar la gestión');
    }
  };

  return (
    <Modal
      open={open}
      onClose={cerrarModal}
      title="Cerrar gestión anual"
      footer={
        resultado ? (
          <Button onClick={cerrarModal}>Listo</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={cerrarModal}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={cerrar.isPending || !anio}>
              {cerrar.isPending ? 'Cerrando…' : 'Cerrar gestión'}
            </Button>
          </>
        )
      }
    >
      {resultado ? (
        <div className="space-y-3 text-sm">
          <p className="text-ink">
            Gestión <strong>{resultado.cierre.periodo_anio}</strong> cerrada correctamente.
          </p>
          <div className="divide-y divide-line rounded-md border border-line">
            <Row label="Total ingresos" value={formatBs(resultado.cierre.total_ingresos)} />
            <Row label="Total gastos" value={formatBs(resultado.cierre.total_gastos)} />
            <Row label="Resultado del ejercicio" value={formatBs(resultado.cierre.resultado)} />
            <Row label="Asiento de cierre" value={resultado.asiento.numero_asiento} />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-ink-muted">
            Se generará el asiento de cierre que traslada el resultado del ejercicio al patrimonio
            y se bloqueará la gestión: no se podrán crear, confirmar ni anular asientos de ese año.
          </p>
          <Input
            id="anio"
            label="Año a cerrar"
            type="number"
            value={anio}
            onChange={(e) => setAnio(e.target.value)}
          />
          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>
      )}
    </Modal>
  );
}

export function Cierres() {
  const { data: cierres, isLoading, isError } = useCierres();
  const [open, setOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Cierre de gestión"
        description="Cierre anual: traslada el resultado al patrimonio y bloquea el período (RF-CON-05)."
        actions={<Button onClick={() => setOpen(true)}>Cerrar gestión</Button>}
      />

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <Spinner /> Cargando cierres…
        </div>
      )}
      {isError && <p className="text-sm text-red-600">No se pudieron cargar los cierres.</p>}
      {cierres && cierres.length === 0 && (
        <EmptyState
          title="Sin cierres registrados"
          description="Aún no se ha cerrado ninguna gestión."
          action={<Button onClick={() => setOpen(true)}>Cerrar gestión</Button>}
        />
      )}
      {cierres && cierres.length > 0 && (
        <Card>
          <table className="w-full">
            <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-medium">Gestión</th>
                <th className="px-4 py-3 font-medium">Fecha cierre</th>
                <th className="px-4 py-3 text-right font-medium">Ingresos</th>
                <th className="px-4 py-3 text-right font-medium">Gastos</th>
                <th className="px-4 py-3 text-right font-medium">Resultado</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {cierres.map((c) => (
                <tr key={c.id_cierre} className="border-b border-line last:border-0 hover:bg-surface-muted">
                  <td className="px-4 py-3 text-sm font-medium">{c.periodo_anio}</td>
                  <td className="px-4 py-3 text-sm">{formatFecha(c.fecha_cierre)}</td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums">{formatBs(c.total_ingresos)}</td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums">{formatBs(c.total_gastos)}</td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums">{formatBs(c.resultado)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={c.estado === 'CERRADO' ? 'success' : 'neutral'}>{c.estado}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <CerrarGestionModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
