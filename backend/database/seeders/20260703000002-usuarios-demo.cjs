'use strict';

const bcrypt = require('bcrypt');

const COST = Number(process.env.BCRYPT_COST || 10);

// Usuarios demo adicionales para probar el acceso por rol (POS e inventario/compras).
// Roles del seeder de auth: 1 GERENTE · 2 CAJERO · 3 BODEGUERO · 4 CONTADOR.
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const hash = (pwd) => bcrypt.hashSync(pwd, COST);
    await queryInterface.bulkInsert('empleado', [
      {
        id_empleado: 3,
        id_sucursal: 1,
        id_rol: 2, // CAJERO
        nombre: 'Carla',
        apellido: 'Cajera',
        usuario: 'cajero',
        password_hash: hash('Cajero123'),
        activo: true,
        intentos_fallidos: 0,
        created_at: new Date(),
      },
      {
        id_empleado: 4,
        id_sucursal: 1,
        id_rol: 3, // BODEGUERO
        nombre: 'Beto',
        apellido: 'Bodeguero',
        usuario: 'bodeguero',
        password_hash: hash('Bodeguero123'),
        activo: true,
        intentos_fallidos: 0,
        created_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('empleado', { usuario: ['cajero', 'bodeguero'] }, {});
  },
};
