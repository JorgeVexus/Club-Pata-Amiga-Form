# Plan: bajas de mascotas en Solidarity Dashboard

## Contexto

El widget `public/widgets/solidarity-dashboard.js` muestra mascotas dadas de baja como "en revisión" dentro de `.pata-pet-list`. Los widgets `unified-membership-widget.js` y `pet-cards-widget.js` sí muestran esas mascotas como "DADA DE BAJA".

## Hipótesis

El dashboard de solidaridad consume `/api/solidarity/stats`, que devuelve mascotas crudas desde Supabase. Los widgets que funcionan consumen `/api/user/pets`, que enriquece las mascotas con `enrichPetsWithLifecycle`, usando `pet_unsubscriptions` y campos legacy de Memberstack para reconciliar bajas.

## Pasos

1. Agregar prueba que reproduzca una mascota activa en `pets` pero dada de baja en `pet_unsubscriptions`.
2. Reutilizar la lógica central de lifecycle en `/api/solidarity/stats`.
3. Verificar que los conteos de mascotas activas/en espera excluyan bajas.
4. Ejecutar test específico, type-check, lint y build.

