// Métricas de la "trampa": el lead de Meta es más barato, pero el cliente no.
export function calcularTrampa(r, supuestos) {
  const cplMeta = r.cplMeta
  const cplGoogle = r.cplGoogle
  const cacMeta = r.cacRealMeta
  const cacGoogle = r.cacRealGoogle
  return {
    cplMeta,
    cplGoogle,
    cacMeta,
    cacGoogle,
    vecesMasBaratoLead: cplMeta && cplGoogle ? cplGoogle / cplMeta : null,
    sobrecostoCliente: cacMeta && cacGoogle ? cacMeta / cacGoogle - 1 : null,
    capacidad: supuestos.capacidad,
  }
}

