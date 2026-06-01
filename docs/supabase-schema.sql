create extension if not exists pgcrypto;

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'editor' check (role in ('owner', 'editor')),
  created_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (
    category in ('Mosquée', 'Cours', 'Solidarité', 'Famille', 'Prières mortuaires')
  ),
  date text not null,
  location text not null,
  summary text not null,
  is_important boolean not null default false,
  published boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.device_tokens (
  token text primary key,
  platform text not null check (platform in ('ios', 'android', 'web')),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mosques (
  id text primary key,
  name text not null,
  city text not null,
  address text not null default '',
  latitude double precision not null,
  longitude double precision not null,
  mawaqit_id integer,
  mawaqit_url text,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.local_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  starts_at timestamptz,
  location text,
  description text,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.feedback_submissions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('info', 'erreur', 'amelioration', 'contact')),
  title text not null,
  message text not null,
  contact text not null,
  status text not null default 'new' check (status in ('new', 'reviewed', 'archived')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admins
    where admins.user_id = auth.uid()
  );
$$;

alter table public.admins enable row level security;
alter table public.announcements enable row level security;
alter table public.device_tokens enable row level security;
alter table public.mosques enable row level security;
alter table public.local_events enable row level security;
alter table public.feedback_submissions enable row level security;

drop policy if exists "Admins can read admin list" on public.admins;
create policy "Admins can read admin list"
on public.admins for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can read all announcements" on public.announcements;
create policy "Admins can read all announcements"
on public.announcements for select
to authenticated
using (public.is_admin());

drop policy if exists "Anyone can read published announcements" on public.announcements;
create policy "Anyone can read published announcements"
on public.announcements for select
to anon, authenticated
using (published = true);

drop policy if exists "Admins can create announcements" on public.announcements;
create policy "Admins can create announcements"
on public.announcements for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update announcements" on public.announcements;
create policy "Admins can update announcements"
on public.announcements for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete announcements" on public.announcements;
create policy "Admins can delete announcements"
on public.announcements for delete
to authenticated
using (public.is_admin());

drop policy if exists "Devices can register tokens" on public.device_tokens;
create policy "Devices can register tokens"
on public.device_tokens for insert
to anon, authenticated
with check (true);

drop policy if exists "Devices can update tokens" on public.device_tokens;
create policy "Devices can update tokens"
on public.device_tokens for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Anyone can read visible mosques" on public.mosques;
create policy "Anyone can read visible mosques"
on public.mosques for select
to anon, authenticated
using (is_visible = true);

drop policy if exists "Anyone can read published events" on public.local_events;
create policy "Anyone can read published events"
on public.local_events for select
to anon, authenticated
using (published = true);

drop policy if exists "Admins can manage mosques" on public.mosques;
create policy "Admins can manage mosques"
on public.mosques for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can manage events" on public.local_events;
create policy "Admins can manage events"
on public.local_events for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Anyone can submit feedback" on public.feedback_submissions;
create policy "Anyone can submit feedback"
on public.feedback_submissions for insert
to anon, authenticated
with check (true);

drop policy if exists "Admins can read feedback" on public.feedback_submissions;
create policy "Admins can read feedback"
on public.feedback_submissions for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can update feedback" on public.feedback_submissions;
create policy "Admins can update feedback"
on public.feedback_submissions for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into public.mosques (id, name, city, address, latitude, longitude, mawaqit_id, mawaqit_url)
values
  ('al-fath-tours', 'Mosquée Al-Fath', 'Tours', '18 Rue Lobin, 37000 Tours', 47.395163, 0.7004038, 5998, 'https://mawaqit.net/fr/m-tours'),
  ('as-salam-joue', 'Mosquée AS-SALAM', 'Joué-lès-Tours', '2 Rue Paul Sabatier, 37300 Joué-lès-Tours', 47.347526592957, 0.65807940386564, 3496, 'https://mawaqit.net/fr/mosquee-joue'),
  ('al-kawthar-saint-pierre', 'Mosquée AL-KAWTHAR', 'Saint-Pierre-des-Corps', '71 Rue de la Rabaterie, 37700 Saint-Pierre-des-Corps', 47.3919835, 0.7258686, 3354, 'https://mawaqit.net/fr/msp'),
  ('bouzignac-tours', 'Mosquée de Bouzignac', 'Tours', 'Place Guido d''Arezzo, 37000 Tours', 47.375776224536, 0.7108031650297, 12741, 'https://mawaqit.net/fr/mosquee-de-bouzignac-tours-37000-france-1'),
  ('belle-fille-tours', 'Mosquée du Sanitas مسجد الصحابة', 'Tours', 'Allée de la Belle-Fille, 37000 Tours', 47.3795102, 0.6958124, 12779, 'https://mawaqit.net/fr/tcs-tours-37000-france')
on conflict (id) do update set
  name = excluded.name,
  city = excluded.city,
  address = excluded.address,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  mawaqit_id = excluded.mawaqit_id,
  mawaqit_url = excluded.mawaqit_url;
