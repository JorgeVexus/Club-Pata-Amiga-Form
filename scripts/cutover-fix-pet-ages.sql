-- El migrate-legacy-pets solo mapeaba birth_date, nunca age_value/age_unit
-- (la mayoria de las mascotas viejas nunca tuvieron birth_date exacto, solo
-- edad aproximada). Sin esto, PetCard.tsx muestra "? años" para todas.
update public.pets p
set age_years = case when l.age_unit = 'years' then l.age_value else null end,
    age_months = case when l.age_unit = 'months' then l.age_value else null end
from legacy.pets l
where l.id = p.id
  and l.age_value is not null
  and l.age_unit in ('years', 'months');
