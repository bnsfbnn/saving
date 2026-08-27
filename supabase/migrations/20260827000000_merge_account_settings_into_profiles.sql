-- ============================================================================
-- MERGE account_settings INTO profiles
-- Chay tren DB DANG CHAY. Idempotent, trong 1 transaction.
-- Chong chiu moi trang thai DB: tu tao bang thieu, tu bo qua bang khong ton tai.
--
-- CACH CHAY: Paste vao Supabase SQL Editor roi Run.
-- ============================================================================

BEGIN;

-- Buoc 1: Them cot opening_balance vao profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS opening_balance numeric(14,2);

-- Buoc 2: Dam bao profile 'default' ton tai
INSERT INTO public.profiles (id, name, color, accent, soft_accent)
VALUES ('default', 'Default', '#2563eb', '#2563eb', '#dbeafe')
ON CONFLICT (id) DO NOTHING;

-- Buoc 3: Copy opening_balance tu account_settings sang profiles
--         (chi chay neu bang account_settings con ton tai)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'account_settings'
  ) THEN
    -- 3a: match theo profile_id
    UPDATE public.profiles p
    SET opening_balance = a.opening_balance
    FROM public.account_settings a
    WHERE a.profile_id = p.id
      AND p.opening_balance IS NULL;

    -- 3b: neu 'default' van chua co, lay dong moi nhat con lai
    UPDATE public.profiles p
    SET opening_balance = (
      SELECT a.opening_balance FROM public.account_settings a
      ORDER BY a.updated_at DESC LIMIT 1
    )
    WHERE p.id = 'default'
      AND p.opening_balance IS NULL
      AND EXISTS (SELECT 1 FROM public.account_settings);
  END IF;
END $$;

-- Buoc 4: Xoa profile seed cu khong dung
DELETE FROM public.profiles WHERE id IN ('wife', 'husband');

-- Buoc 5: Xoa bang account_settings (neu co)
DROP TABLE IF EXISTS public.account_settings;

-- Buoc 6: Xoa bang khong con dung (neu co)
DROP TABLE IF EXISTS public.fixed_expense_overrides;
DROP TABLE IF EXISTS public.monthly_budgets;

-- Buoc 7: RLS + policy
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all" ON public.profiles;
DROP POLICY IF EXISTS "Allow all" ON public.categories;
DROP POLICY IF EXISTS "Allow all" ON public.transactions;
DROP POLICY IF EXISTS "Allow all" ON public.fixed_expenses;

CREATE POLICY "Allow all" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.fixed_expenses FOR ALL USING (true) WITH CHECK (true);

-- Buoc 8: Index chuan
CREATE INDEX IF NOT EXISTS categories_kind_idx ON public.categories (kind, name);
CREATE INDEX IF NOT EXISTS transactions_profile_month_idx ON public.transactions (profile_id, occurred_on DESC);
CREATE INDEX IF NOT EXISTS transactions_category_id_idx ON public.transactions (category_id);
CREATE INDEX IF NOT EXISTS fixed_expenses_profile_idx ON public.fixed_expenses (profile_id, is_active);
CREATE INDEX IF NOT EXISTS fixed_expenses_category_id_idx ON public.fixed_expenses (category_id);

COMMIT;

-- Kiem tra ket qua
SELECT id, name, opening_balance FROM public.profiles;
SELECT count(*) AS transactions FROM public.transactions;
SELECT count(*) AS fixed_expenses FROM public.fixed_expenses;
