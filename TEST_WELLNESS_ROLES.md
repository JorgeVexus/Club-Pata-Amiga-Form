# Prueba de Roles de Wellness Centers

## Problema Detectado
Al iniciar sesión como centro de bienestar, el sistema está redirigiendo a un 404 en lugar de al dashboard correcto.

## Pasos para Diagnóstico

### 1. Habilitar Modo Depuración
Agrega este script a tu página para habilitar la interfaz de depuración:

```html
<script src="https://app.pataamiga.mx/widgets/debug-user-roles.js"></script>
```

### 2. Usar el Depurador
1. Inicia sesión como el usuario problema
2. Haz clic en el botón "🐛 DEBUG ROLES" que aparecerá en la esquina superior derecha
3. La interfaz mostrará información detallada sobre todos los roles encontrados

### 3. Verificar Datos en Supabase
Ejecuta estas consultas directamente en Supabase para verificar los datos:

```sql
-- Verificar wellness center para el usuario problema
SELECT * FROM wellness_centers WHERE memberstack_id = 'mem_cmos033ff11dd0sqd1m42b3mg';

-- Verificar si el usuario tiene otros roles
SELECT * FROM users WHERE memberstack_id = 'mem_cmos033ff11dd0sqd1m42b3mg';
SELECT * FROM ambassadors WHERE linked_memberstack_id = 'mem_cmos033ff11dd0sqd1m42b3mg';
```

### 4. Probar API Manualmente
Usa herramientas como Postman o curl para probar el endpoint:

```bash
curl -X POST "https://app.pataamiga.mx/api/auth/debug-role" \
  -H "Content-Type: application/json" \
  -d '{"memberstackId": "mem_cmos033ff11dd0sqd1m42b3mg"}'
```

## Posibles Causas

1. **Falta de wellness center**: El usuario podría no tener un registro en la tabla `wellness_centers`
2. **Status incorrecto**: El wellness center podría tener status `rejected`, `suspended` o `cancelled`
3. **Duplicación de roles**: El usuario podría tener múltiples roles y la prioridad no está funcionando correctamente

## Soluciones

### Si el usuario no tiene wellness center:
1. Registra al usuario como wellness center
2. Asegúrate de que el status sea `approved`

### Si el status es incorrecto:
1. Actualiza el status en Supabase:
```sql
UPDATE wellness_centers 
SET status = 'approved' 
WHERE memberstack_id = 'mem_cmos033ff11dd0sqd1m42b3mg';
```

### Si hay problemas de prioridad:
1. Verifica los logs de Vercel para ver el orden de ejecución
2. Confirma que el wellness center check se está ejecutando antes que el embajador check

## URLs Correctas

- **Dashboard Wellness Centers**: `https://www.pataamiga.mx/red-pata-amiga/perfil-centros-del-bienestar`
- **Script de Depuración**: `https://app.pataamiga.mx/widgets/debug-user-roles.js`
- **Script de Redirección**: `https://app.pataamiga.mx/widgets/login-redirect-enhanced.js`

## Prueba Final

Una vez corregidos los datos, prueba el flujo completo:
1. Inicia sesión como el usuario
2. Verifica que aparece el botón de depuración
3. Confirma que el rol detectado es `wellness_center`
4. Verifica que la redirección es a la URL correcta