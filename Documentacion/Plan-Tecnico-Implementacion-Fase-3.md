# Plan de Implementación: Sistema de Apelaciones (Fase 3) ⚖️🐾

Este plan detalla cómo permitir que los usuarios cuya solicitud fue rechazada puedan apelar la decisión, proporcionar información adicional o corregir documentos erróneos directamente desde Webflow.

## Resumen del Enfoque
- **UI de Webflow:** Mantendremos el diseño actual de Webflow para el mensaje de rechazo.
- **Interacción React:** Desarrollaremos un widget incrustable que gestione el formulario de apelación y, si el admin lo solicita, la carga de documentos específicos.
- **Backend:** Actualizaremos Supabase para manejar estados individuales por mascota y un log de apelaciones detallado.
- **Flujo de Notificaciones:** Las alertas dirigirán al usuario de vuelta a Webflow, donde el widget se adaptará dinámicamente según lo solicitado (Mensaje vs. Documentos).

## Cambios Propuestos

### 1. Base de Datos (Supabase) 🗄️
Necesitamos granularidad a nivel de mascota para aprobaciones parciales.
- **Tabla `pets` [MODIFICAR]:**
  - Añadir columna `status`: `pending`, `approved`, `action_required`, `rejected`.
  - Añadir `admin_notes`: Razón específica para esta mascota.
- **Tabla `users`:**
  - `membership_status`: Cambia a `active` en cuanto **al menos una** mascota sea aprobada. Esto permite que el periodo de carencia inicie para esa mascota mientras otras siguen en revisión o apelación.
- **Tabla `appeal_logs` [NUEVA]:** Registro de conversación Admin/Usuario.

### 2. Backend / API (Next.js) ⚙️
- **[NUEVO] `/api/user/appeal`:** Recibe el motivo inicial de apelación.
- **[MODIFICAR] `/api/admin/members/[id]/pets/[petId]`:** Nuevo endpoint para aprobar/rechazar mascotas individualmente.
- **[MODIFICAR] `/api/admin/members/[id]/reject`:** Permitirá al admin marcar "Solicitar Documento X" o "Explicación" global.

### 3. Integración Webflow (Widget Dinámico) 🌐
- **Detección Dinámica:** El widget leerá de Supabase qué mascotas están en `action_required` y qué documentos faltan.
- **Redirección:** Las notificaciones push/email incluirán el link directo al dashboard de Webflow, donde el widget se abrirá automáticamente en la sección de "Actualizar".

### 4. Admin Dashboard (Admin UI) 🛡️
- **Lista de Miembros:** Añadir filtro de "En Apelación".
- **Vista de Detalle:**
  - Mostrar el mensaje de apelación del usuario.
  - Botón "Solicitar Corrección": Permite marcar campos específicos (ej: INE frontal) para que el usuario los resuba.
  - Botón "Aprobar tras Apelación": Cierra el ciclo y activa la membresía.

## Plan de Verificación ✅

### Pruebas Automáticas
- Mock de subida de archivos para asegurar que el bucket de Supabase Storage se actualiza correctamente.
- Test de cambio de estados: `rejected` -> `appealing` -> `action_required` -> `approved`.

### Pruebe Manual
1.  **Flujo Completo:** Rechazar un usuario de prueba -> Ver el widget en Webflow -> Enviar apelación -> Ver la apelación en el Admin Dashboard.
2.  **Documentos:** Rechazar por "INE borroso" -> Verificar que el usuario solo puede resubir el INE.
