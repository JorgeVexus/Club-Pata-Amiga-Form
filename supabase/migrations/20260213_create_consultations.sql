-- Create consultations table for Vet Bot history
create table if not exists public.consultations (
    id uuid not null default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete set null,
    pet_id uuid references public.pets(id) on delete set null,
    summary text,
    recommendations text,
    raw_data jsonb, -- Store raw bot payload just in case
    created_at timestamptz default now()
);

-- Indexes
create index if not exists consultations_user_id_idx on public.consultations(user_id);
create index if not exists consultations_pet_id_idx on public.consultations(pet_id);

-- Enable RLS
alter table public.consultations enable row level security;

-- Policies (Service Role / Bot use mainly)
create policy "Service role can manage consultations"
  on public.consultations
  for all
  using ( auth.role() = 'service_role' );

-- Optional: Users can view their own consultations
create policy "Users can view own consultations"
  on public.consultations
  for select
  using ( auth.uid() = user_id );
