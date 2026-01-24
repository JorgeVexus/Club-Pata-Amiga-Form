# ⚖️ Guía Completa del Sistema de Apelaciones - Club Pata Amiga

> **Versión:** 2.0  
> **Última Actualización:** Enero 2026  
> **Estado:** ✅ Implementado y Probado

Este sistema permite que un usuario con mascota rechazada pueda apelar la decisión, proporcionar información y fotos adicionales, y recibir una resolución por parte del equipo de administración.

---

## 🏗️ 1. Arquitectura de Datos (Supabase)

### Estados de Mascota:
| Estado | Descripción |
|--------|-------------|
| `pending` | En espera de revisión inicial |
| `approved` | Aprobada y activa |
| `rejected` | Rechazada (puede apelar) |
| `appealed` | Apelación en revisión |
| `action_required` | Admin solicitó información adicional |

### Campos en tabla `pets`:
- `status` - Estado actual de la mascota
- `appeal_message` - Último mensaje de apelación del usuario
- `appeal_count` - Contador de apelaciones (máximo 2)
- `appealed_at` - Fecha de la última apelación
- `admin_notes` - Notas/motivo del admin
- `last_admin_response` - Última respuesta del admin

### Tabla `appeal_logs`:
Historial completo de la "conversación" entre admin y usuario.
- `id` - UUID
- `user_id` - ID de Memberstack del usuario
- `pet_id` - ID de la mascota específica
- `admin_id` - ID del admin (si aplica)
- `type` - 'user_appeal' | 'admin_approve' | 'admin_reject' | 'admin_request'
- `message` - El contenido del mensaje
- `created_at` - Timestamp

---

## 🛠️ 2. Flujo del Administrador (Admin Dashboard - Next.js)

### 2.1 Pestaña de Apelaciones
- **Acceso:** Sidebar → "Apelaciones" (solo SuperAdmins)
- **Badge:** Muestra contador de mascotas apeladas pendientes
- **URL directa:** `/admin/dashboard?tab=appeals`

### 2.2 Lista de Apelaciones
- Tabla con: Foto, Nombre mascota, Dueño, Mensaje, Fecha
- **Filtro por fecha:** Todos, Hoy, Esta semana, Este mes
- **Búsqueda:** Por nombre de mascota, dueño o email

### 2.3 Acciones del Admin
1. **Ver Detalles:** Abre modal con información completa del miembro y mascota
2. **Aprobar:** Cambia estado a `approved`, envía notificación y email
3. **Rechazar:** Cambia estado a `rejected`, permite nueva apelación
4. **Solicitar Info:** Cambia a `action_required`, pide más datos

### 2.4 Notificaciones Automáticas al Admin
- Al recibir nueva apelación: Notificación en campanita con link directo

---

## 🌐 3. Flujo del Usuario (Webflow + Widget)

### 3.1 Widget Unificado (`unified-membership-widget.js`)
El widget se adapta automáticamente al estado de cada mascota:

| Estado | Visualización |
|--------|---------------|
| `rejected` | Banner rojo + Botón "Apelar" + Motivo del rechazo |
| `appealed` | Banner morado + "En Revisión" + Botón "Ver Historial" |
| `approved` | Panel de carencia con progreso |
| `action_required` | Banner azul + Formulario de actualización |

### 3.2 Formulario de Apelación
- Campo de texto para explicar el caso
- **Carga de fotos opcional:** Puede subir 2 fotos nuevas
- Mínimo 10 caracteres de mensaje
- Límite de 2 apelaciones por mascota

### 3.3 Historial de Apelaciones
- **Botón:** "📜 Ver historial" (visible cuando estado = `appealed`)
- **Modal:** Lista cronológica de todos los mensajes
- **Diferenciación visual:** Mensajes del admin vs usuario

### 3.4 Widget de Cards (`pet-cards-widget.js`)
- Misma funcionalidad de apelaciones
- Formulario de agregar mascota con autocomplete de razas
- Preview de fotos al subir

---

## 📲 4. Sistema de Notificaciones

### 4.1 Notificaciones In-App (Campanita)
| Evento | Destinatario | Icono |
|--------|--------------|-------|
| Nueva apelación | Admin | ⚖️ |
| Mascota aprobada | Usuario | ✅ |
| Mascota rechazada | Usuario | ❌ |
| Acción requerida | Usuario | 📋 |
| Respuesta del admin | Usuario | 📩 |

### 4.2 Notificaciones por Email (Via Resend)
- **Trigger:** Cuando se resuelve una apelación (approve/reject)
- **Función:** `sendAppealResolutionEmail()` en `comm.actions.ts`
- **Contenido personalizado:** Tono diferente para aprobación vs rechazo
- **Registro:** Se guarda en `communication_logs`

---

## 📡 5. API Endpoints

### Endpoints de Usuario
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/user/appeal` | POST | Enviar nueva apelación |
| `/api/user/appeal-history` | GET | Obtener historial de apelaciones |
| `/api/user/pets/[petId]/update` | POST | Actualizar fotos/datos de mascota |
| `/api/user/upload-pet-photo` | POST | Subir foto a Supabase Storage |

### Endpoints de Admin
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/admin/pets/appealed` | GET | Lista de mascotas apeladas |
| `/api/admin/members/[id]/pets/[petId]/status` | POST | Cambiar estado de mascota |
| `/api/admin/members/[id]/appeal-response` | POST | Responder a apelación |
| `/api/admin/members/[id]/appeal-logs` | GET | Historial de apelaciones |

---

## 🔄 6. Flujo Completo de Apelación

```
┌─────────────────────────────────────────────────────────────────────┐
│                       FLUJO DE APELACIÓN                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. Admin rechaza mascota                                           │
│     └─➜ Estado: REJECTED                                            │
│         └─➜ Usuario recibe notificación                             │
│                                                                      │
│  2. Usuario ve mascota rechazada en widget                          │
│     └─➜ Hace clic en "Apelar"                                       │
│         └─➜ Escribe mensaje + sube fotos (opcional)                 │
│             └─➜ Estado: APPEALED                                    │
│                 └─➜ Admin recibe notificación                       │
│                                                                      │
│  3. Admin revisa apelación en dashboard                             │
│     └─➜ Opción A: APROBAR                                           │
│         └─➜ Estado: APPROVED                                        │
│             └─➜ Usuario recibe notificación + EMAIL                 │
│                                                                      │
│     └─➜ Opción B: RECHAZAR                                          │
│         └─➜ Estado: REJECTED                                        │
│             └─➜ Usuario puede apelar de nuevo (máx 2)               │
│                 └─➜ Usuario recibe EMAIL de resolución              │
│                                                                      │
│     └─➜ Opción C: SOLICITAR INFO                                    │
│         └─➜ Estado: ACTION_REQUIRED                                 │
│             └─➜ Usuario actualiza datos/fotos                       │
│                 └─➜ Vuelve a revisión                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🧪 7. Consideraciones Técnicas

### Límite de Apelaciones
- Máximo **2 apelaciones** por mascota
- Contador almacenado en `pet.appeal_count`
- Después de 2 apelaciones rechazadas, se pierde el derecho a apelar

### Fotos en Apelación
- Opcionales durante la apelación
- Se suben a Supabase Storage
- Se actualizan `photo_url` y `photo2_url` en la tabla `pets`

### Email de Resolución
- Solo se envía si la mascota venía del estado `appealed`
- Usa la función `sendAppealResolutionEmail()` 
- Requiere configuración de Resend (`RESEND_API_KEY`)

---

## 📁 8. Archivos Clave

| Archivo | Descripción |
|---------|-------------|
| `public/widgets/unified-membership-widget.js` | Widget principal del usuario |
| `public/widgets/pet-cards-widget.js` | Widget de cards de mascotas |
| `src/app/api/user/appeal/route.ts` | Endpoint para enviar apelación |
| `src/app/api/user/appeal-history/route.ts` | Endpoint historial de usuario |
| `src/app/api/admin/pets/appealed/route.ts` | Lista de mascotas apeladas |
| `src/app/api/admin/members/[id]/pets/[petId]/status/route.ts` | Cambio de estado |
| `src/app/actions/comm.actions.ts` | Función de email de resolución |
| `src/components/Admin/RequestsTable.tsx` | Tabla de apelaciones con filtros |

---

## ✅ 9. Checklist de Implementación

- [x] Usuario puede apelar mascota rechazada
- [x] Límite de 2 apelaciones por mascota
- [x] Subida de fotos durante apelación
- [x] Admin ve lista de apelaciones con filtro por fecha
- [x] Admin recibe notificación de nueva apelación
- [x] Badge contador en sidebar
- [x] Historial de apelaciones visible para usuario
- [x] Email de resolución al aprobar/rechazar apelación
- [x] Modal con badge "Apelada" en detalles del miembro
- [x] Widgets coherentes (unified y cards)
