# Menú de cuenta y widgets Perfil/Ajustes V2

## Objetivo

Unificar la navegación de cuenta y la presentación de Perfil y Ajustes con el estándar visual V2, sin modificar contratos de API, autenticación, carga de archivos ni acciones de suscripción.

## Alcance

1. Sustituir en móvil el acceso directo de cierre de sesión por un menú hamburguesa con Perfil, Ajustes y Cerrar sesión.
2. Añadir Perfil y Ajustes a la navegación inferior de escritorio, conservando Cerrar sesión.
3. Redirigir a `https://www.pataamiga.mx/` después de cerrar sesión.
4. Aplicar el sistema visual V2 a `user-profile-widget.js` y `user-settings-widget.js` mediante estilos encapsulados.
5. Mantener intactas las rutas API, los identificadores DOM y los eventos existentes.

## Verificación

- Pruebas de contrato para enlaces, menú móvil y estilos V2.
- Auditoría de endpoints y manejadores existentes.
- `npm run build`, `npm run type-check` y `npm run lint`.
- Revisión local en los previews de dashboard, perfil y ajustes.
