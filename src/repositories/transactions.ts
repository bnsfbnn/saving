import { supabase } from '../lib/supabase'
import type { Transaction, TransactionType } from '../types'

export type TransactionPayload = {
  profile_id: string
  type: TransactionType
  category_id: string
  amount: number
  occurred_on: string
  note: string
}

type RepoResult<T> = { data: T | null; error: string | null }

export async function createTransaction(payload: TransactionPayload): Promise<RepoResult<Transaction>> {
  if (!supabase) return { data: null, error: 'Chưa cấu hình Supabase nên chưa thể lưu.' }
  const { data, error } = await supabase.from('transactions').insert(payload).select('*').single()
  if (error) return { data: null, error: error.message }
  return { data: data as Transaction, error: null }
}

export async function updateTransaction(id: string, payload: TransactionPayload): Promise<RepoResult<Transaction>> {
  if (!supabase) return { data: null, error: 'Chưa cấu hình Supabase nên chưa thể lưu.' }
  const { data, error } = await supabase.from('transactions').update(payload).eq('id', id).select('*').single()
  if (error) return { data: null, error: error.message }
  return { data: data as Transaction, error: null }
}

export async function deleteTransaction(id: string): Promise<RepoResult<null>> {
  if (!supabase) return { data: null, error: 'Chưa cấu hình Supabase nên chưa thể xóa.' }
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}
