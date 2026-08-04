import { supabase } from '../lib/supabase'
import type { AccountSettings, Category, FixedExpense, MonthlyBudget, Profile, Transaction } from '../types'
import { defaultCategories, defaultProfiles } from './defaults'

export type AppData = {
  profiles: Profile[]
  accountSettings: AccountSettings[]
  categories: Category[]
  transactions: Transaction[]
  fixedExpenses: FixedExpense[]
  monthlyBudgets: MonthlyBudget[]
}

const fallbackAccountSettings: AccountSettings[] = defaultProfiles.map((p) => ({
  profile_id: p.id,
  opening_balance: 0,
  updated_at: new Date().toISOString(),
}))

export async function loadAppData(): Promise<{ data: AppData; message: string }> {
  if (!supabase) {
    return {
      data: {
        profiles: defaultProfiles,
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

  const [profilesRes, categoriesRes, transactionsRes, fixedExpensesRes, monthlyBudgetsRes, accountRes] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: true }),
    supabase.from('categories').select('*').order('kind', { ascending: true }).order('name', { ascending: true }),
    supabase.from('transactions').select('*').order('occurred_on', { ascending: false }),
    supabase.from('fixed_expenses').select('*').order('created_at', { ascending: false }),
    supabase.from('monthly_budgets').select('*').order('month_start', { ascending: false }),
    supabase.from('account_settings').select('*').order('profile_id', { ascending: true }),
  ])

  const firstError = profilesRes.error ?? categoriesRes.error ?? transactionsRes.error ?? fixedExpensesRes.error ?? monthlyBudgetsRes.error ?? accountRes.error
  if (firstError) {
    return {
      data: {
        profiles: defaultProfiles,
        accountSettings: fallbackAccountSettings,
        categories: [],
        transactions: [],
        fixedExpenses: [],
        monthlyBudgets: [],
      },
      message: firstError.message,
    }
  }

  // Load profiles
  let profiles = (profilesRes.data as Profile[]) ?? []
  if (profiles.length === 0) {
    const { data, error } = await supabase
      .from('profiles')
      .insert(defaultProfiles.map((p) => ({ id: p.id, name: p.name, color: p.color, accent: p.accent, soft_accent: p.soft_accent })))
      .select('*')
      .order('created_at', { ascending: true })

    if (!error) profiles = (data as Profile[]) ?? []
  }

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

  const validProfileIds = new Set(profiles.map((profile) => profile.id))

  // Xóa dữ liệu "ghost" thuộc profile đã bị xóa hoặc không còn tồn tại trong bảng profiles.
  const staleAccountSettings = ((accountRes.data as AccountSettings[]) ?? []).filter((item) => !validProfileIds.has(item.profile_id))
  const staleTransactions = ((transactionsRes.data as Transaction[]) ?? []).filter((item) => !validProfileIds.has(item.profile_id))
  const staleFixedExpenses = ((fixedExpensesRes.data as FixedExpense[]) ?? []).filter((item) => !validProfileIds.has(item.profile_id))
  const staleMonthlyBudgets = ((monthlyBudgetsRes.data as MonthlyBudget[]) ?? []).filter((item) => !validProfileIds.has(item.profile_id))

  if (staleAccountSettings.length > 0 || staleTransactions.length > 0 || staleFixedExpenses.length > 0 || staleMonthlyBudgets.length > 0) {
    const staleProfileIds = new Set([
      ...staleAccountSettings.map((item) => item.profile_id),
      ...staleTransactions.map((item) => item.profile_id),
      ...staleFixedExpenses.map((item) => item.profile_id),
      ...staleMonthlyBudgets.map((item) => item.profile_id),
    ])

    await Promise.all([
      supabase.from('account_settings').delete().in('profile_id', [...staleProfileIds]),
      supabase.from('transactions').delete().in('profile_id', [...staleProfileIds]),
      supabase.from('fixed_expenses').delete().in('profile_id', [...staleProfileIds]),
      supabase.from('monthly_budgets').delete().in('profile_id', [...staleProfileIds]),
    ])
  }

  // Load account settings - đảm bảo mỗi profile đều có
  let accountSettings = ((accountRes.data as AccountSettings[]) ?? []).filter((item) => validProfileIds.has(item.profile_id))
  const profileIds = profiles.map((p) => p.id)
  const missingProfiles = profileIds.filter((id) => !accountSettings.some((s) => s.profile_id === id))

  if (missingProfiles.length > 0) {
    const { data } = await supabase
      .from('account_settings')
      .upsert(
        missingProfiles.map((profileId) => ({ profile_id: profileId, opening_balance: 0 })),
        { onConflict: 'profile_id' },
      )
      .select('*')

    if (data) {
      accountSettings = [...accountSettings, ...(data as AccountSettings[])]
    }
  }

  return {
    data: {
      profiles,
      accountSettings,
      categories,
      transactions: ((transactionsRes.data as Transaction[]) ?? []).filter((item) => validProfileIds.has(item.profile_id)),
      fixedExpenses: ((fixedExpensesRes.data as FixedExpense[]) ?? []).filter((item) => validProfileIds.has(item.profile_id)),
      monthlyBudgets: ((monthlyBudgetsRes.data as MonthlyBudget[]) ?? []).filter((item) => validProfileIds.has(item.profile_id)),
    },
    message: '',
  }
}
