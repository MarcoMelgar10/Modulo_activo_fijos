'use strict';

const SUCURSALES = [
  { id_sucursal: 1, nombre: 'Casa Matriz Santa Cruz', ciudad: 'Santa Cruz', direccion: 'Av. Principal #100', telefono: '+59133000001' },
  { id_sucursal: 2, nombre: 'Santa Cruz Norte', ciudad: 'Santa Cruz', direccion: 'Av. Banzer km 5', telefono: '+59133000002' },
  { id_sucursal: 3, nombre: 'Santa Cruz Sur', ciudad: 'Santa Cruz', direccion: 'Av. Santos Dumont', telefono: '+59133000003' },
  { id_sucursal: 4, nombre: 'Santa Cruz Equipetrol', ciudad: 'Santa Cruz', direccion: 'Equipetrol Norte', telefono: '+59133000004' },
  { id_sucursal: 5, nombre: 'La Paz Centro', ciudad: 'La Paz', direccion: 'Av. Mariscal Santa Cruz #100', telefono: '+59122000005' },
  { id_sucursal: 6, nombre: 'La Paz Sur', ciudad: 'La Paz', direccion: 'Av. Buenos Aires', telefono: '+59122000006' },
  { id_sucursal: 7, nombre: 'Sucre Central', ciudad: 'Sucre', direccion: 'Calle Anzurez #50', telefono: '+59146400007' },
  { id_sucursal: 8, nombre: 'Cochabamba Central', ciudad: 'Cochabamba', direccion: 'Av. Heroínas #200', telefono: '+59144200008' },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    for (const s of SUCURSALES) {
      const [rows] = await queryInterface.sequelize.query(
        'SELECT id_sucursal FROM sucursal WHERE id_sucursal = ?',
        { replacements: [s.id_sucursal] },
      );
      if (rows.length === 0) {
        await queryInterface.bulkInsert('sucursal', [{
          ...s,
          estado: 'ACTIVA',
          created_at: new Date(),
        }]);
      } else {
        await queryInterface.bulkUpdate('sucursal', {
          nombre: s.nombre,
          ciudad: s.ciudad,
          direccion: s.direccion,
          telefono: s.telefono,
        }, { id_sucursal: s.id_sucursal });
      }
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('sucursal', {
      id_sucursal: { [Sequelize.Op.in]: [2, 3, 4, 5, 6, 7, 8] },
    });
  },
};
