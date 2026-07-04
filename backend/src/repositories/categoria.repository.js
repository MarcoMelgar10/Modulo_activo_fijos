import { Categoria } from '../models/index.js';

export const categoriaRepository = {
  findAll() {
    return Categoria.findAll({ order: [['nombre', 'ASC']] });
  },

  findById(id) {
    return Categoria.findByPk(id);
  },

  findByNombre(nombre) {
    return Categoria.findOne({ where: { nombre } });
  },

  create(data) {
    return Categoria.create(data);
  },
};
