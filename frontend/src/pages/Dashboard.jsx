import { useQuery } from '@tanstack/react-query';
import { PageHeader, Card, CardHeader, CardTitle, CardBody, Badge, Spinner } from '../components/ui';

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

export function Dashboard() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['health'], queryFn: fetchHealth });

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Panel del módulo de Contabilidad. Los indicadores contables se añadirán en la Etapa 8."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Estado del sistema</CardTitle>
          </CardHeader>
          <CardBody>
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-ink-muted">
                <Spinner /> Verificando…
              </div>
            )}
            {isError && <p className="text-sm text-red-600">No se pudo contactar al backend.</p>}
            {data && (
              <div className="divide-y divide-line">
                <StatusRow label="API" value={data.checks?.server} />
                <StatusRow label="Base de datos (MySQL)" value={data.checks?.database} />
                <StatusRow label="Caché (Redis)" value={data.checks?.redis} />
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
