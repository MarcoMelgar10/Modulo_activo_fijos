'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('asiento_contable', {
      id_asiento: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_sucursal: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'sucursal', key: 'id_sucursal' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      numero_asiento: { type: Sequelize.STRING(20), allowNull: false, unique: true },
      fecha: { type: Sequelize.DATEONLY, allowNull: false },
      concepto: { type: Sequelize.TEXT, allowNull: false },
      tipo_origen: {
        type: Sequelize.ENUM('VENTA', 'COMPRA', 'DEVOLUCION', 'MANUAL', 'CIERRE'),
        allowNull: false,
        defaultValue: 'MANUAL',
      },
      id_referencia: { type: Sequelize.INTEGER, allowNull: true },
      estado: {
        type: Sequelize.ENUM('BORRADOR', 'CONFIRMADO', 'ANULADO'),
        allowNull: false,
        defaultValue: 'BORRADOR',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('linea_asiento', {
      id_linea: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_asiento: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'asiento_contable', key: 'id_asiento' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      id_cuenta: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'cuenta_contable', key: 'id_cuenta' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      descripcion: { type: Sequelize.STRING(200), allowNull: true },
      debe: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      haber: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    });

    await queryInterface.addIndex('asiento_contable', ['fecha']);
    await queryInterface.addIndex('asiento_contable', ['estado']);
    await queryInterface.addIndex('asiento_contable', ['tipo_origen', 'id_referencia']);
    await queryInterface.addIndex('linea_asiento', ['id_asiento']);
    await queryInterface.addIndex('linea_asiento', ['id_cuenta']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('linea_asiento');
    await queryInterface.dropTable('asiento_contable');
  },
};
