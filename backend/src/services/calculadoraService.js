import { env } from '../config/env.js';
import { calcularAhorroVecino } from '../validators/schemas.js';

export class CalculadoraService {
  /**
   * Realiza el cálculo del ahorro estimado del vecino y años de recuperación simple.
   * Maneja recibo cero sin dividir entre cero y etiqueta el resultado como estimación.
   */
  static calcular({ reciboMensual, porcentajeAhorro = env.solar.savingRate, costoInstalacion = env.solar.standardInstallationPrice }) {
    const resultado = calcularAhorroVecino(reciboMensual, porcentajeAhorro, costoInstalacion);
    return resultado;
  }
}

