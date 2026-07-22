# Wellness Center Widget V2 — Diseño aprobado

## Objetivo

Actualizar `public/widgets/wellness-center-widget.js` al sistema visual V2 de Pata Amiga sin perder ni alterar la funcionalidad del widget actual. El resultado debe sentirse como parte del dashboard unificado y del dashboard administrativo V2, tanto en escritorio como en móvil.

## Alcance

La actualización incluye:

- dashboard del centro aprobado;
- solicitud pendiente;
- solicitud rechazada y flujo de apelación;
- apelación en revisión;
- cuenta cancelada;
- edición de perfil;
- solicitudes y administración de citas;
- reintegros y evidencias;
- sucursales, fotografías y geolocalización;
- información bancaria;
- bienvenida posterior a aprobación;
- salida o cancelación del centro;
- estados de carga, error, vacío y operación en curso.

La página existente `src/app/bienestar/estado/page.tsx` confirma que el repositorio ya contempla los estados principales. El widget público seguirá siendo la experiencia canónica para su integración en Webflow.

## Estrategia

Se conservará la lógica funcional del widget y se sustituirá progresivamente su capa de presentación. No se reescribirán las integraciones ni se trasladará la lógica a un framework nuevo.

La separación será:

1. **Datos e integraciones:** continúan usando las funciones y API Routes actuales.
2. **Estado y acciones:** conservan contratos, payloads y transiciones existentes.
3. **Renderizado V2:** adopta una estructura consistente de shell, navegación, contenido, formularios, tablas, tarjetas, estados y modales.
4. **Estilos V2:** quedan aislados bajo clases específicas del widget para evitar colisiones con Webflow y otros scripts.

## Sistema visual

El widget reutilizará los tokens consolidados del dashboard unificado:

- fondo crema: `#F8F5EE`;
- superficies: `#FFFFFF`;
- turquesa principal: `#21BCAF`;
- turquesa profundo: `#1E5D57`;
- turquesa suave: `#E5F5F2`;
- naranja de acción: `#FE8F15`;
- texto principal: `#153F3B`;
- texto secundario: `#4E6865`;
- texto atenuado: `#8A9692`;
- divisores: `#ECE7DD`;
- títulos: `Fraiche` con respaldo `Outfit`;
- cuerpo e interfaz: `Outfit`.

Los módulos usarán bordes ligeros, radios de 18–24 px y sombras discretas. No se reutilizará el tratamiento anterior de bordes negros gruesos, sombras rígidas o fondos genéricos grises.

## Arquitectura de interfaz

### Shell aprobado

- Sidebar blanco en escritorio con navegación funcional.
- Fondo crema en el área principal.
- Encabezado con nombre del establecimiento y estado.
- Resumen de solicitudes, citas y reintegros.
- Accesos a citas, pagos, perfil y salida de la red.
- Navegación móvil compacta y persistente donde sea apropiado.

### Estados previos o bloqueados

Los estados `pending`, `rejected`, `appealed` y `cancelled` compartirán un patrón visual común, sin mostrar herramientas no disponibles para ese estado.

- `pending`: explicación de revisión y formulario complementario existente.
- `rejected`: motivo informado, formulario de apelación y contacto de soporte.
- `appealed`: confirmación y expectativa de seguimiento.
- `cancelled`: explicación del bloqueo y canal de reactivación o soporte.

### Modales y formularios

- Se conservarán los campos, validaciones, cargas y payloads existentes.
- Los labels permanecerán encima de sus controles.
- Los errores se mostrarán junto al campo o acción que los origina.
- Los modales usarán el mismo lenguaje de superficies, divisores y botones V2.
- Los estados de carga deshabilitarán acciones duplicadas y comunicarán progreso.

## Funcionalidad que debe preservarse

- Obtención de datos mediante `/api/wellness/me`.
- Actualización mediante `/api/wellness/update`.
- Aceptación, rechazo y seguimiento de citas.
- Carga de evidencias de citas.
- Consulta de reintegros.
- Envío de apelación y transición a `appealed`.
- Cancelación de cuenta.
- Modal de bienvenida y persistencia de `welcome_shown`.
- Edición de datos generales, legales, fiscales y bancarios.
- Validación y edición de CLABE.
- Edición de ubicación principal y sucursales.
- Geolocalización.
- Carga de logo y fotografías por ubicación.
- Serialización de fotografías y sucursales.
- Auto-inicialización del widget.

## Seguridad e integración externa

- El widget seguirá el patrón API-first.
- No se incorporará ningún cliente directo de Supabase en el navegador.
- La URL base se resolverá desde `window.PATA_AMIGA_CONFIG` con el valor productivo como respaldo.
- Los datos provenientes de APIs se escaparán antes de insertarse como HTML.
- No se expondrán llaves ni secretos.
- Las acciones sensibles conservarán la autenticación disponible del usuario.

## Compatibilidad

- El script público conservará su nombre y mecanismo de inclusión actual:

  `<script src="https://app.pataamiga.mx/widgets/wellness-center-widget.js"></script>`

- Se conservará el contenedor esperado por Webflow y la auto-inicialización.
- Los cambios de CSS se aislarán para no modificar estilos externos.
- La experiencia será responsive desde 320 px.
- Se respetarán foco visible, navegación por teclado y reducción de movimiento.

## Estrategia de implementación

La migración se hará por capas para facilitar la detección de regresiones:

1. Crear pruebas de caracterización para los contratos funcionales actuales.
2. Incorporar tokens, shell y componentes visuales V2.
3. Migrar los estados pendiente, rechazado, apelado y cancelado.
4. Migrar el dashboard aprobado.
5. Migrar perfil, citas, pagos, bienvenida y cancelación.
6. Crear un preview local del widget real con estados seleccionables.
7. Ejecutar auditoría sistemática, pruebas, TypeScript, build y lint.

## Verificación y aceptación

La implementación se considerará lista cuando:

- todos los estados puedan previsualizarse localmente;
- todas las acciones existentes sigan conectadas a sus funciones actuales;
- las pruebas de caracterización y nuevas pruebas V2 pasen;
- el widget no inicialice Supabase en el navegador;
- el diseño coincida con el fondo crema y los tokens V2;
- escritorio y móvil no presenten desbordamientos ni controles inaccesibles;
- `npm run type-check`, `npm run build` y `npm run lint` se hayan ejecutado;
- se haya completado una revisión de regresiones y búsqueda activa de errores.

## Fuera de alcance

- Cambiar esquemas de base de datos.
- Modificar contratos de API sin una necesidad funcional comprobada.
- Cambiar el proceso de aprobación administrativo.
- Integrar el widget dentro de otro dashboard.
- Eliminar funciones existentes por simplificación visual.
