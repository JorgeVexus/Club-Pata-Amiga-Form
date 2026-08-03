# Cómo refrescar staging desde producción

Staging (`pata-amiga-staging`, ref `dpsdopbwnxgwowzehotj`) es una copia de
producción (`hjvhntxjkuuobgfslzlf`) hecha a mano el 2026-08-02. No se
sincroniza sola — si producción cambia (nuevos miembros, mascotas,
embajadores, centros), staging se queda desactualizada.

## ¿Cada cuándo conviene refrescar?

No hay un cron para esto — es manual, a propósito (para no arriesgar tocar
producción sin querer). Recomendación: refrescar cuando el equipo vaya a
probar algo que dependa de tener datos "parecidos a la realidad" (volumen,
variedad de estados), o cada 2-4 semanas si el equipo prueba seguido. Para
probar features nuevas del código no hace falta — con las cuentas de
prueba (fase 2 del plan de Pablo) alcanza.

## Qué NO hace falta refrescar

El **esquema** (tablas, columnas, RLS) se actualiza aparte, corriendo las
migraciones nuevas de `supabase/migrations/` contra staging cuando se
agregan (ver abajo) — eso sí conviene hacerlo cada vez que se agreguen
migraciones nuevas al repo, no solo cuando se refrescan datos.

## Proceso (repite lo que se hizo para el cutover real)

1. **Exportar de producción** (solo lectura, sin riesgo): usar
   `npx supabase link --project-ref hjvhntxjkuuobgfslzlf` y correr
   `supabase db query` con `select ... from users/pets/ambassadors/wellness_centers`
   con `-o json`, guardando cada uno a un archivo temporal. Ver
   `scripts/backfill-legacy-users.ts`, `scripts/migrate-legacy-pets-to-staging.mjs`
   y `scripts/migrate-legacy-ambassadors-centers.mjs` — ya soportan leer de
   un proyecto y escribir a otro vía `SOURCE_SUPABASE_URL`/
   `SOURCE_SERVICE_ROLE_KEY`.
2. **Vaciar staging primero** (`truncate` de `profiles`, `pets`,
   `ambassadors`, `wellness_centers` — con cuidado de no truncar
   `auth.users` a medias, mejor borrar los usuarios de Auth vía
   `supabase.auth.admin.deleteUser` en un loop) para que el refresh no dé
   error de "ya existe" con datos viejos de una copia anterior.
3. **Volver a correr los mismos scripts** apuntando `SOURCE_*` a
   producción y las variables normales a staging.
4. **Reconstruir las cuentas de prueba** (fase 2 del plan de Pablo) después
   del refresh, porque el paso 2 las borra si eran parte del refresh (las
   cuentas de prueba deberían vivir *fuera* del rango de lo que se trunca,
   idealmente con emails `@example.com` fácilmente identificables para no
   borrarlas sin querer).

## Nota de seguridad

Nunca correr estos scripts con `SOURCE_*` apuntando a producción Y el
destino apuntando también a producción por accidente — verificar siempre
`cat supabase/.temp/project-ref` antes de correr cualquier `--apply`.
