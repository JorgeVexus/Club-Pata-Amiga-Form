-- promotion_details -> member_benefit (7 centros con beneficio real, ej. "10% en consultas")
update public.wellness_centers w
set member_benefit = l.promotion_details
from legacy.wellness_centers l
where l.id = w.id
  and l.promotion_details is not null;

-- wellness_center_locations nunca se migro (0 filas) - el esquema viejo
-- tenia una direccion por centro directo en wellness_centers (address/
-- lat/lng), el nuevo la separa en su propia tabla (permite varias
-- sucursales). Se crea una ubicacion por centro con lo que habia.
insert into public.wellness_center_locations (center_id, address, lat, lng)
select w.id, l.address, l.lat, l.lng
from public.wellness_centers w
join legacy.wellness_centers l on l.id = w.id
where l.address is not null
on conflict do nothing;
