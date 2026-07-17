# Diseño del Admin V2 — Fase 1

## Objetivo

Adaptar el dashboard administrativo actual al lenguaje visual de `/admin` del repositorio clonado `temp-pata-amiga`, conservando sin cambios funcionales sus permisos, APIs, tablas, filtros, modales, operaciones y rutas profundas.

Esta fase no reconstruye los módulos internos. Crea un nuevo shell visual y un resumen administrativo real sobre la arquitectura existente.

## Alcance aprobado

### Se rediseña

- El contenedor general del dashboard.
- La navegación lateral de escritorio.
- El drawer de navegación móvil.
- El encabezado superior.
- El resumen global del admin.
- Las tarjetas de métricas reales.
- Las colas rápidas de trabajo pendiente.
- Los estados de carga, error y ausencia de datos del resumen.
- La jerarquía tipográfica, colores, espacios, radios y superficies.

### Se conserva funcionalmente

- Autenticación de Memberstack.
- Verificación de administrador y superadministrador mediante `/api/admin/me`.
- Restricciones de vistas por rol.
- Navegación profunda por `tab`, `member`, `requestId`, `ambassadorId` y `wellnessCenterId`.
- Todas las API Routes administrativas actuales.
- Tablas de miembros, mascotas, embajadores, centros y reintegros.
- Modales de detalle, aprobación, rechazo y apelación.
- Finanzas, facturación, reportes, comunicaciones y materiales.
- Leads, newsletter, documentos legales, configuración y bajas.
- Notificaciones y actualización en sitio.

## Arquitectura

El componente `AdminDashboard` seguirá siendo el orquestador de autenticación, navegación, selección y carga de datos. La primera fase separará la presentación del resumen en componentes enfocados, sin mover ni reescribir la lógica crítica de los módulos existentes.

El nuevo shell envolverá la salida actual de `renderContent()`. Cuando el filtro activo sea el resumen global, mostrará el nuevo `AdminOverview`; para los demás filtros, renderizará exactamente los componentes actuales dentro del área de contenido rediseñada.

### Unidades propuestas

- `AdminShell`: estructura de sidebar, encabezado y área principal.
- `AdminSidebarV2`: representación visual nueva del catálogo de opciones actual.
- `AdminHeaderV2`: saludo, menú móvil y acciones administrativas existentes.
- `AdminOverview`: composición del resumen.
- `AdminMetricGrid`: métricas reales con estados de carga y error.
- `AdminQueueSummary`: accesos a colas pendientes usando los filtros actuales.

No se duplicará lógica de negocio dentro de estos componentes. Recibirán datos y callbacks desde `AdminDashboard`.

## Navegación

La barra lateral seguirá usando `activeFilter`, `activeSubStatus`, `pendingCounts` y `onFilterChange` como contrato. Los grupos actuales se conservarán:

1. Gestión general.
2. Apoyo económico.
3. Pagos y facturación.
4. Gestión de pagos.
5. Centros registrados.
6. Leads Webflow.
7. Comunicaciones.
8. Reporteo.
9. Documentos legales.
10. Ajustes exclusivos de superadministrador.

Visualmente se compactarán para aproximarse al repo nuevo. Los subgrupos extensos podrán expandirse y contraerse. Los contadores pendientes seguirán enlazados a las mismas vistas.

En móvil se conservará el drawer actual, con overlay, cierre explícito, bloqueo de scroll y foco visible. No se convertirá en navegación inferior porque el catálogo administrativo es demasiado amplio.

## Resumen y métricas

El resumen mostrará exclusivamente datos reales disponibles. No se insertarán cifras demostrativas en la implementación de producción.

### Métricas iniciales

- Total de miembros.
- Total de embajadores.
- Centros aliados activos.
- Total de reintegros/apoyos registrado por el endpoint actual.
- Contadores de solicitudes pendientes por categoría.
- Actividad administrativa reciente ya provista por `/api/admin/activity`.

Las métricas que el backend actual no entregue de forma confiable —por ejemplo MRR, tiempo medio de respuesta o series históricas— se omitirán en esta fase. No se calcularán en el navegador a partir de datos parciales.

### Colas rápidas

- Mascotas o miembros por revisar.
- Solicitudes de reintegro nuevas.
- Embajadores pendientes.
- Centros pendientes.
- Apelaciones pendientes para superadministradores.

Cada acceso ejecutará `onFilterChange` con el filtro y subestado existente. No abrirá rutas ni operaciones nuevas.

## Diseño visual

- Fondo crema cálido equivalente al repo nuevo.
- Sidebar verde petróleo fijo en escritorio.
- Superficies blancas con sombra tenue y radios contenidos.
- Turquesa como acento principal y naranja para prioridades operativas.
- Fraiche para encabezados y Outfit para información y controles.
- Números con cifras tabulares para facilitar lectura de métricas.
- Botones y enlaces con estados hover, active, focus y disabled.
- Densidad suficiente para operación administrativa sin sacrificar legibilidad.

El diseño tomará la estructura y proporciones de `temp-pata-amiga/src/app/admin`, pero no copiará su capa de datos ni su autenticación Supabase.

## Flujo de datos

1. Memberstack entrega la sesión activa.
2. `/api/admin/me` valida rol y permisos.
3. `AdminDashboard` carga métricas, contadores y actividad usando `adminFetch`.
4. `AdminOverview` recibe únicamente datos ya autorizados.
5. Las colas rápidas devuelven la navegación a `AdminDashboard` mediante callbacks.
6. Los módulos existentes siguen consumiendo sus endpoints actuales.

## Manejo de estados

- Mientras se valida la sesión, se mostrará un skeleton estructural del nuevo shell.
- Si falla una métrica secundaria, el resto del resumen permanecerá utilizable.
- Las tarjetas sin datos mostrarán `Sin datos disponibles`, nunca `0` inventado cuando no existe respuesta válida.
- Los errores críticos de autenticación conservarán las redirecciones actuales.
- Las acciones sensibles continuarán dentro de sus componentes y modales existentes.

## Seguridad y regresión

- No se cambia `adminFetch` ni el mecanismo de sesión.
- No se mueven operaciones sensibles al cliente.
- No se relajan restricciones de superadministrador.
- No se reemplazan identificadores de filtros ni parámetros de URL.
- El preview local será una página aislada con información demostrativa; no ejecutará mutaciones.
- La implementación real se probará contra los contratos actuales y con pruebas de navegación y roles.

## Estrategia de entrega

1. Construir un preview visual local aislado.
2. Validar la fidelidad visual y responsive con el usuario.
3. Incorporar el shell nuevo detrás de los contratos actuales.
4. Integrar el resumen con métricas reales.
5. Verificar cada módulo actual dentro del nuevo shell.
6. Ejecutar pruebas, TypeScript, lint y build.
7. Solicitar aprobación explícita antes de commit y push.

## Criterios de aceptación

- El dashboard se aproxima visualmente al `/admin` del repo nuevo.
- Todas las opciones actuales siguen accesibles.
- Las restricciones por rol permanecen iguales.
- Los links profundos y notificaciones siguen abriendo el registro correcto.
- Ninguna métrica muestra datos simulados en producción.
- Los módulos internos mantienen sus acciones y conexiones actuales.
- El dashboard funciona en escritorio, tablet y móvil.
- Existe un preview local antes de integrar la implementación.
