'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('proveedor', {
      id_proveedor: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      razon_social: { type: Sequelize.STRING(150), allowNull: false },
      nit: { type: Sequelize.STRING(20), allowNull: false, unique: true },
      contacto: { type: Sequelize.STRING(100), allowNull: true },
      telefono: { type: Sequelize.STRING(20), allowNull: true },
      email: { type: Sequelize.STRING(120), allowNull: true },
      ciudad: { type: Sequelize.STRING(80), allowNull: true },
      activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addIndex('proveedor', ['activo']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('proveedor');
  },
};
