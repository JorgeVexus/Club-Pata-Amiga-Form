# Ocultar código de embajador en registro v2 — Plan de implementación

> **Para agentes:** usar `superpowers:executing-plans` para ejecutar este plan paso a paso. No crear worktree ni hacer commit sin autorización explícita del usuario.

**Objetivo:** Ocultar temporalmente la entrada del código de embajador en el paso 3 sin eliminar ni desactivar su lógica existente.

**Arquitectura:** Una constante local de visibilidad gobernará exclusivamente el renderizado de la sección de referido. La recuperación, validación y propagación de códigos existentes permanecerá intacta.

**Stack:** Next.js 15, React 19, TypeScript y CSS Modules.

---

### Tarea 1: Crear una verificación estática inicialmente fallida

**Archivos:**
- Crear: `scripts/check-step3-ambassador-visibility.mjs`
- Inspeccionar: `src/components/RegistrationV2/steps/Step3PlanSelection.tsx`

- [ ] Crear un script Node que lea el componente y compruebe que contiene `const SHOW_AMBASSADOR_CODE = false;` y `{SHOW_AMBASSADOR_CODE && (`.
- [ ] Ejecutar `node scripts/check-step3-ambassador-visibility.mjs`.
- [ ] Confirmar que falla porque el control de visibilidad todavía no existe.

### Tarea 2: Ocultar el bloque visual

**Archivos:**
- Modificar: `src/components/RegistrationV2/steps/Step3PlanSelection.tsx`

- [ ] Añadir `const SHOW_AMBASSADOR_CODE = false;` cerca de las interfaces del componente.
- [ ] Envolver el bloque completo `.referralSection` con `{SHOW_AMBASSADOR_CODE && (...)}`.
- [ ] No cambiar estados, efectos, validación, API, Memberstack, checkout ni CSS.
- [ ] Ejecutar `node scripts/check-step3-ambassador-visibility.mjs` y confirmar que pasa.

### Tarea 3: Verificación sistemática

**Archivos:**
- Auditar: `src/components/RegistrationV2/steps/Step3PlanSelection.tsx`
- Auditar: `scripts/check-step3-ambassador-visibility.mjs`

- [ ] Revisar el diff para comprobar que sólo cambió la visibilidad de la interfaz.
- [ ] Ejecutar `npm run build` y confirmar salida exitosa.
- [ ] Ejecutar `npm run type-check` y confirmar salida exitosa.
- [ ] Ejecutar `npm run lint` y confirmar salida exitosa, o documentar si el comando ya está roto por la configuración existente.
- [ ] Ejecutar la verificación estática nuevamente.
- [ ] Notificar la finalización mediante Telegram según las reglas del proyecto.
- [ ] Presentar el resumen y solicitar autorización antes de cualquier commit.
