import { useState } from 'react';
import { useBalanceGeneral } from '../queries/useReportes.js';
import {
  PageHeader,
  Card,
  CardBody,
  Button,
  Input,
  Select,
  Spinner,
  EmptyState,
  Badge,
} from '../components/ui';
import { formatBs } from '../lib/format.js';

function FilaBalance({ cuenta }) {
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
        <FilaBalance key={sub.id_cuenta || sub.codigo || idx} cuenta={sub} />
      ))}
      {cuenta.hijos?.map((sub, idx) => (
        <FilaBalance key={sub.id_cuenta || sub.codigo || idx} cuenta={sub} />
      ))}
    </>
  );
}

export function BalanceGeneral() {
  const [form, setForm] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    id_sucursal: '',
  });

  const [filtros, setFiltros] = useState(null);

  const { data, isLoading, isError, isFetching } = useBalanceGeneral(filtros || {}, {
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

  // Extraer datos soportando diferentes estructuras de respuesta
  const activo = data?.activo ?? {};
  const pasivo = data?.pasivo ?? {};
  const patrimonio = data?.patrimonio ?? {};

  const totalActivo = Number(activo.total ?? data?.total_activo ?? data?.totalActivo ?? 0);
  const totalPasivo = Number(pasivo.total ?? data?.total_pasivo ?? data?.totalPasivo ?? 0);
  const totalPatrimonio = Number(patrimonio.total ?? data?.total_patrimonio ?? data?.totalPatrimonio ?? 0);

  const totalPasivoMasPatrimonio = totalPasivo + totalPatrimonio;
  
  // Ecuación contable: Activo = Pasivo + Patrimonio
  // Usamos diferencia pequeña de centavos para tolerancia
  const descuadreVal = Math.abs(totalActivo - totalPasivoMasPatrimonio);
  const cuadraEcuacion = descuadreVal < 0.05;

  const activoCuentas = activo.cuentas ?? activo.subcuentas ?? activo.hijos ?? [];
  const pasivoCuentas = pasivo.cuentas ?? pasivo.subcuentas ?? pasivo.hijos ?? [];
  const patrimonioCuentas = patrimonio.cuentas ?? patrimonio.subcuentas ?? patrimonio.hijos ?? [];

  const tieneCuentas =
    activoCuentas.length > 0 || pasivoCuentas.length > 0 || patrimonioCuentas.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Balance General"
        description="Estado de situación financiera que muestra los activos, pasivos y patrimonio de la empresa."
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
              Generar Balance
            </Button>
          </form>
        </CardBody>
      </Card>

      {filtros === null && (
        <EmptyState
          title="Filtros requeridos"
          description="Selecciona un rango de fechas para generar el Balance General."
        />
      )}

      {filtros !== null && isLoading && (
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <Spinner /> Calculando Balance General…
        </div>
      )}

      {filtros !== null && isError && (
        <p className="text-sm text-red-600">No se pudo generar el reporte de Balance General.</p>
      )}

      {filtros !== null && !isLoading && !isError && !tieneCuentas && (
        <EmptyState
          title="Sin datos"
          description="No se registraron movimientos contables en el período seleccionado para armar el balance."
        />
      )}

      {filtros !== null && !isLoading && !isError && tieneCuentas && (
        <div className="space-y-6">
          <div className="flex justify-end items-center">
            <span className="text-xs text-ink-soft">
              {isFetching ? 'Actualizando…' : 'Reporte generado en tiempo real'}
            </span>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Columna Izquierda: Activos */}
            <div className="space-y-4">
              <Card>
                <div className="bg-surface-sunken border-b border-line px-5 py-4 flex justify-between items-center">
                  <h3 className="font-bold text-ink uppercase tracking-wide text-xs">1. Activo</h3>
                  <span className="font-bold text-ink text-sm">{formatBs(totalActivo)}</span>
                </div>
                <CardBody className="divide-y divide-line/30 py-2">
                  {activoCuentas.map((c, idx) => (
                    <FilaBalance key={c.id_cuenta || c.codigo || idx} cuenta={c} />
                  ))}
                </CardBody>
              </Card>
            </div>

            {/* Columna Derecha: Pasivos y Patrimonio */}
            <div className="space-y-6">
              {/* Pasivos */}
              <Card>
                <div className="bg-surface-sunken border-b border-line px-5 py-4 flex justify-between items-center">
                  <h3 className="font-bold text-ink uppercase tracking-wide text-xs">2. Pasivo</h3>
                  <span className="font-bold text-ink text-sm">{formatBs(totalPasivo)}</span>
                </div>
                <CardBody className="divide-y divide-line/30 py-2">
                  {pasivoCuentas.map((c, idx) => (
                    <FilaBalance key={c.id_cuenta || c.codigo || idx} cuenta={c} />
                  ))}
                </CardBody>
              </Card>

              {/* Patrimonio */}
              <Card>
                <div className="bg-surface-sunken border-b border-line px-5 py-4 flex justify-between items-center">
                  <h3 className="font-bold text-ink uppercase tracking-wide text-xs">3. Patrimonio</h3>
                  <span className="font-bold text-ink text-sm">{formatBs(totalPatrimonio)}</span>
                </div>
                <CardBody className="divide-y divide-line/30 py-2">
                  {patrimonioCuentas.map((c, idx) => (
                    <FilaBalance key={c.id_cuenta || c.codigo || idx} cuenta={c} />
                  ))}
                </CardBody>
              </Card>
            </div>
          </div>

          {/* Banner de Control Financiero / Ecuación Contable */}
          <Card className={cuadraEcuacion ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-200 bg-red-50/30'}>
            <CardBody className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4">
              <div>
                <h4 className="text-sm font-semibold text-ink">Ecuación de Control Financiero</h4>
                <p className="text-xs text-ink-muted mt-0.5">
                  Activo = Pasivo + Patrimonio (Partida Doble Institucional)
                </p>
              </div>
              <div className="flex flex-col sm:items-end gap-1.5">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-ink-muted">
                    {formatBs(totalActivo)} = {formatBs(totalPasivo)} + {formatBs(totalPatrimonio)}
                  </span>
                  <Badge tone={cuadraEcuacion ? 'success' : 'danger'}>
                    {cuadraEcuacion ? 'Cuadrado' : `Descuadrado: ${formatBs(descuadreVal)}`}
                  </Badge>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
