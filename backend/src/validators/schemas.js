export function validarEmail(email) {
  if (typeof email !== 'string') return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim().toLowerCase());
}

export function validarPassword(password) {
  if (typeof password !== 'string') return false;
  // Mínimo 8 caracteres, al menos un número y una letra
  return password.length >= 8 && /[a-zA-Z]/.test(password) && /\d/.test(password);
}

export function validarPeriodo(periodo) {
  if (typeof periodo !== 'string') return false;
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(periodo);
}

export function validarNumeroPositivo(val, permitirCero = false) {
  const num = Number(val);
  if (Number.isNaN(num) || !Number.isFinite(num)) return false;
  return permitirCero ? num >= 0 : num > 0;
}

export function calcularAhorroVecino(reciboMensual, porcentajeAhorro = 0.70, costoInstalacion = 6500) {
  const recibo = Number(reciboMensual);
  if (Number.isNaN(recibo) || recibo <= 0) {
    return {
      recibo_mensual: 0,
      ahorro_mensual_estimado: 0,
      ahorro_anual_estimado: 0,
      nuevo_recibo_estimado: 0,
      costo_instalacion: costoInstalacion,
      recuperacion_anios: null,
      mensaje: 'Introduce un recibo mayor a 0 para calcular la estimación.',
      etiqueta: 'Estimación'
    };
  }

  const ahorroMensual = Math.round(recibo * porcentajeAhorro * 100) / 100;
  const ahorroAnual = Math.round(ahorroMensual * 12 * 100) / 100;
  const nuevoRecibo = Math.round((recibo - ahorroMensual) * 100) / 100;
  
  // Evitar división entre cero
  const recuperacionAnios = ahorroAnual > 0 
    ? Math.round((costoInstalacion / ahorroAnual) * 10) / 10 
    : null;

  return {
    recibo_mensual: recibo,
    ahorro_mensual_estimado: ahorroMensual,
    ahorro_anual_estimado: ahorroAnual,
    nuevo_recibo_estimado: nuevoRecibo,
    costo_instalacion: costoInstalacion,
    recuperacion_anios: recuperacionAnios,
    porcentaje_ahorro: Math.round(porcentajeAhorro * 100),
    etiqueta: 'Estimación'
  };
}

export const TRANSICIONES_VALIDAS_SOLICITUD = {
  solicitada: ['agendada', 'cancelada'],
  agendada: ['realizada', 'cancelada'],
  realizada: ['venta_confirmada', 'cancelada'],
  venta_confirmada: [], // Estado terminal
  cancelada: []         // Estado terminal
};

export function esTransicionValida(estadoActual, nuevoEstado) {
  if (estadoActual === nuevoEstado) return true;
  const permitidos = TRANSICIONES_VALIDAS_SOLICITUD[estadoActual] || [];
  return permitidos.includes(nuevoEstado);
}

