const bs = new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatBs = (value) => `Bs ${bs.format(Number(value || 0))}`;

export const formatFecha = (value) => {
  if (!value) return '';
  const d = typeof value === 'string' ? value.slice(0, 10) : value;
  return d;
};
