# Edición Completa de Datos — Dashboard Admin

**Fecha:** 2026-07-20  
**Estado:** En implementación

## Objetivo
Reemplazar botones de edición individual por campo con:
- Botón "✏️ Editar Info Usuario" en sección Datos Personales
- Botón "✏️ Editar Info de [nombre]" en cada card de mascota

## Campos por destino

### Memberstack (sincronizar)
- Usuario: `first-name`, `paternal-last-name`, `maternal-last-name`, `phone`
- Mascotas: `pet-N-name`, `pet-N-type`, `pet-N-age`

### Solo Supabase
- Usuario: `birth_date`, `curp`, `address`, `colony`, `city`, `state`, `postal_code`
- Mascotas: `breed`, `gender`, `age_unit`, `is_adopted`, `is_senior`, `is_mixed_breed`

## Sin notificaciones al usuario
Las ediciones son correcciones internas del admin.

## Registro de actividad
- Tabla `member_edits` en Supabase
- Feed de actividad (Actividad reciente + Tu actividad)
- Log en `appeal_logs` con tipo `admin_edit`
