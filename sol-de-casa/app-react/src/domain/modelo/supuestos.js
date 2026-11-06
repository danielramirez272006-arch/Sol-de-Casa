// Hoja "Supuestos" del Excel. USD por mes.
export const SUPUESTOS_BASE = {
  precio: 6500,
  equipos: 0.55,
  instalacion: 0.17,
  comision: 0.03,
  costoVisita: 60,
  capacidad: 100,
  cplPrometido: 8,
  // Técnicos extra (el caso: +50 visitas/mes cada uno, $1.800/mes, máximo 2)
  tecnicosExtra: 0,
  visitasPorTecnico: 50,
  costoTecnico: 1800,
  meta: { contacto: 0.55, agenda: 0.3, visita: 0.7, cierre: 0.18 },
  google: { contacto: 0.85, agenda: 0.55, visita: 0.85, cierre: 0.3 },
  filtro: { reduccionLeads: 0.2, contacto: 0.8, agenda: 0.4, visita: 0.75, cierre: 0.22 },
  bateria: { precio: 3000, margen: 0.2, comision: 0.03, adopcion: 0.15 },
  costosFijos: 18000,
  cajaInicial: 12000,
  pisoCaja: 5000,
  ventasMesAnterior: 22,
  // Historial inversión -> leads por mes
  curva: [
    { inv: 0, meta: 0, google: 0 },
    { inv: 2000, meta: 280, google: 55 },
    { inv: 4000, meta: 500, google: 100 },
    { inv: 6000, meta: 680, google: 135 },
    { inv: 8000, meta: 840, google: 160 },
    { inv: 10000, meta: 960, google: 160 },
  ],
}


