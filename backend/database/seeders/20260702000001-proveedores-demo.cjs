'use strict';

// Proveedores demo para poder crear órdenes de compra de inmediato.
const proveedores = [
  [1, 'Distribuidora La Paz S.R.L.', '1023456789', 'Juan Pérez', '+59122000001', 'ventas@dlp.bo', 'La Paz'],
  [2, 'Alimentos del Sur S.A.', '2098765432', 'María Gómez', '+59133000002', 'contacto@alsur.bo', 'Santa Cruz'],
  [3, 'Bebidas Andinas Ltda.', '3055512345', 'Carlos Rojas', '+59144000003', 'compras@bandinas.bo', 'Cochabamba'],
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const rows = proveedores.map(([id, razon_social, nit, contacto, telefono, email, ciudad]) => ({
      id_proveedor: id,
      razon_social,
      nit,
      contacto,
      telefono,
      email,
      ciudad,
      activo: true,
      created_at: now,
    }));
    await queryInterface.bulkInsert('proveedor', rows);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('proveedor', null, {});
  },
};
