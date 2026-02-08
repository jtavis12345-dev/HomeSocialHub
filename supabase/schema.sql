-- HomeSocial MVP schema
-- Paste into Supabase SQL Editor and run.

-- Extensions
create extension if not exists pgcrypto;

-- 1) Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'buyer',
  avatar_url text,
  bio text,
  service_area text,
  created_at timestamptz not null default now()
);

-- 2) Listings
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  price integer not null,
  beds integer not null default 0,
  baths integer not null default 0,
  sqft integer,
  address text not null,
  city text not null,
  state text not null,
  zip text not null,
  description text,
  status text not null default 'draft', -- draft/active/pending/sold
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listings_status_created_idx on public.listings(status, created_at desc);
create index if not exists listings_city_state_idx on public.listings(city, state);

-- 3) Media
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  type text not null check (type in ('photo','video')),
  storage_bucket text not null,
  storage_path text not null,
  thumbnail_path text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists media_listing_idx on public.media(listing_id, sort_order);

-- 4) Comments
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists comments_listing_created_idx on public.comments(listing_id, created_at desc);

-- 5) Messaging
create table if not exists public.threads (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.thread_members (
  thread_id uuid not null references public.threads(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);

create index if not exists thread_members_user_idx on public.thread_members(user_id, created_at desc);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_thread_created_idx on public.messages(thread_id, created_at asc);

-- Trigger: updated_at on listings
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists listings_set_updated_at on public.listings;
create trigger listings_set_updated_at
before update on public.listings
for each row execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.media enable row level security;
alter table public.comments enable row level security;
alter table public.threads enable row level security;
alter table public.thread_members enable row level security;
alter table public.messages enable row level security;

-- Profiles policies
create policy "profiles_select_own_or_public"
on public.profiles for select
to authenticated
using (true);

create policy "profiles_insert_self"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

create policy "profiles_update_self"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Listings policies
create policy "listings_select_public_active"
on public.listings for select
to anon, authenticated
using (status = 'active' or owner_id = auth.uid());

create policy "listings_insert_owner"
on public.listings for insert
to authenticated
with check (owner_id = auth.uid());

create policy "listings_update_owner"
on public.listings for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "listings_delete_owner"
on public.listings for delete
to authenticated
using (owner_id = auth.uid());

-- Media policies
create policy "media_select_public"
on public.media for select
to anon, authenticated
using (true);

create policy "media_insert_owner_via_listing"
on public.media for insert
to authenticated
with check (
  exists (
    select 1 from public.listings l
    where l.id = media.listing_id and l.owner_id = auth.uid()
  )
);

create policy "media_delete_owner_via_listing"
on public.media for delete
to authenticated
using (
  exists (
    select 1 from public.listings l
    where l.id = media.listing_id and l.owner_id = auth.uid()
  )
);

-- Comments policies
create policy "comments_select_public"
on public.comments for select
to anon, authenticated
using (true);

create policy "comments_insert_authenticated"
on public.comments for insert
to authenticated
with check (user_id = auth.uid());

create policy "comments_delete_self"
on public.comments for delete
to authenticated
using (user_id = auth.uid());

-- Threads policies: member-only access
create policy "threads_select_if_member"
on public.threads for select
to authenticated
using (
  exists (
    select 1 from public.thread_members tm
    where tm.thread_id = threads.id and tm.user_id = auth.uid()
  )
);

create policy "threads_insert_authenticated"
on public.threads for insert
to authenticated
with check (true);

create policy "thread_members_select_if_self_or_member"
on public.thread_members for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.thread_members tm
    where tm.thread_id = thread_members.thread_id and tm.user_id = auth.uid()
  )
);

create policy "thread_members_insert_authenticated"
on public.thread_members for insert
to authenticated
with check (true);

-- Messages policies: member-only
create policy "messages_select_if_member"
on public.messages for select
to authenticated
using (
  exists (
    select 1 from public.thread_members tm
    where tm.thread_id = messages.thread_id and tm.user_id = auth.uid()
  )
);

create policy "messages_insert_if_sender_member"
on public.messages for insert
to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.thread_members tm
    where tm.thread_id = messages.thread_id and tm.user_id = auth.uid()
  )
);

-- Auto-create profile row on signup (optional but recommended)
create or replace function public.handle_new_user()
returns trigger language plpgsql as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'buyer')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
