-- ============================================================
-- CoachFlow - Supabase SQL Schema
-- Run this ENTIRE script in your Supabase SQL Editor
-- Dashboard > SQL Editor > New Query > Paste & Run
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- 1. PROFILES TABLE
-- ─────────────────────────────────────────
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  email text,
  role text not null default 'client' check (role in ('coach', 'client')),
  phone text,
  bio text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'client')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────
-- 2. CLIENTS TABLE
-- ─────────────────────────────────────────
create table public.clients (
  id uuid primary key default uuid_generate_v4(),
  coach_id uuid references public.profiles(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  email text,
  phone text,
  age integer,
  coaching_focus text,
  start_date date default current_date,
  status text default 'active' check (status in ('active', 'inactive', 'completed')),
  bio text,
  avatar_color text default '#34d399',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─────────────────────────────────────────
-- 3. SESSIONS TABLE
-- ─────────────────────────────────────────
create table public.sessions (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references public.clients(id) on delete cascade not null,
  coach_id uuid references public.profiles(id) on delete cascade not null,
  session_date timestamptz not null,
  duration_minutes integer default 60,
  title text,
  notes text,
  mood text check (mood in ('excellent', 'good', 'neutral', 'challenging', 'difficult')),
  next_steps text,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────
-- 4. GOALS TABLE
-- ─────────────────────────────────────────
create table public.goals (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references public.clients(id) on delete cascade not null,
  coach_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  category text,
  target_date date,
  status text default 'active' check (status in ('active', 'completed', 'paused', 'cancelled')),
  progress_percentage integer default 0 check (progress_percentage between 0 and 100),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─────────────────────────────────────────
-- 5. PROGRESS ENTRIES TABLE
-- ─────────────────────────────────────────
create table public.progress_entries (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references public.clients(id) on delete cascade not null,
  goal_id uuid references public.goals(id) on delete set null,
  coach_id uuid references public.profiles(id) on delete cascade not null,
  metric_name text not null,
  value numeric not null,
  unit text,
  notes text,
  recorded_at timestamptz default now()
);

-- ─────────────────────────────────────────
-- 6. MESSAGES TABLE
-- ─────────────────────────────────────────
create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete cascade not null,
  content text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────
-- 7. ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.sessions enable row level security;
alter table public.goals enable row level security;
alter table public.progress_entries enable row level security;
alter table public.messages enable row level security;

-- PROFILES policies
create policy "Users can view their own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Coaches can view client profiles" on public.profiles
  for select using (
    exists (
      select 1 from public.clients
      where clients.coach_id = auth.uid()
      and clients.user_id = profiles.id
    )
  );

-- CLIENTS policies
create policy "Coaches can manage their clients" on public.clients
  for all using (coach_id = auth.uid());

create policy "Clients can view their own record" on public.clients
  for select using (user_id = auth.uid());

-- SESSIONS policies
create policy "Coaches can manage their sessions" on public.sessions
  for all using (coach_id = auth.uid());

create policy "Clients can view their sessions" on public.sessions
  for select using (
    exists (
      select 1 from public.clients
      where clients.id = sessions.client_id
      and clients.user_id = auth.uid()
    )
  );

-- GOALS policies
create policy "Coaches can manage their goals" on public.goals
  for all using (coach_id = auth.uid());

create policy "Clients can view their goals" on public.goals
  for select using (
    exists (
      select 1 from public.clients
      where clients.id = goals.client_id
      and clients.user_id = auth.uid()
    )
  );

-- PROGRESS ENTRIES policies
create policy "Coaches can manage progress entries" on public.progress_entries
  for all using (coach_id = auth.uid());

create policy "Clients can view their progress" on public.progress_entries
  for select using (
    exists (
      select 1 from public.clients
      where clients.id = progress_entries.client_id
      and clients.user_id = auth.uid()
    )
  );

-- MESSAGES policies
create policy "Users can view messages in their conversations" on public.messages
  for select using (
    sender_id = auth.uid()
    or exists (
      select 1 from public.clients
      where clients.id = messages.client_id
      and (clients.coach_id = auth.uid() or clients.user_id = auth.uid())
    )
  );

create policy "Users can send messages" on public.messages
  for insert with check (sender_id = auth.uid());

create policy "Users can mark messages as read" on public.messages
  for update using (
    exists (
      select 1 from public.clients
      where clients.id = messages.client_id
      and (clients.coach_id = auth.uid() or clients.user_id = auth.uid())
    )
  );

-- ─────────────────────────────────────────
-- 8. REALTIME (enable for messages)
-- ─────────────────────────────────────────
alter publication supabase_realtime add table public.messages;

-- Done! ✅
select 'Schema created successfully! 🎉' as status;
