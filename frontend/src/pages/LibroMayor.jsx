import { useState, useMemo } from 'react';
import { useLibroMayor } from '../queries/useLibros.js';
import { useCuentasPlanas } from '../queries/useCuentas.js';
import {
  PageHeader,
  Card,
  CardBody,
  Button,
  Input,
  Select,
  Spinner,
  EmptyState,
} from '../components/ui';
import { formatBs, formatFecha } from '../lib/format.js';
import { exportarPDF, pdfBs } from '../lib/pdf.js';

export function LibroMayor() {
  const { data: cuentasPlanas = [] } = useCuentasPlanas();

  // Filtrar en el cliente las cuentas que permiten movimiento
  const cuentasFiltradas = useMemo(() => {
    return cuentasPlanas.filter((c) => c.permite_movimiento);
  }, [cuentasPlanas]);

  const [form, setForm] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    id_cuenta: '',
    id_sucursal: '',
  });

  const [filtros, setFiltros] = useState(null);

  // Se activa el query sólo si filtros está presente e id_cuenta es válido
  const { data, isLoading, isError, isFetching } = useLibroMayor(filtros || {}, {
    enabled: filtros !== null && !!filtros.id_cuenta,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.fecha_inicio || !form.fecha_fin || !form.id_cuenta) return;
    setFiltros({
      fecha_inicio: form.fecha_inicio,
      fecha_fin: form.fecha_fin,
      id_cuenta: Number(form.id_cuenta),
      id_sucursal: form.id_sucursal ? Number(form.id_sucursal) : undefined,
    });
  };

  const selectedAccount = useMemo(() => {
    if (!form.id_cuenta) return null;
    return cuentasPlanas.find((c) => c.id_cuenta === Number(form.id_cuenta));
  }, [form.id_cuenta, cuentasPlanas]);

  // Si no viene el tipo de cuenta de la consulta del mayor, lo tomamos del objeto seleccionado.
  const cuentaTipo = data?.cuenta?.tipo || selectedAccount?.tipo || 'ACTIVO';
  const saldoInicial = Number(data?.saldoInicial ?? data?.saldo_inicial ?? 0);
  const saldoFinal = Number(data?.saldoFinal ?? data?.saldo_final ?? 0);
  const movimientos = data?.movimientos ?? [];

  // Determinar la naturaleza de la cuenta:
  // Activo y Gasto aumentan con Debe (Deudora)
  // Pasivo, Patrimonio e Ingreso aumentan con Haber (Acreedora)
  const esDeudora = cuentaTipo === 'ACTIVO' || cuentaTipo === 'GASTO';

  // Calcular los saldos acumulados fila por fila
  let tempSaldo = saldoInicial;
  const movimientosConSaldo = movimientos.map((mov) => {
    const debe = Number(mov.debe || 0);
    const haber = Number(mov.haber || 0);
    if (esDeudora) {
      tempSaldo += debe - haber;
    } else {
      tempSaldo += haber - debe;
    }
    return {
      ...mov,
      // El backend anida el asiento; se exponen fecha, número y concepto en el
      // nivel superior para que los usen la tabla y la exportación a PDF.
      fecha: mov.fecha ?? mov.asiento?.fecha,
      numero_asiento: mov.numero_asiento ?? mov.asiento?.numero_asiento,
      concepto: mov.concepto ?? mov.asiento?.concepto,
      saldoAcumulado: tempSaldo,
    };
  });

  const exportarPdf = () =>
    exportarPDF({
      titulo: 'Libro Mayor',
      subtitulo: `${selectedAccount ? `${selectedAccount.codigo} · ${selectedAccount.nombre}` : ''} — del ${filtros.fecha_inicio} al ${filtros.fecha_fin}`,
      columnas: ['Fecha', 'Asiento', 'Concepto', 'Debe', 'Haber', 'Saldo'],
      filas: movimientosConSaldo.map((m) => [
        formatFecha(m.fecha),
        m.numero_asiento || m.asiento_numero || '',
        m.concepto || m.descripcion || '',
        Number(m.debe) > 0 ? pdfBs(m.debe) : '',
        Number(m.haber) > 0 ? pdfBs(m.haber) : '',
        pdfBs(m.saldoAcumulado),
      ]),
      resumen: [`Saldo inicial: ${pdfBs(saldoInicial)}`, `Saldo final: ${pdfBs(saldoFinal)}`],
      archivo: `libro-mayor-${filtros.fecha_inicio}_${filtros.fecha_fin}`,
    });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Libro Mayor"
        description="Movimientos detallados y saldo acumulado para una cuenta contable específica."
      />

      <Card>
        <CardBody>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-5 sm:items-end">
            <div className="sm:col-span-2">
              <Select
                id="id_cuenta"
                label="Cuenta Contable *"
                required
                value={form.id_cuenta}
                onChange={(e) => setForm({ ...form, id_cuenta: e.target.value })}
              >
                <option value="">— Seleccionar Cuenta —</option>
                {cuentasFiltradas.map((c) => (
                  <option key={c.id_cuenta} value={c.id_cuenta}>
                    {c.codigo} · {c.nombre}
                  </option>
                ))}
              </Select>
            </div>
            <Input
              id="fecha_inicio"
              label="Fecha Inicio *"
              type="date"
              required
              value={form.fecha_inicio}
              onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
            />
            <Input
              id="fecha_fin"
              label="Fecha Fin *"
              type="date"
              required
              value={form.fecha_fin}
              onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
            />
            <Select
              id="sucursal"
              label="Sucursal (opcional)"
              value={form.id_sucursal}
              onChange={(e) => setForm({ ...form, id_sucursal: e.target.value })}
            >
              <option value="">— Todas —</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <option key={num} value={num}>
                  Sucursal {num}
                </option>
              ))}
            </Select>
            <div className="sm:col-span-5 flex justify-end">
              <Button type="submit" disabled={!form.fecha_inicio || !form.fecha_fin || !form.id_cuenta}>
                Consultar Mayor
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {filtros === null && (
        <EmptyState
          title="Filtros requeridos"
          description="Selecciona una cuenta contable analítica y un rango de fechas para ver el reporte."
        />
      )}

      {filtros !== null && isLoading && (
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <Spinner /> Consultando libro mayor de la cuenta…
        </div>
      )}

      {filtros !== null && isError && (
        <p className="text-sm text-red-600">No se pudo cargar el reporte del Libro Mayor.</p>
      )}

      {filtros !== null && !isLoading && !isError && movimientos.length === 0 && (
        <div className="space-y-6">
          {/* Tarjetas de Saldo Inicial y Final */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardBody className="flex flex-col gap-1.5 py-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Saldo Inicial del Período
                </span>
                <span className="text-2xl font-bold tracking-tight text-ink">
                  {formatBs(saldoInicial)}
                </span>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="flex flex-col gap-1.5 py-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Saldo Final del Período
                </span>
                <span className="text-2xl font-bold tracking-tight text-ink">
                  {formatBs(saldoFinal)}
                </span>
              </CardBody>
            </Card>
          </div>

          <EmptyState
            title="Sin movimientos"
            description="La cuenta no registra transacciones en el rango de fechas seleccionado."
          />
        </div>
      )}

      {filtros !== null && !isLoading && !isError && movimientos.length > 0 && (
        <div className="space-y-6">
          {/* Tarjetas de Saldo Inicial y Final */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardBody className="flex flex-col gap-1.5 py-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Saldo Inicial del Período
                </span>
                <span className="text-2xl font-bold tracking-tight text-ink">
                  {formatBs(saldoInicial)}
                </span>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="flex flex-col gap-1.5 py-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Saldo Final del Período
                </span>
                <span className="text-2xl font-bold tracking-tight text-ink">
                  {formatBs(saldoFinal)}
                </span>
              </CardBody>
            </Card>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-soft">
              {isFetching ? 'Actualizando…' : `Mostrando ${movimientos.length} transacciones`}
            </span>
            <Button size="sm" variant="secondary" onClick={exportarPdf}>Exportar PDF</Button>
          </div>

          {/* Tabla de Movimientos */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-sunken text-left text-xs uppercase tracking-wide text-ink-soft border-b border-line">
                  <tr>
                    <th className="px-4 py-3 font-medium w-32">Fecha</th>
                    <th className="px-4 py-3 font-medium w-36">Nro. Asiento</th>
                    <th className="px-4 py-3 font-medium">Concepto</th>
                    <th className="px-4 py-3 text-right font-medium w-36">Debe</th>
                    <th className="px-4 py-3 text-right font-medium w-36">Haber</th>
                    <th className="px-4 py-3 text-right font-medium w-36 bg-surface-sunken/60">Saldo Acumulado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {movimientosConSaldo.map((mov, idx) => (
                    <tr key={idx} className="hover:bg-surface-muted/40">
                      <td className="px-4 py-3 whitespace-nowrap text-ink">
                        {formatFecha(mov.fecha)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-ink-muted">
                        {mov.numero_asiento || mov.asiento_numero}
                      </td>
                      <td className="px-4 py-3 text-ink">
                        {mov.concepto || mov.descripcion}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-ink font-medium">
                        {Number(mov.debe) > 0 ? formatBs(mov.debe) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-ink font-medium">
                        {Number(mov.haber) > 0 ? formatBs(mov.haber) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-ink font-semibold bg-surface-sunken/10">
                        {formatBs(mov.saldoAcumulado)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
