# Implementación de Flujo de Centros de Bienestar

Este plan detalla la creación del sistema de registro y gestión para Centros de Bienestar (Wellness Centers) como aliados de Pata Amiga.

## User Review Required

> [!IMPORTANT]
> Se implementará un sistema de geolocalización dual (mapa + manual) y un historial de pagos recibidos del Fondo Solidario.

> [!NOTE]
> El diseño se basará en el sistema de Embajadores existente para mantener consistencia visual.

## Open Questions (Resueltas)

1. **Geolocalización**: Se implementarán **ambas** opciones: un selector de mapa interactivo y campos de entrada manual para Latitud/Longitud.
2. **Beneficios Económicos**: Se refieren a los pagos que Pata Amiga realiza al centro por servicios cubiertos por el **Fondo Solidario**. Se implementará una sección de "Historial de Pagos Recibidos".
3. **Persistencia de Datos**: Todo se guarda en Supabase. Memberstack se utiliza exclusivamente para la autenticación (Login).
4. **Protocolo de Salida (Retención)**: 
   - Se implementará un flujo de retención con encuesta de salida.
   - La cuenta **no se elimina**, solo cambia su estado a `cancelled`.
   - Si un usuario cancelado intenta entrar, el widget mostrará un bloqueo con un mensaje para contactar a soporte para la reactivación.

## Proposed Changes

### [Component] Database (Supabase)

Se crearán las tablas necesarias para soportar el flujo de Centros de Bienestar.

#### [NEW] [20260515_create_wellness_center_tables.sql](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/supabase/migrations/20260515_create_wellness_center_tables.sql)
- Tabla `wellness_centers`: 
  - Datos: `name`, `services` (array), `address`, `lat`, `lng`, `logo_url`, `social_links` (jsonb).
  - Estado: `pending`, `approved`, `rejected`, `appealed`, `cancelled`.
  - Cancelación: `cancellation_reason`, `cancelled_at`.
- Tabla `wellness_center_payments`: Para rastrear los pagos del Fondo Solidario.
- Tabla `wellness_center_appointments`: Registro de "Peludos Atendidos".
- Tabla `wellness_center_appeals`: Historial de apelaciones.

---

### [Component] Backend (API Routes)

Endpoints para registro, actualización de información y gestión de citas.

#### [NEW] [/api/bienestar/register](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/app/api/bienestar/register/route.ts)
#### [NEW] [/api/bienestar/profile](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/app/api/bienestar/profile/route.ts)
#### [NEW] [/api/bienestar/appointments](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/app/api/bienestar/appointments/route.ts)

---

### [Component] Frontend (Next.js)

Páginas de registro y estado de solicitud.

#### [NEW] [/bienestar/registro](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/app/bienestar/registro/page.tsx)
- Adaptación del `AmbassadorForm` para Centros de Bienestar.
#### [NEW] [/bienestar/estado](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/app/bienestar/estado/page.tsx)
- Pantalla de "En revisión" y formulario de información complementaria.

---

### [Component] Widget Público (Dashboard)

Widget para integrar en Webflow que permite al centro gestionar su operación.

#### [NEW] [wellness-center-widget.js](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/public/widgets/wellness-center-widget.js)
- **Lógica de Acceso**: Si el estado es `cancelled`, mostrar pantalla de bloqueo "Cuenta Inactiva" con botón de contacto para reactivación.
- **Flujo de Retención**: Modal de confirmación con encuesta de salida y recordatorio de beneficios.
- **Geolocalización Dual**: Integración de Google Maps + Inputs manuales.
- **Finanzas**: Visualización de montos obtenidos del Fondo Solidario.
- **Evidencias**: Subida de recetas y comprobantes.

## Verification Plan

### Automated Tests
- `npm run type-check` para asegurar integridad de tipos.
- Pruebas de integración con API de Supabase para estados de cuenta.

### Manual Verification
1. Completar el flujo de registro.
2. Verificar bloqueo de acceso al cancelar la cuenta.
3. Probar la carga de coordenadas manuales y vía mapa.
4. Validar la visibilidad del historial de pagos del Fondo Solidario.
