# 🐾 Guía del Fondo Solidario — Club Pata Amiga

Esta documentación detalla el funcionamiento técnico, la arquitectura y el flujo de usuario del **Sistema de Solicitudes del Fondo Solidario**.

---

## 📖 Guía de Uso (Miembros)

El Fondo Solidario permite a los miembros solicitar apoyo económico para emergencias médicas, vacunación anual o fallecimiento de sus mascotas.

### 1. Requisitos de Elegibilidad
- La mascota debe estar registrada en el Club.
- El período de carencia debe haber finalizado (90 días para el titular, 120-180 días para la mascota dependiendo del plan).
- La membresía debe estar activa y al corriente de pagos.

### 2. Tipos de Apoyo
| Beneficio | Monto Máximo | Documentación Requerida |
| :--- | :--- | :--- |
| **Emergencia Médica** | $3,000 MXN | Foto evidencia + Receta + Recibo |
| **Vacunación Anual** | $300 MXN | Foto evidencia + Receta + Recibo |
| **Fallecimiento** | $2,000 MXN | Foto evidencia + Receta + Recibo |

### 3. Flujo de Solicitud
1. **Acceso**: Ir al dashboard de "Manada" y seleccionar la mascota o el botón "Nueva Solicitud".
2. **Selección**: Elegir la mascota (solo aparecerán activas las que cumplieron carencia).
3. **Tipo**: Elegir entre "Reembolso" o "Cita en Centro Aliado".
4. **Datos**: Ingresar detalles del caso, clínica, veterinario y montos.
5. **Evidencia**: Subir fotos y documentos PDF/Imagen de los comprobantes.
6. **Seguimiento**: Una vez enviada, recibirás un número de folio (`SF-YYYY-NNNN`) para seguimiento en tiempo real.

---

## 🛠️ Documentación Técnica

### Arquitectura de Datos
El sistema se apoya en Supabase para persistencia y Memberstack para autenticación.

#### Tablas Principales
- `solidarity_requests`: Almacena el encabezado de la solicitud, estados y montos.
- `solidarity_documents`: Almacena los metadatos de los archivos subidos (evidencias, recetas, facturas).
- `appeal_logs`: Reutilizada para el **Chat Bidireccional** (`type = 'solidarity_chat'`).

### Componentes de Frontend (Widgets JS)
Los widgets son componentes autónomos inyectables en Webflow:

1. **`solidarity-dashboard.js`**:
   - Vista general de la manada.
   - Cálculo dinámico de carencia en el cliente para feedback inmediato.
   - Listado histórico de solicitudes con filtros.
2. **`solidarity-request-form.js`**:
   - Formulario de 4 pasos con lógica de "Revelación Progresiva".
   - Validaciones de montos máximos por tipo de beneficio.
   - Sistema de carga de archivos integrado con la API de Supabase.
3. **`solidarity-request-detail.js`**:
   - Visualización completa del caso.
   - Galería de evidencias con etiquetas dinámicas.
   - Interfaz de chat en tiempo real con el administrador.

### API Endpoints (Next.js)

#### Público (Usuario)
- `GET /api/solidarity/stats`: Obtiene resumen de mascotas y solicitudes activas.
- `GET /api/solidarity/history`: Historial completo de solicitudes del miembro.
- `POST /api/solidarity/request`: Crea una nueva solicitud y sube documentos.
- `GET /api/solidarity/details/[id]`: Detalle extendido de una solicitud específica.

#### Administrativo
- `GET /api/admin/solidarity/requests`: Listado global para el panel admin.
- `POST /api/admin/solidarity/approve/[id]`: Aprobación con ajuste de monto.
- `POST /api/admin/solidarity/reject/[id]`: Rechazo con retroalimentación.
- `POST /api/admin/solidarity/request-info/[id]`: Cambia estado a `needs-info` y abre el chat.

---

## 🔔 Sistema de Notificaciones
Se implementó una lógica de "Deep Linking":
- Al crear una solicitud -> Admin recibe notificación y el clic lo lleva a `admin/dashboard/solidarity?id=...`.
- Al aprobar/rechazar -> Usuario recibe notificación en el widget de campana que lo lleva a `/solicitud?id=...`.

---

## 🔐 Seguridad y Privacidad
- **Storage**: Los documentos se almacenan en un bucket privado de Supabase (`solidarity-documents`).
- **RLS**: Las políticas de Row Level Security aseguran que un usuario solo pueda ver sus propias solicitudes y mensajes.
- **Validación Server-side**: Los montos máximos se validan en el servidor, no solo en el cliente.
