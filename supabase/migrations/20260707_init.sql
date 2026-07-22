-- Supabase migration for Saving App
-- Apply this in the Supabase SQL editor or as a migration file.

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  period text not null check (period in ('day', 'week', 'month')),
  color text not null default '#38bdf8',
  icon text not null default '📝',
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  spent_at date not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

alter table public.categories
  add column if not exists icon text not null default '📝';

create index if not exists categories_created_at_idx on public.categories (created_at desc);
create index if not exists transactions_category_id_idx on public.transactions (category_id);
create index if not exists transactions_spent_at_idx on public.transactions (spent_at desc);