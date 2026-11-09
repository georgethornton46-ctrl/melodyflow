-- MelodyFlow schema. RLS on every table: a user only sees and changes their own rows.
-- Anonymous tries are written by the server (service role) and claimed at sign-up.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  kwop_k text,
  intended_plan text,
  source jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  answers jsonb not null default '{}'::jsonb,
  last_plan jsonb,
  aha_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.sheets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  device_id text,
  ip_hash text,
  title text not null default 'Untitled melody',
  data jsonb not null,
  waveform jsonb not null default '[]'::jsonb,
  duration real not null default 0,
  source text not null default 'record',
  public boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists sheets_user_idx on public.sheets (user_id, created_at desc);
create index if not exists sheets_device_idx on public.sheets (device_id, created_at desc);
create index if not exists sheets_ip_idx on public.sheets (ip_hash, created_at desc);

create table if not exists public.exports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  sheet_id uuid references public.sheets (id) on delete set null,
  sheet_title text,
  format text not null check (format in ('pdf', 'midi', 'musicxml')),
  semitones int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists exports_user_idx on public.exports (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.sheets enable row level security;
alter table public.exports enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own sheets" on public.sheets;
create policy "own sheets" on public.sheets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own exports" on public.exports;
create policy "own exports" on public.exports for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- a profile row for every new account
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
