/**
 * Utilidades monetarias. Para evitar errores de coma flotante, los montos se
 * comparan y suman en centavos (enteros).
 */
export const toCents = (value) => Math.round(Number(value || 0) * 100);

export const sumCents = (items, key) =>
  items.reduce((acc, item) => acc + toCents(item[key]), 0);

export const centsToAmount = (cents) => Number((cents / 100).toFixed(2));
