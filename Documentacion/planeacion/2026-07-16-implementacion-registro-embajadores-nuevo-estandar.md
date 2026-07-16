# Registro de embajadores — Plan de implementación

**Objetivo:** Unificar solicitud, éxito y perfil complementario con el estándar visual del registro de membresías.

**Arquitectura:** Se conserva `AmbassadorForm` como orquestador. La página aporta navbar, stepper y tarjeta exterior; cada vista interna pierde superficies de color y contenedores redundantes mediante CSS Modules.

## Tareas

- [ ] Actualizar el progreso para representar solicitud, enviada y completar perfil.
- [ ] Adaptar página, navbar, fondo, ancho y tarjeta exterior.
- [ ] Adaptar formulario principal, inputs, radios, términos y botón.
- [ ] Adaptar confirmación de solicitud enviada.
- [ ] Adaptar perfil complementario y sus secciones.
- [ ] Adaptar modal de términos y estados de carga/error.
- [ ] Ejecutar type-check, lint enfocado, diff-check y prueba HTTP local.
