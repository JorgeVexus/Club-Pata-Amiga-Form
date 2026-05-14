# Plan de Implementación: Sistema de Cancelación de Membresía Pata Amiga

**Fecha:** 14 de mayo de 2026
** Autor:** Hermes Agent
**Estado:** En planeación

---

## 📋 Visión General

Implementar un flujo completo de cancelación de membresía para usuarios finales, que incluye:
- Modales de confirmación con términos y condiciones, diseñados con el sistema visual de Pata Amiga
- Recolección de razones de cancelación (motivo + comentarios opcionales)
- Cálculo automático de la fecha de finalización de la suscripción basada en Stripe
- Mensaje de despedida mostrando la fecha de respaldo hasta cubierto el período pagado
- Almacenamiento de datos de cancelación en Supabase para análisis y estadísticas
- Dashboard administrativo para visualizar y analizar membresías canceladas

---

## Requisitos No Negociables

1. **No usar diálogos nativos del navegador**: Queda prohibido usar `alert()`, `confirm()` o `prompt()` en el flujo de cancelación. Todos los mensajes de confirmación, error, éxito, términos y despedida deben mostrarse con modales HTML/CSS del estilo Pata Amiga ya usado en el widget: tipografía Fraiche/Outfit, botones con borde negro, paleta turquesa/naranja/rojo y radios redondeados.
2. **No borrar usuarios de la base de datos**: Cancelar membresía no significa eliminar cuenta ni registro. El usuario debe permanecer en `users`, conservar historial, documentos y relación con mascotas. La API solo debe marcar estado de membresía/cuenta como `cancelled`, guardar auditoría en `membership_cancellations` y cancelar la suscripción en Stripe.
3. **Separar semántica de cuenta vs membresía**: Aunque el endpoint existente sea `/api/user/deactivate`, la implementación debe tratarlo como cancelación de membresía, no como eliminación o desactivación irreversible de identidad. Si se crea endpoint nuevo, preferir `/api/user/cancel-membership`.

---

## 🎯 Objetivos

1. **用户体验**: Proceso de cancelación claro, transparente y con retroalimentación útil
2. **Cumplimiento legal**: Mostrar términos y condiciones, informar sobre no reembolsos
3. **Data-driven**: Capturar razones de cancelación para mejorar el servicio
4. **Admin visibility**: Dashboard con estadísticas y detalles de cancelaciones
5. **Stripe Integration**: Calcula días restantes y fecha de finalización real de la suscripción

---

## 📊 Flujo de Usuario Actual (Estado Actual)

**Widget:** `public/widgets/user-profile-widget.js`
- Sección 2 (línea 265-310): muestra información de membresía
- Botón "Cancelar membresía" (línea 308): `id="ppa-cancel-btn"`
- `handleCancel()` (línea 416-439): Solo muestra 2 `confirm()` y llama a `/api/user/deactivate` sin capturar motivo

**API:** `src/app/api/user/deactivate/route.ts`
- Cancela suscripciones en Stripe
- Actualiza `users.approval_status = 'cancelled'`
- NO guarda motivo, fecha de finalización, ni comentarios
- NO debe borrar el usuario de Supabase ni de Memberstack; solo cancelar membresía y actualizar estado

**Dashboard Admin:** `src/components/Admin/MemberDetailModal.tsx` y `AdminDashboard.tsx`
- No hay sección para ver membresías canceladas
- No hay estadísticas de cancelación

---

## ✨ Nuevo Flujo de Cancelación (Propuesto)

```
[Usuario en widget de perfil]
      ↓
Click en "Cancelar membresía"
      ↓
┌─────────────────────────────────────────┐
│  Modal 1: Confirmación Inicial          │
│  "Estás por proceder a la cancelación   │
│   de tu membresía Pata Amiga y con ello │
│   despedirte de la manada. Recuerda que │
│   no hay reembolsos de acuerdo con los  │
│   términos y condiciones."              │
│                                         │
│  [Link: Términos y Condiciones]         │
│                                         │
│  "¿Deseas continuar?"                   │
│  [Sí, deseo continuar] [Cancelar]       │
└─────────────────────────────────────────┘
      ↓ (Sí)
┌─────────────────────────────────────────┐
│  Modal 2: Recopilación de Información  │
│                                         │
│  "¿Por qué te vas de Pata Amiga?"       │
│  [ ] Ya no necesito el servicio         │
│  [ ] El precio es muy alto              │
│  [ ] Encontré una mejor opción          │
│  [ ] Problemas con el servicio          │
│  [ ] Otro (especificar) ________________│
│                                         │
│  "¿Puedes contarnos más? (opcional)"   │
│  [____________________________]         │
│                                         │
│  "¿Aceptas dejar la manada de           │
│   Pata Amiga?"                          │
│  [Sí] [No]                              │
└─────────────────────────────────────────┘
      ↓ (Sí)
┌─────────────────────────────────────────┐
│  Modal 3: Confirmación Final            │
│  "Lamentamos que ya no continues en     │
│   la manada de Pata Amiga, pero recuerda│
│   que te respaldamos hasta el XX de     │
│   [MES] de [AÑO]."                      │
│  (calculado a partir de la fecha de fin │
│   de suscripción en Stripe)             │
│                                         │
│  [Confirmar cancelación] [Volver]       │
└─────────────────────────────────────────┘
      ↓ (Confirmar)
Llamada a API → Cancelar Stripe + guardar datos + logout
      ↓
Mensaje de despedida + redirección
```

---

## 🗄️ Cambios en Base de Datos (Supabase)

### 3.1. Nueva Tabla: `membership_cancellations`

```sql
-- Tabla para registrar cancelaciones de membresía
CREATE TABLE IF NOT EXISTS membership_cancellations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relaciones
    user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    memberstack_id VARCHAR(255) NOT NULL,

    -- Fechas importantes
    cancellation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- cuándo se solicitó la cancelación
    membership_end_date DATE NOT NULL, -- hasta qué fecha cubre la suscripción pagada

    -- Razón de cancelación
    cancellation_reason VARCHAR(100) NOT NULL, -- enum: 'no_longer_needed', 'price_too_high', 'found_alternative', 'service_issues', 'other'
    reason_other_text TEXT, -- solo si reason = 'other'
    comments TEXT, -- comentarios opcionales del usuario

    -- Stripe info
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para consultas frecuentes
CREATE INDEX idx_cancellations_memberstack_id ON membership_cancellations(memberstack_id);
CREATE INDEX idx_cancellations_cancellation_date ON membership_cancellations(cancellation_date);
CREATE INDEX idx_cancellations_reason ON membership_cancellations(cancellation_reason);

-- RLS
ALTER TABLE membership_cancellations ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Service role full access" ON membership_cancellations
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own cancellation" ON membership_cancellations
    FOR SELECT USING (auth.uid()::text = memberstack_id);
```

**Nota**: El endpoint de cancelación ya actualiza `users.approval_status = 'cancelled'`, por lo que no necesitamos borrar ni anonimizar el usuario. La tabla `membership_cancellations` agrega historial/auditoría y conserva la relación con `users`; por eso se usa `ON DELETE RESTRICT` para evitar que una eliminación accidental rompa el historial.

---

## 🔌 API Endpoints

### 4.1. Nuevo: `GET /api/user/cancellation-end-date`

**Propósito:** Calcular la fecha de finalización de la membresía (último día de cobertura) basado en la suscripción de Stripe.

**Request:**
```json
GET /api/user/cancellation-end-date?memberstackId=ms_...
```

**Response (éxito):**
```json
{
  "success": true,
  "endDate": "2026-08-14",    // fecha YYYY-MM-DD
  "daysRemaining": 91,
  "subscriptionStatus": "active",
  "currentPeriodEnd": 1755168000 // timestamp de Stripe
}
```

**Lógica:**
1. Buscar usuario en Supabase por `memberstack_id`
2. Obtener `stripe_customer_id` del usuario
3. Si no existe, buscar en Stripe por email
4. Listar suscripciones activas/trialing del customer
5. Tomar la más reciente (`current_period_end`)
6. Calcular días restantes: `(currentPeriodEnd - now) / 86400`
7. Devolver fecha formateada ( UTC a local ) y días

**Errores:**
- 400: memberstackId faltante
- 404: usuario no encontrado
- 404: sin suscripción activa
- 500: error Stripe

---

### 4.2. Modificar: `POST /api/user/deactivate` (Ya existe)

**Cambios:** Actualizar para aceptar motivo y comentarios, y guardar en tabla `membership_cancellations`.

**Request actual:**
```json
{ "memberstackId": "ms_..." }
```

**Request actualizado:**
```json
{
  "memberstackId": "ms_...",
  "reason": "price_too_high",
  "reasonOtherText": "...",   // opcional, solo si reason='other'
  "comments": "..."           // opcional
}
```

**Nueva lógica:**
1. Validar `reason` (enum)
2. Obtener datos del usuario y suscripción Stripe (igual que antes)
3. **Nuevo:** Guardar en `membership_cancellations` con:
   - `user_id`, `memberstack_id`
   - `cancellation_date = NOW()`
   - `membership_end_date = fecha de currentPeriodEnd de Stripe`
   - `cancellation_reason`, `reason_other_text`, `comments`
   - `stripe_subscription_id`, `stripe_customer_id`
4. Continuar con cancelación de suscripciones Stripe (ya existe)
5. Actualizar `users.approval_status = 'cancelled'` (ya existe)
6. Actualizar Memberstack (ya existe)
7. **Prohibido:** ejecutar `delete`, `remove`, `destroy` o cualquier operación equivalente sobre `users`, mascotas, documentos o el registro de Memberstack. La cuenta queda cancelada para beneficios, pero se conserva para historial, soporte, auditoría y posible reactivación futura.
8. **Respuesta actualizada:**
```json
{
  "success": true,
  "message": "Cuenta desactivada correctamente",
  "cancellation": {
    "endDate": "2026-08-14",
    "daysRemaining": 91
  }
}
```

---

### 4.3. Nuevo: `GET /api/admin/cancellations`

**Propósito:** Obtener lista de cancelaciones para el dashboard admin.

**Query params:**
- `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` (filtro por fecha de cancelación)
- `?reason=price_too_high` (filtro por razón, múltiples separados por coma)
- `?page=1&limit=20`
- `?sort=-cancellation_date` (default: más reciente primero)

**Response:**
```json
{
  "success": true,
  "cancellations": [
    {
      "id": "...",
      "user": {
        "first_name": "Juan",
        "last_name": "Pérez",
        "email": "juan@example.com"
      },
      "cancellation_date": "2026-05-10T14:23:00Z",
      "membership_end_date": "2026-08-14",
      "cancellation_reason": "price_too_high",
      "reason_other_text": null,
      "comments": "Está muy caro para mí",
      "days_remaining_at_cancellation": 91,
      "subscription_interval": "month"
    }
  ],
  "pagination": { "total": 150, "page": 1, "limit": 20, "totalPages": 8 }
}
```

**JOINs necesarios:** `membership_cancellations` ←→ `users` (por `user_id`)

---

### 4.4. Nuevo: `GET /api/admin/cancellations/stats`

**Propósito:** Obtener estadísticas agregadas para el dashboard.

**Response:**
```json
{
  "success": true,
  "stats": {
    "total_cancellations": 150,
    "last_7_days": 12,
    "last_30_days": 45,
    "by_reason": {
      "no_longer_needed": 45,
      "price_too_high": 60,
      "found_alternative": 25,
      "service_issues": 12,
      "other": 8
    },
    "avg_days_remaining": 34
  }
}
```

---

## 🎨 Cambios en el Widget de Usuario (Frontend)

### 5.1. Estructura de Modales

Añadir al final del archivo `public/widgets/user-profile-widget.js`:

#### 5.1.1. CSS Adicional para Modales

Agregar en la constante `STYLES` (después de línea 124):

**Criterio visual obligatorio:** estos modales sustituyen por completo los `confirm()`/`alert()` nativos. Deben verse como parte de Pata Amiga, no como toast genérico ni diálogo del navegador. Reusar clases, radios, borde negro, paleta y tipografías del widget actual cuando existan.

```css
/* --- Modales de Cancelación --- */
.ppa-cancel-overlay {
    position:fixed; inset:0; background:rgba(0,0,0,.6); z-index:100001;
    display:flex; align-items:center; justify-content:center; padding:20px;
    animation:ppaFadeIn .2s ease;
}
.ppa-cancel-modal {
    background:#fff; border-radius:40px; border:3px solid #000;
    padding:40px; width:100%; max-width:560px; max-height:90vh;
    overflow-y:auto; box-shadow:12px 12px 0 rgba(0,0,0,.1);
    animation:ppaSlideUp .3s ease; position:relative; font-family:'Outfit',sans-serif;
}
.ppa-cancel-title {
    font-family:'Fraiche',sans-serif; font-size:32px; color:#000;
    margin:0 0 8px; text-transform:lowercase; text-align:center;
}
.ppa-cancel-subtitle {
    font-size:15px; color:#555; line-height:1.6; margin-bottom:28px; text-align:center;
}
.ppa-cancel-link {
    color:#15BEB2; text-decoration:none; font-weight:700; border-bottom:2px dotted #15BEB2;
    cursor:pointer; transition:all .2s;
}
.ppa-cancel-link:hover { color:#0D8A86; border-bottom-style:solid; }

.ppa-cancel-options { margin:24px 0; }
.ppa-cancel-option {
    display:flex; align-items:center; gap:10px; padding:12px 16px;
    border:2px solid #e0e0e0; border-radius:50px; margin-bottom:10px;
    cursor:pointer; transition:all .2s; font-size:15px;
}
.ppa-cancel-option:hover { border-color:#15BEB2; background:#F0FEFC; }
.ppa-cancel-option.selected {
    border-color:#15BEB2; background:#E0F7FA; font-weight:700; box-shadow:0 4px 0 #15BEB233;
}
.ppa-cancel-option input[type="checkbox"] {
    width:20px; height:20px; accent-color:#15BEB2; flex-shrink:0;
}
.ppa-cancel-other-input {
    width:100%; padding:13px 20px; border:2px solid #e0e0e0;
    border-radius:50px; font-family:'Outfit',sans-serif; font-size:15px;
    margin-top:10px; outline:none; transition:border-color .2s;
}
.ppa-cancel-other-input:focus { border-color:#15BEB2; }

.ppa-cancel-textarea {
    width:100%; padding:13px 20px; border:2px solid #e0e0e0;
    border-radius:20px; font-family:'Outfit',sans-serif; font-size:15px;
    min-height:80px; resize:vertical; margin-top:8px; outline:none;
}
.ppa-cancel-textarea:focus { border-color:#15BEB2; }

.ppa-cancel-final {
    display:flex; align-items:center; justify-content:center; gap:12px;
    padding:14px; background:#F8FAFC; border:2px dashed #cbd5e0;
    border-radius:20px; margin:20px 0; font-size:16px; font-weight:700;
    color:#2D3748;
}
.ppa-cancel-agree {
    width:24px; height:24px; accent-color:#E53E3E; flex-shrink:0;
}

.ppa-cancel-btn-primary {
    width:100%; background:#E53E3E; color:#fff; border:2px solid #000;
    border-radius:50px; padding:16px; font-family:'Fraiche',sans-serif;
    font-size:22px; cursor:pointer; transition:all .2s; text-transform:lowercase;
}
.ppa-cancel-btn-primary:hover { transform:translateY(-2px); box-shadow:6px 6px 0 rgba(0,0,0,.1); }
.ppa-cancel-btn-primary:disabled { opacity:.5; cursor:not-allowed; transform:none; box-shadow:none; }

.ppa-cancel-btn-secondary {
    width:100%; background:transparent; color:#666; border:2px solid #ccc;
    border-radius:50px; padding:14px; font-family:'Outfit',sans-serif;
    font-size:16px; cursor:pointer; margin-top:10px; transition:all .2s;
}
.ppa-cancel-btn-secondary:hover { border-color:#666; color:#333; }

.ppa-cancel-modal-x {
    position:absolute; top:18px; right:18px; width:36px; height:36px;
    border-radius:50%; border:2px solid #000; background:#f0f0f0;
    cursor:pointer; font-size:18px; display:flex; align-items:center; justify-content:center;
}
@keyframes ppaFadeIn { from{opacity:0} to{opacity:1} }
@keyframes ppaSlideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
@media(max-width:640px){
    .ppa-cancel-modal { padding:24px; border-radius:24px; }
    .ppa-cancel-title { font-size:24px; }
}
```

#### 5.1.2. Nueva Función: `openCancellationFlow()`

```javascript
async openCancellationFlow() {
    // Paso 1: Modal de confirmación inicial
    const confirmation = await this.showCancelConfirmationModal();
    if (!confirmation) return;

    // Paso 2: Modal de recopilación de información
    const cancellationInfo = await this.showCancellationForm();
    if (!cancellationInfo) return;

    // Paso 3: Calcular fecha de finalización
    const endDateInfo = await this.fetchCancellationEndDate();
    if (!endDateInfo.success) {
        await this.showCancellationFeedbackModal({
            type: 'error',
            title: 'No pudimos calcular tu fecha',
            message: endDateInfo.error || 'Intenta de nuevo en unos minutos o contacta a soporte.'
        });
        return;
    }

    // Paso 4: Mostrar resumen final
    const finalConfirmation = await this.showFinalConfirmation(endDateInfo);
    if (!finalConfirmation) return;

    // Paso 5: Ejecutar cancelación
    await this.executeCancellation(cancellationInfo, endDateInfo);
}
```

#### 5.1.3. Función `showCancelConfirmationModal()`

```javascript
showCancelConfirmationModal() {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'ppa-cancel-overlay';
        overlay.innerHTML = `
            <div class="ppa-cancel-modal" onclick="event.stopPropagation()">
                <button class="ppa-cancel-modal-x" id="ppa-cancel-step1-close">✕</button>
                <h2 class="ppa-cancel-title">¿Cancelar tu membresía?</h2>
                <p class="ppa-cancel-subtitle">
                    Estás por proceder a la cancelación de tu membresía Pata Amiga y con ello despedirte de la manada.
                    <br><br>
                    <strong>Recuerda que no hay reembolsos</strong> de acuerdo con los términos y condiciones.
                    <br>
                    <span class="ppa-cancel-link" id="ppa-terms-link">Ver términos y condiciones</span>
                </p>
                <div style="display:flex; gap:12px; margin-top:24px;">
                    <button class="ppa-cancel-btn-secondary" id="ppa-cancel-step1-back">Cancelar</button>
                    <button class="ppa-cancel-btn-primary" id="ppa-cancel-step1-continue">Sí, deseo continuar</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);

        document.getElementById('ppa-terms-link').addEventListener('click', () => {
            // Abrir modal de términos (reutilizar lógica existente o abrir nueva ventana)
            this.openTermsModal();
        });
        document.getElementById('ppa-cancel-step1-close').addEventListener('click', () => {
            overlay.remove(); resolve(false);
        });
        document.getElementById('ppa-cancel-step1-back').addEventListener('click', () => {
            overlay.remove(); resolve(false);
        });
        document.getElementById('ppa-cancel-step1-continue').addEventListener('click', () => {
            overlay.remove(); resolve(true);
        });
        overlay.addEventListener('click', (e) => { if(e.target===overlay){ overlay.remove(); resolve(false); } });
    });
}
```

#### 5.1.4. Función `showCancellationForm()`

```javascript
showCancellationForm() {
    return new Promise((resolve) => {
        const reasons = [
            { id: 'no_longer_needed', label: 'Ya no necesito el servicio' },
            { id: 'price_too_high', label: 'El precio es muy alto' },
            { id: 'found_alternative', label: 'Encontré una mejor opción' },
            { id: 'service_issues', label: 'Problemas con el servicio' },
            { id: 'other', label: 'Otro (especificar)' }
        ];

        const overlay = document.createElement('div');
        overlay.className = 'ppa-cancel-overlay';
        overlay.innerHTML = `
            <div class="ppa-cancel-modal" onclick="event.stopPropagation()">
                <button class="ppa-cancel-modal-x" id="ppa-cancel-step2-close">✕</button>
                <h2 class="ppa-cancel-title">Cuéntanos por qué te vas</h2>
                <p class="ppa-cancel-subtitle">Tu retroalimentación nos ayuda a mejorar.</p>

                <div class="ppa-cancel-options" id="ppa-cancel-options">
                    ${reasons.map(r => `
                        <div class="ppa-cancel-option" data-reason="${r.id}">
                            <input type="checkbox" ${r.id==='other'?'':'id="reason-'+r.id+'"'}>
                            <span>${r.label}</span>
                        </div>
                    `).join('')}
                    <input type="text" class="ppa-cancel-other-input" id="ppa-reason-other-text"
                           placeholder="Especifica tu razón..." style="display:none">
                </div>

                <label style="display:block; margin-bottom:6px; font-weight:700; font-size:13px; color:#555;">
                    ¿Puedes contarnos más? (opcional)
                </label>
                <textarea class="ppa-cancel-textarea" id="ppa-cancel-comments"
                          placeholder="Tu opinión es importante para nosotros..."></textarea>

                <div class="ppa-cancel-final">
                    <input type="checkbox" id="ppa-cancel-agree">
                    <label for="ppa-cancel-agree">Acepto dejar la manada de Pata Amiga</label>
                </div>

                <button class="ppa-cancel-btn-primary" id="ppa-cancel-step2-submit" disabled>
                    Continuar
                </button>
                <button class="ppa-cancel-btn-secondary" id="ppa-cancel-step2-back">Volver</button>
            </div>`;
        document.body.appendChild(overlay);

        // Lógica de opciones
        const optionsContainer = document.getElementById('ppa-cancel-options');
        const otherInput = document.getElementById('ppa-reason-other-text');
        let selectedReasons = new Set();

        optionsContainer.querySelectorAll('.ppa-cancel-option').forEach(opt => {
            opt.addEventListener('click', () => {
                const reasonId = opt.dataset.reason;
                const checkbox = opt.querySelector('input[type="checkbox"]');
                checkbox.checked = !checkbox.checked;
                if (checkbox.checked) {
                    if (reasonId === 'other') {
                        otherInput.style.display = 'block';
                        otherInput.focus();
                    } else {
                        // deseleccionar 'other' si se elige otra
                        const otherOpt = optionsContainer.querySelector('[data-reason="other"]');
                        const otherCheck = otherOpt.querySelector('input');
                        otherCheck.checked = false; otherOpt.classList.remove('selected');
                        otherInput.style.display = 'none';
                    }
                    selectedReasons.add(reasonId);
                    opt.classList.add('selected');
                } else {
                    selectedReasons.delete(reasonId);
                    if (reasonId === 'other') otherInput.style.display = 'none';
                    opt.classList.remove('selected');
                }
                updateSubmitState();
            });
        });

        function updateSubmitState() {
            const submitBtn = document.getElementById('ppa-cancel-step2-submit');
            const agreed = document.getElementById('ppa-cancel-agree').checked;
            const hasReason = selectedReasons.size > 0;
            submitBtn.disabled = !(agreed && hasReason);
        }

        document.getElementById('ppa-cancel-agree').addEventListener('change', updateSubmitState);
        document.getElementById('ppa-cancel-step2-close').addEventListener('click', () => {
            overlay.remove(); resolve(null);
        });
        document.getElementById('ppa-cancel-step2-back').addEventListener('click', () => {
            overlay.remove(); resolve(null);
        });
        document.getElementById('ppa-cancel-step2-submit').addEventListener('click', () => {
            const reasonArray = Array.from(selectedReasons);
            // Si hay múltiples, tomamos el primero no-'other', o 'other' si es el único
            let mainReason = reasonArray.find(r => r !== 'other') || reasonArray[0];
            const result = {
                reason: mainReason,
                reasonOtherText: mainReason === 'other' ? otherInput.value : null,
                comments: document.getElementById('ppa-cancel-comments').value.trim() || null
            };
            overlay.remove(); resolve(result);
        });
    });
}
```

#### 5.1.5. Función `fetchCancellationEndDate()`

```javascript
async fetchCancellationEndDate() {
    try {
        const res = await fetch(`${CONFIG.apiUrl}/api/user/cancellation-end-date?memberstackId=${this.member.id}`);
        const data = await res.json();
        return data;
    } catch (e) {
        console.error('[ProfileWidget] Error fetching end date:', e);
        return { success: false, error: 'Error de conexión' };
    }
}
```

#### 5.1.6. Función `showFinalConfirmation(endDateInfo)`

```javascript
showFinalConfirmation(endDateInfo) {
    return new Promise((resolve) => {
        const endDate = new Date(endDateInfo.endDate);
        const formatted = endDate.toLocaleDateString('es-MX', {
            day: 'numeric', month: 'long', year: 'numeric'
        });

        const overlay = document.createElement('div');
        overlay.className = 'ppa-cancel-overlay';
        overlay.innerHTML = `
            <div class="ppa-cancel-modal" onclick="event.stopPropagation()">
                <button class="ppa-cancel-modal-x" id="ppa-cancel-step3-close">✕</button>
                <h2 class="ppa-cancel-title">Último paso</h2>
                <p class="ppa-cancel-subtitle" id="ppa-final-message">
                    <!-- Inyectado por JS -->
                </p>
                <div style="display:flex; gap:12px; margin-top:24px;">
                    <button class="ppa-cancel-btn-secondary" id="ppa-cancel-step3-back">Volver</button>
                    <button class="ppa-cancel-btn-primary" id="ppa-cancel-step3-confirm">Confirmar cancelación</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);

        const msgEl = document.getElementById('ppa-final-message');
        msgEl.innerHTML = `
            Lamentamos que ya no continues en la manada de Pata Amiga.
            <br><br>
            Sin embargo, <strong>te respaldamos hasta el ${formatted}</strong>.
            <br>
            (Faltan ${endDateInfo.daysRemaining} días para que termine tu periodo pagado)
            <br><br>
            Al confirmar, se cancelará tu suscripción y perderás acceso a los beneficios exclusivos.
        `;

        document.getElementById('ppa-cancel-step3-close').addEventListener('click', () => {
            overlay.remove(); resolve(false);
        });
        document.getElementById('ppa-cancel-step3-back').addEventListener('click', () => {
            overlay.remove(); resolve(false);
        });
        document.getElementById('ppa-cancel-step3-confirm').addEventListener('click', () => {
            overlay.remove(); resolve(true);
        });
    });
}
```

#### 5.1.7. Función `executeCancellation(cancellationInfo, endDateInfo)`

```javascript
async executeCancellation(cancellationInfo, endDateInfo) {
    try {
        const res = await fetch(`${CONFIG.apiUrl}/api/user/deactivate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                memberstackId: this.member.id,
                reason: cancellationInfo.reason,
                reasonOtherText: cancellationInfo.reasonOtherText,
                comments: cancellationInfo.comments
            })
        }).then(r => r.json());

        if (res.success) {
            await this.showCancellationFeedbackModal({
                type: 'success',
                title: 'Membresía cancelada',
                message: `Gracias por haber sido parte de Pata Amiga. Te respaldamos hasta el ${endDateInfo.endDate}.`
            });
            await window.$memberstackDom.logout();
            window.location.href = '/';
        } else {
            await this.showCancellationFeedbackModal({
                type: 'error',
                title: 'No pudimos cancelar tu membresía',
                message: res.error || 'Por favor intenta de nuevo o contacta a soporte.'
            });
        }
    } catch (e) {
        await this.showCancellationFeedbackModal({
            type: 'error',
            title: 'Error de conexión',
            message: 'Intenta de nuevo en unos minutos.'
        });
    }
}
```

#### 5.1.8. Función `showCancellationFeedbackModal({ type, title, message })`

Usar este modal para todos los estados de error/éxito del flujo. No usar `alert()`, `confirm()`, `prompt()` ni toasts del navegador.

```javascript
showCancellationFeedbackModal({ type, title, message }) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'ppa-cancel-overlay';
        overlay.innerHTML = `
            <div class="ppa-cancel-modal" onclick="event.stopPropagation()">
                <button class="ppa-cancel-modal-x" id="ppa-cancel-feedback-close">×</button>
                <h2 class="ppa-cancel-title">${title}</h2>
                <p class="ppa-cancel-subtitle">${message}</p>
                <button class="ppa-cancel-btn-primary" id="ppa-cancel-feedback-ok">
                    Entendido
                </button>
            </div>`;
        document.body.appendChild(overlay);

        const close = () => { overlay.remove(); resolve(type === 'success'); };
        document.getElementById('ppa-cancel-feedback-close').addEventListener('click', close);
        document.getElementById('ppa-cancel-feedback-ok').addEventListener('click', close);
    });
}
```

#### 5.1.9. Función `openTermsModal()`

Reutilizar los componentes existentes o crear un modal HTML inyectado con el mismo estilo Pata Amiga. No abrir `window.confirm`, `alert` ni una UI genérica del navegador. Si se abre una pestaña externa para el PDF, el contenedor principal del flujo debe seguir siendo el modal Pata Amiga.

```javascript
openTermsModal() {
    // Abrir enlace a página de términos o usar un modal existente
    // Puede hacerse dinámicamente cargando desde /api/legal-documents?audience=members
    const termsUrl = `${CONFIG.apiUrl}/api/legal-documents?audience=members`;
    window.open(termsUrl, '_blank', 'width=800,height=600');
}
```

Alternativamente, se podría crear un modal HTML generado dinámicamente con los términos cargados vía AJAX.

---

## 🖥️ Dashboard Administrativo

### 6.1. Estructura de Archivos

```
src/components/Admin/
├── CancellationsTable.tsx      (Nuevo)
├── CancellationsStats.tsx      (Nuevo - pequeño componente de estadísticas)
└── AdminDashboard.tsx          (Modificado)
```

### 6.2. Componente: `CancellationsTable.tsx`

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import { adminFetch } from '@/utils/admin-fetch';
import styles from './CancellationsTable.module.css';

interface Cancellation {
  id: string;
  user: { first_name: string; last_name: string; email: string; };
  cancellation_date: string;
  membership_end_date: string;
  cancellation_reason: string;
  reason_other_text: string | null;
  comments: string | null;
  days_remaining_at_cancellation: number;
  subscription_interval: 'month' | 'year';
}

const REASON_LABELS: Record<string, string> = {
  no_longer_needed: 'Ya no necesita el servicio',
  price_too_high: 'Precio muy alto',
  found_alternative: 'Encontró alternativa',
  service_issues: 'Problemas con el servicio',
  other: 'Otro'
};

export default function CancellationsTable() {
  const [cancellations, setCancellations] = useState<Cancellation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ reason: '', startDate: '', endDate: '' });

  useEffect(() => { loadCancellations(); }, [filters]);

  async function loadCancellations() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.reason) params.append('reason', filters.reason);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      const res = await adminFetch(`/api/admin/cancellations?${params}`);
      const data = await res.json();
      if (data.success) setCancellations(data.cancellations);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Membresías Canceladas</h2>

      {/* Filtros */}
      <div className={styles.filtersRow}>
        <select value={filters.reason} onChange={e => setFilters({...filters, reason:e.target.value})}
                className={styles.select}>
          <option value="">Todas las razones</option>
          {Object.entries(REASON_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate:e.target.value})}
               className={styles.dateInput} placeholder="Desde" />
        <input type="date" value={filters.endDate} onChange={e => setFilters({...filters, endDate:e.target.value})}
               className={styles.dateInput} placeholder="Hasta" />
      </div>

      {/* Tabla */}
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Miembro</th>
              <th>Fecha Cancelación</th>
              <th>Razón</th>
              <th>Comentarios</th>
              <th>Días restantes</th>
              <th>Fin de membresía</th>
            </tr>
          </thead>
          <tbody>
            {cancellations.map(c => (
              <tr key={c.id}>
                <td>
                  {c.user.first_name} {c.user.last_name}<br/>
                  <small>{c.user.email}</small>
                </td>
                <td>{formatDate(c.cancellation_date)}</td>
                <td>
                  {REASON_LABELS[c.cancellation_reason]}
                  {c.cancellation_reason === 'other' && c.reason_other_text && (
                    <div style={{fontSize:'0.85em', color:#666}}>{c.reason_other_text}</div>
                  )}
                </td>
                <td style={{maxWidth:'200px'}} title={c.comments||''}>
                  {c.comments ? c.comments.substring(0,50) + (c.comments.length>50?'...':'') : '—'}
                </td>
                <td>{c.days_remaining_at_cancellation} días</td>
                <td>{formatDate(c.membership_end_date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

**Estilos sugeridos** (`CancellationsTable.module.css`):
```css
.container { padding: 20px; }
.title { font-family:'Fraiche',sans-serif; font-size:32px; margin-bottom:20px; }
.filtersRow { display:flex; gap:12px; margin-bottom:16px; flex-wrap:wrap; }
.select, .dateInput { padding:10px 16px; border:2px solid #ccc; border-radius:50px; font-family:'Outfit',sans-serif; }
.table { width:100%; border-collapse:collapse; }
.table th, .table td { padding:12px 16px; border-bottom:1px solid #eee; text-align:left; }
.table th { font-weight:700; color:#555; font-size:13px; }
```

---

### 6.3. Modificar `AdminDashboard.tsx`

En la función `renderContent()` (línea 295 en adelante), agregar un caso:

```tsx
case 'cancellations':
    return <CancellationsTable />;
```

Y en el menú lateral (`Sidebar.tsx` o donde se definan los filtros), agregar una opción:

```tsx
{ isSuperAdmin && (
  <button onClick={() => setActiveFilter('cancellations')}>
    📋 Membresías Canceladas
  </button>
)}
```

También actualizar `pendingCounts` para incluir un contador (opcional) de cancelaciones这一周.

---

## 🛡️ Términos y Condiciones Reutilizables

Se puede reutilizar el endpoint `/api/legal-documents?audience=members` (si existe) o crear uno similar que devuelva los documentos de términos y condiciones de membresía.

El widget `UserProfileWidget` al hacer clic en el link del modal 1 debería abrir el TermsModal existente (similar a como se hace en AmbassadorForm). Dado que el widget es Vanilla JS (no React), la forma más simple es abrir un modal HTML injection:

```javascript
openTermsModal() {
    fetch(`${CONFIG.apiUrl}/api/legal-documents?audience=members`)
        .then(r => r.json())
        .then(data => {
            if (data.success && data.documents.length > 0) {
                const doc = data.documents[0]; // Asumimos el primero es términos
                // Abrir modal con enlace de descarga
                const overlay = document.createElement('div');
                overlay.className = 'ppa-cancel-overlay';
                overlay.innerHTML = `
                    <div class="ppa-cancel-modal">
                        <button class="ppa-cancel-modal-x" id="terms-close">✕</button>
                        <h2 class="ppa-cancel-title">Términos y Condiciones</h2>
                        <p class="ppa-cancel-subtitle">
                            Por favor, revisa los siguientes documentos legales antes de continuar.
                        </p>
                        <div style="margin:20px 0;">
                            <a href="${doc.file_url}" target="_blank" rel="noopener noreferrer"
                               style="display:inline-flex;align-items:center;gap:8px;padding:12px 24px;
                                      background:#FE8F15;color:#fff;border:2px solid #000;
                                      border-radius:50px;text-decoration:none;font-weight:700;">
                                📄 Descargar ${doc.title}
                            </a>
                        </div>
                        <p style="text-align:center; margin-top:20px;">
                            <button class="ppa-cancel-btn-secondary" id="terms-confirm-read">
                                He leído y acepto los términos
                            </button>
                        </p>
                    </div>`;
                document.body.appendChild(overlay);

                let agreed = false;
                document.getElementById('terms-confirm-read').addEventListener('click', () => {
                    agreed = true;
                    overlay.remove();
                    // Resolver promise original waiting
                });
                document.getElementById('terms-close').addEventListener('click', () => {
                    overlay.remove();
                });
            } else {
                this.showCancellationFeedbackModal({
                    type: 'error',
                    title: 'Términos no disponibles',
                    message: 'No pudimos cargar los términos y condiciones. Contacta a soporte para continuar.'
                });
            }
        });
}
```

---

## 📋 Checklist de Implementación

### 7.1. Database & API
- [ ] Crear tabla `membership_cancellations` en Supabase (ejecutar SQL)
- [ ] Agregar índices correspondientes
- [ ] Implementar `GET /api/user/cancellation-end-date`
- [ ] Modificar `POST /api/user/deactivate` para incluir reason/comments y guardar en tabla
- [ ] Confirmar que la API no ejecute borrado físico ni en Supabase ni en Memberstack; solo cambia estado a `cancelled`
- [ ] Crear `GET /api/admin/cancellations` (con paginación y filtros)
- [ ] Crear `GET /api/admin/cancellations/stats`
- [ ] Probar endpoints con Postman/curl

### 7.2. Frontend Widget
- [ ] Añadir CSS de modales a `STYLES` en user-profile-widget.js
- [ ] Implementar `openCancellationFlow()` como controlador principal
- [ ] Implementar `showCancelConfirmationModal()`
- [ ] Implementar `showCancellationForm()` con lógica de razones
- [ ] Implementar `fetchCancellationEndDate()`
- [ ] Implementar `showFinalConfirmation()`
- [ ] Implementar `showCancellationFeedbackModal()` para errores, éxito y mensajes informativos
- [ ] Implementar `executeCancellation()`
- [ ] Modificar `bindEvents()` para llamar a `openCancellationFlow()` en lugar de `handleCancel()`
- [ ] Verificar con búsqueda en el widget que no queden llamadas a `alert()`, `confirm()` o `prompt()` en el flujo de cancelación
- [ ] Probar flujo completo en navegador (desarrollo)
- [ ] Probar edge cases: sin suscripción, error de red, etc.

### 7.3. Admin Dashboard
- [ ] Crear componente `CancellationsTable.tsx`
- [ ] Crear `CancellationsTable.module.css`
- [ ] Modificar `AdminDashboard.tsx` para incluir nueva vista
- [ ] Modificar `Sidebar.tsx` (o equivalente) para incluir enlace a cancelaciones (solo SuperAdmin)
- [ ] Actualizar métricas en `AdminDashboard` para incluir stats de cancelación (opcional)
- [ ] Probar acceso y filtros

### 7.4. Términos y Condiciones
- [ ] Verificar que exista documento legal para miembros en la base de datos (tabla `legal_documents` o similar)
- [ ] Si no existe, crearlo con título "Términos y Condiciones de Membresía"
- [ ] Implementar endpoint GET `/api/legal-documents?audience=members` (si no existe ya)
- [ ] Integrar visualización en `openTermsModal()`

### 7.5. Pruebas y Calidad
- [ ] `npm run type-check` – sin errores
- [ ] `npm run lint` – sin errores
- [ ] `npm run build` – build exitoso
- [ ] Pruebas manuales:
  - Registro → pago → ver widget → cancelar proceso completo
  - Verificar que Stripe cancele suscripción
  - Verificar que Supabase guarde registro en `membership_cancellations`
  - Verificar que admin vea la entrada
  - Verificar que el mensaje muestre fecha correcta
- [ ] Pruebas de responsive (mobile)

---

## 📦 Dependencias y Recursos

### Librerías Utilizadas
- Stripe SDK (ya existe en proyecto)
- Supabase client (ya existe)
- Fetch API (nativo)

### Recursos de Diseño
- Colores: `#E53E3E` (rojo cancelación), `#15BEB2` (turquesa), `#FE8F15` (naranja)
- Fuentes: Fraiche (títulos), Outfit (cuerpo)
- Radio de bordes: 50px (inputs), 40px (modales)

---

## ⚠️ Consideraciones y Edge Cases

1. **Suscripción ya cancelada**: Si el usuario no tiene suscripción activa, mostrar mensaje "No tienes una membresía activa para cancelar".
2. **Sin Stripe customer ID**: El endpoint de cálculo debe buscar por email como fallback.
3. **Múltiples suscripciones**: Cancelar solo la activa/trialing.
4. **Rate limits**: Stripe API puede rate limitear, manejar con retry.
5. **Seguridad**: Solo el miembro autenticado puede cancelar su propia membresía; solo admin puede ver la tabla de cancelaciones.
6. **Deleción de datos**: No eliminar usuario al cancelar, solo cambiar estado y dejar historial.
7. **Reembolsos**: No se permiten reembolsos (ya especificado en términos). El endpoint deactivate NO procesa reembolsos (ya lo maneja aparte el botón de reembolso en admin).

---

## 📊 Métricas de Éxito

- **Usuarios**: Flujo completado en < 3 minutos
- **Admin**: Tiempo de carga de tabla < 2 segundos
- **DB**: Tabla `membership_cancellations` estable, sin inconsistencias
- **Stripe**: Suscripciones canceladas correctamente, sin fugas

---

## 📅 Cronograma Estimado

| Fase | Duración | Entregable |
|------|----------|------------|
| DB + API Backend | 2–3 horas | Tabla + endpoints funcionando |
| Widget Frontend | 3–4 horas | Modales integrados, flujo completo |
| Admin Dashboard | 2–3 horas | Tabla y filtros operativos |
| QA & Fixes | 1–2 hora | Pruebas, ajustes, lint, build |
| **Total** | **8–12 horas** | **Funcionalidad completa** |

---

## 📝 Notas Adicionales

- **Notificaciones**: Considerar enviar email de confirmación de cancelación (usando Resend) – **Posterior a MVP**.
- **Reactivación**: Un usuario cancelado podría querer reactivarse en el futuro? (fuera de scope por ahora).
- **Reporting**: Futuras mejoras: gráficos de tendencia de cancelaciones por mes.
- **Webhook Stripe**: Considerar sincronizar estado vía webhook en lugar de solo API calls – **futuro**.
- **Mobile**: Asegurar que los modales sean responsive (ya se incluyen estilos media queries).

---

**Fin del plan.** Se procede a implementación en fases, comenzando por la base de datos y API.
