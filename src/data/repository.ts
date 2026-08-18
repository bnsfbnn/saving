import { supabase } from '../lib/supabase'
import type { AccountSettings, Category, FixedExpense, FixedExpenseOverride, MonthlyBudget, Profile, Transaction } from '../types'
import { defaultCategories } from './defaults'

export type AppData = {
  profiles: Profile[]
  profileId: string
  accountSettings: AccountSettings[]
  categories: Category[]
  transactions: Transaction[]
  fixedExpenses: FixedExpense[]
  fixedExpenseOverrides: FixedExpenseOverride[]
  monthlyBudgets: MonthlyBudget[]
}

const fallbackAccountSettings: AccountSettings[] = [{
  profile_id: 'default',
  opening_balance: 0,
  updated_at: new Date().toISOString(),
}]

const fallbackProfile: Profile = {
  id: 'default',
  name: 'Default',
  color: '#2563eb',
  accent: '#2563eb',
  soft_accent: '#dbeafe',
  created_at: new Date().toISOString(),
}

export async function loadAppData(): Promise<{ data: AppData; message: string }> {
  if (!supabase) {
    return {
      data: {
        profiles: [fallbackProfile],
        profileId: fallbackProfile.id,
        accountSettings: fallbackAccountSettings,
        categories: defaultCategories.map((category, index) => ({
          id: `default-${index}`,
          ...category,
          is_default: true,
          created_at: new Date().toISOString(),
        })),
        transactions: [],
        fixedExpenses: [],
        fixedExpenseOverrides: [],
        monthlyBudgets: [],
      },
      message: 'Chưa cấu hình Supabase. App đang hiển thị dữ liệu mặc định và chưa thể lưu.',
    }
  }

  const [profilesRes, categoriesRes, transactionsRes, fixedExpensesRes, fixedExpenseOverridesRes, monthlyBudgetsRes, accountRes] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: true }).maybeSingle(),
    supabase.from('categories').select('*').order('kind', { ascending: true }).order('name', { ascending: true }),
    supabase.from('transactions').select('*').order('occurred_on', { ascending: false }),
    supabase.from('fixed_expenses').select('*').order('created_at', { ascending: false }),
    supabase.from('fixed_expense_overrides').select('*').order('month_start', { ascending: false }),
    supabase.from('monthly_budgets').select('*').order('month_start', { ascending: false }),
    supabase.from('account_settings').select('*').order('profile_id', { ascending: true }),
  ])

  const firstError = profilesRes.error ?? categoriesRes.error ?? transactionsRes.error ?? fixedExpensesRes.error ?? fixedExpenseOverridesRes.error ?? monthlyBudgetsRes.error ?? accountRes.error
  if (firstError) {
    return {
      data: {
        profiles: [fallbackProfile],
        profileId: fallbackProfile.id,
        accountSettings: fallbackAccountSettings,
        categories: [],
        transactions: [],
        fixedExpenses: [],
        fixedExpenseOverrides: [],
        monthlyBudgets: [],
      },
      message: firstError.message,
    }
  }

  let profiles = (Array.isArray((profilesRes.data as Profile[] | null)) ? (profilesRes.data as Profile[]) : [])
  if (!profiles.length && (profilesRes.data as Profile | null)) {
    profiles = [profilesRes.data as Profile]
  }

  const currentProfileId = profiles.length === 1 ? profiles[0].id : 'default'

  // Load categories
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

  let accountSettings = ((accountRes.data as AccountSettings[]) ?? []).filter((item) => item.profile_id === currentProfileId || currentProfileId === 'default')

  if (accountSettings.length === 0) {
    const { data } = await supabase
      .from('account_settings')
      .upsert({ profile_id: currentProfileId, opening_balance: 0 }, { onConflict: 'profile_id' })
      .select('*')

    if (data) {
      accountSettings = data as AccountSettings[]
    }
  }

  return {
    data: {
      profiles: profiles.length > 0 ? profiles : [fallbackProfile],
      profileId: currentProfileId,
      accountSettings,
      categories,
      transactions: ((transactionsRes.data as Transaction[]) ?? []).filter((item) => item.profile_id === currentProfileId || currentProfileId === 'default'),
      fixedExpenses: ((fixedExpensesRes.data as FixedExpense[]) ?? []).filter((item) => item.profile_id === currentProfileId || currentProfileId === 'default'),
      fixedExpenseOverrides: ((fixedExpenseOverridesRes.data as FixedExpenseOverride[]) ?? []).filter((item) => item.profile_id === currentProfileId || currentProfileId === 'default'),
      monthlyBudgets: ((monthlyBudgetsRes.data as MonthlyBudget[]) ?? []).filter((item) => item.profile_id === currentProfileId || currentProfileId === 'default'),
    },
    message: '',
  }
}
