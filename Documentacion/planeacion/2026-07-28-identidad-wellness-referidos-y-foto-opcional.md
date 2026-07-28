# Identidad Wellness, código de embajador y foto opcional

## Objetivo

Aplicar tres ajustes independientes sin modificar contratos de datos compartidos:

1. Alinear la identidad del dashboard de centros de bienestar con el encabezado V2 del dashboard de embajadores.
2. Reactivar el campo opcional de código de embajador en el paso 3 del registro V2.
3. Permitir que `complete-profile-widget.js` considere completa una mascota cuando el único dato faltante sea su foto.

## Alcance

### Dashboard de centros de bienestar

- Reutilizar el logo oficial empleado por `ambassador-widget.js`:
  `/widgets/home%20v2%20images/logo-light-bg.svg`.
- Sustituir el texto plano de marca del sidebar por:
  - logo oficial de Pata Amiga;
  - etiqueta `CENTRO DE BIENESTAR`.
- Sustituir el texto plano del menú móvil por la misma composición de marca en formato compacto.
- Mantener navegación, estados de solicitud y acciones de cuenta sin cambios.
- Conservar el sistema visual V2 existente: fondo claro, turquesa suave, texto verde profundo y radios compactos.

### Registro V2, paso 3

- Reactivar la sección existente controlada por `SHOW_AMBASSADOR_CODE`.
- Mantener el código como campo opcional.
- Conservar:
  - validación automática contra `/api/referrals/validate-code`;
  - normalización a mayúsculas;
  - mensajes de éxito y error;
  - persistencia en Memberstack;
  - propagación al checkout y a las mascotas.
- No alterar selección de plan, términos ni pago.

### Complete Profile Widget

- La excepción se aplicará exclusivamente en
  `public/widgets/complete-profile-widget.js`.
- `getMissingFields()` dejará de agregar `photo` a los campos que bloquean el acceso.
- Una mascota sin foto, pero con el resto de la información obligatoria completa, no generará el paso `complete_pet`.
- Si faltan otros datos, el widget conservará el comportamiento actual y mostrará el formulario correspondiente.
- La validación de fotografías en otros formularios, utilidades, APIs, correos y dashboards no se modificará.
- El destino usado por `startFlow()` cuando no hay pasos pendientes se conservará sin cambios.

## Pruebas

- Prueba estructural de identidad Wellness:
  - logo oficial presente en sidebar y móvil;
  - etiqueta `CENTRO DE BIENESTAR` presente;
  - el texto plano anterior deja de ser la marca principal.
- Prueba del registro V2:
  - `SHOW_AMBASSADOR_CODE` habilitado;
  - endpoint y propagación del código conservados.
- Prueba del widget de perfil:
  - la ausencia de foto no aparece como campo faltante;
  - especie, edad, sexo, raza, tipo de raza, color y certificado senior siguen siendo bloqueantes.
- Regresión del widget Wellness, registro V2 y complete profile.
- Verificación obligatoria:
  - `npm run build`;
  - `npm run type-check`;
  - `npm run lint`.

## Fuera de alcance

- Cambiar la obligatoriedad de la foto en otros flujos.
- Modificar APIs o el esquema de datos de mascotas.
- Rediseñar el dashboard completo de Wellness.
- Cambiar el destino final del flujo de perfil completo.
