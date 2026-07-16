# Rediseño del email día 0 de documentación faltante

**Fecha:** 2026-07-16  
**Estado:** Diseño propuesto para revisión  
**Alcance:** Únicamente el email de seguimiento del día 0

## Objetivo

Adaptar el correo automático del día 0 para que reproduzca la composición visual de `BOLD_MAILING_MAYO_DIA15-01.jpg`, conservando sin cambios la lógica existente del cron, la detección de documentos faltantes y el enlace seguro para completar el perfil de la mascota.

Los correos de los días 10, 13, 14 y 15 quedan expresamente fuera de este cambio. Se modificarán por separado cuando se reciban sus referencias.

## Comportamiento que se conserva

- El cron continúa ejecutándose diariamente y enviando seguimientos en los días 0, 10, 13, 14 y 15.
- El email del día 0 conserva los datos dinámicos del miembro y de la mascota.
- El bloque de pendientes muestra solo la foto, solo el certificado médico o ambos, según `missingDocs`.
- El botón continúa utilizando el `uploadUrl` firmado generado por el flujo actual.
- El asunto y el registro de comunicaciones mantienen el identificador `missing_docs_day_0`.
- Los templates de los días 10, 13, 14 y 15 no cambian.

## Dirección visual

La plantilla será HTML compatible con clientes de correo, de aproximadamente 600 px de ancho y adaptable a móvil. No se convertirá el correo completo en una sola imagen.

- Fondo celeste inspirado en la referencia.
- Hero con saludo a la izquierda y un placeholder de imagen de gato en la parte superior derecha.
- Huella amarilla y acentos turquesa construidos con recursos reemplazables o formas compatibles.
- Titulares con Fraiche cuando esté disponible y fallback redondeado seguro.
- Texto de cuerpo con Helvetica Rounded cuando esté disponible y fallbacks `Arial Rounded MT Bold`, Arial y sans-serif.
- Bloque turquesa redondeado para los documentos pendientes.
- CTA amarillo con texto dinámico para completar el perfil de la mascota.
- Cierre con placeholder para la composición de mascotas, forma turquesa y placeholder del logotipo.
- Espaciado, jerarquía y proporciones equivalentes a la referencia, adaptados a las restricciones de HTML email.

## Contenido dinámico

- `{firstName}`: primer nombre del miembro.
- `{petName}`: nombre de la mascota.
- `{missingDocs}`: controla qué filas se muestran en el bloque de pendientes.
- `{uploadUrl}`: destino del botón principal.

El texto base del día 0 seguirá la intención de la referencia: bienvenida a la manada, explicación amable de que faltan pocos detalles, descripción de los documentos requeridos, promesa de rapidez y disponibilidad de ayuda.

## Placeholders de imágenes

Mientras se reciben los recursos finales, la plantilla mostrará placeholders claramente identificados para:

1. Foto principal del gato del hero.
2. Composición inferior de perros y gatos.
3. Logotipo Pata Amiga.
4. Icono de foto de mascota.
5. Icono de certificado médico.

Los placeholders se definirán como URLs centralizadas para que puedan reemplazarse sin reestructurar el template.

## Arquitectura de implementación

- Crear una rama visual específica dentro del generador de emails cuando `followupDay === 0`.
- Mantener el renderer actual como fallback para los días 10, 13, 14 y 15.
- Reutilizar el mismo generador del día 0 en el preview administrativo para evitar diferencias entre la vista previa y el email enviado por Resend.
- Mantener estilos inline y tablas de presentación para maximizar compatibilidad con Gmail, Outlook y clientes móviles.

## Responsive y accesibilidad

- El contenido conservará orden de lectura lineal en pantallas pequeñas.
- Las imágenes tendrán `alt` descriptivo o vacío cuando sean decorativas.
- El CTA tendrá contraste suficiente y área táctil amplia.
- La información principal permanecerá como texto HTML seleccionable.
- Los placeholders no bloquearán la lectura si un cliente desactiva imágenes.

## Verificación

Antes de entregar:

1. Confirmar que solo cambió el día 0.
2. Probar las variantes `photo`, `certificate` y `both`.
3. Verificar que `{firstName}`, `{petName}` y `uploadUrl` se interpolan correctamente.
4. Comparar visualmente el preview de escritorio y móvil con la referencia.
5. Ejecutar `npm run build`, `npm run type-check` y `npm run lint`.
6. Revisar regresiones en los previews de los días 10, 13, 14 y 15.

## Criterios de aceptación

- El día 0 reproduce fielmente la dirección visual de la imagen entregada.
- La lógica dinámica de documentos faltantes sigue funcionando.
- Los otros días permanecen visual y funcionalmente intactos.
- Existe un enlace local de preview accesible para revisión.
- Las imágenes temporales pueden sustituirse posteriormente cambiando URLs centralizadas.
