-- clabe se exporto en el script de migracion pero nunca se incluyo en el
-- INSERT (12 embajadores con CLABE real para pago de comisiones).
update public.ambassadors a
set clabe = l.clabe
from legacy.ambassadors l
where l.id = a.id
  and l.clabe is not null;
