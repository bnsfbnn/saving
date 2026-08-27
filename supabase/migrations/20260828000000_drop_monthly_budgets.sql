-- ============================================================================
-- DROP monthly_budgets
-- App khong con dung bang nay: "So tien dau thang" duoc tinh tu du lieu
-- (opening_balance + thu - chi cac thang truoc) thay vi nhap tay.
--
-- Du lieu duoc archive truoc khi drop (de phong, co the DROP bang archive
-- sau khi xac nhan app chay on).
--
-- Idempotent, trong 1 transaction.
-- CACH CHAY: Paste vao Supabase SQL Editor roi Run.
-- ============================================================================

BEGIN;

-- Buoc 1: Archive du lieu (neu bang ton tai va co du lieu)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'monthly_budgets'
  ) THEN
    CREATE TABLE IF NOT EXISTS public._archive_monthly_budgets AS
      SELECT * FROM public.monthly_budgets;
  END IF;
END $$;

-- Buoc 2: Drop bang
DROP TABLE IF EXISTS public.monthly_budgets CASCADE;

COMMIT;

-- Kiem tra ket qua (an toan neu bang archive khong ton tai)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = '_archive_monthly_budgets'
  ) THEN
    RAISE NOTICE 'Archived rows: %', (SELECT count(*) FROM public._archive_monthly_budgets);
  ELSE
    RAISE NOTICE 'monthly_budgets did not exist - nothing to archive.';
  END IF;
END $$;
