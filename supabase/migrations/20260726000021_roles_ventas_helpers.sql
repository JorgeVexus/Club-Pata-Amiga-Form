-- Portal de ventas — Fase 0: helpers de RLS para los roles de ventas.
--
-- Se usan en las políticas de las secciones siguientes (contactos, pipelines,
-- conversaciones, calendario, boletín). Aquí solo se declaran, porque todavía
-- no hay tablas del portal.
--
-- REGLA QUE NO SE ROMPE: is_sales() NO incluye acceso a datos personales
-- sensibles (INE, CURP, RFC, bancarios, expedientes de reintegro). Esas tablas
-- siguen pidiendo is_admin() / is_super_admin() y nada de lo que se agregue
-- aquí debe aflojarlas.

-- ¿El usuario trabaja en el portal de ventas? (incluye administración, que
-- puede cambiar de portal)
create or replace function public.is_sales()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and role in ('ventas', 'gerente_ventas', 'admin', 'super_admin')
  );
$$;

-- ¿Puede aprobar? (contenido, boletín, fusionar contactos, tableros del equipo)
create or replace function public.is_sales_manager()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and role in ('gerente_ventas', 'admin', 'super_admin')
  );
$$;

comment on function public.is_sales() is
  'Rol con acceso al portal de ventas. NO implica acceso a datos sensibles del miembro.';
comment on function public.is_sales_manager() is
  'Rol que puede aprobar en el portal de ventas (gerente, admin, super admin).';
