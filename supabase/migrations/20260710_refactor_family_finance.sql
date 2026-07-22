-- Refactor schema for two-person income and expense management.
-- This migration intentionally drops the old simple schema because the app is rebuilt from a new spec.

create extension if not exists pgcrypto;

drop table if exists public.monthly_budgets cascade;
drop table if exists public.fixed_expenses cascade;
drop table if exists public.transactions cascade;
drop table if exists public.account_settings cascade;
drop table if exists public.categories cascade;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('income', 'expense', 'fixed_expense')),
  color text not null default '#2563eb',
  icon text not null default '🧾',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (kind, name)
);

create table public.account_settings (
  id text primary key default 'main' check (id = 'main'),
  opening_balance numeric(14,2) not null default 0,
  updated_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null check (owner_id in ('wife', 'husband')),
  type text not null check (type in ('income', 'expense')),
  category_id uuid not null references public.categories(id) on delete restrict,
  amount numeric(14,2) not null check (amount > 0),
  occurred_on date not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create table public.fixed_expenses (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null check (owner_id in ('wife', 'husband')),
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

create table public.monthly_budgets (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null check (owner_id in ('wife', 'husband')),
  month_start date not null,
  starting_amount numeric(14,2) not null default 0,
  note text not null default '',
  created_at timestamptz not null default now(),
  unique (owner_id, month_start),
  check (date_trunc('month', month_start)::date = month_start)
);

insert into public.account_settings (id, opening_balance)
values ('main', 0)
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

create index categories_kind_idx on public.categories (kind, name);
create index transactions_owner_month_idx on public.transactions (owner_id, occurred_on desc);
create index transactions_category_id_idx on public.transactions (category_id);
create index fixed_expenses_owner_idx on public.fixed_expenses (owner_id, is_active);
create index fixed_expenses_category_id_idx on public.fixed_expenses (category_id);
create index monthly_budgets_owner_month_idx on public.monthly_budgets (owner_id, month_start desc);
