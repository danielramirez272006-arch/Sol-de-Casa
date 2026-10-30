# 02 · Respuestas a las 7 Preguntas de Andrés y Cuentas a Mano

Todas las cifras son mensuales y en USD con datos base del caso ($4.000 Meta + $4.000 Google, sin técnicos extra).

---

## 1. ¿Cuánto deja una venta antes de marketing? (Contribución)
- **Precio instalación:** $6.500
- **Equipos (55%):** $3.575 · **Instalación (17%):** $1.105 → **Margen bruto (28%):** $1.820
- **Comisión asesora (3%):** $195
- **Contribución por instalación:** `$6.500 × (1 − 0,55 − 0,17 − 0,03) = $6.500 × 25% = $1.625,00`
- *(Con batería opcional de $3.000: margen 20% − comisión 3% = 17% = **$510** por batería; al 15% de adopción esperada suma **$76,50** por venta → contribución media **$1.701,50**).*

---

## 2. Embudo completo de cada canal y dónde se cae más gente

| Etapa del embudo | Meta ($4.000) | Caída en Meta | Google ($4.000) | Caída en Google | Total hoy |
|---|---:|---:|---:|---:|---:|
| **1. Leads** | 500,00 | — | 100,00 | — | **600,00** |
| **2. Contactados** | 275,00 (55%) | −225 leads (−45%) | 85,00 (85%) | −15 leads (−15%) | **360,00** |
| **3. Agendan visita** | 82,50 (30%) | −192,50 (−70%) | 46,75 (55%) | −38,25 (−45%) | **129,25** |
| **4. Visitas hechas** | 57,75 (70%) | −24,75 (−30%) | 39,74 (85%) | −7,01 (−15%) | **97,49** |
| **5. Ventas cerradas** | **10,40** (18%) | **−47,36 (−82%)** | **11,92** (30%) | **−27,82 (−70%)** | **22,32** |

- **Dónde se cae más gente en Meta:**
  - En **volumen absoluto**, al intentar contactar (**se pierden 225 personas**, influido por las 31 h de demora en llamar y 18% de teléfonos inválidos) y al agendar (**se caen 192,5 contactados**).
  - En **tasa porcentual**, en el cierre (solo cierra 18%, cae 82%) y en la agenda (solo agenda 30%, cae 70%).
- **Dónde se cae más gente en Google:** en volumen al pasar de contactado a agenda (−38,25 personas, cae 45%) y en porcentaje en el cierre (solo cierra 30%, cae 70%).

---

## 3. ¿Qué canal es más barato de verdad? (CPL vs. CAC anuncios vs. CAC real)

| Métrica | Meta | Google | Comparación |
|---|---:|---:|---|
| **CPL (Costo por lead)** | $8,00 | $40,00 | Meta parece 5 veces más barato (LA TRAMPA) |
| **Visitas necesarias por venta** | 5,56 visitas | 3,33 visitas | Meta gasta $333,33 en visitas/venta vs. $200 en Google |
| **CAC solo anuncios** | $384,80 | $335,54 | Google ya es más barato en anuncios por venta |
| **CAC real (anuncios + visitas)** | **$718,13** | **$535,54** | **El cliente de Meta cuesta 34,10% más que el de Google** |

**Fila verificada a mano (CAC real Meta hoy):**
`($4.000 anuncios + 57,75 visitas × $60) ÷ 10,395 ventas = ($4.000 + $3.465) ÷ 10,395 = $7.465 ÷ 10,395 = $718,13 por cliente.`

**Fila verificada a mano (CAC real Google hoy):**
`($4.000 anuncios + 39,7375 visitas × $60) ÷ 11,92125 ventas = ($4.000 + $2.384,25) ÷ 11,92125 = $6.384,25 ÷ 11,92125 = $535,54 por cliente.`

---

## 4. LTV:CAC y Payback en caja de un cliente
- **LTV:CAC:** ambos canales dejan plata (`> 1x`), pero Google rinde mucho mejor:
  - **Meta:** `$1.625 ÷ $718,13 = 2,26x`
  - **Google:** `$1.625 ÷ $535,54 = 3,03x`
- **Payback en caja por cliente:**
  - **Mes de la firma (Mes 1 del cliente):** entra 50% ($3.250) − equipos 55% ($3.575) − comisión 3% ($195) = **−$520** operativos, menos el CAC real:
    - Cliente Meta en firma: `−$718,13 − $520 = −$1.238,13`
    - Cliente Google en firma: `−$535,54 − $520 = −$1.055,54`
  - **Mes siguiente (instalación, Mes 2 del cliente):** entra segundo 50% ($3.250) − instalación 17% ($1.105) = **+$2.145**:
    - Cliente Meta acumulado: `−$1.238,13 + $2.145 = +$906,87`
    - Cliente Google acumulado: `−$1.055,54 + $2.145 = +$1.089,46`
  - **Conclusión:** un cliente **se recupera en el mes siguiente a la firma** (en el mes de firma hunde la caja en $520 adicionales al CAC).

---

## 5. ¿Qué pasaría con la propuesta de la agencia ($8.000 Meta, $0 Google)?
- **Como la cuenta la agencia ($8 CPL constante):** 1.000 leads → 115,5 visitas pedidas → la capacidad corta en **100 visitas hechas** (se pierden 15,5) → **18,00 ventas** (4,32 ventas menos que hoy). Resultado tras costos fijos: **−$2.750/mes**.
- **Con el historial real ($8.000 en Meta dan 840 leads, CPL $9,52):** 840 leads → **97,02 visitas hechas** (no llena capacidad) → **17,46 ventas** (4,85 ventas menos que hoy). Resultado tras costos fijos: **−$3.442,85/mes**.

---

## 6. Valor de una visita por canal (prioridad de agenda)
Fórmula: `Tasa de cierre × Contribución por venta − Costo por visita ($60)`
- **Google hoy:** `30% × $1.625 − $60 = $487,50 − $60 = $427,50 por visita` (con batería: **$450,45**).
- **Meta hoy:** `18% × $1.625 − $60 = $292,50 − $60 = $232,50 por visita` (con filtro: **$297,50**; con filtro + batería: **$314,33**).
- **Decisión:** cuando las 100 visitas se llenan, **siempre conviene dárselas primero a Google** ($427,50 vs. $232,50).

---

## 7. Revisión manual del Mes 1 (para Nivel 3)
Escenario actual ($4.000 Meta + $4.000 Google, 0 técnicos extra, 22 ventas en el mes 0, caja inicial $12.000):
- **Ventas mes 1:** `10,395 + 11,92125 = 22,31625 ventas` · **Visitas hechas:** `97,4875 visitas`
- **Entradas del mes 1:**
  - 50% ventas del mes 1: `0,5 × $6.500 × 22,31625 = $72.527,81`
  - 50% ventas del mes 0 (22 instalaciones): `0,5 × $6.500 × 22 = $71.500,00`
  - **Total entradas:** **`$144.027,81`**
- **Salidas del mes 1:**
  - Equipos (55% ventas mes 1): `$3.575 × 22,31625 = $79.780,59`
  - Comisión (3% ventas mes 1): `$195 × 22,31625 = $4.351,67`
  - Instalación (17% ventas mes 0): `$1.105 × 22 = $24.310,00`
  - Visitas hechas: `97,4875 × $60 = $5.849,25`
  - Anuncios Meta + Google: `$8.000,00`
  - Costos fijos: `$18.000,00`
  - **Total salidas:** **`$140.291,51`**
- **Caja final Mes 1:** `$12.000,00 + $144.027,81 − $140.291,51 =` **`$15.736,30`** (sobre el piso de $5.000).

