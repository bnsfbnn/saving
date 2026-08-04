-- Monthly override for fixed expenses.
-- This keeps the original fixed expense as a base rule and allows a specific month to override amount without mutating older months.

CREATE TABLE IF NOT EXISTS public.fixed_expense_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixed_expense_id UUID NOT NULL REFERENCES public.fixed_expenses(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month_start DATE NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (fixed_expense_id, profile_id, month_start),
  CHECK (date_trunc('month', month_start)::date = month_start)
);

CREATE INDEX IF NOT EXISTS fixed_expense_overrides_profile_month_idx
  ON public.fixed_expense_overrides (profile_id, month_start DESC);

CREATE INDEX IF NOT EXISTS fixed_expense_overrides_fixed_expense_idx
  ON public.fixed_expense_overrides (fixed_expense_id, month_start DESC);
