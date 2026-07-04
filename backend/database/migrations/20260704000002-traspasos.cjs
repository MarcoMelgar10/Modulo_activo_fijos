'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('traspaso', {
      id_traspaso: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_sucursal_origen: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'sucursal', key: 'id_sucursal' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      id_sucursal_destino: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'sucursal', key: 'id_sucursal' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      id_empleado: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'empleado', key: 'id_empleado' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      id_empleado_recibe: {
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: 'empleado', key: 'id_empleado' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      estado: {
        type: Sequelize.ENUM('PENDIENTE', 'EN_TRANSITO', 'RECIBIDO', 'CANCELADO'),
        allowNull: false, defaultValue: 'PENDIENTE',
      },
      motivo: { type: Sequelize.STRING(250), allowNull: true },
      fecha_creacion: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      fecha_envio: { type: Sequelize.DATE, allowNull: true },
      fecha_recepcion: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('traspaso', ['id_sucursal_origen']);
    await queryInterface.addIndex('traspaso', ['id_sucursal_destino']);
    await queryInterface.addIndex('traspaso', ['estado']);
    await queryInterface.addIndex('traspaso', ['fecha_creacion']);

    await queryInterface.createTable('detalle_traspaso', {
      id_detalle: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_traspaso: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'traspaso', key: 'id_traspaso' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      id_lote: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'lote', key: 'id_lote' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      id_lote_destino: {
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: 'lote', key: 'id_lote' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      cantidad: { type: Sequelize.INTEGER, allowNull: false },
    });

    await queryInterface.addIndex('detalle_traspaso', ['id_traspaso']);
    await queryInterface.addIndex('detalle_traspaso', ['id_lote']);
    await queryInterface.addIndex('detalle_traspaso', ['id_lote_destino']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('detalle_traspaso');
    await queryInterface.dropTable('traspaso');
  },
};
