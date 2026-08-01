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

export type AccountSettings = {
  profile_id: string
  opening_balance: number
  updated_at: string
}

export type CategoryDraft = Pick<Category, 'name' | 'kind' | 'color' | 'icon'>
