import { PageHeader, EmptyState } from '../components/ui';

export function Placeholder({ title, etapa }) {
  return (
    <div>
      <PageHeader title={title} />
      <EmptyState
        title="Sección en construcción"
        description={`Esta funcionalidad se entrega en la ${etapa} del plan de desarrollo.`}
      />
    </div>
  );
}
