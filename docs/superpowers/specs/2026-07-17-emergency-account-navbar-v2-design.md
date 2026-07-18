# Emergencia y navbar de cuenta V2

## Alcance aprobado

El Dashboard V2 integra el widget existente `emergency-button-widget.js` sin duplicar sus validaciones, teléfono, registro de actividad ni acceso a Memberstack. En escritorio conserva un único botón flotante en la esquina inferior derecha. En móvil ese botón flotante se oculta y el disparador aparece en la barra superior, sustituyendo el acceso redundante al chat veterinario.

Perfil y Ajustes reciben una barra superior compartida, visible en escritorio y móvil. Incluye logo, acceso al dashboard, campana conectada a las API actuales, acceso a orientación veterinaria y menú de cuenta con Perfil, Ajustes y Cerrar sesión. No carga ni muestra el botón de emergencia.

## Arquitectura

- `emergency-button-widget.js` mantiene la propiedad de la lógica de emergencia y expone una instancia pública con `openModal()` para disparadores externos.
- `unified-membership-widget.js` carga el script de emergencia una sola vez y monta el disparador móvil solo para miembros con sesión.
- `member-account-navbar.js` encapsula navegación y notificaciones para Perfil/Ajustes; ambos widgets lo cargan dinámicamente.
- Todos los accesos a datos continúan mediante API Routes; ningún widget crea clientes Supabase.

## Diseño

- Fondo beige `#f7f4ee`, superficies blancas, borde cálido `#e8e0d4`, texto verde profundo y acento turquesa.
- Emergencia usa rojo sólido sobrio, icono SVG de teléfono y modal blanco con jerarquía clara, sin bordes brutalistas.
- La barra superior usa el mismo alto y densidad del encabezado móvil del Dashboard V2 y se amplía horizontalmente en escritorio.

## Estados y accesibilidad

- El botón solo aparece tras validar membresía pagada.
- El modal conserva cierre exterior y añade cierre con Escape, foco visible y atributos de diálogo.
- La navbar incluye estados de carga, vacío y error para notificaciones.
- El menú de cuenta expone `aria-expanded`, cierra con Escape y no interfiere con los formularios.

## Verificación

- Pruebas de contrato para carga única, posición desktop, sustitución móvil, API de emergencia y ausencia en Perfil/Ajustes.
- Pruebas para navbar compartida, URLs, notificaciones API-first y cierre de sesión.
- Build, type-check y lint antes de solicitar autorización de commit.
