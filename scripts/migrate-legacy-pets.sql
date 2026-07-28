-- Migra mascotas de legacy.pets (owner_id) al nuevo public.pets (user_id).
-- Debe correrse DESPUES de scripts/backfill-legacy-users.ts --apply (las
-- filas de profiles/auth.users deben existir primero, porque pets.user_id
-- referencia profiles.id).
--
-- Se omiten intencionalmente las mascotas sin pet_type reconocible
-- (dog/cat) porque la especie es NOT NULL en el esquema nuevo - quedan
-- solo en legacy.pets para revision manual.

insert into public.pets (
  id, user_id, name, species, breed, sex, birth_date, coat_color,
  photo_url, gallery_photos, is_senior, vet_certificate_url,
  approval_status, is_active, is_adopted, adoption_story,
  waiting_period_end_date, created_at
)
select
  p.id,
  p.owner_id,
  p.name,
  p.pet_type::pet_species,
  p.breed,
  p.gender,
  p.birth_date,
  p.coat_color,
  p.primary_photo_url,
  array_remove(array[p.photo2_url, p.photo3_url, p.photo4_url, p.photo5_url], null),
  coalesce(p.is_senior, false),
  p.vet_certificate_url,
  (case p.status
     when 'approved' then 'approved'
     when 'rejected' then 'rejected'
     else 'pending'
   end)::pet_approval_status,
  coalesce(p.is_active, true),
  coalesce(p.is_adopted, false),
  p.adoption_story,
  p.waiting_period_end::date,
  p.created_at
from legacy.pets p
where p.pet_type in ('dog', 'cat')
  and exists (select 1 from public.profiles pr where pr.id = p.owner_id)
on conflict (id) do nothing;
