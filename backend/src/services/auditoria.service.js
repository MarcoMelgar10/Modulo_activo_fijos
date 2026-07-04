import { auditoriaRepository } from '../repositories/auditoria.repository.js';

/**
 * Consulta del historial de auditoría (RF-REP-03). Solo lectura: el registro de
 * acciones lo escribe `audit.service.js`; aquí se consulta el log inmutable.
 */
export function createAuditoriaService({ repo = auditoriaRepository } = {}) {
  return {
    listar(filtros) {
      return repo.findAll(filtros);
    },
    listarModulos() {
      return repo.findModulos();
    },
  };
}

export const auditoriaService = createAuditoriaService();
