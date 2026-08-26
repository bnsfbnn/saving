import { supabase } from '../lib/supabase'
import type { AccountSettings } from '../types'

type RepoResult<T> = { data: T | null; error: string | null }

/** Upsert the opening balance for a profile. */
export async function upsertAccountSettings(profileId: string, openingBalance: number): Promise<RepoResult<AccountSettings>> {
  if (!supabase) return { data: null, error: 'Chưa cấu hình Supabase nên chưa thể lưu.' }
  const { data, error } = await supabase
    .from('account_settings')
    .upsert({ profile_id: profileId, opening_balance: openingBalance }, { onConflict: 'profile_id' })
    .select('*')
    .single()
  if (error) return { data: null, error: error.message }
  return { data: data as AccountSettings, error: null }
}
