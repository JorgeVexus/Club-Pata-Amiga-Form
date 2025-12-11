# Troubleshooting: "No tienes mascotas registradas"

## Problema
Al iniciar sesión en Webflow, el panel muestra "No tienes mascotas registradas" aunque el usuario tiene una mascota en el slot pet-1.

## Solución Implementada

Se mejoró el código JavaScript para:

1. **Buscar mascotas automáticamente** si no existe el campo `total-pets`
2. **Calcular fechas faltantes** automáticamente si no existen
3. **Agregar logs detallados** para debugging

## Pasos para Actualizar el Código en Webflow

### 1. Abrir Page Settings
- Ve a tu página de dashboard en Webflow
- Click en el ícono de configuración (⚙️)
- Ve a **Custom Code**

### 2. Reemplazar el JavaScript
- En la sección **Before </body> tag**
- Reemplaza TODO el código JavaScript anterior con el nuevo de `waiting-period-panel.js`

### 3. Publicar y Probar
- Guarda los cambios
- Publica el sitio
- Abre la consola del navegador (F12)
- Inicia sesión con el usuario de prueba

## Qué Buscar en la Consola

Deberías ver estos logs:

```
🐕 Inicializando panel de período de carencia...
✅ Datos del usuario cargados: {pet-1-name: "...", ...}
📋 Todos los custom fields disponibles: ["pet-1-name", "pet-1-breed", ...]
⚠️ Campo "total-pets" no encontrado, buscando mascotas manualmente...
📊 Mascotas encontradas manualmente: 1
🔍 Buscando datos de pet-1...
✅ pet-1 encontrada: {name: "...", ...}
✅ Mascotas procesadas: [{...}]
```

## Si Aún No Funciona

### Verificar Custom Fields en Memberstack

1. **Ir a Memberstack Dashboard:**
   - https://app.memberstack.com
   - Selecciona tu proyecto
   - Ve a **Members**
   - Busca el usuario de prueba

2. **Verificar que existan estos campos:**
   - `pet-1-name` ✅ (REQUERIDO)
   - `pet-1-waiting-period-days` (opcional, default: 180)
   - `pet-1-waiting-period-end` (opcional, se calcula automáticamente)
   - `pet-1-registration-date` (opcional, usa fecha actual)

3. **Campos mínimos requeridos:**
   - Solo necesitas `pet-1-name` para que funcione
   - El resto se calcula automáticamente

### Verificar en la Consola

Si ves este mensaje:
```
❌ No se encontraron mascotas. Campos disponibles: []
```

Significa que NO hay ningún campo `pet-1-*` en Memberstack.

**Solución:**
- Verifica que el formulario de registro esté guardando los datos correctamente
- Revisa que los atributos `data-ms-member` estén configurados en el formulario

### Campos que Debe Tener el Usuario

Ejemplo de custom fields mínimos:

```json
{
  "pet-1-name": "Max",
  "pet-1-breed": "Labrador",
  "pet-1-type": "perro"
}
```

Con esto, el panel debería funcionar y calcular automáticamente:
- `pet-1-registration-date`: Fecha actual
- `pet-1-waiting-period-end`: Fecha actual + 180 días
- `pet-1-waiting-period-days`: 180

## Debugging Paso a Paso

### 1. Verificar que Memberstack Carga
```javascript
console.log(window.$memberstackDom); // Debe mostrar un objeto
```

### 2. Verificar Usuario Autenticado
```javascript
window.$memberstackDom.getCurrentMember().then(({data}) => console.log(data));
```

### 3. Ver Custom Fields
```javascript
window.$memberstackDom.getCurrentMember().then(({data}) => console.log(data.customFields));
```

### 4. Buscar Campos de Mascotas
```javascript
window.$memberstackDom.getCurrentMember().then(({data}) => {
  const petFields = Object.keys(data.customFields).filter(k => k.startsWith('pet-'));
  console.log('Campos de mascotas:', petFields);
});
```

## Contacto

Si después de seguir estos pasos aún tienes problemas, comparte:
1. Screenshot de la consola del navegador
2. Screenshot de los custom fields en Memberstack Dashboard
3. El mensaje de error exacto

---

**Última actualización:** 2025-12-10
