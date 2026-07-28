# Pata Amiga — Contexto de sesión (leer primero, no re-explorar)

Membresía de salud para mascotas (México). Rebuild Next.js 16 + Supabase + Stripe + Resend que reemplaza Webflow/Memberstack. NO es un seguro.

## Dónde está todo
- **Código:** `C:\Users\USER\dev\pata-amiga` (fuera de OneDrive a propósito). GitHub: `Chepiztrike/pata-amiga` (privado, master). El coder del equipo (no-AI) lee este repo: código claro y comentado.
- **Staging:** https://pata-amiga-one.vercel.app (Vercel auto-deploya cada push a master).
- **Supabase dev:** proyecto `iddzylyvuhkhuvinvbou` (us-east-1). Migraciones en `supabase/migrations/` (8). Todas las cuentas actuales (Supabase/Stripe/Resend) son de PRUEBA.
- **Estado + pendientes + checklist:** `docs/ESTADO-DEL-PROYECTO.md` en el repo (fuente de verdad del avance).
- **Secretos:** `.env.local` del repo (nunca commitear). Copia para Vercel: `vercel-env-staging.txt` en esta carpeta.
- **Repo anterior (solo referencia):** clonado en scratchpad si se necesita; legales ya importados a `src/data/legal-texts.ts`.

## Cuentas de prueba (una por tipo)
- Miembro: `prueba@pataamiga.dev` / `Prueba1234!` (anual, mascota Max, también embajadora PATAMIGA-CIPA)
- Embajador: `embajador@pataamiga.dev` / `Embajador1234!` (aprobado, código PATAMIGA-EQUIPO, sin membresía)
- Admin: `comite@pataamiga.dev` / `Comite1234!` (rol admin)
- Super admin: `admin@pataamiga.dev` / `Admin1234!`
- Tarjeta Stripe test: `4242 4242 4242 4242`. Los admins aterrizan en /admin automáticamente al iniciar sesión.

## Reglas VINCULANTES (tono 2026)
"Reintegro" y "período de espera". PROHIBIDO: seguro, póliza, cobertura, carencia, fondo solidario, respaldo/apoyo económico, consulta/diagnóstico por chat. Bot = "orientación veterinaria 24/7". Las 5 características siempre en orden: todo México · mantienes veterinario · 3 mascotas · orientación 24/7 · 100% digital.

## Convenciones de trabajo
- Verificar cada cambio en navegador (preview `pata-amiga-dev`, puerto 3000) y en móvil 375px; commit por milestone y push.
- El Browser pane del usuario escala raro (hover/clicks desfasados) — verificar acciones vía BD/logs, no solo clicks; clicks sintéticos a veces no llegan a React (usar element.click() por JS).
- PostgREST: `pets`/`reimbursements` tienen 2 FKs a profiles → embeber con `profiles!user_id(...)` / `pets!user_id(...)`.
- Fotos de landing/materiales: editables desde Admin → Sitio web (tabla site_assets); no hardcodear. Los `brand#.png` de esta carpeta tienen marco oscuro — recortar bordes.
- Emails: SIEMPRE vía `sendTemplatedEmail` (plantillas editables en /admin/comunicados). Alertas equipo: `notifyTeam`/`reportError` (`src/lib/alerts.ts`).

## Landings de campaña (patrocinadores/ads)
/landings/regalo activa; registro en `src/lib/landings.ts`; CRM en /admin/landings (cupón, PDF ya subido, reenviar, CSV, chips de conversión a miembro). Guía: `docs/LANDINGS.md`. Cupón: falta la palabra (y crearla como promotion code en Stripe — manual). Checkout ya acepta códigos promocionales.

## Aprendizajes del proyecto (metodología, herramientas, tips)

**Metodología que funciona aquí**
- Ciclo por milestone: extraer diseño del handoff (.dc.html por turnos) → migración BD → server actions → UI → verificar E2E en navegador (desktop + móvil 375px) → commit descriptivo → push (staging auto-deploya). Nunca marcar algo "verificado" sin probarlo con datos reales en la BD.
- El repo anterior (clonar JorgeVexus/Club-Pata-Amiga-Form con --depth 1 --filter=blob:limit=200k a scratchpad) es la fuente de reglas de negocio olvidadas: banking step, apelaciones (máx 2, action_required), textos legales (src/data/legal-terms.ts), campos de mascota (coat/nose/eye color, adopted), popups welcome_shown, BillingModal CFDI. SIEMPRE minarlo antes de diseñar un feature "nuevo".
- Higgsfield MCP: upscale_image para crops chicos (brand#.png son screenshots 590px CON MARCO OSCURO — recortar 1.4% de bordes), outpaint_image para completar fotos cortadas, remove_background tras outpaint (rellena fondo negro). Flujo: subir crop a site-assets → media_import_url → job → descargar raw → PIL resize ≤1600px → WEBP q82 → publicar slot.
- Assets/contenido editable = tablas site_assets/site_settings + slots registrados en código: el equipo cambia fotos, cupones, materiales y destinatarios sin deploys. Extender ese patrón antes de hardcodear nada.

**Trampas técnicas descubiertas**
- PostgREST: pets/reimbursements tienen 2 FKs a profiles → SIEMPRE `profiles!user_id(...)` / `pets!user_id(...)` o error "more than one relationship".
- Tras signInWithPassword usar `window.location.assign(dest)` (NO router.push): el push corre antes de que la cookie llegue al server y el login "se atora". Admins → /admin por rol (login + auth/callback).
- Emojis NO se recolorean con CSS (huellitas 🐾 → SVG currentColor). Marquee CSS: contenido duplicado + translateX(-50%); una mitad debe ser ≥ ancho de pantalla (3 repeticiones) o deja hueco; hover-pause solo `@media (hover:hover)` (en táctil el hover se pega); NO usar prefers-reduced-motion aquí (decisión de marca).
- Confirmación de correo cross-device: la pantalla "revisa tu correo" hace polling con signInWithPassword cada 4s hasta que Supabase acepte.
- Supabase email nativo tiene rate limit (~2-4/hr) → configurar SMTP custom con Resend (smtp.resend.com, user "resend", pass = API key) en Auth → SMTP Settings.
- Resend con API key de prueba solo entrega a correos verificados → estatus "FALLÓ" en dev con @example.com es normal.
- sendTemplatedEmail devuelve boolean (éxito real); todos los correos van por plantillas editables (/admin/comunicados) con {{variables}} — nunca HTML inline en actions.
- Storage: no se puede DELETE de storage.objects por SQL — usar Storage API. AVIF se abre con PIL. pypdf lee los PDFs (no hay poppler/LibreOffice en esta máquina; DOCX→PDF vía Word COM en PowerShell).
- El Browser pane del usuario escala raro; clicks sintéticos a veces no llegan a React → usar element.click() por JS y verificar en BD/logs. navigator.clipboard requiere gesto real del usuario (probar copy en navegador real).
- docx (npm) NO está preinstalado aquí: npm install en scratchpad; tablas requieren columnWidths + width por celda en DXA.

**UX esenciales que el cliente espera siempre**
- Mostrar/Ocultar en TODOS los campos de contraseña; logout visible (sidebar + Mi cuenta + admin); logo de Google en botones OAuth; bordes visibles en inputs sobre fondos blancos; avisos condicionales (senior 10+ solo si aplica); flujos de miembro sin stepper de registro; móvil 375px SIEMPRE; gráficas y campana también en admin.

## Pendiente (a 14-jul-2026) — plataforma COMPLETA en features
Por construir: migración Memberstack (necesita export) · Sepomex a tabla propia · cron recordatorios renovación. Bloqueado por insumos: convenio-asociado (legal) · materiales embajador · palabra cupón · fotos finales. Producción: checklist completo en `docs/PRODUCCION.md` (cuentas live, 13 env vars, dominio, cutover). Avance detallado: `docs/ESTADO-DEL-PROYECTO.md`.
