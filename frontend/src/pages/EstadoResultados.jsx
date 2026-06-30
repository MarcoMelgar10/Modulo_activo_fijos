import { useState } from 'react';
import { useEstadoResultados } from '../queries/useReportes.js';
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
import { formatBs } from '../lib/format.js';

function FilaResultados({ cuenta }) {
  const paddingMap = {
    1: 'pl-0 font-bold text-ink text-sm',
    2: 'pl-4 font-semibold text-ink-muted text-sm',
    3: 'pl-8 text-ink-muted text-sm',
    4: 'pl-12 text-ink-soft text-xs',
    5: 'pl-16 text-ink-soft text-xs',
  };

  const cssClase = paddingMap[cuenta.nivel] || 'pl-0 text-sm';
  const saldoVal = Number(cuenta.saldo ?? cuenta.monto ?? cuenta.total ?? 0);

  return (
    <>
      <div className="flex items-center justify-between py-2.5 border-b border-line/40 hover:bg-surface-muted/50">
        <div className={`flex items-center gap-3 ${cssClase}`}>
          <span className="font-mono text-xs text-ink-soft">{cuenta.codigo}</span>
          <span>{cuenta.nombre}</span>
        </div>
        <span className="font-medium tabular-nums text-ink text-sm">
          {formatBs(saldoVal)}
        </span>
      </div>
      {cuenta.subcuentas?.map((sub, idx) => (
        <FilaResultados key={sub.id_cuenta || sub.codigo || idx} cuenta={sub} />
      ))}
      {cuenta.hijos?.map((sub, idx) => (
        <FilaResultados key={sub.id_cuenta || sub.codigo || idx} cuenta={sub} />
      ))}
    </>
  );
}

export function EstadoResultados() {
  const [form, setForm] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    id_sucursal: '',
  });

  const [filtros, setFiltros] = useState(null);

  const { data, isLoading, isError, isFetching } = useEstadoResultados(filtros || {}, {
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

  const ingresos = data?.ingresos ?? {};
  const gastos = data?.gastos ?? {};

  const totalIngresos = Number(ingresos.total ?? data?.total_ingresos ?? data?.totalIngresos ?? 0);
  const totalGastos = Number(gastos.total ?? data?.total_gastos ?? data?.totalGastos ?? 0);

  // El resultado neto es Ingresos - Gastos.
  const resultadoNeto = Number(data?.resultadoNeto ?? data?.resultado_neto ?? (totalIngresos - totalGastos));
  const esUtilidad = resultadoNeto >= 0;

  const ingresosCuentas = ingresos.cuentas ?? ingresos.subcuentas ?? ingresos.hijos ?? [];
  const gastosCuentas = gastos.cuentas ?? gastos.subcuentas ?? gastos.hijos ?? [];

  const tieneCuentas = ingresosCuentas.length > 0 || gastosCuentas.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estado de Resultados"
        description="Muestra el resumen de ingresos y gastos devengados para determinar la utilidad o pérdida del ejercicio."
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
            <Button type="submit" disabled={!form.fecha_inicio || !form.fecha_fin}>
              Generar Reporte
            </Button>
          </form>
        </CardBody>
      </Card>

      {filtros === null && (
        <EmptyState
          title="Filtros requeridos"
          description="Selecciona un rango de fechas para generar el Estado de Resultados."
        />
      )}

      {filtros !== null && isLoading && (
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <Spinner /> Calculando Estado de Resultados…
        </div>
      )}

      {filtros !== null && isError && (
        <p className="text-sm text-red-600">No se pudo generar el reporte de Estado de Resultados.</p>
      )}

      {filtros !== null && !isLoading && !isError && !tieneCuentas && (
        <EmptyState
          title="Sin datos"
          description="No se registraron ingresos ni gastos en el período y sucursal seleccionados."
        />
      )}

      {filtros !== null && !isLoading && !isError && tieneCuentas && (
        <div className="space-y-6">
          <div className="flex justify-end items-center">
            <span className="text-xs text-ink-soft">
              {isFetching ? 'Actualizando…' : 'Reporte generado en tiempo real'}
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Ingresos */}
            <Card>
              <div className="bg-surface-sunken border-b border-line px-5 py-4 flex justify-between items-center">
                <h3 className="font-bold text-ink uppercase tracking-wide text-xs">Ingresos Operacionales</h3>
                <span className="font-bold text-ink text-sm">{formatBs(totalIngresos)}</span>
              </div>
              <CardBody className="divide-y divide-line/30 py-2">
                {ingresosCuentas.length === 0 ? (
                  <p className="text-xs text-ink-soft py-4 text-center">Sin cuentas de ingreso en este periodo</p>
                ) : (
                  ingresosCuentas.map((c, idx) => (
                    <FilaResultados key={c.id_cuenta || c.codigo || idx} cuenta={c} />
                  ))
                )}
              </CardBody>
            </Card>

            {/* Gastos */}
            <Card>
              <div className="bg-surface-sunken border-b border-line px-5 py-4 flex justify-between items-center">
                <h3 className="font-bold text-ink uppercase tracking-wide text-xs">Gastos de Operación</h3>
                <span className="font-bold text-ink text-sm">{formatBs(totalGastos)}</span>
              </div>
              <CardBody className="divide-y divide-line/30 py-2">
                {gastosCuentas.length === 0 ? (
                  <p className="text-xs text-ink-soft py-4 text-center">Sin cuentas de gasto en este periodo</p>
                ) : (
                  gastosCuentas.map((c, idx) => (
                    <FilaResultados key={c.id_cuenta || c.codigo || idx} cuenta={c} />
                  ))
                )}
              </CardBody>
            </Card>
          </div>

          {/* Resultado Neto de la Gestión */}
          <Card className={esUtilidad ? 'border-emerald-200 bg-emerald-50/20' : 'border-line bg-surface-sunken/40'}>
            <CardBody className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-6">
              <div>
                <h4 className="text-sm font-semibold text-ink">Neto del Ejercicio</h4>
                <p className="text-xs text-ink-muted mt-0.5">
                  Resultado acumulado de la gestión tras deducir los gastos de los ingresos
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft mb-1">
                  {esUtilidad ? 'Utilidad de la Gestión' : 'Pérdida de la Gestión'}
                </p>
                <p className={`text-2xl font-bold tracking-tight ${esUtilidad ? 'text-emerald-700' : 'text-ink'}`}>
                  {formatBs(resultadoNeto)}
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
