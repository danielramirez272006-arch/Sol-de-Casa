import { AhorroService } from '../services/ahorroService.js';
import { ReferidosService } from '../services/referidosService.js';
import { RecompensasService } from '../services/recompensasService.js';
import { SolicitudesService } from '../services/solicitudesService.js';

export class FamiliasController {
  /**
   * Vista 1: Mi ahorro
   * Devuelve ahorro mensual, acumulado, etiqueta de simulación e integración con el inversor.
   */
  static async getMiAhorro(req, res, next) {
    try {
      const familiaId = req.user.familiaId;
      if (!familiaId) {
        return res.status(404).json({ ok: false, error: 'No tienes un perfil de familia vinculado a tu usuario.' });
      }

      const resumen = await AhorroService.obtenerResumenFamilia(familiaId);
      res.json({ ok: true, data: resumen });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Vista 2: Compartir
   * Devuelve el código de referido personal y el enlace listo para WhatsApp.
   */
  static async getCompartir(req, res, next) {
    try {
      const familiaId = req.user.familiaId;
      if (!familiaId) {
        return res.status(404).json({ ok: false, error: 'No tienes un perfil de familia vinculado.' });
      }

      const infoCodigo = await ReferidosService.obtenerOCrearCodigo(familiaId);
      const resumenAhorro = await AhorroService.obtenerResumenFamilia(familiaId);

      const mensajeWhatsApp = `¡Hola vecino! En casa ya ahorramos $${resumenAhorro.ahorroUltimoMesUsd}/mes en la luz con paneles solares de Sol de Casa. Puedes calcular tu ahorro estimado y pedir una visita técnica aquí: ${infoCodigo.enlacePersonal}`;

      res.json({
        ok: true,
        data: {
          codigo: infoCodigo.codigo,
          enlacePersonal: infoCodigo.enlacePersonal,
          ahorroMensualEjemplo: resumenAhorro.ahorroUltimoMesUsd,
          mensajeCompartirWhatsApp: mensajeWhatsApp,
          etiqueta: resumenAhorro.etiqueta
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Vista 4: Mis referidos y recompensas
   * Muestra el avance de los vecinos invitados y las recompensas ganadas/entregadas.
   */
  static async getMisReferidosYRecompensas(req, res, next) {
    try {
      const familiaId = req.user.familiaId;
      if (!familiaId) {
        return res.status(404).json({ ok: false, error: 'No tienes un perfil de familia vinculado.' });
      }

      const solicitudes = await SolicitudesService.listar({ familiaId, limit: 100 });
      const recompensas = await RecompensasService.obtenerRecompensasFamilia(familiaId);
      const economia = RecompensasService.evaluarEconomiaReferidos();

      // Mapear avance del embudo por vecino
      const vecinos = solicitudes.map(s => {
        let paso = 1; // Solicitud recibida
        if (s.estado === 'agendada') paso = 2;
        if (s.estado === 'realizada') paso = 3;
        if (s.estado === 'venta_confirmada') paso = 4;
        if (s.estado === 'cancelada') paso = 0;

        return {
          id: s.id,
          nombreVecino: s.nombre_vecino,
          fecha: s.creado_en,
          estado: s.estado,
          pasoActual: paso,
          recompensaAsociada: s.recompensa_id ? {
            tipo: s.tipo_recompensa,
            estado: s.estado_recompensa
          } : null
        };
      });

      res.json({
        ok: true,
        data: {
          vecinosInvitados: vecinos,
          recompensas,
          tablaRecompensas: [
            {
              hito: 'Firma de contrato de instalación del vecino',
              premio: 'Limpieza y mantenimiento preventivo anual de paneles',
              valorPercibidoUsd: 100.00,
              costoParaSolDeCasaUsd: 60.00,
              condicion: 'Venta cerrada y anticipo pagado'
            }
          ],
          analisisPresupuestoMaximo: economia
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Registra evento de telemetría emitido por la familia (ej: clic en compartir WhatsApp).
   */
  static async postEventoTelemetria(req, res, next) {
    try {
      const familiaId = req.user.familiaId;
      const { tipoEvento, metadata } = req.body;
      await ReferidosService.registrarEvento(tipoEvento, { familiaId, metadata });
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
}

