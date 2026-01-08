# 🗺️ Roadmap de Implementación y Cronograma

Este documento establece el orden lógico y los tiempos estimados para las próximas fases de desarrollo del Club Pata Amiga.

---

## 📊 Cronograma General (Estimado: 3-4 Semanas)

| Fase | Sistema | Duración | Prioridad |
| :--- | :--- | :--- | :--- |
| **Fase 1** | **Notificaciones & Comunicaciones** | 1 Semana | ⭐ Alta |
| **Fase 2** | **Sistema de Apelaciones & Documentos** | 1 Semana | ⭐ Alta |
| **Fase 3** | **Refinamiento UI y Webflow Connect** | 4-5 Días | 🟦 Media |
| **Fase 4** | **Migración Cloudflare (Dominio)** | 2 Días | 🟧 Final |

---

## 🛠️ Fase 1: Notificaciones y Comunicaciones Personalizadas

Esta fase sienta las bases para hablar con el usuario en tiempo real y de forma manual.

### Sistema de Comunicaciones (Super Admin):
- **Plantillas Dinámicas:** Los admins eligen entre "Falta INE", "Bienvenida", "Recordatorio Carencia", o "Texto Libre".
- **Variables Dinámicas:** Uso de tags como `{{nombre_usuario}}` o `{{nombre_mascota}}` en las plantillas.
- **Doble Canal:** Opción de marcar [x] Enviar por Email y [x] Enviar por WhatsApp.

---

## ⚖️ Fase 2: Sistema de Apelaciones y Documentos

Permitir que el usuario corrija errores detectados por el admin.

### Flujo de Apelación:
1. **Admin:** Rechaza y envía notificación personalizada solicitando corrección.
2. **Usuario:** Recibe Link directo → Inicia sesión en Webflow → Ve módulo de "Actualizar Documentos".
3. **Sistema:** Al subir el documento nuevo, el estado cambia a `information_provided` y aparece un badge rojo en el dashboard de admin.

---

## ⚙️ Fase 3: Cloudflare y Dominio (Fase Final)

Solo se activa cuando el dominio final esté comprado.

- **Configuración Reverse Proxy:** Para que Webflow y Vercel parezcan un solo sitio.
- **SSL Estricto:** Asegurar la encriptación de extremo a extremo.
- **Caché:** Optimización de carga de imágenes de mascotas.

---

## 🎯 Próximo Paso Inmediato

**Recomendación:** Empezar con el **Esquema de Base de Datos** para Mensajes y Notificaciones, ya que es el "motor" de todo lo demás.
