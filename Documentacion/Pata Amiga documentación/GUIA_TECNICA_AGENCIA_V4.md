# 🚀 Guía Definitiva de Integración Vet-Bot
**Estatus: Verificada al 100% (Marzo 2026)**

Esta guía contiene los aprendizajes técnicos finales para que la integración entre la web de Pata Amiga y Chatbot Builder AI (CBB) funcione sin errores. 

---

## 🛑 REGLAS DE ORO (Si fallas en esto, nada funcionará)

1.  **SIN ESPACIOS INVISIBLES:** Al crear los *Custom User Fields* en CBB, asegúrense de que el nombre **no tenga espacios al final**. (Ejemplo: `"session_token"` y NO `"session_token "`).
2.  **LLAVES PEQUEÑAS:** En los mensajes del bot, las variables deben ir sin espacios internos. 
    *   ✅ `{{cliente_nombre}}` 
    *   ❌ `{{ cliente_nombre }}`
3.  **TOKEN POR VARIABLE:** No usen la palabra `ref` manualmente en la URL si no les funciona. Usen siempre el selector de variables del Builder para insertar el campo del token.

---

## ⚙️ 1. Configuración del bloque "External Request"

Este bloque es el que "va a buscar" la información del usuario y sus mascotas a nuestra base de datos.

*   **Método:** `GET`
*   **URL:** `https://app.pataamiga.mx/api/integrations/vet-bot/context?sessionToken={{session_token}}`
    *   *(Nota: Sustituye `{{session_token}}` usando el selector de variables `{ }` de tu panel para asegurar el nombre correcto).*
*   **Headers (Cabeceras):**
    *   `x-vet-bot-key`: `pata-amiga-vet-bot-secret-2026`

---

## 📊 2. Mapeo de Datos (JSONPath)

Cuando la API responde, devuelve un objeto JSON. Para guardar los datos en CBB, deben usar exactamente estas rutas en la sección **"Response Mapping"**:

### A. Datos del Usuario
| JSON Path (Ruta) | Recomendación de Campo en CBB | Descripción |
| :--- | :--- | :--- |
| `$.user.firstName` | `cliente_nombre` | Solo el primer nombre del dueño. |
| `$.user.email` | `cliente_email` | Correo de la cuenta. |

### B. Datos de la Mascota 1 (Principal)
Para traer los datos de la primera mascota en la lista, usen esta sintaxis de "punto y pesos":

| JSON Path (Ruta) | Recomendación de Campo en CBB | Descripción |
| :--- | :--- | :--- |
| `$.pets[0].name` | `mascota_1_nombre` | Nombre de la mascota. |
| `$.pets[0].breed` | `mascota_1_raza` | Raza detallada. |
| `$.pets[0].age` | `mascota_1_edad` | Edad (ej: "2-años"). |
| `$.pets[0].size` | `mascota_1_talla` | Talla (ej: "mediana"). |

> [!TIP]
> Si el usuario tiene más mascotas, pueden mapear la segunda cambiando el número: `$.pets[1].name`, y así sucesivamente.

---

## 🧪 3. Cómo Probar (Sin adivinar)

1.  **Pestaña "Test Now":** En el bloque de "External Request", vayan a la pestaña "Test Now".
2.  **Usuario de Prueba:** Busquen a un usuario que sepan que tiene sesión.
3.  **Resultado:** Si el recuadro muestra un JSON con `"success": true`, la conexión es exitosa. Si los campos de abajo salen vacíos, revisen que el nombre del campo en CBB no tenga espacios al final.

---

## 📝 4. Estructura del JSON (Referencia)
Así se ve la información que enviamos. Si necesitan más datos, solo búsquenlos en este mapa:

```json
{
  "success": true,
  "user": {
    "firstName": "Jorge",
    "email": "correo@ejemplo.com"
  },
  "pets": [
    {
      "name": "Flamingo",
      "breed": "Alaskan Malamute",
      "age": "2-años",
      "size": "mediana"
    }
  ]
}
```

---
**IMPORTANTE:** El script que instalamos en la web ya se encarga de generar el token y "escribirlo" en el campo `session_token` por ustedes. Ustedes solo deben concentrarse en leerlo en la API.
