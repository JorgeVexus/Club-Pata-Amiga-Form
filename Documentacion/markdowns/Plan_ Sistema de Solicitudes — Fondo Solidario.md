# **Plan: Sistema de Solicitudes — Fondo Solidario**

## Decisiones de Negocio Confirmadas

| Beneficio | Monto máximo | Documentos requeridos |
| ----- | ----- | ----- |
| Emergencia médica | $3,000 MXN | Foto evidencia \+ receta \+ recibo veterinario |
| Vacunación anual | $300 MXN | Foto evidencia \+ receta \+ recibo veterinario |
| Fallecimiento | $2,000 MXN | Foto evidencia \+ receta \+ recibo veterinario |

**Tipos de solicitud:**

* **Reembolso** — 3 archivos: foto evidencia, receta, recibo. Monto lo especifica el usuario (con cap por tipo). Admin aprueba/rechaza/pide info.  
* **Cita en Centro Aliado** — form específico con campos propios. Los admins coordinan con centros directamente en el dashboard. (El sub-módulo de coordinación con centros queda pendiente para cuando se integre el sistema de centros completo).

**Chat bidireccional** — Reutiliza la tabla `appeal_logs` y el patrón del widget unificado (`.pata-chat-*` styles ya definidos). Se activa cuando el admin solicita más información.  
**Páginas nuevas en Webflow:**

* `/mi-mascota` — detalle de mascota (slug por query param `?petId=xxx`)  
* `/solicitar-apoyo` — formulario de solicitud  
* `/solicitud` — detalle de solicitud (query param `?id=xxx`)

---

## Arquitectura

WEBFLOW (4 widgets JS)                NEXT.JS (8 API routes)  
─────────────────────                 ──────────────────────  
solidarity-fund-widget.js   ────────► GET  /api/solidarity/stats  
  Stats \+ pet cards \+                 GET  /api/solidarity/requests  
  historial global                    POST /api/solidarity/requests

solidarity-pet-detail.js    ────────► GET  /api/solidarity/requests  
  Info mascota \+ historial             (filtrado por petId)  
  mascota \+ btn solicitar

solidarity-request-form.js  ────────► POST /api/solidarity/requests  
  Selector mascota →                  POST /api/solidarity/upload  
  tipo solicitud →                    GET  /api/solidarity/chat/\[id\]  
  tipo apoyo → form → popup           POST /api/solidarity/chat/\[id\]

solidarity-request-detail.js────────► GET  /api/solidarity/requests/\[id\]  
  Detalle \+ timeline \+  
  chat bidireccional

ADMIN DASHBOARD (React)               ADMIN API ROUTES  
───────────────────────               ────────────────  
SolidarityFundPanel.tsx    ─────────► GET  /api/admin/solidarity/requests  
SolidarityRequestList.tsx            POST /api/admin/solidarity/\[id\]/approve  
SolidarityRequestDetail.tsx          POST /api/admin/solidarity/\[id\]/reject  
SolidarityRequestActions.tsx         POST /api/admin/solidarity/\[id\]/request-info  
                                      POST /api/admin/solidarity/chat/\[id\]

---

## Propuesta de Cambios por Fase

---

### **FASE A — Base de Datos (Bloqueante)**

#### **\[NEW\] `supabase-solidarity-fund.sql`**

**Tabla `solidarity_requests`:**  
id UUID PK  
user\_id UUID FK→users(id)  
memberstack\_id VARCHAR  
pet\_id UUID FK→pets(id)  
pet\_name VARCHAR          \-- snapshot nombre mascota  
pet\_index INTEGER         \-- 1, 2 o 3  
request\_number VARCHAR UNIQUE  \-- SF-2026-0001  
request\_type VARCHAR      \-- 'reimbursement' | 'allied-center'  
support\_type VARCHAR      \-- 'emergency' | 'vaccination' | 'death'  
estimated\_amount DECIMAL(10,2)  
description TEXT  
status VARCHAR DEFAULT 'pending'  
  \-- pending | in-review | approved | rejected | needs-info  
admin\_notes TEXT  
approved\_amount DECIMAL(10,2)  
reviewed\_by VARCHAR  
reviewed\_at TIMESTAMPTZ  
\-- Para citas en centro aliado  
case\_identification VARCHAR  
incident\_date DATE  
preferred\_appointment TIMESTAMPTZ  
selected\_center\_id UUID   \-- nullable hasta activar módulo centros  
\-- Auditoría  
created\_at TIMESTAMPTZ DEFAULT NOW()  
updated\_at TIMESTAMPTZ DEFAULT NOW()

**Tabla `solidarity_documents`:**  
id UUID PK  
request\_id UUID FK→solidarity\_requests(id)  
document\_type VARCHAR  \-- 'evidence\_photo' | 'prescription' | 'receipt' | 'vet\_report'  
file\_name VARCHAR  
file\_path TEXT  
file\_url TEXT  
file\_size INTEGER  
mime\_type VARCHAR  
uploaded\_at TIMESTAMPTZ DEFAULT NOW()

**Chat** — Reutiliza tabla existente `appeal_logs` con `type = 'solidarity_chat'` y `metadata.request_id`.  
**Storage bucket:** `solidarity-documents` (privado)  
**Índices:**  
idx\_solidarity\_requests\_memberstack\_id  
idx\_solidarity\_requests\_pet\_id  
idx\_solidarity\_requests\_status  
idx\_solidarity\_requests\_created\_at DESC

---

### **FASE B — TypeScript Types**

#### **\[NEW\] `src/types/solidarity.types.ts`**

export type SolidarityRequestType \= 'reimbursement' | 'allied-center';  
export type SupportType \= 'emergency' | 'vaccination' | 'death';  
export type SolidarityStatus \= 'pending' | 'in-review' | 'approved' | 'rejected' | 'needs-info';

export const SUPPORT\_LIMITS: Record\<SupportType, number\> \= {  
  emergency: 3000,  
  vaccination: 300,  
  death: 2000,  
};

export interface SolidarityRequest { ... }  
export interface SolidarityDocument { ... }  
export interface SolidarityStats { ... }  
export interface CreateSolidarityRequestDTO { ... }  
export interface SolidarityChatMessage { ... }

#### **\[MODIFY\] `src/types/admin.types.ts`**

* Reemplazar `solidarityFundData?: any` por `SolidarityFundData` tipado.

---

### **FASE C — API Routes (Next.js)**

#### **\[NEW\] `src/app/api/solidarity/stats/route.ts`**

`GET` — Retorna para el usuario autenticado:

* `activePets`: mascotas con carencia cumplida  
* `pendingPets`: mascotas aún en carencia  
* `totalRequests`: total histórico de solicitudes  
* `pendingRequests`: solicitudes activas (pending/in-review)

#### **\[NEW\] `src/app/api/solidarity/requests/route.ts`**

* `GET` — Lista solicitudes del usuario (filtros: `petId`, `status`, `supportType`; paginación)  
* `POST` — Crea solicitud:  
1. Valida que la mascota pertenece al usuario y está activa  
2. Valida monto contra `SUPPORT_LIMITS`  
3. Genera `request_number` (`SF-YYYY-NNNN`)  
4. Inserta en `solidarity_requests`  
5. Crea notificación admin (`type: 'new_solidarity_request'`)  
6. Retorna número de solicitud

#### **\[NEW\] `src/app/api/solidarity/requests/[id]/route.ts`**

`GET` — Detalle de solicitud \+ documentos adjuntos \+ mensajes de chat

#### **\[NEW\] `src/app/api/solidarity/upload/route.ts`**

`POST` — Sube hasta 3 archivos al bucket `solidarity-documents`. Retorna URLs públicas signed.

#### **\[NEW\] `src/app/api/solidarity/chat/[requestId]/route.ts`**

* `GET` — Mensajes del chat de una solicitud (de `appeal_logs` con `type=solidarity_chat`)  
* `POST` — Envía mensaje del usuario → notifica al admin

#### **\[NEW\] `src/app/api/admin/solidarity/requests/route.ts`**

`GET` — Lista todas las solicitudes para admin (filtros: `status`, `supportType`, `requestType`, búsqueda por nombre usuario/mascota; paginación)

#### **\[NEW\] `src/app/api/admin/solidarity/requests/[id]/approve/route.ts`**

`POST` — Aprueba solicitud:

* Recibe `approvedAmount` (puede ser menor al solicitado) y nota opcional  
* Actualiza `status → approved`, `approved_amount`, `reviewed_by`, `reviewed_at`  
* Crea notificación al usuario (`type: 'solidarity_approved'`)

#### **\[NEW\] `src/app/api/admin/solidarity/requests/[id]/reject/route.ts`**

`POST` — Rechaza con `adminNotes`. Notifica usuario (`type: 'solidarity_rejected'`).

#### **\[NEW\] `src/app/api/admin/solidarity/requests/[id]/request-info/route.ts`**

`POST` — Solicita más información:

* Guarda mensaje en `appeal_logs` como `type: 'solidarity_chat'`, `sender: 'admin'`  
* Actualiza `status → needs-info`  
* Notifica usuario (`type: 'solidarity_needs_info'`)

#### **\[NEW\] `src/app/api/admin/solidarity/chat/[requestId]/route.ts`**

`POST` — Admin responde en el chat de la solicitud. Notifica usuario.  
---

### **FASE D — Widget Dashboard Principal**

#### **\[NEW\] `public/widgets/solidarity-fund-widget.js`**

**Página:** `/mi-cuenta` (o equivalente Webflow)  
**Sección 1 — Stats bar (4 cards):**

* 🐾 Mascotas activas (carencia cumplida)  
* ⏳ Mascotas en espera de carencia  
* 📋 Solicitudes realizadas (total)  
* 🔄 Solicitudes en proceso (pending/in-review)

**Sección 2 — Pet Column (una columna):**

* Widget externo de Webflow que el usuario pasará cuando implementemos esta sección  
* Las cards activas son clickeables → `/mi-mascota?petId=xxx`  
* Las en carencia muestran badge con días restantes  
* Botón flotante "Nueva Solicitud" → `/solicitar-apoyo`

**Sección 3 — Historial de solicitudes:**

* Búsqueda por nombre mascota/número solicitud  
* Filtros: estado (chips) \+ tipo de apoyo (dropdown)  
* Cada fila clickeable → `/solicitud?id=xxx`  
* Columnas: `#`, Mascota, Tipo, Monto solicitado, Estado (chip color), Fecha

**Preview local:** `public/widgets/solidarity-fund-preview.html`  
**Figma necesario aquí:** Dashboard principal (stats \+ pet column \+ historial)  
---

### **FASE E — Widget Formulario de Solicitud**

#### **\[NEW\] `public/widgets/solidarity-request-form.js`**

**Página:** `/solicitar-apoyo`  
**Pantalla 1 — ¿Para cuál de tus compañeros?**

* Grid de pet cards (foto \+ nombre \+ chip estado)  
* Activas: seleccionables (borde highlight al seleccionar)  
* En carencia: bloqueadas (overlay \+ tooltip "Aún en período de carencia")

**Pantalla 2 — Tipo de solicitud** (aparece al seleccionar mascota):

* Card A: "Solicitud de Reembolso" 💰  
* Card B: "Cita en Centro Aliado" 🏥

**Pantalla 3 — Tipo de apoyo** (chips/botones grandes):

* 🚨 Emergencia médica (hasta $3,000)  
* 💉 Vacunación anual (hasta $300)  
* 🕊️ Fallecimiento (hasta $2,000)

**Pantalla 4A — Form Reembolso:**

* Descripción (textarea)  
* Monto estimado (input numérico, validación según tipo seleccionado)  
* Upload foto evidencia (obligatorio)  
* Upload receta veterinaria (obligatorio)  
* Upload recibo (obligatorio)

**Pantalla 4B — Form Cita en Centro Aliado:**

* Descripción del caso (textarea)  
* ¿Cómo identificar este caso? (input texto, ej: "fractura de patita")  
* Fecha de cuando ocurrió (datepicker)  
* Fecha y hora preferida de atención (datetime picker)  
* Adjuntar foto de evidencia (upload)  
* Adjuntar receta/informe veterinario (upload)  
* Selección de centro veterinario (dropdown, alimentado desde API; **feature flag** `ALLIED_CENTER_ENABLED`)

**Popup confirmación:**

* Ícono ✅ \+ texto "¡Recibimos tu solicitud\!"  
* Subtexto con número de solicitud generado  
* Botón "Ver mi solicitud" → `/solicitud?id=xxx`  
* Botón "Ir a inicio" → `/mi-cuenta`

**Preview local:** `public/widgets/solidarity-request-form-preview.html`  
**Figma necesario aquí:** Formulario de solicitud (los 4 pasos \+ popup)  
---

### **FASE F — Widget Detalle de Mascota**

#### **\[NEW\] `public/widgets/solidarity-pet-detail.js`**

**Página:** `/mi-mascota` (query: `?petId=xxx`)  
**Sección 1 — Hero de mascota:**

* Foto(s) de la mascota (carrusel si hay 2\)  
* Nombre, especie, raza, edad  
* Chip de estado (Activa / En carencia)  
* Fecha de activación (cuando terminó la carencia)

**Sección 2 — ¿Cómo funciona el Fondo Solidario?**

* Cards explicativas de los 3 beneficios con montos  
* Botón "Solicitar Apoyo" → `/solicitar-apoyo?petId=xxx`  
* Si la mascota está en carencia: botón deshabilitado \+ mensaje explicativo

**Sección 3 — Historial de esta mascota:**

* Tabla compacta filtrada por `petId`  
* Cada fila → `/solicitud?id=xxx`

**Preview local:** `public/widgets/solidarity-pet-detail-preview.html`  
**Figma necesario aquí:** Página de detalle de mascota  
---

### **FASE G — Widget Detalle de Solicitud**

#### **\[NEW\] `public/widgets/solidarity-request-detail.js`**

**Página:** `/solicitud` (query: `?id=xxx`)  
**Sección 1 — Header de solicitud:**

* Número de solicitud, fecha, chip de estado  
* Info de mascota (foto thumbnail \+ nombre)

**Sección 2 — Detalle:**

* Tipo de solicitud y apoyo  
* Monto solicitado / Monto aprobado (si aplica)  
* Descripción  
* Documentos adjuntos (miniaturas clickeables)

**Sección 3 — Timeline de estados:**

* Registro visual de cambios de estado con fechas

**Sección 4 — Chat** (visible solo cuando `status = needs-info` o hay mensajes previos):

* Reutiliza estilos `.pata-chat-*` del unified widget  
* `GET /api/solidarity/chat/[id]` para cargar mensajes  
* `POST /api/solidarity/chat/[id]` para enviar respuesta del usuario  
* Notificación al admin al enviar

**Preview local:** `public/widgets/solidarity-request-detail-preview.html`  
**Figma necesario aquí:** Página de detalle de solicitud  
---

### **FASE H — Admin Dashboard**

#### **\[MODIFY\] `src/app/admin/dashboard/page.tsx`**

Habilitar submenú `solidarity-fund` en navegación lateral.  
**Submenús del Fondo Solidario:**

* Nuevas | Aprobadas | Rechazadas | En Proceso | Info Pendiente

#### **\[NEW\] `src/components/Admin/SolidarityFund/`**

SolidarityFundPanel.tsx      — Panel principal con tabs y lista  
SolidarityRequestList.tsx    — Lista con filtros, búsqueda, paginación  
SolidarityRequestDetail.tsx  — Modal/drawer de detalle completo  
SolidarityRequestActions.tsx — Aprobar (con monto) / Rechazar / Pedir info  
SolidarityChatPanel.tsx      — Chat panel (igual a AdminChatPanel existente)

**Notificaciones bidireccionales completas:**

| Evento | Destino | `type` en tabla `notifications` |
| ----- | ----- | ----- |
| Usuario crea solicitud | Admin | `new_solidarity_request` |
| Admin aprueba | Usuario | `solidarity_approved` |
| Admin rechaza | Usuario | `solidarity_rejected` |
| Admin pide info | Usuario | `solidarity_needs_info` |
| Usuario responde chat | Admin | `solidarity_info_provided` |

**Figma necesario aquí:** Panel admin Fondo Solidario  
---

## Fases de Ejecución y Orden de Diseños Figma

| Fase | Tarea | Diseño Figma necesario |
| ----- | ----- | ----- |
| **A** | SQL: tablas \+ bucket | — |
| **B** | TypeScript types | — |
| **C** | Todas las API routes | — |
| **D** | Widget dashboard principal | ✅ Dashboard usuario (stats \+ historial) |
| **E** | Widget formulario solicitud | ✅ Formulario (4 pasos \+ popup) |
| **F** | Widget detalle mascota | ✅ Página `/mi-mascota` |
| **G** | Widget detalle solicitud | ✅ Página `/solicitud` |
| **H** | Admin dashboard | ✅ Panel admin Fondo Solidario |

**Orden recomendado para diseñar:** D → E → F → G → H  
---

## Principios Técnicos

1. **Chunks independientes**: Cada fase es un commit separado y funcional.  
2. **Feature flag**: `ALLIED_CENTER_ENABLED = false` en config del widget. El formulario de centros se construye completo pero solo se activa con el flag.  
3. **Snapshot de datos**: `pet_name` se guarda en la solicitud para consistencia histórica.  
4. **Validación doble**: Monto máximo validado en frontend (UX) y en API (seguridad).  
5. **Chat reutilizado**: Tabla `appeal_logs` con `type = 'solidarity_chat'` y `metadata.request_id`. No se crea tabla nueva.  
6. **CORS**: Todas las rutas con acceso Webflow incluyen headers CORS completos.