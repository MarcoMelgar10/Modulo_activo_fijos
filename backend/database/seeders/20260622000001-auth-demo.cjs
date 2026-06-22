'use strict';

const bcrypt = require('bcrypt');

const COST = Number(process.env.BCRYPT_COST || 10);

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('rol', [
      { id_rol: 1, nombre: 'GERENTE', descripcion: 'Acceso gerencial y reportes' },
      { id_rol: 2, nombre: 'CAJERO', descripcion: 'Punto de venta' },
      { id_rol: 3, nombre: 'BODEGUERO', descripcion: 'Inventario y bodegas' },
      { id_rol: 4, nombre: 'CONTADOR', descripcion: 'Contabilidad y finanzas' },
    ]);

    await queryInterface.bulkInsert('sucursal', [
      {
        id_sucursal: 1,
        nombre: 'Casa Matriz',
        ciudad: 'Santa Cruz de la Sierra',
        direccion: 'Av. Principal #100',
        telefono: '+59133000000',
        estado: 'ACTIVA',
        created_at: new Date(),
      },
    ]);

    const hash = (pwd) => bcrypt.hashSync(pwd, COST);

    await queryInterface.bulkInsert('empleado', [
      {
        id_empleado: 1,
        id_sucursal: 1,
        id_rol: 4, // CONTADOR
        nombre: 'Ana',
        apellido: 'Contadora',
        usuario: 'contador',
        password_hash: hash('Contador123'),
        activo: true,
        intentos_fallidos: 0,
        created_at: new Date(),
      },
      {
        id_empleado: 2,
        id_sucursal: 1,
        id_rol: 1, // GERENTE
        nombre: 'Luis',
        apellido: 'Gerente',
        usuario: 'gerente',
        password_hash: hash('Gerente123'),
        activo: true,
        intentos_fallidos: 0,
        created_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('empleado', null, {});
    await queryInterface.bulkDelete('sucursal', null, {});
    await queryInterface.bulkDelete('rol', null, {});
  },
};
