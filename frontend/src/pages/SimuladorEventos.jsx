import { useState } from 'react';
import { useSimularEvento } from '../queries/useEventos.js';
import {
  PageHeader,
  Card,
  CardBody,
  CardTitle,
  Button,
  Input,
  Select,
  Modal,
  Badge,
} from '../components/ui';
import { formatBs } from '../lib/format.js';

// Lista de eventos predefinidos para simulación
const EVENTOS_ERP = [
  {
    tipo: 'VENTA_POS',
    titulo: 'Ventas POS',
    descripcion: 'Simula el registro de ventas diarias de la tienda. Afecta cuentas de Caja/Banco e Ingresos.',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    iconSvg: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
  {
    tipo: 'COMPRA_ALMACEN',
    titulo: 'Compras de Almacén',
    descripcion: 'Simula la adquisición de inventario o suministros de oficina. Afecta cuentas de Inventario e Impuestos.',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    iconSvg: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    tipo: 'DEVOLUCION_CLIENTE',
    titulo: 'Devolución de Cliente',
    descripcion: 'Simula la devolución de productos vendidos. Afecta cuentas de Devoluciones e Inventario.',
    color: 'bg-amber-50 text-amber-700 border-amber-100',
    iconSvg: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18" />
      </svg>
    ),
  },
  {
    tipo: 'PAGO_PROVEEDOR',
    titulo: 'Pago a Proveedores',
    descripcion: 'Simula el egreso de efectivo para cancelar saldos comerciales pendientes. Afecta cuentas por Pagar y Caja.',
    color: 'bg-red-50 text-red-700 border-red-100',
    iconSvg: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
];

export function SimuladorEventos() {
  const simular = useSimularEvento();

  // Estados de control
  const [selectedEvento, setSelectedEvento] = useState(null); // Evento seleccionado para abrir el modal
  const [montoBruto, setMontoBruto] = useState('');
  const [sucursalId, setSucursalId] = useState('1');
  const [error, setError] = useState(null);
  const [exitoAsiento, setExitoAsiento] = useState(null); // Detalle del asiento contable creado

  const handleOpenModal = (evento) => {
    setSelectedEvento(evento);
    setMontoBruto('');
    setSucursalId('1');
    setError(null);
    setExitoAsiento(null);
  };

  const handleCloseModal = () => {
    if (simular.isPending) return;
    setSelectedEvento(null);
    setExitoAsiento(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!montoBruto || Number(montoBruto) <= 0) {
      setError('Por favor, ingresa un monto bruto válido mayor a cero.');
      return;
    }

    setError(null);
    setExitoAsiento(null);

    const payload = {
      tipo_evento: selectedEvento.tipo,
      monto_bruto: Number(montoBruto),
      sucursal_id: Number(sucursalId),
    };

    try {
      const res = await simular.mutateAsync(payload);
      // El backend retorna el asiento contable autogenerado
      const asientoGenerado = res?.asiento ?? res?.asientoGenerado ?? {};
      setExitoAsiento(asientoGenerado);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar la simulación en el servidor.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Simulador de Eventos ERP"
        description="Panel de pruebas académicas para disparar transacciones automáticas e integrarlas en la contabilidad."
      />

      <div className="grid gap-6 sm:grid-cols-2">
        {EVENTOS_ERP.map((ev) => (
          <Card
            key={ev.tipo}
            className="cursor-pointer hover:border-accent-500/40 hover:shadow-md transition-all flex flex-col justify-between"
            onClick={() => handleOpenModal(ev)}
          >
            <CardBody className="flex gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border ${ev.color}`}>
                {ev.iconSvg}
              </div>
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold">{ev.titulo}</CardTitle>
                <p className="text-sm text-ink-muted leading-relaxed">{ev.descripcion}</p>
              </div>
            </CardBody>
            <div className="border-t border-line/40 px-5 py-3 flex justify-end bg-surface-muted/30">
              <span className="text-xs font-semibold text-accent-600 group-hover:text-accent-700">
                Simular transacción →
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal de Simulación */}
      <Modal
        open={selectedEvento !== null}
        onClose={handleCloseModal}
        title={`Simulador ERP: ${selectedEvento?.titulo}`}
        footer={
          exitoAsiento ? (
            <Button onClick={handleCloseModal}>Cerrar</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={handleCloseModal} disabled={simular.isPending}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={simular.isPending || !montoBruto}>
                {simular.isPending ? 'Procesando…' : 'Ejecutar Simulación'}
              </Button>
            </>
          )
        }
      >
        {!exitoAsiento ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-ink-muted leading-relaxed">
              Define los parámetros del evento comercial. El backend calculará el IVA, cargos
              adicionales y generará el asiento de partida doble balanceado.
            </p>

            <Input
              id="monto_bruto"
              label="Monto Bruto (Bs) *"
              type="number"
              min="0.01"
              step="0.01"
              required
              placeholder="Ej. 1500.00"
              value={montoBruto}
              onChange={(e) => setMontoBruto(e.target.value)}
              disabled={simular.isPending}
            />

            <Select
              id="sucursal_id"
              label="Sucursal *"
              required
              value={sucursalId}
              onChange={(e) => setSucursalId(e.target.value)}
              disabled={simular.isPending}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <option key={num} value={num}>
                  Sucursal {num}
                </option>
              ))}
            </Select>

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </form>
        ) : (
          <div className="space-y-4">
            {/* Mensaje de Éxito Limpio */}
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/20 p-4">
              <div className="flex gap-3">
                <svg className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-emerald-900">Transacción Procesada con Éxito</h4>
                  <p className="text-xs text-emerald-800">
                    Se ha generado e integrado de forma automática un asiento contable en el sistema.
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-line border border-line rounded-lg overflow-hidden text-sm bg-surface">
              <div className="px-4 py-2.5 flex justify-between bg-surface-sunken/40">
                <span className="font-semibold text-ink-muted">Número de Asiento:</span>
                <span className="font-mono font-bold text-ink">{exitoAsiento.numero_asiento}</span>
              </div>
              <div className="px-4 py-2.5 flex justify-between">
                <span className="font-semibold text-ink-muted">Concepto:</span>
                <span className="text-ink text-right max-w-xs">{exitoAsiento.concepto}</span>
              </div>
              <div className="px-4 py-2.5 flex justify-between bg-surface-sunken/10">
                <span className="font-semibold text-ink-muted">Total Transacción:</span>
                <span className="font-bold text-emerald-700">
                  {formatBs(exitoAsiento.lineas?.reduce((acc, curr) => acc + Number(curr.debe || 0), 0) ?? 0)}
                </span>
              </div>
            </div>

            <p className="text-xs text-ink-soft text-center leading-relaxed mt-2">
              Los reportes de Libro Diario, Libro Mayor y Estados Financieros han sido actualizados automáticamente.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
