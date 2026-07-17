# Reintegros en Dashboard V2 — Implementation Plan

## Objetivo

Integrar el Fondo Solidario bajo la etiqueta visual “Reintegros” dentro del widget unificado, conservando Memberstack, reglas de carencia, topes anuales, solicitudes, documentos, centros aliados y mensajería actuales.

## Arquitectura

- `UnifiedWidget` incluye un cliente API interno para `/api/solidarity/*` y `/api/upload/solidarity-document`, de modo que Webflow solo necesita cargar el widget unificado.
- `solidarity-client.js` permanece como capa de compatibilidad y para pruebas aisladas; si ya esta cargado, el widget puede reutilizarlo.
- `UnifiedWidget` conserva navegación y presenta tres vistas: `reimbursements`, `newReimbursement` y `reimbursementDetail`.
- El navegador nunca inicializa Supabase.
- Los widgets antiguos permanecen disponibles como respaldo durante la validación.

## Tareas

### Formulario visual de nueva solicitud

- [x] Agregar una prueba que exija tarjetas para categoría y mascota, además de zonas individuales para documentos.
- [x] Sustituir los selectores de categoría y mascota sin cambiar los valores enviados al backend.
- [x] Incorporar campos y documentos condicionales por tipo de apoyo.
- [x] Mantener carga API-first y asociación de documentos a la solicitud.
- [x] Verificar pruebas, sintaxis, tipos y estilos. El build global conserva un bloqueo preexistente por `MissingDocType` en `comm.actions.ts` y el lint global dos errores dentro de `temp-pata-amiga`; las verificaciones dirigidas del widget no presentan errores.

1. Crear pruebas del cliente API y del contrato de navegación interna.
2. Crear el cliente compartido con historial, saldos, solicitud, detalle, mensajes y cargas.
3. Adaptar `/app/reintegros` como vista interna de saldos e historial.
4. Adaptar `/app/reintegros/nueva` como formulario interno conectado al endpoint existente.
5. Integrar detalle y mensajería usando los endpoints actuales.
6. Añadir datos simulados locales, responsive y estados de carga/error/éxito.
7. Verificar sintaxis, pruebas, lint dirigido, type-check y preview local.

## Criterios de aceptación

- “Reintegros” no abandona el dashboard.
- Los topes se obtienen del backend, no se recalculan sólo en el navegador.
- Sólo aparecen mascotas elegibles según la respuesta actual.
- La solicitud usa los mismos tipos `medical_emergency`, `annual_vaccination` y `death`.
- Se conserva la elección entre transferencia y centro aliado.
- Los documentos pasan por `/api/upload/solidarity-document`.
- El historial abre el detalle correcto y permite continuar la conversación.
