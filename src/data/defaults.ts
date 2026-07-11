import type { CategoryDraft, CategoryKind, FixedFrequency, Profile } from '../types'

export const profiles: Profile[] = [
  {
    id: 'wife',
    label: 'Vợ',
    shortLabel: 'Hồng',
    themeClass: 'theme-wife',
    accent: '#db2777',
    softAccent: '#fce7f3',
  },
  {
    id: 'husband',
    label: 'Chồng',
    shortLabel: 'Xanh dương',
    themeClass: 'theme-husband',
    accent: '#2563eb',
    softAccent: '#dbeafe',
  },
]

export const categoryKindLabels: Record<CategoryKind, string> = {
  income: 'Thu',
  expense: 'Chi thường',
  fixed_expense: 'Chi cố định',
}

export const fixedFrequencyLabels: Record<FixedFrequency, string> = {
  weekly: 'Hàng tuần',
  monthly: 'Hàng tháng',
}

export const weekDayLabels = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'] as const

export const colorOptions = [
  { name: 'Hồng', hex: '#db2777' },
  { name: 'Xanh dương', hex: '#2563eb' },
  { name: 'Xanh lá', hex: '#16a34a' },
  { name: 'Cam', hex: '#ea580c' },
  { name: 'Tím', hex: '#7c3aed' },
  { name: 'Ngọc', hex: '#0f766e' },
  { name: 'Đỏ', hex: '#dc2626' },
  { name: 'Vàng', hex: '#ca8a04' },
  { name: 'Xám', hex: '#64748b' },
] as const

export const iconOptions = [
  '💰',
  '🏦',
  '💼',
  '🎁',
  '🍜',
  '🛒',
  '🏠',
  '🚗',
  '💡',
  '📱',
  '💊',
  '🎓',
  '☕',
  '✈️',
  '🧾',
  '❤️',
] as const

export const defaultCategories: CategoryDraft[] = [
  { name: 'Lương', kind: 'income', color: '#16a34a', icon: '💼' },
  { name: 'Thưởng', kind: 'income', color: '#ca8a04', icon: '🎁' },
  { name: 'Thu nhập phụ', kind: 'income', color: '#0f766e', icon: '💰' },
  { name: 'Ăn uống', kind: 'expense', color: '#ea580c', icon: '🍜' },
  { name: 'Đi chợ', kind: 'expense', color: '#16a34a', icon: '🛒' },
  { name: 'Di chuyển', kind: 'expense', color: '#2563eb', icon: '🚗' },
  { name: 'Sức khỏe', kind: 'expense', color: '#dc2626', icon: '💊' },
  { name: 'Cà phê', kind: 'expense', color: '#7c3aed', icon: '☕' },
  { name: 'Tiền nhà', kind: 'fixed_expense', color: '#64748b', icon: '🏠' },
  { name: 'Điện nước', kind: 'fixed_expense', color: '#ca8a04', icon: '💡' },
  { name: 'Internet/Điện thoại', kind: 'fixed_expense', color: '#2563eb', icon: '📱' },
  { name: 'Học phí', kind: 'fixed_expense', color: '#7c3aed', icon: '🎓' },
]
