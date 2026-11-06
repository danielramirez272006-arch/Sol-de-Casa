# Sol de Casa · Aplicación Web (Niveles 1, 2 y 3)

Tablero interactivo, comparador de escenarios, simulador de caja a 24 meses y conector `.xlsx` construido con **React 18 + Vite + Recharts + Vitest**. Sin backend: todo el cálculo corre localmente en el navegador.

## Comandos principales

```bash
npm install
npm run dev               # servidor de desarrollo
npm test                  # ejecuta los 37 tests en tests/ contra las cifras del Excel
npm run build             # genera dist/index.html autocontenido
npm run build:entregable  # compila y copia dist/index.html a ../entregables/Sol_de_Casa_tablero.html
npm run preview           # sirve el paquete de producción compilado
```

## Arquitectura de carpetas

```text
sol-de-casa/
├── src/
│   ├── app/               # App, ModeloContext (estado global) y registro de pestañas
│   ├── domain/            # Lógica de negocio pura (0 dependencias de React)
│   │   ├── index.js       # Punto de entrada único (@/domain)
│   │   ├── modelo/        # supuestos, escenarios, planes, técnicos y análisis de trampa
│   │   ├── calculos/      # leads -> embudo -> finanzas
│   │   ├── simulador/     # flujo de caja operativo de 24 meses (Nivel 3)
│   │   └── excel/         # lectura, auditoría celda a celda y exportación .xlsx
│   ├── features/          # Vistas modulares (1 carpeta por pestaña)
│   │   ├── tablero/       # Nivel 2 en vivo + embudo visual
│   │   ├── resultados/    # Matriz de 5 escenarios y KPIs
│   │   ├── supuestos/     # Edición de parámetros y escenarios
│   │   ├── recomendacion/ # Nota ejecutiva de 1 página + errores de IA
│   │   ├── graficos/      # Curvas, trampa y embudos comparados
│   │   ├── simulador/     # Simulador 24m + pitch de 2 min
│   │   └── excel/         # Drag & Drop .xlsx + auditoría contra Resultados
│   └── shared/            # layout/, ui/, lib/format.js y styles/index.css
└── tests/                 # Pruebas unitarias, de integración Excel y renderizado SSR
```

Alias `@` → `src/`. Flujo unidireccional: `features → app (contexto) → domain`.
