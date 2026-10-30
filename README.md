# Caso C · Sol de Casa

Solución completa de los **Niveles 1, 2 y 3** para el reto *Sol de Casa* (sin necesidad de backend: todo corre en el navegador y se sincroniza con archivos `.xlsx`).

## Estructura del espacio de trabajo

- **`Sol_de_Casa_tablero.html`** — Tablero interactivo autocontenido en un solo archivo (abre con doble clic sin instalar nada).
- **`Sol_de_Casa_Completo.xlsx`** — Libro Excel completo (Niveles 1, 2 y 3) con la nueva pestaña `Simulador_24m` 100% en fórmulas vivas, formato condicional, auditoría del Mes 1 y gráfico nativo de evolución de caja. Compatible con carga directa en el tablero web.
- **`sol-de-casa/`** — Proyecto fuente en React + Vite + Recharts + Vitest (`npm run dev`, `npm test`, `npm run build`).
- **`docs/`** — Enunciado original (`Caso_C_-_Sol_de_Casa.pdf`) y hoja de cálculo base (`Sol_de_Casa_Nivel_1.xlsx`).
- **`md/`** — Documentación ejecutiva, respuestas a las 7 preguntas, cuentas a mano, supuestos, errores de la IA y guiones de presentación.

## Cómo ejecutar el proyecto en desarrollo

```bash
cd sol-de-casa
npm install
npm test        # corre toda la suite de validación contra el Excel
npm run dev     # abre el servidor local en http://127.0.0.1:5173/
npm run build   # regenera dist/index.html autocontenido
```
