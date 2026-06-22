'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cuenta_contable', {
      id_cuenta: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      codigo: { type: Sequelize.STRING(20), allowNull: false, unique: true },
      nombre: { type: Sequelize.STRING(150), allowNull: false },
      tipo: {
        type: Sequelize.ENUM('ACTIVO', 'PASIVO', 'PATRIMONIO', 'INGRESO', 'GASTO'),
        allowNull: false,
      },
      id_cuenta_padre: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'cuenta_contable', key: 'id_cuenta' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      nivel: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      permite_movimiento: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addIndex('cuenta_contable', ['id_cuenta_padre']);
    await queryInterface.addIndex('cuenta_contable', ['tipo']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('cuenta_contable');
  },
};
