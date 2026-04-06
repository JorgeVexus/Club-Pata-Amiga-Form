# 📖 Guía de Integración Vet-Bot (Chatbot Builder AI)
**Para: Equipo de Desarrollo del Bot / Agencia**

Esta guía explica cómo el Vet-Bot recibe automáticamente la información de los usuarios. El sistema es totalmente automático: el bot recibe los datos en cuanto el usuario abre el chat.

---

### 1. ¿Cómo recibe el Bot la información?
Nuestra web envía los datos al bot inyectándolos directamente en sus **Custom User Fields**.

*   **Identificación Automática:** El script escribe el token en el campo `session_token`.
*   **Variable de Uso:** Para llamar a la API, usen siempre la variable del campo donde se guarda el token (ej: `{{session_token}}`).

---

### 2. Configuración del bloque "External Request" (API)
Configuren su bloque de petición externa exactamente así:

*   **URL:** `https://app.pataamiga.mx/api/integrations/vet-bot/context?sessionToken={{session_token}}`
*   **Método:** `GET`
*   **Headers:** 
    *   `x-vet-bot-key`: `pata-amiga-vet-bot-secret-2026`

> [!CAUTION]
> **REGLA CRÍTICA:** Asegúrense de que sus Custom Fields en el panel de Settings **NO tengan espacios al final**. El campo debe llamarse exactamente `session_token` y no `session_token `.

---

### 3. Mapeo de Datos (JSONPath)
Usen estas rutas exactas en la sección **Response Mapping** para guardar la info:

#### **A. Datos del Usuario (`user`)**
*   `$.user.firstName` -> Nombre del cliente.
*   `$.user.lastName` -> Apellido del cliente.
*   `$.user.email` -> Correo electrónico oficial.
*   `$.user.membershipStatus` -> Estado de su membresía (ej: `active`, `pending`).

#### **B. Lista de Mascotas (`pets`)**
Para la primera mascota registrada (índice 0):
*   `$.pets[0].name` -> Nombre de la mascota.
*   `$.pets[0].breed` -> Raza (ej: "Chihuahua", "Mestizo").
*   `$.pets[0].type` -> Especie (ej: "Perro", "Gato").
*   `$.pets[0].age` -> Edad (ej: "2-años").
*   `$.pets[0].size` -> Tamaño (ej: "mediana").
*   `$.pets[0].waitingPeriod.isActive` -> `true` si todavía está en periodo de carencia.

#### **C. Historial Reciente (`consultationHistory`)**
*   `$.consultationHistory[0].summary` -> Resumen de la última consulta.
*   `$.consultationHistory[0].date` -> Fecha de la última consulta.

---

### 4. Preguntas Frecuentes y Escenarios (Troubleshooting)

#### **Escenario A: Los datos de la mascota no aparecen (salen las llaves `{{...}}`)**
*   **Causa 1:** El nombre del Custom Field en CBB tiene un espacio al final.
*   **Causa 2:** Pusieron espacios dentro de las llaves en el mensaje (ej: `{{ mascota_1_nombre }}`).
*   **Solución:** Quiten todos los espacios. Debe ser `{{mascota_1_nombre}}`.

#### **Escenario B: El bot da error "Invalid or expired session token"**
*   **Causa:** Están probando con un token viejo o la variable `{{session_token}}` no se está llenando.
*   **Solución:** Abran la web con su sesión iniciada y abran el chat. El script generará un token nuevo cada vez.

---

### 5. Herramienta de Diagnóstico
Pueden verificar el token actual desde la consola del navegador (`F12`):
1. Escriban: `vetBotDiagnostics()` y den Enter.
2. Copien el token que sale en "Ref" para probar manualmente en el bloque de API.

---
*Dudas técnicas adicionales: Contactar al equipo de desarrollo de Pata Amiga.*

