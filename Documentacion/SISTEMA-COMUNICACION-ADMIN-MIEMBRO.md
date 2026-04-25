# Pata Chat & Sistema de Comunicación Dinámica (v2.0)

Este sistema centraliza la interacción entre el equipo administrativo de Club Pata Amiga y sus miembros para la validación de expedientes, resolución de dudas y cumplimiento de requisitos documentales.

## 🌟 Propósito del Sistema
Eliminar la fricción en el proceso de aprobación de mascotas, permitiendo que el administrador solicite correcciones específicas y que el usuario las resuelva de manera inmediata sin salir de su dashboard.

---

## 🛡️ Funciones para el Administrador (Admin Dashboard)

### 1. Panel de Solicitud Estructurada
Ubicado en el modal de detalles de cada mascota, permite seleccionar qué información se requiere mediante checkboxes:
- **📸 Foto Principal**: Solicita una nueva foto de portada para la mascota.
- **🏥 Certificado Médico**: Solicita el documento veterinario actualizado.
- **📄 Documento Adicional**: Para cualquier otro requisito no estándar.
- **💬 Mensaje Personalizado**: Espacio para dar instrucciones específicas al miembro.

### 2. Automatización de Email
Al enviar una solicitud, el sistema dispara automáticamente un correo electrónico branded (Resend) con un **Magic Link**. Este enlace lleva al usuario directamente a su chat, con el modal de la mascota abierto.

### 3. Chat Directo
Permite enviar mensajes de texto libres para aclaraciones rápidas que no requieren necesariamente un documento.

### 4. Historial Inteligente
Visualización cronológica de:
- Mensajes del Admin.
- Mensajes del Usuario.
- **Carga de Archivos**: Los archivos enviados por el usuario aparecen con botones de **"Ver"** y **"Descargar"** para facilitar la auditoría.

---

## 🐾 Funciones para el Miembro (User Widget)

### 1. Burbujas de Acción (Action Bubbles)
Dentro del chat, el usuario no recibe solo texto, sino tarjetas interactivas:
- Cada solicitud del admin genera un botón de **"Subir/Actualizar [Tipo]"**.
- Al hacer clic, se abre el selector de archivos nativo.

### 2. Sincronización en Tiempo Real
Al subir un archivo solicitado:
- La foto de la mascota se actualiza instantáneamente en el modal.
- El estatus visual cambia a **"EN REVISIÓN"** de forma automática.
- El sistema notifica al administrador mediante el icono de campana.

### 3. Soporte Multiformato
Acepta imágenes (JPG, PNG, WEBP) y documentos PDF de hasta **10MB**.

---

## ⚙️ Arquitectura Técnica

### Flujo de Datos
1.  **Admin** envía `POST /api/admin/members/[id]/request-info`.
2.  Se inserta log en `appeal_logs` con metadata `request_types`.
3.  **Member** recibe notificación y abre el widget.
4.  El widget detecta `request_types` y renderiza el botón de subida.
5.  **Member** sube archivo vía `POST /api/user/fulfill-request`.
6.  El servidor guarda en **Supabase Storage**, actualiza la tabla `pets` y cambia el status a `pending`.
7.  Se inserta log de cumplimiento y se notifica al Admin.

### Endpoints Clave
- `GET /api/admin/members/[id]/appeal-logs`: Recupera el historial.
- `POST /api/admin/members/[id]/request-info`: Inicia una solicitud.
- `POST /api/user/fulfill-request`: Procesa la respuesta del usuario con archivos.
- `POST /api/user/chat/send`: Envía mensajes de texto.

### Tablas de Base de Datos
- **`appeal_logs`**: Almacena todos los mensajes y metadatos de las solicitudes (JSONB).
- **`notifications`**: Gestiona las alertas de la campana para el Admin.
- **`pets`**: Actualizada dinámicamente con las nuevas URLs de archivos.

---

## 📋 Guía de Uso Rápido

### Para el Administrador:
1.  Ve al dashboard y abre los detalles de un miembro.
2.  En la sección de la mascota, busca el panel de **"Comunicación"**.
3.  Selecciona el documento faltante y presiona **"Enviar Solicitud"**.
4.  Monitorea tu campana de notificaciones para saber cuándo el usuario responda.

### Para el Miembro:
1.  Haz clic en el enlace del correo o abre el chat en tu dashboard.
2.  Busca la burbuja con el botón **"Subir"**.
3.  Selecciona tu archivo y espera la confirmación ✅.
4.  Tu mascota pasará automáticamente a estado de revisión.

---
**Última actualización**: Abril 2026
**Estatus**: Producción / Verificado
