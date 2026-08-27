import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

type RepoResult<T> = { data: T | null; error: string | null }

/** Update the opening balance stored on the profile row. */
export async function updateOpeningBalance(profileId: string, openingBalance: number): Promise<RepoResult<Profile>> {
  if (!supabase) return { data: null, error: 'Chưa cấu hình Supabase nên chưa thể lưu.' }
  const { data, error } = await supabase
    .from('profiles')
    .update({ opening_balance: openingBalance })
    .eq('id', profileId)
    .select('*')
    .single()
  if (error) return { data: null, error: error.message }
  return { data: data as Profile, error: null }
}
