import { ApiError } from '../utils/ApiError.js';
import { categoriaRepository } from '../repositories/categoria.repository.js';

/** Reglas de categorías: el nombre es único. */
export function createCategoriaService({ repo = categoriaRepository } = {}) {
  return {
    listar() {
      return repo.findAll();
    },

    async crear(data) {
      if (await repo.findByNombre(data.nombre)) {
        throw ApiError.conflict(`Ya existe una categoría llamada ${data.nombre}`);
      }
      return repo.create(data);
    },
  };
}

export const categoriaService = createCategoriaService();
