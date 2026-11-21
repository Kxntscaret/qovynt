-- ====================================================================
-- QOVYNT Supabase Database Schema
-- Production PostgreSQL Database Schema with Row Level Security (RLS)
-- ====================================================================

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  email text,
  avatar_url text,
  quote text default 'ทุกก้าวเล็ก ๆ คือความสำเร็จที่ยิ่งใหญ่',
  monthly_savings_target numeric default 10000,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using ( auth.uid() = id );

create policy "Users can update own profile"
  on public.profiles for update
  using ( auth.uid() = id );

create policy "Users can insert own profile"
  on public.profiles for insert
  with check ( auth.uid() = id );

-- 2. TRANSACTIONS TABLE (Finance: รายรับ, รายจ่าย)
create table if not exists public.transactions (
  id text primary key,
  user_id uuid references auth.users on delete cascade default auth.uid(),
  title text not null,
  amount numeric not null default 0,
  type text not null check (type in ('income', 'expense')),
  category text not null,
  date timestamp with time zone default timezone('utc'::text, now()),
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.transactions enable row level security;

create policy "Users can view own transactions"
  on public.transactions for select
  using ( auth.uid() = user_id );

create policy "Users can insert own transactions"
  on public.transactions for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own transactions"
  on public.transactions for update
  using ( auth.uid() = user_id );

create policy "Users can delete own transactions"
  on public.transactions for delete
  using ( auth.uid() = user_id );

create index if not exists idx_transactions_user on public.transactions(user_id, date desc);

-- 3. TASKS TABLE (งานที่ต้องทำ)
create table if not exists public.tasks (
  id text primary key,
  user_id uuid references auth.users on delete cascade default auth.uid(),
  title text not null,
  category text default 'งาน',
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  status text default 'todo' check (status in ('todo', 'in_progress', 'completed')),
  due_date date,
  completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.tasks enable row level security;

create policy "Users can view own tasks"
  on public.tasks for select
  using ( auth.uid() = user_id );

create policy "Users can insert own tasks"
  on public.tasks for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own tasks"
  on public.tasks for update
  using ( auth.uid() = user_id );

create policy "Users can delete own tasks"
  on public.tasks for delete
  using ( auth.uid() = user_id );

-- 4. CALENDAR EVENTS (ปฏิทินส่วนตัว)
create table if not exists public.calendar_events (
  id text primary key,
  user_id uuid references auth.users on delete cascade default auth.uid(),
  title text not null,
  date date not null,
  start_time text not null,
  end_time text not null,
  category text default 'ทั่วไป',
  color text default 'purple',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.calendar_events enable row level security;

create policy "Users can manage own calendar events"
  on public.calendar_events for all
  using ( auth.uid() = user_id );

-- 5. GOALS (เป้าหมายและความคืบหน้า)
create table if not exists public.goals (
  id text primary key,
  user_id uuid references auth.users on delete cascade default auth.uid(),
  title text not null,
  current numeric default 0,
  target numeric not null,
  unit text default '฿',
  remaining_text text,
  category text default 'finance',
  icon text default 'target',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.goals enable row level security;

create policy "Users can manage own goals"
  on public.goals for all
  using ( auth.uid() = user_id );

-- 6. NOTES (บันทึกส่วนตัว)
create table if not exists public.notes (
  id text primary key,
  user_id uuid references auth.users on delete cascade default auth.uid(),
  title text not null,
  content text default '',
  color text default 'purple',
  is_pinned boolean default false,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.notes enable row level security;

create policy "Users can manage own notes"
  on public.notes for all
  using ( auth.uid() = user_id );

-- 7. PROJECTS (โปรเจกต์ที่กำลังทำ)
create table if not exists public.projects (
  id text primary key,
  user_id uuid references auth.users on delete cascade default auth.uid(),
  title text not null,
  stage text default 'วางแผน',
  progress integer default 0,
  category text default 'General',
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.projects enable row level security;

create policy "Users can manage own projects"
  on public.projects for all
  using ( auth.uid() = user_id );

-- 8. HABITS (นิสัยและกิจวัตรประจำวัน)
create table if not exists public.habits (
  id text primary key,
  user_id uuid references auth.users on delete cascade default auth.uid(),
  title text not null,
  streak integer default 0,
  completed_today boolean default false,
  icon text default 'zap',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.habits enable row level security;

create policy "Users can manage own habits"
  on public.habits for all
  using ( auth.uid() = user_id );
