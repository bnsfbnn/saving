import { supabase } from '../lib/supabase'
import type { AccountSettings, Category, FixedExpense, MonthlyBudget, Transaction } from '../types'
import { defaultCategories } from './defaults'

export type AppData = {
  accountSettings: AccountSettings[]
  categories: Category[]
  transactions: Transaction[]
  fixedExpenses: FixedExpense[]
  monthlyBudgets: MonthlyBudget[]
}

const fallbackAccountSettings: AccountSettings[] = [
  {
    owner_id: 'wife',
    opening_balance: 0,
    updated_at: new Date().toISOString(),
  },
  {
    owner_id: 'husband',
    opening_balance: 0,
    updated_at: new Date().toISOString(),
  },
]

export async function loadAppData(): Promise<{ data: AppData; message: string }> {
  if (!supabase) {
    return {
      data: {
        accountSettings: fallbackAccountSettings,
        categories: defaultCategories.map((category, index) => ({
          id: `default-${index}`,
          ...category,
          is_default: true,
          created_at: new Date().toISOString(),
        })),
        transactions: [],
        fixedExpenses: [],
        monthlyBudgets: [],
      },
      message: 'Chưa cấu hình Supabase. App đang hiển thị dữ liệu mặc định và chưa thể lưu.',
    }
  }

  const [categoriesRes, transactionsRes, fixedExpensesRes, monthlyBudgetsRes, accountRes] = await Promise.all([
    supabase.from('categories').select('*').order('kind', { ascending: true }).order('name', { ascending: true }),
    supabase.from('transactions').select('*').order('occurred_on', { ascending: false }),
    supabase.from('fixed_expenses').select('*').order('created_at', { ascending: false }),
    supabase.from('monthly_budgets').select('*').order('month_start', { ascending: false }),
    supabase.from('account_settings').select('*').order('owner_id', { ascending: true }),
  ])

  const firstError = categoriesRes.error ?? transactionsRes.error ?? fixedExpensesRes.error ?? monthlyBudgetsRes.error ?? accountRes.error
  if (firstError) {
    return {
      data: {
        accountSettings: fallbackAccountSettings,
        categories: [],
        transactions: [],
        fixedExpenses: [],
        monthlyBudgets: [],
      },
      message: firstError.message,
    }
  }

  let categories = (categoriesRes.data as Category[]) ?? []
  if (categories.length === 0) {
    const { data, error } = await supabase
      .from('categories')
      .insert(defaultCategories.map((category) => ({ ...category, is_default: true })))
      .select('*')
      .order('kind', { ascending: true })
      .order('name', { ascending: true })

    if (!error) categories = (data as Category[]) ?? []
  }

  let accountSettings = (accountRes.data as AccountSettings[]) ?? []

  // Đảm bảo cả vợ và chồng đều có account_settings
  const requiredOwners = ['wife', 'husband'] as const
  const missingOwners = requiredOwners.filter(
    (ownerId) => !accountSettings.some((settings) => settings.owner_id === ownerId),
  )

  if (missingOwners.length > 0) {
    const { data } = await supabase
      .from('account_settings')
      .upsert(
        missingOwners.map((ownerId) => ({ owner_id: ownerId, opening_balance: 0 })),
        { onConflict: 'owner_id' },
      )
      .select('*')

    if (data) {
      accountSettings = [...accountSettings, ...(data as AccountSettings[])]
    }
  }

  return {
    data: {
      accountSettings,
      categories,
      transactions: (transactionsRes.data as Transaction[]) ?? [],
      fixedExpenses: (fixedExpensesRes.data as FixedExpense[]) ?? [],
      monthlyBudgets: (monthlyBudgetsRes.data as MonthlyBudget[]) ?? [],
    },
    message: '',
  }
}
