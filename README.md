# Caso C · Sol de Casa

Solución integral de los **Niveles 1, 2 y 3** para el reto *Sol de Casa* (sin necesidad de backend: todo el motor financiero y la sincronización `.xlsx` corren 100% en el navegador).

## Organización del repositorio

```text
Sol de Casa/
├── entregables/                           # Archivos finales listos para abrir o entregar
│   ├── Sol_de_Casa_tablero.html           # Tablero interactivo autocontenido (doble clic)
│   └── Sol_de_Casa_Completo.xlsx          # Excel completo Niveles 1–3 con fórmulas vivas
├── docs/                                  # Insumos originales del caso
│   ├── Caso_C_-_Sol_de_Casa.pdf           # Enunciado oficial (12 páginas)
│   └── Sol_de_Casa_Nivel_1.xlsx           # Hoja de cálculo original de Nivel 1
├── md/                                    # Documentación ejecutiva, cuentas, IA y pitch
│   ├── README.md                          # Índice de lectura de la documentación
│   ├── 01_estado_y_pendientes.md          # Checklist completo de los 3 niveles
│   ├── 02_respuestas_7_preguntas_y_cuentas.md
│   ├── 03_recomendacion_1_pagina.md
│   ├── 04_supuestos_riesgos_y_errores_ia.md
│   └── 05_guion_presentacion_y_pitch.md
├── scripts/                               # Scripts reproducibles de apoyo
│   └── generar_excel_completo.py          # Construye entregables/Sol_de_Casa_Completo.xlsx
└── sol-de-casa/                           # Aplicación fuente (React + Vite + Recharts + Vitest)
    ├── src/                               # Código fuente modular (app, domain, features, shared)
    └── tests/                             # Suite de pruebas automatizadas contra el Excel
```

## Cómo ejecutar el proyecto en desarrollo

```bash
cd sol-de-casa
npm install
npm test                  # valida el motor financiero y de Excel (34 tests)
npm run dev               # abre el servidor local en http://127.0.0.1:5173/
npm run build:entregable  # compila y actualiza ../entregables/Sol_de_Casa_tablero.html
```
