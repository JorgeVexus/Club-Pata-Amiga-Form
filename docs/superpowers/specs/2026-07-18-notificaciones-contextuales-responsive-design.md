# Notificaciones contextuales y responsive

## Objetivo

Corregir la presentación móvil del panel de notificaciones del dashboard unificado y convertir cada notificación en una acción funcional que abra una vista interna, un chat contextual, un expediente o un modal informativo según su origen.

## Diagnóstico confirmado

El listado usa botones en cuadrícula sin restablecer de forma explícita altura, altura mínima, `white-space` ni restricciones de ancho para sus columnas. Los estilos globales del sitio anfitrión pueden imponer dimensiones incompatibles y provocar que el contenido multilínea se superponga.

El manejador actual solo marca la notificación como leída y navega a `item.link`. Existen enlaces históricos y productores activos con destinos obsoletos como `/mi-membresia`, `/dashboard` y `/miembros/detalle-solicitud`. Aunque varias notificaciones guardan `metadata.petId`, `metadata.requestId` y `metadata.source`, el dashboard no utiliza esos datos.

## Arquitectura

El dashboard incorporará un resolvedor central de acciones que reciba la notificación completa. El resolvedor priorizará metadata estructurada, después interpretará enlaces históricos conocidos y finalmente aplicará un modal informativo como cierre seguro.

Las nuevas notificaciones generadas por rutas administrativas incluirán metadata canónica:

- `action: "open_pet_chat"` y `petId` para solicitudes de información o respuestas del administrador.
- `action: "open_pet"` y `petId` para aprobación, rechazo o cambios de estado de mascota.
- `action: "open_reimbursement"` y `requestId` para actualizaciones y mensajes del Fondo Solidario.
- `action: "show_detail"` para comunicaciones informativas sin una vista operativa específica.

El widget seguirá siendo API-first y no inicializará clientes de base de datos en el navegador.

## Comportamiento por tipo

### Mascotas

- `open_pet_chat`: abre el expediente de la mascota, carga el historial existente y desplaza el modal al área de chat.
- `open_pet`: abre el expediente de la mascota correspondiente.
- Si el `petId` no existe en la cuenta cargada, muestra el modal informativo en lugar de fallar.

### Reintegros

- `open_reimbursement`: cambia a la vista interna de Reintegros, carga o localiza la solicitud y abre su detalle con mensajes.
- Enlaces históricos que contengan `detalle-solicitud`, `requestId` o `id` se traducen a esta acción.
- Si la solicitud ya no existe, se muestra el detalle informativo de la notificación.

### Cuenta y comunicaciones generales

- Aprobaciones globales, anuncios, pagos y notificaciones sin contexto operativo abren un modal V2.
- El modal incluye icono, título, mensaje completo, fecha y un botón de cierre.
- Solo se permitirá navegación directa a URLs HTTP(S) cuyo host sea `pataamiga.mx`, `www.pataamiga.mx` o `app.pataamiga.mx`.

## Compatibilidad histórica

El resolvedor reconocerá los enlaces históricos ya almacenados:

- `/mi-membresia?petId=...&action=chat` se convierte en `open_pet_chat`.
- `/mi-membresia` con `metadata.petId` se convierte en `open_pet` o chat según `metadata.source`.
- `/miembros/detalle-solicitud?id=...` se convierte en `open_reimbursement`.
- `/miembros/dashboard` y `/dashboard` se resuelven según metadata; si no existe contexto, abren el modal informativo.

No se ejecutarán enlaces `javascript:`, URLs de terceros ni rutas desconocidas.

## Diseño responsive

- El panel móvil se posicionará debajo del navbar y tendrá ancho limitado al viewport.
- La lista usará una altura máxima basada en `100dvh` y scroll interno.
- Cada tarjeta restablecerá `height: auto`, `min-height`, `white-space: normal`, `line-height`, `appearance` y `box-sizing`.
- La columna de texto tendrá `min-width: 0`; títulos y mensajes permitirán saltos de línea y `overflow-wrap`.
- La fecha permanecerá legible sin comprimir el contenido principal.
- En pantallas estrechas, la tarjeta usará icono más texto y moverá la fecha a una posición secundaria estable.

## Actualización de productores

Se corregirán los productores activos relacionados con miembros:

- Solicitud administrativa de información.
- Respuesta a apelación.
- Estados aprobado, acción requerida y rechazado de mascota.
- Actualizaciones y mensajes administrativos de reintegros.
- Aprobación o rechazo global del miembro cuando aplique.

Los destinos dejarán de depender de rutas obsoletas y usarán metadata canónica. El resolvedor conservará soporte para registros anteriores.

## Errores y seguridad

- Marcar como leída es independiente de que la acción posterior pueda abrirse.
- Un error al cargar chat, mascota o reintegro muestra el modal informativo y conserva el mensaje original.
- Los textos y valores de metadata se escapan antes de renderizarse.
- La navegación externa se restringe a hosts oficiales de Pata Amiga.

## Verificación

- Prueba responsive que impida alturas fijas y solapamientos.
- Pruebas del resolvedor para mascota, chat, reintegro, modal y enlace histórico.
- Pruebas de bloqueo de enlaces externos o peligrosos.
- Pruebas de productores con metadata y destinos canónicos.
- Regresión de marcar una o todas como leídas.
- Preview local con notificaciones representativas de cada acción.
- `npm run type-check`, `npm run lint` y `npm run build` antes de solicitar commit o push.
