# Plan de Implementación: Adaptación del Perfil de Usuario para Centros de Bienestar

Este documento detalla el plan para permitir que el widget de perfil del usuario (`user-profile-widget.js`) soporte dinámicamente el rol de **Centros de Bienestar** (Wellness Centers).

## Contexto del Problema

El widget de perfil de usuario (`user-profile-widget.js`) actualmente está diseñado de forma exclusiva para miembros del Club (dueños de mascotas). Muestra campos personales (como fecha de nacimiento) e información de membresía (costos de plan, tarjetas de crédito/débito activas, botones de cancelación de membresía de Stripe) que no son aplicables para los establecimientos aliados (Centros de Bienestar).

## Propuesta de Solución

1. **Detección Dinámica de Rol**:
   - En la carga de datos del widget, realizaremos una consulta en paralelo hacia `/api/wellness/me?memberstack_id=${id}`.
   - Si la respuesta es exitosa (`success === true` y contiene datos del centro), identificamos al usuario como un Centro de Bienestar (`this.isWellnessCenter = true`).

2. **Secciones de Interfaz Adaptativas**:
   - **Información General (Sección 1)**: Si es Centro de Bienestar, mostraremos información empresarial en lugar de datos personales:
     - Nombre del establecimiento (en lugar de Nombre y Apellidos).
     - Correo electrónico, teléfono de contacto y dirección física principal del centro.
     - Servicios ofrecidos por el centro.
     - Ocultamos la Fecha de Nacimiento.
     - La subida de imagen se redirigirá a la API específica para logos de centros de bienestar (`/api/upload/wellness-logo`).
   - **Membresía (Sección 2)**: Ocultamos por completo esta sección si el usuario es un Centro de Bienestar.
   - **Roles y Sucursales (Sección 3)**:
     - El rol se mostrará como "Establecimiento Aliado" y "Centro de Bienestar" con su respectivo badge de estado de aprobación.
     - Mostraremos la tira de sucursales adicionales registradas por el centro (direcciones y teléfonos).
     - Ocultaremos la lista de mascotas y la sección de embajadores.

3. **Modales de Edición**:
   - El modal de edición para un Centro de Bienestar se adaptará para mostrar los campos de Nombre del Establecimiento, Teléfono de Contacto y Dirección. Al guardar, enviará la información a la API `/api/wellness/update`.

4. **Vista Previa de Desarrollo (Dev Preview)**:
   - Se agregará soporte en `profile-widget-preview.html` para simular y previsualizar de forma local el rol de Centro de Bienestar.

## Archivos a Modificar

### [Widgets de Webflow]

#### [MODIFY] [user-profile-widget.js](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/public/widgets/user-profile-widget.js)
- Implementar la lógica adaptativa de carga de datos, renderizado adaptativo de las 3 secciones, flujo de actualización de perfil empresarial, y subida del logo.

#### [MODIFY] [profile-widget-preview.html](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/public/widgets/profile-widget-preview.html)
- Agregar un botón para simular el rol de Centro de Bienestar y mockear las llamadas a las API `/api/wellness/me`, `/api/wellness/update` y `/api/upload/wellness-logo`.

---

## Plan de Verificación

### Verificación Manual (Dev Preview)
1. Abrir `public/widgets/profile-widget-preview.html` en el navegador.
2. Hacer clic en "Miembro" y verificar que se visualice el perfil del miembro del club con mascotas y membresía.
3. Hacer clic en "Centro Wellness" y verificar que:
   - Se oculte la sección verde de información de membresía.
   - Se oculten los campos de fecha de nacimiento y se muestre la información del establecimiento.
   - En la sección de roles, se indique que es un "Establecimiento Aliado" y se liste la tira de sucursales con su dirección y teléfono.

### Verificación de Calidad y Compilación
- Ejecutar `npm run type-check`.
- Ejecutar `npm run lint`.
- Ejecutar `npm run build`.
