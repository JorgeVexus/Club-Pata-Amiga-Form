# Auditoría Integral de Flujos de Usuarios

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:systematic-debugging` para investigar hallazgos y `superpowers:verification-before-completion` antes de declarar resultados. No ejecutar `git commit` ni `git push` sin autorización expresa del usuario.

**Goal:** Verificar de extremo a extremo que los flujos de miembros, solicitudes de apoyo, embajadores y centros de bienestar sean funcionales, coherentes y seguros para el usuario final.

**Architecture:** La auditoría sigue cada recorrido desde sus interfaces públicas y widgets hasta las API Routes, servicios externos, persistencia y herramientas administrativas. Cada hallazgo debe demostrar su causa raíz con referencias de código o resultados reproducibles; las integraciones externas que no puedan ejecutarse localmente se clasifican explícitamente como no verificadas.

**Tech Stack:** Next.js 16, React 19, TypeScript, Memberstack, Supabase, Stripe, Resend, Sanity, widgets JavaScript para Webflow.

---

## Alcance y evidencias

### Task 1: Inventario técnico y contratos

**Files:**

- Inspect: `src/app/api/**/route.ts`
- Inspect: `src/services/*.ts`
- Inspect: `src/lib/*.ts`
- Inspect: `src/types/*.ts`
- Inspect: `public/widgets/*.js`
- Inspect: scripts SQL y documentación funcional relevante

- [ ] Inventariar pantallas, widgets, endpoints y servicios por dominio.
- [ ] Relacionar cada llamada del cliente con su API Route real.
- [ ] Relacionar cada API Route con Supabase, Memberstack, Stripe, Resend o CRM.
- [ ] Detectar rutas huérfanas, contratos incompatibles y funcionalidades documentadas pero no implementadas.

### Task 2: Flujo de miembros

**Files:**

- Inspect: `src/app/usuarios/registro/**`
- Inspect: `src/components/RegistrationV2/**`
- Inspect: `public/widgets/unified-membership-widget.js`
- Inspect: `src/app/api/user/**`
- Inspect: `src/app/api/admin/members/**`
- Inspect: `src/app/api/stripe/webhook/route.ts`

- [ ] Trazar registro, pago, aprobación/rechazo, edición, mascotas y apelaciones.
- [ ] Verificar cancelación, cierre de suscripción, conservación de datos y reingreso.
- [ ] Verificar reembolsos administrativos, estados de pago e idempotencia.
- [ ] Revisar autenticación, autorización y aislamiento de datos por miembro.

### Task 3: Solicitudes de apoyo

**Files:**

- Inspect: `public/widgets/solidarity-*.js`
- Inspect: `src/app/api/solidarity/**`
- Inspect: `src/app/api/admin/solidarity/**`
- Inspect: `src/types/solidarity.types.ts`
- Inspect: utilidades y scripts SQL del fondo solidario

- [ ] Trazar elegibilidad, saldo, creación, archivos, mensajes, dictamen y cierre.
- [ ] Verificar montos, estados, concurrencia, reintegros y límites.
- [ ] Confirmar que el usuario solo vea y modifique sus propias solicitudes.
- [ ] Revisar notificaciones y correos asociados a cada transición.

### Task 4: Flujo de embajadores

**Files:**

- Inspect: `src/components/AmbassadorForm/**`
- Inspect: `public/widgets/ambassador-*.js`
- Inspect: `src/app/api/ambassadors/**`
- Inspect: `src/app/api/referrals/**`
- Inspect: `src/app/api/payouts/**`
- Inspect: `src/app/api/admin/ambassadors/**`

- [ ] Trazar alta, aprobación/rechazo, código, referidos y dashboard.
- [ ] Verificar cálculo, registro, reversión y pago de comisiones.
- [ ] Verificar baja y reactivación, incluida la relación con Memberstack.
- [ ] Revisar privacidad de datos bancarios, autenticación y autorización.

### Task 5: Flujo de centros de bienestar

**Files:**

- Inspect: `src/components/WellnessForm/**`
- Inspect: `public/widgets/wellness-*.js`
- Inspect: `src/app/api/wellness/**`
- Inspect: `src/app/api/admin/wellness/**`
- Inspect: `src/services/wellness.service.ts`

- [ ] Trazar registro, documentos, revisión, aprobación/rechazo y perfil.
- [ ] Verificar ubicaciones, citas, evidencias y conexión con solicitudes de apoyo.
- [ ] Verificar baja y opción de reingreso/reactivación.
- [ ] Revisar autenticación, autorización y exposición de información sensible.

### Task 6: Correos e integraciones

**Files:**

- Inspect: `src/lib/resend.ts`
- Inspect: `src/utils/email-builder.ts`
- Inspect: todas las llamadas a Resend, Stripe, Memberstack, Supabase y CRM

- [ ] Inventariar eventos que envían correo y sus destinatarios.
- [ ] Validar plantillas, variables, enlaces, fallos parciales y reintentos.
- [ ] Verificar el manejo de errores y consistencia cuando una dependencia externa falla.
- [ ] Identificar secretos expuestos, endpoints de depuración y configuraciones inseguras.

### Task 7: Verificación ejecutable

**Files:**

- Inspect: pruebas existentes y configuración de tooling

- [ ] Ejecutar pruebas automatizadas disponibles.
- [ ] Ejecutar `npm run build`.
- [ ] Ejecutar `npm run type-check`.
- [ ] Ejecutar `npm run lint`.
- [ ] Investigar sistemáticamente cada fallo y separar defectos del producto de problemas ambientales.

### Task 8: Informe final

**Files:**

- Create: `Documentacion/auditorias/2026-07-26-auditoria-integral-flujos.md`

- [ ] Documentar matriz de cobertura por flujo.
- [ ] Clasificar hallazgos por severidad, impacto, evidencia y causa raíz.
- [ ] Diferenciar comprobado, parcialmente comprobado y no comprobable sin credenciales/datos externos.
- [ ] Proponer orden de corrección y pruebas de aceptación.
