-- Formelskolen – databaseoppsett. Ligger i et delt Supabase-prosjekt, derfor fs_-prefiks.

create table if not exists public.fs_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  status text not null default 'incomplete',
  price_id text,
  interval text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  consent_at timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists fs_subscriptions_customer_idx on public.fs_subscriptions (stripe_customer_id);
alter table public.fs_subscriptions enable row level security;
create policy "fs abonnement: les eget" on public.fs_subscriptions for select to authenticated using ((select auth.uid()) = user_id);

create table if not exists public.fs_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_slug text not null check (char_length(lesson_slug) <= 80),
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_slug)
);
alter table public.fs_progress enable row level security;
create policy "fs fremdrift: les egen" on public.fs_progress for select to authenticated using ((select auth.uid()) = user_id);
create policy "fs fremdrift: lagre egen" on public.fs_progress for insert to authenticated with check ((select auth.uid()) = user_id);

create table if not exists public.fs_certificates (
  id text primary key,
  user_id uuid unique not null references auth.users(id) on delete cascade,
  name text not null,
  lessons int not null,
  issued_at timestamptz not null default now()
);
alter table public.fs_certificates enable row level security;
create policy "fs sertifikat: les eget" on public.fs_certificates for select to authenticated using ((select auth.uid()) = user_id);
-- Offentlig verifisering av sertifikater skjer via serveren med hemmelig nøkkel.
