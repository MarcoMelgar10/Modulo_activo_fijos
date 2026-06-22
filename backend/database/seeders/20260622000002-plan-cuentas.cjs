'use strict';

// Plan de cuentas base (Bolivia). Estructura jerárquica: las cuentas de detalle
// (hoja) permiten movimiento; las de agrupación, no.
const cuentas = [
  // id, codigo, nombre, tipo, padre, nivel, movimiento
  [1, '1', 'ACTIVO', 'ACTIVO', null, 1, false],
  [2, '1.1', 'Activo Corriente', 'ACTIVO', 1, 2, false],
  [3, '1.1.1', 'Caja', 'ACTIVO', 2, 3, true],
  [4, '1.1.2', 'Bancos', 'ACTIVO', 2, 3, true],
  [5, '1.1.3', 'Cuentas por Cobrar', 'ACTIVO', 2, 3, true],
  [6, '1.1.4', 'Inventario de Mercaderías', 'ACTIVO', 2, 3, true],
  [7, '1.1.5', 'IVA Crédito Fiscal', 'ACTIVO', 2, 3, true],
  [8, '1.2', 'Activo No Corriente', 'ACTIVO', 1, 2, false],
  [9, '1.2.1', 'Muebles y Enseres', 'ACTIVO', 8, 3, true],
  [10, '1.2.2', 'Equipos de Computación', 'ACTIVO', 8, 3, true],

  [11, '2', 'PASIVO', 'PASIVO', null, 1, false],
  [12, '2.1', 'Pasivo Corriente', 'PASIVO', 11, 2, false],
  [13, '2.1.1', 'Cuentas por Pagar', 'PASIVO', 12, 3, true],
  [14, '2.1.2', 'IVA Débito Fiscal', 'PASIVO', 12, 3, true],
  [15, '2.1.3', 'Impuestos por Pagar', 'PASIVO', 12, 3, true],
  [16, '2.1.4', 'Sueldos por Pagar', 'PASIVO', 12, 3, true],

  [17, '3', 'PATRIMONIO', 'PATRIMONIO', null, 1, false],
  [18, '3.1', 'Capital', 'PATRIMONIO', 17, 2, false],
  [19, '3.1.1', 'Capital Social', 'PATRIMONIO', 18, 3, true],
  [20, '3.2', 'Resultados', 'PATRIMONIO', 17, 2, false],
  [21, '3.2.1', 'Resultado del Ejercicio', 'PATRIMONIO', 20, 3, true],

  [22, '4', 'INGRESOS', 'INGRESO', null, 1, false],
  [23, '4.1', 'Ingresos Operativos', 'INGRESO', 22, 2, false],
  [24, '4.1.1', 'Ventas', 'INGRESO', 23, 3, true],
  [25, '4.1.2', 'Devoluciones sobre Ventas', 'INGRESO', 23, 3, true],

  [26, '5', 'EGRESOS', 'GASTO', null, 1, false],
  [27, '5.1', 'Costo de Ventas', 'GASTO', 26, 2, false],
  [28, '5.1.1', 'Costo de Mercadería Vendida', 'GASTO', 27, 3, true],
  [29, '5.2', 'Gastos Operativos', 'GASTO', 26, 2, false],
  [30, '5.2.1', 'Gastos de Administración', 'GASTO', 29, 3, true],
  [31, '5.2.2', 'Gastos de Comercialización', 'GASTO', 29, 3, true],
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const rows = cuentas.map(([id, codigo, nombre, tipo, padre, nivel, mov]) => ({
      id_cuenta: id,
      codigo,
      nombre,
      tipo,
      id_cuenta_padre: padre,
      nivel,
      permite_movimiento: mov,
      created_at: now,
    }));
    await queryInterface.bulkInsert('cuenta_contable', rows);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('cuenta_contable', null, {});
  },
};
