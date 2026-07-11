import { PageHeader, Card, CardHeader, CardTitle, CardBody, Badge, Spinner } from '../components/ui';
import { useDashboardGerencial } from '../queries/useDashboard.js';
import { formatBs, formatFecha } from '../lib/format.js';

function KpiCard({ title, value, subtitle, tone }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardBody>
        <p className={`text-2xl font-semibold ${tone === 'danger' ? 'text-red-600' : tone === 'success' ? 'text-green-600' : 'text-ink'}`}>{value}</p>
        {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
      </CardBody>
    </Card>
  );
}

// Dashboard gerencial (RF-REP-01): KPIs del negocio en tiempo real.
// Es una función del módulo General; se accede desde el menú, no en el login.
export function DashboardGerencial() {
  const { data, isLoading, isError } = useDashboardGerencial();

  return (
    <div>
      <PageHeader title="Dashboard gerencial" description="KPIs del negocio en tiempo real: ventas, compras, cuentas por pagar y stock." />

      {isLoading && <div className="flex items-center gap-2 text-sm text-ink-muted"><Spinner /> Cargando indicadores…</div>}
      {isError && <p className="text-sm text-red-600">No se pudieron cargar los indicadores.</p>}

      {data && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard title="Ventas de hoy" value={formatBs(data.ventas_hoy.total)} subtitle={`${data.ventas_hoy.cantidad} ventas · ${formatFecha(data.fecha)}`} tone="success" />
            <KpiCard title="Órdenes pendientes" value={data.ordenes_pendientes.cantidad} subtitle={`${formatBs(data.ordenes_pendientes.monto)} por recibir`} />
            <KpiCard title="Cuentas por pagar" value={formatBs(data.cuentas_por_pagar.saldo)} subtitle={`${data.cuentas_por_pagar.cantidad} deudas abiertas`} tone={data.cuentas_por_pagar.saldo > 0 ? 'danger' : undefined} />
            <KpiCard title="Utilidad del mes" value={formatBs(data.finanzas.utilidad_mes)} subtitle={`IVA neto ${formatBs(data.finanzas.iva_neto)}`} tone={data.finanzas.utilidad_mes >= 0 ? 'success' : 'danger'} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Stock bajo */}
            <Card>
              <CardHeader><CardTitle>Stock bajo el mínimo</CardTitle></CardHeader>
              <CardBody>
                {data.stock.bajo.length === 0 ? (
                  <p className="py-4 text-center text-sm text-ink-soft">Todo el stock está por encima del mínimo.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-wide text-ink-soft">
                      <tr><th className="py-2 font-medium">Producto</th><th className="py-2 text-right font-medium">Actual</th><th className="py-2 text-right font-medium">Mínimo</th></tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {data.stock.bajo.map((p) => (
                        <tr key={p.id_producto}>
                          <td className="py-2">{p.nombre}</td>
                          <td className="py-2 text-right tabular-nums"><Badge tone="danger">{p.stock_actual}</Badge></td>
                          <td className="py-2 text-right tabular-nums text-ink-muted">{p.stock_minimo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardBody>
            </Card>

            {/* Próximos a vencer */}
            <Card>
              <CardHeader><CardTitle>Lotes por vencer (≤ 30 días)</CardTitle></CardHeader>
              <CardBody>
                {data.stock.por_vencer.length === 0 ? (
                  <p className="py-4 text-center text-sm text-ink-soft">No hay lotes próximos a vencer.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-wide text-ink-soft">
                      <tr><th className="py-2 font-medium">Producto</th><th className="py-2 font-medium">Vence</th><th className="py-2 text-right font-medium">Cant.</th><th className="py-2 text-right font-medium">Días</th></tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {data.stock.por_vencer.map((l) => (
                        <tr key={l.id_lote}>
                          <td className="py-2">{l.producto}</td>
                          <td className="py-2">{formatFecha(l.fecha_vencimiento)}</td>
                          <td className="py-2 text-right tabular-nums">{l.cantidad_actual}</td>
                          <td className="py-2 text-right"><Badge tone={l.dias < 0 ? 'danger' : l.dias <= 7 ? 'warning' : 'neutral'}>{l.dias < 0 ? 'Vencido' : `${l.dias} d`}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
