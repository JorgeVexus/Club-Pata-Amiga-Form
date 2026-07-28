# Landings de campaña (ads / patrocinadores)

Sistema de landings de captación **aislado del sitio principal**: página de
conversión + CRM + correo automático «Obtén tu regalo».

## Cómo funciona

| Pieza | Dónde |
|---|---|
| Página pública | `/landings/<slug>` → `src/app/landings/[campaign]/` |
| Registro de campañas | `src/lib/landings.ts` (copy, perks, activa/inactiva) |
| Leads (BD) | tabla `campaign_leads` (migración `20260714000009`) |
| CRM | Admin → **Landings** (`/admin/landings`): buscar, filtrar, reenviar regalo, exportar CSV |
| Correo automático | plantilla `campaign_gift` — editable en Admin → Comunicados |
| Cupón + PDF | se cargan en Admin → Landings, por campaña, sin tocar código |

**Flujo:** el usuario se registra (nombre, apellidos, correo, teléfono +
consentimiento) → se guarda el lead con sus UTM → se envía el correo con la
palabra cupón y el botón de descarga del PDF. Si el cupón o el PDF aún no se
cargan, el correo lo dice con gracia («por activarse» / «llegará pronto») y
desde el CRM se puede **reenviar** cuando ya estén.

- Registros duplicados (mismo correo + campaña): mensaje amable, sin duplicar.
- El estatus del correo por lead: `ENVIADO / PENDIENTE / FALLÓ` (reenviable).
- Las landings llevan `robots: noindex` para no competir con el sitio en Google.

## Crear una nueva landing

1. Agrega una entrada en `CAMPAIGNS` (`src/lib/landings.ts`): slug, copy, perks.
2. Listo. La página existe en `/landings/<slug>`, aparece en el CRM y su
   cupón/PDF se gestionan desde Admin → Landings.
3. Para pausarla: `active: false` (la URL responde 404 y deja de captar).

## Ponerla en vivo (para el equipo dev)

La landing se deploya con el resto de la app (mismo Vercel). Para darle URL
propia de campaña (ej. `regalo.pataamiga.mx`):

1. Vercel → Settings → Domains → agrega el subdominio y apunta el DNS (CNAME).
2. Opción A (suficiente): comparte directamente
   `https://<dominio>/landings/regalo` en los anuncios.
   Opción B (URL raíz limpia): agrega un redirect/rewrite en `next.config.ts`
   del subdominio raíz hacia `/landings/regalo`.
3. Los anuncios pueden llevar UTM: `?utm_source=meta&utm_medium=cpc&utm_campaign=julio`
   — quedan guardados por lead y salen en el CSV.

## Pendiente del equipo

- Subir el **PDF de cuidado** y la **palabra cupón** en Admin → Landings
  (mientras tanto el correo avisa que llegarán pronto).
- La palabra cupón es informativa en el correo; su validación/activación como
  descuento real en Stripe se hará cuando el equipo la defina.
