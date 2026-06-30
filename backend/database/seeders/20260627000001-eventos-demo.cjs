'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // ---- Idempotencia: no insertar si ya existen asientos automáticos ----
    const [existing] = await queryInterface.sequelize.query(
      `SELECT COUNT(*) AS cnt FROM asiento_contable WHERE tipo_origen IN ('VENTA','COMPRA','DEVOLUCION','PAGO')`,
    );
    if (Number(existing[0].cnt) > 0) return;

    // ---- Resolver cuentas por código (nunca hardcodear IDs) ----
    const codigos = ['1.1.1', '1.1.4', '1.1.5', '2.1.1', '2.1.2', '4.1.1'];
    const [cuentasRaw] = await queryInterface.sequelize.query(
      `SELECT id_cuenta, codigo FROM cuenta_contable WHERE codigo IN (${codigos.map((c) => `'${c}'`).join(',')})`,
    );
    const c = Object.fromEntries(cuentasRaw.map((r) => [r.codigo, r.id_cuenta]));

    // Verificar que todas las cuentas existan.
    for (const cod of codigos) {
      if (!c[cod]) throw new Error(`Seeder: cuenta ${cod} no encontrada. Ejecute primero el seeder del plan de cuentas.`);
    }

    // ---- Numeración correlativa ----
    const [countRes] = await queryInterface.sequelize.query(
      `SELECT COUNT(*) AS cnt FROM asiento_contable WHERE numero_asiento LIKE 'AST-2026-%'`,
    );
    let seq = Number(countRes[0].cnt);
    const nextNum = () => `AST-2026-${String(++seq).padStart(5, '0')}`;

    // ---- Helpers monetarios (centavos → sin residuo) ----
    const toCents = (v) => Math.round(Number(v) * 100);
    const toAmount = (cents) => (cents / 100).toFixed(2);

    const now = new Date();
    const fecha = '2026-06-15';

    // ---- Definición de los 4 eventos demo ----
    const eventos = [
      {
        numero: nextNum(),
        concepto: 'Venta de mercadería — Ticket POS #1001',
        tipo_origen: 'VENTA',
        id_referencia: 1001,
        monto: 1000,
      },
      {
        numero: nextNum(),
        concepto: 'Compra de mercadería — OC #501',
        tipo_origen: 'COMPRA',
        id_referencia: 501,
        monto: 5000,
      },
      {
        numero: nextNum(),
        concepto: 'Devolución de venta — NC #201',
        tipo_origen: 'DEVOLUCION',
        id_referencia: 201,
        monto: 200,
      },
      {
        numero: nextNum(),
        concepto: 'Pago a proveedor — OP #301',
        tipo_origen: 'PAGO',
        id_referencia: 301,
        monto: 3000,
      },
    ];

    for (const ev of eventos) {
      // Insertar cabecera del asiento.
      await queryInterface.bulkInsert('asiento_contable', [
        {
          id_sucursal: 1,
          numero_asiento: ev.numero,
          fecha,
          concepto: ev.concepto,
          tipo_origen: ev.tipo_origen,
          id_referencia: ev.id_referencia,
          estado: 'CONFIRMADO',
          created_at: now,
        },
      ]);

      // Obtener el ID recién creado.
      const [[{ id }]] = await queryInterface.sequelize.query(
        `SELECT id_asiento AS id FROM asiento_contable WHERE numero_asiento = '${ev.numero}'`,
      );

      // Calcular montos con aritmética de centavos.
      const totalCents = toCents(ev.monto);
      const ivaCents = Math.round((totalCents * 13) / 100);
      const netoCents = totalCents - ivaCents;
      const total = toAmount(totalCents);
      const neto = toAmount(netoCents);
      const iva = toAmount(ivaCents);

      // Construir líneas según tipo de evento.
      let lineas;
      switch (ev.tipo_origen) {
        case 'VENTA':
          lineas = [
            { id_asiento: id, id_cuenta: c['1.1.1'], descripcion: 'Cobro en caja', debe: total, haber: 0 },
            { id_asiento: id, id_cuenta: c['4.1.1'], descripcion: 'Ingreso por ventas', debe: 0, haber: neto },
            { id_asiento: id, id_cuenta: c['2.1.2'], descripcion: 'IVA Débito Fiscal 13%', debe: 0, haber: iva },
          ];
          break;
        case 'COMPRA':
          lineas = [
            { id_asiento: id, id_cuenta: c['1.1.4'], descripcion: 'Ingreso de mercadería', debe: neto, haber: 0 },
            { id_asiento: id, id_cuenta: c['1.1.5'], descripcion: 'IVA Crédito Fiscal 13%', debe: iva, haber: 0 },
            { id_asiento: id, id_cuenta: c['1.1.1'], descripcion: 'Pago en efectivo', debe: 0, haber: total },
          ];
          break;
        case 'DEVOLUCION':
          lineas = [
            { id_asiento: id, id_cuenta: c['4.1.1'], descripcion: 'Reverso de ingreso', debe: neto, haber: 0 },
            { id_asiento: id, id_cuenta: c['2.1.2'], descripcion: 'Reverso IVA Débito Fiscal', debe: iva, haber: 0 },
            { id_asiento: id, id_cuenta: c['1.1.1'], descripcion: 'Devolución al cliente', debe: 0, haber: total },
          ];
          break;
        case 'PAGO':
          lineas = [
            { id_asiento: id, id_cuenta: c['2.1.1'], descripcion: 'Cancelación de deuda', debe: total, haber: 0 },
            { id_asiento: id, id_cuenta: c['1.1.1'], descripcion: 'Egreso de caja', debe: 0, haber: total },
          ];
          break;
      }

      await queryInterface.bulkInsert('linea_asiento', lineas);
    }
  },

  async down(queryInterface) {
    // Las líneas se eliminan en cascada (FK ON DELETE CASCADE).
    await queryInterface.sequelize.query(
      `DELETE FROM asiento_contable WHERE tipo_origen IN ('VENTA','COMPRA','DEVOLUCION','PAGO')`,
    );
  },
};
