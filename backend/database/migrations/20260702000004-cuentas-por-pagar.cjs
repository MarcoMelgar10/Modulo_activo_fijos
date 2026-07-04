'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cuenta_por_pagar', {
      id_cxp: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_proveedor: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'proveedor', key: 'id_proveedor' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      id_orden: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'orden_compra', key: 'id_orden' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      id_sucursal: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'sucursal', key: 'id_sucursal' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      monto_total: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      saldo_pendiente: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      estado: {
        type: Sequelize.ENUM('PENDIENTE', 'PARCIAL', 'PAGADA'),
        allowNull: false,
        defaultValue: 'PENDIENTE',
      },
      fecha_emision: { type: Sequelize.DATEONLY, allowNull: false },
      fecha_vencimiento: { type: Sequelize.DATEONLY, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('pago_proveedor', {
      id_pago: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_cxp: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'cuenta_por_pagar', key: 'id_cxp' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      monto: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      fecha_pago: { type: Sequelize.DATEONLY, allowNull: false },
      metodo_pago: {
        type: Sequelize.ENUM('EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', 'TARJETA'),
        allowNull: false,
        defaultValue: 'EFECTIVO',
      },
      id_asiento: {
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

    await queryInterface.addIndex('cuenta_por_pagar', ['estado']);
    await queryInterface.addIndex('cuenta_por_pagar', ['id_proveedor']);
    await queryInterface.addIndex('pago_proveedor', ['id_cxp']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('pago_proveedor');
    await queryInterface.dropTable('cuenta_por_pagar');
  },
};
