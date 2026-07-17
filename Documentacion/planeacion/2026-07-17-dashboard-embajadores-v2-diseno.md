# Diseño V2 del dashboard independiente de Embajadores

## Objetivo

Adaptar el widget independiente de Embajadores al diseño de `/embajador` del repositorio nuevo sin alterar autenticación, roles, datos, endpoints, chat administrativo, pagos, referidos ni materiales existentes.

## Alcance y separación de roles

- El dashboard continuará alojado en `https://www.pataamiga.mx/embajadores/dashboard`.
- El inicio de sesión continuará redirigiendo a esa URL cuando `/api/auth/check-role` determine el rol de embajador.
- El enlace `Panel de embajador` del dashboard de miembros continuará siendo externo.
- No se unificarán todavía los roles miembro, embajador y centro aliado.
- Se mantendrá el embed actual de `ambassador-widget.js`; el deploy actualizará el diseño sin requerir otro script en Webflow.

## Estrategia técnica

Se conservarán las funciones actuales de obtención y mutación de datos. La implementación sustituirá únicamente el shell visual, los renderizadores y los estilos del dashboard aprobado. Los endpoints seguirán siendo la fuente de verdad:

- Perfil y métricas: `/api/ambassadors/by-memberstack` y `/api/ambassadors/[id]`.
- Pagos y cortes: `/api/ambassadors/[id]/payouts`.
- Chat administrativo: `/api/ambassadors/[id]/messages`.
- Materiales: `/api/ambassador-materials`.
- Foto: `/api/upload/ambassador-photo`.
- Código: generación, cambio, reenvío y solicitud mediante las rutas existentes.
- Cancelación: `/api/ambassadors/[id]/cancel`.

El widget no inicializará un cliente de base de datos nuevo. La conexión realtime existente para mensajes administrativos se conservará sin cambiar sus tablas o contratos.

## Navegación interna

El widget aprobado tendrá cuatro vistas internas, sin cambiar la URL pública:

1. **Resumen:** banner, código, KPIs y referidos recientes.
2. **Métricas:** métricas completas, filtros y estado de todos los referidos.
3. **Materiales:** recursos descargables, filtros por tipo y newsletters.
4. **Mi cuenta:** perfil, fotografía, datos bancarios, cambio de código y cancelación.

Los pills superiores seguirán el diseño del repositorio nuevo: horizontales, delgados, fondo blanco y estado activo turquesa. En móvil podrán desplazarse horizontalmente sin ocultar opciones.

## Vista Resumen

### Banner de membresía

Cuando el embajador no tenga membresía activa se mostrará el banner verde oscuro de la referencia con el copy actual y el CTA `Quiero mi membresía`. El CTA utilizará la URL de registro o selección de plan configurada para producción. Si ya tiene membresía, el banner no se mostrará.

### Código de embajador

La tarjeta principal usará verde oscuro, detalle orgánico translúcido y acento lima. Mantendrá:

- Código actual.
- Copiar código.
- Compartir link mediante Web Share API o portapapeles.
- Personalización disponible una sola vez.
- Estados de guardado y error.

### Indicadores

La columna derecha mostrará:

- Referidos activos.
- Comisiones del mes actual.
- Total histórico.
- Fecha de corte o pago cuando exista.

Los valores procederán de las métricas actuales y nunca se recalcularán únicamente desde el DOM.

### Referidos recientes

La tabla mostrará nombre, fecha, plan, comisión y estado. En ausencia de datos usará el empty state de la referencia y conservará el CTA hacia Métricas.

## Vista Métricas

Se mantendrán todos los referidos, filtros de estado, comisiones y estados administrativos actuales. La presentación cambiará a tarjetas y filas compactas del nuevo estándar. Los estados aprobado, pendiente, rechazado y pagado conservarán sus valores reales y tendrán chips visuales accesibles.

## Vista Materiales

Se conservarán los recursos que administración publica mediante `/api/admin/ambassador-materials`. La vista tendrá filtros por todos, newsletter, imagen, PDF, video y otros cuando existan. Cada recurso conservará descarga, vista previa, título y descripción actuales.

## Vista Mi cuenta

Se conservarán:

- Edición de perfil y datos personales permitidos.
- Fotografía del embajador.
- Banco y CLABE.
- Detección y selección manual de banco.
- Cambio o solicitud de cambio de código.
- Reenvío de correo de código.
- Cancelación con confirmación.

Los datos bancarios serán obligatorios para recibir cortes, pero el dashboard podrá mostrarse mientras estén pendientes. La edición usará los inputs, select y estados de error del nuevo diseño.

## Chat con administración

El chat permanecerá disponible únicamente para embajadores aprobados. Mantendrá:

- Historial desde `/api/ambassadors/[id]/messages`.
- Envío con `senderRole: ambassador`.
- Marcado de lectura para embajador.
- Contador de mensajes no leídos.
- Actualización realtime existente.

La burbuja y el modal se rediseñarán con colores, radios, tipografía y sombras del repositorio nuevo sin alterar el flujo de mensajes con el dashboard administrativo.

## Estados del proceso

También se rediseñarán y conservarán las acciones existentes para:

- Usuario que todavía no es embajador.
- Solicitud pendiente.
- Solicitud rechazada y reenvío permitido.
- Solicitud cancelada.
- Embajador aprobado sin código definitivo.
- Errores de red o datos incompletos.

Ningún estado perderá sus enlaces, reintentos o acciones actuales.

## Diseño responsive y accesibilidad

- Fondo crema, tarjetas blancas y acentos verde oscuro, turquesa y lima.
- Fraiche para títulos y Outfit para cuerpo e interfaz.
- Contenedor central máximo aproximado de `980px`.
- Grid de código y KPIs en escritorio; tarjetas apiladas en móvil.
- Navegación horizontal desplazable en móvil.
- Tablas adaptadas como filas legibles sin scroll horizontal forzado.
- Estados hover, pressed y focus-visible.
- Botones con nombres accesibles y regiones de estado anunciables.
- Respeto por `prefers-reduced-motion`.

## Preview y pruebas

El preview local permitirá revisar al menos:

- Aprobado con y sin membresía.
- Pendiente.
- Rechazado.
- Aprobado sin código.
- Sin datos bancarios.
- Referidos vacíos y con datos.
- Materiales vacíos y con distintos formatos.
- Chat con mensajes y contador no leído.
- Desktop y móvil.

Las pruebas automatizadas fijarán los contratos de endpoints, acciones globales, separación de roles, navegación interna, estados y ausencia de acceso directo nuevo a base de datos.

## Fuera de alcance

- Unificación de los tres roles en una sola cuenta o dashboard.
- Cambios en los dashboards administrativos.
- Migración de Memberstack o Supabase.
- Cambios en reglas de comisión, aprobación o pago.
- Reescritura de APIs existentes.
