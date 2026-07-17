# Dashboard de miembros V2 — diseño de adaptación

## Objetivo

Recrear en el widget unificado de miembros la interfaz del dashboard de `pata-amiga-reference`, conservando los copys, estados, reglas, autenticación Memberstack y llamadas API que ya funcionan en producción.

## Decisión arquitectónica

No se copiará el dashboard de referencia como una aplicación nueva. Su presentación se trasladará al widget existente mediante una nueva capa visual, mientras `UnifiedWidget` seguirá siendo el controlador de sesión, carga de mascotas, estados de aprobación, apelaciones, documentos, chat y bajas.

El widget continuará cumpliendo la regla API-First: ninguna clave ni cliente de Supabase se incorporará al navegador. Todos los datos seguirán entrando mediante Memberstack y `/api/*`.

## Alcance visual

- Fondo crema, superficies blancas, turquesa, verde profundo y naranja idénticos al repositorio de referencia.
- Sidebar de escritorio con logo, navegación, cuenta, cierre de sesión y resumen del usuario.
- Barra móvil compacta y navegación adaptable sin scroll horizontal.
- Encabezado con saludo y estado real de la membresía.
- Tarjetas KPI para membresía, cantidad de mascotas y disponibilidad de reintegros.
- Sección “Mis peludos” con tarjetas horizontales equivalentes a `PetCard.tsx`.
- Estados visuales de mascota: aprobada, en revisión, acción requerida, rechazada, apelada y dada de baja.
- Actividad reciente derivada de los datos disponibles, sin inventar información.
- Tarjeta de centros aliados y accesos a orientación veterinaria, reintegros y panel de embajador.
- Modales, formularios y pantallas intermedias con el mismo sistema visual.

## Funcionalidad que se conserva

- Detección de sesión con Memberstack.
- Verificación de rol y condición de embajador.
- Carga y actualización de mascotas.
- Alta de mascotas, fotos y documentos.
- Historial y envío de apelaciones.
- Chat y solicitudes de documentación.
- Flujo de baja de mascota.
- Estados de pago, revisión, cancelación, rechazo y aprobación.
- Modales de bienvenida y avisos existentes.
- Configuración mediante `window.PATA_AMIGA_CONFIG`.

## Navegación del widget

La navegación será interna y no recargará Webflow. Cada opción activará una vista del mismo controlador:

1. **Inicio:** resumen, KPIs, mascotas y actividad.
2. **Mis peludos:** listado completo y acciones existentes.
3. **Reintegros:** acceso a las solicitudes ya disponibles; si una función vive fuera del widget, se conserva su URL actual.
4. **Orientación vet 24/7:** abre la integración actual.
5. **Centros aliados:** conserva el destino configurado actualmente.
6. **Panel de embajador:** sólo aparece cuando el rol lo permite.
7. **Mi cuenta:** conserva el destino o acción actual.
8. **Cerrar sesión:** sólo se muestra con sesión activa y usa Memberstack.

## Estrategia de implementación

### Fase 1 — Base y dashboard de Inicio

- Incorporar tokens visuales con prefijo `pata-v2-*` para evitar colisiones con Webflow.
- Construir shell responsive, sidebar, encabezado y KPIs.
- Representar todas las mascotas en Inicio, no únicamente la mascota seleccionada.
- Mantener adaptadores hacia los métodos actuales para abrir detalles y ejecutar acciones.

### Fase 2 — Mis peludos y acciones

- Aplicar la tarjeta horizontal del repositorio nuevo.
- Adaptar detalles, documentos, apelaciones, actualización y baja al mismo estándar.
- Mantener los IDs o enlaces de eventos que consume la lógica existente hasta reemplazarlos por `data-action` de forma comprobada.

### Fase 3 — Vistas secundarias

- Unificar reintegros, orientación veterinaria, centros aliados, cuenta y panel de embajador dentro del shell cuando la función exista en el widget.
- Para destinos externos, conservar enlaces reales y mostrar el estado activo correcto en la navegación.

### Fase 4 — Estados y responsive

- Adaptar pago pendiente, pago procesándose, revisión, rechazo, cancelación, ausencia de mascotas, carga y error.
- Verificar escritorio, tablet y móvil con los mismos puntos de quiebre de la referencia.

## Límites

- No se modifican copys funcionales ni reglas de negocio.
- No se cambia Memberstack por Supabase Auth.
- No se conectará el widget directamente a Supabase.
- No se reconstruyen en esta etapa los endpoints ni el modelo de datos.
- No se eliminará `pet-cards-widget.js` hasta confirmar paridad del widget unificado en Webflow.

## Validación

- Pruebas estáticas que confirmen la presencia del shell, navegación condicional y estados de tarjetas.
- Pruebas de sintaxis del JavaScript público.
- Recorrido manual con estados simulados existentes de `pataDebug`.
- Verificación visual en `http://127.0.0.1:3000` en escritorio y móvil.
- Ejecución obligatoria de `npm run build`, `npm run type-check` y `npm run lint`, documentando cualquier fallo preexistente y cualquier regresión nueva.

## Criterios de aceptación

- El dashboard coincide visualmente con el repositorio nuevo en estructura, paleta, tipografía, espaciado y tarjetas.
- Todas las funciones actuales siguen accesibles.
- Las acciones de mascota operan sobre la mascota correcta.
- El panel de embajador y cerrar sesión son condicionales.
- No existen llamadas directas nuevas a Supabase desde el widget.
- El diseño es utilizable desde 360 px de ancho sin desbordamiento horizontal.
