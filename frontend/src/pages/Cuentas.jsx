import { useState } from 'react';
import { useArbolCuentas, useCuentasPlanas, useCrearCuenta } from '../queries/useCuentas.js';
import {
  PageHeader,
  Card,
  Button,
  Input,
  Select,
  Modal,
  Badge,
  Spinner,
  EmptyState,
} from '../components/ui';

const tonoTipo = {
  ACTIVO: 'accent',
  PASIVO: 'warning',
  PATRIMONIO: 'neutral',
  INGRESO: 'success',
  GASTO: 'danger',
};

function FilaCuenta({ cuenta }) {
  const indent = (cuenta.nivel - 1) * 20;
  return (
    <>
      <div
        className="flex items-center justify-between border-b border-line px-4 py-2.5 last:border-0 hover:bg-surface-muted"
        style={{ paddingLeft: 16 + indent }}
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-ink-soft">{cuenta.codigo}</span>
          <span className={cuenta.nivel === 1 ? 'text-sm font-semibold text-ink' : 'text-sm text-ink'}>
            {cuenta.nombre}
          </span>
          {cuenta.permite_movimiento && <Badge tone="neutral">movimiento</Badge>}
        </div>
        <Badge tone={tonoTipo[cuenta.tipo]}>{cuenta.tipo}</Badge>
      </div>
      {cuenta.subcuentas?.map((sub) => (
        <FilaCuenta key={sub.id_cuenta} cuenta={sub} />
      ))}
    </>
  );
}

function NuevaCuentaModal({ open, onClose }) {
  const { data: planas = [] } = useCuentasPlanas();
  const crear = useCrearCuenta();
  const [form, setForm] = useState({ codigo: '', nombre: '', id_cuenta_padre: '', tipo: 'ACTIVO' });
  const [error, setError] = useState(null);

  const submit = async () => {
    setError(null);
    const payload = {
      codigo: form.codigo.trim(),
      nombre: form.nombre.trim(),
      ...(form.id_cuenta_padre
        ? { id_cuenta_padre: Number(form.id_cuenta_padre) }
        : { tipo: form.tipo }),
    };
    try {
      await crear.mutateAsync(payload);
      setForm({ codigo: '', nombre: '', id_cuenta_padre: '', tipo: 'ACTIVO' });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear la cuenta');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nueva cuenta"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={crear.isPending || !form.codigo || !form.nombre}>
            {crear.isPending ? 'Guardando…' : 'Guardar'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          id="codigo"
          label="Código"
          placeholder="1.1.6"
          value={form.codigo}
          onChange={(e) => setForm({ ...form, codigo: e.target.value })}
        />
        <Input
          id="nombre"
          label="Nombre"
          placeholder="Nombre de la cuenta"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
        />
        <Select
          id="padre"
          label="Cuenta padre (opcional)"
          value={form.id_cuenta_padre}
          onChange={(e) => setForm({ ...form, id_cuenta_padre: e.target.value })}
        >
          <option value="">— Cuenta raíz —</option>
          {planas
            .filter((c) => !c.permite_movimiento)
            .map((c) => (
              <option key={c.id_cuenta} value={c.id_cuenta}>
                {c.codigo} · {c.nombre}
              </option>
            ))}
        </Select>
        {!form.id_cuenta_padre && (
          <Select
            id="tipo"
            label="Tipo (solo cuentas raíz)"
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
          >
            {['ACTIVO', 'PASIVO', 'PATRIMONIO', 'INGRESO', 'GASTO'].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        )}
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </div>
    </Modal>
  );
}

export function Cuentas() {
  const { data: arbol, isLoading, isError } = useArbolCuentas();
  const [open, setOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Plan de cuentas"
        description="Estructura jerárquica de cuentas contables (plan boliviano)."
        actions={<Button onClick={() => setOpen(true)}>Nueva cuenta</Button>}
      />

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <Spinner /> Cargando cuentas…
        </div>
      )}
      {isError && <p className="text-sm text-red-600">No se pudieron cargar las cuentas.</p>}
      {arbol && arbol.length === 0 && <EmptyState title="Sin cuentas registradas" />}
      {arbol && arbol.length > 0 && (
        <Card>
          {arbol.map((c) => (
            <FilaCuenta key={c.id_cuenta} cuenta={c} />
          ))}
        </Card>
      )}

      <NuevaCuentaModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
