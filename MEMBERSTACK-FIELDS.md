# Campos de Memberstack - Documentación Completa

Esta documentación lista todos los campos del formulario de registro y sus correspondientes atributos `data-ms-member` para Memberstack.

## 📋 Configuración en Memberstack

Antes de usar el formulario, debes crear estos **Custom Fields** en tu cuenta de Memberstack:

1. Ve a tu proyecto en Memberstack
2. Navega a **Settings → Custom Fields**
3. Crea cada uno de los siguientes campos con el nombre exacto especificado

---

## 👤 Información Personal

### Nombre(s)
- **Campo HTML**: `firstName`
- **Atributo Memberstack**: `data-ms-member="first-name"`
- **Tipo en Memberstack**: Text
- **Requerido**: Sí
- **Validación**: No vacío

### Apellido Paterno
- **Campo HTML**: `paternalLastName`
- **Atributo Memberstack**: `data-ms-member="paternal-last-name"`
- **Tipo en Memberstack**: Text
- **Requerido**: Sí
- **Validación**: No vacío

### Apellido Materno
- **Campo HTML**: `maternalLastName`
- **Atributo Memberstack**: `data-ms-member="maternal-last-name"`
- **Tipo en Memberstack**: Text
- **Requerido**: Sí
- **Validación**: No vacío

### Género
- **Campo HTML**: `gender`
- **Atributo Memberstack**: `data-ms-member="gender"`
- **Tipo en Memberstack**: Text
- **Requerido**: Sí
- **Valores posibles**: `hombre`, `mujer`, `no-especificar`

### Fecha de Nacimiento
- **Campo HTML**: `birthDate`
- **Atributo Memberstack**: `data-ms-member="birth-date"`
- **Tipo en Memberstack**: Text (formato: YYYY-MM-DD)
- **Requerido**: Sí
- **Validación**: Fecha válida, no futura

### CURP
- **Campo HTML**: `curp`
- **Atributo Memberstack**: `data-ms-member="curp"`
- **Tipo en Memberstack**: Text
- **Requerido**: Sí
- **Validación**: 18 caracteres, mayúsculas

---

## 📍 Dirección

### Código Postal
- **Campo HTML**: `postalCode`
- **Atributo Memberstack**: `data-ms-member="postal-code"`
- **Tipo en Memberstack**: Text
- **Requerido**: Sí
- **Validación**: 5 dígitos numéricos

### Estado
- **Campo HTML**: `state`
- **Atributo Memberstack**: `data-ms-member="state"`
- **Tipo en Memberstack**: Text
- **Requerido**: Sí
- **Auto-llenado**: Sí (desde API de códigos postales)

### Ciudad
- **Campo HTML**: `city`
- **Atributo Memberstack**: `data-ms-member="city"`
- **Tipo en Memberstack**: Text
- **Requerido**: Sí
- **Auto-llenado**: Sí (desde API de códigos postales)

### Colonia
- **Campo HTML**: `colony`
- **Atributo Memberstack**: `data-ms-member="colony"`
- **Tipo en Memberstack**: Text
- **Requerido**: Sí
- **Auto-llenado**: Sí (selección desde API de códigos postales)

### Dirección
- **Campo HTML**: `address`
- **Atributo Memberstack**: `data-ms-member="address"`
- **Tipo en Memberstack**: Text
- **Requerido**: No
- **Descripción**: Calle, número, etc. (opcional)

---

## 📞 Contacto

### Correo Electrónico
- **Campo HTML**: `email`
- **Atributo Memberstack**: `data-ms-member="email"`
- **Tipo en Memberstack**: Email (campo nativo de Memberstack)
- **Requerido**: Sí
- **Validación**: Formato de email válido

### Número de Teléfono
- **Campo HTML**: `phone`
- **Atributo Memberstack**: `data-ms-member="phone"`
- **Tipo en Memberstack**: Text
- **Requerido**: Sí
- **Formato**: 123 123 1234 (10 dígitos)
- **Prefijo**: +52 (México)

### Contraseña
- **Campo HTML**: `password`
- **Atributo Memberstack**: `data-ms-member="password"`
- **Tipo en Memberstack**: Password (campo nativo de Memberstack)
- **Requerido**: Sí
- **Validación**: Mínimo 8 caracteres

---

## 📄 Documentos (URLs almacenadas)

Estos campos almacenan las URLs de los archivos subidos a Supabase:

### INE - Frente
- **Campo HTML**: N/A (archivo)
- **Atributo Memberstack**: `data-ms-member="ine-front-url"`
- **Tipo en Memberstack**: Text (URL)
- **Requerido**: Sí
- **Descripción**: URL del archivo de INE (frente) en Supabase

### INE - Reverso
- **Campo HTML**: N/A (archivo)
- **Atributo Memberstack**: `data-ms-member="ine-back-url"`
- **Tipo en Memberstack**: Text (URL)
- **Requerido**: Sí
- **Descripción**: URL del archivo de INE (reverso) en Supabase

### Comprobante de Domicilio
- **Campo HTML**: N/A (archivo)
- **Atributo Memberstack**: `data-ms-member="proof-of-address-url"`
- **Tipo en Memberstack**: Text (URL)
- **Requerido**: Sí
- **Descripción**: URL del comprobante de domicilio en Supabase

---

## 🕐 Metadata del Sistema

Estos campos se crean automáticamente:

### Fecha de Registro
- **Atributo Memberstack**: `data-ms-member="registration-date"`
- **Tipo en Memberstack**: Text (ISO 8601)
- **Descripción**: Fecha y hora de registro del usuario

### Fin del Período de Carencia
- **Atributo Memberstack**: `data-ms-member="waiting-period-end"`
- **Tipo en Memberstack**: Text (ISO 8601)
- **Descripción**: Fecha de fin del período de carencia de 90 días
- **Cálculo**: Fecha de registro + 90 días

---

## 🔧 Instrucciones de Configuración

### Paso 1: Crear Custom Fields en Memberstack

```
1. Inicia sesión en Memberstack
2. Ve a tu proyecto
3. Settings → Custom Fields
4. Haz clic en "Add Custom Field"
5. Crea cada campo con el nombre exacto (sin "data-ms-member=")
```

### Paso 2: Tipos de Campos

Para cada campo, selecciona el tipo apropiado:

- **Text**: Para todos los campos de texto (nombre, apellidos, CURP, dirección, etc.)
- **Email**: Solo para el campo de email (Memberstack lo maneja automáticamente)
- **Password**: Solo para la contraseña (Memberstack lo maneja automáticamente)

### Paso 3: Verificar Integración

Después de crear los campos:

1. Prueba el formulario de registro
2. Verifica que los datos se guarden en Memberstack
3. Revisa el perfil del usuario en Memberstack para confirmar que todos los custom fields se llenaron correctamente

---

## 📊 Resumen de Campos

**Total de campos de usuario**: 20

- **Campos de texto**: 15
- **Campos nativos de Memberstack**: 2 (email, password)
- **Campos de archivo (URLs)**: 3
- **Campos de metadata**: 2

**Campos adicionales para dashboard de mascotas**: 57
- 19 campos por mascota × 3 mascotas
- 1 campo de total de mascotas

**Gran total**: 77 campos custom en Memberstack

---

## 🐾 Campos de Mascotas (Dashboard)

El dashboard de usuario requiere campos adicionales para gestionar hasta 3 mascotas. Cada mascota tiene su propio conjunto de campos.

### Total de Mascotas

- **Atributo Memberstack**: `data-ms-member="total-pets"`
- **Tipo en Memberstack**: Text
- **Descripción**: Número total de mascotas registradas (1-3)

### Campos por Mascota

Para cada mascota (reemplaza `X` con 1, 2, o 3):

#### Información Básica

- **`pet-X-name`** (Text): Nombre de la mascota
- **`pet-X-last-name`** (Text): Apellido de la mascota
- **`pet-X-type`** (Text): Tipo de mascota (`perro` o `gato`)
- **`pet-X-is-mixed`** (Text): Si es mestiza (`true` o `false`)
- **`pet-X-breed`** (Text): Raza de la mascota
- **`pet-X-breed-size`** (Text): Tamaño (`pequeño`, `mediano`, `grande`, `gigante`)

#### Edad y Validación

- **`pet-X-age`** (Text): Edad en años
- **`pet-X-exceeds-max-age`** (Text): Si excede edad máxima (`true` o `false`)

#### Adopción y Documentos

- **`pet-X-is-adopted`** (Text): Si fue adoptada (`true` o `false`)
- **`pet-X-ruac`** (Text): Código RUAC (si aplica)

#### URLs de Archivos

- **`pet-X-photo-1-url`** (Text): URL de la primera foto en Supabase
- **`pet-X-photo-2-url`** (Text): URL de la segunda foto en Supabase
- **`pet-X-vet-certificate-url`** (Text): URL del certificado veterinario en Supabase

#### Período de Carencia

- **`pet-X-is-original`** (Text): Si es mascota original (`true`) o reemplazo (`false`)
- **`pet-X-waiting-period-days`** (Text): Días de período de carencia (120, 180)
- **`pet-X-waiting-period-end`** (Text): Fecha de fin del período (ISO 8601)
- **`pet-X-registration-date`** (Text): Fecha de registro (ISO 8601)

#### Estado

- **`pet-X-is-active`** (Text): Si está activa (`true`) o reemplazada (`false`)
- **`pet-X-replaced-date`** (Text): Fecha de reemplazo (ISO 8601, si aplica)

### Ejemplo Completo

Para la primera mascota:

```
pet-1-name: "Max"
pet-1-last-name: "González"
pet-1-type: "perro"
pet-1-is-mixed: "false"
pet-1-breed: "Labrador Retriever"
pet-1-breed-size: "grande"
pet-1-age: "3"
pet-1-exceeds-max-age: "false"
pet-1-is-adopted: "true"
pet-1-ruac: "RUAC123456"
pet-1-photo-1-url: "https://supabase.co/storage/..."
pet-1-photo-2-url: "https://supabase.co/storage/..."
pet-1-vet-certificate-url: ""
pet-1-is-original: "true"
pet-1-waiting-period-days: "120"
pet-1-waiting-period-end: "2024-04-15T00:00:00.000Z"
pet-1-registration-date: "2024-01-15T00:00:00.000Z"
pet-1-is-active: "true"
pet-1-replaced-date: ""
```

### Notas Importantes

1. **Todos los campos son de tipo Text** en Memberstack, incluso los booleanos y números
2. **Los booleanos se guardan como strings**: `"true"` o `"false"`
3. **Las fechas se guardan en formato ISO 8601**: `"2024-01-15T00:00:00.000Z"`
4. **Los campos vacíos se guardan como strings vacíos**: `""`
5. **Máximo 3 mascotas**: Solo necesitas crear campos para `pet-1`, `pet-2`, y `pet-3`

---

## 📊 Resumen de Campos

**Total de campos**: 77

- **Campos de usuario**: 20
- **Campos de mascotas**: 57 (19 campos × 3 mascotas)
- **Campo de total**: 1

---

## ⚠️ Notas Importantes

1. **Nombres exactos**: Los nombres de los custom fields en Memberstack deben coincidir exactamente con los valores de `data-ms-member` (sin las comillas)

2. **Archivos**: Los archivos NO se suben a Memberstack. Se suben a Supabase y solo las URLs se guardan en Memberstack

3. **Período de carencia**: El sistema calcula automáticamente 90 días desde la fecha de registro para activar el fondo solidario

4. **Validación**: La validación se hace en el frontend antes de enviar a Memberstack

5. **Seguridad**: Los documentos se almacenan en buckets privados de Supabase para máxima seguridad

---

## 🆘 Troubleshooting

### Error: "Custom field not found"
**Solución**: Verifica que el nombre del campo en Memberstack coincida exactamente con el atributo `data-ms-member`

### Error: "Email already exists"
**Solución**: El correo ya está registrado. El usuario debe usar otro email o recuperar su cuenta

### Los archivos no se suben
**Solución**: Verifica que las credenciales de Supabase estén configuradas correctamente en `.env`

### Los campos de dirección no se auto-llenan
**Solución**: Verifica que la API de Copomex esté funcionando. Prueba manualmente: `https://api.copomex.com/query/info_cp/01000`
