# 04 · Supuestos, Riesgos y Errores de la IA

## 1. Supuestos utilizados (Regla 3 del reto)

### A. Supuestos permitidos tomados del caso (página 6)
1. **LTV de una sola venta (Sesión 1):** `LTV = Contribución por venta ($1.625 base)`. Sin recompra, mantenimiento ni referidos.
2. **Embudo en el mismo mes:** contacto, agenda, visita y firma ocurren dentro del mismo mes.
3. **Tasas de conversión constantes:** las tasas del CRM de cada canal no cambian al mover el presupuesto.
4. **Prioridad de capacidad (100 visitas/mes):** cuando las visitas solicitadas superan la capacidad, se hacen primero las de Google (mayor valor por visita y mayor cierre) y luego las de Meta; el excedente se pierde.
5. **Interpolación lineal por tramos:** entre puntos conocidos de la curva histórica (incluyendo $0 → 0 leads y el tope de 160 leads en Google desde $8.000).
6. **Comparación doble de la agencia:** se modela tanto con su promesa ($8 CPL fijo) como con el historial real ($8.000 → 840 leads).
7. **Efecto de respuesta rápida (<5 min) + filtro en Meta:** −20% leads en Meta y nuevas tasas de 80% contacto, 40% agenda, 75% visitas hechas y 22% cierre *(marcado explícitamente como supuesto de casos parecidos, no probado aún en Sol de Casa)*.

### B. Supuestos propios del equipo (justificados)
8. **Adopción de batería del 15% sobre ventas:** sale de la prueba piloto del caso (3 compras en 20 clientes visitados = 15%). Es una muestra pequeña, por lo que se separa Cambio 1 (solo filtro) de Cambio 2 (filtro + batería).
9. **Exclusión de la batería en el flujo de caja (Mes 1 y Simulador 24 meses):** el caso no indica cómo paga el cliente la batería ni cuándo la cobra el proveedor; por prudencia financiera para Sofía, no se infla la caja con la batería.
10. **Costo de responder en <5 minutos = $0 incremental inicial:** se asume reorganización de turnos/notificaciones de Paola y Kevin antes de contratar personal o software extra.
11. **Umbrales del semáforo LTV:CAC en el tablero (Nivel 2):** Verde `≥ 3,0x` (canal saludable), Amarillo `1,0x – 2,99x` (rentable pero ajustado), Rojo `< 1,0x` (destruye valor). Estándar de unit economics en servicios.

---

## 2. Riesgos de negocio y sensibilidad (Nivel 1 y Nivel 3)

- **Riesgo de descalce de caja por crecer muy rápido:** cada instalación nueva drena **−$520** de caja en el mes de firma antes de marketing. En el simulador de 24 meses, contratar o escalar anuncios en el mes 1 sin colchón puede acercar la caja al piso de $5.000 en el **mes 3**.
- **Dependencia del Supuesto 7 (filtro):** en el simulador de 24 meses, los caminos en 2 fases (**Propio B: Escala segura** con `$677.257` al mes 24 y caja mínima de `$10.618`, y **Propio C: Máx. caja** con `$681.010` y caja mínima de `$6.184`) cuidan la caja en los meses 1–2 mientras se capacitan los 2 técnicos y escalan a `$7.000 Meta + $6.000 Google` en el mes 3. Sin embargo, **si el filtro no mejora las tasas de Meta**, escalar en el mes 3 rompería el piso de `$5.000`; por eso se valida el filtro en los meses 1–2 y se recomienda **Propio B** como plan base por su doble colchón sobre el piso (`$10.618` vs. `$5.000`).
- **Techo de demanda en Google:** arriba de $8.000/mes Google se estanca en 160 leads; el crecimiento futuro exige mejorar Meta, sumar técnicos (máx. 2 extra en el modelo) o abrir nuevos canales/referidos.

---

## 3. Sección obligatoria: «En qué se equivocó o nos confundió la IA»

### Ejemplo 1 — Error en el modelo de Excel (Nivel 1)
- **Qué hizo la IA:** en la primera versión de la hoja `Resultados`, calculó el CAC de anuncios de Meta (`$384,80`) y los dos CAC reales, pero **omitió la fila del CAC de anuncios de Google**, dejando incompleta la comparación que pide la pregunta 3 del caso.
- **Por qué estaba mal:** sin el CAC de anuncios de Google (`$335,54`), parecía que la ventaja de Google solo venía de ahorrar visitas, cuando en realidad **ya desde anuncios puros por venta Google es más barato que Meta** (`$335,54` vs. `$384,80`), a pesar de tener un CPL 5 veces mayor.
- **Cómo lo corregimos:** verificamos las preguntas del caso contra cada fila y agregamos `Resultados!B50:F50` (`=IFERROR(B6/B22,"")`), comprobando a mano `$4.000 ÷ 11,92125 = $335,54`.

### Ejemplo 2 — Error en el código del modelo web (Nivel 2 / Nivel 3)
- **Qué hizo la IA:** en la primera función `leadsPorInversion()` de React puso un mismo tope de inversión de `$10.000` para ambos canales, permitiendo invertir más de `$8.000` en Google sin bloquear el rango inválido del caso.
- **Por qué estaba mal:** la sección 5 y el Nivel 3 del PDF establecen que en Google el rango permitido es de **$0 a $8.000** porque arriba de $8.000 no hay más búsquedas (tope de 160 leads), y en el Excel `B11` devolvía vacío si `B6 > 8000`.
- **Cómo lo corregimos:** separamos `TOPE_INVERSION = { meta: 10000, google: 8000 }` en `leads.js` y agregamos un test unitario que verifica el comportamiento arriba de $8.000.

### Ejemplo 3 — Ilusión de caja en el escenario de la agencia
- **Qué podía confundir:** en el Mes 1, el escenario de la agencia muestra **más caja final ($18.287,73)** que el escenario actual ($15.736,30) y que nuestra propuesta ($14.096,92).
- **Por qué engaña:** la caja del Mes 1 sube con la agencia únicamente porque **vende menos instalaciones nuevas** (17,46 vs. 22,32), así que paga menos equipos de contado en el mes 1 mientras sigue cobrando las 22 instalaciones heredadas de septiembre. Al correr 24 meses, esa caída de ventas destruye la caja hasta **−$60.898**.

