import { supabase } from '../lib/supabase'
import type { Category, CategoryDraft } from '../types'
import { defaultCategories } from '../data/defaults'

type RepoResult<T> = { data: T | null; error: string | null }

export async function createCategory(draft: CategoryDraft): Promise<RepoResult<Category>> {
  if (!supabase) return { data: null, error: 'Chưa cấu hình Supabase nên chưa thể lưu.' }
  const payload = { ...draft, is_default: false }
  const { data, error } = await supabase.from('categories').insert(payload).select('*').single()
  if (error) return { data: null, error: error.message }
  return { data: data as Category, error: null }
}

export async function updateCategory(id: string, draft: CategoryDraft): Promise<RepoResult<Category>> {
  if (!supabase) return { data: null, error: 'Chưa cấu hình Supabase nên chưa thể lưu.' }
  const payload = { ...draft, is_default: false }
  const { data, error } = await supabase.from('categories').update(payload).eq('id', id).select('*').single()
  if (error) return { data: null, error: error.message }
  return { data: data as Category, error: null }
}

export async function deleteCategory(id: string): Promise<RepoResult<null>> {
  if (!supabase) return { data: null, error: 'Chưa cấu hình Supabase nên chưa thể xóa.' }
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

/** Seed default categories that are missing from the current list. */
export async function seedDefaultCategories(existing: Category[]): Promise<RepoResult<Category[]>> {
  if (!supabase) return { data: null, error: 'Chưa cấu hình Supabase nên chưa thể nạp category mặc định.' }

  const missing = defaultCategories.filter(
    (defaultCategory) => !existing.some((category) => category.kind === defaultCategory.kind && category.name === defaultCategory.name),
  )
  if (missing.length === 0) return { data: [], error: null }

  const { data, error } = await supabase
    .from('categories')
    .insert(missing.map((category) => ({ ...category, is_default: true })))
    .select('*')

  if (error) return { data: null, error: error.message }
  return { data: (data as Category[]) ?? [], error: null }
}
