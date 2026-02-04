# 📋 Checklist para Reunión de Integración CRM
**Fecha de reunión:** _______________  
**Participantes:** _______________

---

## 1️⃣ AUTENTICACIÓN (¿Cómo nos conectamos?)

**Pregunta principal:** *¿Qué método de autenticación usa su API?*

| Opción | ¿Usan este? | Dato que necesitamos |
|--------|-------------|----------------------|
| ☐ API Key | Sí / No | Llave: _________________ |
| ☐ Bearer Token | Sí / No | Token: _________________ |
| ☐ OAuth2 | Sí / No | Client ID: _________________ |
| | | Client Secret: _________________ |
| | | Token URL: _________________ |

**Preguntas adicionales:**
- ☐ ¿El token/llave expira? ____ Si sí, ¿cada cuánto? ____
- ☐ ¿Tienen ambiente de pruebas (sandbox)? ____
- ☐ ¿Hay límite de peticiones por minuto/hora? ____

---

## 2️⃣ ENDPOINT (¿A dónde enviamos los datos?)

**Pregunta principal:** *¿Cuál es la URL de su API para crear/actualizar contactos?*

| Concepto | Valor |
|----------|-------|
| URL Base de la API | `https://________________________________` |
| Endpoint para crear contacto | `/________________________________` |
| Método HTTP | ☐ POST  ☐ PUT  ☐ PATCH |

---

## 3️⃣ DATA MAPPING (¿Cómo se llaman sus campos?)

**Pregunta principal:** *¿Cómo debo enviar cada dato para que lo reciban correctamente?*

### Datos del Miembro

| Nuestro Campo | ¿Cómo se llama en su CRM? | ¿Obligatorio? |
|---------------|---------------------------|---------------|
| `email` | _________________ | ☐ Sí  ☐ No |
| `full_name` | _________________ | ☐ Sí  ☐ No |
| `phone` | _________________ | ☐ Sí  ☐ No |
| `address` | _________________ | ☐ Sí  ☐ No |
| `memberstack_id` (ID único) | _________________ | ☐ Sí  ☐ No |

**Nota sobre nombres:**
- ☐ ¿Debo separar el nombre completo en `first_name` + `last_name`? ____

### Datos de la Mascota

| Nuestro Campo | ¿Cómo se llama en su CRM? | ¿Obligatorio? |
|---------------|---------------------------|---------------|
| `pet.name` | _________________ | ☐ Sí  ☐ No |
| `pet.species` (Canino/Felino) | _________________ | ☐ Sí  ☐ No |
| `pet.breed` (raza) | _________________ | ☐ Sí  ☐ No |
| `approved_at` (fecha aprobación) | _________________ | ☐ Sí  ☐ No |

**Notas sobre campos personalizados:**
- ☐ ¿Ya tienen campos para mascotas o hay que crearlos? ____
- ☐ ¿El formato de fecha es `YYYY-MM-DD` o diferente? ____

---

## 4️⃣ MANEJO DE ERRORES

**Pregunta principal:** *¿Qué pasa si algo sale mal?*

- ☐ ¿Qué código de error devuelven si falta un campo? ____
- ☐ ¿Qué código devuelven si el contacto ya existe? ____
- ☐ ¿Tienen documentación de códigos de error? ____
- ☐ ¿Hay un email/contacto técnico para reportar problemas? ____

---

## 5️⃣ DOCUMENTACIÓN Y RECURSOS

**Solicitar:**
- ☐ Link a la documentación de su API: _________________________
- ☐ Ejemplo de petición exitosa (request/response)
- ☐ Credenciales de prueba (sandbox)
- ☐ Contacto técnico para dudas: _________________________

---

## 📝 NOTAS DE LA REUNIÓN

_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

## ✅ RESUMEN DE PENDIENTES

| # | Pendiente | Responsable | Fecha límite |
|---|-----------|-------------|--------------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

---

*Documento preparado para Club Pata Amiga - Integración CRM*
