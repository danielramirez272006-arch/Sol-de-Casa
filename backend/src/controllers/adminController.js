import { AhorroService } from '../services/ahorroService.js';
import { DashboardService } from '../services/dashboardService.js';
import { query } from '../config/db.js';
import { RecompensasService } from '../services/recompensasService.js';
import { SolicitudesService } from '../services/solicitudesService.js';

export class AdminController {
  /**
   * Vista 5: Panel de Andrés
   * Devuelve métricas completas, desglose real vs simulado y capacidad disponible vs demanda.
   */
  static async getResumenDashboard(req, res, next) {
    try {
      const tecnicos = Number(req.query.tecnicosAdicionales) || 0;
      const resumen = await DashboardService.obtenerResumenAndres({ tecnicosAdicionales: tecnicos });
      res.json({ ok: true, data: resumen });
    } catch (err) {
      next(err);
    }
  }

  static async getSolicitudes(req, res, next) {
    try {
      const { familiaId, estado, limit, offset } = req.query;
      const solicitudes = await SolicitudesService.listar({
        familiaId: familiaId ? Number(familiaId) : null,
        estado: estado || null,
        limit: limit ? Number(limit) : 50,
        offset: offset ? Number(offset) : 0
      });
      res.json({ ok: true, data: solicitudes });
    } catch (err) {
      next(err);
    }
  }

  static async patchEstadoSolicitud(req, res, next) {
    try {
      const { id } = req.params;
      const { nuevoEstado, notas, fechaProgramada } = req.body;

      const resultado = await SolicitudesService.cambiarEstado(Number(id), nuevoEstado, {
        notas,
        fechaProgramada,
        adminUsuarioId: req.user.id
      });

      res.json({ ok: true, data: resultado });
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  }

  static async postConfirmarVenta(req, res, next) {
    try {
      const { solicitudId, montoTotalUsd, costoEmpresaRecompensa, valorPercibidoRecompensa } = req.body;

      const resultado = await RecompensasService.confirmarVentaYGenerarRecompensa({
        solicitudId: Number(solicitudId),
        montoTotalUsd: montoTotalUsd ? Number(montoTotalUsd) : undefined,
        costoEmpresaRecompensa: costoEmpresaRecompensa ? Number(costoEmpresaRecompensa) : undefined,
        valorPercibidoRecompensa: valorPercibidoRecompensa ? Number(valorPercibidoRecompensa) : undefined,
        adminUsuarioId: req.user.id
      });

      res.json({ ok: true, data: resultado });
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  }

  static async patchEstadoRecompensa(req, res, next) {
    try {
      const { id } = req.params;
      const { nuevoEstado, notas } = req.body;

      const resultado = await RecompensasService.actualizarEstadoRecompensa(Number(id), nuevoEstado, {
        notas,
        adminUsuarioId: req.user.id
      });

      res.json({ ok: true, data: resultado });
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  }

  static async postAhorroMensual(req, res, next) {
    try {
      const { familiaId, periodo, ahorroUsd, reciboRedUsd, generacionKwh, tipoRegistro, notas } = req.body;

      const resultado = await AhorroService.guardarRegistroMensual({
        familiaId: Number(familiaId),
        periodo,
        ahorroUsd: Number(ahorroUsd),
        reciboRedUsd: reciboRedUsd !== undefined && reciboRedUsd !== null ? Number(reciboRedUsd) : null,
        generacionKwh: generacionKwh !== undefined && generacionKwh !== null ? Number(generacionKwh) : null,
        tipoRegistro: tipoRegistro || 'real',
        notas,
        adminUsuarioId: req.user.id
      });

      res.status(201).json({ ok: true, data: resultado });
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  }

  static async getFamilias(req, res, next) {
    try {
      const familias = await query(`
        SELECT f.id, f.nombre_familia, f.titular_nombre, f.telefono, f.direccion,
               f.fecha_instalacion, f.capacidad_kw, f.recibo_anterior_usd,
               f.porcentaje_ahorro_estimado, u.email, cr.codigo AS codigo_referido
        FROM familias f
        INNER JOIN usuarios u ON u.id = f.usuario_id
        LEFT JOIN codigos_referido cr ON cr.familia_id = f.id AND cr.activo = TRUE
        ORDER BY f.id DESC
      `);
      res.json({ ok: true, data: familias });
    } catch (err) {
      next(err);
    }
  }
}

