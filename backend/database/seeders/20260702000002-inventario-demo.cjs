'use strict';

// Categorías y productos demo para poder armar órdenes de compra de inmediato.
const categorias = [
  [1, 'Lácteos', 'Leche, yogurt, quesos y derivados'],
  [2, 'Bebidas', 'Gaseosas, aguas y jugos'],
  [3, 'Abarrotes', 'Productos secos y no perecederos'],
];

// id, id_categoria, codigo_barras, nombre, unidad, precio_compra, precio_venta, stock_minimo
const productos = [
  [1, 1, '7770001000011', 'Leche entera 1L', 'UND', 6.0, 8.0, 20],
  [2, 1, '7770001000028', 'Yogurt frutilla 1L', 'UND', 9.0, 12.0, 15],
  [3, 2, '7770002000010', 'Gaseosa cola 2L', 'UND', 8.0, 11.0, 24],
  [4, 2, '7770002000027', 'Agua mineral 2L', 'UND', 3.5, 5.0, 30],
  [5, 3, '7770003000017', 'Arroz grano oro 1Kg', 'KG', 6.5, 9.0, 40],
  [6, 3, '7770003000024', 'Aceite girasol 900ml', 'UND', 12.0, 16.0, 18],
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert(
      'categoria',
      categorias.map(([id_categoria, nombre, descripcion]) => ({ id_categoria, nombre, descripcion })),
    );

    await queryInterface.bulkInsert(
      'producto',
      productos.map(
        ([id_producto, id_categoria, codigo_barras, nombre, unidad_medida, precio_compra, precio_venta, stock_minimo]) => ({
          id_producto,
          id_categoria,
          codigo_barras,
          nombre,
          unidad_medida,
          precio_compra,
          precio_venta,
          stock_minimo,
          activo: true,
        }),
      ),
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('producto', null, {});
    await queryInterface.bulkDelete('categoria', null, {});
  },
};
