import { useEffect, useMemo, useState } from 'react'
import type {
  Category,
  CategoryDraft,
  CategoryKind,
  FixedExpense,
  FixedExpenseDraft,
  MonthlyBudget,
  Profile,
  Screen,
  Transaction,
  TransactionDraft,
  TransactionType,
} from '../types'
import { colorOptions, iconOptions } from '../data/defaults'
import { monthStartISO, todayISO, buildCalendarDays } from '../utils/dates'
import { parseAmount, sum } from '../utils/money'
import {
  buildCategoryBreakdown,
  calculateMonthlySummary,
  fixedOccurrencesForMonth,
  monthStartsUpTo,
  startingAmountForMonth,
  transactionsForProfileAndMonth,
} from '../utils/finance'
import { loadAppData } from '../repositories/appData'
import { createTransaction, deleteTransaction, updateTransaction } from '../repositories/transactions'
import { createCategory, deleteCategory, seedDefaultCategories, updateCategory } from '../repositories/categories'
import { createFixedExpense, deleteFixedExpense, updateFixedExpense } from '../repositories/fixedExpenses'
import { updateOpeningBalance } from '../repositories/profiles'

const defaultProfile: Profile = {
  id: 'default',
  name: 'Default',
  color: '#2563eb',
  accent: '#2563eb',
  soft_accent: '#dbeafe',
  opening_balance: 0,
  created_at: '',
}

const emptyCategoryDraft: CategoryDraft = {
  name: '',
  kind: 'expense',
  color: colorOptions[0].hex,
  icon: iconOptions[0],
}

function createTransactionDraft(date = todayISO()): TransactionDraft {
  return { type: 'expense', category_id: '', amount: '', occurred_on: date, note: '' }
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

/** Central hook: owns all app data, derived values, and CRUD actions. */
export function useFinanceData(isAuthenticated: boolean) {
  // UI state
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [activeOwner, setActiveOwner] = useState('default')
  const [selectedMonth, setSelectedMonth] = useState(monthStartISO())
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  // Data state
  const [profiles, setProfiles] = useState<Profile[]>([defaultProfile])
  const [openingBalanceInput, setOpeningBalanceInput] = useState('0')
  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([])
  const [monthlyBudgets, setMonthlyBudgets] = useState<MonthlyBudget[]>([])

  // Form state
  const [transactionDraft, setTransactionDraft] = useState<TransactionDraft>(() => createTransactionDraft())
  const [editingTransactionId, setEditingTransactionId] = useState('')
  const [categoryDraft, setCategoryDraft] = useState<CategoryDraft>(emptyCategoryDraft)
  const [editingCategoryId, setEditingCategoryId] = useState('')
  const [fixedDraft, setFixedDraft] = useState<FixedExpenseDraft>(() => createFixedExpenseDraft())
  const [editingFixedExpenseId, setEditingFixedExpenseId] = useState('')

  // Derived values
  const activeProfile = useMemo(
    () => profiles.find((profile) => profile.id === activeOwner) ?? defaultProfile,
    [activeOwner, profiles],
  )

  const categoryLookup = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories])
  const incomeCategories = useMemo(() => categories.filter((category) => category.kind === 'income'), [categories])
  const expenseCategories = useMemo(() => categories.filter((category) => category.kind === 'expense'), [categories])
  const fixedCategories = useMemo(() => categories.filter((category) => category.kind === 'fixed_expense'), [categories])
  const transactionCategoryOptions = transactionDraft.type === 'income' ? incomeCategories : expenseCategories

  const activeMonthlyBudget = useMemo(
    () => monthlyBudgets.find((budget) => budget.profile_id === activeOwner && budget.month_start === selectedMonth),
    [activeOwner, monthlyBudgets, selectedMonth],
  )

  // Chi hien input neu CHUA nhap so du ban dau (opening_balance con null)
  const hasOpeningBalance = activeProfile.opening_balance != null

  const totalVariableExpenseAllTime = useMemo(
    () => sum(transactions.filter((t) => t.profile_id === activeOwner && t.type === 'expense').map((t) => t.amount)),
    [activeOwner, transactions],
  )

  const totalIncomeAllTime = useMemo(
    () => sum(transactions.filter((t) => t.profile_id === activeOwner && t.type === 'income').map((t) => t.amount)),
    [activeOwner, transactions],
  )

  const totalFixedExpenseAllTime = useMemo(() => {
    return monthStartsUpTo(transactions, fixedExpenses, activeOwner, selectedMonth).reduce((acc, month) => {
      const occurrences = fixedOccurrencesForMonth(fixedExpenses, activeOwner, month)
      return acc + sum(occurrences.map((o) => o.amount))
    }, 0)
  }, [activeOwner, fixedExpenses, selectedMonth, transactions])

  // Tai khoan chinh = So khoi dau + Tong (Thu - Chi - Chi co dinh) tat ca cac thang
  const mainBalance = useMemo(() => {
    const opening = activeProfile.opening_balance ?? 0
    const ownerTransactions = transactions.filter((t) => t.profile_id === activeOwner)
    const totalIncome = sum(ownerTransactions.filter((t) => t.type === 'income').map((t) => t.amount))

    return opening + totalIncome - totalVariableExpenseAllTime - totalFixedExpenseAllTime
  }, [activeOwner, activeProfile.opening_balance, totalFixedExpenseAllTime, totalVariableExpenseAllTime, transactions])

  // So tien dau thang: uu tien gia tri nhap tay trong monthly_budgets,
  // neu khong co thi tinh tu du lieu (so du cuoi thang truoc)
  const startingAmount = useMemo(
    () =>
      activeMonthlyBudget?.starting_amount ??
      startingAmountForMonth(activeProfile.opening_balance ?? 0, transactions, fixedExpenses, activeOwner, selectedMonth),
    [activeMonthlyBudget?.starting_amount, activeOwner, activeProfile.opening_balance, fixedExpenses, selectedMonth, transactions],
  )

  const monthlySummary = useMemo(
    () => calculateMonthlySummary(transactions, fixedExpenses, startingAmount, activeOwner, selectedMonth),
    [activeOwner, fixedExpenses, selectedMonth, startingAmount, transactions],
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

  const profileMonthlyBudgets = useMemo(
    () => monthlyBudgets.filter((budget) => budget.profile_id === activeOwner),
    [activeOwner, monthlyBudgets],
  )

  const profileFixedExpenses = useMemo(
    () => fixedExpenses.filter((item) => item.profile_id === activeOwner),
    [activeOwner, fixedExpenses],
  )

  // Effects
  useEffect(() => {
    if (!isAuthenticated) return
    void refreshData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  useEffect(() => {
    setOpeningBalanceInput(String(activeProfile.opening_balance ?? 0))
  }, [activeProfile.opening_balance])

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

  // Data loading
  async function refreshData() {
    setLoading(true)
    const result = await loadAppData()
    setProfiles(result.data.profiles)
    setCategories(result.data.categories)
    setTransactions(result.data.transactions)
    setFixedExpenses(result.data.fixedExpenses)
    setMonthlyBudgets(result.data.monthlyBudgets)
    setActiveOwner(result.data.profileId)
    setMessage(result.message)
    setLoading(false)
  }

  // Form helpers
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

  // CRUD: opening balance (luu tren bang profiles)
  async function saveOpeningBalance() {
    const openingBalance = parseAmount(openingBalanceInput)
    if (!Number.isFinite(openingBalance)) return setMessage('Số dư khởi tạo không hợp lệ.')

    const { data, error } = await updateOpeningBalance(activeOwner, openingBalance)
    if (error) return setMessage(error)

    setProfiles((current) => current.map((p) => (p.id === activeOwner ? (data as Profile) : p)))
    setMessage('Đã cập nhật tài khoản chính.')
  }

  // CRUD: transactions
  async function saveTransaction(typeOverride?: TransactionType) {
    const transactionType = typeOverride ?? transactionDraft.type
    const amount = parseAmount(transactionDraft.amount)
    const allowedCategories = transactionType === 'income' ? incomeCategories : expenseCategories
    const selectedCategory = categoryLookup.get(transactionDraft.category_id)
    const expectedKind: CategoryKind = transactionType === 'income' ? 'income' : 'expense'
    const categoryId = selectedCategory?.kind === expectedKind ? transactionDraft.category_id : allowedCategories[0]?.id

    if (!categoryId) return setMessage('Chưa có category phù hợp để lưu giao dịch.')
    if (!Number.isFinite(amount) || amount <= 0) return setMessage('Số tiền phải lớn hơn 0.')

    const payload = {
      profile_id: activeOwner,
      type: transactionType,
      category_id: categoryId,
      amount,
      occurred_on: transactionDraft.occurred_on,
      note: transactionDraft.note.trim(),
    }

    if (editingTransactionId) {
      const { data, error } = await updateTransaction(editingTransactionId, payload)
      if (error) return setMessage(error)
      setTransactions((current) => current.map((item) => (item.id === editingTransactionId ? (data as Transaction) : item)))
      resetTransactionForm(transactionDraft.occurred_on)
      return setMessage('Đã cập nhật giao dịch.')
    }

    const { data, error } = await createTransaction(payload)
    if (error) return setMessage(error)
    setTransactions((current) => [data as Transaction, ...current])
    resetTransactionForm(transactionDraft.occurred_on)
    setMessage(transactionType === 'income' ? 'Đã lưu khoản thu.' : 'Đã lưu khoản chi.')
  }

  async function removeTransaction(id: string) {
    const { error } = await deleteTransaction(id)
    if (error) return setMessage(error)
    setTransactions((current) => current.filter((item) => item.id !== id))
    if (editingTransactionId === id) resetTransactionForm()
    setMessage('Đã xóa giao dịch.')
  }

  // CRUD: categories
  async function saveCategory() {
    const name = categoryDraft.name.trim()
    if (!name) return setMessage('Tên category không được để trống.')

    const draft = { ...categoryDraft, name }

    if (editingCategoryId) {
      const { data, error } = await updateCategory(editingCategoryId, draft)
      if (error) return setMessage(error)
      setCategories((current) => current.map((item) => (item.id === editingCategoryId ? (data as Category) : item)))
      resetCategoryForm()
      return setMessage('Đã cập nhật category.')
    }

    const { data, error } = await createCategory(draft)
    if (error) return setMessage(error)
    setCategories((current) => [...current, data as Category].sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name)))
    resetCategoryForm()
    setMessage('Đã tạo category.')
  }

  async function seedDefaults() {
    const { data, error } = await seedDefaultCategories(categories)
    if (error) return setMessage(error)
    if (!data || data.length === 0) return setMessage('Category mặc định đã có đủ.')
    setCategories((current) => [...current, ...data].sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name)))
    setMessage('Đã nạp category mặc định.')
  }

  async function removeCategory(id: string) {
    const { error } = await deleteCategory(id)
    if (error) return setMessage(error)
    setCategories((current) => current.filter((item) => item.id !== id))
    if (editingCategoryId === id) resetCategoryForm()
    setMessage('Đã xóa category.')
  }

  // CRUD: fixed expenses
  async function saveFixedExpense() {
    const amount = parseAmount(fixedDraft.amount)
    const dayOfMonth = Number(fixedDraft.day_of_month)
    const dayOfWeek = Number(fixedDraft.day_of_week)
    if (!fixedDraft.name.trim()) return setMessage('Tên khoản chi cố định không được để trống.')
    if (!fixedDraft.category_id) return setMessage('Chưa chọn category chi cố định.')
    if (!Number.isFinite(amount) || amount <= 0) return setMessage('Số tiền phải lớn hơn 0.')
    if (fixedDraft.frequency === 'monthly' && (dayOfMonth < 1 || dayOfMonth > 31)) return setMessage('Ngày hàng tháng phải từ 1 đến 31.')
    if (fixedDraft.frequency === 'weekly' && (dayOfWeek < 0 || dayOfWeek > 6)) return setMessage('Thứ hàng tuần không hợp lệ.')

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
      const { data, error } = await updateFixedExpense(editingFixedExpenseId, payload)
      if (error) return setMessage(error)
      setFixedExpenses((current) => current.map((item) => (item.id === editingFixedExpenseId ? (data as FixedExpense) : item)))
      resetFixedExpenseForm()
      return setMessage('Đã cập nhật khoản chi cố định.')
    }

    const { data, error } = await createFixedExpense(payload)
    if (error) return setMessage(error)
    setFixedExpenses((current) => [data as FixedExpense, ...current])
    resetFixedExpenseForm()
    setMessage('Đã tạo khoản chi cố định.')
  }

  async function removeFixedExpense(id: string) {
    const { error } = await deleteFixedExpense(id)
    if (error) return setMessage(error)
    setFixedExpenses((current) => current.filter((item) => item.id !== id))
    if (editingFixedExpenseId === id) resetFixedExpenseForm()
    setMessage('Đã xóa khoản chi cố định.')
  }

  return {
    // UI state
    screen,
    setScreen,
    activeOwner,
    selectedMonth,
    setSelectedMonth,
    loading,
    message,

    // Data
    profiles,
    activeProfile,
    hasOpeningBalance,
    openingBalanceInput,
    setOpeningBalanceInput,
    categories,
    categoryLookup,
    incomeCategories,
    expenseCategories,
    fixedCategories,
    transactions,
    profileFixedExpenses,
    profileMonthlyBudgets,

    // Derived
    mainBalance,
    totalIncomeAllTime,
    totalVariableExpenseAllTime,
    totalFixedExpenseAllTime,
    monthlySummary,
    monthTransactions,
    monthFixedOccurrences,
    categoryBreakdown,
    calendarDays,

    // Transaction form
    transactionDraft,
    setTransactionDraft,
    editingTransactionId,
    saveTransaction,
    removeTransaction,
    startEditTransaction,
    resetTransactionForm,
    prepareExpenseForDate,

    // Category form
    categoryDraft,
    setCategoryDraft,
    editingCategoryId,
    saveCategory,
    removeCategory,
    startEditCategory,
    resetCategoryForm,
    seedDefaults,

    // Fixed expense form
    fixedDraft,
    setFixedDraft,
    editingFixedExpenseId,
    saveFixedExpense,
    removeFixedExpense,
    startEditFixedExpense,
    resetFixedExpenseForm,

    // Account settings
    saveOpeningBalance,
  }
}

export type FinanceData = ReturnType<typeof useFinanceData>
