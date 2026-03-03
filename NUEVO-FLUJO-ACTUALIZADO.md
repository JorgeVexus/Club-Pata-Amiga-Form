# Nuevo Flujo de Registro - Actualización

> **Fecha:** 26 de Febrero 2026  
> **Estado:** Actualizado con persistencia y modal de términos mejorado

---

## ✅ Cambios Implementados

### 1. Persistencia Completa en Supabase

Cada paso ahora **guarda automáticamente** en Supabase al avanzar:

| Paso | Datos Guardados |
|------|-----------------|
| 1. Cuenta | email, registration_step |
| 2. Mascota básica | pet_type, pet_name, pet_age, pet_age_unit |
| 3. Plan | plan_id, payment_status |
| 4. Perfil | Datos personales completos |
| 5. Mascota | Datos complementarios |

**Al regresar a un paso anterior**, se cargan los datos desde Supabase automáticamente.

### 2. Modal de Términos Mejorado

**Antes:**
- Múltiples checkboxes en la página
- Modal solo mostraba documentos

**Después:**
- **Solo UN checkbox** en la página principal
- Click en "Ver términos" abre el modal mejorado
- **Dentro del modal:**
  - Documentos legales descargables
  - Botón "Aceptar todo"
  - Todos los checkboxes de términos/consentimientos
  - Validación de campos requeridos
  - Persistencia de aceptación (24 horas)

#### Componentes Nuevos:
- `TermsModalEnhanced.tsx` - Modal con todos los checkboxes integrados
- `TermsModalEnhanced.module.css` - Estilos del modal

### 3. Indicador de Guardado

Se agregó un indicador visual cuando se están guardando los datos:
```
⚪ Guardando...
```

### 4. Carga de Datos al Navegar

Cada paso ahora:
1. Carga datos guardados de Supabase al montar
2. Pre-llena los campos con los datos existentes
3. Permite modificar y guardar nuevamente

---

## 🔄 Flujo de Persistencia

```
Usuario avanza paso 1 → 2
    ↓
Guarda en Supabase (email)
    ↓
Usuario completa paso 2
    ↓
Guarda en Supabase (datos mascota)
    ↓
Usuario regresa a paso 1
    ↓
Carga email desde Supabase
    ↓
Usuario modifica datos
    ↓
Guarda actualización en Supabase
```

---

## 📁 Archivos Actualizados

### Componentes Principales
```
src/components/RegistrationV2/
├── NewRegistrationFlow.tsx          # Persistencia completa
├── NewRegistrationFlow.module.css   # Indicador de guardado
├── TermsModalEnhanced.tsx           # NUEVO - Modal mejorado
├── TermsModalEnhanced.module.css    # NUEVO - Estilos modal
└── steps/
    ├── Step1Account.tsx             # Carga email guardado
    ├── Step2PetBasic.tsx            # Carga datos mascota
    ├── Step3PlanSelection.tsx       # Modal de términos integrado
    ├── Step4CompleteProfile.tsx     # Carga datos perfil
    ├── Step5CompletePet.tsx         # Carga datos complementarios
    └── steps.module.css             # Estilos checkbox términos
```

---

## 🎯 Funcionalidades Clave

### Persistencia
- ✅ Guardado automático en cada paso
- ✅ Carga de datos al regresar
- ✅ Indicador visual de guardado
- ✅ Memberstack ID como clave de sincronización

### Modal de Términos
- ✅ Un solo checkbox en página
- ✅ Modal con documentos legales
- ✅ Todos los consentimientos en el modal
- ✅ Botón "Aceptar todo"
- ✅ Validación de requeridos
- ✅ Persistencia 24 horas

### Integración
- ✅ Memberstack (crear usuario, custom fields, checkout)
- ✅ Supabase (guardar/cargar datos)
- ✅ SEPOMEX (dirección con cache)
- ✅ Catálogos (razas, colores, nacionalidades)

---

## 🚀 Cómo Probar

### 1. Persistencia
```bash
npm run dev
```
1. Abrir `http://localhost:3000/registro-v2`
2. Completar paso 1 (crear cuenta)
3. Completar paso 2 (datos mascota)
4. **Recargar la página**
5. Los datos deben estar pre-llenos

### 2. Modal de Términos
1. Ir al paso 3 (Plan)
2. Seleccionar un plan
3. Click en "Ver términos y condiciones"
4. Verificar que muestre:
   - Documentos legales
   - Checkboxes de términos
   - Botón "Aceptar todo"
5. Aceptar términos
6. Verificar que el checkbox principal se marque

### 3. Navegación
1. Avanzar al paso 3
2. Click en "Atrás" hasta paso 1
3. Verificar que los datos se mantengan

---

## 📋 Checklist de Pruebas

- [ ] Crear cuenta nueva
- [ ] Completar datos mascota
- [ ] Regresar al paso 1 - ¿datos persisten?
- [ ] Regresar al paso 2 - ¿datos persisten?
- [ ] Abrir modal de términos
- [ ] Ver documentos legales
- [ ] Aceptar todos los términos
- [ ] Verificar checkbox único marcado
- [ ] Continuar al pago
- [ ] Completar perfil post-pago
- [ ] Regresar a paso anterior - ¿datos persisten?

---

## ⚠️ Notas Importantes

### Para Producción:
1. **Redirigir** `/usuarios/registro` → `/registro-v2`
2. **Ejecutar migraciones** de base de datos
3. **Configurar** webhooks de Stripe
4. **Probar** flujo completo end-to-end

### Datos Guardados:
- Los datos se guardan en **Supabase** usando el `memberstack_id`
- La aceptación de términos se guarda en **localStorage** (24 horas)
- Los custom fields de Memberstack se actualizan en cada paso

---

## 📞 Soporte

Si encuentras algún problema:
1. Revisar logs del navegador (F12)
2. Verificar estado en Supabase
3. Revisar custom fields en Memberstack

---

**Última actualización:** 26 Febrero 2026 - 11:45 AM
