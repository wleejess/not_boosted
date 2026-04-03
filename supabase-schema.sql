-- ============================================================
-- Not Boosted — MapleStory Guild Tracker
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

-- Users (extends Supabase auth.users)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  ign text not null default '',
  role text not null default 'member' check (role in ('member', 'admin')),
  created_at timestamptz not null default now()
);

-- Characters
create table public.characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  class text not null default '',
  level integer not null default 1,
  is_main boolean not null default false,
  created_at timestamptz not null default now()
);

-- Gear Slots
create table public.gear_slots (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  slot_name text not null,
  stars integer not null default 0 check (stars >= 0 and stars <= 25),
  flame_score integer not null default 0,
  potential_tier text not null default 'None' check (potential_tier in ('None','Rare','Epic','Unique','Legendary')),
  potential_line1 text not null default '',
  potential_line2 text not null default '',
  potential_line3 text not null default ''
);

-- Meso Savings
create table public.meso_savings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  amount bigint not null default 0,
  goal bigint,
  updated_at timestamptz not null default now()
);

-- Boss Drops
create table public.boss_drops (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  character_id uuid references public.characters(id) on delete set null,
  boss text not null,
  item text not null,
  pitched boolean not null default false,
  dropped_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.users enable row level security;
alter table public.characters enable row level security;
alter table public.gear_slots enable row level security;
alter table public.meso_savings enable row level security;
alter table public.boss_drops enable row level security;

-- Helper: check if current user is admin
create or replace function public.is_admin()
returns boolean
language sql security definer
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

-- users: anyone logged in can read; only self or admin can write
create policy "users: read all" on public.users for select to authenticated using (true);
create policy "users: insert own" on public.users for insert to authenticated with check (id = auth.uid());
create policy "users: update own or admin" on public.users for update to authenticated
  using (id = auth.uid() or public.is_admin());

-- characters: read all; write own or admin
create policy "characters: read all" on public.characters for select to authenticated using (true);
create policy "characters: insert own or admin" on public.characters for insert to authenticated
  with check (user_id = auth.uid() or public.is_admin());
create policy "characters: update own or admin" on public.characters for update to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy "characters: delete own or admin" on public.characters for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- gear_slots: readable by all; writable if you own the character or are admin
create policy "gear_slots: read all" on public.gear_slots for select to authenticated using (true);
create policy "gear_slots: write own or admin" on public.gear_slots for insert to authenticated
  with check (
    public.is_admin() or
    exists (select 1 from public.characters c where c.id = character_id and c.user_id = auth.uid())
  );
create policy "gear_slots: update own or admin" on public.gear_slots for update to authenticated
  using (
    public.is_admin() or
    exists (select 1 from public.characters c where c.id = character_id and c.user_id = auth.uid())
  );
create policy "gear_slots: delete own or admin" on public.gear_slots for delete to authenticated
  using (
    public.is_admin() or
    exists (select 1 from public.characters c where c.id = character_id and c.user_id = auth.uid())
  );

-- meso_savings: read all; write own or admin
create policy "meso: read all" on public.meso_savings for select to authenticated using (true);
create policy "meso: insert own or admin" on public.meso_savings for insert to authenticated
  with check (user_id = auth.uid() or public.is_admin());
create policy "meso: update own or admin" on public.meso_savings for update to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- boss_drops: read all; write own or admin
create policy "drops: read all" on public.boss_drops for select to authenticated using (true);
create policy "drops: insert own or admin" on public.boss_drops for insert to authenticated
  with check (user_id = auth.uid() or public.is_admin());
create policy "drops: delete own or admin" on public.boss_drops for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ============================================================
-- Auto-create users row on signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
as $$
begin
  insert into public.users (id, email, ign, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'ign', split_part(new.email, '@', 1)),
    'member'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
