'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orden_compra', {
      id_orden: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_proveedor: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'proveedor', key: 'id_proveedor' },
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
      numero_orden: { type: Sequelize.STRING(20), allowNull: false, unique: true },
      fecha_emision: { type: Sequelize.DATEONLY, allowNull: false },
      condicion_pago: {
        type: Sequelize.ENUM('CONTADO', 'CREDITO'),
        allowNull: false,
        defaultValue: 'CREDITO',
      },
      estado: {
        type: Sequelize.ENUM('BORRADOR', 'ENVIADA', 'RECIBIDA', 'CANCELADA'),
        allowNull: false,
        defaultValue: 'BORRADOR',
      },
      monto_total: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      fecha_recepcion: { type: Sequelize.DATEONLY, allowNull: true },
      id_asiento_compra: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'asiento_contable', key: 'id_asiento' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      id_empleado: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'empleado', key: 'id_empleado' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('detalle_orden_compra', {
      id_detalle_oc: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_orden: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'orden_compra', key: 'id_orden' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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

    await queryInterface.addIndex('orden_compra', ['estado']);
    await queryInterface.addIndex('orden_compra', ['id_proveedor']);
    await queryInterface.addIndex('detalle_orden_compra', ['id_orden']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('detalle_orden_compra');
    await queryInterface.dropTable('orden_compra');
  },
};
