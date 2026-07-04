import { ApiError } from '../utils/ApiError.js';
import { traspasoRepository } from '../repositories/traspaso.repository.js';
import { loteRepository } from '../repositories/lote.repository.js';
import { sucursalRepository } from '../repositories/sucursal.repository.js';

export function createTraspasoService({
  repo = traspasoRepository,
  loteRepo = loteRepository,
  sucursalRepo = sucursalRepository,
} = {}) {
  async function validarSucursal(id, nombre) {
    const s = await sucursalRepo.findById(id);
    if (!s) throw ApiError.badRequest(`La sucursal ${nombre} no existe`);
    if (s.estado !== 'ACTIVA') throw ApiError.conflict(`La sucursal ${nombre} no está activa`);
    return s;
  }

  function validarAccesoBodeguero(user, id_sucursal_origen, id_sucursal_destino, accion) {
    if (user.rol === 'GERENTE') return;
    const own = Number(user.id_sucursal);
    if (accion === 'crear' && Number(id_sucursal_origen) !== own) {
      throw ApiError.forbidden('No puede crear traspasos desde otra sucursal');
    }
    if (accion === 'enviar') {
      // Se valida en el caller con el traspaso
    }
    if (accion === 'recibir' && Number(id_sucursal_destino) !== own) {
      throw ApiError.forbidden('No puede recibir traspasos en otra sucursal');
    }
  }

  return {
    async listar(user) {
      const all = await repo.findAll();
      if (user.rol === 'GERENTE') return all;
      const own = Number(user.id_sucursal);
      return all.filter(
        (t) => Number(t.id_sucursal_origen) === own || Number(t.id_sucursal_destino) === own,
      );
    },

    async obtener(id, user) {
      const traspaso = await repo.findById(id);
      if (!traspaso) throw ApiError.notFound('Traspaso no encontrado');
      if (user.rol !== 'GERENTE') {
        const own = Number(user.id_sucursal);
        if (Number(traspaso.id_sucursal_origen) !== own && Number(traspaso.id_sucursal_destino) !== own) {
          throw ApiError.forbidden('No tiene permisos para ver este traspaso');
        }
      }
      return traspaso;
    },

    async crear({ id_sucursal_origen, id_sucursal_destino, motivo, detalles }, user) {
      if (Number(id_sucursal_origen) === Number(id_sucursal_destino)) {
        throw ApiError.badRequest('La sucursal origen y destino deben ser diferentes');
      }
      validarAccesoBodeguero(user, id_sucursal_origen, id_sucursal_destino, 'crear');
      await validarSucursal(id_sucursal_origen, 'origen');
      await validarSucursal(id_sucursal_destino, 'destino');

      // Consolidar lotes repetidos
      const consolidado = new Map();
      for (const d of detalles) {
        const key = d.id_lote;
        consolidado.set(key, (consolidado.get(key) || 0) + d.cantidad);
      }

      // Validar lotes
      for (const [id_lote, cantidad] of consolidado) {
        const lote = await loteRepo.findById(id_lote);
        if (!lote) throw ApiError.badRequest(`El lote ${id_lote} no existe`);
        if (Number(lote.id_sucursal) !== Number(id_sucursal_origen)) {
          throw ApiError.badRequest(`El lote ${id_lote} no pertenece a la sucursal origen`);
        }
        if (!lote.activo || lote.cantidad_actual <= 0) {
          throw ApiError.badRequest(`El lote ${id_lote} no tiene stock disponible`);
        }
        if (cantidad > lote.cantidad_actual) {
          throw ApiError.conflict(`Stock insuficiente para el lote ${id_lote}: disponible ${lote.cantidad_actual}, solicitado ${cantidad}`);
        }
      }

      const detallesArr = [...consolidado.entries()].map(([id_lote, cantidad]) => ({ id_lote, cantidad }));
      const traspaso = await repo.crear(
        { id_sucursal_origen, id_sucursal_destino, id_empleado: user.id, motivo, estado: 'PENDIENTE' },
        detallesArr,
      );
      return repo.findById(traspaso.id_traspaso);
    },

    async enviar(id, user) {
      const traspaso = await repo.findById(id);
      if (!traspaso) throw ApiError.notFound('Traspaso no encontrado');
      if (traspaso.estado !== 'PENDIENTE') {
        throw ApiError.conflict(`No se puede enviar un traspaso ${traspaso.estado}`);
      }
      if (user.rol !== 'GERENTE' && Number(traspaso.id_sucursal_origen) !== Number(user.id_sucursal)) {
        throw ApiError.forbidden('No puede enviar traspasos desde otra sucursal');
      }

      await repo.transaction(async (t) => {
        const detalles = await repo.findDetallesByTraspaso(id, t);
        for (const d of detalles) {
          const lote = await loteRepo.findByIdForUpdate(d.id_lote, t);
          if (!lote) throw ApiError.badRequest(`Lote ${d.id_lote} no encontrado`);
          if (lote.cantidad_actual < d.cantidad) {
            throw ApiError.conflict(`Stock insuficiente para lote ${d.id_lote}`);
          }
          const nueva = lote.cantidad_actual - d.cantidad;
          await loteRepo.actualizarCantidad(d.id_lote, nueva, nueva > 0, t);
        }
        await repo.actualizarEstado(id, { estado: 'EN_TRANSITO', fecha_envio: new Date() }, t);
      });

      return repo.findById(id);
    },

    async recibir(id, fecha_recepcion, user) {
      const traspaso = await repo.findById(id);
      if (!traspaso) throw ApiError.notFound('Traspaso no encontrado');
      if (traspaso.estado !== 'EN_TRANSITO') {
        throw ApiError.conflict(`No se puede recibir un traspaso ${traspaso.estado}`);
      }
      if (user.rol !== 'GERENTE' && Number(traspaso.id_sucursal_destino) !== Number(user.id_sucursal)) {
        throw ApiError.forbidden('No puede recibir traspasos en otra sucursal');
      }

      const fecha = fecha_recepcion || new Date().toISOString().slice(0, 10);

      await repo.transaction(async (t) => {
        const detalles = await repo.findDetallesByTraspaso(id, t);
        for (const d of detalles) {
          const origen = await loteRepo.findByIdWithProducto(d.id_lote, t);
          const nuevoLote = await loteRepo.crearDesdeTraspaso({
            id_producto: origen.id_producto,
            id_sucursal: traspaso.id_sucursal_destino,
            id_proveedor: null,
            numero_lote: origen.numero_lote,
            cantidad_inicial: d.cantidad,
            cantidad_actual: d.cantidad,
            fecha_vencimiento: origen.fecha_vencimiento,
            fecha_ingreso: fecha,
            activo: true,
          }, t);
          await repo.actualizarDetalle(d.id_detalle, { id_lote_destino: nuevoLote.id_lote }, t);
        }
        await repo.actualizarEstado(id, {
          estado: 'RECIBIDO',
          id_empleado_recibe: user.id,
          fecha_recepcion: new Date(),
        }, t);
      });

      return repo.findById(id);
    },

    async cancelar(id, user) {
      const traspaso = await repo.findById(id);
      if (!traspaso) throw ApiError.notFound('Traspaso no encontrado');
      if (traspaso.estado === 'RECIBIDO') {
        throw ApiError.conflict('No se puede cancelar un traspaso ya recibido');
      }
      if (traspaso.estado === 'CANCELADO') {
        throw ApiError.conflict('El traspaso ya está cancelado');
      }
      if (user.rol !== 'GERENTE') {
        if (Number(traspaso.id_sucursal_origen) !== Number(user.id_sucursal)) {
          throw ApiError.forbidden('No puede cancelar traspasos de otra sucursal');
        }
      }

      if (traspaso.estado === 'EN_TRANSITO') {
        await repo.transaction(async (t) => {
          const detalles = await repo.findDetallesByTraspaso(id, t);
          for (const d of detalles) {
            const lote = await loteRepo.findByIdForUpdate(d.id_lote, t);
            const nueva = lote.cantidad_actual + d.cantidad;
            await loteRepo.actualizarCantidad(d.id_lote, nueva, true, t);
          }
          await repo.actualizarEstado(id, { estado: 'CANCELADO' }, t);
        });
      } else {
        await repo.actualizarEstado(id, { estado: 'CANCELADO' });
      }

      return repo.findById(id);
    },
  };
}

export const traspasoService = createTraspasoService();
