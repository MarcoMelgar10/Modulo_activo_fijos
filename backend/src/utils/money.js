/**
 * Utilidades monetarias. Para evitar errores de coma flotante, los montos se
 * comparan y suman en centavos (enteros).
 */
export const toCents = (value) => Math.round(Number(value || 0) * 100);

export const sumCents = (items, key) =>
  items.reduce((acc, item) => acc + toCents(item[key]), 0);

export const centsToAmount = (cents) => Number((cents / 100).toFixed(2));

/** Tasa de IVA boliviano. */
export const IVA_RATE = 13;

/**
 * Descompone un monto que ya incluye IVA (cálculo "por dentro", Bolivia 13%).
 * Garantiza neto + iva === total (sin residuo de redondeo).
 */
export function ivaPorDentro(montoTotal) {
  const totalCents = toCents(montoTotal);
  const ivaCents = Math.round((totalCents * IVA_RATE) / 100);
  const netoCents = totalCents - ivaCents;
  return {
    total: centsToAmount(totalCents),
    neto: centsToAmount(netoCents),
    iva: centsToAmount(ivaCents),
  };
}
