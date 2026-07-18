# Redirección de perfil incompleto al iniciar sesión — Plan de implementación

> **Para agentes:** usar `superpowers:executing-plans` en esta sesión. Trabajar directamente en `main` y no hacer commit ni push sin autorización explícita.

**Objetivo:** Enviar a los miembros con plan activo y registro incompleto a la página Webflow de completar perfil.

**Arquitectura:** Una función pura determinará si faltan datos personales, mascotas activas o campos de mascota. La API de roles devolverá `incomplete_profile` y los dos scripts públicos de login priorizarán el destino entregado por el servidor.

**Stack:** Next.js, TypeScript, Supabase, Memberstack, JavaScript para widgets y `node:test`.

---

### Tarea 1: Definir el comportamiento con pruebas fallidas

**Archivos:**
- Modificar: `tests/registration-completeness.test.mjs`
- Crear: `tests/login-incomplete-profile-redirect.test.mjs`

- [ ] Probar usuario inexistente, datos personales faltantes, cero mascotas, mascota incompleta y perfil completo.
- [ ] Probar que la ruta expone `incomplete_profile` y la URL Webflow.
- [ ] Probar que ambos redirectores manejan `incomplete_profile` antes de `member` y usan `data.redirectUrl`.
- [ ] Ejecutar ambas pruebas y confirmar que fallan por la ausencia del nuevo contrato.

### Tarea 2: Implementar la evaluación pura

**Archivos:**
- Modificar: `src/utils/registration-completeness.js`
- Modificar: `src/utils/registration-completeness.d.ts`

- [ ] Añadir `getMemberCompletionIssue(user, pets)` con los mismos requisitos del widget.
- [ ] Excluir mascotas inactivas y dadas de baja.
- [ ] Devolver `missing_member_info`, `missing_pet`, `incomplete_pet` o `null`.
- [ ] Ejecutar las pruebas de utilidad y confirmar que pasan.

### Tarea 3: Conectar el contrato backend

**Archivos:**
- Modificar: `src/app/api/auth/check-role/route.ts`

- [ ] Tras confirmar un plan activo, consultar usuario y mascotas.
- [ ] Devolver `role: incomplete_profile`, `registrationIssue` y `redirectUrl` cuando corresponda.
- [ ] Ante error de Supabase, registrar el diagnóstico y conservar el comportamiento actual.
- [ ] Ejecutar type-check y las pruebas específicas.

### Tarea 4: Conectar los redirectores Webflow

**Archivos:**
- Modificar: `public/widgets/login-redirect-enhanced.js`
- Modificar: `public/widgets/login-redirect-enhanced-v2.js`

- [ ] Añadir el destino por defecto `incomplete_profile`.
- [ ] Manejar el caso antes de `member`.
- [ ] Preferir `data.redirectUrl` y usar la URL Webflow como fallback.
- [ ] Ejecutar la prueba de integración estática y confirmar que pasa.

### Tarea 5: QA y entrega

**Archivos:**
- Auditar todos los archivos anteriores.

- [ ] Ejecutar todas las pruebas relacionadas.
- [ ] Ejecutar `npm run build`.
- [ ] Ejecutar `npm run type-check`.
- [ ] Ejecutar `npm run lint`.
- [ ] Revisar el diff y confirmar que no cambió la prioridad de roles ni el flujo de pago.
- [ ] Enviar la notificación Telegram obligatoria.
- [ ] Explicar si Webflow requiere reemplazar código inline o sólo conservar el `<script src>`.
- [ ] Solicitar autorización antes de commit o push.

### Tarea 6: Corregir la salida del widget completo

**Archivos:**
- Modificar: `tests/complete-profile-member-info.test.mjs`
- Modificar: `public/widgets/complete-profile-widget.js`

- [ ] Añadir una prueba que rechace `window.location.reload()` en el botón “Ver mi perfil”.
- [ ] Exigir el destino `https://www.pataamiga.mx/pets/pet-waiting-period`.
- [ ] Ejecutar la prueba y confirmar que falla con la implementación anterior.
- [ ] Cambiar exclusivamente el destino del botón.
- [ ] Repetir pruebas, build, type-check y lint.
