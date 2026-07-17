# Centros aliados en Dashboard V2

## Objetivo

Integrar el directorio de Centros del Bienestar como la seccion interna `Centros aliados` del widget unificado, usando el lenguaje visual de `/app/centros` del repositorio nuevo y conservando el backend actual.

## Arquitectura

- El widget obtiene centros aprobados mediante `GET /api/wellness/locations`.
- No se crea ningun cliente de Supabase en el navegador.
- La navegacion lateral y el CTA `Explorar el directorio` cambian la vista interna del widget sin salir de Webflow.
- El CTA `Quiero ser centro aliado` abre `https://www.pataamiga.mx/#wellness-partner-form-anchor`.

## Interfaz

- Encabezado `Centros aliados` y copy existente del repositorio nuevo.
- Buscador por nombre, direccion y codigo postal.
- Filtros por servicio: Todos, Clinicas, Tiendas, Hoteles, Estetica, Funerarias y Paseadores.
- Grid responsive de una, dos o tres columnas.
- Cada tarjeta muestra foto o placeholder, nombre, categoria principal, direccion, telefono y beneficio para miembros.
- Estados de carga, error y cero resultados con el mismo sistema visual del Dashboard V2.
- CTA inferior para negocios pet-friendly.

## Datos y normalizacion

La respuesta de `/api/wellness/locations` se normaliza dentro del widget usando:

- `id` como identificador de ubicacion;
- `establishment_name` como nombre;
- `services` para categoria y filtros;
- `photo_urls[0]` o `logo_url` como imagen;
- `address` y `phone` como datos de contacto;
- `promotion_details` como beneficio del miembro.

Los valores desconocidos de `services` se muestran como `Centro aliado` y siguen disponibles bajo `Todos`.

## Comportamiento

- La busqueda se aplica al enviar el formulario o pulsar Buscar.
- El valor se sincroniza mientras se edita; al vaciarlo se restauran los resultados y los pills no recuperan una busqueda anterior.
- Los filtros se aplican inmediatamente y se combinan con la busqueda.
- `Borrar filtros` reinicia de forma conjunta la busqueda y la categoria activa.
- Los enlaces telefonicos usan `tel:` con caracteres no numericos eliminados.
- Las cadenas provenientes de la API se escapan antes de insertarse en HTML.
- Si la API falla, el usuario puede reintentar sin recargar todo el dashboard.

## Pruebas y verificacion

- Prueba de que Centros aliados abre una vista interna.
- Prueba de consumo API-first de `/api/wellness/locations`.
- Prueba de URL exacta del CTA para registrar un centro.
- Prueba de buscador, filtros, estados y tarjetas del directorio.
- Verificacion de sintaxis, pruebas de widgets, TypeScript, build y lint.
- Revision local en `dashboard-v2-preview.html?section=centers`.
