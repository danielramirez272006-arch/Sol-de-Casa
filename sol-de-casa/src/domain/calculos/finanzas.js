// Etapa 3: ventas -> contribución, CAC, LTV:CAC, valor de visita y caja
const dividir = (a, b) => (b ? a / b : null)

function mesRecuperacion(firma, siguiente) {
  if (firma == null) return null
  if (firma >= 0) return 'Mes 1 (firma)'
  if (siguiente >= 0) return 'Mes 2 (instalación)'
  return 'Más de 2 meses'
}

export function calcularFinanzas(e, S, leads, embudo) {
  const margenBruto = 1 - S.equipos - S.instalacion
  const contrInstalacion = S.precio * (margenBruto - S.comision)
  const aporteBateria = e.bateria
    ? S.bateria.precio * (S.bateria.margen - S.bateria.comision) * S.bateria.adopcion
    : 0
  const contribPorVenta = contrInstalacion + aporteBateria

  const contribucion = embudo.ventas * contribPorVenta
  const anuncios = e.meta + e.google
  const costoVisitas = embudo.realizadas * S.costoVisita
  const despuesMarketing = contribucion - anuncios - costoVisitas

  const cacRealMeta = dividir(e.meta + embudo.hechasMeta * S.costoVisita, embudo.ventasMeta)
  const cacRealGoogle = dividir(e.google + embudo.hechasGoogle * S.costoVisita, embudo.ventasGoogle)
  const cacCombinado = dividir(anuncios + costoVisitas, embudo.ventas)

  // Payback en caja (sin batería): mes de la firma cobra 50% y paga equipos + comisión;
  // mes siguiente cobra el otro 50% y paga la instalación.
  const cajaFirma = S.precio * (0.5 - S.equipos - S.comision)
  const cajaSiguiente = S.precio * (0.5 - S.instalacion)
  const paybackFirma = (cac) => (cac == null ? null : -cac + cajaFirma)
  const paybackSig = (cac) => (cac == null ? null : paybackFirma(cac) + cajaSiguiente)

  const paybackMetaFirma = paybackFirma(cacRealMeta)
  const paybackMetaSiguiente = paybackSig(cacRealMeta)
  const paybackGoogleFirma = paybackFirma(cacRealGoogle)
  const paybackGoogleSiguiente = paybackSig(cacRealGoogle)

  // Caja final del mes 1 (sin batería), con las ventas del mes anterior (S.ventasMesAnterior)
  const cajaFinalMes1 =
    S.cajaInicial +
    S.precio * 0.5 * (S.ventasMesAnterior + embudo.ventas) -
    S.precio * (S.equipos + S.comision) * embudo.ventas -
    S.precio * S.instalacion * S.ventasMesAnterior -
    anuncios -
    costoVisitas -
    S.costosFijos

  const valorVisitaMeta = embudo.cierreMeta * contribPorVenta - S.costoVisita
  const valorVisitaGoogle = embudo.cierreGoogle * contribPorVenta - S.costoVisita
  const valorVisitaCombinado =
    embudo.realizadas > 0
      ? (embudo.hechasMeta * valorVisitaMeta + embudo.hechasGoogle * valorVisitaGoogle) / embudo.realizadas
      : null

  return {
    margenBruto,
    contrInstalacion,
    aporteBateria,
    contribPorVenta,
    contribucion,
    anuncios,
    costoVisitas,
    despuesMarketing,
    neto: despuesMarketing - S.costosFijos,
    cplMeta: dividir(e.meta, leads.meta),
    cplGoogle: dividir(e.google, leads.google),
    cplCombinado: dividir(anuncios, embudo.leadsTotales),
    cacAnunciosMeta: dividir(e.meta, embudo.ventasMeta),
    cacAnunciosGoogle: dividir(e.google, embudo.ventasGoogle),
    cacAnunciosCombinado: dividir(anuncios, embudo.ventas),
    cacRealMeta,
    cacRealGoogle,
    cacCombinado,
    ltvCacMeta: cacRealMeta == null ? null : contribPorVenta / cacRealMeta,
    ltvCacGoogle: cacRealGoogle == null ? null : contribPorVenta / cacRealGoogle,
    ltvCacCombinado: cacCombinado == null ? null : contribPorVenta / cacCombinado,
    visitasPorVentaMeta: dividir(embudo.hechasMeta, embudo.ventasMeta),
    visitasPorVentaGoogle: dividir(embudo.hechasGoogle, embudo.ventasGoogle),
    visitasPorVentaCombinado: dividir(embudo.realizadas, embudo.ventas),
    valorVisitaMeta,
    valorVisitaGoogle,
    valorVisitaCombinado,
    paybackMetaFirma,
    paybackMetaSiguiente,
    paybackMesMeta: mesRecuperacion(paybackMetaFirma, paybackMetaSiguiente),
    paybackGoogleFirma,
    paybackGoogleSiguiente,
    paybackMesGoogle: mesRecuperacion(paybackGoogleFirma, paybackGoogleSiguiente),
    cajaFinalMes1,
    sobrePisoCaja: cajaFinalMes1 >= S.pisoCaja,
  }
}
