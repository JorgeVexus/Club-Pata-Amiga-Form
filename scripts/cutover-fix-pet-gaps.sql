-- nose_color/eye_color existen en ambos esquemas pero nunca se mapearon
-- (172 mascotas con dato real).
update public.pets p
set nose_color = l.nose_color,
    eye_color = l.eye_color
from legacy.pets l
where l.id = p.id
  and (l.nose_color is not null or l.eye_color is not null);

-- deactivation_reason/deactivated_at <-> unsubscribed_reason/unsubscribed_at
update public.pets p
set deactivation_reason = l.unsubscribed_reason,
    deactivated_at = l.unsubscribed_at,
    is_active = false
from legacy.pets l
where l.id = p.id
  and l.unsubscribed_at is not null;
