# Bienvenida unica de miembros — diseno aprobado

## Objetivo

Mostrar la bienvenida del dashboard una sola vez por cuenta, incluso al iniciar sesion desde otro navegador o dispositivo, y adaptar el modal al componente `WelcomeOnce` del repositorio visual nuevo.

## Persistencia

- Supabase sera la fuente unica de verdad mediante `public.users.welcome_shown`.
- Se agregara una migracion idempotente que cree `welcome_shown BOOLEAN NOT NULL DEFAULT FALSE`.
- `/api/user/pets` continuara entregando el valor canonico de la cuenta.
- `/api/user/welcome-shown` actualizara por `memberstack_id`, devolvera la fila actualizada y fallara si no encontro una cuenta.
- El widget marcara el estado local como visto solo despues de recibir una respuesta exitosa.
- No se usara `localStorage`, porque la regla debe cumplirse por cuenta y entre dispositivos.

## Diseno visual

El modal replicara el estilo del repositorio nuevo:

- overlay verde oscuro al 40 % con desenfoque ligero;
- tarjeta blanca de hasta 420 px;
- radio de 24 px y sombra `0 24px 60px rgba(30, 83, 80, .25)`;
- icono de huella como recurso SVG estable;
- titulo Fraiche de 26 px en `#1e5350`;
- copy Outfit de 14 px en `#6b7c79`;
- boton turquesa `#1cbcad`, altura 48 px y forma pill;
- sin bordes negros, sombras duras ni tarjetas internas.

Se conservara el tono actual de los copys y se mostrara el texto correspondiente al estado real del perfil.

## Integridad de caracteres

- Los archivos modificados se guardaran como UTF-8.
- Los textos visibles usaran caracteres espanoles validos, sin secuencias mojibake como `Ã`, `Â` o `ðŸ`.
- El icono no dependera de un emoji codificado dentro del bundle.
- Una prueba estatica inspeccionara el bloque del modal y fallara si encuentra marcadores comunes de texto corrupto.
- La revision local comprobara titulo, acentos, signos de apertura y copy antes del build.

## Pruebas de aceptacion

1. Una cuenta con `welcome_shown = false` ve el modal.
2. Al cerrarlo, la API persiste `true` y devuelve la fila actualizada.
3. La misma cuenta no vuelve a verlo al recargar ni desde otro dispositivo.
4. Un `memberstack_id` inexistente produce error y no simula una escritura exitosa.
5. El modal coincide con el estilo del repositorio nuevo en desktop y movil.
6. Ningun texto visible contiene caracteres corruptos.

