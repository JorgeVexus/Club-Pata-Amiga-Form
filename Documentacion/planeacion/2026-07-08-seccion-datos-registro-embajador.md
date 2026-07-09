# Plan: Sección "Mis Datos de Registro" en Widget Embajador (Vista Aprobado)

**Fecha:** 2026-07-08  
**Proyecto:** pet-membership-form  
**Autor:** Agent (Hermes)  
**Estado:** Plan — esperando aprobación del usuario antes de ejecutar

---

## Problema

En la vista **aprobado** del `ambassador-widget.js`, el embajador puede ver:
- Código de referido
- Ganancias y estadísticas
- Referidos
- Material digital

Pero **no hay ningún lado donde pueda ver los datos que él mismo ingresó en su registro** (nombre completo, CURP, fecha de nacimiento, ciudad de nacimiento, sexo, celular, email, redes sociales, motivación, etc.).

La única sección de perfil que existe solo muestra:
- Nombre (first + paternal)
- RFC
- Badges de redes sociales (sin los links)
- Foto

---

## Campos que el embajador llena en el registro

Del componente `SimplifiedStep.tsx` (`SimplifiedAmbassadorData`):

| Campo | Label en formulario |
|---|---|
| `first_name` | Nombre(s) |
| `paternal_surname` | Apellido paterno |
| `maternal_surname` | Apellido materno (opcional) |
| `birth_date` | Fecha de nacimiento |
| `birth_city` | Ciudad de nacimiento |
| `gender` | Sexo (Hombre / Mujer / No especificar) |
| `curp` | CURP |
| `email` | Correo |
| `phone` | Celular |
| `facebook` | Facebook |
| `instagram` | Instagram |
| `tiktok` | TikTok |
| `motivation` | Motivación |

> NOTA: La contraseña **no** se mostrará por seguridad.

---

## Campos disponibles actualmente en el API

**Endpoint:** `GET /api/ambassadors/by-memberstack?memberstackId=mem_xxx`

Campos que actualmente retorna la consulta Supabase:
```
id, first_name, paternal_surname, email, referral_code, referral_code_status,
referral_code_selected_at, status, total_earnings, pending_payout,
commission_percentage, payment_method, bank_name, clabe, rfc, facebook,
instagram, tiktok, motivation, profile_photo_url, created_at
```

**Campos faltantes en el API:**
- `maternal_surname`
- `birth_date`
- `birth_city`
- `gender`
- `curp`
- `phone`
- `postal_code`
- `state`
- `city`
- `neighborhood`
- `address`
- `ine_front_url`
- `ine_back_url`

---

## Plan de Implementación

### Paso 1 — Ampliar SELECT del API `by-memberstack`

**Archivo:** `src/app/api/ambassadors/by-memberstack/route.ts`

Agregar los campos faltantes al `.select()`:

```sql
SELECT id, first_name, paternal_surname, maternal_surname, birth_date, birth_city,
       gender, curp, phone, email, postal_code, state, city, neighborhood, address,
       ine_front_url, ine_back_url,
       referral_code, referral_code_status, referral_code_selected_at, status,
       total_earnings, pending_payout, commission_percentage, payment_method,
       bank_name, clabe, rfc, facebook, instagram, tiktok, motivation,
       profile_photo_url, rejection_reason, approved_at, created_at
```

Esto asegura que el widget tenga acceso a todos los datos de registro.

### Paso 2 — Agregar CSS para la nueva sección

**Archivo:** `public/widgets/ambassador-widget.js` (dentro de la constante `STYLES`)

Agregar estilos consistentes con el widget actual:

- `.amb-registration-data-section` — contenedor principal de la sección
- `.amb-registration-data-card` — card blanca con border-radius 24px, sombra igual que otras cards
- `.amb-registration-data-title` — título Fraiche 50px, línea con `#15BEB2` (turquesa)
- `.amb-registration-data-grid` — grid 2 columnas para los field items
- `.amb-registration-data-item` — item individual etiqueta + valor
- `.amb-data-label` — label pequeño uppercase gris (#888)
- `.amb-data-value` — valor Outfit 16px, color #333
- `.amb-data-full-width` — item que ocupa las 2 columnas (para motivación)
- Media query ≤900px: grid pasa a 1 columna

**Tokens de diseño a respetar:**
- Card: `background: white; border-radius: 24px; padding: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);`
- Título: `font-family: 'Fraiche', sans-serif; font-size: 50px; font-weight: 600; color: #000;`
- Subtítulo/label: `font-family: 'Outfit', sans-serif; font-size: 18px; color: #9B9B9B; font-weight: 700;`
- Color acento: `#15BEB2` (turquesa Pata Amiga)
- Botón accent: `#FE8F15` (naranja) / Secundario: `#00BBB4` / Verde: `#9FD406`

### Paso 3 — Modificar `renderApproved()` para inyectar la nueva sección

**Ubicación en el template:** Después de la sección `<!-- Mi Perfil -->` (actualmente línea ~2593) y antes de `<!-- Estado de Referidos -->` (línea ~2595).

Nueva sección a insertar:

```html
<!-- Mis Datos de Registro -->
<section class="amb-registration-data-section">
    <div class="amb-registration-data-card">
        <h2 class="amb-registration-data-title">mis datos de registro</h2>
        <p class="amb-registration-data-subtitle">Información que registraste como embajador</p>
        <div class="amb-registration-data-grid">
            <div class="amb-registration-data-item">
                <span class="amb-data-label">Nombre completo</span>
                <span class="amb-data-value">${first_name} ${paternal_surname} ${maternal_surname || ''}</span>
            </div>
            <div class="amb-registration-data-item">
                <span class="amb-data-label">Correo</span>
                <span class="amb-data-value">${email}</span>
            </div>
            <div class="amb-registration-data-item">
                <span class="amb-data-label">Celular</span>
                <span class="amb-data-value">${formatPhone(phone)}</span>
            </div>
            <div class="amb-registration-data-item">
                <span class="amb-data-label">CURP</span>
                <span class="amb-data-value">${curp}</span>
            </div>
            <div class="amb-registration-data-item">
                <span class="amb-data-label">Fecha de nacimiento</span>
                <span class="amb-data-value">${formatDate(birth_date)}</span>
            </div>
            <div class="amb-registration-data-item">
                <span class="amb-data-label">Ciudad de nacimiento</span>
                <span class="amb-data-value">${birth_city || '—'}</span>
            </div>
            <div class="amb-registration-data-item">
                <span class="amb-data-label">Sexo</span>
                <span class="amb-data-value">${genderLabel(gender)}</span>
            </div>
            <!-- Dirección si existe -->
            ${address ? `
            <div class="amb-registration-data-item amb-data-full-width">
                <span class="amb-data-label">Dirección</span>
                <span class="amb-data-value">${address}, ${neighborhood || ''}, ${city || ''}, ${state || ''}, CP ${postal_code || '—'}</span>
            </div>
            ` : ''}
            <!-- Redes sociales -->
            ${hasAnySocial ? `
            <div class="amb-registration-data-item">
                <span class="amb-data-label">Redes sociales</span>
                <span class="amb-data-value">
                    ${facebook ? `<a href="${facebook}" target="_blank">Facebook</a>` : ''}
                    ${instagram ? ` · <a href="${instagram}" target="_blank">Instagram</a>` : ''}
                    ${tiktok ? ` · <a href="${tiktok}" target="_blank">TikTok</a>` : ''}
                </span>
            </div>
            ` : ''}
            <!-- Motivación -->
            ${motivation ? `
            <div class="amb-registration-data-item amb-data-full-width">
                <span class="amb-data-label">Por qué quiero ser embajador</span>
                <span class="amb-data-value">${motivation}</span>
            </div>
            ` : ''}
        </div>
        <button class="amb-btn-bank" onclick="window.editAmbassadorProfile()" style="margin-top: 20px;">
            Editar información
        </button>
    </div>
</section>
```

**Funciones auxiliares a agregar en el objeto de helpers del widget:**

```javascript
function formatDate(dateString) {
    if (!dateString) return '';
    const d = new Date(dateString + 'T00:00:00');
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatPhone(phone) {
    if (!phone) return '—';
    const cleaned = String(phone).replace(/\D/g, '');
    if (cleaned.length === 10) {
        return cleaned.slice(0, 3) + ' ' + cleaned.slice(3, 6) + ' ' + cleaned.slice(6);
    }
    return phone;
}

const GENDER_LABELS = { male: 'Hombre', female: 'Mujer', not_specified: 'No especificar' };
function genderLabel(gender) {
    return GENDER_LABELS[gender] || gender || '—';
}
```

### Paso 4 — Verificaciones

1. `npm run build` — verificar que el widget se compile sin errores
2. `npm run lint` — verificar estilo del API
3. Verificar que al refrescar la página en modo aprobado, la nueva sección aparece con todos los datos
4. Verificar responsive en ≤768px (grid pasa a 1 columna)

---

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/app/api/ambassadors/by-memberstack/route.ts` | Ampliar SELECT con campos de registro |
| `public/widgets/ambassador-widget.js` | 1) Agregar CSS de la sección, 2) Agregar helpers `formatDate/formatPhone/genderLabel`, 3) Modificar `renderApproved()` |

---

## Consideraciones

- No se modifica lógica de negocio, solo lectura de datos y visualización.
- Si un campo es null/undefined, se muestra `—`.
- La contraseña jamás se expone.
- Los links de Facebook/Instagram/TikTok se abren en nueva pestaña (`target="_blank"`).
- Estilo 100% coherente con cards existentes (border-radius, sombras, tipografía Fraiche/Outfit, colores).

---

## Próximo paso

Esperar aprobación del usuario. Al tener luz verde, proceder con la implementación completa en los 2 archivos indicados, y luego correr verificación build/lint antes de commit.
