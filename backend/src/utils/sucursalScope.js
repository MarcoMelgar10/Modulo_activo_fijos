import { ApiError } from './ApiError.js';

export function isGerente(user) {
  return user?.rol === 'GERENTE';
}

export function isContador(user) {
  return user?.rol === 'CONTADOR';
}

export function requireSucursalOperativa(user, requestedId) {
  if (!user) throw ApiError.unauthorized();
  if (isGerente(user)) return requestedId ? Number(requestedId) : Number(user.id_sucursal);
  const own = Number(user.id_sucursal);
  if (requestedId && Number(requestedId) !== own) {
    throw ApiError.forbidden('No tiene permisos para operar en otra sucursal');
  }
  return own;
}

export function scopeSucursalLectura(user, requestedId, { allowConsolidado = false } = {}) {
  if (!user) throw ApiError.unauthorized();
  if (isGerente(user) || (allowConsolidado && isContador(user))) {
    return requestedId ? Number(requestedId) : undefined;
  }
  return Number(user.id_sucursal);
}
