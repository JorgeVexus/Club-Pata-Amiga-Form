# Club Pata Amiga — Estado del proyecto

> **Fecha:** 14 de julio de 2026 · **Repo:** github.com/Chepiztrike/pata-amiga
> Plataforma nueva (Next.js + Supabase + Stripe) que reemplaza Webflow + Memberstack + widgets.
> Todo lo listado corre hoy en el ambiente de desarrollo con cuentas de PRUEBA (sin dinero real).

> **Etapa en curso (28-jul-2026): portal de ventas.** El plan completo (8 secciones)
> vive en [`docs/portal-ventas/`](portal-ventas/README.md), y
> [`HANDOFF.md`](portal-ventas/HANDOFF.md) dice exactamente dónde nos quedamos.
> Construido: cimientos, contactos y pipelines, bandeja de conversaciones con
> correo y gobierno de los agentes, la sección de membresías completa (planes
> versionados en Stripe, cupones, cambio de plan y migración de cohortes), el
> calendario de contenido con su circuito de aprobación y su publicador, y el
> boletín con sus dos agentes, sus tres compuertas, su envío por lotes y la
> baja sin sesión, el agente demo para cuentas sin membresía (apagado por
> omisión) y los tableros con su embudo, sus reportes y su exportación.
> **Las 7 secciones del plan están construidas** y el **histórico de LynSales ya
> está importado** (452 contactos de las 995 filas del export: las 543 sin correo
> ni teléfono se descartan por acuerdo con el cliente, y cada contacto entró con
> su fecha de alta real, no con la de la importación). Lo que queda: verificar
> los agentes con la llave de IA conectada y el checklist de producción.
> Punto de retorno del estado anterior: etiqueta `v1.0-plataforma-base` (commit `cdf68e7`)
> más el volcado de la base y de Storage en `006_Pata_Amiga/backups/2026-07-26-checkpoint-v1.0/`.

> **Lote de arreglos (29-jul-2026, commit `99ffcf0`).** Se atendió el reporte del
> programador del cliente: la landing pública `/embajadores` estaba detrás del
> guard del portal privado, y había 12 errores de lint acumulados. Todo
> corregido de raíz (cero `eslint-disable`), el árbol quedó en 0 errores y 0
> advertencias, y se agregó una reja de CI (lint + tipos) porque Next 16 dejó de
> correr ESLint dentro de `next build` — que es justo por lo que se acumularon
> sin que nadie los viera. Al verificar salieron dos más que nadie había
> reportado: `/admin/conversaciones` tronaba con error 500 y dejaba la bandeja
> entera caída (el canal `email` no estaba en el mapa de canales), y los paneles
> de las dos campanas se salían de la pantalla en móvil. Detalle en
> [`docs/fixes-reporte-coder.md`](fixes-reporte-coder.md).

> ⚠️ **Staging está congelado desde el 27-jul 19:41 (commit `58cf99a`).** La
> cuenta de Vercel está en Hobby, que permite 2 tareas programadas diarias, y
> `vercel.json` declara 5 (tres cada pocos minutos): Vercel rechaza el
> despliegue. Decisión tomada: **no se recortan los crones** — son
> funcionalidad viva y el plan sube a Pro para producción. Todo lo de F2c en
> adelante corre en local pero **no** está en
> https://pata-amiga-one.vercel.app. Ver [`docs/PRODUCCION.md`](PRODUCCION.md).

---

## 1. Puntos a tratar con el equipo

| # | Tema | Qué se necesita decidir / entregar | Responsable sugerido |
|---|------|-----------------------------------|----------------------|
| 1 | **Comisiones de embajador** | Confirmar montos: hoy $16 MXN (mensual) / $170 MXN (anual), ~10 %. Son editables en código (`src/lib/constants.ts`). | Negocio |
| 2 | **Documentos legales** | a) Falta el **Convenio asociado** (no existía en el repo anterior). b) Los 5 documentos publicados son v1.0 (feb 2026) y usan terminología previa ("apoyo económico"); el despacho debe emitir versiones con la terminología 2026 ("reintegro"). | Legal |
| 3 | **Facturación CFDI** | La plataforma ya captura los datos fiscales del miembro. Decidir: ¿emisión con PAC (Facturama, SW Sapien…) integrada, o el contador factura manualmente con los datos del expediente? | Contabilidad |
| 4 | **Cuentas de producción** | Crear/entregar: Supabase (prod), Stripe (live, con los precios reales), Resend + verificación del dominio pataamiga.mx (correos transaccionales), API key del LLM para la orientación veterinaria (Anthropic), cuenta Vercel. Hoy TODO es de prueba. | Dirección / Dev |
| 5 | **Banco para dispersiones** | ¿Con qué banco se harán las transferencias masivas (SPEI)? El layout CSV actual es genérico (CLABE, beneficiario, banco, monto, concepto); se ajusta al formato exacto del banco elegido. | Finanzas |
| 6 | **Fotos y materiales** | Exportar del Drive las fotos finales de landing (se suben desde Admin → Sitio web, sin código) y los materiales de embajador (pack IG, video reintegro, guía de marca, campaña). | Marketing |
| 7 | **Migración de miembros** | Export de la base de Memberstack (correo, nombre, plan, mascotas) para el script de migración + aprobar el correo "activa tu nueva cuenta". | Dirección + Dev |
| 8 | **Notificaciones del equipo** | Definir qué correos reciben cada aviso (nuevo reintegro, apelación, embajador, centro, errores, reporte) en Admin → Sitio web → Notificaciones. | Operación |
| 9 | **Google OAuth producción** | El login con Google usa credenciales de desarrollo; crear las de producción en Google Cloud Console con el dominio final. | Dev |
| 10 | **Dominios** | Confirmar arquitectura: ¿todo en `pataamiga.mx` o app separada en `app.pataamiga.mx` como hoy? Afecta DNS, OAuth y Stripe. | Dirección + Dev |
| 11 | **Contenido FAQ / copy** | El FAQ de la landing se adaptó del sitio actual a la terminología 2026 — dar visto bueno. | Marketing |

## 2. Próximos pasos (orden propuesto)

1. **Deploy a staging (Vercel)** con las cuentas de prueba actuales → el equipo prueba desde una URL real en cualquier dispositivo. *Bloqueado solo por crear la cuenta Vercel.*
2. **Ronda de pruebas del equipo** (ver guía de pruebas abajo) y correcciones.
3. **Importar catálogo Sepomex** a tabla propia (hoy depende de un espejo externo para CP → colonia).
4. **Cron de recordatorios** de renovación + automatización del corte mensual de comisiones.
5. **Script de migración Memberstack** + campaña "activa tu cuenta".
6. (Si se decide) **Integración PAC** para emitir CFDI automáticamente.
7. **Agentes IA — ruta acordada en reunión 20-jul** (todo construido, corre en "modo demo"; guía: `docs/AGENTES-IA.md`):
   1. API key de Claude → staging → **sesión de pruebas destructivas** del equipo (romper/explotar los agentes hasta certificar sus respuestas).
   2. En paralelo: **tags y notificaciones por tipo de conversación** (ej. cliente pide llamada → correo al responsable + etiqueta; mapear escenarios de escalación). Extiende la escalación ❗ actual.
   3. Prueba integral de la web → versión final.
   4. App móvil iOS/Android.
   La app de Meta (revisión 1–3 semanas) se inicia cuanto antes, independiente de lo demás.
8. **Cutover a producción**: cuentas live, webhooks de Stripe, DNS, credenciales OAuth, prueba de pago real, apagar el sitio anterior.

---

## 3. Checklist de funcionalidades

**Leyenda:** ✅ construido y verificado en navegador (E2E) · 🟡 construido, falta verificación fina · ⬜ pendiente

### Sitio público

| Funcionalidad | Estado | Nota |
|---|:---:|---|
| Landing: hero + banda animada de beneficios | ✅ | Foto editable desde admin |
| Landing: beneficios, planes, ¿cómo funciona? (mockup teléfono) | ✅ | |
| Landing: FAQ con acordeón y hover | ✅ | Copy adaptado a terminología 2026 |
| Landing: sección red veterinaria + collage del sitio actual | ✅ | |
| Footer: contacto, redes (editables), newsletter, links legales | ✅ | Alta de newsletter guarda en BD |
| Páginas legales (términos, reintegros, integridad, cookies, privacidad) | ✅ | Textos v1.0 reales; falta convenio asociado |
| Directorio público de centros: búsqueda ciudad/CP + filtros por servicio | ✅ | |
| Registro de centro aliado (multi-servicio, multi-ubicación, CP→colonia) | ✅ | |
| Página del programa de embajadores + solicitud (CURP, 18+) | ✅ | |
| Responsive móvil (hero, marquee, formularios, footer) | ✅ | Verificado a 375 px |

### Registro y pago

| Funcionalidad | Estado | Nota |
|---|:---:|---|
| Alta de cuenta (correo/contraseña + Google) | ✅ | Google con credenciales dev |
| Registro de primera mascota (foto, especie, raza, edad) | ✅ | |
| Selección de plan + código de embajador (validación en vivo) | ✅ | |
| Link de embajador `/registro?codigo=X` con prefill | ✅ | |
| Checkout Stripe (mensual $159 / anual $1,699) | ✅ | Modo prueba |
| Webhook: activación, períodos de espera, referido, correo bienvenida | ✅ | Verificado con `stripe listen` |
| Banda de beneficios en registro móvil | ✅ | |

### Portal del miembro

| Funcionalidad | Estado | Nota |
|---|:---:|---|
| Dashboard (membresía, mascotas con barra de espera, actividad) | ✅ | |
| Campana de notificaciones (badge, marcar leídas) | ✅ | |
| Popup de bienvenida (una sola vez) | ✅ | |
| Mis peludos: hasta 3, seniors con certificado | ✅ | |
| Completar perfil: CURP, domicilio (CP→colonia), INE frente/reverso | 🟡 | Subida de INE no probada en navegador (mismo código que foto mascota, que sí) |
| Solicitud de reintegro (categorías, topes, factura, CLABE) | ✅ | |
| Apelación de reintegro rechazado (máx. 2) | ✅ | A-0001 probada de punta a punta |
| Apelación de mascota denegada | 🟡 | Misma lógica que reintegros; falta prueba en navegador |
| Orientación veterinaria 24/7 (chat con contexto de mascotas) | ✅ | Con proveedor simulado; falta probar con API real de Anthropic |
| Directorio de centros dentro de la app | ✅ | |
| Mi cuenta: cambio de plan (prorrateo), cancelar, reactivar | ✅ | |
| Mi cuenta: datos fiscales CFDI (RFC física/moral, régimen, uso) | ✅ | |

### Portal del embajador

| Funcionalidad | Estado | Nota |
|---|:---:|---|
| Dashboard: código (copiar/compartir/personalizar 1 vez), KPIs, referidos | ✅ | |
| Datos de pago (banco + CLABE con dígito verificador) | ✅ | |
| Materiales descargables (gestionados desde admin) + campaña temporal | 🟡 | Slots funcionan; falta subir archivos reales |
| Comisión automática al pagar un referido | ✅ | |
| Popup de bienvenida al ser aprobado | ✅ | |
| Login inteligente: embajador sin plan aterriza en /embajador, con banner para unirse como miembro; miembro+embajador navega entre paneles | ✅ | |

### Portal del miembro — notas del cliente 15-jul

| Funcionalidad | Estado | Nota |
|---|:---:|---|
| Alta de mascotas con reglas del sitio vivo: razas y colores con autocompletado, edad por rangos (mín. 4 meses), aviso senior 10+ | ✅ | Catálogos importados del repo anterior |
| Períodos de espera variables: 180 estándar · 150 adoptado raza · 120 adoptado mestizo · 90 con código embajador · 180 reemplazo | ✅ | Confirmado con el cliente; revisar textos legales |
| Ficha con etiquetas (Adoptado / Mestizo / Raza pura / Senior) y botón «Utilizar mis beneficios» al cumplir el período | ✅ | |
| Dar de baja mascotas con motivo — tarjeta gris de recuerdo, libera lugar | ✅ | |
| Mensajes con el comité ocultos hasta que el comité escribe | ✅ | |
| Botón de emergencia (guía + teléfono editable + aviso al equipo) | ✅ | Falta el teléfono real (Admin → Sitio web) |
| Mi cuenta: datos bancarios (prefill de reintegros) y cambio de contraseña; embajador/centro con contraseña y logout | ✅ | |
| Popup de bienvenida solo la primera vez (bandera en BD) | ✅ | |
| Teléfono +52 a 10 dígitos y correo con trim en registro/login | ✅ | |

### Notas del cliente 16-jul — reintegros, navegación y admin

| Funcionalidad | Estado | Nota |
|---|:---:|---|
| Saldos anuales de reintegro por categoría (usado/disponible, se renuevan en enero) | ✅ | Reglas del sitio vivo |
| Monto solicitado a elección del usuario + total pagado; documentos catalogados por motivo | ✅ | Etiquetas del sitio vivo |
| Titular de la cuenta + aviso de seguridad (texto exacto del sitio vivo) | ✅ | |
| Detalle clickeable de cada reintegro + hilo comité↔miembro por solicitud | ✅ | Conversaciones separadas por área |
| Portal del embajador con menú propio (Resumen · Métricas · Materiales · Cuenta) | ✅ | Barra inferior en móvil |
| Métricas del embajador con gráficas (altas/bajas/comisiones por mes); referidos anónimos | ✅ | Sin nombres, solo fechas |
| CURP con validación completa (dígito verificador) | ✅ | |
| Avatar con menú estilo Instagram para cambiar de panel (miembro/embajador/centro) | ✅ | |
| Top bar móvil del miembro con campana; sección Soporte en Mi cuenta | ✅ | |
| Botón de emergencia con número real +52 56 3954 5068 (editable en admin) | ✅ | |
| Admin móvil (nav horizontal con badges); métricas clickeables → su fuente; /admin/vet | ✅ | |
| Expediente del miembro completo (fotos, señas, INE, banco, historias) | ✅ | |

### Notas del cliente 16-jul (2) — panel, roles y apelaciones

| Funcionalidad | Estado | Nota |
|---|:---:|---|
| Popup de detalle al revisar mascotas/embajadores/centros/apelaciones (toda la info antes de decidir) | ✅ | Patrón del sitio vivo |
| Filtros por estado en las listas grandes del panel | ✅ | |
| Roles del sitio vivo: apelaciones y dar de baja cuentas = SOLO super admin; admins no ven el tab | ✅ | comite@ = admin · admin@ = super |
| Apelaciones: tab después de Miembros, «Cerrar caso», popup de detalle | ✅ | |
| Centros rechazados pueden apelar desde su dashboard (máx. 2); aceptar la apelación los aprueba | ✅ | Verificado E2E |
| Dar de baja cuenta (super admin): cancela Stripe al instante + aviso con plantilla editable | ✅ | |
| Finanzas: MRR con nombre completo + desglose por tarjeta (super admin) | ✅ | |
| Avisos por raza (183 razas): mensaje transparente y amable aprobado por el cliente | ✅ | Sin la palabra «cobertura» (tono 2026) |
| Toda resolución notifica al miembro y envía correo por plantilla editable | ✅ | Ya existía; verificado |

### Portal del centro aliado

| Funcionalidad | Estado | Nota |
|---|:---:|---|
| Dashboard /centro: editar beneficio, teléfono, sitio web y logo | ✅ | |
| Promociones: publicar, pausar/reactivar, borrar (visibles al instante en el directorio) | ✅ | Aviso al equipo al publicar |
| Servicios y ubicaciones en solo lectura (cambios vía comité) | ✅ | |
| Pantallas de solicitud pendiente/rechazada | ✅ | |
| Login inteligente: centro sin plan aterriza en /centro; solicitudes sin sesión se ligan por correo; miembro+centro navega entre paneles | ✅ | |
| Popup de bienvenida al ser aprobado | ✅ | |

### Panel del comité (admin)

| Funcionalidad | Estado | Nota |
|---|:---:|---|
| Resumen: KPIs, crecimiento, colas, salud del sistema | ✅ | |
| Enviar reporte de métricas por correo | 🟡 | Acción construida; falta ver el correo llegar (Resend en dev) |
| Búsqueda global (miembro, mascota, folio) | ✅ | R-#### salta al expediente |
| Cola de mascotas (aprobar/denegar con observaciones) | ✅ | |
| Cola de reintegros + detalle 5b (aprobar/parcial/rechazar, bypass super admin) | ✅ | |
| Cola de apelaciones (aceptar reabre / mantener con explicación) | ✅ | |
| Embajadores: aprobar con código automático, rechazar, corte mensual | ✅ | |
| Centros: aprobar (aparece en directorio) / rechazar | ✅ | |
| Miembros: directorio + expediente completo | ✅ | |
| Finanzas: MRR, cobros Stripe, mezcla de planes, salidas del mes | ✅ | |
| Layouts bancarios CSV (reintegros y comisiones) | ✅ | Formato genérico; se ajusta al banco elegido |
| Comunicados: 15 plantillas de correo editables con vista previa | ✅ | |
| Sitio web: fotos de landing, materiales, redes/contacto, notificaciones | ✅ | |
| Registro y alerta de errores del sistema (webhook, vet bot) | 🟡 | Código en su lugar; falta forzar un error real para ver la alerta |

### Infraestructura

| Funcionalidad | Estado | Nota |
|---|:---:|---|
| Supabase: esquema completo, RLS por rol, storage (buckets públicos/privados) | ✅ | |
| Correos transaccionales por plantilla (Resend) | ✅ | Dominio de envío de prueba; verificar pataamiga.mx en Resend para prod |
| Migraciones versionadas en `supabase/migrations/` | ✅ | 8 migraciones |
| Deploy a Vercel | ⬜ | Siguiente paso |
| Migración de miembros Memberstack | ⬜ | Necesita export |
| Sepomex en tabla propia | ⬜ | Hoy usa espejo externo con fallback |
| Cron de recordatorios de renovación | ⬜ | |
| Emisión CFDI (PAC) | ⬜ | Hoy: captura de datos + expediente |

---

## 4. Guía rápida de pruebas (staging)

**Cuentas de prueba** (ambiente dev — sin dinero real):

- Miembro: `prueba@pataamiga.dev` / `Prueba1234!` (plan anual, mascota Max, es embajadora PATAMIGA-CIPA)
- Embajador sin membresía: `embajador@pataamiga.dev` / `Embajador1234!` (código PATAMIGA-EQUIPO)
- Centro aliado: `centro@pataamiga.dev` / `Centro1234!` ("Centro de Bienestar Peludo Feliz", con promociones)
- Admin: `admin@pataamiga.dev` / `Admin1234!` (super admin "Rocío")
- Tarjeta de prueba Stripe: `4242 4242 4242 4242`, cualquier fecha futura y CVC.

**Flujos sugeridos para el equipo:**

1. Registro completo: crear cuenta nueva (correo real tipo gmail) → mascota → pagar con la tarjeta de prueba → revisar correo de bienvenida.
2. Completar perfil (CP real para probar colonia automática) y enviar un reintegro con cualquier foto como factura.
3. Como admin: resolver el reintegro, aprobar la mascota, revisar el expediente del miembro.
4. Apelar un rechazo como miembro y resolverlo como admin.
5. Probar la orientación veterinaria 24/7 desde el móvil.
6. Registrar un centro aliado y un embajador desde la landing; aprobarlos como admin.
7. Editar una plantilla de correo y subir una foto de landing desde Admin → Sitio web.

Reportar hallazgos con: página, pasos, qué esperaban vs. qué pasó, y captura de pantalla.
