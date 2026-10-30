# ☀️ Caso C · Sol de Casa — Modelo Financiero, Tablero Interactivo y Simulador 24M

Solución integral de los **Niveles 1, 2 y 3** para el caso de negocio **Sol de Casa** (instalación residencial de paneles solares).

> **Arquitectura 100% en navegador (sin backend):** todo el motor determinista de economía unitaria, interpolación de leads, embudo con tope de capacidad, simulador de flujo de caja a 24 meses e importación/exportación bidireccional de libros `.xlsx` se ejecuta localmente en el cliente, validado por **37 pruebas automatizadas** contra el Excel oficial (`< 1%` de diferencia máxima).

---

## 🎯 Hallazgo Ejecutivo y «La Trampa del Caso»

**Recomendación para Andrés:** **Rechazar la propuesta de la agencia Leadly** de mover todo el presupuesto (`$8.000/mes`) a Meta y quitar Google.

- **Por qué el CPL engaña:** en Meta un lead cuesta **5 veces menos** (`$8,00` vs. `$40,00` en Google), pero convierte peor en cada paso y exige **5,56 visitas técnicas de `$60`** por venta frente a **3,33 visitas** en Google.
- **Costo real por cliente (CAC real = anuncios + visitas):** conseguir un cliente en Meta cuesta **`$718,13`** frente a **`$535,54`** en Google (**`34,10%` más caro**). Incluso en anuncios puros por venta, Google ya es más económico (`$335,54` vs. `$384,80`).
- **Qué pasaría con la agencia (`$8k Meta / $0 Google`):** por rendimientos decrecientes llegan `840` leads reales (no los `1.000` prometidos), las ventas caen de `22,32` a `17,46/mes` y la empresa pasa de ganar **`+$4.414,66/mes`** a perder **`-$3.442,85/mes`** (hundiendo la caja a **`-$60.897,82`** al mes 24).

### Resumen Comparativo Mensual (Nivel 1 y Nivel 2)

| Indicador mensual | Hoy (`$4k / $4k`) | Agencia: historial (`$8k / $0`) | Agencia: promesa (`$8` CPL) | Cambio 1: Solo filtro | Propuesta: Filtro + Batería |
|---|---:|---:|---:|---:|---:|
| **Leads totales** | 600,00 | 840,00 | 1.000,00 | 500,00 | 500,00 |
| **Visitas solicitadas** | 97,49 | 97,02 | 115,50 | 135,74 | 135,74 |
| **Visitas realizadas (tope 100)** | 97,49 | 97,02 | 100,00 | 100,00 | 100,00 |
| **Ventas cerradas** | **22,32** | **17,46** | **18,00** | **25,18** | **25,18** |
| **CAC real combinado** | `$620,59` | `$791,43` | `$777,78` | `$556,02` | `$556,02` |
| **Utilidad neta tras fijos (`$18k`)** | **`+$4.414,66`** | **`-$3.442,85`** | **`-$2.750,00`** | **`+$8.915,88`** | **`+$10.842,07`** |
| **Caja final Mes 1 (sin batería)** | `$15.736,30` | `$18.287,73` | `$17.830,00` | `$14.096,92` | `$14.096,92` |

> **Alerta de Caja vs. Utilidad para Sofía:** cada instalación nueva drena **`-$520` netos de caja en el mes de la firma** (`+50%` anticipo `$3.250` menos `55%` equipos al contado `$3.575` y `3%` comisión `$195`) y recupera **`+$2.145`** al instalar en el mes siguiente (`+50%` saldo menos `17%` cuadrilla). Por eso vender más en el Mes 1 reduce temporalmente la caja (`$14.096,92`, siempre sobre el piso de `$5.000`).

### Camino Óptimo a 24 Meses (Nivel 3)

Como cada técnico nuevo tarda **1 mes en capacitarse** (`$1.800/mes` pagados desde que entra, `+50 visitas` desde el mes siguiente), el camino recomendado (**Propio B · Escala segura**) sincroniza la inversión con la capacidad instalada:

1. **Meses 1 y 2:** mantiene `$4.000 Meta + $4.000 Google`, activa respuesta `<5 min` + filtro desde el Mes 1 y contrata **Técnico 1 (Mes 1)** y **Técnico 2 (Mes 2)**.
2. **Meses 3 a 24:** con la capacidad ya en **200 visitas/mes**, escala a **`$7.000 Meta + $6.000 Google`** sostenidos sin bajar después del Mes 19.
3. **Resultado verificado:** cierra el Mes 24 con **`$677.256,55` en caja**, **`1.118,5` instalaciones acumuladas** y una **caja mínima de `$10.617,75`** en el Mes 3 (**más del doble del piso de seguridad de `$5.000`**). *(La variante **Propio C** con `$6.000` iniciales en Google alcanza **`$681.010,33`** con caja mínima de `$6.184,08` en el Mes 2).*

---

## 📦 Cobertura Completa de Entregables por Nivel

| Nivel del reto | Qué incluye nuestra solución | Archivos clave |
|---|---|---|
| **Nivel 1** *(Base · 100 pts)* | Calculadora completa de 5 escenarios, respuestas a las 7 preguntas de Andrés, revisión manual a mano, nota ejecutiva de 1 página imprimible y sección obligatoria *«En qué se equivocó la IA»*. | [`entregables/Sol_de_Casa_Completo.xlsx`](./entregables/Sol_de_Casa_Completo.xlsx) · [`md/02_respuestas_7_preguntas_y_cuentas.md`](./md/02_respuestas_7_preguntas_y_cuentas.md) · [`md/03_recomendacion_1_pagina.md`](./md/03_recomendacion_1_pagina.md) · [`md/04_supuestos_riesgos_y_errores_ia.md`](./md/04_supuestos_riesgos_y_errores_ia.md) |
| **Nivel 2** *(Tablero · +10 pts)* | Tablero interactivo en vivo con sliders y entradas editables, semáforos `LTV:CAC`, radiografía visual del embudo, anatomía del CAC real y conexión bidireccional Drag & Drop con `.xlsx` (`< 1%` auditado celda por celda). | [`entregables/Sol_de_Casa_tablero.html`](./entregables/Sol_de_Casa_tablero.html) · [`TableroPage.jsx`](./sol-de-casa/src/features/tablero/TableroPage.jsx) · [`ExcelPage.jsx`](./sol-de-casa/src/features/excel/ExcelPage.jsx) |
| **Nivel 3** *(24M + Pitch · +20 pts)* | Simulador operativo de 24 meses (tanto en la app web como en la hoja `Simulador_24m` de Excel con fórmulas vivas), auditoría paso a paso del Mes 1 (`$15.736,30`), validación de piso `$5.000` y regla del Mes 19, edición mensual manual y guion de pitch de 2 min al banco. | [`SimuladorPage.jsx`](./sol-de-casa/src/features/simulador/SimuladorPage.jsx) · [`entregables/Sol_de_Casa_Completo.xlsx`](./entregables/Sol_de_Casa_Completo.xlsx) · [`md/05_guion_presentacion_y_pitch.md`](./md/05_guion_presentacion_y_pitch.md) |

---

## 🗂️ Estructura del Repositorio

```text
Sol de Casa/
├── README.md                              # Documentación general y resumen ejecutivo
├── entregables/                           # Archivos finales listos para abrir o entregar sin instalar nada
│   ├── Sol_de_Casa_tablero.html           # App web autocontenida en 1 solo archivo (abre con doble clic)
│   └── Sol_de_Casa_Completo.xlsx          # Libro Excel completo (5 hojas: Niveles 1, 2 y Simulador_24m)
├── docs/                                  # Insumos originales del caso
│   ├── Caso_C_-_Sol_de_Casa.pdf           # Enunciado oficial (12 páginas)
│   └── Sol_de_Casa_Nivel_1.xlsx           # Libro Excel base original
├── md/                                    # Documentación ejecutiva, cuentas a mano, IA y guiones
│   ├── README.md                          # Índice de lectura rápida
│   ├── 01_estado_y_pendientes.md          # Checklist de cumplimiento por nivel
│   ├── 02_respuestas_7_preguntas_y_cuentas.md
│   ├── 03_recomendacion_1_pagina.md
│   ├── 04_supuestos_riesgos_y_errores_ia.md
│   └── 05_guion_presentacion_y_pitch.md
├── scripts/                               # Automatización reproducible
│   └── generar_excel_completo.py          # Genera entregables/Sol_de_Casa_Completo.xlsx con openpyxl
└── sol-de-casa/                           # Código fuente React 18 + Vite + Recharts + Vitest
    ├── src/
    │   ├── app/                           # Estado global (ModeloContext) y registro de pestañas
    │   ├── domain/                        # Lógica financiera pura desacoplada de React (@/domain)
    │   │   ├── modelo/                    # supuestos, escenarios, planes, técnicos y trampa
    │   │   ├── calculos/                  # leads (interpolación), embudo (prioridad Google) y finanzas
    │   │   ├── simulador/                 # flujo de caja operativo de 24 meses
    │   │   └── excel/                     # importación, auditoría (< 1%) y exportación .xlsx
    │   ├── features/                      # 7 módulos de interfaz (1 carpeta por pestaña)
    │   └── shared/                        # layout/, ui/, lib/format.js y styles/index.css
    └── tests/                             # 37 pruebas automatizadas (cálculos, simulador, Excel y SSR)
```

---

## 🚀 Cómo Abrir y Ejecutar el Proyecto

### Opción 1 · Uso inmediato (sin instalar nada)
1. Haz doble clic en **`entregables/Sol_de_Casa_tablero.html`** para abrir el tablero interactivo completo en cualquier navegador.
2. Abre **`entregables/Sol_de_Casa_Completo.xlsx`** en Excel o súbelo a Google Sheets para usar las hojas `Supuestos`, `Resultados`, `Recomendacion`, `Graficos` y `Simulador_24m` con fórmulas vivas.
3. En la pestaña **Excel (.xlsx)** del tablero puedes arrastrar el archivo `.xlsx` para sincronizar supuestos y auditar las celdas automáticamente.

### Opción 2 · Entorno de desarrollo (Node.js 18+)

```bash
cd sol-de-casa
npm install
npm test                  # ejecuta los 37 tests (economía unitaria, 24 meses, Excel <1% y render SSR)
npm run dev               # levanta Vite en modo desarrollo (http://127.0.0.1:5173/)
npm run build:entregable  # compila y actualiza ../entregables/Sol_de_Casa_tablero.html
npm run preview           # sirve el paquete compilado de producción a máxima velocidad
```

### Opción 3 · Regenerar el libro Excel completo (Python 3 + `openpyxl`)

```bash
python scripts/generar_excel_completo.py
```
