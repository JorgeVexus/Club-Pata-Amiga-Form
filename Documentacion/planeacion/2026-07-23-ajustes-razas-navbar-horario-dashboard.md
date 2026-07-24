# Ajustes de razas, navegacion, horario y alta de mascotas

## Objetivo

Aplicar ajustes puntuales al registro/autocompletado de mascotas, la navegacion de perfil/configuracion, el formateo horario administrativo y el alta de mascotas desde el dashboard unificado.

## Alcance

- Agregar `French poodle` al catalogo semilla de razas para perros y dejar preparado el camino para sincronizarlo con Supabase.
- Agregar en el menu de perfil/configuracion un enlace `Volver al perfil` con redireccion silenciosa basada en la logica por rol del redirect v2.
- Cambiar el logo de la navegacion de perfil/configuracion para que apunte a `https://www.pataamiga.mx/`.
- Formatear horarios relevantes de notificaciones/chat usando `America/Mexico_City`.
- Ajustar el modal de alta de mascota en el widget de manada para que use logo disponible y mensaje V2 de predisposicion de raza.

## Enfoque

1. Crear pruebas de regresion en `tests/widgets/` y `tests/` usando Node nativo, sin dependencias nuevas.
2. Implementar helpers pequenos dentro de los widgets existentes para evitar cambiar la integracion de Webflow.
3. Mantener cambios acotados a archivos publicos y utilidades existentes.
4. Ejecutar QA obligatorio: pruebas puntuales, `npm run build`, `npm run type-check`, `npm run lint`.

## Riesgos y mitigacion

- Supabase no se actualiza solo con `breeds.json`; el cambio local sirve para el seed. La sincronizacion real requiere ejecutar el endpoint/seed administrativo con credenciales de produccion.
- Los widgets se cargan como scripts independientes; por eso la logica nueva se incluye en el archivo del widget en vez de depender de un bundle compartido.
- Las fechas guardadas deben permanecer en UTC; solo se cambia la presentacion a zona horaria CDMX.
