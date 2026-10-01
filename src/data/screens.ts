import type { Screen } from '../types'

export const screens: Array<{ id: Screen; label: string; icon: string }> = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'calendar', label: 'Calendar', icon: '📅' },
  { id: 'fixed', label: 'Chi cố định', icon: '🔄' },
  { id: 'categories', label: 'Category', icon: '🏷️' },
]
