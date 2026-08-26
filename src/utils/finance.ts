import type { Category, FixedExpense, FixedExpenseOverride, MonthlyBudget, Transaction } from '../types'
import { daysInMonth, formatISODate, isInMonth, parseISODate } from './dates'
import { sum } from './money'

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Queries ───────────────────────────────────────────────────────────────────

/** Get transactions for a profile within a given month. */
export function transactionsForProfileAndMonth(
  transactions: Transaction[],
  profileId: string,
  monthStart: string,
): Transaction[] {
  return transactions.filter((item) => item.profile_id === profileId && isInMonth(item.occurred_on, monthStart))
}

/** Compute all fixed-expense occurrences for a profile in a given month. */
export function fixedOccurrencesForMonth(
  fixedExpenses: FixedExpense[],
  profileId: string,
  monthStart: string,
  overrides: FixedExpenseOverride[] = [],
): FixedOccurrence[] {
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

// ── Summaries ─────────────────────────────────────────────────────────────────

/** Calculate the monthly financial summary for a profile. */
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

/** Build expense breakdown by category for a month. */
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
