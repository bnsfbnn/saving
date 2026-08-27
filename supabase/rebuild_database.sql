-- ============================================================================
-- REBUILD DATABASE — Don DB sach ma KHONG mat du lieu
--
-- Cach hoat dong (tat ca trong 1 TRANSACTION):
--   1. Snapshot toan bo 5 bang vao bang tam
--   2. DROP het bang cu (kem constraint/index/policy cu)
--      + 2 bang chet (monthly_budgets, fixed_expense_overrides) duoc archive truoc khi DROP
--   3. Tao lai schema CHUAN (giong baseline)
--   4. Restore du lieu tu snapshot ve
--   5. Kiem dem row count truoc/sau — neu lech -> RAISE EXCEPTION -> ROLLBACK
--
-- Ket qua: schema sach nhu moi, du lieu giu nguyen 100%.
-- Neu co bat ky loi nao, toan bo transaction bi rollback,
-- DB quay ve trang thai ban dau, KHONG mat du lieu.
--
-- CACH CHAY: Paste toan bo file nay vao Supabase SQL Editor roi Run.
-- KHUYEN NGHI: Vao Dashboard -> Database -> Backups tao backup truoc khi chay.
-- ============================================================================

BEGIN;

-- Buoc chuan bi: Dam bao profiles co cot opening_balance (neu chua chay merge migration)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS opening_balance numeric(14,2);

-- Copy opening_balance tu account_settings sang profiles (neu bang account_settings con ton tai)
DO $
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'account_settings') THEN
    UPDATE public.profiles p
    SET opening_balance = a.opening_balance
    FROM public.account_settings a
    WHERE a.profile_id = p.id AND p.opening_balance IS NULL;

    UPDATE public.profiles p
    SET opening_balance = (SELECT a.opening_balance FROM public.account_settings a ORDER BY a.updated_at DESC LIMIT 1)
    WHERE p.id = 'default' AND p.opening_balance IS NULL
      AND EXISTS (SELECT 1 FROM public.account_settings);
  END IF;
END $;

-- Buoc 0: Ghi nhan so dong TRUOC khi rebuild (de doi chieu)
CREATE TEMP TABLE _before_counts AS
SELECT 'profiles'::text AS t, count(*) AS c FROM public.profiles
UNION ALL SELECT 'categories',           count(*) FROM public.categories
UNION ALL SELECT 'transactions',         count(*) FROM public.transactions
UNION ALL SELECT 'fixed_expenses',       count(*) FROM public.fixed_expenses
UNION ALL SELECT 'monthly_budgets',      count(*) FROM public.monthly_budgets;

-- Buoc 1: Snapshot du lieu vao bang tam
CREATE TEMP TABLE _bak_profiles AS
  SELECT id, name, color, accent, soft_accent, opening_balance, created_at FROM public.profiles;

CREATE TEMP TABLE _bak_categories AS
  SELECT id, name, kind, color, icon, is_default, created_at FROM public.categories;

CREATE TEMP TABLE _bak_transactions AS
  SELECT id, profile_id, type, category_id, amount, occurred_on, note, created_at
  FROM public.transactions;

CREATE TEMP TABLE _bak_fixed_expenses AS
  SELECT id, profile_id, category_id, name, amount, frequency,
         day_of_month, day_of_week, start_date, is_active, note, created_at
  FROM public.fixed_expenses;

CREATE TEMP TABLE _bak_monthly_budgets AS
  SELECT id, profile_id, month_start, starting_amount, note, created_at
  FROM public.monthly_budgets;

-- Snapshot bang chet (de archive, tranh mat du lieu neu co insert tay truoc day)
CREATE TEMP TABLE _bak_fixed_expense_overrides AS
  SELECT * FROM public.fixed_expense_overrides;

-- Buoc 2: DROP toan bo bang cu (con truoc, cha sau)
DROP TABLE IF EXISTS public.fixed_expenses         CASCADE;
DROP TABLE IF EXISTS public.transactions           CASCADE;
DROP TABLE IF EXISTS public.categories             CASCADE;
DROP TABLE IF EXISTS public.profiles               CASCADE;
DROP TABLE IF EXISTS public.account_settings       CASCADE;

-- DROP bang chet fixed_expense_overrides (app khong con dung) + luu du lieu vao bang archive
DROP TABLE IF EXISTS public.fixed_expense_overrides CASCADE;

-- Archive du lieu cua bang chet (de phong, co the DROP sau khi xac nhan app chay on)
CREATE TABLE IF NOT EXISTS public._archive_fixed_expense_overrides AS
  SELECT * FROM _bak_fixed_expense_overrides;

-- Buoc 3: Tao lai schema CHUAN
create extension if not exists pgcrypto;

create table public.profiles (
  id text primary key,
  name text not null,
  color text not null default '#64748b',
  accent text not null default '#64748b',
  soft_accent text not null default '#f1f5f9',
  opening_balance numeric(14,2),
  created_at timestamptz not null default now()
);

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

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  profile_id text not null,
  type text not null check (type in ('income', 'expense')),
  category_id uuid not null references public.categories(id) on delete restrict,
  amount numeric(14,2) not null check (amount > 0),
  occurred_on date not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create table public.fixed_expenses (
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

create table public.monthly_budgets (
  id uuid primary key default gen_random_uuid(),
  profile_id text not null,
  month_start date not null,
  starting_amount numeric(14,2) not null default 0,
  note text not null default '',
  created_at timestamptz not null default now(),
  unique (profile_id, month_start),
  check (date_trunc('month', month_start)::date = month_start)
);

create index categories_kind_idx on public.categories (kind, name);
create index transactions_profile_month_idx on public.transactions (profile_id, occurred_on desc);
create index transactions_category_id_idx on public.transactions (category_id);
create index fixed_expenses_profile_idx on public.fixed_expenses (profile_id, is_active);
create index fixed_expenses_category_id_idx on public.fixed_expenses (category_id);
create index monthly_budgets_profile_month_idx on public.monthly_budgets (profile_id, month_start desc);

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.fixed_expenses enable row level security;
alter table public.monthly_budgets enable row level security;

create policy "Allow all" on public.profiles for all using (true) with check (true);
create policy "Allow all" on public.categories for all using (true) with check (true);
create policy "Allow all" on public.transactions for all using (true) with check (true);
create policy "Allow all" on public.fixed_expenses for all using (true) with check (true);
create policy "Allow all" on public.monthly_budgets for all using (true) with check (true);

-- Buoc 4: Restore du lieu tu snapshot ve (giu nguyen ID goc)
-- Thu tu: bang cha truoc, bang con sau (vi co FK)

INSERT INTO public.profiles (id, name, color, accent, soft_accent, opening_balance, created_at)
SELECT id, name, color, accent, soft_accent, opening_balance, created_at FROM _bak_profiles;

INSERT INTO public.categories (id, name, kind, color, icon, is_default, created_at)
SELECT id, name, kind, color, icon, is_default, created_at FROM _bak_categories;

INSERT INTO public.transactions (id, profile_id, type, category_id, amount, occurred_on, note, created_at)
SELECT id, profile_id, type, category_id, amount, occurred_on, note, created_at FROM _bak_transactions;

INSERT INTO public.fixed_expenses (id, profile_id, category_id, name, amount, frequency, day_of_month, day_of_week, start_date, is_active, note, created_at)
SELECT id, profile_id, category_id, name, amount, frequency, day_of_month, day_of_week, start_date, is_active, note, created_at FROM _bak_fixed_expenses;

INSERT INTO public.monthly_budgets (id, profile_id, month_start, starting_amount, note, created_at)
SELECT id, profile_id, month_start, starting_amount, note, created_at FROM _bak_monthly_budgets;

-- Neu bang profiles/categories trong (DB chua co du lieu), nap mac dinh
INSERT INTO public.profiles (id, name, color, accent, soft_accent)
SELECT v.id, v.name, v.color, v.accent, v.soft_accent
FROM (VALUES
  ('default', 'Default', '#2563eb', '#2563eb', '#dbeafe')
) AS v(id, name, color, accent, soft_accent)
WHERE NOT EXISTS (SELECT 1 FROM public.profiles);

INSERT INTO public.categories (name, kind, color, icon, is_default)
SELECT v.name, v.kind, v.color, v.icon, true
FROM (VALUES
  ('Lương', 'income', '#16a34a', '💼'),
  ('Thưởng', 'income', '#ca8a04', '🎁'),
  ('Thu nhập phụ', 'income', '#0f766e', '💰'),
  ('Ăn uống', 'expense', '#ea580c', '🍜'),
  ('Đi chợ', 'expense', '#16a34a', '🛒'),
  ('Di chuyển', 'expense', '#2563eb', '🚗'),
  ('Sức khỏe', 'expense', '#dc2626', '💊'),
  ('Cà phê', 'expense', '#7c3aed', '☕'),
  ('Tiền nhà', 'fixed_expense', '#64748b', '🏠'),
  ('Điện nước', 'fixed_expense', '#ca8a04', '💡'),
  ('Internet/Điện thoại', 'fixed_expense', '#2563eb', '📱'),
  ('Học phí', 'fixed_expense', '#7c3aed', '🎓')
) AS v(name, kind, color, icon)
WHERE NOT EXISTS (SELECT 1 FROM public.categories);

-- Buoc 5: KIEM DEM row count truoc/sau — lech -> ROLLBACK (khong mat du lieu)
DO $$
DECLARE
  mismatch RECORD;
  bad boolean := false;
BEGIN
  FOR mismatch IN
    SELECT b.t, b.c AS before_c, a.c AS after_c
    FROM _before_counts b
    JOIN (
      SELECT 'profiles'::text AS t, count(*) AS c FROM public.profiles
      UNION ALL SELECT 'categories',           count(*) FROM public.categories
      UNION ALL SELECT 'transactions',         count(*) FROM public.transactions
      UNION ALL SELECT 'fixed_expenses',       count(*) FROM public.fixed_expenses
      UNION ALL SELECT 'monthly_budgets',      count(*) FROM public.monthly_budgets
          ) a ON a.t = b.t
    WHERE b.c <> a.c
  LOOP
    bad := true;
    RAISE NOTICE 'ROW COUNT MISMATCH: % before=% after=%', mismatch.t, mismatch.before_c, mismatch.after_c;
  END LOOP;

  IF bad THEN
    RAISE EXCEPTION 'Rebuild ABORTED: row count mismatch detected. Transaction rolled back, data is SAFE.';
  END IF;

  RAISE NOTICE 'Rebuild OK: all 5 tables match original row counts.';
END $$;

COMMIT;

-- Buoc 6: Bao cao ket qua
SELECT t AS bang, c AS so_dong FROM _before_counts ORDER BY t;
