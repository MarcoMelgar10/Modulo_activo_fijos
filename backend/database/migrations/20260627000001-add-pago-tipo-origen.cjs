'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE asiento_contable
      MODIFY COLUMN tipo_origen
        ENUM('VENTA','COMPRA','DEVOLUCION','PAGO','MANUAL','CIERRE')
        NOT NULL DEFAULT 'MANUAL'
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE asiento_contable
      MODIFY COLUMN tipo_origen
        ENUM('VENTA','COMPRA','DEVOLUCION','MANUAL','CIERRE')
        NOT NULL DEFAULT 'MANUAL'
    `);
  },
};
