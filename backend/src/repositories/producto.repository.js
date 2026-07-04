import { Producto, Categoria } from '../models/index.js';

const categoriaInclude = {
  model: Categoria,
  as: 'categoria',
  attributes: ['id_categoria', 'nombre'],
};

export const productoRepository = {
  findAll({ activo, id_categoria } = {}) {
    const where = {};
    if (activo !== undefined) where.activo = activo;
    if (id_categoria) where.id_categoria = id_categoria;
    return Producto.findAll({
      where,
      include: [categoriaInclude],
      order: [['nombre', 'ASC']],
    });
  },

  findById(id) {
    return Producto.findByPk(id, { include: [categoriaInclude] });
  },

  findByCodigoBarras(codigo_barras) {
    return Producto.findOne({ where: { codigo_barras } });
  },

  findByIds(ids) {
    return Producto.findAll({ where: { id_producto: ids } });
  },

  create(data) {
    return Producto.create(data);
  },
};
