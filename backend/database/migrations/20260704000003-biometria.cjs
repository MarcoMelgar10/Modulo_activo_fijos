'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('dispositivo_biometrico', {
      dispositivo_id: { type: Sequelize.STRING(50), primaryKey: true },
      id_sucursal: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'sucursal', key: 'id_sucursal' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      nombre: { type: Sequelize.STRING(100), allowNull: false },
      ubicacion: { type: Sequelize.STRING(150), allowNull: true },
      secret_hash: { type: Sequelize.STRING(255), allowNull: false },
      activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('dispositivo_biometrico', ['id_sucursal']);
    await queryInterface.addIndex('dispositivo_biometrico', ['activo']);

    await queryInterface.createTable('acceso_biometrico', {
      id_acceso: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
      id_empleado: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'empleado', key: 'id_empleado' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      id_sucursal: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'sucursal', key: 'id_sucursal' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      fecha_hora: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      tipo_movimiento: { type: Sequelize.ENUM('ENTRADA', 'SALIDA'), allowNull: false },
      resultado: { type: Sequelize.BOOLEAN, allowNull: false },
      dispositivo_id: {
        type: Sequelize.STRING(50), allowNull: false,
        references: { model: 'dispositivo_biometrico', key: 'dispositivo_id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('acceso_biometrico', ['id_empleado']);
    await queryInterface.addIndex('acceso_biometrico', ['id_sucursal']);
    await queryInterface.addIndex('acceso_biometrico', ['dispositivo_id']);
    await queryInterface.addIndex('acceso_biometrico', ['fecha_hora']);
    await queryInterface.addIndex('acceso_biometrico', ['id_sucursal', 'fecha_hora']);
    await queryInterface.addIndex('acceso_biometrico', ['resultado', 'fecha_hora']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('acceso_biometrico');
    await queryInterface.dropTable('dispositivo_biometrico');
  },
};
