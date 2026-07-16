# Adaptación visual integral del registro v2 — Plan de implementación

> **Para agentes:** ejecutar este plan en línea, tarea por tarea, sobre `main`. No crear ramas ni worktrees. No hacer commit ni push sin autorización explícita del usuario.

**Objetivo:** Aplicar a todo el registro v2 el sistema visual del repositorio actualizado `Chepiztrike/pata-amiga`, preservando literalmente los copys y toda la lógica actual.

**Arquitectura:** La adaptación se concentra en CSS Modules y en estructura JSX puramente presentacional. `NewRegistrationFlow` sigue siendo el orquestador; los componentes de pasos conservan props, callbacks, persistencia e integraciones. Los tokens visuales se encapsulan en el contenedor del registro para no alterar otras áreas de la aplicación.

**Stack:** Next.js 15, React 19, TypeScript, CSS Modules, Memberstack, Supabase y Stripe.

---

### Tarea 1: Establecer la base visual compartida

**Archivos:**
- Modificar: `src/components/RegistrationV2/NewRegistrationFlow.module.css`
- Modificar: `src/components/RegistrationV2/NavbarRedesign.module.css`
- Modificar: `src/components/RegistrationV2/BenefitsBanner.module.css`

- [ ] Sustituir el fondo gris degradado por crema `#FAF7F1` y declarar tokens locales de color, radio, borde y sombra.
- [ ] Adaptar navbar, beneficio móvil, carga, guardado y redirección al encabezado compacto y superficies del diseño de referencia.
- [ ] Verificar que los selectores permanezcan limitados a `RegistrationV2`.

### Tarea 2: Unificar navegación y progreso

**Archivos:**
- Modificar: `src/components/RegistrationV2/StepIndicator.tsx`
- Modificar: `src/components/RegistrationV2/StepIndicator.module.css`
- Modificar: `src/components/RegistrationV2/NewRegistrationFlow.tsx`

- [ ] Representar el progreso con píldoras en escritorio y segmentos en móvil.
- [ ] Mantener los nombres y copys actuales de cada etapa.
- [ ] Mostrar progreso coherente también en pasos postpago sin cambiar la navegación.

### Tarea 3: Adaptar los pasos prepago

**Archivos:**
- Modificar: `src/components/RegistrationV2/steps/Step1Account.module.css`
- Modificar: `src/components/RegistrationV2/steps/Step2PetBasic.module.css`
- Modificar: `src/components/RegistrationV2/steps/Step3PlanSelection.module.css`
- Modificar: `src/components/RegistrationV2/steps/steps.module.css`

- [ ] Aplicar contenedores estrechos, títulos Fraiche, tarjetas blancas y campos de radio medio.
- [ ] Homologar botones y controles con estados hover, focus-visible, pressed y disabled.
- [ ] Conservar literalmente textos, validaciones y mensajes existentes.
- [ ] Revisar selectores de mascota y planes en escritorio y móvil.

### Tarea 4: Adaptar pago y pasos postpago

**Archivos:**
- Modificar: `src/components/RegistrationV2/steps/Step3_5PaymentSuccess.module.css`
- Modificar: `src/components/RegistrationV2/steps/Step4CompleteProfile.module.css`
- Modificar: `src/components/RegistrationV2/steps/Step5CompletePet.module.css`
- Modificar: `src/components/RegistrationV2/steps/BillingModal.module.css`

- [ ] Llevar pago exitoso y transición al patrón de confirmación del nuevo diseño.
- [ ] Aplicar la misma jerarquía visual a perfil, documentos y expediente de mascota.
- [ ] Homologar uploads, avisos, errores, modales y botones sin modificar manejadores.

### Tarea 5: Adaptar confirmación final y estados auxiliares

**Archivos:**
- Modificar: `src/components/RegistrationV2/steps/Step6Success.module.css`
- Modificar: `src/components/RegistrationV2/TermsModalEnhanced.module.css`
- Modificar: `src/components/RegistrationV2/AgeInput.module.css`
- Modificar: `src/components/RegistrationV2/NationalitySelect.module.css`
- Modificar: `src/components/RegistrationV2/PetTypeSelector.module.css`

- [ ] Adaptar confirmación final al fondo turquesa y composición “Bienvenido a la manada”.
- [ ] Homologar modales y controles auxiliares con los tokens compartidos.
- [ ] Confirmar foco visible, contraste y áreas táctiles de al menos 44px.

### Tarea 6: Auditoría sistemática y verificación

**Archivos:**
- Revisar: todos los archivos modificados en las tareas 1–5.

- [ ] Revisar el diff para detectar cambios accidentales en lógica o copy.
- [ ] Buscar overflow, alturas fijas problemáticas y regresiones responsive.
- [ ] Ejecutar `npm run build` y corregir cualquier fallo.
- [ ] Ejecutar `npm run type-check` y corregir cualquier fallo.
- [ ] Ejecutar `npm run lint` y corregir cualquier fallo atribuible al cambio.
- [ ] Iniciar el servidor local y validar que `/registro?step=1` responde correctamente.
- [ ] Entregar la URL local para revisión visual sin hacer commit ni push.
