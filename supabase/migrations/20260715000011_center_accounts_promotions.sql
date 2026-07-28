-- Centros aliados con cuenta propia + promociones que ellos administran.
--
-- 1. wellness_centers.user_id liga el centro a una cuenta (como ambassadors):
--    la solicitud hecha con sesión se liga al instante; la hecha sin sesión se
--    liga por correo al iniciar sesión (ver src/lib/login-destination.ts).
-- 2. center_promotions: promociones/descuentos que el centro publica desde su
--    dashboard (/centro) y los miembros ven en el directorio de centros.

alter table wellness_centers
  add column user_id uuid references profiles(id) on delete set null;

create index idx_wellness_centers_user on wellness_centers(user_id);

create table center_promotions (
  id uuid primary key default gen_random_uuid(),
  center_id uuid not null references wellness_centers(id) on delete cascade,
  title text not null,
  description text,
  discount_label text,      -- ej. "10% de descuento", "2x1 en baños"
  valid_until date,         -- null = sin vencimiento
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_center_promotions_center on center_promotions(center_id);

create trigger set_updated_at before update on center_promotions
  for each row execute function public.set_updated_at();

alter table center_promotions enable row level security;

-- El dueño del centro puede ver/editar su propio centro aunque siga pendiente
create policy "center owner read" on wellness_centers
  for select using (auth.uid() = user_id);
create policy "center owner update" on wellness_centers
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "center owner locations read" on wellness_center_locations
  for select using (
    exists (select 1 from wellness_centers c where c.id = center_id and c.user_id = auth.uid())
  );

-- Promociones: públicas cuando están activas en un centro aprobado; el dueño
-- las administra; los admins todo
create policy "promotions public read" on center_promotions
  for select using (
    public.is_admin()
    or exists (
      select 1 from wellness_centers c
      where c.id = center_id
        and ((c.status = 'approved' and is_active) or c.user_id = auth.uid())
    )
  );
create policy "center owner promotions write" on center_promotions
  for all using (
    exists (select 1 from wellness_centers c where c.id = center_id and c.user_id = auth.uid())
  ) with check (
    exists (select 1 from wellness_centers c where c.id = center_id and c.user_id = auth.uid())
  );
