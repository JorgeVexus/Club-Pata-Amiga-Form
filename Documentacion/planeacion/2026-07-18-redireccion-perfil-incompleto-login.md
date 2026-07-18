# Redirección de miembros con registro incompleto al iniciar sesión

## Objetivo

Cuando un miembro tenga un plan activo o de prueba, pero aún le falten datos personales, una mascota activa o información obligatoria de alguna mascota, el inicio de sesión debe enviarlo a `https://www.pataamiga.mx/miembros/completar-perfil` antes de permitir el acceso al dashboard habitual.

## Diagnóstico confirmado

- El widget `public/widgets/complete-profile-widget.js` ya detecta y solicita los datos faltantes una vez que el usuario llega a la página correcta.
- `POST /api/auth/check-role` sólo clasifica rol y estado de pago; no consulta la integridad del perfil ni las mascotas.
- Los dos redirectores públicos tratan cualquier respuesta `role: member` como registro terminado y envían al dashboard.
- El login interno de Next.js sólo recupera el flujo cuando la URL contiene `payment=success`; un login normal no cubre este caso.

## Diseño aprobado

### Evaluación en servidor

Después de confirmar que el usuario es un miembro con plan `ACTIVE` o `TRIAL`, `/api/auth/check-role` consultará en Supabase:

- El registro de `users` asociado al `memberstack_id`.
- Las mascotas del usuario que no estén dadas de baja o desactivadas.

Se considerará incompleto cuando ocurra cualquiera de estos casos:

1. No existe el registro del usuario en Supabase.
2. Falta algún dato personal requerido por el widget: nombre, apellido paterno, apellido materno, CURP, teléfono, código postal, colonia o ciudad.
3. No existe ninguna mascota activa.
4. Alguna mascota activa carece de especie válida, edad, sexo, definición de raza, color de pelo, foto principal o certificado veterinario cuando sea senior.

La evaluación se implementará como una función pura y probada para que la ruta no contenga una cadena de condiciones difícil de mantener.

### Contrato de respuesta

Si el registro está incompleto, la API responderá:

```json
{
  "success": true,
  "role": "incomplete_profile",
  "redirectUrl": "https://www.pataamiga.mx/miembros/completar-perfil",
  "registrationIssue": "missing_member_info | missing_pet | incomplete_pet"
}
```

Los roles de administrador, embajador y centro de bienestar conservarán su prioridad actual. Los miembros sin plan activo conservarán el flujo de pago pendiente.

### Redirectores

`login-redirect-enhanced.js` y `login-redirect-enhanced-v2.js` manejarán `incomplete_profile` antes del caso `member` y usarán el `redirectUrl` entregado por el servidor, con la URL de completar perfil como fallback.

Se actualizarán ambas variantes porque el repositorio no contiene evidencia suficiente para garantizar cuál está incrustada actualmente en Webflow.

## Manejo de errores

- Si la consulta de integridad falla por un error transitorio de Supabase, la API registrará el error y conservará el comportamiento actual de miembro, evitando bloquear el inicio de sesión por una falla de infraestructura.
- Si la consulta se completa y el usuario no existe, se tratará como perfil incompleto.
- El widget de completar perfil conservará su manejo actual de sesión y errores de carga.

## Pruebas

- Plan activo y datos personales faltantes → `incomplete_profile`.
- Plan activo y cero mascotas → `incomplete_profile`.
- Plan activo y mascota incompleta → `incomplete_profile`.
- Plan activo, datos y mascotas completos → `member`.
- Sin plan activo → conserva `pending_payment` o `payment_processing`.
- Los dos redirectores reconocen `incomplete_profile` y contienen el destino correcto.
- Las pruebas existentes del widget y de recuperación del registro continúan pasando.

## Fuera de alcance

- Cambios visuales en `complete-profile-widget.js`, salvo corregir el destino funcional del botón existente “Ver mi perfil”.
- Cambios al proceso de pago.
- Modificar la prioridad de administradores, embajadores o centros de bienestar.
- Commit o push sin una nueva autorización explícita.

## Ajuste adicional aprobado

Cuando el widget determine que el perfil ya está completo, el botón “Ver mi perfil” debe navegar a `https://www.pataamiga.mx/pets/pet-waiting-period`. No debe ejecutar `window.location.reload()`, porque eso mantiene al miembro en la pantalla de completar perfil.
