# Plan de implementacion - Baja de mascotas en widgets y cupos

## Objetivo

Corregir el flujo de baja para que una mascota inactiva se mantenga visible como historial, muestre la causa de baja y libere correctamente un espacio para registrar una nueva mascota sin reactivar visualmente a la anterior.

## Cambios propuestos

1. Enriquecer el modelo de mascotas que regresa `/api/user/pets` con campos de ciclo de vida: `is_active`, `memberstack_slot`, `unsubscribed_reason`, `unsubscribed_description` y `unsubscribed_at`.
2. Persistir la baja en Supabase usando el `petId`, no solo el slot de Memberstack. Esto evita que una mascota vieja se reactive cuando el slot se reutiliza.
3. Reutilizar slots inactivos al registrar una mascota nueva, contando solo mascotas activas para el limite de 3.
4. En `unified-membership-widget.js`, mostrar una pantalla de estado especifica para mascotas dadas de baja, con causa y fecha cuando existan, respetando el estilo brutalista/editorial del widget.
5. En `pet-cards-widget.js`, mostrar tarjetas inactivas en escala de grises con etiqueta "DADA DE BAJA", datos minimos y sin mensajes de revision/carencia; el cupo nuevo aparece cuando hay menos de 3 mascotas activas.

## Verificacion

- Agregar pruebas unitarias para las reglas de slot y enriquecimiento de baja.
- Ejecutar `npm run type-check`, `npm run lint` y `npm run build`.
- Revisar manualmente que los widgets no muestren estados de revision para mascotas inactivas.
