'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cierre_contable', {
      id_cierre: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      periodo_anio: { type: Sequelize.INTEGER, allowNull: false },
      periodo_mes: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      id_sucursal: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'sucursal', key: 'id_sucursal' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      estado: { type: Sequelize.ENUM('ABIERTO', 'CERRADO'), allowNull: false, defaultValue: 'CERRADO' },
      fecha_cierre: { type: Sequelize.DATEONLY, allowNull: false },
      total_ingresos: { type: Sequelize.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      total_gastos: { type: Sequelize.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      resultado: { type: Sequelize.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      id_asiento_cierre: {
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

    await queryInterface.addConstraint('cierre_contable', {
      fields: ['periodo_anio', 'periodo_mes'],
      type: 'unique',
      name: 'uq_cierre_periodo',
    });
    await queryInterface.addIndex('cierre_contable', ['estado']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('cierre_contable');
  },
};
