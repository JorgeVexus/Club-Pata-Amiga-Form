# Pruebas administrativas de correos por documentación faltante

## Objetivo

Permitir que un administrador previsualice y envíe manualmente una variante específica del correo automático de documentación faltante a una dirección de prueba elegida por él. La herramienta no debe ejecutar el cron, evaluar expedientes ni enviar mensajes a miembros reales de manera automática.

## Alcance

- Integrar la herramienta en `Comunicaciones → Correos` del dashboard administrativo.
- Trabajar con las variantes de seguimiento de los días 0, 10, 13, 14 y 15.
- Simular los tres estados posibles: falta de foto, falta de certificado y falta de ambos documentos.
- Permitir editar el destinatario de prueba, nombre del miembro, nombre de la mascota y enlace de carga mostrado en el correo.
- Mostrar una vista previa de escritorio y móvil.
- Enviar solamente la variante seleccionada y solamente a la dirección escrita por el administrador.

## Fuera de alcance

- Modificar el calendario o comportamiento del cron existente.
- Buscar miembros elegibles o comprobar si realmente les faltan documentos.
- Realizar envíos masivos.
- Sustituir el sistema general de plantillas del centro de comunicaciones.
- Registrar el envío de prueba como una comunicación real de un miembro.

## Arquitectura

### Generador canónico

El preview administrativo, el envío de prueba y el cron utilizarán las funciones existentes de `src/utils/missing-pet-docs-email.js` para generar asunto, HTML y texto. Se eliminará la implementación duplicada de esta plantilla dentro del previsualizador para impedir que la vista previa se desvíe del correo real.

### API administrativa

Se añadirá una API bajo `/api/admin/communications/` protegida con `getAdminUser()`.

La operación aceptará:

- `recipientEmail`: correo de prueba.
- `userName`: nombre simulado del miembro.
- `petName`: nombre simulado de la mascota.
- `followupDay`: `0 | 10 | 13 | 14 | 15`.
- `missingDocs`: `photo | certificate | both`.
- `uploadUrl`: enlace mostrado en el botón del correo.
- `action`: `preview | send`.

Para `preview`, la API devolverá el asunto y HTML generados por la implementación canónica. Para `send`, validará nuevamente todos los campos y enviará exactamente ese asunto y HTML mediante Resend a `recipientEmail`.

La API no aceptará `memberId`, no consultará Memberstack o Supabase y no llamará al endpoint del cron. El envío se identificará en logs como una prueba administrativa, incluyendo el administrador que lo solicitó y sin crear historial de comunicación para un miembro.

## Interfaz administrativa

La plantilla “Fotos Faltantes / Cron” del previsualizador existente incorporará:

- Selector de día de seguimiento.
- Selector de documentos simulados.
- Campos de nombre del miembro, mascota y enlace de carga.
- Campo obligatorio de correo destinatario.
- Vista previa actualizada desde el generador canónico.
- Controles de escritorio y móvil ya existentes.
- Botón `Enviar correo de prueba`.
- Confirmación que muestre el destinatario antes del envío.
- Estado de carga para evitar envíos dobles.
- Mensaje de éxito con el identificador de Resend o error legible.

El botón de envío solamente estará disponible para esta plantilla. Las demás plantillas del previsualizador conservarán su comportamiento actual.

## Flujo de datos

1. El administrador selecciona día, documento faltante y datos simulados.
2. La interfaz solicita a la API el HTML canónico para el preview.
3. La API valida la sesión administrativa y los parámetros.
4. El administrador escribe el correo de prueba y confirma el envío.
5. La interfaz envía los mismos parámetros con `action: send`.
6. La API vuelve a generar el contenido canónico y lo manda únicamente al destinatario proporcionado.
7. La interfaz muestra el resultado sin alterar el estado de ningún miembro.

## Seguridad y validación

- Autenticación administrativa obligatoria en preview y envío.
- Lista cerrada para días y tipos de documento.
- Validación y normalización del correo destinatario.
- Longitudes máximas para los campos de texto.
- Solo URLs `http` o `https` para el enlace de carga.
- El servidor ignora cualquier remitente proporcionado por el cliente y utiliza la configuración oficial de miembros.
- El endpoint no utiliza ni expone `CRON_SECRET`.
- La interfaz requiere confirmación antes de enviar.

## Manejo de errores

- `401` cuando no exista una sesión administrativa válida.
- `400` para datos inválidos o incompletos.
- `500` si Resend no está configurado o rechaza el envío.
- El preview anterior se conserva visualmente si falla una actualización, acompañado por un aviso de error.
- Durante el envío se deshabilita el botón para evitar duplicados.

## Pruebas y criterios de aceptación

- Una solicitud no autenticada no puede previsualizar ni enviar correos.
- Solo se aceptan los días 0, 10, 13, 14 y 15.
- Solo se aceptan `photo`, `certificate` y `both`.
- Preview y envío producen el mismo asunto y HTML para los mismos parámetros.
- El destinatario de Resend coincide exactamente con el correo escrito por el administrador.
- La API no consulta miembros ni evalúa documentación faltante.
- El cron conserva su endpoint y funcionamiento actual.
- La plantilla del día 0 mantiene su diseño especial; los demás días mantienen sus diseños actuales.
- La vista previa funciona en anchos de escritorio y móvil.
- Un envío exitoso muestra confirmación y el ID de Resend.
- Un error no limpia la configuración elegida ni permite un envío doble accidental.
- Deben pasar las pruebas específicas, `npm run build`, `npm run type-check` y `npm run lint` antes de solicitar autorización para commit.

