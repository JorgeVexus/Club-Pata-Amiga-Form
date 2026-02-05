# Pendientes para Integración Stripe

## 📋 Lista de Tareas

### 1. Base de Datos (Supabase)
- [ ] Añadir columna `membership_type` a tabla `users` (TEXT, default 'Mensual')
- [ ] Añadir columna `membership_cost` a tabla `users` (TEXT, default '$159')

```sql
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS membership_type TEXT DEFAULT 'Mensual',
ADD COLUMN IF NOT EXISTS membership_cost TEXT DEFAULT '$159';
```

### 2. Código a Actualizar

#### `/api/admin/members/[id]/approve/route.ts`
- [ ] Descomentar lectura de `membership_type` y `membership_cost` en query
- [ ] Pasar valores reales al CRM en lugar de defaults

```typescript
// Cambiar de:
.select('crm_contact_id, email')
// A:
.select('crm_contact_id, email, membership_type, membership_cost')

// Y en updateContactAsActive, cambiar de:
updateContactAsActive(user.crm_contact_id, 'Mensual', '$159')
// A:
updateContactAsActive(user.crm_contact_id, user.membership_type, user.membership_cost)
```

#### Registro de Usuario
- [ ] Guardar `membership_type` y `membership_cost` desde Stripe al registrar usuario

### 3. Webhooks de Stripe
- [ ] Crear webhook para `checkout.session.completed`
- [ ] Actualizar `membership_type` y `membership_cost` cuando cambie suscripción
- [ ] Notificar CRM cuando membresía expire o se cancele

---

**Fecha de creación:** 2026-02-04  
**Última actualización:** 2026-02-04
