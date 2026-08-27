import type { FinanceData } from '../../hooks/useFinanceData'
import { AccountInitPanel } from './AccountInitPanel'
import { AccountHeroCard } from './AccountHeroCard'
import { MonthlyMetrics } from './MonthlyMetrics'
import { CategoryBreakdownChart } from './CategoryBreakdownChart'
import { FixedMonthPanel } from './FixedMonthPanel'

type DashboardScreenProps = {
  data: FinanceData
}

export function DashboardScreen({ data }: DashboardScreenProps) {
  const {
    loading,
    hasOpeningBalance,
    activeProfile,
    openingBalanceInput,
    setOpeningBalanceInput,
    saveOpeningBalance,
    mainBalance,
    totalIncomeAllTime,
    totalVariableExpenseAllTime,
    totalFixedExpenseAllTime,
    monthlySummary,
    categoryBreakdown,
    monthFixedOccurrences,
    categoryLookup,
    selectedMonth,
  } = data

  return (
    <>
      {/* Account initialization prompt - chi hien khi CHUA co tai khoan */}
      {!hasOpeningBalance && !loading ? (
        <AccountInitPanel
          openingBalanceInput={openingBalanceInput}
          onInputChange={setOpeningBalanceInput}
          onSubmit={() => void saveOpeningBalance()}
        />
      ) : null}

      {/* Account Hero Card - hien khi DA CO tai khoan */}
      {hasOpeningBalance ? (
        <AccountHeroCard
          activeProfile={activeProfile}
          mainBalance={mainBalance}
          totalIncomeAllTime={totalIncomeAllTime}
          totalExpenseAllTime={totalVariableExpenseAllTime + totalFixedExpenseAllTime}
        />
      ) : null}

      <MonthlyMetrics summary={monthlySummary} />

      {/* Breakdown chi + Chi co dinh */}
      <section className="dashboard-grid">
        <CategoryBreakdownChart
          breakdown={categoryBreakdown}
          totalExpense={monthlySummary.totalExpense}
          selectedMonth={selectedMonth}
        />

        <FixedMonthPanel
          occurrences={monthFixedOccurrences}
          fixedExpenseTotal={monthlySummary.fixedExpense}
          categoryLookup={categoryLookup}
        />
      </section>
    </>
  )
}
