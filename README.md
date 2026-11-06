# ☀️ Caso C · Sol de Casa — Modelo Financiero, Tablero Interactivo, Backend MySQL y Referidos

Solución integral y profesional para el caso de negocio **Sol de Casa** (instalación residencial de paneles solares), que cubre los **Niveles 1, 2 y 3 de la Parte 1**, la **Parte 2 completa de Referidos y Growth**, y un **Backend robusto en Node.js + Express con base de datos MySQL**.

> **Arquitectura Híbrida y Resiliente:** 
> - **Frontend:** Tablero interactivo y presentación ejecutiva 100 % autónomos con diseño editorial y animaciones fluidas, operables con doble clic sin dependencias externas.
> - **Backend:** Servidor Node.js + Express con base de datos MySQL (`mysql2/promise`), sesiones seguras con cookies `HttpOnly`, transacciones ACID para asignación de recompensas, control de tenencia (`admin` vs `familia`), prevención de duplicados con claves de idempotencia y un pool de conexiones optimizado.
> - **Validación:** **54 pruebas automatizadas** en verde (41 pruebas de dominio y simulador financiero en Vitest + 13 pruebas de API, validadores, seguridad y economía unitaria en Node.js test runner).

---

## 🎯 Hallazgo Ejecutivo y «La Trampa del Caso»

**Recomendación para Andrés:** **Rechazar rotundamente la propuesta de la agencia Leadly** de mover todo el presupuesto (`$8.000/mes`) a Meta y quitar Google.

- **Por qué el CPL engaña:** en Meta un lead cuesta **5 veces menos** (`$8,00` vs. `$40,00` en Google), pero convierte peor en cada paso del embudo y exige **5,56 visitas técnicas de `$60`** por venta frente a **3,33 visitas** en Google.
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
3. **Resultado verificado:** cierra el Mes 24 con **`$677.256,55` en caja**, **`1.118,5` instalaciones acumuladas** y una **caja mínima de `$10.617,75`** en el Mes 3 (**más del doble del piso de seguridad de `$5.000`**).

---

## 🤝 Parte 2: Economía Unitaria del Canal de Referidos

El programa de referidos de Sol de Casa se basa en una recomendación de alta confianza entre vecinos de techos contiguos:

1. **Precio de instalación estándar:** $\$6.500$.
2. **Ahorro mensual familiar (70%):** de un recibo anterior de $\$110$, la familia ahorra $\$77/\text{mes}$ ($\$924/\text{año}$), amortizando la instalación en **7,0 años** de recuperación simple.
3. **Costo de visita técnica:** $\$60$.
4. **Tasa de cierre en referidos:** $45\%$ ($2{,}22$ visitas requeridas por venta cerrada).
5. **Costo esperado de visitas por venta:** $\$60 \div 0{,}45 = \$133{,}33$.
6. **Propuesta de recompensa:** Limpieza y mantenimiento anual de paneles (costo empresa $\$60$, valor percibido por el cliente $\$100$).
7. **Costo esperado total por venta referida:** $\$133{,}33 + \$60 = \mathbf{\$193{,}33}$.
8. **Tope presupuestario del caso:** Máximo $\$300$ por venta referida $\rightarrow$ **Margen de holgura favorable de $\$106{,}67$** por venta cerrada.

---

## 📦 Cobertura Completa de Entregables

| Entregable | Qué incluye | Archivos clave |
|---|---|---|
| **Nivel 1** *(Base · 100 pts)* | Calculadora completa de 5 escenarios, respuestas a las 7 preguntas de Andrés, revisión a mano, memorando de 1 página imprimible y sección obligatoria *«En qué se equivocó la IA»*. | [`entregables/Sol_de_Casa_Completo.xlsx`](./entregables/Sol_de_Casa_Completo.xlsx) · [`docs/analisis/02_respuestas_7_preguntas_y_cuentas.md`](./docs/analisis/02_respuestas_7_preguntas_y_cuentas.md) · [`docs/analisis/03_recomendacion_1_pagina.md`](./docs/analisis/03_recomendacion_1_pagina.md) · [`docs/analisis/04_supuestos_riesgos_y_errores_ia.md`](./docs/analisis/04_supuestos_riesgos_y_errores_ia.md) |
| **Nivel 2** *(Tablero interactivo)* | Sitio editorial interactivo con diseño Mobile-First, diagramas solares, semáforos `LTV:CAC`, radiografía del embudo y conexión bidireccional Drag & Drop con `.xlsx` (`< 1%` auditado). | [`entregables/Sol_de_Casa_tablero.html`](./entregables/Sol_de_Casa_tablero.html) · [`sol-de-casa/web/index.html`](./sol-de-casa/web/index.html) · [`sol-de-casa/web/src/js/ui/app.js`](./sol-de-casa/web/src/js/ui/app.js) |
| **Nivel 3** *(24M + Pitch bancario)* | Simulador de flujo de caja a 24 meses (hoja `Simulador_24m` con fórmulas vivas), auditoría del Mes 1, piso `$5.000`, regla del Mes 19 y guión de pitch de 2 min al banco. | [`entregables/Sol_de_Casa_Completo.xlsx`](./entregables/Sol_de_Casa_Completo.xlsx) · [`docs/analisis/05_guion_presentacion_y_pitch.md`](./docs/analisis/05_guion_presentacion_y_pitch.md) |
| **Parte 2** *(Referidos y Growth)* | Recorrido móvil de 5 vistas conectadas (Mi ahorro → Compartir → Vecino → Mis referidos → Panel de Andrés), tabla de recompensas y ficha de growth de 1 página. | [`sol-de-casa/web/src/js/domain/referidos.js`](./sol-de-casa/web/src/js/domain/referidos.js) · [`sol-de-casa/web/src/js/ui/referidos-ui.js`](./sol-de-casa/web/src/js/ui/referidos-ui.js) · [`docs/analisis/06_ficha_growth_y_referidos.md`](./docs/analisis/06_ficha_growth_y_referidos.md) |
| **Presentación Ejecutiva** | Diapositivas web de 3 minutos con notas para el presentador, contraste visual accesible y gráficos interactivos. | [`entregables/Sol_de_Casa_Presentacion.html`](./entregables/Sol_de_Casa_Presentacion.html) |
| **Backend Node.js + MySQL** | Servidor API REST con Express, pool `mysql2/promise`, 10 tablas relacionales, cookies de sesión `HttpOnly`, transacciones ACID de recompensas y pruebas. | [`backend/`](./backend/) · [`backend/README.md`](./backend/README.md) |

---

## 🗂️ Estructura del Repositorio

```text
Sol de Casa/
├── README.md                              # Documentación general y resumen ejecutivo
├── .gitignore                             # Reglas Git (protección de .env y artefactos)
├── entregables/                           # SOLO artefactos finales listos para evaluar
│   ├── Sol_de_Casa_tablero.html           # Tablero completo en 1 archivo (abre con doble clic)
│   ├── Sol_de_Casa_Presentacion.html      # Presentación ejecutiva de 3 minutos
│   └── Sol_de_Casa_Completo.xlsx          # Libro Excel maestro (Niveles 1, 2 y Simulador_24m)
├── docs/                                  # Documentación y análisis de negocio
│   ├── README.md                          # Índice documental
│   ├── insumos/                           # Enunciados PDF Parte 1 y Parte 2 del caso
│   └── analisis/                          # Memorandos, cuentas, errores de IA, pitch y ficha growth
├── backend/                               # Servidor API REST (Node.js + Express + MySQL)
│   ├── src/
│   │   ├── config/                        # db.js (pool mysql2) y env.js (configuración tipada)
│   │   ├── controllers/                   # auth, familias, publico y admin
│   │   ├── middleware/                    # auth (sesiones HttpOnly), rateLimiter y errorHandler
│   │   ├── routes/                        # Enrutadores modulares y /api/health
│   │   ├── services/                      # Lógica de negocio (ahorro, referidos, recompensas, etc.)
│   │   └── validators/                    # Validaciones de esquemas y fórmulas
│   ├── database/
│   │   ├── migrations/                    # 001_crear_tablas.sql (10 tablas con FK e índices)
│   │   ├── seeds/                         # run-seeds.js (admin, Familia Gómez, datos simulados)
│   │   └── setup-db.js                    # Script unificado para inicializar MySQL
│   ├── tests/                             # 13 pruebas unitarias y de integración (Node test runner)
│   ├── configurar_mysql.bat               # Script Windows: inicializa base de datos con doble clic
│   ├── iniciar_backend.bat                # Script Windows: arranca servidor con doble clic
│   ├── .env.example                       # Plantilla documentada de variables de entorno
│   └── README.md                          # Documentación técnica exhaustiva del backend
└── sol-de-casa/                           # Código fuente del frontend y generadores
    ├── web/                               # Sitio modular (HTML5, Tailwind CDN, Vanilla JS)
    │   ├── index.html                     # Entrada de desarrollo web
    │   ├── assets/images/                 # Fotografías solares editoriales
    │   └── src/                           # css/ (editorial.css) y js/ (dominio y UI)
    ├── scripts/                           # Scripts de compilación reproducible
    │   ├── empaquetar_web.mjs             # Compila web/ en entregables/Sol_de_Casa_tablero.html
    │   └── generar_excel_completo.py      # Genera entregables/Sol_de_Casa_Completo.xlsx
    └── app-react/                         # Implementación React 18 + Vite con suite Vitest (41 tests)
```

---

## 🚀 Cómo Ejecutar el Proyecto

### 1. Tablero y Presentación (Sin instalar nada)
- Haz doble clic en **[`entregables/Sol_de_Casa_tablero.html`](./entregables/Sol_de_Casa_tablero.html)** para interactuar con el tablero y el recorrido de referidos.
- Haz doble clic en **[`entregables/Sol_de_Casa_Presentacion.html`](./entregables/Sol_de_Casa_Presentacion.html)** para ver la presentación de 3 minutos.
- Abre **[`entregables/Sol_de_Casa_Completo.xlsx`](./entregables/Sol_de_Casa_Completo.xlsx)** en Microsoft Excel o Google Sheets.

### 2. Backend con MySQL
1. Configura tus credenciales en `backend/.env` (puedes copiar de `backend/.env.example`).
2. Inicializa la base de datos y carga los datos de demostración:
   - **Windows:** Haz doble clic en `backend/configurar_mysql.bat` (o ejecuta `npm --prefix backend run setup`).
3. Arranca el servidor:
   - **Windows:** Haz doble clic en `backend/iniciar_backend.bat` (o ejecuta `npm --prefix backend run dev`).
4. El servidor estará escuchando en `http://localhost:3001` y el frontend mostrará automáticamente el distintivo:
   `● Backend + MySQL activo`.

### 3. Ejecutar las Pruebas Automatizadas (54 Tests)

```bash
# Pruebas del Backend (13 tests: API, seguridad, fórmulas y economía unitaria)
npm --prefix backend test

# Pruebas del Frontend y Modelo Financiero (41 tests: cálculos, Excel y simulador)
npm --prefix sol-de-casa/app-react test
```

### 4. Regenerar Entregables Reproducibles

```bash
# Recompilar el tablero autocontenido
node sol-de-casa/scripts/empaquetar_web.mjs

# Regenerar el archivo Excel maestro desde código fuente
python sol-de-casa/scripts/generar_excel_completo.py
```
