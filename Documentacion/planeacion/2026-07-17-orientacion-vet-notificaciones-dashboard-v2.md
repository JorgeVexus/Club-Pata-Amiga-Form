# Orientación veterinaria y notificaciones Dashboard V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrar el Vet Bot como vista interna exclusiva para miembros con plan activo y conectar una campana de notificaciones con el diseño del repositorio nuevo.

**Architecture:** El widget unificado controlará una nueva vista `vet` accesible desde escritorio y móvil. `vet-bot.js` expondrá un montaje explícito en modo contenedor y conservará la validación Memberstack y el token de sesión. La campana consumirá exclusivamente las API Routes de notificaciones mediante un controlador embebido en el widget, sin cliente Supabase en el navegador.

**Tech Stack:** JavaScript ES2020, Memberstack DOM, Next.js API Routes, Chatbot Builder container mode, CSS aislado del Dashboard V2, Node Test Runner.

---

### Task 1: Contratos de navegación, chat y notificaciones

**Files:**
- Modify: `tests/widgets/unified-membership-dashboard-v2.test.js`
- Create: `tests/widgets/vet-bot-container.test.js`

- [ ] **Step 1: Escribir pruebas fallidas de navegación interna**

Agregar aserciones que exijan `showVetV2()`, estado `v2View === 'vet'`, botones internos en sidebar, barra móvil y cabecera, además de los contenedores `pata-v2-vet-chat` y `pata-v2-notifications`.

- [ ] **Step 2: Escribir pruebas fallidas del contrato del bot**

Exigir que `vet-bot.js` exponga `window.PataVetBot.mount`, configure `type: 'container'`, reciba `element`, mantenga `planConnections.some(...)` y no ejecute una burbuja flotante automáticamente.

- [ ] **Step 3: Ejecutar las pruebas y confirmar RED**

Run: `node --test tests/widgets/unified-membership-dashboard-v2.test.js tests/widgets/vet-bot-container.test.js`

Expected: FAIL porque la vista interna, el controlador y el montaje en contenedor todavía no existen.

### Task 2: Vet Bot montable y protegido

**Files:**
- Modify: `public/widgets/vet-bot.js`

- [ ] **Step 1: Exponer una API idempotente de montaje**

Implementar `window.PataVetBot.mount({ element })`, resolver el selector o nodo solicitado y reutilizar una única promesa de carga del plugin.

- [ ] **Step 2: Conservar autenticación y elegibilidad**

Mantener la lectura de Memberstack, exigir al menos un `planConnection` con estado `ACTIVE`, generar `/api/auth/session-token` y enviar email, nombre y campos personalizados al bot.

- [ ] **Step 3: Configurar Chatbot Builder en modo contenedor**

Invocar `ktt10.setup` con `type: 'container'`, `element`, `hideHeader: true` y `loadMessages: true`. Renderizar estados locales de carga, sesión requerida, plan requerido y error dentro del contenedor.

- [ ] **Step 4: Ejecutar pruebas y confirmar GREEN**

Run: `node --test tests/widgets/vet-bot-container.test.js`

Expected: PASS.

### Task 3: Vista interna de orientación veterinaria

**Files:**
- Modify: `public/widgets/unified-membership-widget.js`
- Modify: `public/widgets/dashboard-v2-preview.html`

- [ ] **Step 1: Añadir estado y navegación**

Aceptar `section=vet`, implementar `showVetV2()` y reemplazar los enlaces externos de sidebar, cabecera, cabecera móvil y barra inferior por botones que abran esa vista.

- [ ] **Step 2: Renderizar el diseño del repositorio nuevo**

Crear un panel de altura útil con encabezado, aviso de alcance veterinario, área `#pata-v2-vet-chat`, estados accesibles y composición responsive coherente con el fondo beige, turquesa y tipografías actuales.

- [ ] **Step 3: Montar el bot después del render**

Cargar `vet-bot.js` una sola vez si hace falta y llamar `window.PataVetBot.mount({ element: '#pata-v2-vet-chat' })` cuando `v2View` sea `vet`.

- [ ] **Step 4: Mantener el preview verificable**

Permitir que el preview local muestre el shell del chat sin depender de una sesión productiva, sin falsificar una conversación real.

### Task 4: Campana conectada con el nuevo diseño

**Files:**
- Modify: `public/widgets/unified-membership-widget.js`
- Modify: `tests/widgets/unified-membership-dashboard-v2.test.js`

- [ ] **Step 1: Exigir el contrato API-first en pruebas**

Agregar aserciones para `/api/notifications`, `mark-all-read`, lectura individual, contador no leído y ausencia de `supabase.createClient`.

- [ ] **Step 2: Implementar el controlador de notificaciones**

Cargar las últimas diez notificaciones con el ID Memberstack, refrescar cada cinco segundos solamente mientras el widget esté montado, detectar nuevas entradas y mantener actualización optimista al marcar como leídas.

- [ ] **Step 3: Renderizar campana y dropdown**

Crear botón circular, badge turquesa, panel blanco con encabezado, lista, estados de carga/error/vacío, hora relativa y acción “Marcar leídas”, siguiendo colores, radios, sombras y tipografía del repositorio nuevo.

- [ ] **Step 4: Añadir comportamiento accesible y responsive**

Implementar `aria-expanded`, cierre exterior, Escape, foco visible y panel contenido en el viewport móvil.

- [ ] **Step 5: Ejecutar pruebas y confirmar GREEN**

Run: `node --test tests/widgets/unified-membership-dashboard-v2.test.js tests/widgets/vet-bot-container.test.js`

Expected: PASS.

### Task 5: Auditoría y verificación de entrega

**Files:**
- Modify: `Documentacion/planeacion/2026-07-17-orientacion-vet-notificaciones-dashboard-v2.md`

- [ ] **Step 1: Revisar regresiones**

Validar navegación de Inicio, Peludos, Reintegros, Centros, Embajadores, cierre de sesión, estados sin sesión y plan inactivo.

- [ ] **Step 2: Buscar errores de codificación**

Run: `rg -n "Ã|Â|â|ðŸ|&Aacute;|&iacute;" public/widgets/vet-bot.js public/widgets/unified-membership-widget.js`

Expected: ninguna cadena nueva visible con mojibake; cualquier coincidencia histórica fuera del cambio debe documentarse sin ampliación de alcance.

- [ ] **Step 3: Ejecutar controles obligatorios**

Run: `npm run type-check`

Run: `npm run build`

Run: `npm run lint`

Expected: type-check y build con exit 0; lint sin errores nuevos atribuibles a estos archivos.

- [ ] **Step 4: Entregar URL local para revisión**

Usar `http://127.0.0.1:3000/widgets/dashboard-v2-preview.html?section=vet&notifications=1` y esperar autorización explícita antes de commit o push.
