# Diseño del registro de embajadores — nuevo estándar Pata Amiga

## Objetivo

Adaptar visualmente las tres vistas del registro de embajadores al estándar aprobado para el registro de membresías, preservando copys, validaciones, persistencia e integraciones.

## Alcance

- Solicitud principal de embajador.
- Confirmación de solicitud enviada.
- Perfil complementario: documentos, datos bancarios y redes sociales.
- Carga, errores, validaciones, términos y estados responsive.

## Estándar visual

- Fondo crema `#FAF7F1`.
- Navbar blanco con logo Pata Amiga.
- Progreso horizontal delgado para las tres vistas.
- Contenedor centrado de `560px`.
- Una tarjeta blanca exterior de radio `20px`, sombra `0 2px 12px rgba(30,83,80,.06)` y padding `28px` en escritorio / `20px` en móvil.
- Inputs de `48px`, radio `12px`, borde `1.5px solid #E4DFD3` y foco turquesa.
- Botones principales de `52px`, fondo `#1CBCAD` y radio completo.
- Sin fondos naranja o verde, bordes negros, sombras duras ni contenedores internos redundantes.

## Protección funcional

- Mantener literalmente los copys existentes.
- No cambiar endpoints, payloads, validaciones, tracking ni Memberstack.
- Limitar cambios JSX a jerarquía presentacional y progreso visible.
- Conservar términos, documentos, datos bancarios y comportamiento de éxito.

## Verificación

- Auditoría de diff para detectar cambios funcionales accidentales.
- `npm run type-check`.
- ESLint enfocado en archivos TSX modificados.
- Comprobación HTTP local de `/embajadores/registro`.
- Revisión visual de las tres vistas.
