# 01 · Estado del Proyecto y Checklist Final

## Completado en Código y Entregables (`entregables/`)

- [x] **Sin backend requerido:** todo el modelo determinista y el importador/exportador `.xlsx` corren 100% en el navegador.
- [x] **Nivel 2 — Tablero en vivo (`TableroPage.jsx`):**
  - Controles deslizantes (sliders + input editable amarillo con unidad) para inversión Meta/Google, las 4 tasas de cada canal, costo por visita, capacidad/técnicos extra, precio, **margen bruto**, comisión y adopción de batería, más botón **«Volver a los datos del caso»**.
  - Tabla en vivo **por canal y en total** con leads, etapas del embudo, visitas usadas vs. capacidad, ventas, visitas/venta, CPL, CAC anuncios, CAC real, LTV:CAC (con semáforo), valor de visita, payback en caja (`Mes 2`) y dónde cae más gente.
  - Tres gráficos en vivo: **La trampa integrada con CPL vs. CAC real**, **Embudo lado a lado con línea dinámica de capacidad**, y **Visitas pedidas frente a capacidad**.
  - Alertas automáticas cuando las visitas superan la capacidad o cuando la caja baja de $5.000.
- [x] **Nivel 1 — Escenarios, Gráficos y Recomendación (`ResultadosPage`, `GraficosPage`, `RecomendacionPage`):**
  - Comparación de los 5 escenarios lado a lado con unidades explícitas en cada fila.
  - Recomendación de 1 página lista para imprimir (`🖨 Imprimir / Guardar como PDF`), separando **Supuestos del caso (1–7)** de **Supuestos propios**, riesgos, filas verificadas a mano y 3 ejemplos concretos en **«En qué se equivocó la IA»**.
- [x] **Nivel 3 — Simulador de 24 meses (`SimuladorPage.jsx`):**
  - Revisión manual completa del Mes 1 ($15.736,30) con todas las cuentas escritas y sin errores de formato.
  - Caminos de inversión en 2 fases que cuidan la caja mientras se capacitan los 2 técnicos en meses 1–2 y escalan en el mes 3:
    - **Propio B (Escala segura):** $4k/$4k → $7k/$6k desde mes 3 · técnicos en meses 1 y 2 → **$677.257** al mes 24, **1.119 instalaciones**, caja mínima **$10.618** (doble del piso de $5.000).
    - **Propio C (Máx. caja):** $4k/$6k → $7k/$6k desde mes 3 · técnicos en meses 1 y 2 → **$681.010** al mes 24, **1.124 instalaciones**, caja mínima **$6.184**.
  - Validación automática del piso de $5.000 y de la regla del mes 19 + Pitch dinámico de 2 minutos.
- [x] **Conexión bidireccional con Excel (`ExcelPage.jsx`):** importa `Supuestos`, compara contra `Resultados` (`< 1%`) y exporta `.xlsx` completo con las 3 hojas.

---

## Único paso manual externo para el equipo (Google Sheets — Nivel 1)

- [ ] Subir `docs/Sol_de_Casa_Nivel_1.xlsx` a **Google Sheets** para la revisión presencial del Nivel 1 con el facilitador:
  1. Verificar que las celdas editables de `Supuestos` estén pintadas de otro color.
  2. Insertar el gráfico en Google Sheets con la línea de capacidad de 100 visitas.
  3. Practicar los 3 minutos del guion (`05_guion_presentacion_y_pitch.md`) sin mirar la pantalla.
