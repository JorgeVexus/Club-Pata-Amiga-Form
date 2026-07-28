# Diseño: servicios, beneficios y redes por sucursal Wellness

**Fecha:** 2026-07-27
**Estado:** Aprobado para planificación
**Componente principal:** `public/widgets/wellness-center-widget.js`

## Objetivo

Permitir que cada sucursal de un centro de bienestar tenga servicios, beneficio promocional y redes sociales propios, sin perder la opción de reutilizar la información de la sucursal principal.

El comportamiento debe funcionar igual en los dos lugares que reutilizan el formulario del dashboard:

1. La pantalla de espera de aprobación.
2. El modal de **Editar información**.

La información guardada debe llegar correctamente al directorio/mapa público y a la vista administrativa.

## Reglas funcionales

### Sucursal principal

- Debe conservar los servicios seleccionados para el centro.
- Debe conservar la descripción del beneficio o promoción.
- Debe proporcionar al menos un canal digital entre:
  - Instagram.
  - Facebook.
  - TikTok.
  - Sitio web.
- Si los cuatro campos están vacíos, el formulario no se puede guardar y debe mostrar un mensaje claro.

### Sucursales adicionales

Cada tarjeta de sucursal adicional preguntará:

> ¿Esta sucursal cuenta con los mismos servicios y beneficios que la sucursal principal?

#### Respuesta “Sí”

- El formulario copiará inicialmente los servicios de la sucursal principal.
- El formulario usará inicialmente el mismo beneficio de la sucursal principal.
- Los valores se guardarán en el registro de la sucursal para mantener una fotografía consistente de su configuración.

#### Respuesta “No”

- Se mostrará un selector de servicios para esa sucursal.
- Será obligatorio seleccionar al menos un servicio.
- Se mostrará una decisión independiente para el beneficio:
  - **Usar el mismo beneficio de la sucursal principal.**
  - **Usar un beneficio diferente.**
- Si se elige un beneficio diferente, su descripción será obligatoria.

### Redes sociales de sucursales adicionales

Cada sucursal adicional tendrá una decisión independiente:

- **Usar las mismas redes de la sucursal principal.**
- **Usar redes diferentes.**

Cuando se usen las mismas redes, el sistema copiará Instagram, Facebook, TikTok y sitio web desde la sucursal principal al guardar.

Cuando se usen redes diferentes, se mostrarán los cuatro campos y será obligatorio proporcionar al menos uno. El sitio web cuenta como un canal válido.

## Modelo de datos

La tabla `wellness_center_locations` incorporará información específica por sucursal:

- `services`: arreglo de servicios.
- `promotion_details`: descripción del beneficio o promoción.
- `social_links`: objeto con Instagram, Facebook, TikTok y sitio web.
- Indicadores de herencia necesarios para reconstruir correctamente las decisiones elegidas al volver a editar.

Los indicadores distinguirán entre:

- mismos servicios que la principal;
- mismo beneficio que la principal;
- mismas redes que la principal.

Aunque una sucursal elija reutilizar información, se persistirá también una copia normalizada de los valores efectivos. Esto evita que otros consumidores deban reconstruir la herencia y mantiene estable lo publicado si posteriormente cambia la sucursal principal.

## Flujo de datos

1. El widget carga el centro y sus ubicaciones.
2. La tarjeta de cada sucursal se inicializa con sus propios valores e indicadores.
3. Las decisiones del usuario muestran u ocultan los controles correspondientes.
4. Antes de enviar:
   - se valida al menos un canal digital para la principal;
   - se resuelven los valores heredados desde los campos actuales de la principal;
   - se valida al menos un servicio cuando corresponda;
   - se valida el beneficio diferente cuando corresponda;
   - se valida al menos un canal digital propio cuando corresponda.
5. `collectWellnessLocations` construye cada ubicación con sus datos efectivos y sus indicadores.
6. `/api/wellness/update` valida y sincroniza las ubicaciones.
7. El servicio público de ubicaciones devuelve los servicios, beneficio y redes de cada sucursal, con compatibilidad para registros anteriores.

## Compatibilidad con datos existentes

- Las sucursales existentes que no tengan los nuevos campos se interpretarán inicialmente como sucursales que reutilizan los servicios, beneficio y redes de la principal.
- La API pública usará los valores específicos de la sucursal cuando existan y recurrirá a los del centro principal para registros antiguos.
- No se eliminarán direcciones, coordenadas, teléfonos ni fotografías existentes.

## Superficies afectadas

- Formulario compartido del dashboard Wellness.
- Pantalla de espera.
- Modal de edición.
- Recolección y validación del payload de sucursales.
- Tipos TypeScript de ubicaciones.
- Sincronización de ubicaciones en el servicio Wellness.
- Migración de Supabase.
- API del directorio/mapa de centros.
- Vista administrativa de detalle, para mostrar la información correspondiente a cada sucursal.

El widget de registro inicial no administra sucursales: en ese punto solo se capturan los servicios generales del establecimiento. Las sucursales adicionales se agregan posteriormente desde el formulario complementario del dashboard, por lo que no se duplicará este flujo en el registro inicial.

## Validación y errores

- Las validaciones se ejecutarán antes de deshabilitar permanentemente el botón de guardado.
- El mensaje identificará la sucursal con error.
- Un error en una sucursal no deberá borrar ni modificar los datos de otra.
- Si falla la API, el formulario conservará la información capturada y permitirá reintentar.
- El servidor sanitizará arreglos, texto y enlaces antes de persistirlos.

## Estrategia de pruebas

Se aplicará TDD:

1. Pruebas fallidas para el marcado y controles condicionales de cada sucursal.
2. Pruebas fallidas para la validación de al menos un canal digital en la principal.
3. Pruebas fallidas para redes propias o copiadas en sucursales adicionales.
4. Pruebas fallidas para servicios propios o copiados.
5. Pruebas fallidas para beneficio principal o diferente.
6. Pruebas de persistencia y normalización en `wellnessService.syncLocations`.
7. Pruebas del directorio público para garantizar que cada sucursal expone sus propios datos.
8. Pruebas de compatibilidad con sucursales existentes.
9. Verificación obligatoria:
   - `npm run build`
   - `npm run type-check`
   - `npm run lint`

## Fuera de alcance

- Crear un flujo de sucursales en el registro inicial.
- Cambiar el catálogo global de servicios.
- Modificar el mecanismo de carga de fotografías.
- Cambiar las reglas de aprobación administrativa.
