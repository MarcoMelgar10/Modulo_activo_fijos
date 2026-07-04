'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('venta', {
      id_venta: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_sucursal: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'sucursal', key: 'id_sucursal' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      id_cajero: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'empleado', key: 'id_empleado' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      numero_venta: { type: Sequelize.STRING(20), allowNull: false, unique: true },
      fecha: { type: Sequelize.DATEONLY, allowNull: false },
      monto_subtotal: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      monto_descuento: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      monto_total: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      metodo_pago: {
        type: Sequelize.ENUM('EFECTIVO', 'TARJETA_DEBITO', 'TARJETA_CREDITO', 'QR'),
        allowNull: false,
        defaultValue: 'EFECTIVO',
      },
      estado: {
        type: Sequelize.ENUM('COMPLETADA', 'ANULADA', 'DEVOLUCION_PARCIAL'),
        allowNull: false,
        defaultValue: 'COMPLETADA',
      },
      id_asiento_venta: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'asiento_contable', key: 'id_asiento' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      fecha_hora: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('detalle_venta', {
      id_detalle: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_venta: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'venta', key: 'id_venta' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      id_lote: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'lote', key: 'id_lote' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      id_producto: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'producto', key: 'id_producto' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      cantidad: { type: Sequelize.INTEGER, allowNull: false },
      precio_unitario: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      subtotal: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
    });

    await queryInterface.createTable('devolucion', {
      id_devolucion: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_venta: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'venta', key: 'id_venta' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      id_empleado: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'empleado', key: 'id_empleado' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      fecha: { type: Sequelize.DATEONLY, allowNull: false },
      motivo: { type: Sequelize.TEXT, allowNull: false },
      monto_total: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      id_asiento_devolucion: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'asiento_contable', key: 'id_asiento' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('detalle_devolucion', {
      id_detalle_dev: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_devolucion: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'devolucion', key: 'id_devolucion' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      id_detalle_venta: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'detalle_venta', key: 'id_detalle' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      cantidad_dev: { type: Sequelize.INTEGER, allowNull: false },
    });

    await queryInterface.addIndex('venta', ['fecha']);
    await queryInterface.addIndex('venta', ['id_sucursal']);
    await queryInterface.addIndex('venta', ['id_cajero']);
    await queryInterface.addIndex('venta', ['estado']);
    await queryInterface.addIndex('detalle_venta', ['id_venta']);
    await queryInterface.addIndex('detalle_venta', ['id_producto']);
    await queryInterface.addIndex('devolucion', ['id_venta']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('detalle_devolucion');
    await queryInterface.dropTable('devolucion');
    await queryInterface.dropTable('detalle_venta');
    await queryInterface.dropTable('venta');
  },
};
