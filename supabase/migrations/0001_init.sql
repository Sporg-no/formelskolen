-- Formelskolen – databaseoppsett

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "profil: les egen" on public.profiles;
create policy "profil: les egen" on public.profiles for select using ((select auth.uid()) = id);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, lower(new.email))
  on conflict (id) do update set email = excluded.email;
  return new;
end $$;
revoke execute on function public.handle_new_user() from anon, authenticated, public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create table if not exists public.subscriptions (
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
create index if not exists subscriptions_customer_idx on public.subscriptions (stripe_customer_id);
alter table public.subscriptions enable row level security;
drop policy if exists "abonnement: les eget" on public.subscriptions;
create policy "abonnement: les eget" on public.subscriptions for select using ((select auth.uid()) = user_id);

create table if not exists public.progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_slug text not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_slug)
);
alter table public.progress enable row level security;
drop policy if exists "fremdrift: les egen" on public.progress;
create policy "fremdrift: les egen" on public.progress for select using ((select auth.uid()) = user_id);
drop policy if exists "fremdrift: lagre egen" on public.progress;
create policy "fremdrift: lagre egen" on public.progress for insert with check ((select auth.uid()) = user_id);

create table if not exists public.certificates (
  id text primary key,
  user_id uuid unique not null references auth.users(id) on delete cascade,
  name text not null,
  lessons int not null,
  issued_at timestamptz not null default now()
);
alter table public.certificates enable row level security;
drop policy if exists "sertifikat: les eget" on public.certificates;
create policy "sertifikat: les eget" on public.certificates for select using ((select auth.uid()) = user_id);
-- Offentlig verifisering skjer via serveren med hemmelig nøkkel, ikke direkte mot tabellen.
