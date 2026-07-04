'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ---- Categoría (§3.6.2.1) ----
    await queryInterface.createTable('categoria', {
      id_categoria: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: Sequelize.STRING(80), allowNull: false, unique: true },
      descripcion: { type: Sequelize.STRING(200), allowNull: true },
    });

    // ---- Producto (§3.6.2.2) ----
    await queryInterface.createTable('producto', {
      id_producto: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_categoria: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'categoria', key: 'id_categoria' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      codigo_barras: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      nombre: { type: Sequelize.STRING(150), allowNull: false },
      unidad_medida: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'UND' },
      precio_compra: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      precio_venta: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      stock_minimo: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 5 },
      activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
    });

    // ---- Lote (§3.6.2.4) ----
    await queryInterface.createTable('lote', {
      id_lote: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_producto: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'producto', key: 'id_producto' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      id_sucursal: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'sucursal', key: 'id_sucursal' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      id_proveedor: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'proveedor', key: 'id_proveedor' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      numero_lote: { type: Sequelize.STRING(50), allowNull: false },
      cantidad_inicial: { type: Sequelize.INTEGER, allowNull: false },
      cantidad_actual: { type: Sequelize.INTEGER, allowNull: false },
      fecha_vencimiento: { type: Sequelize.DATEONLY, allowNull: false },
      fecha_ingreso: { type: Sequelize.DATEONLY, allowNull: false },
      activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
    });

    await queryInterface.addIndex('producto', ['id_categoria']);
    await queryInterface.addIndex('producto', ['activo']);
    await queryInterface.addIndex('lote', ['id_producto']);
    await queryInterface.addIndex('lote', ['id_sucursal']);
    await queryInterface.addIndex('lote', ['fecha_vencimiento']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('lote');
    await queryInterface.dropTable('producto');
    await queryInterface.dropTable('categoria');
  },
};
