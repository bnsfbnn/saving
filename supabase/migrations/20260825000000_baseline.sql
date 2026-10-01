-- ============================================================================
-- BASELINE SCHEMA — Saving App
-- Schema duy nhat cho DATABASE MOI. Chay 1 lan trong Supabase SQL Editor
-- (hoac de Supabase tu chay qua migrations) khi deploy ung dung moi.
--
-- Quy uoc:
--   * snake_case identifiers
--   * uuid PK via gen_random_uuid() (tru profiles dung text PK)
--   * timestamptz created_at default now()
--   * RLS bat tren moi bang kem policy "Allow all" (app single-user)
--   * profile_id la soft reference (khong FK): app co the dung 'default'
--   * opening_balance NULL = tai khoan chua khoi tao -> app hien man hinh
--     "Bat dau tiet kiem" de nhap so du ban dau
-- ============================================================================

create extension if not exists pgcrypto;

-- ── profiles ────────────────────────────────────────────────────────────────
-- Ho so nguoi dung + so du khoi tao (opening_balance).
-- opening_balance de NULL: app se hien form nhap so du lan dau.
create table if not exists public.profiles (
  id text primary key,
  name text not null,
  color text not null default '#64748b',
  accent text not null default '#64748b',
  soft_accent text not null default '#f1f5f9',
  opening_balance numeric(14,2),
  created_at timestamptz not null default now()
);

-- ── categories ──────────────────────────────────────────────────────────────
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('income', 'expense', 'fixed_expense')),
  color text not null default '#2563eb',
  icon text not null default '🧾',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (kind, name)
);

-- ── transactions ────────────────────────────────────────────────────────────
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  profile_id text not null,
  type text not null check (type in ('income', 'expense')),
  category_id uuid not null references public.categories(id) on delete restrict,
  amount numeric(14,2) not null check (amount > 0),
  occurred_on date not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

-- ── fixed_expenses ──────────────────────────────────────────────────────────
create table if not exists public.fixed_expenses (
  id uuid primary key default gen_random_uuid(),
  profile_id text not null,
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  amount numeric(14,2) not null check (amount > 0),
  frequency text not null check (frequency in ('weekly', 'monthly')),
  day_of_month integer check (day_of_month between 1 and 31),
  day_of_week integer check (day_of_week between 0 and 6),
  start_date date not null,
  is_active boolean not null default true,
  note text not null default '',
  created_at timestamptz not null default now(),
  check (
    (frequency = 'monthly' and day_of_month is not null and day_of_week is null)
    or
    (frequency = 'weekly' and day_of_week is not null and day_of_month is null)
  )
);

-- ── indexes ─────────────────────────────────────────────────────────────────
create index if not exists categories_kind_idx on public.categories (kind, name);
create index if not exists transactions_profile_month_idx on public.transactions (profile_id, occurred_on desc);
create index if not exists transactions_category_id_idx on public.transactions (category_id);
create index if not exists fixed_expenses_profile_idx on public.fixed_expenses (profile_id, is_active);
create index if not exists fixed_expenses_category_id_idx on public.fixed_expenses (category_id);

-- ── row level security ──────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.fixed_expenses enable row level security;

drop policy if exists "Allow all" on public.profiles;
drop policy if exists "Allow all" on public.categories;
drop policy if exists "Allow all" on public.transactions;
drop policy if exists "Allow all" on public.fixed_expenses;

create policy "Allow all" on public.profiles for all using (true) with check (true);
create policy "Allow all" on public.categories for all using (true) with check (true);
create policy "Allow all" on public.transactions for all using (true) with check (true);
create policy "Allow all" on public.fixed_expenses for all using (true) with check (true);

-- ── seed data ───────────────────────────────────────────────────────────────
-- Profile 'default' voi opening_balance NULL -> lan dau mo app se hien
-- man hinh "Bat dau tiet kiem" de nhap so du ban dau.
insert into public.profiles (id, name, color, accent, soft_accent) values
  ('default', 'Default', '#2563eb', '#2563eb', '#dbeafe')
on conflict (id) do nothing;

insert into public.categories (name, kind, color, icon, is_default) values
  ('Lương', 'income', '#16a34a', '💼', true),
  ('Thưởng', 'income', '#ca8a04', '🎁', true),
  ('Thu nhập phụ', 'income', '#0f766e', '💰', true),
  ('Ăn uống', 'expense', '#ea580c', '🍜', true),
  ('Đi chợ', 'expense', '#16a34a', '🛒', true),
  ('Di chuyển', 'expense', '#2563eb', '🚗', true),
  ('Sức khỏe', 'expense', '#dc2626', '💊', true),
  ('Cà phê', 'expense', '#7c3aed', '☕', true),
  ('Tiền nhà', 'fixed_expense', '#64748b', '🏠', true),
  ('Điện nước', 'fixed_expense', '#ca8a04', '💡', true),
  ('Internet/Điện thoại', 'fixed_expense', '#2563eb', '📱', true),
  ('Học phí', 'fixed_expense', '#7c3aed', '🎓', true)
on conflict (kind, name) do nothing;
