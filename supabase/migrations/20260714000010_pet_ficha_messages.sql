-- Ficha completa de mascota (campos del sistema anterior) + hilo de
-- comunicación comité↔miembro por mascota ("Solicitar información" del
-- MemberDetailModal anterior).
alter table pets
  add column nose_color text,
  add column eye_color text,
  add column is_adopted boolean not null default false,
  add column adoption_story text,
  add column info_requested boolean not null default false;

create table pet_messages (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets(id) on delete cascade,
  sender text not null check (sender in ('admin', 'member')),
  author_id uuid references profiles(id),
  message text not null,
  -- qué pidió el comité (foto_principal | certificado | documento)
  requested_items text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table pet_messages enable row level security;
-- El dueño de la mascota lee el hilo y escribe como miembro; el comité
-- opera vía service role (y puede leer con is_admin).
create policy "pet messages read" on pet_messages for select using (
  public.is_admin()
  or exists (select 1 from pets p where p.id = pet_id and p.user_id = auth.uid())
);
create policy "pet messages member insert" on pet_messages for insert with check (
  sender = 'member'
  and exists (select 1 from pets p where p.id = pet_id and p.user_id = auth.uid())
);

create index idx_pet_messages_pet on pet_messages(pet_id, created_at);
