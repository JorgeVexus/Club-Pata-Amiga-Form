# ⚖️ Guía del Sistema de Apelaciones y Actualización de Datos

Este sistema permite que un usuario rechazado pueda defender su solicitud, proporcionar información faltante y que el administrador gestione este proceso de forma centralizada.

---

## 🏗️ 1. Arquitectura de Datos (Supabase)

Para soportar apelaciones, necesitamos expandir la tabla de `members` o `requests`.

### Nuevos Estados de Solicitud:
- `rejected`: Rechazo inicial (visto por el usuario).
- `appealing`: El usuario ha iniciado una apelación.
- `information_requested`: El admin pide más datos/documentos.
- `information_provided`: El usuario ya subió lo solicitado.

### Nueva Tabla: `appeal_logs`
Para llevar un historial de la "conversación" entre el admin y el usuario.
- `id`: UUID.
- `request_id`: Relación con la solicitud.
- `type`: 'admin_message' | 'user_message' | 'system_alert'.
- `content`: El mensaje o descripción.
- `files`: Array de URLs (si se subieron nuevos documentos).
- `created_at`: Timestamp.

---

## 🛠️ 2. Flujo del Administrador (Admin Dashboard - Next.js)

### Vista de Solicitudes Rechazadas:
- Filtro especial para ver solicitudes en estado `appealing`.
- **Botón "Solicitar Información":** Abre un modal para escribir qué falta (ej: "Tu INE está borroso, por favor sube uno nuevo").

### Acciones de Apelación:
1. **Request Info:** Cambia el estado a `information_requested` y dispara notificaciones.
2. **Re-Evaluate:** El admin ve los nuevos documentos subidos por el usuario junto a los originales.
3. **Approve / Permanent Reject:** El veredicto final.

---

## 🌐 3. Flujo del Usuario (Webflow)

### Espacio de Usuario (Dashboard):
En Webflow, usando **Memberstack**, identificamos al usuario y consultamos su estado en Supabase.

1. **Estado `rejected`:** 
   - Se muestra el "Motivo de Rechazo" claro.
   - Botón grande: **"Apelar Solicitud"**. Al dar clic, se abre un pequeño formulario de texto para que el usuario explique su caso.
2. **Estado `information_requested`:** 
   - Se muestra el mensaje del administrador.
   - **Módulo de Actualización:** Una sección donde aparecen los campos marcados como "erróneos" (INE, Comprobante, etc.) con el botón para subir el nuevo archivo.

---

## 📲 4. Sistema de Notificaciones Automáticas

Para que el sistema sea efectivo, la comunicación debe ser inmediata.

### 📧 Email (Vía Resend o SendGrid):
- **Trigger:** Cuando el admin cambia el estado a `information_requested`.
- **Contenido:** "Hola [Nombre], necesitamos más información para aprobar tu membresía. [Mensaje del Admin]. Haz clic aquí para actualizar tus datos."

### 🟢 WhatsApp (Vía Twilio o Wati.io):
- **Mensaje:** "Club Pata Amiga: Hola [Nombre], hay una actualización en tu solicitud. El administrador ha solicitado información adicional. Revisa aquí: [Link a Webflow]"
- **Uso de API:** Creamos un Webhook en Supabase o un API Route en Next.js que se dispare al actualizar la base de datos.

---

## 📝 5. Módulo de Actualización de Documentos

Este es el apartado técnico más importante. En lugar de que el usuario repita TODO el registro, solo actualiza lo necesario.

1. **Interfaz dinámica:** Si el admin marcó "INE" como inválido, el dashboard solo le habilita el campo de subida de INE.
2. **Subida a Supabase Storage:** El archivo nuevo reemplaza al anterior en el bucket de Storage (o se guarda con un prefijo `_v2`) y se actualiza la URL en la tabla del usuario.
3. **Aviso al Admin:** Automáticamente el estado pasa a `information_provided`, enviando una alerta al dashboard de administración.
