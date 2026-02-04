# Documentación: Integración CRM Lynsales

**Fecha:** 4 de Febrero 2026  
**Proyecto:** Club Pata Amiga - Sistema de Membresías

---

## Resumen

Se implementó la integración con el CRM de Lynsales (LeadConnector) para sincronizar automáticamente los datos de los miembros en dos momentos clave del flujo:

1. **Al registrarse:** Se crea/actualiza el contacto en el CRM
2. **Al ser aprobado:** Se marca como "miembro activo" con etiqueta y datos de membresía

---

## Flujo de Sincronización

```
Usuario se registra
        ↓
    [Supabase] ← Datos guardados (flujo normal)
        ↓
    [Lynsales CRM] ← POST /contacts/upsert
        ↓
    crm_contact_id guardado en DB
        
        ...
        
Admin aprueba miembro
        ↓
    [Lynsales CRM] ← PUT /contacts/{id}
        ↓
    Tag "miembro activo" + custom fields
```

---

## Configuración Requerida

### Variables de Entorno (Vercel)

| Variable | Valor |
|----------|-------|
| `LYNSALES_API_KEY` | `pit-af973e1a-30aa-4643-8146-325d875b1f3e` |
| `LYNSALES_LOCATION_ID` | `WSfoe3Cggh6XrHoGRMxG` |
| `LYNSALES_API_URL` | `https://services.leadconnectorhq.com` |

### Base de Datos (Supabase)

Ejecutar en SQL Editor:
```sql
ALTER TABLE users ADD COLUMN crm_contact_id VARCHAR(255) NULL;
```

---

## Datos Enviados al CRM

### Al Registrarse (POST)

| Campo App | Campo CRM |
|-----------|-----------|
| Nombre | `firstName` |
| Apellidos | `lastName` |
| Email | `email` |
| Teléfono | `phone` |
| Género | `gender` (male/female) |
| Dirección | `address1` |
| Ciudad | `city` |
| Estado | `state` |
| Código Postal | `postalCode` |
| Fecha Nacimiento | `dateOfBirth` |
| País | `country` (siempre "MX") |
| Location ID | `locationId` (fijo) |

### Al Aprobar (PUT)

| Campo | Key | Valor |
|-------|-----|-------|
| Etiqueta | `tags[]` | "miembro activo" |
| Tipo Membresía | `contact.tipo_membresia` | "Mensual" / "Anual" |
| Costo | `contact.costo_membresia` | "$159", "$999", etc. |

---

## Archivos Modificados

| Archivo | Descripción |
|---------|-------------|
| `src/services/crm.service.ts` | **Nuevo** - Servicio cliente para API Lynsales |
| `src/app/api/crm/upsert/route.ts` | **Nuevo** - Endpoint interno para sincronización |
| `src/app/actions/user.actions.ts` | Función `updateUserCrmContactId()` |
| `src/components/RegistrationForm/RegistrationForm.tsx` | Llamada POST al registrar |
| `src/app/api/admin/members/[id]/pets/[petId]/status/route.ts` | Llamada PUT al aprobar |

---

## Comportamiento de Errores

La integración está diseñada para **no bloquear el flujo del usuario**:

- Si la API de Lynsales falla, el registro/aprobación **continúa normalmente**
- Los errores se registran en los logs de Vercel
- El campo `crm_contact_id` quedará vacío si falló el POST inicial

---

## Próximos Pasos

1. ✅ Agregar variables de entorno en Vercel
2. ✅ Ejecutar SQL en Supabase
3. ⏳ Probar registro de nuevo usuario
4. ⏳ Verificar contacto en CRM Lynsales
5. ⏳ Probar aprobación y verificar tag "miembro activo"

---

## Plan Pendiente: Embajadores

La integración para embajadores está planificada pero **no implementada aún**. Seguirá el mismo patrón:

- POST al registrarse como embajador
- PUT al ser aprobado con tag "embajador activo"

---

## Contacto Técnico

Para cualquier duda sobre la implementación, revisar:
- Logs en Vercel (buscar `[CRM]`)
- Documentación API: `Documentacion/lynsales-api-docs.mc`
