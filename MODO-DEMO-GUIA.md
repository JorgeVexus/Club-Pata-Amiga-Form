# Guía del Modo Demo

> **Versión:** 1.0  
> **Fecha:** 26 Febrero 2026

---

## 🎯 ¿Qué es el Modo Demo?

El **Modo Demo** es una versión del flujo de registro que funciona **completamente en local** sin necesidad de:
- ✅ Memberstack configurado
- ✅ Supabase configurado  
- ✅ Stripe configurado
- ✅ APIs externas

Todo se guarda en el **localStorage del navegador**.

---

## 🚀 Cómo usar el Modo Demo

### 1. Acceder
```bash
npm run dev
```
Abrir: `http://localhost:3000/registro-v2`

### 2. Flujo completo de prueba

**Paso 1: Cuenta**
- Ingresa cualquier email
- Contraseña mínimo 8 caracteres
- Click "Continuar"

**Paso 2: Mascota**
- Selecciona tipo (perro/gato)
- Nombre de la mascota
- Edad (prueba con 12 años para ver mensaje de senior)
- Click "Continuar"

**Paso 3: Plan**
- Selecciona Mensual o Anual
- Click en "Ver términos y condiciones"
- Acepta todos los términos en el modal
- Click "Continuar al pago"
- Simula el pago (sin Stripe real)

**Paso 4: Perfil**
- Completa todos los datos
- Prueba CP: `01000` (autocompleta CDMX)
- CURP: cualquier formato de 18 caracteres

**Paso 5: Mascota**
- Selecciona sexo, raza, colores
- Opcional: sube una foto
- Si es mestizo: marca "adoptado" y escribe historia
- Click "Completar registro"

### 3. Probar persistencia
- Completa hasta el paso 3
- Recarga la página (`F5`)
- Los datos deben estar guardados
- Puedes regresar a pasos anteriores

### 4. Cerrar sesión
- En el paso 1 aparece el banner "No eres tú? Cerrar sesión"
- Limpia todos los datos del demo

---

## 📁 Archivos del Modo Demo

```
src/components/RegistrationV2/
├── NewRegistrationFlow.demo.tsx      # Orquestador demo
├── steps/
│   ├── Step1Account.demo.tsx         # Crear cuenta (demo)
│   ├── Step2PetBasic.demo.tsx        # Mascota básica (demo)
│   ├── Step3PlanSelection.demo.tsx   # Plan y términos (demo)
│   ├── Step4CompleteProfile.demo.tsx # Perfil (demo)
│   └── Step5CompletePet.demo.tsx     # Mascota completa (demo)
```

---

## 🔄 Cambiar a Modo Producción

### Paso 1: Configurar variables de entorno
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=tu_url
SUPABASE_SERVICE_ROLE_KEY=tu_key
NEXT_PUBLIC_MEMBERSTACK_APP_ID=tu_app_id
```

### Paso 2: Ejecutar migraciones
```sql
-- En SQL Editor de Supabase
\i supabase/migrations/001_reestructuracion_flujo.sql
```

### Paso 3: Cambiar la página
```typescript
// src/app/registro-v2/page.tsx

// ANTES (Demo):
import NewRegistrationFlowDemo from '@/components/RegistrationV2/NewRegistrationFlow.demo';
export default function RegistroV2Page() {
    return <NewRegistrationFlowDemo />;
}

// DESPUÉS (Producción):
import NewRegistrationFlow from '@/components/RegistrationV2/NewRegistrationFlow';
export default function RegistroV2Page() {
    return <NewRegistrationFlow />;
}
```

### Paso 4: Probar en producción
```bash
npm run build
npm start
```

---

## 🧪 Casos de Prueba Recomendados

| Caso | Pasos | Resultado Esperado |
|------|-------|-------------------|
| Registro completo | Completar 5 pasos | Redirige a confirmación |
| Email duplicado | Intentar registrar email existente | Muestra error y link a login |
| Persistencia | Recargar en paso 3 | Datos mantenidos |
| Mascota senior | Edad 12 años | Muestra warning de certificado |
| Mestizo adoptado | Seleccionar mestizo + adoptado | Muestra campo de historia |
| CP válido | 01000 | Autocompleta estado/municipio |
| Términos | Abrir modal | Muestra documentos + checkboxes |
| Cerrar sesión | Click en logout | Limpia datos y recarga |

---

## 🐛 Solución de Problemas

### Se queda cargando
- Refrescar la página (`F5`)
- Limpiar localStorage: `localStorage.clear()` en consola
- Click en "No eres tú? Cerrar sesión"

### No guarda datos
- Verificar que localStorage esté habilitado en el navegador
- Abrir DevTools → Application → Local Storage
- Debería ver: `registration_demo_data`

### Error al crear cuenta
- Email debe tener formato válido
- Contraseña mínimo 8 caracteres
- En demo, el email no puede estar en `registration_demo_users`

---

## 💡 Tips

1. **Datos de prueba rápidos:**
   - Email: `test@demo.com`
   - CP: `01000`
   - CURP: `ABCD123456HDFRNN09`

2. **Limpiar todo para empezar de cero:**
   ```javascript
   // En consola del navegador
   localStorage.clear();
   location.reload();
   ```

3. **Ver datos guardados:**
   ```javascript
   // En consola
   JSON.parse(localStorage.getItem('registration_demo_data'));
   ```

---

## 📞 Soporte

¿Problemas con el modo demo?
1. Revisar consola del navegador (F12)
2. Verificar localStorage tenga datos
3. Limpiar cache y recargar

¿Listo para producción?
1. Configurar todas las variables de entorno
2. Ejecutar migraciones SQL
3. Cambiar import a versión producción
4. Probar flujo completo end-to-end

---

**Nota:** El modo demo es solo para desarrollo y pruebas UX. Nunca usar en producción ya que los datos se pierden al limpiar el navegador.
