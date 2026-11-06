import { CalculadoraService } from '../services/calculadoraService.js';
import { ReferidosService } from '../services/referidosService.js';
import { SolicitudesService } from '../services/solicitudesService.js';

export class PublicController {
  /**
   * Vista 3: Calculadora del vecino
   * Calcula el 70 % de ahorro estimado y años de recuperación simple sobre $6.500.
   */
  static postCalculadora(req, res) {
    const { reciboMensual } = req.body;
    const resultado = CalculadoraService.calcular({ reciboMensual });

    // Telemetría en segundo plano
    ReferidosService.registrarEvento('calculadora_usada', {
      metadata: { reciboMensual, ahorroEstimado: resultado.ahorro_mensual_estimado }
    }).catch(err => console.error('Error registrando telemetría calculadora:', err.message));

    res.json({
      ok: true,
      data: resultado
    });
  }

  /**
   * Vista 3: Carga inicial de la página del vecino al llegar por un enlace de referido.
   * Muestra sólo datos públicos y no confidenciales de la invitación.
   */
  static async getInvitacionReferido(req, res, next) {
    try {
      const { codigo } = req.params;
      const info = await ReferidosService.resolverInvitacionPublica(codigo);

      if (!info.valido) {
        return res.status(404).json({ ok: false, error: info.mensaje });
      }

      res.json({
        ok: true,
        data: info
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Vista 3: Envío del formulario de solicitud de visita por parte del vecino.
   * Guarda consentimiento, previene duplicados por doble clic y valida formato.
   */
  static async postSolicitudVisita(req, res, next) {
    try {
      const {
        codigoReferido,
        nombreVecino,
        telefono,
        email,
        direccion,
        reciboActualUsd,
        fechaPreferencia,
        horarioPreferencia,
        consentimientoContacto,
        idempotencyKey,
        esSimulada
      } = req.body;

      const resultado = await SolicitudesService.crearSolicitud({
        codigoReferido,
        nombreVecino,
        telefono,
        email,
        direccion,
        reciboActualUsd,
        fechaPreferencia,
        horarioPreferencia,
        consentimientoContacto,
        idempotencyKey,
        esSimulada
      });

      res.status(201).json({
        ok: true,
        data: resultado
      });
    } catch (err) {
      res.status(400).json({
        ok: false,
        error: err.message
      });
    }
  }
}

