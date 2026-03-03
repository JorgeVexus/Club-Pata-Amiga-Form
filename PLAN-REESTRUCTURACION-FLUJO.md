# Plan de Reestructuración del Flujo de Registro

> **Proyecto:** Pet Membership Form  
> **Fecha:** Febrero 2026  
> **Responsable:** Jorge  
> **Meta de entrega:** 3 días  
> **Objetivo:** Reducir abandono del 15% optimizando el flujo a 4-5 clicks

---

## 1. Resumen Ejecutivo

### Problema Actual
- 10 usuarios iniciaron pero no completaron el registro (día 3)
- 15% de usuarios reportaron problemas de funcionalidad
- SEPOMEX con fallas en auto-completado
- Pérdida de información al navegar hacia atrás
- Campaña publicitaria pausada por cuello de botella

### Solución Propuesta
Inversión del flujo: cobrar primero, pedir datos después. Reducción de campos pre-pago de ~30 a solo 4 (correo, contraseña, tipo, nombre y edad de mascota).

---

## 2. Cambios en el Flujo de Registro

### 2.1 Comparativa de Flujos

| Paso | Flujo Actual | Flujo Nuevo | Momento |
|------|-------------|-------------|---------|
| 1 | Correo y contraseña | Correo y contraseña | Pre-pago |
| 2 | Datos del contratante (~15 campos) | **Datos básicos de mascota (3 campos)** | Pre-pago |
| 3 | Datos de la mascota (~12 campos) | **Selección de plan + Pago** | Pre-pago |
| 4 | Selección de plan | Datos del contratante (~7 campos) | Post-pago |
| 5 | Pago | Datos complementarios de mascota | Post-pago |
| 6 | Factura | Factura (opcional) | Post-pago |

### 2.2 Detalle Pre-Pago (Objetivo: 4-5 clicks)

**Paso 1: Registro de cuenta**
- Correo electrónico
- Contraseña
- Confirmación de correo

**Paso 2: Datos básicos de mascota (solo 3 campos)**
- Tipo: Perro o Gato (selección visual con íconos/imágenes)
- Nombre: Texto libre, sin apellido
- Edad: Número + selector (años/meses), sin límite de 9 años

**Paso 3: Selección de plan y pago**
- Comparativa de planes
- Integración con Stripe
- Franja de beneficios siempre visible

### 2.3 Detalle Post-Pago (Completar en cuenta)

**Paso 4: Datos del contratante**
| Campo | Tipo | Validación | Notas |
|-------|------|------------|-------|
| Nombre | Texto | Requerido | - |
| Apellidos | Texto | Requerido | - |
| Fecha de nacimiento | Date | Mayor de edad | - |
| **Nacionalidad** | **Select** | **Requerido** | **NUEVO - Catálogo países** |
| Teléfono | Tel | 10 dígitos | - |
| Correo | Email | Auto-rellenado del paso 1 | Editable |
| CP | Texto | 5 dígitos | Auto-completado SEPOMEX |
| Estado | Texto | Auto (SEPOMEX) | Deshabilitado |
| Municipio/Alcaldía | Texto | Auto (SEPOMEX) | Deshabilitado |
| Colonia | Select | Catálogo SEPOMEX | Desplegable |
| Calle y número | Texto | Requerido | - |
| CURP | Texto | 18 caracteres | **Único documento requerido** |

**Paso 5: Datos complementarios de mascota**
| Campo | Tipo | Opciones | Notas |
|-------|------|----------|-------|
| Sexo | Select | Macho, Hembra | - |
| Raza | Select | Catálogo por tipo | - |
| **Color de pelo** | **Select** | **Catálogo** | **NUEVO** |
| **Color de nariz** | **Select** | **Catálogo** | **NUEVO** |
| **Color de ojos** | **Select** | **Catálogo** | **NUEVO** |
| Fotografía 1 | File | JPG/PNG, max 5MB | Obligatoria (15 días) |
| Fotografías 2-4 | File | JPG/PNG, max 5MB | Opcionales |
| Esterilizado | Select | Sí, No | Para raza mestizo |
| Historia/Adopción | Textarea | Opcional | Solo si mestizo |

**Condiciones especiales:**
- Mascotas 10+ años: No bloquear. Solicitar certificado veterinario dentro de la cuenta
- Raza mestizo: Mostrar preguntas de adopción/historia dentro de la cuenta

**Paso 6: Facturación (opcional)**
- RFC
- Razón social
- Dirección fiscal
- Uso CFDI
- Método de pago

---

## 3. Cambios en Base de Datos (Supabase)

### 3.1 Nuevas Columnas en Tabla `users`

```sql
-- Nuevos campos para el contratante
ALTER TABLE users ADD COLUMN nationality VARCHAR(100);
ALTER TABLE users ADD COLUMN nationality_code VARCHAR(3); -- ISO 3166-1 alpha-3

-- Cambios en dirección (verificación de SEPOMEX)
ALTER TABLE users ADD COLUMN sepomex_validated BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN sepomex_last_query TIMESTAMP;
```

### 3.2 Nuevas Columnas en Tabla `pets`

```sql
-- Nuevos campos de color
ALTER TABLE pets ADD COLUMN coat_color VARCHAR(100);
ALTER TABLE pets ADD COLUMN coat_color_code VARCHAR(50);
ALTER TABLE pets ADD COLUMN nose_color VARCHAR(100);
ALTER TABLE pets ADD COLUMN nose_color_code VARCHAR(50);
ALTER TABLE pets ADD COLUMN eye_color VARCHAR(100);
ALTER TABLE pets ADD COLUMN eye_color_code VARCHAR(50);

-- Campos modificados
ALTER TABLE pets ADD COLUMN age_unit VARCHAR(10) DEFAULT 'years'; -- 'years' o 'months'
ALTER TABLE pets ADD COLUMN photos_uploaded BOOLEAN DEFAULT false;
ALTER TABLE pets ADD COLUMN photos_upload_deadline TIMESTAMP;
ALTER TABLE pets ADD COLUMN is_senior BOOLEAN DEFAULT false; -- 10+ años
ALTER TABLE pets ADD COLUMN vet_certificate_required BOOLEAN DEFAULT false;
ALTER TABLE pets ADD COLUMN vet_certificate_uploaded BOOLEAN DEFAULT false;

-- Para mestizos
ALTER TABLE pets ADD COLUMN is_adopted BOOLEAN;
ALTER TABLE pets ADD COLUMN adoption_story TEXT;
ALTER TABLE pets ADD COLUMN is_mixed_breed BOOLEAN DEFAULT false;

-- Estado de fotos
ALTER TABLE pets ADD COLUMN photos_count INTEGER DEFAULT 0;
ALTER TABLE pets ADD COLUMN primary_photo_url TEXT;
```

### 3.3 Nuevas Tablas de Catálogos

```sql
-- Catálogo de nacionalidades
CREATE TABLE catalog_nationalities (
    id SERIAL PRIMARY KEY,
    code VARCHAR(3) UNIQUE NOT NULL, -- ISO 3166-1 alpha-3
    name_es VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    phone_code VARCHAR(10),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Catálogo de colores de pelo (por tipo de mascota)
CREATE TABLE catalog_coat_colors (
    id SERIAL PRIMARY KEY,
    pet_type VARCHAR(20) NOT NULL, -- 'dog' o 'cat'
    name VARCHAR(100) NOT NULL,
    hex_code VARCHAR(7),
    is_common BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true
);

-- Catálogo de colores de nariz
CREATE TABLE catalog_nose_colors (
    id SERIAL PRIMARY KEY,
    pet_type VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    hex_code VARCHAR(7),
    is_active BOOLEAN DEFAULT true
);

-- Catálogo de colores de ojos
CREATE TABLE catalog_eye_colors (
    id SERIAL PRIMARY KEY,
    pet_type VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    hex_code VARCHAR(7),
    is_active BOOLEAN DEFAULT true
);

-- Catálogo de colonias (cache de SEPOMEX)
CREATE TABLE catalog_sepomex (
    id SERIAL PRIMARY KEY,
    cp VARCHAR(5) NOT NULL,
    colony VARCHAR(200) NOT NULL,
    municipality VARCHAR(200) NOT NULL,
    state VARCHAR(100) NOT NULL,
    state_code VARCHAR(10),
    city VARCHAR(200),
    last_updated TIMESTAMP DEFAULT NOW(),
    UNIQUE(cp, colony)
);

CREATE INDEX idx_sepomex_cp ON catalog_sepomex(cp);
```

### 3.4 Tabla de Seguimiento de Registro

```sql
-- Tracking del progreso del registro
CREATE TABLE registration_progress (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    step_completed INTEGER DEFAULT 0,
    pre_payment_completed BOOLEAN DEFAULT false,
    payment_completed BOOLEAN DEFAULT false,
    post_payment_completed BOOLEAN DEFAULT false,
    contract_data_completed BOOLEAN DEFAULT false,
    pet_data_completed BOOLEAN DEFAULT false,
    invoice_completed BOOLEAN DEFAULT false,
    abandoned_at TIMESTAMP,
    last_activity TIMESTAMP DEFAULT NOW()
);
```

---

## 4. Cambios en Memberstack

### 4.1 Campos Custom a Modificar

**Nuevos campos:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `nationality` | Text | Nacionalidad del usuario |
| `nationality-code` | Text | Código ISO de país |
| `coat-color` | Text | Color de pelo mascota 1 |
| `nose-color` | Text | Color de nariz mascota 1 |
| `eye-color` | Text | Color de ojos mascota 1 |
| `pet-age-unit` | Text | "years" o "months" |
| `registration-step` | Number | Paso actual del registro |
| `pre-payment-completed` | Checkbox | Completó pre-pago |
| `payment-status` | Text | pending, completed, failed |

**Campos a eliminar (dejar de usar):**
- `ine-front-url`
- `ine-back-url`
- `pet-age-restriction` (lógica de 9 años)

**Campos a modificar:**
- `pet-age`: Ahora acepta cualquier número
- `pet-photo-url`: Ya no es obligatorio inicialmente

### 4.2 Estados de Aprobación

```
pending → pre_payment_completed → payment_completed → 
contract_data_pending → pet_data_pending → completed
```

---

## 5. Corrección de SEPOMEX

### 5.1 Problemas Identificados
- Colonia no se autocompleta correctamente
- Municipio y estado no se rellenan automáticamente
- Pérdida de datos al regresar en el formulario
- Timeout en consultas

### 5.2 Soluciones

**Backend:**
- Implementar cache de consultas SEPOMEX en `catalog_sepomex`
- Crear endpoint propio que consulte cache primero, SEPOMEX después
- Fallback a datos previos si la API falla

**Frontend:**
- Guardar datos de dirección en localStorage mientras dure el registro
- Campos de estado/municipio deshabilitados (solo lectura) una vez consultado CP
- Selector de colonia con búsqueda (no input libre)
- Indicador de "Consultando..." durante petición

**Endpoint propuesto:**
```
GET /api/sepomex/:cp
Response: {
  cp: "01000",
  state: "Ciudad de México",
  municipality: "Cuauhtémoc",
  colonies: ["San Rafael", "Santa Maria la Ribera", ...]
}
```

---

## 6. Cambios en Frontend

### 6.1 Nuevas Páginas/Rutas

```
/registro/paso-1-cuenta         → Correo y contraseña
/registro/paso-2-mascota        → Datos básicos mascota (3 campos)
/registro/paso-3-plan           → Selección de plan
/registro/paso-3-plan/pago      → Checkout Stripe
/registro/completar-perfil      → Datos contratante (post-pago)
/registro/completar-mascota     → Datos complementarios mascota
/registro/factura               → Facturación (opcional)
/registro/confirmacion          → Éxito y redirección a cuenta
```

### 6.2 Componentes Nuevos

**Formularios:**
- `PetBasicInfoForm` - Solo tipo, nombre, edad
- `NationalitySelect` - Selector de nacionalidad con banderas
- `AgeInput` - Input numérico + toggle años/meses
- `PetTypeSelector` - Cards visuales perro/gato
- `SEPOMEXAddressForm` - CP + autocompletado
- `CoatColorSelector` - Selector de color de pelo
- `NoseColorSelector` - Selector de color de nariz
- `EyeColorSelector` - Selector de color de ojos
- `PhotoUploader` - Subida con deadline de 15 días
- `LegalDocumentsCheckbox` - Un solo checkbox consolidado

**UI:**
- `BenefitsBanner` - Franja de beneficios sticky
- `RegistrationProgress` - Indicador de pasos
- `PostPaymentGate` - Bloqueo de funciones hasta completar datos

### 6.3 Modificaciones a Componentes Existentes

**RegistrationForm:**
- Separar en 2 formularios: Pre-pago y Post-pago
- Eliminar campos de INE
- Eliminar validación de 9 años
- Cambiar layout a una columna

**PetRegistrationForm:**
- Dividir en "básico" y "complementario"
- Agregar campos de color (pelo, nariz, ojos)
- Hacer fotos opcionales inicialmente
- Agregar lógica de 15 días para fotos

**PlanSelection:**
- Mover antes del pago completo de datos
- Agregar resumen de mascota básico

### 6.4 Validaciones

**Pre-pago:**
- Email: válido y no existente
- Contraseña: mínimo 8 caracteres
- Tipo mascota: perro o gato
- Nombre: requerido, máx 50 caracteres
- Edad: número positivo, máx 25 años / 300 meses

**Post-pago:**
- CURP: formato válido (18 caracteres)
- CP: 5 dígitos
- Nacionalidad: seleccionada de catálogo
- Teléfono: 10 dígitos
- Mayor de edad (18+)

---

## 7. Cambios en Backend (API)

### 7.1 Nuevos Endpoints

```typescript
// SEPOMEX
GET /api/sepomex/:cp

// Registro progresivo
POST /api/registration/step-1  // Crea usuario, retorna token
POST /api/registration/step-2  // Guarda datos básicos mascota
POST /api/registration/step-3  // Crea orden de pago Stripe
POST /api/registration/complete-contract  // Post-pago: datos contratante
POST /api/registration/complete-pet       // Post-pago: datos mascota

// Catálogos
GET /api/catalogs/nationalities
GET /api/catalogs/coat-colors?petType=dog|cat
GET /api/catalogs/nose-colors?petType=dog|cat
GET /api/catalogs/eye-colors?petType=dog|cat
GET /api/catalogs/breeds?petType=dog|cat

// Fotos (con deadline)
POST /api/pets/:id/photos
GET /api/pets/:id/photos-status  // Verifica si necesita subir fotos
POST /api/pets/:id/request-extension  // Extensión de plazo (manual)

// Admin
GET /api/admin/pending-photos  // Lista mascotas sin fotos pasados 15 días
```

### 7.2 Modificaciones a Endpoints Existentes

**POST /api/users/register:**
- Ya no requiere todos los datos
- Solo crea usuario con email y estado "pending_payment"

**POST /api/pets/register:**
- Dividir en dos fases
- Fase 1: Solo básicos (tipo, nombre, edad)
- Fase 2: Complementarios (colores, fotos, etc.)

### 7.3 Servicios a Modificar

**MemberstackService:**
- Agregar métodos para campos nuevos (nacionalidad, colores)
- Modificar flujo de estados de registro

**SupabaseService:**
- Agregar queries para nuevos campos
- Implementar cache de SEPOMEX

**StripeService:**
- Crear orden de pago con metadata mínima (tipo/nombre mascota)
- Webhook para activar "post-payment" al completar pago

**EmailService:**
- Nuevo template: "Completa tu registro" (post-pago)
- Nuevo template: "Recuerda subir fotos de tu mascota" (recordatorio día 7 y 13)
- Nuevo template: "Fotos pendientes - último día" (día 14)

---

## 8. Catálogos Requeridos (Entrega Lucero)

### 8.1 Nacionalidades
Lista de países con:
- Nombre en español
- Código ISO 3166-1 alpha-3
- Priorizar: México, Estados Unidos, Guatemala, Colombia, Venezuela, Argentina, España, etc.

### 8.2 Colores de Pelo

**Perros:**
- Negro
- Blanco
- Café/Marrón
- Rubio/Dorado
- Gris
- Rojo/Fire
- Crema
- Plateado
- Manchado (blanco con negro)
- Tricolor
- Merle
- Atigrado
- Otro

**Gatos:**
- Negro
- Blanco
- Gris/Plata
- Naranja/Rojo
- Crema/Beige
- Café/Marrón
- Tricolor (Calicó)
- Carey (Tortuga)
- Tabby (Atigrado)
- Smoke
- Bicolor
- Otro

### 8.3 Colores de Nariz

**Perros:**
- Negra
- Rosa
- Marrón/Liver
- Azul/Gris
- Manzana (rosada con manchas)
- Butterfly (mitad mitad)
- Dudley (falta de pigmento)

**Gatos:**
- Rosa
- Negro
- Marrón
- Naranja
- Coral
- Multicolor

### 8.4 Colores de Ojos

**Perros:**
- Marrón oscuro
- Marrón claro/Ámbar
- Avellana
- Verde
- Azul
- Heterocromía (uno de cada color)
- Gris

**Gatos:**
- Amarillo/Dorado
- Verde
- Azul
- Cobre/Naranja
- Heterocromía
- Avellana
- Dicromía (dos colores en un ojo)

---

## 9. Cronograma de Implementación (3 días)

### Día 1 - Martes

| Hora | Tarea | Responsable |
|------|-------|-------------|
| 8:00 - 9:00 | Setup y revisión de cambios | Jorge |
| 9:00 - 10:00 | Modificaciones en base de datos (migraciones) | Jorge |
| 10:00 - 12:00 | Corrección de SEPOMEX + endpoint propio | Jorge |
| 12:00 - 13:00 | Almuerzo | - |
| 13:00 - 15:00 | Creación de componentes básicos (PetTypeSelector, AgeInput) | Jorge |
| 15:00 - 17:00 | Reestructuración de páginas de registro (paso 1, 2, 3) | Jorge |
| 17:00 - 18:00 | Integración con Stripe en nuevo flujo | Jorge |
| 18:00 - 19:00 | Pruebas del flujo pre-pago | Jorge |

**Entregable del día:** Flujo pre-pago funcional (hasta pago con Stripe)

### Día 2 - Miércoles

| Hora | Tarea | Responsable |
|------|-------|-------------|
| 8:00 - 9:00 | Revisión de pruebas del día 1 | Jorge + Lucero |
| 9:00 - 10:00 | Creación de catálogos en BD (con datos de ejemplo) | Jorge |
| 10:00 - 12:00 | Componentes post-pago (formulario contratante) | Jorge |
| 12:00 - 13:00 | Almuerzo | - |
| 13:00 - 14:00 | Campo de nacionalidad + selector | Jorge |
| 14:00 - 16:00 | Formulario complementario de mascota (colores, fotos) | Jorge |
| 16:00 - 17:00 | Sistema de 15 días para fotos (recordatorios) | Jorge |
| 17:00 - 18:00 | Dashboard de usuario (modo "incompleto") | Jorge |
| 18:00 - 19:00 | Integración Memberstack con nuevos campos | Jorge |

**Entregable del día:** Flujo post-pago completo, sistema de fotos con deadline

### Día 3 - Jueves

| Hora | Tarea | Responsable |
|------|-------|-------------|
| 8:00 - 9:00 | Revisión de catálogos finales (entrega Lucero) | Lucero |
| 9:00 - 10:00 | Carga de catálogos de colores y nacionalidades | Jorge |
| 10:00 - 12:00 | Pruebas completas end-to-end | Jorge |
| 12:00 - 13:00 | Almuerzo | - |
| 13:00 - 14:00 | Corrección de bugs encontrados | Jorge |
| 14:00 - 15:00 | Testing en móvil (responsivo) | Jorge + Ale/José |
| 15:00 - 16:00 | Pruebas con datos reales (CP, CURP) | Jorge |
| 16:00 - 17:00 | Documentación de cambios | Jorge |
| 17:00 - 18:00 | Deploy a ambiente de pruebas | Jorge |
| 18:00 - 19:00 | Revisión final con Lucero | Todo el equipo |

**Entregable del día:** Sistema completo en ambiente de pruebas listo para producción

---

## 10. Plan de Pruebas

### 10.1 Casos de Prueba Obligatorios

**Flujo básico:**
1. Registro completo con datos válidos
2. Registro con mascota de 12 años (no debe bloquear)
3. Registro con raza mestizo (debe mostrar preguntas de adopción después)
4. Registro sin subir fotos (debe permitir y recordar después)
5. Pago con tarjeta declinada (debe manejar error gracefully)

**SEPOMEX:**
1. CP válido (01000) - debe autocompletar todo
2. CP inválido - debe mostrar error
3. Cambio de CP después de llenar datos - debe limpiar campos
4. Pérdida de conexión durante consulta - debe mostrar retry

**Campos nuevos:**
1. Selección de nacionalidad (probar varios países)
2. Selector de colores (pelo, nariz, ojos)
3. Toggle años/meses en edad
4. Subida de fotos (probar formatos, tamaños)
5. Deadline de 15 días (simular paso del tiempo)

**Edge cases:**
1. Usuario abandona en paso 2, regresa después
2. Usuario paga pero no completa post-pago (recordatorios)
3. Doble clic en botón de pago
4. Navegación con botones del navegador (atrás/adelante)

### 10.2 Usuarios de Prueba

| CP | Estado | Colonias |
|----|--------|----------|
| 01000 | CDMX | San Rafael, Santa María la Ribera |
| 44100 | Jalisco | Centro, El Retiro |
| 64000 | Nuevo León | Centro, Obispado |
| 72000 | Puebla | Centro, Analco |
| 83000 | Sonora | Centro, Villa de Seris |

---

## 11. Configuración de Memberstack

### 11.1 Campos Custom a Configurar

```json
{
  "fields": [
    {
      "name": "nationality",
      "type": "text",
      "label": "Nacionalidad",
      "required": false
    },
    {
      "name": "nationality-code",
      "type": "text",
      "label": "Código de País",
      "required": false
    },
    {
      "name": "registration-step",
      "type": "number",
      "label": "Paso de Registro",
      "default": 0
    },
    {
      "name": "pre-payment-completed",
      "type": "checkbox",
      "label": "Pre-pago completado",
      "default": false
    },
    {
      "name": "post-payment-completed",
      "type": "checkbox",
      "label": "Post-pago completado",
      "default": false
    },
    {
      "name": "coat-color",
      "type": "text",
      "label": "Color de Pelo",
      "required": false
    },
    {
      "name": "nose-color",
      "type": "text",
      "label": "Color de Nariz",
      "required": false
    },
    {
      "name": "eye-color",
      "type": "text",
      "label": "Color de Ojos",
      "required": false
    },
    {
      "name": "pet-age-unit",
      "type": "text",
      "label": "Unidad de Edad",
      "default": "years"
    },
    {
      "name": "photos-deadline",
      "type": "text",
      "label": "Fecha límite fotos",
      "required": false
    }
  ]
}
```

### 11.2 Webhooks a Configurar

- `user.created` → Inicializar progreso de registro
- `user.updated` → Sincronizar con Supabase

---

## 12. Variables de Entorno

```env
# Nuevas o modificadas
NEXT_PUBLIC_SEPOMEX_API_URL=https://api-sepomex.datos.gob.mx/v1/
SEPOMEX_CACHE_TTL=86400

# Stripe - configurar webhook para post-payment
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_BASIC=price_...
STRIPE_PRICE_ID_PREMIUM=price_...

# Recordatorios fotos (días)
PHOTO_REMINDER_DAYS=7,13,14
PHOTO_DEADLINE_DAYS=15

# Catálogos
NEXT_PUBLIC_DEFAULT_NATIONALITY=México
```

---

## 13. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| SEPOMEX sigue fallando | Media | Alto | Implementar cache + fallback manual |
| Usuarios confundidos por nuevo flujo | Media | Medio | Tooltips explicativos + video tutorial |
| Pérdida de datos al cambiar flujo | Baja | Alto | Backup antes de deploy + rollback plan |
| Catálogos de colores incompletos | Alta | Medio | Incluir opción "Otro" + campo libre |
| Stripe rechaza pagos con pocos datos | Baja | Alto | Probar en modo test antes |
| Deadline de 15 días no se respeta | Baja | Medio | Notificaciones automáticas + admin panel |

---

## 14. Checklist Pre-Deploy

- [ ] Todas las migraciones de BD ejecutadas
- [ ] Catálogos de colores cargados
- [ ] Catálogo de nacionalidades cargado
- [ ] Campos de Memberstack configurados
- [ ] Webhooks de Stripe configurados
- [ ] Variables de entorno actualizadas
- [ ] Pruebas end-to-end pasadas
- [ ] Pruebas en móvil pasadas
- [ ] Código revisado (self-review)
- [ ] Backup de base de datos actual
- [ ] Plan de rollback definido
- [ ] Lucero aprobó cambios en ambiente de pruebas
- [ ] Google Analytics configurado para nuevo flujo

---

## 15. Post-Deploy (Monitoreo)

### Métricas a Seguir

| Métrica | Valor Actual | Meta | Frecuencia |
|---------|-------------|------|------------|
| Tasa de abandono | 15% | < 5% | Diaria |
| Clicks hasta pago | ~12 | 4-5 | Semanal |
| Tiempo en formulario | ~8 min | < 3 min | Diaria |
| Errores SEPOMEX | Frecuentes | 0 | Diaria |
| Completitud post-pago | N/A | > 90% | Semanal |

### Alertas Configurar

- Más de 3 errores de SEPOMEX por hora
- Tasa de abandono > 10% en un día
- Tiempo promedio de registro > 5 minutos
- Fotos pendientes después de 15 días > 20%

---

## 16. Documentación para Usuarios

### Mensajes al Usuario

**Durante registro:**
- "Solo te tomará 2 minutos completar tu registro"
- "Puedes subir las fotos de tu mascota después"
- "Tu información está segura con nosotros"

**Post-pago (email):**
- "¡Gracias por unirte! Completa tu perfil para activar todos los beneficios"
- "Recuerda subir fotos de tu mascota en los próximos 15 días"
- "Faltan X días para subir las fotos de tu mascota"

---

## Anexos

### A. Query para crear catálogo de nacionalidades
```sql
INSERT INTO catalog_nationalities (code, name_es, name_en, phone_code) VALUES
('MEX', 'México', 'Mexico', '+52'),
('USA', 'Estados Unidos', 'United States', '+1'),
('GTM', 'Guatemala', 'Guatemala', '+502'),
('COL', 'Colombia', 'Colombia', '+57'),
('VEN', 'Venezuela', 'Venezuela', '+58'),
('ARG', 'Argentina', 'Argentina', '+54'),
('ESP', 'España', 'Spain', '+34'),
('CHL', 'Chile', 'Chile', '+56'),
('PER', 'Perú', 'Peru', '+51'),
('CUB', 'Cuba', 'Cuba', '+53');
```

### B. Estructura de respuesta SEPOMEX
```json
{
  "error": false,
  "code_error": 0,
  "error_message": null,
  "response": {
    "cp": "01000",
    "estado": "Ciudad de México",
    "municipio": "Cuauhtémoc",
    "colonia": ["San Rafael", "Santa María la Ribera"]
  }
}
```

### C. Contactos
- **Jorge (Desarrollo):** jorge@example.com
- **Lucero (Producto):** lucero@example.com
- **Ale/José (Diseño):** design@example.com

---

**Documento versión:** 1.0  
**Última actualización:** 26 de Febrero 2026  
**Próxima revisión:** Post-implementación (día 4)
