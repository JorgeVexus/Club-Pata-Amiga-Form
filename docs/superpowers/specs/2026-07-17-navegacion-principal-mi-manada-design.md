# Navegación principal: Mi manada y consistencia de notificaciones

## Objetivo

Convertir `member-account-navbar.js` en el componente principal reutilizable de navegación para widgets externos, empezando por Perfil y Ajustes. La navegación debe conservar el lenguaje visual del dashboard unificado y controlar accesos según el rol autorizado por el backend.

## Alcance

- Sustituir el enlace “Volver al dashboard” por “Mi manada”.
- Dirigir “Mi manada” a `https://www.pataamiga.mx/pets/pet-waiting-period`.
- Mostrar ese enlace únicamente cuando `/api/auth/check-role` responda `success: true` y `role: "member"`.
- Ocultarlo para embajadores, centros de bienestar, administradores y estados relacionados con pagos.
- Mantener el logo, el acceso a orientación veterinaria, el menú de cuenta y el sistema API-first de notificaciones.
- Igualar la campana del navbar con el componente visual del dashboard unificado.
- Mantener el componente independiente del widget de emergencia.

## Arquitectura

El componente seguirá auto-inicializándose alrededor de un contenedor compatible, pero expondrá una configuración de destinos reutilizable mediante `window.PATA_AMIGA_CONFIG`. Al montar:

1. Obtiene la sesión actual desde Memberstack.
2. Si existe miembro, consulta `POST /api/auth/check-role` con `memberstackId`.
3. Guarda el rol devuelto y renderiza “Mi manada” solo para `member`.
4. Si la consulta falla o la respuesta no es válida, aplica cierre seguro: el enlace no se muestra.
5. Las notificaciones continúan usando exclusivamente las rutas `/api/notifications` existentes.

No se inicializará Supabase ni otro cliente de base de datos en el navegador.

## Diseño visual

- “Mi manada” conservará la forma de píldora turquesa clara del enlace actual.
- La campana utilizará el mismo glifo de campana relleno del dashboard unificado, dentro del mismo botón circular claro.
- El badge rojo conservará tamaño, posición y límite visual `9+`.
- Escritorio y móvil conservarán la distribución actual del navbar; solo cambia la visibilidad contextual de “Mi manada”.
- El menú hamburguesa y la orientación veterinaria no cambian de comportamiento.

## Estados y errores

- Mientras se resuelve el rol, “Mi manada” permanece oculto para evitar un destello de acceso incorrecto.
- Si no hay sesión, no se muestra el enlace.
- Si `/api/auth/check-role` devuelve error, formato inválido o un rol desconocido, se oculta el enlace y el resto del navbar continúa funcionando.
- El panel de notificaciones conserva estados de carga, vacío y error.

## Verificación

- Prueba de rol `member`: muestra “Mi manada” con la URL exacta.
- Pruebas de `ambassador` y `wellness_center`: no muestran “Mi manada”.
- Prueba de fallo del endpoint: cierre seguro sin enlace.
- Prueba de consistencia del icono de campana con el dashboard unificado.
- Regresión de notificaciones, orientación, menú, perfil, ajustes y cierre de sesión.
- `npm run type-check`, `npm run lint` y `npm run build` antes de solicitar commit o push.
