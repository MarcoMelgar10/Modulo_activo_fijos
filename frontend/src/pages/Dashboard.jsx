import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader, Card, CardHeader, CardTitle, CardBody, Badge, Spinner, Select } from '../components/ui';
import { useDashboard } from '../queries/useDashboard.js';
import { formatBs } from '../lib/format.js';

const MESES = [
  { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' }, { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' }, { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
];

async function fetchHealth() {
  const res = await fetch('/health');
  return res.json();
}

function StatusRow({ label, value }) {
  const ok = value === 'ok';
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-ink-muted">{label}</span>
      <Badge tone={ok ? 'success' : 'danger'}>{ok ? 'Operativo' : 'Caído'}</Badge>
    </div>
  );
}

function KpiCard({ title, value, subtitle, tone }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardBody>
        <p className={`text-2xl font-semibold ${tone === 'danger' ? 'text-red-600' : tone === 'success' ? 'text-green-600' : 'text-ink'}`}>
          {value}
        </p>
        {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
      </CardBody>
    </Card>
  );
}

export function Dashboard() {
  const now = new Date();
  const [gestion] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);

  const { data: health, isLoading: healthLoading, isError: healthError } = useQuery({ queryKey: ['health'], queryFn: fetchHealth });
  const { data: kpis, isLoading: kpiLoading } = useDashboard({ gestion, mes });

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Resumen del módulo de Contabilidad y Finanzas."
      />

      {/* Selector de mes */}
      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm text-ink-muted">Período:</span>
        <Select value={mes} onChange={(e) => setMes(Number(e.target.value))}>
          {MESES.map((m) => (
            <option key={m.value} value={m.value}>{m.label} {gestion}</option>
          ))}
        </Select>
      </div>

      {/* KPIs fiscales */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {kpiLoading ? (
          <div className="col-span-4 flex items-center gap-2 text-sm text-ink-muted">
            <Spinner /> Cargando indicadores…
          </div>
        ) : kpis && (
          <>
            <KpiCard title="Utilidad del ejercicio" value={formatBs(kpis.utilidad_ejercicio)} subtitle={`Gestión ${gestion}`} />
            <KpiCard title="IVA Débito Fiscal" value={formatBs(kpis.iva_debito)} subtitle={`${MESES[mes - 1].label}`} />
            <KpiCard title="IVA Crédito Fiscal" value={formatBs(kpis.iva_credito)} subtitle={`${MESES[mes - 1].label}`} />
            <KpiCard
              title="IVA Neto a pagar"
              value={formatBs(Math.abs(kpis.iva_neto))}
              subtitle={kpis.iva_neto >= 0 ? 'A favor del fisco' : 'A favor de la empresa'}
              tone={kpis.iva_neto >= 0 ? 'danger' : 'success'}
            />
          </>
        )}
      </div>

      {/* Estado del sistema + cierre */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Estado del sistema</CardTitle>
          </CardHeader>
          <CardBody>
            {healthLoading && (
              <div className="flex items-center gap-2 text-sm text-ink-muted">
                <Spinner /> Verificando…
              </div>
            )}
            {healthError && <p className="text-sm text-red-600">No se pudo contactar al backend.</p>}
            {health && (
              <div className="divide-y divide-line">
                <StatusRow label="API" value={health.checks?.server} />
                <StatusRow label="Base de datos (MySQL)" value={health.checks?.database} />
                <StatusRow label="Caché (Redis)" value={health.checks?.redis} />
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cierre de gestión</CardTitle>
          </CardHeader>
          <CardBody>
            {kpiLoading ? (
              <div className="flex items-center gap-2 text-sm text-ink-muted">
                <Spinner /> Verificando…
              </div>
            ) : kpis && (
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-ink-muted">Gestión {gestion}</span>
                <Badge tone={kpis.cierre_estado === 'ABIERTO' ? 'success' : 'warning'}>
                  {kpis.cierre_estado}
                </Badge>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
