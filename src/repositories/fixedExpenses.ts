import { supabase } from '../lib/supabase'
import type { FixedExpense, FixedFrequency } from '../types'

export type FixedExpensePayload = {
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
}

type RepoResult<T> = { data: T | null; error: string | null }

export async function createFixedExpense(payload: FixedExpensePayload): Promise<RepoResult<FixedExpense>> {
  if (!supabase) return { data: null, error: 'Chưa cấu hình Supabase nên chưa thể lưu.' }
  const { data, error } = await supabase.from('fixed_expenses').insert(payload).select('*').single()
  if (error) return { data: null, error: error.message }
  return { data: data as FixedExpense, error: null }
}

export async function updateFixedExpense(id: string, payload: FixedExpensePayload): Promise<RepoResult<FixedExpense>> {
  if (!supabase) return { data: null, error: 'Chưa cấu hình Supabase nên chưa thể lưu.' }
  const { data, error } = await supabase.from('fixed_expenses').update(payload).eq('id', id).select('*').single()
  if (error) return { data: null, error: error.message }
  return { data: data as FixedExpense, error: null }
}

export async function deleteFixedExpense(id: string): Promise<RepoResult<null>> {
  if (!supabase) return { data: null, error: 'Chưa cấu hình Supabase nên chưa thể xóa.' }
  const { error } = await supabase.from('fixed_expenses').delete().eq('id', id)
  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}
