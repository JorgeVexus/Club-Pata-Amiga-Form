# Club Pata Amiga — Plataforma

Membresía de salud para mascotas en México. Una sola aplicación Next.js + Supabase que cubre: landing pública, registro y pago, dashboard del miembro, reintegros, orientación veterinaria 24/7 (IA), portal de embajadores, directorio de centros de bienestar y panel de administración.

> Contexto completo del proyecto, terminología de marca vinculante y reglas de negocio: ver [CLAUDE.md](./CLAUDE.md).

## Stack

- **Next.js** (App Router, TypeScript, Tailwind v4) en Vercel
- **Supabase** — Auth (correo/contraseña + Google), Postgres con RLS, Storage
- **Stripe** — suscripciones (Mensual $159 / Anual $1,699 MXN)
- **Resend** — correos transaccionales
- **LLM flexible** (`LLMProvider`) — bot de orientación veterinaria

## Desarrollo

```bash
npm install
cp .env.example .env.local   # llenar credenciales (ver abajo)
npm run dev                   # http://localhost:3000
```

### Variables de entorno

Las credenciales **nunca** se suben al repositorio (`.env*` está en `.gitignore`; solo `.env.example` se versiona como plantilla). Al integrarte al proyecto, pide los valores reales por un canal seguro (gestor de contraseñas), no por correo ni chat.

En desarrollo, Stripe se usa **exclusivamente en modo test** (`sk_test_...`).

### Base de datos

El esquema vive en `supabase/migrations/` (aplicado al proyecto Supabase de desarrollo). Conceptos clave del modelo: `profiles` (miembro, activo al pagar), `pets` (aprobación individual + período de espera por mascota), `reimbursements` (folio R-####), `appeals` (folio A-####), `ambassadors`/`referrals`, `wellness_centers`, `vet_conversations`.

## Verificación

```bash
npm run build   # build de producción
npm run lint
```
