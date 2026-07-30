-- Portal de ventas — Fase 3c (1 de 3): cupones creados desde el portal.
-- Spec: docs/portal-ventas/03-MEMBRESIAS-Y-BENEFICIOS.md, punto 6.4
--
-- El checkout YA acepta códigos de promoción; lo que faltaba era crearlos sin
-- entrar a Stripe. Esto cierra el pendiente manual de la palabra del cupón de
-- /landings/regalo (docs/LANDINGS.md).
--
-- En Stripe un descuento son DOS objetos: el `coupon` (cuánto y por cuánto
-- tiempo descuenta) y el `promotion_code` (la palabra que la persona teclea,
-- con su vigencia y su tope de usos). Esta tabla guarda una fila por pareja.
--
-- Ojo con lo que NO se guarda: cuántas veces se usó. Ese número lo lleva
-- Stripe (`times_redeemed`) y se lee en vivo al abrir la pantalla. Una copia
-- nuestra se desincronizaría en el primer pago hecho fuera del portal, y un
-- contador de usos equivocado es peor que no tenerlo.

create table promo_coupons (
  id            uuid primary key default gen_random_uuid(),
  -- La palabra que teclea la persona. Stripe la trata sin distinguir
  -- mayúsculas al canjear, así que se guarda normalizada en mayúsculas.
  code          text not null unique,
  nombre        text not null,              -- para el equipo, no se muestra al público
  tipo          text not null check (tipo in ('porcentaje','monto')),
  porcentaje    numeric(5,2),               -- si tipo = 'porcentaje'
  monto_cents   int,                        -- si tipo = 'monto'
  currency      text not null default 'MXN',
  -- Cuántos cobros descuenta (no es lo mismo que la vigencia de la palabra).
  duracion      text not null default 'once'
                  check (duracion in ('once','repeating','forever')),
  duracion_meses int,
  -- Vigencia y tope de usos: viven en el promotion_code.
  vence_el      timestamptz,
  usos_max      int,
  -- Restricción por plan: en Stripe se expresa como `applies_to.products`, y
  -- el producto es por plan (las versiones comparten producto). Nulo = aplica
  -- a cualquier plan.
  plan_id       uuid references membership_plans(id) on delete set null,
  stripe_coupon_id         text,
  stripe_promotion_code_id text,
  activo        boolean not null default true,
  notas         text,
  created_by    uuid references profiles(id),
  created_at    timestamptz not null default now(),

  -- Un cupón descuenta un porcentaje O un monto, nunca los dos ni ninguno.
  constraint cupon_tiene_un_valor check (
    (tipo = 'porcentaje' and porcentaje is not null and monto_cents is null)
    or
    (tipo = 'monto' and monto_cents is not null and porcentaje is null)
  ),
  constraint cupon_repeating_con_meses check (
    duracion <> 'repeating' or duracion_meses is not null
  )
);

create index idx_promo_coupons_activos on promo_coupons(activo, created_at desc);

comment on table promo_coupons is
  'Cupones creados desde /ventas/membresias. Cada fila es un coupon + un promotion_code de Stripe. Los usos NO se guardan aquí: se leen de Stripe al mostrar la lista.';

-- ----------------------------------------------------------------- RLS -----

alter table promo_coupons enable row level security;

-- Ventas los ve (necesita saber qué promociones están vivas para vender).
create policy "ventas lee cupones" on promo_coupons for select
  using (public.is_sales());
-- Crearlos y desactivarlos mueve dinero: gerente para arriba.
create policy "gerente administra cupones" on promo_coupons for all
  using (public.is_sales_manager())
  with check (public.is_sales_manager());
