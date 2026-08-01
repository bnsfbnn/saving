import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { supabase } from './lib/supabase'
import type {
  AccountSettings,
  Category,
  CategoryKind,
  FixedExpense,
  FixedFrequency,
  MonthlyBudget,
  Profile,
  Screen,
  Transaction,
  TransactionType,
} from './types'
import {
  categoryKindLabels,
  colorOptions,
  defaultCategories,
  fixedFrequencyLabels,
  iconOptions,
  weekDayLabels,
} from './data/defaults'
import {
  buildCalendarDays,
  buildCategoryBreakdown,
  calculateMonthlySummary,
  currency,
  fixedOccurrencesForMonth,
  monthInputValue,
  monthLabel,
  monthStartISO,
  todayISO,
  transactionsForProfileAndMonth,
  sum,
  formatISODate,
} from './data/finance'
import { loadAppData } from './data/repository'

type TransactionDraft = {
  type: TransactionType
  category_id: string
  amount: string
  occurred_on: string
  note: string
}

type CategoryDraft = {
  name: string
  kind: CategoryKind
  color: string
  icon: string
}

type FixedExpenseDraft = {
  name: string
  category_id: string
  amount: string
  frequency: FixedFrequency
  day_of_month: string
  day_of_week: string
  start_date: string
  is_active: boolean
  note: string
}

const screens: Array<{ id: Screen; label: string; icon: string }> = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'calendar', label: 'Calendar', icon: '📅' },
  { id: 'fixed', label: 'Chi cố định', icon: '🔄' },
  { id: 'categories', label: 'Category', icon: '🏷️' },
]

const fallbackAccountSettings: AccountSettings[] = [
  { profile_id: 'wife', opening_balance: 0, updated_at: new Date().toISOString() },
  { profile_id: 'husband', opening_balance: 0, updated_at: new Date().toISOString() },
]

const authCode = '88269'
const authStorageKey = 'saving-app-authenticated'

const emptyCategoryDraft: CategoryDraft = {
  name: '',
  kind: 'expense',
  color: colorOptions[0].hex,
  icon: iconOptions[0],
}

function createTransactionDraft(date = todayISO()): TransactionDraft {
  return {
    type: 'expense',
    category_id: '',
    amount: '',
    occurred_on: date,
    note: '',
  }
}

function createFixedExpenseDraft(date = todayISO()): FixedExpenseDraft {
  return {
    name: '',
    category_id: '',
    amount: '',
    frequency: 'monthly',
    day_of_month: '1',
    day_of_week: '1',
    start_date: date,
    is_active: true,
    note: '',
  }
}

function parseAmount(value: string) {
  return Number(value.replace(/,/g, '').trim())
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.sessionStorage.getItem(authStorageKey) === 'true'
  })
  const [authInput, setAuthInput] = useState('')
  const [authError, setAuthError] = useState('')
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [activeOwner, setActiveOwner] = useState('wife')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selectedMonth, setSelectedMonth] = useState(monthStartISO())
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const [accountSettings, setAccountSettings] = useState<AccountSettings[]>(fallbackAccountSettings)
  const [openingBalanceInput, setOpeningBalanceInput] = useState('0')
  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([])
  const [monthlyBudgets, setMonthlyBudgets] = useState<MonthlyBudget[]>([])

  const [transactionDraft, setTransactionDraft] = useState<TransactionDraft>(() => createTransactionDraft())
  const [editingTransactionId, setEditingTransactionId] = useState('')
  const [categoryDraft, setCategoryDraft] = useState<CategoryDraft>(emptyCategoryDraft)
  const [editingCategoryId, setEditingCategoryId] = useState('')
  const [fixedDraft, setFixedDraft] = useState<FixedExpenseDraft>(() => createFixedExpenseDraft())
  const [editingFixedExpenseId, setEditingFixedExpenseId] = useState('')
  const [showProfileForm, setShowProfileForm] = useState(false)
  const [profileFormName, setProfileFormName] = useState('')
  const [profileFormColor, setProfileFormColor] = useState<string>(colorOptions[0].hex)
  const [editingProfileId, setEditingProfileId] = useState('')

  const activeProfile = profiles.find((profile) => profile.id === activeOwner) ?? profiles[0]

  const categoryLookup = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories])
  const incomeCategories = useMemo(() => categories.filter((category) => category.kind === 'income'), [categories])
  const expenseCategories = useMemo(() => categories.filter((category) => category.kind === 'expense'), [categories])
  const fixedCategories = useMemo(() => categories.filter((category) => category.kind === 'fixed_expense'), [categories])
  const transactionCategoryOptions = transactionDraft.type === 'income' ? incomeCategories : expenseCategories

  const activeMonthlyBudget = useMemo(
    () => monthlyBudgets.find((budget) => budget.profile_id === activeOwner && budget.month_start === selectedMonth),
    [activeOwner, monthlyBudgets, selectedMonth],
  )

  const activeAccountSettings = useMemo(
    () => accountSettings.find((s) => s.profile_id === activeOwner),
    [accountSettings, activeOwner],
  )

  // Chỉ hiện input nếu CHƯA có tài khoản (chưa lưu opening_balance lần nào)
  const hasAccountSettings = activeAccountSettings != null

  // Tài khoản chính = Số tiền hiện có thực sự
  // = Opening balance + Tổng thu − Tổng chi − Tổng chi cố định
  // Opening balance là số tiền tiết kiệm ban đầu (tháng đầu tiên)
  // Chi cố định được trừ từ tháng đầu tiên có budget/transaction đến tháng hiện tại
  const mainBalance = useMemo(() => {
    const opening = activeAccountSettings?.opening_balance ?? 0
    const ownerTransactions = transactions.filter((t) => t.profile_id === activeOwner)
    const totalIncome = sum(ownerTransactions.filter((t) => t.type === 'income').map((t) => t.amount))
    const totalExpense = sum(ownerTransactions.filter((t) => t.type === 'expense').map((t) => t.amount))

    // Tìm tháng đầu tiên (từ budget hoặc transaction)
    const ownerBudgets = monthlyBudgets.filter((b) => b.profile_id === activeOwner)
    const firstBudgetMonth = ownerBudgets.length > 0
      ? ownerBudgets.reduce((min, b) => b.month_start.slice(0, 7) < min ? b.month_start.slice(0, 7) : min, '9999-12')
      : null
    const firstTxMonth = ownerTransactions.length > 0
      ? ownerTransactions.reduce((min, t) => t.occurred_on.slice(0, 7) < min ? t.occurred_on.slice(0, 7) : min, '9999-12')
      : null
    const currentMonth = selectedMonth.slice(0, 7)

    // Tháng đầu tiên = nhỏ nhất trong budget, transaction, và tháng hiện tại
    const candidates = [firstBudgetMonth, firstTxMonth, currentMonth].filter(Boolean) as string[]
    const firstMonth = candidates.reduce((min, c) => c < min ? c : min, '9999-12')

    // Scan từ tháng đầu tiên đến tháng hiện tại
    const allMonths: string[] = []
    let [y, m] = firstMonth.split('-').map(Number)
    while (`${y}-${String(m).padStart(2, '0')}` <= currentMonth) {
      allMonths.push(`${y}-${String(m).padStart(2, '0')}`)
      m++
      if (m > 12) { m = 1; y++ }
    }

    const totalFixed = allMonths.reduce((acc, month) => {
      const occurrences = fixedOccurrencesForMonth(fixedExpenses, activeOwner, `${month}-01`)
      return acc + sum(occurrences.map((o) => o.amount))
    }, 0)

    return opening + totalIncome - totalExpense - totalFixed
  }, [activeAccountSettings, transactions, activeOwner, fixedExpenses, selectedMonth, monthlyBudgets])

  const monthlySummary = useMemo(
    () => calculateMonthlySummary(transactions, fixedExpenses, activeMonthlyBudget, activeOwner, selectedMonth),
    [activeMonthlyBudget, activeOwner, fixedExpenses, selectedMonth, transactions],
  )

  const monthTransactions = useMemo(
    () => transactionsForProfileAndMonth(transactions, activeOwner, selectedMonth),
    [activeOwner, selectedMonth, transactions],
  )

  const monthFixedOccurrences = useMemo(
    () => fixedOccurrencesForMonth(fixedExpenses, activeOwner, selectedMonth),
    [activeOwner, fixedExpenses, selectedMonth],
  )

  const categoryBreakdown = useMemo(
    () => buildCategoryBreakdown(categories, transactions, fixedExpenses, activeOwner, selectedMonth),
    [activeOwner, categories, fixedExpenses, selectedMonth, transactions],
  )

  const calendarDays = useMemo(() => buildCalendarDays(selectedMonth), [selectedMonth])
  const recentOwnerTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.profile_id === activeOwner).slice(0, 8),
    [activeOwner, transactions],
  )

  useEffect(() => {
    if (!isAuthenticated) return
    void refreshData()
  }, [isAuthenticated])

  useEffect(() => {
    setOpeningBalanceInput(String(activeAccountSettings?.opening_balance ?? 0))
  }, [activeAccountSettings?.opening_balance])

  // Tự động lưu còn lại tháng trước sang tháng hiện tại
  useEffect(() => {
    if (loading || !activeAccountSettings || !supabase) return
    if (activeMonthlyBudget) return // Đã có budget cho tháng này

    // Tính remaining của tháng trước = đầu tháng trước + thu - chi - chi cố định
    const [year, month] = selectedMonth.split('-').map(Number)
    const prevMonthDate = new Date(year, month - 2, 1)
    const prevMonthStart = formatISODate(prevMonthDate)

    const prevBudget = monthlyBudgets.find((b) => b.profile_id === activeOwner && b.month_start === prevMonthStart)
    const prevStartingAmount = prevBudget?.starting_amount ?? (activeAccountSettings.opening_balance ?? 0)

    const prevMonthTxs = transactionsForProfileAndMonth(transactions, activeOwner, prevMonthStart)
    const prevMonthFixed = fixedOccurrencesForMonth(fixedExpenses, activeOwner, prevMonthStart)
    const prevIncome = sum(prevMonthTxs.filter((t) => t.type === 'income').map((t) => t.amount))
    const prevExpense = sum(prevMonthTxs.filter((t) => t.type === 'expense').map((t) => t.amount))
    const prevFixed = sum(prevMonthFixed.map((o) => o.amount))
    const prevRemaining = prevStartingAmount + prevIncome - prevExpense - prevFixed

    void (async () => {
      const { data, error } = await supabase
        .from('monthly_budgets')
        .upsert({
          profile_id: activeOwner,
          month_start: selectedMonth,
          starting_amount: prevRemaining,
          note: 'Tự động từ tháng trước',
        }, { onConflict: 'profile_id,month_start' })
        .select('*')
        .single()

      if (!error && data) {
        const saved = data as MonthlyBudget
        setMonthlyBudgets((current) => {
          const exists = current.some((b) => b.id === saved.id)
          if (exists) return current.map((b) => (b.id === saved.id ? saved : b))
          return [saved, ...current]
        })
      }
    })()
  }, [selectedMonth, activeOwner, activeMonthlyBudget, loading, activeAccountSettings, transactions, fixedExpenses, monthlyBudgets])

  useEffect(() => {
    if (transactionCategoryOptions.length === 0) return
    const selectedCategory = categoryLookup.get(transactionDraft.category_id)
    const expectedKind: CategoryKind = transactionDraft.type === 'income' ? 'income' : 'expense'
    if (!selectedCategory || selectedCategory.kind !== expectedKind) {
      setTransactionDraft((current) => ({ ...current, category_id: transactionCategoryOptions[0].id }))
    }
  }, [categoryLookup, transactionCategoryOptions, transactionDraft.category_id, transactionDraft.type])

  useEffect(() => {
    if (fixedCategories.length > 0 && !fixedCategories.some((category) => category.id === fixedDraft.category_id)) {
      setFixedDraft((current) => ({ ...current, category_id: fixedCategories[0].id }))
    }
  }, [fixedCategories, fixedDraft.category_id])

  async function refreshData() {
    setLoading(true)
    const result = await loadAppData()
    setProfiles(result.data.profiles)
    setAccountSettings(result.data.accountSettings)
    setCategories(result.data.categories)
    setTransactions(result.data.transactions)
    setFixedExpenses(result.data.fixedExpenses)
    setMonthlyBudgets(result.data.monthlyBudgets)
    setMessage(result.message)
    setLoading(false)
  }

  function unlockApp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (authInput.trim() !== authCode) {
      setAuthError('Mã authen không đúng.')
      setAuthInput('')
      return
    }

    window.sessionStorage.setItem(authStorageKey, 'true')
    setAuthError('')
    setIsAuthenticated(true)
  }

  function resetTransactionForm(date = todayISO()) {
    setTransactionDraft(createTransactionDraft(date))
    setEditingTransactionId('')
  }

  function prepareExpenseForDate(date: string) {
    setTransactionDraft({
      type: 'expense',
      category_id: expenseCategories[0]?.id ?? '',
      amount: '',
      occurred_on: date,
      note: '',
    })
    setEditingTransactionId('')
  }

  function resetCategoryForm() {
    setCategoryDraft(emptyCategoryDraft)
    setEditingCategoryId('')
  }

  function resetFixedExpenseForm() {
    setFixedDraft(createFixedExpenseDraft())
    setEditingFixedExpenseId('')
  }

  function startEditTransaction(transaction: Transaction) {
    setTransactionDraft({
      type: transaction.type,
      category_id: transaction.category_id,
      amount: String(transaction.amount),
      occurred_on: transaction.occurred_on,
      note: transaction.note,
    })
    setEditingTransactionId(transaction.id)
    setActiveOwner(transaction.profile_id)
    setScreen('calendar')
  }

  function startEditCategory(category: Category) {
    setCategoryDraft({
      name: category.name,
      kind: category.kind,
      color: category.color,
      icon: category.icon,
    })
    setEditingCategoryId(category.id)
  }

  function startEditFixedExpense(fixedExpense: FixedExpense) {
    setFixedDraft({
      name: fixedExpense.name,
      category_id: fixedExpense.category_id,
      amount: String(fixedExpense.amount),
      frequency: fixedExpense.frequency,
      day_of_month: String(fixedExpense.day_of_month ?? 1),
      day_of_week: String(fixedExpense.day_of_week ?? 1),
      start_date: fixedExpense.start_date,
      is_active: fixedExpense.is_active,
      note: fixedExpense.note,
    })
    setEditingFixedExpenseId(fixedExpense.id)
    setActiveOwner(fixedExpense.profile_id)
  }

  async function saveAccountSettings() {
    const openingBalance = parseAmount(openingBalanceInput)
    if (!Number.isFinite(openingBalance)) return setMessage('Số dư khởi tạo không hợp lệ.')
    if (!supabase) return setMessage('Chưa cấu hình Supabase nên chưa thể lưu.')

    const { data, error } = await supabase
      .from('account_settings')
      .upsert({ profile_id: activeOwner, opening_balance: openingBalance }, { onConflict: 'profile_id' })
      .select('*')
      .single()

    if (error) return setMessage(error.message)
    const saved = data as AccountSettings
    setAccountSettings((current) => {
      const exists = current.some((s) => s.profile_id === activeOwner)
      if (exists) return current.map((s) => (s.profile_id === activeOwner ? saved : s))
      return [...current, saved]
    })
    setMessage('Đã cập nhật tài khoản chính.')
  }

  async function saveTransaction(typeOverride?: TransactionType) {
    const transactionType = typeOverride ?? transactionDraft.type
    const amount = parseAmount(transactionDraft.amount)
    const allowedCategories = transactionType === 'income' ? incomeCategories : expenseCategories
    const selectedCategory = categoryLookup.get(transactionDraft.category_id)
    const expectedKind: CategoryKind = transactionType === 'income' ? 'income' : 'expense'
    const categoryId = selectedCategory?.kind === expectedKind ? transactionDraft.category_id : allowedCategories[0]?.id

    if (!categoryId) return setMessage('Chưa có category phù hợp để lưu giao dịch.')
    if (!Number.isFinite(amount) || amount <= 0) return setMessage('Số tiền phải lớn hơn 0.')
    if (!supabase) return setMessage('Chưa cấu hình Supabase nên chưa thể lưu.')

    const payload = {
      profile_id: activeOwner,
      type: transactionType,
      category_id: categoryId,
      amount,
      occurred_on: transactionDraft.occurred_on,
      note: transactionDraft.note.trim(),
    }

    if (editingTransactionId) {
      const { data, error } = await supabase
        .from('transactions')
        .update(payload)
        .eq('id', editingTransactionId)
        .select('*')
        .single()

      if (error) return setMessage(error.message)
      setTransactions((current) => current.map((item) => (item.id === editingTransactionId ? (data as Transaction) : item)))
      resetTransactionForm(transactionDraft.occurred_on)
      return setMessage('Đã cập nhật giao dịch.')
    }

    const { data, error } = await supabase.from('transactions').insert(payload).select('*').single()
    if (error) return setMessage(error.message)
    setTransactions((current) => [data as Transaction, ...current])
    resetTransactionForm(transactionDraft.occurred_on)
    setMessage(transactionType === 'income' ? 'Đã lưu khoản thu.' : 'Đã lưu khoản chi.')
  }

  async function removeTransaction(id: string) {
    if (!supabase) return setMessage('Chưa cấu hình Supabase nên chưa thể xóa.')
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) return setMessage(error.message)
    setTransactions((current) => current.filter((item) => item.id !== id))
    if (editingTransactionId === id) resetTransactionForm()
    setMessage('Đã xóa giao dịch.')
  }

  async function saveCategory() {
    const name = categoryDraft.name.trim()
    if (!name) return setMessage('Tên category không được để trống.')
    if (!supabase) return setMessage('Chưa cấu hình Supabase nên chưa thể lưu.')

    const payload = { ...categoryDraft, name, is_default: false }

    if (editingCategoryId) {
      const { data, error } = await supabase
        .from('categories')
        .update(payload)
        .eq('id', editingCategoryId)
        .select('*')
        .single()

      if (error) return setMessage(error.message)
      setCategories((current) => current.map((item) => (item.id === editingCategoryId ? (data as Category) : item)))
      resetCategoryForm()
      return setMessage('Đã cập nhật category.')
    }

    const { data, error } = await supabase.from('categories').insert(payload).select('*').single()
    if (error) return setMessage(error.message)
    setCategories((current) => [...current, data as Category].sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name)))
    resetCategoryForm()
    setMessage('Đã tạo category.')
  }

  async function seedDefaultCategories() {
    if (!supabase) return setMessage('Chưa cấu hình Supabase nên chưa thể nạp category mặc định.')
    const missing = defaultCategories.filter(
      (defaultCategory) => !categories.some((category) => category.kind === defaultCategory.kind && category.name === defaultCategory.name),
    )
    if (missing.length === 0) return setMessage('Category mặc định đã có đủ.')

    const { data, error } = await supabase
      .from('categories')
      .insert(missing.map((category) => ({ ...category, is_default: true })))
      .select('*')

    if (error) return setMessage(error.message)
    setCategories((current) => [...current, ...((data as Category[]) ?? [])].sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name)))
    setMessage('Đã nạp category mặc định.')
  }

  async function removeCategory(id: string) {
    if (!supabase) return setMessage('Chưa cấu hình Supabase nên chưa thể xóa.')
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) return setMessage(error.message)
    setCategories((current) => current.filter((item) => item.id !== id))
    if (editingCategoryId === id) resetCategoryForm()
    setMessage('Đã xóa category.')
  }

  async function saveFixedExpense() {
    const amount = parseAmount(fixedDraft.amount)
    const dayOfMonth = Number(fixedDraft.day_of_month)
    const dayOfWeek = Number(fixedDraft.day_of_week)
    if (!fixedDraft.name.trim()) return setMessage('Tên khoản chi cố định không được để trống.')
    if (!fixedDraft.category_id) return setMessage('Chưa chọn category chi cố định.')
    if (!Number.isFinite(amount) || amount <= 0) return setMessage('Số tiền phải lớn hơn 0.')
    if (fixedDraft.frequency === 'monthly' && (dayOfMonth < 1 || dayOfMonth > 31)) return setMessage('Ngày hàng tháng phải từ 1 đến 31.')
    if (fixedDraft.frequency === 'weekly' && (dayOfWeek < 0 || dayOfWeek > 6)) return setMessage('Thứ hàng tuần không hợp lệ.')
    if (!supabase) return setMessage('Chưa cấu hình Supabase nên chưa thể lưu.')

    const payload = {
      profile_id: activeOwner,
      category_id: fixedDraft.category_id,
      name: fixedDraft.name.trim(),
      amount,
      frequency: fixedDraft.frequency,
      day_of_month: fixedDraft.frequency === 'monthly' ? dayOfMonth : null,
      day_of_week: fixedDraft.frequency === 'weekly' ? dayOfWeek : null,
      start_date: fixedDraft.start_date,
      is_active: fixedDraft.is_active,
      note: fixedDraft.note.trim(),
    }

    if (editingFixedExpenseId) {
      const { data, error } = await supabase
        .from('fixed_expenses')
        .update(payload)
        .eq('id', editingFixedExpenseId)
        .select('*')
        .single()

      if (error) return setMessage(error.message)
      setFixedExpenses((current) => current.map((item) => (item.id === editingFixedExpenseId ? (data as FixedExpense) : item)))
      resetFixedExpenseForm()
      return setMessage('Đã cập nhật khoản chi cố định.')
    }

    const { data, error } = await supabase.from('fixed_expenses').insert(payload).select('*').single()
    if (error) return setMessage(error.message)
    setFixedExpenses((current) => [data as FixedExpense, ...current])
    resetFixedExpenseForm()
    setMessage('Đã tạo khoản chi cố định.')
  }

  async function removeFixedExpense(id: string) {
    if (!supabase) return setMessage('Chưa cấu hình Supabase nên chưa thể xóa.')
    const { error } = await supabase.from('fixed_expenses').delete().eq('id', id)
    if (error) return setMessage(error.message)
    setFixedExpenses((current) => current.filter((item) => item.id !== id))
    if (editingFixedExpenseId === id) resetFixedExpenseForm()
    setMessage('Đã xóa khoản chi cố định.')
  }

  async function saveProfile() {
    const name = profileFormName.trim()
    if (!name) return setMessage('Tên profile không được để trống.')
    if (!supabase) return setMessage('Chưa cấu hình Supabase nên chưa thể lưu.')

    const profileId = editingProfileId || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now()

    if (editingProfileId) {
      const { data, error } = await supabase
        .from('profiles')
        .update({ name, color: profileFormColor, accent: profileFormColor })
        .eq('id', editingProfileId)
        .select('*')
        .single()

      if (error) return setMessage(error.message)
      setProfiles((current) => current.map((p) => (p.id === editingProfileId ? (data as Profile) : p)))
      setShowProfileForm(false)
      setProfileFormName('')
      setProfileFormColor(colorOptions[0].hex)
      setEditingProfileId('')
      return setMessage('Đã cập nhật profile.')
    }

    const softAccent = profileFormColor + '20'
    const { data, error } = await supabase
      .from('profiles')
      .insert({ id: profileId, name, color: profileFormColor, accent: profileFormColor, soft_accent: softAccent })
      .select('*')
      .single()

    if (error) return setMessage(error.message)
    const saved = data as Profile
    setProfiles((current) => [...current, saved])

    // Tạo account_settings cho profile mới
    await supabase.from('account_settings').upsert({ profile_id: profileId, opening_balance: 0 }, { onConflict: 'profile_id' })

    setActiveOwner(profileId)
    setShowProfileForm(false)
    setProfileFormName('')
    setProfileFormColor(colorOptions[0].hex)
    setMessage(`Đã tạo profile "${name}".`)
  }

  async function removeProfile(id: string) {
    if (!supabase) return setMessage('Chưa cấu hình Supabase nên chưa thể xóa.')
    if (profiles.length <= 1) return setMessage('Phải còn ít nhất 1 profile.')

    const { error } = await supabase.from('profiles').delete().eq('id', id)
    if (error) return setMessage(error.message)
    setProfiles((current) => current.filter((p) => p.id !== id))
    if (activeOwner === id) {
      const remaining = profiles.filter((p) => p.id !== id)
      if (remaining.length > 0) setActiveOwner(remaining[0].id)
    }
    setMessage('Đã xóa profile.')
  }

  function renderMonthPicker() {
    return (
      <div className="month-picker">
        <label>
          Tháng
          <input
            type="month"
            value={monthInputValue(selectedMonth)}
            onChange={(event) => setSelectedMonth(`${event.target.value}-01`)}
          />
        </label>
        <strong>{monthLabel(selectedMonth)}</strong>
      </div>
    )
  }

  function renderTransactionForm(title: string, lockedType?: TransactionType) {
    const type = lockedType ?? transactionDraft.type
    const options = type === 'income' ? incomeCategories : expenseCategories

    return (
      <section className="panel form-panel">
        <div className="section-head">
          <h2>{editingTransactionId ? `Sửa ${title.toLowerCase()}` : title}</h2>
          {editingTransactionId ? (
            <button className="ghost-button" onClick={() => resetTransactionForm(transactionDraft.occurred_on)} type="button">
              Hủy sửa
            </button>
          ) : null}
        </div>
        <div className="form-grid two-cols">
          {!lockedType ? (
            <label>
              Loại giao dịch
              <select
                value={transactionDraft.type}
                onChange={(event) => setTransactionDraft((current) => ({ ...current, type: event.target.value as TransactionType, category_id: '' }))}
              >
                <option value="income">Thu</option>
                <option value="expense">Chi</option>
              </select>
            </label>
          ) : null}
          <label>
            Category
            <select value={transactionDraft.category_id} onChange={(event) => setTransactionDraft((current) => ({ ...current, category_id: event.target.value }))}>
              <option value="">Chọn category</option>
              {options.map((category) => <option key={category.id} value={category.id}>{category.icon} {category.name}</option>)}
            </select>
          </label>
          <label>
            Số tiền
            <input inputMode="decimal" value={transactionDraft.amount} onChange={(event) => setTransactionDraft((current) => ({ ...current, amount: event.target.value }))} placeholder="Ví dụ: 250000" />
          </label>
          <label>
            Ngày
            <input type="date" value={transactionDraft.occurred_on} onChange={(event) => setTransactionDraft((current) => ({ ...current, occurred_on: event.target.value }))} />
          </label>
          <label className="wide-field">
            Ghi chú
            <input value={transactionDraft.note} onChange={(event) => setTransactionDraft((current) => ({ ...current, note: event.target.value }))} placeholder="Nội dung giao dịch" />
          </label>
        </div>
        <div className="form-actions">
          <button onClick={() => void saveTransaction(lockedType)} type="button">{editingTransactionId ? 'Cập nhật' : 'Lưu giao dịch'}</button>
        </div>
      </section>
    )
  }

  function renderTransactionList(items: Transaction[]) {
    return (
      <div className="list">
        {items.length === 0 ? <p className="empty-state">Chưa có giao dịch.</p> : null}
        {items.map((transaction) => {
          const category = categoryLookup.get(transaction.category_id)
          return (
            <article className="list-row" key={transaction.id}>
              <div className="row-main">
                <span className="category-chip" style={{ backgroundColor: category?.color ?? '#e2e8f0' }}>{category?.icon ?? '•'}</span>
                <div>
                  <strong>{category?.name ?? 'Không rõ category'}</strong>
                  <p>{transaction.occurred_on}{transaction.note ? ` · ${transaction.note}` : ''}</p>
                </div>
              </div>
              <div className="row-actions">
                <strong className={transaction.type === 'income' ? 'money-positive' : 'money-negative'}>{transaction.type === 'income' ? '+' : '-'}{currency(transaction.amount)}</strong>
                <button className="ghost-button" onClick={() => startEditTransaction(transaction)} type="button">Sửa</button>
                <button className="danger-button" onClick={() => void removeTransaction(transaction.id)} type="button">Xóa</button>
              </div>
            </article>
          )
        })}
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <main className="auth-shell">
        <form className="auth-card" onSubmit={unlockApp}>
          <div className="auth-brand">
            <span>Saving</span>
            <h1>Nhập mã truy cập</h1>
          </div>
          <label>
            Mã authen
            <input
              autoComplete="one-time-code"
              autoFocus
              inputMode="numeric"
              maxLength={5}
              type="password"
              value={authInput}
              onChange={(event) => setAuthInput(event.target.value)}
            />
          </label>
          {authError ? <p className="auth-error" role="alert">{authError}</p> : null}
          <button type="submit">Vào app</button>
        </form>
      </main>
    )
  }

  return (
    <div className="app-shell" style={{ '--accent': activeProfile.accent, '--accent-soft': activeProfile.soft_accent } as React.CSSProperties}>
      {/* Mobile top bar */}
      <header className="mobile-topbar">
        <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)} type="button">
          {sidebarOpen ? '✕' : '☰'}
        </button>
        <div className="mobile-topbar-info">
          <strong>{activeProfile.name}</strong>
          <span>{screens.find((item) => item.id === screen)?.label}</span>
        </div>
        <div className="mobile-topbar-right">
          <span className="mobile-month">{monthLabel(selectedMonth)}</span>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen ? <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} /> : null}

      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-block">
          <span>Saving</span>
          <strong>Quản lý thu chi</strong>
        </div>

        <div className="profile-switcher" aria-label="Chọn profile">
          <div className="profile-dropdown-row">
            <select
              className="profile-dropdown"
              value={activeOwner}
              onChange={(event) => { setActiveOwner(event.target.value); setSidebarOpen(false); }}
            >
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>{profile.name}</option>
              ))}
            </select>
            <button className="ghost-button small" onClick={() => { setShowProfileForm(true); setEditingProfileId(''); setProfileFormName(''); setProfileFormColor(colorOptions[0].hex); }} type="button" title="Thêm profile">+</button>
          </div>
          {profiles.map((profile) => (
            <div className={`profile-row ${profile.id === activeOwner ? 'active' : ''}`} key={profile.id}>
              <span className="profile-dot" style={{ backgroundColor: profile.color }} />
              <span className="profile-name" onClick={() => { setActiveOwner(profile.id); setSidebarOpen(false); }}>{profile.name}</span>
              <button className="ghost-button tiny" onClick={() => { setEditingProfileId(profile.id); setProfileFormName(profile.name); setProfileFormColor(profile.color); setShowProfileForm(true); }} type="button">✏️</button>
              {profiles.length > 1 ? <button className="danger-button tiny" onClick={() => void removeProfile(profile.id)} type="button">🗑️</button> : null}
            </div>
          ))}
        </div>

        <nav className="nav-list">
          {screens.map((item) => (
            <button className={screen === item.id ? 'nav-button active' : 'nav-button'} key={item.id} onClick={() => { setScreen(item.id); setSidebarOpen(false); }} type="button">
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Bottom nav for mobile */}
      <nav className="bottom-nav">
        {screens.map((item) => (
          <button className={screen === item.id ? 'bottom-nav-btn active' : 'bottom-nav-btn'} key={item.id} onClick={() => setScreen(item.id)} type="button">
            <span className="bottom-nav-icon">{item.icon}</span>
            <span className="bottom-nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <main className="content">
        <header className="topbar">
          <div>
            <p>{activeProfile.name}</p>
            <h1>{screens.find((item) => item.id === screen)?.label}</h1>
          </div>
          {renderMonthPicker()}
        </header>

        {message ? <div className="notice">{message}</div> : null}
        {loading ? <div className="notice">Đang tải dữ liệu...</div> : null}

        {screen === 'dashboard' ? (
          <>
            {/* Account initialization prompt - chỉ hiện khi CHƯA có tài khoản */}
            {!hasAccountSettings && !loading ? (
              <section className="panel account-init-panel">
                <div className="account-init-content">
                  <span className="account-init-icon">🏦</span>
                  <h2>Bắt đầu tiết kiệm</h2>
                  <p>Nhập số dư ban đầu (số tiền hiện có) để bắt đầu theo dõi tài chính.</p>
                  <div className="form-grid inline-form">
                    <label>
                      Số dư ban đầu (VND)
                      <input inputMode="decimal" value={openingBalanceInput} onChange={(event) => setOpeningBalanceInput(event.target.value)} placeholder="Ví dụ: 5000000" />
                    </label>
                    <button onClick={() => void saveAccountSettings()} type="button">Bắt đầu</button>
                  </div>
                </div>
              </section>
            ) : null}

            {/* Account Hero Card - hiện khi ĐÃ CÓ tài khoản */}
            {hasAccountSettings ? (
              <section className="account-hero-card">
                <div className="account-hero-top">
                  <span className="account-hero-label">💰 {activeProfile.name} — Tài khoản chính</span>
                  <span className="account-hero-hint">Số tiền hiện có</span>
                </div>
                <div className="account-hero-balance">
                  <span className={mainBalance >= 0 ? 'money-positive' : 'money-negative'}>{currency(mainBalance)}</span>
                </div>
                <div className="account-hero-sub">
                  <span>Ban đầu: <strong>{currency(activeAccountSettings!.opening_balance)}</strong></span>
                  <span>Thu: <strong className="money-positive">+{currency(sum(transactions.filter((t) => t.profile_id === activeOwner && t.type === 'income').map((t) => t.amount)))}</strong></span>
                  <span>Chi: <strong className="money-negative">−{currency(sum(transactions.filter((t) => t.profile_id === activeOwner && t.type === 'expense').map((t) => t.amount)))}</strong></span>
                </div>
              </section>
            ) : null}

            {/* Metrics: Thu / Chi / Còn lại theo tháng */}
            <section className="metrics-grid">
              <article className="metric-card income">
                <span>Thu trong tháng</span>
                <strong className="money-positive">{currency(monthlySummary.income)}</strong>
              </article>
              <article className="metric-card expense">
                <span>Chi trong tháng</span>
                <strong className="money-negative">{currency(monthlySummary.totalExpense)}</strong>
              </article>
              <article className="metric-card remaining">
                <span>Còn lại tháng</span>
                <strong className={monthlySummary.remaining >= 0 ? 'money-positive' : 'money-negative'}>{currency(monthlySummary.remaining)}</strong>
              </article>
            </section>

            {/* Breakdown chi + Chi cố định */}
            <section className="dashboard-grid">
              <div className="panel">
                <div className="section-head">
                  <h2>📊 Tỷ trọng chi theo category</h2>
                  <span>{monthLabel(selectedMonth)}</span>
                </div>
                <div className="breakdown-list">
                  {categoryBreakdown.length === 0 ? <p className="empty-state">Chưa có khoản chi trong tháng.</p> : null}
                  {categoryBreakdown.map((item) => (
                    <div className="breakdown-row" key={item.category.id}>
                      <div className="breakdown-title">
                        <span className="category-chip" style={{ backgroundColor: item.category.color }}>{item.category.icon}</span>
                        <strong>{item.category.name}</strong>
                        <em>{item.percent}%</em>
                      </div>
                      <div className="bar-track"><span style={{ width: `${item.percent}%`, backgroundColor: item.category.color }} /></div>
                      <p>{currency(item.total)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel">
                <div className="section-head">
                  <h2>🔄 Chi cố định tháng</h2>
                  <strong>{currency(monthlySummary.fixedExpense)}</strong>
                </div>
                <div className="compact-list">
                  {monthFixedOccurrences.length === 0 ? <p className="empty-state">Chưa có lịch chi cố định.</p> : null}
                  {monthFixedOccurrences.slice(0, 8).map((occurrence) => {
                    const category = categoryLookup.get(occurrence.category_id)
                    return (
                      <div className="compact-row" key={`${occurrence.fixedExpense.id}-${occurrence.date}`}>
                        <span>{occurrence.date}</span>
                        <strong>{category?.name ?? occurrence.fixedExpense.name}</strong>
                        <em>{currency(occurrence.amount)}</em>
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>

            {/* Monthly Summary - tự động lưu carry-forward */}
            <section className="panel">
              <div className="section-head">
                <h2>📋 Tổng hợp {monthLabel(selectedMonth)}</h2>
                <span className="carry-forward-hint">Tự động từ tháng trước</span>
              </div>
              <div className="summary-lines">
                <div><span>Đầu tháng (còn lại tháng trước)</span><strong>{currency(monthlySummary.startingAmount)}</strong></div>
                <div><span>Thu</span><strong className="money-positive">+{currency(monthlySummary.income)}</strong></div>
                <div><span>Chi thường</span><strong className="money-negative">-{currency(monthlySummary.variableExpense)}</strong></div>
                <div><span>Chi cố định</span><strong className="money-negative">-{currency(monthlySummary.fixedExpense)}</strong></div>
                <div className="summary-total"><span>Còn lại</span><strong>{currency(monthlySummary.remaining)}</strong></div>
              </div>
            </section>

            {/* Budget history */}
            {monthlyBudgets.filter((b) => b.profile_id === activeOwner).length > 0 ? (
              <section className="panel wide-panel">
                <h2>📅 Các tháng đã lưu</h2>
                <div className="table-wrap"><table><thead><tr><th>Tháng</th><th>Số tiền đầu tháng</th><th>Ghi chú</th></tr></thead><tbody>
                  {monthlyBudgets.filter((budget) => budget.profile_id === activeOwner).map((budget) => (
                    <tr key={budget.id}><td>{monthLabel(budget.month_start)}</td><td>{currency(budget.starting_amount)}</td><td>{budget.note}</td></tr>
                  ))}
                </tbody></table></div>
              </section>
            ) : null}

            {/* Recent transactions */}
            <section className="panel">
              <div className="section-head">
                <h2>Giao dịch gần đây</h2>
                <button className="ghost-button" onClick={() => setScreen('calendar')} type="button">Thêm thu/chi</button>
              </div>
              {renderTransactionList(recentOwnerTransactions)}
            </section>
          </>
        ) : null}

        {screen === 'calendar' ? (
          <section className="calendar-layout">
            <div className="panel calendar-panel">
              <div className="calendar-weekdays">
                {weekDayLabels.map((label) => <span key={label}>{label.slice(0, 3)}</span>)}
              </div>
              <div className="calendar-grid">
                {calendarDays.map((day) => {
                  const dayTransactions = monthTransactions.filter((t) => t.occurred_on === day.iso)
                  return (
                    <button className={day.inMonth ? 'calendar-day' : 'calendar-day outside'} key={day.iso} onClick={() => prepareExpenseForDate(day.iso)} type="button">
                      <strong>{day.dayNumber}</strong>
                      <div className="day-items">
                        {dayTransactions.slice(0, 3).map((transaction) => {
                          const category = categoryLookup.get(transaction.category_id)
                          return (
                            <span key={transaction.id} className={transaction.type === 'income' ? 'day-item-income' : 'day-item-expense'}>
                              {category?.name ?? (transaction.type === 'income' ? 'Thu' : 'Chi')} · {currency(transaction.amount)}
                            </span>
                          )
                        })}
                        {dayTransactions.length > 3 ? <em>+{dayTransactions.length - 3}</em> : null}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="side-stack">
              {renderTransactionForm('Ghi thu / chi')}
              <section className="panel">
                <div className="section-head">
                  <h2>Giao dịch trong tháng</h2>
                  <span>{monthTransactions.length} giao dịch</span>
                </div>
                {renderTransactionList(monthTransactions)}
              </section>
            </div>
          </section>
        ) : null}

        {screen === 'fixed' ? (
          <section className="split-layout">
            <div className="panel form-panel">
              <div className="section-head">
                <h2>{editingFixedExpenseId ? 'Sửa chi cố định' : 'Thêm chi cố định'}</h2>
                {editingFixedExpenseId ? <button className="ghost-button" onClick={resetFixedExpenseForm} type="button">Hủy sửa</button> : null}
              </div>
              <div className="form-grid two-cols">
                <label>Tên khoản chi<input value={fixedDraft.name} onChange={(event) => setFixedDraft((current) => ({ ...current, name: event.target.value }))} /></label>
                <label>Category<select value={fixedDraft.category_id} onChange={(event) => setFixedDraft((current) => ({ ...current, category_id: event.target.value }))}>
                  <option value="">Chọn category</option>
                  {fixedCategories.map((category) => <option key={category.id} value={category.id}>{category.icon} {category.name}</option>)}
                </select></label>
                <label>Số tiền<input inputMode="decimal" value={fixedDraft.amount} onChange={(event) => setFixedDraft((current) => ({ ...current, amount: event.target.value }))} /></label>
                <label>Tần suất<select value={fixedDraft.frequency} onChange={(event) => setFixedDraft((current) => ({ ...current, frequency: event.target.value as FixedFrequency }))}>
                  <option value="monthly">Hàng tháng</option><option value="weekly">Hàng tuần</option>
                </select></label>
                {fixedDraft.frequency === 'monthly' ? (
                  <label>Ngày trong tháng<input inputMode="numeric" min="1" max="31" value={fixedDraft.day_of_month} onChange={(event) => setFixedDraft((current) => ({ ...current, day_of_month: event.target.value }))} /></label>
                ) : (
                  <label>Thứ trong tuần<select value={fixedDraft.day_of_week} onChange={(event) => setFixedDraft((current) => ({ ...current, day_of_week: event.target.value }))}>
                    {weekDayLabels.map((label, index) => <option key={label} value={index}>{label}</option>)}
                  </select></label>
                )}
                <label>Bắt đầu từ<input type="date" value={fixedDraft.start_date} onChange={(event) => setFixedDraft((current) => ({ ...current, start_date: event.target.value }))} /></label>
                <label className="wide-field">Ghi chú<input value={fixedDraft.note} onChange={(event) => setFixedDraft((current) => ({ ...current, note: event.target.value }))} /></label>
                <label className="check-row"><input type="checkbox" checked={fixedDraft.is_active} onChange={(event) => setFixedDraft((current) => ({ ...current, is_active: event.target.checked }))} />Đang áp dụng</label>
              </div>
              <div className="form-actions"><button onClick={() => void saveFixedExpense()} type="button">{editingFixedExpenseId ? 'Cập nhật' : 'Lưu khoản chi'}</button></div>
            </div>

            <div className="panel">
              <div className="section-head"><h2>Danh sách chi cố định</h2><strong>{currency(monthlySummary.fixedExpense)}</strong></div>
              <div className="list">
                {fixedExpenses.filter((item) => item.profile_id === activeOwner).length === 0 ? <p className="empty-state">Chưa có khoản chi cố định.</p> : null}
                {fixedExpenses.filter((item) => item.profile_id === activeOwner).map((item) => {
                  const category = categoryLookup.get(item.category_id)
                  return (
                    <article className="list-row" key={item.id}>
                      <div className="row-main">
                        <span className="category-chip" style={{ backgroundColor: category?.color ?? '#e2e8f0' }}>{category?.icon ?? '•'}</span>
                        <div><strong>{item.name}</strong><p>{fixedFrequencyLabels[item.frequency]} · {item.frequency === 'monthly' ? `Ngày ${item.day_of_month}` : weekDayLabels[item.day_of_week ?? 1]} · {item.is_active ? 'Đang áp dụng' : 'Tạm dừng'}</p></div>
                      </div>
                      <div className="row-actions"><strong>{currency(item.amount)}</strong><button className="ghost-button" onClick={() => startEditFixedExpense(item)} type="button">Sửa</button><button className="danger-button" onClick={() => void removeFixedExpense(item.id)} type="button">Xóa</button></div>
                    </article>
                  )
                })}
              </div>
            </div>
          </section>
        ) : null}

        {screen === 'categories' ? (
          <section className="split-layout">
            <div className="panel form-panel">
              <div className="section-head"><h2>{editingCategoryId ? 'Sửa category' : 'Thêm category'}</h2>{editingCategoryId ? <button className="ghost-button" onClick={resetCategoryForm} type="button">Hủy sửa</button> : null}</div>
              <div className="form-grid two-cols">
                <label>Tên category<input value={categoryDraft.name} onChange={(event) => setCategoryDraft((current) => ({ ...current, name: event.target.value }))} /></label>
                <label>Nhóm<select value={categoryDraft.kind} onChange={(event) => setCategoryDraft((current) => ({ ...current, kind: event.target.value as CategoryKind }))}>{Object.entries(categoryKindLabels).map(([kind, label]) => <option key={kind} value={kind}>{label}</option>)}</select></label>
                <label>Màu<select value={categoryDraft.color} onChange={(event) => setCategoryDraft((current) => ({ ...current, color: event.target.value }))}>{colorOptions.map((color) => <option key={color.hex} value={color.hex}>{color.name}</option>)}</select></label>
                <label>Icon<select value={categoryDraft.icon} onChange={(event) => setCategoryDraft((current) => ({ ...current, icon: event.target.value }))}>{iconOptions.map((icon) => <option key={icon} value={icon}>{icon}</option>)}</select></label>
              </div>
              <div className="category-preview"><span className="category-chip large" style={{ backgroundColor: categoryDraft.color }}>{categoryDraft.icon}</span><strong>{categoryDraft.name || 'Tên category'}</strong><em>{categoryKindLabels[categoryDraft.kind]}</em></div>
              <div className="form-actions"><button onClick={() => void saveCategory()} type="button">{editingCategoryId ? 'Cập nhật' : 'Thêm category'}</button><button className="ghost-button" onClick={() => void seedDefaultCategories()} type="button">Nạp mặc định</button></div>
            </div>

            <div className="panel">
              <h2>Danh sách category</h2>
              <div className="table-wrap"><table><thead><tr><th>Nhóm</th><th>Tên</th><th>Màu</th><th>Mặc định</th><th>Thao tác</th></tr></thead><tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td>{categoryKindLabels[category.kind]}</td>
                    <td><span className="table-category"><span className="category-chip" style={{ backgroundColor: category.color }}>{category.icon}</span>{category.name}</span></td>
                    <td>{category.color}</td><td>{category.is_default ? 'Có' : 'Không'}</td>
                    <td><div className="table-actions"><button className="ghost-button" onClick={() => startEditCategory(category)} type="button">Sửa</button><button className="danger-button" onClick={() => void removeCategory(category.id)} type="button">Xóa</button></div></td>
                  </tr>
                ))}
              </tbody></table></div>
            </div>
          </section>
        ) : null}

        {showProfileForm ? (
          <div className="modal-overlay" onClick={() => setShowProfileForm(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="section-head">
                <h2>{editingProfileId ? 'Sửa profile' : 'Tạo profile mới'}</h2>
                <button className="ghost-button" onClick={() => setShowProfileForm(false)} type="button">Đóng</button>
              </div>
              <div className="form-grid two-cols">
                <label>
                  Tên profile
                  <input value={profileFormName} onChange={(event) => setProfileFormName(event.target.value)} placeholder="Ví dụ: Mẹ, Bố, Con..." />
                </label>
                <label>
                  Màu
                  <select value={profileFormColor} onChange={(event) => setProfileFormColor(event.target.value)}>
                    {colorOptions.map((color) => <option key={color.hex} value={color.hex}>{color.name}</option>)}
                  </select>
                </label>
              </div>
              <div className="profile-preview">
                <span className="profile-dot large" style={{ backgroundColor: profileFormColor }} />
                <strong>{profileFormName || 'Tên profile'}</strong>
              </div>
              <div className="form-actions">
                <button onClick={() => void saveProfile()} type="button">{editingProfileId ? 'Cập nhật' : 'Tạo profile'}</button>
              </div>
            </div>
          </div>
        ) : null}

      </main>
    </div>
  )
}

export default App

