# Correccion de contexto fetch en Reintegros

## Causa

Los clientes de Reintegros guardan el `fetch` nativo en `this.fetch` y luego lo invocan como metodo. En navegador esto cambia el receptor de `Window` al objeto cliente y produce `Illegal invocation`.

## Implementacion

1. Agregar una prueba que sustituya temporalmente `globalThis.fetch` por una funcion que exija `this === globalThis`.
2. Confirmar que la prueba falla con el constructor actual.
3. Enlazar el `fetch` nativo con `globalThis.fetch.bind(globalThis)` en el cliente separado y en `EmbeddedSolidarityClient`.
4. Ejecutar pruebas de widgets, sintaxis, type-check, build y lint.

## Criterios de aceptacion

- La vista de Reintegros carga sin `Illegal invocation`.
- Saldos e historial siguen usando las API Routes actuales.
- Los clientes continúan aceptando un `fetchImpl` inyectado para pruebas.
- No se agregan accesos directos a Supabase desde el navegador.

