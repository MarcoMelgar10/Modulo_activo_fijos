import { useMemo, useState } from 'react';
import { useLibroDiario } from '../queries/useLibros.js';
import {
  PageHeader,
  Card,
  CardBody,
  Button,
  Input,
  Select,
  Badge,
  Spinner,
  EmptyState,
} from '../components/ui';
import { formatBs, formatFecha } from '../lib/format.js';
import { exportarPDF, pdfBs } from '../lib/pdf.js';

export function LibroDiario() {
  const [form, setForm] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    id_sucursal: '',
  });

  const [filtros, setFiltros] = useState(null);

  // El query solo se activa cuando filtros no es null.
  const { data, isLoading, isError, isFetching } = useLibroDiario(filtros || {}, {
    enabled: filtros !== null,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.fecha_inicio || !form.fecha_fin) return;
    setFiltros({
      fecha_inicio: form.fecha_inicio,
      fecha_fin: form.fecha_fin,
      id_sucursal: form.id_sucursal ? Number(form.id_sucursal) : undefined,
    });
  };

  const totalDebe = data?.totales?.total_debe ?? 0;
  const totalHaber = data?.totales?.total_haber ?? 0;
  const cuadrado = data?.totales?.cuadrado ?? false;

  // El backend devuelve una lista plana de líneas (`registros`), cada una con su
  // asiento anidado. La vista es jerárquica (asiento → líneas), así que aquí se
  // agrupan las líneas por asiento conservando el orden cronológico del backend.
  const asientos = useMemo(() => {
    const registros = data?.registros ?? [];
    const porAsiento = new Map();
    for (const r of registros) {
      const a = r.asiento;
      if (!a) continue;
      if (!porAsiento.has(a.id_asiento)) {
        porAsiento.set(a.id_asiento, { ...a, lineas: [] });
      }
      porAsiento.get(a.id_asiento).lineas.push({
        id_linea: r.id_linea,
        debe: r.debe,
        haber: r.haber,
        descripcion: r.descripcion,
        cuenta: r.cuenta,
      });
    }
    return [...porAsiento.values()];
  }, [data]);

  const exportarPdf = () =>
    exportarPDF({
      titulo: 'Libro Diario',
      subtitulo: `Del ${filtros.fecha_inicio} al ${filtros.fecha_fin}`,
      columnas: ['Fecha', 'Asiento', 'Cuenta', 'Detalle', 'Debe', 'Haber'],
      filas: asientos.flatMap((a) =>
        (a.lineas ?? []).map((l) => [
          formatFecha(a.fecha),
          a.numero_asiento,
          `${l.cuenta?.codigo ?? ''} ${l.cuenta?.nombre ?? ''}`.trim(),
          l.descripcion ?? a.concepto ?? '',
          Number(l.debe) > 0 ? pdfBs(l.debe) : '',
          Number(l.haber) > 0 ? pdfBs(l.haber) : '',
        ]),
      ),
      resumen: [`Total Debe: ${pdfBs(totalDebe)}`, `Total Haber: ${pdfBs(totalHaber)}`, `Estado: ${cuadrado ? 'Cuadrado' : 'Descuadrado'}`],
      archivo: `libro-diario-${filtros.fecha_inicio}_${filtros.fecha_fin}`,
    });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Libro Diario"
        description="Listado cronológico de asientos contables y sus transacciones en partida doble."
      />

      <Card>
        <CardBody>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-4 sm:items-end">
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
              label="Sucursal"
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
            <Button type="submit" disabled={!form.fecha_inicio || !form.fecha_fin}>
              Generar Reporte
            </Button>
          </form>
        </CardBody>
      </Card>

      {filtros === null && (
        <EmptyState
          title="Filtros requeridos"
          description="Selecciona un rango de fechas para visualizar los movimientos del Libro Diario."
        />
      )}

      {filtros !== null && isLoading && (
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <Spinner /> Generando reporte del Libro Diario…
        </div>
      )}

      {filtros !== null && isError && (
        <p className="text-sm text-red-600">No se pudo cargar el reporte del Libro Diario.</p>
      )}

      {filtros !== null && !isLoading && !isError && asientos.length === 0 && (
        <EmptyState
          title="Sin registros"
          description="No se encontraron asientos confirmados para el período y filtros seleccionados."
        />
      )}

      {filtros !== null && !isLoading && !isError && asientos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-soft">
              {isFetching ? 'Actualizando…' : `Mostrando ${asientos.length} asientos`}
            </span>
            <div className="flex items-center gap-3">
              <Button size="sm" variant="secondary" onClick={exportarPdf}>Exportar PDF</Button>
              <Badge tone={cuadrado ? 'success' : 'danger'}>
                {cuadrado ? 'Cuadrado' : 'Descuadrado'}
              </Badge>
            </div>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-sunken text-left text-xs uppercase tracking-wide text-ink-soft border-b border-line">
                  <tr>
                    <th className="px-4 py-3 font-medium w-48">Fecha / Asiento</th>
                    <th className="px-4 py-3 font-medium">Cuenta Contable</th>
                    <th className="px-4 py-3 font-medium">Concepto / Glosa</th>
                    <th className="px-4 py-3 text-right font-medium w-36">Debe</th>
                    <th className="px-4 py-3 text-right font-medium w-36">Haber</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {asientos.map((asiento) => (
                    <tr key={asiento.id_asiento || asiento.numero_asiento} className="hover:bg-surface-muted/40">
                      <td className="px-4 py-3 font-medium">
                        <div className="text-ink">{formatFecha(asiento.fecha)}</div>
                        <div className="text-xs text-ink-muted font-mono">{asiento.numero_asiento}</div>
                      </td>
                      <td className="px-4 py-3" colSpan={4}>
                        <div className="font-medium text-ink mb-2">{asiento.concepto}</div>
                        <table className="w-full text-xs">
                          <tbody>
                            {asiento.lineas?.map((linea, index) => {
                              const cod = linea.cuenta?.codigo || linea.codigo_cuenta || linea.codigo || '';
                              const nom = linea.cuenta?.nombre || linea.nombre_cuenta || linea.nombre || '';
                              const desc = linea.descripcion || '';
                              const debe = Number(linea.debe || 0);
                              const haber = Number(linea.haber || 0);

                              return (
                                <tr key={index} className="border-t border-line/50 first:border-0 hover:bg-surface-sunken/40">
                                  <td className="py-2 pr-4 font-mono text-ink-muted w-48">
                                    {cod} · {nom}
                                  </td>
                                  <td className="py-2 text-ink-soft">
                                    {desc}
                                  </td>
                                  <td className="py-2 text-right tabular-nums text-ink font-medium w-36">
                                    {debe > 0 ? formatBs(debe) : ''}
                                  </td>
                                  <td className="py-2 text-right tabular-nums text-ink font-medium w-36">
                                    {haber > 0 ? formatBs(haber) : ''}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-surface-sunken border-t border-line font-semibold text-ink">
                  <tr>
                    <td className="px-4 py-3 text-right" colSpan={3}>
                      Totales del Periodo
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatBs(totalDebe)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatBs(totalHaber)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
