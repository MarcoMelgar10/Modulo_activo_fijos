'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rol', {
      id_rol: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      descripcion: { type: Sequelize.TEXT, allowNull: true },
    });

    await queryInterface.createTable('sucursal', {
      id_sucursal: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: Sequelize.STRING(100), allowNull: false },
      ciudad: { type: Sequelize.STRING(80), allowNull: false },
      direccion: { type: Sequelize.STRING(200), allowNull: false },
      telefono: { type: Sequelize.STRING(20), allowNull: true },
      estado: {
        type: Sequelize.ENUM('ACTIVA', 'INACTIVA', 'EN_MANTENIMIENTO'),
        allowNull: false,
        defaultValue: 'ACTIVA',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('empleado', {
      id_empleado: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_sucursal: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'sucursal', key: 'id_sucursal' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      id_rol: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'rol', key: 'id_rol' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      nombre: { type: Sequelize.STRING(100), allowNull: false },
      apellido: { type: Sequelize.STRING(100), allowNull: false },
      usuario: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      intentos_fallidos: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      bloqueado_hasta: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('log_auditoria', {
      id_log: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
      id_empleado: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'empleado', key: 'id_empleado' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      ip_address: { type: Sequelize.STRING(45), allowNull: true },
      fecha_hora: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      accion: { type: Sequelize.STRING(100), allowNull: false },
      modulo: { type: Sequelize.STRING(50), allowNull: false },
    });

    await queryInterface.addIndex('log_auditoria', ['id_empleado']);
    await queryInterface.addIndex('log_auditoria', ['modulo']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('log_auditoria');
    await queryInterface.dropTable('empleado');
    await queryInterface.dropTable('sucursal');
    await queryInterface.dropTable('rol');
  },
};
