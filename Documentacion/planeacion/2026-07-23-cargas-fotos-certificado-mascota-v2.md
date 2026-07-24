# Cargas de fotos y certificado V2 - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernizar los controles de carga de fotografías y certificado médico en el alta de mascotas del dashboard unificado.

**Architecture:** El cambio se encapsula bajo `#pata-add-modal.pata-add-modal-v2` dentro del widget existente. Se mantienen los inputs, ids, eventos y llamadas de carga; únicamente se sustituyen el markup visual y los estados dinámicos por clases V2.

**Tech Stack:** JavaScript vanilla, plantillas HTML, CSS encapsulado y pruebas con `node:test`.

---

### Task 1: Proteger el lenguaje visual V2

**Files:**
- Modify: `tests/widgets/unified-membership-dashboard-v2.test.js`

- [x] Agregar una prueba que exija clases V2 para el álbum, cada slot, el icono y el certificado.
- [x] Comprobar que los controles nuevos no usen emojis de cámara/documento ni bordes negros inline.
- [x] Ejecutar `node tests/widgets/unified-membership-dashboard-v2.test.js` y confirmar que falle por las clases faltantes.

### Task 2: Modernizar cargas y estados

**Files:**
- Modify: `public/widgets/pet-cards-widget.js`

- [x] Añadir estilos encapsulados para grid, slot, icono, etiqueta, certificado y estados `has-file`.
- [x] Reemplazar los emojis por Material Symbols ya disponibles en el widget.
- [x] Centrar el bloque completo del certificado con dimensiones estables en móvil y escritorio.
- [x] Actualizar el markup generado después de cada carga para conservar el nuevo estilo.
- [x] Ejecutar la prueba focalizada y confirmar que pase.

### Task 3: Verificación

**Files:**
- Verify: `public/widgets/pet-cards-widget.js`
- Verify: `tests/widgets/unified-membership-dashboard-v2.test.js`

- [x] Validar visualmente el modal local en viewport móvil.
- [x] Ejecutar pruebas de regresión del dashboard y alta de mascotas.
- [x] Ejecutar `npm run type-check`, `npm run lint` y `npm run build`.
- [x] Revisar `git diff --check` y solicitar autorización antes de commit o push.
