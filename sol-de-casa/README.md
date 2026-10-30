# Sol de Casa

Comparador de escenarios (React + Vite). Sin backend: todo el cálculo corre en el navegador.

```
npm install
npm run dev     # desarrollo
npm test        # valida el modelo contra cifras del Excel
npm run build   # genera dist/index.html autocontenido (abre con doble clic)
```

## Estructura
```
src/
  app/                 App, ModeloContext (estado global), paginas.js (registro de pestañas)
  domain/              lógica pura, sin React
    supuestos.js         hoja "Supuestos"
    escenarios.js        los 5 escenarios
    calculos/            leads -> embudo -> finanzas (+ tests)
    simulador.js         24 meses de caja (nivel 3), planes.js, tecnicos.js, trampa.js
  features/            una carpeta por pestaña
    resultados/ supuestos/ graficos/ recomendacion/ simulador/
  shared/              ui/ · layout/ · lib/format.js · styles/
```
Alias `@` = `src/`. Dependencias: `features -> app(contexto) -> domain`; `domain` no importa nada de la UI.
