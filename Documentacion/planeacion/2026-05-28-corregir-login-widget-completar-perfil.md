# Plan de Implementacion - Login propio en widget de completar perfil

## Objetivo

Corregir el estado sin sesion de `public/widgets/complete-profile-widget.js`, donde el boton de iniciar sesion abre el modal basico de Memberstack y no reanuda el flujo del widget despues del login.

## Diagnostico

- El widget usa `window.$memberstackDom.openModal('LOGIN')` en `renderLoginRequired`.
- Ese modal no esta integrado con el ciclo de datos del widget, por lo que despues de autenticar no se llama a `loadData`.
- El flujo de registro v2 usa `loginMemberEmailPassword({ email, password })`, obtiene el miembro autenticado y continua correctamente.

## Cambios

- Reemplazar la vista de login requerida por un formulario propio de email y contrasena, con estilos acordes al widget.
- Manejar submit con `window.$memberstackDom.loginMemberEmailPassword`.
- Al autenticar, guardar el miembro en `this.member` y llamar `loadData()` para continuar el flujo.
- Mantener enlace de registro y mensajes de error inline.
- Agregar prueba de regresion para evitar volver al modal basico de Memberstack.

## Verificacion

- `node --test tests\\*.test.mjs`
- `npm run type-check`
- `npm run build`
- `npm run lint`
