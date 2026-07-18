# Emergencia y navbar de cuenta V2 - Plan de implementación

> **Para agentes:** ejecutar en `main`, siguiendo TDD y sin commit/push hasta autorización explícita.

**Objetivo:** Integrar la emergencia funcional al Dashboard V2 y compartir una navbar V2 entre Perfil y Ajustes.

**Arquitectura:** El widget de emergencia sigue siendo dueño de validación y logging, pero expone un disparador público. Una navbar independiente concentra navegación y notificaciones para evitar duplicación entre Perfil y Ajustes.

## Tareas

1. Añadir pruebas fallidas de los contratos de emergencia y navbar.
2. Exponer `openModal()` y rediseñar botón/modal sin cambiar endpoints.
3. Cargar emergencia una sola vez desde el dashboard y sustituir el acceso móvil redundante.
4. Crear `member-account-navbar.js` con notificaciones API-first, enlaces y logout.
5. Cargar la navbar desde Perfil y Ajustes, sin cargar emergencia.
6. Actualizar previews con mocks suficientes para revisar cada estado.
7. Ejecutar regresiones, type-check, lint y build.
