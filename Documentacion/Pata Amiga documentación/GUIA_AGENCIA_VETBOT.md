# 📖 Guía de Integración Vet-Bot (Chatbot Builder AI)
**Para: Equipo de Desarrollo del Bot / Agencia**

Esta guía explica cómo el Vet-Bot recibe automáticamente la información de los usuarios desde la web de Pata Amiga. El sistema ha sido diseñado para ser automático; el bot ya recibe los datos sin necesidad de pedirlos.

---

### 1. ¿Cómo recibe el Bot la información?
Nuestra web envía los datos al bot de **dos formas simultáneas** para asegurar que no fallen:

1.  **Por IDs Numéricos (Recomendado):** Los datos se inyectan directamente en los campos (CUFs) de Chatbot Builder que ustedes crearon.
2.  **Por Parámetro "REF":** El token de sesión se envía en el enlace del bot (ej. `...&ref=TOKEN_AQUI`).

---

### 2. Los "Ingredientes" (Campos Personalizados)
Asegúrense de que en su panel de **Custom User Fields**, los IDs coincidan con estos (si no coinciden, avísennos):

| Dato | ID en CBB | Descripción |
| :--- | :--- | :--- |
| **Token de Sesión** | `673882` | Es la "llave" para entrar a nuestra base de datos. |
| **Email del Cliente** | `515388` | El correo de la cuenta del usuario. |
| **Nombre del Cliente** | `620522` | El nombre que usaremos para saludar. |

---

### 3. Configuración del bloque "External Request" (API)
Cuando el bot necesite traer la info del usuario (nombre, mascotas, etc.), debe llamar a nuestra API. La configuración en su bloque de petición externa debe ser:

*   **URL:** `https://app.pataamiga.mx/api/integrations/vet-bot/context`
*   **Método:** `GET`
*   **Headers:** 
    *   `x-vet-bot-key`: `pata-amiga-vet-bot-secret-2026`
*   **Query Parameters (Parámetros):**
    *   `sessionToken`: **Aquí deben poner el valor del campo `673882` o la variable `{{ref}}`**.

---

### 4. Preguntas Frecuentes y Escenarios (Troubleshooting)

#### **Escenario A: El bot me saluda como "null" o "Usuario"**
*   **Causa:** El bot no está leyendo correctamente el campo `620522`.
*   **Solución:** Revisen que en su mensaje de bienvenida estén usando exactamente la variable que corresponde a ese ID.

#### **Escenario B: El bot da error al intentar traer las mascotas**
*   **Causa:** El `sessionToken` que están mandando a nuestra API está vacío o es inválido.
*   **Solución:** Asegúrense de que en la llamada a la API estén usando la variable **`{{ref}}`**. Chatbot Builder guarda automáticamente el token en esa variable cuando el usuario entra desde la web.

#### **Escenario C: ¿Qué pasa si el usuario no tiene sesión iniciada?**
*   **Respuesta:** Nuestra web detectará que no hay sesión y el bot cargará de forma "Genérica". Solo en este caso el bot **sí debe pedir el email** como lo hacía antes.

---

### 5. Herramienta de Diagnóstico para la Agencia
Ustedes pueden verificar qué datos está enviando la web en cualquier momento:
1.  Entren a la web logueados como un usuario.
2.  Abran la consola del navegador (`F12`).
3.  Escriban: `vetBotDiagnostics()` y presionen Enter.
4.  Si ven que dice `✅ Datos de identificación presentes`, entonces la web está enviando todo bien y el ajuste debe hacerse dentro del panel de CBB.

---
*Dudas técnicas adicionales: Contactar al equipo de desarrollo de Pata Amiga.*
