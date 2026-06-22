/**
 * Envuelve un handler async de Express para que los errores se deleguen
 * automáticamente al middleware de errores, evitando try/catch repetidos.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
