-- ===== Helper: admin check (security definer avoids RLS recursion) =====
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('admin','super_admin')
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$;

-- ===== updated_at trigger =====
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['profiles','pets','subscriptions','reimbursements','ambassadors','wellness_centers','vet_conversations']
  loop
    execute format('create trigger set_updated_at before update on %I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- ===== Auto-create profile on signup =====
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'full_name'),
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===== Enable RLS on all tables =====
alter table profiles enable row level security;
alter table pets enable row level security;
alter table documents enable row level security;
alter table subscriptions enable row level security;
alter table reimbursements enable row level security;
alter table appeals enable row level security;
alter table ambassadors enable row level security;
alter table referrals enable row level security;
alter table ambassador_payouts enable row level security;
alter table wellness_centers enable row level security;
alter table wellness_center_locations enable row level security;
alter table notifications enable row level security;
alter table legal_documents enable row level security;
alter table legal_acceptances enable row level security;
alter table vet_conversations enable row level security;
alter table vet_messages enable row level security;
alter table cancellations enable row level security;

-- ===== Policies =====
-- profiles: own row read/update; admins read/update all
create policy "own profile read" on profiles for select using (auth.uid() = id or public.is_admin());
create policy "own profile update" on profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "admin profile update" on profiles for update using (public.is_admin());

-- pets: owner CRUD; admins all
create policy "own pets read" on pets for select using (auth.uid() = user_id or public.is_admin());
create policy "own pets insert" on pets for insert with check (auth.uid() = user_id);
create policy "own pets update" on pets for update using (auth.uid() = user_id or public.is_admin());

-- documents: owner + admins
create policy "own documents read" on documents for select using (auth.uid() = user_id or public.is_admin());
create policy "own documents insert" on documents for insert with check (auth.uid() = user_id);

-- subscriptions: owner read; admins read (writes via service role only)
create policy "own subscription read" on subscriptions for select using (auth.uid() = user_id or public.is_admin());

-- reimbursements: owner read/create; admins read/update
create policy "own reimbursements read" on reimbursements for select using (auth.uid() = user_id or public.is_admin());
create policy "own reimbursements insert" on reimbursements for insert with check (auth.uid() = user_id);
create policy "admin reimbursements update" on reimbursements for update using (public.is_admin());

-- appeals: owner read/create; admins read/update
create policy "own appeals read" on appeals for select using (auth.uid() = user_id or public.is_admin());
create policy "own appeals insert" on appeals for insert with check (auth.uid() = user_id);
create policy "admin appeals update" on appeals for update using (public.is_admin());

-- ambassadors: public can insert (registration form); owner + admins read; admins update
create policy "ambassador insert" on ambassadors for insert with check (true);
create policy "ambassador read" on ambassadors for select using (auth.uid() = user_id or public.is_admin());
create policy "admin ambassador update" on ambassadors for update using (public.is_admin());

-- referrals / payouts: ambassador sees own; admins all (writes via service role)
create policy "referrals read" on referrals for select using (
  public.is_admin() or exists (select 1 from ambassadors a where a.id = ambassador_id and a.user_id = auth.uid())
);
create policy "payouts read" on ambassador_payouts for select using (
  public.is_admin() or exists (select 1 from ambassadors a where a.id = ambassador_id and a.user_id = auth.uid())
);

-- wellness: approved centers are public; anyone can register; admins manage
create policy "wellness public read" on wellness_centers for select using (status = 'approved' or public.is_admin());
create policy "wellness insert" on wellness_centers for insert with check (true);
create policy "admin wellness update" on wellness_centers for update using (public.is_admin());
create policy "wellness locations read" on wellness_center_locations for select using (
  public.is_admin() or exists (select 1 from wellness_centers c where c.id = center_id and c.status = 'approved')
);

-- notifications: own only
create policy "own notifications read" on notifications for select using (auth.uid() = user_id);
create policy "own notifications update" on notifications for update using (auth.uid() = user_id);

-- legal: active docs public; acceptances own
create policy "legal public read" on legal_documents for select using (is_active or public.is_admin());
create policy "own acceptances read" on legal_acceptances for select using (auth.uid() = user_id);
create policy "own acceptances insert" on legal_acceptances for insert with check (auth.uid() = user_id);

-- vet bot: own conversations/messages
create policy "own vet conversations" on vet_conversations for select using (auth.uid() = user_id);
create policy "own vet conversations insert" on vet_conversations for insert with check (auth.uid() = user_id);
create policy "own vet messages" on vet_messages for select using (
  exists (select 1 from vet_conversations c where c.id = conversation_id and c.user_id = auth.uid())
);
create policy "own vet messages insert" on vet_messages for insert with check (
  exists (select 1 from vet_conversations c where c.id = conversation_id and c.user_id = auth.uid())
);

-- cancellations: own read/insert; admins read
create policy "own cancellations read" on cancellations for select using (auth.uid() = user_id or public.is_admin());
create policy "own cancellations insert" on cancellations for insert with check (auth.uid() = user_id);

-- ===== Storage buckets =====
insert into storage.buckets (id, name, public) values
  ('pet-photos', 'pet-photos', true),
  ('wellness-logos', 'wellness-logos', true),
  ('ine-documents', 'ine-documents', false),
  ('vet-certificates', 'vet-certificates', false),
  ('reimbursement-invoices', 'reimbursement-invoices', false),
  ('ambassador-documents', 'ambassador-documents', false),
  ('ambassador-materials', 'ambassador-materials', false)
on conflict (id) do nothing;

-- Storage policies: users manage files under their own uid folder
create policy "public buckets read" on storage.objects for select
  using (bucket_id in ('pet-photos','wellness-logos'));
create policy "own files upload" on storage.objects for insert
  with check (
    bucket_id in ('pet-photos','ine-documents','vet-certificates','reimbursement-invoices')
    and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "own files read" on storage.objects for select
  using (
    bucket_id in ('ine-documents','vet-certificates','reimbursement-invoices')
    and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin())
  );
create policy "ambassador materials member read" on storage.objects for select
  using (bucket_id = 'ambassador-materials' and auth.role() = 'authenticated');
