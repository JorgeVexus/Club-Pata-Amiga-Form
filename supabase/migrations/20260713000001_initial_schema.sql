-- Club Pata Amiga — initial schema
-- Concepts: reimbursements (reintegros), waiting periods (períodos de espera).
-- Member is ACTIVE on payment; pets are approved individually by the committee.

create extension if not exists "uuid-ossp";

-- ===== Enums =====
create type membership_status as enum ('pending_payment','active','past_due','canceled');
create type user_role as enum ('member','admin','super_admin');
create type pet_species as enum ('dog','cat');
create type pet_approval_status as enum ('pending','approved','rejected');
create type reimbursement_category as enum ('vet_expenses','death','vaccines');
create type reimbursement_status as enum ('pending','in_review','approved','partial','rejected','paid');
create type appeal_status as enum ('pending','approved','rejected');
create type ambassador_status as enum ('pending','approved','rejected','canceled');
create type wellness_status as enum ('pending','approved','rejected');
create type document_type as enum ('ine_front','ine_back','proof_of_address','vet_certificate','reimbursement_invoice','vet_report','death_certificate');

-- ===== Profiles (1:1 with auth.users) =====
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  first_name text,
  last_name text,
  mother_last_name text,
  phone text,
  curp varchar(18),
  birth_date date,
  gender text,
  -- address (Sepomex-validated)
  postal_code varchar(5),
  state text,
  city text,
  colony text,
  street_address text,
  -- membership
  membership_status membership_status not null default 'pending_payment',
  member_since timestamptz,
  waiting_period_end_date date, -- contratante: 90 days from payment
  role user_role not null default 'member',
  profile_completed boolean not null default false,
  -- referral
  ambassador_code_used text,
  -- CFDI (optional fiscal invoicing)
  cfdi_requested boolean not null default false,
  rfc varchar(13),
  razon_social text,
  uso_cfdi text,
  -- tracking
  utm_source text, utm_medium text, utm_campaign text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ===== Pets =====
create table pets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  species pet_species not null,
  breed text,
  sex text,
  age_years int,
  age_months int,
  birth_date date,
  coat_color text,
  photo_url text,
  gallery_photos text[] not null default '{}',
  is_senior boolean not null default false, -- 10+ years, requires vet certificate
  vet_certificate_url text,
  approval_status pet_approval_status not null default 'pending',
  approval_notes text,
  approved_at timestamptz,
  approved_by uuid references profiles(id),
  waiting_period_end_date date, -- dogs 120 / cats 180 days from pet registration
  waiting_period_bypassed boolean not null default false,
  is_active boolean not null default true,
  is_deceased boolean not null default false,
  deceased_at date,
  microchip_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ===== Documents =====
create table documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  pet_id uuid references pets(id) on delete cascade,
  document_type document_type not null,
  file_path text not null,
  file_name text,
  file_size int,
  mime_type text,
  uploaded_at timestamptz not null default now()
);

-- ===== Billing / subscriptions (Stripe) =====
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  plan text, -- 'monthly' | 'annual'
  plan_name text,
  amount numeric(10,2),
  currency varchar(3) default 'MXN',
  status text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ===== Reimbursements (reintegros) =====
create sequence reimbursement_folio_seq start 1;
create table reimbursements (
  id uuid primary key default gen_random_uuid(),
  folio text unique not null default ('R-' || lpad(nextval('reimbursement_folio_seq')::text, 4, '0')),
  user_id uuid not null references profiles(id) on delete cascade,
  pet_id uuid not null references pets(id) on delete cascade,
  category reimbursement_category not null,
  amount_requested numeric(10,2) not null,
  amount_approved numeric(10,2),
  service_date date,
  description text,
  invoice_urls text[] not null default '{}',
  clabe varchar(18),
  status reimbursement_status not null default 'pending',
  rejection_reason text, -- predefined: factura ilegible / fuera de período / servicio no incluido / tope excedido
  admin_notes text,
  resolved_by uuid references profiles(id),
  resolved_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ===== Appeals =====
create sequence appeal_folio_seq start 1;
create table appeals (
  id uuid primary key default gen_random_uuid(),
  folio text unique not null default ('A-' || lpad(nextval('appeal_folio_seq')::text, 4, '0')),
  reimbursement_id uuid not null references reimbursements(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  reason text not null,
  status appeal_status not null default 'pending',
  resolution_notes text,
  resolved_by uuid references profiles(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- ===== Ambassadors =====
create table ambassadors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  first_name text not null,
  last_name text,
  email text not null,
  phone text,
  curp varchar(18),
  state text,
  city text,
  referral_code text unique,
  code_change_count int not null default 0, -- customizable only once
  status ambassador_status not null default 'pending',
  rejection_reason text,
  ine_front_url text,
  ine_back_url text,
  profile_photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table referrals (
  id uuid primary key default gen_random_uuid(),
  ambassador_id uuid not null references ambassadors(id) on delete cascade,
  referred_user_id uuid not null references profiles(id) on delete cascade,
  subscription_id uuid references subscriptions(id),
  commission_amount numeric(10,2),
  status text not null default 'pending', -- pending | payable | paid
  payout_id uuid,
  created_at timestamptz not null default now(),
  unique (referred_user_id)
);

create table ambassador_payouts (
  id uuid primary key default gen_random_uuid(),
  ambassador_id uuid not null references ambassadors(id) on delete cascade,
  period_month date not null, -- first day of month; paid on the 5th of next
  total_amount numeric(10,2) not null default 0,
  status text not null default 'pending', -- pending | paid
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- ===== Wellness centers =====
create table wellness_centers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  email text,
  phone text,
  website text,
  logo_url text,
  services text[] not null default '{}', -- clinic, store, hotel, grooming, funeral, walker
  member_benefit text, -- e.g. "10% en consultas"
  status wellness_status not null default 'pending',
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wellness_center_locations (
  id uuid primary key default gen_random_uuid(),
  center_id uuid not null references wellness_centers(id) on delete cascade,
  address text,
  postal_code varchar(5),
  state text,
  city text,
  colony text,
  lat numeric(10,7),
  lng numeric(10,7),
  phone text,
  created_at timestamptz not null default now()
);

-- ===== Notifications =====
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  title text not null,
  message text,
  data jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ===== Legal documents (replaces Sanity) =====
create table legal_documents (
  id uuid primary key default gen_random_uuid(),
  slug text not null, -- terms | privacy | membership-contract
  title text not null,
  version int not null default 1,
  content text,
  file_url text,
  is_active boolean not null default true,
  published_at timestamptz not null default now(),
  unique (slug, version)
);

create table legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  legal_document_id uuid not null references legal_documents(id),
  accepted_at timestamptz not null default now(),
  unique (user_id, legal_document_id)
);

-- ===== Vet orientation bot (24/7) =====
create table vet_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  pet_id uuid references pets(id) on delete set null,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table vet_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references vet_conversations(id) on delete cascade,
  role text not null, -- 'user' | 'assistant'
  content text not null,
  created_at timestamptz not null default now()
);

-- ===== Cancellations =====
create table cancellations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  reason text,
  survey jsonb,
  coverage_end_date date,
  rejoined_at timestamptz,
  created_at timestamptz not null default now()
);

-- ===== Indexes =====
create index idx_pets_user on pets(user_id);
create index idx_reimbursements_user on reimbursements(user_id);
create index idx_reimbursements_status on reimbursements(status);
create index idx_appeals_reimbursement on appeals(reimbursement_id);
create index idx_referrals_ambassador on referrals(ambassador_id);
create index idx_notifications_user_read on notifications(user_id, read);
create index idx_wellness_locations_center on wellness_center_locations(center_id);
create index idx_wellness_locations_city on wellness_center_locations(state, city);
create index idx_vet_messages_conversation on vet_messages(conversation_id);
create index idx_documents_user on documents(user_id);
create index idx_subscriptions_user on subscriptions(user_id);
