'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('presupuesto', {
      id_presupuesto: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: Sequelize.STRING(120), allowNull: false },
      gestion: { type: Sequelize.INTEGER, allowNull: false },
      estado: {
        type: Sequelize.ENUM('BORRADOR', 'APROBADO', 'RECHAZADO'),
        allowNull: false,
        defaultValue: 'BORRADOR',
      },
      observacion: { type: Sequelize.TEXT, allowNull: true },
      id_empleado_creador: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'empleado', key: 'id_empleado' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      id_empleado_aprobador: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'empleado', key: 'id_empleado' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      fecha_aprobacion: { type: Sequelize.DATEONLY, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('linea_presupuesto', {
      id_linea_presupuesto: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_presupuesto: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'presupuesto', key: 'id_presupuesto' },
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
      monto_planificado: { type: Sequelize.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    });

    await queryInterface.addIndex('presupuesto', ['gestion']);
    await queryInterface.addIndex('presupuesto', ['estado']);
    await queryInterface.addIndex('linea_presupuesto', ['id_presupuesto']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('linea_presupuesto');
    await queryInterface.dropTable('presupuesto');
  },
};
