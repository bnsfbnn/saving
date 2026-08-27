// ── Domain types ──────────────────────────────────────────────────────────────

export type CategoryKind = 'income' | 'expense' | 'fixed_expense'
export type TransactionType = 'income' | 'expense'
export type FixedFrequency = 'weekly' | 'monthly'
export type Screen = 'dashboard' | 'calendar' | 'fixed' | 'categories'

export type Profile = {
  id: string
  name: string
  color: string
  accent: string
  soft_accent: string
  opening_balance: number
  created_at: string
}

export type Category = {
  id: string
  name: string
  kind: CategoryKind
  color: string
  icon: string
  is_default: boolean
  created_at: string
}

export type Transaction = {
  id: string
  profile_id: string
  type: TransactionType
  category_id: string
  amount: number
  occurred_on: string
  note: string
  created_at: string
}

export type FixedExpense = {
  id: string
  profile_id: string
  category_id: string
  name: string
  amount: number
  frequency: FixedFrequency
  day_of_month: number | null
  day_of_week: number | null
  start_date: string
  is_active: boolean
  note: string
  created_at: string
}

export type MonthlyBudget = {
  id: string
  profile_id: string
  month_start: string
  starting_amount: number
  note: string
  created_at: string
}

// ── Draft types (for forms) ───────────────────────────────────────────────────

export type TransactionDraft = {
  type: TransactionType
  category_id: string
  amount: string
  occurred_on: string
  note: string
}

export type CategoryDraft = Pick<Category, 'name' | 'kind' | 'color' | 'icon'>

export type FixedExpenseDraft = {
  name: string
  category_id: string
  amount: string
  frequency: FixedFrequency
  day_of_month: string
  day_of_week: string
  start_date: string
  is_active: boolean
  note: string
}
