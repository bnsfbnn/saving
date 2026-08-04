import type { Category, FixedExpense, FixedExpenseOverride, MonthlyBudget, Transaction } from '../types'

export type CalendarDay = {
  iso: string
  dayNumber: number
  inMonth: boolean
}

export type FixedOccurrence = {
  fixedExpense: FixedExpense
  date: string
  amount: number
  category_id: string
  profile_id: string
}

export type MonthlySummary = {
  startingAmount: number
  income: number
  variableExpense: number
  fixedExpense: number
  totalExpense: number
  remaining: number
}

export type CategoryBreakdown = {
  category: Category
  total: number
  percent: number
}

export function currency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

export function todayISO() {
  return formatISODate(new Date())
}

export function monthStartISO(value = todayISO()) {
  return `${value.slice(0, 7)}-01`
}

export function monthInputValue(monthStart: string) {
  return monthStart.slice(0, 7)
}

export function monthLabel(monthStart: string) {
  return new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(parseISODate(monthStart))
}

export function parseISODate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function formatISODate(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function daysInMonth(monthStart: string) {
  const date = parseISODate(monthStart)
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

export function isInMonth(date: string, monthStart: string) {
  return date.slice(0, 7) === monthStart.slice(0, 7)
}

export function buildCalendarDays(monthStart: string): CalendarDay[] {
  const start = parseISODate(monthStart)
  const firstCalendarDate = new Date(start)
  firstCalendarDate.setDate(start.getDate() - start.getDay())

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstCalendarDate)
    date.setDate(firstCalendarDate.getDate() + index)
    const iso = formatISODate(date)
    return {
      iso,
      dayNumber: date.getDate(),
      inMonth: isInMonth(iso, monthStart),
    }
  })
}

export function transactionsForProfileAndMonth(transactions: Transaction[], profileId: string, monthStart: string) {
  return transactions.filter((item) => item.profile_id === profileId && isInMonth(item.occurred_on, monthStart))
}

export function fixedOccurrencesForMonth(
  fixedExpenses: FixedExpense[],
  profileId: string,
  monthStart: string,
  overrides: FixedExpenseOverride[] = [],
) {
  const monthDate = parseISODate(monthStart)
  const lastDay = daysInMonth(monthStart)
  const occurrences: FixedOccurrence[] = []
  const overrideMap = new Map<string, FixedExpenseOverride>()

  overrides
    .filter((override) => override.profile_id === profileId && override.month_start === monthStart && override.is_active)
    .forEach((override) => {
      overrideMap.set(override.fixed_expense_id, override)
    })

  fixedExpenses
    .filter((item) => item.profile_id === profileId && item.is_active)
    .forEach((fixedExpense) => {
      const startDate = parseISODate(fixedExpense.start_date)
      const override = overrideMap.get(fixedExpense.id)
      const amount = override?.amount ?? fixedExpense.amount

      if (fixedExpense.frequency === 'monthly') {
        const day = Math.min(fixedExpense.day_of_month ?? startDate.getDate(), lastDay)
        const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day)
        if (date >= startDate) {
          occurrences.push({
            fixedExpense,
            date: formatISODate(date),
            amount,
            category_id: fixedExpense.category_id,
            profile_id: fixedExpense.profile_id,
          })
        }
        return
      }

      const dayOfWeek = fixedExpense.day_of_week ?? startDate.getDay()
      for (let day = 1; day <= lastDay; day += 1) {
        const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day)
        if (date >= startDate && date.getDay() === dayOfWeek) {
          occurrences.push({
            fixedExpense,
            date: formatISODate(date),
            amount,
            category_id: fixedExpense.category_id,
            profile_id: fixedExpense.profile_id,
          })
        }
      }
    })

  return occurrences.sort((a, b) => a.date.localeCompare(b.date))
}

export function calculateMonthlySummary(
  transactions: Transaction[],
  fixedExpenses: FixedExpense[],
  budget: MonthlyBudget | undefined,
  profileId: string,
  monthStart: string,
  overrides: FixedExpenseOverride[] = [],
): MonthlySummary {
  const monthTransactions = transactionsForProfileAndMonth(transactions, profileId, monthStart)
  const fixedOccurrences = fixedOccurrencesForMonth(fixedExpenses, profileId, monthStart, overrides)
  const income = sum(monthTransactions.filter((item) => item.type === 'income').map((item) => item.amount))
  const variableExpense = sum(monthTransactions.filter((item) => item.type === 'expense').map((item) => item.amount))
  const fixedExpense = sum(fixedOccurrences.map((item) => item.amount))
  const startingAmount = budget?.starting_amount ?? 0
  const totalExpense = variableExpense + fixedExpense

  return {
    startingAmount,
    income,
    variableExpense,
    fixedExpense,
    totalExpense,
    remaining: startingAmount + income - totalExpense,
  }
}

export function buildCategoryBreakdown(
  categories: Category[],
  transactions: Transaction[],
  fixedExpenses: FixedExpense[],
  profileId: string,
  monthStart: string,
  overrides: FixedExpenseOverride[] = [],
): CategoryBreakdown[] {
  const expenseByCategory = new Map<string, number>()
  const monthTransactions = transactionsForProfileAndMonth(transactions, profileId, monthStart).filter((item) => item.type === 'expense')
  const fixedOccurrences = fixedOccurrencesForMonth(fixedExpenses, profileId, monthStart, overrides)

  monthTransactions.forEach((transaction) => {
    expenseByCategory.set(transaction.category_id, (expenseByCategory.get(transaction.category_id) ?? 0) + transaction.amount)
  })

  fixedOccurrences.forEach((occurrence) => {
    expenseByCategory.set(occurrence.category_id, (expenseByCategory.get(occurrence.category_id) ?? 0) + occurrence.amount)
  })

  const total = sum([...expenseByCategory.values()])
  if (total === 0) return []

  return [...expenseByCategory.entries()]
    .map(([categoryId, categoryTotal]) => {
      const category = categories.find((item) => item.id === categoryId)
      if (!category) return null
      return {
        category,
        total: categoryTotal,
        percent: Math.round((categoryTotal / total) * 100),
      }
    })
    .filter((item): item is CategoryBreakdown => item !== null)
    .sort((a, b) => b.total - a.total)
}

export function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0)
}
